import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Accelerometer update interval in ms (10ms = 100Hz for fast detection)
const ACCELEROMETER_INTERVAL_MS = 10;

// Launch detection threshold in G-force (1G = 9.81 m/s²)
const DEFAULT_LAUNCH_THRESHOLD_G = 0.3;

// Number of consecutive samples above threshold to confirm launch
const DEFAULT_CONSECUTIVE_SAMPLES_REQUIRED = 3;

// Settle period after arming before launch detection activates (ms)
const SETTLE_PERIOD_MS = 300;

interface UseMagnitudeAccelerometerOptions {
  enabled: boolean;
  launchThresholdG?: number;
  consecutiveSamplesRequired?: number;
  onLaunchDetected: () => void;
}

interface MagnitudeAccelerometerState {
  isAvailable: boolean;
  isMonitoring: boolean;
  currentAcceleration: number; // Magnitude-based acceleration in G
  rawData: AccelerometerMeasurement | null;
}

export function useMagnitudeAccelerometer({
  enabled,
  launchThresholdG = DEFAULT_LAUNCH_THRESHOLD_G,
  consecutiveSamplesRequired = DEFAULT_CONSECUTIVE_SAMPLES_REQUIRED,
  onLaunchDetected,
}: UseMagnitudeAccelerometerOptions): MagnitudeAccelerometerState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentAcceleration, setCurrentAcceleration] = useState(0);
  const [rawData, setRawData] = useState<AccelerometerMeasurement | null>(null);

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const consecutiveCountRef = useRef(0);
  const launchDetectedRef = useRef(false);
  const settledRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    settledRef.current = false;
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
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

    // Start settle period
    settledRef.current = false;
    consecutiveCountRef.current = 0;
    settleTimerRef.current = setTimeout(() => {
      settledRef.current = true;
      consecutiveCountRef.current = 0;
    }, SETTLE_PERIOD_MS);

    // Subscribe to accelerometer data
    subscriptionRef.current = Accelerometer.addListener((data) => {
      setRawData(data);

      // Magnitude-based detection: sqrt(x^2 + y^2 + z^2) - 1G
      // This captures acceleration in any direction, regardless of phone orientation
      const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
      const accelerationG = Math.abs(magnitude - 1);
      setCurrentAcceleration(accelerationG);

      // Launch detection logic — only after settle period
      if (!launchDetectedRef.current && settledRef.current) {
        if (accelerationG >= launchThresholdG) {
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
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
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
