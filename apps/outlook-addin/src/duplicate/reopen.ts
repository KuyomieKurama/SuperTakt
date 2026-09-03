/**
 * Takt — was der Benutzer erfährt, wenn eine Buchung „Erledigt" aufhebt
 * (A-2.5, I-05, Befund C-03 aus T-025).
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
 * Die Sätze stehen hier und nicht in der Oberfläche, damit „vorher" und
 * „nachher" dieselbe Auskunft geben. Zwei Textbausteine an zwei Stellen wären
 * zwei Gelegenheiten, verschiedene Dinge zu behaupten.
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

/**
 * Die Bewegung, die eine Buchung auslöst (E-056).
 *
 * Zwei Listen mit **Namen** statt zwei Argumenten hintereinander: Beide sind
 * `readonly string[]`, und wer sie vertauscht, bekommt einen Satz, der sich
 * fehlerfrei liest und das Gegenteil behauptet. Ein Paar mit Feldnamen lässt
 * sich nicht stillschweigend verdrehen.
 *
 * Beide Listen kommen aus dem Dienst und werden hier nicht gerechnet — dort
 * liegt die Poolregel, hier nur der Satz darüber.
 */
export interface PoolMovement {
  /** Pools, in denen das Todo nach der Buchung steht. */
  readonly appears: readonly string[];
  /** Pools, aus denen dieselbe Buchung es entfernt. Fast immer leer. */
  readonly leaves: readonly string[];
}

/** Die drei Wirkungen und die eine Nicht-Wirkung, in anzeigbarer Form. */
export interface ReopenNotice {
  readonly title: string;
  /**
   * Genau drei Sätze — Buchung, Kennzeichen, Pools.
   *
   * Die Zahl ist Absicht und wird im Nachweispfad festgehalten. Fällt einer
   * weg, ist es wieder eine halbe Auskunft.
   */
  readonly effects: readonly [string, string, string];
  /** Was **nicht** geschieht (E-023). Steht getrennt, weil es das Gegenteil ist. */
  readonly aside: string;
}

/** „Die Karte bleibt, wo sie ist" — derselbe Satz wie in der Hauptanwendung. */
export const CARD_STAYS = 'Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch nicht.';

/** Kurzform für die Trefferliste, wo eine Zeile Platz ist und keine drei. */
export const REOPEN_HINT =
  'Dieses Todo ist erledigt. Eine Buchung darauf hebt das Kennzeichen automatisch auf.';

/**
 * Zählt Pools **einzeln** auf, in deutschen Anführungszeichen.
 *
 * Keine Zusammenfassung wie „in 3 Pools": Der Benutzer soll die Namen lesen,
 * die er gleich in der Hauptanwendung wiederfindet. Eine Zahl wäre schneller
 * geschrieben und würde die Frage offenlassen, die sie beantworten soll.
 */
const listPools = (poolNames: readonly string[]): string => {
  const quoted = poolNames.map((name) => `„${name}“`);
  if (quoted.length <= 1) return quoted[0] ?? '';
  return `${quoted.slice(0, -1).join(', ')} und ${quoted[quoted.length - 1] ?? ''}`;
};

