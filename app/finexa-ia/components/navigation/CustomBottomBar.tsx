import { NAVIGATION_MODULES } from '@/constants/navigationModules';
import { Fonts, PrismColors } from '@/constants/theme';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 20 }]}>
      {NAVIGATION_MODULES.map((module) => {
        const isActive = pathname === module.route || pathname.startsWith(module.route);

        return (
          <TouchableOpacity
            key={module.id}
            onPress={() => router.push(module.route as any)}
            activeOpacity={0.8}
            style={styles.tabContainer}
          >
            <View style={[styles.tabContent, isActive && styles.activeTab]}>
              <module.icon
                size={22}
                color={isActive ? '#FFFFFF' : PrismColors.textSecondary}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.activeTabText : styles.inactiveTabText
                ]}
              >
                {module.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 70, // Asegura un ancho uniforme para el fondo activo
  },
  activeTab: {
    backgroundColor: '#3E34F3', // Ajustando al azul/morado visible en el diseño
  },
  tabText: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: Fonts.sansSemibold,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansBold,
  },
  inactiveTabText: {
    color: PrismColors.textSecondary,
  },
});
