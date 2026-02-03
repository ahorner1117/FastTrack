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
  launchDetectionThresholdG: number;
  launchDetectionSampleCount: number;
}

export interface LaunchDetectionConfig {
  thresholdG: number;
  sampleCount: number;
}

export type VehicleUpgrade =
  | 'exhaust'
  | 'tune'
  | 'downpipes'
  | 'cold_air_intake'
  | 'intercooler'
  | 'turbo_supercharger'
  | 'headers'
  | 'suspension'
  | 'wheels_tires'
  | 'weight_reduction'
  | 'nitrous'
  | 'fuel_system';

export type VehicleType = 'car' | 'motorcycle' | 'other';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  year: number;
  make: string;
  model: string;
  photoUri?: string;
  upgrades: VehicleUpgrade[];
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
  launchDetectionConfig?: LaunchDetectionConfig;
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

export type TimerMode = 'acceleration' | 'drive';

export interface Drive {
  id: string;
  vehicleId: string | null;
  startTime: number;
  endTime: number;
  distance: number; // meters
  maxSpeed: number; // m/s
  avgSpeed: number; // m/s
  gpsPoints: GPSPoint[];
  createdAt: number;
}

// Auth & Social Types

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  phone_hash: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin: boolean;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  // Joined profile data (when fetching)
  friend_profile?: Profile;
  user_profile?: Profile;
}

export interface CloudRun {
  id: string;
  user_id: string;
  local_id: string;
  vehicle_name: string | null;
  zero_to_sixty_time: number | null;
  zero_to_hundred_time: number | null;
  quarter_mile_time: number | null;
  half_mile_time: number | null;
  max_speed: number;
  created_at: string;
}

export type LeaderboardCategory =
  | 'zero_to_sixty'
  | 'zero_to_hundred'
  | 'quarter_mile'
  | 'half_mile';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  time: number;
  vehicle_name: string | null;
  is_friend: boolean;
}
