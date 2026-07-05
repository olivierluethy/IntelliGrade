export type Grade = {
  id: string;
  value: number;
  weight: number;
  label?: string;
  date?: string;
  category?: string;
};

export type Subject = {
  id: string;
  name: string;
  targetGrade?: number;
  grades: Grade[];
};

export type Semester = {
  id: string;
  name: string;
  scaleId: string;
  subjects: Subject[];
};

export type AppData = {
  schemaVersion: 1;
  activeSemesterId: string | null;
  semesters: Semester[];
};
