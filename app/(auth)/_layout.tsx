import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBackProvider, useAuthBack } from '../_contexts/AuthBackContext';
import { useTheme } from '../_contexts/ThemeContext';
import { useLanguage } from '../_contexts/LanguageContext';

function AuthBackButton() {
  const { backOptions } = useAuthBack();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  if (!backOptions.show) return null;

  return (
    <TouchableOpacity
      onPress={backOptions.onBack}
      disabled={backOptions.disabled}
      style={[
        styles.backBtn,
        {
          top: insets.top,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.backBtnText, { color: colors.terracotta }]}>
        ← {t('common.back')}
      </Text>
    </TouchableOpacity>
  );
}

function AuthLayoutContent() {
  return (
    <View style={styles.container} collapsable={false}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      {/* Back button on top so it's not covered by the stack screens */}
      <AuthBackButton />
    </View>
  );
}

export default function AuthLayout() {
  return (
    <AuthBackProvider>
      <AuthLayoutContent />
    </AuthBackProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 999,
    elevation: 999,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
