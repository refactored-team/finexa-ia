import { LinearGradient } from 'expo-linear-gradient';
import { Wallet } from '@/constants/lucideIcons';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, PrismColors } from '@/constants/theme';
import { Layout, Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';

const F = Fonts!;

type AuthBrandingProps = {
  /** Menos margen bajo el bloque de marca (pantallas bajas / más contenido arriba). */
  compact?: boolean;
  /** Aún más pequeño: menos scroll en formularios largos (solo variante apilada). */
  dense?: boolean;
  /**
   * `inline`: icono + Finexa en una fila; mucha menos altura que el bloque apilado.
   * Mejor para pantallas de login/registro: el formulario queda más arriba y centrado.
   */
  variant?: 'default' | 'inline';
};

export function AuthBranding({ compact, dense, variant = 'default' }: AuthBrandingProps) {
  if (variant === 'inline') {
    return (
      <View style={[styles.inlineWrap, compact && styles.inlineWrapCompact]}>
        <View style={[styles.inlineIconOuter, Shadow.brandIcon]}>
          <LinearGradient
            colors={[PrismColors.primary, PrismColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}>
            <Wallet size={20} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </View>
        <View style={styles.inlineTextCol}>
          <Text style={styles.inlineTitle} numberOfLines={1}>
            Finexa
          </Text>
          <Text style={[TextStyles.caption, styles.inlineTagline]} numberOfLines={1}>
            Tu compañero financiero inteligente
          </Text>
        </View>
      </View>
    );
  }

  const iconSize = dense ? 26 : 32;
  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        dense && styles.wrapDense,
        compact && dense && styles.wrapAuthTight,
      ]}>
      <View style={[styles.iconOuter, dense && styles.iconOuterDense, Shadow.brandIcon]}>
        <LinearGradient
          colors={[PrismColors.primary, PrismColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}>
          <Wallet size={iconSize} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
      </View>
      <Text style={[TextStyles.heroTitle, styles.brandTitle, dense && styles.heroTitleDense]}>Finexa</Text>
      {!dense ? (
        <Text style={[TextStyles.bodyMedium, styles.tagline]}>
          Tu compañero financiero inteligente
        </Text>
      ) : (
        <Text style={[TextStyles.caption, styles.taglineDense]} numberOfLines={1}>
          Tu compañero financiero inteligente
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  inlineWrapCompact: {
    marginBottom: Spacing.md,
  },
  inlineIconOuter: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  inlineTextCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  inlineTitle: {
    fontFamily: F.sansBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.35,
    color: PrismColors.primary,
  },
  inlineTagline: {
    marginTop: 2,
  },
  wrap: {
    ...Layout.centerHorizontal,
    marginBottom: Spacing.xxxl,
  },
  wrapCompact: {
    marginBottom: Spacing.xl,
  },
  wrapDense: {
    marginBottom: Spacing.lg,
  },
  wrapAuthTight: {
    marginBottom: Spacing.md,
  },
  iconOuter: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  iconOuterDense: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  heroTitleDense: {
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.4,
    marginBottom: Spacing.sm,
  },
  taglineDense: {
    textAlign: 'center',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
  },
});
