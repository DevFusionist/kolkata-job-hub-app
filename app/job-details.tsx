import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Text,
  Button,
  Chip,
  TextInput,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useLanguage } from './_contexts/LanguageContext';
import { useTheme } from './_contexts/ThemeContext';
import { GlassCard } from './_components/GlassCard';
import { LoadingScreen } from './_components/LoadingScreen';
import type { ThemeColors } from './_theme';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from './_design';
import { enterFadeInDown } from './_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeFormatDate } from './_lib/date';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  salary: string;
  location: string;
  jobType: string;
  experience: string;
  education: string;
  languages: string[];
  skills: string[];
  employerId: string;
  employerName: string;
  employerPhone?: string;
  businessName?: string;
  postedDate: string;
  applicationsCount: number;
  status: string;
}

interface Application {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerPhone: string;
  seekerSkills: string[];
  status: string;
  appliedDate: string;
  coverLetter?: string;
}

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applicationsModalVisible, setApplicationsModalVisible] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  const [skillGap, setSkillGap] = useState<{ hasGap: boolean; missing: string[]; matched: string[]; matchPercent: number; message: string } | null>(null);
  const [skillGapChecked, setSkillGapChecked] = useState(false);
  const isEmployer = user?.role === 'employer';
  const isMyJob = job?.employerId === user?.id;
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    fetchJobDetails();
    if (!isEmployer) {
      checkIfApplied();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      Alert.alert(t('common.error'), t('jobDetails.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await api.get(
        `/applications/seeker/${user?.id}`
      );
      const applied = response.data.some((app: any) => app.jobId === jobId);
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleApply = async () => {
    if (hasApplied) {
      Alert.alert(t('jobDetails.applied'), t('jobDetails.alreadyApplied'));
      return;
    }

    setApplying(true);
    try {
      await api.post(
        `/applications?seeker_id=${user?.id}`,
        {
          jobId,
          coverLetter: coverLetter || undefined,
        }
      );

      Alert.alert(t('common.success'), t('jobDetails.applicationSuccess'));
      setHasApplied(true);
      setApplyModalVisible(false);
      setCoverLetter('');
    } catch (error: any) {
      console.error('Error applying:', error);
      Alert.alert(t('common.error'), error.response?.data?.detail || t('jobDetails.errorApply'));
    } finally {
      setApplying(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get(
        `/applications/job/${jobId}`
      );
      setApplications(response.data);
      setApplicationsModalVisible(true);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert(t('common.error'), t('jobDetails.errorLoadApplications'));
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: string
  ) => {
    try {
      await api.put(
        `/applications/${applicationId}/status?status=${status}`
      );
      Alert.alert(t('common.success'), t('jobDetails.statusUpdated'));
      fetchApplications();
    } catch (error) {
      Alert.alert(t('common.error'), t('jobDetails.errorUpdateStatus'));
    }
  };

  const handleContactEmployer = () => {
    if (job) {
      router.push(
        `/chat?userId=${job.employerId}&userName=${job.employerName}`
      );
    }
  };

  const handleContactSeeker = (seekerId: string, seekerName: string) => {
    router.push(`/chat?userId=${seekerId}&userName=${seekerName}`);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, styles.container, { backgroundColor: colors.background }]}>
        <LoadingScreen message={t('jobDetails.title')} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.centerContainer, styles.container]}>
        <Text>{t('jobDetails.jobNotFound')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyle(colors)}
      >
        <View style={styles.header}>
<MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.terracotta}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          {t('jobDetails.title')}
        </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
        <Animated.View entering={enterFadeInDown}>
        <GlassCard style={styles.card}>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.title}>
                {job.title}
              </Text>
              <Chip mode="outlined" style={styles.categoryChip} textStyle={{ color: colors.text }}>
                {job.category}
              </Chip>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="office-building" size={20} color={colors.terracotta} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.businessName || job.employerName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.terracotta} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.location}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={colors.terracotta} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.salary}
              </Text>
            </View>

            <View style={styles.chipsRow}>
              <Chip icon="clock-outline" compact style={styles.attributeChip} textStyle={{ color: colors.text }}>
                {job.jobType}
              </Chip>
              <Chip icon="briefcase" compact style={styles.attributeChip} textStyle={{ color: colors.text }}>
                {job.experience}
              </Chip>
              <Chip icon="school" compact style={styles.attributeChip} textStyle={{ color: colors.text }}>
                {job.education}
              </Chip>
            </View>

            <Text variant="bodySmall" style={styles.dateText}>
              {t('jobDetails.postedOn')} {safeFormatDate(job.postedDate, 'MMM dd, yyyy')}
            </Text>
        </GlassCard>
        </Animated.View>

        <Animated.View entering={enterFadeInDown}>
        <GlassCard style={styles.card}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('jobDetails.description')}
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {job.description}
            </Text>
        </GlassCard>
        </Animated.View>

        <Animated.View entering={enterFadeInDown}>
        <GlassCard style={styles.card}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {t('jobDetails.requirements')}
            </Text>

            <Text variant="titleMedium" style={styles.requirementTitle}>
              {t('jobDetails.languages')}
            </Text>
            <View style={styles.chipContainer}>
              {job.languages.map((lang) => (
                <Chip key={lang} style={styles.chip} textStyle={{ color: colors.text }}>
                  {lang}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.requirementTitle}>
              {t('jobDetails.skills')}
            </Text>
            <View style={styles.chipContainer}>
              {job.skills.map((skill) => (
                <Chip key={skill} style={styles.chip} textStyle={{ color: colors.text }}>
                  {skill}
                </Chip>
              ))}
            </View>
        </GlassCard>
        </Animated.View>

        {isMyJob && (
          <Animated.View entering={enterFadeInDown}>
          <GlassCard style={styles.card}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                {t('jobDetails.applications')}
              </Text>
              <Text variant="bodyMedium" style={styles.applicationsText}>
                {job.applicationsCount} {t('jobDetails.candidatesApplied')}
              </Text>
              <Button
                mode="contained"
                onPress={fetchApplications}
                style={styles.actionButton}
              >
                {t('jobDetails.viewApplications')}
              </Button>
          </GlassCard>
          </Animated.View>
        )}
      </ScrollView>

      {!isEmployer && (
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleContactEmployer}
            style={[styles.footerButton, styles.footerButtonOutlined]}
            labelStyle={{ color: colors.terracotta }}
            icon="message"
            textColor={colors.terracotta}
          >
            {t('jobDetails.message')}
          </Button>
          <Button
            mode="contained"
            onPress={async () => {
              if (!skillGapChecked && !hasApplied && jobId) {
                try {
                  const { data } = await api.post('/ai/copilot/skill-gap', { jobId });
                  setSkillGap(data);
                  setSkillGapChecked(true);
                  if (data.hasGap) return;
                } catch {
                  // proceed without gap check
                }
              }
              setApplyModalVisible(true);
            }}
            style={[styles.footerButton, styles.footerButtonPrimary]}
            disabled={hasApplied || job.status !== 'active'}
            labelStyle={hasApplied ? styles.footerButtonDisabledLabel : undefined}
          >
            {hasApplied ? t('jobDetails.applied') : t('jobDetails.apply')}
          </Button>
        </View>
      )}

      {/* Skill Gap Warning */}
      {skillGap?.hasGap && skillGapChecked && !applyModalVisible && (
        <View style={styles.skillGapBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9800" />
            <Text variant="titleSmall" style={{ color: colors.text, fontWeight: '700', flex: 1 }}>
              {t('copilot.skillGapTitle') || 'Skills gap detected'}
            </Text>
          </View>
          <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 8 }}>
            {skillGap.message}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: 4 }}>
            {t('copilot.skillMatch') || 'Skill match'}: {skillGap.matchPercent}%
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button
              mode="outlined"
              compact
              onPress={() => router.push('/ai-copilot' as any)}
              textColor={colors.terracotta}
              style={{ flex: 1, borderColor: colors.terracotta }}
            >
              {t('copilot.improveNow') || 'Improve Profile'}
            </Button>
            <Button
              mode="contained"
              compact
              onPress={() => { setSkillGap(null); setApplyModalVisible(true); }}
              style={{ flex: 1, backgroundColor: colors.terracotta }}
            >
              {t('copilot.applyAnyway') || 'Apply Anyway'}
            </Button>
          </View>
        </View>
      )}

      </ImageBackground>

      <Portal>
        <Modal
          visible={applyModalVisible}
          onDismiss={() => setApplyModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {t('jobDetails.applyFor')} {job.title}
          </Text>
          <TextInput
            label={t('jobDetails.coverLetter')}
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={6}
            style={styles.textArea}
            placeholder={t('jobDetails.coverLetterPlaceholder')}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.terracotta}
          />
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setApplyModalVisible(false)}
              style={styles.modalButton}
            >
              {t('jobDetails.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              loading={applying}
              style={styles.modalButton}
            >
              {t('jobDetails.submitApplication')}
            </Button>
          </View>
        </Modal>

        <Modal
          visible={applicationsModalVisible}
          onDismiss={() => setApplicationsModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {t('jobDetails.applications')} ({applications.length})
          </Text>
          <ScrollView style={styles.applicationsScroll}>
            {applications.map((app) => (
              <GlassCard key={app.id} style={styles.applicationCard}>
                  <Text variant="titleMedium">{app.seekerName}</Text>
                  <Text variant="bodySmall">+91 {app.seekerPhone}</Text>
                  <View style={styles.chipContainer}>
                    {app.seekerSkills.map((skill) => (
                      <Chip key={skill} compact style={styles.chip} textStyle={{ color: colors.text }}>
                        {skill}
                      </Chip>
                    ))}
                  </View>
                  <Text variant="bodySmall" style={styles.appliedDate}>
                    Applied: {safeFormatDate(app.appliedDate, 'MMM dd, yyyy')}
                  </Text>
                  {app.coverLetter && (
                    <Text variant="bodySmall" style={styles.coverLetter}>
                      {app.coverLetter}
                    </Text>
                  )}
                  <View style={styles.applicationActions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleContactSeeker(app.seekerId, app.seekerName)}
                      compact
                    >
                      {t('jobDetails.message')}
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button
                          mode="contained"
                          onPress={() =>
                            updateApplicationStatus(app.id, 'shortlisted')
                          }
                          compact
                        >
                          {t('jobDetails.shortlist')}
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() =>
                            updateApplicationStatus(app.id, 'rejected')
                          }
                          compact
                          textColor={colors.bengaliRed}
                        >
                          {t('jobDetails.reject')}
                        </Button>
                      </>
                    )}
                    {app.status !== 'pending' && (
                      <Chip mode="flat" textStyle={{ color: colors.text }}>{app.status}</Chip>
                    )}
                  </View>
              </GlassCard>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scale(24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: screenPaddingHorizontal,
      paddingTop: scale(16),
      paddingBottom: scale(10),
    },
    card: {
      marginBottom: 16,
      elevation: 2,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      flexWrap: 'wrap',
      gap: 8,
    },
    title: {
      flex: 1,
      fontWeight: 'bold',
      marginRight: 8,
      color: colors.text,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      color: colors.text,
    },
    categoryChip: {
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    attributeChip: {
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    dateText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    sectionTitle: {
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.terracotta,
    },
    description: {
      lineHeight: 24,
      color: colors.text,
    },
    requirementTitle: {
      marginTop: 12,
      marginBottom: 8,
      color: colors.terracotta,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      marginRight: 4,
      marginBottom: 4,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    applicationsText: {
      marginBottom: 12,
      color: colors.text,
    },
    actionButton: {
      marginTop: 8,
      backgroundColor: colors.terracotta,
      borderRadius: 2,
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    footerButton: {
      flex: 1,
    },
    footerButtonOutlined: {
      borderColor: colors.terracotta,
    },
    footerButtonPrimary: {
      backgroundColor: colors.terracotta,
    },
    footerButtonDisabledLabel: {
      color: colors.textSecondary,
    },
    modal: {
      backgroundColor: colors.surface,
      padding: 20,
      margin: 20,
      borderRadius: 8,
      maxHeight: '80%',
    },
    modalTitle: {
      marginBottom: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    textArea: {
      marginBottom: 16,
      backgroundColor: isDark ? colors.surface : colors.cream,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    modalButton: {
      flex: 1,
    },
    applicationsScroll: {
      maxHeight: 400,
    },
    applicationCard: {
      marginBottom: 12,
    },
    appliedDate: {
      marginTop: 8,
      color: colors.textSecondary,
    },
    coverLetter: {
      marginTop: 8,
      fontStyle: 'italic',
    },
    applicationActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      flexWrap: 'wrap',
    },
    skillGapBanner: {
      backgroundColor: isDark ? 'rgba(255,152,0,0.12)' : 'rgba(255,152,0,0.08)',
      borderTopWidth: 1,
      borderTopColor: '#FF9800',
      padding: 16,
    },
  });
}
