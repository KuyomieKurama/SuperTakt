/**
 * Takt — wer greift auf die Anfragefunktion `request` zu (T-231, A-A-62).
 *
 * ===========================================================================
 * Warum es diese Datei gibt
 * ===========================================================================
 *
 * `proof-callers.mjs` liest **eine** Datei — `apps/web/src/api/endpoints.ts` —
 * und urteilt über alles, was die Oberfläche dem Dienst schickt. Diese
 * Beschränkung ist genau so viel wert wie die Zusicherung, dass es keinen
 * zweiten Weg gibt. Für `fetch` wird die Zusicherung seit T-188 mit
 * `fetch-scan.mjs` gemessen. Für `request` stand bis T-231 daneben:
 *
 * ```js
 * /(?<![\w.])request\s*[<(]/
 * ```
 *
 * Das ist **zeichengleich** der Ausdruck, den derselbe Lauf zwanzig Zeilen
 * darüber als blind ausweist und den T-146 für `fetch` ersetzt hat: Der
 * Rückblick auf `.` schließt **jedes** `.request` aus, um einen Fall
 * durchzulassen — und lässt damit `client.request(` durch. Security-checker hat
 * es in T-230 (Bedrohungsmodell 30.1.2) am Baum gemessen:
 *
 * ```ts
 * import * as client from "../api/client";
 * await client.request("/todos/…", { method: "DELETE" });   // 45/0, Code 0
 * import { request } from "../api/client";
 * await request("/todos/…", { method: "DELETE" });          // 44/1, Code 1
 * ```
 *
 * Beides ist derselbe Weg zum Dienst, mit demselben Sitzungsgeheimnis und
 * derselben Grundadresse, und beides geht an den Abschnitten 2 bis 5 von
 * `proof:callers` vorbei. Der `fetch`-Wächter fängt ihn ebensowenig: Diese
 * Ansicht ruft kein `fetch`, sie benutzt das eine, das erlaubt ist.
 *
 * ===========================================================================
 * Was die Regel sagt
 * ===========================================================================
 *
 * Dieselbe Bauart wie {@link ../scripts/fetch-scan.mjs}, und aus demselben
 * Grund: **nicht** „alles außer", sondern die bekannten Nicht-Aufrufe
 * namentlich, und danach jedes verbliebene `request` als **Wort**.
 *
 * Ein Wort und kein Aufruf (`request\s*[<(]`): `client['request']('/todos')`
 * und `const senden = client.request;` sind derselbe Zugriff und tragen keine
 * Klammer hinter dem Namen. Wer nach der Klammer sucht, misst die Schreibweise
 * und nicht den Zugriff.
 *
 * **Was die Wortgrenze von allein draußen hält**, ohne dass jemand eine
 * Ausnahme pflegen müsste: `requestStop`, `requestAnimationFrame`,
 * `RequestOptions`, `onRequest`. Hinter `request` steht dort ein Wortzeichen
 * oder davor ein Großbuchstabe; keines davon ist ein Treffer, und keines steht
 * in einer Liste, die jemand vergessen könnte.
 */

import { stripComments } from './fetch-scan.mjs';

/**
 * Die Formen, die **kein** Zugriff auf die Anfragefunktion sind.
 *
 * Heute steht hier ein Eintrag: `options.request` — die austauschbare
 * Anfragefunktion eines Ports, dieselbe Bauart wie `options.fetch` in
 * `fetch-scan.mjs` (E-066 Punkt 1). Am Baum gibt es sie derzeit nicht; sie
 * steht hier, weil A-A-62 verlangt, dass ein Portaufruf keinen falschen Alarm
 * auslöst, und weil die Gegenprobe dazu unten in `proof-callers.mjs` steht.
 *
 * **Eine Liste von Formen und keine Liste von Dateien** — umgekehrt als bei
 * {@link WEB_REQUEST_HOME}: Wo der Zugriff seinen Platz hat, ist eine Frage
 * der Datei; was gar kein Zugriff ist, eine Frage der Form.
 */
export const NON_CALLER_FORMS = [
  /(?<![\w$])options\s*\.\s*request\b/g,
];

/**
 * `request` als Wort, nachdem die bekannten Nicht-Aufrufe entfernt sind.
 *
 * Der Bindestrich in der Rückschau hält Schreibweisen wie `x-request-id`
 * draußen; ein **Punkt** steht nicht darin, und genau das ist der Unterschied
 * zum blinden Ausdruck, den diese Datei ersetzt.
 */
export const REQUEST_WORD = /(?<![\w$-])request\b/;

/**
 * Der Ausdruck, der bis T-231 in `proof-callers.mjs` stand — **nur noch als
 * Meßgegenstand**.
 *
 * Er urteilt nirgends mehr. Er steht hier, damit die Behauptung „er sieht die
 * Hälfte der Schreibweisen nicht" eine **Messung** ist und kein Absatz —
 * dieselbe Vorkehrung wie `BLIND_FETCH_CALL` in `fetch-scan.mjs`.
 */
export const BLIND_REQUEST_CALL = /(?<![\w.])request\s*[<(]/;

/** Ersetzt einen Treffer durch gleich viele Leerzeichen, Umbrüche bleiben. */
const blank = (match) => match.replace(/[^\n]/g, ' ');

/** Derselbe Text ohne die benannten Nicht-Aufrufe, längen- und zeilentreu. */
export function withoutNonCallerForms(code) {
  let rest = code;
  for (const form of NON_CALLER_FORMS) rest = rest.replace(form, blank);
  return rest;
}

/**
 * Jede Zeile einer **Quelldatei**, die auf die Anfragefunktion zugreift.
 *
 * Kommentare sind vorher entfernt — eine Datei darf in ihrer Beschreibung
 * sagen, dass sie `request` **nicht** ruft. Der Wortlaut der Meldung kommt
 * trotzdem aus der rohen Quelle, damit ein Leser die Zeile wiederfindet, wie
 * sie dasteht.
 */
export function findRequestAccess(source) {
  const scanned = withoutNonCallerForms(stripComments(source)).split('\n');
  const raw = source.split('\n');
  const hits = [];
  for (const [index, line] of scanned.entries()) {
    if (!REQUEST_WORD.test(line)) continue;
    hits.push({ line: index + 1, text: (raw[index] ?? line).trim() });
  }
  return hits;
}

/**
 * Welche Dateien greifen auf die Anfragefunktion zu, obwohl sie es nicht
 * dürfen?
 *
 * `files` sind `{ name, source }`; `allowed` ist die **ausgeschriebene** Liste
 * der Dateien, in denen der Zugriff seinen Platz hat. Ausgeschrieben und nicht
 * als Ausdruck: Wer eine Datei hinzufügt, soll sie eintragen und dabei merken,
 * dass er sie eintragen musste.
 */
export function strayRequestAccess(files, allowed) {
  const stray = [];
  for (const file of files) {
    if (allowed.includes(file.name)) continue;
    const hits = findRequestAccess(file.source);
    if (hits.length > 0) stray.push({ name: file.name, hits });
  }
  return stray;
}
