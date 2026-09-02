Aufgabe: T-013 — Typnamen auf Englisch (einschließlich T-013b)

Status: fertig

Artefakte:

Umbenannt (Datei neu, Inhalt übertragen):

- `packages/domain/src/rundung.ts` → `packages/domain/src/rounding.ts`
- `packages/domain/src/zeitbuchung.ts` → `packages/domain/src/time-entry.ts`
- `packages/domain/src/einstellungen.ts` → `packages/domain/src/settings.ts`

Geändert:

- `packages/domain/src/kernel.ts`, `todo.ts`, `tag.ts`, `export.ts`, `index.ts`
- `packages/storage/src/ports.ts`, `migration.ts`
- `packages/storage/migrations/0001_initial.up.sql` — `todo_status.is_done` und
  `todo.status_id_before_done` entfernt, samt der beiden Bedingungen, die daran hingen
- `packages/storage/migrations/0002_seed_defaults.up.sql` — Startbestand ohne `is_done`,
  englische Datenwerte, englische Transformationsnamen in der Standardvorlage
- `packages/storage/migrations/0001_initial.down.sql`, `0002_seed_defaults.down.sql` — neue
  Tabelle mit abgeräumt, Wächtertabelle englisch benannt
- `apps/local-api/openapi/takt-local-api.yaml` — 27 Schemanamen, alle Feldnamen, alle
  Routenpfade, alle `operationId`, Parameter- und Antwortkomponenten englisch
- `docs/architektur.md`, `docs/datenmodell.md`

Nicht angefasst: `packages/storage/src/index.ts` (war schon englisch), die beiden
`*.down.sql`-Dateien (nennen nur Tabellennamen), `docs/spec.md`, `CLAUDE.md`, `board.md`,
`decisions.md`, `risks.md`, `package.json`, `docs/glossar.md`, `docs/testplan.md`,
`docs/bedrohungsmodell.md`, die Handbücher, `packages/export/`, `apps/web/`, `apps/desktop/`,
`apps/outlook-addin/`, `apps/local-api/src/routes/addin/`, alle Testordner.

Zusammenfassung:

Sämtliche Bezeichner unter `packages/domain/src/` und `packages/storage/src/` sind englisch und
an den Tabellennamen ausgerichtet; `tag_folder` heißt jetzt `TagFolder`, `time_entry` heißt
`TimeEntry`, `todo_status` heißt `TodoStatus`. Ich habe die Dateien Zeile für Zeile durchgesehen
statt die Liste aus dem Auftrag abzuarbeiten und dabei über die genannten Namen hinaus unter
anderem `Behauptung`, `Markiert`, `Ergebnis`, `TaktFehler`, `Seite`, `Blaetterung`,
`ArbeitsEinheit`, `UhrPort`, `DateiPort`, `KennungsPort`, `MigrationsBefund` und sämtliche
Methodennamen der Ports übersetzt; ein Prüfskript, das Kommentare und Zeichenkettenliterale
entfernt und alle verbleibenden Bezeichner auflistet, findet keinen deutschen mehr. Deutsch
geblieben sind nur Kommentare, Anzeigetexte und acht Datenwerte, die als CHECK-Bedingung im SQL
stehen (`offen`, `exportiert`, `manuell`, `zurueckgesetzt`, `aufwaerts`, `kaufmaennisch`, `hell`,
`dunkel`). Dazu kamen die drei Korrekturen aus dem Lauf: die Tagesrundung mit dem neuen Typ
`ExportGroup`, die Entkopplung von Erledigt und Kanban-Spalte, und die Rücknahme der
Rückkehr-Spalte. `pnpm typecheck` konnte ich weiterhin nicht ausführen, weil der Arbeitsbereich
noch nicht existiert (T-008); ersatzweise habe ich TypeScript 5.9.3 gesondert installiert und
beide Pakete mit `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`, `noUnusedLocals` und `noUnusedParameters` übersetzt — Exitcode 0.

---

## Zuordnungstabelle alt zu neu

### Dateien

| alt | neu |
|---|---|
| `packages/domain/src/rundung.ts` | `packages/domain/src/rounding.ts` |
| `packages/domain/src/zeitbuchung.ts` | `packages/domain/src/time-entry.ts` |
| `packages/domain/src/einstellungen.ts` | `packages/domain/src/settings.ts` |

### `kernel.ts`

| alt | neu |
|---|---|
| `Markiert<T>` | `Branded<T>` |
| `marke` (unique symbol) | `brand` |
| `TagOrdnerId` | `TagFolderId` |
| `ZeitbuchungId` | `TimeEntryId` |
| `ExportVorlagenId` | `ExportTemplateId` |
| `ExportLaufId` | `ExportRunId` |
| `ExportProtokollId` | `ExportAuditId` |
| `Zeitstempel` | `Timestamp` |
| `Kalendertag` | `CalendarDay` |
| `Sekunden` | `Seconds` |
| `Viertelstunden` | `QuarterHours` |
| `Ergebnis<T, F>` | `Result<T, E>` |
| `Ergebnis.wert` | `Result.value` |
| `Ergebnis.fehler` | `Result.error` |
| `TaktFehlerCode` | `TaktErrorCode` |
| `TaktFeldFehler` | `TaktFieldError` |
| `TaktFeldFehler.feld` | `TaktFieldError.field` |
| `TaktFeldFehler.nachricht` | `TaktFieldError.message` |
| `TaktFehler` | `TaktError` |
| `TaktFehler.nachricht` | `TaktError.message` |
| — | **neu:** `ExportRunGroupId` |

`TodoId`, `TagId`, `StatusId`, `PoolId` und alle Fehlercodes waren bereits englisch.

### `rounding.ts` (vormals `rundung.ts`)

| alt | neu |
|---|---|
| `SekundenJeViertelstunde` | `SecondsPerQuarterHour` |
| `Rundungsmodus` | `RoundingMode` |
| `RundeAufViertelstunden` | `RoundToQuarterHours` |
| Parameter `sekunden`, `modus` | `seconds`, `mode` |
| `ViertelstundenAlsExportzahl` | `QuarterHoursToExportNumber` |
| Parameter `viertel` | `quarters` |
| `RoundingMode` Werte `'aufwaerts' \| 'kaufmaennisch'` | `'up' \| 'nearest'` |

### `todo.ts`

| alt | neu |
|---|---|
| `Kanbanspalte` | `TodoStatus` |
| `Kanbanspalte.istErledigt` | **entfernt** |
| `Kanbanspalte.istStandard` | `TodoStatus.isDefault` |
| `Kanbanspalte.farbe` | `TodoStatus.color` |
| `Todo.titel` | `Todo.title` |
| `Todo.statusIdVorErledigt` | **entfernt** |
| `Todo.boardRang` | `Todo.boardRank` |
| `TodoNotiz` | `TodoNote` |
| `TodoAnlegen` | `TodoCreate` |
| `TodoAnlegen.titel` / `.notiz` / `.jetzt` | `TodoCreate.title` / `.note` / `.now` |
| `TodoAendern` | `TodoUpdate` |
| `TodoAendern.titel` / `.boardRang` / `.jetzt` | `TodoUpdate.title` / `.boardRank` / `.now` |
| `TodoFilter.suche` | `TodoFilter.search` |
| `TodoFilter.nurOffene` | `TodoFilter.onlyOpen` |
| `TodoFilter.nurMitOffenenBuchungen` | `TodoFilter.onlyWithOpenEntries` |

