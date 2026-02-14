import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './_contexts/AuthContext';
import { LanguageProvider } from './_contexts/LanguageContext';
import { SocketProvider } from './_contexts/SocketContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </PaperProvider>
  );
}