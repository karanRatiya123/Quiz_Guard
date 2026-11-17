import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
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

type FaqItem = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    id: 'code-join',
    icon: 'dialpad',
    question: 'How do students join without scanning the QR?',
    answer:
      'Students can tap "Enter Code Manually" on their welcome screen and type the 7-character subject code (e.g., MATH-201 or PHY-118) visible on each exam card.',
  },
  {
    id: 'upload-formats',
    icon: 'file-document-outline',
    question: 'What question paper formats are supported?',
    answer:
      'Quiz Guard supports PDF documents (.pdf) and Excel workbooks (.xlsx, .xls) up to 20 MB. Uploaded files are securely processed and linked to the exam code.',
  },
  {
    id: 'edit-delete',
    icon: 'gesture-tap-hold',
    question: 'How do I rename or delete an existing exam?',
    answer:
      'On the Home tab, long-press any exam card to bring up the management sheet. You can rename the title or permanently delete the exam.',
  },
  {
    id: 'offline-mode',
    icon: 'wifi-check',
    question: 'Does the app tolerate network fluctuations?',
    answer:
      'Yes. Once students join and start the test session, their local session stays protected so momentary Wi-Fi drops do not disrupt test taking.',
  },
];

type HelpFaqSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function HelpFaqSheet({ visible, onClose }: HelpFaqSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const [expandedId, setExpandedId] = useState<string | null>('code-join');

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

  const toggleExpand = (id: string) => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close help and FAQs"
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
              <MaterialCommunityIcons name="help-circle" size={26} color={colors.accent} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Help & FAQs</Text>
              <Text style={styles.subtitle}>Frequently asked questions for instructors</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {FAQS.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <Pressable
                  key={faq.id}
                  onPress={() => toggleExpand(faq.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  style={styles.faqCard}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqIconContainer}>
                      <MaterialCommunityIcons name={faq.icon} size={20} color={colors.accent} />
                    </View>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close help FAQs"
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
    faqCard: {
      padding: spacing.md,
      backgroundColor: colors.bg,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    faqIconContainer: {
      width: 32,
      height: 32,
      borderRadius: radius.control,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    faqQuestion: {
      ...typography.headline,
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    faqBody: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingLeft: 40,
    },
    faqAnswer: {
      ...typography.footnote,
      color: colors.textMuted,
      lineHeight: 19,
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
