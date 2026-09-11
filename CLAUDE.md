# SuperTakt — Projektregeln

SuperTakt ist eine lokale Todo- und Zeittracking-Anwendung mit konfigurierbarem Export an ein
externes Abrechnungstool und einem Outlook-Add-in.

Verbindliche Quellen:

- `docs/spec.md` — die Produktspezifikation. Keine Umsetzung ohne Deckung durch eine
  Anforderungs-ID daraus.
- `docs/prototype/takt-ui-konzept.html` — liegt noch nicht vor. Bis dahin ist das Designsystem
  aus Aufgabe T-006 die visuelle Referenz.
- `.claude/team/decisions.md` — getroffene Architektur- und Produktentscheidungen.

## Betriebsform

Alles läuft lokal. Kein Cloud-Dienst, kein Datenbankserver, keine Telemetrie. Gespeichert wird
in einer eingebetteten SQLite-Datei im Anwendungsdatenverzeichnis des Benutzers.

Genau **eine** Ausnahme, und sie ist eng: die Versionsprüfung gegen die Releases des offiziellen
GitHub-Bestands (Spezifikation Abschnitt 18, E-064). Sie fragt und liest, sonst nichts. Wer eine
zweite Adresse außerhalb von `127.0.0.1` einbaut, hebt E-001 auf und braucht dafür eine
Entscheidung, nicht eine Zeile Code.

Zwei Adressen stehen seit dem 2026-09-09 **im Bau** und ausdrücklich nicht im Erzeugnis: der
Zeitstempeldienst des Code-Signierens (`WINDOWS_TIMESTAMP_URL`, Vorgabe
`http://timestamp.digicert.com`, `apps/desktop/scripts/sign-windows.mjs`) und der
Bezugsort von Azure Artifact Signing. Sie laufen auf dem Bauläufer, nicht auf dem Rechner des
Benutzers, und heben E-001 damit nicht auf. Wer sie in Laufzeitcode zieht, tut es doch.

## Stack

| Schicht | Technik |
|---|---|
| Hülle | Tauri, Rust-Anteil dünn gehalten, aber **nicht mehr nur Fenster und Menü**: elf Befehle — Fenster, Menü, Lebenszyklus des Sidecars, Windows-Benutzername, Fassung und Öffnen der Release-Seite (`release.rs`), Öffnen von Verweis und Datei (`attachment.rs`), systemweite Inaktivität (`idle.rs`, `idle/linux.rs`), Prüfen und Vertrauen des lokalen Outlook-Zertifikats (`outlook_certificate.rs` samt `outlook_certificate.ps1`) |
| Oberfläche | React + Vite + TypeScript |
| Lokaler Dienst | Node als Tauri-Sidecar, gebunden auf `127.0.0.1`, versorgt Oberfläche und Outlook-Add-in. **Zwei Ports:** `17843` die API über HTTP mit Prüfschicht, `17844` ausschließlich HTTPS und ausschließlich die statischen Dateien des Aufgabenbereichs (E-046, `apps/local-api/src/config.ts`) |
| Speicherung | Eingebettetes SQLite, eine Datei, kein Serverprozess |
| Add-in | Office.js + TypeScript |
| Tests | Vitest für Einheiten und Integration, Playwright für End-to-End |

Die Fachlogik liegt in `packages/domain` und kennt weder HTTP noch SQL. Der Zugriff auf die
Speicherung läuft über Ports in `packages/storage`; der SQLite-Adapter ist austauschbar. Das ist
die Bedingung dafür, dass „lokal, zumindest derzeit" später ohne Umbau der Fachlogik aufgehoben
werden kann.


## Wo was liegt — die Merkmalsstruktur (T-249 bis T-272)

Beide Anwendungen sind **featureweise** geordnet. Ein neuer Entwickler soll an Ordnern und
Dateinamen erkennen, wo etwas liegt, ohne zuerst die Architektur zu verstehen.

```
apps/web/src/          features/{board,todos,timer,bookings,export,tags,settings,structure}/
                       shared/ui/   app/   lib/   api/   showcase/   styles/
apps/local-api/src/    features/{board,todos,timer,export,structure,settings,version,data-transfer}/
                       routes/addin/   access/   http/
```

