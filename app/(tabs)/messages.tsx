import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Badge,
  ActivityIndicator,
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
import type { ThemeColors } from '../_theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

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
  const { colors } = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const renderConversation = ({ item }: { item: Conversation }) => (
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
                {format(new Date(item.lastMessage.timestamp), 'HH:mm')}
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
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.terracotta} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            {t('messages.title')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.terracotta} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="message-outline"
              size={64}
              color={colors.muted}
            />
            <Text variant="titleMedium" style={styles.emptyText}>
              {t('messages.empty')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {t('messages.emptySubtext')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.content}
          />
        )}
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
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      padding: 16,
      paddingBottom: 40,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 64,
    },
    emptyText: {
      marginTop: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: 8,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    conversationCard: {
      marginBottom: 12,
      elevation: 2,
    },
    conversationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    avatar: {
      marginRight: 12,
      backgroundColor: colors.terracotta,
    },
    conversationDetails: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    userName: {
      fontWeight: 'bold',
      color: colors.text,
    },
    timestamp: {
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lastMessage: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
    },
    badge: {
      backgroundColor: colors.terracotta,
    },
  });
}