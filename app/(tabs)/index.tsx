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
  Button,
  ActivityIndicator,
  Searchbar,
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
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isEmployer = user?.role === 'employer';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const endpoint = isEmployer
        ? `${API_URL}/api/jobs/employer/${user?.id}`
        : `${API_URL}/api/jobs`;
      const response = await axios.get(endpoint);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      Alert.alert(t('common.error'), t('home.errorLoadJobs'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholderTextColor={COLORS.muted}
          />
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.terracotta]} />
          }
        >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color={COLORS.muted} />
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
          </View>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
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
                    <MaterialCommunityIcons name="office-building" size={16} color={COLORS.terracotta} />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.businessName || job.employerName}
                    </Text>
                  </View>

                  <View style={styles.jobInfo}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.terracotta} />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.location}
                    </Text>
                  </View>

                  <View style={styles.jobInfo}>
                    <MaterialCommunityIcons name="currency-inr" size={16} color={COLORS.terracotta} />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.salary}
                    </Text>
                  </View>

                  <View style={styles.jobFooter}>
                    <Chip icon="clock-outline" compact style={styles.typeChip}>
                      {job.jobType}
                    </Chip>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {format(new Date(job.postedDate), 'MMM dd, yyyy')}
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
          ))
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
  searchContainer: {
    padding: 16,
  },
  searchbar: {
    elevation: 2,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    fontSize: 14,
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
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.terracotta,
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
    color: COLORS.ink,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
  },
  categoryChip: {
    borderColor: COLORS.terracotta,
    borderRadius: 4,
  },
  categoryText: {
    color: COLORS.terracotta,
    fontSize: 12,
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
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  typeChip: {
    backgroundColor: COLORS.cream,
    borderRadius: 4,
  },
  dateText: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  applicationsCount: {
    marginTop: 10,
    backgroundColor: COLORS.cream,
    padding: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appCountText: {
    color: COLORS.terracotta,
    fontWeight: '600',
  },
});
