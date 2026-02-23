import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Text,
  Button,
  Chip,
  ProgressBar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useLanguage } from './_contexts/LanguageContext';
import { useTheme } from './_contexts/ThemeContext';
import { GlassCard } from './_components/GlassCard';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from './_design';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from './_theme';

type Step = 'audit' | 'career_goal' | 'skills' | 'experience' | 'results';

interface AuditResult {
  profileScore: number;
  hireScore: number;
  trustScore: number;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  hiringProbability: number;
  salaryPotential: string;
  recommendations: string[];
}

interface SkillSuggestion {
  skill: string;
  salaryImpact: string;
  demandLevel: string;
  reason: string;
}

interface ExperienceRewrite {
  original: string;
  rewritten: string;
  improvements: string[];
  targetRole: string;
}

const CAREER_GOALS = [
  { key: 'Sales', icon: 'phone-in-talk' as const, label: 'Sales' },
  { key: 'Office Work', icon: 'desktop-classic' as const, label: 'Office' },
  { key: 'Delivery', icon: 'truck-delivery' as const, label: 'Delivery' },
  { key: 'Customer Service', icon: 'headset' as const, label: 'Customer Service' },
  { key: 'Retail', icon: 'store' as const, label: 'Retail' },
  { key: 'Driver', icon: 'car' as const, label: 'Driver' },
  { key: 'Hospitality', icon: 'food' as const, label: 'Hospitality' },
  { key: 'Security', icon: 'shield-account' as const, label: 'Security' },
  { key: 'Warehouse', icon: 'warehouse' as const, label: 'Warehouse' },
  { key: 'Construction', icon: 'hammer-wrench' as const, label: 'Construction' },
];

const WORK_TYPES = [
  { key: 'office', icon: 'office-building' as const, label: 'Office' },
  { key: 'field', icon: 'walk' as const, label: 'Field work' },
  { key: 'remote', icon: 'home' as const, label: 'Remote' },
  { key: 'hybrid', icon: 'swap-horizontal' as const, label: 'Hybrid' },
];

