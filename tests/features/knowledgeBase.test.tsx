import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PHYSICS_WORLDS, findCatalogEntry } from "../../src/data/games/gameCatalog";
import { KNOWLEDGE_BASE } from "../../src/data/knowledge";
import { PHYSICS_TOPICS } from "../../src/data/topics";
import { KnowledgeBasePage } from "../../src/features/knowledge-base/KnowledgeBasePage";
import { KnowledgeEntryPage } from "../../src/features/knowledge-base/KnowledgeEntryPage";

describe("topics and knowledge content", () => {
  it("has unique topic ids in known worlds", () => {
    expect(new Set(PHYSICS_TOPICS.map((topic) => topic.id)).size).toBe(PHYSICS_TOPICS.length);
    const worlds = new Set(PHYSICS_WORLDS.map((world) => world.id));
    PHYSICS_TOPICS.forEach((topic) => expect(worlds).toContain(topic.worldId));
  });

  it("has exactly one Knowledge Base entry for every PRD topic", () => {
    expect(KNOWLEDGE_BASE.map((entry) => entry.topicId).sort()).toEqual(PHYSICS_TOPICS.map((topic) => topic.id).sort());
  });

  it.each(KNOWLEDGE_BASE.map((entry) => [entry.topicId, entry] as const))(
    "%s follows the SKILLS §9 structure with every variable's unit explained",
    (_id, entry) => {
      expect(entry.introduction.length).toBeGreaterThan(30);
      expect(entry.objectives.length).toBeGreaterThan(0);
      expect(entry.explanation.length).toBeGreaterThan(100);
      expect(entry.formulas.length).toBeGreaterThan(0);
      entry.formulas.forEach((formula) => {
        expect(formula.meaning.length).toBeGreaterThan(5);
        formula.variables.forEach((variable) => {
          expect(variable.meaning.length).toBeGreaterThan(1);
          expect(variable.unit.length).toBeGreaterThan(0);
        });
      });
      expect(entry.definitions.length).toBeGreaterThan(0);
      expect(entry.examples.length).toBeGreaterThan(0);
      expect(entry.questions.length).toBeGreaterThanOrEqual(2);
      expect(entry.advanced.length).toBeGreaterThan(20);
    },
  );

  it("tags every catalog entry with known topics", () => {
    const ids = new Set(PHYSICS_TOPICS.map((topic) => topic.id));
    PHYSICS_WORLDS.flatMap((world) => world.entries).forEach((entry) => {
      expect(entry.topics.length).toBeGreaterThan(0);
      entry.topics.forEach((topic) => expect(ids, `${entry.id} → ${topic}`).toContain(topic));
    });
    expect(findCatalogEntry("circuit-builder")?.topics).toContain("ohms-law");
  });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<KnowledgeBasePage />} path="/knowledge" />
        <Route element={<KnowledgeEntryPage />} path="/knowledge/:topicId" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Knowledge Base pages", () => {
  it("lists topics by world and filters them by search", () => {
    renderAt("/knowledge");
    expect(screen.getByRole("link", { name: /Ohm's law/ })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search topics" }), { target: { value: "buoyancy" } });
    expect(screen.getByRole("link", { name: /Buoyancy/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Ohm's law/ })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search topics" }), { target: { value: "zzzz" } });
    expect(screen.getByText(/No topic matches/)).toBeTruthy();
  });

  it("shows formulas with a symbol table, self-test answers and links to activities", () => {
    renderAt("/knowledge/ohms-law");
    expect(screen.getByRole("heading", { level: 1, name: "Ohm's law" })).toBeTruthy();
    expect(screen.getByText("V = I R")).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: "R" })).toBeTruthy();
    expect(screen.getByText(/What current flows through 470 Ω/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Circuit Builder (game)" })).toBeTruthy();
  });

  it("shows not-found for an unknown topic", () => {
    renderAt("/knowledge/phlogiston");
    expect(screen.queryByText("Formulas")).toBeNull();
  });
});
