import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { PiggyBank } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ChartDataPoint = {
  day: string;
  value: number;
  highlighted?: boolean;
};

export default function AsymmetricAnalytics({
  weeklyData = [
    { day: 'L', value: 40 },
    { day: 'M', value: 60 },
    { day: 'M', value: 30 },
    { day: 'J', value: 80 },
    { day: 'V', value: 50 },
    { day: 'S', value: 95, highlighted: true },
    { day: 'D', value: 45 },
  ],
  projection = "+$4.2k",
}: {
  weeklyData?: ChartDataPoint[];
  projection?: string;
}) {
  const maxVal = Math.max(...weeklyData.map((d) => d.value));

  return (
    <View style={styles.container}>
      {/* Chart Section */}
      <View style={styles.chartCard}>
        <Text style={styles.statusMicro}>[CHART_RENDER: H_FREQ]</Text>
        <Text style={styles.chartTitle}>Curva de Gasto Semanal</Text>

        <View style={styles.chartArea}>
          {weeklyData.map((item, index) => {
            const heightPercent = maxVal === 0 ? 0 : (item.value / maxVal) * 100;
            const isHighlighted = item.highlighted;

            // Adjust opacity basd on value just like the html roughly
            const barOpacity = isHighlighted ? 1 : 0.1 + (heightPercent / 100) * 0.4;
            const barColor = isHighlighted ? PrismColors.primary : PrismColors.primary;

            return (
              <View key={`bar-${index}`} style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: barColor,
                      opacity: isHighlighted ? 1 : barOpacity,
                    },
                    isHighlighted && styles.barShadow,
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.xLabels}>
          {weeklyData.map((item, index) => (
            <Text key={`label-${index}`} style={styles.xLabelText}>
              {item.day}
            </Text>
          ))}
        </View>

        {/* Accent Bottom Right */}
        <View style={[styles.prismAccent, styles.prismAccentBr]} />
      </View>

      {/* Projection Card */}
      <View style={styles.projectionCard}>
        <Text style={[styles.statusMicro, { color: 'rgba(6, 182, 212, 0.4)' }]}>[PRJ: AUTO]</Text>

        <View style={styles.projIconWrap}>
          <PiggyBank size={24} color={PrismColors.tertiary} />
        </View>

        <View style={styles.projContent}>
          <Text style={styles.projLabel}>PROYECCIÓN</Text>
          <Text style={styles.projValue}>{projection}</Text>
        </View>

        {/* Accent Bottom Right for Projection */}
        <View style={[styles.prismAccent, styles.prismAccentProjBr]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  chartCard: {
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
  chartTitle: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(30, 41, 59, 0.8)',
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  chartArea: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 4,
  },
  barWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barShadow: {
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    zIndex: 10,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  xLabelText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: 'rgba(100, 116, 139, 0.6)',
  },
  projectionCard: {
    flex: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.1)', // Secondary/Tertiary light background
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  projIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  projContent: {
    marginTop: Spacing.xl,
  },
  projLabel: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(6, 182, 212, 0.8)',
    marginBottom: 4,
  },
  projValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 24,
    color: PrismColors.tertiary,
    letterSpacing: -1,
  },
  statusMicro: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 8,
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
  prismAccentBr: {
    bottom: -1,
    right: -1,
    backgroundColor: PrismColors.tertiary,
    shadowColor: PrismColors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  prismAccentProjBr: {
    bottom: -1,
    right: -1,
    backgroundColor: PrismColors.tertiary,
    shadowColor: PrismColors.tertiary,
  },
});
