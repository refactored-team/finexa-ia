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
    <AuthBackground showBottomBar>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Header Hero / Insight */}
        <View style={styles.heroSection}>
          <View style={styles.heroLayout}>
            {/* AI Character */}
            <View style={styles.imageContainer}>
              {/* Optional data connection line effect */}
              <View style={styles.dataLine} />
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBL9xMl3qGfMHtJytPdzuf1FjL69weRAhcFSlzN-YLMWFbgdZ0tu73Pp-rNOckDrltA61xfPeHA1LUqufqpiCzVk-ADHus-Zo9rKzp-OpD9ZpdYQ7650-z4V_5tGTzzYmKOfIdNriB0mFm2gHplXGm_eBwk0hHb8-y0vtK7CZMs15ItYZxy3-SbwlGKIJ-dO212saxbPdLcXXdZOvaTCrompj5Y0L3OLZkI8v-qjRVOa_IFH2ODKaVSa1e4G02QIYECtl0fz5d8V6ka' }}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            {/* AI Insight Bubble */}
            <LinearGradient
              colors={['#4f46e5', '#3525cd']}
              style={styles.vibrantGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statusMicroLight}>[AI_ANALYSIS_ACTIVE]</Text>
              <Text style={styles.insightText}>
                ¡Vas muy bien! Ahorraste el{' '}
                <Text style={styles.insightHighlight}>45%</Text>{' '}
                de tu ingreso este periodo. Eres una ahorradora sólida con pequeños puntos de fuga.
              </Text>
              <View style={[styles.prismAccent, styles.prismAccentBr]} />
            </LinearGradient>
          </View>
        </View>

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
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
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
