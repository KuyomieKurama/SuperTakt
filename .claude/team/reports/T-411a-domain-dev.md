Aufgabe: T-411a — Nacharbeit am Dienst aus T-406a, T-409a/b/c (Welle 18d), mit Nachtrag N-6
Status: braucht Review
Artefakte:
- apps/local-api/src/features/data-transfer/data-transfer.ts — R-38-Warnung, N-2-Namensprüfung, Meldung aus `DATA_ARCHIVE_VERSION`, N-6-Einstellungszeile, `todo_mail` über `isMailEntry`, Prüfung von `addin_mail_receipt.response`, Helfer `parseJsonOrNull`
- apps/local-api/src/http/input.ts — `timestampSchema` mit `isExactTimestamp`
- packages/domain/src/kernel.ts — Fehlerschlüssel `time_entry_no_export`
- packages/domain/src/export-status.ts — `checkNotBilled` (Übergang plus NoExport-Regel)
- packages/domain/src/mail-entry.ts — Typwächter `isMailEntry`
- apps/local-api/src/features/export/status.ts — `markNotBilled` ruft `checkNotBilled`
- apps/local-api/src/http/problem.ts — `time_entry_no_export: 409`
- apps/local-api/openapi/takt-local-api.yaml — 409 an `/time-entries/{id}/not-billed` und die Conflict-Liste
- apps/local-api/src/features/todos/email-attachments.ts — Kopfkommentar auf A-10.11–A-10.13 (englisch)
- packages/storage/migrations/0025_outlook_mail.down.sql, 0026_todo_no_export.down.sql, 0028_todo_priority.down.sql — Kopfkommentar mit Datenverlust; packages/storage/src/sqlite/migrations.embedded.ts neu erzeugt (nur `*.up.sql` trägt eine Prüfsumme, keine Prüfsummenfolge)
- packages/storage/src/sqlite/repo-mail.ts — Lesen über `isMailEntry` statt `as`, Einzeiler aufgelöst
- packages/storage/src/sqlite/repo-priorities.ts — Einzeiler aufgelöst, `!` durch eine Prüfung ersetzt, Grenze 120 über `MAX_PRIORITY_NAME_CHARACTERS`
- packages/storage/src/sqlite/repo-todos.ts — Todo-Suche und `matchOrigins` über `takt_fold`
- docs/architektur.md — NoExport-Abschnitt übersetzt und ergänzt, Abschnitt „Data archive import checks (T-411a)“, Suchfaltung, 409-Liste

Zusammenfassung: Das Einspielen warnt jetzt, wenn ein Archiv die hier eingeschaltete Versionsprüfung ausschaltet (Wert wird nach A-28.1 übernommen). Namen im Archiv werden ungetrimmt geprüft, und ein Archiv ohne genau eine `app_setting`-Zeile mit `id = 1` wird abgewiesen. Unmögliche Zeitstempel ergeben 422, „Nicht abrechnen“ auf NoExport-Buchungen 409 `time_entry_no_export`, und die Todo-Suche faltet wie die Leistungstextsuche.

## Die Punkte im Einzelnen

