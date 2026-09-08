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
 * **b) Nur `endpoints.ts`.** Das ist keine Nachlässigkeit, sondern eine
 * gemessene Zusicherung: `apps/web/src/api/client.ts` ist die einzige Stelle
 * mit `fetch`, und außerhalb von `endpoints.ts` setzt keine Ansicht einen
 * Rumpf zusammen (T-050, Punkt 6). Abschnitt 1 misst das nach, statt es zu
 * glauben: kein Zugriff auf das globale `fetch` und keiner auf die
 * Anfragefunktion `request` außerhalb dieser beiden Dateien — **und** dass der
 * Sammler, der das misst, überhaupt etwas eingesammelt hat (T-231, A-A-61).
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

import { readdirSync, readFileSync } from 'node:fs';

import { z } from 'zod';

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
import { REQUEST_SCHEMAS as TODO_SCHEMAS } from '../src/routes/todos.ts';
import { REQUEST_SCHEMAS as STRUCTURE_SCHEMAS } from '../src/routes/structure.ts';
import { REQUEST_SCHEMAS as TIME_SCHEMAS } from '../src/routes/time.ts';
import { REQUEST_SCHEMAS as EXPORT_SCHEMAS } from '../src/routes/export.ts';
/*
 * Die Eingabeschemata der Add-in-Tür (T-132, O-M).
 *
 * `routes/addin/**` gehört integration-dev und wird hier **gelesen**, nicht
 * geändert. Anders als die vier Routendateien der Hauptfläche führt diese
 * Datei keine Aufstellung `REQUEST_SCHEMAS`; die Zuordnung zu den
 * Operationskennungen steht deshalb unten in `ADDIN_SCHEMAS` und nirgends
 * sonst. Die Schemata selbst sind dieselben Werte, die die Routen benutzen —
 * keine Abschrift.
 */
import { bookSchema, createTodoSchema } from '../src/routes/addin/schema.ts';

const SPEC_PATH = new URL('../openapi/takt-local-api.yaml', import.meta.url);
const CALLER_PATH = new URL('../../web/src/api/endpoints.ts', import.meta.url);
const TYPES_PATH = new URL('../../web/src/api/types.ts', import.meta.url);
const WEB_SOURCE_DIR = new URL('../../web/src/', import.meta.url);
const ADDIN_CALLER_PATH = new URL('../../outlook-addin/src/api/client.ts', import.meta.url);
const ADDIN_SOURCE_DIR = new URL('../../outlook-addin/src/', import.meta.url);

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

const REQUEST_SCHEMAS = {
  ...TODO_SCHEMAS,
  ...STRUCTURE_SCHEMAS,
  ...TIME_SCHEMAS,
  ...EXPORT_SCHEMAS,
};

