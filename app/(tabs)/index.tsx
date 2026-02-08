import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View, Text } from 'react-native';
import {
  GPSStatus,
  LaunchStatus,
  LocationMap,
  MetricsGrid,
  SpeedDisplay,
  StartButton,
  StatsFooter,
  TimerDisplay,
  ModeSelector,
  DriveStats,
  DriveButton,
  VehicleSelector,
  SecondaryTimerDisplay,
} from '../../src/components/Timer';
import { useVehicleStore } from '../../src/stores/vehicleStore';
import { useRunTracker } from '../../src/hooks/useRunTracker';
import { useDriveTracker } from '../../src/hooks/useDriveTracker';
import { useMagnitudeAccelerometer } from '../../src/hooks/useMagnitudeAccelerometer';
import { useSecondaryTimer } from '../../src/hooks/useSecondaryTimer';
import { useRunStore } from '../../src/stores/runStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS } from '../../src/utils/constants';
import type { TimerMode } from '../../src/types';

export default function TimerScreen() {
  const [mode, setMode] = useState<TimerMode>('acceleration');

  // Settings
  const { unitSystem, gpsAccuracy, hapticFeedback, launchDetectionThresholdG, launchDetectionSampleCount } = useSettingsStore();

  // Acceleration mode hook
  const runTracker = useRunTracker();

  // Drive tracking mode hook
  const driveTracker = useDriveTracker();

  // Secondary timer (magnitude-based launch detection)
  const secondaryTimer = useSecondaryTimer({
    primaryStatus: runTracker.status,
    primaryStartTime: runTracker.startTime,
    currentLocation: runTracker.currentLocation,
    unitSystem,
    gpsAccuracy,
  });

  const magnitudeAccel = useMagnitudeAccelerometer({
    enabled: runTracker.status === 'armed',
    launchThresholdG: launchDetectionThresholdG,
    consecutiveSamplesRequired: launchDetectionSampleCount,
    onLaunchDetected: secondaryTimer.handleLaunchDetected,
  });
  const gpsPoints = useRunStore((state) => state.gpsPoints);
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Determine if we can switch modes (only when idle/ready)
  const canSwitchMode =
    (mode === 'acceleration' &&
      (runTracker.status === 'idle' || runTracker.status === 'ready')) ||
    (mode === 'drive' &&
      (driveTracker.status === 'idle' || driveTracker.status === 'ready'));

  const handleModeChange = (newMode: TimerMode) => {
    if (canSwitchMode) {
      setMode(newMode);
    }
  };

  // Use appropriate tracker based on mode for GPS status header
  const hasPermission = mode === 'acceleration' ? runTracker.hasPermission : driveTracker.hasPermission;
  const accuracy = mode === 'acceleration' ? runTracker.accuracy : driveTracker.accuracy;
  const isTracking = mode === 'acceleration' ? runTracker.isTracking : driveTracker.isTracking;
  const latitude = mode === 'acceleration' ? runTracker.latitude : driveTracker.latitude;
  const longitude = mode === 'acceleration' ? runTracker.longitude : driveTracker.longitude;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* GPS Status Header */}
      <GPSStatus
        hasPermission={hasPermission}
        accuracy={accuracy}
        isTracking={isTracking}
        threshold={gpsAccuracy}
        latitude={latitude}
        longitude={longitude}
      />

      {/* Mode Selector */}
      <ModeSelector mode={mode} onModeChange={handleModeChange} />

      {/* Main Content - Scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'acceleration' ? (
          // ACCELERATION MODE
          <>
            {/* Vehicle Selector - only show if user has vehicles */}
            {vehicles.length > 0 && (
              <VehicleSelector
                disabled={runTracker.status === 'armed' || runTracker.status === 'running'}
              />
            )}

            {/* Timer Display */}
            <View style={styles.timerSection}>
              <TimerDisplay
                elapsedMs={runTracker.elapsedTime}
                isRunning={runTracker.status === 'running'}
              />
            </View>

            {/* Secondary (Magnitude) Timer Display */}
            <SecondaryTimerDisplay
              elapsedMs={secondaryTimer.elapsedTime}
              isRunning={secondaryTimer.status === 'running'}
              milestones={secondaryTimer.milestones}
              unitSystem={unitSystem}
              launchDelta={secondaryTimer.launchDelta}
              currentAcceleration={magnitudeAccel.currentAcceleration}
              isMonitoring={magnitudeAccel.isMonitoring}
              status={secondaryTimer.status}
            />

            {/* Speed Display */}
            <View style={styles.speedSection}>
              <SpeedDisplay
                speedMs={runTracker.currentSpeed}
                unitSystem={unitSystem}
                isRunning={runTracker.status === 'running'}
              />
            </View>

            {/* Start Button */}
            <View style={styles.buttonSection}>
              <StartButton
                status={runTracker.status}
                isGpsReady={runTracker.isTracking && runTracker.isAccuracyOk}
                hapticEnabled={hapticFeedback}
                onPress={runTracker.handleButtonPress}
              />
              <LaunchStatus
                status={runTracker.status}
                currentAcceleration={runTracker.currentAcceleration}
                isAccelerometerAvailable={runTracker.isAccelerometerAvailable}
                isTooFastToStart={runTracker.isTooFastToStart}
                launchThreshold={launchDetectionThresholdG}
                sampleCount={launchDetectionSampleCount}
              />
            </View>

            {/* Location Map */}
            <View style={styles.mapSection}>
              <LocationMap
                latitude={runTracker.latitude}
                longitude={runTracker.longitude}
                isTracking={runTracker.isTracking}
                gpsPoints={gpsPoints}
                showRoute={runTracker.status === 'running' || runTracker.status === 'completed'}
              />
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsSection}>
              <MetricsGrid milestones={runTracker.milestones} unitSystem={unitSystem} />
            </View>

            {/* Stats Footer */}
            <StatsFooter
              maxSpeed={runTracker.maxSpeed}
              distance={runTracker.currentDistance}
              unitSystem={unitSystem}
            />
          </>
        ) : (
          // DRIVE TRACKING MODE
          <>
            {/* Speed Display */}
            <View style={styles.speedSection}>
              <SpeedDisplay
                speedMs={driveTracker.currentSpeed}
                unitSystem={unitSystem}
                isRunning={driveTracker.status === 'tracking'}
              />
            </View>

            {/* Drive Button */}
            <View style={styles.buttonSection}>
              <DriveButton
                status={driveTracker.status}
                onStart={driveTracker.startDrive}
                onPause={driveTracker.pauseDrive}
                onStop={driveTracker.stopDrive}
                onReset={driveTracker.resetDrive}
              />
              <Text style={styles.driveStatusText}>
                {driveTracker.status === 'idle' && 'Acquiring GPS signal...'}
                {driveTracker.status === 'ready' && 'Ready to track your drive'}
                {driveTracker.status === 'tracking' && 'Recording your drive...'}
                {driveTracker.status === 'paused' && 'Drive paused'}
                {driveTracker.status === 'completed' && 'Drive complete'}
              </Text>
            </View>

            {/* Drive Stats */}
            <View style={styles.statsSection}>
              <DriveStats
                elapsedTime={driveTracker.elapsedTime}
                totalDistance={driveTracker.totalDistance}
                maxSpeed={driveTracker.maxSpeed}
                avgSpeed={driveTracker.avgSpeed}
                unitSystem={unitSystem}
              />
            </View>

            {/* Location Map */}
            <View style={styles.mapSection}>
              <LocationMap
                latitude={driveTracker.latitude}
                longitude={driveTracker.longitude}
                isTracking={driveTracker.isTracking}
                gpsPoints={driveTracker.gpsPoints}
                showRoute={driveTracker.status === 'tracking' || driveTracker.status === 'paused' || driveTracker.status === 'completed'}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  timerSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  speedSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  mapSection: {
    paddingVertical: 8,
  },
  metricsSection: {
    paddingVertical: 16,
  },
  statsSection: {
    paddingVertical: 16,
  },
  buttonSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  driveStatusText: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    marginTop: 12,
  },
});
