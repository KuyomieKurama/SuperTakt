/**
 * Takt — der Leser der Aufrufer (T-051).
 *
 * Dieses Modul liest die Aufrufer des Dienstes — `apps/web/src/api/endpoints.ts`
 * und `apps/outlook-addin/src/api/client.ts` — **syntaktisch** und sagt,
 * welche Route jede Funktion anfährt und welche Schlüssel sie dabei in Rumpf
 * und Abfragezeichenkette schreibt. Es urteilt nicht; das Urteil steht in
 * `proof-callers.mjs`.
 *
 * Warum getrennt: Ein Leser, der zugleich urteilt, lässt sich nicht mit einer
 * erfundenen Eingabe auf die Probe stellen. Hier geht Text hinein und eine
 * Aufstellung heraus — damit kann der Nachweis sich selbst prüfen, indem er
 * denselben Leser auf einen absichtlich verdorbenen Text ansetzt.
 *
 * **Zwei Aufrufergestalten** (T-132, O-M). Die Oberfläche ruft
 * `request(pfad, optionen)` an, das Add-in `call(methode, pfad, abfrage,
 * rumpf)`. Beide gehen durch denselben Leser; welche Gestalt gemeint ist,
 * sagt {@link CALL_SHAPES}. Zwei Leser wären zwei Auffassungen davon, was ein
 * Aufruf ist, und eine davon liefe der anderen davon.
 *
 * **Was dieser Leser kann und was nicht.** Er sieht Objektliterale, auch unter
 * `...(Bedingung ? { a } : {})`, und er löst einen Bezeichner auf, dessen Typ
 * am Parameter der umschließenden Funktion steht — `body: TodoCreate` wird zu
 * den Feldern von `TodoCreate` aus `apps/web/src/api/types.ts`. Er rechnet
 * nicht: Ein Schlüssel, der zur Laufzeit entsteht (`[name]: …`), eine
 * Verbreitung aus einer Variablen ohne bekannten Typ, ein Rumpf aus einem
 * Funktionsaufruf — all das kommt als **unaufgelöst** heraus und nicht als
 * „nichts gefunden". Der Unterschied ist der ganze Zweck: Ein blinder Fleck
 * mit Namen ist brauchbar, ein blinder Fleck ohne Namen ist gefährlich.
 */

import ts from 'typescript';

/** `/todos/{todoId}` und `/todos/${id}` treffen sich in `/todos/{}`. */
export const normalizePath = (path) => path.replace(/\{[^}]*\}/g, '{}');

const nameOf = (node) => {
  const name = node.name;
  if (name === undefined) return null;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Typen der Oberfläche
// ---------------------------------------------------------------------------

/**
 * Baut aus `apps/web/src/api/types.ts` eine Aufstellung „Name → Feldnamen".
 *
 * Nur Schnittstellen und Aliasse auf ein Typliteral. Alles andere — Vereinigung,
 * `Omit`, `Record` — bleibt außen vor und führt beim Nachschlagen zu
 * „unaufgelöst"; siehe Kopfabsatz. Die Ausnahme sind `Partial`, `Required` und
 * `Readonly`, die die Feldnamen unverändert lassen; siehe `resolveTypeNode`.
 */
export function buildTypeIndex(text, fileName = 'types.ts') {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const index = new Map();

  const membersOf = (members) => {
    const names = [];
    for (const member of members) {
      if (!ts.isPropertySignature(member)) return null; // Indexsignatur, Methode: nicht auflösbar
      const name = nameOf(member);
      if (name === null) return null;
      names.push(name);
    }
    return names;
  };

  for (const statement of source.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      const bases = [];
      for (const clause of statement.heritageClauses ?? []) {
        for (const type of clause.types) {
          bases.push(ts.isIdentifier(type.expression) ? type.expression.text : null);
        }
      }
      index.set(statement.name.text, { members: membersOf(statement.members), bases });
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement)) {
      // Der Alias wird **nicht** hier aufgelöst, sondern beim Nachschlagen:
      // `type PoolPatch = Partial<PoolWrite>` zeigt auf einen Typ, der weiter
      // unten in der Datei stehen darf. Bis T-074 wurden nur Aliasse auf ein
      // Typliteral aufgenommen, und alles andere fiel stumm heraus — als
      // „unaufgelöst" beim Aufrufer, nicht als Lücke im Verzeichnis.
      index.set(statement.name.text, {
        members: ts.isTypeLiteralNode(statement.type) ? membersOf(statement.type.members) : null,
        alias: ts.isTypeLiteralNode(statement.type) ? undefined : statement.type,
        bases: [],
      });
    }
  }
  return index;
}

