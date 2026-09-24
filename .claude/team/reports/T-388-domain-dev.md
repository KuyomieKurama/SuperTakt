Aufgabe: T-388 — Geldpfad (R-34, R-35, R-36) und Archiv-Import, mit den Zusatzbedingungen aus T-394 (onError, Namensverzeichnis, N-1)
Status: braucht Review
Artefakte:
- packages/domain/src/kernel.ts (`earlierOf` NaN-sicher, `isExactTimestamp`, zwei neue Fehlerschlüssel)
- packages/domain/src/time-entry.ts (`MAX_TIME_ENTRY_SECONDS`, `exceedsMaximumDuration`, `decideOrphanedTimer.now` Pflicht, NaN-Schutz in `decideTimerStop`)
- packages/domain/src/idle.ts (`witnessedIdleEnd`)
- packages/domain/src/text-length.ts (`MAX_PRIORITY_NAME_CHARACTERS`, `MAX_WINDOWS_USER_CHARACTERS`)
- packages/storage/src/ports.ts, packages/storage/src/sqlite/repo-time.ts (24-h-Regel an create/update/stop/start)
- packages/storage/src/sqlite/unit-of-work.ts (Kommentar A-A-132)
- apps/local-api/src/features/timer/{timer.ts,idle.ts,routes.ts}
- apps/local-api/src/features/data-transfer/{data-transfer.ts,foreign.ts}
- apps/local-api/src/features/priorities/routes.ts, apps/local-api/src/access/session-secret.ts (Konstanten aus der Domäne)
- apps/local-api/src/{app.ts,context.ts,http/problem.ts}
- apps/local-api/scripts/{proof-layers.mjs,proof-route-policy.mjs,proof-callers.mjs}
- apps/local-api/openapi/takt-local-api.yaml
- docs/architektur.md, docs/datenmodell.md

Zusammenfassung: Ein unlesbarer Zeitwert bucht nichts mehr statt der Wanduhr; die 24-h-Grenze (A-28.6, E-124 Punkt 3) steht als Konstante und Regel in `packages/domain` und greift in der Speicherung an jeder Schreibstelle, die eine Buchung anlegt oder schließt, mit `time_entry_too_long` (422) bzw. `timer_stop_end_required` (409). `POST /timer/stop` und `POST /timer/orphaned/resolve` nehmen ein optionales `endedAt`. Der Archiv-Import prüft Namen wie die Tür, zieht eine offene Inaktivitätsphase aus der Zukunft auf die Wanduhr, begrenzt ihr Zuordnungsfenster auf das letzte Lebenszeichen, übernimmt den Exportordner nur lokal. `app.onError` protokolliert Klassenname und Code, nie die Meldung.

Prüfung:
- Rot vor grün, ohne Datei in `test/`: Meßgerüst im Kritzelverzeichnis (`scratchpad/t388/measure.test.ts`, `n1.test.ts`, eigener Vitest-Aufruf, echter Anwendungsfallweg über `createTimerMachine` bzw. `compose`):

  | Fall | vorher | nachher |
  |---|---|---|
  | M1 `decideOrphanedTimer`, Lebenszeichen `2026-13-01T00:00:00Z` (GLOB-gültig, `Date.parse` → NaN) | `recorded`, **39 600 s** (Wanduhr) | `discarded`, 0 s |
  | M2 Archiv, offene Phase `started_at` 17:55, Zieluhr 17:45 | `return` → `validation_error`, `stop` → `conflict` (Sackgasse) | Beginn auf 17:45 gezogen; Rückkehr um 17:46 gelingt, Stopp danach möglich |
  | M3 Archiv, offene Phase ab 06:05, Lebenszeichen 06:20, Zieluhr 17:45 | Zuordnungsfenster **42 000 s** | **900 s** |
  | M4 Buchung von Hand 25 h / Stopp nach 30 h | angenommen (90 000 s / 108 000 s) | `time_entry_too_long` / `timer_stop_end_required` |
  | M5 Archiv mit `U+202E` in `tag.name`, `tag_folder.name`, `todo_status.name`, `todo.title` | eingespielt, alle vier tragen das Zeichen | `validation_error`, Bestand unverändert |
  | N-1 `export_directory` = `\\wirt.example\freigabe`, `//wirt.example/freigabe`, `/gibt/es/nicht`, `relativ/ordner`, vorhandener Ordner | (unverändert übernommen, laut T-394) | `null` + Warnung, viermal; der vorhandene Ordner bleibt |
