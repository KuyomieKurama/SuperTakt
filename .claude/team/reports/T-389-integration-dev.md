Aufgabe: T-389 — Add-in-Rückbau der Buchungsroute und Quellkarten (Welle 18a, E-120, A-28.11)
Status: teilweise
Artefakte:
- apps/local-api/src/routes/addin/index.ts — Route `POST /todos/:todoId/time-entries` entfernt, samt fehlplatziertem Docstring, `time_entry_rejected`-Meldung und Typimporten
- apps/local-api/src/routes/addin/service.ts — `bookOnTodo`, `AddinBookInput`, `AddinBookResult`, `AbortBooking` entfernt; Kommentare zur Buchung im Add-in berichtigt
- apps/local-api/src/routes/addin/schema.ts — `bookSchema`, `ADDIN_BOOKING_NOTE_MAX_LENGTH`, `BookBody`, `timestamp`, Eintrag `createAddinTimeEntry` in `REQUEST_SCHEMAS` entfernt
- apps/local-api/src/routes/addin/ports.ts — `AddinUnit` enger: ohne `todos.clearDone`, ohne `timeEntries.create` (A-10.12 strukturell)
- apps/outlook-addin/src/api/client.ts — `book`, `BookRequest` entfernt
- apps/outlook-addin/src/api/types.ts — `BookResponseDto`, `TimeEntryDto` entfernt; Kommentare berichtigt
- apps/outlook-addin/src/duplicate/reopen.ts — gelöscht (nur noch Buchungssätze, kein Aufrufer im Aufgabenbereich)
- apps/outlook-addin/src/duplicate/rule.ts — `OfferDescription.poolMovement` entfernt, Buchungssätze berichtigt
- apps/outlook-addin/src/config.ts — `DURATION_PRESETS_MINUTES`, `MAX_DURATION_MINUTES` entfernt (ohne Leser, nur für die Buchung)
- apps/outlook-addin/src/ui/Primitives.tsx — zwei Kommentare über die Buchungsbeschriftung berichtigt
- apps/outlook-addin/vite.config.ts — `sourcemap: 'hidden'` (A-28.11)
- apps/outlook-addin/scripts/fixtures.mjs — Attrappe ohne `clearDone`, `timeEntries.create`, `clearDoneFailure` (wie `AddinUnit`)
- apps/outlook-addin/scripts/proof-addin.mjs — Buchungsprüfungen entfernt, Wächter geschärft (siehe unten)
Zusammenfassung: Die Buchungstür unter `/addin` ist mit Route, Anwendungsfall, Schema, Client, Typen und Darstellungshelfer entfallen; die Port-Fläche des Add-ins kann strukturell weder buchen noch „Erledigt" aufheben. `proof:addin` misst jetzt die Abwesenheit jeder Buchungstür an der Anforderung (A-10.12) statt an der gefallenen Route. Das Bündel trägt keine `sourceMappingURL` mehr.

