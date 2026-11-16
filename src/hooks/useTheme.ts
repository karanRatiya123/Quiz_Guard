import { useMemo } from 'react';

import { darkColors, lightColors, type ThemeColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

/**
 * The active palette. Follows the in-app appearance setting on the profile
 * tab — dark is the app's default; the OS scheme is no longer consulted.
 */
export function useTheme(): ThemeColors {
  const mode = useThemeStore((state) => state.mode);
  return mode === 'light' ? lightColors : darkColors;
}

/**
 * Builds a `StyleSheet` from the active palette.
 *
 * `factory` must be module-scope so the memo is stable; the sheet is rebuilt
 * only when the mode actually flips.
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
