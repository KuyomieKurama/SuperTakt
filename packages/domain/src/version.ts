/**
 * Takt — die Ordnung der Fassungen (A-18.4, A-18.5, A-18.10, E-064 Punkt 3,
 * E-066 Punkt 3, A-V-8, A-V-9).
 *
 * ---------------------------------------------------------------------------
 * Warum diese Regel hier steht und nirgends sonst
 * ---------------------------------------------------------------------------
 *
 * Sie entscheidet, ob dem Benutzer eine neue Fassung gemeldet wird — und damit,
 * ob er einen Knopf sieht, bei dem er darauf eingestellt ist, eine **unsignierte**
 * Datei zu holen und auszuführen (B-18.2). Sie wird an drei Stellen gebraucht:
 * im Dienst (die Antwort von GitHub wird geprüft, bevor irgendetwas mit ihr
 * geschieht), in der Oberfläche (dort liegt die installierte Fassung, E-069)
 * und in den Prüfläufen. Dieselbe Begründung wie bei der Rundung und der
 * Call-Nummer: **einmal**, in der Domäne, von allen Seiten aufgerufen, statt
 * dreimal nachgebaut.
 *
 * Kein HTTP, kein SQL, keine Uhr, kein Dateisystem, keine Fremdbibliothek
 * (A-V-Zulieferung, B-18.7): zwei Zeichenketten herein, ein benannter Wert
 * heraus. Ohne laufenden Dienst prüfbar.
 *
 * ---------------------------------------------------------------------------
 * Warum kein Zeichenkettenvergleich
 * ---------------------------------------------------------------------------
 *
 * `'0.10.0' < '0.9.0'` ist als Zeichenkette **wahr** — `1` steht vor `9`. Ein
 * `localeCompare`, ein `<` oder ein `sort()` ohne Vergleichsfunktion meldet
 * damit „bereits aktuell", während eine neuere Fassung vorliegt. Das ist der
 * Fall, den A-18.4 ausdrücklich ausschließt und den TP-VER-15 misst.
 *
 * ---------------------------------------------------------------------------
 * Warum die Vorabfassung mitgeordnet wird, obwohl GitHub keine liefert
 * ---------------------------------------------------------------------------
 *
 * `releases/latest` nimmt Entwürfe und Vorabfassungen von sich aus aus (E-066
 * Punkt 2). Die **installierte** Fassung darf trotzdem eine sein — wer
 * `1.2.0-rc.1` fährt, muss `1.2.0` gemeldet bekommen. Ohne die Regel
 * „Vorabfassung steht unter der gleichnamigen Fassung" (SemVer, Vorrang)
 * sähen beide gleich aus, und die fertige Fassung erschiene nie (E-066
 * Punkt 3, TP-VER-20).
 *
 * ---------------------------------------------------------------------------
 * Das führende `v` wird an **genau einer** Stelle abgeschnitten
 * ---------------------------------------------------------------------------
 *
 * Ein Etikett einer Veröffentlichung heißt `v1.2.3`, die Fassung heißt `1.2.3`.
 * Das `v` gehört zur Bezeichnung der Veröffentlichung, nicht zur Fassung
 * (E-066 Punkt 3). Es fällt in {@link stripReleaseTagPrefix}, und diese
 * Funktion wird ausschließlich von {@link checkVersion} gerufen. Jeder
 * Aufrufer — der Dienst, die Oberfläche, die Tür der Einstellung — geht durch
 * `checkVersion`. Damit gibt es einen Ort, an dem geschnitten wird, und keinen
 * zweiten, der es anders täte.
 */

/**
 * Höchstwert einer Kernkomponente (A-V-9).
 *
 * Neun Ziffern, damit jede Komponente im genauen Bereich von `Number` bleibt.
 * Eine Fassungskomponente mit dreißig Ziffern ist keine Fassung, sondern eine
 * Eingabe, die den Vergleich unterlaufen soll (B-18.1 Punkt 3).
 */
