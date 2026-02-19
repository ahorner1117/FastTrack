import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Drive } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

// Extend Drive type with sync tracking
export interface StoredDrive extends Drive {
  syncedAt?: number;
}

interface DriveHistoryState {
  drives: StoredDrive[];
  addDrive: (drive: Drive) => void;
  deleteDrive: (id: string) => void;
  deleteDrives: (ids: string[]) => void;
  getDriveById: (id: string) => StoredDrive | undefined;
  markDriveSynced: (id: string) => void;
  setDrives: (drives: StoredDrive[]) => void;
  clearHistory: () => void;
}

export const useDriveHistoryStore = create<DriveHistoryState>()(
  persist(
    (set, get) => ({
      drives: [],

      addDrive: (drive) =>
        set((state) => ({
          drives: [{ ...drive, syncedAt: undefined }, ...state.drives],
        })),

      deleteDrive: (id) => {
        set((state) => ({
          drives: state.drives.filter((drive) => drive.id !== id),
        }));
        // Delete from cloud (fire-and-forget) — lazy require to break cycle
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { deleteDrivesFromCloud } = require('../services/syncService');
        deleteDrivesFromCloud([id]).catch((error: any) => {
          console.error('Failed to delete drive from cloud:', error);
        });
      },

      deleteDrives: (ids) => {
        set((state) => ({
          drives: state.drives.filter((drive) => !ids.includes(drive.id)),
        }));
        // Delete from cloud (fire-and-forget) — lazy require to break cycle
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { deleteDrivesFromCloud } = require('../services/syncService');
        deleteDrivesFromCloud(ids).catch((error: any) => {
          console.error('Failed to delete drives from cloud:', error);
        });
      },

      getDriveById: (id) => {
        const { drives } = get();
        return drives.find((drive) => drive.id === id);
      },

      markDriveSynced: (id) =>
        set((state) => ({
          drives: state.drives.map((drive) =>
            drive.id === id ? { ...drive, syncedAt: Date.now() } : drive
          ),
        })),

      setDrives: (drives) => set({ drives }),

      clearHistory: () => set({ drives: [] }),
    }),
    {
      name: STORAGE_KEYS.DRIVES,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
