import Svg, { Circle } from 'react-native-svg';

/**
 * A dot-matrix chevron, drawn in the same language as the mark.
 *
 * Two dots thick on purpose: a single-dot diagonal collapses into a 2dp
 * hairline at chevron size and stops reading as a shape. 6 x 9 cells, each
 * dot at 88% of its cell, so the stroke holds together.
 */
const CHEVRON: readonly string[] = [
  'XX....',
  '.XX...',
  '..XX..',
  '...XX.',
  '....XX',
  '...XX.',
  '..XX..',
  '.XX...',
  'XX....',
];

const COLUMNS = 6;
const ROWS = CHEVRON.length;

type DotChevronProps = {
  size?: number;
  color: string;
};

export function DotChevron({ size = 24, color }: DotChevronProps) {
  return (
    <Svg width={size * (COLUMNS / ROWS)} height={size} viewBox={`0 0 ${COLUMNS} ${ROWS}`}>
      {CHEVRON.map((row, y) =>
        row.split('').map((cell, x) =>
          cell === 'X' ? (
            <Circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.44} fill={color} />
          ) : null,
        ),
      )}
    </Svg>
  );
}
