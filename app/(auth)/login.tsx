import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useAuthBack } from '../_contexts/AuthBackContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import { LoadingScreen } from '../_components/LoadingScreen';
import type { ThemeColors } from '../_theme';
import { scale, screenPaddingHorizontal } from '../_design';

type Step = 'phone' | 'mpin' | 'otp' | 'set_mpin';
type OtpPurpose = 'register' | 'reset_mpin';

const STEP_ICONS: Record<Step, string> = {
  phone: 'phone',
  mpin: 'lock',
  otp: 'shield-check',
  set_mpin: 'lock-plus',
};

export default function LoginScreen() {
  const { t, locale, setLocale } = useLanguage();
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const { setBackOptions } = useAuthBack();
  const router = useRouter();
  const goBackRef = useRef<() => void>(() => { });

  const [phone, setPhone] = useState('');
  const [mpin, setMpin] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose | null>(null);
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [userAfterOtp, setUserAfterOtp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const inputTheme = useMemo(
    () => ({ colors: { primary: colors.primary } }),
    [colors.primary]
  );

  // Ambient background shimmer
  const shimmerX = useSharedValue(-300);
  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(400, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));

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
      Alert.alert(t('common.error'), error.response?.data?.detail || t('login.errorSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      return Alert.alert(t('common.error'), t('login.errorInvalidOtp'));
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { phone, otp, purpose: otpPurpose });
      if (response.data.isNewUser) {
        router.push({ pathname: '/(auth)/register', params: { phone, registrationToken: response.data.registrationToken } });
        return;
      }
      if (otpPurpose === 'reset_mpin') {
        setUserAfterOtp({ mpinResetToken: response.data.mpinResetToken });
      } else {
        setUserAfterOtp({ user: response.data.user, token: response.data.token });
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
    if (step === 'mpin') { setMpin(''); setStep('phone'); }
    else if (step === 'otp') { setOtp(''); setOtpPurpose(null); setStep('phone'); }
    else if (step === 'set_mpin') { setMpin(''); setMpinConfirm(''); setUserAfterOtp(null); setStep('phone'); }
  };

  goBackRef.current = goBack;

  const syncBackOptions = useCallback(() => {
    if (step !== 'phone') {
      setBackOptions({ show: true, onBack: () => goBackRef.current?.(), disabled: loading });
    } else {
      setBackOptions({ show: false, onBack: () => { }, disabled: false });
    }
  }, [step, loading, setBackOptions]);

  useFocusEffect(useCallback(() => {
    syncBackOptions();
    return () => { setBackOptions({ show: false, onBack: () => { }, disabled: false }); };
  }, [syncBackOptions, setBackOptions]));

  useEffect(() => { syncBackOptions(); }, [syncBackOptions]);

  const titles: Record<Step, string> = {
    phone: t('login.welcome'),
    mpin: t('login.enterMpin'),
    otp: t('login.verifyOtp'),
    set_mpin: t('login.setMpinTitle'),
  };
  const subs: Record<Step, string> = {
    phone: t('login.instruction'),
    mpin: t('login.mpinPlaceholder'),
    otp: t('login.instructionOtp'),
    set_mpin: t('login.createMpinInstruction'),
  };

  return (
    <View style={styles.bg}>
      {/* Warm cream background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? colors.background : '#FFF8F0' }]} />

      {/* Decorative warm orb blobs */}
      <View style={[styles.orb, styles.orbTopLeft, { backgroundColor: colors.primary + '18' }]} />
      <View style={[styles.orb, styles.orbBottomRight, { backgroundColor: colors.secondary + '15' }]} />
      <View style={[styles.orb, styles.orbMid, { backgroundColor: colors.accent + '10' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Language toggle */}
          <View style={styles.langRow}>
            {['en', 'bn'].map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLocale(l as any)}
                style={[
                  styles.langBtn,
                  locale === l && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.langBtnTxt, locale === l && styles.langBtnTxtActive]}>
                  {l === 'en' ? 'EN' : 'বাংলা'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Branding */}
          <Animated.View entering={FadeInDown.springify().damping(18).stiffness(160)} style={styles.branding}>
            {/* Icon circle */}
            <Animated.View entering={ZoomIn.springify().damping(10).stiffness(300).delay(100)}>
              <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="briefcase-search" size={34} color="#fff" />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).springify().damping(18)}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>প্ৰতিভা</Text>
            </Animated.View>

            <View style={[styles.dividerLine, { backgroundColor: colors.primary }]} />

            <Animated.View entering={FadeInUp.delay(220).springify().damping(18)}>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                KOLKATA DIGITAL HUB
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Auth card */}
          <GlassCard style={styles.card} glow>
            <Animated.View
              key={step}
              entering={FadeInDown.springify().damping(20).stiffness(200)}
              exiting={FadeOutUp.duration(180)}
              layout={LinearTransition.springify().damping(22)}
            >
              {/* Step icon */}
              <View style={styles.stepIconRow}>
                <View style={[styles.stepIconBg, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons
                    name={STEP_ICONS[step] as any}
                    size={20}
                    color="#fff"
                  />
                </View>
              </View>

              <Text style={[styles.welcomeText, { color: colors.text }]}>{titles[step]}</Text>
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>{subs[step]}</Text>

              {/* PHONE */}
              {step === 'phone' && (
                <>
                  <TextInput
                    label={t('login.phoneNumber')}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    mode="outlined"
                    theme={inputTheme}
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    outlineStyle={styles.inputOutline}
                  />
                  <TouchableOpacity
                    onPress={() => setStep('mpin')}
                    disabled={loading}
                    style={styles.mainBtnWrapper}
                  >
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.mainBtnGrad}
                    >
                      <Text style={styles.mainBtnLabel}>{t('login.loginWithMpin')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => sendOTP('register')} style={styles.centerLink}>
                    <Text style={[styles.linkText, { color: colors.primary }]}>
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
                    mode="outlined"
                    theme={inputTheme}
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    outlineStyle={styles.inputOutline}
                  />
                  <TouchableOpacity onPress={loginWithMpin} disabled={loading} style={styles.mainBtnWrapper}>
                    <View style={[styles.mainBtnSolid, { backgroundColor: colors.primary }]}>
                      <Text style={styles.mainBtnLabel}>{t('login.loginWithMpin')}</Text>
                    </View>
                  </TouchableOpacity>
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
                    mode="outlined"
                    theme={inputTheme}
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    outlineStyle={styles.inputOutline}
                  />
                  <TouchableOpacity onPress={verifyOTP} disabled={loading} style={styles.mainBtnWrapper}>
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.mainBtnGrad}
                    >
                      <Text style={styles.mainBtnLabel}>{t('login.verify')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
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
                    mode="outlined"
                    theme={inputTheme}
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    outlineStyle={styles.inputOutline}
                  />
                  <TextInput
                    label={t('login.setMpinConfirm')}
                    value={mpinConfirm}
                    onChangeText={setMpinConfirm}
                    secureTextEntry
                    mode="outlined"
                    theme={inputTheme}
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    outlineStyle={styles.inputOutline}
                  />
                  <TouchableOpacity onPress={submitSetMpin} disabled={loading} style={styles.mainBtnWrapper}>
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.mainBtnGrad}
                    >
                      <Text style={styles.mainBtnLabel}>{t('register.setMpin')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && <LoadingScreen fullScreen overlay />}
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    bg: { flex: 1 },
    scroll: {
      flexGrow: 1,
      padding: screenPaddingHorizontal,
      paddingVertical: scale(40),
      justifyContent: 'center',
    },

    // Decorative orbs
    orb: { position: 'absolute', borderRadius: 999 },
    orbTopLeft: { width: 260, height: 260, top: -80, left: -80 },
    orbBottomRight: { width: 220, height: 220, bottom: -60, right: -60 },
    orbMid: { width: 150, height: 150, top: '40%', left: '55%' },
    shimmer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 120,
      transform: [{ skewX: '-20deg' }],
    },

    // Language
    langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 24 },
    langBtn: {
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    langBtnActive: { borderColor: colors.primary },
    langBtnGrad: { paddingVertical: 6, paddingHorizontal: 14 },
    langBtnTxt: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    langBtnTxtActive: { color: '#fff' },

    // Branding
    branding: { alignItems: 'center', marginBottom: 28 },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    brandTitle: {
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    dividerLine: {
      width: 40,
      height: 3,
      borderRadius: 2,
      marginTop: 6,
      marginBottom: 8,
    },
    brandSubtitle: {
      fontSize: 11,
      letterSpacing: 4,
      fontWeight: '600',
    },

    // Card
    card: { marginBottom: 20 },

    // Step icon
    stepIconRow: { alignItems: 'center', marginBottom: 14 },
    stepIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },

    welcomeText: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 6,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    instructionText: {
      textAlign: 'center',
      marginBottom: 22,
      fontSize: 14,
      lineHeight: 20,
    },

    input: { marginBottom: 14, backgroundColor: isDark ? colors.surfaceElevated : colors.surface },
    inputOutline: { borderRadius: 12 },

    mainBtnWrapper: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    mainBtnGrad: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },
    mainBtnLabel: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
      letterSpacing: 0.5,
    },

    centerLink: { marginTop: 16, alignItems: 'center' },
    linkText: {
      fontWeight: '600',
      fontSize: 14,
      textDecorationLine: 'underline',
    },
  });
