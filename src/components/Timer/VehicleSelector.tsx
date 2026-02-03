import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Car, Bike, ChevronDown, Check, CircleOff } from 'lucide-react-native';
import { useVehicleStore } from '../../stores/vehicleStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { COLORS } from '../../utils/constants';
import type { Vehicle, VehicleType } from '../../types';

interface VehicleSelectorProps {
  disabled?: boolean;
}

function VehicleIcon({ type, color, size }: { type: VehicleType; color: string; size: number }) {
  switch (type) {
    case 'motorcycle':
      return <Bike color={color} size={size} />;
    case 'car':
    default:
      return <Car color={color} size={size} />;
  }
}

export function VehicleSelector({ disabled }: VehicleSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const vehicles = useVehicleStore((state) => state.vehicles);
  const getVehicleById = useVehicleStore((state) => state.getVehicleById);
  const defaultVehicleId = useSettingsStore((state) => state.defaultVehicleId);
  const setDefaultVehicleId = useSettingsStore((state) => state.setDefaultVehicleId);

  // Clear selection if vehicle was deleted
  useEffect(() => {
    if (defaultVehicleId && !getVehicleById(defaultVehicleId)) {
      setDefaultVehicleId(null);
    }
  }, [defaultVehicleId, getVehicleById, setDefaultVehicleId]);

  const selectedVehicle = defaultVehicleId ? getVehicleById(defaultVehicleId) : null;

  const handleSelectVehicle = (vehicleId: string | null) => {
    setDefaultVehicleId(vehicleId);
    setModalVisible(false);
  };

  const formatVehicleName = (vehicle: Vehicle) => {
    if (vehicle.name) return vehicle.name;
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {selectedVehicle ? (
          <>
            <VehicleIcon
              type={selectedVehicle.type}
              color={COLORS.accent}
              size={18}
            />
            <Text style={styles.selectorText} numberOfLines={1}>
              {formatVehicleName(selectedVehicle)}
            </Text>
          </>
        ) : (
          <>
            <CircleOff color={COLORS.dark.textTertiary} size={18} />
            <Text style={styles.selectorTextPlaceholder}>No Vehicle</Text>
          </>
        )}
        <ChevronDown color={COLORS.dark.textTertiary} size={18} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Vehicle</Text>

            <FlatList
              data={[null, ...vehicles]}
              keyExtractor={(item) => item?.id ?? 'no-vehicle'}
              renderItem={({ item }) => {
                const isSelected = item?.id === defaultVehicleId || (!item && !defaultVehicleId);
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelectVehicle(item?.id ?? null)}
                    activeOpacity={0.7}
                  >
                    {item ? (
                      <VehicleIcon
                        type={item.type}
                        color={isSelected ? COLORS.accent : COLORS.dark.textSecondary}
                        size={20}
                      />
                    ) : (
                      <CircleOff
                        color={isSelected ? COLORS.accent : COLORS.dark.textTertiary}
                        size={20}
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {item ? formatVehicleName(item) : 'No Vehicle'}
                    </Text>
                    {isSelected && <Check color={COLORS.accent} size={20} />}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark.text,
  },
  selectorTextPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark.textTertiary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '70%',
    backgroundColor: COLORS.dark.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: COLORS.dark.surfaceHighlight,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.accent,
  },
});
