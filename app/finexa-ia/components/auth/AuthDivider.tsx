import { StyleSheet, Text, View } from 'react-native';

import { BorderColors, Layout, Spacing, TextStyles } from '@/constants/uiStyles';

type AuthDividerProps = {
  label: string;
  compact?: boolean;
};

export function AuthDivider({ label, compact }: AuthDividerProps) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View style={styles.line} />
      <Text style={[TextStyles.dividerLabel, styles.label]}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...Layout.row,
    alignItems: 'center',
    gap: Spacing.xl,
    marginVertical: Spacing.xl,
  },
  rowCompact: {
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: BorderColors.divider,
  },
  label: {
    flexShrink: 0,
  },
});
