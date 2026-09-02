Aufgabe: T-055 — Prüfen, ob dieselbe Lücke auch bei dir klafft (Bauergebnis statt Quelltext für
`apps/web` und `apps/outlook-addin`, plus Versuch gegen die `.AppImage`).

Status: fertig

---

Artefakte:

Neu:

```
tests/e2e/support/build-check-session.ts       57  feste Werte für beide Bauprüfungen: Ports,
                                                    Pfade, Begründung für 5173 (nicht 4173) und
                                                    17944 (nicht 17844)
tests/e2e/support/web-build-services.ts       103  `buildWeb()` (pnpm --filter @takt/web build),
                                                    `startWebPreview()` (vite preview, echtes
                                                    Bauergebnis statisch, kein Entwicklungsserver)
tests/e2e/support/tauri-shim.ts                74  Nachbildung von `window.__TAURI_INTERNALS__
                                                    .invoke` für `takt_service_handshake`/
                                                    `takt_shell_state`/`takt_quit` — am
                                                    ausgelieferten `@tauri-apps/api/core.js`
                                                    geprüft, keine Annahme
tests/e2e/support/global-setup-web-build.ts    29  baut, startet Dienst+Vorschau, räumt auf
tests/e2e/playwright.web-build.config.ts       43  eigene Ausführungskonfiguration, baseURL 5173
tests/e2e/web-build-smoke.spec.ts             117  TP-BUILD-01/02
tests/e2e/support/run-outlook-taskpane.mjs     76  startet den echten, unveränderten
                                                    `startTaskpaneServer()` aus
                                                    `apps/local-api/src/taskpane/server.ts` gegen
                                                    `apps/outlook-addin/dist`
tests/e2e/support/global-setup-outlook-build.ts 106  baut, startet den Aufgabenbereich-Server, räumt auf
tests/e2e/playwright.outlook-build.config.ts   51  eigene Ausführungskonfiguration, HTTPS, Port 17944
tests/e2e/outlook-addin-build.spec.ts         121  TP-BUILD-03/04
```

Geändert:

```
tests/e2e/support/services.ts    204 (+2 export, +9 Kommentarzeilen)  `startLocalApi`/
                                  `configureExportDirectory` zusätzlich exportiert, rein additiv,
                                  keine Verhaltensänderung — Begründung im Dateikopf ergänzt
tests/e2e/playwright.config.ts    71 (+9)  `testIgnore` für die beiden neuen Spezifikationsdateien
                                  — notwendig, siehe Punkt 4 unten, sonst 29 bestanden/3
                                  fehlgeschlagen statt weiterhin 28 bestanden
docs/testplan.md                1929 (+ca. 95)  neuer Abschnitt 15 mit TP-BUILD-01 bis -04 und
                                  einem eigenen Unterabschnitt zur AppImage/Playwright-Grenze
```

`apps/**`, `packages/**`, Wurzeldateien, `docs/**` außer dem Testplan: unangetastet. Kein
`git commit` — kein Git-Repository in diesem Arbeitsbereich (`Is directory a git repo: No`).
Ausführbare Befehle (`pnpm --filter @takt/web build`, `pnpm --filter @takt/outlook-addin build`)
sind Bauläufe, keine Änderungen an `apps/**`-Quelltext — die entstandenen `dist/`-Ordner sind
Bauerzeugnisse, keine von mir bearbeiteten Dateien.

---

Zusammenfassung:

