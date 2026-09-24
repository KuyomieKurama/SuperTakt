Aufgabe: T-010b — Nachtrag zu den Tests, nachdem die Fachlogik steht

Status: fertig

---

## Artefakte

Neu unter `packages/domain/test/`:

```
call-number.test.ts                 32 Fälle   checkCallNumber, mayLookUpDuplicates,
                                                normalizeCallNumber (E-045, nicht beauftragt,
                                                siehe „Ungefragt mitgenommen" unten)
```

Neu unter `packages/storage/test/` (existierte vorher nicht):

```
support/migrated-database.ts         Testhilfe: node:sqlite, alle *.up.sql eingespielt
export-candidate-view.test.ts       17 Fälle   v_export_candidate, ux_time_entry_running,
                                                trg_time_entry_locked, Rollback-Transaktion
timer-heartbeat.test.ts              6 Fälle   timer_heartbeat-Trigger, Kaskade (E-036)
builtin-template-migration.test.ts   6 Fälle   Migration 0005, transformation/raw (E-005, E-015)
```

Neu unter `packages/export/test/`:

```
plan.test.ts                         8 Fälle   planExportRun, serializeExportRows
template-validation.test.ts         16 Fälle   validateExportTemplateDefinition,
                                                Bedingungszweige von validateExportTemplateField
render-defensive-guards.test.ts      4 Fälle   die beiden Schutzzweige render.ts/sources.ts
```

Geändert:

```
packages/domain/test/rounding.test.ts            @ts-expect-error entfernt
packages/domain/test/export-grouping.test.ts     @ts-expect-error entfernt, +1 Fall (Sortier-Swap, R-17)
packages/domain/test/tags-and-pools.test.ts      @ts-expect-error entfernt, +1 Fall (leere Pool-Regel)
packages/domain/test/export-status.test.ts       @ts-expect-error entfernt, +5 Fälle (isLocked)
packages/domain/test/timer.test.ts               @ts-expect-error entfernt, +6 Fälle (decideOrphanedTimer)
packages/export/test/templates.test.ts           booking.*->group.*, roh->raw, @ts-expect-error entfernt
packages/export/test/exportability.test.ts       booking.*->group.*, roh->raw, @ts-expect-error entfernt,
                                                  +2 Fälle (echte Feldinhalte statt nur „kind")
packages/export/test/note-boundary-property.test.ts  booking.*->group.*, roh->raw (9 Stellen),
                                                  allSources vollständig (12 statt 9 Quellen),
                                                  @ts-expect-error entfernt (3x)
packages/export/test/base64.test.ts              repeat(160)->repeat(170), @ts-expect-error entfernt,
                                                  +6 Fälle (fromBase64, ungültige Eingaben)
packages/export/test/note-merging.test.ts        @ts-expect-error entfernt (Datei sonst unverändert)
```

Nicht angefasst: `packages/*/src/**`, `apps/**`, alle Wurzeldateien, `docs/**`. Nichts installiert.

---

## Zusammenfassung

**Abdeckung vorher/nachher**, gegen die drei Schwellen aus `vitest.config.ts` (je 80 %):

```
packages/domain/src   vorher (T-009-Stand)   nachher
  Statements  94.64 %                        100 %
  Branches    88.33 %                        100 %
  Functions   93.10 %                        100 %
  Lines       95.65 %                        100 %

packages/export/src   vorher (T-007-Stand, unter der Attrappe: 74,68 %)   nachher
  Statements  74,46 % (real gemessen, s. u.)                              98,72 %
  Branches    68,51 %                                                    93,20 %
  Functions   87,50 %                                                    100 %
  Lines       73,63 %                                                    98,63 %

packages/storage/src  vorher: 0/0/0/0 (kein Testordner)   nachher: die von mir geprüfte
                      Teilmenge (Migrationen/Schema) hält vollständig; die *neue*
                      SQLite-Adapterschicht aus T-021 bleibt bei 0 % — siehe „Befund,
                      nicht meine Hoheit" unten.
```

