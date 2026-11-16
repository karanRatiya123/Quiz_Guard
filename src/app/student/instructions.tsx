import { Redirect } from 'expo-router';

import { InstructionsView } from '@/components/student/InstructionsView';
import { useStudentExamStore } from '@/store/studentExamStore';

/**
 * Route wrapper for the briefing screen.
 *
 * The view is a plain component so it can be tested or reused; this file only
 * supplies the attempt from the store. Opening the URL directly (or after the
 * state was cleared) has no paper to show, so it sends the student back to
 * join instead of rendering empty cards.
 */
export default function StudentInstructionsScreen() {
  const quiz = useStudentExamStore((state) => state.quiz);
  const student = useStudentExamStore((state) => state.student);

  if (!quiz || !student) {
    return <Redirect href="/student/join" />;
  }

  return <InstructionsView quiz={quiz} student={student} />;
}
