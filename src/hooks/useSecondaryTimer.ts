import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateDistance } from '../services/locationService';
import type { LocationData } from '../services/locationService';
import type { RunMilestone, UnitSystem, GPSAccuracy } from '../types';
import {
  SPEED_THRESHOLDS,
  DISTANCE_THRESHOLDS,
  TIMER_UPDATE_INTERVAL_MS,
  GPS_ACCURACY_THRESHOLDS,
} from '../utils/constants';

type PrimaryStatus = 'idle' | 'ready' | 'armed' | 'running' | 'completed';
type SecondaryStatus = 'idle' | 'armed' | 'running' | 'completed';

interface Milestones {
  zeroToSixty?: RunMilestone;
  zeroToHundred?: RunMilestone;
  quarterMile?: RunMilestone;
  halfMile?: RunMilestone;
}

interface UseSecondaryTimerOptions {
  primaryStatus: PrimaryStatus;
  primaryStartTime: number | null;
  currentLocation: LocationData | null;
  unitSystem: UnitSystem;
  gpsAccuracy: GPSAccuracy;
}

interface UseSecondaryTimerResult {
  status: SecondaryStatus;
  elapsedTime: number;
  milestones: Milestones;
  maxSpeed: number;
  launchDelta: number | null;
  handleLaunchDetected: () => void;
}

export function useSecondaryTimer({
  primaryStatus,
  primaryStartTime,
  currentLocation,
  unitSystem,
  gpsAccuracy,
}: UseSecondaryTimerOptions): UseSecondaryTimerResult {
  const [status, setStatus] = useState<SecondaryStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [milestones, setMilestones] = useState<Milestones>({});
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [launchDelta, setLaunchDelta] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const totalDistanceRef = useRef(0);
  const smoothedSpeedRef = useRef(0);
  const milestonesRef = useRef<Milestones>({});
  const statusRef = useRef<SecondaryStatus>('idle');

  const SPEED_SMOOTHING_FACTOR = 0.3;

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Arm when primary arms, reset when primary completes/idles
  useEffect(() => {
    if (primaryStatus === 'armed' && statusRef.current === 'idle') {
      setStatus('armed');
      statusRef.current = 'armed';
      // Reset state
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
      setLaunchDelta(null);
      milestonesRef.current = {};
      startTimeRef.current = null;
      lastPointRef.current = null;
      totalDistanceRef.current = 0;
      smoothedSpeedRef.current = 0;
    } else if (primaryStatus === 'idle' || primaryStatus === 'ready') {
      // Primary reset or disarmed — reset secondary
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartRef.current = null;
      startTimeRef.current = null;
      lastPointRef.current = null;
      totalDistanceRef.current = 0;
      smoothedSpeedRef.current = 0;
      milestonesRef.current = {};
      setStatus('idle');
      statusRef.current = 'idle';
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
      setLaunchDelta(null);
    } else if (primaryStatus === 'completed' && statusRef.current === 'running') {
      // Primary stopped — stop secondary too
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerStartRef.current = null;
      setStatus('completed');
      statusRef.current = 'completed';
    }
  }, [primaryStatus]);

  // Handle launch detected from magnitude accelerometer
  const handleLaunchDetected = useCallback(() => {
    if (statusRef.current !== 'armed') return;

    const location = currentLocation;
    if (!location) return;

    // Speed gate: only start if below max start speed
    const currentSpeedMs = Math.max(0, location.speed ?? 0);
    const maxStartSpeed = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.MAX_START_SPEED_MPH
      : SPEED_THRESHOLDS.MAX_START_SPEED_KPH;

    if (currentSpeedMs > maxStartSpeed) return;

    // Record start point
    lastPointRef.current = {
      lat: location.latitude,
      lon: location.longitude,
      timestamp: location.timestamp,
    };
    totalDistanceRef.current = 0;
    smoothedSpeedRef.current = 0;
    startTimeRef.current = location.timestamp;

    setStatus('running');
    statusRef.current = 'running';

    // Compute launch delta vs primary
    if (primaryStartTime) {
      setLaunchDelta(location.timestamp - primaryStartTime);
    }

    // Start elapsed time timer
    const wallClockStart = Date.now();
    timerStartRef.current = wallClockStart;
    timerRef.current = setInterval(() => {
      if (timerStartRef.current) {
        setElapsedTime(Date.now() - timerStartRef.current);
      }
    }, TIMER_UPDATE_INTERVAL_MS);
  }, [currentLocation, unitSystem, primaryStartTime]);

  // Process GPS updates while running
  useEffect(() => {
    if (!currentLocation || statusRef.current !== 'running') return;

    const rawSpeed = Math.max(0, currentLocation.speed ?? 0);

    // Apply smoothing
    smoothedSpeedRef.current =
      smoothedSpeedRef.current * (1 - SPEED_SMOOTHING_FACTOR) +
      rawSpeed * SPEED_SMOOTHING_FACTOR;

    // Track max speed
    if (rawSpeed > maxSpeed) {
      setMaxSpeed(rawSpeed);
    }

    // Accuracy filter
    const accuracy = currentLocation.accuracy ?? 999;
    const maxAcceptableAccuracy = GPS_ACCURACY_THRESHOLDS[gpsAccuracy] * 2;
    const isGoodAccuracy = accuracy <= maxAcceptableAccuracy;

    if (isGoodAccuracy && lastPointRef.current) {
      const segmentDistance = calculateDistance(
        lastPointRef.current.lat,
        lastPointRef.current.lon,
        currentLocation.latitude,
        currentLocation.longitude
      );
      totalDistanceRef.current += segmentDistance;

      lastPointRef.current = {
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
        timestamp: currentLocation.timestamp,
      };
    }

    // Check milestones
    const currentElapsed = startTimeRef.current
      ? currentLocation.timestamp - startTimeRef.current
      : 0;
    const distance = totalDistanceRef.current;

    // Speed milestones
    const sixtyThreshold = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.SIXTY_MPH
      : SPEED_THRESHOLDS.SIXTY_KPH;

    if (!milestonesRef.current.zeroToSixty && rawSpeed >= sixtyThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, zeroToSixty: milestone };
      setMilestones({ ...milestonesRef.current });
    }

    const hundredThreshold = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.HUNDRED_MPH
      : SPEED_THRESHOLDS.HUNDRED_KPH;

    if (!milestonesRef.current.zeroToHundred && rawSpeed >= hundredThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, zeroToHundred: milestone };
      setMilestones({ ...milestonesRef.current });
    }

    // Distance milestones
    const quarterThreshold = unitSystem === 'imperial'
      ? DISTANCE_THRESHOLDS.QUARTER_MILE
      : DISTANCE_THRESHOLDS.QUARTER_KM;

    if (!milestonesRef.current.quarterMile && distance >= quarterThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, quarterMile: milestone };
      setMilestones({ ...milestonesRef.current });
    }

    const halfThreshold = unitSystem === 'imperial'
      ? DISTANCE_THRESHOLDS.HALF_MILE
      : DISTANCE_THRESHOLDS.HALF_KM;

    if (!milestonesRef.current.halfMile && distance >= halfThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, halfMile: milestone };
      setMilestones({ ...milestonesRef.current });
    }
  }, [currentLocation, gpsAccuracy, unitSystem, maxSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    elapsedTime,
    milestones,
    maxSpeed,
    launchDelta,
    handleLaunchDetected,
  };
}
