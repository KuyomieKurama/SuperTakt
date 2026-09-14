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
 *
 * **Die eine Einfuhr in dieser Datei** ist die Fachgrenze der Anhangssumme aus
 * `@takt/domain`. Sie steht hier nicht, weil eine Grenze des Dienstes aus der
 * Domäne käme, sondern damit die Rumpfgrenze dieser einen Route **aus** ihr
 * gerechnet wird statt daneben zu stehen (A-A-100). Eine Zahl, die eine andere
 * voraussetzt und sie nicht nennt, wandert irgendwann allein.
 */

import { MAX_EMAIL_ATTACHMENT_TOTAL_BYTES } from '@takt/domain';

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

/** Höchstgröße eines gewöhnlichen Anfragerumpfs (B-1.7). Für Notizfelder reichlich. */
export const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Fremdimporte (Todoist-CSV, Super-Productivity-JSON) — Text, keine Binärdaten.
 *
 * 64 MB, unverändert seit A-20.7. Ein Fremdbackup trägt Titel, Vermerke, Tags
 * und Zeitstempel; eingebettete Bytes kennt keines der beiden Formate. Wo diese
 * Zahl vorher **auch** für das eigene Archiv galt, gilt jetzt
 * {@link DATA_ARCHIVE_MAX_BODY_BYTES} — siehe dort, warum die beiden getrennt
 * sind.
 */
export const DATA_TRANSFER_MAX_BODY_BYTES = 64 * 1024 * 1024;

/**
 * Die Rumpfgrenze der **einen** Route, über die eine eigene Datensicherung
 * eingespielt wird (A-20.4, A-19.34, T-301).
 *
 * ===========================================================================
 * Warum die Zahl von 64 MB auf 256 MiB steigt
 * ===========================================================================
 *
 * Seit A-19.34 trägt das Archiv die aus E-Mails übernommenen **Dateien samt
 * Bytes**. Damit ist die alte Zahl nicht mehr großzügig, sondern zu klein für
 * ihren eigenen Gegenstand: Eine Datei darf 25 MB haben
 * (`MAX_EMAIL_ATTACHMENT_BYTES`), base64 also 33,3 MB — **zwei** solche Dateien
 * im ganzen Bestand ergaben ein Archiv, das sich nicht mehr einspielen ließ.
 * Und schon vorher galt dasselbe für die Bildkopien: Sechs Bilder à 8 MB
 * (`MAX_ATTACHMENT_IMAGE_BYTES`) reißen 64 MB. Ein Archiv, das die Anwendung
 * selbst erzeugt und danach nicht wieder annimmt, bricht A-20.4 — die
 * Anforderung, auf der die ganze Datensicherung ruht.
 *
 * ===========================================================================
 * Woher die 256 kommt — drei Messungen, keine Vorliebe
 * ===========================================================================
 *
 * Gemessen am 2026-09-11 auf dem Zielsystem (Windows 11, 8 GB, Node 22.23.2)
 * über die Kette, die eine Anfrage wirklich durchläuft: Rumpf als Buffer →
 * `request.text()` → `JSON.parse` → `Buffer.from(base64)` je Datei.
 *
 * | Rumpf | Nutzlast | Spitze RSS | Spitze Halde | Dauer |
 * |---|---|---|---|---|
 * | 66,7 MB | 50 MB | 333 MB | 137 MB | 108 ms |
 * | 133,3 MB | 100 MB | 533 MB | 271 MB | 203 ms |
 * | **266,7 MB** | **200 MB** | **934 MB** | **537 MB** | **455 ms** |
 * | 400,0 MB | 300 MB | 1 333 MB | 804 MB | 731 ms |
 * | 500,0 MB | 375 MB | 1 684 MB | 1 004 MB | 876 ms |
 *
 *  1. **Die harte Wand liegt bei 512 MiB, und sie gehört nicht uns.** V8 setzt
 *     `buffer.constants.MAX_STRING_LENGTH` auf 536 870 888 Zeichen; ein Rumpf
 *     darüber läßt `request.json()` **werfen**, und aus dem Wurf wird in
 *     `readJson` ein 422 mit einem Satz über ein „nicht unterstütztes Archiv" —
 *     eine Auskunft, die auf die falsche Ursache zeigt. Eine Rumpfgrenze **muß**
 *     unter dieser Wand liegen, damit statt dessen ein sauberes 413 mit Grund
 *     kommt. 256 MiB ist genau die Hälfte.
 *  2. **Die Halde trägt es.** V8 gibt diesem Rechner (8 GB) 2 096 MB; bei
 *     266,7 MB Rumpf stehen 537 MB darin, also Faktor 3,9 Luft. Bei 500 MB
 *     Rumpf sind es 1 004 MB — es läuft, aber es läuft nur, solange sonst wenig
 *     läuft, und der Dienst liegt neben Outlook auf demselben Rechner. Eine
 *     Grenze, deren oberes Ende einen leeren Rechner braucht, ist keine.
 *  3. **Die Zeit reicht.** 455 ms für Lesen, Zerlegen und Dekodieren gegen
 *     {@link REQUEST_TIMEOUT_MS} von 15 s — über Loopback ist der Weg dorthin
 *     ein Bruchteil davon.
 *
 * **Was 256 MiB in der Sache heißt:** rund 192 MiB Nutzlast (Base64 bläht um
 * ein Drittel), also 7 Dateien der vollen Einzelgröße, 24 Bildkopien der vollen
 * Größe oder — realistisch — einige hundert gewöhnliche Anhänge nebst dem
 * ganzen übrigen Bestand.
 *
 * ===========================================================================
 * Was die Zahl **nicht** löst, und wer es sagt
 * ===========================================================================
 *
 * Sie ist eine Zahl und keine Eigenschaft: Ein Bestand, der lange genug wächst,
 * reißt jede feste Grenze. Deshalb hängt an dieser Zeile eine zweite Maßnahme,
 * und die ist die eigentliche: **Die Sicherung sagt es, wenn sie größer wird,
 * als das Einspielen annimmt** (`exportDataArchive`, Warnung mit beiden
 * Zahlen). Der schlechteste Zeitpunkt, das zu erfahren, ist der Tag, an dem man
 * die Sicherung braucht.
 *
 * ===========================================================================
 * Warum eine eigene Zahl statt einer für `/data-transfer`
 * ===========================================================================
 *
 * `startsWith('/data-transfer')` wäre kürzer und falsch — dieselbe Begründung
 * wie bei {@link ADDIN_ATTACHMENT_MAX_BODY_BYTES} und in `app.ts`
 * ausgeschrieben: Eine Ausnahme, deren Menge an einem Präfix aufgespannt ist
 * statt an der Anforderung, wächst mit jeder Nachbarroute mit, ohne daß es
 * jemand entscheidet (E-099 Punkt 3). Die Fremdimporte tragen keine
 * eingebetteten Bytes und brauchen die Erhöhung nicht; sie behalten ihre 64 MB.
 *
 * Damit stehen drei Ausnahmen von B-1.7 im Bestand, und jede hängt an genau
 * einer Anforderung: das eigene Archiv (A-20.4), die Fremdimporte (A-20.7) und
 * das Anlegen eines Todos aus einer E-Mail (A-19.30).
 */
