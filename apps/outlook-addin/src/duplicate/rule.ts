/**
 * Takt — wann das Add-in überhaupt nach einem Duplikat fragt (A-10.9, R-15).
 *
 * Diese Datei ist klein und trägt trotzdem den Schaden aus R-15. Der Angriff
 * ist keiner: Er sieht aus wie eine hilfreiche Voreinstellung. Jemand trägt in
 * S-13 ein zu weites Muster ein — `(.*)` genügt —, das Add-in „erkennt" auf
 * jeder E-Mail etwas, findet damit immer dasselbe vorhandene Todo und bietet
 * an, darauf zu buchen. Der Benutzer bestätigt, weil der Vorschlag plausibel
 * aussieht. Die Arbeitszeit für Kunde A landet auf dem Vorgang von Kunde B und
 * wird so abgerechnet.
 *
 * Drei Riegel, alle hier oder unmittelbar daneben:
 *
 *  1. **Nicht plausibel → gar nicht suchen** (B-4.3 Punkt 4). Nicht „suchen und
 *     nichts finden": Es wird keine Abfrage gestellt.
 *  2. **Der Dienst prüft dasselbe noch einmal**, in
 *     `apps/local-api/src/routes/addin/service.ts`. Seit E-045 ist es
 *     dieselbe Funktion aus `@takt/domain` und nicht mehr eine Zweitschrift:
 *     Die Prüfung findet trotzdem zweimal statt, weil ein Aufrufer ein
 *     beliebiger lokaler Prozess mit einem Token ist und nicht notwendig
 *     dieses Add-in (B-2.9, RR-1). Zwei Aufrufe derselben Regel sind eine
 *     Vertrauensgrenze; zwei Fassungen derselben Regel waren ein Risiko.
 *  3. **Ein Treffer ist ein Angebot, kein Vollzug.** `describeOffer` liefert,
 *     was vor der Entscheidung sichtbar sein muss: Titel, Call-Nummer,
 *     Erledigt-Kennzeichen, die Bewegung durch die Regeln — Pools wie
 *     Board-Spalten — und die Aufteilung der bereits gebuchten Zeit. Eine
 *     anonyme Ja/Nein-Frage beantwortet jeder mit Ja.
 *
 * Seit T-038 gehört zu Punkt 3 auch die **Folge** der Entscheidung: Ist das
 * gefundene Todo erledigt, wird es durch die Buchung automatisch wieder offen
 * (A-2.5). Das steht im Angebot, nicht in einer Fußnote danach — die Sätze
 * dafür liegen in `reopen.ts`.
 */

import { checkCallNumber, type CallNumberRejection, type PoolMovement } from '@takt/domain';
import type { TodoMatchDto } from '../api/types.ts';

export type LookupDecision =
  | { readonly kind: 'lookup'; readonly callNumber: string }
  | { readonly kind: 'skip'; readonly reason: CallNumberRejection };

/**
 * Darf mit diesem Wert nach einem vorhandenen Todo gefragt werden?
 *
 * Der Aufrufer darf das Ergebnis **nicht** umgehen. Es gibt im Add-in keinen
 * zweiten Weg zu `findMatches`.
 */
export const decideLookup = (callNumber: unknown): LookupDecision => {
  const checked = checkCallNumber(callNumber);
  return checked.ok
    ? { kind: 'lookup', callNumber: checked.value }
    : { kind: 'skip', reason: checked.reason };
};

