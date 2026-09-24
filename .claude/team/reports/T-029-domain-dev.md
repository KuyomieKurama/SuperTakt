Aufgabe: T-029 — Zwei Adapterfehler beheben; dazu drei Nachträge aus T-022

Status: fertig

---

Artefakte:

**Teil A — die beiden Adapterfehler (`packages/storage/src/`):**

```
sqlite/unit-of-work.ts     Fehler 1: der Wächter gegen Verschachtelung steht jetzt vor
                           der Warteschlange (AsyncLocalStorage statt `depth`); der
                           unerreichbare Rückfallzweig der Warteschlange ist fort
sqlite/migration-runner.ts Fehler 2: die Fassungsprüfung läuft vor der Prüfsummenprüfung
ports.ts                   `TransactionPort`: was „unzulässig" heißt, steht jetzt am Port
```

**Teil B — die Endungsumstellung (`packages/domain/`, `apps/local-api/`):**

```
src/{index,export,tag,time-entry,settings,todo,rounding}.ts   21 Bezeichner auf `.ts`
scripts/check-export-boundary.mjs      Positivliste auf `./kernel.ts`, `./rounding.ts`
apps/local-api/src/index.ts            der Auflösungshaken ist entfernt
apps/local-api/scripts/proof-export.mjs, proof-taskpane.mjs   dieselben Kopien entfernt
```

**Teil C — „Nicht abrechnen" (E-047), der blockierende Punkt aus T-022:**

```
packages/storage/migrations/0006_not_billed_audit_event.up.sql    neu
packages/storage/migrations/0006_not_billed_audit_event.down.sql  neu
packages/domain/src/time-entry.ts        ExportAuditEvent, ExportStatusTransition,
                                         checkExportStatusTransition, NotBilledRequest
packages/storage/src/ports.ts            ExportPort.markNotBilled
packages/storage/src/sqlite/repo-export.ts   markNotBilled
packages/storage/src/sqlite/mappers.ts       toExportAuditEvent — drei Werte statt zwei
packages/storage/src/sqlite/migration-runner.ts  foreign_key_check je Migration;
                                         Marke `-- takt: foreign_keys=off`
apps/local-api/src/usecases/structure.ts markNotBilled
apps/local-api/src/routes/time.ts        POST /time-entries/{id}/not-billed
apps/local-api/scripts/proof-export.mjs  Migrationszahl wird abgeleitet statt ausgeschrieben
```

**Teil D — Vorschau und OpenAPI:**

```
apps/local-api/src/usecases/export.ts        ExportPreviewResult.groups
apps/local-api/openapi/takt-local-api.yaml   die vier gemeldeten Abweichungen und acht
                                             weitere; neue Route beschrieben
docs/architektur.md                          3.3a „Nicht abrechnen"; Routenübersicht;
                                             Verschachtelung an der Transaktionsklammer
docs/datenmodell.md                          export_audit mit drei Ereignissen; der
                                             Herkunfts-Trigger auf time_entry; 8.2 und
                                             8.3; Migration 0006 samt Nachweisen
```

Nicht angefasst: `packages/*/test/**` (kein Test geändert), `apps/web/**`, `apps/desktop/**`,
`apps/outlook-addin/**`, `packages/export/src/**`, die Wurzeldateien, `docs/**` außer den
beiden eigenen. Kein `git commit`.

---

Zusammenfassung:

**Fehler 1 — die verklemmende Transaktion.** Der `depth`-Zähler war nicht bloß unerreichbar, er
stand am falschen Ort: `run()` läuft erst, wenn `queue` frei ist, und genau darauf wartet der
verschachtelte Aufrufer vergeblich — `queue` wird erst frei, wenn die äußere Transaktion endet,
die ihrerseits auf die innere wartet. Ein Zähler *innerhalb* des Laufs kann diesen Ring
grundsätzlich nicht sehen. Der Wächter musste vor die Reihung.

