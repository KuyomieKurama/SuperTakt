/**
 * Takt — die Wächter über die Fläche der Hülle (E-067 Punkt 3, Auflagen A-V-16
 * bis A-V-18).
 *
 * Aufruf:  pnpm --filter @takt/desktop proof:shell-surface
 *
 * ===========================================================================
 * Warum es diesen Lauf gibt
 * ===========================================================================
 *
 * Zwei Zusagen der Versionsprüfung sind nicht durch Verhalten prüfbar, weil sie
 * Aussagen über **Abwesenheit** sind. Beide stehen heute in Prosa, und beide
 * wären mit einer Zeile aufgehoben, ohne dass ein Test rot würde:
 *
 *  1. **Keine Shell-Berechtigung** in `capabilities/**` (A-V-17). T-136 hat
 *     gemessen: Der Vorgabesatz `shell:default` enthält `allow-open`, und
 *     dessen Prüfausdruck `^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+` lässt
 *     **jede** `https:`-Adresse durch — er prüft das Schema und sonst nichts
 *     und ist am Ende nicht verankert. Eine Zeile `"shell:default"` in der
 *     Fähigkeitenliste wäre damit eine offene Weiterleitung in den Browser des
 *     Benutzers, ausgelöst von einem eingeschleusten Skript im Webview.
 *  2. **Die CSP wird nicht geöffnet** (A-V-18). Der Webview darf `connect-src`
 *     nur auf sich selbst, `ipc:`, `http://ipc.localhost` und
 *     `http://127.0.0.1:17843`. Ein `https://api.github.com` darin wäre der
 *     Entwurf, den E-064 Punkt 2 ausdrücklich verworfen hat: Eine Liste, die
 *     man für eine Funktion aufmacht, bleibt für alles andere offen.
 *
 * Dazu kommen zwei weitere. Der dritte folgt aus Befund T-136-1: Auf dem
 * Rust-Weg prüft `tauri-plugin-shell` **gar nichts**
 * (`open::open(None, …)` — „when running directly from Rust code we don't need
 * to validate the path"). Es gibt deshalb genau **einen** erlaubten Aufrufort
 * für `open` im ganzen Rust-Anteil, und in dessen Datei steht genau **eine**
 * Adresse. Ein zweiter Aufrufort — gleich zu welchem Zweck — lässt diesen Lauf
 * rot werden, bevor ein Verhaltenstest ihn bemerken müsste.
 *
 * Der vierte hält die **angezeigte** Adresse gegen die **geöffnete**: Der
 * Dialog nennt die Release-Seite als Text (A-18.6), und dieser Text steht in
 * `apps/web/src/lib/releasePage.ts` ein zweites Mal. Nach E-065 ist eine
 * zweite Stelle nur zulässig, solange der Gleichlauf gemessen wird — sonst
 * prüfte der Benutzer eine Adresse und öffnete eine andere.
 *
 * ---------------------------------------------------------------------------
 * Die Gegenprobe, und warum sie im selben Lauf steht
 * ---------------------------------------------------------------------------
 *
 * Ein Wächter, der nie rot war, ist eine Behauptung über einen Wächter. Jede
 * der vier Prüfungen ist deshalb eine reine Funktion über **Text**, und jede
 * fährt am Ende dieses Laufs zusätzlich gegen eine eingesetzte Verletzung. Wenn
 * eine davon die Verletzung nicht bemerkt, endet der Lauf mit einem Fehler —
 * auch wenn der Bestand selbst in Ordnung ist. Dasselbe Muster wie die
 * Untergrenze in `verify-node-checksums.mjs`, nur eine Stufe schärfer: Dort
 * wird gezählt, hier wird ausprobiert.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktopDir = resolve(here, '..');
const tauriDir = join(desktopDir, 'src-tauri');
const repoRoot = resolve(desktopDir, '..', '..');

const configFile = join(tauriDir, 'tauri.conf.json');
const capabilitiesDir = join(tauriDir, 'capabilities');
const rustSrcDir = join(tauriDir, 'src');
const webSrcDir = resolve(repoRoot, 'apps', 'web', 'src');

/* ==================================================================== */
/* Die zugesagten Werte — hier und sonst nirgends                       */
/* ==================================================================== */

