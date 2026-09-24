Aufgabe: T-412 — Nacharbeit aus dem Code-Review T-405a (E-132)
Status: braucht Review
Artefakte:
- packages/domain/src/text-length.ts — `LEGACY_MAX_TITLE_CHARACTERS = 512`
- packages/domain/src/time-entry.ts — `exceedsMaximumSeconds(seconds)`; `exceedsMaximumDuration` baut darauf auf
- apps/local-api/src/features/data-transfer/data-transfer.ts — `todo.title` im Archiv gegen 512; die zwei `@takt/domain`-Importe zu einem zusammengeführt
- apps/local-api/src/features/timer/idle.ts — nutzt `exceedsMaximumSeconds`, Import von `MAX_TIME_ENTRY_SECONDS` entfernt
- packages/storage/src/sqlite/database.ts — `foldForSearch` und SQL-Funktion `takt_fold`, auf jeder Verbindung registriert
- packages/storage/src/sqlite/repo-time.ts — `noteContains` über `takt_fold(note) LIKE ?`; Docstring von `createTimeEntryPort` an die richtige Stelle gesetzt (und übersetzt)
- packages/storage/src/ports.ts — Kommentar zu `noteContains`
- apps/local-api/src/features/structure/routes.ts, apps/local-api/openapi/takt-local-api.yaml — `PUT /pools/order` ohne `.max(200)` bzw. `maxItems: 200`
- packages/storage/src/sqlite/repo-version-check.ts, packages/storage/src/sqlite/mappers.ts — eine fehlende Zeile liest sich an beiden Stellen als an (`!== 0`)
- apps/local-api/scripts/proof-release-safety.mjs — die festgeschriebene Anweisung von `isEnabled` (`ADAPTER_ANWEISUNGEN`) samt Kommentar nachgezogen
- docs/architektur.md, docs/datenmodell.md — Suchfaltung, Altgrenze für Titel, Vorgabewert des Schalters

Zusammenfassung: Die eigene Datensicherung nimmt jetzt Titel bis zur Altgrenze 512 an; neue Titel bleiben bei 500. Die Suche im Leistungstext ignoriert Groß-/Kleinschreibung auch außerhalb von ASCII, und zwar in SQL vor Zählung und Seitenbegrenzung. Die 24-h-Regel läuft nur noch über Domänenfunktionen, `PUT /pools/order` hat keine eigene Obergrenze mehr, und der Versionsprüfungs-Schalter steht bei fehlender Zeile überall auf an.

Prüfung:
- `pnpm --filter @takt/{domain,storage,local-api} typecheck`: grün. `tsc -p <paket>/tsconfig.test.json --noEmit` für alle drei: Exitcode 0.
- `TAKT_PROOF_PORT=23843 npx vitest run packages apps/local-api`: 98 Dateien grün, 1 übersprungen; 1755 Tests grün, 2 übersprungen.
- `pnpm proof:openapi`: 114/0.
- `pnpm proof:release-safety`: zuerst 157/1, weil der Lauf `isEnabled` zeichengleich festschreibt (Absicht dieses Laufs). Nach dem Nachziehen von `ADAPTER_ANWEISUNGEN` 158/0.
- `pnpm boundaries`: grün, Notiz-Trennung unverletzt.
- `pnpm proof:callers`: **73/1, rot, aber nicht durch diesen Auftrag.** Die Regel „`request` steht nur in api/client.ts und den api.ts-Dateien“ schlägt an den unversionierten Dateien `apps/web/src/features/export/texts.ts:670` und `apps/web/src/features/settings/texts.ts:389` an. Beide gehören zu T-400a (frontend-dev) und sind neue englische Oberflächentexte, die das Wort „request“ enthalten. Den Wächter habe ich nicht angefasst, siehe Offene Fragen.
- Wegwerfprüfung im Scratchpad (Node mit `--experimental-strip-types`, nichts im Baum): „ärger“, „ÄRGER“ und die zerlegte Form „a + U+0308 + rger“ finden „Ärger mit Kunde“, „ärgern“ findet nichts. `isEnabled` liefert: Vorgabe true, nach 0 false, ohne Zeile true.
- Nicht gemessen: der Archivimport mit einem Titel von 512 Zeichen. Ein Prüffall gehört in `apps/local-api/test/**` und damit dem unit-tester (Vorschlag unten). `pnpm check`, e2e und Rust habe ich nicht gefahren.

Annahmen:
- **Umlaut-Suche, gewählte Lösung:** eine deterministische SQL-Funktion `takt_fold` auf jeder Verbindung (`DatabaseSync.function`, `directOnly`), die `value.normalize('NFC').toLocaleLowerCase('de')` rechnet. Der Suchbegriff wird mit derselben Funktion gefaltet. Gründe:
  - Sie wirkt in SQL, also vor `COUNT` und Seitenbegrenzung.
  - Ein JS-Filter im Port hätte entweder alle Zeilen laden müssen oder die Seiten verfälscht.
  - Eine normalisierte Suchspalte hätte eine Migration gebraucht, deren Reihenfolge dem Orchestrator gehört. Dazu kämen Pflege an jedem Schreibpfad und eine Änderung des Archivs mit neuer `DATA_ARCHIVE_VERSION`.
  - ICU ist in `node:sqlite` nicht geladen.
  - `directOnly` verhindert, dass ein Trigger, eine Sicht oder ein eingespieltes Schema die Funktion aufruft.
  - Die Faltung ist Suchtechnik des Adapters und keine Fachregel, deshalb liegt sie in `packages/storage` und nicht in der Domäne.
