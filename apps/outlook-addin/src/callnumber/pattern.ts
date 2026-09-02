/**
 * Takt — Prüfung des konfigurierbaren Ausdrucks (A-10.8, B-4.1, B-4.2, B-4.3).
 *
 * ## Warum ein regulärer Ausdruck und kein Sprachmodell
 *
 * Die Entscheidung folgt dem Rahmen aus `ecc:regex-vs-llm-structured-text`:
 * Regex zuerst, Sprachmodell nur für die Restfälle, und zwar nur dann, wenn der
 * Text tatsächlich frei geformt ist.
 *
 *  1. **Das Format wiederholt sich.** Eine Call-Nummer ist eine Kennung aus
 *     einem Ticketsystem — `TCK-000042`, `C123456`, `2026/0815`. Sie ist genau
 *     die Sorte Zeichenkette, für die ein Ausdruck gebaut ist: fester Aufbau,
 *     wiederkehrend, ohne Bedeutungsspielraum. Nach dem Entscheidungsbaum der
 *     Fertigkeit („>90 Prozent folgen einem Muster → Regex") ist damit alles
 *     gesagt.
 *  2. **Die Restfälle darf hier kein Automat übernehmen.** Der Rahmen sieht für
 *     unsichere Treffer eine zweite, teurere Instanz vor. Diese Instanz ist in
 *     Takt **der Mensch**, nicht ein Modell: Der erkannte Wert wird in S-12
 *     angezeigt und ist änderbar, bevor irgendetwas entsteht (B-4.3 Punkt 5).
 *     Die „Vertrauensbewertung" aus dem Rahmen ist `checkCallNumber` aus
 *     `@takt/domain` — sie entscheidet, ob ein Treffer überhaupt als Treffer
 *     gilt, und sie tut das seit E-045 an genau einer Stelle im Projekt.
 *  3. **Ein Sprachmodell ist hier ausgeschlossen, nicht bloß unnötig.** E-001
 *     verbietet jede Cloudanbindung; ein Modell im Add-in bedeutete, den Text
 *     fremder E-Mails an einen Dienst zu schicken. Das wäre nicht eine teurere
 *     Lösung desselben Problems, sondern ein anderes Produkt. Ein lokales
 *     Modell wiederum wäre ein Vielfaches der ganzen Anwendung, um eine
 *     Zeichenkette mit fester Gestalt zu finden.
 *  4. **Nichtbestimmtheit ist hier ein Schaden.** Der Rahmen warnt vor Regex
 *     bei frei geformtem Text; umgekehrt gilt: Bei einem Wert, der in eine
 *     Rechnung geht, ist ein Verfahren, das bei gleicher Eingabe zweimal
 *     Verschiedenes liefern kann, nicht prüfbar. Ein Ausdruck ist es — die
 *     Fälletabelle in `scripts/proof-addin.mjs` ist der Beleg.
 *
 * Der Preis des Ausdrucks steht in B-4.1 bis B-4.4, und diese Datei bezahlt
 * ihn: Backtracking, ungültige Eingabe, zu weiter Treffer, Zustand am Ausdruck.
 *
 * ## Was hier **nicht** passiert
 *
 * Diese Datei **wertet keinen Ausdruck auf einem Text aus.** Sie prüft nur die
 * Gestalt des Musters. Die Auswertung läuft ausschließlich im Web Worker mit
 * Zeitgrenze (`detect.ts`, `worker.ts`), weil ein laufender regulärer Ausdruck
 * in JavaScript nicht unterbrechbar ist (B-4.1).
 */

export type PatternRejection =
  /** `new RegExp(...)` wirft — unbalancierte Klammer, `\` am Ende, … (B-4.2). */
  | 'syntax'
  /** Leeres Muster. Trifft überall, liefert nichts. */
  | 'empty'
  /** Ohne Erfassungsgruppe gäbe es nur den Gesamttreffer (B-4.3 Punkt 1). */
  | 'no_capture_group'
  /** Trifft auf die leere Zeichenkette zu — also auf jede E-Mail (B-4.3 Punkt 2). */
  | 'matches_empty'
  /** Rückverweis oder Rückschau — die häufigsten Backtracking-Ursachen (B-4.1 Punkt 5). */
  | 'backreference_or_lookbehind'
  /** Verschachtelte Quantoren oder Alternative mit gleichem Präfix (B-4.1 Punkt 3). */
  | 'catastrophic_shape'
  /** Unnötig lang. Ein Muster über 200 Zeichen ist kein Muster mehr. */
  | 'too_long';

export interface PatternCheckOk {
  readonly ok: true;
  /** Das geprüfte Muster, unverändert. */
  readonly source: string;
  /** Anzahl der Erfassungsgruppen. Verwendet wird immer Gruppe 1. */
  readonly groupCount: number;
}