Der geschärfte Wächter (E-099 Punkt 3, E-100 Punkt 3):
- Neu „E-120/A-10.12: keine Tür unter /addin bucht Zeit oder hebt Erledigt auf": zusammengesetzter Dienst, gültiges Add-in-Token, Trägertodo vorher über die Haupttür erledigt; die gefallene Tür antwortet 404; die Rundfahrt fährt jede Route unter `/addin` mit `startedAt`/`endedAt`/`note` im Rumpf an, muss ankommen (A-A-73), und danach stehen 0 Zeilen in `time_entry` (ganze Tabelle) und `completed_at` ist unverändert; dazu die Namensprüfung (`time|timer|book|done`).
- Neu „E-120, Gegenprobe": eine buchende Zusatztür unter harmlosem Namen (`…/notiz`) wird an der Wirkung rot und mit Pfad gemeldet (`mitBuchung`).
- Die Rundfahrt misst je Route zusätzlich `bucht` (Zuwachs in `time_entry`).
- Die Durchgriffsprobe fragt zusätzlich `…/todos/{id}/time-entries`, `/addin/time-entries`, `…/todos/{id}/timer`, `/addin/timer/start`, `…/todos/{id}/done` mit POST/PUT/PATCH — alle müssen 404 sein.
- `ADDIN_FLAECHE` hat die Buchungsroute verloren; ihr Wiedereinbau wird an der Menge rot.
- Papierseite: der Add-in-Abschnitt der OpenAPI darf keinen Pfad mit `time|timer|book|done` führen; `REQUEST_SCHEMAS` darf kein `createAddinTimeEntry` führen.
- Die drei Gegenproben, die die Buchungsroute als Nachbarn benutzten, zeigen jetzt auf `…/mails` (404-Probe, Doppelregistrierung) bzw. `GET /addin/context` (Durchgriff); Gegenprobe 3 (A-A-73) verstümmelt jetzt den Titel der Anlegetür statt des Zeitstempels der gefallenen Route.
- Entfernt, weil sie nur die Buchung maßen: Abschnitt 15 (Rücknahme bei scheiterndem `clearDone`), C-03-Hinweis, I-05-Ankündigung/Bestätigung, T-084-Bestätigungen, „Leistung"-Deckel (O-AR), TP-ADDIN-02 (kein Duplikat nach dem Buchen), `reopenIfDone`-Probe. Die Messung von `findMatches().poolMovement` am Dienst bleibt (Feld steht weiter im Vertrag, siehe Offene Fragen).

E-087 — heutiger Wortlaut, gesucht mit `git grep` über `tests/**` und `apps/*/test/**` plus Lauf über `apps/*/src`, `packages/*/src`, `apps/*/scripts`, `tests/` ohne `dist`, `node_modules`, `taskpane`:
- Gestrichene Sätze aus `duplicate/reopen.ts` („Dieses Todo ist erledigt. Eine Buchung darauf hebt das Kennzeichen automatisch auf.", „N Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.", „N Minuten werden gebucht.", „Das Erledigt-Kennzeichen wird automatisch aufgehoben.", „Das Erledigt-Kennzeichen ist aufgehoben.", „Dieses Todo ist erledigt. Mit dieser Buchung wird es wieder offen.", „Gebucht. „X" ist wieder offen."): **kein Treffer** in `tests/**` oder `apps/*/test/**`. Einzige Leser waren `proof-addin.mjs:1663, :3717, :3766` (angepasst). Die Treffer auf „ist wieder offen" in `apps/web/test/**` und `tests/e2e/**` gehören den Sätzen der Hauptanwendung, nicht dem Add-in.
- „Die Zeitbuchung wurde nicht angenommen." / `time_entry_rejected`: kein Treffer außerhalb von `index.ts`.
- Route und Aufrufer (werden rot, fremde Hoheit): `tests/e2e/support/api.ts:533-549` (`AddinBookResult`, `addinBookOnTodo`), `tests/e2e/attachment-export-and-addin-exclusion.spec.ts:10, :196, :204`, `tests/e2e/pool-movement-sentence.spec.ts:43, :146, :246, :269`, `apps/local-api/test/routes/addin/service.test.ts:2-24, :54, :143, :181, :299-384`; Skripte `apps/local-api/scripts/proof-addin-wiring.mjs:272`, `proof-openapi.mjs:513`, `proof-route-policy.mjs:617-632, :852`, `service-scenario.mjs:908-911`, `proof-callers.mjs:1080`; Kommentar `apps/local-api/src/app.ts:129`.

