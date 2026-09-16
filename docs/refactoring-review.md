# Projektweite Überarbeitung

Stand: 2026-09-15. Ausgangspunkt ist der vorhandene Arbeitsbaum, einschließlich
seiner bereits gestagten, ungestagten und unversionierten Änderungen. Diese Arbeit
wurde nicht committed und enthält keine Veröffentlichung.

## Anweisungen

- Im Hauptordner existiert keine `AGENTS.md`. Gefunden und als beabsichtigte
  Stilvorgabe verwendet: [`.codex/AGENTS.md`](../.codex/AGENTS.md).
- Ergänzend gelesen: [`CLAUDE.md`](../CLAUDE.md). Weitere `AGENTS.md` wurden
  außerhalb ausgeschlossener Fremd- und Buildverzeichnisse nicht gefunden.
- Widerspruch bei Kommentaren: Die gefundene AGENTS-Datei verlangt Englisch,
  der aktuelle Auftrag Deutsch. Neue und überarbeitete Kommentare sind Deutsch.
- Die Rollen- und Dateibeschränkungen in `CLAUDE.md` begrenzen den ausdrücklich
  projektweiten Benutzerauftrag nicht. Eine unabhängige Freigabe durch die dort
  genannten Reviewerrollen ist mit lokalen technischen Prüfungen nicht behauptet.

## Umfang und Befunde

Alle acht Workspace-Pakete sowie die eigenen Skripte, Testkonfigurationen und
CI-Abläufe wurden in die Bestands-, Import-/Struktur- und Duplikatprüfung einbezogen.
Die TS-/TSX-/MJS-Dateien wurden zusätzlich syntaxbasiert nach identischen
Funktionsrümpfen und umfangreichen Verzweigungen durchsucht. Die fachliche
Durchsicht konzentrierte sich auf diese Befunde, die bestehenden gemeinsamen
Bausteine und die unten genannten Grenzen. Das ist keine Aussage, jede Zeile
aller historischen Nachweisskripte manuell geprüft zu haben.

Installierte Bibliotheken, eingebettete Migrationsabbilder, generierte
Theme-Kataloge, Binärdateien und Buildausgaben wurden nicht manuell bearbeitet.
Vorhandene Generatoren durften ihre normalen Prüf-/Bauschritte ausführen.

| Bereich | Durchsicht und Ergebnis |
|---|---|
| `packages/domain` | Rundung, Exportstatus, Poolregeln, Namen, Zeichen, Fristen und Anhänge sowie Paketgrenze betrachtet. Bestehende Fachregeln beibehalten; identische Zeichenbereichsprüfung zusammengeführt und ausführliche Kommentare gekürzt. |
| `packages/storage` | Ports, SQLite-Repositories, Transaktionen, Blätterung und Migrationseinbindung betrachtet. Kommentare der Blätterung gekürzt; Sortierschlüssel, NUL-Trenner und Rückfall bei ungültigen Marken unverändert. Keine SQL-/Schemaänderung. |
| `packages/export` | Planung, Rendering, Quellenfreigabe und Rundung betrachtet. Renderer-Kommentare gekürzt; Schutz vor Prototypschlüsseln, fehlenden Werten und internen Vermerken dokumentiert und erhalten. |
| `apps/local-api` | Feature-/Routenstruktur, Eingabeschemata, Zusammenbau, Zugriffsschutz und Importpfad betrachtet. SP-Tageszeit ins vorhandene Zeitmodul verschoben; Standard-Tag-Operationen, Feldfehlerübersetzung sowie Portprüfung und Warten darauf wiederverwendet. |
| `apps/web` | Alle Featurebereiche, gemeinsame API-/UI-/Fachhelfer und Style-/Theme-Einbindung strukturell geprüft. Verschachtelte Darstellung des Exportlaufs im Auditmodell in explizite Fälle aufgelöst. Frühere API-/Theme-Arbeit erhalten. |
| `apps/outlook-addin` | API, Office-Anbindung, Call-Erkennung, Tagbaum, Anhänge und UI-Struktur betrachtet. Beim Anhangsabgleich verständliche Namen und kurze Kommentare; Reihenfolge, Kürzung und Multimengenabgleich unverändert. Fehlenden Office-Kontext beim Start defensiv behandeln (siehe unten). |
| `apps/desktop` | JS-/TS-Schnittstellen, Rust-Befehls-/Plattformstruktur, Tauri-Konfiguration und Bauskripte betrachtet. Rust-Zielbestimmung und Cargo-Zielpfadberechnung in den Bauskripten zusammengeführt. Öffnungs- und Zertifikatsprüfungen unverändert. |
| `packages/ui-tokens` | Gemeinsame Tokenquelle und ihre Einbindung geprüft. Eigenständige Grundlayouts von Web und Add-in bleiben getrennt. |
| Tests, Skripte, CI | E2E-Datums-/Prozesshelfer, Logger-Testaufzeichnung und sechs Browserkonfigurationen zusammengeführt; Kommentare gekürzt. Veralteten Web-Testpfad im CI-Job zur Inaktivität korrigiert. Drei zusätzliche Randfalltests für SP-Tageszeiten und zwei Regressionstests für fehlenden Office-Kontext. |

