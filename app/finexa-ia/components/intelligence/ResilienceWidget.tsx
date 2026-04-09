import { PrismColors } from '@/constants/theme';
import { Radius, Spacing, TextStyles } from '@/constants/uiStyles';
import { Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ResilienceWidget({
  liquidity = 57000,
  percentage = 85,
}: {
  liquidity?: number;
  percentage?: number;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.bgIconWrap}>
        <Zap size={100} color={PrismColors.primary} opacity={0.12} fill={PrismColors.primary} />
      </View>

      <Text style={styles.label}>Indice de Resiliencia</Text>

      <View style={styles.valueWrap}>
        <Text style={styles.valueText}>${liquidity.toLocaleString('en-US')}</Text>
        <Text style={styles.subValueText}>liquidez observada</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      <Text style={styles.footerText}>
        Capacidad de respuesta ante imprevistos optimizada al {percentage}%.
      </Text>

      <View style={[styles.prismAccent, styles.prismAccentBr]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PrismColors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  statusMicro: {
    position: 'absolute',
    top: 8,
    right: 16,
    fontSize: 9,
    fontFamily: TextStyles.caption.fontFamily,
    color: PrismColors.textSecondary,
    letterSpacing: 1,
  },
  bgIconWrap: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  label: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#0F172A',
    marginTop: Spacing.sm,
    fontWeight: '700',
  },
  valueWrap: {
    marginTop: Spacing.md,
  },
  valueText: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 32,
    color: '#0F172A',
    letterSpacing: -1,
    fontWeight: '700',
  },
  subValueText: {
    color: '#0E7490',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  progressTrack: {
    marginTop: Spacing.xl,
    height: 6,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PrismColors.tertiary,
    borderRadius: Radius.full,
    shadowColor: PrismColors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  footerText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 13,
    color: '#1E293B',
    marginTop: Spacing.lg,
    lineHeight: 20,
    fontWeight: '500',
  },
  prismAccent: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  prismAccentBr: {
    bottom: -1,
    right: -1,
    backgroundColor: PrismColors.tertiary,
    shadowColor: PrismColors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
