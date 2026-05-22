import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, holoStops } from '../tokens';

type HoloGradientProps = {
  /** Override the default 120deg sweep angle. */
  angle?: number;
  /** Opacity multiplier (0-1). Use 0.4 for the `holo-subtle` variant from BRAND.md. */
  opacity?: number;
  /** Width override (defaults to filling parent). */
  width?: number | string;
  /** Height override (defaults to filling parent). */
  height?: number | string;
  /** Border radius for the gradient rect. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Static holo gradient — the signature Foilio motif.
 *
 * Used sparingly: holo cards, premium indicators, milestone moments, logo touchpoints.
 * Never as decorative chrome (see BRAND.md §7).
 *
 * For the gyroscope-driven and animated variants, see HoloGradientAnimated (Phase 1 Week 7).
 */
export function HoloGradient({
  angle = colors.holo.defaultAngle,
  opacity = 1,
  width = '100%',
  height = '100%',
  borderRadius = 0,
  style,
  children,
}: HoloGradientProps) {
  // Convert angle to SVG linearGradient coordinates.
  // SVG gradients use a unit vector from (x1, y1) to (x2, y2). We rotate from horizontal.
  const radians = ((angle - 90) * Math.PI) / 180;
  const cx = 0.5;
  const cy = 0.5;
  const r = 0.5;
  const x1 = cx - r * Math.cos(radians);
  const y1 = cy - r * Math.sin(radians);
  const x2 = cx + r * Math.cos(radians);
  const y2 = cy + r * Math.sin(radians);

  return (
    <View
      style={[
        { width: width as number, height: height as number, borderRadius, overflow: 'hidden' },
        style,
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="foilio-holo" x1={x1} y1={y1} x2={x2} y2={y2}>
            {holoStops.map((stop, i) => (
              <Stop
                key={stop}
                offset={i / (holoStops.length - 1)}
                stopColor={stop}
                stopOpacity={opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="url(#foilio-holo)"
          rx={borderRadius}
          ry={borderRadius}
        />
      </Svg>
      {children}
    </View>
  );
}

/**
 * Tiny circular holo disc — for the logo dot on the second `i` of `foilio`,
 * profile decorations, and small badges.
 */
export function HoloDot({ size = 8, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return <HoloGradient width={size} height={size} borderRadius={size / 2} style={style} />;
}