Im ersten Durchgang wurden 28 bestehende Dateien geändert und sieben Dateien
angelegt (fünf gemeinsame Helfer/Konfigurationen, ein Testmodul und dieser Bericht).

## Gemeinsame Implementierungen

| Gemeinsame Datei | Ersetzte Doppelung |
|---|---|
| `tests/e2e/support/wait-for.ts` | Fünf lokale Kopien von `waitFor` und `sleep` in den Dienst-/Web-Testhelfern. |
| `tests/e2e/support/child-process.ts` | Zwei identische Prozessbaum-Abbrüche in `services.ts` und `web-build-services.ts`; bestehende öffentliche Aufrufe bleiben erhalten. |
| `tests/e2e/playwright.shared.ts` | Browserprojekt, Sprache, Zeitzone und Diagnoseoptionen aus sechs Konfigurationen. Spezifische URLs, TLS-Ausnahme, Fristen, Setup, Ausschlüsse und Berichtspfade bleiben lokal. |
| `apps/local-api/scripts/port-probe.mjs` | Fünf identische Portprüfungen aus `proof-access`, `proof-conflicts`, `proof-tags`, `proof-addin-wiring` und `proof-export-api`. |
| `apps/desktop/scripts/rust-target.mjs` | Zwei identische Zielbestimmungen aus `collect-licenses.mjs` und `collect-release.mjs`, einschließlich Fehlermeldungen und Exitcode. |
| `apps/local-api/src/features/data-transfer/super-productivity-time.ts` | Die Berechnung eigener Tageszeiten liegt jetzt neben der bestehenden SP-Zeitlogik. Auslagerung aus `foreign.ts`, keine zusätzliche Parallelversion. |

Bewusst nicht zusammengeführt:

- Dateinamenableitung für Anhänge und Exportprotokoll: unterschiedlicher Rückfall
  bei abschließendem Pfadtrenner.
- `daySchema` und `dueDateSchema`: Filterform gegenüber tatsächlich gültigem
  Kalenderdatum, also unterschiedliche Validierungsverträge.
- Start-/Beendigungsvarianten der E2E-Dienste mit unterschiedlicher
  Bereitschaftserkennung oder Plattformbehandlung.
- Unabhängige Quellensammler und Gegenproben in Sicherheitsnachweisen:
  ihre Unabhängigkeit ist Teil der Kontrolle.
- Die vorhandene zentrale Rundung, Namensprüfung, Quellenfreigabe, Tokenquelle
  und Bereinigung verwaister Dateien brauchen keine neue Abstraktionsschicht.

## Beim Prüfen entdeckter vorbestehender Fehler

Die erste separate Add-in-Bündelprüfung scheiterte in beiden Fällen mit leerer
Oberfläche. Eine Browserdiagnose meldete `Cannot read properties of undefined
(reading 'mailbox')`. In der zuvor unveränderten `office/host.ts` prüften
`onItemChanged` und `readHost` zwar auf eine Mailbox, setzten aber bereits
`Office.context` voraus. Office.js kann `onReady` ohne diesen Kontext bereitstellen.

Zwei neue Tests scheiterten zunächst am Originalcode genau an diesen Zugriffen.
Mit `Office.context?.mailbox` wird nun die vorhandene Behandlung für „keine
Mailbox/kein Element“ erreicht. Danach bestanden die fünf Host-Tests und beide
unveränderten Browser-Bündeltests. Weder Browsererwartungen noch Sicherheits-
prüfungen wurden dafür abgeschwächt; es gibt keinen neuen Hostzustand.

