import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { listTimeEntries } from "../features/bookings/api";
import {
  listTodos,
} from "../features/todos/api";
import {
  ShellStatus,
  type ShellStateSnapshot,
  type UserNameFinding,
} from "./ShellStatus";
import { Button, Card, EmptyState, InlineMessage, Spinner } from "../shared/ui/Primitives";
import { ScreenBody } from "../shared/ui/ScreenBody";
import { DashboardScreen } from "./DashboardScreen";
import { connect, quitApplication, readShellState, type ConnectionState } from "./connection";
import { GlobalSearch } from "./GlobalSearch";
import { Navigation } from "./Navigation";
import { PreferencesProvider } from "../features/settings/PreferencesContext";
import { RefreshProvider, useRefresh } from "./RefreshContext";
import { href, type Route } from "./router";
import { StructureProvider } from "./StructureContext";
import { TimerBar } from "../features/timer/TimerBar";
import { TimerProvider } from "../features/timer/TimerContext";
import { ToastProvider } from "./ToastContext";
import { UpdateNotice } from "../features/settings/UpdateNotice";
import { useUpdateNotice } from "../features/settings/useUpdateNotice";
import { useAsync } from "./useAsync";
import { useDataFreshness } from "./useDataFreshness";
import { useRoute } from "./useRoute";
import { ServiceText } from "../shared/ui/ServiceText";
import { appTexts } from "./texts";
import { useLanguage } from "../lib/language";

const BoardScreen = lazy(() => import("../features/board/BoardScreen").then(module => ({ default: module.BoardScreen })));
const ExportAuditScreen = lazy(() => import("../features/export/ExportAuditScreen").then(module => ({ default: module.ExportAuditScreen })));
const ExportScreen = lazy(() => import("../features/export/ExportScreen").then(module => ({ default: module.ExportScreen })));
const SettingsScreen = lazy(() => import("../features/settings/SettingsScreen").then(module => ({ default: module.SettingsScreen })));
const TemplatesScreen = lazy(() => import("../features/export/TemplatesScreen").then(module => ({ default: module.TemplatesScreen })));
const TimeScreen = lazy(() => import("../features/timer/TimeScreen").then(module => ({ default: module.TimeScreen })));
const TodoDetailScreen = lazy(() => import("../features/todos/TodoDetailScreen").then(module => ({ default: module.TodoDetailScreen })));
const TodoListScreen = lazy(() => import("../features/todos/TodoListScreen").then(module => ({ default: module.TodoListScreen })));

