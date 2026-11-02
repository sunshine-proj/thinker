import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PwaStatus } from "../src/components/feedback/PwaStatus";
import { useOnlineStatus } from "../src/services/pwa/connectivity";
import * as registration from "../src/services/pwa/registerServiceWorker";
import { MemoryProgressRepository } from "../src/services/storage/progressRepository";
import {
  createSyncManager,
  type ProgressSyncAdapter,
} from "../src/services/sync/progressSync";

function setOnline(value: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

describe("connectivity", () => {
  it("tracks the browser's online state", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    setOnline(false);
    expect(result.current).toBe(false);
    setOnline(true);
    expect(result.current).toBe(true);
  });
});

describe("PwaStatus", () => {
  it("renders nothing while online with nothing to report", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    vi.spyOn(registration, "registerServiceWorker").mockResolvedValue(null);
    const { container } = render(<PwaStatus />);

    expect(container.textContent).toBe("");
  });

  it("tells the learner they are offline and that saved data still works", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.spyOn(registration, "registerServiceWorker").mockResolvedValue(null);
    render(<PwaStatus />);

    expect(screen.getByRole("status").textContent).toMatch(/offline.*still work.*sync/i);
  });

  it("announces offline readiness and offers to apply an update", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    const applyUpdate = vi.fn(async () => undefined);
    vi.spyOn(registration, "registerServiceWorker").mockImplementation(async (callbacks) => {
      callbacks.onOfflineReady();
      callbacks.onUpdateReady();
      return applyUpdate;
    });
    render(<PwaStatus />);

    expect(await screen.findByText(/ready to work offline/i)).toBeTruthy();
    fireEvent.click(await screen.findByRole("button", { name: "Reload to update" }));
    expect(applyUpdate).toHaveBeenCalledOnce();
  });

  it("offers installation when the browser provides an install prompt", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    vi.spyOn(registration, "registerServiceWorker").mockResolvedValue(null);
    render(<PwaStatus />);

    const prompt = vi.fn(async () => undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    fireEvent.click(await screen.findByRole("button", { name: "Install app" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("button", { name: "Install app" })).toBeNull());
  });
});

describe("service worker registration", () => {
  it("is skipped where service workers are unsupported", async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
    // jsdom does not implement service workers.
    expect("serviceWorker" in navigator).toBe(false);
    const result = await registration.registerServiceWorker({ onOfflineReady: vi.fn(), onUpdateReady: vi.fn() });

    expect(result).toBeNull();
    expect(original).toBeUndefined();
  });
});

describe("progress synchronisation", () => {
  const result = {
    gameId: "g", score: 1, difficulty: "Beginner" as const,
    completionStatus: "completed" as const, completedAt: "2026-11-02T10:00:00.000Z",
  };

  it("stays local-only when no account adapter is configured", async () => {
    const manager = createSyncManager(new MemoryProgressRepository(), null, () => true);

    expect(manager.getState()).toBe("local-only");
    expect(await manager.sync()).toBe("local-only");
  });

  it("pushes local data and reports idle", async () => {
    const repository = new MemoryProgressRepository();
    await repository.saveGameResult(result);
    const push = vi.fn(async () => undefined);
    const manager = createSyncManager(repository, { push }, () => true);

    expect(await manager.sync()).toBe("idle");
    expect(push).toHaveBeenCalledWith({ results: [result], experiments: [], achievements: [] });
  });

  it("does not sync while offline, then syncs when the connection returns", async () => {
    let online = false;
    const push = vi.fn(async () => undefined);
    const manager = createSyncManager(new MemoryProgressRepository(), { push }, () => online);
    const target = new EventTarget();
    const stop = manager.syncOnReconnect(target as unknown as Window);

    await manager.sync();
    expect(push).not.toHaveBeenCalled();

    online = true;
    target.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());

    stop();
    target.dispatchEvent(new Event("online"));
    await Promise.resolve();
    expect(push).toHaveBeenCalledOnce();
  });

  it("keeps local data and retries after a failure", async () => {
    const repository = new MemoryProgressRepository();
    await repository.saveGameResult(result);
    const push = vi.fn<ProgressSyncAdapter["push"]>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(undefined);
    const manager = createSyncManager(repository, { push }, () => true);
    const states: string[] = [];
    manager.subscribe((state) => states.push(state));

    expect(await manager.sync()).toBe("error");
    expect(await repository.listGameResults()).toHaveLength(1);
    expect(await manager.sync()).toBe("idle");
    expect(states).toEqual(["syncing", "error", "syncing", "idle"]);
  });

  it("shares one in-flight sync between concurrent callers", async () => {
    let release: () => void = () => undefined;
    const push = vi.fn(() => new Promise<void>((resolve) => { release = resolve; }));
    const manager = createSyncManager(new MemoryProgressRepository(), { push }, () => true);

    const first = manager.sync();
    const second = manager.sync();
    await vi.waitFor(() => expect(push).toHaveBeenCalledOnce());
    release();
    await Promise.all([first, second]);

    expect(push).toHaveBeenCalledOnce();
  });
});
