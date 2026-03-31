import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Spacing, TextStyles } from '@/constants/uiStyles';

export default function ExploreScreen() {
  return (
    <ThemedView style={Layout.flex1}>
      <SafeAreaView style={Layout.flex1} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <ThemedText type="title">Explorar</ThemedText>
            <Text style={[TextStyles.tabCardBody, styles.lead]}>
              Segunda pestaña — reemplazá este contenido por tu pantalla.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  lead: {
    marginTop: Spacing.sm,
  },
});
