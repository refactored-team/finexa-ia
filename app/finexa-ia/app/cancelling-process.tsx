import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  mapInsightToCancellationFinding,
  type CancellationFindingDTO,
} from '@/src/features/cancellation/mapInsightToFinding';
import {
  clearCancellationSnapshot,
  consumePendingCancellationInsight,
} from '@/src/features/cancellation/pendingInsight';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CancellationStep {
  id: string;
  title: string;
  description: string;
  action_label: string;
  action_url?: string;
}

interface CancellationFinding {
  id: string;
  title: string;
  icon: string;
  service_name: string;
  amount: number;
  steps: CancellationStep[];
  screenTitle?: string;
  savingsMetaLine?: string;
  serviceIconBg?: string;
}

function dtoToFinding(dto: CancellationFindingDTO): CancellationFinding {
  return {
    id: dto.id,
    title: dto.title,
    icon: dto.icon,
    service_name: dto.service_name,
    amount: dto.amount,
    steps: dto.steps,
    screenTitle: dto.screenTitle,
    savingsMetaLine: dto.savingsMetaLine,
    serviceIconBg: dto.serviceIconBg,
  };
}

export interface CancellationScreenProps {
  finding: CancellationFinding;
  onComplete: () => void;
  onBack: () => void;
}

const MOCK_FINDING: CancellationFinding = {
  id: 'spotify-1',
  title: 'Cancelar Spotify Premium',
  icon: '🎵',
  service_name: 'Spotify Premium',
  amount: 129,
  steps: [
    {
      id: 's1',
      title: 'Abrir configuración de cuenta',
      description: 'Abre tu perfil y entra a Administrar plan para ver la suscripción activa.',
      action_label: 'Abrir Spotify →',
      action_url: 'spotify://',
    },
    {
      id: 's2',
      title: 'Entrar a Plan y pagos',
      description: 'Busca la sección Plan y pagos para continuar con la baja.',
      action_label: 'Ir a Plan y pagos',
    },
    {
      id: 's3',
      title: 'Confirmar cancelación',
      description: 'Confirma la cancelación y revisa que aparezca fecha de fin del servicio.',
      action_label: 'Confirmar cancelación',
    },
  ],
};

