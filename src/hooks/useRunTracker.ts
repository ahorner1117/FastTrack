import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRunStore } from '../stores/runStore';

// Only import expo-haptics on native platforms
const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;
import { useSettingsStore } from '../stores/settingsStore';
import { useLocation } from './useLocation';
import { useAccelerometer } from './useAccelerometer';
import { useHistoryStore } from '../stores/historyStore';
import { calculateDistance } from '../services/locationService';
import { syncRunToCloud } from '../services/syncService';
import {
  SPEED_THRESHOLDS,
  DISTANCE_THRESHOLDS,
  TIMER_UPDATE_INTERVAL_MS,
  GPS_ACCURACY_THRESHOLDS,
} from '../utils/constants';
import type { GPSPoint, Run, RunMilestone } from '../types';


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

  const {
    gpsAccuracy,
    hapticFeedback,
    unitSystem,
    autoSaveRuns,
    launchDetectionThresholdG,
    launchDetectionSampleCount,
    defaultVehicleId,
  } = useSettingsStore();
  const addRun = useHistoryStore((state) => state.addRun);
  const markRunSynced = useHistoryStore((state) => state.markRunSynced);

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
  const lastPointRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const totalDistanceRef = useRef(0);
  const smoothedSpeedRef = useRef(0);
  const SPEED_SMOOTHING_FACTOR = 0.3; // 0 = no smoothing, 1 = no history

  // Launch detection callback - called by accelerometer when launch is detected
  const handleLaunchDetected = useCallback(() => {
    const currentStatus = useRunStore.getState().status;
    if (currentStatus !== 'armed') return;

    const location = currentLocation;
    if (!location) return;

    // Speed gate: only start if below max start speed (prevents rolling starts)
    const currentSpeedMs = Math.max(0, location.speed ?? 0);
    const maxStartSpeed = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.MAX_START_SPEED_MPH
      : SPEED_THRESHOLDS.MAX_START_SPEED_KPH;

    if (currentSpeedMs > maxStartSpeed) {
      // Too fast - ignore this launch detection
      return;
    }

    // Record start point
    startPointRef.current = {
      lat: location.latitude,
      lon: location.longitude,
    };
    lastPointRef.current = {
      lat: location.latitude,
      lon: location.longitude,
      timestamp: location.timestamp,
    };
    totalDistanceRef.current = 0;
    smoothedSpeedRef.current = 0;

    const speed = Math.max(0, location.speed ?? 0);
    const gpsPoint: GPSPoint = {
      latitude: location.latitude,
      longitude: location.longitude,
      speed,
      accuracy: location.accuracy ?? 999,
      timestamp: location.timestamp,
    };

    start(location.timestamp);
    addGpsPoint(gpsPoint);

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Start elapsed time timer
    timerRef.current = setInterval(() => {
      const { startTime } = useRunStore.getState();
      if (startTime) {
        setElapsedTime(Date.now() - startTime);
      }
    }, TIMER_UPDATE_INTERVAL_MS);
  }, [currentLocation, hapticFeedback, unitSystem, start, addGpsPoint, setElapsedTime]);

  // Accelerometer for launch detection - only active when armed
  const { isAvailable: isAccelerometerAvailable, isMonitoring: isAccelerometerMonitoring, currentAcceleration } = useAccelerometer({
    enabled: status === 'armed',
    launchThresholdG: launchDetectionThresholdG,
    consecutiveSamplesRequired: launchDetectionSampleCount,
    onLaunchDetected: handleLaunchDetected,
  });

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

  // Transition to ready when GPS is good (user must manually arm)
  useEffect(() => {
    if (status === 'idle' && isTracking && isAccuracyOk) {
      setStatus('ready');
    } else if (status === 'ready' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
    // If armed but GPS becomes bad, go back to idle
    if (status === 'armed' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
  }, [status, isTracking, isAccuracyOk, setStatus]);

  // Process GPS updates during running state (launch detection handled by accelerometer)
  useEffect(() => {
    if (!currentLocation) return;

    // Use GPS-reported speed (Doppler-derived, more accurate than position deltas)
    const rawSpeed = Math.max(0, currentLocation.speed ?? 0);

    // Apply smoothing for display only
    smoothedSpeedRef.current =
      smoothedSpeedRef.current * (1 - SPEED_SMOOTHING_FACTOR) +
      rawSpeed * SPEED_SMOOTHING_FACTOR;

    setSpeed(rawSpeed);

    // Only process detailed GPS tracking when running
    if (status === 'running') {
      const accuracy = currentLocation.accuracy ?? 999;
      const maxAcceptableAccuracy = GPS_ACCURACY_THRESHOLDS[gpsAccuracy] * 2;
      const isGoodAccuracy = accuracy <= maxAcceptableAccuracy;

      // Record GPS point and distance only if accuracy is acceptable
      if (isGoodAccuracy) {
        const gpsPoint: GPSPoint = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          speed: rawSpeed,
          accuracy,
          timestamp: currentLocation.timestamp,
        };

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
          timestamp: currentLocation.timestamp,
        };
      }

      // Always check milestones using raw GPS speed (no smoothing lag)
      checkSpeedMilestones(rawSpeed, totalDistanceRef.current, currentLocation.timestamp);
      checkDistanceMilestones(rawSpeed, totalDistanceRef.current, currentLocation.timestamp);
    }
  }, [currentLocation, status, gpsAccuracy]);

  const checkSpeedMilestones = useCallback(
    (speed: number, distance: number, gpsTimestamp: number) => {
      const { milestones, startTime } = useRunStore.getState();
      const currentElapsed = startTime ? gpsTimestamp - startTime : 0;

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
    (speed: number, distance: number, gpsTimestamp: number) => {
      const { milestones, startTime } = useRunStore.getState();
      const currentElapsed = startTime ? gpsTimestamp - startTime : 0;

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
        // User manually arms the accelerometer
        // Ensure any stale timer and refs are cleared before arming
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
        arm();
        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        break;

      case 'armed':
        // Cancel armed state and stop listening for launch
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
        reset();
        // Go back to idle, will auto-arm again when GPS is ready
        setStatus('idle');
        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        break;

      case 'running':
        // Stop the timer and clean up refs
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Save run to history if auto-save is enabled
        if (autoSaveRuns) {
          const state = useRunStore.getState();
          if (state.startTime && state.gpsPoints.length > 0) {
            const completedRun: Run = {
              id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              vehicleId: defaultVehicleId,
              startTime: state.startTime,
              endTime: Date.now(),
              milestones: state.milestones,
              maxSpeed: state.maxSpeed,
              gpsPoints: state.gpsPoints,
              createdAt: Date.now(),
              launchDetectionConfig: {
                thresholdG: launchDetectionThresholdG,
                sampleCount: launchDetectionSampleCount,
              },
            };
            addRun(completedRun);

            // Sync run to cloud in background
            syncRunToCloud(completedRun)
              .then((cloudRun) => {
                if (cloudRun) {
                  markRunSynced(completedRun.id);
                }
              })
              .catch((error) => {
                console.error('Failed to sync run to cloud:', error);
              });
          }
        }

        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
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
        smoothedSpeedRef.current = 0;
        if (isAccuracyOk) {
          setStatus('ready');
        } else {
          setStatus('idle');
        }
        break;
    }
  }, [status, hapticFeedback, autoSaveRuns, addRun, markRunSynced, arm, stop, reset, setStatus, isAccuracyOk, launchDetectionThresholdG, launchDetectionSampleCount]);

  // Check if current speed is too fast to start a run
  const maxStartSpeed = unitSystem === 'imperial'
    ? SPEED_THRESHOLDS.MAX_START_SPEED_MPH
    : SPEED_THRESHOLDS.MAX_START_SPEED_KPH;
  const isTooFastToStart = currentSpeed > maxStartSpeed;

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

    // Accelerometer
    isAccelerometerAvailable,
    isAccelerometerMonitoring,
    currentAcceleration,

    // Speed gate
    isTooFastToStart,

    // Actions
    handleButtonPress,
  };
}
