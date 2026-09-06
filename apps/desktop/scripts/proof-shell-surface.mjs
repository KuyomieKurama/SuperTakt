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
 *
 * ---------------------------------------------------------------------------
 * Die Reichweite dieses Laufs — was er leistet und was nicht (A-A-43)
 * ---------------------------------------------------------------------------
 *
 * **Dieser Lauf liest Rust als Text, nicht als Baum.** Er hat keinen Zerleger;
 * er hat zwei Werkzeuge, die Kommentare und Zeichenkettenrümpfe längentreu
 * leeren, und alles Weitere — Funktionsgrenzen, Prüfmodule, Aufruforte,
 * Adressen — steht auf diesem Gerüst. Solange das Gerüst stimmt, sind seine
 * Aussagen scharf. Bringt eine Schreibweise eines der beiden Werkzeuge aus dem
 * Takt, ist ab dieser Stelle **alles** unsichtbar, was dahinter steht — auch
 * ein Aufrufort für `open`, und der Lauf sagt in seiner Schlußzeile trotzdem,
 * es gebe genau drei.
 *
 * **Die Reichweite hing an einer Aufzählung, und diese Aufzählung war fünfmal
 * unvollständig** — jedes Mal ein Zeichen vom vorigen entfernt:
 *
 *  | Welle | Schreibweise | Was fehlte |
 *  |---|---|---|
 *  | T-176 | `r#"a"b"#`   | die rohe Zeichenkette überhaupt |
 *  | T-183 | `'"'`, geschachtelter Blockkommentar | Zeichenliteral und Kommentarzähler |
 *  | T-189 | `cr#"a"b"#`  | das Präfix `c` vor dem `r` |
 *  | T-189 | `['\u{22}','"']` | Rusts Fluchtfolgen im Zeichenliteral |
 *  | T-189/2 | `['😀','"']` | der `u`-Merker: ein Ersatzpaar ist **ein** Zeichen |
 *
 * Jeder Weg wurde einzeln behoben und einzeln gegengeprobt, und der jeweils
 * nächste stand schon daneben. Genau diese Bauart nennt E-063 Punkt 4 als die,
 * die in diesem Vorhaben zweimal versagt hat. Die naheliegende allgemeine
 * Eigenschaft — „weigere dich, wenn ein Werkzeug die Datei nicht im neutralen
 * Zustand verläßt" — ist gemessen und **trägt nicht**: Über acht Bestandsdateien
 * und sechs Kunstquellen findet sie nichts, weil die Anführungen jedes Mal
 * zufällig aufgehen (Befund T-189-4).
 *
 * **Woran die Reichweite seit E-089 gemessen ist.** „Ist jemandem noch ein Weg
 * eingefallen?" ist ein Negativbeweis, und den kann niemand führen. An seine
 * Stelle tritt eine **geschlossene Liste**: {@link RUST_LEXICAL_FORMS} führt
 * jede lexikalische Form der Rust-Referenz, in der eine Anführung vorkommen
 * kann — Zeichen- und Byteliteral samt Fluchtfolgen und Zeichen oberhalb
 * U+FFFF, die drei gewöhnlichen und die drei rohen Zeichenketten, die
 * Fortsetzungszeile, die drei Kommentarformen, die Lebenszeit und die
 * Apostrophpaarung —, und **jede** steht als eigene Kunstquelle im
 * Gegenprobenteil, mit demselben vierten Aufrufort für `open` dahinter. Die
 * Frage lautet damit nicht mehr „ist jemandem noch etwas eingefallen", sondern
 * **„steht jede Form der Referenz da"**, und die ist abhakbar (A-A-47).
 *
 * **Und gegen welches Rust die Liste gelesen ist, steht seit T-191 nicht mehr
 * nur da, sondern wird gemessen** (A-A-49, Befund T-189-15). `Cargo.toml`
 * erklärt `edition` und `rust-version`; weicht einer der beiden Werte von
 * {@link RUST_REFERENCE} ab, wird dieser Lauf rot mit der Aufforderung, die
 * Referenz erneut zu lesen. Die Grenze steht dort daneben: `rust-version` ist
 * die **untere Schranke** und nicht die Baufassung — der Wächter fängt die
 * erklärte Anhebung, nicht jede neue Form.
 *
 * **Was das nicht heißt.** Es heißt nicht, daß dieser Lauf Rust versteht. Er
 * liest weiter Text, und seine Vollständigkeit ist nicht bewiesen, sondern
 * gegengeprobt — nur eben gegen eine Liste, die aus der Referenz stammt und
 * nicht aus der Vorstellungskraft des jeweiligen Prüfers. Die Antwort auf die
 * Bauart selbst wäre ein voller Zerleger für Rust; das ist eine **Entscheidung**
 * (A-A-43) und keine Zeile, und sie ist offen. Bis sie fällt, gilt: Eine neue
 * Form gehört in {@link RUST_LEXICAL_FORMS}, ein neu gefundener Weg als
 * Kunstquelle in den Gegenprobenteil, und jede Behebung an **beide** Werkzeuge
 * zugleich, damit sie nicht auseinanderlaufen.
 */

import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
const buildScriptFile = join(desktopDir, 'scripts', 'build-app.mjs');
const cargoManifestFile = join(tauriDir, 'Cargo.toml');
const domainVersionFile = resolve(repoRoot, 'packages', 'domain', 'src', 'version.ts');

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

/**
 * Was `img-src` tragen darf — und zwar in `csp` **und** in `devCsp` (A-A-12).
 *
 * `data:` steht darin, seit es Vorschaubilder gibt; `'self'` seit je. Ein
 * dritter Eintrag wäre die Zeile, mit der die nächste Welle die Positivliste
 * für alles andere mitöffnet.
 */
const ALLOWED_IMG_SRC = ['\'self\'', 'data:'];

/**
 * Dasselbe für `devCsp`, das zusätzlich den Vite-Entwicklungsserver trägt. Er
 * läuft ausschließlich unter `pnpm dev`; im Auslieferungsbündel gibt es ihn
 * nicht.
 */
const ALLOWED_IMG_SRC_DEV = [...ALLOWED_IMG_SRC, 'http://localhost:5173'];

/** Berechtigungen, die den Öffnen-Weg aus JavaScript heraus aufmachen würden. */
const FORBIDDEN_PERMISSION_PREFIX = 'shell:';

/**
 * Die Aufruforte für `open` — **namentlich**, nicht gezählt (Auflage A-A-9,
 * Befund T-145-7).
 *
 * Bis T-147 stand hier eine Zahl: „Es gibt `1` Aufrufort; erlaubt ist genau
 * einer." Mit den Anhängen (Abschnitt 19) werden es drei, und die Zahl auf drei
 * zu setzen wäre der Nachweis, der grün wird, ohne etwas geprüft zu haben — er
 * wächst dann mit dem Code mit und ist am Ende eine Zahl, die jemand angepaßt
 * hat.
 *
 * Diese Liste sagt zu **jedem** Aufrufort drei Dinge: in welcher Datei er
 * steht, in welcher Funktion, und **welche Prüfung** im selben Funktionsrumpf
 * vor ihm stehen muß. Gemessen wird zusätzlich, daß das Ergebnis der Prüfung
 * das Öffnen trägt — ein `let _ = check(…);` daneben wäre eine Prüfung, die
 * niemand fragt.
 *
 * Ein vierter Aufrufort, gleich in welcher Datei und in welchem Unterordner,
 * macht den Lauf rot. Ein hier eingetragener, der verschwindet, ebenso: Eine
 * Liste, die nur Zuwachs bemerkt, verliert ihre Aussage beim ersten Umbau.
 */
const OPEN_CALL_SITES = [
  {
    file: 'release.rs',
    fn: 'takt_open_release',
    guard: 'release_url',
    why: 'Formprüfung der Fassungsbezeichnung, danach feste Adresse (A-V-16, T-136-1).',
  },
  {
    file: 'attachment.rs',
    fn: 'takt_open_attachment_link',
    guard: 'check_link',
    why: 'Positivliste http/https, Wirt, keine Zugangsdaten, Festpunkt (A-A-2, A-A-3).',
  },
  {
    file: 'attachment.rs',
    fn: 'takt_open_attachment_file',
    guard: 'check_file',
    why: 'absoluter Pfad, kein UNC, keine Umleitungsendung, vorhanden (A-A-4, A-A-5).',
  },
];

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

/* ==================================================================== */
/* Werkzeug: Rust ohne Kommentare und ohne Zeichenkettenrümpfe          */
/* ==================================================================== */

/**
 * Ein Zeichenliteral von Rust — **an einer Stelle für beide Werkzeuge**
 * (A-A-42).
 *
 * Bis T-189 stand `/^'(\\.|[^'\\])'/` zweimal im Lauf, und er kannte genau zwei
 * Rümpfe: ein Zeichen, oder ein Rückstrich und ein Zeichen. Rusts Fluchtfolgen
 * sind länger: `'\x22'` und `'\u{22}'` schreiben dasselbe Anführungszeichen.
 * Trifft der Ausdruck sie nicht, bleiben beide Apostrophe stehen, der schließende
 * paart sich mit dem nächsten zu einem **Scheinliteral**, und die Anführung
 * dahinter öffnet eine Zeichenkette, die nie zugeht — gemessen mit
 * `['\u{22}','"']` als einziger Zutat einer Datei, hinter der ein vierter
 * Aufrufort für `open` unsichtbar wurde (Befund T-189-2).
 *
 * Die Grammatik der Fluchtfolgen ist geschlossen und kurz; diese Aufzählung ist
 * deshalb vollständig und keine offene. Das `\n` in der letzten Alternative
 * hält die Lebenszeit `&'a str` weiterhin draußen — sie hat kein schließendes
 * Zeichen. Der Ausdruck steht **einmal**, weil die beiden Werkzeuge nach
 * T-189 nicht wieder auseinanderlaufen dürfen.
 *
 * **Der `u`-Merker ist kein Beiwerk** (A-A-46, Befund T-189-9). Ohne ihn trifft
 * `[^'\\\n]` genau **eine UTF-16-Einheit**. Ein Zeichen oberhalb von U+FFFF
 * steht als Ersatzpaar, also als zwei — `'😀'` paßte deshalb nicht, beide
 * Apostrophe blieben als vermeintliche Lebenszeit stehen, und das
 * Scheinliteral aus T-189-2 entstand eine Kodierungsebene tiefer. Gemessen:
 * dasselbe Zeichen als `'\u{1F600}'` geschrieben war rot, als `'😀'`
 * geschrieben grün. Mit `u` gilt ein Zeichen als eines, und die Längentreue
 * bleibt, weil `literal[0].length` weiterhin in UTF-16-Einheiten zählt
 * (`'😀'` → 4).
 */