/** Feldnamen eines Typknotens, oder `null`, wenn dieser Leser sie nicht kennt. */
function resolveTypeNode(node, index, seen = new Set()) {
  if (node === undefined) return null;
  if (ts.isParenthesizedTypeNode(node)) return resolveTypeNode(node.type, index, seen);

  if (ts.isTypeLiteralNode(node)) {
    const names = [];
    for (const member of node.members) {
      if (!ts.isPropertySignature(member)) return null;
      const name = nameOf(member);
      if (name === null) return null;
      names.push(name);
    }
    return names;
  }

  if (ts.isIntersectionTypeNode(node)) {
    const names = [];
    for (const part of node.types) {
      const resolved = resolveTypeNode(part, index, seen);
      if (resolved === null) return null;
      names.push(...resolved);
    }
    return names;
  }

  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    /**
     * Die drei eingebauten Hilfstypen, die die **Feldnamen unverändert**
     * lassen (T-074).
     *
     * `Partial<T>`, `Required<T>` und `Readonly<T>` ändern nur, ob ein Feld
     * weglassbar oder schreibbar ist, nie welche es gibt. Für die Frage dieses
     * Lesers — „welche Schlüssel kann dieser Aufruf schreiben?" — ist die
     * Antwort deshalb dieselbe wie für `T`.
     *
     * `Omit`, `Pick` und `Record` bleiben ausdrücklich draußen: Sie ändern die
     * Menge, und ein Leser, der sie raten würde, gäbe eine falsche Antwort
     * statt „unaufgelöst".
     *
     * Anlass: `PoolPatch = Partial<PoolWrite>` aus T-072. Der Rumpf von
     * `updatePool` war damit unauflösbar, und der Lauf meldete gleich dreierlei
     * — einen blinden Fleck, vier angeblich nie gesendete Felder und den
     * Selbsttest aus Abschnitt 6.
     */
    const TRANSPARENT = new Set(['Partial', 'Required', 'Readonly']);
    if (TRANSPARENT.has(node.typeName.text)) {
      const argument = node.typeArguments?.[0];
      return argument === undefined ? null : resolveTypeNode(argument, index, seen);
    }
    return resolveTypeName(node.typeName.text, index, seen);
  }
  return null;
}

function resolveTypeName(name, index, seen) {
  if (seen.has(name)) return null; // Kreis: lieber unaufgelöst als endlos
  seen.add(name);
  const entry = index.get(name);
  if (entry === undefined) return null;
  // Ein Alias auf etwas anderes als ein Typliteral — `Partial<PoolWrite>` etwa.
  // Er wird über denselben Weg aufgelöst wie jede andere Typangabe, damit es
  // nur **eine** Stelle gibt, die weiß, was dieser Leser kann.
  if (entry.members === null && entry.alias !== undefined) {
    return resolveTypeNode(entry.alias, index, seen);
  }
  if (entry.members === null) return null;
  const names = [...entry.members];
  for (const base of entry.bases) {
    if (base === null) return null;
    const inherited = resolveTypeName(base, index, seen);
    if (inherited === null) return null;
    names.push(...inherited);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Die Aufrufe
// ---------------------------------------------------------------------------

/**
 * Sammelt die Schlüssel eines Ausdrucks.
 *
 * Rückgabe ist immer beides: die erkannten Schlüssel **und** die Stellen, an
 * denen der Leser nichts erkennen konnte.
 */
function keysOf(node, context) {
  const keys = [];
  const unresolved = [];

  const walk = (current) => {
    if (current === undefined) {
      unresolved.push('kein Ausdruck');
      return;
    }
    if (ts.isParenthesizedExpression(current)) return walk(current.expression);
    if (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isNonNullExpression(current)) {
      return walk(current.expression);
    }
    // `...(x === undefined ? {} : { a: x })` — beide Zweige zählen. Ein
    // Schlüssel, der nur manchmal mitgeht, geht manchmal mit.
    if (ts.isConditionalExpression(current)) {
      walk(current.whenTrue);
      walk(current.whenFalse);
      return;
    }
    if (ts.isObjectLiteralExpression(current)) {
      for (const property of current.properties) {
        if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)) {
          const name = nameOf(property);
          if (name === null) unresolved.push('berechneter Schlüsselname');
          else keys.push(name);
          continue;
        }
        if (ts.isSpreadAssignment(property)) {
          walk(property.expression);
          continue;
        }
        unresolved.push(`Eigenschaft der Art ${ts.SyntaxKind[property.kind]}`);
      }
      return;
    }
    if (ts.isIdentifier(current)) {
      const typeNode = context.parameters.get(current.text);
      if (typeNode === undefined) {
        unresolved.push(`Bezeichner \`${current.text}\` ist kein Parameter mit Typangabe`);
        return;
      }
      const names = resolveTypeNode(typeNode, context.typeIndex);
      if (names === null) {
        unresolved.push(`Typ von \`${current.text}\` ist für diesen Leser nicht auflösbar`);
        return;
      }
      keys.push(...names);
      return;
    }
    unresolved.push(`Ausdruck der Art ${ts.SyntaxKind[current.kind]}`);
  };

  walk(node);
  return { keys: [...new Set(keys)], unresolved };
}

