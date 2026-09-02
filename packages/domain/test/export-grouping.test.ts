/**
 * Takt — T-010, Gruppierung je Todo und Kalendertag (E-020, E-025, R-10).
 *
 * Testfälle: TP-EXPORT-11 bis TP-EXPORT-15a, TP-EXPORT-17 (docs/testplan.md,
 * Abschnitt 9a). Die Rundung selbst ist nicht Gegenstand dieser Datei (siehe
 * rounding.test.ts); hier wird ausschließlich geprüft, *welche* Buchungen zu
 * *welcher* Gruppe zusammengefasst werden.
 *
 * ANNAHME ZUR MODULSTRUKTUR (siehe Bericht T-010-unit-tester, Abschnitt
 * "Annahmen"): `packages/domain/src/export.ts` liefert bislang nur die Typen
 * `ExportCandidate` und `ExportGroup`. Dieser Test nimmt an, dass T-009 dort
 * zusätzlich eine reine Funktion
 *
 *     groupExportCandidates(candidates: readonly ExportCandidate[]): readonly ExportGroup[]
 *
 * ergänzt. Begründung: `ExportCandidate` trägt laut Kommentar in export.ts
 * ausschließlich bereits offene Buchungen (die zugrundeliegende Sicht
 * `v_export_candidate` in `packages/storage/migrations/0001_initial.up.sql`
 * filtert `export_status = 'open'` bereits in SQL) — die Funktion hier muss
 * also nicht nach Status filtern, sondern ausschließlich nach Todo und
 * Kalendertag gruppieren, nach Startzeit sortieren und das `previouslyExported`-
 * Flag der Gruppe aus den Flags der enthaltenen Buchungen ableiten (R-10).
 * Liegt die Gruppierung stattdessen ausschließlich in der SQL-Abfrage des
 * Speicher-Adapters (`packages/storage`), ist das ein Befund: Diese Datei
 * müsste dann nach `packages/storage/test/` wandern und gegen eine echte
 * SQLite-Verbindung laufen statt gegen eine reine Funktion.
 *
 * TP-EXPORT-14 (gemischter Exportstatus) folgt aus genau dieser Architektur:
 * Eine bereits exportierte Buchung ist gar kein gültiger `ExportCandidate` und
 * wird dieser Funktion nie übergeben. Der Test unten belegt deshalb die
 * *Kehrseite* derselben Zusicherung — dass die Gruppe ausschließlich die Summe
 * der tatsächlich übergebenen (= offenen) Buchungen bildet und keine
 * verborgene dritte Quelle für die Summe existiert — und dass eine zuvor
 * exportierte, jetzt aber zurückgesetzte Buchung (die per Definition wieder
 * ein gültiger `ExportCandidate` mit `previouslyExported: true` ist) korrekt
 * über das Gruppenflag sichtbar bleibt (Grundlage von TP-EXPORT-17).
 *
 * ROT ZUERST: `groupExportCandidates` existiert nicht.
 *
 * NACHTRAG T-010b: `groupExportCandidates` existiert seit T-009 unter genau
 * diesem Namen; der `@ts-expect-error`-Kommentar über dem Import ist damit
 * entfernt (siehe rounding.test.ts für dieselbe Begründung).
 */
import { describe, expect, it } from 'vitest';
import { groupExportCandidates } from '../src/export.js';
import type { ExportCandidate } from '../src/export.js';
import type { TimeEntryId, Timestamp, TodoId } from '../src/kernel.js';

const todoId = (value: string) => value as unknown as TodoId;
const timeEntryId = (value: string) => value as unknown as TimeEntryId;
const timestamp = (value: string) => value as unknown as Timestamp;

function candidate(partial: {
  readonly id: string;
  readonly todo: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationSeconds: number;
  readonly bookingNote?: string;
  readonly previouslyExported?: boolean;
}): ExportCandidate {
  return {
    timeEntryId: timeEntryId(partial.id),
    todoId: todoId(partial.todo),
    startedAt: timestamp(partial.startedAt),
    endedAt: timestamp(partial.endedAt),
    durationSeconds: partial.durationSeconds,
    bookingNote: partial.bookingNote ?? '',
    todoTitle: `Todo ${partial.todo}`,
    todoCallNumber: null,
    todoTagNames: [],
    previouslyExported: partial.previouslyExported ?? false,
  };
}

describe('TP-EXPORT-11 — mehrere Buchungen, ein Todo, ein Tag: eine Gruppe', () => {
  it('drei Buchungen desselben Todos am selben Kalendertag bilden genau eine Gruppe', () => {
    const c1 = candidate({ id: 'te-1', todo: 'call-4711', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600, bookingNote: 'A' });
    const c2 = candidate({ id: 'te-2', todo: 'call-4711', startedAt: '2026-01-15T09:00:00Z', endedAt: '2026-01-15T09:20:00Z', durationSeconds: 1200, bookingNote: 'B' });
    const c3 = candidate({ id: 'te-3', todo: 'call-4711', startedAt: '2026-01-15T10:00:00Z', endedAt: '2026-01-15T10:05:00Z', durationSeconds: 300, bookingNote: 'C' });

    const groups = groupExportCandidates([c1, c2, c3]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries).toHaveLength(3);
    expect(groups[0]?.entries.map((entry) => entry.timeEntryId)).toEqual([timeEntryId('te-1'), timeEntryId('te-2'), timeEntryId('te-3')]);
  });
});