- NFC-Normalisierung habe ich mit aufgenommen, damit aus Outlook oder anderen Programmen eingefügter Text in zerlegter Form (NFD) ebenfalls gefunden wird. „STRASSE“ findet „Straße“ weiterhin nicht (kein Case-Folding von ß); E-132 verlangt das nicht.
- Geändert habe ich nur die Leistungstextsuche (E-132 Punkt 2). Titel, Call-Nummer und Todo-Notiz falten weiterhin nur ASCII (repo-todos.ts:111ff.).
- `PUT /pools/order`: Die Obergrenze entfällt ersatzlos. Die Länge begrenzt die Rumpfgrenze von 1 MB. Die Vollständigkeit prüft die Speicherung schon heute (422, wenn die Liste nicht genau die vorhandenen Regeln nennt).
- Vorgabewert des Schalters: `!== 0` an beiden Stellen, entsprechend E-132 Punkt 4. Der Reviewer hatte `=== 1` im Mapper bevorzugt, das wäre „aus“ gewesen.

Risiken:
- **Sicherheit, für den security-checker:** `proof:release-safety` hatte „missing row reads as off“ ausdrücklich festgeschrieben. Nach E-132 Punkt 4 liest sich eine fehlende Zeile jetzt als **an**, der Dienst fragt in diesem Fall also GitHub. Heute ist das nicht erreichbar, weil die Zeile gesät ist. Die Wächterzeile habe ich mit Verweis auf E-132 nachgezogen; das braucht eine Bestätigung durch den security-checker (R-30).
- `DatabaseSync.function` gibt es erst ab Node 22.13.0. Im Bündel liegt 22.23.2 (`sidecar-runtime.mjs`), in CI ebenfalls 22.23.2. Das Wurzel-`package.json` erlaubt aber `engines.node >=22.5.0`. Unter 22.13 würde `openConnection` werfen.
- Die Suche ruft `takt_fold` für jede Zeile mit Leistungstext auf. `LIKE '%…%'` durchsucht die ganze Tabelle ohnehin, es kommt aber ein Aufruf von JS aus SQLite je Zeile dazu. Bei den erwarteten Beständen ist das unkritisch, gemessen habe ich es nicht.

Offene Fragen:
1. Orchestrator: `engines.node` im Wurzel-`package.json` auf `>=22.13.0` anheben (gemeinsame Datei).
2. Orchestrator/frontend-dev: `proof:callers` ist rot an den neuen `texts.ts` aus T-400a (Wort „request“ in Oberflächentext). Entweder formuliert T-400a die beiden Sätze um (z. B. „did not answer when asked for the folder picker“, „came from a foreign origin“). Oder der Wächter in `request-scan.mjs` nimmt Zeichenkettenliterale aus. Letzteres wäre meine Datei, schwächt aber absichtlich strenge Gegenproben (`client['request']`) und sollte nicht parallel zu T-400a laufen.
3. Soll die Titel-, Call- und Notizsuche (`todoFilterConditions`) dieselbe Faltung bekommen? Heute verhalten sich Leistungstext und Todo-Suche verschieden.

Prüffallvorschläge für den unit-tester:
- **512-Titel** (`apps/local-api/test/data-archive-name-directory.test.ts`):
  - Ein eigenes Archiv mit `todo.title` von genau 512 Zeichen wird angenommen und kommt zeichengleich zurück.
  - 513 Zeichen werden abgewiesen; die Meldung nennt `todo.title`, nicht den Wert.
  - Gegenprobe: `POST /todos` mit 501 Zeichen gibt weiterhin 422 (die Grenze für neue Titel bleibt 500).
- **Umlaut-Suche** (Speicherung und `GET /search`):
  - Leistungstext „Ärger mit Kunde“ wird gefunden von „ärger“, „ÄRGER“ und von „ärger“ (NFD); „ärgern“ findet nichts.
  - `%` und `_` im Suchbegriff bleiben wörtlich („50%“ findet nicht alles).
  - Seitenbegrenzung: Von 250 Buchungen tragen nur die ältesten fünf „Ärger“, und die Suche nach „ärger“ findet alle fünf (Filter vor dem Limit).
  - `SELECT takt_fold(...)` aus einem Trigger bzw. einer Sicht schlägt fehl (`directOnly`), optional.
- **Schalter-Vorgabe** (`packages/storage/test`):
  - Wenn die Zeile `app_setting` fehlt (`DELETE FROM app_setting`), liefern `createVersionCheckStatePort(conn).isEnabled()` und `toAppSettings` bzw. `GET /settings` beide „an“.
  - Bei `version_check_enabled = 0` liefern beide „aus“.
- `exceedsMaximumSeconds` (packages/domain/test): 86400 ist false, 86401 true, `NaN` und `Infinity` false.
- `PUT /pools/order` mit mehr als 200 Regeln wird angenommen, wenn die Liste vollständig ist. Eine unvollständige Liste gibt 422.

Nächster Schritt: Kurzer Nachprüfdurchgang des Code-Reviewers. Der security-checker bestätigt den geänderten Vorgabewert samt Wächterzeile. Danach schreibt der unit-tester die Prüffälle oben (in einer späteren Welle, weil sich `exceedsMaximumSeconds` und `takt_fold` als Schnittstellen geändert haben).
