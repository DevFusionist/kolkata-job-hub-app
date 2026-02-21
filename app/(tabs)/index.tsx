import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Text,
  Chip,
  Button,
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, imageBackgroundStyleTabs, screenPaddingHorizontal } from '../_design';
import { enterFadeInDown, enterFadeInDownStagger } from '../_animations';
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
  const isEmployer = user?.role === 'employer';
  const isSeeker = user?.role === 'seeker';

  // Refresh every time the tab/screen gains focus so newly posted jobs
  // (from post-job form or Protibha chat) appear immediately without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      fetchJobs();
      if (isSeeker && user?.id) {
        fetchRecommended();
      }
    }, [isEmployer, isSeeker, user?.id])
  );

  const fetchRecommended = async () => {
    try {
      setRecLoading(true);
      const { data } = await api.post('/ai/match', { seekerId: user?.id, limit: 5 });
      setRecommended(data.jobs || []);
    } catch {
      // silent - recommendations are best-effort
    } finally {
      setRecLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const endpoint = isEmployer
        ? `/jobs/employer/${user?.id}`
        : `/jobs`;
      const response = await api.get(endpoint);
      setJobs(response.data);
    } catch (error) {
      console.log('Error fetching jobs:', error);
      Alert.alert(t('common.error'), t('home.errorLoadJobs'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
    if (isSeeker && user?.id) {
      fetchRecommended();
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingScreen message={isEmployer ? undefined : t('home.latestJobs')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_tram_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyleTabs(colors)}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {isEmployer ? t('home.myJobPostings') : t('home.latestJobs')}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {isEmployer
              ? `${t('home.freeJobsRemaining')}: ${user?.freeJobsRemaining || 0}`
              : t('home.findOpportunity')}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('home.searchPlaceholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            placeholderTextColor={colors.muted}
          />
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.terracotta]} />
          }
        >
        {/* AI Recommended Jobs for Seekers */}
        {isSeeker && recommended.length > 0 && (
          <Animated.View entering={enterFadeInDown} style={styles.recommendedSection}>
            <View style={styles.recommendedHeader}>
              <MaterialCommunityIcons name="star-four-points" size={20} color={colors.gold} />
              <Text variant="titleMedium" style={styles.recommendedTitle}>
                {t('home.recommendedForYou') || 'Recommended for You'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendedScroll}
            >
              {recommended.map((job, index) => (
                <Animated.View key={`rec-${job.id}`} entering={enterFadeInDownStagger(index, 40)}>
                <TouchableOpacity
                  onPress={() => router.push(`/job-details?id=${job.id}`)}
                  activeOpacity={0.7}
                >
                  <GlassCard style={styles.recCard}>
                    <Text variant="titleSmall" numberOfLines={1} style={styles.recJobTitle}>
                      {job.title}
                    </Text>
                    <View style={styles.recMeta}>
                      <MaterialCommunityIcons name="office-building" size={12} color={colors.terracotta} />
                      <Text variant="bodySmall" numberOfLines={1} style={styles.recMetaText}>
                        {job.businessName || job.employerName}
                      </Text>
                    </View>
                    <View style={styles.recMeta}>
                      <MaterialCommunityIcons name="map-marker" size={12} color={colors.terracotta} />
                      <Text variant="bodySmall" numberOfLines={1} style={styles.recMetaText}>
                        {job.location}
                      </Text>
                    </View>
                    <View style={styles.recMeta}>
                      <MaterialCommunityIcons name="currency-inr" size={12} color={colors.gold} />
                      <Text variant="bodySmall" numberOfLines={1} style={styles.recSalary}>
                        {job.salary}
                      </Text>
                    </View>
                    <Chip compact style={styles.recChip} textStyle={styles.recChipText}>
                      {job.category}
                    </Chip>
                  </GlassCard>
                </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Section header for main list */}
        {isSeeker && recommended.length > 0 && filteredJobs.length > 0 && (
          <Text variant="titleMedium" style={styles.sectionDivider}>
            {t('home.allJobs') || 'All Jobs'}
          </Text>
        )}

        {filteredJobs.length === 0 ? (
          <Animated.View entering={enterFadeInDown} style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color={colors.muted} />
            <Text variant="titleMedium" style={styles.emptyText}>
              {isEmployer ? t('home.noJobsPosted') : t('home.noJobsAvailable')}
            </Text>
            {isEmployer && (
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/post-job')}
                style={styles.emptyButton}
              >
                {t('home.postFirstJob')}
              </Button>
            )}
          </Animated.View>
        ) : (
          <>
            {filteredJobs.map((job, index) => (
              <Animated.View key={job.id} entering={enterFadeInDownStagger(index, 50)}>
                <TouchableOpacity
                  onPress={() => router.push(`/job-details?id=${job.id}`)}
                  activeOpacity={0.7}
                >
                  <GlassCard style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text variant="titleLarge" style={styles.jobTitle}>
                        {job.title}
                      </Text>
                      <Chip
                        mode="outlined"
                        textStyle={styles.categoryText}
                        style={styles.categoryChip}
                      >
                        {job.category}
                      </Chip>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons name="office-building" size={16} color={colors.terracotta} />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.businessName || job.employerName}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons name="map-marker" size={16} color={colors.terracotta} />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.location}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons name="currency-inr" size={16} color={colors.terracotta} />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.salary}
                      </Text>
                    </View>

                    <View style={styles.jobFooter}>
                      <Chip icon="clock-outline" compact style={styles.typeChip} textStyle={{ color: colors.text }}>
                        {job.jobType}
                      </Chip>
                      <Text variant="bodySmall" style={styles.dateText}>
                        {safeFormatDate(job.postedDate, 'MMM dd, yyyy')}
                      </Text>
                    </View>

                    {isEmployer && (
                      <View style={styles.applicationsCount}>
                        <Text variant="bodySmall" style={styles.appCountText}>
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
        <View style={{ height: 40 }} />
        </ScrollView>
      </ImageBackground>
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
    headerSubtitle: {
      marginTop: 4,
      color: colors.text,
      fontSize: 16,
      opacity: 0.8,
    },
    searchContainer: {
      padding: scale(16),
    },
    searchbar: {
      elevation: 2,
      borderRadius: 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      fontSize: 14,
    },
    content: {
      flex: 1,
      paddingHorizontal: screenPaddingHorizontal,
      paddingBottom: scale(10),
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 64,
    },
    emptyText: {
      marginTop: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyButton: {
      marginTop: 24,
      backgroundColor: colors.terracotta,
      borderRadius: 2,
    },
    jobCard: {
      marginBottom: 16,
      elevation: 2,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    jobTitle: {
      flex: 1,
      fontWeight: 'bold',
      marginRight: 8,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    categoryChip: {
      borderColor: colors.terracotta,
      borderRadius: 4,
    },
    categoryText: {
      color: colors.terracotta,
      fontSize: 12,
    },
    jobInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    jobInfoText: {
      marginLeft: 10,
      color: colors.text,
      fontSize: 14,
    },
    jobFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    typeChip: {
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderRadius: 4,
    },
    dateText: {
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    applicationsCount: {
      marginTop: 10,
      backgroundColor: colors.cream,
      padding: 6,
      borderRadius: 4,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
    },
    appCountText: {
      color: colors.terracotta,
      fontWeight: '600',
    },

    /* Recommended section */
    recommendedSection: {
      marginBottom: 20,
    },
    recommendedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    recommendedTitle: {
      fontWeight: '700',
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    recommendedScroll: {
      paddingRight: 16,
      gap: 12,
    },
    recCard: {
      width: 200,
      elevation: 2,
    },
    recJobTitle: {
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    recMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 3,
    },
    recMetaText: {
      color: colors.textSecondary,
      fontSize: 12,
      flex: 1,
    },
    recSalary: {
      color: colors.gold,
      fontWeight: '600',
      fontSize: 12,
      flex: 1,
    },
    recChip: {
      alignSelf: 'flex-start',
      marginTop: 6,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderRadius: 4,
    },
    recChipText: {
      color: colors.terracotta,
      fontSize: 10,
    },
    sectionDivider: {
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
  });
}
