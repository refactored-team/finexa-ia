import { GitBranch, Home } from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth';
import {
  ActionSimulator,
  EmergencyShield,
  GoalHeroCard,
  MetricPairRow,
  OptimizeButton,
} from '@/components/horizon';

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

  return (
    <AuthBackground showBottomBar showHeader={false}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#C3E9E9', '#F6FBFB']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 2 }}
          style={[styles.heroBackground, { height: insets.top + 220 }]}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.lg + 110,
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
            aiNarrative={GOAL_DATA.aiNarrative}
            currentProjection={GOAL_DATA.currentProjection}
            acceleratedProjection={GOAL_DATA.acceleratedProjection}
          />

          {/* 2. Two-column metrics */}
          <MetricPairRow left={METRICS.left} right={METRICS.right} />

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
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F4F9',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0
    // height: 240,
  },
  // scrollView: {
  //   flex: 1,
  // },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: -120,
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
