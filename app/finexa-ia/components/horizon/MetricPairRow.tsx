import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LucideIcon } from '@/constants/lucideIcons';

export type MetricItem = {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number;
  /** 0–1 progress ratio */
  progress: number;
  progressColor: string;
};

export type MetricPairRowProps = {
  left: MetricItem;
  right?: MetricItem;
};

function MetricCard({ item }: { item: MetricItem }) {
  const IconComponent = item.icon;
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <IconComponent size={14} color={item.iconColor} strokeWidth={2} />
        <Text style={styles.label}>{item.label}</Text>
      </View>
      <Text style={styles.value}>
        ${item.value.toLocaleString('en-US')}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(item.progress * 100, 100)}%`,
              backgroundColor: item.progressColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function MetricPairRow({ left, right }: MetricPairRowProps) {
  return (
    <View style={styles.row}>
      <MetricCard item={left} />
      {right ? <MetricCard item={right} /> : <View style={{ flex: 1 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  card: {
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(25, 28, 30, 0.45)',
  },
  value: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 19,
    letterSpacing: -0.5,
    color: PrismColors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
