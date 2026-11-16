import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeleteExamDialog, RenameExamDialog } from '@/components/exams/ExamDialogs';
import { ExamActionsSheet } from '@/components/exams/ExamActionsSheet';
import { useFloatingTabBarSpace } from '@/components/navigation/FloatingTabBar';
import type { ThemeColors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import type { Exam, ExamStatus } from '@/store/examStore';
import { useExamStore } from '@/store/examStore';
import { formatCount, greetingFor, todayLabel } from '@/utils/format';

const FILTERS = [
  { key: 'all', label: 'All', empty: 'exams' },
  { key: 'active', label: 'Live', empty: 'live exams' },
  { key: 'scheduled', label: 'Scheduled', empty: 'scheduled exams' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

/**
 * The parts of `react-native-qrcode-svg`'s instance we use. Its bundled types
 * omit `toDataURL`, so the handle is described here instead of casting to any.
 */
type QrCodeHandle = {
  toDataURL: (callback: (data: string) => void) => void;
};

type Styles = ReturnType<typeof createStyles>;

/**
 * Teacher dashboard — Home tab.
 *
 * Hierarchy: greeting → the total (the number teachers open the app for) →
 * filter → the exam list → QR overlay. The bar floats above the content.
 */
export default function TeacherHomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const barSpace = useFloatingTabBarSpace();

  const exams = useExamStore((state) => state.exams);
  const renameExam = useExamStore((state) => state.renameExam);
  const deleteExam = useExamStore((state) => state.deleteExam);
  /**
   * Three overlapping menus are possible — QR, long-press actions, dialogs.
   * Keeping one `useState` per layer means each closes independently, and the
   * handlers below always close the parent before opening the child so two
   * modals are never stacked.
   */
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [actionsExam, setActionsExam] = useState<Exam | null>(null);
  const [renameTarget, setRenameTarget] = useState<Exam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const qrRef = useRef<QrCodeHandle | null>(null);
  /** Set on long-press so the release does not also open the QR code. */
  const longPressId = useRef<string | null>(null);

  /**
   * Everything below is *derived* from `exams`, never stored in state.
   *
   * If the totals were `useState`, every add/rename/delete would need to
   * remember to update them too; a missed update means a stale dashboard.
   * Recomputing on render is cheap for a list this size and can never drift.
   */
  const total = exams.length;
  const live = exams.filter((exam) => exam.status === 'active').length;
  const scheduled = exams.filter((exam) => exam.status === 'scheduled').length;
  const subjects = new Set(exams.map((exam) => exam.subject).filter(Boolean)).size;

  const counts: Record<FilterKey, number> = { all: total, active: live, scheduled };
  const visible = filter === 'all' ? exams : exams.filter((exam) => exam.status === filter);
  const filterLabel = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];

  /** One sentence under the greeting; the first matching case wins. */
  const summary =
    total === 0
      ? 'Create your first exam to get started.'
      : live > 0
        ? `${live} exam${live > 1 ? 's' : ''} live right now`
        : scheduled > 0
          ? `${scheduled} scheduled — ready when you are`
          : 'Everything is up to date';

  const selectFilter = (key: FilterKey) => {
    if (key === filter) return;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setFilter(key);
  };

  const showQr = (exam: Exam) => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedExam(exam);
  };

  const openActions = (exam: Exam) => {
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActionsExam(exam);
  };

  /** Delete is destructive, so the sheet closes first and a confirm dialog asks. */
  const requestDelete = (exam: Exam) => {
    setSelectedExam(null);
    setActionsExam(null);
    setDeleteTarget(exam);
  };

  const confirmRename = (title: string) => {
    if (renameTarget) renameExam(renameTarget.id, title);
    setRenameTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    deleteExam(deleteTarget.id);
    setDeleteTarget(null);
  };

  /**
   * Saves the QR as a PNG. On Android/iOS the file goes to the cache and the
   * system share sheet takes over — that is the platform's "save to device",
   * and it needs no storage permission.
   */
  const downloadQr = () => {
    const exam = selectedExam;
    if (!exam) return;

    if (process.env.EXPO_OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    qrRef.current?.toDataURL((base64) => {
      const fileName = `quizguard-${exam.code}.png`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = fileName;
        link.click();
        return;
      }

      void (async () => {
        const directory = FileSystem.cacheDirectory;
        if (!directory) return;

        const uri = `${directory}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Save exam QR code',
            UTI: 'public.png',
          });
        }
      })();
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
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
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{todayLabel()}</Text>
            <Text style={styles.greeting} accessibilityRole="header">
              {greetingFor()}
            </Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>
          <Pressable
            onPress={() => router.navigate('/teacher/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            hitSlop={8}
            style={({ pressed }) => [
              styles.avatar,
              pressed && !reduceMotion && styles.avatarPressed,
              pressed && reduceMotion && styles.avatarPressedFlat,
            ]}
          >
            <Text style={styles.avatarText}>AR</Text>
          </Pressable>
        </View>

        {/* Hero: total exams */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroHeadline}>
              <Text style={styles.heroLabel}>TOTAL EXAMS</Text>
              <Text style={styles.heroValue} accessibilityRole="header">
                {formatCount(total)}
              </Text>
              <Text style={styles.heroCaption}>
                {subjects > 0
                  ? `Across ${subjects} subject${subjects > 1 ? 's' : ''}`
                  : 'Nothing yet'}
              </Text>
            </View>

            <Pressable
              onPress={() => router.navigate('/teacher/upload')}
              accessibilityRole="button"
              accessibilityLabel="Create a new exam"
              style={({ pressed }) => [
                styles.newExamBtn,
                pressed && !reduceMotion && styles.btnPressed,
                pressed && reduceMotion && styles.btnPressedFlat,
              ]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.cardCream} />
              <Text style={styles.newExamBtnText}>New exam</Text>
            </Pressable>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.metricsRow}>
            <Metric label="Live" value={formatCount(live)} styles={styles} />
            <View style={styles.metricDivider} />
            <Metric label="Scheduled" value={formatCount(scheduled)} styles={styles} />
            <View style={styles.metricDivider} />
            <Metric label="Subjects" value={formatCount(subjects)} styles={styles} />
          </View>
        </View>

        {/* Exams */}
        <Text style={styles.sectionTitle}>YOUR EXAMS</Text>

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const selected = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => selectFilter(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                android_ripple={{ color: colors.secondaryPress }}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && !selected && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
                <Text style={[styles.chipCount, selected && styles.chipCountSelected]}>
                  {counts[item.key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {total === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No exams yet</Text>
            <Text style={styles.emptyBody}>
              Create your first exam, then share the QR code with your class.
            </Text>
            <Pressable
              onPress={() => router.navigate('/teacher/upload')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.emptyBtn,
                pressed && !reduceMotion && styles.btnPressed,
                pressed && reduceMotion && styles.btnPressedFlat,
              ]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.onAccent} />
              <Text style={styles.emptyBtnText}>New exam</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="filter-remove-outline" size={26} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No {filterLabel.empty}</Text>
            <Text style={styles.emptyBody}>
              Nothing matches this filter right now. Switch back to see every exam.
            </Text>
            <Pressable
              onPress={() => selectFilter('all')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.emptyBtn,
                pressed && !reduceMotion && styles.btnPressed,
                pressed && reduceMotion && styles.btnPressedFlat,
              ]}
            >
              <Text style={styles.emptyBtnText}>Show all exams</Text>
            </Pressable>
          </View>
        ) : (
          visible.map((exam) => (
            <Pressable
              key={exam.id}
              onPress={() => {
                // A long press already opened the menu; the release must not
                // also open the QR code underneath it.
                if (longPressId.current === exam.id) {
                  longPressId.current = null;
                  return;
                }
                showQr(exam);
              }}
              onLongPress={() => {
                longPressId.current = exam.id;
                openActions(exam);
              }}
              delayLongPress={400}
              accessibilityRole="button"
              accessibilityLabel={`${exam.title}, code ${exam.code}`}
              accessibilityHint="Opens the QR code. Long press to rename or delete."
              // A long press is unreachable for screen-reader users, so the
              // same menu is exposed as an explicit action.
              accessibilityActions={[{ name: 'more', label: 'Rename or delete' }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'more') openActions(exam);
              }}
              android_ripple={{ color: colors.secondaryPress }}
              style={({ pressed }) => [styles.examCard, pressed && styles.examCardPressed]}
            >
              <View style={styles.examInfo}>
                <View style={styles.examTitleRow}>
                  <Text style={styles.examTitle} numberOfLines={1}>
                    {exam.title}
                  </Text>
                  <StatusPill status={exam.status} styles={styles} />
                </View>
                <Text style={styles.examMeta} numberOfLines={1}>
                  {exam.subject ?? 'General'} · Code {exam.code}
                </Text>
                <Text style={styles.examMeta} numberOfLines={1}>
                  {exam.duration} · Tap for QR · Hold for more
                </Text>
              </View>

              <View style={[styles.qrBtn, !colors.isDark && styles.qrBtnLight]}>
                <MaterialCommunityIcons
                  name="qrcode"
                  size={20}
                  color={colors.isDark ? colors.onAccent : colors.iconCream}
                />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* QR Display Modal */}
      <Modal
        visible={!!selectedExam}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedExam(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedExam?.title}
              </Text>
              <Pressable
                onPress={() => setSelectedExam(null)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close QR code"
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.qrBox}>
              {selectedExam ? (
                <QRCode
                  getRef={(handle: unknown) => {
                    qrRef.current = handle as QrCodeHandle | null;
                  }}
                  value={`https://quizguard.app/join/${selectedExam.code}`}
                  size={200}
                  color="#272727"
                  backgroundColor="#FFFFFF"
                />
              ) : null}
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>EXAM CODE</Text>
              <Text style={styles.codeValue}>{selectedExam?.code}</Text>
            </View>

            <Text style={styles.modalHint}>
              Students can scan this code using their phone camera to join.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={downloadQr}
                accessibilityRole="button"
                accessibilityLabel="Download QR code"
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="download-outline"
                  size={18}
                  color={colors.text}
                />
                <Text style={styles.secondaryText}>Download</Text>
              </Pressable>

              <Pressable
                onPress={() => selectedExam && requestDelete(selectedExam)}
                accessibilityRole="button"
                accessibilityLabel="Delete exam"
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={colors.error}
                />
                <Text style={[styles.secondaryText, styles.destructiveText]}>Delete</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setSelectedExam(null)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && !reduceMotion && styles.btnPressed,
                pressed && reduceMotion && styles.btnPressedFlat,
              ]}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ExamActionsSheet
        exam={actionsExam}
        onClose={() => setActionsExam(null)}
        onRename={() => {
          setRenameTarget(actionsExam);
          setActionsExam(null);
        }}
        onDelete={() => {
          if (actionsExam) requestDelete(actionsExam);
        }}
      />

      <RenameExamDialog
        exam={renameTarget}
        onCancel={() => setRenameTarget(null)}
        onSubmit={confirmRename}
      />

      <DeleteExamDialog
        exam={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

function StatusPill({ status, styles }: { status: ExamStatus; styles: Styles }) {
  if (status === 'active') {
    return (
      <View style={[styles.pill, styles.pillLive]}>
        <View style={styles.pillDot} />
        <Text style={[styles.pillText, styles.pillTextLive]}>Live</Text>
      </View>
    );
  }
  return (
    <View style={[styles.pill, styles.pillOutline]}>
      <Text style={styles.pillText}>Scheduled</Text>
    </View>
  );
}

function Metric({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
    },
    greeting: {
      ...typography.largeTitle,
      color: colors.text,
    },
    summary: {
      ...typography.subhead,
      color: colors.textMuted,
      marginTop: 2,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPressed: {
      transform: [{ scale: 0.97 }],
    },
    avatarPressedFlat: {
      opacity: 0.85,
    },
    avatarText: {
      ...typography.headline,
      color: colors.onAccent,
    },

    /* Hero card */
    heroCard: {
      backgroundColor: colors.cardCream,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      padding: spacing.lg,
      marginBottom: spacing.xl,
      ...shadows.card,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    heroHeadline: {
      flex: 1,
      gap: 2,
    },
    heroLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.onCreamMuted,
      letterSpacing: 0.6,
    },
    heroValue: {
      fontSize: 48,
      lineHeight: 54,
      fontWeight: '700',
      color: colors.onCream,
      fontVariant: ['tabular-nums'],
    },
    heroCaption: {
      ...typography.footnote,
      color: colors.onCreamMuted,
    },
    newExamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.onCream,
    },
    newExamBtnText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.cardCream,
    },
    heroDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(39, 39, 39, 0.25)',
      marginVertical: spacing.md,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metric: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: 'rgba(39, 39, 39, 0.25)',
    },
    metricValue: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      color: colors.onCream,
      fontVariant: ['tabular-nums'],
    },
    metricLabel: {
      ...typography.caption,
      color: colors.onCreamMuted,
    },

    /* Filters */
    sectionTitle: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
      paddingHorizontal: 2,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipPressed: {
      backgroundColor: colors.secondaryPress,
    },
    chipText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.textMuted,
    },
    chipTextSelected: {
      color: colors.onAccent,
    },
    chipCount: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      fontVariant: ['tabular-nums'],
    },
    chipCountSelected: {
      color: colors.onCreamMuted,
    },

    /* Exam row */
    examCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      overflow: 'hidden',
    },
    examCardPressed: {
      backgroundColor: colors.secondaryPress,
    },
    examInfo: {
      flex: 1,
      gap: 3,
    },
    examTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    examTitle: {
      ...typography.headline,
      color: colors.text,
      flexShrink: 1,
    },
    examMeta: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    pillLive: {
      backgroundColor: colors.cardSage,
    },
    pillOutline: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pillDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.onCream,
    },
    pillText: {
      ...typography.caption,
      fontSize: 11,
      fontWeight: '500',
      color: colors.text,
    },
    pillTextLive: {
      color: colors.onCream,
      fontWeight: '600',
    },
    qrBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrBtnLight: {
      backgroundColor: colors.cardIron,
    },

    /* Empty states */
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      ...typography.headline,
      color: colors.text,
    },
    emptyBody: {
      ...typography.footnote,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
    },
    emptyBtnText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.onAccent,
    },

    /* Buttons */
    btnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    btnPressedFlat: {
      opacity: 0.85,
    },

    /* QR modal */
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(20, 20, 19, 0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.modal,
    },
    modalHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    modalTitle: {
      ...typography.headline,
      color: colors.text,
      flex: 1,
    },
    closeBtn: {
      padding: 4,
    },
    qrBox: {
      padding: spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: radius.control,
      marginVertical: spacing.md,
    },
    codeRow: {
      alignItems: 'center',
      gap: 2,
      marginBottom: spacing.sm,
    },
    codeLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
    },
    codeValue: {
      ...typography.title2,
      letterSpacing: 1.5,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    modalHint: {
      ...typography.footnote,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    modalActions: {
      width: '100%',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    secondaryBtn: {
      flex: 1,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryPressed: {
      backgroundColor: colors.secondaryPress,
    },
    secondaryText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.text,
    },
    destructiveText: {
      color: colors.error,
    },
    doneBtn: {
      width: '100%',
      minHeight: 46,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      // Cream accent is invisible on the light-mode cream sheet, so the
      // light palette uses ink instead — the same swap the rest of the app makes.
      backgroundColor: colors.isDark ? colors.accent : colors.onCream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    doneBtnText: {
      ...typography.headline,
      color: colors.isDark ? colors.onAccent : colors.cardCream,
    },
  });
