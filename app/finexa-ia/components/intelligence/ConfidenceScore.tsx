import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ConfidenceScoreProps = {
  antExpensePercentage?: number;
  riskLevel?: string;
  summary?: string;
};

export default function ConfidenceScore({
  antExpensePercentage,
  riskLevel,
  summary,
}: ConfidenceScoreProps) {
  const displayScore = antExpensePercentage != null ? `${antExpensePercentage}%` : '—';

  return (
    <View style={styles.container}>
      {/* Accent Top Left */}
      <View style={[styles.prismAccent, styles.prismAccentTl]} />

      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Puntaje de Confianza</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{displayScore}</Text>
            <ShieldCheck size={20} color={PrismColors.tertiary} fill={PrismColors.tertiary + '30'} />
          </View>
          {riskLevel != null && (
            <Text style={styles.riskLabel}>Riesgo: {riskLevel}</Text>
          )}
        </View>

        <View style={styles.iconWrap}>
          <Sparkles size={20} color={PrismColors.tertiary} />
        </View>
      </View>

      {summary != null && (
        <Text style={styles.summaryText}>{summary}</Text>
      )}

      {/* Accent Bottom Right */}
      <View style={[styles.prismAccent, styles.prismAccentBr]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    ...Shadow.card,
    overflow: 'hidden',
    padding: Spacing.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(39, 75, 154, 0.08)',
    gap: Spacing.md,
  },
  statusMicro: {
    position: 'absolute',
    top: 8,
    right: 16,
    fontSize: 9,
    fontFamily: TextStyles.caption.fontFamily,
    color: 'rgba(0,0,0,0.3)',
    letterSpacing: 1,
  },
  prismAccent: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  prismAccentTl: {
    top: -1,
    left: -1,
    backgroundColor: PrismColors.primary,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  prismAccentBr: {
    bottom: -1,
    right: -1,
    backgroundColor: PrismColors.tertiary,
    shadowColor: PrismColors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  label: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(30, 41, 59, 0.7)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  scoreText: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 36,
    letterSpacing: -1,
    color: PrismColors.primary,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.2)', // tertiary with opacity
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  footerLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(30, 41, 59, 0.4)',
    textTransform: 'uppercase',
  },
  riskLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    letterSpacing: 0.5,
    color: 'rgba(30, 41, 59, 0.6)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  summaryText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(30, 41, 59, 0.7)',
  },
});
