/**
 * Shapes for the student exam flow.
 *
 * These mirror the payload a real backend would return. Right now they are
 * filled from a local demo paper, so the UI can be built and reviewed before
 * the server exists. When the API arrives, only the source of these objects
 * changes — the screens keep the same props.
 */

/** What the student submits to join, and who they are. */
export type StudentJoinRequest = {
  quizCode: string;
  enrollmentNumber: string;
  fullName: string;
  email: string;
};

export type StudentOptionDto = {
  id: number;
  optionText: string;
};

export type StudentQuestionDto = {
  id: number;
  questionNumber: number;
  questionText: string;
  /** Course outcome label shown as a small badge, e.g. "CO2". */
  coLevel: string;
  options: StudentOptionDto[];
};

/** Everything the exam screens need after a successful join. */
export type StudentJoinResponse = {
  attemptId: number;
  quizId: number;
  title: string;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: StudentQuestionDto[];
};
