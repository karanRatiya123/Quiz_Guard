import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessSheet } from '@/components/feedback/SuccessSheet';
import { useFloatingTabBarSpace } from '@/components/navigation/FloatingTabBar';
import type { ThemeColors } from '@/constants/colors';
import { radius, spacing, typography } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import {
  addUploadNotificationTapListener,
  dismissUploadNotifications,
  notifyUploadComplete,
  prepareUploadNotifications,
} from '@/services/uploadNotifications';
import { uploadPaper, UploadCancelledError, type UploadTask } from '@/services/uploadPaper';
import { useExamStore } from '@/store/examStore';

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_MB = MAX_BYTES / (1024 * 1024);
/** The store needs a time limit; Upload no longer asks, so new papers start here. */
const DEFAULT_MINUTES = 30;

/** What the system file manager is allowed to hand back. */
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PickedFile = {
  name: string;
  uri: string;
  size?: number;
  mimeType?: string;
};

const isSupported = (file: PickedFile) => {
  const name = file.name.toLowerCase();
  return (
    file.mimeType === 'application/pdf' ||
    file.mimeType === 'application/vnd.ms-excel' ||
    file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    /\.(pdf|xls|xlsx)$/.test(name)
  );
};

/** Pick the right glyph + label from the file's MIME type, falling back to its extension. */
const describeFile = (file: PickedFile): { icon: IconName; label: string } => {
  const mime = file.mimeType ?? '';
  const name = file.name.toLowerCase();
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return { icon: 'file-pdf-box', label: 'PDF' };
  }
  if (name.endsWith('.xls') || name.endsWith('.xlsx') || mime.includes('spreadsheet') || mime.includes('excel')) {
    return { icon: 'file-excel-outline', label: 'Excel' };
  }
  return { icon: 'file-outline', label: 'File' };
};

const formatSize = (bytes?: number) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** "midterm_paper-v2.pdf" → "Midterm paper v2" */
const titleFromFile = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())
    .slice(0, 60);

/**
 * Upload tab — attach the exam paper, then confirm.
 *
 * Two states only: an idle drop target that opens the device's file manager,
 * and a preview of the picked file with a single Upload action. Confirmation
 * is the animated success sheet.
 *
 * The full journey lives in this one file:
 *
 *   pickFile()  → validate type/size → preview
 *   upload()    → permission → uploadPaper(onProgress) → addExam() → sheet
 *   cancelUpload() → abort the task; cancelling is not an error
 *
 * Nothing is sent anywhere: `uploadPaper` fakes progress. Swapping it for a
 * real request is the only change the screen would need (see
 * `src/services/uploadPaper.ts`).
 */
