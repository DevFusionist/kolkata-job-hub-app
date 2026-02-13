import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  TextInput,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
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
  experience: string;
  education: string;
  languages: string[];
  skills: string[];
  employerId: string;
  employerName: string;
  employerPhone: string;
  businessName?: string;
  postedDate: string;
  applicationsCount: number;
  status: string;
}

interface Application {
  id: string;
  seekerName: string;
  seekerPhone: string;
  seekerSkills: string[];
  status: string;
  appliedDate: string;
  coverLetter?: string;
}

export default function JobDetailsScreen() {
  const params = useLocalSearchParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applicationsModalVisible, setApplicationsModalVisible] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  const isEmployer = user?.role === 'employer';
  const isMyJob = job?.employerId === user?.id;

  useEffect(() => {
    fetchJobDetails();
    if (!isEmployer) {
      checkIfApplied();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Error fetching job:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/applications/seeker/${user?.id}`
      );
      const applied = response.data.some((app: any) => app.jobId === jobId);
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleApply = async () => {
    if (hasApplied) {
      Alert.alert('Already Applied', 'You have already applied to this job');
      return;
    }

    setApplying(true);
    try {
      await axios.post(
        `${API_URL}/api/applications?seeker_id=${user?.id}`,
        {
          jobId,
          coverLetter: coverLetter || undefined,
        }
      );

      Alert.alert('Success', 'Application submitted successfully!');
      setHasApplied(true);
      setApplyModalVisible(false);
      setCoverLetter('');
    } catch (error: any) {
      console.error('Error applying:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/applications/job/${jobId}`
      );
      setApplications(response.data);
      setApplicationsModalVisible(true);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: string
  ) => {
    try {
      await axios.put(
        `${API_URL}/api/applications/${applicationId}/status?status=${status}`
      );
      Alert.alert('Success', `Application ${status}`);
      fetchApplications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const handleContactEmployer = () => {
    if (job) {
      router.push(
        `/chat?userId=${job.employerId}&userName=${job.employerName}`
      );
    }
  };

  const handleContactSeeker = (seekerId: string, seekerName: string) => {
    router.push(`/chat?userId=${seekerId}&userName=${seekerName}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Job Details
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={styles.title}>
                {job.title}
              </Text>
              <Chip mode="outlined">{job.category}</Chip>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="office-building" size={20} color="#666" />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.businessName || job.employerName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.location}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#666" />
              <Text variant="bodyLarge" style={styles.infoText}>
                {job.salary}
              </Text>
            </View>

            <View style={styles.chipsRow}>
              <Chip icon="clock-outline" compact>
                {job.jobType}
              </Chip>
              <Chip icon="briefcase" compact>
                {job.experience}
              </Chip>
              <Chip icon="school" compact>
                {job.education}
              </Chip>
            </View>

            <Text variant="bodySmall" style={styles.dateText}>
              Posted on {format(new Date(job.postedDate), 'MMM dd, yyyy')}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Job Description
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {job.description}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Requirements
            </Text>

            <Text variant="titleMedium" style={styles.requirementTitle}>
              Languages
            </Text>
            <View style={styles.chipContainer}>
              {job.languages.map((lang) => (
                <Chip key={lang} style={styles.chip}>
                  {lang}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.requirementTitle}>
              Skills
            </Text>
            <View style={styles.chipContainer}>
              {job.skills.map((skill) => (
                <Chip key={skill} style={styles.chip}>
                  {skill}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {isMyJob && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Applications
              </Text>
              <Text variant="bodyMedium" style={styles.applicationsText}>
                {job.applicationsCount} candidates have applied
              </Text>
              <Button
                mode="contained"
                onPress={fetchApplications}
                style={styles.actionButton}
              >
                View Applications
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {!isEmployer && (
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleContactEmployer}
            style={styles.footerButton}
            icon="message"
          >
            Message
          </Button>
          <Button
            mode="contained"
            onPress={() => setApplyModalVisible(true)}
            style={styles.footerButton}
            disabled={hasApplied || job.status !== 'active'}
          >
            {hasApplied ? 'Applied' : 'Apply Now'}
          </Button>
        </View>
      )}

      <Portal>
        <Modal
          visible={applyModalVisible}
          onDismiss={() => setApplyModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Apply for {job.title}
          </Text>
          <TextInput
            label="Cover Letter (Optional)"
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={6}
            style={styles.textArea}
            placeholder="Tell the employer why you're a good fit..."
          />
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setApplyModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleApply}
              loading={applying}
              style={styles.modalButton}
            >
              Submit Application
            </Button>
          </View>
        </Modal>

        <Modal
          visible={applicationsModalVisible}
          onDismiss={() => setApplicationsModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Applications ({applications.length})
          </Text>
          <ScrollView style={styles.applicationsScroll}>
            {applications.map((app) => (
              <Card key={app.id} style={styles.applicationCard}>
                <Card.Content>
                  <Text variant="titleMedium">{app.seekerName}</Text>
                  <Text variant="bodySmall">+91 {app.seekerPhone}</Text>
                  <View style={styles.chipContainer}>
                    {app.seekerSkills.map((skill) => (
                      <Chip key={skill} compact style={styles.chip}>
                        {skill}
                      </Chip>
                    ))}
                  </View>
                  <Text variant="bodySmall" style={styles.appliedDate}>
                    Applied: {format(new Date(app.appliedDate), 'MMM dd, yyyy')}
                  </Text>
                  {app.coverLetter && (
                    <Text variant="bodySmall" style={styles.coverLetter}>
                      {app.coverLetter}
                    </Text>
                  )}
                  <View style={styles.applicationActions}>
                    <Button
                      mode="outlined"
                      onPress={() => handleContactSeeker(app.id, app.seekerName)}
                      compact
                    >
                      Message
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button
                          mode="contained"
                          onPress={() =>
                            updateApplicationStatus(app.id, 'shortlisted')
                          }
                          compact
                        >
                          Shortlist
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() =>
                            updateApplicationStatus(app.id, 'rejected')
                          }
                          compact
                          textColor="#d32f2f"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {app.status !== 'pending' && (
                      <Chip mode="flat">{app.status}</Chip>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </Modal>
      </Portal>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  dateText: {
    marginTop: 12,
    color: '#999',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  requirementTitle: {
    marginTop: 12,
    marginBottom: 8,
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
  applicationsText: {
    marginBottom: 12,
  },
  actionButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  textArea: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
  applicationsScroll: {
    maxHeight: 400,
  },
  applicationCard: {
    marginBottom: 12,
  },
  appliedDate: {
    marginTop: 8,
    color: '#999',
  },
  coverLetter: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
});