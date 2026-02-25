import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { scale, screenPaddingHorizontal } from '../_design';
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
      <LinearGradient
        colors={isDark
          ? [colors.surface, colors.background]
          : [colors.gradientStart + '18', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stickyHeader}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {t('search.title')}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('search.placeholder')}
            onChangeText={setSearchQuery}
            onClearIconPress={() => { setSearchQuery(''); searchJobs(); }}
            value={searchQuery}
            onSubmitEditing={searchJobs}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor={colors.primary}
            placeholderTextColor={colors.muted}
            maxFontSizeMultiplier={1.2}
          />
          <Button
            mode="outlined"
            onPress={() => setFilterVisible(true)}
            style={styles.filterButton}
            contentStyle={styles.filterButtonContent}
            labelStyle={styles.filterButtonLabel}
            icon="filter-variant"
            textColor={colors.primary}
            compact={true}
          >
            {activeFiltersCount > 0 ? `${t('search.filters')} (${activeFiltersCount})` : t('search.filters')}
          </Button>
        </View>
      </LinearGradient>

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
              <LinearGradient colors={[colors.primary + '22', colors.secondary + '15']} style={styles.emptyIconBg}>
                <MaterialCommunityIcons name="magnify" size={40} color={colors.primary} />
              </LinearGradient>
              <Text variant="titleMedium" style={styles.emptyText}>{t('search.noResults')}</Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>{t('search.tryAdjusting')}</Text>
            </Animated.View>
          ) : (
            jobs.map((job, index) => (
              <Animated.View key={job.id} entering={enterFadeInDownStagger(index, 50)}>
                <TouchableOpacity onPress={() => router.push(`/job-details?id=${job.id}`)} activeOpacity={0.75}>
                  <GlassCard style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text variant="titleMedium" style={styles.jobTitle}>{job.title}</Text>
                      <View style={[styles.catTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
                        <Text style={[styles.catTagText, { color: colors.primary }]}>{job.category}</Text>
                      </View>
                    </View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="office-building-outline" size={14} color={colors.primary} /><Text variant="bodySmall" style={styles.jobInfoText}>{job.businessName || job.employerName}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.secondary} /><Text variant="bodySmall" style={styles.jobInfoText}>{job.location}</Text></View>
                    <View style={styles.jobInfo}><MaterialCommunityIcons name="currency-inr" size={14} color={colors.secondary} /><Text variant="bodySmall" style={[styles.jobInfoText, { color: colors.secondary, fontWeight: '700' }]}>{job.salary}</Text></View>
                    <View style={styles.jobFooter}>
                      <View style={[styles.typeTag, { backgroundColor: colors.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.typeTagText, { color: colors.textSecondary }]}>{job.jobType}</Text>
                      </View>
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
                <Chip key={cat} selected={selectedCategory === cat} style={styles.chip} onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)} textStyle={{ color: colors.text }} selectedColor={colors.primary}>{cat}</Chip>
              ))}
            </View>
            <Text variant="titleMedium" style={styles.filterLabel}>Job Type</Text>
            <View style={styles.chipContainer}>
              {JOB_TYPES.map((type) => (
                <Chip key={type} selected={selectedJobType === type} style={styles.chip} onPress={() => setSelectedJobType(selectedJobType === type ? '' : type)} textStyle={{ color: colors.text }} selectedColor={colors.primary}>{type}</Chip>
              ))}
            </View>
            <Text variant="titleMedium" style={styles.filterLabel}>Experience</Text>
            <View style={styles.chipContainer}>
              {EXPERIENCE_LEVELS.map((exp) => (
                <Chip key={exp} selected={selectedExperience === exp} style={styles.chip} onPress={() => setSelectedExperience(selectedExperience === exp ? '' : exp)} textStyle={{ color: colors.text }} selectedColor={colors.primary}>{exp}</Chip>
              ))}
            </View>
            <Text variant="titleMedium" style={styles.filterLabel}>Education</Text>
            <View style={styles.chipContainer}>
              {EDUCATION_LEVELS.map((edu) => (
                <Chip key={edu} selected={selectedEducation === edu} style={styles.chip} onPress={() => setSelectedEducation(selectedEducation === edu ? '' : edu)} textStyle={{ color: colors.text }} selectedColor={colors.primary}>{edu}</Chip>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={clearFilters} style={styles.modalButton} textColor={colors.primary}>{t('search.clearAll')}</Button>
              <Button mode="contained" buttonColor={colors.primary} onPress={() => { setFilterVisible(false); searchJobs(); }} style={styles.modalButton}>{t('search.applyFilters')}</Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    stickyHeader: { paddingBottom: 8 },
    header: { paddingHorizontal: scale(20), paddingTop: scale(14), paddingBottom: 4 },
    headerTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchbar: {
      flex: 1,
      elevation: 0,
      borderRadius: 14,
      backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    searchInput: { fontSize: 13 },
    filterButton: {
      minWidth: 90,
      flexShrink: 0,
      borderRadius: 14,
      borderColor: colors.primary,
      borderWidth: 1.5,
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    filterButtonContent: { flex: 1, paddingHorizontal: 2 },
    filterButtonLabel: { fontSize: 11, marginHorizontal: 2, fontWeight: '700' },
    content: { flex: 1 },
    scrollContent: { paddingHorizontal: screenPaddingHorizontal, paddingTop: scale(16), paddingBottom: scale(120) },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingWrap: { alignSelf: 'stretch', width: '100%' },
    emptyContainer: { alignItems: 'center', marginTop: 64, gap: 14 },
    emptyIconBg: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: colors.textSecondary, textAlign: 'center' },
    emptySubtext: { color: colors.muted, textAlign: 'center', fontSize: 13 },
    jobCard: { marginBottom: 14 },
    jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
    jobTitle: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 16 },
    catTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    catTagText: { fontSize: 11, fontWeight: '700' },
    jobInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
    jobInfoText: { color: colors.textSecondary, fontSize: 13 },
    jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    typeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeTagText: { fontSize: 12, fontWeight: '600' },
    dateText: { color: colors.muted, fontSize: 12 },
    modal: { backgroundColor: colors.surface, padding: 20, margin: 20, borderRadius: 20, maxHeight: '85%' },
    modalTitle: { marginBottom: 16, fontWeight: '800', color: colors.text },
    filterLabel: { marginTop: 16, marginBottom: 8, color: colors.primary, fontWeight: '700' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { marginBottom: 4, backgroundColor: isDark ? colors.surfaceElevated : colors.surface, borderColor: colors.border },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 12, paddingBottom: 8 },
    modalButton: { flex: 1, borderRadius: 12 },
  });
}