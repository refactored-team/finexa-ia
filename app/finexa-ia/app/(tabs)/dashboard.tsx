import { ArrowUpRight, BookOpen, CheckCircle2, Circle, Plus, TrendingUp, Zap } from '@/constants/lucideIcons';
import { Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Center Badge */}
      <View style={styles.topBadgeContainer}>
        <View style={styles.topBadgeAvatarPlaceholder} />
        <View>
          <Text style={styles.topBadgeTitle}>Mi Centro de</Text>
          <Text style={styles.topBadgeSubtitle}>Resiliencia</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>850{'\n'}pts</Text>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>Hola, <Text style={styles.greetingName}>Carlos</Text></Text>
        <Text style={styles.greetingText}>
          Tu salud financiera muestra una estabilidad notable hoy. He identificado 2 oportunidades para optimizar tus ahorros semanales.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryBtn}>
          <View style={styles.plusIconWrap}>
            <Plus size={14} color="#3B82F6" strokeWidth={3} />
          </View>
          <Text style={styles.primaryBtnText}>Añadir{'\n'}Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Optimizar</Text>
        </TouchableOpacity>
      </View>

      {/* Score Donut Chart Placeholder */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreCircleOuter}>
          <View style={styles.scoreCircleInner}>
            <Text style={styles.scoreLabel}>PUNTAJE</Text>
            <Text style={styles.scoreValue}>82</Text>
            <Text style={styles.scoreStatus}>Resiliencia Alta</Text>
          </View>
        </View>
      </View>

      {/* Linea de vida */}
      <View style={styles.cardWhite}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Línea de{'\n'}Vida</Text>
            <Text style={styles.cardSubtitle}>Flujo de caja{'\n'}proyectado a 30 días</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardValueLarge}>$4,250.00</Text>
            <Text style={styles.cardSubtitleRight}>Balance Actual</Text>
          </View>
        </View>

        <View style={styles.barsContainer}>
          <View style={[styles.bar, { height: 40, backgroundColor: '#E0E7FF' }]} />
          <View style={[styles.bar, { height: 45, backgroundColor: '#E0E7FF' }]} />
          <View style={[styles.bar, { height: 60, backgroundColor: '#C7D2FE' }]} />
          <View style={[styles.bar, { height: 70, backgroundColor: '#C7D2FE' }]} />
          <View style={[styles.bar, { height: 65, backgroundColor: '#A5B4FC' }]} />
          <View style={[styles.bar, { height: 90, backgroundColor: '#818CF8' }]} />
          <View style={[styles.bar, { height: 110, backgroundColor: '#6366F1' }]} />
          <View style={[styles.bar, { height: 95, backgroundColor: '#A5B4FC' }]} />
          <View style={[styles.bar, { height: 120, backgroundColor: '#7DD3FC' }]} />
          <View style={[styles.bar, { height: 130, backgroundColor: '#38BDF8' }]} />
          <View style={[styles.bar, { height: 80, backgroundColor: '#C7D2FE' }]} />
          <View style={[styles.bar, { height: 60, backgroundColor: '#E0E7FF' }]} />
        </View>

        <View style={styles.dateLabels}>
          <Text style={styles.dateLabelText}>HOY</Text>
          <Text style={styles.dateLabelText}>15 DE OCT</Text>
          <Text style={styles.dateLabelText}>30 DE OCT</Text>
        </View>
      </View>

      {/* Ahorro Automatico (Green Card) */}
      <View style={styles.cardGreen}>
        <View style={styles.greenCardHeader}>
          <View style={styles.greenIconWrap}>
            <TrendingUp size={16} color="#FFFFFF" />
          </View>
          <View style={styles.greenBadge}>
            <Text style={styles.greenBadgeText}>ALERTA POSITIVA</Text>
          </View>
        </View>
        <Text style={styles.greenCardTitle}>Ahorro Automático</Text>
        <Text style={styles.greenCardBody}>
          Has gastado 12% menos que el promedio de este mes. ¿Deseas mover $150 a tu fondo de emergencia?
        </Text>
      </View>

      {/* Finexa Wisdom */}
      <View style={styles.cardWhite}>
        <View style={styles.wisdomHeader}>
          <View style={styles.wisdomIconWrap}>
            <BookOpen size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.wisdomTitle}>Finexa Wisdom</Text>
        </View>
        <Text style={styles.wisdomQuote}>
          "La resiliencia financiera no es cuánto ganas, sino qué tan rápido te recuperas."
        </Text>
        <TouchableOpacity style={styles.wisdomLink}>
          <Text style={styles.wisdomLinkText}>Leer artículo</Text>
          <ArrowUpRight size={12} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Proximos Retos */}
      <View style={styles.cardWhiteTransparent}>
        <Text style={styles.retosTitle}>Próximos Retos</Text>

        <View style={styles.retoRow}>
          <CheckCircle2 size={20} color="#059669" />
          <Text style={styles.retoText}>Completar curso: Inversión 101</Text>
        </View>
        <View style={styles.retoRow}>
          <Circle size={20} color="#64748B" fill="#64748B" opacity={0.6} />
          <Text style={styles.retoText}>Reducir suscripciones activas</Text>
        </View>
        <View style={styles.retoRow}>
          <Circle size={20} color="#64748B" fill="#64748B" opacity={0.6} />
          <Text style={styles.retoText}>Meta: Fondo de 3 meses</Text>
        </View>
      </View>

      {/* Optimizador Finexa AI (Purple Card) */}
      <LinearGradient colors={['#3B34D1', '#281E9A']} style={styles.cardPurple}>
        <Text style={styles.purpleTitle}>Optimizador Finexa AI</Text>
        <Text style={styles.purpleBody}>
          Nuestro motor de inteligencia ha detectado que puedes reducir tus intereses de tarjeta de crédito en un 4% mediante una consolidación inteligente.
        </Text>
        <TouchableOpacity style={styles.purpleBtn}>
          <Text style={styles.purpleBtnText}>Ver propuesta de {'\n'}consolidación</Text>
        </TouchableOpacity>

        {/* Laptop Illustration Placeholder */}
        <View style={styles.laptopPlaceholder}>
          <View style={styles.laptopScreen}>
            <TrendingUp size={48} color="#FFFFFF" opacity={0.8} />
          </View>
          <View style={styles.laptopBase} />
        </View>

        <View style={styles.zapBadge}>
          <Zap size={14} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      </LinearGradient>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  topBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  topBadgeAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  topBadgeTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 14,
  },
  topBadgeSubtitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 14,
  },
  pointsBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 10,
    color: '#3B82F6',
    textAlign: 'center',
  },
  greetingSection: {
    marginBottom: Spacing.xl,
  },
  greetingTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 26,
    color: '#1E293B',
    marginBottom: Spacing.sm,
  },
  greetingName: {
    color: '#3B82F6',
  },
  greetingText: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl + Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.button,
  },
  plusIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
  },
  secondaryBtnText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: '#3B82F6',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl + Spacing.lg,
  },
  scoreCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftColor: '#3B34D1', // Simulated progress
    borderTopColor: '#3B34D1',
    borderRightColor: '#3B34D1',
  },
  scoreCircleInner: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: TextStyles.labelUppercase.fontFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 54,
    color: '#1E293B',
    lineHeight: 60,
  },
  scoreStatus: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#059669',
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
    shadowOpacity: 0.04,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    color: '#64748B',
  },
  cardValueLarge: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 16,
    color: '#3B34D1',
    marginBottom: 4,
  },
  cardSubtitleRight: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: '#64748B',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    marginBottom: Spacing.lg,
  },
  bar: {
    width: 14,
    borderRadius: 4,
    backgroundColor: '#C7D2FE',
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabelText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 9,
    color: '#94A3B8',
  },
  cardGreen: {
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  greenCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  greenIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenBadge: {
    backgroundColor: '#6EE7B7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  greenBadgeText: {
    fontFamily: TextStyles.labelUppercase.fontFamily,
    fontSize: 9,
    color: '#065F46',
  },
  greenCardTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: '#064E3B',
    marginBottom: Spacing.xs,
  },
  greenCardBody: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
  wisdomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  wisdomIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wisdomTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: '#1E293B',
  },
  wisdomQuote: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  wisdomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wisdomLinkText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#3B82F6',
  },
  cardWhiteTransparent: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  retosTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: Spacing.md,
  },
  retoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retoText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#334155',
  },
  cardPurple: {
    borderRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl + 40,
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  purpleTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  purpleBody: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 13,
    color: '#E0E7FF',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  purpleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    zIndex: 2,
  },
  purpleBtnText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#3B34D1',
    textAlign: 'center',
  },
  laptopPlaceholder: {
    position: 'absolute',
    bottom: -15,
    right: -20,
    width: 140,
    height: 110,
    opacity: 0.8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  laptopScreen: {
    width: 110,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laptopBase: {
    width: 140,
    height: 12,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  zapBadge: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
