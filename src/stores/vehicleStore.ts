import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Vehicle } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface VehicleState {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>) => void;
  deleteVehicle: (id: string) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],

      addVehicle: (vehicle) =>
        set((state) => ({
          vehicles: [vehicle, ...state.vehicles],
        })),

      updateVehicle: (id, updates) =>
        set((state) => ({
          vehicles: state.vehicles.map((vehicle) =>
            vehicle.id === id
              ? { ...vehicle, ...updates, updatedAt: Date.now() }
              : vehicle
          ),
        })),

      deleteVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id),
        })),

      getVehicleById: (id) => {
        const { vehicles } = get();
        return vehicles.find((vehicle) => vehicle.id === id);
      },
    }),
    {
      name: STORAGE_KEYS.VEHICLES,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
