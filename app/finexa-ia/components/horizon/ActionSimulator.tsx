import { CalendarCheck, SlidersHorizontal } from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React, { useCallback, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type ActionSimulatorProps = {
  /** Minimum extra monthly saving */
  minSaving?: number;
  /** Maximum extra monthly saving */
  maxSaving?: number;
  /** Initial value */
  initialSaving?: number;
  /** Callback that receives the projected date label given a saving amount */
  getProjectedDate: (savingAmount: number) => string;
};

export default function ActionSimulator({
  minSaving = 0,
  maxSaving = 2000,
  initialSaving = 1500,
  getProjectedDate,
}: ActionSimulatorProps) {
  const [saving, setSaving] = useState(initialSaving);
  const [trackWidth, setTrackWidth] = useState(0);

  const progress = (saving - minSaving) / (maxSaving - minSaving);
  const projectedDate = getProjectedDate(saving);

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (trackWidth <= 0) return;
      const x = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      const newValue = Math.round((minSaving + ratio * (maxSaving - minSaving)) / 50) * 50;
      setSaving(Math.max(minSaving, Math.min(maxSaving, newValue)));
    },
    [trackWidth, minSaving, maxSaving],
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Simulador de Acción</Text>
        <SlidersHorizontal
          size={18}
          color={`${PrismColors.primary}66`}
          strokeWidth={2}
        />
      </View>

      {/* Slider section */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>AHORRO EXTRA MENSUAL</Text>
          <Text style={styles.sliderValue}>+${saving.toLocaleString('en-US')}</Text>
        </View>

        {/* Custom slider track */}
        <View
          style={styles.sliderTrack}
          onLayout={handleTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleTouch}
          onResponderMove={handleTouch}
        >
          <View
            style={[styles.sliderFill, { width: `${progress * 100}%` }]}
          />
          <View
            style={[
              styles.sliderThumb,
              { left: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Projected date result */}
      <View style={styles.resultBox}>
        <CalendarCheck
          size={22}
          color={PrismColors.primary}
          strokeWidth={2}
        />
        <View>
          <Text style={styles.resultLabel}>NUEVA LLEGADA PROYECTADA</Text>
          <Text style={styles.resultValue}>{projectedDate}</Text>
        </View>
      </View>

      <Text style={styles.tagMicro}>[SIM_ENG: READY]</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 16,
    letterSpacing: -0.3,
    color: PrismColors.textPrimary,
  },
  sliderSection: {
    marginBottom: Spacing.xl,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  sliderLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(25, 28, 30, 0.45)',
  },
  sliderValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 21,
    letterSpacing: -0.5,
    color: PrismColors.primary,
    fontVariant: ['tabular-nums'],
  },
  sliderTrack: {
    height: 20,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 9,
    height: 2,
    backgroundColor: PrismColors.primary,
    borderRadius: Radius.full,
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: PrismColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: `${PrismColors.primary}0D`,
    borderWidth: 0.5,
    borderColor: `${PrismColors.primary}1A`,
  },
  resultLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: `${PrismColors.primary}B3`,
  },
  resultValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 18,
    letterSpacing: -0.3,
    color: PrismColors.textPrimary,
    marginTop: 2,
  },
  tagMicro: {
    position: 'absolute',
    top: 12,
    right: 20,
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(30, 41, 59, 0.3)',
    textTransform: 'uppercase',
  },
});
