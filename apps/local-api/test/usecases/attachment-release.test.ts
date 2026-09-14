/**
 * Takt — T-328 (unit-tester), blockierender Befund aus
 * `.claude/team/reports/T-324-code-reviewer.md` zu Strang A:
 *
 * > `releaseUnclaimedBlobs`, `releasableBlobOf`, `removeAttachment` und
 * > `removeTodo` kommen im ganzen Prüfbestand nicht vor.
 *
 * ===========================================================================
 * ROT ZUERST, UND WORAN DAS GEMESSEN IST
 * ===========================================================================
 *
 * Diese Datei existierte vor T-328 nicht — `grep -rl releaseUnclaimedBlobs
 * apps/local-api/test packages/*\/test tests` lief vorher leer, wörtlich der
 * Befund oben. Ein "roter Zustand vorher" ist hier deshalb nicht "derselbe
 * Test schlägt fehl", sondern: **ohne die hier gebaute Fachregel schlägt
 * genau dieser Prüffall fehl** — nachgewiesen an der echten Vorgängerfassung
 * dieses Codes und nicht behauptet.
 *
 * Vor Commit `311b26e` (T-320) fragten `removeAttachment` und `removeTodo`
 * beim Löschen NICHT, ob eine Bildkopie oder übernommene E-Mail-Datei noch
 * einer anderen Zeile gehört — sie entfernten unbedingt (git show
 * `4a52edc:apps/local-api/src/features/todos/attachments.ts` Zeilen 312 ff.,
 * `4a52edc:apps/local-api/src/features/todos/todos.ts` Zeilen 352 ff.). Der
 * Aufbau unten (Todo A trägt eine Bildkopie, Todo B einen Dateianhang auf
 * deren vollen Pfad, A wird gelöscht) ist deshalb am ECHTEN Vorgängerstand
 * nachgerechnet worden, bevor dieser Prüffall geschrieben wurde — die
 * Nachrechnung lief als Wegwerfskript im Kratzverzeichnis (nicht Teil dieses
 * Bestands, `packages/*\/test/**` bzw. `apps/*\/test/**` gehört dem
 * unit-tester und nicht Produktivcode), bildete GENAU die Kontrollflüsse der
 * beiden oben zitierten Fassungen nach (kein Import aus `src/`, damit keine
 * Produktivdatei berührt wird) und bestätigte: Mit der alten, ungefragten
 * Entfernung verschwindet die Bildkopie, obwohl Todo B sie noch nennt — der
 * Prüffall unten hätte an dieser Fassung mit "expected [] to contain …"
 * fehlgeschlagen. Mit dem aktuellen Stand (`removeTodo`/`removeAttachment`
 * rufen {@link releaseUnclaimedBlobs}) bleibt die Datei liegen, und die
 * Zusicherung unten ist grün — nicht weil sie nichts prüft, sondern weil sie
 * an der Fassung hängt, die tatsächlich im Bestand steht.
 *
 * ===========================================================================
 * Warum ECHTE Infrastruktur (dieselbe Bauart wie
 * `email-attachments-rollback.test.ts`, T-312)
 * ===========================================================================
 *
 * `attachmentBlobs` ist der echte Adapter ({@link createAttachmentBlobPort})
 * über ein eigenes, frisches Anwendungsdatenverzeichnis. `transactions` ist
 * eine ECHTE (In-Memory-)SQLite-Transaktion — die weiteste Eigentümerfrage
 * (`attachmentsNamingFiles`) ist eine SQL-Abfrage, und eine Attrappe dafür
 * würde genau die Eigenschaft nicht prüfen, um die es hier geht: daß die
 * Frage über ALLE Zeilen läuft, nicht nur über die des gelöschten Todos.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Attachment, AttachmentId, Timestamp, TodoId } from '@takt/domain';
import { openDatabase, type OpenedDatabase, type UnitOfWork } from '@takt/storage';

import { createAttachmentBlobPort } from '../../src/access/attachment-store.ts';
import type { AppContext } from '../../src/context.ts';
import {
  addAttachment,
  releasableBlobOf,
  removeAttachment,
} from '../../src/features/todos/attachments.ts';
import { removeTodo } from '../../src/features/todos/todos.ts';
import { createLogger } from '../../src/logger.ts';

const NOW = '2026-09-12T09:00:00Z' as Timestamp;

/** Eine gültige, winzige PNG-Signatur — dieselben Bytes wie in `attachment-store.test.ts`. */
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function tempSourceImage(dir: string): string {
  const path = join(dir, 'quelle.png');
  writeFileSync(path, PNG_BYTES);
  return path;
}

const attachmentId = (value: string) => value as unknown as AttachmentId;
const todoId = (value: string) => value as unknown as TodoId;

/** Ein Anhang, wie ihn `Attachment` beschreibt — für die reine Funktion {@link releasableBlobOf}. */
function makeAttachment(overrides: Partial<Attachment>): Attachment {
  return {
    id: attachmentId('anhang-1'),
    todoId: todoId('todo-1'),
    kind: 'link',
    title: null,
    target: 'https://example.invalid/',
    position: 0,
    createdAt: NOW,
    origin: 'user',
    originSender: null,
    displayName: null,
    rebuilt: false,
    ...overrides,
  };
}

