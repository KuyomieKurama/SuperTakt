/**
 * Takt — ein fester Bestand, einmal durch **jede** Operation gefahren (T-041).
 *
 * ===========================================================================
 * Wozu
 * ===========================================================================
 *
 * `proof:openapi` verglich bis T-041 Routen und **Anfragen**. Die Antworten
 * blieben außen vor, und genau dort lagen zweimal die teuersten Befunde:
 *
 *  - T-022: `GET /settings` und `POST /todos` liefern eine Hülle, wo die
 *    Beschreibung die Entität selbst versprach. Wer dagegen baute, las
 *    `undefined` — kein Übersetzungsfehler, eine leere Anzeige.
 *  - T-029: der Seitenumschlag stimmte bei **keiner** Listenroute.
 *  - T-039: `POST /timer/start` antwortete laut Beschreibung mit `409
 *    timer_already_running`, tatsächlich mit `200` und
 *    `kind: confirmation_required`.
 *
 * Dreimal derselbe Fehlertyp, dreimal von Hand gefunden, jedes Mal erst,
 * nachdem jemand dagegen gebaut hatte. Diese Datei ist der Teil, der das
 * maschinell macht: Sie baut den Dienst **einmal**, legt einen kleinen festen
 * Bestand an und ruft jede beschriebene Operation mindestens einmal auf. Was
 * dabei über die Leitung geht, hält `proof-openapi.mjs` gegen die
 * Beschreibung.
 *
 * ===========================================================================
 * Warum auch die Schreibrouten, obwohl T-039 sie ausnahm
 * ===========================================================================
 *
 * T-039 schlug vor, nur Leserouten anzufahren — Schreibrouten bräuchten je
 * Route gültige Eingaben, also im Kern eine zweite Prüfsuite. Das stimmt für
 * eine Prüfsuite, die **Verhalten** misst. Hier wird kein Verhalten gemessen,
 * sondern **Gestalt**, und dafür genügt ein Bestand, der aufeinander aufbaut:
 * Ein Ordner, ein Tag, ein Pool, zwei Todos, ein paar Buchungen und ein
 * Exportlauf reichen, um jede der 64 Operationen einmal auszulösen. Genau die
 * drei bekannten Befunde saßen auf Schreibrouten (`POST /todos`,
 * `POST /timer/start`); eine Prüfung, die sie ausließe, ließe die Hälfte aus,
 * in der die Funde lagen.
 *
 * ===========================================================================
 * Warum im Prozess und nicht über einen Kindprozess
 * ===========================================================================
 *
 * `proof:export-api` startet den echten Sidecar, weil es die **Kette** misst:
 * Host, Herkunft, Inhaltstyp, Token. Hier geht es um die Gestalt der Antwort,
 * und die entsteht hinter der Kette. `compose(...)` und `app.request(...)`
 * geben denselben Rumpf in einem Bruchteil der Zeit und ohne belegten Port —
 * dieselbe Anwendung, derselbe Zusammenbau, nur ohne Steckdose. Die Anfragen
 * tragen trotzdem `Host`, `Origin` und Token, laufen also durch dieselbe
 * Kette; eine Anfrage, die dort hängen bliebe, fiele als 401 oder 403 auf.
 *
 * Ein Wegwerfordner dient als Exportziel. Er wird am Ende gelöscht; der
 * Bestand liegt im Arbeitsspeicher und überlebt den Lauf nicht.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { compose } from '../src/composition.ts';
import { API_BASE_PATH } from '../src/config.ts';

const PORT = 17843;
const UI_ORIGIN = 'http://127.0.0.1:5173';

/** Ein Sitzungsgeheimnis der richtigen Gestalt; es verlässt diesen Lauf nicht. */
const SECRET = `takt_${'0'.repeat(43)}`;

/** Ein Tokenspeicher im Arbeitsspeicher — hier wird nichts auf die Platte geschrieben. */
const memoryStore = () => ({
  read: async () => ({ status: 'absent' }),
  write: async () => {},
  inspectPermissions: async () => ({ checked: false, dirTooPermissive: false, fileTooPermissive: false }),
});

/**
 * Der interne Vermerk (A-7.1, A-7.2).
 *
 * Er steht hier als erkennbarer Text, damit `proof-openapi.mjs` am Ende
 * belegen kann, dass er in **keiner** Antwort außer der eigenen Vermerksroute
 * vorkommt. Die Notiz-Trennung ist eine Zusicherung über Datenstrukturen; ein
 * Lauf, der ohnehin jede Antwort einsammelt, kann sie nebenbei messen.
 */
export const INTERNAL_NOTE = 'VERMERK-INTERN-A72-nicht-exportierbar';

/**
 * Frist und Anhangsangaben dieses Durchlaufs (A-19.1, A-19.8, A-19.17).
 *
 * **Auffällig gewählt und deshalb brauchbar.** Sie sind so unverwechselbar wie
 * {@link INTERNAL_NOTE}: Ein Prüfpfad, der eine Exportdatei als Text
 * durchsucht, findet sie sofort — und A-19.17 verlangt, daß er sie **nicht**
 * findet, in **keiner** Vorlage. Dasselbe Vorgehen wie bei der Notiz-Trennung
 * (TP-NOTE-02/03), mit Frist und Anhang statt Vermerk.
 *
 * Erfunden, wie jede Testangabe dieses Baums: keine echte Adresse, kein echter
 * Kundenname (`CLAUDE.md`, Abschnitt Sicherheit).
 */
export const DUE_DATE = '2029-11-27';
export const DUE_DATE_CHANGED = '2029-12-24';
export const ATTACHMENT_LINK_MARKER = 'beispiel.example';
export const ATTACHMENT_TITLE_MARKER = 'Beispielverweis';

/**
 * Die Farbe, mit der der Durchlauf eine Kanban-Spalte anlegt (T-051).
 *
 * Sie steht hier und nicht im Aufruf, damit `proof-openapi.mjs` in der Antwort
 * nach **genau diesem** Wert sehen kann. Ein Schlüssel, den eine Route
 * stillschweigend abstreift, sieht in der Gestaltprüfung wie ein Erfolg aus:
 * Die Antwort trägt `color: null`, und `null` ist erlaubt.
 */
export const STATUS_COLOR = '#3f7fbf';

