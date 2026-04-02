import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from '@/constants/lucideIcons';
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
} from '@/components/auth';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { requestPasswordReset } from '@/lib/auth/cognito';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const initialEmail = typeof params.email === 'string' ? params.email : '';
  const [email, setEmail] = useState(initialEmail);
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
    if (!email.trim()) {
      Alert.alert('Correo', 'Ingresá el correo de tu cuenta.');
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Error', result.message);
      return;
    }
    Alert.alert('Revisá tu correo', 'Te enviamos un código para restablecer la contraseña.', [
      {
        text: 'Continuar',
        onPress: () =>
          router.replace({
            pathname: '/reset-password',
            params: { email: email.trim() },
          }),
      },
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
                <Text style={TextStyles.screenTitle}>Recuperar contraseña</Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>
                  Te enviaremos un código a tu correo para definir una nueva contraseña.
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
                <AuthPrimaryButton title="Enviar código" onPress={handleSubmit} loading={loading} />
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
