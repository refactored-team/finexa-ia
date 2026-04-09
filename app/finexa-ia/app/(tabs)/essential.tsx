import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrismColors } from '@/constants/theme';
import { Spacing } from '@/constants/uiStyles';

export interface SurvivalModeScreenProps {
  onBack: () => void;
}

type PreviewItem = {
  icon: string;
  name: string;
  sub: string;
  tag: string;
  iconBg: string;
  tagBg: string;
  tagText: string;
  locked?: boolean;
};

const previewItems: PreviewItem[] = [
  { icon: '🎵', name: 'Spotify Premium', sub: '$12.65/mes', tag: 'Pausar', iconBg: '#EDE9FE', tagBg: '#FEE2E2', tagText: '#991B1B' },
  { icon: '📺', name: 'Netflix', sub: '$199/mes', tag: 'Pausar', iconBg: '#FEE2E2', tagBg: '#FEE2E2', tagText: '#991B1B' },
  { icon: '☕', name: 'Cafés y delivery', sub: '$1,046/mes', tag: 'Alertar', iconBg: '#FEF3C7', tagBg: '#FEF3C7', tagText: '#92400E' },
  { icon: '🏠', name: 'Renta', sub: '$8,000/mes', tag: 'Proteger', iconBg: '#DCFCE7', tagBg: '#DCFCE7', tagText: '#166534', locked: true },
  { icon: '🛒', name: 'Súper mercado', sub: 'Esencial', tag: 'Proteger', iconBg: '#DCFCE7', tagBg: '#DCFCE7', tagText: '#166534', locked: true },
];

export function SurvivalModeScreen({ onBack }: SurvivalModeScreenProps) {
  const [notified, setNotified] = useState(false);

  const shieldScale: SharedValue<number> = useSharedValue(1);
  const notifyScale: SharedValue<number> = useSharedValue(1);
  const notifyOpacity: SharedValue<number> = useSharedValue(1);
  const successY: SharedValue<number> = useSharedValue(20);
  const successOpacity: SharedValue<number> = useSharedValue(0);

  useEffect(() => {
    shieldScale.value = withSequence(
      withSpring(1.05, { damping: 12, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  }, [shieldScale]);

  useEffect(() => {
    if (!notified) return;
    successY.value = withSpring(0, { damping: 15, stiffness: 180 });
    successOpacity.value = withTiming(1, { duration: 220 });
  }, [notified, successOpacity, successY]);

  const shieldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shieldScale.value }],
  }));

  const notifyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notifyScale.value }],
    opacity: notifyOpacity.value,
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: successY.value }],
    opacity: successOpacity.value,
  }));

  const handleNotifyPress = () => {
    if (notified) return;
    notifyScale.value = withSpring(0.95, { damping: 15, stiffness: 220 });
    notifyOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setNotified(true), 200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.topRow}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.topTitle}>Modo Supervivencia</Text>
            <View style={styles.spacer} />
          </View>

          <Animated.View style={[styles.shieldWrap, shieldAnimatedStyle]}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
            <View style={styles.prontoBadge}>
              <Text style={styles.prontoText}>PRONTO</Text>
            </View>
          </Animated.View>

          <Text style={styles.heroTitle}>
            Modo <Text style={styles.heroAccent}>Supervivencia</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Finexa elimina todo lo que no necesitas y protege lo que sí importa.
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Próximamente · En desarrollo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>VISTA PREVIA — ASÍ FUNCIONARÁ</Text>
            {previewItems.map((item, idx) => (
              <View
                key={`${item.name}-${idx}`}
                style={[
                  styles.previewRow,
                  idx > 0 && styles.previewRowBorder,
                  item.locked && styles.previewLocked,
                ]}>
                <View style={[styles.previewIconWrap, { backgroundColor: item.iconBg }]}>
                  <Text style={styles.previewIcon}>{item.icon}</Text>
                </View>
                <View style={styles.previewTextCol}>
                  <Text style={styles.previewName}>{item.name}</Text>
                  <Text style={styles.previewSub}>{item.sub}</Text>
                </View>
                <View style={[styles.previewTag, { backgroundColor: item.tagBg }]}>
                  <Text style={[styles.previewTagText, { color: item.tagText }]}>{item.tag}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.cardPadded}>
            <Text style={styles.featuresTitle}>Qué podrás hacer</Text>

            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#EDE9FE' }]}><Text>🎯</Text></View>
              <Text style={styles.featureText}><Text style={styles.featureBold}>Modo automático</Text> — Finexa pausa lo no esencial con un toque</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}><Text>🔔</Text></View>
              <Text style={styles.featureText}><Text style={styles.featureBold}>Alertas en tiempo real</Text> antes de cada gasto innecesario</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#DCFCE7' }]}><Text>📅</Text></View>
              <Text style={styles.featureText}><Text style={styles.featureBold}>Duración programable</Text> — activa por días o semanas</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#FEE2E2' }]}><Text>💰</Text></View>
              <Text style={styles.featureText}><Text style={styles.featureBold}>Contador de ahorro en vivo</Text> mientras el modo está activo</Text>
            </View>
          </View>

          {!notified ? (
            <Animated.View style={notifyAnimatedStyle}>
              <Pressable style={styles.notifyButton} onPress={handleNotifyPress}>
                <Text style={styles.notifyText}>🔔 Notificarme el lanzamiento</Text>
              </Pressable>
              <Text style={styles.notifySub}>Sin spam. Solo cuando esté listo.</Text>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.successCard, successAnimatedStyle]}>
              <Text style={styles.successTitle}>¡Listo! Te avisamos 🎉</Text>
              <Text style={styles.successSub}>Serás de los primeros en activar el Modo Supervivencia.</Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function EssentialRoute() {
  const router = useRouter();
  return <SurvivalModeScreen onBack={() => router.back()} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1E1B2E',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    backgroundColor: '#1E1B2E',
    paddingHorizontal: 14,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  topTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  spacer: {
    width: 32,
    height: 32,
  },
  shieldWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#312E81',
    borderWidth: 2,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shieldEmoji: {
    fontSize: 32,
  },
  prontoBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#D4F530',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  prontoText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroAccent: {
    color: '#D4F530',
  },
  heroSubtitle: {
    marginTop: 6,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  body: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
  },
  comingSoonBadge: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  card: {
    backgroundColor: PrismColors.surface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  previewRowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  previewLocked: {
    opacity: 0.4,
  },
  previewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 15,
  },
  previewTextCol: {
    flex: 1,
  },
  previewName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
  },
  previewTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  previewTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardPadded: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 16,
  },
  featureBold: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  notifyButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  notifyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  notifySub: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  successSub: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
