import { Link, useRouter } from 'expo-router';
import { Lock, Mail, User } from '@/constants/lucideIcons';
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
  AuthHelpButton,
  AuthPasswordStrength,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
} from '@/components/auth';
import { PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { signUpWithEmailPassword } from '@/lib/auth/cognito';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  function validateForm(): boolean {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Datos incompletos', 'Completá nombre, correo y contraseña.');
      return false;
    }
    if (!termsAccepted) {
      Alert.alert('Términos', 'Debés aceptar los términos y la política de privacidad.');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    const result = await signUpWithEmailPassword(email, password, name);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Registro', result.message);
      return;
    }
    if (result.data.nextStep === 'CONFIRM_SIGN_UP') {
      Alert.alert('Revisá tu correo', 'Te enviamos un código para confirmar la cuenta.', [
        {
          text: 'Continuar',
          onPress: () =>
            router.replace({
              pathname: '/confirm-signup',
              params: { email: email.trim() },
            }),
        },
      ]);
      return;
    }
    if (result.data.nextStep === 'COMPLETE_AUTO_SIGN_IN') {
      router.replace('/(tabs)/home');
      return;
    }
    if (result.data.nextStep === 'DONE') {
      Alert.alert('Listo', 'Tu cuenta fue creada.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') },
      ]);
    }
  }

  return (
    <AuthBackground>
      <SafeAreaView style={Layout.flex1} edges={['left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={Layout.flex1}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={scrollContentStyle}
            showsVerticalScrollIndicator={false}>
            <AuthBranding />

            <AuthCard>
              <View style={styles.sectionHeader}>
                <Text style={TextStyles.screenTitle}>Crear cuenta</Text>
                <Text style={[TextStyles.caption, styles.subtitle]} numberOfLines={2}>
                  Completá tus datos para registrarte.
                </Text>
              </View>

              <View style={Layout.formColumn}>
                <AuthTextField
                  label="Nombre completo"
                  placeholder="Nombre"
                  value={name}
                  onChangeText={setName}
                  icon={User}
                  autoCapitalize="words"
                />
                <AuthTextField
                  label="Correo electrónico"
                  placeholder="correo"
                  value={email}
                  onChangeText={setEmail}
                  icon={Mail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View>
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
                  <AuthPasswordStrength password={password} />
                </View>

                <View style={[Layout.termsRow, styles.termsRowDense]}>
                  <Pressable
                    onPress={() => setTermsAccepted((v) => !v)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: PrismColors.primaryBorder,
                        backgroundColor: termsAccepted ? PrismColors.primary : PrismColors.surface,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}>
                    {termsAccepted ? <Text style={TextStyles.checkboxMark}>✓</Text> : null}
                  </Pressable>
                  <Text style={[TextStyles.terms, styles.termsWrap]}>
                    Acepto los{' '}
                    <Text style={TextStyles.link} onPress={() => Alert.alert('Términos', 'Contenido próximamente.')}>
                      Términos del servicio
                    </Text>{' '}
                    y la{' '}
                    <Text
                      style={TextStyles.link}
                      onPress={() => Alert.alert('Privacidad', 'Contenido próximamente.')}>
                      Política de privacidad
                    </Text>
                    .
                  </Text>
                </View>

                <AuthPrimaryButton title="Crear cuenta" onPress={handleSubmit} loading={loading} />
              </View>
            </AuthCard>

            <View style={[Layout.rowWrapCenter, styles.footer]}>
              <Text style={[TextStyles.bodyMedium, styles.footerMuted]}>¿Ya tenés cuenta?</Text>
              <Link href="/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={TextStyles.link}>Iniciar sesión</Text>
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
  termsRowDense: {
    paddingTop: 0,
    marginLeft: 0,
  },
  checkbox: {
    marginTop: 2,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsWrap: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.sm,
  },
  footerMuted: {
    textAlign: 'center',
  },
});
