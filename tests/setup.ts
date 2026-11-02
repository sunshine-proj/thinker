import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { useProgressStore } from "../src/store/progressStore";

afterEach(async () => {
  cleanup();
  // Pages flush resumable state on unmount; keep tests independent.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await useProgressStore.getState().clearProgress();
});
