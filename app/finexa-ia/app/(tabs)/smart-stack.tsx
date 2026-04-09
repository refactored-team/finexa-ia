import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { SharedValue } from 'react-native-reanimated';


import { PrismColors } from '@/constants/theme';
import { Spacing } from '@/constants/uiStyles';

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------
const THEMES = {
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

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const findings = [
  {
    id: '1',
    title: 'Spotify se cobró 4 veces este mes',
    icon: '💡',
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
    steps: [
      { text: 'Detecté un cargo doble de $342', completed: true, active: false },
      { text: 'Ya contacté a soporte', completed: true, active: false },
      { text: 'Reembolso en proceso', completed: false, active: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
type Finding = typeof findings[0];
type Theme = typeof THEMES[ThemeKey];

interface StackCardProps {
  finding: Finding;
  offset: number;
  isActive: boolean;
  translateY: SharedValue<number>;
  theme: Theme;
}

function StackCard({ finding, offset, isActive, translateY, theme }: StackCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (isActive) {
      return {
        transform: [{ translateY: translateY.value }, { scale: 1 }],
        opacity: 1,
        zIndex: 10,
      };
    }
    return {
      transform: [
        { translateY: offset * 14 },
        { scale: 1 - offset * 0.05 },
      ],
      opacity: offset === 1 ? 0.6 : 0.3,
      zIndex: 10 - offset,
    };
  });

  const isGradient = theme.cardBackground === 'gradient';

  const cardInner = (
    <>
      <LinearGradient
        colors={theme.badgeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.badge}>
        <Text style={[styles.badgeText, { color: theme.textPrimary }]}>
          {finding.icon} Detectado
        </Text>
      </LinearGradient>

      <Text style={[styles.findingTitle, { color: theme.textPrimary }]}>
        {finding.title}
      </Text>

      <View style={styles.stepsList}>
        {finding.steps.map((step, idx) => (
          <View key={idx} style={styles.stepItem}>
            <View style={[
              styles.stepIcon,
              step.completed && { backgroundColor: theme.checkmarkBg },
              step.active && { backgroundColor: theme.activeBg },
            ]}>
              <Text style={styles.stepIconText}>
                {step.completed ? '✓' : '○'}
              </Text>
            </View>
            <Text style={[
              styles.stepText,
              { color: theme.textSecondary },
              step.active && { color: theme.textPrimary, fontWeight: '700' },
            ]}>
              {step.text}
            </Text>
          </View>
        ))}
      </View>

      <LinearGradient
        colors={[PrismColors.primary, PrismColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaButton}>
        <Pressable style={styles.ctaPressable}>
          <Text style={styles.ctaText}>Resolver juntos</Text>
        </Pressable>
      </LinearGradient>
    </>
  );

  if (isGradient && 'cardGradientColors' in theme) {
    return (
      <Animated.View style={[styles.stackCard, animatedStyle]}>
        <LinearGradient
          colors={(theme as any).cardGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {cardInner}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[
      styles.stackCard,
      { backgroundColor: theme.cardBackground as string },
      animatedStyle,
    ]}>
      {cardInner}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SmartStackScreen() {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light');
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = THEMES[activeTheme];

  // currentIndexSV lives on UI thread — worklet always reads fresh value,
  // no stale closure bug.
  const translateY = useSharedValue(0);
  const currentIndexSV = useSharedValue(0);

  // Keep shared value in sync with React state
  useEffect(() => {
    currentIndexSV.value = currentIndex;
    // Reset position immediately (no animation) so new card starts at 0
    translateY.value = 0;
  }, [currentIndex]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      const idx = currentIndexSV.value;
      const total = findings.length;

      if (e.translationY < -50 && idx < total - 1) {
        translateY.value = withTiming(-500, { duration: 200 });
        runOnJS(setCurrentIndex)(idx + 1);
      } else if (e.translationY > 50 && idx > 0) {
        translateY.value = withTiming(500, { duration: 200 });
        runOnJS(setCurrentIndex)(idx - 1);
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    });

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.backgroundColor }]}>

        {/* Theme picker */}
        <View style={[styles.themePicker, { backgroundColor: theme.backgroundColor }]}>
          <Text style={[styles.themeLabel, { color: theme.textSecondary }]}>
            Esquema de colores:
          </Text>
          <View style={styles.themeButtons}>
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => setActiveTheme(key)}
                style={[
                  styles.themeButton,
                  {
                    borderColor: activeTheme === key
                      ? theme.accentColor
                      : theme.textSecondary,
                  },
                ]}>
                <Text style={[
                  styles.themeButtonText,
                  {
                    color: activeTheme === key
                      ? theme.textPrimary
                      : theme.textSecondary,
                    fontWeight: activeTheme === key ? '700' : '500',
                  },
                ]}>
                  {THEMES[key].name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/finexa-i.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.greeting, { color: theme.textPrimary }]}>
            Hola, analicé tus movimientos
          </Text>
          <Text style={[styles.subGreeting, { color: theme.textSecondary }]}>
            Encontré {findings.length} cosas que deberías revisar
          </Text>
        </View>

        {/* Smart Stack */}
        <View style={styles.stackWrapper}>
          <View style={styles.stackContainer}>

            {/* Background cards — peek behind active */}
            {findings.map((finding, index) => {
              const offset = index - currentIndex;
              if (offset <= 0 || offset > 2) return null;
              return (
                <StackCard
                  key={finding.id}
                  finding={finding}
                  offset={offset}
                  isActive={false}
                  translateY={translateY}
                  theme={theme}
                />
              );
            })}

            {/* Active card */}
            <GestureDetector gesture={panGesture}>
              <StackCard
                key={`active-${currentIndex}`}
                finding={findings[currentIndex]}
                offset={0}
                isActive={true}
                translateY={translateY}
                theme={theme}
              />
            </GestureDetector>

          </View>

          {/* Pagination dots — active one is wider */}
          <View style={styles.dots}>
            {findings.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex
                      ? theme.accentColor
                      : theme.textSecondary,
                    opacity: index === currentIndex ? 1 : 0.3,
                    width: index === currentIndex ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.swipeHint, { color: theme.textSecondary }]}>
            Desliza arriba o abajo para ver más
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  themePicker: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,116,139,0.2)',
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  themeButtonText: {
    fontSize: 13,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  stackWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  stackContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    borderRadius: 24,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.sm,
    opacity: 0.6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  findingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    lineHeight: 26,
  },
  stepsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.surface,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaPressable: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: PrismColors.surface,
  },
});