/**
 * Takt — Adressen der Ansichten.
 *
 * **Die Musterseite hat hier keine Adresse mehr (T-057).** Sie war bis dahin
 * `#/designsystem` und damit ein Ziel der Anwendung wie jedes andere. Sie ist
 * kein Ziel der Anwendung: Sie zeigt Bausteine, keine Daten. Ihr Ort ist seit
 * T-057 ein eigener Einstiegspunkt (`apps/web/designsystem.html`), der im
 * Entwicklungsbetrieb erreichbar ist und im ausgelieferten Buendel gar nicht
 * erst entsteht. `#/designsystem` faellt hier auf das Dashboard zurueck, wie
 * jede andere unbekannte Adresse.
 *
 * Eine Route über den Anker der Adresse, ohne Fremdbibliothek. Grund: Die
 * Anwendung wird als Datei aus der Tauri-Hülle geladen (`tauri://localhost`);
 * ein Verlauf über Pfade bräuchte einen Server, der Pfade auf `index.html`
 * abbildet, und den gibt es dort nicht.
 *
 * Jede Ansicht hat eine eigene Adresse. Das ist keine Kür: Ohne sie gibt es
 * kein Zurück, kein Neuladen an Ort und Stelle und keinen Verweis auf ein
 * bestimmtes Todo.
 */

export type RouteName =
  | "dashboard"
  | "todos"
  | "todo"
  | "board"
  | "time"
  | "bookings"
  | "export"
  /** S-14 — die Vorlagen sind der zweite Bereich des Exports, nicht der Einstellungen. */
  | "templates"
  /**
   * S-07, Bereich „Protokoll" — der Verlauf der Exportstatuswechsel (R-10).
   *
   * Eine eigene Adresse, weil das Protokoll eine eigene Frage beantwortet:
   * nicht „was exportiere ich als Nächstes", sondern „was ist mit dieser Zeit
   * schon geschehen". Es gehört zum Export und nicht neben ihn.
   */
  | "exportAudit"
  | "tags"
  | "settings";

export interface Route {
  readonly name: RouteName;
  /** Kennung des angezeigten Datensatzes, wenn die Route eine trägt. */
  readonly id: string | null;
  /** Zusatz aus der Abfragezeichenkette, etwa der Suchbegriff. */
  readonly query: Readonly<Record<string, string>>;
}

const DEFAULT_ROUTE: Route = { name: "dashboard", id: null, query: {} };

/** Adresse einer Route. Immer über diese Funktion, nie von Hand gebaut. */
export function href(name: RouteName, id?: string, query?: Readonly<Record<string, string>>): string {
  const segments: string[] = [SEGMENT[name]];
  if (id !== undefined && id.length > 0) segments.push(encodeURIComponent(id));
  const search = new URLSearchParams(query ?? {}).toString();
  return `#/${segments.filter((part) => part.length > 0).join("/")}${search.length === 0 ? "" : `?${search}`}`;
}

const SEGMENT: Readonly<Record<RouteName, string>> = {
  dashboard: "",
  todos: "todos",
  todo: "todos",
  board: "kanban",
  time: "zeiterfassung",
  bookings: "buchungen",
  export: "export",
  // Zwei Segmente, weil S-14 zum Export gehört und nicht neben ihn: Die
  // Adresse sagt dasselbe wie die Navigation.
  templates: "export/vorlagen",
  exportAudit: "export/protokoll",
  tags: "tags",
  settings: "einstellungen",
};

/** Liest die Route aus einem Anker wie `#/todos/abc?x=1`. */
export function parseRoute(hash: string): Route {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [pathPart = "", searchPart = ""] = withoutHash.split("?", 2);
  const query: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(searchPart)) query[key] = value;

  const parts = pathPart.split("/").filter((part) => part.length > 0);
  const head = parts[0];
  if (head === undefined) return { ...DEFAULT_ROUTE, query };

  const tail = parts[1];
  switch (head) {
    case "todos":
      return tail === undefined
        ? { name: "todos", id: null, query }
        : { name: "todo", id: decodeURIComponent(tail), query };
    case "kanban":
      return { name: "board", id: null, query };
    case "zeiterfassung":
      return { name: "time", id: null, query };
    case "buchungen":
      return { name: "bookings", id: null, query };
    case "export":
      // `#/export` ist S-07, `#/export/vorlagen[/id]` ist S-14,
      // `#/export/protokoll` ist das Exportprotokoll (R-10).
      if (tail === "vorlagen") {
        return {
          name: "templates",
          id: parts[2] === undefined ? null : decodeURIComponent(parts[2]),
          query,
        };
      }
      return tail === "protokoll"
        ? { name: "exportAudit", id: null, query }
        : { name: "export", id: null, query };
    case "tags":
      return { name: "tags", id: null, query };
    case "einstellungen":
      return { name: "settings", id: null, query };
    default:
      return { ...DEFAULT_ROUTE, query };
  }
}

/** Wechselt die Ansicht. Ein Eintrag im Verlauf, damit „Zurück“ wirkt. */
export function navigate(
  name: RouteName,
  id?: string,
  query?: Readonly<Record<string, string>>,
): void {
  window.location.hash = href(name, id, query);
}
