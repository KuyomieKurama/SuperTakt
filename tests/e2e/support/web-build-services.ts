/**
 * Takt — baut `apps/web` und serviert genau dieses Ergebnis statisch (T-055).
 *
 * Der Unterschied zu `services.ts#startWeb` ist der ganze Punkt dieser Datei:
 * Dort läuft `vite` als Entwicklungsserver, der Module bei jeder Anfrage neu
 * auflöst und `import.meta.env.DEV` mit `true` beantwortet. Hier läuft
 * `vite build` einmal vollständig durch (derselbe Befehl, den `pnpm build`
 * und jede Auslieferung ausführen), und `vite preview` liefert danach nur
 * noch die entstandenen Dateien aus — keine Transformation mehr, kein
 * Modulgraph, `import.meta.env.DEV` ist im Bündel bereits als `false`
 * ersetzt. Das ist genau die Achse, die T-053 als ungemessen benannt hat.
 *
 * `vite preview` und nicht ein selbstgeschriebener Server: Es ist Vite selbst,
 * das für „das Bauergebnis lokal ansehen" gebaut ist (eigene Dokumentation),
 * setzt dieselben Inhaltstypen wie ein echter Webserver und unterscheidet sich
 * darin nicht relevant von einem Auslieferungsserver — anders als bei
 * `apps/outlook-addin` (siehe `run-outlook-taskpane.mjs`) gibt es hier keinen
 * echten Auslieferungsweg, gegen den man stattdessen prüfen könnte: `apps/web`
 * wird von Tauris eigenem Protokoll ausgeliefert (`frontendDist`,
 * `tauri.conf.json`), und das ist mit Playwright nicht ansprechbar (siehe
 * Bericht, Punkt 3).
 *
 * **Seit T-060 zusätzlich:** `buildWebWithDesignsystem()` und die beiden
 * `dist`-Prüfhilfen (`distHasFile`, `distContainsText`). Der Anlass steht in
 * `web-build-smoke.spec.ts`, TP-BUILD-05 — hier nur die Begründung für den
 * Zusatz an `buildWeb()` selbst: Sie löscht `TAKT_DESIGNSYSTEM` jetzt
 * ausdrücklich aus der an `pnpm` übergebenen Umgebung, statt sie unbesehen
 * von der Elternumgebung zu übernehmen. Ohne das wäre der „ohne Variable"-Bau,
 * auf dem TP-BUILD-01/02/05 aufsetzen, von einer zufällig im Prozessbaum
 * gesetzten Variable abhängig gewesen — genau die Sorte Annahme, die T-060
 * gemessen statt geglaubt haben wollte.
 *
 * **Seit T-263 zusätzlich:** `distContainsRenderedText` (hierher gezogen aus
 * `web-build-smoke.spec.ts`, damit sie auch gegen ein Testverzeichnis unter
 * `tests/fixtures/**` statt gegen das echte `apps/web/dist` laufen kann — die
 * Gegenprobe braucht das, siehe dort). Anlass war ein Fund am **gemessenen**
 * Vorzustand (`git stash push -u -- apps/web`, HEAD vor dem laufenden
 * `shared/ui`-Umbau, danach `pnpm --filter @takt/web build`, `git stash pop`
 * verifiziert über den identischen Pfadsatz): Der rohe Substring-Vergleich
 * gegen `apps/web/dist` traf nicht nur auf **Modulnamen und Dateinamen**
 * (`DeadlineFlag-aJKJzlu8.js`, neu seit dem Umbau, weil `shared/ui/`-Bausteine
 * jetzt als eigenes Bündelstück herausgezogen werden und ihr Name in fremden
 * Import-Anweisungen landet), sondern **schon vorher** auf reine
 * JS-Bezeichner: `onDeadlineChange`, ein Rückruf-Requisitenname in
 * `TodoListScreen`, enthält „Deadline" als Teilzeichenkette und ließ den
 * alten, rein substring-basierten Vergleich schon am unveränderten
 * `HEAD`-Stand rot werden — vor jedem `shared/ui`-Umbau. Die Regel aus
 * A-19.2 gilt der **Oberfläche** („Frist" statt „Fälligkeitsdatum"/„fällig
 * am"/„Deadline"), nicht dem Quelltext; ein Bezeichner ist nach der
 * Sprachregel in `CLAUDE.md` („Bezeichner im Code … auf Englisch") richtig
 * und kein Fund.
 *
 * Der Ausweg ist keine weitere Ausnahmeliste von Wörtern, sondern eine
 * andere Grundmenge: **gerenderter Text landet im Bündel ausschließlich als
 * JS-String-Literal** (JSX-Kinder und Requisitenwerte wie `label:"Frist"`
 * kompilieren zu Zeichenketten in Anführungszeichen); ein Bezeichner steht
 * nie in Anführungszeichen (`deadlineFilter:x` — der Schlüssel `deadlineFilter`
 * ist unquotiert, nur der Wert `x` — eine Referenz, kein Literal — folgt).
 * `distContainsRenderedText` liest deshalb nicht mehr den rohen Dateiinhalt,
 * sondern zerlegt ihn in String-Literale (`extractStringLiterals`) und
 * durchsucht **nur deren Inhalt**. Import-Angaben sind ebenfalls quotierte
 * Zeichenketten (`from"./DeadlineFlag-aJKJzlu8.js"`) und tragen deshalb
 * trotzdem keinen Oberflächentext — sie werden zusätzlich über
 * `looksLikeModulePath` erkannt und ausgeschlossen (gehashte Bündeldateinamen,
 * relative/absolute Modulpfade, auch außerhalb von `import`, etwa in Vites
 * Vorlade-Listen).
 *
 * Bekannte Grenze, dokumentiert statt verschwiegen: Der Zerleger unterscheidet
 * nicht zwischen einem echten String-Literal und einem Anführungszeichen
 * innerhalb eines Regex-Literals (`/a"b/`) — für die drei hier geprüften
 * Wörter (mehrsilbige deutsche Begriffe, in keinem Regex dieses Bündels)
 * ohne praktische Wirkung, aber kein Beweis für jeden denkbaren Suchbegriff.
 */

