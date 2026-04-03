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
  AuthPasswordStrength,
  AuthPrimaryButton,
  AuthTextField,
  PasswordVisibilityToggle,
} from '@/components/auth';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { followSignInResult } from '@/lib/auth/followSignInResult';
import { getLastSignInEmail } from '@/lib/auth/lastSignInContext';
import { submitSignInNewPassword } from '@/lib/auth/cognito';
import {
  passwordMeetsCognitoLikePolicy,
  passwordMissingPartsSpanish,
} from '@/lib/auth/passwordPolicy';

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
    if (!passwordMeetsCognitoLikePolicy(password)) {
      Alert.alert(
        'Contraseña',
        `Tu contraseña debe cumplir lo que pide Cognito. Falta: ${passwordMissingPartsSpanish(password)}.`,
      );
      return;
    }
    setLoading(true);
    const result = await submitSignInNewPassword(password);
    setLoading(false);
    await followSignInResult(router, result, {
      email: getLastSignInEmail(),
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
                <View>
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
                  <AuthPasswordStrength password={password} />
                </View>
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
