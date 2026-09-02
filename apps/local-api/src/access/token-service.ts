/**
 * Takt — Lebenslauf des Tokens (E-009, B-2.1, B-2.7).
 *
 * Hält den einen gültigen Abdruck, erzeugt neue Tokens und schreibt den
 * Zeitpunkt der letzten Verwendung fort. Alles, was Zufall oder Dateisystem
 * braucht, kommt über einen Port herein.
 *
 * **Es gibt immer genau einen gültigen Abdruck.** Keine Liste, keine Nachfrist,
 * keine zweite Gültigkeit. Eine Neuerzeugung tauscht ihn im selben Augenblick,
 * in dem die Umbenennung der Datei durchgeht — laufende Anfragen mit dem alten
 * Token schlagen ab da fehl, und das ist der Zweck der Handlung (B-2.7).
 */

import type { SecretDigestPort } from './crypto.ts';
import { digestFromHex, digestToHex } from './crypto.ts';
import type { NoticeBoard } from './notices.ts';
import { composeToken, type SecretToken } from './token.ts';
import type { TokenRecord, TokenStorePort } from './token-store.ts';

export interface TokenStatus {
  /** Ist ein Add-in-Token eingerichtet? */
  readonly configured: boolean;
  /** Zeitpunkt der Erzeugung. `null`, solange keins eingerichtet ist. */
  readonly issuedAt: string | null;
  /**
   * Zuletzt erfolgreich verwendet (B-2.7 Punkt 4). So sieht der Benutzer, ob
   * überhaupt noch jemand mit dem Token arbeitet — und ob jemand damit
   * arbeitet, von dem er nichts weiß.
   */
  readonly lastUsedAt: string | null;
  /** Wievieltes Token seit der Einrichtung. */
  readonly generation: number;
  /** Die Datei war vorhanden, aber nicht lesbar. Dann sperrt der Dienst. */
  readonly unreadable: boolean;
}

export interface TokenService {
  /** Beim Start: Abdruck aus der Datei holen und Rechte prüfen. */
  load(now: Date): Promise<void>;
  /** Der gerade gültige Abdruck des Add-in-Tokens. */
  addinFingerprint(): Uint8Array | null;
  status(): TokenStatus;
  /**
   * Erzeugt ein neues Token. Gibt den Klartext **genau einmal** heraus; er wird
   * danach weder gespeichert noch noch einmal ausgegeben.
   */
  rotate(now: Date): Promise<SecretToken>;
  /** Nach erfolgreichem Nachweis mit dem Add-in-Token. */
  noteUsed(now: Date): Promise<void>;
}

export interface TokenServiceOptions {
  readonly store: TokenStorePort;
  readonly digest: SecretDigestPort;
  readonly notices: NoticeBoard;
  /** Wie oft der Zeitpunkt der letzten Verwendung höchstens auf die Platte geht. */
  readonly lastUsedPersistIntervalMs: number;
}

export function createTokenService(options: TokenServiceOptions): TokenService {
  let record: TokenRecord | null = null;
  let fingerprint: Uint8Array | null = null;
  let unreadable = false;
  let lastPersistedAt = 0;
  let writeChain: Promise<unknown> = Promise.resolve();

  /**
   * Schreibvorgänge laufen nacheinander. Zwei gleichzeitige Neuerzeugungen
   * würden sonst zwei Tokens erzeugen, von denen der Benutzer eines angezeigt
   * bekommt und das andere gilt.
   */
  function serialize<T>(work: () => Promise<T>): Promise<T> {
    const next = writeChain.then(work, work);
    writeChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  function apply(next: TokenRecord): void {
    record = next;
    fingerprint = digestFromHex(next.fingerprint);
  }

  return {
    async load(now: Date): Promise<void> {
      const read = await options.store.read();
      if (read.status === 'ok') {
        apply(read.record);
        unreadable = false;
      } else if (read.status === 'unreadable') {
        record = null;
        fingerprint = null;
        unreadable = true;
      } else {
        record = null;
        fingerprint = null;
        unreadable = false;
      }

      const permissions = await options.store.inspectPermissions();
      if (permissions.dirTooPermissive || permissions.fileTooPermissive) {
        // Sichtbar warnen statt still weiterarbeiten (B-2.2 Punkt 4).
        options.notices.record('file_permissions_wide', now);
      }
    },

    addinFingerprint(): Uint8Array | null {
      return fingerprint;
    },

    status(): TokenStatus {
      if (record === null) {
        return {
          configured: false,
          issuedAt: null,
          lastUsedAt: null,
          generation: 0,
          unreadable,
        };
      }
      return {
        configured: true,
        issuedAt: record.issuedAt,
        lastUsedAt: record.lastUsedAt,
        generation: record.generation,
        unreadable: false,
      };
    },

    async rotate(now: Date): Promise<SecretToken> {
      return serialize(async () => {
        const token = composeToken(options.digest.generateSecretBody());
        const next: TokenRecord = {
          version: 1,
          algorithm: 'sha256',
          fingerprint: digestToHex(options.digest.digest(token)),
          issuedAt: now.toISOString(),
          lastUsedAt: null,
          generation: (record?.generation ?? 0) + 1,
        };

        // Erst schreiben, dann umschalten. Scheitert das Schreiben, bleibt das
        // alte Token gültig — ein stiller Wechsel ohne Datei würde das Add-in
        // beim nächsten Start aussperren.
        await options.store.write(next);
        apply(next);
        unreadable = false;
        lastPersistedAt = now.getTime();
        return token;
      });
    },

    async noteUsed(now: Date): Promise<void> {
      if (record === null) {
        return;
      }
      const stamp = now.toISOString();
      record = { ...record, lastUsedAt: stamp };

      // Im Arbeitsspeicher sofort, auf der Platte höchstens im eingestellten
      // Abstand. Sonst schriebe jede Anfrage eine Datei.
      if (now.getTime() - lastPersistedAt < options.lastUsedPersistIntervalMs) {
        return;
      }
      lastPersistedAt = now.getTime();
      const snapshot = record;
      await serialize(async () => {
        // Zwischen Aufnahme und Schreiben kann eine Neuerzeugung gelaufen sein.
        // Dann ist der Schnappschuss veraltet und würde das frische Token
        // überschreiben — also den alten Abdruck wieder gültig machen.
        if (record === null || record.fingerprint !== snapshot.fingerprint) {
          return;
        }
        await options.store.write(snapshot);
      }).catch(() => {
        // Ein misslungener Fortschreibungsversuch darf keine Anfrage kippen.
        // Der Wert im Arbeitsspeicher bleibt richtig, die Platte hinkt.
      });
    },
  };
}
