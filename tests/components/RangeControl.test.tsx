import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RangeControl, ToggleControl } from "../../src/components/common";

describe("RangeControl", () => {
  it("is labelled, shows its value and bounds, and reports numeric changes", () => {
    const onChange = vi.fn();
    render(
      <RangeControl
        displayValue="5 m/s"
        id="speed"
        label="Speed"
        maximum={10}
        minimum={0}
        onChange={onChange}
        step={1}
        value={5}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Speed" });
    expect(screen.getByText("5 m/s")).toBeTruthy();
    fireEvent.change(slider, { target: { value: "7" } });

    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("can be disabled", () => {
    render(
      <RangeControl
        disabled
        displayValue="1"
        id="x"
        label="X"
        maximum={2}
        minimum={0}
        onChange={() => undefined}
        step={1}
        value={1}
      />,
    );

    expect((screen.getByRole("slider") as HTMLInputElement).disabled).toBe(true);
  });
});

describe("ToggleControl", () => {
  it("reports the new checked state", () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        checked={false}
        description="Flip it"
        id="flip"
        label="Reverse"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Reverse/ }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
