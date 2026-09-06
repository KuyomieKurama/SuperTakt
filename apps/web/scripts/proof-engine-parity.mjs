/**
 * Takt — der Nachweis, dass beide ausgelieferten Engine-Familien dieselben
 * Fokusbaender und dieselben Schienenformen zeichnen (T-232).
 *
 * Aufruf:  pnpm --filter @takt/web proof:engines
 *          pnpm --filter @takt/web proof:engines --keep=/tmp/takt-engines
 *          pnpm --filter @takt/web proof:engines --kein-uebersprung
 *
 * ===========================================================================
 * Die Grenzen dieses Laufs — zuerst, nicht im Bericht
 * ===========================================================================
 *
 * Wer den Lauf gruen sieht, soll im selben Atemzug wissen, was er **nicht**
 * gesehen hat. Sechs Saetze, und keiner davon ist eine Formalie:
 *
 *  0. **Die sechste Grenze ist abschaltbar, und sie steht deshalb zuerst:
 *     Dieser Lauf darf ueberspringen.** Fehlt eine Voraussetzung, misst er
 *     weniger oder nichts und geht trotzdem mit Code 0 hinaus. Das ist die
 *     Bauform, vor der E-094 Punkt 3 warnt — „0 durchgesehen darf nie `ok`
 *     sein" —, und sie ist hier nur deshalb vertretbar, weil der Lauf
 *     **freiwillig** gefahren wird und im selben Atemzug sagt, was ungemessen
 *     blieb (E-095 Punkt 2).
 *
 *     Wo die Umgebung feststeht, ist sie es nicht. Dafuer gibt es
 *     **`--kein-uebersprung`**: Damit wird **jeder** Uebersprung zu Code 1 —
 *     der vollstaendige (Abschnitt 2, „UEBERSPRUNGEN") und der **teilweise**
 *     (Abschnitt 7, „Teilweise uebersprungen"; eine fehlende von zwei Engines
 *     ist ein Uebersprung, und gerade der teilweise ist der, den niemand
 *     sieht). Der Schalter aendert an der Ausgabe **eine** Zeile — die letzte,
 *     die das Urteil nennt. Der Uebersprungtext selbst bleibt zeichengleich,
 *     damit die Pruefstrecke am **Ausgangscode** haengt und nicht am Wortlaut:
 *     Eine Textsuche waere beim ersten umformulierten Satz still blind
 *     (E-095 Punkt 3). Deshalb steckt der Schalter im Lauf.
 *
 *     Die vier Voraussetzungen, die eine Pruefstrecke vorher einrichten muss,
 *     stehen bei {@link VORAUSSETZUNGEN}.
 *
 *  1. **Gemessen wird die Engine-Familie, nicht die gebaute Binaerdatei.**
 *     Dieser Lauf fragt das System-WebKitGTK ueber `WebKit2 4.1` — dieselbe
 *     Bibliothek, mit der die Tauri-Huelle unter Linux zeichnet, aber
 *     geladen von einem Python-Prozess und nicht von Takt. Was die Huelle
 *     zusaetzlich tut (ihre CSP, ihre Einstellungen am Webview, ihre
 *     Fensterdekoration), steht hier ungemessen. Fuer die Frage nach der
 *     Malreihenfolge von Umrandung und Schatten ist das die richtige Ebene:
 *     Sie haengt an der Engine und nicht am Wirt. Fuer jede andere Frage
 *     waere es zu wenig, und deshalb steht dieser Satz hier (P-6).
 *  2. **macOS und WKWebView bleiben ungemessen.** Das dritte ausgelieferte
 *     Erzeugnis zeichnet mit einer Engine, die auf diesem Rechner nicht
 *     existiert. Dieser Lauf verkleinert die Luecke aus T-207 von zwei
 *     ungemessenen Erzeugnissen auf eines. Er schliesst sie nicht (P-6).
 *  3. **Der Strichrhythmus ist engine-abhaengig, die Strichform nicht.**
 *     WebKitGTK und Chromium teilen dieselbe unterbrochene Kante verschieden
 *     auf — drei Striche gegen vier, die bemalte Laenge 18 Prozent
 *     auseinander, und beide sind richtig. Dieser Lauf misst deshalb die
 *     **Form** und niemals eine feste Strichzahl, eine Strichlaenge, die
 *     bemalte Laenge oder ein hinterlegtes Bild (P-3). Wer ihn auf gleiche
 *     Strichzahl festnagelt, baut einen falschen Alarm, der beim ersten
 *     Engine-Wechsel abgeschaltet wird — und danach misst er nichts mehr.
 *  4. **Die Ausloesung von `:focus-visible` steht nicht zur Debatte.** Die
 *     Vorrichtung legt die zwei Fokusregeln zeichengleich auf gewoehnliche
 *     Klassen. Gemessen wird, was gemalt wird und in welcher Reihenfolge —
 *     nicht, wann eine Engine den Zustand vergibt. Begruendung in
 *     `engine-parity/fixture.mjs`.
 *  5. **Die Chromium-Schranke ist ein Aufschlag auf eine ungemessene Engine,
 *     keine Aussage ueber WebKitGTK.** Sie kommt aus P-4 in der Fassung nach
 *     T-236: Faehrt der Lauf **nur** Chromium, gilt dort `>= 4 / >= 3`, weil
 *     eine 4 in Chromium eine zu **kurze** Schiene abfaengt — mehr ist ein
 *     reiner Chromium-Lauf nicht imstande zu sehen. Misst er WebKitGTK
 *     unmittelbar, gilt dort die Grundschranke aus P-1 (`>= 3 / >= 2`), und
 *     der Zuschlag behaelt seinen Adressaten trotzdem.
 *
 *     **Die alte Begruendung — das Verhaeltnis „3 zu 4" — ist widerlegt**, und
 *     zwar von diesem Lauf selbst: Er misst an derselben Flaeche **3 gegen 7**
 *     (WebKitGTK 3 Striche auf 56 px, Chromium 7 auf 73 px, siehe Abschnitt 5
 *     der Ausgabe). Mit ihr ist die Faustformel fuer die Strichzahl
 *     zurueckgenommen; an ihre Stelle tritt ein **gemessenes Band** von 41 px
 *     bis rund 217 px bei 4 px Rahmen. Ausserhalb dieses Bandes heisst das
 *     Ergebnis **„ungemessen", nicht „durchgefallen"** — dieselbe
 *     Unterscheidung, die Grenze 2 hier fuer WKWebView schon fuehrt.
 *
 *     Dass WebKitGTK **genau auf** seiner Schranke liegt und keine Luft hat,
 *     ist kein Mangel der Vorrichtung, sondern P-7: Laenge kauft dort keine
 *     Striche. Wird der Lauf eines Tages deshalb rot, ist die Antwort weder
 *     eine hoehere Vorrichtung noch eine niedrigere Schranke, sondern ein
 *     zweites Merkmal an der Flaeche — entschieden in
 *     `docs/design/traeger-und-zusage.md` 2.8 (P-1 bis P-7) und nicht hier.
 *
 * ===========================================================================
 * Warum es diesen Lauf gibt
 * ===========================================================================
 *
 * Seit T-207 stand im Bedrohungsmodell und auf dem Board: von drei
 * ausgelieferten Erzeugnissen sind zwei in ihrer Engine ungemessen. Der Grund
 * war richtig — Playwrights WebKit ist ein festgeschriebener Oberbau und nicht
 * das System-WebKitGTK der Huelle, und Playwright hat fuer Tauris Webview
 * keinen Anknuepfungspunkt (T-B08). Uebersehen war nur, dass `Xvfb` und
 * `python3-gi` mit `WebKit2 4.1` denselben Unterbau ohne Tauri erreichbar
 * machen.
 *
 * Der Gegenstand ist nicht beliebig. An der Malreihenfolge von Umrandung und
 * aeusserem Schatten haengt der Tausch aus T-216: Das Gegenband liegt innen
 * und beruehrt die Fuellung, die Umrandung liegt aussen und beruehrt die
 * Flaeche. Wuerde eine Engine den Schatten **ueber** die Umrandung malen,
 * verschwaende der aeussere Ring, und der Fokus auf dem meistgenutzten
 * Knopftyp waere wieder das, was T-210 gemessen hatte: 1,00:1 (SC 2.4.7).
 * Dieselbe Sorte Frage stellt sich fuer die zwei Schienen aus T-202: Die
 * **Form** — durchgezogen gegen unterbrochen — ist das Merkmal, das in
 * Graustufen und bei Farbfehlsichtigkeit bestehen bleibt (R-08, SC 1.4.1).
 * Und T-8 aus demselben Papier haengt daran: Ein Verhaeltnis Balken gegen
 * Luecke sagt, **wie deutlich** eine Form ist, wo sie entsteht — nicht, **ob**
 * sie entsteht. Das sagt erst eine Messung, und das ist diese hier.
 *
 * ===========================================================================
 * Wie er baut, misst und sich selbst nicht glaubt
 * ===========================================================================
 *
 * Drei Teile, drei Dateien:
 *
 *  - **Vorrichtung** — `engine-parity/fixture.mjs` schneidet Tokens und
 *    Deklarationen aus den echten Stilblaettern und baut daraus **zwei**
 *    freistehende HTML-Seiten mit festgenagelter Geometrie.
 *  - **Lauf** — `engine-parity/shoot-webkitgtk.py` unter `xvfb-run` fuer die
 *    eine Engine, Playwright fuer die andere. Dieselben Dateien, dieselbe
 *    Groesse, derselbe Massstab.
 *  - **Auswertung** — `engine-parity/measure-bands.py` schneidet waagerecht
 *    durch die Knopfmitte und senkrecht durch die linke Kante der zwei
 *    Felder, und zaehlt ausserdem die Farbfelder.
 *
 * **Warum zwei Seiten und nicht eine, ist ein gemessener Fehlschlag und keine
 * Ordnungsliebe.** `--focus-ring-color` und `--note-billing-rail` sind
 * derselbe Wert. Auf einer gemeinsamen Seite fand eine Sonde, die diese Farbe
 * **suchte**, den Knopf und die Schiene und meldete als „Luecke" den Abstand
 * zwischen beiden — eine falsche Zahl, die nicht falsch aussah. Dieselbe
 * Klasse wie ein Waechter, der das Sieb prueft statt der Ernte (E-094).
 * Dagegen stehen drei Massnahmen in der Bauart: jede gemessene Flaeche traegt
 * eine im Bild **einmalige** Farbe, geschnitten wird an **bekannter** Stelle,
 * und der Lauf wird **rot**, wenn eine gemessene Farbe an mehr Stellen
 * vorkommt als erwartet.
 *
 * Und die zwei Bedingungen aus E-094, ohne die der Lauf nicht zaehlt:
 *
 *  (a) **Er meldet nicht gruen, wenn er nichts gemessen hat.** Findet der
 *      Schnitt in der Knopfzeile nur die Flaechenfarbe, ist das **rot** und
 *      nicht `ok`. Dasselbe fuer eine Schiene ohne einen einzigen Balken und
 *      fuer null gemessene Engines.
 *  (b) **Zwei Gegenproben, beide durch den ganzen Weg.** Sie greifen in die
 *      ausgeschnittenen Deklarationen ein — also dort, wo T-216 und T-202
 *      wirklich etwas geaendert haben — und werden anschliessend in
 *      **beiden** Engines gerendert und gemessen. Bleibt eine davon in einer
 *      Engine gruen, ist der Lauf rot. Dass der Ersetzer wirklich etwas
 *      trifft, ist selbst geprueft: Waere die Verletzung schon in der Quelle
 *      begangen, faende er nichts, und die Gegenprobe bestuende genau deshalb.
 *
 * Fehlt `python3-gi`, `xvfb-run` oder Chromium auf einem anderen Rechner,
 * sagt der Lauf, **was dadurch ungemessen bleibt**, und wird uebersprungen —
 * er scheitert nicht. Ein uebersprungener Lauf meldet ausdruecklich nicht
 * „bestanden". Mit `--kein-uebersprung` scheitert er dann doch; siehe Grenze 0.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  GEGENPROBEN,
  GEOMETRIE,
  buildFixture,
  collectRules,
  extractRule,
  knopfschnitt,
  schienenschnitte,
} from './engine-parity/fixture.mjs';

const HIER = fileURLToPath(new URL('./engine-parity/', import.meta.url));
const SCHIESSER = join(HIER, 'shoot-webkitgtk.py');
const MESSER = join(HIER, 'measure-bands.py');

const XVFB_ARGUMENTE = ['-a', '--server-args=-screen 0 1200x800x24'];
const WEBKIT_UMGEBUNG = Object.freeze({
  /* Ohne diese drei Marken faellt WebKitGTK unter Xvfb auf einen GL-Pfad, den
     es dort nicht gibt, und malt gar nicht. */
  WEBKIT_DISABLE_COMPOSITING_MODE: '1',
  LIBGL_ALWAYS_SOFTWARE: '1',
  GDK_BACKEND: 'x11',
});

