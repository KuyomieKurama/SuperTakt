/**
 * Takt — hält einen gelieferten Antwortrumpf gegen das, was die
 * Schnittstellenbeschreibung über ihn sagt (T-041).
 *
 * ===========================================================================
 * Warum das ein eigenes Stück ist und keine Bibliothek
 * ===========================================================================
 *
 * Ein vollständiger JSON-Schema-Prüfer wäre eine neue Abhängigkeit und damit
 * eine Änderung an `pnpm-lock.yaml` — fremde Hoheit, dieselbe Begründung wie
 * beim YAML-Leser in T-039. Gebraucht wird ohnehin nicht die ganze Sprache,
 * sondern die Teilmenge, die in `openapi/takt-local-api.yaml` vorkommt:
 * `$ref`, `allOf`, `oneOf`/`anyOf`, `type`, `const`, `enum`, `properties`,
 * `required`, `items`, `additionalProperties`.
 *
 * Und die Strenge ist hier der Inhalt, nicht die Vollständigkeit. Ein Prüfer,
 * der bei Unbekanntem stillschweigend durchwinkt, wäre grün, weil er nichts
 * findet — genau die Sorte Grün, gegen die T-039 und T-041 geschrieben sind.
 * Dieser hier **wirft** bei einem Verweis, den er nicht auflösen kann, und
 * meldet ein Feld, das geliefert, aber nicht beschrieben ist, als Abweichung.
 *
 * ===========================================================================
 * Die Regel, an der er misst
 * ===========================================================================
 *
 * Dieselbe wie in T-039 für die Anfragen, nur andersherum gelesen:
 *
 *  - **Ein beschriebenes Pflichtfeld, das fehlt, ist eine Falschaussage.** Wer
 *    dagegen baut, liest `undefined` und bekommt keinen Übersetzungsfehler,
 *    sondern eine leere Anzeige (T-022).
 *  - **Ein geliefertes Feld, das nicht beschrieben ist, ist ebenfalls eine.**
 *    Es ist der Fall, in dem die Beschreibung eine Entität verspricht und der
 *    Dienst eine Hülle darum liefert — `data.items` statt `data` (T-029).
 *    Wer das absichtlich offenlassen will, schreibt `additionalProperties:
 *    true` hin; dann ist es eine Aussage und kein Versehen.
 *  - **Eine beschriebene Gestalt, die nicht passt, erst recht.** `type:
 *    object`, wo ein Feld geliefert wird, `const: started`, wo
 *    `confirmation_required` steht.
 *
 * Was **nicht** geprüft wird: `description`, `example`, `format`, `maxLength`
 * und die übrigen Beschränkungen. Sie beschreiben die Anfrage; auf der Antwort
 * wären sie eine zweite Wahrheit über Werte, die der Dienst selbst bildet.
 */

const REF_PATTERN = /^#\/components\/([A-Za-z]+)\/([A-Za-z0-9_]+)$/;

/** Wie ein gelieferter Wert in der Sprache von JSON Schema heißt. */
export function kindOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

const shortly = (value) => {
  const text = JSON.stringify(value);
  if (text === undefined) return String(value);
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
};

/**
 * Baut einen Vergleicher für **eine** gelesene Beschreibung.
 *
 * Der Baum wird gebraucht, weil `$ref` nur innerhalb desselben Dokuments
 * auflösbar ist.
 */
