Aufgabe: T-008b — Tauri-Hülle und Sidecar-Bündelung für Takt

Status: fertig

---

Artefakte:

Neu unter `apps/desktop/` (41 Dateien, 436 KiB im Repository):

```
package.json                        @takt/desktop, exports ./shell
tsconfig.json                       erbt tsconfig.base.json
.gitignore                          Binärdatei, Laufzeit-Zwischenspeicher, target/, gen/
README.md                           Befehle, Bündelweg, Lebenszyklus, gemessene Herkunft

sidecar/entry.ts                    CJS-fähiger Einstieg ohne Top-Level-await
src/shell.ts                        die vier Befehle für die Oberfläche, typisiert

scripts/build-sidecar.mjs           esbuild → SEA-Blob → Binärdatei, mit R-04-Prüfung
scripts/sidecar-runtime.mjs         die eingebettete Node-Laufzeit, Prüfsummen im Repo
scripts/verify-sidecar.mjs          neun Prüfungen gegen die gebaute Datei
scripts/build-app.mjs               tauri build mit zwei Linux-Umgebungsvariablen
scripts/make-icon.mjs               Quellbild aus den Design-Token

src-tauri/Cargo.toml                tauri 2, shell, single-instance, getrandom, libc
src-tauri/Cargo.lock                gehört ins Repository
src-tauri/build.rs
src-tauri/rustfmt.toml              max_width 110
src-tauri/tauri.conf.json           Fenster, CSP, devCsp, externalBin, nsis/deb/appimage
src-tauri/capabilities/default.json bewusst kurz: core:default plus start-dragging
src-tauri/src/main.rs               vier Zeilen
src-tauri/src/lib.rs                Startreihenfolge, vier Befehle, Fensterereignisse
src-tauri/src/sidecar.rs            Startgeheimnis, stdin, Beenden, Beendigungscodes
src-tauri/src/identity.rs           GetUserNameW / GetUserNameExW / getpwuid
src-tauri/src/appdata.rs            E-018, 0700 bzw. ACL, Warnung vor Netz- und Sync-Pfaden
src-tauri/src/menu.rs               deutsches Menü, sendet Ereignisse statt zu handeln
src-tauri/icons/                    17 Dateien aus `tauri icon`
icons/quelle.png                    1024×1024, Akzentfarbe aus tokens.css
```

Geändert, ausschließlich zur Einbindung:

```
package.json (Wurzel)   zwei neue Skripte: desktop, desktop:build
pnpm-lock.yaml          fünf neue Pakete
```

**Die `check`-Kette und das `contrast`-Skript sind unverändert.** `apps/desktop` hat bewusst
**kein** `build`-Skript, damit `pnpm build` an der Wurzel (`pnpm -r --if-present build`) nicht
plötzlich einen Tauri-Bau auslöst.

Nicht angefasst: `apps/local-api/**`, `packages/**`, `apps/web/**`, `docs/**`,
`pnpm-workspace.yaml` (`apps/*` deckt das neue Paket ab), alles unter `.claude/` außer diesem
Bericht. Kein `git commit`.

---

Zusammenfassung:

Die Hülle steht und läuft, und die Bündelung ist nicht angenommen, sondern ausgeführt: neun
Prüfungen gegen die entstandene Binärdatei, vier Lebenszyklusprüfungen gegen die gebaute
Anwendung, zwölf Rust-Tests. `pnpm desktop` startet Takt, `pnpm desktop:build` baut es
vollständig durch (Exitcode 0, zwei Installationspakete). Der Sidecar bekommt sein
Startgeheimnis über `stdin`, das Anwendungsdatenverzeichnis entsteht mit `0700`, bevor der
Dienst startet, und ein verwaister Dienst nach dem Beenden ist ausgeschlossen — auch nach
`kill -9` auf die Hülle.

Zwei Befunde haben den Weg gekostet und beide stecken jetzt als Gegenmittel im Bauablauf. Der
erste: Die Node-Binärdatei dieses Rechners lässt sich **nicht** zu einer Einzeldatei-Anwendung
machen — sie entsteht, stirbt aber beim Start mit SIGSEGV. Der zweite: Der AppImage-Schritt
scheitert an einem eingefrorenen `strip` in `linuxdeploy`. Beide sind unten im Einzelnen
belegt.

Der Windows-Anteil ist **übersetzt, aber nicht ausgeführt**: `cargo check --target
x86_64-pc-windows-msvc` läuft durch, einschließlich der Systemaufrufe für den Benutzernamen und
des `icacls`-Zweigs. Was dieser Rechner nicht kann, ist binden und laufen lassen. Das ist eine
benannte Lücke und keine Behauptung.

---

Annahmen:

1. **Die Node-Laufzeit wird heruntergeladen und gegen eine Prüfsumme im Repository geprüft.**
   Das ist die größte Entscheidung dieser Aufgabe und sie war erzwungen. Der ursprüngliche Weg
   war, `process.execPath` zu kopieren und den SEA-Blob hineinzulegen. Das Ergebnis:

   ```
   $ ./src-tauri/binaries/takt-local-api-x86_64-unknown-linux-gnu
   EXIT=139
   ```

   139 ist SIGSEGV — vor der ersten Zeile JavaScript. `postject` meldet beim Einfügen
   `warning: Can't find string offset for section name '.note'`, schreibt die Datei trotzdem,
   und die Datei ist kaputt. Nachgestellt mit einem `console.log("hallo")` als einzigem Inhalt:
   derselbe Absturz. Mit der offiziellen Binärdatei von nodejs.org **derselben Fassung**
   (22.23.2) tritt er nicht auf.

   Der Weg ist damit: Archiv laden, SHA-256 gegen den Wert in `scripts/sidecar-runtime.mjs`
   prüfen, entpacken, Blob mit dieser Laufzeit erzeugen, Blob in dieselbe Laufzeit legen. Die
   Prüfsummen aller sechs unterstützten Plattformen stehen im Repository, nicht in einer
   mitheruntergeladenen Datei — wer die Auslieferung von nodejs.org übernimmt, kommt damit
   nicht durch.

   Zwei Nebenwirkungen, offen ausgesprochen: Der Bau braucht **beim ersten Mal** Netz (31 MiB,
   danach im Zwischenspeicher), und die Sidecar-Binärdatei ist **120 MiB** groß. Im
   Debian-Paket schrumpft das auf 46 MiB, weil dort komprimiert wird; für Windows gilt
   dasselbe über NSIS.

