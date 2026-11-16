import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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

/**
 * Student entry point — type a join code.
 *
 * The code field is real UI state, but joining is not connected: submitting a
 * non-empty code only gives haptic feedback. A real version would call a
 * backend to look the code up and push the exam screen.
 *
 * The scanner navigates here with a `code` param after a successful scan, but
 * this screen does not read that param yet — it starts empty either way.
 */
export default function StudentJoinScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const [code, setCode] = useState('');

  const continueWithCode = () => {
    if (!code.trim()) return;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
