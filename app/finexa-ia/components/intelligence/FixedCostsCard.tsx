import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecurringExpense } from '@/src/types/transactions';

export default function FixedCostsCard({
  total = 0,
  ratio = 0,
  items = [],
}: {
  total?: number;
  ratio?: number;
  items?: RecurringExpense[];
}) {
  return (
    <View style={styles.container}>
      {/* Accent Top Left */}
      <View style={[styles.prismAccent, styles.prismAccentTl]} />

      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          <Text style={styles.title}>Carga Fija</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('en-US')}</Text>
          <Text style={styles.ratioBadge}>PORCENTAJE FIJO: {ratio}%</Text>
        </View>

        <View style={styles.rightCol}>
          {items.slice(0, 3).map((item, index) => {
            return (
              <Text key={`fixed-${index}`} style={styles.itemText}>
                {item.name} (${item.amount.toLocaleString('en-US')})
              </Text>
            );
          })}
          {items.length === 0 && (
            <Text style={styles.itemText}>No hay datos</Text>
          )}
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
    color: '#0F172A',
    fontWeight: '700',
  },
  totalValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 26,
    color: '#0F172A',
    marginTop: 4,
    fontWeight: '700',
  },
  ratioBadge: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
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
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
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
