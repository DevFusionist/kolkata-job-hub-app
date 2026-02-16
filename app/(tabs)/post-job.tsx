import React, { useState, useMemo } from 'react';
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
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

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

    // Check if user has free jobs
    if (user?.freeJobsRemaining === 0) {
      Alert.alert(
        'Payment Required',
        'You have used all your free job posts. Pay ₹50 to post this job.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay Now', onPress: handlePayment },
        ]
      );
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

      await api.post(
        `/jobs?employer_id=${user?.id}`,
        jobData
      );

      // Update user's free jobs count
      if (user) {
        const updatedUser = {
          ...user,
          freeJobsRemaining: user.freeJobsRemaining - 1,
        };
        await updateUser(updatedUser);
      }

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
      Alert.alert('Error', error.response?.data?.detail || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Create Razorpay order
      const orderResponse = await api.post(
        `/payments/create-order?employer_id=${user?.id}`,
        { amount: 5000 } // ₹50 in paise
      );

      // Mock payment success (in production, use Razorpay SDK)
      Alert.alert(
        'Demo Payment',
        'This is a demo. In production, Razorpay payment gateway will open here.',
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              await api.post(
                `/payments/verify?employer_id=${user?.id}`,
                {
                  razorpayOrderId: orderResponse.data.id,
                  razorpayPaymentId: 'demo_payment_id',
                  razorpaySignature: 'demo_signature',
                }
              );

              // Update user's free jobs count
              if (user) {
                const updatedUser = {
                  ...user,
                  freeJobsRemaining: user.freeJobsRemaining + 1,
                };
                await updateUser(updatedUser);
              }

              Alert.alert('Success', 'Payment successful! You can now post your job.');
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
            Free jobs remaining: {user?.freeJobsRemaining || 0}
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

function createStyles(colors: ThemeColors) {
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
