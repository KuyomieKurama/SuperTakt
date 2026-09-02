/**
 * Kontrastpruefung fuer die Design-Token von Takt.
 *
 * Liest `packages/ui-tokens/tokens.css`, loest die dort deklarierten Farbwerte
 * auf und misst die Kontrastverhaeltnisse nach WCAG 2.1/2.2 fuer eine feste Liste
 * von Paaren. Die Werte im Designsystem sind damit gemessen und nicht behauptet.
 *
 * Aufruf:  node scripts/contrast-check.mjs
 *          node scripts/contrast-check.mjs --markdown
 *
 * Beendet sich mit Code 1, sobald ein Paar seine Mindestanforderung verfehlt.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
  { group: "Aktion", fg: "--danger-text", bg: "--danger-bg-subtle", min: 4.5, note: "Fehlertext im Hinweis" },
  { group: "Aktion", fg: "--danger-text", bg: "--bg-surface", min: 4.5, note: "Fehlertext am Feld" },

  // Exportstatus
  { group: "Exportstatus", fg: "--status-open-fg", bg: "--status-open-bg", min: 4.5, note: "Etikett Offen" },
  { group: "Exportstatus", fg: "--status-open-border", bg: "--bg-surface", min: 3, note: "Kontur Offen, SC 1.4.11" },
  { group: "Exportstatus", fg: "--status-open-marker", bg: "--bg-surface", min: 3, note: "Zeilenmarker Offen" },
  { group: "Exportstatus", fg: "--status-exported-fg", bg: "--status-exported-bg", min: 4.5, note: "Etikett Exportiert" },
  { group: "Exportstatus", fg: "--status-exported-bg", bg: "--bg-surface", min: 3, note: "Flaeche Exportiert gegen Karte" },
  { group: "Exportstatus", fg: "--status-exported-marker", bg: "--status-exported-tint", min: 3, note: "Marker auf getoenter Zeile" },
  { group: "Exportstatus", fg: "--text-primary", bg: "--status-exported-tint", min: 4.5, note: "Zeilentext auf getoenter Zeile" },
  { group: "Exportstatus", fg: "--status-reopened-fg", bg: "--status-reopened-bg", min: 4.5, note: "Etikett Erneut offen" },
  { group: "Exportstatus", fg: "--status-reopened-border", bg: "--bg-surface", min: 3, note: "Kontur Erneut offen" },
  { group: "Exportstatus", fg: "--status-reopened-marker", bg: "--bg-surface", min: 3, note: "Zeilenmarker Erneut offen" },
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
  { group: "Timer", fg: "--text-muted", bg: "--bg-subtle", min: 4.5, note: "Timerleiste im Ruhezustand" },

  // Hinweise
  { group: "Hinweis", fg: "--info-fg", bg: "--info-bg", min: 4.5, note: "Information" },
  { group: "Hinweis", fg: "--success-fg", bg: "--success-bg", min: 4.5, note: "Erfolg" },
  { group: "Hinweis", fg: "--warning-fg", bg: "--warning-bg", min: 4.5, note: "Warnung" },

  // Vermerk und Leistung (E-016)
  { group: "Feldart", fg: "--note-billing-header-fg", bg: "--note-billing-header-bg", min: 4.5, note: "Kopfband Leistung" },
  { group: "Feldart", fg: "--note-billing-rail", bg: "--bg-surface", min: 3, note: "Randschiene Leistung, heller Streifen" },
  { group: "Feldart", fg: "--note-billing-rail-stripe", bg: "--bg-surface", min: 3, note: "Randschiene Leistung, dunkler Streifen" },
  { group: "Feldart", fg: "--note-internal-header-fg", bg: "--note-internal-header-bg", min: 4.5, note: "Kopfband Vermerk" },
  { group: "Feldart", fg: "--note-internal-rail", bg: "--bg-surface", min: 3, note: "Randschiene Vermerk" },
  { group: "Feldart", fg: "--text-primary", bg: "--note-internal-bg", min: 4.5, note: "Text im Vermerkfeld" },
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
  { group: "Erledigt", fg: "--text-muted", bg: "--timer-running-bg", min: 4.5, note: "Fussnote im Wiederaufnahme-Hinweis" },

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
];

/* ------------------------------------------------------------------ */
/* Ausfuehrung                                                         */
/* ------------------------------------------------------------------ */

const themes = [
  { label: "hell", tokens: lightTokens, base: "--bg-surface" },
  { label: "dunkel", tokens: darkTokens, base: "--bg-surface" },
];

const asMarkdown = process.argv.includes("--markdown");
let failures = 0;
const lines = [];

for (const theme of themes) {
  const canvas = parseColor(resolveToken(theme.tokens, "--bg-canvas"));
  lines.push(
    asMarkdown
      ? `\n### Modus ${theme.label}\n\n| Gruppe | Vordergrund | Hintergrund | Verhaeltnis | Mindestwert | Ergebnis | Bedeutung |\n| --- | --- | --- | ---: | ---: | --- | --- |`
      : `\n== Modus ${theme.label} ==`,
  );
  for (const pair of pairs) {
    const bgRaw = parseColor(resolveToken(theme.tokens, pair.bg));
    const bg = flatten(bgRaw, canvas);
    const fg = flatten(parseColor(resolveToken(theme.tokens, pair.fg)), bg);
    const ratio = contrastRatio(fg, bg);
    const rounded = Math.floor(ratio * 100) / 100;
    const ok = pair.exempt === true || rounded >= pair.min;
    if (!ok) failures += 1;
    const verdict = pair.exempt === true ? "ausgenommen" : ok ? "bestanden" : "**DURCHGEFALLEN**";
    const requirement = pair.exempt === true ? "—" : `${pair.min.toFixed(1)}:1`;
    lines.push(
      asMarkdown
        ? `| ${pair.group} | \`${pair.fg}\` | \`${pair.bg}\` | ${rounded.toFixed(2)}:1 | ${requirement} | ${verdict} | ${pair.note} |`
        : `${pair.exempt === true ? "----" : ok ? "OK  " : "FEHL"} ${rounded.toFixed(2).padStart(6)}:1 (min ${requirement})  ${pair.fg} auf ${pair.bg}  — ${pair.note}`,
    );
  }
}

console.log(lines.join("\n"));
console.log(
  asMarkdown
    ? `\n${failures === 0 ? `Alle ${pairs.length * themes.length} Paare bestanden.` : `${failures} Paare durchgefallen.`}`
    : `\n${failures} von ${pairs.length * themes.length} Paaren durchgefallen.`,
);
process.exit(failures === 0 ? 0 : 1);