/**
 * Takt — die Anwendung.
 *
 * Die Reihenfolge in dieser Datei ist die Lesereihenfolge im Dokument, und das
 * ist Absicht:
 *
 *   1. Sprungmarke zum Inhalt (SC 2.4.1)
 *   2. **`ShellStatus`** — was die Hülle beim Start gemeldet hat
 *   3. Seitenleiste: Marke und Navigation
 *   4. Kopfleiste: Suche links, Timer rechts
 *   5. Inhalt
 *
 * `ShellStatus` steht **ganz oben**, vor Navigation und Inhalt, damit ein
 * Bildschirmleser die Meldung zuerst trifft (T-020, Nächster Schritt 2). Wer
 * erfährt, dass der lokale Dienst weg ist, erfährt es, bevor er weiterklickt.
 *
 * ## Die äußere Struktur steht fest (T-057, Punkt 1)
 *
 * Seitenleiste, Kopf und Inhalt liegen in **einem** Raster (`.app`), das genau
 * so hoch ist wie das Fenster. Der einzige Kasten, der scrollt, ist der Inhalt.
 * Die Begründung im Einzelnen — mit den gemessenen Zahlen — steht bei `.app` in
 * `styles/app.css`; sie gehört zum Layout und nicht hierher. Für diese Datei
 * gilt nur: Die drei Bereiche sind Geschwister im selben Raster und liegen
 * nicht mehr ineinander (früher `.app__body` um Seitenleiste und Inhalt). Ein
 * Bereich, der einen anderen umschließt, kann ihn verschieben.
 *
 * ## Die Musterseite ist hier nicht mehr (T-057, Punkt 3)
 *
 * Bis T-057 stand am Anfang dieser Funktion ein Zweig, der bei der Route
 * `designsystem` die Musterseite anstelle der Anwendung zeigte. Die Route gibt
 * es nicht mehr, den Zweig auch nicht. Die Musterseite hat einen eigenen
 * Einstiegspunkt (`src/designsystem.tsx`); die Begründung steht dort.
 *
 * ## Der Farbmodus steht nicht mehr im Kopf (T-065)
 *
 * Bis T-065 saß rechts oben ein zweites Auswahlfeld für hell/dunkel/System.
 * Es war seit T-057 kein zweiter *Zustand* mehr — beide Wege schrieben in
 * dieselbe Einstellung —, aber es blieb ein zweiter *Bedienweg* für eine
 * Sache, die man einmal im Leben einstellt. Er ist entfallen; die Einstellung
 * selbst steht unverändert unter „Einstellungen → Darstellung" und liegt
 * weiter in `app_setting.theme` (E-041).
 *
 * Was hier bleiben **muss**: `PreferencesProvider`. Er war nie das Zubehör
 * des entfernten Feldes, sondern die Stelle, an der die gespeicherte Wahl
 * beim Start an das Wurzelelement geschrieben wird. Ohne ihn stünde die
 * Anwendung nach jedem Start wieder auf Systemvorgabe, gleichgültig was in
 * den Einstellungen steht.
 */

export function App() {
  useEffect(() => { performance.mark("supertakt:first-render"); }, []);
  const { route, revisit } = useRoute();
  // Subscribing here re-renders the whole tree when the UI language changes (A-28.2).
  useLanguage();
  return <ConnectedApp route={route} revisit={revisit} />;
}

/* Verbindung                                                           */

