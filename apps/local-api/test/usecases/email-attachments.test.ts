/**
 * Takt — T-306 (unit-tester), die zweite Hälfte der Lücke aus T-305.
 *
 * ===========================================================================
 * ROT ZUERST
 * ===========================================================================
 *
 * `apps/local-api/src/features/todos/email-attachments.ts` entstand mit T-299
 * (E-108, E-109) und hatte laut T-305 **keinen** einzigen direkten Prüffall —
 * kein Treffer in `apps/local-api/test/**` auf `attachEmailToNewTodo` oder
 * `createEmailAttachmentIntake` vor dieser Datei.
 *
 * ===========================================================================
 * Was hier gemessen wird
 * ===========================================================================
 *
 *  1. **Scheitert das Anlegen des Todos, wird KEIN Byte geschrieben und KEINE
 *     Transaktion begonnen** (A-A-83, erste Hälfte) — mit Attrappen, die bei
 *     einem Aufruf werfen, statt ihn stillschweigend zu beantworten (dasselbe
 *     Muster wie `nurDieUhr` in `attachment-input-validation.test.ts`).
 *  2. **Die Größengrenze greift an einem ECHTEN, dekodierten Puffer, bevor der
 *     Blob-Port je gerufen wird** — `storeEmailFile` wirft, wenn er aufgerufen
 *     würde, und der Test bleibt trotzdem grün, weil er nie gerufen wird.
 *  3. **Ein Fehlschlag je Datei ist ein Ergebnis, kein Abbruch** (A-19.29): Bei
 *     drei Dateien, von denen die mittlere an der Datenbankzeile scheitert,
 *     kommen die beiden anderen an, die mittlere wird namentlich gemeldet, und
 *     ihre bereits geschriebene Datei wird wieder entfernt (A-A-83, zweite
 *     Hälfte).
 *  4. **Die Reihenfolge am Todo**: Nachricht, dann Dateien, dann
 *     Cloud-Verweise (A-19.33) — und `rebuilt` ausschließlich an der
 *     Nachricht.
 *  5. **Die Fehlschläge aus dem Aufgabenbereich stehen VORN** und werden bei
 *     Überlänge gekürzt, die Endung bleibt (A-19.29, A-19.31).
 *  6. **Keine zweite Namensprüfung an der Naht** (A-A-78, T-297): Gerätenamen,
 *     Doppelendungen, fehlende Endung und eine zu lange Endung laufen
 *     unverändert durch `nameEmailFile` der Domäne — diese Datei filtert
 *     nichts ein zweites Mal.
 *  7. **Die Anzahlgrenze bei Cloud-Verweisen greift VOR der Formprüfung** der
 *     Adresse — der 26. Verweis wird `rejected`, ohne dass seine (an sich
 *     gültige) Adresse geprüft wird.
 *  8. **Der Absender wird getrimmt, leer wird `null`, sehr lang wird auf 640
 *     Zeichen gekürzt** (Migration 0023) — und `origin` ist an jedem
 *     entstandenen Anhang `'email'`, unabhängig von seiner Art.
 */
import { describe, expect, it } from 'vitest';
import type { Attachment, AttachmentCreate, AttachmentId, TaktError, Timestamp, TodoId } from '@takt/domain';
import {
  MAX_EMAIL_ATTACHMENT_BYTES,
  MAX_EMAIL_ATTACHMENT_COUNT,
  MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH,
  err,
  ok,
  taktError,
} from '@takt/domain';

import {
  attachEmailToNewTodo,
  type EmailIntake,
  type FreshTodo,
} from '../../src/features/todos/email-attachments.ts';
import type { AppContext, UseCaseResult } from '../../src/context.ts';
import { createLogger } from '../../src/logger.ts';

/**
 * Ein Protokoll, das nichts ausgibt. `attachEmailToNewTodo` bekommt seit
 * E-111 einen `Logger` in der Signatur — er trägt hier nichts zur
 * Zusicherung bei (der Prüffall dafür steht in
 * `email-attachments-rollback.test.ts`), also genügt ein echter Schreiber
 * ohne Ziel.
 */
