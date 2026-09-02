# `apps/desktop` — die Takt-Hülle

Tauri 2. Der Rust-Anteil ist bewusst dünn (E-004): Fenster, Menü, Lebenszyklus
des lokalen Dienstes, Windows-Benutzername, Anwendungsdatenverzeichnis. **Keine
Fachlogik.** Sie lebt in TypeScript unter `packages/domain` und `apps/local-api`
— das ist der ganze Grund für die Sidecar-Bauweise.

## Befehle

| Befehl | Was er tut |
|---|---|
| `pnpm desktop` | Startet die Anwendung im Entwicklungsbetrieb (Wurzel). |
| `pnpm desktop:build` | Baut die Anwendung mit Installationspaket (Wurzel). |
| `pnpm verify:bundle` | Baut die Sidecar-Binärdatei und führt den Nachweis gegen sie aus (Wurzel). |
| `pnpm --filter @takt/desktop sidecar` | Baut nur die Sidecar-Binärdatei. |
| `pnpm --filter @takt/desktop sidecar:verify` | Startet die gebaute Binärdatei und prüft sie. |
| `pnpm --filter @takt/desktop sidecar:checksums` | Hält die sechs Node-Prüfsummen gegen nodejs.org (T-075). |
| `pnpm --filter @takt/desktop taskpane` | Baut das Add-in und legt sein Bündel für `tauri build` bereit. |
| `pnpm --filter @takt/desktop taskpane:dev` | Dasselbe für `tauri dev`, neben die Binärdatei im Bauordner. |
| `pnpm --filter @takt/desktop licenses` | Erzeugt die Lizenzbeilage für das Paket (T-075). |
| `pnpm --filter @takt/desktop release:collect` | Sammelt die gebauten Installationsdateien mit Prüfsummen ein. |
| `cd apps/desktop/src-tauri && cargo test` | Die Rust-Tests der Hülle. |

Beide Anwendungsbefehle sind seit T-054 vollständige Ketten, seit T-075 mit
einem Glied mehr:

```
build-sidecar.mjs → verify-sidecar.mjs → build-taskpane.mjs → collect-licenses.mjs → tauri dev / build-app.mjs
Binärdatei bauen    sie ausführen und    Aufgabenbereich       Lizenztexte der        starten oder
                    zwanzigmal befragen  danebenlegen          Fremdbestandteile      paketieren
```

(`collect-licenses.mjs` läuft nur in `app:build`; im Entwicklungsbetrieb wird
nichts weitergegeben.)

Der Nachweis in der Mitte ist der eigentliche Befund aus T-053: Es gab ihn
vorher, er stand nur in `app:build` und damit in keiner Kette, die jemand im
Alltag aufruft. `pnpm desktop` rief `build-sidecar && tauri dev`. So ist eine
Fassung entstanden, die gar nicht startete — fünf Sekunden Nachweis hätten
das vor dem Auftraggeber gefunden. Ein Nachweis, den niemand ausführt, ist eine
Behauptung.

Das hat einen Preis im Alltag: Der Nachweis belegt 17843 und 17844
ausschließlich, also **startet `pnpm desktop` nicht, während Takt schon läuft**.
Er bricht dann mit der Meldung ab, woran es liegt, statt gegen einen fremden
Dienst zu prüfen und grün zu melden. Wer nur die Oberfläche braucht, nimmt
`pnpm dev`; wer bewusst ohne Nachweis starten will:

```bash
pnpm --filter @takt/desktop sidecar \
  && pnpm --filter @takt/desktop taskpane:dev \
  && pnpm --filter @takt/desktop tauri dev
```

Die Wurzelskripte heißen bewusst `desktop` und nicht `dev`/`build`: Das
Wurzelskript `build` ruft `pnpm -r --if-present build`, und ein `tauri build`
darin würde die `check`-Kette um Minuten verlängern und auf jedem Rechner ohne
Rust-Toolchain scheitern.

## Wie der Sidecar entsteht

```
sidecar/entry.ts                  ruft main() aus apps/local-api, ohne Top-Level-await
  ↓ esbuild, format cjs, packages: bundle
.sidecar-build/sidecar.cjs        eine Datei, nichts extern außer node:*
  ↓ node --experimental-sea-config
.sidecar-build/sidecar.blob
  ↓ postject in die geprüfte Node-Laufzeit
src-tauri/binaries/takt-local-api-<ziel-tripel>
```

Drei Dinge daran sind nicht beliebig:

