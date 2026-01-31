import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Navigation, NavigationOff, Loader } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';
import type { GPSAccuracy } from '../../types';
import { getGpsAccuracyColor } from '../../services/locationService';

interface GPSStatusProps {
  hasPermission: boolean | null;
  accuracy: number | null;
  isTracking: boolean;
  threshold: GPSAccuracy;
  latitude?: number | null;
  longitude?: number | null;
}

const AnimatedNavigation = Animated.createAnimatedComponent(Navigation);

export function GPSStatus({
  hasPermission,
  accuracy,
  isTracking,
  threshold,
  latitude,
  longitude,
}: GPSStatusProps) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (isTracking && accuracy !== null) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 500 }),
          withTiming(10, { duration: 1000 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = withTiming(0);
    }
  }, [isTracking, accuracy, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const getStatusInfo = () => {
    if (hasPermission === null) {
      return {
        icon: <Loader color={COLORS.dark.textSecondary} size={18} />,
        text: 'Checking...',
        color: COLORS.dark.textSecondary,
      };
    }

    if (!hasPermission) {
      return {
        icon: <NavigationOff color={COLORS.dark.error} size={18} />,
        text: 'No Permission',
        color: COLORS.dark.error,
      };
    }

    if (!isTracking) {
      return {
        icon: <NavigationOff color={COLORS.dark.textSecondary} size={18} />,
        text: 'GPS Off',
        color: COLORS.dark.textSecondary,
      };
    }

    if (accuracy === null) {
      return {
        icon: <Loader color={COLORS.dark.warning} size={18} />,
        text: 'Acquiring...',
        color: COLORS.dark.warning,
      };
    }

    const statusColor = getGpsAccuracyColor(accuracy, threshold);
    const colorValue =
      statusColor === 'success'
        ? COLORS.dark.success
        : statusColor === 'warning'
          ? COLORS.dark.warning
          : COLORS.dark.error;

    return {
      icon: (
        <AnimatedNavigation
          color={colorValue}
          size={18}
          style={animatedStyle}
        />
      ),
      text: `Ready (±${Math.round(accuracy)}m)`,
      color: colorValue,
    };
  };

  const status = getStatusInfo();

  const formatCoordinate = (value: number | null | undefined, isLat: boolean): string => {
    if (value === null || value === undefined) return '--';
    const direction = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.indicator}>
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          {status.icon}
        </View>
        <Text style={[styles.text, { color: status.color }]}>
          GPS: {status.text}
        </Text>
      </View>
      {isTracking && latitude !== null && longitude !== null && (
        <View style={styles.coordsRow}>
          <Text style={styles.coordText}>
            {formatCoordinate(latitude, true)}, {formatCoordinate(longitude, false)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  coordsRow: {
    paddingLeft: 14,
  },
  coordText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.dark.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
