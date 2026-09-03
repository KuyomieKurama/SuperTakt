/**
 * Takt — der Satz über die Bewegung eines Todos durch die Pools
 * (A-2.5, E-056, E-058, I-05).
 *
 * ---------------------------------------------------------------------------
 * Warum dieser Text in der Domäne steht
 * ---------------------------------------------------------------------------
 *
 * Weil er an zwei Flächen zeichengleich sein muß und zweimal danebenlag.
 *
 * Der Satz „Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch
 * nicht." stand bis E-058 zeichengleich in `apps/web/src/lib/labels.ts` und in
 * `apps/outlook-addin/src/duplicate/reopen.ts`. Er stammte aus der Zeit, in der
 * eine Spalte nur an Tags hing. Seit E-055 entscheidet eine Spalte auch über
 * „Erledigt" und über den Exportstatus, und **beides ändert ein Timerstart**:
 * Das Kennzeichen fällt (A-2.5), die erste Buchung setzt „hat offene
 * Buchungen". Der Satz war also falsch — an vier Flächen gleichzeitig, und
 * niemand konnte ihn an einer Stelle richtigstellen.
 *
 * Deshalb: **eine** Quelle. Die Hauptanwendung und der Aufgabenbereich des
 * Add-ins rufen diese Funktion; keine hält eine eigene Abschrift. `proof:addin`
 * prüft die Gleichheit weiter, jetzt gegen die Funktion statt gegen eine
 * Abschrift.
 *
 * Rein: drei Listen herein, ein Satz heraus. Keine Uhr, kein Netz, keine
 * Datenbank, kein HTTP, kein SQL — und deshalb ohne laufenden Dienst prüfbar.
 * Diese Datei importiert nichts; sie braucht nichts.
 *
 * ---------------------------------------------------------------------------
 * Was gegenüber `reopen.ts` geändert ist — genau eine Sache
 * ---------------------------------------------------------------------------
 *
 * „Poolregel" heißt jetzt **Regel** (E-058 Absatz 2). Eine Regel hat seit
 * E-055 fünf Achsen: erforderliche Tags, ausgeschlossene Tags, Status,
 * Erledigt und Exportstatus. Von „der Poolregel auf seine Tags" zu sprechen
 * benennt eine von fünf und legt dem Benutzer nahe, an den übrigen vier nach
 * dem Grund zu suchen, warum sein Todo nirgends auftaucht.
 *
 * Alles andere ist Wort für Wort übernommen. Das ist Absicht: Die Sätze sind
 * an beiden Flächen erprobt, und eine Verbesserung nebenbei wäre eine
 * Änderung, die in keiner Entscheidung steht.
 */

/**
 * Die Bewegung eines Todos durch die Pools (E-056, T-084, E-058).
 *
 * Drei Listen mit **Namen** statt dreier Argumente hintereinander: Alle sind
 * `readonly string[]`, und wer sie vertauscht, bekommt einen Satz, der sich
 * fehlerfrei liest und das Gegenteil behauptet. Felder mit Namen lassen sich
 * nicht stillschweigend verdrehen.
 *
 * Die Bedeutungen sind die aus T-084, und sie sind nicht austauschbar:
 *
 *   `appears` — gilt **nachher**. Der Zustand, nicht die Bewegung. Fast immer
 *               besetzt, auch wenn sich nichts rührt.
 *   `enters`  — gilt nachher und galt **vorher nicht**. Die Teilmenge von
 *               `appears`, die die Bewegung trägt.
 *   `leaves`  — galt **vorher** und gilt nachher nicht.
 *
 * Ein Pool steht nie zugleich in `enters` und `leaves`: „erscheint" und
 * „verschwindet" über denselben Namen wäre kein Satz, den jemand lesen möchte.
 * Dafür sorgt die Stelle, die rechnet (`usecases/pool-movement.ts`), und nicht
 * diese Datei — sie hat keine Regel und dürfte darüber auch nicht urteilen.
 *
 * **Namen und keine Kennungen**, obwohl zwei Pools denselben Namen tragen
 * dürfen. Der Satz ist für einen Menschen, der die Namen gleich in der
 * Hauptanwendung wiederfindet; eine Kennung im Satz wäre unlesbar. Die
 * Rechnung dahinter unterscheidet die beiden sehr wohl — sie vergleicht
 * Regeln, nicht Namen.
 */
export interface PoolMovement {
  /** Pools, in denen das Todo **nach** der Handlung steht. */
  readonly appears: readonly string[];
  /** Pools, in die dieselbe Handlung es **hineinbewegt** (T-084). */
  readonly enters: readonly string[];
  /** Pools, aus denen dieselbe Handlung es **entfernt** (E-056). */
  readonly leaves: readonly string[];
}

