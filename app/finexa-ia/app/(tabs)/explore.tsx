import { LinearGradient } from 'expo-linear-gradient';
import { Settings } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { ThemedView } from '@/components/themed-view';
import { PrismColors } from '@/constants/theme';
import { Layout, Spacing } from '@/constants/uiStyles';

export default function ExploreScreen() {
  const [oxygenDays] = useState(14);
  const [foodOrders] = useState(34);
  const [potentialSavings] = useState(608.82);

  const gaugeProgress = (oxygenDays / 30) * 100;
  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference - (gaugeProgress / 100) * circumference;

  return (
    <ThemedView style={Layout.flex1}>
      <SafeAreaView style={Layout.flex1} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>El Observatorio Financiero</Text>
                <Text style={styles.subtitle}>[FNX_ENGINE_v4.2]</Text>
              </View>
              <Pressable style={styles.settingsButton}>
                <Settings size={20} color={PrismColors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Hola, analicé tus movimientos.</Text>
            <Text style={styles.heroSubtitle}>
              Esto es lo único que requiere tu atención hoy para salvar tu mes.
            </Text>
          </View>

          {/* Main Content Grid */}
          <View style={styles.contentGrid}>
            {/* Right Column - Main Alert */}
            <View style={styles.rightColumn}>
              <View style={[styles.glassCard, styles.alertCard]}>
                {/* <Text style={[styles.microStatus, styles.microStatusLeft]}>
                    [SECURE_PROTOCOL_ENFORCED]
                  </Text> */}

                <View style={styles.alertHeader}>
                  <View style={styles.spotifyIcon}>
                    <Text style={styles.spotifyIconText}>♪</Text>
                  </View>
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalBadgeText}>Crítico</Text>
                  </View>
                </View>

                <Text style={styles.alertTitle}>
                  Fuga Detectada: Spotify cobrado 4 veces.
                </Text>

                <View style={styles.protocolSection}>
                  <Text style={styles.protocolLabel}>Protocolo Finexa Ejecutando:</Text>

                  <View style={styles.protocolList}>
                    <View style={styles.protocolItem}>
                      <View style={[styles.protocolIcon, styles.protocolComplete]}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                      <Text style={styles.protocolText}>
                        Aislar Cargos: Identificando tokens de suscripción redundantes.
                      </Text>
                    </View>

                    <View style={styles.protocolItem}>
                      <View style={[styles.protocolIcon, styles.protocolComplete]}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                      <Text style={styles.protocolText}>
                        Preparar Solicitud de Reembolso: Documentación para disputa con comerciante.
                      </Text>
                    </View>

                    <View style={styles.protocolItem}>
                      <View style={[styles.protocolIcon, styles.protocolActive]}>
                        <Text style={styles.spinner}>○</Text>
                      </View>
                      <Text style={[styles.protocolText, styles.protocolTextActive]}>
                        Ejecutar Cancelación: Resolución API de un clic.
                      </Text>
                    </View>
                  </View>
                </View>

                <LinearGradient
                  colors={[PrismColors.primary, PrismColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.killSwitchButton}>
                  <Pressable style={styles.killSwitchPressable}>
                    <Text style={styles.killSwitchText}>Detener Fuga Ahora</Text>
                  </Pressable>
                </LinearGradient>
              </View>

              {/* Bottom Mini Cards */}
              <View style={styles.miniCardsRow}>
                <View style={[styles.glassCard, styles.miniCard]}>
                  <View style={[styles.miniIcon, styles.miniIconGreen]}>
                    <Text style={styles.miniIconSymbol}>🛡</Text>
                  </View>
                  <View>
                    <Text style={styles.miniLabel}>Protección</Text>
                    <Text style={styles.miniValue}>Activa</Text>
                  </View>
                </View>

                <View style={[styles.glassCard, styles.miniCard]}>
                  <View style={[styles.miniIcon, styles.miniIconPrimary]}>
                    <Text style={styles.miniIconSymbol}>⏰</Text>
                  </View>
                  <View>
                    <Text style={styles.miniLabel}>Último Escaneo</Text>
                    <Text style={styles.miniValue}>Hace 2 min</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Left Column - Oxygen Gauge */}
            <View style={styles.leftColumn}>
              <View style={styles.glassCard}>
                <Text style={styles.microStatus}>[DATA_SYNC: OK]</Text>

                {/* Oxygen Gauge */}
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
                    <Text style={styles.gaugeLabel}>Días de Oxígeno</Text>
                  </View>
                </View>

                <View style={styles.gaugeDescription}>
                  <Text style={styles.cardTitle}>Tranquilidad Asegurada</Text>
                  <Text style={styles.cardBody}>
                    Tu liquidez actual cubre tus necesidades esenciales hasta final de quincena sin ajustes.
                  </Text>
                </View>
              </View>

              {/* Habit Detection Card */}
              <View style={[styles.glassCard, styles.habitCard]}>
                <Text style={[styles.microStatus, styles.microStatusBottom]}>[AI_ANALYSIS_ACTIVE]</Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Hábito Detectado</Text>
                </View>

                <Text style={styles.habitTitle}>
                  Detecté {foodOrders} pedidos de comida este mes.
                </Text>

                <Text style={styles.habitBody}>
                  Si reducimos los pedidos a domicilio un 25%, recuperamos{' '}
                  <Text style={styles.highlight}>${potentialSavings.toFixed(2)}</Text> y ganamos 4 días adicionales.
                </Text>

                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Optimizar Hábito</Text>
                </Pressable>
              </View>
            </View>


          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PrismColors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: PrismColors.textSecondary,
    opacity: 0.4,
    marginTop: 2,
    letterSpacing: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 12,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    lineHeight: 24,
  },
  contentGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  leftColumn: {
    gap: Spacing.lg,
  },
  rightColumn: {
    gap: Spacing.lg,
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
  microStatus: {
    position: 'absolute',
    top: 24,
    right: 32,
    fontFamily: 'monospace',
    fontSize: 8,
    color: PrismColors.textSecondary,
    opacity: 0.4,
  },
  microStatusBottom: {
    top: 'auto',
    bottom: 24,
  },
  microStatusLeft: {
    right: 'auto',
    left: 48,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.lg,
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
  alertCard: {
    paddingTop: 48,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  spotifyIcon: {
    width: 64,
    height: 64,
    backgroundColor: PrismColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PrismColors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: PrismColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  spotifyIconText: {
    fontSize: 32,
    color: PrismColors.tertiary,
  },
  criticalBadge: {
    backgroundColor: PrismColors.neutral,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PrismColors.danger,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  alertTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.xl,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  protocolSection: {
    marginBottom: Spacing.xl,
  },
  protocolLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PrismColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.lg,
  },
  protocolList: {
    gap: Spacing.lg,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  protocolIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolComplete: {
    backgroundColor: PrismColors.neutral,
  },
  protocolActive: {
    backgroundColor: PrismColors.primaryBorder,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  spinner: {
    fontSize: 12,
    color: PrismColors.primary,
  },
  protocolText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: PrismColors.textSecondary,
  },
  protocolTextActive: {
    color: PrismColors.textPrimary,
    fontWeight: '700',
  },
  killSwitchButton: {
    borderRadius: 16,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 8,
    marginBottom: Spacing.lg,
  },
  killSwitchPressable: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  killSwitchText: {
    fontSize: 18,
    fontWeight: '800',
    color: PrismColors.surface,
    letterSpacing: -0.5,
  },
  disclaimer: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: PrismColors.textSecondary,
    opacity: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  miniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  miniIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconGreen: {
    backgroundColor: PrismColors.neutral,
  },
  miniIconPrimary: {
    backgroundColor: PrismColors.primaryBorder,
  },
  miniIconSymbol: {
    fontSize: 20,
  },
  miniLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: PrismColors.textSecondary,
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  miniValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PrismColors.textPrimary,
    letterSpacing: -0.3,
  },
});
