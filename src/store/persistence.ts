import type { AppData } from "../domain/types";

export const STORAGE_KEY = "intelligrade.data";

export function emptyAppData(): AppData {
  return { schemaVersion: 1, activeSemesterId: null, semesters: [] };
}

export function migrate(raw: unknown): AppData {
  if (
    raw &&
    typeof raw === "object" &&
    (raw as AppData).schemaVersion === 1 &&
    Array.isArray((raw as AppData).semesters)
  ) {
    return raw as AppData;
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
