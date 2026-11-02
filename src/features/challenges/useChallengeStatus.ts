import { useEffect, useState } from "react";
import { CHALLENGES } from "../../data/challenges/challengeCatalog";
import {
  isChallengeComplete,
  isChallengeCompleteOnDay,
  selectDailyChallenge,
  toLocalDateKey,
  type ChallengeDefinition,
} from "../../game-engine/progression/challenges";
import { useProgressStore } from "../../store/progressStore";

export interface ChallengeStatus {
  readonly challenge: ChallengeDefinition;
  readonly complete: boolean;
}

/** Loads progress and reports every challenge plus today's featured one. */
export function useChallengeStatus(initialNow?: Date) {
  // Fixed for the lifetime of the page so "today" cannot change mid-render.
  const [now] = useState(() => initialNow ?? new Date());
  const results = useProgressStore((state) => state.results);
  const experiments = useProgressStore((state) => state.experiments);
  const status = useProgressStore((state) => state.status);
  const hydrate = useProgressStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const context = { results, experiments };
  const daily = selectDailyChallenge(CHALLENGES, now);

  return {
    ready: status === "ready",
    all: CHALLENGES.map(
      (challenge): ChallengeStatus => ({
        challenge,
        complete: isChallengeComplete(challenge, context),
      }),
    ),
    daily: {
      challenge: daily,
      completeToday: isChallengeCompleteOnDay(daily, context, toLocalDateKey(now)),
    },
  };
}
