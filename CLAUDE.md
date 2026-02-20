# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastTrack is an iOS app for timing vehicle acceleration with millisecond precision. It measures 0-60 mph, 0-100 mph, quarter-mile, and half-mile runs using GPS and accelerometer-based launch detection.

## Build Commands

```bash
npm install          # Install dependencies
npm start            # Start Metro bundler
npm run ios          # Run on iOS simulator (requires Xcode)
npx tsc --noEmit     # TypeScript type check
```

## Deployment

**All prerequisites are configured and ready:**
- EAS CLI installed and authenticated
- App Store Connect account configured
- Apple Developer Program membership active
- Bundle ID: `com.anthonyhorner.fasttrack`
- EAS Project ID: `9311807a-428e-4f90-8fe1-269b7313596a`

**Deploy to App Store Connect (Xcode):**
```bash
npm run deploy                  # Build & upload, auto-increment build number
npm run deploy -- --patch       # Bump patch version (3.4.1 -> 3.4.2) then build
npm run deploy -- --minor       # Bump minor version (3.4.1 -> 3.5.0) then build
npm run deploy -- --major       # Bump major version (3.4.1 -> 4.0.0) then build
```

The deploy script (`scripts/deploy-ios.sh`) handles the full pipeline:
1. Auto-increments build number (tracked in `.build-number`)
2. Optionally bumps version in `app.json` and `package.json`
3. Runs `expo prebuild --platform ios --clean`
4. Archives via `xcodebuild`
5. Uploads to App Store Connect

**Deploy via EAS (alternative):**
```bash
eas build --platform ios --profile production              # Build for production
eas submit --platform ios --latest                         # Submit to App Store Connect
# OR combine: eas build --platform ios --profile production --auto-submit
```

## Architecture

```
app/                 # Expo Router screens
├── (tabs)/          # Tab navigation: index (Timer), garage, history, settings
├── history/         # Run detail screens
└── vehicles/        # Vehicle CRUD screens

src/
├── components/      # Feature-organized components (Timer/, Garage/, History/)
├── hooks/           # useLocation, useAccelerometer, useRunTracker
├── stores/          # Zustand stores with AsyncStorage persistence
├── services/        # locationService (distance calculations)
├── types/           # TypeScript interfaces
└── utils/           # constants, formatters, conversions
```

## Core Data Flow

1. **Timer screen** uses `useRunTracker` hook which orchestrates everything
2. **useLocation** provides GPS data with accuracy gating
3. **useAccelerometer** detects launch via G-force threshold (calibrates baseline, then detects sustained acceleration)
4. When armed: accelerometer monitors for launch → triggers run start → GPS tracks milestones

## Timing Accuracy Optimizations

**Professional-grade timing implementation:**
- **GPS timestamps**: Uses GPS timestamps (not `Date.now()`) for all milestone recording to eliminate processing lag
- **Calculated speed**: Computes speed from position deltas (`distance/time`) instead of GPS-reported speed for better accuracy
- **Speed smoothing**: Applies exponential moving average (α=0.3) to reduce GPS noise and prevent false threshold crossings
- **Accuracy filtering**: Filters GPS points during runs - only accepts points with accuracy ≤ 2x threshold to reject poor quality data
- **Result**: Achieves timing accuracy comparable to professional systems (Dragy/RaceBox) with ±0.05-0.1s precision

## State Management

Zustand stores with AsyncStorage persistence:
- `settingsStore`: Units, GPS accuracy, launch detection config (thresholdG, sampleCount)
- `runStore`: Active run state (status, speed, distance, milestones, GPS points)
- `historyStore`: Saved runs with launch config
- `vehicleStore`: User's garage

## Data Persistence

**CRITICAL: All user data must be stored in Supabase.**

- **Runs**: Synced to `runs` table (bidirectional: push local changes, restore from cloud on login)
- **Vehicles**: Synced to `vehicles` table (bidirectional: individual CRUD operations sync to cloud)
- **Settings**: Local only (device-specific preferences)
- **Authentication**: Required for all cloud sync operations via `authService.ts`
- **Sync flow**: On login, `restoreAndSync()` fetches vehicles then runs from cloud, then pushes local changes
- **Cloud operations**: Individual vehicle add/update/delete operations sync immediately from component files in `app/vehicles/`

Services:
- `src/services/syncService.ts` - All cloud sync for runs and vehicles
- `src/services/authService.ts` - Authentication and `restoreAndSync()` on login

## Key Constants

Speeds stored internally in m/s, distances in meters. Thresholds defined in `src/utils/constants.ts`:
- 60 mph = 26.8224 m/s
- Quarter mile = 402.336 m

## Important Conventions

- **Data persistence**: All user data (runs, vehicles) MUST be stored in Supabase, not just locally
- **Column naming**: Cloud table columns use snake_case; local TypeScript types use camelCase
- **Vehicle format**: Vehicle name in runs table follows "{year} {make} {model}" format
- **Cloud sync**: Fire-and-forget from components with `.catch()` error handling
- All icons from lucide-react-native, no emojis
- Dark-first UI using `COLORS.dark.*` from constants
- Launch detection: configurable G-force threshold (0.1-0.5G) and sample count (1-4 samples at 100Hz)
