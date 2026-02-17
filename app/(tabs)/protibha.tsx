/**
 * Protibha – AI assistant chat for job search (seeker) and job creation (employer).
 * Premium chat UI with animated typing, quick-action chips, and a polished header.
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import type { ThemeColors } from '../_theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  Easing,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ChatMessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: Date;
  payload?: {
    jobs?: Array<{
      id: string;
      title: string;
      category: string;
      description?: string;
      salary?: string;
      location?: string;
      jobType?: string;
      employerName?: string;
      businessName?: string;
      postedDate?: string;
    }>;
    jobDraft?: Record<string, string>;
    nextStep?: string;
    jobId?: string;
    applied?: number;
  };
}

interface JobDraft {
  category?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  experience?: string;
  description?: string;
}

type LastJobContext = { id: string };

// We keep last shown job IDs in a ref for apply commands.

function TypingDots({ colors }: { colors: ThemeColors }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, 150);
    setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
      {[s1, s2, s3].map((style, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.terracotta,
            },
            style,
          ]}
        />
      ))}
    </View>
  );
}

export default function ProtibhaTabScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [jobDraft, setJobDraft] = useState<JobDraft | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const lastJobsRef = useRef<LastJobContext[]>([]);
  const isEmployer = user?.role === 'employer';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Pagination state for chat history
  const [historyLoading, setHistoryLoading] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const loadedCountRef = useRef(0);
  const historyInitializedRef = useRef(false);

  const HISTORY_PAGE_SIZE = 5;

  // Load chat history on mount
  useEffect(() => {
    if (!user?.id) return;
    historyInitializedRef.current = false;
    loadChatHistory(true);
  }, [user?.id]);

  const loadChatHistory = useCallback(async (isInitial: boolean) => {
    if (!user?.id) return;
    if (historyLoading) return;

    setHistoryLoading(true);
    try {
      const before = isInitial ? 0 : loadedCountRef.current;
      const { data } = await api.get('/ai/chat/history', {
        params: { limit: HISTORY_PAGE_SIZE, before },
      });

      const serverMessages: ChatMessage[] = (data.messages || []).map((m: any, idx: number) => ({
        id: `h-${before}-${idx}-${Date.now()}`,
        role: m.role as ChatMessageRole,
        content: m.content,
        timestamp: new Date(),
        payload: m.payload || undefined,
      }));

      if (data.lastJobIds?.length) {
        lastJobsRef.current = data.lastJobIds.map((id: string) => ({ id }));
      }

      setHasMoreHistory(data.hasMore ?? false);

      if (isInitial) {
        if (serverMessages.length > 0) {
          loadedCountRef.current = serverMessages.length;
          setMessages(serverMessages);
          historyInitializedRef.current = true;
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 150);
        } else {
          // No history: send initial greeting
          historyInitializedRef.current = true;
          sendToProtibha('');
        }
      } else {
        // Prepend older messages
        loadedCountRef.current += serverMessages.length;
        setMessages((prev) => [...serverMessages, ...prev]);
      }
    } catch {
      if (isInitial) {
        historyInitializedRef.current = true;
        sendToProtibha('');
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id, historyLoading]);

  const handleScrollToTop = useCallback(() => {
    if (hasMoreHistory && !historyLoading) {
      loadChatHistory(false);
    }
  }, [hasMoreHistory, historyLoading, loadChatHistory]);

  const sendToProtibha = async (userText: string, displayLabel?: string) => {
    if (!user?.id) return;

    const isInitial = userText === '';
    const isSlashCmd = userText.startsWith('/');
    const chatContent = displayLabel || userText;
    const newMessages: { role: 'user' | 'assistant'; content: string }[] = isInitial
      ? []
      : [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user' as const, content: userText }];

    if (!isInitial) {
      setMessages((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: 'user',
          content: isSlashCmd ? `✨ ${chatContent}` : chatContent,
          timestamp: new Date(),
        },
      ]);
      setInput('');
    }
    setSending(true);

    try {
      const body: {
        messages: { role: string; content: string }[];
        jobDraft?: JobDraft | null;
        userId?: string;
        lastJobs?: LastJobContext[];
      } = {
        messages: newMessages,
        userId: user.id,
        lastJobs: lastJobsRef.current,
      };
      if (isEmployer && jobDraft) body.jobDraft = jobDraft;

      const { data } = await api.post('/ai/chat', body, {
        params: { user_id: user.id },
      });

      const reply = data.message ?? 'Something went wrong.';
      const action = data.action ?? 'message';
      const payload = data.payload ?? {};

      if (action === 'payment_required') {
        Alert.alert(t('protibha.paymentRequired'), reply, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('protibha.payNow'), onPress: () => router.push('/(tabs)/post-job') },
        ]);
      }

      if (action === 'build_resume') {
        router.push('/resume-builder');
      }

      if (payload.jobDraft) setJobDraft(payload.jobDraft);
      if (action === 'post_job_success') setJobDraft(null);

      // Update lastJobsRef from jobs or similarJobs
      const allReturnedJobs = [
        ...(Array.isArray(payload?.similarJobs) ? payload.similarJobs : []),
        ...(Array.isArray(payload?.jobs) ? payload.jobs : []),
      ];
      if (allReturnedJobs.length > 0) {
        lastJobsRef.current = allReturnedJobs
          .map((j: any) => j?.id || j?._id)
          .filter((id: any): id is string => typeof id === 'string' && /^[a-f\\d]{24}$/i.test(id))
          .map((id: string) => ({ id }));
      }

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const mainMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
          payload: Object.keys(payload).length ? payload : undefined,
        };

        let newList: ChatMessage[];
        if (last?.role === 'assistant' && isInitial) {
          newList = prev.slice(0, -1).concat({ ...last, content: reply, payload: Object.keys(payload).length ? payload : undefined });
        } else {
          newList = [...prev, mainMsg];
        }

        // If apply returned similar jobs, add them as a separate follow-up message
        if (action === 'apply_success' && Array.isArray(payload?.similarJobs) && payload.similarJobs.length > 0) {
          newList = [
            ...newList,
            {
              id: `a-sim-${Date.now()}`,
              role: 'assistant',
              content: '💡 Erokom aaro jobs aache! Dekhe nin:',
              timestamp: new Date(),
              payload: { jobs: payload.similarJobs },
            },
          ];
        }

        return newList;
      });

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('common.error');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: msg,
          timestamp: new Date(),
        },
      ]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    sendToProtibha(text);
  };

  const handleClearChat = useCallback(async () => {
    Alert.alert('Clear Chat', 'Notun chat shuru korben?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/ai/chat/clear', {}, { params: { user_id: user?.id } });
          } catch { /* ignore */ }
          setMessages([]);
          setJobDraft(null);
          lastJobsRef.current = [];
          loadedCountRef.current = 0;
          setHasMoreHistory(false);
          historyInitializedRef.current = false;
          sendToProtibha('');
        },
      },
    ]);
  }, [user?.id]);

  // Slash commands bypass AI intent detection for quick actions
  const handleChipPress = useCallback((command: string, displayLabel: string) => {
    if (sending) return;
    sendToProtibha(command, displayLabel);
  }, [sending, messages, user, jobDraft]);

  const quickChips = isEmployer
    ? [
        { key: 'post', label: t('protibha.chipPostJob'), command: '/postJob', icon: 'briefcase-plus-outline', bgIcon: 'briefcase-edit', tint: colors.terracotta },
        { key: 'find', label: t('protibha.chipFindCandidates'), command: '/findCandidates', icon: 'account-search-outline', bgIcon: 'account-group', tint: colors.gold },
        { key: 'tips', label: t('protibha.chipTips'), command: '/tips', icon: 'lightbulb-on-outline', bgIcon: 'lightbulb-on', tint: colors.bengaliRed },
      ]
    : [
        { key: 'near', label: t('protibha.chipFindJobs'), command: '/findNearByJobs', icon: 'map-marker-radius-outline', bgIcon: 'map-marker-radius', tint: colors.terracotta },
        { key: 'skills', label: t('protibha.chipMySkills'), command: '/skillsMatchingJobs', icon: 'star-outline', bgIcon: 'star-four-points', tint: colors.gold },
        { key: 'salary', label: t('protibha.chipSalary'), command: '/highestPayingJobs', icon: 'cash', bgIcon: 'cash-multiple', tint: colors.bengaliRed },
        { key: 'resume', label: t('protibha.chipBuildResume'), command: '/buildResume', icon: 'file-document-edit-outline', bgIcon: 'file-document-edit', tint: '#6B7280' },
      ];

  const renderWelcome = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.welcomeContainer}>
      <View style={styles.welcomeAvatarWrap}>
        <LinearGradient
          colors={[colors.terracotta, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeAvatarGradient}
        >
          <MaterialCommunityIcons name="robot-happy-outline" size={32} color="#fff" />
        </LinearGradient>
      </View>
      <Text variant="headlineSmall" style={styles.welcomeTitle}>
        {t('protibha.welcomeTitle')}
      </Text>
      <Text variant="bodyMedium" style={styles.welcomeText}>
        {isEmployer ? t('protibha.welcomeEmployer') : t('protibha.welcomeSeeker')}
      </Text>
      <View style={styles.chipsRow}>
        {quickChips.map((chip, idx) => (
          <Animated.View key={chip.key} entering={FadeInUp.duration(400).delay(400 + idx * 120)} style={styles.chipAnimWrap}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleChipPress(chip.command, chip.label)}
              style={[styles.quickChip, { borderColor: chip.tint + (isDark ? '40' : '30') }]}
            >
              {/* Large decorative background icon */}
              <View style={styles.chipBgIconWrap}>
                <MaterialCommunityIcons
                  name={chip.bgIcon as any}
                  size={32}
                  color={chip.tint}
                  style={{ opacity: isDark ? 0.12 : 0.1 }}
                />
              </View>
              {/* Foreground content */}
              <View style={[styles.chipIconCircle, { backgroundColor: chip.tint + '18' }]}>
                <MaterialCommunityIcons name={chip.icon as any} size={14} color={chip.tint} />
              </View>
              <Text variant="labelMedium" style={[styles.quickChipText, { color: chip.tint }]}>{chip.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const jobs = item.payload?.jobs;
    const enterAnim = isUser ? SlideInRight.duration(300) : SlideInLeft.duration(300);

    return (
      <Animated.View entering={enterAnim} layout={Layout.springify()}>
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
          {!isUser && (
            <View style={styles.avatarSmall}>
              <LinearGradient
                colors={[colors.terracotta, colors.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <MaterialCommunityIcons name="robot-happy-outline" size={18} color="#fff" />
              </LinearGradient>
            </View>
          )}
          <View style={[styles.bubbleWrap, isUser && styles.userBubbleWrap]}>
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
                {item.content}
              </Text>
              <Text style={[styles.timeText, isUser && styles.userTimeText]}>
                {format(item.timestamp, 'HH:mm')}
              </Text>
            </View>
            {jobs && (jobs.length > 0) && (
              <View style={styles.jobsBlock}>
                <Text variant="labelMedium" style={styles.jobsLabel}>
                  {t('protibha.jobsFound')}
                </Text>
                {jobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/job-details?id=${job.id}`)}
                  >
                    <View style={styles.jobCard}>
                      <View style={styles.jobCardHeader}>
                        <MaterialCommunityIcons name="briefcase-outline" size={16} color={colors.terracotta} />
                        <Text variant="titleSmall" numberOfLines={1} style={styles.jobTitle}>
                          {job.title}
                        </Text>
                      </View>
                      <View style={styles.jobCardMeta}>
                        {job.location && (
                          <View style={styles.jobMetaItem}>
                            <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} />
                            <Text variant="bodySmall" style={styles.jobMetaText} numberOfLines={1}>
                              {job.location}
                            </Text>
                          </View>
                        )}
                        {job.salary && (
                          <View style={styles.jobMetaItem}>
                            <MaterialCommunityIcons name="cash" size={12} color={colors.gold} />
                            <Text variant="bodySmall" style={styles.jobSalaryText} numberOfLines={1}>
                              {job.salary}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.jobCardFooter}>
                        <Text variant="bodySmall" style={styles.tapHint}>
                          {t('protibha.tapToView')}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.terracotta} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {isUser && (
            <View style={styles.userAvatarSmall}>
              <MaterialCommunityIcons name="account" size={18} color={colors.surface} />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.messageRow, styles.assistantRow]}>
      <View style={styles.avatarSmall}>
        <LinearGradient
          colors={[colors.terracotta, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <MaterialCommunityIcons name="robot-happy-outline" size={18} color="#fff" />
        </LinearGradient>
      </View>
      <View style={styles.typingBubble}>
        <TypingDots colors={colors} />
        <Text variant="bodySmall" style={styles.typingLabel}>{t('protibha.typing')}</Text>
      </View>
    </Animated.View>
  );

  const showWelcome = messages.length === 0 && !sending && !historyLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <LinearGradient
          colors={[colors.terracotta, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerAvatar}
        >
          <MaterialCommunityIcons name="robot-happy-outline" size={22} color="#fff" />
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text variant="titleMedium" style={styles.headerTitle}>
            {t('protibha.title')}
          </Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text variant="bodySmall" style={styles.onlineText}>
              {t('protibha.online')}
            </Text>
          </View>
        </View>
        <Text variant="bodySmall" style={styles.poweredBy}>
          {t('protibha.poweredBy')}
        </Text>
        {messages.length > 1 && (
          <TouchableOpacity
            onPress={handleClearChat}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="broom" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showWelcome ? (
          <ScrollView
            contentContainerStyle={styles.welcomeScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderWelcome()}
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              messages.length > 0 && !sending && styles.listContentWithFloatingChips,
            ]}
            onContentSizeChange={() => {
              if (!historyLoading) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={sending ? renderTypingIndicator() : null}
            ListHeaderComponent={
              hasMoreHistory ? (
                <TouchableOpacity
                  onPress={handleScrollToTop}
                  style={styles.loadMoreWrap}
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <View style={styles.loadMoreDots}>
                      <TypingDots colors={colors} />
                    </View>
                  ) : (
                    <View style={styles.loadMoreBtn}>
                      <MaterialCommunityIcons name="arrow-up-circle-outline" size={16} color={colors.terracotta} />
                      <Text variant="labelSmall" style={styles.loadMoreText}>
                        {t('protibha.loadMore') || 'Load earlier messages'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : null
            }
            onEndReachedThreshold={0.1}
            maintainVisibleContentPosition={
              Platform.OS === 'ios' ? { minIndexForVisible: 0 } : undefined
            }
          />
        )}

        {/* Floating quick chips near chat box (when there are messages) */}
        {messages.length > 0 && !sending && (
          <View style={styles.floatingChipsWrap} pointerEvents="box-none">
            <View style={[styles.floatingChipsInner, isDark && styles.floatingChipsInnerDark]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.inlineChipsRow}
                keyboardShouldPersistTaps="handled"
              >
                {quickChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.7}
                onPress={() => handleChipPress(chip.command, chip.label)}
                style={[styles.inlineChip, { borderColor: chip.tint + (isDark ? '30' : '20') }]}
                  >
                    <View style={[styles.inlineChipIcon, { backgroundColor: chip.tint + '15' }]}>
                      <MaterialCommunityIcons name={chip.icon as any} size={10} color={chip.tint} />
                    </View>
                    <Text variant="labelSmall" style={[styles.inlineChipText, { color: chip.tint }]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('protibha.placeholder')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text }]}
              multiline
              maxLength={500}
              editable={!sending}
              cursorColor={colors.terracotta}
              selectionColor={colors.terracotta + '44'}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.7}
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={
                !input.trim() || sending
                  ? [colors.border, colors.border]
                  : [colors.terracotta, colors.gold]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  const userBubbleBg = isDark ? colors.terracotta : colors.terracotta;
  const assistantBubbleBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
    },
    backBtn: {
      padding: 4,
      marginRight: 6,
    },
    headerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: {
      flex: 1,
      marginLeft: 10,
    },
    headerTitle: {
      fontWeight: '700',
      color: colors.text,
    },
    onlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 1,
    },
    onlineDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#4CAF50',
      marginRight: 4,
    },
    onlineText: {
      color: '#4CAF50',
      fontSize: 11,
    },
    poweredBy: {
      color: colors.textSecondary,
      fontSize: 10,
      fontStyle: 'italic',
    },
    clearBtn: {
      padding: 6,
      marginLeft: 6,
    },

    /* Load more history */
    loadMoreWrap: {
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    loadMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadMoreText: {
      color: colors.terracotta,
      fontSize: 11,
    },
    loadMoreDots: {
      paddingVertical: 4,
    },

    /* Welcome */
    welcomeScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 14,
    },
    welcomeContainer: {
      alignItems: 'center',
      width: '100%',
    },
    welcomeAvatarWrap: {
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.terracotta,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        },
        android: { elevation: 8 },
      }),
    },
    welcomeAvatarGradient: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeTitle: {
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    welcomeText: {
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 14,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      width: '100%',
    },
    chipAnimWrap: {
      width: '47%',
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
      overflow: 'hidden',
      position: 'relative' as const,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        android: { elevation: 2 },
      }),
    },
    chipBgIconWrap: {
      position: 'absolute' as const,
      right: -4,
      bottom: -6,
    },
    chipIconCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickChipText: {
      fontWeight: '600',
      flex: 1,
      fontSize: 11,
      lineHeight: 14,
    },

    /* Messages */
    listContent: {
      padding: 14,
      paddingBottom: 4,
      flexGrow: 1,
    },
    listContentWithFloatingChips: {
      paddingBottom: 48,
    },
    messageRow: {
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    userRow: {
      justifyContent: 'flex-end',
    },
    assistantRow: {
      justifyContent: 'flex-start',
    },
    avatarSmall: {
      marginRight: 8,
      marginBottom: 2,
    },
    avatarGradient: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userAvatarSmall: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.terracotta,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      marginBottom: 2,
    },
    bubbleWrap: {
      maxWidth: SCREEN_WIDTH * 0.72,
    },
    userBubbleWrap: {
      maxWidth: SCREEN_WIDTH * 0.72,
    },
    bubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userBubble: {
      backgroundColor: userBubbleBg,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: assistantBubbleBg,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    userBubbleText: {
      color: '#fff',
    },
    timeText: {
      color: colors.textSecondary,
      fontSize: 10,
      marginTop: 4,
      textAlign: 'right',
    },
    userTimeText: {
      color: 'rgba(255,255,255,0.6)',
    },

    /* Jobs in messages */
    jobsBlock: {
      marginTop: 8,
    },
    jobsLabel: {
      marginBottom: 6,
      color: colors.terracotta,
      fontWeight: '600',
    },
    jobCard: {
      marginBottom: 8,
      borderRadius: 12,
      padding: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
    },
    jobCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    jobTitle: {
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    jobCardMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 4,
    },
    jobMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    jobMetaText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    jobSalaryText: {
      color: colors.gold,
      fontSize: 12,
      fontWeight: '600',
    },
    jobCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 6,
      gap: 2,
    },
    tapHint: {
      color: colors.terracotta,
      fontSize: 11,
      fontStyle: 'italic',
    },

    /* Typing indicator */
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      backgroundColor: assistantBubbleBg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    typingLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontStyle: 'italic',
    },

    /* Floating chips container (above input) */
    floatingChipsWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 60,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    floatingChipsInner: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 15,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.95)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },
    floatingChipsInnerDark: {
      backgroundColor: 'rgba(30,30,30,0.98)',
    },
    /* Inline quick chips (inside floating container) */
    inlineChipsRow: {
      flexDirection: 'row',
      paddingHorizontal: 4,
      paddingVertical: 0,
      gap: 6,
      alignItems: 'center',
    },
    inlineChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      minHeight: 28,
      maxHeight: 28,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
      }),
    },
    inlineChipIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineChipText: {
      fontWeight: '500',
      fontSize: 10,
      lineHeight: 14,
    },

    /* Input bar */
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    inputWrap: {
      flex: 1,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      justifyContent: 'center',
    },
    input: {
      maxHeight: 100,
      minHeight: 42,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      fontSize: 15,
      lineHeight: 20,
    },
    sendButton: {
      marginBottom: 4,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendGradient: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
