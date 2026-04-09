import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PrismColors } from '@/constants/theme';
import { Spacing } from '@/constants/uiStyles';
import SmartStack, { Finding, Theme } from '@/components/SmartStack';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { useSignOut } from '@/lib/auth/useSignOut';
import apiClient from '@/src/services/api/apiClient';

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
  activeBg: '#F3F5F8',
};
const ACCOUNT_CARD_WIDTH = 160;
const ACCOUNT_CARD_GAP = 10;
const CARD_WIDTH = ACCOUNT_CARD_WIDTH + ACCOUNT_CARD_GAP;
const GAUGE_SIZE = 72;
const GAUGE_STROKE = 6;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const HARDCODED_USER_ID = 123;

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

type ApiAnalysis = {
  ant_expense_total?: number | null;
  risk_level?: string | null;
};

type ApiCashFlow = {
  projected_liquidity?: number | null;
  forecast_horizon_days?: number | null;
};

type ApiInsight = {
  title?: string | null;
  description?: string | null;
  affected_category?: string | null;
};

type ApiTransaction = {
  id: number;
  amount_cents: number;
  description?: string;
  posted_at: string;
  category?: string | null;
};

type UiTransaction = {
  id: string;
  merchant_name: string;
  category: string;
  amount: number;
  dateISO: string;
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const fallbackFindings: Finding[] = [
  {
    id: '1',
    title: 'Spotify y Youtube Music contratados',
    icon: '💡',
    cardColor: '#312E81',
    buttonColor: '#4F46E5',
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
    cardColor: '#3730A3',
    buttonColor: '#4F46E5',
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
    cardColor: '#4338CA',
    buttonColor: '#6366F1',
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
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const theme = HERO_THEME;
  const tabBarHeight = useBottomTabBarHeight();
  const { signingOut, signOut } = useSignOut();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const screenHeight = Dimensions.get('window').height;
  const sheetY = useSharedValue(screenHeight);
  const fallbackAnalysis = {
    resilience: { score_total: 14 },
    cash_flow: { projected_liquidity: 1400 },
    ant_expense_total: 2100,
    insights: [{ title: 'Gastos hormiga altos en delivery y cafés' }],
  };
  const [apiAnalysis, setApiAnalysis] = useState<ApiAnalysis | null>(null);
  const [apiCashFlow, setApiCashFlow] = useState<ApiCashFlow | null>(null);
  const [apiInsights, setApiInsights] = useState<ApiInsight[]>([]);
  const [apiTransactions, setApiTransactions] = useState<UiTransaction[]>([]);
  const accounts = [
    {
      account_id: 'acc_1',
      mask: '5382',
      name: 'Tarjeta principal',
      total_expenses: 1650,
      pct_change: 12,
      transactions: [
        { id: 't1', merchant_name: 'Starbucks', category: 'hormiga', amount: 45, dateISO: new Date().toISOString() },
        { id: 't2', merchant_name: 'Spotify', category: 'suscripcion', amount: 13, dateISO: new Date(Date.now() - 86400000).toISOString() },
        { id: 't3', merchant_name: 'Uber Eats', category: 'hormiga', amount: 72, dateISO: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: 't4', merchant_name: 'Nomina', category: 'ingreso', amount: -810, dateISO: new Date(Date.now() - 86400000 * 5).toISOString() },
      ],
    },
    {
      account_id: 'acc_2',
      mask: '7741',
      name: 'Tarjeta gastos',
      total_expenses: 890,
      pct_change: -4,
      transactions: [
        { id: 't5', merchant_name: 'PayByPhone', category: 'transporte', amount: 134, dateISO: new Date(Date.now() - 86400000 * 4).toISOString() },
        { id: 't6', merchant_name: 'Burger Place', category: 'alimentacion', amount: 23, dateISO: new Date(Date.now() - 86400000 * 2).toISOString() },
      ],
    },
    {
      account_id: 'acc_3',
      mask: '9910',
      name: 'Tarjeta secundaria',
      total_expenses: 420,
      pct_change: 5,
      transactions: [
        { id: 't7', merchant_name: 'Cinepolis', category: 'entretenimiento', amount: 58, dateISO: new Date(Date.now() - 86400000 * 6).toISOString() },
      ],
    },
  ];
  useEffect(() => {
    let cancelled = false;
    const loadSmartStackData = async () => {
      try {
        const [analysisRes, cashFlowRes, insightsRes, transactionsRes] = await Promise.all([
          apiClient.get<ApiEnvelope<ApiAnalysis>>(`/ms-transactions/v1/users/${HARDCODED_USER_ID}/transactions/analysis/latest`),
          apiClient.get<ApiEnvelope<ApiCashFlow>>(`/ms-transactions/v1/users/${HARDCODED_USER_ID}/transactions/cash-flow/latest`),
          apiClient.get<ApiEnvelope<ApiInsight[]>>(`/ms-transactions/v1/users/${HARDCODED_USER_ID}/transactions/insights`, {
            params: { limit: 3, offset: 0 },
          }),
          apiClient.get<ApiEnvelope<ApiTransaction[]>>(`/ms-transactions/v1/users/${HARDCODED_USER_ID}/transactions`, {
            params: { limit: 20, offset: 0 },
          }),
        ]);

        if (cancelled) return;
        setApiAnalysis(analysisRes.data?.data ?? null);
        setApiCashFlow(cashFlowRes.data?.data ?? null);
        setApiInsights(insightsRes.data?.data ?? []);
        setApiTransactions(
          (transactionsRes.data?.data ?? []).map((tx) => ({
            id: String(tx.id),
            merchant_name: (tx.description || 'Movimiento').slice(0, 20),
            category: tx.category || 'variable',
            amount: (tx.amount_cents || 0) / 100,
            dateISO: tx.posted_at,
          }))
        );
      } catch {
        if (!cancelled) {
          setApiAnalysis(null);
          setApiCashFlow(null);
          setApiInsights([]);
          setApiTransactions([]);
        }
      }
    };
    loadSmartStackData();
    return () => {
      cancelled = true;
    };
  }, []);

  const antExpenseTotal = apiAnalysis?.ant_expense_total ?? fallbackAnalysis.ant_expense_total;
  const projectedLiquidity = apiCashFlow?.projected_liquidity ?? fallbackAnalysis.cash_flow.projected_liquidity;
  const dailySpend = Math.max(1, antExpenseTotal / 30);
  const projectedDays = Math.max(0, apiCashFlow?.forecast_horizon_days ?? Math.round(projectedLiquidity / dailySpend));
  const projectedDate = new Date(Date.now() + projectedDays * 86400000).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  const gaugeProgress = Math.min(1, projectedDays / 30);
  const circumference = 2 * Math.PI * GAUGE_RADIUS;
  const strokeDashoffset = circumference - gaugeProgress * circumference;
  const topInsight = apiInsights[0]?.title ?? fallbackAnalysis.insights[0]?.title ?? '';
  const cardColors = ['#312E81', '#3730A3', '#4338CA'];
  const selectedAccount = accounts.find((a) => a.account_id === selectedAccountId) ?? null;
  const filteredRecent = useMemo(() => {
    if (apiTransactions.length > 0) {
      return apiTransactions
        .slice()
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
        .slice(0, 8);
    }
    const visibleAccountId = accounts[activeCardIndex]?.account_id;
    return (
      accounts
        .find((a) => a.account_id === visibleAccountId)
        ?.transactions?.slice()
        .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
        .slice(0, 8) ?? []
    );
  }, [accounts, activeCardIndex, apiTransactions]);
  const levelLabel = apiAnalysis?.risk_level ? `Nivel ${apiAnalysis.risk_level.toLowerCase()}` : 'Nivel estable';
  const categoryLabel = apiInsights[0]?.affected_category
    ? `${apiInsights[0].affected_category.replace(/_/g, ' ')} altos`
    : 'Gastos hormiga altos';
  const stackFindings = useMemo<Finding[]>(() => {
    if (apiInsights.length === 0) return fallbackFindings;

    return apiInsights.slice(0, 3).map((insight, index) => ({
      id: String(index + 1),
      title: insight.title ?? `Insight ${index + 1}`,
      icon: '💡',
      cardColor: cardColors[index % 3],
      buttonColor: index === 2 ? '#6366F1' : '#4F46E5',
      steps: [
        { text: 'Analizamos tus transacciones recientes', completed: true, active: false },
        { text: insight.description ?? 'Detectamos un patrón de gasto relevante', completed: true, active: false },
        { text: '¿Quieres que te ayude a resolverlo?', completed: false, active: true },
      ],
    }));
  }, [apiInsights]);
  const onAccountsScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    const clampedIndex = Math.max(0, Math.min(rawIndex, accounts.length - 1));
    setActiveCardIndex(clampedIndex);
  }, []);
  const categoryMap: Record<string, { bg: string; icon: string; label: string }> = {
    alimentacion: { bg: '#FEF3C7', icon: '🍽️', label: 'alimentacion' },
    hormiga: { bg: '#FEE2E2', icon: '🐜', label: 'hormiga' },
    fijo: { bg: '#EDE9FE', icon: '🔒', label: 'fijo' },
    transporte: { bg: '#E0F2FE', icon: '🚗', label: 'transporte' },
    entretenimiento: { bg: '#F3E8FF', icon: '🎮', label: 'entretenimiento' },
    suscripcion: { bg: '#EDE9FE', icon: '🎵', label: 'suscripcion' },
    ingreso: { bg: '#DCFCE7', icon: '💰', label: 'ingreso' },
    variable: { bg: '#F1F5F9', icon: '🔀', label: 'variable' },
    transferencia: { bg: '#F1F5F9', icon: '↔️', label: 'transferencia' },
  };
  const formatRelativeDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff <= 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return `Hace ${diff} dias`;
  };
  const openSheet = (id: string) => {
    setSelectedAccountId(id);
    sheetY.value = withTiming(0, { duration: 250 });
  };
  const closeSheet = () => {
    sheetY.value = withTiming(screenHeight, { duration: 220 });
    setTimeout(() => setSelectedAccountId(null), 230);
  };
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  return (
    <AuthBackground showBottomBar showHeader={false}>
      <View style={[styles.root, { backgroundColor: '#E5E7EB' }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#C3E9E9' }} />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: '#F1F4F9' }]}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]}
            contentInset={{ bottom: tabBarHeight + 220 }}
            scrollIndicatorInsets={{ bottom: tabBarHeight + 220 }}
            showsVerticalScrollIndicator={false}>

            {/* Header */}
            <LinearGradient
              colors={['#C3E9E9', '#F6FBFB']}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 2 }}
              style={styles.header}>
              <View style={styles.topRow}>
                <View style={styles.userAvatarWrap}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.userAvatar}
                    resizeMode="cover"
                  />
                </View>

                <Pressable
                  onPress={signOut}
                  style={styles.logoutButton}
                  disabled={signingOut}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar sesión">
                  <Text style={styles.logoutButtonText}>{signingOut ? 'Cerrando...' : 'Cerrar sesión'}</Text>
                </Pressable>
              </View>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                allowFontScaling={false}
                style={[styles.welcomeLine, { color: '#000' }]}>
                Hola,{'\u00A0'}
                <Text style={[styles.nameLine, { color: '#036666' }]}>
                  Ivano{'\u00A0'}Ermakov
                </Text>
              </Text>
              <Text style={[styles.welcomeLine, { color: "#000", fontSize: 20 }]}>
                encontré esto por ti
              </Text>
              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{levelLabel}</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{categoryLabel}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Smart Stack */}
            <SmartStack
              findings={stackFindings}
              theme={theme}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
            />

            <View style={styles.lowerSection}>
              <View style={styles.gaugeCard}>
                <View style={styles.gaugeLeft}>
                  <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
                    <Circle
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                      stroke="#E5E7EB"
                      strokeWidth={GAUGE_STROKE}
                      fill="transparent"
                    />
                    <Circle
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                      stroke="#2DD4BF"
                      strokeWidth={GAUGE_STROKE}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
                    />
                  </Svg>
                  <View style={styles.gaugeInner}>
                    <Text style={styles.gaugeInnerValue}>{projectedDays}</Text>
                    <Text style={styles.gaugeInnerLabel}>DIAS</Text>
                  </View>
                </View>
                <View style={styles.gaugeRight}>
                  <Text style={styles.gaugeRightTitle}>Días de oxigeno</Text>
                  <Text style={styles.gaugeRightSubtitle}>Tu dinero alcanza hasta el {projectedDate}</Text>
                  <View style={styles.insightBadge}>
                    <Text style={styles.insightBadgeText}>{topInsight}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>TUS CUENTAS</Text>
              <FlatList
                data={accounts}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onAccountsScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.accountsList}
                keyExtractor={(item) => item.account_id}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => openSheet(item.account_id)}
                    style={[styles.accountCard, { backgroundColor: cardColors[index % 3] }]}>
                    <View style={styles.accountDecor} />
                    <Text style={styles.accountMask}>•••• {item.mask}</Text>
                    <Text style={styles.accountLabel}>Gastos del mes</Text>
                    <Text style={styles.accountAmount}>${item.total_expenses.toLocaleString('en-US')}</Text>
                    <View style={styles.accountPctBadge}>
                      <Text style={styles.accountPctText}>{item.pct_change >= 0 ? '+' : ''}{item.pct_change}%</Text>
                    </View>
                  </Pressable>
                )}
              />

              <Text style={styles.sectionLabel}>MOVIMIENTOS RECIENTES</Text>
              <View style={styles.recentCard}>
                {filteredRecent.map((tx, idx) => {
                  const meta = categoryMap[tx.category] ?? categoryMap.variable;
                  const isExpense = tx.amount > 0;
                  const name = (tx.merchant_name || 'Movimiento').slice(0, 20);
                  return (
                    <View key={tx.id} style={[styles.txRow, idx === filteredRecent.length - 1 && styles.txRowLast]}>
                      <View style={[styles.txIconWrap, { backgroundColor: meta.bg }]}>
                        <Text style={styles.txIcon}>{meta.icon}</Text>
                      </View>
                      <View style={styles.txMiddle}>
                        <Text style={styles.txName}>{name}</Text>
                        <Text style={styles.txMeta}>{formatRelativeDate(tx.dateISO)} · {meta.label}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: isExpense ? '#EF4444' : '#10B981' }]}>
                        {isExpense ? '-' : '+'}${Math.abs(tx.amount).toLocaleString('en-US')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ height: tabBarHeight + 24 }} />
          </ScrollView>

          {selectedAccount && (
            <>
              <Pressable onPress={closeSheet} style={styles.sheetBackdrop} />
              <Animated.View style={[styles.bottomSheet, sheetStyle]}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetCardVisual}>
                  <Text style={styles.sheetCardMask}>•••• {selectedAccount.mask}</Text>
                  <Text style={styles.sheetCardAmount}>${selectedAccount.total_expenses.toLocaleString('en-US')}</Text>
                </View>
                <Text style={styles.sheetTitle}>Movimientos · {new Date().toLocaleDateString('es-MX', { month: 'long' })}</Text>
                <FlatList
                  data={selectedAccount.transactions}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.sheetList}
                  renderItem={({ item }) => {
                    const meta = categoryMap[item.category] ?? categoryMap.variable;
                    const isExpense = item.amount > 0;
                    return (
                      <View style={styles.txRow}>
                        <View style={[styles.txIconWrap, { backgroundColor: meta.bg }]}>
                          <Text style={styles.txIcon}>{meta.icon}</Text>
                        </View>
                        <View style={styles.txMiddle}>
                          <Text style={styles.txName}>{(item.merchant_name || 'Movimiento').slice(0, 20)}</Text>
                          <Text style={styles.txMeta}>{formatRelativeDate(item.dateISO)} · {meta.label}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: isExpense ? '#EF4444' : '#10B981' }]}>
                          {isExpense ? '-' : '+'}${Math.abs(item.amount).toLocaleString('en-US')}
                        </Text>
                      </View>
                    );
                  }}
                />
              </Animated.View>
            </>
          )}

        </SafeAreaView>
      </View>
    </AuthBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scroll: {
    // paddingBottom: Spacing.lg,
  },
  root: {
    flex: 1,
    // height: 1000,
  },
  safe: {
    // Intentionally left without flex to avoid constraining ScrollView height.
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
    borderColor: "#036666",
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  logoutButton: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
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
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
    maxWidth: '96%',
    includeFontPadding: false,
  },
  chipsRow: {
    marginVertical: 15,
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EAFF39',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    // letterSpacing: 0.2,
    color: '#000',
  },
  lowerSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    minHeight: 126,
    gap: 12,
  },
  gaugeLeft: {
    flexBasis: '42%',
    maxWidth: 120,
    minWidth: 96,
    height: 92,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  gaugeInnerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: 0.8,
  },
  gaugeRight: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  gaugeRightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  gaugeRightSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 14,
    marginVertical: 2,
  },
  insightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,

    width: '90%',
  },
  insightBadgeText: {
    color: '#854D0E',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  accountsList: {
    paddingHorizontal: 0,
    paddingBottom: 14,
    gap: ACCOUNT_CARD_GAP,
  },
  accountCard: {
    minWidth: ACCOUNT_CARD_WIDTH,
    height: 100,
    borderRadius: 14,
    padding: 12,
    position: 'relative',
  },
  accountDecor: {
    width: 18,
    height: 13,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  accountMask: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  accountLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  accountAmount: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  accountPctBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  accountPctText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recentCard: {
    backgroundColor: PrismColors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  txRowLast: {
    borderBottomWidth: 0,
  },
  txIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 22,
  },
  txMiddle: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  txMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetCardVisual: {
    marginHorizontal: 14,
    borderRadius: 14,
    height: 90,
    backgroundColor: '#312E81',
    padding: 12,
    justifyContent: 'center',
  },
  sheetCardMask: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  sheetCardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetTitle: {
    marginTop: 14,
    marginHorizontal: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  sheetList: {
    paddingHorizontal: 4,
    // paddingBottom: 32,
  },
});