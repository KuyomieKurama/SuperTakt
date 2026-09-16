/** Das Add-in kündigt Wiederöffnung und Poolbewegungen vor und nach der Buchung an.
 * Rückgängig erfolgt in der Hauptanwendung, damit das Add-in-Token keine Lösch- oder Erledigungsrechte erhält. */

import { poolMovementSentence, type PoolMovement } from '@takt/domain';

/**
 * Was an die Stelle einer **fehlenden** Bewegung tritt (E-061 Punkt 3, T-104).
 *
 * Seit die Add-in-Routen `poolMovement: PoolMovement | null` liefern, gibt es
 * zwei Auskünfte, die für die Anzeige dasselbe bedeuten: „nachgesehen und
 * nichts gefunden" (drei leere Listen) und „hier war keine Bewegung möglich"
 * (`null`, weil das Todo offen ist und schon eine offene Buchung hat). Für den
 * Anlass `'booking'` fallen beide von selbst zusammen — `poolMovementSentence`
 * gibt dort ohne Zu- und Abgang ohnehin `null`, und die Fläche entfällt.
 *
 * Für den Anlass `'reopen'` gibt es keinen leeren Satz: Er hat auch ohne jeden
 * Treffer etwas zu sagen („Auf dieses Todo passt derzeit keine Regel …"), und
 * genau deshalb ist er der ehrlichere. Der Dienst liefert für ein erledigtes
 * Todo deshalb **immer** einen Wert: Die Buchung hebt „Erledigt" auf (A-2.5),
 * das Zustandspaar ist verschieden, und es wird gerechnet. Diese Zeile ist die
 * Vorsichtsfassung für den Fall, den es nicht geben soll — und sie ist die
 * richtige Richtung: Der Satz daraus verspricht **kein** Wiederauftauchen und
 * nennt keinen Namen, den niemand geprüft hat. Ein Todo, das nirgends
 * angekündigt wird und dann doch auftaucht, sucht niemand vergeblich; umgekehrt
 * schon.
 */
const NOTHING_MOVED: PoolMovement = Object.freeze({
  appears: [],
  enters: [],
  leaves: [],
});

/**
 * Die zwei Wirkungen einer Buchung auf ein **erledigtes** Todo, in anzeigbarer
 * Form.
 */
export interface ReopenNotice {
  readonly title: string;
  /**
   * Genau drei Sätze — Buchung, Kennzeichen, Bewegung.
   *
   * Die Zahl ist Absicht und wird im Nachweispfad festgehalten. Fällt einer
   * weg, ist es wieder eine halbe Auskunft.
   *
   * Eine **vierte** Zeile für das, was sich *nicht* ändert, gab es bis T-092
   * daneben (`aside`, mit `CARD_STAYS`). Sie ist weg, und zwar ersatzlos: Der
   * dritte Satz sagt seit E-058 vollständig, was sich bewegt — eine Zeile
   * daneben, die etwas anderes behauptet, war der Fehler und nicht die
   * Ergänzung.
   */
  readonly effects: readonly [string, string, string];
}

/** Kurzform für die Trefferliste, wo eine Zeile Platz ist und keine drei. */
export const REOPEN_HINT =
  'Dieses Todo ist erledigt. Eine Buchung darauf hebt das Kennzeichen automatisch auf.';

/** Die Bestätigung nach einer Buchung auf ein offenes Todo (T-084). */
export interface BookingNotice {
  /** Die Buchung selbst. Steht immer da. */
  readonly booked: string;
  /**
   * Der Satz über die Bewegung — `null`, wenn die Buchung nichts bewegt hat.
   *
   * Zwei Felder und keine Liste von ein oder zwei Zeichenketten: Eine Liste
   * ließe die Aufrufstelle über ihre Länge urteilen, und „Länge 1" ist eine
   * schwächere Aussage als „hier ist kein Satz".
   *
   * `null` kommt aus `poolMovementSentence` mit dem Anlass `'booking'` und wird
   * hier **nicht** in einen leeren String übersetzt. Ein leerer String ist ein
   * Satz mit null Zeichen, und die Oberfläche baut ihm eine Zeile; `null`
   * zwingt die Aufrufstelle, die Fläche ganz wegzulassen.
   */
  readonly pools: string | null;
}