const testLogger = createLogger(() => undefined);

const todoId = (value: string) => value as unknown as TodoId;
const attachmentId = (value: string) => value as unknown as AttachmentId;
const timestamp = (value: string) => value as unknown as Timestamp;

const NOW = timestamp('2026-09-12T10:00:00Z');
const TODO_ID = todoId('todo-1');

/** Base64 ohne Leerraum, wie {@link EmailIntake} es verlangt. */
function base64Of(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

function succeedingCreate<T>(value: T) {
  return async (): Promise<UseCaseResult<FreshTodo<T>>> => ok({ todoId: TODO_ID, value });
}

function failingCreate(error: TaktError): () => Promise<UseCaseResult<FreshTodo<never>>> {
  return async () => err(error);
}

interface StoreCall {
  readonly bytes: number;
  readonly extension: string | null;
}

/**
 * Eine Attrappe für `AttachmentBlobPort`, die nur die zwei Methoden trägt, die
 * `attachEmailToNewTodo` tatsächlich ruft. `storeEmailFile` legt einen Pfad
 * `blob-<n>` an; `removeEmailFile` protokolliert, was entfernt wurde.
 */
function fakeBlobs() {
  const storeCalls: StoreCall[] = [];
  const removeCalls: string[] = [];
  let counter = 0;
  return {
    storeCalls,
    removeCalls,
    async storeEmailFile(data: Uint8Array, extension: string | null) {
      counter += 1;
      storeCalls.push({ bytes: data.byteLength, extension });
      return {
        ok: true as const,
        name: `blob-${counter}`,
        path: `/blobs/blob-${counter}`,
        bytes: data.byteLength,
      };
    },
    async removeEmailFile(target: string) {
      removeCalls.push(target);
      return 'removed' as const;
    },
  };
}

/**
 * Wirft bei jedem Aufruf — für Fälle, in denen der Blob-Port oder die
 * Transaktion **nicht** berührt werden dürfen (A-A-83 erste Hälfte, die
 * Größengrenze "vor dem ersten Byte"). Ein Wurf statt eines stillen "ok" läßt
 * eine verletzte Zusage im Test auffliegen, statt sie unbemerkt durchzulassen
 * — dasselbe Muster wie `nurDieUhr` in `attachment-input-validation.test.ts`.
 */
const throwingBlobs = {
  async storeEmailFile(): Promise<never> {
    throw new Error('storeEmailFile hätte hier NICHT aufgerufen werden dürfen');
  },
  async removeEmailFile(): Promise<never> {
    throw new Error('removeEmailFile hätte hier NICHT aufgerufen werden dürfen');
  },
};

let attachmentCounter = 0;

/** Baut den `Attachment`-Datensatz, den eine erfolgreiche Zeile zurückgäbe — gespiegelt aus dem Eingabewert. */
function makeAttachment(input: AttachmentCreate): Attachment {
  attachmentCounter += 1;
  return {
    id: attachmentId(`att-${attachmentCounter}`),
    todoId: input.todoId,
    kind: input.kind,
    title: input.title,
    target: input.target,
    position: attachmentCounter,
    createdAt: input.now,
    origin: input.origin ?? 'user',
    originSender: input.originSender ?? null,
    displayName: input.displayName ?? null,
    rebuilt: input.rebuilt ?? false,
  };
}

interface ContextOptions {
  readonly attachmentBlobs: {
    storeEmailFile: (data: Uint8Array, extension: string | null) => Promise<unknown>;
    removeEmailFile: (target: string) => Promise<unknown>;
  };
  readonly unitCreate: (input: AttachmentCreate) => Promise<UseCaseResult<Attachment>>;
}

function fakeContext(options: ContextOptions): AppContext {
  return {
    clock: { now: () => NOW },
    attachmentBlobs: options.attachmentBlobs,
    transactions: {
      inTransaction: async (work: (unit: unknown) => Promise<unknown>) =>
        work({ attachments: { create: options.unitCreate } }),
    },
  } as unknown as AppContext;
}

/** Eine Transaktion, die niemals begonnen werden darf. */
const untouchableTransactions = {
  inTransaction: (): never => {
    throw new Error('context.transactions.inTransaction hätte hier NICHT aufgerufen werden dürfen');
  },
};

// ---------------------------------------------------------------------------
// A-A-83, erste Hälfte: Scheitert das Anlegen, ist NICHTS geschrieben
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — scheitert das Anlegen des Todos (A-A-83, erste Hälfte)', () => {
  it('KEIN Byte wird geschrieben und KEINE Transaktion begonnen — der Fehler des Anlegevorgangs geht unverändert zurück', async () => {
    const error = taktError('validation_error', 'Testfehler beim Anlegen');
    const context = {
      clock: { now: () => NOW },
      attachmentBlobs: throwingBlobs,
      transactions: untouchableTransactions,
    } as unknown as AppContext;

    const intake: EmailIntake = {
      sender: 'kundin@example.test',
      message: { displayName: 'Nachricht.eml', base64: base64Of('nachricht'), rebuilt: false },
      files: [{ displayName: 'anlage.pdf', base64: base64Of('anlage') }],
      links: [{ displayName: 'Cloud-Datei', url: 'https://example.test/datei' }],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, failingCreate(error), testLogger);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error).toBe(error);
  });
});

