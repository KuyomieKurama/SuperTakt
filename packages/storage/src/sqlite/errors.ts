/**
 * Takt — SQLite-Meldungen in fachliche Fehler übersetzen
 * (architektur.md 5.4, ecc:error-handling).
 *
 * ```
 *    Speicherung             Domäne                      HTTP
 *    RAISE(ABORT,'…')    ►   TaktError                ►  Statuscode
 *    UNIQUE ux_…_running     'timer_already_running'     409
 *    CHECK duration          'validation_error'          422
 * ```
 *
 * Die Übersetzung geschieht an **genau einer** Stelle. Genau deshalb tragen die
 * Trigger im Schema absichtlich dieselben Zeichenketten wie die Fehlerkennungen
 * der Domäne (`time_entry_locked`, `append_only`,
 * `builtin_template_immutable`): Der Weg von der Datenbank bis in die Antwort
 * ist damit ohne Übersetzungstabelle nachvollziehbar.
 *
 * ---------------------------------------------------------------------------
 * Was hier **nicht** passiert
 * ---------------------------------------------------------------------------
 *
 * Die ursprüngliche SQLite-Meldung wird nie weitergereicht. Sie enthält
 * Tabellen-, Spalten- und Indexnamen, also Innenleben der Datenbank, und
 * B-2.4 verbietet das in einer Antwort. Sie geht in `details` nicht ein und in
 * `message` nicht: Die Texte hier sind Konstanten.
 *
 * Was nicht zugeordnet werden kann, wird `storage_error` — und zwar mit
 * demselben Text wie jede andere unbekannte Störung. Ein „unbekannter
 * Constraint XY" in einer Antwort wäre eine Einladung, das Schema von außen
 * abzutasten.
 */

import type { TaktError, TaktErrorCode } from '@takt/domain';
import { taktError } from '@takt/domain';

/**
 * Kennzeichen einer SQLite-Störung, wie `node:sqlite` sie wirft.
 *
 * Es wird bewusst strukturell geprüft und nicht auf eine Klasse: Die
 * Fehlerklasse von `node:sqlite` ist nicht exportiert, und ein `instanceof`
 * gegen eine nicht benennbare Klasse wäre eine Behauptung ohne Prüfung.
 */
interface SqliteFailure {
  readonly message: string;
  readonly code?: unknown;
  readonly errcode?: unknown;
}

function asFailure(error: unknown): SqliteFailure | null {
  if (typeof error !== 'object' || error === null) return null;
  const candidate = error as { message?: unknown; code?: unknown; errcode?: unknown };
  if (typeof candidate.message !== 'string') return null;
  return {
    message: candidate.message,
    code: candidate.code,
    errcode: candidate.errcode,
  };
}

/**
 * Zeichenketten, die ein `RAISE(ABORT, …)` im Schema auslöst, und ihre
 * fachliche Entsprechung.
 *
 * `append_only` hat keinen eigenen Fehlerschlüssel in der Domäne und bekommt
 * auch keinen. Der Versuch, eine Protokollzeile zu ändern, ist kein fachlicher
 * Fall, den ein Aufrufer behandeln könnte — es gibt keinen Anwendungsfall, der
 * das täte. Er wird `storage_error` und landet damit als 500 im Protokoll, wo
 * er hingehört.
 */
const RAISED: Readonly<Record<string, { readonly code: TaktErrorCode; readonly message: string }>> =
  Object.freeze({
    time_entry_locked: {
      code: 'time_entry_locked',
      message:
        'Diese Zeitbuchung ist bereits exportiert und damit gesperrt. Setzen Sie den Exportstatus zurück, wenn Sie sie ändern wollen.',
    },
    builtin_template_immutable: {
      code: 'builtin_template_immutable',
      message:
        'Die mitgelieferte Standardvorlage lässt sich weder ändern noch löschen. Legen Sie eine Kopie an.',
    },
    timer_not_running: {
      code: 'timer_not_running',
      message: 'Es läuft kein Timer.',
    },
  });

