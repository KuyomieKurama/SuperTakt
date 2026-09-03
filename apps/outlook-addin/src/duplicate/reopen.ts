/**
 * Takt — was der Benutzer erfährt, wenn eine Buchung sein Todo bewegt
 * (A-2.5, I-05, E-056, E-058, Befund C-03 aus T-025).
 *
 * ## Warum die Datei weiterhin `reopen.ts` heißt
 *
 * Sie ist als Datei über das Wiederöffnen entstanden und stellt seit T-084 zwei
 * Auskünfte zusammen: die über die Aufhebung von „Erledigt" und die über die
 * **Bewegung**, die jede Buchung auslösen kann — auch auf einem Todo, an dem es
 * nichts aufzuheben gibt. Beide gibt es in einer Fassung für vorher und einer
 * für nachher, und beide dürfen sich nicht widersprechen. Getrennte Dateien
 * wären zwei Orte für dieselbe Auskunft und damit zwei Gelegenheiten,
 * Verschiedenes zu behaupten — genau der Grund, aus dem „vorher" und „nachher"
 * hier schon immer nebeneinanderstehen.
 *
 * ## Was diese Datei seit T-092 **nicht** mehr tut (E-058)
 *
 * Sie formuliert den Satz über die Bewegung nicht mehr selbst. Bis T-092 stand
 * er hier — `poolSentence` und `bookingPoolSentence`, dazu die beiden
 * Bausteine `listPools` und `inPools` —, und zeichengleich noch einmal in der
 * Hauptanwendung. Zwei Abschriften desselben Textes sind zwei Gelegenheiten,
 * Verschiedenes zu sagen, und sie haben es zweimal getan: Der eine Satz kannte
 * `leaves` nicht, der andere nannte eine reine Board-Spalte „Pool".
 *
 * Der Satz liegt jetzt in `packages/domain/src/pool-movement.ts`
 * (`poolMovementSentence`), die **Rechnung** dahinter in
 * `apps/local-api/src/usecases/pool-movement.ts`. Diese Datei ruft die eine und
 * bekommt die andere über den Dienst; sie hält keine Abschrift und kann
 * deshalb auch keine zweite Wahrheit entwickeln. Was hier bleibt, ist die
 * **Anordnung**: welcher Satz in welcher Zeitform neben welchen anderen Zeilen
 * steht.
 *
 * `CARD_STAYS` („Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch
 * nicht.") ist mit derselben Auflage **ersatzlos** gestrichen (E-058 Absatz 2).
 * Der Satz stammte aus der Zeit, in der eine Spalte nur an Tags hing; seit
 * E-055 entscheidet sie auch über „Erledigt" und über den Exportstatus, und
 * beides ändert eine Buchung. Er war also falsch. Es tritt nichts an seine
 * Stelle: Wo sich etwas ändert, sagt `poolMovementSentence` was — und wo sich
 * nichts ändert, ist Schweigen die richtige Auskunft.
 *
 * ## Warum es diese Datei gibt
 *
 * Bis T-038 stand im Aufgabenbereich ein Kästchen: „Das Todo ist erledigt.
 * Beim Buchen wieder aktiv setzen" — Voreinstellung **aus**. Wer es übersah,
 * hatte danach eine Buchung auf einem Vorgang, der weiterhin als erledigt galt
 * und in keinem Pool auftauchte. In der Hauptanwendung geschieht bei derselben
 * Handlung das Gegenteil: Dort hebt der Timerstart das Kennzeichen automatisch
 * auf. Dieselbe Handlung, zwei Ergebnisse — und das unauffälligere war das
 * falsche.
 *
 * Das Kästchen ist weg. Die Aufhebung geschieht automatisch. Damit sie
 * trotzdem keine stille Änderung ist, sagt der Aufgabenbereich sie an — und
 * zwar zweimal:
 *
 *  - **vor** der Buchung, an der Karte des gefundenen Todos und noch einmal
 *    unmittelbar über der Schaltfläche, und
 *  - **danach** in der Bestätigung.
 *
 * ## Warum kein „Rückgängig" wie in der Hauptanwendung
 *
 * Die Hauptanwendung bietet nach I-05 ein Rückgängig an, das die eben
 * entstandene Buchung verwirft und das Kennzeichen zurücksetzt. Das Add-in
 * kann das nicht anbieten, ohne dass das **dauerhafte** Add-in-Token zwei neue
 * Fähigkeiten bekäme: eine Buchung löschen und ein Todo als erledigt
 * kennzeichnen. Beides ist genau die Ausweitung, die T-034 zurückgebaut hat
 * (B-2.9 Punkt 3, RR-1) — ein entwendetes Token käme damit an fremde
 * Buchungen.
 *
 * Der Ersatz ist nicht weniger, sondern früher: Die Auskunft steht **vor** der
 * Entscheidung. Wer sie liest und es nicht will, bucht nicht — und muss nichts
 * zurücknehmen. Rückgängig gemacht wird in der Hauptanwendung; sie liegt einen
 * Fensterwechsel entfernt und hat die Fläche dafür.
 *
 * Rein und ohne Outlook prüfbar: Werte herein, Sätze heraus.
 */

import { poolMovementSentence, type PoolMovement } from '@takt/domain';

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
export const bookingOutcome = (minutes: number, movement: PoolMovement): BookingNotice => ({
  booked: `${String(minutes)} Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.`,
  pools: poolMovementSentence(movement, 'past', 'booking'),
});

/**
 * Was geschehen **wird** — steht über der Schaltfläche, nicht darunter.
 *
 * `movement` ist ein Wert mit drei benannten Listen und keine drei Argumente
 * hintereinander; die Begründung steht an `PoolMovement` in `@takt/domain`. Es
 * ist ausdrücklich **nicht** freiwillig: Wer nur das Erscheinen mitgäbe, bekäme
 * einen Satz, der sich vollständig liest und die Hälfte weglässt (E-056) —
 * dieselbe Art Fehler, die T-078 im Dienst behoben hat.
 */
export const reopenPreview = (minutes: number, movement: PoolMovement): ReopenNotice => ({
  title: 'Dieses Todo ist erledigt. Mit dieser Buchung wird es wieder offen.',
  effects: [
    `${String(minutes)} Minuten werden gebucht.`,
    'Das Erledigt-Kennzeichen wird automatisch aufgehoben.',
    poolMovementSentence(movement, 'future', 'reopen'),
  ],
});

/** Was geschehen **ist**. Dieselben drei Wirkungen, dieselbe Reihenfolge. */
export const reopenOutcome = (
  todoTitle: string,
  minutes: number,
  movement: PoolMovement,
): ReopenNotice => ({
  title: `Gebucht. „${todoTitle}“ ist wieder offen.`,
  effects: [
    `${String(minutes)} Minuten sind gebucht.`,
    'Das Erledigt-Kennzeichen ist aufgehoben.',
    poolMovementSentence(movement, 'past', 'reopen'),
  ],
});