### `tag.ts`

| alt | neu |
|---|---|
| `TagOrdner` | `TagFolder` |
| `TagOrdnerKnoten` | `TagFolderNode` |
| `.ordner` / `.unterordner` | `.folder` / `.subfolders` |
| `TagBaum` | `TagTree` |
| `.wurzelOrdner` / `.wurzelTags` | `.rootFolders` / `.rootTags` |
| `PruefeVerschiebung` | `CheckFolderMove` |
| Eingabe `ordnerId` / `neuerParentId` / `vorfahrenDesZiels` | `folderId` / `newParentId` / `targetAncestors` |
| `Tag.farbe` | `Tag.color` |
| `PoolRegelteil` | `PoolRuleTerm` |
| `{ art: 'tag' }` / `{ art: 'ordner' }` | `{ kind: 'tag' }` / `{ kind: 'folder' }` |
| `Pool.modus` | `Pool.matchMode` |
| `Pool.mitUnterordnern` | `Pool.includeSubfolders` |
| `Pool.regel` | `Pool.rule` |
| `GehoertZuPool` | `MatchesPool` |
| Eingabe `regelTagIds` / `modus` | `ruleTagIds` / `matchMode` |
| `StandardTag` | `DefaultTag` |
| `WendeStandardTagsAn` | `ApplyDefaultTags` |
| Parameter `gewaehlt` / `standard` | `selected` / `defaults` |
| — | **neu:** `IsVisibleInPool` |

### `time-entry.ts` (vormals `zeitbuchung.ts`)

| alt | neu |
|---|---|
| `Exportstatus` | `ExportStatus` |
| `Buchungsquelle` | `TimeEntrySource` |
| `Zeitbuchung` | `TimeEntry` |
| `.dauerSekunden` / `.notiz` / `.exportstatus` / `.exportAnzahl` / `.quelle` | `.durationSeconds` / `.note` / `.exportStatus` / `.exportCount` / `.source` |
| `LaufendeBuchung` | `RunningTimeEntry` |
| `TimerStartWunsch` | `TimerStartRequest` |
| `.laufendenStoppen` / `.jetzt` | `.stopRunning` / `.now` |
| `TimerStartErgebnis` | `TimerStartResult` |
| `art: 'gestartet'` | `kind: 'started'` |
| `art: 'rueckfrage_noetig'` | `kind: 'confirmation_required'` |
| `.buchung` / `.gestoppt` / `.erledigtAufgehoben` | `.entry` / `.stopped` / `.doneCleared` |
| `.laufend` / `.laufendAufTodoTitel` | `.running` / `.runningTodoTitle` |
| `TimerStartErgebnis.statusId` | **entfernt** |
| `BestimmeWiederaufnahme` | `DetermineReopen` |
| Eingabe `istErledigt` | `isDone` |
| Eingabe `statusIdVorErledigt`, `standardStatusId`, `aktuelleStatusId` | **entfernt** |
| Ausgabe `erledigtAufheben` / `neueStatusId` | `clearDone`, `newStatusId` **entfernt** |
| `MindestdauerSekunden` | `MinimumDurationSeconds` |
| `TimerStoppErgebnis` | `TimerStopResult` |
| `art: 'gebucht'` / `art: 'verworfen'` | `kind: 'recorded'` / `kind: 'discarded'` |
| `.grund` / `.dauerSekunden` | `.reason` / `.durationSeconds` |
| `Exportstatuswechsel` | `ExportStatusTransition` |
| `.von` / `.nach` / `.ausloeser` | `.from` / `.to` / `.trigger` |
| `ausloeser: 'exportlauf'` / `'zuruecksetzen'` | `trigger: 'export_run'` / `'reset'` |
| `PruefeExportstatuswechsel` | `CheckExportStatusTransition` |
| `IstGesperrt` | `IsLocked` |
| `ProtokollEreignis` | `ExportAuditEvent` |
| `ExportProtokollZeile` | `ExportAuditEntry` |
| `.zeitbuchungId` / `.ereignis` / `.vorher` / `.nachher` | `.timeEntryId` / `.event` / `.previousStatus` / `.newStatus` |
| `.exportLaufId` / `.viertelstunden` / `.akteur` / `.grund` / `.zeitpunkt` | `.exportRunId` / `.quarters` / `.actor` / `.reason` / `.occurredAt` |
| `ZuruecksetzenAntrag` | `ExportStatusResetRequest` |
| `.zeitbuchungId` / `.grund` / `.akteur` / `.jetzt` | `.timeEntryId` / `.reason` / `.actor` / `.now` |
| `ExportStatus` Werte `'offen' \| 'exportiert'` | `'open' \| 'exported'` |
| `TimeEntrySource` Werte `'timer' \| 'manuell'` | `'timer' \| 'manual'` |
| `ExportAuditEvent` Werte `'exportiert' \| 'zurueckgesetzt'` | `'exported' \| 'reset'` |
| `ExportStatusTransition.from` / `.to` Werte | `'open'` / `'exported'` |
| `ExportAuditEntry.quarters` | **entfernt**, ersetzt durch `.exportRunGroupId` |

### `export.ts`

| alt | neu |
|---|---|
| `ExportKandidat` | `ExportCandidate` |
| `.zeitbuchungId` / `.dauerSekunden` / `.buchungsnotiz` | `.timeEntryId` / `.durationSeconds` / `.bookingNote` |
| `.todoTitel` / `.todoTagNamen` / `.bereitsEinmalExportiert` | `.todoTitle` / `.todoTagNames` / `.previouslyExported` |
| `ExportSystemkontext` | `ExportSystemContext` |
| `.exportiertAm` / `.rundungsmodus` | `.exportedAt` / `.roundingMode` |
| `ExportQuellenpfad` | `ExportSourcePath` (Werte unverändert) |
| `Behauptung<T>` | `Assert<T>` |
| `NotizgrenzeIstDicht` | `NoteBoundaryIsSealed` |
| `TodoQuellenSindGedeckt` | `TodoSourcesAreCovered` |
| `ExportVorlagenHuelle` | `ExportTemplateEnvelope` |
| `.istEingebaut` | `.isBuiltin` |
| `ExportLauf` | `ExportRun` |
| `.vorlagenId` / `.vorlagenAbzug` / `.dateipfad` / `.dateiSha256` | `.templateId` / `.templateSnapshot` / `.filePath` / `.fileSha256` |
| `.anzahlBuchungen` / `.summeViertelstunden` / `.rundungsmodus` | `.entryCount` / `.totalQuarters` / `.roundingMode` |
| `ExportAuftrag` | `ExportJob` |
| `.vorlagenId` / `.zeitbuchungIds` / `.jetzt` | `.templateId` / `.timeEntryIds` / `.now` |
| `ExportVorschau` | `ExportPreview` |
| `.zeilen` / `.anzahlBuchungen` / `.summeViertelstunden` | `.rows` / `.entryCount` / `.totalQuarters` |
| `.rundungsmodus` / `.davonSchonEinmalExportiert` | `.roundingMode` / `.previouslyExportedCount` |
| — | **neu:** `ExportGroup`, `ExportNoteSeparator`, `ForbiddenNoteKey`, `ExportCandidateHasNoTodoNote`, `ExportGroupHasNoTodoNote`, `ExportRunGroup`, `ExportRunEntry` |