/**
 * Eindeutige Indizes, deren Verletzung einen eigenen fachlichen Namen hat.
 *
 * ---------------------------------------------------------------------------
 * Warum jeder Eintrag **zwei** Suchbegriffe haben kann (T-074)
 * ---------------------------------------------------------------------------
 *
 * Bis T-074 stand hier je Eintrag ein Suchbegriff, und zwar der **Indexname**.
 * Sieben der zwölf Einträge waren damit unerreichbar, ohne dass es jemandem
 * auffiel — SQLite nennt den Indexnamen nämlich nur manchmal. Gemessen mit
 * `node:sqlite`:
 *
 * ```
 *   CREATE UNIQUE INDEX ux_a ON t (pos);                   → "…failed: t.pos"
 *   CREATE UNIQUE INDEX ux_b ON t (name COLLATE NOCASE);   → "…failed: t.name"
 *   CREATE UNIQUE INDEX ux_c ON t (a, b, c);               → "…failed: t.a, t.b, t.c"
 *   CREATE UNIQUE INDEX ux_d ON t (COALESCE(x,'~'), name); → "…failed: index 'ux_d'"
 *   CREATE UNIQUE INDEX ux_e ON t ((1)) WHERE flag = 1;    → "…failed: index 'ux_e'"
 * ```
 *
 * Die Regel dahinter: Nur ein Index über einen **Ausdruck** oder mit einer
 * **WHERE-Bedingung** trägt seinen Namen in der Meldung. Ein Index über nackte
 * Spalten nennt die Spalten — auch dann, wenn eine Kollation danebensteht.
 * `COLLATE NOCASE` ist keine Rechnung, sondern eine Vergleichsvorschrift.
 *
 * Die Folge war sichtbar: `ux_pool_name` und `ux_todo_status_name` fielen
 * beide in die allgemeine Aussage „Dieser Wert ist bereits vergeben“, während
 * hier zwei genauere Sätze standen, die nie jemand zu lesen bekam.
 *
 * Deshalb trägt jeder Eintrag jetzt **beide** Formen: den Indexnamen und die
 * Spaltenliste. Nicht aus Bequemlichkeit — welche der beiden SQLite wählt,
 * hängt an der Gestalt des Index, und die kann sich mit einer Migration ändern.
 * Bekäme `ux_pool_name` eines Tages einen Ausdruck (etwa `COALESCE(...)` für
 * eine zweite Fläche), spränge die Meldung von `pool.name` auf `index
 * 'ux_pool_name'` — und ein Eintrag mit nur einer Form fiele still auf die
 * allgemeine Auskunft zurück. Genau dieser stille Rückfall ist der Befund,
 * gegen den dieser Absatz geschrieben ist.
 *
 * `proof:conflicts` löst jeden dieser Indizes gegen eine echte migrierte
 * Datenbank aus und misst, dass er hier ankommt — statt es zu behaupten.
 *
 * Gelesen wird die Meldung von SQLite hier, **ausgegeben** wird sie nie.
 */
