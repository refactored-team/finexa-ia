import { Eye, EyeOff, type LucideIcon } from '@/constants/lucideIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, PrismColors } from '@/constants/theme';
import { Radius, Spacing, TextStyles } from '@/constants/uiStyles';

const F = Fonts!;

type AuthTextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: LucideIcon;
  secureTextEntry?: boolean;
  keyboardType?: ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: ComponentProps<typeof TextInput>['autoCapitalize'];
  rightAccessory?: ReactNode;
  compact?: boolean;
};

export function AuthTextField({
  label,
  placeholder,
  value,
  onChangeText,
  icon: IconComponent,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightAccessory,
  compact,
}: AuthTextFieldProps) {
  const iconSize = compact ? 18 : 20;
  return (
    <View style={[styles.field, compact && styles.fieldCompact]}>
      <Text style={[TextStyles.labelUppercase, styles.label, compact && styles.labelCompact]}>{label}</Text>
      <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
        <View pointerEvents="none" style={[styles.iconLeft, compact && styles.iconLeftCompact]}>
          <IconComponent size={iconSize} color={PrismColors.textSecondary} strokeWidth={2} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={`${PrismColors.textSecondary}99`}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            compact && styles.inputCompact,
            {
              fontFamily: F.sansMedium,
              paddingRight: rightAccessory ? 52 : Spacing.xl,
              paddingLeft: compact ? 44 : 48,
            },
          ]}
        />
        {rightAccessory ? <View style={styles.iconRight}>{rightAccessory}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  fieldCompact: {
    gap: Spacing.xs,
  },
  label: {
    marginLeft: Spacing.xs,
  },
  labelCompact: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  inputRow: {
    position: 'relative',
    minHeight: 52,
    justifyContent: 'center',
  },
  inputRowCompact: {
    minHeight: 46,
  },
  iconLeft: {
    position: 'absolute',
    left: Spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  iconLeftCompact: {
    left: Spacing.md,
  },
  iconRight: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  input: {
    borderRadius: Radius.full,
    backgroundColor: PrismColors.neutral,
    paddingVertical: 14,
    paddingLeft: 48,
    fontSize: 15,
    color: PrismColors.textPrimary,
  },
  inputCompact: {
    paddingVertical: 11,
    fontSize: 14,
  },
  toggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12}
      style={styles.toggle}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
      {visible ? (
        <EyeOff size={22} color={PrismColors.textSecondary} strokeWidth={2} />
      ) : (
        <Eye size={22} color={PrismColors.textSecondary} strokeWidth={2} />
      )}
    </Pressable>
  );
}
