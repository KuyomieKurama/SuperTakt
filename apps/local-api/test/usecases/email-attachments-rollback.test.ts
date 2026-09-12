/**
 * Takt — T-312 (unit-tester), der Prüffall aus `.claude/team/reports/T-309-domain-dev.md`
 * Abschnitt 1 ("Die Naht für den Prüffall").
 *
 * ===========================================================================
 * ROT ZUERST, UND EINE NACHTRÄGLICHE KORREKTUR AN DIESER DATEI SELBST
 * ===========================================================================
 *
 * Der T-309-Bericht (Annahme 2) sagte: „Der Wurf bleibt ein Wurf." Der
 * Produktivstand, gegen den dieser Prüffall tatsächlich läuft
 * (`apps/local-api/src/features/todos/email-attachments.ts`, Stand
 * 2026-09-12, **nach** dem Bericht und noch uneingecheckt), tut das
 * inzwischen **nicht mehr** — mit E-111 ("Warum der Wurf nicht weitergereicht
 * wird") übersetzt die Naht einen Wurf aus der Anhangstransaktion in ein
 * `ok()`-Ergebnis mit `attached: []` und jedem geplanten Anhang als `rejected`
 * in `failed`, protokolliert ihn als `error`-Zeile
 * (`attachment_email_rows_threw`) und reicht ihn nicht mehr weiter — sonst
 * entstünde aus einer 500 ein zweites Todo mit derselben Call-Nummer (A-10.9).
 * Dieser Prüffall mißt deshalb **die aktuelle Zusage** und nicht die des
 * Berichts; die Abweichung ist im Bericht zu T-312 an den Orchestrator
 * gemeldet, weil sie außerhalb der Testhoheit liegt.
 *
 * Was UNVERÄNDERT aus dem Bericht gilt und hier weiter gemessen wird:
 *
 *  - Vor T-309 räumte ein Wurf **gar nicht** auf — die Dateien blieben ohne
 *    Eigentümer liegen. Mit `git stash` auf den Stand vor T-309 bliebe
 *    `listEmailFiles()` nach dem ersten Fall hier NICHT leer.
 *  - Gemessen wird das **Verzeichnis**, nicht ein Zähler einer Attrappe.
 *  - Der Wurf geschieht **nach** abgeschlossener Arbeit — mit einer echten
 *    Transaktion, die die drei Zeilen tatsächlich schreibt, bevor sie durch
 *    den Wurf zurückgenommen werden —, damit auch der Weg gemessen wird, auf
 *    dem bereits Zeilen entstanden wären.
 *  - Die Zusage, auf der das Aufräumen ruht (`ROLLBACK` **vor** dem
 *    Weiterwerfen, `packages/storage/src/sqlite/unit-of-work.ts`), wird
 *    selbst geprüft: Nach dem Wurf existiert keine Zeile aus diesem Lauf.
 *  - Eine Gegenprobe ohne Wurf legt genau drei Dateien und drei Zeilen an —
 *    ohne sie wäre die Null oben die Null einer leeren Messung.
 *
 * ===========================================================================
 * Warum ECHTE Infrastruktur und keine Attrappen
 * ===========================================================================
 *
 *  - **`attachmentBlobs`** ist der echte Adapter ({@link createAttachmentBlobPort})
 *    über ein frisches, eigenes Anwendungsdatenverzeichnis — derselbe Aufbau
 *    wie in `data-transfer.test.ts`.
 *  - **`transactions`** ist die ECHTE Transaktion einer echten
 *    (In-Memory-)SQLite-Datenbank: Der Wurf geschieht innerhalb derselben
 *    Klammer, die die drei Zeilen wirklich schreibt, statt eines `reject()`
 *    ohne jede Arbeit.
 *  - **`create`** legt ein echtes Todo an, in seiner eigenen, bereits
 *    abgeschlossenen Transaktion — genau wie A-A-83 es vorschreibt ("Zuerst
 *    das Todo, dann die Bytes").
 *  - **`logger`** ist ein echter {@link createLogger}, dessen Zeilen
 *    aufgefangen und geparst werden — kein Zähler, der nur zählt, DASS
 *    protokolliert wurde, sondern eine Prüfung, WAS in der Zeile steht.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Timestamp, TodoId } from '@takt/domain';
import { ok } from '@takt/domain';
import { openDatabase, type OpenedDatabase, type UnitOfWork } from '@takt/storage';

import { createAttachmentBlobPort } from '../../src/access/attachment-store.ts';
import type { AppContext, UseCaseResult } from '../../src/context.ts';
import {
  attachEmailToNewTodo,
  type EmailIntake,
  type FreshTodo,
} from '../../src/features/todos/email-attachments.ts';
import { createLogger } from '../../src/logger.ts';

const NOW = '2026-09-12T10:00:00Z' as Timestamp;

/** Ein eigenes, leeres Anwendungsdatenverzeichnis — steht für einen Rechner. */
function tempAppDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'takt-email-attachments-rollback-'));
}

/** Base64 ohne Leerraum, wie {@link EmailIntake} es verlangt. */
function base64Of(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

interface Fixture {
  readonly database: OpenedDatabase;
  readonly appDataDir: string;
}

async function setup(): Promise<Fixture> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  return { database, appDataDir: tempAppDataDir() };
}

/**
 * Legt ein echtes Todo an, in seiner eigenen, bereits abgeschlossenen
 * Transaktion — unabhängig von der (unter Umständen werfenden) Transaktion,
 * die {@link attachEmailToNewTodo} für die Anhangszeilen benutzt.
 */
