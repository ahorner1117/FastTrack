import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

const GAUGE_SIZE = 240;
const CENTER = GAUGE_SIZE / 2;
const RADIUS = 95;
const INNER_RADIUS = 70;
const NEEDLE_LENGTH = 80;

// RPM gauge spans from -135 degrees to 135 degrees (270 degree sweep)
const START_ANGLE = -135;
const END_ANGLE = 135;
const TOTAL_SWEEP = END_ANGLE - START_ANGLE;

// RPM range: 0 to 8 (in thousands)
const MAX_RPM = 8;
const REDLINE_START = 6.5;

interface TickMark {
  angle: number;
  rpm: number;
  isMajor: boolean;
}

function generateTickMarks(): TickMark[] {
  const ticks: TickMark[] = [];
  // Major ticks every 1000 RPM, minor every 500
  for (let rpm = 0; rpm <= MAX_RPM; rpm += 0.5) {
    const angle = START_ANGLE + (rpm / MAX_RPM) * TOTAL_SWEEP;
    ticks.push({
      angle,
      rpm,
      isMajor: rpm % 1 === 0,
    });
  }
  return ticks;
}

function polarToCartesian(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function createArcPath(startAngle: number, endAngle: number, radius: number) {
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function RPMGauge() {
  const needleRotation = useSharedValue(0);

  useEffect(() => {
    // Animate needle from 0 to ~7000 RPM and back
    needleRotation.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0.3, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0.95, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.1, { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      false
    );
  }, []);

  const needleAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      needleRotation.value,
      [0, 1],
      [START_ANGLE - 90, END_ANGLE - 90]
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const ticks = generateTickMarks();

  // Create redline arc
  const redlineStartAngle = START_ANGLE + (REDLINE_START / MAX_RPM) * TOTAL_SWEEP;
  const redlineArcPath = createArcPath(redlineStartAngle, END_ANGLE, RADIUS);

  // Create main arc (background)
  const mainArcPath = createArcPath(START_ANGLE, END_ANGLE, RADIUS);

  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}>
          {/* Background arc */}
          <Path
            d={mainArcPath}
            fill="none"
            stroke={COLORS.dark.border}
            strokeWidth={8}
            strokeLinecap="round"
          />

          {/* Redline arc */}
          <Path
            d={redlineArcPath}
            fill="none"
            stroke={COLORS.dark.error}
            strokeWidth={8}
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {ticks.map((tick, index) => {
            const innerR = tick.isMajor ? INNER_RADIUS : INNER_RADIUS + 10;
            const outerR = RADIUS - 6;
            const inner = polarToCartesian(tick.angle, innerR);
            const outer = polarToCartesian(tick.angle, outerR);
            const isRedline = tick.rpm >= REDLINE_START;

            return (
              <Line
                key={index}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isRedline ? COLORS.dark.error : COLORS.dark.textSecondary}
                strokeWidth={tick.isMajor ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {/* RPM numbers */}
          {ticks
            .filter((t) => t.isMajor)
            .map((tick, index) => {
              const pos = polarToCartesian(tick.angle, INNER_RADIUS - 18);
              const isRedline = tick.rpm >= REDLINE_START;
              return (
                <SvgText
                  key={index}
                  x={pos.x}
                  y={pos.y}
                  fill={isRedline ? COLORS.dark.error : COLORS.dark.text}
                  fontSize={14}
                  fontWeight="600"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {tick.rpm}
                </SvgText>
              );
            })}

          {/* Center circle */}
          <Circle cx={CENTER} cy={CENTER} r={12} fill={COLORS.dark.surface} />
          <Circle cx={CENTER} cy={CENTER} r={8} fill={COLORS.accent} />
        </Svg>

        {/* Animated needle */}
        <Animated.View style={[styles.needleContainer, needleAnimatedStyle]}>
          <View style={styles.needle}>
            <View style={styles.needleTip} />
            <View style={styles.needleBody} />
          </View>
        </Animated.View>
      </View>

      {/* RPM label */}
      <Text style={styles.rpmLabel}>RPM x1000</Text>

      {/* App name */}
      <Text style={styles.title}>FastTrack</Text>
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.dark.background,
  },
  gaugeContainer: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  needleContainer: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  needle: {
    position: 'absolute',
    width: 4,
    height: NEEDLE_LENGTH,
    bottom: CENTER,
    alignItems: 'center',
  },
  needleBody: {
    flex: 1,
    width: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  needleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.accent,
    marginBottom: -2,
  },
  rpmLabel: {
    fontSize: 12,
    color: COLORS.dark.textTertiary,
    marginTop: -20,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginTop: 32,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    marginTop: 8,
  },
});
