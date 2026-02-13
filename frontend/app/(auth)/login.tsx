import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const sendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/send-otp`, { phone });
      if (response.data.success) {
        setOtpSent(true);
        Alert.alert('Success', response.data.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        phone,
        otp,
      });
      
      if (response.data.success) {
        if (response.data.isNewUser) {
          // Navigate to registration
          router.push({
            pathname: '/(auth)/register',
            params: { phone },
          });
        } else {
          // Login existing user
          await login(response.data.user);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Kolkata Job Portal
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Find jobs & hire talent in Kolkata
            </Text>

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              disabled={otpSent}
              left={<TextInput.Affix text="+91" />}
            />

            {otpSent && (
              <TextInput
                label="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
            )}

            {!otpSent ? (
              <Button
                mode="contained"
                onPress={sendOTP}
                loading={loading}
                style={styles.button}
              >
                Send OTP
              </Button>
            ) : (
              <View>
                <Button
                  mode="contained"
                  onPress={verifyOTP}
                  loading={loading}
                  style={styles.button}
                >
                  Verify OTP
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={styles.textButton}
                >
                  Change Phone Number
                </Button>
              </View>
            )}

            <Text variant="bodySmall" style={styles.infoText}>
              For testing, use OTP: 123456
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  textButton: {
    marginTop: 8,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
  },
});