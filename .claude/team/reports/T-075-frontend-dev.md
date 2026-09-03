Aufgabe: T-075 — Ein Release-Workflow, der für drei Plattformen baut und veröffentlicht

Status: teilweise

Artefakte:
- `.github/workflows/release.yml` — neu. Der Auslieferungsablauf: Etikett → prüfen → drei Plattformen
  bauen → nur bei Erfolg aller drei veröffentlichen.
- `.github/release-preamble.md` — neu. Der feste Vorspann der Fassungsbeschreibung: welche Datei für
  welches System, dass die Dateien **unsigniert** sind und wie man sie trotzdem startet,
  Prüfsummenanleitung, Lizenzhinweis, offene Punkte.
- `apps/desktop/scripts/collect-licenses.mjs` — neu. Erzeugt die Lizenzbeilage aus dem
  Abhängigkeitsgraphen von Cargo und pnpm plus dem Lizenztext von Node.
- `apps/desktop/scripts/collect-release.mjs` — neu. Sammelt die gebauten Installationsdateien ein und
  bildet ihre SHA-256.
- `apps/desktop/scripts/verify-node-checksums.mjs` — neu. Hält die sechs Node-Prüfsummen gegen
  `SHASUMS256.txt` von nodejs.org.
- `apps/desktop/scripts/build-sidecar.mjs` — macOS: `--macho-segment-name NODE_SEA` und
  `codesign` vor und nach dem Einbau.
- `apps/desktop/scripts/sidecar-runtime.mjs` — `ARCHIVES` ausgeführt, `tarBinary()` neu (bsdtar unter
  Windows), Nachprüfbarkeitshinweis an der Prüfsummentabelle.
- `apps/desktop/scripts/verify-sidecar.mjs` — der Ablageort wird jetzt auch unter Windows umgelenkt
  (`%LOCALAPPDATA%` statt `XDG_DATA_HOME`).
- `apps/desktop/scripts/build-app.mjs` — Fassung aus `TAKT_RELEASE_VERSION` über `tauri build
  --config`; Abbruch, wenn die Lizenzbeilage fehlt.
- `apps/desktop/src-tauri/tauri.conf.json` — `app` und `dmg` in `bundle.targets`, `licenses/**/*` in
  `bundle.resources`.
- `apps/desktop/package.json` — drei neue Skripte, `collect-licenses` in die `app:build`-Kette.
- `apps/desktop/.gitignore` — `src-tauri/licenses/`, `src-tauri/.release-config.json`, `release/`.
- `apps/desktop/README.md` — Befehlstabelle, die erweiterte Kette, ein Abschnitt „Auslieferung".
- `.claude/team/reports/T-075-frontend-dev.md` — dieser Bericht.

Nichts außerhalb von `.github/**` und `apps/desktop/**` geändert. `apps/web/**` war nicht nötig.
Die Wurzel-`package.json` habe ich nur gelesen.

Zusammenfassung:
Der Ablauf löst über ein Etikett `vX.Y.Z` aus und hat vier Aufträge: `prepare` schneidet die Fassung
aus dem Etikett und bricht bei einem unbrauchbaren Etikett ab, `gate` fährt `pnpm check`,
`pnpm verify:bundle` und den Prüfsummenabgleich gegen nodejs.org, `build` baut auf `ubuntu-24.04`,
`windows-2022` und `macos-15` je ein Installationsstück, und `publish` hängt an allen dreien —
fällt einer aus, entsteht kein Release. Die Fassungsbeschreibung ist ein fester Vorspann, dann die
Prüfsummen, dann „What's Changed" aus `POST /releases/generate-notes`, also von GitHub aus den
Commits erzeugt und nicht von mir geschrieben. Die drei schweren Punkte aus dem Auftrag sind
abgearbeitet: Die sechs Node-Prüfsummen habe ich **gegen die offizielle Prüfsummendatei gehalten**
statt sie zu glauben (alle sechs stimmen; der Lauf dafür steht jetzt im Repository und im
Ablauf); die Lizenzbeilage aus T-068 R-1/R-2 wird bei jedem Bau erzeugt und liegt in `.deb`,
`.AppImage` und NSIS-Paket; die Unsigniertheit steht im Vorspann jeder Fassungsbeschreibung, mit dem
Weg drumherum für Windows und macOS. Auf Linux ist die ganze Kette durchgelaufen und gemessen —
`Takt_0.1.0_amd64.deb` und `.AppImage` mit der Fassung aus der Umgebungsvariablen, Lizenzbeilage
nachweislich unter `/usr/lib/Takt/licenses/` im Paket, Sidecar-Nachweis 20 von 20. **Windows und
macOS sind gebaut, aber nie gelaufen** — deshalb `teilweise` und nicht `fertig`.

