import { useEffect, useRef, useState } from 'react';
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import type { RunMilestone, UnitSystem } from '../types';
import { useRunStore } from '../stores/runStore';
import {
  SPEED_THRESHOLDS,
  DISTANCE_THRESHOLDS,
  SPEED_MILESTONE_THRESHOLDS_MPH,
  TIMER_UPDATE_INTERVAL_MS,
} from '../utils/constants';

type PrimaryStatus = 'idle' | 'ready' | 'armed' | 'running' | 'completed';
type SecondaryStatus = 'idle' | 'armed' | 'running' | 'completed';

// Accelerometer update interval (10ms = 100Hz)
const ACCEL_INTERVAL_MS = 10;

// Gravity constant
const GRAVITY_MS2 = 9.81;

// Number of calibration samples to average for gravity baseline
const CALIBRATION_SAMPLES = 30; // 300ms at 100Hz

// Dead zone: ignore acceleration below this threshold (in G) to prevent
// sensor noise from accumulating into phantom speed via integration drift.
const NOISE_DEAD_ZONE_G = 0.05;

interface Milestones {
  zeroToSixty?: RunMilestone;
  zeroToHundred?: RunMilestone;
  quarterMile?: RunMilestone;
  halfMile?: RunMilestone;
  speedMilestones?: Record<number, RunMilestone>;
}

interface UseSecondaryTimerOptions {
  primaryStatus: PrimaryStatus;
  primaryStartTime: number | null; // Wall-clock launch timestamp from accelerometer
  unitSystem: UnitSystem;
}

interface UseSecondaryTimerResult {
  status: SecondaryStatus;
  elapsedTime: number;
  milestones: Milestones;
  maxSpeed: number;
  currentSpeed: number; // m/s — accelerometer-derived speed
}

/**
 * Secondary "accelerometer timer" — uses ONLY accelerometer data to compute
 * speed via integration (no GPS). Shares the primary accelerometer's launch
 * detection timestamp but independently tracks velocity by integrating
 * measured acceleration at 100Hz (10ms intervals).
 *
 * Speed = integral of (net forward acceleration) over time.
 * Distance = integral of speed over time.
 *
 * Gravity baseline is calibrated while armed (stationary).
 */
