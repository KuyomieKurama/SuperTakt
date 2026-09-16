# Projektstruktur: gezielte Nacharbeit

Stand: 2026-09-14, auf Commit `7eeb0735f0c2728d12b3b579dd6860f04aef946f`
mit den bereits vorhandenen Änderungen im Arbeitsbaum. Kein Merge, keine Veröffentlichung.

## Befunde und Umsetzung

| Befund | Ergebnis und Änderung |
|---|---|
| Entwicklungsdokumentation widerspricht den Skripten | Bestätigt. `README.md`, `apps/web/README.md` und `docs/entwicklerhandbuch.md` verweisen für Gate-Reihenfolge und Nachweismenge auf die Paketkonfigurationen. `verify:bundle` ist im Gate, das Root-Skript `contrast` existiert. Die Musterseite heißt `/designsystem.html` und benötigt einen gesonderten Bau. |
| Archivbeschreibung auf Fassungen 1, 3 bzw. 4 stehengeblieben | Bestätigt. `docs/datenarchiv.md` erklärt die aktuelle Schreibfassung und Leser anhand von `DATA_ARCHIVE_VERSION`, `READABLE_VERSIONS` und `parseArchive`. Das alte Beispiel bleibt ausdrücklich historisch. Tabellen und Spalten werden über ihre Implementierung referenziert. |
| `ExportStatus` im UI erneut definiert | Bestätigt. `api/types.ts` und `shared/ui/ExportStatus.tsx` verwenden den Domänentyp. Die UI exportiert denselben Typ weiterhin für ihre vorhandenen Leser; keine neue Barrel-Datei. `reopened` und `not_billed` bleiben Darstellungszustände. |
| Fachliche Operationen auf zentrale und Feature-API verteilt | Bestätigt. Elf Funktionen sind nach `features/{structure,bookings,export,settings}/api.ts` verschoben; sämtliche Importe wurden angepasst. In `api/endpoints.ts` bleiben ausschließlich Health und globale Suche. `Pagination` liegt im gemeinsamen Vertrag und verwendet den bestehenden, ebenfalls auf `string` abgebildeten `PageCursor`. |
| Wiederholte unvollständige Testkontexte | Bestätigt. Drei zusammengehörige Dateien zur Timer-Wiederherstellung verwenden `test/support/timer-machine.ts`: echte SQLite-Datenbank, bewegliche Uhr und vollständig typisierte Ports. Die fachlichen Ausgangsdaten und Recovery-Aufnahmen bleiben in den Tests. Unbenutzte Portmethoden werfen mit ihrem Namen. |
| Strukturwächter müsste für die API-Verschiebung gelockert werden | Widerlegt. E-102 ist bereits umgesetzt: `proof:callers` findet die Feature-Dateien über unabhängige Sammler und behält seine Gegenproben. Keine Prüferwartung oder Ausnahmeliste wurde geändert. |
| Jeder unvollständige Testkontext sei zu ersetzen | Verworfen. Etwa `attachment-input-validation.test.ts` enthält absichtlich nur die Uhr, um jeden Portzugriff vor der Eingabevalidierung aufzudecken. Seine Begründung und sein Cast bleiben erhalten. Andere Testgruppen werden nicht pauschal umgestellt oder umgezogen. |

Beim Abgleich des Root-README wurden außerdem die veraltete Vorgabe „Klar“
und die Windows-exklusive, stets pausierende Inaktivitätsbeschreibung anhand von
`PreferencesContext.tsx`, `src-tauri/src/idle.rs` und `features/timer/idle.ts`
korrigiert. Dabei wurde kein Produktverhalten geändert.

Die historischen Entscheidungen E-102/E-103 bleiben unverändert. Die inzwischen
überholten Platzierungsbegründungen unmittelbar an den Feature-APIs sind durch
Beschreibungen der aktuellen Zuständigkeit ersetzt. Querverwendungen durch `app/`
oder andere Features erzeugen keine zusätzliche HTTP-Schicht: Die API-Dateien
importieren zur Laufzeit nur den gemeinsamen Client; ihre Verträge sind Typimporte.