export interface PatternCheckError {
  readonly ok: false;
  readonly reason: PatternRejection;
  /**
   * Deutscher Anzeigetext für S-13.
   *
   * Bei `syntax` steht die Meldung der Laufzeitumgebung darin. Das ist
   * ausdrücklich erlaubt (B-4.2 Punkt 1): Sie enthält kein Geheimnis, und ohne
   * sie weiß niemand, an welcher Stelle die Klammer fehlt.
   */
  readonly message: string;
}

export type PatternCheck = PatternCheckOk | PatternCheckError;

/** Ein Muster über dieser Länge wird abgelehnt. */
export const PATTERN_MAX_LENGTH = 200;

const MESSAGES: Readonly<Record<Exclude<PatternRejection, 'syntax'>, string>> = Object.freeze({
  empty: 'Der Ausdruck ist leer. Trage ein Muster ein oder wähle eines aus der Liste.',
  no_capture_group:
    'Der Ausdruck braucht eine Klammer um den Teil, der die Call-Nummer ist — zum Beispiel TCK-(\\d{6}) statt TCK-\\d{6}. Übernommen wird immer der Inhalt der ersten Klammer.',
  matches_empty:
    'Dieser Ausdruck trifft auch auf leeren Text zu und damit auf jede E-Mail. Er wurde nicht gespeichert.',
  backreference_or_lookbehind:
    'Rückverweise (\\1) und Rückschau ((?<=…)) sind nicht zugelassen: Sie sind die häufigste Ursache für Ausdrücke, die bei langen E-Mails minutenlang rechnen.',
  catastrophic_shape:
    'Dieser Ausdruck kann bei langen E-Mails sehr lange rechnen und wurde nicht gespeichert. Verschachtelte Wiederholungen wie (\\d+)+ sind der übliche Grund.',
  too_long: `Der Ausdruck ist länger als ${String(PATTERN_MAX_LENGTH)} Zeichen. Das ist fast immer ein Versehen.`,
});

const reject = (reason: Exclude<PatternRejection, 'syntax'>): PatternCheckError => ({
  ok: false,
  reason,
  message: MESSAGES[reason],
});

/**
 * Zählt die Erfassungsgruppen, **ohne** das Muster auf einem Text laufen zu
 * lassen.
 *
 * Der Kniff: `muster|` trifft an Position 0 immer, weil der leere Zweig der
 * Alternative sofort passt. Das Ergebnis enthält trotzdem einen Eintrag je
 * Erfassungsgruppe des Musters. Es wird also nichts durchsucht und nichts
 * zurückverfolgt — die Laufzeit ist unabhängig vom Muster.
 *
 * Genau deshalb steht diese Prüfung hier und nicht im Worker: Sie kann nicht
 * hängenbleiben.
 */
const countCaptureGroups = (source: string): number | null => {
  try {
    const probe = new RegExp(`${source}|`);
    const result = probe.exec('');
    return result === null ? null : result.length - 1;
  } catch {
    return null;
  }
};

/**
 * Heuristik auf katastrophales Backtracking (B-4.1 Punkt 3).
 *
 * Erkennt die beiden Bauformen, die in der Praxis fast alle Fälle ausmachen:
 *
 *  - **Verschachtelte Quantoren.** Eine Gruppe, deren Inhalt auf einen
 *    Quantor endet, und die selbst quantifiziert ist: `(\d+)+`, `(a*)*`,
 *    `(x+)*`, `([a-z]{2,}){3,}`.
 *  - **Alternative mit gleichem Anfang unter einem Quantor.** `(a|a)*`,
 *    `(ab|ab?)+`. Zwei Zweige, die dieselbe Eingabe auf verschiedenen Wegen
 *    lesen können, sind die zweite klassische Quelle.
 *
 * Sie ist bewusst **eine Heuristik und kein Beweis** — dieselbe Einordnung, die
 * B-4.1 Punkt 3 vornimmt, wenn es „eine eigene Heuristik" neben `recheck`
 * stellt. Was sie durchlässt, fängt die harte Zeitgrenze im Worker (Punkt 1);
 * was sie fälschlich ablehnt, kostet den Benutzer eine Umformulierung. Diese
 * Verteilung ist die richtige: Der Schaden eines eingefrorenen
 * Aufgabenbereichs ist größer als der einer abgelehnten Schreibweise.
 */
