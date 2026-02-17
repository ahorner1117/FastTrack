import { Platform } from 'react-native';
import { calculateDistance } from './locationService';
import { GPS_UPDATE_INTERVAL_MS } from '../utils/constants';
import type { GPSPoint } from '../types';

const Location = Platform.OS !== 'web' ? require('expo-location') : null;
const TaskManager = Platform.OS !== 'web' ? require('expo-task-manager') : null;

export const BACKGROUND_LOCATION_TASK = 'fasttrack-background-location';

// Max plausible speed in m/s (~560 mph) — anything faster is a GPS teleport
const MAX_PLAUSIBLE_SPEED_MS = 250;
// When GPS horizontal accuracy exceeds this (meters), zero out reported speed
const SPEED_ACCURACY_CUTOFF_M = 25;

// Module-level accumulator for background GPS data.
// This persists across background task invocations and is read by the foreground.
let backgroundPoints: GPSPoint[] = [];
let backgroundMaxSpeed = 0;
let backgroundSpeedSamples: number[] = [];
let backgroundDistance = 0;
let lastBackgroundPoint: { lat: number; lon: number; timestamp: number } | null = null;
let isTrackingDrive = false;
let maxAcceptableAccuracy = 20; // default, updated when drive starts

// Register the background task at module level (required by expo-task-manager)
if (TaskManager) {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error('Background location error:', error);
      return;
    }

    if (!isTrackingDrive || !data?.locations?.length) return;

    const locations = data.locations as Array<{
      coords: { latitude: number; longitude: number; speed: number | null; accuracy: number | null };
      timestamp: number;
    }>;

    for (const location of locations) {
      const { latitude, longitude, speed: rawSpeed, accuracy: horAccuracy } = location.coords;
      const timestamp = location.timestamp;

      // GPS jump / teleportation rejection
      if (lastBackgroundPoint) {
        const dt = (timestamp - lastBackgroundPoint.timestamp) / 1000;
        if (dt > 0) {
          const dist = calculateDistance(
            lastBackgroundPoint.lat,
            lastBackgroundPoint.lon,
            latitude,
            longitude
          );
          const impliedSpeed = dist / dt;
          if (impliedSpeed > MAX_PLAUSIBLE_SPEED_MS) {
            continue; // Skip this reading
          }
        }
      }

      // Speed filtering
      let filteredSpeed = rawSpeed !== null && rawSpeed >= 0 ? rawSpeed : 0;
      if (horAccuracy !== null && horAccuracy > SPEED_ACCURACY_CUTOFF_M) {
        filteredSpeed = 0;
      }

      const locationAccuracy = horAccuracy ?? 999;
      const isGoodAccuracy = locationAccuracy <= maxAcceptableAccuracy;

      if (isGoodAccuracy) {
        // Track max speed
        if (filteredSpeed > backgroundMaxSpeed) {
          backgroundMaxSpeed = filteredSpeed;
        }

        // Collect speed sample
        backgroundSpeedSamples.push(filteredSpeed);

        // Calculate distance from last point
        if (lastBackgroundPoint) {
          const segmentDistance = calculateDistance(
            lastBackgroundPoint.lat,
            lastBackgroundPoint.lon,
            latitude,
            longitude
          );
          backgroundDistance += segmentDistance;
        }

        // Store GPS point
        backgroundPoints.push({
          latitude,
          longitude,
          speed: filteredSpeed,
          accuracy: locationAccuracy,
          timestamp,
        });
      }

      lastBackgroundPoint = { lat: latitude, lon: longitude, timestamp };
    }
  });
}

export interface BackgroundData {
  points: GPSPoint[];
  maxSpeed: number;
  speedSamples: number[];
  distance: number;
  lastPoint: { lat: number; lon: number } | null;
}

/**
 * Start background location updates for drive tracking.
 */
export async function startBackgroundLocationUpdates(accuracyThreshold: number): Promise<void> {
  if (!Location || !TaskManager || Platform.OS === 'web') return;

  maxAcceptableAccuracy = accuracyThreshold;
  isTrackingDrive = true;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: GPS_UPDATE_INTERVAL_MS,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: Platform.OS === 'android' ? {
      notificationTitle: 'FastTrack',
      notificationBody: 'Tracking your drive...',
    } : undefined,
    pausesUpdatesAutomatically: false,
  });
}

/**
 * Stop background location updates.
 */
export async function stopBackgroundLocationUpdates(): Promise<void> {
  if (!Location || !TaskManager || Platform.OS === 'web') return;

  isTrackingDrive = false;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

/**
 * Read and clear accumulated background location data.
 * Call this when the app returns to the foreground.
 */
export function getAndClearBackgroundData(): BackgroundData {
  const data: BackgroundData = {
    points: [...backgroundPoints],
    maxSpeed: backgroundMaxSpeed,
    speedSamples: [...backgroundSpeedSamples],
    distance: backgroundDistance,
    lastPoint: lastBackgroundPoint
      ? { lat: lastBackgroundPoint.lat, lon: lastBackgroundPoint.lon }
      : null,
  };

  // Clear the accumulators
  backgroundPoints = [];
  backgroundMaxSpeed = 0;
  backgroundSpeedSamples = [];
  backgroundDistance = 0;

  return data;
}

/**
 * Sync the last known foreground position so the background task
 * can continue distance calculations seamlessly.
 */
export function setLastKnownPosition(lat: number, lon: number, timestamp: number): void {
  lastBackgroundPoint = { lat, lon, timestamp };
}

/**
 * Reset all background state (called when drive is reset).
 */
export function resetBackgroundState(): void {
  backgroundPoints = [];
  backgroundMaxSpeed = 0;
  backgroundSpeedSamples = [];
  backgroundDistance = 0;
  lastBackgroundPoint = null;
  isTrackingDrive = false;
}