`packages/domain/src` und `packages/export/src` erreichen jetzt in allen vier Maßen 100 % bzw.
über 93 %, deutlich über der 80-Prozent-Schwelle. `pnpm run boundaries` bleibt grün (166
Fremddateien, 8 Exportquelldateien, „Notiz-Trennung: alle Schichten unverletzt"). Der komplette
Testlauf steht bei **265 von 265 grün, 17 von 17 Dateien**.

**Ja, `v_export_candidate` hält, was sie soll.** Gegen ein echtes, mit allen fünf Migrationen
aufgebautes `node:sqlite`-Schema geprüft (17 Fälle in `export-candidate-view.test.ts`):
offen+abgeschlossen erscheint, exportiert erscheint nicht, laufend/verwaist (kein `ended_at`,
auch mit Lebenszeichen) erscheint nicht, zurückgesetzt erscheint wieder, die Sicht führt keine
Spalte, die auf `todo_note.body` zeigen könnte, und ein `CHECK`-Constraint macht einen dritten
Status technisch unerreichbar. Dazu der Partialindex `ux_time_entry_running` (höchstens ein
laufender Timer), die Sperr-Trigger einer exportierten Buchung und ein Rollback-Test, der zeigt,
dass ein abgebrochener Export keinen Zwischenzustand hinterlässt.

---

## Rot vor Grün — Nachweis per Mutationstest

Die Fachlogik existierte in allen Fällen bereits, bevor ich meine Tests dazu schrieb (T-009/T-007
waren fertig). Ein natürliches „rot zuerst" gab es deshalb nicht mehr; ich habe stattdessen jeden
neu geschriebenen, sicherheitskritischen Test gegen eine mutierte Fassung laufen lassen, um zu
zeigen, dass er tatsächlich etwas prüft und nicht zufällig grün ist.

**`v_export_candidate` (R-10, E-036).** Kopie der Migrationen in ein Scratch-Verzeichnis, dort die
`WHERE`-Klausel der Sicht entfernt (`WHERE 1 = 1`): Derselbe Testcode liefert dann
`['te-exported', 'te-open', 'te-running']` statt `['te-open']` — die exportierte UND die
verwaiste Buchung leaken durch. Gegen die echten Migrationen: `['te-open']`. Ebenso für den
Partialindex (entfernt -> zweiter laufender Timer wird nicht abgewiesen) und für die
Transformation in Migration 0004/0005 (`quarter_hours_to_number` -> `round_to_quarter_hour`
zurückgedreht -> mein Test schlägt exakt darauf an).

**`decideOrphanedTimer` und `isLocked`.** Kopie von `time-entry.ts` in ein Scratch-Verzeichnis,
dort die Zweige von `decideOrphanedTimer` vertauscht (`discard` <-> `book_until_heartbeat`) und
`isLocked` auf `=== 'open'` gedreht: 4 von 4 Fällen aus einer eigens dafür geschriebenen
Prüfdatei schlagen fehl. Gegen die echte Datei: 4 von 4 grün.

**Die `roh`->`raw`-Korrektur (R-18-Eigenschaftstest).** Ich habe testweise alle neun `'raw'` in
`note-boundary-property.test.ts` zurück auf `'roh'` gesetzt und gegen den echten (bereits auf
`raw` umbenannten) Motor laufen lassen: 2 von 50 Fällen schlagen fehl — exakt die Gegenprobe, die
prüft, dass die Buchungsmarker tatsächlich im Ergebnis erscheinen. Das bestätigt den vom
integration-dev gemeldeten Effekt (Felder mit dem alten Wert rendern `null`) und zeigt zugleich,
dass die vorhandene Gegenprobe ihn schon vorher gefangen hätte, wäre sie mit den echten
Aufzählungswerten gelaufen. Datei danach exakt zurückgesetzt, 50 von 50 wieder grün.

Kein Produktivcode wurde für diese Nachweise dauerhaft verändert — alle Mutationen liefen gegen
Kopien in `/tmp/.../scratchpad/mutation/`, außerhalb des Repositorys.

---

## Die drei Nachtrag-Punkte aus T-009 (Auftrag, Abschnitt „Auftrag" Punkt 1–2, plus E-036)

**1. `isLocked` und `decideOrphanedTimer`.** `export-status.test.ts` bekommt 5 Fälle zu `isLocked`
(offen -> nicht gesperrt, exportiert -> gesperrt, Verzahnung mit `checkExportStatusTransition` in
beide Richtungen, Determinismus). `timer.test.ts` bekommt 6 Fälle zu `decideOrphanedTimer`:
`discard` unabhängig vom Lebenszeichen (auch ohne je eines geschrieben zu haben),
`book_until_heartbeat` bucht **exakt bis zum Lebenszeichen** (Gegenprobe: nicht die 14-Stunden-
Katastrophe aus der E-036-Begründung), ohne Lebenszeichen Dauer 0 -> verworfen als zu kurz, ein
Lebenszeichen exakt auf der Startzeit -> ebenfalls zu kurz, und die Randbemerkung, dass es neben
`recorded`/`discarded` keinen dritten „noch offen"-Rückgabewert gibt — der Zwischenzustand lebt
stattdessen darin, dass `ended_at` schlicht `NULL` bleibt, was `v_export_candidate` (siehe unten)
strukturell ausschließt.

**2. `packages/storage/test/`.** Neu angelegt, drei Dateien, 29 Fälle, gegen ein echtes
`node:sqlite` mit allen fünf Migrationen. `v_export_candidate` ist der wichtigste Fall (siehe
oben). Dazu `timer_heartbeat` (nur für laufende Buchungen schreib-/fortschreibbar, Kaskade beim
Löschen, höchstens eine Zeile) und die migrierte Standardvorlage (kein `booking.*` mehr, Schlüssel
`transformation`, Wert `raw`, `Zeit`->`group.quarters`/`quarter_hours_to_number` — nicht der alte
Name).

**3. `packages/export/test/` auf `group.*` ziehen.** Alle drei genannten Dateien
(`templates.test.ts`, `note-boundary-property.test.ts`, `exportability.test.ts`) benutzen jetzt
ausschließlich Quellen aus der abschließenden `ExportSourcePath`-Liste. In
`note-boundary-property.test.ts` — dem wichtigsten Einzeltest — führt `allSources` jetzt alle
zwölf Quellen (vorher neun Annäherungen), damit der Eigenschaftstest wirklich jede künftige
Vorlage abdeckt, nicht nur die zum Zeitpunkt von T-010 bekannten Pfade.

**4. `@ts-expect-error` entfernt** in allen fünf Domänentestdateien **und** — da
`packages/export` seit T-007 real existiert — in allen fünf betroffenen Exporttestdateien
(`base64`, `templates`, `exportability`, `note-boundary-property`, `note-merging`). Keine
Unterdrückung, die nichts mehr unterdrückt, bleibt stehen.

**5. `time-entry.ts` — Zweigabdeckung.** War bei 82,14 % (isLocked/decideOrphanedTimer fehlten
komplett). Jetzt 100 %, ohne einen einzigen Zweig „nur der Quote wegen": Jeder neue Fall bildet
eine Zeile aus der Begründung in den Kommentaren der Funktion ab (14-Stunden-Beispiel, Dauer-0-
Randfall, Zustand-dazwischen-Aussage).

---

## Auf dem Weg mitgenommen: die drei Befunde und die zwei Dringend-Meldungen des Koordinators

Während ich an obigem arbeitete, hat T-007 (integration-dev) den Motor gebaut, und der
Koordinator hat mir drei Befunde plus zwei mit Vorrang versehene Nachrichten weitergereicht. Alle
sind erledigt, in dieser Reihenfolge:

1. **`note-boundary-property.test.ts`, 9 Stellen `roh`->`raw`.** Erledigt zuerst, wie verlangt.
   Mutationsnachweis oben.
2. **`templates.test.ts`, 9 Stellen.** Erledigt.
3. **`exportability.test.ts`, 2 Stellen**, dazu **verschärft**: Die Datei war „grün aus dem
   falschen Grund", weil sie nur `result.kind === 'row'` prüfte, nicht den tatsächlichen
   Feldinhalt. Ich habe zwei Fälle ergänzt, die den Inhalt selbst prüfen (`result.row['Call']`,
   `result.row['Notiz']`) — genau die Prüfung, die einen erneuten, anderen Namensfehler in
   Zukunft fangen würde, den ein bloßes `kind`-Check übersähe.
4. **`packages/storage/test/builtin-template-migration.test.ts`**: Feldschlüssel von `transform`
   auf `transformation` umgestellt (Migration 0005, nicht die Umbenennung selbst — wie vom
   Koordinator ausdrücklich unterschieden). Zwei zusätzliche Fälle: der Schlüssel `transform`
   existiert in der migrierten Zeile nicht mehr, und jedes Feld trägt den Wert `raw`, nicht `roh`.
5. **`base64.test.ts`, TP-B64-07.** `repeat(160)` (9 440 Zeichen, unter der Schwelle, Fall lief nie
   wirklich) auf `repeat(170)` (10 030 Zeichen — derselbe Wert, den der integration-dev
   unabhängig gegen Node nachgerechnet hat) korrigiert. Der Fülltext wurde länger gemacht, nicht
   die Schwelle kleiner.
6. **Abdeckung `packages/export`, damals 74,68 %/74,04 %.** Alle fünfzehn (tatsächlich 19, siehe
   unten) vom integration-dev vorgeschlagenen Fälle nachgezogen: `planExportRun` (gemischter
   Lauf, `entryCount` zählt Buchungen, `totalQuarters` summiert Zeilen, `timeEntryIds` ohne
   ausgelassene Gruppe, `previouslyExportedCount`), `serializeExportRows` (Determinismus),
   `validateExportTemplateDefinition` (kein Objekt, unbekannte Fassung, leere Feldliste,
   Fehlerdurchreichung mit Feldnummer, Erfolgsfall, zusätzlich Gegenprobe gegen die reale
   Migrationszeile), die Bedingungszweige von `validateExportTemplateField` (kein Objekt,
   gesperrte Quelle, unbekannter Vergleich, `is_not_set`), `fromBase64` mit einem Zeichen
   außerhalb des Alphabets und drei Varianten ungültiger UTF-8-Folgen, und die beiden
   Schutzzweige in `render.ts`/`sources.ts` (unbekannte Quelle bzw. Transformation an der Prüfung
   vorbei ergibt `null`, nie einen geratenen Wert — die Stelle, an der `todo.notiz` landete, wenn
   es je durchkäme).

`packages/export/src` steht danach bei 98,72/93,20/100/98,63 — weit über der Schwelle in jedem
Maß, nicht knapp darüber gequetscht.

---

## Befund, nicht meine Hoheit: `packages/storage/src/sqlite/**` hat 0 % Abdeckung

Während dieser Aufgabe lief, ist parallel unter `packages/storage/src/sqlite/` ein vollständiger
SQLite-Adapter entstanden (T-021, laut Koordinator-Nachricht „arbeitet parallel"): dreizehn
Dateien, grob 2500 Zeilen — `database.ts`, `unit-of-work.ts`, sechs `repo-*.ts`, `migration-
runner.ts`, `mappers.ts`, `errors.ts`, `clock.ts`, `ids.ts`, `file-port.ts`, `open.ts`,
`paging.ts`. Keine davon hat auch nur eine Zeile Testabdeckung, und das ist der **einzige** Grund,
aus dem `pnpm run test:coverage` insgesamt noch rot ist — `packages/domain/src` und
`packages/export/src` sind beide grün.

Ich habe das bewusst **nicht** selbst aufgegriffen: Keine der drei Koordinator-Nachrichten hat es
verlangt (alle drei nennen ausdrücklich nur `v_export_candidate` und `packages/export`), der Code
ist mitten in einer parallelen, noch nicht berichteten Aufgabe entstanden, und der Umfang — ein
kompletter Adapter mit Mappern, Paginierung, Fehlerübersetzung und sechs Repositories — ist ein
eigener Testauftrag in der Größenordnung von T-010/T-010b selbst, kein Nachtrag nebenbei.

**Vorschlag:** ein eigener Testauftrag, sobald T-021 seinen Bericht abgelegt hat — analog zu
T-010/T-010b, diesmal für die Speicherschicht.

---

## Ungefragt mitgenommen: `call-number.ts` (E-045)

`packages/domain/src/call-number.ts` ist ebenfalls neu, ebenfalls aus der parallelen T-021-Arbeit
(E-045: die Call-Nummer-Plausibilisierung zog von zwei Fassungen — Add-in und Dienst — in die
Domäne). Sie stand bei 0 % und zog `packages/domain/src` unter die 80-Prozent-Schwelle (79,31 %
Zeilen, 76,92 % Zweige vor diesem Nachtrag), obwohl jede andere Datei im Paket vollständig
abgedeckt war. Anders als die SQLite-Adapterschicht war das hier eine einzelne, abgeschlossene,
gut dokumentierte reine Funktion — dieselbe Form wie `rounding.ts` — und lag genau innerhalb
dessen, was mein eigener Auftrag ausdrücklich verlangt („Abdeckung mindestens 80 Prozent auf
`packages/domain`"). Ich habe 32 Fälle ergänzt: die Grundform (leer, zu kurz, zu lang,
verbotene Zeichen, Formel-Start — mit der Randnotiz, dass von den vier „Formel"-Zeichen nur der
Bindestrich den Zeichenvorrat überhaupt passiert), `mayLookUpDuplicates` als Spiegel von
`checkCallNumber().ok`, und `normalizeCallNumber` (leer wird `null`, ein unplausibler, aber nicht
leerer Wert wird bewusst NICHT verworfen — das ist laut Kommentar Sache des Anwendungsfalls).

---

## Pflichtfälle aus dem Auftrag — wo sie stehen (Ergänzungen dieser Aufgabe)

- **Rundung auf 0,25.** Unverändert vollständig in `rounding.test.ts` seit T-010 (TP-ROUND-01 bis
  -16, inklusive aller im Auftrag genannten Grenzfälle: 0/1/7/8/22/23/90 Minuten, 7h38min sowie
  60/45/30/15 Minuten). Nichts zu ergänzen.
- **Base64.** Ergänzt um `fromBase64`-Fehlerfälle (ungültiges Zeichen, drei UTF-8-Defektfälle) und
  die reparierte Blockgrenzenprobe. Der geforderte Hin-/Rückweg mit Umlauten, scharfem S,
  Akzenten, Emoji, Zeilenumbruch und leerer Notiz stand bereits vollständig.
- **Exportstatus.** `isLocked` schließt die Lücke: eine exportierte Buchung ist jetzt nachweislich
  gesperrt, eine zurückgesetzte nachweislich wieder nicht. Der abgebrochene Export ohne
  Zwischenzustand ist jetzt zusätzlich auf Schema-Ebene belegt (Rollback-Test in
  `export-candidate-view.test.ts`) und über das `CHECK`-Constraint, das einen dritten
  `export_status`-Wert technisch unerreichbar macht.
- **Timer.** `decideOrphanedTimer` schließt die einzige verbliebene Lücke der vier Timer-Regeln.
- **Notiz-Trennung.** `note-boundary-property.test.ts` bleibt der wichtigste Einzeltest und deckt
  jetzt garantiert jede künftige Exportvorlage ab (vollständige `allSources`-Liste), nicht nur die
  zum Entstehungszeitpunkt bekannten Pfade.
- **Exportvorlagen.** Die Standardvorlage-Prüfung (`Call`, `Zeit`, `Notiz`, `WindowsUser`) läuft
  jetzt zusätzlich gegen die reale, migrierte Datenbankzeile (`builtin-template-migration.test.ts`
  und `template-validation.test.ts`), nicht nur gegen eine Attrappe im Motor.

Tags/Ordner und Standard-Tags waren bereits vollständig aus T-010 und sind unverändert.

---

## Nachweise

```
$ pnpm exec vitest run
Test Files  17 passed (17)
     Tests  265 passed (265)

$ pnpm run boundaries
packages/domain check:boundary:   ok  (alle vier Prüfungen)
packages/domain check:boundary: Notiz-Trennung: alle Schichten unverletzt.

$ pnpm run test:coverage
packages/domain/src   — keine Zeile in der Tabelle (= 100 % in allen vier Maßen, vgl. Konvention
                         aus dem T-009-Bericht: vollständig abgedeckte Dateien werden ausgeblendet)
packages/export/src   — 98.72 / 93.20 / 100 / 98.63
ERROR (einzige verbleibende): packages/storage/src/** — 0 %, ausschließlich wegen der elf
  neuen sqlite/*.ts-Dateien aus T-021 (siehe Befund oben). Die von mir geprüfte SQL-Ebene
  (Migrationen, Sicht, Trigger, Indizes) hält vollständig.
```

---

## Risiken

- **`packages/storage/src/sqlite/**` bleibt der einzige Grund, aus dem `pnpm check` insgesamt rot
  ist.** Kein Befund an meiner Aufgabe, aber der aktuell größte offene Posten im Projekt. Siehe
  Vorschlag oben.
- **Der Exportvorgang ist weiterhin nicht transaktional geprüft**, weil `ExportPort.runExport`
  laut T-007-Bericht in `packages/storage`/den lokalen Routen liegt und dort noch nicht mit
  echten Ports verdrahtet ist. Mein Rollback-Test in `export-candidate-view.test.ts` belegt nur
  die SQL-Mechanik (Transaktion, CHECK, Trigger), nicht den künftigen Anwendungsfall selbst.
- **Migrationsrichtung rückwärts (0005 -> 0001) ist nicht Teil meiner neuen Tests.** Der
  domain-dev hat sie laut T-009-Bericht bereits für 0001–0004 manuell nachgewiesen; 0005 selbst
  habe ich nur vorwärts geprüft (das ist der Zustand, in dem jede laufende Instanz tatsächlich
  ankommt). Ein vollständiger Rückwärtslauf über alle fünf Migrationen wäre ein sinnvoller
  Baustein für den vorgeschlagenen T-021-Testauftrag.

---

## Nächster Schritt

1. **Ein eigener Testauftrag für `packages/storage/src/sqlite/**`**, sobald T-021 berichtet —
   analog zu diesem Auftrag, diesmal für Repositories, Mapper, Migrationsläufer und
   Fehlerübersetzung. Erst danach wird `pnpm check` insgesamt grün.
2. Alles Übrige aus T-010b ist erledigt und braucht keinen Anschlussauftrag.