export const DATA_ARCHIVE_MAX_BODY_BYTES = 256 * 1024 * 1024;

/**
 * Der Spielraum über der base64-kodierten Summengrenze (A-A-100).
 *
 * Was zwischen den Bytes der Anhänge und dem Rumpf noch Platz braucht: das
 * JSON-Gerüst, die Anzeigenamen (bis 100 Stück à 1020 Zeichen), Betreff,
 * Absender, Empfänger, der Nachrichtenrumpf, die Auszeichnung jedes
 * Anführungszeichens — und die Aufrundung, die base64 je Datei auf ein
 * Vielfaches von vier vornimmt.
 *
 * **Acht Mebibyte und nicht achthundert Kilobyte.** Die aufgezählten Felder
 * summieren sich auf deutlich weniger; die Zahl ist bewußt großzügig, weil ihr
 * Fehlbetrag ein **stiller Ausfall** wäre (413 statt einer namentlichen
 * Meldung) und ihr Überschuß nur flüchtiger Speicher auf einer Route mit
 * Token. Von den beiden Fehlern ist der zweite der billige — dieselbe Richtung
 * wie in `email-file-sweep.ts`, nur an einer anderen Stelle.
 */
export const ADDIN_ATTACHMENT_BODY_HEADROOM_BYTES = 8 * 1024 * 1024;

