import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Hash } from '@/constants/lucideIcons';
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
import { submitSignInChallengeCode } from '@/lib/auth/cognito';

export default function SignInChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ channel?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const channel = params.channel === 'sms' ? 'sms' : 'email';
  const [code, setCode] = useState('');
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

  const subtitle =
    channel === 'sms'
      ? 'Ingresá el código que enviamos por SMS.'
      : 'Ingresá el código que enviamos a tu correo.';

  async function handleSubmit() {
    if (!code.trim()) {
      Alert.alert('Código', 'Ingresá el código de verificación.');
      return;
    }
    setLoading(true);
    const result = await submitSignInChallengeCode(code);
    setLoading(false);
    if (!result.ok) {
      Alert.alert('Verificación', result.message);
      return;
    }
    if (result.data.kind === 'signed_in') {
      router.replace('/(tabs)/home');
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
      'Verificación',
      'El inicio de sesión no se completó. Probá de nuevo o iniciá sesión otra vez.',
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
                <Text style={TextStyles.screenTitle}>Código de verificación</Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>{subtitle}</Text>
              </View>

              <View style={Layout.formColumn}>
                <AuthTextField
                  label="Código"
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  icon={Hash}
                  keyboardType="number-pad"
                  autoCapitalize="none"
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
