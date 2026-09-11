/**
 * Takt — Nachweis, dass die Oberfläche den Dienst so anruft, wie er zuhört
 * (T-051).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:callers
 *
 * ===========================================================================
 * Warum dieser Lauf existiert
 * ===========================================================================
 *
 * T-050 hat in `apps/web/src/api/endpoints.ts` drei deutsche Feldnamen
 * gefunden. Zwei davon haben je eine Funktion der Anwendung **unbenutzbar**
 * gemacht, und zwar seit Wochen:
 *
 *  - `neuerParentId` statt `newParentId` — 422, kein Tag-Ordner ließ sich
 *    verschieben (S-08).
 *  - `reihenfolge` statt `order` — 422, die Pfeile in der Spaltenverwaltung
 *    haben nie etwas bewirkt (A-5.4).
 *  - `nurOffene` statt `includeCompleted` — still verworfen; zufällig richtig,
 *    weil der einzige Aufrufer gerade die Vorgabe wollte.
 *
 * Beeindruckend ist nicht der Fehler, sondern womit er nicht gefunden wurde:
 *
 *  - Der **Typecheck** sieht nichts. Ein Rumpf ist ein Objektliteral gegen
 *    einen `unknown`-Parameter; ein Schlüssel, den niemand liest, ist
 *    typkorrekt.
 *  - **556 Prüffälle** sehen nichts. Keiner fährt die Oberfläche gegen den
 *    echten Dienst.
 *  - Der **End-to-End-Test** war grün: sein gelingender Zug lief über die
 *    Testhilfe und damit am Code der Oberfläche vorbei.
 *  - `proof:openapi` hat `neuerParentId` sogar **gefunden** — und richtig als
 *    „von keiner Route gelesen" eingeordnet. Nur hat niemand gefragt, ob ihn
 *    jemand *sendet*.
 *
 * Das ist die dritte Seite eines Dreiecks. `proof:openapi` hält die
 * Beschreibung gegen den Dienst. Dieser Lauf hält die **Aufrufer** gegen den
 * Dienst.
 *
 * ===========================================================================
 * Was verglichen wird
 * ===========================================================================
 *
 * **1. Rümpfe gegen `REQUEST_SCHEMAS`.** Jeder Schlüssel, den `endpoints.ts`
 * in einen Rumpf schreibt, muss in dem zod-Schema stehen, mit dem die
 * getroffene Route ihre Eingabe prüft. Ein Schlüssel, den das Schema nicht
 * führt, hat genau zwei mögliche Ausgänge, und beide sind schlecht: 422, wenn
 * ein Pflichtfeld darunter fehlt, oder stilles Verwerfen. Die Namensquelle ist
 * dieselbe wie bei `proof:openapi` — die Schemata in den Routendateien, nicht
 * die Beschreibung.
 *
 * **2. Fragezeichenparameter gegen die Beschreibung.** Sie stehen in keinem
 * zod-Schema; der Dienst liest sie einzeln aus `c.req.query(...)`. Die
 * Beschreibung ist hier die Quelle — und sie ist es zu Recht, weil
 * `proof:openapi` Abschnitt 10 jeden beschriebenen Parameter im Quelltext der
 * Routen nachweist. Ohne diesen zweiten Lauf wäre der Vergleich hier
 * wertlos; mit ihm ist er eine Kette: Aufrufer → Beschreibung → Routenquelle.
 *
 * **3. Der Weg selbst.** Jeder Aufruf muss eine Operation der Beschreibung
 * treffen. Ein Pfad, den es nicht gibt, ist derselbe Fehler eine Ebene höher.
 *
 * ===========================================================================
 * Was dieser Lauf **nicht** prüft — die benannten blinden Flecken
 * ===========================================================================
 *
 * **a) Werte, nur Namen.** Ob `stopRunning` ein Wahrheitswert ist und
 * `timeEntryIds` eine Liste, misst dieser Lauf nicht. Er misst Schlüssel.
 *
 * **b) Nur die Aufrufdateien.** Das ist keine Nachlässigkeit, sondern eine
 * gemessene Zusicherung: `apps/web/src/api/client.ts` ist die einzige Stelle
 * mit `fetch`, und außerhalb der Aufrufdateien setzt keine Ansicht einen Rumpf
 * zusammen (T-050, Punkt 6). Abschnitt 1 misst das nach, statt es zu glauben:
 * kein Zugriff auf das globale `fetch` und keiner auf die Anfragefunktion
 * `request` außerhalb dieser Dateien — **und** dass der Sammler, der das misst,
 * überhaupt etwas eingesammelt hat (T-231, A-A-61).
 *
 * **Welche Dateien das sind, steht seit T-250-2 nicht mehr hier, sondern wird
 * gemessen** (F-22): `api/endpoints.ts`, solange es die Sammelstelle gibt, und
 * jede `api.ts` eines Merkmalsordners, die auf der Platte liegt. Der Umbau nach
 * Merkmalen verteilt die Aufrufe über acht Wellen; eine Zusage, die an der
 * Ordnerstruktur hängt statt an der Anforderung, wäre in jeder Zwischenstufe rot
 * und am Ende falsch. Die Herleitung steht bei `WEB_CALLER_FILES`, das Urteil in
 * Abschnitt 0.
 *
 * **c) Was der Leser nicht auflösen kann.** Ein berechneter Schlüsselname,
 * eine Verbreitung aus einer Variablen ohne Typangabe, ein Rumpf aus einem
 * Funktionsaufruf: Alles das kommt aus `caller-scan.mjs` als **unaufgelöst**
 * heraus und wird in Abschnitt 5 gezählt und aufgeschrieben. Heute ist die
 * Zahl null. Wird sie es nicht mehr, wird dieser Lauf rot — nicht, weil der
 * Aufruf falsch wäre, sondern weil niemand mehr sagen kann, ob er richtig ist.
 * Ein Prüfer mit einem benannten blinden Fleck ist brauchbar, einer mit einem
 * unbenannten ist gefährlich.
 *
 * **d) Was hinter der Tür geschieht.** Dieser Lauf misst Namen an der Tür, nicht
 * das Verhalten dahinter. Ob eine Route tut, was sie verspricht, messen
 * `proof:addin-wiring` (echter Dienst, echte Datenbank) und die Einheitentests.
 *
 * ===========================================================================
 * Zwei Aufrufer, ein Dienst (T-132, O-M)
 * ===========================================================================
 *
 * Hier stand bis T-132: „Das Add-in ruft dieselben Routen unter `/addin/*` an
 * und hat seinen eigenen Nachweis (`proof:addin-wiring`)." Der Satz war
 * richtig und die Schlussfolgerung falsch. `proof:addin-wiring` fährt den
 * **Dienst** und prüft, dass die Kette hält; er sieht sich nicht an, welche
 * Schlüssel `apps/outlook-addin/src/api/client.ts` in seine Rümpfe schreibt.
 * Genau das ist die Frage, die T-050 an der Oberfläche gestellt und dreimal
 * beantwortet bekommen hat — und sie war für die zweite Tür offen (O-M).
 *
 * Beide Aufrufer laufen deshalb durch **denselben** Leser mit demselben
 * Urteil. Sie unterscheiden sich in der Gestalt ihres Aufrufs
 * (`request(pfad, optionen)` gegen `call(methode, pfad, abfrage, rumpf)`) und
 * in der Vorsilbe ihres Pfades; beides sagt `CALL_SHAPES` in
 * `caller-scan.mjs`. Alles Weitere ist gleich, und das ist der Punkt: Ein
 * Fehler, den der eine Nachweis findet, findet der andere auch.
 *
 * ===========================================================================
 * Und der Prüfer prüft sich selbst
 * ===========================================================================
 *
 * Abschnitt 6 setzt die drei Namen aus T-050 im gelesenen Text wieder ein —
 * im Arbeitsspeicher, die Datei bleibt unberührt — und verlangt, dass jeder
 * einzelne genau eine Beanstandung auslöst. Ohne das wäre dieser Lauf, was
 * `pnpm contrast` vor T-011 war: grün, weil er nichts tut.
 *
 * **Je Datei, die die Stelle trägt** (T-253-2). Bis dahin verlangte der
 * Abschnitt **genau eine** Trägerin und maß damit die Aufteilung der
 * Merkmalsordner statt der Blindheit des Lesers; die Herleitung steht dort.
 *
 * **Und die Ausnahmelisten messen sich mit** (T-253-2). `NOT_CALLED_BY_UI` in
 * Abschnitt 2 und `NEVER_SENT` in Abschnitt 3 sind die einzigen Stellen dieses
 * Laufs, an denen ein Satz einen Bauzustand **behauptet**. Drei ihrer Einträge
 * behaupteten einen, den es seit Wellen nicht mehr gab. Ein Eintrag zuviel
 * macht keinen Lauf rot — er macht ihn unwahr, und das ist teurer.
 *
 * **Und seit T-188 auch die Zusage, auf der Punkt b) ruht** (A-A-40). Sie war
 * die einzige tragende Aussage dieses Laufs ohne Gegenprobe, und gemessen
 * wurde sie mit einem Ausdruck, den T-143 an anderer Stelle bereits als blind
 * befunden hatte. Abschnitt 6 und 8 setzen jetzt je fünf Schreibweisen eines
 * zweiten Wegs ein — nackt, über `globalThis.`, über `window.`, über `self.`
 * und aus einer Zerlegung — und verlangen je einen Zuwachs; eine sechste Probe
 * verlangt das Gegenteil, damit der Wächter nicht auf Prosa anspringt.
 *
 * ===========================================================================
 * Was T-231 daran geändert hat (A-A-61, A-A-62)
 * ===========================================================================
 *
 * Security-checker hat in T-230 drei Löcher in genau dieser Zusage gemessen
 * (Bedrohungsmodell 30.1), und alle drei sagten **45/0, Code 0**:
 *
 *  - Der **Sammler** konnte ins Leere greifen, und der Lauf meldete es als
 *    „(0 Dateien durchgesehen)" in grün. Die Selbstproben aus T-188 können das
 *    strukturell nicht sehen, weil sie ihre Kunstquelle der **Aufstellung**
 *    hinzufügen und damit das Sieb prüfen, nie die Ernte. Deshalb misst
 *    `proveHarvest` die Ernte jetzt eigens — Untergrenze **und** benannte
 *    Datei, **vor** der Zusage (A-A-61).
 *  - Der Sammler sah **zwei** Endungen; der Bündler löst **acht** auf. Die
 *    Liste steht jetzt in `BUNDLED_EXTENSIONS` (A-A-61, zweiter Satz).
 *  - Die **Zwillingszeile** für `request` trug unverändert den Ausdruck, den
 *    dieser Lauf zwanzig Zeilen weiter unten selbst als blind ausweist, und
 *    hatte null Gegenproben. `client.request(…)` war ein offener zweiter Weg
 *    zum Dienst. Die Regel kommt jetzt aus `request-scan.mjs` und hat sechs
 *    eigene Proben in Abschnitt 6 (A-A-62).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { z } from 'zod';

import {
  optionaleQuelle,
  paketQuelle,
  paketVerzeichnis,
  quellbaum,
} from './source-resolve.mjs';
import { parseYaml } from './openapi-reader.mjs';
import { createMatcher } from './schema-match.mjs';
import { buildTypeIndex, normalizePath, scanCallers, CALL_SHAPES } from './caller-scan.mjs';
/*
 * Die Regel „hier geht etwas ins Netz" (T-188, A-A-40).
 *
 * Sie stand bis T-188 hier als eigener Ausdruck, und er war **zeichengleich**
 * der, den T-143 als S-1 als blind gemessen hat. Jetzt kommt sie aus
 * `fetch-scan.mjs` — derselben Datei, aus der `proof:release-safety` sie holt.
 * Die Herleitung steht dort; die Gegenproben stehen unten in Abschnitt 6 und 8.
 */
import { BLIND_FETCH_CALL, describeStray, strayGlobalFetch } from './fetch-scan.mjs';
import { BLIND_REQUEST_CALL, strayRequestAccess } from './request-scan.mjs';
import { REQUEST_SCHEMAS as TODO_SCHEMAS } from '../src/features/todos/routes.ts';
import { REQUEST_SCHEMAS as STRUCTURE_SCHEMAS } from '../src/features/structure/routes.ts';
import { REQUEST_SCHEMAS as TIME_SCHEMAS } from '../src/features/timer/routes.ts';
import { REQUEST_SCHEMAS as EXPORT_SCHEMAS } from '../src/features/export/routes.ts';
import { REQUEST_SCHEMAS as SETTINGS_SCHEMAS } from '../src/features/settings/routes.ts';
import { REQUEST_SCHEMAS as DATA_TRANSFER_SCHEMAS } from '../src/features/data-transfer/routes.ts';
/*
 * Die Eingabeschemata der Add-in-Tür (T-132, O-M; seit T-149 als gemeinsame
 * Aufstellung direkt neben den Routen). Der Nachweis liest dieselbe Registry
 * wie `proof:openapi`, damit eine neue Add-in-Route mit Rumpf nicht an einem
 * zweiten, handgepflegten Wörterbuch vorbeilaufen kann.
 */
import { REQUEST_SCHEMAS as ADDIN_SCHEMAS } from '../src/routes/addin/schema.ts';

