import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ExploreScreen() {
  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-4 pt-4">
            <ThemedText type="title">Explorar</ThemedText>
            <Text className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Segunda pestaña — reemplazá este contenido por tu pantalla.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
