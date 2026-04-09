import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { PrismColors } from '@/constants/theme';
import { Spacing } from '@/constants/uiStyles';
import SmartStack, { Finding, Theme } from '@/components/SmartStack';

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
const THEMES: Record<string, Theme> = {
  light: {
    id: 'light',
    name: 'Light',
    backgroundColor: PrismColors.neutral,
    cardBackground: PrismColors.surface,
    textPrimary: PrismColors.textPrimary,
    textSecondary: PrismColors.textSecondary,
    accentColor: PrismColors.primary,
    badgeGradient: [PrismColors.primary, PrismColors.tertiary] as [string, string],
    checkmarkBg: '#10B981',
    activeBg: '#F59E0B',
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    backgroundColor: '#0F172A',
    cardBackground: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    accentColor: PrismColors.tertiary,
    badgeGradient: ['#1E40AF', '#6D28D9'] as [string, string],
    checkmarkBg: '#0891B2',
    activeBg: PrismColors.secondary,
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    backgroundColor: '#000000',
    cardBackground: PrismColors.primary,
    textPrimary: PrismColors.surface,
    textSecondary: 'rgba(255,255,255,0.8)',
    accentColor: PrismColors.tertiary,
    badgeGradient: [PrismColors.tertiary, PrismColors.secondary] as [string, string],
    checkmarkBg: '#10B981',
    activeBg: '#FACC15',
  },
  gradient: {
    id: 'gradient',
    name: 'Gradient',
    backgroundColor: '#0F172A',
    cardBackground: 'gradient',
    cardGradientColors: ['#2563EB', '#7C3AED', '#06B6D4'] as [string, string, string],
    textPrimary: PrismColors.surface,
    textSecondary: 'rgba(255,255,255,0.9)',
    accentColor: PrismColors.surface,
    badgeGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'] as [string, string],
    checkmarkBg: 'rgba(255,255,255,0.3)',
    activeBg: '#FACC15',
  },
};

type ThemeKey = keyof typeof THEMES;

