import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, Chip, Button, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, screenPaddingHorizontal } from '../_design';
import {
  enterFadeInDown,
  enterFadeInDownStagger,
  enterZoomIn,
} from '../_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeFormatDate } from '../_lib/date';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  salary: string;
  location: string;
  jobType: string;
  employerName: string;
  businessName?: string;
  postedDate: string;
  applicationsCount: number;
}

interface Nudge {
  type: string;
  title: string;
  subtitle: string;
  cta: string;
  priority: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissedNudge, setDismissedNudge] = useState<string | null>(null);
  const isEmployer = user?.role === 'employer';
  const isSeeker = user?.role === 'seeker';

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      if (isSeeker && user?.id) { fetchRecommended(); fetchNudges(); }
    }, [isEmployer, isSeeker, user?.id])
  );

  const fetchNudges = async () => {
    try {
      const { data } = await api.get('/ai/copilot/dashboard');
      setNudges(data.nudges || []);
    } catch { }
  };

  const fetchRecommended = async () => {
    try {
      setRecLoading(true);
      const { data } = await api.post('/ai/match', { seekerId: user?.id, limit: 5 });
      setRecommended(data.jobs || []);
    } catch { } finally { setRecLoading(false); }
  };

  const fetchJobs = async () => {
    try {
      const endpoint = isEmployer ? `/jobs/employer/${user?.id}` : `/jobs`;
      const response = await api.get(endpoint);
      setJobs(response.data);
    } catch (error) {
      Alert.alert(t('common.error'), t('home.errorLoadJobs'));
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
    if (isSeeker && user?.id) fetchRecommended();
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingScreen message={isEmployer ? undefined : t('home.latestJobs')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header with gradient band */}
      <LinearGradient
        colors={isDark
          ? [colors.surface, colors.background]
          : [colors.gradientStart + '18', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              {isEmployer ? t('home.myJobPostings') : t('home.latestJobs')}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {isEmployer
                ? `${t('home.freeJobsRemaining')}: ${user?.freeJobsRemaining || 0}`
                : t('home.findOpportunity')}
            </Text>
          </View>
          <LinearGradient
            colors={[colors.gradientStart, colors.secondary]}
            style={styles.avatarBadge}
          >
            <MaterialCommunityIcons
              name={isEmployer ? 'office-building' : 'account'}
              size={20}
              color="#fff"
            />
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('home.searchPlaceholder')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          placeholderTextColor={colors.muted}
          iconColor={colors.primary}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* AI Nudge */}
        {isSeeker && nudges.length > 0 && !dismissedNudge && (
          <Animated.View entering={enterFadeInDown} style={styles.nudgeContainer}>
            {nudges.slice(0, 1).map(nudge => (
              <TouchableOpacity
                key={nudge.type}
                onPress={() => router.push('/ai-copilot' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary + '22', colors.secondary + '15']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nudgeCard}
                >
                  <MaterialCommunityIcons
                    name={nudge.type === 'profile_incomplete' ? 'chart-arc' : nudge.type === 'low_trust' ? 'shield-alert' : nudge.type === 'jobs_unlocked' ? 'lock-open' : 'rocket-launch'}
                    size={28}
                    color={colors.primary}
                  />
                  <View style={styles.nudgeText}>
                    <Text variant="titleSmall" style={[styles.nudgeTitle, { color: colors.primary }]}>{nudge.title}</Text>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>{nudge.subtitle}</Text>
                  </View>
                  <MaterialCommunityIcons name="arrow-right-circle" size={22} color={colors.primary} />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* AI Recommended section */}
        {isSeeker && recommended.length > 0 && (
          <Animated.View entering={enterFadeInDown} style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.sectionIconBg}>
                <MaterialCommunityIcons name="star-four-points" size={14} color="#fff" />
              </LinearGradient>
              <Text variant="titleMedium" style={styles.recommendedTitle}>
                {t('home.recommendedForYou') || 'Recommended for You'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedScroll}>
              {recommended.map((job, index) => (
                <Animated.View key={`rec-${job.id}`} entering={enterFadeInDownStagger(index, 40)}>
                  <TouchableOpacity onPress={() => router.push(`/job-details?id=${job.id}`)} activeOpacity={0.75}>
                    <GlassCard style={styles.recCard} glow={false}>
                      <Text variant="titleSmall" numberOfLines={1} style={[styles.recJobTitle, { color: colors.text }]}>
                        {job.title}
                      </Text>
                      <View style={styles.recMeta}>
                        <MaterialCommunityIcons name="office-building" size={12} color={colors.primary} />
                        <Text variant="bodySmall" numberOfLines={1} style={styles.recMetaText}>{job.businessName || job.employerName}</Text>
                      </View>
                      <View style={styles.recMeta}>
                        <MaterialCommunityIcons name="map-marker" size={12} color={colors.secondary} />
                        <Text variant="bodySmall" numberOfLines={1} style={styles.recMetaText}>{job.location}</Text>
                      </View>
                      <View style={styles.recMeta}>
                        <MaterialCommunityIcons name="currency-inr" size={12} color={colors.secondary} />
                        <Text variant="bodySmall" numberOfLines={1} style={[styles.recSalary, { color: colors.secondary }]}>{job.salary}</Text>
                      </View>
                      <View style={[styles.recCategoryTag, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
                        <Text style={[styles.recCategoryText, { color: colors.primary }]}>{job.category}</Text>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Section divider */}
        {isSeeker && recommended.length > 0 && filteredJobs.length > 0 && (
          <View style={styles.sectionDividerRow}>
            <View style={[styles.sectionDividerLine, { backgroundColor: colors.border }]} />
            <Text variant="labelSmall" style={styles.sectionDividerLabel}>{t('home.allJobs') || 'All Jobs'}</Text>
            <View style={[styles.sectionDividerLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        {/* Jobs list */}
        {filteredJobs.length === 0 ? (
          <Animated.View entering={enterZoomIn} style={styles.emptyContainer}>
            <LinearGradient
              colors={[colors.primary + '22', colors.secondary + '15']}
              style={styles.emptyIconBg}
            >
              <MaterialCommunityIcons name="briefcase-outline" size={44} color={colors.primary} />
            </LinearGradient>
            <Text variant="titleMedium" style={styles.emptyText}>
              {isEmployer ? t('home.noJobsPosted') : t('home.noJobsAvailable')}
            </Text>
            {isEmployer && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/post-job')} style={styles.emptyBtnWrapper}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.emptyBtnGrad}
                >
                  <Text style={styles.emptyBtnLabel}>{t('home.postFirstJob')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          <>
            {filteredJobs.map((job, index) => (
              <Animated.View key={job.id} entering={enterFadeInDownStagger(index, 45)}>
                <TouchableOpacity onPress={() => router.push(`/job-details?id=${job.id}`)} activeOpacity={0.75}>
                  <GlassCard style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text variant="titleMedium" style={styles.jobTitle} numberOfLines={2}>
                        {job.title}
                      </Text>
                      <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
                        <Text style={[styles.categoryTagText, { color: colors.primary }]}>{job.category}</Text>
                      </View>
                    </View>

                    <View style={styles.jobInfoRow}>
                      <View style={styles.jobInfo}>
                        <MaterialCommunityIcons name="office-building-outline" size={14} color={colors.primary} />
                        <Text variant="bodySmall" style={styles.jobInfoText} numberOfLines={1}>
                          {job.businessName || job.employerName}
                        </Text>
                      </View>
                      <View style={styles.jobInfo}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.secondary} />
                        <Text variant="bodySmall" style={styles.jobInfoText} numberOfLines={1}>
                          {job.location}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.salaryRow}>
                      <MaterialCommunityIcons name="currency-inr" size={16} color={colors.secondary} />
                      <Text variant="bodyMedium" style={[styles.salaryText, { color: colors.secondary }]}>
                        {job.salary}
                      </Text>
                    </View>

                    <View style={styles.jobFooter}>
                      <View style={[styles.typeTag, { backgroundColor: colors.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.typeTagText, { color: colors.textSecondary }]}>{job.jobType}</Text>
                      </View>
                      <Text variant="bodySmall" style={styles.dateText}>
                        {safeFormatDate(job.postedDate, 'MMM dd, yyyy')}
                      </Text>
                    </View>

                    {isEmployer && (
                      <View style={[styles.appCountBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
                        <MaterialCommunityIcons name="account-group" size={13} color={colors.primary} />
                        <Text style={[styles.appCountText, { color: colors.primary }]}>
                          {job.applicationsCount} {t('home.applicationsCount')}
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },

    headerGrad: { paddingBottom: 4 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenPaddingHorizontal,
      paddingTop: scale(16),
      paddingBottom: scale(12),
    },
    headerTitle: {
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      marginTop: 3,
      color: colors.textSecondary,
    },
    avatarBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    searchContainer: { paddingHorizontal: screenPaddingHorizontal, paddingVertical: scale(10) },
    searchbar: {
      elevation: 0,
      borderRadius: 14,
      backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    searchInput: { fontSize: 14 },

    content: {
      flex: 1,
      paddingHorizontal: screenPaddingHorizontal,
    },

    // Nudge
    nudgeContainer: { marginBottom: 16 },
    nudgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.primary + '40',
      padding: 14,
    },
    nudgeText: { flex: 1 },
    nudgeTitle: { fontWeight: '700' },

    // Recommended
    recommendedSection: { marginBottom: 18 },
    recommendedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionIconBg: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendedTitle: { fontWeight: '700', color: colors.text },
    recommendedScroll: { paddingRight: 16, gap: 12 },
    recCard: { width: 190, marginBottom: 4 },
    recJobTitle: { fontWeight: '700', marginBottom: 8 },
    recMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
    recMetaText: { color: colors.textSecondary, fontSize: 11, flex: 1 },
    recSalary: { fontWeight: '600', fontSize: 11, flex: 1 },
    recCategoryTag: {
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
    },
    recCategoryText: { fontSize: 10, fontWeight: '700' },

    // Section divider
    sectionDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    sectionDividerLine: { flex: 1, height: 1 },
    sectionDividerLabel: {
      color: colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 1,
    },

    // Empty
    emptyContainer: { alignItems: 'center', marginTop: 60, gap: 14 },
    emptyIconBg: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: { color: colors.textSecondary, textAlign: 'center', maxWidth: '75%' },
    emptyBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
    emptyBtnGrad: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
    emptyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // Job cards
    jobCard: { marginBottom: 14 },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
      gap: 8,
    },
    jobTitle: {
      flex: 1,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    categoryTag: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    categoryTagText: { fontSize: 11, fontWeight: '700' },
    jobInfoRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 8,
      flexWrap: 'wrap',
    },
    jobInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    jobInfoText: { color: colors.textSecondary, fontSize: 13 },
    salaryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    salaryText: { fontWeight: '700', fontSize: 15 },
    jobFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    typeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    typeTagText: { fontSize: 12, fontWeight: '600' },
    dateText: { color: colors.muted, fontSize: 12 },
    appCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    appCountText: { fontWeight: '600', fontSize: 12 },
  });
}