## Prüfungen

| Prüfung | Ergebnis |
|---|---|
| Ausgangsstand: `pnpm exec vitest run --coverage` | 102 Dateien und 1.920 Fälle bestanden; eine Datei mit zwei Windows-Fällen übersprungen. Abdeckungsschwellen erfüllt. |
| Fünf betroffene API-Nachweise einzeln | 111 Access-, 154 Konflikt-, 45 Tag-, 32 Add-in- und 72 Export-API-Prüfaussagen bestanden. |
| Import-/Archivtests nach Auslagerung | 37 Fälle bestanden. |
| Neue SP-Randfälle und korrigierte CI-Testauswahl | Vier Dateien, 39 Fälle bestanden. |
| Vollständige Typprüfung | Bestanden, einschließlich Pakettests und E2E. |
| Vergleich der sechs aufgelösten Playwright-Konfigurationen | Alle Optionen unverändert. |
| Syntaxvergleich der Extraktionen | 14 Funktionsrümpfe unverändert; bei Renderer und Blätterung ausschließlich Kommentare geändert. |
| Rust-Zielbestimmung | Echter Linux-Host sowie CRLF-Ausgabe, Prozessfehler und fehlender Host geprüft. |
| `pnpm --filter @takt/desktop run licenses` | Erfolgreich: 372 Bestandteile, 171 verschiedene Lizenztexte; bestehende Meldung über zehn Bestandteile ohne eigenen mitgelieferten Text. |
| `pnpm check` | Exitcode 0: Theme-Abgleich, Typen, Paketgrenzen, Kontrast, alle Sicherheits-/Vertragsnachweise, ausführbarer Sidecar, Abdeckung, Rust, Builds und Audit bestanden. |
| Vitest im Gate | 103 Dateien und 1.925 Fälle bestanden; eine Datei mit zwei Windows-Fällen übersprungen. Abdeckung wie im Ausgangslauf: 91,84 % Anweisungen, 86,21 % Zweige, 94,89 % Funktionen, 94,02 % Zeilen. |
| Rust im Gate | 69 bestanden, ein Test für eine echte Desktopsitzung standardmäßig ignoriert. |
| `pnpm test:e2e` | Exitcode 0: 117 Hauptfälle, fünf Versionsfälle, zwei Anhangs-Neustartfälle und sechs Timerfälle bestanden; insgesamt 130. |
| Web-Bündel | Neun Browserfälle bestanden, einschließlich Fremdprozess-Gegenprobe. |
| Add-in-Bündel | Beide Browserfälle nach Behebung des oben beschriebenen vorbestehenden Fehlers bestanden. |
| Host-Regression | Vor Korrektur zwei neue Fälle rot, danach alle fünf Hostfälle grün; Add-in-Typprüfung bestanden. |
| Engine-Vergleich mit `--kein-uebersprung` | 23 Prüfaussagen bestanden; WebKitGTK und Chromium, vier Vorrichtungsseiten samt Gegenproben tatsächlich gerendert. |
| Abschließender Gate-Wiederholungslauf | Auch nach der Office-Korrektur `pnpm check` mit Exitcode 0. Endstand: 1.925 Vitest-Fälle, 69 Rust-Fälle, alle Nachweise, Builds und Audit bestanden. |
| Git-Index und Leerraum | Der vorhandene Index ist byteweise unverändert; `git diff --check` bestanden. |

Die ursprünglichen Änderungen an Dokumentation, Icons, Themes, APIs, Tests und
Teamdateien wurden nicht zurückgesetzt. Insbesondere werden die schon vorher
gelöschten Teamberichte nicht wiederhergestellt und die frühere Projektstruktur-
Dokumentation nicht als Ergebnis dieses Auftrags ausgegeben.

## Grenzen

- Die Durchsicht ist projektweit strukturell und prüfgestützt; eine vollständige
  manuelle Zeilenprüfung aller historischen Nachweisskripte oder eine unabhängige
  Sicherheitsabnahme ist nicht behauptet.
- Unter Linux bleiben die zwei Windows-Zertifikatstests und der explizit
  ignorierte Rust-Test mit echter Desktopsitzung offen. Windows/macOS,
  tatsächliches Outlook und Schreiben in einen Zertifikatsspeicher wurden
  hier nicht interaktiv geprüft.
