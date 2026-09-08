/**
 * Takt — die Vorrichtung fuer den Engine-Vergleich (T-232).
 *
 * Diese Datei baut **keine** Messung. Sie baut die Seite, gegen die zwei
 * Engines dasselbe gefragt werden, und sie baut sie so, dass niemand sie von
 * Hand nachpflegen muss:
 *
 *  - Die **Token** kommen als feste Werte aus dem hellen `:root` von
 *    `packages/ui-tokens/tokens.css`. Nur aus dem hellen — der dunkle Block
 *    und `@media (prefers-contrast: more)` bleiben draussen, damit die
 *    Vorrichtung nicht davon abhaengt, was die Engine unter Xvfb ueber die
 *    Vorlieben des Benutzers glaubt.
 *  - Die **Deklarationen** werden aus `base.css` und `components.css`
 *    ausgeschnitten, nicht abgeschrieben. Damit sind sie zeichengleich, und
 *    zwar ohne dass jemand daran denken muss. Wer die Regel in der Quelle
 *    aendert, aendert die Vorrichtung mit.
 *
 * ---------------------------------------------------------------------------
 * Der Fokus wird **nicht** ueber `:focus-visible` ausgeloest
 * ---------------------------------------------------------------------------
 *
 * Die zwei Fokusregeln liegen in der Vorrichtung auf gewoehnlichen Klassen
 * (`probe-focus`, `probe-focus-on-solid`) — mit **zeichengleichem** Rumpf, aber
 * ohne die Pseudoklasse. Das ist Absicht und die Grenze dieser Messung:
 *
 *   Gemessen wird die **Malreihenfolge** der zwei Baender, nicht die
 *   **Ausloesung** von `:focus-visible`.
 *
 * Ob eine Engine `:focus-visible` bei einem Mausklick, bei `.focus()` aus dem
 * Skript oder nur beim Tabulieren vergibt, ist eine zweite Frage mit einer
 * zweiten Antwort; sie steht hier ungemessen. Die Frage aus T-216 war eine
 * andere: Liegt die Umrandung ueber dem aeusseren Schatten oder darunter. Sie
 * haengt an der Malreihenfolge und an nichts sonst, und die Pseudoklasse
 * dazwischenzuschalten haette der Messung eine zweite Unbekannte gegeben.
 *
 * ---------------------------------------------------------------------------
 * Warum die Geometrie festgenagelt ist
 * ---------------------------------------------------------------------------
 *
 * Jede Probe steht absolut positioniert auf ganzzahligen Koordinaten, mit
 * fester Breite und Hoehe, und der Knopf traegt **keine Beschriftung**. Zwei
 * Engines setzen Schrift verschieden; ein Knopf, der sich seine Breite aus
 * seiner Beschriftung holt, waere in beiden Engines verschieden breit, und der
 * Vergleich haette einen Unterschied gemeldet, der keiner ist. Die Frage nach
 * der Malreihenfolge braucht keinen Text.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

export const QUELLEN = {
  tokens: 'packages/ui-tokens/tokens.css',
  base: 'apps/web/src/styles/base.css',
  components: 'apps/web/src/styles/components.css',
};

/* ==================================================================== */
/* 1  Ausschneiden statt abschreiben                                    */
/* ==================================================================== */

/**
 * Schneidet den Rumpf einer Regel aus einem Stilblatt.
 *
 * Der Selektor muss am **Zeilenanfang** stehen. Das ist keine Bequemlichkeit,
 * sondern die Bedingung dafuer, dass `:focus-visible` nicht aus
 * `.on-solid:focus-visible` oder `.skip-link:focus-visible` gefischt wird.
 *
 * @param {string} css Inhalt des Stilblatts.
 * @param {string} selektor Der Selektor, zeichengleich wie in der Quelle.
 * @returns {string} Der Rumpf ohne die aeusseren Klammern.
 */
