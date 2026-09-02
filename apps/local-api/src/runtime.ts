/**
 * Takt — der Laufzeitzustand, den die Prüfschicht braucht.
 *
 * Eine eigene Datei, weil sowohl der Zusammenbau (`composition.ts`) als auch
 * die Middleware-Kette (`http/guards.ts`) sie kennen müssen und beide sich
 * sonst gegenseitig importieren würden.
 *
 * Alles darin ist entweder unveränderlich oder ein ausdrücklich als
 * veränderlich gekennzeichnetes Feld. Es gibt keinen Dienstsucher und keine
 * globale Variable: Wer wissen will, was der Dienst anspricht, liest
 * `composition.ts` (architektur.md 1.3).
 */

import type { SecretDigestPort } from './access/crypto.ts';
import type { NoticeBoard } from './access/notices.ts';
import type { ThrottleState } from './access/throttle.ts';
import type { TokenService } from './access/token-service.ts';
import type { Logger } from './logger.ts';

export interface AccessRuntime {
  /** Port, auf dem gelauscht wird. Kein Geheimnis (B-1.5). */
  readonly port: number;
  readonly digest: SecretDigestPort;
  readonly tokens: TokenService;
  /**
   * Abdruck des Sitzungsgeheimnisses. Nur im Arbeitsspeicher, je Start neu,
   * niemals auf der Platte (`access/session-secret.ts`).
   */
  readonly sessionFingerprint: Uint8Array | null;
  /**
   * Windows-Benutzername, von der Hülle über die zweite `stdin`-Zeile gereicht
   * (E-010, E-042). Keine Benutzereingabe und keine Umgebungsvariable: Er geht
   * in den Export (A-8.5) und ist damit eine Abrechnungsgröße.
   */
  readonly windowsUser: string;
  readonly notices: NoticeBoard;
  readonly logger: Logger;
  /** Die Uhr ist ein Port, damit der Prüfpfad ohne Zeitmanipulation prüfbar ist. */
  readonly clock: () => Date;
  /** Veränderlich: Zählung der Fehlversuche (B-2.6). */
  throttle: ThrottleState;
}
