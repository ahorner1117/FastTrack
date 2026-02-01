import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import {
  GPSStatus,
  SpeedDisplay,
  TimerDisplay,
  MetricsGrid,
  StartButton,
  StatsFooter,
  LocationMap,
} from '../../src/components/Timer';
import { useRunTracker } from '../../src/hooks/useRunTracker';
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
    handleButtonPress,
  } = useRunTracker();

  const { unitSystem, gpsAccuracy, hapticFeedback } = useSettingsStore();

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

      {/* Main Content */}
      <View style={styles.content}>
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

        {/* Location Map */}
        <View style={styles.mapSection}>
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            isTracking={isTracking}
          />
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsSection}>
          <MetricsGrid milestones={milestones} unitSystem={unitSystem} />
        </View>

        {/* Start Button */}
        <View style={styles.buttonSection}>
          <StartButton
            status={status}
            isGpsReady={isGpsReady}
            hapticEnabled={hapticFeedback}
            onPress={handleButtonPress}
          />
        </View>
      </View>

      {/* Stats Footer */}
      <StatsFooter
        maxSpeed={maxSpeed}
        distance={currentDistance}
        unitSystem={unitSystem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 16,
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
