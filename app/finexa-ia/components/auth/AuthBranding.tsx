import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { finexaBrandMarkWhite, finexaIconColor, finexaNameColor } from '@/constants/brandingAssets';
import { PrismColors } from '@/constants/theme';
import { Layout, Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';

type AuthBrandingProps = {
  compact?: boolean;
  dense?: boolean;
  variant?: 'default' | 'inline';
};

function BrandLockupColumn({
  dense,
  minimal,
}: {
  dense?: boolean;
  /** Sin tarjeta ni halo (p. ej. variant inline). */
  minimal?: boolean;
}) {
  if (minimal) {
    return (
      <View style={[styles.lockupCol, dense && styles.lockupColDense]}>
        <Image
          source={finexaIconColor}
          style={[styles.glyphMinimal, dense && styles.glyphMinimalDense]}
          contentFit="contain"
          accessibilityLabel="Finexa"
          accessibilityRole="image"
        />
        <Image
          source={finexaNameColor}
          style={[styles.nameMinimal, dense && styles.nameMinimalDense]}
          contentFit="contain"
          accessibilityLabel="Finexa AI"
          accessibilityRole="image"
        />
      </View>
    );
  }

  return (
    <View style={[styles.lockupFloating, dense && styles.lockupFloatingDense]}>
      <View style={[styles.iconHalo, dense && styles.iconHaloDense, Shadow.brandIcon]}>
        <LinearGradient
          colors={[PrismColors.primary, PrismColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconGradient, dense && styles.iconGradientDense]}>
          <Image
            source={finexaBrandMarkWhite}
            style={[styles.glyphOnGradient, dense && styles.glyphOnGradientDense]}
            contentFit="contain"
            accessibilityLabel="Finexa"
            accessibilityRole="image"
          />
        </LinearGradient>
      </View>

      <Image
        source={finexaNameColor}
        style={[styles.nameStacked, dense && styles.nameStackedDense]}
        contentFit="contain"
        accessibilityLabel="Finexa AI"
        accessibilityRole="image"
      />
    </View>
  );
}

export function AuthBranding({ compact, dense, variant = 'default' }: AuthBrandingProps) {
  const inline = variant === 'inline';

  if (inline) {
    return (
      <View style={[styles.inlineWrap, compact && styles.inlineWrapCompact]}>
        <BrandLockupColumn dense={dense} minimal />
        <View style={styles.inlineTextCol}>
          <Text style={[TextStyles.caption, styles.inlineTagline]} numberOfLines={2}>
            Tu compañero financiero inteligente
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        dense && styles.wrapDense,
        compact && dense && styles.wrapAuthTight,
      ]}>
      <BrandLockupColumn dense={dense} />
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
  lockupFloating: {
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: Spacing.sm,
  },
  lockupFloatingDense: {
    maxWidth: 280,
  },
  iconHalo: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  iconHaloDense: {
    marginBottom: Spacing.sm,
  },
  iconGradient: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradientDense: {
    width: 64,
    height: 64,
  },
  glyphOnGradient: {
    width: 44,
    height: 44,
  },
  glyphOnGradientDense: {
    width: 38,
    height: 38,
  },
  nameStacked: {
    width: '100%',
    maxWidth: 260,
    height: 44,
  },
  nameStackedDense: {
    maxWidth: 230,
    height: 38,
  },
  lockupCol: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  lockupColDense: {
    gap: Spacing.xs,
  },
  glyphMinimal: {
    width: 48,
    height: 48,
  },
  glyphMinimalDense: {
    width: 40,
    height: 40,
  },
  nameMinimal: {
    height: 30,
    width: 160,
    maxWidth: '100%',
  },
  nameMinimalDense: {
    height: 26,
    width: 140,
  },
  inlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  inlineWrapCompact: {
    marginBottom: Spacing.sm,
  },
  inlineTextCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  inlineTagline: {
    marginTop: 0,
  },
  wrap: {
    ...Layout.centerHorizontal,
    marginBottom: Spacing.lg,
  },
  wrapCompact: {
    marginBottom: Spacing.md,
  },
  wrapDense: {
    marginBottom: Spacing.md,
  },
  wrapAuthTight: {
    marginBottom: Spacing.sm,
  },
  taglineDense: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  tagline: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
});
