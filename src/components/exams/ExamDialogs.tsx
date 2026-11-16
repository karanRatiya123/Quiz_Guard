import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { Exam } from '@/store/examStore';

/**
 * Rename dialog.
 *
 * A dialog rather than an inline edit on the card: the card is a button that
 * opens the QR code, and making one of its lines editable would fight that.
 */
export function RenameExamDialog({
  exam,
  onCancel,
  onSubmit,
}: {
  exam: Exam | null;
  onCancel: () => void;
  onSubmit: (title: string) => void;
}) {
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft(exam?.title ?? '');
  }, [exam?.id, exam?.title]);

  const trimmed = draft.trim();
  const canSave = trimmed.length > 0 && trimmed !== exam?.title;

  return (
    <Modal visible={!!exam} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            Rename exam
          </Text>
          <Text style={styles.body}>Students see this title when they join.</Text>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus
            selectTextOnFocus
            maxLength={60}
            placeholder="Exam title"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.text}
            returnKeyType="done"
            onSubmitEditing={() => canSave && onSubmit(trimmed)}
            accessibilityLabel="Exam title"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [styles.ghost, pressed && styles.ghostPressed]}
            >
              <Text style={styles.ghostText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => onSubmit(trimmed)}
              disabled={!canSave}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primary,
                !canSave && styles.primaryDisabled,
                pressed && canSave && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryText, !canSave && styles.primaryTextDisabled]}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Destructive confirmation.
 *
 * The exam title is quoted back so the user can see exactly what is going
 * away, and the consequence is stated in plain words instead of "Are you
 * sure?" — which tells them nothing.
 */
export function DeleteExamDialog({
  exam,
  onCancel,
  onConfirm,
}: {
  exam: Exam | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={!!exam} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.dangerIcon}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            Delete this exam?
          </Text>
          <Text style={styles.body}>
            <Text style={styles.strong}>{exam?.title}</Text> will be removed for every student.
            Its QR code stops working and this cannot be undone.
          </Text>

          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            style={({ pressed }) => [styles.danger, pressed && styles.pressed]}
          >
            <Text style={styles.dangerText}>Delete exam</Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ghost, styles.ghostFull, pressed && styles.ghostPressed]}
          >
            <Text style={styles.ghostText}>Keep it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(20, 20, 19, 0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    dangerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorPress,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.title2,
      color: colors.text,
    },
    body: {
      ...typography.subhead,
      color: colors.textMuted,
      lineHeight: 21,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    strong: {
      fontWeight: '700',
      color: colors.text,
    },
    input: {
      height: 50,
      paddingHorizontal: 14,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      fontSize: 16,
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    ghost: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostFull: {
      marginTop: spacing.sm,
    },
    ghostPressed: {
      backgroundColor: colors.secondaryPress,
    },
    ghostText: {
      ...typography.headline,
      color: colors.text,
    },
    primary: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      // Cream accent disappears on the light-mode cream sheet; ink carries it.
      backgroundColor: colors.isDark ? colors.accent : colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryDisabled: {
      backgroundColor: colors.accentPress,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryText: {
      ...typography.headline,
      color: colors.isDark ? colors.onAccent : colors.cardCream,
    },
    primaryTextDisabled: {
      color: colors.textFaint,
    },
    danger: {
      minHeight: 48,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerText: {
      ...typography.headline,
      color: colors.isDark ? colors.bg : '#FFFFFF',
    },
    pressed: {
      opacity: 0.88,
    },
  });
