import { AlertCircle, ArrowUpRight, BookOpen, Circle, Plus, Sparkles, Target, Wallet } from '@/constants/lucideIcons';
import { Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth';

const analysisData = {
  ant_expense_total: 1046.146,
  ant_expense_percentage: 15.48,
  risk_level: "critico",
  summary: "¡Ojo con esto! Tu gasto total del periodo fue de [~$6,758.93] MXN, pero tus ingresos registrados solo suman $591.48 MXN — eso significa que estás gastando mucho más de lo que entra en tu cuenta. 🚨 Esa diferencia se está cubriendo con un balance previo de [~$7,350.41] MXN, lo cual no es sostenible a largo plazo.\n\nTu categoría más pesada es **alimentación** con [~$11,646.14] MXN en 34 transacciones — incluyendo $797.31 MXN en gastos hormiga solo en comida. Si le sumas los $248.84 MXN de la categoría hormiga directa (Uber Eats, Starbucks, Tropical Smoothie), tienes más de $1,046 MXN que se van en pequeños gastos evitables. Eso es el 15.5% de tu gasto total.\n\nTambién tienes Spotify cobrado 4 veces en el mismo periodo — algo que vale la pena revisar. Lo bueno: tu gasto en entretenimiento y transporte es bastante controlado, y eso habla bien de ti. El reto está en la comida y los gastos hormiga.",
  insights: [
    {
      title: "🚨 Tus gastos superan tus ingresos registrados",
      description: "Gastaste [~$6,758.93] MXN pero solo registraste $591.48 MXN de ingresos este periodo. Estás jalando de tu balance acumulado ([~$7,350.41] MXN) para cubrir el resto. Si esto sigue así, ese colchón se va a acabar rápido. Revisa si tienes ingresos que no están registrados en la app, y si no, es urgente ajustar tu gasto mensual.",
      priority: "alta",
      potential_monthly_saving: 0.0,
      affected_category: "ingreso"
    },
    {
      title: "🍔 Alimentación fuera de casa: tu gasto más grande",
      description: "Gastaste [~$11,646.14] MXN en comida en 34 transacciones. Solo en Sweetgreen aparece $810 dos veces (posiblemente duplicado, vale verificarlo). Grubhub sumó $134 y Uber Eats aparece también en la categoría hormiga con $124.34 adicionales. Si cocinas en casa aunque sea 3 días a la semana y reduces los pedidos a domicilio, podrías ahorrar fácilmente entre [~$1,500] y [~$2,000] MXN al mes.",
      priority: "alta",
      potential_monthly_saving: 1800.0,
      affected_category: "alimentacion"
    },
    {
      title: "☕ Gastos hormiga: $1,046 MXN que se van sin que los notes",
      description: "Entre la categoría hormiga directa y los hormiga detectados en alimentación, tienes $1,046.15 MXN en gastos pequeños y frecuentes: Starbucks ($45.47), Tropical Smoothie Cafe ($69.00), Uber Eats x2 ($124.34), Amazon ($10.02) y otros $797.31 MXN en snacks y compras chicas de comida. Estos gastos se sienten pequeños pero juntos representan el 15.5% de todo lo que gastaste. Reducirlos a la mitad ya te daría $523 MXN extra al mes.",
      priority: "alta",
      potential_monthly_saving: 523.0,
      affected_category: "hormiga"
    },
    {
      title: "🎵 Spotify cobrado 4 veces — ¿duplicado o error?",
      description: "Spotify aparece 4 veces con el mismo monto de $12.65 MXN cada uno, sumando [~$50.60] MXN. Una suscripción mensual normal debería aparecer solo una vez por periodo. Puede ser un error de cobro, una suscripción duplicada o un periodo de facturación traslapado. Entra a tu cuenta de Spotify y revisa tu historial de pagos — si hay cobros de más, puedes solicitar reembolso directamente con ellos.",
      priority: "media",
      potential_monthly_saving: 37.95,
      affected_category: "suscripcion"
    },
    {
      title: "🅿️ Estacionamiento: $133.56 MXN en un solo pago",
      description: "PayByPhone registró $133.56 MXN, que es un gasto considerable solo en estacionamiento. Si esto es recurrente, vale la pena explorar opciones de transporte público, carpooling o buscar estacionamientos con mensualidad si vas seguido al mismo lugar. Podrías reducir este gasto hasta en un [~40%] con un poco de planeación.",
      priority: "baja",
      potential_monthly_saving: 53.0,
      affected_category: "transporte"
    }
  ]
};

const InsightCard = ({ insight }: { insight: typeof analysisData.insights[0] }) => {
  const [expanded, setExpanded] = useState(false);
  const isHighPriority = insight.priority === 'alta';

  return (
    <TouchableOpacity
      style={[styles.insightCard, isHighPriority ? styles.insightCardHigh : null]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightTitleRow}>
          {isHighPriority ? (
            <AlertCircle size={16} color="#DC2626" />
          ) : insight.priority === 'media' ? (
            <Target size={16} color="#D97706" />
          ) : (
            <Wallet size={16} color="#3B82F6" />
          )}
          <Text style={[styles.insightTitle, isHighPriority ? styles.textHigh : null]}>
            {insight.title}
          </Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.insightBody}>
          <Text style={styles.insightDescription}>{insight.description}</Text>
          {insight.potential_monthly_saving > 0 && (
            <View style={styles.savingBadge}>
              <Sparkles size={12} color="#059669" />
              <Text style={styles.savingText}>Ahorro potencial: ${insight.potential_monthly_saving.toFixed(2)} MXN/mes</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  // Format summary to bold the text wrapped in **
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={i} style={{ fontFamily: TextStyles.bodyMedium.fontFamily }}>{part.slice(2, -2)}</Text>;
      }
      return part;
    });
  };

  return (
    <AuthBackground showBottomBar>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>Hola, <Text style={styles.greetingName}>Carlos</Text></Text>
        <Text style={styles.greetingText}>
          He analizado tus últimas transacciones y detecté comportamientos importantes en tus gastos.
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

      {/* Alerta de Riesgo (Risk Level Card) */}
      {analysisData.risk_level === 'critico' && (
        <View style={styles.riskAlertCard}>
          <View style={styles.riskAlertHeader}>
            <View style={styles.riskIconWrap}>
              <AlertCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text style={styles.riskAlertTitle}>Riesgo Financiero Crítico</Text>
          </View>
          <Text style={styles.riskAlertBody}>
            {formatText(analysisData.summary)}
          </Text>

          <View style={styles.hormigaStatBox}>
            <View>
              <Text style={styles.hormigaStatTitle}>Gastos Hormiga</Text>
              <Text style={styles.hormigaStatValue}>${analysisData.ant_expense_total.toFixed(2)} MXN</Text>
            </View>
            <View>
              <Text style={styles.hormigaStatPercentage}>{analysisData.ant_expense_percentage.toFixed(1)}%</Text>
              <Text style={styles.hormigaStatSubtitle}>del gasto total</Text>
            </View>
          </View>
        </View>
      )}

      {/* Alertas y Oportunidades de Ahorro */}
      <View style={styles.insightsSection}>
        <Text style={styles.insightsSectionTitle}>Observaciones de tu Gasto</Text>
        <Text style={styles.insightsSectionSubtitle}>Toca una alerta para ver más detalles</Text>

        {analysisData.insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </View>

      {/* Finexa Wisdom */}
      <View style={styles.cardWhite}>
        <View style={styles.wisdomHeader}>
          <View style={styles.wisdomIconWrap}>
            <BookOpen size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.wisdomTitle}>Sabiduría Finexa</Text>
        </View>
        <Text style={styles.wisdomQuote}>
          "Tus decisiones de hoy definen tu libertad de mañana. Un pequeño ajuste en tus gastos diarios tiene un gran impacto mensual."
        </Text>
        <TouchableOpacity style={styles.wisdomLink}>
          <Text style={styles.wisdomLinkText}>Leer artículo sobre el gasto hormiga</Text>
          <ArrowUpRight size={12} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Proximos Retos */}
      <View style={styles.cardWhiteTransparent}>
        <Text style={styles.retosTitle}>Próximos Retos</Text>

        <View style={styles.retoRow}>
          <Circle size={20} color="#64748B" fill="#64748B" opacity={0.6} />
          <Text style={styles.retoText}>Reducir gastos en alimentación fuera de casa</Text>
        </View>
        <View style={styles.retoRow}>
          <Circle size={20} color="#64748B" fill="#64748B" opacity={0.6} />
          <Text style={styles.retoText}>Revisar suscripciones activas</Text>
        </View>
      </View>

    </ScrollView>
    </AuthBackground>
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
    marginBottom: Spacing.xl,
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
  riskAlertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Shadow.card,
    shadowColor: '#DC2626',
    shadowOpacity: 0.08,
  },
  riskAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  riskIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskAlertTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 18,
    color: '#991B1B',
  },
  riskAlertBody: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  hormigaStatBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  hormigaStatTitle: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 11,
    color: '#991B1B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hormigaStatValue: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 18,
    color: '#7F1D1D',
  },
  hormigaStatPercentage: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 22,
    color: '#DC2626',
    textAlign: 'right',
  },
  hormigaStatSubtitle: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: '#991B1B',
    textAlign: 'right',
  },
  insightsSection: {
    marginBottom: Spacing.xl,
  },
  insightsSectionTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 4,
  },
  insightsSectionSubtitle: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
    marginBottom: Spacing.lg,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightCardHigh: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  insightTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: '#334155',
    flexShrink: 1,
    lineHeight: 20,
  },
  textHigh: {
    color: '#991B1B',
  },
  insightBody: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  insightDescription: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  savingText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#065F46',
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
    shadowOpacity: 0.04,
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
  }
});

