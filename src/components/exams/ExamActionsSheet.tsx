import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { Exam } from '@/store/examStore';

type ExamActionsSheetProps = {
  /** The exam being acted on. `null` keeps the sheet closed. */
  exam: Exam | null;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/**
 * Long-press menu for an exam: rename or delete.
 *
 * A sheet rather than a floating menu: on Android a long-press menu is a
 * sheet, and the target is a full-width row — thumb-reachable, 56dp tall,
 * and it can carry the exam's name so there is no doubt what is about to be
 * renamed or deleted.
 */
export function ExamActionsSheet({ exam, onClose, onRename, onDelete }: ExamActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();

  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (!exam) return;

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
        damping: 20,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [exam, reduceMotion, backdrop, sheet, useNativeDriver]);

  const translateY = sheet.interpolate({ inputRange: [0, 1], outputRange: [64, 0] });

  return (
    <Modal visible={!!exam} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss menu"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.grabber} />

          <View style={styles.head}>
            <Text style={styles.headTitle} numberOfLines={1}>
              {exam?.title}
            </Text>
            <Text style={styles.headMeta} numberOfLines={1}>
              {exam?.subject ?? 'General'} · Code {exam?.code}
            </Text>
          </View>

          <View style={styles.divider} />

          <ActionRow
            icon="pencil-outline"
            label="Rename exam"
            hint="Change the title students see"
            onPress={onRename}
            styles={styles}
            colors={colors}
          />
          <ActionRow
            icon="trash-can-outline"
            label="Delete exam"
            hint="Removes the exam and its QR code"
            onPress={onDelete}
            styles={styles}
            colors={colors}
            destructive
          />

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  onPress,
  destructive,
  styles,
  colors,
}: {
  icon: 'pencil-outline' | 'trash-can-outline';
  label: string;
  hint: string;
  onPress: () => void;
  destructive?: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      android_ripple={{ color: colors.secondaryPress }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={destructive ? colors.error : colors.text}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
          {label}
        </Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
    </Pressable>
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
      backgroundColor: 'rgba(20, 20, 19, 0.62)',
    },
    sheet: {
      width: '100%',
      maxWidth: 520,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.panel,
      borderTopRightRadius: radius.panel,
      borderCurve: 'continuous',
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    head: {
      gap: 2,
      paddingBottom: spacing.md,
    },
    headTitle: {
      ...typography.headline,
      color: colors.text,
    },
    headMeta: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 60,
      paddingVertical: spacing.sm,
    },
    rowPressed: {
      opacity: 0.7,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    rowIconDestructive: {
      backgroundColor: colors.errorPress,
    },
    rowText: {
      flex: 1,
      gap: 1,
    },
    rowLabel: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    rowLabelDestructive: {
      color: colors.error,
    },
    rowHint: {
      ...typography.caption,
      color: colors.textMuted,
    },
    cancel: {
      minHeight: 52,
      marginTop: spacing.sm,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelPressed: {
      backgroundColor: colors.secondaryPress,
    },
    cancelText: {
      ...typography.headline,
      color: colors.text,
    },
  });