2. **Node-SEA statt `pkg` oder „Bündel plus installiertes Node".** E-035 wählt `node:sqlite`,
   weil es Teil der Laufzeit ist und nichts ins Bündel zieht. Das trägt nur, wenn die Laufzeit
   mitkommt: `node:sqlite` gibt es erst ab Node 22.5. Ein Bündel, das ein installiertes Node
   voraussetzt, scheitert auf dem Rechner des Auftraggebers an einer Fassung, über die niemand
   entschieden hat — und zwar erst beim ersten Datenbankzugriff. `@yao-pkg/pkg` wäre die
   Alternative gewesen; sie hätte eine große, nicht überprüfte Abhängigkeit in die Lieferkette
   geholt, wo SEA Teil der Laufzeit ist.

3. **`sidecar/entry.ts` als eigener Einstiegspunkt.** Node baut SEA nur aus **CommonJS**.
   `apps/local-api/src/index.ts` hat `await main()` auf oberster Ebene, und Top-Level-`await`
   lässt sich nicht nach CommonJS übersetzen — esbuild bricht dort ab. Die neue Datei ruft
   dieselbe Funktion ohne Top-Level-`await`. Sie enthält keine Fachlogik und ist der einzige
   Unterschied zwischen dem Dienst im Entwicklungsbetrieb und dem in der Hülle.

4. **Die Regel für das Anwendungsdatenverzeichnis steht zweimal.** Einmal in
   `apps/local-api/src/access/paths.ts`, einmal in `src-tauri/src/appdata.rs`. Das ist eine
   Dopplung und ich habe sie bewusst in Kauf genommen: Die Hülle muss das Verzeichnis anlegen
   und die Rechte setzen, **bevor** der Dienst startet (unter Windows trägt die ACL die Grenze,
   und Node kann sie dort nicht setzen — T-011 Risiko 2), und der Dienst darf keinen Pfad als
   Argument annehmen (B-1.6 Punkt 1). Beide Seiten müssen die Regel also kennen. Gegenmittel:
   Die Rust-Seite ist eine reine Funktion mit sieben Tests, die dieselben Fälle abdecken wie die
   TypeScript-Seite, einschließlich „`%APPDATA%` ist gesetzt und wird trotzdem nicht benutzt".

   **Ausdrücklich nicht benutzt: Tauris `app_local_data_dir()`.** Das liefert
   `%LOCALAPPDATA%\de.takt.desktop`, also einen anderen Ordner als der Sidecar. Der Fehler wäre
   still gewesen: Die Hülle hätte die Rechte auf einem leeren Verzeichnis gesetzt und die
   Datenbank läge daneben, offen.

5. **Die Systemaufrufe für den Benutzernamen sind von Hand deklariert.** Zwei Funktionen aus
   zwei Systembibliotheken (`advapi32!GetUserNameW`, `secur32!GetUserNameExW`) über
   `extern "system"`. Die Alternative wäre das `windows`- oder `windows-sys`-Paket gewesen,
   dessen Modulpfade sich zwischen Fassungen verschieben — mehr Fläche und mehr Bruchgefahr für
   zwei Signaturen. Der Aufruf ist genau der aus B-8.1 Punkt 1 gefordert. `env::var("USERNAME")`,
   `USERPROFILE` und ein Unterprozess `whoami` kommen im Pfad des Benutzernamens **nicht** vor,
   auf keiner Plattform: Auch unter Unix läuft es über `getpwuid(geteuid())` und nicht über
   `$USER`.

6. **Beide Schreibweisen des Namens werden geliefert, keine ausgewählt.** `name` ist der nackte
   Anmeldename, `qualifiedName` der mit Domäne (`KONTOSO\mmueller`). B-8.2 Punkt 4 nennt es
   offen, welchen das Abrechnungstool erwartet. Ich habe nicht gewählt, sondern beides
   weitergereicht — siehe offene Frage 2.

