import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { PrismColors } from '@/constants/theme';
import { Layout, Spacing } from '@/constants/uiStyles';

export default function ComparisonScreen() {
  return (
    <ThemedView style={Layout.flex1}>
      <SafeAreaView style={Layout.flex1} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.pageTitle}>Comparación de Diseños</Text>
            <Text style={styles.pageSubtitle}>Elige el que más te guste</Text>
          </View>

          {/* OPTION 1: Soft Primary Focus */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 1: Soft Primary Focus (Recomendado)</Text>
            <Text style={styles.optionDescription}>Profesional, confiable, con acentos azules suaves</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option1Card]}>
              <View style={styles.alertHeader}>
                <View style={styles.option1AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.option1Badge}>
                  <Text style={styles.option1BadgeText}>💡 Detectado</Text>
                </View>
              </View>

              <Text style={styles.alertTitle}>
                Hola! Encontré esto por ti
              </Text>
              <Text style={styles.alertSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.protocolSection}>
                <View style={styles.protocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option1Complete]}>
                      <Text style={styles.option1Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option1Complete]}>
                      <Text style={styles.option1Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option1Active]}>
                      <Text style={styles.option1Spinner}>○</Text>
                    </View>
                    <Text style={[styles.protocolText, styles.protocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.killSwitchButton}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 2: Tertiary Accent (Playful) */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 2: Tertiary Accent</Text>
            <Text style={styles.optionDescription}>Más jugétón y fresco con acentos cian</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option2Card]}>
              <View style={styles.alertHeader}>
                <View style={styles.option2AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.option2Badge}>
                  <Text style={styles.option2BadgeText}>🔍 Encontré algo</Text>
                </View>
              </View>

              <Text style={styles.alertTitle}>
                Hola! Encontré esto por ti
              </Text>
              <Text style={styles.alertSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.protocolSection}>
                <View style={styles.protocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option2Complete]}>
                      <Text style={styles.option2Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option2Complete]}>
                      <Text style={styles.option2Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option2Active]}>
                      <Text style={styles.option2Spinner}>○</Text>
                    </View>
                    <Text style={[styles.protocolText, styles.protocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.killSwitchButton}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Ayúdame a resolverlo</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 3: Gradient Background */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 3: Gradient Background</Text>
            <Text style={styles.optionDescription}>Fondo con gradiente sutil, más profundidad visual</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option3Card]}>
              <View style={styles.alertHeader}>
                <View style={styles.option3AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.option3Badge}>
                  <Text style={styles.option3BadgeText}>💡 Detectado</Text>
                </View>
              </View>

              <Text style={styles.alertTitle}>
                Hola! Encontré esto por ti
              </Text>
              <Text style={styles.alertSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.protocolSection}>
                <View style={styles.protocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option3Complete]}>
                      <Text style={styles.option3Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option3Complete]}>
                      <Text style={styles.option3Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.protocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option3Active]}>
                      <Text style={styles.option3Spinner}>○</Text>
                    </View>
                    <Text style={[styles.protocolText, styles.protocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.killSwitchButton}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Cancelar por mí</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 4: Large Avatar "Presenting" (Your Suggestion!) */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 4: Avatar Grande "Presentando"</Text>
            <Text style={styles.optionDescription}>Avatar más grande como si estuviera presentando las sugerencias</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option4Card]}>
              {/* Header with badge only */}


              {/* Avatar + Greeting Section (together as header) */}
              <View style={styles.option4TopSection}>


                <View style={styles.option4GreetingContainer}>
                  <View style={styles.option4HeaderRow}>
                    <View style={styles.option4Badge}>
                      <Text style={styles.option4BadgeText}>💡 Detectado</Text>
                    </View>
                  </View>
                  <Text style={styles.option4Title}>
                    ¡Hola! Encontré esto por ti
                  </Text>
                </View>
                <View style={styles.option4AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.option4AvatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Full Width Subtitle */}
              <Text style={styles.option4FullWidthSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              {/* Protocol Steps in Content Box */}
              <View style={styles.option4ContentBox}>
                <View style={styles.option4ProtocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option4Complete]}>
                      <Text style={styles.option4Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option4ProtocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option4Complete]}>
                      <Text style={styles.option4Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option4ProtocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option4Active]}>
                      <Text style={styles.option4Spinner}>○</Text>
                    </View>
                    <Text style={[styles.option4ProtocolText, styles.option4ProtocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.killSwitchButton}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 5A: Soft Blue Card Background */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 5A: Fondo Azul Suave</Text>
            <Text style={styles.optionDescription}>Card con fondo azul claro, más colorido pero profesional</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option5ACard]}>
              <View style={styles.option4TopSection}>
                <View style={styles.option4GreetingContainer}>
                  <View style={styles.option4HeaderRow}>
                    <LinearGradient
                      colors={[PrismColors.primary, PrismColors.tertiary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.option5Badge}>
                      <Text style={styles.option5BadgeText}>💡 Detectado</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.option4Title}>
                    ¡Hola! Encontré esto por ti
                  </Text>
                </View>
                <View style={styles.option5AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.option4AvatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.option4FullWidthSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.option5ContentBox}>
                <View style={styles.option4ProtocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Complete]}>
                      <Text style={styles.option5Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option5ProtocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Complete]}>
                      <Text style={styles.option5Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option5ProtocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Active]}>
                      <Text style={styles.option5Spinner}>○</Text>
                    </View>
                    <Text style={[styles.option5ProtocolText, styles.option5ProtocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.option5Button}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 5B: Gradient Card Background */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 5B: Gradiente Suave</Text>
            <Text style={styles.optionDescription}>Card con gradiente cyan → azul → morado, más visual</Text>

            <LinearGradient
              colors={['#E0F2FE', '#DBEAFE', '#EDE9FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.glassCard, styles.alertCard, styles.option5BCard]}>
              <View style={styles.option4TopSection}>
                <View style={styles.option4GreetingContainer}>
                  <View style={styles.option4HeaderRow}>
                    <LinearGradient
                      colors={[PrismColors.tertiary, PrismColors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.option5Badge}>
                      <Text style={styles.option5BadgeText}>💡 Detectado</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.option4Title}>
                    ¡Hola! Encontré esto por ti
                  </Text>
                </View>
                <View style={styles.option5AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.option4AvatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.option4FullWidthSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.option5BContentBox}>
                <View style={styles.option4ProtocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Complete]}>
                      <Text style={styles.option5Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option5ProtocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Complete]}>
                      <Text style={styles.option5Checkmark}>✓</Text>
                    </View>
                    <Text style={styles.option5ProtocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5Active]}>
                      <Text style={styles.option5Spinner}>○</Text>
                    </View>
                    <Text style={[styles.option5ProtocolText, styles.option5ProtocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.option5Button}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </LinearGradient>
          </View>

          {/* OPTION 5C: Deep Navy Premium (Anti-Canva) */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 5C: Navy Premium (Anti-Canva)</Text>
            <Text style={styles.optionDescription}>Fondo navy profundo, colores ricos y sofisticados</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option5CCard]}>
              <View style={styles.option4TopSection}>
                <View style={styles.option4GreetingContainer}>
                  <View style={styles.option4HeaderRow}>
                    <LinearGradient
                      colors={['#1E40AF', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.option5Badge}>
                      <Text style={styles.option5BadgeText}>Detectado</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.option5CTitle}>
                    ¡Hola! Encontré esto por ti
                  </Text>
                </View>
                <View style={styles.option5AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.option4AvatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.option5CSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.option5CContentBox}>
                <View style={styles.option4ProtocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5CComplete]}>
                      <Text style={styles.option5CCheckmark}>✓</Text>
                    </View>
                    <Text style={styles.option5CProtocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5CComplete]}>
                      <Text style={styles.option5CCheckmark}>✓</Text>
                    </View>
                    <Text style={styles.option5CProtocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5CActive]}>
                      <Text style={styles.option5CSpinner}>○</Text>
                    </View>
                    <Text style={[styles.option5CProtocolText, styles.option5CProtocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.option5Button}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

          {/* OPTION 5D: Rich Purple Premium */}
          <View style={styles.comparisonSection}>
            <Text style={styles.optionLabel}>OPCIÓN 5D: Purple Premium</Text>
            <Text style={styles.optionDescription}>Fondo morado rico, muy premium y fintech</Text>

            <View style={[styles.glassCard, styles.alertCard, styles.option5DCard]}>
              <View style={styles.option4TopSection}>
                <View style={styles.option4GreetingContainer}>
                  <View style={styles.option4HeaderRow}>
                    <LinearGradient
                      colors={['#6D28D9', '#0891B2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.option5Badge}>
                      <Text style={styles.option5BadgeText}> Detectado</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.option5DTitle}>
                    ¡Hola! Encontré esto por ti
                  </Text>
                </View>
                <View style={styles.option5AvatarContainer}>
                  <Image
                    source={require('@/assets/images/finexa-i.png')}
                    style={styles.option4AvatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.option5DSubtitle}>
                Spotify se cobró 4 veces este mes
              </Text>

              <View style={styles.option5DContentBox}>
                <View style={styles.option4ProtocolList}>
                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5DComplete]}>
                      <Text style={styles.option5DCheckmark}>✓</Text>
                    </View>
                    <Text style={styles.option5DProtocolText}>
                      Ya revisé tus cargos
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5DComplete]}>
                      <Text style={styles.option5DCheckmark}>✓</Text>
                    </View>
                    <Text style={styles.option5DProtocolText}>
                      Tengo la documentación lista
                    </Text>
                  </View>

                  <View style={styles.protocolItem}>
                    <View style={[styles.protocolIcon, styles.option5DActive]}>
                      <Text style={styles.option5DSpinner}>○</Text>
                    </View>
                    <Text style={[styles.option5DProtocolText, styles.option5DProtocolTextActive]}>
                      ¿Quieres que lo cancele por ti?
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient
                colors={[PrismColors.primary, PrismColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.option5Button}>
                <Pressable style={styles.killSwitchPressable}>
                  <Text style={styles.killSwitchText}>Resolver juntos</Text>
                </Pressable>
              </LinearGradient>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>);
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: PrismColors.textSecondary,
  },
  comparisonSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl * 2,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    marginBottom: Spacing.md,
  },
  glassCard: {
    backgroundColor: PrismColors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
  alertCard: {
    paddingTop: Spacing.xl,
  },

  // OPTION 1: Soft Primary Focus
  option1Card: {
    backgroundColor: PrismColors.surface,
  },
  option1AvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${PrismColors.primary}14`, // 8% opacity
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  option1Badge: {
    backgroundColor: PrismColors.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  option1BadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.primary,
  },
  option1Complete: {
    backgroundColor: `${PrismColors.tertiary}14`, // 8% opacity
  },
  option1Checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  option1Active: {
    backgroundColor: PrismColors.primaryBorder,
    borderWidth: 2,
    borderColor: PrismColors.primary,
  },
  option1Spinner: {
    fontSize: 12,
    color: PrismColors.primary,
  },

  // OPTION 2: Tertiary Accent
  option2Card: {
    backgroundColor: `${PrismColors.tertiary}05`, // 2% tint
  },
  option2AvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${PrismColors.tertiary}20`, // 12% opacity
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  option2Badge: {
    backgroundColor: `${PrismColors.tertiary}1A`, // 10% opacity
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  option2BadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  option2Complete: {
    backgroundColor: `${PrismColors.tertiary}1A`, // 10% opacity
  },
  option2Checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  option2Active: {
    backgroundColor: `${PrismColors.tertiary}14`, // 8% opacity
    borderWidth: 2,
    borderColor: PrismColors.tertiary,
  },
  option2Spinner: {
    fontSize: 12,
    color: PrismColors.tertiary,
  },

  // OPTION 3: Gradient Background
  option3Card: {
    backgroundColor: PrismColors.surface,
    borderWidth: 0,
    // Will add gradient overlay via LinearGradient if needed
  },
  option3AvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PrismColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  option3Badge: {
    backgroundColor: PrismColors.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option3BadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.primary,
  },
  option3Complete: {
    backgroundColor: PrismColors.neutral,
    shadowColor: PrismColors.tertiary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option3Checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  option3Active: {
    backgroundColor: PrismColors.primaryBorder,
    borderWidth: 2,
    borderColor: PrismColors.primary,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  option3Spinner: {
    fontSize: 12,
    color: PrismColors.primary,
  },

  // OPTION 4: Large Avatar "Presenting"
  option4Card: {
    backgroundColor: PrismColors.surface,
    paddingTop: Spacing.md,
  },
  option4HeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.md,
  },
  option4Badge: {
    backgroundColor: PrismColors.primaryBorder,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  option4BadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.primary,
  },
  option4TopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  option4AvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${PrismColors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  option4AvatarImage: {
    // marginTop: 95,
    width: 100,
    height: 100,
  },
  option4GreetingContainer: {
    flex: 1,
  },
  option4Title: {
    fontSize: 22,
    fontWeight: '700',
    color: PrismColors.textPrimary,
    lineHeight: 28,
  },
  option4FullWidthSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PrismColors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
    width: '90%',
  },
  option4ContentBox: {
    backgroundColor: PrismColors.neutral,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    marginBottom: Spacing.xl,
  },
  option4ProtocolList: {
    gap: Spacing.sm,
  },
  option4ProtocolText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    lineHeight: 18,
  },
  option4ProtocolTextActive: {
    color: PrismColors.textPrimary,
    fontWeight: '600',
  },
  option4Complete: {
    backgroundColor: `${PrismColors.tertiary}14`,
  },
  option4Checkmark: {
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.tertiary,
  },
  option4Active: {
    backgroundColor: PrismColors.primaryBorder,
    borderWidth: 1.5,
    borderColor: PrismColors.primary,
  },
  option4Spinner: {
    fontSize: 11,
    color: PrismColors.primary,
  },

  // OPTION 5A: Soft Blue Card Background
  option5ACard: {
    backgroundColor: '#EBF5FF', // Soft blue tint
  },
  option5Badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  option5BadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PrismColors.surface,
  },
  option5AvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 40,
    backgroundColor: PrismColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  option5ContentBox: {
    backgroundColor: PrismColors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: PrismColors.primaryBorder,
    marginBottom: Spacing.xl,
  },
  option5Complete: {
    backgroundColor: '#10B981', // Emerald green
  },
  option5Checkmark: {
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.surface,
  },
  option5Active: {
    backgroundColor: '#F59E0B', // Amber
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  option5Spinner: {
    fontSize: 11,
    color: PrismColors.surface,
  },
  option5ProtocolText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: PrismColors.textPrimary,
    lineHeight: 18,
  },
  option5ProtocolTextActive: {
    color: PrismColors.textPrimary,
    fontWeight: '700',
  },
  option5Button: {
    borderRadius: 16,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 10,
  },

  // OPTION 5B: Gradient Card Background
  option5BCard: {
    borderWidth: 0,
  },
  option5BContentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: Spacing.xl,
  },

  // OPTION 5C: Deep Navy Premium
  option5CCard: {
    backgroundColor: '#1E293B', // Deep slate
  },
  option5CTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PrismColors.surface, // White text on dark
    lineHeight: 28,
  },
  option5CSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8', // Light gray on dark
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  option5CContentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.xl,
  },
  option5CComplete: {
    backgroundColor: '#0891B2', // Deep cyan
  },
  option5CCheckmark: {
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.surface,
  },
  option5CActive: {
    backgroundColor: PrismColors.secondary, // Rich purple
  },
  option5CSpinner: {
    fontSize: 11,
    color: PrismColors.surface,
  },
  option5CProtocolText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0', // Light text on dark
    lineHeight: 18,
  },
  option5CProtocolTextActive: {
    color: PrismColors.surface,
    fontWeight: '700',
  },

  // OPTION 5D: Rich Purple Premium
  option5DCard: {
    backgroundColor: '#7C3AED', // Rich purple (your secondary)
  },
  option5DTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PrismColors.surface,
    lineHeight: 28,
  },
  option5DSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  option5DContentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing.xl,
  },
  option5DComplete: {
    backgroundColor: '#0891B2', // Deep cyan
  },
  option5DCheckmark: {
    fontSize: 11,
    fontWeight: '700',
    color: PrismColors.surface,
  },
  option5DActive: {
    backgroundColor: PrismColors.primary, // Blue on purple
  },
  option5DSpinner: {
    fontSize: 11,
    color: PrismColors.surface,
  },
  option5DProtocolText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  option5DProtocolTextActive: {
    color: PrismColors.surface,
    fontWeight: '700',
  },

  // Shared styles
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  avatarImage: {
    width: 100,
    height: 100,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PrismColors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 30,
  },
  alertSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  protocolSection: {
    marginBottom: Spacing.xl,
  },
  protocolList: {
    gap: Spacing.md,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  protocolIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: PrismColors.textSecondary,
    lineHeight: 20,
  },
  protocolTextActive: {
    color: PrismColors.textPrimary,
    fontWeight: '600',
  },
  killSwitchButton: {
    borderRadius: 16,
    shadowColor: PrismColors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  killSwitchPressable: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  killSwitchText: {
    fontSize: 16,
    fontWeight: '800',
    color: PrismColors.surface,
    letterSpacing: -0.3,
  },
});