### `settings.ts` (vormals `einstellungen.ts`)

| alt | neu |
|---|---|
| `Einstellungen` | `AppSettings` |
| `.exportOrdner` / `.aktiveExportVorlagenId` / `.rundungsmodus` | `.exportDirectory` / `.activeExportTemplateId` / `.roundingMode` |
| `.sprache` / `.darstellung` | `.locale` / `.theme` |
| `EinstellungenAendern` | `AppSettingsUpdate` (`.jetzt` → `.now`) |
| `ExportOrdnerPruefung` | `ExportDirectoryCheck` |
| `.aufgeloesterPfad` / `.grund` | `.resolvedPath` / `.reason` |
| `theme` Werte `'system' \| 'hell' \| 'dunkel'` | `'system' \| 'light' \| 'dark'` |
| `grund: 'nicht_gesetzt'` / `'fehlt'` / `'nicht_beschreibbar'` / `'kein_ordner'` | `reason: 'not_set'` / `'missing'` / `'not_writable'` / `'not_a_directory'` |

### `packages/storage/src/ports.ts`

| alt | neu |
|---|---|
| `Seite<T>` | `Page<T>` |
| `.eintraege` / `.naechsteMarke` / `.gesamt` | `.items` / `.nextCursor` / `.total` |
| `Blaetterung` | `Pagination` |
| `.marke` / `.anzahl` | `.cursor` / `.limit` |
| `TransaktionsPort` | `TransactionPort` |
| `.inTransaktion(arbeit, einheit)` | `.inTransaction(work, unit)` |
| `ArbeitsEinheit` | `UnitOfWork` |
| `.notizen` / `.ordner` / `.spalten` / `.buchungen` / `.vorlagen` / `.einstellungen` / `.standardTags` | `.notes` / `.folders` / `.statuses` / `.timeEntries` / `.templates` / `.settings` / `.defaultTags` |
| `TodoNotizPort` | `TodoNotePort` |
| `TagOrdnerPort` | `TagFolderPort` |
| `KanbanspaltenPort` | `TodoStatusPort` |
| `ZeitbuchungFilter` | `TimeEntryFilter` |
| `.exportstatus` / `.vonTag` / `.bisTag` / `.nurSchonEinmalExportiert` | `.exportStatus` / `.fromDay` / `.toDay` / `.onlyPreviouslyExported` |
| `ZeitbuchungPort` | `TimeEntryPort` |
| `ExportLesePort` | `ExportReadPort` |
| `ExportVorlagenPort` | `ExportTemplatePort` |
| `EinstellungenPort` | `AppSettingsPort` |
| `StandardTagPort` | `DefaultTagPort` |
| `UhrPort` | `ClockPort` (`.jetzt` → `.now`, `.monotonSekunden` → `.monotonicSeconds`) |
| `KennungsPort` | `IdPort` (`.neu` → `.next`) |
| `DateiPort` | `FilePort` |
| `.pruefeExportOrdner(pfad)` / `.schreibeDatei(ordner, dateiname, inhalt)` | `.checkExportDirectory(path)` / `.writeFile(directory, fileName, content)` |
| Methoden `lade` / `ladeMehrere` / `suche` / `liste` / `lege_an` / `aendere` / `loesche` | `load` / `loadMany` / `search` / `list` / `create` / `update` / `remove` |
| `findeNachCallNumber` / `markiereErledigt` / `hebeErledigtAuf` / `summeSekunden` | `findByCallNumber` / `markDone` / `clearDone` / `sumSeconds` |
| `schreibe` / `listeImOrdner` / `benenneUm` / `verschiebe` / `setzeAmTodo` | `write` / `listInFolder` / `rename` / `move` / `setOnTodo` |
| `listeKinder` / `ladeBaum` / `vorfahren` / `teilbaum` | `listChildren` / `loadTree` / `ancestors` / `subtree` |
| `loeseRegelAuf` / `mitglieder` / `standardSpalte` / `ordneNeu` | `resolveRule` / `members` / `defaultStatus` / `reorder` |
| `laufender` / `starte` / `stoppe` | `running` / `start` / `stop` |
| `offeneKandidaten` / `anzahlOffen` | `openCandidates` / `openCount` |
| `fuehreLaufAus` / `ladeLauf` / `listeLaeufe` / `setzeStatusZurueck` / `protokoll` / `summeViertelstunden` | `runExport` / `loadRun` / `listRuns` / `resetStatus` / `audit` / `sumQuarters` |
| `eingebaute` / `setze` | `builtin` / `set` |
| Parameter `blaetterung` / `eingabe` / `jetzt` / `felder` / `reihenfolge` / `auftrag` / `antrag` / `farbe` / `notiz` | `pagination` / `input` / `now` / `fields` / `order` / `job` / `request` / `color` / `note` |
| — | **neu:** `ExportReadPort.openGroups`, `ExportPort.runGroups`, `ExportPort.loadRunGroup` |

### `packages/storage/src/migration.ts`

| alt | neu |
|---|---|
| `AngewandteMigration` | `AppliedMigration` |
| `MigrationsBefund` | `MigrationState` |
| `art: 'aktuell'` / `'ausstehend'` / `'bestand_zu_neu'` / `'pruefsumme_abweichend'` | `kind: 'current'` / `'pending'` / `'database_too_new'` / `'checksum_mismatch'` |
| `.von` / `.bis` / `.anzahl` / `.bestand` / `.bekannt` | `.from` / `.to` / `.count` / `.database` / `.known` |
| `MigrationsLaeuferPort` | `MigrationRunnerPort` |
| `.befund` / `.angewandte` / `.aufNeuesten` / `.zurueckAuf(zielVersion)` | `.state` / `.applied` / `.migrateToLatest` / `.migrateDownTo(targetVersion)` |
| `.sicherung` | `.backup` |
| `VerbindungsEinstellungen` | `ConnectionSettings` |

### OpenAPI-Schemata

| alt | neu |
|---|---|
| `Kennung` | `Id` |
| `Zeitstempel` | `Timestamp` |
| `Farbe` | `Color` |
| `Exportstatus` | `ExportStatus` |
| `Rundungsmodus` | `RoundingMode` |
| `Blaetterung` | `PageInfo` |
| `Fehlerhuelle` | `ErrorEnvelope` |
| `TodoAnlegen` / `TodoAendern` / `TodoNotiz` | `TodoCreate` / `TodoUpdate` / `TodoNote` |
| `TagOrdner` / `TagOrdnerKnoten` / `TagBaum` | `TagFolder` / `TagFolderNode` / `TagTree` |
| `PoolRegelteil` / `PoolSchreiben` | `PoolRuleTerm` / `PoolWrite` |
| `Kanbanspalte` | `TodoStatus` |
| `Zeitbuchung` | `TimeEntry` |
| `LaufenderTimer` | `RunningTimer` |
| `ExportVorlage` / `ExportLauf` / `ExportVorschau` | `ExportTemplate` / `ExportRun` / `ExportPreview` |
| `ProtokollZeile` | `ExportAuditEntry` |
| `Einstellungen` | `AppSettings` |
| — | **neu:** `ExportRunGroup` |