Die acht Workspace-Pakete, `@takt/domain/export`, Add-in-Fähigkeiten, Tokenquelle,
getrennte Layouts, SQL-Migrationen samt eingebettetem Abbild, Paketnamen,
Kennungen, Datenpfade und Archivformate wurden durch diese Arbeit nicht geändert.
`image-sweep.ts` und `email-file-sweep.ts` verwenden bereits das gemeinsame
`orphan-sweep.ts`; dort besteht kein Anlass für eine weitere Zusammenlegung.
Die vorherigen Icon-, Dashboard-, Add-in- und Dokumentationsänderungen wurden erhalten.

## Nur bewertete Folgearbeiten

### `apps/outlook-addin/scripts/proof-addin.mjs`

Eine schrittweise Teilung kann sinnvoll sein, weil unterschiedliche Ausführungsarten
im selben Ablauf stehen: Quelltextprüfung, Office-/Worker-Nachbildungen und echte
SQLite-Integration. Die bloße Zeilenzahl begründet keine Teilung.

- **Ablaufsteuerung:** Quellen einmal auflösen, Vollständigkeit messen, `heading`,
  `check` und `checkAsync`, Ressourcen schließen und genau einen Gesamtausgang melden.
  Die bereits gemeinsamen Werkzeuge zur Quellenauflösung weiterverwenden.
- **Erste begrenzte Regelgruppe:** Abschnitt 21 zur Anhangsübernahme mit Plan,
  Nachbildung und Sammellauf. Die dazugehörigen Fehler- und Gegenproben gehören
  in dieselbe Gruppe, mit explizit übergebenen Quellen und Prüfmeldungen.
  Abschnitt 22 zu EWS, Berechtigungen und `getAsFileAsync` bleibt eine eigene
  Fähigkeitsprüfung und darf nicht von den Erfolgsfällen aus 21 abhängen.
- **Eigene Integration:** Abschnitt 11c prüft gleichzeitige Anfragen gegen echtes
  SQLite. Datenbankaufbau und Aufräumen gehören zu dieser Gruppe, nicht in einen
  globalen Fixture-Bestand. Die zustandsabhängigen Schritte innerhalb der Gruppe
  bleiben in ihrer Reihenfolge.
- **Voraussetzung:** Vor einer Extraktion Prüfnamen, Regelzuordnung, Quellenmenge,
  Gegenproben und Exitcodes beider Fassungen vergleichen. Eine importierte Datei
  darf nicht unbemerkt aus dem Scan oder dessen Selbstprüfung fallen (E-103).

Das Skript hat bereits fremde Änderungen im Arbeitsbaum und wurde hier nicht verändert.

### `apps/local-api/scripts/proof-release-safety.mjs`

Hier ist die Grenze bereits im Code angelegt: `collectTree` sammelt Quellen,
`CHECKS` registriert Regeln, `COUNTER_PROOFS` trägt gezielte Verstöße und der
abschließende `try`-Block führt Leserprüfungen, Gegenproben und Bestandsprüfung aus.

- **Quellen und Syntax:** Verzeichnislesen, Auflösung der TypeScript-Programme,
  Kommentar-/Code-Erkennung und Vollständigkeitsprüfung können eine Einheit bilden.
  Beide unabhängigen Wege zum Quellbestand und die Nichtleer-Prüfung bleiben erhalten.
- **Regeln:** Adressen, Antwortfelder, Öffnen, Download, Netzausgang und Optionen
  sind benannte Funktionen mit derselben Eingabeform. Der umfangreichere
  `checkNoStoreReadback` mit Port-, Import- und Verdrahtungsprüfungen ist eine
  fachlich zusammengehörige eigene Gruppe; seine Unterprüfungen nicht willkürlich teilen.
- **Gegenproben:** Je Regel mitführen; die Zuordnung über Regelkennungen bleibt
  geschlossen und wird auf fehlende sowie verwaiste Einträge geprüft. Insbesondere
  AST-/Verdrahtungsstümpfe nicht durch eine allgemeine Mock-Plattform ersetzen.
- **Ablaufsteuerung:** Ein Einstieg sammelt einmal, führt alle Gruppen und ihre
  Gegenproben aus und setzt den Exitcode. Keine impliziten Scans beim Modulimport.

Nutzen wäre die lokale Lesbarkeit einer Regel samt ihrem Nachweis, nicht mehr
Dateien. Beide Vorschläge bleiben Folgeaufträge; keine Skripte oder Backend-
Testverzeichnisse wurden dafür verschoben.

