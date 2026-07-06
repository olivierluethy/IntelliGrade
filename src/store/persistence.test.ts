import { describe, it, expect } from "vitest";
import {
  emptyAppData,
  migrate,
  loadAppData,
  saveAppData,
  STORAGE_KEY,
} from "./persistence";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    _map: map,
  };
}

describe("migrate", () => {
  it("returns empty data for null", () => {
    expect(migrate(null)).toEqual(emptyAppData());
  });

  it("returns empty data for corrupt/unknown version", () => {
    expect(migrate({ schemaVersion: 99 })).toEqual(emptyAppData());
    expect(migrate({ foo: "bar" })).toEqual(emptyAppData());
  });

  it("upgrades v1 data to v2, adding exams: [] to each subject", () => {
    const v1 = {
      schemaVersion: 1,
      activeSemesterId: "s1",
      semesters: [
        {
          id: "s1",
          name: "HS25",
          scaleId: "swiss",
          subjects: [{ id: "sub1", name: "Math", grades: [] }],
        },
      ],
    };
    const out = migrate(v1);
    expect(out.schemaVersion).toBe(2);
    expect(out.activeSemesterId).toBe("s1");
    expect(out.semesters[0].subjects[0].exams).toEqual([]);
  });

  it("passes through valid v2 data (defaulting missing exams)", () => {
    const v2 = {
      schemaVersion: 2,
      activeSemesterId: "s1",
      semesters: [
        {
          id: "s1",
          name: "HS25",
          scaleId: "swiss",
          subjects: [
            { id: "sub1", name: "Math", grades: [], exams: [{ id: "e1", name: "Test", date: "2026-07-10", weight: 1 }] },
          ],
        },
      ],
    };
    expect(migrate(v2)).toEqual(v2);
  });
});

describe("load/save round-trip", () => {
  it("saves then loads identical data", () => {
    const store = fakeStorage();
    const data = emptyAppData();
    data.activeSemesterId = "abc";
    saveAppData(data, store);
    expect(store._map.get(STORAGE_KEY)).toBeTypeOf("string");
    expect(loadAppData(store)).toEqual(data);
  });

  it("loads empty data when storage is empty", () => {
    expect(loadAppData(fakeStorage())).toEqual(emptyAppData());
  });

  it("loads empty data when stored JSON is corrupt", () => {
    expect(loadAppData(fakeStorage({ [STORAGE_KEY]: "{not json" }))).toEqual(
      emptyAppData()
    );
  });
});
