import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { getStudentTints } from '@/components/student/studentTheme';
import { useTheme } from '@/hooks/useTheme';

/**
 * Ambient background for the student exam flow.
 *
 * The exam screens are calm and mostly empty, so a flat `bg` reads as a dead
 * screen. This layers a few very faint glows, concentric rings, and dot
 * clusters behind the content — all `pointerEvents="none"` and low opacity so
 * they never compete with the question text.
 *
 * Colours follow the active palette through `getStudentTints`, so the lines,
 * glows, and dots stay in step with the rest of the app instead of being
 * hard-coded here.
 */
export function ExamBackdrop() {
  const colors = useTheme();
  const tints = getStudentTints(colors);
  const { width } = useWindowDimensions();

  const ringSize = Math.min(width * 1.1, 520);
  const { line, lineStrong, glow, dot } = tints;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.topGlow, { backgroundColor: glow }]} />
      <View style={[styles.bottomGlow, { backgroundColor: glow }]} />

      <View style={styles.ringCenter}>
        <View style={[styles.outerRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: line }]}>
          <View style={[styles.middleRing, { borderColor: lineStrong }]}>
            <View style={[styles.innerRing, { borderColor: line }]} />
          </View>
        </View>
      </View>

      <View style={[styles.cornerCurve1, { borderColor: lineStrong }]} />
      <View style={[styles.cornerCurve2, { borderColor: line }]} />

      <View style={styles.dotGridTopLeft}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={index} style={[styles.gridDot, { backgroundColor: dot }]} />
        ))}
      </View>

      <View style={styles.dotGridBottomRight}>
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={index} style={[styles.gridDot, { backgroundColor: dot }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  middleRing: {
    width: '75%',
    height: '75%',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: '60%',
    height: '60%',
    borderRadius: 999,
    borderWidth: 1,
  },
  cornerCurve1: {
    position: 'absolute',
    top: -60,
    right: 40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
  },
  cornerCurve2: {
    position: 'absolute',
    top: -20,
    right: 80,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  dotGridTopLeft: {
    position: 'absolute',
    top: 70,
    left: 20,
    width: 48,
    height: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    opacity: 0.35,
  },
  dotGridBottomRight: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 48,
    height: 64,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    opacity: 0.35,
  },
  gridDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
