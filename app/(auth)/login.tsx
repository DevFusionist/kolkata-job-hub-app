import React, { useState, useMemo } from 'react';
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
import api from '../_lib/api';
import { useAuth } from '../_contexts/AuthContext';
import { useLanguage } from '../_contexts/LanguageContext';
import { useTheme } from '../_contexts/ThemeContext';
import { GlassCard } from '../_components/GlassCard';
import type { ThemeColors } from '../_theme';

type Step = 'phone' | 'mpin' | 'otp' | 'set_mpin';

export default function LoginScreen() {
  const { t, locale, setLocale } = useLanguage();
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [mpin, setMpin] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [userAfterOtp, setUserAfterOtp] = useState<any>(null);
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
      await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
      setStep('otp');
      Alert.alert(t('common.success'), t('login.otpSent'));
    } catch (error: any) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        t('login.errorSendOtp');
      Alert.alert(t('common.error'), typeof msg === 'string' ? msg : JSON.stringify(msg));
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
      const response = await api.post('/auth/verify-otp', { phone, otp });
      if (!response.data.success) {
        Alert.alert(t('common.error'), t('login.errorVerifyOtp'));
        return;
      }
      if (response.data.isNewUser) {
        setStep('phone');
        setOtpSent(false);
        setOtp('');
        router.push({ pathname: '/(auth)/register', params: { phone } });
        return;
      }
      setUserAfterOtp({ user: response.data.user, token: response.data.token });
      setStep('set_mpin');
      setOtp('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || error.message || t('login.errorVerifyOtp'));
    } finally {
      setLoading(false);
    }
  };

  const submitSetMpin = async () => {
    if (!mpin || mpin.length < 4 || mpin.length > 6) {
      Alert.alert(t('common.error'), t('login.errorInvalidMpin'));
      return;
    }
    if (mpin !== mpinConfirm) {
      Alert.alert(t('common.error'), t('login.errorMpinMismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/set-mpin', { phone, mpin });
      const pending = userAfterOtp;
      setUserAfterOtp(null);
      setMpin('');
      setMpinConfirm('');
      setStep('phone');
      if (pending?.user) {
        await login(pending.user, pending.token);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.detail || 'Failed to set MPIN');
    } finally {
      setLoading(false);
    }
  };

  const loginWithMpin = async () => {
    if (!mpin || mpin.length < 4 || mpin.length > 6) {
      Alert.alert(t('common.error'), t('login.errorInvalidMpin'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { phone, mpin });
      if (response.data.success && response.data.user) {
        await login(response.data.user, response.data.token);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail || '';
      if (error.response?.status === 404 || (typeof detail === 'string' && detail.toLowerCase().includes('not found'))) {
        Alert.alert(t('common.error'), t('login.errorUserNotFound'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('login.getOtp'), onPress: () => { setStep('phone'); sendOTP(); } },
        ]);
      } else if (error.response?.status === 400 && typeof detail === 'string' && detail.toLowerCase().includes('not set')) {
        Alert.alert(t('common.error'), t('login.errorMpinNotSet'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('login.getOtp'), onPress: () => { setStep('phone'); sendOTP(); } },
        ]);
      } else {
        Alert.alert(t('common.error'), typeof detail === 'string' ? detail : t('login.errorVerifyOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const goToMpinStep = () => {
    if (phone.length !== 10) {
      Alert.alert(t('common.error'), t('login.errorInvalidPhone'));
      return;
    }
    setStep('mpin');
    setMpin('');
  };

  const renderPhoneStep = () => (
    <>
      <TextInput
        label={t('login.phoneNumber')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
        left={<TextInput.Affix text="+91 " textStyle={styles.affix} />}
      />
      <Button
        mode="contained"
        onPress={goToMpinStep}
        disabled={loading || phone.length !== 10}
        style={styles.mainButton}
        labelStyle={styles.buttonLabel}
      >
        {t('login.loginWithMpin')}
      </Button>
      <Button
        mode="text"
        onPress={sendOTP}
        loading={loading}
        textColor={colors.terracotta}
        style={styles.textButton}
      >
        {t('login.forgotMpin')}
      </Button>
      <Button
        mode="text"
        onPress={sendOTP}
        textColor={colors.muted}
        style={styles.textButton}
      >
        {t('login.newUserSendOtp')}
      </Button>
    </>
  );

  const renderMpinStep = () => (
    <>
      <Text style={styles.phoneDisplay}>+91 {phone}</Text>
      <TextInput
        label={t('login.enterMpin')}
        value={mpin}
        onChangeText={setMpin}
        placeholder={t('login.mpinPlaceholder')}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={loginWithMpin}
        loading={loading}
        disabled={loading}
        style={styles.mainButton}
        labelStyle={styles.buttonLabel}
      >
        {t('login.loginWithMpin')}
      </Button>
      <Button
        mode="text"
        onPress={() => { setStep('phone'); setMpin(''); }}
        textColor={colors.muted}
        style={styles.textButton}
      >
        {t('login.editNumber')}
      </Button>
      <Button
        mode="text"
        onPress={() => { setStep('phone'); setMpin(''); sendOTP(); }}
        textColor={colors.terracotta}
        style={styles.textButton}
      >
        {t('login.forgotMpin')}
      </Button>
    </>
  );

  const renderOtpStep = () => (
    <>
      <TextInput
        label={t('login.phoneNumber')}
        value={phone}
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
        left={<TextInput.Affix text="+91 " textStyle={styles.affix} />}
        disabled
      />
      <TextInput
        label={t('login.enterOtp')}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
      />
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
        onPress={() => { setStep('phone'); setOtpSent(false); setOtp(''); }}
        textColor={colors.muted}
        style={styles.textButton}
      >
        {t('login.editNumber')}
      </Button>
    </>
  );

  const renderSetMpinStep = () => (
    <>
      <Text style={styles.setMpinTitle}>{t('login.setMpinTitle')}</Text>
      <Text style={styles.instructionText}>{t('login.createMpinInstruction')}</Text>
      <TextInput
        label={t('login.enterMpin')}
        value={mpin}
        onChangeText={setMpin}
        placeholder={t('login.mpinPlaceholder')}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
      />
      <TextInput
        label={t('login.setMpinConfirm')}
        value={mpinConfirm}
        onChangeText={setMpinConfirm}
        placeholder={t('login.mpinPlaceholder')}
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        mode="flat"
        activeUnderlineColor={colors.terracotta}
        textColor={colors.text}
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={submitSetMpin}
        loading={loading}
        disabled={loading}
        style={styles.mainButton}
        labelStyle={styles.buttonLabel}
      >
        {t('register.setMpin')}
      </Button>
    </>
  );

  const getTitle = () => {
    if (step === 'phone') return t('login.welcome');
    if (step === 'mpin') return t('login.enterMpin');
    if (step === 'otp') return t('login.verifyOtp');
    if (step === 'set_mpin') return t('login.setMpinTitle');
    return t('login.welcome');
  };

  const getInstruction = () => {
    if (step === 'phone') return t('login.instruction');
    if (step === 'mpin') return t('login.mpinPlaceholder');
    if (step === 'otp') return t('login.instructionOtp');
    if (step === 'set_mpin') return t('login.createMpinInstruction');
    return t('login.instruction');
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ImageBackground
      source={require('../../assets/images/kolkata_street_nostalgia.png')}
      style={[styles.backgroundImage, { backgroundColor: colors.background }]}
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
            <Text style={styles.welcomeText}>{getTitle()}</Text>
            <Text style={styles.instructionText}>
              {step === 'set_mpin' ? '' : getInstruction()}
            </Text>

            {step === 'phone' && renderPhoneStep()}
            {step === 'mpin' && renderMpinStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'set_mpin' && renderSetMpinStep()}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backgroundImage: {
      flex: 1,
      backgroundColor: colors.background,
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
      borderColor: colors.terracotta,
    },
    langBtnActive: {
      backgroundColor: colors.terracotta,
    },
    langBtnText: {
      fontSize: 14,
      color: colors.terracotta,
      fontWeight: '600',
    },
    langBtnTextActive: {
      color: colors.cream,
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
      color: colors.terracotta,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
      fontWeight: '700',
      textAlign: 'center',
    },
    brandSubtitle: {
      fontSize: 14,
      letterSpacing: 2,
      color: colors.text,
      marginTop: 4,
      fontWeight: '600',
    },
    divider: {
      width: 60,
      height: 2,
      backgroundColor: colors.gold,
      marginTop: 8,
    },
    vintageCard: {
      elevation: 2,
    },
    welcomeText: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.text,
      marginBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'Kohinoor Bangla' : 'serif',
    },
    instructionText: {
      textAlign: 'center',
      color: colors.textSecondary,
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
      color: colors.text,
      fontWeight: 'bold',
    },
    mainButton: {
      backgroundColor: colors.terracotta,
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
      borderTopColor: colors.border,
      paddingTop: 15,
    },
    testInfo: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    phoneDisplay: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      fontWeight: '600',
    },
    setMpinTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
  });
}
