import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import {
  Text,
  Badge,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useSocket } from '../_contexts/SocketContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, screenPaddingHorizontal } from '../_design';
import { enterFadeInDownTiming, enterFadeInDownStaggerTiming } from '../_animations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeFormatDate } from '../_lib/date';

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: {
    message: string;
    timestamp: string;
    read: boolean;
  };
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { addMessageListener } = useSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  // Real-time: refresh conversation list when a new message is received
  useEffect(() => {
    const removeListener = addMessageListener(() => {
      fetchConversations();
    });
    return removeListener;
  }, [addMessageListener]);

  const fetchConversations = async () => {
    try {
      const response = await api.get(
        `/messages/conversations/${user?.id}`
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert(t('common.error'), t('messages.noMessages'));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={enterFadeInDownStaggerTiming(index, 40)}>
      <TouchableOpacity
        onPress={() =>
          router.push(`/chat?userId=${item.userId}&userName=${item.userName}`)
        }
        activeOpacity={0.7}
      >
        <GlassCard style={styles.conversationCard} contentStyle={styles.conversationContent}>
          <Avatar.Text
            size={48}
            label={getInitials(item.userName)}
            style={styles.avatar}
          />
          <View style={styles.conversationDetails}>
            <View style={styles.conversationHeader}>
              <Text variant="titleMedium" style={styles.userName}>
                {item.userName}
              </Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {safeFormatDate(item.lastMessage?.timestamp, 'HH:mm')}
              </Text>
            </View>
            <View style={styles.messageRow}>
              <Text
                variant="bodyMedium"
                style={styles.lastMessage}
                numberOfLines={1}
              >
                {item.lastMessage.message}
              </Text>
              {!item.lastMessage.read && <Badge size={8} style={styles.badge} />}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingScreen message={t('messages.title')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient
        colors={isDark
          ? [colors.surface, colors.background]
          : [colors.gradientStart + '18', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {t('messages.title')}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={[styles.emptyContainer, { flex: 1 }]}>
          <LoadingScreen fullScreen={false} message={t('messages.title')} />
        </View>
      ) : conversations.length === 0 ? (
        <Animated.View entering={enterFadeInDownTiming} style={styles.emptyContainer}>
          <LinearGradient colors={[colors.primary + '22', colors.secondary + '15']} style={styles.emptyIconBg}>
            <MaterialCommunityIcons name="message-outline" size={40} color={colors.primary} />
          </LinearGradient>
          <Text variant="titleMedium" style={styles.emptyText}>{t('messages.empty')}</Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>{t('messages.emptySubtext')}</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await fetchConversations(); setRefreshing(false); }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: scale(20),
      paddingTop: scale(16),
      paddingBottom: scale(14),
    },
    headerTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    content: { paddingHorizontal: screenPaddingHorizontal, paddingTop: scale(12), paddingBottom: scale(120) },
    emptyContainer: { alignItems: 'center', marginTop: 64, gap: 14 },
    emptyIconBg: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: colors.textSecondary, textAlign: 'center' },
    emptySubtext: { color: colors.muted, textAlign: 'center', fontSize: 13 },
    conversationCard: { marginBottom: 10 },
    conversationContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    avatar: { marginRight: 12, backgroundColor: colors.primary },
    conversationDetails: { flex: 1 },
    conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    userName: { fontWeight: '700', color: colors.text },
    timestamp: { color: colors.textSecondary, fontSize: 12 },
    messageRow: { flexDirection: 'row', alignItems: 'center' },
    lastMessage: { flex: 1, color: colors.textSecondary, fontSize: 13 },
    badge: { backgroundColor: colors.primary },
  });
}