const UNIQUE_INDEX: readonly {
  /** Der Indexname, wie er im Schema steht. Nur zur Zuordnung, nie in einer Antwort. */
  readonly index: string;
  /**
   * Die Spaltenliste, wie SQLite sie nennt (`tabelle.spalte`).
   *
   * Bei einem mehrspaltigen Index genügt die erste — die Meldung führt sie alle
   * durch Komma getrennt auf.
   */
  readonly columns: readonly string[];
  readonly code: TaktErrorCode;
  readonly message: string;
}[] = Object.freeze([
  {
    index: 'ux_time_entry_running',
    columns: [],
    code: 'timer_already_running',
    message: 'Es läuft bereits ein Timer. Er muss zuerst gestoppt werden.',
  },
  {
    // Seit E-054 ist `todo_status` der **Status** eines Todos und keine
    // Kanban-Spalte mehr. Der Satz sagt das jetzt auch; bis T-074 sprach er von
    // einer Spalte, und niemand hat es gemerkt, weil ihn niemand zu sehen bekam.
    index: 'ux_todo_status_name',
    columns: ['todo_status.name'],
    code: 'name_conflict',
    message: 'Einen Status mit diesem Namen gibt es bereits.',
  },
  {
    index: 'ux_todo_status_position',
    columns: ['todo_status.position'],
    code: 'conflict',
    message: 'Diese Reihenfolge der Status ist nicht eindeutig.',
  },
  {
    index: 'ux_todo_status_default',
    columns: [],
    code: 'conflict',
    message: 'Es kann nur einen Standardstatus geben.',
  },
  {
    index: 'ux_tag_folder_name',
    columns: [],
    code: 'name_conflict',
    message: 'In diesem Ordner gibt es bereits einen Unterordner mit diesem Namen.',
  },
  {
    index: 'ux_tag_name',
    columns: [],
    code: 'name_conflict',
    message: 'In diesem Ordner gibt es bereits ein Tag mit diesem Namen.',
  },
  {
    // Der Wettlaufschutz aus 0008. Er fehlte hier bis T-074 ganz: Zwei
    // gleichzeitige Anlagen desselben Tagnamens ergaben „Dieser Wert ist
    // bereits vergeben“ statt des Satzes darüber. Sein Satz ist
    // zeichengleich mit dem von `ux_tag_name` — die beiden Indizes sagen
    // dasselbe, der eine nur strenger. Welcher zuerst zuschlägt, darf der
    // Benutzer nicht merken.
    index: 'ux_tag_name_key',
    columns: [],
    code: 'name_conflict',
    message: 'In diesem Ordner gibt es bereits ein Tag mit diesem Namen.',
  },
  {
    // „Regel“ und nicht „Pool“: Seit E-054 ist eine Kanban-Spalte dieselbe
    // Entität, und wer eine Spalte anlegt, soll nicht über einen Pool belehrt
    // werden. Der Satz nennt den Grund mit, weil er sonst rätselhaft ist —
    // die Spalte, die den Namen belegt, steht womöglich gar nicht auf der
    // Fläche, auf der man gerade arbeitet.
    index: 'ux_pool_name',
    columns: ['pool.name'],
    code: 'name_conflict',
    message:
      'Eine Regel mit diesem Namen gibt es bereits. Pools und Kanban-Spalten teilen sich die Namen, auch wenn sie auf verschiedenen Flächen stehen.',
  },
  {
    index: 'ux_pool_position',
    columns: ['pool.position'],
    code: 'conflict',
    message: 'Diese Reihenfolge der Regeln ist nicht eindeutig.',
  },
  {
    // Kein Widerspruch zum Zustand, sondern eine unbrauchbare Eingabe: Wer
    // denselben Regelteil zweimal schickt, hat eine Regel geschickt, die es so
    // nicht gibt. 422 sagt das, 409 lüde zum Wiederholen ein.
    index: 'ux_pool_rule',
    columns: [],
    code: 'validation_error',
    message: 'Derselbe Regelteil steht zweimal in dieser Regel.',
  },
  {
    index: 'ux_export_template_name',
    columns: ['export_template.name'],
    code: 'name_conflict',
    message: 'Eine Exportvorlage mit diesem Namen gibt es bereits.',
  },
  {
    index: 'ux_export_template_builtin',
    columns: [],
    code: 'conflict',
    message: 'Es kann nur eine mitgelieferte Standardvorlage geben.',
  },
  {
    index: 'ux_default_tag_position',
    columns: ['default_tag.position'],
    code: 'conflict',
    message: 'Diese Reihenfolge der Standard-Tags ist nicht eindeutig.',
  },
  {
    index: 'ux_export_run_group',
    columns: ['export_run_group.export_run_id'],
    code: 'conflict',
    message: 'Dieselbe Tagesgruppe steht zweimal im selben Exportlauf.',
  },
]);

/**
 * Die Zuordnung, von außen lesbar — **nur für `proof:conflicts`**.
 *
 * Der Prüflauf liest die eindeutigen Indizes aus `sqlite_master` einer
 * migrierten Datenbank und hält sie hiergegen: Ein neuer Index ohne Eintrag
 * wird rot, ein Eintrag ohne Index ebenso, und für jeden Indexnamen wird
 * gemessen, dass genau **sein** Satz zurückkommt und nicht der eines Nachbarn,
 * dessen Name in seinem steckt.
 *
 * Kein Weg nach außen: Diese Werte gehen in keine HTTP-Antwort. Was in eine
 * Antwort geht, entscheidet `fail` im Dienst, und das ist `code` und `message`
 * eines `TaktError` — nie ein Indexname (B-2.4).
 */
export const UNIQUE_INDEX_CATALOG: readonly {
  readonly index: string;
  readonly code: TaktErrorCode;
  readonly message: string;
}[] = Object.freeze(
  UNIQUE_INDEX.map((entry) =>
    Object.freeze({ index: entry.index, code: entry.code, message: entry.message }),
  ),
);

/**
 * Kommt `token` in der Meldung als **ganzer** Bezeichner vor?
 *
 * Ein blankes `includes` reichte hier nicht, und zwar an einer einzigen, aber
 * echten Stelle: `ux_tag_name` ist eine Teilzeichenkette von `ux_tag_name_key`.
 * Beide tragen denselben Satz, die Verwechslung wäre also heute folgenlos —
 * aber sie wäre eine Falle für den nächsten Eintrag, der zufällig mit dem Namen
 * eines anderen beginnt.
 *
 * Ein Bezeichner endet in einer SQLite-Meldung am Zeilenende, an einem
 * Hochkomma (`index 'ux_…'`), an einem Komma (mehrspaltiger Index) oder an
 * einem Leerzeichen.
 */
