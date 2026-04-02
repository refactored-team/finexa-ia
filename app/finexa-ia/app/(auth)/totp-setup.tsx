import { Link, useRouter } from 'expo-router';
import { Hash } from '@/constants/lucideIcons';
import { useEffect, useMemo, useState } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuthBackground,
  AuthBranding,
  AuthCard,
  AuthPrimaryButton,
  AuthTextField,
} from '@/components/auth';
import { PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { followSignInResult } from '@/lib/auth/followSignInResult';
import { getLastSignInEmail } from '@/lib/auth/lastSignInContext';
import { submitSignInChallengeCode } from '@/lib/auth/cognito';
import { getPendingTotpSetup } from '@/lib/auth/totpSetupStore';

export default function TotpSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [setup, setSetup] = useState<{ setupUri: string; sharedSecret: string } | null>(() =>
    getPendingTotpSetup() ?? null,
  );
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!setup) {
      Alert.alert('Sesión', 'Volvé a iniciar sesión para configurar la app autenticadora.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    }
  }, [setup, router]);

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
    if (!code.trim()) {
      Alert.alert('Código', 'Ingresá el código de 6 dígitos de tu app autenticadora.');
      return;
    }
    setLoading(true);
    const result = await submitSignInChallengeCode(code);
    setLoading(false);
    await followSignInResult(router, result, {
      email: getLastSignInEmail(),
      setLoading,
    });
  }

  if (!setup) {
    return (
      <AuthBackground>
        <SafeAreaView style={Layout.flex1} edges={['left', 'right']} />
      </AuthBackground>
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
                <Text style={TextStyles.screenTitle}>App autenticadora</Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>
                  Escaneá el código con Google Authenticator, Authy u otra app compatible. Si no podés
                  escanear, ingresá la clave manualmente.
                </Text>
              </View>

              <View style={styles.qrWrap}>
                <QRCode value={setup.setupUri} size={200} />
              </View>

              <Text style={[TextStyles.caption, styles.secretLabel]}>Clave manual</Text>
              <Text selectable style={styles.secret}>
                {setup.sharedSecret}
              </Text>

              <View style={[Layout.formColumn, styles.formTop]}>
                <AuthTextField
                  label="Código de verificación"
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  icon={Hash}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <AuthPrimaryButton title="Confirmar" onPress={handleSubmit} loading={loading} />
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
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  qrWrap: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: PrismColors.surface,
    borderRadius: 12,
    alignSelf: 'center',
  },
  secretLabel: {
    marginBottom: Spacing.xs,
  },
  secret: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: PrismColors.textPrimary,
    marginBottom: Spacing.lg,
  },
  formTop: {
    marginTop: Spacing.sm,
  },
  footer: {
    marginTop: Spacing.md,
  },
});
