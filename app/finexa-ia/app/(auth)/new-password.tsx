import { Link, useRouter } from 'expo-router';
import { Lock } from '@/constants/lucideIcons';
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
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
} from '@/components/auth';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { submitSignInNewPassword } from '@/lib/auth/cognito';

export default function NewPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
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
    if (!password) {
      Alert.alert('Contraseña', 'Ingresá una nueva contraseña.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas', 'La confirmación no coincide.');
      return;
    }
    setLoading(true);
    const result = await submitSignInNewPassword(password);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Error', result.message);
      return;
    }
    if (result.data.kind === 'signed_in') {
      router.replace('/(tabs)/home');
      return;
    }
    if (result.data.kind === 'needs_verification_code') {
      router.replace({
        pathname: '/sign-in-challenge',
        params: { channel: result.data.channel },
      });
      return;
    }
    if (result.data.kind === 'unsupported_challenge') {
      Alert.alert(
        'Siguiente paso',
        `Se requiere otro paso que la app aún no soporta (${result.data.signInStep}).`,
      );
      return;
    }
    Alert.alert(
      'Inicio de sesión',
      'No se pudo completar el cambio de contraseña. Probá iniciar sesión de nuevo.',
    );
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
            showsVerticalScrollIndicator={false}>
            <AuthBranding />

            <AuthCard>
              <View style={styles.sectionHeader}>
                <Text style={TextStyles.screenTitle}>Nueva contraseña</Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>
                  Tu cuenta requiere definir una contraseña nueva antes de continuar.
                </Text>
              </View>

              <View style={Layout.formColumn}>
                <AuthTextField
                  label="Nueva contraseña"
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
                <AuthTextField
                  label="Confirmar contraseña"
                  placeholder="······"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  icon={Lock}
                  secureTextEntry={!confirmVisible}
                  rightAccessory={
                    <PasswordVisibilityToggle
                      visible={confirmVisible}
                      onToggle={() => setConfirmVisible((v) => !v)}
                    />
                  }
                />
                <AuthPrimaryButton title="Continuar" onPress={handleSubmit} loading={loading} />
              </View>
            </AuthCard>

            <View style={[Layout.rowWrapCenter, styles.footer]}>
              <Link href="/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={TextStyles.link}>Volver al inicio de sesión</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  footer: {
    marginTop: Spacing.md,
  },
});