Warum dafür der asynchrone Aufrufzusammenhang (`AsyncLocalStorage`) und nicht ein einfaches
Kennzeichen „läuft gerade eine Transaktion?": Weil das den zulässigen Fall mitträfe. Zwei
unabhängige Anfragen dürfen einander überlappen — sie sollen **warten**, nicht abgewiesen werden;
das ist der Zweck der Warteschlange. Zu unterscheiden ist „von *innerhalb* der laufenden
Transaktion gefragt" von „gleichzeitig, aber von außen". Belegt mit einer Gegenprobe:

| Fall | Verhalten |
|---|---|
| zweite Anfrage trifft ein, während die erste mitten im `await` hängt | gereiht, beide erfolgreich |
| `inTransaction` aus der laufenden Transaktion heraus | abgelehnt: „Verschachtelte Transaktionen sind unzulässig" |
| Fortsetzung innen geplant, erst nach dem `COMMIT` gelaufen | zulässig, reiht sich ein |

**Fehler 2 — `database_too_new`.** Die Fassungsprüfung steht jetzt vor der Prüfsummenprüfung. Ein
zu neuer Bestand führt zwangsläufig Zeilen, zu denen die ältere Fassung keine Datei hat; stand die
Prüfsummenprüfung vorn, bekam jeder, der eine neuere Datei mit einem älteren Takt öffnet, die
Meldung, seine Datei sei verändert worden. Dieselbe Beobachtung, die falsche Erklärung — die eine
schickt zur Datensicherung, die richtige zum Aktualisieren.

**Teil C — „Nicht abrechnen".** Der Vertrag, den der frontend-dev braucht, steht. **Zwei
Abweichungen von seinem Entwurf**, beide bewusst:

```
POST /api/v1/time-entries/{timeEntryId}/not-billed
  Rumpf:  {} oder { "reason": "…" }  — freiwillig, höchstens 512 Zeichen;
                                       ein fehlender Rumpf ist zulässig
  200     TimeEntry — exportStatus danach 'exported', exportCount unverändert
  404     not_found                 unbekannte oder noch laufende Buchung
  409     export_status_unchanged   bereits ausgebucht oder exportiert
  422     validation_error          reason länger als 512 Zeichen
  Protokoll: export_audit, event = 'not_billed', export_run_id und
             export_run_group_id NULL, actor = Windows-Benutzername
```

1. **Der Pfad heißt `not-billed`, nicht `nicht-abrechnen`.** E-015 und CLAUDE.md: Bezeichner
   englisch, Anzeigetexte deutsch. Ein deutsches Pfadsegment wäre die einzige Stelle der
   Schnittstelle mit dieser Ausnahme — und Punkt 2 desselben Auftrags räumt die deutschen
   Parameternamen gerade ab.
2. **Der Fehlerschlüssel heißt `export_status_unchanged`, nicht `already_exported`.** Statuscode
   und Bedeutung sind dieselben (409). Der Schlüssel existiert bereits und beschreibt genau
   diesen Fall: Der Exportstatus steht schon auf dem Zielwert. Ein zweiter Schlüssel für
   denselben Sachverhalt wäre eine Unterscheidung ohne Unterschied, und die Domäne antwortet ihn
   ohnehin von selbst — `checkExportStatusTransition` urteilt über den tatsächlichen
   Ausgangszustand, nicht über ein fest verdrahtetes `from`.

Die Oberflächentexte sind davon unberührt; der Vorgang heißt auf dem Bildschirm weiterhin „Nicht
abrechnen" und nirgends „als exportiert markieren".

**Das Schema hat dabei mehr gekostet als erwartet, und das war richtig so.** `export_audit` trägt
jetzt einen dritten Ereignistyp mit einem dritten, gleich strengen CHECK-Zweig: `not_billed`
verlangt, dass Exportlauf und Exportzeile **leer** sind. Eine Ausbuchung ist damit an ihrer
Belegfreiheit erkennbar und nicht nur am Namen.

