/**
 * Takt — ein bewusst kleiner YAML-Leser für `openapi/takt-local-api.yaml`
 * (T-039).
 *
 * ===========================================================================
 * Warum eine eigene Fassung und nicht `js-yaml`
 * ===========================================================================
 *
 * Der Nachweispfad `proof:openapi` soll ohne neue Abhängigkeit laufen. Eine
 * Bibliothek dafür aufzunehmen hieße, `pnpm-lock.yaml` zu ändern — eine Datei,
 * die dem Orchestrator gehört —, und zwar für ein Werkzeug, das genau **eine**
 * Datei liest, die in diesem Baum liegt und deren Gestalt wir selbst bestimmen.
 *
 * Der Preis ist bekannt und wird bezahlt: Dieser Leser versteht nur die
 * Teilmenge von YAML, die in jener Datei vorkommt. Er versteht sie streng und
 * **wirft**, wo er etwas nicht kennt. Das ist der wichtige Teil — ein Leser,
 * der Unbekanntes überspringt, macht einen Nachweispfad grün, der nichts mehr
 * misst. Genau diese Sorte Grün ist der Grund, warum es T-039 gibt.
 *
 * Verstanden werden:
 *
 *  - Blockzuordnungen über Einrückung, Schlüssel einfach oder in `'…'`
 *  - Blocklisten (`- …`), auch mit einer Zuordnung, die in der Strichzeile
 *    beginnt
 *  - Flusszuordnungen und Flusslisten (`{ a: 1, b: [x, y] }`)
 *  - Blockskalare (`|`), einschließlich Leerzeilen darin
 *  - Zeilenkommentare, die eine ganze Zeile ausmachen
 *  - `true`, `false`, `null`, `~`, ganze und gebrochene Zahlen
 *
 * Nicht verstanden und deshalb ein Wurf: Anker und Verweise (`&`, `*`),
 * mehrzeilige Flussausdrücke, Dokumenttrenner, Zeitangaben, Kommentare hinter
 * einem Wert. Kommt eines davon in die Datei, wird `proof:openapi` rot, und das
 * ist die richtige Reaktion: Dann ist der Leser dem Beschriebenen nicht mehr
 * gewachsen und muss nachziehen.
 *
 * Ein einzelner Fallstrick verdient eine eigene Zeile, weil er sich still
 * auswirkt: In einer **Flusszuordnung** darf ein unquotierter Wert kein Komma
 * enthalten. `{ description: Ein Satz, mit Komma }` ist nicht das, wonach es
 * aussieht — echte YAML-Leser machen daraus zwei Schlüssel. Dieser hier wirft
 * stattdessen. In `takt-local-api.yaml` stand genau eine solche Stelle; sie ist
 * seit T-039 in Anführungszeichen.
 */

const isBlank = (line) => line.trim().length === 0;
const isComment = (line) => line.trimStart().startsWith('#');
const indentOf = (line) => line.length - line.trimStart().length;

class Reader {
  constructor(text) {
    this.lines = text.split('\n');
    this.pos = 0;
  }

  /** Die nächste bedeutungstragende Zeile, ohne sie zu verbrauchen. */
  peek() {
    while (this.pos < this.lines.length) {
      const line = this.lines[this.pos];
      if (!isBlank(line) && !isComment(line)) return line;
      this.pos += 1;
    }
    return null;
  }

  next() {
    const line = this.peek();
    if (line !== null) this.pos += 1;
    return line;
  }
}

// ---------------------------------------------------------------------------
// Flussausdrücke
// ---------------------------------------------------------------------------

class Flow {
  constructor(text) {
    this.text = text;
    this.i = 0;
  }

  ws() {
    while (this.i < this.text.length && /\s/.test(this.text[this.i])) this.i += 1;
  }

  parse() {
    this.ws();
    const c = this.text[this.i];
    if (c === '{') return this.map();
    if (c === '[') return this.seq();
    return this.scalar();
  }

  map() {
    this.i += 1;
    const out = {};
    this.ws();
    if (this.text[this.i] === '}') {
      this.i += 1;
      return out;
    }
    for (;;) {
      this.ws();
      const key = this.key();
      this.ws();
      if (this.text[this.i] !== ':') {
        throw new Error(`Flusszuordnung ohne ":" an Stelle ${this.i}: ${this.text}`);
      }
      this.i += 1;
      out[key] = this.parse();
      this.ws();
      if (this.text[this.i] === ',') {
        this.i += 1;
        continue;
      }
      if (this.text[this.i] === '}') {
        this.i += 1;
        return out;
      }
      throw new Error(`Flusszuordnung unerwartet an Stelle ${this.i}: ${this.text}`);
    }
  }

  seq() {
    this.i += 1;
    const out = [];
    this.ws();
    if (this.text[this.i] === ']') {
      this.i += 1;
      return out;
    }
    for (;;) {
      out.push(this.parse());
      this.ws();
      if (this.text[this.i] === ',') {
        this.i += 1;
        continue;
      }
      if (this.text[this.i] === ']') {
        this.i += 1;
        return out;
      }
      throw new Error(`Flussliste unerwartet an Stelle ${this.i}: ${this.text}`);
    }
  }

  key() {
    const c = this.text[this.i];
    if (c === "'" || c === '"') return this.quoted();
    const start = this.i;
    while (this.i < this.text.length && !':,}]'.includes(this.text[this.i])) this.i += 1;
    return this.text.slice(start, this.i).trim();
  }

