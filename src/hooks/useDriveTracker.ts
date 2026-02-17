import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { useDriveHistoryStore } from '../stores/driveHistoryStore';
import { useLocation } from './useLocation';
import { calculateDistance } from '../services/locationService';
import { syncDriveToCloud } from '../services/syncService';
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  getAndClearBackgroundData,
  setLastKnownPosition,
  resetBackgroundState,
} from '../services/backgroundLocationService';
import { TIMER_UPDATE_INTERVAL_MS, GPS_ACCURACY_THRESHOLDS } from '../utils/constants';
import type { GPSPoint, Drive } from '../types';

const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;

export type DriveStatus = 'idle' | 'ready' | 'tracking' | 'paused' | 'completed';

export function useDriveTracker() {
  const { gpsAccuracy, hapticFeedback, unitSystem, defaultVehicleId } = useSettingsStore();
  const addDrive = useDriveHistoryStore((state) => state.addDrive);
  const markDriveSynced = useDriveHistoryStore((state) => state.markDriveSynced);

  const {
    hasPermission,
    isTracking,
    currentLocation,
    accuracy,
    isAccuracyOk,
    startTracking,
    stopTracking,
  } = useLocation(gpsAccuracy);

  const [status, setStatus] = useState<DriveStatus>('idle');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeedState] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const distanceAccumulator = useRef(0);
  const speedSamples = useRef<number[]>([]);
  const trackingStartedAt = useRef<number>(0);
  const accumulatedTime = useRef<number>(0);
  const statusRef = useRef<DriveStatus>('idle');

  // Keep statusRef in sync so the AppState callback can read it
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Start GPS tracking on mount
  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTracking, stopTracking]);

  // When app returns to foreground during tracking, merge background data
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && statusRef.current === 'tracking') {
        // Catch up elapsed time
        if (timerRef.current) {
          setElapsedTime(accumulatedTime.current + (Date.now() - trackingStartedAt.current));
        }

        // Merge accumulated background GPS data
        const bgData = getAndClearBackgroundData();

        if (bgData.points.length > 0) {
          // Merge GPS points
          setGpsPoints((prev) => [...prev, ...bgData.points]);

          // Merge distance
          distanceAccumulator.current += bgData.distance;
          setTotalDistance(distanceAccumulator.current);

          // Merge max speed
          setMaxSpeed((prev) => Math.max(prev, bgData.maxSpeed));

          // Merge speed samples
          speedSamples.current.push(...bgData.speedSamples);

          // Update last known point for foreground distance tracking
          if (bgData.lastPoint) {
            lastPointRef.current = bgData.lastPoint;
          }
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Transition to ready when GPS is good
  useEffect(() => {
    if (status === 'idle' && isTracking && isAccuracyOk) {
      setStatus('ready');
    } else if (status === 'ready' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
  }, [status, isTracking, isAccuracyOk]);

  // Process GPS updates during tracking (foreground)
  useEffect(() => {
    if (!currentLocation) return;

    const speed = Math.max(0, currentLocation.speed ?? 0);
    const locationAccuracy = currentLocation.accuracy ?? 999;
    const maxAcceptableAccuracy = GPS_ACCURACY_THRESHOLDS[gpsAccuracy] * 2;
    const isGoodAccuracy = locationAccuracy <= maxAcceptableAccuracy;

    // Only update displayed speed when accuracy is acceptable
    if (isGoodAccuracy) {
      setCurrentSpeedState(speed);
    }

    if (status === 'tracking' && isGoodAccuracy) {
      // Track max speed
      if (speed > maxSpeed) {
        setMaxSpeed(speed);
      }

      // Collect speed samples for average
      speedSamples.current.push(speed);

      const gpsPoint: GPSPoint = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        speed,
        accuracy: locationAccuracy,
        timestamp: currentLocation.timestamp,
      };

      setGpsPoints((prev) => [...prev, gpsPoint]);

      // Calculate distance from last point
      if (lastPointRef.current) {
        const segmentDistance = calculateDistance(
          lastPointRef.current.lat,
          lastPointRef.current.lon,
          currentLocation.latitude,
          currentLocation.longitude
        );
        distanceAccumulator.current += segmentDistance;
        setTotalDistance(distanceAccumulator.current);
      }

      lastPointRef.current = {
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
      };

      // Keep the background service in sync with the latest foreground position
      setLastKnownPosition(
        currentLocation.latitude,
        currentLocation.longitude,
        currentLocation.timestamp
      );
    }
  }, [currentLocation, status, maxSpeed, gpsAccuracy]);

  const startDrive = useCallback(() => {
    if (status !== 'ready' && status !== 'paused') return;

    const now = Date.now();

    if (status === 'ready') {
      // Fresh start
      setStartTime(now);
      setElapsedTime(0);
      setTotalDistance(0);
      setMaxSpeed(0);
      setGpsPoints([]);
      distanceAccumulator.current = 0;
      speedSamples.current = [];
      accumulatedTime.current = 0;
      lastPointRef.current = currentLocation
        ? { lat: currentLocation.latitude, lon: currentLocation.longitude }
        : null;

      // Sync initial position to background service
      if (currentLocation) {
        setLastKnownPosition(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.timestamp
        );
      }
    }

    setStatus('tracking');
    trackingStartedAt.current = now;

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Start background location tracking
    const maxAcceptableAccuracy = GPS_ACCURACY_THRESHOLDS[gpsAccuracy] * 2;
    startBackgroundLocationUpdates(maxAcceptableAccuracy).catch((err) => {
      console.error('Failed to start background location:', err);
    });

    // Start elapsed time timer using wall-clock time
    timerRef.current = setInterval(() => {
      setElapsedTime(accumulatedTime.current + (Date.now() - trackingStartedAt.current));
    }, TIMER_UPDATE_INTERVAL_MS);
  }, [status, currentLocation, hapticFeedback, gpsAccuracy]);

  const pauseDrive = useCallback(() => {
    if (status !== 'tracking') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Bank elapsed time before pausing
    accumulatedTime.current += Date.now() - trackingStartedAt.current;
    setElapsedTime(accumulatedTime.current);

    setStatus('paused');

    // Stop background location tracking while paused
    stopBackgroundLocationUpdates().catch((err) => {
      console.error('Failed to stop background location:', err);
    });

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [status, hapticFeedback]);

  const stopDrive = useCallback(() => {
    if (status !== 'tracking' && status !== 'paused') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Merge any remaining background data before saving
    const bgData = getAndClearBackgroundData();
    let finalGpsPoints = gpsPoints;
    let finalMaxSpeed = maxSpeed;
    let finalDistance = distanceAccumulator.current;

    if (bgData.points.length > 0) {
      finalGpsPoints = [...gpsPoints, ...bgData.points];
      finalMaxSpeed = Math.max(maxSpeed, bgData.maxSpeed);
      finalDistance += bgData.distance;
      speedSamples.current.push(...bgData.speedSamples);
    }

    // Stop background location tracking
    stopBackgroundLocationUpdates().catch((err) => {
      console.error('Failed to stop background location:', err);
    });

    // Save drive to history
    if (startTime && finalGpsPoints.length > 0) {
      const completedDrive: Drive = {
        id: `drive_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        vehicleId: defaultVehicleId,
        startTime,
        endTime: Date.now(),
        distance: finalDistance,
        maxSpeed: finalMaxSpeed,
        avgSpeed: speedSamples.current.length > 0
          ? speedSamples.current.reduce((a, b) => a + b, 0) / speedSamples.current.length
          : 0,
        gpsPoints: finalGpsPoints,
        createdAt: Date.now(),
      };
      addDrive(completedDrive);

      // Sync drive to cloud in background
      syncDriveToCloud(completedDrive)
        .then((cloudDrive) => {
          if (cloudDrive) {
            markDriveSynced(completedDrive.id);
          }
        })
        .catch((error) => {
          console.error('Failed to sync drive to cloud:', error);
        });
    }

    setStatus('completed');

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [status, hapticFeedback, startTime, gpsPoints, maxSpeed, defaultVehicleId, addDrive]);

  const resetDrive = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStartTime(null);
    setElapsedTime(0);
    setTotalDistance(0);
    setMaxSpeed(0);
    setCurrentSpeedState(0);
    setGpsPoints([]);
    distanceAccumulator.current = 0;
    speedSamples.current = [];
    lastPointRef.current = null;
    trackingStartedAt.current = 0;
    accumulatedTime.current = 0;

    // Reset background state
    resetBackgroundState();

    if (isAccuracyOk) {
      setStatus('ready');
    } else {
      setStatus('idle');
    }
  }, [isAccuracyOk]);

  // Calculate average speed
  const avgSpeed =
    speedSamples.current.length > 0
      ? speedSamples.current.reduce((a, b) => a + b, 0) / speedSamples.current.length
      : 0;

  return {
    // State
    status,
    startTime,
    elapsedTime,
    totalDistance,
    maxSpeed,
    avgSpeed,
    currentSpeed,
    gpsPoints,

    // GPS
    hasPermission,
    isTracking,
    accuracy,
    isAccuracyOk,
    latitude: currentLocation?.latitude ?? null,
    longitude: currentLocation?.longitude ?? null,

    // Actions
    startDrive,
    pauseDrive,
    stopDrive,
    resetDrive,
  };
}
