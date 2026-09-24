Aufgabe: T-010 — Unit- und Integrationstests für Takt schreiben, vor der Umsetzung

Status: fertig (rot, wie beauftragt)

Artefakte:

Neu unter `packages/*/test/`:

```
packages/domain/test/rounding.test.ts            TP-ROUND-01 bis -16 (30 Fälle)
packages/domain/test/timer.test.ts               TP-TIMER-01, -02, -03 (10 Fälle)
packages/domain/test/export-status.test.ts       TP-EXPST-01 (9 Fälle)
packages/domain/test/export-grouping.test.ts     TP-EXPORT-11..15a, -17 (9 Fälle)
packages/domain/test/tags-and-pools.test.ts      TP-TAG-02, TP-TAG-04, TP-DTAG-04 (12 Fälle)
packages/export/test/base64.test.ts              TP-B64-01..08 (11 Fälle)
packages/export/test/note-merging.test.ts        TP-EXPORT-16, -16a(1-4), -16b, -16c (8 Fälle)
packages/export/test/note-boundary-property.test.ts  TP-NOTE-01, TP-NOTE-02 (Eigenschaftstest, 50 Fälle)
packages/export/test/exportability.test.ts       E-034 (4 Fälle)
packages/export/test/templates.test.ts           TP-TPL-01, -03, -05, -08 + Standardvorlagen-Struktur (12 Fälle)
```

10 Dateien, 1376 Zeilen, 155 Einzelfälle (`it`/`it.each`-Instanzen).

Nicht angefasst: `packages/*/src/**`, `apps/web/src/**`, `apps/local-api/**`, alle Wurzeldateien,
`docs/**`, `.claude/` außer diesem Bericht. Kein `packages/export/package.json` angelegt — der
Ordner `packages/export/test/` existiert jetzt, aber `pnpm ls -r` listet weiterhin nur die
ursprünglichen sechs Arbeitsbereichspakete; `pnpm boundaries` bleibt grün (siehe unten).

---

## Rot vor Grün — der Nachweis

Alle 155 Fälle scheitern an der fehlenden Umsetzung, nicht an sich selbst:

**`packages/domain/test/` (5 Dateien, 70 Einzelfälle, alle individuell ausgeführt und rot):**

```
$ pnpm exec vitest run packages/domain/test/
Test Files  5 failed (5)
     Tests  70 failed (70)
```

Jeder Fehlschlag ist `TypeError: <funktion> is not a function` — der Modulpfad löst auf (die
Typdatei existiert), aber die aufgerufene Laufzeitfunktion gibt es nicht, weil T-009 noch nicht
gelaufen ist. Beispiel (`rounding.test.ts`):

```
FAIL packages/domain/test/rounding.test.ts > ... > 'TP-ROUND-07': ...
TypeError: roundToQuarterHours is not a function
 ❯ packages/domain/test/rounding.test.ts:...
```

**`packages/export/test/` (5 Dateien, statisch 85 Einzelfälle, aber vitest zählt sie nicht
einzeln, weil das Paket komplett fehlt):**

```
$ pnpm exec vitest run packages/export/test/
FAIL packages/export/test/base64.test.ts
Error: Cannot find module '../src/base64.js' imported from .../base64.test.ts
FAIL packages/export/test/note-boundary-property.test.ts
Error: Cannot find module '../src/template.js' imported from .../note-boundary-property.test.ts
FAIL packages/export/test/note-merging.test.ts
Error: Cannot find module '../src/merge-notes.js' imported from .../note-merging.test.ts
Test Files  3 failed (3)   [+ exportability.test.ts, templates.test.ts: identisch]
     Tests  no tests
```

`packages/export` existiert als Paket noch nicht (T-007). Das ist die schärfste Form von "rot":
Vitest kann die 85 Einzelfälle in diesen 5 Dateien nicht einmal zählen, weil das Laden selbst
fehlschlägt — das ist beabsichtigt und keine Aussage über die Qualität der Tests.

