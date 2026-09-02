/**
 * Takt — der Leser der Aufrufer (T-051).
 *
 * Dieses Modul liest `apps/web/src/api/endpoints.ts` **syntaktisch** und sagt,
 * welche Route jede Funktion anfährt und welche Schlüssel sie dabei in Rumpf
 * und Abfragezeichenkette schreibt. Es urteilt nicht; das Urteil steht in
 * `proof-callers.mjs`.
 *
 * Warum getrennt: Ein Leser, der zugleich urteilt, lässt sich nicht mit einer
 * erfundenen Eingabe auf die Probe stellen. Hier geht Text hinein und eine
 * Aufstellung heraus — damit kann der Nachweis sich selbst prüfen, indem er
 * denselben Leser auf einen absichtlich verdorbenen Text ansetzt.
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
 * „unaufgelöst"; siehe Kopfabsatz.
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
    if (ts.isTypeAliasDeclaration(statement) && ts.isTypeLiteralNode(statement.type)) {
      index.set(statement.name.text, { members: membersOf(statement.type.members), bases: [] });
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
    return resolveTypeName(node.typeName.text, index, seen);
  }
  return null;
}

function resolveTypeName(name, index, seen) {
  if (seen.has(name)) return null; // Kreis: lieber unaufgelöst als endlos
  seen.add(name);
  const entry = index.get(name);
  if (entry === undefined || entry.members === null) return null;
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
 * Liest alle `request(...)`-Aufrufe eines Quelltextes.
 *
 * @returns {{ functions: number, calls: Array<object>, unreadable: string[] }}
 */
export function scanCallers(text, typeIndex, fileName = 'endpoints.ts') {
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

  const visit = (node, fn) => {
    let current = fn;
    if (ts.isFunctionDeclaration(node)) {
      functions += 1;
      current = node;
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'request') {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const where = current === null || current.name === undefined ? `Zeile ${line}` : current.name.text;
      const context = { parameters: parametersOf(current), typeIndex };

      const path = readPath(node.arguments[0]);
      if (path === null) unreadable.push(`${where}: der Pfad ist kein Literal`);

      const options = node.arguments[1];
      const methodNode = propertyValue(options, 'method');
      let method = 'GET';
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

      const bodyNode = propertyValue(options, 'body');
      const queryNode = propertyValue(options, 'query');

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