describe('releasableBlobOf — die enge Kandidatenfrage: welche Datei kommt für DIESE Zeile überhaupt in Frage? (A-A-98, T-320)', () => {
  it('ein Bild (jede origin) ergibt die Bildkopie', () => {
    const blob = releasableBlobOf(makeAttachment({ kind: 'image', target: 'ab.png', origin: 'user' }));
    expect(blob).toEqual({ kind: 'image', target: 'ab.png' });
  });

  it('ein Bild mit origin "email" ergibt ebenfalls die Bildkopie — die Art entscheidet, nicht die Herkunft', () => {
    const blob = releasableBlobOf(makeAttachment({ kind: 'image', target: 'cd.png', origin: 'email' }));
    expect(blob).toEqual({ kind: 'image', target: 'cd.png' });
  });

  it('eine ÜBERNOMMENE E-Mail-Datei (kind=file, origin=email) ergibt die E-Mail-Datei', () => {
    const blob = releasableBlobOf(
      makeAttachment({ kind: 'file', origin: 'email', target: '/pfad/zur/rechnung.pdf' }),
    );
    expect(blob).toEqual({ kind: 'emailFile', target: '/pfad/zur/rechnung.pdf' });
  });

  it('ein VOM BENUTZER eingetragener Dateipfad (kind=file, origin=user) ergibt null — Takt hat diese Datei nie kopiert', () => {
    const blob = releasableBlobOf(
      makeAttachment({ kind: 'file', origin: 'user', target: '/pfad/des/benutzers.pdf' }),
    );
    expect(blob).toBeNull();
  });

  it('ein Verweis (kind=link) ergibt immer null, unabhängig von der Herkunft', () => {
    expect(releasableBlobOf(makeAttachment({ kind: 'link', origin: 'user' }))).toBeNull();
    expect(releasableBlobOf(makeAttachment({ kind: 'link', origin: 'email' }))).toBeNull();
  });
});

interface Fixture {
  readonly database: OpenedDatabase;
  readonly appDataDir: string;
  readonly sourceDir: string;
  readonly context: AppContext;
}

async function setup(): Promise<Fixture> {
  const database = openDatabase({ location: ':memory:', now: () => NOW });
  await database.migrations.migrateToLatest();
  const appDataDir = tempDir('takt-attachment-release-data-');
  const sourceDir = tempDir('takt-attachment-release-source-');
  const context = {
    clock: { now: () => NOW },
    attachmentBlobs: createAttachmentBlobPort(appDataDir, createLogger(() => undefined)),
    transactions: database.transactions,
  } as unknown as AppContext;
  return { database, appDataDir, sourceDir, context };
}

function teardown(fixture: Fixture | null): void {
  if (fixture === null) return;
  fixture.database.close();
  rmSync(fixture.appDataDir, { recursive: true, force: true });
  rmSync(fixture.sourceDir, { recursive: true, force: true });
}

/**
 * Baut genau den Aufbau, den T-320 selbst gemessen hat (siehe Dateikopf):
 * Todo A trägt eine echte Bildkopie, Todo B einen Dateianhang auf deren
 * vollen Pfad — absolut, vorhanden, `.png`, kein UNC, keine Umleitungsendung.
 */
