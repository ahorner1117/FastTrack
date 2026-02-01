import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Run } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface HistoryState {
  runs: Run[];
  addRun: (run: Run) => void;
  deleteRun: (id: string) => void;
  getRunById: (id: string) => Run | undefined;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      runs: [],

      addRun: (run) =>
        set((state) => ({
          runs: [run, ...state.runs],
        })),

      deleteRun: (id) =>
        set((state) => ({
          runs: state.runs.filter((run) => run.id !== id),
        })),

      getRunById: (id) => {
        const { runs } = get();
        return runs.find((run) => run.id === id);
      },

      clearHistory: () => set({ runs: [] }),
    }),
    {
      name: STORAGE_KEYS.RUNS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
