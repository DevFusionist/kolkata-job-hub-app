import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Card, RadioButton, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const [role, setRole] = useState('seeker');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

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

  const handleRegister = async () => {
    if (!name || !location || selectedLanguages.length === 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (role === 'employer' && !businessName) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }

    if (role === 'seeker' && selectedSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one skill');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        phone,
        role,
        name,
        businessName: role === 'employer' ? businessName : undefined,
        location,
        languages: selectedLanguages,
        skills: role === 'seeker' ? selectedSkills : [],
      };

      const response = await axios.post(`${API_URL}/api/users`, userData);
      await login(response.data);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Complete Your Profile
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              I am a:
            </Text>
            <RadioButton.Group onValueChange={setRole} value={role}>
              <View style={styles.radioRow}>
                <RadioButton.Item label="Job Seeker" value="seeker" />
                <RadioButton.Item label="Employer" value="employer" />
              </View>
            </RadioButton.Group>

            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            {role === 'employer' && (
              <TextInput
                label="Business Name *"
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
              />
            )}

            <TextInput
              label="Location in Kolkata *"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Salt Lake, Park Street"
              style={styles.input}
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Languages Known *
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

            {role === 'seeker' && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Skills *
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
              </>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            >
              Complete Registration
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 48,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
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
  },
});