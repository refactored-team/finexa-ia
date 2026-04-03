import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Hash, Lock, Mail } from '@/constants/lucideIcons';
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
import { confirmPasswordReset } from '@/lib/auth/cognito';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const initialEmail = typeof params.email === 'string' ? params.email : '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    if (!email.trim() || !code.trim() || !newPassword) {
      Alert.alert('Datos incompletos', 'Completá correo, código y nueva contraseña.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Contraseñas', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setLoading(true);
    const result = await confirmPasswordReset(email, code, newPassword);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('No se pudo restablecer', result.message);
      return;
    }
    Alert.alert('Listo', 'Ya podés iniciar sesión con tu nueva contraseña.', [
      { text: 'OK', onPress: () => router.replace('/login') },
    ]);
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
                  Ingresá el código del correo y elegí una nueva contraseña.
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
                  label="Código de verificación"
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  icon={Hash}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <AuthTextField
                  label="Nueva contraseña"
                  placeholder="······"
                  value={newPassword}
                  onChangeText={setNewPassword}
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
                <AuthPrimaryButton title="Guardar contraseña" onPress={handleSubmit} loading={loading} />
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
