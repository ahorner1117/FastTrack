import { useEffect, useRef, useState } from 'react';
import { calculateDistance } from '../services/locationService';
import type { LocationData } from '../services/locationService';
import type { RunMilestone, UnitSystem, GPSAccuracy } from '../types';
import { useRunStore } from '../stores/runStore';
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
  primaryStartTime: number | null; // Wall-clock launch timestamp from accelerometer
  currentLocation: LocationData | null;
  unitSystem: UnitSystem;
  gpsAccuracy: GPSAccuracy;
}

interface UseSecondaryTimerResult {
  status: SecondaryStatus;
  elapsedTime: number;
  milestones: Milestones;
  maxSpeed: number;
}

/**
 * Secondary "accelerometer timer" — shares the primary accelerometer's launch
 * detection and records milestone times using wall-clock elapsed time
 * (Date.now() − launchTimestamp) instead of GPS timestamps.
 *
 * GPS speed still determines WHEN milestones are crossed; only the elapsed
 * time recorded at each milestone differs from the primary timer.
 */
export function useSecondaryTimer({
  primaryStatus,
  primaryStartTime,
  currentLocation,
  unitSystem,
  gpsAccuracy,
}: UseSecondaryTimerOptions): UseSecondaryTimerResult {
  const setAccelMilestone = useRunStore((state) => state.setAccelMilestone);

  const [status, setStatus] = useState<SecondaryStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [milestones, setMilestones] = useState<Milestones>({});
  const [maxSpeed, setMaxSpeed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const launchTimeRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const totalDistanceRef = useRef(0);
  const milestonesRef = useRef<Milestones>({});
  const statusRef = useRef<SecondaryStatus>('idle');

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Sync with primary timer status
  useEffect(() => {
    if (primaryStatus === 'armed' && statusRef.current === 'idle') {
      // Arm when primary arms — reset all state
      setStatus('armed');
      statusRef.current = 'armed';
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
      milestonesRef.current = {};
      launchTimeRef.current = null;
      lastPointRef.current = null;
      totalDistanceRef.current = 0;
    } else if (primaryStatus === 'running' && statusRef.current === 'armed' && primaryStartTime) {
      // Primary launched — start secondary timer from same accelerometer timestamp
      launchTimeRef.current = primaryStartTime;
      totalDistanceRef.current = 0;
      lastPointRef.current = null;

      setStatus('running');
      statusRef.current = 'running';

      // Start display timer from the accelerometer launch timestamp
      timerRef.current = setInterval(() => {
        if (launchTimeRef.current) {
          setElapsedTime(Date.now() - launchTimeRef.current);
        }
      }, TIMER_UPDATE_INTERVAL_MS);
    } else if (primaryStatus === 'idle' || primaryStatus === 'ready') {
      // Primary reset or disarmed — reset secondary
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      launchTimeRef.current = null;
      lastPointRef.current = null;
      totalDistanceRef.current = 0;
      milestonesRef.current = {};
      setStatus('idle');
      statusRef.current = 'idle';
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
    } else if (primaryStatus === 'completed' && statusRef.current === 'running') {
      // Primary stopped — stop secondary too
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStatus('completed');
      statusRef.current = 'completed';
    }
  }, [primaryStatus, primaryStartTime]);

  // Process GPS updates while running
  useEffect(() => {
    if (!currentLocation || statusRef.current !== 'running' || !launchTimeRef.current) return;

    const rawSpeed = Math.max(0, currentLocation.speed ?? 0);

    // Track max speed
    if (rawSpeed > maxSpeed) {
      setMaxSpeed(rawSpeed);
    }

    // Accuracy filter
    const accuracy = currentLocation.accuracy ?? 999;
    const maxAcceptableAccuracy = GPS_ACCURACY_THRESHOLDS[gpsAccuracy] * 2;
    const isGoodAccuracy = accuracy <= maxAcceptableAccuracy;

    if (isGoodAccuracy) {
      if (lastPointRef.current) {
        const segmentDistance = calculateDistance(
          lastPointRef.current.lat,
          lastPointRef.current.lon,
          currentLocation.latitude,
          currentLocation.longitude
        );
        totalDistanceRef.current += segmentDistance;
      }

      lastPointRef.current = {
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
        timestamp: currentLocation.timestamp,
      };
    }

    // Check milestones — wall-clock elapsed time from accelerometer launch
    const currentElapsed = Date.now() - launchTimeRef.current;
    const distance = totalDistanceRef.current;

    // Speed milestones
    const sixtyThreshold = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.SIXTY_MPH
      : SPEED_THRESHOLDS.SIXTY_KPH;

    if (!milestonesRef.current.zeroToSixty && rawSpeed >= sixtyThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, zeroToSixty: milestone };
      setMilestones({ ...milestonesRef.current });
      setAccelMilestone('zeroToSixty', milestone);
    }

    const hundredThreshold = unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.HUNDRED_MPH
      : SPEED_THRESHOLDS.HUNDRED_KPH;

    if (!milestonesRef.current.zeroToHundred && rawSpeed >= hundredThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, zeroToHundred: milestone };
      setMilestones({ ...milestonesRef.current });
      setAccelMilestone('zeroToHundred', milestone);
    }

    // Distance milestones
    const quarterThreshold = unitSystem === 'imperial'
      ? DISTANCE_THRESHOLDS.QUARTER_MILE
      : DISTANCE_THRESHOLDS.QUARTER_KM;

    if (!milestonesRef.current.quarterMile && distance >= quarterThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, quarterMile: milestone };
      setMilestones({ ...milestonesRef.current });
      setAccelMilestone('quarterMile', milestone);
    }

    const halfThreshold = unitSystem === 'imperial'
      ? DISTANCE_THRESHOLDS.HALF_MILE
      : DISTANCE_THRESHOLDS.HALF_KM;

    if (!milestonesRef.current.halfMile && distance >= halfThreshold) {
      const milestone: RunMilestone = { speed: rawSpeed, time: currentElapsed, distance };
      milestonesRef.current = { ...milestonesRef.current, halfMile: milestone };
      setMilestones({ ...milestonesRef.current });
      setAccelMilestone('halfMile', milestone);
    }
  }, [currentLocation, gpsAccuracy, unitSystem, maxSpeed, setAccelMilestone]);

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
  };
}
