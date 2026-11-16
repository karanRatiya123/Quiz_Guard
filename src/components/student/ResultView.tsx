import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExamBackdrop } from '@/components/student/ExamBackdrop';
import { getStudentTints } from '@/components/student/studentTheme';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useStudentExamStore, type ExamResult } from '@/store/studentExamStore';

type Props = {
  result: ExamResult;
};

/**
 * Submission confirmation.
 *
 * The burst is decorative, so it is skipped entirely when the OS "reduce
 * motion" setting is on. The copy is deliberately honest: this is a local demo,
 * so it says the answers were saved on the device rather than claiming they
 * reached a server or were graded.
 */
export function ResultView({ result }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const reset = useStudentExamStore((state) => state.reset);

  // 16 particles burst outwards once, then fade. Computed per render so the
  // colours follow the active theme.
  const particles = useRef(
    Array.from({ length: 16 }, (_, index) => {
      const angle = (index / 16) * Math.PI * 2 + (index % 3) * 0.12;
      const distance = 52 + ((index * 31) % 40);
      const startRadius = 38;
      return {
        startX: Math.cos(angle) * startRadius,
        startY: Math.sin(angle) * startRadius,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: index % 4 === 0 ? 8 : index % 2 === 0 ? 6 : 4,
        color: index % 3 === 0 ? colors.accent : index % 2 === 0 ? colors.textMuted : colors.surfaceMuted,
      };
    }),
  ).current;

  const badgeScale = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(particles.map(() => new Animated.Value(0))).current;
  const copyFade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const copyTranslateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const cardFade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const cardTranslateY = useRef(new Animated.Value(reduceMotion ? 0 : 24)).current;
  const buttonFade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  const useNativeDriver = Platform.OS !== 'web';
  const submitted = new Date(result.submittedAt);
  const submittedDate = submitted.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const submittedTime = submitted.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // The attempt is over, so back would only resurrect a finished paper. The
  // explicit "Exit to Home" button is the one way out.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Snap every value to its end state: the screen is fully readable, just
      // without movement.
      badgeScale.setValue(1);
      copyFade.setValue(1);
      copyTranslateY.setValue(0);
      cardFade.setValue(1);
      cardTranslateY.setValue(0);
      buttonFade.setValue(1);
      return;
    }

    // 1. Badge pops in with a spring.
    Animated.spring(badgeScale, {
      toValue: 1,
      damping: 9,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver,
    }).start();

    // 2. Ring pulse + confetti burst.
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1.8,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.sequence([
        Animated.timing(ringOpacity, { toValue: 0.6, duration: 200, useNativeDriver }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 550, useNativeDriver }),
      ]),
      Animated.stagger(
        20,
        particleProgress.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver,
          }),
        ),
      ),
    ]).start();

    // 3. Title and message slide in.
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(copyFade, { toValue: 1, duration: 350, useNativeDriver }),
        Animated.timing(copyTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
    ]).start();

    // 4. Summary card slides in.
    Animated.sequence([
      Animated.delay(320),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
    ]).start();

    // 5. Button fades in last.
    Animated.sequence([
      Animated.delay(450),
      Animated.timing(buttonFade, { toValue: 1, duration: 300, useNativeDriver }),
    ]).start();
  }, [
    badgeScale,
    buttonFade,
    cardFade,
    cardTranslateY,
    copyFade,
    copyTranslateY,
    particleProgress,
    reduceMotion,
    ringOpacity,
    ringScale,
    useNativeDriver,
  ]);

  const exitToJoin = () => {
    reset();
    // Returns to the join screen already in the stack, dropping the briefing
    // and result from history. Falls back to a replace when opened directly.
    router.dismissTo('/student/join');
  };

  return (
    <View style={styles.root}>
      <ExamBackdrop />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeZone}>
          {!reduceMotion ? (
            <Animated.View
              style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
          ) : null}

          <Animated.View style={[styles.checkCircle, { transform: [{ scale: badgeScale }] }]}>
            <MaterialCommunityIcons name="check" size={34} color={colors.onAccent} />
          </Animated.View>

          {!reduceMotion ? (
            <View style={styles.confettiLayer} pointerEvents="none">
              {particles.map((piece, index) => {
                const progress = particleProgress[index];
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.particle,
                      {
                        width: piece.size,
                        height: piece.size,
                        borderRadius: piece.size / 2,
                        backgroundColor: piece.color,
                        opacity: progress.interpolate({
                          inputRange: [0, 0.6, 1],
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
                        ],
                      },
                    ]}
                  />
                );
              })}
            </View>
          ) : null}
        </View>

        <Animated.View
          style={[styles.header, { opacity: copyFade, transform: [{ translateY: copyTranslateY }] }]}
        >
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>
              {result.autoSubmitted ? 'TIME EXPIRED · AUTO-SUBMITTED' : 'SUBMISSION RECORDED'}
            </Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            Exam Submitted!
          </Text>
          <Text style={styles.subtitle}>
            {result.autoSubmitted
              ? 'The countdown reached zero, so your paper was submitted automatically. Everything you had answered was kept.'
              : 'Your answers have been saved on this device. In the finished app they would be sent to your faculty for evaluation.'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.summaryCard,
            { opacity: cardFade, transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <Text style={styles.summaryHeading}>SESSION DETAILS</Text>

          <InfoRow label="Student Name" value={result.studentName} />

          <InfoRow label="Enrollment No." value={result.enrollmentNumber} mono />

          <InfoRow label="Subject" value={result.subjectName} />

          <InfoRow
            label="Questions Answered"
            value={`${result.answeredCount} of ${result.totalCount}`}
            highlight
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>SAVED LOCALLY</Text>
            </View>
          </View>

          <InfoRow label="Timestamp" value={`${submittedDate} at ${submittedTime}`} muted last />
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.bottomBar, { opacity: buttonFade, paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.bottomInner}>
          <Pressable
            onPress={exitToJoin}
            accessibilityRole="button"
            accessibilityLabel="Exit to student home"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Exit to Home</Text>
          </Pressable>

          <Text style={styles.footnote}>
            Demo preview — answers are not graded and nothing leaves this device.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  muted?: boolean;
  /** The final row draws no divider, so the card does not end on a line. */
  last?: boolean;
};

/** One label/value line. The hairline divider is drawn by the caller's list. */
function InfoRow({ label, value, mono, highlight, muted, last }: InfoRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          mono && styles.mono,
          highlight && styles.infoHighlight,
          muted && styles.infoMuted,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => {
  const tints = getStudentTints(colors);

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    badgeZone: {
      width: 90,
      height: 90,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    ring: {
      position: 'absolute',
      width: 74,
      height: 74,
      borderRadius: 37,
      borderWidth: 2,
      borderColor: tints.accentBorder,
    },
    checkCircle: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    particle: {
      position: 'absolute',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    statusPill: {
      backgroundColor: tints.fillMedium,
      borderWidth: 1,
      borderColor: tints.accentBorder,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    statusPillText: {
      ...typography.caption,
      color: tints.accentText,
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 0.6,
    },
    title: {
      ...typography.title1,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subhead,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      lineHeight: 22,
      maxWidth: 420,
    },
    summaryCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    summaryHeading: {
      ...typography.caption,
      color: colors.textFaint,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoLabel: {
      ...typography.subhead,
      color: colors.textFaint,
      flexShrink: 1,
    },
    infoValue: {
      ...typography.subhead,
      color: colors.text,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
    },
    infoHighlight: {
      color: tints.accentText,
      fontWeight: '700',
    },
    infoMuted: {
      ...typography.footnote,
      color: colors.textMuted,
      fontWeight: '600',
    },
    mono: {
      fontFamily: 'monospace',
      color: tints.accentText,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: tints.fillMedium,
      borderWidth: 1,
      borderColor: tints.accentBorder,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: tints.accentText,
      letterSpacing: 0.5,
    },
    bottomBar: {
      width: '100%',
      paddingTop: spacing.sm,
    },
    bottomInner: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
    },
    primaryButton: {
      width: '100%',
      height: 52,
      backgroundColor: colors.accent,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonPressed: {
      opacity: 0.85,
    },
    primaryButtonText: {
      color: colors.onAccent,
      fontSize: 15,
      fontWeight: '700',
    },
    footnote: {
      ...typography.footnote,
      color: colors.textFaint,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });
};
