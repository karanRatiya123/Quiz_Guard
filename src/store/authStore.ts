import { create } from 'zustand';

import type { UserRole } from '@/types/user';

/**
 * Which role the user picked on the landing screen.
 *
 * That is all "authentication" is right now: there is no account, password or
 * token in shared state. Login only decides which screens are reachable; the
 * role resets to `null` when the app restarts.
 */
type AuthState = {
  /** Role picked on the landing screen. `null` until the user chooses. */
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  reset: () => set({ role: null }),
}));