export interface OfferDescription {
  readonly todoId: string;
  readonly title: string;
  readonly callNumber: string;
  readonly isDone: boolean;
  /** Bereits gebuchte, noch nicht exportierte Zeit — in Sekunden. */
  readonly openSeconds: number;
  /**
   * Bereits abgerechnete Zeit — in Sekunden.
   *
   * Steht hier, weil ein Todo mit exportierter Zeit ein **abgerechneter**
   * Vorgang ist. Darauf weiterzubuchen ist erlaubt und manchmal richtig, aber
   * es soll niemandem entgehen (Punkt 16 aus T-005, A-6.6).
   */
  readonly exportedSeconds: number;
  /**
   * Wohin die Buchung dieses Todo bewegen **würde** — oder `null` (I-05,
   * E-056, T-084, E-061 Punkt 3).
   *
   * Gehört zum Angebot, weil ein erledigtes Todo mit dieser Buchung wieder
   * offen wird (A-2.5) und der Benutzer **vor** der Entscheidung wissen soll,
   * wo es danach steht. Und für den häufigeren Fall — das gefundene Todo ist
   * meistens nicht erledigt — steht in `enters` die einzige Auskunft, die es
   * dort zu geben gibt: Die erste Buchung hebt das Todo in jede Regel, die
   * nach offener, noch nicht abgerechneter Zeit fragt.
   *
   * Aus dem Dienst übernommen, nicht im Add-in gerechnet — und dort über alle
   * fünf Achsen einer Regel gerechnet, nicht nur über die Tags (T-078). Der
   * Wert wird unverändert an `poolMovementSentence` weitergereicht; das
   * Add-in setzt ihn nicht zusammen und nimmt ihn nicht auseinander.
   *
   * `null` heißt: Diese Buchung bewegt nichts, und der Aufgabenbereich sagt
   * dann kein Wort über Pools.
   */
  readonly poolMovement: PoolMovement | null;
  /** Ein Satz, der in S-12 unmittelbar über den Schaltflächen stehen kann. */
  readonly summary: string;
}

const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '0:00 h';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours)}:${String(minutes).padStart(2, '0')} h`;
};

/**
 * Setzt aus einem Treffer die Angaben zusammen, die **vor** dem Buchen zu sehen
 * sein müssen (R-15, B-4.3 Punkt 6).
 *
 * Kein Treffer ohne Call-Nummer: Ein `null` an dieser Stelle wäre genau der
 * Fall, den Riegel 1 ausschließt, und wird hier noch einmal abgefangen, statt
 * als leerer Text in der Oberfläche zu landen.
 */
export const describeOffer = (match: TodoMatchDto): OfferDescription | null => {
  const checked = checkCallNumber(match.callNumber);
  if (!checked.ok) return null;

  const isDone = match.completedAt !== null;

  const parts: string[] = [`Bereits gebucht: ${formatDuration(match.openSeconds)} offen`];
  if (match.exportedSeconds > 0) {
    parts.push(`${formatDuration(match.exportedSeconds)} bereits exportiert`);
  }
  if (isDone) {
    parts.push('Erledigt');
  }

  return {
    todoId: match.id,
    title: match.title,
    callNumber: checked.value,
    isDone,
    openSeconds: match.openSeconds,
    exportedSeconds: match.exportedSeconds,
    poolMovement: match.poolMovement,
    summary: `${parts.join(' · ')}.`,
  };
};

/**
 * Bereitet alle Treffer auf und wirft weg, was kein Angebot sein darf.
 *
 * Es gibt bewusst **keine** Vorauswahl und keine Sortierung nach
 * „wahrscheinlichstem" Treffer. Eine Vorauswahl ist der erste Schritt zu einer
 * stillen Entscheidung, und A-10.9 verlangt das Gegenteil.
 */
export const describeOffers = (matches: readonly TodoMatchDto[]): readonly OfferDescription[] =>
  matches.map(describeOffer).filter((offer): offer is OfferDescription => offer !== null);

/*
 * Hier stand bis T-104 ein `offerMovement(offer)`, das die drei Listen des
 * Angebots zu **einem** `PoolMovement` zusammensetzte (T-084, E-058).
 *
 * Es ist ersatzlos weg, und zwar weil sein Grund weggefallen ist: Die drei
 * Listen waren gleich getippt, und wer sie zusammensetzte, hatte jedesmal die
 * Gelegenheit, `enters` und `leaves` zu vertauschen — ein Satz, der sich
 * fehlerfrei liest und das Gegenteil behauptet. Seit E-061 Punkt 3 liefert der
 * Dienst den Wert bereits zusammengesetzt (`poolMovement`); es gibt nichts mehr
 * zusammenzusetzen und damit auch nichts mehr zu vertauschen.
 *
 * Wer den Wert braucht, liest `offer.poolMovement` — denselben Typ, den
 * `poolMovementSentence` entgegennimmt und den `usecases/pool-movement.ts`
 * ausrechnet.
 */
