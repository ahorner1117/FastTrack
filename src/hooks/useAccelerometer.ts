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

  // Gravity calibration: collect X-axis samples during settle period to
  // establish a baseline. This baseline is subtracted from subsequent
  // readings so that gravity leaking onto the X-axis (due to phone tilt)
  // does not trigger a false launch.
  // X-axis = forward/backward when phone is mounted with screen facing driver.
  const calibrationSamplesRef = useRef<number[]>([]);
  const baselineXRef = useRef(0);

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
      // Compute gravity baseline from samples collected during settle period
      if (calibrationSamplesRef.current.length > 0) {
        const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
        baselineXRef.current = sum / calibrationSamplesRef.current.length;
      }
      calibrationSamplesRef.current = [];
      settledRef.current = true;
      consecutiveCountRef.current = 0;
    }, SETTLE_PERIOD_MS);

    // Subscribe to accelerometer data
    subscriptionRef.current = Accelerometer.addListener((data) => {
      setRawData(data);

      // During settle period, collect X-axis samples for gravity calibration
      // but don't report acceleration or attempt launch detection
      if (!settledRef.current) {
        calibrationSamplesRef.current.push(data.x);
        setCurrentAcceleration(0);
        return;
      }

      // Use X-axis as forward acceleration (phone mounted with screen facing driver)
      // Subtract calibrated gravity baseline so that phone tilt doesn't
      // register as forward acceleration
      const calibratedAccelG = Math.abs(data.x - baselineXRef.current);
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
