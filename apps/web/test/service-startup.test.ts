import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isShellAvailable, osUser, serviceHandshake, shellState } from "@takt/desktop/shell";
import { setConnection, TaktApiError, TaktTransportError, type Connection } from "../src/api/client";
import { checkHealth } from "../src/api/endpoints";
import { connect } from "../src/app/connection";
import { SERVICE_STARTUP_TIMEOUT_MS, waitForService } from "../src/app/serviceStartup";
import type { ShellStateSnapshot } from "../src/app/ShellStatus";

vi.mock("../src/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/api/client")>();
  return { ...actual, setConnection: vi.fn() };
});
vi.mock("../src/api/endpoints", () => ({ checkHealth: vi.fn() }));
vi.mock("@takt/desktop/shell", () => ({
  isShellAvailable: vi.fn(),
  serviceHandshake: vi.fn(),
  shellState: vi.fn(),
  osUser: vi.fn(),
}));

const connection: Connection = {
  baseUrl: "http://127.0.0.1:17843/api/v1",
  headerName: "X-Takt-Token",
  secret: "test-only-startup-secret-not-a-real-credential",
};
const healthy: ShellStateSnapshot = { directory: null, problems: [], serviceExit: null };
const stopped: ShellStateSnapshot = {
  ...healthy,
  serviceExit: { code: 74, message: "Der Dienst wurde beendet.", detail: "Port 17843 ist belegt." },
};
const handshake = vi.fn<() => Promise<Connection>>();
const readState = vi.fn<() => Promise<ShellStateSnapshot | null>>();
const health = vi.mocked(checkHealth);

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  handshake.mockResolvedValue(connection);
  readState.mockResolvedValue(healthy);
  health.mockResolvedValue({ status: "ok" });
  vi.mocked(isShellAvailable).mockReturnValue(true);
  vi.mocked(serviceHandshake).mockResolvedValue(connection);
  vi.mocked(shellState).mockResolvedValue(healthy);
  vi.mocked(osUser).mockResolvedValue({
    name: "startup-test", qualifiedName: null, source: "test", trusted: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("service startup readiness", () => {
  it("accepts an authenticated healthy service immediately and clears its timers", async () => {
    await expect(waitForService(handshake, readState)).resolves.toBe(healthy);
    expect(setConnection).toHaveBeenCalledExactlyOnceWith(connection);
    expect(health).toHaveBeenCalledTimes(1);
    expect(health.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits through connection refusal instead of exposing an unready dashboard", async () => {
    health.mockRejectedValueOnce(new TaktTransportError("not listening yet"))
      .mockRejectedValueOnce(new TaktTransportError("still starting"));
    let settled = false;
    const result = waitForService(handshake, readState).then((value) => {
      settled = true;
      return value;
    });
    await vi.advanceTimersByTimeAsync(399);
    expect(settled).toBe(false);
    expect(health).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe(healthy);
    expect(health).toHaveBeenCalledTimes(3);
    expect(handshake).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves the existing ShellStatus recovery dialog for an already terminated service", async () => {
    readState.mockResolvedValue(stopped);
    await expect(waitForService(handshake, readState)).resolves.toBe(stopped);
    expect(health).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("notices an exit during startup without waiting for the full timeout", async () => {
    readState.mockResolvedValueOnce(healthy).mockResolvedValue(stopped);
    health.mockRejectedValue(new TaktTransportError("not reachable"));
    const result = waitForService(handshake, readState);
    await vi.advanceTimersByTimeAsync(200);
    await expect(result).resolves.toBe(stopped);
    expect(health).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([401, 403, 429, 500])("does not retry an HTTP %s rejection", async (status) => {
    const error = new TaktApiError(status, { code: "startup_rejected", message: "Anfrage abgewiesen." });
    health.mockRejectedValue(error);
    await expect(waitForService(handshake, readState)).rejects.toBe(error);
    expect(health).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects a response that does not confirm readiness", async () => {
    // Deliberately model an invalid response crossing the untyped HTTP boundary.
    health.mockResolvedValueOnce({ status: "starting" } as unknown as { status: "ok" });
    await expect(waitForService(handshake, readState)).rejects.toThrow("Startbereitschaft nicht bestätigt");
    expect(health).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds repeated transport failures and includes the shell's startup findings", async () => {
    readState.mockResolvedValue({ ...healthy, problems: ["Die Dienstdatei wurde nicht gefunden."] });
    health.mockRejectedValue(new TaktTransportError("not reachable"));
    const result = waitForService(handshake, readState);
    const rejected = expect(result).rejects.toThrow("Die Dienstdatei wurde nicht gefunden.");
    await vi.advanceTimersByTimeAsync(SERVICE_STARTUP_TIMEOUT_MS);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out a hung native handshake and ignores its late result", async () => {
    let finish!: (value: Connection) => void;
    handshake.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const result = waitForService(handshake, readState);
    const rejected = expect(result).rejects.toThrow("30 Sekunden");
    await vi.advanceTimersByTimeAsync(SERVICE_STARTUP_TIMEOUT_MS);
    await rejected;
    finish(connection);
    await Promise.resolve();
    expect(setConnection).not.toHaveBeenCalled();
    expect(health).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds a hung shell-state query as well as HTTP requests", async () => {
    readState.mockImplementation(() => new Promise(() => {}));
    const result = waitForService(handshake, readState);
    const rejected = expect(result).rejects.toThrow("30 Sekunden");
    await vi.advanceTimersByTimeAsync(SERVICE_STARTUP_TIMEOUT_MS);
    await rejected;
    expect(health).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts a hung HTTP request and still terminates if its promise ignores cancellation", async () => {
    health.mockImplementation(() => new Promise(() => {}));
    const result = waitForService(handshake, readState);
    const rejected = expect(result).rejects.toThrow("30 Sekunden");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(health.mock.calls[0]?.[0]?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(SERVICE_STARTUP_TIMEOUT_MS - 1_000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retries an aborted health probe and can subsequently connect", async () => {
    health.mockImplementationOnce((signal) => new Promise((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("timed out", "AbortError")), { once: true });
    }));
    const result = waitForService(handshake, readState);
    await vi.advanceTimersByTimeAsync(1_200);
    await expect(result).resolves.toBe(healthy);
    expect(health).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("permits an explicit new attempt after timeout without a late attempt taking over", async () => {
    handshake.mockImplementationOnce(() => new Promise(() => {}));
    const first = waitForService(handshake, readState);
    const rejected = expect(first).rejects.toThrow("30 Sekunden");
    await vi.advanceTimersByTimeAsync(SERVICE_STARTUP_TIMEOUT_MS);
    await rejected;
    await expect(waitForService(handshake, readState)).resolves.toBe(healthy);
    expect(setConnection).toHaveBeenCalledExactlyOnceWith(connection);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("application connection integration", () => {
  it("does not report ready until the health check succeeds", async () => {
    health.mockRejectedValueOnce(new TaktTransportError("starting"));
    let settled = false;
    const result = connect().then((value) => { settled = true; return value; });
    await vi.advanceTimersByTimeAsync(199);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({ kind: "ready", shell: healthy, userName: "ok" });
    expect(health).toHaveBeenCalledTimes(2);
  });

  it("keeps a native Tauri string rejection instead of replacing its diagnosis", async () => {
    vi.mocked(serviceHandshake).mockRejectedValue("Der lokale Dienst wurde nicht gefunden.");
    await expect(connect()).resolves.toEqual({
      kind: "failed", message: "Der lokale Dienst wurde nicht gefunden.",
    });
    expect(health).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains ShellStatus's structured exit data and username finding", async () => {
    vi.mocked(shellState).mockResolvedValue(stopped);
    await expect(connect()).resolves.toEqual({ kind: "ready", shell: stopped, userName: "ok" });
    expect(health).not.toHaveBeenCalled();
  });

  it("does not probe or manufacture credentials without the shell or a development connection", async () => {
    vi.mocked(isShellAvailable).mockReturnValue(false);
    vi.stubEnv("VITE_TAKT_BASE_URL", "");
    vi.stubEnv("VITE_TAKT_TOKEN", "");
    await expect(connect()).resolves.toEqual({ kind: "no_shell" });
    expect(setConnection).not.toHaveBeenCalled();
    expect(health).not.toHaveBeenCalled();
  });

  it("also waits for readiness in the explicit development fallback", async () => {
    vi.stubEnv("DEV", true);
    vi.mocked(isShellAvailable).mockReturnValue(false);
    vi.stubEnv("VITE_TAKT_BASE_URL", connection.baseUrl);
    vi.stubEnv("VITE_TAKT_TOKEN", connection.secret);
    health.mockRejectedValueOnce(new TaktTransportError("starting"));
    const result = connect();
    await vi.advanceTimersByTimeAsync(200);
    await expect(result).resolves.toEqual({ kind: "ready", shell: null, userName: "unknown" });
    expect(health).toHaveBeenCalledTimes(2);
    expect(serviceHandshake).not.toHaveBeenCalled();
  });
});
