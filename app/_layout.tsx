import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './_contexts/AuthContext';
import { LanguageProvider } from './_contexts/LanguageContext';
import { SocketProvider } from './_contexts/SocketContext';
import { ThemeProvider, useTheme } from './_contexts/ThemeContext';

function LayoutContent() {
  const { paperTheme, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <PaperProvider theme={paperTheme}>
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="resume-builder" />
                <Stack.Screen name="ai-copilot" />
              </Stack>
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </PaperProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  );
}
