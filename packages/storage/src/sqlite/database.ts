/**
 * Takt — die Verbindung zu SQLite (E-003, E-035).
 *
 * Dies ist die einzige Datei im Projekt, die `node:sqlite` einbindet. Alles
 * darüber arbeitet gegen `SqlConnection`, und diese Schnittstelle beschreibt
 * genau das, was die Adapter brauchen: vorbereitete Anweisungen, ein `exec`
 * für Migrationen, und Schließen.
 *
 * ---------------------------------------------------------------------------
 * Warum `node:sqlite` und keine Fremdbibliothek
 * ---------------------------------------------------------------------------
 *
 * E-035. Der Sidecar wird als eigenständige Binärdatei gebündelt (E-044); eine
 * Bibliothek mit nativer Erweiterung müsste dabei mitgeschleppt und je
 * Plattform gebaut werden. `node:sqlite` liegt in der Laufzeit, die ohnehin
 * mitgeliefert wird, und ist damit ein Teil weniger in der Lieferkette
 * (pnpm-workspace.yaml, „Takt hält Kundendaten").
 *
 * ---------------------------------------------------------------------------
 * Synchron unter einer asynchronen Fläche
 * ---------------------------------------------------------------------------
 *
 * `node:sqlite` ist bewusst synchron. Die Ports in `ports.ts` geben trotzdem
 * `Promise` zurück — nicht aus Bequemlichkeit, sondern weil sie den Adapter
 * austauschbar halten sollen (E-001, „zumindest derzeit"). Ein Adapter gegen
 * einen Dienst wäre zwangsläufig asynchron; wäre die Portfläche synchron,
 * müsste bei einem Wechsel jeder Aufrufer umgeschrieben werden.
 *
 * Die Folge ist wichtig und steht deshalb hier und nicht in einer Fußnote:
 * Zwischen zwei `await` in einem Anwendungsfall kann die Ereignisschleife eine
 * **andere** Anfrage bedienen. Innerhalb einer offenen SQLite-Transaktion auf
 * derselben Verbindung wäre das ein zweiter Schreiber in derselben Klammer.
 * `unit-of-work.ts` verhindert es mit einer Reihung; die Begründung steht dort.
 */

import { chmodSync, statSync } from 'node:fs';
import { DatabaseSync, type StatementSync } from 'node:sqlite';

/** Ein Wert, wie er aus einer Spalte kommt oder in einen Parameter geht. */
export type SqlValue = string | number | bigint | null | Uint8Array;

/** Eine Zeile. Der Aufrufer weiß, welche Spalten er ausgewählt hat. */
export type SqlRow = Record<string, SqlValue>;

/**
 * Eine vorbereitete Anweisung.
 *
 * Ausschließlich mit Platzhaltern zu benutzen. Es gibt in diesem Paket keine
 * Stelle, an der ein Wert in SQL eingesetzt wird — jeder Wert, der aus einer
 * Anfrage stammt, geht als Parameter. Das ist die einzige wirksame Maßnahme
 * gegen Einschleusung, und sie ist hier keine Sorgfaltsfrage, sondern die
 * einzige angebotene Bauform.
 */
export interface SqlStatement {
  all(...params: readonly SqlValue[]): SqlRow[];
  get(...params: readonly SqlValue[]): SqlRow | undefined;
  run(...params: readonly SqlValue[]): { readonly changes: number };
}

export interface SqlConnection {
  prepare(sql: string): SqlStatement;
  /** Nur für Migrationen und Transaktionsbefehle. Nie mit fremdem Text. */
  exec(sql: string): void;
  close(): void;
}

/**
 * Einstellungen, die bei **jedem** Öffnen gesetzt werden.
 *
 * `foreign_keys` merkt sich SQLite nicht in der Datei und wirkt nicht innerhalb
 * einer offenen Transaktion — deshalb steht es hier und nicht irgendwo später.
 * Ohne diese Zeile gälten weder `ON DELETE CASCADE` noch `ON DELETE RESTRICT`,
 * und `trg_time_entry_no_delete_exported` wäre die einzige verbleibende Sperre
 * gegen das Löschen abgerechneter Zeit.
 *
 * `synchronous = FULL` statt des schnelleren `NORMAL`: An dieser Datei hängt
 * eine Abrechnung. Der Unterschied kostet Millisekunden je Schreibvorgang und
 * kauft die Zusage, dass ein festgeschriebener Exportlauf einen Stromausfall
 * übersteht.
 */
