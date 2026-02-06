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

export interface CloudVehicle {
  id: string;
  user_id: string;
  local_id: string;
  name: string;
  type: string;
  year: number;
  make: string;
  model: string;
  photo_uri: string | null;
  upgrades: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
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

// Social/Posts Types
export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  vehicle_id: string | null;
  run_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: Profile;
  run?: { zero_to_sixty_time: number | null; vehicle_name: string | null } | null;
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface CreatePostInput {
  image_url: string;
  caption?: string;
  vehicle_id?: string;
  run_id?: string;
}
