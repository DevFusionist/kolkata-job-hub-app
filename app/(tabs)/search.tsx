import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import {
  Text,
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
import { useLanguage } from '../_contexts/LanguageContext';
import { COLORS } from '../_theme';
import { GlassCard } from '../_components/GlassCard';
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
  const { t } = useLanguage();
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
      Alert.alert(t('common.error'), t('search.errorSearch'));
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
      <ImageBackground
        source={require('../../assets/images/kolkata_tram_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('search.title')}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('search.placeholder')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={searchJobs}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            placeholderTextColor={COLORS.muted}
          />
          <Button
            mode="outlined"
            onPress={() => setFilterVisible(true)}
            style={styles.filterButton}
            icon="filter-variant"
            textColor={COLORS.terracotta}
          >
            {t('search.filters')} {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.terracotta} />
          </View>
        ) : (
          <ScrollView style={styles.content}>
          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify" size={64} color={COLORS.muted} />
              <Text variant="titleMedium" style={styles.emptyText}>
                {t('search.noResults')}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {t('search.tryAdjusting')}
              </Text>
            </View>
          ) : (
            jobs.map((job) => (
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
                        {format(new Date(job.postedDate), 'MMM dd')}
                      </Text>
                    </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
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
              {t('search.filterJobs')}
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
  searchContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 2,
    borderRadius: 2,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    fontSize: 14,
  },
  filterButton: {
    marginLeft: 0,
    borderColor: COLORS.terracotta,
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
  modal: {
    backgroundColor: COLORS.white,
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: COLORS.ink,
  },
  filterLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.terracotta,
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