`screens/`, `components/` und `usecases/` gibt es **nicht mehr**. Ein Merkmal trägt seine
Bausteine, seine Logik, seine API-Aufrufe und seine eigenen Typen flach im eigenen Ordner —
keine Unterordner für ein bis zwei Dateien, keine Barrel-Dateien, keine `utils.ts`.

Vier Regeln, die dabei gemessen und nicht geraten wurden:

- **`features/<merkmal>/api.ts`, eine Ebene tief** (E-102). `request` darf nur dort und in
  `api/client.ts` stehen; `proof:callers` mißt die Menge gegen die Platte.
- **`api/types.ts` bleibt** als geteilter Vertrag mit dem Dienst. Merkmalseigene Anfrage- und
  Antworttypen wandern mit; `Todo`, `Tag`, `TimeEntry` bleiben, weil sie mehrere Merkmale tragen.
  **Kein `features/<merkmal>/types.ts`.**
- **`shared/ui/` nimmt auf, was mehr als ein Merkmal wirklich braucht** — jede der neunzehn
  Dateien wird aus mindestens drei Bereichen gelesen. `lib/` trägt die Nicht-JSX-Fachhelfer;
  `labels.ts` hat 8 Merkmale und 30 Leser.
- **Zwei Dateien liegen flach unter `apps/local-api/src/`** und nicht in einem Merkmal:
  `pool-movement.ts` und `tag-names.ts`. Sie werden aus mehreren Merkmalen gelesen; ein Merkmal
  hätte den anderen einen Rückgriff aufgezwungen. Das ist Absicht, kein Rest.

**Kreise zwischen Merkmalen sind erlaubt, wo sie fachlich echt sind** — `export ↔ bookings`,
`bookings ↔ todos`, `timer ↔ todos`, `structure ↔ tags`. Eine erfundene Zwischenschicht wäre der
Fehler, nicht die Kante. Wer einen neuen Kreis zieht, schreibt den Grund an die Kante.

**Nicht aufgeteilt, begründet:** `apps/desktop/src-tauri/src/attachment.rs` (1352 Zeilen, davon
**150 Produktivcode** — der Rest sind 609 Zeilen Prüfcode und 500 Zeilen Prosa; 30 der 69
Rust-Prüffälle stehen darin) und `packages/domain/src/attachment.ts`. Größe ist in diesem
Bestand kein Maßstab: `packages/domain` hat 6 975 Zeilen und **1 790 Anweisungszeilen**.

## Sprache

Oberflächentexte, Fehlermeldungen und Dokumentation auf Deutsch. Bezeichner im Code, Dateinamen,
Commit-Präfixe und technische Schlüssel auf Englisch. Die Schlüssel im Exportformat (`Call`,
`Zeit`, `Notiz`, `WindowsUser`) sind Vorgabe des Abrechnungstools und bleiben, wie sie sind.

## Verzeichnisse und Hoheit

Zwei gleichzeitig laufende Agenten fassen nie dieselbe Datei an.

Eine benannte Ausnahme, entstanden aus T-136-1 und von T-143 als Regelverstoß gemeldet: In Rust
liegt der Prüfteil **in** der Produktivdatei. Für `release.rs` ist das kein Zufall, sondern der
Punkt — die Formprüfung dort ist die einzige Kontrolle zwischen einer fremden Zeichenkette und
`xdg-open`, und Prüffälle unmittelbar daneben sind dort mehr wert als in einer fernen Datei.
Deshalb: unit-tester schreibt in `#[cfg(test)]`-Blöcke unter `apps/desktop/src-tauri/src/**`,
**und nur dort**, nie in den Produktivteil derselben Datei. Läuft gleichzeitig ein Agent in
dieser Datei, wartet die Prüfaufgabe auf die nächste Welle.