const CHAR_LITERAL = /^'(\\u\{[0-9a-fA-F]{1,6}\}|\\x[0-9a-fA-F]{2}|\\.|[^'\\\n])'/u;

/**
 * Ersetzt Kommentare durch Leerzeichen — **längentreu**, damit jede Stelle im
 * Ergebnis dieselbe Stelle im Urtext ist.
 *
 * Der zeilenweise Weg, den dieser Lauf bis T-147 ging (`code.startsWith('//')`),
 * reicht für die Klammerzählung nicht: Ein Blockkommentar über drei Zeilen
 * bliebe stehen, und in `release.rs` steht der Prüfausdruck des Shell-Plugins
 * ausgeschrieben in einem Kommentar. Was dort steht, ist Prosa und kein Aufruf.
 *
 * **Blockkommentare werden gezählt, nicht angefahnt** (A-A-37, zweite Hälfte).
 * Rust schachtelt sie. Öffnet ein Kommentar einen zweiten und schliesst diesen
 * wieder, endet er für eine Fahne schon dort — ein Anführungszeichen im Rest
 * des Kommentars öffnet dann eine Zeichenkette, die es nicht gibt. Gemessen war
 * das der zweite Weg, eine rohe Zeichenkette dahinter im Gerüst unsichtbar zu
 * machen (Befund T-183-1); die Kunstquelle dazu steht als `NESTED_BLOCK_COMMENT`
 * im Gegenprobenteil.
 */
function stripRustComments(text) {
  let out = '';
  let inLine = false;
  let blockDepth = 0;
  let inString = false;
  let stringChar = '';

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] ?? '';

    if (inLine) {
      if (char === '\n') {
        inLine = false;
        out += char;
      } else {
        out += ' ';
      }
      continue;
    }
    if (blockDepth > 0) {
      if (char === '/' && next === '*') {
        blockDepth += 1;
        out += '  ';
        index += 1;
        continue;
      }
      if (char === '*' && next === '/') {
        blockDepth -= 1;
        out += '  ';
        index += 1;
        continue;
      }
      out += char === '\n' ? char : ' ';
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') {
        out += text[index + 1] ?? '';
        index += 1;
        continue;
      }
      if (char === stringChar) inString = false;
      continue;
    }
    if (char === '"' || char === "'") {
      // Ein einzelnes Anführungszeichen ist in Rust auch eine Lebenszeit
      // (`&'a str`). Eine Lebenszeit hat kein schließendes Zeichen; erkannt
      // wird sie daran, dass auf den Bezeichner kein `'` folgt.
      if (char === "'" && !CHAR_LITERAL.test(text.slice(index))) {
        out += char;
        continue;
      }
      inString = true;
      stringChar = char;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inLine = true;
      out += '  ';
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockDepth = 1;
      out += '  ';
      index += 1;
      continue;
    }
    out += char;
  }

  return out;
}

/**
 * Leert zusätzlich die Rümpfe der Zeichenketten — ebenfalls längentreu.
 *
 * Gebraucht für die **Struktur**: `format!("… {} …", …)` in `lib.rs` trägt
 * geschweifte Klammern in einer Zeichenkette, und eine Klammerzählung, die sie
 * mitzählt, findet die Grenzen einer Funktion nicht mehr. Für die Suche nach
 * **Adressen** wird dieser Schritt bewusst nicht gemacht: Eine Adresse steht in
 * einer Zeichenkette, und genau die soll gefunden werden.
 *
 * **Das Zeichenliteral gehört dazu** (A-A-37, erste Hälfte). Bis T-183 kannte
 * diese Funktion nur `"`, während `stripRustComments` das Literal längst kennt
 * — und weil das Gerüst mit dieser Funktion **außen** gebaut wird, öffnete ein
 * gewöhnliches `'"'` dort eine Zeichenkette, die nie zugeht. Ab dieser Stelle
 * war im Gerüst Code geleert und Zeichenkettenrumpf sichtbar; ein vierter
 * Aufrufort für `open` dahinter blieb unsichtbar, und der Lauf blieb grün
 * (Befund T-183-1). Erkannt wird das Literal mit demselben Ausdruck wie dort,
 * der es von der Lebenszeit `&'a str` unterscheidet; `b'"'` und `'\"'` fallen
 * unter dieselbe Zeile.
 */
function stripRustStrings(text) {
  let out = '';
  let inString = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (char === '\\') {
        out += '  ';
        index += 1;
        continue;
      }
      if (char === '"') {
        inString = false;
        out += char;
        continue;
      }
      out += char === '\n' ? char : ' ';
      continue;
    }
    if (char === "'") {
      // Zeichenliteral oder Lebenszeit — dieselbe Unterscheidung wie oben.
      const literal = CHAR_LITERAL.exec(text.slice(index));
      if (literal === null) {
        out += char;
        continue;
      }
      out += `'${' '.repeat(literal[0].length - 2)}'`;
      index += literal[0].length - 1;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    out += char;
  }

  return out;
}

/**
 * Der Anfang einer **rohen** Zeichenkette — an ihrer **Bauart** erkannt, nicht
 * an einer Liste von Präfixen (A-A-33, berichtigt durch A-A-41).
 *
 * Die Liste war zweimal zu kurz: A-A-33 nannte `/\br#*"/` und übersah `br"…"`
 * (Befund T-183-2); die Berichtigung `/\bb?r#*"/` übersah `cr"…"`, die rohe
 * C-Zeichenkette von Rust 1.77 — vor dem `r` in `cr` steht ein Wortzeichen,
 * also greift `\b` dort nicht (Befund T-189-1). Beide Male fehlte ein
 * Buchstabe, und beide Male stand ein vierter Aufrufort für `open` hinter der
 * Zeichenkette, während der Lauf grün blieb.
 *
 * **Die Bauart statt der Aufzählung:** In Rust berührt ein Bezeichner eine
 * Anführung nur als Literalpräfix, und die rohe Form ist genau die, deren
 * Präfix auf `r` endet. Der Ausdruck deckt damit `r`, `br`, `cr` und **jedes
 * künftige Präfix**. `b"…"` und `c"…"` bleiben unberührt: Das sind gewöhnliche
 * Zeichenketten mit gewöhnlichen Fluchtfolgen, und beide Werkzeuge lesen sie
 * richtig. Kein `g`: Ein globaler Ausdruck merkt sich zwischen zwei `test`
 * seine Stelle, und der Wächter übersähe jede zweite Datei.
 *
 * **Die Rückschau steht hier ohne Gegenprobe, und das mit Grund** (A-A-48).
 * Sie ist gegen **gültiges** Rust wirkungslos: mit und ohne sie über alle acht
 * Rust-Dateien des Bestands, je im Urtext und im Gerüst, und über 23 gültige
 * Schreibweisen gemessen — null Unterschiede. Der Unterschied entsteht nur,
 * wenn dem `r` eine reine Ziffernfolge unmittelbar vorangeht, und genau das
 * lehnt der Übersetzer ab (`9r"x"` Syntaxfehler, ``a9r"x"`` unbekanntes
 * Präfix). Ohne die Rückschau trifft der Ausdruck **mehr** Texte, der Lauf
 * verweigert also mehr Dateien — er wird strenger, nie milder. Eine Gegenprobe
 * dafür wäre keine Verhaltensprobe, sondern eine Festschreibung dieser Zeichen,
 * und sie stünde ununterschieden in der Zahl der Gegenproben (Befund T-189-10).
 * Die Rückschau bleibt trotzdem: Sie kostet nichts und beschreibt die Bauart.
 */
const RAW_STRING_OPENER = /(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]*?r#*"|(?<![A-Za-z0-9_])r#*"/;

/**
 * Leert die `#[cfg(test)]`-Module — ebenfalls längentreu (E-082).
 *
 * **Warum sie nicht zur Fläche der Hülle gehören:** `#[cfg(test)]` wird nur
 * unter `cargo test` übersetzt, steht also in keinem ausgelieferten Erzeugnis;
 * eine Adresse dort ist eine Prüfeingabe und kein Weg in den Browser des
 * Benutzers. Dieser Lauf behauptet etwas über das Erzeugnis, und deshalb muss
 * er lesen, was das Erzeugnis ist. Das ist die Berichtigung eines Meßfehlers
 * und keine gelockerte Schranke: Der **Produktivteil** derselben Datei bleibt
 * Zeichen für Zeichen gemessen, und zwei Gegenproben am Ende dieses Laufs
 * zeigen es — eine Adresse im Produktivteil und eine **hinter** dem Block.
 *
 * **Wie die Grenze gezogen wird.** Gezählt wird auf dem Gerüst (ohne
 * Kommentare, ohne Zeichenkettenrümpfe), damit weder ein `}` in einer
 * Zeichenkette noch eines in einem Kommentar den Block vorzeitig schliesst;
 * die Stellen bleiben dieselben wie im Urtext, weil beide Schritte längentreu
 * sind. Ausgeschlossen wird ausschliesslich die Form `#[cfg(test)] mod name
 * { … }` bis zu ihrer **zugehörigen** schliessenden Klammer. Alles, was diese
 * Form nicht trifft — `#[cfg(test)]` vor einem `use`, vor einer einzelnen
 * Funktion, vor `#[cfg(any(test, …))]` —, bleibt gemessen; ebenso ein Block
 * ohne schliessende Klammer.
 *
 * **Was diese Grenze nicht leistet** (Befund T-176-1, berichtigte Zusage). Der
 * frühere Satz an dieser Stelle lautete „im Zweifel zu viel, nie zu wenig" und
 * war falsch: Eine **rohe** Zeichenkette (`r"…"`, `r#"…"#`) kennt keines der
 * beiden Textwerkzeuge. Enthält sie ein Anführungszeichen, laufen beide aus dem
 * Takt, und der Ausschluss endet **hinter** dem Modul statt an ihm — gemessen
 * an einer Datei, die danach einen vierten Aufrufort für `open` und eine fremde
 * Adresse trug und trotzdem grün blieb. Der Lauf lernt die Form deshalb nicht,
 * er **weigert sich**: {@link checkOpenCallSites} urteilt über eine solche
 * Datei gar nicht und meldet stattdessen einen Befund (A-A-33). Erst mit dieser
 * Weigerung gilt „im Zweifel zu viel, nie zu wenig" wieder.
 *
 * **Und die Weigerung trägt nur so weit wie das Gerüst** (Befund T-183-1,
 * A-A-37). Gesucht wird die rohe Zeichenkette auf dem Gerüst und nicht im
 * Urtext, weil `appdata.rs` die gewöhnliche Zeichenkette `"/inheritance:r"`
 * trägt und der Ausdruck dort sonst falsch anschlüge. Damit hängt die
 * Weigerung daran, daß die **erste** rohe Zeichenkette einer Datei im Gerüst
 * überhaupt sichtbar ist — und dieser Satz war zweimal falsch, gemessen:
 *
 *  1. Ein gewöhnliches `'"'` öffnete in `stripRustStrings` eine Zeichenkette,
 *     die nie zuging (elf Zeichenliterale stehen heute im Rust-Anteil).
 *  2. Ein geschachtelter Blockkommentar endete für `stripRustComments` schon
 *     an seinem inneren Schluss, und das `"` dahinter tat dasselbe.
 *
 * Beides ist behoben — Zeichenliteral und Kommentarzähler —, und beides ist
 * gegengeprobt: Die drei Kunstquellen aus `docs/bedrohungsmodell.md` 24.1.2 und
 * 24.1.3 stehen im Gegenprobenteil, damit dieser Satz gemessen wird, statt hier
 * behauptet zu werden. Wer eines der beiden Textwerkzeuge wieder vereinfacht,
 * macht sie blind.
 *
 * @param {string} text Eine Rust-Quelle, unverändert.
 * @returns {string} Dieselbe Quelle, die Prüfmodule durch Leerzeichen ersetzt.
 */
