import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export type EmergencyShieldProps = {
  /** Days of financial runway */
  runwayDays: number;
  /** Maximum days the gauge represents (for visual) */
  maxDays?: number;
  /** Emergency fund amount */
  securedAmount: number;
  /** Status label, e.g. "CRITICAL_LOW" */
  runwayStatus: string;
};

const GAUGE_SIZE = 128;
const STROKE_WIDTH = 5;
const GAUGE_RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export default function EmergencyShield({
  runwayDays,
  maxDays = 180,
  securedAmount,
  runwayStatus,
}: EmergencyShieldProps) {
  const progress = Math.min(runwayDays / maxDays, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.card}>
      {/* Radial gauge */}
      <View style={styles.gaugeContainer}>
        <Svg
          width={GAUGE_SIZE}
          height={GAUGE_SIZE}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.05)"
            strokeWidth={0.5}
          />
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={GAUGE_RADIUS}
            fill="transparent"
            stroke={PrismColors.danger}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        {/* Center label */}
        <View style={styles.gaugeCenter}>
          <Text style={styles.gaugeDays}>{runwayDays}</Text>
          <Text style={styles.gaugeLabel}>Días</Text>
        </View>
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Escudo de Emergencia</Text>
        <Text style={styles.securedAmount}>
          ${securedAmount.toLocaleString('en-US')} Asegurados
        </Text>
        <Text style={styles.statusTag}>
          [RUNWAY_STATUS: {runwayStatus}]
        </Text>
      </View>

      {/* Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PRO SECURITY BENCHMARK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    marginBottom: Spacing.xl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeDays: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 42,
    letterSpacing: -1,
    color: PrismColors.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: 42,
  },
  gaugeLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(25, 28, 30, 0.4)',
    marginTop: 4,
  },
  infoSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 16,
    letterSpacing: -0.3,
    color: PrismColors.textPrimary,
  },
  securedAmount: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 11,
    letterSpacing: -0.2,
    color: PrismColors.primary,
  },
  statusTag: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: PrismColors.danger,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: Spacing.lg + 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    backgroundColor: 'rgba(6, 182, 212, 0.06)',
  },
  badgeText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: PrismColors.tertiary,
  },
});
