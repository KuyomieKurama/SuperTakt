import { useCallback, useEffect, useState } from "react";
import { listTimeEntries, listTodos } from "../api/endpoints";
import { ShellStatus, type ShellStateSnapshot } from "../components/ShellStatus";
import { Button, Card, EmptyState, InlineMessage, Spinner } from "../components/Primitives";
import { BoardScreen } from "../screens/BoardScreen";
import { BookingsScreen } from "../screens/BookingsScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ExportAuditScreen } from "../screens/ExportAuditScreen";
import { ExportScreen } from "../screens/ExportScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TagsScreen } from "../screens/TagsScreen";
import { TemplatesScreen } from "../screens/TemplatesScreen";
import { TimeScreen } from "../screens/TimeScreen";
import { TodoDetailScreen } from "../screens/TodoDetailScreen";
import { TodoListScreen } from "../screens/TodoListScreen";
import { connect, quitApplication, readShellState, type ConnectionState } from "./connection";
import { GlobalSearch } from "./GlobalSearch";
import { Navigation } from "./Navigation";
import { PreferencesProvider } from "./PreferencesContext";
import { RefreshProvider, useRefresh } from "./RefreshContext";
import { href, type Route } from "./router";
import { StructureProvider } from "./StructureContext";
import { TimerBar } from "./TimerBar";
import { TimerProvider } from "./TimerContext";
import { ToastProvider } from "./ToastContext";
import { useAsync } from "./useAsync";
import { useDataFreshness } from "./useDataFreshness";
import { useRoute } from "./useRoute";

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
  const { route, revisit } = useRoute();
  return <ConnectedApp route={route} revisit={revisit} />;
}

/* ==================================================================== */
/* Verbindung                                                           */
/* ==================================================================== */

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
        if (next.kind === "ready") setShell(next.shell);
      })
      .catch((cause: unknown) => {
        setState({
          kind: "failed",
          message:
            cause instanceof Error
              ? cause.message
              : "Die Verbindung zum lokalen Dienst kam nicht zustande.",
        });
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

  if (state.kind === "connecting") {
    return (
      <div className="boot">
        <Spinner size={22} label="Takt wird verbunden" />
        <p className="boot__text">Takt verbindet sich mit dem lokalen Dienst …</p>
      </div>
    );
  }

  if (state.kind === "no_shell") {
    return <NoShellNotice />;
  }

  if (state.kind === "failed") {
    return (
      <div className="boot">
        <Card title="Takt konnte sich nicht verbinden">
          <InlineMessage tone="danger" title="Der lokale Dienst ist nicht erreichbar">
            {state.message}
          </InlineMessage>
          <p className="boot__text">
            Ohne den lokalen Dienst gibt es keine Daten: Todos, Zeiten und Einstellungen liegen
            allein dort. Takt speichert nichts im Browser.
          </p>
          <div className="boot__actions">
            <Button variant="primary" iconStart="rotate-ccw" onClick={attempt}>
              Erneut versuchen
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
              <Workspace route={route} revisit={revisit} shell={shell} />
            </TimerProvider>
          </PreferencesProvider>
        </StructureProvider>
      </RefreshProvider>
    </ToastProvider>
  );
}

function NoShellNotice() {
  return (
    <div className="boot">
      <Card title="Takt läuft in der Takt-Anwendung">
        <p className="boot__text">
          Diese Seite ist die Oberfläche von Takt. Sie spricht mit einem lokalen Dienst, der
          ausschließlich von der Takt-Anwendung gestartet wird — und sie weist sich dabei mit
          einem Sitzungsgeheimnis aus, das nur diese Anwendung kennt. Im Browser allein gibt es
          beides nicht, deshalb bleibt hier alles leer.
        </p>
        <p className="boot__text">
          Das ist kein Fehler, sondern die Absicht: Der Dienst hört nur auf die eigene Maschine
          und beantwortet keine Anfrage ohne Nachweis — auch nicht die Frage, ob es ihn gibt.
        </p>
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

/* ==================================================================== */
/* Arbeitsfläche                                                        */
/* ==================================================================== */

function Workspace({
  route,
  revisit,
  shell,
}: {
  readonly route: Route;
  readonly revisit: number;
  readonly shell: ShellStateSnapshot | null;
}) {
  const { version } = useRefresh();

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

  return (
    <div className="app">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>

      {shell === null ? null : (
        <ShellStatus state={shell} onQuit={() => void quitApplication()} />
      )}

      {/*
        Seitenleiste, Kopf und Inhalt sind Geschwister im Raster von `.app` und
        liegen nicht mehr ineinander. Die Marke steht seit T-057 oben in der
        Seitenleiste: Die Seitenleiste reicht über die volle Höhe, der Kopf
        beginnt rechts von ihr — die Struktur, die der Auftraggeber gezeichnet
        hat.
      */}
      <aside className="app__sidebar">
        <a className="brand" href={href("dashboard")}>
          <span className="brand__mark" aria-hidden>
            T
          </span>
          <span className="brand__name">Takt</span>
        </a>

        <Navigation
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

      <main className="app__main" id="inhalt" tabIndex={-1}>
        <Screen route={route} />
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
      return <BookingsScreen query={route.query} />;
    case "export":
      return <ExportScreen />;
    case "exportAudit":
      return <ExportAuditScreen query={route.query} />;
    case "templates":
      return <TemplatesScreen templateId={route.id} />;
    case "tags":
      return <TagsScreen />;
    case "settings":
      return <SettingsScreen query={route.query} />;
    default:
      return <UnknownScreen />;
  }
}

function UnknownScreen() {
  return (
    <EmptyState
      icon="search"
      title="Diese Ansicht gibt es nicht"
      description="Die Adresse führt ins Leere. Über die Navigation links geht es weiter."
      action={
        <Button variant="primary" onClick={() => (window.location.hash = href("dashboard"))}>
          Zum Dashboard
        </Button>
      }
    />
  );
}
