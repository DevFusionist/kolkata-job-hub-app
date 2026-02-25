import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import {
  Text,
  Chip,
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
import { scale, screenPaddingHorizontal } from '../_design';
import { enterFadeInDown, enterFadeInDownStagger } from '../_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeFormatDate } from '../_lib/date';

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedDate: string;
  coverLetter?: string;
}

interface Job {
  id: string;
  title: string;
  category: string;
  employerName: string;
  businessName?: string;
  location: string;
  salary: string;
}

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [jobs, setJobs] = useState<{ [key: string]: Job }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh whenever the screen comes into focus so applications made via
  // Protibha chat appear here immediately without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [user?.id])
  );

  const fetchApplications = async () => {
    try {
      const response = await api.get(
        `/applications/seeker/${user?.id}`
      );
      setApplications(response.data);

      // Fetch job details for each application
      const jobDetails: { [key: string]: Job } = {};
      for (const app of response.data) {
        try {
          const jobResponse = await api.get(
            `/jobs/${app.jobId}`
          );
          jobDetails[app.jobId] = jobResponse.data;
        } catch (error) {
          console.error('Error fetching job:', error);
        }
      }
      setJobs(jobDetails);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert(t('common.error'), t('applications.errorLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.secondary;
      case 'shortlisted': return colors.primary;
      case 'rejected': return colors.accent;
      default: return colors.muted;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingScreen message={t('applications.title')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient
        colors={isDark
          ? [colors.surface, colors.background]
          : [colors.gradientStart + '18', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {t('applications.title')}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {applications.length} {t('applications.totalApplications')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {applications.length === 0 ? (
          <Animated.View entering={enterFadeInDown} style={styles.emptyContainer}>
            <LinearGradient colors={[colors.primary + '22', colors.secondary + '15']} style={styles.emptyIconBg}>
              <MaterialCommunityIcons name="file-document-outline" size={40} color={colors.primary} />
            </LinearGradient>
            <Text variant="titleMedium" style={styles.emptyText}>{t('applications.empty')}</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>{t('applications.emptySubtext')}</Text>
          </Animated.View>
        ) : (
          applications.map((app, index) => {
            const job = jobs[app.jobId];
            if (!job) return null;
            return (
              <Animated.View key={app.id} entering={enterFadeInDownStagger(index, 50)}>
                <TouchableOpacity onPress={() => router.push(`/job-details?id=${app.jobId}`)} activeOpacity={0.75}>
                  <GlassCard style={styles.applicationCard}>
                    <View style={styles.cardHeader}>
                      <Text variant="titleMedium" style={styles.jobTitle} numberOfLines={2}>
                        {job.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '25', borderColor: getStatusColor(app.status) + '80' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status}</Text>
                      </View>
                    </View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="office-building-outline" size={14} color={colors.primary} /><Text variant="bodySmall" style={styles.jobInfoText}>{job.businessName || job.employerName}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.secondary} /><Text variant="bodySmall" style={styles.jobInfoText}>{job.location}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="currency-inr" size={14} color={colors.secondary} /><Text variant="bodySmall" style={[styles.jobInfoText, { color: colors.secondary, fontWeight: '700' }]}>{job.salary}</Text></View>
                    <View style={styles.footer}>
                      <Text variant="bodySmall" style={styles.dateText}>Applied {safeFormatDate(app.appliedDate, 'MMM dd, yyyy')}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    headerGrad: {},
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: scale(20),
      paddingTop: scale(16),
      paddingBottom: scale(12),
    },
    headerTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    countBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
    },
    countText: { fontSize: 12, fontWeight: '700' },
    content: { flex: 1, paddingHorizontal: screenPaddingHorizontal },
    emptyContainer: { alignItems: 'center', marginTop: 64, gap: 14 },
    emptyIconBg: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: colors.textSecondary, textAlign: 'center' },
    emptySubtext: { color: colors.muted, textAlign: 'center', fontSize: 13 },
    applicationCard: { marginBottom: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
    jobTitle: { flex: 1, fontWeight: '700', color: colors.text },
    statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    jobInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    jobInfoText: { color: colors.textSecondary, fontSize: 13 },
    footer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    dateText: { color: colors.muted, fontStyle: 'italic', fontSize: 12 },
  });
}