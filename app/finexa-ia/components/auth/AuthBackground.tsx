import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDown, User } from '@/constants/lucideIcons';
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
  showHeader?: boolean;
};

export function AuthBackground({ children, showBottomBar = false, showHeader = false }: AuthBackgroundProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const insets = useSafeAreaInsets();
  const paddingTop = insets.top || Spacing.md;

  async function handleSignOut() {
    if (signingOut) return;
    setMenuOpen(false);
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


      {showHeader && (
        <View style={[styles.header, { paddingTop }]}>
          <View style={styles.profileMenuWrap}>
            <Pressable
              onPress={() => setMenuOpen((prev) => !prev)}
              style={styles.profileButton}
              hitSlop={10}>
              <View style={styles.profileIcon}>
                <User size={16} color={PrismColors.textSecondary} />
              </View>
              <ChevronDown size={14} color={PrismColors.textSecondary} />
            </Pressable>

            {menuOpen && (
              <View style={styles.dropdownMenu}>
                <Pressable onPress={handleSignOut} style={styles.menuItem} hitSlop={8}>
                  {signingOut ? (
                    <ActivityIndicator size="small" color={PrismColors.primary} />
                  ) : (
                    <Text style={styles.menuItemText}>Cerrar sesión</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
          {menuOpen && (
            <Pressable
              onPress={() => setMenuOpen(false)}
              style={styles.backdropDismiss}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú de perfil"
            />
          )}
        </View>
      )}

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
  profileMenuWrap: {
    position: 'relative',
    zIndex: 3,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuItemText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: PrismColors.textSecondary,
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
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
