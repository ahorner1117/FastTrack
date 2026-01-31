# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastTrack is a free iOS application for timing vehicle acceleration with millisecond precision. It measures 0-60 mph, 0-100 mph, quarter-mile, and half-mile runs using GPS and motion sensors.

**Status:** Specification phase - see SPECIFICATION.md for complete technical design.

## Technology Stack

- **Framework:** React Native 0.76+ with TypeScript
- **Navigation:** React Navigation 7 (Expo Router)
- **State:** Zustand
- **Database:** WatermelonDB (local), Supabase (cloud sync)
- **GPS/Sensors:** react-native-location + expo-sensors
- **Auth:** Supabase Auth (email, Apple Sign-In)
- **Icons:** lucide-react-native (no emojis)
- **Animations:** React Native Reanimated 3

## Build Commands

```bash
npm install                    # Install dependencies
npm start                      # Start Metro bundler
npm run ios                    # Run on iOS simulator
npm run lint                   # Run ESLint
npm run test                   # Run Jest tests
npm run test -- --watch        # Watch mode
npm run test -- path/to/file   # Single test file
eas build --platform ios       # Production iOS build
```

## Architecture

```
src/
├── app/              # Expo Router screens and navigation
│   ├── (tabs)/       # Tab navigation (Timer, Garage, History, Settings)
│   ├── (auth)/       # Authentication screens
│   └── (vehicles)/   # Vehicle CRUD screens
├── components/       # React components by feature
├── hooks/            # Custom hooks (useLocation, useTimer, useRunTracker)
├── stores/           # Zustand stores (settings, run, history, vehicle)
├── services/         # Business logic (GPS, calculations, storage, sync)
├── models/           # TypeScript interfaces and WatermelonDB models
└── utils/            # Helpers (conversions, formatting, constants)
```

## Key Patterns

- **Offline-first:** WatermelonDB for local persistence, Supabase for optional cloud sync
- **Hook abstraction:** GPS and sensors wrapped in custom hooks with accuracy monitoring
- **Store-based state:** Zustand stores for settings, active run, history, and vehicles
- **Service layer:** Business logic separated from UI (locationService, calculationService, syncService)

## Data Models

- **Run:** Timing data linked to optional vehicle, includes all milestone times and speeds
- **Vehicle:** User's garage entries with name, year/make/model, photo, notes
- **Settings:** Units (imperial/metric), GPS accuracy threshold, default vehicle

## Important Conventions

- All icons from Lucide, no emojis
- Store speeds internally in m/s, convert for display based on unit preference
- GPS updates at 10Hz during active runs, accuracy-gated
- Vehicle selection required before timing (nullable for legacy compatibility)
- Dark-first UI design for in-vehicle use
