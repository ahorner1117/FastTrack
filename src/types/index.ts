export type UnitSystem = 'imperial' | 'metric';

export type Appearance = 'system' | 'light' | 'dark';

export type GPSAccuracy = 'high' | 'medium' | 'low';

export interface Settings {
  unitSystem: UnitSystem;
  appearance: Appearance;
  gpsAccuracy: GPSAccuracy;
  hapticFeedback: boolean;
  autoSaveRuns: boolean;
  defaultVehicleId: string | null;
}

export interface Vehicle {
  id: string;
  name: string;
  year?: number;
  make?: string;
  model?: string;
  photoUri?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RunMilestone {
  speed: number; // m/s
  time: number; // ms
  distance: number; // meters
}

export interface Run {
  id: string;
  vehicleId: string | null;
  startTime: number;
  endTime: number;
  milestones: {
    zeroToSixty?: RunMilestone;
    zeroToHundred?: RunMilestone;
    quarterMile?: RunMilestone;
    halfMile?: RunMilestone;
  };
  maxSpeed: number; // m/s
  gpsPoints: GPSPoint[];
  createdAt: number;
}

export interface GPSPoint {
  latitude: number;
  longitude: number;
  speed: number; // m/s
  accuracy: number;
  timestamp: number;
}

export interface TimerState {
  status: 'idle' | 'ready' | 'armed' | 'running' | 'completed';
  startTime: number | null;
  currentSpeed: number; // m/s
  currentDistance: number; // meters
  elapsedTime: number; // ms
  milestones: Run['milestones'];
  maxSpeed: number; // m/s
  gpsPoints: GPSPoint[];
}
