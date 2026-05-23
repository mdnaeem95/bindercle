import { HoloGradient } from '@foilio/ui';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, type StyleProp, View, type ViewStyle } from 'react-native';
import {
  SensorType,
  runOnJS,
  useAnimatedReaction,
  useAnimatedSensor,
} from 'react-native-reanimated';

type HoloShimmerProps = {
  /** Image URL — the base card art. */
  uri: string;
  /** Container style — width/height/borderRadius/etc. */
  style?: StyleProp<ViewStyle>;
  /** Opacity of the holo overlay (0-1). Default 0.45. */
  intensity?: number;
};

const DEFAULT_ANGLE = 120;

/**
 * HoloShimmer — card image with an accelerometer-driven holo gradient overlay.
 *
 * Implementation notes:
 * - Uses Reanimated's `useAnimatedSensor` to read the device tilt vector
 *   on the UI thread, then bridges to JS state via `runOnJS` at ~30Hz.
 * - The gradient angle is the static 120° default ± tilt-derived offset.
 * - Respects the system "Reduce Motion" setting: holds the gradient
 *   at the brand default angle, no live updates.
 *
 * Use only on cards with `isHolo(rarity) === true`. See BRAND.md §7 for
 * the holo system's restraint guidelines — overuse dilutes the effect.
 */
export function HoloShimmer({ uri, style, intensity = 0.45 }: HoloShimmerProps) {
  const [angle, setAngle] = useState(DEFAULT_ANGLE);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  const sensor = useAnimatedSensor(SensorType.ACCELEROMETER, { interval: 33 });

  useAnimatedReaction(
    () => sensor.sensor.value,
    (current, previous) => {
      'worklet';
      if (reduceMotion) return;
      // Map gravity vector (x: left/right tilt, y: forward/back tilt) to
      // a rotation offset on the gradient angle.
      const next = DEFAULT_ANGLE + current.x * 60 + current.y * 25;
      // Throttle: only update JS state when angle changes meaningfully
      if (
        !previous ||
        Math.abs(next - (previous ? DEFAULT_ANGLE + previous.x * 60 + previous.y * 25 : 0)) > 1.5
      ) {
        runOnJS(setAngle)(next);
      }
    },
    [reduceMotion],
  );

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: intensity,
        }}
      >
        <HoloGradient angle={reduceMotion ? DEFAULT_ANGLE : angle} />
      </View>
    </View>
  );
}
