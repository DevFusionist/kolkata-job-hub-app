import React, { useState, useMemo } from 'react';
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
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import type { ThemeColors } from '../_theme';

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
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const phone = Array.isArray(params.phone) ? params.phone[0] : (params.phone as string);
  const registrationToken = Array.isArray(params.registrationToken)
    ? params.registrationToken[0]
    : (params.registrationToken as string);
  const [role, setRole] = useState('seeker');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSetMpin, setShowSetMpin] = useState(false);
  const [userToLogin, setUserToLogin] = useState<any>(null);
  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
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
    if (!registrationToken) {
      Alert.alert(t('common.error'), 'Registration token missing. Please verify OTP again.');
      router.replace('/(auth)/login');
      return;
    }

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
        registrationToken,
        role,
        name,
        businessName: role === 'employer' ? businessName : undefined,
        location,
        languages: selectedLanguages,
        skills: role === 'seeker' ? selectedSkills : [],
      };
      const response = await api.post('/users', userData);
      setUserToLogin(response.data);
      setShowSetMpin(true);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || t('register.errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetMpin = async () => {
    if (!mpin || mpin.length < 4 || mpin.length > 6) {
      Alert.alert(t('common.error'), t('login.errorInvalidMpin'));
      return;
    }
    if (mpin !== mpinConfirm) {
      Alert.alert(t('common.error'), t('login.errorMpinMismatch'));
      return;
    }
    setLoading(true);
    try {
      if (!userToLogin?.token) {
        Alert.alert(t('common.error'), 'Registration session expired. Please register again.');
        return;
      }
      await api.post(
        '/auth/set-mpin',
        { mpin },
        { headers: { Authorization: `Bearer ${userToLogin.token}` } }
      );
      if (userToLogin) {
        const { token, ...userData } = userToLogin;
        await login(userData, token);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || 'Failed to set MPIN');
    } finally {
      setLoading(false);
    }
  };

  const langLabel = (opt: (typeof LANG_OPTIONS)[0]) => (locale === 'bn' ? opt.bn : opt.en);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <ImageBackground
      source={require('../../assets/images/kolkata_street_nostalgia.png')}
      style={[styles.backgroundImage, { backgroundColor: colors.background }]}
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

        {showSetMpin ? (
          <GlassCard style={styles.vintageCard}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              {t('login.setMpinTitle')}
            </Text>
            <Text style={styles.setMpinHint}>{t('register.setMpinAfterRegister')}</Text>
            <TextInput
              label={t('login.enterMpin')}
              value={mpin}
              onChangeText={setMpin}
              placeholder={t('login.mpinPlaceholder')}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              mode="flat"
              activeUnderlineColor={colors.terracotta}
              textColor={colors.text}
              style={styles.input}
            />
            <TextInput
              label={t('login.setMpinConfirm')}
              value={mpinConfirm}
              onChangeText={setMpinConfirm}
              placeholder={t('login.mpinPlaceholder')}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              mode="flat"
              activeUnderlineColor={colors.terracotta}
              textColor={colors.text}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleSetMpin}
              loading={loading}
              disabled={loading}
              contentStyle={{ height: 50 }}
              style={styles.regButton}
              labelStyle={styles.buttonLabel}
            >
              {t('register.setMpin')}
            </Button>
          </GlassCard>
        ) : (
        <GlassCard style={styles.vintageCard}>
            <Text variant="headlineSmall" style={styles.formTitle}>
              {t('register.formTitle')}
            </Text>

            <Text style={styles.sectionLabel}>{t('register.iAm')}</Text>
            <RadioButton.Group onValueChange={setRole} value={role}>
              <View style={styles.radioRow}>
                <View style={styles.radioOption}>
                  <RadioButton value="seeker" color={colors.terracotta} />
                  <Text style={{ color: colors.text }}>{t('register.jobSeeker')}</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="employer" color={colors.terracotta} />
                  <Text style={{ color: colors.text }}>{t('register.employer')}</Text>
                </View>
              </View>
            </RadioButton.Group>

            <TextInput
              label={t('register.fullName')}
              mode="flat"
              activeUnderlineColor={colors.terracotta}
              textColor={colors.text}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            {role === 'employer' && (
              <TextInput
                label={t('register.businessName')}
                mode="flat"
                activeUnderlineColor={colors.terracotta}
                textColor={colors.text}
                value={businessName}
                onChangeText={setBusinessName}
                style={styles.input}
              />
            )}

            <TextInput
              label={t('register.locality')}
              placeholder={t('register.localityPlaceholder')}
              mode="flat"
              activeUnderlineColor={colors.terracotta}
              textColor={colors.text}
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
                  textStyle={{ color: selectedLanguages.includes(opt.key) ? '#fff' : colors.text }}
                  style={[
                    styles.chip,
                    selectedLanguages.includes(opt.key) && { backgroundColor: colors.terracotta },
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
                      selectedColor={colors.terracotta}
                      textStyle={{ color: colors.text }}
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    backgroundImage: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    langRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 56 : 24,
      paddingBottom: 8,
      gap: 8,
      marginBottom: 20,
      marginTop: 20,
    },
    langBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.terracotta,
    },
    langBtnActive: {
      backgroundColor: colors.terracotta,
    },
    langBtnText: {
      fontSize: 14,
      color: colors.terracotta,
      fontWeight: '600',
    },
    langBtnTextActive: {
      color: colors.cream,
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
      color: colors.terracotta,
      fontWeight: 'bold',
    },
    subTitle: {
      fontSize: 14,
      color: colors.text,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    underline: {
      width: 60,
      height: 3,
      backgroundColor: colors.gold,
      marginTop: 8,
    },
    vintageCard: {
      elevation: 2,
    },
    formTitle: {
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text,
      fontWeight: '600',
    },
    sectionLabel: {
      marginTop: 16,
      marginBottom: 8,
      fontWeight: 'bold',
      color: colors.terracotta,
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
      color: colors.text,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    chip: {
      backgroundColor: isDark ? colors.surface : '#F0EDE0',
    },
    skillChip: {
      borderColor: colors.terracotta,
      borderWidth: 1,
    },
    regButton: {
      marginTop: 30,
      backgroundColor: colors.terracotta,
      borderRadius: 4,
    },
    setMpinHint: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginBottom: 20,
      fontSize: 14,
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 1,
    },
  });
}
