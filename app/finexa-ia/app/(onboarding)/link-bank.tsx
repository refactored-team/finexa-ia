import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TurboModuleRegistry,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth';
import { plaidService } from '@/src/services/api/plaid/plaidService';
import {
  create as plaidCreate,
  open as plaidOpen,
  type LinkExit,
  type LinkIOSPresentationStyle,
  type LinkSuccess,
} from 'react-native-plaid-link-sdk';

function logPlaidLinkExit(linkExit: LinkExit) {
  const { error, metadata } = linkExit;
  if (error) {
    console.warn('[Plaid] Link onExit — error', {
      errorCode: error.errorCode,
      errorMessage: error.errorMessage,
      errorType: error.errorType,
      displayMessage: error.displayMessage ?? error.errorDisplayMessage,
    });
  } else {
    console.log('[Plaid] Link onExit — sin error (cierre o cancelación)', {
      status: metadata.status,
      linkSessionId: metadata.linkSessionId,
      requestId: metadata.requestId,
      institution: metadata.institution?.name,
    });
  }
}

import {
  ArrowRight,
  Landmark,
  Lock,
  ShieldCheck
} from '@/constants/lucideIcons';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import {
  getExpoGoDevBuildInstructions,
  isAmplifyAuthConfigured,
  isExpoGo,
} from '@/lib/amplify/configure';
import { getInternalUserIdFromSession } from '@/src/services/api/users/usersService';