Die Feldnamen in den Schemata folgen der Domäne, siehe die Tabellen oben. Zusätzlich:
Anfragefeld `notizFuerLaufenden` → `noteForRunning`, `grenze` → `limit`, Abfrageparameter
`mitUnterordnern` → `includeSubfolders`, `zeitbuchungId` → `timeEntryId`, Antwortfeld
`gestartet` → `started`.

---

## Entfernte Felder — für T-015 und T-016

| Feld | Wo | Warum |
|---|---|---|
| `todo_status.is_done` | Schema 0001, `TodoStatus.istErledigt`, OpenAPI `Kanbanspalte.istErledigt`, Anfragekörper beim Anlegen und Ändern einer Spalte | Erledigt (A-2.4) und die Kanban-Abschlussspalte (A-5.3) sind zwei getrennte Dinge. Die Markierung existierte nur, um beides zu koppeln. |
| `todo.status_id_before_done` | Schema 0001, `Todo.statusIdVorErledigt` | Das Erledigen verschiebt die Karte nicht mehr, also gibt es beim Wiederaufnehmen nichts wiederherzustellen. |
| `TimerStartErgebnis.statusId` | `TimerStartResult` | Der Timerstart ändert die Spalte nicht; es gibt keine neue Spalte zu melden. |
| Eingaben von `BestimmeWiederaufnahme` | `DetermineReopen` | Bleibt `{ isDone } → { clearDone }`. Keine `statusIdVorErledigt`, keine `standardStatusId`, keine `neueStatusId`. |
| `TodoPort.clearDone(id, newStatusId, now)` | ports.ts | jetzt `clearDone(id, now)`. |
| `app_setting.reopen_status_id` | nirgends | war kurzzeitig angelegt und wurde auf Anweisung wieder zurückgenommen; Migration 0003 existiert nicht. |

| `export_run_entry.quarters` | Schema 0001 | Der gerundete Wert gehört der Zeile, nicht der Buchung. Ersetzt durch `export_run_group_id` und `duration_seconds`. |
| `export_audit.quarters` | Schema 0001, `ExportAuditEntry.quarters` | Dasselbe. Ersetzt durch `export_run_group_id`. |
| `ExportRun.timeEntryIds` (nur OpenAPI) | OpenAPI | Ersetzt durch `ExportRun.groups`, weil die Zeile und nicht die Buchung die Einheit ist. |

**Welcher Mechanismus jetzt drin ist:** Ein Todo trägt `completed_at` als eigenständiges
Erledigt-Kennzeichen, unabhängig von `status_id`. Es kann in „Done" stehen und nicht erledigt
sein und umgekehrt. Weder Setzen noch Aufheben von Erledigt verschiebt die Karte. A-2.5 läuft
über die Sichtbarkeit: `IsVisibleInPool` in `packages/domain/src/tag.ts` blendet erledigte Todos
in Pool-Ansichten aus. Hebt ein Timerstart das Kennzeichen auf, erscheint das Todo ohne einen
einzigen zusätzlichen Schreibvorgang wieder in seinem Pool, in derselben Spalte wie zuvor.
`todo_status.is_default` bleibt, hat aber nur noch eine Aufgabe: die Spalte, in der ein neu
angelegtes Todo landet, wenn der Aufrufer keine nennt.

---

## Tagesrundung — was ich angelegt habe

`ExportGroup` in `packages/domain/src/export.ts`: `{ todoId, day, entries, todoTitle,
todoCallNumber, todoTagNames, previouslyExported }`. `entries` ist eine nicht leere, nach
`startedAt` sortierte Liste von `ExportCandidate` und enthält **ausschließlich** Buchungen mit
`export_status = 'offen'`. `ExportNoteSeparator = '; '` steht daneben, damit Vorschau und Datei
dasselbe Trennzeichen benutzen (R-17). Rundung, Summenbildung und Textzusammenführung sind
nicht umgesetzt — das ist T-009.

`ExportReadPort.openGroups()` ist der zugehörige Port. `openCandidates()` bleibt für Vorschau
und Listen erhalten.

Gegen das laufende Schema nachgerechnet, ohne Schemaänderung:

```sql
SELECT todo_id, date(started_at) AS day, sum(duration_seconds), group_concat(booking_note, '; ')
FROM (SELECT * FROM v_export_candidate ORDER BY todo_id, date(started_at), started_at)
GROUP BY todo_id, date(started_at);
```

Ergebnis mit vier Buchungen an einem Tag, davon einer bereits exportiert: eine Gruppe mit
10 + 20 + 5 Minuten = 2 100 s → 0,75; die exportierte Buchung über 60 Minuten bleibt draußen.
Eine Buchung von 23:40 bis 00:20 landet vollständig in der Gruppe des Starttags. Abfrageplan:
`SCAN te USING INDEX ix_time_entry_queue` — der partielle Index auf die offenen Buchungen, kein
Basistabellenscan.

---

## Nachweis der Notiz-Trennung

Der Nachweis aus T-001 wurde wiederholt und um die Gruppenebene erweitert. Drei Zusicherungen,
jede einzeln durch versuchsweises Einfügen ausgelöst und danach zurückgenommen:

| Probe | Erwartung | Ergebnis |
|---|---|---|
| `'todo.note'` in `ExportSourcePath` aufgenommen | Übersetzer bricht ab | `export.ts(176,3): error TS2344` in `NoteBoundaryIsSealed` **und** `(188,3)` in `TodoSourcesAreCovered` |
| Feld `todoNote: string` an `ExportGroup` gehängt | Übersetzer bricht ab | `export.ts(225,3): error TS2344` in `ExportGroupHasNoTodoNote` |
| Feld `vermerk: string` an `ExportCandidate` gehängt | Übersetzer bricht ab | `export.ts(213,3): error TS2344` in `ExportCandidateHasNoTodoNote` |
| unverändert | übersetzt sauber | Exitcode 0, Datei byteweise identisch mit dem Ausgangsstand |

Die gesperrten Feldnamen stehen in `ForbiddenNoteKey`: `note`, `notiz`, `vermerk`, `todoNote`,
`todoNotiz`, `todoVermerk`. Ein bloßes `note` ist absichtlich dabei — auf einem Typ, den der
Exportmotor in der Hand hält, ist „Notiz" ohne Zusatz mehrdeutig, und genau diese Mehrdeutigkeit
ist der Bedienfehler aus R-08. Die Leistung der Buchung heißt deshalb `bookingNote`, nicht
`note`.

Die anderen drei Schichten sind unverändert: eigene Tabelle `todo_note`, Sicht
`v_export_candidate` ohne die Spalte, eigener Einstiegspunkt `@takt/domain/export`, der weder
`Todo` noch `TodoNote` herausgibt.

---

## Nachweis Migration und Übersetzung