const HERO_THEME: Theme = {
  id: 'hero',
  name: 'Hero',
  backgroundColor: '#000000',
  cardBackground: PrismColors.surface,
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.72)',
  accentColor: '#D7FF2F',
  badgeGradient: [PrismColors.primary, PrismColors.tertiary],
  checkmarkBg: '#10B981',
  activeBg: '#F3F5F8',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const findings: Finding[] = [
  {
    id: '1',
    title: 'Spotify y Youtube Music contratados',
    icon: '💡',
    cardColor: '#312E81',
    buttonColor: '#4F46E5',
    steps: [
      { text: 'Ya revisé tus cargos', completed: true, active: false },
      { text: 'Tengo la documentación lista', completed: true, active: false },
      { text: '¿Quieres que lo cancele por ti?', completed: false, active: true },
    ],
  },
  {
    id: '2',
    title: 'HBO Max - Suscripción sin uso',
    icon: '📺',
    cardColor: '#3730A3',
    buttonColor: '#4F46E5',
    steps: [
      { text: 'No has abierto la app en 90 días', completed: true, active: false },
      { text: 'Puedes ahorrar $129/mes', completed: true, active: false },
      { text: '¿Quieres que la cancele?', completed: false, active: true },
    ],
  },
  {
    id: '3',
    title: 'Uber Eats - Cargo duplicado',
    icon: '🍔',
    cardColor: '#4338CA',
    buttonColor: '#6366F1',
    steps: [
      { text: 'Detecté un cargo doble de $342', completed: true, active: false },
      { text: 'Ya contacté a soporte', completed: true, active: false },
      { text: 'Reembolso en proceso', completed: false, active: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SmartStackScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = HERO_THEME;
  const tabBarHeight = useBottomTabBarHeight();
  const [oxygenDays] = useState(14);
  const [foodOrders] = useState(34);
  const [potentialSavings] = useState(608.82);

  const gaugeProgress = (oxygenDays / 30) * 100;
  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference - (gaugeProgress / 100) * circumference;

  return (
    <View style={[styles.root, { backgroundColor: '#E5E7EB' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#C3E9E9' }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: '#F1F4F9' }]}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]}
          contentInset={{ bottom: tabBarHeight + 220 }}
          scrollIndicatorInsets={{ bottom: tabBarHeight + 220 }}
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <LinearGradient
            colors={['#C3E9E9', '#F6FBFB']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 2 }}
            style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.userAvatarWrap}>
                <Image
                  source={require('@/assets/images/finexa-i.png')}
                  style={styles.userAvatar}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.chatButton}>
                <Text style={styles.chatButtonIcon}>💬</Text>
              </View>
            </View>

            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              allowFontScaling={false}
              style={[styles.welcomeLine, { color: '#000' }]}>
              Hola,{'\u00A0'}
              <Text style={[styles.nameLine, { color: '#036666' }]}>
                Ivano{'\u00A0'}Ermakov
              </Text>
            </Text>
            <Text style={[styles.welcomeLine, { color: "#000", fontSize: 20 }]}>
              encontré esto por ti
            </Text>
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Nivel estable</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Gastos hormiga altos</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Smart Stack */}
          <SmartStack
            findings={findings}
            theme={theme}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
          />

          <View style={styles.leftColumn}>
            <View style={styles.glassCard}>
              {/* <Text style={styles.microStatus}>[DATA_SYNC: OK]</Text> */}

              <View style={styles.gaugeContainer}>
                <Svg width={240} height={240} style={styles.gaugeSvg}>
                  <Defs>
                    <SvgLinearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor={PrismColors.primary} />
                      <Stop offset="100%" stopColor={PrismColors.tertiary} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx="120"
                    cy="120"
                    r="100"
                    stroke={PrismColors.neutral}
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <Circle
                    cx="120"
                    cy="120"
                    r="100"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="0"
                    origin="120, 120"
                  />
                </Svg>
                <View style={styles.gaugeCenter}>
                  <Text style={styles.gaugeNumber}>{oxygenDays}</Text>
                  <Text style={styles.gaugeLabel}>Dias de Oxigeno</Text>
                </View>
              </View>

              <View style={styles.gaugeDescription}>
                <Text style={styles.cardTitle}>Tranquilidad Asegurada</Text>
                <Text style={styles.cardBody}>
                  Tu liquidez actual cubre tus necesidades esenciales hasta final de quincena sin ajustes.
                </Text>
              </View>
            </View>

            {/* <View style={[styles.glassCard, styles.habitCard]}>
              <Text style={[styles.microStatus, styles.microStatusBottom]}>[AI_ANALYSIS_ACTIVE]</Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>Habito Detectado</Text>
              </View>

              <Text style={styles.habitTitle}>
                Detecte {foodOrders} pedidos de comida este mes.
              </Text>

              <Text style={styles.habitBody}>
                Si reducimos los pedidos a domicilio un 25%, recuperamos{' '}
                <Text style={styles.highlight}>${potentialSavings.toFixed(2)}</Text> y ganamos 4 dias adicionales.
              </Text>

              <Pressable style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Optimizar Habito</Text>
              </Pressable>
            </View> */}
          </View>

          {/* <View style={{ height: tabBarHeight + 220 }} /> */}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: {
    // paddingBottom: Spacing.lg,
  },
  root: {
    flex: 1,
    // height: 1000,
  },
  // safe: {
  //   flex: 1,
  // },
  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Spacing.lg,
    height: 270,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  userAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: "#036666",
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonIcon: {
    fontSize: 18,
    color: '#111827',
  },
  welcomeLine: {
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 0.2,
    // marginBottom: 2,
  },
  nameLine: {
    fontSize: 34,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
    maxWidth: '96%',
    includeFontPadding: false,
  },
  chipsRow: {
    marginVertical: 15,
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EAFF39',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    // letterSpacing: 0.2,
    color: '#000',
  },
  leftColumn: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  glassCard: {
    backgroundColor: PrismColors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
    position: 'relative',
  },
  // microStatus: {
  //   position: 'absolute',
  //   top: 24,
  //   right: 32,
  //   fontSize: 8,
  //   color: PrismColors.textSecondary,
  //   opacity: 0.4,
  // },
  // microStatusBottom: {
  //   top: 'auto',
  //   bottom: 24,
  // },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // marginVertical: Spacing.lg,
  },
  gaugeSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: PrismColors.textPrimary,
    letterSpacing: -2,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: PrismColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  gaugeDescription: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
    maxWidth: 280,
  },
  habitCard: {
    marginTop: Spacing.lg,
  },
  badge: {
    backgroundColor: PrismColors.neutral,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    marginBottom: Spacing.lg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PrismColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  habitTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  habitBody: {
    fontSize: 14,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  highlight: {
    color: PrismColors.primary,
    fontWeight: '700',
    backgroundColor: PrismColors.primaryBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionButton: {
    backgroundColor: PrismColors.surface,
    borderWidth: 1,
    borderColor: PrismColors.neutral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PrismColors.textPrimary,
  },
});