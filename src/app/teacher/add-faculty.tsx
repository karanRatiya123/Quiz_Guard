import { AddFacultyForm } from '@/components/auth/AddFacultyForm';

/**
 * Route for `/teacher/add-faculty`.
 *
 * Opened from the Faculty section on the Profile tab. Like `teacher/login`,
 * this is a thin wrapper so the screen itself can live in `src/components/`.
 */
export default function AddFacultyScreen() {
  return <AddFacultyForm />;
}
