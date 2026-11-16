import { create } from 'zustand';

/**
 * The exam list shared by every teacher screen.
 *
 * Zustand keeps this object in a module-level variable, so Home, Upload and
 * Profile all read the same array without passing props. There is no server:
 * the data starts from `SEED_EXAMS` and lives only in memory — restarting the
 * app restores the samples.
 */
export type ExamStatus = 'active' | 'scheduled';

export type Exam = {
  id: string;
  title: string;
  subject?: string;
  code: string;
  status: ExamStatus;
  duration: string;
};

/** Synthetic sample data — no real classes exist. */
const SEED_EXAMS: Exam[] = [
  {
    id: '1',
    title: 'Midterm Examination',
    code: 'EXAM-804',
    status: 'active',
    duration: '45 mins',
  },
  {
    id: '2',
    title: 'Calculus Quiz 3',
    subject: 'Mathematics',
    code: 'MATH-201',
    status: 'scheduled',
    duration: '30 mins',
  },
  {
    id: '3',
    title: 'Physics Weekly Test',
    subject: 'Physics',
    code: 'PHY-118',
    status: 'scheduled',
    duration: '25 mins',
  },
  {
    id: '4',
    title: 'Science Practical',
    subject: 'Science',
    code: 'SCI-410',
    status: 'active',
    duration: '40 mins',
  },
  {
    id: '5',
    title: 'History Chapter Quiz',
    subject: 'History',
    code: 'HIS-209',
    status: 'scheduled',
    duration: '20 mins',
  },
];

/**
 * Builds a join code such as `MAT-482`.
 *
 * The subject gives the prefix when there is one; otherwise `EXM`. The number
 * is 100–999. Good enough as a demo: a real backend should generate the code
 * and guarantee it is unique, which random numbers cannot.
 */
const makeCode = (subject?: string) => {
  const prefix = subject?.trim().slice(0, 3).toUpperCase() || 'EXM';
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
};

type ExamState = {
  exams: Exam[];
  addExam: (input: { title: string; subject?: string; durationMinutes: number }) => void;
  renameExam: (id: string, title: string) => void;
  deleteExam: (id: string) => void;
};

export const useExamStore = create<ExamState>((set) => ({
  exams: SEED_EXAMS,
  /** Adds a new paper at the top of the list and lets the caller keep working. */
  addExam: ({ title, subject, durationMinutes }) =>
    set((state) => ({
      exams: [
        {
          // `Date.now()` is unique enough for one device; a server would issue
          // the real id.
          id: Date.now().toString(),
          title: title.trim(),
          subject: subject?.trim() || undefined,
          code: makeCode(subject),
          status: 'scheduled',
          duration: `${durationMinutes} mins`,
        },
        // A new array, not `push` — React only re-renders when the reference
        // changes, so mutating `state.exams` would update the data silently.
        ...state.exams,
      ],
    })),
  /** Ignores a blank name, so a dialog cannot erase the title by mistake. */
  renameExam: (id, title) => {
    const next = title.trim();
    if (!next) return;
    set((state) => ({
      exams: state.exams.map((exam) => (exam.id === id ? { ...exam, title: next } : exam)),
    }));
  },
  deleteExam: (id) =>
    set((state) => ({
      exams: state.exams.filter((exam) => exam.id !== id),
    })),
}));