Der Stolperstein lag in `time_entry`: `CHECK (export_status = 'open' OR export_count >= 1)`,
begründet mit „exportiert und nie in einem Lauf gewesen ist widersprüchlich". Mit E-047 stimmt
der Satz nicht mehr. Der bequeme Ausweg — `export_count` beim Ausbuchen mitzählen — wäre eine
Falschaussage gewesen: Die Oberfläche liest `export_status = 'open' AND export_count > 0` als
„schon einmal exportiert" (R-10) und hätte nach einem späteren Zurücksetzen vor einer zweiten
Abrechnung gewarnt, die nie eine erste hatte. Der CHECK ist deshalb gefallen, und an seine Stelle
tritt eine **schärfere** Zusage: `trg_time_entry_exported_needs_provenance` verlangt statt eines
positiven Zählers eine Herkunft — wer eine offene Buchung auf `exported` setzt, ohne dass ein
Exportlauf mitzählt, muss die Protokollzeile bereits geschrieben haben. „Beides oder keines"
(R-10) hängt damit nicht mehr an der Sorgfalt des Adapters, sondern am Schema.

**Der Läufer hat zwei Zusätze bekommen, ohne die das nicht ging.** SQLite kennt kein ALTER TABLE
für einen CHECK, und `time_entry` hat Kinder mit `ON DELETE RESTRICT`: Das DROP scheitert an
ihnen, und ein RENAME zieht ihre REFERENCES-Klauseln auf die weggeworfene Tabelle mit. Eine
Migration kann jetzt mit der Zeile `-- takt: foreign_keys=off` verlangen, dass die Prüfung für
ihre Dauer ruht. Abgeschaltet wird damit nicht die Prüfung, sondern ihr Zeitpunkt: Der Läufer
führt seit dieser Aufgabe nach **jeder** Migration `PRAGMA foreign_key_check` über den ganzen
Bestand aus und nimmt alles zurück, sobald ein Verweis ins Leere zeigt. `datenmodell.md` 8.2
beschrieb diese Gegenprobe seit T-008a als Teil des Verfahrens — umgesetzt war sie nie.

**Teil D — die Vorschau liefert die Tagesgruppen mit.** `POST /export/preview` gibt `groups`
parallel zu `rows` heraus (`groups[i]` gehört zu `rows[i]`). Damit entfällt die einzige Stelle in
der Oberfläche, an der eine Regel der Domäne nachgebaut wurde: welcher Kalendertag zu einer
Buchung gehört (E-025, der Tag des Timerstarts). Die Gruppen tragen Kennungen und Kennzahlen —
`todoId`, `day`, `seconds`, `quarters`, `entryCount`, `timeEntryIds`, `previouslyExported` — und
keinen Text; weder Leistung noch Vermerk. Die Zahl der Aufrufe für S-07 fällt von einem je
Tagesgruppe auf einen.

Nachweise (alles gemessen, nichts behauptet):

```
pnpm check (typecheck, boundaries, contrast, test:coverage, build)      Exitcode 0
  529 Tests in 32 Dateien, davon die beiden vormals roten grün — kein Test geändert
  unit-of-work.ts     100 / 83.33 / 100 / 100   (vorher 96.96 / 83.33 / 91.66 / 96.77)
  migration-runner.ts 94.40 / 85.71 / 96.15 / 94.39
  storage/src/sqlite  90.38 / 80.82 / 95.18 / 94.05
  domain/src          99.28 / 98.79 / 100 / 99.15
proof:access 75, proof:export 66, proof:taskpane 25, proof:addin-wiring 30   je 0 Fehlschläge
proof:addin (fremd, wegen der Domänenänderung mitgefahren) 73, 0 Fehlschläge
```

Migration 0006, gefahren gegen einen Bestand **mit** Daten:

| Probe | Ergebnis |
|---|---|
| vorwärts 0 → 6 | Fassung 6, `integrity_check` = ok, `foreign_key_check` leer |
| Schemaobjekte danach | 17 Tabellen (+ `schema_migration`), 1 Sicht, 32 Indizes, 15 Trigger |
| `not_billed` mit Exportlauf | vom CHECK abgewiesen |
| `exported` setzen ohne Protokollzeile | `export_status_not_settable` (Trigger) |
| `exported` setzen, jüngste Zeile ist `reset` | ebenso abgewiesen |
| `exported` setzen mit mitzählendem `export_count` | erlaubt — der Weg des Exportlaufs |
| rückwärts mit einer `not_billed`-Zeile | bricht ab, Bestand unverändert |
| rückwärts ohne solche Zeile, dann wieder vorwärts | 5 → 6, CHECK jeweils wie erwartet |
| 6 → 0 → 6 | 0 verbleibende Objekte, danach byteweise dieselbe Objektliste; `integrity_check` = ok |

Die neue Route am **laufenden Dienst** über HTTP, nicht nur über die Anwendungsfälle:

```
POST /not-billed ohne Rumpf     200, exportStatus 'exported', exportCount 0
zweiter Aufruf                  409 export_status_unchanged
GET /export/audit               event 'not_billed', exportRunId null, actor 'kerem'
unbekannte Buchung              404 not_found
reason mit 600 Zeichen          422 validation_error
POST /export/preview            data.groups steht neben data.rows
GET /settings                   settings, exportDirectoryState, defaultTags
```

Die sieben Typbehauptungen zur Notiz-Trennung wurden nach dem Umbau einzeln nachgewiesen — je ein
versuchsweise eingefügtes Feld bzw. ein Quellenpfad, Übersetzungsfehler, Rücknahme:

| Behauptung | Probe | Übersetzungsfehler |
|---|---|---|
| NoteBoundaryIsSealed | `'todo.note'` ergänzt | TS2344 in export.ts:219 |
| TodoSourcesAreCovered | `'todo.owner'` ergänzt | TS2344 in export.ts:231 |
| NoSourceIsCalledPlainNote | `'system.vermerk'` ergänzt | TS2344 in export.ts:247 |
| BookingSourcesAreGone | `'booking.day'` ergänzt | TS2344 in export.ts:263 |
| GroupSourcesAreCovered | `'group.extra'` ergänzt | TS2344 in export.ts:272 |
| ExportCandidateHasNoTodoNote | `readonly note: string` | TS2344 in export.ts:304 |
| ExportGroupHasNoTodoNote | `readonly todoNote: string` | TS2344 in export.ts:316 |

`export.ts` wurde danach byteweise wiederhergestellt (geprüft). Die Positivliste des Wächters
führt jetzt `./kernel.ts` und `./rounding.ts`; `pnpm boundaries` meldet unverändert „7 von 7
Typbehauptungen vorhanden".

**Die OpenAPI-Beschreibung: vier gemeldete Abweichungen, acht weitere gefunden.** Alle gegen den
laufenden Dienst nachgemessen, nicht aus dem Quelltext geschlossen:

| Stelle | Beschreibung sagte | Dienst liefert |
|---|---|---|
| `GET /settings` | `AppSettings` | `{settings, exportDirectoryState, defaultTags}` — neu als `SettingsView` |
| `POST /todos` | `Todo` | `{todo, addedDefaultTagIds}` — neu als `TodoCreated` |
| Filternamen | `q`, `nurOffene`, `vonTag`, `bisTag`, `nurSchonEinmalExportiert` | `search`, `onlyOpen`, `fromDay`, `toDay`, `onlyPreviouslyExported`; `onlyWithOpenEntries` fehlte ganz |
| `ExportRun` | `groups` | kein `groups`; dafür `templateSnapshot` |
| **Seitenumschlag (alle Listen)** | `{data: [...], meta: PageInfo}` | `{data: {items, nextCursor, total}}` |
| `POST /export/runs` | `ExportRun` | `{run, skipped}` — neu als `ExportRunResult` |
| `GET /settings/default-tags` | `Tag[]` | `DefaultTag[]` (`{tagId, position}`) |
| `GET /tags` | Suche, Unterordner, Seiten | nur `folderId`, vollständige Liste ohne Seiten |
| `GET /pools/{id}/todos` | `nurOffene` | `includeCompleted` |
| `GET /time-entries` | `meta.sumSeconds` | keine Summe |
| `POST /export/preview` | Rumpf mit `limit`, `templateId` erforderlich | kein `limit`, `templateId` freiwillig und `null`-fähig |
| `ExportPreview` | ohne `skipped`, `templateId`, `templateName` | liefert alle drei (und jetzt `groups`) |

