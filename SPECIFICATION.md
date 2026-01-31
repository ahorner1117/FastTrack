# FastTrack - iOS Vehicle Acceleration Timer
## Technical Specification Document

**Version:** 1.0
**Date:** January 2026
**Platform:** iOS 17+

---

## 1. Executive Summary

FastTrack is a free iOS application designed to measure and record vehicle acceleration metrics with millisecond precision. The app leverages device GPS and motion sensors to provide accurate timing for common performance benchmarks including 0-60 mph, 0-100 mph, quarter-mile, and half-mile runs.

---

## 2. Core Features

### 2.1 Acceleration Timing

| Metric | Description | Precision |
|--------|-------------|-----------|
| 0-60 mph/kmh | Time from standstill to 60 mph or 100 kmh | Milliseconds |
| 0-100 mph | Time from standstill to 100 mph (160 kmh) | Milliseconds |
| Quarter Mile | Time to cover 1/4 mile (402.3m) with trap speed | Milliseconds |
| Half Mile | Time to cover 1/2 mile (804.7m) with trap speed | Milliseconds |
| Top Speed | Maximum velocity reached during run | 0.1 mph/kmh |

### 2.2 Automatic Detection

- **Launch Detection:** Automatically detects vehicle movement from standstill (>2 mph threshold)
- **Top Speed Capture:** Detects deceleration (gas release) and locks in peak velocity
- **Run Completion:** Automatically ends timing when target is reached or deceleration detected
- **GPS Lock Indicator:** Visual confirmation of GPS accuracy before run

### 2.3 User Authentication (Optional)

- Sign up with email/password
- Sign in with existing account
- Sign in with Apple (privacy-focused)
- Guest mode (all features available, local storage only)
- Account enables cloud backup and cross-device sync

### 2.4 Run History

- Complete log of all timed runs
- Sortable by date, metric type, or performance
- Personal best tracking per metric
- Export capability (CSV/JSON)
- Delete individual runs or clear history

### 2.5 Vehicle Management (Garage)

- **Multiple Vehicles:** Add unlimited vehicles to personal garage
- **Vehicle Details:**
  - Name (required) - e.g., "Daily Driver", "Track Car"
  - Year, Make, Model (optional but recommended)
  - Trim/Variant (optional) - e.g., "GT500", "M3 Competition"
  - Color (optional) - for visual identification
  - Photo (optional) - from camera or photo library
  - Notes (optional) - modifications, specs, etc.
- **Active Vehicle Selection:** Quick-switch from timer screen
- **Default Vehicle:** Set a default for automatic selection
- **Per-Vehicle Statistics:**
  - Total runs recorded
  - Personal bests per metric
  - Average performance trends
- **Vehicle-Filtered History:** View runs for specific vehicle only

### 2.6 Settings & Configuration

- **Unit System:** Toggle between Imperial (mph, miles) and Metric (kmh, kilometers)
- **GPS Accuracy Threshold:** Configurable minimum GPS accuracy before allowing runs
- **Auto-save Preference:** Toggle automatic run saving
- **Dark/Light Mode:** Follow system or manual override
- **Haptic Feedback:** Enable/disable vibration on milestones
- **Default Vehicle:** Set which vehicle is pre-selected on app launch

---

## 3. User Interface Design

### 3.1 Design Principles

- **Minimalist:** Clean interface with focus on essential data
- **Glanceable:** Large, high-contrast numbers readable at a glance
- **Dark-First:** Optimized for low-light/night driving conditions
- **Safe:** No complex interactions required while vehicle is in motion

### 3.2 Screen Hierarchy

```
┌─────────────────────────────────────────┐
│              Tab Navigation             │
├─────────────────────────────────────────┤
│  [Timer]  [Garage]  [History] [Settings]│
└─────────────────────────────────────────┘
```

### 3.3 Timer Screen (Main)