import { execFile, spawn, type ChildProcessByStdio } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { promisify } from 'node:util';

import { REPO_ROOT, WEB_APP_DIST_DIR, WEB_BUILD_BASE_URL } from './build-check-session';

const execFileAsync = promisify(execFile);

/**
 * Genau der Typ, den `spawn` mit `stdio: ['ignore', 'pipe', 'pipe']` liefert
 * (`stdin` ist `null`) — nicht `ChildProcessWithoutNullStreams`, das ein
 * beschreibbares `stdin` verlangt und unter `exactOptionalPropertyTypes`
 * einen echten Typfehler ergibt.
 */
type ChildProcessWithoutStdin = ChildProcessByStdio<null, Readable, Readable>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check: () => Promise<boolean>, timeoutMs: number, label: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(150);
  }
  throw new Error(`Zeitüberschreitung beim Warten auf: ${label}. Letzter Fehler: ${String(lastError)}`);
}

/**
 * `pnpm --filter @takt/web build` — derselbe Befehl aus `apps/web/package.json`,
 * den `pnpm build`/`pnpm check` ausführen. Kein Nachbau der Vite-Konfiguration
 * hier: Ein zweiter, angenommener Bauweg wäre selbst wieder eine Vermutung.
 */
export async function buildWeb(): Promise<void> {
  // Ausdrücklich entfernt statt unverändert durchgereicht (T-060) — siehe
  // Dateikopf. `{ ...process.env }` kopiert, damit `delete` nicht den
  // Prozess dieses Testlaufs selbst verändert.
  const env = { ...process.env };
  delete env['TAKT_DESIGNSYSTEM'];
  try {
    await execFileAsync('pnpm', ['--filter', '@takt/web', 'build'], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
      env,
      // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand
      // (dieselbe Bauart wie bei den `spawn('pnpm', …)`-Aufrufen dieser Reihe).
      shell: process.platform === 'win32',
    });
  } catch (error) {
    const detail = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Der Bau von apps/web ist fehlgeschlagen — genau das wäre der Fund, den diese Aufgabe sucht.\n` +
        `${detail.stdout ?? ''}\n${detail.stderr ?? detail.message ?? String(error)}`,
    );
  }
}

/**
 * `pnpm --filter @takt/web build:designsystem` — derselbe Befehl, den
 * `apps/web/scripts/build-designsystem.mjs` für die Abnahme vorsieht (T-057).
 * Ausschließlich für die Gegenprobe aus T-060 (TP-BUILD-05) gedacht: Sie
 * belegt, dass das Fehlen der Musterseite im gewöhnlichen Bau tatsächlich an
 * `TAKT_DESIGNSYSTEM` liegt und nicht an etwas, das auch ohne die Variable
 * ausgeblieben wäre.
 */
export async function buildWebWithDesignsystem(): Promise<void> {
  try {
    await execFileAsync('pnpm', ['--filter', '@takt/web', 'build:designsystem'], {
      cwd: REPO_ROOT,
      maxBuffer: 16 * 1024 * 1024,
      // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand.
      shell: process.platform === 'win32',
    });
  } catch (error) {
    const detail = error as { stdout?: string; stderr?: string; message?: string };
    throw new Error(
      `Der Bau von apps/web mit TAKT_DESIGNSYSTEM=1 ist fehlgeschlagen.\n` +
        `${detail.stdout ?? ''}\n${detail.stderr ?? detail.message ?? String(error)}`,
    );
  }
}

/** Existiert eine Datei relativ zu `apps/web/dist`? Für TP-BUILD-05. */
export function distHasFile(relativePath: string): boolean {
  return existsSync(join(WEB_APP_DIST_DIR, relativePath));
}

/**
 * Jede Datei unter `root`, rekursiv, als absolute Pfade.
 *
 * Eigenständig statt über `scripts/source-anchors.mjs#readTreeSync`: Ein
 * `.ts`-Test, der die `.mjs`-Datei ohne eigene Typdeklaration importiert,
 * scheitert unter `noImplicitAny`/`strict` an `TS7016` (geprüft, nicht
 * vermutet) — und `scripts/**` liegt ohnehin außerhalb der Hoheit dieses
 * Verzeichnisses (T-249-7).
 */
function listFilesRecursively(root: string): string[] {
  const found: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        found.push(fullPath);
      }
    }
  }
  return found;
}