// ---------------------------------------------------------------------------
// Die Größengrenze — vor dem ersten Byte, an einem echten Puffer (A-A-81)
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — die Größengrenze greift, bevor der Blob-Port gerufen wird (A-A-81)', () => {
  it(
    'eine Datei mit einem Byte über der Grenze: storeEmailFile wird NIE gerufen, gemeldet als too_large mit der GEMESSENEN Größe',
    async () => {
      const overLimit = Buffer.alloc(MAX_EMAIL_ATTACHMENT_BYTES + 1, 3);
      const context = fakeContext({
        attachmentBlobs: throwingBlobs,
        unitCreate: async () => {
          throw new Error('unit.attachments.create hätte hier NICHT aufgerufen werden dürfen');
        },
      });

      const intake: EmailIntake = {
        sender: null,
        message: null,
        files: [{ displayName: 'zu-gross.bin', base64: overLimit.toString('base64') }],
        links: [],
        failed: [],
      };

      const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      expect(result.value.attachments.attached).toEqual([]);
      expect(result.value.attachments.failed).toEqual([
        { displayName: 'zu-gross.bin', reason: 'too_large', bytes: MAX_EMAIL_ATTACHMENT_BYTES + 1 },
      ]);
    },
    30_000,
  );

  it('eine Datei GENAU an der Grenze wird angenommen (Gegenprobe zum vorigen Fall)', async () => {
    const atLimit = Buffer.alloc(MAX_EMAIL_ATTACHMENT_BYTES, 3);
    const blobs = fakeBlobs();
    const context = fakeContext({
      attachmentBlobs: blobs,
      unitCreate: async (input) => ok(makeAttachment(input)),
    });

    const intake: EmailIntake = {
      sender: null,
      message: null,
      files: [{ displayName: 'genau-am-limit.bin', base64: atLimit.toString('base64') }],
      links: [],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.failed).toEqual([]);
    expect(result.value.attachments.attached).toHaveLength(1);
    expect(blobs.storeCalls).toEqual([{ bytes: MAX_EMAIL_ATTACHMENT_BYTES, extension: 'bin' }]);
  }, 30_000);
});

