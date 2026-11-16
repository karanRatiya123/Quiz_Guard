import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { StyleSheet } from 'react-native';

/**
 * Decorative cream waves for the login screen's dark background — a ribbon
 * sweeping into the top-right corner and a smaller one in the bottom-left,
 * with thin echo curves underneath each, per the approved design.
 *
 * Rendered as an absolutely-positioned, non-interactive overlay pass, so a
 * fixed viewBox + `slice` keeps the composition pinned to the corners on any
 * screen size.
 */
export function LoginWaves() {
  return (
    <Svg
      style={styles.canvas}
      viewBox="0 0 400 850"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="waveTop" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor="#E3E2C3" stopOpacity={0.98} />
          <Stop offset="1" stopColor="#E3E2C3" stopOpacity={0.55} />
        </LinearGradient>
        <LinearGradient id="waveBottom" x1="0" y1="1" x2="0.6" y2="0">
          <Stop offset="0" stopColor="#E3E2C3" stopOpacity={0.98} />
          <Stop offset="1" stopColor="#E3E2C3" stopOpacity={0.55} />
        </LinearGradient>
      </Defs>

      <G>
        {/* Top-right ribbon */}
        <Path
          d="M232 0 C 242 78 302 118 400 112 L 400 0 Z"
          fill="url(#waveTop)"
        />
        {/* Thin echo curve under the ribbon */}
        <Path
          d="M196 0 C 232 118 320 168 400 164"
          stroke="#E3E2C3"
          strokeWidth={2}
          strokeOpacity={0.6}
          fill="none"
        />
        {/* Soft translucent companion blob */}
        <Path
          d="M400 208 C 330 200 280 150 262 84 C 300 132 350 178 400 184 Z"
          fill="#E3E2C3"
          fillOpacity={0.14}
        />
      </G>

      <G>
        {/* Bottom-left ribbon */}
        <Path
          d="M0 764 C 96 756 138 800 152 850 L 0 850 Z"
          fill="url(#waveBottom)"
        />
        {/* Thin echo curve above the ribbon */}
        <Path
          d="M0 742 C 118 740 176 786 200 850"
          stroke="#E3E2C3"
          strokeWidth={2}
          strokeOpacity={0.6}
          fill="none"
        />
        {/* Soft translucent companion blob */}
        <Path
          d="M0 690 C 70 688 112 716 130 744 C 92 730 44 716 0 718 Z"
          fill="#E3E2C3"
          fillOpacity={0.14}
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  canvas: StyleSheet.absoluteFillObject,
});
