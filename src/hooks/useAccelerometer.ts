import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Accelerometer update interval in ms (10ms = 100Hz for fast detection)
const ACCELEROMETER_INTERVAL_MS = 10;

// Launch detection threshold in G-force (1G = 9.81 m/s²)
// 0.3G is approximately the acceleration of a typical car launch
const DEFAULT_LAUNCH_THRESHOLD_G = 0.3;

// Number of consecutive samples above threshold to confirm launch
// At 100Hz, 3 samples = 30ms of sustained acceleration
const DEFAULT_CONSECUTIVE_SAMPLES_REQUIRED = 3;

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
      setRawData(data);

      // Use Y-axis as forward acceleration (phone in portrait, screen facing driver)
      // Y-axis directly measures forward/backward acceleration
      // No calibration needed - gravity is on Z-axis in this orientation
      const forwardAccelG = Math.abs(data.y);
      setCurrentAcceleration(forwardAccelG);

      // Launch detection logic
      if (!launchDetectedRef.current) {
        if (forwardAccelG >= launchThresholdG) {
          consecutiveCountRef.current++;

          if (consecutiveCountRef.current >= consecutiveSamplesRequired) {
            launchDetectedRef.current = true;
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