/**
 * Die vier Marken, die `connect-src` tragen darf. **Vier, nicht drei**
 * (Befund T-136-2): `CLAUDE.md` und E-064 Punkt 2 nennen drei — „sich selbst,
 * `ipc:` und `http://127.0.0.1:17843` —, die Datei trägt zusätzlich
 * `http://ipc.localhost`. Der vierte ist die IPC-Herkunft unter Windows und
 * völlig berechtigt; die Zusage war trotzdem eine Abschrift, die nicht stimmt.
 *
 * Von den zwei möglichen Antworten — den Satz nachziehen oder ihn messen — ist
 * dies die zweite, weil sie nicht wieder veralten kann.
 */
const ALLOWED_CONNECT_SRC = ['\'self\'', 'ipc:', 'http://ipc.localhost', 'http://127.0.0.1:17843'];

/**
 * Was `devCsp` zusätzlich tragen darf: der Vite-Entwicklungsserver. Er läuft
 * ausschließlich unter `pnpm dev`; im Auslieferungsbündel gibt es ihn nicht.
 */
const ALLOWED_CONNECT_SRC_DEV = [...ALLOWED_CONNECT_SRC, 'http://localhost:5173', 'ws://localhost:5173'];

/** Berechtigungen, die den Öffnen-Weg aus JavaScript heraus aufmachen würden. */
const FORBIDDEN_PERMISSION_PREFIX = 'shell:';

/** Die eine erlaubte Datei mit einem `open`-Aufruf. */
const OPEN_CALL_FILE = 'release.rs';

/** Die eine Adresse, die im Rust-Anteil außerhalb von `127.0.0.1` stehen darf. */
const RELEASE_TAG_PREFIX = 'https://github.com/KuyomieKurama/SuperTakt/releases/tag/v';

/* ==================================================================== */
/* Werkzeug: JSON5 ohne Kommentare                                      */
/* ==================================================================== */

/**
 * Entfernt Kommentare aus `tauri.conf.json`, ohne in Zeichenketten
 * hineinzuschneiden.
 *
 * Der naive Weg — jede `//` bis zum Zeilenende streichen — zerschneidet
 * ausgerechnet die Zeile, um die es hier geht: In `connect-src` steht
 * `http://127.0.0.1:17843`, und dort sind zwei Schrägstriche kein Kommentar.
 * Deshalb läuft ein kleiner Zustandsautomat über den Text und weiß, ob er
 * gerade in einer Zeichenkette steht.
 */
function stripJsonComments(text) {
  let out = '';
  let inString = false;
  let inLine = false;
  let inBlock = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLine) {
      if (char === '\n') {
        inLine = false;
        out += char;
      }
      continue;
    }
    if (inBlock) {
      if (char === '*' && next === '/') {
        inBlock = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') {
        // Maskiertes Zeichen ungeprüft mitnehmen: Ein `\"` beendet die
        // Zeichenkette nicht.
        out += next ?? '';
        index += 1;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inLine = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlock = true;
      index += 1;
      continue;
    }
    out += char;
  }

  return out;
}

/** Die Marken einer Richtlinie, nach Namen aufgeschlüsselt. */
function directives(csp) {
  const map = new Map();
  for (const part of String(csp).split(';')) {
    const tokens = part.trim().split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) continue;
    map.set(tokens[0], tokens.slice(1));
  }
  return map;
}

/* ==================================================================== */
/* Prüfung 1 — keine Shell-Berechtigung (A-V-17)                        */
/* ==================================================================== */

/**
 * @param {ReadonlyArray<{ name: string, text: string }>} files
 * @returns {string[]} Befunde. Leer heißt: die Fläche ist zu.
 */