Der Seitenumschlag ist der teuerste davon: Er betrifft **jede** Listenroute, und ein Aufrufer, der
`response.data.map(...)` schreibt, merkt den Unterschied erst zur Laufzeit. Die Datei liest sich
mit `js-yaml` fehlerfrei; kein Verweis zeigt ins Leere.

---

Annahmen:

1. **Der verschachtelte Aufruf bleibt ein Wurf, kein `Result`.** Ein Programmierfehler, den kein
   Aufrufer sinnvoll behandeln könnte. Er kommt als abgelehnte Zusage und nicht als synchroner
   Wurf, damit eine Funktion, die `Promise` verspricht, ihre Störung auch als solche liefert.

2. **Bei `database_too_new` vor `checksum_mismatch` gewinnt die harmlosere Erklärung.** Eine
   ältere Fassung kann über ein Schema, das sie nicht kennt, ohnehin keine belastbare Aussage
   treffen; nur aus „bitte aktualisieren" folgt eine brauchbare Handlung.

3. **Der Wächter gegen Verschachtelung gilt je Klammer, nicht für das ganze Erzeugnis.** Zwei
   Klammern sind zwei Verbindungen. `openDatabase` legt genau eine je Verbindung an.

4. **Der Auflösungshaken wurde entfernt statt umkommentiert.** Nach der Umstellung gibt es in
   `packages/domain`, `packages/storage`, `packages/export` und `apps/local-api` keinen relativen
   `.js`-Bezeichner mehr (geprüft). Ein Haken, der nichts mehr auflöst, ist dieselbe Sorte Fund
   wie der `depth`-Zähler.

5. **Der unerreichbare Ablehnungszweig der Warteschlange ist mitgegangen.** `queue.then(a, b)`
   führte ein `b`, das nie laufen konnte. Die Sicherung ist jetzt der bestehende Prüfpfad „eine
   Transaktion, die wirft, gibt die Warteschlange trotzdem frei" — ein Mechanismus statt zweier,
   und der eine ist geprüft.

6. **`export_count` bleibt beim Ausbuchen stehen.** Er zählt Exportläufe. Siehe oben; das ist die
   Entscheidung, die den Tabellenumbau nötig gemacht hat.

7. **Der Adapter schreibt beim Ausbuchen erst das Protokoll, dann den Status.** Erzwungen vom
   neuen Trigger. Wer die Reihenfolge tauscht, bekommt `export_status_not_settable` aus der
   Datenbank — laut, nicht still.

8. **`toExportAuditEvent` behält den Rückfall auf `exported` für unbekannte Werte.** Ich hätte
   `reset` für die harmlosere Wahl gehalten (ein unbekannter Wert behauptet dann keinen Beleg),
   aber `mappers.test.ts` hält den bisherigen Rückfall fest, und Tests gehören dem unit-tester.
   Vorschlag statt Alleingang, siehe „Offene Fragen".

9. **Migration 0006 setzt `PRAGMA foreign_keys` zusätzlich in ihrem eigenen Text.** Über den
   Läufer ist die Marke in Zeile 2 wirksam; die Prüfpfade, die das Schema untersuchen, spielen
   die Dateien aber ohne Läufer und ohne Transaktion ein — dort wirkt nur das Pragma in der
   Datei. Beides steht da, beides ist begründet, keines ist überflüssig.

