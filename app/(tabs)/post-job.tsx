import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Text,
  TextInput,
  Button,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LocationSelector } from '../_components/LocationSelector';
import { LoadingScreen } from '../_components/LoadingScreen';
import { PaymentModal } from '../_components/PaymentModal';
import type { ThemeColors } from '../_theme';
import { scale, imageBackgroundStyleTabs, screenPaddingHorizontal } from '../_design';
import { enterFadeInDown } from '../_animations';

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
const LANGUAGES = ['Bengali', 'Hindi', 'English'];
const COMMON_SKILLS = [
  'Sales',
  'Customer Service',
  'Driving',
  'Cooking',
  'Computer',
  'Accounting',
  'Warehouse',
  'Delivery',
];

export default function PostJobScreen() {
  const { user, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [entitlements, setEntitlements] = useState<{
    freeJobsRemaining: number;
    paidJobsRemaining: number;
    subscriptionPlan: 'none' | 'monthly_unlimited';
    subscriptionExpiresAt: string | null;
    subscriptionActive: boolean;
    canPost: boolean;
    aiFreeTokensRemaining?: number;
    aiPaidTokensRemaining?: number;
    canUseAi?: boolean;
  } | null>(null);
  const [catalog, setCatalog] = useState<Array<{
    itemCode: string;
    label: string;
    amount: number;
    purchaseType: 'credit' | 'subscription';
    creditsPurchased?: number;
    subscriptionDays?: number;
    currency?: string;
  }>>([]);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentModalFilter, setPaymentModalFilter] = useState<'job' | 'ai' | 'all'>('all');

  const syncAuthFromEntitlements = useCallback(async (next: {
    freeJobsRemaining: number;
    paidJobsRemaining: number;
    subscriptionPlan: 'none' | 'monthly_unlimited';
    subscriptionExpiresAt: string | null;
    aiFreeTokensRemaining?: number;
    aiPaidTokensRemaining?: number;
    canUseAi?: boolean;
  }) => {
    if (!user) return;
    await updateUser({
      ...user,
      freeJobsRemaining: next.freeJobsRemaining,
      paidJobsRemaining: next.paidJobsRemaining,
      subscriptionPlan: next.subscriptionPlan,
      subscriptionExpiresAt: next.subscriptionExpiresAt,
      aiFreeTokensRemaining: next.aiFreeTokensRemaining,
      aiPaidTokensRemaining: next.aiPaidTokensRemaining,
      canUseAi: next.canUseAi,
    });
  }, [user, updateUser]);

  const refreshBilling = useCallback(async () => {
    if (!user?.id) return;
    setBillingLoading(true);
    try {
      const [{ data: ent }, { data: cat }] = await Promise.all([
        api.get('/payments/entitlements'),
        api.get('/payments/catalog'),
      ]);
      setEntitlements(ent);
      setCatalog(Array.isArray(cat?.items) ? cat.items : []);
      await syncAuthFromEntitlements(ent);
    } catch {
      // best-effort only
    } finally {
      setBillingLoading(false);
    }
  }, [user?.id, syncAuthFromEntitlements]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  function showPurchaseOptions(filter: 'job' | 'ai' | 'all' = 'job') {
    setPaymentModalFilter(filter);
    setPaymentModalVisible(true);
  }

  const handlePostJob = async () => {
    // Validation
    if (!title || !category || !description || !salary || !location || !jobType || !experience || !education) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (selectedLanguages.length === 0) {
      Alert.alert('Error', 'Please select at least one language');
      return;
    }

    if (selectedSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    const fallbackSubActive = !!(
      user?.subscriptionPlan
      && user.subscriptionPlan !== 'none'
      && user.subscriptionExpiresAt
      && new Date(user.subscriptionExpiresAt).getTime() > Date.now()
    );
    const canPost = entitlements?.canPost
      ?? (fallbackSubActive || ((user?.freeJobsRemaining || 0) + (user?.paidJobsRemaining || 0) > 0));
    if (!canPost) {
      showPurchaseOptions('job');
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title,
        category,
        description,
        salary,
        location,
        jobType,
        experience,
        education,
        languages: selectedLanguages,
        skills: selectedSkills,
      };

      await api.post('/jobs', jobData);

      await refreshBilling();
      Alert.alert('Success', 'Job posted successfully!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') },
      ]);

      // Reset form
      setTitle('');
      setCategory('');
      setDescription('');
      setSalary('');
      setLocation('');
      setJobType('');
      setExperience('');
      setEducation('');
      setSelectedLanguages([]);
      setSelectedSkills([]);
    } catch (error: any) {
      console.error('Error posting job:', error);
      if (error?.response?.status === 402) {
        showPurchaseOptions();
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Failed to post job');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    refreshBilling();
  }, [refreshBilling]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
    {loading && <LoadingScreen fullScreen overlay />}
      <ImageBackground
        source={require('../../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyleTabs(colors)}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Post a Job
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Jobs — Free: {entitlements?.freeJobsRemaining ?? user?.freeJobsRemaining ?? 0}
            {' · '}Paid: {entitlements?.paidJobsRemaining ?? user?.paidJobsRemaining ?? 0}
            {' · '}{entitlements?.subscriptionActive ? '✓ Subscription' : 'Free'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitleAi}>
            AI credits — Free: {entitlements?.aiFreeTokensRemaining ?? user?.aiFreeTokensRemaining ?? 0}
            {' · '}Paid: {entitlements?.aiPaidTokensRemaining ?? user?.aiPaidTokensRemaining ?? 0}
            {billingLoading ? ' (syncing…)' : ''}
          </Text>
          <TouchableOpacity
            style={styles.addCreditsBtn}
            onPress={() => showPurchaseOptions('all')}
          >
            <Text variant="labelMedium" style={styles.addCreditsBtnText}>Add credits</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView style={styles.content}>
          <Animated.View entering={enterFadeInDown}>
          <GlassCard style={styles.card}>
              <TextInput
                label="Job Title *"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholder="e.g., Sales Executive"
              />

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Category *
              </Text>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    selected={category === cat}
                    onPress={() => setCategory(cat)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {cat}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Job Description *"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.input}
                placeholder="Describe the role, responsibilities, requirements..."
              />

              <TextInput
                label="Salary *"
                value={salary}
                onChangeText={setSalary}
                style={styles.input}
                placeholder="e.g., ₹15,000 - ₹20,000/month"
              />

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Location in Kolkata *
              </Text>
              <LocationSelector value={location} onChange={setLocation} />

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Job Type *
              </Text>
              <View style={styles.chipContainer}>
                {JOB_TYPES.map((type) => (
                  <Chip
                    key={type}
                    selected={jobType === type}
                    onPress={() => setJobType(type)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {type}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Experience Required *
              </Text>
              <View style={styles.chipContainer}>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <Chip
                    key={exp}
                    selected={experience === exp}
                    onPress={() => setExperience(exp)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {exp}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Education Required *
              </Text>
              <View style={styles.chipContainer}>
                {EDUCATION_LEVELS.map((edu) => (
                  <Chip
                    key={edu}
                    selected={education === edu}
                    onPress={() => setEducation(edu)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {edu}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Languages Required *
              </Text>
              <View style={styles.chipContainer}>
                {LANGUAGES.map((lang) => (
                  <Chip
                    key={lang}
                    selected={selectedLanguages.includes(lang)}
                    onPress={() => toggleLanguage(lang)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {lang}
                  </Chip>
                ))}
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Skills Required *
              </Text>
              <View style={styles.chipContainer}>
                {COMMON_SKILLS.map((skill) => (
                  <Chip
                    key={skill}
                    selected={selectedSkills.includes(skill)}
                    onPress={() => toggleSkill(skill)}
                    style={styles.chip}
                    textStyle={{ color: colors.text }}
                    selectedColor={colors.terracotta}
                  >
                    {skill}
                  </Chip>
                ))}
              </View>

              <Button
                mode="contained"
                onPress={handlePostJob}
                loading={loading}
                style={styles.button}
              >
                Post Job
              </Button>
          </GlassCard>
          </Animated.View>
        </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSuccess={handlePaymentSuccess}
        title="Add credits"
        subtitle="Buy job credits, subscription, or AI credits."
        filter={paymentModalFilter}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
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
    headerSubtitleAi: {
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: 13,
    },
    addCreditsBtn: {
      marginTop: 8,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.terracotta + '20',
      borderWidth: 1,
      borderColor: colors.terracotta,
    },
    addCreditsBtnText: {
      color: colors.terracotta,
      fontWeight: '600',
    },
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: screenPaddingHorizontal,
      paddingBottom: scale(120),
    },
    card: {
      elevation: 2,
      marginBottom: 16,
    },
    sectionTitle: {
      marginTop: 16,
      marginBottom: 8,
      color: colors.terracotta,
      fontWeight: '600',
    },
    input: {
      marginBottom: 16,
      backgroundColor: 'transparent',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      marginRight: 4,
      marginBottom: 4,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    button: {
      marginTop: 24,
      paddingVertical: 6,
      backgroundColor: colors.terracotta,
      borderRadius: 2,
    },
  });
}
