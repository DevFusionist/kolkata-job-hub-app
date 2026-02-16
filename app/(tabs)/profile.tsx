import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  List,
  Divider,
  Chip,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from '../_theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark, setThemeMode } = useTheme();
  const [portfolioRawText, setPortfolioRawText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();
  const isEmployer = user?.role === 'employer';
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
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
            {t('profile.title')}
          </Text>
        </View>

        <ScrollView style={styles.content}>
        <GlassCard style={styles.card}>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons
                name={isEmployer ? 'briefcase' : 'account'}
                size={64}
                color={colors.terracotta}
              />
              <Text variant="headlineSmall" style={styles.name}>
                {user?.name}
              </Text>
              <Chip mode="outlined" style={styles.roleChip}>
                {isEmployer ? t('profile.employer') : t('profile.jobSeeker')}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title={t('profile.phone')}
              description={`+91 ${user?.phone}`}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />

            <List.Item
              title={t('profile.location')}
              description={user?.location}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
            />

            {isEmployer && user?.businessName && (
              <List.Item
                title={t('profile.business')}
                description={user.businessName}
                left={(props) => <List.Icon {...props} icon="office-building" />}
              />
            )}

            {isEmployer && (
              <List.Item
                title={t('profile.freeJobsRemaining')}
                description={`${user?.freeJobsRemaining || 0} ${t('profile.posts')}`}
                left={(props) => <List.Icon {...props} icon="ticket" />}
              />
            )}

            <Divider style={styles.divider} />

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('profile.languages')}
              </Text>
              <View style={styles.chipContainer}>
                {user?.languages?.map((lang) => (
                  <Chip key={lang} style={styles.chip}>
                    {lang}
                  </Chip>
                ))}
              </View>
            </View>

            {!isEmployer && user?.skills && (user.skills.length > 0) && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('profile.skills')}
                </Text>
                <View style={styles.chipContainer}>
                  {user.skills.map((skill) => (
                    <Chip key={skill} style={styles.chip}>
                      {skill}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
        </GlassCard>

        {!isEmployer && (
          <GlassCard style={styles.card}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('profile.improveWithAi')}
            </Text>
            <Text variant="bodySmall" style={styles.portfolioHint}>
              {t('profile.improveWithAiDesc')}
            </Text>
            <TextInput
              value={portfolioRawText}
              onChangeText={setPortfolioRawText}
              placeholder="e.g. 2 years delivery experience, know Salt Lake area, Hindi and Bengali..."
              multiline
              numberOfLines={4}
              style={styles.portfolioInput}
              editable={!analyzing}
            />
            <Button
              mode="contained"
              onPress={async () => {
                if (!portfolioRawText.trim() || !user?.id) return;
                setAnalyzing(true);
                try {
                  const { data } = await api.post(
                    '/ai/analyze-portfolio',
                    { seeker_id: user.id, rawText: portfolioRawText.trim(), projects: [], links: [] }
                  );
                  const newSkills = data.skills || [];
                  const merged = [...new Set([...(user.skills || []), ...newSkills])].slice(0, 30);
                  await updateUser({ ...user, skills: merged });
                  setPortfolioRawText('');
                  Alert.alert(t('common.success'), t('profile.skillsExtracted'));
                } catch (err: any) {
                  Alert.alert(t('common.error'), err.response?.data?.detail || err.message || 'Analysis failed');
                } finally {
                  setAnalyzing(false);
                }
              }}
              loading={analyzing}
              disabled={!portfolioRawText.trim() || analyzing}
              style={styles.analyzeButton}
            >
              {analyzing ? t('profile.analyzing') : t('profile.improveWithAi')}
            </Button>
          </GlassCard>
        )}

        <GlassCard style={styles.card}>
            <List.Item
              title={t('profile.appearance')}
              description={isDark ? t('profile.darkMode') : t('profile.lightMode')}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDark}
                  onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
                  color={colors.terracotta}
                />
              )}
            />
            <List.Item
              title={t('profile.editProfile')}
              left={(props) => <List.Icon {...props} icon="pencil" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(t('profile.comingSoon'), t('profile.editProfileSoon'))}
            />

            {isEmployer && (
              <List.Item
                title={t('profile.purchaseJobPosts')}
                description={t('profile.perPost')}
                left={(props) => <List.Icon {...props} icon="cart" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/(tabs)/post-job')}
              />
            )}

            <List.Item
              title={t('profile.helpSupport')}
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(t('profile.helpSupport'), t('profile.supportContact'))}
            />

            <List.Item
              title={t('profile.about')}
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() =>
                Alert.alert(
                  t('profile.about'),
                  `${t('profile.aboutText')}\n\n${t('profile.version')}`
                )
              }
            />
        </GlassCard>

        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor={colors.bengaliRed}
        >
          {t('profile.logout')}
        </Button>
        </ScrollView>
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
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      marginBottom: 16,
      elevation: 2,
    },
    profileHeader: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    name: {
      marginTop: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    roleChip: {
      marginTop: 8,
    },
    divider: {
      marginVertical: 16,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      marginBottom: 8,
      color: colors.text,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      marginRight: 4,
      marginBottom: 4,
    },
    logoutButton: {
      marginVertical: 16,
      borderColor: colors.bengaliRed,
    },
    portfolioHint: {
      color: colors.textSecondary,
      marginBottom: 12,
    },
    portfolioInput: {
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    analyzeButton: {
      backgroundColor: colors.terracotta,
      borderRadius: 2,
    },
  });
}