const readPath = (node) => {
  if (node === undefined) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    // Was in `${…}` steht, ist ein Wegstück. Welches, weiß erst die Laufzeit.
    for (const span of node.templateSpans) out += `{}${span.literal.text}`;
    return out;
  }
  return null;
};

const propertyValue = (object, name) => {
  if (object === undefined || !ts.isObjectLiteralExpression(object)) return undefined;
  for (const property of object.properties) {
    if (ts.isPropertyAssignment(property) && nameOf(property) === name) return property.initializer;
    if (ts.isShorthandPropertyAssignment(property) && nameOf(property) === name) return property.name;
  }
  return undefined;
};

/**
 * Die beiden Aufrufgestalten, die dieser Leser kennt (T-132, O-M).
 *
 * ---------------------------------------------------------------------------
 * Warum das ein Parameter ist und keine zweite Datei
 * ---------------------------------------------------------------------------
 *
 * Bis T-132 las dieser Leser genau eine Gestalt: `request(pfad, optionen)` aus
 * `apps/web/src/api/endpoints.ts`. Die zweite Aufruferseite des Dienstes — das
 * Add-in mit `call(methode, pfad, abfrage, rumpf)` — war damit von
 * `proof:callers` **nicht erfasst** (O-M). Sie schickt Rümpfe an dieselben
 * Schemata und hat dieselbe Art Fehler zu machen: ein Schlüsselname, den keine
 * Route liest, fällt keinem Übersetzer auf.
 *
 * Ein zweiter Leser wäre die falsche Antwort gewesen. Zwei Leser sind zwei
 * Auffassungen davon, was ein Aufruf ist, und eine davon läuft irgendwann der
 * anderen davon — genau das Muster, das T-114 an zwei Eingabeschemata
 * gefunden hat. Hier ist es **ein** Leser mit einem Formparameter: Was er
 * kann, kann er für beide Seiten, und was er nicht kann, meldet er für beide
 * als blinden Fleck.
 *
 *   `options`     `request('/todos', { method: 'POST', body, query })`
 *   `positional`  `call('POST', '/api/v1/addin/todos', abfrage, rumpf)`
 */
export const CALL_SHAPES = Object.freeze({
  options: Object.freeze({ callee: 'request', layout: 'options', pathPrefix: '' }),
  addin: Object.freeze({ callee: 'call', layout: 'positional', pathPrefix: '/api/v1' }),
});

/**
 * Die Parameter mit Typangabe der **innersten** umschließenden Funktion.
 *
 * Erfasst werden Funktionsdeklaration, Methode eines Objektliterals,
 * Funktionsausdruck und Pfeilfunktion. Die Methode ist der Fall, den das
 * Add-in braucht: `createTodo(input: CreateTodoRequest) { … }` steht in dem
 * Objektliteral, das `createApiClient` zurückgibt.
 */