export const CONNECTION_PRAGMAS: readonly string[] = Object.freeze([
  'PRAGMA journal_mode = WAL;',
  'PRAGMA foreign_keys = ON;',
  'PRAGMA synchronous = FULL;',
  'PRAGMA busy_timeout = 5000;',
  // Ohne diese Zeile schreibt SQLite Fremdschlüsselverstöße erst beim COMMIT
  // — mitten im Festschreiben eines Exportlaufs ist das der denkbar
  // schlechteste Zeitpunkt für eine Überraschung.
  'PRAGMA defer_foreign_keys = OFF;',
  // B-7.4 Punkt 4. Nimmt einem Schema, das nicht von uns stammt, die Fähigkeit,
  // beim bloßen Öffnen etwas auszuführen — über einen Ausdruck in einem Index,
  // einer Sicht oder einem Trigger. Die Ausnutzbarkeit ist heute gering
  // (Erweiterungen sind im Treiber aus, `ATTACH` kommt nirgends vor), und die
  // Datei ist trotzdem eine, die kopiert, gesichert und zurückgespielt wird.
  'PRAGMA trusted_schema = OFF;',
]);

/**
 * Rechte, mit denen die Datenbankdatei liegen soll (B-7.2, S-03 aus T-023).
 *
 * Derselbe Wert wie für Token und Zertifikat im lokalen Dienst. Er steht hier
 * ausgeschrieben und nicht als Import: `packages/storage` hängt an keinem
 * Anwendungspaket, und diese Zahl ist eine Eigenschaft der Datei, nicht des
 * Dienstes.
 */
export const DATABASE_FILE_MODE = 0o600;

/** Die drei Dateien, die SQLite im WAL-Betrieb nebeneinander hält. */
const companionSuffixes: readonly string[] = ['', '-wal', '-shm'];

/**
 * Setzt die Rechte der Datenbankdatei und ihrer Nachbarn auf {@link DATABASE_FILE_MODE}.
 *
 * ---------------------------------------------------------------------------
 * Warum das eine eigene Handlung ist
 * ---------------------------------------------------------------------------
 *
 * T-023 hat gemessen: Verzeichnis `0700`, Tokendatei `0600`, Zertifikat `0600`
 * — und `takt.db`, `takt.db-wal`, `takt.db-shm` mit `0644`. SQLite legt seine
 * Dateien mit `0644 & ~umask` an und fragt niemanden.
 *
 * Auf POSIX hält das Verzeichnis mit `0700` die Grenze, solange die Datei
 * darin liegt. Aber **der Modus wandert mit der Datei**: Jede Sicherung, jede
 * Kopie zur Fehlersuche, jeder Umzug in einen weiter gesetzten Ordner ist
 * danach für jeden lesbar. Und in der Datenbank steht mehr als im Export —
 * dort steht auch der interne Vermerk (A-7.2, RR-2).
 *
 * Unter Windows sagt der POSIX-Modus nichts; dort trägt die geerbte ACL von
 * `%LOCALAPPDATA%`. Das ist im Bericht zu T-011 als benannte Lücke geführt und
 * bleibt es — deshalb geschieht hier auf `win32` nichts, statt eine Wirkung
 * vorzutäuschen.
 *
 * **Fehlschläge sind still.** Ein Dateisystem ohne POSIX-Rechte (FAT, ein
 * eingehängter Netzspeicher) lässt `chmod` scheitern; das darf den Start nicht
 * verhindern. Sichtbar wird ein zu weiter Modus stattdessen über
 * {@link inspectDatabasePermissions} — messen und melden ist die richtige
 * Antwort auf „ging nicht", nicht abbrechen.
 */
export function secureDatabaseFiles(location: string): void {
  if (process.platform === 'win32' || location === ':memory:' || location === '') return;
  for (const suffix of companionSuffixes) {
    try {
      chmodSync(`${location}${suffix}`, DATABASE_FILE_MODE);
    } catch {
      // Datei existiert noch nicht (`-wal` und `-shm` entstehen erst mit der
      // ersten Transaktion) oder das Dateisystem kennt keine Rechte.
    }
  }
}

