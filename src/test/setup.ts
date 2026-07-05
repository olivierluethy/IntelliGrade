import { beforeEach } from "vitest";

// Provide a minimal localStorage stub for Vitest node environment.
// Tests that care about storage contents use fakeStorage() directly;
// this stub exists only so modules that default to localStorage can import
// without throwing ReferenceError.
const _store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(_store)) delete _store[k];
});
const localStorageMock: Pick<Storage, "getItem" | "setItem"> = {
  getItem: (key: string) => _store[key] ?? null,
  setItem: (key: string, value: string) => {
    _store[key] = value;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});
