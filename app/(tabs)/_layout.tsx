import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { FloatingAssistant } from '../_components/FloatingAssistant';
import { OfflineBanner } from '../_components/OfflineBanner';
import { Platform } from 'react-native';

const TAB_BAR_BASE_HEIGHT = 60;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const isEmployer = user?.role === 'employer';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark ? 'rgba(180,160,140,0.5)' : 'rgba(120,100,80,0.45)',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDark ? 0.15 : 0.06,
            shadowRadius: 10,
            height: TAB_BAR_BASE_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.3,
            marginBottom: Platform.OS === 'ios' ? 0 : 4,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          tabBarItemStyle: {
            borderRadius: 14,
            marginHorizontal: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="protibha"
          options={{
            title: t('tabs.protibha'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'robot-happy' : 'robot-happy-outline'}
                size={size}
                color={color}
              />
            ),
            href: null,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('tabs.search'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'magnify' : 'magnify'}
                size={size}
                color={color}
              />
            ),
            href: isEmployer ? null : '/search',
          }}
        />
        <Tabs.Screen
          name="post-job"
          options={{
            title: t('tabs.postJob'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'plus-circle' : 'plus-circle-outline'}
                size={size}
                color={color}
              />
            ),
            href: isEmployer ? '/post-job' : null,
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: t('tabs.applications'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'file-document' : 'file-document-outline'}
                size={size}
                color={color}
              />
            ),
            href: !isEmployer ? '/applications' : null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabs.messages'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'message' : 'message-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name={focused ? 'account-circle' : 'account-circle-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <FloatingAssistant />
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
