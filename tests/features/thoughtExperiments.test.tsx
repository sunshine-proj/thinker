import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThoughtExperimentRoute } from "../../src/features/thought-experiments/ThoughtExperimentRoute";
import { ThoughtExperimentsPage } from "../../src/features/thought-experiments/ThoughtExperimentsPage";
import { STATEMENT_LABELS } from "../../src/features/thought-experiments/thoughtExperimentTypes";
import {
  THOUGHT_EXPERIMENTS,
  alignedTideRatio,
  earthSunDistanceIncrease,
  muonSurvival,
  slowSunlightYears,
} from "../../src/features/thought-experiments/thoughtExperiments";
import { useProgressStore } from "../../src/store/progressStore";

const PRD_SCENARIOS = [
  "gravity-disappears", "gravity-doubles", "feather-vacuum", "near-light-speed",
  "two-moons", "absolute-zero", "slower-light",
];

describe("thought experiment content", () => {
  it("covers all seven PRD §8 scenarios", () => {
    expect(THOUGHT_EXPERIMENTS.map((experiment) => experiment.id)).toEqual(PRD_SCENARIOS);
  });

  it.each(THOUGHT_EXPERIMENTS.map((experiment) => [experiment.id, experiment] as const))(
    "%s has labeled statements, valid questions and finite results across its range",
    (_id, experiment) => {
      for (const statement of [...experiment.statements, ...experiment.explanation, ...experiment.variation.explanation]) {
        expect(Object.keys(STATEMENT_LABELS)).toContain(statement.kind);
        expect(statement.text.length).toBeGreaterThan(20);
      }
      expect(experiment.statements.some((statement) => statement.kind === "established")).toBe(true);
      expect(experiment.statements.some((statement) => statement.kind === "assumption" || statement.kind === "speculation")).toBe(true);
      for (const question of [experiment.question, experiment.variation.question]) {
        expect(question.options.map((option) => option.id)).toContain(question.answerId);
        expect(new Set(question.options.map((option) => option.id)).size).toBe(question.options.length);
      }
      const { minimum, maximum, initial } = experiment.parameter;
      for (const value of [minimum, initial, maximum, (minimum + maximum) / 2]) {
        const result = experiment.run(value);
        expect(result.rows.length).toBeGreaterThan(2);
        result.rows.forEach((row) => expect(row.value).not.toMatch(/NaN|Infinity/));
        result.chart?.series.forEach((series) =>
          series.points.forEach((point) => {
            expect(Number.isFinite(point.x)).toBe(true);
            expect(Number.isFinite(point.y)).toBe(true);
          }),
        );
      }
    },
  );

  it("labels the hypothetical worlds as speculation", () => {
    const slower = THOUGHT_EXPERIMENTS.find((experiment) => experiment.id === "slower-light");
    const moons = THOUGHT_EXPERIMENTS.find((experiment) => experiment.id === "two-moons");
    expect(slower?.statements[0]?.kind).toBe("speculation");
    expect(moons?.statements.some((statement) => statement.kind === "speculation")).toBe(true);
  });
});