7. **Die Windows-ACL läuft über `icacls`, nicht über `SetNamedSecurityInfoW`.** Aufgerufen mit
   absolutem Pfad aus `%SystemRoot%\System32\`, nicht über die `PATH`-Suche — derselbe Grund,
   aus dem B-8.1 den Unterprozess `whoami` ablehnt. Zwei Berechtigte: `SYSTEM` als feste SID
   (`*S-1-5-18`, weil der Name in einer anderen Sprachfassung anders lautet) und das laufende
   Konto über `GetUserNameExW`. Die Alternative — die DACL von Hand über die Win32-API bauen —
   wären achtzig Zeilen `unsafe`, die ich auf diesem Rechner nicht ausführen kann. Das war mir
   zu viel ungeprüfter Code an einer Stelle, an der ein Fehler die Datenbank offen lässt.

   `apply_permissions` gibt zurück, ob es geklappt hat. Ein Fehlschlag **bricht den Start
   nicht ab**, sondern landet in `shellState().problems` — B-7.2 Punkt 3 verlangt sichtbare
   Warnung, und ein Abbruch ließe den Benutzer ohne Anwendung und ohne Möglichkeit, den Zustand
   zu ändern.

8. **Kein `prevent_close()` beim Fensterkreuz — noch nicht.** E-036 verlangt beim geordneten
   Beenden die Frage nach einem laufenden Timer. Dafür müsste `CloseRequested` das Schließen
   anhalten, ein Ereignis senden und auf die Oberfläche warten. Solange die Oberfläche darauf
   nicht hört, wäre das eine Anwendung, die sich nicht schließen lässt — der schlechtere Fehler.
   Der Umbau ist eine Zeile, die Stelle ist im Quelltext benannt und der Weg dorthin
   (`takt_quit`, `SHELL_EVENTS.quitRequested`) steht bereits.

9. **`NO_STRIP=true` und `APPIMAGE_EXTRACT_AND_RUN=1` nur unter Linux**, gesetzt in
   `scripts/build-app.mjs` statt im Paketskript, weil `VAR=x befehl` unter Windows nicht
   funktioniert. Betrifft ausschließlich den AppImage-Schritt auf dem Entwicklungsrechner.

10. **Die Fähigkeitenliste des Fensters ist kurz gehalten:** `core:default` und
    `core:window:allow-start-dragging`. Insbesondere **kein** `shell:allow-execute` — der
    Webview kann keine Prozesse starten. Der Sidecar wird ausschließlich von der Rust-Seite
    gestartet, und dort greift die Fähigkeitenliste nicht.

---

Der Nachweis, im Einzelnen

**Die gebündelte Binärdatei läuft.** `pnpm --filter @takt/desktop sidecar:verify`, wörtlich:

```
Nachweis gegen apps/desktop/src-tauri/binaries/takt-local-api-x86_64-unknown-linux-gnu

  ok    Ohne Startgeheimnis endet der Dienst mit Code 78
  ok    Die Abbruchmeldung nennt kein Geheimnis
  ok    Mit Startgeheimnis über stdin kommt der Dienst hoch
  ok    GET /health mit Sitzungsgeheimnis ergibt 200
  ok    Die Antwort ist {"data":{"status":"ok"}}
  ok    Dieselbe Anfrage ohne Nachweis ergibt 401
  ok    Das von der Hülle angelegte Verzeichnis bleibt bei 0700
  ok    Nach dem Schließen von stdin endet der Dienst
  ok    Kein Geheimnis in der Ausgabe des Dienstes

9 bestanden, 0 fehlgeschlagen.
```

**R-04 hat einen ausführbaren Wächter.** `scripts/build-sidecar.mjs` liest das Metadatenblatt
von esbuild und bricht ab, wenn irgendetwas außer `node:*` extern geblieben ist. Der Stand
heute:

```
[2/5] Prüfen, dass nichts extern geblieben ist
      @takt/local-api: 17 Datei(en) — im Bündel
      @takt/domain: 0 Datei(en) — zur Laufzeit nicht benutzt (heute nur Typen)
      @takt/storage: 0 Datei(en) — zur Laufzeit nicht benutzt (heute nur Typen)
      Bündel: apps/desktop/.sidecar-build/sidecar.cjs (668 KiB)
```

Die beiden Nullen sind kein Versäumnis: `@takt/storage` exportiert heute ausschließlich Typen
(`export type * from './ports.js'`), und `apps/local-api` importiert `@takt/domain` zur Laufzeit
noch nicht. Sobald T-009 das ändert, tauchen die Dateien in dieser Zeile auf — und wenn ein
Bündler sie stattdessen als „external" führt, bricht der Bau mit einer Meldung, die R-04 beim
Namen nennt. **Der Wächter ist heute noch nicht scharf geworden, weil es nichts zu fangen gab.
Das ist der Punkt, an dem T-009 hinschauen muss.**

**`pnpm desktop`** — wörtlich, gekürzt um die Fortschrittsbalken:

```
$ pnpm --filter @takt/desktop app:dev
$ node scripts/build-sidecar.mjs && tauri dev
[1/5] Bündeln mit esbuild
[2/5] Prüfen, dass nichts extern geblieben ist
      @takt/local-api: 17 Datei(en) — im Bündel
      @takt/domain: 0 Datei(en) — zur Laufzeit nicht benutzt (heute nur Typen)
      @takt/storage: 0 Datei(en) — zur Laufzeit nicht benutzt (heute nur Typen)
      Bündel: apps/desktop/.sidecar-build/sidecar.cjs (668 KiB)
[3/5] Node-Laufzeit 22.23.2 für x86_64-unknown-linux-gnu bereitstellen
      Laufzeit: apps/desktop/.sidecar-runtime/x86_64-unknown-linux-gnu-node
[4/5] SEA-Blob erzeugen
[5/5] Binärdatei zusammensetzen (takt-local-api-x86_64-unknown-linux-gnu)

Fertig: apps/desktop/src-tauri/binaries/takt-local-api-x86_64-unknown-linux-gnu (120 MiB)
Node-Fassung im Bündel: v22.23.2 (offizielle Binärdatei, Prüfsumme geprüft)
Nachweis, dass sie wirklich läuft: pnpm --filter @takt/desktop sidecar:verify
     Running BeforeDevCommand (`pnpm --filter @takt/web dev`)
