import { create } from 'zustand';

import type { FacultyMember } from '@/types/user';

/**
 * Teacher directory — who an admin has added, newest last.
 *
 * The first entry is the signed-in admin (the Alex Rivera card on Profile).
 * Everyone added from `/teacher/add-faculty` is a `faculty` member.
 *
 * Memory-only on purpose: no server means no place to hash a password, so the
 * store keeps the address book and never the credentials. Reloading the app
 * resets this list, exactly like the other stores.
 */
type AddResult =
  | { ok: true; member: FacultyMember }
  | { ok: false; reason: 'duplicate' };

type FacultyState = {
  members: FacultyMember[];
  addFaculty: (input: { name: string; email: string }) => AddResult;
};

const SEED_MEMBERS: FacultyMember[] = [
  {
    id: 'faculty-admin',
    name: 'Alex Rivera',
    email: 'alex.rivera@quizguard.app',
    role: 'admin',
    addedAt: 0,
  },
];

export const useFacultyStore = create<FacultyState>((set, get) => ({
  members: SEED_MEMBERS,

  addFaculty: ({ name, email }) => {
    // Emails are compared case-insensitively, the way a real account lookup
    // would, so "Alex@" and "alex@" cannot both exist.
    const normalised = email.trim().toLowerCase();
    const duplicate = get().members.some(
      (member) => member.email.toLowerCase() === normalised,
    );
    if (duplicate) return { ok: false, reason: 'duplicate' };

    const member: FacultyMember = {
      id: `faculty-${Date.now()}`,
      name: name.trim(),
      email: normalised,
      role: 'faculty',
      addedAt: Date.now(),
    };

    set({ members: [...get().members, member] });
    return { ok: true, member };
  },
}));
