import { Redirect, Stack } from 'expo-router';

import { ResultView } from '@/components/student/ResultView';
import { useStudentExamStore } from '@/store/studentExamStore';

/**
 * Route wrapper for the submission screen.
 *
 * `result` is written by the exam screen at submit time, so its absence means
 * the student arrived here without finishing (a deep link or a reload). Send
 * them back rather than showing a summary built from nothing.
 *
 * Back is blocked here and in the view: the attempt is finished, so the only
 * forward move is "Exit to Home", which also clears the store.
 */
export default function StudentResultScreen() {
  const result = useStudentExamStore((state) => state.result);

  if (!result) {
    return <Redirect href="/student/join" />;
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ResultView result={result} />
    </>
  );
}
