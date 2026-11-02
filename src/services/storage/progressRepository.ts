import type { GameResult } from "../../types/progress";

/** Local persistence for learner progress. All methods reject on storage failure. */
export interface ProgressRepository {
  listGameResults(): Promise<GameResult[]>;
  saveGameResult(result: GameResult): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryProgressRepository implements ProgressRepository {
  private results: GameResult[] = [];

  async listGameResults(): Promise<GameResult[]> {
    return [...this.results];
  }

  async saveGameResult(result: GameResult): Promise<void> {
    this.results.push(result);
  }

  async clear(): Promise<void> {
    this.results = [];
  }
}

export const DATABASE_NAME = "physics-playground";
export const DATABASE_VERSION = 1;
const GAME_RESULTS_STORE = "gameResults";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** Stores progress in IndexedDB so it survives reloads and works offline. */
export class IndexedDbProgressRepository implements ProgressRepository {
  private database: Promise<IDBDatabase> | null = null;

  constructor(private readonly factory: IDBFactory = indexedDB) {}

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(GAME_RESULTS_STORE)) {
          const store = database.createObjectStore(GAME_RESULTS_STORE, {
            autoIncrement: true,
          });
          store.createIndex("gameId", "gameId");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("The progress database is blocked by another tab."));
    });
    // A failed open must be retried on the next call.
    this.database.catch(() => {
      this.database = null;
    });
    return this.database;
  }

  async listGameResults(): Promise<GameResult[]> {
    const database = await this.open();
    const transaction = database.transaction(GAME_RESULTS_STORE, "readonly");
    return requestToPromise(
      transaction.objectStore(GAME_RESULTS_STORE).getAll(),
    );
  }

  async saveGameResult(result: GameResult): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(GAME_RESULTS_STORE, "readwrite");
    transaction.objectStore(GAME_RESULTS_STORE).add(result);
    await transactionDone(transaction);
  }

  async clear(): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(GAME_RESULTS_STORE, "readwrite");
    transaction.objectStore(GAME_RESULTS_STORE).clear();
    await transactionDone(transaction);
  }
}

/** IndexedDB when the browser provides it, otherwise a session-only fallback. */
export function createProgressRepository(): ProgressRepository {
  return typeof indexedDB === "undefined"
    ? new MemoryProgressRepository()
    : new IndexedDbProgressRepository();
}
