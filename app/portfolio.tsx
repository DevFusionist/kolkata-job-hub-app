import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Stack } from 'expo-router';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useLanguage } from './_contexts/LanguageContext';
import { useTheme } from './_contexts/ThemeContext';
import { GlassCard } from './_components/GlassCard';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from './_design';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ThemeColors } from './_theme';

type PortfolioData = {
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  generatedResumeUrl?: string | null;
  rawText?: string | null;
  projects?: Array<{ name?: string } | string>;
  links?: string[];
} | null;

export default function PortfolioScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData>(null);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const isSeeker = user?.role === 'seeker';

  const fetchPortfolio = useCallback(async () => {
    if (!user?.id || !isSeeker) return;
    try {
      const { data } = await api.get(`/portfolios/seeker/${user.id}`);
      setPortfolio(data ?? null);
    } catch {
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isSeeker]);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [fetchPortfolio])
  );

  if (!isSeeker) {
    router.replace('/(tabs)/profile');
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ title: t('profile.portfolio'), headerBackTitle: t('common.back') }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ImageBackground
          source={require('../assets/images/kolkata_street_nostalgia.png')}
          style={styles.backgroundImage}
          imageStyle={imageBackgroundStyle(colors)}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.terracotta} />
            </TouchableOpacity>
            <Text variant="titleLarge" style={styles.headerTitle}>
              {t('profile.portfolio')}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <Text variant="bodyMedium" style={styles.placeholder}>{t('common.loading')}</Text>
            ) : !portfolio ? (
              <GlassCard style={styles.card}>
                <Text variant="bodyMedium" style={styles.placeholder}>
                  {t('profile.portfolioEmpty')}
                </Text>
                <Button mode="outlined" onPress={() => router.back()} style={styles.backButton} textColor={colors.terracotta}>
                  {t('common.back')}
                </Button>
              </GlassCard>
            ) : (
              <>
                {(portfolio &&
                  ((portfolio.rawText || (portfolio.projects?.length ?? 0) > 0 || (portfolio.links?.length ?? 0) > 0) ||
                    (user?.skills?.length ?? 0) > 0)) && (
                  <GlassCard style={styles.card}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t('profile.savedPortfolio')}
                    </Text>
                    {portfolio.rawText ? (
                      <View style={styles.block}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
                          {t('profile.savedExperience')}
                        </Text>
                        <Text variant="bodySmall" style={styles.bodyText}>
                          {portfolio.rawText}
                        </Text>
                      </View>
                    ) : null}
                    {portfolio.projects?.length ? (
                      <View style={styles.block}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
                          {t('profile.savedProjects')}
                        </Text>
                        <View style={styles.chipContainer}>
                          {portfolio.projects.map((p, i) => (
                            <Chip key={i} style={styles.chip} textStyle={{ color: colors.text }}>
                              {typeof p === 'string' ? p : (p?.name ?? '')}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    ) : null}
                    {portfolio.links?.length ? (
                      <View style={styles.block}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
                          {t('profile.savedLinks')}
                        </Text>
                        {portfolio.links.map((link, i) => (
                          <Text
                            key={i}
                            variant="bodySmall"
                            style={[styles.bodyText, styles.link]}
                            onPress={() => link && Linking.openURL(link.startsWith('http') ? link : `https://${link}`)}
                          >
                            {link}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {(user?.skills?.length ?? 0) > 0 && (
                      <View style={styles.block}>
                        <Text variant="labelSmall" style={styles.fieldLabel}>
                          {t('profile.skills')}
                        </Text>
                        <View style={styles.chipContainer}>
                          {user.skills.map((skill) => (
                            <Chip key={skill} style={styles.chip} textStyle={{ color: colors.text }}>
                              {skill}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}
                  </GlassCard>
                )}

                <Button mode="outlined" onPress={() => router.back()} style={styles.backButton} textColor={colors.terracotta}>
                  {t('common.back')}
                </Button>
              </>
            )}
          </ScrollView>
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1, width: '100%' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scale(24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBackBtn: { marginRight: 16 },
    headerTitle: {
      flex: 1,
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    headerSpacer: { width: 40 },
    content: { flex: 1 },
    scrollContent: {
      paddingHorizontal: screenPaddingHorizontal,
      paddingTop: scale(16),
      paddingBottom: scale(80),
    },
    card: { marginBottom: 16 },
    sectionTitle: { color: colors.text, marginBottom: 8 },
    placeholder: { color: colors.textSecondary, textAlign: 'center', padding: 16 },
    block: { marginTop: 12 },
    fieldLabel: { color: colors.textSecondary, marginBottom: 4 },
    bodyText: { color: colors.text },
    link: { textDecorationLine: 'underline', color: colors.terracotta, marginBottom: 4 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      marginRight: 4,
      marginBottom: 4,
      backgroundColor: isDark ? colors.surface : colors.cream,
      borderColor: colors.border,
    },
    backButton: { marginVertical: 16, borderColor: colors.terracotta },
  });
}
