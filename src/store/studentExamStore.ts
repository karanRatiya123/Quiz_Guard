import { create } from 'zustand';

import { DEMO_QUIZ, DEMO_STUDENT } from '@/services/studentDemoExam';
import type {
  StudentJoinRequest,
  StudentJoinResponse,
} from '@/types/quiz';

/** What the result screen needs after the paper is submitted. */
export type ExamResult = {
  answeredCount: number;
  totalCount: number;
  subjectName: string;
  studentName: string;
  enrollmentNumber: string;
  /** True when the countdown hit zero instead of the student tapping submit. */
  autoSubmitted: boolean;
  submittedAt: number;
};

type StudentExamState = {
  /** The paper being attempted. `null` means there is no active attempt. */
  quiz: StudentJoinResponse | null;
  /** Candidate details from the join screen (demo values for now). */
  student: StudentJoinRequest | null;
  /** questionId → selected optionId. Kept across screens, not persisted. */
  answers: Record<number, number>;
  /** Filled on submit; `null` while the exam is still running. */
  result: ExamResult | null;

  /** Opens the sample paper. `code` is echoed back so the UI can show it. */
  startDemo: (code?: string) => void;
  selectAnswer: (questionId: number, optionId: number) => void;
  /** Snapshots the answers into `result`; safe to call more than once. */
  finish: (autoSubmitted: boolean) => void;
  /** Clears everything when the student leaves the flow. */
  reset: () => void;
};

/**
 * Local state for one student attempt.
 *
 * This replaces the friend's `App.tsx` screen switcher: instead of one
 * component holding four screens in `useState`, each step is a route and the
 * shared attempt lives here. That is why navigation can move backwards and
 * forwards without losing answers, and why the result screen still has data
 * after the exam screen unmounts.
 *
 * Like the other stores, this is memory only — reloading starts over.
 */
export const useStudentExamStore = create<StudentExamState>((set) => ({
  quiz: null,
  student: null,
  answers: {},
  result: null,

  startDemo: (code) =>
    set({
      quiz: DEMO_QUIZ,
      student: {
        ...DEMO_STUDENT,
        quizCode: code?.trim().toUpperCase() || DEMO_STUDENT.quizCode,
      },
      answers: {},
      result: null,
    }),

  selectAnswer: (questionId, optionId) =>
    set((state) => ({
      // A new object, not a mutation: Zustand and React compare references.
      answers: { ...state.answers, [questionId]: optionId },
    })),

  finish: (autoSubmitted) =>
    set((state) => {
      if (!state.quiz || !state.student) return state;

      return {
        result: {
          answeredCount: Object.keys(state.answers).length,
          totalCount: state.quiz.questions.length,
          subjectName: state.quiz.subjectName,
          studentName: state.student.fullName,
          enrollmentNumber: state.student.enrollmentNumber,
          autoSubmitted,
          submittedAt: Date.now(),
        },
      };
    }),

  reset: () =>
    set({
      quiz: null,
      student: null,
      answers: {},
      result: null,
    }),
}));
