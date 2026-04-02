import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Hash, Mail } from '@/constants/lucideIcons';
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
import { confirmSignUpCode, resendConfirmationCode } from '@/lib/auth/cognito';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';

export default function ConfirmSignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const initialEmail = typeof params.email === 'string' ? params.email : '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

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

  async function handleConfirm() {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Datos incompletos', 'Ingresá tu correo y el código.');
      return;
    }
    setLoading(true);
    const result = await confirmSignUpCode(email, code);
    setLoading(false);
    if (result.ok) {
      Alert.alert('Cuenta confirmada', 'Ya podés iniciar sesión.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } else {
      Alert.alert('No se pudo confirmar', result.message);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      Alert.alert('Correo', 'Ingresá el correo con el que te registraste.');
      return;
    }
    setResendLoading(true);
    const result = await resendConfirmationCode(email);
    setResendLoading(false);
    if (result.ok) {
      Alert.alert(
        'Código reenviado',
        'Revisá entrada y spam en unos minutos. Si usás SES en sandbox, el destino tiene que estar verificado en Amazon SES.',
      );
    } else {
      Alert.alert('Error', result.message);
    }
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
                <Text style={TextStyles.screenTitle}>Confirmá tu correo</Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>
                  Ingresá el código que envió Cognito a tu correo. Si no llega, revisá spam y usá «Reenviar código».
                  {'\n\n'}
                  Si tu pool usa Amazon SES en sandbox, ese email debe estar verificado en SES para recibir mensajes.
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

                <AuthPrimaryButton title="Confirmar" onPress={handleConfirm} loading={loading} />

                <Pressable onPress={handleResend} disabled={resendLoading} style={styles.resend}>
                  <Text style={TextStyles.linkSmall}>
                    {resendLoading ? 'Enviando…' : 'Reenviar código'}
                  </Text>
                </Pressable>
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
  resend: {
    alignSelf: 'center',
    paddingVertical: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.md,
  },
});
