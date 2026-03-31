import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
/** Arco sutil: el score completo se desbloquea al vincular el banco */
const PROGRESS_PREVIEW = 0.22;

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

export default function LinkBankScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const router = useRouter();
  const glowOpacity = useRef(new Animated.Value(0.35)).current;

  const tightLayout = windowH < 700;
  const ringSize = tightLayout ? 148 : RING_SIZE;
  const ringR = tightLayout ? 52 : RING_R;
  const ringCirc = 2 * Math.PI * ringR;
  const ringCx = ringSize / 2;
  const ringCy = ringSize / 2;

  const headerPaddingTop = insets.top + Spacing.sm;
  const bodyPaddingTop = useMemo(() => headerPaddingTop + (tightLayout ? 76 : 82), [headerPaddingTop, tightLayout]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.62,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glowOpacity]);

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
                <Text style={styles.scoreEyebrow}>Score</Text>
                <Text style={styles.scoreHeadline} numberOfLines={2}>
                  Tu puntuación al vincular tu banco
                </Text>
                <Text style={styles.scoreLead} numberOfLines={tightLayout ? 1 : 2}>
                  Con Plaid, en segundos y con datos cifrados.
                </Text>

                <View style={[styles.ringStage, { width: ringSize, height: ringSize }]}>
                  <Animated.View
                    style={[
                      styles.ringGlowOuter,
                      {
                        opacity: glowOpacity,
                        width: ringSize + 44,
                        height: ringSize + 44,
                        borderRadius: (ringSize + 44) / 2,
                        marginTop: -(ringSize + 44) / 2,
                        marginLeft: -(ringSize + 44) / 2,
                      },
                    ]}
                  />
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
                        <Circle
                          cx={ringCx}
                          cy={ringCy}
                          r={ringR}
                          stroke="url(#ringGrad)"
                          strokeWidth={RING_STROKE}
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${ringCirc} ${ringCirc}`}
                          strokeDashoffset={ringCirc * (1 - PROGRESS_PREVIEW)}
                        />
                      </G>
                    </Svg>
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
                      <View style={styles.ringIconBadge}>
                        <Sparkles size={18} color={PrismColors.primary} strokeWidth={2} />
                      </View>
                      <Text style={styles.ringAwaitTitle} numberOfLines={1}>
                        Listo al conectar
                      </Text>
                      <View style={styles.ringAwaitRow}>
                        <Landmark size={12} color={PrismColors.tertiary} strokeWidth={2} />
                        <Text style={styles.ringAwaitHint} numberOfLines={1}>
                          Vía Plaid
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.valueGrid}>
                  {VALUE_ITEMS.map(({ Icon, title, body }) => (
                    <View
                      key={title}
                      style={[
                        styles.valueCell,
                        styles.valueCellDimmed,
                        tightLayout && styles.valueCellTight,
                      ]}>
                      <View style={styles.valueIconWrap}>
                        <Icon
                          size={tightLayout ? 15 : 17}
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
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
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

            <View style={styles.secureRow}>
              <Lock size={12} color={PrismColors.textSecondary} strokeWidth={2} />
              <Text style={styles.secureText}>100% seguro</Text>
            </View>
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
  ringAwaitTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    lineHeight: 15,
    color: PrismColors.textPrimary,
    textAlign: 'center',
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
    rowGap: Spacing.sm,
    columnGap: Spacing.sm,
  },
  valueCell: {
    width: '47%',
    borderRadius: Radius.sm + 2,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(248,250,252,0.9)',
    borderWidth: 1,
    borderColor: BorderColors.subtle,
  },
  valueCellTight: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs + 2,
  },
  valueCellDimmed: {
    opacity: 0.6,
  },
  valueIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${PrismColors.primary}10`,
    marginBottom: Spacing.xs + 2,
  },
  valueTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    lineHeight: 16,
    color: PrismColors.textPrimary,
    marginBottom: 3,
  },
  valueTitleTight: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 2,
  },
  valueBody: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    color: PrismColors.textSecondary,
  },
  valueBodyTight: {
    fontSize: 9,
    lineHeight: 12,
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
