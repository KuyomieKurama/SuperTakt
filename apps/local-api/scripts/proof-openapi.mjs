/**
 * Takt — Nachweis, dass die Schnittstellenbeschreibung den Dienst beschreibt
 * (T-039).
 *
 * Aufruf:  pnpm --filter @takt/local-api proof:openapi
 *
 * ===========================================================================
 * Warum dieser Lauf existiert
 * ===========================================================================
 *
 * Dreimal ist `apps/local-api/openapi/takt-local-api.yaml` vom Dienst
 * abgewichen, und dreimal hat es jemand von Hand gefunden:
 *
 *  - T-022: vier Befunde.
 *  - T-029: zwölf. Darunter der Seitenumschlag, der bei **keiner** Listenroute
 *    stimmte — wer `response.data.map(...)` schrieb, merkte es zur Laufzeit.
 *  - T-038/T-039: `reopenIfDone`, ein Rumpffeld, das der Dienst nicht mehr
 *    kennt. Der Satz des integration-dev dazu: „Wer gegen die Beschreibung
 *    baut, baut C-03 nach."
 *
 * Jedes Mal war die Beschreibung *plausibel*. Das ist ihre Eigenart: Sie wird
 * nicht ausgeführt, also fällt nichts auf. Dieser Lauf führt sie aus — nicht
 * als Prüfwerkzeug für Anfragen, sondern als Vergleich gegen die einzige
 * Wahrheit, die es gibt: den zusammengebauten Dienst.
 *
 * ===========================================================================
 * Was verglichen wird, und was nicht
 * ===========================================================================
 *
 * **1. Routen, beide Richtungen.** Die Aufzählung kommt aus `Hono#routes` des
 * über `compose` gebauten Dienstes, nicht aus einer gepflegten Liste. Eine neue
 * Route ohne Beschreibung wird rot, eine beschriebene Route ohne Dienst
 * ebenfalls.
 *
 * **2. Anfragerümpfe.** Jede Route mit Rumpf prüft ihre Eingabe mit einem
 * zod-Schema. `z.toJSONSchema` macht daraus JSON Schema, und das wird gegen
 * das gehalten, was die Beschreibung über denselben Rumpf sagt: Feldnamen,
 * Pflichtfelder, Obergrenzen, Aufzählungen.
 *
 * Die Zuordnung „Route → Schema" steht nicht hier, sondern als
 * `REQUEST_SCHEMAS` in den Routendateien selbst. Das ist Absicht: Wer eine
 * Route hinzufügt, sieht die Zuordnung neben seiner Arbeit und nicht in einem
 * Skript, von dem er nichts weiß. Fehlt der Eintrag, wird dieser Lauf rot.
 *
 * **3. Der Leser selbst.** Abschnitt 0 prüft an bekannten Stellen, dass er die
 * Datei wirklich liest. Ohne das wäre ein kaputter Leser die schlimmste aller
 * Möglichkeiten: grün, weil er nichts findet.
 *
 * **4. Antwortgestalten und Statuscodes (T-041).** Das war bis dahin die
 * offene Hälfte — und die, in der die teuersten Befunde lagen:
 *
 *  - T-022: `GET /settings` und `POST /todos` lieferten eine Hülle, wo die
 *    Beschreibung die Entität versprach. Wer dagegen baute, las `undefined`
 *    und bekam keine Fehlermeldung, sondern eine leere Anzeige.
 *  - T-029: der Seitenumschlag stimmte bei **keiner** Listenroute.
 *  - T-039: `POST /timer/start` antwortete laut Beschreibung mit `409
 *    timer_already_running`, tatsächlich mit `200` und
 *    `kind: confirmation_required`.
 *
 * Dreimal derselbe Fehlertyp, dreimal von Hand gefunden, jedes Mal erst,
 * nachdem jemand dagegen gebaut hatte. `service-scenario.mjs` baut den Dienst
 * einmal mit einem kleinen festen Bestand auf und fährt **jede** der 64
 * Operationen mindestens einmal an; `schema-match.mjs` hält jede Antwort gegen
 * das, was die Beschreibung über sie sagt. Der Statuscode zählt dabei so viel
 * wie der Rumpf: Eine Beschreibung, die 409 verspricht und 200 bekommt, führt
 * zu einer Oberfläche, die einen Fehlerfall behandelt, den es nicht gibt — und
 * den echten nicht.
 *
 * **Was auch dieser Lauf nicht prüft.** Ob die Werte **stimmen**. Er misst
 * Gestalt, nicht Verhalten: dass `durationSeconds` da ist und eine Zahl, nicht
 * dass sie die richtige Zahl ist. Dafür gibt es die Prüfsuite und die übrigen
 * Nachweispfade. Und er misst nur, was der Durchlauf auslöst — ein
 * Fehlerfall, den niemand herbeiführt, bleibt unbeschrieben messbar falsch.
 * Deshalb führt der Durchlauf auch Abweisungen herbei und nicht nur
 * Erfolgsfälle.
 */

import { readFileSync } from 'node:fs';

import { z } from 'zod';

import { parseYaml } from './openapi-reader.mjs';
import { createMatcher } from './schema-match.mjs';
import { BOARD_COLUMNS, INTERNAL_NOTE, STATUS_COLOR, runScenario } from './service-scenario.mjs';
import { compose } from '../src/composition.ts';
import { API_BASE_PATH } from '../src/config.ts';
import { statusFor } from '../src/http/problem.ts';
import { errorStatus } from '../src/errors.ts';
import { REQUEST_SCHEMAS as TODO_SCHEMAS } from '../src/routes/todos.ts';
import { REQUEST_SCHEMAS as STRUCTURE_SCHEMAS } from '../src/routes/structure.ts';
import { REQUEST_SCHEMAS as TIME_SCHEMAS } from '../src/routes/time.ts';
import { REQUEST_SCHEMAS as EXPORT_SCHEMAS } from '../src/routes/export.ts';
import { bookSchema, createTodoSchema } from '../src/routes/addin/schema.ts';
import {
  POOL_RULE_AXIS_IDS,
  poolMovementSentence,
  poolRuleIsEmpty,
  poolRuleMatchesNothing,
  tagAxisIsUnresolved,
} from '@takt/domain';

const SPEC_PATH = new URL('../openapi/takt-local-api.yaml', import.meta.url);
const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'head', 'options'];

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

const text = readFileSync(SPEC_PATH, 'utf8');
const doc = parseYaml(text);

// ---------------------------------------------------------------------------
section('0  Der Leser liest die Datei — sonst wäre alles Folgende wertlos');
// ---------------------------------------------------------------------------

check('die Beschreibung ist OpenAPI 3.1', doc?.openapi === '3.1.0', String(doc?.openapi));

// Die Zahl der Pfade steht auch ohne Leser fest: Ein Pfad ist eine Zeile, die
// mit genau zwei Leerzeichen und einem Schrägstrich beginnt. Stimmen beide
// Zählungen überein, hat der Leser keinen Zweig verschluckt.
const pathLines = text.split('\n').filter((line) => /^ {2}\/\S/.test(line)).length;
check(
  `so viele Pfade gelesen wie in der Datei stehen (${pathLines})`,
  Object.keys(doc.paths ?? {}).length === pathLines,
  `gelesen ${Object.keys(doc.paths ?? {}).length}`,
);

const schemaLines = text.split('\n').filter((line) => /^ {4}[A-Z][A-Za-z]*:$/.test(line)).length;
check(
  'so viele benannte Bauteile gelesen wie in der Datei stehen',
  Object.keys(doc.components?.schemas ?? {}).length +
    Object.keys(doc.components?.responses ?? {}).length +
    Object.keys(doc.components?.parameters ?? {}).length +
    Object.keys(doc.components?.securitySchemes ?? {}).length ===
    schemaLines,
  `gelesen ${
    Object.keys(doc.components?.schemas ?? {}).length +
    Object.keys(doc.components?.responses ?? {}).length +
    Object.keys(doc.components?.parameters ?? {}).length +
    Object.keys(doc.components?.securitySchemes ?? {}).length
  }, gezählt ${schemaLines}`,
);

check(
  'ein Blockskalar kommt vollständig an (mehrzeilige Beschreibung)',
  typeof doc.paths?.['/timer/start']?.post?.description === 'string' &&
    doc.paths['/timer/start'].post.description.includes('confirmation_required') &&
    doc.paths['/timer/start'].post.description.split('\n').length > 5,
);

/**
 * Zählt Vorkommen eines Schlüssels im gelesenen Baum.
 *
 * Der Vergleich läuft gegen dieselbe Zählung im Rohtext. Das ist die schärfste
 * Probe, die ohne einen zweiten Leser zu haben ist: Ein Zweig, den der Leser
 * verschluckt, fehlt hier und steht dort — und beide Zahlen sind nirgends
 * niedergeschrieben, also veralten sie auch nicht.
 */
const countKey = (node, key) => {
  if (Array.isArray(node)) return node.reduce((sum, entry) => sum + countKey(entry, key), 0);
  if (node === null || typeof node !== 'object') return 0;
  let sum = 0;
  for (const [name, value] of Object.entries(node)) {
    if (name === key) sum += 1;
    sum += countKey(value, key);
  }
  return sum;
};

const rawMaxLength = [...text.matchAll(/(?<![\w-])maxLength: \d+/g)].length;
check(
  `jede Obergrenze aus dem Rohtext steht auch im gelesenen Baum (${rawMaxLength})`,
  rawMaxLength > 30 && countKey(doc, 'maxLength') === rawMaxLength,
  `gelesen ${countKey(doc, 'maxLength')}`,
);

const rawRefs = [...text.matchAll(/(?<![\w-])\$ref: /g)].length;
check(
  `jeder Verweis aus dem Rohtext steht auch im gelesenen Baum (${rawRefs})`,
  rawRefs > 300 && countKey(doc, '$ref') === rawRefs,
  `gelesen ${countKey(doc, '$ref')}`,
);

check(
  'eine Blockliste kommt vollständig an (Fragezeichenparameter)',
  Array.isArray(doc.paths?.['/addin/todo-matches']?.get?.parameters) &&
    doc.paths['/addin/todo-matches'].get.parameters[0].name === 'callNumber',
);

// ---------------------------------------------------------------------------
section('1  Jeder Verweis zeigt auf etwas, und nichts liegt unbenutzt herum');
// ---------------------------------------------------------------------------