/**
 * Durchsucht jede Datei unter `apps/web/dist` nach einem wörtlichen
 * Textstück. Für TP-BUILD-05: Eine fehlende `designsystem.html` allein
 * bewiese nur, dass *eine* Datei fehlt — nicht, dass ihr Inhalt nirgends
 * sonst im Bündel gelandet ist (etwa durch Bündelung in einen gemeinsamen
 * Chunk). Das ist der Unterschied zwischen „glauben" und „messen", den
 * dieser Fall verlangt.
 *
 * **Untergrenze statt stillem `false` (T-249-7).** Ein fehlendes oder leeres
 * `apps/web/dist` — ein Bau, der ausblieb, oder eine falsche Ausführungs-
 * konfiguration — durchsuchte vorher null Dateien und lieferte dasselbe
 * `false` wie ein Bau, der tatsächlich durchsucht wurde und den Text nicht
 * enthält. Bei einer Abwesenheitsprüfung (`.toBe(false)`) sähe „nichts
 * gesehen" damit aus wie „nichts gefunden" — dieselbe Bauart, die in T-247-7
 * vier Wächter still grün über einer Menge ließ, die sie nie gesehen hatten.
 * Ein fehlender oder leerer Baum wirft deshalb jetzt statt `false`
 * zurückzugeben.
 */
export function distContainsText(needle: string): boolean {
  if (!existsSync(WEB_APP_DIST_DIR)) {
    throw new Error(
      `${WEB_APP_DIST_DIR} gibt es nicht — der Bau von apps/web ist ausgeblieben oder lief unter ` +
        'einer anderen Ausführungskonfiguration. „Nicht gefunden" wäre hier kein Befund über den ' +
        'Text, sondern ein Fehlschlag der Messung.',
    );
  }
  const files = listFilesRecursively(WEB_APP_DIST_DIR);
  if (files.length === 0) {
    throw new Error(
      `${WEB_APP_DIST_DIR} enthält keine einzige Datei. Eine Suche über eine leere Menge wird ` +
        'jede Abwesenheitsprüfung stumm wahr, ohne etwas gelesen zu haben.',
    );
  }
  return files.some((file) => readFileSync(file, 'utf8').includes(needle));
}

/** Ein gefundenes String-Literal, samt seiner Position im Ursprungstext. */
interface StringLiteral {
  value: string;
  index: number;
}

