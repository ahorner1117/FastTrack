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

// Settle period after arming before launch detection activates (ms)
// Prevents the button tap motion from triggering a false launch
const SETTLE_PERIOD_MS = 300;

interface UseAccelerometerOptions {
  enabled: boolean;
  launchThresholdG?: number;
  consecutiveSamplesRequired?: number;
  onLaunchDetected: (launchTimestamp: number) => void;
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
  const settledRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLaunchDetectedRef = useRef(onLaunchDetected);

  // Gravity calibration: collect full 3D samples during settle period to
  // establish the gravity vector baseline. This vector is subtracted from
  // subsequent readings so that acceleration detection is orientation-independent
  // (works with phone horizontal, vertical, or at any angle).
  const calibrationSamplesRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const baselineXRef = useRef(0);
  const baselineYRef = useRef(0);
  const baselineZRef = useRef(0);

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
    calibrationSamplesRef.current = [];
    baselineXRef.current = 0;
    baselineYRef.current = 0;
    baselineZRef.current = 0;
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

    // Start settle period — ignore samples briefly to prevent
    // the button tap motion from triggering a false launch.
    // During this period, collect X-axis samples for gravity calibration.
    settledRef.current = false;
    consecutiveCountRef.current = 0;
    calibrationSamplesRef.current = [];
    settleTimerRef.current = setTimeout(() => {
      // Compute full 3D gravity baseline from samples collected during settle period
      const samples = calibrationSamplesRef.current;
      if (samples.length > 0) {
        const sumX = samples.reduce((a, s) => a + s.x, 0);
        const sumY = samples.reduce((a, s) => a + s.y, 0);
        const sumZ = samples.reduce((a, s) => a + s.z, 0);
        baselineXRef.current = sumX / samples.length;
        baselineYRef.current = sumY / samples.length;
        baselineZRef.current = sumZ / samples.length;
      }
      calibrationSamplesRef.current = [];
      settledRef.current = true;
      consecutiveCountRef.current = 0;
    }, SETTLE_PERIOD_MS);

    // Subscribe to accelerometer data
    subscriptionRef.current = Accelerometer.addListener((data) => {
      setRawData(data);

      // During settle period, collect full 3D samples for gravity calibration
      // but don't report acceleration or attempt launch detection
      if (!settledRef.current) {
        calibrationSamplesRef.current.push({ x: data.x, y: data.y, z: data.z });
        setCurrentAcceleration(0);
        return;
      }

      // Subtract calibrated 3D gravity vector, then compute magnitude.
      // This is orientation-independent: works with phone horizontal, vertical,
      // or at any angle since we remove the exact gravity vector measured at rest.
      const dx = data.x - baselineXRef.current;
      const dy = data.y - baselineYRef.current;
      const dz = data.z - baselineZRef.current;
      const calibratedAccelG = Math.sqrt(dx * dx + dy * dy + dz * dz);
      setCurrentAcceleration(calibratedAccelG);

      // Launch detection logic — only after settle/calibration period
      if (!launchDetectedRef.current) {
        if (calibratedAccelG >= launchThresholdG) {
          consecutiveCountRef.current++;

          if (consecutiveCountRef.current >= consecutiveSamplesRequired) {
            launchDetectedRef.current = true;
            onLaunchDetectedRef.current(Date.now());
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
