import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { COLORS } from '../_theme';
import { GlassCard } from '../_components/GlassCard';

const API_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://kolkata-job-hub-app-backend-production.up.railway.app';

export default function LoginScreen() {
  const { t, locale, setLocale } = useLanguage();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const sendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert(t('common.error'), t('login.errorInvalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const url = `${API_URL.replace(/\/$/, '')}/api/auth/send-otp`;
      const response = await axios.post(
        url,
        { phone },
        { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        setOtpSent(true);
        Alert.alert(t('common.success'), response.data.message);
      }
    } catch (error: any) {
      let msg = t('login.errorSendOtp');
      if (error.response?.data?.detail) {
        const d = error.response.data.detail;
        msg = Array.isArray(d) ? d.map((x: any) => x.msg || x).join(', ') : String(d);
      } else if (typeof error.response?.data === 'string') {
        msg = error.response.data;
      } else if (error.message) {
        msg = error.message;
      } else if (error.code) {
        msg = `Network: ${error.code}`;
      }
      Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert(t('common.error'), t('login.errorInvalidOtp'));
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
          router.push({
            pathname: '/(auth)/register',
            params: { phone },
          });
        } else {
          await login(response.data.user);
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || t('login.errorVerifyOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/kolkata_street_nostalgia.png')} 
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.2 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}
              onPress={() => setLocale('en')}
            >
              <Text style={[styles.langBtnText, locale === 'en' && styles.langBtnTextActive]}>
                {t('common.english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, locale === 'bn' && styles.langBtnActive]}
              onPress={() => setLocale('bn')}
            >
              <Text style={[styles.langBtnText, locale === 'bn' && styles.langBtnTextActive]}>
                {t('common.bengali')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandingSection}>
            <Image 
              source={require('../../assets/images/bengali_business_motifs.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>{t('login.brandTitle')}</Text>
            <View style={styles.divider} />
            <Text style={styles.brandSubtitle}>{t('login.brandName')}</Text>
          </View>

<GlassCard style={styles.vintageCard}>
            <Text style={styles.welcomeText}>
                {otpSent ? t('login.verifyOtp') : t('login.welcome')}
              </Text>
              <Text style={styles.instructionText}>
                {otpSent ? t('login.instructionOtp') : t('login.instruction')}
              </Text>

              <TextInput
                label={t('login.phoneNumber')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                mode="flat"
                activeUnderlineColor={COLORS.terracotta}
                disabled={otpSent}
                style={styles.input}
                left={<TextInput.Affix text="+91 " textStyle={styles.affix} />}
              />

              {otpSent && (
                <TextInput
                  label={t('login.enterOtp')}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  mode="flat"
                  activeUnderlineColor={COLORS.terracotta}
                  style={styles.input}
                />
              )}

              {!otpSent ? (
                <Button
                  mode="contained"
                  onPress={sendOTP}
                  loading={loading}
                  disabled={loading}
                  style={styles.mainButton}
                  labelStyle={styles.buttonLabel}
                >
                  {t('login.getOtp')}
                </Button>
              ) : (
                <View>
                  <Button
                    mode="contained"
                    onPress={verifyOTP}
                    loading={loading}
                    style={styles.mainButton}
                    labelStyle={styles.buttonLabel}
                  >
                    {t('login.verify')}
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    textColor={COLORS.muted}
                    style={styles.textButton}
                  >
                    {t('login.editNumber')}
                  </Button>
                </View>
              )}

            <View style={styles.footerInfo}>
              <Text style={styles.testInfo}>{t('login.demoOtp')}</Text>
            </View>
        </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 8,
    gap: 8,
    marginBottom: 20,
    marginTop: 20,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.terracotta,
  },
  langBtnActive: {
    backgroundColor: COLORS.terracotta,
  },
  langBtnText: {
    fontSize: 14,
    color: COLORS.terracotta,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandTitle: {
    fontSize: 42,
    color: COLORS.terracotta,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    fontWeight: '700',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    letterSpacing: 2,
    color: COLORS.ink,
    marginTop: 4,
    fontWeight: '600',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 8,
  },
  vintageCard: {
    elevation: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.ink,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
  },
  instructionText: {
    textAlign: 'center',
    color: COLORS.muted,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  affix: {
    color: COLORS.ink,
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: COLORS.terracotta,
    borderRadius: 2,
    marginTop: 10,
  },
  buttonLabel: {
    paddingVertical: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  textButton: {
    marginTop: 12,
  },
  footerInfo: {
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#EEE',
    paddingTop: 15,
  },
  testInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
});
