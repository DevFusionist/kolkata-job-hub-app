import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from './_lib/api';
import { useAuth } from './_contexts/AuthContext';
import { useSocket, type IncomingMessage, type ReadReceiptEvent } from './_contexts/SocketContext';
import { useTheme } from './_contexts/ThemeContext';
import { GlassCard } from './_components/GlassCard';
import { LoadingScreen } from './_components/LoadingScreen';
import type { ThemeColors } from './_theme';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from './_design';
import { enterMessageFade } from './_animations';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useLanguage } from './_contexts/LanguageContext';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const otherUserId = params.userId as string;
  const otherUserName = params.userName as string;
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { t } = useLanguage();
  const { addMessageListener, addReadReceiptListener } = useSocket();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    if (user?.id && otherUserId) {
      fetchMessages();
      markAsRead();
    }
  }, [user?.id, otherUserId]);

  // Real-time: append messages received via WebSocket for this conversation
  useEffect(() => {
    const removeListener = addMessageListener((msg: IncomingMessage) => {
      const isForThisChat =
        msg.senderId === otherUserId || msg.receiverId === otherUserId;
      if (isForThisChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, timestamp: msg.timestamp }];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        // Auto-mark incoming messages as read since the chat is open
        if (msg.senderId === otherUserId) {
          markAsRead();
        }
      }
    });
    return removeListener;
  }, [otherUserId, addMessageListener]);

  // Real-time: update read status when other user reads our messages
  useEffect(() => {
    const removeListener = addReadReceiptListener((event: ReadReceiptEvent) => {
      if (event.readBy === otherUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && !m.read ? { ...m, read: true } : m
          )
        );
      }
    });
    return removeListener;
  }, [otherUserId, addReadReceiptListener, user?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/messages/${user?.id}?other_user_id=${otherUserId}`
      );
      setMessages(response.data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 150);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert(t('common.error'), t('chat.errorLoadMessages') || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = useCallback(async () => {
    try {
      await api.put(`/messages/mark-read`, {
        otherUserId,
      });
    } catch {
      // silent - read receipts are best-effort
    }
  }, [otherUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const { data } = await api.post('/messages', {
        receiverId: otherUserId,
        jobId: '',
        message: text,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, { ...data, timestamp: data.timestamp ?? new Date().toISOString() }];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(text);
      Alert.alert(t('common.error'), t('chat.errorSendMessage') || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;

    return (
      <Animated.View
        entering={enterMessageFade}
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <GlassCard
          accent={false}
          style={[
            styles.messageCard,
            isMine ? styles.myMessage : styles.theirMessage,
          ]}
          contentStyle={styles.messageContent}
        >
          <Text variant="bodyMedium" style={[styles.messageText, { color: colors.text }]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text variant="bodySmall" style={styles.timestamp}>
              {format(new Date(item.timestamp), 'HH:mm')}
            </Text>
            {isMine && (
              <MaterialCommunityIcons
                name={item.read ? 'check-all' : 'check'}
                size={14}
                color={item.read ? colors.gold : colors.textSecondary}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.flex, { backgroundColor: colors.background }]}>
        <LoadingScreen message={otherUserName} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ImageBackground
        source={require('../assets/images/kolkata_street_nostalgia.png')}
        style={styles.backgroundImage}
        imageStyle={imageBackgroundStyle(colors)}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.terracotta}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            {otherUserName}
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={64}
                  color={colors.muted}
                />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  {t('chat.emptyChat')}
                </Text>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={t('chat.placeholder')}
              style={styles.input}
              textColor={colors.text}
              multiline
              maxLength={1000}
            />
            <IconButton
              icon="send"
              size={24}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              iconColor={colors.terracotta}
              style={styles.sendButton}
              accessibilityLabel={t('chat.send')}
            />
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
    },
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scale(24),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontWeight: 'bold',
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    messagesList: {
      padding: screenPaddingHorizontal,
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 48,
    },
    emptyText: {
      marginTop: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    messageContainer: {
      marginBottom: 12,
    },
    myMessageContainer: {
      alignItems: 'flex-end',
    },
    theirMessageContainer: {
      alignItems: 'flex-start',
    },
    messageCard: {
      maxWidth: '75%',
      elevation: 2,
    },
    myMessage: {
      borderColor: 'rgba(255,255,255,0.3)',
    },
    theirMessage: {
      borderColor: 'rgba(255,255,255,0.5)',
    },
    messageContent: {
      padding: 8,
    },
    messageText: {
      marginBottom: 4,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    timestamp: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 8,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: isDark ? colors.surface : colors.cream,
      maxHeight: 100,
    },
    sendButton: {
      marginLeft: 8,
    },
  });
}