/**
 * Meldet, welche der drei Dateien weiter liegen als {@link DATABASE_FILE_MODE}.
 *
 * Für die sichtbare Warnung beim Start (B-7.2 Punkt 3). Gibt Pfade zurück und
 * keinen Text: Was der Benutzer liest, entscheidet der Dienst.
 *
 * ===========================================================================
 * „Nicht messbar" ist ein dritter Ausgang und keine Entwarnung (T-143 S-4)
 * ===========================================================================
 *
 * Bis T-146 gab es hier zwei Ausgänge: `checked: false` (Windows,
 * Arbeitsspeicher) und `checked: true` mit einer Liste. Jeder gescheiterte
 * `statSync` wurde dazwischen mit `catch {}` verschluckt — Kommentar: „Nicht
 * vorhanden heißt nicht zu weit."
 *
 * Der Satz stimmt für `ENOENT` und für nichts sonst. Liegt das
 * Anwendungsdatenverzeichnis auf einem Dateisystem, auf dem `stat` mit
 * `EACCES` oder `EIO` scheitert — eine eingehängte Freigabe, ein
 * Container-Bind-Mount mit engem `x`-Recht auf dem Elternordner —, dann blieb
 * `tooPermissive` leer, `checked` war `true`, und `GET /settings` zeigte
 * **0**: „alle drei Dateien liegen eng", obwohl **nichts gemessen** wurde.
 *
 * Das ist wörtlich der Fall, den `ports.ts` bei
 * `SystemPort.databaseFilesTooPermissive` ausschließt: „`null` ist
 * ausdrücklich **nicht** `0` — eine Nichtaussage ist keine Entwarnung." Vor
 * T-132 hing an demselben `catch` nur eine Protokollzeile; seit die Zahl in
 * den Einstellungen steht, ist es eine Entwarnung ohne Messung.
 *
 * Deshalb wird der Fehlschlag jetzt **unterschieden**:
 *
 * | Was `statSync` sagt | Was das heißt | Ausgang |
 * |---|---|---|
 * | Erfolg, Modus zu weit | gemessen | Pfad in `tooPermissive` |
 * | Erfolg, Modus eng | gemessen | nichts |
 * | `ENOENT` | die Datei gibt es (noch) nicht — `-wal` und `-shm` entstehen erst mit der ersten Transaktion | nichts, und das ist eine Aussage |
 * | alles andere | **nicht messbar** | `unmeasured` wächst |
 *
 * Und `checked` ist nur dann `true`, wenn **jede** der drei Dateien eine
 * Antwort gegeben hat. Eine einzige nicht messbare macht die ganze Auskunft zu
 * einer Nichtaussage — denn welche der drei offen liegt, weiß man dann nicht,
 * und „zwei von drei sind eng" ist keine Entwarnung für die dritte.
 */
export function inspectDatabasePermissions(location: string): {
  readonly checked: boolean;
  readonly tooPermissive: readonly string[];
  /** Die Dateien, über die sich nichts sagen ließ. Leer heißt: alle gemessen. */
  readonly unmeasured: readonly string[];
} {
  if (process.platform === 'win32' || location === ':memory:' || location === '') {
    return { checked: false, tooPermissive: [], unmeasured: [] };
  }
  const wide: string[] = [];
  const unmeasured: string[] = [];
  for (const suffix of companionSuffixes) {
    const path = `${location}${suffix}`;
    try {
      if ((statSync(path).mode & 0o777 & ~DATABASE_FILE_MODE) !== 0) wide.push(path);
    } catch (error) {
      /*
       * **Der Grund wird gelesen, nicht der Wurf.** `ENOENT` ist die Antwort
       * „gibt es nicht", und die ist eine Messung: `-wal` und `-shm` entstehen
       * erst mit der ersten Transaktion, und was es nicht gibt, liegt nicht zu
       * weit.
       *
       * Jeder andere Grund — `EACCES`, `EIO`, `ELOOP`, `ENOTDIR` — heißt
       * „konnte nicht nachsehen". Ihn wie `ENOENT` zu behandeln wäre die
       * Entwarnung ohne Messung.
       */
      if (errorCodeOf(error) === 'ENOENT') continue;
      unmeasured.push(path);
    }
  }
  return { checked: unmeasured.length === 0, tooPermissive: wide, unmeasured };
}

/**
 * Der `code` an einem Systemfehler — oder `null`, wenn keiner dransteht.
 *
 * Vier Zeilen und keine Zusicherung: `unknown` in `catch` ist der Schalter
 * `useUnknownInCatchVariables`, und ein `as NodeJS.ErrnoException` wäre eine
 * Behauptung über einen Wert, den irgendjemand geworfen hat.
 */