/**
 * Vor der Handlung angekündigt oder danach berichtet.
 *
 * Beide Fassungen stehen in **einer** Funktion, weil sie dieselbe Auskunft
 * geben müssen. Zwei Textbausteine an zwei Stellen wären zwei Gelegenheiten,
 * Verschiedenes zu behaupten — das ist Befund C-03 aus T-025, und er hat
 * einmal gereicht.
 */
export type PoolMovementTense = 'future' | 'past';

/**
 * Welche der beiden Auskünfte gemeint ist.
 *
 * Kein Schmuck, sondern zwei verschiedene Fragen an dieselben drei Listen:
 *
 *   `'reopen'`  — **das Todo war erledigt und wird wieder aktiv** (A-2.5). Der
 *                 Satz zählt `appears` auf, also den Zustand danach, und sagt
 *                 „wieder". Beides ist hier richtig: In keinem dieser Pools war
 *                 das Todo zu sehen, solange es erledigt war, und die Aufhebung
 *                 ist eine Rückkehr.
 *   `'booking'` — **es war nicht erledigt, und trotzdem bewegt sich etwas.**
 *                 Die erste abgeschlossene Buchung setzt „hat offene
 *                 Buchungen", und jede Spalte, die nach noch nicht
 *                 abgerechneter Zeit fragt (`exportState: 'open'`), nimmt das
 *                 Todo damit auf. Hier wäre „wieder" eine erfundene
 *                 Vorgeschichte, und eine Aufzählung von `appears` wäre lauter
 *                 Unverändertes, in dem die eine Änderung untergeht. Der Satz
 *                 nennt deshalb `enters` und `leaves` — und nur sie.
 */
export type PoolMovementOccasion = 'reopen' | 'booking';

/**
 * Zählt Pools **einzeln** auf, in deutschen Anführungszeichen.
 *
 * Keine Zusammenfassung wie „in 3 Pools": Der Benutzer soll die Namen lesen,
 * die er gleich in der Hauptanwendung wiederfindet. Eine Zahl wäre schneller
 * geschrieben und ließe die Frage offen, die sie beantworten soll.
 */
const listPools = (poolNames: readonly string[]): string => {
  const quoted = poolNames.map((name) => `„${name}“`);
  if (quoted.length <= 1) return quoted[0] ?? '';
  return `${quoted.slice(0, -1).join(', ')} und ${quoted[quoted.length - 1] ?? ''}`;
};

/**
 * „dem Pool X" oder „den Pools X und Y" — der Einschub, der in jeden Satz
 * dieser Datei paßt.
 *
 * Die Zahl der Pools entscheidet über den Artikel; ein „in den Pools „X“" für
 * einen einzigen wäre die Art Fehler, die jeder liest und niemand meldet.
 */
const inPools = (names: readonly string[]): string =>
  `${names.length === 1 ? 'dem Pool' : 'den Pools'} ${listPools(names)}`;