describe('TP-EXPORT-12 — dasselbe Todo, verschiedene Tage: getrennte Gruppen', () => {
  it('zwei Buchungen an zwei Kalendertagen ergeben zwei Gruppen', () => {
    const c1 = candidate({ id: 'te-1', todo: 'call-4711', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600 });
    const c2 = candidate({ id: 'te-2', todo: 'call-4711', startedAt: '2026-01-16T08:00:00Z', endedAt: '2026-01-16T08:10:00Z', durationSeconds: 600 });

    const groups = groupExportCandidates([c1, c2]);

    expect(groups).toHaveLength(2);
    expect(new Set(groups.map((group) => group.day))).toEqual(new Set([groups[0]?.day, groups[1]?.day]));
    expect(groups[0]?.day).not.toBe(groups[1]?.day);
  });
});

describe('TP-EXPORT-13 — verschiedene Todos, derselbe Tag: getrennte Gruppen', () => {
  it('keine Zusammenführung über Todo-Grenzen hinweg', () => {
    const c1 = candidate({ id: 'te-1', todo: 'todo-a', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600 });
    const c2 = candidate({ id: 'te-2', todo: 'todo-b', startedAt: '2026-01-15T09:00:00Z', endedAt: '2026-01-15T09:10:00Z', durationSeconds: 600 });

    const groups = groupExportCandidates([c1, c2]);

    expect(groups).toHaveLength(2);
    expect(new Set(groups.map((group) => group.todoId))).toEqual(new Set([todoId('todo-a'), todoId('todo-b')]));
  });
});

describe('TP-EXPORT-14 — gemischter Exportstatus (R-10, kritisch)', () => {
  it('die Gruppe summiert ausschließlich die tatsächlich übergebenen (= offenen) Buchungen', () => {
    // Die dritte, bereits exportierte Buchung des Beispiels aus dem Testplan
    // taucht hier bewusst NICHT auf: Sie ist per Vertrag kein ExportCandidate
    // (siehe Kopfkommentar). Würde eine fehlerhafte Umsetzung sie dennoch
    // einschleusen (z. B. weil die SQL-Sicht falsch gefiltert hat), bliebe das
    // ein Fund für packages/storage, nicht für diese reine Funktion — diese
    // Funktion kann nur beweisen, dass sie mit dem, was sie bekommt, korrekt
    // umgeht und nichts zusätzlich hinzurechnet.
    const open1 = candidate({ id: 'te-open-1', todo: 'call-9000', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600 });
    const open2 = candidate({ id: 'te-open-2', todo: 'call-9000', startedAt: '2026-01-15T09:00:00Z', endedAt: '2026-01-15T09:15:00Z', durationSeconds: 900 });

    const groups = groupExportCandidates([open1, open2]);

    expect(groups).toHaveLength(1);
    const sum = groups[0]?.entries.reduce((total, entry) => total + entry.durationSeconds, 0);
    expect(sum).toBe(1500);
    expect(groups[0]?.entries).toHaveLength(2);
  });

  it('TP-EXPORT-17: previouslyExported an der Gruppe ist wahr, sobald mindestens eine Buchung zurückgesetzt wurde', () => {
    const resetEntry = candidate({ id: 'te-reset', todo: 'call-9000', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600, previouslyExported: true });
    const freshEntry = candidate({ id: 'te-fresh', todo: 'call-9000', startedAt: '2026-01-15T09:00:00Z', endedAt: '2026-01-15T09:10:00Z', durationSeconds: 600, previouslyExported: false });

    const groups = groupExportCandidates([resetEntry, freshEntry]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.previouslyExported).toBe(true);
  });

  it('previouslyExported ist falsch, wenn keine Buchung der Gruppe je exportiert war', () => {
    const c1 = candidate({ id: 'te-1', todo: 'call-9001', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600 });

    const groups = groupExportCandidates([c1]);

    expect(groups[0]?.previouslyExported).toBe(false);
  });
});