```
┌─────────────────────────────────────────┐
│  GPS: ● Ready (±3m)        [Profile ○]  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ <Car/>  2024 BMW M3 Competition [▼]││
│  └─────────────────────────────────────┘│
│                                         │
│              0.000                      │
│               sec                       │
│                                         │
│         ┌───────────────┐               │
│         │   0.0 mph     │               │
│         │  current      │               │
│         └───────────────┘               │
│                                         │
│  0-60: --:--    0-100: --:--            │
│  ¼ mi: --:--    ½ mi:  --:--            │
│                                         │
│         [ START / READY ]               │
│                                         │
│  Top Speed: 0.0 mph                     │
│  Distance:  0.00 mi                     │
│                                         │
└─────────────────────────────────────────┘
```

**Vehicle Selector Behavior:**
- Tapping the vehicle bar opens a bottom sheet with all vehicles
- Shows "No Vehicle Selected" if garage is empty (runs still allowed)
- Selected vehicle is remembered between sessions
- Can be changed any time before starting a run (disabled during active run)

**Vehicle Selector Bottom Sheet:**
```
┌─────────────────────────────────────────┐
│  ─────  (drag handle)                   │
│                                         │
│  Select Vehicle                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ <Car/> 2024 BMW M3 Competition  [*] ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ <Car/> 2022 Ford Mustang GT     [ ] ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ <Car/> 2019 Honda Civic Si      [ ] ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ <Plus/> Add New Vehicle         [>] ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**States:**
1. **Idle:** Waiting for GPS lock, shows "Acquiring GPS..."
2. **Ready:** GPS locked, "START" button enabled, awaiting user tap
3. **Armed:** User tapped start, waiting for motion detection
4. **Running:** Active timing, real-time updates
5. **Complete:** Run finished, results displayed with save prompt

### 3.4 History Screen

```
┌─────────────────────────────────────────┐
│  Run History                            │
├─────────────────────────────────────────┤
│  [All Vehicles ▼]           [Filter ▼]  │
├─────────────────────────────────────────┤
│  <Star/> Personal Best: 0-60 in 4.21s   │
│          (2024 BMW M3 Competition)      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ <Car/> 2024 BMW M3 Competition      ││
│  │ Jan 30, 2026 • 2:34 PM              ││
│  │ 0-60: 4.52s  │  Top: 127.3 mph      ││
│  │ ¼ mi: 12.84s @ 112.4 mph            ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ <Car/> 2022 Ford Mustang GT         ││
│  │ Jan 29, 2026 • 6:12 PM              ││
│  │ 0-60: 4.67s  │  Top: 98.2 mph       ││
│  │ ¼ mi: 13.12s @ 104.1 mph            ││
│  └─────────────────────────────────────┘│
│                 ...                     │
└─────────────────────────────────────────┘
```

**Vehicle Filter:**
- Dropdown to filter runs by specific vehicle
- "All Vehicles" shows combined history
- Personal bests update based on filter (per-vehicle or overall)

### 3.5 Garage Screen

```
┌─────────────────────────────────────────┐
│  My Garage                    [+ Add]   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ ┌─────┐                             ││
│  │ │<Img>│  2024 BMW M3 Competition    ││
│  │ │     │  Alpine White • 12 runs     ││
│  │ └─────┘  <Star/> Best 0-60: 3.89s   ││
│  │                          [Default *]││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ┌─────┐                             ││
│  │ │<Img>│  2022 Ford Mustang GT       ││
│  │ │     │  Grabber Blue • 8 runs      ││
│  │ └─────┘  <Star/> Best 0-60: 4.52s   ││
│  │                          [Default  ]││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ┌─────┐                             ││
│  │ │<Img>│  2019 Honda Civic Si        ││
│  │ │     │  Rallye Red • 3 runs        ││
│  │ └─────┘  <Star/> Best 0-60: 6.21s   ││
│  │                          [Default  ]││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Garage Features:**
- Tap vehicle card to view/edit details
- Swipe left to delete (with confirmation if runs exist)
- Tap "Default" radio to set as pre-selected vehicle
- Photo thumbnail from vehicle's saved image

### 3.6 Add/Edit Vehicle Screen

