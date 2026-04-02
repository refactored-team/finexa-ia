import { StyleSheet, Text, View } from 'react-native';

import { Fonts, PrismColors } from '@/constants/theme';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';
import {
  evaluatePasswordAgainstPolicy,
  type CognitoLikePasswordPolicy,
} from '@/lib/auth/passwordPolicy';

const F = Fonts!;

type Level = 'weak' | 'medium' | 'strong';

function getLevelFromChecks(password: string, allOk: boolean): Level {
  if (password.length === 0) return 'weak';
  if (!allOk) return 'weak';
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
      return 'Completá los requisitos';
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
  /** Alineado con la política del User Pool (por defecto Cognito-like). */
  policy?: CognitoLikePasswordPolicy;
};

export function AuthPasswordStrength({ password, compact, policy }: AuthPasswordStrengthProps) {
  const checks = evaluatePasswordAgainstPolicy(password, policy);
  const allOk = checks.every((c) => c.ok);
  const level = getLevelFromChecks(password, allOk);
  const filled = getFilledCount(level, password.length);
  const inactive = `${PrismColors.primaryBorder}99`;

  if (password.length === 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
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

      <Text style={styles.rulesTitle}>Requisitos (como en Cognito)</Text>
      {checks.map((c) => (
        <View key={c.id} style={styles.ruleRow}>
          <Text style={[styles.ruleIcon, c.ok ? styles.ruleOk : styles.rulePending]}>
            {c.ok ? '✓' : '○'}
          </Text>
          <Text style={[styles.ruleText, c.ok && styles.ruleTextOk]}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    gap: Spacing.sm,
  },
  wrapCompact: {
    marginTop: 6,
    gap: Spacing.xs,
  },
  row: {
    ...Layout.row,
    alignItems: 'center',
    gap: 6,
  },
  rowCompact: {
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
  rulesTitle: {
    fontFamily: F.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: PrismColors.textSecondary,
    marginTop: Spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  ruleIcon: {
    fontSize: 14,
    lineHeight: 20,
    width: 18,
    textAlign: 'center',
  },
  ruleOk: {
    color: PrismColors.primary,
  },
  rulePending: {
    color: PrismColors.textSecondary,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: PrismColors.textSecondary,
  },
  ruleTextOk: {
    color: PrismColors.textPrimary,
  },
});