| Pfad | Gehört |
|---|---|
| `packages/domain/**`, `packages/storage/**` | domain-dev |
| `apps/local-api/**` außer `src/routes/addin/` | domain-dev |
| `apps/web/**`, `apps/desktop/**`, `packages/ui-tokens/**` | frontend-dev |
| `packages/export/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**` | integration-dev |
| `packages/*/test/**`, `apps/*/test/**` | unit-tester |
| `#[cfg(test)]`-Blöcke in `apps/desktop/src-tauri/src/**` | unit-tester — **benannte Ausnahme** |
| `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md` | e2e-tester |
| `docs/architektur.md`, `docs/datenmodell.md` | domain-dev |
| `docs/bedrohungsmodell.md` | security-checker |
| `docs/design/**` | ux-designer und ui-designer — je eigenes Artefakt, nie dieselbe Datei |
| Das **Datum des Falls** in einem bestehenden Sperrlisteneintrag | der streichende Agent — **zweite benannte Ausnahme**, E-091 |
| `docs/**` außer spec, prototype, datenmodell, architektur, testplan, bedrohungsmodell, design; `README.md` | documenter |
| `.claude/team/reports/**` | jeder Agent, ausschließlich seine eigene Datei |

Gemeinsame Dateien ändert nur der Orchestrator, also die Hauptsession: `CLAUDE.md`,
`.claude/team/board.md`, `decisions.md`, `risks.md`, `.claude/settings.json`, `package.json`,
`pnpm-workspace.yaml`, `tsconfig.base.json` und alle `tsconfig*.json` der Pakete, `.github/**`
(drei Abläufe: `pruefung.yml`, `release.yml`, `addin-build.yml`), die Modulregistrierung des
lokalen Dienstes und die Reihenfolge der Datenbankmigrationen.

## Ablauf

Arbeit läuft in Wellen. Unabhängige Aufgaben werden als mehrere Task-Aufrufe in einer Nachricht
gestartet und laufen parallel. Abhängige Aufgaben kommen in die nächste Welle.

**Nicht jede Arbeit kam bisher aus einer Welle.** Die Pull Requests #5 bis #16 vom 2026-09-08
und 2026-09-09 sind von einem anderen Werkzeug außerhalb dieses Ablaufs entstanden: 208 Dateien,
rund 9 800 Zeilen dazu, fünf neue Spezifikationsabschnitte, sechs Migrationen. `board.md`,
`decisions.md` und `risks.md` blieben dabei unberührt und waren zwölf Commits im Rückstand.
Daraus folgt eine Regel, nicht ein Vorwurf: **Wer außerhalb der Wellen an diesem Bestand
arbeitet, ist damit nicht durch das Qualitätstor.** Der Stand solcher Arbeit heißt im Board
„eingelesen", nicht „fertig", bis Code-Reviewer, Spezifikations- und UX-Reviewer, Tester und
Security-Checker ihn gesehen haben. Und beim Wiederaufsetzen wird zuerst der Abstand zwischen
`git log` und `board.md` gemessen, bevor irgendetwas gebaut wird.

Agenten sprechen nicht miteinander. Alles läuft über `board.md`, die Berichte und den
Orchestrator.

Jeder Agent legt seinen Bericht als `.claude/team/reports/T-00X-<rolle>.md` ab und gibt dieselbe
Struktur als Kurzfassung zurück:

```
Aufgabe: T-007 — Zeitbuchungen: Rundung und Exportstatus
Status: fertig | blockiert | braucht Review | teilweise
Artefakte: geänderte oder neue Dateien
Zusammenfassung: 3 bis 5 Sätze, was gemacht wurde
Annahmen: was ich entschieden habe, ohne zu fragen
Risiken: einschließlich Sicherheitshinweisen
Offene Fragen: an den Orchestrator
Nächster Schritt: konkreter Vorschlag
```

Bei einer Blockade rät ein Agent nicht. Er meldet zurück und beendet seine Aufgabe.

## Qualitätstor

Eine Aufgabe ist erst fertig, wenn Code-Reviewer, Spezifikations- und UX-Reviewer, Tester und
Security-Checker freigegeben haben. Der Dokumentierer arbeitet als Letzter.

## Fachliche Punkte, die in Review und Test immer geprüft werden

- Zeitbuchungen werden für den Export auf Schritte von 0,25 gerundet: 1,00 = 60 Minuten,
  0,75 = 45, 0,50 = 30, 0,25 = 15.