describe("thought experiment answers follow from the physics", () => {
  const byId = (id: string) => THOUGHT_EXPERIMENTS.find((experiment) => experiment.id === id)!;

  it("gravity disappears: 1.7 cm in the first second; Earth 12 % farther after 30 days", () => {
    expect(byId("gravity-disappears").run(1).rows[1]?.value).toBe("1.7 cm");
    expect(earthSunDistanceIncrease(30)).toBeGreaterThan(0.11);
    expect(earthSunDistanceIncrease(30)).toBeLessThan(0.13);
  });

  it("gravity doubles: the apple falls in 71 % of the time", () => {
    expect(byId("gravity-doubles").run(2).rows[1]?.value).toContain("(71 % of today)");
  });

  it("near light speed: one crew year at 0.9c is 2.29 Earth years; about 10 % of muons arrive", () => {
    expect(byId("near-light-speed").run(0.9).rows[1]?.value).toBe("2.29 years");
    expect(muonSurvival(true)).toBeCloseTo(0.1, 1);
    expect(muonSurvival(false)).toBeLessThan(1e-9);
  });

  it("two moons: eight times the tide at half the distance, about 6.5 times aligned", () => {
    expect(byId("two-moons").run(0.5).rows[1]?.value).toBe("8.00 ×");
    expect(alignedTideRatio(0.5)).toBeCloseTo(6.5, 0);
  });

  it("slower light: sunlight would take about 240 years at 20 m/s", () => {
    expect(slowSunlightYears(20)).toBeGreaterThan(230);
    expect(slowSunlightYears(20)).toBeLessThan(245);
  });

  it("absolute zero: classical at room temperature, quantum at a millikelvin", () => {
    const experiment = byId("absolute-zero");
    expect(experiment.run(Math.log10(300)).rows.at(-1)?.value).toMatch(/classical/i);
    expect(experiment.run(-3).rows.at(-1)?.value).toMatch(/quantum/i);
  });
});

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ThoughtExperimentsPage />} path="/thought-experiments" />
        <Route element={<ThoughtExperimentRoute />} path="/thought-experiments/:experimentId" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("thought experiment flow", () => {
  it("lists every scenario on the index page", async () => {
    renderRoute("/thought-experiments");
    for (const experiment of THOUGHT_EXPERIMENTS) {
      expect(await screen.findByRole("link", { name: new RegExp(experiment.title.replace(/[?']/g, ".")) })).toBeTruthy();
    }
  });

  it("predicts, records, runs, compares, then offers a harder variation", async () => {
    renderRoute("/thought-experiments/gravity-doubles");
    await screen.findByRole("heading", { level: 1, name: "What if gravity doubled?" });
    expect(screen.queryByText(/2\. Experiment and observe/)).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "Half the time" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock in my prediction" }));
    await screen.findByText(/Prediction recorded: Half the time/);
    await waitFor(() => expect(useProgressStore.getState().predictions).toHaveLength(1));
    expect(useProgressStore.getState().predictions[0]).toMatchObject({
      id: "gravity-doubles:main", answer: "half", correct: false, activityKind: "thought-experiment",
    });
    // The result stays hidden until the learner runs the experiment.
    expect(screen.queryByText(/2\. Experiment and observe/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Run the experiment" }));
    expect(await screen.findByText(/The result differs from your prediction/)).toBeTruthy();
    expect(screen.getByText(/The physics says: About 71 %/)).toBeTruthy();

    fireEvent.change(screen.getByRole("slider", { name: "Gravity compared with today" }), { target: { value: "1" } });
    expect(screen.getByText(/\(100 % of today\)/)).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "It runs fast, gaining about 10 hours a day" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Lock in my prediction" })[0]!);
    expect(await screen.findByText(/Your prediction matched the result/)).toBeTruthy();
    await waitFor(() => expect(useProgressStore.getState().predictions).toHaveLength(2));
  });

  it("shows the results straight away when the learner returns", async () => {
    await useProgressStore.getState().recordPrediction({
      activityId: "two-moons", activityKind: "thought-experiment", questionId: "main", answer: "eight", correct: true,
    });
    renderRoute("/thought-experiments/two-moons");
    expect(await screen.findByText(/Your prediction matched the result/)).toBeTruthy();
  });

  it("shows not-found for an unknown scenario", async () => {
    renderRoute("/thought-experiments/nope");
    expect(await screen.findByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.queryByText("1. Predict")).toBeNull();
  });
});

describe("title index for the main bundle", () => {
  it("matches the thought experiments", async () => {
    const { THOUGHT_EXPERIMENT_TITLES } = await import("../../src/data/thoughtExperimentTitles");
    expect(THOUGHT_EXPERIMENT_TITLES).toEqual(Object.fromEntries(THOUGHT_EXPERIMENTS.map((experiment) => [experiment.id, experiment.title])));
  });
});
