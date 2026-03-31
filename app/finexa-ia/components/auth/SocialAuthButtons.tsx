import { Apple, Globe } from '@/constants/lucideIcons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { BorderColors, Layout, Radius, Spacing, TextStyles } from '@/constants/uiStyles';

type SocialAuthButtonsProps = {
  mode: 'sign-up' | 'sign-in';
  compact?: boolean;
};

export function SocialAuthButtons({ mode, compact }: SocialAuthButtonsProps) {
  const verb = mode === 'sign-up' ? 'registrarte' : 'iniciar sesión';

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Pressable
        onPress={() => Alert.alert('Google', `Google — ${verb} (próximamente)`)}
        style={({ pressed }) => [
          styles.btn,
          compact && styles.btnCompact,
          pressed && { backgroundColor: PrismColors.neutral },
        ]}>
        <Globe size={compact ? 16 : 18} color={PrismColors.textSecondary} strokeWidth={2} />
        <Text style={TextStyles.socialLabel}>Google</Text>
      </Pressable>
      <Pressable
        onPress={() => Alert.alert('Apple', `Apple — ${verb} (próximamente)`)}
        style={({ pressed }) => [
          styles.btn,
          compact && styles.btnCompact,
          pressed && { backgroundColor: PrismColors.neutral },
        ]}>
        <Apple size={compact ? 18 : 20} color={PrismColors.textPrimary} strokeWidth={2} />
        <Text style={TextStyles.socialLabel}>Apple</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...Layout.row,
    gap: Spacing.xl,
  },
  rowCompact: {
    gap: Spacing.md,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: BorderColors.subtle,
  },
  btnCompact: {
    paddingVertical: Spacing.sm,
  },
});
