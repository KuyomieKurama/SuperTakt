/**
 * Takt — der einzige Ort mit einer Zufallsquelle und dem einzigen Vergleich
 * von Geheimnissen (B-2.1, B-2.5).
 *
 * Ausgehender Adapter im Sinne von architektur.md 1.1: Die Entscheidungslogik
 * in `verifier.ts` kennt nur den Port, nicht `node:crypto`. Damit lässt sich
 * der Nachweispfad mit einer Attrappe prüfen, ohne dass eine Datei, ein Dienst
 * oder ein echtes Geheimnis im Spiel ist.
 */

import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

import { TOKEN_RANDOM_BYTES } from './token.ts';

/** Länge eines SHA-256-Abdrucks in Byte. */
export const DIGEST_BYTES = 32;

export interface SecretDigestPort {
  /**
   * Erzeugt den Rumpf eines neuen Geheimnisses: 32 zufällige Byte als
   * base64url, 43 Zeichen.
   */
  generateSecretBody(): string;

  /**
   * SHA-256 über die Zeichenkette, UTF-8 kodiert.
   *
   * Der Umweg über den Abdruck ist der Grund, warum ein Vergleich mit
   * unterschiedlich langen Eingaben nicht wirft und keine Länge verrät
   * (B-2.5 Punkt 1).
   */
  digest(material: string): Uint8Array;

  /**
   * Vergleich in konstanter Zeit über zwei gleich lange Abdrücke.
   *
   * Kein `===`, kein `Buffer.compare`, kein früher Ausstieg.
   */
  equalsConstantTime(a: Uint8Array, b: Uint8Array): boolean;
}

/**
 * Ein Abdruck aus lauter Nullbytes.
 *
 * Er tritt an die Stelle eines nicht gesetzten Geheimnisses, damit der
 * Nachweispfad auch dann seinen vollen Weg geht, wenn noch gar kein Token
 * eingerichtet ist. Ein Wert, dessen SHA-256 aus 32 Nullbytes besteht, ist
 * nicht bekannt und praktisch nicht zu finden.
 */
export const ZERO_DIGEST: Uint8Array = new Uint8Array(DIGEST_BYTES);

export const nodeSecretDigest: SecretDigestPort = {
  generateSecretBody(): string {
    return randomBytes(TOKEN_RANDOM_BYTES).toString('base64url');
  },

  digest(material: string): Uint8Array {
    return new Uint8Array(createHash('sha256').update(material, 'utf8').digest());
  },

  equalsConstantTime(a: Uint8Array, b: Uint8Array): boolean {
    // Beide Seiten sind hier immer 32 Byte lang, weil beide durch `digest`
    // gelaufen sind. Die Prüfung steht trotzdem da: `timingSafeEqual` wirft bei
    // ungleicher Länge, und ein Wurf im Nachweispfad wäre ein Zeitunterschied.
    if (a.length !== DIGEST_BYTES || b.length !== DIGEST_BYTES) {
      return false;
    }
    return timingSafeEqual(a, b);
  },
};

/** Abdruck als Hexadezimalzeichenkette — die Form, in der er auf die Platte geht. */
export function digestToHex(digest: Uint8Array): string {
  return Buffer.from(digest).toString('hex');
}

/** Umkehrung. Ein unlesbarer Wert ergibt `null`, nicht einen Wurf. */
export function digestFromHex(hex: string): Uint8Array | null {
  if (hex.length !== DIGEST_BYTES * 2 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }
  return new Uint8Array(Buffer.from(hex, 'hex'));
}
