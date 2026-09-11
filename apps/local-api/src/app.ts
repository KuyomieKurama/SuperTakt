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

import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { routePath } from 'hono/route';
import { timeout } from 'hono/timeout';
import { HTTPException } from 'hono/http-exception';

import { asStorageFailure } from '@takt/storage';

import {
  ADDIN_ATTACHMENT_MAX_BODY_BYTES,
  DATA_ARCHIVE_MAX_BODY_BYTES,
  API_BASE_PATH,
  DATA_TRANSFER_MAX_BODY_BYTES,
  MAX_BODY_BYTES,
  REQUEST_TIMEOUT_MS,
} from './config.ts';
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
import type { AppContext } from './context.ts';
import { createAddinRoutes } from './routes/addin/index.ts';
import type { AddinUnit } from './routes/addin/ports.ts';
import { createBoardRoutes } from './features/board/routes.ts';
import { createExportRoutes } from './features/export/routes.ts';
import { createSettingsRoutes } from './features/settings/routes.ts';
import { createStructureRoutes } from './features/structure/routes.ts';
import { createTimeEntryRoutes, createTimerRoutes } from './features/timer/routes.ts';
import { createEmailAttachmentIntake } from './features/todos/email-attachments.ts';
import { createSearchRoutes, createTodoRoutes } from './features/todos/routes.ts';
import { createVersionRoutes } from './features/version/routes.ts';
import { createDataTransferRoutes } from './features/data-transfer/routes.ts';
import type { VersionCheckState } from './features/version/version.ts';

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

/**
 * Eine größere, weiterhin feste Rumpfgrenze — für **drei** Wege und sonst
 * keinen (B-1.7).
 *
 * ===========================================================================
 * Drei Ausnahmen, und jede ist benannt
 * ===========================================================================
 *
 *  0. **Die eigene Datensicherung** (A-20.4, A-19.34) — seit die übernommenen
 *     Dateien samt Bytes mitreisen, die größte von allen. Sie hängt an genau
 *     einer Methode auf genau einem Pfad, `POST /data-transfer/archive`, und
 *     **nicht** am Präfix: Die Fremdimporte daneben tragen keine eingebetteten
 *     Bytes und behalten ihre 64 MB. Die Begründung der Zahl steht an
 *     {@link DATA_ARCHIVE_MAX_BODY_BYTES}, samt Messung.
 *  1. **Fremdimporte** (A-20.7) mit einem Todoist-CSV oder einem
 *     Super-Productivity-JSON.
 *  2. **Das Anlegen eines Todos aus einer E-Mail** mit seinen Anhängen
 *     (A-19.22 bis A-19.33, E-108 Punkt 3). Die Nachricht selbst und ihre
 *     Dateien kommen Base64-kodiert **in einem** Rumpf; das ist die Weiche aus
 *     Bedrohungsmodell 39.4.5, und sie ist die sichere: Der andere Weg —
 *     Datei für Datei zum Dienst und danach anlegen — wäre eine Stelle, an der
 *     ein Aufrufer mit gültigem Token Dateien in das
 *     Anwendungsdatenverzeichnis schreibt, **ohne daß ein Todo entsteht**.
 *
 * Für jede andere Route bleibt es bei {@link MAX_BODY_BYTES}, also einem
 * Megabyte. **Es gibt keine vierte Ausnahme**, und wer eine baut, hebt B-1.7
 * auf und nicht eine Zeile Code.
 *
 * ===========================================================================
 * Warum zwei der drei an **einer** Methode und **einem** Pfad hängen
 * ===========================================================================
 *
 * `startsWith(`${API_BASE_PATH}/addin`)` wäre kürzer und falsch: Es hübe die
 * Grenze für **jede** Add-in-Route, auch für die drei, die nichts anlegen.
 * Eine Ausnahme, deren Menge an einem Präfix aufgespannt ist statt an der
 * Anforderung, wächst mit jeder neuen Nachbarroute mit, ohne daß es jemand
 * entscheidet — derselbe Fehler, den E-099 Punkt 3 für Abwesenheitszusagen
 * beschreibt, nur in die andere Richtung.
 *
 * Deshalb: genau `POST` auf genau `/addin/todos`. Ein `GET` auf denselben Pfad
 * bekommt sie nicht, ein `POST` auf `/addin/todos/…/time-entries` auch nicht.
 *
 * Für die Datensicherung gilt dasselbe, und die Reihenfolge der Abfragen unten
 * sagt es: `POST /data-transfer/archive` wird **vor** dem Präfix geprüft. Das
 * `GET` auf denselben Pfad — die Sicherung herunterladen — hat gar keinen Rumpf
 * und bekommt die Ausnahme nicht.
 */