Prüfung:
- `pnpm typecheck`: **rot**, und zwar erwartet und nicht in meiner Hoheit. Erster Lauf: alle Paket-Typprüfungen grün (`domain`, `export`, `storage`, `outlook-addin`, `local-api`, `desktop`, `web`); `typecheck:test` rot allein in `apps/local-api/test/routes/addin/service.test.ts` (5 Fehler: `bookOnTodo` fehlt, `timeEntries.create` und `clearDone` nicht mehr in `AddinUnit`). Die danach verketteten Stufen einzeln nachgefahren: `apps/web`, `apps/desktop`, `apps/outlook-addin` Test-tsconfig grün. Ein zweiter Lauf zeigte zusätzlich Fehler in `packages/storage/src/sqlite/repo-time.ts` und `apps/local-api/src/http/problem.ts` (`TIME_ENTRY_TOO_LONG`, `TIMER_STOP_END_REQUIRED`) — Zwischenstand der parallel laufenden T-388, nicht von mir; `typecheck:e2e` deshalb derzeit rot, mein Teil daran nicht beteiligt.
- `pnpm --filter @takt/outlook-addin build`: grün. `grep -rl sourceMappingURL apps/outlook-addin/dist`: kein Treffer. Die `.map`-Dateien liegen weiter in `dist/assets/` (gewollt bei `'hidden'`).
- `pnpm run proof:addin`: **286 bestanden, 2 fehlgeschlagen** (vorher 307/0). Beide Fehlschläge sind die Papierseite und hängen allein an der OpenAPI-Datei, die noch `POST /addin/todos/{todoId}/time-entries` (`createAddinTimeEntry`) beschreibt: „der Add-in-Abschnitt beschreibt den Anhangsweg — und keinen zweiten" (neue Zeile E-120) und „O-BB". Sie werden grün, sobald T-397 den Pfad aus der OpenAPI nimmt; ich habe sie bewusst nicht abgeschwächt (E-121 Punkt 10). Alle Prüfungen am laufenden Dienst, einschließlich der neuen Wächter und Gegenproben, sind grün.
- `vitest run apps/outlook-addin`: 6 Dateien, 49 Tests grün.
- `vitest run apps/local-api/test/routes/addin`: 3 rot (der `describe('bookOnTodo …')`-Block in `service.test.ts`), 14 grün — erwartet, unit-tester.
- Nicht geprüft: `pnpm check` gesamt, e2e, `proof:all` (die vier fremden Nachweisläufe sind laut Auftrag rot erwartet).

Annahmen:
- `duplicate/reopen.ts` fällt ganz. Seit PR #15 hatte die Datei keinen Aufrufer im Aufgabenbereich; der Kommentar in `proof-addin.mjs` nannte sie selbst „legacy presentation helper" der Buchung, und Board-Zeile Y-10/Y-11 sah ihren Wegfall schon vor. Nach CLAUDE.md „Ein Satz, der eine Handlung nennt, die es nicht gibt, ist derselbe Fehler" gehört sie in denselben Auftrag.
- `OfferDescription.poolMovement` fällt im Add-in (kein Leser im Aufgabenbereich); `TodoMatchDto.poolMovement` bleibt als Spiegel der Dienstantwort stehen, ebenso `AddinTodoMatch.poolMovement` und `bookingMovement` im Dienst, weil `findMatches` sie liefert und die Antwortform zur OpenAPI gehört.
- `AddinUnit` wurde enger gezogen (kein `clearDone`, kein `timeEntries.create`). Nicht ausdrücklich beauftragt, aber es ist genau das „nur, was allein dafür lebt" an der Portfläche und macht A-10.12 strukturell. Der Aufbau in `composition.ts` bleibt gültig (ein vollständiger `UnitOfWork` erfüllt den engeren Typ).
- `DURATION_PRESETS_MINUTES` und `MAX_DURATION_MINUTES` hatten keinen Leser mehr und waren Buchungsvorgaben; entfernt.
- Die neuen Kommentare sind englisch (E-118); umgebende deutsche Kommentare habe ich nur dort berührt, wo sie die entfallene Fläche beschrieben.

