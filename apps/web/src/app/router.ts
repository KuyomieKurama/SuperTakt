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

/**
 * Entschlüsselt ein Wegstück — und wirft dabei nicht (H-5 aus R-3a).
 *
 * `decodeURIComponent("%")` ist ein `URIError`. Der Anker kommt aus der
 * Adresszeile und damit von außen: `href()` kann eine ungültige Kodierung nicht
 * erzeugen, ein Mensch mit einer Tastatur schon. Ohne dieses Netz fiel der
 * Fehler in den **Anfangszustand** von `useRoute` — und die Oberfläche entstand
 * dann gar nicht, statt eine unbekannte Adresse auf das Dashboard zu legen.
 *
 * Der Rückfall ist der Rohtext. Eine Kennung, die es nicht gibt, beantwortet
 * der Dienst mit `not_found`, und das ist ein Zustand, den jede Ansicht kennt —
 * ein weißer Bildschirm ist keiner.
 */
function decodeSegment(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

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
        : { name: "todo", id: decodeSegment(tail), query };
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
          id: parts[2] === undefined ? null : decodeSegment(parts[2]),
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

/* ==================================================================== */
/* Das erneute Ansteuern derselben Adresse                              */
/* ==================================================================== */

/**
 * Wer erfährt, daß dieselbe Adresse noch einmal angesteuert wurde.
 *
 * ---------------------------------------------------------------------------
 * Warum das nicht mehr allein an `popstate` hängt (Befund 6 aus R-1a)
 * ---------------------------------------------------------------------------
 *
 * T-097 hat gemessen, daß `location.assign` auf die **identische** Adresse in
 * Chromium ein `popstate` auslöst, und `useRoute` hat den Wiederbesuch daran
 * erkannt. Die Messung lief in Chromium — die Hülle fährt aber drei Webviews:
 * WebView2 (Windows, Chromium), **WebKitGTK** (Linux, und die heute
 * vorliegenden Erzeugnisse) und WKWebView (macOS). Ob bei einer Navigation auf
 * eine gleiche Adresse ein `popstate` entsteht, ist genau die Sorte Kante, an
 * der die Umsetzungen auseinandergehen. Ginge es dort schief, wäre die Wirkung
 * still: Der Klick auf den Navigationseintrag, auf dem man schon steht, täte
 * wieder nichts, und der End-zu-End-Lauf unter Chromium meldete weiter grün.
 *
 * Der Weg **aus dem Programm** hängt deshalb nicht mehr an einem Ereignis des
 * Browsers: {@link navigate} vergleicht das Ziel mit der angezeigten Adresse
 * und sagt bei Gleichheit selbst Bescheid — ohne zu navigieren, denn es gibt
 * nichts zu navigieren. `popstate` bleibt als **Ergänzung** in `useRoute` und
 * deckt weiter die Wege ab, die nicht durch `navigate` gehen: `page.goto()` im
 * End-zu-End-Test, ein Verweis im Dokument, „Zurück".
 *
 * Doppelt gezählt wird dabei nichts: Wo diese Funktion meldet, hat keine
 * Navigation stattgefunden, also feuert auch kein Ereignis.
 */
type RevisitListener = () => void;

const revisitListeners = new Set<RevisitListener>();

/** Meldet sich für das erneute Ansteuern an. Gibt die Abmeldung zurück. */
export function subscribeRevisit(listener: RevisitListener): () => void {
  revisitListeners.add(listener);
  return () => {
    revisitListeners.delete(listener);
  };
}

function notifyRevisit(): void {
  // Über eine Kopie: Ein Zuhörer, der sich während der Runde abmeldet, darf
  // die Runde nicht verkürzen.
  for (const listener of [...revisitListeners]) listener();
}

/**
 * Die angezeigte Adresse in der Schreibweise von {@link href}.
 *
 * Ein leerer Anker ist das Dashboard — dieselbe Route, die `href("dashboard")`
 * als `#/` schreibt. Ohne diese Angleichung wäre der erste Klick auf
 * „Übersicht" nach dem Start eine Navigation und kein Wiederbesuch.
 */
function shownHash(): string {
  return window.location.hash === "" ? "#/" : window.location.hash;
}

/**
 * Wechselt die Ansicht. Ein Eintrag im Verlauf, damit „Zurück“ wirkt.
 *
 * **Über `location.assign` und nicht über `location.hash =`** (T-097). Der
 * Verlauf verhält sich gleich — beide legen einen Eintrag an —, die Ereignisse
 * nicht: Steht die Zieladresse bereits in der Zeile, tut
 * `location.hash = <derselbe Wert>` **gar nichts**.
 *
 * Steht sie bereits da, wird hier auch nicht mehr navigiert (T-102): Dann ist
 * dies ein Wiederbesuch, und der wird gemeldet statt erzeugt. Siehe
 * {@link subscribeRevisit}.
 */
export function navigate(
  name: RouteName,
  id?: string,
  query?: Readonly<Record<string, string>>,
): void {
  const target = href(name, id, query);
  if (target === shownHash()) {
    notifyRevisit();
    return;
  }
  window.location.assign(target);
}

/**
 * Was ein Klick auf einen Verweis tun soll, der auf die **eigene** Adresse
 * zeigt.
 *
 * Die Navigation und die Bereichsreiter des Exports sind gewöhnliche
 * `<a href>` — mit gutem Grund: Sie tragen ihr Ziel im Markup, sind mit der
 * Tastatur erreichbar, und eine Vorlesehilfe kann sie aufzählen. Ein Klick auf
 * den Eintrag, auf dem man schon steht, ist aber keine Navigation, und was der
 * Browser daraus macht, ist von der Engine abhängig (siehe oben). Deshalb
 * dieser eine Griff: Zeigt der Verweis auf die angezeigte Adresse, übernimmt
 * der Router.
 *
 * Alles andere bleibt beim Browser — ein Ziel, das sich unterscheidet, ebenso
 * wie jeder Klick mit Zusatztaste oder mit einer anderen Maustaste. Wer mit
 * gedrückter Steuerungstaste klickt, will etwas anderes als einen
 * Wiederbesuch, und das hier nachzubauen hieße, den Browser zu spielen.
 */
export function handleRouteLinkClick(
  target: string,
  event: {
    readonly defaultPrevented: boolean;
    readonly button: number;
    readonly metaKey: boolean;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
    readonly altKey: boolean;
    readonly preventDefault: () => void;
  },
): void {
  if (event.defaultPrevented) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  if (target !== shownHash()) return;
  event.preventDefault();
  notifyRevisit();
}