/**
 * Der Satz über die Bewegung — vor oder nach der Handlung (E-058).
 *
 * ---------------------------------------------------------------------------
 * Zur Signatur: warum ein drittes Argument und warum es Pflicht ist
 * ---------------------------------------------------------------------------
 *
 * E-058 nennt die Funktion `poolMovementSentence(movement, tense)` und
 * verlangt zugleich, daß **beide** Sätze erreichbar bleiben — der über das
 * Wiederöffnen und der über die reine Buchung. Beide aus denselben drei Listen
 * abzuleiten geht nicht: Sie unterscheiden sich nicht in der Formulierung,
 * sondern darin, **welche Liste** sie aufzählen (`appears` gegen `enters`) und
 * ob es überhaupt etwas zu sagen gibt. Aus `{appears, enters, leaves}` allein
 * ist nicht zu erkennen, welche der beiden Fragen gestellt wurde.
 *
 * Also ein drittes Argument — und **ohne Vorgabewert**. Ein Vorgabewert hieße:
 * Wer schweigt, bekommt einen von zwei verschiedenen Sätzen, und niemand wird
 * rot. Das ist dieselbe Falle wie bei `unresolvedRequired` (E-057), und sie
 * kostet hier nur einen falschen Satz statt einer falschen Menge — aber sie
 * kostet ihn still.
 *
 * ---------------------------------------------------------------------------
 * Zur Rückgabe: `string` beim Wiederöffnen, `string | null` bei der Buchung
 * ---------------------------------------------------------------------------
 *
 * Die Überladungen sagen es dem Aufrufer, statt ihn raten zu lassen.
 *
 *  - `'reopen'` **hat immer etwas zu sagen**, auch wenn beide Listen leer sind:
 *    „Auf dieses Todo paßt derzeit keine Regel — es erscheint danach in keinem
 *    Pool." Das ist die unangenehmere, aber die wahre Auskunft. Ein Todo, auf
 *    das keine Regel paßt, ist nach der Aufhebung offen und trotzdem nirgends
 *    zu sehen außer in der Todo-Liste; wer das verschweigt, schickt jemanden
 *    suchen.
 *  - `'booking'` liefert `null`, wenn `enters` und `leaves` leer sind — der
 *    Normalfall bei jeder zweiten und jeder weiteren Buchung. `null` und nicht
 *    der leere String: Ein leerer String ist ein Satz mit null Zeichen, und die
 *    Oberfläche baut ihm eine Zeile. `null` zwingt die Aufrufstelle, den Fall
 *    zu behandeln — und sie behandelt ihn, indem sie die Fläche **ganz** wegläßt
 *    und nicht mit `?? ''`.
 *
 * Die dritte Überladung nimmt einen zur Laufzeit entschiedenen Anlaß entgegen
 * und gibt dafür die schwächere Zusage `string | null`. Sie ist der Fall, in
 * dem der Aufrufer selbst erst zwischen Wiederöffnen und Buchung unterscheiden
 * muß — die Hauptanwendung nach `POST /timer/start` etwa.
 *
 * ---------------------------------------------------------------------------
 * Warum die Fälle ausgeschrieben stehen
 * ---------------------------------------------------------------------------
 *
 * Aus Bausteinen zusammengesetzt wäre es kürzer und ergäbe im vierten Fall
 * einen Widerspruch: „Auf dieses Todo paßt keine Regel" und „es verschwindet
 * aus dem Pool X" können nicht beide wahr sein. Ein Satz, den niemand ganz
 * gelesen hat, sagt so etwas.
 *
 * Zwei Zweige sind im Betrieb heute unerreichbar — auf einem offenen Todo
 * ändert eine Buchung genau eine Achse, „hat offene Buchungen" von falsch auf
 * wahr, und die kann eine Regel nur zusätzlich erfüllen, nie brechen. Sie
 * stehen trotzdem da: Kommt eine Achse hinzu, die das ändert, sagt der Satz
 * weiterhin die Wahrheit, statt eine Hälfte wegzulassen. Genau diese
 * Auslassung war der Befund hinter E-056.
 */
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: 'reopen',
): string;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: 'booking',
): string | null;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: PoolMovementOccasion,
): string | null;
export function poolMovementSentence(
  movement: PoolMovement,
  tense: PoolMovementTense,
  occasion: PoolMovementOccasion,
): string | null {
  const { appears, enters, leaves } = movement;

  if (occasion === 'reopen') {
    // Vier Fälle. „wieder" steht in jedem, in dem etwas erscheint: Das Todo war
    // erledigt und in keinem dieser Pools zu sehen.
    if (appears.length === 0 && leaves.length === 0) {
      return tense === 'future'
        ? 'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool.'
        : 'Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool.';
    }

    if (appears.length === 0) {
      return tense === 'future'
        ? `Es verschwindet dann aus ${inPools(leaves)} und erscheint in keinem anderen.`
        : `Es ist aus ${inPools(leaves)} verschwunden und erscheint in keinem anderen.`;
    }

    if (leaves.length === 0) {
      return tense === 'future'
        ? `Es erscheint dann wieder in ${inPools(appears)}.`
        : `Es ist zurück in ${inPools(appears)}.`;
    }

    return tense === 'future'
      ? `Es erscheint dann wieder in ${inPools(appears)} und verschwindet aus ${inPools(leaves)}.`
      : `Es ist zurück in ${inPools(appears)} und aus ${inPools(leaves)} verschwunden.`;
  }

  // Keine Bewegung, kein Satz. Diese Zeile ist die Auflage aus E-056 und steht
  // vor allem anderen, damit kein Zweig darunter sie umgehen kann.
  if (enters.length === 0 && leaves.length === 0) return null;

  if (leaves.length === 0) {
    return tense === 'future'
      ? `Es erscheint dann in ${inPools(enters)}.`
      : `Es steht jetzt in ${inPools(enters)}.`;
  }

  if (enters.length === 0) {
    return tense === 'future'
      ? `Es verschwindet dann aus ${inPools(leaves)}.`
      : `Es ist aus ${inPools(leaves)} verschwunden.`;
  }

  return tense === 'future'
    ? `Es erscheint dann in ${inPools(enters)} und verschwindet aus ${inPools(leaves)}.`
    : `Es steht jetzt in ${inPools(enters)} und ist aus ${inPools(leaves)} verschwunden.`;
}