1. **R-38 / N-5:** In derselben Transaktion wie `replaceAll` wird vorher `unit.settings.load()` gelesen. Wenn die Prüfung hier an war und das Archiv `version_check_enabled = 0` trägt, kommt ein Satz in `warnings`: „Die Sicherung schaltet die Versionsprüfung aus, die auf diesem Rechner eingeschaltet war. Ohne sie erfahren Sie nicht von neuen Fassungen und Sicherheitskorrekturen. Sie können sie unter Einstellungen wieder einschalten.“ Übernommen wird der Wert trotzdem. War die Prüfung hier schon aus, oder ist sie im Archiv an, kommt keine Warnung. Die Meldung ist deutsch, weil Dienstmeldungen nach A-28.2 deutsch bleiben.
2. **N-2:** `isValidArchivedName` prüft den gespeicherten Wert selbst. Abgewiesen wird `value !== value.trim()`, und `trim()` erfaßt auch U+FEFF. Länge und Zeichenklasse werden auf dem ungetrimmten Wert gemessen. Die Meldung nennt weiter nur `Tabelle.Spalte`. Ein leerer String bleibt nur bei `optional` zulässig. Ein reiner Leerraumwert wird jetzt auch bei optionalen Spalten abgewiesen; die Türen trimmen ihn ohnehin zu leer.
3. Die Meldung wird aus `DATA_ARCHIVE_VERSION` gebildet und lautet heute „… der Fassung 1 bis 11.“ `READABLE_VERSIONS` bleibt eine ausgeschriebene Liste.
4. **N-3:** `timestampSchema` bekommt `.refine(isExactTimestamp, 'Diesen Zeitpunkt gibt es nicht.')` und gilt damit an allen neun Stellen in `features/timer/routes.ts`. **Migration 0030 mit CHECK habe ich nicht gebaut**, weil sie nicht ohne Datenfolge geht:
   - SQLite kann einen CHECK nur über einen Neubau von `time_entry` hinzufügen. Dabei müßten die Sperrtrigger (`trg_time_entry_locked`, `…_no_delete_exported`, `…_exported_needs_provenance`), fünf Indizes und `v_export_candidate` neu entstehen, also genau der Geldpfad.
   - Das Formgitter (GLOB) läßt heute `2026-01-32…`, `2026-13-01…` und `…T23:60:00Z` zu, und `unixepoch` liefert dafür NULL (mit sqlite3 3.53 gemessen). Solche Zeilen können über Archiv oder direkte Schreiber schon im Bestand liegen. Dann bräche der Neubau ab, und der Dienst startete nicht mehr (Exitcode 65). Das ist eine Datenfolge.
   - Vorschlag für eine Entscheidung durch dich: statt eines CHECK eine Migration **0030 `time_entry_duration_guard`** mit zwei Triggern `BEFORE INSERT`/`BEFORE UPDATE OF ended_at, started_at ON time_entry`, die bei `NEW.ended_at IS NOT NULL AND unixepoch(NEW.ended_at) IS NULL` mit `RAISE(ABORT, …)` abbrechen. Das braucht keinen Neubau und läßt vorhandene Zeilen stehen. Neue Schreibvorgänge, auch `replaceAll`, würden dann abgewiesen; ein solches Archiv rollte ganz zurück (500 statt 422, solange `parseArchive` die Zeitstempel von `time_entry` nicht selbst prüft).
5. **E-133 Punkt 5:** `checkNotBilled` in `packages/domain/src/export-status.ts` prüft zuerst den Übergang wie bisher (ausgebuchte oder exportierte Buchungen geben weiter `export_status_unchanged`). Danach weist es NoExport-Buchungen mit `time_entry_no_export` ab. Der Schlüssel antwortet mit 409, weil der Zustand dagegensteht und ein Ausschalten von NoExport die Buchung wieder abrechenbar macht. Er steht in der OpenAPI-Beschreibung und in `architektur.md`.
6. **E-134 Punkt 3:** Der Kopf von `email-attachments.ts` ist englisch und beschreibt die heutige Grenze. Das Ziel bestimmt der Aufrufer. Ein vorhandenes Todo erreicht nur `createMailAssignment`, und nur bei gleicher gültiger Call-Nummer (sonst 422, bevor ein Byte geschrieben ist). Das Ergänzen ändert keine Aufgabenfelder, Timer, Buchungen oder Exportzustände (A-10.12). Ob der Zweig `mode: 'auto'` noch da ist, spielt für den Satz keine Rolle; er bleibt auch nach T-398c wahr.
7. **E-134 Punkt 6:**
   - Die Rückwege nennen ihren Datenverlust. Bei 0026 steht ausdrücklich, daß jede offene Buchung eines früheren NoExport-Todos wieder exportierbar wird und im nächsten Export erscheint, und was vorher zu prüfen ist.
   - `repo-mail.ts` liest über `isMailEntry`. Eine ungültige Zeile wirft und wird zu `storage_error`, sie gibt keinen scheinbaren Erfolg zurück.
   - Der Archivimport prüft `todo_mail.metadata` jetzt mit demselben Wächter; neu verlangt ist dabei `createdAt` als Zeichenkette. `addin_mail_receipt.response` muß ein Objekt sein, dessen `todo.id` gleich `todo_id` der Zeile ist, mit `outcome` aus created/appended/already_present.
8. **E-135 Punkt 3:** Titel, Call-Nummer und interne Notiz werden in `buildConditions` und `matchOrigins` über `takt_fold(…) LIKE takt_fold(Begriff)` gesucht. Das läuft in SQL vor Zählung und Seitenbegrenzung. Die drei Bedingungen stehen je einmal als Konstante, damit Filter und Herkunftsangabe nicht auseinanderlaufen.
9. **N-6 (Nachtrag):** `parseArchive` verlangt genau eine `app_setting`-Zeile mit `id === 1`, sonst `validation_error` „Das Datenarchiv muss genau eine Einstellungszeile mit der Kennung 1 enthalten.“ Die Prüfung läuft vor jeder Transaktion, der Bestand bleibt unverändert.

