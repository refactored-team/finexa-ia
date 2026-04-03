import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PrismColors } from '@/constants/theme';
import { Layout, Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { signOutUser } from '@/lib/auth/cognito';

export default function HomeScreen() {
  const router = useRouter();

  async function handleSignOut() {
    if (isAmplifyAuthConfigured()) {
      await signOutUser();
    }
    router.replace('/login');
  }

  return (
    <ThemedView style={Layout.flex1}>
      <SafeAreaView style={Layout.flex1} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <ThemedText type="title">Inicio</ThemedText>
            <Text style={[TextStyles.tabCardBody, styles.lead]}>Punto de partida para las pantallas de Finexa.</Text>
          </View>
          <View style={styles.card}>
            <Text style={TextStyles.tabCardTitle}>Tema y estilos</Text>
            <Text style={[TextStyles.tabCardBody, styles.cardSub]}>
              Editá esta pantalla en app/(tabs)/home.tsx
            </Text>
          </View>
          <View style={styles.linkBlock}>
            <Link href="/modal">
              <Text style={TextStyles.tabLink}>Abrir modal de ejemplo</Text>
            </Link>
            {isAmplifyAuthConfigured() ? (
              <Pressable onPress={handleSignOut} style={styles.signOut} hitSlop={8}>
                <Text style={TextStyles.linkSmall}>Cerrar sesión</Text>
              </Pressable>
            ) : null}
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
  lead: {
    marginTop: Spacing.sm,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    backgroundColor: PrismColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.card,
  },
  cardSub: {
    marginTop: Spacing.xs,
  },
  linkBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  signOut: {
    alignSelf: 'flex-start',
  },
});
