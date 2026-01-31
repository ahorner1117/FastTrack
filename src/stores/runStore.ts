import { create } from 'zustand';
import type { TimerState, GPSPoint, RunMilestone } from '../types';

interface RunStoreState extends TimerState {
  // Actions
  setStatus: (status: TimerState['status']) => void;
  setSpeed: (speed: number) => void;
  setDistance: (distance: number) => void;
  setElapsedTime: (time: number) => void;
  setMaxSpeed: (speed: number) => void;
  addGpsPoint: (point: GPSPoint) => void;
  setMilestone: (
    key: keyof TimerState['milestones'],
    milestone: RunMilestone
  ) => void;
  arm: () => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const initialState: TimerState = {
  status: 'idle',
  startTime: null,
  currentSpeed: 0,
  currentDistance: 0,
  elapsedTime: 0,
  milestones: {},
  maxSpeed: 0,
  gpsPoints: [],
};

export const useRunStore = create<RunStoreState>()((set, get) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setSpeed: (currentSpeed) => {
    const { maxSpeed } = get();
    set({
      currentSpeed,
      maxSpeed: Math.max(maxSpeed, currentSpeed),
    });
  },

  setDistance: (currentDistance) => set({ currentDistance }),

  setElapsedTime: (elapsedTime) => set({ elapsedTime }),

  setMaxSpeed: (maxSpeed) => set({ maxSpeed }),

  addGpsPoint: (point) =>
    set((state) => ({
      gpsPoints: [...state.gpsPoints, point],
    })),

  setMilestone: (key, milestone) =>
    set((state) => ({
      milestones: {
        ...state.milestones,
        [key]: milestone,
      },
    })),

  arm: () =>
    set({
      status: 'armed',
      startTime: null,
      currentSpeed: 0,
      currentDistance: 0,
      elapsedTime: 0,
      milestones: {},
      maxSpeed: 0,
      gpsPoints: [],
    }),

  start: () =>
    set({
      status: 'running',
      startTime: Date.now(),
    }),

  stop: () =>
    set({
      status: 'completed',
    }),

  reset: () => set(initialState),
}));
