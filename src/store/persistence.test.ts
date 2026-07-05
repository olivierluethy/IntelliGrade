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

  it("passes through valid v1 data", () => {
    const data = {
      schemaVersion: 1,
      activeSemesterId: "s1",
      semesters: [{ id: "s1", name: "HS25", scaleId: "swiss", subjects: [] }],
    };
    expect(migrate(data)).toEqual(data);
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