/*
 * Wo die gelesenen Dateien liegen — **aufgelöst**, nicht abgezählt (T-249-1).
 *
 * Bis T-249-1 standen hier sechs feste Pfade, vier davon über Paketgrenzen
 * hinweg (`../../web/src/api/endpoints.ts`). Der Umbau nach Merkmalen zieht
 * genau diese Dateien um. Jetzt nennt dieser Lauf, **was** er lesen will —
 * Paket und Merkmal —, und `source-resolve.mjs` sagt ihm, wo es liegt; der
 * bisherige Ort steht als Hinweis daneben und ist eine Abkürzung, keine
 * Bedingung. Findet die Auflösung nichts, endet der Lauf rot, statt eine leere
 * Menge für einen sauberen Baum zu halten.
 *
 * Die Merkmale sind ausgeführte Ausfuhren und keine Wörter aus Kommentaren:
 * Ein Kommentar kann in zwei Dateien stehen, `export function checkHealth(`
 * steht in einer.
 */
const SPEC_PATH = paketQuelle('@takt/local-api', {
  hinweis: 'openapi/takt-local-api.yaml',
  merkmal: ['openapi: 3', 'paths:'],
  endungen: new Set(['.yaml', '.yml']),
});
/**
 * Die **Sammelstelle** der Aufrufe — solange es sie gibt (F-22, T-250-2).
 *
 * Sie ist die einzige Auflösung dieses Laufs, die ausbleiben **darf**:
 * `apps/web/src/api/endpoints.ts` löst sich über acht Wellen in die `api.ts`
 * der Merkmalsordner auf und ist danach weg. Ein Lauf, der an ihrem Fehlen
 * stirbt, wäre rot, weil eine erwartete Datei fehlt — und das ist kein Befund
 * über den Bestand, sondern einer über den Lauf.
 *
 * Stumm wird er davon nicht: Das Ausbleiben schreibt `optionaleQuelle` hin, und
 * die Menge, in die das Ergebnis fällt, hat unten in Abschnitt 0 eine
 * Untergrenze. Verschwindet die Sammelstelle, **ohne** daß ein Merkmalsordner
 * ihre Aufrufe übernommen hat, ist die Menge leer und der Lauf rot.
 */
const LEGACY_CALLER_PATH = optionaleQuelle('@takt/web', {
  hinweis: 'src/api/endpoints.ts',
  merkmal: 'export function checkHealth(',
});
/**
 * Die **Sammelstelle der Typen** — und wie die Sammelstelle der Aufrufe
 * vergänglich (T-251-2).
 *
 * `api/types.ts` steht auf demselben Zettel wie `api/endpoints.ts`: Beide
 * werden über die Wellen auf die Merkmalsordner verteilt und fallen danach weg.
 * Bis T-251-2 wurde sie hier mit `paketQuelle` verlangt — der Lauf wäre in der
 * Welle, die sie auflöst, mit „Quelldatei nicht auflösbar" gestorben, und das
 * ist ein Befund über den Lauf und keiner über den Bestand.
 *
 * Dieselbe Einhegung wie bei {@link LEGACY_CALLER_PATH}: Das Ausbleiben wird
 * hingeschrieben, und die Menge, in die das Ergebnis fällt, hat unten in
 * Abschnitt 0 eine Untergrenze. Verschwindet die Sammelstelle, **ohne** daß die
 * Merkmalsordner ihre Typen übernommen haben, ist die Aufstellung dünn und der
 * Lauf rot.
 */
const TYPES_PATH = optionaleQuelle('@takt/web', {
  hinweis: 'src/api/types.ts',
  merkmal: ['export type Id = string;', 'export type Timestamp = string;'],
});
const WEB_CLIENT_PATH = paketQuelle('@takt/web', {
  hinweis: 'src/api/client.ts',
  merkmal: 'export class TaktTransportError',
});
const ADDIN_CALLER_PATH = paketQuelle('@takt/outlook-addin', {
  hinweis: 'src/api/client.ts',
  merkmal: ['export interface ApiClient', 'export type ApiResult'],
});
const WEB_SOURCE_DIR = join(paketVerzeichnis('@takt/web'), 'src');
const ADDIN_SOURCE_DIR = join(paketVerzeichnis('@takt/outlook-addin'), 'src');

/** Ein Ort unterhalb eines Quellordners, so wie dieser Lauf ihn benennt. */
const alsName = (wurzel, datei) => relative(wurzel, datei).split(sep).join('/');

// ---------------------------------------------------------------------------
// Die Ernte — hochgezogen, weil Abschnitt 0 schon über sie urteilt
// ---------------------------------------------------------------------------

/*
 * Bis T-250-2 entstand die Ernte erst in Abschnitt 1. Sie steht jetzt hier,
 * weil die **Aufrufdateien** gegen sie verglichen werden, und dieser Vergleich
 * gehört vor den Leser: Wer über eine Menge urteilt, die er nicht kennt, urteilt
 * nicht. Die Prüfsätze über die Ernte bleiben, wo sie waren — Abschnitt 1 für
 * die Oberfläche, Abschnitt 7 für den Aufgabenbereich.
 */

/**
 * Die Endungen, die der Bündler auflöst — ausgeschrieben (A-A-61).
 *
 * Ausgeschrieben und nicht als Ausdruck: Wer eine Endung hinzunimmt, soll sie
 * eintragen und dabei merken, daß er sie eintragen mußte. `.cjs` steht mit
 * darin, obwohl heute keine solche Datei im Baum liegt — die Liste ist gegen
 * das gebaut, was auflösbar **wäre**, nicht gegen das, was zufällig daliegt.
 */
const BUNDLED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'];

const isBundledSource = (name) =>
  BUNDLED_EXTENSIONS.some((extension) => name.endsWith(extension)) && !name.endsWith('.d.ts');

/*
 * Der Sammler läuft seit T-249-1 über `quellbaum()`. Zwei Dinge ändern sich
 * dadurch, und keines davon ist eine Zusage:
 *
 *   - der Quellordner wird über den **Paketnamen** gefunden, nicht über
 *     `../../web/src/`;
 *   - eine fehlende oder zu dünn besetzte Ernte endet **dort** rot, nicht erst
 *     in einem Prüfsatz. `proveHarvest` bleibt trotzdem stehen: Es ist die
 *     Untergrenze dieses Laufs auf die Menge, über die er urteilt, und sie steht
 *     sichtbar als Prüfsatz in der Ausgabe statt nur als Vorbedingung im Leser.
 */
const webFiles = quellbaum('@takt/web', 'src', {
  mindestens: 100,
  endungen: new Set(BUNDLED_EXTENSIONS),
})
  .filter((file) => isBundledSource(file))
  .map((file) => ({ name: alsName(WEB_SOURCE_DIR, file), source: readFileSync(file, 'utf8') }));

// ---------------------------------------------------------------------------
// Die Aufrufdateien der Oberfläche — an der Anforderung aufgespannt (F-22)
// ---------------------------------------------------------------------------

/**
 * Wo ein Aufruf an den Dienst stehen darf, seit F-22.
 *
 * ===========================================================================
 * Was sich geändert hat und was nicht
 * ===========================================================================
 *
 * Die **Zusage** ist dieselbe wie seit T-051: In der Oberfläche entsteht kein
 * Aufruf an den Dienst außerhalb der dafür vorgesehenen Stellen. Bis T-250-2
 * war diese Zusage an der **Ordnerstruktur** aufgespannt — genau zwei Dateien,
 * `api/endpoints.ts` und `api/client.ts` —, und der Umbau nach Merkmalen zog
 * ihr damit den Boden weg: Jedes Merkmal nimmt seine Aufrufe mit, und die erste
 * `features/…/api.ts` hätte den Lauf rot gemacht, ohne daß irgend etwas an der
 * Anforderung falsch gewesen wäre.
 *
 * Die beiden naheliegenden Auswege sind verworfen (F-22): eine Datei, die
 * `request` weiterreicht, wäre die ausgeschlossene Sammeldatei; ein zweiter
 * Name für `request` wäre ein Ausweichen am Wächter vorbei.
 *
 * Also spannt die Zusage ihre Menge jetzt an der Anforderung auf:
 * `api/client.ts`, wo `request` entsteht, und **jede `api.ts` eines
 * Merkmalsordners, die es tatsächlich gibt**. Die Sammelstelle bleibt darin,
 * solange sie existiert.
 *
 * ===========================================================================
 * „Die es tatsächlich gibt" — gemessen, nicht geraten (F-22 Punkt 3)
 * ===========================================================================
 *
 * Eine Menge, die aus einer Liste im Lauf käme, wäre eine Behauptung. Sie wird
 * deshalb auf der Platte **gesucht** und mit dem verglichen, was der Sammler
 * gesehen hat — Mengenvergleich, nicht Zahlenvergleich. Der Grund steht in
 * T-247-7: Dort urteilte ein Wächter über 129 Dateien, ohne eine gesehen zu
 * haben, weil Konfigurationsliste und geladene Dateien aus derselben Quelle
 * kamen und bei einem Pfadfehler gemeinsam auf null gingen — `0 === 0` war
 * grün. Zwei Wege zu derselben Menge, und beide müssen dasselbe sagen.
 *
 * Und die Untergrenze (F-22 Punkt 4): Findet der Lauf **keine** Datei, in der
 * `request` stehen darf, ist das ein Fehlschlag der Messung und kein
 * bestandener Prüfsatz. Ohne sie wäre der Tag denkbar, an dem der Merkmalsordner
 * nicht gefunden wird, die Sammelstelle schon weg ist und „nichts beanstandet"
 * heißt: niemand hat hingesehen.
 */
const WEB_FEATURES_DIR = join(WEB_SOURCE_DIR, 'features');

/** Der Name, unter dem ein Merkmal seine Aufrufe führt — eine Ebene, kein Muster. */
const FEATURE_API_FILE = 'api.ts';

/** Wie eine solche Datei heißt, von `src` aus gesehen. */
const FEATURE_API_NAME = /^features\/[^/]+\/api\.ts$/;

/**
 * Der **erste** Weg zur Menge: ein Blick auf die Platte.
 *
 * Kein Merkmalsordner ist kein Fehler — heute gibt es ihn noch nicht überall,
 * und am Ende der Wellen gibt es ihn achtmal. Ein Fehlschlag wäre erst, wenn
 * **nichts** übrigbleibt; das entscheidet Abschnitt 0 und nicht diese Funktion.
 */