function ConnectedApp({
  route,
  revisit,
}: {
  readonly route: Route;
  /** Siehe `useRoute`: erneutes Ansteuern derselben Adresse (T-097). */
  readonly revisit: number;
}) {
  const [state, setState] = useState<ConnectionState>({ kind: "connecting" });
  const [shell, setShell] = useState<ShellStateSnapshot | null>(null);
  /*
    Der Befund zum Windows-Benutzernamen (O-AJ). Er wird **einmal** beim
    Verbinden geholt und danach nicht mehr: Der Anmeldename dieses Rechners
    ändert sich während eines Laufs nicht, und die Antwort ist ein
    Wahrheitswert und kein Wert, der veralten könnte. Aus demselben Grund steht
    hier der Befund und nicht der Name — siehe `readUserNameFinding`.
  */
  const [userName, setUserName] = useState<UserNameFinding>("unknown");

  /*
    Der `catch` ist kein Zierat (B-6-Klasse aus T-116): `connect()` fängt heute
    alles ab, was es kennt, aber `setState({ kind: "connecting" })` steht bereits
    da. Käme aus der Hülle je eine Zusage zurück, die niemand fängt, bliebe die
    Anwendung für immer im Ladebild „Takt verbindet sich …" stehen — ohne
    Meldung, ohne „Erneut versuchen", und einen globalen Auffänger für
    abgewiesene Zusagen gibt es im Baum nicht. Der Sperrzustand `"failed"` hat
    beides; er ist der richtige Ausgang für einen Fehler, den niemand vorhergesehen
    hat.
  */
  const attempt = useCallback(() => {
    setState({ kind: "connecting" });
    void connect()
      .then((next) => {
        setState(next);
        if (next.kind === "ready") {
          setShell(next.shell);
          setUserName(next.userName);
        }
      })
      .catch((cause: unknown) => {
        setState({ kind: "failed", message: cause instanceof Error ? cause.message : null });
      });
  }, []);

  useEffect(attempt, [attempt]);

  /**
   * Die Hülle meldet das Ende des Dienstes über ein Ereignis; das Abonnement
   * dafür bräuchte `@tauri-apps/api/event` in `apps/web`, und das ist keine
   * Abhängigkeit dieses Pakets. Bis das entschieden ist, wird nachgefragt —
   * selten genug, dass es nichts kostet, und oft genug, dass die Sperrmeldung
   * nicht erst beim nächsten Klick erscheint.
   */
  useEffect(() => {
    if (state.kind !== "ready") return;
    const handle = window.setInterval(() => {
      void readShellState().then((next) => {
        if (next !== null) setShell(next);
      });
    }, 20_000);
    return () => window.clearInterval(handle);
  }, [state.kind]);

  const texts = appTexts();

  if (state.kind === "connecting") {
    return (
      <div className="boot">
        <Spinner size={22} label={texts.connecting} />
        <p className="boot__text">{texts.connectingText}</p>
      </div>
    );
  }

  if (state.kind === "no_shell") {
    return <NoShellNotice />;
  }

  if (state.kind === "failed") {
    return (
      <div className="boot">
        <Card title={texts.connectFailedTitle}>
          {/* The title names the cause the body explains; they no longer contradict (A-28.5). */}
          <InlineMessage tone="danger" title={state.notReady === true ? texts.serviceNotReady : texts.connectionFailed}>
            {state.message === null ? texts.connectFailedFallback : <ServiceText text={state.message} />}
          </InlineMessage>
          <p className="boot__text">{texts.noDataWithoutService}</p>
          <div className="boot__actions">
            <Button variant="primary" iconStart="rotate-ccw" onClick={attempt}>
              {texts.retry}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ToastProvider>
      <RefreshProvider>
        <StructureProvider>
          {/*
            `PreferencesProvider` braucht die Einstellungen (`StructureProvider`)
            und die Rückmeldungen (`ToastProvider`) und steht deshalb innerhalb
            von beiden — und außerhalb von `Workspace`, weil er den gespeicherten
            Farbmodus an das Wurzelelement schreibt, sobald die Einstellungen da
            sind. Das gilt für jede Ansicht, nicht nur für die Einstellungen.
          */}
          <PreferencesProvider>
            <TimerProvider>
              <Workspace
                route={route}
                revisit={revisit}
                shell={shell}
                userName={userName}
              />
            </TimerProvider>
          </PreferencesProvider>
        </StructureProvider>
      </RefreshProvider>
    </ToastProvider>
  );
}

function NoShellNotice() {
  const texts = appTexts();
  return (
    <div className="boot">
      <Card title={texts.noShellTitle}>
        <p className="boot__text">{texts.noShellWhat}</p>
        <p className="boot__text">{texts.noShellWhy}</p>
        {/*
          Hier stand bis T-057 ein Knopf „Designsystem ansehen". Er war der
          letzte Weg aus der Anwendung in die Musterseite, und der Auftraggeber
          hat verlangt, dass es keinen gibt. Es steht bewusst kein Ersatz da:
          Ohne Hülle gibt es nichts zu tun, und ein Knopf, der nichts bewirkt,
          wäre schlechter als keiner.
        */}
      </Card>
    </div>
  );
}

/* Arbeitsfläche                                                        */

function Workspace({
  route,
  revisit,
  shell,
  userName,
}: {
  readonly route: Route;
  readonly revisit: number;
  readonly shell: ShellStateSnapshot | null;
  /** Der Befund zum Windows-Benutzernamen, kein Name (O-AJ). */
  readonly userName: UserNameFinding;
}) {
  const { version, bump } = useRefresh();
  const updates = useUpdateNotice();

  // Texts formatted while loading (dates, sentences) would stay in the old language; reload them.
  const language = useLanguage();
  const shownLanguage = useRef(language);
  useEffect(() => {
    if (shownLanguage.current === language) return;
    shownLanguage.current = language;
    bump();
  }, [language, bump]);

  /*
    Hier und nur hier (T-097): Die Arbeitsfläche steht innerhalb beider
    Zusammenhänge, die dabei erneuert werden — der Struktur und dem
    Änderungssignal —, und sie überlebt jeden Ansichtswechsel. In einer Ansicht
    stünde derselbe Haken einmal je Ansicht und liefe beim Wechsel neu an.
  */
  useDataFreshness(revisit);

  const counters = useAsync(async () => {
    const [todos, entries] = await Promise.all([
      listTodos({ onlyOpen: true }, { limit: 1 }),
      listTimeEntries({ exportStatus: "open" }, { limit: 1 }),
    ]);
    return { openTodos: todos.total, openEntries: entries.total };
    // Zählt neu, sobald irgendwo etwas geschrieben wurde.
  }, [], [version]);

  const openTodoCount = counters.state.status === "ready" ? counters.state.value.openTodos : null;
  const openEntryCount = counters.state.status === "ready" ? counters.state.value.openEntries : null;

  const texts = appTexts();
  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        {texts.skipToContent}
      </a>

      {shell === null ? null : (
        <ShellStatus state={shell} userName={userName} onQuit={quitApplication} />
      )}

      {/*
        Der Hinweis auf eine neuere Fassung (Abschnitt 18). Er steht hier, weil
        er zur Anwendung gehört und nicht zu einer Ansicht: Ein Dialog, den nur
        das Dashboard zeigte, erschiene nicht, wenn Takt auf dem Board startet.

        **Nicht, solange die Sperrmeldung steht.** Ist der lokale Dienst weg,
        speichert Takt nichts mehr; ein Dialog über der Sperrmeldung nähme
        genau die Meldung den Blick, die den Benutzer zum Neustart bringt — und
        „Überspringen" könnte in diesem Zustand ohnehin nichts ablegen.
      */}
      {shell?.serviceExit == null ? <UpdateNotice api={updates} /> : null}

      {/*
        Seitenleiste, Kopf und Inhalt sind Geschwister im Raster von `.app` und
        liegen nicht mehr ineinander. Die Marke steht seit T-057 oben in der
        Seitenleiste: Die Seitenleiste reicht über die volle Höhe, der Kopf
        beginnt rechts von ihr — die Struktur, die der Auftraggeber gezeichnet
        hat.
      */}
      <aside className="app__sidebar">
        <a className="brand" href={href("dashboard")}>
          <img className="brand__mark" src="/favicon-192.png" alt="" />
          <span className="brand__name">SuperTakt</span>
        </a>

        <Navigation
          installedVersion={updates.installedVersion}
          availableVersion={updates.availableVersion}
          onOpenUpdate={updates.install}
          active={route.name}
          openTodoCount={openTodoCount}
          openEntryCount={openEntryCount}
        />
      </aside>

      {/*
        Zwei Dinge, zwei Ecken: Die Suche beginnt links neben der Seitenleiste,
        der Timer endet rechts am Fensterrand.

        Der Timer steht in einem eigenen Fach (`.app__header-timer`) und nicht
        einfach als nächstes Element hinter der Suche. Das Fach hat eine feste
        Breite, und zwar aus demselben Grund, aus dem der Kopf eine feste Höhe
        hat (siehe `--app-header-height` in `styles/app.css`): Sonst
        verschiebt der Start eines Timers alles neben ihm. Die Begründung im
        Einzelnen — mit den gemessenen Breiten — steht bei `.app__header-timer`.

        Bis T-065 stand rechts noch ein Auswahlfeld für den Farbmodus. Es ist
        entfallen; der Platz, der dabei frei wurde, ist in dieses Fach
        geflossen und nicht gleichmäßig verteilt worden.
      */}
      <header className="app__header">
        <GlobalSearch />

        <div className="app__header-timer">
          <TimerBar />
        </div>
      </header>

      {/*
        Der **Rahmen** der Arbeitsfläche, seit T-326 nicht mehr der Läufer.

        `id="inhalt"` und `tabIndex={-1}` standen bis dahin hier. Sie sind an
        den Laufbereich gewandert (`shared/ui/ScreenBody.tsx`): Läuft das Kind
        und bliebe die Marke am Rahmen, hätte der Benutzer nach „Zum Inhalt
        springen" den Fokus auf einem Kasten, der nichts zu rollen hat — Bild-ab
        täte nichts (SC 2.1.1, T-323 Abschnitt 8.5). `<main>` bleibt als
        Landmarke stehen; die Sprungmarke landet darin statt darauf.

        Der Ladeersatz bekommt `.boot--inline`: `.boot` trägt
        `min-height: 100dvh` — richtig für die freistehenden Startbilder, die
        nicht in dieser Hülle hängen, falsch für ein gestrecktes Rasterkind
        eines Rahmens, der etwa 76% der Fensterhöhe hat. Der Ladekreis stünde
        sonst in der Mitte eines zu hohen Kastens, also unterhalb der sichtbaren
        Fläche (T-323 Abschnitt 8.6).
      */}
      <main className="app__main">
        <ScreenLoadBoundary key={route.name}>
          <Suspense fallback={<div className="boot boot--inline" role="status"><Spinner label={texts.screenLoading} /><p>{texts.screenLoadingText}</p></div>}>
            <Screen route={route} />
          </Suspense>
        </ScreenLoadBoundary>
      </main>
    </div>
  );
}