export function extractRule(css, selektor) {
  const anker = new RegExp(`^${selektor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'm');
  const treffer = anker.exec(css);
  if (treffer === null) {
    throw new Error(`Die Regel \`${selektor}\` steht nicht mehr am Zeilenanfang ihres Stilblatts.`);
  }

  const start = treffer.index + treffer[0].length;
  let tiefe = 1;
  let i = start;
  while (i < css.length && tiefe > 0) {
    if (css.startsWith('/*', i)) {
      const ende = css.indexOf('*/', i + 2);
      i = ende === -1 ? css.length : ende + 2;
      continue;
    }
    if (css[i] === '{') tiefe += 1;
    else if (css[i] === '}') tiefe -= 1;
    i += 1;
  }
  if (tiefe !== 0) {
    throw new Error(`Die Regel \`${selektor}\` ist nicht geschlossen.`);
  }
  return css.slice(start, i - 1);
}

/** @returns {string} Inhalt einer Quelldatei, relativ zur Wurzel des Bestands. */
function lies(relativ) {
  return readFileSync(new URL(relativ, `file://${ROOT}`), 'utf8');
}

/**
 * Die Regeln, aus denen die Vorrichtung besteht — jede mit ihrer Quelle, damit
 * eine Fehlermeldung sagen kann, wo etwas verschwunden ist.
 *
 * @typedef {{ quelle: string; selektor: string; rumpf: string }} Regel
 * @returns {Record<string, Regel>}
 */
export function collectRules() {
  const tokens = lies(QUELLEN.tokens);
  const base = lies(QUELLEN.base);
  const components = lies(QUELLEN.components);

  /** @type {Array<[string, string, string]>} */
  const plan = [
    ['tokens', QUELLEN.tokens, ':root'],
    ['focusVisible', QUELLEN.base, ':focus-visible'],
    ['focusOnSolid', QUELLEN.base, '.on-solid:focus-visible'],
    ['button', QUELLEN.components, '.btn'],
    ['buttonDanger', QUELLEN.components, '.btn--danger'],
    ['note', QUELLEN.components, '.note'],
    ['noteBilling', QUELLEN.components, '.note--billing'],
    ['noteInternal', QUELLEN.components, '.note--internal'],
  ];

  const inhalt = { [QUELLEN.tokens]: tokens, [QUELLEN.base]: base, [QUELLEN.components]: components };
  /** @type {Record<string, Regel>} */
  const regeln = {};
  for (const [name, quelle, selektor] of plan) {
    regeln[name] = { quelle, selektor, rumpf: extractRule(inhalt[quelle], selektor) };
  }
  return regeln;
}

/* ==================================================================== */
/* 2  Geometrie — jede Zahl ist zugleich eine Schnittkoordinate         */
/* ==================================================================== */

/**
 * **Zwei Seiten und nicht eine — der Grund ist ein gemessener Fehlschlag.**
 *
 * `--focus-ring-color` und `--note-billing-rail` sind **derselbe Wert**
 * (`#2159da`). Stuenden Knopf und Leistungsschiene auf einer Seite, traege
 * eine gesuchte Farbe zwei verschiedene Flaechen, und eine Sonde, die diese
 * Farbe sucht, faende beide. Genau das ist beim ersten Messen passiert: Der
 * Schnitt durch die durchgezogene Schiene lief zugleich durch den Knopf und
 * meldete als „Luecke" den Abstand zwischen beiden — 28px, die es in der
 * Schiene nicht gibt.
 *
 * Das ist dieselbe Klasse wie ein Waechter, der das Sieb prueft statt der
 * Ernte (E-094). Die Antwort steht deshalb in der Bauart und nicht in einer
 * Sorgfaltsregel:
 *
 *  1. **Jede gemessene Flaeche traegt eine im Bild einmalige Farbe.** Der
 *     Knopf steht auf der Fokusseite, die zwei Schienen auf der Schienenseite.
 *  2. **Geschnitten wird an bekannter Stelle**, nicht gesucht. Wo doch gesucht
 *     wird (der erste Nicht-Hintergrundpunkt der Knopfzeile), vergleicht der
 *     Lauf den Fundort gegen die gerechnete Koordinate.
 *  3. **Und die Farbfelder werden gezaehlt.** Kommt eine gemessene Farbe an
 *     mehr Stellen vor als erwartet, wird der Lauf rot — bevor irgendjemand
 *     eine Zahl auslegen muss.
 *
 * Der Knopf sitzt mit seiner Rahmenkante auf `left`. Die Umrandung liegt
 * ausserhalb davon: erst `--focus-ring-offset` (2px) Abstand, dann
 * `--focus-ring-width` (2px) Umrandung. Der Schatten hat als Streuung
 * `width + offset` (4px) und fuellt beides — sichtbar bleibt von ihm also
 * genau der Abstandsstreifen, **wenn** die Umrandung ueber ihm liegt.
 *
 * Erwartet, von der Flaeche zur Fuellung:
 *
 *     left-4 .. left-3   --focus-ring-color      Umrandung
 *     left-2 .. left-1   --focus-ring-contrast   Schatten
 *     left   .. left+9   --danger-bg             Rand und Fuellung
 */
