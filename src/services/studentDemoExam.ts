import type { StudentJoinRequest, StudentJoinResponse } from '@/types/quiz';

/**
 * The sample paper behind the "Preview exam UI" door.
 *
 * The join screen can only fake a join until a backend exists, so this fixed
 * paper gives the instruction/exam/result screens real content to render.
 * Five single-mark MCQs keeps the demo short enough to try end to end.
 */
export const DEMO_QUIZ: StudentJoinResponse = {
  attemptId: 101,
  quizId: 1,
  title: 'Database Systems Mid-Term',
  subjectName: 'Computer Science (CS304)',
  durationMinutes: 30,
  totalQuestions: 5,
  questions: [
    {
      id: 1,
      questionNumber: 1,
      questionText:
        'Which normal form strictly eliminates transitive functional dependencies for non-prime attributes?',
      coLevel: 'CO2',
      options: [
        { id: 101, optionText: 'First Normal Form (1NF)' },
        { id: 102, optionText: 'Second Normal Form (2NF)' },
        { id: 103, optionText: 'Third Normal Form (3NF)' },
        { id: 104, optionText: 'Boyce-Codd Normal Form (BCNF)' },
      ],
    },
    {
      id: 2,
      questionNumber: 2,
      questionText:
        'What is the primary key property that prevents duplicate tuples within a relation?',
      coLevel: 'CO1',
      options: [
        { id: 201, optionText: 'Referential Integrity' },
        { id: 202, optionText: 'Entity Integrity' },
        { id: 203, optionText: 'Domain Constraint' },
        { id: 204, optionText: 'Atomicity' },
      ],
    },
    {
      id: 3,
      questionNumber: 3,
      questionText:
        'Which relational algebra operation selects rows that satisfy a specified predicate condition?',
      coLevel: 'CO2',
      options: [
        { id: 301, optionText: 'Projection (π)' },
        { id: 302, optionText: 'Selection (σ)' },
        { id: 303, optionText: 'Cartesian Product (×)' },
        { id: 304, optionText: 'Join (⨝)' },
      ],
    },
    {
      id: 4,
      questionNumber: 4,
      questionText: 'In ACID properties of transactions, what does the "I" represent?',
      coLevel: 'CO3',
      options: [
        { id: 401, optionText: 'Integrity' },
        { id: 402, optionText: 'Isolation' },
        { id: 403, optionText: 'Indexing' },
        { id: 404, optionText: 'Idempotency' },
      ],
    },
    {
      id: 5,
      questionNumber: 5,
      questionText:
        'Which index structure maintains data sorted and allows fast searches, sequential access, and range queries?',
      coLevel: 'CO4',
      options: [
        { id: 501, optionText: 'B+ Tree' },
        { id: 502, optionText: 'Hash Index' },
        { id: 503, optionText: 'Bitmap Index' },
        { id: 504, optionText: 'Linear List' },
      ],
    },
  ],
};

/**
 * Demo candidate details. The current join screen only asks for a code, so
 * these stand in for the name/enrollment a real join would provide.
 */
export const DEMO_STUDENT: StudentJoinRequest = {
  quizCode: 'DEMO-EXAM',
  enrollmentNumber: '21BEIT30012',
  fullName: 'Alex Rivera',
  email: 'alex.rivera@college.edu',
};