Annahmen:

1. **Die Fassung kommt aus dem Etikett, nicht aus `tauri.conf.json`.** Dort steht `0.0.0`, und das
   bleibt so: In der Datei stehen die Kommentare, an denen E-043 hängt, und jedes Werkzeug, das sie
   neu schreibt, wirft sie weg. `build-app.mjs` legt Tauri stattdessen über `--config` eine zweite
   Datei mit `{"version": …}` unter. Gemessen: `Takt_0.1.0_amd64.deb` aus
   `TAKT_RELEASE_VERSION=v0.1.0`. Ohne die Variable baut alles wie bisher mit `0.0.0`.
   **Folge für den Auftraggeber:** Vor dem ersten Etikett ist keine Datei zu ändern; das Etikett
   selbst ist die Angabe.

2. **Die Lizenzbeilage ist eine Obermenge, und das steht in ihr drin.** T-068 hat mit
   `cargo tree -e normal,no-proc-macro` 209 ausgelieferte Kisten gezählt. Mein Lauf zählt 266, weil
   `cargo metadata` die Vereinigung aller Merkmale auflöst und Kisten hinter abgeschalteten
   Merkmalen mitnimmt. Ich habe die Ungenauigkeit **in die sichere Richtung** gelassen und im Kopf
   der erzeugten Datei benannt: Wer mehr nennt als nötig, nennt niemanden zu wenig; der umgekehrte
   Fehler ist eine fehlende Attribution, und die sieht niemand, bis sie teuer wird.
   Die drei Sonderfälle aus T-068 sind nachgesehen und drin: `tao` (Apache-2.0, voller Lizenztext
   aus der Kiste), `option-ext` (MPL-2.0, Text plus ein ausdrücklicher Absatz zur
   Quelltextverfügbarkeit nach §3.2), und die Node-Laufzeit selbst — der Sidecar **ist** eine Kopie
   der offiziellen Node-Binärdatei, also wird Node ausgeliefert und mit ihm OpenSSL, V8, ICU. Der
   Text dafür kommt aus **demselben Archiv**, aus dem die Laufzeit stammt.
   Zahlen: 364 Bestandteile, 168 verschiedene Texte (gleiche Texte werden zusammengelegt, sonst
   stünde Apache-2.0 hundertmal darin), 732 KiB, 10 Bestandteile ohne mitgelieferten Text — die
   sind namentlich mit ihrer Kennung aufgeführt, statt für sie einen Text zu erfinden.

3. **Ein Bau ohne Lizenzbeilage bricht ab.** Dieselbe Prüfung wie beim Aufgabenbereich aus T-054 und
   aus demselben Grund. Das ändert das Verhalten von `pnpm desktop:build` auf jedem Rechner: Der
   Schritt läuft jetzt mit in der Kette (`app:build`), nicht in `app:dev` — im Entwicklungsbetrieb
   wird nichts weitergegeben.

4. **Fremde Aktionen: nur die vier von GitHub selbst, alle auf den Commit festgenagelt.** pnpm kommt
   über `npm install --global "$(node -p '…packageManager')"` und nicht über `pnpm/action-setup`;
   die Fassung wird damit aus der `package.json` gelesen und nicht ein zweites Mal hingeschrieben.
   Auf `dtolnay/rust-toolchain` und `Swatinem/rust-cache` habe ich verzichtet: Rust ist auf allen
   drei Läuferbildern vorinstalliert (1.98.0, nachgesehen), und ein Zwischenspeicher, der nach
   sieben Tagen ohne Benutzung verfällt, hat bei einem Ablauf, der ein paar Mal im Jahr läuft, kaum
   Treffer. Preis: Jeder Baulauf übersetzt den Rust-Baum vollständig.