const hasCatastrophicShape = (source: string): boolean => {
  // Gruppen einsammeln, mit Klammertiefe — verschachtelte Gruppen zählen.
  const groups: Array<{ readonly start: number; readonly end: number }> = [];
  const stack: number[] = [];
  let escaped = false;
  let inClass = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source.charAt(index);

    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (inClass) {
      if (character === ']') inClass = false;
      continue;
    }
    if (character === '[') {
      inClass = true;
      continue;
    }
    if (character === '(') {
      stack.push(index);
      continue;
    }
    if (character === ')') {
      const start = stack.pop();
      if (start !== undefined) groups.push({ start, end: index });
    }
  }

  for (const group of groups) {
    const after = source.slice(group.end + 1);
    const groupIsQuantified = /^(?:[*+]|\{\d+,\d*\}|\{\d+,\})/.test(after);
    if (!groupIsQuantified) continue;

    let inner = source.slice(group.start + 1, group.end);
    // Führende Gruppenart abstreifen: (?:…), (?<name>…), (?=…), (?!…)
    inner = inner.replace(/^\?(?:<[A-Za-z_$][\w$]*>|:|=|!|<=|<!)/, '');

    // Verschachtelter Quantor: der Inhalt endet auf einer Wiederholung.
    if (/(?:[*+]|\{\d+,\d*\}|\{\d+,\})$/.test(inner)) {
      return true;
    }

    // Alternative mit gemeinsamem Anfang: (a|a)*, (ab|ab?)+
    if (inner.includes('|')) {
      const branches = splitTopLevelAlternatives(inner);
      for (let left = 0; left < branches.length; left += 1) {
        for (let right = left + 1; right < branches.length; right += 1) {
          const a = branches[left] ?? '';
          const b = branches[right] ?? '';
          if (a.length > 0 && b.length > 0 && (a.startsWith(b) || b.startsWith(a))) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/** Zerlegt an `|`, aber nur auf oberster Ebene und außerhalb von Zeichenklassen. */
const splitTopLevelAlternatives = (source: string): readonly string[] => {
  const parts: string[] = [];
  let depth = 0;
  let inClass = false;
  let escaped = false;
  let current = '';

  for (const character of source) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (inClass) {
      current += character;
      if (character === ']') inClass = false;
      continue;
    }
    if (character === '[') {
      inClass = true;
      current += character;
      continue;
    }
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === '|' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += character;
  }

  parts.push(current);
  return parts;
};

/**
 * Rückverweise und Rückschau (B-4.1 Punkt 5).
 *
 * `\1` bis `\9` außerhalb einer Zeichenklasse, `\k<name>`, `(?<=…)` und
 * `(?<!…)`. Vorausschau (`(?=…)`, `(?!…)`) bleibt zugelassen: Sie ist für
 * Wortgrenzen um eine Kennung herum nützlich und trägt das Problem nicht in
 * derselben Weise.
 */
const hasBackreferenceOrLookbehind = (source: string): boolean =>
  /\\[1-9]/.test(source) || /\\k<[^>]*>/.test(source) || /\(\?<[=!]/.test(source);

/**
 * Prüft ein Muster vollständig (A-10.8).
 *
 * Wird an **zwei** Stellen aufgerufen, und beide sind Pflicht:
 *
 *  - beim Speichern in S-13, damit ein untaugliches Muster gar nicht erst
 *    hinterlegt wird;
 *  - **bei jeder Verwendung** (B-4.2 Punkt 2), weil Einstellungen außerhalb des
 *    Add-ins verändert werden können und ein Wert aus einer früheren Fassung
 *    heute ungültig sein kann. Ein Muster, das beim Laden ungeprüft übersetzt
 *    wird, ist die Sackgasse aus B-4.2: Das Add-in stirbt an einem Wert, den
 *    der Benutzer ohne funktionierendes Add-in nicht mehr ändern kann.
 */
export const checkPattern = (source: unknown): PatternCheck => {
  if (typeof source !== 'string' || source.length === 0) {
    return reject('empty');
  }
  if (source.length > PATTERN_MAX_LENGTH) {
    return reject('too_long');
  }

  try {
    // Ohne Kennzeichen. `g` würde `lastIndex` mitschleppen und den Ausdruck bei
    // jedem zweiten Aufruf danebentreffen lassen (B-4.4); für einen Treffer
    // wird es ohnehin nicht gebraucht.
    new RegExp(source);
  } catch (error) {
    return {
      ok: false,
      reason: 'syntax',
      message: `Der Ausdruck ist nicht gültig: ${error instanceof Error ? error.message : 'unbekannter Fehler'}`,
    };
  }

  if (hasBackreferenceOrLookbehind(source)) {
    return reject('backreference_or_lookbehind');
  }
  if (hasCatastrophicShape(source)) {
    return reject('catastrophic_shape');
  }

  const groupCount = countCaptureGroups(source);
  if (groupCount === null) {
    // Das Muster ließ sich übersetzen, `muster|` aber nicht — etwa bei einer
    // Alternative, die am Ende offen bleibt. Als Syntaxfehler behandeln.
    return {
      ok: false,
      reason: 'syntax',
      message:
        'Der Ausdruck ist nicht gültig: Er lässt sich nicht in eine Alternative einsetzen und ist damit unvollständig.',
    };
  }
  if (groupCount === 0) {
    return reject('no_capture_group');
  }

  // B-4.3 Punkt 2: trifft der Ausdruck auf `""`, trifft er auf jede E-Mail.
  // Die Auswertung auf der leeren Zeichenkette kann nicht zurückverfolgen —
  // es gibt keine Eingabe, über die zurückzuverfolgen wäre.
  if (new RegExp(source).test('')) {
    return reject('matches_empty');
  }

  return { ok: true, source, groupCount };
};
