import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';

import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useAuthBack } from '../_contexts/AuthBackContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, imageBackgroundStyle, screenPaddingHorizontal } from '../_design';

type Step = 'phone' | 'mpin' | 'otp' | 'set_mpin';
type OtpPurpose = 'register' | 'reset_mpin';

export default function LoginScreen() {
  const { t, locale, setLocale } = useLanguage();
  const { colors } = useTheme();
  const { login } = useAuth();
  const { setBackOptions } = useAuthBack();
  const router = useRouter();
  const goBackRef = useRef<() => void>(() => {});

  /* ---------- STATE ---------- */

  const [phone, setPhone] = useState('');
  const [mpin, setMpin] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose | null>(null);
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [userAfterOtp, setUserAfterOtp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- STYLES ---------- */

  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputTheme = useMemo(
    () => ({ colors: { primary: colors.terracotta } }),
    [colors.terracotta]
  );

  /* ---------- LOGIC ---------- */

  const sendOTP = async (purpose: OtpPurpose) => {
    if (phone.length !== 10) {
      return Alert.alert(t('common.error'), t('login.errorInvalidPhone'));
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone, purpose });
      setOtpPurpose(purpose);
      setOtp('');
      setStep('otp');
      Alert.alert(t('common.success'), t('login.otpSent'));
    } catch (error: any) {
      if (error.response?.status === 409 && purpose === 'register') {
        setStep('mpin');
      }
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('login.errorSendOtp')
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    console.log('verifyOTP', otp);
    if (otp.length !== 6) {
      return Alert.alert(t('common.error'), t('login.errorInvalidOtp'));
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        phone,
        otp,
        purpose: otpPurpose,
      });

      if (response.data.isNewUser) {
        router.push({
          pathname: '/(auth)/register',
          params: {
            phone,
            registrationToken: response.data.registrationToken,
          },
        });
        return;
      }

      if (otpPurpose === 'reset_mpin') {
        setUserAfterOtp({
          mpinResetToken: response.data.mpinResetToken,
        });
      } else {
        setUserAfterOtp({
          user: response.data.user,
          token: response.data.token,
        });
      }

      setStep('set_mpin');
    } catch {
      Alert.alert(t('common.error'), t('login.errorVerifyOtp'));
    } finally {
      setLoading(false);
    }
  };

  const loginWithMpin = async () => {
    if (mpin.length < 4) {
      return Alert.alert(t('common.error'), t('login.errorInvalidMpin'));
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { phone, mpin });

      if (response.data.success) {
        await login(response.data.user, response.data.token);
        router.replace('/(tabs)');
      }
    } catch {
      Alert.alert(t('common.error'), t('login.errorVerifyOtp'));
    } finally {
      setLoading(false);
    }
  };

  const submitSetMpin = async () => {
    if (mpin !== mpinConfirm) {
      return Alert.alert(t('common.error'), t('login.errorMpinMismatch'));
    }

    setLoading(true);
    try {
      const pending = userAfterOtp;

      const headers = pending?.mpinResetToken
        ? { 'x-mpin-reset-token': pending.mpinResetToken }
        : { Authorization: `Bearer ${pending.token}` };

      await api.post('/auth/set-mpin', { mpin }, { headers });

      const loginResp = await api.post('/auth/login', { phone, mpin });

      if (loginResp.data.success) {
        await login(loginResp.data.user, loginResp.data.token);
        router.replace('/(tabs)');
      }
    } catch {
      Alert.alert(t('common.error'), 'Failed to set MPIN');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'mpin') {
      setMpin('');
      setStep('phone');
    } else if (step === 'otp') {
      setOtp('');
      setOtpPurpose(null);
      setStep('phone');
    } else if (step === 'set_mpin') {
      setMpin('');
      setMpinConfirm('');
      setUserAfterOtp(null);
      setStep('phone');
    }
  };

  goBackRef.current = goBack;

  const syncBackOptions = useCallback(() => {
    if (step !== 'phone') {
      setBackOptions({
        show: true,
        onBack: () => goBackRef.current?.(),
        disabled: loading,
      });
    } else {
      setBackOptions({ show: false, onBack: () => {}, disabled: false });
    }
  }, [step, loading, setBackOptions]);

  useFocusEffect(
    useCallback(() => {
      syncBackOptions();
      return () => {
        setBackOptions({ show: false, onBack: () => {}, disabled: false });
      };
    }, [syncBackOptions, setBackOptions])
  );

  useEffect(() => {
    syncBackOptions();
  }, [syncBackOptions]);

  /* ---------- HEADER ---------- */

  const titles = {
    phone: t('login.welcome'),
    mpin: t('login.enterMpin'),
    otp: t('login.verifyOtp'),
    set_mpin: t('login.setMpinTitle'),
  };

  const subs = {
    phone: t('login.instruction'),
    mpin: t('login.mpinPlaceholder'),
    otp: t('login.instructionOtp'),
    set_mpin: t('login.createMpinInstruction'),
  };

  /* ---------- UI ---------- */

  return (
    <View style={styles.bg}>
    <ImageBackground
      source={require('../../assets/images/kolkata_street_nostalgia.png')}
      style={[styles.bg, { backgroundColor: colors.background }]}
      imageStyle={styles.bgImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language */}
          <View style={styles.langRow}>
            {['en', 'bn'].map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLocale(l as any)}
                style={[
                  styles.langBtn,
                  locale === l && { backgroundColor: colors.ink },
                ]}
              >
                <Text
                  style={[
                    styles.langBtnTxt,
                    locale === l && { color: colors.cream },
                  ]}
                >
                  {l === 'en' ? 'EN' : 'বাংলা'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Branding */}
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.branding}>
              <Image
                source={require('../../assets/images/bengali_business_motifs.png')}
                style={styles.logo}
              />
              <Text style={styles.brandTitle}>প্ৰতিভা</Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.gold },
                ]}
              />
              <Text style={styles.brandSubtitle}>
                KOLKATA DIGITAL HUB
              </Text>
            </View>
          </Animated.View>

          {/* Card */}
          <GlassCard style={styles.card}>
            <Animated.View
              key={step}
              entering={FadeInDown.springify()}
              exiting={FadeOutUp}
              layout={LinearTransition.springify()}
            >
              <Text style={styles.welcomeText}>{titles[step]}</Text>
              <Text style={styles.instructionText}>{subs[step]}</Text>

              {/* PHONE */}
              {step === 'phone' && (
                <>
                  <TextInput
                    label={t('login.phoneNumber')}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    mode="flat"
                    theme={inputTheme}
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    style={styles.mainBtn}
                    labelStyle={styles.btnLabel}
                    onPress={() => setStep('mpin')}
                    disabled={loading}
                  >
                    {t('login.loginWithMpin')}
                  </Button>

                  <TouchableOpacity
                    onPress={() => sendOTP('register')}
                    style={styles.centerLink}
                  >
                    <Text style={styles.linkText}>
                      {t('login.newUserSendOtp')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* MPIN */}
              {step === 'mpin' && (
                <>
                  <TextInput
                    label={t('login.enterMpin')}
                    value={mpin}
                    onChangeText={setMpin}
                    secureTextEntry
                    keyboardType="number-pad"
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    style={styles.mainBtn}
                    labelStyle={styles.btnLabel}
                    onPress={loginWithMpin}
                    disabled={loading}
                  >
                    {t('login.loginWithMpin')}
                  </Button>
                </>
              )}

              {/* OTP */}
              {step === 'otp' && (
                <>
                  <TextInput
                    label={t('login.enterOtp')}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    style={styles.mainBtn}
                    labelStyle={styles.btnLabel}
                    onPress={verifyOTP}
                    disabled={loading}
                  >
                    {t('login.verify')}
                  </Button>
                </>
              )}

              {/* SET MPIN */}
              {step === 'set_mpin' && (
                <>
                  <TextInput
                    label={t('login.enterMpin')}
                    value={mpin}
                    onChangeText={setMpin}
                    secureTextEntry
                    style={styles.input}
                  />

                  <TextInput
                    label={t('login.setMpinConfirm')}
                    value={mpinConfirm}
                    onChangeText={setMpinConfirm}
                    secureTextEntry
                    style={styles.input}
                  />

                  <Button
                    mode="contained"
                    style={styles.mainBtn}
                    labelStyle={styles.btnLabel}
                    onPress={submitSetMpin}
                    disabled={loading}
                  >
                    {t('register.setMpin')}
                  </Button>
                </>
              )}
            </Animated.View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
    {loading && <LoadingScreen fullScreen overlay />}
    </View>
  );
}

