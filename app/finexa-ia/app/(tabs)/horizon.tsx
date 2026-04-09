import { GitBranch, Home } from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { Spacing, TextStyles } from '@/constants/uiStyles';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth';
import {
  ActionSimulator,
  EmergencyShield,
  GoalHeroCard,
  MetricPairRow,
  OptimizeButton,
} from '@/components/horizon';
import { useResilienceFactors } from '@/src/hooks/useResilienceFactors';

// ---------------------------------------------------------------------------
//  Static demo data — replace with API/store data when available
// ---------------------------------------------------------------------------

const GOAL_DATA = {
  title: 'Viaje a Japón',
  targetAmount: 65_000,
  liquidityAmount: 8_250,
  currentProjection: 'Octubre',
  acceleratedProjection: 'Agosto',
  aiNarrative: '',
};

const METRICS = {
  left: {
    icon: Home,
    iconColor: `${PrismColors.primary}B3`,
    label: 'Carga Fija',
    value: 20_256,
    progress: 0.75,
    progressColor: PrismColors.primary,
  },
  right: {
    icon: GitBranch,
    iconColor: PrismColors.tertiary,
    label: 'Maniobra',
    value: 5_450,
    progress: 0.33,
    progressColor: PrismColors.tertiary,
  },
};

const EMERGENCY = {
  runwayDays: 18,
  securedAmount: 10_500,
  runwayStatus: 'CRITICAL_LOW',
};

/**
 * Maps a monthly saving amount to a projected arrival month.
 * In production this would call a projection engine or read from state.
 */
function getProjectedDate(savingAmount: number): string {
  if (savingAmount >= 1800) return 'Junio 2026';
  if (savingAmount >= 1500) return 'Agosto 2026';
  if (savingAmount >= 1000) return 'Octubre 2026';
  if (savingAmount >= 500) return 'Enero 2027';
  return 'Abril 2027';
}

// ---------------------------------------------------------------------------
//  Screen
// ---------------------------------------------------------------------------

export default function HorizonScreen() {
  const insets = useSafeAreaInsets();
  const { factors, loading } = useResilienceFactors();

  // Mapeamos exactamente la información que devuelve useResilienceFactors
  const metricsData = factors.map((factor, index) => ({
    icon: index % 2 === 0 ? Home : GitBranch, // Alternar iconos
    iconColor: index % 2 === 0 ? `${PrismColors.primary}B3` : PrismColors.tertiary,
    label: factor.nombre,
    value: factor.score_raw, // El score raw (0.52) o el valor original
    progress: factor.score_ponderado, // El progreso (ej. 0.13)
    progressColor: index % 2 === 0 ? PrismColors.primary : PrismColors.tertiary,
  }));

  // Chunk en pares para respetar el diseño Dual de MetricPairRow
  const metricRows = [];
  for (let i = 0; i < metricsData.length; i += 2) {
    metricRows.push(
      <MetricPairRow
        key={i}
        left={metricsData[i]}
        right={metricsData[i + 1]}
      />
    );
  }

  return (
    <AuthBackground showBottomBar>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* 1. Goal Hero */}
        <GoalHeroCard
          title={GOAL_DATA.title}
          targetAmount={GOAL_DATA.targetAmount}
          liquidityAmount={GOAL_DATA.liquidityAmount}
          aiNarrative={factors.length > 0 ? factors.map(f => f.descripcion).join(' ') : GOAL_DATA.aiNarrative}
          currentProjection={GOAL_DATA.currentProjection}
          acceleratedProjection={GOAL_DATA.acceleratedProjection}
        />

        {/* 2. Dynamic Resilience Metrics Rows */}
        {loading ? (
          <ActivityIndicator size="large" color={PrismColors.primary} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {metricRows}
          </View>
        )}

        {/* 3. Emergency shield */}
        <EmergencyShield
          runwayDays={EMERGENCY.runwayDays}
          securedAmount={EMERGENCY.securedAmount}
          runwayStatus={EMERGENCY.runwayStatus}
        />

        {/* 4. Action simulator */}
        <ActionSimulator getProjectedDate={getProjectedDate} />

        {/* 5. CTA */}
        <OptimizeButton onPress={() => {/* TODO: connect to optimization flow */ }} />
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PrismColors.neutral,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  engineTagRow: {
    alignItems: 'flex-end',
  },
  engineTag: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: `${PrismColors.primary}40`,
  },
});
