import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { useLocation } from './useLocation';
import { calculateDistance } from '../services/locationService';
import { TIMER_UPDATE_INTERVAL_MS } from '../utils/constants';
import type { GPSPoint, Drive } from '../types';

const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;

export type DriveStatus = 'idle' | 'ready' | 'tracking' | 'paused' | 'completed';

export function useDriveTracker() {
  const { gpsAccuracy, hapticFeedback, unitSystem } = useSettingsStore();

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

  // Transition to ready when GPS is good
  useEffect(() => {
    if (status === 'idle' && isTracking && isAccuracyOk) {
      setStatus('ready');
    } else if (status === 'ready' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
  }, [status, isTracking, isAccuracyOk]);

  // Process GPS updates during tracking
  useEffect(() => {
    if (!currentLocation) return;

    const speed = Math.max(0, currentLocation.speed ?? 0);
    setCurrentSpeedState(speed);

    if (status === 'tracking') {
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
        accuracy: currentLocation.accuracy ?? 999,
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
    }
  }, [currentLocation, status, maxSpeed]);

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
      lastPointRef.current = currentLocation
        ? { lat: currentLocation.latitude, lon: currentLocation.longitude }
        : null;
    }

    setStatus('tracking');

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Start elapsed time timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + TIMER_UPDATE_INTERVAL_MS);
    }, TIMER_UPDATE_INTERVAL_MS);
  }, [status, currentLocation, hapticFeedback]);

  const pauseDrive = useCallback(() => {
    if (status !== 'tracking') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('paused');

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

    setStatus('completed');

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [status, hapticFeedback]);

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