function mentions(message: string, token: string): boolean {
  let from = 0;
  for (;;) {
    const at = message.indexOf(token, from);
    if (at < 0) return false;
    const after = message.charAt(at + token.length);
    if (after === '' || after === "'" || after === ',' || after === ' ') return true;
    from = at + 1;
  }
}

interface GenericFailure {
  readonly code: TaktErrorCode;
  readonly message: string;
}

const GENERIC = Object.freeze({
    check: {
      code: 'validation_error',
      message: 'Die Eingabe verletzt eine Regel der Speicherung.',
    },
    foreign: {
      code: 'validation_error',
      message: 'Ein verwiesener Datensatz existiert nicht oder wird noch benutzt.',
    },
    restrict: {
      code: 'conflict',
      message: 'Dieser Datensatz wird noch verwendet und kann nicht entfernt werden.',
    },
    unique: {
      code: 'name_conflict',
      message: 'Dieser Wert ist bereits vergeben.',
    },
    unknown: {
      code: 'storage_error',
      message: 'Die Speicherung konnte den Vorgang nicht ausführen.',
    },
  }) satisfies Readonly<Record<string, GenericFailure>>;

/**
 * Übersetzt eine geworfene Störung in einen fachlichen Fehlerwert — oder
 * `null`, wenn es gar keine Störung der Speicherung ist.
 *
 * Diese Fassung wirft nicht. Sie ist für den einen Aufrufer da, der die Frage
 * **stellen** muss, statt sie schon beantwortet zu haben: die Fehlerbehandlung
 * am HTTP-Rand (`app.ts`, T-074). Dort kommt an, was kein Adapter als Wert
 * gemeldet hat, und dort muss zwischen „Programmierfehler“ und „die Datenbank
 * hat eine Regel durchgesetzt“ unterschieden werden.
 */
export function asStorageFailure(error: unknown): TaktError | null {
  const failure = asFailure(error);
  if (failure === null || failure.code !== 'ERR_SQLITE_ERROR') return null;

  const message = failure.message;

  const raised = RAISED[message.trim()];
  if (raised !== undefined) {
    return taktError(raised.code, raised.message);
  }

  if (message.includes('UNIQUE constraint failed')) {
    for (const entry of UNIQUE_INDEX) {
      const hit =
        mentions(message, entry.index) ||
        entry.columns.some((column) => mentions(message, column));
      if (hit) return taktError(entry.code, entry.message);
    }
    // Ein eindeutiger Index ohne eigenen Eintrag oben. Die allgemeine Aussage
    // ist richtig und verrät nichts; `proof:conflicts` sorgt dafür, dass kein
    // Index des Schemas hier landet.
    return taktError(GENERIC.unique.code, GENERIC.unique.message);
  }

  if (message.includes('FOREIGN KEY constraint failed')) {
    return taktError(GENERIC.foreign.code, GENERIC.foreign.message);
  }

  if (message.includes('CHECK constraint failed')) {
    return taktError(GENERIC.check.code, GENERIC.check.message);
  }

  return taktError(GENERIC.unknown.code, GENERIC.unknown.message);
}

/**
 * Übersetzt eine geworfene Störung in einen fachlichen Fehlerwert.
 *
 * Ist die Störung **keine** SQLite-Störung, wird sie weitergeworfen. Ein
 * Programmierfehler soll ein Programmierfehler bleiben und nicht als 409 in
 * einer Oberfläche landen, wo ihn niemand mehr findet.
 */
export function translateSqliteError(error: unknown): TaktError {
  const failure = asStorageFailure(error);
  if (failure === null) throw error;
  return failure;
}

/**
 * Führt eine schreibende Anweisung aus und liefert das Ergebnis als Wert.
 *
 * Der Grund, warum das hier steht und nicht in jedem Adapter: Ein `try/catch`
 * je Schreibvorgang wird irgendwann einmal vergessen, und dann kommt eine
 * SQLite-Meldung mit Tabellennamen bis in eine Antwort. Diese Hülle ist die
 * eine Stelle, an der die Übersetzung geschieht.
 */
export function attempt<T>(work: () => T): { ok: true; value: T } | { ok: false; error: TaktError } {
  try {
    return { ok: true, value: work() };
  } catch (error) {
    return { ok: false, error: translateSqliteError(error) };
  }
}