async function claimedScenario(fixture: Fixture) {
  const { database, context, appDataDir, sourceDir } = fixture;
  const todoA = await database.transactions.inTransaction((unit) =>
    unit.todos.create(
      { title: 'Todo A', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    ),
  );
  const todoB = await database.transactions.inTransaction((unit) =>
    unit.todos.create(
      { title: 'Todo B', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
      [],
    ),
  );

  const image = await addAttachment(context, todoA.id, {
    kind: 'image',
    title: null,
    sourcePath: tempSourceImage(sourceDir),
  });
  expect(image.ok).toBe(true);
  if (!image.ok) throw new Error('unreachable');
  const imageName = image.value.target;
  const fullPath = join(appDataDir, 'attachments', imageName);

  const claim = await addAttachment(context, todoB.id, { kind: 'file', title: null, path: fullPath });
  expect(claim.ok).toBe(true);
  if (!claim.ok) throw new Error('unreachable');

  return { todoAId: todoA.id, todoBId: todoB.id, imageAttachmentId: image.value.id, imageName };
}

describe('releaseUnclaimedBlobs über removeTodo — Todo A löschen kostet Todo B seinen Anhang nicht (T-320, R-29, A-A-98)', () => {
  let fixture: Fixture | null = null;

  afterEach(() => {
    teardown(fixture);
    fixture = null;
  });

  it('Todo B nennt die Bildkopie über einen Dateianhang auf den vollen Pfad — nach dem Löschen von Todo A bleibt die Datei liegen, und listImages() nennt sie weiter', async () => {
    fixture = await setup();
    const { todoAId, imageName } = await claimedScenario(fixture);

    // Vorbedingung: die Datei liegt tatsächlich, bevor irgendetwas gelöscht wird.
    expect(await fixture.context.attachmentBlobs.listImages()).toContain(imageName);

    const removed = await removeTodo(fixture.context, todoAId);
    expect(removed.ok).toBe(true);

    // Die eigentliche Zusicherung: Todo B nennt die Datei noch, sie bleibt liegen.
    expect(await fixture.context.attachmentBlobs.listImages()).toContain(imageName);
  });

  it('Gegenprobe nach oben: OHNE einen zweiten Anhang auf dieselbe Datei fällt sie ganz normal — die Datei bleibt nicht grundsätzlich liegen, sondern nur, weil sie beansprucht ist', async () => {
    fixture = await setup();
    const { database, context, sourceDir } = fixture;
    const todoA = await database.transactions.inTransaction((unit) =>
      unit.todos.create(
        { title: 'Allein', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      ),
    );
    const image = await addAttachment(context, todoA.id, {
      kind: 'image',
      title: null,
      sourcePath: tempSourceImage(sourceDir),
    });
    expect(image.ok).toBe(true);
    if (!image.ok) throw new Error('unreachable');

    expect(await context.attachmentBlobs.listImages()).toContain(image.value.target);
    const removed = await removeTodo(context, todoA.id);
    expect(removed.ok).toBe(true);
    expect(await context.attachmentBlobs.listImages()).not.toContain(image.value.target);
  });

  /**
   * Die Gegenprobe aus T-320 selbst (`.claude/team/reports/T-320-domain-dev.md`,
   * Abschnitt "Gemessen, nicht behauptet"), hier als stehender Prüffall: Wird
   * die Eigentümerantwort blind auf eine leere Menge gesetzt — als stünde
   * Todo B gar nicht da —, fällt genau dieselbe Datei wieder. Die Messung
   * oben hängt also tatsächlich an der Frage `attachmentsNamingFiles` und
   * nicht an einem Zufall des Aufbaus.
   */
  it('Gegenprobe: ist die Eigentümerantwort blind LEER (als gäbe es Todo B nicht), fällt dieselbe Datei wieder', async () => {
    fixture = await setup();
    const { database } = fixture;
    const { todoAId, imageName } = await claimedScenario(fixture);

    const blindContext = {
      ...fixture.context,
      transactions: {
        inTransaction: <T>(work: (unit: UnitOfWork) => Promise<T>) =>
          database.transactions.inTransaction((unit) =>
            work({
              ...unit,
              attachments: {
                ...unit.attachments,
                attachmentsNamingFiles: async () => new Set<string>(),
              },
            } as UnitOfWork),
          ),
      },
    } as unknown as AppContext;

    const removed = await removeTodo(blindContext, todoAId);
    expect(removed.ok).toBe(true);
    expect(await fixture.context.attachmentBlobs.listImages()).not.toContain(imageName);
  });
});

describe('releaseUnclaimedBlobs über removeAttachment — dieselbe weiteste Frage bei direkter Anhangslöschung (T-320, A-A-98)', () => {
  let fixture: Fixture | null = null;

  afterEach(() => {
    teardown(fixture);
    fixture = null;
  });

  it('den Bildanhang von Todo A direkt entfernen (nicht das ganze Todo) — Todo B nennt die Datei weiter, sie bleibt liegen', async () => {
    fixture = await setup();
    const { todoAId, imageAttachmentId, imageName } = await claimedScenario(fixture);

    const removed = await removeAttachment(fixture.context, todoAId, imageAttachmentId);
    expect(removed.ok).toBe(true);
    expect(await fixture.context.attachmentBlobs.listImages()).toContain(imageName);
  });

  it('Gegenprobe nach oben: ein Bildanhang ohne zweiten Beanspruchenden fällt beim direkten Entfernen ganz normal', async () => {
    fixture = await setup();
    const { context, database, sourceDir } = fixture;
    const todo = await database.transactions.inTransaction((unit) =>
      unit.todos.create(
        { title: 'Ohne Beanspruchung', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
        [],
      ),
    );
    const image = await addAttachment(context, todo.id, {
      kind: 'image',
      title: null,
      sourcePath: tempSourceImage(sourceDir),
    });
    expect(image.ok).toBe(true);
    if (!image.ok) throw new Error('unreachable');

    const removed = await removeAttachment(context, todo.id, image.value.id);
    expect(removed.ok).toBe(true);
    expect(await context.attachmentBlobs.listImages()).not.toContain(image.value.target);
  });

  it('ein Anhang, der zu einem ANDEREN Todo gehört, ist unter dieser Adresse "not_found" — und rührt keine Datei an', async () => {
    fixture = await setup();
    const { todoBId, imageAttachmentId, imageName } = await claimedScenario(fixture);

    const result = await removeAttachment(fixture.context, todoBId, imageAttachmentId);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.code).toBe('not_found');
    // Die Datei existiert unverändert weiter — nichts wurde angefasst.
    expect(await fixture.context.attachmentBlobs.listImages()).toContain(imageName);
  });
});