| Prüfung | Ergebnis |
|---|---|
| 0001 up, 0002 up | ok, `integrity_check` = ok, `foreign_key_check` leer |
| 0002 down, 0001 down auf leerem Bestand | ok, 0 verbleibende Objekte |
| erneut 0001 up, 0002 up | ok, `integrity_check` = ok |
| Objektzahl nach 0001 | 15 Tabellen, 30 Indizes, 10 Trigger, 1 Sicht — unverändert gegenüber T-001 |
| Startbestand | Backlog (Standard), In Progress, Waiting, Done — keine Erledigt-Markierung mehr |
| Erledigtes Todo in Spalte „Backlog" | zulässig, Entkopplung nachgewiesen |
| Übersetzung beider Pakete, strict | Exitcode 0 |
| Bezeichnerprüfung (Kommentare und Literale entfernt) | kein deutscher Bezeichner mehr |
| OpenAPI | gültiges YAML, 31 Pfade, 26 Schemata, alle `$ref` auflösbar |

Ausgeführt gegen SQLite 3.53.4 und `node:sqlite` aus Node 22.23.2, TypeScript 5.9.3.

---

---

## T-013b — die drei freigegebenen Punkte

### 1. Routenpfade und `operationId` englisch

31 Pfade, 51 `operationId`, 11 Parameter- und 5 Antwortkomponenten umbenannt.
`docs/architektur.md` nachgezogen; die Berichte blieben unberührt.

| alt | neu |
|---|---|
| `/todos/{todoId}/notiz` | `/todos/{todoId}/note` |
| `/todos/{todoId}/erledigt` | `/todos/{todoId}/done` |
| `/tag-baum` | `/tag-tree` |
| `/tag-ordner`, `/tag-ordner/{ordnerId}` | `/tag-folders`, `/tag-folders/{folderId}` |
| `/tag-ordner/{ordnerId}/verschieben` | `/tag-folders/{folderId}/move` |
| `/kanban-spalten`, `/kanban-spalten/{statusId}` | `/todo-statuses`, `/todo-statuses/{statusId}` |
| `/kanban-spalten/reihenfolge` | `/todo-statuses/order` |
| `/zeitbuchungen`, `/zeitbuchungen/{buchungId}` | `/time-entries`, `/time-entries/{timeEntryId}` |
| `/zeitbuchungen/{buchungId}/exportstatus` | `/time-entries/{timeEntryId}/export-status` |
| `/export/vorlagen`, `/export/vorlagen/{vorlagenId}` | `/export/templates`, `/export/templates/{templateId}` |
| `/export/vorschau` | `/export/preview` |
| `/export/laeufe`, `/export/laeufe/{laufId}` | `/export/runs`, `/export/runs/{runId}` |
| `/export/protokoll` | `/export/audit` |
| `/einstellungen`, `/einstellungen/standard-tags` | `/settings`, `/settings/default-tags` |

`/health`, `/todos`, `/tags`, `/pools`, `/timer` waren bereits englisch.

`operationId` durchgehend nach dem Muster Verb + Ressource: `zustand` → `health`, `todosSuchen` →
`searchTodos`, `todoNotizSchreiben` → `putTodoNote`, `todoWiederAktivieren` → `clearTodoDone`,
`tagOrdnerVerschieben` → `moveTagFolder`, `spaltenOrdnen` → `reorderTodoStatuses`,
`exportstatusZuruecksetzen` → `resetExportStatus`, `exportAusfuehren` → `runExport`,
`protokollLesen` → `listExportAudit`, `standardTagsSetzen` → `setDefaultTags` — alle 51 geprüft.

Komponenten: Parameter `OrdnerId`/`BuchungId`/`VorlagenId`/`LaufId`/`Suche`/`Marke`/`Anzahl` →
`FolderId`/`TimeEntryId`/`TemplateId`/`RunId`/`Search`/`Cursor`/`Limit`, mit den Parameternamen
selbst (`ordnerId` → `folderId`, `marke` → `cursor`, `anzahl` → `limit`). Antworten
`NichtAngemeldet`/`HerkunftAbgelehnt`/`NichtGefunden`/`Konflikt`/`EingabeUngueltig` →
`Unauthorized`/`OriginRejected`/`NotFound`/`Conflict`/`UnprocessableEntity`. Abfrageparameter
`exportstatus` → `exportStatus`, `mitUnterordnern` → `includeSubfolders`, `zeitbuchungId` →
`timeEntryId`.

Die OpenAPI-`tags` (`Zustand`, `Todos`, `Notizen`, …) bleiben deutsch — sie sind Überschriften
in der erzeugten Dokumentation, also Oberflächentext.

### 2. Aufzählungswerte englisch

| Spalte | alt | neu |
|---|---|---|
| `time_entry.export_status`, `export_audit.previous_status` / `new_status` | `offen`, `exportiert` | `open`, `exported` |
| `time_entry.source` | `timer`, `manuell` | `timer`, `manual` |
| `export_audit.event` | `exportiert`, `zurueckgesetzt` | `exported`, `reset` |
| `app_setting.rounding_mode`, `export_run.rounding_mode` | `aufwaerts`, `kaufmaennisch` | `up`, `nearest` |
| `app_setting.theme` | `system`, `hell`, `dunkel` | `system`, `light`, `dark` |

Drei Stellen mitgezogen, weil sie derselben Regel unterliegen und im selben Griff lagen:

- **Wurzelplatzhalter der Ausdrucksindizes** `COALESCE(parent_id, '~wurzel')` → `'~root'`, in
  `ux_tag_folder_name` und `ux_tag_name`. Rein intern, nirgends sichtbar.
- **Wächtertabelle der Rückwärtsmigration 0002**: `_rueckmigration_0002_waechter` →
  `_rollback_0002_guard`, Bedingungsname `rueckmigration_0002_nur_ohne_nutzdaten_moeglich` →
  `rollback_0002_only_without_user_data`. Das sind SQL-Bezeichner, nicht Datenwerte; die
  Fehlermeldung `CHECK constraint failed: rollback_0002_only_without_user_data` steht so jetzt
  auch in `docs/datenmodell.md`.
- **Transformationsnamen der Standardvorlage**: `"transform":"roh"` → `"raw"`,
  `"runde_auf_viertelstunde"` → `"round_to_quarter_hour"`. `base64` war schon englisch. **Für
  integration-dev (T-007) relevant:** Der Vorlagen-Motor muss genau diese drei Namen kennen.

**Nicht angetastet:** Die Feldschlüssel `Call`, `Zeit`, `Notiz`, `WindowsUser` in der
Standardvorlage. Sie sind Vorgabe des Abrechnungstools (A-8.2, `CLAUDE.md`) und keine
Bezeichner, über die wir verfügen.

**Für frontend-dev:** Die Zuordnung von Wert zu Beschriftung gehört in die Oberfläche —
`open` → „offen", `exported` → „exportiert", `manual` → „manuell", `up` → „aufwärts",
`nearest` → „kaufmännisch", `light` → „hell", `dark` → „dunkel", `reset` → „zurückgesetzt".
In Datenbank, Domäne und API steht ausschließlich der englische Wert.

### 3. Gruppenkennung statt Viertelstunden je Buchung

Drei Tabellen statt zwei:

```
export_run                eine Datei
   └── export_run_group        eine Zeile: ein Todo an einem Kalendertag
          │                    seconds  = ungerundete Tagessumme
          │                    quarters = Wert, der in die Abrechnung ging
          └── export_run_entry welche Buchung in die Zeile einging
                               duration_seconds = ungerundete Dauer der Buchung
```

