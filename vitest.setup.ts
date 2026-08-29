import "@testing-library/jest-dom/vitest";

// jsdom environment: normalize the web-storage globals across Node versions.
// Newer Node releases ship an experimental `localStorage` global that is
// `undefined` unless `--localstorage-file` is passed; that value shadows the
// jsdom implementation in vitest, crashing tests that read bare
// `localStorage`. When the jsdom-provided global did not install, fall back
// to an in-memory Storage so the API stays available and testable.
if (typeof globalThis.localStorage === "undefined") {
  function createMemoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key: string) {
        const value = store.get(key);
        return value === undefined ? null : value;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
    };
  }

  Object.defineProperty(globalThis, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}