**Beleg, dass es kein Testfehler ist:** Jede Datei importiert ausschließlich vorhandene Typen
(`@takt/domain/export`, `../src/kernel.js` etc. — diese lösen auf) und genau eine erwartete, aber
fehlende Laufzeitfunktion. Kein Fehlschlag ist ein Syntaxfehler, eine falsche Assertion oder ein
Tippfehler in einem Importpfad, der auf eine tatsächlich existierende Datei zeigt. Ich habe jede
Datei einzeln laufen lassen, bevor ich zur nächsten überging (siehe Gesprächsverlauf).

---

## R-19 — Abdeckung, tatsächlich geprüft, nicht angenommen

Bericht T-008a-domain-dev nennt es wörtlich als Risiko 1: "Eine leere Abdeckungsmenge erfüllt jede
Schwelle." Ich habe das nachgeprüft, nicht nur zitiert:

```
$ pnpm exec vitest run --coverage --coverage.reportOnFailure=true packages/domain/test/rounding.test.ts
% Coverage report from v8
----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
----------------|---------|----------|---------|---------|-------------------
Statements   : 100% ( 0/0 )
```

**Befund, aktueller Stand:** `packages/domain/src/rounding.ts` (und die übrigen sieben Dateien)
tauchen weiterhin **nicht** in der Tabelle auf — 0 von 0 Zeilen, exakt das von T-008a benannte
Risiko. Grund: Die Dateien enthalten ausschließlich `export type`-Deklarationen, die beim
Übersetzen vollständig entfernt werden; es bleibt kein einziges ausführbares Statement übrig, das
V8 instrumentieren könnte. Mein Import löst zwar auf (die Datei wird geladen), aber ein Modul ohne
jede Laufzeitanweisung ist für den Abdeckungs-Provider unsichtbar. Das ist **kein Fehler meiner
Tests** — es ist der exakte, jetzt handfest reproduzierte Beleg für R-19, und er bleibt bestehen,
bis T-009 tatsächlichen Laufzeitcode in diese Dateien schreibt. Tatsächliche Zeilenzahl je Datei,
zum Vergleich mit dem Stand nach T-009:

| Datei | Zeilen | Enthält (Auszug) |
|---|---|---|
| `packages/domain/src/export.ts` | 348 | `ExportCandidate`, `ExportGroup`, Notiz-Trennung |
| `packages/domain/src/time-entry.ts` | 258 | Exportstatus, Timer-Regel |
| `packages/domain/src/tag.ts` | 205 | Zyklusprüfung, Pools, Standard-Tags |
| `packages/domain/src/todo.ts` | 150 | Todo, TodoNote |
| `packages/domain/src/kernel.ts` | 135 | Branded IDs, `Result`, Fehlerkatalog |
| `packages/domain/src/rounding.ts` | 108 | Rundungsvertrag |
| `packages/domain/src/settings.ts` | 58 | Einstellungen |
| `packages/domain/src/index.ts` | 21 | reiner Re-Export (von Coverage-Konfiguration ausgeschlossen) |
| **Summe** | **1283** | |

**Zweiter, eigener Befund zu R-19, den T-008a noch nicht kennen konnte:** `vitest.config.ts`
setzt `coverage.reportOnFailure` nicht (Vitest-Vorgabe: `false`). Solange **irgendein** Test in
einem Lauf fehlschlägt — was für den gesamten Verlauf von T-009 der Normalfall sein wird, bis
tatsächlich alles grün ist — druckt `pnpm test:coverage` **überhaupt keine Abdeckungstabelle**,
sondern bricht mit Exitcode 1 ab, ohne eine einzige Zeile Abdeckungsinformation auszugeben (siehe
mein Testlauf oben ohne `--coverage.reportOnFailure`: keine Tabelle, nur Testfehler). Das ist eine
andere Form desselben Grundproblems: Eine Schwelle, die während der gesamten Umsetzungsphase gar
nicht erst gemessen wird, ist ebenso blind wie eine Schwelle über eine leere Menge. Empfehlung an
domain-dev/Orchestrator (nicht meine Datei): `coverage.reportOnFailure: true` in
`vitest.config.ts` ergänzen, damit während T-009 nach jedem Teilfortschritt sichtbar wird, welche
Dateien schon Zeilen abdecken, ohne auf den letzten grünen Lauf warten zu müssen.

---

## Befunde für domain-dev / Orchestrator (kein Produktivcode angefasst, nur gemeldet)

