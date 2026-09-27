import { createSeed, DB_VERSION, type MockDatabase } from "./seed";

const STORAGE_KEY = "pasupasastra.mock-db";

let cache: MockDatabase | null = null;

function load(): MockDatabase {
  if (typeof window === "undefined") return createSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabase;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* corrupted storage: fall back to seed */
  }
  return createSeed();
}

function persist(db: MockDatabase): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable: keep in memory only */
  }
}

/** Demo database, persisted to localStorage so edits survive reloads. */
export function readDb(): MockDatabase {
  cache ??= load();
  return cache;
}

export function updateDb(mutate: (db: MockDatabase) => void): MockDatabase {
  const db = readDb();
  mutate(db);
  persist(db);
  return db;
}

export function resetDb(): void {
  cache = createSeed();
  persist(cache);
}

/** Defensive copy so UI state never aliases mock storage objects. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

const MIN_LATENCY_MS = 120;

/** Simulated network latency. */
export function latency(extraMs = 0): Promise<void> {
  const ms = MIN_LATENCY_MS + Math.random() * 180 + extraMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