```
┌─────────────────────────────────────────┐
│  [Cancel]    Add Vehicle       [Save]   │
├─────────────────────────────────────────┤
│         ┌───────────────────┐           │
│         │                   │           │
│         │  <Camera/> Add    │           │
│         │                   │           │
│         └───────────────────┘           │
├─────────────────────────────────────────┤
│  VEHICLE INFO                           │
│  Name *         [My Track Car      ]    │
│  Year           [2024              ]    │
│  Make           [BMW               ]    │
│  Model          [M3                ]    │
│  Trim           [Competition       ]    │
│  Color          [Alpine White      ]    │
├─────────────────────────────────────────┤
│  NOTES                                  │
│  ┌─────────────────────────────────────┐│
│  │ Stage 2 tune, downpipe, intake...  ││
│  │                                     ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  Set as default vehicle    [━━━●]       │
└─────────────────────────────────────────┘
```

**Validation:**
- Name is required (minimum 1 character)
- All other fields optional
- Photo can be taken or selected from library

### 3.7 Settings Screen

```
┌─────────────────────────────────────────┐
│  Settings                               │
├─────────────────────────────────────────┤
│  UNITS                                  │
│  ○ Imperial (mph, miles)                │
│  ● Metric (kmh, kilometers)             │
├─────────────────────────────────────────┤
│  GPS ACCURACY                           │
│  Minimum accuracy: [±5m ▼]              │
├─────────────────────────────────────────┤
│  DISPLAY                                │
│  Appearance          [System ▼]         │
│  Haptic Feedback     [━━━●]             │
├─────────────────────────────────────────┤
│  VEHICLES                               │
│  Default Vehicle     [2024 BMW M3 ▼]    │
│  Manage Garage       [→]                │
├─────────────────────────────────────────┤
│  DATA                                   │
│  Auto-save runs      [━━━●]             │
│  Export History      [→]                │
│  Clear All Data      [→]                │
├─────────────────────────────────────────┤
│  ACCOUNT                                │
│  Sign In / Sign Up   [→]                │
│  (Enables cloud sync)                   │
└─────────────────────────────────────────┘
```

### 3.8 Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | #FFFFFF | #000000 |
| Primary Text | #1A1A1A | #FFFFFF |
| Accent (Active) | #00D26A | #00FF7F |
| Warning | #FF9500 | #FFB340 |
| Error | #FF3B30 | #FF453A |
| Secondary | #8E8E93 | #636366 |

### 3.9 Iconography (Lucide)