/**
 * Die Schranken der Form, aus `docs/design/traeger-und-zusage.md` 2.8.
 *
 * **P-1** — durchgezogen heisst: genau ein Strich, keine Luecke. Das ist eine
 * Aussage ueber die Form und keine Zahl, an der man ruetteln koennte; P-2
 * betrifft sie nicht.
 *
 * **P-1 und P-4** — unterbrochen heisst: mindestens drei Striche und
 * mindestens zwei Luecken. **Im Lauf steht in Chromium aber 4 und nicht 3.**
 * Der Grund ist seit T-236 enger gefasst als bei der Einfuehrung: In Chromium
 * waechst die Strichzahl mit der Laenge, eine 4 faengt dort also eine zu
 * **kurze** Schiene ab — und mehr ist ein Lauf, der WebKitGTK gar nicht sieht,
 * nicht imstande zu sehen. Der Zuschlag ist damit ein Aufschlag auf eine
 * **ungemessene** Engine und keine Aussage ueber WebKitGTK; weil dieser Lauf
 * WebKitGTK unmittelbar misst, gilt dort die Grundschranke aus P-1.
 *
 * **P-2** — jede dieser Zahlen ist ein `>=`, nie ein `=`. Eine Pruefung auf
 * Gleichheit waere nicht die strengere, sondern eine **andere**: sie misst die
 * Engine. Der Beleg steht in Abschnitt 5 der Ausgabe dieses Laufs — dieselbe
 * Vorrichtung, dasselbe Erzeugnis, **3 gegen 7** Striche. (Bis T-236 stand hier
 * „3 gegen 4"; das war das Verhaeltnis, mit dem der Zuschlag begruendet wurde,
 * und es ist widerlegt. Die Schranke bleibt, ihre Begruendung ist eine andere.)
 *
 * @type {Record<string, { striche: number; luecken: number }>}
 */
