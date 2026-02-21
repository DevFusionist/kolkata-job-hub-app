import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Text,
  Chip,
  Searchbar,
  Button,
  Modal,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../_lib/api';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, imageBackgroundStyleTabs, screenPaddingHorizontal } from '../_design';
import { enterFadeInDown, enterFadeInDownStagger } from '../_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeFormatDate } from '../_lib/date';

const CATEGORIES = [
  'Sales', 'Delivery', 'Retail', 'Hospitality', 'Office Work',
  'Driver', 'Warehouse', 'Restaurant', 'Security', 'Other',
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
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

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

      const response = await api.get('/jobs', { params });
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
    setTimeout(() => searchJobs(), 0);
  };

  const activeFiltersCount = [
    selectedCategory, selectedJobType, selectedExperience, selectedEducation
  ].filter(Boolean).length;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_tram_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyleTabs(colors)}
      >
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              {t('search.title')}
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <Searchbar
              placeholder={t('search.placeholder')}
              onChangeText={setSearchQuery}
              onClearIconPress={() => {
                setSearchQuery('');
                searchJobs();
              }}
              value={searchQuery}
              onSubmitEditing={searchJobs}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              iconColor={colors.terracotta}
              placeholderTextColor={colors.muted}
              // Prevents font-scaling from pushing text out of the container
              maxFontSizeMultiplier={1.2}
            />
            <Button
              mode="outlined"
              onPress={() => setFilterVisible(true)}
              style={styles.filterButton}
              contentStyle={styles.filterButtonContent}
              labelStyle={styles.filterButtonLabel}
              icon="filter-variant"
              textColor={colors.terracotta}
              compact={true} // Helps save horizontal space
            >
              {activeFiltersCount > 0 ? `${t('search.filters')} (${activeFiltersCount})` : t('search.filters')}
            </Button>
          </View>
        </View>

        {loading ? (
          <View style={[styles.centerContainer, styles.loadingWrap]}>
            <LoadingScreen fullScreen={false} message={t('search.title')} />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {jobs.length === 0 ? (
              <Animated.View entering={enterFadeInDown} style={styles.emptyContainer}>
                <MaterialCommunityIcons name="magnify" size={64} color={colors.muted} />
                <Text variant="titleMedium" style={styles.emptyText}>{t('search.noResults')}</Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>{t('search.tryAdjusting')}</Text>
              </Animated.View>
            ) : (
              jobs.map((job, index) => (
                <Animated.View key={job.id} entering={enterFadeInDownStagger(index, 50)}>
                <TouchableOpacity onPress={() => router.push(`/job-details?id=${job.id}`)} activeOpacity={0.7}>
                  <GlassCard style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text variant="titleLarge" style={styles.jobTitle}>{job.title}</Text>
                      <Chip mode="outlined" textStyle={styles.categoryText} style={styles.categoryChip}>{job.category}</Chip>
                    </View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="office-building" size={16} color={colors.terracotta} /><Text variant="bodyMedium" style={styles.jobInfoText}>{job.businessName || job.employerName}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="map-marker" size={16} color={colors.terracotta} /><Text variant="bodyMedium" style={styles.jobInfoText}>{job.location}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="currency-inr" size={16} color={colors.terracotta} /><Text variant="bodyMedium" style={styles.jobInfoText}>{job.salary}</Text></View>
                    <View style={styles.jobFooter}>
                      <Chip icon="clock-outline" compact style={styles.typeChip} textStyle={{ color: colors.text }}>{job.jobType}</Chip>
                      <Text variant="bodySmall" style={styles.dateText}>{safeFormatDate(job.postedDate, 'MMM dd')}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
                </Animated.View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        <Portal>
          <Modal visible={filterVisible} onDismiss={() => setFilterVisible(false)} contentContainerStyle={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text variant="headlineSmall" style={styles.modalTitle}>{t('search.filterJobs')}</Text>
              <Text variant="titleMedium" style={styles.filterLabel}>Category</Text>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((cat) => (
                  <Chip key={cat} selected={selectedCategory === cat} style={styles.chip} onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)} textStyle={{ color: colors.text }} selectedColor={colors.terracotta}>{cat}</Chip>
                ))}
              </View>
              <Text variant="titleMedium" style={styles.filterLabel}>Job Type</Text>
              <View style={styles.chipContainer}>
                {JOB_TYPES.map((type) => (
                  <Chip key={type} selected={selectedJobType === type} style={styles.chip} onPress={() => setSelectedJobType(selectedJobType === type ? '' : type)} textStyle={{ color: colors.text }} selectedColor={colors.terracotta}>{type}</Chip>
                ))}
              </View>
              <Text variant="titleMedium" style={styles.filterLabel}>Experience</Text>
              <View style={styles.chipContainer}>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <Chip key={exp} selected={selectedExperience === exp} style={styles.chip} onPress={() => setSelectedExperience(selectedExperience === exp ? '' : exp)} textStyle={{ color: colors.text }} selectedColor={colors.terracotta}>{exp}</Chip>
                ))}
              </View>
              <Text variant="titleMedium" style={styles.filterLabel}>Education</Text>
              <View style={styles.chipContainer}>
                {EDUCATION_LEVELS.map((edu) => (
                  <Chip key={edu} selected={selectedEducation === edu} style={styles.chip} onPress={() => setSelectedEducation(selectedEducation === edu ? '' : edu)} textStyle={{ color: colors.text }} selectedColor={colors.terracotta}>{edu}</Chip>
                ))}
              </View>
              <View style={styles.modalButtons}>
                <Button mode="outlined" onPress={clearFilters} style={styles.modalButton}>{t('search.clearAll')}</Button>
                <Button mode="contained" buttonColor={colors.terracotta} onPress={() => { setFilterVisible(false); searchJobs(); }} style={styles.modalButton}>{t('search.applyFilters')}</Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>
      </ImageBackground>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backgroundImage: { flex: 1, width: '100%' },
    stickyHeader: {
      backgroundColor: colors.background,
      zIndex: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 4,
    },
    header: { paddingHorizontal: scale(20), paddingTop: scale(12) },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    searchbar: {
      flex: 1, // Takes all available space
      height: 46,
      elevation: 0,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8, // Gap between search and button
    },
    searchInput: {
      fontSize: 13, // Slightly smaller font to fit more placeholder text
      minHeight: 46,
      paddingLeft: 0,
      marginLeft: -4, // Pulls text closer to the magnifying glass icon
      alignSelf: 'center',
    },
    filterButton: {
      minWidth: 90, // Ensures button doesn't get too small
      flexShrink: 0, // Prevents button from being squashed
      height: 46,
      borderRadius: 10,
      borderColor: colors.terracotta,
      borderWidth: 1,
      justifyContent: 'center',
    },
    filterButtonContent: {
      height: 46,
      paddingHorizontal: 2,
    },
    filterButtonLabel: {
      fontSize: 11, // Smaller label to ensure it fits next to the search bar
      marginHorizontal: 2,
      fontWeight: '600',
    },
    content: { flex: 1 },
    scrollContent: { paddingHorizontal: screenPaddingHorizontal, paddingTop: scale(16), paddingBottom: scale(120) },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingWrap: { alignSelf: 'stretch', width: '100%' },
    emptyContainer: { alignItems: 'center', marginTop: 64 },
    emptyText: { marginTop: 16, color: colors.textSecondary, textAlign: 'center' },
    emptySubtext: { marginTop: 8, color: colors.textSecondary, textAlign: 'center' },
    jobCard: { marginBottom: 16, elevation: 2 },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    jobTitle: { flex: 1, fontWeight: 'bold', color: colors.text, fontSize: 18 },
    categoryChip: { borderColor: colors.terracotta, height: 28 },
    categoryText: { color: colors.terracotta, fontSize: 10 },
    jobInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    jobInfoText: { marginLeft: 8, color: colors.text, fontSize: 14 },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border },
    typeChip: { backgroundColor: isDark ? colors.surface : colors.cream, borderRadius: 4 },
    dateText: { color: colors.textSecondary, fontSize: 12 },
    modal: { backgroundColor: colors.surface, padding: 20, margin: 20, borderRadius: 12, maxHeight: '85%' },
    modalTitle: { marginBottom: 16, fontWeight: 'bold', color: colors.text },
    filterLabel: { marginTop: 16, marginBottom: 8, color: colors.terracotta, fontWeight: '600' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { marginBottom: 4, backgroundColor: isDark ? colors.surface : colors.cream, borderColor: colors.border },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 12, paddingBottom: 8 },
    modalButton: { flex: 1 },
  });
}