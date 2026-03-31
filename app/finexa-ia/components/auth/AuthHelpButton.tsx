import { CircleHelp } from '@/constants/lucideIcons';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { BorderColors, Radius, Shadow, Spacing } from '@/constants/uiStyles';

export function AuthHelpButton() {
  return (
    <Pressable
      onPress={() => Alert.alert('Ayuda', 'Soporte próximamente.')}
      style={({ pressed }) => [styles.fab, Shadow.fab, pressed && { transform: [{ scale: 1.05 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Ayuda">
      <CircleHelp size={24} color={PrismColors.primary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    right: Spacing.xl,
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PrismColors.surface,
    borderWidth: 1,
    borderColor: BorderColors.subtle,
  },
});
