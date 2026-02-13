import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
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
      Alert.alert('Error', 'Failed to load jobs');
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          {isEmployer ? 'My Job Postings' : 'Latest Jobs'}
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {isEmployer
            ? `Free jobs remaining: ${user?.freeJobsRemaining || 0}`
            : 'Find your next opportunity in Kolkata'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search jobs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              {isEmployer ? 'No jobs posted yet' : 'No jobs available'}
            </Text>
            {isEmployer && (
              <Button
                mode="contained"
                onPress={() => router.push('/(tabs)/post-job')}
                style={styles.emptyButton}
              >
                Post Your First Job
              </Button>
            )}
          </View>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              onPress={() => router.push(`/job-details?id=${job.id}`)}
            >
              <Card style={styles.jobCard}>
                <Card.Content>
                  <View style={styles.jobHeader}>
                    <Text variant="titleLarge" style={styles.jobTitle}>
                      {job.title}
                    </Text>
                    <Chip mode="outlined">{job.category}</Chip>
                  </View>

                  <View style={styles.jobInfo}>
                    <MaterialCommunityIcons name="office-building" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.businessName || job.employerName}
                    </Text>
                  </View>

                  <View style={styles.jobInfo}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.location}
                    </Text>
                  </View>

                  <View style={styles.jobInfo}>
                    <MaterialCommunityIcons name="currency-inr" size={16} color="#666" />
                    <Text variant="bodyMedium" style={styles.jobInfoText}>
                      {job.salary}
                    </Text>
                  </View>

                  <View style={styles.jobFooter}>
                    <Chip icon="clock-outline" compact>
                      {job.jobType}
                    </Chip>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {format(new Date(job.postedDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>

                  {isEmployer && (
                    <View style={styles.applicationsCount}>
                      <Text variant="bodySmall">
                        {job.applicationsCount} applications
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#666',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchbar: {
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
  emptyButton: {
    marginTop: 16,
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
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobInfoText: {
    marginLeft: 6,
    color: '#666',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dateText: {
    color: '#999',
  },
  applicationsCount: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});