`export_run_entry.quarters` ist entfallen, `export_run_entry.export_run_group_id` und
`duration_seconds` sind neu; der Primärschlüssel ist jetzt `(export_run_group_id,
time_entry_id)`. `export_audit.quarters` ist entfallen, `export_audit.export_run_group_id` ist
neu. Beide Verweise des Protokolls — `export_run_id` und `export_run_group_id` — sind gesetzt
genau dann, wenn `event = 'exported'`, erzwungen über eine zusammengesetzte Bedingung.

Neue Typen: `ExportRunGroupId` (kernel.ts), `ExportRunGroup` und `ExportRunEntry` (export.ts),
`ExportAuditEntry.exportRunGroupId` statt `.quarters` (time-entry.ts), Ports
`ExportPort.runGroups(runId)` und `ExportPort.loadRunGroup(id)`. OpenAPI: Schema
`ExportRunGroup`, `ExportRun.groups` statt `.timeEntryIds`, `ExportAuditEntry.exportRunGroupId`
statt `.quarters`.

Der Index `ix_time_entry_queue` steht jetzt auf `(todo_id, started_at) WHERE export_status =
'open'` statt auf `(started_at)`, weil die Gruppierung nach Todo und Tag läuft. Dazu
`ux_export_run_group (export_run_id, todo_id, day)` — je Lauf höchstens eine Zeile für dasselbe
Todo am selben Tag — und `ix_export_run_group_todo (todo_id, day)` für die Frage aus R-10.
Objektzahl nach 0001 damit: 16 Tabellen, 32 Indizes, 12 Trigger, 1 Sicht.

#### Der Fall, an dem sich zeigt, ob die Kennung trägt

Zurücksetzen aus einer bereits exportierten Gruppe und späterer Export in einer anderen.
Todo *T*, Tag *D*, Buchungen `e1` (10 min), `e2` (20 min), `e3` (5 min). Gegen das laufende
Schema durchgespielt, nicht danebengeschrieben:

| Schritt | Was entsteht |
|---|---|
| Lauf **R1** exportiert alle drei | Gruppe **G1** = (R1, T, D, 2 100 s, 3 Viertel). Drei `export_run_entry` mit 600 / 1 200 / 300 s. Drei Protokollzeilen `exported` → G1. |
| `e2` wird zurückgesetzt | Protokollzeile `reset`, beide Verweise `NULL`, `new_status = 'open'`. G1 bleibt unverändert — die Tabelle ist anhängend. |
| Lauf **R2** exportiert `e2` erneut | Gruppe **G2** = (R2, T, D, 1 200 s, 2 Viertel). Ein `export_run_entry` mit 1 200 s. Protokollzeile `exported` → G2. |

Ausgabe des Durchlaufs:

```
Geschichte von e2:
  exported  open->exported   Zeile: 2026-03-02  2100s  0.75h
  reset     exported->open   Zeile: -                          Falscher Kunde
  exported  open->exported   Zeile: 2026-03-02  1200s  0.5h
abgerechnet 1.25 h | geleistet 2100s = 0.75 h | Doppelabrechnung 0.5 h
```

Beantwortbar ist damit: mit welchem Wert die Zeile hinausging, in der `e2` stand (erst 0,75,
dann 0,50); welche Buchungen zu welcher Zeile gehörten (G1 drei, G2 eine); wieviel für *T* am
Tag *D* insgesamt abgerechnet wurde (`sum(quarters)` über `export_run_group` = 1,25 h); und
wieviel Arbeit tatsächlich dahintersteht (2 100 s → 0,75 h). Die Doppelabrechnung von 0,50 h ist
**gerechnet, nicht geschätzt**.

Hätte `export_run_entry` weiterhin ein `quarters` je Buchung geführt, stünde dort für `e2` ein
erfundener Anteil, und die Summe über die Buchungen wäre weder die Summe der Zeilen noch die
geleistete Zeit.

Ausführlich in `docs/datenmodell.md` Abschnitt 6.3.

### Wie ich `ExportSourcePath` schneiden würde — Vorlage für T-007, nicht umgesetzt

Die Liste stammt aus T-001 und ist auf eine Einzelbuchung geschnitten. Mit der Tagesgruppe meinen
`booking.*` faktisch die Gruppe. Mein Vorschlag, damit integration-dev nicht von vorn anfängt:

| alt | neu | Wert |
|---|---|---|
| `todo.callNumber` | `todo.callNumber` | unverändert |
| `todo.title` | `todo.title` | unverändert |
| `todo.tags` | `todo.tags` | unverändert |
| `booking.note` | `group.note` | Leistungstexte der Gruppe, nach Startzeit mit `'; '` verbunden, leere übersprungen |
| `booking.durationSeconds` | `group.durationSeconds` | ungerundete Tagessumme |
| — | `group.quarters` | gerundeter Wert der Zeile; das ist die Quelle für `Zeit` |
| `booking.startedAt` | `group.startedAt` | früheste Startzeit der Gruppe |
| `booking.endedAt` | `group.endedAt` | späteste Endzeit der Gruppe |
| — | `group.day` | Kalendertag der Zeile |
| — | `group.entryCount` | Zahl der Buchungen in der Zeile |
| `system.windowsUser` | `system.windowsUser` | unverändert |
| `system.exportedAt` | `system.exportedAt` | unverändert |

Zwei Punkte dazu. Erstens: `booking.*` sollte **verschwinden**, nicht die Bedeutung wechseln —
ein Pfad, der weiter `booking` heißt und die Gruppe meint, ist genau der stille Bedeutungswechsel,
den wir gerade beseitigt haben. Bestehende Vorlagen gibt es noch nicht, außer der
Standardvorlage, die in Migration 0002 mitwandert. Zweitens: `NoteBoundaryIsSealed` prüft auf
`todo.note*` und bleibt bei jeder dieser Umbenennungen wirksam; `TodoSourcesAreCovered` prüft
gegen die drei `todo.`-Pfade und müsste bei einer Erweiterung mitgezogen werden. Beides steht in
`packages/domain/src/export.ts` und gehört weiter mir, nicht T-007.

### Nachweise nach T-013b wiederholt

Typzusicherungen, jede einzeln durch versuchsweises Einfügen ausgelöst und zurückgenommen:

| Probe | Ergebnis |
|---|---|
| `'todo.note'` in `ExportSourcePath` | `export.ts(177,3)` **und** `(189,3)`: `TS2344: Type 'false' does not satisfy the constraint 'true'` |
| Feld `todoNote` an `ExportGroup` | `export.ts(226,3)`: `TS2344` |
| Feld `vermerk` an `ExportCandidate` | `export.ts(214,3)`: `TS2344` |
| unverändert | Exitcode 0, `export.ts` byteweise identisch mit dem Ausgangsstand |

Migration und Schema:

