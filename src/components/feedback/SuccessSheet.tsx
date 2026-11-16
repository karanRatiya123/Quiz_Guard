import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

/** Deterministic burst — same choreography every time, no re-randomising on render. */
const CONFETTI = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 3) * 0.14;
  const distance = 56 + ((index * 37) % 48);
  const startRadius = 46; // just outside the badge, so pieces are never hidden under it
  return {
    startX: Math.cos(angle) * startRadius,
    startY: Math.sin(angle) * startRadius,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: index % 6 === 0 ? 9 : index % 3 === 0 ? 5 : 7,
    spin: (index * 47) % 360,
    round: index % 4 === 0,
    colorIndex: index % 4,
  };
});

type SuccessSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  actionLabel: string;
  /** Fires when the confirmation button is pressed. */
  onAction: () => void;
  onRequestClose?: () => void;
};

/**
 * Bottom-sheet confirmation with a check badge and a confetti burst.
 *
 * Motion order: backdrop → sheet → badge pop → ring pulse + confetti →
 * copy → action, so the eye lands on the check before the text.
 */
export function SuccessSheet({
  visible,
  title,
  message,
  actionLabel,
  onAction,
  onRequestClose,
}: SuccessSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(0)).current;
  /** One driver value per confetti piece, created once — see `CONFETTI` above. */
  const pieces = useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  // Web cannot use the native driver; native can, so the sheet animates on the
  // UI thread even if JS is busy with the navigation that follows.
  const useNativeDriver = Platform.OS !== 'web';

  /**
   * The entrance, choreographed with `parallel` + staggered `sequence`s:
   *
   *   backdrop fades (220ms)
   *   sheet springs up          ┐
   *   badge pops after 120ms    │ all start together, each with its own delay
   *   ring + confetti at 150ms  ┘
   *   copy and button rise last
   *
   * `Animated.parallel` does not mean "at the same speed" — each branch keeps
   * its own duration and delay, so the result reads as one cascade rather than
   * a single fade.
   */
  useEffect(() => {
    if (!visible) return;

    // Every open starts from zero; without the reset a second upload would
    // reuse the finished values and the sheet would appear already settled.
    const all = [backdrop, sheet, badge, ring, copy, ...pieces];
    all.forEach((value) => value.setValue(0));

    if (reduceMotion) {
      // Reduced motion: skip the choreography and show the final frame.
      all.forEach((value) => value.setValue(1));
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        useNativeDriver,
      }),
      Animated.spring(sheet, {
        toValue: 1,
        damping: 18,
        stiffness: 210,
        mass: 0.9,
        useNativeDriver,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(badge, {
          toValue: 1,
          damping: 9,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver,
        }),
      ]),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(ring, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver,
          }),
          Animated.stagger(
            18,
            pieces.map((piece) =>
              Animated.timing(piece, {
                toValue: 1,
                duration: 780,
                easing: Easing.out(Easing.quad),
                useNativeDriver,
              }),
            ),
          ),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(280),
        Animated.timing(copy, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]),
    ]);

    animation.start();
    AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);

    return () => animation.stop();
  }, [visible, reduceMotion, backdrop, sheet, badge, ring, copy, pieces, useNativeDriver, title, message]);

  const sheetTranslate = sheet.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });
  const badgeScale = badge.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.75] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.45, 0] });
  const copyShift = copy.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  const confettiColors = colors.isDark
    ? [colors.accent, colors.secondary, colors.success, colors.textMuted]
    : [colors.onCream, colors.secondary, colors.cardSage, colors.textFaint];

  const badgeBackground = colors.isDark ? colors.accent : colors.onCream;
  const badgeIcon = colors.isDark ? colors.onAccent : colors.iconCream;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.lg, transform: [{ translateY: sheetTranslate }] },
          ]}
        >
          <View style={styles.badgeZone}>
            <Animated.View
              style={[
                styles.ring,
                { opacity: ringOpacity, transform: [{ scale: ringScale }] },
              ]}
            />

            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: badgeBackground, transform: [{ scale: badgeScale }] },
              ]}
            >
              <MaterialCommunityIcons name="check-bold" size={38} color={badgeIcon} />
            </Animated.View>

            <View style={styles.confettiLayer} pointerEvents="none">
              {CONFETTI.map((piece, index) => {
                const progress = pieces[index];
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.confetti,
                      {
                        width: piece.size,
                        height: piece.size,
                        borderRadius: piece.round ? piece.size / 2 : 1,
                        marginLeft: -piece.size / 2,
                        marginTop: -piece.size / 2,
                        backgroundColor: confettiColors[piece.colorIndex],
                        opacity: progress.interpolate({
                          inputRange: [0, 0.65, 1],
                          outputRange: [0, 1, 0],
                        }),
                        transform: [
                          {
                            translateX: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [piece.startX, piece.dx],
                            }),
                          },
                          {
                            translateY: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [piece.startY, piece.dy],
                            }),
                          },
                          {
                            rotate: progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', `${piece.spin}deg`],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <Animated.View style={{ opacity: copy, transform: [{ translateY: copyShift }] }}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.message}>{message}</Text>
          </Animated.View>

          <Animated.View style={[styles.actionWrap, { opacity: copy }]}>
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(20, 20, 19, 0.62)',
    },
    sheet: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.panel,
      borderTopRightRadius: radius.panel,
      borderCurve: 'continuous',
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    badgeZone: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    ring: {
      position: 'absolute',
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.isDark ? colors.accent : colors.onCream,
    },
    badge: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confetti: {
      position: 'absolute',
      left: '50%',
      top: '50%',
    },
    title: {
      ...typography.title2,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: spacing.xs,
    },
    actionWrap: {
      width: '100%',
      marginTop: spacing.xl,
    },
    action: {
      width: '100%',
      minHeight: 52,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      backgroundColor: colors.isDark ? colors.accent : colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPressed: {
      opacity: 0.88,
    },
    actionText: {
      ...typography.headline,
      color: colors.isDark ? colors.onAccent : colors.iconCream,
    },
  });
