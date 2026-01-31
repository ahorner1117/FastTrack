import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRunStore } from '../stores/runStore';

// Only import expo-haptics on native platforms
const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;
import { useSettingsStore } from '../stores/settingsStore';
import { useLocation } from './useLocation';
import { calculateDistance } from '../services/locationService';
import {
  SPEED_THRESHOLDS,
  DISTANCE_THRESHOLDS,
  TIMER_UPDATE_INTERVAL_MS,
} from '../utils/constants';
import type { GPSPoint, RunMilestone } from '../types';

// Motion detection threshold (approx 2 mph in m/s)
const MOTION_START_THRESHOLD = 0.894;

export function useRunTracker() {
  const {
    status,
    startTime,
    currentSpeed,
    currentDistance,
    elapsedTime,
    milestones,
    maxSpeed,
    gpsPoints,
    setStatus,
    setSpeed,
    setDistance,
    setElapsedTime,
    setMilestone,
    addGpsPoint,
    arm,
    start,
    stop,
    reset,
  } = useRunStore();

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const totalDistanceRef = useRef(0);

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

  // Update status based on GPS readiness
  useEffect(() => {
    if (status === 'idle' && isTracking && isAccuracyOk) {
      setStatus('ready');
    } else if (status === 'ready' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
  }, [status, isTracking, isAccuracyOk, setStatus]);

  // Process GPS updates during armed/running states
  useEffect(() => {
    if (!currentLocation) return;

    const speed = Math.max(0, currentLocation.speed ?? 0);
    setSpeed(speed);

    // Record GPS point
    const gpsPoint: GPSPoint = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      speed,
      accuracy: currentLocation.accuracy ?? 999,
      timestamp: currentLocation.timestamp,
    };

    if (status === 'armed') {
      // Detect motion start
      if (speed >= MOTION_START_THRESHOLD) {
        // Record start point
        startPointRef.current = {
          lat: currentLocation.latitude,
          lon: currentLocation.longitude,
        };
        lastPointRef.current = {
          lat: currentLocation.latitude,
          lon: currentLocation.longitude,
        };
        totalDistanceRef.current = 0;

        start();
        addGpsPoint(gpsPoint);

        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Start elapsed time timer
        timerRef.current = setInterval(() => {
          const { startTime } = useRunStore.getState();
          if (startTime) {
            setElapsedTime(Date.now() - startTime);
          }
        }, TIMER_UPDATE_INTERVAL_MS);
      }
    } else if (status === 'running') {
      addGpsPoint(gpsPoint);

      // Calculate distance from last point
      if (lastPointRef.current) {
        const segmentDistance = calculateDistance(
          lastPointRef.current.lat,
          lastPointRef.current.lon,
          currentLocation.latitude,
          currentLocation.longitude
        );
        totalDistanceRef.current += segmentDistance;
        setDistance(totalDistanceRef.current);
      }

      lastPointRef.current = {
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
      };

      // Check milestones
      checkSpeedMilestones(speed, totalDistanceRef.current);
      checkDistanceMilestones(speed, totalDistanceRef.current);
    }
  }, [currentLocation, status, hapticFeedback]);

  const checkSpeedMilestones = useCallback(
    (speed: number, distance: number) => {
      const { milestones, elapsedTime, startTime } = useRunStore.getState();
      const currentElapsed = startTime ? Date.now() - startTime : elapsedTime;

      // Check 0-60 (or 0-100 km/h)
      const sixtyThreshold =
        unitSystem === 'imperial'
          ? SPEED_THRESHOLDS.SIXTY_MPH
          : SPEED_THRESHOLDS.SIXTY_KPH;

      if (!milestones.zeroToSixty && speed >= sixtyThreshold) {
        const milestone: RunMilestone = {
          speed,
          time: currentElapsed,
          distance,
        };
        setMilestone('zeroToSixty', milestone);

        if (hapticFeedback && Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Check 0-100 (or 0-160 km/h)
      const hundredThreshold =
        unitSystem === 'imperial'
          ? SPEED_THRESHOLDS.HUNDRED_MPH
          : SPEED_THRESHOLDS.HUNDRED_KPH;

      if (!milestones.zeroToHundred && speed >= hundredThreshold) {
        const milestone: RunMilestone = {
          speed,
          time: currentElapsed,
          distance,
        };
        setMilestone('zeroToHundred', milestone);

        if (hapticFeedback && Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
    [unitSystem, hapticFeedback, setMilestone]
  );

  const checkDistanceMilestones = useCallback(
    (speed: number, distance: number) => {
      const { milestones, elapsedTime, startTime } = useRunStore.getState();
      const currentElapsed = startTime ? Date.now() - startTime : elapsedTime;

      // Check quarter mile
      const quarterThreshold =
        unitSystem === 'imperial'
          ? DISTANCE_THRESHOLDS.QUARTER_MILE
          : DISTANCE_THRESHOLDS.QUARTER_KM;

      if (!milestones.quarterMile && distance >= quarterThreshold) {
        const milestone: RunMilestone = {
          speed,
          time: currentElapsed,
          distance,
        };
        setMilestone('quarterMile', milestone);

        if (hapticFeedback && Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Check half mile
      const halfThreshold =
        unitSystem === 'imperial'
          ? DISTANCE_THRESHOLDS.HALF_MILE
          : DISTANCE_THRESHOLDS.HALF_KM;

      if (!milestones.halfMile && distance >= halfThreshold) {
        const milestone: RunMilestone = {
          speed,
          time: currentElapsed,
          distance,
        };
        setMilestone('halfMile', milestone);

        if (hapticFeedback && Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
    [unitSystem, hapticFeedback, setMilestone]
  );

  const handleButtonPress = useCallback(() => {
    switch (status) {
      case 'ready':
        arm();
        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        break;

      case 'armed':
        // Cancel armed state
        reset();
        setStatus('ready');
        break;

      case 'running':
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stop();
        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        break;

      case 'completed':
        // Reset for new run
        reset();
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        if (isAccuracyOk) {
          setStatus('ready');
        } else {
          setStatus('idle');
        }
        break;
    }
  }, [status, hapticFeedback, arm, stop, reset, setStatus, isAccuracyOk]);

  return {
    // State
    status,
    currentSpeed,
    currentDistance,
    elapsedTime,
    milestones,
    maxSpeed,

    // GPS
    hasPermission,
    isTracking,
    accuracy,
    isAccuracyOk,
    latitude: currentLocation?.latitude ?? null,
    longitude: currentLocation?.longitude ?? null,

    // Actions
    handleButtonPress,
  };
}
