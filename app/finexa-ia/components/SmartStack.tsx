import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
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
// Types
// ---------------------------------------------------------------------------
export interface Finding {
  id: string;
  title: string;
  icon: string;
  cardColor?: string;
  steps: Array<{
    text: string;
    completed: boolean;
    active: boolean;
  }>;
}

export interface Theme {
  id: string;
  name: string;
  backgroundColor: string;
  cardBackground: string | 'gradient';
  cardGradientColors?: [string, string, string];
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  badgeGradient: [string, string];
  checkmarkBg: string;
  activeBg: string;
}

interface StackCardProps {
  finding: Finding;
  offset: number;
  isActive: boolean;
  translateY: SharedValue<number>;
  theme: Theme;
}

interface SmartStackProps {
  findings: Finding[];
  theme: Theme;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------
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
      zIndex: offset === 1 ? 5 : 1,
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
          Detectado
          {/* {finding.icon} Detectado */}
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
          <Text style={styles.ctaText}>Aplicar ajuste</Text>
        </Pressable>
      </LinearGradient>
    </>
  );

  if (isGradient && 'cardGradientColors' in theme && theme.cardGradientColors) {
    return (
      <Animated.View style={[styles.stackCard, animatedStyle]}>
        <LinearGradient
          colors={theme.cardGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {cardInner}
      </Animated.View>
    );
  }

  const fallbackCardColor =
    typeof theme.cardBackground === 'string' && theme.cardBackground !== 'gradient'
      ? theme.cardBackground
      : '#E5FF2A';
  const cardBackgroundColor = finding.cardColor ?? fallbackCardColor;

  return (
    <Animated.View style={[
      styles.stackCard,
      { backgroundColor: cardBackgroundColor },
      animatedStyle,
    ]}>
      {cardInner}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Smart Stack Component
// ---------------------------------------------------------------------------
export default function SmartStack({
  findings,
  theme,
  currentIndex,
  onIndexChange,
}: SmartStackProps) {
  const translateY = useSharedValue(0);
  const currentIndexSV = useSharedValue(currentIndex);

  // Keep shared value in sync with prop
  useEffect(() => {
    currentIndexSV.value = currentIndex;
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
        runOnJS(onIndexChange)(idx + 1);
      } else if (e.translationY > 50 && idx > 0) {
        translateY.value = withTiming(500, { duration: 200 });
        runOnJS(onIndexChange)(idx - 1);
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    });

  return (
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

      {/* Pagination dots */}
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
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  stackWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'center',
    marginTop: -70,
  },
  stackContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  stackCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
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
    color: PrismColors.textPrimary,
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
