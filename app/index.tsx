import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from './_contexts/AuthContext';
import { useTheme } from './_contexts/ThemeContext';
import { enterFadeIn } from './_animations';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={enterFadeIn} style={styles.centered}>
        <ActivityIndicator size="large" color={colors.terracotta} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
