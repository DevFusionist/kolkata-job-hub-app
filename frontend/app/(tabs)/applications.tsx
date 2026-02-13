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
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
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
      Alert.alert('Error', 'Failed to load applications');
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
        return '#FFA726';
      case 'shortlisted':
        return '#66BB6A';
      case 'rejected':
        return '#EF5350';
      default:
        return '#999';
    }
  };

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
          My Applications
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {applications.length} total applications
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {applications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color="#ccc"
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              No applications yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start applying to jobs to see them here
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
              >
                <Card style={styles.applicationCard}>
                  <Card.Content>
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
                        color="#666"
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.businessName || job.employerName}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={16}
                        color="#666"
                      />
                      <Text variant="bodyMedium" style={styles.jobInfoText}>
                        {job.location}
                      </Text>
                    </View>

                    <View style={styles.jobInfo}>
                      <MaterialCommunityIcons
                        name="currency-inr"
                        size={16}
                        color="#666"
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
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
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
  emptySubtext: {
    marginTop: 8,
    color: '#ccc',
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
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateText: {
    color: '#999',
  },
});