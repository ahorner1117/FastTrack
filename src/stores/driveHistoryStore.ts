import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Drive } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface DriveHistoryState {
  drives: Drive[];
  addDrive: (drive: Drive) => void;
  deleteDrive: (id: string) => void;
  deleteDrives: (ids: string[]) => void;
  getDriveById: (id: string) => Drive | undefined;
  setDrives: (drives: Drive[]) => void;
  clearHistory: () => void;
}

export const useDriveHistoryStore = create<DriveHistoryState>()(
  persist(
    (set, get) => ({
      drives: [],

      addDrive: (drive) =>
        set((state) => ({
          drives: [drive, ...state.drives],
        })),

      deleteDrive: (id) =>
        set((state) => ({
          drives: state.drives.filter((drive) => drive.id !== id),
        })),

      deleteDrives: (ids) =>
        set((state) => ({
          drives: state.drives.filter((drive) => !ids.includes(drive.id)),
        })),

      getDriveById: (id) => {
        const { drives } = get();
        return drives.find((drive) => drive.id === id);
      },

      setDrives: (drives) => set({ drives }),

      clearHistory: () => set({ drives: [] }),
    }),
    {
      name: STORAGE_KEYS.DRIVES,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
