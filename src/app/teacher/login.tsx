import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';

/**
 * Route for `/teacher/login`.
 *
 * The screen itself is a component in `src/components/auth/` because the route
 * is only a thin wrapper: Expo Router requires a default export in `src/app/`,
 * while reusable UI stays outside the routes folder.
 */
export default function TeacherLoginScreen() {
  return <TeacherLoginForm />;
}