- Standard-Exportformat: `Call`, `Zeit`, `Notiz` als UTF-8 nach Base64, `WindowsUser`. Die
  Struktur ist über Exportvorlagen konfigurierbar; die Standardvorlage bildet genau dieses
  Format ab.
- Jede Buchung ist eindeutig exportiert oder offen, und das ist überall sichtbar.
- Die Notiz der Buchung geht in die Abrechnung. Die Notiz des Todos bleibt intern und darf in
  keinem **Abrechnungsexport** auftauchen; die ausdrücklich vollständige Datensicherung nach
  A-20 enthält sie für den Round-Trip.
- Wird der Timer auf einem erledigten Todo gestartet, hebt die Anwendung „Erledigt" automatisch
  auf; das Todo landet wieder in seinem Pool.
- Tag-Ordner sind beliebig tief verschachtelbar, Pools werden über Tags definiert, Standard-Tags
  greifen bei jedem neuen Todo — auch bei Anlage aus dem Add-in.
- Das Outlook-Add-in holt Tags, Ordner und Pools über die lokale API, erkennt die Call-Nummer
  über einen konfigurierbaren regulären Ausdruck und **weist auf einen bereits vorhandenen Call
  hin**, bevor ein Duplikat entsteht. Gehandelt wird am gefundenen Todo nicht — weder gebucht
  noch angehängt (A-10.9 in der Fassung von E-100).

## Versionsprüfung

Spezifikation Abschnitt 18 (A-18.1 bis A-18.12), Entscheidungen E-064 und E-065, Risiken R-19
und R-20. Die Regeln gelten ohne Ausnahme und sind bei jeder Freigabe zu prüfen:

- **Die installierte Fassung** kommt aus den **einkompilierten** Angaben des Erzeugnisses
  (`app.package_info().version`) — nicht aus einer Datei neben der Binärdatei, nicht aus einer
  Umgebungsvariablen, nicht aus einem Argument. Woher diese Angabe beim Bauen stammt, hängt am
  Bau: Im Entwicklungsbau aus `version` in `apps/desktop/src-tauri/tauri.conf.json` (dort steht
  `0.0.0`, und das soll so aussehen); im Auslieferungsbau aus `TAKT_RELEASE_VERSION`, das
  `build-app.mjs` als zweite Datei über die Konfiguration legt, statt die kommentierte
  JSON5-Datei neu zu schreiben. **`tauri.conf.json` ist damit der Rückfallwert, nicht die
  führende Quelle einer Veröffentlichung** — die führende Quelle ist das Etikett (T-144 U-06).
- **Gefragt wird der lokale Dienst, nicht die Oberfläche.** Die CSP der Hülle lässt den Webview
  in `connect-src` an genau vier Marken: `'self'`, `ipc:`, `http://ipc.localhost` und
  `http://127.0.0.1:17843`. Sie wird dafür nicht geöffnet, und `proof:shell-surface` misst die
  Zusage seit T-139 zeichengleich gegen `tauri.conf.json`. Der
  Dienst holt die Releases des offiziellen Bestands, die Adresse steht fest im Erzeugnis, ist
  nicht einstellbar und wird von keiner Antwort verlegt — auch nicht über eine Weiterleitung auf
  einen fremden Wirt.
- **Der Vergleich der Fassungen liegt in `packages/domain`** als reine Fachlogik, mit ihm die
  Regel, wann überhaupt etwas erscheint: neuer **und** nicht übersprungen. Kein
  Zeichenkettenvergleich — `0.10.0` steht über `0.9.0`.
- **Es wird nie etwas heruntergeladen und nie etwas installiert.** Nicht im Hintergrund, nicht
  nach einer Rückfrage, nicht als Bequemlichkeit. „Installieren" öffnet die Release-Seite dieser
  Fassung, mehr nicht. Den Download und die Installation löst ausschließlich der Benutzer aus,
  außerhalb von Takt.
- **Die Adresse zum Öffnen baut die Hülle selbst.** Der Befehl nimmt keine Adresse entgegen,
  höchstens die Fassungsbezeichnung, prüft sie gegen eine enge Form und setzt sie in eine fest
  hinterlegte Adresse ein. Eine Adresse aus einer Antwort an einen Öffnen-Befehl zu reichen ist
  verboten.
