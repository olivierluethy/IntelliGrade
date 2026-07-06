import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";
import { emptyAppData } from "./persistence";

beforeEach(() => {
  useStore.setState({ data: emptyAppData() });
});

describe("store CRUD", () => {
  it("adds a semester and makes the first one active", () => {
    const id = useStore.getState().addSemester("HS25");
    const { data } = useStore.getState();
    expect(data.semesters).toHaveLength(1);
    expect(data.activeSemesterId).toBe(id);
  });

  it("adds a subject to a semester", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const semester = useStore.getState().data.semesters[0];
    expect(semester.subjects[0].id).toBe(sub);
    expect(semester.subjects[0].name).toBe("Math");
  });

  it("adds, updates, and deletes a grade", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const gid = useStore
      .getState()
      .addGrade(sem, sub, { value: 5, weight: 1 });
    let grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades[0].value).toBe(5);

    useStore.getState().updateGrade(sem, sub, gid, { value: 5.5 });
    grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades[0].value).toBe(5.5);

    useStore.getState().deleteGrade(sem, sub, gid);
    grades = useStore.getState().data.semesters[0].subjects[0].grades;
    expect(grades).toHaveLength(0);
  });

  it("deletes a subject", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    useStore.getState().deleteSubject(sem, sub);
    expect(useStore.getState().data.semesters[0].subjects).toHaveLength(0);
  });

  it("sets a subject target", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    useStore.getState().setSubjectTarget(sem, sub, 5.2);
    expect(
      useStore.getState().data.semesters[0].subjects[0].targetGrade
    ).toBe(5.2);
  });

  it("adds and deletes an exam", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const eid = useStore
      .getState()
      .addExam(sem, sub, { name: "Vectors", date: "2026-07-10", weight: 2 });
    let exams = useStore.getState().data.semesters[0].subjects[0].exams;
    expect(exams).toHaveLength(1);
    expect(exams[0].name).toBe("Vectors");

    useStore.getState().deleteExam(sem, sub, eid);
    exams = useStore.getState().data.semesters[0].subjects[0].exams;
    expect(exams).toHaveLength(0);
  });

  it("records an exam as a grade and removes the exam", () => {
    const sem = useStore.getState().addSemester("HS25");
    const sub = useStore.getState().addSubject(sem, "Math");
    const eid = useStore
      .getState()
      .addExam(sem, sub, { name: "Vectors", date: "2026-07-10", weight: 2 });

    useStore.getState().recordExamGrade(sem, sub, eid, 5.5);
    const subject = useStore.getState().data.semesters[0].subjects[0];
    expect(subject.exams).toHaveLength(0);
    expect(subject.grades).toHaveLength(1);
    expect(subject.grades[0].value).toBe(5.5);
    expect(subject.grades[0].weight).toBe(2);
    expect(subject.grades[0].label).toBe("Vectors");
    expect(subject.grades[0].date).toBe("2026-07-10");
  });
});