export function checkCapabilities(files) {
  const findings = [];
  if (files.length === 0) {
    findings.push('Es wurde keine einzige Berechtigungsdatei gelesen — der Wächter misst nichts.');
    return findings;
  }

  for (const file of files) {
    // Erst über den **rohen Text**: Eine Shell-Zeile in einem verschachtelten
    // Abschnitt, in einem Kommentar oder in einer Form, die dieser Lauf noch
    // nicht kennt, soll trotzdem auffallen.
    if (file.text.includes(FORBIDDEN_PERMISSION_PREFIX)) {
      findings.push(`${file.name} enthält die Zeichenkette „${FORBIDDEN_PERMISSION_PREFIX}".`);
    }

    let parsed;
    try {
      parsed = JSON.parse(stripJsonComments(file.text));
    } catch (cause) {
      findings.push(`${file.name} ließ sich nicht lesen: ${cause instanceof Error ? cause.message : 'unbekannt'}`);
      continue;
    }

    const permissions = Array.isArray(parsed?.permissions) ? parsed.permissions : [];
    if (permissions.length === 0) {
      findings.push(`${file.name} führt keine Berechtigungen — dann misst der Wächter dort nichts.`);
    }
    for (const permission of permissions) {
      const name = typeof permission === 'string' ? permission : String(permission?.identifier ?? '');
      if (name.startsWith(FORBIDDEN_PERMISSION_PREFIX)) {
        findings.push(`${file.name} gibt „${name}" frei.`);
      }
    }
  }

  return findings;
}

/* ==================================================================== */
/* Prüfung 2 — die CSP bleibt zu (A-V-18, T-136-2)                      */
/* ==================================================================== */

/**
 * @param {string} configText Der Inhalt von `tauri.conf.json`, mit Kommentaren.
 * @returns {string[]} Befunde.
 */
export function checkContentSecurityPolicy(configText) {
  const findings = [];
  let parsed;
  try {
    parsed = JSON.parse(stripJsonComments(configText));
  } catch (cause) {
    return [`tauri.conf.json ließ sich nicht lesen: ${cause instanceof Error ? cause.message : 'unbekannt'}`];
  }

  const security = parsed?.app?.security;
  if (security === undefined || security === null) {
    return ['tauri.conf.json führt keinen Abschnitt `app.security` — dann gibt es keine Richtlinie zu prüfen.'];
  }

  for (const [key, allowed] of [
    ['csp', ALLOWED_CONNECT_SRC],
    ['devCsp', ALLOWED_CONNECT_SRC_DEV],
  ]) {
    const value = security[key];
    if (typeof value !== 'string' || value.length === 0) {
      findings.push(`app.security.${key} fehlt oder ist keine Zeichenkette.`);
      continue;
    }
    if (value.includes('api.github.com')) {
      findings.push(`app.security.${key} nennt api.github.com. Die Frage stellt der Dienst, nicht der Webview (E-064 Punkt 2).`);
    }

    const found = directives(value).get('connect-src');
    if (found === undefined) {
      findings.push(`app.security.${key} führt keine Marke connect-src.`);
      continue;
    }
    if (found.join(' ') !== allowed.join(' ')) {
      findings.push(
        `app.security.${key} > connect-src weicht ab.\n` +
          `        zugesagt:  ${allowed.join(' ')}\n` +
          `        gefunden:  ${found.join(' ')}`,
      );
    }
  }

  // Und der Gegenweg aus A-V-17: eine Prüfliste für das Shell-Plugin in der
  // Konfiguration statt in der Fähigkeitenliste.
  const shellPlugin = parsed?.plugins?.shell;
  if (shellPlugin !== undefined) {
    findings.push('tauri.conf.json führt `plugins > shell`. Auch dort steht keine Prüfliste für `open` (A-V-17).');
  }

  return findings;
}

/* ==================================================================== */
/* Prüfung 3 — ein Aufrufort, eine Adresse (T-136-1, A-V-16)            */
/* ==================================================================== */

/**
 * @param {ReadonlyArray<{ name: string, text: string }>} sources Rust-Quellen.
 * @returns {string[]} Befunde.
 */