Die vom domain-dev benannte Lücke ("jeder Nachweis läuft aus dem Quelltext") wurde für
`apps/web` und `apps/outlook-addin` gemessen, nicht vermutet. Ergebnis: **`apps/web` betrifft sie
nicht** — das gebaute Bündel degradiert kontrolliert (`NoShellNotice`), sobald es an der
Tauri-Prüfung `isShellAvailable()` scheitert, und läuft mit einer nachgebildeten Hülle
funktional identisch zum Entwicklungsbetrieb. **`apps/outlook-addin` betrifft sie ebenfalls
nicht** — der wahrscheinlichste vermutete Fund (der Web-Worker-Chunk der Call-Nummer-Erkennung,
dessen Ladeweg sich zwischen `vite`-Entwicklung und `vite build` bekanntermaßen unterscheidet)
hat sich nicht bestätigt: Der Chunk lädt und liefert das korrekte Ergebnis, wenn man ihn über den
echten, in T-053 reparierten `startTaskpaneServer()` ausliefert. Punkt 3 (`.AppImage` gegen
Playwright) ist **nicht gelaufen** — aus zwei unabhängigen, unten belegten Gründen, keiner davon
Zeitmangel. Ein Nebenbefund während der Arbeit: Meine eigenen neuen Spezifikationsdateien wären
beinahe in den bestehenden 28er-Bestand hineingerutscht und hätten ihn auf dem Papier
"verschlechtert" — gefunden, korrigiert, gegengeprüft.

---

## 1. `apps/web` — TP-BUILD-01/02

**Aufbau.** `pnpm --filter @takt/web build` (derselbe Befehl wie `pnpm build`), danach
`vite preview --host 127.0.0.1 --port 5173 --strictPort` — Vites eigenes Werkzeug für genau
diesen Zweck ("das Bauergebnis lokal ansehen"), kein selbstgeschriebener Server. Port 5173 statt
der Vorgabe 4173: `ALLOWED_ORIGINS` im Dienst lässt nur `http://127.0.0.1:5173` zu
(`apps/local-api/src/config.ts`) — ein Test auf 4173 hätte nur die eigene Portwahl geprüft, nicht
das Bündel. Der lokale Dienst läuft dabei unverändert aus dem Quelltext (nicht der
Prüfgegenstand hier, das war T-053).

**Befund, gemessen am Quelltext, bevor der erste Test lief.** `apps/web/src/app/connection.ts
#developmentFallback` liest `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` nur, wenn
`import.meta.env.DEV === true` ist. Vite ersetzt diesen Wert beim Bau fest mit `false` — der
ganze Umweg, den `tests/e2e/support/services.ts` für den Entwicklungsserver benutzt, wirkt im
Bauergebnis nicht mehr. Ein gebautes `apps/web` verlangt außerhalb von Tauri also zwingend
`isShellAvailable()` (`'__TAURI_INTERNALS__' in globalThis`) — das ist eine bewusste,
dokumentierte Entscheidung im Quelltext, keine Überraschung.

**TP-BUILD-01 — ohne Hülle.** Die Adresse ohne jede Nachbildung geöffnet.
Ergebnis: **bestanden**. `NoShellNotice` erscheint wörtlich ("Takt läuft in der Takt-Anwendung"),
das Designsystem bleibt darüber erreichbar, keine `pageerror`/`console`-Fehler. Das ist die
eigentliche Antwort auf den Auftrag: **Nichts bricht.** Kein weißer Bildschirm, kein Absturz —
dieselbe Fehlerklasse wie beim Sidecar (Bündel kommt nicht hoch) tritt hier nicht auf.

**TP-BUILD-02 — mit nachgebildeter Hülle.** `tests/e2e/support/tauri-shim.ts` bildet
`window.__TAURI_INTERNALS__.invoke` für die drei vom Boot-Pfad gebrauchten Befehle nach — geprüft
am tatsächlich ausgelieferten `@tauri-apps/api/core.js` (`invoke()` ruft dort wörtlich nur
`window.__TAURI_INTERNALS__.invoke(cmd, args, options)` auf), nicht angenommen. Damit lief der
Startpunkt S-03 aus `todo-revival.spec.ts` (Todo anlegen, erledigt markieren, Timer starten,
"Erledigt aufgehoben", Kanban-Status unverändert — E-023) unverändert gegen das gebaute Bündel.
Ergebnis: **bestanden**, einschließlich des dynamisch geladenen `shell-*.js`-Chunks
(`apps/desktop/src/shell.ts`), der im Entwicklungsbetrieb anders aufgelöst wird als im Bau.

