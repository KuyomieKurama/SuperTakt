import { setConnection, TaktApiError, TaktTransportError, type Connection } from "../api/client";
import { checkHealth } from "../api/endpoints";
import type { ShellStateSnapshot } from "./ShellStatus";

export const SERVICE_STARTUP_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 1_000;
const RETRY_DELAY_MS = 200;

/** Process creation is not readiness: wait for the authenticated API before mounting data readers. */
export async function waitForService(
  handshake: () => Promise<Connection>,
  readShellState: () => Promise<ShellStateSnapshot | null>,
): Promise<ShellStateSnapshot | null> {
  const timeoutError = new Error(
    "Der lokale Dienst ist nach 30 Sekunden noch nicht bereit. Bitte versuchen Sie es erneut. " +
      "Bleibt die Meldung bestehen, beenden Sie SuperTakt vollständig und starten Sie es neu.",
  );
  let snapshot: ShellStateSnapshot | null = null;
  let pendingRequest: AbortController | null = null;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    deadlineTimer = setTimeout(() => {
      reject(timeoutError);
      pendingRequest?.abort();
    }, SERVICE_STARTUP_TIMEOUT_MS);
  });

  try {
    // Race each operation, not the whole worker: a late IPC reply must not resume startup after timeout.
    const connection = await Promise.race([handshake(), deadline]);
    setConnection(connection);

    for (;;) {
      snapshot = await Promise.race([readShellState(), deadline]);
      const exit = snapshot?.serviceExit;
      if (exit !== undefined && exit !== null) {
        // Preserve ShellStatus's existing blocking recovery dialog, including its quit action.
        return snapshot;
      }

      const controller = new AbortController();
      pendingRequest = controller;
      const healthTimer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      try {
        const health = await Promise.race([checkHealth(controller.signal), deadline]);
        if (health?.status !== "ok") {
          throw new Error("Der lokale Dienst hat seine Startbereitschaft nicht bestätigt.");
        }
        return snapshot;
      } catch (cause) {
        // Only retry read-only health probes, never authentication failures or application writes.
        if (cause === timeoutError || cause instanceof TaktApiError) throw cause;
        if (!(cause instanceof TaktTransportError) && !controller.signal.aborted) throw cause;
      } finally {
        clearTimeout(healthTimer);
        controller.abort();
        pendingRequest = null;
      }

      await Promise.race([
        new Promise<void>((resolve) => { retryTimer = setTimeout(resolve, RETRY_DELAY_MS); }),
        deadline,
      ]);
    }
  } catch (cause) {
    if (cause === timeoutError && snapshot !== null && snapshot.problems.length > 0) {
      throw new Error(`${timeoutError.message}\nHinweise beim Start: ${snapshot.problems.join(" ")}`);
    }
    throw cause;
  } finally {
    clearTimeout(deadlineTimer);
    clearTimeout(retryTimer);
    pendingRequest?.abort();
  }
}
