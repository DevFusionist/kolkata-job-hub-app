import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useLanguage } from './_contexts/LanguageContext';
import { useTheme } from './_contexts/ThemeContext';
import { GlassCard } from './_components/GlassCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from './_theme';

type Step = 'review' | 'details' | 'preview';

interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  achievements: string[];
}

interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export default function ResumeBuilderScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Step state
  const [step, setStep] = useState<Step>('review');

  // Step 1: Review info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [languages, setLanguages] = useState<string[]>(user?.languages || ['Bengali', 'Hindi', 'English']);

  // Step 2: Details
  const [experience, setExperience] = useState<ExperienceEntry[]>([
    { title: '', company: '', duration: '', achievements: [''] },
  ]);
  const [education, setEducation] = useState<EducationEntry[]>([
    { degree: '', institution: '', year: '' },
  ]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Step 3: Preview
  const [generating, setGenerating] = useState(false);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [savedToProfile, setSavedToProfile] = useState(false);

  // Hydrate user info on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setLocation(user.location || '');
      setSkills(user.skills || []);
      setLanguages(user.languages || ['Bengali', 'Hindi', 'English']);
    }
  }, [user]);

  const addSkill = useCallback(() => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s]);
    }
    setNewSkill('');
  }, [newSkill, skills]);

  const removeSkill = useCallback((skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const handleGenerateResume = useCallback(async () => {
    setGenerating(true);
    setSavedToProfile(false);
    try {
      const portfolioText = [
        additionalInfo,
        ...experience.map((e) =>
          `${e.title} at ${e.company} (${e.duration}): ${e.achievements.filter(Boolean).join('. ')}`
        ),
      ].filter(Boolean).join('\n');

      const { data } = await api.post('/portfolios/build-resume', {
        name,
        phone,
        location,
        skills,
        languages,
        experience: experience[0]?.title ? 
          (experience[0].duration || user?.aiExtracted?.experience || 'Fresher') : 
          (user?.aiExtracted?.experience || 'Fresher'),
        portfolioText,
      });

      if (data.html) {
        setResumeHtml(data.html);
      }
      if (data.generatedResumeUrl) {
        setResumeUrl(data.generatedResumeUrl);
      }
      setStep('preview');
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err.response?.data?.detail || err.message || 'Resume generation failed',
      );
    } finally {
      setGenerating(false);
    }
  }, [name, phone, location, skills, languages, experience, additionalInfo, user]);

  const handleShare = useCallback(async () => {
    if (!resumeHtml) return;
    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available on this device');
        return;
      }

      const file = new File(Paths.cache, `resume_${Date.now()}.html`);
      file.write(resumeHtml);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/html',
        dialogTitle: 'Share Resume',
      });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || 'Sharing failed');
    } finally {
      setSharing(false);
    }
  }, [resumeHtml]);

  const handleSaveToProfile = useCallback(() => {
    if (!resumeUrl) {
      Alert.alert(
        t('common.error'),
        t('resume.noResumeUrl') || 'Resume PDF could not be saved. Please try regenerating.',
      );
      return;
    }
    setSavedToProfile(true);
    Alert.alert(
      t('common.success'),
      t('resume.savedToProfile') || 'Your AI resume has been saved to your profile! Employers can now view it.',
      [
        {
          text: t('resume.stayHere') || 'Stay Here',
          style: 'cancel',
        },
        {
          text: t('resume.goToProfile') || 'Go to Profile',
          onPress: () => router.replace('/(tabs)/profile'),
        },
      ],
    );
  }, [resumeUrl, router]);

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: any) => {
    setExperience((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const addExperience = () => {
    setExperience((prev) => [...prev, { title: '', company: '', duration: '', achievements: [''] }]);
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setEducation((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const stepLabels = {
    review: t('resume.stepReview') || 'Review Info',
    details: t('resume.stepDetails') || 'Add Details',
    preview: t('resume.stepPreview') || 'Preview',
  };

  const stepNumber = step === 'review' ? 1 : step === 'details' ? 2 : 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor={colors.text}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            {t('resume.title') || 'AI Resume Builder'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {(['review', 'details', 'preview'] as Step[]).map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  stepNumber > i && styles.stepCircleActive,
                  step === s && styles.stepCircleCurrent,
                ]}
              >
                <Text style={[
                  styles.stepNum,
                  (stepNumber > i || step === s) && styles.stepNumActive,
                ]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                {stepLabels[s]}
              </Text>
            </View>
          ))}
        </View>

        <ProgressBar
          progress={stepNumber / 3}
          color={colors.terracotta}
          style={styles.progressBar}
        />

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* STEP 1: Review Your Info */}
          {step === 'review' && (
            <View>
              <GlassCard style={styles.card}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  <MaterialCommunityIcons name="account-check" size={20} color={colors.terracotta} />
                  {'  '}{t('resume.reviewTitle') || 'Your Information'}
                </Text>
                <Text variant="bodySmall" style={styles.hint}>
                  {t('resume.reviewHint') || 'Review and edit your details before generating'}
                </Text>

                <TextInput
                  label={t('resume.name') || 'Full Name'}
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  textColor={colors.text}
                  mode="outlined"
                />
                <TextInput
                  label={t('resume.phone') || 'Phone'}
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  textColor={colors.text}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
                <TextInput
                  label={t('resume.location') || 'Location'}
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  textColor={colors.text}
                  mode="outlined"
                />
              </GlassCard>

              <GlassCard style={styles.card}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {t('resume.skills') || 'Skills'}
                </Text>
                <View style={styles.chipContainer}>
                  {skills.map((skill) => (
                    <Chip
                      key={skill}
                      onClose={() => removeSkill(skill)}
                      style={styles.chip}
                      textStyle={{ color: colors.text }}
                    >
                      {skill}
                    </Chip>
                  ))}
                </View>
                <View style={styles.addSkillRow}>
                  <TextInput
                    value={newSkill}
                    onChangeText={setNewSkill}
                    placeholder={t('resume.addSkill') || 'Add skill...'}
                    style={styles.addSkillInput}
                    textColor={colors.text}
                    mode="outlined"
                    dense
                    onSubmitEditing={addSkill}
                  />
                  <IconButton
                    icon="plus-circle"
                    size={28}
                    iconColor={colors.terracotta}
                    onPress={addSkill}
                  />
                </View>
              </GlassCard>

              <Button
                mode="contained"
                onPress={() => setStep('details')}
                style={styles.nextButton}
                icon="arrow-right"
                contentStyle={styles.nextButtonContent}
              >
                {t('resume.next') || 'Next: Add Details'}
              </Button>
            </View>
          )}

          {/* STEP 2: Add Details */}
          {step === 'details' && (
            <View>
              <GlassCard style={styles.card}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  <MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.terracotta} />
                  {'  '}{t('resume.experience') || 'Work Experience'}
                </Text>
                <Text variant="bodySmall" style={styles.hint}>
                  {t('resume.experienceHint') || 'Add your work experience (optional for freshers)'}
                </Text>

                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.entryBlock}>
                    <TextInput
                      label={t('resume.jobTitle') || 'Job Title'}
                      value={exp.title}
                      onChangeText={(v) => updateExperience(idx, 'title', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                    />
                    <TextInput
                      label={t('resume.company') || 'Company / Employer'}
                      value={exp.company}
                      onChangeText={(v) => updateExperience(idx, 'company', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                    />
                    <TextInput
                      label={t('resume.duration') || 'Duration (e.g., 2 years)'}
                      value={exp.duration}
                      onChangeText={(v) => updateExperience(idx, 'duration', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                    />
                    <TextInput
                      label={t('resume.achievements') || 'Key achievements (one per line)'}
                      value={exp.achievements.join('\n')}
                      onChangeText={(v) => updateExperience(idx, 'achievements', v.split('\n'))}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      dense
                    />
                  </View>
                ))}

                <Button
                  mode="text"
                  onPress={addExperience}
                  icon="plus"
                  textColor={colors.terracotta}
                  compact
                >
                  {t('resume.addMore') || 'Add Another'}
                </Button>
              </GlassCard>

              <GlassCard style={styles.card}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  <MaterialCommunityIcons name="school-outline" size={20} color={colors.terracotta} />
                  {'  '}{t('resume.education') || 'Education'}
                </Text>

                {education.map((edu, idx) => (
                  <View key={idx} style={styles.entryBlock}>
                    <TextInput
                      label={t('resume.degree') || 'Degree / Qualification'}
                      value={edu.degree}
                      onChangeText={(v) => updateEducation(idx, 'degree', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                    />
                    <TextInput
                      label={t('resume.institution') || 'School / Institution'}
                      value={edu.institution}
                      onChangeText={(v) => updateEducation(idx, 'institution', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                    />
                    <TextInput
                      label={t('resume.year') || 'Year'}
                      value={edu.year}
                      onChangeText={(v) => updateEducation(idx, 'year', v)}
                      style={styles.input}
                      textColor={colors.text}
                      mode="outlined"
                      dense
                      keyboardType="numeric"
                    />
                  </View>
                ))}
              </GlassCard>

              <GlassCard style={styles.card}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {t('resume.additional') || 'Additional Info'}
                </Text>
                <TextInput
                  label={t('resume.additionalHint') || 'Anything else the AI should know?'}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  style={styles.input}
                  textColor={colors.text}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                />
              </GlassCard>

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => setStep('review')}
                  style={styles.backButton}
                  icon="arrow-left"
                  textColor={colors.text}
                >
                  {t('resume.back') || 'Back'}
                </Button>
                <Button
                  mode="contained"
                  onPress={handleGenerateResume}
                  loading={generating}
                  disabled={generating}
                  style={styles.generateButton}
                  icon="robot"
                >
                  {generating
                    ? (t('resume.generating') || 'Generating...')
                    : (t('resume.generate') || 'Generate Resume')}
                </Button>
              </View>
            </View>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <View>
              {resumeHtml ? (
                <View style={styles.previewContainer}>
                  <GlassCard style={styles.previewCard}>
                    <WebView
                      originWhitelist={['*']}
                      source={{ html: resumeHtml }}
                      style={styles.webview}
                      scrollEnabled={true}
                      scalesPageToFit={true}
                    />
                  </GlassCard>

                  <View style={styles.buttonRow}>
                    <Button
                      mode="outlined"
                      onPress={() => setStep('details')}
                      style={styles.backButton}
                      icon="arrow-left"
                      textColor={colors.text}
                    >
                      {t('resume.editAgain') || 'Edit'}
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleShare}
                      loading={sharing}
                      disabled={sharing}
                      style={styles.shareButton}
                      icon="share-variant"
                    >
                      {t('resume.share') || 'Share'}
                    </Button>
                  </View>

                  <Button
                    mode="contained"
                    onPress={handleSaveToProfile}
                    disabled={savedToProfile || !resumeUrl}
                    style={[
                      styles.saveToProfileButton,
                      savedToProfile && styles.savedButton,
                    ]}
                    icon={savedToProfile ? 'check-circle' : 'content-save'}
                  >
                    {savedToProfile
                      ? (t('resume.saved') || 'Saved to Profile')
                      : (t('resume.saveToProfile') || 'Save to Profile')}
                  </Button>

                  <Button
                    mode="contained"
                    onPress={handleGenerateResume}
                    loading={generating}
                    disabled={generating}
                    style={styles.regenerateButton}
                    icon="refresh"
                  >
                    {t('resume.regenerate') || 'Regenerate'}
                  </Button>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.terracotta} />
                  <Text style={styles.loadingText}>
                    {t('resume.generatingResume') || 'Creating your ATS-optimized resume...'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const screenHeight = Dimensions.get('window').height;
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 20,
    },
    stepItem: { alignItems: 'center', gap: 4 },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepCircleActive: {
      backgroundColor: colors.terracotta,
      borderColor: colors.terracotta,
    },
    stepCircleCurrent: {
      borderColor: colors.terracotta,
      borderWidth: 2.5,
    },
    stepNum: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary },
    stepNumActive: { color: '#fff' },
    stepLabel: { fontSize: 10, color: colors.textSecondary },
    stepLabelActive: { color: colors.terracotta, fontWeight: '600' },
    progressBar: { marginHorizontal: 16 },
    content: { flex: 1, padding: 16, paddingBottom: 40 },
    card: { marginBottom: 16 },
    cardTitle: { color: colors.text, fontWeight: 'bold', marginBottom: 4 },
    hint: { color: colors.textSecondary, marginBottom: 12 },
    input: { marginBottom: 10, backgroundColor: 'transparent' },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    chip: { marginBottom: 2 },
    addSkillRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addSkillInput: { flex: 1, backgroundColor: 'transparent' },
    nextButton: {
      backgroundColor: colors.terracotta,
      borderRadius: 8,
      marginBottom: 24,
    },
    nextButtonContent: { flexDirection: 'row-reverse' },
    entryBlock: {
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    backButton: {
      flex: 1,
      borderColor: colors.border,
      borderRadius: 8,
    },
    generateButton: {
      flex: 2,
      backgroundColor: colors.terracotta,
      borderRadius: 8,
    },
    previewContainer: { marginBottom: 24 },
    previewCard: {
      padding: 0,
      overflow: 'hidden',
      borderRadius: 8,
    },
    webview: {
      height: screenHeight * 0.55,
      backgroundColor: '#fff',
    },
    shareButton: {
      flex: 2,
      backgroundColor: colors.terracotta,
      borderRadius: 8,
    },
    saveToProfileButton: {
      backgroundColor: '#2563EB',
      borderRadius: 8,
      marginBottom: 10,
    },
    savedButton: {
      backgroundColor: '#16A34A',
    },
    regenerateButton: {
      backgroundColor: isDark ? colors.surface : '#EDE9DA',
      borderRadius: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: 16,
    },
    loadingText: {
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