**Gegenprobe.** Hauptskript per `page.route('**/assets/index-*.js', route => route.abort())`
blockiert → TP-BUILD-01 rot mit derselben Zeitüberschreitung, die ein tatsächlich gebrochenes
Bündel gezeigt hätte. Datei danach `diff`-geprüft byteidentisch wiederhergestellt.

Drei Läufe hintereinander, `2 passed` bei jedem, keine einzige Wiederholung gebraucht
(`retries: 1` in der Konfiguration nie gezogen).

## 2. `apps/outlook-addin` — TP-BUILD-03/04

**Aufbau, das Gegenstück zu `sidecar:verify` (T-053).** `pnpm --filter @takt/outlook-addin build`,
danach Auslieferung über den **echten, unveränderten** `startTaskpaneServer()` aus
`apps/local-api/src/taskpane/server.ts` — derselben Funktion, die T-053 bereits repariert und mit
einem nachgebauten Installationsbild geprüft hat. Der Unterschied zu `sidecar:verify` ist allein
die `root`-Angabe: dort eine zweizeilige Attrappe, hier das tatsächliche `vite build`-Ergebnis.
Läuft als eigener, mit `node` gestarteter Prozess (`run-outlook-taskpane.mjs`), weil
`server.ts` intern mit `.ts`-Endung importiert (`from '../config.ts'`) — genau der Weg, den
`apps/local-api/scripts/proof-taskpane.mjs` schon vormacht, nicht Playwrights eigener
Testdatei-Transform. Port 17944 statt des produktiven 17844 (dieselbe Begründung wie in
`proof-taskpane.mjs`: parallel laufende Team-Agenten könnten 17844 belegt halten).
`ignoreHTTPSErrors: true` im Browserkontext ist eine bewusst benannte Grenze dieser zwei Fälle:
Sie gilt der Frage, ob das Bündel funktional lädt — nicht der TLS-Vertrauenskette, die
`proof-taskpane.mjs` bereits mit einem echten `https.request` gegen die eigene Zertifikatswurzel
geprüft hat (X.509, `subjectAltName`, Laufzeit).

**TP-BUILD-03 — ohne Office-Wirt.** Ergebnis: **bestanden**, mit einem gemessenen Befund, der
eine ursprüngliche Annahme in der ersten Fassung dieser Datei widerlegt hat: Diese Maschine
erreicht `appsforoffice.microsoft.com` tatsächlich (`office.js` lädt, `Office.onReady()` löst
innerhalb von 5 Sekunden auf); ohne echtes Outlook-Fenster bleibt `Office.context.mailbox.item`
trotzdem `undefined`. Der Zustand ist deshalb `no_item` ("Keine E-Mail geöffnet"), nicht `no_host`
("Kein Outlook") — beides sind reguläre, im Quelltext benannte Zustände, der Test prüft jetzt auf
einen von beiden statt auf einen angenommenen. Zweiter Befund, unabhängig davon: Chromium meldet
`The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta>
element.` — eine allgemeine Browsereigenschaft von `<meta http-equiv="Content-Security-Policy">`
(nur ein echter HTTP-Kopf wendet `frame-ancestors`/`sandbox` an), unverändert seit vor dieser
Aufgabe und im Entwicklungsbetrieb identisch — kein Fund von T-055, deshalb ausdrücklich
begründet herausgefiltert statt stillschweigend bestehen zu lassen.