/* ---------- STYLES ---------- */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bg: { flex: 1 },
    bgImage: imageBackgroundStyle(colors),
    scroll: { flexGrow: 1, padding: screenPaddingHorizontal, justifyContent: 'center' },

    langRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginBottom: 20,
    },
    langBtn: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.ink,
    },
    langBtnTxt: { fontSize: 11, fontWeight: '700', color: colors.ink },

    branding: { alignItems: 'center', marginBottom: 24 },
    logo: { width: 60, height: 60, tintColor: colors.ink },
    brandTitle: { fontSize: 42, color: colors.ink, fontWeight: '700' },
    brandSubtitle: {
      fontSize: 10,
      letterSpacing: 4,
      color: colors.text,
      marginTop: 8,
    },
    divider: { width: 30, height: 2, marginTop: 4 },

    card: {
      padding: scale(20),
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    welcomeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    instructionText: {
      textAlign: 'center',
      marginBottom: 20,
      color: colors.textSecondary,
    },

    input: { marginBottom: 16, backgroundColor: 'transparent' },
    mainBtn: { backgroundColor: colors.ink, height: 48 },

    linkText: {
      marginTop: 12,
      textAlign: 'center',
      color: colors.muted,
    },

    centerLink: { marginTop: 12 },

    btnLabel: {
      color: '#fff',
      fontWeight: 'bold',
      letterSpacing: 1,
    }

  });
