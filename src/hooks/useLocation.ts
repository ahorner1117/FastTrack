import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type * as LocationTypes from 'expo-location';
import type { GPSAccuracy } from '../types';
import {
  requestLocationPermissions,
  checkLocationPermissions,
  isAccuracyAcceptable,
  calculateDistance,
  type LocationData,
} from '../services/locationService';
import { GPS_UPDATE_INTERVAL_MS } from '../utils/constants';

// Only import expo-location on native platforms
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Location: typeof LocationTypes | null = Platform.OS !== 'web' ? require('expo-location') : null;

interface UseLocationResult {
  hasPermission: boolean | null;
  isTracking: boolean;
  currentLocation: LocationData | null;
  accuracy: number | null;
  isAccuracyOk: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  calculateDistanceFrom: (lat: number, lon: number) => number;
}

export function useLocation(gpsAccuracyThreshold: GPSAccuracy): UseLocationResult {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const subscriptionRef = useRef<LocationTypes.LocationSubscription | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkLocationPermissions().then(setHasPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await requestLocationPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const startTracking = useCallback(async () => {
    // Web doesn't support expo-location
    if (Platform.OS === 'web' || !Location) {
      return;
    }

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // Stop any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
    }

    setIsTracking(true);

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: GPS_UPDATE_INTERVAL_MS,
        distanceInterval: 0, // Get all updates
      },
      (location: { coords: { latitude: number; longitude: number; speed: number | null; accuracy: number | null }; timestamp: number }) => {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );
  }, [hasPermission, requestPermission]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  const calculateDistanceFrom = useCallback(
    (lat: number, lon: number) => {
      if (!currentLocation) return 0;
      return calculateDistance(
        lat,
        lon,
        currentLocation.latitude,
        currentLocation.longitude
      );
    },
    [currentLocation]
  );

  const accuracy = currentLocation?.accuracy ?? null;
  const isAccuracyOk = isAccuracyAcceptable(accuracy, gpsAccuracyThreshold);

  return {
    hasPermission,
    isTracking,
    currentLocation,
    accuracy,
    isAccuracyOk,
    requestPermission,
    startTracking,
    stopTracking,
    calculateDistanceFrom,
  };
}
