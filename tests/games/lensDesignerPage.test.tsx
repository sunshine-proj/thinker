import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LensDesignerPage } from "../../src/features/games/lens-designer/LensDesignerPage";
import { useProgressStore } from "../../src/store/progressStore";
import { press, setPrediction, setSlider, startGame } from "../helpers/roundGame";

describe("Lens Designer page", () => {
  it("draws the bench and keeps controls off until the game starts", () => {
    render(<LensDesignerPage />);

    expect(screen.getByRole("heading", { name: "Lens Designer" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Optical bench.*focal length 10.0 centimeters/ })).toBeTruthy();
    expect((screen.getByRole("slider", { name: "Lens distance from the object" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Lens fixed: radius 10 cm/)).toBeTruthy();
  });

  it("updates the readings live as the lens moves", () => {
    render(<LensDesignerPage />);
    startGame();
    setSlider("Lens distance from the object", 12.7);

    expect(screen.getByText("IMAGE DISTANCE").nextElementSibling?.textContent).toBe("47.0 cm");
    expect(screen.getByText("MAGNIFICATION").nextElementSibling?.textContent).toBe("−3.70×");
    expect(screen.getByRole("img", { name: /Real, inverted image 47.0 centimeters behind the lens/ })).toBeTruthy();
  });

  it("explains a blurred image and a prediction is required", () => {
    render(<LensDesignerPage />);
    startGame();
    press("Lock in this design");
    expect(screen.getByRole("alert").textContent).toMatch(/prediction/i);

    setPrediction("20");
    press("Lock in this design");
    expect(screen.getByText(/blurred/)).toBeTruthy();
  });

  it("solves all three benches and saves the result", async () => {
    render(<LensDesignerPage />);
    startGame();

    setSlider("Lens distance from the object", 12.7);
    setPrediction("47.3");
    press("Lock in this design");
    expect(screen.getByText(/Image formed!/)).toBeTruthy();
    press("Next bench");

    setSlider("Surface radius of curvature", 15);
    setSlider("Lens distance from the object", 20);
    setPrediction("6");
    press("Lock in this design");
    expect(screen.getByText(/Image formed!/)).toBeTruthy();
    press("Next bench");

    expect(screen.getByText("BLUR ON SCREEN").nextElementSibling?.textContent).toBe("n/a");
    setSlider("Surface radius of curvature", 6.25);
    setSlider("Lens distance from the object", 5);
    setPrediction("5");
    press("Lock in this design");
    expect(screen.getByText(/Image formed!/)).toBeTruthy();
    expect(screen.getByText("Every round complete.")).toBeTruthy();

    await waitFor(() => {
      const saved = useProgressStore.getState().results.filter((r) => r.gameId === "lens-designer");
      expect(saved).toHaveLength(1);
      expect(saved[0]?.score).toBeGreaterThan(200);
    });
  });
});
