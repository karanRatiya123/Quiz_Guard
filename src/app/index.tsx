import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleRow } from '@/components/ui/RoleRow';
import type { ThemeColors } from '@/constants/colors';
import { spacing, typography } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user';

const EASE_OUT = Easing.bezier(0.25, 1, 0.5, 1);

/**
 * Landing screen — "I'm a Teacher / I'm a Student".
 *
 * The whole app branches from here: the chosen role is saved in `authStore`
 * and the user is pushed to that role's first screen. There is no login on
 * this screen; it only records the choice.
 *
 * It is also the simplest example of the animated page entrance used across
 * the app: one `Animated.Value` fades the content in and slides it up 16px.
 */
export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const setRole = useAuthStore((state) => state.setRole);
  const reduceMotion = useReduceMotion();
  const contentIn = useAnimatedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      // Accessibility setting is on: jump to the end state, no motion at all.
      contentIn.setValue(1);
      return;
    }
    // `useNativeDriver: true` runs opacity/transform on the UI thread, so the
    // entrance stays smooth even while JavaScript is still busy on first paint.
    Animated.timing(contentIn, { toValue: 1, duration: 350, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [contentIn, reduceMotion]);

  /**
   * Both cards land here. Storing the role first means screens further in can
   * read it (`useAuthStore`) without re-asking; then we push the matching
   * starting screen. `push` (not `replace`) keeps the landing screen on the
   * back stack, so system back returns to the role choice.
   */
  const chooseRole = (role: UserRole) => {
    if (process.env.EXPO_OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRole(role);
    router.push(role === 'student' ? '/student/join' : '/teacher/login');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Animated.View
          style={[styles.container, { opacity: contentIn, transform: [{ translateY: contentIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
        >
          {/* Brand header */}
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <MaterialCommunityIcons name="school" size={28} color={colors.onAccent} />
            </View>
            <Text style={styles.brandName}>Quiz<Text style={styles.brandAccent}>Guard</Text></Text>
          </View>

          {/* Hero section */}
          <View style={styles.hero}>
            <Text style={styles.title} accessibilityRole="header">Secure{`\n`}MCQ Exams</Text>
            <View style={styles.titleRule} />
            <Text style={styles.subtitle}>Create, share and attempt MCQ tests in a safe and controlled environment.</Text>

            {/* Exam visual illustration */}
            <View style={styles.examVisual} accessible accessibilityLabel="Secure exam preview">
              {/* Back sheet (shadow) */}
              <View style={styles.examSheetBack} />
              {/* Main exam sheet */}
              <View style={styles.examSheet}>
                <View style={styles.checkCircle}>
                  <MaterialCommunityIcons name="check-bold" size={16} color={colors.onAccent} />
                </View>
                <View style={styles.examLineLong} />
                <View style={styles.examLineShort} />
                <View style={styles.examOption} />
                <View style={styles.examOption} />
              </View>
              {/* Lock badge */}
              <View style={styles.lockBadge}>
                <MaterialCommunityIcons name="lock" size={24} color={colors.onAccent} />
              </View>
            </View>
          </View>

          {/* Role selection cards */}
          <View style={styles.roles}>
            <RoleRow
              icon="human-male-board"
              accentColor={colors.accent}
              cardTone="light"
              title="I'm a Teacher"
              description="Create an MCQ test and share it securely."
              onPress={() => chooseRole('teacher')}
            />
            <RoleRow
              icon="school-outline"
              accentColor={colors.accent}
              cardTone="dark"
              title="I'm a Student"
              description="Join a test using a code or QR."
              onPress={() => chooseRole('student')}
            />
          </View>

          <Text style={styles.footnote}>Leaving an active exam automatically submits your answers.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  container: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: spacing.lg },

  /* Brand */
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  brandName: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.text },
  brandAccent: { color: colors.accent },

  /* Hero */
  hero: { minHeight: 390, justifyContent: 'flex-start', paddingTop: spacing.xxl, position: 'relative' },
  title: { ...typography.largeTitle, maxWidth: 205, fontSize: 40, lineHeight: 43, letterSpacing: -1.1, color: colors.text },
  titleRule: {
    width: 92,
    height: 8,
    marginTop: spacing.lg,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  subtitle: {
    ...typography.subhead,
    maxWidth: 210,
    marginTop: spacing.lg,
    color: colors.textMuted,
    lineHeight: 24,
  },

  /* Exam visual illustration */
  examVisual: {
    position: 'absolute',
    right: -spacing.sm,
    top: 96,
    width: 176,
    height: 172,
  },
  examSheetBack: {
    position: 'absolute',
    right: 13,
    top: 12,
    width: 126,
    height: 145,
    borderRadius: 24,
    backgroundColor: colors.surface,
    transform: [{ rotate: '-10deg' }],
  },
  examSheet: {
    position: 'absolute',
    right: 22,
    top: 4,
    width: 126,
    height: 145,
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.cardCream,
    transform: [{ rotate: '8deg' }],
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  examLineLong: {
    height: 8,
    marginTop: spacing.md,
    borderRadius: 4,
    backgroundColor: colors.onCreamMuted,
    opacity: 0.35,
  },
  examLineShort: {
    width: '60%',
    height: 8,
    marginTop: spacing.sm,
    borderRadius: 4,
    backgroundColor: colors.onCreamMuted,
    opacity: 0.25,
  },
  examOption: {
    height: 7,
    marginTop: spacing.md,
    borderRadius: 4,
    backgroundColor: colors.onCreamMuted,
    opacity: 0.22,
  },
  lockBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },

  /* Role cards */
  roles: { gap: spacing.md },

  /* Footer */
  footnote: { ...typography.footnote, marginTop: spacing.xl, color: colors.textFaint, textAlign: 'center' },
});
