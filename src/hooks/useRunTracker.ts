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
  SPEED_MILESTONE_THRESHOLDS_MPH,
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
    setSpeedMilestone,
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
  const timerStartRef = useRef<number | null>(null);
  const startPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const totalDistanceRef = useRef(0);
  const smoothedSpeedRef = useRef(0);
  const gpsStartTimeRef = useRef<number | null>(null);
  const prevGpsSpeedRef = useRef(0);
  const prevGpsTimestampRef = useRef<number | null>(null);
  const SPEED_SMOOTHING_FACTOR = 0.3; // 0 = no smoothing, 1 = no history

  // Launch detection callback - called by accelerometer when launch is detected
  // launchTimestamp is the wall-clock time (Date.now()) captured by the accelerometer
  const handleLaunchDetected = useCallback((launchTimestamp: number) => {
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
    prevGpsSpeedRef.current = 0;
    prevGpsTimestampRef.current = null;

    const speed = Math.max(0, location.speed ?? 0);
    const gpsPoint: GPSPoint = {
      latitude: location.latitude,
      longitude: location.longitude,
      speed,
      accuracy: location.accuracy ?? 999,
      timestamp: location.timestamp,
    };

    // Use wall-clock launch timestamp for milestone calculations too.
    // Previously this used location.timestamp, but that GPS reading can be
    // stale (1-3+ seconds old) since GPS updates at ~1Hz while the
    // accelerometer fires at 100Hz. On iOS, GPS timestamps share the same
    // system clock as Date.now(), so using launchTimestamp keeps milestones
    // consistent with the display timer.
    gpsStartTimeRef.current = launchTimestamp;

    // Use wall-clock launch timestamp for run start (consistent with endTime)
    start(launchTimestamp);
    addGpsPoint(gpsPoint);

    if (hapticFeedback && Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Start elapsed time timer from the exact launch moment
    timerStartRef.current = launchTimestamp;
    timerRef.current = setInterval(() => {
      if (timerStartRef.current) {
        setElapsedTime(Date.now() - timerStartRef.current);
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
      timerStartRef.current = null;
    };
  }, [startTracking, stopTracking]);

  // Transition to ready when GPS is good (user must manually arm)
  // Read status from the store directly to avoid a dependency cycle where
  // setStatus changes `status`, re-triggering the effect, causing infinite loops.
  useEffect(() => {
    const current = useRunStore.getState().status;
    if (current === 'idle' && isTracking && isAccuracyOk) {
      setStatus('ready');
    } else if (current === 'ready' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    } else if (current === 'armed' && (!isTracking || !isAccuracyOk)) {
      setStatus('idle');
    }
  }, [isTracking, isAccuracyOk, setStatus]);

  // Handle external status resets (e.g. auth sign-in resets store to idle)
  useEffect(() => {
    const unsub = useRunStore.subscribe((state) => {
      if (state.status === 'idle' && isTracking && isAccuracyOk) {
        setStatus('ready');
      }
    });
    return unsub;
  }, [isTracking, isAccuracyOk, setStatus]);

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

      // Check milestones — interpolate between GPS points for sub-second precision
      checkSpeedMilestones(
        rawSpeed,
        totalDistanceRef.current,
        currentLocation.timestamp,
        prevGpsSpeedRef.current,
        prevGpsTimestampRef.current,
      );
      checkDistanceMilestones(rawSpeed, totalDistanceRef.current, currentLocation.timestamp);

      // Update previous GPS reading for next interpolation
      prevGpsSpeedRef.current = rawSpeed;
      prevGpsTimestampRef.current = currentLocation.timestamp;
    }
  }, [currentLocation, status, gpsAccuracy]);

  // Interpolate the timestamp when speed crossed a threshold between two GPS readings.
  // If previous data is available and the threshold falls between prevSpeed and currentSpeed,
  // linearly interpolate the crossing time. Otherwise fall back to the current GPS timestamp.
  const interpolateThresholdTime = useCallback(
    (
      threshold: number,
      currentSpeed: number,
      currentTimestamp: number,
      prevSpeed: number,
      prevTimestamp: number | null,
    ): number => {
      if (prevTimestamp !== null && currentSpeed > prevSpeed) {
        const fraction = (threshold - prevSpeed) / (currentSpeed - prevSpeed);
        return prevTimestamp + fraction * (currentTimestamp - prevTimestamp);
      }
      return currentTimestamp;
    },
    []
  );

  const checkSpeedMilestones = useCallback(
    (
      speed: number,
      distance: number,
      gpsTimestamp: number,
      prevSpeed: number,
      prevTimestamp: number | null,
    ) => {
      const { milestones } = useRunStore.getState();

      // Check 0-60 (or 0-100 km/h)
      const sixtyThreshold =
        unitSystem === 'imperial'
          ? SPEED_THRESHOLDS.SIXTY_MPH
          : SPEED_THRESHOLDS.SIXTY_KPH;

      if (!milestones.zeroToSixty && speed >= sixtyThreshold) {
        const crossingTimestamp = interpolateThresholdTime(sixtyThreshold, speed, gpsTimestamp, prevSpeed, prevTimestamp);
        const elapsed = gpsStartTimeRef.current ? crossingTimestamp - gpsStartTimeRef.current : 0;
        setMilestone('zeroToSixty', { speed, time: elapsed, distance });

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
        const crossingTimestamp = interpolateThresholdTime(hundredThreshold, speed, gpsTimestamp, prevSpeed, prevTimestamp);
        const elapsed = gpsStartTimeRef.current ? crossingTimestamp - gpsStartTimeRef.current : 0;
        setMilestone('zeroToHundred', { speed, time: elapsed, distance });

        if (hapticFeedback && Haptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Check granular speed milestones (every 10 mph)
      if (unitSystem === 'imperial') {
        const existing = milestones.speedMilestones ?? {};
        for (const { mph, threshold } of SPEED_MILESTONE_THRESHOLDS_MPH) {
          if (!existing[mph] && speed >= threshold) {
            const crossingTimestamp = interpolateThresholdTime(threshold, speed, gpsTimestamp, prevSpeed, prevTimestamp);
            const elapsed = gpsStartTimeRef.current ? crossingTimestamp - gpsStartTimeRef.current : 0;
            setSpeedMilestone(mph, { speed, time: elapsed, distance });
          }
        }
      }
    },
    [unitSystem, hapticFeedback, setMilestone, setSpeedMilestone, interpolateThresholdTime]
  );

  const checkDistanceMilestones = useCallback(
    (speed: number, distance: number, gpsTimestamp: number) => {
      const { milestones } = useRunStore.getState();
      const currentElapsed = gpsStartTimeRef.current ? gpsTimestamp - gpsStartTimeRef.current : 0;

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
        timerStartRef.current = null;
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
        gpsStartTimeRef.current = null;
        prevGpsSpeedRef.current = 0;
        prevGpsTimestampRef.current = null;
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
        timerStartRef.current = null;
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
        gpsStartTimeRef.current = null;
        prevGpsSpeedRef.current = 0;
        prevGpsTimestampRef.current = null;
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
        timerStartRef.current = null;

        // Save run to history if auto-save is enabled
        if (autoSaveRuns) {
          const state = useRunStore.getState();
          if (state.startTime && state.gpsPoints.length > 0) {
            const accelMilestones = useRunStore.getState().accelMilestones;
            const completedRun: Run = {
              id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              vehicleId: defaultVehicleId,
              startTime: state.startTime,
              endTime: Date.now(),
              milestones: state.milestones,
              accelMilestones: Object.keys(accelMilestones).length > 0 ? accelMilestones : undefined,
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
        gpsStartTimeRef.current = null;
        prevGpsSpeedRef.current = 0;
        prevGpsTimestampRef.current = null;
        stop();
        if (hapticFeedback && Haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        break;

      case 'completed':
        // Reset for new run
        reset();
        timerStartRef.current = null;
        startPointRef.current = null;
        lastPointRef.current = null;
        totalDistanceRef.current = 0;
        smoothedSpeedRef.current = 0;
        gpsStartTimeRef.current = null;
        prevGpsSpeedRef.current = 0;
        prevGpsTimestampRef.current = null;
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
    startTime,
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
    currentLocation,
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
