import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

type Step = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
};

const PROCTORING_STEPS: Step[] = [
  {
    icon: 'qrcode-scan',
    title: '1. Launch Session & Display QR',
    description:
      'Open the exam card from your Home dashboard and present the QR code on a projector or screen for students to scan.',
  },
  {
    icon: 'account-check-outline',
    title: '2. Verify Student Check-In',
    description:
      'Ensure every student enters with their verified full name. Students without cameras can enter the 6-character code manually.',
  },
  {
    icon: 'shield-lock-outline',
    title: '3. Test Environment Integrity',
    description:
      'Instruct students to silence notifications and remain focused inside the exam window throughout the entire test duration.',
  },
  {
    icon: 'check-circle-outline',
    title: '4. Monitor & Collect Submissions',
    description:
      'Track active attempts in real-time. Once the timer elapses, submissions are finalized and ready for review.',
  },
];

type ProctoringSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function ProctoringSheet({ visible, onClose }: ProctoringSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (!visible) return;

    backdrop.setValue(0);
    sheet.setValue(0);

    if (reduceMotion) {
      backdrop.setValue(1);
      sheet.setValue(1);
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 180, useNativeDriver }),
      Animated.spring(sheet, {
        toValue: 1,
        damping: 22,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [visible, reduceMotion, backdrop, sheet, useNativeDriver]);

  const translateY = sheet.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  const handleClose = () => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close proctoring guidelines"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIconWrapper}>
              <MaterialCommunityIcons name="shield-check" size={26} color={colors.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Proctoring Guidelines</Text>
              <Text style={styles.subtitle}>Standard operating procedure for secure exams</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PROCTORING_STEPS.map((step, index) => (
              <View key={step.title} style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <MaterialCommunityIcons name={step.icon} size={22} color={colors.accent} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Done reading guidelines"
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </Pressable>
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
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.panel,
      borderTopRightRadius: radius.panel,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      maxWidth: 540,
      width: '100%',
      alignSelf: 'center',
      maxHeight: '85%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerIconWrapper: {
      width: 46,
      height: 46,
      borderRadius: radius.control,
      backgroundColor: colors.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    scrollArea: {
      maxHeight: 380,
    },
    scrollContent: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    stepCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.bg,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepIconContainer: {
      width: 36,
      height: 36,
      borderRadius: radius.control,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    stepBody: {
      flex: 1,
      gap: 4,
    },
    stepTitle: {
      ...typography.headline,
      fontSize: 15,
      color: colors.text,
    },
    stepDescription: {
      ...typography.footnote,
      color: colors.textMuted,
      lineHeight: 18,
    },
    actionButton: {
      minHeight: 48,
      backgroundColor: colors.accent,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    actionButtonPressed: {
      opacity: 0.85,
    },
    actionButtonText: {
      ...typography.headline,
      fontSize: 16,
      color: colors.onAccent,
    },
  });