10. **Der englische Pfad und der bestehende Fehlerschlüssel** — siehe die zwei Abweichungen oben.

---

Risiken:

1. **Die Abdeckung von `packages/storage/src` liegt bei 80,82 % auf Zweigen — 0,82 Punkte über
   der Schwelle.** `markNotBilled` ist neuer Adaptercode ohne Einheitentest; ich darf unter
   `packages/storage/test/**` nichts anlegen. Der nächste Zusatz in diesem Paket reißt die
   Schwelle, wenn bis dahin keine Tests dafür entstehen. Das ist die dringlichste offene Sache
   aus dieser Aufgabe.

2. **Der Tabellenumbau von `time_entry` ist der größte Eingriff dieser Aufgabe.** Dort liegt die
   abrechenbare Zeit. Er läuft in einer Transaktion, der Läufer legt vorher eine Sicherungskopie
   an, und die Gegenprobe auf Fremdschlüssel läuft vor dem Festschreiben. Gefahren wurde er
   gegen einen Bestand mit Daten, vorwärts, rückwärts und wieder vorwärts, mit byteweise
   gleicher Objektliste. Ein Restrisiko bleibt bei einem **großen** Bestand: Der Umbau kopiert
   die Tabelle vollständig. Bei einem Einzelplatz mit Jahren an Buchungen sind das Sekunden,
   nicht Minuten — gemessen habe ich nur einen kleinen Bestand.

3. **Die Marke `-- takt: foreign_keys=off` ist eine Ausnahme mit Sprengkraft.** Sie ruht die
   Fremdschlüsselprüfung für die Dauer einer Migration. Der Läufer schaltet sie im `finally`
   wieder ein — bliebe sie stehen, liefe der ganze Dienst ohne Fremdschlüssel weiter. Genau
   dafür steht die Zeile im `finally` und nicht hinter dem `COMMIT`.

4. **Der Wächter gegen Verschachtelung hängt am asynchronen Aufrufzusammenhang.** Wer ihn
   durchbricht — eine Fremdbibliothek mit eigener Warteschlange, ein Sprung in einen Worker —,
   nimmt dem Wächter die Sicht; der Aufruf liefe dann wieder in die Warteschlange, also in das
   alte Verhalten und nicht in ein schlechteres. Der Dienst hat heute keine solche Stelle.

5. **Die Prüfpfade teilen sich einen festen Port (17843).** Läuft `proof:access` unmittelbar nach
   einem anderen Prüflauf, der einen Dienst gestartet hat, meldet er reihenweise Fehlschläge, die
   keine sind — der alte Dienst antwortet noch, mit einem anderen Sitzungsgeheimnis. Einzeln
   gefahren sind alle fünf Prüfpfade grün. Kein Fund dieser Aufgabe, aber ein Fallstrick, der
   jemanden eine Stunde kosten wird.

6. **Kein Sicherheitshinweis.** Keine Änderung berührt Token, Herkunft, Dateipfade oder die
   Ausgabe des Dienstes. Der neue Endpunkt liegt hinter derselben Token- und Herkunftsprüfung wie
   alle anderen; `reason` ist auf 512 Zeichen begrenzt und geht in eine parametrisierte Anweisung.
   `actor` kommt weiterhin ausschließlich aus dem Windows-Benutzernamen der Hülle (E-010, B-8.1)
   und ist über keine Anfrage setzbar.

---

Offene Fragen:

1. **An den unit-tester: `markNotBilled` und die Migration 0006 brauchen Prüfpfade.** Vorschlag
   für den Zuschnitt — der Trigger ist die eigentliche Zusage und lässt sich rein über die
   Speicherung prüfen:
   - Ausbuchen setzt `exported`, lässt `export_count` bei 0, schreibt genau eine Protokollzeile.
   - Zweites Ausbuchen: `export_status_unchanged`.
   - Laufende Buchung: `not_found`.
   - `UPDATE time_entry SET export_status='exported'` ohne Protokollzeile: `export_status_not_settable`.
   - Dasselbe, wenn die jüngste Protokollzeile `reset` ist.
   - Rückwärtsmigration mit einer `not_billed`-Zeile bricht ab.
   Dazu die drei Fälle aus meiner Gegenprobe zur Transaktionsklammer, vor allem **zwei
   unabhängige, überlappend gestartete Anfragen**: Er ist der einzige, der eine naheliegende,
   aber falsche Vereinfachung des Wächters — ein bloßes Kennzeichen „läuft gerade eine
   Transaktion?" — sofort rot färben würde.

2. **An den unit-tester: der Rückfall in `toExportAuditEvent`.** `mappers.test.ts` hält fest, dass
   ein unbekannter Wert zu `exported` wird. Nach E-047 ist das die unglücklichere Wahl: Ein Wert,
   den der Übersetzer nicht kennt, behauptet damit einen Beleg. `reset` wäre harmloser. Ich habe
   den Test nicht angefasst.

3. **An den frontend-dev: zwei Abweichungen vom Entwurf** — Pfad `not-billed` statt
   `nicht-abrechnen`, Fehlerschlüssel `export_status_unchanged` statt `already_exported`.
   Begründung oben. Beschriftung und Dialogtexte bleiben wie in T-022 entschieden.

4. **An den frontend-dev: `POST /export/preview` liefert jetzt `groups`.** `groups[i]` gehört zu
   `rows[i]`. Damit kann `toCalendarDay` aus `lib/format.ts` verschwinden — die Nachbildung von
   E-025 ist der einzige Grund, aus dem sie dort steht. `quarterHoursToExportNumber` bleibt davon
   unberührt; das ist die offene Frage 3 aus T-022 an den Orchestrator und nicht an mich.

5. **An den Orchestrator: `GET /search` liest den Suchbegriff aus `q`, `GET /todos` aus
   `search`.** Zwei Namen für dieselbe Sache im selben Dienst. Ich habe **beide beschrieben, wie
   sie sind**, statt eine Seite stillschweigend umzubenennen — der frontend-dev hat gegen den
   heutigen Stand gebaut. Eine Vereinheitlichung ist eine Aufgabe für sich, mit einer Zeile im
   Dienst und einer in der Oberfläche.

6. **An den Eigentümer von `apps/outlook-addin/`: `scripts/ts-extension-resolve.mjs` und
   `register-ts-resolve.mjs` sind ohne Wirkung.** Nach der Endungsumstellung gibt es keinen
   `.js`-Bezeichner mehr im Arbeitsbereich. `proof:addin` läuft mit ihnen unverändert bei 73
   bestandenen Prüfungen. Das Entfernen berührt `package.json` und gehört über den Orchestrator.

7. **An den documenter: `responses/PayloadTooLarge` ist in der OpenAPI definiert, aber von keiner
   Route benutzt** — obwohl `proof:access` die 413-Antwort misst. Entweder die Antwort gehört an
   die schreibenden Routen, oder der Bestandteil weg. Ich habe ihn stehen lassen, weil das eine
   Entscheidung über die Beschreibung ist und nicht über den Dienst.

8. **An den security-checker: Die OpenAPI-Beschreibung ist jetzt nachgeführt und deckt die neue
   Route mit ab.** Sie liest sich mit `js-yaml` fehlerfrei, kein Verweis zeigt ins Leere.

---

Nächster Schritt:

Der unit-tester bekommt den Zuschnitt aus Punkt 1 — er schließt zugleich die dünnste Stelle: Die
Zweigabdeckung von `packages/storage/src` steht 0,82 Punkte über der Schwelle, und der nächste
Zusatz in dem Paket reißt sie ohne diese Tests. Parallel kann der frontend-dev „Nicht abrechnen"
verdrahten und `toCalendarDay` aus `lib/format.ts` entfernen; beide Aufrufe stehen und sind über
HTTP nachgewiesen.