function stripCfgTestModules(text) {
  const skeleton = stripRustStrings(stripRustComments(text));
  // Zuordnung der Stellen nur bei gleicher Länge; sonst wird nichts
  // ausgeschlossen und der Lauf misst weiter alles.
  if (skeleton.length !== text.length) return text;

  const attribute = /#\s*\[\s*cfg\s*\(\s*test\s*\)\s*\]/g;
  /** @type {Array<{ from: number, to: number }>} */
  const blocks = [];
  let match;

  while ((match = attribute.exec(skeleton)) !== null) {
    const after = skeleton.slice(match.index + match[0].length);
    // Zwischen Attribut und Rumpf nur Leerraum, weitere Attribute und die
    // Modulzeile selbst.
    const head = /^(?:\s|#\[[^\]]*\])*(?:pub(?:\s*\([^)]*\))?\s+)?mod\s+[A-Za-z0-9_]+\s*\{/.exec(after);
    if (head === null) continue;

    let depth = 0;
    let end = match.index + match[0].length + head[0].length - 1;
    for (; end < skeleton.length; end += 1) {
      const char = skeleton[end];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) continue;

    blocks.push({ from: match.index, to: end + 1 });
    attribute.lastIndex = end + 1;
  }

  if (blocks.length === 0) return text;

  let out = '';
  let cursor = 0;
  for (const block of blocks) {
    out += text.slice(cursor, block.from);
    // Zeichenweise, ohne `u`: So bleibt auch ein Ersatzpaar längentreu.
    out += text.slice(block.from, block.to).replace(/[^\n]/g, ' ');
    cursor = block.to;
  }
  return out + text.slice(cursor);
}

/**
 * Die Funktionen einer Rust-Datei mit ihren Rümpfen.
 *
 * Gearbeitet wird auf dem Gerüst (ohne Kommentare, ohne Zeichenkettenrümpfe);
 * die Stellen bleiben dieselben wie im Urtext, weil beide Schritte längentreu
 * sind.
 */
function rustFunctions(skeleton) {
  const out = [];
  const signature = /(?:^|[\s}])(?:pub\s+(?:\([^)]*\)\s*)?)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)/g;
  let match;

  while ((match = signature.exec(skeleton)) !== null) {
    const name = match[1];
    const open = skeleton.indexOf('{', match.index + match[0].length);
    if (open === -1) continue;
    let depth = 0;
    let end = open;
    for (; end < skeleton.length; end += 1) {
      const char = skeleton[end];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
    }
    out.push({ name, body: skeleton.slice(open, end) });
    signature.lastIndex = end;
  }

  return out;
}

/**
 * Trägt das Ergebnis der Prüfung das Öffnen? (A-A-9, zweiter Halbsatz.)
 *
 * Gemessen als Text, so wie die Auflage es beschreibt: Zwischen dem Beginn der
 * Funktion und dem `.open(` steht ein Aufruf der eingetragenen Prüffunktion,
 * und die Anweisung, in der er steht, endet in einem `?`, einem `ok_or` oder
 * einem `return Err`. Ein `let _ = check_link(&url);` daneben erfüllt das
 * nicht — und genau das ist die dritte Gegenprobe.
 */
