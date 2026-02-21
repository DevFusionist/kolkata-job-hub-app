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
  const { colors } = useTheme();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      case 'pending':
        return colors.gold;
      case 'shortlisted':
        return colors.terracotta;
      case 'rejected':
        return colors.bengaliRed;
      default:
        return colors.muted;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingScreen message={t('applications.title')} />
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
            {t('applications.title')}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {applications.length} {t('applications.totalApplications')}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.terracotta]} />
          }
        >
        {applications.length === 0 ? (
          <Animated.View entering={enterFadeInDown} style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color={colors.muted}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              {t('applications.empty')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {t('applications.emptySubtext')}
            </Text>
          </Animated.View>
        ) : (
          applications.map((app, index) => {
            const job = jobs[app.jobId];
            if (!job) return null;

            return (
              <Animated.View key={app.id} entering={enterFadeInDownStagger(index, 50)}>
              <TouchableOpacity
                onPress={() => router.push(`/job-details?id=${app.jobId}`)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.applicationCard}>
                  <View style={styles.cardHeader}>
                      <Text variant="titleLarge" style={styles.jobTitle}>
                        {job.title}
                      </Text>
                      <Chip
                        mode="flat"
                        style={{
                          backgroundColor: getStatusColor(app.status),
                        }}
                        textStyle={{ color: colors.cream }}
                      >
                        {app.status}
                      </Chip>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="office-building"
                        size={16}
                        color={colors.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.businessName || job.employerName}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={16}
                        color={colors.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.location}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="currency-inr"
                        size={16}
                        color={colors.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.salary}
                      </Text>
                    </View>

                    <View style={styles.footer}>
                      <Text variant="bodySmall" style={styles.dateText}>
                        Applied on {safeFormatDate(app.appliedDate, 'MMM dd, yyyy')}
                      </Text>
                    </View>
                </GlassCard>
              </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
        </ScrollView>
      </ImageBackground>
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
    content: {
      flex: 1,
      paddingHorizontal: screenPaddingHorizontal,
      paddingBottom: scale(120),
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
    emptySubtext: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    applicationCard: {
      marginBottom: 16,
      elevation: 2,
    },
    cardHeader: {
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
    footer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    dateText: {
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });
}