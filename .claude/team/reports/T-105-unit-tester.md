# T-105 — Einheitentests für Welle E

**Aufgabe:** T-105 — Einheitentests für Welle E
**Rolle:** unit-tester
**Stand:** Zweig `status-als-regelterm`, Ausgangspunkt `4d1da1c`, unkommittiert
**Status:** fertig

---

## Artefakte

### Neu

| Datei | Fälle | Was |
|---|---|---|
| `apps/web/test/lib/movement.ts` erhielt `apps/web/test/lib/movement.test.ts` | 15 | `movementSentence`, `doneMovementSentence`, `bookingSentence`, `withMovement` — geprüft gegen die echte `poolMovementSentence`, nicht gegen einen hartkodierten Satz |
| `apps/local-api/test/usecases/pool-movement-states.test.ts` | 12 | `bookingMovementStates`, `closedEntryMovementStates`, `completionMovementStates` als reine Funktionen, inklusive der Gegenprobe aus T-101 Annahme 1 |
| `apps/local-api/test/usecases/todo-done-movement.test.ts` | 5 | `markTodoDone`/`clearTodoDone` (die private `switchTodoDone`) gegen eine Attrappe von `AppContext`/`UnitOfWork`: Bewegung bei Setzen/Aufheben, `null` bei unverändertem Kennzeichen, keine Regelauflösung beim zweiten Aufruf |
| `apps/local-api/test/usecases/timer-orphan-resolution.test.ts` | 4 | O-R: `resolveOrphanedTimer` reicht `orphan_discarded`/`timer_too_short` durch, `stopTimer` bleibt bei `timer_too_short` |
| `apps/local-api/test/http/input.test.ts` | 22 | H-2: `titleSchema`/`nameSchema` an den exakten Rändern der vier verbotenen Bereiche (C0, C1, zwei Bidi-Bereiche), Umlaute/Emoji/Leerzeichen innen erlaubt, feste Fehlermeldung ohne den abgewiesenen Wert |

### Erweitert

| Datei | Neue Fälle | Was |
|---|---|---|
| `packages/domain/test/timer.test.ts` | 4 | `BOOKING_EFFECT`/`ENTRY_CLOSED_EFFECT`: eingefroren, genau zwei bzw. eine Achse, `BOOKING_EFFECT` baut sich aus `ENTRY_CLOSED_EFFECT` auf |
| `packages/storage/test/mappers.test.ts` | 7 | `poolReference`, `poolReferences`/`RULE_REFERENCE_LIMIT`/`RULE_REFERENCE_PROBE`: leere Liste, 5, genau 20 (keine Kürzung), 21 und 22 Zeilen (Kürzung auf die ersten 20 mit Hinweistext) |
| `packages/storage/test/repo-tags.test.ts` | 2 neu + 1 erweitert | `TagPort.remove` liefert `details` mit Regelnamen (bislang fehlte diese Prüfung als einziger der drei Löschrouten); mehrere Regeln; H-3-Obergrenze end-to-end gegen eine echte SQLite-Verbindung (21 Regeln → 20 genannt, Hinweistext) |
| `packages/storage/test/migration-runner.test.ts` | 3 | H-4: `legacy_alter_table` wird auch im Fehlerpfad (Migration scheitert, NACHDEM sie das Pragma eingeschaltet hat) im `finally` zurückgesetzt; Gegenprobe mit erfolgreicher Migration; Gegenprobe mit einer Migration, die das Pragma nie anfasst |

Nichts außerhalb von `packages/*/test/**` und `apps/*/test/**` angefasst. 74 neue Prüffälle insgesamt (684 → 758).

---

## Zusammenfassung

Alle sechs im Auftrag genannten Bereiche sind abgedeckt: der Bewegungssatz-Zuordner in `apps/web`, die drei Zustandspaar-Funktionen und `switchTodoDone` in `usecases/pool-movement.ts`/`todos.ts` samt der Gegenprobe aus T-101 Annahme 1, `BOOKING_EFFECT`/`ENTRY_CLOSED_EFFECT` in der Domäne, das Durchreichen von `orphan_discarded` gegenüber `timer_too_short`, die Grenzwerte von H-2 (Steuer-/Bidi-Zeichen) und H-3 (Obergrenze der genannten Regeln) sowie der Fehlerpfad von `legacy_alter_table`. Für `markTodoDone`/`clearTodoDone`, `resolveOrphanedTimer` und `stopTimer` — private bzw. bislang ungetestete Anwendungsfälle — wurde eine leichte Attrappe für `AppContext`/`UnitOfWork` gebaut (nur die tatsächlich gelesenen Ports, Rest weggelassen und mit Cast versehen, in derselben Bauart wie `fakePools` in `pool-movement.test.ts`). Rot-vor-grün ist für jede der neun Dateien belegt — nicht über eine Mutation von `src` (Auflage aus T-100), sondern über eine bewusst falsche Erwartung, die zuerst fehlschlägt und danach auf den richtigen Wert korrigiert wird; alle neun Gegenproben stehen unten mit Kommando und Ausschnitt. `pnpm run typecheck` (inklusive `typecheck:test`), `pnpm run test` und `pnpm run test:coverage` laufen mit Exitcode 0.

