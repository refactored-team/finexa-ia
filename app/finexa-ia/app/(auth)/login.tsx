import { Link, useRouter } from 'expo-router';
import { Lock, Mail } from '@/constants/lucideIcons';
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

import {
  AuthBackground,
  AuthBranding,
  AuthCard,
  AuthDivider,
  AuthHelpButton,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
  SocialAuthButtons,
} from '@/components/auth';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { useScrollOnlyIfOverflow } from '@/hooks/use-scroll-only-if-overflow';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { scrollEnabled, onScrollViewLayout, onContentSizeChange } = useScrollOnlyIfOverflow();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

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

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(onboarding)/link-bank');
    }, 600);
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
                <Text style={TextStyles.screenTitle}>Bienvenido de nuevo</Text>
                <Text style={[TextStyles.caption, styles.subtitle]} numberOfLines={1}>
                  Iniciá sesión para continuar.
                </Text>
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
                  onPress={() => Alert.alert('Contraseña', 'Flujo próximamente.')}
                  style={styles.forgot}
                  hitSlop={8}>
                  <Text style={TextStyles.linkSmall}>¿Olvidaste tu contraseña?</Text>
                </Pressable>

                <AuthPrimaryButton title="Iniciar sesión" onPress={handleSubmit} loading={loading} />
              </View>

              <Pressable
                onPress={() => setShowSocial((s) => !s)}
                style={styles.socialToggle}
                hitSlop={8}>
                <Text style={TextStyles.linkSmall}>
                  {showSocial ? 'Ocultar Google y Apple' : 'Google y Apple'}
                </Text>
              </Pressable>

              {showSocial ? (
                <>
                  <AuthDivider label="o iniciá sesión con" />
                  <SocialAuthButtons mode="sign-in" />
                </>
              ) : null}
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
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  socialToggle: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  footerMuted: {
    textAlign: 'center',
  },
});