/**
 * Zerlegt `source` in seine JS-String-Literale (`"…"`, `'…'`, `` `…` ``) und
 * gibt deren **entquoteten** Inhalt zurück — alles außerhalb von
 * Anführungszeichen (Bezeichner, Schlüsselwörter, Kommentare, auch der
 * `//# sourceMappingURL=…`-Kommentar am Dateiende) wird dabei nie betrachtet.
 * Escapes (`\"`, `\\`, …) werden roh mitgezählt, nicht dekodiert — für einen
 * reinen Teilzeichenketten-Vergleich ohne Sonderzeichen in den drei
 * geprüften Wörtern genügt das. In Vorlage-Ausdrücken (`` `…${x}…` ``) wird
 * der Ausdruck zwischen `${` und der zugehörigen `}` (Klammertiefe gezählt)
 * roh übersprungen; sein Inhalt zählt nicht als Text.
 *
 * Bekannte Grenze (dokumentiert im Kopf dieser Datei): Anführungszeichen
 * innerhalb eines Regex-Literals verwirren den Zustand. Für die hier
 * geprüften Wörter ohne Wirkung, siehe dort.
 */
function extractStringLiterals(source: string): StringLiteral[] {
  // `.charAt(i)` statt `source[i]`: Liefert für jeden Index innerhalb der
  // Schleifengrenzen einen `string`, nie `undefined` — unter
  // `noUncheckedIndexedAccess` wäre `source[i]` sonst `string | undefined`
  // und jeder Vergleich bräuchte eine eigene Prüfung.
  const hits: StringLiteral[] = [];
  let i = 0;
  const n = source.length;
  while (i < n) {
    const ch = source.charAt(i);
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      const start = i;
      let buf = '';
      while (i < n && source.charAt(i) !== quote) {
        if (source.charAt(i) === '\\' && i + 1 < n) {
          buf += source.charAt(i) + source.charAt(i + 1);
          i += 2;
          continue;
        }
        if (quote === '`' && source.charAt(i) === '$' && source.charAt(i + 1) === '{') {
          let depth = 1;
          i += 2;
          while (i < n && depth > 0) {
            if (source.charAt(i) === '{') depth += 1;
            else if (source.charAt(i) === '}') depth -= 1;
            i += 1;
          }
          continue;
        }
        buf += source.charAt(i);
        i += 1;
      }
      hits.push({ value: buf, index: start });
      i += 1; // schließendes Anführungszeichen
      continue;
    }
    i += 1;
  }
  return hits;
}

/**
 * Erkennt ein String-Literal, das einen Modulpfad oder einen gehashten
 * Bündeldateinamen trägt, statt Oberflächentext — unabhängig davon, ob es in
 * einer `import`-Anweisung steht oder anderswo (Vites Vorlade-Liste zählt
 * gehashte Dateinamen zum Beispiel in einem rohen Feld auf, nicht als
 * `import`-Ausdruck).
 *
 * Drei Formen, alle am echten Bündel nachgemessen (Kommentar am Kopf dieser
 * Datei): `"./DeadlineFlag-aJKJzlu8.js"` (relative Modulangabe),
 * `"/assets/…"` mit Quelltyp-Endung (absoluter Bündelpfad), und ein bloßer
 * gehashter Dateiname ohne führenden Pfad (`"assets/DeadlineFlag-aJKJzlu8.js"`
 * in einer Zeichenkettenliste — der `assets/`-Teil ist dabei kein fester
 * Bestandteil des Musters, siehe dritte Regel unten).
 */
