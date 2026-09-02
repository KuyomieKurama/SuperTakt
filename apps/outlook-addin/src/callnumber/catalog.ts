/**
 * Takt — angebotener Vorrat erprobter Muster (B-4.1 Punkt 4).
 *
 * S-13 zeigt diese Liste **vor** dem Freitextfeld. Ein leeres Eingabefeld für
 * einen regulären Ausdruck ist die Einladung, den Fehler aus B-4.1 selbst zu
 * bauen; eine kurze Liste deckt den Normalfall und macht das Freitextfeld zum
 * Ausnahmeweg.
 *
 * **Alle Beispiele sind erfunden.** `TCK`, `SVC` und `INC` sind keine
 * Kennzeichen eines bestehenden Kunden oder Ticketsystems; die Beispieltexte
 * nennen keinen Namen und keinen echten Vorgang (CLAUDE.md, B-11.1).
 *
 * Jedes Muster hier erfüllt die Regeln aus B-4.3: genau eine Erfassungsgruppe,
 * kein Treffer auf leerem Text, kein Rückverweis, keine verschachtelte
 * Wiederholung. `checkPattern` wird im Nachweispfad über jeden Eintrag gefahren.
 *
 * **Die Klammer umfasst die vollständige Kennung, nicht nur die Ziffern.**
 * Übernommen wird Gruppe 1 (B-4.3 Punkt 1), und Gruppe 1 ist der Wert, der als
 * `Call` in die Abrechnung geht. `TCK-(\d{6})` läge nahe und wäre falsch: Es
 * lieferte `000042`, und in der Rechnung stünde eine Nummer ohne ihr Kürzel.
 * Der Nachweispfad prüft diesen Fall ausdrücklich.
 */

export interface PatternSuggestion {
  readonly id: string;
  readonly label: string;
  readonly source: string;
  /** Erfundener Beispieltext für den Testbereich in S-13. */
  readonly sample: string;
}

export const PATTERN_CATALOG: readonly PatternSuggestion[] = Object.freeze([
  {
    id: 'praefix-bindestrich',
    label: 'Kürzel, Bindestrich, sechs Ziffern — TCK-000042',
    source: '\\b(TCK-\\d{6})\\b',
    sample: 'Betreff: Rückfrage zu Vorgang TCK-000042 (erfundenes Beispiel)',
  },
  {
    id: 'praefix-ohne-trenner',
    label: 'Buchstabe und Ziffern ohne Trenner — C123456',
    source: '\\b(C\\d{6})\\b',
    sample: 'Betreff: C123456 — Nachtrag zum erfundenen Beispielvorgang',
  },
  {
    id: 'jahr-schraegstrich',
    label: 'Jahr, Schrägstrich, laufende Nummer — 2026/0815',
    source: '\\b(20\\d{2}/\\d{4})\\b',
    sample: 'Bitte auf 2026/0815 buchen. Erfundenes Beispiel.',
  },
  {
    id: 'eckige-klammern',
    label: 'In eckigen Klammern — [SVC-4711]',
    source: '\\[(SVC-\\d{4,8})\\]',
    sample: '[SVC-4711] Erfundene Beispielmeldung aus dem Ticketsystem',
  },
  {
    id: 'schluesselwort',
    label: 'Nach einem Schlüsselwort — Ticket: INC0004711',
    source: '(?:Ticket|Vorgang|Call)[:\\s]+([A-Z]{2,4}\\d{4,10})',
    sample: 'Ticket: INC0004711 — erfundener Beispieltext ohne Kundenbezug',
  },
]);

/**
 * Auslieferungswert (S-13, „auf Auslieferungswert zurücksetzen").
 *
 * Der erste Eintrag des Vorrats. Bewusst **kein** allgemeineres Muster: Ein
 * Auslieferungswert, der auf mehr zutrifft als nötig, ist die Voreinstellung,
 * über die R-15 stolpert.
 */
export const DEFAULT_PATTERN = PATTERN_CATALOG[0]?.source ?? '\\b(TCK-\\d{6})\\b';