## Verifikation

| Prüfung | Ergebnis |
|---|---|
| `pnpm proof:callers` vor und nach der Verschiebung | Je 74 bestanden, keine geänderten Erwartungen. |
| Quelltextvergleich aller bisherigen zentralen API-Funktionen mit `HEAD` | Alle 13 Funktionen einschließlich Signaturen und Rümpfen unverändert und genau einmal vorhanden; elf verschoben. |
| `pnpm exec vitest run apps/local-api/test/usecases/timer-recovery-booking.test.ts apps/local-api/test/usecases/idle-service-start-guard.test.ts apps/local-api/test/usecases/data-transfer-timer-recovery.test.ts` | 3 Dateien, 22 Fälle bestanden; anschließend nochmals im vollständigen Gate erfasst. |
| `pnpm check` | Exitcode 0: Typprüfung einschließlich Paket- und E2E-Tests, Paketgrenzen, Kontrast, sämtliche `proof:all`-Läufe, `verify:bundle`, Abdeckung, Rust, Builds und Audit bestanden. |
| `test:coverage` innerhalb des Gates | 100 Dateien bestanden, 1 Datei übersprungen; 1.914 Fälle bestanden, 2 übersprungen. Alle konfigurierten Abdeckungsschwellen erfüllt. |
| `test:rust` innerhalb des Gates | 69 bestanden, 1 standardmäßig ignorierter Test. |
| `verify:bundle` innerhalb des Gates | 20 Prüfaussagen am gebauten Sidecar bestanden. |
| `audit` innerhalb des Gates | Keine bekannten Schwachstellen gemeldet. |
| `git diff --check`; lokale Dokumentlinks | Keine Leerraumfehler; alle lokalen Linkziele der geprüften Dokumente vorhanden. |

Zwei während der Umsetzung entstandene Fehler wurden vor dem grünen Gesamtlauf
behoben: Der neue vollständige Kontext benötigte auch `ClockPort.monotonicSeconds`;
der nach `api/types.ts` verschobene Cursor benötigte den bestehenden Herkunftstyp
`PageCursor`. Weder Tests noch Wächter wurden dafür abgeschwächt. Im abschließenden
Gate blieb kein Fehler übrig; ein vorbestehender roter Befund wurde nicht festgestellt.
Das vollständige lokale Prüfprotokoll liegt unter
`/tmp/supertakt-structure-check.log` (temporäres Artefakt, nicht versioniert).

## Grenzen und verbleibende Risiken

- Die zwei übersprungenen Vitest-Fälle betreffen die Windows-Zertifikatshilfe
  (`outlook-certificate.windows.test.ts`). Der ignorierte Rust-Fall benötigt eine
  echte unterstützte Desktopsitzung (`idle.rs`). Diese bestehenden Einschränkungen
  wurden nicht verändert.
- `pnpm test:e2e` und `pnpm proof:engines` wurden in diesem Auftrag nicht ausgeführt.
  Die API-Funktionen sind unverändert, ihre Aufruforte typgeprüft und die
  Vertrags-/Strukturwächter bestanden; eine erneute Browser-/Engine-Abnahme ist
  damit nicht behauptet.
- Die Code-, Spezifikations-/UX- und Sicherheitsdurchsicht erfolgte in dieser
  Sitzung: keine neue Route, kein veränderter Rumpf, keine neue Fähigkeit, keine
  Laufzeitänderung in der Domäne oder im Dienst, keine neue sichtbare Bedienung.
  Die unabhängigen Rollenfreigaben des organisatorischen Qualitätstors aus
  `CLAUDE.md` wurden nicht eingeholt. Das technische Gate `pnpm check` ist erfüllt;
  eine unabhängige Gesamtfreigabe wird hier nicht behauptet.
- Die meisten anderen handgebauten Testkontexte bleiben bewusst außerhalb dieses
  kleinen Schritts. Weitere Gruppen nur nach einem konkreten Wiederholungsbefund
  umstellen; Negativtests mit absichtlich fehlenden Ports gesondert behandeln.
- Der Arbeitsbaum enthält weiterhin fremde und frühere Änderungen. Der erfolgreiche
  Gesamtlauf beschreibt diesen gemeinsamen Stand, keine isolierte Veröffentlichung.