1. **E-033 ist in `ExportSourcePath` (`packages/domain/src/export.ts`) noch nicht nachgezogen.**
   Der Typ führt weiterhin `booking.note`, `booking.durationSeconds`, `booking.startedAt`,
   `booking.endedAt` — laut E-033 sollen diese durch `group.*`-Quellen ersetzt (nicht umgedeutet)
   werden, weil eine Exportzeile seit E-020 eine Tagesgruppe meint, keine Einzelbuchung. Meine
   Vorlagen-Tests (`templates.test.ts`, `note-boundary-property.test.ts`, `exportability.test.ts`)
   verwenden übergangsweise `booking.note`/`booking.durationSeconds`, weil das der aktuell
   existierende Typ ist — mit Kommentar an jeder betroffenen Stelle. Sobald T-009 die Umbenennung
   nachzieht, brauchen diese drei Dateien eine einzeilige Anpassung der Quellenkonstanten, sonst
   bleiben sie aus dem falschen Grund rot (Validierungsfehler statt fehlende Umsetzung).

2. **`packages/domain/src/settings.ts` widerspricht E-023.** Der Kommentar dort (Zeilen 17–22)
   beschreibt noch die verworfene Rückkehr-Spalte: *"A-2.5 wird über
   `todo.status_id_before_done` getragen ... Fehlt sie, greift die als Standard markierte Spalte."*
   E-023 (2026-09-01) hat genau das explizit gestrichen: *"`todo.status_id_before_done` entfällt."*
   `time-entry.ts` selbst ist längst korrigiert (`DetermineReopen`-Kommentar sagt richtig: "Es gibt
   keine gemerkte und keine konfigurierte Rückkehr-Spalte"). Nur der veraltete Kommentar in
   `settings.ts` wurde beim Nachziehen von E-023 übersehen. Kein Typfehler, nur ein
   Dokumentationswiderspruch — aber genau die Art Widerspruch, die einen Leser in die falsche
   Richtung schickt. Meine Tests (`timer.test.ts`, `TP-TIMER-01`) folgen der korrekten,
   spaltenunabhängigen Fassung aus `time-entry.ts` und `E-023`.

3. **`apps/local-api` hat bereits ein `package.json` und Quelltext**, obwohl T-008a das noch als
   "kommt erst in T-011" führte. `pnpm typecheck` schlägt dort aktuell mit zwei `TS6133`-Fehlern
   in `src/http/guards.ts` (`EMPTY_THROTTLE`, `ThrottleState` deklariert, nie gelesen) fehl — vor
   meiner Änderung und unabhängig davon, ich habe `apps/local-api` nicht angefasst. Nur als
   Beobachtung gemeldet, da es sonst wie eine Nebenwirkung dieser Aufgabe aussehen könnte.

4. **TP-TIMER-03 ("nur ein Timer gleichzeitig") ist architektonisch nicht eindeutig verortet.**
   Weder `time-entry.ts` noch ein anderes Domänenmodul benennt einen Funktionstyp für "entscheide,
   was beim Timer-Start passiert, wenn schon einer läuft" — nur die Ergebnistypen
   `TimerStartRequest`/`TimerStartResult` existieren. Laut `packages/storage/src/ports.ts`
   (`TimerPort.start`) trägt der SQLite-Adapter selbst die Verantwortung, zusätzlich abgesichert
   durch den eindeutigen Partialindex `ux_time_entry_running` in der Migration. Ich habe den Test
   trotzdem als reine Domänenfunktion `decideTimerStart` geschrieben (klar als Annahme markiert,
   `timer.test.ts` Kopfkommentar) — bestätigt domain-dev stattdessen "nur im Adapter", gehört
   dieser Testfall nach `packages/storage/test/`, nicht hierher.

5. **TP-TAG-01 (vier Ebenen tief anlegen) ist keine reine Domänenfunktion.** Die Tiefe ist laut
   `tag.ts` eine Eigenschaft der Adjazenzliste in `packages/storage` (E-022) — keine Funktion in
   `tag.ts` nimmt "Tiefe" überhaupt entgegen. Ich habe diesen Fall bewusst ausgelassen statt ihn
   künstlich gegen eine reine Funktion zu simulieren; er gehört gegen eine echte SQLite-Verbindung
   in `packages/storage/test/` oder bleibt End-to-End (S-08, TP-TAG-03 deckt ihn dort bereits ab).

6. **Architektur-Beobachtung, keine Korrektur nötig:** `packages/domain/src/export.ts` trägt laut
   Kommentar zu `ExportGroup` bereits die Regel "nur offene Buchungen, nie leer, nach Startzeit
   sortiert" — ich nehme an, dass `groupExportCandidates` (Gruppierung) dort als Laufzeitfunktion
   entsteht, während `mergeBookingNotes`/`renderExportGroup`/`toBase64`/`validateExportTemplateField`
   erst in `packages/export` (T-007) dazukommen, weil `ExportGroup` selbst keinen zusammengeführten
   Notiztext und keinen gerundeten Wert trägt (siehe `packages/storage/migrations/0001_initial.up.sql`,
   `export_run_group`: `seconds`/`quarters` liegen erst dort). Diese Aufteilung ist in jeder
   betroffenen Testdatei als Kommentar festgehalten, damit ein anderer Zuschnitt sofort als
   Namens-/Pfadkorrektur erkennbar ist, nicht als fachlicher Fehler.

---

## Annahmen zur Modulstruktur (vollständige Liste, da nur Typen existieren)

| Datei | Angenommene Laufzeitexporte |
|---|---|
| `packages/domain/src/rounding.ts` | `roundToQuarterHours`, `quarterHoursToExportNumber` |
| `packages/domain/src/time-entry.ts` | `determineReopen`, `checkExportStatusTransition`, `decideTimerStart` (siehe Befund 4) |
| `packages/domain/src/tag.ts` | `checkFolderMove`, `matchesPool`, `isVisibleInPool`, `applyDefaultTags` |
| `packages/domain/src/export.ts` | zusätzlich `groupExportCandidates(candidates): readonly ExportGroup[]` |
| `packages/export/src/base64.ts` (neu, T-007) | `toBase64`, `fromBase64` |
| `packages/export/src/merge-notes.ts` (neu, T-007) | `mergeBookingNotes(notes: readonly string[]): string` |
| `packages/export/src/template.ts` (neu, T-007) | `validateExportTemplateField(field: unknown): Result<...>` |
| `packages/export/src/render.ts` (neu, T-007) | `renderExportGroup(group, fields, context): { kind: 'row', row } \| { kind: 'not_exportable', reason: 'empty_note' }` |

Namensschema: camelCase zur vorhandenen PascalCase-Typbezeichnung (`RoundToQuarterHours` ->
`roundToQuarterHours`), passend zur Umbenennungstabelle in
`.claude/team/reports/T-013-domain-dev.md`. Weicht T-009 hiervon ab, bitte im eigenen Bericht
gegenlesen — ein reiner Namenswechsel lässt die Tests aus dem falschen Grund weiterhin rot.

---

## Pflichtfälle aus dem Auftrag — wo sie stehen

1. **Rundung** — `rounding.test.ts`, volle Tabelle inkl. 16 Minuten -> 0,50 (`TP-ROUND-07`), 61
   Minuten -> 1,25 (`TP-ROUND-13`), umschaltbarer Modus `nearest` (`TP-ROUND-16`).
2. **Notiz-Trennung (R-18)** — `note-boundary-property.test.ts`: Eigenschaftstest über 40
   generiert + 2 fest benannte (Standard, minimal-roh) = 42 Vorlagen, jede Suche zweifach
   (Klartext und `toBase64(Marker)`), plus Gegenprobe, dass der Buchungsmarker tatsächlich
   auftaucht (sonst wäre die Suche trivial grün).
3. **Gemischter Exportstatus** — `export-grouping.test.ts`, `TP-EXPORT-14`.
4. **Zusammenführung Leistungstexte** — `note-merging.test.ts`, `TP-EXPORT-16/-16a/-16b`, inkl.
   Semikolon-im-Text-bleibt-unverändert und "kein Rückparsen".
5. **Leere Tagesgruppe (E-034)** — `exportability.test.ts`.
6. **Exportstatus zweiwertig** — `export-status.test.ts`, vollständige Übergangsmatrix, E-032.
7. **Timer** — `timer.test.ts`, TP-TIMER-01/-02 vollständig, TP-TIMER-03 mit Architektur-Vorbehalt
   (Befund 4).
8. **Tags/Ordner/Pools** — `tags-and-pools.test.ts`, Zyklusprüfung vollständig, Pool-Zugehörigkeit
   vollständig; Tiefe bewusst ausgelassen (Befund 5).
9. **Base64 über UTF-8** — `base64.test.ts`, alle acht Sonderfälle plus Performanz/Alphabet/
   Kollisions-Zusatzchecks.
10. **Standard-Tags** — `tags-and-pools.test.ts`, `TP-DTAG-04`.

---

## Nicht umgesetzt (Lücken, mit Begründung, nicht stillschweigend übersprungen)

- **TP-NOTE-04, TP-TPL-08 (API-Umgehung direkt gegen den Dienst) und alle `TP-SEC-*`
  Integrationsfälle**, die einen laufenden lokalen Dienst voraussetzen (`apps/local-api`): Das
  Paket bekommt gerade erst Quelltext (Befund 3), aber noch keine Route, kein Token-Mittelbau.
  Tests dagegen wären entweder hohl (Modul fehlt komplett) oder träfen zufällig auf fremden,
  gerade entstehenden Code außerhalb meiner Hoheit. `TP-TPL-08` ist stattdessen als
  Validierungstest gegen `validateExportTemplateField` in `templates.test.ts` abgedeckt (die
  "geschlossene Liste"-Garantie selbst, ohne HTTP-Schicht).
- **TP-ADDIN-\*** (Outlook-Add-in): braucht Office.js-Testdouble und `apps/local-api`, beides
  außerhalb des aktuellen Stands. Gehört sinnvollerweise in eine eigene Aufgabe, sobald T-011
  weiter ist.
- **`packages/storage/test/`**: bewusst nicht angelegt. Die Migrations-SQL (`v_export_candidate`,
  eindeutiger Partialindex, `builtin`-Trigger) existiert bereits und funktioniert vermutlich schon
  — ein Test dagegen wäre sofort grün, nicht "rot vor grün" im Sinne dieser Aufgabe, deren Auftrag
  ausdrücklich Tests gegen die von T-009 zu liefernde Fachlogik ist. Empfehlung: eigener,
  nachgelagerter Testauftrag für `packages/storage`, sobald der SQLite-Adapter selbst (nicht nur
  das Schema) ansteht.
- Alle als **End-to-End** geführten Fälle aus `docs/testplan.md` (TP-BASE-\*, TP-KANBAN-\*,
  TP-STATE-\*, die meisten TP-EXPST/-EXPORT/-TPL/-ADDIN mit UI-Schritten) — Hoheit des
  e2e-testers, T-012, nicht dieser Aufgabe.

---

Nächster Schritt:

1. T-009 (domain-dev) implementiert die Funktionen aus der Annahmetabelle oben in
   `packages/domain/src`. Nach jeder Datei sollte `pnpm exec vitest run packages/domain/test/<datei>`
   einzeln laufen — bei acht angenommenen Namen ist ein Namensversatz wahrscheinlicher als ein
   Logikfehler, und der lässt sich sofort unterscheiden ("is not a function" vs. eine tatsächlich
   falsche Zusicherung).
2. T-007 legt `packages/export` als Paket an (package.json, `@takt/domain: workspace:*`, keine
   `@takt/storage`-Abhängigkeit, siehe Wächter in `packages/domain/scripts/check-export-boundary.mjs`)
   und liefert die vier in der Annahmetabelle genannten Dateien.
3. Sobald E-033 in `ExportSourcePath` nachgezogen ist (Befund 1), die drei betroffenen
   `packages/export/test/`-Dateien um die neuen Quellennamen aktualisieren — eine Zeile je Datei.
4. `coverage.reportOnFailure: true` in `vitest.config.ts` erwägen (Befund im R-19-Abschnitt),
   damit T-009 während der Umsetzung tatsächlich Abdeckungsfortschritt sieht statt eines stummen
   Abbruchs.
5. Veralteten Kommentar in `packages/domain/src/settings.ts` (Befund 2) bei Gelegenheit
   korrigieren.