// ---------------------------------------------------------------------------
// A-19.29: Ein Fehlschlag je Datei ist ein Ergebnis, kein Abbruch
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — ein Fehlschlag je Datei ist ein Ergebnis, kein Abbruch (A-19.29)', () => {
  it('3 Dateien, die MITTLERE scheitert an der Datenbankzeile: die beiden anderen kommen an, die mittlere wird NAMENTLICH gemeldet und ihre Datei wieder entfernt (A-A-83, zweite Hälfte)', async () => {
    const blobs = fakeBlobs();
    let callCount = 0;
    const context = fakeContext({
      attachmentBlobs: blobs,
      unitCreate: async (input) => {
        callCount += 1;
        if (callCount === 2) return err(taktError('validation_error', 'Zeile abgelehnt'));
        return ok(makeAttachment(input));
      },
    });

    const intake: EmailIntake = {
      sender: null,
      message: null,
      files: [
        { displayName: 'erste.pdf', base64: base64Of('erste') },
        { displayName: 'zweite.pdf', base64: base64Of('zweite') },
        { displayName: 'dritte.pdf', base64: base64Of('dritte') },
      ],
      links: [],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    // Untergrenze UND genaue Zahl: von drei Dateien kommen genau zwei an.
    expect(result.value.attachments.attached.length).toBeGreaterThanOrEqual(2);
    expect(result.value.attachments.attached).toHaveLength(2);
    expect(result.value.attachments.attached.map((a) => a.displayName)).toEqual(['erste.pdf', 'dritte.pdf']);
    expect(result.value.attachments.failed).toEqual([
      { displayName: 'zweite.pdf', reason: 'rejected', bytes: null },
    ]);
    // Alle drei wurden geschrieben (Reihenfolge: messen/benennen/ablegen VOR
    // der Zeile) — und genau die eine ohne Zeile wird wieder entfernt.
    expect(blobs.storeCalls).toHaveLength(3);
    expect(blobs.removeCalls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Die Reihenfolge am Todo (A-19.33) und "rebuilt" nur an der Nachricht
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — Reihenfolge und Herkunft (A-19.33, A-A-84, A-A-97)', () => {
  it('Nachricht zuerst, dann Dateien in Reihenfolge der Nachricht, dann Cloud-Verweise zuletzt — "rebuilt" nur an der Nachricht, "origin" immer "email"', async () => {
    const blobs = fakeBlobs();
    const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });

    const intake: EmailIntake = {
      sender: 'Kundin <kundin@example.test>',
      message: { displayName: 'Nachricht.eml', base64: base64Of('nachricht'), rebuilt: true },
      files: [
        { displayName: 'anlage1.pdf', base64: base64Of('a1') },
        { displayName: 'anlage2.pdf', base64: base64Of('a2') },
      ],
      links: [{ displayName: 'Cloud-Datei', url: 'https://example.test/datei' }],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.attached).toHaveLength(4);
    expect(result.value.attachments.attached.map((a) => a.displayName)).toEqual([
      'Nachricht.eml',
      'anlage1.pdf',
      'anlage2.pdf',
      'Cloud-Datei',
    ]);
    expect(result.value.attachments.attached.map((a) => a.rebuilt)).toEqual([true, false, false, false]);
    expect(result.value.attachments.attached.every((a) => a.origin === 'email')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Die Fehlschläge des Aufgabenbereichs stehen VORN (A-19.29, A-19.31)
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — Fehlschläge aus dem Aufgabenbereich (A-19.29, A-19.31)', () => {
  it('sie stehen VOR den Fehlschlägen dieses Laufs, unverändert bis auf Kürzung bei Überlänge (Endung bleibt)', async () => {
    const blobs = fakeBlobs();
    const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });
    const longName = `${'x'.repeat(400)}.msg`;

    const intake: EmailIntake = {
      sender: null,
      message: null,
      // eine Umleitungsendung erzeugt zusätzlich einen Fehlschlag IN diesem Lauf
      files: [{ displayName: 'boese.lnk', base64: base64Of('x') }],
      links: [],
      failed: [{ displayName: longName, reason: 'not_released', bytes: null }],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.failed).toHaveLength(2);
    expect(result.value.attachments.failed[0]?.reason).toBe('not_released');
    expect(result.value.attachments.failed[0]?.displayName.length).toBeLessThan(longName.length);
    expect(result.value.attachments.failed[0]?.displayName).toContain('…');
    expect(result.value.attachments.failed[0]?.displayName.endsWith('.msg')).toBe(true);
    expect(result.value.attachments.failed[1]).toEqual({
      displayName: 'boese.lnk',
      reason: 'rejected',
      bytes: null,
    });
    // Die abgelehnte Umleitungsendung erreicht den Blob-Port nie.
    expect(blobs.storeCalls).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Keine zweite Namensprüfung an der Naht (A-A-78, T-297)
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — keine zweite Namensprüfung, nameEmailFile der Domäne entscheidet allein (A-A-78, T-297)', () => {
  it('Gerätenamen, Doppelendungen, fehlende Endung und eine zu lange Endung laufen unverändert durch — nichts davon wird an dieser Naht zusätzlich abgelehnt', async () => {
    const blobs = fakeBlobs();
    const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });

    const tooLongExtension = 'a'.repeat(MAX_EMAIL_ATTACHMENT_EXTENSION_LENGTH + 1);
    const files = [
      { displayName: 'NUL', base64: base64Of('1') },
      { displayName: 'COM1', base64: base64Of('2') },
      { displayName: 'CON.txt', base64: base64Of('3') },
      { displayName: 'prn.pdf', base64: base64Of('4') },
      { displayName: 'archiv.tar.gz', base64: base64Of('5') },
      { displayName: 'ohne-jede-endung', base64: base64Of('6') },
      { displayName: `datei.${tooLongExtension}`, base64: base64Of('7') },
    ];

    const intake: EmailIntake = { sender: null, message: null, files, links: [], failed: [] };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.failed).toEqual([]);
    // Untergrenze UND genaue Zahl: alle sieben kommen an.
    expect(result.value.attachments.attached.length).toBeGreaterThanOrEqual(files.length);
    expect(result.value.attachments.attached).toHaveLength(files.length);
    expect(blobs.storeCalls.map((call) => call.extension)).toEqual([
      null, // NUL
      null, // COM1
      'txt', // CON.txt
      'pdf', // prn.pdf
      'gz', // archiv.tar.gz — nur die LETZTE Endung
      null, // ohne-jede-endung
      null, // Endung über der Längengrenze
    ]);
  });
});