**TP-BUILD-04 — der Web-Worker-Chunk, der wahrscheinlichste vermutete Fund.** Der Testbereich aus
S-13 (`SettingsView.tsx#runSample`) ruft `evaluate()` auf; `App.tsx` wählt dafür
`createTimedEvaluator({ spawn: spawnBrowserChannel })`, sobald `supportsWorker()` wahr ist —
unabhängig vom Office-Wirt. `spawnBrowserChannel()` ist die einzige Stelle im Add-in, die
`new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` aufruft — genau die
Vite-Schreibweise, die im Bau einen eigenen Chunk erzeugt (`assets/worker-*.js`, 0,39 kB im
gemessenen Bau) und deren Ladeweg sich vom Entwicklungsbetrieb unterscheidet. Vorgabemuster und
Vorgabe-Beispieltext stimmen laut Quelltext bewusst überein (`PATTERN_CATALOG[0]`); unverändert
auf "Ausdruck auf den Beispieltext anwenden" geklickt. Ergebnis: **bestanden** — "Erkannt",
`TCK-000042`. Der wahrscheinlichste vermutete Fund dieser Aufgabe hat sich **nicht** bestätigt.

**Gegenprobe.** `**/assets/worker-*.js` per `page.route()` blockiert → TP-BUILD-04 rot (kein
"Erkannt"-Callout, Zeitüberschreitung). Datei danach `diff`-geprüft byteidentisch
wiederhergestellt.

Drei Läufe hintereinander, `2 passed` bei jedem, keine Wiederholung gebraucht.

## 3. Die `.AppImage` gegen Playwright — nicht gelaufen, zwei unabhängige Gründe

**Grund 1, architekturell und unabhängig vom Bauzustand: Playwright kann eine laufende
Tauri-Anwendung unter Linux nicht ansteuern.** Tauri bettet keinen Chromium ein, sondern den
systemeigenen WebView — unter Linux WebKitGTK. Mit `ldd` gegen das vorhandene (siehe Grund 2,
veraltete) `Takt_0.0.0_amd64.AppImage` geprüft: Es bindet gegen `libwebkit2gtk-4.1.so.0`.
Playwright hat für Electron eine eigene, dokumentierte Andockstelle (`_electron`,
`ElectronApplication`, geprüft in den ausgelieferten Typdefinitionen von `playwright-core` —
Electron bringt Chromium mit und spricht darüber das Chrome DevTools Protocol). Für
WebKitGTK/Tauri gibt es keine solche Stelle — weder in den Typdefinitionen (kein Treffer für
"tauri"/"webkitgtk"/"webkit2gtk") noch sonst in der Dokumentation. Playwrights eigener
"webkit"-Browser ist ein von Playwright selbst gestarteter, gepatchter WebKit-Build mit einem
eigenen Treiberprotokoll — kein generisches Andocken an einen fremden, bereits laufenden
WebKitGTK-Prozess. Das ist eine Protokollgrenze, keine Zeitfrage: Ein frischer Bau hätte daran
nichts geändert.

**Grund 2, situativ: `apps/desktop` stand während dieser Aufgabe unter aktiver Bearbeitung.**
Das vorhandene `Takt_0.0.0_amd64.AppImage` (137 MB, `apps/desktop/src-tauri/target/release/
bundle/appimage/`) ist vom 01.09. 04:09 Uhr — **vor** den T-053-Behebungen (ab 20:20 Uhr
desselben Tages an `open.ts`/`server.ts`/`verify-sidecar.mjs`). Es zeigte also ohnehin den
behobenen Fehler und wäre kein sinnvoller Prüfgegenstand gewesen. Ein Neubau war während dieser
Aufgabe nicht angebracht: Während der Arbeit kam die Systemmeldung, dass
`apps/desktop/package.json` sich geändert hat — der frontend-dev fügt dort gerade neue
`taskpane`-Bauschritte hinzu (`build-taskpane.mjs`, `app:dev`/`app:build` erweitert). Ein
`pnpm --filter @takt/desktop app:build` gegen ein bewegliches Ziel hätte entweder mitten in einer
fremden Änderung gegriffen (unzuverlässiges Ergebnis) oder mit `apps/desktop` in einer Weise
interagiert, die über "ausführen" hinausgeht (Cargo-Sperren, Zwischenzustände) — und stünde im
Widerspruch zur ausdrücklichen Anweisung, `apps/desktop` in dieser Aufgabe nicht anzufassen.