5. **Feste Läufer-Kennungen statt `-latest`.** Für eine Datei, die weitergegeben wird, ist ein
   wandernder Läufer eine wandernde glibc-Grenze, die niemand entschieden hat. Ich habe nachgesehen
   statt geraten: `macos-14` ist **abgekündigt** (deshalb `macos-15`), und die Ubuntu-22-Bilder gehen
   **ab dem 17.09.2026 in die Abkündigung** (actions/runner-images#14254) — zwei Wochen von heute.
   Deshalb `ubuntu-24.04`, obwohl 22.04 die bessere Wahl für die Reichweite des Erzeugnisses wäre.
   **Die Folge ist eine echte Einschränkung: Die Linux-Dateien verlangen glibc 2.39, laufen also
   nicht auf Ubuntu 22.04 oder Debian 12.** Sie steht in der Fassungsbeschreibung.

6. **macOS nur Apple Silicon.** Ein zweiter Läufer für Intel verdoppelte die Unbekannten auf einer
   Plattform, die noch nie gebaut hat. Intel-Macs sind in der Fassungsbeschreibung ausdrücklich als
   nicht bedient geführt — als offene Stelle, nicht als Auslassung.

7. **Der Probelauf.** `workflow_dispatch` mit einer Fassungsangabe baut alles und veröffentlicht
   nichts. Damit der erste echte Lauf nicht zugleich der erste Lauf überhaupt ist.

Befunde, die ich beim Bauen gefunden und behoben habe:

**B-1 — Der Einsammler hätte eine Datei aus einem früheren Bau ausgeliefert.** Gemessen, nicht
vermutet: `tauri build` räumt `target/release/bundle/` **nicht** auf. Nach dem Bau mit `0.1.0` lagen
dort `Takt_0.0.0_amd64.deb` (Tage alt), `Takt_0.1.0_amd64.deb` und `Takt_0.1.0_amd64.AppImage`, und
der erste Entwurf des Einsammlers nahm alle drei mit — samt Prüfsumme, samt Hochladen in die
Fassung. Auf einem frischen Läufer fällt das nie auf, auf einem Rechner, auf dem schon gebaut wurde,
jedes Mal. `collect-release.mjs` filtert jetzt nach der Fassung und bricht ab, wenn danach nichts
übrig bleibt.

**B-2 — Der Sidecar-Bau hätte unter macOS eine Datei erzeugt, die nichts tut.** `postject` braucht
für Mach-O den Schalter `--macho-segment-name NODE_SEA`; ohne ihn landet der Blob in einem Segment,
in dem die Laufzeit ihn nicht sucht. Die Datei entsteht, sie startet, und sie führt das eingebaute
Bündel nicht aus — sie verhält sich wie ein blankes `node`. Zweitens macht der Einbau die Signatur
der offiziellen Node-Binärdatei ungültig, und auf Apple Silicon beendet der Kernel eine Datei ohne
gültige Signatur sofort. Beides ist behoben (`codesign --remove-signature` davor, `codesign --sign -`
danach), beides nach der Beschreibung des SEA-Verfahrens von Node, **beides nie ausgeführt.**

**B-3 — Der Sidecar-Nachweis wäre unter Windows aus dem falschen Grund rot geworden.**
`verify-sidecar.mjs` lenkte den Ablageort ausschließlich über `XDG_DATA_HOME` um.
`apps/local-api/src/access/paths.ts` liest die Variable unter Windows **nicht**; dort gilt
`%LOCALAPPDATA%\Takt`. Der Lauf hätte also gegen die echte Datenbank des angemeldeten Kontos
gearbeitet, und die Prüfung „die Datenbankdatei liegt im Anwendungsdatenverzeichnis" hätte im
Wegwerfordner nichts gefunden. Genau diese Sorte Fehlschlag verleitet dazu, die Prüfung „für Windows
zu lockern". Die Regel steht jetzt einmal im Skript und wird an beiden Stellen benutzt.

**B-4 — `tar` ist unter Windows nicht gleich `tar`.** Das Windows-Node-Archiv ist ein ZIP; lesen kann
das nur `bsdtar` aus `System32`. Das GNU-`tar`, das Git für Windows unter `usr\bin` mitbringt, meldet
„This does not look like a tar archive" — und welches von beiden ein blankes `tar` trifft, hängt an
der Reihenfolge in `PATH`, die auf einem Läufer von GitHub beide enthält. Der Pfad ist jetzt
ausgeschrieben (`tarBinary()`), mit Rückfall auf `tar`.

**B-5 — `bundle.targets` hätte unter macOS nichts erzeugt.** Die Liste war `["nsis", "deb",
"appimage"]`. Tauri filtert sie nach Plattform; unter macOS wäre kein Eintrag übrig geblieben, der
Bau wäre grün gewesen und der Ausgabeordner leer. `app` und `dmg` sind ergänzt. Dass das Filtern
still passiert und nicht abbricht, ist am Linux-Bau gemessen: Er hat `app` und `dmg` übergangen,
ohne zu murren.

Risiken und Unbekannte — die ehrliche Liste. **Ich konnte den Ablauf hier nicht ausführen.**
Geordnet danach, woran der erste Lauf am wahrscheinlichsten scheitert:

**U-1 (hoch) — Die Schreibrechte des Ablauf-Tokens.** Steht in *Settings → Actions → General →
Workflow permissions* „Read repository contents permission" und ist das auf Organisationsebene
erzwungen, scheitert `gh release create` mit 403, nachdem drei Bauläufe durchgelaufen sind. Das ist
eine Einstellung am Repository und nichts, was ich im Ablauf lösen kann. **Vor dem ersten Etikett
nachsehen.**

**U-2 (hoch) — Der Windows-Anteil läuft zum ersten Mal (T-B05).** Vier Stellen, die dort zuerst
brechen können, in dieser Reihenfolge: das Entpacken des ZIP (B-4, behoben, ungeprüft), `postject`
auf `node.exe` — der Einbau macht die Authenticode-Signatur der offiziellen Datei ungültig, und ob
Defender oder SmartScreen die entstandene 120-MiB-Datei dann anfasst, weiß ich nicht —, der
Sidecar-Nachweis (B-3, behoben, ungeprüft) und das Herunterladen der NSIS-Werkzeuge durch den
Bündler.
**Wichtig: Ein grüner CI-Lauf schließt T-B05 nicht.** Er belegt, dass eine `.exe` entsteht. Er
belegt **nicht**, dass NSIS die Ressourcen nach `$INSTDIR` legt — das ist die unbewiesene Annahme,
auf der die Auslieferung des Add-ins steht, und sie lässt sich nur an einer echten Installation
prüfen.

**U-3 (hoch) — macOS ist vollständig unbekannt.** Nie gebaut. Neben B-2 (ungeprüft): Der
DMG-Schritt von Tauri fährt AppleScript gegen den Finder und ist in einer Sitzung ohne Bildschirm
erfahrungsgemäß der wackeligste Teil des ganzen Baus. `app` und `dmg` sind neu in der Zielliste und
noch nie ausgeführt. Ob `codesign` auf dem Läufer erreichbar ist, ist wahrscheinlich (Xcode-Werkzeuge
sind Teil des Bildes), aber ungeprüft — das Skript bricht mit einer verständlichen Meldung ab, wenn
nicht.

**U-4 (mittel) — `pnpm install --frozen-lockfile` auf einer fremden Plattform.** Die
`pnpm-lock.yaml` ist unter Linux entstanden. Sie sollte die plattformgebundenen Wahlabhängigkeiten
aller Plattformen enthalten (esbuild, Rollup, `@tauri-apps/cli-*`); wenn nicht, scheitert die
Installation unter Windows und macOS, bevor irgendetwas gebaut wird.

**U-5 (mittel) — Die Bauzeit.** Ohne Zwischenspeicher, mit vollständigem Rust-Bau, dem Herunterladen
der Node-Laufzeit (31 MiB je Plattform) und den zwanzig Sidecar-Prüfungen rechne ich mit 20 bis 40
Minuten je Läufer. Das ist kein Fehler, aber es ist der Grund, warum ein Fehlschlag im
Veröffentlichungsschritt teuer ist — deshalb steht die Vollzähligkeitsprüfung dort **vor** dem
Anlegen der Fassung und nicht danach.

**U-6 (mittel) — „What's Changed" wird beim ersten Mal fast leer sein.** `main` trägt genau einen
Commit. Ohne vorheriges Etikett erzeugt GitHub die Liste von Anfang an, und das ist dann dieser eine
Commit. Das ist richtig so und sieht trotzdem nach einem Fehler aus.

**U-7 (gering) — Läufer-Kennungen.** `ubuntu-24.04`, `windows-2022`, `macos-15` sind heute gültig
und nicht abgekündigt (nachgesehen). Wird eine eingestellt, scheitert der Lauf sofort bei der
Zuteilung. Das ist eine Zeile Nacharbeit und der bessere Fehlschlag gegenüber stillem Wandern.

**U-8 (gering) — `pnpm check` auf einem Läufer.** Läuft hier grün; ob die Abdeckungsschwellen und
die drei Nachweisläufe auf einem fremden Rechner genauso ausgehen, ist ungeprüft. Falls nicht, ist
das ein Befund über die Prüfkette und kein Grund, das Tor zu öffnen.

**U-9 (gering) — Vorabfassungen.** `v1.0.0-rc.1` ist zugelassen und wird als Vorabfassung markiert.
Wie NSIS und `dpkg` mit der Vorabkennung im Dateinamen und in den Eigenschaften umgehen, ist
ungeprüft. Für die erste Auslieferung würde ich eine glatte `X.Y.Z` nehmen.

**U-10 — die Lizenzbeilage ist maschinell und ungelesen.** Sie ist 732 KiB und niemand hat sie
gelesen. Ich habe stichprobenweise nachgesehen, dass die drei Sonderfälle aus T-068 drinstehen und
an der richtigen Stelle. Ob der Text im Kopf juristisch trägt, ist keine Frage, die ich beantworten
kann — er nennt die Auflagen und wie sie erfüllt werden, mehr nicht.

Offene Fragen:

1. **Soll der Prüfsummenabgleich in `pnpm check`?** `verify-node-checksums.mjs` läuft heute nur im
   Auslieferungsablauf. In `check` gehört er meiner Meinung nach **nicht**, weil er Netz braucht und
   `check` sonst auf einem Rechner ohne Verbindung scheitert. Ein Wurzelskript
   `"sidecar:checksums": "pnpm --filter @takt/desktop sidecar:checksums"` wäre trotzdem bequem —
   das ist die Wurzel-`package.json` und damit nicht meine Datei. **Ich brauche dort nichts, um zu
   funktionieren**; es wäre Komfort.

2. **Wer entscheidet über die Signatur?** Ein Zertifikat für Windows (Authenticode, OV oder EV) und
   die Mitgliedschaft im Apple-Entwicklerprogramm samt Notarisierung sind Geld und ein Antrag. Bis
   dahin steht die Warnung im Vorspann. Sobald entschieden ist, sind das zwei Geheimnisse im
   Repository und je drei Zeilen im Ablauf — der Ablauf ist so gebaut, dass sie an einer Stelle
   dazukommen.

3. **Soll die erste Fassung eine Vorabfassung sein?** Ich würde `v0.1.0-rc.1` vorschlagen: Der
   Windows- und der macOS-Anteil laufen dann zum ersten Mal, und eine Vorabfassung sagt jedem, der
   sie lädt, dass genau das der Fall ist.

4. **`cargo audit` liegt auf den Ubuntu-Läuferbildern vorinstalliert** (0.22.2, nachgesehen).
   T-B07 ist als „nicht installiert, der Rust-Anteil ist nie geprüft worden" blockiert. Das ließe
   sich mit einem Auftrag im Ablauf oder einem eigenen Ablauf schließen. Das ist nicht meine
   Aufgabe, aber die Gelegenheit gehört gemeldet.

5. **Wird der Sidecar je einzeln weitergegeben?** T-068 hat die Frage gestellt, sie ist offen. Die
   Lizenzbeilage liegt im Paket, nicht neben der Binärdatei. Wandert die Binärdatei allein
   irgendwohin, wandert die Beilage nicht mit.

Nächster Schritt:
Einen Probelauf über „Run workflow" mit einer Fassungsangabe starten, **bevor** das erste Etikett
gesetzt wird. Er durchläuft `prepare`, `gate` und alle drei Bauläufe und veröffentlicht nichts. Dabei
fällt an, was in U-2 bis U-5 steht — und zwar als Befund mit Protokoll, nicht als halbe Fassung auf
der Freigabeseite. Vorher einmal in *Settings → Actions → General → Workflow permissions* sehen
(U-1). Erst wenn der Probelauf dreimal grün ist, `git tag v0.1.0-rc.1 && git push origin
v0.1.0-rc.1`.
