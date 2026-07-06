import type { AppData, Semester } from "../domain/types";

export const STORAGE_KEY = "intelligrade.data";

export function emptyAppData(): AppData {
  return { schemaVersion: 2, activeSemesterId: null, semesters: [] };
}

// Ensure every subject has an `exams` array (v1 subjects lack it).
function withExams(semesters: Semester[]): Semester[] {
  return semesters.map((s) => ({
    ...s,
    subjects: s.subjects.map((sub) => ({ ...sub, exams: sub.exams ?? [] })),
  }));
}

export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return emptyAppData();
  const d = raw as { schemaVersion?: number; activeSemesterId?: string | null; semesters?: unknown };
  if (!Array.isArray(d.semesters)) return emptyAppData();
  if (d.schemaVersion === 1 || d.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      activeSemesterId: d.activeSemesterId ?? null,
      semesters: withExams(d.semesters as Semester[]),
    };
  }
  return emptyAppData();
}

export function loadAppData(
  storage: Pick<Storage, "getItem"> = localStorage
): AppData {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData();
    return migrate(JSON.parse(raw));
  } catch {
    return emptyAppData();
  }
}

export function saveAppData(
  data: AppData,
  storage: Pick<Storage, "setItem"> = localStorage
): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — non-fatal
  }
}
