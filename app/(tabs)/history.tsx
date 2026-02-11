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
import { History, Trash2, X, CheckSquare, Square, Zap, Route } from 'lucide-react-native';

import { RunCard, DriveCard } from '../../src/components/History';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useDriveHistoryStore } from '../../src/stores/driveHistoryStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVehicleStore } from '../../src/stores/vehicleStore';
import { COLORS } from '../../src/utils/constants';
import type { Run, Drive } from '../../src/types';

type HistoryTab = 'runs' | 'drives';

export default function HistoryScreen() {
  const router = useRouter();
  const runs = useHistoryStore((state) => state.runs);
  const deleteRuns = useHistoryStore((state) => state.deleteRuns);
  const drives = useDriveHistoryStore((state) => state.drives);
  const deleteDrives = useDriveHistoryStore((state) => state.deleteDrives);
  const unitSystem = useSettingsStore((state) => state.unitSystem);
  const getVehicleById = useVehicleStore((state) => state.getVehicleById);

  const [activeTab, setActiveTab] = useState<HistoryTab>('runs');

  const getVehicleName = useCallback((vehicleId: string | null) => {
    if (!vehicleId) return undefined;
    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) return undefined;
    return vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }, [getVehicleById]);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleRunPress = (run: Run) => {
    router.push(`/history/${run.id}`);
  };

  const handleDrivePress = (drive: Drive) => {
    router.push(`/history/drive/${drive.id}`);
  };

  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelectMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
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

  const currentItems = activeTab === 'runs' ? runs : drives;

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(currentItems.map((item) => item.id)));
  }, [currentItems]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;

    const itemType = activeTab === 'runs' ? 'run' : 'drive';
    const itemTypePlural = activeTab === 'runs' ? 'runs' : 'drives';

    Alert.alert(
      `Delete ${selectedIds.size > 1 ? itemTypePlural.charAt(0).toUpperCase() + itemTypePlural.slice(1) : itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
      `Are you sure you want to delete ${selectedIds.size} ${selectedIds.size > 1 ? itemTypePlural : itemType}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const ids = Array.from(selectedIds);
            if (activeTab === 'runs') {
              deleteRuns(ids);
            } else {
              deleteDrives(ids);
            }
            setSelectedIds(new Set());
            setIsSelecting(false);
          },
        },
      ]
    );
  }, [selectedIds, activeTab, deleteRuns, deleteDrives]);

  const allSelected = selectedIds.size === currentItems.length && currentItems.length > 0;

  const renderSegmentedControl = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[styles.segment, activeTab === 'runs' && styles.segmentActive]}
        onPress={() => handleTabChange('runs')}
        activeOpacity={0.7}
      >
        <Zap
          size={16}
          color={activeTab === 'runs' ? '#000000' : COLORS.dark.textSecondary}
        />
        <Text
          style={[
            styles.segmentText,
            activeTab === 'runs' && styles.segmentTextActive,
          ]}
        >
          Runs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segment, activeTab === 'drives' && styles.segmentActive]}
        onPress={() => handleTabChange('drives')}
        activeOpacity={0.7}
      >
        <Route
          size={16}
          color={activeTab === 'drives' ? '#000000' : COLORS.dark.textSecondary}
        />
        <Text
          style={[
            styles.segmentText,
            activeTab === 'drives' && styles.segmentTextActive,
          ]}
        >
          Drives
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (currentItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {renderSegmentedControl()}
        <View style={styles.emptyContainer}>
          <History color={COLORS.dark.textTertiary} size={64} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'runs' ? 'No Runs Yet' : 'No Drives Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'runs'
              ? 'Complete a run to see it here'
              : 'Complete a drive to see it here'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {renderSegmentedControl()}

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

      {activeTab === 'runs' ? (
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
              onToggleSelect={() => toggleSelectItem(item.id)}
              vehicleName={getVehicleName(item.vehicleId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={drives}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DriveCard
              drive={item}
              unitSystem={unitSystem}
              onPress={() => handleDrivePress(item)}
              isSelecting={isSelecting}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelectItem(item.id)}
              vehicleName={getVehicleName(item.vehicleId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark.textSecondary,
  },
  segmentTextActive: {
    color: '#000000',
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
