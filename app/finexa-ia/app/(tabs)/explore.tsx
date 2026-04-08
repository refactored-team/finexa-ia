import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { signOutUser } from '@/lib/auth/cognito';

export default function ExploreScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      if (!isAmplifyAuthConfigured()) {
        router.replace('/login');
        return;
      }
      const result = await signOutUser();
      if (!result.ok) {
        Alert.alert('Cerrar sesión', result.message);
        return;
      }
      router.replace('/login');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ThemedView style={Layout.flex1}>
      <SafeAreaView style={Layout.flex1} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <ThemedText type="title" style={styles.headerTitle}>
                Explorar
              </ThemedText>
              <Pressable
                onPress={handleSignOut}
                disabled={signingOut}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                accessibilityState={{ disabled: signingOut }}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.signOutPress,
                  pressed && !signingOut && styles.signOutPressed,
                  signingOut && styles.signOutDisabled,
                ]}>
                {signingOut ? (
                  <View style={styles.signOutRow}>
                    <ActivityIndicator size="small" color={PrismColors.primary} />
                    <Text style={styles.signOutLabel}>Cerrando sesión…</Text>
                  </View>
                ) : (
                  <Text style={styles.signOutLabel}>Cerrar sesión</Text>
                )}
              </Pressable>
            </View>
            <Text style={[TextStyles.tabCardBody, styles.lead]}>
              Segunda pestaña — reemplazá este contenido por tu pantalla.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  signOutPress: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
  },
  signOutPressed: {
    opacity: 0.85,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  signOutLabel: {
    ...TextStyles.tabCardBody,
    color: PrismColors.primary,
    fontWeight: '600',
  },
  lead: {
    marginTop: Spacing.sm,
  },
});
