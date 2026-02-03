export const COLORS = {
  // Primary accent
  accent: '#00FF7F',
  accentDim: '#00CC66',

  // Dark theme
  dark: {
    background: '#000000',
    surface: '#1A1A1A',
    surfaceHighlight: '#2A2A2A',
    surfaceElevated: '#262626',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textTertiary: '#666666',
    border: '#333333',
    error: '#FF4444',
    warning: '#FFAA00',
    success: '#00FF7F',
  },

  // Light theme
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    error: '#CC0000',
    warning: '#CC8800',
    success: '#00AA55',
  },
} as const;

// Speed thresholds in m/s
export const SPEED_THRESHOLDS = {
  SIXTY_MPH: 26.8224, // 60 mph in m/s
  HUNDRED_MPH: 44.704, // 100 mph in m/s
  SIXTY_KPH: 16.6667, // 60 km/h in m/s
  HUNDRED_KPH: 27.7778, // 100 km/h in m/s
  // Speed gate for acceleration timing - must be below this to start
  MAX_START_SPEED_MPH: 1.34112, // 3 mph in m/s
  MAX_START_SPEED_KPH: 1.38889, // 5 km/h in m/s
} as const;

// Distance thresholds in meters
export const DISTANCE_THRESHOLDS = {
  QUARTER_MILE: 402.336, // 1/4 mile in meters
  HALF_MILE: 804.672, // 1/2 mile in meters
  QUARTER_KM: 250, // 250 meters
  HALF_KM: 500, // 500 meters
} as const;

// GPS accuracy thresholds in meters
export const GPS_ACCURACY_THRESHOLDS = {
  high: 5,
  medium: 10,
  low: 20,
} as const;

// Update rates
export const GPS_UPDATE_INTERVAL_MS = 100; // 10Hz
export const TIMER_UPDATE_INTERVAL_MS = 10; // 100Hz for display

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: '@fasttrack/settings',
  VEHICLES: '@fasttrack/vehicles',
  RUNS: '@fasttrack/runs',
  AUTH_SESSION: '@fasttrack/auth-session',
} as const;

// Vehicle upgrades
export const VEHICLE_UPGRADES = [
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'tune', label: 'Tune' },
  { value: 'downpipes', label: 'Downpipes' },
  { value: 'cold_air_intake', label: 'Cold Air Intake' },
  { value: 'intercooler', label: 'Intercooler' },
  { value: 'turbo_supercharger', label: 'Turbo/Supercharger' },
  { value: 'headers', label: 'Headers' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'wheels_tires', label: 'Wheels/Tires' },
  { value: 'weight_reduction', label: 'Weight Reduction' },
  { value: 'nitrous', label: 'Nitrous' },
  { value: 'fuel_system', label: 'Fuel System' },
] as const;
