/**
 * Takt — der Nachweispfad (B-1.1, B-2.5, B-2.7).
 *
 * Reine Entscheidungslogik über einem Port. Kein HTTP, keine Datei, keine Uhr.
 * Mit einer Attrappe des Ports ohne laufenden Dienst prüfbar.
 *
 * Zwei Eigenschaften, die diese Datei zusichert:
 *
 * 1. **Kein `===` auf einem Geheimnis.** Verglichen wird ausschließlich über
 *    `SecretDigestPort.equalsConstantTime` auf zwei SHA-256-Abdrücken.
 * 2. **Kein früher Ausstieg.** Eine fehlende Kopfzeile, eine leere Kopfzeile,
 *    ein zu kurzer und ein falscher Wert nehmen denselben Weg: einmal hashen,
 *    beide Vergleiche durchführen, dann erst entscheiden. Es gibt keine
 *    vorgezogene Längen- oder Formprüfung (B-2.5 Punkt 2).
 */

import type { SecretDigestPort } from './crypto.ts';
import { ZERO_DIGEST } from './crypto.ts';
import type { CredentialKind } from './token.ts';

/**
 * Die Abdrücke der gerade gültigen Geheimnisse.
 *
 * Es gibt je Sorte **genau einen** gültigen Abdruck. Keine Liste, keine
 * Nachfrist, keine zweite Gültigkeit — das ist die Bedingung dafür, dass eine
 * Neuerzeugung das alte Token sofort ungültig macht (B-2.7 Punkt 1).
 */
export interface ActiveFingerprints {
  /** Dauerhaftes Add-in-Token. `null`, solange keines eingerichtet ist. */
  readonly addin: Uint8Array | null;
  /** Sitzungsgeheimnis der Hülle. Nur im Arbeitsspeicher, je Start neu. */
  readonly session: Uint8Array | null;
}

export type VerificationOutcome =
  | { readonly ok: true; readonly kind: CredentialKind }
  /**
   * Genau ein Fehlschlagsgrund. Die Antwort darf nicht verraten, ob das Token
   * fehlte, falsch war oder die falsche Länge hatte (B-2.4 Punkt 3).
   */
  | { readonly ok: false };

export function verifyCredential(
  presented: string | null,
  active: ActiveFingerprints,
  digestPort: SecretDigestPort,
): VerificationOutcome {
  // Eine fehlende Kopfzeile wird zur leeren Zeichenkette und läuft denselben
  // Weg. Kein `if (!presented) return …`.
  const material = presented ?? '';
  const candidate = digestPort.digest(material);

  // Beide Vergleiche werden **immer** ausgeführt, auch wenn der erste passt.
  // Deshalb zwei getrennte Konstanten und weiter unten ein bitweises ODER
  // statt `||` — logische Kurzschlüsse wären hier ein Zeitkanal.
  const addinMatch = digestPort.equalsConstantTime(candidate, active.addin ?? ZERO_DIGEST) ? 1 : 0;
  const sessionMatch = digestPort.equalsConstantTime(candidate, active.session ?? ZERO_DIGEST)
    ? 1
    : 0;

  if ((addinMatch | sessionMatch) === 0) {
    return { ok: false };
  }

  // Ab hier wird nur noch auf dem Vergleichsergebnis gearbeitet, nicht mehr auf
  // dem Geheimnis. Die Sitzung hat Vorrang: Sie ist das engere Recht und die
  // beiden Abdrücke sind mit überwältigender Wahrscheinlichkeit verschieden.
  return { ok: true, kind: sessionMatch === 1 ? 'session' : 'addin' };
}

/**
 * Welche Sorte Nachweis eine Route verlangt.
 *
 * `session` heißt: nur die Oberfläche in der Tauri-Hülle. Ein Add-in-Token
 * genügt dort nicht. Das ist die Trennung aus B-2.9 Punkt 3 — sie sorgt dafür,
 * dass ein entwendetes Add-in-Token weder ein neues Token erzeugen noch das
 * vorhandene austauschen kann (Aussperrangriff).
 */
export type RequiredCredential = 'any' | 'session';

export function satisfiesRequirement(kind: CredentialKind, required: RequiredCredential): boolean {
  return required === 'any' || kind === 'session';
}