export function createMatcher(doc) {
  /** Folgt `$ref`, so oft nötig. Ein Verweis ins Leere ist ein Wurf. */
  const deref = (node, depth = 0) => {
    if (depth > 20) throw new Error('Verweiskette tiefer als 20 — vermutlich ein Kreis.');
    if (node === null || typeof node !== 'object' || typeof node.$ref !== 'string') return node;
    const parts = REF_PATTERN.exec(node.$ref);
    if (parts === null) throw new Error(`Unlesbarer Verweis: ${node.$ref}`);
    const target = doc.components?.[parts[1]]?.[parts[2]];
    if (target === undefined) throw new Error(`Verweis ins Leere: ${node.$ref}`);
    return deref(target, depth + 1);
  };

  /**
   * Zieht `allOf` zu **einem** Schema zusammen.
   *
   * Ohne diesen Schritt wäre die Prüfung auf unbeschriebene Felder falsch:
   * `allOf: [PageInfo, {properties: {items}}]` beschreibt zusammen vier
   * Felder, und jeder Zweig für sich hielte die drei anderen für unbeschrieben.
   * Der Seitenumschlag aus T-029 ist genau so gebaut — die Zusammenführung ist
   * hier keine Bequemlichkeit, sondern die Voraussetzung dafür, dass die
   * Prüfung überhaupt etwas Richtiges sagt.
   */
  const flatten = (node, depth = 0) => {
    if (depth > 20) throw new Error('allOf tiefer als 20 verschachtelt.');
    const schema = deref(node);
    if (schema === null || typeof schema !== 'object' || !Array.isArray(schema.allOf)) return schema;

    const merged = { ...schema };
    delete merged.allOf;
    for (const part of schema.allOf) {
      const piece = flatten(part, depth + 1);
      if (piece === null || typeof piece !== 'object') continue;
      for (const [key, value] of Object.entries(piece)) {
        if (key === 'properties') merged.properties = { ...value, ...(merged.properties ?? {}) };
        else if (key === 'required') merged.required = [...(merged.required ?? []), ...value];
        else if (merged[key] === undefined) merged[key] = value;
      }
    }
    return merged;
  };

  /**
   * Vergleicht einen Wert mit einem Schema und liefert die Beanstandungen.
   *
   * Der Rückgabewert ist eine Liste von Sätzen, nicht ein `boolean`. Ein
   * Nachweispfad, der nur „passt nicht" sagt, verlagert die Arbeit auf den
   * Leser — und die Arbeit ist genau das, was hier maschinell werden soll.
   */
  const match = (value, rawSchema, where) => {
    const schema = flatten(rawSchema);
    if (schema === undefined || schema === null || schema === true) return [];
    if (typeof schema !== 'object') throw new Error(`Kein Schema an ${where}: ${shortly(schema)}`);

    // ---- Fallunterscheidung: oneOf/anyOf -----------------------------------
    const alternatives = schema.oneOf ?? schema.anyOf;
    if (Array.isArray(alternatives)) {
      const attempts = alternatives.map((alt) => match(value, alt, where));
      if (attempts.some((problems) => problems.length === 0)) return [];
      // Der Zweig mit den wenigsten Beanstandungen ist der, den der Aufrufer
      // gemeint hat. Ihn zu nennen ist der Unterschied zwischen einem Befund,
      // den jemand behebt, und einem, den jemand wegdrückt.
      const closest = attempts.reduce((a, b) => (b.length < a.length ? b : a));
      return [
        `${where}: keiner der ${alternatives.length} beschriebenen Fälle passt auf ${shortly(value)}` +
          ` — nächstliegend: ${closest.join('; ')}`,
      ];
    }

    const problems = [];

    // ---- Art ---------------------------------------------------------------
    const got = kindOf(value);
    if (schema.type !== undefined) {
      const wanted = Array.isArray(schema.type) ? schema.type : [schema.type];
      const fits = wanted.some((type) => type === got || (type === 'number' && got === 'integer'));
      if (!fits) {
        // Bei falscher Art hat es keinen Sinn, in die Felder zu steigen: Es
        // käme eine Lawine Folgefehler zu einer Ursache.
        return [`${where}: beschrieben als ${wanted.join(' oder ')}, geliefert ${got} (${shortly(value)})`];
      }
    }

    // ---- Fester Wert und Aufzählung ---------------------------------------
    if (schema.const !== undefined && value !== schema.const) {
      problems.push(`${where}: beschrieben als fester Wert ${shortly(schema.const)}, geliefert ${shortly(value)}`);
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      problems.push(`${where}: geliefert ${shortly(value)}, beschrieben sind nur ${schema.enum.map(shortly).join(', ')}`);
    }

    // ---- Objekt ------------------------------------------------------------
    if (got === 'object') {
      for (const name of new Set(schema.required ?? [])) {
        if (!Object.hasOwn(value, name)) {
          problems.push(`${where}.${name}: beschrieben als Pflichtfeld, fehlt in der Antwort`);
        }
      }

      const properties = schema.properties;
      const extra = schema.additionalProperties;
      if (properties !== undefined) {
        for (const [name, inner] of Object.entries(value)) {
          if (Object.hasOwn(properties, name)) {
            problems.push(...match(inner, properties[name], `${where}.${name}`));
          } else if (extra === true) {
            /* ausdrücklich offengelassen */
          } else if (extra !== undefined && typeof extra === 'object') {
            problems.push(...match(inner, extra, `${where}.${name}`));
          } else {
            problems.push(`${where}.${name}: geliefert, aber nicht beschrieben`);
          }
        }
      } else if (extra === undefined && schema.type === 'object' && Object.keys(value).length > 0) {
        // `type: object` ohne ein einziges Feld ist keine Beschreibung, sondern
        // die Abwesenheit einer. Wer eine Gestalt bewusst offenlässt — die
        // Definition einer Exportvorlage etwa gehört dem Motor und nicht dieser
        // Datei —, schreibt `additionalProperties: true` und sagt es damit.
        problems.push(
          `${where}: als "object" ohne Felder beschrieben, geliefert werden ${Object.keys(value).join(', ')}`,
        );
      }
    }

    // ---- Liste -------------------------------------------------------------
    if (got === 'array' && schema.items !== undefined) {
      value.forEach((entry, index) => {
        problems.push(...match(entry, schema.items, `${where}[${index}]`));
      });
    }

    return problems;
  };

  /**
   * Fasst Beanstandungen zusammen, die sich nur im Listenindex unterscheiden.
   *
   * Eine Liste mit vierzig Einträgen erzeugt sonst vierzigmal denselben Satz,
   * und der eine Befund daneben geht darin unter.
   */
  const condense = (problems) => [...new Set(problems.map((line) => line.replace(/\[\d+\]/g, '[]')))];

  return { deref, flatten, match, condense };
}
