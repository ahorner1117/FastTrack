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

// Vehicle types
export const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'other', label: 'Other (ATV, Dirtbike, etc.)' },
] as const;

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

  // Engine breathing & power delivery
  { value: 'throttle_body', label: 'Throttle Body' },
  { value: 'intake_manifold', label: 'Intake Manifold' },
  { value: 'ported_polished_heads', label: 'Ported/Polished Heads' },
  { value: 'cams_camshafts', label: 'Cams/Camshafts' },
  { value: 'valvetrain', label: 'Valvetrain' },
  { value: 'blow_off_valve', label: 'Blow Off Valve' },
  { value: 'wastegate', label: 'Wastegate' },
  { value: 'boost_control', label: 'Boost Control' },
  { value: 'ecu_tune', label: 'ECU Tune' },
  { value: 'tcu_trans_tune', label: 'TCU/Trans Tune' },
  { value: 'meth_injection', label: 'Meth Injection' },
  { value: 'catch_can', label: 'Catch Can' },

  // Fuel & ignition
  { value: 'injectors', label: 'Injectors' },
  { value: 'fuel_pump', label: 'Fuel Pump' },
  { value: 'fuel_pressure_regulator', label: 'Fuel Pressure Regulator' },
  { value: 'fuel_rails_lines', label: 'Fuel Rails/Lines' },
  { value: 'flex_fuel_kit', label: 'Flex Fuel Kit' },
  { value: 'spark_plugs', label: 'Spark Plugs' },
  { value: 'ignition_coils', label: 'Ignition Coils' },

  // Cooling & reliability
  { value: 'radiator', label: 'Radiator' },
  { value: 'oil_cooler', label: 'Oil Cooler' },
  { value: 'power_steering_cooler', label: 'Power Steering Cooler' },
  { value: 'coolant_hoses', label: 'Coolant Hoses' },
  { value: 'oil_pan_baffle', label: 'Oil Pan Baffle' },
  { value: 'thermostat', label: 'Thermostat' },

  // Drivetrain & transmission
  { value: 'clutch', label: 'Clutch' },
  { value: 'flywheel', label: 'Flywheel' },
  { value: 'limited_slip_diff', label: 'Limited Slip Diff' },
  { value: 'final_drive_gears', label: 'Final Drive Gears' },
  { value: 'axles_halfshafts', label: 'Axles/Halfshafts' },
  { value: 'short_shifter', label: 'Short Shifter' },
  { value: 'shift_bushings', label: 'Shift Bushings' },
  { value: 'torque_converter', label: 'Torque Converter' },

  // Suspension & chassis
  { value: 'coilovers', label: 'Coilovers' },
  { value: 'springs_shocks', label: 'Springs/Shocks' },
  { value: 'sway_bars', label: 'Sway Bars' },
  { value: 'strut_brace', label: 'Strut Brace' },
  { value: 'control_arms', label: 'Control Arms' },
  { value: 'bushings', label: 'Bushings' },
  { value: 'camber_kit', label: 'Camber Kit' },
  { value: 'subframe_bracing', label: 'Subframe Bracing' },

  // Wheels, tires & brakes
  { value: 'big_brake_kit', label: 'Big Brake Kit' },
  { value: 'brake_pads', label: 'Brake Pads' },
  { value: 'brake_lines', label: 'Brake Lines' },
  { value: 'brake_fluid', label: 'Brake Fluid' },
  { value: 'lightweight_wheels', label: 'Lightweight Wheels' },
  { value: 'drag_radials', label: 'Drag Radials' },
  { value: 'stud_conversion', label: 'Stud Conversion' },

  // Aero & exterior
  { value: 'front_splitter', label: 'Front Splitter' },
  { value: 'rear_diffuser', label: 'Rear Diffuser' },
  { value: 'rear_wing_spoiler', label: 'Rear Wing/Spoiler' },
  { value: 'side_skirts', label: 'Side Skirts' },
  { value: 'hood_vents', label: 'Hood Vents' },
  { value: 'widebody_kit', label: 'Widebody Kit' },

  // Weight & interior
  { value: 'race_seats', label: 'Race Seats' },
  { value: 'harnesses', label: 'Harnesses' },
  { value: 'roll_bar_cage', label: 'Roll Bar/Cage' },
  { value: 'rear_seat_delete', label: 'Rear Seat Delete' },
  { value: 'sound_deadening_delete', label: 'Sound Deadening Delete' },

  // Electronics & data
  { value: 'gauges', label: 'Gauges' },
  { value: 'data_logger', label: 'Data Logger' },
  { value: 'shift_light', label: 'Shift Light' },
  { value: 'launch_control', label: 'Launch Control' },
  { value: 'traction_control_module', label: 'Traction Control Module' }
] as const;