- Der Engine-Vergleich misst seine Vorrichtungsseiten. Er ist keine Abnahme
  einer installierten Tauri-Anwendung, von macOS/WKWebView oder aller
  Fokuszustände.
- Die GitHub-CI einschließlich `cargo audit`, plattformübergreifender
  Installerbau und Signierung wurden nicht ausgeführt. Bibliotheken und
  Lockfiles wurden nicht geändert; der lokale Prüfauftrag veröffentlicht nichts.

Lokale Protokolle liegen unter `/tmp/supertakt-refactor-*.log`; sie sind
Prüfartefakte dieser Sitzung und keine dauerhaften Projektdateien.

## Nacharbeit: Kommentare

Der erste Durchgang hatte die Vorgabe zu Kommentaren nicht ausreichend umgesetzt.
Die Nacharbeit erfasste Kommentare im eigenen TypeScript-/JavaScript-Code über den
Parser, damit Kommentarzeichen in Testdaten und Zeichenketten erhalten bleiben.

- 128 ausführliche Kommentarstellen in API-Modulen, Domäne, Speicherung, Export,
  Add-in, Desktop sowie Prüfskripten und Tests entfernt oder gekürzt.
- 1.261 reine Trennlinienkommentare entfernt; Abschnittsüberschriften bleiben stehen.
- Zusätzlich die Rust-Dateiköpfe, den Token-Stylesheet-Kopf und den Kopf des
  Prüfworkflows gekürzt. Insgesamt 170 Quell- und Konfigurationsdateien geändert.
- Notwendige Hinweise zu Transaktionen, Authentifizierung, Fremdtext,
  Pfadnormalisierung und Prüfgrenzen erhalten; keine Logik neu zentralisiert.
- Syntaxbäume aller 158 betroffenen TypeScript-/JavaScript-Dateien ohne Kommentare
  sind vor und nach der Änderung identisch. Die übrigen zwölf Dateien unterscheiden
  sich ebenfalls ausschließlich in Kommentaren und Leerraum.

Dies ist keine Behauptung, dass jeder verbliebene Kommentar einzeln geprüft wurde.
Insbesondere bleiben längere Erläuterungen innerhalb der umfangreichen
Nachweisskripte und einzelner Implementierungen außerhalb dieser Kürzungen bestehen.

Die Nacharbeit besteht `pnpm check` (Exitcode 0): alle 22 Nachweispfade,
Sidecar-Prüfung, 1.925 Vitest-Fälle, 69 Rust-Fälle, Typen, Kontrast, Builds und
Audit erfolgreich. Abdeckung unverändert; dieselben zwei Windows-Fälle und ein
Rust-Test für die echte Desktopsitzung bleiben übersprungen. E2E wurde für diese
reine Kommentaränderung nicht erneut ausgeführt. `git diff --check` ist sauber,
der vorhandene Git-Index unverändert. Protokoll: `/tmp/supertakt-comments-check.log`.

## Fortsetzung nach erneutem Gesamtauftrag

Alle acht Pakete, die eigenen Skripte, Tests und Konfigurationen wurden erneut
anhand des vorhandenen Strukturberichts und einer frischen syntaxbasierten
Duplikatprüfung betrachtet. Die Suche umfasste 589 eigene TS-/TSX-/JS-/MJS-Dateien;
Generatorausgaben und Fremdbibliotheken waren ausgeschlossen. Verständliche
Implementierungen ohne begründeten Änderungsbedarf blieben bestehen.

### Weitere Zusammenführungen