- **„Überspringen" überspringt eine Fassung, nicht die Prüfung.** Der Wert steht als Einstellung
  im Bestand, nicht im Arbeitsspeicher und nicht im Browserspeicher; eine spätere, höhere
  Fassung meldet sich wieder. Der Prüffall dazu misst einen Neustart.
- **Ein Fehlschlag ist still.** Nicht erreichbar, unerwartete Antwort, fehlende Fassungsangabe,
  gar keine Veröffentlichung: kein Hinweis, keine Fehlerfläche, kein zweiter Versuch im selben
  Lauf. Der Grund steht im Protokoll.
- **Die Prüfung überträgt nichts** über Benutzer, Bestand oder Nutzung.

## Frist und Anhänge

Spezifikation Abschnitt 19 (A-19.1 bis A-19.19), Entscheidungen E-070 bis E-072, Risiken R-21 und
R-22. Bei jeder Freigabe zu prüfen:

- Die Frist ist **ein Tag**, keine Uhrzeit, und es ist derselbe Tagesbegriff wie bei der
  Tagesgruppierung des Exports (E-025). „Überfällig", „heute fällig" und „später fällig" werden
  **gerechnet**, nicht gespeichert.
- In der Oberfläche heißt sie ausschließlich **„Frist"**.
- Verweis und Datei speichern eine Zeichenkette. Ein **Bild** wird ins Anwendungsdatenverzeichnis
  kopiert und als `data:`-Adresse angezeigt — die CSP bleibt, wie sie ist.
- **Über das Add-in entstehen keine Anhänge.** Strukturell, nicht per Voreinstellung. Ein Anhang
  aus einer E-Mail wäre ein von außen geschriebener Öffnen-Befehl.
- Der Öffnen-Befehl der Hülle prüft **bei jedem Aufruf** und nach Art getrennt: Verweis nur `http`
  und `https`, kein UNC; Datei nur ein vorhandener absoluter Pfad, kein UNC; ein Bild öffnet gar
  nichts. Eine Prüfung allein im Eingabefeld trägt nicht — zwischen Eingabe und Öffnen liegt der
  Bestand.
- Vor dem Öffnen einer **Datei** fragt die Oberfläche und nennt dabei den vollen Pfad. Eine Datei
  mit der Standardanwendung zu öffnen ist bei `.bat`, `.lnk` oder `.exe` eine Ausführung.
- Nichts öffnet sich von selbst. Weder Frist noch Anhang gelangen in einen
  **Abrechnungsexport**; die vollständige Datensicherung nach A-20 enthält beide.

## Entschieden — der Widerspruch an A-19.19 ist aufgelöst

Festgestellt am 2026-09-10 beim Einlesen der Pull Requests #5 bis #16, **entschieden am selben
Tag durch den Auftraggeber** (F-21, E-100). Von den beiden möglichen Wegen ist der zweite
gewählt: **gegen das Anhängen**.

A-19.19 steht damit unverändert in der Spezifikation — „Über das Outlook-Add-in entstehen
**keine** Anhänge" — und wird nicht geändert, sondern wieder wahr. Es fällt statt dessen
`POST /api/v1/addin/todos/{todoId}/attachments` samt `attachments.ts`, dem Aufrufer im Add-in,
der Beschreibung in der OpenAPI-Datei und `proof-followup.mjs`. Umgesetzt in T-247.

Drei Dinge, die aus diesem Fall über ihn hinaus gelten:

- **Der Wächter wird schärfer, nicht abgeräumt.** `proof:addin` Abschnitt 18 zählte Zeilen in
  `todo_attachment` nach einem Aufruf der **Anlegetür** — er maß die Tür, die zu ist, nicht die,
  die aufging. Er mißt künftig die Abwesenheit **jeder** Anhangstür unter `/addin`. Wer eine
  Abwesenheit zusichert, spannt seine Menge an der Anforderung auf, nicht an der Route, die er
  kennt (E-099 Punkt 3).
