/**
 * Numerisch vergleichen: 0.10.0 ist neuer als 0.9.0. Installierte Vorabfassungen müssen unter der
 * zugehörigen fertigen Fassung liegen.
 * Das führende Release-Tag-Präfix wird ausschließlich über `checkVersion` entfernt.
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
 * Die vollständig geprüfte Version darf in eine feste URL eingehen; weder Pfadtrenner noch
 * URL-Steuerzeichen zulassen. Kein zustandsbehaftetes `g` verwenden.
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
 * Nur ein kleines führendes `v` entfernen; andere Schreibweisen bleiben für die folgende Prüfung
 * unverändert.
 */
function stripReleaseTagPrefix(value: string): string {
  return value.startsWith('v') ? value.slice(1) : value;
}

/** Warum ein Wert keine Fassungsbezeichnung ist. Englisch, wie jeder Schlüssel. */
export type VersionRejection = 'not_a_string' | 'empty' | 'too_long' | 'malformed';

/** Nur den geprüften Wert ohne Release-Präfix weiterverwenden, nicht die Rohfassung. */
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
 * Fremdwerte nicht trimmen: Leerraum macht die Version ungültig, statt ihre Bedeutung still zu
 * verändern.
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

/** `incomparable` darf nicht als Gleichheit oder numerische Reihenfolge behandelt werden. */
export type VersionOrder = -1 | 0 | 1 | 'incomparable';

/**
 * `checkVersion` normalisiert auf beiden Seiten das Release-Präfix; `v1.2.3` und `1.2.3` gelten
 * daher als gleich.
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

/** Auch bei `unknown` bleibt die Anzeige still; das ist kein sichtbarer Fehlerzustand. */
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
 * Nur die exakt übersprungene Fassung unterdrücken. Ein ungültiger gespeicherter Wert gilt als
 * „nichts übersprungen“.
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

// Der Streuwert auf den Mindestabstand (A-V-11, A-V-11′, T-275-8, T-279)

/**
 * Nur nach oben streuen, damit der Mindestabstand erhalten bleibt. Das entzerrt gleichzeitige
 * Wiederholungen hinter derselben Quelladresse.
 * Die Begrenzung gilt pro Prozesslauf; jeder Neustart erlaubt eine neue Anfrage.
 */
export const VERSION_CHECK_JITTER_RATIO = 0.25;

/**
 * Der Aufschlag verlängert die Frist und wird aus dem Mindestabstand berechnet.
 * @param baseMs Verbleibende oder vollständige Wartefrist.
 * @param minIntervalMs Mindestabstand, der die Spanne des Aufschlags bestimmt.
 * @param unitRandom Ziehung in [0, 1); ungültige Werte werden sicher begrenzt.
 * @returns Frist zwischen max(baseMs, 0) und dieser Basis plus dem begrenzten Aufschlag.
 */
export function versionCheckDelayWithJitter(
  baseMs: number,
  minIntervalMs: number,
  unitRandom: number,
): number {
  const base = Number.isFinite(baseMs) && baseMs > 0 ? baseMs : 0;
  const span =
    Number.isFinite(minIntervalMs) && minIntervalMs > 0
      ? minIntervalMs * VERSION_CHECK_JITTER_RATIO
      : 0;
  const unit = Number.isFinite(unitRandom) ? Math.min(Math.max(unitRandom, 0), 1) : 0;
  return base + span * unit;
}