export const CAR_VEHICLE_MAKES = [
  {
    "MakeId": 440,
    "MakeName": "ASTON MARTIN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 441,
    "MakeName": "TESLA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 442,
    "MakeName": "JAGUAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 443,
    "MakeName": "MASERATI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 445,
    "MakeName": "ROLLS-ROYCE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 448,
    "MakeName": "TOYOTA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 449,
    "MakeName": "MERCEDES-BENZ",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 452,
    "MakeName": "BMW",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 454,
    "MakeName": "BUGATTI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 456,
    "MakeName": "MINI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 460,
    "MakeName": "FORD",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 464,
    "MakeName": "LINCOLN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 465,
    "MakeName": "MERCURY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 466,
    "MakeName": "LOTUS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 467,
    "MakeName": "CHEVROLET",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 468,
    "MakeName": "BUICK",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 469,
    "MakeName": "CADILLAC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 470,
    "MakeName": "HOLDEN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 471,
    "MakeName": "OPEL",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 472,
    "MakeName": "GMC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 473,
    "MakeName": "MAZDA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 474,
    "MakeName": "HONDA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 475,
    "MakeName": "ACURA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 476,
    "MakeName": "DODGE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 477,
    "MakeName": "CHRYSLER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 478,
    "MakeName": "NISSAN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 480,
    "MakeName": "INFINITI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 481,
    "MakeName": "MITSUBISHI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 482,
    "MakeName": "VOLKSWAGEN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 485,
    "MakeName": "VOLVO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 492,
    "MakeName": "FIAT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 493,
    "MakeName": "ALFA ROMEO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 497,
    "MakeName": "LANCIA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 498,
    "MakeName": "HYUNDAI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 499,
    "MakeName": "KIA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 502,
    "MakeName": "LAMBORGHINI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 504,
    "MakeName": "SMART",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 509,
    "MakeName": "SUZUKI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 515,
    "MakeName": "LEXUS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 523,
    "MakeName": "SUBARU",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 533,
    "MakeName": "MAYBACH",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 536,
    "MakeName": "PONTIAC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 542,
    "MakeName": "ISUZU",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 565,
    "MakeName": "TRIUMPH",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 572,
    "MakeName": "SAAB",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 582,
    "MakeName": "AUDI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 583,
    "MakeName": "BENTLEY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 584,
    "MakeName": "PORSCHE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 603,
    "MakeName": "FERRARI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 606,
    "MakeName": "AM GENERAL",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 629,
    "MakeName": "CREATIVE COACHWORKS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 771,
    "MakeName": "AC PROPULSION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 847,
    "MakeName": "DAIHATSU",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 972,
    "MakeName": "FALCON",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 986,
    "MakeName": "EV INNOVATIONS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 992,
    "MakeName": "FAW JIAXING HAPPY MESSENGER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1056,
    "MakeName": "SATURN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1077,
    "MakeName": "DAEWOO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1124,
    "MakeName": "AMERICAN MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1142,
    "MakeName": "FORMULA 1 STREET COM",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1146,
    "MakeName": "GEO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1151,
    "MakeName": "FORTUNESPORT VES",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1288,
    "MakeName": "AAS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1292,
    "MakeName": "EQUUS AUTOMOTIVE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1393,
    "MakeName": "ELECTRIC MOBILE CARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1498,
    "MakeName": "AVERA MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1683,
    "MakeName": "BAKKURA MOBILITY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1755,
    "MakeName": "TH!NK",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1777,
    "MakeName": "CODA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1869,
    "MakeName": "CONTEMPORARY CLASSIC CARS (CCC)",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1896,
    "MakeName": "KOENIGSEGG",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 1991,
    "MakeName": "BYD",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2018,
    "MakeName": "KANDI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2049,
    "MakeName": "KEPLER MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2131,
    "MakeName": "MAKING YOU MOBILE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2236,
    "MakeName": "MCLAREN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2376,
    "MakeName": "MYCAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2408,
    "MakeName": "EAGLE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2409,
    "MakeName": "PLYMOUTH",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2665,
    "MakeName": "NJD AUTOMOTIVE LLC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 2745,
    "MakeName": "PHOENIX MOTORCARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3176,
    "MakeName": "ROCKET SLED MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3440,
    "MakeName": "VISION INDUSTRIES",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3540,
    "MakeName": "WARHAWK PERFORMANCE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3583,
    "MakeName": "UKEYCHEYMA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3706,
    "MakeName": "TOTAL ELECTRIC VEHICLES",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 3766,
    "MakeName": "SPYKER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4162,
    "MakeName": "OLDSMOBILE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4220,
    "MakeName": "PANOZ",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4355,
    "MakeName": "SALEEN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4410,
    "MakeName": "SOLECTRIA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4451,
    "MakeName": "YESTER YEAR AUTO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4596,
    "MakeName": "BXR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4634,
    "MakeName": "ENGINE CONNECTION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4644,
    "MakeName": "BLUECAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4764,
    "MakeName": "MOSLER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4767,
    "MakeName": "PAGANI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 4859,
    "MakeName": "REVOLOGY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5015,
    "MakeName": "EMA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5042,
    "MakeName": "COSTIN SPORTS CAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5083,
    "MakeName": "GENESIS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5122,
    "MakeName": "KARMA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5208,
    "MakeName": "MATRIX MOTOR COMPANY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5367,
    "MakeName": "ARMBRUSTER STAGEWAY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5381,
    "MakeName": "LUMEN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5464,
    "MakeName": "ASUNA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5468,
    "MakeName": "MERKUR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5552,
    "MakeName": "AVANTI",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5553,
    "MakeName": "YUGO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5554,
    "MakeName": "PEUGEOT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5555,
    "MakeName": "STERLING MOTOR CAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5557,
    "MakeName": "CONSULIER GTP",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5657,
    "MakeName": "DATSUN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5661,
    "MakeName": "PININFARINA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5760,
    "MakeName": "VINTAGE AUTO",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5767,
    "MakeName": "LONDONCOACH INC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5848,
    "MakeName": "MGS GRAND SPORT (MARDIKIAN)",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 5938,
    "MakeName": "PANTHER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6018,
    "MakeName": "DAYTONA COACH BUILDERS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6069,
    "MakeName": "UCC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6263,
    "MakeName": "RS SPIDER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6264,
    "MakeName": "GRUPPE B",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6265,
    "MakeName": "RALLY SPORT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6313,
    "MakeName": "RENAISSANCE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6364,
    "MakeName": "JAC 427",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6408,
    "MakeName": "HUNTER DESIGN GROUP, LLC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6473,
    "MakeName": "BLACKWATER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6663,
    "MakeName": "GULLWING INTERNATIONAL MOTORS, LTD.",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6759,
    "MakeName": "AMERITECH CORPORATION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6792,
    "MakeName": "STANFORD CUSTOMS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6880,
    "MakeName": "CLASSIC ROADSTERS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 6986,
    "MakeName": "HERITAGE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7099,
    "MakeName": "COBRA CARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7207,
    "MakeName": "C-R CHEETAH RACE CARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7225,
    "MakeName": "PAS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7425,
    "MakeName": "BUG MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7477,
    "MakeName": "EXCALIBUR AUTOMOBILE CORPORATION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7765,
    "MakeName": "IVES MOTORS CORPORATION (IMC)",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 7836,
    "MakeName": "AUTODELTA USA INC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 8395,
    "MakeName": "AUTOCAR LTD",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 8549,
    "MakeName": "MOKE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 8605,
    "MakeName": "BBC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 8785,
    "MakeName": "PHOENIX SPORTS CARS, INC.",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9250,
    "MakeName": "VECTOR AEROMOTIVE CORPORATION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9326,
    "MakeName": "CARBODIES",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9364,
    "MakeName": "CREATIVE COACHWORKS INC.",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9376,
    "MakeName": "WESTFALL MOTORS CORP.",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9401,
    "MakeName": "CLENET",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9448,
    "MakeName": "ELECTRIC CAR COMPANY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9458,
    "MakeName": "CX AUTOMOTIVE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9533,
    "MakeName": "LA EXOTICS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9572,
    "MakeName": "CLASSIC SPORTS CARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9720,
    "MakeName": "SF MOTORS INC.",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 9759,
    "MakeName": "SCUDERIA CAMERON GLICKENHAUS (SCG)",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10029,
    "MakeName": "VINTAGE CRUISER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10030,
    "MakeName": "VINTAGE MICROBUS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10031,
    "MakeName": "VINTAGE ROVER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10047,
    "MakeName": "LITE CAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10224,
    "MakeName": "POLESTAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10256,
    "MakeName": "CZINGER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10393,
    "MakeName": "GLICKENHAUS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10623,
    "MakeName": "DONGFENG",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10647,
    "MakeName": "CRUISE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 10919,
    "MakeName": "LUCID",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11076,
    "MakeName": "CALMOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11346,
    "MakeName": "AUTOMOBILI PININFARINA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11792,
    "MakeName": "ALLARD MOTOR WORKS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11832,
    "MakeName": "SHELBY",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11856,
    "MakeName": "FISKER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11921,
    "MakeName": "RIMAC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 11938,
    "MakeName": "ZOOX",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12074,
    "MakeName": "ECOCAR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12400,
    "MakeName": "SUPERCAR SYSTEM",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12550,
    "MakeName": "RUF",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12706,
    "MakeName": "KINDIG",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12771,
    "MakeName": "SSC NORTH AMERICA",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12783,
    "MakeName": "BALLISTIC",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12894,
    "MakeName": "MEYERS MANX",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12948,
    "MakeName": "1955 CUSTOM BELAIR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12980,
    "MakeName": "ELKINGTON",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 12991,
    "MakeName": "MK SPORTSCARS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13018,
    "MakeName": "SHAY REPRODUCTION",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13022,
    "MakeName": "DELOREAN",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13024,
    "MakeName": "CLENET COACHWORKS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13025,
    "MakeName": "CHECKER",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13026,
    "MakeName": "BERTONE",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13028,
    "MakeName": "CAMELOT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13271,
    "MakeName": "ZEEKR",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13380,
    "MakeName": "BACKDRAFT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13391,
    "MakeName": "FALCON MOTORS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13585,
    "MakeName": "MAYHEM AUTOWORKZ",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13647,
    "MakeName": "RENAULT",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  },
  {
    "MakeId": 13887,
    "MakeName": "HEDLEY STUDIOS",
    "VehicleTypeId": 2,
    "VehicleTypeName": "Passenger Car"
  }
]