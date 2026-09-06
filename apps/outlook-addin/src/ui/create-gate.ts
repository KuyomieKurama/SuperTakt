/**
 * Takt — warum „Todo anlegen" gesperrt ist (V-11 aus T-154).
 *
 * ## Der Befund
 *
 * Der Hauptknopf des Aufgabenbereichs hatte **vier** Sperrgründe und nannte
 * **keinen**. Zwei davon tragen eine Meldung an ihrem Feld (Call-Nummer,
 * Frist), zwei hatten überhaupt keine (leerer Titel, Dienst nicht bereit). Ein
 * gesperrter Hauptknopf ohne Begründung ist die Fläche, an der ein Benutzer
 * stehenbleibt — und im Aufgabenbereich ist das teurer als in der
 * Hauptanwendung: Er lebt in einem Outlook-Fenster an einer bestimmten
 * Nachricht, und es gibt keine zweite Fläche, auf der sich die Antwort finden
 * ließe.
 *
 * T-165 hat denselben Punkt aus der anderen Richtung bestätigt: Der lange
 * Hinweis am Fristfeld trägt „leer lassen heißt: keine Frist" **auch deshalb**,
 * weil ein Benutzer vor einem gesperrten Knopf das einzige leere Feld
 * verdächtigt. Diese Datei nimmt dem Hinweis diese Last ab.
 *
 * ## Warum das eine Rechnung ist und keine zwei
 *
 * `disabled` und der Satz darunter kommen aus **einem** Aufruf. Zwei Ausdrücke
 * nebeneinander — einer für die Sperre, einer für ihre Begründung — sind die
 * Bauart, aus der ein gesperrter Knopf ohne Grund oder ein Grund ohne Sperre
 * entsteht; dieselbe Klasse wie C-03, nur innerhalb einer Datei. Deshalb gilt
 * hier: **`blocked` ist genau dann wahr, wenn `reason` dasteht.**
 *
 * Ohne JSX, aus demselben Grund wie {@link ./field.ts}: Der Nachweispfad
 * (`proof:addin`, Abschnitt 19) kann die Rechnung über alle Fälle laufen
 * lassen, ohne den Aufgabenbereich zu zeichnen.
 *
 * ## Was hier **nicht** passiert
 *
 * Die Sperre wird nicht gelockert. T-154 Abschnitt 3.3 hat sie ausdrücklich
 * als die richtige Härte bestätigt — sie ersetzt keine Prüfung, denn die Tür
 * des Dienstes misst dieselben Werte noch einmal gegen dieselbe Regel aus
 * `@takt/domain`. Hinzu kommt allein die Auskunft.
 */

/** Der Ladezustand des Aufgabenbereichs, so weit er die Sperre angeht. */
export type Connection = 'loading' | 'ready' | 'failed';

export interface CreateTodoInputs {
  /** Der Feldinhalt, ungeschnitten — getrimmt wird hier. */
  readonly title: string;
  readonly connection: Connection;
  /** Die Meldung am Call-Nummer-Feld, oder `null`, wenn dort nichts steht. */
  readonly callNumberProblem: string | null;
  /** Steht im Fristfeld etwas, das kein Tag ist? (`readDueDate` → `invalid`) */
  readonly dueDateInvalid: boolean;
}

export interface CreateTodoGate {
  readonly blocked: boolean;
  /**
   * Der **erste** offene Grund, als ganzer Satz — oder `null`.
   *
   * Einer und nicht alle: Vier Sätze unter einem Knopf sind eine Liste, die
   * niemand liest, und der Benutzer räumt sie ohnehin nacheinander weg. Nach
   * jedem behobenen Grund steht der nächste da.
   */
  readonly reason: string | null;
}

/**
 * Der Satz je Grund — kurz, ohne Anrede (E-078, E-080 Punkt 4).
 *
 * Zwei der Gründe haben ihre ausführliche Meldung bereits am Feld
 * (`CALL_NUMBER_INPUT_MESSAGE`, `DUE_DATE_MESSAGE`, beide aus der Domäne). Der
 * Satz hier wiederholt sie nicht, er **zeigt auf sie**: Er sagt, welches Feld
 * den Knopf hält, und das Feld sagt, was daran nicht stimmt.
 */
const REASON = Object.freeze({
  call_number: 'Die Call-Nummer stimmt noch nicht.',
  title: 'Der Titel fehlt.',
  due_date: 'Die Frist stimmt noch nicht.',
  loading: 'Die Tags werden noch geladen.',
  failed: 'Keine Verbindung zu Takt.',
});

/**
 * Sperre und Grund in einem.
 *
 * **Die Reihenfolge ist die Lesereihenfolge der Fläche** — Call-Nummer, Titel,
 * Frist, und danach der Zustand der Verbindung. Sie ist kein Rang nach
 * Schwere: Wer von oben nach unten liest, findet den genannten Grund dort, wo
 * er zuerst hinsieht.
 *
 * Die Verbindung steht **zuletzt**, obwohl ohne sie nichts entsteht. Sie ist
 * der einzige Grund, der schon eine eigene sichtbare Fläche hat (Ladebild
 * beziehungsweise Meldung an der Stelle der Tagauswahl); als letzter Grund
 * erscheint der Satz genau dann, wenn er der einzige ist — und dann trägt er.
 */
export function createTodoGate({
  title,
  connection,
  callNumberProblem,
  dueDateInvalid,
}: CreateTodoInputs): CreateTodoGate {
  const reason =
    callNumberProblem !== null
      ? REASON.call_number
      : title.trim().length === 0
        ? REASON.title
        : dueDateInvalid
          ? REASON.due_date
          : connection === 'loading'
            ? REASON.loading
            : connection === 'failed'
              ? REASON.failed
              : null;

  return { blocked: reason !== null, reason };
}
