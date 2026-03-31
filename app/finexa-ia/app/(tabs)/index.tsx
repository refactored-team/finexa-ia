import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-4 pt-4">
            <ThemedText type="title">Inicio</ThemedText>
            <Text className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Punto de partida para las pantallas de Finexa.
            </Text>
          </View>
          <View className="mx-4 mt-6 rounded-3xl border border-primary-border bg-surface px-4 py-3 shadow-card">
            <Text className="font-sans-bold text-base tracking-tight text-text-primary">
              Tema y NativeWind
            </Text>
            <Text className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
              Editá esta pantalla en app/(tabs)/index.tsx
            </Text>
          </View>
          <View className="px-4 pt-8">
            <Link href="/modal">
              <Text className="font-sans-semibold text-primary">Abrir modal de ejemplo</Text>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
