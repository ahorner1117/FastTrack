import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Run } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { deleteRunsFromCloud } from '../services/syncService';

// Extend Run type with sync tracking
export interface StoredRun extends Run {
  syncedAt?: number;
}

interface HistoryState {
  runs: StoredRun[];
  addRun: (run: Run) => void;
  deleteRun: (id: string) => void;
  deleteRuns: (ids: string[]) => void;
  getRunById: (id: string) => StoredRun | undefined;
  markRunSynced: (id: string) => void;
  setRuns: (runs: StoredRun[]) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      runs: [],

      addRun: (run) =>
        set((state) => ({
          runs: [{ ...run, syncedAt: undefined }, ...state.runs],
        })),

      deleteRun: (id) => {
        set((state) => ({
          runs: state.runs.filter((run) => run.id !== id),
        }));
        // Delete from cloud (fire-and-forget)
        deleteRunsFromCloud([id]).catch((error) => {
          console.error('Failed to delete run from cloud:', error);
        });
      },

      deleteRuns: (ids) => {
        set((state) => ({
          runs: state.runs.filter((run) => !ids.includes(run.id)),
        }));
        // Delete from cloud (fire-and-forget)
        deleteRunsFromCloud(ids).catch((error) => {
          console.error('Failed to delete runs from cloud:', error);
        });
      },

      getRunById: (id) => {
        const { runs } = get();
        return runs.find((run) => run.id === id);
      },

      markRunSynced: (id) =>
        set((state) => ({
          runs: state.runs.map((run) =>
            run.id === id ? { ...run, syncedAt: Date.now() } : run
          ),
        })),

      setRuns: (runs) => set({ runs }),

      clearHistory: () => set({ runs: [] }),
    }),
    {
      name: STORAGE_KEYS.RUNS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
