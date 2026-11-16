export type UserRole = 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