function looksLikeModulePath(value: string): boolean {
  if (/^\.{1,2}\//.test(value)) return true;
  if (/^\//.test(value) && /\.(?:js|css)(?:\.map)?$/.test(value)) return true;
  if (/-[\w-]{6,}\.(?:js|css)(?:\.map)?$/.test(value)) return true;
  return false;
}

/** Ein Treffer von {@link distContainsRenderedText}, mit Fundstelle. */
export interface RenderedTextMatch {
  /** Pfad relativ zum durchsuchten Verzeichnis, mit `/` als Trenner. */
  file: string;
  /** Ausschnitt um den Treffer, zur Einordnung im Fehlschlag. */
  snippet: string;
}

/**
 * Wie `distContainsText`, aber beschränkt auf **gerenderten Text** statt auf
 * jedes Vorkommen im rohen Dateiinhalt — für Fälle wie A-19.2 (Feldbezeichnung
 * „Frist"), bei denen ein Treffer in einem Bezeichner, einer Import-Angabe
 * oder einem Bündeldateinamen kein Fund über die Oberfläche wäre. Begründung
 * und Herkunft (T-249, T-259, T-263) im Kopf dieser Datei.
 *
 * Quellkarten (`.map`) sind ausgenommen — sie tragen zwangsläufig den
 * Originalquelltext samt Kommentaren (`sourcesContent`), und ein Kommentar in
 * `TodoFormDialog.tsx` zitiert die verbotenen Wörter wörtlich als
 * Gegenbeispiel (siehe `web-build-smoke.spec.ts`).
 *
 * **Untergrenze statt stillem `false` (T-249-7, hier übernommen).** Ein
 * fehlendes oder leeres Verzeichnis — ein Bau, der ausblieb, eine falsche
 * Ausführungskonfiguration, oder (in der Gegenprobe) ein Tippfehler im
 * Vorlagenpfad — durchsuchte vorher null Dateien und lieferte dasselbe
 * `false` wie ein tatsächlich durchsuchtes Verzeichnis ohne Treffer. Ein
 * Verzeichnis ohne mindestens eine berücksichtigte (Nicht-`.map`-)Datei wirft
 * deshalb, statt `false` zurückzugeben.
 *
 * @param needle Das gesuchte Wort.
 * @param rootDir Das durchsuchte Verzeichnis — Vorgabe `apps/web/dist`, für
 *   die Gegenprobe auf ein Testverzeichnis unter `tests/fixtures/**` gesetzt.
 */
export function distContainsRenderedText(
  needle: string,
  rootDir: string = WEB_APP_DIST_DIR,
): false | RenderedTextMatch {
  if (!existsSync(rootDir)) {
    throw new Error(
      `${rootDir} gibt es nicht — der Bau von apps/web ist ausgeblieben oder lief unter einer ` +
        'anderen Ausführungskonfiguration (oder, in der Gegenprobe: ein falscher Vorlagenpfad). ' +
        '„Nicht gefunden" wäre hier kein Befund über den Text, sondern ein Fehlschlag der Messung.',
    );
  }
  const files = listFilesRecursively(rootDir).filter((file) => !file.endsWith('.map'));
  if (files.length === 0) {
    throw new Error(
      `${rootDir} enthält keine einzige berücksichtigte (Nicht-.map-)Datei. Eine Suche über eine ` +
        'leere Menge wird jede Abwesenheitsprüfung stumm wahr, ohne etwas gelesen zu haben.',
    );
  }
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const literal of extractStringLiterals(content)) {
      if (looksLikeModulePath(literal.value)) continue;
      const at = literal.value.indexOf(needle);
      if (at === -1) continue;
      return {
        file: relative(rootDir, file).split(sep).join('/'),
        snippet: literal.value.slice(Math.max(0, at - 30), at + needle.length + 30),
      };
    }
  }
  return false;
}

