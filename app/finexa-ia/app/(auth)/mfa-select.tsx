import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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

import { AuthBackground, AuthBranding, AuthCard } from '@/components/auth';
import { PrismColors } from '@/constants/theme';
import { BorderColors, Layout, Radius, Spacing, TextStyles } from '@/constants/uiStyles';
import { followSignInResult } from '@/lib/auth/followSignInResult';
import { getLastSignInEmail } from '@/lib/auth/lastSignInContext';
import { submitSignInMfaChoice, type MfaMethod } from '@/lib/auth/cognito';

function parseTypes(raw: string | undefined): MfaMethod[] {
  if (!raw) return ['SMS', 'TOTP'];
  const parts = raw.split(',').map((s) => s.trim());
  const out = parts.filter((x): x is MfaMethod => x === 'SMS' || x === 'TOTP' || x === 'EMAIL');
  return out.length > 0 ? out : ['SMS', 'TOTP'];
}

function labelFor(method: MfaMethod): string {
  switch (method) {
    case 'SMS':
      return 'Código por SMS';
    case 'TOTP':
      return 'App autenticadora';
    case 'EMAIL':
      return 'Código por correo';
  }
}

export default function MfaSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ types?: string; isSetup?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const allowed = useMemo(
    () => parseTypes(typeof params.types === 'string' ? params.types : undefined),
    [params.types],
  );
  const isSetup = params.isSetup === '1';
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

  async function choose(method: MfaMethod) {
    setLoading(true);
    const result = await submitSignInMfaChoice(method);
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
                <Text style={TextStyles.screenTitle}>
                  {isSetup ? 'Configurar verificación' : 'Verificación en dos pasos'}
                </Text>
                <Text style={[TextStyles.caption, styles.subtitle]}>
                  Elegí cómo querés recibir o generar el código.
                </Text>
              </View>

              <View style={styles.buttonColumn}>
                {allowed.map((method) => (
                  <Pressable
                    key={method}
                    onPress={() => {
                      if (loading) return;
                      void choose(method);
                    }}
                    disabled={loading}
                    style={({ pressed }) => [
                      styles.methodBtn,
                      pressed && { opacity: 0.9 },
                      loading && { opacity: 0.5 },
                    ]}>
                    <Text style={TextStyles.bodyMedium}>{labelFor(method)}</Text>
                  </Pressable>
                ))}
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
  buttonColumn: {
    gap: Spacing.md,
  },
  methodBtn: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BorderColors.subtle,
    backgroundColor: PrismColors.surface,
    alignItems: 'center',
  },
  footer: {
    marginTop: Spacing.md,
  },
});