const refs = [...text.matchAll(/#\/components\/([A-Za-z]+)\/([A-Za-z0-9]+)/g)].map((m) => [m[1], m[2]]);
const dangling = refs.filter(([kind, name]) => doc.components?.[kind]?.[name] === undefined);
check(
  `alle ${refs.length} Verweise zeigen auf ein vorhandenes Bauteil`,
  dangling.length === 0,
  dangling.map((r) => r.join('/')).join(', '),
);

/*
 * Ein Bauteil gilt als benutzt, wenn sein Name irgendwo außerhalb seiner
 * eigenen Kopfzeile vorkommt — als `$ref` oder als Erwähnung in einem Text.
 *
 * Die zweite Möglichkeit ist keine Nachlässigkeit, sondern ein vorhandener
 * Fall: `ExportRunGroup` gibt keine Route heraus und steht nur da, weil
 * `ExportAuditEntry.exportRunGroupId` auf sie verweist und der Leser wissen
 * muss, worauf. Das ist ein Zweck; ein Bauteil, dessen Name in der ganzen
 * Datei genau einmal vorkommt, hat keinen.
 */
const orphans = [];
for (const kind of ['schemas', 'responses', 'parameters']) {
  for (const name of Object.keys(doc.components?.[kind] ?? {})) {
    const mentions = [...text.matchAll(new RegExp(`\\b${name}\\b`, 'g'))].length;
    if (mentions <= 1) orphans.push(`${kind}/${name}`);
  }
}
check(
  'kein Bauteil ist beschrieben, ohne irgendwo benutzt oder erklärt zu werden',
  orphans.length === 0,
  orphans.join(', '),
);

// ---------------------------------------------------------------------------
section('2  Die Routen: die Aufzählung kommt aus dem Dienst, nicht von Hand');
// ---------------------------------------------------------------------------

/** Ein Tokenspeicher im Arbeitsspeicher — hier wird nichts geschrieben. */
const memoryStore = () => ({
  read: async () => ({ status: 'absent' }),
  write: async () => {},
  inspectPermissions: async () => ({ checked: false, dirTooPermissive: false, fileTooPermissive: false }),
});

const probe = compose({
  port: 17843,
  store: memoryStore(),
  sessionSecret: `takt_${'0'.repeat(43)}`,
  windowsUser: 't.beispiel',
  databaseLocation: ':memory:',
});

const serviceRoutes = new Set();
const outside = [];
for (const route of probe.app.routes) {
  // `Hono#routes` führt auch die Kettenglieder. Sie stehen als `ALL /*`.
  if (route.method === 'ALL') continue;
  if (!route.path.startsWith(API_BASE_PATH)) {
    outside.push(`${route.method} ${route.path}`);
    continue;
  }
  const path = route.path.slice(API_BASE_PATH.length).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  serviceRoutes.add(`${route.method} ${path === '' ? '/' : path}`);
}
probe.database.close();

const specRoutes = new Set();
for (const [path, item] of Object.entries(doc.paths)) {
  for (const method of METHODS) {
    if (item[method] !== undefined) specRoutes.add(`${method.toUpperCase()} ${path}`);
  }
}

check(
  'keine Route steht nur in der Beschreibung',
  [...specRoutes].every((route) => serviceRoutes.has(route)),
  [...specRoutes].filter((route) => !serviceRoutes.has(route)).join(', '),
);
check(
  'keine Route gibt es nur im Dienst',
  [...serviceRoutes].every((route) => specRoutes.has(route)),
  [...serviceRoutes].filter((route) => !specRoutes.has(route)).join(', '),
);
check(
  `beide Seiten führen dieselbe Zahl (${specRoutes.size})`,
  specRoutes.size === serviceRoutes.size && specRoutes.size > 50,
  `Beschreibung ${specRoutes.size}, Dienst ${serviceRoutes.size}`,
);
check(
  'außerhalb von /api/v1 hängt nur, was dort hingehört',
  outside.every((entry) => entry.endsWith('/health') || entry.endsWith('/taskpane') || entry.includes('/taskpane/')),
  outside.join(', '),
);

// ---------------------------------------------------------------------------
section('3  Die Anfragerümpfe: Feldnamen, Pflichtfelder, Obergrenzen');
// ---------------------------------------------------------------------------

const REQUEST_SCHEMAS = {
  ...TODO_SCHEMAS,
  ...STRUCTURE_SCHEMAS,
  ...TIME_SCHEMAS,
  ...EXPORT_SCHEMAS,
  // Die Add-in-Routen liegen in fremder Hoheit und führen kein
  // `REQUEST_SCHEMAS`; ihre beiden Schemata sind einzeln ausgeführt.
  createAddinTodo: createTodoSchema,
  createAddinTimeEntry: bookSchema,
};

/** Folgt `$ref` bis zum Bauteil. */
const deref = (node) => {
  if (node !== null && typeof node === 'object' && typeof node.$ref === 'string') {
    const [, kind, name] = /#\/components\/([A-Za-z]+)\/([A-Za-z0-9]+)/.exec(node.$ref) ?? [];
    return deref(doc.components[kind][name]);
  }
  return node;
};

/**
 * Nimmt aus `oneOf`/`anyOf`/`allOf` den einen inhaltlichen Zweig.
 *
 * `oneOf: [{…}, {type: null}]` ist in dieser Datei die Schreibweise für „darf
 * auch fehlen". Für den Vergleich der Obergrenzen zählt der andere Zweig.
 */
const branch = (node) => {
  const resolved = deref(node);
  if (resolved === null || typeof resolved !== 'object') return resolved;
  const alternatives = resolved.oneOf ?? resolved.anyOf ?? resolved.allOf;
  if (!Array.isArray(alternatives)) return resolved;
  const meaty = alternatives.map(deref).filter((entry) => entry?.type !== 'null');
  if (meaty.length !== 1) return resolved;
  const rest = Object.fromEntries(
    Object.entries(resolved).filter(([key]) => !['oneOf', 'anyOf', 'allOf'].includes(key)),
  );
  return { ...meaty[0], ...rest };
};

/** Zeigt die Beschreibung an dieser Stelle auf ein benanntes Bauteil? */
const isNamed = (node) => {
  if (node !== null && typeof node === 'object' && typeof node.$ref === 'string') return true;
  const alternatives = node?.oneOf ?? node?.anyOf ?? node?.allOf;
  return Array.isArray(alternatives) && alternatives.some((entry) => typeof entry?.$ref === 'string');
};

const FACETS = ['maxLength', 'minLength', 'maxItems', 'minItems'];

const bodyOperations = [];
for (const [path, item] of Object.entries(doc.paths)) {
  for (const method of METHODS) {
    const operation = item[method];
    if (operation?.requestBody !== undefined) bodyOperations.push([`${method.toUpperCase()} ${path}`, operation]);
  }
}

check(
  `jede beschriebene Route mit Rumpf hat ein Schema im Dienst (${bodyOperations.length})`,
  bodyOperations.every(([, operation]) => REQUEST_SCHEMAS[operation.operationId] !== undefined),
  bodyOperations
    .filter(([, operation]) => REQUEST_SCHEMAS[operation.operationId] === undefined)
    .map(([label, operation]) => `${label} (${operation.operationId})`)
    .join(', '),
);

const documentedIds = new Set(bodyOperations.map(([, operation]) => operation.operationId));
check(
  'kein Schema im Dienst ohne beschriebene Route — kein toter Eintrag',
  Object.keys(REQUEST_SCHEMAS).every((id) => documentedIds.has(id)),
  Object.keys(REQUEST_SCHEMAS).filter((id) => !documentedIds.has(id)).join(', '),
);

const nameProblems = [];
const requiredProblems = [];
const facetProblems = [];

for (const [label, operation] of bodyOperations) {
  const id = operation.operationId;
  const zodSchema = REQUEST_SCHEMAS[id];
  if (zodSchema === undefined) continue;

  const specSchema = branch(operation.requestBody.content?.['application/json']?.schema);
  if (specSchema === null || specSchema === undefined) {
    nameProblems.push(`${label}: kein application/json`);
    continue;
  }
  const actual = z.toJSONSchema(zodSchema, { io: 'input' });

  const specProps = Object.keys(specSchema.properties ?? {});
  const actualProps = Object.keys(actual.properties ?? {});
  const onlySpec = specProps.filter((name) => !actualProps.includes(name));
  const onlyService = actualProps.filter((name) => !specProps.includes(name));
  if (onlySpec.length > 0) nameProblems.push(`${id}: beschrieben, aber nicht gelesen: ${onlySpec.join('/')}`);
  if (onlyService.length > 0) nameProblems.push(`${id}: gelesen, aber nicht beschrieben: ${onlyService.join('/')}`);

  const specRequired = [...(specSchema.required ?? [])].sort().join(',');
  const actualRequired = [...(actual.required ?? [])].sort().join(',');
  if (specRequired !== actualRequired) {
    requiredProblems.push(`${id}: Beschreibung [${specRequired}] gegen Dienst [${actualRequired}]`);
  }

  for (const name of specProps.filter((entry) => actualProps.includes(entry))) {
    const described = branch(specSchema.properties[name]) ?? {};
    const enforced = branch(actual.properties[name]) ?? {};
    for (const facet of FACETS) {
      if (described[facet] !== undefined && enforced[facet] !== undefined) {
        if (described[facet] !== enforced[facet]) {
          facetProblems.push(`${id}.${name}: ${facet} ${described[facet]} gegen ${enforced[facet]}`);
        }
        continue;
      }
      // Eine Grenze, die der Dienst zieht, muss beschrieben sein — sonst läuft
      // ein gültig aussehender Aufruf in ein 422, das niemand angekündigt hat.
      // Ausgenommen sind Felder, die auf ein benanntes Bauteil zeigen: Dort
      // steht die Beschreibung am Bauteil und nicht am Feld.
      if (enforced[facet] !== undefined && !isNamed(specSchema.properties[name])) {
        facetProblems.push(`${id}.${name}: ${facet}=${enforced[facet]} wird erzwungen, aber nicht beschrieben`);
      }
    }
    const describedEnum = described.enum ?? (described.const === undefined ? undefined : [described.const]);
    const enforcedEnum = enforced.enum ?? (enforced.const === undefined ? undefined : [enforced.const]);
    if (describedEnum !== undefined && enforcedEnum !== undefined) {
      const a = [...describedEnum].sort().join('|');
      const b = [...enforcedEnum].sort().join('|');
      if (a !== b) facetProblems.push(`${id}.${name}: Aufzählung [${a}] gegen [${b}]`);
    }
  }
}

check('kein Rumpffeld nur auf einer der beiden Seiten', nameProblems.length === 0, nameProblems.join(' | '));
check('dieselben Pflichtfelder auf beiden Seiten', requiredProblems.length === 0, requiredProblems.join(' | '));
check(
  'keine Obergrenze und keine Aufzählung, die sich widersprechen',
  facetProblems.length === 0,
  facetProblems.join(' | '),
);

// ---------------------------------------------------------------------------
section('4  Was T-038 entfernt hat, steht auch nicht mehr in der Beschreibung');
// ---------------------------------------------------------------------------

check(
  '`reopenIfDone` kommt in der Beschreibung nur noch als Rückblick vor',
  !/^\s*reopenIfDone\s*:/m.test(text),
  'als Feld beschrieben, aber vom Dienst nicht gelesen (Befund C-03)',
);

const booking = doc.paths['/addin/todos/{todoId}/time-entries'].post;
// Seit T-104 heißt das zweite Feld `poolMovement` und nicht mehr `poolNames`:
// **eine** Form für jede Bewegung über HTTP (E-061 Punkt 3). Die Prüfung misst
// unverändert, dass die Antwort die Wirkung ansagt — nur unter dem Namen, den
// sie jetzt trägt.
check(
  'die Buchungsroute sagt die Wirkung in ihrer Antwort an: doneCleared und poolMovement',
  (booking.responses['201'].content['application/json'].schema.properties.data.required ?? []).includes(
    'doneCleared',
  ) &&
    (booking.responses['201'].content['application/json'].schema.properties.data.required ?? []).includes(
      'poolMovement',
    ),
);
check(
  'und sie begründet, warum ein Nachzügler trotzdem 201 bekommt',
  booking.description.includes('201') && booking.description.includes('reopenIfDone'),
);

// ---------------------------------------------------------------------------
section('5  Der Vergleicher prüft sich selbst — sonst wäre alles Folgende grün aus Versehen');
// ---------------------------------------------------------------------------

/*
 * Ein Vergleicher, der nichts findet, sieht genauso aus wie eine Beschreibung,
 * die stimmt. Der Unterschied lässt sich nur zeigen, indem man ihm etwas
 * Falsches hinhält und sieht, ob er es merkt.
 *
 * Genommen wird ein echtes Schema aus der Datei — der Seitenumschlag von
 * `GET /todos`, also genau die Gestalt, an der T-029 zwölf Befunde hatte.
 */
const matcher = createMatcher(doc);
const listSchema = doc.paths['/todos'].get.responses['200'].content['application/json'].schema;
const goodPage = {
  data: {
    items: [
      {
        id: 'a',
        title: 't',
        callNumber: null,
        statusId: 's',
        completedAt: null,
        tagIds: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    nextCursor: null,
    total: 1,
  },
};
const withMutation = (change) => {
  const copy = structuredClone(goodPage);
  change(copy);
  return matcher.condense(matcher.match(copy, listSchema, 'probe'));
};

check(
  'eine gültige Antwort geht ohne Beanstandung durch',
  matcher.match(goodPage, listSchema, 'probe').length === 0,
  matcher.match(goodPage, listSchema, 'probe').join(' | '),
);
check(
  'ein fehlendes Pflichtfeld im Umschlag fällt auf (der Befund aus T-029)',
  withMutation((page) => delete page.data.nextCursor).length === 1,
);
check(
  'eine Liste, wo ein Umschlag beschrieben ist, fällt auf (der Befund aus T-022)',
  withMutation((page) => {
    page.data = [];
  }).length === 1,
);
check(
  'ein geliefertes, aber nicht beschriebenes Feld fällt auf — auch tief in einer Liste',
  withMutation((page) => {
    page.data.items[0].note = 'Vermerk';
  }).length === 1,
);
check(
  'ein Pflichtfeld tief in einer Liste fällt auf',
  withMutation((page) => delete page.data.items[0].statusId).length === 1,
);
check(
  'eine falsche Art fällt auf',
  withMutation((page) => {
    page.data.items[0].tagIds = 'nein';
  }).length === 1,
);
check(
  'ein fester Wert, der nicht stimmt, fällt auf',
  matcher.match(
    { data: { kind: 'weg' } },
    doc.paths['/timer/stop'].post.responses['200'].content['application/json'].schema,
    'probe',
  ).length === 1,
);

// ---------------------------------------------------------------------------
section('6  Der Durchlauf: jede Operation wird angefahren');
// ---------------------------------------------------------------------------

const operations = new Map();
for (const [path, item] of Object.entries(doc.paths)) {
  for (const method of METHODS) {
    const operation = item[method];
    if (operation === undefined) continue;
    if (typeof operation.operationId !== 'string') {
      throw new Error(`Operation ohne operationId: ${method.toUpperCase()} ${path}`);
    }
    operations.set(operation.operationId, { path, method: method.toUpperCase(), operation });
  }
}

const { records } = await runScenario();

const unknownIds = [...new Set(records.map((r) => r.operationId))].filter((id) => !operations.has(id));
check(
  'jede Aufzeichnung nennt eine Operation, die es in der Beschreibung gibt',
  unknownIds.length === 0,
  unknownIds.join(', '),
);

const exercised = new Set(records.map((record) => record.operationId));
check(
  `jede der ${operations.size} beschriebenen Operationen wird mindestens einmal angefahren`,
  [...operations.keys()].every((id) => exercised.has(id)),
  [...operations.keys()].filter((id) => !exercised.has(id)).join(', '),
);

// Der Pfad der Aufzeichnung muss die Schablone der Beschreibung sein. Ohne
// diese Probe könnte eine Aufzeichnung auf die falsche Operation zeigen und
// deren Antwort messen.
const wrongPaths = records
  .filter((record) => operations.get(record.operationId)?.path !== record.path.split('?')[0])
  .map((record) => `${record.operationId}: ${record.path}`);
check('jede Aufzeichnung trägt den Pfad ihrer Operation', wrongPaths.length === 0, wrongPaths.join(', '));

const wrongMethods = records
  .filter((record) => operations.get(record.operationId)?.method !== record.method)
  .map((record) => `${record.operationId}: ${record.method}`);
check('und ihre Methode', wrongMethods.length === 0, wrongMethods.join(', '));

const serverErrors = records
  .filter((record) => record.status >= 500)
  .map((record) => `${record.method} ${record.path} → ${record.status}`);
check(
  'kein einziger Aufruf des Durchlaufs endet mit 5xx',
  serverErrors.length === 0,
  serverErrors.join(', '),
);

/**
 * A-7.2, R-06 — der interne Vermerk verlässt seine eigene Route nicht.
 *
 * Der Durchlauf hat ihn beim Anlegen zweier Todos mitgegeben. Er darf in
 * genau zwei Antworten stehen: in der der Vermerksroute selbst. Diese Probe
 * kostet nichts, weil ohnehin jede Antwort eingesammelt wird — und sie misst
 * eine Zusicherung, die sonst nur behauptet wird.
 */
const noteBearing = records
  .filter((record) => (record.text ?? '').includes(INTERNAL_NOTE))
  .map((record) => record.operationId);
check(
  'der interne Vermerk steht in keiner Antwort außer der Vermerksroute (A-7.2)',
  noteBearing.every((id) => id === 'getTodoNote' || id === 'putTodoNote'),
  noteBearing.filter((id) => id !== 'getTodoNote' && id !== 'putTodoNote').join(', '),
);

/*
 * T-051 — ein mitgeschickter Schlüssel kommt auch an.
 *
 * Die Gestaltprüfung allein kann das nicht: Streift eine Route ein Feld ab,
 * antwortet sie mit `color: null`, und `null` ist erlaubt. Der Durchlauf legt
 * die Spalte deshalb mit einer erkennbaren Farbe an, und hier wird nach genau
 * diesem Wert gesehen. Bis T-051 nahm `POST /todo-statuses` die Farbe nicht
 * entgegen, während die Oberfläche sie sendete — gefunden hat das
 * `proof:callers`, nachgemessen wird es hier.
 */
const createdStatus = records.find((record) => record.operationId === 'createTodoStatus');
check(
  'eine mit Farbe angelegte Spalte trägt sie auch (T-051)',
  createdStatus?.body?.data?.color === STATUS_COLOR,
  `geliefert ${JSON.stringify(createdStatus?.body?.data?.color)}`,
);

// ---------------------------------------------------------------------------
section('7  Die Statuscodes: was der Dienst liefert, steht in der Beschreibung');
// ---------------------------------------------------------------------------

const observed = new Map();
const undescribedStatus = [];
for (const record of records) {
  const entry = operations.get(record.operationId);
  if (entry === undefined) continue;
  const code = String(record.status);
  if (!observed.has(record.operationId)) observed.set(record.operationId, new Set());
  observed.get(record.operationId).add(code);
  if (entry.operation.responses?.[code] === undefined) {
    undescribedStatus.push(
      `${entry.method} ${entry.path} (${record.operationId}): geliefert ${code}, beschrieben sind ` +
        Object.keys(entry.operation.responses ?? {}).join('/'),
    );
  }
}
check(
  `jeder gelieferte Statuscode ist beschrieben (${records.length} Aufrufe)`,
  undescribedStatus.length === 0,
  undescribedStatus.join(' | '),
);

/*
 * Und die Gegenrichtung, für die Erfolgsfälle: Ein beschriebenes 2xx, das der
 * Dienst im ganzen Durchlauf nie liefert, ist entweder erfunden oder ein Fall,
 * den niemand ausgelöst hat. Beides gehört angesehen. Bei 4xx gilt das nicht —
 * `413 payload_too_large` verlangt ein Megabyte Rumpf, und ein Durchlauf, der
 * jede Abweisung erzwingt, wäre die zweite Prüfsuite.
 */
const unseenSuccess = [];
for (const [id, entry] of operations) {
  const seen = observed.get(id) ?? new Set();
  for (const code of Object.keys(entry.operation.responses ?? {})) {
    if (code.startsWith('2') && !seen.has(code)) {
      unseenSuccess.push(`${entry.method} ${entry.path} (${id}): ${code}`);
    }
  }
}
check(
  'jeder beschriebene Erfolgsfall kommt im Durchlauf auch vor',
  unseenSuccess.length === 0,
  unseenSuccess.join(', '),
);

/*
 * Die Antworten der Kette (Herkunft, Nachweis, Inhaltstyp, Rumpfgrenze) hängen
 * an **keiner** Route, sondern vor allen. Also müssen sie auch an jeder stehen:
 *
 *  - `400 token_in_url`, `401`, `403` treffen jede Operation — ein Aufrufer
 *    braucht dafür nichts als eine Adresse und eine Kopfzeile.
 *  - `413` und `415` kommen dazu, sobald eine Operation einen Rumpf entgegen-
 *    nimmt. Was der Dienst auf einen Rumpf antwortet, den die Beschreibung gar
 *    nicht führt, schuldet sie niemandem.
 *
 * Bis T-041 standen sie an 4, 5 und 1 von 64 Operationen — nicht als
 * Entscheidung, sondern als Rest. Eine Kettenantwort, die an drei Routen steht
 * und an einundsechzig nicht, liest sich wie eine Aussage über die drei.
 *
 * `500` steht bewusst **nicht** in dieser Liste. Es ist der einzige Ausgang,
 * gegen den kein Aufrufer verzweigt, es trägt an keiner Route eine eigene
 * Bedeutung — und ein 500 im Durchlauf soll rot werden (Abschnitt 6) und nicht
 * als beschrieben durchgehen.
 */
const CHAIN_ALWAYS = { 400: 'TokenInUrl', 401: 'Unauthorized', 403: 'OriginRejected' };
const CHAIN_WITH_BODY = { 413: 'PayloadTooLarge', 415: 'UnsupportedMediaType' };

const missingChain = [];
for (const [id, entry] of operations) {
  const responses = entry.operation.responses ?? {};
  const expected = {
    ...CHAIN_ALWAYS,
    ...(entry.operation.requestBody === undefined ? {} : CHAIN_WITH_BODY),
  };
  for (const [code, component] of Object.entries(expected)) {
    const described = responses[code];
    if (described === undefined) {
      missingChain.push(`${entry.method} ${entry.path} (${id}): ${code} fehlt`);
    } else if (described.$ref !== `#/components/responses/${component}`) {
      missingChain.push(`${entry.method} ${entry.path} (${id}): ${code} zeigt nicht auf ${component}`);
    }
  }
}
check(
  'die Antworten der Kette stehen an jeder Operation, die sie erzeugen kann',
  missingChain.length === 0,
  missingChain.slice(0, 6).join(' | ') + (missingChain.length > 6 ? ` … (${missingChain.length})` : ''),
);

// ---------------------------------------------------------------------------
section('8  Die Antwortrümpfe: Pflichtfelder, unbeschriebene Felder, Gestalt');
// ---------------------------------------------------------------------------

const shapeProblems = [];
const headerProblems = [];
let matchedResponses = 0;

for (const record of records) {
  const entry = operations.get(record.operationId);
  if (entry === undefined) continue;
  const described = entry.operation.responses?.[String(record.status)];
  if (described === undefined) continue; // schon in Abschnitt 7 gemeldet
  const response = matcher.deref(described);
  const where = `${entry.method} ${entry.path} ${record.status}`;

  // ---- Kopfzeilen, beide Richtungen ---------------------------------------
  for (const name of Object.keys(response.headers ?? {})) {
    if (record.headers[name.toLowerCase()] === undefined) {
      headerProblems.push(`${where}: Kopfzeile ${name} beschrieben, nicht geliefert`);
    }
  }
  // Nur `Location`. Die übrigen Kopfzeilen des Dienstes (`Cache-Control`,
  // `X-Content-Type-Options`, die CSP) stehen auf **jeder** Antwort und gehören
  // in das Bedrohungsmodell, nicht 64-mal in diese Datei. `Location` ist die
  // eine, die zur Operation gehört und die ein Aufrufer benutzt.
  if (record.headers['location'] !== undefined && response.headers?.['Location'] === undefined) {
    headerProblems.push(`${where}: Location geliefert, aber nicht beschrieben`);
  }

  // ---- Rumpf ---------------------------------------------------------------
  const schema = response.content?.['application/json']?.schema;
  if (record.status === 204) {
    if (response.content !== undefined) {
      shapeProblems.push(`${where}: die Beschreibung führt einen Rumpf, der Dienst liefert keinen`);
    }
    if (record.hasBody) {
      shapeProblems.push(`${where}: der Dienst liefert einen Rumpf, obwohl 204 keinen hat`);
    }
    continue;
  }
  if (schema === undefined) {
    shapeProblems.push(`${where}: kein application/json-Schema beschrieben`);
    continue;
  }
  if (!record.hasBody) {
    shapeProblems.push(`${where}: ein Rumpf ist beschrieben, geliefert wurde keiner`);
    continue;
  }
  matchedResponses += 1;
  for (const problem of matcher.condense(matcher.match(record.body, schema, where))) {
    shapeProblems.push(problem);
  }
}

check(
  `jede gelieferte Antwort passt auf ihr Schema (${matchedResponses} verglichen)`,
  shapeProblems.length === 0,
  shapeProblems.slice(0, 8).join(' | ') + (shapeProblems.length > 8 ? ` … (${shapeProblems.length})` : ''),
);
check(
  'die Kopfzeilen stimmen in beide Richtungen',
  headerProblems.length === 0,
  headerProblems.join(' | '),
);

/*
 * Der Vergleich muss auch wirklich stattgefunden haben. Ohne diese Zahl wäre
 * ein Durchlauf, dessen Aufzeichnungen aus irgendeinem Grund leer bleiben,
 * grün — mit null Beanstandungen über null Antworten.
 */
check(
  `es wurden genug Antworten verglichen (${matchedResponses}, mindestens 60)`,
  matchedResponses >= 60,
);

// ---------------------------------------------------------------------------
section('9  Die Fehlerschlüssel: benannt, und mit dem Statuscode des Dienstes');
// ---------------------------------------------------------------------------

/** Welchen Statuscode der Dienst zu einem Schlüssel liefert, aus seinen zwei Tabellen. */
const serviceStatusOf = (code) => {
  try {
    const fachlich = statusFor(code);
    if (fachlich !== undefined) return fachlich;
  } catch {
    /* kein fachlicher Schlüssel */
  }
  try {
    return errorStatus(code);
  } catch {
    return undefined;
  }
};

/*
 * `error.code` ist laut Beschreibung „die einzige Größe, gegen die ein
 * Aufrufer verzweigt". Ein Schlüssel, der geliefert wird und in der ganzen
 * Datei nicht vorkommt, ist damit ein Zweig, den niemand kennen kann.
 */
const deliveredCodes = new Set(
  records.map((record) => record.body?.error?.code).filter((code) => typeof code === 'string'),
);
const unnamedCodes = [...deliveredCodes].filter(
  (code) => !new RegExp(`\\b${code}\\b`).test(text),
);
check(
  `jeder gelieferte Fehlerschlüssel kommt in der Beschreibung vor (${deliveredCodes.size})`,
  unnamedCodes.length === 0,
  unnamedCodes.join(', '),
);

/*
 * Und umgekehrt: Wo die Beschreibung einen Schlüssel unter einem Statuscode
 * nennt, muss der Dienst ihn mit genau diesem Statuscode beantworten. Das ist
 * die Verbindung zwischen dem Fließtext der Beschreibung und `http/problem.ts`
 * — ein `export_status_unchanged` unter einem `422` fiele hier auf, ohne dass
 * der Durchlauf den Fall auslösen muss.
 */
const wrongCodeStatus = [];
let namedCodes = 0;
for (const [, entry] of operations) {
  for (const [code, response] of Object.entries(entry.operation.responses ?? {})) {
    if (!/^[45]/.test(code)) continue;
    const described = typeof response.description === 'string' ? response.description : '';
    for (const hit of described.matchAll(/`([a-z][a-z0-9_]{4,})`/g)) {
      const status = serviceStatusOf(hit[1]);
      if (status === undefined) continue;
      namedCodes += 1;
      if (String(status) !== code) {
        wrongCodeStatus.push(
          `${entry.method} ${entry.path}: „${hit[1]}" steht unter ${code}, der Dienst antwortet damit ${status}`,
        );
      }
    }
  }
}
check(
  `ein unter einem Statuscode genannter Schlüssel gehört auch dorthin (${namedCodes})`,
  wrongCodeStatus.length === 0,
  wrongCodeStatus.join(' | '),
);

// ---------------------------------------------------------------------------
section('10  Beispiele und Fragezeichenparameter');
// ---------------------------------------------------------------------------

/*
 * Ein Beispiel ist das, was ein Leser zuerst ansieht und zuletzt prüft. Wenn
 * es dem Schema daneben widerspricht, hat die Datei zwei Aussagen über
 * dieselbe Antwort — und der Leser glaubt der falschen.
 */
const exampleProblems = [];
let examplesChecked = 0;
const walkExamples = (node, where) => {
  if (Array.isArray(node)) {
    node.forEach((entry, index) => walkExamples(entry, `${where}[${index}]`));
    return;
  }
  if (node === null || typeof node !== 'object') return;
  if (node.schema !== undefined) {
    for (const [name, example] of Object.entries(node.examples ?? {})) {
      if (example?.value === undefined) continue;
      examplesChecked += 1;
      for (const problem of matcher.condense(
        matcher.match(example.value, node.schema, `${where}.${name}`),
      )) {
        exampleProblems.push(problem);
      }
    }
  }
  for (const [key, value] of Object.entries(node)) walkExamples(value, `${where}.${key}`);
};
walkExamples(doc.paths, 'paths');
walkExamples(doc.components, 'components');

check(
  `jedes Beispiel passt auf das Schema daneben (${examplesChecked})`,
  exampleProblems.length === 0,
  exampleProblems.join(' | '),
);
check('und es gibt überhaupt Beispiele', examplesChecked >= 8, String(examplesChecked));

/*
 * Fragezeichenparameter lassen sich nicht über einen Aufruf messen — ein
 * Parameter, den der Dienst nicht liest, ändert die Antwort schlicht nicht,
 * und das sieht wie ein gültiger Filter ohne Treffer aus. Was sich messen
 * lässt: ob der Name im Quelltext der Routen überhaupt vorkommt. T-039 hat auf
 * der Anfrageseite zwei deutsche Feldnamen gefunden, die der Dienst nie gelesen
 * hat; dieselbe Sorte Fund ist hier möglich.
 */
const routeSources = [
  '../src/routes/todos.ts',
  '../src/routes/structure.ts',
  '../src/routes/board.ts',
  '../src/routes/time.ts',
  '../src/routes/export.ts',
  '../src/routes/addin/index.ts',
  '../src/http/input.ts',
]
  .map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'))
  .join('\n');

const unreadParameters = [];
let queryParameters = 0;
for (const [path, item] of Object.entries(doc.paths)) {
  const shared = item.parameters ?? [];
  for (const method of METHODS) {
    const operation = item[method];
    if (operation === undefined) continue;
    for (const raw of [...shared, ...(operation.parameters ?? [])]) {
      const parameter = matcher.deref(raw);
      if (parameter.in !== 'query') continue;
      queryParameters += 1;
      if (!new RegExp(`['"\`]${parameter.name}['"\`]`).test(routeSources)) {
        unreadParameters.push(`${method.toUpperCase()} ${path}: „${parameter.name}"`);
      }
    }
  }
}
check(
  `jeder beschriebene Fragezeichenparameter kommt im Quelltext der Routen vor (${queryParameters})`,
  unreadParameters.length === 0,
  unreadParameters.join(' | '),
);

// ---------------------------------------------------------------------------
section('11  Das Board: dieselbe Karte in mehreren Spalten (E-054)');
// ---------------------------------------------------------------------------

/*
 * Der Fall, den es vor E-054 nicht geben konnte.
 *
 * Solange eine Spalte ein Status war, stand eine Karte in genau einer — das
 * Schema ließ nichts anderes zu, `todo.status_id` ist ein Wert. Seit eine
 * Spalte eine **Regel** ist, treffen zwei zutreffende Regeln beide zu, und die
 * Karte steht in beiden Spalten. Das ist keine Ausnahme, die man behandeln
 * muss, sondern der Normalfall, und er wird hier gemessen statt behauptet.
 *
 * Vier Prüfungen, und die dritte ist die eigentliche:
 *
 *  1. Die Spalte kommt so an, wie sie angelegt wurde — `placement: board`
 *     wird nicht stillschweigend abgestreift (die Falle aus T-051).
 *  2. Die Karte steht wirklich in mehreren Spalten, und die Spalte ohne Regel
 *     ist leer: Eine leere Regel trifft nichts, nicht alles (T-009).
 *  3. **Abfrage und Domänenregel sind sich einig.** Welche Karte in welcher
 *     Spalte steht, entscheidet SQL (`PoolPort.members`); welche Karte
 *     mehrfach vorkommt, entscheidet `matchesPool` in der Domäne. Zwei
 *     Fassungen derselben Regel — hier wird gemessen, dass sie dieselbe
 *     Antwort geben. Laufen sie auseinander, zeigt das Board eine Karte in
 *     einer Spalte und behauptet daneben, sie stünde dort nicht.
 *  4. Mehrere zutreffende Regelterme derselben Spalte ergeben **eine**
 *     Nennung. Der Fall ist alltäglich: eine Spalte im Modus `any` mit zwei
 *     Tags, eine Karte mit beiden.
 */

const boardColumnRecord = records.find(
  (record) => record.operationId === 'createPool' && record.body?.data?.name === BOARD_COLUMNS.tag,
);
check(
  'eine als Spalte angelegte Regel kommt auch als Spalte zurück (placement)',
  boardColumnRecord?.body?.data?.placement === 'board',
  `geliefert ${JSON.stringify(boardColumnRecord?.body?.data?.placement)}`,
);

// Der **erste** Durchgang: vier Spalten über Tags, dazu die Achsen aus T-076,
// die ohne Buchungen und ohne erledigte Karte auskommen.
const boardRecord = records.find((record) => record.operationId === 'getBoard');
const board = boardRecord?.body?.data;
const columnsByName = new Map(
  (board?.columns ?? []).map((entry) => [entry.column?.name, entry]),
);

check(
  `das Board führt die eingerichteten Spalten und nur die (${columnsByName.size})`,
  Object.values(BOARD_COLUMNS).every((name) => columnsByName.has(name)) &&
    columnsByName.size === Object.keys(BOARD_COLUMNS).length,
  [...columnsByName.keys()].join(', '),
);

check(
  'eine Regel mit placement "pool" steht nicht auf dem Board',
  ![...columnsByName.keys()].some((name) => String(name).startsWith('Offene Beratung')),
  [...columnsByName.keys()].join(', '),
);

const emptyColumn = columnsByName.get(BOARD_COLUMNS.empty);
check(
  'eine Spalte ohne Regel zeigt nichts — nicht alles (T-009)',
  emptyColumn?.todos?.length === 0 && emptyColumn?.total === 0,
  `${emptyColumn?.todos?.length} Karten, total ${emptyColumn?.total}`,
);

/** Was die **Abfrage** sagt: Kennung → Spalten, in denen sie steht. */
const bySql = new Map();
for (const entry of board?.columns ?? []) {
  for (const todo of entry.todos ?? []) {
    if (!bySql.has(todo.id)) bySql.set(todo.id, []);
    const seen = bySql.get(todo.id);
    // Zugleich Prüfung 4: Eine Spalte darf höchstens einmal dastehen, auch
    // wenn mehrere ihrer Regelterme dieselbe Karte treffen.
    if (!seen.includes(entry.column.id)) seen.push(entry.column.id);
  }
}

const multiple = [...bySql.entries()].filter(([, columnIds]) => columnIds.length > 1);
check(
  `mindestens eine Karte steht in mehreren Spalten (${multiple.length})`,
  multiple.length >= 1 && multiple.some(([, columnIds]) => columnIds.length >= 3),
  multiple.map(([id, columnIds]) => `${id}: ${columnIds.length}`).join(', '),
);

const doubled = [];
for (const entry of board?.columns ?? []) {
  const ids = (entry.todos ?? []).map((todo) => todo.id);
  if (new Set(ids).size !== ids.length) doubled.push(entry.column?.name);
}
check(
  'mehrere zutreffende Regelterme einer Spalte liefern die Karte einmal, nicht mehrfach',
  doubled.length === 0,
  doubled.join(', '),
);

/**
 * Spaltenkennung → Spaltenname.
 *
 * Eine Abweichung, die nur Kennungen nennt, verlagert die Arbeit auf den
 * Leser: Er muss erst herausfinden, **welche** Spalte streitet. Mit dem Namen
 * steht der Befund fertig da.
 */
const columnName = new Map(
  (board?.columns ?? []).map((entry) => [entry.column?.id, entry.column?.name]),
);
for (const entry of lateBoardColumnsForNames()) columnName.set(entry.id, entry.name);
function lateBoardColumnsForNames() {
  const late = records.filter((record) => record.operationId === 'getBoard').at(-1);
  return (late?.body?.data?.columns ?? []).map((entry) => entry.column ?? {});
}
const named = (ids) => [...ids].map((id) => columnName.get(id) ?? id).sort().join(' / ') || '(keine)';

/** Was die **Domäne** sagt: dieselbe Frage, über `matchesPool`. */
const byDomain = new Map(
  (board?.appearances ?? []).map((entry) => [entry.todoId, entry.columnIds]),
);

const disagreements = [];
for (const [todoId, columnIds] of multiple) {
  const claimed = byDomain.get(todoId);
  if (claimed === undefined) {
    disagreements.push(`${todoId}: von der Abfrage in ${columnIds.length} Spalten, von der Regel in keiner`);
    continue;
  }
  if ([...claimed].sort().join(',') !== [...columnIds].sort().join(',')) {
    disagreements.push(`${todoId}: Abfrage [${named(columnIds)}] gegen Regel [${named(claimed)}]`);
  }
}
for (const [todoId, columnIds] of byDomain) {
  if (!bySql.has(todoId)) {
    disagreements.push(`${todoId}: von der Regel in ${columnIds.length} Spalten, von der Abfrage in keiner`);
  }
}
check(
  `Abfrage und Domänenregel nennen dieselben Spalten (${byDomain.size} Mehrfachnennungen)`,
  disagreements.length === 0 && byDomain.size === multiple.length,
  disagreements.join(' | ') || `Regel ${byDomain.size}, Abfrage ${multiple.length}`,
);

// ---------------------------------------------------------------------------
section('12  Die Regel ist eine Struktur mit benannten Feldern (T-076)');
// ---------------------------------------------------------------------------

/*
 * Der Auftraggeber wollte den Status als Regel — und hat, mit einem Vorbild vor
 * Augen, mehr bestellt: „Nimm dir ein Beispiel daran. Das regelt das."
 * Statt einer Liste gleichartiger Terme hat jede Bedingung ein eigenes Feld mit
 * einem Neutralwert; die Felder sind mit „und" verbunden.
 *
 * Gemessen wird hier, dass jedes dieser Felder **wirkt** — und zwar an einem
 * Bestand, in dem eine bloß durchgereichte Bedingung auffiele:
 *
 *   Karte A trägt `Beratung` und `Rückfrage`, Status 1.
 *   Karte B trägt `Beratung`,                 Status 1.
 *
 * Damit ergibt jede Achse eine **andere** Menge, und keine davon ist zufällig
 * gleich einer anderen:
 *
 *   nur Status        → A und B
 *   Tag und Status    → nur A     (das „und": weniger als die Tagspalte, nicht mehr)
 *   ausgeschlossen    → nur B     (die Bedingung, die eine Termliste nicht kann)
 *   fremder Status    → leer      (die Gegenprobe: die Achse filtert wirklich)
 *
 * Die vier Prüfungen darunter fahren die drei Achsen an, die einen Bestand
 * brauchen — Erledigt, offene und exportierte Buchungen —, und zwar am
 * **zweiten** Board-Durchgang, nach Timer, Buchungen und Exportlauf.
 */

const idsIn = (name) =>
  new Set((columnsByName.get(name)?.todos ?? []).map((todo) => todo.id));
const asList = (set) => [...set].sort().join(', ') || '(leer)';

const onlyStatus = idsIn(BOARD_COLUMNS.status);
const mixedColumn = idsIn(BOARD_COLUMNS.mixed);
const excludedColumn = idsIn(BOARD_COLUMNS.excluded);
const foreignStatus = idsIn(BOARD_COLUMNS.otherStatus);
const tagColumn = idsIn(BOARD_COLUMNS.tag);

check(
  `eine Spalte, die nur nach dem Status filtert, führt beide Karten (${onlyStatus.size})`,
  onlyStatus.size === 2,
  asList(onlyStatus),
);

check(
  'eine Spalte über einen Status, den keine Karte trägt, ist leer — die Achse filtert wirklich',
  foreignStatus.size === 0,
  asList(foreignStatus),
);

check(
  `Tag **und** Status ergibt weniger als das Tag allein (${mixedColumn.size} statt ${tagColumn.size})`,
  mixedColumn.size === 1 &&
    [...mixedColumn].every((id) => onlyStatus.has(id)) &&
    mixedColumn.size < onlyStatus.size,
  `gemischt ${asList(mixedColumn)} | nur Status ${asList(onlyStatus)}`,
);

check(
  'ein ausgeschlossenes Tag nimmt genau die Karte heraus, die es trägt',
  excludedColumn.size === 1 && [...excludedColumn].every((id) => !mixedColumn.has(id)),
  `ausgeschlossen ${asList(excludedColumn)} | gemischt ${asList(mixedColumn)}`,
);

/*
 * Und der Fall, um den es dem Auftraggeber ging: **eine Karte, die durch den
 * Status in zwei Spalten steht.**
 *
 * Nicht „steht in zwei Spalten" allein — das gab es seit E-054. Gemessen wird,
 * dass mindestens eine Karte in einer Spalte über Tags **und** in einer Spalte
 * über den Status steht, dass also die beiden Arten von Bedingung dieselbe
 * Karte treffen, ohne einander zu verdrängen.
 */
const inTagAndStatus = [...tagColumn].filter((id) => onlyStatus.has(id));
check(
  `eine Karte steht zugleich in einer Tag- und in einer Statusspalte (${inTagAndStatus.length})`,
  inTagAndStatus.length >= 1,
  `Tagspalte ${asList(tagColumn)} | Statusspalte ${asList(onlyStatus)}`,
);

// ---------------------------------------------------------------------------
// Der zweite Durchgang: Erledigt und Exportstatus
// ---------------------------------------------------------------------------

const boardRecords = records.filter((record) => record.operationId === 'getBoard');
const lateBoard = boardRecords[boardRecords.length - 1]?.body?.data;
const lateColumns = new Map(
  (lateBoard?.columns ?? []).map((entry) => [entry.column?.name, entry]),
);
const lateIdsIn = (name) =>
  new Set((lateColumns.get(name)?.todos ?? []).map((todo) => todo.id));

check(
  `es gibt einen zweiten Board-Durchgang, nach Buchungen und Exportlauf (${boardRecords.length})`,
  boardRecords.length >= 2 && lateBoard !== undefined,
  `${boardRecords.length} Aufzeichnung(en)`,
);

/*
 * Erledigt. Die Spalte fragt ausdrücklich nach erledigten Karten, die Ansicht
 * steht auf `includeCompleted=false` — die Vorgabe. Wäre die
 * Ansichtseinstellung stärker als die Regel, bliebe die Spalte leer, und der
 * Benutzer sähe eine Spalte, die er eingerichtet hat und die nie etwas zeigt.
 */
const doneColumn = lateIdsIn(BOARD_COLUMNS.done);
check(
  `eine Spalte „nur Erledigt" zeigt die erledigte Karte, obwohl die Ansicht Erledigtes ausblendet (${doneColumn.size})`,
  doneColumn.size >= 1,
  asList(doneColumn),
);

/*
 * Exportstatus. Die Erwartung wird nicht angenommen, sondern aus einem
 * **zweiten, unabhängigen** Weg gelesen: der Liste der Buchungen. Laufen die
 * beiden auseinander, zeigt das Board eine Spalte „noch nicht abgerechnet",
 * die etwas anderes meint als die Buchungsliste.
 */
const entriesRecord = records
  .filter((record) => record.operationId === 'searchTimeEntries')
  .at(-1);
const entries = entriesRecord?.body?.data?.items ?? [];
const expectedOpen = new Set(
  entries.filter((entry) => entry.exportStatus === 'open').map((entry) => entry.todoId),
);
const expectedExported = new Set(
  entries.filter((entry) => entry.exportStatus === 'exported').map((entry) => entry.todoId),
);

const openColumn = lateIdsIn(BOARD_COLUMNS.openWork);
const exportedColumn = lateIdsIn(BOARD_COLUMNS.exported);

/*
 * Die Erwartung wird um die **erledigten** Karten gekürzt, und das ist keine
 * Nachgiebigkeit, sondern die zweite Hälfte der Messung.
 *
 * Beide Exportspalten lassen die Erledigt-Achse offen. Wo die Regel schweigt,
 * gilt die Ansichtseinstellung — und die steht auf ihrer Vorgabe
 * `includeCompleted=false`. Eine erledigte Karte mit offener Buchung gehört
 * damit in die Spalte und wird trotzdem nicht gezeigt.
 *
 * Welche Karten erledigt sind, wird nicht angenommen: Es ist genau der Inhalt
 * der Spalte `done` daneben, die ausdrücklich danach fragt.
 */
const visible = (set) => new Set([...set].filter((id) => !doneColumn.has(id)));

check(
  `„mit offener Buchung" trifft genau die Todos, die eine haben (${openColumn.size})`,
  openColumn.size > 0 && asList(openColumn) === asList(visible(expectedOpen)),
  `Spalte ${asList(openColumn)} | Buchungsliste ${asList(visible(expectedOpen))}`,
);

check(
  `„mit exportierter Buchung" trifft genau die Todos, die eine haben (${exportedColumn.size})`,
  exportedColumn.size > 0 && asList(exportedColumn) === asList(visible(expectedExported)),
  `Spalte ${asList(exportedColumn)} | Buchungsliste ${asList(visible(expectedExported))}`,
);

check(
  'die erledigte Karte hat eine offene Buchung und wird trotzdem nur in der Erledigt-Spalte gezeigt',
  [...doneColumn].some((id) => expectedOpen.has(id)) &&
    ![...doneColumn].some((id) => openColumn.has(id)),
  `erledigt ${asList(doneColumn)} | offen laut Buchungsliste ${asList(expectedOpen)} | Spalte ${asList(openColumn)}`,
);

/*
 * Und die Übereinstimmung von Abfrage und Domänenregel noch einmal — für den
 * zweiten Durchgang, in dem alle fünf Achsen etwas zu sagen haben. Dieselbe
 * Prüfung wie in Abschnitt 11, aber an dem Bestand, an dem sie am ehesten
 * auseinanderlaufen: `matchesPool` entscheidet über Erledigt und Buchungen
 * anhand von Angaben, die der Anwendungsfall erst zusammensuchen muss, die
 * Abfrage anhand von SQL.
 */
const lateBySql = new Map();
for (const entry of lateBoard?.columns ?? []) {
  for (const todo of entry.todos ?? []) {
    if (!lateBySql.has(todo.id)) lateBySql.set(todo.id, new Set());
    lateBySql.get(todo.id).add(entry.column.id);
  }
}
const lateByDomain = new Map(
  (lateBoard?.appearances ?? []).map((entry) => [entry.todoId, new Set(entry.columnIds)]),
);
const lateProblems = [];
for (const [todoId, columnIds] of lateBySql) {
  const claimed = lateByDomain.get(todoId) ?? new Set();
  if (columnIds.size > 1 && asList(claimed) !== asList(columnIds)) {
    lateProblems.push(`${todoId}: Abfrage [${named(columnIds)}] gegen Regel [${named(claimed)}]`);
  }
  if (columnIds.size <= 1 && claimed.size > 0) {
    lateProblems.push(`${todoId}: von der Regel mehrfach genannt, von der Abfrage einmal`);
  }
}
check(
  `auch mit allen fünf Achsen nennen Abfrage und Domänenregel dieselben Spalten (${lateByDomain.size})`,
  lateProblems.length === 0 && lateByDomain.size > 0,
  lateProblems.join(' | ') || 'keine Mehrfachnennung im zweiten Durchgang',
);

// ---------------------------------------------------------------------------
section('13  Die Frage „ist diese Regel leer" steht einmal (T-080)');
// ---------------------------------------------------------------------------

/*
 * Bis T-080 stand die Bedingung „alle Achsen neutral" dreimal da: in
 * `matchesPool`, in der Übersetzung nach SQL und in der Oberfläche, die sie
 * für den Leerzustand einer frisch angelegten Spalte braucht und über keine
 * Route erfragen konnte. Jetzt steht sie in `poolRuleIsEmpty`, und dieser
 * Abschnitt hält sie gegen den laufenden Dienst.
 *
 * Die Aufzählung der Achsen kommt aus der **Domäne** und nicht aus dieser
 * Datei (`POOL_RULE_AXIS_IDS`). Das ist der Punkt: Wer eine sechste Achse
 * hinzufügt, macht diesen Abschnitt rot, bis sie beschrieben, annehmbar und
 * ausgeliefert ist — und `tsc` hat ihn vorher schon in der Domäne, in
 * `packages/storage` und im Dienst rot gemacht.
 */

const poolSchema = doc.components.schemas.Pool;
const axisGaps = [];
for (const axis of POOL_RULE_AXIS_IDS) {
  if (poolSchema.properties?.[axis] === undefined) axisGaps.push(`Pool.${axis} fehlt`);
  if (!(poolSchema.required ?? []).includes(axis)) axisGaps.push(`Pool.${axis} nicht Pflicht`);
  for (const name of ['PoolCreate', 'PoolUpdate']) {
    if (doc.components.schemas[name].properties?.[axis] === undefined) {
      axisGaps.push(`${name}.${axis} fehlt`);
    }
  }
}
check(
  `jede Achse der Domäne ist beschrieben — im Pool und in beiden Rümpfen (${POOL_RULE_AXIS_IDS.length})`,
  axisGaps.length === 0,
  axisGaps.join(', '),
);

const axisNotRead = [];
for (const id of ['createPool', 'updatePool']) {
  const properties = Object.keys(z.toJSONSchema(REQUEST_SCHEMAS[id], { io: 'input' }).properties ?? {});
  for (const axis of POOL_RULE_AXIS_IDS) {
    if (!properties.includes(axis)) axisNotRead.push(`${id}.${axis}`);
  }
}
check(
  'jede Achse wird von der Eingabeprüfung beider Routen angenommen',
  axisNotRead.length === 0,
  axisNotRead.join(', '),
);

/** Jede ausgelieferte Regel, gleich über welche Antwort sie kam. */
const deliveredPools = [
  ...records
    .filter((record) => ['listPools', 'createPool', 'updatePool'].includes(record.operationId))
    .flatMap((record) => (Array.isArray(record.body?.data) ? record.body.data : [record.body?.data])),
  ...(board?.columns ?? []).map((entry) => entry.column),
  ...(lateBoard?.columns ?? []).map((entry) => entry.column),
].filter((pool) => pool !== undefined && pool !== null && typeof pool === 'object' && 'id' in pool);

const deliveryGaps = [];
for (const pool of deliveredPools) {
  for (const axis of POOL_RULE_AXIS_IDS) {
    if (pool[axis] === undefined) deliveryGaps.push(`${pool.name}.${axis}`);
  }
  const resolved = pool.resolved;
  if (
    typeof resolved?.tagCount !== 'number' ||
    typeof resolved?.excludedTagCount !== 'number' ||
    typeof resolved?.isEmpty !== 'boolean' ||
    typeof resolved?.unresolvedRequired !== 'boolean' ||
    typeof resolved?.unresolvedExcluded !== 'boolean' ||
    typeof resolved?.matchesNothing !== 'boolean' ||
    !Array.isArray(resolved?.emptyRuleFolderIds)
  ) {
    deliveryGaps.push(`${pool.name}.resolved`);
  }
}
check(
  `jede ausgelieferte Regel trägt alle Achsen und ihre Auflösung (${deliveredPools.length})`,
  deliveryGaps.length === 0 && deliveredPools.length >= 15,
  deliveryGaps.slice(0, 8).join(', '),
);

/*
 * **Domäne gegen Dienst.** Wo keine Ordner im Spiel sind, muss die Antwort der
 * Domäne auf die gespeicherte Regel dieselbe sein wie die des Dienstes auf die
 * aufgelöste: Ein Tagterm löst sich zu genau einem Tag auf, ein Status zu sich
 * selbst. Weichen die beiden hier ab, hat eine Seite ihre Achsen vergessen.
 *
 * Regeln **mit** Ordnertermen sind ausgenommen, und zwar nicht aus Nachsicht:
 * Dort dürfen die Antworten auseinandergehen, und genau diese Lücke ist der
 * Zustand, den die Zahl daneben benennbar macht (die Prüfung darunter).
 */
const hasFolderTerm = (pool) =>
  [...(pool.rule ?? []), ...(pool.excludedTags ?? [])].some((term) => term.kind === 'folder');

const emptinessProblems = [];
for (const pool of deliveredPools.filter((entry) => !hasFolderTerm(entry))) {
  if (poolRuleIsEmpty(pool) !== pool.resolved.isEmpty) {
    emptinessProblems.push(
      `${pool.name}: Domäne ${poolRuleIsEmpty(pool)}, Dienst ${pool.resolved.isEmpty}`,
    );
  }
}
check(
  'ohne Ordnerterm sagen Domäne und Dienst dasselbe über die leere Regel',
  emptinessProblems.length === 0,
  emptinessProblems.join(' | '),
);

/*
 * Und die fachliche Folge: Was leer ist, trifft nichts. Gemessen an der Zahl,
 * die aus der **Abfrage** kommt und nicht aus der Domäne — das ist die dritte
 * Fassung derselben Regel, die in `packages/storage` steht.
 */
const notEmptyButMatching = [];
const emptyWithCards = [];
for (const entry of board?.columns ?? []) {
  if (entry.column.resolved.isEmpty && entry.total !== 0) {
    emptyWithCards.push(`${entry.column.name}: ${entry.total} Karten`);
  }
  if (!entry.column.resolved.isEmpty && entry.total > 0) notEmptyButMatching.push(entry.column.name);
}
check(
  `eine aufgelöst leere Regel hat keine Mitglieder — und das ist nicht leer gemessen (${notEmptyButMatching.length} Gegenproben)`,
  emptyWithCards.length === 0 && notEmptyButMatching.length >= 3,
  emptyWithCards.join(' | ') || `Gegenproben: ${notEmptyButMatching.join(', ')}`,
);

/*
 * Der Fall, für den die Zahl überhaupt da ist: **ein Ordner, in dem kein Tag
 * liegt.** Die Regel nennt eine Bedingung — `poolRuleIsEmpty` sagt also nein —
 * und trifft trotzdem nichts. Ohne `resolved.tagCount` sähe das in jeder
 * Ansicht aus wie „im Augenblick passt nichts", und der Benutzer wartete auf
 * ein Todo, das nie erscheinen kann.
 */
const barren = columnsByName.get(BOARD_COLUMNS.emptyFolder);
check(
  'ein Ordner ohne Tags ist von einer Regel ohne Treffer unterscheidbar',
  barren !== undefined &&
    barren.column.rule.length === 1 &&
    poolRuleIsEmpty(barren.column) === false &&
    barren.column.resolved.tagCount === 0 &&
    barren.column.resolved.isEmpty === true &&
    barren.total === 0,
  JSON.stringify({
    regelterme: barren?.column?.rule?.length,
    nenntBedingung: barren === undefined ? undefined : !poolRuleIsEmpty(barren.column),
    aufgeloest: barren?.column?.resolved,
    karten: barren?.total,
  }),
);

/*
 * Die Gegenprobe dazu: derselbe Aufbau mit einem Ordner, in dem Tags liegen.
 * Ohne sie wäre die Prüfung darüber auch dann grün, wenn die Auflösung
 * grundsätzlich null zählte.
 */
const filled = columnsByName.get(BOARD_COLUMNS.folder);
check(
  'ein Ordner **mit** Tags zählt sie auch',
  filled !== undefined && filled.column.resolved.tagCount >= 1 && filled.column.resolved.isEmpty === false,
  JSON.stringify(filled?.column?.resolved),
);

/*
 * Und der Prüfer prüft sich selbst — sonst wäre `poolRuleIsEmpty` auch dann
 * grün, wenn es immer dasselbe antwortete. Je Achse einmal, mit sonst
 * neutralen Nachbarn: Jede einzelne muss die Regel aus der Leere holen.
 */
const neutral = {
  rule: [],
  excludedTags: [],
  statusIds: [],
  completion: 'any',
  exportState: 'any',
};
const setTo = {
  rule: [{ kind: 'tag', tagId: 'x' }],
  excludedTags: [{ kind: 'tag', tagId: 'x' }],
  statusIds: ['x'],
  completion: 'done',
  exportState: 'open',
};
const blind = POOL_RULE_AXIS_IDS.filter(
  (axis) => poolRuleIsEmpty({ ...neutral, [axis]: setTo[axis] }) !== false,
);
check(
  `jede einzelne Achse hebt die Leere auf, und keine ohne (${POOL_RULE_AXIS_IDS.join(', ')})`,
  blind.length === 0 && poolRuleIsEmpty(neutral) === true,
  blind.length > 0 ? `wirkungslos: ${blind.join(', ')}` : 'die neutrale Regel gilt nicht als leer',
);

// ---------------------------------------------------------------------------
section('14  Ein Ordnerterm ohne Tags trifft nichts, statt zu verschwinden (E-057)');
// ---------------------------------------------------------------------------

/*
 * Der Befund aus T-080, den T-082 behebt.
 *
 * Eine leere Tagmenge war der **Neutralwert** der Achse: Wer nichts über Tags
 * sagte, bekam sie übersprungen. Ein Ordner, in dem kein Tag liegt, löst
 * ebenfalls auf die leere Menge auf — und verschwand damit aus der Regel.
 * „Tags aus Ordner X **und** Status offen" wurde zu „Status offen". Die Regel
 * traf **mehr**, als der Benutzer gesagt hatte, und das ist die Richtung, die
 * niemandem auffällt: Eine Spalte, die zu viel zeigt, sieht aus wie eine volle
 * Spalte.
 *
 * Bei einer Regel, die **nur** aus dem Ordnerterm besteht, fiel es nicht auf —
 * sie ist nach dem Auflösen leer und trifft schon deshalb nichts (A-3.4,
 * Abschnitt 13). Gemessen wird hier deshalb der **gemischte** Fall, und die
 * Gegenprobe daneben ist die andere Hälfte von E-057: Ein Ausschluß über
 * denselben leeren Ordner schließt nichts aus.
 */

const mixedBarren = columnsByName.get(BOARD_COLUMNS.emptyFolderAndStatus);
check(
  'ein leerer Ordner **neben** einer zweiten Achse läßt die Regel nichts treffen',
  mixedBarren !== undefined &&
    mixedBarren.column.rule.length === 1 &&
    mixedBarren.column.statusIds.length === 1 &&
    // Nach dem Auflösen bleibt die Statusachse stehen: Diese Regel ist **nicht**
    // leer, und bis T-082 hätte sie deshalb nach dem Status gefiltert.
    mixedBarren.column.resolved.isEmpty === false &&
    mixedBarren.column.resolved.tagCount === 0 &&
    mixedBarren.column.resolved.unresolvedRequired === true &&
    mixedBarren.column.resolved.matchesNothing === true &&
    mixedBarren.total === 0,
  JSON.stringify({
    terme: mixedBarren?.column?.rule?.length,
    status: mixedBarren?.column?.statusIds?.length,
    aufgeloest: mixedBarren?.column?.resolved,
    karten: mixedBarren?.total,
  }),
);

/*
 * Und die Gegenprobe, ohne die die Prüfung darüber auch an einer Spalte grün
 * wäre, deren Status ohnehin niemand trägt: **derselbe** Status, allein
 * genannt, führt zwei Karten. Der leere Ordner ist also das einzige, was die
 * Spalte darüber leer macht.
 */
const statusColumn = columnsByName.get(BOARD_COLUMNS.status);
check(
  `derselbe Status ohne den leeren Ordner führt Karten (${statusColumn?.total ?? 0})`,
  statusColumn !== undefined &&
    mixedBarren !== undefined &&
    statusColumn.total >= 2 &&
    JSON.stringify(statusColumn.column.statusIds) === JSON.stringify(mixedBarren.column.statusIds),
  JSON.stringify({
    nurStatus: statusColumn?.column?.statusIds,
    mitLeeremOrdner: mixedBarren?.column?.statusIds,
    karten: statusColumn?.total,
  }),
);

/*
 * Die andere Hälfte von E-057: **Ausgeschlossene** Tags über einen leeren
 * Ordner schließen nichts aus. „Keiner davon" über nichts läßt in Ruhe, statt
 * einzuengen — die Spalte führt deshalb genau dieselben Karten wie die Spalte
 * über dasselbe Tag ohne den Ausschluß.
 *
 * Diese Prüfung ist die, die eine zu grobe Behebung fängt: Wer „eine Tagachse
 * ohne Auflösung trifft nichts" auf **beide** Listen anwendet, macht diese
 * Spalte leer, und dann steht hier eine Abweichung.
 */
const excludedBarren = columnsByName.get(BOARD_COLUMNS.excludedEmptyFolder);
const idsOf = (entry) => [...new Set((entry?.todos ?? []).map((todo) => todo.id))].sort().join(', ');
check(
  `ein Ausschluß über einen leeren Ordner schließt nichts aus (${excludedBarren?.total ?? 0} Karten)`,
  excludedBarren !== undefined &&
    excludedBarren.column.excludedTags.length === 1 &&
    excludedBarren.column.resolved.excludedTagCount === 0 &&
    excludedBarren.column.resolved.unresolvedExcluded === true &&
    excludedBarren.column.resolved.unresolvedRequired === false &&
    excludedBarren.column.resolved.matchesNothing === false &&
    excludedBarren.total >= 2 &&
    idsOf(excludedBarren) === idsOf(columnsByName.get(BOARD_COLUMNS.tag)),
  JSON.stringify({
    aufgeloest: excludedBarren?.column?.resolved,
    mitAusschluss: idsOf(excludedBarren),
    ohneAusschluss: idsOf(columnsByName.get(BOARD_COLUMNS.tag)),
  }),
);

/*
 * **Der Fall, den die Achsensumme nicht sieht** (E-057, termweise).
 *
 * Ein Tagterm **neben** dem leeren Ordner, im Modus „mindestens eines davon":
 * `resolved.tagCount` ist positiv, die Achse sieht also gesund aus, und der
 * leere Ordner ist in der Summe nicht mehr zu erkennen. Achsenweise gemessen
 * bliebe er unsichtbar — die Spalte zeigte die Tag-Karten, niemandem fiele auf,
 * daß der Ordner leer ist, und sobald jemand einen Tag hineinlegt, änderte sich
 * die Spalte ohne ersichtlichen Grund.
 *
 * `emptyRuleFolderIds` ist die Auskunft, mit der die Oberfläche **welcher**
 * Ordner sagen kann und nicht nur **ein** Ordner. Geprüft wird deshalb auch,
 * daß darin die Kennung aus der Regel steht und keine andere.
 */
const mixedTerms = columnsByName.get(BOARD_COLUMNS.tagOrEmptyFolder);
const namedFolderIds = (pool) =>
  (pool?.rule ?? []).filter((term) => term.kind === 'folder').map((term) => term.folderId);
check(
  'ein leerer Ordner **neben** einem Tagterm bleibt sichtbar und läßt die Regel nichts treffen',
  mixedTerms !== undefined &&
    mixedTerms.column.rule.length === 2 &&
    mixedTerms.column.matchMode === 'any' &&
    // Der Tagterm steuert seinen Tag bei: Die Achsensumme ist positiv, und
    // genau deshalb taugt sie hier nicht als Erkennung.
    mixedTerms.column.resolved.tagCount === 1 &&
    mixedTerms.column.resolved.isEmpty === false &&
    mixedTerms.column.resolved.unresolvedRequired === true &&
    mixedTerms.column.resolved.matchesNothing === true &&
    JSON.stringify(mixedTerms.column.resolved.emptyRuleFolderIds) ===
      JSON.stringify(namedFolderIds(mixedTerms.column)) &&
    mixedTerms.total === 0,
  JSON.stringify({
    terme: mixedTerms?.column?.rule?.length,
    modus: mixedTerms?.column?.matchMode,
    aufgeloest: mixedTerms?.column?.resolved,
    genannteOrdner: namedFolderIds(mixedTerms?.column),
    karten: mixedTerms?.total,
  }),
);

/*
 * Die Gegenprobe: **derselbe** Tagterm ohne den leeren Ordner führt Karten. Ohne
 * sie wäre die Prüfung darüber auch dann grün, wenn das Tag niemandem gehörte.
 */
check(
  `derselbe Tagterm ohne den leeren Ordner führt Karten (${columnsByName.get(BOARD_COLUMNS.tag)?.total ?? 0})`,
  (columnsByName.get(BOARD_COLUMNS.tag)?.total ?? 0) >= 2 &&
    JSON.stringify((columnsByName.get(BOARD_COLUMNS.tag)?.column?.rule ?? []).filter((t) => t.kind === 'tag')) ===
      JSON.stringify((mixedTerms?.column?.rule ?? []).filter((t) => t.kind === 'tag')),
  JSON.stringify({
    nurTag: columnsByName.get(BOARD_COLUMNS.tag)?.column?.rule,
    mitLeeremOrdner: mixedTerms?.column?.rule,
  }),
);

/*
 * Und die Ordner der **Ausschlußliste** stehen nicht darin — auch dann nicht,
 * wenn sie leer sind (E-057). Sie schließen nichts aus, also folgt aus ihnen
 * keine Handlung, und eine Kennung ohne Handlung wäre eine Anzeige ohne Sinn.
 */
check(
  'ein leerer Ordner in der Ausschlußliste steht nicht bei den erforderlichen',
  excludedBarren !== undefined && excludedBarren.column.resolved.emptyRuleFolderIds.length === 0,
  JSON.stringify(excludedBarren?.column?.resolved),
);

/*
 * **Domäne gegen Dienst**, über die Leitung. Die ausgelieferte Auflösung trägt
 * alles, was `poolRuleMatchesNothing` braucht; die Antwort muß dieselbe sein.
 * Läuft eine der beiden Seiten weg, steht es hier — für **jede** ausgelieferte
 * Regel und nicht nur für die beiden von oben.
 */
const asResolvedAxes = (pool) => ({
  // Die Länge ist alles, was die Frage von den Listen liest (siehe
  // `PoolRuleAxes`), und die Länge steht in der Auflösung.
  rule: Array.from({ length: pool.resolved.tagCount }, () => null),
  excludedTags: Array.from({ length: pool.resolved.excludedTagCount }, () => null),
  statusIds: pool.statusIds,
  completion: pool.completion,
  exportState: pool.exportState,
  unresolvedRequired: pool.resolved.unresolvedRequired,
});

/** Dieselbe Achse, wie `tagAxisIsUnresolved` sie liest — termweise. */
const asRequiredAxis = (pool) => ({
  named: (pool.rule ?? []).length,
  resolved: pool.resolved.tagCount,
  emptyTerms: pool.resolved.emptyRuleFolderIds.length,
});

const verdictProblems = [];
for (const pool of deliveredPools) {
  const domain = poolRuleMatchesNothing(asResolvedAxes(pool));
  if (domain !== pool.resolved.matchesNothing) {
    verdictProblems.push(`${pool.name}: Domäne ${domain}, Dienst ${pool.resolved.matchesNothing}`);
  }
  const unresolved = tagAxisIsUnresolved(asRequiredAxis(pool));
  if (unresolved !== pool.resolved.unresolvedRequired) {
    verdictProblems.push(
      `${pool.name}: ${JSON.stringify(asRequiredAxis(pool))}, geliefert ${pool.resolved.unresolvedRequired}`,
    );
  }
  // Und die Kennungen selbst: Was als leer gemeldet wird, muß in der Regel
  // stehen — sonst nennt die Oberfläche einen Ordner, den niemand gewählt hat.
  const named = new Set(namedFolderIds(pool));
  for (const folderId of pool.resolved.emptyRuleFolderIds) {
    if (!named.has(folderId)) verdictProblems.push(`${pool.name}: fremder Ordner ${folderId}`);
  }
}
check(
  `Domäne und Dienst urteilen gleich über „trifft nichts" (${deliveredPools.length} Regeln)`,
  verdictProblems.length === 0,
  verdictProblems.slice(0, 6).join(' | '),
);

/*
 * Und die fachliche Folge, gemessen an der Zahl aus der **Abfrage** — der
 * dritten Fassung derselben Regel, die in `packages/storage` steht.
 *
 * Die zweite Bedingung ist der Grund, warum dieser Abschnitt auf dem Stand vor
 * T-082 rot wäre und nicht nur grün ohne Aussage: Es muß mindestens eine Spalte
 * geben, die nichts trifft, **obwohl** nach dem Auflösen noch eine Bedingung
 * dasteht. Genau die gab es vorher nicht.
 */
const matchingNothingButFull = [];
let unresolvedButNotEmpty = 0;
for (const entry of board?.columns ?? []) {
  const resolved = entry.column.resolved;
  if (resolved.matchesNothing && entry.total !== 0) {
    matchingNothingButFull.push(`${entry.column.name}: ${entry.total} Karten`);
  }
  if (resolved.matchesNothing && !resolved.isEmpty) unresolvedButNotEmpty += 1;
}
check(
  `was nichts trifft, hat keine Mitglieder — und es gibt den Fall „nicht leer und trotzdem nichts" (${unresolvedButNotEmpty})`,
  matchingNothingButFull.length === 0 && unresolvedButNotEmpty >= 1,
  matchingNothingButFull.join(' | ') || 'kein gemischter Fall im Bestand — die Prüfung mißt nichts',
);

/*
 * Der Prüfer prüft sich selbst. `named > 0 && resolved === 0` ist die Art
 * Bedingung, die man beim zweiten Hinschreiben umdreht; hier stehen alle vier
 * Ecken.
 */
check(
  'die Ableitung „genannt, aber nichts daraus geworden" gilt in genau einer Ecke',
  tagAxisIsUnresolved({ named: 1, resolved: 0, emptyTerms: 1 }) === true &&
    tagAxisIsUnresolved({ named: 0, resolved: 0, emptyTerms: 0 }) === false &&
    tagAxisIsUnresolved({ named: 1, resolved: 1, emptyTerms: 0 }) === false &&
    tagAxisIsUnresolved({ named: 0, resolved: 3, emptyTerms: 0 }) === false &&
    // Der termweise Fall: Die Summe ist positiv, ein Term trotzdem leer.
    tagAxisIsUnresolved({ named: 2, resolved: 1, emptyTerms: 1 }) === true &&
    // Und das Netz für eine Termart, die ins Leere zeigt, ohne ein Ordner zu
    // sein: Die Achse geht leer aus, obwohl kein leerer Ordner gezählt wurde.
    tagAxisIsUnresolved({ named: 1, resolved: 0, emptyTerms: 0 }) === true,
  'die Ableitung urteilt nicht wie E-057',
);

// ---------------------------------------------------------------------------
section('15  Die Poolbewegung bei Start, Stopp und verwaister Buchung (E-058) und die Sperre auf einem Ordner in einer Regel');
// ---------------------------------------------------------------------------

/*
 * **Der Befund hinter E-058.** Der Satz „Die Karte bleibt, wo sie ist — die
 * Spalte ändert sich dadurch nicht." stand zeichengleich in der Hauptanwendung
 * und im Aufgabenbereich des Add-ins. Er stammt aus der Zeit, in der eine
 * Spalte nur an Tags hing. Seit E-055 entscheidet eine Spalte auch über
 * „Erledigt" und über den Exportstatus, und **beides ändert ein Timerstart**.
 *
 * Gemessen wird hier deshalb die Bewegung selbst, über die echte Route und an
 * einem Bestand, in dem alle drei Antworten verschieden sind: Die Karte
 * **verlässt** die Spalte `completion: 'done'`, sie **betritt** die Spalte
 * `completion: 'open'`, und die Spalte über den **leeren Ordner** darf in
 * keiner der drei Listen vorkommen (E-057).
 */

const startRecords = records.filter(
  (record) => record.operationId === 'startTimer' && record.body?.data?.kind === 'started',
);
const reopening = startRecords.find((record) => record.body?.data?.doneCleared === true);
const movement = reopening?.body?.data?.poolMovement;

check(
  `der Timerstart auf einem erledigten Todo liefert eine Bewegung (${startRecords.length} Starts aufgezeichnet)`,
  reopening !== undefined && movement !== null && movement !== undefined,
  JSON.stringify(reopening?.body?.data?.poolMovement ?? null),
);

check(
  `er **verlässt** die Spalte „${BOARD_COLUMNS.done}"`,
  Array.isArray(movement?.leaves) && movement.leaves.includes(BOARD_COLUMNS.done),
  JSON.stringify(movement?.leaves),
);

check(
  `er **betritt** die Spalte „${BOARD_COLUMNS.openOnly}"`,
  Array.isArray(movement?.enters) && movement.enters.includes(BOARD_COLUMNS.openOnly),
  JSON.stringify(movement?.enters),
);

/*
 * E-057 über die Bewegung: Eine Spalte, deren erforderlicher Ordnerterm auf
 * keinen Tag auflöst, trifft nichts — vorher nicht und nachher nicht. Sie darf
 * deshalb in **keiner** der drei Listen stehen. Stünde sie in `appears`, hätte
 * der Aufrufer die Antwort von vor E-057 bekommen; stünde sie in `enters` oder
 * `leaves`, behauptete der Dienst eine Bewegung, die die Abfrage nicht kennt.
 */
const barrenNames = [
  BOARD_COLUMNS.emptyFolder,
  BOARD_COLUMNS.emptyFolderAndStatus,
  BOARD_COLUMNS.tagOrEmptyFolder,
];
const namedBarren = barrenNames.filter((name) =>
  [...(movement?.appears ?? []), ...(movement?.enters ?? []), ...(movement?.leaves ?? [])].includes(
    name,
  ),
);
check(
  'eine Spalte über einen leeren Ordner steht in keiner der drei Listen (E-057)',
  movement !== undefined && movement !== null && namedBarren.length === 0,
  namedBarren.join(', '),
);

/*
 * Die zwei Invarianten des Wertepaares. Sie folgen aus dem Aufbau der Schleife
 * und nicht aus einer Prüfung danach — hier steht, dass der Aufbau hält.
 */
check(
  '`enters` ist eine Teilmenge von `appears`, und kein Pool steht zugleich in `enters` und `leaves`',
  movement !== undefined &&
    movement !== null &&
    movement.enters.every((name) => movement.appears.includes(name)) &&
    movement.enters.every((name) => !movement.leaves.includes(name)),
  JSON.stringify(movement),
);

/*
 * Die Gegenprobe, ohne die die Prüfungen darüber auch dann grün wären, wenn
 * der Dienst **immer** eine Bewegung schickte: Derselbe Start auf einem Todo,
 * das nicht erledigt ist und schon Buchungen hat, bewegt nichts — und
 * `poolMovement` ist dann `null` und nicht ein Trio leerer Listen.
 */
const quietStart = startRecords.find((record) => record.body?.data?.doneCleared === false);
check(
  'ein Start, der nichts aufhebt und keine erste Buchung entstehen lässt, liefert `poolMovement: null`',
  quietStart !== undefined && quietStart.body.data.poolMovement === null,
  JSON.stringify(quietStart?.body?.data?.poolMovement),
);

/*
 * **Der Satz kommt aus der Domäne** (E-058 Absatz 2). Gemessen wird an
 * derselben Bewegung, die soeben über die Leitung kam: Was der Dienst liefert,
 * muss die reine Funktion in einen Satz übersetzen können, und der Satz muss
 * die Spalten nennen, um die es geht.
 *
 * Zugleich die eine Änderung gegenüber `reopen.ts`: „Poolregel" heißt jetzt
 * „Regel", weil eine Regel fünf Achsen hat und nicht nur Tags.
 */
const futureSentence = poolMovementSentence(movement ?? { appears: [], enters: [], leaves: [] }, 'future', 'reopen');
const pastSentence = poolMovementSentence(movement ?? { appears: [], enters: [], leaves: [] }, 'past', 'reopen');
check(
  'der Wiederöffnen-Satz nennt beide Richtungen und kommt aus der Domäne',
  futureSentence.includes(BOARD_COLUMNS.openOnly) &&
    futureSentence.includes(BOARD_COLUMNS.done) &&
    futureSentence.startsWith('Es erscheint dann wieder in ') &&
    pastSentence.startsWith('Es ist zurück in '),
  `${futureSentence} || ${pastSentence}`,
);

check(
  'der Satz für „keine Regel trifft" spricht von der **Regel** und nennt beide Flächen (E-058 Punkt 4)',
  poolMovementSentence({ appears: [], enters: [], leaves: [] }, 'future', 'reopen') ===
    'Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem Pool und in keiner Spalte.' &&
    poolMovementSentence({ appears: [], enters: [], leaves: [] }, 'past', 'reopen') ===
      'Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner Spalte.',
  poolMovementSentence({ appears: [], enters: [], leaves: [] }, 'future', 'reopen'),
);

check(
  'die reine Buchung bekommt einen eigenen Satz — ohne „wieder", und `null`, wenn nichts geschieht',
  poolMovementSentence({ appears: ['A', 'B'], enters: ['B'], leaves: [] }, 'future', 'booking') ===
    'Es erscheint dann in „B“.' &&
    poolMovementSentence({ appears: ['A', 'B'], enters: ['B'], leaves: [] }, 'past', 'booking') ===
      'Es steht jetzt in „B“.' &&
    poolMovementSentence({ appears: ['A'], enters: [], leaves: [] }, 'future', 'booking') === null,
  String(poolMovementSentence({ appears: ['A', 'B'], enters: ['B'], leaves: [] }, 'future', 'booking')),
);

/*
 * **Kein Gattungswort, in keinem der vierzehn Sätze** (E-058 Punkt 4, T-093).
 *
 * Bis T-093 baute die Funktion „dem Pool „X“" beziehungsweise „den Pools „X“
 * und „Y“" ein. Das war falsch, seit E-054 eine Kanban-Spalte dieselbe Entität
 * ist wie ein Pool: Die drei Listen tragen Namen, aber keine Fläche. Ein Satz,
 * der „der Pool „Ost“" sagt, wo eine reine Board-Spalte gemeint ist, schickt
 * den Benutzer in die Pool-Liste, in der sie nicht steht.
 *
 * Gemessen wird über **alle** Zweige beider Anläße und beider Zeitformen, mit
 * einem und mit zwei Namen — eine Stichprobe an einem Zweig ließe die übrigen
 * elf offen, und genau so war der Fehler entstanden.
 */
const sentencesEverywhere = [];
for (const occasion of ['reopen', 'booking']) {
  for (const tense of ['future', 'past']) {
    for (const movementCase of [
      { appears: [], enters: [], leaves: [] },
      { appears: [], enters: [], leaves: ['A'] },
      { appears: ['A'], enters: ['A'], leaves: [] },
      { appears: ['A', 'B'], enters: ['A', 'B'], leaves: ['C', 'D'] },
    ]) {
      const sentence = poolMovementSentence(movementCase, tense, occasion);
      if (sentence !== null) sentencesEverywhere.push(sentence);
    }
  }
}
const withGenus = sentencesEverywhere.filter((sentence) =>
  /\b(dem Pool|den Pools|der Spalte|den Spalten|die Spalte|der Pool)\b/u.test(sentence),
);
check(
  `kein Satz nennt ein Gattungswort vor dem Namen (${sentencesEverywhere.length} Sätze geprüft)`,
  sentencesEverywhere.length === 14 && withGenus.length === 0,
  withGenus.join(' | ') || `${sentencesEverywhere.length} Sätze`,
);

/*
 * Die Gegenprobe zur Gegenprobe: Der Name steht **überhaupt** im Satz, und die
 * Aufzählung zweier Namen trennt sie mit „und". Ohne sie wäre die Prüfung
 * darüber auch an einer Fassung grün, die die Namen ganz wegläßt.
 */
check(
  'die Namen stehen in Anführungszeichen und werden mit „und" aufgezählt',
  poolMovementSentence({ appears: ['A', 'B'], enters: [], leaves: [] }, 'future', 'reopen') ===
    'Es erscheint dann wieder in „A“ und „B“.' &&
    poolMovementSentence({ appears: ['A', 'B', 'C'], enters: [], leaves: [] }, 'past', 'reopen') ===
      'Es ist zurück in „A“, „B“ und „C“.',
  poolMovementSentence({ appears: ['A', 'B', 'C'], enters: [], leaves: [] }, 'past', 'reopen'),
);

/*
 * **Auch der Stopp sagt, was er bewegt hat** (E-058 Punkt 6, T-093).
 *
 * Die erste abgeschlossene Buchung setzt „hat offene Buchungen", und jede
 * Spalte mit `exportState: 'open'` nimmt das Todo damit auf. Bis T-093 gab nur
 * der Start eine Auskunft — und ausgerechnet der ist der Sonderweg: Er läßt die
 * erste Buchung nur dann entstehen, wenn er einen Timer **desselben** Todos
 * verdrängt. Der Regelweg ist der Stopp.
 *
 * Gemessen wird an der echten Route, an vier Aufzeichnungen, die sich
 * gegenseitig halten:
 *
 *   1. ein Stopp, der die erste offene Buchung erzeugt  → `enters`
 *   2. ein Stopp unter der Mindestdauer (verworfen)      → `null`
 *   3. ein Stopp auf einem Todo, das schon eine hat      → `null`
 *   4. die verwaiste Buchung, gebucht                    → `enters`
 *
 * Ohne 3 wäre der Abschnitt auch an einer Fassung grün, die bei jedem Stopp
 * alle Regeln auflöst und drei leere Listen schickt.
 */
const stopRecords = records.filter((record) => record.operationId === 'stopTimer');
const bookedStops = stopRecords.filter((record) => record.body?.data?.kind === 'recorded');
const movingStop = bookedStops.find((record) => record.body.data.poolMovement !== null);
const quietStop = bookedStops.find((record) => record.body.data.poolMovement === null);
const discardedStop = stopRecords.find((record) => record.body?.data?.kind === 'discarded');

check(
  `\`POST /timer/stop\` liefert eine Bewegung, wenn die erste offene Buchung entsteht (${bookedStops.length} gebuchte Stopps)`,
  movingStop !== undefined &&
    movingStop.body.data.poolMovement.enters.includes(BOARD_COLUMNS.openWork) &&
    movingStop.body.data.poolMovement.leaves.length === 0,
  JSON.stringify(movingStop?.body?.data?.poolMovement ?? null),
);

check(
  'ein Stopp auf einem Todo, das schon eine offene Buchung hat, liefert `poolMovement: null`',
  quietStop !== undefined,
  bookedStops.map((record) => JSON.stringify(record.body.data.poolMovement)).join(' | '),
);

check(
  'ein verworfener Stopp liefert `poolMovement: null` — ohne Buchung keine Bewegung',
  discardedStop !== undefined && discardedStop.body.data.poolMovement === null,
  JSON.stringify(discardedStop?.body?.data ?? null),
);

/*
 * Und derselbe Weg über die verwaiste Buchung (E-036). Sie ist der zweite und
 * einzige andere Weg, auf dem aus einem laufenden Timer eine Buchung wird —
 * und `timer.stop` ist dort dieselbe Anweisung. Wenn hier nichts stünde, ließe
 * sich der Zweig durch Verwerfen des `poolMovement` ersetzen, ohne dass etwas
 * rot würde.
 */
const orphanResolutions = records.filter(
  (record) => record.operationId === 'resolveOrphanedTimer' && record.body?.data?.kind === 'recorded',
);
check(
  `\`POST /timer/orphaned/resolve\` liefert dieselbe Bewegung, wenn es bucht (${orphanResolutions.length} gebucht)`,
  orphanResolutions.length >= 1 &&
    orphanResolutions.every(
      (record) =>
        record.body.data.poolMovement !== null &&
        record.body.data.poolMovement.enters.includes(BOARD_COLUMNS.openWork),
    ),
  JSON.stringify(orphanResolutions[0]?.body?.data?.poolMovement ?? null),
);

/*
 * Der Anlaß ist beim Stopp **immer** `'booking'` und nie `'reopen'`: Ein Stopp
 * hebt kein „Erledigt" auf. Gemessen wird das am Satz, den die Domäne aus der
 * gelieferten Bewegung bildet — er darf kein „wieder" tragen und keine
 * Aufzählung von `appears` sein.
 */
const stopSentence =
  movingStop === undefined
    ? null
    : poolMovementSentence(movingStop.body.data.poolMovement, 'past', 'booking');
check(
  'der Satz zum Stopp nennt die betretene Spalte, ohne „wieder" und ohne `appears`',
  stopSentence === `Es steht jetzt in „${BOARD_COLUMNS.openWork}“.`,
  String(stopSentence),
);

/*
 * **Ein Ordner in einer Regel wird nicht gelöscht** (R-1 Befund 1).
 *
 * Löschbar war ohnehin nur ein leerer Ordner — und der leere Ordner in einer
 * erforderlichen Achse ist genau der Fall aus E-057. `pool_rule.folder_id`
 * stand dabei auf CASCADE: Die Regel verlor ihren Term still und traf danach
 * mehr, als der Benutzer gesagt hatte.
 *
 * Gemessen wird der Statuscode, der Schlüssel **und** die Auskunft darüber,
 * welche Regeln betroffen sind — ohne sie ist die Sperre bei zwanzig Regeln
 * eine Suche.
 */
const folderDeletes = records.filter((record) => record.operationId === 'deleteTagFolder');
const blockedFolder = folderDeletes.find((record) => record.status === 409);
const freeFolder = folderDeletes.find((record) => record.status === 204);

check(
  `ein Ordner, den eine Regel nennt, wird mit 409 \`tag_in_use\` abgewiesen (${folderDeletes.length} Löschversuche)`,
  blockedFolder !== undefined && blockedFolder.body?.error?.code === 'tag_in_use',
  `${blockedFolder?.status ?? '—'} ${JSON.stringify(blockedFolder?.body ?? null).slice(0, 200)}`,
);

const ruleDetails = (blockedFolder?.body?.error?.details ?? []).filter(
  (entry) => entry.code === 'pool_rule',
);
check(
  `die Abweisung nennt die Regeln beim Namen und mit Kennung (${ruleDetails.length})`,
  ruleDetails.length >= 1 &&
    ruleDetails.every((entry) => typeof entry.field === 'string' && entry.field.length > 0) &&
    ruleDetails.some((entry) => String(entry.message).includes(BOARD_COLUMNS.emptyFolderAndStatus)),
  JSON.stringify(ruleDetails),
);

/*
 * Die Gegenprobe: Ein Ordner, den keine Regel nennt, lässt sich weiterhin
 * löschen. Ohne sie wäre die Prüfung darüber auch an einer Fassung grün, die
 * **jeden** Ordner sperrt.
 */
check(
  'ein Ordner ohne Regel und ohne Inhalt wird weiterhin gelöscht (204)',
  freeFolder !== undefined,
  folderDeletes.map((record) => record.status).join(', '),
);

// ---------------------------------------------------------------------------
console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  console.log('\nFehlgeschlagen:');
  for (const name of failures) console.log(`  - ${name}`);
  process.exitCode = 1;
}