---

## Rotnachweis (neun Gegenproben, keine Mutation von `src`)

T-100 hat für diese Welle die Auflage hinterlassen, keinen Rotnachweis über eine kurzzeitige Mutation von `src`-Dateien zu führen, weil andere Agenten (`integration-dev` an `routes/addin/**`, `e2e-tester` an `tests/e2e/**`) parallel lesen. Ich habe die Auflage eingehalten und stattdessen bei jeder neuen oder erweiterten Datei mindestens eine Erwartung testweise auf einen falschen, aber plausiblen Wert gesetzt, den Fehlschlag mit `pnpm exec vitest run <datei>` gemessen, und die Erwartung danach auf den richtigen Wert zurückgesetzt (erneut grün gemessen). `src/` blieb während der gesamten Aufgabe unverändert (`git status --porcelain` zeigt außerhalb von `packages/*/test/**`, `apps/*/test/**` und meinem Bericht keine Änderung von mir).

| Datei | Geprüfte Erwartung | Rot | Grün |
|---|---|---|---|
| `apps/web/test/lib/movement.test.ts` | `withMovement("Erledigt.", null)` soll `"Erledigt. "` (Leerzeichen am Ende) statt `"Erledigt."` sein | 1 Fall rot | 15/15 |
| `packages/domain/test/timer.test.ts` | `Object.keys(BOOKING_EFFECT).sort()` soll `['completedAt']` statt `['completedAt','hasOpenEntries']` sein | 1 Fall rot | 20/20 |
| `apps/local-api/test/usecases/pool-movement-states.test.ts` | Gegenprobe: `bookingMovementStates` soll bei einem während des Timers erledigt gesetzten Todo `after.completedAt === DONE_AT` liefern (die falsche Annahme) statt `null` | 1 Fall rot | 12/12 |
| `apps/local-api/test/usecases/todo-done-movement.test.ts` | nach zwei `markTodoDone`-Aufrufen soll die Attrappe zweimal `list('all')` aufgerufen haben (`['all','all']`) statt einmal | 1 Fall rot | 5/5 |
| `apps/local-api/test/usecases/timer-orphan-resolution.test.ts` | `resolution: 'discard'` soll `reason: 'timer_too_short'` liefern statt `'orphan_discarded'` — genau der Fehler, den T-101 behoben hat | 1 Fall rot | 4/4 |
| `apps/local-api/test/http/input.test.ts` | `U+2069` (letztes Bidi-Zeichen im zweiten Bereich) soll erlaubt sein (`success: true`) statt abgewiesen | 1 Fall rot | 22/22 |
| `packages/storage/test/mappers.test.ts` | `poolReferences` mit 21 Zeilen soll 21 `details` liefern statt 20 | 1 Fall rot | 34/34 |
| `packages/storage/test/repo-tags.test.ts` | `TagPort.remove` mit 21 Regeln (echte SQLite-Verbindung) soll 21 `details` liefern statt 20 | 1 Fall rot | 34/34 |
| `packages/storage/test/migration-runner.test.ts` | nach einer Migration, die NACH `PRAGMA legacy_alter_table = ON` scheitert, soll das Pragma auf `1` (an) stehen statt `0` (aus) | 1 Fall rot | 20/20 |

Ein Ausschnitt, stellvertretend für alle neun (die verwaiste Buchung, weil sie die von T-101 tatsächlich behobene Regression zeigt):

