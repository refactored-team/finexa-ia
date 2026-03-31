import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { AuthBackground } from '@/components/auth';
import {
  ChevronRight,
  Landmark,
  Lock,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { BorderColors, Layout, Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';

const RING_SIZE = 168;
const RING_R = 58;
const RING_STROKE = 6;
/** Arco al que “crece” la línea; el score completo se desbloquea al vincular el banco */
const PROGRESS_PREVIEW = 0.22;

const RING_STATUS_MESSAGES = [
  'Tu score te espera',
  'Solo falta vincular',
  'Con Plaid, en un paso',
  'Listo cuando conectes',
] as const;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VALUE_ITEMS = [
  {
    Icon: Shield,
    title: 'Encriptación',
    body: 'Tus datos viajan cifrados de extremo a extremo.',
  },
  {
    Icon: Sparkles,
    title: 'IA predictiva',
    body: 'Modelos que anticipan tendencias en tus finanzas.',
  },
  {
    Icon: TrendingUp,
    title: 'Crecimiento',
    body: 'Optimización automática de tu flujo de capital.',
  },
  {
    Icon: Target,
    title: 'Precisión',
    body: 'Categorización exacta de cada transacción.',
  },
] as const;

const ENTER = {
  duration: 460,
  easing: Easing.out(Easing.cubic),
  slide: 14,
} as const;

function EnterFadeSlide({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: ENTER.duration, easing: ENTER.easing }));
  }, [delay, t]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: interpolate(t.value, [0, 1], [ENTER.slide, 0]) }],
  }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

function PulsingRingGlow({
  ringSize,
  style,
}: {
  ringSize: number;
  style: ViewStyle;
}) {
  const o = useSharedValue(0.34);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(0.58, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.34, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [o]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: o.value }));
  const w = ringSize + 44;
  return (
    <Animated.View
      style={[
        style,
        animatedStyle,
        {
          width: w,
          height: w,
          borderRadius: w / 2,
          marginTop: -w / 2,
          marginLeft: -w / 2,
        },
      ]}
    />
  );
}