All icons use [Lucide](https://lucide.dev/) via `lucide-react-native`. Icons should be:
- 24x24 for standard UI elements
- 20x20 for compact/inline usage
- Stroke width: 2 (default)

| Usage | Icon | Name |
|-------|------|------|
| Vehicle/Car | `<Car />` | car |
| Add | `<Plus />` | plus |
| Settings | `<Settings />` | settings |
| History | `<History />` | history |
| Timer | `<Timer />` | timer |
| Garage | `<Warehouse />` | warehouse |
| Star/Best | `<Star />` | star |
| GPS Active | `<Navigation />` | navigation |
| GPS Searching | `<Loader />` | loader |
| Speed | `<Gauge />` | gauge |
| Distance | `<Route />` | route |
| Photo | `<Camera />` | camera |
| Delete | `<Trash2 />` | trash-2 |
| Edit | `<Pencil />` | pencil |
| Check | `<Check />` | check |
| Chevron | `<ChevronDown />` | chevron-down |
| Export | `<Download />` | download |
| Profile | `<User />` | user |

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React Native 0.76+ | Cross-platform potential, JavaScript ecosystem, strong iOS support |
| Navigation | React Navigation 7 | Native navigation patterns, deep linking support |
| State Management | Zustand | Lightweight, TypeScript-first, minimal boilerplate |
| Local Storage | WatermelonDB | High-performance, reactive, offline-first database |
| GPS/Sensors | react-native-location + expo-sensors | Native GPS with high-frequency updates |
| Authentication | Supabase Auth | Free tier, Apple Sign-In support, self-hostable |
| Cloud Sync | Supabase Realtime | Real-time sync with offline support |
| UI Components | React Native Reanimated 3 | 60fps animations on UI thread |
| Icons | lucide-react-native | Consistent, customizable SVG icons |
| Charts | Victory Native | SVG-based charts for run analysis |

### 4.2 Project Structure

```
FastTrack/
├── src/
│   ├── app/                    # App entry, navigation
│   │   ├── _layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx       # Timer screen
│   │   │   ├── garage.tsx      # Vehicle management
│   │   │   ├── history.tsx     # History screen
│   │   │   └── settings.tsx    # Settings screen
│   │   ├── (auth)/
│   │   │   ├── sign-in.tsx
│   │   │   └── sign-up.tsx
│   │   └── (vehicles)/
│   │       ├── [id].tsx        # Vehicle detail/edit
│   │       └── add.tsx         # Add new vehicle
│   ├── components/
│   │   ├── Timer/
│   │   │   ├── SpeedDisplay.tsx
│   │   │   ├── MetricsGrid.tsx
│   │   │   ├── GPSStatus.tsx
│   │   │   ├── VehicleSelector.tsx
│   │   │   └── StartButton.tsx
│   │   ├── Garage/
│   │   │   ├── VehicleCard.tsx
│   │   │   ├── VehicleForm.tsx
│   │   │   └── VehiclePhoto.tsx
│   │   ├── History/
│   │   │   ├── RunCard.tsx
│   │   │   ├── PersonalBest.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── VehicleFilter.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Toggle.tsx
│   │       └── BottomSheet.tsx
│   ├── hooks/
│   │   ├── useLocation.ts      # GPS hook with accuracy
│   │   ├── useAccelerometer.ts # Motion detection
│   │   ├── useTimer.ts         # High-precision timer
│   │   ├── useRunTracker.ts    # Main run logic
│   │   └── useVehicles.ts      # Vehicle CRUD operations
│   ├── stores/
│   │   ├── settingsStore.ts    # User preferences
│   │   ├── runStore.ts         # Current run state
│   │   ├── historyStore.ts     # Past runs
│   │   └── vehicleStore.ts     # Vehicle management
│   ├── services/
│   │   ├── locationService.ts  # GPS abstraction
│   │   ├── calculationService.ts # Speed/distance math
│   │   ├── storageService.ts   # Local persistence
│   │   ├── imageService.ts     # Vehicle photo handling
│   │   └── syncService.ts      # Cloud sync
│   ├── models/
│   │   ├── Run.ts              # Run data model
│   │   ├── Vehicle.ts          # Vehicle data model
│   │   ├── Settings.ts         # Settings model
│   │   └── User.ts             # User model
│   ├── utils/
│   │   ├── conversions.ts      # mph/kmh, mi/km
│   │   ├── formatting.ts       # Time/speed display
│   │   └── constants.ts        # App constants
│   └── types/
│       └── index.ts            # TypeScript definitions
├── ios/                        # Native iOS project
├── android/                    # Native Android project (future)
├── package.json
├── tsconfig.json
└── app.json
```

### 4.3 Core Algorithm: Run Tracking

```typescript
// Simplified run tracking logic
interface RunState {
  status: 'idle' | 'ready' | 'armed' | 'running' | 'complete';
  startTime: number | null;
  currentSpeed: number;          // mph or kmh based on settings
  topSpeed: number;
  distance: number;              // meters
  milestones: {
    zeroToSixty: number | null;  // milliseconds
    zeroToHundred: number | null;
    quarterMile: number | null;
    quarterMileSpeed: number | null;
    halfMile: number | null;
    halfMileSpeed: number | null;
  };
}

// Speed thresholds (in mph, converted as needed)
const MOTION_THRESHOLD = 2;        // Movement detection
const SIXTY_MPH = 60;
const HUNDRED_MPH = 100;
const QUARTER_MILE_METERS = 402.336;
const HALF_MILE_METERS = 804.672;

// Deceleration detection
const DECEL_THRESHOLD = 2;         // mph drop to trigger top speed lock
const DECEL_SAMPLES = 3;           // Consecutive samples needed
```

### 4.4 GPS Configuration

```typescript
const GPS_CONFIG = {
  accuracy: 'bestForNavigation',   // iOS kCLLocationAccuracyBestForNavigation
  distanceFilter: 1,               // Update every 1 meter
  interval: 100,                   // Target 10Hz updates
  fastestInterval: 50,             // Allow up to 20Hz
  showsBackgroundLocationIndicator: true,
  pausesLocationUpdatesAutomatically: false,
};
```

### 4.5 Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GPS/IMU   │────▶│  useLocation │────▶│  runStore   │
│   Sensors   │     │     Hook     │     │  (Zustand)  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌──────────────┐            │
                    │   UI Layer   │◀───────────┘
                    │  (React)     │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     ┌─────────────────┐      ┌─────────────────┐
     │  WatermelonDB   │      │    Supabase     │
     │  (Local)        │◀────▶│    (Cloud)      │
     └─────────────────┘      └─────────────────┘
```

---

## 5. Data Models

### 5.1 Run Model

```typescript
interface Run {
  id: string;                    // UUID
  userId: string | null;         // null for guest users
  vehicleId: string | null;      // Reference to vehicle (null if no vehicle selected)
  timestamp: number;             // Unix timestamp (ms)

  // Timing data (all in milliseconds)
  duration: number;              // Total run duration
  zeroToSixty: number | null;
  zeroToHundred: number | null;
  quarterMile: number | null;
  halfMile: number | null;

  // Speed data (stored in m/s, converted for display)
  topSpeed: number;
  quarterMileSpeed: number | null;
  halfMileSpeed: number | null;

  // Distance (meters)
  totalDistance: number;

  // Metadata
  gpsAccuracy: number;           // Average accuracy during run
  unitSystem: 'imperial' | 'metric';

  // Sync
  syncedAt: number | null;
  isDeleted: boolean;
}
```

### 5.2 Vehicle Model

```typescript
interface Vehicle {
  id: string;                    // UUID
  userId: string | null;         // null for guest users
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)

  // Required
  name: string;                  // User-defined name (e.g., "Daily Driver")

  // Optional vehicle details
  year: number | null;           // Model year (e.g., 2024)
  make: string | null;           // Manufacturer (e.g., "BMW")
  model: string | null;          // Model name (e.g., "M3")
  trim: string | null;           // Variant/trim (e.g., "Competition")
  color: string | null;          // Color name (e.g., "Alpine White")
  notes: string | null;          // User notes (mods, specs, etc.)

  // Photo
  photoUri: string | null;       // Local file URI for vehicle photo

  // Settings
  isDefault: boolean;            // Pre-select on app launch

  // Computed (not stored, calculated from runs)
  // runCount: number;
  // bestZeroToSixty: number | null;
  // bestQuarterMile: number | null;

  // Sync
  syncedAt: number | null;
  isDeleted: boolean;
}
```

### 5.3 Settings Model

```typescript
interface Settings {
  // Units
  unitSystem: 'imperial' | 'metric';

