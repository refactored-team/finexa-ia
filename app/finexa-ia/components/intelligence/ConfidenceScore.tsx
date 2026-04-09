import { PrismColors } from '@/constants/theme';
import { Radius, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient
      colors={['#3525cd', '#1e128c']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <View style={[styles.prismAccent, styles.prismAccentTl]} />

      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Puntaje de Confianza</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>{displayScore}</Text>
            <ShieldCheck size={20} color="#00FFFF" fill="rgba(0,255,255,0.25)" />
          </View>
          {riskLevel != null && (
            <Text style={styles.riskLabel}>Riesgo: {riskLevel}</Text>
          )}
        </View>

        <View style={styles.iconWrap}>
          <Sparkles size={20} color="#00FFFF" />
        </View>
      </View>

      {summary != null && (
        <Text style={styles.summaryText}>{summary}</Text>
      )}

      <View style={[styles.prismAccent, styles.prismAccentBr]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    padding: Spacing.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: Spacing.md,
    shadowColor: '#1e128c',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
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
    backgroundColor: '#00FFFF',
    shadowColor: '#00FFFF',
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
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#F8FAFC',
    fontWeight: '600',
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#E2E8F0',
    marginTop: 4,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  summaryText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: '#F1F5F9',
    fontWeight: '500',
  },
});
