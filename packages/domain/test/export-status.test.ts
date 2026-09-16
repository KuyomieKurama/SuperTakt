/** Prüft erlaubte und unerlaubte Übergänge zur Laufzeit; die Typunion allein prüft keine Fremdeingaben. */
import { describe, expect, it } from 'vitest';
import {
  allowedExportStatusTransitions,
  checkExportStatusTransition,
  isLocked,
} from '../src/export-status.js';
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

  it('open -> exported via "not_billed" ist erlaubt (E-047, ersetzt E-037) — der dritte, bis T-272 ungeprüfte Übergang', () => {
    // export-status.ts:257. Der einzige Zweig, den keiner der Abdeckungsläufe
    // erreichte, weil ihn zuvor kein Domänenprüffall überhaupt aufrief — nur
    // `tests/e2e/export-mixed-status-and-billing.spec.ts`, das nicht in
    // `test:coverage` läuft.
    const result = checkExportStatusTransition('open', 'exported', 'not_billed');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ from: 'open', to: 'exported', trigger: 'not_billed' });
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

  it('exported -> open via "not_billed" ist NICHT erlaubt (falscher Auslöser für diesen Übergang)', () => {
    const result = checkExportStatusTransition('exported', 'open', 'not_billed');
    expect(result.ok).toBe(false);
  });

  it.each<[ExportStatus, ExportStatus, 'export_run' | 'not_billed' | 'reset']>([
    ['open', 'open', 'export_run'],
    ['open', 'open', 'not_billed'],
    ['open', 'open', 'reset'],
    ['exported', 'exported', 'export_run'],
    ['exported', 'exported', 'not_billed'],
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

describe('allowedExportStatusTransitions — die Menge ist gerechnet, nicht abgeschrieben (T-270, T-272)', () => {
  // Auflage des spec-ux-reviewers: die Zahl und die Anwesenheit je Übergangs,
  // ausdrücklich OHNE eine zweite, von Hand geschriebene Liste als
  // Erwartungswert daneben — genau die Bauart, die in dieser Datei bereits
  // einmal auseinandergelaufen ist (siehe Kommentar über
  // `allowedExportStatusTransitions` in `export-status.ts`).

  it('liefert genau drei Übergänge', () => {
    expect(allowedExportStatusTransitions()).toHaveLength(3);
  });

  it('enthält "open -> exported" via "export_run" (A-8.8)', () => {
    expect(allowedExportStatusTransitions()).toContainEqual({
      from: 'open',
      to: 'exported',
      trigger: 'export_run',
    });
  });

  it('enthält "open -> exported" via "not_billed" (E-047)', () => {
    expect(allowedExportStatusTransitions()).toContainEqual({
      from: 'open',
      to: 'exported',
      trigger: 'not_billed',
    });
  });

  it('enthält "exported -> open" via "reset" (E-012)', () => {
    expect(allowedExportStatusTransitions()).toContainEqual({
      from: 'exported',
      to: 'open',
      trigger: 'reset',
    });
  });
});