/**
 * Die Bestätigung nach einer Buchung auf ein **offenes** Todo (T-084).
 *
 * Das Gegenstück zu {@link reopenOutcome}, für den Fall, in dem nichts
 * aufgehoben wird. Die Ankündigung davor ist kein eigener Bauplan, sondern
 * derselbe Satz in der anderen Zeitform: `poolMovementSentence(movement,
 * 'future', 'booking')`, gerufen im Aufgabenbereich. Über der Schaltfläche
 * steht die Dauer als Eingabefeld daneben — eine Zeile „15 Minuten werden
 * gebucht" wäre dort die Wiederholung eines Werts, den der Benutzer gerade
 * selbst eingestellt hat.
 *
 * **Der Anlass ist `'booking'` und nicht `'reopen'`**, und das ist keine
 * Feinheit: Der Anlass entscheidet, **welche Liste** aufgezählt wird. Beim
 * Wiederöffnen ist es `appears` — das Todo war in keinem dieser Pools zu
 * sehen —, hier ist es `enters`. Eine Aufzählung von `appears` wäre hier lauter
 * Unverändertes, in dem die eine Änderung untergeht, und das Wort „wieder"
 * behauptete eine Vorgeschichte, die es nicht gibt.
 *
 * **`booked` ist unverändert.** Der Satz stand bis T-084 im Aufgabenbereich als
 * Text im JSX und ist Zeichen für Zeichen derselbe geblieben — hierher gezogen,
 * damit der Nachweispfad ihn messen kann, ohne die Oberfläche zu rendern.
 */
export const bookingOutcome = (
  minutes: number,
  movement: PoolMovement | null,
): BookingNotice => ({
  booked: `${String(minutes)} Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.`,
  // Zwei Wege zu `null`, und beide heißen für die Anzeige dasselbe: Der Dienst
  // hat nichts gerechnet, oder er hat gerechnet und nichts gefunden. In beiden
  // Fällen steht keine Zeile da.
  pools: movement === null ? null : poolMovementSentence(movement, 'past', 'booking'),
});

/**
 * Was geschehen **wird** — steht über der Schaltfläche, nicht darunter.
 *
 * `movement` ist ein Wert mit drei benannten Listen und keine drei Argumente
 * hintereinander; die Begründung steht an `PoolMovement` in `@takt/domain`. Es
 * ist ausdrücklich **nicht** freiwillig: Wer nur das Erscheinen mitgäbe, bekäme
 * einen Satz, der sich vollständig liest und die Hälfte weglässt (E-056) —
 * dieselbe Art Fehler, die T-078 im Dienst behoben hat.
 *
 * `null` nimmt es entgegen, weil die Antwort des Dienstes es so führt (E-061
 * Punkt 3) — und **nicht**, weil der dritte Satz entfallen dürfte. Es sind drei,
 * und drei bleiben es; die Begründung steht an {@link NOTHING_MOVED}.
 */
export const reopenPreview = (minutes: number, movement: PoolMovement | null): ReopenNotice => ({
  title: 'Dieses Todo ist erledigt. Mit dieser Buchung wird es wieder offen.',
  effects: [
    `${String(minutes)} Minuten werden gebucht.`,
    'Das Erledigt-Kennzeichen wird automatisch aufgehoben.',
    poolMovementSentence(movement ?? NOTHING_MOVED, 'future', 'reopen'),
  ],
});

/** Was geschehen **ist**. Dieselben drei Wirkungen, dieselbe Reihenfolge. */
export const reopenOutcome = (
  todoTitle: string,
  minutes: number,
  movement: PoolMovement | null,
): ReopenNotice => ({
  title: `Gebucht. „${todoTitle}“ ist wieder offen.`,
  effects: [
    `${String(minutes)} Minuten sind gebucht.`,
    'Das Erledigt-Kennzeichen ist aufgehoben.',
    poolMovementSentence(movement ?? NOTHING_MOVED, 'past', 'reopen'),
  ],
});