export default function AiCopilotScreen() {
  const { user, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [step, setStep] = useState<Step>('audit');
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [selectedGoal, setSelectedGoal] = useState(user?.careerGoal || '');
  const [selectedWorkType, setSelectedWorkType] = useState(user?.workType || '');
  const [suggestedSkills, setSuggestedSkills] = useState<SkillSuggestion[]>([]);
  const [addingSkill, setAddingSkill] = useState<string | null>(null);
  const [experienceRewrite, setExperienceRewrite] = useState<ExperienceRewrite | null>(null);
  const [finalScores, setFinalScores] = useState<{ profileScore: number; hireScore: number; newJobsUnlocked: number } | null>(null);
  const [initialHireScore] = useState(user?.hireScore || 0);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/copilot/audit');
      setAudit(data);
      if (user) {
        await updateUser({ ...user, hireScore: data.hireScore, trustScore: data.trustScore, profileScore: data.profileScore });
      }
    } catch (err: any) {
      if (err.response?.status === 402) {
        Alert.alert(t('copilot.creditsNeeded') || 'AI credits needed', t('copilot.addCredits') || 'Add AI credits to use Career Copilot.');
        router.back();
        return;
      }
      Alert.alert(t('common.error'), 'Failed to audit profile');
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, t, router]);

  const saveCareerIntent = useCallback(async () => {
    if (!selectedGoal) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/copilot/career-intent', {
        careerGoal: selectedGoal,
        workType: selectedWorkType,
      });
      if (user) {
        await updateUser({ ...user, careerGoal: selectedGoal, workType: selectedWorkType as any, profileScore: data.scores?.profileScore, hireScore: data.scores?.hireScore });
      }
      setStep('skills');
      fetchSkillSuggestions();
    } catch {
      Alert.alert(t('common.error'), 'Failed to save career goal');
    } finally {
      setLoading(false);
    }
  }, [selectedGoal, selectedWorkType, user, updateUser, t]);

  const fetchSkillSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/copilot/suggest-skills');
      setSuggestedSkills(data.skills || []);
    } catch (err: any) {
      if (err.response?.status === 402) {
        Alert.alert(t('copilot.creditsNeeded') || 'AI credits needed', t('copilot.addCredits') || 'Add credits.');
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleAddSkill = useCallback(async (skill: string) => {
    setAddingSkill(skill);
    try {
      const { data } = await api.post('/ai/copilot/add-skill', { skill });
      if (user) {
        await updateUser({ ...user, skills: data.skills, profileScore: data.scores?.profileScore, hireScore: data.scores?.hireScore });
      }
      setSuggestedSkills(prev => prev.filter(s => s.skill !== skill));
      setFinalScores({ profileScore: data.scores?.profileScore || 0, hireScore: data.scores?.hireScore || 0, newJobsUnlocked: data.newJobsUnlocked || 0 });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || 'Failed to add skill');
    } finally {
      setAddingSkill(null);
    }
  }, [user, updateUser, t]);

  const fetchExperienceRewrite = useCallback(async () => {
    const targetRole = selectedGoal || user?.careerGoal || 'General';
    setLoading(true);
    try {
      const { data } = await api.post('/ai/copilot/rewrite-experience', { targetRole });
      setExperienceRewrite(data);
    } catch (err: any) {
      if (err.response?.status === 402) {
        Alert.alert(t('copilot.creditsNeeded') || 'AI credits needed', t('copilot.addCredits') || 'Add credits.');
      } else {
        Alert.alert(t('common.error'), 'Failed to rewrite experience');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedGoal, user?.careerGoal, t]);

  const applyExperienceRewrite = useCallback(async () => {
    if (!experienceRewrite?.rewritten) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/copilot/apply-experience-rewrite', {
        rewrittenExperience: experienceRewrite.rewritten,
      });
      if (user) {
        await updateUser({ ...user, experience: experienceRewrite.rewritten, aiOptimized: true, profileScore: data.scores?.profileScore, hireScore: data.scores?.hireScore });
      }
      setFinalScores({ profileScore: data.scores?.profileScore || 0, hireScore: data.scores?.hireScore || 0, newJobsUnlocked: finalScores?.newJobsUnlocked || 0 });
      setStep('results');
    } catch {
      Alert.alert(t('common.error'), 'Failed to apply rewrite');
    } finally {
      setLoading(false);
    }
  }, [experienceRewrite, user, updateUser, finalScores, t]);

  const scoreColor = (score: number) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const renderAuditStep = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      {loading && !audit ? (
        <GlassCard style={styles.card}>
          <ActivityIndicator size="large" color={colors.terracotta} />
          <Text variant="bodyMedium" style={[styles.centerText, { marginTop: 16 }]}>
            {t('copilot.analyzing') || 'Analyzing your profile...'}
          </Text>
        </GlassCard>
      ) : audit ? (
        <>
          <GlassCard style={styles.card}>
            <Text variant="titleLarge" style={styles.heroTitle}>
              {t('copilot.yourHireScore') || 'Your Hire Score'}
            </Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.bigScore, { color: scoreColor(audit.hireScore) }]}>
                {audit.hireScore}%
              </Text>
            </View>
            <ProgressBar progress={audit.hireScore / 100} color={scoreColor(audit.hireScore)} style={styles.mainProgressBar} />

            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text variant="labelSmall" style={styles.scoreLabel}>{t('copilot.profileScore') || 'Profile'}</Text>
                <Text variant="titleMedium" style={[styles.scoreValue, { color: scoreColor(audit.profileScore) }]}>{audit.profileScore}%</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text variant="labelSmall" style={styles.scoreLabel}>{t('copilot.trustScore') || 'Trust'}</Text>
                <Text variant="titleMedium" style={[styles.scoreValue, { color: scoreColor(audit.trustScore) }]}>{audit.trustScore}%</Text>
              </View>
              <View style={styles.scoreItem}>
                <Text variant="labelSmall" style={styles.scoreLabel}>{t('copilot.interviewChance') || 'Interview'}</Text>
                <Text variant="titleMedium" style={[styles.scoreValue, { color: scoreColor(audit.hiringProbability) }]}>{audit.hiringProbability}%</Text>
              </View>
            </View>

            {audit.salaryPotential ? (
              <View style={styles.salaryBadge}>
                <MaterialCommunityIcons name="currency-inr" size={16} color={colors.terracotta} />
                <Text variant="bodySmall" style={styles.salaryText}>{audit.salaryPotential}</Text>
              </View>
            ) : null}
          </GlassCard>

          {audit.strengths.length > 0 && (
            <GlassCard style={styles.card}>
              <Text variant="titleMedium" style={styles.sectionTitle}>{t('copilot.strengths') || 'Strengths'}</Text>
              {audit.strengths.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                  <Text variant="bodyMedium" style={styles.listItemText}>{s}</Text>
                </View>
              ))}
            </GlassCard>
          )}

          {audit.weaknesses.length > 0 && (
            <GlassCard style={styles.card}>
              <Text variant="titleMedium" style={styles.sectionTitle}>{t('copilot.weaknesses') || 'Areas to Improve'}</Text>
              {audit.weaknesses.map((w, i) => (
                <View key={i} style={styles.listItem}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#FF9800" />
                  <Text variant="bodyMedium" style={styles.listItemText}>{w}</Text>
                </View>
              ))}
            </GlassCard>
          )}

          <View style={styles.ctaRow}>
            <Button mode="contained" onPress={() => setStep('career_goal')} style={styles.ctaButton} icon="rocket-launch">
              {t('copilot.improveNow') || 'Improve Now'}
            </Button>
          </View>
        </>
      ) : null}
    </Animated.View>
  );

  const renderCareerGoalStep = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <GlassCard style={styles.card}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t('copilot.whatJobWant') || 'What job do you want?'}
        </Text>
        <Text variant="bodySmall" style={styles.hintText}>
          {t('copilot.goalHint') || 'This powers all recommendations.'}
        </Text>
        <View style={styles.goalGrid}>
          {CAREER_GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.goalCard, selectedGoal === g.key && styles.goalCardSelected]}
              onPress={() => setSelectedGoal(g.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={g.icon} size={28} color={selectedGoal === g.key ? colors.terracotta : colors.textSecondary} />
              <Text variant="labelSmall" style={[styles.goalLabel, selectedGoal === g.key && { color: colors.terracotta, fontWeight: '700' }]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('copilot.workPreference') || 'Work preference'}
        </Text>
        <View style={styles.workTypeRow}>
          {WORK_TYPES.map(w => (
            <TouchableOpacity
              key={w.key}
              style={[styles.workTypeCard, selectedWorkType === w.key && styles.goalCardSelected]}
              onPress={() => setSelectedWorkType(w.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={w.icon} size={22} color={selectedWorkType === w.key ? colors.terracotta : colors.textSecondary} />
              <Text variant="labelSmall" style={[styles.goalLabel, selectedWorkType === w.key && { color: colors.terracotta }]}>
                {w.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      <View style={styles.ctaRow}>
        <Button mode="outlined" onPress={() => setStep('audit')} style={styles.halfButton} textColor={colors.terracotta}>
          {t('common.back') || 'Back'}
        </Button>
        <Button mode="contained" onPress={saveCareerIntent} style={styles.halfButton} loading={loading} disabled={!selectedGoal || loading}>
          {t('copilot.next') || 'Next'}
        </Button>
      </View>
    </Animated.View>
  );

  const renderSkillsStep = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <GlassCard style={styles.card}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t('copilot.smartSkills') || 'Smart Skill Builder'}
        </Text>
        <Text variant="bodySmall" style={styles.hintText}>
          {t('copilot.skillsHint') || 'People hired in your target role also have these skills:'}
        </Text>

        {loading && suggestedSkills.length === 0 ? (
          <ActivityIndicator size="small" color={colors.terracotta} style={{ marginVertical: 20 }} />
        ) : (
          suggestedSkills.map((s, i) => (
            <Animated.View key={s.skill} entering={FadeIn.delay(i * 60).duration(200)}>
              <View style={styles.skillRow}>
                <View style={styles.skillInfo}>
                  <Text variant="titleSmall" style={styles.skillName}>{s.skill}</Text>
                  <View style={styles.skillMeta}>
                    {s.salaryImpact ? (
                      <Chip compact style={styles.impactChip} textStyle={styles.impactChipText}>
                        {s.salaryImpact}
                      </Chip>
                    ) : null}
                    <Chip
                      compact
                      style={[styles.demandChip, s.demandLevel === 'high' && styles.demandHigh, s.demandLevel === 'low' && styles.demandLow]}
                      textStyle={styles.demandChipText}
                    >
                      {s.demandLevel} demand
                    </Chip>
                  </View>
                  {s.reason ? <Text variant="bodySmall" style={styles.skillReason}>{s.reason}</Text> : null}
                </View>
                <Button
                  mode="contained"
                  compact
                  onPress={() => handleAddSkill(s.skill)}
                  loading={addingSkill === s.skill}
                  disabled={addingSkill !== null}
                  style={styles.addSkillBtn}
                  labelStyle={{ fontSize: 12 }}
                >
                  + Add
                </Button>
              </View>
            </Animated.View>
          ))
        )}
      </GlassCard>

      <View style={styles.ctaRow}>
        <Button mode="outlined" onPress={() => setStep('career_goal')} style={styles.halfButton} textColor={colors.terracotta}>
          {t('common.back') || 'Back'}
        </Button>
        <Button mode="contained" onPress={() => { setStep('experience'); fetchExperienceRewrite(); }} style={styles.halfButton}>
          {t('copilot.next') || 'Next'}
        </Button>
      </View>
    </Animated.View>
  );

  const renderExperienceStep = () => (
    <Animated.View entering={FadeInDown.duration(300)}>
      <GlassCard style={styles.card}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {t('copilot.experienceOptimize') || 'Experience Optimization'}
        </Text>
        <Text variant="bodySmall" style={styles.hintText}>
          {t('copilot.experienceHint') || 'AI rewrites your experience to match your target role.'}
        </Text>

        {loading && !experienceRewrite ? (
          <ActivityIndicator size="small" color={colors.terracotta} style={{ marginVertical: 20 }} />
        ) : experienceRewrite ? (
          <>
            <View style={styles.compareBox}>
              <View style={styles.compareSection}>
                <Text variant="labelSmall" style={styles.compareLabel}>{t('copilot.before') || 'Before'}</Text>
                <Text variant="bodyMedium" style={styles.compareText}>{experienceRewrite.original || 'Fresher'}</Text>
              </View>
              <MaterialCommunityIcons name="arrow-down" size={24} color={colors.terracotta} style={{ alignSelf: 'center', marginVertical: 8 }} />
              <View style={[styles.compareSection, styles.compareSectionAfter]}>
                <Text variant="labelSmall" style={[styles.compareLabel, { color: '#4CAF50' }]}>{t('copilot.after') || 'After'}</Text>
                <Text variant="bodyMedium" style={styles.compareText}>{experienceRewrite.rewritten}</Text>
              </View>
            </View>

            {experienceRewrite.improvements.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {experienceRewrite.improvements.map((imp, i) => (
                  <View key={i} style={styles.listItem}>
                    <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                    <Text variant="bodySmall" style={styles.listItemText}>{imp}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.ctaRow, { marginTop: 16 }]}>
              <Button mode="outlined" onPress={() => setStep('results')} style={styles.halfButton} textColor={colors.textSecondary}>
                {t('copilot.skip') || 'Skip'}
              </Button>
              <Button mode="contained" onPress={applyExperienceRewrite} style={styles.halfButton} loading={loading} disabled={loading}>
                {t('copilot.applyRewrite') || 'Apply'}
              </Button>
            </View>
          </>
        ) : null}
      </GlassCard>

      <View style={styles.ctaRow}>
        <Button mode="outlined" onPress={() => setStep('skills')} style={styles.halfButton} textColor={colors.terracotta}>
          {t('common.back') || 'Back'}
        </Button>
      </View>
    </Animated.View>
  );

  const renderResultsStep = () => {
    const currentScore = finalScores?.hireScore || user?.hireScore || 0;
    const improvement = currentScore - initialHireScore;

    return (
      <Animated.View entering={FadeInDown.duration(300)}>
        <GlassCard style={styles.card}>
          <View style={styles.resultHero}>
            <MaterialCommunityIcons name="party-popper" size={48} color={colors.terracotta} />
            <Text variant="headlineSmall" style={styles.resultTitle}>
              {t('copilot.profileImproved') || 'Profile Improved!'}
            </Text>

            {improvement > 0 && (
              <Text variant="titleMedium" style={[styles.improvementText, { color: '#4CAF50' }]}>
                +{improvement}% {t('copilot.hireScoreIncrease') || 'hire score increase'}
              </Text>
            )}

            <View style={styles.scoreRow}>
              <View style={styles.scoreItem}>
                <Text variant="labelSmall" style={styles.scoreLabel}>{t('copilot.before') || 'Before'}</Text>
                <Text variant="titleMedium" style={[styles.scoreValue, { color: scoreColor(initialHireScore) }]}>{initialHireScore}%</Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={24} color={colors.textSecondary} />
              <View style={styles.scoreItem}>
                <Text variant="labelSmall" style={styles.scoreLabel}>{t('copilot.after') || 'After'}</Text>
                <Text variant="titleMedium" style={[styles.scoreValue, { color: scoreColor(currentScore) }]}>{currentScore}%</Text>
              </View>
            </View>

            {finalScores?.newJobsUnlocked ? (
              <View style={styles.unlockBadge}>
                <MaterialCommunityIcons name="lock-open" size={18} color={colors.terracotta} />
                <Text variant="bodyMedium" style={styles.unlockText}>
                  {t('copilot.jobsUnlocked')?.replace('{{count}}', String(finalScores.newJobsUnlocked)) || `${finalScores.newJobsUnlocked} new jobs unlocked!`}
                </Text>
              </View>
            ) : null}
          </View>
        </GlassCard>

        <View style={styles.ctaRow}>
          <Button mode="contained" onPress={() => router.replace('/(tabs)')} style={styles.ctaButton} icon="briefcase-search">
            {t('copilot.viewJobs') || 'View Jobs'}
          </Button>
        </View>
        <Button mode="text" onPress={() => { setStep('audit'); runAudit(); }} textColor={colors.terracotta}>
          {t('copilot.runAgain') || 'Run audit again'}
        </Button>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyle(colors)}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.terracotta} onPress={() => router.back()} style={styles.backButton} />
          <View>
            <Text variant="titleLarge" style={styles.headerTitle}>
              {t('copilot.title') || 'AI Career Copilot'}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t('copilot.subtitle') || 'Boost your hiring chances'}
            </Text>
          </View>
        </View>

        {/* Step progress */}
        <View style={styles.stepBar}>
          {(['audit', 'career_goal', 'skills', 'experience', 'results'] as Step[]).map((s, i) => (
            <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive, (['audit', 'career_goal', 'skills', 'experience', 'results'].indexOf(step) > i) && styles.stepDotDone]} />
          ))}
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 'audit' && renderAuditStep()}
          {step === 'career_goal' && renderCareerGoalStep()}
          {step === 'skills' && renderSkillsStep()}
          {step === 'experience' && renderExperienceStep()}
          {step === 'results' && renderResultsStep()}
          <View style={{ height: 40 }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: '100%' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scale(16),
      paddingTop: scale(8),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: { marginRight: 12 },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    headerSubtitle: { color: colors.textSecondary },
    stepBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
    },
    stepDotActive: {
      backgroundColor: colors.terracotta,
      width: 24,
      borderRadius: 5,
    },
    stepDotDone: { backgroundColor: '#4CAF50' },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: screenPaddingHorizontal,
      paddingTop: 8,
    },
    card: { marginBottom: 16 },
    heroTitle: {
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    scoreCircle: { alignItems: 'center', marginBottom: 8 },
    bigScore: {
      fontSize: 56,
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    mainProgressBar: { borderRadius: 4, height: 8, marginBottom: 16 },
    scoreRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: 8,
    },
    scoreItem: { alignItems: 'center' },
    scoreLabel: { color: colors.textSecondary },
    scoreValue: { fontWeight: '700' },
    salaryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
      padding: 8,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderRadius: 8,
    },
    salaryText: { color: colors.terracotta, fontWeight: '600' },
    sectionTitle: {
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    hintText: { color: colors.textSecondary, marginBottom: 12 },
    centerText: { textAlign: 'center', color: colors.textSecondary },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    listItemText: { flex: 1, color: colors.text },
    ctaRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    ctaButton: { flex: 1, backgroundColor: colors.terracotta, borderRadius: 8 },
    halfButton: { flex: 1 },

    goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    goalCard: {
      width: '30%',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.surface : colors.cream,
    },
    goalCardSelected: { borderColor: colors.terracotta, borderWidth: 2 },
    goalLabel: { marginTop: 6, color: colors.text, textAlign: 'center', fontSize: 11 },

    workTypeRow: { flexDirection: 'row', gap: 10 },
    workTypeCard: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.surface : colors.cream,
    },

    skillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    skillInfo: { flex: 1, marginRight: 12 },
    skillName: { fontWeight: '700', color: colors.text },
    skillMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
    impactChip: { backgroundColor: isDark ? '#2D4A2E' : '#E8F5E9', borderRadius: 4 },
    impactChipText: { color: '#4CAF50', fontSize: 10, fontWeight: '600' },
    demandChip: { backgroundColor: isDark ? '#3E3525' : '#FFF3E0', borderRadius: 4 },
    demandHigh: { backgroundColor: isDark ? '#2D4A2E' : '#E8F5E9' },
    demandLow: { backgroundColor: isDark ? '#4A2D2D' : '#FFEBEE' },
    demandChipText: { fontSize: 10, color: colors.text },
    skillReason: { color: colors.textSecondary, marginTop: 2 },
    addSkillBtn: { backgroundColor: colors.terracotta, borderRadius: 8, minWidth: 70 },

    compareBox: { marginTop: 8 },
    compareSection: {
      backgroundColor: isDark ? colors.surface : colors.cream,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#FF9800',
    },
    compareSectionAfter: { borderLeftColor: '#4CAF50' },
    compareLabel: { color: '#FF9800', fontWeight: '600', marginBottom: 4 },
    compareText: { color: colors.text },

    resultHero: { alignItems: 'center', paddingVertical: 16 },
    resultTitle: {
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 12,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    improvementText: { fontSize: 18, fontWeight: '700', marginTop: 8 },
    unlockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
      padding: 12,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderRadius: 8,
    },
    unlockText: { color: colors.terracotta, fontWeight: '600' },
  });
}