$ vite

  VITE v7.3.6  ready in 95 ms

  ➜  Local:   http://127.0.0.1:5173/
     Running DevCommand (`cargo  run --no-default-features --color always --`)
        Info Watching /home/kerem/Projects/SuperTakt/apps/desktop/src-tauri for changes...
   Compiling takt-desktop v0.0.0 (/home/kerem/Projects/SuperTakt/apps/desktop/src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 9.02s
     Running `target/debug/takt-desktop`
[dienst] {"ts":"2026-09-01T01:14:24.226Z","level":"info","message":"Es ist noch kein Add-in-Token eingerichtet."}
[dienst] {"ts":"2026-09-01T01:14:24.231Z","level":"info","message":"Takt lauscht auf 127.0.0.1:17843."}
```

Dazu gemessen, während es lief:

```
### Prozesse
 798361  798137 takt-desktop
 798950  798361 takt-local-api        ← Kindprozess der Hülle
### Port
LISTEN 0  511  127.0.0.1:17843  0.0.0.0:*
### Verzeichnis
drwx------ 2 kerem kerem 4096  1. Sep 02:55 /home/kerem/.local/share/takt
### Nach dem Beenden
Hüllen: 0  Sidecars: 0
```

**`pnpm desktop:build`** — wörtlich, letzte Zeilen:

```
   Compiling takt-desktop v0.0.0 (/home/kerem/Projects/SuperTakt/apps/desktop/src-tauri)
    Finished `release` profile [optimized] target(s) in 53.58s
       Built application at: /home/kerem/Projects/SuperTakt/apps/desktop/src-tauri/target/release/takt-desktop
        Info Patching ... with bundle type information: deb
    Bundling Takt_0.0.0_amd64.deb (.../bundle/deb/Takt_0.0.0_amd64.deb)
        Info Patching ... with bundle type information: appimage
    Bundling Takt_0.0.0_amd64.AppImage (.../bundle/appimage/Takt_0.0.0_amd64.AppImage)
    Finished 2 bundles at:
        /home/kerem/Projects/SuperTakt/apps/desktop/src-tauri/target/release/bundle/deb/Takt_0.0.0_amd64.deb
        /home/kerem/Projects/SuperTakt/apps/desktop/src-tauri/target/release/bundle/appimage/Takt_0.0.0_amd64.AppImage

EXIT=0
```

**Der erste Bauversuch war rot, und der Grund ist ein Befund.** Wörtlich:

```
    Bundling Takt_0.0.0_amd64.AppImage (.../bundle/appimage/Takt_0.0.0_amd64.AppImage)
failed to bundle project: `failed to run linuxdeploy`
       Error failed to bundle project: `failed to run linuxdeploy`
EXIT=1
```

Diese Meldung nennt die Ursache nicht. Mit `--verbose` steht sie hundertfach im Protokoll:

```
ERROR: Strip call failed: /tmp/appimage_extracted_.../usr/bin/strip:
  .../Takt.AppDir/usr/lib/libwebkit2gtk-4.1.so.0:
  unknown type [0x13] section `.relr.dyn'
```

`linuxdeploy` bringt ein eingefrorenes `strip` von Juli 2024 mit, und die Systembibliotheken
dieser Verteilung tragen inzwischen den Abschnitt `.relr.dyn`. Mit `NO_STRIP=true` gelingt der
Bau; die Variable steht jetzt in `scripts/build-app.mjs`. **Der Befund betrifft nur Linux und
damit nur den Entwicklungsrechner** — die Auslieferung an den Auftraggeber ist Windows und NSIS.

**Der Lebenszyklus, vier Fälle gegen die gebaute Anwendung:**

```
### 1  Erster Start
Hüllen:   1        Sidecars: 1        Port belegt: 1

### 2  Zweiter Start (Einzelinstanz, B-1.6 Punkt 5)
Rückgabecode des zweiten Starts: 0
Hüllen danach:   1        Sidecars danach: 1      ← kein zweiter Dienst
Ausgabe des zweiten Starts: (leer)

### 3  Geordnetes Beenden mit SIGTERM
Hüllen:   0        Sidecars: 0        Port 17843: frei

### 4  Neustart und hartes Beenden mit SIGKILL
vorher  — Hüllen: 1  Sidecars: 1
nachher — Hüllen: 0  Sidecars: 0      Port 17843: frei
```

Fall 4 ist der wichtigste. Die Hülle kommt bei `kill -9` zu keinem Aufräumen; dass der Dienst
trotzdem stirbt, liegt am zweiten Weg: Das Betriebssystem schließt die `stdin`-Röhre, und
`watchParentLink` aus T-011 zieht die Konsequenz. Zwei unabhängige Maßnahmen, und die zweite
wirkt genau dort, wo die erste nicht mehr laufen kann.

**Die Herkunft des Webviews ist gemessen, nicht geraten** — die offene Frage 4 aus T-011.
Auslieferungsbau, Tauri 2.11.5, WebKitGTK 2.52.5, Linux:

```
--- OPTIONS /messung
ORIGIN-KOPFZEILE: "tauri://localhost"
SEC-FETCH-SITE  : "cross-site"
SEC-FETCH-MODE  : "cors"
--- POST /messung
ORIGIN-KOPFZEILE: "tauri://localhost"
RUMPF           : {"locationOrigin":"tauri://localhost","href":"tauri://localhost"}
```

Die Vorabanfrage geht heraus, `Sec-Fetch-Mode: cors`, `Sec-Fetch-Site: cross-site` — alle drei
Werte kommen durch `checkOrigin` aus T-011 sauber durch, weil `tauri://localhost` auf der
Positivliste steht. Gemessen mit einem Wegwerf-Bau über `tauri build --config`; danach wurde
der Auslieferungsbau mit der echten Oberfläche neu erzeugt.

**Die übrigen Läufe:**

```
cargo test                                     12 bestanden, 0 fehlgeschlagen
cargo clippy --all-targets -- -D warnings      Exitcode 0
cargo fmt --check                              Exitcode 0
cargo check --target x86_64-pc-windows-msvc    Exitcode 0
pnpm typecheck (Wurzel, sechs Pakete)          Exitcode 0
pnpm boundaries                                Exitcode 0, Notiz-Trennung unverletzt
pnpm contrast                                  0 von 150 Paaren durchgefallen
pnpm build (Wurzel)                            Exitcode 0, nur apps/web — wie vorher
```

`pnpm check` habe ich **nicht** als Ganzes gefahren: Er bricht weiterhin bei `test:coverage` ab,
weil die Tests aus T-010 vor der Umsetzung stehen. Das ist der von T-011 gemeldete Zustand und
nicht meiner; die vier anderen Glieder sind oben einzeln belegt und grün.

---

Risiken:

1. **Der Windows-Anteil ist übersetzt, aber nie ausgeführt.** `cargo check --target
   x86_64-pc-windows-msvc` läuft durch — die FFI-Deklarationen, der `icacls`-Zweig,
   `GetDriveTypeW`, alles typgeprüft. Was fehlt, ist Binden und Laufen: Der Rechner hat keine
   MSVC-Werkzeuge und kein Windows. Konkret ungeprüft bleiben (a) ob `GetUserNameExW` den
   erwarteten Namen liefert, (b) ob der `icacls`-Aufruf durchgeht, (c) ob der Sidecar unter
   Windows das Startgeheimnis über die Röhre bekommt. **Der erste Start auf einem
   Windows-Rechner ist deshalb ein Prüfschritt und keine Formalie.** Was dort zu prüfen ist,
   steht unten unter „Nächster Schritt".

2. **Die Sidecar-Binärdatei ist 120 MiB groß.** Das ist die vollständige Node-Laufzeit, und sie
   muss mit (E-035, siehe Annahme 1). Im Debian-Paket sind es 46 MiB; NSIS komprimiert
   vergleichbar. Wen das stört, dem bleibt nur, `node:sqlite` aufzugeben und auf ein natives
   Modul zu wechseln — genau der Weg, den E-035 als den fummeligsten Teil eines Tauri-Aufbaus
   verworfen hat. Ich halte den Handel für richtig, aber er ist einer.

3. **Der Bau braucht beim ersten Mal Netz.** 31 MiB von nodejs.org, danach im Zwischenspeicher
   unter `apps/desktop/.sidecar-runtime/`. Auf einem Rechner ohne Netz schlägt der erste Bau
   fehl. Milderung wäre, die Laufzeit ins Repository zu legen — 120 MiB Binärdatei in der
   Historie, dagegen habe ich mich entschieden.

4. **`icacls` setzt die Rechte nur auf dem Verzeichnis, nicht rückwirkend auf Kinder.** Bei
   einer Neuinstallation ist das richtig: Das Verzeichnis entsteht, bevor der Dienst
   hineinschreibt, und alles Spätere erbt. Bei einer **Aktualisierung über einen Bestand, der
   vor dieser Fassung angelegt wurde**, behalten vorhandene Dateien ihre alten, geerbten
   Rechte. Der saubere Weg wäre `icacls <dir>\* /reset /T` nach dem Setzen; ich habe ihn nicht
   gebaut, weil er ohne Windows nicht prüfbar ist und ein falsch gesetztes `/reset` schlimmer
   wäre als das Problem. Solange es keinen ausgelieferten Bestand gibt, ist der Fall
   theoretisch — er wird real, sobald der Auftraggeber die erste Fassung benutzt hat.

5. **Die Regel für das Datenverzeichnis steht in zwei Sprachen** (Annahme 4). Wer eine Seite
   ändert und die andere vergisst, bekommt einen stillen Fehler: Die Hülle setzt Rechte auf
   einem leeren Ordner, die Datenbank liegt woanders und offen. Die Rust-Tests decken die Regel
   ab, aber sie erzwingen nicht, dass beide Seiten dieselbe ist. Eine Prüfung, die das täte,
   müsste die TypeScript-Seite aufrufen und gehört damit in `apps/local-api` — nicht meine
   Hoheit.

6. **Das Sitzungsgeheimnis liegt im Webview.** Jeder Code, der dort läuft, kann es lesen und
   damit alles, was die Oberfläche kann. Dagegen wirken die enge Sicherheitsrichtlinie
   (`default-src 'none'`, `script-src 'self'`) und die kurze Fähigkeitenliste. Das ist die
   bekannte Grenze des Verfahrens aus T-011 und keine neue Lücke — aber sie heißt, dass jede
   künftige Abhängigkeit im Webview mit diesem Maßstab zu betrachten ist.

7. **`useHttpsScheme` darf nicht auf `true`.** Der Schalter steht auf `false`. Mit `https`
   verweigert der Webview aus Gründen gemischter Inhalte jede Anfrage an
   `http://127.0.0.1:17843` — die Anwendung wäre schlicht kaputt. Steht als Warnung im README;
   in `tauri.conf.json` geht es nicht, weil JSON keine Kommentare kennt.

8. **Der AppImage-Bau hängt an zwei Umgebungsvariablen** (Annahme 9). Fällt jemand auf
   `pnpm exec tauri build` statt auf `pnpm desktop:build` zurück, bekommt er wieder
   `failed to run linuxdeploy` ohne Ursache. Betrifft nur Linux.

9. **`packages/export` hat keine `package.json`** und ist damit kein Arbeitsbereichspaket. Fällt
   hier nur auf, weil mein Wächter drei Pakete namentlich zählt und dieses vierte nicht kennt.
   Sobald es eines wird und der Dienst es benutzt, gehört es in die Liste in
   `scripts/build-sidecar.mjs`.

---

Offene Fragen:

1. **An den Orchestrator und den domain-dev, entscheidungsbedürftig: Wie kommt der
   Windows-Benutzername in den Sidecar?** B-8.2 Punkt 2 verlangt, dass die Übergabe über
   denselben abgesicherten Startkanal läuft wie das Startgeheimnis — `stdin` oder die geerbte
   Umgebung des Kindprozesses —, und **nicht** über `argv`. Heute stellt die Hülle den Wert nur
   der **Oberfläche** bereit (`takt_os_user`). Der Sidecar liest von `stdin` genau eine Zeile,
   nämlich das Geheimnis, und kennt den Namen nicht.

   Das trägt, solange der Export in der Oberfläche zusammengesetzt wird. Läuft der
   Vorlagenmotor im Dienst — und danach sieht `packages/export` aus —, braucht der Dienst den
   Wert. Dann ist eine **zweite Zeile auf `stdin`** die naheliegende Erweiterung: erst das
   Geheimnis, dann der Name. Das ist eine Änderung an `apps/local-api/src/main.ts` und
   `session-secret.ts` und damit nicht meine Hoheit. Ich habe sie nicht gebaut und auch nicht
   über eine Umgebungsvariable gelöst, obwohl B-8.2 die geerbte Umgebung zuließe — eine
   Umgebungsvariable namens etwa `TAKT_OS_USER` wäre optisch von der verbotenen `USERNAME`
   kaum zu unterscheiden und die nächste Person würde sie für dasselbe halten.

2. **An den Auftraggeber, über den Orchestrator: Nackter Name oder `DOMAIN\benutzer`?** B-8.2
   Punkt 4 stellt die Frage und beantwortet sie nicht. Die Hülle liefert beides
   (`name`, `qualifiedName`). Für den Export muss einer gewählt werden, und die Wahl gehört zu
   dem, der die Datei einliest — nicht zu uns. Bis dahin ist `name` die naheliegende Vorgabe,
   weil A-8.5 „WindowsUser" sagt und nicht „Domäne und Benutzer".

3. **An den domain-dev: `https://tauri.localhost` kann aus `ALLOWED_ORIGINS`.** Es entsteht nur
   mit `useHttpsScheme = true`, und der Schalter darf nicht umgelegt werden (Risiko 7). Die
   beiden anderen bleiben: `tauri://localhost` ist unter Linux gemessen und gilt auch für
   macOS, `http://tauri.localhost` ist die Windows-Fassung und **hier nicht messbar**. Der
   Eintrag ist damit von drei geratenen auf einen gemessenen, einen belegten und einen zu
   streichenden geschrumpft. Die Datei ist nicht meine Hoheit; ich habe sie nicht angefasst.

4. **An den Orchestrator: Wer prüft die Windows-Seite und wann?** Risiko 1 lässt sich nicht
   durch mehr Sorgfalt schließen, sondern nur durch einen Windows-Rechner. Solange das nicht
   geschehen ist, ist die Aussage „E-010 ist umgesetzt" für Windows genau so belastbar wie
   „es übersetzt" — mehr nicht.

5. **An den frontend-dev der nächsten Welle: Drei Zustände aus Abschnitt 15 warten auf eine
   Anzeige.** `shellState()` liefert sie fertig, aber niemand stellt sie dar:
   - `problems` — Rechte nicht gesetzt, Verzeichnis nicht anlegbar, `%LOCALAPPDATA%` fehlt,
     Sidecar nicht gestartet. Deutsche Sätze, direkt anzeigbar.
   - `directory.syncWarning` — der Datenordner liegt auf einem Netzlaufwerk oder in OneDrive
     (B-7.1 Punkt 2, R-13). Das ist die Warnung, die eine beschädigte Datenbank verhindert.
   - `serviceExit` — der lokale Dienst ist weg, mit einem erklärenden Satz statt einer
     Codenummer. „Der Port 17843 ist belegt … Läuft Takt bereits?" gehört auf den Bildschirm
     und nicht auf `stderr`.

6. **Hinweis, kein Blocker:** Der zweite Start bringt heute das vorhandene Fenster nach vorn
   und beendet sich mit 0 — geprüft. Was er **nicht** tut, ist dem Benutzer zu sagen, warum
   kein zweites Fenster kommt. Auf einem Rechner, auf dem Takt minimiert im Hintergrund läuft,
   sieht ein Doppelklick nach „nichts passiert" aus. Eine Zeile in der Oberfläche wäre die
   Lösung; ich habe sie nicht erfunden.

---

Nächster Schritt:

1. **Der Auftraggeber startet und baut so:**

   ```
   pnpm desktop          startet Takt (baut den Sidecar mit)
   pnpm desktop:build    baut Takt einschließlich Installationspaket
   ```

   Beim allerersten Lauf werden 31 MiB Node-Laufzeit geladen; danach nicht mehr.

2. **Auf dem ersten Windows-Rechner sind fünf Dinge zu prüfen**, in dieser Reihenfolge, und
   jedes einzeln:
   - Startet `pnpm desktop:build` durch und entsteht ein NSIS-Installationsprogramm?
   - Erscheint `%LOCALAPPDATA%\Takt\`, und zeigt `icacls "%LOCALAPPDATA%\Takt"` genau zwei
     Einträge — das eigene Konto und `NT-AUTORITÄT\SYSTEM`, ohne `(I)` davor?
   - Steht in `takt_os_user()` der richtige Name, **auch wenn** man Takt mit
     `set USERNAME=fremder && Takt.exe` startet? Das ist die Prüfung aus B-8.1, und sie ist die
     wichtigste von allen.
   - Läuft nach dem Schließen von Takt noch ein `takt-local-api.exe` im Task-Manager? Es darf
     nicht.
   - Ist die Herkunft im Auslieferungsbau tatsächlich `http://tauri.localhost`?

3. **T-009 hängt seine Router unter dieselbe Kette** wie T-011 es sagt — und schaut beim ersten
   Import aus `@takt/domain` oder `@takt/storage` auf die Zeile `[2/5]` im Bauablauf. Steht dort
   weiterhin `0 Datei(en)`, obwohl der Dienst das Paket benutzt, ist R-04 eingetreten und der
   Bau sagt es.

4. **Der security-checker hat drei neue Flächen:** die Fähigkeitenliste in
   `src-tauri/capabilities/default.json`, die beiden Sicherheitsrichtlinien in
   `tauri.conf.json` (`csp` und `devCsp` — die zweite ist bewusst lockerer und gilt nur im
   Entwicklungsbetrieb), und den Bezug der Node-Laufzeit in `scripts/sidecar-runtime.mjs`. Die
   Semgrep-Regel aus B-8.1 Punkt 2 — `env::var` darf im Pfad des Benutzernamens nicht
   vorkommen — lässt sich jetzt schreiben; `src-tauri/src/identity.rs` ist die Datei, gegen die
   sie laufen muss.

5. **Der Orchestrator entscheidet offene Frage 1**, bevor der Vorlagenmotor an den
   `WindowsUser` geht. Danach ist es eine Änderung an einer laufenden Schnittstelle statt an
   einer leeren.

---

## Nachtrag — E-042 (zweite `stdin`-Zeile) und E-043 (`useHttpsScheme`)

Status: fertig

Auf Weisung des Orchestrators nach Abschluss von T-008b nachgezogen. Meine offene Frage 1 ist
damit entschieden und beantwortet, offene Frage 3 ebenfalls.

### Was geändert wurde

```
src-tauri/src/sidecar.rs      handshake_line(), zwei Zeilen in einem Schreibvorgang,
                              Prüfung des Namens vor dem Start, fünf neue Tests
src-tauri/src/lib.rs          Startreihenfolge auf sechs Schritte, identity::current()
                              vor sidecar::start(), Begründung für den nackten Namen
src-tauri/tauri.conf.json     useHttpsScheme: false, ausgeschrieben mit dem E-043-Wortlaut
src-tauri/Cargo.toml          config-json5 auf tauri und tauri-build, begründet
scripts/verify-sidecar.mjs    zwölf statt neun Prüfungen, zwei neue für E-042
src/shell.ts                  Hinweis an osUser(), dass der Dienst den Namen selbst bekommt
README.md                     neuer Abschnitt „Die zwei Startzeilen", Herkunft nachgezogen
```

Nicht angefasst: alles außerhalb `apps/desktop/**` und dieser Bericht.

### 1 — Die zweite Zeile (E-042)

Beide Zeilen gehen in **einem** `child.write(...)` heraus, wie verlangt:

```
<sitzungsgeheimnis>\n<windows-benutzername>\n
```

Der Name kommt aus `identity::current().name`, also aus `GetUserNameW` beziehungsweise
`getpwuid(geteuid())` — an `USERNAME` hat die Hülle nie gerührt und rührt es weiterhin nicht.

**Ich habe die Prüfung des Namens auf der Hüllenseite gedoppelt, bewusst.** Der Dienst prüft
ohnehin (nicht leer, ≤ 256 Zeichen, keine Steuerzeichen), aber sein Nein kommt als Exitcode 78
nach bis zu fünf Sekunden Zeitüberschreitung — und 78 heißt dann dreierlei gleichzeitig:
Geheimnis fehlt, Name fehlt, Datenverzeichnis fehlt. Die Hülle prüft deshalb **vor** dem Start
und legt einen verständlichen deutschen Satz in `shellState().problems`, statt einen
Kindprozess an eine Röhre zu hängen, aus der nie etwas Gültiges kommt.

Der Fall, der die Prüfung wirklich trägt, ist das Steuerzeichen: Ein Name mit `\n` darin würde
das Zeilenprotokoll dieser Röhre aufbrechen und dem Dienst eine dritte Zeile unterschieben. Der
Test dazu heißt `steuerzeichen_im_namen_werden_abgewiesen` und prüft zusätzlich, dass die
Fehlermeldung den Wert **nicht** wiedergibt — eine Meldung, die fremde Eingabe wörtlich
ausgibt, ist der bequemste Weg, ein Protokoll zu fälschen.

**Geliefert wird der nackte Name** (`mmueller`), nicht `KONTOSO\mmueller`. A-8.5 nennt das Feld
`WindowsUser` und nicht „Domäne und Benutzer", und B-8.2 Punkt 4 ist weiterhin offen. Beide
Werte stehen der Oberfläche über `takt_os_user` zur Verfügung; fällt die Entscheidung anders
aus, ist es **eine Zeile** in `lib.rs` und keine Änderung an der Startkette. Die Stelle ist im
Quelltext als solche beschriftet.

### 2 — Der Kommentar am Schalter (E-043)

Das ging nicht ohne einen Eingriff, und der gehört benannt: **Reines JSON kennt keine
Kommentare.** Tauri fällt bei `tauri.conf.json` auf JSON5 zurück, aber nur mit der
Übersetzungskennzeichnung `config-json5`. Ohne sie bricht der Bau ab — belegt:

```
unable to parse JSON Tauri config file at .../tauri.conf.json
because key must be a string at line 23 column 9
```

Die Kennzeichnung steht jetzt auf `tauri` **und** `tauri-build`; die Kommandozeile beherrscht
JSON5 von sich aus (`pnpm exec tauri info` lief bereits vor der Änderung durch). Danach:
`cargo check` grün, `pnpm desktop` grün, `pnpm desktop:build` grün — alle drei unten belegt.

Die drei Alternativen waren schlechter. `tauri.conf.json` in `tauri.conf.json5` umzubenennen
hätte dasselbe Kennzeichen gebraucht und zusätzlich jedem, der die Datei sucht, den gewohnten
Namen genommen. Einen Zusatzschlüssel als Kommentar einzuschmuggeln geht nicht: Tauris
Konfigurationstypen tragen 41-mal `deny_unknown_fields`, ein unbekannter Schlüssel bricht den
Bau. Und den Text nur ins README zu legen wäre genau das, was der Auftrag ausschließt — der
Grund gehört an den Schalter, nicht in eine Datei daneben.

Der Wortlaut nennt beide Bruchstellen (gemischte Inhalte, gestrichener Positivlisteneintrag),
den Zwang, `ALLOWED_ORIGINS` bewusst wieder aufzunehmen, die zusätzlich anzupassende CSP, den
Umzug von IndexedDB und localStorage — und die Messung aus T-008b als Beleg dafür, was heute
tatsächlich herauskommt.

### 3 — README nachgezogen

Der Abschnitt „Gemessene Herkunft des Webviews" nennt jetzt zwei Einträge statt drei und sagt,
dass `https://tauri.localhost` mit E-043 gestrichen **wurde** — mitsamt Begründung, warum ein
Eintrag, den niemand auslösen kann, keine Vorsorge ist. Dazu ein neuer Abschnitt „Die zwei
Startzeilen (E-042)".

### Nachweise, wörtlich

**`pnpm --filter @takt/desktop sidecar:verify`** — zwölf statt neun Prüfungen:

```
  ok    Ohne Startzeilen endet der Dienst mit Code 78
  ok    Die Abbruchmeldung nennt kein Geheimnis
  ok    Mit Geheimnis, aber ohne Benutzernamen endet der Dienst mit Code 78
  ok    Die Meldung nennt den fehlenden Benutzernamen als Grund
  ok    Auch diese Abbruchmeldung nennt kein Geheimnis
  ok    Mit beiden Startzeilen über stdin kommt der Dienst hoch
  ok    GET /health mit Sitzungsgeheimnis ergibt 200
  ok    Die Antwort ist {"data":{"status":"ok"}}
  ok    Dieselbe Anfrage ohne Nachweis ergibt 401
  ok    Das von der Hülle angelegte Verzeichnis bleibt bei 0700
  ok    Nach dem Schließen von stdin endet der Dienst
  ok    Kein Geheimnis in der Ausgabe des Dienstes

12 bestanden, 0 fehlgeschlagen.
```

Die beiden neuen Prüfungen schicken das Geheimnis **ohne** zweite Zeile und belegen, dass der
Dienst dann mit 78 endet und den fehlenden Benutzernamen als Grund nennt — also dass er ohne
Urheber gar nicht erst hochkommt, statt später eine Abrechnung ohne Namen zu schreiben.

**Ein Zwischenergebnis, das ich nicht unterschlage:** Beim ersten Lauf nach der Änderung waren
drei Prüfungen rot. Ursache war die alte Binärdatei — sie enthielt noch den einzeiligen Leser
und startete mit einer Zeile klaglos durch. Nach `node scripts/build-sidecar.mjs` waren alle
zwölf grün. Der Fehlschlag hat trotzdem etwas gezeigt: Der weitergelaufene Dienst hielt den
Port und ließ die folgenden Prüfungen aus dem **falschen** Grund scheitern. Das Skript räumt
den Fall jetzt selbst auf.

**`pnpm desktop`** — gemessen, während es lief:

```
### Prozesse
 873857  873643 takt-desktop
 874465  873857 takt-local-api
### Port
LISTEN 0  511  127.0.0.1:17843  0.0.0.0:*
### Verzeichnis
drwx------ 2 kerem kerem 4096  1. Sep 02:55 /home/kerem/.local/share/takt
### Ausgabe
[dienst] {"ts":"2026-09-01T02:06:36.148Z","level":"info","message":"Es ist noch kein Add-in-Token eingerichtet."}
[dienst] {"ts":"2026-09-01T02:06:36.153Z","level":"info","message":"Takt lauscht auf 127.0.0.1:17843."}
### Nach dem Beenden
Hüllen: 0  Sidecars: 0
```

**`pnpm desktop:build`**:

```
    Finished 2 bundles at:
        .../bundle/deb/Takt_0.0.0_amd64.deb
        .../bundle/appimage/Takt_0.0.0_amd64.AppImage

EXIT=0
```

**Lebenszyklus, alle vier Fälle erneut gegen die neue Auslieferungsdatei:** Erster Start 1 Hülle
/ 1 Sidecar / Port belegt; zweiter Start Rückgabecode 0 und weiterhin nur eine Hülle und ein
Sidecar; `SIGTERM` beide weg, Port frei; `SIGKILL` beide weg, Port frei.

**Die übrigen Läufe:**

```
cargo test                                     17 bestanden (vorher 12), 0 fehlgeschlagen
cargo clippy --all-targets -- -D warnings      Exitcode 0
cargo fmt --check                              Exitcode 0
pnpm typecheck (Wurzel)                        Exitcode 0
pnpm boundaries                                Exitcode 0
pnpm contrast                                  0 von 150 Paaren durchgefallen
```

Die fünf neuen Tests: `startzeilen_sind_zwei_zeilen_in_dieser_reihenfolge`,
`benutzername_mit_domaene_geht_unveraendert_durch`, `leerer_benutzername_startet_den_dienst_nicht`,
`steuerzeichen_im_namen_werden_abgewiesen`, `zu_langer_name_wird_abgewiesen`.

`cargo check --target x86_64-pc-windows-msvc` habe ich **nicht** erneut gefahren; er verlangt
eine Platzhalterdatei unter `binaries/`, und die Änderung berührt keinen `#[cfg(windows)]`-Zweig.
Wer den Windows-Bau anfasst, sollte ihn wiederholen.

### Was sich an den Risiken ändert

**Neu:** Der Start ist jetzt strenger, und das verschiebt einen Fehlerfall nach vorn. Liefert
`GetUserNameW` unter Windows keinen Namen — Risiko 1 des Hauptberichts, der Zweig ist übersetzt,
aber nie ausgeführt —, dann **startet Takt jetzt ohne lokalen Dienst**. Vorher wäre es mit einem
leeren Namen weitergelaufen. Ich halte das für richtig herum: Ein Dienst, der gar nicht kommt,
fällt sofort auf; eine Abrechnung ohne Urheber fällt erst dem Kunden auf. Die Hülle sagt den
Grund über `shellState().problems`, und der Satz ist deutsch und vollständig. **Aber er wird
heute von niemandem angezeigt** — siehe offene Frage 5 des Hauptberichts, die damit dringender
geworden ist.

**Kleiner geworden:** Offene Frage 1 ist beantwortet, offene Frage 3 erledigt. Offen bleibt
Frage 2 (nackter Name gegen `DOMAIN\benutzer`), und sie ist jetzt billig zu beantworten: eine
Zeile in `lib.rs`, beide Werte liegen bereits vor.

**Unverändert:** Alle übrigen Risiken des Hauptberichts, insbesondere Risiko 1 — der
Windows-Anteil ist übersetzt, nie ausgeführt. Die Prüfliste unter „Nächster Schritt" Punkt 2
bekommt einen sechsten Punkt: **Startet Takt auf Windows überhaupt, das heißt liefert
`GetUserNameW` einen Namen, den der Dienst annimmt?** Das ist ab jetzt die Bedingung dafür, dass
die Anwendung dort läuft, und nicht mehr nur eine Frage der Exportqualität.
