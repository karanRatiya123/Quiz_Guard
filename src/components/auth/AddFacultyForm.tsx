import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
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
import { Mark } from '@/components/brand/Mark';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useFacultyStore } from '@/store/facultyStore';
import type { FacultyMember } from '@/types/user';

/** "Priya Sharma" → "PS"; one word → its first two letters. */
function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Admin-only "Add faculty" page.
 *
 * Reached from Profile → Faculty. It creates a teacher entry from a name, an
 * email and a password, then shows the directory so the admin can see the new
 * account land. Nothing is sent anywhere: the password is validated and
 * discarded, and the entry lives in `facultyStore` until the app restarts.
 *
 * The whole form is one screen on purpose — three fields and one action do not
 * need a wizard.
 */
export function AddFacultyForm() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();

  const members = useFacultyStore((state) => state.members);
  const addFaculty = useFacultyStore((state) => state.addFaculty);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<FacultyMember | null>(null);

  const bannerIn = useAnimatedValue(0);

  // Slide the confirmation in once, every time a new account is added.
  useEffect(() => {
    if (!added) return;
    if (reduceMotion) {
      bannerIn.setValue(1);
      return;
    }
    bannerIn.setValue(0);
    Animated.timing(bannerIn, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [added, bannerIn, reduceMotion]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(trimmedEmail);
  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = confirm.length > 0 && confirm === password;
  const canSubmit =
    trimmedName.length >= 2 && emailLooksValid && passwordLongEnough && passwordsMatch;

  const initials = initialsOf(trimmedName);

  /** Newest account first, so the row the admin just created is at the top. */
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => b.addedAt - a.addedAt),
    [members],
  );

  const haptic = (kind: 'success' | 'error') => {
    if (process.env.EXPO_OS === 'web') return;
    if (kind === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const goBack = () => {
    // Deep links (web refresh, notification tap) have no back stack, so fall
    // back to the Profile tab instead of doing nothing.
    if (router.canGoBack()) router.back();
    else router.replace('/teacher/profile');
  };

  const submit = () => {
    if (!canSubmit) return;

    const result = addFaculty({ name: trimmedName, email: trimmedEmail });
    if (!result.ok) {
      haptic('error');
      setAdded(null);
      setError('That email already has a faculty account.');
      return;
    }

    haptic('success');
    setError(null);
    setAdded(result.member);
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    AccessibilityInfo.announceForAccessibility(
      `${result.member.name} was added to the faculty list.`,
    );
  };

  const bannerShift = bannerIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
            </Pressable>

            <View style={styles.brandRow}>
              <Mark size={20} />
              <Text style={styles.brandTitle}>
                Quiz<Text style={styles.brandAccent}>Guard</Text>
              </Text>
            </View>

            <Text style={styles.headerTag}>ADMIN</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title} accessibilityRole="header">
              Add faculty
            </Text>
            <Text style={styles.subtitle}>
              Create a teacher account with an email and a temporary password.
            </Text>
          </View>

          {/* ── Live preview of the account card ── */}
          <View style={styles.previewCard} accessible accessibilityLabel="Account preview">
            <View style={styles.previewAvatar}>
              {initials ? (
                <Text style={styles.previewInitials}>{initials}</Text>
              ) : (
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={26}
                  color={colors.cardCream}
                />
              )}
            </View>
            <View style={styles.previewText}>
              <Text style={styles.previewName} numberOfLines={1}>
                {trimmedName || 'New faculty member'}
              </Text>
              <Text style={styles.previewEmail} numberOfLines={1}>
                {trimmedEmail || 'name@college.edu'}
              </Text>
              <View style={styles.previewPill}>
                <MaterialCommunityIcons name="school-outline" size={12} color={colors.onCream} />
                <Text style={styles.previewPillText}>Faculty</Text>
              </View>
            </View>
          </View>

          {/* ── Credentials ── */}
          <Text style={styles.sectionTitle}>CREDENTIALS</Text>

          <View style={styles.form}>
            <AuthField
              label="Full name"
              icon="account-outline"
              height={54}
              palette={colors}
              placeholder="Priya Sharma"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

            <AuthField
              label="Email address"
              icon="email-outline"
              height={54}
              palette={colors}
              placeholder="priya.sharma@college.edu"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                // The duplicate warning belongs to the old address; hide it as
                // soon as the admin starts typing a new one.
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <View style={styles.fieldBlock}>
              <AuthField
                label="Temporary password"
                icon="lock-outline"
                height={54}
                palette={colors}
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
              />
              <View style={styles.hintRow}>
                <MaterialCommunityIcons
                  name={passwordLongEnough ? 'check-circle-outline' : 'information-outline'}
                  size={14}
                  color={passwordLongEnough ? colors.text : colors.textFaint}
                />
                <Text style={styles.hintText}>
                  {passwordLongEnough
                    ? 'Password length looks good.'
                    : 'Use at least 8 characters.'}
                </Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <AuthField
                label="Confirm password"
                icon="lock-check-outline"
                height={54}
                palette={colors}
                placeholder="Repeat the password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              {confirm.length > 0 && !passwordsMatch ? (
                <Text style={styles.fieldError}>Passwords do not match yet.</Text>
              ) : null}
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color={colors.error}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Create faculty account"
            accessibilityState={{ disabled: !canSubmit }}
            style={({ pressed }) => [
              styles.primary,
              !canSubmit && styles.primaryDisabled,
              pressed && canSubmit && styles.primaryPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={19}
              color={canSubmit ? colors.onAccent : colors.textFaint}
            />
            <Text style={[styles.primaryText, !canSubmit && styles.primaryTextDisabled]}>
              Create faculty account
            </Text>
          </Pressable>

          {/* ── Confirmation ── */}
          {added ? (
            <Animated.View
              style={[
                styles.successBanner,
                { opacity: bannerIn, transform: [{ translateY: bannerShift }] },
              ]}
            >
              <MaterialCommunityIcons
                name="check-decagram"
                size={22}
                color={colors.onCream}
              />
              <View style={styles.successText}>
                <Text style={styles.successTitle}>Faculty added</Text>
                <Text style={styles.successMessage}>
                  {added.name} is now in this session&apos;s faculty list.
                </Text>
              </View>
            </Animated.View>
          ) : null}

          <Text style={styles.footnote}>
            Demo build · The password is never stored or emailed. Accounts exist only while
            the app is open and clear on restart.
          </Text>

          {/* ── Directory ── */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>FACULTY · {sortedMembers.length}</Text>
            <View style={styles.group}>
              {sortedMembers.map((member, index) => (
                <View key={member.id}>
                  {index > 0 ? <View style={styles.groupDivider} /> : null}
                  <View style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>{initialsOf(member.name)}</Text>
                    </View>
                    <View style={styles.memberText}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>
                        {member.email}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.rolePill,
                        member.role === 'admin' && styles.rolePillAdmin,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rolePillText,
                          member.role === 'admin' && styles.rolePillTextAdmin,
                        ]}
                      >
                        {member.role === 'admin' ? 'Admin' : 'Faculty'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
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
      maxWidth: 500,
      alignSelf: 'center',
      paddingHorizontal: spacing.lg,
    },

    /* Header */
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
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
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    brandAccent: {
      color: colors.textMuted,
    },
    headerTag: {
      ...typography.caption,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.textFaint,
    },

    /* Title */
    titleSection: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.largeTitle,
      letterSpacing: -0.5,
      color: colors.text,
    },
    subtitle: {
      ...typography.subhead,
      marginTop: spacing.xs,
      lineHeight: 22,
      color: colors.textMuted,
    },

    /* Preview card */
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.cardCream,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    previewAvatar: {
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewInitials: {
      ...typography.title3,
      color: colors.cardCream,
      letterSpacing: 0.5,
    },
    previewText: {
      flex: 1,
      gap: 2,
    },
    previewName: {
      ...typography.title3,
      color: colors.onCream,
    },
    previewEmail: {
      ...typography.footnote,
      color: colors.onCreamMuted,
    },
    previewPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.cardSage,
    },
    previewPillText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      color: colors.onCream,
    },

    /* Form */
    sectionTitle: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      paddingHorizontal: 2,
    },
    form: {
      gap: spacing.md,
    },
    fieldBlock: {
      gap: 6,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 2,
    },
    hintText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
    },
    fieldError: {
      ...typography.caption,
      color: colors.error,
      paddingHorizontal: 2,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    errorText: {
      ...typography.footnote,
      color: colors.error,
      flex: 1,
    },

    /* Action */
    primary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 54,
      marginTop: spacing.lg,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
    },
    primaryDisabled: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryPressed: {
      opacity: 0.9,
    },
    primaryText: {
      ...typography.headline,
      color: colors.onAccent,
    },
    primaryTextDisabled: {
      color: colors.textMuted,
    },

    /* Success banner */
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      backgroundColor: colors.cardCream,
    },
    successText: {
      flex: 1,
      gap: 2,
    },
    successTitle: {
      ...typography.headline,
      color: colors.onCream,
    },
    successMessage: {
      ...typography.footnote,
      color: colors.onCreamMuted,
      lineHeight: 18,
    },

    footnote: {
      ...typography.caption,
      color: colors.textFaint,
      lineHeight: 17,
      marginTop: spacing.md,
    },

    /* Directory */
    listSection: {
      marginTop: spacing.lg,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    groupDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberInitials: {
      ...typography.footnote,
      fontWeight: '700',
      color: colors.text,
    },
    memberText: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.text,
    },
    memberEmail: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    rolePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
    },
    rolePillAdmin: {
      backgroundColor: colors.text,
    },
    rolePillText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    rolePillTextAdmin: {
      color: colors.bg,
    },
  });
