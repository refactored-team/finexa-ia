import { Lock, Mail } from '@/constants/lucideIcons';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  AuthBackground,
  AuthBranding,
  AuthCard,
  AuthHelpButton,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
} from '@/components/auth';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { useScrollOnlyIfOverflow } from '@/hooks/use-scroll-only-if-overflow';
import { signInWithEmailPassword } from '@/lib/auth/cognito';
import { followSignInResult } from '@/lib/auth/followSignInResult';
import { setLastSignInEmail } from '@/lib/auth/lastSignInContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scrollEnabled, onScrollViewLayout, onContentSizeChange } = useScrollOnlyIfOverflow();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);


  const scrollContentStyle = useMemo(
    () => [
      styles.scrollContent,
      {
        flexGrow: 1,
        justifyContent: 'center' as const,
        paddingTop: Math.max(insets.top, 4),
        paddingBottom: insets.bottom + 10,
        paddingHorizontal: Math.min(24, Math.max(16, width * 0.05)),
      },
    ],
    [insets.top, insets.bottom, width],
  );

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Ingresá correo y contraseña.');
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    setLastSignInEmail(trimmedEmail);
    setLoading(true);
    const result = await signInWithEmailPassword(trimmedEmail, password);
    setLoading(false);
    await followSignInResult(router, result, {
      email: trimmedEmail,
      setLoading,
    });
  }

  return (
    <AuthBackground>
      <SafeAreaView style={Layout.flex1} edges={['left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={Layout.flex1}
          keyboardVerticalOffset={0}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={scrollContentStyle}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            onLayout={onScrollViewLayout}
            onContentSizeChange={onContentSizeChange}>
            <AuthBranding />

            <AuthCard>
              <View style={styles.sectionHeader}>
                <View style={styles.headerTextContainer}>
                  <Text style={TextStyles.screenTitle}>Iniciar Sesión</Text>
                  <Text style={[TextStyles.caption, styles.subtitle]}>
                    Inicia sesión para continuar.
                  </Text>
                </View>
                <View style={styles.headerIconContainer}>
                  <Svg width={96} height={96} viewBox="0 0 24 24">
                    <Path
                      d="M 12 2 L 20 5 V 12 C 20 17.5 16.5 21 12 22 C 7.5 21 4 17.5 4 12 V 5 Z M 13.25 13.67 A 2.5 2.5 0 1 0 10.75 13.67 L 10 16 H 14 Z"
                      fill="#E5E5EA"
                      fillRule="evenodd"
                    />
                  </Svg>
                </View>
              </View>

              <View style={Layout.formColumn}>
                <AuthTextField
                  label="Correo electrónico"
                  placeholder="correo"
                  value={email}
                  onChangeText={setEmail}
                  icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <AuthTextField
                  label="Contraseña"
                  placeholder="······"
                  value={password}
                  onChangeText={setPassword}
                  icon={Lock}
                  secureTextEntry={!passwordVisible}
                  rightAccessory={
                    <PasswordVisibilityToggle
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((v) => !v)}
                    />
                  }
                />

                <Pressable
                  onPress={() => router.push('/forgot-password')}
                  style={styles.forgot}
                  hitSlop={8}>
                  <Text style={TextStyles.linkSmall}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                <AuthPrimaryButton title="Iniciar sesión" onPress={handleSubmit} loading={loading} />
              </View>
            </AuthCard>

            <View style={[Layout.rowWrapCenter, styles.footer]}>
              <Text style={[TextStyles.bodyMedium, styles.footerMuted]}>¿No tenés cuenta?</Text>
              <Link href="/register" asChild>
                <Pressable hitSlop={8}>
                  <Text style={TextStyles.link}>Crear cuenta</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AuthHelpButton />
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeader: {
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 96,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
    zIndex: 1,
    paddingTop: Spacing.sm,
  },
  headerIconContainer: {
    position: 'absolute',
    right: -10,
    top: -10,
    zIndex: 0,
    opacity: 0.9,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  footer: {
    marginTop: Spacing.sm,
  },
  footerMuted: {
    textAlign: 'center',
  },
});
