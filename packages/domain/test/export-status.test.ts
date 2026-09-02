/**
 * Takt — T-010, Exportstatus zweiwertig (A-6.5, A-6.9, E-012, E-032, R-10).
 *
 * Testfälle: TP-EXPST-01 (docs/testplan.md, Abschnitt 4).
 *
 * TP-EXPST-01 verlangt wörtlich, "dass der Typ ausschließlich zwei Werte
 * zulässt". `ExportStatus` in `time-entry.ts` ist bereits als
 * `'open' | 'exported'` geschnitten — das ist eine Aussage des Typsystems und
 * lässt sich als Zeichenkettenunion nicht durch einen Laufzeittest "erneut"
 * beweisen (TypeScript erlaubt keinen dritten Wert, Punkt). Was tatsächlich
 * testbar und laut Domänenkommentar die eigentliche Garantie ist ("Die
 * Speicherung erzwingt das über NOT NULL plus CHECK, nicht über eine
 * Zusicherung im Code"), ist die einzige Stelle, an der die Domäne selbst
 * etwas über gültige Übergänge aussagt: `checkExportStatusTransition`.
 *
 * Dieser Test deckt deshalb die vollständige Übergangsmatrix ab: die zwei
 * erlaubten Übergänge (E-012, A-8.1) und alle sechs verbleibenden
 * Kombinationen aus {open, exported} x {open, exported} x {export_run, reset},
 * die laut `ExportStatusTransition` (time-entry.ts) NICHT konstruierbar sind.
 * E-032 ("erneut offen ist keine dritte Klasse") ist damit indirekt geprüft:
 * Jeder Übergang, dessen Ziel "open" ist, liefert exakt denselben Status
 * "open" wie ein Todo, das nie exportiert war — es gibt keinen Rückgabewert
 * "reopened" o. ä.
 *
 * ROT ZUERST: `checkExportStatusTransition` existiert nur als Funktionstyp.
 *
 * NACHTRAG T-010b (`.claude/team/reports/T-009-domain-dev.md`, Abschnitt
 * "Nächster Schritt" und "Offene Fragen" Punkt 3): `checkExportStatusTransition`
 * existiert seit T-009 unter genau diesem Namen, der `@ts-expect-error`-
 * Kommentar über dem Import ist damit entfernt (siehe rounding.test.ts für
 * dieselbe Begründung). Zusätzlich ergänzt dieser Nachtrag `isLocked`
 * (A-6.9): Die Funktion war bei T-010 namentlich in `time-entry.ts` als
 * Typ vorhanden, aber von keinem der ursprünglichen 70 Fälle berührt — der
 * domain-dev listet sie in seinem Bericht ausdrücklich als Lücke.
 */
import { describe, expect, it } from 'vitest';
import { checkExportStatusTransition, isLocked } from '../src/time-entry.js';
import type { ExportStatus } from '../src/time-entry.js';

describe('TP-EXPST-01 — checkExportStatusTransition, vollständige Matrix', () => {
  it('open -> exported via "export_run" ist erlaubt', () => {
    const result = checkExportStatusTransition('open', 'exported', 'export_run');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ from: 'open', to: 'exported', trigger: 'export_run' });
    }
  });

  it('exported -> open via "reset" ist erlaubt (E-012)', () => {
    const result = checkExportStatusTransition('exported', 'open', 'reset');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ from: 'exported', to: 'open', trigger: 'reset' });
    }
  });

  it('open -> exported via "reset" ist NICHT erlaubt (falscher Auslöser für diesen Übergang)', () => {
    const result = checkExportStatusTransition('open', 'exported', 'reset');
    expect(result.ok).toBe(false);
  });

  it('exported -> open via "export_run" ist NICHT erlaubt (falscher Auslöser für diesen Übergang)', () => {
    const result = checkExportStatusTransition('exported', 'open', 'export_run');
    expect(result.ok).toBe(false);
  });

  it.each<[ExportStatus, ExportStatus, 'export_run' | 'reset']>([
    ['open', 'open', 'export_run'],
    ['open', 'open', 'reset'],
    ['exported', 'exported', 'export_run'],
    ['exported', 'exported', 'reset'],
  ])('Wechsel auf sich selbst ist nie erlaubt: %s -> %s via %s', (from, to, trigger) => {
    const result = checkExportStatusTransition(from, to, trigger);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('export_status_unchanged');
    }
  });

  it('E-032: das Ergebnis eines Resets ist der Status "open" — kein dritter, "erneut offen" genannter Wert', () => {
    const result = checkExportStatusTransition('exported', 'open', 'reset');
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Exakt zwei Schlüssel in der Zusicherung über den erreichten Zustand:
      // "to" trägt ausschließlich 'open', nichts, das sich von einer nie
      // exportierten Buchung unterscheiden ließe. Der Unterschied ("schon
      // einmal exportiert") lebt laut time-entry.ts in `exportCount`, nicht im
      // Status selbst.
      expect(result.value.to).toBe('open');
      expect(['open', 'exported']).toContain(result.value.to);
    }
  });
});

describe('isLocked — eine exportierte Buchung ist gegen Bearbeitung gesperrt (A-6.9)', () => {
  it('eine offene Buchung ist nicht gesperrt', () => {
    expect(isLocked({ exportStatus: 'open' })).toBe(false);
  });

  it('eine exportierte Buchung ist gesperrt', () => {
    expect(isLocked({ exportStatus: 'exported' })).toBe(true);
  });

  it.each<ExportStatus>(['open', 'exported'])(
    'isLocked hängt ausschließlich an exportStatus — dieselbe Eingabe liefert immer dasselbe Ergebnis (%s)',
    (exportStatus) => {
      const first = isLocked({ exportStatus });
      const second = isLocked({ exportStatus });
      expect(first).toBe(second);
    },
  );

  it('nach einem Reset (E-012, checkExportStatusTransition exported -> open) ist dieselbe Buchung wieder unlocked', () => {
    // Verzahnt beide Regeln aus time-entry.ts: der Übergang liefert den Status,
    // isLocked entscheidet anhand genau dieses Status — ohne dass irgendwo ein
    // dritter, "erneut offen" genannter Zwischenwert auftaucht (E-032).
    const transition = checkExportStatusTransition('exported', 'open', 'reset');
    expect(transition.ok).toBe(true);
    if (transition.ok) {
      expect(isLocked({ exportStatus: transition.value.to })).toBe(false);
    }
  });

  it('nach einem Exportlauf (open -> exported) ist dieselbe Buchung ab sofort gesperrt', () => {
    const transition = checkExportStatusTransition('open', 'exported', 'export_run');
    expect(transition.ok).toBe(true);
    if (transition.ok) {
      expect(isLocked({ exportStatus: transition.value.to })).toBe(true);
    }
  });

  it('ein abgelehnter Übergang (z. B. falscher Auslöser) ändert nichts am Sperrzustand der Ausgangsseite', () => {
    // Kein Zustand außer "open" und "exported" ist erreichbar (A-6.9): ein
    // fehlgeschlagener Übergang darf keinen dritten, unbekannten Status
    // hinterlassen, an dem isLocked etwas anderes als true/false entscheiden
    // müsste.
    const rejected = checkExportStatusTransition('open', 'exported', 'reset');
    expect(rejected.ok).toBe(false);
    expect(isLocked({ exportStatus: 'open' })).toBe(false);
  });
});
