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
 *
 * ---------------------------------------------------------------------------
 * Zwei Abhängigkeitslisten, und der Unterschied ist sichtbar (Befund 7 aus R-1a)
 * ---------------------------------------------------------------------------
 *
 * Bis T-102 gab es eine Liste, und jede Ansicht hängte `version` aus
 * `RefreshContext` hinein — das Signal „irgendwo wurde geschrieben". Der Weg
 * über die Abhängigkeiten führt aber auf `run(false)`, und `run(false)`
 * **verwirft den vorhandenen Wert**: Die Liste fiel bei jedem `bump()` auf ihre
 * Platzhalterflächen zurück, bevor sie dieselben Daten wieder einsetzte. Mit
 * `visibilitychange` (T-097) wurde daraus ein alltäglicher Fall — jedes
 * Zurückwechseln ins Takt-Fenster ließ die Ansicht blinken —, und der
 * Kommentar in `useDataFreshness` schloß genau das aus („es blinkt nichts").
 *
 * Deshalb zwei Listen:
 *
 *  - `deps` — **die Frage ändert sich.** Anderer Filter, andere Kennung, andere
 *    Seitengröße. Was dasteht, beantwortet eine andere Frage und ist damit
 *    falsch; es verschwindet, und der Ladezustand tritt an seine Stelle.
 *  - `refreshDeps` — **dieselbe Frage, neue Antwort.** `version` und sonst
 *    nichts. Der Inhalt bleibt stehen, `refreshing` wird wahr, und die Ansicht
 *    zeigt ihren `RefreshHint`.
 *
 * Beim ersten Durchlauf lädt allein `deps`; `refreshDeps` merkt sich nur seinen
 * Anfangswert. Verglichen wird zusätzlich von Hand, weil React einen Effekt im
 * strengen Modus zweimal anlegt — ohne diesen Vergleich liefe im
 * Entwicklungsbetrieb je Aufbau eine zweite Runde Anfragen.
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

/** Gleich lang und Feld für Feld dasselbe? `Object.is` wie in React. */
function sameDeps(left: DependencyList, right: DependencyList): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => Object.is(value, right[index]));
}

export function useAsync<T>(
  load: () => Promise<T>,
  deps: DependencyList,
  /** Erneuern, ohne den Inhalt zu verwerfen. In der Regel `[version]`. */
  refreshDeps: DependencyList = [],
): AsyncResult<T> {
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

  const seenRefresh = useRef<DependencyList | null>(null);

  useEffect(() => {
    const previous = seenRefresh.current;
    seenRefresh.current = refreshDeps;
    // Erster Durchlauf: Die Daten sind gerade geholt worden.
    if (previous === null) return;
    // Derselbe Wert — der strenge Modus hat den Effekt neu angelegt.
    if (sameDeps(previous, refreshDeps)) return;
    run(true);
    // Wie oben: Die Abhaengigkeiten gibt der Aufrufer vor.
  }, refreshDeps);

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
