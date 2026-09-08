/**
 * Takt — die Anwendung des lokalen Dienstes (T-011, T-021).
 *
 * Zwei Sorten Routen hängen hier, und beide hinter **derselben** Kette:
 *
 *  - das **Zugriffsverfahren** aus T-011 (`/health`, `/token`,
 *    `/security/notices`),
 *  - die **Fachlogik** aus T-021 (Todos, Tags, Pools, Board, Status, Zeit,
 *    Timer, Export, Einstellungen) und die schmale Add-in-Fläche aus T-019.
 *
 * Wer einen Router ergänzt, hängt ihn **hinter** `app.use(...)` und nicht
 * daneben. Die Kette ist die einzige Stelle, an der geprüft wird; eine Route,
 * die daran vorbeigeht, ist offen (B-1.1 Punkt 1). Genau deshalb steht das
 * Einhängen unten in **einem** Block: Was dort nicht steht, gibt es nicht, und
 * was dort steht, ist geprüft.
 */

import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { routePath } from 'hono/route';
import { timeout } from 'hono/timeout';
import { HTTPException } from 'hono/http-exception';

import { asStorageFailure } from '@takt/storage';

import { API_BASE_PATH, MAX_BODY_BYTES, REQUEST_TIMEOUT_MS } from './config.ts';
import { errorEnvelope, errorStatus } from './errors.ts';
import { fail } from './http/problem.ts';
import {
  authGuard,
  contentTypeGuard,
  credentialPolicy,
  hostGuard,
  originGuard,
  requestLog,
  requireCredential,
  securityHeaders,
  urlSecretGuard,
  type TaktEnv,
} from './http/guards.ts';
import type { AccessRuntime } from './runtime.ts';
import type { AppContext } from './usecases/context.ts';
import { createAddinRoutes } from './routes/addin/index.ts';
import { createBoardRoutes } from './routes/board.ts';
import { createExportRoutes, createSettingsRoutes } from './routes/export.ts';
import { createStructureRoutes } from './routes/structure.ts';
import { createTimeEntryRoutes, createTimerRoutes } from './routes/time.ts';
import { createSearchRoutes, createTodoRoutes } from './routes/todos.ts';
import { createVersionRoutes } from './routes/version.ts';
import type { VersionCheckState } from './version/checker.ts';

/**
 * Der fachliche Teil ist **auswechselbar leer**.
 *
 * Ohne geöffnete Datenbank gibt es keinen `AppContext`, und dann hängen die
 * Fachrouten nicht. Das ist der richtige Zustand: Eine unverdrahtete Route ist
 * keine offene Route, und der Dienst antwortet mit 404 statt mit einem
 * halbfertigen Datenpfad.
 */
export interface AppOptions {
  readonly context?: AppContext;
  /**
   * Was der Dienst zuletzt über die veröffentlichte Fassung weiß (E-069).
   *
   * Eine **Funktion** und kein Wert: Die Route soll den Stand zum Zeitpunkt der
   * Anfrage lesen und nicht den zum Zeitpunkt des Zusammenbaus. Ohne Angabe
   * lautet die Antwort „noch nichts geprüft" — die Route gibt es damit immer,
   * auch ohne Datenbank und ohne laufenden Prüfer. Das ist Absicht: Eine
   * Route, die je nach Zusammenbau vorhanden ist oder nicht, wäre an
   * `proof:route-policy` Abschnitt 4 und `proof:openapi` vorbei.
   */
  readonly versionState?: () => VersionCheckState;
}

