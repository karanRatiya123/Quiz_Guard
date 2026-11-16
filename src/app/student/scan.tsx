import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '@/constants/colors';
import { radius, shadows, spacing, typography } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

/**
 * QR scanner for students.
 *
 * The camera is the screen background; everything else is a dim mask with a
 * transparent square cut out of it, plus four cream corners. When a QR is
 * detected the raw text is shown in a card — parsing "which exam is this?" is
 * left to a backend that does not exist yet.
 *
 * Permission is the interesting part: `useCameraPermissions` gives both
 * `granted` and `canAskAgain`, and the difference decides whether the button
 * can re-prompt or must send the user to system Settings.
 */
export default function ScanQrScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const colors = useTheme();
  const styles = useThemedStyles(createStyles);
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);

  /**
   * The viewfinder is a square between 260 and 280pt, chosen from the window
   * width. Capping it keeps the framing comfortable on tablets instead of
   * letting it grow unusably large.
   */
  const frameSize = Math.min(Math.max(width - spacing.lg * 2, 260), 280);
  const hasPermission = permission?.granted === true;
  /** Denied and Android will not show the dialog again → only Settings can help. */
  const needsSettings = permission?.granted === false && permission.canAskAgain === false;

  // Ask as soon as the screen appears, but only while that is still allowed;
  // once the system dialog is dismissed permanently, looping would do nothing.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  /**
   * Camera callbacks fire many times per second. The first valid QR wins and
   * becomes state; the guard plus `onBarcodeScanned={undefined}` below stop the
   * rest, so the result screen cannot be pushed twice.
   */
  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scannedData) return;
    if (process.env.EXPO_OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setScannedData(data);
  };

  /** One button, two outcomes: open system Settings, or ask in-app again. */
  const handlePermissionAction = async () => {
    if (needsSettings) {
      await Linking.openSettings();
      return;
    }
    await requestPermission();
  };

  /**
   * Geometry for the "dim everything except the square" mask.
   *
   * The overlay is three views: a full-width strip above the frame, a middle
   * row of [left strip | hole | right strip], and a strip below. Heights and
   * widths come straight from the frame size, which is why they are computed
   * rather than hard-coded:
   *
   *   height of window
   *   ├─ (height - frameSize) / 2 - 40  ← top strip; the -40 lifts the frame
   *   │                                    above true centre, leaving more
   *   │                                    dark space for the result card
   *   ├─ frameSize                       ← transparent hole (the camera shows)
   *   └─ rest (flex: 1)                  ← bottom strip
   */
  const maskHeight = Math.max((height - frameSize) / 2 - 40, 0);
  const maskSide = Math.max((width - frameSize) / 2, 0);

  return (
    <View style={styles.root}>
      {/* Live Camera (Full Screen Background) */}
      {hasPermission && isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchEnabled}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned}
        />
      ) : null}

      {/* Dimmed camera overlays for focused reticle */}
      {hasPermission && isFocused ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {/* Top overlay */}
          <View style={[styles.dimMask, { height: maskHeight }]} />

          {/* Middle row */}
          <View style={{ height: frameSize, flexDirection: 'row' }}>
            <View style={[styles.dimMask, { width: maskSide }]} />
            <View style={{ width: frameSize, height: frameSize }} />
            <View style={[styles.dimMask, { flex: 1 }]} />
          </View>

          {/* Bottom overlay */}
          <View style={[styles.dimMask, { flex: 1 }]} />
        </View>
      ) : null}

      {/* Foreground UI Layer */}
      <View
        style={[
          styles.uiContainer,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>

          <Text style={styles.navTitle}>Scan QR Code</Text>

          <Pressable
            onPress={() => setTorchEnabled((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Toggle Flashlight"
            hitSlop={12}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name={torchEnabled ? 'flashlight' : 'flashlight-off'}
              size={22}
              color={torchEnabled ? colors.accent : colors.text}
            />
          </Pressable>
        </View>

        {/* Viewfinder Area */}
        <View style={styles.centerArea}>
          <View style={[styles.viewfinder, { width: frameSize, height: frameSize }]}>
            {!hasPermission && (
              <View style={styles.noCameraView}>
                <MaterialCommunityIcons name="camera-off-outline" size={40} color={colors.textFaint} />
                <Text style={styles.noCameraText}>Camera access is required</Text>
              </View>
            )}

            {/* Clean Reticle Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.instructionText}>
            {scannedData ? 'Code detected' : 'Point camera at the teacher\u2019s QR code'}
          </Text>
        </View>

        {/* Action / Result Sheet */}
        <View style={styles.bottomArea}>
          {!hasPermission ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Camera Permission</Text>
              <Text style={styles.cardBody}>
                Allow camera access so you can scan classroom exam codes.
              </Text>
              <Pressable
                onPress={handlePermissionAction}
                accessibilityRole="button"
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>
                  {needsSettings ? 'Open Settings' : 'Allow Access'}
                </Text>
              </Pressable>
            </View>
          ) : scannedData ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Exam Found</Text>
              <Text style={styles.cardData} numberOfLines={1}>
                {scannedData}
              </Text>
              <Pressable
                onPress={() => {
                  router.replace({
                    pathname: '/student/join',
                    params: { code: scannedData },
                  });
                }}
                accessibilityRole="button"
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Join Exam</Text>
              </Pressable>
              <Pressable
                onPress={() => setScannedData(null)}
                accessibilityRole="button"
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Scan Again</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    dimMask: {
      backgroundColor: 'rgba(0, 0, 0, 0.58)',
    },
    uiContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      ...typography.headline,
      color: colors.text,
    },
    centerArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
    },
    viewfinder: {
      borderRadius: radius.panel,
      position: 'relative',
    },
    noCameraView: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    noCameraText: {
      ...typography.footnote,
      color: colors.textMuted,
      textAlign: 'center',
    },
    corner: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderColor: colors.accent,
    },
    topLeft: {
      top: 16,
      left: 16,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 6,
    },
    topRight: {
      top: 16,
      right: 16,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 6,
    },
    bottomLeft: {
      bottom: 16,
      left: 16,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 6,
    },
    bottomRight: {
      bottom: 16,
      right: 16,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 6,
    },
    instructionText: {
      ...typography.subhead,
      color: colors.textMuted,
      textAlign: 'center',
    },
    bottomArea: {
      marginTop: 'auto',
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: spacing.xs + 2,
      ...shadows.card,
    },
    cardTitle: {
      ...typography.headline,
      color: colors.text,
    },
    cardBody: {
      ...typography.footnote,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    cardData: {
      ...typography.subhead,
      color: colors.text,
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: spacing.xs,
    },
    primaryBtn: {
      width: '100%',
      minHeight: 48,
      borderRadius: radius.control,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    primaryBtnText: {
      ...typography.headline,
      color: colors.onAccent,
    },
    secondaryBtn: {
      width: '100%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      ...typography.subhead,
      color: colors.accent,
    },
  });
