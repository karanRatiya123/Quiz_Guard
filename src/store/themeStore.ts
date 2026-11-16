import { create } from 'zustand';

/**
 * Appearance setting: `dark` or `light`.
 *
 * It is deliberately app-owned rather than read from the OS scheme, so the
 * Profile switch is the single source of truth and users can override their
 * system theme. `useTheme()` turns this value into actual colours.
 */
export type ThemeMode = 'dark' | 'light';

type ThemeState = {
  /** The in-app appearance choice. Dark is the app's default. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  setMode: (mode) => set({ mode }),
}));