function featureApiOnDisk() {
  let eintraege;
  try {
    eintraege = readdirSync(WEB_FEATURES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const gefunden = [];
  for (const eintrag of eintraege) {
    if (!eintrag.isDirectory()) continue;
    const pfad = join(WEB_FEATURES_DIR, eintrag.name, FEATURE_API_FILE);
    try {
      if (!statSync(pfad).isFile()) continue;
    } catch {
      continue;
    }
    gefunden.push({ name: alsName(WEB_SOURCE_DIR, pfad), path: pfad });
  }
  return gefunden.sort((links, rechts) => links.name.localeCompare(rechts.name));
}

const featureApiPlatte = featureApiOnDisk();

/** Der **zweite** Weg zur selben Menge: was der Sammler eingesammelt hat. */
const featureApiErnte = webFiles.map((file) => file.name).filter((name) => FEATURE_API_NAME.test(name));

/**
 * Die Dateien, die dieser Lauf als Aufrufer liest.
 *
 * Der Text kommt von der **Platte** und nicht aus der Ernte — das ist die
 * zweite Hälfte des Vergleichs oben. Läse der Leser aus derselben Aufstellung,
 * gegen die er geprüft wird, prüfte er sich gegen sich selbst.
 *
 * Die Sammelstelle steht vorn, solange es sie gibt. Löst sie sich auf und
 * wandert ihr Merkmal in einen Merkmalsordner, steht sie dort schon — deshalb
 * die Entdopplung über den Namen.
 */
const WEB_CALLER_FILES = [
  ...(LEGACY_CALLER_PATH === null
    ? []
    : [{ name: alsName(WEB_SOURCE_DIR, LEGACY_CALLER_PATH), path: LEGACY_CALLER_PATH }]),
  ...featureApiPlatte,
]
  .filter((datei, index, alle) => alle.findIndex((andere) => andere.name === datei.name) === index)
  .map((datei) => ({ ...datei, source: readFileSync(datei.path, 'utf8') }));

/** Die Namen derselben Dateien — die Menge, um die es in Abschnitt 1 geht. */
const WEB_CALLER_NAMES = WEB_CALLER_FILES.map((datei) => datei.name);

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

const REQUEST_SCHEMAS = {
  ...TODO_SCHEMAS,
  ...STRUCTURE_SCHEMAS,
  ...TIME_SCHEMAS,
  ...EXPORT_SCHEMAS,
  ...SETTINGS_SCHEMAS,
  ...DATA_TRANSFER_SCHEMAS,
};

let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FEHL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Die Operationen des Dienstes, nach „METHODE /pfad/{}"
// ---------------------------------------------------------------------------

const doc = parseYaml(readFileSync(SPEC_PATH, 'utf8'));
const matcher = createMatcher(doc);

const operations = new Map();
for (const [path, item] of Object.entries(doc.paths)) {
  for (const method of METHODS) {
    const operation = item[method];
    if (operation === undefined) continue;
    const parameters = [...(item.parameters ?? []), ...(operation.parameters ?? [])].map((entry) =>
      matcher.deref(entry),
    );
    operations.set(`${method.toUpperCase()} ${normalizePath(path)}`, {
      id: operation.operationId,
      path,
      method: method.toUpperCase(),
      hasBody: operation.requestBody !== undefined,
      query: parameters.filter((parameter) => parameter.in === 'query').map((parameter) => parameter.name),
    });
  }
}

/**
 * Die Felder eines zod-Schemas, so wie die Route sie liest.
 *
 * `io: 'input'` ist die richtige Seite: Ein Feld mit `.default(...)` ist in der
 * **Eingabe** weglassbar und steht trotzdem in der Ausgabe. Andersherum
 * gelesen hielte dieser Lauf jeden Aufruf für unvollständig, der einen
 * Vorgabewert benutzt.
 */
const fieldsOf = (schema) => {
  const json = z.toJSONSchema(schema, { io: 'input' });
  const collect = (node) => {
    if (node === null || typeof node !== 'object') return { names: [], required: [] };
    const branches = node.anyOf ?? node.oneOf ?? node.allOf;
    if (Array.isArray(branches)) {
      // Eine Vereinigung: Ein Schlüssel, den **irgendein** Zweig führt, wird
      // gelesen. Für die Frage „wird das gesendete Feld gelesen" ist die
      // Vereinigung die richtige Menge.
      const parts = branches.map(collect);
      return {
        names: [...new Set(parts.flatMap((part) => part.names))],
        required: [...new Set(parts.flatMap((part) => part.required))],
      };
    }
    return { names: Object.keys(node.properties ?? {}), required: node.required ?? [] };
  };
  return collect(json);
};

/**
 * Die gemeinsame Typaufstellung — solange es sie gibt.
 *
 * Ist die Sammelstelle weg, ist sie leer, und jede Aufrufdatei trägt ihre Typen
 * selbst (siehe {@link webCallerOf}). Daß dabei nichts verlorengeht, mißt nicht
 * dieser Ausdruck, sondern Abschnitt 0 und Abschnitt 5: eine Untergrenze auf die
 * Aufstellung und die Zahl der unauflösbaren Rümpfe.
 */
const typeIndex =
  TYPES_PATH === null ? new Map() : buildTypeIndex(readFileSync(TYPES_PATH, 'utf8'), 'types.ts');

/**
 * Dieselbe Menge, über die der **Leser** verfügt — als eine Aufstellung
 * (T-251-2).
 *
 * Sie ist die Vereinigung dessen, was `webCallerOf` je Datei aufspannt: die
 * Sammelstelle plus die Typen jeder Aufrufdatei. Gebraucht wird sie für das
 * Urteil in Abschnitt 0 und nirgends sonst — der **Leser** bekommt sie
 * ausdrücklich **nicht**, denn er soll je Datei auflösen: Ein Typ, den nur ein
 * fremder Merkmalsordner deklariert, ist für diese Datei nicht auflösbar, und
 * das soll er auch bleiben. Ein gemeinsamer Topf wäre eine stillschweigende
 * Lockerung des Lesers unter dem Vorwand einer Messung.
 */
const WEB_TYPE_SOURCES = [
  ...(TYPES_PATH === null
    ? []
    : [{ name: alsName(WEB_SOURCE_DIR, TYPES_PATH), source: readFileSync(TYPES_PATH, 'utf8') }]),
  ...WEB_CALLER_FILES.map((datei) => ({ name: datei.name, source: datei.source })),
].filter((datei, index, alle) => alle.findIndex((andere) => andere.name === datei.name) === index);

const WEB_TYPE_INDEX = new Map(
  WEB_TYPE_SOURCES.flatMap((quelle) => [...buildTypeIndex(quelle.source, quelle.name)]),
);

/**
 * Der ganze Vergleich als **eine Funktion über einen Text**.
 *
 * Genau deshalb steht er hier und nicht verstreut: Abschnitt 6 setzt einen
 * verdorbenen Text ein und erwartet Beanstandungen. Ein Vergleich, der nur auf
 * der echten Datei läuft, kann sich nicht auf die Probe stellen lassen.
 *
 * Seit T-132 (O-M) nimmt er entgegen, **wessen** Text er ansieht: Aufstellung
 * der Typen, Gestalt des Aufrufs, Zuordnung der Eingabeschemata. Das Urteil
 * darunter ist für beide Aufrufer dasselbe — es gibt keine zweite Fassung, die
 * milder sein könnte.
 */
/**
 * Wer da gelesen wird, wenn es die Oberfläche ist — **je Datei** (T-250-2).
 *
 * Bis T-250-2 stand hier ein einzelnes Objekt mit `fileName: 'endpoints.ts'`.
 * Nach dem Umbau nach Merkmalen gibt es diese eine Datei nicht mehr, sondern so
 * viele, wie es Merkmale gibt; der Leser bleibt derselbe und bekommt nur
 * gesagt, wessen Text er ansieht.
 *
 * Die Typaufstellung ist `types.ts` **plus** die Typen der Aufrufdatei selbst —
 * dieselbe Bauart wie beim Aufgabenbereich, wo `CreateTodoRequest` neben dem
 * Aufruf steht. Ohne sie wäre ein Rumpf, dessen Typ mit seinem Merkmal umzieht,
 * ein „unaufgelöst" in Abschnitt 5, und der Umbau erzeugte blinde Flecken, die
 * keiner ist.
 */
const webCallerOf = (fileName, text) => ({
  fileName,
  typeIndex: new Map([...typeIndex, ...buildTypeIndex(text, fileName)]),
  shape: CALL_SHAPES.options,
  schemas: REQUEST_SCHEMAS,
});

function inspect(text, who) {
  const roh = scanCallers(text, who.typeIndex, who.fileName, who.shape);
  const functions = roh.functions;
  /*
   * Der Ort trägt seit T-250-2 den Dateinamen. Solange die Oberfläche **eine**
   * Aufrufdatei hatte, war „createTodo (Zeile 42)" eindeutig; bei acht ist es
   * das nicht mehr, und ein Befund, der nicht sagt, wo er steht, kostet den
   * Leser die Suche.
   */
  const calls = roh.calls.map((call) => ({ ...call, where: `${who.fileName} ${call.where}` }));
  const unreadable = roh.unreadable.map((eintrag) => `${who.fileName} ${eintrag}`);
  const findings = [];
  const covered = new Set();
  const sentKeys = new Map();

  for (const call of calls) {
    if (call.path === null || call.method === null) {
      findings.push({ kind: 'route', message: `${call.where}: Pfad oder Methode nicht lesbar` });
      continue;
    }
    const key = `${call.method} ${call.normalized}`;
    const operation = operations.get(key);
    if (operation === undefined) {
      findings.push({
        kind: 'route',
        message: `${call.where} (Zeile ${call.line}): ruft „${key}" an — diese Operation gibt es nicht`,
      });
      continue;
    }
    covered.add(key);

    for (const reason of call.body?.unresolved ?? []) {
      findings.push({ kind: 'blind', message: `${call.where}: Rumpf — ${reason}` });
    }
    for (const reason of call.query?.unresolved ?? []) {
      findings.push({ kind: 'blind', message: `${call.where}: Abfrage — ${reason}` });
    }

    if (call.body !== null) {
      const schema = who.schemas[operation.id];
      if (schema === undefined) {
        // Eine Route ohne Rumpfschema liest keinen Rumpf. `body: {}` ist dann
        // die leere Höflichkeitsform und schadet nicht; jeder Schlüssel darin
        // fiele dagegen ins Nichts.
        if (call.body.keys.length > 0) {
          findings.push({
            kind: 'body',
            message: `${call.where} → ${operation.id}: sendet ${call.body.keys.join('/')}, aber diese Route liest keinen Rumpf`,
          });
        }
      } else {
        const fields = fieldsOf(schema);
        const unknown = call.body.keys.filter((name) => !fields.names.includes(name));
        for (const name of unknown) {
          findings.push({
            kind: 'body',
            message: `${call.where} (Zeile ${call.line}) → ${operation.id}: sendet „${name}", gelesen werden ${fields.names.join('/')}`,
          });
        }
        const known = sentKeys.get(operation.id) ?? new Set();
        for (const name of call.body.keys) known.add(name);
        sentKeys.set(operation.id, known);
      }
    }

    if (call.query !== null) {
      for (const name of call.query.keys) {
        if (operation.query.includes(name)) continue;
        findings.push({
          kind: 'query',
          message: `${call.where} (Zeile ${call.line}) → ${operation.id}: sendet „?${name}", beschrieben sind ${
            operation.query.length === 0 ? '(keine)' : operation.query.join('/')
          }`,
        });
      }
    }
  }

  return { functions, calls, unreadable, findings, covered, sentKeys };
}

/**
 * Derselbe Vergleich über **mehrere** Aufrufdateien, zu einem Urteil vereinigt.
 *
 * Vereinigt wird und nicht nebeneinandergestellt: Ob eine Operation einen
 * Aufrufer hat, ist eine Frage an die Oberfläche als Ganzes und nicht an eine
 * Datei. Wäre es anders, wäre der Umbau nach Merkmalen eine Amnestie — jede
 * einzelne Datei ruft die meisten Operationen nicht an.
 *
 * Der **Ort** eines Befundes bleibt trotzdem genau: Er trägt seit T-250-2 den
 * Dateinamen (siehe `inspect`).
 */
function inspectAll(dateien) {
  const teile = dateien.map((datei) => inspect(datei.source, webCallerOf(datei.name, datei.source)));
  const covered = new Set();
  const sentKeys = new Map();
  for (const teil of teile) {
    for (const key of teil.covered) covered.add(key);
    for (const [id, keys] of teil.sentKeys) {
      const bisher = sentKeys.get(id) ?? new Set();
      for (const name of keys) bisher.add(name);
      sentKeys.set(id, bisher);
    }
  }
  return {
    functions: teile.reduce((summe, teil) => summe + teil.functions, 0),
    calls: teile.flatMap((teil) => teil.calls),
    unreadable: teile.flatMap((teil) => teil.unreadable),
    findings: teile.flatMap((teil) => teil.findings),
    covered,
    sentKeys,
  };
}

const result = inspectAll(WEB_CALLER_FILES);
const of = (kind) => result.findings.filter((finding) => finding.kind === kind);

/**
 * Der zweite Aufrufer: der Aufgabenbereich des Add-ins (T-132, O-M).
 *
 * Seine Typaufstellung steht in **derselben** Datei — `CreateTodoRequest` und
 * `BookRequest` sind dort deklariert, nicht in `types.ts`. Deshalb wird der
 * Text einmal gelesen und zweimal benutzt.
 */
const addinText = readFileSync(ADDIN_CALLER_PATH, 'utf8');
const ADDIN_CALLER = {
  fileName: 'client.ts',
  typeIndex: buildTypeIndex(addinText, 'client.ts'),
  shape: CALL_SHAPES.addin,
  schemas: ADDIN_SCHEMAS,
};
const addin = inspect(addinText, ADDIN_CALLER);
const addinOf = (kind) => addin.findings.filter((finding) => finding.kind === kind);

// ---------------------------------------------------------------------------
section('0  Der Leser liest die Dateien — sonst wäre alles Folgende wertlos');
// ---------------------------------------------------------------------------

/*
 * Zuerst: **welche** Dateien (F-22 Punkt 3 und 4). Die Herleitung steht oben
 * bei `WEB_CALLER_FILES`; hier steht das Urteil.
 *
 * Die Untergrenze ist eins und nicht acht. Acht wäre ein Zensus über einen
 * Umbau, der über acht Wellen läuft — der Lauf wäre dann in jeder Zwischenstufe
 * rot, ohne daß etwas falsch wäre. Eins ist die Aussage, um die es geht:
 * Irgendwo muß der Aufruf an den Dienst stehen, sonst hat dieser Lauf nichts
 * gelesen und jede Zusage darunter steht über der leeren Menge.
 */
check(
  `die Aufrufdateien der Oberfläche sind gesucht und gefunden (${String(WEB_CALLER_FILES.length)}): ` +
    `${WEB_CALLER_NAMES.join(', ')}`,
  WEB_CALLER_FILES.length >= 1,
  'keine einzige Datei, in der ein Aufruf an den Dienst stehen dürfte — das ist ein ' +
    'Fehlschlag der Messung und kein sauberer Baum',
);

/*
 * Und die zweite Hälfte: Die Menge kommt auf **zwei** Wegen zustande — ein Blick
 * auf die Platte und die Ernte des Sammlers —, und beide müssen dasselbe sagen.
 *
 * T-247-7 ist der Grund. Dort urteilte ein Wächter über 129 Dateien, ohne eine
 * gesehen zu haben: Konfigurationsliste und geladene Dateien kamen aus derselben
 * Quelle, ein Pfadfehler setzte beide auf null, und `0 === 0` war grün. Ein
 * Zahlenvergleich hätte hier dieselbe Schwäche; verglichen werden deshalb die
 * **Namen**, in beide Richtungen.
 */
const nurAufDerPlatte = featureApiPlatte
  .map((datei) => datei.name)
  .filter((name) => !featureApiErnte.includes(name));
const nurInDerErnte = featureApiErnte.filter(
  (name) => !featureApiPlatte.some((datei) => datei.name === name),
);
check(
  `Platte und Sammler sehen dieselben Aufrufdateien der Merkmalsordner ` +
    `(${String(featureApiPlatte.length)} zu ${String(featureApiErnte.length)})`,
  nurAufDerPlatte.length === 0 && nurInDerErnte.length === 0,
  [
    nurAufDerPlatte.length === 0 ? '' : `nur auf der Platte: ${nurAufDerPlatte.join(', ')}`,
    nurInDerErnte.length === 0 ? '' : `nur in der Ernte: ${nurInDerErnte.join(', ')}`,
  ]
    .filter((zeile) => zeile !== '')
    .join(' | '),
);

/*
 * Dieselbe Vorsichtsmaßnahme wie in `proof:openapi` Abschnitt 0. Ein Leser,
 * der nichts findet, sieht genauso aus wie eine Datei ohne Fehler. Die Zahl
 * steht deshalb nirgends fest, sondern wird zweimal auf verschiedenen Wegen
 * ermittelt: einmal aus dem Syntaxbaum, einmal aus dem Rohtext.
 *
 * Über **alle** Aufrufdateien und nicht über eine: Ein Rohtextzähler, der nur
 * die Sammelstelle ansieht, wird mit jeder Welle stiller, ohne rot zu werden.
 */
const rawCalls = WEB_CALLER_FILES.reduce(
  (summe, datei) => summe + [...datei.source.matchAll(/\brequest\s*[<(]/g)].length,
  0,
);
check(
  `so viele Aufrufe gelesen wie im Rohtext stehen (${rawCalls})`,
  rawCalls > 0 && result.calls.length === rawCalls,
  `gelesen ${result.calls.length}`,
);
check(
  `es sind überhaupt Aufrufe da (${result.calls.length}, mindestens 45)`,
  result.calls.length >= 45,
);
/*
 * Die Typaufstellung — an der Anforderung aufgespannt und **benutzt** gemessen
 * (T-251-2).
 *
 * ===========================================================================
 * Was hier stand und warum es fiel
 * ===========================================================================
 *
 *     typeIndex.size > 30 && typeIndex.has('TodoCreate') && typeIndex.has('PoolWrite')
 *
 * Der Sinn war richtig und ist unverändert: Eine Aufstellung, die leer aus einer
 * kaputten Auflösung kommt, sieht genauso aus wie eine, in der nichts falsch
 * ist. Die **Stichprobe** war es nicht. `typeIndex` kam aus `api/types.ts`
 * allein, während der Leser längst über `types.ts` **und** die Typen jeder
 * Aufrufdatei verfügt; `TodoCreate` steht seit der zweiten Welle in
 * `features/todos/api.ts`, und der Lauf war rot, ohne daß am Bestand irgend
 * etwas falsch gewesen wäre. Derselbe Fall wie F-22 und E-102, eine Zeile
 * tiefer: eine Zusage, deren Menge an der Ordnerstruktur hängt statt an der
 * Anforderung.
 *
 * ===========================================================================
 * Was an die Stelle tritt — zwei Sätze und eine Gegenprobe
 * ===========================================================================
 *
 * **Erstens die Menge.** Die Aufstellung wird über dieselben Quellen
 * aufgespannt wie beim Leser (siehe {@link WEB_TYPE_INDEX}), und die Quellen
 * stehen im Namen des Prüfsatzes. Damit ist „nichts gefunden" von „nichts
 * gesehen" unterscheidbar, ohne daß ein Dateiname in einer Bedingung steht.
 *
 * **Zweitens der Gebrauch.** Eine gefüllte Aufstellung, die kein Aufruf anfaßt,
 * wäre eine Zahl ohne Aussage — genau die Sorte grüner Zeile, gegen die dieser
 * Lauf gebaut ist. Gezählt werden deshalb die Einträge, über die der Leser
 * beim Auflösen der Rümpfe **tatsächlich gegangen ist** (`call.body.types`).
 * Kein Name steht dabei fest: Welche Typen das sind, sagt der Bestand.
 *
 * **Und die Gegenprobe.** Derselbe Leser über denselben Text, aber mit einer
 * leeren Aufstellung, muß auf null benutzte Typen fallen. Ohne sie wäre die
 * Zahl oben eine Behauptung über eine Verbindung, die niemand nachgemessen
 * hat — sie könnte auch dann stehen, wenn die Aufstellung gar nicht der Grund
 * der Auflösung wäre.
 */
const genutzteTypen = [
  ...new Set(
    result.calls.flatMap((call) => [...(call.body?.types ?? []), ...(call.query?.types ?? [])]),
  ),
].sort();

/**
 * Die Untergrenze auf die Aufstellung — gegen den **Endstand** gesetzt, nicht
 * gegen den heutigen.
 *
 * Hier stand `> 30`, und die Zahl war so richtig wie die Stichprobe daneben:
 * gemessen an einer `api/types.ts` mit 75 Einträgen. Sie hat denselben Fehler.
 * Diese Zahl **soll** über die Wellen fallen — die Sammelstelle löst sich auf,
 * und was danach in einer `features/…/api.ts` steht, sind die Anfragetypen
 * dieses Merkmals und nicht mehr die Typen der ganzen Oberfläche. Eine
 * Untergrenze am heutigen Stand wäre in der letzten Welle rot, ohne daß etwas
 * falsch wäre — genau der Fall, den dieser Prüfsatz gerade hinter sich hat.
 *
 * Zehn ist deshalb keine Hälfte von heute (89), sondern die Grenze zwischen
 * „gelesen" und „nichts gelesen": Acht Merkmalsordner, die je ihre Anfragetypen
 * führen, liegen weit darüber; ein Leser, dem die Auflösung wegbricht, liegt bei
 * null. Das Gewicht trägt ohnehin der Prüfsatz darunter — eine Aufstellung, die
 * niemand benutzt, ist eine Zahl ohne Aussage.
 */
const TYPAUFSTELLUNG_MINDESTENS = 10;

check(
  `die Typaufstellung der Oberfläche ist gelesen (${WEB_TYPE_INDEX.size} Typen aus ` +
    `${WEB_TYPE_SOURCES.length}: ${WEB_TYPE_SOURCES.map((quelle) => quelle.name).join(', ')})`,
  WEB_TYPE_SOURCES.length >= 1 && WEB_TYPE_INDEX.size >= TYPAUFSTELLUNG_MINDESTENS,
  WEB_TYPE_SOURCES.length === 0
    ? 'keine einzige Quelle für Typen gefunden — das ist ein Fehlschlag der Messung'
    : `${String(WEB_TYPE_INDEX.size)} Typen, verlangt sind mindestens ${String(TYPAUFSTELLUNG_MINDESTENS)}`,
);

/**
 * Die Untergrenze auf die **benutzten** Einträge — und warum sie so tief liegt.
 *
 * Heute sind es sechs. Die meisten Rümpfe dieser Oberfläche sind
 * Objektliterale; über die Aufstellung geht nur, wer einen getippten Parameter
 * weiterreicht (`body: eingabe` mit `eingabe: TodoCreate`). Drei ist rund die
 * Hälfte des heutigen Standes — dieselbe Bauart wie bei `proveHarvest` und den
 * Untergrenzen in `proof:release-safety`: Sie soll rot werden, wenn die
 * Auflösung über die Aufstellung **aufhört**, nicht wenn ein Aufruf sein
 * Objektliteral ausschreibt.
 *
 * Eine Obergrenze steht hier ausdrücklich nicht: Mehr benutzte Typen sind kein
 * Befund.
 */
const GENUTZTE_TYPEN_MINDESTENS = 3;

const unbekannteTypen = genutzteTypen.filter((name) => !WEB_TYPE_INDEX.has(name));
check(
  `und sie wird auch benutzt: ${genutzteTypen.length} ihrer Einträge lösen einen Rumpf auf ` +
    `(${genutzteTypen.join(', ')})`,
  genutzteTypen.length >= GENUTZTE_TYPEN_MINDESTENS && unbekannteTypen.length === 0,
  genutzteTypen.length < GENUTZTE_TYPEN_MINDESTENS
    ? `nur ${String(genutzteTypen.length)} benutzte Einträge, verlangt sind ${String(GENUTZTE_TYPEN_MINDESTENS)} — ` +
      'der Leser löst seine Rümpfe nicht mehr über die Aufstellung auf'
    : `nicht in der Aufstellung: ${unbekannteTypen.join(', ')}`,
);

const typenOhneAufstellung = new Set(
  WEB_CALLER_FILES.flatMap((datei) =>
    scanCallers(datei.source, new Map(), datei.name, CALL_SHAPES.options).calls.flatMap((call) => [
      ...(call.body?.types ?? []),
      ...(call.query?.types ?? []),
    ]),
  ),
);
check(
  'Gegenprobe: mit leerer Aufstellung löst kein Aufruf mehr einen Rumpftyp auf',
  typenOhneAufstellung.size === 0 && genutzteTypen.length > 0,
  typenOhneAufstellung.size === 0
    ? 'auch mit Aufstellung wurde kein Typ benutzt — die Zahl oben stünde über der leeren Menge'
    : `ohne Aufstellung benutzt: ${[...typenOhneAufstellung].join(', ')}`,
);
check(
  'jeder Aufruf ist als Ganzes lesbar — Pfad, Methode, Optionen',
  result.unreadable.length === 0,
  result.unreadable.join(' | '),
);

// ---------------------------------------------------------------------------
section('1  Es gibt keinen Weg zum Dienst außer den gemessenen Dateien');
// ---------------------------------------------------------------------------

/*
 * Dieser Lauf liest die Aufrufdateien der Oberfläche. Diese Beschränkung ist
 * nur so viel wert wie die Zusicherung, daß es daneben keine weitere gibt. Also
 * wird sie gemessen und nicht geglaubt: `fetch` steht ausschließlich in
 * `client.ts`, und `request` ausschließlich dort und in den Dateien, die
 * Abschnitt 0 gefunden hat.
 *
 * **Was sich mit F-22 geändert hat, ist die Menge und nicht die Zusage**
 * (T-250-2). Bis dahin stand hier „genau zwei Dateien", und das war die alte
 * Ordnerstruktur und nicht die Anforderung — dieselbe Bauart wie E-099 Punkt 3,
 * wo ein Wächter seine Menge an der Route aufspannte statt an der Anforderung.
 * Die Anforderung lautet: In der Oberfläche entsteht kein Aufruf an den Dienst
 * außerhalb der dafür vorgesehenen Stellen. Wo diese Stellen liegen, sagt der
 * Baum, und der Baum wird gelesen (siehe `WEB_CALLER_FILES`).
 *
 * Fällt das eines Tages, ist die richtige Antwort nicht, diese Prüfung zu
 * lockern, sondern die neue Stelle **messbar** zu machen — nicht, sie
 * einzutragen, und schon gar nicht, den Namen zu wechseln.
 *
 * ===========================================================================
 * Womit gemessen wird — und womit bis T-188 gemessen wurde (A-A-40)
 * ===========================================================================
 *
 * Hier stand `/(?<![\w.])fetch\s*\(/`. Das ist **zeichengleich** der Ausdruck,
 * den T-143 als S-1 an einem anderen Wächter als blind gemessen und den T-146
 * dort ersetzt hat: Der Rückblick auf `.` schließt **jedes** `.fetch` aus, um
 * zwei Fälle durchzulassen — und läßt damit `globalThis.fetch(`,
 * `window.fetch(`, `self.fetch(` und jede Zerlegung durch. Für diese Zusage
 * gab es außerdem **null** Gegenproben; sie stehen jetzt in Abschnitt 6.
 *
 * Die Regel kommt aus `fetch-scan.mjs` und ist damit dieselbe, die
 * `proof:release-safety` fährt (E-086 Punkt 1). Kommentare zählen nicht mit:
 * Eine Datei darf in ihrer Beschreibung sagen, daß sie `fetch` **nicht** ruft.
 *
 * ===========================================================================
 * Was der Sammler sieht — und daß er überhaupt etwas sieht (T-231, A-A-61)
 * ===========================================================================
 *
 * Zwei Befunde aus T-230 sitzen nicht an der Regel, sondern an der **Ernte**:
 *
 *  - Die Zahl der eingesammelten Dateien stand im **Namen** der Zusicherung
 *    und in keiner Bedingung. Ein Sammler, der ins Leere greift, meldete
 *    „`fetch` steht nur in api/client.ts (**0 Dateien durchgesehen**)" — grün,
 *    45/0, Code 0 (Bedrohungsmodell 30.1.1). Deshalb steht die Untergrenze
 *    jetzt **vor** der Zusage, und zwar als Zahl **und** als benannte Datei:
 *    Eine Zahl allein ließe einen Sammler durch, der irgendetwas sammelt.
 *  - Der Sammler sah `.ts` und `.tsx`; Vite löst fünf Endungen mehr auf. Eine
 *    Kunstquelle mit nacktem `fetch(` als `.js`, `.jsx`, `.mts`, `.cts` oder
 *    `.mjs` war unsichtbar, und die Zahl im Text blieb stehen (30.1.3).
 *    Deshalb steht die Endungsliste jetzt ausgeschrieben und deckt das ab,
 *    was der Bündler auflöst.
 */

/*
 * `BUNDLED_EXTENSIONS`, `isBundledSource` und die Ernte selbst stehen seit
 * T-250-2 oben bei der Auflösung der Pfade — Abschnitt 0 urteilt jetzt über die
 * Aufrufdateien und braucht die Ernte dafür schon. Die Prüfsätze **über** die
 * Ernte sind hier geblieben, wo sie hingehören: unmittelbar vor der Zusage, die
 * auf ihnen ruht.
 */

/**
 * Die Ernte eines Sammlers, bevor über sie geurteilt wird (A-A-61).
 *
 * Zwei Zeilen, und beide sind Vorbedingungen und keine Aussagen über den Baum:
 * Eine **Untergrenze** — der Sammler hat nicht ins Leere gegriffen — und die
 * **benannte Datei**, ohne die die Zusage darunter über die leere Menge stünde.
 *
 * Die Untergrenze ist bewußt weit unter dem heutigen Stand. Sie ist kein
 * Zensus: Sie soll rot werden, wenn ein Verzeichnis umbenannt, eine Endung
 * geändert oder ein Werkzeug getauscht wurde — nicht, wenn jemand eine Ansicht
 * löscht.
 */
function proveHarvest(who, files, minimum, mustContain) {
  check(
    `${who}: der Sammler hat mindestens ${String(minimum)} Dateien eingesammelt (${String(files.length)})`,
    files.length >= minimum,
    `${String(files.length)} statt mindestens ${String(minimum)} — der Sammler greift ins Leere`,
  );
  const missing = mustContain.filter((name) => !files.some((file) => file.name === name));
  check(
    `${who}: und ${mustContain.join(' und ')} ${mustContain.length === 1 ? 'ist' : 'sind'} darunter`,
    missing.length === 0,
    files.length === 0 ? 'die Ernte ist leer' : `nicht eingesammelt: ${missing.join(', ')}`,
  );
}

proveHarvest('die Oberfläche', webFiles, 100, [
  alsName(WEB_SOURCE_DIR, WEB_CLIENT_PATH),
  ...WEB_CALLER_NAMES,
]);

/**
 * Wo der Zugriff auf das globale `fetch` seinen Platz hat — ausgeschrieben.
 *
 * Eine Liste von **Dateien** und keine Ausnahme für eine **Form**: Wer
 * `window.fetch` allgemein durchließe, hätte den blinden Ausdruck von vorhin
 * unter anderem Namen zurück.
 *
 * Seit T-249-1 steht der Name nicht mehr als Zeichenkette hier, sondern kommt
 * aus derselben Auflösung, die die Datei oben findet. Die Zusage ist
 * unverändert — **eine** Datei, benannt, keine Form —; nur wird sie nicht
 * dadurch falsch, daß die Datei umzieht. Zöge man beides getrennt nach, wäre
 * genau der Tag denkbar, an dem der Sammler `api/client.ts` nicht mehr findet
 * und diese Liste trotzdem darauf zeigt: Der Ausnahmeort läge dann auf einer
 * Datei, die es nicht gibt, und jeder Zugriff im Baum wäre ein Fund — oder,
 * schlimmer, keiner.
 */
const WEB_FETCH_HOME = [alsName(WEB_SOURCE_DIR, WEB_CLIENT_PATH)];

/**
 * Wo der Zugriff auf die Anfragefunktion seinen Platz hat — **gemessen**.
 *
 * `api/client.ts` führt sie, die Aufrufdateien rufen sie. Beides steht als
 * **Datei** da und nicht als Form, aus demselben Grund wie oben; der
 * Unterschied zu `WEB_FETCH_HOME` ist, daß die zweite Hälfte dieser Liste seit
 * T-250-2 nicht mehr eine Datei ist, sondern so viele, wie es Merkmalsordner
 * gibt. Wo diese Menge herkommt und warum sie nicht geraten wird, steht bei
 * {@link WEB_CALLER_FILES}; daß sie nicht leer ist, hat Abschnitt 0 gemessen.
 *
 * **Kein Muster über Namen.** `features/…/api.ts` steht hier nirgends als
 * Ausdruck: Erlaubt ist, was auf der Platte liegt **und** eingesammelt wurde,
 * nicht, was so heißt. Eine erfundene `features/erfunden/api.ts` ist deshalb
 * ein Fund und kein Freibrief — die Gegenprobe dazu steht in Abschnitt 6.
 */
const WEB_REQUEST_HOME = [alsName(WEB_SOURCE_DIR, WEB_CLIENT_PATH), ...WEB_CALLER_NAMES];

const strayFetch = strayGlobalFetch(webFiles, WEB_FETCH_HOME);

/*
 * Bis T-231 stand hier `/(?<![\w.])request\s*[<(]/` — zeichengleich der
 * Ausdruck, den der Absatz oben für `fetch` als blind ausweist. Er sah
 * `client.request(` nicht, und der Lauf sagte dazu 45/0 (Bedrohungsmodell
 * 30.1.2). Die Regel kommt jetzt aus `request-scan.mjs` und hat dieselbe
 * Bauart wie die `fetch`-Regel: die bekannten Nicht-Aufrufe namentlich, danach
 * jedes verbliebene `request` als Wort. Die Gegenproben stehen in Abschnitt 6.
 */
const strayRequest = strayRequestAccess(webFiles, WEB_REQUEST_HOME);

check(
  `\`fetch\` steht nur in api/client.ts (${String(webFiles.length)} Dateien durchgesehen)`,
  strayFetch.length === 0,
  strayFetch.map(describeStray).join(' | '),
);
check(
  `\`request\` steht nur in api/client.ts, wo es entsteht, und in ` +
    `${WEB_CALLER_NAMES.length === 1 ? 'der einen gemessenen Aufrufdatei' : `den ${String(WEB_CALLER_NAMES.length)} gemessenen Aufrufdateien`}: ` +
    `${WEB_CALLER_NAMES.join(', ')}`,
  strayRequest.length === 0,
  strayRequest.map(describeStray).join(' | '),
);

// ---------------------------------------------------------------------------
section('2  Jeder Aufruf trifft eine Operation, die es gibt');
// ---------------------------------------------------------------------------

check('kein Aufruf zeigt auf einen Weg, den der Dienst nicht führt', of('route').length === 0, [
  ...new Set(of('route').map((finding) => finding.message)),
].join(' | '));

/*
 * Und die Gegenrichtung, ohne die Add-in-Routen: Eine Operation, die die
 * Oberfläche nie anruft, ist entweder tot oder eine Funktion, die niemand
 * erreicht. Beides gehört angesehen — deshalb steht die Ausnahmeliste hier
 * ausgeschrieben und nicht als „meistens ruft sie alles an".
 */
const NOT_CALLED_BY_UI = new Set([
  // Die vier Add-in-Routen. **Anderer Aufrufer, nicht ungeprüft** (T-132,
  // O-M): Dass jede von ihnen im Aufgabenbereich einen Aufrufer hat, misst
  // Abschnitt 7 — mit demselben Leser und demselben Urteil.
  //
  // Vier seit T-247. Eine fünfte, `addAddinTodoAttachment`, stand hier von
  // PR #16 bis zur Entscheidung E-100 gegen das Anhängen über das Add-in
  // (A-19.19). Sie ist ersatzlos gefallen — samt Route, Aufrufer im
  // Aufgabenbereich und Eintrag in der Beschreibung.
  'getAddinContext',
  'findAddinDuplicates',
  'createAddinTodo',
  'createAddinTimeEntry',
  /*
   * Hier standen bis T-253-2 `getBoard` (T-066) und `getVersionCheck` (T-138).
   * Beide waren **Übergaben** an frontend-dev — „die Oberfläche ruft diese
   * Route noch nicht an, `apps/web` gehört einem anderen Agenten" —, und beide
   * Übergaben sind längst eingelöst:
   *
   *   - `features/board/api.ts:86` ruft `/board`, `BoardScreen.tsx:159` ruft
   *     `getBoard(…)`;
   *   - `api/endpoints.ts:416` ruft `/version-check`, `useUpdateNotice.ts:145`
   *     ruft `getVersionCheck()`.
   *
   * Die alten Zeilen haben den Lauf nicht rot gemacht — ein Eintrag zuviel
   * unterdrückt nur einen Befund, den es nicht gibt. Sie haben etwas
   * Schlimmeres getan: Sie haben zwei Absätze lang einen Bauzustand behauptet,
   * den es seit Wellen nicht mehr gab, und wer sie las, glaubte ihn.
   *
   * Deshalb reicht das Streichen nicht. Unmittelbar unter dem Prüfsatz stehen
   * seit T-253-2 zwei Wächter, die genau diese Sorte Leiche finden, statt sie
   * jemandem beim Lesen auffallen zu lassen: ein Eintrag, der **angerufen**
   * wird, und ein Eintrag, den die Beschreibung **nicht mehr führt** (das wäre
   * `addAddinTodoAttachment` nach E-100 gewesen).
   */
]);
const uncalled = [...operations.entries()]
  .filter(([key, operation]) => !result.covered.has(key) && !NOT_CALLED_BY_UI.has(operation.id))
  .map(([key, operation]) => `${key} (${operation.id})`);
check(
  `jede Operation außerhalb von /addin hat einen Aufrufer (${operations.size - NOT_CALLED_BY_UI.size})`,
  uncalled.length === 0,
  uncalled.join(', '),
);

/*
 * ===========================================================================
 * Und die Ausnahmeliste selbst wird gemessen (T-253-2)
 * ===========================================================================
 *
 * Eine Ausnahmeliste hat zwei Zustände, die niemandem auffallen, weil beide
 * **grün** aussehen:
 *
 *   1. Der Eintrag ist eingelöst — die Oberfläche ruft die Route inzwischen an.
 *      Der Prüfsatz oben zieht ihn trotzdem ab und schweigt.
 *   2. Der Eintrag zeigt ins Leere — die Operation heißt anders oder ist
 *      gefallen. Auch dann zieht er ab und schweigt.
 *
 * Beides ist derselbe Fehler wie in Abschnitt 6 vor T-253-2: eine Zusage, die
 * nur so lange stimmt, wie zufällig niemand etwas verschoben hat. Sie wird
 * jetzt gemessen, mit Gegenprobe zu jeder Richtung — „nichts gefunden" muß von
 * „nichts angesehen" unterscheidbar bleiben.
 */
const OPERATION_IDS = new Map([...operations.entries()].map(([key, operation]) => [operation.id, key]));

/** Einträge, die die Oberfläche inzwischen anruft — die Ausnahme ist eingelöst. */
const eingeloesteAusnahmen = (menge) =>
  [...menge].filter((id) => {
    const key = OPERATION_IDS.get(id);
    return key !== undefined && result.covered.has(key);
  });

/** Einträge, die die Beschreibung nicht (mehr) führt — die Ausnahme zeigt ins Leere. */
const unbekannteAusnahmen = (menge) => [...menge].filter((id) => !OPERATION_IDS.has(id));

const eingeloest = eingeloesteAusnahmen(NOT_CALLED_BY_UI);
check(
  `kein Eintrag der Ausnahmeliste wird inzwischen doch angerufen (${String(NOT_CALLED_BY_UI.size)} geprüft gegen ${String(result.covered.size)} angerufene Operationen)`,
  eingeloest.length === 0,
  `${eingeloest.join(', ')} — die Übergabe ist eingelöst, die Zeile gehört gestrichen`,
);
const unbekannt = unbekannteAusnahmen(NOT_CALLED_BY_UI);
check(
  `jeder Eintrag der Ausnahmeliste ist eine Operation, die es gibt (${String(NOT_CALLED_BY_UI.size)} gegen ${String(OPERATION_IDS.size)})`,
  unbekannt.length === 0,
  `${unbekannt.join(', ')} — die Beschreibung führt diese Kennung nicht`,
);

/*
 * Die Gegenproben. Sie fassen die echte Liste nicht an, sondern halten
 * denselben Regeln je eine Menge hin, bei der die Antwort feststeht: eine
 * gemessen angerufene Kennung und eine erfundene.
 */
const [eineAngerufene] = [...operations.entries()]
  .filter(([key]) => result.covered.has(key))
  .map(([, operation]) => operation.id);
check(
  `Gegenprobe: eine angerufene Kennung (${eineAngerufene ?? '—'}) in der Ausnahmeliste würde gefunden`,
  eineAngerufene !== undefined && eingeloesteAusnahmen(new Set([eineAngerufene])).length === 1,
  eineAngerufene === undefined
    ? 'keine einzige Operation gilt als angerufen — dann prüft dieser Abschnitt nichts'
    : 'die Regel sieht eine angerufene Ausnahme nicht',
);
check(
  'Gegenprobe: eine erfundene Kennung in der Ausnahmeliste würde gefunden, eine echte nicht',
  unbekannteAusnahmen(new Set(['dieseOperationGibtEsNicht'])).length === 1 &&
    eineAngerufene !== undefined &&
    unbekannteAusnahmen(new Set([eineAngerufene])).length === 0,
  'die Regel sagt zu jeder Kennung dasselbe',
);

// ---------------------------------------------------------------------------
section('3  Die Rümpfe: jeder gesendete Schlüssel wird auch gelesen');
// ---------------------------------------------------------------------------

check(
  'kein Rumpfschlüssel, den die getroffene Route nicht kennt',
  of('body').length === 0,
  of('body')
    .map((finding) => finding.message)
    .join(' | '),
);

/*
 * Die Gegenrichtung ist **keine** Beanstandung, sondern eine Frage: Ein Feld,
 * das eine Route liest und das die Oberfläche nie sendet, ist entweder eine
 * Einstellmöglichkeit, die es in der Anwendung nicht gibt, oder ein Rest.
 *
 * Die Liste steht hier ausgeschrieben, mit Begründung. Wächst sie, wird dieser
 * Lauf rot und jemand muss den Zusatz benennen — genau wie bei den blinden
 * Flecken.
 */
const NEVER_SENT = {
  // Die Reihenfolge der Spalten setzt `PUT /todo-statuses/order` als Ganzes
  // (A-5.4). Beim Anlegen ist 0 der Vorgabewert: hinten anhängen.
  createTodoStatus: ['position'],
  // Hier stand bis T-253-2 `createTodo: ['tagNames']` — die Übergabe aus
  // T-058: „Die Fachlogik steht, die Bedienmöglichkeit fehlt." Sie ist
  // eingelöst; `features/todos/TodoFormDialog.tsx:113` schickt `tagNames`, und
  // `features/tags/TagInput.tsx` ist die Bedienmöglichkeit dazu. Die alte
  // Zeile hat den Lauf nicht rot gemacht, sondern nur einen Bauzustand
  // behauptet, den es nicht mehr gab — dieselbe Leiche wie `getBoard` und
  // `getVersionCheck` in Abschnitt 2, und **gefunden** hat sie nicht ein
  // Leser, sondern der Wächter unten.
  // `createPool` und `updatePool` standen hier bis T-074 mit `position` und
  // `placement`. Beide Übergaben sind eingelöst: T-072 hat der Oberfläche ein
  // gemeinsames Formular für Pool und Spalte gegeben, das den Anzeigeort als
  // eigenes Feld führt, und `PoolWrite` trägt seitdem beide Schlüssel. Die
  // Zeilen sind deshalb weg statt fortgeschrieben — ein Zusatz, der nicht mehr
  // gilt, macht die Liste zum Rauschen.
  //
  // Die vier Achsen aus T-076 standen hier bis T-080 — ausgeschlossene Tags,
  // Status, Erledigt, Exportstatus — als Übergabe an den frontend-dev. T-079
  // hat das Regelformular gebaut, und `PoolWrite` schickt seitdem alle vier.
  // Die Zeilen sind deshalb weg statt fortgeschrieben, aus demselben Grund wie
  // oben: Ein Zusatz, der nicht mehr gilt, macht die Liste zum Rauschen.
};
const surprises = [];
for (const [id, schema] of Object.entries(REQUEST_SCHEMAS)) {
  const sent = result.sentKeys.get(id);
  if (sent === undefined) continue; // Route ohne Aufrufer: schon in Abschnitt 2
  const allowed = NEVER_SENT[id] ?? [];
  for (const name of fieldsOf(schema).names) {
    if (sent.has(name) || allowed.includes(name)) continue;
    surprises.push(`${id}.${name}`);
  }
}
check(
  'kein Feld, das der Dienst liest und die Oberfläche unerklärt nie sendet',
  surprises.length === 0,
  surprises.join(', '),
);

/*
 * Und dieselbe Messung an der Liste selbst (T-253-2).
 *
 * `NEVER_SENT` ist dieselbe Bauart wie `NOT_CALLED_BY_UI` in Abschnitt 2 und
 * hat dieselben zwei stillen Zustände: Der Zusatz ist **eingelöst** — die
 * Oberfläche sendet das Feld inzwischen —, oder er zeigt **ins Leere** — die
 * Route liest das Feld nicht mehr. In beiden Fällen überspringt die Schleife
 * oben den Namen und sagt nichts.
 *
 * Der Text bei `createTodo.tagNames` verlangt ausdrücklich, daß die Zeile
 * fällt, sobald die Oberfläche sendet („Wer die Zeile entfernt, ohne dass die
 * Oberfläche `tagNames` sendet, bekommt den Befund zurück"). Die Gegenrichtung
 * stand nirgends und wird jetzt gemessen.
 */
/** Zusätze, die die Oberfläche inzwischen sendet — der Zusatz ist eingelöst. */
const eingeloesteZusaetze = (liste) =>
  Object.entries(liste).flatMap(([id, felder]) => {
    const sent = result.sentKeys.get(id);
    if (sent === undefined) return [];
    return felder.filter((name) => sent.has(name)).map((name) => `${id}.${name}`);
  });

/** Zusätze, die kein Schema mehr führt — der Zusatz zeigt ins Leere. */
const unbekannteZusaetze = (liste) =>
  Object.entries(liste).flatMap(([id, felder]) => {
    const schema = REQUEST_SCHEMAS[id];
    if (schema === undefined) return [`${id} (diese Route liest keinen Rumpf)`];
    const namen = fieldsOf(schema).names;
    return felder.filter((name) => !namen.includes(name)).map((name) => `${id}.${name}`);
  });

const zusatzZahl = Object.values(NEVER_SENT).flat().length;
const eingeloesteFelder = eingeloesteZusaetze(NEVER_SENT);
check(
  `kein Zusatz in der Liste, den die Oberfläche inzwischen doch sendet (${String(zusatzZahl)} geprüft)`,
  eingeloesteFelder.length === 0,
  `${eingeloesteFelder.join(', ')} — der Zusatz ist eingelöst, die Zeile gehört gestrichen`,
);
const unbekannteFelder = unbekannteZusaetze(NEVER_SENT);
check(
  `jeder Zusatz in der Liste ist ein Feld, das die Route wirklich liest (${String(zusatzZahl)} geprüft)`,
  unbekannteFelder.length === 0,
  `${unbekannteFelder.join(', ')} — die Route liest diesen Namen nicht`,
);

/*
 * Die Gegenproben zu beidem, nach demselben Muster wie in Abschnitt 2: Nicht
 * die echte Liste wird verbogen, sondern denselben Regeln wird je eine
 * künstliche Liste hingehalten, bei der die Antwort feststeht — ein gemessen
 * **gesendetes** Feld und ein erfundenes.
 */
const [einGesendetes] = [...result.sentKeys.entries()]
  .filter(([id, keys]) => REQUEST_SCHEMAS[id] !== undefined && keys.size > 0)
  .map(([id, keys]) => ({ id, name: [...keys][0] }));
check(
  `Gegenprobe: ein gesendetes Feld (${einGesendetes === undefined ? '—' : `${einGesendetes.id}.${einGesendetes.name}`}) als Zusatz fiele als eingelöst auf`,
  einGesendetes !== undefined &&
    eingeloesteZusaetze({ [einGesendetes.id]: [einGesendetes.name] }).length === 1,
  einGesendetes === undefined
    ? 'kein einziges Feld gilt als gesendet — dann prüft diese Regel nichts'
    : 'die Regel sieht einen eingelösten Zusatz nicht',
);
check(
  'Gegenprobe: ein erfundener Zusatz fiele als „liest die Route nicht" auf',
  einGesendetes !== undefined &&
    unbekannteZusaetze({ [einGesendetes.id]: ['diesesFeldGibtEsNicht'] }).length === 1 &&
    unbekannteZusaetze({ [einGesendetes.id]: [einGesendetes.name] }).length === 0,
  'die Regel sagt zu jedem Namen dasselbe',
);

// ---------------------------------------------------------------------------
section('4  Die Fragezeichenparameter: jeder gesendete Name ist beschrieben');
// ---------------------------------------------------------------------------

check(
  'kein Abfrageschlüssel, den die getroffene Operation nicht führt',
  of('query').length === 0,
  of('query')
    .map((finding) => finding.message)
    .join(' | '),
);

// ---------------------------------------------------------------------------
section('5  Die blinden Flecken sind gezählt, nicht übergangen');
// ---------------------------------------------------------------------------

check(
  'kein Rumpf und keine Abfrage, deren Schlüssel dieser Leser nicht kennt',
  of('blind').length === 0,
  of('blind')
    .map((finding) => finding.message)
    .join(' | '),
);

const withBody = result.calls.filter((call) => call.body !== null).length;
const withQuery = result.calls.filter((call) => call.query !== null).length;
check(
  `es wurde wirklich verglichen: ${withBody} Rümpfe und ${withQuery} Abfragen`,
  withBody >= 25 && withQuery >= 5,
);

// ---------------------------------------------------------------------------
section('6  Der Prüfer prüft sich selbst — mit den drei Namen aus T-050');
// ---------------------------------------------------------------------------

/*
 * Ein Prüfer, der nichts findet, sieht genauso aus wie eine Datei, die stimmt.
 * Der Unterschied lässt sich nur zeigen, indem man ihm etwas Falsches hinhält.
 *
 * Genommen wird nicht ein erfundenes Beispiel, sondern der **echte** Text
 * dieser Datei mit den echten Namen von T-050 darin — im Arbeitsspeicher.
 * `apps/web` wird dabei nicht angefasst.
 *
 * Lässt sich eine Ersetzung nicht anwenden, weil jemand die Stelle
 * umgeschrieben hat, wird dieser Lauf rot und sagt welche. Das ist die
 * richtige Antwort: Eine Selbstprobe, die ins Leere greift, ist keine.
 */
const REGRESSIONS = [
  {
    name: '`neuerParentId` statt `newParentId` (S-08 konnte keinen Ordner verschieben)',
    pattern: /body:\s*\{\s*newParentId\s*\}/,
    replacement: 'body: { neuerParentId: newParentId }',
    kind: 'body',
  },
  {
    name: '`reihenfolge` statt `order` (die Pfeile der Spaltenverwaltung wirkten nie)',
    pattern: /body:\s*\{\s*order\s*\}/,
    replacement: 'body: { reihenfolge: order }',
    kind: 'body',
  },
  {
    name: '`nurOffene` statt `includeCompleted` (still wirkungslos)',
    pattern: /includeCompleted:\s*"true"/,
    replacement: 'nurOffene: "true"',
    kind: 'query',
  },
  {
    name: 'ein Weg, den es nicht gibt',
    pattern: /"\/tag-tree"/,
    replacement: '"/tag-baum"',
    kind: 'route',
  },
];

/*
 * Gemessen wird der **Zuwachs** gegenüber dem unveränderten Text. Damit steht
 * diese Selbstprobe auch dann noch, wenn die Datei einmal wirklich einen
 * Fehler hat: Der Prüfer muss dann immer noch genau eine Beanstandung mehr
 * finden. Die Ersetzungen sind deshalb einzeilig und lassen die Zeilenzahl
 * unangetastet — sonst verschöben sich die Zeilennummern der übrigen Befunde
 * und der Vergleich zählte Gespenster.
 */
const label = (finding) => `${finding.kind}: ${finding.message}`;
const baseline = new Set(result.findings.map(label));

/*
 * ===========================================================================
 * Wer die Stelle trägt — und warum „genau eine" die falsche Frage war
 * (T-253-2)
 * ===========================================================================
 *
 * Welche Aufrufdatei die Stelle trägt, wird **gesucht** und nicht gewußt
 * (T-250-2). Bis dahin stand hier `callerText` — die eine Sammelstelle. Mit dem
 * Umbau wandert jede dieser vier Stellen in einen Merkmalsordner, und eine
 * Selbstprobe, die dann ins Leere greift, ist keine.
 *
 * Bis T-253-2 verlangte die Probe **genau eine** Trägerin, mit der Begründung:
 * „Zwei heißt: Der Zuwachs unten wäre zwei, und die Probe verlangt eins."
 * Dieser Satz war schlicht falsch. Verdorben wird **eine** Datei — `replace`
 * ohne `g` an genau einer Stelle —, und der Zuwachs ist deshalb eins,
 * gleichgültig wie viele andere Dateien dieselbe Stelle auch tragen. Die Zahl
 * hat nie gemessen, was sie zu messen vorgab.
 *
 * Was sie tatsächlich gemessen hat, ist die **Aufteilung des Ordners**: In
 * Welle 4 lagen `getBoard` und `listPoolTodos` kurzzeitig in zwei Merkmalen,
 * beide mit `includeCompleted: "true"`, und der Lauf war rot, ohne daß an der
 * Anforderung irgend etwas fehlte. Er ist danach wieder grün geworden, weil
 * frontend-dev die beiden aus **sachlichen** Gründen zusammengelegt hat — ein
 * grüner Haken aus einem Zufall. Es ist derselbe Fehler wie bei F-22 und bei
 * der Stichprobe aus T-251-2, zum dritten Mal: eine Zusage, deren Menge an der
 * Ordnerstruktur aufgespannt ist statt an der Anforderung.
 *
 * ===========================================================================
 * Was die Selbstprobe zusichern soll
 * ===========================================================================
 *
 * Sie sichert **nicht** zu, wo ein Aufruf steht — das ist Abschnitt 1, und
 * dort gehört es hin. Sie sichert zu:
 *
 *   **Der Leser ist nicht blind. Setzt man einen der vier Fehler aus T-050 in
 *   eine Aufrufdatei zurück, beanstandet er ihn — in jeder Datei, die die
 *   Stelle trägt, und in wenigstens einer.**
 *
 * Daraus folgen zwei Prüfsätze je Probe, und keiner von beiden kennt eine Zahl
 * von Dateien:
 *
 *   1. **Untergrenze.** Mindestens eine Trägerin. Keine heißt: Die Stelle ist
 *      umgeschrieben worden, die Probe greift ins Leere und darf nicht als
 *      bestanden durchgehen. Das ist der Unterschied zwischen „nichts
 *      gefunden" und „nichts angesehen".
 *   2. **Je Trägerin ein Zuwachs.** Jede tragende Datei wird einzeln verdorben
 *      und muß genau **eine** Beanstandung der erwarteten Art mehr ergeben.
 *      Zwei Trägerinnen sind damit zwei Proben statt eines Fehlschlags — mehr
 *      Messung, nicht weniger.
 *
 * Welle 5 kann `features/export` also aufteilen, wie es fachlich richtig ist;
 * dieser Abschnitt wird davon weder zufällig rot noch zufällig grün.
 */

/** Die Aufrufdateien, in denen eine Stelle steht. Ohne `g`: `test` ist zustandslos. */
const traegerinnenVon = (pattern) => WEB_CALLER_FILES.filter((datei) => pattern.test(datei.source));

for (const regression of REGRESSIONS) {
  const traeger = traegerinnenVon(regression.pattern);
  check(
    `die Probe „${regression.name}" hat eine Trägerin (${String(traeger.length)} von ${String(WEB_CALLER_FILES.length)}: ${traeger.map((datei) => datei.name).join(', ') || '—'})`,
    traeger.length >= 1,
    `die Stelle steht in keiner der gelesenen Aufrufdateien: ${WEB_CALLER_NAMES.join(', ')}`,
  );
  for (const datei of traeger) {
    const spoiled = datei.source.replace(regression.pattern, regression.replacement);
    if (spoiled.split('\n').length !== datei.source.split('\n').length) {
      check(
        `die Probe „${regression.name}" bleibt in ${datei.name} einzeilig`,
        false,
        'die Ersetzung verschiebt Zeilen',
      );
      continue;
    }
    const found = inspectAll(
      WEB_CALLER_FILES.map((andere) =>
        andere.name === datei.name ? { ...andere, source: spoiled } : andere,
      ),
    ).findings.filter((finding) => !baseline.has(label(finding)));
    check(
      `${regression.name} wird in ${datei.name} gefunden`,
      found.length === 1 && found[0].kind === regression.kind,
      found.length === 0 ? 'nichts beanstandet' : found.map(label).join(' | '),
    );
    // Der Wortlaut des Befundes gehört in die Ausgabe und nicht nur ins Grüne:
    // Wer den Lauf liest, soll sehen, **was** der Prüfer über den wieder
    // eingesetzten Namen sagt — sonst ist auch diese Selbstprobe nur ein Haken.
    if (found.length === 1) console.log(`        → ${found[0].message}`);
  }
}

/*
 * Die Gegenprobe zur Trägerinnensuche, und sie prüft **die Regel**, nicht den
 * Bestand: Eine Stelle, die es nicht gibt, muß **keine** Trägerin haben, und
 * ein Wort, das aus einer Aufrufdatei selbst genommen ist, muß mindestens eine
 * haben. Ohne die erste Hälfte wäre eine Suche, die jede Datei für eine
 * Trägerin hält, von einer richtigen nicht zu unterscheiden — die Untergrenze
 * oben wäre dann in jedem Baum grün, auch im leeren. Ohne die zweite wäre eine
 * Suche, die **nie** etwas findet, ebenso grün, und jede Probe darüber wäre in
 * Wahrheit übersprungen.
 */
const [ersteAufrufdatei] = WEB_CALLER_FILES;
const einWortDaraus = ersteAufrufdatei?.source.match(/[A-Za-z]{8,}/)?.[0];
check(
  `Gegenprobe: eine erfundene Stelle hat keine Trägerin, „${einWortDaraus ?? '—'}" aus ${ersteAufrufdatei?.name ?? '—'} hat eine (${String(WEB_CALLER_FILES.length)} Aufrufdateien abgesucht)`,
  traegerinnenVon(/dieseStelleStehtInKeinerAufrufdatei/).length === 0 &&
    einWortDaraus !== undefined &&
    traegerinnenVon(new RegExp(einWortDaraus)).length >= 1,
  'die Suche sagt zu jeder Stelle dasselbe',
);

/*
 * Und die Umkehrung: Der unveränderte Text darf **nichts** ergeben. Ohne diese
 * Probe könnte ein Prüfer, der immer etwas findet, die vier Proben oben
 * bestehen und trotzdem unbrauchbar sein.
 */
check(
  'der unveränderte Text ergibt keine einzige Beanstandung',
  result.findings.length === 0,
  result.findings.map(label).join(' | '),
);

/*
 * ===========================================================================
 * Und die Zusage aus Abschnitt 1 prüft sich ebenfalls selbst (T-188, A-A-40)
 * ===========================================================================
 *
 * Bis T-188 stand für „es gibt keinen zweiten Weg zum Dienst" **keine**
 * Gegenprobe da. Vier der Selbstproben oben decken den Vergleich der
 * Schlüssel; die Zusage, ohne die dieser Vergleich gar nichts wert wäre —
 * daß nämlich eine Datei genügt —, wurde mit einem Ausdruck gemessen, den
 * dieselbe Werkstatt an anderer Stelle schon als blind befunden hatte.
 *
 * Gemessen wird wie bei den Regressionen oben: der **echte** Dateibestand im
 * Arbeitsspeicher, eine eingesetzte Datei dazu, und verlangt ist genau **ein**
 * Zuwachs gegenüber dem unveränderten Lauf. Damit stehen diese Proben auch
 * dann noch, wenn der Bestand einen echten Fund enthält.
 *
 * `apps/web` und `apps/outlook-addin` werden dabei nicht angefaßt; die
 * eingesetzte Datei entsteht als Eintrag in einer Aufstellung und nie auf der
 * Platte.
 */
const FETCH_FORMS = [
  {
    name: 'nacktes `fetch(`',
    source: 'export const laden = async () => fetch(ZIEL);\n',
  },
  {
    name: '`globalThis.fetch(` — die Lücke aus T-143 S-1',
    source: 'export const laden = async () => globalThis.fetch(ZIEL);\n',
  },
  {
    name: '`window.fetch(` — die Schreibweise, die am Baum steht',
    source: 'export const laden = async () => window.fetch(ZIEL);\n',
  },
  {
    name: '`self.fetch(`',
    source: 'export const laden = async () => self.fetch(ZIEL);\n',
  },
  {
    name: 'eine Zerlegung: `const { fetch: holen } = globalThis`',
    source: 'const { fetch: holen } = globalThis;\nexport const laden = async () => holen(ZIEL);\n',
  },
];

/**
 * Die Umkehrung, und sie ist hier so wichtig wie die fünf oben.
 *
 * Ein Wächter, der auf **jedes** Vorkommen von `fetch` anspringt, bestünde die
 * fünf Proben und wäre trotzdem unbrauchbar: Er meldete die Beschreibung einer
 * Datei, die Kopfzeile `sec-fetch-site` und den Port selbst. Der nächste, der
 * ihn liest, lockerte ihn — und zwar an der Stelle, an der er richtig ist.
 */
const FETCH_HARMLESS = {
  name: 'Prosa, `sec-fetch-site` und der Port sind kein zweiter Weg',
  source: [
    '// Diese Ansicht ruft fetch(…) niemals selbst auf.',
    '/* Auch globalThis.fetch steht hier nur in einem Absatz. */',
    "const seite = kopfzeilen.get('sec-fetch-site');",
    'const antwort = await options.fetch(ZIEL);',
    "const grund = 'fetch_context_not_allowed';",
    '',
  ].join('\n'),
};

const INJECTED = 'ui/Eingesetzt.tsx';

function proveFetchGuard(who, files, allowed) {
  const baseline = strayGlobalFetch(files, allowed).map((finding) => finding.name);
  const probe = (source) =>
    strayGlobalFetch([...files, { name: INJECTED, source }], allowed)
      .map((finding) => finding.name)
      .filter((name) => !baseline.includes(name));

  for (const form of FETCH_FORMS) {
    const found = probe(form.source);
    check(
      `${who}: ${form.name} wird gefunden`,
      found.length === 1 && found[0] === INJECTED,
      found.length === 0 ? 'nichts beanstandet' : found.join(', '),
    );
  }

  const harmless = probe(FETCH_HARMLESS.source);
  check(`${who}: ${FETCH_HARMLESS.name}`, harmless.length === 0, harmless.join(', '));
}

proveFetchGuard('die Oberfläche', webFiles, WEB_FETCH_HOME);

/*
 * Und die Begründung selbst als Messung: Der Ausdruck, der bis T-188 in
 * Abschnitt 1 und 7 stand, sieht vier dieser fünf Schreibweisen nicht. Der
 * Satz stand bisher in einem Bericht; ein Satz in einem Bericht altert, eine
 * Zahl in einem Lauf nicht. Setzt ihn jemand zurück, fallen mit ihm vier
 * Proben oben — und diese Zeile sagt, warum.
 */
const blindForms = FETCH_FORMS.filter((form) => !BLIND_FETCH_CALL.test(form.source));
check(
  `der Ausdruck aus T-143 S-1 sieht vier der fünf Schreibweisen nicht (${blindForms.length})`,
  blindForms.length === 4,
  blindForms.map((form) => form.name).join(', '),
);

/*
 * ===========================================================================
 * Und dieselben Proben für die Zwillingszeile (T-231, A-A-62)
 * ===========================================================================
 *
 * Die `request`-Zusage in Abschnitt 1 hatte bis T-231 **null** Gegenproben und
 * wurde mit genau dem Ausdruck gemessen, den der Absatz über den `fetch`-Proben
 * als blind ausweist. Security-checker hat den offenen Weg in T-230 gegangen
 * (Bedrohungsmodell 30.1.2): eine Ansicht mit `import * as client` und
 * `client.request('/todos/…', { method: 'DELETE' })` — der Lauf sagte 45/0.
 * Der `fetch`-Wächter fängt sie nicht, denn sie ruft kein `fetch`; sie benutzt
 * das eine, das erlaubt ist.
 *
 * ===========================================================================
 * Welchen Weg diese Proben auslassen — und wer ihn geht
 * ===========================================================================
 *
 * Das ist der Satz aus T-230, und er gilt für die sechs oben genauso wie für
 * die sechs hier: Beide Reihen setzen ihre Kunstquelle als Eintrag in eine
 * **Aufstellung** ein und nie auf die Platte. Damit prüfen sie das **Sieb** und
 * niemals die **Ernte** — ein Sammler, der nichts einsammelt, ließe alle zwölf
 * grün. Das ist keine Nachlässigkeit, sondern eine benannte Auslassung: Die
 * Ernte misst `proveHarvest` in Abschnitt 1 und 7, mit einer Untergrenze und
 * einer benannten Datei, **vor** der Zusage (A-A-61). Erst beide Hälften
 * zusammen sind die Aussage; eine allein ist keine.
 */
const REQUEST_FORMS = [
  {
    name: 'nacktes `request<T>(` aus einer benannten Einfuhr',
    source: "import { request } from '../api/client';\nexport const laden = async () => request<Todo[]>(WEG);\n",
  },
  {
    name: '`client.request(` über den Namensraum — die Lücke aus T-230-2',
    source: "import * as client from '../api/client';\nexport const laden = async () => client.request(WEG);\n",
  },
  {
    name: '`globalThis.request(` — dieselbe Lücke, anderer Träger',
    source: 'export const laden = async () => globalThis.request(WEG);\n',
  },
  {
    name: "der Name als Zeichenkette: `client['request'](`",
    source: "import * as client from '../api/client';\nexport const laden = async () => client['request'](WEG);\n",
  },
  {
    name: 'eine Zerlegung: `const { request: senden } = client`',
    source: "import * as client from '../api/client';\nconst { request: senden } = client;\nexport const laden = async () => senden(WEG);\n",
  },
  /*
   * Die sechste Probe ist neu mit F-22 und misst die **Menge** statt der Form.
   *
   * Seit T-250-2 darf `request` in jeder `api.ts` eines Merkmalsordners stehen.
   * Die naheliegende und falsche Umsetzung dieser Regel wäre ein Muster über den
   * Namen: „heißt es `features/…/api.ts`, ist es erlaubt". Dann wäre der
   * Wächter mit **einer** neuen Datei zu umgehen, die niemand angelegt hat, und
   * er sagte trotzdem grün.
   *
   * Erlaubt ist deshalb nicht, was so heißt, sondern was auf der Platte liegt
   * und eingesammelt wurde. Diese Kunstdatei liegt nirgends — und wird gefunden.
   */
  {
    name: 'eine erfundene `features/erfunden/api.ts` — der Name allein erlaubt nichts',
    ort: 'features/erfunden/api.ts',
    source: "import { request } from '../../api/client';\nexport const laden = async () => request(WEG);\n",
  },
];

/**
 * Die Umkehrung, und sie ist hier so wichtig wie die fünf oben.
 *
 * Ein Wächter, der auf jedes Vorkommen der Zeichenfolge `request` anspringt,
 * bestünde die fünf Proben und wäre unbrauchbar: Er meldete `requestStop`,
 * `requestAnimationFrame`, den Typnamen `RequestOptions`, die Kopfzeile
 * `x-request-id` und den Portaufruf `options.request(` — und der nächste, der
 * ihn liest, lockerte ihn an der Stelle, an der er richtig ist.
 */
const REQUEST_HARMLESS = {
  name: 'Prosa, `requestStop`, `x-request-id` und der Port sind kein zweiter Weg',
  source: [
    '// Diese Ansicht ruft request(…) niemals selbst auf.',
    '/* Auch client.request steht hier nur in einem Absatz. */',
    'const stoppen = () => timer.requestStop();',
    'window.requestAnimationFrame(() => stoppen());',
    "const kennung = kopfzeilen.get('x-request-id');",
    'const antwort = await options.request(WEG);',
    'const feld: RequestOptions = {};',
    '',
  ].join('\n'),
};

function proveRequestGuard(who, files, allowed) {
  const baseline = strayRequestAccess(files, allowed).map((finding) => finding.name);
  /*
   * Der **Ort** der Kunstdatei ist seit T-250-2 wählbar. Bis dahin lag jede
   * Probe unter `ui/Eingesetzt.tsx`, und das genügte, solange die Erlaubnis an
   * zwei festen Dateien hing. Sie hängt jetzt an einer gemessenen Menge, und
   * damit wird der Ort selbst zum Gegenstand der Probe.
   */
  const probe = (source, ort = INJECTED) =>
    strayRequestAccess([...files, { name: ort, source }], allowed)
      .map((finding) => finding.name)
      .filter((name) => !baseline.includes(name));

  for (const form of REQUEST_FORMS) {
    const ort = form.ort ?? INJECTED;
    const found = probe(form.source, ort);
    check(
      `${who}: ${form.name} wird gefunden`,
      found.length === 1 && found[0] === ort,
      found.length === 0 ? `nichts beanstandet (${ort})` : found.join(', '),
    );
  }

  const harmless = probe(REQUEST_HARMLESS.source);
  check(`${who}: ${REQUEST_HARMLESS.name}`, harmless.length === 0, harmless.join(', '));
}

proveRequestGuard('die Oberfläche', webFiles, WEB_REQUEST_HOME);

/*
 * Und die Begründung als Messung, wie oben: Der Ausdruck, der bis T-231 in
 * Abschnitt 1 stand, sieht vier dieser Schreibweisen nicht. Setzt ihn jemand
 * zurück, fallen mit ihm vier Proben — und diese Zeile sagt, warum.
 *
 * Die sechste Probe aus T-250-2 zählt hier **nicht** mit: Sie trägt ein nacktes
 * `request(`, das auch der blinde Ausdruck sieht. Sie misst den Ort und nicht
 * die Schreibweise, und die Zahl unten bleibt deshalb vier.
 */
const blindRequestForms = REQUEST_FORMS.filter((form) => !BLIND_REQUEST_CALL.test(form.source));
check(
  `der Ausdruck aus T-230-2 sieht 4 der ${REQUEST_FORMS.length} Proben nicht (${blindRequestForms.length})`,
  blindRequestForms.length === 4,
  blindRequestForms.map((form) => form.name).join(', '),
);

// ---------------------------------------------------------------------------
section('7  Der zweite Aufrufer: der Aufgabenbereich des Add-ins (T-132, O-M)');
// ---------------------------------------------------------------------------

/*
 * Dieselben vier Fragen wie oben, an derselben Stelle beantwortet: Liest der
 * Leser überhaupt etwas, trifft jeder Aufruf eine Operation, wird jeder
 * gesendete Schlüssel gelesen, und ist der Leser sich seiner blinden Flecken
 * bewusst.
 *
 * Der Unterschied zu Abschnitt 0 bis 5 ist die Gestalt des Aufrufs und die
 * Vorsilbe des Pfades. Das Urteil ist zeichengleich dasselbe.
 */
const addinRawCalls = [...addinText.matchAll(/\bcall\s*[<(]/g)].length;
check(
  `so viele Aufrufe gelesen wie im Rohtext stehen (${addinRawCalls})`,
  addinRawCalls > 0 && addin.calls.length === addinRawCalls,
  `gelesen ${addin.calls.length}`,
);
check(
  `die Typaufstellung des Add-ins ist gelesen (${ADDIN_CALLER.typeIndex.size} Typen)`,
  ADDIN_CALLER.typeIndex.has('CreateTodoRequest') && ADDIN_CALLER.typeIndex.has('BookRequest'),
);
check(
  'jeder Aufruf ist als Ganzes lesbar — Methode, Pfad, Rumpf, Abfrage',
  addin.unreadable.length === 0,
  addin.unreadable.join(' | '),
);

/*
 * Und die Zusicherung, ohne die das Lesen **einer** Datei nichts wert wäre:
 * Es gibt im Add-in keinen zweiten Weg zum Dienst. `fetch` steht dort
 * ausschließlich als Port — `options.fetch(...)` in `api/client.ts` —, und
 * kein Bildschirm setzt selbst eine Anfrage zusammen.
 */
const addinFiles = quellbaum('@takt/outlook-addin', 'src', {
  mindestens: 25,
  endungen: new Set(BUNDLED_EXTENSIONS),
})
  .filter((file) => isBundledSource(file))
  .map((file) => ({ name: alsName(ADDIN_SOURCE_DIR, file), source: readFileSync(file, 'utf8') }));

proveHarvest('das Add-in', addinFiles, 25, [alsName(ADDIN_SOURCE_DIR, ADDIN_CALLER_PATH)]);

/**
 * Wie {@link WEB_FETCH_HOME}, und aus demselben Grund ausgeschrieben.
 *
 * **`ui/App.tsx` steht hier nicht** (T-188). Die Datei speist mit
 * `fetch: window.fetch.bind(window)` die Abholfunktion des Ports ein — kein
 * zweiter Weg zum Dienst, aber ein Zugriff auf das globale `fetch` außerhalb
 * von `api/client.ts`, und bis T-188 war er für diesen Wächter unsichtbar.
 * Sie einzutragen wäre eine Entscheidung über eine fremde Datei
 * (`apps/outlook-addin/**` gehört integration-dev) und nicht die Aufgabe
 * dieses Laufs. Er sagt, was er sieht; wo die Einspeisung hingehört,
 * entscheidet der Orchestrator.
 */
const ADDIN_FETCH_HOME = [alsName(ADDIN_SOURCE_DIR, ADDIN_CALLER_PATH)];

const strayAddinFetch = strayGlobalFetch(addinFiles, ADDIN_FETCH_HOME);
check(
  `\`fetch\` steht im Add-in nur in api/client.ts (${String(addinFiles.length)} Dateien durchgesehen)`,
  strayAddinFetch.length === 0,
  strayAddinFetch.map(describeStray).join(' | '),
);

check(
  'kein Aufruf des Add-ins zeigt auf einen Weg, den der Dienst nicht führt',
  addinOf('route').length === 0,
  [...new Set(addinOf('route').map((finding) => finding.message))].join(' | '),
);

/*
 * Die Gegenrichtung, und sie ist hier die wichtigere: Eine Add-in-Route ohne
 * Aufrufer wäre eine Tür, die der Dienst offenhält und die niemand benutzt —
 * genau die Sorte Fläche, die B-1.x nicht will. Die Liste steht in
 * `NOT_CALLED_BY_UI` und wird hier eingelöst.
 */
const addinOperations = [...operations.entries()].filter(([key]) => key.includes(' /addin/'));
const addinUncalled = addinOperations
  .filter(([key]) => !addin.covered.has(key))
  .map(([key, operation]) => `${key} (${operation.id})`);
check(
  `jede Operation unter /addin hat einen Aufrufer im Aufgabenbereich (${addinOperations.length})`,
  addinOperations.length > 0 && addinUncalled.length === 0,
  addinUncalled.join(', '),
);

check(
  'kein Rumpfschlüssel, den die getroffene Add-in-Route nicht kennt',
  addinOf('body').length === 0,
  addinOf('body')
    .map((finding) => finding.message)
    .join(' | '),
);

/*
 * Und die Umkehrung wie in Abschnitt 3: ein Feld, das die Add-in-Tür liest und
 * das der Aufgabenbereich nie sendet. Die Ausnahmeliste ist **leer**, und das
 * soll sie bleiben — wächst sie, gehört der Zusatz benannt.
 */
const ADDIN_NEVER_SENT = {};
const addinSurprises = [];
for (const [id, schema] of Object.entries(ADDIN_SCHEMAS)) {
  const sent = addin.sentKeys.get(id);
  if (sent === undefined) continue;
  const allowed = ADDIN_NEVER_SENT[id] ?? [];
  for (const name of fieldsOf(schema).names) {
    if (sent.has(name) || allowed.includes(name)) continue;
    addinSurprises.push(`${id}.${name}`);
  }
}
check(
  'kein Feld, das die Add-in-Tür liest und der Aufgabenbereich unerklärt nie sendet',
  addinSurprises.length === 0,
  addinSurprises.join(', '),
);

check(
  'kein Abfrageschlüssel, den die getroffene Add-in-Operation nicht führt',
  addinOf('query').length === 0,
  addinOf('query')
    .map((finding) => finding.message)
    .join(' | '),
);
check(
  'kein Rumpf und keine Abfrage des Add-ins, deren Schlüssel dieser Leser nicht kennt',
  addinOf('blind').length === 0,
  addinOf('blind')
    .map((finding) => finding.message)
    .join(' | '),
);

// ---------------------------------------------------------------------------
section('8  Und der Add-in-Leser prüft sich ebenfalls selbst');
// ---------------------------------------------------------------------------

/*
 * Dieselbe Probe wie in Abschnitt 6, mit den Namen dieser Tür. Ohne sie wäre
 * Abschnitt 7 grün, weil er nichts tut — und genau das ist der Zustand, in dem
 * die Aufruferseite des Add-ins bis T-132 war.
 */
const ADDIN_REGRESSIONS = [
  {
    name: '`tagNamen` statt `tagNames` (die Tür legte keine neuen Tags an)',
    pattern: /readonly tagNames: readonly string\[\];/,
    replacement: 'readonly tagNamen: readonly string[];',
    kind: 'body',
  },
  {
    name: '`callNummer` statt `callNumber` (die Duplikatsuche fände nichts)',
    pattern: /'\/api\/v1\/addin\/todo-matches', \{ callNumber \}/,
    replacement: "'/api/v1/addin/todo-matches', { callNummer: callNumber }",
    kind: 'query',
  },
  {
    name: 'ein Weg, den es nicht gibt',
    pattern: /'\/api\/v1\/addin\/context'/,
    replacement: "'/api/v1/addin/kontext'",
    kind: 'route',
  },
];

const addinBaseline = new Set(addin.findings.map(label));
for (const regression of ADDIN_REGRESSIONS) {
  const spoiled = addinText.replace(regression.pattern, regression.replacement);
  if (spoiled === addinText) {
    check(`die Probe „${regression.name}" lässt sich anwenden`, false, 'die Stelle wurde nicht gefunden');
    continue;
  }
  if (spoiled.split('\n').length !== addinText.split('\n').length) {
    check(`die Probe „${regression.name}" bleibt einzeilig`, false, 'die Ersetzung verschiebt Zeilen');
    continue;
  }
  const found = inspect(spoiled, {
    ...ADDIN_CALLER,
    // Die Typaufstellung wird mitverdorben: Die Anfragetypen stehen in
    // derselben Datei, und ein Leser, der den alten Namen behielte, prüfte
    // gegen eine Fassung, die es nicht mehr gibt.
    typeIndex: buildTypeIndex(spoiled, 'client.ts'),
  }).findings.filter((finding) => !addinBaseline.has(label(finding)));
  check(
    `${regression.name} wird gefunden`,
    found.length === 1 && found[0].kind === regression.kind,
    found.length === 0 ? 'nichts beanstandet' : found.map(label).join(' | '),
  );
  if (found.length === 1) console.log(`        → ${found[0].message}`);
}

check(
  'der unveränderte Text des Add-ins ergibt keine einzige Beanstandung',
  addin.findings.length === 0,
  addin.findings.map(label).join(' | '),
);

/*
 * Dieselben sechs Proben wie in Abschnitt 6, an der zweiten Tür (A-A-40).
 *
 * Sie sind hier **nicht** die Wiederholung der ersten: Der Bestand ist ein
 * anderer, die Ausnahmeliste ist eine andere, und der Zuwachs wird gegen einen
 * Grundstand gemessen, der heute nicht leer ist. Genau das ist der Fall, für
 * den die Zuwachsmessung gebaut ist — ein Wächter, der erst wieder proben darf,
 * wenn alles grün ist, probt nie dann, wenn es darauf ankommt.
 */
proveFetchGuard('der Aufgabenbereich', addinFiles, ADDIN_FETCH_HOME);

// ---------------------------------------------------------------------------
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exitCode = 1;
}
