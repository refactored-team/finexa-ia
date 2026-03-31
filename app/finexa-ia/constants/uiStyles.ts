/**
 * Shared layout and typography for StyleSheet-based screens.
 * Uses PrismColors and Fonts from theme.ts (single source of truth).
 */

import type { TextStyle, ViewStyle } from 'react-native';

import { Fonts, PrismColors } from '@/constants/theme';

const F = Fonts!;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Card / elevated surfaces */
export const Shadow = {
  card: {
    shadowColor: PrismColors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ViewStyle,
  button: {
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ViewStyle,
  fab: {
    shadowColor: PrismColors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  brandIcon: {
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  } satisfies ViewStyle,
};

export const Layout = {
  flex1: { flex: 1 } satisfies ViewStyle,
  row: { flexDirection: 'row' as const } satisfies ViewStyle,
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } satisfies ViewStyle,
  rowWrapCenter: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing.xs,
  } satisfies ViewStyle,
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } satisfies ViewStyle,
  centerHorizontal: { alignItems: 'center' as const } satisfies ViewStyle,
  /** Vertical stack with consistent spacing between fields */
  formColumn: { gap: Spacing.xl + 4 } satisfies ViewStyle,
  /** Tighter auth forms (less scroll on small phones) */
  formColumnDense: { gap: Spacing.md } satisfies ViewStyle,
  /** Auth: espacio intermedio entre campos */
  formColumnAuth: { gap: Spacing.lg } satisfies ViewStyle,
  termsRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    marginLeft: Spacing.xs,
  } satisfies ViewStyle,
};

/** Borders with alpha on primaryBorder */
export const BorderColors = {
  card: 'rgba(219, 234, 254, 0.4)',
  subtle: 'rgba(219, 234, 254, 0.5)',
  divider: 'rgba(219, 234, 254, 0.4)',
} as const;

export const TextStyles = {
  screenTitle: {
    fontFamily: F.sansBold,
    fontSize: 24,
    lineHeight: 30,
    color: PrismColors.textPrimary,
    textAlign: 'left',
  } satisfies TextStyle,
  screenTitleCompact: {
    fontFamily: F.sansBold,
    fontSize: 20,
    lineHeight: 26,
    color: PrismColors.textPrimary,
    textAlign: 'left',
  } satisfies TextStyle,
  heroTitle: {
    fontFamily: F.sansBold,
    fontSize: 36,
    letterSpacing: -0.5,
    color: PrismColors.primary,
  } satisfies TextStyle,
  body: {
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 22,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    lineHeight: 22,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  caption: {
    fontFamily: F.sans,
    fontSize: 12,
    lineHeight: 18,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  labelUppercase: {
    fontFamily: F.sansBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  link: {
    fontFamily: F.sansBold,
    fontSize: 14,
    color: PrismColors.primary,
  } satisfies TextStyle,
  linkSmall: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: PrismColors.primary,
  } satisfies TextStyle,
  onPrimary: {
    fontFamily: F.sansBold,
    fontSize: 16,
    color: '#FFFFFF',
  } satisfies TextStyle,
  dividerLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  socialLabel: {
    fontFamily: F.sansBold,
    fontSize: 12,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  strengthLabel: {
    fontFamily: F.sansBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: PrismColors.primary,
  } satisfies TextStyle,
  terms: {
    fontFamily: F.sans,
    fontSize: 12,
    lineHeight: 18,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  checkboxMark: {
    fontFamily: F.sansBold,
    fontSize: 11,
    color: '#FFFFFF',
  } satisfies TextStyle,
  tabCardTitle: {
    fontFamily: F.sansBold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: PrismColors.textPrimary,
  } satisfies TextStyle,
  tabCardBody: {
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 22,
    color: PrismColors.textSecondary,
  } satisfies TextStyle,
  tabLink: {
    fontFamily: F.sansSemibold,
    fontSize: 14,
    color: PrismColors.primary,
  } satisfies TextStyle,
};
