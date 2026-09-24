Aufgabe: T-397 — Dienst und Domäne für Welle 18b (Add-in-Rückbau nachziehen, Konstanten, Aufgabenbereich, A-28.1–A-28.4, A-28.10, Archiv 11, OpenAPI-Reste, O-D/O-J, C-22, O-AN, C-14, F-8, O-JN)
Status: braucht Review

Artefakte:
- packages/domain/src/{attachment,enumeration,export,mail-entry,pool,settings,tag,time-entry,todo,index}.ts
- packages/storage/migrations/0029_interface_preferences.{up,down}.sql (neu), packages/storage/src/sqlite/migrations.embedded.ts (erzeugt)
- packages/storage/src/ports.ts, packages/storage/src/sqlite/{mappers,repo-data-archive,repo-export,repo-settings,repo-tags,repo-time,repo-todos,repo-version-check,unit-of-work}.ts
- apps/local-api/src/{main,composition,app,pool-movement}.ts, src/access/session-secret.ts, src/taskpane/server.ts
- apps/local-api/src/features/{settings/*,structure/*,timer/routes.ts,todos/{routes,todos}.ts,version/version.ts,data-transfer/data-transfer.ts,export/catalog.ts}
- apps/local-api/scripts/{proof-openapi,proof-callers,proof-addin-wiring,proof-route-policy,proof-release-safety,service-scenario}.mjs
- apps/local-api/openapi/takt-local-api.yaml
- docs/architektur.md, docs/datenmodell.md (je ein englischer Abschnitt angehängt; Add-in-Routenzahl berichtigt)

Zusammenfassung: Die OpenAPI und fünf Nachweisläufe kennen die Add-in-Buchung nicht mehr, `poolMovement` fällt aus `AddinTodoMatch`. Neu im Bestand sind Schalter der Versionsprüfung und Oberflächensprache (Migration 0029, Archivfassung 11), `PUT /pools/order`, eigene Beendigungscodes je Startursache, die Suche mit Herkunft, C-14-Filter und `todoNoExport`. `requiredTags` und `matchesNothingReason` stehen als neue Namen neben den alten, bis die Verbraucher in 18c umgezogen sind.

Prüfung:
- `pnpm typecheck`: rot in zwei Prüfdateien des unit-testers. `apps/local-api/test/routes/addin/service.test.ts` hat 11 Fehler aus T-389/T-398. `apps/local-api/test/usecases/time-entry-movement.test.ts:134` hat 1 Fehler aus F-8, weil dem Buchungsliteral `todoNoExport` fehlt. Weil die Kette bei `typecheck:test` abbricht, habe ich die übrigen Projekte einzeln geprüft. `tsc -p` für die Prüfkonfigurationen von domain, storage, export, web, desktop und outlook-addin sowie für `tests/e2e` ist grün. Die Paket-Typprüfungen (`pnpm -r typecheck`) sind grün.
- `vitest run packages/domain packages/storage apps/local-api`: 1554 grün, 11 rot, 2 übersprungen. Die roten Fälle haben benannte Ursachen:
  - 6 in `test/routes/addin/service.test.ts` (`bookOnTodo`, `poolMovement` in `findMatches`), Ursache T-389/T-398.
  - 4 in `test/usecases/data-transfer.test.ts`: Die Fälle an Zeilen 360, 626 und 730 erwarten `schemaVersion` 10, der Fall an Zeile 824 erwartet, dass Fassung 11 abgewiesen wird. Ursache ist Archivfassung 11, das ist gewollt.
  - 1 in `packages/storage/test/mappers.test.ts` (`toTimeEntry` vollständig): Der Mapper liefert jetzt zusätzlich `todoNoExport`, das ist gewollt.
- `proof:*` einzeln, alle 22 aus `proof:all`: 19 grün. Die folgenden 4 Läufe waren vorher rot und sind jetzt grün: openapi, callers, addin-wiring und route-policy. `release-safety` ist grün mit 158/0. Rot sind:
  - `proof:access`, zwei Zeilen „Bestand aus einer neueren Fassung / nachträglich geänderte Migration: Code 78“. Gemessen wird Code 65. Das ist die Folge von A-28.10: Die Migration hat jetzt Code 65. Die Datei gehört T-397a, siehe Offene Fragen.
  - `proof:locked`: Oberflächensätze in `apps/web` (T-400a), nicht aus diesem Auftrag.
  - `proof:addin`, A-19.2: „Deadline“ steht in `apps/outlook-addin/src/ui/{TaskPane.tsx,texts.ts}` (T-398), nicht aus diesem Auftrag.
- `proof:shell-parity` (noch nicht eingehängt): grün, „Gleichlauf bestanden“, nach der Korrektur an `isAbsoluteAttachmentPath` (E-126 Punkt 2).
- Migration 0029 im Kritzelverzeichnis (`scratchpad/t397/mig.mjs`): alle Vorwärtsdateien, dann 0029 rückwärts, dann wieder vorwärts. Die CHECK-Bedingung weist `'fr'` ab, `integrity_check` ist ok.
- Verhalten am echten Zusammenbau (`scratchpad/t397/probe.mts`, `probe2.mts`, `compose` mit `:memory:`):
  - Schalter aus: 0 Abrufe in 11 s, `GET /version-check` meldet `unknown`. Gegenprobe mit Schalter an: 1 Abruf, Zustand `known`.
  - `PATCH /settings` nimmt `uiLanguage: 'en'` an und weist `'fr'` mit 422 ab.
  - `PUT /pools/order` ordnet vollständig um (`P2:1,P1:2`), ein Teilstück ergibt 422.
  - Vor dem Umbau habe ich gemessen, dass der Tausch per zweimal `PATCH position` mit **409** scheitert. So macht es heute `BoardSetupDialog.tsx:93`.
  - `requiredTags` und `rule` zusammen ergeben 422.
  - `matchesNothingReason` liefert `none` bzw. `empty`.
  - Die Suche liefert `[["geheimwort im Titel",["title"]],["Alpha",["todo_note"]]]`. Das zweite Wort des Vermerks steht nicht im JSON (K-3). `GET /todos?search=` bleibt bei Titel und Call-Nummer.
  - Die C-14-Filter ergeben hasNote true/false 1/1, Pool 2 bzw. 0 (leere Regel), Tag 2. Die Leistungssuche findet die Buchung.
- Nicht geprüft:
  - `pnpm check` als Ganzes, `test:coverage`, e2e, Rust: nicht verlangt bzw. Sache anderer Rollen.
  - Windows-Verhalten der Beendigungscodes und `userNameWithoutDomain` gegen einen echten Domänennamen: nur gelesen.
  - `headersTimeout` auf 17844 unter Last: nur Typprüfung und `proof:taskpane`.

Entscheidungen:
- **Rundung / Exportstatus:** in diesem Auftrag unberührt.
- **A-28.1:** Der Schalter ist ein synchroner Port (`VersionCheckSwitchPort.isEnabled`). Der Rumpf der Anfrage darf auf nichts außer der Anfrage warten (`proof:release-safety` 6g). Ich frage ihn vor jeder Anfrage und in `current()`. Ist er aus, geht keine Anfrage und keine Verbindung hinaus, auch nicht beim Start, und die Antwort ist `unknown`. Der Takt läuft weiter, damit ein späteres Einschalten ohne Neustart beim nächsten Intervall wirkt; „Einschalten verspricht keine sofortige Prüfung“ (T-391). Wirft der Schalter, gilt er als aus: eine Protokollzeile `version_check_switch_unreadable`, keine Verbindung. A-28.1 sagt „keine Verbindung“ absolut, „an“ ist nur die Vorgabe. `proof:release-safety` nagelt jetzt Schlüssel `enabled`, Portliteral und Adapteranweisung zeichengleich fest; das ist die eine sanktionierte Ausnahme.
- **A-28.2:** Das ist eine neue Spalte `ui_language` (`de` | `en`). Die alte Spalte `locale` (frei, `de-DE`) liest niemand. Ich nutze sie nicht, weil sie beliebige Kennungen annimmt und Prüffälle sie auf `de-AT` setzen.
- **A-28.3:** `position` gilt schon für Pool-Liste und Board. Ich habe eine vollständige Umordnung `PUT /pools/order` gebaut, nach dem Muster `/todo-statuses/order`, mit höchstens 200 Kennungen. Der Tausch per zwei `PATCH` ist heute kaputt, gemessen 409.
- **A-28.4:** `userNameWithoutDomain` in `packages/domain/src/export.ts` macht aus `DOMAIN\user` und `user@domain` den Namen `user`. Angewandt wird die Funktion am Handschlag, damit Einstellungen, Datei und Protokoll denselben Namen tragen, gleich was die Hülle schickt.
- **A-28.8:** Den Befund gibt es schon (`databaseFilesTooPermissive` in `GET /settings`). Ich habe nichts gebaut.
- **A-28.10:** Die Codes stehen als `EXIT_CODES` in `main.ts`:
  - Handschlag 78, wie bisher
  - Anwendungsdatenverzeichnis 73, neu auch, wenn das Anlegen scheitert (`appdata_unusable`)
  - Bestand öffnen 66
  - Migration 65
  - Port 74, wie bisher
- **Archiv 11:** Die Fassungen 1 bis 10 werden mit `version_check_enabled = 1` und `ui_language = 'de'` gelesen. Die Pool-Reihenfolge braucht keine neue Fassung.
- **O-D:** Im JSON gibt es einen Übergangsalias in beide Richtungen, weil Oberfläche, Add-in und e2e zur Laufzeit `rule` lesen und senden:
  - `PoolWithResolution` trägt `requiredTags` und weiterhin `rule` (deprecated). `/addin/context` bleibt bei `rule`.
  - Anfragen nehmen `requiredTags` oder `rule` an, beides zugleich ergibt 422.
  - Der TypeScript-Name `Pool.rule`/`PoolRuleAxes.rule` bleibt vorerst. `apps/web/src/lib/poolRule.ts` erweitert `PoolRuleAxes`, und `packages/storage/test` hat 65 Stellen dazu. Eine Umbenennung jetzt hätte die Typprüfung von T-400a mitten in seiner Welle rot gemacht (Lehre vom 2026-09-12).
- **O-J:** `PoolResolution.matchesNothingReason: 'none' | 'empty' | 'unresolved_required'` steht zusätzlich da. `unresolved_required` hat Vorrang. Die drei Wahrheitswerte bleiben bis 18c.
- **C-22 (K-1…K-8):**
  - Abweichung vom Vorschlag in K-1: Ein Treffer ist **flach** `Todo & { origins }` und nicht `{ todo, origins }`. Das folgt dem Vorbild `TodoAfterDone`, und die laufende Oberfläche bricht nicht. Die Kriterien selbst sind erfüllt: Herkunft je Treffer, feste Reihenfolge, nie leer.
  - K-4 als eigenes Filterfeld `TodoFilter.searchIncludesNote`, dazu `TodoPort.matchOrigins`, das in SQL nur Kennzeichen liefert.
  - C22-04: `TimeEntryFilter.noteContains` filtert in SQL, danach höchstens 200 Treffer.
  - K-6: `/search` liegt nicht unter `/addin`, das deckt `proof:route-policy` ab.
  - K-7: `v_export_candidate` ist unverändert, `proof:export` grün.
- **C-14:** `GET /time-entries?tagId=…&poolId=…&hasNote=true|false`. Tag und Pool haben dieselbe Bedeutung wie bei `/todos`: Tags mit UND, Pools vereinigt. Dafür gibt es dieselbe SQL-Übersetzung (`todoFilterConditions`). Die Filter greifen vor Zählung und Seite. „hat Notiz“ heißt die Leistung der Buchung und nie der Vermerk (T-391). Die Exportauswahl liest dieselbe Liste; einen eigenen Exportparameter gibt es nicht.
- **F-8:** `TimeEntry.todoNoExport` wird über eine korrelierte Unterabfrage in jedem Lesepfad gesetzt. In der OpenAPI ist das Feld `readOnly`.
- **O-AD:** `Todo.title` hat jetzt `maxLength: 500`. Die Beschreibung nennt ehrlich die Altbestände bis 512 aus der Zeit vor T-114.
- **O-X:** entschieden und so festgeschrieben, an zwei Stellen.
- **W-13:** Die Sätze nennen die fünf Achsen.
- **O-AN:** `quoteName` läuft über `visibleText`. Für saubere Namen sind die Sätze zeichengleich; alle 697 Domänenfälle sind grün.
- **O-JN:** Der Satz in `catalog.ts` bleibt unverändert. Er ist markiert (A-A-50, Satz 3), der Prüffall folgt unten.
- **Konstanten:**
  - In `@takt/domain`: `TODO_TAG_IDS_MAX` 200, `TODO_TAG_NAMES_MAX` 50 (in `tag.ts`), `MAIL_NOTE_MAX_LENGTH` 4000, `MAIL_EXCERPT_MAX_LENGTH` 4000, `MAIL_IDENTITY_MAX_LENGTH` 4096, `MAIL_SUBJECT_MAX_LENGTH` 4096, `MAIL_SENDER_MAX_LENGTH` 2048, `MAIL_MESSAGE_ID_MAX_LENGTH` 2048 (in `mail-entry.ts`).
  - Die Call-Nummer an der Haupttür nutzt jetzt `CALL_NUMBER_MAX_LENGTH`.
- **Aufgabenbereich:** Die Fristen sind dieselben wie auf 17843. `.map` ist aus der Positivliste gefallen und ergibt 403.
- Kommentare in neuem Code sind englisch; deutsche Kommentare habe ich nur dort übersetzt, wo ich sie umgeschrieben habe.

Risiken:
- **Sicherheit, A-28.1:** Erstmals entscheidet ein Wert aus dem Bestand, ob die Versionsprüfung fragt. Ein lokaler Prozess mit Sitzungsgeheimnis oder Schreibzugriff auf die Datei kann damit Sicherheitshinweise unterdrücken (R-30). Das hat der Auftraggeber so entschieden; Enge und Festnageln stehen in `proof:release-safety`. Das sollte der security-checker in T-406 bewerten.
- **Sicherheit, C-22:** Die globale Suche liest jetzt `todo_note.body`. Heraus gehen nur die Kennzeichen, der Text nie (gemessen). Ein Treffer „im Vermerk“ verrät trotzdem, dass ein Wort im Vermerk steht, an jeden Aufrufer mit Sitzungsgeheimnis. Das ist so gewollt (E-122) und liegt nicht beim Add-in-Token.
- Bis 18c zeigt die Oberfläche Treffer, die nur im Vermerk liegen, ohne Herkunft an (C22-02). Das ist ein Übergangszustand.
- Die Tauschfunktion im Board (`BoardSetupDialog.tsx:93`) scheitert heute mit 409. Das ist ein vorbestehender Fehler; die Abhilfe ist `PUT /pools/order` (T-400).
- Nach der Migration 0029 gibt es zwei Sprachspalten (`locale` ungenutzt und `ui_language`). Das ist verwirrend, aber benannt.

Offene Fragen:
1. **`proof-access.mjs` (T-397a):** Zwei Zeilen erwarten Code 78 bei Migrationsfehlern. Nach A-28.10 ist der Code 65. Bitte in T-397a nachziehen oder mir nach dessen Abschluss freigeben.
2. **Reihenfolge der Migrationen (Orchestrator):** `0029_interface_preferences` ist neu angehängt. Bitte bestätigen.
3. **`proof:shell-parity`** ist jetzt grün und kann nach E-126 Punkt 4 in `package.json` und `proof:all`.
4. **Doku-Rest:** Im „Nachtrag Outlook-Mail-Zuordnung“ stand „fünf erlaubte Add-in-Routen“. Ich habe das in `architektur.md`/`datenmodell.md` auf vier korrigiert. `docs/outlook-bridge-alignment.md` gehört dem documenter und nennt vermutlich ebenfalls fünf.
5. **E-121 Punkt 8 (Prüfports aus der Umgebung)** für `proof-taskpane.mjs:63` (17944) und `proof-db-permissions.mjs:253` habe ich nicht gebaut. Der Auftrag nannte es nicht, und T-397a legt die Variablennamen fest (`TAKT_PROOF_PORT`). Beides sollte dieselbe Namensregel bekommen; wer baut es?
6. Die Umbenennung von O-D auf TypeScript-Ebene (`Pool.rule` → `requiredTags` in Domäne, Speicherung und Prüffällen) braucht einen eigenen, sequentiellen Schritt **nach** T-400. Danach fällt der JSON-Alias.

Nächster Schritt:
- **frontend-dev (T-400), neue Schlüssel und Felder:**
  - `AppSettings.versionCheckEnabled: boolean`, `AppSettings.uiLanguage: 'de' | 'en'` (lesen und per `PATCH /settings` schreiben)
  - `PUT /pools/order { order: Id[] }` mit allen Regeln aller Flächen, Antwort `PoolWithResolution[]`; ersetzt den Tausch in `BoardSetupDialog.tsx:93`
  - `PoolWithResolution.requiredTags` lesen und `requiredTags` statt `rule` senden
  - `resolved.matchesNothingReason` statt der drei Wahrheitswerte
  - `GET /search`: `todos.items[].origins: ('title'|'call_number'|'todo_note')[]`
  - `GET /time-entries?tagId=&poolId=&hasNote=true|false`
  - `TimeEntry.todoNoExport` (Zeiterfassung, A-26.2)
  - Beendigungscodes für `sidecar.rs`: 78 Übergabe der Sitzung, 73 Anwendungsdatenverzeichnis, 66 Bestand öffnen, 65 Migration, 74 Port
  - Neue Fehlerlage: `PATCH`/`POST /pools` mit `requiredTags` und `rule` zugleich ergibt 422 (Feld `requiredTags`)
  - Danach die Ausnahmen in `proof-callers.mjs` streichen: `reorderPools`, `updateSettings`, `createPool`/`updatePool`
- **integration-dev (T-398), Konstanten aus `@takt/domain`:**
  - `ADDIN_TAG_IDS_MAX` wird `TODO_TAG_IDS_MAX`, `ADDIN_TAG_NAMES_MAX` wird `TODO_TAG_NAMES_MAX`
  - `ADDIN_NOTE_MAX_LENGTH` und `MAX_TAKEOVER_CHARACTERS` werden `MAIL_NOTE_MAX_LENGTH`
  - In `mailMetadataSchema` werden `MAIL_EXCERPT_MAX_LENGTH`, `MAIL_IDENTITY_MAX_LENGTH`, `MAIL_SUBJECT_MAX_LENGTH`, `MAIL_SENDER_MAX_LENGTH` und `MAIL_MESSAGE_ID_MAX_LENGTH` verwendet
  - `PoolDto` kann später `requiredTags` lesen; `/addin/context` liefert heute nur `rule`
- **unit-tester (T-401), Vorschläge für Prüffälle:**
  1. `isAbsoluteAttachmentPath('\\temp\\datei.pdf') === false`, `'/home/x'` bleibt wahr (E-126 Punkt 2).
  2. `userNameWithoutDomain`: `DOM\u` wird `u`, `u@dom.example` wird `u`, `u` bleibt `u`, `DOM\` bleibt unverändert; dazu der Handschlag mit `DOM\u`, danach tragen `GET /settings` und `export_run.windows_user` den Wert `u`.
  3. `resolvePool`: `matchesNothingReason` ist `none`, `empty` bzw. `unresolved_required`; bei leerem Ordner und leerer Regel gewinnt `unresolved_required`; es gilt immer `matchesNothing === (reason !== 'none')`.
  4. `quoteName('A\\u202eB')` enthält kein U+202E; `enumerateNames(['Ost','Nord'])` ist zeichengleich wie bisher.
  5. Versionsprüfung mit `enabled.isEnabled = () => false`: 0 Aufrufe von `source.latest`, `current()` ist `unknown`; mit einem werfenden Schalter 0 Aufrufe und genau eine Zeile `version_check_switch_unreadable`; mit wechselndem Schalter fragt der nächste Takt wieder. Adapter `isEnabled` bei fehlender Zeile: `false`.
  6. Migration 0029 vorwärts und rückwärts; die CHECK-Bedingungen weisen `ui_language='fr'` und `version_check_enabled=2` ab.
  7. Archiv: Fassung 10 wird mit `version_check_enabled=1`, `ui_language='de'` gelesen; Rundlauf mit Fassung 11 und `false`/`en` bleibt erhalten; Fassung 12 wird abgewiesen. Dazu die vier heutigen Pins in `data-transfer.test.ts` auf 11 heben.
  8. `PoolPort.reorder`: vollständige umgekehrte Ordnung gelingt; Teilstück, doppelte oder fremde Kennung ergeben `validation_error`, der Bestand bleibt unverändert; zwei Positionen, die sich unterwegs kreuzen, verletzen den eindeutigen Index nicht.
  9. `POST /pools` mit `requiredTags` gleich wie mit `rule`; beides zugleich ergibt 422; die Antwort trägt `requiredTags` und `rule` gleich.
  10. Suche nach K-3: eindeutiges Vermerkswort ergibt `origins = ['todo_note']`, das zweite Vermerkswort steht nirgends im JSON; Titel und Vermerk zugleich ergeben `['title','todo_note']`; `GET /todos?search=` findet reine Vermerkstreffer **nicht** (C22-03); Leistungstext einer Buchung, die älter als die 200 jüngsten ist, wird gefunden (C22-04); `%`/`_` im Suchwort sind maskiert.
  11. C-14: `hasNote` true/false; `tagId` mit zwei Tags wirkt als UND; `poolId` zeigt dieselbe Menge wie `GET /pools/{id}/todos` (auch mit leerem Ordner, dann nichts); die Filter greifen vor `limit` (`total` stimmt).
  12. F-8: `todoNoExport` ist nach `PATCH /todos/{id} { noExport: true }` in `GET /time-entries?includeNoExport=true` wahr; `mappers.test.ts` und `time-entry-movement.test.ts:134` nachziehen.
  13. O-JN, A-A-50 Satz 3: `exportSourceCatalog()` → `group.bookingNotes.description` enthält die Aussage „Quelle für das Feld „Notiz“ der Standardvorlage“; Gegenprobe: Satz entfernt, dann rot.
  14. A-28.10: `EXIT_CODES` hat genau diese fünf Werte, paarweise verschieden; ein Start mit belegtem Anwendungsdatenverzeichnis (Datei statt Ordner) endet mit 73.
  15. Aufgabenbereich: `GET /x.map` ergibt 403, auch wenn die Datei existiert.
- security-checker (T-406): A-28.1 (Unterdrückung von Hinweisen), C-22 (Vermerk als Suchquelle), A-28.4 am Handschlag.
