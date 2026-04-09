import { AuthBackground } from '@/components/auth';
import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIntelligenceData } from '@/src/hooks/useIntelligenceData';

// Importing sub-components
import AsymmetricAnalytics from '@/components/intelligence/AsymmetricAnalytics';
import ConfidenceScore from '@/components/intelligence/ConfidenceScore';
import FixedCostsCard from '@/components/intelligence/FixedCostsCard';
import ResilienceWidget from '@/components/intelligence/ResilienceWidget';
import SmallExpensesCard from '@/components/intelligence/SmallExpensesCard';

export default function IntelligenceScreen() {
  const insets = useSafeAreaInsets();
  const { analysis, insights, resilienceFactors, cashFlow, pulse, loading, error, refetch } = useIntelligenceData();

  const antExpensePercentage = analysis?.ant_expense_percentage ?? 0;
  const riskLevel = analysis?.risk_level;
  const summary = analysis?.summary;

  const antExpenseTotal = analysis?.ant_expense_total || 0;

  const resilienceLiquidity = cashFlow?.projected_liquidity || 0;
  const resiliencePercentage = Math.max(
    0,
    Math.min(100, resilienceFactors.reduce((acc, factor) => acc + (factor.score_ponderado || 0), 0) * 100)
  );

  const fixedCostsTotal = pulse?.gasto_fijo_mensual || 0;
  const fixedCostsRatio = pulse?.porcentaje_consumido_mes || 0;

  const projectionLiquidityStr =
    cashFlow?.projected_liquidity != null
      ? `$${cashFlow.projected_liquidity.toLocaleString('en-US')}`
      : '$0';

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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg + 110, paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={PrismColors.primary} style={{ marginVertical: Spacing.xl }} />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>No se pudo cargar Inteligencia</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* DNA Metrics Grid */}
              <View style={styles.gridSection}>
                <View style={styles.colContainer}>
                  <ConfidenceScore
                    antExpensePercentage={antExpensePercentage}
                    riskLevel={riskLevel}
                    summary={summary}
                  />
                </View>
                <View style={styles.colContainer}>
                  <ResilienceWidget
                    liquidity={resilienceLiquidity}
                    percentage={Math.round(resiliencePercentage)}
                  />
                </View>
              </View>

              {/* Detail Cards */}
              <View style={styles.sectionMargin}>
                <SmallExpensesCard
                  total={antExpenseTotal}
                  items={insights ?? []}
                />
              </View>

              <View style={styles.sectionMargin}>
                <FixedCostsCard
                  total={fixedCostsTotal}
                  ratio={fixedCostsRatio}
                  items={cashFlow?.recurring_expenses ?? []}
                />
              </View>

              {/* Charts & Analytics */}
              <View style={styles.sectionMargin}>
                <AsymmetricAnalytics
                  projection={projectionLiquidityStr}
                />
              </View>
            </>
          )}
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
    height: 240,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: -50
  },
  heroSection: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  heroLayout: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    zIndex: 20,
    marginBottom: -8,
  },
  dataLine: {
    position: 'absolute',
    top: '50%',
    right: -40,
    width: 40,
    height: 1,
    backgroundColor: 'rgba(53, 37, 205, 0.15)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.15 }],
  },
  vibrantGradient: {
    flex: 1,
    marginLeft: 0,
    marginBottom: 8,
    padding: Spacing.lg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    borderBottomLeftRadius: Radius.sm,
    ...Shadow.card,
    shadowColor: PrismColors.primary,
    shadowOpacity: 0.5,
  },
  statusMicroLight: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 8,
    fontFamily: TextStyles.caption.fontFamily,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
  insightText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    marginTop: 8,
  },
  insightHighlight: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    color: '#00ffff',
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
    backgroundColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  gridSection: {
    flexDirection: 'column',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  colContainer: {
    width: '100%',
  },
  sectionMargin: {
    marginBottom: Spacing.lg,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.2)',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    color: PrismColors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: PrismColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: PrismColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