export function checkOpenCallSites(sources) {
  const findings = [];
  if (sources.length === 0) {
    findings.push('Es wurde keine einzige Rust-Quelle gelesen — der Wächter misst nichts.');
    return findings;
  }

  let openCalls = 0;
  let releasePrefixLiterals = 0;

  for (const source of sources) {
    for (const line of source.text.split('\n')) {
      // Kommentare zählen nicht mit: In `release.rs` steht der Befund T-136-1
      // ausgeschrieben, samt dem Prüfausdruck aus dem Plugin.
      const code = line.trim();
      if (code.startsWith('//')) continue;

      if (/\.open\s*\(/.test(code)) {
        openCalls += 1;
        if (source.name !== OPEN_CALL_FILE) {
          findings.push(`${source.name} ruft \`open\` — erlaubt ist das allein in ${OPEN_CALL_FILE}.`);
        }
      }

      for (const match of code.matchAll(/https?:\/\/[^"'\s]*/g)) {
        const address = match[0];
        if (address === RELEASE_TAG_PREFIX) {
          releasePrefixLiterals += 1;
          continue;
        }
        // Der lokale Dienst. Er ist die Anschrift, die Takt seit E-001 kennt,
        // und keine Verbindung nach außen.
        if (address.startsWith('http://127.0.0.1:')) continue;
        // Die Release-Seite einer bestimmten Fassung — nur zulässig, wenn sie
        // aus derselben festen Zeichenkette entsteht. Das ist der Fall in den
        // Prüffällen neben dem Befehl.
        if (address.startsWith(RELEASE_TAG_PREFIX)) continue;

        findings.push(
          `${source.name} nennt die fremde Adresse ${address}. Im Rust-Anteil steht außer ${RELEASE_TAG_PREFIX} und dem lokalen Dienst keine.`,
        );
      }
    }
  }

  if (openCalls !== 1) {
    findings.push(`Es gibt ${openCalls} Aufruforte für \`open\`; erlaubt ist genau einer (T-136-1).`);
  }
  if (releasePrefixLiterals !== 1) {
    findings.push(
      `Die feste Adresse steht ${releasePrefixLiterals}-mal wörtlich im Rust-Anteil; sie gehört an genau eine Stelle (A-18.3).`,
    );
  }

  return findings;
}

/* ==================================================================== */
/* Prüfung 4 — die angezeigte Adresse ist die geöffnete (A-18.6, E-065)  */
/* ==================================================================== */

/**
 * Der Dialog zeigt die Release-Seite als **Text** an; das erlaubt A-V-18
 * ausdrücklich („die Adresse darf als Text danebenstehen; sie ist lokal
 * gebaut"). Damit steht dieselbe Zeichenkette an zwei Orten, und nach E-065
 * ist das nur zulässig, solange der **Gleichlauf gemessen** wird.
 *
 * Ein angezeigter Verweis, der woandershin führt als der Knopf daneben, wäre
 * schlimmer als gar keiner: Der Benutzer prüft dann eine Adresse und öffnet
 * eine andere.
 *
 * Dazu die zweite Hälfte: `apps/web` erreicht die Hülle **ausschließlich** über
 * `@takt/desktop/shell`. Ein eigenes `invoke` in der Oberfläche wäre der Weg,
 * auf dem doch wieder eine Adresse an einen Befehl geriete.
 *
 * @param {ReadonlyArray<{ name: string, text: string }>} webSources
 * @param {string} rustPrefix Die Adresse aus dem Rust-Anteil.
 * @returns {string[]} Befunde.
 */
export function checkWebAddress(webSources, rustPrefix) {
  const findings = [];
  if (webSources.length === 0) {
    findings.push('Es wurde keine einzige Quelle der Oberfläche gelesen — der Wächter misst nichts.');
    return findings;
  }

  let addresses = 0;
  let bridges = 0;

  for (const source of webSources) {
    for (const line of source.text.split('\n')) {
      const code = line.trim();
      // Kommentarzeilen zählen nicht mit: In `UpdateDialog.tsx` steht
      // ausgeschrieben, warum der Verweis kein `<a href>` ist, und in
      // `connection.ts`, warum die Hülle erst zur Laufzeit geladen wird.
      if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) continue;

      for (const match of code.matchAll(/https?:\/\/[^"'`\s]*/g)) {
        const address = match[0];
        if (address.startsWith('http://127.0.0.1:') || address.startsWith('http://localhost:')) continue;
        addresses += 1;
        if (address !== rustPrefix) {
          findings.push(
            `${source.name} nennt ${address}; die Hülle öffnet ${rustPrefix}. Zwei Adressen sind keine.`,
          );
        }
      }

      if (/\binvoke\s*\(/.test(code) || code.includes('@tauri-apps/')) {
        bridges += 1;
        findings.push(`${source.name} spricht unmittelbar mit der Hülle: ${code.slice(0, 72)}`);
      }
    }
  }

  if (addresses !== 1) {
    findings.push(
      `Die Adresse steht ${addresses}-mal in der Oberfläche; sie gehört an genau eine Stelle (lib/releasePage.ts).`,
    );
  }
  if (bridges > 0) {
    findings.push('Die Oberfläche erreicht die Hülle ausschließlich über `@takt/desktop/shell`.');
  }

  return findings;
}

/* ==================================================================== */
/* Der Lauf                                                             */
/* ==================================================================== */

function readCapabilityFiles() {
  return readdirSync(capabilitiesDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(capabilitiesDir, name), 'utf8') }));
}

function readRustSources() {
  return readdirSync(rustSrcDir)
    .filter((name) => name.endsWith('.rs'))
    .sort()
    .map((name) => ({ name, text: readFileSync(join(rustSrcDir, name), 'utf8') }));
}

/** Alle `.ts`/`.tsx` der Oberfläche, rekursiv. */
function readWebSources(dir = webSrcDir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      out.push(...readWebSources(join(dir, entry.name), `${name}/`));
      continue;
    }
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push({ name, text: readFileSync(join(dir, entry.name), 'utf8') });
    }
  }
  return out;
}

