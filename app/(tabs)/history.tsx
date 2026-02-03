import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { History, Trash2, X, CheckSquare, Square } from 'lucide-react-native';

import { RunCard } from '../../src/components/History';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS } from '../../src/utils/constants';
import type { Run } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const runs = useHistoryStore((state) => state.runs);
  const deleteRuns = useHistoryStore((state) => state.deleteRuns);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleRunPress = (run: Run) => {
    router.push(`/history/${run.id}`);
  };

  const toggleSelectMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectRun = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (!isSelecting) {
      setIsSelecting(true);
    }
  }, [isSelecting]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(runs.map((r) => r.id)));
  }, [runs]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Delete Runs',
      `Are you sure you want to delete ${selectedIds.size} run${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRuns(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelecting(false);
          },
        },
      ]
    );
  }, [selectedIds, deleteRuns]);

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

  const allSelected = selectedIds.size === runs.length && runs.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Selection Toolbar */}
      <View style={styles.toolbar}>
        {isSelecting ? (
          <>
            <TouchableOpacity style={styles.toolbarButton} onPress={toggleSelectMode}>
              <X color={COLORS.dark.text} size={20} />
              <Text style={styles.toolbarButtonText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.selectedCount}>
              {selectedIds.size} selected
            </Text>

            <View style={styles.toolbarActions}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={allSelected ? deselectAll : selectAll}
              >
                {allSelected ? (
                  <CheckSquare color={COLORS.dark.text} size={20} />
                ) : (
                  <Square color={COLORS.dark.text} size={20} />
                )}
                <Text style={styles.toolbarButtonText}>
                  {allSelected ? 'None' : 'All'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toolbarButton,
                  styles.deleteButton,
                  selectedIds.size === 0 && styles.deleteButtonDisabled,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                <Trash2
                  color={selectedIds.size === 0 ? COLORS.dark.textTertiary : COLORS.dark.error}
                  size={20}
                />
                <Text
                  style={[
                    styles.toolbarButtonText,
                    styles.deleteButtonText,
                    selectedIds.size === 0 && styles.deleteButtonTextDisabled,
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.toolbarButton} onPress={toggleSelectMode}>
            <CheckSquare color={COLORS.dark.text} size={20} />
            <Text style={styles.toolbarButtonText}>Select</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RunCard
            run={item}
            unitSystem={unitSystem}
            onPress={() => handleRunPress(item)}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelectRun(item.id)}
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark.text,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCount: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    color: COLORS.dark.error,
  },
  deleteButtonTextDisabled: {
    color: COLORS.dark.textTertiary,
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