function errorCodeOf(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const code: unknown = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

/**
 * Öffnet eine Verbindung und setzt die Einstellungen.
 *
 * `location` darf `':memory:'` sein; genau das benutzen die Prüfpfade. Der
 * Dienst übergibt den Pfad aus dem Anwendungsdatenverzeichnis (E-018) und
 * niemals einen Wert aus einer Anfrage (B-1.6 Punkt 1).
 */
export function openConnection(location: string): SqlConnection {
  const db = new DatabaseSync(location);
  for (const pragma of CONNECTION_PRAGMAS) {
    db.exec(pragma);
  }
  // Erst hier und nicht vorher: `journal_mode = WAL` legt `-wal` und `-shm`
  // überhaupt erst an. Dieser Durchgang holt eine Datei ein, die aus einer
  // früheren Fassung mit `0644` daliegt. Damit **künftige** Nachbardateien gar
  // nicht erst zu weit entstehen, setzt der Dienst zusätzlich seine `umask`
  // (`apps/local-api/src/main.ts`) — SQLite legt `-wal` und `-shm` im Betrieb
  // wiederholt neu an (B-7.2, S-03 aus T-023).
  secureDatabaseFiles(location);
  return wrap(db);
}

/**
 * Hüllt eine `DatabaseSync` in `SqlConnection` und hält vorbereitete
 * Anweisungen fest.
 *
 * Der Zwischenspeicher ist kein Feinschliff: Ohne ihn übersetzt SQLite jede
 * Abfrage bei jedem Aufruf neu, und der Baumaufbau in `loadTree` oder die
 * rekursive Vorfahrensuche in `ancestors` führen dieselbe Anweisung je Ebene
 * aus. Der Schlüssel ist der SQL-Text selbst — er ist in diesem Paket immer
 * eine Konstante, nie zusammengesetzt aus Eingaben.
 */
function wrap(db: DatabaseSync): SqlConnection {
  const cache = new Map<string, StatementSync>();

  const statement = (sql: string): StatementSync => {
    const cached = cache.get(sql);
    if (cached !== undefined) return cached;
    const prepared = db.prepare(sql);
    cache.set(sql, prepared);
    return prepared;
  };

  return {
    prepare(sql: string): SqlStatement {
      return {
        all: (...params) => statement(sql).all(...(params as never[])) as SqlRow[],
        get: (...params) => statement(sql).get(...(params as never[])) as SqlRow | undefined,
        run: (...params) => {
          const result = statement(sql).run(...(params as never[]));
          return { changes: Number(result.changes) };
        },
      };
    },
    exec(sql: string): void {
      // Nach `exec` kann sich das Schema geändert haben (Migrationen legen
      // Tabellen an und wieder ab). Vorbereitete Anweisungen auf das alte
      // Schema wären danach still falsch, also fallen sie.
      cache.clear();
      db.exec(sql);
    },
    close(): void {
      cache.clear();
      db.close();
    },
  };
}

// ---------------------------------------------------------------------------
// Auslesen einzelner Spalten — mit Aussage statt mit Vermutung
// ---------------------------------------------------------------------------

/**
 * `noUncheckedIndexedAccess` macht jeden Spaltenzugriff zu `SqlValue |
 * undefined`. Diese Helfer machen daraus einen Wert **oder** einen lauten
 * Fehler. Ein stiller Rückfall auf `''` oder `0` wäre hier besonders teuer:
 * Eine Spalte, die unerwartet fehlt, ergäbe sonst eine Buchung mit Dauer 0
 * oder einen leeren Benutzernamen im Export.
 */
export function text(row: SqlRow, column: string): string {
  const value = row[column];
  if (typeof value !== 'string') {
    throw new Error(`Spalte ${column} ist kein Text.`);
  }
  return value;
}

export function textOrNull(row: SqlRow, column: string): string | null {
  const value = row[column];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new Error(`Spalte ${column} ist weder Text noch NULL.`);
  }
  return value;
}

export function integer(row: SqlRow, column: string): number {
  const value = row[column];
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  throw new Error(`Spalte ${column} ist keine Zahl.`);
}

export function boolean(row: SqlRow, column: string): boolean {
  return integer(row, column) !== 0;
}

/**
 * Platzhalterliste für ein `IN (...)`.
 *
 * Der **einzige** Fall, in dem in diesem Paket SQL zusammengesetzt wird — und
 * zusammengesetzt wird ausschließlich aus Fragezeichen. Die Werte selbst
 * bleiben Parameter. Eine Liste von Kennungen als Text einzusetzen wäre der
 * eine Weg, auf dem Einschleusung hier noch möglich wäre.
 */
export function placeholders(count: number): string {
  return new Array(count).fill('?').join(', ');
}

/**
 * Zerlegt eine lange Kennungsliste in Blöcke.
 *
 * SQLite begrenzt die Anzahl der Parameter je Anweisung (Vorgabe 32766). Eine
 * Exportauswahl über ein ganzes Jahr kann diese Grenze reißen, und dann wäre
 * der Fehlschlag ein Absturz mitten im Exportlauf statt einer Antwort.
 */
export const PARAMETER_CHUNK = 500;

export function chunk<T>(items: readonly T[], size: number = PARAMETER_CHUNK): readonly (readonly T[])[] {
  if (items.length <= size) return items.length === 0 ? [] : [items];
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}
