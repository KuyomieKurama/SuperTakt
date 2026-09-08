/**
 * Takt — wer greift auf das globale `fetch` zu (T-188, A-A-40).
 *
 * ===========================================================================
 * Warum diese Datei existiert und nicht zwei Ausdrücke an zwei Stellen
 * ===========================================================================
 *
 * Bis T-188 stand die Regel „hier geht etwas ins Netz" zweimal, in zwei
 * Fassungen, und die eine war nachweislich blind:
 *
 *  - `proof-release-safety.mjs` mißt seit T-146 mit den **benannten**
 *    Nicht-Ausgängen (`app.fetch`, `options.fetch`) und danach jedem
 *    verbliebenen `fetch` als Wort. Diese Fassung sieht `globalThis.fetch(`,
 *    `window.fetch(`, `self.fetch(` und die Zerlegung.
 *  - `proof-callers.mjs` maß seine tragende Zusage — „es gibt keinen zweiten
 *    Weg zum Dienst als diese Datei" — mit `/(?<![\w.])fetch\s*\(/`. Das ist
 *    **zeichengleich** der Ausdruck, den T-143 als S-1 als blind gemessen hat.
 *    Am Baum belegt: `apps/outlook-addin/src/ui/App.tsx` trägt
 *    `window.fetch.bind(window)` und war unsichtbar. Für diese Zusage gab es
 *    außerdem **keine** Gegenprobe.
 *
 * Zwei gepflegte Listen sind irgendwann *zufällig gleich sortiert* (E-086
 * Punkt 1). Deshalb steht die Regel jetzt einmal, beide Läufe holen sie hier,
 * und beide proben sie gegen. Wer sie ändert, ändert sie für beide — und beide
 * Gegenprobenreihen messen die Änderung.
 *
 * ===========================================================================
 * Was die Regel sagt
 * ===========================================================================
 *
 * Nicht „alles außer", sondern **die bekannten Nicht-Ausgänge namentlich**,
 * und danach jedes verbliebene `fetch` als Ausgang. Der alte Ausdruck ging den
 * umgekehrten Weg: Er schloß mit einem Rückblick auf `.` **jedes** `.fetch`
 * aus, um zwei Fälle durchzulassen — und ließ damit alles durch, was einen
 * Punkt davor hat.
 *
 * `sec-fetch-site` und `fetch_context_not_allowed` bleiben unberührt: Vor dem
 * ersten steht ein Bindestrich, hinter dem zweiten ein Unterstrich — beide
 * scheitern an der Wortgrenze und nicht an einer Ausnahme, die jemand pflegen
 * müßte.
 */

/**
 * Entfernt Kommentare, läßt Zeichenketten stehen.
 *
 * Ein Zeichenschritt statt eines regulären Ausdrucks: Ein Ausdruck kann nicht
 * unterscheiden, ob `//` in einer Zeichenkette steht — und genau dort steht es
 * in jeder Adresse dieses Vorhabens. Behandelt werden `//`, `/* … *\/`,
 * `'…'`, `"…"`, Vorlagenzeichenketten und Rusts `r"…"` und `r#"…"#`.
 *
 * Was übrig bleibt, ist **Code**. Die Beschreibung einer Datei kann damit
 * nennen, wogegen sie geschrieben ist, ohne einen Nachweis rot zu machen. Das
 * ist keine Bequemlichkeit: `apps/outlook-addin/src/ui/App.tsx` nennt `fetch`
 * in Zeile 7 in einem Absatz **über** die Einspeisung. Ohne diesen Schritt
 * meldete der Wächter die Prosa und nicht den Zugriff, und der nächste, der
 * ihn liest, lockerte ihn.
 *
 * **Längen- und zeilentreu** (T-188): Ein entfernter Kommentar hinterläßt
 * Leerzeichen, ein Zeilenumbruch darin bleibt stehen. Damit zeigt die
 * Zeilennummer eines Fundes auf dieselbe Zeile der Quelldatei, und ein
 * Wächter kann sagen **wo**, statt nur **daß**. Zwei Wortbestandteile
 * verschmelzen dabei nicht: Aus `a/*x*\/b` wird `a     b` und nicht `ab`.
 */
export function stripComments(text) {
  let out = '';
  let index = 0;
  const length = text.length;

  while (index < length) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '/' && next === '/') {
      while (index < length && text[index] !== '\n') {
        out += ' ';
        index += 1;
      }
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < length && !(text[index] === '*' && text[index + 1] === '/')) index += 1;
      index = Math.min(index + 2, length);
      for (const inner of text.slice(start, index)) out += inner === '\n' ? '\n' : ' ';
      continue;
    }
    // Rust: r"…" und r#…"…"#…
    if (char === 'r' && (next === '"' || next === '#')) {
      let hashes = 0;
      let cursor = index + 1;
      while (text[cursor] === '#') {
        hashes += 1;
        cursor += 1;
      }
      if (text[cursor] === '"') {
        const closing = `"${'#'.repeat(hashes)}`;
        const end = text.indexOf(closing, cursor + 1);
        const stop = end === -1 ? length : end + closing.length;
        out += text.slice(index, stop);
        index = stop;
        continue;
      }
    }
    if (char === '"' || char === "'" || char === '`') {
      out += char;
      index += 1;
      while (index < length) {
        const inner = text[index];
        out += inner;
        index += 1;
        if (inner === '\\') {
          if (index < length) {
            out += text[index];
            index += 1;
          }
          continue;
        }
        if (inner === char) break;
      }
      continue;
    }

    out += char;
    index += 1;
  }

  return out;
}