export default function LinkBankScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const router = useRouter();

  const [isLinking, setIsLinking] = useState(false);

  const clientIsExpoGo = useMemo(() => isExpoGo(), []);

  useEffect(() => {
    if (!isAmplifyAuthConfigured()) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const id = await getInternalUserIdFromSession();
        const { linked } = await plaidService.getPlaidLinkStatus(String(id));
        if (!cancelled && linked) {
          router.replace('/(tabs)/explore');
        }
      } catch {
        /* permanece en link-bank */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function showDevBuildHelp() {
    const d = getExpoGoDevBuildInstructions();
    if (d) {
      Alert.alert('Development build', d);
    }
  }

  async function handleCtaPress() {
    if (clientIsExpoGo) {
      showDevBuildHelp();
      return;
    }

    if (isLinking) return;

    const rnLinksdk = TurboModuleRegistry.get('RNLinksdk');
    const plaidAndroid = TurboModuleRegistry.get('PlaidAndroid');
    const nativePlaidPresent =
      Platform.OS === 'ios' ? rnLinksdk != null : plaidAndroid != null;

    if (!nativePlaidPresent) {
      Alert.alert(
        'Plaid no está enlazado',
        'Falta el módulo nativo del SDK. Volvé a compilar con npx expo run:ios (o run:android).',
      );
      return;
    }

    setIsLinking(true);

    try {
      let internalUserId: string;
      try {
        if (isAmplifyAuthConfigured()) {
          const id = await getInternalUserIdFromSession();
          internalUserId = String(id);
        } else {
          internalUserId = '1';
        }
      } catch (e) {
        Alert.alert('Usuario no encontrado', 'No encontramos tu perfil. Inicia sesión de nuevo.');
        setIsLinking(false);
        return;
      }

      let linkToken: string | null = null;
      try {
        const data = await plaidService.createLinkToken(internalUserId);
        linkToken = data.data?.link_token ?? null;
      } catch (error) {
        Alert.alert('Error', 'No se pudo conectar con el servidor bancario.');
        setIsLinking(false);
        return;
      }

      if (!linkToken) {
        Alert.alert('Error', 'No se recibió un token válido.');
        setIsLinking(false);
        return;
      }

      plaidCreate({ token: linkToken });

      plaidOpen({
        iOSPresentationStyle: 'MODAL' as unknown as LinkIOSPresentationStyle,
        onSuccess: async (success: LinkSuccess) => {
          try {
            await plaidService.exchangePublicToken(internalUserId, success.publicToken);
            router.replace('/(tabs)/explore');
          } catch (error) {
            Alert.alert('Error', 'No se pudo guardar la conexión.');
          } finally {
            setIsLinking(false);
          }
        },
        onExit: (linkExit: LinkExit) => {
          logPlaidLinkExit(linkExit);
          setIsLinking(false);
        },
      });
    } catch (error) {
      setIsLinking(false);
      Alert.alert('Plaid no disponible', 'Para abrir Plaid necesitas un dev build.');
    }
  }

  const paddingTop = insets.top || Spacing.md;

  return (
    <AuthBackground showBottomBar showHeader>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>

        {clientIsExpoGo && (
          <View style={styles.expoGoBanner}>
            <Text style={styles.expoGoText}>Estás en Expo Go. Plaid no funcionará sin Dev Build.</Text>
          </View>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <Landmark size={32} color="#042F2E" strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Aún no nos {'\n'} conocemos bien.</Text>
          <Text style={styles.heroSubtitle}>
            Comparte tus movimientos {'\n'}
            conmigo para empezar a construir {'\n'}
            tu <Text style={styles.heroSubtitleBold}>mapa financiero</Text>.
          </Text>
        </View>

        <View style={styles.cardWhite}>
          <Text style={styles.cardTitle}>Análisis Predictivo</Text>
          <Text style={styles.cardDesc}>
            Una vez conectados, Finexa analiza tus patrones de gasto para generar un mapa de salud financiera personalizado en menos de 60 segundos.
          </Text>

          {/* MAIN CTA */}
          <TouchableOpacity
            onPress={handleCtaPress}
            disabled={isLinking || clientIsExpoGo}
            style={[styles.mainCta, (isLinking || clientIsExpoGo) && styles.mainCtaDisabled]}
          >
            <Text style={styles.mainCtaText}>
              {isLinking ? 'Conectando...' : 'Vincular Cuenta Bancaria'}
            </Text>
            {!isLinking && <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footerInfo}>
          <View style={styles.footerRow}>
            <Lock size={12} color="#64748B" />
            <Text style={styles.footerText}>CIFRADO AES-256</Text>
          </View>
          <View style={styles.footerRow}>
            <ShieldCheck size={12} color="#64748B" />
            <Text style={styles.footerText}>CUMPLE GDPR</Text>
          </View>
        </View>
        <View style={[styles.footerRow, { justifyContent: 'center', marginTop: Spacing.sm }]}>
          <ShieldCheck size={12} color="#64748B" />
          <Text style={styles.footerText}>CERTIFICADO PLAID</Text>
        </View>
      </ScrollView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 40,
  },
  expoGoBanner: {
    backgroundColor: '#FEF3C7',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  expoGoText: {
    ...TextStyles.caption,
    color: '#92400E',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5EEAD4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 28,
    lineHeight: 34,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
  },
  heroSubtitleBold: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    color: '#3B82F6',
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
    shadowOpacity: 0.04,
  },
  cardBlue: {
    backgroundColor: '#4F46E5', // Indigo primary
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
    shadowOpacity: 0.1,
    shadowColor: '#4F46E5',
  },
  stepLabelGreen: {
    fontFamily: TextStyles.labelUppercase.fontFamily,
    fontSize: 11,
    letterSpacing: 2,
    color: '#059669',
    marginBottom: Spacing.sm,
  },
  stepLabelBlue: {
    fontFamily: TextStyles.labelUppercase.fontFamily,
    fontSize: 11,
    letterSpacing: 2,
    color: '#A5B4FC',
    marginBottom: Spacing.sm,
  },
  stepLabelBlue2: {
    fontFamily: TextStyles.labelUppercase.fontFamily,
    fontSize: 11,
    letterSpacing: 2,
    color: '#3B82F6',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    color: '#0F172A',
    marginBottom: Spacing.sm,
  },
  cardTitleWhite: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    marginBottom: Spacing.xl,
  },
  cardDescWhite: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: '#E0E7FF',
    marginBottom: Spacing.xl,
  },
  vaultIllustration: {
    height: 140,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vaultBadge: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  vaultBadgeText: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 12,
    color: '#065F46',
  },
  cardOptions: {
    gap: Spacing.md,
  },
  optionRowActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  optionRowInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: Spacing.sm,
  },
  optionTextActive: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionTextInactive: {
    fontFamily: TextStyles.body.fontFamily,
    fontSize: 14,
    color: '#A5B4FC',
  },
  mainCta: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6', // Blue
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  mainCtaDisabled: {
    opacity: 0.6,
  },
  mainCtaText: {
    fontFamily: TextStyles.onPrimary.fontFamily,
    fontSize: 16,
    color: '#FFFFFF',
  },
  chartIllustration: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#334155',
  },
  chartValue: {
    fontFamily: TextStyles.bodyMedium.fontFamily,
    fontSize: 13,
    color: '#059669',
    textAlign: 'right',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    height: 100,
    marginBottom: Spacing.sm,
  },
  bar: {
    width: 28,
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.xs,
  },
  chartLabelText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: '#94A3B8',
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.5,
  },
});