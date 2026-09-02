/**
 * Takt — T-010, Zusammenführung der Leistungstexte einer Tagesgruppe
 * (E-020, E-026, E-028, A-7.4, A-8.4).
 *
 * Testfälle: TP-EXPORT-16, TP-EXPORT-16a (-1 bis -4), TP-EXPORT-16b,
 * TP-EXPORT-16c (offene Frage, siehe unten). docs/testplan.md, Abschnitt 9a.
 *
 * ANNAHME ZUR MODULSTRUKTUR: `packages/export/src/merge-notes.ts`,
 *
 *     mergeBookingNotes(notes: readonly string[]): string
 *
 * Die Eingabe ist bereits nach Startzeit sortiert (Vertrag von
 * `groupExportCandidates` in `packages/domain/src/export.ts`, siehe
 * `packages/domain/test/export-grouping.test.ts`, Abschnitt "Sortierung
 * innerhalb einer Gruppe") — diese Funktion sortiert selbst nicht neu, sie
 * normalisiert Ränder, überspringt leere Segmente und verbindet mit "; ".
 *
 * E-028 ausdrücklich: kein Escaping, keine Ersetzung, keine Kürzung des
 * Textinhalts abseits der Randnormalisierung. Kein Testfall dieser Datei
 * versucht, den zusammengeführten Text zurückzuparsen (kein Rückparsen,
 * ausdrücklich in TP-EXPORT-16a festgehalten).
 *
 * ROT ZUERST: `mergeBookingNotes` existiert nicht (Paket `packages/export`
 * existiert noch gar nicht).
 */
import { describe, expect, it } from 'vitest';
import { mergeBookingNotes } from '../src/merge-notes.js';

describe('TP-EXPORT-16 — Randnormalisierung, Trennung mit "; ", leere Segmente übersprungen', () => {
  it('drei Segmente, eines davon leer: das leere fällt vollständig weg, kein doppeltes Trennzeichen', () => {
    const result = mergeBookingNotes(['Rückruf entgegengenommen', '', 'Ticket geschlossen']);
    expect(result).toBe('Rückruf entgegengenommen; Ticket geschlossen');
    expect(result).not.toContain(';;');
    expect(result).not.toMatch(/;\s*;/);
  });

  it('Reihenfolge folgt exakt der Eingabereihenfolge (die Funktion sortiert nicht selbst, das tut die Gruppierung vorher)', () => {
    const result = mergeBookingNotes(['zuerst', 'zweitens', 'drittens']);
    expect(result).toBe('zuerst; zweitens; drittens');
  });
});

describe('TP-EXPORT-16a — Randnormalisierung im Detail, kein Rückparsen, kein Escaping (E-028)', () => {
  it('TP-EXPORT-16a-1: ein Semikolon MITTEN im Text bleibt unverändert, kein Escaping', () => {
    const result = mergeBookingNotes(['Analyse gemacht; Fix eingespielt', 'Test']);
    expect(result).toBe('Analyse gemacht; Fix eingespielt; Test');
  });

  it('TP-EXPORT-16a-2: ein abschließendes Semikolon entfällt bei der Randnormalisierung — kein ";;"', () => {
    const result = mergeBookingNotes(['Rückruf erledigt;', 'Test']);
    expect(result).toBe('Rückruf erledigt; Test');
    expect(result).not.toContain(';;');
  });

  it('TP-EXPORT-16a-3: ein abschließender Punkt entfällt — kein ".; "', () => {
    const result = mergeBookingNotes(['Rückruf erledigt.', 'Test']);
    expect(result).toBe('Rückruf erledigt; Test');
    expect(result).not.toContain('.;');
  });

  it('TP-EXPORT-16a-4: ein Segment aus ausschließlich Leerzeichen gilt als leer und wird übersprungen', () => {
    const result = mergeBookingNotes(['   ', 'Test']);
    expect(result).toBe('Test');
  });
});

describe('TP-EXPORT-16b — Tagesgruppe mit genau einer Buchung: Randnormalisierung ohne Trennzeichen', () => {
  it('ein einzelnes Segment wird getrimmt und um einen abschließenden Punkt bereinigt, aber nicht mit sich selbst verbunden', () => {
    const result = mergeBookingNotes(['  Kunde zurückgerufen.  ']);
    expect(result).toBe('Kunde zurückgerufen');
    expect(result).not.toContain(';');
  });
});

describe('TP-EXPORT-16c — alle Segmente einer Tagesgruppe leer (E-034, ausdrücklich offene Frage)', () => {
  it('DOKUMENTIERT OHNE FESTE ERWARTUNG: das Ergebnis für ausschließlich leere Segmente ist nicht abschließend festgelegt', () => {
    // Der Orchestrator hat diesen Fall in T-016 ausdrücklich offengelassen
    // ("Er hängt daran, ob das Abrechnungstool eine leere Notiz annimmt, und
    // das weiß ich nicht."). Diese Datei erfindet deshalb keine Erwartung für
    // mergeBookingNotes(['', '']) — sie hält nur fest, dass das Ergebnis in
    // jedem Fall ein leerer String ist (kein Platzhaltertext, siehe E-034:
    // "Einen Platzhaltertext einzusetzen hieße, erfundene Daten an den Kunden
    // zu schicken"), und delegiert die Frage "ist die Gruppe damit
    // exportierbar" ausdrücklich an eine separate Prüfung (siehe
    // exportability.test.ts), nicht an diese Funktion.
    const result = mergeBookingNotes(['', '']);
    expect(result).toBe('');
  });
});
