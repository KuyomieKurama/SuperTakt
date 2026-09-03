/**
 * Takt — was der Benutzer erfährt, wenn eine Buchung sein Todo bewegt
 * (A-2.5, I-05, E-056, Befund C-03 aus T-025).
 *
 * ## Warum die Datei weiterhin `reopen.ts` heißt
 *
 * Sie ist als Datei über das Wiederöffnen entstanden und trägt seit T-084
 * zwei Sätze: den über die Aufhebung von „Erledigt" und den über die
 * **Bewegung**, die jede Buchung auslösen kann — auch auf einem Todo, an dem
 * es nichts aufzuheben gibt. Beide reden über Pools, beide gibt es in einer
 * Fassung für vorher und einer für nachher, und beide dürfen sich nicht
 * widersprechen. Getrennte Dateien wären zwei Orte für dieselbe Auskunft und
 * damit zwei Gelegenheiten, Verschiedenes zu behaupten — genau der Grund, aus
 * dem „vorher" und „nachher" hier schon immer nebeneinanderstehen.
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
 * Die Bewegung, die eine Buchung auslöst (E-056, T-084).
 *
 * Listen mit **Namen** statt Argumenten hintereinander: Alle drei sind
 * `readonly string[]`, und wer sie vertauscht, bekommt einen Satz, der sich
 * fehlerfrei liest und das Gegenteil behauptet. Felder mit Namen lassen sich
 * nicht stillschweigend verdrehen.
 *
 * Alle drei Listen kommen aus dem Dienst und werden hier nicht gerechnet —
 * dort liegt die Poolregel, hier nur der Satz darüber. Auch `enters` wird
 * deshalb **nicht** aus `appears` abgeleitet: Der Unterschied verlangt beide
 * Zustände desselben Pools, und zwei Pools dürfen denselben Namen tragen.
 */
export interface PoolMovement {
  /** Pools, in denen das Todo nach der Buchung steht. */
  readonly appears: readonly string[];
  /**
   * Pools, in die dieselbe Buchung es **hineinbewegt** (T-084) — die
   * Teilmenge von {@link appears}, in der es vorher nicht stand.
   *
   * Der Unterschied zwischen Zustand und Bewegung, und er entscheidet, ob
   * überhaupt ein Satz entsteht: `appears` ist fast immer besetzt, auch wenn
   * sich nichts rührt. Ein Satz daraus wäre für ein offenes Todo eine
   * Ankündigung ohne Ereignis.
   */
  readonly enters: readonly string[];
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
 * „dem Pool X" oder „den Pools X und Y" — der Einschub, der in jeden Satz
 * dieser Datei passt.
 *
 * Steht seit T-084 im Modul und nicht mehr in `poolSentence`, weil ihn zwei
 * Sätze brauchen. Die Zahl der Pools entscheidet über den Artikel; ein
 * „in den Pools „X“" für einen einzigen wäre die Art Fehler, die jeder liest
 * und niemand meldet.
 */
const inPools = (names: readonly string[]): string =>
  `${names.length === 1 ? 'dem Pool' : 'den Pools'} ${listPools(names)}`;

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
};