Grund 1 allein hätte schon gereicht (Playwright käme so oder so nicht an eine laufende
Tauri-Anwendung heran); Grund 2 ist der Grund, warum ich nicht einmal den Neubau selbst versucht
habe. **Das Gegenstück, das stattdessen ginge** — die AppImage starten und ihre beiden Ports ohne
Playwright, per rohem HTTP/HTTPS von außen prüfen (kommt der Dienst hoch? antwortet der
Aufgabenbereich?) — ist aus Grund 2 ebenfalls nicht gelaufen, bliebe aber der naheliegende nächste
Schritt, sobald `apps/desktop` wieder unbeteiligt ist. Siehe „Offene Fragen".

## 4. Nebenbefund: die eigenen neuen Dateien wären beinahe in den bestehenden Bestand gerutscht

`tests/e2e/playwright.config.ts` hat `testMatch: '**/*.spec.ts'` ohne Einschränkung — jede neue
`*.spec.ts`-Datei unter `tests/e2e/` landet dort automatisch mit. Der erste volle Lauf nach dem
Anlegen von `web-build-smoke.spec.ts`/`outlook-addin-build.spec.ts` zeigte **29 bestanden, 3
fehlgeschlagen** statt der zuvor durchgehend grünen 28 — nicht, weil ein bestehender Fall
gebrochen wäre, sondern weil meine beiden neuen Dateien dort gegen den **Entwicklungsserver**
liefen (den diese Konfiguration startet), während sie das **Bauergebnis** voraussetzen. Behoben
mit `testIgnore` in derselben Datei (meine Dateihoheit); danach erneut **28 bestanden**, dreifach
bestätigt, zuletzt in einem einzigen zusammenhängenden Lauf aller drei Konfigurationen
nacheinander (28 + 2 + 2 = 32, alle bestanden). Genannt, weil genau diese Sorte Fehler — ein
neuer Testfall läuft unbemerkt gegen die falsche Umgebung und meldet ein falsches Ergebnis — im
Kern dieselbe Familie ist wie das, was T-055 misst: Ob etwas tatsächlich das prüft, was es zu
prüfen behauptet.