const capabilityFiles = readCapabilityFiles();
const rustSources = readRustSources();
const webSources = readWebSources();
const configText = readFileSync(configFile, 'utf8');

const runs = [
  {
    title: `Keine Shell-Berechtigung in ${relative(repoRoot, capabilitiesDir)} (A-V-17)`,
    findings: checkCapabilities(capabilityFiles),
  },
  {
    title: 'connect-src trägt genau die zugesagten Marken (A-V-18, T-136-2)',
    findings: checkContentSecurityPolicy(configText),
  },
  {
    title: 'Ein Aufrufort für `open`, eine Adresse im Rust-Anteil (T-136-1)',
    findings: checkOpenCallSites(rustSources),
  },
  {
    title: 'Die angezeigte Adresse ist zeichengleich mit der geöffneten (A-18.6, E-065)',
    findings: checkWebAddress(webSources, RELEASE_TAG_PREFIX),
  },
];

let failed = 0;
for (const run of runs) {
  if (run.findings.length === 0) {
    process.stdout.write(`  ok    ${run.title}\n`);
    continue;
  }
  failed += 1;
  process.stdout.write(`  FEHL  ${run.title}\n`);
  for (const finding of run.findings) {
    process.stdout.write(`        ${finding}\n`);
  }
}

/* ==================================================================== */
/* Die Gegenprobe                                                       */
/* ==================================================================== */

/**
 * Je Prüfung eine eingesetzte Verletzung. Bemerkt eine Prüfung ihre nicht,
 * bewacht sie nichts — und dieser Lauf endet rot, auch wenn der Bestand in
 * Ordnung ist.
 */
