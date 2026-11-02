import { useCallback, useEffect, useRef, useState } from "react";
import { useProgressStore } from "../store/progressStore";

const SAVE_DELAY_MS = 400;
const NOTHING_PENDING = Symbol("nothing pending");

export interface GameSessionControls {
  /** True when a saved game was found and the learner has not chosen yet. */
  readonly hasSavedGame: boolean;
  /** Restores the saved game through `onRestore`. */
  readonly resume: () => void;
  /** Deletes the saved game and starts fresh. */
  readonly discard: () => void;
}

interface UseGameSessionOptions<T> {
  readonly gameId: string;
  /** Serializable state to keep, or null when there is nothing worth resuming. */
  readonly snapshot: T | null;
  /** Validates stored data; return null to ignore a corrupt or outdated save. */
  readonly parse: (raw: unknown) => T | null;
  readonly onRestore: (snapshot: T) => void;
}

/**
 * Persists an in-progress game locally and offers to resume it next visit.
 * Saving waits until the learner resolves a pending prompt so an existing
 * save is never overwritten by the empty state shown on first render.
 */
export function useGameSession<T>({
  gameId,
  snapshot,
  parse,
  onRestore,
}: UseGameSessionOptions<T>): GameSessionControls {
  const loadSession = useProgressStore((state) => state.loadSession);
  const saveSession = useProgressStore((state) => state.saveSession);
  const deleteSession = useProgressStore((state) => state.deleteSession);
  const [saved, setSaved] = useState<T | null>(null);
  const [checked, setChecked] = useState(false);
  const parseRef = useRef(parse);
  const pendingRef = useRef<unknown>(NOTHING_PENDING);
  const serialized = snapshot === null ? null : JSON.stringify(snapshot);

  useEffect(() => {
    parseRef.current = parse;
  });

  useEffect(() => {
    let cancelled = false;
    void loadSession(gameId).then((session) => {
      if (cancelled) {
        return;
      }
      const parsed = session ? parseRef.current(session.data) : null;
      setSaved(parsed);
      setChecked(true);
      if (session && parsed === null) {
        void deleteSession(gameId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [gameId, loadSession, deleteSession]);

  // Starting a new game while the prompt is showing replaces the old save.
  const promptPending = saved !== null && serialized === null;

  useEffect(() => {
    if (!checked || promptPending) {
      return;
    }
    if (serialized === null) {
      pendingRef.current = null;
      void deleteSession(gameId);
      return;
    }

    const data: unknown = JSON.parse(serialized);
    pendingRef.current = data;
    const timer = setTimeout(() => {
      pendingRef.current = NOTHING_PENDING;
      void saveSession(gameId, data);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [checked, promptPending, serialized, gameId, saveSession, deleteSession]);

  // Leaving the page must not lose the latest unsaved state.
  useEffect(
    () => () => {
      if (pendingRef.current !== NOTHING_PENDING && pendingRef.current !== null) {
        void saveSession(gameId, pendingRef.current);
      }
    },
    [gameId, saveSession],
  );

  const resume = useCallback(() => {
    if (saved !== null) {
      onRestore(saved);
      setSaved(null);
    }
  }, [saved, onRestore]);

  const discard = useCallback(() => {
    setSaved(null);
    void deleteSession(gameId);
  }, [deleteSession, gameId]);

  return { hasSavedGame: promptPending, resume, discard };
}
