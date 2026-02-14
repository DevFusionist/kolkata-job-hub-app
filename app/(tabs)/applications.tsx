import React, { useState, useEffect } from 'react';
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
import {
  Text,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { COLORS } from '../_theme';
import { GlassCard } from '../_components/GlassCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<{ [key: string]: Job }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/applications/seeker/${user?.id}`
      );
      setApplications(response.data);

      // Fetch job details for each application
      const jobDetails: { [key: string]: Job } = {};
      for (const app of response.data) {
        try {
          const jobResponse = await axios.get(
            `${API_URL}/api/jobs/${app.jobId}`
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
        return COLORS.gold;
      case 'shortlisted':
        return COLORS.terracotta;
      case 'rejected':
        return COLORS.bengaliRed;
      default:
        return COLORS.muted;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.terracotta} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_tram_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.terracotta]} />
          }
        >
        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color={COLORS.muted}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              {t('applications.empty')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {t('applications.emptySubtext')}
            </Text>
          </View>
        ) : (
          applications.map((app) => {
            const job = jobs[app.jobId];
            if (!job) return null;

            return (
              <TouchableOpacity
                key={app.id}
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
                        textStyle={{ color: '#fff' }}
                      >
                        {app.status}
                      </Chip>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="office-building"
                        size={16}
                        color={COLORS.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.businessName || job.employerName}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={16}
                        color={COLORS.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.location}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="currency-inr"
                        size={16}
                        color={COLORS.terracotta}
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.salary}
                      </Text>
                    </View>

                    <View style={styles.footer}>
                      <Text variant="bodySmall" style={styles.dateText}>
                        Applied on {format(new Date(app.appliedDate), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: COLORS.terracotta,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
  },
  headerSubtitle: {
    marginTop: 4,
    color: COLORS.ink,
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    marginTop: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: COLORS.muted,
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
    color: COLORS.ink,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobInfoText: {
    marginLeft: 10,
    color: COLORS.ink,
    fontSize: 14,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  dateText: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },
});