```
$ pnpm exec vitest run apps/local-api/test/usecases/timer-orphan-resolution.test.ts
 ❯ … resolution: "discard" -> reason: "orphan_discarded" … 7ms
AssertionError: expected { kind: 'discarded', …(2) } to deeply equal { kind: 'discarded', …(2) }
-   "reason": "timer_too_short",
+   "reason": "orphan_discarded",
 Tests  1 failed | 3 passed (4)

# nach Rückstellung der Erwartung auf 'orphan_discarded':
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

---

## Nachweis

| Lauf | Exitcode | Ergebnis |
|---|---|---|
| `pnpm run typecheck` (inklusive `typecheck:test`, sechs Testkonfigurationen) | **0** | acht Pakete + sechs Testkonfigurationen |
| `pnpm run test` | **0** | 50 Testdateien, **758 Prüfungen** (684 → 758, +74) |
| `pnpm run test:coverage` | **0** | Zweigabdeckung gesamt 84,51 % — **hält, fällt nicht** (siehe Vorher/Nachher-Messung unten) |

**Vorher/Nachher exakt gemessen, nicht geschätzt.** Weil parallel andere Agenten (integration-dev, e2e-tester) `src`-Dateien ändern, wäre ein Vergleich mit einer älteren Zahl aus einem Bericht ungenau. Ich habe deshalb meine neun Testdateien per `git stash` kurz beiseitegelegt, `pnpm run test:coverage` gegen genau den Stand gefahren, den die anderen beiden Agenten gerade bearbeiten, und die Dateien danach mit `git stash pop` unverändert zurückgeholt (`pnpm run test`/`typecheck` danach erneut grün, 758/758, Exitcode 0 — siehe Kommandos oben, keine Datei blieb verändert zurück):

| | Zweige gesamt | `domain/src` | `export/src` | `storage/src/sqlite` |
|---|---|---|---|---|
| ohne meine neun Dateien | 84,25 % | 87,50 % | 92,26 % | 81,71 % |
| mit meinen neun Dateien | **84,51 %** | **88,42 %** | 92,26 % | **81,84 %** |

Alle vier Werte steigen oder bleiben gleich, keiner fällt. `packages/export/src` ist unverändert, weil T-105 dort keine Datei anfasst. Alle drei geforderten Flächen liegen über der 80-%-Schwelle aus dem Qualitätstor.

`pnpm run proof:all`/`pnpm test:e2e` habe ich nicht laufen lassen — sie binden Port 17843/17844, integration-dev und e2e-tester haben in dieser Welle Vorrang darauf, und die Aufgabe verlangt sie nicht unter „Nachweis". Kein Prozess wurde von mir beendet, keiner blockierte meine Läufe (Vitest bindet keinen Port).

---

## Annahmen

**1. `switchTodoDone` wird ausschließlich über `markTodoDone`/`clearTodoDone` geprüft, nie direkt.** Die Funktion ist nicht exportiert (Absicht des domain-dev, siehe `usecases/todos.ts`). Ein Test, der sie umginge, prüfte etwas, das kein Aufrufer je aufruft — die Route tut es genauso wenig wie ich.

**2. Attrappe statt echter Datenbank für `markTodoDone`/`clearTodoDone`/`resolveOrphanedTimer`/`stopTimer`.** `AppContext.transactions.inTransaction` ist eine Funktion, die einen `UnitOfWork` entgegennimmt; meine Attrappe liefert nur die Ports, die der jeweilige Anwendungsfall laut Quelltext tatsächlich liest (`todos`+`timeEntries`+`pools` bzw. `heartbeat`+`timer`), mit einem Cast auf `UnitOfWork`/`AppContext` an der Stelle, wo er nötig ist — nicht am ganzen Objekt. Das ist dieselbe Bauart wie `fakePools` in `apps/local-api/test/usecases/pool-movement.test.ts`, nur eine Ebene höher (ganzer `AppContext` statt nur `PoolPort`-Ausschnitt). Eine echte In-Memory-SQLite-Datenbank (`openDatabase({location: ':memory:'})` + `migrateToLatest()`) wäre möglich gewesen, hätte aber Seeding über mehrere Repositories gebraucht, um exakt dasselbe Zustandspaar zu erzeugen, das die Attrappe direkt vorgibt — für eine Prüfung der **Verdrahtung** (ruft die richtige Funktion mit den richtigen Werten?) ist die Attrappe die genauere Prüfung, nicht die schwächere.

**3. Für `resolveOrphanedTimer`s `discarded`-Zweige braucht es nur `heartbeat.orphaned()` und `timer.stop()`.** Nachgelesen im Quelltext: `presenceBeforeBooking`/`poolMovementNamer` stehen dort hinter der `if (decision.kind === 'discarded') return …`-Zeile und werden in diesem Zweig nie erreicht. Eine Attrappe, die trotzdem `timeEntries`/`todos`/`pools` mitschleppt, prüfte nichts zusätzlich und würde nur verschleiern, welche Ports der geprüfte Zweig wirklich braucht.

**4. `TagPort.remove` mit 21 Regeln ist ein Test gegen die ECHTE SQLite-Verbindung, nicht gegen eine Attrappe** (`packages/storage/test/repo-tags.test.ts`, mit `openTestDatabase()`), während dieselbe Grenze in `mappers.test.ts` zusätzlich rein (ohne Datenbank) geprüft wird. Beide zusammen: `mappers.test.ts` beweist, dass `poolReferences` selbst korrekt kürzt; `repo-tags.test.ts` beweist, dass die SQL-Abfrage tatsächlich mit `LIMIT RULE_REFERENCE_PROBE` (21) arbeitet und nicht etwa mit einem anderen Wert, der zufällig zum selben Ergebnis der reinen Funktion führt.

**5. Grenzwerte bei H-2 exakt an den Rändern, nicht in der Mitte der Bereiche.** Wie bei der geforderten Rundungstabelle „Grenzfälle, die wehtun" prüft `input.test.ts` je Bereich das letzte abgewiesene und das erste wieder erlaubte Zeichen (`U+001F`/`U+0020`, `U+007E`/`U+007F`, `U+009F`/`U+00A0`, `U+2029`/`U+202A`, `U+202E`/`U+202F`, `U+2065`/`U+2066`, `U+2069`/`U+206A`) — ein Regelfehler, der einen Bereich um eins verschiebt (`<` statt `<=`), fällt dort auf, nicht bei einem Wert mitten im Bereich.

**6. Kein Test für `apps/local-api/src/routes/addin/**`, `apps/outlook-addin/**` oder deren OpenAPI-Abschnitt.** Der Auftrag nennt sie ausdrücklich als integration-devs Arbeitsfläche in Welle F (T-104), und der Vertrag der Add-in-Routen ist laut Board mitten in der Umstellung — ein Test dagegen wäre entweder gegen den alten oder gegen einen noch nicht gemessenen neuen Vertrag geschrieben.

---

## Risiken

**R1 — Die Attrappe für `AppContext` ist an drei Stellen dupliziert** (`todo-done-movement.test.ts`, `timer-orphan-resolution.test.ts`, je eigene `buildContext`-Funktion; `pool-movement-states.test.ts` braucht keine, weil rein). Bewusst nicht in einen gemeinsamen `apps/local-api/test/support/`-Ordner gezogen, um keine Kopplung zwischen zwei Testdateien einzuführen, die unterschiedliche Ports brauchen — aber bei einer dritten/vierten Stelle mit demselben Bedarf wäre eine gemeinsame Datei fällig.

**R2 — Die Vorher/Nachher-Messung lief gegen einen sich bewegenden Stand.** Zwischen der ersten und der zweiten Coverage-Messung (Stash/Pop) können andere Agenten weitergeschrieben haben; die beiden Zahlen sind trotzdem vergleichbar, weil dazwischen ausschließlich meine neun Testdateien den Unterschied ausmachen — kein anderer Agent schreibt in `packages/*/test/**` oder `apps/*/test/**` (Hoheit). Die Schwelle (80 %) ist an allen drei Stellen sicher gehalten.

**R3 — Sicherheit: keine neue Fläche.** Alle neuen Tests laufen ausschließlich unter `test/` und rufen ausschließlich bereits vorhandene, exportierte Funktionen und Anwendungsfälle auf. Keine echten Call-Nummern, Kundennamen oder Zugangsdaten — alle Namen (Ost, Nord, Wartung Süd, Erste/Zweite Regel, Regel 01–21, E2E-artige Todo-Titel) sind erfunden. Die literalen Steuer-/Bidi-Zeichen in `input.test.ts` sind Testdaten für eine Zurückweisungsprüfung, kein Angriffscode, und stehen nirgends in einer Fehlermeldung, die ein Test bestätigt (die Prüfung „der Wert steht in keiner Meldung" ist selbst ein Testfall).

---

## Offene Fragen

**F1 — coverage.include** ist unverändert; keine Änderung nötig für diese Aufgabe. Falls eine künftige Welle `apps/web/src/lib` oder `apps/local-api/src/usecases` in die erzwungene Schwelle aufnehmen will, ist das eine Entscheidung des Orchestrators (`vitest.config.ts` ist gemeinsame Datei).

**F2** — Keine der neun Dateien hat einen bestehenden Test rot gemacht oder verändert außer den drei erweiterten Dateien (dort nur Ergänzung, keine Zeile einer bestehenden Prüfung entfernt oder umgeschrieben — die eine Ausnahme ist der Titel und die Beschreibung des Tests „ein in einer Pool-Regel verwendetes Tag …" in `repo-tags.test.ts`, der um die `details`-Prüfung ERWEITERT wurde, ohne seine bisherige Aussage zu verlieren).

---

## Nächster Schritt

1. **Reviewer-Wiedervorlage** kann diese neun Dateien zusammen mit T-101/T-102 prüfen — alle drei hängen an denselben Funktionen.
2. **integration-dev (T-104), dann e2e-tester (Welle G):** Sobald die Add-in-Routen auf `bookingMovementStates(todo, {hasOpen, hasExported})` umgestellt sind, wäre ein Attrappen-Test nach demselben Muster wie `todo-done-movement.test.ts` denkbar — habe ich bewusst nicht vorgezogen (Annahme 6).
3. **Orchestrator:** Falls `coverage.include` künftig `apps/local-api/src/usecases` oder `apps/web/src/lib` erfassen soll, sind `movement.ts` und die drei `pool-movement.ts`-Zustandsfunktionen jetzt vollständig geprüft und würden die Schwelle für sich genommen tragen (siehe F1).
