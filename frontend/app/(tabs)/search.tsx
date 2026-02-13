import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Button,
  Modal,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = [
  'Sales',
  'Delivery',
  'Retail',
  'Hospitality',
  'Office Work',
  'Driver',
  'Warehouse',
  'Restaurant',
  'Security',
  'Other',
];

const JOB_TYPES = ['Full-time', 'Part-time'];
const EXPERIENCE_LEVELS = ['Fresher', '1-2 years', '3-5 years', '5+ years'];
const EDUCATION_LEVELS = ['Any', '10th Pass', '12th Pass', 'Graduate', 'Post Graduate'];

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
  experience: string;
  education: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');

  useEffect(() => {
    searchJobs();
  }, []);

  const searchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedJobType) params.jobType = selectedJobType;
      if (selectedExperience) params.experience = selectedExperience;
      if (selectedEducation) params.education = selectedEducation;

      const response = await axios.get(`${API_URL}/api/jobs`, { params });
      setJobs(response.data);
    } catch (error) {
      console.error('Error searching jobs:', error);
      Alert.alert('Error', 'Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedJobType('');
    setSelectedExperience('');
    setSelectedEducation('');
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedJobType,
    selectedExperience,
    selectedEducation,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Search Jobs
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by title or keyword..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={searchJobs}
          style={styles.searchbar}
        />
        <Button
          mode="outlined"
          onPress={() => setFilterVisible(true)}
          style={styles.filterButton}
          icon="filter-variant"
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify" size={64} color="#ccc" />
              <Text variant="titleMedium" style={styles.emptyText}>
                No jobs found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Try adjusting your search criteria
              </Text>
            </View>
          ) : (
            jobs.map((job) => (
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
                        {format(new Date(job.postedDate), 'MMM dd')}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Filter Jobs
            </Text>

            <Text variant="titleMedium" style={styles.filterLabel}>
              Category
            </Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={selectedCategory === cat}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat ? '' : cat)
                  }
                  style={styles.chip}
                >
                  {cat}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.filterLabel}>
              Job Type
            </Text>
            <View style={styles.chipContainer}>
              {JOB_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={selectedJobType === type}
                  onPress={() =>
                    setSelectedJobType(selectedJobType === type ? '' : type)
                  }
                  style={styles.chip}
                >
                  {type}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.filterLabel}>
              Experience
            </Text>
            <View style={styles.chipContainer}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <Chip
                  key={exp}
                  selected={selectedExperience === exp}
                  onPress={() =>
                    setSelectedExperience(selectedExperience === exp ? '' : exp)
                  }
                  style={styles.chip}
                >
                  {exp}
                </Chip>
              ))}
            </View>

            <Text variant="titleMedium" style={styles.filterLabel}>
              Education
            </Text>
            <View style={styles.chipContainer}>
              {EDUCATION_LEVELS.map((edu) => (
                <Chip
                  key={edu}
                  selected={selectedEducation === edu}
                  onPress={() =>
                    setSelectedEducation(selectedEducation === edu ? '' : edu)
                  }
                  style={styles.chip}
                >
                  {edu}
                </Chip>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={clearFilters} style={styles.modalButton}>
                Clear All
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setFilterVisible(false);
                  searchJobs();
                }}
                style={styles.modalButton}
              >
                Apply Filters
              </Button>
            </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 2,
  },
  filterButton: {
    marginLeft: 8,
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
  filterLabel: {
    marginTop: 16,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});
