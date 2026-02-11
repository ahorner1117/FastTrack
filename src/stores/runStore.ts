import { create } from 'zustand';
import type { TimerState, GPSPoint, RunMilestone, AccelMilestones } from '../types';

// Maximum GPS points to store (at 10Hz, 6000 = 10 minutes of data)
// This prevents memory issues on long runs
const MAX_GPS_POINTS = 6000;

interface RunStoreState extends TimerState {
  accelMilestones: AccelMilestones;
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
  setSpeedMilestone: (mph: number, milestone: RunMilestone) => void;
  setAccelMilestone: (key: keyof AccelMilestones, milestone: RunMilestone) => void;
  setAccelSpeedMilestone: (mph: number, milestone: RunMilestone) => void;
  arm: () => void;
  start: (gpsTimestamp: number) => void;
  stop: () => void;
  reset: () => void;
}

const initialState: TimerState & { accelMilestones: AccelMilestones } = {
  status: 'idle',
  startTime: null,
  currentSpeed: 0,
  currentDistance: 0,
  elapsedTime: 0,
  milestones: {},
  accelMilestones: {},
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
    set((state) => {
      const newPoints = [...state.gpsPoints, point];
      // Keep only the most recent points to prevent memory issues
      if (newPoints.length > MAX_GPS_POINTS) {
        return { gpsPoints: newPoints.slice(-MAX_GPS_POINTS) };
      }
      return { gpsPoints: newPoints };
    }),

  setMilestone: (key, milestone) =>
    set((state) => ({
      milestones: {
        ...state.milestones,
        [key]: milestone,
      },
    })),

  setSpeedMilestone: (mph, milestone) =>
    set((state) => ({
      milestones: {
        ...state.milestones,
        speedMilestones: {
          ...state.milestones.speedMilestones,
          [mph]: milestone,
        },
      },
    })),

  setAccelMilestone: (key, milestone) =>
    set((state) => ({
      accelMilestones: {
        ...state.accelMilestones,
        [key]: milestone,
      },
    })),

  setAccelSpeedMilestone: (mph, milestone) =>
    set((state) => ({
      accelMilestones: {
        ...state.accelMilestones,
        speedMilestones: {
          ...state.accelMilestones.speedMilestones,
          [mph]: milestone,
        },
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
      accelMilestones: {},
      maxSpeed: 0,
      gpsPoints: [],
    }),

  start: (gpsTimestamp) =>
    set({
      status: 'running',
      startTime: gpsTimestamp,
    }),

  stop: () =>
    set({
      status: 'completed',
    }),

  reset: () => set(initialState),
}));
