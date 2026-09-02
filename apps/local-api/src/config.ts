/**
 * Takt — feste Betriebswerte des lokalen Dienstes (T-011).
 *
 * Alles in dieser Datei ist **im Code festgelegt und zur Laufzeit nicht
 * änderbar**. Das ist Absicht, nicht Bequemlichkeit: B-1.1 Punkt 3 verlangt,
 * dass die Bindeadresse nicht aus Konfiguration oder Umgebungsvariable
 * ableitbar ist, und B-1.6 Punkt 1, dass der Sidecar in der Produktionsfassung
 * keine Argumente für Bindeadresse, Datenbankpfad oder Tokenpfad kennt.
 *
 * Wer hier einen Schalter einbaut, hebt beide Gegenmittel auf.
 */

/**
 * Bindeadresse. Buchstäblich `127.0.0.1`.
 *
 * Nicht `localhost` (löst je nach System zusätzlich auf `::1` auf und unter
 * manchen Konfigurationen auf `0.0.0.0`), nicht `::`, nicht `0.0.0.0`.
 */
export const BIND_ADDRESS = '127.0.0.1' as const;

/**
 * Fester Vorgabeport (B-1.5).
 *
 * Ausdrücklich **kein Geheimnis**. Ein zufälliger Port ist keine
 * Sicherheitsmaßnahme — eine Webseite klopft einige tausend Loopback-Ports in
 * Sekunden ab, und ein lokaler Prozess sieht die offenen Ports ohnehin. Der
 * Schutz kommt aus Herkunftsprüfung und Token, nicht aus der Portnummer.
 *
 * Der Port darf in Fehlermeldungen erscheinen. Das Token nicht (B-2.4).
 */
export const DEFAULT_PORT = 17843;

/**
 * Port des Aufgabenbereichs (E-046).
 *
 * Ein **zweiter** Port, ausschließlich HTTPS und ausschließlich statische
 * Dateien. Die API bleibt auf 17843 mit ihrer Prüfschicht — der
 * Aufgabenbereich braucht keine Prüfung, weil dort nichts liegt, was nicht
 * ohnehin im Bündel des Add-ins steht.
 *
 * Warum nicht derselbe Port: Der Webview der Tauri-Hülle spricht die API über
 * `http://127.0.0.1:17843` an (E-043). Legte man die API auf HTTPS, verweigerte
 * er wegen des selbst erzeugten Zertifikats. Zwei Ports lösen das, ohne dass
 * jemand ein Zertifikat in einen Speicher legen muss, damit die Anwendung
 * überhaupt startet.
 */
export const TASKPANE_PORT = 17844;

/** Grundpfad aller Routen (architektur.md 5.1). */
export const API_BASE_PATH = '/api/v1';

/** Name der Kopfzeile, in der das Token steht. */
export const TOKEN_HEADER = 'X-Takt-Token';

/**
 * Positivliste für die `Host`-Kopfzeile (B-1.3).
 *
 * Buchstäblich, ohne Platzhalter. Das ist das wirksame Gegenmittel gegen
 * DNS-Rebinding: Der Browser trägt den vom Angreifer gewählten Namen in `Host`
 * ein, auch wenn dieser Name auf 127.0.0.1 zeigt.
 */
export function allowedHosts(port: number): readonly string[] {
  return Object.freeze([`127.0.0.1:${port}`, `localhost:${port}`]);
}

/**
 * Positivliste der Herkünfte (B-1.4).
 *
 * Zeichengleichheit der vollständigen Herkunft. Kein Platzhalter, kein
 * Zurückspiegeln, kein `startsWith` — `https://tauri.localhost.evil.example`
 * bestünde eine Präfixprüfung.
 *
 * `null` als Zeichenkette (Herkunft aus einem `sandbox`-Rahmen oder nach einer
 * Umleitung) steht bewusst **nicht** in der Liste.
 */
export const ALLOWED_ORIGINS: readonly string[] = Object.freeze([
  // Tauri-Webview. Beide Schreibweisen, weil die Hülle je nach Betriebssystem
  // eine andere Herkunft benutzt. In T-008b im Auslieferungsbau gemessen und
  // nicht mehr geraten: `tauri://localhost`.
  //
  // `https://tauri.localhost` stand hier und ist mit E-043 gestrichen. Diese
  // Schreibweise entsteht ausschließlich mit `app.windows[].useHttpsScheme =
  // true` in `apps/desktop/src-tauri/tauri.conf.json`, und **dieser Schalter
  // darf nicht auf `true`**: Der Webview verweigert dann wegen gemischter
  // Inhalte jede Anfrage an `http://127.0.0.1:17843`, und die Anwendung lädt
  // gar nichts mehr. Der Eintrag konnte im Betrieb also nie vorkommen — und
  // ein Eintrag in einer Positivliste, den niemand auslöst, ist keine Vorsorge,
  // sondern eine offene Tür, an die sich niemand mehr erinnert.
  //
  // Wer `useHttpsScheme` doch umlegt, muss die Herkunft hier bewusst wieder
  // aufnehmen. Genau dieser Zwang ist der Sinn der Streichung.
  'http://tauri.localhost',
  'tauri://localhost',

  // Die Oberfläche im Entwicklungsbetrieb (Vite, apps/web). Sie läuft auf
  // demselben Rechner und derselben Loopback-Adresse.
  'http://127.0.0.1:5173',
  'http://localhost:5173',

  // Die Herkunft des Outlook-Aufgabenbereichs (E-046, T-019 Annahme 1).
  //
  // Ein Office-Add-in lädt seinen Aufgabenbereich ausschließlich über HTTPS.
  // Ausgeliefert wird er vom Dienst selbst, auf einem zweiten Port neben der
  // API — siehe `TASKPANE_PORT` unten und `taskpane/`. Die Portnummer liegt
  // unmittelbar neben der des Dienstes, damit beide als Paar erkennbar sind.
  //
  // `localhost` und nicht `127.0.0.1`: Das Zertifikat lautet auf diesen Namen,
  // und die Herkunft einer Seite ist, was in ihrer Adresse steht.
  'https://localhost:17844',
]);

/**
 * Höchstgröße eines Anfragerumpfs (B-1.7). Für Notizfelder reichlich.
 */
export const MAX_BODY_BYTES = 1024 * 1024;

/** Zeitgrenze je Anfrage (B-1.7). */
export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Ratenbegrenzung auf den **fehlgeschlagenen** Nachweis (B-2.6). Erfolgreiche
 * Anfragen werden nicht begrenzt: Takt ist ein Einbenutzerdienst, und eine
 * Begrenzung auf den Normalfall würde nur die Oberfläche behindern.
 */
export const AUTH_FAILURE_WINDOW_MS = 60_000;
export const AUTH_FAILURE_THRESHOLD = 10;
export const AUTH_FAILURE_MAX_DELAY_MS = 2_000;

/**
 * Wie oft der Zeitpunkt der letzten Verwendung höchstens auf die Platte geht
 * (B-2.7 Punkt 4). Im Arbeitsspeicher ist er sofort aktuell.
 */
export const LAST_USED_PERSIST_INTERVAL_MS = 60_000;

/** Wartezeit auf das Startgeheimnis der Hülle über `stdin` (B-1.6 Punkt 2). */
export const SESSION_SECRET_TIMEOUT_MS = 5_000;
