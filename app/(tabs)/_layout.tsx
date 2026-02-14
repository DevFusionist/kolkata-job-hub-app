import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { COLORS } from '../_theme';

export default function TabsLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEmployer = user?.role === 'employer';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.terracotta,
        tabBarInactiveTintColor: COLORS.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cream,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowColor: COLORS.terracotta,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
          href: isEmployer ? null : '/search',
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: t('tabs.postJob'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
          ),
          href: isEmployer ? '/post-job' : null,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: t('tabs.applications'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" size={size} color={color} />
          ),
          href: !isEmployer ? '/applications' : null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
