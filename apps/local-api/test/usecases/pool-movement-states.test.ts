/**
 * Takt — T-105, die drei Zustandspaare der Buchungswirkung (E-061, Auftrag
 * aus `reports/T-101-domain-dev.md` "Nächster Schritt" 2b).
 *
 * `bookingMovementStates`, `closedEntryMovementStates` und
 * `completionMovementStates` bauen das Zustandspaar, gegen das
 * `poolMovementNamer` eine Bewegung rechnet (siehe
 * `apps/local-api/test/usecases/pool-movement.test.ts` für `poolMovementNamer`
 * selbst). Diese drei Funktionen waren bislang ungeprüft — keiner ihrer Namen
 * kommt vor dieser Datei in einem Test vor.
 *
 * ---------------------------------------------------------------------------
 * Der wichtigste Einzelfall: die Gegenprobe aus T-101 Annahme 1
 * ---------------------------------------------------------------------------
 *
 * `bookingMovementStates` und `closedEntryMovementStates` unterscheiden sich
 * in GENAU einer Achse: Ob `completedAt` mit umgelegt wird. Der Unterschied
 * ist erreichbar — Timer starten, das Todo WÄHREND des laufenden Timers von
 * Hand auf erledigt setzen, stoppen — und domain-dev hat ihn im Bericht mit
 * einem Wegwerfskript nachgewiesen:
 *
 *     Stopp auf einem Todo, das WÄHREND des laufenden Timers erledigt wurde
 *       -> {"appears":["NurErledigt"],"enters":[],"leaves":[]}
 *
 * Mit `bookingMovementStates` hätte derselbe Stopp fälschlich eine Aufhebung
 * gemeldet ("NurOffen" tritt ein, "NurErledigt" verlässt). Diese Datei baut
 * den Fall als stehenden, automatisierten Test nach, statt ihn nur im Bericht
 * stehen zu lassen.
 */
import { describe, expect, it } from 'vitest';
import type { StatusId, TagId, Timestamp } from '@takt/domain';
import {
  NO_ENTRIES,
  bookingMovementStates,
  closedEntryMovementStates,
  completionMovementStates,
} from '../../src/usecases/pool-movement.ts';
import type { BookingPresenceBefore, MovingTodo } from '../../src/usecases/pool-movement.ts';

const tagId = (value: string) => value as unknown as TagId;
const statusId = (value: string) => value as unknown as StatusId;
const timestamp = (value: string) => value as unknown as Timestamp;

const STATUS = statusId('status-1');
const TAGS = [tagId('a'), tagId('b')];
const DONE_AT = timestamp('2026-08-31T08:00:00Z');

const movingTodo = (overrides: Partial<MovingTodo> = {}): MovingTodo => ({
  tagIds: TAGS,
  statusId: STATUS,
  completedAt: null,
  ...overrides,
});

describe('bookingMovementStates — Wirkung einer Buchung (BOOKING_EFFECT: completedAt -> null, hasOpenEntries -> true)', () => {
  it('ein erledigtes Todo: "before" trägt den echten (erledigten) Zustand, "after" hebt Erledigt auf und setzt hasOpenEntries', () => {
    const states = bookingMovementStates(movingTodo({ completedAt: DONE_AT }), {
      hasOpen: false,
      hasExported: false,
    });

    expect(states.before).toEqual({
      tagIds: TAGS,
      statusId: STATUS,
      completedAt: DONE_AT,
      hasOpenEntries: false,
      hasExportedEntries: false,
    });
    expect(states.after).toEqual({
      tagIds: TAGS,
      statusId: STATUS,
      completedAt: null,
      hasOpenEntries: true,
      hasExportedEntries: false,
    });
  });

  it('ein bereits aktives Todo: completedAt bleibt beiderseits null, nur hasOpenEntries wechselt von falsch auf wahr', () => {
    const states = bookingMovementStates(movingTodo({ completedAt: null }), NO_ENTRIES);
    expect(states.before.completedAt).toBeNull();
    expect(states.after.completedAt).toBeNull();
    expect(states.before.hasOpenEntries).toBe(false);
    expect(states.after.hasOpenEntries).toBe(true);
  });

  it('hasExportedEntries bleibt unangetastet — eine neue Buchung ändert eine bereits exportierte nicht', () => {
    const states = bookingMovementStates(movingTodo(), { hasOpen: false, hasExported: true });
    expect(states.before.hasExportedEntries).toBe(true);
    expect(states.after.hasExportedEntries).toBe(true);
  });

  it('Tags und Status wandern unverändert durch — eine Buchung fasst sie nicht an', () => {
    const states = bookingMovementStates(movingTodo(), NO_ENTRIES);
    expect(states.before.tagIds).toEqual(TAGS);
    expect(states.after.tagIds).toEqual(TAGS);
    expect(states.before.statusId).toBe(STATUS);
    expect(states.after.statusId).toBe(STATUS);
  });
});

