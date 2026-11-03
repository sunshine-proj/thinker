import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "../src/components/layout/AppShell";
import { HomePage } from "../src/features/home/HomePage";
import { SectionPage } from "../src/app/SectionPage";

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route
            path="worlds"
            element={
              <SectionPage
                title="Physics Worlds"
                eyebrow="Choose a direction"
                description="Explore physics."
                icon="worlds"
              />
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("application shell", () => {
  it("renders the home page and primary navigation", () => {
    renderApp();

    expect(
      screen.getByRole("heading", {
        name: "Physics is not just something to learn.It’s something to explore.",
      }),
    ).toBeTruthy();
    expect(screen.getAllByRole("navigation", { name: "Primary navigation" })).toHaveLength(1);
    expect(screen.getAllByRole("navigation", { name: "Quick navigation" })).toHaveLength(1);
  });

  it("navigates to a section and marks its navigation item current", () => {
    renderApp();

    const navigation = screen.getAllByRole("navigation", {
      name: "Primary navigation",
    })[0];
    if (!navigation) {
      throw new Error("Primary navigation was not rendered.");
    }

    fireEvent.click(within(navigation).getByRole("link", { name: "Physics Worlds" }));

    expect(
      screen.getByRole("heading", { name: "Physics Worlds" }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole("link", { name: "Physics Worlds" }).some(
        (link) => link.getAttribute("aria-current") === "page",
      ),
    ).toBe(true);
  });
});