export const GEOMETRIE = Object.freeze({
  fokus: Object.freeze({
    seite: Object.freeze({ breite: 300, hoehe: 140 }),
    knopf: Object.freeze({ left: 100, top: 40, breite: 160, hoehe: 36 }),
    /** So viele Bildpunkte werden ab der ersten Nicht-Hintergrundfarbe gelesen. */
    bandfenster: 14,
  }),
  schienen: Object.freeze({
    seite: Object.freeze({ breite: 400, hoehe: 160 }),
    /**
     * **Die zwei Felder stehen nebeneinander, nicht uebereinander — und das
     * ist keine Frage des Geschmacks.** Uebereinander liegen ihre linken
     * Kanten in **derselben** Bildspalte, und der senkrechte Schnitt durch
     * die eine Schiene liefe durch die andere gleich mit. Die Farben trennen
     * sie dann nicht: `--note-internal-rail` (#7e8a9e) liegt naeher an
     * `--note-billing-rail` (#2159da) als an der Flaeche, und die
     * Vermerkschiene erschiene im Schnitt der Leistungsschiene als
     * zusaetzlicher Strich. Genau diese Sorte Verwechslung hat beim ersten
     * Messen dieser Aufgabe eine 28px-Luecke erfunden, die es nicht gab.
     *
     * **Die Hoehe ist ebenfalls keine freie Wahl.** Sie liegt in der
     * Groessenordnung der 41px (WebKitGTK) und 43px (Chromium), an denen die
     * Schranken aus P-4 hergeleitet sind. Ein hohes Feld zeichnete mehr
     * Striche und machte die Schranke beliebig leicht; gemessen wuerde dann
     * die Vorrichtung statt der Regel. Die tatsaechlich gemessene
     * Schienenlaenge steht in der Ausgabe des Laufs (P-5).
     */
    felder: Object.freeze([
      Object.freeze({ name: 'billing', klasse: 'note--billing', token: '--note-billing-rail', left: 40, top: 40, breite: 140, hoehe: 80 }),
      Object.freeze({ name: 'internal', klasse: 'note--internal', token: '--note-internal-rail', left: 240, top: 40, breite: 140, hoehe: 80 }),
    ]),
    /** Breite der Schiene aus `border-inline-start: 4px …`. */
    schienenbreite: 4,
  }),
});

/** @returns {{ y: number; erwarteterStart: number }} Der waagerechte Schnitt durch die Knopfmitte. */
export function knopfschnitt(ringbreite, ringabstand) {
  const { top, hoehe, left } = GEOMETRIE.fokus.knopf;
  return { y: top + Math.floor(hoehe / 2), erwarteterStart: left - ringbreite - ringabstand };
}

/**
 * Der senkrechte Schnitt liegt einen Bildpunkt **innerhalb** der 4px breiten
 * Schiene und laeuft ueber die **ganze** Bildspalte. Kein Fenster, keine
 * abgeschnittenen Striche: P-1 spricht von der Form „entlang ihrer Laenge",
 * und ein Ausschnitt mittendrin zaehlte Striche weg, die es gibt.
 *
 * Dass in dieser Spalte nichts anderes steht als diese eine Schiene, ist
 * keine Annahme — der Lauf prueft es ueber die Farbfelder und ueber die
 * Grenzen `oben` und `unten`.
 *
 * @returns {Array<{ name: string; x: number; oben: number; unten: number }>}
 */