- **A-10.9 ist mitgeändert.** Sie verlangte ein Angebot auf dem gefundenen Todo. Der
  Aufgabenbereich weist auf einen vorhandenen Call nur noch **hin**; gehandelt wird dort nicht,
  weder buchend noch anhängend. Ohne diese Änderung wäre neben A-19.19 ein zweiter ungedeckter
  Widerspruch entstanden, diesmal in die andere Richtung.
- **Ein Satz, der eine Handlung nennt, die es nicht gibt, ist derselbe Fehler.** Die Warnung im
  Duplikatfall forderte „Hängen Sie diese E-Mail an das passende Todo" und wäre nach dem Rückbau
  eine Anweisung ins Leere geblieben. Sie verweist jetzt auf SuperTakt selbst. Beim Streichen
  einer Fläche gehören die Sätze über sie in denselben Auftrag — in beide Richtungen.

## Datensicherung, Fremdimport, Darstellung, Timer und Inaktivität

Spezifikation Abschnitte 20 bis 24, nachgereicht am 2026-09-08 und 2026-09-09, gebaut in den
Pull Requests #5 bis #16 **außerhalb des Wellenmodells** und deshalb ohne Qualitätstor. Was
hier steht, ist am Quelltext gelesen, nicht gemessen — in dieser Umgebung stehen weder Node
noch pnpm noch Cargo zur Verfügung. Bei jeder Freigabe zu prüfen:

- **Datensicherung (A-20).** Ein eigenes Archiv, JSON, mit Formatkennung
  `de.supertakt.data-archive`, ganzzahliger Schemafassung, Zeitpunkt und Erzeuger. **Der Code
  steht auf Fassung 5** (`DATA_ARCHIVE_VERSION`, `apps/local-api/src/features/data-transfer/data-transfer.ts`),
  liest 1 bis 5 und weist alles andere ab — die Spezifikation nennt in A-24.7 die Fassung 4 und
  kennt die 5 nicht. Das ist der zweite ungedeckte Punkt; er ist klein und gehört trotzdem
  benannt. Unbekannte Fassungen werden **abgewiesen, nicht geraten**, und ein ungültiges Archiv
  verändert nichts.
- **Der Round-Trip ist die Anforderung**, nicht das Herunterladen (A-20.4): Export und
  anschließender Import stellen denselben fachlichen Bestand her, einschließlich Kennungen,
  Zeitstempeln und Protokollen. Zugriffstoken und Migrationsbuch bleiben draußen.
- **Fremdimporte ergänzen, sie ersetzen nicht** (A-20.7). Todoist-CSV und
  Super-Productivity-JSON. Der Call-Nummern-Regex des Imports ist einstellbar, sein Vorgabewert
  `call[\s#:_-]*(\d{5,6})` ohne Groß-/Kleinschreibung; ein ungültiges oder zu langsames Muster
  bricht **vor** dem ersten Schreibzugriff ab. Aus einem Fremdbackup entstehen Verweise und
  Dateipfade als Anhänge — die Prüfung aus Abschnitt 19 gilt dort genauso, denn ein Pfad aus
  einer fremden Datei ist ein von außen geschriebener Öffnen-Befehl.
- **Der Rumpf des Archivs darf 64 MB** (`DATA_TRANSFER_MAX_BODY_BYTES`) gegen 1 MB im
  Normalfall. Das ist eine bewusste Ausnahme für eingebettete Bildanhänge und die einzige
  Stelle, an der B-1.7 gelockert ist.
- **Darstellung (A-21).** Die sichtbare Marke heißt SuperTakt; technische Kennungen und
  Datenpfade behalten ihre Namen — `identifier` bleibt `de.takt.desktop`, `generator` im Archiv
  bleibt `Takt`, die Kopfzeile bleibt `X-Takt-Token`. **Klassisch ist der Standard**, die alte
  Auswahl `clear` wird klassisch dargestellt. Farbmodus und Zeilendichte werden **getrennt**
  gespeichert; eine feste helle oder dunkle Palette wendet ihren Modus an, ohne die Vorliebe
  des Benutzers zu überschreiben. Alle Paletten liegen lokal; zur Laufzeit lädt nichts nach.
