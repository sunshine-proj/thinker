import { act, fireEvent, screen } from "@testing-library/react";

/** Lets a game page finish checking for a saved game before the learner interacts. */
export async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

export const startGame = () => fireEvent.click(screen.getByRole("button", { name: "Start game" }));

export function setPrediction(value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: /prediction/i }), {
    target: { value },
  });
}

export const press = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

export function setSlider(name: string | RegExp, value: number | string) {
  fireEvent.change(screen.getByRole("slider", { name }), { target: { value: String(value) } });
}

export function chooseOption(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}