export const VERSION_MAX_COMPONENT = 999_999_999;

/**
 * Längste zulässige Fassungsbezeichnung **ohne** führendes `v`.
 *
 * 9 + 1 + 9 + 1 + 9 + 1 + 64 = 94. Der Wert ist die Summe der Schranken aus
 * {@link VERSION_SHAPE} und steht hier ausgeschrieben, damit eine Tür ihn
 * prüfen kann, bevor sie einen 60 000 Zeichen langen Wert überhaupt einem
 * regulären Ausdruck vorlegt.
 */
export const VERSION_MAX_LENGTH = 94;

/**
 * Die Form einer Fassungsbezeichnung (A-V-8), angewandt **ohne** führendes `v`.
 *
 * Drei Zahlen, dazu eine Vorabkennung. Jede Komponente ist in der Länge
 * gebunden; ohne die Schranken wäre der Ausdruck unbegrenzt und die Prüfung
 * eine Einladung.
 *
 * Der Zeichenvorrat ist zugleich die Zusicherung, aus der die Hülle ihre
 * Adresse bauen darf: `0-9`, `A-Z`, `a-z`, `.` und `-`. **Nicht** enthalten und
 * damit nicht möglich sind `/`, `\`, `?`, `#`, `:`, `@`, `%`, Leerzeichen und
 * Zeilenumbruch (B-18.2). Ein Punktsegment kann nicht entstehen, weil jede
 * Kernkomponente mit einer Ziffer beginnt.
 *
 * Anker auf beiden Seiten: Ein Treffer meint die **ganze** Zeichenkette und
 * nicht ein Stück davon. Kein `g`, damit `lastIndex` zwischen zwei Aufrufen
 * nichts merkt (dieselbe Falle wie in `call-number.ts`).
 */
export const VERSION_SHAPE = /^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$/;

/**
 * Dieselbe Form **mit** erlaubtem führendem `v` — für Türen, die einen Wert
 * ablehnen müssen, bevor die Domäne ihn zu sehen bekommt.
 *
 * Sie ist kein zweiter Schnitt: Sie schneidet nichts ab, sie lässt das `v` nur
 * stehen. Wer den Wert **benutzen** will, geht weiterhin durch
 * {@link checkVersion} und bekommt ihn ohne `v` zurück.
 */
