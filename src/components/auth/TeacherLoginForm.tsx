import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthField } from '@/components/auth/AuthField';
import { LoginWaves } from '@/components/auth/LoginWaves';
import { GoogleGlyph } from '@/components/brand/GoogleGlyph';
import { Mark } from '@/components/brand/Mark';
import { loginColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';

/**
 * Teacher login screen — fixed dark design per the approved spec:
 * centered brand + title, social buttons above an "or" divider, pill inputs,
 * and a cream Sign In pill. Always dark, independent of the OS scheme.
 */
export function TeacherLoginForm() {
  const insets = useSafeAreaInsets();
  const colors = loginColors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  /**
   * Local validation only — there is no auth endpoint.
   *
   * `emailLooksValid` is a deliberately loose shape check ("something, @,
   * something, dot, something"), and the password rule is length >= 6. Real
   * validation of credentials must happen on a server; this just decides when
   * the Sign In pill becomes tappable.
   */
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canContinue = emailLooksValid && password.length >= 6;
  /**
   * `replace`, not `push`: the login screen should not stay on the back stack,
   * so back from Home exits the teacher area instead of returning to a form the
   * user just completed.
   */
  const submit = () => {
    if (!canContinue) return;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace('/teacher');
  };

  return (
    <View style={styles.root}>
      <LoginWaves />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Floating back chevron — the design has none, but it stays discoverable */}
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          style={[styles.back, { top: insets.top + spacing.sm }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* ── Brand ── */}
          <View style={styles.brandRow}>
            <View style={styles.logoTile}>
              <Mark size={30} variant="ink" />
            </View>
            <Text style={styles.wordmark} accessibilityRole="header">
              Quiz<Text style={styles.wordmarkTail}>Guard</Text>
            </Text>
          </View>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your secure MCQ exam account.
            </Text>
          </View>

          {/* ── Social sign-in ── */}
          <View style={styles.socialRow}>
            <Pressable
              onPress={submit}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              style={({ pressed }) => [
                styles.socialBtn,
                styles.socialBtnGoogle,
                pressed && styles.btnPressed,
              ]}
            >
              <GoogleGlyph size={22} />
              <Text style={styles.socialBtnGoogleText}>Google</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
              style={({ pressed }) => [
                styles.socialBtn,
                styles.socialBtnApple,
                pressed && styles.btnPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="apple"
                size={22}
                color={colors.text}
              />
              <Text style={styles.socialBtnAppleText}>Apple</Text>
            </Pressable>
          </View>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* ── Fields ── */}
          <View style={styles.form}>
            <AuthField
              label="Email Address"
              icon="email-outline"
              labelVariant="heading"
              height={56}
              palette={colors}
              placeholder="teacher@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <AuthField
              label="Password"
              icon="lock-outline"
              labelVariant="heading"
              height={56}
              palette={colors}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>

          {/* ── Remember me / Forgot password ── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setRemember((value) => !value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
              hitSlop={8}
              style={styles.checkRow}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={colors.onAccent}
                  />
                ) : null}
              </View>
              <Text style={styles.checkText}>Remember me</Text>
            </Pressable>

            <Pressable
              onPress={() => undefined}
              accessibilityRole="button"
              hitSlop={10}
            >
              <Text style={styles.link}>Forgot Password?</Text>
            </Pressable>
          </View>

          {/* ── Primary action ── */}
          <Pressable
            onPress={submit}
            disabled={!canContinue}
            accessibilityRole="button"
            android_ripple={{ color: 'rgba(39, 39, 39, 0.16)' }}
            style={({ pressed }) => [
              styles.primary,
              !canContinue && styles.primaryDisabled,
              pressed && canContinue && styles.btnPressed,
            ]}
          >
            <Text style={[styles.primaryText, !canContinue && styles.primaryTextDisabled]}>
              Sign In
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={canContinue ? colors.onAccent : colors.textFaint}
            />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: typeof loginColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
    },

    /* Floating back chevron */
    back: {
      position: 'absolute',
      left: spacing.md,
      padding: spacing.xs,
      borderRadius: radius.pill,
    },

    /* Brand */
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    logoTile: {
      width: 56,
      height: 56,
      borderRadius: 16,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmark: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.text,
    },
    wordmarkTail: {
      color: colors.accent,
    },

    /* Header */
    header: {
      alignItems: 'center',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      ...typography.title1,
      fontSize: 36,
      lineHeight: 44,
      color: colors.text,
    },
    subtitle: {
      ...typography.subhead,
      color: colors.textMuted,
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 22,
    },

    /* Social */
    socialRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    socialBtn: {
      flex: 1,
      height: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm + 4,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
    },
    socialBtnGoogle: {
      backgroundColor: colors.accent,
    },
    socialBtnGoogleText: {
      ...typography.headline,
      fontSize: 18,
      color: colors.onAccent,
    },
    socialBtnApple: {
      backgroundColor: colors.cardIron,
    },
    socialBtnAppleText: {
      ...typography.headline,
      fontSize: 18,
      color: colors.text,
    },
    btnPressed: {
      opacity: 0.85,
    },

    /* Divider */
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      ...typography.callout,
      fontWeight: '500',
      color: colors.textMuted,
    },

    /* Form */
    form: {
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderCurve: 'continuous',
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkText: {
      ...typography.callout,
      color: colors.text,
    },
    link: {
      ...typography.callout,
      fontWeight: '700',
      color: colors.textMuted,
    },

    /* Primary */
    primary: {
      marginTop: spacing.xl,
      height: 62,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
      overflow: 'hidden',
    },
    primaryDisabled: {
      opacity: 0.6,
    },
    primaryText: {
      ...typography.headline,
      fontSize: 20,
      color: colors.onAccent,
    },
    primaryTextDisabled: {
      color: colors.onAccent,
    },
  });