const FORMSCHRANKEN = Object.freeze({
  webkitgtk: Object.freeze({ striche: 3, luecken: 2 }),
  chromium: Object.freeze({ striche: 4, luecken: 3 }),
});

/* ==================================================================== */
/* 1  Werkzeug                                                          */
/* ==================================================================== */

let passed = 0;
let failed = 0;

/**
 * @param {string} name
 * @param {() => void} fn
 */
function check(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (fehler) {
    failed += 1;
    const grund = fehler instanceof Error ? fehler.message : String(fehler);
    process.stdout.write(`  FEHL  ${name}\n        ${grund.split('\n').join('\n        ')}\n`);
  }
}

/**
 * @param {string} befehl
 * @param {string[]} argumente
 * @param {NodeJS.ProcessEnv} [umgebung]
 * @returns {string}
 */
function fahre(befehl, argumente, umgebung) {
  return execFileSync(befehl, argumente, {
    encoding: 'utf8',
    env: umgebung === undefined ? process.env : { ...process.env, ...umgebung },
    maxBuffer: 1 << 26,
  });
}

/**
 * @param {string} befehl
 * @param {string[]} argumente
 * @returns {boolean}
 */
function laeuft(befehl, argumente) {
  try {
    execFileSync(befehl, argumente, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Liest die Tokenwerte aus dem ausgeschnittenen hellen `:root`.
 *
 * @param {string} rumpf
 * @returns {Map<string, string>}
 */
function tokenTafel(rumpf) {
  /** @type {Map<string, string>} */
  const tafel = new Map();
  const ausdruck = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let treffer = ausdruck.exec(rumpf);
  while (treffer !== null) {
    tafel.set(treffer[1], treffer[2].trim());
    treffer = ausdruck.exec(rumpf);
  }
  return tafel;
}

/**
 * @param {Map<string, string>} tafel
 * @param {string} name
 * @returns {string}
 */
function token(tafel, name) {
  const wert = tafel.get(name);
  if (wert === undefined) throw new Error(`Das Token \`${name}\` steht nicht mehr im hellen :root.`);
  return wert;
}

/**
 * @param {Map<string, string>} tafel
 * @param {string} name
 * @returns {number}
 */
function tokenPx(tafel, name) {
  const wert = token(tafel, name);
  const zahl = /^(\d+)px$/.exec(wert);
  if (zahl === null) throw new Error(`Das Token \`${name}\` ist kein ganzzahliger px-Wert: \`${wert}\`.`);
  return Number(zahl[1]);
}

/**
 * @param {ReadonlyArray<{ farbe: string; laenge: number }>} baender
 * @returns {string}
 */
function bandtext(baender) {
  if (baender.length === 0) return '(nichts)';
  return baender.map((band) => `${band.farbe} x${String(band.laenge)}`).join('  ');
}

/**
 * Die Form einer Schiene aus den gezaehlten Strichen und Luecken — P-1.
 *
 * @param {{ striche: number[]; luecken: number[] }} schiene
 * @param {{ striche: number; luecken: number }} schranke
 * @returns {'durchgezogen' | 'unterbrochen' | 'unklar'}
 */
function form(schiene, schranke) {
  if (schiene.striche.length === 0) return 'unklar';
  if (schiene.striche.length === 1 && schiene.luecken.length === 0) return 'durchgezogen';
  if (schiene.striche.length >= schranke.striche && schiene.luecken.length >= schranke.luecken) {
    return 'unterbrochen';
  }
  return 'unklar';
}

/* ==================================================================== */
/* 2  Verfuegbarkeit — und was ihr Fehlen ungemessen laesst             */
/* ==================================================================== */

process.stdout.write('Takt — Engine-Vergleich der Fokusbaender und Schienenformen (T-232)\n');
process.stdout.write(`${'='.repeat(70)}\n\n`);

/**
 * Der Schalter aus Grenze 0 und E-095 Punkt 3.
 *
 * Er sitzt **im Lauf** und nicht in der Pruefstrecke. Eine Strecke, die den
 * Ausgabetext nach „UEBERSPRUNGEN" absucht, haengt am Wortlaut und wird beim
 * ersten umformulierten Satz still blind — genau die Sorte Waechter, die diese
 * Datei sonst misst.
 */
const KEIN_UEBERSPRUNG = process.argv.includes('--kein-uebersprung');

/** @type {null | import('@playwright/test').BrowserType} */
let chromiumTyp = null;
try {
  const playwright = await import('@playwright/test');
  chromiumTyp = playwright.chromium;
  if (!laeuft('sh', ['-c', `test -x ${JSON.stringify(chromiumTyp.executablePath())}`])) chromiumTyp = null;
} catch {
  chromiumTyp = null;
}

/**
 * Die vier Voraussetzungen, ihre Probe und ihr Debian-Paket.
 *
 * Diese Tafel ist **die Quelle der Pruefungen** und keine Randnotiz daneben:
 * `hatPil` und `hatWebKit` unten lesen aus ihr. Eine Liste von Paketnamen, die
 * neben den echten Proben herlaeuft, waere binnen einer Welle veraltet, und
 * niemand saehe es.
 *
 * Wer die Pruefstrecke einrichtet, braucht auf Debian:
 * `apt-get install -y xvfb python3-pil python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1`
 * und dazu `pnpm exec playwright install --with-deps chromium` — Playwrights
 * Chromium ist kein Debian-Paket, es liegt in Playwrights eigenem Ablageort.
 *
 * @type {ReadonlyArray<{ id: string; name: string; probe: string; debian: string; pruefe: () => boolean }>}
 */
const VORAUSSETZUNGEN = Object.freeze([
  {
    id: 'pillow',
    name: 'Pillow — die Auswertung der Bilder',
    probe: 'python3 -c "import PIL"',
    debian: 'python3-pil',
    pruefe: () => laeuft('python3', ['-c', 'import PIL']),
  },
  {
    id: 'gi',
    name: 'python3-gi mit GTK 3 und WebKit2 4.1 — die Engine des Linux-Erzeugnisses',
    probe: 'python3 -c \'import gi; gi.require_version("Gtk","3.0"); gi.require_version("WebKit2","4.1")\'',
    debian: 'python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1',
    pruefe: () =>
      laeuft('python3', [
        '-c',
        'import gi; gi.require_version("Gtk","3.0"); gi.require_version("WebKit2","4.1"); from gi.repository import Gtk, WebKit2',
      ]),
  },
  {
    id: 'xvfb',
    name: 'xvfb-run — der Bildschirm, auf dem WebKitGTK ueberhaupt malt',
    probe: 'command -v xvfb-run',
    debian: 'xvfb',
    pruefe: () => laeuft('sh', ['-c', 'command -v xvfb-run']),
  },
  {
    id: 'chromium',
    name: "Playwrights Chromium — die Engine des Windows-Erzeugnisses",
    probe: 'pnpm exec playwright install --with-deps chromium',
    debian: '(kein Debian-Paket — Playwrights eigener Ablageort)',
    pruefe: () => chromiumTyp !== null,
  },
]);

/** @type {string[]} */
const uebersprungen = [];

/** @type {Map<string, boolean>} */
const vorhanden = new Map(VORAUSSETZUNGEN.map((v) => [v.id, v.pruefe()]));

const hatPil = vorhanden.get('pillow') === true;
if (!hatPil) {
  uebersprungen.push(
    'Pillow (`python3 -c "import PIL"`) fehlt. Ohne die Auswertung ist **keine** Engine ' +
      'messbar — weder die Bandfolge des Fokusrings noch die Form der zwei Schienen.',
  );
}

const hatWebKit = vorhanden.get('gi') === true && vorhanden.get('xvfb') === true;
if (!hatWebKit) {
  uebersprungen.push(
    '`python3-gi` mit `WebKit2 4.1` oder `xvfb-run` fehlt. Ungemessen bleibt damit die ' +
      'Engine-Familie des **Linux-Erzeugnisses** — genau die, wegen der es diesen Lauf gibt. ' +
      'Chromium allein misst die Regel, nicht die Uebereinstimmung, und seine Formschranke ' +
      'aus P-4 ist dann ein Zuschlag auf eine ungemessene Engine.',
  );
}

if (chromiumTyp === null) {
  uebersprungen.push(
    'Playwrights Chromium ist nicht eingerichtet (`pnpm exec playwright install chromium`). ' +
      'Ungemessen bleibt die Engine-Familie des **Windows-Erzeugnisses**.',
  );
}

/**
 * Das Urteil ueber einen Uebersprung — vollstaendig wie teilweise.
 *
 * Sie schreibt **eine** Zeile und nur, wenn der Schalter gesetzt ist. Der
 * Uebersprungtext davor bleibt zeichengleich: Wer beide Laeufe
 * gegeneinanderhaelt, sieht genau diese eine Zeile und sonst nichts — der
 * Beleg dafuer, dass der Ausgangscode am Schalter haengt und nicht an einer
 * zweiten, stilleren Aenderung.
 *
 * @param {'vollstaendig' | 'teilweise'} art
 * @returns {number} Der Ausgangscode.
 */
function urteileUeberUebersprung(art) {
  if (!KEIN_UEBERSPRUNG) return 0;
  const fehlend = VORAUSSETZUNGEN.filter((v) => vorhanden.get(v.id) !== true);
  process.stdout.write(
    `\nFEHLGESCHLAGEN (--kein-uebersprung): ${art === 'vollstaendig' ? 'Ein' : 'Ein teilweiser'} ` +
      'Uebersprung ist dort, wo die Umgebung feststeht, kein Ergebnis (E-095 Punkt 3). Es fehlen: ' +
      `${fehlend.map((v) => `${v.name} [${v.debian}]`).join('; ')}.\n`,
  );
  return 1;
}

if (!hatPil || (!hatWebKit && chromiumTyp === null)) {
  process.stdout.write('UEBERSPRUNGEN — dieser Lauf hat nichts gemessen.\n\n');
  for (const satz of uebersprungen) process.stdout.write(`  - ${satz}\n`);
  process.stdout.write('\nmacOS/WKWebView bleibt auf jedem Rechner ungemessen (Grenze 2 im Dateikopf).\n');
  process.exit(urteileUeberUebersprung('vollstaendig'));
}

/* ==================================================================== */
/* 3  Vorrichtung und Auftraege                                         */
/* ==================================================================== */

const regeln = collectRules();
const tafel = tokenTafel(regeln.tokens.rumpf);

const RING_BREITE = tokenPx(tafel, '--focus-ring-width');
const RING_ABSTAND = tokenPx(tafel, '--focus-ring-offset');
const RINGSAUM = RING_BREITE + RING_ABSTAND;

const FARBEN = Object.freeze({
  flaeche: token(tafel, '--bg-canvas'),
  ring: token(tafel, '--focus-ring-color'),
  gegenband: token(tafel, '--focus-ring-contrast'),
  fuellung: token(tafel, '--danger-bg'),
});

/** Die Sollfolge wird aus den Tokens **gerechnet**, nicht abgeschrieben. */
const SOLLBAENDER = Object.freeze([
  { farbe: 'ring', laenge: RING_BREITE },
  { farbe: 'gegenband', laenge: RING_ABSTAND },
  { farbe: 'fuellung', laenge: GEOMETRIE.fokus.bandfenster - RINGSAUM },
]);

const { knopf } = GEOMETRIE.fokus;
const schnitt = knopfschnitt(RING_BREITE, RING_ABSTAND);

/**
 * Wo jede gemessene Farbe im Bild vorkommen **darf** — gerechnet aus der
 * Geometrie, nicht aus der Messung. Kommt sie woanders oder oefter vor, ist
 * der Lauf rot.
 *
 * Die tragende Zusage ist **ein** Feld, nicht seine Breite: Eine Farbe an zwei
 * Stellen macht jede Sonde mehrdeutig. Die Breite steht als Fenster daneben,
 * und zwar aus einem gemessenen Grund. Die Schiene ist 4px breit, faerbt aber
 * an ihren zwei Ecken je einen Bildpunkt der fuenften Spalte: Dort stossen der
 * 4px breite Seitenrand und der 1px hohe Querrand auf Gehrung zusammen. Das
 * tun **beide** Engines (je zwei Punkte, y=42 und y=117). Die Gehrung auf 4
 * festzunageln hiesse, die Eckverbindung der Engine zu messen statt der
 * Zusage — genau die Sorte Schranke, gegen die P-3 geschrieben ist.
 *
 * @typedef {{ von: number; minBreite: number; maxBreite: number }} Farbfenster
 */
const FARBFELDER_SOLL = Object.freeze({
  fokus: Object.freeze({
    ring: [{ von: knopf.left - RINGSAUM, minBreite: knopf.breite + 2 * RINGSAUM, maxBreite: knopf.breite + 2 * RINGSAUM }],
    /*
     * **Das Gegenband ist schmaler als der Schatten, und darin steckt genau
     * die Zusage aus T-216.** Der Schatten hat `width + offset` Streuung, ist
     * also so breit wie der Ring aussen; sichtbar bleibt von ihm aber nur der
     * Abstandsstreifen, weil die Umrandung seine aeusseren `width` Punkte
     * ueberdeckt. Waere die Malreihenfolge umgekehrt, waere dieses Feld so
     * breit wie das des Rings — und diese Zeile rot.
     */
    gegenband: [
      {
        von: knopf.left - RING_ABSTAND,
        minBreite: knopf.breite + 2 * RING_ABSTAND,
        maxBreite: knopf.breite + 2 * RING_ABSTAND,
      },
    ],
    fuellung: [{ von: knopf.left, minBreite: knopf.breite, maxBreite: knopf.breite }],
  }),
  schienen: Object.freeze(
    Object.fromEntries(
      GEOMETRIE.schienen.felder.map((feld) => [
        feld.name,
        [
          {
            von: feld.left,
            minBreite: GEOMETRIE.schienen.schienenbreite,
            /* +1 fuer die Gehrung an den zwei Ecken; Begruendung oben. */
            maxBreite: GEOMETRIE.schienen.schienenbreite + 1,
          },
        ],
      ]),
    ),
  ),
});

const AUFTRAEGE = {
  fokus: {
    fenster: GEOMETRIE.fokus.bandfenster,
    knopfschnitt: { y: schnitt.y },
    tafel: FARBEN,
    farbfelder: { ring: FARBEN.ring, gegenband: FARBEN.gegenband, fuellung: FARBEN.fuellung },
  },
  schienen: {
    tafel: { flaeche: FARBEN.flaeche },
    schienenschnitte: schienenschnitte().map((s) => ({
      ...s,
      farbe: token(tafel, GEOMETRIE.schienen.felder.find((feld) => feld.name === s.name).token),
    })),
    farbfelder: Object.fromEntries(
      GEOMETRIE.schienen.felder.map((feld) => [feld.name, token(tafel, feld.token)]),
    ),
  },
};

const behalten = process.argv.find((arg) => arg.startsWith('--keep='));
const arbeitsplatz =
  behalten === undefined ? mkdtempSync(join(tmpdir(), 'takt-engines-')) : behalten.slice('--keep='.length);
mkdirSync(arbeitsplatz, { recursive: true });

for (const [seitenname, auftrag] of Object.entries(AUFTRAEGE)) {
  writeFileSync(join(arbeitsplatz, `auftrag-${seitenname}.json`), JSON.stringify(auftrag, null, 2), 'utf8');
}

/**
 * Der Bauplan: welche Seite in welcher Fassung gerendert wird. Der
 * Sollzustand beide Seiten, jede Gegenprobe nur die Seite, die sie trifft.
 *
 * @type {Array<{ name: string; seite: 'fokus' | 'schienen'; titel: string; regeln: typeof regeln }>}
 */
const laeufe = [
  { name: 'soll-fokus', seite: 'fokus', titel: 'unveraendert', regeln },
  { name: 'soll-schienen', seite: 'schienen', titel: 'unveraendert', regeln },
  ...Object.entries(GEGENPROBEN).map(([name, probe]) => ({
    name,
    seite: probe.seite,
    titel: probe.titel,
    regeln: probe.wirkung(regeln),
  })),
];

for (const lauf of laeufe) {
  writeFileSync(join(arbeitsplatz, `${lauf.name}.html`), buildFixture(lauf.regeln, lauf.seite), 'utf8');
}

process.stdout.write(`Vorrichtung: ${arbeitsplatz}\n`);
process.stdout.write(
  `Ausgeschnitten aus ${String(new Set(Object.values(regeln).map((r) => r.quelle)).size)} Stilblaettern, ` +
    `${String(Object.keys(regeln).length - 1)} Regeln, ${String(laeufe.length)} Seiten.\n`,
);
process.stdout.write(
  `Sollfolge aus den Tokens gerechnet: ${bandtext(SOLLBAENDER)} ` +
    `(${FARBEN.ring} / ${FARBEN.gegenband} / ${FARBEN.fuellung} auf ${FARBEN.flaeche}).\n\n`,
);

/* ==================================================================== */
/* 4  Lauf                                                              */
/* ==================================================================== */

/**
 * @typedef {{ farbe: string; laenge: number }} Band
 * @typedef {{ name: string; x: number; striche: number[]; luecken: number[]; bemalt: number; fensterhoehe: number }} Schiene
 * @typedef {{ von: number; breite: number }} Farbfeld
 * @typedef {{ groesse: number[]; farbfelder: Record<string, Farbfeld[]>; knopf?: { gemessen: boolean; grund: string; start?: number; abschnitte?: Array<{von:number;bis:number}>; baender: Band[] }; schienen?: Schiene[] }} Messung
 */

/** @type {Map<string, { anzeige: string; fassung: string; werte: Map<string, Messung> }>} */
const messungen = new Map();

/**
 * @param {string} bild
 * @param {'fokus' | 'schienen'} seite
 * @returns {Messung}
 */
function miss(bild, seite) {
  return JSON.parse(fahre('python3', [MESSER, bild, join(arbeitsplatz, `auftrag-${seite}.json`)]));
}

if (hatWebKit) {
  /** @type {Map<string, Messung>} */
  const werte = new Map();
  let fassung = 'unbekannt';
  for (const lauf of laeufe) {
    const html = join(arbeitsplatz, `${lauf.name}.html`);
    const png = join(arbeitsplatz, `${lauf.name}.webkitgtk.png`);
    const { breite, hoehe } = GEOMETRIE[lauf.seite].seite;
    fassung = fahre(
      'xvfb-run',
      [...XVFB_ARGUMENTE, 'python3', SCHIESSER, pathToFileURL(html).href, png, String(breite), String(hoehe)],
      WEBKIT_UMGEBUNG,
    ).trim();
    werte.set(lauf.name, miss(png, lauf.seite));
  }
  messungen.set('webkitgtk', { anzeige: `WebKitGTK ${fassung}`, fassung, werte });
}

if (chromiumTyp !== null) {
  const browser = await chromiumTyp.launch();
  /** @type {Map<string, Messung>} */
  const werte = new Map();
  try {
    for (const lauf of laeufe) {
      const html = join(arbeitsplatz, `${lauf.name}.html`);
      const png = join(arbeitsplatz, `${lauf.name}.chromium.png`);
      const { breite, hoehe } = GEOMETRIE[lauf.seite].seite;
      const seite = await browser.newPage({ viewport: { width: breite, height: hoehe }, deviceScaleFactor: 1 });
      await seite.goto(pathToFileURL(html).href);
      await seite.screenshot({ path: png, fullPage: true });
      await seite.close();
      werte.set(lauf.name, miss(png, lauf.seite));
    }
    messungen.set('chromium', { anzeige: `Chromium ${browser.version()}`, fassung: browser.version(), werte });
  } finally {
    await browser.close();
  }
}

const engines = [...messungen.keys()];

/* ==================================================================== */
/* 5  Was gemessen wurde — Zahlen, bevor darueber geurteilt wird (P-5)  */
/* ==================================================================== */

process.stdout.write(`Stand: ${new Date().toISOString().slice(0, 10)}\n\n`);
process.stdout.write('Waagerechter Schnitt durch die Knopfmitte:\n\n');
for (const engine of engines) {
  const { anzeige, werte } = messungen.get(engine);
  process.stdout.write(`  ${anzeige.padEnd(24)} ${bandtext(werte.get('soll-fokus').knopf.baender)}\n`);
}

process.stdout.write('\nSenkrechter Schnitt durch die linke Kante — Zahlen, keine Schranken (P-3, P-5):\n\n');
for (const engine of engines) {
  const { anzeige, werte } = messungen.get(engine);
  for (const schiene of werte.get('soll-schienen').schienen) {
    process.stdout.write(
      `  ${anzeige.padEnd(24)} ${schiene.name.padEnd(9)} ` +
        `Schienenlaenge ${String(schiene.laenge)}px, ` +
        `${String(schiene.striche.length)} Striche {${schiene.striche.join(', ')}}, ` +
        `${String(schiene.luecken.length)} Luecken {${schiene.luecken.join(', ')}}, ` +
        `${String(schiene.bemalt)}px bemalt\n`,
    );
  }
}
process.stdout.write(
  '\n  Keine dieser Zahlen ist eine Schranke — auch die Schienenlaenge nicht: WebKitGTKs\n' +
    '  aeussere Striche reichen nicht bis in die Ecken, Chromiums schon. Geprueft wird die\n' +
    '  Form: ein Strich ohne Luecke gegen mindestens ' +
    `${String(FORMSCHRANKEN.webkitgtk.striche)} Striche (WebKitGTK) beziehungsweise ` +
    `${String(FORMSCHRANKEN.chromium.striche)} (Chromium, P-4).\n\n`,
);

/*
 * Der Abstand zur Schranke gehoert in die Ausgabe und nicht in die Fussnote
 * eines Berichts. **WebKitGTK liegt auf der Schranke, nicht darueber** — und
 * das ist kein Versehen der Vorrichtung, sondern die gemessene Lage: Seine
 * Striche sind lang und ihre Zahl waechst mit der Schienenhoehe kaum, weil die
 * Engine die Periode mitzieht. Dieselbe 3 hat der Orchestrator an einer 41px
 * hohen Schiene gemessen, T-236 sie an 56 px bestaetigt — und genau darin
 * unterscheidet sich WebKitGTK von Chromium, wo die Zahl mit der Laenge
 * waechst (7 auf 73 px). Wer die Vorrichtung hoeher macht, um Luft zu
 * gewinnen, misst dann die Vorrichtung — und laesst genau den Fall
 * durchrutschen, gegen den T-8 geschrieben ist: eine Form, die unterhalb ihres
 * Mindestmasses nicht nichts sagt, sondern das Gegenteil. Das ist P-7, und die
 * Antwort darauf steht in 2.8, nicht hier.
 */
process.stdout.write('  Abstand zur Schranke:\n');
for (const engine of engines) {
  const { anzeige, werte } = messungen.get(engine);
  const vermerk = werte.get('soll-schienen').schienen.find((s) => s.name === 'internal');
  const schranke = FORMSCHRANKEN[engine];
  const luft = vermerk.striche.length - schranke.striche;
  process.stdout.write(
    `  ${anzeige.padEnd(24)} ${String(vermerk.striche.length)} Striche gegen Schranke ` +
      `${String(schranke.striche)} — ${luft === 0 ? 'genau auf der Schranke' : `${String(luft)} Striche Luft`}\n`,
  );
}
process.stdout.write('\n');

/* ==================================================================== */
/* 6  Urteil                                                            */
/* ==================================================================== */

process.stdout.write('Regeln\n------\n');

check('es wurde ueberhaupt eine Engine gemessen (E-094 Punkt 3)', () => {
  assert.ok(engines.length > 0, 'null Engines gemessen — das darf kein `ok` sein');
});

check('die Vorrichtung traegt die gemessenen Regeln zeichengleich', () => {
  assert.match(regeln.focusVisible.rumpf, /outline:/, 'die Umrandung steht nicht mehr in :focus-visible');
  assert.match(regeln.focusOnSolid.rumpf, /box-shadow:/, 'der Schatten steht nicht mehr in .on-solid:focus-visible');
  assert.match(
    regeln.noteBilling.rumpf,
    /border-inline-start:\s*4px solid/,
    'die Leistungsschiene ist nicht mehr durchgezogen',
  );
  assert.match(
    regeln.noteInternal.rumpf,
    /border-inline-start:\s*4px dashed/,
    'die Vermerkschiene ist nicht mehr unterbrochen',
  );
  assert.notEqual(
    regeln.focusVisible.rumpf,
    regeln.focusOnSolid.rumpf,
    'beide Fokusregeln haben denselben Rumpf — der Ausschnitt hat zweimal dieselbe Regel gegriffen',
  );
});

check('der Ausschnitt greift den Selektor am Zeilenanfang und nicht seinen Namensvetter', () => {
  /*
   * Der eine Schritt, an dem die zwei Gegenproben **vorbei** gehen: Sie setzen
   * ihre Verletzung in den bereits ausgeschnittenen Rumpf. Waere `extractRule`
   * falsch verankert und griffe `.skip-link:focus-visible` statt
   * `:focus-visible`, blieben beide Gegenproben gruen — sie maessen sich
   * selbst (E-094 Punkt 1). Deshalb hat der Ausschnitt hier seine eigene.
   */
  const kunst = [
    '.skip-link:focus-visible {',
    '  transform: translateY(0);',
    '}',
    '',
    ':focus-visible {',
    '  outline: 2px solid red;',
    '}',
  ].join('\n');
  assert.equal(extractRule(kunst, ':focus-visible'), '\n  outline: 2px solid red;\n');
  assert.equal(extractRule(kunst, '.skip-link:focus-visible'), '\n  transform: translateY(0);\n');
  assert.throws(
    () => extractRule(kunst, '.gibt-es-nicht'),
    /steht nicht mehr am Zeilenanfang/,
    'ein verschwundener Selektor liefert stillschweigend etwas statt zu melden',
  );
});

check('der Ausschnitt laesst sich von einer Klammer im Kommentar nicht abschneiden', () => {
  const kunst = ':root {\n  /* eine } im Kommentar */\n  --a: 1px;\n}\n';
  assert.equal(extractRule(kunst, ':root'), '\n  /* eine } im Kommentar */\n  --a: 1px;\n');
  assert.ok(tokenTafel(regeln.tokens.rumpf).size > 100, 'die Tokentafel ist verdaechtig kurz');
});

for (const [name, probe] of Object.entries(GEGENPROBEN)) {
  check(`die Verletzung „${probe.titel}" veraendert die Vorrichtung wirklich`, () => {
    /*
     * Beim Bauen gemessen und deshalb festgehalten: Wurde die Verletzung
     * bereits **in der Quelle** begangen, findet der Ersetzer nichts mehr, die
     * Gegenprobe wird zur Kopie des Sollzustands — und besteht dann genau
     * deshalb. Ein stiller Ersetzer ist kein bestandener Pruefpunkt, sondern
     * ein abgeschalteter (E-094 Punkt 1).
     */
    const gestoert = laeufe.find((lauf) => lauf.name === name).regeln;
    const abweichungen = Object.keys(regeln).filter(
      (schluessel) => gestoert[schluessel].rumpf !== regeln[schluessel].rumpf,
    );
    assert.equal(
      abweichungen.length,
      2,
      `die Verletzung hat ${String(abweichungen.length)} statt 2 Regeln getroffen ` +
        `(${abweichungen.join(', ') || 'keine'}) — der Ersetzer greift ins Leere`,
    );
  });
}

for (const engine of engines) {
  const { anzeige, werte } = messungen.get(engine);
  const schranke = FORMSCHRANKEN[engine];
  const fokus = werte.get('soll-fokus');
  const schienen = werte.get('soll-schienen');

  check(`${anzeige}: jede gemessene Farbe steht an genau einer Stelle`, () => {
    /*
     * Der Punkt, an dem die erste Messung dieser Sitzung gescheitert ist. Er
     * steht **vor** jedem Urteil ueber Baender oder Formen, weil ein Urteil
     * ueber eine mehrdeutige Sonde nichts wert ist.
     */
    for (const [seite, quelle] of [
      ['fokus', fokus],
      ['schienen', schienen],
    ]) {
      for (const [farbname, sollfenster] of Object.entries(FARBFELDER_SOLL[seite])) {
        const gemessen = quelle.farbfelder[farbname];
        const wo = `${seite}/${farbname}: gemessen ${JSON.stringify(gemessen)}`;
        assert.equal(
          gemessen.length,
          sollfenster.length,
          `${wo} — die Farbe steht an ${String(gemessen.length)} Stellen statt an ` +
            `${String(sollfenster.length)}. Eine Sonde, deren Farbe mehrdeutig ist, misst etwas ` +
            'anderes, als sie behauptet',
        );
        for (const [i, fenster] of sollfenster.entries()) {
          assert.equal(gemessen[i].von, fenster.von, `${wo} — beginnt bei ${String(gemessen[i].von)}, gerechnet ${String(fenster.von)}`);
          assert.ok(
            gemessen[i].breite >= fenster.minBreite && gemessen[i].breite <= fenster.maxBreite,
            `${wo} — Breite ${String(gemessen[i].breite)} liegt nicht in ` +
              `[${String(fenster.minBreite)}, ${String(fenster.maxBreite)}]`,
          );
        }
      }
    }
  });

  check(`${anzeige}: der Knopf steht an der gerechneten Stelle (E-094 Punkt 3)`, () => {
    assert.ok(fokus.knopf.gemessen, fokus.knopf.grund);
    assert.ok(fokus.knopf.baender.length > 0, 'null Baender gemessen — das darf kein `ok` sein');
    assert.equal(
      fokus.knopf.abschnitte.length,
      1,
      `in der Knopfzeile stehen ${String(fokus.knopf.abschnitte.length)} Abschnitte statt einem — ` +
        'der Schnitt trifft noch etwas anderes als den Knopf',
    );
    assert.equal(
      fokus.knopf.start,
      schnitt.erwarteterStart,
      `gefunden bei x=${String(fokus.knopf.start)}, gerechnet x=${String(schnitt.erwarteterStart)}`,
    );
    assert.equal(
      fokus.knopf.baender.at(-1).farbe,
      'fuellung',
      `das letzte Band ist \`${fokus.knopf.baender.at(-1).farbe}\` und nicht die Knopffuellung`,
    );
  });

  check(`${anzeige}: die Umrandung liegt ueber dem aeusseren Schatten (T-216)`, () => {
    assert.deepEqual(
      fokus.knopf.baender,
      SOLLBAENDER,
      `gemessen: ${bandtext(fokus.knopf.baender)}\nerwartet: ${bandtext(SOLLBAENDER)}`,
    );
  });

  check(`${anzeige}: der senkrechte Schnitt trifft nur seine eigene Schiene`, () => {
    /*
     * Die zweite Haelfte der Farbfeldpruefung, und sie misst die andere
     * Achse: Der Schnitt laeuft ueber die **ganze** Bildspalte, also muss
     * alles, was er als Balken zaehlt, innerhalb des Feldes liegen, dem die
     * Schiene gehoert. Laege ein Balken darueber oder darunter, zaehlte der
     * Lauf einen Abstand als Luecke — der Fehler, mit dem diese Aufgabe
     * angefangen hat.
     */
    const grenzen = Object.fromEntries(
      GEOMETRIE.schienen.felder.map((feld) => [feld.name, { oben: feld.top, unten: feld.top + feld.hoehe - 1 }]),
    );
    for (const s of schienen.schienen) {
      assert.notEqual(s.oben, null, `${s.name}: kein einziger Balken in Spalte ${String(s.x)}`);
      assert.ok(
        s.oben >= grenzen[s.name].oben && s.unten <= grenzen[s.name].unten,
        `${s.name}: Balken von y=${String(s.oben)} bis y=${String(s.unten)}, ` +
          `das Feld reicht aber nur von ${String(grenzen[s.name].oben)} bis ${String(grenzen[s.name].unten)}`,
      );
    }
  });

  check(`${anzeige}: Leistungsschiene durchgezogen, Vermerkschiene unterbrochen (P-1, P-4)`, () => {
    const felder = Object.fromEntries(schienen.schienen.map((s) => [s.name, s]));
    for (const s of Object.values(felder)) {
      assert.ok(
        s.striche.length > 0,
        `${s.name}: kein einziger Balken in Spalte ${String(s.x)} — das darf kein \`ok\` sein`,
      );
    }
    assert.equal(
      form(felder.billing, schranke),
      'durchgezogen',
      `billing: ${String(felder.billing.striche.length)} Striche, ` +
        `${String(felder.billing.luecken.length)} Luecken — erwartet genau ein Strich ohne Luecke`,
    );
    assert.equal(
      form(felder.internal, schranke),
      'unterbrochen',
      `internal: ${String(felder.internal.striche.length)} Striche, ` +
        `${String(felder.internal.luecken.length)} Luecken — erwartet >=${String(schranke.striche)} und ` +
        `>=${String(schranke.luecken)}`,
    );
  });

  check(`${anzeige}: Gegenprobe „${GEGENPROBEN.bandtausch.titel}" wird rot (E-094 Punkt 1)`, () => {
    const gestoert = werte.get('bandtausch');
    assert.ok(gestoert.knopf.gemessen, gestoert.knopf.grund);
    assert.notDeepEqual(
      gestoert.knopf.baender,
      SOLLBAENDER,
      'die vertauschten Baender sehen aus wie der Sollzustand — die Messung sieht die Reihenfolge nicht',
    );
    assert.equal(
      gestoert.knopf.baender[0].farbe,
      'gegenband',
      `erwartet war das Gegenband aussen, gemessen: ${bandtext(gestoert.knopf.baender)}`,
    );
    assert.equal(gestoert.knopf.baender[1].farbe, 'ring', `gemessen: ${bandtext(gestoert.knopf.baender)}`);
  });

  check(`${anzeige}: Gegenprobe „${GEGENPROBEN.schienentausch.titel}" wird rot (E-094 Punkt 1)`, () => {
    const felder = Object.fromEntries(werte.get('schienentausch').schienen.map((s) => [s.name, s]));
    assert.equal(
      form(felder.billing, schranke),
      'unterbrochen',
      'die vertauschte Leistungsschiene wird nicht als unterbrochen gemessen',
    );
    assert.equal(
      form(felder.internal, schranke),
      'durchgezogen',
      'die vertauschte Vermerkschiene wird nicht als durchgezogen gemessen',
    );
  });
}

if (engines.length >= 2) {
  const [erster, ...weitere] = engines;

  check('beide Engines zeichnen dieselbe Bandfolge', () => {
    const erste = messungen.get(erster).werte.get('soll-fokus').knopf.baender;
    for (const engine of weitere) {
      const andere = messungen.get(engine).werte.get('soll-fokus').knopf.baender;
      assert.deepEqual(
        andere,
        erste,
        `${messungen.get(erster).anzeige}: ${bandtext(erste)}\n${messungen.get(engine).anzeige}: ${bandtext(andere)}`,
      );
    }
  });

  check('beide Engines zeichnen dieselben Schienenformen — Rhythmus ausgenommen (P-3)', () => {
    const formen = (engine) =>
      messungen
        .get(engine)
        .werte.get('soll-schienen')
        .schienen.map((s) => `${s.name}=${form(s, FORMSCHRANKEN[engine])}`);
    for (const engine of weitere) {
      assert.deepEqual(formen(engine), formen(erster), `${formen(erster).join(', ')} gegen ${formen(engine).join(', ')}`);
    }
  });

  check('die Strichzahl wird ausdruecklich nicht verglichen (P-3)', () => {
    /*
     * Diese Regel misst den Lauf und nicht die Oberflaeche. Sie verlangt
     * **nicht**, dass die Rhythmen gleich sind — waeren sie es, bewiese das
     * nichts, und verlangte man es, waere der Lauf beim naechsten
     * Engine-Wechsel rot, obwohl beide Engines richtig zeichnen (P-2, P-3).
     * Sie haelt nur fest, dass ueberhaupt Striche gezaehlt wurden.
     */
    for (const engine of engines) {
      for (const s of messungen.get(engine).werte.get('soll-schienen').schienen) {
        assert.ok(s.striche.length > 0, `${engine}/${s.name}: kein einziger Balken gemessen`);
      }
    }
  });
}

/* ==================================================================== */
/* 7  Ergebnis                                                          */
/* ==================================================================== */

if (behalten === undefined) rmSync(arbeitsplatz, { recursive: true, force: true });

process.stdout.write(`\n${'='.repeat(70)}\n`);

if (failed > 0) {
  process.stdout.write(`${String(passed)} bestanden, ${String(failed)} fehlgeschlagen.\n`);
  process.exit(1);
}

const gegenproben = engines.length * Object.keys(GEGENPROBEN).length;
process.stdout.write(
  `${String(passed)} bestanden, 0 fehlgeschlagen.\n` +
    `${String(engines.length)} Engines (${engines.map((e) => messungen.get(e).anzeige).join(', ')}), ` +
    `${String(laeufe.length)} Vorrichtungsseiten, darunter ${String(gegenproben)} Gegenproben — ` +
    'jede in jeder Engine gerendert und gemessen.\n',
);

if (uebersprungen.length > 0) {
  process.stdout.write('\nTeilweise uebersprungen — ungemessen bleibt:\n');
  for (const satz of uebersprungen) process.stdout.write(`  - ${satz}\n`);
}

process.stdout.write(
  '\nUngemessen bleibt in jedem Fall: macOS/WKWebView, die gebaute Binaerdatei selbst und die ' +
    'Ausloesung von :focus-visible (Grenzen 1, 2 und 4 im Dateikopf).\n',
);

/*
 * Der zweite Uebersprungweg, und der gefaehrlichere: Hier stehen ueber der
 * Zeile „N bestanden, 0 fehlgeschlagen" — der Lauf hat gemessen, nur eben eine
 * Engine von zwei. Ohne diesen Schalter geht er mit Code 0 hinaus, und eine
 * Pruefstrecke saehe eine Uebereinstimmung, wo eine einzelne Engine mit sich
 * selbst verglichen wurde. `process.exitCode` statt `process.exit`, damit die
 * Ausgabe vollstaendig herausgeschrieben wird, bevor der Prozess endet.
 */
if (uebersprungen.length > 0) process.exitCode = urteileUeberUebersprung('teilweise');
