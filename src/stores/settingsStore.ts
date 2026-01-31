import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings, UnitSystem, Appearance, GPSAccuracy } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface SettingsState extends Settings {
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setAppearance: (appearance: Appearance) => void;
  setGpsAccuracy: (gpsAccuracy: GPSAccuracy) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setAutoSaveRuns: (enabled: boolean) => void;
  setDefaultVehicleId: (vehicleId: string | null) => void;
  resetToDefaults: () => void;
}

const defaultSettings: Settings = {
  unitSystem: 'imperial',
  appearance: 'system',
  gpsAccuracy: 'high',
  hapticFeedback: true,
  autoSaveRuns: true,
  defaultVehicleId: null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setUnitSystem: (unitSystem) => set({ unitSystem }),

      setAppearance: (appearance) => set({ appearance }),

      setGpsAccuracy: (gpsAccuracy) => set({ gpsAccuracy }),

      setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),

      setAutoSaveRuns: (autoSaveRuns) => set({ autoSaveRuns }),

      setDefaultVehicleId: (defaultVehicleId) => set({ defaultVehicleId }),

      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