Risiken:
- Sicherheit: Mit dem Rückbau fällt die einzige Tür, über die das dauerhafte Add-in-Token Zeitbuchungen erzeugen und das Erledigt-Kennzeichen aufheben konnte. Das verkleinert die Fläche eines entwendeten Tokens (A-A-Kapitel zu `/addin`); der Wächter misst das jetzt an der Wirkung.
- `sourcemap: 'hidden'` hält die `.map`-Dateien im Bündel. `apps/desktop/scripts/build-taskpane.mjs:112` kopiert `dist/` rekursiv ins Paket, und `apps/local-api/src/taskpane/server.ts:83` kennt `.map` als Inhaltstyp — ohne T-397 (Dienst liefert keine `.map`) und ohne einen Filter beim Kopieren (frontend-dev) werden sie **ausgeliefert**, auch wenn das Bündel nicht mehr auf sie verweist. A-28.11 ist mit T-389 allein also nicht erfüllt.
- Welle 18b hängt an diesem Stand: T-397 und T-399 müssen die fremden Aufrufer nachziehen, sonst bleiben `proof:all`, `typecheck:test` und die e2e-Specs rot.

Offene Fragen:
1. An domain-dev (T-397): OpenAPI — `POST /addin/todos/{todoId}/time-entries` samt Schemata (`createAddinTimeEntry`, Antwort mit `timeEntry`, `todoWasDone`, `doneCleared`, `poolMovement`) streichen; danach werden die zwei roten Zeilen in `proof:addin` grün. Ebenso `proof-route-policy.mjs:617-632, :852`, `proof-openapi.mjs:513`, `proof-addin-wiring.mjs:272`, `proof-callers.mjs:1080`, `service-scenario.mjs:908-911`, Kommentar `app.ts:129`.
2. An domain-dev (T-397): `taskpane/server.ts` darf `.map` nicht ausliefern (A-28.11); an frontend-dev: soll `build-taskpane.mjs` `.map` gar nicht erst ins Paket kopieren? Beides zusammen wäre die vollständige Umsetzung.
3. An unit-tester: `apps/local-api/test/routes/addin/service.test.ts` — der Block `describe('bookOnTodo …')` (Zeilen 299-384), der Import in Zeile 54, die Attrappe in Zeile 143 (`timeEntries.create`) und der Typ in Zeile 181 (`clearDone`) passen nicht mehr zur engeren `AddinUnit`.
4. An e2e-tester (T-399): `addinBookOnTodo` und `AddinBookResult` in `tests/e2e/support/api.ts`; die Specs `pool-movement-sentence.spec.ts` und `attachment-export-and-addin-exclusion.spec.ts` rufen es auf.
5. An Orchestrator/Auftraggeber: Soll `poolMovement` in der Trefferantwort von `GET /addin/todo-matches` bleiben? Der Wert beschreibt, was eine Buchung bewegen würde; das Add-in bucht nicht mehr und zeigt nichts davon an. Streichen hieße Vertragsänderung (OpenAPI, Dienst, `proof:addin` Abschnitt 12/14) und spart die Ordnerauflösung je Suche.
6. An spec-ux-reviewer (E-078 Punkt 3): Die gestrichenen Sätze aus `reopen.ts` gingen auf C-03, T-084 und I-05 zurück. Sie waren seit PR #15 nicht mehr sichtbar; ich bitte um nachträgliche Zustimmung zur Streichung.
7. Widerspruch in `CLAUDE.md`, Abschnitt „Fachliche Punkte": „Gehandelt wird am gefundenen Todo nicht — weder gebucht noch angehängt (A-10.9 in der Fassung von E-100)". Laut A-10.11/A-10.16 ergänzt die E-Mail die vorhandene Aufgabe. Das Buchungsverbot stimmt, das Anhängeverbot nicht mehr. Nicht meine Datei.

Nächster Schritt: T-397 streicht die OpenAPI-Beschreibung und zieht die vier Nachweisläufe nach; danach `proof:addin` erneut fahren (Erwartung 288/0). Parallel dazu unit-tester an `service.test.ts` und T-399 an `tests/e2e/support/api.ts`; spec-ux-reviewer bestätigt die Streichung der `reopen.ts`-Sätze.
