import { Bot } from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type GoalHeroCardProps = {
  /** Goal title, e.g. "Viaje a Japón" */
  title: string;
  /** Target amount in USD */
  targetAmount: number;
  /** Current liquidity saved so far */
  liquidityAmount: number;
  /** AI-generated narrative (plain text) */
  aiNarrative: string;
  /** Highlighted projected month */
  currentProjection: string;
  /** Accelerated month suggestion */
  acceleratedProjection: string;
};

export default function GoalHeroCard({
  title,
  targetAmount,
  liquidityAmount,
  aiNarrative,
  currentProjection,
  acceleratedProjection,
}: GoalHeroCardProps) {
  const progressPercent = Math.min((liquidityAmount / targetAmount) * 100, 100);

  return (
    <View style={styles.cardContainer}>

      <View style={styles.cardInner}>
        {/* Header: title + target amount */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.label}>META OBJETIVO</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.amountValue}>
              ${targetAmount.toLocaleString('en-US')}
            </Text>
            <Text style={styles.label}>USD</Text>
          </View>
        </View>

        {/* Liquidity progress bar */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[PrismColors.primary, PrismColors.tertiary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
          <View style={styles.progressLabelWrap}>
            <Text style={styles.progressLabel}>
              ${liquidityAmount.toLocaleString('en-US')} LIQUIDEZ
            </Text>
          </View>
        </View>

        {/* AI narrative bubble */}
        <View style={styles.narrativeBubble}>
          <Text style={styles.narrativeText}>
            Analicé tu liquidez proyectada de{' '}
            <Text style={styles.narrativeHighlightPrimary}>
              ${liquidityAmount.toLocaleString('en-US')}
            </Text>
            . Al ritmo actual, tu meta nos espera en{' '}
            <Text style={styles.narrativeBold}>{currentProjection}</Text>
            . ¿Qué tal si lo adelantamos a{' '}
            <Text style={styles.narrativeHighlightTertiary}>
              {acceleratedProjection}
            </Text>
            ?
          </Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    ...Shadow.card,
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(39, 75, 154, 0.08)',
    overflow: 'hidden',
  },
  botBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 48,
    height: 48,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  botIconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Radius.md,
    padding: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    paddingRight: 40, // space for bot badge
  },
  title: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 22,
    letterSpacing: -0.3,
    color: PrismColors.textPrimary,
  },
  label: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(25, 28, 30, 0.45)',
    marginTop: 4,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 22,
    letterSpacing: -0.5,
    color: PrismColors.primary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 24,
    width: '100%',
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(37, 99, 235, 0.05)',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.md,
  },
  progressLabelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingLeft: Spacing.md,
  },
  progressLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: '#020202ff',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  narrativeBubble: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: PrismColors.primary,
    marginBottom: Spacing.lg,
  },
  narrativeText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 11,
    lineHeight: 18,
    color: 'rgba(30, 41, 59, 0.9)',
  },
  narrativeHighlightPrimary: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    color: PrismColors.primary,
  },
  narrativeHighlightTertiary: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    color: PrismColors.tertiary,
  },
  narrativeBold: {
    fontFamily: TextStyles.screenTitle.fontFamily,
  },
  tagMicro: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(30, 41, 59, 0.3)',
    textTransform: 'uppercase',
  },
});