function guardCarriesTheOpen(body, guard, openIndex) {
  const call = new RegExp(String.raw`\b${guard}\s*\(`, 'g');
  let match;
  while ((match = call.exec(body)) !== null) {
    if (match.index > openIndex) return false;
    const semicolon = body.indexOf(';', match.index);
    const statement = semicolon === -1 ? body.slice(match.index) : body.slice(match.index, semicolon + 1);
    if (/\?|ok_or|return\s+Err/.test(statement)) return true;
  }
  return false;
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

    /*
      **`.toml` wird nicht zerlegt, sondern gelesen** (Befund T-143 B-1).

      Tauri nimmt drei Formen an (`tauri-utils/acl/capability.rs:269-278`:
      `json`, `toml`, mit `config-json5` auch `json5`), und dieser Lauf liest
      seit T-147 alle drei. Ein TOML-Zerleger dafür einzuziehen wäre eine
      Abhängigkeit für eine Aussage, die die Rohtextprüfung oben bereits trifft:
      `permissions = ["shell:default"]` enthält die Zeichenkette `shell:`.
      Verlangt wird hier nur noch, dass die Datei überhaupt Berechtigungen
      führt — sonst misst der Wächter an ihr nichts.
    */
    if (file.name.endsWith('.toml')) {
      if (!/(^|\n)\s*permissions\s*=/.test(file.text)) {
        findings.push(`${file.name} führt keine Berechtigungen — dann misst der Wächter dort nichts.`);
      }
      continue;
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

  /*
    `img-src` bleibt `'self' data:` (Auflage A-A-12).

    Das Vorschaubild eines Bildanhangs kommt als `data:`-Adresse, die die
    Oberfläche selbst baut (E-071 Punkt 3). Die naheliegende Alternative wäre
    ein `http://127.0.0.1:17843` in `img-src` — nach außen kein Zuwachs, weil
    `connect-src` denselben Eintrag schon trägt. Sie ist trotzdem die
    schlechtere, und der Grund steht in T-145-9: **Ein `<img src>` trägt kein
    `X-Takt-Token`.** Der Browser setzt bei einem Bildabruf keine eigenen
    Kopfzeilen. Die CSP-Variante bräuchte deshalb entweder eine
    unauthentifizierte Byte-Route auf einem Port, den jeder lokale Prozess
    erreicht (VG-1), oder ein Geheimnis in der Adresse — und das stünde danach
    im Verlauf, im Speicher des Webviews und in jeder Fehlermeldung (B-2.4).
  */
  for (const [key, allowed] of [
    ['csp', ALLOWED_IMG_SRC],
    ['devCsp', ALLOWED_IMG_SRC_DEV],
  ]) {
    const value = security[key];
    if (typeof value !== 'string' || value.length === 0) continue;
    const found = directives(value).get('img-src');
    if (found === undefined) {
      findings.push(`app.security.${key} führt keine Marke img-src.`);
      continue;
    }
    if (found.join(' ') !== allowed.join(' ')) {
      findings.push(
        `app.security.${key} > img-src weicht ab.\n` +
          `        zugesagt:  ${allowed.join(' ')}\n` +
          `        gefunden:  ${found.join(' ')}\n` +
          `        Ein <img src> trägt kein X-Takt-Token (A-A-12, T-145-9).`,
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
/* Prüfung 3 — die Aufruforte, namentlich und mit ihrer Prüfung          */
/*             (T-136-1, A-V-16, A-A-9, Befund T-145-7)                  */
/* ==================================================================== */

/**
 * Drei Aussagen in einem Durchgang, und keine davon ist eine Zahl:
 *
 *  1. **Jeder** Aufrufort für `.open(` steht in {@link OPEN_CALL_SITES} — mit
 *     Datei **und** Funktion. Ein vierter, gleich in welchem Unterordner, macht
 *     den Lauf rot; ein eingetragener, der verschwindet, ebenso.
 *  2. Für jeden gilt: Im selben Funktionsrumpf steht **vor** dem Öffnen ein
 *     Aufruf der eingetragenen Prüffunktion, und das Öffnen hängt von ihrem
 *     Ergebnis ab (`?`, `ok_or`, `return Err`).
 *  3. Im ganzen Rust-Anteil steht außer der Release-Adresse und dem lokalen
 *     Dienst **keine** fremde Adresse, und die Release-Adresse steht genau
 *     einmal (A-18.3).
 *
 * Gelesen wird dabei der **Produktivteil**: `#[cfg(test)]`-Module fallen vorher
 * heraus, weil sie in kein ausgeliefertes Erzeugnis übersetzt werden (E-082).
 *
 * Und davor steht die Frage, ob dieser Lauf die Datei überhaupt lesen kann: Eine
 * Quelle mit einer **rohen** Zeichenkette wird nicht beurteilt, sondern gemeldet
 * (A-A-33). Was dann zu tun ist, steht in `.claude/team/reports/T-173-2-frontend-dev.md`.
 *
 * Gelesen wird rekursiv über `src-tauri/src` (Befund T-143 B-2): Bis T-147 las
 * dieser Lauf **eine** Ebene, und ein zweiter Öffnen-Weg in einem Untermodul
 * wäre unsichtbar geblieben, während der Nachweis sagte, es gebe genau einen.
 *
 * @param {ReadonlyArray<{ name: string, text: string }>} sources Rust-Quellen.
 * @returns {string[]} Befunde.
 */
export function checkOpenCallSites(sources) {
  const findings = [];
  if (sources.length === 0) {
    findings.push('Es wurde keine einzige Rust-Quelle gelesen — der Wächter misst nichts.');
    return findings;
  }

  /** Welche Einträge der Liste im Baum tatsächlich vorkommen. */
  const seen = new Set();
  let releasePrefixLiterals = 0;

  for (const source of sources) {
    // A-A-33: Vor jeder Aussage die Frage, ob dieser Lauf die Datei überhaupt
    // lesen kann. Gesucht wird auf dem Gerüst und nicht im Urtext, weil ein
    // `:r"` am Ende einer gewöhnlichen Zeichenkette (`appdata.rs`:
    // `"/inheritance:r"`) sonst falsch anschlüge. Daß die rohe Zeichenkette im
    // Gerüst überhaupt sichtbar ist, hängt an den beiden Textwerkzeugen — das
    // war zweimal falsch und ist beide Male behoben und gegengeprobt (A-A-37);
    // die Reichweite dieser Bauart steht im Kopf des Laufs (A-A-43).
    //
    // Wer hier anschlägt — etwa mit `r"C:\Users\…"` in einem Prüffall —, baut
    // die Weigerung nicht aus: Derselbe Wert steht mit doppelten Rückstrichen
    // in einer gewöhnlichen Zeichenkette. Die Form wirklich zu lesen hiesse,
    // beide Textwerkzeuge um einen Zerleger für rohe Zeichenketten zu
    // erweitern, samt eigener Gegenprobe — das ist eine Entscheidung, keine
    // Zeile nebenbei.
    if (RAW_STRING_OPENER.test(stripRustStrings(stripRustComments(source.text)))) {
      findings.push(
        `${source.name} enthält eine rohe Zeichenkette (\`r"…"\`, \`br"…"\`, \`cr#"…"#\` und jedes ` +
          `weitere Präfix auf \`r\`). Die Textwerkzeuge dieses Laufs kennen die Form nicht: Ab dort ` +
          `zählen sie Zeichenketten, Kommentare und Klammern falsch, und ein Aufrufort oder eine ` +
          `Adresse dahinter bliebe unsichtbar. Eine Aussage über eine Datei, die dieser Lauf nicht ` +
          `lesen kann, ist keine — deshalb urteilt er nicht über sie (A-A-33, A-A-41).`,
      );
      continue;
    }

    // Gemessen wird der Produktivteil: `#[cfg(test)]` wird nicht in das
    // ausgelieferte Erzeugnis übersetzt und ist damit keine Fläche der Hülle
    // (E-082). Siehe {@link stripCfgTestModules} für die Grenze und die zwei
    // Gegenproben, die sie halten.
    const withoutComments = stripRustComments(stripCfgTestModules(source.text));
    const skeleton = stripRustStrings(withoutComments);

    /* -------- 1 und 2: Aufruforte und ihre Prüfung -------- */
    for (const fn of rustFunctions(skeleton)) {
      let openIndex = fn.body.indexOf('.open(');
      if (openIndex === -1) {
        // Auch `.open (` mit Leerzeichen ist ein Aufruf.
        const spaced = /\.open\s*\(/.exec(fn.body);
        if (spaced === null) continue;
        openIndex = spaced.index;
      }

      const entry = OPEN_CALL_SITES.find((site) => site.file === source.name && site.fn === fn.name);
      if (entry === undefined) {
        findings.push(
          `${source.name} > ${fn.name}() ruft \`open\` und steht in keinem Eintrag. ` +
            `Ein Aufrufort, den dieser Lauf nicht kennt, ist ein ungeprüfter Weg in den Browser ` +
            `oder in die Standardanwendung (T-136-1).`,
        );
        continue;
      }

      seen.add(`${entry.file}#${entry.fn}`);
      if (!guardCarriesTheOpen(fn.body, entry.guard, openIndex)) {
        findings.push(
          `${source.name} > ${fn.name}() öffnet, ohne dass \`${entry.guard}\` davor steht und das ` +
            `Öffnen trägt. Erwartet: ${entry.why}`,
        );
      }
    }

    /* -------- 3: die Adressen -------- */
    for (const line of withoutComments.split('\n')) {
      for (const match of line.matchAll(/https?:\/\/[^"'\s]*/g)) {
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

  for (const site of OPEN_CALL_SITES) {
    if (!seen.has(`${site.file}#${site.fn}`)) {
      findings.push(
        `${site.file} > ${site.fn}() ist als Aufrufort eingetragen, kommt im Baum aber nicht vor. ` +
          `Eine Liste, die nur Zuwachs bemerkt, verliert ihre Aussage beim ersten Umbau.`,
      );
    }
  }

  if (releasePrefixLiterals !== 1) {
    findings.push(
      `Die feste Adresse steht ${releasePrefixLiterals}-mal wörtlich im Rust-Anteil; sie gehört an genau eine Stelle (A-18.3).`,
    );
  }

  return findings;
}

/* ==================================================================== */
/* Prüfung 3b — die Fassung im Bauskript (Befund T-143 S-2)              */
/* ==================================================================== */

/**
 * `build-app.mjs` ist die **dritte** Stelle, an der ein führendes `v` fällt und
 * eine Fassungsform geprüft wird — und bis T-147 tat sie es **ohne** die
 * Schranken `{1,9}` und `{1,64}` aus `VERSION_SHAPE`.
 *
 * **Was daran hängt.** Ein Etikett `v1234567890.0.0` (zehn Ziffern) baute
 * durch, das Erzeugnis trug die Zahl, `takt_installed_version` gab sie heraus —
 * und `checkVersion` wies sie danach als `malformed` ab. `decideUpdateNotice`
 * lieferte dauerhaft `{ show: false, reason: 'unknown' }`: Die Versionsprüfung
 * dieses Erzeugnisses meldete sich **nie**, still, ohne Protokollzeile, nicht
 * von „alles aktuell" zu unterscheiden. Dieselbe Fassung wiese auch
 * `takt_open_release` ab.
 *
 * **Warum gemessen und nicht aufgelöst.** Der Ausdruck aus `@takt/domain`
 * einzubinden wäre der bessere Weg — `build-app.mjs` ist Node —, aber das Paket
 * liefert `.ts` und keine übersetzte Fassung, und eine Abhängigkeit in
 * `apps/desktop/package.json` einzutragen ist eine Entscheidung des
 * Orchestrators (offene Frage 2 aus T-143). Bis dahin gilt die zweite Hälfte
 * derselben Auflage: Der Ausdruck steht **zeichengleich** in beiden Dateien,
 * und dieser Lauf misst das.
 *
 * @param {string} buildText Inhalt von `scripts/build-app.mjs`.
 * @param {string} domainText Inhalt von `packages/domain/src/version.ts`.
 * @returns {string[]} Befunde.
 */
export function checkBuildVersionShape(buildText, domainText) {
  const findings = [];

  const declared = /export const VERSION_SHAPE = (\/\^.*\$\/);/.exec(domainText);
  if (declared === null) {
    return ['packages/domain/src/version.ts führt kein `VERSION_SHAPE` in der erwarteten Form.'];
  }
  const shape = declared[1];

  if (!buildText.includes(shape)) {
    findings.push(
      `build-app.mjs prüft die Fassung nicht mit ${shape}. Ohne die Schranken {1,9} und {1,64} ` +
        `baut ein Etikett durch, das \`checkVersion\` danach abweist — und die Versionsprüfung ` +
        `dieses Erzeugnisses schweigt für immer (T-143 S-2).`,
    );
  }

  const strips = [...buildText.matchAll(/replace\(\s*\/\^v\//g)].length;
  if (strips > 1) {
    findings.push(
      `build-app.mjs schneidet das führende \`v\` an ${strips} Stellen ab; eine genügt (E-066 Punkt 3).`,
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

  let releaseAddresses = 0;
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

        if (address === rustPrefix) {
          releaseAddresses += 1;
          continue;
        }
        // Der lokale Dienst und der Entwicklungsserver.
        if (address.startsWith('http://127.0.0.1:') || address.startsWith('http://localhost:')) continue;
        /*
          **Ein Schemastück ohne Wirt ist keine Adresse.** Seit Abschnitt 19
          steht in der Oberfläche `"https://"` — als Platzhalter im Eingabefeld
          für einen Verweis und als Präfix, das die Ersatzbezeichnung abschneidet
          (`lib/attachmentLabel.ts`). Beides zeigt auf nichts und öffnet nichts.
          Gemessen wird die Eigenschaft und nicht die Datei: Was hinter `//`
          steht, ist leer oder das Auslassungszeichen.
        */
        const host = address.replace(/^https?:\/\//, '');
        if (host === '' || host === '…') continue;
        /*
          **Beispieladressen der Musterseite.** RFC 2606 reserviert `.invalid`
          für genau diesen Zweck: Der Name löst nirgends auf, und eine Adresse
          darunter kann nie ein echtes Ziel werden. Zugelassen ist sie
          ausschließlich unter `showcase/` — dieselbe Grenze wie bei den übrigen
          erfundenen Daten dieser Seite. Steht eine `.invalid` in einer Ansicht,
          ist sie ein Befund: Dort gehört keine erfundene Adresse hin.
        */
        const isExample = /\.invalid(?:[/:?#]|$)/.test(address);
        if (isExample && source.name.startsWith('showcase/')) continue;
        if (isExample) {
          findings.push(
            `${source.name} nennt die Beispieladresse ${address}. Erfundene Adressen gehören auf die Musterseite und nicht in eine Ansicht.`,
          );
          continue;
        }

        findings.push(
          `${source.name} nennt ${address}; die Hülle öffnet ${rustPrefix}. In der Oberfläche steht außer der Release-Seite, dem lokalen Dienst und Beispielen unter .invalid keine Adresse.`,
        );
      }

      if (/\binvoke\s*\(/.test(code) || code.includes('@tauri-apps/')) {
        bridges += 1;
        findings.push(`${source.name} spricht unmittelbar mit der Hülle: ${code.slice(0, 72)}`);
      }
    }
  }

  if (releaseAddresses !== 1) {
    findings.push(
      `Die Release-Adresse steht ${releaseAddresses}-mal in der Oberfläche; sie gehört an genau eine Stelle (lib/releasePage.ts).`,
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

/**
 * **Ein** Leser für alle drei Bäume, rekursiv, mit Pfad im Namen (Befunde
 * T-143 B-1 und B-2).
 *
 * Bis T-147 gab es drei Leser, und zwei davon lasen **eine** Ebene:
 *
 *  - `readCapabilityFiles()` filterte auf `.json`. Tauri liest anders —
 *    `tauri-utils-2.9.3/src/acl/build.rs:458-461` bildet das Muster
 *    `"{capabilities}/**\/*"`, und `acl/capability.rs:269-278` nimmt `json`,
 *    `toml` und (mit `config-json5`) `json5` an. Eine
 *    `capabilities/shell.toml` mit `permissions = ["shell:default"]` gäbe dem
 *    Webview `allow-open` mit einem Muster, das jede `https:`-Adresse
 *    durchlässt — und `proof:all` bliebe **grün**.
 *  - `readRustSources()` las nur die oberste Ebene von `src-tauri/src`. Ein
 *    zweites `app.shell().open(…)` in einem Untermodul war unsichtbar, während
 *    die Prüfung sagte, es gebe genau einen Aufrufort.
 *
 * Der Name trägt den Pfad relativ zur Wurzel (`sub/mod.rs`), damit ein Befund
 * die Datei nennt und nicht nur ihren Rumpf.
 */
function readTree(root, extensions, dir = root, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      out.push(...readTree(root, extensions, join(dir, entry.name), `${name}/`));
      continue;
    }
    if (extensions.some((extension) => entry.name.endsWith(extension))) {
      out.push({ name, text: readFileSync(join(dir, entry.name), 'utf8') });
    }
  }
  return out;
}

/** Die drei Endungen, die Tauri als Fähigkeitendatei annimmt. */
const CAPABILITY_EXTENSIONS = ['.json', '.json5', '.toml'];

const capabilityFiles = readTree(capabilitiesDir, CAPABILITY_EXTENSIONS);
const rustSources = readTree(rustSrcDir, ['.rs']);
const webSources = readTree(webSrcDir, ['.ts', '.tsx']);
const configText = readFileSync(configFile, 'utf8');
const buildScriptText = readFileSync(buildScriptFile, 'utf8');
const domainVersionText = readFileSync(domainVersionFile, 'utf8');
const cargoManifestText = readFileSync(cargoManifestFile, 'utf8');

/* ==================================================================== */
/* Prüfung 7 — gegen welche Sprache die Formenliste gelesen wurde       */
/* ==================================================================== */

/**
 * **Die Fassung, gegen die {@link RUST_LEXICAL_FORMS} gelesen ist** (A-A-49,
 * Befund T-189-15, O-HD).
 *
 * Bis T-191 stand über der Formenliste der Satz, sie stamme aus der Referenz
 * der Sprache — und nirgends stand, **aus welcher**. Das ist genau die Bauart,
 * die in diesem Faden fünfmal nachgegeben hat: eine Begründung statt einer
 * Messung. `Cargo.toml` ist die einzige Stelle im Bestand, an der die
 * Sprachfassung überhaupt erklärt wird; dieser Lauf bindet die Liste daran und
 * wird rot, sobald einer der beiden Werte sich bewegt.
 *
 * **Und die Grenze gehört danebengeschrieben, sonst verspricht der Wächter
 * mehr, als er hält:**
 *
 *  - `rust-version` ist die **untere Schranke** — die älteste Fassung, mit der
 *    sich der Anteil übersetzen läßt. Sie ist **nicht** die Fassung, mit der
 *    gebaut wird: Eine `rust-toolchain.toml` gibt es nicht, die Arbeitsläufe
 *    legen keine fest, örtlich läuft {@link RUST_REFERENCE.readWith}. Eine
 *    neue Literalform in 1.90 bewegt diesen Wert also **nicht**, und dieser
 *    Wächter sieht sie nicht.
 *  - Er fängt die **erklärte Anhebung**, nicht jede neue Form. Das ist wenig,
 *    aber es ist der Anlaß, bei dem jemand die Referenz ohnehin in der Hand
 *    hat — und es ist mehr als der Satz, der vorher hier stand.
 *  - Die Größenordnung dazu, damit das nicht überzeichnet wird: Rust hat in
 *    einem Jahrzehnt **eine** neue Literalform bekommen (`c"…"`/`cr"…"`,
 *    stabil seit 1.77).
 *
 * **Ausdrücklich verworfen:** die Referenz zur Laufzeit zu holen. Das wäre
 * eine zweite Adresse außerhalb `127.0.0.1` und damit eine Aufhebung von
 * E-001 — dafür gäbe es eine Entscheidung, nicht eine Zeile Code.
 */
const RUST_REFERENCE = {
  edition: '2021',
  rustVersion: '1.82',
  readWith: 'rustc 1.89.0 (29483883e 2025-08-04)',
  readIn: 'T-183, T-189 und T-191',
};

/**
 * Liest einen Schlüssel aus dem `[package]`-Abschnitt der `Cargo.toml`.
 *
 * Kein TOML-Zerleger: Gesucht wird **eine** Zeile der Form `schlüssel = "wert"`
 * vor dem nächsten Abschnitt. Findet der Ausdruck nichts, ist das ein Befund
 * und kein Grund weiterzugehen — ein fehlender Wert wäre sonst ein stiller
 * Ausgang, und genau die zählt dieser Lauf sonst auf.
 *
 * @param {string} text
 * @param {string} key
 * @returns {string | null}
 */
function packageValue(text, key) {
  const section = /^\[package\]\s*$([\s\S]*?)(?=^\[|\Z)/m.exec(text);
  if (section === null) return null;
  const line = new RegExp(String.raw`^\s*${key}\s*=\s*"([^"]*)"\s*$`, 'm').exec(section[1]);
  return line === null ? null : line[1];
}

/**
 * Stimmt die erklärte Sprachfassung noch mit der überein, gegen die die
 * Formenliste gelesen wurde? (A-A-49)
 *
 * @param {string} text Der Inhalt von `Cargo.toml`.
 * @returns {string[]} Befunde.
 */
export function checkRustLanguageBaseline(text) {
  const findings = [];
  for (const [key, expected] of [
    ['edition', RUST_REFERENCE.edition],
    ['rust-version', RUST_REFERENCE.rustVersion],
  ]) {
    const actual = packageValue(text, key);
    if (actual === null) {
      findings.push(
        `Cargo.toml erklärt kein \`${key}\` mehr — dann steht nirgends, gegen welches Rust ` +
          `RUST_LEXICAL_FORMS gelesen wurde.`,
      );
      continue;
    }
    if (actual !== expected) {
      findings.push(
        `Cargo.toml sagt \`${key} = "${actual}"\`, die Formenliste ist gegen "${expected}" gelesen ` +
          `(${RUST_REFERENCE.readIn}, ${RUST_REFERENCE.readWith}). Die lexikalischen Formen der ` +
          `Referenz sind erneut zu lesen; erst danach gehört dieser Wert hier nachgezogen.`,
      );
    }
  }
  return findings;
}

/* ==================================================================== */
/* Prüfung 5 — der Leser selbst (Befunde T-143 B-1 und B-2)              */
/* ==================================================================== */

/**
 * **Der Leser wird gegen einen echten Baum gemessen, nicht gegen eine Liste.**
 *
 * Das ist die Lehre aus T-143: Die bisherige Gegenprobe schob den Verstoß in
 * die schon gelesene Liste (`[...rustSources, { name: 'zweiter.rs', … }]`) und
 * konnte die **Blindheit des Lesers** deshalb gar nicht bemerken. Ein Leser,
 * der einen Unterordner nicht betritt, besteht jede Prüfung, die ihm den Inhalt
 * hinlegt.
 *
 * Gebaut wird deshalb ein Baum im Temporärverzeichnis des Betriebssystems —
 * **nicht** in `capabilities/` oder `src/`: Eine dort liegengebliebene
 * Fähigkeitendatei würde von Tauri angewandt, und das wäre ein Nachweis, der
 * die Lücke aufmacht, die er misst.
 *
 * @returns {string[]} Befunde.
 */
export function checkReaderReach() {
  const findings = [];
  const scratch = mkdtempSync(join(tmpdir(), 'takt-proof-shell-'));
  try {
    mkdirSync(join(scratch, 'unterordner'), { recursive: true });
    writeFileSync(join(scratch, 'oben.json'), '{ "permissions": [] }\n', 'utf8');
    writeFileSync(join(scratch, 'unterordner', 'tief.json'), '{ "permissions": [] }\n', 'utf8');
    writeFileSync(join(scratch, 'unterordner', 'tief.toml'), 'permissions = []\n', 'utf8');
    writeFileSync(join(scratch, 'unterordner', 'tief.json5'), '{ permissions: [] }\n', 'utf8');
    writeFileSync(join(scratch, 'unterordner', 'egal.txt'), 'kein Kandidat\n', 'utf8');

    const found = readTree(scratch, CAPABILITY_EXTENSIONS).map((file) => file.name);
    for (const expected of [
      'oben.json',
      'unterordner/tief.json',
      'unterordner/tief.toml',
      'unterordner/tief.json5',
    ]) {
      if (!found.includes(expected)) {
        findings.push(`Der Leser findet ${expected} nicht — genau die Lücke aus Befund T-143 B-1.`);
      }
    }
    if (found.includes('unterordner/egal.txt')) {
      findings.push('Der Leser nimmt `.txt` mit; die Endungsliste greift nicht.');
    }

    // Und dieselbe Frage für die Rust-Quellen (Befund T-143 B-2).
    mkdirSync(join(scratch, 'rust', 'tief'), { recursive: true });
    writeFileSync(join(scratch, 'rust', 'oben.rs'), '// oben\n', 'utf8');
    writeFileSync(join(scratch, 'rust', 'tief', 'mod.rs'), '// tief\n', 'utf8');
    const rust = readTree(join(scratch, 'rust'), ['.rs']).map((file) => file.name);
    if (!rust.includes('tief/mod.rs')) {
      findings.push('Der Leser der Rust-Quellen betritt keinen Unterordner — Befund T-143 B-2.');
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return findings;
}

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
    title: `${String(OPEN_CALL_SITES.length)} namentliche Aufruforte für \`open\`, jeder mit seiner Prüfung (T-136-1, A-A-9)`,
    findings: checkOpenCallSites(rustSources),
  },
  {
    title: 'Die angezeigte Adresse ist zeichengleich mit der geöffneten (A-18.6, E-065)',
    findings: checkWebAddress(webSources, RELEASE_TAG_PREFIX),
  },
  {
    title: 'Der Leser erreicht Unterordner und alle drei Endungen (T-143 B-1, B-2)',
    findings: checkReaderReach(),
  },
  {
    title: 'build-app.mjs prüft die Fassung mit der Form der Domäne (T-143 S-2)',
    findings: checkBuildVersionShape(buildScriptText, domainVersionText),
  },
  {
    title:
      `Die Formenliste ist gegen edition ${RUST_REFERENCE.edition} und rust-version ` +
      `${RUST_REFERENCE.rustVersion} gelesen (A-A-49, T-189-15)`,
    findings: checkRustLanguageBaseline(cargoManifestText),
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
 * Ein ganz gewöhnliches Zeichenliteral, das ein Anführungszeichen enthält.
 * Elf Zeichenliterale stehen heute im Rust-Anteil; `'"'` entsteht bei der
 * nächsten Frage, ob ein Name eines trägt (`docs/bedrohungsmodell.md` 24.1.2).
 */
const QUOTE_CHAR_LITERAL =
  '/// Trennt an Anfuehrungszeichen — ein gewoehnliches Zeichenliteral.\n' +
  'pub fn trenner() -> char {\n    \'"\'\n}\n';

/** Ein geschachtelter Blockkommentar — Rust schachtelt sie (24.1.3). */
const NESTED_BLOCK_COMMENT = '/* aussen /* innen */ er sagte " */\n';

/**
 * Eine Kunstquelle nach `docs/bedrohungsmodell.md` 23.1.1 und 24.1.2: erst der
 * Kopf, der die Textwerkzeuge aus dem Takt bringen soll, dann — falls verlangt
 * — ein Prüfmodul mit einer rohen Zeichenkette, und dahinter ein **vierter**
 * Aufrufort für `open` samt fremder Adresse.
 *
 * Ohne rohe Zeichenkette greift keine Weigerung; dann muss der Lauf Aufrufort
 * und Adresse selbst sehen. Mit ihr muss er sich weigern. Beides wird gemessen.
 *
 * @param {string} head Der Kopf, der blind machen soll.
 * @param {string | null} raw Die rohe Zeichenkette, oder `null`.
 * @returns {string} Der Quelltext.
 */
function blindingSource(head, raw) {
  const testModule = raw === null ? '' : `#[cfg(test)]\nmod tests {\n    const S: &str = ${raw};\n}\n\n`;
  return (
    `${head}${testModule}#[tauri::command]\n` +
    'pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {\n' +
    '    app.shell().open(url, None).map_err(|e| e.to_string())?;\n' +
    '    let _ = "https://boese.example/x";\n    Ok(())\n}\n'
  );
}

/**
 * **Die lexikalischen Formen der Rust-Referenz, in denen eine Anführung
 * vorkommen kann** — je eine Kunstquelle, je eine Gegenprobe (A-A-47, E-089).
 *
 * Vier Wellen lang lautete die Frage „ist jemandem noch ein Weg eingefallen?",
 * und viermal lautete die Antwort ja. Das ist ein Negativbeweis, und den kann
 * niemand führen. An seine Stelle tritt eine Liste, die **nicht** aus der
 * Vorstellungskraft eines Prüfers stammt, sondern aus der Referenz der Sprache:
 * Jede Form, in der ein `"` stehen kann, steht hier mit einer eigenen Quelle,
 * und hinter jeder derselbe vierte Aufrufort für `open` samt fremder Adresse.
 *
 * Damit ist „gibt es einen weiteren Weg?" eine **abhakbare** Frage geworden:
 * Sie heißt jetzt „steht jede Form der Referenz da?".
 *
 * Erwartet wird je nach Form Zweierlei:
 *
 *  - `refusal` — die rohen Formen. Sie kann dieser Lauf nicht lesen; er
 *    verweigert das Urteil über die Datei (A-A-33).
 *  - `callSite` — alle übrigen. Sie muss er lesen können, und dann findet er
 *    den vierten Aufrufort **und** die Adresse.
 *
 * ---------------------------------------------------------------------------
 * `bite` — was eine Probe **messen kann**, und was sie nur festhält (O-HC)
 * ---------------------------------------------------------------------------
 *
 * Diese neunzehn Proben haben **nicht dieselbe Kraft**, und bis T-191 stand
 * das nirgends. Die Schlusszeile sagte „49 Gegenproben, 0 blind" und führte
 * damit eine Probe, die unter einer eingesetzten Verstümmelung nachweislich
 * blind wird, ununterschieden neben einer, die es heute gar nicht kann. Das
 * ist dieselbe Klasse wie eine Zahl, die mit dem Code mitwächst: richtig,
 * beruhigend und ohne Aussage.
 *
 * T-189 hat es gemessen — 21 Verstümmelungen, dreizehn Proben blind bekommen,
 * sechs nicht — und ausdrücklich abgelehnt, den Unterschied einzuebnen. Er
 * steht deshalb jetzt **in der Ausgabe**:
 *
 *  - `gemessen` — unter mindestens einer Verstümmelung blind geworden
 *    (T-189, Abschnitte 1 und 2). Dreizehn Formen.
 *  - `paarig` — kann heute nicht blind werden, **und der Grund ist gemessen**:
 *    Ein alleinstehendes Zeichenliteral, das der Leser nicht versteht,
 *    hinterlässt zwei lose Apostrophe und **keine** Anführung — es bricht
 *    nichts. Der Mechanismus dahinter (Rusts Fluchtfolgen, ein Zeichen
 *    oberhalb U+FFFF) wird von der jeweils **paarigen** Apostrophpaarung
 *    gemessen, und die beisst. Diese Proben halten die Form fest; gemessen
 *    wird an ihrem Paar. Vier Formen.
 *  - `gegenrichtung` — schützt die andere Richtung: Der Ausdruck darf nicht zu
 *    **viel** treffen. Wird er überbreit, meldet der Lauf einen falschen Alarm
 *    auf dem Bestand — also eine **rote Prüfung** statt einer blinden Probe
 *    (T-189, Verstümmelung P). Eine Form.
 *  - `offen` — unter keiner der 21 Verstümmelungen blind geworden, und ein
 *    Grund dafür ist **nicht** gemessen. Eine Form. Sie steht hier so da,
 *    damit die nächste Welle sie findet, statt sie in einer Summe zu verlieren.
 *
 * Was das **nicht** heisst: dass die sechs überflüssig wären. Die Liste
 * beantwortet die Frage „steht jede Form der Referenz da?", und dafür zählt
 * jede Form. Es heisst nur, dass ihre Zahl keine Zahl unabhängiger Messungen
 * ist — und dass die Ausgabe das jetzt sagt.
 *
 * @type {ReadonlyArray<{ name: string, label: string, head: string, expect: 'refusal' | 'callSite', bite: 'gemessen' | 'paarig' | 'gegenrichtung' | 'offen' }>}
 */
const RUST_LEXICAL_FORMS = [
  { name: 'zeichenliteral', label: "Zeichenliteral `'\"'`", expect: 'callSite', bite: 'gemessen', head: "pub const T: char = '\"';\n\n" },
  {
    name: 'zeichenliteral-unicode',
    label: "Zeichenliteral mit `\\u{…}`",
    expect: 'callSite',
    bite: 'paarig',
    head: "pub const T: char = '\\u{22}';\n\n",
  },
  {
    name: 'zeichenliteral-hex',
    label: "Zeichenliteral mit `\\x…`",
    expect: 'callSite',
    bite: 'paarig',
    head: "pub const T: char = '\\x22';\n\n",
  },
  {
    name: 'zeichenliteral-ausserhalb-bmp',
    label: 'Zeichenliteral oberhalb U+FFFF',
    expect: 'callSite',
    bite: 'paarig',
    head: "pub const T: char = '\u{1F600}';\n\n",
  },
  { name: 'byteliteral', label: "Byteliteral `b'\"'`", expect: 'callSite', bite: 'gemessen', head: "pub const B: u8 = b'\"';\n\n" },
  {
    name: 'byteliteral-hex',
    label: "Byteliteral mit `\\x…`",
    expect: 'callSite',
    bite: 'paarig',
    head: "pub const B: u8 = b'\\x22';\n\n",
  },
  { name: 'zeichenkette', label: 'Zeichenkette', expect: 'callSite', bite: 'gemessen', head: 'pub const S: &str = "a\\"b";\n\n' },
  {
    name: 'bytezeichenkette',
    label: 'Bytezeichenkette `b"…"`',
    expect: 'callSite',
    bite: 'gemessen',
    head: 'pub const S: &[u8] = b"a\\"b";\n\n',
  },
  {
    name: 'c-zeichenkette',
    label: 'C-Zeichenkette `c"…"`',
    expect: 'callSite',
    bite: 'gemessen',
    head: 'pub const S: &core::ffi::CStr = c"a\\"b";\n\n',
  },
  {
    name: 'fortsetzungszeile',
    label: 'Zeichenkette mit Fortsetzungszeile',
    expect: 'callSite',
    bite: 'offen',
    head: 'pub const S: &str = "a\\\n    b";\n\n',
  },
  { name: 'rohe-zeichenkette', label: 'rohe Zeichenkette `r#"…"#`', expect: 'refusal', bite: 'gemessen', head: 'pub const S: &str = r#"a"b"#;\n\n' },
  {
    name: 'rohe-bytezeichenkette',
    label: 'rohe Bytezeichenkette `br#"…"#`',
    expect: 'refusal',
    bite: 'gemessen',
    head: 'pub const S: &[u8] = br#"a"b"#;\n\n',
  },
  {
    name: 'rohe-c-zeichenkette',
    label: 'rohe C-Zeichenkette `cr#"…"#`',
    expect: 'refusal',
    bite: 'gemessen',
    head: 'pub const S: &core::ffi::CStr = cr#"a"b"#;\n\n',
  },
  { name: 'zeilenkommentar', label: 'Zeilenkommentar mit Anführung', expect: 'callSite', bite: 'gemessen', head: '// er sagte "\n\n' },
  { name: 'blockkommentar', label: 'Blockkommentar mit Anführung', expect: 'callSite', bite: 'gemessen', head: '/* er sagte " */\n\n' },
  {
    name: 'blockkommentar-geschachtelt',
    label: 'geschachtelter Blockkommentar',
    expect: 'callSite',
    bite: 'gemessen',
    head: NESTED_BLOCK_COMMENT + '\n',
  },
  {
    name: 'lebenszeit',
    label: 'Lebenszeit `&\'a str`',
    expect: 'callSite',
    bite: 'gegenrichtung',
    head: "pub fn erster<'a>(werte: &'a [&'a str]) -> &'a str {\n    werte[0]\n}\n\n",
  },
  {
    name: 'scheinliteral-flucht',
    label: "Apostrophpaarung `['\\u{22}','\"']`",
    expect: 'callSite',
    bite: 'gemessen',
    head: "pub const TRENNER: [char; 2] = ['\\u{22}','\"'];\n\n",
  },
  {
    name: 'scheinliteral-ausserhalb-bmp',
    label: 'Apostrophpaarung mit einem Zeichen oberhalb U+FFFF',
    expect: 'callSite',
    bite: 'gemessen',
    head: "pub const TRENNER: [char; 2] = ['\u{1F600}','\"'];\n\n",
  },
];

/**
 * Aus einer lexikalischen Form die Gegenprobe. Der Name der Quelle trägt die
 * Form, damit die Zeile im Lauf sagt, welche Form gerade nicht mehr gefangen
 * wird — und die Beisskraft wandert mit, damit die Ausgabe eine Probe, die
 * heute nicht blind werden **kann**, nicht wie eine zählt, die es kann (O-HC).
 *
 * @param {{ name: string, label: string, head: string, expect: 'refusal' | 'callSite', bite: 'gemessen' | 'paarig' | 'gegenrichtung' | 'offen' }} form
 */
function lexicalFormProbe(form) {
  const file = `kunst/form-${form.name}.rs`;
  return {
    title: `A-A-47: ${form.label}`,
    bite: form.bite,
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        { name: file, text: blindingSource(form.head, null) },
      ]);
      const needles =
        form.expect === 'refusal'
          ? [`${file} enthält eine rohe Zeichenkette`]
          : [`${file} > takt_heimlich()`, `${file} nennt die fremde Adresse https://boese.example/x`];
      const found = needles.map((needle) => findings.filter((finding) => finding.startsWith(needle)));
      return found.every((list) => list.length > 0) ? found.flat() : [];
    },
  };
}

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
    title: 'T-143 B-1: eine `shell.toml` in einem Unterordner der Fähigkeitenliste',
    run: () =>
      checkCapabilities([
        ...capabilityFiles,
        {
          name: 'zusatz/shell.toml',
          text: 'identifier = "extra"\nwindows = ["main"]\npermissions = ["shell:default"]\n',
        },
      ]),
  },
  {
    title: 'T-143 B-1: eine `.json5` mit einer Shell-Zeile',
    run: () =>
      checkCapabilities([
        ...capabilityFiles,
        { name: 'zusatz.json5', text: '{ /* Kommentar */ permissions: ["shell:allow-open"] }' },
      ]),
  },
  {
    title: 'T-136-1: ein vierter Aufrufort für `open` in einem Untermodul',
    run: () =>
      checkOpenCallSites([
        ...rustSources,
        { name: 'hilfe/mod.rs', text: 'fn f(app: AppHandle) { app.shell().open(irgendwas, None); }' },
      ]),
  },
  {
    title: 'A-A-9: ein eingetragener Aufrufort öffnet ohne seine Prüfung',
    run: () =>
      checkOpenCallSites(
        rustSources.map((source) =>
          source.name === 'attachment.rs'
            ? {
                name: source.name,
                text: source.text.replace(
                  'let checked = check_link(&url).map_err(|rejection| rejection.key().to_string())?;',
                  'let checked = Url::parse(&url).map_err(|_| "x".to_string())?;',
                ),
              }
            : source,
        ),
      ),
  },
  {
    title: 'A-A-9: die Prüfung steht da, ihr Ergebnis trägt das Öffnen aber nicht',
    run: () =>
      checkOpenCallSites(
        rustSources.map((source) =>
          source.name === 'attachment.rs'
            ? {
                name: source.name,
                text: source.text.replace(
                  'let checked = check_file(&path).map_err(|rejection| rejection.key().to_string())?;',
                  'let _ = check_file(&path);\n    let checked = Path::new(&path);',
                ),
              }
            : source,
        ),
      ),
  },
  {
    title: 'A-A-9: ein eingetragener Aufrufort verschwindet aus dem Baum',
    run: () => checkOpenCallSites(rustSources.filter((source) => source.name !== 'attachment.rs')),
  },
  {
    title: 'A-A-12: `http://127.0.0.1:17843` in img-src',
    run: () =>
      checkContentSecurityPolicy(
        configText.replace("img-src 'self' data:;", "img-src 'self' data: http://127.0.0.1:17843;"),
      ),
  },
  {
    title: 'T-143 S-2: build-app.mjs prüft ohne die Schranken der Domäne',
    run: () =>
      checkBuildVersionShape(
        buildScriptText.replace(/\/\^\[0-9\]\{1,9\}[^;]*\$\//, '/^\\d+\\.\\d+\\.\\d+$/'),
        domainVersionText,
      ),
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
    // E-082 Punkt 2, erste Hälfte: Der Ausschluss nimmt die Prüfmodule heraus
    // und **nur** sie. Dieselbe Datei, dieselbe Adresse, aber im Rumpf des
    // Befehls — das muss weiterhin auffallen.
    title: 'E-082: eine fremde Adresse im Produktivteil derselben Datei',
    run: () =>
      checkOpenCallSites(
        rustSources.map((source) =>
          source.name === 'attachment.rs'
            ? {
                name: source.name,
                text: source.text.replace(
                  'let checked = check_link(&url).map_err(|rejection| rejection.key().to_string())?;',
                  'let _fremd = "https://produktiv.example/holen";\n    ' +
                    'let checked = check_link(&url).map_err(|rejection| rejection.key().to_string())?;',
                ),
              }
            : source,
        ),
      ).filter((finding) => finding.includes('https://produktiv.example/holen')),
  },
  {
    // E-082 Punkt 2, zweite Hälfte: Die Grenze liegt an der **zugehörigen**
    // schliessenden Klammer, nicht am Dateiende. Der Verstoß steht hinter dem
    // Block; sähe der Lauf ihn nicht, reichte ein `#[cfg(test)]` am Dateianfang,
    // um den ganzen Rust-Anteil unsichtbar zu machen.
    title: 'E-082: eine fremde Adresse hinter dem `#[cfg(test)]`-Block',
    run: () =>
      checkOpenCallSites(
        rustSources.map((source) =>
          source.name === 'attachment.rs'
            ? {
                name: source.name,
                text: `${source.text}\nconst NACH_DEM_BLOCK: &str = "https://danach.example/holen";\n`,
              }
            : source,
        ),
      ).filter((finding) => finding.includes('https://danach.example/holen')),
  },
  {
    // Und die Grenze selbst, an einer Quelle mit genau den Fallen, an denen
    // eine naive Zählung scheitert: eine geschweifte Klammer in einer
    // Zeichenkette, eine in einem Kommentar, ein verschachtelter Block. Diese
    // Gegenprobe zählt in **beide** Richtungen: Sie gilt nur als bestanden,
    // wenn die Adresse hinter dem Block gefunden wird **und** keine aus dem
    // Block gemeldet ist. Eine zu kurze Grenze meldet `drin`, eine zu weite
    // verschluckt `dahinter` — beides endet hier als blinde Gegenprobe.
    title: 'E-082: der Ausschluss endet an der zugehörigen Klammer, nicht an der ersten',
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/grenze.rs',
          text:
            '#[cfg(test)]\nmod tests {\n' +
            '    const KLAMMER_IN_ZEICHENKETTE: &str = "}";\n' +
            '    // } dieselbe Klammer in einem Kommentar\n' +
            '    fn fall() {\n' +
            '        let _ = "https://drin.example/a";\n' +
            '        if true { let _ = "https://drin.example/b"; }\n' +
            '        let _ = "https://drin.example/c";\n' +
            '    }\n' +
            '}\n' +
            'const DAHINTER: &str = "https://dahinter.example/d";\n',
        },
      ]);
      if (findings.some((finding) => finding.includes('https://drin.example/'))) return [];
      return findings.filter((finding) => finding.includes('https://dahinter.example/d'));
    },
  },
  {
    // A-A-34: Die Begründung von E-082 trägt genau so weit wie die Form, auf
    // die sie sich stützt. Ein Modul unter `#[cfg(any(test, feature = "…"))]`
    // **wird** übersetzt, sobald das Merkmal gesetzt ist, und steht dann im
    // Erzeugnis. Wer den Attributausdruck darauf weitet, macht diese
    // Gegenprobe blind — und genau das ist ihr Zweck (Befund T-176-2).
    title: 'A-A-34: `#[cfg(any(test, …))]` löst den Ausschluss nicht aus',
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/merkmal.rs',
          text:
            '#[cfg(any(test, feature = "dev"))]\nmod tests {\n' +
            '    const X: &str = "https://merkmal.example/x";\n' +
            '    fn heimlich(app: AppHandle) { app.shell().open(X, None); }\n' +
            '}\n',
        },
      ]);
      const adresse = findings.filter((finding) => finding.includes('https://merkmal.example/x'));
      const aufrufort = findings.filter((finding) => finding.includes('kunst/merkmal.rs > heimlich()'));
      return adresse.length > 0 && aufrufort.length > 0 ? [...adresse, ...aufrufort] : [];
    },
  },
  {
    // A-A-38: **alle vier** Formen der rohen Zeichenkette, nicht eine. Zwei
    // Verstümmelungen haben die 25 Gegenproben von T-173-2 überlebt, weil dort
    // nur `r#"…"#` gemessen wurde: `#+` statt `#*` übersieht `r"C:\Users\…"`
    // (die Form, die T-173-2 selbst als die nächste vorhergesagt hat), und der
    // gestrichene `b?` übersieht `br#"…"#` (Befund T-183-2).
    title: 'A-A-38/A-A-41: alle sechs Formen der rohen Zeichenkette werden gemeldet',
    run: () => {
      const forms = [
        ['kunst/roh-ohne-gatter.rs', 'r"C:\\Users\\Public\\"'],
        ['kunst/roh-mit-gatter.rs', 'r#"a"b"#'],
        ['kunst/roh-byte.rs', 'br"C:\\Temp\\"'],
        ['kunst/roh-byte-gatter.rs', 'br#"a"b"#'],
        // A-A-41: die rohe C-Zeichenkette (Rust ≥ 1.77). Vor dem `r` in `cr`
        // steht ein Wortzeichen — der alte Ausdruck mit `\b` traf sie nicht,
        // und der Lauf blieb grün (Befund T-189-1).
        ['kunst/roh-c.rs', 'cr"C:\\Users\\Public\\"'],
        ['kunst/roh-c-gatter.rs', 'cr#"a"b"#'],
      ];
      const findings = checkOpenCallSites([
        ...rustSources,
        ...forms.map(([name, raw]) => ({ name, text: blindingSource('', raw) })),
      ]);
      const refusals = forms.map(([name]) =>
        findings.filter((finding) => finding.startsWith(`${name} enthält eine rohe Zeichenkette`)),
      );
      return refusals.every((found) => found.length > 0) ? refusals.flat() : [];
    },
  },
  {
    // A-A-37, erste Kunstquelle (`docs/bedrohungsmodell.md` 24.1.2): ein ganz
    // gewöhnliches Zeichenliteral `'"'` vor der rohen Zeichenkette. Bis T-183
    // öffnete es in `stripRustStrings` eine Zeichenkette, die nie zuging — die
    // Weigerung schwieg, und der vierte Aufrufort dahinter war unsichtbar.
    title: 'A-A-37: ein Zeichenliteral `\'"\'` nimmt der Weigerung nicht die Sicht',
    run: () =>
      checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/zeichenliteral.rs',
          text: blindingSource(QUOTE_CHAR_LITERAL, 'r#"a"b"#'),
        },
      ]).filter((finding) => finding.startsWith('kunst/zeichenliteral.rs enthält eine rohe Zeichenkette')),
  },
  {
    // A-A-37, zweite Kunstquelle (24.1.3): derselbe Ausgang über einen
    // geschachtelten Blockkommentar. Rust schachtelt, eine Fahne nicht.
    title: 'A-A-37: ein geschachtelter Blockkommentar nimmt ihr die Sicht ebenso wenig',
    run: () =>
      checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/kommentar.rs',
          text: blindingSource(NESTED_BLOCK_COMMENT, 'r#"a"b"#'),
        },
      ]).filter((finding) => finding.startsWith('kunst/kommentar.rs enthält eine rohe Zeichenkette')),
  },
  {
    // Und dieselben zwei Köpfe **ohne** rohe Zeichenkette: Dann greift keine
    // Weigerung, und der Lauf muss den vierten Aufrufort samt Adresse selbst
    // sehen. Das misst die beiden Behebungen dort, wo sie wirken — im Gerüst —,
    // und nicht über den Umweg der Weigerung.
    title: 'A-A-37: Zeichenliteral und geschachtelter Kommentar verstecken keinen Aufrufort',
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        { name: 'kunst/zeichenliteral-blank.rs', text: blindingSource(QUOTE_CHAR_LITERAL, null) },
        { name: 'kunst/kommentar-blank.rs', text: blindingSource(NESTED_BLOCK_COMMENT, null) },
      ]);
      const wanted = [
        'kunst/zeichenliteral-blank.rs > takt_heimlich()',
        'kunst/kommentar-blank.rs > takt_heimlich()',
        'kunst/zeichenliteral-blank.rs nennt die fremde Adresse https://boese.example/x',
        'kunst/kommentar-blank.rs nennt die fremde Adresse https://boese.example/x',
      ].map((needle) => findings.filter((finding) => finding.startsWith(needle)));
      return wanted.every((found) => found.length > 0) ? wanted.flat() : [];
    },
  },
  {
    // A-A-42, die Kunstquelle aus `docs/bedrohungsmodell.md` 25.2.2 — und der
    // schwerere der beiden Wege aus T-189: In der Datei steht **keine** rohe
    // Zeichenkette, die Weigerung kann also gar nicht greifen. `'\u{22}'` und
    // `'\x22'` sind gültige Schreibweisen des Anführungszeichens; kannte der
    // Ausdruck sie nicht, paarte sich der schließende Apostroph mit dem
    // nächsten zu einem Scheinliteral, und alles dahinter war unsichtbar.
    // Nötig ist dafür genau ein Zeichen Abstand — `cargo fmt` wird in diesem
    // Vorhaben nirgends erzwungen, auf das Leerzeichen ist kein Verlaß.
    title: 'A-A-42: Fluchtfolgen im Zeichenliteral verstecken keinen Aufrufort',
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/flucht-unicode.rs',
          text: blindingSource("pub const TRENNER: [char; 2] = ['\\u{22}','\"'];\n\n", null),
        },
        {
          name: 'kunst/flucht-hex.rs',
          text: blindingSource("pub const TRENNER: [char; 2] = ['\\x22','\"'];\n\n", null),
        },
      ]);
      const wanted = [
        'kunst/flucht-unicode.rs > takt_heimlich()',
        'kunst/flucht-hex.rs > takt_heimlich()',
        'kunst/flucht-unicode.rs nennt die fremde Adresse https://boese.example/x',
        'kunst/flucht-hex.rs nennt die fremde Adresse https://boese.example/x',
      ].map((needle) => findings.filter((finding) => finding.startsWith(needle)));
      return wanted.every((found) => found.length > 0) ? wanted.flat() : [];
    },
  },
  {
    // Dieselbe Zusage in die andere Richtung: Der erweiterte Ausdruck darf die
    // Lebenszeit nicht als Zeichenliteral lesen. Täte er es, verschöbe sich das
    // Gerüst bei jedem `&'a str` — und `attachment.rs` trägt Lebenszeiten.
    title: 'A-A-42: eine Lebenszeit bleibt kein Zeichenliteral',
    run: () => {
      const findings = checkOpenCallSites([
        ...rustSources,
        {
          name: 'kunst/lebenszeit.rs',
          text: blindingSource("pub fn erster<'a>(werte: &'a [&'a str]) -> &'a str {\n    werte[0]\n}\n\n", null),
        },
      ]);
      const wanted = [
        'kunst/lebenszeit.rs > takt_heimlich()',
        'kunst/lebenszeit.rs nennt die fremde Adresse https://boese.example/x',
      ].map((needle) => findings.filter((finding) => finding.startsWith(needle)));
      return wanted.every((found) => found.length > 0) ? wanted.flat() : [];
    },
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
    title: 'A-18.6: eine Beispieladresse außerhalb der Musterseite',
    run: () =>
      checkWebAddress(
        [
          ...webSources,
          { name: 'screens/Irgendwas.tsx', text: 'const X = "https://beispiel.invalid/x";' },
        ],
        RELEASE_TAG_PREFIX,
      ),
  },
  {
    title: 'A-18.6: eine echte Adresse auf der Musterseite',
    run: () =>
      checkWebAddress(
        [
          ...webSources,
          { name: 'showcase/Irgendwas.tsx', text: 'const X = "https://echt.example/x";' },
        ],
        RELEASE_TAG_PREFIX,
      ),
  },
  {
    title: 'A-18.6: die Release-Adresse verschwindet aus der Oberfläche',
    run: () =>
      checkWebAddress(
        webSources.map((source) => ({
          name: source.name,
          text: source.text.split(RELEASE_TAG_PREFIX).join('http://127.0.0.1:1/'),
        })),
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
  {
    title: 'A-A-49: eine angehobene `edition` in Cargo.toml',
    run: () =>
      checkRustLanguageBaseline(cargoManifestText.replace('edition = "2021"', 'edition = "2024"')),
  },
  {
    title: 'A-A-49: eine angehobene `rust-version` in Cargo.toml',
    run: () =>
      checkRustLanguageBaseline(
        cargoManifestText.replace('rust-version = "1.82"', 'rust-version = "1.90"'),
      ),
  },
  {
    title: 'A-A-49: eine Cargo.toml ohne `rust-version`',
    run: () => checkRustLanguageBaseline(cargoManifestText.replace('rust-version = "1.82"\n', '')),
  },
  // Und zuletzt die geschlossene Liste: jede lexikalische Form der Referenz,
  // in der eine Anführung vorkommen kann, mit eigener Quelle (A-A-47, E-089).
  ...RUST_LEXICAL_FORMS.map(lexicalFormProbe),
];

/**
 * Was hinter einer Probe steht, die heute nicht blind werden **kann** (O-HC).
 *
 * Eine Gegenprobe ohne Vermerk ist eine, die T-189 unter einer eingesetzten
 * Verstümmelung blind bekommen hat. Alles andere sagt es hier, statt in einer
 * Summe mitzuzählen.
 */
const BITE_NOTE = {
  paarig: 'beisst heute nicht — gemessen wird der Mechanismus an ihrem Paar (T-189-14)',
  gegenrichtung: 'beisst heute nicht — die Gegenrichtung fängt eine rote Prüfung (T-189, P)',
  offen: 'beisst heute nicht, Grund ungemessen (T-189-14) — offener Punkt',
};

process.stdout.write('\nGegenprobe — jede eingesetzte Verletzung muss auffallen:\n');
let blind = 0;
const biteCount = { gemessen: 0, paarig: 0, gegenrichtung: 0, offen: 0 };
for (const probe of counterProbes) {
  const bite = probe.bite ?? 'gemessen';
  biteCount[bite] += 1;
  const findings = probe.run();
  if (findings.length === 0) {
    blind += 1;
    process.stdout.write(`  BLIND ${probe.title}\n`);
    continue;
  }
  const note = BITE_NOTE[bite];
  process.stdout.write(`  ok    ${probe.title}${note === undefined ? '' : `\n        ↳ ${note}`}\n`);
}

if (failed > 0 || blind > 0) {
  process.stderr.write(
    `\nFEHLER: ${failed} Prüfung(en) rot, ${blind} Gegenprobe(n) blind.\n\n` +
      `Beides ist derselbe Befund in zwei Richtungen: Die Fläche der Hülle ist\n` +
      `entweder größer geworden, oder der Wächter darüber sieht sie nicht mehr.\n` +
      `Die Begründung, warum beide Zusagen keine Kleinigkeit sind, steht in\n` +
      `docs/bedrohungsmodell.md Abschnitt 18.3 und 20, und neben jedem Aufrufort:\n` +
      `${[...new Set(OPEN_CALL_SITES.map((site) => site.file))]
        .map((file) => `  ${relative(repoRoot, join(rustSrcDir, file))}`)
        .join('\n')}\n`,
  );
  process.exit(1);
}

/*
 * **Die Schlusszeile trennt, was verschieden stark ist** (O-HC, T-189-14).
 * „49 Gegenproben, 0 blind" führte eine Probe, die nachweislich blind werden
 * kann, neben einer, die es heute gar nicht kann. Wer eine Zahl liest, liest
 * sie als Zahl unabhängiger Messungen — und das war sie nie.
 */
const biteSummary =
  `Davon ${String(biteCount.gemessen)}, die blind werden können und es nicht sind; ` +
  `${String(biteCount.paarig)}, die es heute nicht können — ihr Mechanismus ist an der ` +
  `paarigen Probe gemessen; ${String(biteCount.gegenrichtung)}, deren Gegenrichtung eine ` +
  `rote Prüfung fängt; ${String(biteCount.offen)} ohne gemessenen Grund (T-189-14).`;

process.stdout.write(
  `\n${runs.length} Prüfungen und ${counterProbes.length} Gegenproben bestanden.\n` +
    `${biteSummary}\n` +
    `Die Formenliste ist gegen edition ${RUST_REFERENCE.edition} und rust-version ` +
    `${RUST_REFERENCE.rustVersion} gelesen (${RUST_REFERENCE.readWith}); ` +
    `rust-version ist die untere Schranke, nicht die Baufassung.\n` +
    `Die Fähigkeitenliste trägt keine Shell-Zeile, connect-src trägt genau die\n` +
    `${ALLOWED_CONNECT_SRC.length} zugesagten Marken, img-src bleibt bei 'self' und data:, und der\n` +
    `Rust-Anteil hat genau diese Aufruforte für \`open\`, jeden mit seiner Prüfung:\n` +
    `${OPEN_CALL_SITES.map((site) => `  ${site.file} > ${site.fn}()  →  ${site.guard}()`).join('\n')}\n`,
);