/**
 * Die Formen, die **kein** Zugriff auf das globale `fetch` sind.
 *
 * Die Reihenfolge trägt: Zuerst fällt `fetch: app.fetch` als Ganzes weg (so
 * übergibt `main.ts` die Kette an den Adaptor-Server), dann `app.fetch` und
 * `options.fetch` einzeln. Was danach noch als Wort dasteht, ist ein Zugriff
 * auf das globale `fetch` — gleich ob nackt, über `globalThis.`, über
 * `window.`, über `self.`, über `globalThis["fetch"]` oder aus einer Zerlegung
 * heraus.
 *
 * **Was hier nicht steht, und warum nicht.** Die Einspeisung
 * `fetch: window.fetch.bind(window)` im Aufgabenbereich ist *auch* kein
 * zweiter Weg zum Dienst — sie reicht dem Port seine Abholfunktion. Sie steht
 * trotzdem nicht in dieser Liste: Eine Ausnahme für eine Form, die überall
 * gilt, machte `window.fetch` in **jeder** Datei unsichtbar, und damit wäre
 * der Ausdruck wieder so blind wie der, den er ersetzt. Wo die Einspeisung
 * geduldet wird, ist eine Frage der **Datei** und wird beim Aufrufer benannt,
 * nicht hier.
 */
export const NON_EXIT_FORMS = [
  /** `main.ts` reicht die Hono-Anwendung an `@hono/node-server` weiter. */
  /\bfetch\s*:\s*app\.fetch\b/g,
  /** Die Hono-Anwendung selbst. Ein Feld, kein globales `fetch`. */
  /(?<![\w$])app\s*\.\s*fetch\b/g,
  /** Die austauschbare Abholfunktion des Ports (E-066 Punkt 1). */
  /(?<![\w$])options\s*\.\s*fetch\b/g,
];

/**
 * `fetch` als Wort, nachdem die bekannten Nicht-Ausgänge entfernt sind.
 *
 * Der Bindestrich in der Rückschau hält `sec-fetch-site` draußen; ein Punkt
 * steht **nicht** darin, und genau das ist der Unterschied zum blinden
 * Ausdruck.
 */
export const FETCH_WORD = /(?<![\w$-])fetch\b/;

/**
 * Der Ausdruck, der bis T-146 in `proof-release-safety.mjs` und bis T-188 in
 * `proof-callers.mjs` stand — **nur noch als Meßgegenstand**.
 *
 * Er wird nirgends mehr zum Urteilen benutzt. Er steht hier, damit die
 * Behauptung „er sieht vier von fünf Schreibweisen nicht" eine **Messung**
 * ist und kein Absatz. Wo ein Wächter etwas begründet, statt es zu messen,
 * gehört die Begründung in die nächste Gegenprobe.
 */
export const BLIND_FETCH_CALL = /(?<![\w.])fetch\s*\(/;

/** Ersetzt einen Treffer durch gleich viele Leerzeichen, Umbrüche bleiben. */
const blank = (match) => match.replace(/[^\n]/g, ' ');

/** Derselbe Text ohne die benannten Nicht-Ausgänge, längen- und zeilentreu. */
export function withoutNonExitForms(code) {
  let rest = code;
  for (const form of NON_EXIT_FORMS) rest = rest.replace(form, blank);
  return rest;
}

/**
 * Ist in diesem **Code** ein Zugriff auf das globale `fetch`?
 *
 * Erwartet bereits kommentarfreien Text; wer eine Quelldatei hat, nimmt
 * {@link findGlobalFetch}.
 */
export function mentionsGlobalFetch(code) {
  return FETCH_WORD.test(withoutNonExitForms(code));
}

/**
 * Jede Zeile einer **Quelldatei**, die auf das globale `fetch` zugreift.
 *
 * Gibt Zeilennummer und den Wortlaut der Zeile zurück, damit ein Befund den
 * Ort nennt und nicht nur die Datei. Kommentare sind vorher entfernt; der
 * Wortlaut kommt trotzdem aus der **rohen** Quelle, weil ein Leser die Zeile
 * wiederfinden können soll, wie sie dasteht.
 */
export function findGlobalFetch(source) {
  const scanned = withoutNonExitForms(stripComments(source)).split('\n');
  const raw = source.split('\n');
  const hits = [];
  for (const [index, line] of scanned.entries()) {
    if (!FETCH_WORD.test(line)) continue;
    hits.push({ line: index + 1, text: (raw[index] ?? line).trim() });
  }
  return hits;
}

/**
 * Welche Dateien greifen auf das globale `fetch` zu, obwohl sie es nicht
 * dürfen?
 *
 * `files` sind `{ name, source }`; `allowed` ist die **ausgeschriebene** Liste
 * der Dateien, in denen der Zugriff seinen Platz hat. Ausgeschrieben und nicht
 * als Ausdruck: Wer eine Datei hinzufügt, soll sie eintragen und dabei merken,
 * daß er sie eintragen mußte.
 */
export function strayGlobalFetch(files, allowed) {
  const stray = [];
  for (const file of files) {
    if (allowed.includes(file.name)) continue;
    const hits = findGlobalFetch(file.source);
    if (hits.length > 0) stray.push({ name: file.name, hits });
  }
  return stray;
}

/** Ein Befund als eine Zeile, für die Ausgabe eines Laufs. */
export const describeStray = (finding) =>
  `${finding.name}:${String(finding.hits[0].line)} — ${finding.hits[0].text}`;