Prüfung:
- `pnpm --filter @takt/{domain,storage,local-api} typecheck`: grün. `tsc -p <paket>/tsconfig.test.json --noEmit` für alle drei: grün.
- `TAKT_PROOF_PORT=24843 npx vitest run packages apps/local-api`: 98 Dateien grün, 1 übersprungen; 1755 Fälle grün, 2 übersprungen.
- `proof:openapi` 114/0, `proof:access` 123/0, `proof:migrations` (Einbettung aktuell, 58 Dateien), `proof:release-safety` 158/0.
- Zusätzlich gelaufen: `boundaries` grün (Notiz-Trennung unverletzt), `proof:export` 100/0, `proof:conflicts` 158/0, `proof:layers` 58/0.
- Wegwerfprüfung im Scratchpad (`node --experimental-strip-types`, nichts im Baum), alle Ergebnisse wie erwartet:
  - R-38 warnt genau im Fall an→aus; bei aus→aus und bei an im Archiv kommt keine Warnung.
  - N-6: leere Liste, `id = 2` und zwei Zeilen werden abgewiesen.
  - N-2: `U+FEFFKunde`, `Kunde\n\n\t`, ` Kunde`, 5 000 führende Leerzeichen und `Kunde ` werden abgewiesen, `Kunde` angenommen; die Meldung nennt `todo_status.name`.
  - Fassung 99 ergibt „1 bis 11“. Ein Beleg mit fremder `todo.id` wird abgewiesen.
  - `2026-01-32`, `2026-02-31` und `23:60` sind ungültig, `2026-02-28T23:59:59Z` gültig.
  - „Nicht abrechnen“ auf einer NoExport-Buchung gibt `time_entry_no_export`, nach dem Ausschalten von NoExport `exported`.
  - Die Todo-Suche findet „Ärger mit Kunde“ über „ärger“ und „ÄRGER“, `%` bleibt wörtlich (0 Treffer), und `matchOrigins` liefert für „ÄRGER“ `title`.
- Nicht gelaufen: `pnpm check` vollständig, e2e, Rust und `proof:all` außerhalb der genannten Läufe. `apps/web` habe ich nicht angefaßt (T-400a läuft parallel).

Annahmen:
- N-3: Den CHECK baue ich nicht, weil er nur mit Datenfolge ginge (Begründung unter Punkt 4). Die Tür ist zu, die Speicherung bleibt wie bisher.
- `time_entry_no_export` antwortet mit 409, nicht mit 422, weil es um einen Zustand geht und nicht um die Form der Anfrage.
- Bei einer exportierten Buchung eines NoExport-Todos bleibt `export_status_unchanged` die Antwort; die Übergangsregel wird zuerst geprüft.
- Die R-38-Warnung vergleicht mit dem Wert des Zielrechners vor dem Einspielen, nicht mit einem Vorgabewert.
- `createdAt` ist in einem Mail-Eintrag jetzt Pflicht. `insert` schreibt es seit Migration 0025 immer, eigene Archive verlieren also nichts.

Risiken:
- **Round-Trip-Lücke bei `todo_attachment.display_name` (vorbestehend, durch N-2 etwas breiter):** Die Add-in-Tür (`routes/addin/schema.ts:169`, `attachmentDisplayName = z.string().min(1).max(…)`) trimmt fremde Dateinamen nicht und prüft keine Steuer- oder Richtungszeichen. Ein E-Mail-Anhang mit dem Namen ` bericht.pdf` oder mit U+202E wird gespeichert. Die eigene Datensicherung davon wird beim Einspielen abgewiesen, gegen A-20.4. Ein Wechsel des Zeichens hat es schon seit T-394 abgewiesen, Rand-Leerraum erst ab jetzt. Die Tür gehört integration-dev, siehe Offene Fragen.
- Sicherheit: Mit R-38 bleibt das Abschalten durch ein Archiv möglich (A-28.1), es wird aber gemeldet. Ob die Oberfläche die Warnung sichtbar zeigt, hängt an T-400a und T-406b.
- `takt_fold` läuft jetzt je Todo-Zeile bis zu dreimal (Titel, Call-Nummer, Notiz). `LIKE '%…%'` durchsucht die Tabelle ohnehin ganz. Bei großen Beständen habe ich die Laufzeit nicht gemessen.
- `todo_mail`-Zeilen, die direkt in der Datenbank verändert wurden, führen jetzt beim Lesen der Todo-Details zu 500 statt zu einem falsch getypten Wert. Das ist beabsichtigt.