function Screen({ route }: { readonly route: Route }) {
  switch (route.name) {
    case "dashboard":
      return <DashboardScreen />;
    case "todos":
      return <TodoListScreen query={route.query} />;
    case "todo":
      return route.id === null ? <UnknownScreen /> : <TodoDetailScreen todoId={route.id} />;
    case "board":
      return <BoardScreen />;
    case "time":
      return <TimeScreen />;
    case "bookings":
      return <ExportScreen query={{ status: "", von: "", bis: "", ...route.query }} />;
    case "export":
      return <ExportScreen key={JSON.stringify(route.query)} query={route.query} />;
    case "exportAudit":
      return <ExportAuditScreen query={route.query} />;
    case "templates":
      return <TemplatesScreen templateId={route.id} />;
    case "tags":
      return <SettingsScreen query={{ ...route.query, bereich: "tags" }} />;
    case "settings":
      return <SettingsScreen query={route.query} />;
    default:
      return <UnknownScreen />;
  }
}

/*
  Die unbekannte Adresse ist eine der drei Flächen, die **keine** Ansicht sind
  und trotzdem im Rahmen hängen (T-323 Abschnitt 8.6). Ohne `.screen` und
  `.screen__body` hätte sie nach dem Wegfall des Innenabstands von `.app__main`
  keinen mehr und läge bündig an der Rahmenkante. Der Leerzustand zentriert sich
  in seinem Laufbereich (T-322 R-5) — hier füllt er ihn ganz.
*/
function UnknownScreen() {
  const texts = appTexts();
  return (
    <section className="screen">
      <ScreenBody label={texts.unknownScreen}>
        <EmptyState
          icon="search"
          title={texts.unknownScreen}
          description={texts.unknownScreenHint}
          action={
            <Button variant="primary" onClick={() => (window.location.hash = href("dashboard"))}>
              {texts.toDashboard}
            </Button>
          }
        />
      </ScreenBody>
    </section>
  );
}

class ScreenLoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() {
    /*
      Dieselbe Auflage wie bei `UnknownScreen`: eine Fläche im Rahmen, die keine
      Ansicht ist, braucht `.screen` und einen Laufbereich — sonst liegt die
      Meldung bündig an der Rahmenkante (T-323 Abschnitt 8.6). Sie steht oben im
      Laufbereich, nicht in seiner Mitte: eine Fehlerfläche steht dort, wo der
      Inhalt begonnen hätte (T-322 R-5).
    */
    const texts = appTexts();
    if (this.state.failed) return <section className="screen">
      <ScreenBody label={texts.screenLoadFailed}>
        <InlineMessage tone="danger" title={texts.screenLoadFailed}
          action={<Button onClick={() => window.location.reload()}>{texts.reload}</Button>}>
          {texts.reloadHint}
        </InlineMessage>
      </ScreenBody>
    </section>;
    return this.props.children;
  }
}