function bodyLimitByRoute(): MiddlewareHandler<TaktEnv> {
  const ordinary = bodyLimit({
    maxSize: MAX_BODY_BYTES,
    onError: (c) => c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large')),
  });
  const dataTransfer = bodyLimit({
    maxSize: DATA_TRANSFER_MAX_BODY_BYTES,
    onError: (c) => c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large')),
  });
  const dataArchive = bodyLimit({
    maxSize: DATA_ARCHIVE_MAX_BODY_BYTES,
    onError: (c) => c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large')),
  });
  const addinAttachments = bodyLimit({
    maxSize: ADDIN_ATTACHMENT_MAX_BODY_BYTES,
    onError: (c) => c.json(errorEnvelope('payload_too_large'), errorStatus('payload_too_large')),
  });
  const ADDIN_CREATE_PATH = `${API_BASE_PATH}/addin/todos`;
  const ARCHIVE_PATH = `${API_BASE_PATH}/data-transfer/archive`;
  return (c, next) => {
    if (c.req.method === 'POST' && c.req.path === ARCHIVE_PATH) return dataArchive(c, next);
    if (c.req.path.startsWith(`${API_BASE_PATH}/data-transfer`)) return dataTransfer(c, next);
    if (c.req.method === 'POST' && c.req.path === ADDIN_CREATE_PATH) {
      return addinAttachments(c, next);
    }
    return ordinary(c, next);
  };
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
  app.use('*', bodyLimitByRoute());
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
   * `features/version/routes.ts`.
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
     * die Begründung steht in `features/board/routes.ts`. Es gibt bewusst keine Route,
     * die eine Karte in eine Spalte legt — Ziehen ist mit E-054 entfallen.
     */
    api.route('/board', createBoardRoutes(context));
    api.route('/todo-statuses', structure.statuses);
    api.route('/time-entries', createTimeEntryRoutes(context));
    api.route('/timer', createTimerRoutes(context));
    api.route('/export', createExportRoutes(context));
    api.route('/settings', createSettingsRoutes(context));
    api.route('/data-transfer', createDataTransferRoutes(context));

    /**
     * Die schmale Fläche des Outlook-Add-ins (T-019, RR-1).
     *
     * Der Aufgabenbereich darf lesen, nach einer Call-Nummer suchen, ein Todo
     * anlegen und die bestehende Buchungsroute nutzen. **Anhängen darf er
     * nicht** — weder einen Verweis noch eine Datei noch ein Bild. Es gibt
     * dafür keine Route mehr: Pull Request #16 hatte eine gebaut, F-21 hat
     * gegen sie entschieden, und E-100 hat sie samt Fähigkeit im `AddinUnit`
     * entfernt (T-247). A-19.19 ist damit strukturell wahr, nicht zugesagt;
     * `proof:addin` Abschnitt 18f mißt es am fertigen Dienst.
     * Kein Löschen, kein Export, kein Zugriff auf den Vermerk eines fremden
     * Todos, keine Einstellungen. Daneben erreicht das Add-in-Token nur noch
     * `GET /health` — „Verbindung prüfen", ohne Inhalt und ohne Wirkung.
     *
     * Der Grund ist nicht Sparsamkeit: Das Add-in weist sich mit dem
     * **dauerhaften** Token aus, die Oberfläche mit dem Sitzungsgeheimnis
     * (B-2.9 Punkt 3). Ein entwendetes Add-in-Token kommt genau so weit, wie
     * diese Fläche reicht.
     *
     * `AddinDeps` ist strukturell ein Ausschnitt der echten Ports — ein
     * `TransactionPort` erfüllt ihn ohne Übersetzungsadapter, der etwas
     * verlieren könnte.
     */
    /*
     * **Die Anhangsübernahme aus einer E-Mail** (A-19.22 bis A-19.33, E-108,
     * E-109). Der Absatz oben ist damit zur Hälfte überholt und zur anderen
     * Hälfte schärfer als vorher:
     *
     *  - **Am gefundenen Todo bleibt es beim Nein.** A-10.9 ändert sich nicht,
     *    im Duplikatfall wird weiterhin nur hingewiesen. E-108 hebt E-100
     *    ausdrücklich nur zur Hälfte auf.
     *  - **Beim Anlegen entstehen Anhänge** — und zwar strukturell nur dort:
     *    {@link EmailAttachmentIntake} nimmt keine Todo-Kennung entgegen,
     *    sondern die **Funktion, die eine erzeugt**. Es gibt in dieser Fläche
     *    keinen Parameter vom Typ `TodoId`, und damit keinen Aufruf, der einen
     *    Anhang an ein bestehendes Todo hängt (A-A-21′ (b) und (c), A-A-82).
     *
     * Das ist der Unterschied zwischen einer Zusage und einer Struktur: Die
     * alte Fassung sagte „Anhängen darf er nicht" und hatte dafür die Fähigkeit
     * entfernt; diese hier hat eine Fähigkeit, die das bestehende Todo gar
     * nicht erreichen **kann**.
     */
    /*
     * **Ohne Anmerkung am Literal, und das ist kein Versehen.** Bis hierher
     * stand `const addinDeps: AddinDeps = { … }`; die Anmerkung typisierte
     * `inTransaction` kontextuell (`Parameters<…>` verbreiterte den generischen
     * Rückgabewert `T` zu `unknown`). Die generische Form steht deshalb jetzt
     * ausgeschrieben da und leistet dasselbe.
     *
     * Weg ist die Anmerkung, weil dieses Objekt eine Fähigkeit **mehr** trägt,
     * als `AddinDeps` heute nennt: Der Zusammenbau ist fertig, bevor die Tür
     * gebaut ist, und `AddinDeps` gehört der Tür. Eine Anmerkung am Literal
     * machte aus dieser Naht einen Übersetzungsfehler statt einer Stelle, an
     * der beide Seiten unabhängig voneinander wachsen können; der Aufruf
     * `createAddinRoutes(addinDeps)` prüft die Zuweisbarkeit weiterhin
     * vollständig. Sobald `AddinDeps` das Feld führt, ist die Naht zu und
     * diese Erklärung überflüssig.
     */
    const addinDeps = {
      inTransaction: <T,>(work: (unit: AddinUnit) => Promise<T>): Promise<T> =>
        context.transactions.inTransaction(work),
      now: () => context.clock.now(),
      emailAttachments: createEmailAttachmentIntake(context),
    };
    api.route('/addin', createAddinRoutes(addinDeps));
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

    const where = `${c.req.method} ${routePath(c, -1) || '?'}`;

    const stored = asStorageFailure(error);
    if (stored !== null) {
      runtime.logger.lifecycle('warn', `Regel der Speicherung in ${where}: ${stored.code}`);
      return fail(c, stored);
    }
    c.set('outcome', 'internal_error');
    runtime.logger.lifecycle('error', `Unerwarteter Fehler in ${where}`);
    return c.json(errorEnvelope('internal_error'), errorStatus('internal_error'));
  });

  return app;
}