export const RELEASE_TAG_SHAPE = /^v?[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$/;

/**
 * Schneidet ein einzelnes führendes `v` ab. **Die einzige Stelle im ganzen
 * Vorhaben, an der das geschieht** (E-066 Punkt 3).
 *
 * Nur ein kleines `v` und nur eines: `vv1.2.3` bleibt `v1.2.3` und fällt danach
 * an der Form durch. Ein großes `V` ist kein Etikett dieses Bestands
 * (`release.yml` erzeugt `v` klein) und wird deshalb nicht stillschweigend
 * mitgemeint.
 */
function stripReleaseTagPrefix(value: string): string {
  return value.startsWith('v') ? value.slice(1) : value;
}

/** Warum ein Wert keine Fassungsbezeichnung ist. Englisch, wie jeder Schlüssel. */
export type VersionRejection = 'not_a_string' | 'empty' | 'too_long' | 'malformed';

/**
 * Eine geprüfte Fassung, zerlegt.
 *
 * `value` ist die Bezeichnung **ohne** führendes `v` — genau der Wert, den ein
 * Aufrufer weiterverwenden soll. Die Hülle setzt ihn in ihre feste Adresse ein
 * (A-V-16), die Oberfläche zeigt ihn an, die Einstellung speichert ihn. Wer
 * stattdessen die Rohfassung nähme, hätte je nach Herkunft `v1.2.3` oder
 * `1.2.3` in derselben Spalte stehen und fände das eine nicht neben dem
 * anderen.
 */
export interface ParsedVersion {
  /** Ohne führendes `v`. */
  readonly value: string;
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  /**
   * Die Bezeichner der Vorabkennung, an `.` zerlegt. Leer, wenn es keine gibt.
   * `1.2.3-rc.1` ergibt `['rc', '1']`.
   */
  readonly prerelease: readonly string[];
}

/**
 * Ergebnis der Prüfung. Ein benannter Wert, **kein Wurf** und kein `null`, über
 * das der Aufrufer raten müsste (A-18.11, TP-VER-23).
 *
 * Der Grund für „kein Wurf": Der Aufrufer im Dienst ist der Zweig, der eine
 * fremde Antwort auswertet. Ein Wurf dort wäre die unerwartete Antwort aus
 * A-18.11 als **Absturz** statt als stillem Fehlschlag.
 */
export type VersionCheck =
  | { readonly ok: true; readonly version: ParsedVersion }
  | { readonly ok: false; readonly reason: VersionRejection };

/**
 * Ist dieser Wert eine brauchbare Fassungsbezeichnung?
 *
 * Nimmt `unknown` entgegen, weil der Wert aus einer fremden JSON-Antwort, aus
 * einem Anfragerumpf oder aus einer Spalte des Bestands stammt. Ein Typ am Rand
 * ist eine Behauptung, keine Prüfung (dieselbe Begründung wie bei
 * `checkCallNumber`).
 *
 * Es wird **nicht** beschnitten: `' 1.2.3'` ist `malformed` und nicht still
 * `1.2.3`. Ein Wert mit Leerzeichen ist nicht der Wert, den der Erzeuger
 * vergeben hat, und eine zweite Meinung darüber, was „eigentlich gemeint war",
 * ist genau die Lücke, aus der ein anderer Wert in eine Adresse gerät.
 */
export function checkVersion(value: unknown): VersionCheck {
  if (typeof value !== 'string') return { ok: false, reason: 'not_a_string' };
  if (value.length === 0) return { ok: false, reason: 'empty' };

  // Die Länge zuerst. Der Ausdruck unten ist linear und ohne Verschachtelung,
  // aber eine Zeichenkette mit 60 000 Zeichen (B-18.1 Punkt 3) gar nicht erst
  // durchzusehen ist billiger als sie abzuweisen.
  const bare = stripReleaseTagPrefix(value);
  if (bare.length > VERSION_MAX_LENGTH) return { ok: false, reason: 'too_long' };
  if (bare.length === 0) return { ok: false, reason: 'empty' };
  if (!VERSION_SHAPE.test(bare)) return { ok: false, reason: 'malformed' };

  const dash = bare.indexOf('-');
  const core = dash === -1 ? bare : bare.slice(0, dash);
  const tail = dash === -1 ? '' : bare.slice(dash + 1);
  const parts = core.split('.');

  // Die drei Komponenten sind durch die Form auf höchstens neun Ziffern
  // begrenzt und liegen damit im genauen Bereich von `Number`.
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  const patch = Number(parts[2]);

  return {
    ok: true,
    version: {
      value: bare,
      major,
      minor,
      patch,
      prerelease: tail === '' ? [] : tail.split('.'),
    },
  };
}

/** Kurzform für Türen, die nur „taugt oder taugt nicht" wissen wollen. */
export function isVersion(value: unknown): boolean {
  return checkVersion(value).ok;
}

/**
 * Die Fassungsbezeichnung ohne führendes `v` — oder `null`.
 *
 * Für die Stelle, an der ein gespeicherter oder empfangener Wert **normalisiert**
 * weitergereicht wird und ein unbrauchbarer Wert schlicht „nichts" bedeutet
 * (T-136-4: ein ungültiger gespeicherter Wert heißt „nichts übersprungen").
 */
export function normalizeVersion(value: unknown): string | null {
  const check = checkVersion(value);
  return check.ok ? check.version.value : null;
}

/**
 * Ergebnis eines Vergleichs.
 *
 * `'incomparable'` ist ein **benannter** Ausgang und kein `null`: Der Aufrufer
 * soll nicht raten müssen, ob `null` „gleich", „unbekannt" oder „Fehler"
 * heißt, und er soll ihn nicht mit `0` verwechseln können. `-1 | 0 | 1` sind
 * Zahlen, `'incomparable'` ist es nicht — ein `if (order < 0)` kann damit nicht
 * versehentlich für einen unbrauchbaren Wert zutreffen.
 */
export type VersionOrder = -1 | 0 | 1 | 'incomparable';

/**
 * Vergleicht zwei Fassungen nach dem Vorrang von SemVer.
 *
 * `-1`: `a` steht unter `b`. `0`: gleich. `1`: `a` steht über `b`.
 * `'incomparable'`: mindestens eine Seite ist keine Fassungsbezeichnung.
 *
 * Ein führendes `v` fällt auf beiden Seiten (über `checkVersion`), `1.2.3` und
 * `v1.2.3` sind deshalb gleich (TP-VER-18).
 */
export function compareVersions(a: unknown, b: unknown): VersionOrder {
  const left = checkVersion(a);
  const right = checkVersion(b);
  if (!left.ok || !right.ok) return 'incomparable';
  return comparePrecedence(left.version, right.version);
}

/**
 * Der Vorrang zweier bereits geprüfter Fassungen.
 *
 * Getrennt von {@link compareVersions}, weil der Dienst und die Oberfläche
 * mitunter schon geprüfte Werte in der Hand halten und ein zweiter Durchlauf
 * durch die Form nichts hinzufügte.
 */
export function comparePrecedence(a: ParsedVersion, b: ParsedVersion): -1 | 0 | 1 {
  const core =
    compareNumbers(a.major, b.major) || compareNumbers(a.minor, b.minor) || compareNumbers(a.patch, b.patch);
  if (core !== 0) return core;

  // SemVer, Vorrang: Eine Fassung **mit** Vorabkennung steht unter derselben
  // Fassung ohne. Ohne diese Zeile meldete sich `1.2.3` gegenüber installiertem
  // `1.2.3-rc.1` nie (A-V-9, TP-VER-20).
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const shared = Math.min(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < shared; index += 1) {
    const step = compareIdentifiers(a.prerelease[index] ?? '', b.prerelease[index] ?? '');
    if (step !== 0) return step;
  }

  // Sind alle gemeinsamen Bezeichner gleich, gewinnt die längere Kennung.
  return compareNumbers(a.prerelease.length, b.prerelease.length);
}

/**
 * Zwei Bezeichner einer Vorabkennung.
 *
 * SemVer: rein numerische Bezeichner werden **numerisch** verglichen und stehen
 * unter allen anderen; alles Übrige wird nach ASCII verglichen. Daraus folgt
 * `beta.2 < beta.10` — der Ziffernlängenfall aus TP-VER-21, der einen
 * Zeichenkettenvergleich auch innerhalb der Kennung scheitern lässt.
 */
function compareIdentifiers(a: string, b: string): -1 | 0 | 1 {
  const aNumeric = isDigits(a);
  const bNumeric = isDigits(b);
  if (aNumeric && bNumeric) return compareDigitStrings(a, b);
  if (aNumeric) return -1;
  if (bNumeric) return 1;
  return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Vergleicht zwei Ziffernfolgen **ohne** `Number`.
 *
 * Die Vorabkennung darf bis zu 64 Zeichen tragen; `Number('1'.repeat(30))`
 * verlässt den genauen Bereich und machte zwei verschiedene Fassungen gleich.
 * Führende Nullen fallen vorher — SemVer verbietet sie, die Form aus A-V-8
 * lässt sie durch, und `007` soll dasselbe bedeuten wie `7`.
 */
function compareDigitStrings(a: string, b: string): -1 | 0 | 1 {
  const left = a.replace(/^0+(?=\d)/, '');
  const right = b.replace(/^0+(?=\d)/, '');
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  return left === right ? 0 : left < right ? -1 : 1;
}

function isDigits(value: string): boolean {
  return value.length > 0 && !/\D/.test(value);
}

function compareNumbers(a: number, b: number): -1 | 0 | 1 {
  return a === b ? 0 : a < b ? -1 : 1;
}

/**
 * Warum **nicht** gemeldet wird (A-18.5, A-18.10, E-064 Punkt 3).
 *
 *   `unknown`     Es liegt keine brauchbare Angabe vor — noch nichts geprüft,
 *                 die Antwort war unbrauchbar, oder die installierte Fassung
 *                 ist keine. Ausdrücklich **kein** Fehlerzustand: Der Aufrufer
 *                 zeigt dasselbe wie bei `up_to_date`, nämlich nichts
 *                 (A-18.11).
 *   `up_to_date`  Die veröffentlichte Fassung steht nicht über der
 *                 installierten. Deckt „gleich" und „installiert ist neuer"
 *                 ab; beides führt zu Stille (TP-VER-08, TP-VER-09).
 *   `skipped`     Neuer, aber genau diese Fassung hat der Benutzer
 *                 übersprungen (A-18.10).
 */
export type UpdateNoticeSuppression = 'unknown' | 'up_to_date' | 'skipped';

/**
 * Ob und mit welcher Fassung sich Takt meldet.
 *
 * Im Meldefall trägt das Ergebnis die Fassung **ohne** führendes `v` — genau
 * der Wert, der in den Öffnen-Befehl der Hülle geht (A-V-16) und der beim
 * Überspringen gespeichert wird. So kann keine Fläche eine andere Schreibweise
 * weiterreichen als die, über die entschieden wurde.
 */
export type UpdateNotice =
  | { readonly show: true; readonly version: string }
  | { readonly show: false; readonly reason: UpdateNoticeSuppression };

export interface UpdateNoticeInput {
  /** Die installierte Fassung. Kommt aus den Angaben des Erzeugnisses (A-V-15). */
  readonly installed: unknown;
  /** Die zuletzt von GitHub gemeldete Fassung, oder `null`, solange nichts geprüft ist. */
  readonly latest: unknown;
  /** Die übersprungene Fassung aus dem Bestand (A-18.10). Benutzereingabe (T-136-4). */
  readonly skipped?: unknown;
}

/**
 * Die Regel, wann überhaupt etwas erscheint: **neuer und nicht übersprungen**
 * (E-064 Punkt 3).
 *
 * Sie steht hier und nicht in der Oberfläche, weil sie sonst dreimal stünde —
 * einmal im Dialog, einmal in der Kopfleiste und einmal in dem Prüffall, der
 * beides messen soll. Und weil ihre beiden Hälften verschieden aussehen und
 * dieselbe Wirkung haben: Wer nur „neuer" prüft, hat einen Hinweis gebaut, den
 * man nicht loswird (R-20); wer nur „nicht übersprungen" prüft, hat ihn
 * abgeschaltet.
 *
 * **Übersprungen wird genau eine Fassung, nicht die Prüfung.** Verglichen wird
 * auf Gleichheit und nicht auf „kleiner oder gleich": Eine später erschienene,
 * höhere Fassung meldet sich wieder (A-18.10, TP-VER-12). Ein unbrauchbarer
 * gespeicherter Wert heißt „nichts übersprungen" und führt zu keinem Wurf
 * (T-136-4).
 */
export function decideUpdateNotice(input: UpdateNoticeInput): UpdateNotice {
  const installed = checkVersion(input.installed);
  const latest = checkVersion(input.latest);
  if (!installed.ok || !latest.ok) return { show: false, reason: 'unknown' };

  if (comparePrecedence(latest.version, installed.version) <= 0) {
    return { show: false, reason: 'up_to_date' };
  }

  const skipped = checkVersion(input.skipped);
  if (skipped.ok && comparePrecedence(latest.version, skipped.version) === 0) {
    return { show: false, reason: 'skipped' };
  }

  return { show: true, version: latest.version.value };
}
