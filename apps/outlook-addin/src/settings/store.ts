/**
 * Takt — Einstellungen des Add-ins (E-009, E-019, R-09, R-12, B-2.8).
 *
 * ## Wo das Token liegt — und wo ausdrücklich nicht
 *
 * Das Token liegt im **`localStorage` der Add-in-Herkunft**. Es liegt **nicht**
 * in `Office.context.roamingSettings`.
 *
 * `roamingSettings` ist der naheliegende Ort für eine Add-in-Einstellung und
 * genau deshalb die Falle: Diese Werte werden **im Postfach gespeichert und
 * über Exchange beziehungsweise Microsoft 365 synchronisiert** (B-2.8). Das
 * Geheimnis, das sämtliche lokalen Kundendaten öffnet, verließe damit den
 * Rechner und läge in der Cloud — bei einem Produkt, dessen erste Entscheidung
 * E-001 lautet: keine Cloudanbindung. Wer Zugriff auf das Postfach hat — ein
 * Administrator, ein übernommenes Konto, ein anderes Add-in mit
 * Postfachrechten — hätte den Schlüssel.
 *
 * ## Warum hier gar kein `roamingSettings` vorkommt
 *
 * B-2.8 Punkt 2 erlaubt, **Nicht**-Geheimnisse dort abzulegen — den regulären
 * Ausdruck etwa. Takt tut es trotzdem nicht, und das ist eine Entscheidung mit
 * Grund: Sobald irgendein Wert über `roamingSettings` läuft, steht der Aufruf
 * im Quelltext, und der nächste Wert, der „auch nur eine Einstellung" ist,
 * findet den Weg von selbst. So gibt es in diesem Paket **keinen einzigen**
 * Aufruf von `roamingSettings`; der Nachweis in `scripts/proof-addin.mjs` prüft
 * das über den gesamten Quelltext.
 *
 * Der Preis ist ehrlich zu nennen: Muster und Token gelten je Rechner und
 * Browserprofil. Wer Outlook auf zwei Rechnern benutzt, richtet zweimal ein.
 * Beim Token ist das ohnehin unvermeidlich (auf dem anderen Rechner läuft ein
 * anderer Dienst mit einem anderen Token); beim Muster ist es der Preis dafür,
 * dass es diesen Aufruf nicht gibt.
 *
 * ## Was diese Datei nicht tut
 *
 * Sie schreibt das Token **nie** in eine Protokollausgabe, in eine Adresse oder
 * in eine Fehlermeldung (B-2.4). `describeToken` gibt es genau deshalb: damit
 * die Oberfläche „hinterlegt" anzeigen kann, ohne den Wert zu berühren.
 */

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

export interface AddinSettings {
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
  read() {
    const storedBase = storage.getItem(BASE_URL_KEY);
    const baseUrl =
      storedBase !== null && isAcceptableBaseUrl(storedBase)
        ? stripTrailingSlash(storedBase)
        : DEFAULT_BASE_URL;

    const storedPattern = storage.getItem(PATTERN_KEY);

    return {
      baseUrl,
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