describe('closedEntryMovementStates — Wirkung des Stopps (ENTRY_CLOSED_EFFECT: NUR hasOpenEntries -> true, completedAt bleibt)', () => {
  it('ein WÄHREND des laufenden Timers erledigt gesetztes Todo bleibt nach dem Stopp erledigt — der Unterschied zu bookingMovementStates', () => {
    const states = closedEntryMovementStates(movingTodo({ completedAt: DONE_AT }), {
      hasOpen: false,
      hasExported: false,
    });

    expect(states.before.completedAt).toBe(DONE_AT);
    expect(states.after.completedAt).toBe(DONE_AT); // <- bleibt gesetzt, anders als bei bookingMovementStates
    expect(states.before.hasOpenEntries).toBe(false);
    expect(states.after.hasOpenEntries).toBe(true);
  });

  it('Gegenprobe (T-101 Annahme 1, gemessene Zeile aus dem Bericht): dieselbe Ausgangslage ergäbe mit bookingMovementStates fälschlich eine Aufhebung', () => {
    const before = movingTodo({ completedAt: DONE_AT });
    const entries: BookingPresenceBefore = { hasOpen: false, hasExported: false };

    const correct = closedEntryMovementStates(before, entries);
    const wrongIfUsedHere = bookingMovementStates(before, entries);

    // Die richtige Rechnung für einen Stopp: das Kennzeichen bleibt gesetzt.
    expect(correct.after.completedAt).not.toBeNull();
    // Die falsche Rechnung, die T-101 als Fehlerquelle identifiziert hat: eine
    // Aufhebung, die am Stopp nicht stattfindet (A-2.5 — nur der Start hebt
    // "Erledigt" auf).
    expect(wrongIfUsedHere.after.completedAt).toBeNull();
    expect(correct.after.completedAt).not.toEqual(wrongIfUsedHere.after.completedAt);
  });

  it('ein aktives Todo bleibt aktiv, nur hasOpenEntries wechselt', () => {
    const states = closedEntryMovementStates(movingTodo({ completedAt: null }), NO_ENTRIES);
    expect(states.before.completedAt).toBeNull();
    expect(states.after.completedAt).toBeNull();
    expect(states.after.hasOpenEntries).toBe(true);
  });

  it('hasExportedEntries bleibt unangetastet, Tags und Status wandern unverändert durch', () => {
    const states = closedEntryMovementStates(movingTodo(), { hasOpen: false, hasExported: true });
    expect(states.before.hasExportedEntries).toBe(true);
    expect(states.after.hasExportedEntries).toBe(true);
    expect(states.after.tagIds).toEqual(TAGS);
    expect(states.after.statusId).toBe(STATUS);
  });
});

describe('completionMovementStates — allein das Erledigt-Kennzeichen (E-060, PUT/DELETE /todos/{id}/done)', () => {
  it('Setzen (PUT /done): completedAt wechselt von null auf den übergebenen Zeitstempel, sonst ändert sich nichts', () => {
    const entries: BookingPresenceBefore = { hasOpen: true, hasExported: true };
    const states = completionMovementStates(movingTodo({ completedAt: null }), entries, DONE_AT);

    expect(states.before).toEqual({
      tagIds: TAGS,
      statusId: STATUS,
      completedAt: null,
      hasOpenEntries: true,
      hasExportedEntries: true,
    });
    expect(states.after).toEqual({ ...states.before, completedAt: DONE_AT });
  });

  it('Aufheben (DELETE /done): completedAt wechselt vom Zeitstempel auf null, sonst ändert sich nichts', () => {
    const states = completionMovementStates(movingTodo({ completedAt: DONE_AT }), NO_ENTRIES, null);
    expect(states.before.completedAt).toBe(DONE_AT);
    expect(states.after.completedAt).toBeNull();
    expect(states.after.hasOpenEntries).toBe(false);
    expect(states.after.hasExportedEntries).toBe(false);
  });

  it('completedAfter wird ÜBERGEBEN und nicht geraten — hasOpenEntries/hasExportedEntries kommen unverändert aus dem zweiten Argument', () => {
    const states = completionMovementStates(movingTodo(), { hasOpen: true, hasExported: false }, DONE_AT);
    expect(states.before.hasOpenEntries).toBe(true);
    expect(states.after.hasOpenEntries).toBe(true);
    expect(states.before.hasExportedEntries).toBe(false);
    expect(states.after.hasExportedEntries).toBe(false);
  });

  it('ein unveränderter Zeitstempel (zweimal derselbe Wert) ergibt before === after in jedem Feld — die Aufrufstelle erkennt daran "nichts zu tun"', () => {
    const states = completionMovementStates(movingTodo({ completedAt: DONE_AT }), NO_ENTRIES, DONE_AT);
    expect(states.before).toEqual(states.after);
  });
});
