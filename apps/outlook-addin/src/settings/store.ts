/** Token und Muster bleiben im lokalen Browserprofil. `roamingSettings` würde sie ins Postfach synchronisieren.
 * Das Token darf weder protokolliert noch in URLs oder Fehlermeldungen ausgegeben werden. */

import { DEFAULT_PATTERN } from '../callnumber/catalog.ts';

/** Schlüssel im `localStorage`. Mit Vorsilbe, damit sie zuordenbar sind. */
const TOKEN_KEY = 'takt.addin.token';
const PATTERN_KEY = 'takt.addin.callNumberPattern';
const BASE_URL_KEY = 'takt.addin.baseUrl';
const LAST_OK_KEY = 'takt.addin.lastConnectedAt';

/**
 * Das Wenigste, was eine Ablage können muss.
 *
 * Ein eigener Typ statt `Storage`, damit der Nachweispfad eine Ablage im
 * Arbeitsspeicher einsetzen kann — und damit im Quelltext steht, dass hier
 * nichts weiter benutzt wird als drei Methoden.
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AddinDefaults {
  readonly statusId: string | null;
  readonly tagIds: readonly string[];
  readonly includeExcerpt: boolean;
  readonly theme: 'auto' | 'light' | 'dark';
}
export const DEFAULT_TARGET: AddinDefaults = { statusId: null, tagIds: [], includeExcerpt: false, theme: 'auto' };
const DEFAULTS_KEY = 'takt.addin.defaults';
function readDefaults(storage: KeyValueStore): AddinDefaults {
  try {
    const value = JSON.parse(storage.getItem(DEFAULTS_KEY) ?? '{}') as Partial<AddinDefaults>;
    return {
      statusId: typeof value.statusId === 'string' ? value.statusId : null,
      tagIds: Array.isArray(value.tagIds) ? value.tagIds.filter(id => typeof id === 'string') : [],
      includeExcerpt: value.includeExcerpt === true,
      theme: value.theme === 'light' || value.theme === 'dark' ? value.theme : 'auto',
    };
  } catch { return DEFAULT_TARGET; }
}
export interface AddinSettings {
  readonly defaults?: AddinDefaults;
  /** Grundadresse des lokalen Dienstes, ohne abschließenden Schrägstrich. */
  readonly baseUrl: string;
  /** Der reguläre Ausdruck aus A-10.8. Steht hier, nicht im Code. */
  readonly callNumberPattern: string;
  /** Ist ein Token hinterlegt? **Nicht** das Token selbst. */
  readonly hasToken: boolean;
  /** Zeitpunkt der letzten erfolgreichen Verbindung, ISO-8601 oder `null`. */
  readonly lastConnectedAt: string | null;
}

export interface SettingsStore {
  read(): AddinSettings;
  writeDefaults(defaults: AddinDefaults): void;
  /** Liest das Token. Der einzige Weg an den Wert — Aufrufer: der API-Client. */
  readToken(): string | null;
  writeToken(token: string): void;
  clearToken(): void;
  writePattern(pattern: string): void;
  writeBaseUrl(baseUrl: string): void;
  noteConnected(at: string): void;
}

/**
 * Grundadresse des lokalen Dienstes (T-011: fester Port 17843, B-1.5).
 *
 * Der Port ist ausdrücklich **kein** Geheimnis und darf in der Oberfläche
 * stehen. Er ist einstellbar, weil ein Benutzer, dessen Dienst nicht startet,
 * sonst keinen Weg hat, das zu sehen — nicht, weil Takt auf einem anderen Port
 * liefe.
 */
export const DEFAULT_BASE_URL = 'http://127.0.0.1:17843';

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/**
 * Nimmt eine Grundadresse an, wenn sie auf die Loopback-Adresse zeigt.
 *
 * Takt hört ausschließlich auf `127.0.0.1` (B-1.1). Eine Adresse, die
 * woandershin zeigt, wäre kein Takt — sie wäre der Ort, an den ein
 * untergeschobener Wert das Token schickte. Deshalb ist die Prüfung eine
 * Positivliste der Rechnernamen und keine Formprüfung.
 */
export const isAcceptableBaseUrl = (value: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost' || parsed.hostname === '[::1]';
};

export const createSettingsStore = (storage: KeyValueStore): SettingsStore => ({
  writeDefaults(defaults) { storage.setItem(DEFAULTS_KEY, JSON.stringify(defaults)); },
  read() {
    const storedBase = storage.getItem(BASE_URL_KEY);
    const baseUrl =
      storedBase !== null && isAcceptableBaseUrl(storedBase)
        ? stripTrailingSlash(storedBase)
        : DEFAULT_BASE_URL;

    const storedPattern = storage.getItem(PATTERN_KEY);

    return {
      baseUrl,
      defaults: readDefaults(storage),
      callNumberPattern: storedPattern ?? DEFAULT_PATTERN,
      // Nur die Tatsache, nie der Wert. Alles, was diese Funktion zurückgibt,
      // landet irgendwann in einem Zustand der Oberfläche und damit im DOM
      // (B-2.3).
      hasToken: (storage.getItem(TOKEN_KEY) ?? '').length > 0,
      lastConnectedAt: storage.getItem(LAST_OK_KEY),
    };
  },

  readToken() {
    const value = storage.getItem(TOKEN_KEY);
    return value === null || value.length === 0 ? null : value;
  },

  writeToken(token: string) {
    const trimmed = token.trim();
    if (trimmed.length === 0) {
      storage.removeItem(TOKEN_KEY);
      return;
    }
    storage.setItem(TOKEN_KEY, trimmed);
  },

  clearToken() {
    storage.removeItem(TOKEN_KEY);
  },

  writePattern(pattern: string) {
    storage.setItem(PATTERN_KEY, pattern);
  },

  writeBaseUrl(baseUrl: string) {
    storage.setItem(BASE_URL_KEY, stripTrailingSlash(baseUrl));
  },

  noteConnected(at: string) {
    storage.setItem(LAST_OK_KEY, at);
  },
});

/**
 * Beschreibt ein Token, ohne es preiszugeben (B-2.3).
 *
 * Vier Zeichen am Ende genügen, um zwei Tokens auseinanderzuhalten, und
 * genügen nicht, um eines zu erraten: 43 Zeichen base64url bleiben verdeckt.
 * Das Präfix `takt_` steht ohnehin auf jedem Takt-Token und verrät nichts.
 */
export const describeToken = (token: string | null): string => {
  if (token === null || token.length === 0) return 'nicht hinterlegt';
  const tail = token.slice(-4);
  return `hinterlegt, endet auf …${tail}`;
};

/**
 * Sieht der Wert überhaupt wie ein Takt-Token aus?
 *
 * Reine **Bedienhilfe**, keine Sicherheitsprüfung: Sie fängt den häufigen
 * Fehler ab, dass jemand einen halben Wert aus der Zwischenablage einfügt. Die
 * Entscheidung trifft der Dienst, und er antwortet auf jeden falschen Wert
 * gleich (B-2.4 Punkt 3). Diese Funktion darf deshalb auch nichts über die
 * Gültigkeit sagen — nur über die Gestalt.
 */
export const looksLikeToken = (value: string): boolean => /^takt_[A-Za-z0-9_-]{43}$/.test(value.trim());