function BreathingIconBadge({ children }: { children: ReactNode }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(
        withTiming(1.035, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [s]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

type RingSvgDims = {
  ringSize: number;
  ringCx: number;
  ringCy: number;
  ringR: number;
  ringCirc: number;
};

function AnimatedProgressRing({ ringSize, ringCx, ringCy, ringR, ringCirc }: RingSvgDims) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      400,
      withTiming(PROGRESS_PREVIEW, { duration: 2600, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: ringCirc * (1 - progress.value),
  }));

  return (
    <Svg width={ringSize} height={ringSize} style={styles.ringSvg}>
      <Defs>
        <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={PrismColors.primary} />
          <Stop offset="48%" stopColor={PrismColors.tertiary} />
          <Stop offset="100%" stopColor={PrismColors.secondary} />
        </SvgLinearGradient>
      </Defs>
      <Circle
        cx={ringCx}
        cy={ringCy}
        r={ringR}
        stroke="rgba(148, 163, 184, 0.28)"
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <G transform={`rotate(-90 ${ringCx} ${ringCy})`}>
        <AnimatedCircle
          cx={ringCx}
          cy={ringCy}
          r={ringR}
          stroke="url(#ringGrad)"
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${ringCirc} ${ringCirc}`}
          animatedProps={animatedProps}
        />
      </G>
    </Svg>
  );
}

function RingStatusCycle({
  messages,
  tightLayout,
}: {
  messages: readonly string[];
  tightLayout: boolean;
}) {
  const [index, setIndex] = useState(0);
  const labelOp = useSharedValue(1);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % messages.length);
    labelOp.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [labelOp, messages.length]);

  useEffect(() => {
    labelOp.value = 1;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const step = () => {
      labelOp.value = withTiming(
        0,
        { duration: 340, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(advance)();
          }
        },
      );
    };
    const startDelay = setTimeout(() => {
      intervalId = setInterval(step, 3600);
    }, 2200);
    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [advance, labelOp]);

  const captionAnim = useAnimatedStyle(() => ({
    opacity: labelOp.value,
    transform: [{ translateY: interpolate(labelOp.value, [0, 1], [5, 0]) }],
  }));

  return (
    <Animated.View style={[styles.ringStatusTextWrap, captionAnim]}>
      <Text
        style={[styles.ringAwaitTitle, tightLayout && styles.ringAwaitTitleTight]}
        numberOfLines={2}>
        {messages[index] ?? messages[0]}
      </Text>
    </Animated.View>
  );
}

export default function LinkBankScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const router = useRouter();

  const tightLayout = windowH < 700;
  const ringSize = tightLayout ? 148 : RING_SIZE;
  const ringR = tightLayout ? 52 : RING_R;
  const ringCirc = 2 * Math.PI * ringR;
  const ringCx = ringSize / 2;
  const ringCy = ringSize / 2;

  const headerPaddingTop = insets.top + Spacing.sm;
  const bodyPaddingTop = useMemo(() => headerPaddingTop + (tightLayout ? 76 : 82), [headerPaddingTop, tightLayout]);

  function handleSignOut() {
    router.replace('/(auth)/login');
  }

  function completeOnboardingStub() {
    Alert.alert(
      'Plaid',
      'En producción se abrirá el flujo seguro de Plaid (SDK nativo + link_token). Por ahora es una demo.',
      [{ text: 'Continuar', onPress: () => router.replace('/(tabs)/home') }],
    );
  }

  function handleCtaPress() {
    completeOnboardingStub();
  }

  return (
    <AuthBackground>
      <View style={Layout.flex1}>
        <BlurView
          intensity={48}
          tint="light"
          style={[styles.headerBlur, { paddingTop: headerPaddingTop, paddingBottom: Spacing.sm }]}>
          <EnterFadeSlide delay={0}>
            <View style={styles.headerInner}>
              <Pressable
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                hitSlop={12}
                style={({ pressed }) => [styles.signOutPress, pressed && styles.pressed]}>
                <Text style={styles.signOutLabel}>Cerrar sesión</Text>
              </Pressable>
              <View style={styles.headerTitles}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Vincular banco
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  Nivel bancario
                </Text>
              </View>
            </View>
          </EnterFadeSlide>
        </BlurView>

        <View
          style={[
            Layout.flex1,
            styles.body,
            { paddingTop: bodyPaddingTop, paddingHorizontal: Spacing.lg },
          ]}>
          <View style={[Layout.flex1, styles.mainFill]}>
            <View style={[styles.glassCard, Shadow.card]}>
              <View style={styles.scoreSection}>
                <EnterFadeSlide delay={70}>
                  <View>
                    <Text style={styles.scoreEyebrow}>Score</Text>
                    <Text style={styles.scoreHeadline} numberOfLines={2}>
                      Tu puntuación al vincular tu banco
                    </Text>
                    <Text style={styles.scoreLead} numberOfLines={tightLayout ? 1 : 2}>
                      Con Plaid, en segundos y con datos cifrados.
                    </Text>
                  </View>
                </EnterFadeSlide>

                <EnterFadeSlide delay={140} style={styles.ringEnterWrap}>
                  <View style={[styles.ringStage, { width: ringSize, height: ringSize }]}>
                  <PulsingRingGlow ringSize={ringSize} style={styles.ringGlowOuter} />
                  <View
                    style={[
                      styles.ringGlowInner,
                      {
                        width: ringSize + 16,
                        height: ringSize + 16,
                        borderRadius: (ringSize + 16) / 2,
                        marginTop: -(ringSize + 16) / 2,
                        marginLeft: -(ringSize + 16) / 2,
                      },
                    ]}
                  />
                  <View style={[styles.ringBlock, { width: ringSize, height: ringSize }]}>
                    <AnimatedProgressRing
                      ringSize={ringSize}
                      ringCx={ringCx}
                      ringCy={ringCy}
                      ringR={ringR}
                      ringCirc={ringCirc}
                    />
                    <LinearGradient
                      colors={['rgba(255,255,255,0.92)', 'rgba(248,250,252,0.75)']}
                      style={[
                        styles.ringInnerDisc,
                        {
                          width: (ringR - RING_STROKE) * 2 - 10,
                          height: (ringR - RING_STROKE) * 2 - 10,
                          borderRadius: ringR - RING_STROKE,
                        },
                      ]}
                    />
                    <View style={styles.ringCenter} pointerEvents="none">
                      <BreathingIconBadge>
                        <View style={styles.ringIconBadge}>
                          <Sparkles size={18} color={PrismColors.primary} strokeWidth={2} />
                        </View>
                      </BreathingIconBadge>
                      <RingStatusCycle messages={RING_STATUS_MESSAGES} tightLayout={tightLayout} />
                      <View style={styles.ringAwaitRow}>
                        <Landmark size={12} color={PrismColors.tertiary} strokeWidth={2} />
                        <Text style={styles.ringAwaitHint} numberOfLines={1}>
                          Vía Plaid
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                </EnterFadeSlide>

                <View style={styles.valueGrid}>
                  {VALUE_ITEMS.map(({ Icon, title, body }, index) => (
                    <EnterFadeSlide
                      key={title}
                      delay={220 + index * 52}
                      style={styles.valueCellEnter}>
                    <View
                      style={[
                        styles.valueCell,
                        styles.valueCellDimmed,
                        tightLayout && styles.valueCellTight,
                      ]}>
                      <View style={styles.valueIconWrap}>
                        <Icon
                          size={tightLayout ? 16 : 18}
                          color={PrismColors.primary}
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={[styles.valueTitle, tightLayout && styles.valueTitleTight]} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text
                        style={[styles.valueBody, tightLayout && styles.valueBodyTight]}
                        numberOfLines={tightLayout ? 2 : 3}>
                        {body}
                      </Text>
                    </View>
                    </EnterFadeSlide>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <EnterFadeSlide delay={400}>
              <Pressable
                onPress={handleCtaPress}
                style={({ pressed }) => [
                  styles.ctaPress,
                  Shadow.button,
                  pressed && styles.ctaPressed,
                ]}>
                <LinearGradient
                  colors={[PrismColors.primary, PrismColors.secondary]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.ctaGradient}>
                  <Text style={styles.ctaLabel} numberOfLines={1}>
                    Vincular con Plaid
                  </Text>
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            </EnterFadeSlide>

            <EnterFadeSlide delay={460}>
              <View style={styles.secureRow}>
                <Lock size={12} color={PrismColors.textSecondary} strokeWidth={2} />
                <Text style={styles.secureText}>100% seguro</Text>
              </View>
            </EnterFadeSlide>
          </View>
        </View>
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BorderColors.subtle,
    overflow: 'hidden',
  },
  headerInner: {
    gap: Spacing.sm,
  },
  signOutPress: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  signOutLabel: {
    ...TextStyles.link,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
  headerTitles: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: TextStyles.screenTitleCompact.fontFamily,
    fontSize: 16,
    lineHeight: 20,
    color: PrismColors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    lineHeight: 14,
    color: PrismColors.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  body: {
    minHeight: 0,
  },
  mainFill: {
    justifyContent: 'center',
    minHeight: 0,
  },
  footer: {
    flexShrink: 0,
    paddingTop: Spacing.sm,
  },
  glassCard: {
    borderRadius: Radius.md + 2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: BorderColors.card,
    overflow: 'hidden',
  },
  scoreSection: {
    gap: 0,
  },
  ringEnterWrap: {
    alignSelf: 'center',
  },
  valueCellEnter: {
    width: '48%',
    maxWidth: '48%',
  },
  scoreEyebrow: {
    ...TextStyles.labelUppercase,
    fontSize: 9,
    letterSpacing: 1.8,
    color: PrismColors.tertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreHeadline: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.35,
    color: PrismColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: Spacing.xs,
  },
  scoreLead: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: PrismColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  ringStage: {
    position: 'relative',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  ringGlowOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: `${PrismColors.primary}18`,
  },
  ringGlowInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: `${PrismColors.secondary}0D`,
  },
  ringBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  ringInnerDisc: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  ringCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  ringIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${PrismColors.primary}12`,
    borderWidth: 1,
    borderColor: `${PrismColors.primary}22`,
  },
  ringStatusTextWrap: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '88%',
  },
  ringAwaitTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    lineHeight: 15,
    color: PrismColors.textPrimary,
    textAlign: 'center',
  },
  ringAwaitTitleTight: {
    fontSize: 11,
    lineHeight: 14,
  },
  ringAwaitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ringAwaitHint: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    lineHeight: 13,
    color: PrismColors.textSecondary,
    textAlign: 'center',
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
    columnGap: Spacing.sm,
  },
  valueCell: {
    width: '100%',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(248,250,252,0.9)',
    borderWidth: 1,
    borderColor: BorderColors.subtle,
  },
  valueCellTight: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  valueCellDimmed: {
    opacity: 0.6,
  },
  valueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${PrismColors.primary}10`,
    marginBottom: Spacing.sm,
  },
  valueTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    lineHeight: 17,
    color: PrismColors.textPrimary,
    marginBottom: 4,
  },
  valueTitleTight: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 2,
  },
  valueBody: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    lineHeight: 15,
    color: PrismColors.textSecondary,
  },
  valueBodyTight: {
    fontSize: 10,
    lineHeight: 13,
  },
  ctaPress: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  ctaPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
  },
  ctaLabel: {
    fontFamily: TextStyles.onPrimary.fontFamily,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  secureText: {
    ...TextStyles.caption,
    fontSize: 11,
  },
});
