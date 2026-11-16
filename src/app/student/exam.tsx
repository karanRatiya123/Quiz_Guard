import { Redirect, Stack } from 'expo-router';

import { ExamRunnerView } from '@/components/student/ExamRunnerView';
import { useStudentExamStore } from '@/store/studentExamStore';

/**
 * Route wrapper for the running exam.
 *
 * Only the paper is needed here — candidate details already appeared on the
 * briefing screen, and the result snapshot carries the name into the summary.
 *
 * The swipe-back gesture is disabled while the timer runs, so a stray swipe
 * cannot unmount the screen and pause the countdown. The hardware back button
 * is blocked inside the view for the same reason.
 */
export default function StudentExamScreen() {
  const quiz = useStudentExamStore((state) => state.quiz);

  if (!quiz) {
    return <Redirect href="/student/join" />;
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ExamRunnerView quiz={quiz} />
    </>
  );
}
