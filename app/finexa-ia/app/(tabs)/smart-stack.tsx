import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

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
  activeBg: '#F59E0B',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const findings: Finding[] = [
  {
    id: '1',
    title: 'Spotify se cobró 4 veces este mes',
    icon: '💡',
    cardColor: '#006C5F',
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
    cardColor: PrismColors.tertiary,
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
    cardColor: PrismColors.secondary,
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
  const pageBackground = '#F3F5F8';

  return (
    <View style={[styles.root, { backgroundColor: '#E5E7EB' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#6495FF' }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: '#F1F4F9' }]}>

        {/* Header */}
        <LinearGradient
          colors={['#6495FF', '#2463EB']}
          start={{ x: 0.5, y: 0.005 }}
          end={{ x: 0.5, y: .8 }}
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

          <Text style={[styles.welcomeLine, { color: theme.textPrimary }]}>
            Hola,
          </Text>
          <Text style={[styles.nameLine, { color: theme.accentColor }]}>
            Ivano Ermakov
          </Text>
          <Text style={[styles.welcomeLine, { color: theme.textPrimary, fontSize: 20 }]}>
            encontré esto por ti
          </Text>
          {/* <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>GRAPHIC DESIGNER</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>FREELANCE</Text>
            </View>
          </View> */}
        </LinearGradient>

        {/* Smart Stack */}
        <SmartStack
          findings={findings}
          theme={theme}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
        />

      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
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
    borderColor: 'rgba(215,255,47,0.85)',
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
    fontWeight: '800',
    letterSpacing: 0.2,
    // marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.75)',
  },
});