export function createApp(runtime: AccessRuntime, options: AppOptions = {}): Hono<TaktEnv> {
  const app = new Hono<TaktEnv>();

  // ---------------------------------------------------------------------------
  // Die Kette. Reihenfolge ist Inhalt — Begründung in http/guards.ts.
  // ---------------------------------------------------------------------------
  app.use('*', securityHeaders());
  app.use('*', requestLog(runtime));
  app.use('*', hostGuard(runtime));
  app.use('*', originGuard(runtime));
  app.use('*', urlSecretGuard(runtime));
  app.use('*', contentTypeGuard());
  app.use(
    '*',
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large')),
    }),
  );
  app.use('*', timeout(REQUEST_TIMEOUT_MS));
  app.use('*', authGuard(runtime));

  /**
   * B-2.10, T-034 — **welcher** der beiden Nachweise, für jede Route.
   *
   * `authGuard` darüber klärt, ob überhaupt ein gültiger Nachweis vorliegt.
   * Dieses Glied klärt, welcher: Verlangt wird das Sitzungsgeheimnis, und
   * ausschließlich der Teilbaum `/addin` senkt die Anforderung ab
   * (`access/route-policy.ts`).
   *
   * Es steht hier oben in der Kette und **nicht** an den Routen, aus demselben
   * Grund wie die Kette selbst: Eine Aufzählung je Route vergisst die nächste
   * neue Route (B-1.1 Punkt 1). Genau so ist B-2.10 entstanden.
   */
  app.use('*', credentialPolicy());

  const api = new Hono<TaktEnv>();

  /**
   * Erreichbarkeit. Bewusst **hinter** der Token-Prüfung (architektur.md 6.3).
   *
   * Eine unauthentifizierte Antwort verriete jedem lokalen Prozess und jeder
   * Webseite, dass Takt läuft und auf welchem Port. Das Add-in benutzt diese
   * Route für „Verbindung testen" und schickt dabei das Token mit — sie ist
   * damit keine Ausnahme vom Nachweis, sondern der erste Fall, in dem das Token
   * gebraucht wird.
   *
   * **Von der Rechtevorgabe ist sie sehr wohl eine Ausnahme (T-034).** Sie ist
   * die einzige Route außerhalb von `/addin`, die ein Add-in-Token erreicht;
   * die Begründung steht ausgeschrieben bei `SHARED_PATHS` in
   * `access/route-policy.ts` und hängt daran, dass diese Antwort nichts
   * herausgibt und nichts ändert.
   *
   * Die Antwort nennt keinen Pfad, keinen Benutzernamen und keine
   * Bestandsgröße.
   */
  api.get('/health', (c) => c.json({ data: { status: 'ok' } }));

  /**
   * Zustand des Add-in-Tokens. **Ohne** Klartext — den gibt es nach der
   * Erzeugung nicht mehr, auch nicht für die Oberfläche (B-2.2 Punkt 2).
   */
  api.get('/token', requireCredential('session'), (c) => {
    const status = runtime.tokens.status();
    return c.json({
      data: {
        configured: status.configured,
        issuedAt: status.issuedAt,
        lastUsedAt: status.lastUsedAt,
        generation: status.generation,
        unreadable: status.unreadable,
      },
    });
  });

  /**
   * Neues Token erzeugen. Das alte wird **sofort** ungültig (B-2.7).
   *
   * Dies ist die **einzige** Stelle im ganzen Dienst, an der ein Token in einer
   * Antwort steht. Sie ist eng gefasst:
   *
   * - Nur mit dem Sitzungsgeheimnis erreichbar, also nur aus der Tauri-Hülle.
   *   Ein entwendetes Add-in-Token kann sich nicht selbst austauschen.
   * - `Cache-Control: no-store` steht auf jeder Antwort dieses Dienstes.
   * - Der Wert wird nicht protokolliert: Die Protokollzeile kennt nur Methode,
   *   Pfad, Status, Dauer und einen Schlüssel (B-2.4 Punkt 2).
   *
   * Der Klartext ist danach nicht wieder abrufbar. Wer ihn verliert, erzeugt
   * ein neues.
   */
  api.post('/token', requireCredential('session'), async (c) => {
    const token = await runtime.tokens.rotate(runtime.clock());
    const status = runtime.tokens.status();
    return c.json(
      {
        data: {
          token,
          issuedAt: status.issuedAt,
          generation: status.generation,
        },
      },
      201,
    );
  });

  /**
   * Sicherheitsmeldungen (B-2.6). Zählwerte und Zeitpunkte, keine Werte aus
   * einer Anfrage.
   */
  api.get('/security/notices', requireCredential('session'), (c) =>
    c.json({ data: { notices: runtime.notices.list() } }),
  );

  /**
   * Die Versionsprüfung (A-18.2, E-069, A-V-19).
   *
   * Hier oben und **nicht** im Block der Fachrouten: Sie hängt an keiner
   * Datenbank. Damit gibt es sie in jedem Zusammenbau, und
   * `proof:route-policy` Abschnitt 4 wie `proof:openapi` sehen immer dieselbe
   * Routenliste. Sie liest ab und fragt nicht — die Begründung steht in
   * `routes/version.ts`.
   *
   * Kein `requireCredential('session')` daneben: Das steht schon oben in der
   * Kette für **jeden** Pfad, der nicht unter `/addin` liegt und nicht in
   * `SHARED_PATHS` steht (`credentialPolicy()`). Eine zweite Angabe je Route
   * wäre die Aufzählung, aus der B-2.10 entstanden ist.
   */
  api.route('/version-check', createVersionRoutes(options.versionState ?? (() => ({ state: 'unknown' }))));

  // ---------------------------------------------------------------------------
  // Fachrouten (T-021). Alle **hinter** der Kette oben, keine daneben.
  // ---------------------------------------------------------------------------
  const context = options.context;
  if (context !== undefined) {
    const structure = createStructureRoutes(context);

    api.route('/todos', createTodoRoutes(context));
    api.route('/search', createSearchRoutes(context));
    api.route('/tag-tree', structure.tagTree);
    api.route('/tags', structure.tags);
    api.route('/tag-folders', structure.folders);
    api.route('/pools', structure.pools);
    /**
     * Das Kanban-Board (E-054). **Eine** Route, und sie liest nur.
     *
     * Spalten werden über `/pools` eingerichtet, weil eine Spalte ein Pool ist;
     * die Begründung steht in `routes/board.ts`. Es gibt bewusst keine Route,
     * die eine Karte in eine Spalte legt — Ziehen ist mit E-054 entfallen.
     */
    api.route('/board', createBoardRoutes(context));
    api.route('/todo-statuses', structure.statuses);
    api.route('/time-entries', createTimeEntryRoutes(context));
    api.route('/timer', createTimerRoutes(context));
    api.route('/export', createExportRoutes(context));
    api.route('/settings', createSettingsRoutes(context));

    /**
     * Die schmale Fläche des Outlook-Add-ins (T-019, RR-1).
     *
     * Vier Routen: Baum und Vorbelegungen lesen, nach einer Call-Nummer suchen,
     * ein Todo anlegen, eine Zeit buchen. Kein Löschen, kein Export, kein
     * Zugriff auf den Vermerk eines fremden Todos, keine Einstellungen.
     * Daneben erreicht das Add-in-Token nur noch `GET /health` — „Verbindung
     * prüfen", ohne Inhalt und ohne Wirkung (`access/route-policy.ts`).
     *
     * Der Grund ist nicht Sparsamkeit: Das Add-in weist sich mit dem
     * **dauerhaften** Token aus, die Oberfläche mit dem Sitzungsgeheimnis
     * (B-2.9 Punkt 3). Ein entwendetes Add-in-Token kommt genau so weit, wie
     * diese Fläche reicht.
     *
     * **Wodurch dieser Absatz trägt (T-034).** Bis dahin trug er nicht: Er
     * beschrieb die Absicht, und der Dienst nahm auf allen sechzig übrigen
     * Routen beide Geheimnisse an (B-2.10, in T-023 gemessen — Vermerk gelesen
     * und überschrieben, Exportordner gesetzt, Exportlauf ausgelöst). Er ist
     * nicht abgeschwächt worden, sondern eingeholt: `credentialPolicy()` oben
     * in der Kette verlangt `session` für **jeden** Pfad, und die einzige
     * Ausnahme ist genau der Teilbaum, der hier eingehängt wird. Die Fläche
     * dieses Blocks ist damit wörtlich die Fläche des Add-in-Tokens. Wer sie
     * erweitert, erweitert das, was ein entwendetes Token erreicht.
     *
     * `AddinDeps` ist strukturell ein Ausschnitt der echten Ports — ein
     * `TransactionPort` erfüllt ihn ohne Übersetzungsadapter, der etwas
     * verlieren könnte.
     */
    api.route(
      '/addin',
      createAddinRoutes({
        inTransaction: (work) => context.transactions.inTransaction(work),
        now: () => context.clock.now(),
      }),
    );
  }

  app.route(API_BASE_PATH, api);

  app.notFound((c) => {
    c.set('outcome', 'not_found');
    return c.json(errorEnvelope('not_found'), errorStatus('not_found'));
  });

  /**
   * Ein unerwarteter Fehler wird **nicht** nach außen erklärt.
   *
   * Kein Aufrufstapel, keine Meldung der Laufzeitumgebung, kein Dateipfad —
   * auch nicht lokal, denn der Client kann ein fremder Browsertab sein
   * (B-2.4 Punkt 4). Innen bleibt die Zeile im Protokoll, und die trägt nur
   * einen Schlüssel.
   */
  app.onError((error, c) => {
    if (error instanceof HTTPException && error.status === 413) {
      c.set('outcome', 'payload_too_large');
      return c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large'));
    }

    /*
     * **Der gemusterte Pfad und nicht der angefragte** (T-164, Auflage A-A-31).
     *
     * Hier stand bis T-168 `c.req.path`. Das ist der Weg, den der Aufrufer
     * geschickt hat, und damit fremder Text in einem Protokoll, das ein
     * Benutzer weitergibt. Der Riegel des Protokollierers liegt auf `reason`
     * und auf nichts sonst (`logger.ts`); für `message` bürgt allein die
     * Aufrufstelle — also diese hier.
     *
     * `routePath` liefert stattdessen den **registrierten** Pfad
     * (`/todos/:id`). Er stammt aus dem Erzeugnis und nicht aus der Anfrage;
     * damit kann diese Zeile gar keinen fremden Wert mehr tragen, statt keinen
     * zu tragen, weil bisher keiner vorbeikam.
     *
     * Der zweite Parameter `-1` ist der **zuletzt** getroffene Eintrag, also
     * der Routeneintrag selbst. Ohne ihn stünde bei einem Wurf aus einem der
     * Wächter nur `*` da — die Kette hängt an `app.use('*', …)`, und die
     * Wächter laufen vor der Route. Gibt es überhaupt keinen Treffer, ist die
     * Zeichenkette leer; dann steht `?` da und keine leere Stelle.
     */
    const where = `${c.req.method} ${routePath(c, -1) || '?'}`;

    /**
     * Das letzte Netz unter der Speicherung (T-074).
     *
     * Ein Adapter, der eine Regel der Datenbank durchschlagen lässt, ist ein
     * Versehen — `attempt` und `attemptAtomically` in `packages/storage` sind
     * die Stelle, an der eine Verletzung zum **Wert** wird. Vergisst sie jemand,
     * kam die Störung bis hierher und wurde ein 500. Genau das ist in T-072
     * gemessen worden: `POST /pools` mit vergebenem Namen antwortete
     * `internal_error`, und die Oberfläche riet daraufhin zum erneuten Versuch,
     * der genauso scheiterte.
     *
     * Der Unterschied ist nicht kosmetisch. Ein 500 sagt „bei mir ist etwas
     * kaputt“, ein 409 sagt „das geht so nicht“ — nur das zweite lässt sich
     * beantworten.
     *
     * **Dieses Netz ersetzt keinen Fehlerzweig.** Es sagt nur „ein doppelter
     * Wert“, wo der Anwendungsfall sagen könnte, welcher. `proof:conflicts`
     * misst deshalb beides: dass keine Route mit 500 antwortet, **und** dass
     * die Antwort einen lesbaren Schlüssel trägt.
     *
     * Was nicht aus der Speicherung stammt, geht unverändert weiter unten durch
     * und bleibt ein 500 ohne Innenleben. `asStorageFailure` liefert dafür
     * `null` statt zu werfen; die werfende Fassung wäre hier eine Fangklammer
     * um eine Fangklammer.
     */
    const stored = asStorageFailure(error);
    if (stored !== null) {
      runtime.logger.lifecycle('warn', `Regel der Speicherung in ${where}: ${stored.code}`);
      return fail(c, stored);
    }
    // Hier stand bis T-058 ein `console.error('DEBUG-T041', …, error)` — eine
    // Zeile aus einer Fehlersuche, die den vollständigen Wurf samt
    // SQLite-Meldung, Tabellennamen und Aufrufstapel auf `stderr` schrieb. Sie
    // widersprach dem Absatz darüber Wort für Wort. `stderr` des Sidecars läuft
    // in der Hülle zusammen und geht bei einer Fehlermeldung mit; damit war der
    // Innenbau der Datenbank in einem Protokoll, das ein Benutzer weitergibt.
    c.set('outcome', 'internal_error');
    runtime.logger.lifecycle('error', `Unerwarteter Fehler in ${where}`);
    return c.json(errorEnvelope('internal_error'), errorStatus('internal_error'));
  });

  return app;
}
