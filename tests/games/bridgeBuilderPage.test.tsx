import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BridgeBuilderPage } from "../../src/features/games/bridge-builder/BridgeBuilderPage";
import { useProgressStore } from "../../src/store/progressStore";
import { chooseOption, press, setPrediction, setSlider, settle, startGame } from "../helpers/roundGame";

describe("Bridge Builder page", () => {
  it("keeps controls disabled until the game starts and requires a prediction", () => {
    render(<BridgeBuilderPage />);

    expect(screen.getByRole("heading", { name: "Bridge Builder" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "Load the bridge" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Material") as HTMLSelectElement).disabled).toBe(true);

    startGame();
    press("Load the bridge");
    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);
  });

  it("explains an overstressed beam and shows the moment diagram", () => {
    render(<BridgeBuilderPage />);
    startGame();
    setPrediction("30");
    press("Load the bridge");

    expect(screen.getByText(/overstressed/)).toBeTruthy();
    expect(screen.getByRole("img", { name: /Bending moment diagram/ })).toBeTruthy();
    expect(screen.getByText("MAX BENDING MOMENT").nextElementSibling?.textContent).toMatch(/kN·m/);
  });

  it("completes all three bridges with working designs and saves the result", async () => {
    render(<BridgeBuilderPage />);
    startGame();

    const designs: [string, number, string][] = [
      ["steel", 8.5, "30"],
      ["steel", 9.0, "47"],
      ["steel", 19, "190"],
    ];
    for (const [index, [material, depthCm, prediction]] of designs.entries()) {
      chooseOption("Material", material);
      setSlider("Beam depth", depthCm);
      setPrediction(prediction);
      press("Load the bridge");
      expect(screen.getByText(/Bridge holds!/)).toBeTruthy();
      if (index < designs.length - 1) {
        press("Next bridge");
      }
    }

    expect(screen.getByText("Every round complete.")).toBeTruthy();
    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "bridge-builder");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.difficulty).toBe("Advanced");
      expect(saved[0]?.score).toBeGreaterThan(150);
    });
  });

  it("reports an over-budget beam", () => {
    render(<BridgeBuilderPage />);
    startGame();
    chooseOption("Material", "steel");
    setSlider("Beam depth", 12);
    setPrediction("30");
    press("Load the bridge");

    expect(screen.getByText(/over the 1700 budget/)).toBeTruthy();
  });

  it("can be resumed with the chosen material and depth", async () => {
    const first = render(<BridgeBuilderPage />);
    await settle();
    startGame();
    chooseOption("Material", "aluminium");
    setSlider("Beam depth", 9);
    first.unmount();
    await waitFor(async () => {
      expect(await useProgressStore.getState().loadSession("bridge-builder")).not.toBeNull();
    });

    render(<BridgeBuilderPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Resume saved game" }));

    expect((screen.getByLabelText("Material") as HTMLSelectElement).value).toBe("aluminium");
    expect((screen.getByRole("slider", { name: "Beam depth" }) as HTMLInputElement).value).toBe("9");
  });
});
