import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mark } from '@/components/brand/Mark';
import { ExamBackdrop } from '@/components/student/ExamBackdrop';
import { getStudentTints } from '@/components/student/studentTheme';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useStudentExamStore } from '@/store/studentExamStore';
import type { StudentJoinResponse } from '@/types/quiz';

type Props = {
  quiz: StudentJoinResponse;
};

/**
 * The live exam — one question at a time, with a countdown.
 *
 * The friend's version called a `saveAnswer` API on every tap. There is no
 * backend here, so answers now go straight into the shared store; that is also
 * why the submit path reads answers from the store instead of a captured
 * `useState` value (the old timer effect captured an empty object and would
 * have reported zero answered questions).
 *
 * Time runs out → the paper submits itself and the result replaces this screen,
 * so the back gesture cannot re-enter a finished exam.
 */
export function ExamRunnerView({ quiz }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();

  /** Answers live in the store, so moving between routes never loses them. */
  const answers = useStudentExamStore((state) => state.answers);
  const selectAnswer = useStudentExamStore((state) => state.selectAnswer);
  const finish = useStudentExamStore((state) => state.finish);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const totalSeconds = (quiz.durationMinutes || 30) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 300; // under five minutes
  const tints = getStudentTints(colors);

  // Animation values are refs: they survive re-renders without causing one.
  const progressAnim = useRef(new Animated.Value(questions.length ? 1 / questions.length : 0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const submitBtnScale = useRef(new Animated.Value(1)).current;

  /** Guards against a double submit (tap + timer firing together). */
  const submittedRef = useRef(false);
  const useNativeDriver = Platform.OS !== 'web';

  const leaveExam = useCallback(
    (autoSubmitted: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      finish(autoSubmitted);
      router.replace('/student/result');
    },
    [finish],
  );

  // Progress bar follows the current question.
  useEffect(() => {
    const target = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

    if (reduceMotion) {
      progressAnim.setValue(target);
      return;
    }

    Animated.timing(progressAnim, {
      toValue: target,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating `width` is a layout property
    }).start();
  }, [currentIndex, questions.length, progressAnim, reduceMotion]);

  // One interval for the whole attempt; it stops decrementing at zero.
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Android's hardware back would otherwise leave the exam running behind the
  // briefing screen. There is no exit on purpose: submit first.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  // Submitting from an effect (not inside the timer callback) keeps the state
  // update pure, which matters under React's StrictMode double-invoke.
  useEffect(() => {
    if (timeLeft > 0) return;
    leaveExam(true);
  }, [timeLeft, leaveExam]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId: number) => {
    if (!currentQuestion) return;
    selectAnswer(currentQuestion.id, optionId);
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.selectionAsync();
    }
  };

  const openSubmitModal = () => {
    setShowSubmitModal(true);
    modalScale.setValue(reduceMotion ? 1 : 0.92);
    modalOpacity.setValue(reduceMotion ? 1 : 0);

    if (reduceMotion) return;

    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        damping: 15,
        stiffness: 220,
        useNativeDriver,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver,
      }),
    ]).start();
  };

  const closeSubmitModal = () => {
    if (reduceMotion) {
      setShowSubmitModal(false);
      return;
    }

    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver,
    }).start(() => setShowSubmitModal(false));
  };

  const handleSubmit = () => {
    if (reduceMotion) {
      leaveExam(false);
      return;
    }

    // Tiny press feedback, then submit — no artificial network delay.
    Animated.sequence([
      Animated.timing(submitBtnScale, { toValue: 0.94, duration: 80, useNativeDriver }),
      Animated.timing(submitBtnScale, { toValue: 1, duration: 100, useNativeDriver }),
    ]).start(() => leaveExam(false));
  };

  const progressPercent =
    questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <ExamBackdrop />

      {/* Header + progress stay fixed, so the timer is always visible. */}
      <View style={[styles.headerZone, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Mark size={22} />
            <Text style={styles.brandName}>
              Quiz<Text style={styles.brandAccent}>Guard</Text>
            </Text>
            <Text style={styles.brandDivider}>•</Text>
            <Text style={styles.subjectText} numberOfLines={1}>
              {quiz.subjectName || quiz.title}
            </Text>
          </View>

          <View
            style={[styles.timerBadge, isTimeCritical && styles.timerCritical]}
            accessibilityLabel={`Time remaining ${formatTimer(timeLeft)}`}
          >
            <MaterialCommunityIcons
              name="timer-outline"
              size={14}
              color={isTimeCritical ? colors.error : tints.accentText}
            />
            <Text style={[styles.timerText, isTimeCritical && styles.timerTextCritical]}>
              {formatTimer(timeLeft)}
            </Text>
          </View>
        </View>

        <View style={styles.progressInfoRow}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {answeredCount}/{questions.length} Answered ({progressPercent}%)
            </Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Number palette — tap any question to jump straight to it. */}
        <View style={styles.paletteContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = index === currentIndex;

              return (
                <Pressable
                  key={question.id}
                  onPress={() => setCurrentIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}`}
                  accessibilityState={{ selected: isCurrent }}
                  style={({ pressed }) => [
                    styles.paletteItem,
                    isAnswered && styles.paletteItemAnswered,
                    isCurrent && styles.paletteItemCurrent,
                    pressed && styles.paletteItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.paletteItemText,
                      isAnswered && styles.paletteTextAnswered,
                      isCurrent && styles.paletteTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {currentQuestion ? (
          <>
            <View style={styles.questionCard}>
              <View style={styles.questionMeta}>
                <View style={styles.qNumBadge}>
                  <Text style={styles.qNumText}>Q{currentIndex + 1}</Text>
                </View>
                <View style={styles.coBadge}>
                  <Text style={styles.coText}>
                    {currentQuestion.coLevel || 'CO1'} • 1 Mark
                  </Text>
                </View>
              </View>

              <Text style={styles.questionPrompt} accessibilityRole="header">
                {currentQuestion.questionText}
              </Text>
            </View>

            <View style={styles.optionsList} accessibilityRole="radiogroup">
              {currentQuestion.options.map((option, optionIndex) => {
                const letter = String.fromCharCode(65 + optionIndex);
                const isSelected = answers[currentQuestion.id] === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleSelectOption(option.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${letter}. ${option.optionText}`}
                    style={({ pressed }) => [
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      pressed && styles.optionCardPressed,
                    ]}
                  >
                    <View style={[styles.optionLetterBadge, isSelected && styles.optionLetterSelected]}>
                      <Text style={[styles.optionLetterText, isSelected && styles.optionLetterTextSelected]}>
                        {letter}
                      </Text>
                    </View>

                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.optionText}
                    </Text>

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? (
                        <MaterialCommunityIcons name="check" size={14} color={colors.onAccent} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Honest label: there is no cloud, the answers only live in memory. */}
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={13}
                color={colors.textFaint}
              />
              <Text style={styles.statusText}>Saved on this device</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.bottomArea,
          { paddingBottom: insets.bottom + spacing.sm },
        ]}
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => setCurrentIndex((previous) => Math.max(0, previous - 1))}
            disabled={currentIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
            style={({ pressed }) => [
              styles.navButton,
              styles.prevButton,
              currentIndex === 0 && styles.disabledButton,
              pressed && currentIndex > 0 && styles.navButtonPressed,
            ]}
          >
            <Text style={styles.prevButtonText}>← Previous</Text>
          </Pressable>

          {currentIndex < questions.length - 1 ? (
            <Pressable
              onPress={() => setCurrentIndex((previous) => Math.min(questions.length - 1, previous + 1))}
              accessibilityRole="button"
              accessibilityLabel="Next question"
              style={({ pressed }) => [
                styles.navButton,
                styles.nextButton,
                pressed && styles.navButtonPressed,
              ]}
            >
              <Text style={styles.nextButtonText}>Next Question →</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={openSubmitModal}
              accessibilityRole="button"
              accessibilityLabel="Review and submit exam"
              style={({ pressed }) => [
                styles.navButton,
                styles.submitButton,
                pressed && styles.navButtonPressed,
              ]}
            >
              <Text style={styles.submitButtonText}>Review & Submit</Text>
              <MaterialCommunityIcons name="check" size={16} color={colors.onAccent} />
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={showSubmitModal}
        transparent
        animationType="none"
        onRequestClose={closeSubmitModal}
        statusBarTranslucent
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <Animated.View
            style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}
            accessibilityViewIsModal
          >
            <View style={styles.modalBadge}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={tints.accentText} />
            </View>

            <Text style={styles.modalTitle}>Confirm Submission</Text>
            <Text style={styles.modalDescription}>
              You have answered <Text style={styles.modalHighlight}>{answeredCount}</Text> of{' '}
              <Text style={styles.modalHighlight}>{questions.length}</Text> questions.
              {answeredCount < questions.length
                ? `\n\nYou still have ${questions.length - answeredCount} unanswered ${
                    questions.length - answeredCount === 1 ? 'question' : 'questions'
                  }.`
                : ''}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.navButtonPressed]}
                onPress={closeSubmitModal}
                accessibilityRole="button"
                accessibilityLabel="Review exam"
              >
                <Text style={styles.modalCancelText}>Review Exam</Text>
              </Pressable>

              <Animated.View style={{ flex: 1, transform: [{ scale: submitBtnScale }] }}>
                <Pressable
                  style={({ pressed }) => [styles.modalSubmitBtn, pressed && styles.navButtonPressed]}
                  onPress={handleSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Yes, submit exam"
                >
                  <Text style={styles.modalSubmitText}>Yes, Submit</Text>
                  <MaterialCommunityIcons name="check" size={15} color={colors.onAccent} />
                </Pressable>
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
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
    headerZone: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      marginRight: spacing.sm,
    },
    brandName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    brandAccent: {
      color: tints.accentText,
    },
    brandDivider: {
      color: colors.textFaint,
      fontSize: 12,
    },
    subjectText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      flex: 1,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: tints.accentBorder,
    },
    timerCritical: {
      borderColor: colors.error,
      backgroundColor: colors.errorPress,
    },
    timerText: {
      fontSize: 14,
      fontWeight: '800',
      color: tints.accentText,
      fontFamily: 'monospace',
    },
    timerTextCritical: {
      color: colors.error,
    },
    progressInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    questionCounter: {
      ...typography.headline,
      fontSize: 15,
      color: colors.text,
    },
    progressBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: tints.fillMedium,
      borderWidth: 1,
      borderColor: tints.accentBorder,
    },
    progressBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: tints.accentText,
    },
    progressBarTrack: {
      height: 7,
      backgroundColor: colors.surface,
      borderRadius: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: tints.progress,
      borderRadius: 3,
    },
    mainScroll: {
      flex: 1,
    },
    mainScrollContent: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    paletteContainer: {
      marginVertical: spacing.sm,
    },
    paletteScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    paletteItem: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paletteItemPressed: {
      opacity: 0.75,
    },
    paletteItemAnswered: {
      borderColor: tints.accentBorder,
      backgroundColor: tints.fillMedium,
    },
    paletteItemCurrent: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    paletteItemText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textFaint,
    },
    paletteTextAnswered: {
      color: tints.accentText,
    },
    paletteTextCurrent: {
      color: colors.onAccent,
      fontWeight: '800',
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.md + 2,
      marginBottom: spacing.md,
    },
    questionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    qNumBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: tints.inset,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qNumText: {
      fontSize: 11,
      fontWeight: '800',
      color: tints.accentText,
    },
    coBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: tints.inset,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    questionPrompt: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600',
      color: colors.text,
    },
    optionsList: {
      gap: 12,
      marginBottom: spacing.sm,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.card,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      minHeight: 56,
      gap: spacing.md,
    },
    optionCardPressed: {
      opacity: 0.9,
    },
    optionCardSelected: {
      borderColor: tints.accentBorder,
      borderWidth: 2,
      backgroundColor: tints.fillSoft,
    },
    optionLetterBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: tints.inset,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLetterSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    optionLetterText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textMuted,
    },
    optionLetterTextSelected: {
      color: colors.onAccent,
      fontWeight: '800',
    },
    optionText: {
      flex: 1,
      fontSize: 15,
      color: colors.textMuted,
      lineHeight: 22,
    },
    optionTextSelected: {
      color: colors.text,
      fontWeight: '600',
    },
    radioCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 11,
      color: colors.textFaint,
      fontWeight: '500',
    },
    bottomArea: {
      width: '100%',
      maxWidth: 620,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navBar: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    navButton: {
      height: 52,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    navButtonPressed: {
      opacity: 0.85,
    },
    prevButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    prevButtonText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 15,
    },
    nextButton: {
      flex: 1.5,
      backgroundColor: colors.accent,
    },
    nextButtonText: {
      color: colors.onAccent,
      fontWeight: '700',
      fontSize: 15,
    },
    submitButton: {
      flex: 1.5,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      gap: 6,
    },
    submitButtonText: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 15,
    },
    disabledButton: {
      opacity: 0.35,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: tints.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.xl,
      alignItems: 'center',
    },
    modalBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: tints.fillSoft,
      borderWidth: 1.5,
      borderColor: tints.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      ...typography.title2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    modalDescription: {
      ...typography.body,
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    modalHighlight: {
      color: tints.accentText,
      fontWeight: '700',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
    },
    modalCancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: radius.control,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    modalSubmitBtn: {
      height: 48,
      borderRadius: radius.control,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      width: '100%',
    },
    modalSubmitText: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
};
