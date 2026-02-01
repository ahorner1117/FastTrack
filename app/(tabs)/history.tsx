import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { History } from 'lucide-react-native';

import { RunCard } from '../../src/components/History';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS } from '../../src/utils/constants';
import type { Run } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const runs = useHistoryStore((state) => state.runs);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  const handleRunPress = (run: Run) => {
    router.push(`/history/${run.id}`);
  };

  if (runs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <History color={COLORS.dark.textTertiary} size={64} />
          <Text style={styles.emptyTitle}>No Runs Yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a run to see it here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RunCard
            run={item}
            unitSystem={unitSystem}
            onPress={() => handleRunPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
});