Offene Fragen:
1. Orchestrator: Migration **0030** — Trigger statt CHECK (Vorschlag unter Punkt 4) oder gar nichts? Brauchst du sie, bestätige bitte Name und Reihenfolge `0030_time_entry_duration_guard`. Unabhängig davon könnte `parseArchive` die Zeitstempel von `time_entry` mit `unixepoch`-Äquivalenz prüfen. Dabei darf es nicht `isExactTimestamp` sein: Das wiese vorhandene `2026-02-31`-Zeilen ab, die SQLite rechnen kann, und bräche den Round-Trip.
2. integration-dev (T-398c): `attachmentDisplayName` in `routes/addin/schema.ts` sollte trimmen und `hasForbiddenNameCharacter` prüfen, damit Tür und Archiv dieselbe Regel haben. Dazu die Umbenennung `attachEmailToNewTodo` → `attachEmailToTodo` (T-409a niedrig); die Aufrufer liegen unter `routes/addin/`, die Datei bei mir, deshalb bitte in einer Welle hintereinander.
3. frontend-dev: Der Knopf „Nicht abrechnen“ auf NoExport-Zeilen (T-400) kann jetzt den Schlüssel `time_entry_no_export` abfangen, falls er doch erreicht wird.
4. documenter: Das Handbuch zum Rückweg sollte vermerken, daß nach einem Rückweg unter 0026 vor dem nächsten Export zu prüfen ist (T-409a M, zweiter Teil).

Prüffallvorschläge für den unit-tester (nächste Welle, weil `checkNotBilled`, `isMailEntry` und `time_entry_no_export` neue Schnittstellen sind):
- `apps/local-api/test/usecases/data-transfer.test.ts`:
  - R-38: Die Zeile hier steht auf 1, das Archiv auf 0 → genau eine Warnung mit „Versionsprüfung“, und danach ist `GET /settings` `versionCheckEnabled: false`.
  - Gegenproben ohne Warnung: hier 0 und Archiv 0; hier 1 und Archiv 1; Archiv der Fassung 10 (wird zu 1 gehoben).
- N-6: `app_setting: []`, eine Zeile mit `id = 2` und zwei Zeilen ergeben je `validation_error`. Danach ist die Zahl der Todos unverändert und `GET /settings` gibt 200.
- N-2 (`data-archive-name-directory.test.ts`): `U+FEFFKunde`, `Kunde\n\n\t`, ` Kunde`, `Kunde `, `Kunde ` und 5 000 führende Leerzeichen ergeben je 422, und die Meldung enthält `tag.name`, nicht den Wert. Ein reiner Leerraumwert bei `todo_attachment.title` ist ungültig, `''` und `null` gültig.
- Meldung bei Fassung 12: enthält „1 bis 11“ und ändert sich mit `DATA_ARCHIVE_VERSION`.
- N-3 (`test/http/input.test.ts` oder Route): `POST /time-entries` mit `2026-01-32T00:00:00Z`, `2026-02-31T00:00:00Z` und `2026-01-01T23:60:00Z` gibt je 422 mit Feldfehler und keine neue Zeile. `2026-02-28T23:59:59Z` wird angenommen.
- E-133 Punkt 5:
  - `checkNotBilled` (packages/domain/test): open plus NoExport ergibt `time_entry_no_export`; exported plus NoExport ergibt `export_status_unchanged`; open ohne NoExport ergibt ok `not_billed`.
  - HTTP: `POST /time-entries/{id}/not-billed` auf einer NoExport-Buchung gibt 409 `time_entry_no_export`, ohne `export_audit`-Zeile und mit Status weiter `open`. Nach dem Ausschalten von NoExport gibt derselbe Aufruf 200.
- Mail-Einträge:
  - `isMailEntry`: falsches `kind`, fehlendes `createdAt`, `attachmentIds: [1]` und eine Notiz über 4000 Zeichen sind ungültig.
  - `createMailPort(conn).list` wirft bei einer von Hand verdorbenen `metadata`.
  - Ein Archiv mit `addin_mail_receipt.response` `{"todo":{"id":"fremd"},"outcome":"created"}` oder ohne `outcome` gibt 422.
- E-135 Punkt 3: Titel „Ärger mit Kunde“ wird von „ärger“, „ÄRGER“ und NFD-„ärger“ gefunden. Dasselbe für eine Notiz über `GET /search`, und `origins` nennt `todo_note`. `50%` bleibt wörtlich. Von 250 Todos tragen nur die fünf ältesten „Ärger“, die Suche findet alle fünf (vor dem Limit).
- E-134 Punkt 3 (Gegenprobe aus E-134): `POST /addin/todos/{id}/mails` mit fremder Call-Nummer gibt 422, im Anhangsordner liegt keine zusätzliche Datei.
- Migrationen: 0025/0026/0028 rückwärts mit Daten laufen weiter durch; die Kopfkommentare ändern das Verhalten nicht.

Nicht in diesem Auftrag: die O-D-Umbenennung in TypeScript und `request-scan.mjs` (nach T-400a).

Nächster Schritt: Nachprüfung durch Code-Reviewer und security-checker (R-38, N-2, N-3, N-6). Entscheidung zu 0030. Danach schreibt der unit-tester die Prüffälle oben, in der Welle nach dieser.