const counterProbes = [
  {
    title: 'A-V-17: eine Zeile `shell:default` in der Fähigkeitenliste',
    run: () =>
      checkCapabilities(
        capabilityFiles.map((file) => ({
          name: file.name,
          text: file.text.replace('"dialog:allow-open"', '"dialog:allow-open",\n    "shell:default"'),
        })),
      ),
  },
  {
    title: 'A-V-17: eine leere Fähigkeitenliste',
    run: () => checkCapabilities([{ name: 'leer.json', text: '{ "permissions": [] }' }]),
  },
  {
    title: 'A-V-18: `https://api.github.com` in connect-src',
    run: () =>
      checkContentSecurityPolicy(
        configText.replace('connect-src \'self\' ipc:', 'connect-src \'self\' https://api.github.com ipc:'),
      ),
  },
  {
    title: 'A-V-18: eine gestrichene Marke in connect-src',
    run: () => checkContentSecurityPolicy(configText.replace(' http://ipc.localhost', '')),
  },
  {
    title: 'A-V-17: eine Prüfliste unter `plugins > shell > scope > open`',
    run: () =>
      checkContentSecurityPolicy(
        configText.replace('"bundle": {', '"plugins": { "shell": { "scope": { "open": true } } },\n  "bundle": {'),
      ),
  },
  {
    title: 'T-136-1: ein zweiter Aufrufort für `open`',
    run: () =>
      checkOpenCallSites([
        ...rustSources,
        { name: 'zweiter.rs', text: 'fn f(app: AppHandle) { app.shell().open(irgendwas, None); }' },
      ]),
  },
  {
    title: 'A-18.3: eine zweite Adresse im Rust-Anteil',
    run: () =>
      checkOpenCallSites([
        ...rustSources,
        { name: 'zweite-adresse.rs', text: 'const ANDERS: &str = "https://evil.example/holen";' },
      ]),
  },
  {
    title: 'A-18.6: die angezeigte Adresse weicht um ein Zeichen ab',
    run: () =>
      checkWebAddress(
        webSources.map((source) => ({
          name: source.name,
          text: source.text.replace('/releases/tag/v', '/releases/tag/w'),
        })),
        RELEASE_TAG_PREFIX,
      ),
  },
  {
    title: 'A-18.6: eine zweite Adresse in der Oberfläche',
    run: () =>
      checkWebAddress(
        [...webSources, { name: 'zweite.ts', text: 'const X = "https://evil.example/holen";' }],
        RELEASE_TAG_PREFIX,
      ),
  },
  {
    title: 'E-064: die Oberfläche spricht selbst mit der Hülle',
    run: () =>
      checkWebAddress(
        [...webSources, { name: 'eigenwillig.ts', text: 'await invoke("plugin:shell|open", { path });' }],
        RELEASE_TAG_PREFIX,
      ),
  },
];

process.stdout.write('\nGegenprobe — jede eingesetzte Verletzung muss auffallen:\n');
let blind = 0;
for (const probe of counterProbes) {
  const findings = probe.run();
  if (findings.length === 0) {
    blind += 1;
    process.stdout.write(`  BLIND ${probe.title}\n`);
    continue;
  }
  process.stdout.write(`  ok    ${probe.title}\n`);
}

if (failed > 0 || blind > 0) {
  process.stderr.write(
    `\nFEHLER: ${failed} Prüfung(en) rot, ${blind} Gegenprobe(n) blind.\n\n` +
      `Beides ist derselbe Befund in zwei Richtungen: Die Fläche der Hülle ist\n` +
      `entweder größer geworden, oder der Wächter darüber sieht sie nicht mehr.\n` +
      `Die Begründung, warum beide Zusagen keine Kleinigkeit sind, steht in\n` +
      `docs/bedrohungsmodell.md Abschnitt 18.3 und in ${relative(repoRoot, join(rustSrcDir, OPEN_CALL_FILE))}.\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `\n${runs.length} Prüfungen und ${counterProbes.length} Gegenproben bestanden.\n` +
    `Die Fähigkeitenliste trägt keine Shell-Zeile, connect-src trägt genau die\n` +
    `${ALLOWED_CONNECT_SRC.length} zugesagten Marken, und der Rust-Anteil hat einen Aufrufort für\n` +
    `\`open\` und eine Adresse.\n`,
);