/**
 * Liefert `apps/web/dist` auf demselben Port wie der Entwicklungsserver
 * (Begründung in `build-check-session.ts`). `--port`/`--host` auf der
 * Befehlszeile überschreiben `preview.port` aus `vite.config.ts` (4173).
 *
 * `port` ist optional (Vorgabe 5173, der produktive Aufruf aus
 * `global-setup-web-build.ts` lässt ihn weg) — einzig für die Gegenprobe
 * dieser Datei gedacht, die einen **anderen** Port braucht, weil 5173 für
 * die Dauer des ganzen Laufs schon von dieser Funktion selbst belegt ist
 * (`globalSetup` ruft sie einmal für die gesamte Konfiguration auf).
 *
 * **Bereitschaft am eigenen Prozess gemessen, nicht am Netz (T-259-Fund,
 * seit T-263 behoben).** Vorher prüfte die Bereitschaft nur, ob
 * **irgendetwas** auf dem Port antwortet (`fetch(...).then(r => r.ok)`) —
 * nicht, ob es der selbst gestartete `vite preview`-Prozess ist. Gemessen
 * (T-259, zweimal reproduziert): Eine fremde, aber erreichbare Gegenstelle
 * auf demselben Port ließ die Prüfung „bereit" melden, während der eigene
 * `vite preview --strictPort`-Prozess längst an `EADDRINUSE` gestorben war.
 *
 * Der naheliegende erste Ausweg — dasselbe Wettrennen wie
 * `services.ts#spawnLocalApi` (`Promise.race([ready, exitedEarly])`, `ready`
 * weiterhin über `fetch`) — **wurde gebaut und dann selbst als unzureichend
 * gemessen**, mit genau der Gegenprobe, die dieser Auftrag verlangt: Ein
 * `node:http`-Server auf einem freien Port, `startWebPreview(port)`
 * dagegengestellt, erwartet ein Scheitern. Ergebnis: Der Aufruf löste
 * trotzdem erfolgreich auf. Ursache, gemessen (nicht vermutet) über eine
 * eigene Probe mit direkt mitgeschnittenem Kindprozess-Log: `pnpm exec vite
 * preview` läuft unter Windows über `cmd.exe` **plus** `pnpm`s eigene
 * Auflösung des `vite`-Programms, bevor `vite` selbst überhaupt zu binden
 * versucht — dieser Vorlauf dauert spürbar länger als die erste
 * `fetch`-Runde. Eine fremde Gegenstelle, die **sofort** antwortet, gewinnt
 * das Wettrennen gegen den eigenen, noch gar nicht bis zum Bindeversuch
 * vorgedrungenen Kindprozess so gut wie immer — das Wettrennen war real,
 * aber strukturell zugunsten der falschen Seite verzerrt.
 *
 * Der tatsächliche Ausweg verzichtet auf das Netz als Bereitschaftssignal:
 * `vite preview` schreibt bei **tatsächlich geglücktem** Binden eine eigene
 * Zeile auf sein `stdout` (`➜  Local:   http://127.0.0.1:<port>/`, mit
 * ANSI-Farbcodes durchsetzt, siehe `stripAnsi`) — nachgemessen, mit **und**
 * ohne belegten Port (letzteres schreibt stattdessen `error when starting
 * preview server: … Port … is already in use` auf `stderr` und beendet
 * sich). Diese Zeile kann **nur** der eigene, tatsächlich gebundene Prozess
 * schreiben; eine fremde Gegenstelle hat keinen Zugriff auf das `stdout`
 * dieses Kindes. Die Bereitschaftsprüfung liest deshalb jetzt den
 * mitgeschnittenen Log-Puffer auf `127.0.0.1:<port>` (nach dem Entfernen der
 * ANSI-Codes), weiterhin im selben Wettrennen gegen den frühen Tod des
 * eigenen Kindes — das Wettrennen bleibt richtig, nur sein Bereitschaftssignal
 * ist jetzt eines, das eine fremde Gegenstelle nicht fälschen kann. Eine
 * abschließende `fetch`-Bestätigung folgt danach als reine Zusatzsicherung
 * (der Prozess hat sein eigenes Binden zu diesem Zeitpunkt bereits
 * bestätigt), nicht mehr als alleiniges Bereitschaftssignal.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex -- ANSI-Escapes enthalten per Definition ein Steuerzeichen (ESC, 0x1B).
  return text.replace(/\x1B\[[0-9;]*m/g, '');
}
export async function startWebPreview(
  port: number = Number(new URL(WEB_BUILD_BASE_URL).port),
): Promise<ChildProcessWithoutStdin> {
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: `${REPO_ROOT}apps/web`,
      stdio: ['ignore', 'pipe', 'pipe'],
      // Unter Windows ist `pnpm` eine `.cmd`; ohne Shell findet sie niemand.
      shell: process.platform === 'win32',
    },
  );

  let log = '';
  child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));
  child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString('utf8')));

  const exitedEarly = new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
  });

  // Bereitschaftssignal ist das eigene `stdout` des Kindes, nicht das Netz —
  // Begründung im Funktionskopf. `127.0.0.1:<port>` erscheint dort nur in
  // der Zeile, die `vite preview` bei tatsächlich geglücktem Binden schreibt.
  const boundMarker = `127.0.0.1:${port}`;
  const readyOutcome = waitFor(
    async () => stripAnsi(log).includes(boundMarker),
    15_000,
    `vite preview meldet auf eigenem stdout das Binden an ${port}`,
  ).then(
    () => 'ready' as const,
    () => 'timeout' as const,
  );

  const outcome = await Promise.race([readyOutcome, exitedEarly.then(() => 'exited' as const)]);

  if (outcome !== 'ready') {
    await killChildTree(child);
    const reason =
      outcome === 'exited'
        ? `Der eigene vite-preview-Prozess ist beendet, bevor er das Binden an Port ${port} auf ` +
          'seinem eigenen stdout gemeldet hat — vermutlich EADDRINUSE (Port bereits von einer ' +
          'fremden Gegenstelle belegt, --strictPort verhindert ein Ausweichen).'
        : `Zeitüberschreitung beim Warten auf: vite preview meldet auf eigenem stdout das Binden an ${port}.`;
    throw new Error(`${reason}\nAusgabe:\n${log}`);
  }

  // Zusatzsicherung, nicht mehr alleiniges Bereitschaftssignal (Begründung
  // im Funktionskopf): Der Prozess hat sein Binden bereits über sein eigenes
  // stdout bestätigt: eine kurze `fetch`-Bestätigung, dass er auch über das
  // Netz erreichbar ist, statt einer 15-Sekunden-Wartschleife.
  try {
    await waitFor(async () => {
      const response = await fetch(baseUrl).catch(() => null);
      return response !== null && response.ok;
    }, 5_000, `vite preview (bereits gebunden) antwortet über HTTP auf ${port}`);
  } catch (error) {
    await killChildTree(child);
    throw new Error(`${String(error)}\nAusgabe:\n${log}`);
  }

  return child;
}

/**
 * Beendet `child` samt seinem ganzen Prozessbaum.
 *
 * **Gemessen, nicht vermutet (T-263):** `child.kill('SIGTERM')` allein
 * beendet unter Windows nur den unmittelbaren Kindprozess. Dieser hier ist
 * wegen `shell: process.platform === 'win32'` beim Start ein `cmd.exe`, das
 * `pnpm` aufruft, das wiederum den eigentlichen `vite preview`-Prozess als
 * **Enkelkind** startet — `SIGTERM` an das `cmd.exe` lässt dieses Enkelkind
 * unter Windows als Waise weiterlaufen, mit dem Port weiterhin belegt.
 * Reproduziert an dieser Datei selbst: Nach einem Testlauf dieser Reihe
 * blieben `vite preview`-Prozesse auf 5173/34173/34174 zurück und
 * blockierten den nächsten Lauf — genau die Bauart, die T-259 schon als
 * „fremde, aber erreichbare Gegenstelle" auf einem geteilten Port beschrieb
 * und die der Auftraggeber als wiederkehrendes Problem benennt
 * (`board.md`: „Hängende Prozesse auf 5173 und 17844 haben heute mehrfach
 * Läufe verfälscht"). `taskkill /t /f` beendet unter Windows den ganzen
 * Baum; auf anderen Plattformen bleibt `SIGTERM` (kein `shell: true` dort,
 * kein Enkelkind-Problem).
 *
 * Absichtlich nur hier behoben, nicht in `services.ts#stopServices` (dort
 * spawnt `startWeb()` den Entwicklungsserver über dieselbe
 * `shell: true`-Bauart und trägt vermutlich dasselbe Risiko) — diese Datei
 * bedient ausschließlich `playwright.web-build.config.ts` und die eigenen,
 * neuen Gegenproben dieser Aufgabe; `services.ts` bedient die ganze
 * Hauptreihe (110 Fälle), eine Änderung dort verlangt einen eigenen,
 * isoliert gegengelesenen Auftrag statt eines Nebenschauplatzes in T-263.
 * Gemeldet, nicht mitbehoben — siehe Bericht.
 */
async function killChildTree(child: ChildProcessWithoutStdin): Promise<void> {
  if (process.platform === 'win32' && child.pid !== undefined) {
    try {
      await execFileAsync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } catch {
      // Bereits beendet, oder nie wirklich gestartet — kein zweiter Versuch nötig.
    }
    return;
  }
  child.kill('SIGTERM');
}

export async function stopChild(child: ChildProcessWithoutStdin): Promise<void> {
  await killChildTree(child);
}
