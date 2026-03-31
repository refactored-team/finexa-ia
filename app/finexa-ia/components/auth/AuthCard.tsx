import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { BorderColors, Radius, Shadow, Spacing } from '@/constants/uiStyles';

type AuthCardProps = {
  children: ReactNode;
  compact?: boolean;
};

export function AuthCard({ children, compact }: AuthCardProps) {
  return <View style={[styles.card, compact && styles.cardCompact]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BorderColors.card,
    backgroundColor: PrismColors.surface,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  cardCompact: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
});