/**
 * Der Satz über die Pools, wenn **nichts aufgehoben** wird (T-084).
 *
 * ---------------------------------------------------------------------------
 * Warum es diesen zweiten Satz gibt
 * ---------------------------------------------------------------------------
 *
 * E-056 verlangt einen Satz, wenn eine Buchung Pools betrifft. Bis T-084 gab
 * es ihn nur im Wiederöffnen-Fall, und die Begründung war: Nur dort kann etwas
 * **verschwinden**. Für das Verschwinden stimmt das. Für das **Erscheinen**
 * nicht: Die erste Buchung auf einem Todo ohne Buchung setzt „hat offene
 * Buchungen" von falsch auf wahr, und jede Spalte, die nach offener, noch
 * nicht abgerechneter Zeit fragt (`exportState: 'open'`), nimmt es damit auf.
 * Das Todo taucht in einer Liste auf, in der es vorher nicht stand — ohne
 * Aufhebung, ohne Kennzeichen, ohne ein Wort darüber.
 *
 * ---------------------------------------------------------------------------
 * Warum er eine eigene Form hat und nicht `poolSentence` mitbenutzt
 * ---------------------------------------------------------------------------
 *
 * Zwei Gründe, und beide stehen im Text selbst:
 *
 *  1. **Kein „wieder".** `poolSentence` erklärt eine Aufhebung: „Es erscheint
 *     dann **wieder** in …". Bei einem offenen Todo gibt es nichts
 *     aufzuheben; „wieder" behauptete eine Vorgeschichte, die es nicht gibt.
 *  2. **Bewegung statt Zustand.** `poolSentence` zählt `appears` auf — alle
 *     Pools, in denen das Todo danach steht. Für ein erledigtes Todo ist das
 *     die Auskunft: Es war in keinem davon zu sehen. Für ein offenes wäre es
 *     eine Aufzählung von lauter Unverändertem, in der die eine Änderung
 *     untergeht. Dieser Satz nennt deshalb `enters` und `leaves` — und nur
 *     sie.
 *
 * ---------------------------------------------------------------------------
 * `null` heißt: kein Satz, kein Halbsatz, keine leere Zeile
 * ---------------------------------------------------------------------------
 *
 * Dieselbe Auflage wie in E-056, nur eine Stufe früher. Bewegt die Buchung das
 * Todo in keinen Pool hinein und aus keinem heraus — der Normalfall bei jeder
 * zweiten und jeder weiteren Buchung —, gibt es nichts zu sagen. `null` und
 * nicht der leere String: Ein leerer String ist ein Satz mit null Zeichen, und
 * die Oberfläche baut ihm eine Zeile. `null` zwingt die Aufrufstelle, den Fall
 * zu behandeln.
 *
 * Ein Aufrufer darf ihn deshalb **nicht** mit `?? ''` erledigen. Beide
 * Aufrufstellen prüfen auf `null` und lassen die Fläche ganz weg.
 */
export const bookingPoolSentence = (
  movement: PoolMovement,
  tense: 'future' | 'past',
): string | null => {
  const { enters, leaves } = movement;

  // Keine Bewegung, kein Satz. Diese Zeile ist die Auflage aus dem Kopf und
  // steht vor allem anderen, damit kein Zweig darunter sie umgehen kann.
  if (enters.length === 0 && leaves.length === 0) return null;

  // Drei Fälle je Zeitform, ausgeschrieben wie in `poolSentence`. Der zweite
  // und der dritte sind im Betrieb unerreichbar: Auf einem offenen Todo ändert
  // eine Buchung genau **eine** Achse — „hat offene Buchungen", und zwar von
  // falsch auf wahr —, und die kann eine Regel nur zusätzlich erfüllen, nie
  // brechen. Sie stehen trotzdem hier: Kommt eine Achse hinzu, die das ändert,
  // sagt der Satz weiterhin die Wahrheit, statt eine Hälfte wegzulassen. Genau
  // diese Auslassung war der Befund hinter E-056.
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
};

/** Die Bestätigung nach einer Buchung auf ein offenes Todo (T-084). */
export interface BookingNotice {
  /** Die Buchung selbst. Steht immer da. */
  readonly booked: string;
  /**
   * Der Satz über die Pools — `null`, wenn die Buchung nichts bewegt hat.
   *
   * Zwei Felder und keine Liste von ein oder zwei Zeichenketten: Eine Liste
   * ließe die Aufrufstelle über ihre Länge urteilen, und „Länge 1" ist eine
   * schwächere Aussage als „hier ist kein Satz".
   */
  readonly pools: string | null;
}

/**
 * Die Bestätigung nach einer Buchung auf ein **offenes** Todo (T-084).
 *
 * Das Gegenstück zu {@link reopenOutcome}, für den Fall, in dem nichts
 * aufgehoben wird. Die Ankündigung davor ist kein eigener Bauplan, sondern
 * derselbe Satz in der anderen Zeitform: `bookingPoolSentence(movement,
 * 'future')`. Über der Schaltfläche steht die Dauer als Eingabefeld daneben —
 * eine Zeile „15 Minuten werden gebucht" wäre dort die Wiederholung eines
 * Werts, den der Benutzer gerade selbst eingestellt hat.
 *
 * **`booked` ist unverändert.** Der Satz stand bis T-084 im Aufgabenbereich als
 * Text im JSX und ist Zeichen für Zeichen derselbe geblieben — hierher gezogen,
 * damit der Nachweispfad ihn messen kann, ohne die Oberfläche zu rendern. Ein
 * Todo, das die Buchung nicht bewegt, bekommt danach genau das zu lesen, was es
 * vorher zu lesen bekam.
 */
export const bookingOutcome = (minutes: number, movement: PoolMovement): BookingNotice => ({
  booked: `${String(minutes)} Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.`,
  pools: bookingPoolSentence(movement, 'past'),
});

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