// ---------------------------------------------------------------------------
// Cloud-Verweise: Anzahlgrenze VOR Formprüfung, ungültige Adresse
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — Cloud-Verweise (A-19.25)', () => {
  it('eine ungültige Adresse wird "not_a_web_address", eine gültige kommt an', async () => {
    const blobs = fakeBlobs();
    const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });

    const intake: EmailIntake = {
      sender: null,
      message: null,
      files: [],
      links: [
        { displayName: 'Ungültig', url: 'file:///etc/passwd' },
        { displayName: 'Gültig', url: 'https://example.test/dokument' },
      ],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.failed).toEqual([
      { displayName: 'Ungültig', reason: 'not_a_web_address', bytes: null },
    ]);
    expect(result.value.attachments.attached).toHaveLength(1);
    expect(result.value.attachments.attached[0]?.target).toBe('https://example.test/dokument');
  });

  it(`der ${MAX_EMAIL_ATTACHMENT_COUNT + 1}. Anhang wird "too_many" (NICHT "rejected") — dieselbe Anzahlgrenze wie bei Dateien, mit ihrem EIGENEN Grund (A-19.30a, A-19.30b), und sie greift VOR der Formprüfung der (an sich gültigen) Adresse`, async () => {
    const blobs = fakeBlobs();
    const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });

    const files = Array.from({ length: MAX_EMAIL_ATTACHMENT_COUNT }, (_, index) => ({
      displayName: `datei-${index}.pdf`,
      base64: base64Of(`inhalt-${index}`),
    }));

    const intake: EmailIntake = {
      sender: null,
      message: null,
      files,
      // an sich eine völlig gültige Adresse — sie darf dennoch nicht mehr rein
      links: [{ displayName: 'Zusätzlich', url: 'https://example.test/zusaetzlich' }],
      failed: [],
    };

    const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.attachments.attached.length).toBeGreaterThanOrEqual(MAX_EMAIL_ATTACHMENT_COUNT);
    expect(result.value.attachments.attached).toHaveLength(MAX_EMAIL_ATTACHMENT_COUNT);
    expect(result.value.attachments.failed).toEqual([
      { displayName: 'Zusätzlich', reason: 'too_many', bytes: null },
    ]);
  });

  it(
    `dieselbe Anzahlgrenze bei DATEIEN: die ${MAX_EMAIL_ATTACHMENT_COUNT + 1}. Datei wird "too_many" mit ` +
      'bytes: null — sie nennt ihren eigenen Wert und keinen aus too_large (A-19.30a, A-19.30b)',
    async () => {
      const blobs = fakeBlobs();
      const context = fakeContext({ attachmentBlobs: blobs, unitCreate: async (input) => ok(makeAttachment(input)) });

      const files = Array.from({ length: MAX_EMAIL_ATTACHMENT_COUNT + 1 }, (_, index) => ({
        displayName: `datei-${index}.pdf`,
        base64: base64Of(`inhalt-${index}`),
      }));

      const intake: EmailIntake = { sender: null, message: null, files, links: [], failed: [] };

      const result = await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unreachable');
      expect(result.value.attachments.attached).toHaveLength(MAX_EMAIL_ATTACHMENT_COUNT);
      expect(result.value.attachments.failed).toEqual([
        { displayName: 'datei-25.pdf', reason: 'too_many', bytes: null },
      ]);
      // Die 26. Datei erreicht storeEmailFile nie — sie fällt VOR dem Ablegen.
      expect(blobs.storeCalls).toHaveLength(MAX_EMAIL_ATTACHMENT_COUNT);
    },
  );
});

