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
 * glauben: Kein `fetch` und kein `request(`-Aufruf außerhalb dieser beiden
 * Dateien.
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
 * **d) Das Add-in.** `apps/outlook-addin` ruft dieselben Routen unter
 * `/addin/*` an und hat seinen eigenen Nachweis (`proof:addin-wiring`).
 *
 * ===========================================================================
 * Und der Prüfer prüft sich selbst
 * ===========================================================================
 *
 * Abschnitt 6 setzt die drei Namen aus T-050 im gelesenen Text wieder ein —
 * im Arbeitsspeicher, die Datei bleibt unberührt — und verlangt, dass jeder
 * einzelne genau eine Beanstandung auslöst. Ohne das wäre dieser Lauf, was
 * `pnpm contrast` vor T-011 war: grün, weil er nichts tut.
 */

import { readdirSync, readFileSync } from 'node:fs';

import { z } from 'zod';

import { parseYaml } from './openapi-reader.mjs';
import { createMatcher } from './schema-match.mjs';
import { buildTypeIndex, normalizePath, scanCallers } from './caller-scan.mjs';
import { REQUEST_SCHEMAS as TODO_SCHEMAS } from '../src/routes/todos.ts';
import { REQUEST_SCHEMAS as STRUCTURE_SCHEMAS } from '../src/routes/structure.ts';
import { REQUEST_SCHEMAS as TIME_SCHEMAS } from '../src/routes/time.ts';
import { REQUEST_SCHEMAS as EXPORT_SCHEMAS } from '../src/routes/export.ts';

const SPEC_PATH = new URL('../openapi/takt-local-api.yaml', import.meta.url);
const CALLER_PATH = new URL('../../web/src/api/endpoints.ts', import.meta.url);
const TYPES_PATH = new URL('../../web/src/api/types.ts', import.meta.url);
const WEB_SOURCE_DIR = new URL('../../web/src/', import.meta.url);

const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

const REQUEST_SCHEMAS = {
  ...TODO_SCHEMAS,
  ...STRUCTURE_SCHEMAS,
  ...TIME_SCHEMAS,
  ...EXPORT_SCHEMAS,
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
 */
function inspect(text) {
  const { functions, calls, unreadable } = scanCallers(text, typeIndex, 'endpoints.ts');
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
      const schema = REQUEST_SCHEMAS[operation.id];
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
 */
const webSources = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) walk(child);
    else if (/\.tsx?$/.test(entry.name)) webSources.push(child);
  }
};
walk(WEB_SOURCE_DIR);

const strayFetch = [];
const strayRequest = [];
for (const file of webSources) {
  const body = readFileSync(file, 'utf8');
  const name = file.pathname.slice(WEB_SOURCE_DIR.pathname.length);
  if (/(?<![\w.])fetch\s*\(/.test(body) && name !== 'api/client.ts') strayFetch.push(name);
  if (/(?<![\w.])request\s*[<(]/.test(body) && name !== 'api/endpoints.ts' && name !== 'api/client.ts') {
    strayRequest.push(name);
  }
}
check(
  `\`fetch\` steht nur in api/client.ts (${webSources.length} Dateien durchgesehen)`,
  strayFetch.length === 0,
  strayFetch.join(', '),
);
check('`request(` steht nur in api/endpoints.ts', strayRequest.length === 0, strayRequest.join(', '));

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
  // Die vier Add-in-Routen. Eigener Aufrufer, eigener Nachweis.
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

// ---------------------------------------------------------------------------
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exitCode = 1;
}