- **Leistungsabfrage (A-22).** Einstellbar, Vorgabe eingeschaltet. Ausgeschaltet bucht der
  Stopp ohne Dialog; vorhandener Leistungstext bleibt, fehlender wird in der Buchungsübersicht
  nachgetragen. **Die Exportregeln ändern sich nicht** — eine Buchung ohne Leistung ist eine
  Frage der Vollständigkeit, nicht des Formats.
- **Outlook-Einrichtung (A-23).** Der schwerste neue Punkt: Die Hülle darf nach **ausdrücklicher**
  Bestätigung ein Zertifikat in `Cert:\CurrentUser\Root` legen. Das ist ein Wurzelspeicher.
  Deshalb: **die Hülle bestimmt den Pfad selbst**, der Auftrag enthält nur den bestätigten
  SHA-256-Fingerabdruck, CA-Zertifikate und zusätzliche DNS-Namen sind ausgeschlossen, keine
  Rechteerhöhung, keine Änderung von Richtlinien, und die Windows-Sicherheitsabfrage bleibt
  stehen (drei Minuten Frist, `-NonInteractive` fällt für genau diesen einen Aufruf weg). Ein
  Eintrag im Speicher allein gilt **nicht** als bestandener HTTPS-Test — geprüft wird über
  Loopback mit regulärer Windows-TLS-Prüfung und Abgleich des Serverzertifikats. Im Browser und
  auf anderen Betriebssystemen behauptet nichts eine Windows-Vertrauensprüfung.
- **Inaktivität (A-24).** Systemweit gemessen und ausschließlich als Dauer: Windows
  `GetLastInputInfo`, macOS CoreGraphics, Linux Wayland `ext-idle-notify`, Mutter oder X11
  ScreenSaver. **Keine Eingabeinhalte, keine Fenstertitel, keine Telemetrie**, und XWayland gilt
  nicht als Ersatz für Wayland. Ohne Systemschnittstelle — im Browser — wird keine Erkennung
  behauptet. Der Timer läuft während der Abwesenheit weiter; erst die **Rückkehr** schließt die
  aktive Zeit ab und führt ihn atomar fort. Die Zuordnung muss **sekundengenau** den ganzen
  Zeitraum treffen, ohne Überlappung und ohne Doppelbuchung bei Wiederholung; gerundet wird
  weiterhin ausschließlich im Export.
- **Offene Phasen überleben Neuladen, Neustart und Datensicherung** (A-24.7). Sie stehen in
  SQLite, nicht im Arbeitsspeicher und nicht im Browserspeicher — dieselbe Regel wie beim
  übersprungenen Fassungswert, und aus demselben Grund.

## Text streichen und umbenennen

Vor jedem Auftrag, der einen Oberflächentext streicht oder einen zugänglichen Namen ändert, wird
der **heutige** Wortlaut in `tests/**` und `apps/*/test/**` gesucht, und das Ergebnis steht im
Auftrag (E-087). Gesucht wird über den **Wortlaut**, nicht über die Zeile — und über **beides**:
die versionierten Dateien **und** die Quellverzeichnisse im Arbeitsbaum. Keines allein trägt.
`git grep` übersieht **unversionierte Quelldateien** (T-207 hat zehn gezählt, darunter die Datei,
um die es ging); ein roher Lauf über den Arbeitsbaum findet **Bauergebnisse** mit veralteten
Kopien derselben Sätze (`apps/desktop/src-tauri/taskpane/`, von `apps/desktop/.gitignore`
ausgenommen). Also: `git grep` **plus** ein Lauf über `apps/*/src`, `packages/*/src`, `tests/`,
und Bauergebnisse ausgeschlossen. Eine Zahl aus einem Designpapier ist ein Stand, kein Nachweis: T-163 hat
gemessen, kein Streichkandidat sei durch einen Textvergleich festgenagelt — richtig gemessen und
inzwischen zweimal überholt. Streichung und Ausgleich laufen in **einem** Auftrag (E-081 Punkt 4);
ein Satz, den ein Prüfer verlangt hat, fällt nur mit dessen Zustimmung (E-078 Punkt 3).

## Sicherheit

