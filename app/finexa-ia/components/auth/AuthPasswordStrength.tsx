import { StyleSheet, Text, View } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';

type Level = 'weak' | 'medium' | 'strong';

function getLevel(password: string): Level {
  if (password.length === 0) return 'weak';
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  return 'strong';
}

function getFilledCount(level: Level, passwordLength: number): number {
  if (passwordLength === 0) return 0;
  switch (level) {
    case 'weak':
      return 1;
    case 'medium':
      return 2;
    case 'strong':
      return 4;
    default:
      return 0;
  }
}

function getLabel(level: Level): string {
  switch (level) {
    case 'weak':
      return 'Débil';
    case 'medium':
      return 'Seguridad media';
    case 'strong':
      return 'Fuerte';
    default:
      return '';
  }
}

type AuthPasswordStrengthProps = {
  password: string;
  compact?: boolean;
};

export function AuthPasswordStrength({ password, compact }: AuthPasswordStrengthProps) {
  const level = getLevel(password);
  const filled = getFilledCount(level, password.length);
  const inactive = `${PrismColors.primaryBorder}99`;

  if (password.length === 0) {
    return null;
  }

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i < filled ? PrismColors.primary : inactive },
          ]}
        />
      ))}
      <Text style={[TextStyles.strengthLabel, styles.label]}>{getLabel(level)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...Layout.row,
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  rowCompact: {
    marginTop: 6,
    gap: 4,
  },
  dot: {
    height: 6,
    width: 32,
    borderRadius: 9999,
  },
  label: {
    marginLeft: Spacing.sm,
  },
});
