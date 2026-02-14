import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Text, TextInput, Button, RadioButton, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { COLORS } from '../_theme';
import { GlassCard } from '../_components/GlassCard';

const API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://kolkata-job-hub-app-backend-production.up.railway.app';

const LANG_OPTIONS = [
  { key: 'Bengali', en: 'Bengali', bn: 'বাংলা' },
  { key: 'Hindi', en: 'Hindi', bn: 'হিন্দি' },
  { key: 'English', en: 'English', bn: 'ইংরেজি' },
];
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
  const { t, locale, setLocale } = useLanguage();
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
      Alert.alert(t('common.error'), t('register.errorFillRequired'));
      return;
    }
    if (role === 'employer' && !businessName) {
      Alert.alert(t('common.error'), t('register.errorBusinessName'));
      return;
    }
    if (role === 'seeker' && selectedSkills.length === 0) {
      Alert.alert(t('common.error'), t('register.errorSelectSkill'));
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
      const response = await axios.post(`${API_URL.replace(/\/$/, '')}/api/users`, userData);
      await login(response.data);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || t('register.errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  const langLabel = (opt: (typeof LANG_OPTIONS)[0]) => (locale === 'bn' ? opt.bn : opt.en);

  return (
    <ImageBackground
      source={require('../../assets/images/kolkata_street_nostalgia.png')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.2 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
            onPress={() => setLocale('en')}
          >
            <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>
              {t('common.english')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, locale === 'bn' && styles.langBtnActive]}
            onPress={() => setLocale('bn')}
          >
            <Text style={[styles.langBtnText, locale === 'bn' && styles.langBtnTextActive]}>
              {t('common.bengali')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>{t('login.brandTitle')}</Text>
          <Text style={styles.subTitle}>{t('register.brandSubtitle')}</Text>
          <View style={styles.underline} />
        </View>

        <GlassCard style={styles.vintageCard}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              {t('register.formTitle')}
            </Text>

            <Text style={styles.sectionLabel}>{t('register.iAm')}</Text>
            <RadioButton.Group onValueChange={setRole} value={role}>
              <View style={styles.radioRow}>
                <View style={styles.radioOption}>
                  <RadioButton value="seeker" color={COLORS.terracotta} />
                  <Text>{t('register.jobSeeker')}</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="employer" color={COLORS.terracotta} />
                  <Text>{t('register.employer')}</Text>
                </View>
              </View>
            </RadioButton.Group>

            <TextInput
              label={t('register.fullName')}
              mode="flat"
              activeUnderlineColor={COLORS.terracotta}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            {role === 'employer' && (
              <TextInput
                label={t('register.businessName')}
                mode="flat"
                activeUnderlineColor={COLORS.terracotta}
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
              />
            )}

            <TextInput
              label={t('register.locality')}
              placeholder={t('register.localityPlaceholder')}
              mode="flat"
              activeUnderlineColor={COLORS.terracotta}
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />

            <Text style={styles.sectionLabel}>{t('register.languages')}</Text>
            <View style={styles.chipContainer}>
              {LANG_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  selected={selectedLanguages.includes(opt.key)}
                  onPress={() => toggleLanguage(opt.key)}
                  selectedColor="#fff"
                  style={[
                    styles.chip,
                    selectedLanguages.includes(opt.key) && { backgroundColor: COLORS.terracotta },
                  ]}
                >
                  {langLabel(opt)}
                </Chip>
              ))}
            </View>

            {role === 'seeker' && (
              <>
                <Text style={styles.sectionLabel}>{t('register.skills')}</Text>
                <View style={styles.chipContainer}>
                  {COMMON_SKILLS.map((skill) => (
                    <Chip
                      key={skill}
                      selected={selectedSkills.includes(skill)}
                      onPress={() => toggleSkill(skill)}
                      selectedColor={COLORS.terracotta}
                      style={styles.skillChip}
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
              disabled={loading}
              contentStyle={{ height: 50 }}
              style={styles.regButton}
              labelStyle={styles.buttonLabel}
            >
              {t('register.startJourney')}
            </Button>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    flex: 1,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 8,
    gap: 8,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.terracotta,
  },
  langBtnActive: {
    backgroundColor: COLORS.terracotta,
  },
  langBtnText: {
    fontSize: 14,
    color: COLORS.terracotta,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: COLORS.cream,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandTitle: {
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    color: COLORS.terracotta,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  underline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.gold,
    marginTop: 8,
  },
  vintageCard: {
    elevation: 2,
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.ink,
    fontWeight: '600',
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: COLORS.terracotta,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#F0E68C',
  },
  skillChip: {
    borderColor: COLORS.terracotta,
    borderWidth: 1,
  },
  regButton: {
    marginTop: 30,
    backgroundColor: COLORS.terracotta,
    borderRadius: 4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
