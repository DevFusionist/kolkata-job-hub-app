import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Text,
  Button,
  List,
  Divider,
  Chip,
  Switch,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { PaymentModal } from '../_components/PaymentModal';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from '../_design';
import { enterFadeInDown } from '../_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../_theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [portfolio, setPortfolio] = useState<{
    resumeUrl?: string | null;
    resumeFileName?: string | null;
    generatedResumeUrl?: string | null;
    rawText?: string | null;
    projects?: Array<{ name?: string } | string>;
    links?: string[];
  } | null>(null);
  const [loadingViewUrl, setLoadingViewUrl] = useState<'upload' | 'generated' | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentModalFilter, setPaymentModalFilter] = useState<'ai' | 'job'>('ai');
  const [entitlements, setEntitlements] = useState<{
    aiFreeTokensRemaining?: number;
    aiPaidTokensRemaining?: number;
    freeJobsRemaining?: number;
    paidJobsRemaining?: number;
    subscriptionActive?: boolean;
    subscriptionPlan?: string;
    subscriptionExpiresAt?: string | null;
  } | null>(null);
  const { t } = useLanguage();
  const router = useRouter();
  const isEmployer = user?.role === 'employer';
  const isSeeker = user?.role === 'seeker';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Profile strength (Naukri-style): encourage completeness for better visibility
  const profileStrength = useMemo(() => {
    if (!isSeeker || !user) return { score: 0, label: 'Incomplete' };
    let score = 0;
    if (user.name?.trim()) score += 15;
    if (user.phone) score += 10;
    if (user.location?.trim()) score += 15;
    if (user.languages?.length) score += 15;
    if (user.skills?.length) score += 25;
    if (portfolio?.resumeFileName || portfolio?.generatedResumeUrl) score += 20;
    const label = score >= 80 ? 'Strong' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Incomplete';
    return { score: Math.min(100, score), label };
  }, [isSeeker, user, portfolio?.resumeFileName, portfolio?.generatedResumeUrl]);

  const fetchEntitlements = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/entitlements');
      if (data) setEntitlements(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchEntitlements();
  }, [user?.id, fetchEntitlements]);

  // Refresh entitlements when tab gains focus (e.g. after buying on another screen)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchEntitlements();
    }, [user?.id, fetchEntitlements])
  );

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id || !isSeeker) return;
    try {
      const { data } = await api.get(`/portfolios/seeker/${user.id}`);
      if (data) setPortfolio(data);
    } catch {
      // silently ignore — portfolio may not exist yet
    }
  }, [user?.id, isSeeker]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);


  const handleViewResume = useCallback(async (type: 'upload' | 'generated') => {
    setLoadingViewUrl(type);
    try {
      const { data } = await api.get('/portfolios/resume-view-url');
      const url = type === 'upload' ? data.uploadUrl : data.generatedUrl;
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) await Linking.openURL(url);
        else Alert.alert(t('common.error'), t('profile.cannotOpenResume') || 'Cannot open resume');
      } else {
        Alert.alert(t('common.error'), t('profile.resumeNotAvailable') || 'Resume is not available to view');
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err.response?.data?.detail || err.message || 'Failed to open resume');
    } finally {
      setLoadingViewUrl(null);
    }
  }, [t]);

  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert(t('common.error'), t('profile.fileTooLarge') || 'File too large (max 5MB)');
        return;
      }

      setUploading(true);
      setUploadProgress(0.2);

      const formData = new FormData();
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      } as any);

      setUploadProgress(0.5);

      const { data } = await api.post('/portfolios/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadProgress(1);

      if (data.aiAnalysis?.skills?.length) {
        const merged = Array.isArray(data.mergedSkills) ? data.mergedSkills : [...new Set([...(user?.skills || []), ...data.aiAnalysis.skills])].slice(0, 30);
        await updateUser({ ...user!, skills: merged });
      }

      await fetchPortfolio();

      Alert.alert(
        t('common.success'),
        t('profile.resumeUploaded') || `Resume "${file.name}" uploaded successfully!${data.aiAnalysis ? ' Skills extracted from your resume.' : ''}`,
      );
    } catch (err: any) {
      if (err.response?.status === 402) {
        setPaymentModalVisible(true);
        Alert.alert(
          t('profile.paymentRequiredAi') || 'AI credits needed',
          err.response?.data?.detail || (t('profile.paymentRequiredAi') || 'Add AI credits to analyze your resume.'),
          [{ text: t('common.ok') }],
        );
        return;
      }
      Alert.alert(
        t('common.error'),
        err.response?.data?.detail || err.message || 'Resume upload failed',
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyle(colors)}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('profile.title')}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={enterFadeInDown}>
          <GlassCard style={styles.card}>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons
                name={isEmployer ? 'briefcase' : 'account'}
                size={64}
                color={colors.terracotta}
              />
              <Text variant="headlineSmall" style={styles.name}>
                {user?.name}
              </Text>
              <Chip mode="outlined" style={styles.roleChip} textStyle={{ color: colors.text }}>
                {isEmployer ? t('profile.employer') : t('profile.jobSeeker')}
              </Chip>
              {isSeeker && (
                <View style={styles.profileStrengthRow}>
                  <MaterialCommunityIcons name="chart-donut" size={18} color={colors.terracotta} />
                  <Text variant="bodySmall" style={styles.profileStrengthText}>
                    {t('profile.profileStrength')}: {profileStrength.score}% — {t(`profile.strength.${profileStrength.label}`)}
                  </Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title={t('profile.phone')}
              description={`+91 ${user?.phone}`}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />

            <List.Item
              title={t('profile.location')}
              description={user?.location}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />

            {isEmployer && user?.businessName && (
              <List.Item
                title={t('profile.business')}
                description={user.businessName}
                left={(props) => <List.Icon {...props} icon="office-building" />}
              />
            )}

            {isEmployer && (
              <List.Item
                title={t('profile.freeJobsRemaining')}
                description={`${user?.freeJobsRemaining || 0} ${t('profile.posts')}`}
                left={(props) => <List.Icon {...props} icon="ticket" />}
              />
            )}

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.languages')}
              </Text>
              <View style={styles.chipContainer}>
                {user?.languages?.map((lang) => (
                  <Chip key={lang} style={styles.chip} textStyle={{ color: colors.text }}>
                    {lang}
                  </Chip>
                ))}
              </View>
            </View>

            {!isEmployer && user?.skills && (user.skills.length > 0) && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('profile.skills')}
                </Text>
                <View style={styles.chipContainer}>
                  {user.skills.map((skill) => (
                    <Chip key={skill} style={styles.chip} textStyle={{ color: colors.text }}>
                      {skill}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </GlassCard>
          </Animated.View>

          {isSeeker && (
          <Animated.View entering={enterFadeInDown}>
            <GlassCard style={styles.card}>
              <View style={styles.resumeSectionHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.terracotta} />
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('profile.resumeSection') || 'Resume'}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.portfolioHint}>
                {t('profile.resumeHint') || 'Upload your resume or build one with AI assistance'}
              </Text>

              {(portfolio?.resumeFileName || portfolio?.generatedResumeUrl) && (
                <View style={styles.resumeStatusContainer}>
                  {portfolio.resumeFileName && (
                    <View style={styles.resumeStatusRow}>
                      <MaterialCommunityIcons name="file-check" size={18} color={colors.gold} />
                      <Text variant="bodySmall" style={styles.resumeStatusText}>
                        {t('profile.uploadedResume') || 'Uploaded'}: {portfolio.resumeFileName}
                      </Text>
                      <Button
                        mode="text"
                        compact
                        loading={loadingViewUrl === 'upload'}
                        disabled={loadingViewUrl !== null}
                        onPress={() => handleViewResume('upload')}
                        textColor={colors.terracotta}
                        style={styles.viewResumeButton}
                      >
                        {t('profile.viewResume') || 'View'}
                      </Button>
                    </View>
                  )}
                  {portfolio.generatedResumeUrl && (
                    <View style={styles.resumeStatusRow}>
                      <MaterialCommunityIcons name="robot" size={18} color={colors.terracotta} />
                      <Text variant="bodySmall" style={styles.resumeStatusText}>
                        {t('profile.aiResumeReady') || 'AI Resume saved and ready'}
                      </Text>
                      <Button
                        mode="text"
                        compact
                        loading={loadingViewUrl === 'generated'}
                        disabled={loadingViewUrl !== null}
                        onPress={() => handleViewResume('generated')}
                        textColor={colors.terracotta}
                        style={styles.viewResumeButton}
                      >
                        {t('profile.viewResume') || 'View'}
                      </Button>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.resumeButtons}>
                <Button
                  mode="contained"
                  onPress={handleResumeUpload}
                  loading={uploading}
                  disabled={uploading}
                  icon="upload"
                  style={styles.uploadButton}
                  labelStyle={styles.resumeButtonLabel}
                >
                  {uploading
                    ? (t('profile.uploading') || 'Uploading...')
                    : portfolio?.resumeFileName
                      ? (t('profile.replaceResume') || 'Replace Resume')
                      : (t('profile.uploadResume') || 'Upload Resume')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => router.push('/resume-builder')}
                  icon="robot"
                  style={styles.buildResumeButton}
                  textColor={colors.terracotta}
                  labelStyle={styles.resumeButtonLabel}
                >
                  {portfolio?.generatedResumeUrl
                    ? (t('profile.rebuildResume') || 'Rebuild with AI')
                    : (t('profile.buildResume') || 'Build with AI')}
                </Button>
              </View>

              {uploading && (
                <ProgressBar
                  progress={uploadProgress}
                  color={colors.terracotta}
                  style={styles.progressBar}
                />
            )}
          </GlassCard>
          </Animated.View>
          )}

          {isSeeker && (
            <Animated.View entering={enterFadeInDown}>
            <GlassCard style={styles.card}>
              <TouchableOpacity onPress={() => router.push('/ai-copilot' as any)} activeOpacity={0.8}>
                <View style={styles.copilotCtaRow}>
                  <MaterialCommunityIcons name="rocket-launch" size={32} color={colors.terracotta} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t('copilot.title') || 'AI Career Copilot'}
                    </Text>
                    <Text variant="bodySmall" style={styles.portfolioHint}>
                      {t('copilot.profileCta') || 'Audit your profile, add skills, rewrite experience, and unlock more jobs.'}
                    </Text>
                    {(user?.hireScore ?? 0) > 0 && (
                      <View style={styles.hireScoreBadge}>
                        <Text variant="labelSmall" style={{ color: colors.terracotta, fontWeight: '700' }}>
                          {t('copilot.hireScore') || 'Hire Score'}: {user?.hireScore}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.terracotta} />
                </View>
              </TouchableOpacity>
            </GlassCard>
            </Animated.View>
          )}

          <GlassCard style={styles.card}>
            <List.Item
              title={t('profile.appearance')}
              description={isDark ? t('profile.darkMode') : t('profile.lightMode')}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDark}
                  onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
                  color={colors.terracotta}
                />
              )}
            />
            <List.Item
              title={t('profile.editProfile')}
              left={(props) => <List.Icon {...props} icon="pencil" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/edit-profile')}
            />
            {isSeeker && (
              <List.Item
                title={t('profile.portfolio')}
                description={t('profile.portfolioDesc')}
                left={(props) => <List.Icon {...props} icon="file-document-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/portfolio')}
              />
            )}
            {isEmployer && (
              <>
                {/* <List.Item
                  title={t('profile.purchaseJobPosts')}
                  description={t('profile.perPost')}
                  left={(props) => <List.Icon {...props} icon="cart" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push('/(tabs)/post-job')}
                /> */}
                <List.Item
                  title={t('profile.jobCreditsSubscription')}
                  titleNumberOfLines={2}
                  titleEllipsizeMode="clip"
                  description={t('profile.jobCreditsDesc')
                    ?.replace('{free}', String(entitlements?.freeJobsRemaining ?? user?.freeJobsRemaining ?? 0))
                    ?.replace('{paid}', String(entitlements?.paidJobsRemaining ?? user?.paidJobsRemaining ?? 0))
                    ?.replace('{sub}', entitlements?.subscriptionActive ? '✓ Subscription' : 'Free')
                    ?? `Free: ${entitlements?.freeJobsRemaining ?? user?.freeJobsRemaining ?? 0} · Paid: ${entitlements?.paidJobsRemaining ?? user?.paidJobsRemaining ?? 0}`}
                  descriptionNumberOfLines={10}
                  descriptionEllipsizeMode="clip"
                  left={(props) => <List.Icon {...props} icon="briefcase" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => { setPaymentModalFilter('job'); setPaymentModalVisible(true); }}
                />
              </>
            )}

            <List.Item
              title={t('profile.aiCredits') || 'AI credits'}
              description={`${t('profile.aiCreditsDesc') || 'For chat, resume analysis & AI builder'} — ${(entitlements?.aiFreeTokensRemaining ?? user?.aiFreeTokensRemaining ?? 0) + (entitlements?.aiPaidTokensRemaining ?? user?.aiPaidTokensRemaining ?? 0)} ${t('profile.creditsRemaining') || 'remaining'}`}
              descriptionNumberOfLines={10}
              descriptionEllipsizeMode="clip"
              left={(props) => <List.Icon {...props} icon="robot" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => { setPaymentModalFilter('ai'); setPaymentModalVisible(true); }}
            />

            <List.Item
              title={t('profile.helpSupport')}
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(t('profile.helpSupport'), t('profile.supportContact'))}
            />

            <List.Item
              title={t('profile.about')}
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert(
                  t('profile.about'),
                  `${t('profile.aboutText')}\n\n${t('profile.version')}`
                )
              }
            />
          </GlassCard>

          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
            textColor={colors.bengaliRed}
          >
            {t('profile.logout')}
          </Button>
        </ScrollView>
      </ImageBackground>
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={async () => {
          try {
            const { data } = await api.get('/payments/entitlements');
            if (data && user) {
              await updateUser({
                ...user,
                freeJobsRemaining: data.freeJobsRemaining ?? user.freeJobsRemaining,
                paidJobsRemaining: data.paidJobsRemaining ?? user.paidJobsRemaining,
                subscriptionPlan: data.subscriptionPlan ?? user.subscriptionPlan,
                subscriptionExpiresAt: data.subscriptionExpiresAt ?? user.subscriptionExpiresAt,
                aiFreeTokensRemaining: data.aiFreeTokensRemaining ?? user.aiFreeTokensRemaining,
                aiPaidTokensRemaining: data.aiPaidTokensRemaining ?? user.aiPaidTokensRemaining,
                canUseAi: data.canUseAi ?? user.canUseAi,
              });
            }
            await fetchEntitlements();
          } finally {
            setPaymentModalVisible(false);
          }
        }}
        title={paymentModalFilter === 'job' ? (t('profile.addJobCredits') || 'Add job credits / subscription') : (t('profile.addAiCredits') || 'Add AI credits')}
        subtitle={paymentModalFilter === 'job' ? (t('profile.addJobCreditsSubtitle') || 'Buy job credits or monthly unlimited posting.') : (t('profile.addAiCreditsSubtitle') || 'Buy AI credits for Kormo chat, resume analysis, and AI resume builder.')}
        filter={paymentModalFilter}
      />
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
    header: {
      padding: scale(24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: screenPaddingHorizontal,
      paddingBottom: scale(100),
    },
    card: {
      marginBottom: 16,
      elevation: 2,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    name: {
      marginTop: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    roleChip: {
      marginTop: 8,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    divider: {
      marginVertical: 16,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      marginBottom: 8,
      color: colors.text,
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
    logoutButton: {
      marginVertical: 16,
      borderColor: colors.bengaliRed,
    },
    portfolioHint: {
      color: colors.textSecondary,
      marginBottom: 12,
    },
    savedPortfolioSection: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    savedPortfolioLabel: {
      color: colors.terracotta,
      marginBottom: 8,
    },
    savedPortfolioBlock: {
      marginTop: 8,
    },
    savedPortfolioFieldLabel: {
      color: colors.textSecondary,
      marginBottom: 4,
    },
    savedPortfolioText: {
      color: colors.text,
    },
    savedLink: {
      textDecorationLine: 'underline',
      color: colors.terracotta,
      marginBottom: 2,
    },
    resumeSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    resumeStatusContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      marginBottom: 4,
      gap: 6,
    },
    resumeStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resumeStatusText: {
      color: colors.text,
      flex: 1,
    },
    viewResumeButton: {
      minWidth: 0,
      marginLeft: 4,
    },
    resumeButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    uploadButton: {
      flex: 1,
      backgroundColor: colors.terracotta,
      borderRadius: 8,
    },
    buildResumeButton: {
      flex: 1,
      borderColor: colors.terracotta,
      borderRadius: 8,
    },
    resumeButtonLabel: {
      fontSize: 12,
    },
    progressBar: {
      marginTop: 8,
      borderRadius: 4,
    },
    profileStrengthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      gap: 6,
    },
    profileStrengthText: {
      color: colors.textSecondary,
    },
    copilotCtaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hireScoreBadge: {
      marginTop: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(165,74,63,0.15)' : 'rgba(165,74,63,0.08)',
    },
  });
}