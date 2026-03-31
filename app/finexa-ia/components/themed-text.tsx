import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, PrismColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'label';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'label' ? styles.label : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const sans = Fonts?.sans ?? 'PlusJakartaSans_400Regular';
const sansSemibold = Fonts?.sansSemibold ?? 'PlusJakartaSans_600SemiBold';
const sansBold = Fonts?.sansBold ?? 'PlusJakartaSans_700Bold';

const styles = StyleSheet.create({
  default: {
    fontFamily: sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  defaultSemiBold: {
    fontFamily: sansSemibold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontFamily: sansBold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: sansBold,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  link: {
    fontFamily: sans,
    lineHeight: 30,
    fontSize: 16,
    color: PrismColors.primary,
  },
  label: {
    fontFamily: sansSemibold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