| Gemeinsame Stelle | Entfernte Doppelung |
|---|---|
| `apps/local-api/src/http/input.ts:toFieldErrors` | Die lokale Kopie `toIssues` aus den Todo-Routen; alle acht Aufrufe verwenden die gemeinsame Übersetzung. |
| `apps/local-api/src/features/settings/settings.ts` | Die beiden Standard-Tag-Operationen aus `todos.ts`. Die bisherigen Exporte bleiben als Re-Exports erhalten; es entsteht kein Rückverweis zum Todo-Modul. |
| `packages/domain/src/characters.ts:isCodePointInRanges` | Die identische Bereichsprüfung aus `attachment.ts`. Der unabhängige Prüfer behält seine Gegenimplementierung. |
| `tests/e2e/support/local-time.ts` | Fünf Kopien der lokalen Tagesberechnung und neun Kopien von `todayAt`, verteilt auf zwölf Testdateien. Die Testrechnung bleibt unabhängig von der Produktivdomäne. |
| `apps/local-api/test/support/record-logs.ts` | Fünf identische Logger-Aufzeichnungen samt Ergebnisstruktur. Die tatsächliche Logger-Ausgabe wird weiterhin unverändert geparst. |
| `apps/desktop/scripts/rust-target.mjs:cargoTargetDir` | Zwei Cargo-Zielpfadberechnungen. Vorgabe, leerer Umgebungswert sowie relative und absolute Überschreibung bleiben gleich. |
| `apps/local-api/scripts/port-probe.mjs:waitForPortFree` | Fünf identische Warteschleifen mit unveränderten Fristen und Polling-Abständen. |

Die übrigen gleichen Funktionsrümpfe wurden eingeordnet: fallbezogene
Test-Portnachbildungen und Browserauswertungen bleiben lokal; voneinander
unabhängige Prüfalgorithmen werden nicht mit der geprüften Implementierung
zusammengeführt. Berichtsausgabe mit jeweils lokalen Zählern rechtfertigt keine
neue Prüfframework-Schicht.

### Kommentare

217 weitere ausführliche Blöcke in Domäne, Speicherung und Export wurden auf
heutige Verträge und notwendige Gründe gekürzt. Damit wurden sämtliche in diesem
Durchgang erfassten Domänenblöcke über acht Zeilen einzeln bearbeitet. Zusätzlich
wurden die zwölf Dateiköpfe der betroffenen E2E-Fälle gekürzt. Überholte Aussagen
zu noch fehlender Laufzeitlogik, früheren Poolregeln und Dateizuständigkeiten
entfielen. Lizenzvermerke, technische Direktiven und Kommentarzeichen in Testdaten
blieben erhalten.

Vor den funktionalen Zusammenführungen waren die Syntaxbäume der 39 ausschließlich
an Kommentaren bearbeiteten Dateien identisch. Die extrahierten Datumsfunktionen
wurden ebenfalls auf identische Syntax geprüft. Testfälle und Erwartungen wurden
nicht abgeschwächt.


Weitere 30 Kommentarstellen in 15 Web-, API- und Desktopdateien wurden gekürzt
oder ins Deutsche übertragen, einschließlich der notwendigen Sicherheitshinweise
im Zertifikatsskript. Der Codevergleich vor/nach diesen Änderungen war ebenfalls
identisch. Ausführliche Erläuterungen in weiteren Nachweisskripten bleiben bestehen;
eine vollständige Einzelprüfung jedes Kommentars ist weiterhin nicht behauptet.

### Erneute Prüfungen

- Vor den letzten Zusammenführungen: 24 Domänen-/Export-Testdateien mit 817 Fällen
  bestanden; anschließend vollständiger Projektcheck erfolgreich.
- Nach sämtlichen funktionalen Zusammenführungen: `pnpm check` erfolgreich,
  einschließlich 22 Nachweispfaden, Sidecar, Typprüfungen, 1.925 Vitest-Fällen,
  69 Rust-Fällen, Abdeckungsschwellen, Kontrast, Builds und Audit.
- `pnpm test:e2e` erfolgreich: 130 Fälle (117 Hauptsuite, fünf Versionsprüfungen,
  zwei Anhangspersistenz- und sechs Timer-Meldungsfälle), keine Fehlschläge.
- Die anschließenden reinen Kommentaränderungen wurden gesondert auf
  unveränderten Code geprüft. `pnpm proof:shell-surface` und `pnpm test:rust`
  bestanden danach erneut; der Plattformvorbehalt für Windows bleibt bestehen.
- `git diff --check` sauber; der bei Auftragsbeginn vorhandene Git-Index ist
  bytegleich. Vorhandene fremde Änderungen wurden nicht zurückgesetzt.

Protokolle: `/tmp/supertakt-round3-domain-tests.log`,
`/tmp/supertakt-round3-check-final.log` und `/tmp/supertakt-round3-e2e.log`.
Die oben genannten Grenzen für Windows/macOS, Outlook, interaktive Tauri-Prüfungen,
CI und unabhängige Freigaben gelten weiterhin.
