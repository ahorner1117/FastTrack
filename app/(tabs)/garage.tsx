import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  Car,
  History,
  Warehouse,
  Trash2,
  X,
  CheckSquare,
  Square,
} from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VehicleCard } from '@/src/components/Garage';
import { RunCard } from '@/src/components/History';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { useHistoryStore } from '@/src/stores/historyStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { COLORS } from '@/src/utils/constants';
import type { Run } from '@/src/types';

type GarageTab = 'vehicles' | 'runs';

export default function GarageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [activeTab, setActiveTab] = useState<GarageTab>('vehicles');

  // Vehicles state
  const vehicles = useVehicleStore((state) => state.vehicles);
  const getVehicleById = useVehicleStore((state) => state.getVehicleById);

  // Runs state
  const runs = useHistoryStore((state) => state.runs);
  const deleteRuns = useHistoryStore((state) => state.deleteRuns);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  // Selection state for runs
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const getVehicleName = useCallback(
    (vehicleId: string | null) => {
      if (!vehicleId) return undefined;
      const vehicle = getVehicleById(vehicleId);
      if (!vehicle) return undefined;
      return vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    },
    [getVehicleById]
  );

  const handleAddVehicle = () => {
    router.push('/vehicles/add');
  };

  const handleVehiclePress = (id: string) => {
    router.push(`/vehicles/${id}`);
  };

  const handleRunPress = (run: Run) => {
    router.push(`/history/${run.id}`);
  };

  const toggleSelectMode = useCallback(() => {
    setIsSelecting((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectRun = useCallback(
    (id: string) => {
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
    },
    [isSelecting]
  );

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

  // Reset selection when switching tabs
  const handleTabChange = (tab: GarageTab) => {
    setActiveTab(tab);
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const allSelected = selectedIds.size === runs.length && runs.length > 0;

  // Segmented toggle component
  const renderToggle = () => (
    <View style={styles.toggleContainer}>
      <Pressable
        style={[
          styles.toggleButton,
          {
            backgroundColor:
              activeTab === 'vehicles'
                ? COLORS.accent
                : isDark
                  ? COLORS.dark.surface
                  : COLORS.light.surface,
          },
        ]}
        onPress={() => handleTabChange('vehicles')}
      >
        <Warehouse
          color={activeTab === 'vehicles' ? '#000000' : colors.text}
          size={18}
        />
        <Text
          style={[
            styles.toggleText,
            { color: activeTab === 'vehicles' ? '#000000' : colors.text },
          ]}
        >
          Vehicles
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.toggleButton,
          {
            backgroundColor:
              activeTab === 'runs'
                ? COLORS.accent
                : isDark
                  ? COLORS.dark.surface
                  : COLORS.light.surface,
          },
        ]}
        onPress={() => handleTabChange('runs')}
      >
        <History
          color={activeTab === 'runs' ? '#000000' : colors.text}
          size={18}
        />
        <Text
          style={[
            styles.toggleText,
            { color: activeTab === 'runs' ? '#000000' : colors.text },
          ]}
        >
          Runs
        </Text>
      </Pressable>
    </View>
  );

  // Vehicles empty state
  const renderVehiclesEmpty = () => (
    <View style={styles.emptyState}>
      <Car color={colors.tint} size={64} />
      <Text style={[styles.title, { color: colors.text }]}>No Vehicles</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your vehicles will appear here
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: COLORS.accent }]}
        onPress={handleAddVehicle}
        activeOpacity={0.8}
      >
        <Plus color="#000000" size={20} />
        <Text style={styles.addButtonText}>Add Vehicle</Text>
      </TouchableOpacity>
    </View>
  );

  const tertiaryColor = isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary;

  // Runs empty state
  const renderRunsEmpty = () => (
    <View style={styles.emptyState}>
      <History color={tertiaryColor} size={64} />
      <Text style={[styles.title, { color: colors.text }]}>No Runs Yet</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Complete a run to see it here
      </Text>
    </View>
  );

  // Runs toolbar
  const renderRunsToolbar = () => {
    if (runs.length === 0) return null;

    return (
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        {isSelecting ? (
          <>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={toggleSelectMode}
            >
              <X color={colors.text} size={20} />
              <Text style={[styles.toolbarButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
              {selectedIds.size} selected
            </Text>

            <View style={styles.toolbarActions}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={allSelected ? deselectAll : selectAll}
              >
                {allSelected ? (
                  <CheckSquare color={colors.text} size={20} />
                ) : (
                  <Square color={colors.text} size={20} />
                )}
                <Text style={[styles.toolbarButtonText, { color: colors.text }]}>
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
                  color={
                    selectedIds.size === 0
                      ? tertiaryColor
                      : COLORS.dark.error
                  }
                  size={20}
                />
                <Text
                  style={[
                    styles.toolbarButtonText,
                    styles.deleteButtonText,
                    selectedIds.size === 0 && {
                      color: tertiaryColor,
                    },
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={toggleSelectMode}
          >
            <CheckSquare color={colors.text} size={20} />
            <Text style={[styles.toolbarButtonText, { color: colors.text }]}>
              Select
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Vehicles list
  const renderVehiclesList = () => {
    if (vehicles.length === 0) {
      return renderVehiclesEmpty();
    }

    return (
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => handleVehiclePress(item.id)}
            isDark={isDark}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.addCard, { backgroundColor: colors.surface }]}
            onPress={handleAddVehicle}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.addIconContainer,
                { backgroundColor: COLORS.accent },
              ]}
            >
              <Plus color="#000000" size={24} />
            </View>
            <Text style={[styles.addCardText, { color: colors.text }]}>
              Add Vehicle
            </Text>
          </TouchableOpacity>
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // Runs list
  const renderRunsList = () => {
    if (runs.length === 0) {
      return renderRunsEmpty();
    }

    return (
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
            vehicleName={getVehicleName(item.vehicleId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {renderToggle()}
      </View>
      {activeTab === 'runs' && renderRunsToolbar()}
      <View style={styles.content}>
        {activeTab === 'vehicles' ? renderVehiclesList() : renderRunsList()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  listContent: {
    paddingVertical: 12,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  addIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCount: {
    fontSize: 14,
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
});