/**
 * Der Satz über die Pools — vor oder nach der Buchung.
 *
 * Eine leere Liste ist eine Aussage und kein Fehlen. „Es erscheint in keinem
 * Pool" ist die unangenehmere, aber die wahre Auskunft: Ein Todo, auf das
 * keine Poolregel passt, ist nach der Aufhebung offen und trotzdem nirgends zu
 * sehen, außer in der Todo-Liste. Wer das verschweigt, schickt jemanden
 * suchen.
 *
 * ---------------------------------------------------------------------------
 * Das Verschwinden steht im selben Satz (E-056)
 * ---------------------------------------------------------------------------
 *
 * Eine Regel kann nach „Erledigt" fragen. Für sie ist das Buchen keine
 * Rückkehr, sondern ein Abgang: Wer eine Spalte „erledigt und noch nicht
 * abgerechnet" als Abrechnungsliste benutzt, sieht die Karte aus genau der
 * Liste verschwinden, in der er sie sucht — und eine unerklärte Bewegung wird
 * dort als Datenverlust gelesen.
 *
 * Drei Auflagen aus E-056, und alle drei liegen in dieser einen Funktion:
 *
 *  1. **Ein Satz**, kein zweiter Absatz und keine zweite Liste. Das Erscheinen
 *     und das Verschwinden sind dieselbe Folge in zwei Richtungen; zwei Sätze
 *     wären zwei Aussagen und läsen sich wie zwei Vorgänge.
 *  2. **Nur wenn es zutrifft.** Ist `leaves` leer — der Normalfall —, kommt
 *     Zeichen für Zeichen der Satz von vor E-056 heraus. Kein Halbsatz, kein
 *     „und aus keinem Pool", kein Komma zu viel.
 *  3. **Kein Pool in beiden Hälften.** Dafür sorgt der Dienst
 *     (`AddinPoolMovement`), nicht diese Funktion: Sie hat keine Poolregel und
 *     dürfte deshalb auch nicht darüber urteilen.
 */
export const poolSentence = (movement: PoolMovement, tense: 'future' | 'past'): string => {
  const { appears, leaves } = movement;
  const where = (names: readonly string[]): string =>
    `${names.length === 1 ? 'dem Pool' : 'den Pools'} ${listPools(names)}`;

  // Vier Fälle, ausgeschrieben. Zusammengesetzt aus Bausteinen wäre es kürzer
  // und ergäbe im vierten Fall einen Widerspruch: „Auf dieses Todo passt keine
  // Poolregel" und „es verschwindet aus dem Pool X" können nicht beide wahr
  // sein. Ein Satz, den niemand ganz gelesen hat, sagt so etwas.
  if (appears.length === 0 && leaves.length === 0) {
    return tense === 'future'
      ? 'Auf dieses Todo passt derzeit keine Poolregel — es erscheint danach in keinem Pool.'
      : 'Auf dieses Todo passt derzeit keine Poolregel, es erscheint also in keinem Pool.';
  }

  if (appears.length === 0) {
    return tense === 'future'
      ? `Es verschwindet dann aus ${where(leaves)} und erscheint in keinem anderen.`
      : `Es ist aus ${where(leaves)} verschwunden und erscheint in keinem anderen.`;
  }

  if (leaves.length === 0) {
    return tense === 'future'
      ? `Es erscheint dann wieder in ${where(appears)}.`
      : `Es ist zurück in ${where(appears)}.`;
  }

  return tense === 'future'
    ? `Es erscheint dann wieder in ${where(appears)} und verschwindet aus ${where(leaves)}.`
    : `Es ist zurück in ${where(appears)} und aus ${where(leaves)} verschwunden.`;
};

/**
 * Was geschehen **wird** — steht über der Schaltfläche, nicht darunter.
 *
 * `movement` ist ein Paar und kein zweites Listenargument; die Begründung steht
 * an {@link PoolMovement}. Es ist ausdrücklich **nicht** freiwillig: Wer nur
 * das Erscheinen mitgäbe, bekäme einen Satz, der sich vollständig liest und die
 * Hälfte weglässt (E-056) — dieselbe Art Fehler, die T-078 im Dienst behoben
 * hat.
 */
export const reopenPreview = (minutes: number, movement: PoolMovement): ReopenNotice => ({
  title: 'Dieses Todo ist erledigt. Mit dieser Buchung wird es wieder offen.',
  effects: [
    `${String(minutes)} Minuten werden gebucht.`,
    'Das Erledigt-Kennzeichen wird automatisch aufgehoben.',
    poolSentence(movement, 'future'),
  ],
  aside: CARD_STAYS,
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
    poolSentence(movement, 'past'),
  ],
  aside: CARD_STAYS,
});
