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
 * Pool" ist die unangenehmere, aber die wahre Auskunft: Ein Todo ohne
 * passendes Tag ist nach der Aufhebung offen und trotzdem nirgends zu sehen,
 * außer in der Todo-Liste. Wer das verschweigt, schickt jemanden suchen.
 */
export const poolSentence = (poolNames: readonly string[], tense: 'future' | 'past'): string => {
  if (poolNames.length === 0) {
    return tense === 'future'
      ? 'Auf seine Tags passt derzeit keine Poolregel — es erscheint danach in keinem Pool.'
      : 'Auf seine Tags passt derzeit keine Poolregel, es erscheint also in keinem Pool.';
  }

  const where = `${poolNames.length === 1 ? 'dem Pool' : 'den Pools'} ${listPools(poolNames)}`;
  return tense === 'future'
    ? `Es erscheint dann wieder in ${where}.`
    : `Es ist zurück in ${where}.`;
};

/** Was geschehen **wird** — steht über der Schaltfläche, nicht darunter. */
export const reopenPreview = (minutes: number, poolNames: readonly string[]): ReopenNotice => ({
  title: 'Dieses Todo ist erledigt. Mit dieser Buchung wird es wieder offen.',
  effects: [
    `${String(minutes)} Minuten werden gebucht.`,
    'Das Erledigt-Kennzeichen wird automatisch aufgehoben.',
    poolSentence(poolNames, 'future'),
  ],
  aside: CARD_STAYS,
});

/** Was geschehen **ist**. Dieselben drei Wirkungen, dieselbe Reihenfolge. */
export const reopenOutcome = (
  todoTitle: string,
  minutes: number,
  poolNames: readonly string[],
): ReopenNotice => ({
  title: `Gebucht. „${todoTitle}“ ist wieder offen.`,
  effects: [
    `${String(minutes)} Minuten sind gebucht.`,
    'Das Erledigt-Kennzeichen ist aufgehoben.',
    poolSentence(poolNames, 'past'),
  ],
  aside: CARD_STAYS,
});