Keine Zugangsdaten, keine Kundendaten und keine echten Call-Nummern im Repository. Testdaten
sind erfunden und liegen unter `tests/fixtures/`.

Base64 ist eine Kodierung, keine Verschlüsselung. Exportdateien enthalten lesbare Kundendaten.

Der lokale Dienst hört ausschließlich auf `127.0.0.1` und ist damit für jeden Prozess auf dem
Rechner erreichbar. Diese Vertrauensgrenze wird im Bedrohungsmodell bewertet, nicht ignoriert.

Seit der Versionsprüfung geht außerdem **eine** Verbindung nach außen (R-19). Damit betritt eine
fremde Antwort den Prozess, und aus ihr kann Text in die Oberfläche und eine Adresse in den
Browser des Benutzers wandern. Beide Wege sind im Bedrohungsmodell bewertet, bevor sie gebaut
werden.

Seit den Abschnitten 20 bis 24 kamen drei Wege dazu. Einer davon ist mit E-100 wieder entfallen;
die beiden übrigen sind noch **nicht** im Bedrohungsmodell bewertet (R-23 bis R-25):

- **Der Wurzelspeicher.** Die Hülle schreibt auf Bestätigung nach `Cert:\CurrentUser\Root`. Was
  dort liegt, gilt dem Benutzerkonto für **jede** TLS-Verbindung als vertrauenswürdig, nicht nur
  für den Aufgabenbereich. Die Enge des Auftrags — nur ein Fingerabdruck, Pfad von der Hülle
  gewählt, kein CA-Zertifikat — ist die ganze Sicherheit dieser Fläche.
- **Die fremde Datei.** Todoist-CSV und Super-Productivity-JSON sind von außen geschriebener
  Inhalt, und aus ihnen entstehen Anhänge: Verweise und **Dateipfade**. Damit reicht ein
  präpariertes Fremdbackup bis an den Öffnen-Befehl aus Abschnitt 19 heran (R-21).
- **Der Deep-Link aus Outlook.** Mit E-100 entfallen; die Route ist gefallen, nicht nur die
  Schaltfläche. Der Weg ist damit zu, bevor er bewertet werden mußte.

Base64 ist auch im Datenarchiv keine Verschlüsselung. Eine Datensicherung nach A-20 enthält
**mehr** lesbare Kundendaten als jeder Abrechnungsexport: interne Vermerke, Fristen, Anhänge
samt Bildkopien.

## Befehle

Die aktuellen Befehle stehen im Wurzel-`package.json` und in den jeweiligen Paketen.
`pnpm dev`, `pnpm desktop`, `pnpm check` und `pnpm test:e2e` sind eingerichtet.
Die sichtbare Marke heißt seit A-21 SuperTakt; technische Kennungen und Datenpfade
behalten aus Kompatibilitätsgründen ihre bisherigen Namen. Die Layoutänderungen
sind in `docs/design/supertakt-layout.md` beschrieben.

Das Tor heißt `pnpm check` und fährt in dieser Reihenfolge: `typecheck`, `boundaries`,
`contrast`, `proof:all`, `verify:bundle`, `test:coverage`, `test:rust`, `build`, `audit`.
`proof:all` sind **neunzehn** Nachweisläufe. Einer steht ausdrücklich **nicht** darin und läuft
einzeln: `proof:engines` (braucht WebKitGTK und seit PR #9 auch `python3-gi-cairo`).
`proof:followup` gibt es seit T-247 nicht mehr — es prüfte ausschließlich die Anhangsroute des
Add-ins und ist mit ihr gefallen (E-100).
`pnpm test:e2e` fährt drei Playwright-Konfigurationen nacheinander.

Drei GitHub-Abläufe: `pruefung.yml` bei Push und Pull Request, `release.yml` am Etikett,
`addin-build.yml` baut den Aufgabenbereich und prüft die Add-in-Aufrufe gegen den Dienst.
`rust:test` legt vor `cargo test --lib` über `prepare-rust-test.mjs` leere, nie ausgeführte
Platzhalter für Sidecar, Aufgabenbereich und Lizenzbeilage an — ohne sie bricht Tauri im
sauberen Baum vor dem ersten Prüffall ab (T-244).
