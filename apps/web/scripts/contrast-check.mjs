/**
 * Kontrastpruefung fuer die Design-Token von Takt.
 *
 * Liest `packages/ui-tokens/tokens.css`, loest die dort deklarierten Farbwerte
 * auf und misst die Kontrastverhaeltnisse nach WCAG 2.1/2.2 fuer eine feste Liste
 * von Paaren. Die Werte im Designsystem sind damit gemessen und nicht behauptet.
 *
 * **Teildurchsichtige Farben liegen auf einer Flaeche, und die steht im Paar**
 * (Feld `over`, T-197). Bis dahin legte der Lauf jede solche Farbe ueber
 * `--bg-canvas` — gleichgueltig, worauf sie im Produkt wirklich liegt. Das ist
 * dieselbe Klasse wie O-GH: ein Lauf, der Farben gegen Farben haelt statt gegen
 * Flaechen, kann nicht merken, dass er die falsche Zahl nennt. Er nannte sie um
 * bis zu 0,7 zu guenstig. Wer eine teildurchsichtige Flaeche misst, ohne `over`
 * zu setzen, bekommt jetzt keine freundliche Zahl mehr, sondern einen Abbruch.
 *
 * **Der Lauf misst seit T-209 seine eigene Vollstaendigkeit** (Auflage A-A-45
 * aus T-189, Befund T-189-7). Bis dahin sagte er, dass die Paare in seiner
 * Liste halten — nicht, dass seine Liste die gezeichneten Farben abdeckt.
 * Fuenfzehn Farbtoken wurden gezeichnet und von keinem Paar gemessen, und der
 * Lauf blieb gruen. Jetzt wird jedes in `packages/ui-tokens/tokens.css`
 * deklarierte **farbtragende** Token, das eine Klasse oder eine Komponente
 * unter `apps/web/src` zeichnet, zu einer von drei Aussagen gezwungen: ein
 * Paar, eine benannte Ausnahme (`exempt`) oder ein Eintrag in
 * `noContrastQuestion` mit dem Grund, warum es ein Paar hier nicht geben
 * **kann**. Die Gegenrichtung gilt auch: Ein Paar, das ein Token nennt, das
 * keine Klasse mehr zeichnet, macht den Lauf rot.
 *
 * **Seit T-214 misst er dazu die Tokenliste selbst** (O-IT, aus der offenen
 * Frage 1 von T-209). Die ersten drei Richtungen halten die Paarliste gegen den
 * Bestand; die vierte haelt den Bestand gegen sich selbst: Ein farbtragendes
 * Token der **semantischen** Ebene, das keine Flaeche zeichnet — weder in der
 * Oberflaeche noch im Add-in —, macht den Lauf rot. Sie hat keine
 * Ausnahmeliste, und das ist der Punkt: Ein Wert, den man „fuer spaeter"
 * behaelt, ist genau der Zustand, den sie beendet. Zwei Token sind bei ihrer
 * Einfuehrung gefallen, `--shadow-md` und `--shadow-drag`.
 *
 * **Die Grenze dieser Pruefung gehoert hierher, damit sie nicht fuer mehr
 * gehalten wird, als sie ist** (T-189-8, T-204 Befund B-13):
 *
 *  - Sie ist **tokengenau, nicht flaechengenau**. Sie findet ein gezeichnetes
 *    Token ohne Paar. Sie findet **nicht**, dass ein vorhandenes Paar die
 *    falsche Flaeche misst — genau der Fall, den T-204 9.3 an
 *    `--focus-ring-contrast` zeigt (seit T-216 behoben: die Grenze bleibt,
 *    der Fall ist keiner mehr) und den T-197 mit `over` fuer die
 *    Teildurchsichtigkeit geloest hat. Eine flaechengenaue Antwort verlangt
 *    die aufgeloeste Kaskade.
 *  - Sie sieht **nur Token aus `tokens.css`**. Eine Farbe, die eine Klasse
 *    unmittelbar hinschreibt oder in einer eigenen Eigenschaft deklariert,
 *    faellt nicht darunter.
 *  - Sie liest den Baum vom **Dateisystem**, nicht aus der Versionsverwaltung
 *    (E-087): Eine noch nicht eingecheckte Datei zeichnet genauso.
 *  - Die vierte Richtung fragt nach **Farbe**. Ein totes Token ohne Farbwert —
 *    `--z-drag` ist der Fall im Bestand — faellt ihr nicht auf, und sie
 *    behauptet das auch nicht.
 *
 * Aufruf:  node scripts/contrast-check.mjs
 *          node scripts/contrast-check.mjs --markdown
 *
 * Beendet sich mit Code 1, sobald ein Paar seine Mindestanforderung verfehlt,
 * eine Angabe in der Liste nicht traegt, ein gezeichnetes Farbtoken ohne
 * Nachweis dasteht oder eine Gegenprobe ausbleibt.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = resolve(here, "../../../packages/ui-tokens/tokens.css");

/* ------------------------------------------------------------------ */
/* Token aus der CSS-Datei lesen                                       */
/* ------------------------------------------------------------------ */

/**
 * Schneidet den Inhalt eines Selektorblocks heraus, beginnend beim ersten
 * Vorkommen des Selektors. Zaehlt geschweifte Klammern, damit verschachtelte
 * Blocks (@media) nicht vorzeitig enden.
 */
function extractBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selektor nicht gefunden: ${selector}`);
  const open = css.indexOf("{", start);
  if (open === -1) throw new Error(`Kein Block fuer: ${selector}`);
  let depth = 1;
  let i = open + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") depth -= 1;
    i += 1;
  }
  return css.slice(open + 1, i - 1);
}

/** Sammelt alle `--name: wert;`-Deklarationen eines Blocks. */
function parseDeclarations(block) {
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = re.exec(block)) !== null) {
    out.set(match[1], match[2].trim());
  }
  return out;
}

const css = readFileSync(tokensPath, "utf8");
const lightTokens = parseDeclarations(extractBlock(css, ":root {"));
const darkTokens = new Map(lightTokens);
for (const [key, value] of parseDeclarations(
  extractBlock(css, ':root[data-theme="dark"] {'),
)) {
  darkTokens.set(key, value);
}

/* ------------------------------------------------------------------ */
/* Farbrechnung                                                        */
/* ------------------------------------------------------------------ */

/** Loest `var(--x)`-Verweise auf, maximal 10 Ebenen tief. */
function resolveToken(tokens, name, depth = 0) {
  if (depth > 10) throw new Error(`Zirkulaerer Verweis bei ${name}`);
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`Unbekanntes Token: ${name}`);
  const varMatch = /^var\((--[a-z0-9-]+)\)$/i.exec(raw);
  if (varMatch) return resolveToken(tokens, varMatch[1], depth + 1);
  return raw;
}

/** Wandelt `#rgb`, `#rrggbb` oder `rgba(r, g, b, a)` in {r,g,b,a} mit 0..255. */
function parseColor(value) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const h = hex[1];
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba =
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i.exec(
      value,
    );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  throw new Error(`Farbe nicht lesbar: ${value}`);
}

/** Legt eine teiltransparente Farbe ueber eine deckende Grundfarbe. */
function flatten(front, back) {
  if (front.a >= 1) return front;
  return {
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a),
    a: 1,
  };
}

/* ------------------------------------------------------------------ */
/* Die Flaeche unter einer teildurchsichtigen Farbe                    */
/* ------------------------------------------------------------------ */

/** Der Anwendungshintergrund. Die einzige Flaeche, unter der nichts mehr liegt. */
const CANVAS = "--bg-canvas";

/** Liest `over` als Kette von innen (nah) nach aussen (fern). */
function surfaceStack(pair) {
  if (pair.over === undefined) return [];
  return Array.isArray(pair.over) ? pair.over : [pair.over];
}

/**
 * Liefert die deckende Flaeche, auf der der Vordergrund eines Paares steht.
 *
 * Ist der Hintergrund deckend, ist er die Flaeche. Ist er es nicht, muss das
 * Paar sagen, worauf er liegt — und diese Kette muss auf einer deckenden Farbe
 * enden. Fehlt die Angabe oder traegt sie nicht, wirft die Funktion, statt eine
 * Flaeche zu erraten: Eine geratene Flaeche ist genau der Fehler, gegen den
 * `over` gebaut wurde.
 */
function backdrop(tokens, pair, where) {
  const raw = parseColor(resolveToken(tokens, pair.bg));
  if (raw.a >= 1) return raw;
  const stack = surfaceStack(pair);
  if (stack.length === 0) {
    throw new Error(
      `${where}: ${pair.bg} ist teildurchsichtig und nennt keine Flaeche. Das Paar ` +
        `braucht ein Feld \`over\` — auch dann, wenn die Flaeche wirklich ${CANVAS} ist.`,
    );
  }
  const outerName = stack[stack.length - 1];
  const outer = parseColor(resolveToken(tokens, outerName));
  if (outer.a < 1) {
    throw new Error(
      `${where}: die aeusserste Flaeche ${outerName} unter ${pair.bg} ist selbst ` +
        `teildurchsichtig. Die Kette in \`over\` muss auf einer deckenden Farbe enden.`,
    );
  }
  let under = outer;
  for (let i = stack.length - 2; i >= 0; i -= 1) {
    under = flatten(parseColor(resolveToken(tokens, stack[i])), under);
  }
  return flatten(raw, under);
}

function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ */
/* Zu pruefende Paare                                                  */
/* ------------------------------------------------------------------ */

/**
 * `min` ist die Mindestanforderung nach WCAG 2.2 AA:
 *   4.5  Fliesstext und Text unter 18.66px/24px
 *   3.0  grosser Text ab 24px oder ab 18.66px fett (SC 1.4.3),
 *        sowie Bedienelement- und Zustandsgrenzen (SC 1.4.11)
 *
 * `over` nennt die Flaeche unter einem **teildurchsichtigen** `bg`, von innen
 * nach aussen; ein einzelner Name oder eine Kette. Der letzte Name muss eine
 * deckende Farbe tragen. Das Feld ist **Pflicht**, sobald `bg` in einem der
 * beiden Themen teildurchsichtig ist, und `over: "--bg-canvas"` ist die
 * richtige Antwort, wenn die Farbe wirklich auf dem Anwendungshintergrund
 * liegt. An einem deckenden `bg` ist es ein Fehler: Es waere Zierde und wuerde
 * eine Genauigkeit behaupten, die die Rechnung dort gar nicht braucht.
 */