function StepCard({
  step,
  index,
  currentStep,
  completed,
  cardPulse,
  ringPop,
  activeEntryY,
  activeEntryOpacity,
  onStepAction,
}: {
  step: CancellationStep;
  index: number;
  currentStep: number;
  completed: boolean;
  cardPulse: SharedValue<number>;
  ringPop: SharedValue<number>;
  activeEntryY: SharedValue<number>;
  activeEntryOpacity: SharedValue<number>;
  onStepAction: (step: CancellationStep) => void;
}) {
  const isDone = index < currentStep || completed;
  const isActive = !completed && index === currentStep;
  const isLocked = !isDone && !isActive;

  const activeRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isActive ? ringPop.value : 1 }],
  }));

  const activeCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isActive ? cardPulse.value : 1 }, { translateY: isActive ? activeEntryY.value : 0 }],
    opacity: isActive ? activeEntryOpacity.value : 1,
  }));

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLineCol}>
        <Animated.View
          style={[
            styles.stepRing,
            isDone && styles.stepRingDone,
            isActive && styles.stepRingActive,
            isLocked && styles.stepRingLocked,
            activeRingStyle,
          ]}>
          <Text
            style={[
              styles.stepRingText,
              isDone && styles.stepRingTextDone,
              isActive && styles.stepRingTextActive,
              isLocked && styles.stepRingTextLocked,
            ]}>
            {isDone ? '✓' : index + 1}
          </Text>
        </Animated.View>

      </View>

      <Animated.View
        style={[
          styles.stepCard,
          isDone && styles.stepCardDone,
          isActive && styles.stepCardActive,
          isLocked && styles.stepCardLocked,
          activeCardStyle,
        ]}>
        {isDone && (
          <>
            <Text style={styles.stepTitleDone}>{step.title}</Text>
            <Text style={styles.stepDoneMeta}>✓ Completado</Text>
          </>
        )}

        {isActive && (
          <>
            <Text style={styles.stepTitleActive}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            <Pressable style={styles.actionButton} onPress={() => onStepAction(step)}>
              <Text style={styles.actionButtonText}>{step.action_label}</Text>
            </Pressable>
          </>
        )}

        {isLocked && (
          <>
            <Text style={styles.stepTitleLocked}>{step.title}</Text>
            <Text style={styles.stepLockedMeta}>🔒 Bloqueado</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

export function CancellationScreen({ finding, onComplete, onBack }: CancellationScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progressTrackWidth, setProgressTrackWidth] = useState(1);

  const completedSV = useSharedValue(0);
  const progressSV = useSharedValue(0);
  const cardPulse = useSharedValue(1);
  const ringPop = useSharedValue(1);
  const activeEntryY = useSharedValue(20);
  const activeEntryOpacity = useSharedValue(0);
  const savingsY = useSharedValue(20);
  const savingsOpacity = useSharedValue(0);

  const totalSteps = finding.steps.length;
  const progressRatio = Math.min(1, totalSteps === 0 ? 0 : currentStep / totalSteps);
  const annualSavings = useMemo(() => finding.amount * 12, [finding.amount]);

  useEffect(() => {
    progressSV.value = withTiming(progressRatio, { duration: 400 });
  }, [progressRatio, progressSV]);

  useEffect(() => {
    completedSV.value = withTiming(completed ? 1 : 0, { duration: 350 });
    if (completed) {
      savingsY.value = withSpring(0, { damping: 16, stiffness: 160 });
      savingsOpacity.value = withTiming(1, { duration: 280 });
    }
  }, [completed, completedSV, savingsOpacity, savingsY]);

  useEffect(() => {
    if (completed) return;
    activeEntryY.value = 20;
    activeEntryOpacity.value = 0;
    activeEntryY.value = withSpring(0, { damping: 16, stiffness: 180 });
    activeEntryOpacity.value = withTiming(1, { duration: 220 });
  }, [currentStep, completed, activeEntryOpacity, activeEntryY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(completedSV.value, [0, 1], ['#B2EDE0', '#DCFCE7']),
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: progressTrackWidth * progressSV.value,
    backgroundColor: interpolateColor(completedSV.value, [0, 1], ['#4F46E5', '#15803D']),
  }));

  const savingsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: savingsY.value }],
    opacity: savingsOpacity.value,
  }));

  const handleAdvanceStep = () => {
    cardPulse.value = withSpring(0.97, { damping: 16, stiffness: 260 });
    ringPop.value = withSpring(1.2, { damping: 12, stiffness: 280 });
    setTimeout(() => {
      cardPulse.value = withSpring(1, { damping: 14, stiffness: 220 });
      ringPop.value = withSpring(1, { damping: 12, stiffness: 240 });
    }, 120);

    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) {
        setCompleted(true);
      }
      return next;
    });
  };

  const handleStepAction = async (step: CancellationStep) => {
    if (step.action_url) {
      try {
        await Linking.openURL(step.action_url);
      } catch {
        // If deep link fails, continue with guided flow.
      }
      setTimeout(handleAdvanceStep, 1500);
      return;
    }
    handleAdvanceStep();
  };

  const getBubbleText = () => {
    if (completed) {
      return (
        <Text style={styles.bubbleTextCompleted}>
          {'¡Lo logramos! Dejaste de pagar '}
          <Text style={styles.bubbleTextCompletedBold}>${finding.amount}/mes</Text>
          {' . En un año eso son '}
          <Text style={styles.bubbleTextCompletedBold}>${annualSavings.toLocaleString('en-US')}</Text>
          {' de vuelta en tu bolsillo.'}
        </Text>
      );
    }
    if (currentStep === 0) {
      return (
        <Text style={styles.bubbleText}>
          {'Te guío '}
          <Text style={styles.bubbleHighlight}>paso a paso</Text>
          {'. Esto tarda '}
          <Text style={styles.bubbleHighlight}>~3 min</Text>
          {'. Me quedo contigo hasta que esté cancelado.'}
        </Text>
      );
    }
    return <Text style={styles.bubbleText}>{finding.steps[currentStep]?.description ?? ''}</Text>;
  };

  const progressLabel = completed
    ? '¡Completado!'
    : currentStep === totalSteps - 1
      ? `Paso ${totalSteps} de ${totalSteps} · ¡Ya casi!`
      : `Paso ${Math.min(currentStep + 1, totalSteps)} de ${totalSteps}`;

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{finding.screenTitle ?? 'Cancelar suscripción'}</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <View style={styles.serviceRow}>
          <View style={[styles.serviceIconWrap, { backgroundColor: finding.serviceIconBg ?? '#1DB954' }]}>
            <Text style={styles.serviceIcon}>{finding.icon}</Text>
          </View>
          <View style={styles.serviceTextWrap}>
            <Text style={styles.serviceName}>{finding.service_name}</Text>
            <Text style={styles.serviceMeta}>
              {finding.savingsMetaLine ??
                `$${finding.amount} · cobrado ${Math.max(1, currentStep + 1)} veces`}
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack} onLayout={(e) => setProgressTrackWidth(e.nativeEvent.layout.width)}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
        <Text style={[styles.progressLabel, completed && styles.progressLabelDone]}>{progressLabel}</Text>
      </Animated.View>

      <View style={styles.bubbleSection}>
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarEmoji}>🤖</Text>
        </View>
        <View style={styles.bubble}>{getBubbleText()}</View>
      </View>

      <ScrollView style={styles.timelineScroll} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
        {finding.steps.map((step, index) => {
          const isLast = index === finding.steps.length - 1;
          const isDone = index < currentStep || completed;
          const isActive = !completed && index === currentStep;
          const nextIsDone = index + 1 < currentStep || completed;
          const nextIsActive = !completed && index + 1 === currentStep;

          return (
            <View key={step.id} style={styles.timelineItem}>
              <StepCard
                step={step}
                index={index}
                currentStep={currentStep}
                completed={completed}
                cardPulse={cardPulse}
                ringPop={ringPop}
                activeEntryY={activeEntryY}
                activeEntryOpacity={activeEntryOpacity}
                onStepAction={handleStepAction}
              />

              {!isLast && (
                <View style={styles.connectorOverlay}>
                  {isDone && nextIsDone && <View style={[styles.connector, { backgroundColor: '#D4F530' }]} />}
                  {isDone && nextIsActive && (
                    <LinearGradient colors={['#D4F530', '#4F46E5']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.connector} />
                  )}
                  {isActive && (
                    <LinearGradient colors={['#4F46E5', '#E5E7EB']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.connector} />
                  )}
                  {!isDone && !isActive && <View style={[styles.connector, { backgroundColor: '#E5E7EB' }]} />}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {completed && (
        <Animated.View style={[styles.savingsWrap, savingsAnimatedStyle]}>
          <View style={styles.savingsCard}>
            <Text style={styles.savingsLabel}>AHORRO ANUAL ESTIMADO</Text>
            <Text style={styles.savingsAmount}>${annualSavings.toLocaleString('en-US')}</Text>
            <Text style={styles.savingsSub}>Tu score de resiliencia subió 3 puntos ↑</Text>
          </View>
          <Pressable style={styles.homeButton} onPress={onComplete}>
            <Text style={styles.homeButtonText}>Volver al inicio</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

export default function CancellingProcessRoute() {
  const router = useRouter();
  const [finding] = useState<CancellationFinding>(() => {
    const pending = consumePendingCancellationInsight();
    if (pending) {
      return dtoToFinding(mapInsightToCancellationFinding(pending));
    }
    return MOCK_FINDING;
  });

  useEffect(() => () => clearCancellationSnapshot(), []);

  return (
    <CancellationScreen
      key={finding.id}
      finding={finding}
      onBack={() => router.back()}
      onComplete={() => router.replace('/(tabs)/explore')}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerRightSpacer: {
    width: 32,
    height: 32,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceIcon: {
    fontSize: 22,
  },
  serviceTextWrap: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  serviceMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 100,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 100,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  progressLabelDone: {
    color: '#15803D',
    fontWeight: '700',
  },
  bubbleSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#B2EDE0',
    borderWidth: 2,
    borderColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarEmoji: {
    fontSize: 14,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomLeftRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 11,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 17,
    color: '#374151',
  },
  bubbleHighlight: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  bubbleTextCompleted: {
    fontSize: 12,
    lineHeight: 17,
    color: '#15803D',
    fontWeight: '700',
  },
  bubbleTextCompletedBold: {
    color: '#15803D',
    fontWeight: '800',
  },
  timelineScroll: {
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: 8,
  },
  connectorOverlay: {
    position: 'absolute',
    left: 13,
    top: 28,
    bottom: -2,
    width: 2,
  },
  connector: {
    flex: 1,
    minHeight: 10,
    marginVertical: 3,
    borderRadius: 99,
    width: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepLineCol: {
    width: 28,
    alignItems: 'center',
  },
  stepRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRingDone: {
    backgroundColor: '#D4F530',
  },
  stepRingActive: {
    backgroundColor: '#4F46E5',
  },
  stepRingLocked: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  stepRingText: {
    fontSize: 16,
    fontWeight: '800',
  },
  stepRingTextDone: {
    color: '#1a1a1a',
  },
  stepRingTextActive: {
    color: '#FFFFFF',
  },
  stepRingTextLocked: {
    color: '#D1D5DB',
  },
  stepCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stepCardDone: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  stepCardActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  stepCardLocked: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    opacity: 0.6,
  },
  stepTitleDone: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  stepDoneMeta: {
    marginTop: 4,
    fontSize: 16,
    color: '#15803D',
    fontWeight: '700',
  },
  stepTitleActive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  stepDescription: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 15,
    color: '#6B7280',
  },
  actionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitleLocked: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepLockedMeta: {
    marginTop: 4,
    fontSize: 15,
    color: '#D1D5DB',
  },
  savingsWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  savingsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  savingsLabel: {
    fontSize: 15,
    color: '#6B7280',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  savingsAmount: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '800',
    color: '#15803D',
  },
  savingsSub: {
    marginTop: 4,
    fontSize: 10,
    color: '#6B7280',
  },
  homeButton: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
