import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ImageBackground,
} from 'react-native';
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
import type { ThemeColors } from '../_theme';

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

  const syncAuthFromEntitlements = useCallback(async (next: {
    freeJobsRemaining: number;
    paidJobsRemaining: number;
    subscriptionPlan: 'none' | 'monthly_unlimited';
    subscriptionExpiresAt: string | null;
  }) => {
    if (!user) return;
    await updateUser({
      ...user,
      freeJobsRemaining: next.freeJobsRemaining,
      paidJobsRemaining: next.paidJobsRemaining,
      subscriptionPlan: next.subscriptionPlan,
      subscriptionExpiresAt: next.subscriptionExpiresAt,
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

  function showPurchaseOptions() {
    const single = catalog.find((x) => x.itemCode === 'single_job');
    const pack = catalog.find((x) => x.itemCode === 'credits_5');
    const sub = catalog.find((x) => x.itemCode === 'subscription_monthly');
    Alert.alert('Posting Limit Reached', 'Buy extra credits or subscribe to continue posting jobs.', [
      single ? { text: `${single.label}`, onPress: () => handlePayment(single.itemCode) } : { text: 'Buy 1 Credit', onPress: () => handlePayment('single_job') },
      pack ? { text: `${pack.label}`, onPress: () => handlePayment(pack.itemCode) } : { text: 'Buy 5 Credits', onPress: () => handlePayment('credits_5') },
      sub ? { text: `${sub.label}`, onPress: () => handlePayment(sub.itemCode) } : { text: 'Subscribe', onPress: () => handlePayment('subscription_monthly') },
    ]);
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
      showPurchaseOptions();
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

  const handlePayment = async (itemCode = 'single_job') => {
    try {
      // Create Razorpay order
      const orderResponse = await api.post('/payments/create-order', { itemCode });

      // Mock payment success (in production, use Razorpay SDK)
      Alert.alert(
        'Demo Payment',
        'This is a demo. In production, Razorpay payment gateway will open here.',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await api.post('/payments/verify', {
                itemCode,
                razorpayOrderId: orderResponse.data.id,
                razorpayPaymentId: 'demo_payment_id',
                razorpaySignature: 'demo_signature',
              });

              await refreshBilling();

              Alert.alert('Success', 'Payment successful! Your posting balance is updated.');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Payment failed');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Post a Job
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Free: {entitlements?.freeJobsRemaining ?? user?.freeJobsRemaining ?? 0}
            {'  '}|{'  '}
            Paid: {entitlements?.paidJobsRemaining ?? user?.paidJobsRemaining ?? 0}
            {'  '}|{'  '}
            Plan: {entitlements?.subscriptionActive ? 'Active Subscription' : 'Free'}
            {billingLoading ? ' (syncing...)' : ''}
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView style={styles.content}>
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

              <TextInput
                label="Location in Kolkata *"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                placeholder="e.g., Salt Lake, Park Street"
              />

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
        </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
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
      padding: 24,
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
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 40,
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
    },
    button: {
      marginTop: 24,
      paddingVertical: 6,
      backgroundColor: colors.terracotta,
      borderRadius: 2,
    },
  });
}