/**
 * Die vier Kanban-Spalten, die der Durchlauf einrichtet (E-054).
 *
 * Sie stehen hier mit Namen, damit `proof-openapi.mjs` sie in den
 * Aufzeichnungen wiederfindet, ohne sich auf eine Reihenfolge zu verlassen.
 * Jede prüft etwas anderes:
 *
 *   `tag`   — Regel über ein einzelnes Tag.
 *   `folder`— Regel über einen **Ordner**: andere Regelgestalt, dieselbe Karte.
 *             Das ist der Fall, den es vor E-054 nicht geben konnte — eine
 *             Karte in zwei Spalten zugleich.
 *   `both`  — **zwei** zutreffende Regelterme in **einer** Spalte. Die Karte
 *             darf darin genau einmal stehen und nicht zweimal.
 *   `empty` — leere Regel. Trifft nichts, nicht alles (T-009).
 *
 * Und die fünf Achsen aus T-076, jede einzeln messbar:
 *
 *   `status`      — **nur** Status. Keine Tagbedingung; die Spalte steht und
 *                   fällt mit `todo.status_id`, und das ist eine Spalte an der
 *                   Zeile und kein Eintrag in einer Verknüpfungstabelle.
 *   `otherStatus` — dieselbe Bauart mit einem Status, den kein Todo trägt. Die
 *                   Gegenprobe: Ohne sie wäre `status` auch dann grün, wenn die
 *                   Statusachse gar nicht filterte.
 *   `mixed`       — Tag **und** Status. Die Verknüpfung der Achsen ist „und":
 *                   Die Spalte muss weniger enthalten als die Tagspalte allein,
 *                   nicht mehr.
 *   `excluded`    — Tag erforderlich, anderes Tag ausgeschlossen. Die
 *                   Bedingung, die eine Liste gleichartiger Terme nicht
 *                   ausdrücken konnte.
 *   `done`        — nur erledigte Karten. Sie misst zugleich, dass die Regel
 *                   der Ansichtseinstellung vorgeht: Ohne das wäre die Spalte
 *                   unter `includeCompleted=false` immer leer.
 *   `openOnly`    — die Gegenrichtung derselben Achse, und die zweite Hälfte
 *                   der E-058-Messung: Ein Timerstart auf einem erledigten
 *                   Todo **verlässt** `done` und **betritt** `openOnly`. Ohne
 *                   sie wäre nur das Verschwinden gemessen und das Erscheinen
 *                   geraten.
 *   `openWork`    — Todos mit offener Buchung („was habe ich noch nicht
 *                   abgerechnet").
 *   `exported`    — Todos mit exportierter Buchung. Beide zugleich sind
 *                   möglich, und das ist der Punkt.
 *
 * Und der Fall, den man von außen nicht von einer treffelosen Regel
 * unterscheiden kann, solange die Auflösung nicht mitkommt (T-080):
 *
 *   `emptyFolder` — Regel über einen Ordner, in dem **kein Tag** liegt. Sie
 *                   nennt eine Bedingung und trifft trotzdem nichts:
 *                   `resolved.tagCount` ist 0, `resolved.isEmpty` ist wahr.
 *                   Abschnitt 13 misst daran, dass die Zahl ankommt und dass
 *                   die Spalte leer ist.
 */
export const BOARD_COLUMNS = Object.freeze({
  tag: 'Spalte über ein Tag',
  folder: 'Spalte über einen Ordner',
  both: 'Spalte über zwei Tags',
  empty: 'Spalte ohne Regel',
  status: 'Spalte nur über den Status',
  otherStatus: 'Spalte über einen unbenutzten Status',
  mixed: 'Spalte über Tag und Status',
  excluded: 'Spalte mit ausgeschlossenem Tag',
  done: 'Spalte nur über Erledigt',
  openOnly: 'Spalte nur über Unerledigt',
  openWork: 'Spalte über offene Buchungen',
  exported: 'Spalte über exportierte Buchungen',
  emptyFolder: 'Spalte über einen leeren Ordner',
  emptyFolderAndStatus: 'Spalte über einen leeren Ordner und den Status',
  excludedEmptyFolder: 'Spalte mit Ausschluss über einen leeren Ordner',
  tagOrEmptyFolder: 'Spalte über ein Tag oder einen leeren Ordner',
});

/**
 * Fährt den festen Bestand durch den Dienst.
 *
 * Rückgabe: eine Liste von Aufzeichnungen `{ operationId, method, path,
 * status, body, hasBody, label }`. `path` ist die **Schablone** der
 * Beschreibung (`/todos/{todoId}`), nicht die angefahrene Adresse — sonst
 * fände sich die Operation in der Beschreibung nicht wieder.
 */
