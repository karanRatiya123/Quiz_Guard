export type UserRole = 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** Who can do what inside the teacher area. Only the first account is an admin. */
export type FacultyRole = 'admin' | 'faculty';

/**
 * One entry in the teacher directory.
 *
 * The password is deliberately absent: the demo form validates it, then throws
 * it away, because there is no server to store a hash on.
 */
export type FacultyMember = {
  id: string;
  name: string;
  email: string;
  role: FacultyRole;
  /** `Date.now()` when the account was created; used to show newest first. */
  addedAt: number;
};
