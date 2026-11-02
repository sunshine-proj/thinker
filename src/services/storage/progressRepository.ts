import type {
  GameResult,
  GameSession,
  SavedExperiment,
  UnlockedAchievement,
} from "../../types/progress";

/** Local persistence for learner data. All methods reject on storage failure. */
export interface ProgressRepository {
  listGameResults(): Promise<GameResult[]>;
  saveGameResult(result: GameResult): Promise<void>;

  listSavedExperiments(): Promise<SavedExperiment[]>;
  saveExperiment(experiment: SavedExperiment): Promise<void>;
  deleteExperiment(id: string): Promise<void>;

  listAchievements(): Promise<UnlockedAchievement[]>;
  saveAchievement(achievement: UnlockedAchievement): Promise<void>;

  loadSession(gameId: string): Promise<GameSession | null>;
  saveSession(session: GameSession): Promise<void>;
  deleteSession(gameId: string): Promise<void>;

  /** Removes every stored record. */
  clear(): Promise<void>;
}

export class MemoryProgressRepository implements ProgressRepository {
  private results: GameResult[] = [];
  private experiments = new Map<string, SavedExperiment>();
  private achievements = new Map<string, UnlockedAchievement>();
  private sessions = new Map<string, GameSession>();

  async listGameResults(): Promise<GameResult[]> {
    return [...this.results];
  }

  async saveGameResult(result: GameResult): Promise<void> {
    this.results.push(result);
  }

  async listSavedExperiments(): Promise<SavedExperiment[]> {
    return [...this.experiments.values()];
  }

  async saveExperiment(experiment: SavedExperiment): Promise<void> {
    this.experiments.set(experiment.id, experiment);
  }

  async deleteExperiment(id: string): Promise<void> {
    this.experiments.delete(id);
  }

  async listAchievements(): Promise<UnlockedAchievement[]> {
    return [...this.achievements.values()];
  }

  async saveAchievement(achievement: UnlockedAchievement): Promise<void> {
    this.achievements.set(achievement.achievementId, achievement);
  }

  async loadSession(gameId: string): Promise<GameSession | null> {
    return this.sessions.get(gameId) ?? null;
  }

  async saveSession(session: GameSession): Promise<void> {
    this.sessions.set(session.gameId, session);
  }

  async deleteSession(gameId: string): Promise<void> {
    this.sessions.delete(gameId);
  }

  async clear(): Promise<void> {
    this.results = [];
    this.experiments.clear();
    this.achievements.clear();
    this.sessions.clear();
  }
}

export const DATABASE_NAME = "physics-playground";
/** v1: game results. v2: saved experiments, achievements, and game sessions. */
export const DATABASE_VERSION = 2;

const STORES = {
  gameResults: "gameResults",
  savedExperiments: "savedExperiments",
  achievements: "achievements",
  gameSessions: "gameSessions",
} as const;

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

/** Creates any store that an older database version lacks, keeping existing data. */
function upgradeDatabase(database: IDBDatabase): void {
  if (!database.objectStoreNames.contains(STORES.gameResults)) {
    const store = database.createObjectStore(STORES.gameResults, {
      autoIncrement: true,
    });
    store.createIndex("gameId", "gameId");
  }
  if (!database.objectStoreNames.contains(STORES.savedExperiments)) {
    const store = database.createObjectStore(STORES.savedExperiments, {
      keyPath: "id",
    });
    store.createIndex("experimentId", "experimentId");
  }
  if (!database.objectStoreNames.contains(STORES.achievements)) {
    database.createObjectStore(STORES.achievements, {
      keyPath: "achievementId",
    });
  }
  if (!database.objectStoreNames.contains(STORES.gameSessions)) {
    database.createObjectStore(STORES.gameSessions, { keyPath: "gameId" });
  }
}

/** Stores learner data in IndexedDB so it survives reloads and works offline. */
export class IndexedDbProgressRepository implements ProgressRepository {
  private database: Promise<IDBDatabase> | null = null;

  constructor(private readonly factory: IDBFactory = indexedDB) {}

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () =>
        upgradeDatabase(request.result);
      request.onsuccess = () => {
        const database = request.result;
        // Let another tab upgrade the schema instead of blocking it.
        database.onversionchange = () => {
          database.close();
          this.database = null;
        };
        resolve(database);
      };
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

  private async readAll<T>(storeName: string): Promise<T[]> {
    const database = await this.open();
    const transaction = database.transaction(storeName, "readonly");
    return requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  }

  private async write(
    storeName: string,
    operation: (store: IDBObjectStore) => void,
  ): Promise<void> {
    const database = await this.open();
    const transaction = database.transaction(storeName, "readwrite");
    operation(transaction.objectStore(storeName));
    await transactionDone(transaction);
  }

  listGameResults(): Promise<GameResult[]> {
    return this.readAll(STORES.gameResults);
  }

  saveGameResult(result: GameResult): Promise<void> {
    return this.write(STORES.gameResults, (store) => void store.add(result));
  }

  listSavedExperiments(): Promise<SavedExperiment[]> {
    return this.readAll(STORES.savedExperiments);
  }

  saveExperiment(experiment: SavedExperiment): Promise<void> {
    return this.write(STORES.savedExperiments, (store) => void store.put(experiment));
  }

  deleteExperiment(id: string): Promise<void> {
    return this.write(STORES.savedExperiments, (store) => void store.delete(id));
  }

  listAchievements(): Promise<UnlockedAchievement[]> {
    return this.readAll(STORES.achievements);
  }

  saveAchievement(achievement: UnlockedAchievement): Promise<void> {
    return this.write(STORES.achievements, (store) => void store.put(achievement));
  }

  async loadSession(gameId: string): Promise<GameSession | null> {
    const database = await this.open();
    const transaction = database.transaction(STORES.gameSessions, "readonly");
    const session = await requestToPromise<GameSession | undefined>(
      transaction.objectStore(STORES.gameSessions).get(gameId),
    );
    return session ?? null;
  }

  saveSession(session: GameSession): Promise<void> {
    return this.write(STORES.gameSessions, (store) => void store.put(session));
  }

  deleteSession(gameId: string): Promise<void> {
    return this.write(STORES.gameSessions, (store) => void store.delete(gameId));
  }

  async clear(): Promise<void> {
    const database = await this.open();
    const names = Object.values(STORES);
    const transaction = database.transaction(names, "readwrite");
    names.forEach((name) => transaction.objectStore(name).clear());
    await transactionDone(transaction);
  }
}

/** IndexedDB when the browser provides it, otherwise a session-only fallback. */
export function createProgressRepository(): ProgressRepository {
  return typeof indexedDB === "undefined"
    ? new MemoryProgressRepository()
    : new IndexedDbProgressRepository();
}
