import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrismColors } from '@/constants/theme';
import { Layout } from '@/constants/uiStyles';

type AuthBackgroundProps = {
  children: ReactNode;
};

export function AuthBackground({ children }: AuthBackgroundProps) {
  const p = PrismColors.primary;
  const s = PrismColors.secondary;
  const t = PrismColors.tertiary;

  return (
    <View style={[Layout.flex1, { backgroundColor: PrismColors.neutral }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.9,
  },
  blobTopLeft: {
    width: 320,
    height: 320,
    top: -80,
    left: -80,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -40,
    right: -60,
  },
  blobBottomRight: {
    width: 360,
    height: 360,
    bottom: -100,
    right: -100,
  },
  blobBottomLeft: {
    width: 260,
    height: 260,
    bottom: -60,
    left: -60,
  },
});