export function schienenschnitte() {
  return GEOMETRIE.schienen.felder.map((feld) => ({
    name: feld.name,
    x: feld.left + 1,
    oben: feld.top,
    unten: feld.top + feld.hoehe - 1,
  }));
}

/* ==================================================================== */
/* 3  Die eingesetzten Verletzungen                                     */
/* ==================================================================== */

/**
 * Die Gegenproben. Beide greifen **in die ausgeschnittenen Deklarationen**
 * ein, nicht in die Messung und nicht in die Tokentafel — also an derselben
 * Stelle, an der T-216 und T-202 wirklich etwas geaendert haben (E-094 Punkt 1).
 *
 * `bandtausch` vertauscht die zwei Farbmarken **innerhalb** der zwei
 * Fokusregeln. Auf dem Schirm ist das zeichengleich die Anordnung vor T-216:
 * das Gegenband aussen, der Ring innen.
 *
 * `schienentausch` vertauscht `solid` und `dashed` zwischen Leistungs- und
 * Vermerkfeld — der Fehler, gegen den T-202 die gestreifte Schiene ersetzt hat.
 *
 * **Was diese Gegenproben nicht koennen** (E-094 Punkt 2): Sie erzeugen keine
 * Engine, die den Schatten ueber die Umrandung malt. Das laesst sich aus CSS
 * nicht einsetzen. Sie zeigen, dass die **Messung** eine vertauschte Bandfolge
 * sieht — nicht, dass eine dritte Engine sie erzeugen wuerde. Der Rest ist
 * benannt und bleibt ungemessen.
 *
 * @type {Record<string, { titel: string; wirkung: (regeln: Record<string, {quelle:string;selektor:string;rumpf:string}>) => Record<string, {quelle:string;selektor:string;rumpf:string}> }>}
 */
export const GEGENPROBEN = Object.freeze({
  bandtausch: {
    titel: 'Fokusbaender vertauscht (Anordnung vor T-216)',
    seite: 'fokus',
    wirkung: (regeln) => ({
      ...regeln,
      focusVisible: {
        ...regeln.focusVisible,
        rumpf: regeln.focusVisible.rumpf.replaceAll('--focus-ring-color', '--focus-ring-contrast'),
      },
      focusOnSolid: {
        ...regeln.focusOnSolid,
        rumpf: regeln.focusOnSolid.rumpf.replaceAll('--focus-ring-contrast', '--focus-ring-color'),
      },
    }),
  },
  schienentausch: {
    titel: 'Schienenformen vertauscht (durchgezogen gegen unterbrochen)',
    seite: 'schienen',
    wirkung: (regeln) => ({
      ...regeln,
      noteBilling: {
        ...regeln.noteBilling,
        rumpf: regeln.noteBilling.rumpf.replace('4px solid', '4px dashed'),
      },
      noteInternal: {
        ...regeln.noteInternal,
        rumpf: regeln.noteInternal.rumpf.replace('4px dashed', '4px solid'),
      },
    }),
  },
});

/* ==================================================================== */
/* 4  Die zwei Seiten                                                   */
/* ==================================================================== */

/**
 * Baut eine der zwei Vorrichtungsseiten als freistehende HTML-Datei ohne
 * aeussere Bezuege — keine Schriftdatei, kein Bild, kein Skript. Was eine
 * Engine hier nicht findet, kann sie auch nicht verschieden laden.
 *
 * Warum zwei Seiten und nicht eine, steht bei {@link GEOMETRIE}: Der Fokusring
 * und die Leistungsschiene tragen denselben Farbwert, und eine Sonde, deren
 * Farbe an zwei Stellen vorkommt, misst etwas anderes, als sie behauptet.
 *
 * @param {Record<string, { quelle: string; selektor: string; rumpf: string }>} regeln
 * @param {'fokus' | 'schienen'} seitenname
 * @returns {string}
 */
