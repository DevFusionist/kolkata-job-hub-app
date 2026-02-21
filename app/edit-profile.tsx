import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useLanguage } from './_contexts/LanguageContext';
import { useTheme } from './_contexts/ThemeContext';
import Animated from 'react-native-reanimated';
import { GlassCard } from './_components/GlassCard';
import { LocationSelector } from './_components/LocationSelector';
import { LoadingScreen } from './_components/LoadingScreen';
import { enterFadeInDown } from './_animations';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from './_design';

const LANG_OPTIONS = ['Bengali', 'Hindi', 'English'];
const COMMON_SKILLS = [
  'Sales', 'Customer Service', 'Driving', 'Cooking', 'Computer',
  'Accounting', 'Warehouse', 'Delivery', 'Cleaning', 'Security',
];
const EXPERIENCE_RANGES = [
  'Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years',
];

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const isEmployer = user?.role === 'employer';
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(user?.name ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [experience, setExperience] = useState(user?.experience ?? '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    user?.languages?.length ? [...user.languages] : ['Bengali']
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.skills?.length ? [...user.skills] : []
  );
  const [businessName, setBusinessName] = useState(user?.businessName ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLocation(user.location ?? '');
      setExperience(user.experience ?? '');
      setSelectedLanguages(user.languages?.length ? [...user.languages] : ['Bengali']);
      setSelectedSkills(user.skills?.length ? [...user.skills] : []);
      setBusinessName(user.businessName ?? '');
    }
  }, [user?.id]);

  const handleSave = async () => {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert(t('common.error'), t('register.errorFullName'));
      return;
    }
    if (!location?.trim()) {
      Alert.alert(t('common.error'), t('register.errorLocation'));
      return;
    }
    if (isEmployer && (!businessName?.trim() || businessName.trim().length < 2)) {
      Alert.alert(t('common.error'), t('register.errorBusinessName'));
      return;
    }
    if (!experience?.trim()) {
      Alert.alert(t('common.error'), t('register.errorExperience'));
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        location: location.trim(),
        experience: experience.trim(),
        languages: selectedLanguages.length ? selectedLanguages : ['Bengali'],
        skills: selectedSkills,
      };
      if (isEmployer) payload.businessName = businessName.trim();

      const { data } = await api.put(`/users/${user.id}`, payload);
      await updateUser({ ...user, ...data });
      Alert.alert(t('common.success'), t('profile.profileUpdated') || 'Profile updated');
      router.back();
    } catch (err: any) {
      Alert.alert(
        t('common.error'),
        err.response?.data?.detail || err.message || 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t('profile.editProfile') || 'Edit Profile', headerBackTitle: t('common.back') }} />
      <View style={styles.bg}>
        <ImageBackground
          source={require('../assets/images/kolkata_street_nostalgia.png')}
          style={StyleSheet.absoluteFill}
          imageStyle={imageBackgroundStyle(colors)}
        >
          <KeyboardAvoidingView
            style={styles.kav}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={enterFadeInDown}>
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>{t('register.fullName')}</Text>
                <TextInput
                  label={t('register.fullName')}
                  placeholder={t('register.fullNamePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                />

                <Text style={styles.sectionTitle}>{t('register.location')}</Text>
                <LocationSelector value={location} onChange={setLocation} />

                {isEmployer && (
                  <>
                    <Text style={styles.sectionTitle}>{t('register.businessName')}</Text>
                    <TextInput
                      label={t('register.businessName')}
                      placeholder={t('register.businessNamePlaceholder')}
                      value={businessName}
                      onChangeText={setBusinessName}
                      style={styles.input}
                      mode="outlined"
                    />
                  </>
                )}

                {user?.role === 'seeker' && (
                  <>
                    <Text style={styles.sectionTitle}>{t('register.experience')}</Text>
                    <View style={styles.chipRow}>
                      {EXPERIENCE_RANGES.map((r) => (
                        <Chip
                          key={r}
                          selected={experience === r}
                          onPress={() => setExperience(r)}
                          style={styles.chip}
                          textStyle={{ color: colors.text }}
                        >
                          {r}
                        </Chip>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.sectionTitle}>{t('register.languages')}</Text>
                <View style={styles.chipRow}>
                  {LANG_OPTIONS.map((l) => (
                    <Chip
                      key={l}
                      selected={selectedLanguages.includes(l)}
                      onPress={() =>
                        setSelectedLanguages((prev) =>
                          prev.includes(l) ? prev.filter((i) => i !== l) : [...prev, l]
                        )
                      }
                      style={styles.chip}
                      textStyle={{ color: colors.text }}
                    >
                      {l}
                    </Chip>
                  ))}
                </View>

                {user?.role === 'seeker' && (
                  <>
                    <Text style={styles.sectionTitle}>{t('register.skills')}</Text>
                    <View style={styles.chipRow}>
                      {COMMON_SKILLS.map((s) => (
                        <Chip
                          key={s}
                          selected={selectedSkills.includes(s)}
                          onPress={() =>
                            setSelectedSkills((prev) =>
                              prev.includes(s) ? prev.filter((i) => i !== s) : [...prev, s]
                            )
                          }
                          style={styles.chip}
                          textStyle={{ color: colors.text }}
                        >
                          {s}
                        </Chip>
                      ))}
                    </View>
                  </>
                )}

                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving}
                  style={styles.saveBtn}
                >
                  {t('common.save')}
                </Button>
              </GlassCard>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
        {saving && <LoadingScreen fullScreen overlay />}
      </View>
    </>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    bg: { flex: 1 },
    kav: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
      padding: screenPaddingHorizontal,
      paddingBottom: scale(40),
    },
    card: { padding: scale(16), marginTop: scale(16) },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 12,
      color: colors.text,
    },
    input: { marginBottom: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      marginRight: 4,
      marginBottom: 4,
    },
    saveBtn: { marginTop: 24, backgroundColor: colors.terracotta },
  });
}