export async function runScenario() {
  const directory = mkdtempSync(join(tmpdir(), 'takt-proof-openapi-'));

  /*
   * Zwei Dateien für die Anhänge, vom Durchlauf selbst angelegt und mit ihm
   * gelöscht — kein Verweis auf einen Pfad des Entwicklungsrechners
   * (`docs/testplan.md` Abschnitt 25, Testdaten).
   *
   * Das PNG ist das kleinste gültige: acht Bytes Signatur, danach eine
   * Kopfeinheit. Es muß nicht anzeigbar sein — geprüft wird die
   * **Kopfsignatur** (A-A-16), und genau die trägt es.
   */
  const filePath = join(directory, 'beispiel-anhang.txt');
  writeFileSync(filePath, 'Beispieltext eines Dateianhangs.\n');

  const imagePath = join(directory, 'beispiel-bild.png');
  writeFileSync(
    imagePath,
    Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG-Signatur
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00,
    ]),
  );

  // Eine gestellte Uhr. Der Timer braucht vergehende Zeit, und eine echte Uhr
  // machte den Lauf entweder langsam oder von der Maschine abhängig.
  let clockMs = Date.parse('2026-03-02T09:00:00Z');
  const tick = (seconds) => {
    clockMs += seconds * 1000;
  };

  const service = compose({
    port: PORT,
    store: memoryStore(),
    sessionSecret: SECRET,
    windowsUser: 't.beispiel',
    databaseLocation: ':memory:',
    clock: () => new Date(clockMs),
    timeZone: 'Europe/Berlin',
    /*
     * Der Ort der Bildkopien (E-071 Punkt 2, A-A-17). Ohne ihn gäbe es keine
     * Bildanhänge, und `getTodoAttachmentImage` bliebe im Durchlauf ohne
     * Erfolgsfall — Abschnitt 6 würde rot, und zwar zu Recht: Eine Operation,
     * die niemand anfährt, ist eine, deren Gestalt niemand mißt.
     *
     * Es ist derselbe Wegwerfordner wie für den Export. Beide werden am Ende
     * gelöscht; der Bestand liegt im Arbeitsspeicher und überlebt den Lauf
     * ohnehin nicht.
     */
    appDataDir: directory,
    // Die Protokollzeilen dieses Laufs gehören nicht in die Ausgabe des
    // Nachweispfads; sie sind hier kein Befund, sondern Rauschen.
    logger: { request: () => {}, lifecycle: () => {} },
  });
  await service.database.migrations.migrateToLatest();

  const records = [];

  /** Eine Anfrage durch die vollständige Kette, mit Nachweis und Herkunft. */
  async function call(method, path, body, options = {}) {
    const headers = { Host: `127.0.0.1:${PORT}` };
    if (options.origin !== null) headers['Origin'] = options.origin ?? UI_ORIGIN;
    if (options.token !== null) headers[options.tokenHeader ?? 'X-Takt-Token'] = options.token ?? SECRET;
    const init = { method, headers };
    if (options.contentType !== undefined) {
      // Für die Prüfung des Inhaltstyps: ein Rumpf mit falscher Ansage.
      headers['Content-Type'] = options.contentType;
      init.body = 'kein JSON';
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const response = await service.app.request(`http://127.0.0.1:${PORT}${API_BASE_PATH}${path}`, init);
    const text = await response.text();
    let json;
    let parsed = false;
    try {
      json = JSON.parse(text);
      parsed = true;
    } catch {
      /* 204 und leere Antworten */
    }
    const seen = {};
    response.headers.forEach((value, name) => {
      seen[name.toLowerCase()] = value;
    });
    return { status: response.status, body: json, headers: seen, hasBody: parsed && text.length > 0, text };
  }

  /**
   * Ruft auf **und** legt die Antwort zur Prüfung ab.
   *
   * `template` ist der Pfad, wie ihn die Beschreibung führt. Wer ihn vergisst,
   * bekommt keinen stillen blinden Fleck: `proof-openapi.mjs` sucht die
   * Operation über `operationId` und wird rot, wenn sie nicht zu finden ist.
   */
  async function record(operationId, method, template, url, body, options) {
    const result = await call(method, url, body, options);
    records.push({
      operationId,
      method,
      path: template,
      status: result.status,
      body: result.body,
      headers: result.headers,
      hasBody: result.hasBody,
      text: result.text,
    });
    return result;
  }

  // Ein stiller Aufruf: er baut Bestand auf, wird aber nicht geprüft, weil
  // dieselbe Operation an anderer Stelle schon aufgezeichnet ist.
  const quiet = (method, path, body) => call(method, path, body);

  try {
    // -----------------------------------------------------------------------
    // Zugriff und Auskunft
    // -----------------------------------------------------------------------
    await record('health', 'GET', '/health', '/health');
    /*
     * Die Versionspruefung (A-18.2, E-069).
     *
     * Sie antwortet hier `state: 'unknown'`, und das ist der Beleg fuer die
     * tragende Eigenschaft: `compose()` baut den Pruefer, **startet** ihn aber
     * nicht. Kein Nachweispfad und kein Pruefflauf schickt dadurch ein
     * Lebenszeichen an GitHub (R-19 Punkt 3). Die Route loest ohnehin nie eine
     * Anfrage aus (A-V-10) -- sie liest ab.
     */
    await record('getVersionCheck', 'GET', '/version-check', '/version-check');
    await record('getTokenStatus', 'GET', '/token', '/token');
    await record('rotateToken', 'POST', '/token', '/token');
    await record('getSecurityNotices', 'GET', '/security/notices', '/security/notices');

    // -----------------------------------------------------------------------
    // Ordner, Tags, Pools (A-3, A-4)
    // -----------------------------------------------------------------------
    const rootFolder = await record('createTagFolder', 'POST', '/tag-folders', '/tag-folders', {
      name: 'Mandant Beispiel',
    });
    const rootFolderId = rootFolder.body.data.id;

    const subFolder = await quiet('POST', '/tag-folders', { name: 'Unterordner', parentId: rootFolderId });
    const subFolderId = subFolder.body.data.id;

    await record(
      'updateTagFolder',
      'PATCH',
      '/tag-folders/{folderId}',
      `/tag-folders/${subFolderId}`,
      { name: 'Unterordner, umbenannt' },
    );
    await record(
      'moveTagFolder',
      'POST',
      '/tag-folders/{folderId}/move',
      `/tag-folders/${subFolderId}/move`,
      { newParentId: null },
    );

    const tag = await record('createTag', 'POST', '/tags', '/tags', {
      name: 'Beratung',
      folderId: rootFolderId,
      color: '#2563eb',
    });
    const tagId = tag.body.data.id;

    await record('updateTag', 'PATCH', '/tags/{tagId}', `/tags/${tagId}`, { name: 'Beratung (neu)' });
    await record('listTags', 'GET', '/tags', '/tags');
    await record('getTagTree', 'GET', '/tag-tree', '/tag-tree');

    const pool = await record('createPool', 'POST', '/pools', '/pools', {
      name: 'Offene Beratung',
      matchMode: 'any',
      includeSubfolders: true,
      position: 0,
      rule: [{ kind: 'tag', tagId }],
    });
    const poolId = pool.body.data.id;

    await record('updatePool', 'PATCH', '/pools/{poolId}', `/pools/${poolId}`, { name: 'Offene Beratung (neu)' });

    /**
     * Derselbe Name ein zweites Mal (T-074).
     *
     * Die Beschreibung verspricht für `createPool` seit jeher einen `409`. Der
     * Dienst antwortete bis T-074 mit `500`, und dieser Durchlauf hat es nicht
     * gemerkt, weil er den Fall nie ausgelöst hat — genau der Vorbehalt, der im
     * Kopf von `proof-openapi.mjs` steht: „ein Fehlerfall, den niemand
     * herbeiführt, bleibt unbeschrieben messbar falsch".
     *
     * Deshalb hier zweimal ausgelöst, für beide Richtungen: eine neue Regel mit
     * einem vergebenen Namen, und eine vorhandene Regel, die auf einen
     * vergebenen Namen umbenannt werden soll.
     */
    await record('createPool', 'POST', '/pools', '/pools', {
      name: 'Offene Beratung (neu)',
      rule: [{ kind: 'tag', tagId }],
    });
    const secondPool = await quiet('POST', '/pools', { name: 'Zweite Beratung', rule: [] });
    await record(
      'updatePool',
      'PATCH',
      '/pools/{poolId}',
      `/pools/${secondPool.body.data.id}`,
      { name: 'offene beratung (neu)' },
    );

    await record('listPools', 'GET', '/pools', '/pools');

    // -----------------------------------------------------------------------
    // Kanban-Spalten (A-5)
    // -----------------------------------------------------------------------
    const statuses = await record('listTodoStatuses', 'GET', '/todo-statuses', '/todo-statuses');
    const statusId = statuses.body.data[0].id;
    // Ein zweiter, den kein Todo dieses Durchlaufs trägt. Er ist die Gegenprobe
    // zur Statusachse (T-076): Eine Spalte über ihn muss **leer** sein.
    const unusedStatusId = statuses.body.data[1].id;

    // `color` geht mit (T-051): Die Route hat den Schlüssel bis dahin still
    // verworfen, während die Oberfläche ihn sendete. Der Durchlauf schickt ihn
    // deshalb mit, und `proof-openapi.mjs` sieht in der Antwort nach, ob er
    // ankommt — ein stilles Abstreifen sähe sonst wieder wie Erfolg aus.
    const extraStatus = await record('createTodoStatus', 'POST', '/todo-statuses', '/todo-statuses', {
      name: 'Wartet auf Rückruf',
      color: STATUS_COLOR,
      position: 9,
    });
    const extraStatusId = extraStatus.body.data.id;

    await record(
      'updateTodoStatus',
      'PATCH',
      '/todo-statuses/{statusId}',
      `/todo-statuses/${extraStatusId}`,
      { name: 'Wartet', color: '#a16207' },
    );
    const allStatuses = await quiet('GET', '/todo-statuses');
    await record('reorderTodoStatuses', 'PUT', '/todo-statuses/order', '/todo-statuses/order', {
      order: allStatuses.body.data.map((entry) => entry.id).reverse(),
    });
    await record(
      'deleteTodoStatus',
      'DELETE',
      '/todo-statuses/{statusId}',
      `/todo-statuses/${extraStatusId}`,
    );

    // -----------------------------------------------------------------------
    // Todos, Vermerk, Erledigt (A-2, A-7)
    // -----------------------------------------------------------------------
    const todo = await record('createTodo', 'POST', '/todos', '/todos', {
      title: 'Akte 4711 — Schriftsatz',
      callNumber: 'C-4711-2026',
      statusId,
      tagIds: [tagId],
      note: INTERNAL_NOTE,
      // Die Frist (A-19.1). Ein erfundener Tag weit genug in der Zukunft, daß
      // er sich in einer Exportdatei sofort erkennen ließe — genau das ist der
      // Punkt: A-19.17 verlangt, daß er dort **nicht** auftaucht.
      dueDate: DUE_DATE,
    });
    const todoId = todo.body.data.todo.id;

    await record('getTodo', 'GET', '/todos/{todoId}', `/todos/${todoId}`);
    await record('updateTodo', 'PATCH', '/todos/{todoId}', `/todos/${todoId}`, {
      title: 'Akte 4711 — Schriftsatz (überarbeitet)',
      // Die Frist ändern. `null` an dieser Stelle hieße „entfernen" (A-19.3);
      // der Unterschied zwischen den beiden ist der Grund, warum das Feld
      // `nullable` und nicht bloß freiwillig ist.
      dueDate: DUE_DATE_CHANGED,
    });

    /*
     * -----------------------------------------------------------------------
     * Anhänge (A-19.8 bis A-19.15)
     * -----------------------------------------------------------------------
     *
     * Alle drei Arten, weil sie sich nicht nur im Etikett unterscheiden:
     * Verweis und Datei speichern eine Zeichenkette, ein Bild wird kopiert
     * (E-071 Punkt 1 und 2). Die Adresse geht **roh** hinein und kommt
     * **normalisiert** zurück — `HTTP://Beispiel.EXAMPLE/…` wird zu
     * `http://beispiel.example/…` (A-A-3); der Durchlauf mißt damit
     * nebenbei, daß die Normalisierung überhaupt greift.
     */
    const linkAttachment = await record(
      'addTodoAttachment',
      'POST',
      '/todos/{todoId}/attachments',
      `/todos/${todoId}/attachments`,
      { kind: 'link', url: 'HTTP://Beispiel.EXAMPLE/Anhang', title: 'Beispielverweis' },
    );

    // Ohne Titel — dann trägt `label` etwas Lesbares aus dem Pfad (A-19.12).
    await quiet('POST', `/todos/${todoId}/attachments`, {
      kind: 'file',
      path: filePath,
    });

    const imageAttachment = await quiet('POST', `/todos/${todoId}/attachments`, {
      kind: 'image',
      sourcePath: imagePath,
      title: 'Beispielbild',
    });

    await record(
      'listTodoAttachments',
      'GET',
      '/todos/{todoId}/attachments',
      `/todos/${todoId}/attachments`,
    );

    await record(
      'getTodoAttachmentImage',
      'GET',
      '/todos/{todoId}/attachments/{attachmentId}/image',
      `/todos/${todoId}/attachments/${imageAttachment.body.data.id}/image`,
    );

    await record(
      'removeTodoAttachment',
      'DELETE',
      '/todos/{todoId}/attachments/{attachmentId}',
      `/todos/${todoId}/attachments/${linkAttachment.body.data.id}`,
    );
    await record('getTodoNote', 'GET', '/todos/{todoId}/note', `/todos/${todoId}/note`);
    await record('putTodoNote', 'PUT', '/todos/{todoId}/note', `/todos/${todoId}/note`, {
      text: INTERNAL_NOTE,
    });
    await record('markTodoDone', 'PUT', '/todos/{todoId}/done', `/todos/${todoId}/done`);
    await record('clearTodoDone', 'DELETE', '/todos/{todoId}/done', `/todos/${todoId}/done`);
    await record('listPoolTodos', 'GET', '/pools/{poolId}/todos', `/pools/${poolId}/todos`);
    await record('searchTodos', 'GET', '/todos', '/todos');

    const second = await quiet('POST', '/todos', {
      title: 'Akte 4712 — Telefonat',
      callNumber: 'C-4712-2026',
      statusId,
      tagIds: [tagId],
      note: '',
    });
    const secondTodoId = second.body.data.todo.id;

    // -----------------------------------------------------------------------
    // Kanban-Board: Spalten sind Regeln (A-5.3, A-5.4, E-054)
    //
    // Vier Spalten, und der Bestand ist so gewählt, dass genau der Fall
    // eintritt, den es vor E-054 nicht geben konnte: **dieselbe Karte in
    // mehreren Spalten**. Sie trägt zwei Tags, beide liegen im selben Ordner;
    // die Spalte über das Tag, die Spalte über den Ordner und die Spalte über
    // beide Tags treffen sie deshalb alle drei.
    //
    // `proof-openapi.mjs` Abschnitt 11 misst daran zweierlei: dass die Karte
    // wirklich in jeder dieser Spalten steht, und dass `appearances` — von
    // `matchesPool` in der Domäne gebildet — genau dieselben Spalten nennt, die
    // die Abfrage geliefert hat. Laufen die beiden auseinander, zeigt das Board
    // eine Karte und behauptet daneben, sie stünde dort nicht.
    // -----------------------------------------------------------------------
    const boardTag = await quiet('POST', '/tags', { name: 'Rückfrage', folderId: rootFolderId });
    const boardTagId = boardTag.body.data.id;
    await quiet('PATCH', `/todos/${todoId}`, { tagIds: [tagId, boardTagId] });

    // Angelegt wird **mit** `record`: Ein stillschweigend abgestreiftes
    // `placement` sähe sonst wie Erfolg aus — dieselbe Falle wie die Farbe
    // einer Spalte in T-051. Abschnitt 11 sieht in der Antwort nach.
    await record('createPool', 'POST', '/pools', '/pools', {
      name: BOARD_COLUMNS.tag,
      placement: 'board',
      position: 21,
      rule: [{ kind: 'tag', tagId }],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.folder,
      placement: 'board',
      includeSubfolders: true,
      position: 22,
      rule: [{ kind: 'folder', folderId: rootFolderId }],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.both,
      placement: 'board',
      matchMode: 'any',
      position: 23,
      rule: [
        { kind: 'tag', tagId },
        { kind: 'tag', tagId: boardTagId },
      ],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.empty,
      placement: 'board',
      position: 24,
      rule: [],
    });

    // -----------------------------------------------------------------------
    // Die fünf Achsen aus T-076, jede als eigene Spalte
    //
    // Der Bestand ist so gewählt, dass die Antworten nicht zufällig richtig
    // sein können: Beide Todos tragen `statusId`, aber nur eines trägt
    // `boardTagId`. Damit muss `status` **beide** enthalten, `mixed` **eines**
    // und `excluded` das **andere** — drei verschiedene Mengen aus demselben
    // Bestand, und keine davon ist die Tagspalte.
    // -----------------------------------------------------------------------
    await record('createPool', 'POST', '/pools', '/pools', {
      name: BOARD_COLUMNS.status,
      placement: 'board',
      position: 25,
      rule: [],
      statusIds: [statusId],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.otherStatus,
      placement: 'board',
      position: 26,
      rule: [],
      statusIds: [unusedStatusId],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.mixed,
      placement: 'board',
      position: 27,
      rule: [{ kind: 'tag', tagId: boardTagId }],
      statusIds: [statusId],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.excluded,
      placement: 'board',
      position: 28,
      rule: [{ kind: 'tag', tagId }],
      excludedTags: [{ kind: 'tag', tagId: boardTagId }],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.done,
      placement: 'board',
      position: 29,
      rule: [],
      completion: 'done',
    });
    // Dieselbe Achse in die andere Richtung (E-058). Sie ist die Spalte, die
    // ein Timerstart auf einem erledigten Todo **betritt**, während er `done`
    // verlässt — zwei Hälften einer Bewegung, und beide werden gemessen.
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.openOnly,
      placement: 'board',
      position: 36,
      rule: [],
      completion: 'open',
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.openWork,
      placement: 'board',
      position: 30,
      rule: [],
      exportState: 'open',
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.exported,
      placement: 'board',
      position: 31,
      rule: [],
      exportState: 'exported',
    });

    // Ein Ordner, in dem kein Tag liegt — und eine Spalte, die ihn nennt
    // (T-080). Von außen sieht sie aus wie jede andere Regel; erst
    // `resolved.tagCount` sagt, dass ihre einzige Bedingung ins Leere zeigt.
    const barrenFolder = await quiet('POST', '/tag-folders', { name: 'Ordner ohne Tags' });
    const barrenFolderId = barrenFolder.body.data.id;
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.emptyFolder,
      placement: 'board',
      includeSubfolders: true,
      position: 32,
      rule: [{ kind: 'folder', folderId: barrenFolderId }],
    });

    // -----------------------------------------------------------------------
    // Derselbe leere Ordner, aber **nicht allein** (E-057)
    //
    // Die Spalte darüber besteht nur aus dem Ordnerterm; sie ist nach dem
    // Auflösen leer und trifft schon deshalb nichts (A-3.4). Der Fall, um den
    // es in T-082 geht, ist dieser hier: Der Ordnerterm steht **neben** einer
    // zweiten Achse. Bis T-082 fiel er aus der Regel heraus — die aufgelöste
    // Tagmenge war leer, und eine leere Tagmenge galt als Neutralwert —, und
    // aus „Tags aus dem leeren Ordner **und** Status" wurde „Status": zwei
    // Karten statt keiner, in der Abfrage wie in der Domäne.
    //
    // Die Gegenprobe steht daneben und ist die andere Hälfte von E-057: Ein
    // **Ausschluß** über denselben leeren Ordner schließt nichts aus. Die
    // Spalte führt deshalb genau dieselben Karten wie die Spalte über das Tag
    // allein — „keiner davon" über nichts läßt in Ruhe, statt einzuengen.
    // -----------------------------------------------------------------------
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.emptyFolderAndStatus,
      placement: 'board',
      includeSubfolders: true,
      position: 33,
      rule: [{ kind: 'folder', folderId: barrenFolderId }],
      statusIds: [statusId],
    });
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.excludedEmptyFolder,
      placement: 'board',
      includeSubfolders: true,
      position: 34,
      rule: [{ kind: 'tag', tagId }],
      excludedTags: [{ kind: 'folder', folderId: barrenFolderId }],
    });

    // Der Fall, den die Achsensumme nicht sieht (E-057, termweise): ein
    // **Tagterm neben** dem leeren Ordner, im Modus „mindestens eines davon".
    // `resolved.tagCount` ist hier **1** — der Tagterm steuert seinen Tag bei —,
    // und trotzdem trifft die Spalte nichts: Der Benutzer hat den Ordner
    // genannt, weil er ihn meint. Achsenweise gemessen bliebe der leere Ordner
    // unsichtbar, die Spalte zeigte die Tag-Karten, und sobald jemand einen Tag
    // in den Ordner legt, änderte sie sich ohne ersichtlichen Grund.
    await quiet('POST', '/pools', {
      name: BOARD_COLUMNS.tagOrEmptyFolder,
      placement: 'board',
      includeSubfolders: true,
      matchMode: 'any',
      position: 35,
      rule: [
        { kind: 'tag', tagId },
        { kind: 'folder', folderId: barrenFolderId },
      ],
    });

    await record('getBoard', 'GET', '/board', '/board');
    // Und die Fläche, auf der der ursprüngliche Pool **nicht** steht.
    await record('listPools', 'GET', '/pools', '/pools?placement=board');

    // -----------------------------------------------------------------------
    // Timer (A-6). Beide Ausgänge des Starts, beide Ausgänge des Stopps.
    // -----------------------------------------------------------------------
    await record('getRunningTimer', 'GET', '/timer', '/timer');
    await record('startTimer', 'POST', '/timer/start', '/timer/start', { todoId });
    tick(180);
    await record('getRunningTimer', 'GET', '/timer', '/timer', undefined);
    await record('touchTimerHeartbeat', 'POST', '/timer/heartbeat', '/timer/heartbeat', {});
    await record('getOrphanedTimer', 'GET', '/timer/orphaned', '/timer/orphaned');

    // Der zweite Start bei laufendem Timer: 200 und `confirmation_required`.
    // Das ist der Befund aus T-039, und er ist ab hier gemessen.
    await record('startTimer', 'POST', '/timer/start', '/timer/start', { todoId: secondTodoId });
    await record('stopTimer', 'POST', '/timer/stop', '/timer/stop', { note: 'Schriftsatz entworfen' });

    // Der verworfene Stopp: Start und Stopp ohne vergehende Zeit.
    await quiet('POST', '/timer/start', { todoId });
    await record('stopTimer', 'POST', '/timer/stop', '/timer/stop', { note: '' });

    // Die verwaiste Buchung (E-036): ein laufender Timer, dann aufgelöst.
    await quiet('POST', '/timer/start', { todoId: secondTodoId });
    tick(600);
    await quiet('POST', '/timer/heartbeat');
    tick(120);
    await record('getOrphanedTimer', 'GET', '/timer/orphaned', '/timer/orphaned');
    await record('resolveOrphanedTimer', 'POST', '/timer/orphaned/resolve', '/timer/orphaned/resolve', {
      resolution: 'book_until_heartbeat',
    });

    // -----------------------------------------------------------------------
    // Zeitbuchungen (A-6.1, A-7.3)
    // -----------------------------------------------------------------------
    const entry = await record('createTimeEntry', 'POST', '/time-entries', '/time-entries', {
      todoId,
      startedAt: '2026-03-02T08:00:00Z',
      endedAt: '2026-03-02T08:45:00Z',
      note: 'Akteneinsicht',
    });
    const entryId = entry.body.data.id;

    await record('getTimeEntry', 'GET', '/time-entries/{timeEntryId}', `/time-entries/${entryId}`);
    await record('updateTimeEntry', 'PATCH', '/time-entries/{timeEntryId}', `/time-entries/${entryId}`, {
      note: 'Akteneinsicht und Vermerk',
    });
    await record('searchTimeEntries', 'GET', '/time-entries', '/time-entries');
    // Der Tagesfilter, mit einem Ortstag (E-025, T-042). Die Zone des Laufs ist
    // Europe/Berlin, der Bestand liegt am 2. März — die Antwort darf nicht leer
    // sein, sonst zieht die Tagesgrenze wieder an der falschen Stelle.
    await record(
      'searchTimeEntries',
      'GET',
      '/time-entries',
      '/time-entries?fromDay=2026-03-02&toDay=2026-03-02',
    );
    await record('searchEverything', 'GET', '/search', '/search?q=Akte');

    // -----------------------------------------------------------------------
    // Vorlagen, Vorschau, Lauf (A-8, E-049, E-051)
    // -----------------------------------------------------------------------
    const definition = {
      version: 1,
      fields: [
        { name: 'Call', source: 'todo.callNumber', transformation: 'raw' },
        { name: 'Zeit', source: 'group.quarters', transformation: 'quarter_hours_to_number' },
        { name: 'Leistung', source: 'group.bookingNotes', transformation: 'raw' },
      ],
    };

    const template = await record('createExportTemplate', 'POST', '/export/templates', '/export/templates', {
      name: 'Kanzleiabrechnung',
      definition,
    });
    const templateId = template.body.data.id;

    await record(
      'updateExportTemplate',
      'PATCH',
      '/export/templates/{templateId}',
      `/export/templates/${templateId}`,
      { name: 'Kanzleiabrechnung (März)' },
    );
    await record('listExportTemplates', 'GET', '/export/templates', '/export/templates');
    await record('listExportSources', 'GET', '/export/sources', '/export/sources');
    await record('previewExport', 'POST', '/export/preview', '/export/preview', { templateId });
    await record('previewExport', 'POST', '/export/preview', '/export/preview', { definition });

    await record('updateSettings', 'PATCH', '/settings', '/settings', {
      exportDirectory: directory,
      activeExportTemplateId: templateId,
      roundingMode: 'up',
      locale: 'de-DE',
      theme: 'dark',
      // A-18.10 — mit fuehrendem `v` hereingegeben. Zurueck kommt `9.9.9`:
      // Das `v` faellt an genau einer Stelle, in `packages/domain`.
      skippedVersion: 'v9.9.9',
    });
    await record('getSettings', 'GET', '/settings', '/settings');
    await record('setDefaultTags', 'PUT', '/settings/default-tags', '/settings/default-tags', {
      tagIds: [tagId],
    });
    await record('listDefaultTags', 'GET', '/settings/default-tags', '/settings/default-tags');

    const run = await record('runExport', 'POST', '/export/runs', '/export/runs', { templateId });
    const runId = run.body?.data?.run?.id;
    await record('listExportRuns', 'GET', '/export/runs', '/export/runs');
    if (runId !== undefined) {
      await record('getExportRun', 'GET', '/export/runs/{runId}', `/export/runs/${runId}`);
    }
    await record('listExportAudit', 'GET', '/export/audit', '/export/audit');
    // Die beiden Filter (T-042). `exportRunId` beantwortet „welche Buchungen
    // waren in diesem Lauf?" vollständig statt nur so weit, wie geladen ist.
    if (runId !== undefined) {
      await record(
        'listExportAudit',
        'GET',
        '/export/audit',
        `/export/audit?exportRunId=${runId}`,
      );
    }
    await record('listExportAudit', 'GET', '/export/audit', `/export/audit?timeEntryId=${entryId}`);

    // Exportstatus zurücksetzen und „nicht abrechnen" (E-012, E-047)
    await record(
      'resetExportStatus',
      'PUT',
      '/time-entries/{timeEntryId}/export-status',
      `/time-entries/${entryId}/export-status`,
      { status: 'open', reason: 'Falsche Vorlage gewählt' },
    );
    await record(
      'markTimeEntryNotBilled',
      'POST',
      '/time-entries/{timeEntryId}/not-billed',
      `/time-entries/${entryId}/not-billed`,
      { reason: 'Kulanz' },
    );

    // -----------------------------------------------------------------------
    // Die schmale Fläche des Add-ins (T-019)
    // -----------------------------------------------------------------------
    await record('getAddinContext', 'GET', '/addin/context', '/addin/context');
    await record(
      'findAddinDuplicates',
      'GET',
      '/addin/todo-matches',
      '/addin/todo-matches?callNumber=C-4711-2026',
    );
    const addinTodo = await record('createAddinTodo', 'POST', '/addin/todos', '/addin/todos', {
      title: 'Aus der E-Mail übernommen',
      callNumber: 'C-4713-2026',
      tagIds: [],
      note: INTERNAL_NOTE,
    });
    const addinTodoId = addinTodo.body?.data?.todo?.id;
    if (addinTodoId !== undefined) {
      // Erst erledigt setzen, damit die Buchung ihre Wirkung zeigen kann:
      // `doneCleared` und `poolMovement` stehen dann nicht auf ihrem Ruhewert.
      // (Bis T-104 hießen die drei Listen `poolNames`, `enteringPoolNames`
      // und `leavingPoolNames`; seit E-061 Punkt 3 ist es **ein** Feld in der
      // Gestalt, die auch die Timer-Routen liefern.)
      await quiet('PUT', `/todos/${addinTodoId}/done`);
      await record(
        'createAddinTimeEntry',
        'POST',
        '/addin/todos/{todoId}/time-entries',
        `/addin/todos/${addinTodoId}/time-entries`,
        { startedAt: '2026-03-02T10:00:00Z', endedAt: '2026-03-02T10:30:00Z', note: 'Telefonat' },
      );
    }

    // -----------------------------------------------------------------------
    // Die Buchung von Hand, die **erste** eines Todos (E-061 Nachtrag, O-V)
    //
    // Der Aufruf oben bei „Zeitbuchungen" bucht auf `todoId`, und das Todo hat
    // zu diesem Zeitpunkt längst eine abgeschlossene Buchung aus dem Timer.
    // Dort ist `poolMovement` deshalb `null` — der Normalfall, und er ist
    // gemessen. Was dort **nicht** zu messen war, ist der Fall, um den es geht:
    // die erste Buchung überhaupt. Sie setzt „hat offene Buchungen", und jede
    // Regel mit `exportState: 'open'` nimmt das Todo damit auf.
    //
    // Ein eigenes, frisches Todo dafür, und zwar hier und nicht weiter oben:
    // Der Exportlauf ist vorbei, die neue offene Buchung verändert also keinen
    // Bestand, über den bereits berichtet wurde. Der Bestand danach wird
    // gelesen und nicht angenommen — `GET /time-entries` und `GET /board`
    // stehen unmittelbar darunter.
    // -----------------------------------------------------------------------
    const untouched = await quiet('POST', '/todos', {
      title: 'Akte 4714 — Nachtrag von Hand',
      callNumber: 'C-4714-2026',
      statusId,
      tagIds: [],
      note: '',
    });
    await record('createTimeEntry', 'POST', '/time-entries', '/time-entries', {
      todoId: untouched.body.data.todo.id,
      startedAt: '2026-03-02T14:00:00Z',
      endedAt: '2026-03-02T14:20:00Z',
      note: 'Nachgetragen',
    });

    // -----------------------------------------------------------------------
    // Das Board ein **zweites** Mal — jetzt mit Buchungen und mit Erledigt
    //
    // Die drei Achsen `done`, `openWork` und `exported` (T-076) konnten beim
    // ersten Lesen nichts zeigen: Zu diesem Zeitpunkt gab es weder eine
    // Buchung noch eine erledigte Karte. Eine Spalte, die leer ist, weil es
    // nichts zu zeigen gibt, misst nichts — sie sähe genauso aus wie eine
    // Spalte, deren Achse gar nicht wirkt.
    //
    // Deshalb hier, nach Timer, Buchungen und Exportlauf, noch einmal. Und
    // `secondTodoId` wird vorher erledigt: Ohne eine erledigte Karte bliebe
    // `done` wieder leer, und der Fall, den diese Spalte trägt — die Regel
    // geht der Ansichtseinstellung `includeCompleted=false` vor —, wäre
    // ungemessen.
    //
    // Der Bestand der Buchungen wird nicht angenommen, sondern gelesen:
    // `GET /time-entries` ist der zweite, unabhängige Weg zu derselben
    // Auskunft, und `proof-openapi.mjs` hält die beiden gegeneinander.
    // -----------------------------------------------------------------------
    await quiet('PUT', `/todos/${secondTodoId}/done`);
    await record('searchTimeEntries', 'GET', '/time-entries', '/time-entries?limit=100');
    await record('getBoard', 'GET', '/board', '/board');

    // -----------------------------------------------------------------------
    // Die Bewegung durch die Pools, die ein Timerstart auslöst (E-058)
    //
    // Der Start hebt „Erledigt" auf (A-2.5). Seit E-055 ist das keine
    // Nebensache mehr: Eine Spalte ist eine Regel, und eine Regel kann nach
    // „Erledigt" fragen. Die Karte verlässt also eine Spalte und betritt eine
    // andere — und bis E-058 stand an dieser Stelle in beiden Oberflächen der
    // Satz „Die Karte bleibt, wo sie ist".
    //
    // Der Bestand ist so gewählt, dass die Antwort nicht zufällig richtig sein
    // kann: `secondTodoId` ist **erledigt** (die Zeile darüber), es gibt eine
    // Spalte `completion: 'done'` und eine `completion: 'open'`, und daneben
    // steht eine Spalte über einen **leeren Ordner** (E-057), die in keiner der
    // drei Listen vorkommen darf. Abschnitt 15 misst alle drei.
    //
    // Anschließend wird der Timer ohne vergehende Zeit gestoppt: Die Buchung
    // ist kürzer als eine Sekunde und wird verworfen (A-6.2). Der Bestand steht
    // danach wieder so da wie vorher, bis auf das aufgehobene Kennzeichen —
    // und das ist die Wirkung, um die es geht.
    // -----------------------------------------------------------------------
    await record('startTimer', 'POST', '/timer/start', '/timer/start', { todoId: secondTodoId });
    await quiet('POST', '/timer/stop', { note: '' });

    // Die Gegenprobe zur Bewegung: derselbe Start ein zweites Mal, jetzt auf
    // einem Todo, das **nicht** erledigt ist und schon Buchungen hat. Es hebt
    // kein Kennzeichen auf und lässt keine erste Buchung entstehen — also
    // `poolMovement: null` und nicht drei leere Listen.
    await record('startTimer', 'POST', '/timer/start', '/timer/start', { todoId });

    // Der **Stopp** bewegt ebenfalls (E-058 Punkt 6, T-093), und zwar an genau
    // einer Achse: Die erste abgeschlossene, offene Buchung setzt „hat offene
    // Buchungen", und die Spalte über offene Buchungen nimmt das Todo damit auf.
    //
    // Der Zeitpunkt ist mit Bedacht **nach** dem Exportlauf: Der hat die
    // bisherigen Buchungen von `todoId` auf `exported` gesetzt, „hat offene
    // Buchungen" steht also wieder auf falsch. Diese zwei Minuten sind damit
    // erneut die erste offene Buchung — und die Karte betritt die Spalte.
    tick(120);
    await record('stopTimer', 'POST', '/timer/stop', '/timer/stop', { note: 'Rückfrage geklärt' });

    // Und die Gegenprobe zum Stopp: **noch einmal dasselbe**, unmittelbar
    // danach. Es entsteht wieder eine echte Buchung von zwei Minuten — kein
    // Doppelklick, kein verworfener Stopp —, und trotzdem bewegt sich nichts:
    // „hat offene Buchungen" steht seit der Zeile darüber auf wahr, und keine
    // Regel urteilt anders als vorher. Die Antwort ist `null`.
    //
    // Ohne diese Aufzeichnung wäre Abschnitt 15 auch an einer Fassung grün, die
    // die Sparsamkeitsbedingung wegläßt und bei **jedem** Stopp alle Regeln
    // auflöst: Sie lieferte dann drei leere Listen statt `null`. Das ist der
    // Unterschied zwischen „hier war keine Bewegung möglich" und „nachgesehen
    // und nichts gefunden" — und die drei leeren Listen kosten die Auflösung
    // jedes Ordnerbaums, für nichts.
    await quiet('POST', '/timer/start', { todoId });
    tick(120);
    await record('stopTimer', 'POST', '/timer/stop', '/timer/stop', { note: 'Nachtrag zur Akte' });

    // -----------------------------------------------------------------------
    // Löschen. Jeweils an einem eigens dafür angelegten Stück, damit der
    // erfolgreiche Ausgang (204) gemessen wird und nicht ein Konflikt.
    // -----------------------------------------------------------------------
    const spareEntry = await quiet('POST', '/time-entries', {
      todoId,
      startedAt: '2026-03-01T08:00:00Z',
      endedAt: '2026-03-01T08:30:00Z',
      note: 'Wird gelöscht',
    });
    await record(
      'deleteTimeEntry',
      'DELETE',
      '/time-entries/{timeEntryId}',
      `/time-entries/${spareEntry.body.data.id}`,
    );

    const spareTodo = await quiet('POST', '/todos', { title: 'Wird gelöscht', tagIds: [], note: '' });
    await record('deleteTodo', 'DELETE', '/todos/{todoId}', `/todos/${spareTodo.body.data.todo.id}`);

    const spareTag = await quiet('POST', '/tags', { name: 'Wird gelöscht' });
    await record('deleteTag', 'DELETE', '/tags/{tagId}', `/tags/${spareTag.body.data.id}`);

    const spareFolder = await quiet('POST', '/tag-folders', { name: 'Wird gelöscht' });
    await record(
      'deleteTagFolder',
      'DELETE',
      '/tag-folders/{folderId}',
      `/tag-folders/${spareFolder.body.data.id}`,
    );

    await record('deletePool', 'DELETE', '/pools/{poolId}', `/pools/${poolId}`);

    // Die Vorlage ist noch die aktive; erst umstellen, dann löschen.
    const builtin = await quiet('GET', '/export/templates');
    const builtinId = builtin.body.data.find((entry) => entry.isBuiltin === true).id;
    await quiet('PATCH', '/settings', { activeExportTemplateId: builtinId });
    const spareTemplate = await quiet('POST', '/export/templates', {
      name: 'Wird gelöscht',
      definition,
    });
    await record(
      'deleteExportTemplate',
      'DELETE',
      '/export/templates/{templateId}',
      `/export/templates/${spareTemplate.body.data.id}`,
    );

    // -----------------------------------------------------------------------
    // Die Abweisungen.
    //
    // Sie stehen hier nicht der Vollständigkeit halber. Eine beschriebene
    // Fehlerantwort ist das, wogegen jede Fehleranzeige der Oberfläche gebaut
    // wird — und sie ist der Teil der Beschreibung, den im Normalbetrieb
    // niemand zu Gesicht bekommt. Genau dort hält sich eine Falschaussage am
    // längsten. Der Statuscode zählt dabei so viel wie der Rumpf: Eine
    // Beschreibung, die 409 verspricht und 200 bekommt, führt zu einer
    // Oberfläche, die einen Fehlerfall behandelt, den es nicht gibt, und den
    // echten nicht (T-039, `POST /timer/start`).
    // -----------------------------------------------------------------------
    const unknownId = '01931f4e-0000-7000-8000-0000000000ff';

    // 404 — es gibt das Ding nicht.
    await record('getTodo', 'GET', '/todos/{todoId}', `/todos/${unknownId}`);
    await record('getTimeEntry', 'GET', '/time-entries/{timeEntryId}', `/time-entries/${unknownId}`);
    await record('getExportRun', 'GET', '/export/runs/{runId}', `/export/runs/${unknownId}`);
    await record('startTimer', 'POST', '/timer/start', '/timer/start', { todoId: unknownId });

    // 422 — gelesen und für unzulässig befunden.
    await record('createTodo', 'POST', '/todos', '/todos', { title: '   ' });
    // Seit T-046 weist die Add-in-Fläche eine unplausible Call-Nummer ab,
    // statt sie anzunehmen und unauffindbar zu machen (E-045, R-15). Die
    // Beschreibung führte das Gegenteil als Absicht; sie ist mit T-041
    // nachgezogen, und dieser Aufruf hält sie ab jetzt daran fest.
    await record('createAddinTodo', 'POST', '/addin/todos', '/addin/todos', {
      title: 'Unplausible Call-Nummer',
      callNumber: `TCK-${'0'.repeat(70)}`,
      tagIds: [],
      note: '',
    });
    await record('previewExport', 'POST', '/export/preview', '/export/preview', {
      definition: { version: 1, fields: [{ name: 'X', source: 'todo.note', transformation: 'raw' }] },
    });
    await record('runExport', 'POST', '/export/runs', '/export/runs', { templateId, definition });
    await record('updateSettings', 'PATCH', '/settings', '/settings', {
      exportDirectory: join(directory, 'gibt-es-nicht'),
    });

    // 409 — der Bestand steht dagegen.
    await record('deleteTag', 'DELETE', '/tags/{tagId}', `/tags/${tagId}`);

    /*
     * Ein **leerer** Ordner, den eine Regel nennt (R-1 Befund 1, E-057).
     *
     * `barrenFolderId` enthält kein Tag — er wäre also nach der Inhaltsprüfung
     * löschbar, und bis T-089 war er das auch. Drei Spalten nennen ihn; das
     * Löschen nahm ihre Terme still mit, und aus „Tags aus dem leeren Ordner
     * **und** Status" wurde „Status". Die Regel traf danach mehr, als der
     * Benutzer gesagt hatte.
     *
     * Der erfolgreiche Ausgang derselben Route steht weiter oben an einem
     * eigens angelegten Ordner: Beide Ausgänge werden gemessen, nicht nur der
     * bequeme.
     */
    await record(
      'deleteTagFolder',
      'DELETE',
      '/tag-folders/{folderId}',
      `/tag-folders/${barrenFolderId}`,
    );
    await record('stopTimer', 'POST', '/timer/stop', '/timer/stop', { note: '' });

    // Und der Gegenprobe halber: das Lebenszeichen **ohne** laufenden Timer.
    // Es ist ausdrücklich kein Fehler (E-036, `usecases/timer.ts`), und bis
    // T-041 stand in der Beschreibung dafür ein `409`, das es nie gab.
    await record('touchTimerHeartbeat', 'POST', '/timer/heartbeat', '/timer/heartbeat', {});
    await record(
      'moveTagFolder',
      'POST',
      '/tag-folders/{folderId}/move',
      `/tag-folders/${rootFolderId}/move`,
      { newParentId: rootFolderId },
    );
    await record(
      'resetExportStatus',
      'PUT',
      '/time-entries/{timeEntryId}/export-status',
      `/time-entries/${entryId}/export-status`,
      { status: 'open', reason: 'Schon offen' },
    );
    await quiet('PATCH', '/settings', { activeExportTemplateId: templateId });

    // Zwei weitere Läufe, und die Uhr rückt zwischen ihnen vor: Der Dateiname
    // trägt den Zeitpunkt auf die Sekunde genau (`exportFileName`), und zwei
    // Läufe in derselben Sekunde schrieben in dieselbe Datei. Der erste räumt
    // die noch offenen Buchungen ab, der zweite findet nichts mehr vor —
    // `409 export_nothing_to_do`, der Fall, in dem die Oberfläche „nichts zu
    // exportieren" anzeigen muss statt einer Störung.
    tick(3600);
    await record('runExport', 'POST', '/export/runs', '/export/runs', { templateId });
    tick(3600);
    await record('runExport', 'POST', '/export/runs', '/export/runs', { templateId });

    // Die Kette selbst: kein Nachweis, fremde Herkunft, Geheimnis in der
    // Adresse, falscher Inhaltstyp.
    await record('health', 'GET', '/health', '/health', undefined, { token: null });
    await record('health', 'GET', '/health', '/health', undefined, { origin: 'https://fremde.example' });
    await record('health', 'GET', '/health', `/health?token=${SECRET}`);
    await record('createTodo', 'POST', '/todos', '/todos', undefined, { contentType: 'text/plain' });

    // Der Ordner ist weg, während er eingestellt bleibt (R-11). Zuletzt, weil
    // es der einzige Schritt ist, der etwas außerhalb des Bestands verändert.
    await quiet('PATCH', '/settings', { exportDirectory: directory });
    rmSync(directory, { recursive: true, force: true });
    tick(3600);
    await record('getSettings', 'GET', '/settings', '/settings');
    await record('runExport', 'POST', '/export/runs', '/export/runs', { templateId });

    return { records, directory };
  } finally {
    service.database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}