/**
 * Die Rumpfgrenze der **einen** Route, über die ein Todo aus einer E-Mail
 * entsteht (A-19.30, E-108 Punkt 3, A-A-81, A-A-100).
 *
 * ===========================================================================
 * Die dritte benannte Ausnahme von B-1.7, und sie steht genau hier
 * ===========================================================================
 *
 * Es gibt drei, und nur drei:
 *
 *  1. {@link DATA_TRANSFER_MAX_BODY_BYTES} — die Datensicherung mit
 *     eingebetteten Bildkopien (A-20).
 *  2. **Diese** — die Anhangsübernahme aus einer E-Mail.
 *  3. Sonst nichts. {@link MAX_BODY_BYTES} bleibt für **jede** andere Route
 *     bei einem Megabyte, und daran ändert diese Zeile nichts.
 *
 * ===========================================================================
 * Warum eine Zahl an einer Stelle und nicht vier an vier
 * ===========================================================================
 *
 * Das Bedrohungsmodell entscheidet in 39.4.5 die Frage, ob die Bytes einzeln
 * zum Dienst wandern oder gesammelt mit dem Anlegevorgang kommen — und es
 * trägt den **gesammelten** Weg. Der andere wäre eine Stelle, an der ein
 * Aufrufer mit gültigem Token Dateien in das Anwendungsdatenverzeichnis
 * schreibt, **ohne daß ein Todo entsteht**: ein unbegrenztes Schreibwerkzeug
 * in dem Ordner, der die Bildkopien und die Datenbank als Nachbarn hat.
 *
 * Der Preis des gesammelten Wegs ist ein großer Rumpf, und das ist eine Zahl
 * und keine Eigenschaft. Die Summengrenze ist zugleich die Rumpfgrenze dieser
 * einen Route; damit gibt es **eine** Zahl statt vier, und sie hängt an einer
 * Anforderung statt an einer Zählweise.
 *
 * ===========================================================================
 * Der Zusammenhang mit der Summengrenze — und warum er **gerechnet** und nicht
 * danebengeschrieben wird (A-A-100, T-313-5)
 * ===========================================================================
 *
 * Bis T-314 stand hier `64 * 1024 * 1024` als eigene Zahl, mit dem Satz
 * daneben, 64 MB Rumpf trügen 48 MB Nutzlast. Das ist arithmetisch richtig und
 * praktisch falsch: Base64 bläht um **genau** 4/3 auf, also sind 48 MiB
 * Nutzlast **exakt** 64 MiB Zeichenkette — und darüber liegen noch das
 * JSON-Gerüst, die Anzeigenamen, der Betreff, der Absender, der Nachrichtenrumpf
 * und jedes Anführungszeichen. Eine Anfrage, die die Summengrenze **erreicht**,
 * riß damit immer zuerst die Rumpfgrenze.
 *
 * Der security-checker hat das gemessen: fünf Anläufe über der Summengrenze,
 * **alle 413**. Damit war `total_too_large` über die Leitung **unerreichbar** —
 * einer der drei Gründe aus A-19.30a konnte nicht feuern, und der Benutzer bekam
 * statt einer namentlichen Meldung nach A-19.29 einen abgewiesenen Rumpf ohne
 * Namen und ohne Grund. Das ist ein stiller Ausfall im Sinne von A-19.31, nur an
 * der Tür statt an der Nachricht.
 *
 * **Die Entscheidung ist: die Rumpfgrenze wandert, nicht die Summengrenze.**
 * Beide Wege schlössen die Lücke. Die Summengrenze zu senken kostete dem
 * Benutzer **Anhänge** — Material aus einer fremden E-Mail, das er nicht
 * ausgesucht hat und für dessen Größe er nichts kann. Die Rumpfgrenze zu heben
 * kostet **flüchtigen Speicher** auf einer Route, die ohnehin ein Token
 * verlangt, und zwar nach der gemessenen Spanne (Faktor ≈ 3,3 auf den
 * zugelassenen Rumpf) rund 26 MB mehr an der Spitze. Von den beiden Preisen ist
 * der zweite der, den der Rechner zahlt, und der erste der, den der Benutzer
 * zahlt.
 *
 * **Die Grenze wird damit erreichbar, nicht abgeschafft.** Die Fachgrenze bleibt
 * bei 48 MiB und greift jetzt zuerst: Eine Rohsumme darüber kommt an, das Todo
 * entsteht, und jede nicht übernommene Datei steht namentlich in `rejected` mit
 * `reason: 'total_too_large'`. Das Fenster, in dem das gilt, ist so breit wie
 * {@link ADDIN_ATTACHMENT_BODY_HEADROOM_BYTES} geteilt durch 4/3 — rund 6 MiB
 * Überschuß. Wer mehr schickt, bekommt weiterhin 413, und das ist richtig: Ab
 * irgendeiner Größe ist eine Anfrage kein Postfachinhalt mehr.
 *
 * **Gerechnet und nicht danebengeschrieben.** Die Zahl steht nicht mehr für
 * sich, sondern entsteht aus der Fachgrenze. Wer die Fachgrenze verschiebt,
 * verschiebt diese mit; wer diese Ableitung durch eine Zahl ersetzt, macht
 * `proof:route-policy` rot.
 */
export const ADDIN_ATTACHMENT_MAX_BODY_BYTES =
  Math.ceil(MAX_EMAIL_ATTACHMENT_TOTAL_BYTES / 3) * 4 + ADDIN_ATTACHMENT_BODY_HEADROOM_BYTES;

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
