import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Accelerometer update interval in ms (10ms = 100Hz for fast detection)
const ACCELEROMETER_INTERVAL_MS = 10;

// Default launch detection threshold in G-force (1G = 9.81 m/s²)
// 0.25G is sensitive enough to catch quick starts but won't trigger from hand movement
// A typical brisk car acceleration is 0.2-0.5G
const DEFAULT_LAUNCH_THRESHOLD_G = 0.4;

// Default number of consecutive samples above threshold to confirm launch
// At 100Hz, 2 samples = 20ms - filters brief impulses while still being responsive
const DEFAULT_CONSECUTIVE_SAMPLES_REQUIRED = 4

// Gravity constant
const GRAVITY = 9.81;

// UI update throttle (don't update React state on every sample)
const UI_UPDATE_INTERVAL_MS = 100;

interface UseAccelerometerOptions {
  enabled: boolean;
  launchThresholdG?: number;
  consecutiveSamplesRequired?: number;
  onLaunchDetected: () => void;
}

interface AccelerometerState {
  isAvailable: boolean;
  isMonitoring: boolean;
  currentAcceleration: number; // Forward acceleration in G
  rawData: AccelerometerMeasurement | null;
}

export function useAccelerometer({
  enabled,
  launchThresholdG = DEFAULT_LAUNCH_THRESHOLD_G,
  consecutiveSamplesRequired = DEFAULT_CONSECUTIVE_SAMPLES_REQUIRED,
  onLaunchDetected,
}: UseAccelerometerOptions): AccelerometerState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentAcceleration, setCurrentAcceleration] = useState(0);
  const [rawData, setRawData] = useState<AccelerometerMeasurement | null>(null);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const consecutiveCountRef = useRef(0);
  const launchDetectedRef = useRef(false);
  const onLaunchDetectedRef = useRef(onLaunchDetected);
  const lastUIUpdateRef = useRef(0);
  const baselineRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const calibrationSamplesRef = useRef<Array<{ x: number; y: number; z: number }>>([]);

  // Keep callback ref updated
  useEffect(() => {
    onLaunchDetectedRef.current = onLaunchDetected;
  }, [onLaunchDetected]);

  // Check availability on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      return;
    }

    Accelerometer.isAvailableAsync().then(setIsAvailable);
  }, []);

  // Reset launch detection state
  const resetLaunchDetection = useCallback(() => {
    consecutiveCountRef.current = 0;
    launchDetectedRef.current = false;
    baselineRef.current = null;
    calibrationSamplesRef.current = [];
  }, []);

  // Start/stop monitoring based on enabled state
  useEffect(() => {
    if (!isAvailable || !enabled) {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setIsMonitoring(false);
      resetLaunchDetection();
      return;
    }

    // Set update interval
    Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL_MS);

    // Subscribe to accelerometer data
    subscriptionRef.current = Accelerometer.addListener((data) => {
      const now = Date.now();

      // Calibration phase: collect baseline samples when stationary
      // This captures the phone's orientation and gravity vector
      if (!baselineRef.current) {
        calibrationSamplesRef.current.push({ x: data.x, y: data.y, z: data.z });

        // Collect 10 samples (100ms) for calibration
        if (calibrationSamplesRef.current.length >= 10) {
          const samples = calibrationSamplesRef.current;
          baselineRef.current = {
            x: samples.reduce((sum, s) => sum + s.x, 0) / samples.length,
            y: samples.reduce((sum, s) => sum + s.y, 0) / samples.length,
            z: samples.reduce((sum, s) => sum + s.z, 0) / samples.length,
          };
        }
        return;
      }

      // Calculate acceleration delta from baseline (removes gravity effect)
      // This works regardless of phone orientation
      const deltaX = data.x - baselineRef.current.x;
      const deltaY = data.y - baselineRef.current.y;
      const deltaZ = data.z - baselineRef.current.z;

      // Combined magnitude of acceleration change
      const accelerationMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

      // Throttle UI updates to avoid React overhead (but detection runs at full speed)
      if (now - lastUIUpdateRef.current >= UI_UPDATE_INTERVAL_MS) {
        setRawData(data);
        setCurrentAcceleration(accelerationMagnitude);
        lastUIUpdateRef.current = now;
      }

      // Launch detection logic - runs at full 100Hz
      if (!launchDetectedRef.current) {
        if (accelerationMagnitude >= launchThresholdG) {
          consecutiveCountRef.current++;

          if (consecutiveCountRef.current >= consecutiveSamplesRequired) {
            launchDetectedRef.current = true;
            // Update UI immediately on launch
            setCurrentAcceleration(accelerationMagnitude);
            onLaunchDetectedRef.current();
          }
        } else {
          // Reset counter if acceleration drops below threshold
          consecutiveCountRef.current = 0;
        }
      }
    });

    setIsMonitoring(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      setIsMonitoring(false);
    };
  }, [isAvailable, enabled, launchThresholdG, consecutiveSamplesRequired, resetLaunchDetection]);

  return {
    isAvailable,
    isMonitoring,
    currentAcceleration,
    rawData,
  };
}