  quoted() {
    const quote = this.text[this.i];
    this.i += 1;
    let out = '';
    while (this.i < this.text.length) {
      const c = this.text[this.i];
      if (c === quote) {
        // Zwei einfache Anführungszeichen sind eines im Text.
        if (quote === "'" && this.text[this.i + 1] === "'") {
          out += "'";
          this.i += 2;
          continue;
        }
        this.i += 1;
        return out;
      }
      out += c;
      this.i += 1;
    }
    throw new Error(`Zeichenkette ohne Ende: ${this.text}`);
  }

  scalar() {
    const c = this.text[this.i];
    if (c === "'" || c === '"') return this.quoted();
    const start = this.i;
    while (this.i < this.text.length && !',}]'.includes(this.text[this.i])) this.i += 1;
    return plain(this.text.slice(start, this.i).trim());
  }
}

const plain = (raw) => {
  if (raw === '' || raw === '~' || raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  if (raw.startsWith('&') || raw.startsWith('*')) {
    throw new Error(`Anker und Verweise versteht dieser Leser nicht: ${raw}`);
  }
  return raw;
};

const readInline = (raw) => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("'") || trimmed.startsWith('"')) return new Flow(trimmed).quoted();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return new Flow(trimmed).parse();
  return plain(trimmed);
};

// ---------------------------------------------------------------------------
// Blockstruktur
// ---------------------------------------------------------------------------

/** Zerlegt `schlüssel: rest`; gibt `null`, wenn die Zeile keine Zuordnung ist. */
const splitKey = (body) => {
  if (body.startsWith("'") || body.startsWith('"')) {
    const flow = new Flow(body);
    const key = flow.quoted();
    if (body[flow.i] !== ':') return null;
    return [key, body.slice(flow.i + 1).trim()];
  }
  if (body.startsWith('{') || body.startsWith('[')) return null;
  const match = /^(.+?):(\s|$)/.exec(body);
  if (match === null) return null;
  return [match[1].trim(), body.slice(match[1].length + 1).trim()];
};

const parseNode = (reader, indent) => {
  const line = reader.peek();
  if (line === null || indentOf(line) < indent) return null;
  if (line.trimStart().startsWith('- ') || line.trim() === '-') return parseSeq(reader, indent);
  return parseMap(reader, indent);
};

const parseMap = (reader, indent) => {
  const out = {};
  for (;;) {
    const line = reader.peek();
    if (line === null) return out;
    const at = indentOf(line);
    if (at < indent) return out;
    if (at > indent) throw new Error(`Einrückung ${at}, erwartet ${indent}: ${line}`);
    if (line.trimStart().startsWith('- ')) return out;
    reader.next();
    const split = splitKey(line.trim());
    if (split === null) throw new Error(`Keine Zuordnung: ${line}`);
    out[split[0]] = readAfterKey(reader, indent, split[1]);
  }
};

const readAfterKey = (reader, indent, rest) => {
  if (rest === '|' || rest === '|-' || rest === '|+' || rest === '>' || rest === '>-') {
    return readBlockScalar(reader, indent);
  }
  if (rest !== '') return readInline(rest);
  const nextLine = reader.peek();
  if (nextLine === null || indentOf(nextLine) <= indent) return null;
  return parseNode(reader, indentOf(nextLine));
};

const readBlockScalar = (reader, indent) => {
  const parts = [];
  let childIndent = null;
  for (;;) {
    if (reader.pos >= reader.lines.length) break;
    const raw = reader.lines[reader.pos];
    if (isBlank(raw)) {
      parts.push('');
      reader.pos += 1;
      continue;
    }
    const at = indentOf(raw);
    if (at <= indent) break;
    if (childIndent === null) childIndent = at;
    parts.push(raw.slice(childIndent));
    reader.pos += 1;
  }
  while (parts.length > 0 && parts[parts.length - 1] === '') parts.pop();
  return parts.join('\n');
};

const parseSeq = (reader, indent) => {
  const out = [];
  for (;;) {
    const line = reader.peek();
    if (line === null) return out;
    const at = indentOf(line);
    if (at < indent) return out;
    if (at > indent) throw new Error(`Listeneinrückung ${at}, erwartet ${indent}: ${line}`);
    const body = line.trim();
    if (!body.startsWith('- ') && body !== '-') return out;
    reader.next();
    const rest = body === '-' ? '' : body.slice(2).trim();

    if (rest === '') {
      const nextLine = reader.peek();
      out.push(
        nextLine === null || indentOf(nextLine) <= indent ? null : parseNode(reader, indentOf(nextLine)),
      );
      continue;
    }
    if (rest.startsWith('{') || rest.startsWith('[')) {
      out.push(readInline(rest));
      continue;
    }
    const split = splitKey(rest);
    if (split === null) {
      out.push(readInline(rest));
      continue;
    }
    // `- name: x` gefolgt von weiteren Schlüsseln auf Höhe des Strichs + 2.
    const innerIndent = indent + 2;
    const inner = { [split[0]]: readAfterKey(reader, innerIndent, split[1]) };
    const follow = reader.peek();
    if (follow !== null && indentOf(follow) === innerIndent && !follow.trimStart().startsWith('- ')) {
      Object.assign(inner, parseMap(reader, innerIndent));
    }
    out.push(inner);
  }
};

/** Liest die Teilmenge von YAML, die in der Beschreibung vorkommt. Wirft sonst. */
export const parseYaml = (text) => {
  if (text.includes('\n---\n')) throw new Error('Mehrere Dokumente versteht dieser Leser nicht.');
  const reader = new Reader(text);
  const first = reader.peek();
  if (first === null) return null;
  return parseNode(reader, indentOf(first));
};