export default function UploadExamScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const barSpace = useFloatingTabBarSpace();
  const addExam = useExamStore((state) => state.addExam);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedTitle, setUploadedTitle] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /** Guard against a late progress tick landing after the screen unmounts. */
  const mounted = useRef(true);
  const task = useRef<UploadTask | null>(null);
  useEffect(
    () => () => {
      mounted.current = false;
      task.current?.cancel();
    },
    [],
  );

  /** Tapping the "upload complete" notification closes the sheet and returns home. */
  useEffect(
    () =>
      addUploadNotificationTapListener(() => {
        setUploadedTitle(null);
        setFile(null);
        setError(null);
        setProgress(0);
        router.navigate('/teacher');
      }),
    [],
  );

  const haptic = (kind: 'select' | 'success' | 'error') => {
    if (process.env.EXPO_OS === 'web') return;
    if (kind === 'select') void Haptics.selectionAsync();
    else if (kind === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  /**
   * Opens the OS file manager and keeps only what the screen needs.
   *
   * Validation happens here, not on the server: a wrong type or a file over
   * 20 MB is rejected immediately with a human-readable reason, so the user
   * never watches a progress bar for a file that could not work.
   *
   * `copyToCacheDirectory: true` gives us a stable local `uri`; the original
   * may live in a provider the app cannot read later.
   */
  const pickFile = async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ACCEPTED_TYPES,
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      const picked: PickedFile = {
        name: asset.name,
        uri: asset.uri,
        size: asset.size,
        mimeType: asset.mimeType,
      };

      if (!isSupported(picked)) {
        haptic('error');
        setError('Only PDF and Excel files can be uploaded.');
        return;
      }

      if (asset.size && asset.size > MAX_BYTES) {
        haptic('error');
        setError(`That file is ${formatSize(asset.size)}. The limit is ${MAX_MB} MB.`);
        return;
      }

      haptic('select');
      setFile(picked);
    } catch {
      haptic('error');
      setError('Could not open your files. Please try again.');
    }
  };

  const removeFile = () => {
    haptic('select');
    setFile(null);
    setError(null);
  };

  /**
   * Runs the upload and turns its result into an exam.
   *
   * Order matters:
   *   1. flip `uploading` first, so a double tap cannot start twice;
   *   2. ask for notification permission while the user is still looking at
   *      the button — the OS dialog is expected there;
   *   3. hand the file to `uploadPaper`, which reports 0 → 1 progress;
   *   4. on success, add the exam to the store (Home updates itself) and pop
   *      the success sheet.
   *
   * A cancel rejects with `UploadCancelledError`, which is swallowed on
   * purpose: the user asked for it, so it is not an error to show.
   */
  const upload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    haptic('select');

    // Ask for notification permission before progress starts, so the banner is
    // already allowed when the upload finishes. `uploading` is set first, so a
    // second tap while the system dialog is open cannot start a second upload.
    await prepareUploadNotifications();
    if (!mounted.current) return;

    const title = titleFromFile(file.name) || 'Untitled exam';
    const current = uploadPaper(file, (fraction) => {
      if (mounted.current) setProgress(fraction);
    });
    task.current = current;

    try {
      await current.promise;
      if (!mounted.current) return;

      addExam({ title, durationMinutes: DEFAULT_MINUTES });
      void notifyUploadComplete(title);
      haptic('success');
      setUploadedTitle(title);
    } catch (uploadError) {
      if (!mounted.current) return;
      // Cancelling is a deliberate action — stay silent and return to idle.
      if (uploadError instanceof UploadCancelledError) return;

      haptic('error');
      setError('Upload failed. Check your connection and try again.');
    } finally {
      task.current = null;
      if (mounted.current) {
        setUploading(false);
        setProgress(0);
      }
    }
  };

  /** The task owns the timer; cancelling stops progress and clears the UI. */
  const cancelUpload = () => {
    if (!task.current) return;
    haptic('select');
    task.current.cancel();
  };

  const finish = () => {
    setUploadedTitle(null);
    setFile(null);
    setError(null);
    setUploading(false);
    setProgress(0);
    dismissUploadNotifications();
    router.navigate('/teacher');
  };

  const kind = file ? describeFile(file) : null;
  const fileMeta = file && kind ? [kind.label, formatSize(file.size)].filter(Boolean).join(' · ') : '';

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
          <Text style={styles.eyebrow}>UPLOAD</Text>
          <Text style={styles.title} accessibilityRole="header">
            Exam paper
          </Text>
          <Text style={styles.subtitle}>
            Attach the paper, then share the QR code with your class.
          </Text>
        </View>

        {file && kind ? (
          <>
            <Text style={styles.label}>YOUR FILE</Text>

            <View style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <MaterialCommunityIcons name={kind.icon} size={26} color={colors.text} />
              </View>
              <View style={styles.fileText}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {file.name}
                </Text>
                <Text style={styles.fileMeta}>{fileMeta}</Text>
              </View>
              <Pressable
                onPress={removeFile}
                disabled={uploading}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove file"
                accessibilityState={{ disabled: uploading }}
                style={({ pressed }) => [
                  styles.fileRemove,
                  pressed && styles.fileRemovePressed,
                  uploading && styles.dimmed,
                ]}
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Pressable
              onPress={pickFile}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Choose a different file"
              accessibilityState={{ disabled: uploading }}
              android_ripple={{ color: colors.secondaryPress }}
              style={[styles.replaceBtn, uploading && styles.dimmed]}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.textMuted} />
              <Text style={styles.replaceText}>Choose a different file</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={15}
                  color={colors.textMuted}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={upload}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel={uploading ? 'Uploading, please wait' : `Upload ${file.name}`}
              accessibilityState={{ disabled: uploading, busy: uploading }}
              style={({ pressed }) => [
                styles.primaryBtn,
                uploading && styles.primaryBtnBusy,
                pressed && !uploading && !reduceMotion && styles.btnPressed,
                pressed && !uploading && reduceMotion && styles.btnPressedFlat,
              ]}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.primaryBtnBusyText}>Uploading…</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="tray-arrow-up"
                    size={18}
                    color={colors.onAccent}
                  />
                  <Text style={styles.primaryBtnText}>Upload</Text>
                </>
              )}
            </Pressable>

            {uploading ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%` as DimensionValue },
                    ]}
                  />
                </View>
                <View style={styles.progressMeta}>
                  <Text style={styles.progressLabel}>Sending to the server…</Text>
                  <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
                </View>

                <Pressable
                  onPress={cancelUpload}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel upload"
                  android_ripple={{ color: colors.secondaryPress }}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && styles.cancelBtnPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={16}
                    color={colors.textMuted}
                  />
                  <Text style={styles.cancelText}>Cancel upload</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.hintRow}>
                <MaterialCommunityIcons name="qrcode" size={15} color={colors.textFaint} />
                <Text style={styles.hintText}>
                  Students join with a QR code as soon as the paper is uploaded.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>EXAM PAPER</Text>

            <Pressable
              onPress={pickFile}
              accessibilityRole="button"
              accessibilityLabel="Choose a file from your device"
              android_ripple={{ color: colors.secondaryPress }}
              style={({ pressed }) => [styles.dropzone, pressed && styles.dropzonePressed]}
            >
              <View style={[styles.dropIcon, !colors.isDark && styles.dropIconLight]}>
                <MaterialCommunityIcons
                  name="tray-arrow-up"
                  size={28}
                  color={colors.isDark ? colors.text : colors.iconCream}
                />
              </View>
              <Text style={styles.dropTitle}>Choose a file</Text>
              <Text style={styles.dropHint}>Opens your file manager</Text>

              <View style={styles.formats}>
                {['PDF', 'EXCEL'].map((format) => (
                  <View key={format} style={styles.formatChip}>
                    <Text style={styles.formatText}>{format}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.dropLimit}>Up to {MAX_MB} MB</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={15}
                  color={colors.textMuted}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.dropFootnote}>Preview it, then tap Upload to share.</Text>
          </>
        )}
      </ScrollView>

      <SuccessSheet
        visible={uploadedTitle !== null}
        title="Uploaded successfully!"
        message={
          uploadedTitle
            ? `“${uploadedTitle}” is ready to share with your class.`
            : 'Your exam paper is ready to share.'
        }
        actionLabel="Go to Home"
        onAction={finish}
        onRequestClose={finish}
      />
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
    subtitle: {
      ...typography.subhead,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 22,
    },

    /* Drop target */
    dropzone: {
      backgroundColor: colors.surface,
      borderRadius: radius.panel,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: 4,
    },
    dropzonePressed: {
      backgroundColor: colors.secondaryPress,
    },
    dropIcon: {
      width: 64,
      height: 64,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    dropIconLight: {
      backgroundColor: colors.onCream,
    },
    dropTitle: {
      ...typography.headline,
      color: colors.text,
    },
    dropHint: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    formats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.md,
    },
    formatChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formatText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
    dropLimit: {
      ...typography.caption,
      color: colors.textFaint,
      marginTop: spacing.sm,
    },
    dropFootnote: {
      ...typography.footnote,
      color: colors.textFaint,
      textAlign: 'center',
      marginTop: spacing.md,
    },

    /* Selected file */
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderCurve: 'continuous',
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    fileIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileText: {
      flex: 1,
      gap: 3,
    },
    fileName: {
      ...typography.headline,
      color: colors.text,
    },
    fileMeta: {
      ...typography.footnote,
      color: colors.textMuted,
    },
    fileRemove: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileRemovePressed: {
      backgroundColor: colors.secondaryPress,
    },
    replaceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      marginLeft: -spacing.sm,
      borderRadius: radius.control,
    },
    replaceText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.textMuted,
    },

    /* Labels + errors */
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textFaint,
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    errorText: {
      ...typography.footnote,
      color: colors.textMuted,
      flex: 1,
    },

    /* Actions */
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 52,
      marginTop: spacing.lg,
      borderRadius: radius.control,
      borderCurve: 'continuous',
      backgroundColor: colors.accent,
    },
    primaryBtnBusy: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryBtnText: {
      ...typography.headline,
      color: colors.onAccent,
    },
    primaryBtnBusyText: {
      ...typography.headline,
      color: colors.text,
    },

    /* Upload progress */
    progressWrap: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    progressTrack: {
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceMuted,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.pill,
      backgroundColor: colors.isDark ? colors.accent : colors.onCream,
    },
    progressMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    progressValue: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    cancelBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      gap: 6,
      minHeight: 44,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radius.control,
    },
    cancelBtnPressed: {
      backgroundColor: colors.secondaryPress,
    },
    cancelText: {
      ...typography.subhead,
      fontWeight: '600',
      color: colors.textMuted,
    },
    dimmed: {
      opacity: 0.45,
    },
    btnPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    btnPressedFlat: {
      opacity: 0.85,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
    },
    hintText: {
      ...typography.footnote,
      color: colors.textFaint,
      flex: 1,
      lineHeight: 18,
    },
  });
