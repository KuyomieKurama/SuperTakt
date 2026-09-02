/**
 * Takt — Format, Erzeugung und Schwärzung des Zugangstokens (E-009, B-2.1).
 *
 * Diese Datei enthält **keine** Zufallsquelle und **keinen** Vergleich. Sie
 * beschreibt nur die Gestalt des Geheimnisses und wie man es aus einer Ausgabe
 * wieder herausbekommt. Die Zufallsquelle steht in `crypto.ts`, der Vergleich
 * in `verifier.ts`.
 *
 * Rein und ohne laufenden Dienst prüfbar.
 */

/**
 * Festes Präfix.
 *
 * Es ist **keine Sicherheitsmaßnahme**, sondern Fundbarkeit: Eigene
 * Geheimnisregeln in Semgrep, `gitleaks` und die Schwärzung in `logger.ts`
 * erkennen daran, dass eine Zeichenkette ein Takt-Geheimnis ist (B-2.1 Punkt 2).
 */
export const TOKEN_PREFIX = 'takt_';

/**
 * 32 Byte aus einer kryptographisch geeigneten Quelle — 256 Bit.
 *
 * Ausdrücklich nicht: `Math.random`, `Date.now`, UUID v1/v3/v5 und auch nicht
 * `randomUUID` als alleinige Quelle. 122 Bit wären vertretbar, aber die
 * Semantik „Kennung" lädt zum Protokollieren ein — ein Token ist kein
 * Bezeichner (B-2.1 Punkt 1).
 */
export const TOKEN_RANDOM_BYTES = 32;

/** base64url von 32 Byte: 43 Zeichen ohne Auffüllzeichen. */
export const TOKEN_BODY_LENGTH = 43;

/** Gesamtlänge einschließlich Präfix: 48 Zeichen. */
export const TOKEN_LENGTH = TOKEN_PREFIX.length + TOKEN_BODY_LENGTH;

/**
 * Zwei Sorten Geheimnis, zwei Lebensdauern (B-2.9 Punkt 3).
 *
 * - `addin`  — dauerhaft, liegt als Abdruck auf der Platte, der Benutzer trägt
 *              es von Hand in Outlook ein. Das ist der verwundbare Punkt (R-09).
 * - `session` — je Start neu, nur im Arbeitsspeicher, kommt über `stdin` von
 *              der Tauri-Hülle. Ein Browser kann es nicht kennen, weil es nie
 *              die Platte berührt und nie angezeigt wird.
 */
export type CredentialKind = 'addin' | 'session';

/**
 * Ein Token in Klartext. Der Marker verhindert, dass eine beliebige
 * Zeichenkette versehentlich als Token durchgereicht wird.
 */
export type SecretToken = string & { readonly __takt_secret: 'token' };

/** Setzt Präfix und Rumpf zusammen. Der Rumpf kommt aus `crypto.ts`. */
export function composeToken(base64UrlBody: string): SecretToken {
  return `${TOKEN_PREFIX}${base64UrlBody}` as SecretToken;
}

/**
 * Erkennt die **Gestalt** eines Takt-Geheimnisses.
 *
 * Nur für zwei Zwecke: die Schwärzung in Ausgaben und die Erkennung eines
 * Tokens in der Adresse (B-2.4 Punkt 1).
 *
 * **Nicht im Nachweispfad benutzen.** Eine vorgezogene Formprüfung würde die
 * Antwortzeit von der Länge der Eingabe abhängig machen und damit genau den
 * Kanal öffnen, den `verifier.ts` schließt (B-2.5 Punkt 2).
 */
export function looksLikeSecret(value: string): boolean {
  return SECRET_PATTERN_ANCHORED.test(value);
}

const SECRET_PATTERN_ANCHORED = /^takt_[A-Za-z0-9_-]{43}$/;

/**
 * Dasselbe Muster ohne Anker, für die Suche in beliebigem Text.
 *
 * Bewusst ohne verschachtelte Quantoren und ohne Alternativen mit gemeinsamem
 * Präfix — der Ausdruck läuft über Fehlertexte, und ein Ausdruck mit
 * katastrophalem Rückzugsverhalten in der Fehlerbehandlung wäre eine
 * Selbstlähmung (B-4.1, hier vorbeugend).
 */
const SECRET_PATTERN_GLOBAL = /takt_[A-Za-z0-9_-]{43}/g;

/**
 * Dasselbe Muster ohne Anker und ohne `g`-Kennzeichen, für einmalige Prüfungen
 * auf beliebigem Text — etwa die Suche nach einem Token in der Adresse.
 *
 * Ein Ausdruck mit `g` behält `lastIndex` zwischen Aufrufen und trifft dann bei
 * jeder zweiten Verwendung nicht (B-4.4). Wer diesen Ausdruck benutzt, baut
 * sich daraus einen neuen, statt ihn zu teilen.
 */
export const SECRET_SHAPE: RegExp = /takt_[A-Za-z0-9_-]{43}/;

/** Was an die Stelle eines gefundenen Geheimnisses tritt. */
export const REDACTION_MARK = 'takt_<geschwaerzt>';

/**
 * Letzte Verteidigungslinie vor jeder Ausgabe (B-2.4).
 *
 * Die erste Linie ist strukturell: `logger.ts` nimmt nur eine feste Liste von
 * Feldern entgegen, und keine Fehlerhülle trägt einen Kopfzeilenwert. Diese
 * Funktion fängt, was trotzdem durchrutscht — etwa eine Meldung der
 * Laufzeitumgebung, die eine Adresse mitführt.
 *
 * Sie ist bewusst auch auf Schlüssel und verschachtelte Werte anwendbar, damit
 * niemand sie mit `JSON.stringify` umgeht.
 */
export function redactSecrets(value: string): string {
  return value.replace(SECRET_PATTERN_GLOBAL, REDACTION_MARK);
}
