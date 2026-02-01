import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import {
  GPSStatus,
  LaunchStatus,
  LocationMap,
  MetricsGrid,
  SpeedDisplay,
  StartButton,
  StatsFooter,
  TimerDisplay,
} from '../../src/components/Timer';
import { useRunTracker } from '../../src/hooks/useRunTracker';
import { useRunStore } from '../../src/stores/runStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS } from '../../src/utils/constants';

export default function TimerScreen() {
  const {
    status,
    currentSpeed,
    currentDistance,
    elapsedTime,
    milestones,
    maxSpeed,
    hasPermission,
    isTracking,
    accuracy,
    isAccuracyOk,
    latitude,
    longitude,
    isAccelerometerAvailable,
    currentAcceleration,
    handleButtonPress,
  } = useRunTracker();

  const { unitSystem, gpsAccuracy, hapticFeedback } = useSettingsStore();
  const gpsPoints = useRunStore((state) => state.gpsPoints);

  const isRunning = status === 'running';
  const isGpsReady = isTracking && isAccuracyOk;

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

      {/* Main Content - Scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Display */}
        <View style={styles.timerSection}>
          <TimerDisplay elapsedMs={elapsedTime} isRunning={isRunning} />
        </View>

        {/* Speed Display */}
        <View style={styles.speedSection}>
          <SpeedDisplay
            speedMs={currentSpeed}
            unitSystem={unitSystem}
            isRunning={isRunning}
          />
        </View>

        {/* Start Button */}
        <View style={styles.buttonSection}>
          <StartButton
            status={status}
            isGpsReady={isGpsReady}
            hapticEnabled={hapticFeedback}
            onPress={handleButtonPress}
          />
          <LaunchStatus
            status={status}
            currentAcceleration={currentAcceleration}
            isAccelerometerAvailable={isAccelerometerAvailable}
          />
        </View>

        {/* Location Map */}
        <View style={styles.mapSection}>
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            isTracking={isTracking}
            gpsPoints={gpsPoints}
            showRoute={status === 'running' || status === 'completed'}
          />
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsSection}>
          <MetricsGrid milestones={milestones} unitSystem={unitSystem} />
        </View>



        {/* Stats Footer */}
        <StatsFooter
          maxSpeed={maxSpeed}
          distance={currentDistance}
          unitSystem={unitSystem}
        />
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
  buttonSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