1. **Nichts bleibt extern.** `@takt/domain` und `@takt/storage` zeigen in ihren
   `exports` auf Quelltext, nicht auf `dist/`. Der Bündler muss sie
   mitübersetzen. `scripts/build-sidecar.mjs` liest das Metadatenblatt von
   esbuild und bricht ab, wenn etwas anderes als `node:*` extern geblieben ist.
   Das ist R-04.

2. **Die Laufzeit kommt mit und wird geprüft.** Die Node-Binärdatei wird von
   nodejs.org geladen und gegen eine Prüfsumme geprüft, die in
   `scripts/sidecar-runtime.mjs` **im Repository** steht. Grund dafür sind zwei
   Dinge: `node:sqlite` gibt es erst ab Node 22.5 (E-035), und die Node-Fassung
   mancher Linux-Verteilungen lässt sich nicht zu einer Einzeldatei-Anwendung
   machen — die Datei entsteht, stirbt aber beim Start mit SIGSEGV.

3. **Die gebaute Datei wird ausgeführt, nicht angenommen.**
   `scripts/verify-sidecar.mjs` baut ein Installationsbild in einem
   Wegwerfordner — Binärdatei, daneben ein `taskpane`-Bündel — startet sie von
   dort mit leerem Arbeitsverzeichnis und prüft **zwanzig** Dinge: beide
   `stdin`-Startzeilen einzeln, den migrierten Bestand, beide Ports, die Rechte
   am Anwendungsdatenverzeichnis und das Ende des Prozesses, wenn die Röhre
   schließt.

