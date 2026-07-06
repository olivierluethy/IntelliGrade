export type Grade = {
  id: string;
  value: number;
  weight: number;
  label?: string;
  date?: string;
  category?: string;
};

export type Exam = {
  id: string;
  name: string;
  date: string; // ISO calendar date, 'YYYY-MM-DD'
  weight: number;
};

export type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
  exams: Exam[];
};

export type Semester = {
  id: string;
  name: string;
  scaleId: string;
  subjects: Subject[];
};

export type AppData = {
  schemaVersion: 2;
  activeSemesterId: string | null;
  semesters: Semester[];
};
