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

/**
 * Letzte Frist beim Anhalten (B-1.6 Punkt 3, T-125-4).
 *
 * Kein Wert, der im Normalfall je abläuft. `server.closeAllConnections()`
 * räumt die Verbindungen ab, und der Rückruf von `server.close()` kommt danach
 * binnen Millisekunden; zwei Sekunden sind dafür auch auf einem ausgelasteten
 * Rechner reichlich. Der Wert ist der **Boden** darunter: Bleibt der Rückruf
 * aus einem Grund aus, an den niemand gedacht hat, endet der Dienst trotzdem,
 * statt als Prozess ohne Fenster stehen zu bleiben.
 *
 * Kurz genug, dass niemand darauf wartet; lang genug, dass der ordentliche Weg
 * ihn nie erreicht. `proof:access` Abschnitt 0e misst beides — dass angehalten
 * wird, und dass es nicht erst die Frist ist, die dafür sorgt.
 */
export const SHUTDOWN_DEADLINE_MS = 2_000;

/**
 * Wie lange der Dienst im **Betrieb** auf einen unvollständigen Anfragekopf
 * wartet (B-1.7, T-125-4 R2, T-128).
 *
 * ---------------------------------------------------------------------------
 * Der Fund, und warum er nach T-126 offen blieb
 * ---------------------------------------------------------------------------
 *
 * Ein beliebiger Prozess auf demselben Rechner kann eine TCP-Verbindung
 * aufmachen, ein halbes `GET ` schicken und dann schweigen. Er braucht dafür
 * kein Geheimnis — der Dienst hört auf 127.0.0.1 und ist damit für jeden
 * Prozess des Benutzers erreichbar (VG-1). Bis T-126 verlängerte das die
 * **Lebensdauer** des Dienstes um bis zu fünf Minuten; das ist behoben, das
 * Anhalten reißt solche Verbindungen ab.
 *
 * Was blieb, ist der **Betrieb**: Node ließ eine solche Verbindung 60 Sekunden
 * stehen (`headersTimeout`, Vorgabe), den Rumpf sogar 300 (`requestTimeout`,
 * Vorgabe). Beides sind Zahlen, die niemand für Takt gewählt hat, sondern die
 * Vorgaben eines Laufzeitsystems, das üblicherweise hinter einem Gegenlager im
 * Netz steht. Takt steht nicht dahinter: Es ist selbst das erste, was die
 * Verbindung sieht — genau der Fall, für den die Node-Beschreibung ausdrücklich
 * einen eigenen Wert empfiehlt.
 *
 * Die Zeitgrenze aus B-1.7 hilft hier nicht. `timeout(REQUEST_TIMEOUT_MS)` ist
 * Zwischenschicht und läuft erst, wenn der Kopf **vollständig** gelesen ist —
 * ein halber Kopf kommt dort nie an.
 *
 * ---------------------------------------------------------------------------
 * Warum das Herunterzusetzen hier nichts kostet
 * ---------------------------------------------------------------------------
 *
 * Jeder Aufrufer ist ein Prozess auf demselben Rechner: die eigene Oberfläche,
 * der Aufgabenbereich des Add-ins, ein Testlauf. Über die Rückschleife ist ein
 * Anfragekopf in Bruchteilen einer Millisekunde da; es gibt keine langsame
 * Mobilfunkverbindung, die fünf Sekunden brauchen könnte. Der Wert trennt
 * deshalb nichts, was jemals ankommen wollte — er trennt das, was nicht ankommen
 * **will**.
 *
 * ---------------------------------------------------------------------------
 * Warum drei Zahlen und nicht eine
 * ---------------------------------------------------------------------------
 *
 * `headersTimeout` allein wäre eine halbe Antwort, und zwar gleich zweimal:
 *
 *  1. **Der Rumpf.** Wer eine Verbindung halten will, schickt einen
 *     vollständigen Kopf mit `Content-Length` und tröpfelt dann den Rumpf. Dann
 *     greift nicht `headersTimeout`, sondern `requestTimeout` — und das steht
 *     ohne Zutun bei fünf Minuten. Nur den Kopf zu decken hieße, das Fenster zu
 *     verschieben statt es zu schließen.
 *  2. **Die Granularität.** Node prüft beide Fristen nicht laufend, sondern in
 *     einem Takt: `connectionsCheckingInterval`, Vorgabe 30 Sekunden. Ein
 *     `headersTimeout` von fünf Sekunden ohne diesen dritten Wert wäre eine
 *     Zahl, die im schlechtesten Fall erst nach 35 greift. Sie stünde im
 *     Quelltext und wäre trotzdem nicht wahr — die schlechteste Sorte
 *     Einstellung.
 *
 * Zusammen ergibt sich die Zusicherung, die `proof:access` Abschnitt 0f misst:
 * Eine Verbindung mit halbem Anfragekopf ist spätestens nach
 * `HEADERS_TIMEOUT_MS + CONNECTION_CHECK_INTERVAL_MS` weg.
 *
 * Reihenfolge, wie die Node-Beschreibung sie verlangt:
 * `headersTimeout` < `requestTimeout`. Und beide unter der Zeitgrenze aus
 * B-1.7, damit die Antwort auf eine langsame Anfrage die Trennung ist und nicht
 * ein halb gelaufener Anwendungsfall.
 */
export const HEADERS_TIMEOUT_MS = 5_000;

/**
 * Wie lange der Dienst im Betrieb auf eine **vollständige** Anfrage wartet
 * (Kopf und Rumpf), siehe {@link HEADERS_TIMEOUT_MS}.
 *
 * Der Rumpf ist auf {@link MAX_BODY_BYTES} begrenzt, also ein Megabyte. Über
 * die Rückschleife ist das eine Sache von Millisekunden; zehn Sekunden sind das
 * Tausendfache und trennen keine Anfrage, die ankommen wollte. Node antwortet
 * darauf mit 408 und schließt.
 */
export const REQUEST_RECEIVE_TIMEOUT_MS = 10_000;

/**
 * In welchem Takt Node die beiden Fristen oben überhaupt nachsieht.
 *
 * Ohne diesen Wert stünde er bei 30 Sekunden, und die fünf aus
 * {@link HEADERS_TIMEOUT_MS} wären eine Angabe ohne Wirkung. Fünf Sekunden sind
 * der Tausch: Der Takt bestimmt, wie genau die Frist greift, und er kostet
 * einen Weckruf alle fünf Sekunden. Node hängt die Ereignisschleife nicht daran
 * auf (`unref`), das Anhalten bleibt also so schnell wie in T-126 gemessen —
 * `proof:access` Abschnitt 0e mißt es weiter.
 */
export const CONNECTION_CHECK_INTERVAL_MS = 5_000;