export function buildFixture(regeln, seitenname) {
  const plan = GEOMETRIE[seitenname];
  if (plan === undefined) throw new Error(`Die Vorrichtung kennt keine Seite \`${seitenname}\`.`);
  const { seite } = plan;

  const koerper =
    seitenname === 'fokus'
      ? '    <div class="btn btn--danger on-solid probe-focus probe-focus-on-solid probe-button"></div>'
      : plan.felder
          .map(
            (feld) =>
              `    <div class="note ${feld.klasse} probe-geometry" style="left: ${String(feld.left)}px; top: ${String(feld.top)}px; width: ${String(feld.breite)}px; height: ${String(feld.hoehe)}px;"></div>`,
          )
          .join('\n');

  const knopfgeruest =
    seitenname === 'fokus'
      ? `      .probe-button {
        position: absolute;
        left: ${String(plan.knopf.left)}px;
        top: ${String(plan.knopf.top)}px;
        width: ${String(plan.knopf.breite)}px;
        height: ${String(plan.knopf.hoehe)}px;
        min-height: 0;
      }`
      : '      .probe-geometry { position: absolute; }';

  const gemessen =
    seitenname === 'fokus'
      ? `      .btn {${regeln.button.rumpf}}
      .btn--danger {${regeln.buttonDanger.rumpf}}`
      : `      .note {${regeln.note.rumpf}}
      .note--billing {${regeln.noteBilling.rumpf}}
      .note--internal {${regeln.noteInternal.rumpf}}`;

  const fokusregeln =
    seitenname === 'fokus'
      ? `
      /* ---------------------------------------------------------------
         Ausgeschnitten aus ${regeln.focusVisible.quelle}.

         Die Rumpfe sind zeichengleich mit den zwei Fokusregeln; nur der
         Selektor ist eine Klasse statt der Pseudoklasse. Gemessen wird
         die Malreihenfolge, nicht die Ausloesung — Begruendung im
         Dateikopf.
         --------------------------------------------------------------- */
      .probe-focus {${regeln.focusVisible.rumpf}}
      .probe-focus-on-solid {${regeln.focusOnSolid.rumpf}}
`
      : '';

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>Takt — Vorrichtung fuer den Engine-Vergleich, Seite ${seitenname} (T-232)</title>
    <style>
      /* ---------------------------------------------------------------
         Tokens: heller Block aus ${regeln.tokens.quelle}, unveraendert.
         --------------------------------------------------------------- */
      :root {${regeln.tokens.rumpf}}

      /* ---------------------------------------------------------------
         Zuruecksetzen und Seitenflaeche. box-sizing und margin: 0 stehen
         zeichengleich so in base.css; die Seitengroesse ist Geruest der
         Vorrichtung.
         --------------------------------------------------------------- */
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        width: ${String(seite.breite)}px;
        height: ${String(seite.hoehe)}px;
        background-color: var(--bg-canvas);
        color-scheme: light;
      }

      /* ---------------------------------------------------------------
         Ausgeschnitten aus apps/web/src/styles/components.css
         --------------------------------------------------------------- */
${gemessen}

      /* ---------------------------------------------------------------
         Geruest der Vorrichtung. Diese Regel steht in keinem Stilblatt
         des Produkts und wird nicht gemessen; sie nagelt die Geometrie
         fest, damit beide Engines an denselben Koordinaten dasselbe
         zeigen muessen.

         Sie steht **nach** den ausgeschnittenen Regeln, weil .note selbst
         position: relative setzt: bei gleicher Spezifitaet gewinnt die
         spaetere, und ohne diese Reihenfolge stuenden die zwei Felder im
         normalen Fluss statt auf ihren Koordinaten.
         --------------------------------------------------------------- */
${knopfgeruest}
${fokusregeln}    </style>
  </head>
  <body>
${koerper}
  </body>
</html>
`;
}
