import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
  Linking,
} from 'react-native';
import {
  Text,
  Button,
  List,
  Divider,
  Chip,
  TextInput,
  ActivityIndicator,
  Switch,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { PaymentModal } from '../_components/PaymentModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../_theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const [portfolioRawText, setPortfolioRawText] = useState('');
  const [portfolioProjects, setPortfolioProjects] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [portfolio, setPortfolio] = useState<{
    resumeUrl?: string | null;
    resumeFileName?: string | null;
    generatedResumeUrl?: string | null;
  } | null>(null);
  const [loadingViewUrl, setLoadingViewUrl] = useState<'upload' | 'generated' | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [entitlements, setEntitlements] = useState<{ aiFreeTokensRemaining?: number; aiPaidTokensRemaining?: number } | null>(null);
  const { t } = useLanguage();
  const router = useRouter();
  const isEmployer = user?.role === 'employer';
  const isSeeker = user?.role === 'seeker';
  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchEntitlements = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/entitlements');
      if (data) {
        setEntitlements({
          aiFreeTokensRemaining: data.aiFreeTokensRemaining,
          aiPaidTokensRemaining: data.aiPaidTokensRemaining,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchEntitlements();
  }, [user?.id, fetchEntitlements]);

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
        const merged = [...new Set([...(user?.skills || []), ...data.aiAnalysis.skills])].slice(0, 30);
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
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('profile.title')}
          </Text>
        </View>

        <ScrollView style={styles.content}>
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

          {isSeeker && (
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
                      <MaterialCommunityIcons name="file-check" size={18} color="#16A34A" />
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
                      <MaterialCommunityIcons name="robot" size={18} color="#2563EB" />
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
          )}

          {isSeeker && (
            <GlassCard style={styles.card}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.improveWithAi')}
              </Text>
              <Text variant="bodySmall" style={styles.portfolioHint}>
                {t('profile.improveWithAiDesc')}
              </Text>
              <TextInput
                value={portfolioRawText}
                onChangeText={setPortfolioRawText}
                placeholder={t('profile.rawTextPlaceholder') || 'e.g. 2 years delivery experience, know Salt Lake area, Hindi and Bengali...'}
                multiline
                numberOfLines={4}
                style={styles.portfolioInput}
                textColor={colors.text}
                editable={!analyzing}
              />
              <TextInput
                value={portfolioProjects}
                onChangeText={setPortfolioProjects}
                placeholder={t('profile.projectsPlaceholder') || 'Projects (comma-separated, e.g. Online Shop, Food Delivery App)'}
                style={styles.portfolioInput}
                textColor={colors.text}
                editable={!analyzing}
              />
              <TextInput
                value={portfolioLinks}
                onChangeText={setPortfolioLinks}
                placeholder={t('profile.linksPlaceholder') || 'Links (comma-separated, e.g. linkedin.com/in/you, github.com/you)'}
                style={styles.portfolioInput}
                textColor={colors.text}
                editable={!analyzing}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Button
                mode="contained"
                onPress={async () => {
                  if (!portfolioRawText.trim() || !user?.id) return;
                  setAnalyzing(true);
                  try {
                    const projects = portfolioProjects
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean);
                    const links = portfolioLinks
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    const { data } = await api.post(
                      '/ai/analyze-portfolio',
                      { rawText: portfolioRawText.trim(), projects, links }
                    );
                    const newSkills = data.skills || [];
                    const merged = [...new Set([...(user.skills || []), ...newSkills])].slice(0, 30);
                    await updateUser({ ...user, skills: merged });
                    setPortfolioRawText('');
                    setPortfolioProjects('');
                    setPortfolioLinks('');
                    Alert.alert(t('common.success'), t('profile.skillsExtracted'));
                  } catch (err: any) {
                    if (err.response?.status === 402) {
                      setPaymentModalVisible(true);
                      Alert.alert(
                        t('profile.paymentRequiredAi') || 'AI credits needed',
                        err.response?.data?.detail || (t('profile.paymentRequiredAi') || 'Add AI credits to continue.'),
                        [{ text: t('common.ok') }],
                      );
                      return;
                    }
                    Alert.alert(t('common.error'), err.response?.data?.detail || err.message || 'Analysis failed');
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                loading={analyzing}
                disabled={!portfolioRawText.trim() || analyzing}
                style={styles.analyzeButton}
              >
                {analyzing ? t('profile.analyzing') : t('profile.improveWithAi')}
              </Button>
            </GlassCard>
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
              onPress={() => Alert.alert(t('profile.comingSoon'), t('profile.editProfileSoon'))}
            />

            {isEmployer && (
              <List.Item
                title={t('profile.purchaseJobPosts')}
                description={t('profile.perPost')}
                left={(props) => <List.Icon {...props} icon="cart" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/(tabs)/post-job')}
              />
            )}

            <List.Item
              title={t('profile.aiCredits') || 'AI credits'}
              description={`${t('profile.aiCreditsDesc') || 'For chat, resume analysis & AI builder'} — ${(entitlements?.aiFreeTokensRemaining ?? user?.aiFreeTokensRemaining ?? 0) + (entitlements?.aiPaidTokensRemaining ?? user?.aiPaidTokensRemaining ?? 0)} ${t('profile.creditsRemaining') || 'remaining'}`}
              left={(props) => <List.Icon {...props} icon="robot" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setPaymentModalVisible(true)}
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
        onSuccess={() => {
          fetchEntitlements();
          setPaymentModalVisible(false);
        }}
        title={t('profile.addAiCredits') || 'Add AI credits'}
        subtitle={t('profile.addAiCreditsSubtitle') || 'Buy AI credits for Protibha chat, resume analysis, and AI resume builder.'}
        filter="ai"
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
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
      padding: 24,
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
      padding: 16,
      paddingBottom: 40,
      marginBottom: 20,
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
    },
    logoutButton: {
      marginVertical: 16,
      borderColor: colors.bengaliRed,
    },
    portfolioHint: {
      color: colors.textSecondary,
      marginBottom: 12,
    },
    portfolioInput: {
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    analyzeButton: {
      backgroundColor: colors.terracotta,
      borderRadius: 2,
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
  });
}