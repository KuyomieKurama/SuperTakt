import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { errorCode, errorMessage } from "../api/client";

/**
 * Takt — Laden, Warten, Scheitern.
 *
 * Drei Zustände, keiner davon optional. Abschnitt 15 verlangt Ladezustände und
 * Fehlermeldungen ausdrücklich; sie entstehen hier einmal und nicht in jeder
 * Ansicht neu.
 *
 * `refreshing` unterscheidet den ersten Aufbau vom Nachladen: Beim ersten Mal
 * gehören Platzhalterflächen hin, beim Nachladen bleibt der alte Inhalt stehen
 * und bekommt einen leisen Hinweis. Sonst springt die Liste bei jedem
 * Timerschlag.
 */
export type AsyncState<T> =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly value: T; readonly refreshing: boolean }
  | { readonly status: "error"; readonly message: string; readonly code: string | null };

export interface AsyncResult<T> {
  readonly state: AsyncState<T>;
  /** Lädt erneut, ohne den vorhandenen Inhalt zu verwerfen. */
  readonly reload: () => void;
  /** Ersetzt den Wert ohne Anfrage — für die Antwort einer Änderung. */
  readonly replace: (value: T) => void;
}

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const generation = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback((keepValue: boolean) => {
    const current = ++generation.current;
    setState((previous) =>
      keepValue && previous.status === "ready"
        ? { status: "ready", value: previous.value, refreshing: true }
        : { status: "loading" },
    );

    void loadRef.current().then(
      (value) => {
        if (generation.current !== current) return;
        setState({ status: "ready", value, refreshing: false });
      },
      (cause: unknown) => {
        if (generation.current !== current) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setState({ status: "error", message: errorMessage(cause), code: errorCode(cause) });
      },
    );
  }, []);

  useEffect(() => {
    run(false);
    return () => {
      generation.current += 1;
    };
    // Die Abhaengigkeiten gibt der Aufrufer vor: Er weiss, wovon seine
    // Abfrage abhaengt, dieser Baustein nicht.
  }, deps);

  const reload = useCallback(() => run(true), [run]);

  const replace = useCallback((value: T) => {
    generation.current += 1;
    setState({ status: "ready", value, refreshing: false });
  }, []);

  return { state, reload, replace };
}

/**
 * Ein Vorgang, der auf Knopfdruck läuft: anlegen, ändern, löschen.
 *
 * Trennt „läuft gerade“ von „ist schiefgegangen“, damit ein Knopf sperren und
 * zugleich eine Fehlermeldung stehen lassen kann.
 */
export interface MutationResult {
  readonly busy: boolean;
  readonly error: string | null;
  readonly run: (task: () => Promise<void>) => Promise<boolean>;
  readonly clearError: () => void;
}

export function useMutation(): MutationResult {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { busy, error, run, clearError };
}
