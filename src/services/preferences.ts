import { useEffect, useState } from "react";

/**
 * Per-learner presentation preferences kept on this device. They change how things are
 * worded and shown, never the physics or the scoring.
 */
export interface LearnerPreferences {
  /** Simpler wording, shorter explanations and the first hint open on beginner rounds. */
  readonly youngerLearner: boolean;
}

const KEY = "physics-playground.preferences";
const DEFAULTS: LearnerPreferences = { youngerLearner: false };
const listeners = new Set<(preferences: LearnerPreferences) => void>();

export function readPreferences(): LearnerPreferences {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const record = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<string, unknown>;
    return { youngerLearner: record.youngerLearner === true };
  } catch {
    return DEFAULTS;
  }
}

export function writePreferences(changes: Partial<LearnerPreferences>): LearnerPreferences {
  const next = { ...readPreferences(), ...changes };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Kept only for this page view.
  }
  listeners.forEach((listener) => listener(next));
  return next;
}

export function useLearnerPreferences(): [LearnerPreferences, (changes: Partial<LearnerPreferences>) => void] {
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    listeners.add(setPreferences);
    return () => {
      listeners.delete(setPreferences);
    };
  }, []);
  return [preferences, (changes) => void writePreferences(changes)];
}

/** First sentence of a text, for the shorter younger-learner presentation. */
export function firstSentence(text: string): string {
  const match = /^.*?[.!?](\s|$)/.exec(text);
  return (match ? match[0] : text).trim();
}
