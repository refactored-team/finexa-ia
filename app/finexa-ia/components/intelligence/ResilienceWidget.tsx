import { Radius, Spacing, TextStyles } from '@/constants/uiStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ResilienceWidget({
  liquidity = 57000,
  percentage = 85,
}: {
  liquidity?: number;
  percentage?: number;
}) {
  return (
    <LinearGradient
      colors={['#3525cd', '#1e128c']} // Custom resilience gradient per design
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background Icon */}
      <View style={styles.bgIconWrap}>
        <Zap size={100} color="#FFFFFF" opacity={0.25} fill="#FFFFFF" />
      </View>

      <Text style={styles.label}>Indice de Resiliencia</Text>

      <View style={styles.valueWrap}>
        <Text style={styles.valueText}>${liquidity.toLocaleString('en-US')}</Text>
        <Text style={styles.subValueText}>liquidez observada</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>

      <Text style={styles.footerText}>
        Capacidad de respuesta ante imprevistos optimizada al {percentage}%.
      </Text>

      {/* Accent Bottom Right */}
      <View style={[styles.prismAccent, styles.prismAccentBr]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1e128c',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
  },
  statusMicro: {
    position: 'absolute',
    top: 8,
    right: 16,
    fontSize: 9,
    fontFamily: TextStyles.caption.fontFamily,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
  bgIconWrap: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  label: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.sm,
  },
  valueWrap: {
    marginTop: Spacing.md,
  },
  valueText: {
    fontFamily: TextStyles.screenTitle.fontFamily,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subValueText: {
    color: '#00ffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  progressTrack: {
    marginTop: Spacing.xl,
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ffff',
    borderRadius: Radius.full,
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  footerText: {
    fontFamily: TextStyles.caption.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  prismAccent: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  prismAccentBr: {
    bottom: -1,
    right: -1,
    backgroundColor: '#00ffff',
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