function isFunctionLike(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

/** Der Name einer umschließenden Funktion, oder `null`. */
function functionName(fn) {
  if (fn === null || fn.name === undefined) return null;
  return ts.isIdentifier(fn.name) ? fn.name.text : null;
}

/**
 * Liest alle Aufrufe eines Quelltextes, die auf den Dienst zeigen.
 *
 * @returns {{ functions: number, calls: Array<object>, unreadable: string[] }}
 */
export function scanCallers(text, typeIndex, fileName = 'endpoints.ts', shape = CALL_SHAPES.options) {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const calls = [];
  const unreadable = [];
  let functions = 0;

  const parametersOf = (fn) => {
    const map = new Map();
    if (fn === null) return map;
    for (const parameter of fn.parameters) {
      if (ts.isIdentifier(parameter.name)) map.set(parameter.name.text, parameter.type);
    }
    return map;
  };

  /** Der Pfad ohne die Vorsilbe, die der Aufrufer mitschreibt und der Dienst nicht führt. */
  const stripPrefix = (path) => {
    if (path === null || shape.pathPrefix === '') return path;
    return path.startsWith(shape.pathPrefix) ? path.slice(shape.pathPrefix.length) : path;
  };

  const visit = (node, fn) => {
    let current = fn;
    if (isFunctionLike(node)) {
      // Gezählt werden nur benannte Funktionen — dasselbe wie vorher, nur dass
      // eine Methode jetzt auch eine ist.
      if (functionName(node) !== null) functions += 1;
      current = node;
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === shape.callee) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const named = functionName(current);
      const where = named === null ? `Zeile ${line}` : named;
      const context = { parameters: parametersOf(current), typeIndex };

      let path = null;
      let method = 'GET';
      let bodyNode;
      let queryNode;

      if (shape.layout === 'positional') {
        // `call(methode, pfad, abfrage, rumpf)`
        const methodNode = node.arguments[0];
        if (methodNode !== undefined && ts.isStringLiteral(methodNode)) {
          method = methodNode.text.toUpperCase();
        } else {
          method = null;
          unreadable.push(`${where}: die Methode ist kein Literal`);
        }
        path = stripPrefix(readPath(node.arguments[1]));
        if (path === null) unreadable.push(`${where}: der Pfad ist kein Literal`);
        queryNode = undefinedIfVoid(node.arguments[2]);
        bodyNode = undefinedIfVoid(node.arguments[3]);
      } else {
        // `request(pfad, { method, body, query })`
        path = stripPrefix(readPath(node.arguments[0]));
        if (path === null) unreadable.push(`${where}: der Pfad ist kein Literal`);

        const options = node.arguments[1];
        const methodNode = propertyValue(options, 'method');
        if (methodNode !== undefined) {
          if (ts.isStringLiteral(methodNode)) method = methodNode.text.toUpperCase();
          else {
            method = null;
            unreadable.push(`${where}: die Methode ist kein Literal`);
          }
        } else if (options !== undefined && !ts.isObjectLiteralExpression(options)) {
          method = null;
          unreadable.push(`${where}: die Aufrufoptionen sind kein Objektliteral`);
        }

        bodyNode = propertyValue(options, 'body');
        queryNode = propertyValue(options, 'query');
      }

      calls.push({
        where,
        line,
        method,
        path,
        normalized: path === null ? null : normalizePath(path),
        body: bodyNode === undefined ? null : keysOf(bodyNode, context),
        query: queryNode === undefined ? null : keysOf(queryNode, context),
      });
    }

    ts.forEachChild(node, (child) => visit(child, current));
  };

  visit(source, null);
  return { functions, calls, unreadable };
}

/**
 * `undefined` als **Platzhalter** ist kein Wert, sondern eine Leerstelle.
 *
 * `call('POST', '/addin/todos', undefined, input)` schreibt an dritter Stelle
 * ein `undefined`, weil die vierte belegt werden soll. Ohne diese Zeile hielte
 * der Leser das für eine Abfrage, deren Schlüssel er nicht kennt, und meldete
 * einen blinden Fleck, wo keiner ist.
 */
function undefinedIfVoid(node) {
  if (node === undefined) return undefined;
  if (ts.isIdentifier(node) && node.text === 'undefined') return undefined;
  return node;
}