function makeCreate(
  database: OpenedDatabase,
): () => Promise<UseCaseResult<FreshTodo<{ readonly id: TodoId }>>> {
  return async () => {
    const todo = await database.transactions.inTransaction((unit) =>
      unit.todos.create(
        { title: 'Aus einer E-Mail', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      ),
    );
    return ok({ todoId: todo.id, value: { id: todo.id } });
  };
}

const THREE_FILES: EmailIntake = {
  sender: 'kundin@example.test',
  message: null,
  files: [
    { displayName: 'erste.pdf', base64: base64Of('erste') },
    { displayName: 'zweite.pdf', base64: base64Of('zweite') },
    { displayName: 'dritte.pdf', base64: base64Of('dritte') },
  ],
  links: [],
  failed: [],
};

describe('attachEmailToNewTodo — ein ECHTER Wurf aus der Anhangstransaktion räumt JEDE Datei ab (A-A-83, T-307 Befund 1, T-309, E-111)', () => {
  let database: OpenedDatabase | null = null;
  let appDataDir: string | null = null;

  afterEach(() => {
    database?.close();
    if (appDataDir !== null) rmSync(appDataDir, { recursive: true, force: true });
    database = null;
    appDataDir = null;
  });

  it(
    'ein Wurf NACH abgeschlossener Arbeit wird NICHT weitergereicht (E-111): das Ergebnis ist ok() mit ' +
      'attached=[] und jedem geplanten Anhang als "rejected", listEmailFiles() ist danach LEER, eine ' +
      '"error"-Zeile steht im Protokoll, und in todo_attachment steht keine Zeile aus diesem Lauf ' +
      '(die Zusage, auf der das Aufräumen ruht)',
    async () => {
      const fixture = await setup();
      database = fixture.database;
      appDataDir = fixture.appDataDir;
      const blobs = createAttachmentBlobPort(appDataDir, createLogger(() => undefined));
      const db = database;

      const logLines: string[] = [];
      const logger = createLogger((line) => logLines.push(line));

      const context = {
        clock: { now: () => NOW },
        attachmentBlobs: blobs,
        transactions: {
          // Führt die ECHTE Arbeit über die ECHTE Transaktion aus — die drei
          // Zeilen entstehen wirklich, in derselben Transaktion — und wirft
          // ERST DANACH. Kein `reject()` ohne Arbeit: Damit ist auch der Weg
          // gemessen, auf dem bereits Zeilen entstanden wären, und der Wurf
          // löst dasselbe ECHTE `ROLLBACK` aus wie ein `SQLITE_BUSY`
          // (`packages/storage/src/sqlite/unit-of-work.ts`).
          inTransaction: async (work: (unit: UnitOfWork) => Promise<unknown>) =>
            db.transactions.inTransaction(async (unit) => {
              await work(unit);
              throw new Error('T-312: simulierter Wurf NACH abgeschlossener Arbeit');
            }),
        },
      } as unknown as AppContext;

      const create = makeCreate(database);

      const result = await attachEmailToNewTodo(context, THREE_FILES, create, logger);

      // (a) Der Wurf wird NICHT weitergereicht (E-111) — das Todo steht, das
      // Ergebnis ist ok(), und JEDER geplante Anhang erscheint als "rejected".
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      expect(result.value.attachments.attached).toEqual([]);
      expect(result.value.attachments.failed).toEqual([
        { displayName: 'erste.pdf', reason: 'rejected', bytes: null },
        { displayName: 'zweite.pdf', reason: 'rejected', bytes: null },
        { displayName: 'dritte.pdf', reason: 'rejected', bytes: null },
      ]);

      // (b) Kein verwaistes Byte: das Verzeichnis zählt NULL zusätzliche Dateien.
      expect(await blobs.listEmailFiles()).toEqual([]);

      // Der Wurf verschwindet nicht spurlos — er geht als "error"-Zeile ins
      // Protokoll, mit Zahlen statt der Ausnahme selbst (B-2.4, T-132).
      const parsedLines = logLines.map((line) => JSON.parse(line) as Record<string, unknown>);
      const errorLine = parsedLines.find(
        (entry) => typeof entry.reason === 'string' && entry.reason.startsWith('attachment_email_rows_threw'),
      );
      expect(errorLine).toBeDefined();
      expect(errorLine?.level).toBe('error');
      expect(errorLine?.reason).toBe('attachment_email_rows_threw rows=3 files=3');

      // (d) Die Zusage, auf der (b) beruht: nach dem Wurf existiert keine
      // Zeile aus diesem Lauf. Ohne diese Zusage wäre (b) das Löschen von
      // Material MIT Eigentümer (A-A-18) und keine Aufräumung.
      const rows = await database.transactions.inTransaction((unit) =>
        unit.attachments.list(result.value.created.id),
      );
      expect(rows).toEqual([]);
    },
  );

  it(
    'Gegenprobe: DERSELBE Lauf OHNE Wurf legt genau drei Dateien ab, mit drei Zeilen — ' +
      'die Null oben ist nicht die Null einer leeren Messung',
    async () => {
      const fixture = await setup();
      database = fixture.database;
      appDataDir = fixture.appDataDir;
      const blobs = createAttachmentBlobPort(appDataDir, createLogger(() => undefined));

      const context = {
        clock: { now: () => NOW },
        attachmentBlobs: blobs,
        transactions: database.transactions,
      } as unknown as AppContext;

      const create = makeCreate(database);
      const logger = createLogger(() => undefined);
      const result = await attachEmailToNewTodo(context, THREE_FILES, create, logger);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      expect(result.value.attachments.failed).toEqual([]);
      expect(result.value.attachments.attached).toHaveLength(3);
      expect(await blobs.listEmailFiles()).toHaveLength(3);

      const rows = await database.transactions.inTransaction((unit) =>
        unit.attachments.list(result.value.created.id),
      );
      expect(rows).toHaveLength(3);
    },
  );
});
