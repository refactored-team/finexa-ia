import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FixedCostsCard({
  total = 20256,
  ratio = 35.5,
}: {
  total?: number;
  ratio?: number;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.statusMicro}>[FIXED_COSTS: STABLE]</Text>

      {/* Accent Top Left */}
      <View style={[styles.prismAccent, styles.prismAccentTl]} />

      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>Carga Fija</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('en-US')}</Text>
          <Text style={styles.ratioBadge}>[FIXED_RATIO: {ratio}%]</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.itemText}>Renta ($9,200)</Text>
          <Text style={styles.itemText}>Gym ($499)</Text>
          <Text style={styles.itemText}>CFE ($450)</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio}%` }]} />
      </View>
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
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  leftCol: {
    flex: 1,
  },
  title: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 18,
    color: PrismColors.textPrimary,
  },
  totalValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 26,
    color: PrismColors.textPrimary,
    marginTop: 4,
  },
  ratioBadge: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.primary,
    marginTop: Spacing.md,
    letterSpacing: 0.5,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
  },
  itemText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: PrismColors.textSecondary,
  },
  progressTrack: {
    marginTop: Spacing.xl,
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PrismColors.primary,
    borderRadius: Radius.full,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
});