- Gegenprobe zum neuen onError-Nachweis: `app.ts` vorübergehend mit `error.message` in der Zeile → `proof:route-policy` Abschnitt 9 **rot** („none of 4 log lines carries the marker"); Datei danach byte-gleich zurückgeschrieben.
- `pnpm --filter` typecheck für domain, storage, local-api, web, desktop: grün. `tsc -p` der Prüfkonfigurationen domain, storage, export, web, desktop, outlook-addin: grün. **`pnpm typecheck` gesamt rot**, ausschließlich `apps/local-api/test/routes/addin/service.test.ts` (importiert das von T-389 entfernte `bookOnTodo`) — nicht meine Hoheit, nicht meine Änderung.
- `vitest run packages/domain packages/storage apps/local-api`: 1562 grün, 3 rot — alle drei in `test/routes/addin/service.test.ts` (`bookOnTodo`, T-389). Die vorhandenen Fälle zu R-34 (`idle-service-start-guard`, `timer-recovery-booking`, `data-transfer-timer-recovery`, `idle`, `timer-orphan-resolution`) sind grün.
- `proof:*` einzeln gefahren: grün `codepoints`, `migrations`, `conflicts`, `tags`, `access`, `export`, `export-api`, `taskpane`, `foreign`, `surface`, `clamp`, `locked`, `layers` (58/0, vorher 51/0), `release-safety`, `shell-surface`, `template-fields`, `db-permissions`. Rot, ausschließlich wegen der von T-389 entfernten Route `POST /addin/todos/{todoId}/time-entries`: `openapi` (4 Zeilen), `callers` (2), `addin-wiring` (3), `route-policy` (2; Abschnitt 9 neu und grün), `addin` (2). Keine rote Zeile nennt eine Änderung dieses Auftrags. `proof:openapi` ist damit für Punkt 4 grün, als Ganzes nicht.
- Nicht geprüft: `pnpm check`, `test:coverage`, e2e, Rust — nicht verlangt bzw. Orchestrator. Windows-Verhalten von N-1 (UNC an der Form, zugeordnetes Netzlaufwerk) nur gelesen, nicht gemessen.

Annahmen:
1. **Unlesbarer Zeitwert = billige Richtung.** `earlierOf` liefert `null`, wenn eine Seite nicht lesbar ist; `decideOrphanedTimer` endet dann am Beginn → verworfen, wie ohne Lebenszeichen. `decideTimerStop` verwirft eine NaN-Dauer, statt sie zu buchen. `now` ist Pflicht; alle drei Aufrufer übergaben ihn schon.
2. **24-h-Grenze in der Speicherung, Regel in der Domäne.** `exceedsMaximumDuration` wird in `repo-time.ts` an `create`, `update`, `stop` und verdrängendem `start` gefragt — damit sind Stopp, Verdrängung, Verwaistendialog, `beginIdle` ohne Weiterlaufen, Buchung von Hand, Bearbeitung und jeder „Gearbeitet"-Abschnitt unterhalb der Anwendungsfälle abgedeckt, ohne die Türen einzeln aufzuzählen (Lehre aus A-A-128). Zwei Stellen prüfen zusätzlich **vorher**: `beginIdle` (eine Abweisung erst bei der Rückkehr wäre eine Sackgasse) und `resolveIdle` (Feldfehler `allocations.<n>.seconds`, E-124 Punkt 3).
3. **Bearbeitung:** Die Grenze greift nur, wenn Beginn oder Ende geändert werden. Eine ältere, längere Buchung (etwa aus einer eigenen Sicherung) behält ihre Leistung editierbar.
4. **`endedAt` auch am Verwaistendialog** — E-124 Punkt 3 verlangt dort „dasselbe Ende-Feld". Das genannte Ende muß exakt, nach dem Beginn und nicht nach jetzt liegen; für vorgefundene Einträge gilt der Lebenszeichen-Deckel zusätzlich (`bookingEndOf`/`decideOrphanedTimer` nehmen es als Wunsch).
5. **B-5 über die Aufnahme, nicht über eine Spalte.** `timerRecovery.idleSessionId` (freiwillig im Typ, damit bestehende Prüfzusammenhänge gültig bleiben) wird beim Dienststart und beim Import in derselben Klammer wie `replaceAll` gesetzt (`observeRecovery`). Eine so vorgefundene offene Phase endet höchstens am letzten Lebenszeichen ihres Eintrags (`witnessedIdleEnd`). Das deckt den Import **und** den Absturz mitten in der Abwesenheit. Ist nichts bezeugt, wird die offene Periode verworfen (frühere Perioden bleiben) — ein leeres Fenster hätte `resolveIdle` nie angenommen.
6. **Uhrversatz:** nur die **offene** Phase wird gezogen, samt ihrer früheren Perioden (gekappt, leere fallen weg). Eine Rückkehr in genau derselben Sekunde wie das Einspielen bleibt `validation_error`; eine Sekunde später geht sie.
7. **onError** exakt nach T-394: `reason = internal_error kind=<Klasse> [code=<code klein>]`, Code nur bei `^[A-Z0-9_]{1,32}$`. Der eigene Wurf in `timer.ts` trägt seinen Schlüssel großgeschrieben als `code`, die Meldung ist fester englischer Text.
8. **Namensverzeichnis** wie von T-394 aufgezählt; Längen der jeweiligen Tür. `title`/`display_name` am Anhang dürfen `null` **oder leer** sein (die Tür macht aus `''` `null`; sonst bräche der Round-Trip an Altbeständen). Zwei Konstanten sind dafür nach `packages/domain` gewandert (Priorität 120, Windows-Name 256) und werden an ihrer Tür jetzt von dort gelesen.
9. **N-1:** `not_writable` gilt als „vorhanden" und bleibt; nur fehlend, relativ, UNC/Netz fallen weg. UNC wird an der Form erkannt, **bevor** das Dateisystem gefragt wird.
10. **`rejectedTimeEntries`** ist ein neues Pflichtfeld der Importzusammenfassung (Fremdimport zählt, eigenes Archiv 0) — zusätzlich zur Warnung.
11. Neue Kommentare englisch (E-118); berührte deutsche Kommentare nur dort übersetzt, wo ich sie ohnehin umschrieb. Keine Archivfassung gehoben.

Risiken:
- **Bis T-400 kann die Oberfläche einen Timer über 24 h nicht stoppen.** Der Dienst antwortet `409 timer_stop_end_required`, die Oberfläche schickt noch kein `endedAt` (in `proof-callers` als begründete Ausnahme eingetragen, mit Hinweis zum Streichen). Ebenso `POST /timer/start` mit Verdrängung und der Verwaistendialog über 24 h (dort bleibt „verwerfen"). T-400 muß vor einer Auslieferung stehen.
- **Lücke benannt:** `timer.separateIdle` bei der Rückkehr prüft die 24 h nicht — erreichbar nur für eine Phase, die vor dieser Regel begonnen wurde (neue Phasen weist `beginIdle` ab). Abweisen hätte dort eine Sackgasse erzeugt.
- **Alte Sicherungen können jetzt abgewiesen werden**, wenn ein Name Steuer-/Richtungszeichen oder Überlänge trägt (so von T-394 verlangt, „abweisen, nicht bereinigen"). Der Benutzer hat dann nur den Weg, den Namen im Quellbestand zu ändern.
- Sicherheit: Unter Windows fragt die Ordnerprüfung bei einem **zugeordneten Netzlaufwerk** (`Z:\…`) den Server; `statfs` erkennt das dort nicht. Der Benutzer hat das Laufwerk selbst eingerichtet; UNC-Pfade erreichen das Dateisystem nie.
- Die Uhrversatz-Korrektur zieht nur `timer_idle`; ein laufender `time_entry` mit Beginn in der Zukunft bucht beim Stopp 0 s (verworfen) — keine Sackgasse, aber still.

Offene Fragen:
1. Die fünf roten Nachweisläufe und `pnpm typecheck` hängen am Add-in-Rückbau (T-389): OpenAPI-Eintrag `createAddinTimeEntry`, `proof-route-policy` Abschnitte 2/3, `proof-addin-wiring`, `proof-callers` Add-in-Teil, `test/routes/addin/service.test.ts`. Nach Board ist das T-397 bzw. unit-tester; ich habe es bewußt nicht angefaßt.
2. Soll `timer.separateIdle` für Altphasen über 24 h deckeln (Beginn + 24 h) oder bleibt die Lücke dokumentiert?
3. Frontend (T-400): neue Schlüssel `timer_stop_end_required` (409) und `time_entry_too_long` (422, `details[].field` = `endedAt` bzw. `allocations.<n>.seconds`), neues Feld `rejectedTimeEntries` in `DataImportSummary` (für `apps/web/src/api/types.ts`).

Nächster Schritt:
- unit-tester (T-401), Prüffälle vorgeschlagen, am Meßgerüst oben belegt:
  1. `decideOrphanedTimer` mit Lebenszeichen `2026-13-01T00:00:00Z` → `discarded` (vorher 39 600 s); ebenso mit unlesbarem `now`.
  2. `decideTimerStop` mit unlesbarem Beginn → `discarded`, `durationSeconds: 0`.
  3. Import mit offener Phase `started_at` > Zieluhr → Rückkehr eine Sekunde später gelingt; frühere Perioden gekappt.
  4. Import offene Phase 06:05, Lebenszeichen 06:20, Zieluhr 17:45 → Fenster 900 s; ohne Lebenszeichen → Phase verworfen, `resolveIdle` nicht blockiert; Absturzfall ohne Archiv über `captureTimerRecovery` ebenso.
  5. 24 h: Buchung von Hand 86 400 s grün, 86 401 s `time_entry_too_long`; PATCH nur der Leistung an einer 25-h-Buchung grün; Stopp nach 25 h ohne Ende `timer_stop_end_required`, mit Ende 24 h grün, mit 24 h + 1 s `time_entry_too_long`; Verdrängung, Verwaistendialog, `beginIdle`, `resolveIdle` je einmal; Fremdimport zählt `rejectedTimeEntries`; eigenes Archiv behält und warnt.
  6. Import mit `U+202E` je Spalte des Verzeichnisses → 422, Meldung nennt Tabelle.Spalte und nicht den Wert, Bestand unverändert.
  7. N-1 wie im Meßgerüst (fünf Pfade).
- security-checker: onError-Zeile und N-1 gegenlesen (T-406).
