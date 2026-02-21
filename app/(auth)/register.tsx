import React, { useState, useMemo, useEffect } from 'react';
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
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useAuthBack } from '../_contexts/AuthBackContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LocationSelector } from '../_components/LocationSelector';
import { LoadingScreen } from '../_components/LoadingScreen';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from '../_design';

/* ---------- CONSTANTS ---------- */

const LANG_OPTIONS = ['Bengali', 'Hindi', 'English'];
const COMMON_SKILLS = [
  'Sales',
  'Customer Service',
  'Driving',
  'Cooking',
  'Computer',
  'Accounting',
  'Warehouse',
  'Delivery',
  'Cleaning',
  'Security',
];
const EDUCATION_LEVELS = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
];
const EXPERIENCE_RANGES = [
  'Fresher',
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
];

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { login } = useAuth();
  const { setBackOptions } = useAuthBack();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    setBackOptions({
      show: true,
      onBack: () => router.back(),
      disabled: false,
    });
    return () => {
      setBackOptions({ show: false, onBack: () => {}, disabled: false });
    };
  }, [setBackOptions, router]);

  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const registrationToken = Array.isArray(params.registrationToken)
    ? params.registrationToken[0]
    : params.registrationToken;

  /* ---------- STATE ---------- */

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [roleWidth, setRoleWidth] = useState(0);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [education, setEducation] = useState('10th Pass');
  const [experience, setExperience] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'Bengali',
  ]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');

  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

  const [userToLogin, setUserToLogin] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- ANIMATION ---------- */

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((step + 1) / 5, { duration: 350 });
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  /* ---------- ROLE SLIDER ---------- */

  const roleX = useSharedValue(0);

  useEffect(() => {
    roleX.value = withSpring(role === 'seeker' ? 0 : 1);
  }, [role]);

  const roleSlider = useAnimatedStyle(() => ({
    transform: [{ translateX: roleX.value * roleWidth }],
  }));

  const styles = useMemo(() => createStyles(colors), [colors]);

  /* ---------- REGISTER ---------- */

  const handleRegister = async () => {
    if (!name?.trim()) {
      return Alert.alert(t('common.error'), t('register.errorFullName'));
    }
    if (!location?.trim()) {
      return Alert.alert(t('common.error'), t('register.errorLocation'));
    }
    if (selectedLanguages.length === 0) {
      return Alert.alert(t('common.error'), t('register.errorSelectLanguage'));
    }
    if (role === 'seeker' && selectedSkills.length === 0) {
      return Alert.alert(t('common.error'), t('register.errorSelectSkill'));
    }
    if (role === 'employer' && !businessName?.trim()) {
      return Alert.alert(t('common.error'), t('register.errorBusinessName'));
    }
    if (role === 'employer' && !industry?.trim()) {
      return Alert.alert(t('common.error'), t('register.errorIndustry'));
    }

    setLoading(true);
    try {
      const payload = {
        phone,
        registrationToken,
        role,
        name,
        location,
        education,
        experience,
        expectedSalary,
        skills: selectedSkills,
        languages: selectedLanguages,
        businessName,
        industry,
      };

      const { data } = await api.post('/users', payload);
      setUserToLogin(data);
      setStep(4);
    } catch {
      Alert.alert(t('common.error'), t('register.errorRegister'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetMpin = async () => {
    if (mpin.length < 4) {
      return Alert.alert(t('common.error'), t('login.errorInvalidMpin'));
    }
    if (mpin !== mpinConfirm) {
      return Alert.alert(t('common.error'), t('login.errorMpinMismatch'));
    }

    await api.post(
      '/auth/set-mpin',
      { mpin },
      {
        headers: { Authorization: `Bearer ${userToLogin.token}` },
      }
    );

    await login(userToLogin, userToLogin.token);
    router.replace('/(tabs)');
  };

  /* ---------- STEPS ---------- */

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Text style={styles.title}>Who are you?</Text>

            <View
              style={styles.roleBox}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setRoleWidth(w / 2);
              }}
            >
              <Animated.View
                style={[
                  styles.roleSlider,
                  roleSlider,
                  { width: roleWidth },
                ]}
              />

              <TouchableOpacity
                style={styles.roleBtn}
                onPress={() => setRole('seeker')}
              >
                <Text
                  style={{
                    color: role === 'seeker' ? '#000' : '#888',
                  }}
                >
                  Job Seeker
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.roleBtn}
                onPress={() => setRole('employer')}
              >
                <Text
                  style={{
                    color: role === 'employer' ? '#000' : '#888',
                  }}
                >
                  Employer
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label={t('register.fullName')}
              placeholder={t('register.fullNamePlaceholder')}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={() => {
                if (!name?.trim()) {
                  Alert.alert(t('common.error'), t('register.errorFullName'));
                  return;
                }
                setStep(1);
              }}
              style={styles.mainBtn}
            >
              Continue
            </Button>
          </>
        );

      case 1:
        return role === 'seeker' ? (
          <>
            <Text style={styles.title}>Your experience</Text>

            <ScrollView>
              <Text style={styles.fieldHint}>{t('register.education')}</Text>
              <View style={styles.chipRow}>
                {EDUCATION_LEVELS.map((e) => (
                  <Chip
                    key={e}
                    selected={education === e}
                    onPress={() => setEducation(e)}
                    style={styles.chip}
                  >
                    {e}
                  </Chip>
                ))}
              </View>

              <Text style={[styles.fieldHint, { marginTop: 12 }]}>{t('register.experience')}</Text>
              <Text style={styles.fieldHintSub}>{t('register.experienceRange')}</Text>
              <View style={styles.chipRow}>
                {EXPERIENCE_RANGES.map((r) => (
                  <Chip
                    key={r}
                    selected={experience === r}
                    onPress={() => setExperience(r)}
                    style={styles.chip}
                  >
                    {r}
                  </Chip>
                ))}
              </View>

              <TextInput
                label={t('register.expectedSalary')}
                placeholder={t('register.expectedSalaryPlaceholder')}
                value={expectedSalary}
                onChangeText={setExpectedSalary}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={() => {
                  if (!experience?.trim()) {
                    Alert.alert(t('common.error'), t('register.errorExperience'));
                    return;
                  }
                  if (!expectedSalary?.trim()) {
                    Alert.alert(t('common.error'), t('register.errorExpectedSalary'));
                    return;
                  }
                  setStep(2);
                }}
                style={styles.mainBtn}
              >
                Continue
              </Button>
            </ScrollView>
          </>
        ) : (
          <>
            <Text style={styles.title}>Business Info</Text>
            <TextInput
              label={t('register.businessName')}
              placeholder={t('register.businessNamePlaceholder')}
              value={businessName}
              onChangeText={setBusinessName}
              style={styles.input}
            />
            <TextInput
              label={t('register.industry')}
              placeholder={t('register.industryPlaceholder')}
              value={industry}
              onChangeText={setIndustry}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={() => {
                if (!businessName?.trim()) {
                  Alert.alert(t('common.error'), t('register.errorBusinessName'));
                  return;
                }
                if (!industry?.trim()) {
                  Alert.alert(t('common.error'), t('register.errorIndustry'));
                  return;
                }
                setStep(2);
              }}
              style={styles.mainBtn}
            >
              Continue
            </Button>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.title}>Location</Text>
            <Text style={styles.fieldHintSub}>{t('register.localityPlaceholder')}</Text>
            <LocationSelector value={location} onChange={setLocation} />

            <Button
              mode="contained"
              onPress={() => {
                if (!location?.trim()) {
                  Alert.alert(t('common.error'), t('register.errorLocation'));
                  return;
                }
                setStep(3);
              }}
              style={styles.mainBtn}
            >
              Continue
            </Button>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.title}>Skills & Languages</Text>
            <Text style={styles.fieldHintSub}>{t('register.languages')}</Text>
            <View style={styles.chipRow}>
              {LANG_OPTIONS.map((l) => (
                <Chip
                  key={l}
                  selected={selectedLanguages.includes(l)}
                  onPress={() =>
                    setSelectedLanguages((prev) =>
                      prev.includes(l)
                        ? prev.filter((i) => i !== l)
                        : [...prev, l]
                    )
                  }
                  style={styles.chip}
                >
                  {l}
                </Chip>
              ))}
            </View>

            {role === 'seeker' && (
              <>
                <Text style={[styles.fieldHint, { marginTop: 8 }]}>{t('register.skills')}</Text>
                <View style={styles.chipRow}>
                {COMMON_SKILLS.map((s) => (
                  <Chip
                    key={s}
                    selected={selectedSkills.includes(s)}
                    onPress={() =>
                      setSelectedSkills((prev) =>
                        prev.includes(s)
                          ? prev.filter((i) => i !== s)
                          : [...prev, s]
                      )
                    }
                    style={styles.chip}
                  >
                    {s}
                  </Chip>
                ))}
                </View>
              </>
            )}

            <Button
              mode="contained"
              loading={loading}
              onPress={handleRegister}
              style={styles.mainBtn}
            >
              Create Profile
            </Button>
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.title}>Secure your account</Text>
            <Text style={styles.fieldHintSub}>{t('register.mpinHint')}</Text>

            <TextInput
              label={t('login.enterMpin')}
              placeholder={t('register.mpinHint')}
              value={mpin}
              onChangeText={setMpin}
              secureTextEntry
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              label={t('login.setMpinConfirm')}
              placeholder={t('register.mpinHint')}
              value={mpinConfirm}
              onChangeText={setMpinConfirm}
              secureTextEntry
              keyboardType="number-pad"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSetMpin}
              style={styles.mainBtn}
            >
              Finish
            </Button>
          </>
        );
    }
  };

  /* ---------- UI ---------- */

  return (
    <View style={styles.bg}>
    <ImageBackground
      source={require('../../assets/images/kolkata_street_nostalgia.png')}
      style={styles.bg}
      imageStyle={imageBackgroundStyle(colors)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.progress}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>

          <GlassCard>
            <Animated.View
              key={step}
              entering={FadeInDown.springify()}
              exiting={FadeOutUp}
              layout={LinearTransition.springify()}
            >
              {renderStep()}
            </Animated.View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
    {loading && <LoadingScreen fullScreen overlay />}
    </View>
  );
}

/* ---------- STYLES ---------- */

const createStyles = (colors: any) =>
  StyleSheet.create({
    bg: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: scale(20) },

    progress: {
      height: 4,
      backgroundColor: colors.cream,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressFill: {
      height: 4,
      backgroundColor: colors.ink,
    },

    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    fieldHint: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: colors.text },
    fieldHintSub: { fontSize: 12, marginBottom: 8, color: colors.textSecondary },

    input: { marginBottom: 10 },

    mainBtn: { marginTop: 20 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip: { backgroundColor: colors.cream, borderColor: colors.border },

    roleBox: {
      flexDirection: 'row',
      backgroundColor: colors.cream,
      borderRadius: 12,
      marginBottom: 20,
      overflow: 'hidden',
    },
    roleSlider: {
      position: 'absolute',
      height: '100%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 4,
    },
    roleBtn: { flex: 1, padding: 12, alignItems: 'center' },
  });
