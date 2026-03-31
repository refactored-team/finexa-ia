/**
 * Finexa Prism design tokens (aligned with tailwind.config.js).
 */

import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

/** Core palette — keep in sync with `tailwind.config.js` `theme.extend.colors`. */
export const PrismColors = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  tertiary: '#06B6D4',
  neutral: '#F8FAFC',
  surface: '#FFFFFF',
  primaryBorder: '#DBEAFE',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  danger: '#B91C1C',
} as const;

/** Chart / series semantics (Victory, SVG, etc.). */
export const ChartStyles = {
  historicalLine: PrismColors.primary,
  predictiveLine: PrismColors.tertiary,
  predictiveLineStyle: 'dashed' as const,
  positiveTrend: PrismColors.tertiary,
  frictionOrExpenses: PrismColors.secondary,
  frictionOrExpensesAlt: PrismColors.textSecondary,
} as const;

const tintColorLight = PrismColors.primary;
const tintColorDark = '#60A5FA';

export const Colors = {
  light: {
    text: PrismColors.textPrimary,
    textSecondary: PrismColors.textSecondary,
    background: PrismColors.neutral,
    surface: PrismColors.surface,
    tint: tintColorLight,
    icon: PrismColors.textSecondary,
    tabIconDefault: PrismColors.textSecondary,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
  },
};

export const FinexaLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: PrismColors.primary,
    background: PrismColors.neutral,
    card: PrismColors.surface,
    text: PrismColors.textPrimary,
    border: PrismColors.primaryBorder,
    notification: PrismColors.danger,
  },
};

export const FinexaDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: tintColorDark,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: '#334155',
    notification: '#F87171',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemibold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemibold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "PlusJakartaSans_400Regular, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sansMedium: "PlusJakartaSans_500Medium, system-ui, sans-serif",
    sansSemibold: "PlusJakartaSans_600SemiBold, system-ui, sans-serif",
    sansBold: "PlusJakartaSans_700Bold, system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
