import { describe, expect, it } from "vitest";
import {
  createGameLifecycle,
  transitionGameLifecycle,
} from "../../src/game-engine/core/GameLifecycle";
import {
  createGameObjective,
  updateGameObjective,
} from "../../src/game-engine/objectives/GameObjective";
import {
  applyScoringRule,
  createScoreState,
  recordScore,
  summarizeScore,
} from "../../src/game-engine/scoring/ScoringSystem";

describe("game lifecycle", () => {
  it("supports ready, playing, paused, completed, and reset transitions", () => {
    let lifecycle = createGameLifecycle();
    expect(lifecycle.status).toBe("ready");

    lifecycle = transitionGameLifecycle(lifecycle, "start");
    expect(lifecycle.status).toBe("playing");
    lifecycle = transitionGameLifecycle(lifecycle, "pause");
    expect(lifecycle.status).toBe("paused");
    lifecycle = transitionGameLifecycle(lifecycle, "resume");
    expect(lifecycle.status).toBe("playing");
    lifecycle = transitionGameLifecycle(lifecycle, "complete");
    expect(lifecycle.status).toBe("completed");
    lifecycle = transitionGameLifecycle(lifecycle, "reset");
    expect(lifecycle.status).toBe("ready");
  });

  it.each([
    ["ready", "pause"],
    ["ready", "complete"],
    ["playing", "start"],
    ["playing", "resume"],
    ["paused", "pause"],
    ["paused", "complete"],
    ["completed", "start"],
    ["completed", "resume"],
  ] as const)("rejects %s -> %s", (status, action) => {
    expect(() => transitionGameLifecycle({ status }, action)).toThrow(
      `Cannot ${action} a game while it is ${status}.`,
    );
  });

  it("allows reset from every lifecycle state", () => {
    for (const status of ["ready", "playing", "paused", "completed"] as const) {
      expect(transitionGameLifecycle({ status }, "reset").status).toBe("ready");
    }
  });
});

describe("game objectives", () => {
  const definition = {
    id: "targets",
    title: "Reach every target",
    description: "Land in all target zones.",
    target: 3,
    unit: "targets",
  };

  it("tracks progress and marks the objective complete at its target", () => {
    const objective = createGameObjective(definition);
    expect(objective.progress).toBe(0);
    expect(objective.completed).toBe(false);

    const inProgress = updateGameObjective(objective, 2);
    expect(inProgress.progress).toBe(2);
    expect(inProgress.completed).toBe(false);

    const complete = updateGameObjective(inProgress, 3);
    expect(complete.progress).toBe(3);
    expect(complete.completed).toBe(true);
    expect(objective.progress).toBe(0);
  });

  it("validates objective definitions and progress", () => {
    expect(() =>
      createGameObjective({ ...definition, target: 0 }),
    ).toThrow(/target must be a positive finite number/);
    expect(() =>
      createGameObjective({ ...definition, id: " " }),
    ).toThrow(/id must not be empty/);
    const objective = createGameObjective(definition);
    expect(() => updateGameObjective(objective, -1)).toThrow(
      /non-negative number/,
    );
    expect(() => updateGameObjective(objective, Number.NaN)).toThrow(
      /non-negative number/,
    );
  });
});

describe("scoring system", () => {
  it("applies configurable scoring rules and summarizes the resulting score", () => {
    const rules = [
      { action: "hit", label: "Target hit", points: 80 },
      { action: "predict", label: "Accurate prediction", points: 20 },
    ] as const;
    const score = applyScoringRule(
      applyScoringRule(createScoreState(), "hit", rules),
      "predict",
      rules,
    );

    expect(summarizeScore(score)).toEqual({
      totalPoints: 100,
      entryCount: 2,
      entries: [
        { id: "hit", label: "Target hit", points: 80 },
        { id: "predict", label: "Accurate prediction", points: 20 },
      ],
    });
  });

  it("accumulates action scores and preserves the best score by entry", () => {
    const first = recordScore(createScoreState(), {
      id: "round-1",
      label: "Round 1",
      points: 25,
    });
    const improved = recordScore(
      first,
      { id: "round-1", label: "Round 1", points: 30 },
      "best",
    );
    const lower = recordScore(
      improved,
      { id: "round-1", label: "Round 1", points: 20 },
      "best",
    );

    expect(lower.totalPoints).toBe(30);
    expect(lower.entries).toEqual([
      { id: "round-1", label: "Round 1", points: 30 },
    ]);
  });

  it("rejects unknown or duplicate scoring rules and invalid points", () => {
    expect(() =>
      applyScoringRule(createScoreState(), "miss", []),
    ).toThrow(/No scoring rule/);
    expect(() =>
      applyScoringRule(createScoreState(), "hit", [
        { action: "hit", label: "First", points: 1 },
        { action: "hit", label: "Second", points: 2 },
      ]),
    ).toThrow(/More than one scoring rule/);
    expect(() =>
      recordScore(createScoreState(), {
        id: "invalid",
        label: "Invalid",
        points: -1,
      }),
    ).toThrow(/non-negative safe integer/);
    expect(() =>
      recordScore(
        recordScore(createScoreState(), {
          id: "first",
          label: "First",
          points: Number.MAX_SAFE_INTEGER,
        }),
        { id: "second", label: "Second", points: 1 },
      ),
    ).toThrow(/Total score must remain a safe integer/);
  });
});
