import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mark } from '@/components/brand/Mark';
import { ExamBackdrop } from '@/components/student/ExamBackdrop';
import { getStudentTints } from '@/components/student/studentTheme';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { StudentJoinRequest, StudentJoinResponse } from '@/types/quiz';

type Props = {
  quiz: StudentJoinResponse;
  student: StudentJoinRequest;
};

/**
 * "Exam Instructions" — the briefing before the timer starts.
 *
 * Its job is to remove surprises: what the paper is, how long it lasts, who is
 * sitting it, and what will happen if they leave. The exam screen itself has no
 * back button, so this is the last place to change your mind.
 *
 * The fixed bottom button stays outside the scroll so "Start" is always
 * reachable, however long the rules list gets.
 */
export function InstructionsView({ quiz, student }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const tints = getStudentTints(colors);

  const firstName = student.fullName.trim().split(/\s+/)[0] || 'there';
  const questionCount = quiz.questions.length;
  const duration = quiz.durationMinutes || 30;

  const startExam = () => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/student/exam');
  };

  return (
    <View style={styles.root}>
      <ExamBackdrop />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.brandRow}>
            <Mark size={22} />
            <Text style={styles.brandTitle}>
              Quiz<Text style={styles.brandAccent}>Guard</Text>
            </Text>
          </View>

          <Text style={styles.headerTag}>BRIEFING</Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title} accessibilityRole="header">
            Exam Instructions
          </Text>
          <Text style={styles.subtitle}>
            Please review the test guidelines and rules carefully before starting.
          </Text>
        </View>

        <View style={styles.luckCard}>
          <View style={styles.luckIconRing}>
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={20}
              color={tints.accentText}
            />
          </View>
          <View style={styles.luckTextWrapper}>
            <Text style={styles.luckTitle}>Best of luck, {firstName}!</Text>
            <Text style={styles.luckMessage}>
              Stay focused, read each question attentively, and perform with confidence. You&apos;ve got this!
            </Text>
          </View>
        </View>

        <View style={styles.quizCard}>
          <Text style={styles.subjectCategory}>{quiz.subjectName.toUpperCase()}</Text>
          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.subtext}>
            Demo paper · {questionCount} single-mark questions
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DURATION</Text>
              <Text style={styles.metricValue}>{duration} Mins</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>QUESTIONS</Text>
              <Text style={styles.metricValue}>{questionCount} MCQs</Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TOTAL MARKS</Text>
              <Text style={styles.metricValue}>{questionCount} Pts</Text>
            </View>
          </View>
        </View>

        <View style={styles.studentInfoCard}>
          <View style={styles.studentRow}>
            <Text style={styles.studentLabel}>Candidate</Text>
            <Text style={styles.studentValue}>{student.fullName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.studentRow}>
            <Text style={styles.studentLabel}>Enrollment No.</Text>
            <Text style={[styles.studentValue, styles.mono]}>{student.enrollmentNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.studentRow}>
            <Text style={styles.studentLabel}>Exam code</Text>
            <Text style={[styles.studentValue, styles.mono]}>{student.quizCode}</Text>
          </View>
        </View>

        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={colors.error} />
            <Text style={styles.rulesTitle}>Exam Integrity &amp; Guidelines</Text>
          </View>

          {[
            'Once you tap Start Exam Now, the countdown timer begins and cannot be paused.',
            'Do not minimize the app, switch to other applications, or lock your screen during the session.',
            'Each question has one correct answer. Your choices are saved as you select them.',
            'You can move between questions with the number palette at the top of the exam.',
          ].map((rule) => (
            <View key={rule} style={styles.ruleItem}>
              <Text style={styles.ruleBullet}>•</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.bottomInner}>
          <Pressable
            onPress={startExam}
            accessibilityRole="button"
            accessibilityLabel="Start exam now"
            style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          >
            <Text style={styles.startButtonText}>Start Exam Now →</Text>
          </Pressable>
        </View>
      </View>
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
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      opacity: 0.7,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    brandTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    brandAccent: {
      color: colors.isDark ? colors.accent : colors.textMuted,
    },
    headerTag: {
      ...typography.caption,
      color: colors.textFaint,
      letterSpacing: 1,
      fontWeight: '700',
      fontSize: 10,
    },
    titleSection: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.largeTitle,
      color: colors.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      ...typography.subhead,
      color: colors.textMuted,
      marginTop: spacing.xs,
      lineHeight: 22,
    },
    luckCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: tints.fillSoft,
      borderWidth: 1.5,
      borderColor: tints.accentBorder,
      borderRadius: radius.card,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    luckIconRing: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.field,
      borderWidth: 1,
      borderColor: tints.accentBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    luckTextWrapper: {
      flex: 1,
    },
    luckTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tints.accentText,
      marginBottom: 2,
    },
    luckMessage: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textMuted,
    },
    quizCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    subjectCategory: {
      ...typography.caption,
      color: tints.accentText,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    quizTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
      letterSpacing: -0.3,
    },
    subtext: {
      ...typography.footnote,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: spacing.md,
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metricItem: {
      flex: 1,
      backgroundColor: tints.inset,
      borderRadius: radius.control,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '800',
      color: tints.accentText,
      marginTop: 3,
    },
    studentInfoCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    studentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
      gap: spacing.md,
    },
    studentLabel: {
      ...typography.subhead,
      color: colors.textFaint,
    },
    studentValue: {
      ...typography.subhead,
      color: colors.text,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
    },
    mono: {
      fontFamily: 'monospace',
      color: tints.accentText,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    rulesCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    rulesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    rulesTitle: {
      ...typography.headline,
      color: colors.text,
      fontWeight: '700',
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm + 2,
    },
    ruleBullet: {
      color: tints.accentText,
      fontSize: 16,
      lineHeight: 20,
    },
    ruleText: {
      flex: 1,
      ...typography.body,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
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
    startButton: {
      height: 52,
      backgroundColor: colors.accent,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startButtonPressed: {
      opacity: 0.88,
    },
    startButtonText: {
      color: colors.onAccent,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
};