export function useSecondaryTimer({
  primaryStatus,
  primaryStartTime,
  unitSystem,
}: UseSecondaryTimerOptions): UseSecondaryTimerResult {
  const setAccelMilestone = useRunStore((state) => state.setAccelMilestone);
  const setAccelSpeedMilestone = useRunStore((state) => state.setAccelSpeedMilestone);

  const [status, setStatus] = useState<SecondaryStatus>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [milestones, setMilestones] = useState<Milestones>({});
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const launchTimeRef = useRef<number | null>(null);
  const milestonesRef = useRef<Milestones>({});
  const statusRef = useRef<SecondaryStatus>('idle');

  // Accelerometer integration state
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const speedRef = useRef(0); // m/s — integrated from acceleration
  const distanceRef = useRef(0); // meters — integrated from speed
  const maxSpeedRef = useRef(0);
  const lastSampleTimeRef = useRef<number | null>(null);

  // Gravity calibration — X-axis baseline (matches primary accelerometer)
  const baselineXRef = useRef(0);
  const calibrationSamplesRef = useRef<number[]>([]);
  const isCalibrated = useRef(false);

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Cleanup accelerometer subscription
  const cleanupAccel = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  };

  // Start accelerometer subscription for calibration (while armed)
  // Collects X-axis samples to establish gravity baseline, matching primary accelerometer.
  const startCalibration = () => {
    cleanupAccel();
    calibrationSamplesRef.current = [];
    isCalibrated.current = false;

    Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);

    subscriptionRef.current = Accelerometer.addListener((data: AccelerometerMeasurement) => {
      calibrationSamplesRef.current.push(data.x);

      if (calibrationSamplesRef.current.length >= CALIBRATION_SAMPLES) {
        const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
        baselineXRef.current = sum / calibrationSamplesRef.current.length;
        isCalibrated.current = true;
      }
    });
  };

  // Start accelerometer subscription for speed integration (while running)
  const startIntegration = () => {
    cleanupAccel();
    speedRef.current = 0;
    distanceRef.current = 0;
    maxSpeedRef.current = 0;
    lastSampleTimeRef.current = Date.now();

    Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);

    subscriptionRef.current = Accelerometer.addListener((data: AccelerometerMeasurement) => {
      const now = Date.now();
      const prevTime = lastSampleTimeRef.current;
      if (!prevTime) {
        lastSampleTimeRef.current = now;
        return;
      }

      const dtMs = now - prevTime;
      lastSampleTimeRef.current = now;

      // Skip unreasonable dt (> 100ms means we missed samples)
      if (dtMs <= 0 || dtMs > 100) return;

      const dtSec = dtMs / 1000;

      // Use X-axis only (forward direction), subtract calibrated gravity baseline
      const netAccelG = Math.abs(data.x - baselineXRef.current);

      // Dead zone: ignore sensor noise below threshold to prevent drift
      if (netAccelG < NOISE_DEAD_ZONE_G) return;

      // Convert G to m/s² and integrate acceleration → velocity
      const netAccelMs2 = netAccelG * GRAVITY_MS2;
      speedRef.current += netAccelMs2 * dtSec;

      // Integrate velocity → distance
      distanceRef.current += speedRef.current * dtSec;

      // Track max speed
      if (speedRef.current > maxSpeedRef.current) {
        maxSpeedRef.current = speedRef.current;
        setMaxSpeed(maxSpeedRef.current);
      }

      // Update display speed
      setCurrentSpeed(speedRef.current);

      // Check milestones
      if (!launchTimeRef.current) return;
      const currentElapsed = now - launchTimeRef.current;
      const speed = speedRef.current;
      const distance = distanceRef.current;

      // --- Speed milestones (granular 10 mph increments) ---
      for (const { mph, threshold } of SPEED_MILESTONE_THRESHOLDS_MPH) {
        if (!milestonesRef.current.speedMilestones?.[mph] && speed >= threshold) {
          const milestone: RunMilestone = { speed, time: currentElapsed, distance };
          milestonesRef.current = {
            ...milestonesRef.current,
            speedMilestones: {
              ...milestonesRef.current.speedMilestones,
              [mph]: milestone,
            },
          };
          setMilestones({ ...milestonesRef.current });
          setAccelSpeedMilestone(mph, milestone);
        }
      }

      // --- 0-60 / 0-100 milestones ---
      const sixtyThreshold = unitSystem === 'imperial'
        ? SPEED_THRESHOLDS.SIXTY_MPH
        : SPEED_THRESHOLDS.SIXTY_KPH;

      if (!milestonesRef.current.zeroToSixty && speed >= sixtyThreshold) {
        const milestone: RunMilestone = { speed, time: currentElapsed, distance };
        milestonesRef.current = { ...milestonesRef.current, zeroToSixty: milestone };
        setMilestones({ ...milestonesRef.current });
        setAccelMilestone('zeroToSixty', milestone);
      }

      const hundredThreshold = unitSystem === 'imperial'
        ? SPEED_THRESHOLDS.HUNDRED_MPH
        : SPEED_THRESHOLDS.HUNDRED_KPH;

      if (!milestonesRef.current.zeroToHundred && speed >= hundredThreshold) {
        const milestone: RunMilestone = { speed, time: currentElapsed, distance };
        milestonesRef.current = { ...milestonesRef.current, zeroToHundred: milestone };
        setMilestones({ ...milestonesRef.current });
        setAccelMilestone('zeroToHundred', milestone);
      }

      // --- Distance milestones ---
      const quarterThreshold = unitSystem === 'imperial'
        ? DISTANCE_THRESHOLDS.QUARTER_MILE
        : DISTANCE_THRESHOLDS.QUARTER_KM;

      if (!milestonesRef.current.quarterMile && distance >= quarterThreshold) {
        const milestone: RunMilestone = { speed, time: currentElapsed, distance };
        milestonesRef.current = { ...milestonesRef.current, quarterMile: milestone };
        setMilestones({ ...milestonesRef.current });
        setAccelMilestone('quarterMile', milestone);
      }

      const halfThreshold = unitSystem === 'imperial'
        ? DISTANCE_THRESHOLDS.HALF_MILE
        : DISTANCE_THRESHOLDS.HALF_KM;

      if (!milestonesRef.current.halfMile && distance >= halfThreshold) {
        const milestone: RunMilestone = { speed, time: currentElapsed, distance };
        milestonesRef.current = { ...milestonesRef.current, halfMile: milestone };
        setMilestones({ ...milestonesRef.current });
        setAccelMilestone('halfMile', milestone);
      }
    });
  };

  // Sync with primary timer status
  useEffect(() => {
    if (primaryStatus === 'armed' && statusRef.current === 'idle') {
      // Arm — reset all state and start gravity calibration
      setStatus('armed');
      statusRef.current = 'armed';
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
      setCurrentSpeed(0);
      milestonesRef.current = {};
      launchTimeRef.current = null;
      speedRef.current = 0;
      distanceRef.current = 0;
      maxSpeedRef.current = 0;
      lastSampleTimeRef.current = null;

      // Start calibration while stationary
      startCalibration();

    } else if (primaryStatus === 'running' && statusRef.current === 'armed' && primaryStartTime) {
      // Primary launched — start integration from same accelerometer timestamp
      launchTimeRef.current = primaryStartTime;

      setStatus('running');
      statusRef.current = 'running';

      // Start accelerometer integration for speed tracking
      startIntegration();

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
      cleanupAccel();
      launchTimeRef.current = null;
      speedRef.current = 0;
      distanceRef.current = 0;
      maxSpeedRef.current = 0;
      lastSampleTimeRef.current = null;
      milestonesRef.current = {};
      isCalibrated.current = false;
      calibrationSamplesRef.current = [];
      setStatus('idle');
      statusRef.current = 'idle';
      setElapsedTime(0);
      setMilestones({});
      setMaxSpeed(0);
      setCurrentSpeed(0);

    } else if (primaryStatus === 'completed' && statusRef.current === 'running') {
      // Primary stopped — stop secondary too
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      cleanupAccel();
      setStatus('completed');
      statusRef.current = 'completed';
    }
  }, [primaryStatus, primaryStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      cleanupAccel();
    };
  }, []);

  return {
    status,
    elapsedTime,
    milestones,
    maxSpeed,
    currentSpeed,
  };
}
