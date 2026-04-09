import { AuthBackground } from '@/components/auth';
import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importing sub-components
import AsymmetricAnalytics from '@/components/intelligence/AsymmetricAnalytics';
import ConfidenceScore from '@/components/intelligence/ConfidenceScore';
import FixedCostsCard from '@/components/intelligence/FixedCostsCard';
import ResilienceWidget from '@/components/intelligence/ResilienceWidget';
import SmallExpensesCard from '@/components/intelligence/SmallExpensesCard';

export default function IntelligenceScreen() {
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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg + 110, paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Header Hero / Insight */}


          {/* DNA Metrics Grid */}
          <View style={styles.gridSection}>
            <View style={styles.colContainer}>
              <ConfidenceScore />
            </View>
            <View style={styles.colContainer}>
              <ResilienceWidget />
            </View>
          </View>

          {/* Detail Cards */}
          <View style={styles.sectionMargin}>
            <SmallExpensesCard />
          </View>

          <View style={styles.sectionMargin}>
            <FixedCostsCard />
          </View>

          {/* Charts & Analytics */}
          <View style={styles.sectionMargin}>
            <AsymmetricAnalytics />
          </View>

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
    marginTop: -90
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
});