Der Wurzel-`playwright.config.ts` (nicht meine Dateihoheit) fehlt weiterhin jeder
`globalSetup`/`webServer`-Eintrag — er kann heute keinen einzigen Testfall ausführen, unabhängig
von meinen Dateien. Das ist kein durch T-055 verursachter Zustand (so vorgefunden, siehe eigener
Dateikopf: „ein geratener Startbefehl hier wäre ein stiller Fehlstart"), nur der Vollständigkeit
halber genannt.

---

Prüfungen:

```
pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts
    2 Tests (TP-BUILD-01/02), dreifach hintereinander gelaufen, jedes Mal 2 bestanden, 0
    fehlgeschlagen, keine Wiederholung gebraucht

pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts
    2 Tests (TP-BUILD-03/04), dreifach hintereinander gelaufen, jedes Mal 2 bestanden, 0
    fehlgeschlagen, keine Wiederholung gebraucht

pnpm exec playwright test -c tests/e2e/playwright.config.ts
    28 Tests (unveränderter Bestand), zuerst 29 bestanden/3 fehlgeschlagen (Fund aus Punkt 4),
    nach der Korrektur zweimal hintereinander 28 bestanden, 0 fehlgeschlagen

Gegenprobe 1 (web-build-smoke.spec.ts, Hauptskript per page.route blockiert)
    1 von 1 wie erwartet rot; Datei danach byteidentisch wiederhergestellt (diff)
Gegenprobe 2 (outlook-addin-build.spec.ts, Worker-Chunk per page.route blockiert)
    1 von 1 wie erwartet rot; Datei danach byteidentisch wiederhergestellt (diff)

Abschließender Gesamtlauf, alle drei Konfigurationen nacheinander in einem Arbeitsgang:
    28 + 2 + 2 = 32 Tests, alle bestanden, 0 fehlgeschlagen, 0 nicht gelaufen
```

**Die drei Zahlen für den Auftrag dieser Aufgabe, getrennt:** Fälle: **4** (TP-BUILD-01 bis -04)
— Bestanden: **4** — Nicht gelaufen: **0**. Zusätzlich, außerhalb dieser vier: der Versuch gegen
die `.AppImage` (Punkt 3 des Auftrags) — **nicht gelaufen**, aus zwei unabhängigen, oben
belegten Gründen, keiner davon Zeitmangel.

Kein `pnpm typecheck`/`pnpm build`/`pnpm test` als eigene Prüfung gelaufen — `apps/**`/
`packages/**`-Quelltext ist unangetastet, und die beiden Bauläufe (`pnpm --filter @takt/web
build`, `pnpm --filter @takt/outlook-addin build`) sind bereits Teil jedes Playwright-Laufs oben
(im jeweiligen `globalSetup`) und dort mit Exitcode geprüft.

---

Annahmen:

1. **`vite preview` statt eines selbstgeschriebenen statischen Servers für `apps/web`.** Es ist
   Vites eigenes Werkzeug für "das Bauergebnis lokal ansehen", unterscheidet sich darin nicht
   relevant von einem echten Auslieferungsserver, und ein Nachbau hätte selbst wieder eine
   Annahme über Inhaltstypen etc. eingeführt. Für `apps/outlook-addin` gibt es dagegen einen
   echten Auslieferungsweg (`startTaskpaneServer()`), gegen den zu prüfen strenger ist — dort kam
   deshalb kein `vite preview` zum Einsatz.
2. **`ignoreHTTPSErrors: true` statt eines an den Browserkontext übergebenen CA-Zertifikats** für
   die Outlook-Fälle. Bewusste Grenze: Diese zwei Fälle prüfen, ob das Bündel funktional lädt,
   nicht die TLS-Vertrauenskette — die hat `proof-taskpane.mjs` bereits mit einem echten
   `https.request` gegen die eigene Zertifikatswurzel geprüft.
3. **Die Tauri-Nachbildung (`tauri-shim.ts`) bildet nur die drei Befehle nach, die der Boot-Pfad
   tatsächlich braucht** (`takt_service_handshake`, `takt_shell_state`, `takt_quit`) — nicht
   `chooseExportDirectory`/`osUser`/Kanäle. Für TP-BUILD-02 (Startpunkt S-03, Timer starten)
   reicht das; ein Fall, der den Ordnerauswahldialog oder den Windows-Benutzernamen bräuchte,
   bräuchte eine Erweiterung dieser Datei.
4. **Ports 5173 und 17944, nicht 4173/17844**, aus CORS- bzw. Kollisionsgründen — im Dateikopf von
   `build-check-session.ts` einzeln begründet, nicht wiederholt hier.
5. **Kein neues `tests/fixtures/**`-Material.** Alle vier Fälle brauchen keine über Testdaten
   hinausgehenden Vorbereitungen, die eine eigene Fixture-Datei rechtfertigen würden (erfundene
   Titel mit `Date.now()`-Suffix, wie im übrigen Bestand).

Risiken:

- **TP-BUILD-03s genauer Zustand (`no_host` gegen `no_item`) hängt von der Erreichbarkeit von
  `appsforoffice.microsoft.com` ab.** Auf einer Maschine ohne diesen Netzzugriff bekäme derselbe
  Testfall den anderen der beiden Zustände — der Test ist dafür jetzt robust (prüft auf einen von
  beiden), aber jemand, der das Verhalten dieser Aufgabe nachvollziehen will, sollte diesen
  Unterschied nicht als Umgebungsfehler missverstehen.
- **Die vorhandene `Takt_0.0.0_amd64.AppImage` (137 MB) ist veraltet** (vor T-053) und liegt
  weiterhin auf der Platte. Wer sie ungeprüft für eine manuelle Probe startet, testet den bereits
  behobenen Fehler, nicht den aktuellen Stand.
- **`tests/e2e/support/services.ts` ist jetzt eine gemeinsame Abhängigkeit dreier
  Ausführungskonfigurationen** (Wurzel, `tests/e2e/playwright.config.ts` indirekt über
  `global-setup.ts`, und meine beiden neuen über `startLocalApi`/`configureExportDirectory`). Die
  Änderung war rein additiv (zwei `export`-Schlüsselwörter, ein Kommentar) und dreifach
  gegengeprüft (Punkt 4, „Prüfungen" oben) — trotzdem: Wer diese Datei künftig ändert, ändert
  potenziell alle drei Konfigurationen gleichzeitig.
- **Punkt 4 (Nebenbefund) ist ein Muster, kein Einzelfall.** Jede künftige neue
  `*.spec.ts`-Datei unter `tests/e2e/` braucht entweder eine passende Vorbedingung
  (Entwicklungsserver läuft) oder einen expliziten Ausschluss in
  `tests/e2e/playwright.config.ts` — sonst wiederholt sich derselbe stille Fehlstart.

Offene Fragen:

1. **An den Orchestrator/frontend-dev.** T-053s offene Frage 1 („Das Bündel des Aufgabenbereichs
   wird nirgends neben die Binärdatei kopiert") bleibt unverändert offen — bestätigt durch die
   während dieser Aufgabe beobachtete, laufende Erweiterung von `apps/desktop/package.json` um
   `taskpane`-Bauschritte. TP-BUILD-03/04 prüfen das **Bündel selbst**, nicht seine Auslieferung
   in der fertigen Anwendung; sobald diese Kopie steht, wäre der nächste sinnvolle Schritt, den
   Aufgabenbereich-Port **innerhalb** eines tatsächlichen `tauri dev`/`app:build`-Laufs zu prüfen,
   nicht nur über `run-outlook-taskpane.mjs` isoliert.
2. **An den Orchestrator.** Soll aus `playwright.web-build.config.ts`/
   `playwright.outlook-build.config.ts` eine eigene Kette werden (etwa
   `pnpm test:e2e:build`), die vor jeder Auslieferung läuft — ähnlich der von domain-dev für
   `sidecar:verify` vorgeschlagenen zweiten Kette neben `check`? Beide Läufe zusammen brauchen
   knapp 15 Sekunden (siehe „Prüfungen") und wären billig genug für jeden Lauf, der `apps/web`
   oder `apps/outlook-addin` anfasst.
3. **An den Orchestrator.** Das in Punkt 3 benannte Gegenstück zur `.AppImage` — sie ohne
   Playwright starten und ihre beiden Ports per rohem HTTP/HTTPS von außen prüfen, analog zu
   `sidecar:verify`, aber für die **ganze** Anwendung statt nur den Sidecar — ist eine sinnvolle
   eigene Aufgabe, sobald `apps/desktop` nicht mehr unter aktiver Bearbeitung steht. Sie läge an
   der Grenze zwischen e2e-tester (Dateihoheit `tests/e2e/**`) und domain-dev/frontend-dev
   (Dateihoheit `apps/desktop/**`, falls ein Skript dort entstehen soll) und sollte vorab
   zugeordnet werden.

---

Nächster Schritt: Frage 2 entscheiden (eigene Kette ja/nein) und, sobald `apps/desktop` wieder
frei ist, Frage 3 als eigene, klar zugeordnete Aufgabe einplanen — sie schließt die letzte der
drei von T-053 benannten ungemessenen Stellen.