/** Die beiden Türen mit Rumpf unter `/addin/*`, nach Operationskennung. */
const ADDIN_SCHEMAS = {
  createAddinTodo: createTodoSchema,
  createAddinTimeEntry: bookSchema,
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

const typeIndex = buildTypeIndex(readFileSync(TYPES_PATH, 'utf8'), 'types.ts');

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
const WEB_CALLER = {
  fileName: 'endpoints.ts',
  typeIndex,
  shape: CALL_SHAPES.options,
  schemas: REQUEST_SCHEMAS,
};

function inspect(text, who = WEB_CALLER) {
  const { functions, calls, unreadable } = scanCallers(text, who.typeIndex, who.fileName, who.shape);
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

const callerText = readFileSync(CALLER_PATH, 'utf8');
const result = inspect(callerText);
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
section('0  Der Leser liest die Datei — sonst wäre alles Folgende wertlos');
// ---------------------------------------------------------------------------

/*
 * Dieselbe Vorsichtsmaßnahme wie in `proof:openapi` Abschnitt 0. Ein Leser,
 * der nichts findet, sieht genauso aus wie eine Datei ohne Fehler. Die Zahl
 * steht deshalb nirgends fest, sondern wird zweimal auf verschiedenen Wegen
 * ermittelt: einmal aus dem Syntaxbaum, einmal aus dem Rohtext.
 */
const rawCalls = [...callerText.matchAll(/\brequest\s*[<(]/g)].length;
check(
  `so viele Aufrufe gelesen wie im Rohtext stehen (${rawCalls})`,
  rawCalls > 0 && result.calls.length === rawCalls,
  `gelesen ${result.calls.length}`,
);
check(
  `es sind überhaupt Aufrufe da (${result.calls.length}, mindestens 45)`,
  result.calls.length >= 45,
);
check(
  `die Typaufstellung der Oberfläche ist gelesen (${typeIndex.size} Typen)`,
  typeIndex.size > 30 && typeIndex.has('TodoCreate') && typeIndex.has('PoolWrite'),
);
check(
  'jeder Aufruf ist als Ganzes lesbar — Pfad, Methode, Optionen',
  result.unreadable.length === 0,
  result.unreadable.join(' | '),
);

// ---------------------------------------------------------------------------
section('1  Es gibt keinen zweiten Weg zum Dienst als diese Datei');
// ---------------------------------------------------------------------------

/*
 * Dieser Lauf liest **eine** Datei. Diese Beschränkung ist nur so viel wert
 * wie die Zusicherung, dass es keine zweite gibt. Also wird sie gemessen und
 * nicht geglaubt: `fetch` steht ausschließlich in `client.ts`, und `request(`
 * ausschließlich in `endpoints.ts`.
 *
 * Fällt das eines Tages, ist die richtige Antwort nicht, diese Prüfung zu
 * lockern, sondern die neue Stelle in die Aufstellung aufzunehmen.
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

const webSources = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) walk(child);
    else if (isBundledSource(entry.name)) webSources.push(child);
  }
};
walk(WEB_SOURCE_DIR);

const webFiles = webSources.map((file) => ({
  name: file.pathname.slice(WEB_SOURCE_DIR.pathname.length),
  source: readFileSync(file, 'utf8'),
}));

proveHarvest('die Oberfläche', webFiles, 100, ['api/client.ts', 'api/endpoints.ts']);

/**
 * Wo der Zugriff auf das globale `fetch` seinen Platz hat — ausgeschrieben.
 *
 * Eine Liste von **Dateien** und keine Ausnahme für eine **Form**: Wer
 * `window.fetch` allgemein durchließe, hätte den blinden Ausdruck von vorhin
 * unter anderem Namen zurück.
 */
const WEB_FETCH_HOME = ['api/client.ts'];

/**
 * Wo der Zugriff auf die Anfragefunktion seinen Platz hat — ausgeschrieben.
 *
 * `api/endpoints.ts` ruft sie, `api/client.ts` führt sie. Beide stehen als
 * **Datei** da und nicht als Form, aus demselben Grund wie oben.
 */
const WEB_REQUEST_HOME = ['api/endpoints.ts', 'api/client.ts'];

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
  '`request` steht nur in api/endpoints.ts und in api/client.ts, wo es entsteht',
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
  'getAddinContext',
  'findAddinDuplicates',
  'createAddinTodo',
  'createAddinTimeEntry',
  // T-066, **Übergabe an frontend-dev.** `GET /board` ist die Antwort auf
  // E-054: Kanban-Spalten sind Regeln über Tags, eine Karte kann in mehreren
  // Spalten zugleich stehen, und das Board ist damit eine eigene Frage
  // geworden statt einer Gruppierung nach `statusId`. Die Oberfläche baut die
  // Ansicht in einer eigenen Aufgabe; bis dahin gruppiert `BoardScreen.tsx`
  // weiterhin selbst nach Status und ruft diese Route nicht an.
  //
  // Der Eintrag steht hier und nicht als roter Lauf, weil die Lücke **benannt**
  // ist: `apps/web` gehört einem anderen Agenten, und T-066 durfte dort nichts
  // ändern (dieselbe Lage wie `createTodo.tagNames` aus T-058). Wer die Zeile
  // entfernt, ohne dass die Oberfläche `/board` anruft, bekommt den Befund
  // zurück — so soll es sein.
  'getBoard',
  // T-138, **Uebergabe an frontend-dev (T-139).** `GET /version` gibt heraus,
  // was der Dienst zuletzt ueber die veroeffentlichte Fassung weiss (A-18.2,
  // E-069). Der Aufrufer entsteht mit dem Dialog in T-139; T-138 und T-139
  // laufen in derselben Welle, und `apps/web` gehoert einem anderen Agenten.
  //
  // Dieselbe Lage wie bei `getBoard`, und derselbe Umgang: Der Eintrag steht
  // hier und nicht als roter Lauf, weil die Luecke **benannt** ist. Sobald
  // `endpoints.ts` die Route anruft, ist die Zeile ueberfluessig -- der Lauf
  // wird davon nicht rot, aber sie sagt dann etwas Falsches und gehoert
  // entfernt.
  'getVersionCheck',
]);
const uncalled = [...operations.entries()]
  .filter(([key, operation]) => !result.covered.has(key) && !NOT_CALLED_BY_UI.has(operation.id))
  .map(([key, operation]) => `${key} (${operation.id})`);
check(
  `jede Operation außerhalb von /addin hat einen Aufrufer (${operations.size - NOT_CALLED_BY_UI.size})`,
  uncalled.length === 0,
  uncalled.join(', '),
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
  // T-058, **Übergabe an frontend-dev.** Der Dienst nimmt seit T-058 Tags über
  // ihren Namen entgegen und legt sie an, wenn es sie noch nicht gibt
  // (architektur.md 3.4). Der Anlegedialog in `apps/web` schickt bisher nur
  // `tagIds` — die Fachlogik steht, die Bedienmöglichkeit fehlt.
  //
  // Der Eintrag steht hier und nicht als roter Lauf, weil die Lücke **benannt**
  // ist und nicht unbemerkt: `apps/web` gehört einem anderen Agenten, und diese
  // Aufgabe durfte dort nichts ändern. Wer die Zeile entfernt, ohne dass die
  // Oberfläche `tagNames` sendet, bekommt den Befund zurück — so soll es sein.
  createTodo: ['tagNames'],
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

for (const regression of REGRESSIONS) {
  const spoiled = callerText.replace(regression.pattern, regression.replacement);
  if (spoiled === callerText) {
    check(`die Probe „${regression.name}" lässt sich anwenden`, false, 'die Stelle wurde nicht gefunden');
    continue;
  }
  if (spoiled.split('\n').length !== callerText.split('\n').length) {
    check(`die Probe „${regression.name}" bleibt einzeilig`, false, 'die Ersetzung verschiebt Zeilen');
    continue;
  }
  const found = inspect(spoiled).findings.filter((finding) => !baseline.has(label(finding)));
  check(
    `${regression.name} wird gefunden`,
    found.length === 1 && found[0].kind === regression.kind,
    found.length === 0 ? 'nichts beanstandet' : found.map(label).join(' | '),
  );
  // Der Wortlaut des Befundes gehört in die Ausgabe und nicht nur ins Grüne:
  // Wer den Lauf liest, soll sehen, **was** der Prüfer über den wieder
  // eingesetzten Namen sagt — sonst ist auch diese Selbstprobe nur ein Haken.
  if (found.length === 1) console.log(`        → ${found[0].message}`);
}

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
  const probe = (source) =>
    strayRequestAccess([...files, { name: INJECTED, source }], allowed)
      .map((finding) => finding.name)
      .filter((name) => !baseline.includes(name));

  for (const form of REQUEST_FORMS) {
    const found = probe(form.source);
    check(
      `${who}: ${form.name} wird gefunden`,
      found.length === 1 && found[0] === INJECTED,
      found.length === 0 ? 'nichts beanstandet' : found.join(', '),
    );
  }

  const harmless = probe(REQUEST_HARMLESS.source);
  check(`${who}: ${REQUEST_HARMLESS.name}`, harmless.length === 0, harmless.join(', '));
}

proveRequestGuard('die Oberfläche', webFiles, WEB_REQUEST_HOME);

/*
 * Und die Begründung als Messung, wie oben: Der Ausdruck, der bis T-231 in
 * Abschnitt 1 stand, sieht vier dieser fünf Schreibweisen nicht. Setzt ihn
 * jemand zurück, fallen mit ihm vier Proben — und diese Zeile sagt, warum.
 */
const blindRequestForms = REQUEST_FORMS.filter((form) => !BLIND_REQUEST_CALL.test(form.source));
check(
  `der Ausdruck aus T-230-2 sieht vier der fünf Schreibweisen nicht (${blindRequestForms.length})`,
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
const addinSources = [];
const walkAddin = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) walkAddin(child);
    else if (isBundledSource(entry.name)) addinSources.push(child);
  }
};
walkAddin(ADDIN_SOURCE_DIR);

const addinFiles = addinSources.map((file) => ({
  name: file.pathname.slice(ADDIN_SOURCE_DIR.pathname.length),
  source: readFileSync(file, 'utf8'),
}));

proveHarvest('das Add-in', addinFiles, 25, ['api/client.ts']);

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
const ADDIN_FETCH_HOME = ['api/client.ts'];

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
