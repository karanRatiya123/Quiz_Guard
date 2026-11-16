import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFloatingTabBarSpace } from '@/components/navigation/FloatingTabBar';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { formatCount } from '@/utils/format';

const APPEARANCE_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { mode: 'dark', label: 'Dark', icon: 'weather-night' },
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny' },
];

/**
 * Profile tab — teacher identity, exam settings, sign out.
 * Security settings live here (they used to sit on the home screen).
 *
 * Worth knowing: the two security switches are plain `useState`, so they only
 * exist while this screen is mounted and are never sent anywhere. The
 * appearance control is different — it writes to `themeStore`, which is why
 * changing it repaints the whole app instantly.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const barSpace = useFloatingTabBarSpace();
  const resetAuth = useAuthStore((state) => state.reset);
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);

  const exams = useExamStore((state) => state.exams);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [lateJoins, setLateJoins] = useState(false);

  /** In light mode a cream on-track would vanish inside the cream card. */
  const switchTrackOn = colors.isDark ? colors.accent : colors.text;
  const switchThumb = colors.isDark ? colors.onAccent : colors.cardCream;
  /** react-native-web ignores `thumbColor` for the on state and defaults to teal. */
  const webSwitchProps = Platform.OS === 'web' ? { activeThumbColor: switchThumb } : {};

  const subjects = new Set(exams.map((exam) => exam.subject).filter(Boolean)).size;

  /**
   * Sign out = clear the role and go back to the landing screen.
   *
   * There is no session to revoke, so this is only state cleanup. `dismissAll`
   * first removes the teacher stack (login + tabs); without it, the back
   * gesture would walk into screens the user just signed out of. `replace`
   * then puts the landing screen in place with nothing behind it.
   */
  const signOut = () => {
    const confirm = () => {
      if (process.env.EXPO_OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      resetAuth();
      if (router.canDismiss()) router.dismissAll();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      confirm();
      return;
    }

    Alert.alert('Sign out?', 'You will need to sign in again to manage your exams.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: confirm },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: barSpace,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title} accessibilityRole="header">
          Profile
        </Text>
      </View>

      {/* Teacher card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AR</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>Alex Rivera</Text>
          <Text style={styles.email}>alex.rivera@quizguard.app</Text>
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name="school-outline" size={13} color={colors.onCream} />
            <Text style={styles.rolePillText}>Teacher</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{formatCount(exams.length)}</Text>
          <Text style={styles.statLabel}>Exams created</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{formatCount(subjects)}</Text>
          <Text style={styles.statLabel}>Subjects covered</Text>
        </View>
      </View>

      {/* Exam security */}
      <Text style={styles.sectionTitle}>EXAM SECURITY</Text>
      <View style={styles.group}>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Auto-submit on leave</Text>
            <Text style={styles.settingDescription}>
              Submits a student&apos;s attempt if they exit or switch apps.
            </Text>
          </View>
          <Switch
            value={autoSubmit}
            onValueChange={setAutoSubmit}
            {...webSwitchProps}
            trackColor={{ false: colors.surfaceMuted, true: switchTrackOn }}
            thumbColor={switchThumb}
          />
        </View>
        <View style={styles.groupDivider} />
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Allow late joins</Text>
            <Text style={styles.settingDescription}>
              Students can scan the QR after the exam has started.
            </Text>
          </View>
          <Switch
            value={lateJoins}
            onValueChange={setLateJoins}
            {...webSwitchProps}
            trackColor={{ false: colors.surfaceMuted, true: switchTrackOn }}
            thumbColor={switchThumb}
          />
        </View>
      </View>

      {/* Faculty — the admin creates the other teacher accounts here */}
      <Text style={styles.sectionTitle}>FACULTY</Text>
      <View style={styles.group}>
        <Pressable
          onPress={() => router.navigate('/teacher/add-faculty')}
          accessibilityRole="button"
          accessibilityLabel="Add faculty"
          accessibilityHint="Opens a form to create a teacher account"
          android_ripple={{ color: colors.secondaryPress }}
          style={({ pressed }) => [styles.facultyRow, pressed && styles.infoRowPressed]}
        >
          <View style={styles.facultyIcon}>
            <MaterialCommunityIcons
              name="account-multiple-plus-outline"
              size={20}
              color={colors.text}
            />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Add faculty</Text>
            <Text style={styles.settingDescription}>
              Create a teacher sign-in with an email and password.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
        </Pressable>
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.group}>
        <View style={styles.settingRow}>
          <Text style={styles.settingTitle}>Appearance</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Appearance"
            style={styles.segmented}
          >
            {APPEARANCE_OPTIONS.map((option) => {
              const selected = option.mode === themeMode;
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => {
                    if (selected) return;
                    if (process.env.EXPO_OS !== 'web') {
                      void Haptics.selectionAsync();
                    }
                    setThemeMode(option.mode);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} mode`}
                  accessibilityState={{ selected }}
                  android_ripple={{ color: colors.secondaryPress, borderless: false }}
                  style={({ pressed }) => [
                    styles.segment,
                    selected && styles.segmentSelected,
                    pressed && !selected && styles.segmentPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={15}
                    color={selected ? colors.onAccent : colors.textMuted}
                  />
                  <Text
                    style={[styles.segmentText, selected && styles.segmentTextSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.groupDivider} />
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          android_ripple={{ color: colors.secondaryPress }}
          style={({ pressed }) => [styles.infoRow, pressed && styles.infoRowPressed]}
        >
          <Text style={[styles.infoLabel, styles.signOutLabel]}>Sign out</Text>
          <MaterialCommunityIcons name="logout" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.version}>Quiz Guard 1.0.0</Text>
    </ScrollView>
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

    /* Header */
    header: {
      marginBottom: spacing.lg,
      gap: 2,
    },
    eyebrow: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
    },
    title: {
      ...typography.largeTitle,
      color: colors.text,
    },

    /* Teacher card */
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.cardCream,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: radius.pill,
      backgroundColor: colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...typography.title3,
      color: colors.cardCream,
    },
    profileText: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...typography.title3,
      color: colors.onCream,
    },
    email: {
      ...typography.footnote,
      color: colors.onCreamMuted,
    },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(39, 39, 39, 0.12)',
    },
    rolePillText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '600',
      color: colors.onCream,
    },

    /* Stats */
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      alignItems: 'center',
      gap: 2,
    },
    statValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    statLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },

    /* Groups */
    sectionTitle: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      paddingHorizontal: 2,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
      overflow: 'hidden',
    },
    groupDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      padding: spacing.md,
    },
    settingText: {
      flex: 1,
      gap: 2,
    },
    settingTitle: {
      ...typography.headline,
      color: colors.text,
    },
    settingDescription: {
      ...typography.footnote,
      color: colors.textMuted,
      lineHeight: 18,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    /* Faculty row */
    facultyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    facultyIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoRowPressed: {
      backgroundColor: colors.secondaryPress,
    },
    /* Appearance segmented control */
    segmented: {
      flexDirection: 'row',
      gap: 4,
      padding: 3,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
    },
    segment: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      minHeight: 34,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
    },
    segmentSelected: {
      backgroundColor: colors.accent,
    },
    segmentPressed: {
      opacity: 0.8,
    },
    segmentText: {
      ...typography.footnote,
      fontWeight: '600',
      color: colors.textMuted,
    },
    segmentTextSelected: {
      color: colors.onAccent,
    },
    infoLabel: {
      ...typography.body,
      color: colors.text,
    },
    infoValue: {
      ...typography.subhead,
      color: colors.textFaint,
    },
    signOutLabel: {
      fontWeight: '600',
    },

    version: {
      ...typography.footnote,
      color: colors.textFaint,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
