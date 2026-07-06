import { create } from "zustand";
import type { AppData, Grade, Semester, Subject, Exam } from "../domain/types";
import { loadAppData, saveAppData } from "./persistence";
import { swissScale } from "../domain/grade-scale";
import { newId } from "./id";

type State = {
  data: AppData;
  addSemester: (name: string, scaleId?: string) => string;
  setActiveSemester: (id: string) => void;
  addSubject: (semesterId: string, name: string) => string;
  deleteSubject: (semesterId: string, subjectId: string) => void;
  addGrade: (
    semesterId: string,
    subjectId: string,
    grade: Omit<Grade, "id">
  ) => string;
  updateGrade: (
    semesterId: string,
    subjectId: string,
    gradeId: string,
    patch: Partial<Omit<Grade, "id">>
  ) => void;
  deleteGrade: (
    semesterId: string,
    subjectId: string,
    gradeId: string
  ) => void;
  setSubjectTarget: (
    semesterId: string,
    subjectId: string,
    target: number | undefined
  ) => void;
  addExam: (semesterId: string, subjectId: string, exam: Omit<Exam, "id">) => string;
  deleteExam: (semesterId: string, subjectId: string, examId: string) => void;
  recordExamGrade: (
    semesterId: string,
    subjectId: string,
    examId: string,
    value: number
  ) => void;
};

// Map helpers keep updates immutable and readable.
const mapSemester = (
  data: AppData,
  semesterId: string,
  fn: (s: Semester) => Semester
): AppData => ({
  ...data,
  semesters: data.semesters.map((s) => (s.id === semesterId ? fn(s) : s)),
});

const mapSubject = (
  data: AppData,
  semesterId: string,
  subjectId: string,
  fn: (sub: Subject) => Subject
): AppData =>
  mapSemester(data, semesterId, (s) => ({
    ...s,
    subjects: s.subjects.map((sub) => (sub.id === subjectId ? fn(sub) : sub)),
  }));

export const useStore = create<State>((set, get) => {
  const commit = (data: AppData) => {
    saveAppData(data);
    set({ data });
  };

  return {
    data: loadAppData(),

    addSemester: (name, scaleId = swissScale.id) => {
      const id = newId();
      const data = get().data;
      const semester: Semester = { id, name, scaleId, subjects: [] };
      commit({
        ...data,
        semesters: [...data.semesters, semester],
        activeSemesterId: data.activeSemesterId ?? id,
      });
      return id;
    },

    setActiveSemester: (id) => commit({ ...get().data, activeSemesterId: id }),

    addSubject: (semesterId, name) => {
      const id = newId();
      commit(
        mapSemester(get().data, semesterId, (s) => ({
          ...s,
          subjects: [...s.subjects, { id, name, grades: [], exams: [] }],
        }))
      );
      return id;
    },

    deleteSubject: (semesterId, subjectId) =>
      commit(
        mapSemester(get().data, semesterId, (s) => ({
          ...s,
          subjects: s.subjects.filter((sub) => sub.id !== subjectId),
        }))
      ),

    addGrade: (semesterId, subjectId, grade) => {
      const id = newId();
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: [...sub.grades, { ...grade, id }],
        }))
      );
      return id;
    },

    updateGrade: (semesterId, subjectId, gradeId, patch) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: sub.grades.map((g) =>
            g.id === gradeId ? { ...g, ...patch } : g
          ),
        }))
      ),

    deleteGrade: (semesterId, subjectId, gradeId) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          grades: sub.grades.filter((g) => g.id !== gradeId),
        }))
      ),

    setSubjectTarget: (semesterId, subjectId, target) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          targetGrade: target,
        }))
      ),

    addExam: (semesterId, subjectId, exam) => {
      const id = newId();
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          exams: [...sub.exams, { ...exam, id }],
        }))
      );
      return id;
    },

    deleteExam: (semesterId, subjectId, examId) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => ({
          ...sub,
          exams: sub.exams.filter((e) => e.id !== examId),
        }))
      ),

    recordExamGrade: (semesterId, subjectId, examId, value) =>
      commit(
        mapSubject(get().data, semesterId, subjectId, (sub) => {
          const exam = sub.exams.find((e) => e.id === examId);
          if (!exam) return sub;
          return {
            ...sub,
            grades: [
              ...sub.grades,
              {
                id: newId(),
                value,
                weight: exam.weight,
                label: exam.name,
                date: exam.date,
              },
            ],
            exams: sub.exams.filter((e) => e.id !== examId),
          };
        })
      ),
  };
});