const pairs = [
  // Text auf Flaechen
  { group: "Text", fg: "--text-primary", bg: "--bg-canvas", min: 4.5, note: "Standardtext auf Anwendungshintergrund" },
  { group: "Text", fg: "--text-primary", bg: "--bg-surface", min: 4.5, note: "Standardtext auf Karte" },
  { group: "Text", fg: "--text-primary", bg: "--bg-subtle", min: 4.5, note: "Tabellenkopf" },
  { group: "Text", fg: "--text-primary", bg: "--bg-hover", min: 4.5, note: "Zeile unter dem Zeiger" },
  { group: "Text", fg: "--text-primary", bg: "--bg-selected", min: 4.5, note: "ausgewaehlte Zeile" },
  { group: "Text", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Sekundaertext" },
  { group: "Text", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Hilfetext, Platzhalter" },
  { group: "Text", fg: "--text-muted", bg: "--bg-canvas", min: 4.5, note: "Hilfetext auf Hintergrund" },
  { group: "Text", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Spaltenueberschrift" },
  { group: "Text", fg: "--text-disabled", bg: "--bg-disabled", min: 3, note: "deaktiviert, ausgenommen nach SC 1.4.3" },
  { group: "Text", fg: "--text-link", bg: "--bg-surface", min: 4.5, note: "Verweis" },
  { group: "Text", fg: "--text-secondary", bg: "--bg-canvas", min: 4.5, note: "Einleitungstext auf Hintergrund" },
  { group: "Text", fg: "--accent-text", bg: "--bg-canvas", min: 4.5, note: "hervorgehobener Navigationseintrag" },
  { group: "Text", fg: "--text-primary", bg: "--accent-bg-subtle", min: 4.5, note: "Text im Entscheidungskasten" },

  // Aktion
  { group: "Aktion", fg: "--text-on-accent", bg: "--accent-bg", min: 4.5, note: "Primaerknopf" },
  { group: "Aktion", fg: "--text-on-accent", bg: "--accent-bg-hover", min: 4.5, note: "Primaerknopf unter dem Zeiger" },
  { group: "Aktion", fg: "--text-on-accent", bg: "--accent-bg-active", min: 4.5, note: "Primaerknopf gedrueckt" },
  { group: "Aktion", fg: "--accent-text", bg: "--bg-surface", min: 4.5, note: "Textknopf, aktiver Navigationseintrag" },
  { group: "Aktion", fg: "--accent-text", bg: "--accent-bg-subtle", min: 4.5, note: "Textknopf auf Akzentflaeche" },
  { group: "Aktion", fg: "--text-on-solid", bg: "--danger-bg", min: 4.5, note: "destruktiver Knopf" },
  // T-209 (A-A-45, T-204 9.2): Die Gefahrenfarbe war die einzige der vier
  // gefuellten Knopfarten ohne diese zwei Paare — fuer den Primaerknopf stehen
  // sie seit je. Das ist keine Ausnahme, sondern eine Unsymmetrie (T-194 B-7):
  // Paare entstehen beim Bauen eines Bildschirms und nicht beim Bauen eines
  // Bauteils. `.btn--danger` setzt `color: var(--text-on-solid)`; unter dem
  // Zeiger wechselt die Fuellung, der Text nicht.
  { group: "Aktion", fg: "--text-on-solid", bg: "--danger-bg-hover", min: 4.5, note: "Gefahrenknopf unter dem Zeiger" },
  { group: "Aktion", fg: "--text-on-solid", bg: "--danger-bg-active", min: 4.5, note: "Gefahrenknopf gedrueckt" },
  { group: "Aktion", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Fehlertext im Hinweis" },
  { group: "Aktion", fg: "--danger-text", bg: "--bg-surface", min: 4.5, note: "Fehlertext am Feld" },

  // Exportstatus
  { group: "Exportstatus", fg: "--status-open-fg", bg: "--status-open-bg", min: 4.5, note: "Etikett Offen" },
  { group: "Exportstatus", fg: "--status-open-border", bg: "--bg-surface", min: 3, note: "Kontur Offen, SC 1.4.11" },
  { group: "Exportstatus", fg: "--status-open-marker", bg: "--bg-surface", min: 3, note: "Zeilenmarker Offen" },
  { group: "Exportstatus", fg: "--status-exported-fg", bg: "--status-exported-bg", min: 4.5, note: "Etikett Exportiert" },
  { group: "Exportstatus", fg: "--status-exported-bg", bg: "--bg-surface", min: 3, note: "Flaeche Exportiert gegen Karte" },
  { group: "Exportstatus", fg: "--status-exported-marker", bg: "--status-exported-tint", min: 3, note: "Marker auf getoenter Zeile" },
  // T-209 (A-A-45, T-204 9.4): Die Symmetrie zu "Offen" und "Erneut offen"
  // traegt hier **nicht** — jene zwei Etiketten sind Konturetiketten ohne
  // Fuellung, dort *ist* die Kontur die Grenze. "Exportiert" ist voll gefuellt,
  // und seine Flaeche haelt die Grenze eine Zeile weiter oben mit min 3. Ein
  // zweites Paar mit Mindestwert behauptete, der Zustand haenge an der Kante.
  { group: "Exportstatus", fg: "--status-exported-border", bg: "--bg-surface", min: 0, exempt: true, note: "Kante des gefuellten Etiketts Exportiert — 8,93 hell, 11,41 dunkel; die Flaeche traegt die Grenze und ist mit min 3 gemessen" },
  { group: "Exportstatus", fg: "--text-primary", bg: "--status-exported-tint", min: 4.5, note: "Zeilentext auf getoenter Zeile" },
  { group: "Exportstatus", fg: "--status-reopened-fg", bg: "--status-reopened-bg", min: 4.5, note: "Etikett Erneut offen" },
  { group: "Exportstatus", fg: "--status-reopened-border", bg: "--bg-surface", min: 3, note: "Kontur Erneut offen" },
  { group: "Exportstatus", fg: "--status-reopened-marker", bg: "--bg-surface", min: 3, note: "Zeilenmarker Erneut offen" },
  /*
   * Die Schraffur auf dem Etikett „Erneut offen" — T-194 Stelle 1, gemessen
   * statt behauptet.
   *
   * `.badge--reopened` legt einen `repeating-linear-gradient` aus
   * `--status-reopened-hatch` **ueber** `--status-reopened-bg`, und die
   * Beschriftung steht darauf. Zwei Zeilen, zwei verschiedene Aussagen:
   *
   * 1. **Das Deckelpaar.** Die Beschriftung wird gegen die unguenstigste
   *    Stelle des Musters gemessen, also gegen den Streifen — die konservative
   *    Lesart von SC 1.4.3. Es ist zugleich das erste Paar mit `over`: Bis
   *    T-197 flaechte der Lauf den Streifen ueber `--bg-canvas` statt ueber
   *    die Etikettflaeche und wies ihn damit **zu guenstig** aus (dunkel 5,63
   *    statt 4,89 — die Zahl, die im dunklen Thema knapp ueber 4,5 liegt).
   *    Wer die Schraffur spaeter „repariert", also kraeftiger macht, macht die
   *    Beschriftung schlechter; ab diesem Paar wird der Lauf davon rot.
   * 2. **Die benannte Ausnahme.** Der Streifen gegen die Flaeche, auf der er
   *    liegt: hell 1,24:1, dunkel 1,45:1. Er traegt die Unterscheidung also
   *    **nicht** ohne Farbwahrnehmung, und einen besseren Wert gibt es nicht —
   *    Zeile 1 deckelt ihn bei 1,80 hell und 1,58 dunkel. Die Zeile steht hier
   *    als Merkposten, damit die Zahl im Lauf steht statt in einem Bericht.
   *    Der Satz in `components.css`, der die Wirkung heute noch behauptet,
   *    wird mit O-HK zurueckgenommen — nicht hier, und nicht von diesem Lauf.
   */
  { group: "Exportstatus", fg: "--status-reopened-fg", bg: "--status-reopened-hatch", over: "--status-reopened-bg", min: 4.5, note: "Beschriftung Erneut offen ueber dem Streifen der Schraffur, SC 1.4.3" },
  { group: "Exportstatus", fg: "--status-reopened-hatch", bg: "--status-reopened-bg", min: 0, exempt: true, note: "Streifen gegen die Etikettflaeche — hell 1,24:1, dunkel 1,45:1, durch SC 1.4.3 gedeckelt und deshalb ausgenommen" },
  // Vierter Anzeigezustand "Nicht abgerechnet" (E-050). Er traegt bewusst
  // keine eigene Signalfarbe: Hier ist kein Geld geflossen, es gibt nichts zu
  // signalisieren. Die Unterscheidung haengt an gestrichelter Kontur, Balken
  // statt Punkt, durchgestrichenem Kreis und Wortlaut. Seit T-036 hat er
  // eigene Token (`--status-notbilled-*`, Verweise auf die neutralen Werte);
  // gemessen wird deshalb der Token und nicht mehr sein heutiges Ziel — sonst
  // ginge eine spaetere Aenderung an der Messung vorbei.
  { group: "Exportstatus", fg: "--status-notbilled-fg", bg: "--status-notbilled-bg", min: 4.5, note: "Etikett Nicht abgerechnet" },
  { group: "Exportstatus", fg: "--status-notbilled-border", bg: "--status-notbilled-bg", min: 3, note: "gestrichelte Kontur Nicht abgerechnet, SC 1.4.11" },
  { group: "Exportstatus", fg: "--status-notbilled-marker", bg: "--bg-surface", min: 3, note: "Zeilenmarker Nicht abgerechnet auf Karte" },
  { group: "Exportstatus", fg: "--status-notbilled-marker", bg: "--bg-surface-alt", min: 3, note: "Zeilenmarker Nicht abgerechnet auf Zebrazeile" },
  { group: "Exportstatus", fg: "--status-notbilled-marker", bg: "--bg-subtle", min: 3, note: "Zeilenmarker Nicht abgerechnet auf Kanban-Spalte" },

  // Timer
  { group: "Timer", fg: "--timer-running-fg", bg: "--timer-running-bg", min: 4.5, note: "laufender Timer" },
  { group: "Timer", fg: "--timer-running-pulse", bg: "--timer-running-bg", min: 3, note: "Pulspunkt" },
  { group: "Timer", fg: "--timer-idle-fg", bg: "--timer-idle-bg", min: 4.5, note: "Timer angehalten" },
  /*
   * T-056: Der Stoppknopf sitzt seit der Umgestaltung der Kopfleiste **auf**
   * der getoenten Flaeche des laufenden Timers und nicht mehr auf der Karte.
   * Seine Fuellung ist zugleich seine Grenze — damit faellt sie unter
   * SC 1.4.11 und wird gegen den Untergrund gemessen, auf dem sie liegt.
   */
  { group: "Timer", fg: "--danger-bg", bg: "--timer-running-bg", min: 3, note: "Stoppknopf in der laufenden Timerleiste, SC 1.4.11" },
  /*
   * Der senkrechte Strich zwischen Zeit und Todo-Titel gruppiert nur; er sagt
   * nichts, was nicht auch ohne ihn dastuende. Deshalb ausgenommen — gemessen
   * wird er trotzdem, damit die Ausnahme eine Entscheidung bleibt und kein
   * Versehen: hell 1.47:1, dunkel 1.74:1.
   */
  { group: "Timer", fg: "--timer-running-border", bg: "--timer-running-bg", min: 0, exempt: true, note: "Trennstrich vor dem Todo-Titel, rein gruppierend" },
  // Bis T-108 stand dieses Paar unter "Erledigt" mit dem Beleg "Fussnote im
  // Wiederaufnahme-Hinweis". Der Hinweis ist mit W-9 entfallen; das Paar bleibt,
  // weil es andere Flaechen tragen (Call-Nummer und Symbol in einer Zeile mit
  // laufendem Timer, `.pick-row--running`, `.timerbar__icon`).
  { group: "Timer", fg: "--text-muted", bg: "--timer-running-bg", min: 4.5, note: "Nebentext in einer Zeile mit laufendem Timer" },
  { group: "Timer", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Timerleiste im Ruhezustand" },
  // T-209 (A-A-45, T-204 9.4): Zwei Zeilen, weil die Uhr auf zwei Flaechen
  // steht. Der erkennbare Zustand ist **laufend**, und dessen Kontur ist mit
  // min 3 gemessen; der Ruhezustand ist dessen Abwesenheit. Sein Rahmen grenzt
  // den Kasten ab und kennzeichnet weder ein Bedienelement noch einen Zustand —
  // die Uhr ist an Ziffern und Knopfbeschriftung erkennbar, nicht an ihrer
  // Kante.
  { group: "Timer", fg: "--timer-idle-border", bg: "--bg-surface", min: 0, exempt: true, note: "Kante der ruhenden Uhr auf der Karte — 1,46 hell, 1,57 dunkel; der erkennbare Zustand ist laufend" },
  { group: "Timer", fg: "--timer-idle-border", bg: "--bg-subtle", min: 0, exempt: true, note: "dieselbe Kante auf getoenter Flaeche — 1,30 hell, 1,43 dunkel" },

  // Hinweise
  { group: "Hinweis", fg: "--info-fg", bg: "--info-bg", min: 4.5, note: "Information" },
  { group: "Hinweis", fg: "--success-fg", bg: "--success-bg", min: 4.5, note: "Erfolg" },
  { group: "Hinweis", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Warnung" },

  // Vermerk und Leistung (E-016)
  { group: "Feldart", fg: "--note-billing-header-fg", bg: "--note-billing-header-bg", min: 4.5, note: "Kopfband Leistung" },
  { group: "Feldart", fg: "--note-billing-rail", bg: "--bg-surface", min: 3, note: "durchgezogene Schiene Leistung gegen die Karte" },
  { group: "Feldart", fg: "--note-internal-header-fg", bg: "--note-internal-header-bg", min: 4.5, note: "Kopfband Vermerk" },
  // Das Paar misst zweierlei zugleich. In der Luecke einer unterbrochenen
  // Schiene sieht man die Karte — Balken gegen Luecke ist deshalb dasselbe
  // Verhaeltnis wie Schiene gegen Karte. Die Form hat damit einen Zahlenwert
  // bekommen, ohne dass ein Paar dazukommen musste (T-194 Abschnitt 2.5).
  { group: "Feldart", fg: "--note-internal-rail", bg: "--bg-surface", min: 3, note: "unterbrochene Schiene Vermerk gegen die Karte — zugleich Balken gegen Luecke" },
  // Die zwei Schienen gegeneinander: 1,71 hell / 1,31 dunkel (T-189). Sie tragen
  // die Unterscheidung **nicht** und sollen es nicht — sie ist seit T-194 Form
  // (durchgezogen gegen unterbrochen). Im dunklen Thema laesst sich das gar
  // nicht anders loesen: eine zweite Schiene mit 3:1 Abstand muesste dort
  // praktisch weiss sein, weil das dunkle Fenster durch die eigene 3:1-Zusage
  // gegen die Karte geschlossen ist (T-194 Abschnitt 2.2). Die Zahl steht hier,
  // damit niemand sie ein zweites Mal sucht.
  { group: "Feldart", fg: "--note-billing-rail", bg: "--note-internal-rail", min: 0, exempt: true, note: "die beiden Randschienen gegeneinander — die Form traegt, nicht die Helligkeit" },
  { group: "Feldart", fg: "--text-primary", bg: "--note-internal-bg", min: 4.5, note: "Text im Vermerkfeld" },
  // T-209 (A-A-45, T-204 9.2): die **Schreibflaeche des Leistungsfeldes** — der
  // Text, der in die Abrechnung des Kunden geht (E-016). Fuer den Vermerk steht
  // dasselbe Paar eine Zeile darueber seit je; dass ausgerechnet die exportierte
  // Haelfte fehlte, ist die Unsymmetrie aus T-194 B-7. Das Paar steht auch dann,
  // wenn `--note-billing-bg` im hellen Thema zeichengleich `#ffffff` ist wie
  // `--bg-surface`: Eine Zusage, die aus der Gleichheit zweier Tokenwerte folgt,
  // haelt nur so lange wie die Gleichheit.
  { group: "Feldart", fg: "--text-primary", bg: "--note-billing-bg", min: 4.5, note: "Text im Leistungsfeld — die Notiz, die in die Abrechnung geht" },
  // Die beiden 1px-Rahmen der Felder. Getragen wird von der **Schiene**, und die
  // ist zweimal gemessen: durchgezogen fuer die Leistung, unterbrochen fuer den
  // Vermerk (T-194, T-202). Der Rahmen grenzt den Kasten ab.
  { group: "Feldart", fg: "--note-internal-border", bg: "--bg-surface", min: 0, exempt: true, note: "1px-Rahmen des Vermerkfeldes — 1,46 hell, 1,57 dunkel; getragen wird von der Schiene" },
  { group: "Feldart", fg: "--note-billing-border", bg: "--bg-surface", min: 0, exempt: true, note: "1px-Rahmen des Leistungsfeldes — 1,53 hell, 1,98 dunkel; getragen wird von der Schiene" },
  { group: "Feldart", fg: "--text-on-accent", bg: "--accent-bg", min: 4.5, note: "Marke vor der Beschriftung Leistung" },
  { group: "Feldart", fg: "--border-strong", bg: "--note-internal-bg", min: 3, note: "Kontur der Marke vor Vermerk" },
  { group: "Feldart", fg: "--text-muted", bg: "--note-internal-bg", min: 4.5, note: "Symbol in der Marke vor Vermerk" },

  // Kanban: Erledigt-Kennzeichen, unabhaengig von der Spalte (A-2.4)
  { group: "Erledigt", fg: "--success-fg", bg: "--success-bg", min: 4.5, note: "Kennzeichen Erledigt" },
  { group: "Erledigt", fg: "--success-fg", bg: "--bg-surface", min: 3, note: "Kontur Kennzeichen Erledigt" },
  { group: "Erledigt", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Kennzeichen Offen" },
  { group: "Erledigt", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Kennzeichen Erledigt aufgehoben" },
  { group: "Erledigt", fg: "--border-strong", bg: "--bg-inset", min: 3, note: "gestrichelte Kontur Erledigt aufgehoben" },
  { group: "Erledigt", fg: "--success-fg", bg: "--bg-subtle", min: 4.5, note: "Zaehler erledigter Todos im Spaltenkopf" },

  // Kanban nach E-054/E-055: Eine Spalte ist eine Regel ueber fuenf Achsen, dieselbe Karte
  // kann in mehreren Spalten stehen. Beides braucht eigene Flaechen — die
  // Regelzeile im Spaltenkopf, das Etikett "steht auch in", der Status auf der
  // Karte und die Hervorhebung aller Vorkommen.
  // Die Regelzeile traegt seit T-181 `--text-secondary` statt `--text-muted`
  // (ST-05 Ausgleich): Sie tritt an die Stelle von vierzehn gestrichenen
  // Saetzen und ist die Definition der Spalte, nicht ihr Hilfetext. Beide
  // Flaechen, auf denen sie erscheint, stehen deshalb unter eigenem Namen —
  // eine Zusage, die aus der Gleichheit zweier Tokenwerte folgt, haelt nur so
  // lange, wie die Gleichheit haelt.
  { group: "Board (E-054)", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Regelzeile im Spaltenkopf" },
  { group: "Board (E-054)", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Regelzeile in der Regelliste und in der Formularvorschau" },
  { group: "Board (E-054)", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Ordnerzusatz kein Tag darin, gedaempft im Spaltenkopf" },
  { group: "Board (E-054)", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Ordner in der Regelzeile" },
  { group: "Board (E-054)", fg: "--info-fg", bg: "--info-bg", min: 4.5, note: "Etikett Steht auch in" },
  { group: "Board (E-054)", fg: "--info-fg", bg: "--bg-surface", min: 3, note: "Kontur des Etiketts gegen die Karte, SC 1.4.11" },
  { group: "Board (E-054)", fg: "--info-bg", bg: "--info-fg", min: 4.5, note: "Etikett gedrueckt, Farben getauscht" },
  { group: "Board (E-054)", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Status auf der Karte" },
  { group: "Board (E-054)", fg: "--border-accent", bg: "--bg-surface", min: 3, note: "Ring um ein hervorgehobenes Vorkommen, innen" },
  { group: "Board (E-054)", fg: "--border-accent", bg: "--bg-subtle", min: 3, note: "Ring um ein hervorgehobenes Vorkommen, gegen die Spalte" },
  { group: "Board (E-054)", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Anzeigeort-Etikett in der Regelliste" },

  // Der leere Ordner (E-057, T-083). Ein erforderlicher Ordner ohne ein
  // einziges Tag ist der einzige der drei Leerzustaende einer Spalte, den
  // ausschliesslich der Benutzer beheben kann — deshalb traegt er Warnfarbe.
  // Er erscheint auf drei Untergruenden: im Spaltenkopf (`--bg-subtle`), in
  // der Regelliste und im Formular (`--bg-surface`) und in der Zeile des
  // Spaltendialogs unter dem Zeiger (`--bg-hover`). Jeder gemessen, weil
  // Warnfarben auf getoenten Flaechen gern knapp durchfallen.
  { group: "Leerer Ordner", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Ordnerchip ohne Tag in der Regelzusammenfassung" },
  { group: "Leerer Ordner", fg: "--warning-fg", bg: "--bg-subtle", min: 4.5, note: "Folgesatz im Spaltenkopf; zugleich Kontur des Chips, SC 1.4.11" },
  { group: "Leerer Ordner", fg: "--warning-fg", bg: "--bg-surface", min: 4.5, note: "Folgesatz in Regelliste und Formular; zugleich Kontur des Chips, SC 1.4.11" },
  /*
   * `--warning-border` steht hier ausdruecklich **nicht** als Kontur: gemessen
   * 1,28:1 gegen `--bg-subtle` und 1,44:1 gegen `--bg-surface` im hellen Modus,
   * 2,47:1 und 2,71:1 im dunklen — alle vier unter 3:1. Der Chip nimmt deshalb
   * `--warning-fg` als Kontur. Die Zeile steht hier als Merkposten, damit
   * niemand die weichere Farbe „aus Konsistenz" zurueckholt.
   */
  { group: "Leerer Ordner", fg: "--warning-fg", bg: "--bg-hover", min: 4.5, note: "Befund in der Spaltenzeile unter dem Zeiger" },

  // Regelformular (S-11, E-055, H-2 aus R-2). Die Flaechen des Formulars sind
  // fast alle ueber bereits gemessene Farbpaare abgedeckt — bis auf eines: den
  // **Optionsknopf** selbst auf der Flaeche der **gewaehlten** Optionszeile.
  // `accent-color: --accent-bg` auf `--accent-bg-subtle` ist die Grenze eines
  // Bedienelements nach SC 1.4.11, und beide Farben unterscheiden sich in den
  // zwei Farbmodi verschieden stark. Der Fall ist harmlos; „gemessen statt
  // behauptet" ist trotzdem der Massstab.
  { group: "Regelformular", fg: "--accent-bg", bg: "--accent-bg-subtle", min: 3, note: "Optionsknopf auf der gewaehlten Optionszeile, SC 1.4.11" },
  { group: "Regelformular", fg: "--accent-bg", bg: "--bg-surface", min: 3, note: "Optionsknopf auf der ungewaehlten Optionszeile, SC 1.4.11" },
  { group: "Regelformular", fg: "--accent-bg", bg: "--bg-hover", min: 3, note: "Optionsknopf unter dem Zeiger, SC 1.4.11" },
  // Die Ladezeile und das Suchfeld der Chip-Auswahlen (B-5, A-4.4, T-091).
  { group: "Regelformular", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Ladezeile und Leersatz der Ordnerauswahl" },

  // Statusverwaltung (A-5.4, Bereich „Status" in S-09, T-073). Der Status hat
  // mit E-054 seine Spalte verloren und ist eine Stammgroesse geworden; seine
  // Verwaltungszeile bringt vier Flaechen mit, die es so vorher nicht gab —
  // die Stelle in der Reihenfolge, der Auswahlknopf fuer den Standard, der
  // Sperrgrund auf eigener Flaeche und beides noch einmal unter dem Zeiger.
  // Jede hier gemessen statt behauptet.
  { group: "Statusverwaltung", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Stelle in der Reihenfolge" },
  { group: "Statusverwaltung", fg: "--text-muted", bg: "--bg-hover", min: 4.5, note: "Zaehlung der Todos, Zeile unter dem Zeiger" },
  { group: "Statusverwaltung", fg: "--accent-text", bg: "--bg-surface", min: 4.5, note: "Beschriftung Standard, gewaehlt" },
  { group: "Statusverwaltung", fg: "--accent-text", bg: "--bg-hover", min: 4.5, note: "Beschriftung Standard, gewaehlt und unter dem Zeiger" },
  { group: "Statusverwaltung", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "Beschriftung Standard unter dem Zeiger" },
  { group: "Statusverwaltung", fg: "--accent-bg", bg: "--bg-surface", min: 3, note: "Auswahlknopf Standard, SC 1.4.11" },
  { group: "Statusverwaltung", fg: "--accent-bg", bg: "--bg-hover", min: 3, note: "Auswahlknopf Standard unter dem Zeiger, SC 1.4.11" },
  { group: "Statusverwaltung", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Grund, warum sich ein Status nicht loeschen laesst" },
  { group: "Statusverwaltung", fg: "--text-muted", bg: "--bg-inset", min: 3, note: "Schloss vor dem Sperrgrund, Zustandsanzeige nach SC 1.4.11" },
  { group: "Statusverwaltung", fg: "--bg-inset", bg: "--bg-surface", min: 0, exempt: true, note: "Flaeche des Sperrgrundes gegen die Karte, rein abgrenzend" },
  { group: "Statusverwaltung", fg: "--bg-inset", bg: "--bg-hover", min: 0, exempt: true, note: "dieselbe Flaeche in der Zeile unter dem Zeiger" },

  // Exportvorschau nach Tagesgruppen (E-031, E-034) und Filterschalter (E-039).
  // Neue Flaechenkombinationen aus T-018 — jede hier gemessen statt behauptet.
  { group: "Tagesgruppe", fg: "--text-primary", bg: "--bg-selected", min: 4.5, note: "Titel einer ausgewaehlten Tagesgruppe" },
  { group: "Tagesgruppe", fg: "--text-secondary", bg: "--bg-selected", min: 4.5, note: "zusammengefuehrte Leistung, ausgewaehlt" },
  { group: "Tagesgruppe", fg: "--text-muted", bg: "--bg-selected", min: 4.5, note: "Kalendertag und Call, ausgewaehlt" },
  { group: "Tagesgruppe", fg: "--text-primary", bg: "--bg-surface-alt", min: 4.5, note: "Zeitraum einer Einzelbuchung" },
  { group: "Tagesgruppe", fg: "--text-secondary", bg: "--bg-surface-alt", min: 4.5, note: "Dauer und Leistung einer Einzelbuchung" },
  { group: "Tagesgruppe", fg: "--text-muted", bg: "--bg-surface-alt", min: 4.5, note: "Herkunft einer Einzelbuchung" },
  { group: "Tagesgruppe", fg: "--text-muted", bg: "--bg-disabled", min: 4.5, note: "ausgeschlossene Buchung, durchgestrichen" },
  { group: "Tagesgruppe", fg: "--text-primary", bg: "--warning-bg", min: 4.5, note: "Titel einer nicht exportierbaren Gruppe" },
  { group: "Tagesgruppe", fg: "--text-muted", bg: "--warning-bg", min: 4.5, note: "gedaempfte Zeit einer gesperrten Gruppe" },
  { group: "Tagesgruppe", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Sperrgrund nach E-034" },
  { group: "Filterschalter", fg: "--text-muted", bg: "--accent-bg-subtle", min: 4.5, note: "Zusatz unter der Beschriftung, Schalter ein" },
  { group: "Filterschalter", fg: "--accent-bg", bg: "--bg-surface", min: 3, note: "Schienenfarbe des Schalters, SC 1.4.11" },
  { group: "Filterschalter", fg: "--accent-text", bg: "--bg-surface", min: 4.5, note: "Haken im Knauf, Schalter ein" },

  // Huellenzustaende beim Start (T-020). Drei neue Flaechen: die Startmeldung
  // auf getoenter Fehlerflaeche, die Sperrmeldung im Dialog und der
  // Datenordner-Hinweis auf Warnflaeche. Fehlerzustaende greifen gern zu
  // Farben, die knapp durchfallen — deshalb steht hier jede Kombination, die
  // in components.css tatsaechlich vorkommt.
  { group: "Startmeldung", fg: "--text-primary", bg: "--danger-bg-subtle", min: 4.5, note: "Ueberschrift und Meldungsliste der Startmeldung" },
  { group: "Startmeldung", fg: "--text-secondary", bg: "--danger-bg-subtle", min: 4.5, note: "Erklaerung und Handlungsanweisung" },
  { group: "Startmeldung", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Zwischenueberschrift Was Sie tun koennen" },
  { group: "Startmeldung", fg: "--text-on-solid", bg: "--danger-bg", min: 4.5, note: "Symbol der Startmeldung" },
  { group: "Startmeldung", fg: "--danger-bg", bg: "--danger-bg-subtle", min: 3, note: "Randschiene der Startmeldung, SC 1.4.11" },
  { group: "Startmeldung", fg: "--border-control", bg: "--danger-bg-subtle", min: 3, note: "Knopf Takt beenden in der Startmeldung, SC 1.4.11" },
  { group: "Sperrmeldung", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Erklaerung und Schritte im Sperrdialog" },
  { group: "Sperrmeldung", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Grund aus der Huelle im Sperrdialog" },
  { group: "Sperrmeldung", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "Schrittnummer im Sperrdialog" },
  { group: "Sperrmeldung", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Beendigungscode in der Fusszeile" },
  { group: "Sperrmeldung", fg: "--text-on-solid", bg: "--danger-bg", min: 4.5, note: "Knopf Takt beenden im Sperrdialog" },
  { group: "Datenordner", fg: "--text-primary", bg: "--warning-bg", min: 4.5, note: "Ueberschrift des Datenordner-Hinweises" },
  { group: "Datenordner", fg: "--text-secondary", bg: "--warning-bg", min: 4.5, note: "Befund der Huelle und Erklaerung" },
  { group: "Datenordner", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Zwischenueberschriften des Hinweises" },
  { group: "Datenordner", fg: "--warning-bg", bg: "--warning-fg", min: 4.5, note: "Symbol des Hinweises, gefuellte Flaeche" },
  { group: "Datenordner", fg: "--text-muted", bg: "--warning-bg", min: 4.5, note: "Fussnote Takt arbeitet weiter" },

  // Der technische Zusatz (T-020b). Eigene Flaeche innerhalb der getoenten
  // Baender, damit der Satz fuer die Systembetreuung markierbar bleibt.
  { group: "Weitergabe", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Zusatz im Datenordner-Hinweis" },
  { group: "Weitergabe", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Beschriftung Fuer die Systembetreuung" },
  { group: "Weitergabe", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Zusatz im Sperrdialog" },
  { group: "Weitergabe", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Beschriftung im Sperrdialog" },
  { group: "Weitergabe", fg: "--border-control", bg: "--bg-surface", min: 3, note: "Randschiene des Zusatzes, SC 1.4.11" },
  // Die Flaeche des Zusatzes hebt sich vom Band ab, aber sie kennzeichnet weder
  // ein Bedienelement noch einen Zustand: Erkennbar ist der Block an seiner
  // Beschriftung, nicht an seiner Kante. SC 1.4.11 ist darauf nicht anwendbar.
  { group: "Weitergabe", fg: "--bg-surface", bg: "--warning-bg", min: 0, exempt: true, note: "Zusatzflaeche gegen Warnband, rein abgrenzend" },

  // Anwendungshuelle (T-022) — Navigation, Suche, Rueckmeldung, Kennzahlen
  { group: "Anwendung", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Zaehler im Navigationseintrag, Kennzeichen in der Todo-Zeile" },
  { group: "Anwendung", fg: "--text-muted", bg: "--bg-selected", min: 4.5, note: "Zusatz im hervorgehobenen Suchtreffer" },
  { group: "Anwendung", fg: "--success-fg", bg: "--bg-surface", min: 3, note: "Farbschiene der Erfolgsmeldung, SC 1.4.11" },
  { group: "Anwendung", fg: "--info-fg", bg: "--bg-surface", min: 3, note: "Farbschiene der Hinweismeldung, SC 1.4.11" },
  { group: "Anwendung", fg: "--warning-fg", bg: "--bg-surface", min: 3, note: "Farbschiene der Warnmeldung, SC 1.4.11" },
  { group: "Anwendung", fg: "--text-primary", bg: "--warning-bg", min: 4.5, note: "Kennzahl auf getoenter Warnflaeche" },
  { group: "Anwendung", fg: "--text-secondary", bg: "--warning-bg", min: 4.5, note: "Erlaeuterung auf getoenter Warnflaeche" },
  { group: "Anwendung", fg: "--text-muted", bg: "--warning-bg", min: 4.5, note: "Beschriftung der Kennzahl auf Warnflaeche" },
  { group: "Anwendung", fg: "--text-secondary", bg: "--accent-bg-subtle", min: 4.5, note: "Erlaeuterung auf Akzentflaeche" },
  { group: "Anwendung", fg: "--text-muted", bg: "--accent-bg-subtle", min: 4.5, note: "Beschriftung der Kennzahl auf Akzentflaeche" },
  { group: "Anwendung", fg: "--warning-fg", bg: "--accent-bg-subtle", min: 4.5, note: "Warnung in der Exportkopfzeile" },
  // T-045: Faellt die Gesamtvorschau aus, steht in derselben Kopfzeile eine
  // Fehlermeldung und keine Warnung — der Lauf ist dann gesperrt und nicht nur
  // auffaellig. Die Farbe wechselt damit, die Flaeche bleibt.
  { group: "Anwendung", fg: "--danger-text", bg: "--accent-bg-subtle", min: 4.5, note: "Fehlschlag der Gesamtvorschau in der Exportkopfzeile" },
  { group: "Anwendung", fg: "--text-muted", bg: "--danger-bg-subtle", min: 4.5, note: "technischer Schluessel in der Fehlermeldung" },
  // Die Kontur eines fehlerhaften Feldes ist `--danger-text` und nicht
  // `--danger-border`: Letzteres bleibt unter 3:1 gegen die Kartenflaeche.
  { group: "Anwendung", fg: "--danger-text", bg: "--bg-surface", min: 3, note: "Kontur eines fehlerhaften Feldes, SC 1.4.11" },
  // Das Warnband traegt seinen Zustand ueber Flaeche, Symbol und Text. Seine
  // Umrandung grenzt nur ab und ist fuer die Erkennbarkeit nicht noetig —
  // dieselbe Begruendung wie bei der Zusatzflaeche im Datenordner-Hinweis.
  { group: "Anwendung", fg: "--warning-border", bg: "--bg-surface", min: 0, exempt: true, note: "Umrandung des Warnbands, rein abgrenzend" },
  // T-209 (A-A-45, T-204 9.4): dieselbe Klasse fuer Erfolg und Fehler. Flaeche,
  // Symbol und Text tragen den Zustand, und alle drei sind gemessen. Der Zusatz
  // bei `--danger-border` steht hier, damit ihn der naechste Durchgang nicht
  // "aus Konsistenz" zurueckholt: Die Kontur eines fehlerhaften **Feldes** ist
  // `--danger-text` (Paar drei Zeilen darueber), und die Randschiene von
  // `.quitfail` ist `--danger-bg`. Dieser Token traegt an keiner der beiden
  // Stellen.
  { group: "Anwendung", fg: "--success-border", bg: "--bg-surface", min: 0, exempt: true, note: "Umrandung von Erfolgsband, Chip und Etikett — 1,50 hell, 2,04 dunkel, rein abgrenzend" },
  { group: "Anwendung", fg: "--danger-border", bg: "--bg-surface", min: 0, exempt: true, note: "Umrandung von Fehlerband, Chip und Kachel — 1,66 hell, 1,79 dunkel, rein abgrenzend. Die Kontur eines fehlerhaften Feldes ist --danger-text, die Schiene von .quitfail ist --danger-bg" },
  // Die Kachel "Ueberfaellig" auf dem Dashboard (A-19.4). Ohne Farbe traegt die
  // Randschiene: 4px `--danger-bg` an der Startkante, und keine andere Kachel
  // der Reihe hat eine. Zwei Nahtstellen, beide hier — nach innen gegen die
  // eigene Flaeche, nach aussen gegen den Hintergrund, auf dem die Kacheln
  // stehen. Bauform zeichengleich mit `.shellnote--startup`, deren Schiene
  // dieselbe erste Zahl schon in der Gruppe "Startmeldung" traegt.
  { group: "Anwendung", fg: "--danger-bg", bg: "--danger-bg-subtle", min: 3, note: "Randschiene der Kachel Ueberfaellig gegen ihre eigene Flaeche, SC 1.4.11" },
  { group: "Anwendung", fg: "--danger-bg", bg: "--bg-canvas", min: 3, note: "dieselbe Schiene gegen den Hintergrund, auf dem die Kacheln stehen" },
  // Die Flaeche der Kachel ist eine Verstaerkung und kein Traeger. T-210 hat sie
  // in Graustufen an Pixeln gemessen: 1,01 bis 1,13 gegen jede Nachbarflaeche.
  // Ein besserer Wert loest es nicht (T-213 Abschnitt 10.7).
  // Ihre **Obergrenze** braucht kein eigenes Paar: Sie steht in den drei
  // Textpaaren auf `--danger-bg-subtle` (Gruppen "Startmeldung" und
  // "Anwendung") — wer die Flaeche dunkler macht, faellt dort durch.
  // Die Zahlen im Vermerk sind die dieses Laufs. Die Vorgabe aus T-213 nannte
  // "1,04 hell, 1,11 dunkel"; 1,11 ist der Wert gegen `--bg-surface` im
  // **hellen** Thema (die Gegenprobe aus T-213 Abschnitt 10) und im dunklen
  // Slot verrutscht. Gegen die Leinwand misst der Lauf dunkel 1,15. Beide
  // Zahlen liegen weit unter 3; die Einordnung aendert sich nicht, die Zahl
  // schon — und gerechnet ist nicht gemessen (E-087).
  { group: "Anwendung", fg: "--danger-bg-subtle", bg: "--bg-canvas", min: 0, exempt: true, note: "Flaeche der Kachel Ueberfaellig gegen den Hintergrund — 1,04 hell, 1,15 dunkel; Verstaerkung, getragen wird von der Randschiene" },
  /*
   * Der Doppelring an gefuellten Bedienelementen, nach dem Tausch der beiden
   * Baender (T-216; entschieden in T-213 Abschnitt 10.2, gemessen in T-210
   * Befund B-11).
   *
   * `.on-solid:focus-visible` zeichnet von der Kante des Knopfes nach aussen:
   *   0..2px  `--focus-ring-contrast`  (Schatten, beruehrt die **Fuellung**)
   *   2..4px  `--focus-ring-color`     (Kontur aus `:focus-visible`, beruehrt
   *                                     die **Flaeche**)
   * Drei Nahtstellen, drei Zusagen, alle drei gemessen:
   *   1. Gegenband gegen die Fuellung  -> die zwei Paare hier
   *   2. Gegenband gegen die Kontur    -> das Paar aus T-209, unveraendert
   *   3. Kontur gegen die Flaeche      -> Gruppe "Struktur", seit T-022
   *
   * Bis T-213 lagen die Baender andersherum. Dann beruehrte das Gegenband die
   * Fuellung gar nicht, und im hellen Thema fielen **beide** Baender mit ihrem
   * Nachbarn zusammen: 1,00:1 an beiden Kanten, sichtbar blieb ein Knopf, der
   * beim Tabulieren um 2px waechst (SC 2.4.7, SC 1.4.11).
   *
   * Nicht zurueckdrehen. Fuer die alte Anordnung gibt es im **dunklen** Thema
   * keinen gueltigen Wert: Ein Innenband muesste dort L <= 0,065 haben, um
   * gegen die Fuellungen zu tragen, und L >= 0,133, um als allgemeiner Ring
   * gegen die Flaechen zu tragen. Der Schnitt ist leer (T-213 Abschnitt 10.3).
   *
   * **Die Grenze dieser drei Paare** (E-087): Sie messen Farbe gegen Farbe.
   * Dass die Kontur ueber dem aeusseren Schatten liegt und die Zonen deshalb
   * so uebereinander liegen wie oben, ist eine Eigenschaft der Malreihenfolge
   * der Engine — in Chromium gemessen (T-216), fuer die beiden uebrigen
   * ausgelieferten Engines ungemessen. Malte eine Engine umgekehrt, laege ein
   * einziges 4px-Band in `--focus-ring-contrast` an der Knopfkante: gegen die
   * Fuellung 5,98 bis 7,98 (die zwei Paare hier), gegen die Flaeche 1,00. Auch
   * das ist ein Ring **am** Knopf und nicht ein groesserer Knopf; der Tausch
   * ist auf **beiden** moeglichen Reihenfolgen besser als der Zustand davor.
   */
  { group: "Anwendung", fg: "--focus-ring-contrast", bg: "--accent-bg", min: 3, note: "Gegenband gegen die Fuellung des Primaerknopfes, SC 1.4.11 und SC 2.4.7" },
  { group: "Anwendung", fg: "--focus-ring-contrast", bg: "--danger-bg", min: 3, note: "Gegenband gegen die Fuellung des Gefahrenknopfes, SC 1.4.11 und SC 2.4.7" },
  { group: "Anwendung", fg: "--focus-ring-contrast", bg: "--focus-ring-color", min: 3, note: "Gegenband gegen die aeussere Kontur — die mittlere der drei Nahtstellen, SC 1.4.11" },
  // Der weich gesperrte Knopf (`[aria-disabled="true"]`) behaelt `.on-solid`,
  // verliert aber seine Fuellung an `--bg-disabled`. Dort traegt das Gegenband
  // nicht — und muss es nicht: Getragen wird der Ring an dieser Stelle von der
  // aeusseren Kontur, die gegen dieselbe Flaeche mit min 3 gemessen ist
  // (Gruppe "Struktur"). Ein Band, das auf beiden Seiten haelt, genuegt.
  { group: "Anwendung", fg: "--focus-ring-contrast", bg: "--bg-disabled", min: 0, exempt: true, note: "Gegenband auf dem weich gesperrten Knopf — 1,12 hell, 1,21 dunkel; dort traegt die aeussere Kontur" },
  { group: "Anwendung", fg: "--border-accent", bg: "--bg-surface", min: 3, note: "Kontur eines gewaehlten Bedienelements, SC 1.4.11" },
  { group: "Anwendung", fg: "--text-primary", bg: "--timer-running-bg", min: 4.5, note: "Zeile mit laufendem Timer" },
  { group: "Anwendung", fg: "--timer-running-fg", bg: "--bg-surface", min: 3, note: "Kontur der Zeile mit laufendem Timer, SC 1.4.11" },
  // Die Umrandung der Exportkopfzeile grenzt eine Flaeche ab und kennzeichnet
  // weder ein Bedienelement noch einen Zustand. SC 1.4.11 ist nicht anwendbar.
  { group: "Anwendung", fg: "--accent-border-subtle", bg: "--bg-surface", min: 0, exempt: true, note: "Rahmen der Exportkopfzeile, rein abgrenzend" },

  // Vorlageneditor S-14 (T-031). Vier neue Flaechen: der Bereichsreiter ueber
  // dem Anwendungshintergrund, die Feldzeile auf der Zebra-Flaeche, der
  // Grenzhinweis auf der Vermerk-Flaeche und die JSON-Vorschau in der
  // Vertiefung. Jede Kombination hier gemessen statt behauptet.
  { group: "Vorlagen", fg: "--accent-bg", bg: "--bg-canvas", min: 3, note: "Kontur des aktiven Bereichsreiters, SC 1.4.11" },
  { group: "Vorlagen", fg: "--accent-bg", bg: "--bg-surface-alt", min: 3, note: "Ablegemarke beim Ziehen einer Feldzeile, SC 1.4.11" },
  { group: "Vorlagen", fg: "--border-control", bg: "--bg-surface-alt", min: 3, note: "Eingabefeld in einer Feldzeile, SC 1.4.11" },
  { group: "Vorlagen", fg: "--focus-ring-color", bg: "--bg-surface-alt", min: 3, note: "Fokusring in einer Feldzeile" },
  { group: "Vorlagen", fg: "--danger-text", bg: "--bg-surface-alt", min: 4.5, note: "Fehlertext an einer Feldzeile" },
  { group: "Vorlagen", fg: "--text-secondary", bg: "--note-internal-bg", min: 4.5, note: "Satz zur Notiz-Grenze unter der Quellenauswahl" },
  { group: "Vorlagen", fg: "--note-internal-rail", bg: "--note-internal-bg", min: 3, note: "Randschiene des Grenzhinweises, SC 1.4.11" },
  { group: "Vorlagen", fg: "--text-muted", bg: "--bg-inset", min: 4.5, note: "Herkunft eines Feldes an der JSON-Vorschau" },
  { group: "Vorlagen", fg: "--text-secondary", bg: "--bg-hover", min: 4.5, note: "Tagesgruppe der Vorschau unter dem Zeiger" },
  { group: "Vorlagen", fg: "--text-muted", bg: "--bg-hover", min: 4.5, note: "Zusatz einer Tagesgruppe unter dem Zeiger" },

  // Tag-Baum (T-035, Befund aus T-012). Das Dreieck ist jetzt ein eigenes
  // Zeigerziel mit eigener Zeigerflaeche; sein Symbol traegt den Auf- und
  // Zuklappzustand und faellt damit unter SC 1.4.11.
  { group: "Tag-Baum", fg: "--text-primary", bg: "--bg-active", min: 4.5, note: "Dreieck unter dem Zeiger" },

  /*
   * Aufgeklappte Liste, Tag-Vervollstaendigung und Kontextmenue — T-059.
   *
   * Seit E-052 zeichnet Takt diese Listen selbst, statt sie dem
   * Betriebssystem zu ueberlassen. Was der Browser vorher gestellt hat, faellt
   * damit unter dieselbe Messung wie alles andere.
   */
  { group: "Aufklappliste", fg: "--accent-text", bg: "--bg-selected", min: 4.5, note: "Haken am gewaehlten Eintrag" },
  { group: "Aufklappliste", fg: "--accent-text", bg: "--bg-active", min: 4.5, note: "Haken am gewaehlten Eintrag unter dem Zeiger" },
  { group: "Aufklappliste", fg: "--text-muted", bg: "--bg-active", min: 4.5, note: "Zusatzzeile eines gewaehlten Eintrags unter dem Zeiger" },
  { group: "Aufklappliste", fg: "--text-muted", bg: "--bg-hover", min: 4.5, note: "Zusatzzeile eines Eintrags unter dem Zeiger" },
  { group: "Aufklappliste", fg: "--text-primary", bg: "--bg-surface", min: 4.5, note: "Eintrag in Ruhe" },
  /* Der Punkt vor einem vorhandenen Tag ist ein Zeichen und kein Schmuck: Er
     unterscheidet ihn vom Pluszeichen des neuen. */
  { group: "Aufklappliste", fg: "--text-muted", bg: "--bg-surface", min: 3, note: "Punkt vor einem vorhandenen Tag, SC 1.4.11" },
  /* Gestrichelte Kontur des noch nicht angelegten Tags — sie trennt den
     Zustand „neu" von „vorhanden" und wird auf beiden Untergruenden gemessen,
     auf denen sie vorkommt. */
  { group: "Aufklappliste", fg: "--border-accent", bg: "--bg-surface", min: 3, note: "gestrichelte Kontur eines neuen Tags auf Karte, SC 1.4.11" },
  { group: "Aufklappliste", fg: "--border-accent", bg: "--accent-bg-subtle", min: 3, note: "gestrichelte Kontur eines neuen Tags gegen die eigene Fuellung, SC 1.4.11" },
  { group: "Aufklappliste", fg: "--accent-text", bg: "--accent-bg-subtle", min: 4.5, note: "Wortmarke „neu\" am Chip" },
  { group: "Tag-Baum", fg: "--text-muted", bg: "--bg-surface", min: 3, note: "Dreieck im Ruhezustand, Zustandsanzeige nach SC 1.4.11" },
  { group: "Tag-Baum", fg: "--text-muted", bg: "--bg-selected", min: 3, note: "Dreieck in der ausgewaehlten Zeile" },

  // Rahmen und Fokus
  { group: "Struktur", fg: "--border-subtle", bg: "--bg-surface", min: 0, exempt: true, note: "Trennlinie, rein dekorativ" },
  { group: "Struktur", fg: "--border-default", bg: "--bg-surface", min: 0, exempt: true, note: "Kartenumriss, rein dekorativ" },
  // Exportordner — Auswahl, Befunde, Base64-Hinweis (T-036, Befund S-04).
  // Das Anzeigefeld ist kein Eingabefeld mehr, traegt aber dieselbe Umrandung
  // und muss sie deshalb genauso halten. Der Base64-Satz liegt auf derselben
  // eingelassenen Flaeche und ist Fliesstext, keine Zierde.
  { group: "Exportordner", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "gewaehlter Pfad im Anzeigefeld" },
  { group: "Exportordner", fg: "--border-control", bg: "--bg-surface", min: 3, note: "Randschiene des Pfadfeldes — sie traegt die Abgrenzung, weil die Toenung es im dunklen Modus nicht tut" },
  { group: "Exportordner", fg: "--bg-inset", bg: "--bg-surface", min: 3, exempt: true, note: "Toenung des Pfadfeldes gegen die Karte — hell 1.23:1, dunkel 1.04:1; genau deshalb die Randschiene daneben" },
  { group: "Exportordner", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Base64-Satz neben dem Exportziel" },
  { group: "Exportordner", fg: "--text-muted", bg: "--bg-inset", min: 4.5, note: "Schlosssymbol am Base64-Satz, noch nicht gewaehlt" },
  { group: "Exportordner", fg: "--border-subtle", bg: "--bg-surface", min: 3, exempt: true, note: "Umrandung des Base64-Kastens — reine Zierde, der Satz traegt sich selbst" },
  { group: "Exportordner", fg: "--text-secondary", bg: "--warning-bg", min: 4.5, note: "Beleg unter einem Befund zum Ordner" },
  { group: "Exportordner", fg: "--text-secondary", bg: "--danger-bg-subtle", min: 4.5, note: "Beleg unter einem abgewiesenen Ordner" },
  // Was das Betriebssystem ueber den Ordner belegt hat, und die Grenze dieser
  // Pruefung (T-039). Der Grenzsatz steht auch dann da, wenn nichts gefunden
  // wurde — er darf deshalb weder beruhigend gefaerbt noch leise sein.
  { group: "Exportordner", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Grenze der Ordnerpruefung: was Takt nicht sehen kann" },
  { group: "Exportordner", fg: "--border-strong", bg: "--bg-inset", min: 3, note: "gestrichelte Umrandung dieser Grenze, SC 1.4.11" },
  { group: "Exportordner", fg: "--text-muted", bg: "--warning-bg", min: 4.5, note: "Quellenangabe unter einem belegten Merkmal" },
  { group: "Exportordner", fg: "--text-muted", bg: "--info-bg", min: 4.5, note: "Quellenangabe unter einem belegten Merkmal, ruhiger Fall" },

  // Einstellungsschiene (T-171 Abschnitt 1.2). Faellt der Ansichtskopf weg, ist
  // die Schiene die einzige Flaeche, die den gewaehlten Bereich zeigt, bevor
  // jemand den Kartentitel liest — der aktuelle Eintrag kennzeichnet damit
  // einen Zustand und faellt unter SC 1.4.11.
  //
  // Das Paar ist in beiden Themen zeichengleich mit `--accent-bg` gegen
  // `--accent-bg-subtle`, und es steht trotzdem unter seinem eigenen Namen
  // hier: Eine Zusage, die aus der Gleichheit zweier Tokenwerte folgt, haelt
  // nur so lange wie die Gleichheit.
  { group: "Einstellungsschiene", fg: "--border-accent", bg: "--accent-bg-subtle", min: 3, note: "Kontur des aktuellen Schieneneintrags, SC 1.4.11" },

  // Arbeitsplatz — der Name, unter dem abgerechnet wird, und der Ablageort des
  // Bestandes (C-20, E-042, R-13). Beides sind Werte zum **Nachsehen**: Der
  // Name geht in jede Exportzeile, der Pfad zeigt auf die Datei mit den
  // Kundendaten. Sie liegen auf derselben eingelassenen Flaeche wie der
  // gewaehlte Exportordner und muessen sie deshalb genauso halten. Die
  // Randschiene traegt die Abgrenzung, weil die Toenung im dunklen Modus mit
  // 1.04:1 nichts abgrenzt — hier `--border-strong` statt `--border-control`,
  // weil der Streifen auf der eingelassenen Flaeche liegt und `--border-control`
  // dort im dunklen Modus die 3:1 verfehlt.
  { group: "Arbeitsplatz", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "Benutzername und Datenbankpfad im Anzeigefeld" },
  { group: "Arbeitsplatz", fg: "--border-strong", bg: "--bg-inset", min: 3, note: "Randschiene des Anzeigefeldes und gestrichelte Umrandung des Grenzsatzes, SC 1.4.11" },
  { group: "Arbeitsplatz", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Erlaeuterung und Herkunft des Wertes" },
  { group: "Arbeitsplatz", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Symbol an der Herkunftszeile" },
  // Der Grenzsatz steht auch dann da, wenn nichts gefunden wurde: Zum Bestand
  // belegt der Dienst — anders als zum Exportordner — gar keine Merkmale.
  // "Nichts gefunden" darf deshalb nirgends wie "unbedenklich" aussehen
  // (T-039, hier verschaerft).
  { group: "Arbeitsplatz", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Grenze der Auslegung: was Takt am Ablageort nicht sehen kann" },
  { group: "Arbeitsplatz", fg: "--text-secondary", bg: "--warning-bg", min: 4.5, note: "Handgriff und Beleg unter einem Befund zum Ablageort" },
  { group: "Arbeitsplatz", fg: "--text-muted", bg: "--warning-bg", min: 4.5, note: "worauf ein Befund zielt: Vertraulichkeit, Bestand oder beides" },

  // Exportprotokoll (T-040, Befund C-01). Die Randschiene einer Protokollzeile
  // traegt den Vorgang ein zweites Mal, unabhaengig vom Etikett daneben, und
  // faellt damit unter SC 1.4.11. Die Begruendung liegt auf der eingelassenen
  // Flaeche und ist der Teil, um dessentwillen es das Protokoll gibt.
  { group: "Exportprotokoll", fg: "--status-exported-marker", bg: "--bg-surface", min: 3, note: "Randschiene einer Protokollzeile: exportiert" },
  { group: "Exportprotokoll", fg: "--status-reopened-marker", bg: "--bg-surface", min: 3, note: "Randschiene einer Protokollzeile: zurueckgesetzt" },
  { group: "Exportprotokoll", fg: "--status-notbilled-marker", bg: "--bg-surface", min: 3, note: "Randschiene einer Protokollzeile: nicht abgerechnet" },
  { group: "Exportprotokoll", fg: "--text-primary", bg: "--bg-surface", min: 4.5, note: "Zeitpunkt eines Vorgangs" },
  { group: "Exportprotokoll", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Statuswechsel und Zeitraum der Buchung" },
  { group: "Exportprotokoll", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Dateiname des Laufs und Urheber" },
  { group: "Exportprotokoll", fg: "--text-primary", bg: "--bg-hover", min: 4.5, note: "Protokollzeile unter dem Zeiger" },
  { group: "Exportprotokoll", fg: "--text-muted", bg: "--bg-hover", min: 4.5, note: "Lauf und Urheber unter dem Zeiger" },
  { group: "Exportprotokoll", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "Begruendung eines Zuruecksetzens" },
  { group: "Exportprotokoll", fg: "--text-muted", bg: "--bg-inset", min: 4.5, note: "Hinweis, dass keine Begruendung eingetragen wurde" },
  { group: "Exportprotokoll", fg: "--border-strong", bg: "--bg-inset", min: 3, note: "Randschiene des Begruendungsfeldes" },
  // Die Stelle, an der in S-07 die Exportzeile steht — und was dort steht,
  // wenn es keine gibt (T-040, Befund C-02).
  { group: "Exportprotokoll", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Auskunft anstelle der Exportzeile in S-07" },
  { group: "Exportprotokoll", fg: "--border-strong", bg: "--bg-inset", min: 3, note: "gestrichelte Umrandung dieser Auskunft, SC 1.4.11 — `--border-control` verfehlt hier im dunklen Modus 3:1" },

  /*
   * Bedienelemente — T-056. Seit die Felder eine gemeinsame Huelle haben
   * (`Select`, `.field__input`), traegt die Kontur den Zustand: ruhend
   * `--border-control`, unter dem Zeiger `--border-strong`, fokussiert
   * `--border-accent`. Alle drei sind Zustandsgrenzen nach SC 1.4.11 und
   * werden gegen beide Flaechen gemessen, auf denen ein Feld vorkommt: die
   * Karte und die Werkzeug-/Filterleiste.
   */
  { group: "Bedienelement", fg: "--border-accent", bg: "--bg-surface", min: 3, note: "Kontur des fokussierten Feldes auf der Karte, SC 1.4.11" },
  { group: "Bedienelement", fg: "--border-accent", bg: "--bg-subtle", min: 3, note: "Kontur des fokussierten Feldes in der Filterleiste" },
  { group: "Bedienelement", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Aufklapp-Pfeil im Auswahlfeld" },
  { group: "Bedienelement", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Aufklapp-Pfeil unter dem Zeiger" },
  { group: "Bedienelement", fg: "--text-primary", bg: "--bg-hover", min: 4.5, note: "Text im Auswahlfeld unter dem Zeiger" },

  /*
   * Ziehen und Ablegen im Tag-Baum — T-056, A-4.6. Die zulaessige
   * Ablegestelle traegt zwei Merkmale: getoente Flaeche und gestrichelte
   * Kontur. Die Kontur sagt „hier kann etwas hin" und ist damit ebenfalls
   * eine Zustandsgrenze.
   */
  { group: "Ziehen", fg: "--border-accent", bg: "--accent-bg-subtle", min: 3, note: "gestrichelte Ablegestelle im Baum, SC 1.4.11" },
  { group: "Ziehen", fg: "--accent-text", bg: "--accent-bg-subtle", min: 4.5, note: "Name des Ordners unter dem Zeiger beim Ziehen" },
  { group: "Ziehen", fg: "--border-strong", bg: "--bg-subtle", min: 3, note: "gestrichelter Streifen fuer die Wurzelebene, SC 1.4.11" },
  { group: "Ziehen", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Beschriftung des Wurzelstreifens" },
  { group: "Ziehen", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Hinweis unter dem Baum" },

  { group: "Struktur", fg: "--border-control", bg: "--bg-surface", min: 3, note: "Grenze eines Bedienelements, SC 1.4.11" },
  { group: "Struktur", fg: "--border-control", bg: "--bg-subtle", min: 3, note: "Bedienelement in der Werkzeugleiste" },
  { group: "Struktur", fg: "--border-strong", bg: "--bg-surface", min: 3, note: "Bedienelement unter dem Zeiger" },
  { group: "Struktur", fg: "--focus-ring-color", bg: "--bg-surface", min: 3, note: "Fokusring auf Karte" },
  { group: "Struktur", fg: "--focus-ring-color", bg: "--bg-canvas", min: 3, note: "Fokusring auf Hintergrund" },
  { group: "Struktur", fg: "--focus-ring-color", bg: "--bg-subtle", min: 3, note: "Fokusring in Werkzeugleiste" },

  /* ---------------------------------------------------------------- */
  /* Der nicht-modale Versionshinweis (T-144 U-01, T-147)              */
  /* ---------------------------------------------------------------- */
  { group: "Versionshinweis", fg: "--info-fg", bg: "--info-bg", min: 4.5, note: "Leiste mitten in der Sitzung" },
  { group: "Versionshinweis", fg: "--info-border", bg: "--bg-canvas", min: 1, note: "Trennlinie der Leiste — Zierde, keine Grenze" },

  /* ---------------------------------------------------------------- */
  /* Frist und Anhaenge (Abschnitt 19, T-147)                          */
  /* ---------------------------------------------------------------- */
  //
  // Die drei Zustaende der Frist unterscheiden sich ueber sechs Merkmale, von
  // denen nur eines die Farbe ist (SC 1.4.1). Gemessen wird sie trotzdem: Ein
  // Etikett, das man nicht lesen kann, hilft auch dann niemandem, wenn seine
  // Form stimmt.
  { group: "Frist", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Etikett Ueberfaellig" },
  { group: "Frist", fg: "--danger-text", bg: "--bg-surface", min: 3, note: "Kontur des Etiketts Ueberfaellig, SC 1.4.11" },
  { group: "Frist", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Etikett Heute faellig" },
  { group: "Frist", fg: "--warning-fg", bg: "--bg-surface", min: 3, note: "Kontur des Etiketts Heute faellig, SC 1.4.11" },
  // "Spaeter faellig" traegt keine Flaeche und keinen Rahmen — nur Text auf der
  // Karte beziehungsweise in der Zeile.
  { group: "Frist", fg: "--text-secondary", bg: "--bg-surface", min: 4.5, note: "Datum bei Spaeter faellig, auf der Karte" },
  { group: "Frist", fg: "--text-secondary", bg: "--bg-subtle", min: 4.5, note: "Datum bei Spaeter faellig, in der Kanban-Spalte" },
  // Die Kachel "Ueberfaellig" auf dem Dashboard.
  { group: "Frist", fg: "--text-primary", bg: "--danger-bg-subtle", min: 4.5, note: "Zahl der Kachel Ueberfaellig" },
  { group: "Frist", fg: "--text-muted", bg: "--danger-bg-subtle", min: 4.5, note: "Beschriftung der Kachel Ueberfaellig" },
  // **Kein** Paar fuer den Rahmen der Kachel "Ueberfaellig": Er ist Zierde und
  // keine Grenze im Sinn von SC 1.4.11 — die Aussage der Kachel steht in ihrer
  // Beschriftung und in ihrer Zahl, beide gemessen. Dieselbe Behandlung wie bei
  // `.stat--warning`, das aus demselben Grund nie ein Paar hatte.

  { group: "Anhaenge", fg: "--accent-text", bg: "--bg-surface", min: 4.5, note: "Bezeichnung eines Anhangs in Ruhe" },
  { group: "Anhaenge", fg: "--accent-text", bg: "--bg-subtle", min: 4.5, note: "Bezeichnung eines Anhangs unter dem Zeiger" },
  { group: "Anhaenge", fg: "--text-muted", bg: "--bg-surface", min: 4.5, note: "Voller Wert unter der Bezeichnung" },
  { group: "Anhaenge", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Voller Wert unter dem Zeiger" },
  { group: "Anhaenge", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Der Anhang, der sich nicht oeffnen laesst (A-19.15)" },
  { group: "Anhaenge", fg: "--danger-text", bg: "--bg-surface", min: 3, note: "Kontur derselben Zeile, SC 1.4.11" },
  { group: "Anhaenge", fg: "--border-subtle", bg: "--bg-surface", min: 1, note: "Rahmen des Vorschaubildes — Zierde, keine Grenze" },
  { group: "Anhaenge", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Symbol der Art in der Zeile" },
  // Die Rueckfrage vor dem Oeffnen einer Datei (A-A-6): Der volle Pfad steht in
  // Festbreitenschrift auf der eingelassenen Flaeche und ist die wichtigste
  // Auskunft des Dialogs.
  { group: "Anhaenge", fg: "--text-primary", bg: "--bg-inset", min: 4.5, note: "Dateiname in der Rueckfrage" },
  { group: "Anhaenge", fg: "--text-secondary", bg: "--bg-inset", min: 4.5, note: "Vollstaendiger Pfad in der Rueckfrage" },
  { group: "Anhaenge", fg: "--text-muted", bg: "--bg-inset", min: 4.5, note: "Beschriftungen in der Rueckfrage" },
];

/* ------------------------------------------------------------------ */
/* Ausfuehrung                                                         */
/* ------------------------------------------------------------------ */

const themes = [
  { label: "hell", tokens: lightTokens },
  { label: "dunkel", tokens: darkTokens },
];

/**
 * Misst ein Paar in einem Thema. Abgeschnitten statt gerundet: 4,499 ist nicht
 * 4,5, und ein Lauf, der aufrundet, ist derselbe Fehler wie einer, der die
 * falsche Flaeche nimmt — nur kleiner.
 */
function measure(tokens, pair, where) {
  const bg = backdrop(tokens, pair, where);
  const fg = flatten(parseColor(resolveToken(tokens, pair.fg)), bg);
  return Math.floor(contrastRatio(fg, bg) * 100) / 100;
}

/**
 * Die Rechnung von **vor** T-197: jede teildurchsichtige Farbe ueber
 * `--bg-canvas`, gleichgueltig worauf sie liegt. Sie steht nur noch in den
 * Gegenproben — dort belegt sie, dass `over` einen Unterschied macht und
 * welchen. Im Lauf selbst wird sie nicht mehr benutzt.
 */
function measureOverCanvas(tokens, pair) {
  const canvas = parseColor(resolveToken(tokens, CANVAS));
  const bg = flatten(parseColor(resolveToken(tokens, pair.bg)), canvas);
  const fg = flatten(parseColor(resolveToken(tokens, pair.fg)), bg);
  return Math.floor(contrastRatio(fg, bg) * 100) / 100;
}

/**
 * Prueft ein Paar als **Angabe**, nicht als Messung: Ein `over` an einem
 * deckenden Hintergrund misst nichts und behauptet trotzdem Genauigkeit.
 * Liefert den Befund als Satz oder `null`.
 */
function listComplaint(pair) {
  if (surfaceStack(pair).length === 0) return null;
  const translucent = themes.some(
    (theme) => parseColor(resolveToken(theme.tokens, pair.bg)).a < 1,
  );
  if (translucent) return null;
  return (
    `${pair.fg} auf ${pair.bg} nennt eine Flaeche \`over\`, obwohl ${pair.bg} in beiden ` +
    `Themen deckend ist. Das Feld gehoert nur an teildurchsichtige Hintergruende.`
  );
}

/* ------------------------------------------------------------------ */
/* Vollstaendigkeit — A-A-45                                           */
/* ------------------------------------------------------------------ */

/**
 * Token, die gezeichnet werden und **keine Kontrastfrage stellen**.
 *
 * Die Vollstaendigkeitspruefung nimmt sie von der Forderung "Paar oder benannte
 * Ausnahme" aus — je Eintrag mit dem Grund, warum es ein Paar hier nicht geben
 * **kann**. Ohne diesen Zusatz wird die Liste beim naechsten Durchgang zur
 * Ablage fuer alles, was rot war (T-204 9.5).
 *
 * Sie sind ausdruecklich **kein** `exempt`-Paar: Ein Paar behauptet eine
 * Beziehung zwischen zwei Farben, und die gibt es hier nicht. Bei den drei
 * Schattentoken kaeme dazu, dass `parseColor` an ihnen abbraeche — ein Paar auf
 * einen Schattentoken **stoppt** den Lauf, es lockert ihn nicht.
 */
const noContrastQuestion = [
  ["--shadow-xs", "Schattenkurzschrift, keine Farbe — `parseColor` braeche ab. Ein Schatten hat keinen Vorder- und keinen Hintergrund, sondern eine Richtung und eine Weichzeichnung"],
  ["--shadow-sm", "wie oben, zwei Schatten in einem Wert"],
  ["--shadow-lg", "wie oben, zwei Schatten in einem Wert"],
  ["--bg-scrim", "teildurchsichtig, und was darunter liegt, ist die ganze Anwendung — `over` liesse sich nur raten. Ihre Aufgabe ist ausserdem, Kontrast zu **nehmen**; ein Mindestwert waere die Umkehrung ihres Zwecks"],
];

/** Quellen, in denen eine Farbe gezeichnet werden kann. */
const drawingRoot = resolve(here, "../src");

/**
 * **Der zweite Bezieher derselben Tokendatei** (T-214, O-IT). Das Add-in laedt
 * `@takt/ui-tokens/tokens.css` genauso wie die Oberflaeche
 * (`apps/outlook-addin/src/main.tsx`). Die vierte Richtung unten fragt, ob ein
 * Token ueberhaupt **irgendwo** gezeichnet wird — diese Frage darf nicht an der
 * Grenze eines Pakets haltmachen, sonst verlangt sie die Streichung eines
 * Tokens, das im Add-in eine Flaeche hat. Gelesen wird, nicht geschrieben; die
 * Dateihoheit bleibt, wo sie ist.
 *
 * Die ersten drei Richtungen bleiben ausdruecklich auf `apps/web/src`: Sie
 * fragen nach der **Paarliste dieses Laufs**, und die beschreibt die Flaechen
 * der Oberflaeche, nicht die des Add-ins.
 */
const foreignDrawingRoots = [resolve(here, "../../outlook-addin/src")];

/**
 * Liest den Quellbaum vom **Dateisystem** und nicht aus der Versionsverwaltung
 * (E-087): Eine Datei, die noch in keinem Einchecken steht, zeichnet genauso.
 */
function collectSources(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectSources(full, out);
    else if (/\.(css|ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const sourceFiles = collectSources(drawingRoot);

/** Jedes `var(--x)` aus dem Quellbaum — tokengenau, nicht flaechengenau. */
function drawnIn(files) {
  const found = new Set();
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
      found.add(match[1]);
    }
  }
  return found;
}

/** Was die **Oberflaeche** zeichnet. Grundlage der Richtungen 1 bis 3. */
const drawnTokens = drawnIn(sourceFiles);

/**
 * Was **irgendein** Bezieher von `tokens.css` zeichnet. Grundlage allein der
 * vierten Richtung. Fehlt ein fremder Baum, faellt er still weg — die Frage
 * wird dadurch strenger, nie milder, und ein fehlendes Verzeichnis darf den
 * Kontrastlauf der Oberflaeche nicht abbrechen.
 */
const foreignSourceFiles = foreignDrawingRoots
  .filter((root) => existsSync(root))
  .flatMap((root) => collectSources(root));
const drawnAnywhere = new Set([...drawnTokens, ...drawnIn(foreignSourceFiles)]);

/**
 * Traegt der Wert eines Tokens eine Farbe? Gefragt wird nach dem **aufgeloesten**
 * Wert in beiden Themen: `--row-padding-x: var(--space-3)` ist keine Farbe, auch
 * wenn dort ein `var()` steht, und `--shadow-xs` ist eine, obwohl `parseColor`
 * sie nicht lesen kann.
 */
const COLOUR_IN_VALUE = /#[0-9a-f]{3,8}\b|rgba?\(/i;
function bearsColour(name) {
  return themes.some((theme) => COLOUR_IN_VALUE.test(resolveToken(theme.tokens, name)));
}

const declaredColourTokens = [...lightTokens.keys()].filter(bearsColour);

/**
 * Die **primitive** Ebene: Rohfarben der Rampen. Der Kopf von `tokens.css` sagt
 * ueber sie „Nie direkt in Komponenten verwenden" — sie sind ein Vorrat, aus dem
 * die semantische Ebene schoepft, und dass keine Flaeche sie zeichnet, ist ihr
 * Zweck und kein Befund. Die vierte Richtung nimmt sie deshalb aus.
 *
 * **Das Loch, das diese Ausnahme aufreissen koennte, ist bereits zu:** Zeichnet
 * eine Klasse doch einmal `--takt-rose-500` unmittelbar, faellt sie der ersten
 * Richtung zur Last — die fragt jedes **gezeichnete** Farbtoken nach seinem
 * Nachweis und kennt den Praefix nicht.
 */
const PRIMITIVE_PREFIX = "--takt-";

/** Die semantische Ebene — die, von der die vierte Richtung eine Flaeche verlangt. */
const semanticColourTokens = declaredColourTokens.filter(
  (name) => !name.startsWith(PRIMITIVE_PREFIX),
);

/** Alle Token, die die Paarliste nennt — Vordergrund, Hintergrund und `over`. */
function tokensNamedByPairs(list) {
  const named = new Set();
  for (const pair of list) {
    named.add(pair.fg);
    named.add(pair.bg);
    for (const name of surfaceStack(pair)) named.add(name);
  }
  return named;
}

/**
 * Die Pruefung, in drei Richtungen. Als Funktion mit Argumenten, damit die
 * Gegenproben sie **mit eingesetzter Verletzung** fahren koennen, statt eine
 * zweite Fassung derselben Logik zu bauen.
 */
function completenessComplaints(named, exemptList, declaredList = declaredColourTokens) {
  const complaints = [];
  const withoutQuestion = new Map(exemptList);

  // 1. Gezeichnet, aber von nichts gedeckt. Der Anlassfall von A-A-45.
  for (const name of declaredList) {
    if (!drawnTokens.has(name)) continue;
    if (named.has(name)) {
      if (withoutQuestion.has(name)) {
        complaints.push(
          `${name} steht in der Liste "keine Kontrastfrage" und wird zugleich von einem Paar ` +
            "gemessen. Eines von beidem ist falsch.",
        );
      }
      continue;
    }
    if (withoutQuestion.has(name)) continue;
    complaints.push(
      `${name} wird gezeichnet, aber kein Paar misst es und die Liste "keine Kontrastfrage" ` +
        "nennt es nicht. Beides waere eine Entscheidung; nichts davon ist keine.",
    );
  }

  // 2. Gemessen, aber nicht mehr gezeichnet. Ein Paar auf eine Farbe, die
  //    niemand malt, sieht wie eine Zusage aus und ist keine (O-HI).
  for (const name of named) {
    if (!lightTokens.has(name)) {
      complaints.push(`${name} steht in einem Paar, ist aber in tokens.css nicht deklariert.`);
      continue;
    }
    if (!drawnTokens.has(name)) {
      complaints.push(
        `${name} steht in einem Paar, aber keine Klasse und keine Komponente zeichnet es. ` +
          "Das Paar misst eine Nachbarschaft, die es nicht gibt.",
      );
    }
  }

  // 3. Eine Ausnahme, deren Gegenstand fehlt. Sie faellt mit ihm.
  for (const [name] of exemptList) {
    if (!lightTokens.has(name)) {
      complaints.push(
        `${name} steht in der Liste "keine Kontrastfrage", ist aber in tokens.css nicht deklariert.`,
      );
    } else if (!drawnTokens.has(name)) {
      complaints.push(
        `${name} steht in der Liste "keine Kontrastfrage", wird aber nirgends mehr gezeichnet — ` +
          "die Ausnahme ist gegenstandslos.",
      );
    }
  }

  // 4. Deklariert und ungezeichnet — ein totes Token (T-214, O-IT; die Frage
  //    stammt aus T-209, offene Frage 1). Die ersten drei Richtungen messen die
  //    Paarliste gegen den Bestand. Diese misst den **Bestand gegen sich
  //    selbst**: Ein Wert, den keine Flaeche traegt, ist kein Vorrat, sondern
  //    eine Zusage ueber eine Gestalt, die es nicht gibt — und die naechste
  //    Aenderung pflegt ihn mit, ohne dass jemand sie sieht.
  //
  //    Absichtlich **ohne Ausnahmeliste.** Eine Ausnahme hiesse "wir behalten
  //    einen Wert fuer einen Fall, den es nicht gibt", und genau das ist der
  //    Zustand, den diese Richtung beenden soll. Wer eine Flaeche baut,
  //    deklariert das Token dann — eine Zeile, mit einem gemessenen Wert.
  for (const name of declaredList) {
    if (name.startsWith(PRIMITIVE_PREFIX)) continue;
    if (drawnAnywhere.has(name)) continue;
    complaints.push(
      `${name} ist in tokens.css deklariert und traegt eine Farbe, aber keine Flaeche zeichnet ` +
        "es — weder in der Oberflaeche noch im Add-in. Entweder bekommt es eine Flaeche oder " +
        "es faellt.",
    );
  }

  return complaints;
}

const pairTokens = tokensNamedByPairs(pairs);
const completeness = completenessComplaints(pairTokens, noContrastQuestion);
const drawnColourTokens = declaredColourTokens.filter((name) => drawnTokens.has(name));

const asMarkdown = process.argv.includes("--markdown");
let failures = 0;
const lines = [];

try {
  for (const pair of pairs) {
    const complaint = listComplaint(pair);
    if (complaint !== null) throw new Error(`Paarliste: ${complaint}`);
  }

  for (const theme of themes) {
    lines.push(
      asMarkdown
        ? `\n### Modus ${theme.label}\n\n| Gruppe | Vordergrund | Hintergrund | Verhaeltnis | Mindestwert | Ergebnis | Bedeutung |\n| --- | --- | --- | ---: | ---: | --- | --- |`
        : `\n== Modus ${theme.label} ==`,
    );
    for (const pair of pairs) {
      const rounded = measure(
        theme.tokens,
        pair,
        `Modus ${theme.label}, ${pair.fg} auf ${pair.bg}`,
      );
      const ok = pair.exempt === true || rounded >= pair.min;
      if (!ok) failures += 1;
      const verdict = pair.exempt === true ? "ausgenommen" : ok ? "bestanden" : "**DURCHGEFALLEN**";
      const requirement = pair.exempt === true ? "—" : `${pair.min.toFixed(1)}:1`;
      const surface = surfaceStack(pair).length === 0 ? "" : ` ueber ${surfaceStack(pair).join(" ueber ")}`;
      lines.push(
        asMarkdown
          ? `| ${pair.group} | \`${pair.fg}\` | \`${pair.bg}\`${surface === "" ? "" : ` ueber \`${surfaceStack(pair).join("` ueber `")}\``} | ${rounded.toFixed(2)}:1 | ${requirement} | ${verdict} | ${pair.note} |`
          : `${pair.exempt === true ? "----" : ok ? "OK  " : "FEHL"} ${rounded.toFixed(2).padStart(6)}:1 (min ${requirement})  ${pair.fg} auf ${pair.bg}${surface}  — ${pair.note}`,
      );
    }
  }
} catch (error) {
  console.error(`\nDer Lauf bricht ab: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

lines.push(
  asMarkdown
    ? "\n### Vollstaendigkeit (A-A-45)\n\n| Ergebnis | Befund |\n| --- | --- |"
    : "\n== Vollstaendigkeit (A-A-45) — jedes gezeichnete Farbtoken hat einen Nachweis ==",
);
if (completeness.length === 0) {
  const covered = drawnColourTokens.filter((name) => pairTokens.has(name)).length;
  const detail =
    `${drawnColourTokens.length} gezeichnete Farbtoken: ${covered} von Paaren gemessen, ` +
    `${noContrastQuestion.length} ohne Kontrastfrage benannt, 0 ohne Nachweis ` +
    `(gelesen aus ${sourceFiles.length} Dateien unter apps/web/src)`;
  const alive =
    `${semanticColourTokens.length} semantische Farbtoken deklariert, 0 ungezeichnet ` +
    `(Vorrat der Rampen ausgenommen: ${declaredColourTokens.length - semanticColourTokens.length} primitive; ` +
    `mitgelesen: ${foreignSourceFiles.length} Dateien unter apps/outlook-addin/src)`;
  lines.push(asMarkdown ? `| bestanden | ${detail} |` : `OK   ${detail}`);
  lines.push(asMarkdown ? `| bestanden | ${alive} |` : `OK   ${alive}`);
} else {
  for (const complaint of completeness) {
    lines.push(asMarkdown ? `| **DURCHGEFALLEN** | ${complaint} |` : `FEHL ${complaint}`);
  }
}

/* ------------------------------------------------------------------ */
/* Gegenproben — der Lauf gegen eine eingesetzte Verletzung            */
/* ------------------------------------------------------------------ */

/*
 * Ein Waechter, der nie rot war, ist eine Behauptung ueber einen Waechter — die
 * Form ist von `proof:surface` uebernommen. Hier misst sie die eine Zusage, die
 * dieser Lauf seit T-197 neu gibt: **Teildurchsichtige Farben werden ueber die
 * Flaeche gerechnet, auf der sie liegen.**
 *
 * Die eingesetzte Verletzung ist die naheliegendste, die es gibt: jemand macht
 * die Schraffur des Etiketts kraeftiger, damit sie besser zu sehen ist, und
 * verschlechtert damit die Beschriftung darauf. Im dunklen Thema liegt das
 * Fenster, in dem die alte Rechnung noch gruen gewesen waere und die richtige
 * bereits rot ist, zwischen Deckung 0,24 und 0,30. Gemessen wird bei 0,28.
 */

const probes = [];

/** Fuehrt eine Gegenprobe aus und haelt ihr Ergebnis fest. */
function probe(title, body) {
  try {
    const detail = body();
    probes.push({ ok: true, title, detail: detail ?? "" });
  } catch (error) {
    probes.push({
      ok: false,
      title,
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Wirft, wenn die Bedingung nicht haelt. Kein Testrahmen, nur ein Satz. */
function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const capPair = pairs.find(
  (pair) => pair.fg === "--status-reopened-fg" && pair.bg === "--status-reopened-hatch",
);
if (capPair === undefined) {
  console.error(
    "\nDer Lauf bricht ab: Das Deckelpaar der Schraffur fehlt in der Liste — " +
      "die Gegenproben messen dann nichts.",
  );
  process.exit(1);
}

/** Das dunkle Thema mit einer kraeftigeren Schraffur. Nur fuer die Gegenproben. */
const stronger = new Map(darkTokens);
stronger.set("--status-reopened-hatch", "rgba(238, 141, 135, 0.28)");

probe("die kraeftigere Schraffur macht das Deckelpaar rot", () => {
  const value = measure(stronger, capPair, "Gegenprobe");
  expect(
    value < capPair.min,
    `die eingesetzte Verletzung wird mit ${value.toFixed(2)}:1 gemessen und bleibt damit ueber ${capPair.min.toFixed(1)}:1`,
  );
  return `${value.toFixed(2)}:1 gegen die Etikettflaeche, gefordert ${capPair.min.toFixed(1)}:1`;
});

probe("dieselbe Verletzung waere ueber der Leinwand gruen geblieben", () => {
  const value = measureOverCanvas(stronger, capPair);
  expect(
    value >= capPair.min,
    `die alte Rechnung nennt ${value.toFixed(2)}:1 und waere ebenfalls rot geworden — ` +
      "die Gegenprobe misst dann nicht mehr, wofuer sie da ist",
  );
  return `${value.toFixed(2)}:1 ueber \`${CANVAS}\` — die Zahl, die dieser Lauf bis T-197 genannt haette`;
});

probe("auch ohne Verletzung gehen beide Rechnungen auseinander", () => {
  for (const theme of themes) {
    const real = measure(theme.tokens, capPair, "Gegenprobe");
    const naive = measureOverCanvas(theme.tokens, capPair);
    expect(
      real < naive,
      `im Modus ${theme.label} nennt die alte Rechnung ${naive.toFixed(2)}:1 und die richtige ` +
        `${real.toFixed(2)}:1 — \`over\` waere dort Zierde`,
    );
  }
  const delta = themes.map((theme) => {
    const real = measure(theme.tokens, capPair, "Gegenprobe");
    return `${theme.label} ${(measureOverCanvas(theme.tokens, capPair) - real).toFixed(2)}`;
  });
  return `zu guenstig um ${delta.join(", ")}`;
});

probe("ein teildurchsichtiger Hintergrund ohne `over` bricht den Lauf ab", () => {
  let thrown = null;
  try {
    measure(darkTokens, { ...capPair, over: undefined }, "Gegenprobe");
  } catch (error) {
    thrown = error;
  }
  expect(thrown !== null, "der Lauf hat die fehlende Flaeche hingenommen");
  return "abgebrochen statt ueber die Leinwand geflaecht";
});

probe("eine Kette, die nicht deckend endet, bricht den Lauf ab", () => {
  let thrown = null;
  try {
    measure(
      darkTokens,
      { ...capPair, over: ["--status-reopened-hatch"] },
      "Gegenprobe",
    );
  } catch (error) {
    thrown = error;
  }
  expect(thrown !== null, "der Lauf hat eine teildurchsichtige Grundflaeche hingenommen");
  return "abgebrochen statt zweimal dieselbe Farbe zu flaechen";
});

probe("`over` an einem deckenden Hintergrund wird abgewiesen", () => {
  const complaint = listComplaint({
    group: "Gegenprobe",
    fg: "--text-primary",
    bg: "--bg-surface",
    over: CANVAS,
    min: 4.5,
    note: "erfunden",
  });
  expect(complaint !== null, "die Paarliste nimmt ein wirkungsloses `over` hin");
  expect(
    listComplaint(capPair) === null,
    "die Paarliste beanstandet das richtige `over` des Deckelpaares",
  );
  return "beide Richtungen: das wirkungslose wird gemeldet, das richtige nicht";
});

/*
 * Drei Gegenproben zur Vollstaendigkeit (A-A-45). Ein Waechter, der nie rot
 * war, ist eine Behauptung ueber einen Waechter — und dieser hier ist am Tag
 * seiner Einfuehrung gruen, weil in derselben Aenderung elf Zeilen dazukamen.
 * Ohne eingesetzte Verletzung waere nicht zu unterscheiden, ob er misst oder
 * schweigt. Gefahren wird jede der drei Richtungen einzeln.
 */

probe("ein gezeichnetes Farbtoken ohne Paar macht den Lauf rot", () => {
  const victim = "--danger-bg-hover";
  expect(pairTokens.has(victim), `${victim} steht nicht mehr in der Paarliste — die Gegenprobe misst nichts`);
  const without = new Set(pairTokens);
  without.delete(victim);
  const found = completenessComplaints(without, noContrastQuestion);
  expect(
    found.some((line) => line.startsWith(`${victim} wird gezeichnet`)),
    `die Pruefung hat ${victim} ohne Paar hingenommen`,
  );
  return `${victim} als unbelegt gemeldet, ${found.length} Befund insgesamt`;
});

probe("ein Paar auf eine Farbe, die niemand zeichnet, macht den Lauf rot", () => {
  const ghost = "--takt-neutral-500";
  expect(lightTokens.has(ghost), `${ghost} ist nicht deklariert — die Gegenprobe misst nichts`);
  expect(!drawnTokens.has(ghost), `${ghost} wird inzwischen gezeichnet — die Gegenprobe braucht eine unbenutzte Farbe`);
  const invented = new Set(pairTokens);
  invented.add(ghost);
  const found = completenessComplaints(invented, noContrastQuestion);
  expect(
    found.some((line) => line.startsWith(`${ghost} steht in einem Paar`)),
    "die Pruefung hat ein Paar auf eine ungezeichnete Farbe hingenommen",
  );
  return `${ghost} als gemessene Nichtflaeche gemeldet — die Richtung, die O-HI meint`;
});

probe("die Liste `keine Kontrastfrage` wird in beide Richtungen geprueft", () => {
  const ghost = "--takt-neutral-500";
  const stale = completenessComplaints(pairTokens, [...noContrastQuestion, [ghost, "erfunden"]]);
  expect(
    stale.some((line) => line.includes("die Ausnahme ist gegenstandslos")),
    "eine Ausnahme ohne Gegenstand bleibt unbemerkt in der Liste stehen",
  );
  const doubled = completenessComplaints(pairTokens, [
    ...noContrastQuestion,
    ["--accent-bg", "erfunden"],
  ]);
  expect(
    doubled.some((line) => line.includes("und wird zugleich von einem Paar")),
    "ein Token darf zugleich gemessen und von der Messung ausgenommen sein",
  );
  expect(
    completenessComplaints(pairTokens, noContrastQuestion).length === 0,
    "der Bestand selbst ist unvollstaendig — dann misst diese Gegenprobe nicht mehr, wofuer sie da ist",
  );
  return "gegenstandslose Ausnahme und doppelte Deckung, beide gemeldet";
});

/*
 * Die vierte Richtung (T-214, O-IT). Zwei Gegenproben, weil zwei Dinge zu
 * zeigen sind: dass ein totes Token auffaellt — und dass die Ausnahme fuer die
 * primitive Ebene die Richtung nicht insgesamt stumm stellt.
 */

probe("ein deklariertes, nirgends gezeichnetes Farbtoken macht den Lauf rot", () => {
  const ghost = "--erfundener-toter-farbwert";
  expect(!drawnAnywhere.has(ghost), `${ghost} wird gezeichnet — die Gegenprobe braucht einen Namen ohne Flaeche`);
  expect(
    completenessComplaints(pairTokens, noContrastQuestion).length === 0,
    "der Bestand selbst ist unvollstaendig — dann misst diese Gegenprobe nicht mehr, wofuer sie da ist",
  );
  const found = completenessComplaints(pairTokens, noContrastQuestion, [
    ...declaredColourTokens,
    ghost,
  ]);
  expect(
    found.length === 1 && found[0].startsWith(`${ghost} ist in tokens.css deklariert`),
    "die Pruefung hat ein totes Farbtoken hingenommen",
  );
  return `${ghost} als totes Token gemeldet, und nur dieses`;
});

probe("die Ausnahme der primitiven Ebene stellt die vierte Richtung nicht stumm", () => {
  const primitive = "--takt-neutral-500";
  expect(lightTokens.has(primitive), `${primitive} ist nicht deklariert — die Gegenprobe misst nichts`);
  expect(!drawnAnywhere.has(primitive), `${primitive} wird gezeichnet — dann greift die erste Richtung, nicht diese`);
  expect(
    completenessComplaints(pairTokens, noContrastQuestion).length === 0,
    "die primitive Ebene wird als tot gemeldet — die Ausnahme greift nicht",
  );
  const renamed = `${primitive.replace(PRIMITIVE_PREFIX, "--semantisch-")}`;
  const found = completenessComplaints(pairTokens, noContrastQuestion, [
    ...declaredColourTokens,
    renamed,
  ]);
  expect(
    found.some((line) => line.startsWith(renamed)),
    "derselbe ungezeichnete Wert bleibt auch ohne Rampenpraefix stumm — die Ausnahme greift zu weit",
  );
  return "die Rampe schweigt, derselbe Wert ohne Praefix meldet sich";
});

const probeFailures = probes.filter((entry) => !entry.ok).length;

lines.push(
  asMarkdown
    ? "\n### Gegenproben\n\n| Ergebnis | Gegenprobe | Messung |\n| --- | --- | --- |"
    : "\n== Gegenproben — der Lauf gegen eine eingesetzte Verletzung ==",
);
for (const entry of probes) {
  lines.push(
    asMarkdown
      ? `| ${entry.ok ? "bestanden" : "**DURCHGEFALLEN**"} | ${entry.title} | ${entry.detail} |`
      : `${entry.ok ? "OK  " : "FEHL"} ${entry.title}${entry.detail === "" ? "" : ` — ${entry.detail}`}`,
  );
}

/* ------------------------------------------------------------------ */
/* Schlusszeile                                                        */
/* ------------------------------------------------------------------ */

const measurements = pairs.length * themes.length;
const withSurface = pairs.filter((pair) => surfaceStack(pair).length > 0).length;

console.log(lines.join("\n"));
console.log(
  asMarkdown
    ? `\n${failures === 0 ? `Alle ${measurements} Paare bestanden.` : `${failures} Paare durchgefallen.`} ` +
        `${pairs.length} Paare, davon ${withSurface} mit benannter Flaeche (\`over\`). ` +
        `${completeness.length} Befunde zur Vollstaendigkeit bei ${drawnColourTokens.length} ` +
        `gezeichneten und ${semanticColourTokens.length} semantisch deklarierten Farbtoken. ` +
        `${probes.length} Gegenproben, davon ${probeFailures} durchgefallen.`
    : `\n${failures} von ${measurements} Paaren durchgefallen.` +
        `\n${pairs.length} Paare, davon ${withSurface} mit benannter Flaeche (over).` +
        `\n${completeness.length} Befunde zur Vollstaendigkeit bei ${drawnColourTokens.length} ` +
        `gezeichneten und ${semanticColourTokens.length} semantisch deklarierten Farbtoken.` +
        `\n${probes.length - probeFailures} von ${probes.length} Gegenproben bestanden.`,
);
process.exit(failures === 0 && completeness.length === 0 && probeFailures === 0 ? 0 : 1);
