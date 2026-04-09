import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import { isAmplifyAuthConfigured } from '@/lib/amplify/configure';
import { signOutUser } from '@/lib/auth/cognito';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomBottomBar from '../navigation/CustomBottomBar';

type AuthBackgroundProps = {
  children: ReactNode;
  showBottomBar?: boolean;
};

export function AuthBackground({ children, showBottomBar = false }: AuthBackgroundProps) {
  const [signingOut, setSigningOut] = useState(false);

  const insets = useSafeAreaInsets();
  const paddingTop = insets.top || Spacing.md;

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
    <View style={Layout.flex1}>


      {/* HEADER */}
      <View style={[styles.header, { paddingTop }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleSignOut} style={styles.signOutBtn} hitSlop={10}>
            {signingOut ? <ActivityIndicator size="small" color={PrismColors.primary} /> : <Text style={styles.signOutText}>Cerrar sesión</Text>}
          </Pressable>
        </View>
      </View>

      <View style={[Layout.flex1, { backgroundColor: PrismColors.neutral }]}>
        {children}
        {showBottomBar && <CustomBottomBar />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutBtn: {
    padding: Spacing.sm,
  },
  signOutText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: PrismColors.textSecondary,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.9,
  },
  blobTopLeft: {
    width: 320,
    height: 320,
    top: -80,
    left: -80,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -40,
    right: -60,
  },
  blobBottomRight: {
    width: 360,
    height: 360,
    bottom: -100,
    right: -100,
  },
  blobBottomLeft: {
    width: 260,
    height: 260,
    bottom: -60,
    left: -60,
  },
});
