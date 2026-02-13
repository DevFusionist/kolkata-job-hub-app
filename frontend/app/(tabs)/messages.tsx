import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Badge,
  ActivityIndicator,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/messages/conversations/${user?.id}`
      );
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
    >
      <Card style={styles.conversationCard}>
        <Card.Content style={styles.conversationContent}>
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
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Messages
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="message-outline"
            size={64}
            color="#ccc"
          />
          <Text variant="titleMedium" style={styles.emptyText}>
            No messages yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Start a conversation with employers or job seekers
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#ccc',
    textAlign: 'center',
  },
  conversationCard: {
    marginBottom: 12,
    elevation: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
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
  },
  timestamp: {
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
  },
  badge: {
    backgroundColor: '#6200ee',
  },
});