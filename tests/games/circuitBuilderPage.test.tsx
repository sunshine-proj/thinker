import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CircuitBuilderPage } from "../../src/features/games/circuit-builder/CircuitBuilderPage";
import { useProgressStore } from "../../src/store/progressStore";

function start() {
  fireEvent.click(screen.getByRole("button", { name: "Start game" }));
}
/** Adds the first resistor of that value that is still in the box. */
const add = (ohms: number) => {
  const button = screen
    .getAllByRole("button", { name: `Add ${ohms} ohm resistor` })
    .find((candidate) => !(candidate as HTMLButtonElement).disabled);
  fireEvent.click(button as HTMLElement);
};
const removeFirst = (ohms: number) =>
  fireEvent.click(
    screen.getAllByRole("button", { name: new RegExp(`Remove ${ohms} ohm resistor`) })[0] as HTMLElement,
  );
const predict = (milliamperes: string) =>
  fireEvent.change(screen.getByRole("spinbutton", { name: /current prediction/i }), {
    target: { value: milliamperes },
  });
const close = () => fireEvent.click(screen.getByRole("button", { name: "Close switch" }));

describe("Circuit Builder game", () => {
  it("keeps the resistor box disabled until the game starts", () => {
    render(<CircuitBuilderPage />);

    expect(screen.getByRole("heading", { name: "Circuit Builder" })).toBeTruthy();
    expect(
      (screen.getAllByRole("button", { name: /Add 100 ohm resistor/ })[0] as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText(/Open circuit/)).toBeTruthy();
  });

  it("builds a circuit, requires a prediction, and reports measurements", () => {
    render(<CircuitBuilderPage />);
    start();
    add(470);
    close();
    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);

    // A lone 470 Ω is safe at 9 V but far from the 300 Ω target.
    predict("19");
    close();

    expect(screen.getByText(/The circuit has 470 Ω but the target is 300 Ω/)).toBeTruthy();
    expect(screen.getByText("RESISTOR READINGS · RATING 0.25 W EACH")).toBeTruthy();
    expect(screen.getByText("19.1 mA", { selector: "strong" })).toBeTruthy();
  });

  it("prevents reusing a resistor and lets the learner remove it", () => {
    render(<CircuitBuilderPage />);
    start();
    add(200);

    expect((screen.getByRole("button", { name: "Add 200 ohm resistor" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Remove 200 ohm resistor from stage 1/ }));
    expect((screen.getByRole("button", { name: "Add 200 ohm resistor" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("builds series stages and completes all three circuits", async () => {
    render(<CircuitBuilderPage />);
    start();

    // Round 1: 100 Ω + 200 Ω in series → 30 mA.
    add(100);
    fireEvent.click(screen.getByRole("button", { name: "Add series stage" }));
    add(200);
    predict("30");
    close();
    expect(screen.getByText(/Circuit complete! 100 points/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next circuit" }));

    // Round 2: 100 Ω ∥ 300 Ω → 160 mA.
    add(100);
    add(300);
    predict("160");
    close();
    expect(screen.getByText(/Circuit complete! 100 points/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next circuit" }));

    // Round 3: naive 200 Ω ∥ 200 Ω overheats.
    add(200);
    add(200);
    predict("120");
    close();
    expect(screen.getByText(/Overheated!/)).toBeTruthy();
    expect(screen.getAllByText(/over rating/)).toHaveLength(2);

    // Share the load: (100 ∥ 100) + (100 ∥ 100).
    removeFirst(200);
    removeFirst(200);
    add(100);
    add(100);
    fireEvent.click(screen.getByRole("button", { name: "Add series stage" }));
    add(100);
    add(100);
    predict("120");
    close();

    expect(screen.getByText(/Circuit complete! 90 points/)).toBeTruthy(); // 60 + 20 + 10 (second closing of this round)
    expect(screen.getByText("Every circuit built.")).toBeTruthy();
    expect(screen.getByText(/You scored 290 points over 4 switch closings/)).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "circuit-builder");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBe(290);
    });
  });

  it("describes the schematic for assistive technology", () => {
    render(<CircuitBuilderPage />);
    start();
    add(100);
    add(470);

    const diagram = screen.getByRole("img", { name: /Circuit schematic/ });
    expect(diagram.getAttribute("aria-label")).toContain("Stage 1: 100 ohms, 470 ohms in parallel");
  });

  it("limits stages and removes empty stages", () => {
    render(<CircuitBuilderPage />);
    start();
    add(100);
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Add series stage" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Add series stage" }));
    expect(screen.getByRole("alert").textContent).toMatch(/at most 4 stages/);

    const stages = screen.getByRole("list", { name: "Series stages" });
    fireEvent.click(within(stages).getAllByRole("button", { name: /Remove empty stage/ })[0] as HTMLElement);
    expect(within(stages).getAllByRole("listitem")).toHaveLength(3);
  });

  it("can be resumed after leaving mid-round", async () => {
    const first = render(<CircuitBuilderPage />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    start();
    add(100);
    fireEvent.click(screen.getByRole("button", { name: "Add series stage" }));
    add(200);
    first.unmount();
    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("circuit-builder")).not.toBeNull();
    });

    render(<CircuitBuilderPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Resume saved game" }));

    expect(screen.getByRole("img", { name: /Stage 1: 100 ohms; Stage 2: 200 ohms/ })).toBeTruthy();
    expect(screen.getByText(/Game paused/)).toBeTruthy();
  });
});
