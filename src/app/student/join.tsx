import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JoinOption } from '@/components/ui/JoinOption';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useStudentExamStore } from '@/store/studentExamStore';

/**
 * Student entry point — scan a QR or type a join code.
 *
 * There is no backend to look a code up yet, so both paths open the same local
 * demo paper: the code is echoed into the exam header, and the instruction →
 * exam → result flow runs entirely from `useStudentExamStore`.
 *
 * The scanner navigates here with a `code` param, which now prefills the field
 * instead of being ignored.
 */
export default function StudentJoinScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ code?: string }>();
  const startDemo = useStudentExamStore((state) => state.startDemo);

  // `useLocalSearchParams` can hand back an array for repeated params; only a
  // plain string is meaningful as a code.
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code : '');

  /** Opens the sample paper and moves on to the briefing. */
  const beginDemo = (demoCode: string) => {
    startDemo(demoCode);
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/student/instructions');
  };

  const continueWithCode = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    beginDemo(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Join an Exam</Text>
          <Text style={styles.subtitle}>
            Scan the QR code displayed on the teacher's screen, or enter a pin code.
          </Text>
        </View>

        {/* Scan Option */}
        <View style={styles.section}>
          <JoinOption
            icon="qrcode-scan"
            title="Scan a QR code"
            description="Point your phone camera at the code"
            onPress={() => router.push('/student/scan')}
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Code Option */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>EXAM CODE</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. EXAM-804"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={continueWithCode}
            style={styles.input}
            accessibilityLabel="Exam Code"
          />

          <Pressable
            onPress={continueWithCode}
            disabled={!code.trim()}
            accessibilityRole="button"
            accessibilityLabel="Continue to exam"
            style={({ pressed }) => [
              styles.primaryBtn,
              !code.trim() && styles.primaryBtnDisabled,
              pressed && code.trim() && styles.primaryBtnPressed,
            ]}
          >
            <Text
              style={[
                styles.primaryBtnText,
                !code.trim() && styles.primaryBtnTextDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </View>

        {/*
         * The demo door sits exactly where the red preview box was marked:
         * below Continue, still above the footnote. It is prominent on purpose
         * — without a backend, this is the only way to reach the exam screens.
         */}
        <Pressable
          onPress={() => beginDemo('DEMO-EXAM')}
          accessibilityRole="button"
          accessibilityLabel="Preview the exam UI with a demo paper"
          style={({ pressed }) => [styles.demoCard, pressed && styles.demoCardPressed]}
        >
          <View style={styles.demoIconTile}>
            <MaterialCommunityIcons name="play-outline" size={26} color={colors.cardCream} />
          </View>

          <View style={styles.demoTextWrapper}>
            <View style={styles.demoLabelRow}>
              <Text style={styles.demoLabel}>DEMO</Text>
              <Text style={styles.demoLabelHint}>NO BACKEND NEEDED</Text>
            </View>
            <Text style={styles.demoTitle}>Preview the exam UI</Text>
            <Text style={styles.demoDescription}>
              Open a sample paper and try the briefing, timer, question palette,
              and result screen.
            </Text>
          </View>

          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onCreamMuted} />
        </Pressable>

        {/* Calm footnote */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.textFaint} />
          <Text style={styles.footerText}>
            The exam screen locks automatically once you begin.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.largeTitle,
      color: colors.text,
    },
    subtitle: {
      ...typography.callout,
      color: colors.textMuted,
      marginTop: spacing.xs,
      lineHeight: 22,
    },
    section: {
      marginBottom: spacing.md,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
    },
    inputSection: {
      gap: spacing.sm,
    },
    inputLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.5,
      paddingHorizontal: 2,
    },
    input: {
      minHeight: 52,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 17,
      fontWeight: '500',
    },
    primaryBtn: {
      minHeight: 50,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    primaryBtnDisabled: {
      backgroundColor: colors.surfaceMuted,
    },
    primaryBtnPressed: {
      opacity: 0.85,
    },
    primaryBtnText: {
      ...typography.headline,
      color: colors.onAccent,
    },
    primaryBtnTextDisabled: {
      color: colors.textFaint,
    },
    /* Demo door — a cream card so it stands out from the ink surfaces. */
    demoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.cardCream,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.onCream,
    },
    demoCardPressed: {
      opacity: 0.9,
    },
    demoIconTile: {
      width: 48,
      height: 48,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    demoTextWrapper: {
      flex: 1,
      gap: 2,
    },
    demoLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    demoLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.onCreamMuted,
    },
    demoLabelHint: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: colors.onCreamMuted,
      opacity: 0.75,
    },
    demoTitle: {
      ...typography.headline,
      color: colors.onCream,
    },
    demoDescription: {
      ...typography.footnote,
      color: colors.onCreamMuted,
      lineHeight: 17,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      marginTop: 'auto',
      paddingTop: spacing.xxl,
    },
    footerText: {
      ...typography.footnote,
      color: colors.textFaint,
    },
  });