// ---------------------------------------------------------------------------
// Der Absender (Migration 0023)
// ---------------------------------------------------------------------------

describe('attachEmailToNewTodo — der Absender wird normalisiert (Migration 0023)', () => {
  it.each([
    ['  Kundin <kundin@example.test>  ', 'Kundin <kundin@example.test>'],
    ['', null],
    ['   ', null],
  ])('Absender %j wird zu %j (getrimmt, leer wird null)', async (raw, expected) => {
    const blobs = fakeBlobs();
    let captured: string | null | undefined;
    const context = fakeContext({
      attachmentBlobs: blobs,
      unitCreate: async (input) => {
        captured = input.originSender;
        return ok(makeAttachment(input));
      },
    });

    const intake: EmailIntake = {
      sender: raw,
      message: null,
      files: [{ displayName: 'a.pdf', base64: base64Of('a') }],
      links: [],
      failed: [],
    };

    await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(captured).toBe(expected);
  });

  it('ein sehr langer Absender wird auf 640 Zeichen gekürzt, am Ende — der Anfang bleibt vollständig erhalten', async () => {
    const blobs = fakeBlobs();
    let captured: string | null | undefined;
    const context = fakeContext({
      attachmentBlobs: blobs,
      unitCreate: async (input) => {
        captured = input.originSender;
        return ok(makeAttachment(input));
      },
    });
    const longSender = 'Absender-'.repeat(100);
    expect(longSender.length).toBeGreaterThan(640);

    const intake: EmailIntake = {
      sender: longSender,
      message: null,
      files: [{ displayName: 'a.pdf', base64: base64Of('a') }],
      links: [],
      failed: [],
    };

    await attachEmailToNewTodo(context, intake, succeedingCreate({}), testLogger);

    expect(captured).toHaveLength(640);
    expect(longSender.startsWith(captured ?? '\0')).toBe(true);
  });
});