| Prüfung | Ergebnis |
|---|---|
| 0001 up, 0002 up | ok, `foreign_key_check` leer |
| 0002 down, 0001 down auf leerem Bestand | ok, 0 verbleibende Objekte |
| erneut 0001 up, 0002 up | ok, `integrity_check` = ok |
| Objektzahl nach 0001 | 16 Tabellen, 32 Indizes, 12 Trigger, 1 Sicht |
| `app_setting` nach 0002 | `rounding_mode = 'up'`, `theme = 'system'`, `locale = 'de-DE'` |
| Standardvorlage nach 0002 | `transform` = `raw` / `round_to_quarter_hour` / `base64`, Schlüssel `Call`/`Zeit`/`Notiz`/`WindowsUser` unverändert |
| R-10-Szenario (Gruppe, Rücksetzung, zweiter Export) | vollständig durchgespielt, `foreign_key_check` leer, Doppelabrechnung gerechnet |
| Übersetzung beider Pakete, strict | Exitcode 0 |
| Bezeichnerprüfung (Kommentare und Literale entfernt) | kein deutscher Bezeichner, kein deutsches Literal mehr |
| OpenAPI | gültiges YAML, 31 Pfade, 27 Schemata, alle `$ref` auflösbar |

SQLite 3.53.4 und `node:sqlite` aus Node 22.23.2, TypeScript 5.9.3.

Annahmen:

1. **Dateinamen mitumbenannt.** `CLAUDE.md` nennt Dateinamen ausdrücklich in derselben Regel wie
   Bezeichner. Eine Datei `rundung.ts`, die `RoundToQuarterHours` exportiert, wäre der Widerspruch
   aus R-16 auf Dateiebene. Betrifft `docs/architektur.md` und `docs/datenmodell.md`, beide
   nachgezogen; keine `package.json` verweist bislang darauf.

2. **Deutsche Zeichenkettenliterale bleiben, wo SQL sie festnagelt.** `offen`, `exportiert`,
   `manuell`, `zurueckgesetzt`, `aufwaerts`, `kaufmaennisch`, `hell`, `dunkel` stehen als
   CHECK-Bedingung in 0001. Sie sind Datenwerte, keine Bezeichner. Sie zu übersetzen hieße, das
   Schema zu ändern, und das war ausdrücklich ausgenommen. Siehe offene Frage 5.

3. **Literale ohne SQL-Rückhalt habe ich übersetzt.** `art: 'ordner'` → `kind: 'folder'`,
   `art: 'gebucht'/'verworfen'` → `kind: 'recorded'/'discarded'`, `ausloeser:
   'exportlauf'/'zuruecksetzen'` → `trigger: 'export_run'/'reset'`, die vier Gründe der
   Exportordnerprüfung, die vier Zustände von `MigrationState`. Keiner dieser Werte wird
   gespeichert.

4. **Bereits englische Bezeichner blieben unangetastet**, auch wo sie vom Schema abweichen:
   `TodoNote.text` (Spalte heißt `body`) und `ExportRun.bytes` (Spalte heißt `byte_size`). Beides
   ist keine Deutsch-nach-Englisch-Umbenennung und war damit nicht Teil des Auftrags. Siehe
   offene Frage 4.

5. **`Kanbanspalte` heißt im Code `TodoStatus`**, nach der Tabelle `todo_status`, nicht
   `KanbanColumn`. Der Auftrag sagt „Orientiere dich an den Tabellennamen". Auf dem Bildschirm
   bleibt es die Spalte.

6. **Das Trennzeichen ist `'; '`**, Semikolon mit nachfolgendem Leerzeichen. Die Vorgabe lautete
   „Semikolon"; das Leerzeichen habe ich ergänzt, weil `Analyse;Rückruf` in einer Abrechnung
   schwer zu lesen ist. Einzeilige Änderung, falls das nicht gewollt ist.

7. **OpenAPI: Schemanamen und Feldnamen umbenannt, Routen und `operationId` nicht.** Der Auftrag
   sagt „wo Schemanamen betroffen sind". Die Feldnamen musste ich mitnehmen — sie sind die
   Bezeichner aus Punkt 1 des Auftrags, und ein Schema `TimeEntry` mit einem Feld `dauerSekunden`
   wäre R-16 auf der HTTP-Ebene. Routenpfade und `operationId` sind eine eigene Entscheidung,
   siehe offene Frage 1.

8. **Die OpenAPI-`tags`** (`Zustand`, `Todos`, `Notizen`, …) bleiben deutsch. Sie sind
   Überschriften in der erzeugten Dokumentation, also Oberflächentext.

9. **Migration 0001 direkt geändert**, statt eine 0003 nachzuschieben, die die beiden Spalten
   wieder entfernt. Es gibt noch keinen ausgelieferten Bestand und keinen Migrationsläufer; eine
   Prüfsumme, die abweichen könnte, existiert nirgends. Nach T-008 wäre das anders — dann müsste
   es eine neue Nummer sein.

Risiken:

- **R-16 ist geschlossen**, aber nur für `packages/domain` und `packages/storage`. `apps/web`
  ist mir verschlossen und arbeitet parallel; ob dort Bezeichner aus der Domäne auftauchen, weiß
  ich nicht. Die Zuordnungstabelle oben ist vollständig genug, dass frontend-dev sie in einem
  Durchgang nachziehen kann.

- **Die Zuordnungstabelle ist der einzige Weg zurück.** Wer eine Verweisstelle übersieht, merkt
  es erst beim Übersetzen — und im Fall von `apps/web` möglicherweise gar nicht, weil dort
  bislang keine Domänentypen importiert werden.

- **Der Nachweis der Notiz-Trennung hängt an einer Liste von Feldnamen.** `ForbiddenNoteKey`
  fängt sechs Schreibweisen ab. Ein Feld `internalRemark` oder `privateComment` an `ExportGroup`
  ginge durch. Die Zusicherung ersetzt kein Review, sie fängt nur den naheliegenden Fehler. Die
  drei anderen Schichten halten unabhängig davon.

- **R-10 wird durch die Tagesrundung schärfer.** Eine zurückgesetzte Buchung kehrt beim nächsten
  Lauf in ihre Tagesgruppe zurück und verschiebt deren gerundete Summe. Der zweite Export der
  Gruppe stellt nicht denselben Betrag noch einmal, sondern einen anderen — aus 0,50 werden 0,75,
  und die Differenz ist weder der ursprüngliche Wert der Buchung noch ein Vielfaches davon. Das
  Protokoll hält den ursprünglich exportierten Wert in `export_audit.quarters` und macht die
  Differenz nachrechenbar; welchen Wert es nach der Gruppierung führen soll, hängt an offener
  Frage 2. **Für spec-ux-reviewer und e2e-tester relevant.**

- **`export_run.entry_count` zählt Buchungen, nicht Zeilen.** Seit der Gruppierung sind das zwei
  verschiedene Zahlen, und der Name sagt nicht, welche gemeint ist. Ich habe ihn nicht geändert,
  weil das eine inhaltliche Änderung wäre. Siehe offene Frage 2.

- **Sicherheitlich ändert sich nichts.** Keine neue Fläche, keine neue Route, kein neues Feld,
  das Kundendaten trägt. Der einzige sicherheitsrelevante Punkt ist die Notiz-Trennung, und die
  ist strenger geworden, nicht lockerer. Die OpenAPI ist weiterhin vollständig und für T-003
  prüfbar; der Namensraum `/api/v1/addin/**` ist bewusst nicht darin.

Offene Fragen:

1. ~~**An den Orchestrator: Sollen Routenpfade und `operationId` mit umbenannt werden?**~~
   **Erledigt in T-013b, freigegeben.** Der ursprüngliche Befund: Der Stand war gemischt, `POST /export/laeufe` mit `operationId: exportAusfuehren` liefert ein
   Schema `ExportRun` mit Feldern `templateId` und `totalQuarters`. Das ist genau der Bruch, den
   R-16 beschreibt, nur eine Ebene höher. Dagegen: Routenpfade sind Vertrag nach außen, und der
   Auftrag hat mich ausdrücklich auf Schemanamen beschränkt. Dafür: Es gibt noch keine Umsetzung
   (T-009, T-011), kein Client benutzt sie, und außer `docs/architektur.md` und meinen eigenen
   Berichten verweist keine Datei im Repository auf einen dieser Pfade — ich habe das geprüft.
   Jetzt ist es eine Stunde, nach T-011 ein Tag. Ich habe die Zuordnung vorbereitet und liefere
   sie auf Zuruf nach.

2. ~~**Welchen Wert führen `export_run_entry.quarters` und `export_audit.quarters`?**~~
   **Erledigt in T-013b:** Vorschlag (b) umgesetzt, Gruppenkennung. Der ursprüngliche Befund: Der gerundete Wert entsteht je Gruppe.
   Auf die einzelnen Buchungen lässt er sich nicht ohne Willkür verteilen: Bei 10 + 20 + 5
   Minuten → 0,75 gibt es keine Aufteilung in drei Anteile, die zugleich ganze Viertelstunden
   sind und sich zu 0,75 summieren. Drei Möglichkeiten: (a) `quarters` wird nullbar und je Gruppe
   in einer neuen Tabelle `export_run_group` geführt, (b) `export_run_entry` bekommt eine
   Gruppenkennung und `quarters` wandert dorthin, (c) der Gruppenwert wird auf allen Buchungen
   der Gruppe wiederholt, mit einem ausdrücklichen Hinweis, dass die Summe über
   `export_run_entry` dann nicht mehr stimmt. Ich neige zu (b). **Muss vor T-009 entschieden
   sein**, weil es Schema und Protokoll betrifft, also R-10.

3. **An T-007: Die Liste `ExportSourcePath` ist auf eine einzelne Buchung geschnitten.**
   Auflage des Orchestrators an T-007; mein Schnittvorschlag steht oben unter T-013b. Sie
   stammt aus T-001 und ich habe sie nicht angefasst. Mit der Gruppierung beziehen sich
   `booking.durationSeconds`, `booking.note`, `booking.startedAt` und `booking.endedAt` aber auf
   die Gruppe, nicht auf eine Buchung: die Summe, den zusammengeführten Text, die früheste
   Startzeit, die späteste Endzeit. Entweder die Namen wandern auf `group.*`, oder sie behalten
   ihre Namen und die Bedeutung ändert sich still. Ich empfehle das Erste. Die Zusicherung
   `NoteBoundaryIsSealed` prüft auf `todo.note*` und bleibt bei jeder Umbenennung wirksam.

4. ~~**Zwei bewusst gelassene Abweichungen**~~ — **vom Orchestrator entschieden: bleiben, wie sie
   sind.** Für die Nachvollziehbarkeit: `TodoNote.text` gegenüber der
   Spalte `todo_note.body`, und `ExportRun.bytes` gegenüber `export_run.byte_size`. Beide sind
   englisch und fielen damit nicht unter den Auftrag. Wenn Schicht und Schema durchgängig
   dieselben Namen tragen sollen, sind das zwei Zeilen — dann bitte als eigene Aufgabe, damit die
   Zuordnungstabelle oben nicht nachträglich unvollständig wird.

5. ~~**Die acht deutschen Datenwerte in den CHECK-Bedingungen.**~~ **Erledigt in T-013b.**
   Ursprünglicher Befund: `'offen'`,
   `'exportiert'`, `'manuell'`, `'zurueckgesetzt'`, `'aufwaerts'`, `'kaufmaennisch'`, `'hell'`,
   `'dunkel'`. Sie stehen im Schema, in den Domänentypen, in der OpenAPI und damit im JSON, das
   über die Leitung geht. Nach `CLAUDE.md` sind „technische Schlüssel" englisch, und diese Werte
   sind technische Schlüssel — nur eben gespeicherte. Eine Umstellung ist billig, solange kein
   Bestand existiert, und braucht eine Migration plus eine Änderung an allen drei Stellen. Nach
   T-008 ist sie teuer. Ich habe sie nicht vorgenommen, weil SQL ausdrücklich ausgenommen war.

6. **Hinweis, kein Blocker:** Der Wunsch aus T-001 an den Orchestrator steht weiter offen —
   `@takt/domain` mit zwei Einstiegspunkten (`.` und `./export`), `@takt/storage` mit
   Abhängigkeit auf `@takt/domain`, und `packages/export` **ohne** `@takt/storage` und ohne
   `@takt/domain` als Ganzes. Ohne den dritten Eintrag ist die dritte Schicht der Notiz-Trennung
   nur eine Vereinbarung. Zusätzlich ein Skript `typecheck` über alle Pakete.

Nächster Schritt:

1. **T-007 kann unmittelbar weiterarbeiten.** `ExportGroup`, `ExportCandidate`,
   `ExportSourcePath`, `ExportTemplateEnvelope`, `ExportNoteSeparator`, `ExportRunGroup` und
   `ExportRunEntry` stehen. Drei Dinge für die Übergabe: `packages/export` bekommt **keine
   Ports**, sondern fertige `ExportGroup`-Werte; der zusammengeführte Text einer Zeile darf
   ausschließlich aus `entries[].bookingNote` entstehen; und die drei Transformationsnamen der
   Standardvorlage heißen jetzt `raw`, `round_to_quarter_hour` und `base64`. Mein Schnittvorschlag
   für `ExportSourcePath` steht oben unter T-013b — die Liste selbst ändere ich, nicht T-007.

2. **T-009 kann das Schema als abgeschlossen ansehen.** Die Frage, an der es hing — wo der
   gerundete Wert hängt — ist mit `export_run_group` beantwortet und gegen das laufende Schema
   durchgespielt.

3. **frontend-dev (T-015, T-016)** braucht zwei Dinge aus diesem Bericht: die Zuordnung
   Aufzählungswert zu Beschriftung (`open` → „offen" und so fort), weil in Datenbank, Domäne und
   API ausschließlich der englische Wert steht; und den Wegfall der Erledigt-Spalte — das
   Erledigt-Kennzeichen ist unabhängig von der Kanban-Spalte, es gibt keine Erledigt-Markierung
   an einer Spalte und keine Rückkehr-Spalte, und die Ausblendung erledigter Todos in
   Pool-Ansichten kommt aus der Domäne.

4. **security-checker (T-003)** kann die OpenAPI erneut prüfen. Die Fläche hat sich nicht
   verändert — dieselben 31 Pfade, dieselben Prüfungen, nur englisch benannt. Neu ist allein das
   Schema `ExportRunGroup`, das keine Kundendaten trägt.

5. **T-010** prüft gegen die Rundungstabelle in `docs/datenmodell.md` Abschnitt 5, jetzt mit der
   Tagessumme als Eingabe. Die Randfälle aus 5.4 gelten unverändert; hinzu kommen: gemischter
   Exportstatus in einer Tagesgruppe, Buchung über Mitternacht, Zusammenführung leerer
   Leistungstexte, und der Fall aus 6.3 — Zurücksetzen aus einer exportierten Gruppe und Export
   in einer anderen.
