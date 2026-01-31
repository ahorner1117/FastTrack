import { Platform } from 'react-native';
import type { GPSAccuracy } from '../types';
import { GPS_ACCURACY_THRESHOLDS } from '../utils/constants';

// Only import expo-location on native platforms
const Location = Platform.OS !== 'web' ? require('expo-location') : null;

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null; // m/s
  accuracy: number | null; // meters
  timestamp: number;
}

export async function requestLocationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !Location) {
    // Web doesn't support expo-location
    return false;
  }

  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== 'granted') {
    return false;
  }

  // Request background permission for future use (optional)
  // const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  return true;
}

export async function checkLocationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' || !Location) {
    return false;
  }

  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

export function isAccuracyAcceptable(
  accuracy: number | null,
  threshold: GPSAccuracy
): boolean {
  if (accuracy === null) return false;
  return accuracy <= GPS_ACCURACY_THRESHOLDS[threshold];
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula for calculating distance between two GPS coordinates
  const R = 6371000; // Earth's radius in meters

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getGpsAccuracyColor(
  accuracy: number | null,
  threshold: GPSAccuracy
): 'success' | 'warning' | 'error' {
  if (accuracy === null) return 'error';

  const thresholdValue = GPS_ACCURACY_THRESHOLDS[threshold];

  if (accuracy <= thresholdValue) return 'success';
  if (accuracy <= thresholdValue * 2) return 'warning';
  return 'error';
}