  // GPS
  minGpsAccuracy: number;        // meters (5, 10, 15, 20)

  // Display
  appearance: 'system' | 'light' | 'dark';
  hapticFeedback: boolean;

  // Vehicles
  defaultVehicleId: string | null;  // Auto-select on app launch
  activeVehicleId: string | null;   // Currently selected for timing

  // Data
  autoSaveRuns: boolean;

  // Account
  userId: string | null;
  syncEnabled: boolean;
}
```

### 5.4 Database Schema (WatermelonDB)

```typescript
// schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'vehicles',
      columns: [
        { name: 'user_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'year', type: 'number', isOptional: true },
        { name: 'make', type: 'string', isOptional: true },
        { name: 'model', type: 'string', isOptional: true },
        { name: 'trim', type: 'string', isOptional: true },
        { name: 'color', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'photo_uri', type: 'string', isOptional: true },
        { name: 'is_default', type: 'boolean' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'runs',
      columns: [
        { name: 'user_id', type: 'string', isOptional: true },
        { name: 'vehicle_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'duration', type: 'number' },
        { name: 'zero_to_sixty', type: 'number', isOptional: true },
        { name: 'zero_to_hundred', type: 'number', isOptional: true },
        { name: 'quarter_mile', type: 'number', isOptional: true },
        { name: 'half_mile', type: 'number', isOptional: true },
        { name: 'top_speed', type: 'number' },
        { name: 'quarter_mile_speed', type: 'number', isOptional: true },
        { name: 'half_mile_speed', type: 'number', isOptional: true },
        { name: 'total_distance', type: 'number' },
        { name: 'gps_accuracy', type: 'number' },
        { name: 'unit_system', type: 'string' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'is_deleted', type: 'boolean' },
      ],
    }),
  ],
});
```

---

## 6. Performance Optimization

### 6.1 GPS Accuracy Enhancement

1. **Kalman Filtering:** Smooth GPS noise while maintaining responsiveness
2. **IMU Fusion:** Combine accelerometer data with GPS for short-term accuracy
3. **Pre-run Warm-up:** Allow GPS to stabilize before enabling start
4. **Accuracy Gating:** Only record data points above accuracy threshold

### 6.2 Battery Optimization

- Request location updates only when timer is active
- Reduce update frequency when stationary (armed but not moving)
- Stop all sensor activity on app background (unless run in progress)
- Use efficient native modules over JavaScript polling

### 6.3 UI Performance

- Use `react-native-reanimated` for all animations (UI thread)
- Memoize expensive components with `React.memo`
- Batch state updates to reduce re-renders
- Use `FlashList` for history list (virtualized)
- Throttle speed display updates to 10Hz (human perception limit)

### 6.4 Memory Management

- Limit GPS history buffer to last 1000 points during run
- Compress completed runs before storage
- Lazy-load history entries
- Clear image/asset caches on memory warning

---

## 7. Privacy & Security

### 7.1 Data Privacy

| Data Type | Storage | Encryption | Retention |
|-----------|---------|------------|-----------|
| Run data | Local + Cloud (if synced) | At-rest encryption | Until user deletes |
| Vehicle data | Local + Cloud (if synced) | At-rest encryption | Until user deletes |
| Vehicle photos | Local only | At-rest encryption | Until vehicle deleted |
| Location | Never stored raw | N/A | Processed only |
| Credentials | Secure Keychain | iOS Keychain | Until sign out |
| Settings | Local only | At-rest encryption | Indefinite |

### 7.2 Privacy Features

- **No Tracking:** No analytics, advertising, or third-party SDKs
- **No Location History:** GPS coordinates are processed in real-time, never stored
- **Local-First:** Full functionality without account or internet
- **Data Export:** Users can export all their data at any time
- **Data Deletion:** Complete local wipe available in settings
- **Minimal Permissions:** Only request location when actively timing

### 7.3 iOS Privacy Manifest

```xml
<!-- PrivacyInfo.xcprivacy -->
<dict>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string> <!-- App settings -->
      </array>
    </dict>
  </array>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <!-- No data collected for tracking -->
  </array>
  <key>NSPrivacyTracking</key>
  <false/>
