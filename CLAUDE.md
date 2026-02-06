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
