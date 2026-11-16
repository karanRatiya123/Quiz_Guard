/**
 * The app shell — the only layout above every route.
 *
 * Expo Router renders every screen in `src/app/` inside this file's `<Stack>`.
 * Nothing here is a screen itself; it exists to do four jobs once:
 *
 *   1. keep the native splash visible until the icon font is ready, so the
 *      first frame never shows empty squares where icons should be;
 *   2. provide safe-area insets (notch, gesture bar) to every screen;
 *   3. pick the status-bar colour from the active palette;
 *   4. catch render errors in release builds and show the message instead of
 *      leaving the user on a blank screen.
 *
 * Order matters: fonts are checked before the provider tree renders, because
 * `useFonts` is a hook and hooks must run unconditionally.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

// Called at module scope, before React mounts. The splash cannot be hidden
// earlier than this, and hiding it too early would flash an empty layout.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colors = useTheme();
  // MaterialCommunityIcons is a font, not vector paths. Loading it here (once)
  // is what makes <MaterialCommunityIcons name="..." /> render on every screen.
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // `|| fontError` matters: a missing font must still let the app open,
      // otherwise a font problem would look like a frozen splash screen.
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Returning null paints nothing, which leaves the native splash in place.
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false, // every screen draws its own header
          contentStyle: { backgroundColor: colors.bg }, // avoids white flashes between screens
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );
}

/**
 * Last line of defence for release builds. Without it a render error in the
 * standalone APK leaves the user on a blank screen; here the message and a
 * retry are on screen instead.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorRoot}>
      <Text style={styles.errorBrand}>SECURE EXAM</Text>
      <Text style={styles.errorTitle}>Something went wrong.</Text>
      <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </ScrollView>
      <Pressable onPress={retry} style={styles.errorButton} accessibilityRole="button">
        <Text style={styles.errorButtonLabel}>TRY AGAIN</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    backgroundColor: '#141413',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  errorBrand: {
    color: '#8B8A87',
    fontSize: 12,
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#E3E2C3',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorScroll: { maxHeight: 220 },
  errorScrollContent: { paddingBottom: 8 },
  errorMessage: {
    color: '#C1C1A9',
    fontSize: 14,
    lineHeight: 21,
  },
  errorButton: {
    marginTop: 24,
    alignSelf: 'flex-start',
    backgroundColor: '#E3E2C3',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  errorButtonLabel: {
    color: '#141413',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