</dict>
```

---

## 8. iOS Integration

### 8.1 Required Capabilities

- Location Services (When In Use + Background)
- Background Modes: Location updates
- Motion & Fitness (accelerometer)

### 8.2 Info.plist Entries

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>FastTrack uses your location to measure speed and distance during acceleration runs.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>FastTrack needs background location access to continue timing if you switch apps during a run.</string>

<key>NSMotionUsageDescription</key>
<string>FastTrack uses motion sensors to detect when your vehicle starts moving.</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

### 8.3 Minimum Requirements

- iOS 17.0+
- iPhone 8 or newer (GPS + barometer required)
- Location Services enabled
- 50MB storage space

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Conversion utilities (mph ↔ kmh, miles ↔ km)
- Time formatting functions
- Milestone detection logic
- Deceleration detection algorithm

### 9.2 Integration Tests

- GPS service integration
- Database read/write operations
- Cloud sync conflict resolution
- Authentication flows

### 9.3 Device Testing

- Test on multiple iPhone models (GPS variance)
- Test in various conditions (tunnel, urban canyon, open road)
- Battery drain testing over extended use
- Background/foreground transitions during run

### 9.4 Accuracy Validation

- Compare against known GPS speedometer apps
- Test against vehicle OBD-II data (if available)
- Validate distance measurements on known courses

---

## 10. Future Considerations

### 10.1 Potential Enhancements (v2.0+)

- **OBD-II Integration:** Higher accuracy via vehicle data
- **Apple Watch Companion:** Quick glance at current run
- **Social Sharing:** Share run cards to social media
- **Weather Logging:** Record conditions (temperature, humidity)
- **Elevation Data:** Track altitude changes during run
- **Vehicle Comparison:** Side-by-side performance comparison between vehicles
- **Android Version:** Leverage React Native cross-platform

### 10.2 Not In Scope (v1.0)

- Live leaderboards or competitive features
- In-app purchases or subscriptions
- Video recording integration
- Drag racing reaction timer
- Predictive timing estimates

---

## 11. Development Milestones

### Phase 1: Foundation
- [ ] Project setup (React Native, TypeScript, ESLint)
- [ ] Navigation structure (4 tabs: Timer, Garage, History, Settings)
- [ ] Basic UI components
- [ ] Lucide icons integration
- [ ] Settings screen with persistence

### Phase 2: Vehicle Management
- [ ] Vehicle data model and database table
- [ ] Garage screen with vehicle list
- [ ] Add/Edit vehicle form
- [ ] Vehicle photo capture and storage
- [ ] Default vehicle selection
- [ ] Vehicle selector on Timer screen

### Phase 3: Core Timing
- [ ] GPS integration with accuracy monitoring
- [ ] Timer implementation
- [ ] Speed calculation and display
- [ ] Milestone detection (0-60, 0-100, distances)
- [ ] Top speed capture on deceleration
- [ ] Associate runs with selected vehicle

### Phase 4: Data Management
- [ ] WatermelonDB integration
- [ ] Run saving and history display
- [ ] Vehicle filter in history
- [ ] Personal best tracking (overall and per-vehicle)
- [ ] Data export functionality

### Phase 5: Authentication
- [ ] Supabase setup
- [ ] Sign up / Sign in flows
- [ ] Apple Sign-In
- [ ] Cloud sync implementation (runs + vehicles)

### Phase 6: Polish
- [ ] Animations and transitions
- [ ] Haptic feedback
- [ ] Dark mode refinement
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 7: Release
- [ ] TestFlight beta
- [ ] App Store assets (screenshots, description)
- [ ] Privacy policy
- [ ] App Store submission

---

## 12. Appendix

### A. Unit Conversions

```typescript
// conversions.ts
export const mphToKmh = (mph: number): number => mph * 1.60934;
export const kmhToMph = (kmh: number): number => kmh / 1.60934;
export const metersToMiles = (m: number): number => m / 1609.344;
export const milesToMeters = (mi: number): number => mi * 1609.344;
export const metersToKm = (m: number): number => m / 1000;
export const msToMph = (ms: number): number => ms * 2.23694;
export const msToKmh = (ms: number): number => ms * 3.6;
```

### B. Time Formatting

```typescript
// formatting.ts
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}`;
};

export const formatSpeed = (
  speed: number,
  unit: 'imperial' | 'metric'
): string => {
  const value = unit === 'imperial' ? speed : mphToKmh(speed);
  return `${value.toFixed(1)} ${unit === 'imperial' ? 'mph' : 'km/h'}`;
};
```

### C. Distance Thresholds

| Metric | Meters | Miles | Kilometers |
|--------|--------|-------|------------|
| Quarter Mile | 402.336 | 0.25 | 0.402 |
| Half Mile | 804.672 | 0.5 | 0.805 |
| Eighth Mile | 201.168 | 0.125 | 0.201 |
| 1000 Feet | 304.8 | 0.189 | 0.305 |

---

*Document Version: 1.0*
*Last Updated: January 30, 2026*
