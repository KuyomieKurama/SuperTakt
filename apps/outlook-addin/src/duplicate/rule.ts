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
 *     Erledigt-Kennzeichen, die Pools und die Aufteilung der bereits gebuchten
 *     Zeit. Eine anonyme Ja/Nein-Frage beantwortet jeder mit Ja.
 *
 * Seit T-038 gehört zu Punkt 3 auch die **Folge** der Entscheidung: Ist das
 * gefundene Todo erledigt, wird es durch die Buchung automatisch wieder offen
 * (A-2.5). Das steht im Angebot, nicht in einer Fußnote danach — die Sätze
 * dafür liegen in `reopen.ts`.
 */

import { checkCallNumber, type CallNumberRejection } from '@takt/domain';
import type { TodoMatchDto } from '../api/types.ts';
import type { PoolMovement } from './reopen.ts';

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
   * Die Pools, in denen dieses Todo **nach der Buchung** steht — beim Namen
   * (I-05).
   *
   * Gehört zum Angebot, weil ein erledigtes Todo mit dieser Buchung wieder
   * offen wird (A-2.5) und der Benutzer **vor** der Entscheidung wissen soll,
   * wo es danach steht. Aus dem Dienst übernommen, nicht im Add-in gerechnet —
   * und dort über alle fünf Achsen einer Regel gerechnet, nicht nur über die
   * Tags (T-078).
   */
  readonly poolNames: readonly string[];
  /**
   * Die Pools, in die dieselbe Buchung es **hineinbewegt** — beim Namen
   * (T-084). Teilmenge von `poolNames`.
   *
   * Gehört ebenfalls zum Angebot, und zwar für den **häufigeren** Fall: Das
   * gefundene Todo ist meistens nicht erledigt, und dann gibt es nichts
   * aufzuheben und nichts anzukündigen — außer dieser einen Bewegung. Die
   * erste Buchung auf einem Todo hebt es in jede Spalte, die nach offener,
   * noch nicht abgerechneter Zeit fragt.
   */
  readonly enteringPoolNames: readonly string[];
  /**
   * Die Pools, aus denen dieselbe Buchung es **entfernt** — beim Namen
   * (E-056).
   *
   * Steht neben `poolNames` und nicht darin: Beides sind Namen, und eine
   * gemeinsame Liste könnte nicht mehr sagen, in welche Richtung sich der Pool
   * bewegt. Fast immer leer; nur eine Regel über „Erledigt" kann ein Todo
   * durch eine Buchung verlieren.
   */
  readonly leavingPoolNames: readonly string[];
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
    poolNames: match.poolNames,
    enteringPoolNames: match.enteringPoolNames,
    leavingPoolNames: match.leavingPoolNames,
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

/**
 * Die drei Poollisten eines Angebots als **ein** Wert (T-084).
 *
 * Steht hier und nicht im Aufgabenbereich, damit es sie genau einmal gibt. Die
 * drei Listen sind gleich getippt; wer sie an zwei Stellen einzeln zuweist,
 * hat zwei Gelegenheiten, `enters` und `leaves` zu vertauschen — und bekäme
 * einen Satz, der sich fehlerfrei liest und das Gegenteil behauptet. Der
 * Nachweispfad baut denselben Wert über dieselbe Funktion und misst damit die
 * Zusammensetzung mit, die der Aufgabenbereich benutzt.
 */
export const offerMovement = (offer: OfferDescription): PoolMovement => ({
  appears: offer.poolNames,
  enters: offer.enteringPoolNames,
  leaves: offer.leavingPoolNames,
});
