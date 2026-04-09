import { TrendingUp } from '@/constants/lucideIcons';
import { PrismColors } from '@/constants/theme';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type OptimizeButtonProps = {
  label?: string;
  onPress?: () => void;
};

export default function OptimizeButton({
  label = 'Optimizar Ruta',
  onPress,
}: OptimizeButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.touchable}>
      <LinearGradient
        colors={[PrismColors.primary, '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <TrendingUp size={18} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.button,
  },
  gradient: {
    paddingVertical: Spacing.lg + 4,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 16,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
});