4. **`import.meta` hält den Bau an.** Im CommonJS-Bündel gibt es das nicht;
   esbuild setzt ein leeres Objekt ein, und `import.meta.url` ist `undefined`.
   `new URL('…', undefined)` wirft dann `TypeError: Invalid URL` — genau daran
   ist Takt in T-053 beim Start gestorben, und esbuild hat es die ganze Zeit als
   Warnung gemeldet. Seit T-054 setzt `define` den Wert ausdrücklich auf die
   leere Zeichenkette (den Wert, den beide Fundstellen im Quelltext als „gibt es
   nicht" behandeln), und `logOverride` macht aus jeder **anderen** Berührung
   von `import.meta` einen Fehler.

## Der Aufgabenbereich des Add-ins (E-046)

Der Dienst liefert den Outlook-Aufgabenbereich über HTTPS auf Port 17844 aus.
Er sucht dessen Bündel an genau einem Ort, der in der Auslieferung gilt:

```
resolve(process.execPath, '..', 'taskpane')     →  neben der Sidecar-Binärdatei
```

`scripts/build-taskpane.mjs` baut das Add-in und legt sein `dist/` dorthin —
für `tauri dev` nach `src-tauri/target/debug/taskpane`, für `tauri build` nach
`src-tauri/taskpane`, von wo `tauri.conf.json` es ins Paket nimmt.

**Drei Einträge in `tauri.conf.json`, und jeder wird gebraucht.** Unter Windows
ist das Ressourcenverzeichnis dasselbe wie das Verzeichnis der ausführbaren
Datei — NSIS legt alles nach `$INSTDIR` —, dort trifft `resources` den gesuchten
Ort. Unter Linux nicht: Ressourcen liegen in `/usr/lib/<produktname>/`, die
Binärdateien in `/usr/bin/`. Deshalb legen `bundle.linux.deb.files` **und**
`bundle.linux.appimage.files` dieselben Dateien zusätzlich nach
`/usr/bin/taskpane`, und **das** ist die Kopie, die der Dienst liest. Am
gebauten Paket gemessen (T-054): Das AppImage erbt den `deb`-Eintrag nicht, es
braucht seinen eigenen; die `resources`-Kopie unter `/usr/lib/` liest unter
Linux nichts.

Der Entwicklungsbetrieb braucht denselben Schritt, weil der Sidecar auch in
`tauri dev` die gebündelte Binärdatei ist. Der zweite Suchpfad in
`apps/local-api/src/taskpane/server.ts` — `apps/outlook-addin/dist` — entsteht
aus `import.meta.url` und gibt es im Bündel nicht. Das ist Absicht: Was beim
Kunden läuft, soll nichts über ein Repository wissen. Es bedeutet nur, dass ihm
jemand das Bündel hinlegen muss, hier wie dort.

Fehlt es, bricht `scripts/build-app.mjs` ab. Ein Paket, in dem der
Aufgabenbereich fehlt, sieht vollständig aus, startet, und das Add-in ist
darin tot — der Dienst meldet dann nur „Es liegt kein Bündel vor."

## Die zwei Startzeilen (E-042)

Die Hülle schreibt beim Start **eine** Zeichenkette in `stdin` des Sidecars:

```
<sitzungsgeheimnis>\n<windows-benutzername>\n
```

Beides in einem Schreibvorgang, weil der Leser auf der Gegenseite beide Zeilen
in einem Zug aufnimmt.

Der Benutzername kommt aus `GetUserNameW` und **nicht** aus `%USERNAME%`. Der
Unterschied ist der ganze Punkt: `set USERNAME=fremder && Takt.exe` würde sonst
genügen, um fremde Arbeitszeit unter eigenem Namen abzurechnen (B-8.1). Die
Befehlszeile scheidet aus demselben Grund aus wie beim Geheimnis — sie steht
jedem lokalen Prozess in der Prozessliste offen.

Ohne die zweite Zeile startet der Dienst nicht, sondern endet mit Code 78. Das
ist Absicht: Ein Export ohne Urheber wäre nicht nachvollziehbar. Die Hülle prüft
den Namen deshalb **vor** dem Start — nicht leer, höchstens 256 Zeichen, keine
Steuerzeichen — und meldet einen Fehlschlag über `shellState().problems`, statt
den Dienst in eine Zeitüberschreitung laufen zu lassen.

Geliefert wird der nackte Name (`mmueller`), nicht `KONTOSO\mmueller`. Beide
Werte stehen der Oberfläche über `osUser()` zur Verfügung; welcher in den Export
gehört, ist noch offen (B-8.2 Punkt 4).

## Lebenszyklus, zwei Wege ins Ende

Ein Sidecar, der nach dem Beenden von Takt weiter auf `127.0.0.1:17843` lauscht,
hält Kundendaten ohne Fenster, in dem man ihn bemerkt. Dagegen wirken zwei
unabhängige Maßnahmen:

1. Die Hülle beendet ihn ausdrücklich — beim Schließen des Fensters und beim
   Verlassen der Ereignisschleife.
2. Stirbt die Hülle hart (`kill -9`, Absturz, Abmeldung), schließt das
   Betriebssystem ihr Ende der `stdin`-Röhre. Der Dienst bemerkt das Ende und
   beendet sich selbst.

Der zweite Weg ist der wichtigere, weil er genau dann greift, wenn der erste
nicht mehr laufen kann. Nachgewiesen in dieser Aufgabe: `kill -9` auf die Hülle,
fünf Sekunden später ist der Sidecar weg und der Port frei.

## Schnittstelle zur Oberfläche

`src/shell.ts`, importierbar als `@takt/desktop/shell`. Vier Befehle:

- `serviceHandshake()` — Adresse und **Sitzungsgeheimnis** für die Kopfzeile
  `X-Takt-Token`. Damit weist sich die Oberfläche aus, nicht mit dem
  Add-in-Token.
- `osUser()` — der Anmeldename vom Betriebssystem (E-010). Bei Bedarf neu
  fragen, nicht zwischenspeichern.
- `shellState()` — Ablageort, Rechte, Warnungen, Zustand des Dienstes.
- `quit()` — Dienst beenden, dann Anwendung.

Dazu `SHELL_EVENTS` für die Menüpunkte. Das Menü führt selbst nichts aus; es
sendet ein Ereignis, und die Oberfläche entscheidet. Sonst gäbe es zwei Wege
zum selben Ziel und einer davon liefe am Bestätigungsdialog vorbei.

## Ablageort

`%LOCALAPPDATA%\Takt\` unter Windows, `~/.local/share/takt/` sonst (E-018).
Ausdrücklich **nicht** `%APPDATA%` und ausdrücklich **nicht** Tauris
`app_local_data_dir()` — das liefert `%LOCALAPPDATA%\de.takt.app`, also einen
anderen Ordner als den, den der Sidecar benutzt.

Die Hülle legt das Verzeichnis an und zieht die Rechte eng, **bevor** der Dienst
startet: unter Unix `0700`, unter Windows Vererbung entfernt und Vollzugriff nur
für das laufende Konto und `SYSTEM`. Alles, was der Dienst danach hineinschreibt
— Datenbank, WAL-Dateien, Tokendatei —, erbt diese Rechte.

## Gemessene Herkunft des Webviews

T-011 hatte drei Schreibweisen in `ALLOWED_ORIGINS` geraten. Unter Linux ist es
gemessen — Tauri 2.11.5, WebKitGTK 2.52.5, Auslieferungsbau:

```
Origin:          tauri://localhost
Sec-Fetch-Site:  cross-site
Sec-Fetch-Mode:  cors
```

Die Anfrage geht mit Vorabanfrage (`OPTIONS`) heraus. Unter macOS ist die
Herkunft dieselbe, unter Windows lautet sie `http://tauri.localhost`. Das sind
die zwei Einträge, die in `ALLOWED_ORIGINS` stehen.

`https://tauri.localhost` **stand** dort und ist mit E-043 gestrichen. Die
Schreibweise entsteht ausschließlich mit `app.windows[].useHttpsScheme = true`,
und dieser Schalter darf nicht auf `true`: Der Webview verweigert dann wegen
gemischter Inhalte jede Anfrage an `http://127.0.0.1:17843`, und die Anwendung
lädt gar nichts mehr. Ein Eintrag in einer Positivliste, den niemand auslösen
kann, ist keine Vorsorge, sondern eine offene Tür, an die sich niemand mehr
erinnert.

Der Schalter steht ausgeschrieben mit dieser Begründung in `tauri.conf.json` —
dafür ist die Übersetzungskennzeichnung `config-json5` auf `tauri` und
`tauri-build` gesetzt, denn reines JSON kennt keine Kommentare. Wer den
Schalter doch umlegt, muss die Herkunft in `apps/local-api/src/config.ts`
bewusst wieder aufnehmen und die CSP anpassen.

## Auslieferung (T-075)

Der Ablauf steht in `.github/workflows/release.yml` und heißt „Auslieferung".
Er löst über ein Etikett aus:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Was dann passiert, in dieser Reihenfolge:

1. **Fassung bestimmen** — `v0.1.0` wird zu `0.1.0`. Ein Etikett, das nicht
   `X.Y.Z` oder `X.Y.Z-vorab` ist, hält den Ablauf hier an, zehn Minuten vor
   dem ersten Bau.
2. **Prüfen** — `pnpm check`, `pnpm verify:bundle` und der Abgleich der
   Node-Prüfsummen gegen nodejs.org. Eine Auslieferung aus einem roten Baum ist
   schlimmer als keine.
3. **Bauen** — drei Läufer, `ubuntu-24.04`, `windows-2022`, `macos-15`. Jeder
   fährt `pnpm desktop:build` mit gesetzter `TAKT_RELEASE_VERSION` und sammelt
   seine Erzeugnisse ein.
4. **Veröffentlichen** — **nur wenn alle drei fertig werden.** Der Text der
   Fassungsbeschreibung ist der Vorspann aus `.github/release-preamble.md`, die
   Prüfsummen und darunter „What's Changed", das GitHub aus den Commits seit dem
   letzten Etikett erzeugt.

Ein Probelauf ohne Veröffentlichung geht über „Run workflow" in der
Oberfläche von GitHub Actions; er verlangt eine Fassungsangabe und baut alles,
legt aber keine Fassung an.

### Drei Dinge, die man dazu wissen muss

**Die Fassung kommt aus dem Etikett, nicht aus `tauri.conf.json`.** Dort steht
`0.0.0`, und das bleibt so: In der Datei stehen Kommentare, an denen E-043
hängt, und ein Werkzeug, das sie neu schreibt, wirft sie weg. `build-app.mjs`
legt Tauri stattdessen über `--config` eine zweite Datei mit der Fassung unter.
Ohne `TAKT_RELEASE_VERSION` baut alles wie bisher mit `0.0.0`.

**Die Erzeugnisse sind unsigniert.** Windows zeigt SmartScreen, macOS
verweigert den Start ohne Umweg über die Systemeinstellungen. Ein Zertifikat
kostet Geld und einen Antrag — das ist eine Entscheidung des Auftraggebers. Der
Vorspann der Fassungsbeschreibung sagt es jedem, der eine Datei lädt, mit dem
Weg drumherum.

**Die Lizenzbeilage entsteht bei jedem Bau neu.** `collect-licenses.mjs` liest
den Abhängigkeitsgraphen von Cargo und pnpm und den Lizenztext von Node aus
demselben Archiv, aus dem die Laufzeit stammt. Sie ist eine **Obermenge** —
warum, steht im Kopf der erzeugten Datei und im Kopf des Skripts. Ohne sie
bricht `build-app.mjs` ab: Ein Paket, das ohne die Lizenztexte weitergegeben
wird, sieht vollständig aus.
