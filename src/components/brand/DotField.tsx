import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

type DotFieldProps = {
  width: number;
  height: number;
  /** Point the field condenses around — the mark's centre. */
  focusX: number;
  focusY: number;
  /** Dot colour — the theme's `field` role. */
  color: string;
  /** Spacing between dot centres. */
  pitch?: number;
};

/** Deterministic per-cell jitter so the field never looks machine-stamped. */
const jitter = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Dots are batched into a handful of `<Path>`s instead of one `<Circle>` each.
 * A full-height field is 300-500 dots; as individual native views that is a
 * visible hitch on a low-end Android phone, as five paths it is nothing.
 */
const OPACITY_BANDS = 5;

const circlePath = (cx: number, cy: number, r: number) => {
  const x = cx.toFixed(1);
  const y = cy.toFixed(1);
  const radius = r.toFixed(1);
  const diameter = (r * 2).toFixed(1);
  const back = (-r * 2).toFixed(1);
  return `M${x},${y}m${-radius},0a${radius},${radius} 0 1,0 ${diameter},0a${radius},${radius} 0 1,0 ${back},0`;
};

/**
 * The brand's halftone matrix as a ground, not a decoration.
 *
 * The field is normalised to the space above the mark, so it always rises from
 * the mark to the top of the hero — a fixed radius would leave a dead band on
 * tall phones and crowd the mark on short ones. Density is loudest just
 * outside the mark and dies at the frame edges, so the padlock reads as the
 * point the whole field condenses out of.
 */
export function DotField({ width, height, focusX, focusY, color, pitch = 24 }: DotFieldProps) {
  const bands = useMemo(() => {
    const segments: string[][] = Array.from({ length: OPACITY_BANDS }, () => []);
    const spanX = Math.max(width * 0.55, 1);
    const spanY = Math.max(focusY, 200);

    for (let y = pitch / 2; y < height; y += pitch) {
      for (let x = pitch / 2; x < width; x += pitch) {
        const n = jitter(x, y);

        // Break the grid: this should read as a halftone screen, not graph paper.
        const cx = x + (n - 0.5) * pitch * 0.34;
        const cy = y + (jitter(y, x) - 0.5) * pitch * 0.34;

        const dx = cx - focusX;
        const dy = cy - focusY;

        const ring = Math.exp(-Math.pow((Math.hypot(dx / spanX, dy / spanY) - 0.3) / 0.38, 2));
        // Keep the mark itself clear so its own dots stay legible.
        const core = smoothstep(25, 75, Math.hypot(dx, dy));
        // Nothing below the mark: the wordmark sits on clean black.
        const plume = smoothstep(focusY + 30, focusY - 100, y);
        const strength = ring * core * plume;

        if (strength < 0.03) continue;

        const band = Math.min(OPACITY_BANDS - 1, Math.floor(strength * OPACITY_BANDS));
        const radius = 0.7 + 2 * strength * (0.85 + n * 0.3);
        segments[band].push(circlePath(cx, cy, radius));
      }
    }

    return segments
      .map((parts, index) => ({
        key: index,
        opacity: 0.02 + 0.28 * ((index + 0.5) / OPACITY_BANDS),
        d: parts.join(''),
      }))
      .filter((band) => band.d.length > 0);
  }, [width, height, focusX, focusY, pitch]);

  return (
    <Svg width={width} height={height} pointerEvents="none">
      {bands.map((band) => (
        <Path key={band.key} d={band.d} fill={color} fillOpacity={band.opacity} />
      ))}
    </Svg>
  );
}