describe('TP-EXPORT-15 — Buchung über Mitternacht: der Starttag zählt vollständig (E-025)', () => {
  it('23:40 bis 00:20 Ortszeit (Europe/Berlin, siehe vitest.config.ts) zählt vollständig zum Starttag', () => {
    // 2026-01-15 ist außerhalb der Sommerzeit (CET, UTC+1): 23:40 Ortszeit am
    // 15.1. entspricht 22:40 UTC; 00:20 Ortszeit am 16.1. entspricht 23:20 UTC
    // desselben UTC-Kalendertags. Beide Zeitstempel tragen also zufällig
    // dasselbe UTC-Datum ("2026-01-15") — eine Umsetzung, die den Kalendertag
    // naiv aus dem UTC-Datumsanteil des Zeitstempels ableitet statt ihn korrekt
    // in Ortszeit umzurechnen, würde hier zwar zufällig ebenfalls "15" liefern.
    // Entscheidend ist trotzdem: Es darf nur EINE Gruppe entstehen, mit der
    // vollen Dauer von 40 Minuten, nicht gesplittet auf zwei Gruppen.
    const overMidnight = candidate({
      id: 'te-midnight',
      todo: 'call-mitternacht',
      startedAt: '2026-01-15T22:40:00Z',
      endedAt: '2026-01-15T23:20:00Z',
      durationSeconds: 40 * 60,
    });

    const groups = groupExportCandidates([overMidnight]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[0]?.entries[0]?.durationSeconds).toBe(40 * 60);
  });
});

describe('TP-EXPORT-15a — zwei Buchungen knapp vor/nach Mitternacht: zwei getrennte Gruppen', () => {
  it('23:50 des Tages X und 00:10 des Folgetags X+1 ergeben zwei Gruppen desselben Todos', () => {
    const beforeMidnight = candidate({
      id: 'te-before',
      todo: 'call-mitternacht-2',
      startedAt: '2026-01-15T22:50:00Z', // 23:50 Ortszeit, 15.1.
      endedAt: '2026-01-15T23:00:00Z',
      durationSeconds: 600,
    });
    const afterMidnight = candidate({
      id: 'te-after',
      todo: 'call-mitternacht-2',
      startedAt: '2026-01-15T23:10:00Z', // 00:10 Ortszeit, 16.1. — nur 20 Min. später
      endedAt: '2026-01-15T23:20:00Z',
      durationSeconds: 600,
    });

    const groups = groupExportCandidates([beforeMidnight, afterMidnight]);

    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.todoId === todoId('call-mitternacht-2'))).toBe(true);
    expect(groups[0]?.day).not.toBe(groups[1]?.day);
  });
});

describe('Sortierung der Gruppen selbst (R-17: gleicher Bestand, gleiche Zeilenfolge, unabhängig von der Eingabereihenfolge)', () => {
  it('Gruppen erscheinen in aufsteigender Tag+Todo-Reihenfolge, auch wenn die Eingabe in umgekehrter Reihenfolge übergeben wird', () => {
    // Ohne diesen Test bliebe der "swap"-Zweig des Sortiervergleichs
    // (`groupSortKey(left) < groupSortKey(right) ? -1 : 1`) ungeprüft: Die
    // übrigen Tests dieser Datei übergeben Kandidaten bereits in
    // aufsteigender Reihenfolge, sodass ein Komparator, der niemals wirklich
    // vertauscht, ebenfalls bestünde.
    const later = candidate({ id: 'te-later', todo: 'call-order', startedAt: '2026-01-16T08:00:00Z', endedAt: '2026-01-16T08:10:00Z', durationSeconds: 600 });
    const earlier = candidate({ id: 'te-earlier', todo: 'call-order', startedAt: '2026-01-15T08:00:00Z', endedAt: '2026-01-15T08:10:00Z', durationSeconds: 600 });

    // Bewusst in der "falschen", absteigenden Reihenfolge übergeben.
    const groups = groupExportCandidates([later, earlier]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.entries[0]?.timeEntryId).toEqual(timeEntryId('te-earlier'));
    expect(groups[1]?.entries[0]?.timeEntryId).toEqual(timeEntryId('te-later'));
    expect(groups[0]!.day < groups[1]!.day).toBe(true);
  });
});

describe('Sortierung innerhalb einer Gruppe', () => {
  it('entries sind nach startedAt aufsteigend sortiert, unabhängig von der Übergabereihenfolge', () => {
    // TP-EXPORT-16 setzt genau darauf auf: die Zusammenführung der
    // Leistungstexte (siehe packages/export/test/) verlässt sich auf diese
    // Sortierung und mischt nicht selbst neu.
    const late = candidate({ id: 'te-late', todo: 'call-order', startedAt: '2026-01-15T14:00:00Z', endedAt: '2026-01-15T14:05:00Z', durationSeconds: 300, bookingNote: 'spät' });
    const early = candidate({ id: 'te-early', todo: 'call-order', startedAt: '2026-01-15T09:00:00Z', endedAt: '2026-01-15T09:05:00Z', durationSeconds: 300, bookingNote: 'früh' });
    const middle = candidate({ id: 'te-middle', todo: 'call-order', startedAt: '2026-01-15T11:30:00Z', endedAt: '2026-01-15T11:35:00Z', durationSeconds: 300, bookingNote: 'mitte' });

    const groups = groupExportCandidates([late, early, middle]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries.map((entry) => entry.bookingNote)).toEqual(['früh', 'mitte', 'spät']);
  });
});
