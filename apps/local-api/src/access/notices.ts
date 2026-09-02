/**
 * Takt — Sicherheitsmeldungen für die Oberfläche (B-2.4, B-2.6, B-7.2).
 *
 * Der Benutzer erfährt sonst nie, dass jemand seinen lokalen Dienst anspricht.
 * Hier stehen die wenigen Ereignisse, die er sehen soll — als Zählwerte und
 * Zeitpunkte, ohne einen einzigen Wert aus der Anfrage.
 *
 * Alles liegt im Arbeitsspeicher und ist beim nächsten Start wieder leer. Eine
 * Protokolldatei über Fehlversuche wäre eine zweite Datei mit Kundendaten-Nähe,
 * die niemand aufräumt (B-12.2).
 */

export type NoticeKind =
  /** Wiederholte Anfragen mit falschem Token (B-2.6). */
  | 'auth_failure_burst'
  /** Jemand hat ein Token in der Adresse mitgeführt (B-2.4 Punkt 1). */
  | 'token_in_url'
  /** Eine Anfrage aus einer nicht zugelassenen Herkunft (B-1.4). */
  | 'origin_rejected'
  /** Eine Anfrage an einen fremden Zielrechnernamen (B-1.3). */
  | 'host_rejected'
  /** Die Rechte an Tokenverzeichnis oder Tokendatei sind zu weit (B-2.2 Punkt 4). */
  | 'file_permissions_wide';

export interface Notice {
  readonly kind: NoticeKind;
  readonly count: number;
  readonly firstAt: string;
  readonly lastAt: string;
}

export interface NoticeBoard {
  record(kind: NoticeKind, now: Date): void;
  list(): readonly Notice[];
  clear(): void;
}

export function createNoticeBoard(): NoticeBoard {
  const entries = new Map<NoticeKind, { count: number; firstAt: string; lastAt: string }>();

  return {
    record(kind, now) {
      const at = now.toISOString();
      const existing = entries.get(kind);
      if (existing === undefined) {
        entries.set(kind, { count: 1, firstAt: at, lastAt: at });
        return;
      }
      entries.set(kind, { count: existing.count + 1, firstAt: existing.firstAt, lastAt: at });
    },

    list() {
      return [...entries.entries()].map(([kind, value]) => ({
        kind,
        count: value.count,
        firstAt: value.firstAt,
        lastAt: value.lastAt,
      }));
    },

    clear() {
      entries.clear();
    },
  };
}
