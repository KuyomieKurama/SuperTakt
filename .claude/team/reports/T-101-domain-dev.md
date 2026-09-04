# T-101 — Dienst und Domäne, Befunde aus Welle D

**Aufgabe:** T-101 — Dienst und Domäne, Befunde aus Welle D
**Rolle:** domain-dev
**Stand:** Zweig `status-als-regelterm`, Ausgangspunkt `1019ffa`, unkommittiert
**Status:** fertig

---

## Artefakte

### Domäne (`packages/domain`)

| Datei | Was |
|---|---|
| `src/time-entry.ts` | Neu `ENTRY_CLOSED_EFFECT` / `EntryClosedEffect` und `BOOKING_EFFECT` / `BookingEffect` (E-061 Punkt 1). W-2: der Kommentar an `TimerStartResult.doneCleared` behauptet nicht mehr „die Karte bleibt, wo sie ist". |
| `src/pool-movement.ts` | E-060 Punkt 3: Der Kommentar an `PoolMovementOccasion` nennt jetzt **beide** Anlässe, für die `'booking'` steht. Kein Umbenennen. |

### Dienst (`apps/local-api`)

| Datei | Was |
|---|---|
| `src/usecases/pool-movement.ts` | E-061 Punkt 2: `bookingMovementStates`, `closedEntryMovementStates`, `completionMovementStates`, dazu `MovingTodo`, `BookingPresenceBefore`, `NO_ENTRIES` — alle **exportiert**, damit integration-dev sie in Welle F aus `routes/addin/**` rufen kann. |
| `src/usecases/timer.ts` | Start, Stopp und `orphaned/resolve` bilden kein Zustandspaar mehr selbst. O-R: `resolveOrphanedTimer` reicht `decision.reason` aus der Domäne durch. `StopTimerResult` (nur `timer_too_short`) und neu `ResolveOrphanedTimerResult` (beide Gründe) über eine gemeinsame `StopOutcome<Reason>`. |
| `src/usecases/todos.ts` | E-060: `markTodoDone`/`clearTodoDone` liefern `TodoDoneResult = { todo, poolMovement }`, gerechnet in `switchTodoDone` aus dem Zustandspaar vor/nach mit `list('all')`. |
| `src/routes/todos.ts` | `doneBody()` setzt die Antwort zusammen: Todo flach, `poolMovement` daneben. |
| `src/http/input.ts` | H-2: `titleSchema` und `nameSchema` weisen C0/C1 und Bidi-Steuerzeichen ab, mit deutscher Meldung und ohne den Wert zu wiederholen. |
| `openapi/takt-local-api.yaml` | Neues Bauteil `TodoAfterDone`; beide `/done`-Routen darauf; `reason` an `orphaned/resolve` beschrieben; `deleteTag` nennt `details`; Obergrenze an allen drei Löschrouten; H-2 an `UnprocessableEntity`. |

### Speicherung (`packages/storage`)

| Datei | Was |
|---|---|
| `src/sqlite/mappers.ts` | Neu `RULE_REFERENCE_LIMIT` (20), `RULE_REFERENCE_PROBE` (21) und `poolReferences(rows)` → `{ details, notice }` (H-3). |
| `src/sqlite/repo-tags.ts` | `TagPort.remove` liefert `details` mit Regelnamen. Ordnerabfrage mit `LIMIT`. CASCADE-Kommentar richtiggestellt. |
| `src/sqlite/repo-statuses.ts` | CASCADE-Kommentar richtiggestellt, Statusabfrage mit `LIMIT`. |
| `src/sqlite/repo-todos.ts` | W-3: `markDone`-Kommentar. |
| `src/sqlite/migration-runner.ts` | H-4: `legacy_alter_table` wird im `finally` zurückgesetzt. |

### Dokumentation

| Datei | Was |
|---|---|
| `docs/architektur.md` | W-4: der Abschnitt zum Timerstart widerspricht `:105-113` nicht mehr. |
| `docs/datenmodell.md` | Obergrenze für `details` und der zurückgesetzte Pragma-Schalter nachgetragen. |

Nicht angefasst: `apps/local-api/src/routes/addin/**`, `packages/export/**`, `apps/web/**`,
`apps/desktop/**`, `apps/outlook-addin/**`, alle Testordner, `docs/testplan.md`,
`package.json`, `tsconfig*.json`.

---

## Zusammenfassung

E-060 steht: `PUT` und `DELETE /todos/{todoId}/done` liefern `poolMovement`, gerechnet vom
Anwendungsfall `usecases/pool-movement.ts` aus dem echten Zustandspaar vor und nach dem
Schreiben und mit `list('all')`; `null`, wenn das Kennzeichen schon so stand — dann wird keine
einzige Regel aufgelöst. E-061 Punkte 1 und 2: Die Wirkung einer Buchung liegt als benannte
Konstante in `packages/domain`, das Zustandspaar bildet je eine Hilfsfunktion im Anwendungsfall,
und Start, Stopp und `orphaned/resolve` rufen sie; keine Aufrufstelle schreibt das Paar noch
selbst. O-R ist unterschieden statt gekürzt: `orphan_discarded` kommt aus der Domäne durch,
`POST /timer/stop` bleibt bei `timer_too_short`. Dazu `TagPort.remove` mit Regelnamen in
`details`, eine Obergrenze für diese Namen an allen drei Löschrouten, die Steuer- und
Bidi-Prüfung an Namen, der zurückgesetzte `legacy_alter_table`-Schalter und die sechs
Kommentar- beziehungsweise Textstellen aus R-1a/R-2a.

---

## Nachweis

Alle Läufe am Ende, gegen den abgelieferten Stand.

| Lauf | Exitcode | Ergebnis |
|---|---|---|
| `pnpm run typecheck` | **0** | alle acht Projekte plus `typecheck:test` |
| `pnpm run test` | **0** | 45 Dateien, **684 Prüfungen**, 0 rot (unverändert zum Ausgangsstand) |
| `pnpm run proof:openapi` | **0** | **100 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:all` (alle 14 Pfade) | **0** | **828 Prüfungen, 0 rot** |

`proof:all` deckt die betroffenen Pfade ab: `proof:migrations`, `proof:openapi`,
`proof:callers`, `proof:conflicts`, `proof:tags`, `proof:access`, `proof:export`,
`proof:export-api`, `proof:taskpane`, `proof:addin-wiring`, `proof:route-policy`,
`proof:template-fields`, `proof:db-permissions`, `proof:addin`.

Port 17843/17844 war zu Beginn durch einen fremden Lauf belegt; ich habe 320 Sekunden gewartet
und dann gestartet. Kein fremder Prozess wurde beendet.

**Kein bestehender Test ist rot geworden**, und ich habe keinen angefasst. Die drei
Verhaltensänderungen liegen in Ecken, die noch kein Test misst — der unit-tester hat freie
Hand (Vorschläge unter „Nächster Schritt").

### Gemessenes Verhalten (Wegwerfskript, danach gelöscht)

Die Nachweispfade messen Gestalt, nicht Werte. Ich habe die vier neuen Zusagen zusätzlich am
zusammengebauten Dienst gefahren:

```
PUT  #1   200 {"appears":["Erledigt"],"enters":["Erledigt"],"leaves":["Offen"]}
PUT  #2   200 null                          (zweimal erledigt — nichts geschrieben)
DEL  #1   200 {"appears":["Offen"],"enters":["Offen"],"leaves":["Erledigt"]}
DEL  #2   200 null                          (war schon offen)
Todo flach in der Antwort: id ✓ title ✓

resolve discard -> 200 {"kind":"discarded","reason":"orphan_discarded","poolMovement":null}

Tag mit U+202E:      422 „Steuerzeichen und Richtungszeichen sind in einem Namen nicht erlaubt."
Tag mit U+0007:      422 dieselbe Meldung
Tag „Ost 2":         201

Tag löschen (Regel) -> 409 tag_in_use, details = ["Regel „Offen“","Regel „Erledigt“"]
23 Regeln           -> 409 „… Es sind mehr als 20; genannt werden die ersten 20.", details: 20

Stopp auf einem Todo, das **während** des laufenden Timers erledigt wurde
                    -> {"appears":["NurErledigt"],"enters":[],"leaves":[]}
```

Die letzte Zeile ist die Gegenprobe zu Annahme 1: Mit `BOOKING_EFFECT` hätte der Stopp hier
`enters: ["NurOffen"], leaves: ["NurErledigt"]` gemeldet — eine Aufhebung, die nicht
stattfindet.

---

## Annahmen

**1. `BOOKING_EFFECT` allein reicht für die vier Stellen nicht; es sind drei Wirkungen.**
E-061 beschreibt die Wirkung einer Buchung als `completedAt: null` **und**
`hasOpenEntries: true` und nennt vier Stellen, die dieses Paar bilden. Gegen den Quelltext
gehalten stimmt das für zwei davon:

| Stelle | tatsächliche Wirkung | warum |
|---|---|---|
| Add-in, Duplikatsuche und Buchung | `completedAt: null`, `hasOpenEntries: true` | `bookOnTodo` ruft `clearDone` in derselben Transaktion |
| `POST /timer/start`, wenn er einen Timer **desselben** Todos verdrängt | dito | `timer.start` schreibt `completed_at = NULL`, der verdrängte Timer wird zur offenen Buchung |
| `POST /timer/start` sonst | nur `completedAt: null` | Ein laufender Timer ist keine abgeschlossene Buchung; `hasOpenEntries` bleibt, was es war |
| `POST /timer/stop`, `orphaned/resolve` | nur `hasOpenEntries: true` | `timer.stop` schreibt `ended_at`, `note`, `updated_at` — und **nicht** `completed_at`. „Ein Stopp hebt kein „Erledigt" auf, das tut allein der Start" steht so in der OpenAPI seit T-093 |

Der Unterschied ist erreichbar: Timer starten, Todo **währenddessen** von Hand auf erledigt
setzen, stoppen. Mit einer einzigen Wirkung hätte der Stopp behauptet, das Todo sei aus der
Erledigt-Spalte verschwunden und in der Offen-Spalte erschienen — beides falsch, beides in
einem Satz an den Benutzer.

Ich habe deshalb **zwei** Konstanten in der Domäne, die eine aus der anderen gebaut:
`ENTRY_CLOSED_EFFECT` (`hasOpenEntries: true`) und `BOOKING_EFFECT extends EntryClosedEffect`
(dazu `completedAt: null`). Der Name aus E-061 bleibt und bezeichnet, was er bezeichnen sollte:
was eine Buchung **auf** ein Todo ändert. Die dritte Achse — allein das Erledigt-Kennzeichen —
braucht keine Konstante, weil `PUT`/`DELETE /done` den Wert von danach aus der Speicherung
zurückbekommen und nichts geraten wird.

Damit gilt „keine Aufrufstelle bildet das Paar selbst" unverändert: Es sind drei benannte
Funktionen statt einer, jede mit genau einer Aufrufergruppe, und die Tabelle dazu steht im Kopf
von `usecases/pool-movement.ts`.

**2. Das Todo steht in der `/done`-Antwort flach, `poolMovement` daneben.**
E-060 und das Board legen den Feldnamen fest (`poolMovement: PoolMovement | null`), nicht die
Gestalt darum. `{ todo, poolMovement }` hätte dieselbe Auskunft gegeben und jede vorhandene
Aufrufstelle gebrochen — beide Routen liefern seit jeher das Todo selbst. Flach ist rein
additiv: `request<Todo>` in `apps/web/src/api/endpoints.ts` compiliert unverändert weiter, und
wer den Satz will, liest ein Feld mehr. Dieselbe Gestalt hat `POST /timer/start`. In der
OpenAPI ist das `TodoAfterDone` (`allOf: [Todo, { poolMovement }]`), und `proof:openapi`
Abschnitt 8 vergleicht die echten Antworten dagegen.

**3. `null` heißt an den `/done`-Routen „das Kennzeichen hat sich nicht geändert".**
Genau wie `movementOfStart` es hält (`!doneCleared && !firstEntryAppeared → null`). Bei
gleichem `completedAt` vor und nach dem Schreiben wird keine Regel aufgelöst. Bewegt sich das
Kennzeichen, aber trifft keine Regel darauf zu, kommt das übliche Tripel mit leeren Listen —
und `poolMovementSentence` entscheidet dort, ob es etwas zu sagen gibt (`'reopen'` immer,
`'booking'` nur bei Bewegung).

**4. Obergrenze für `details`: 20 genannt, 21 geholt, Kürzung im Meldungstext.**
R-3a schlug `LIMIT 21` und „… und 15 weitere" **im Satz** vor; der Satz gehört
`apps/web/src/lib/errorText.ts` und damit frontend-dev, und H-3 steht nicht in T-102. Eine
Liste, die still bei zwanzig aufhört, wäre die stille Kürzung aus Befund B-3b: Der Benutzer
nimmt zwanzig Regeln heraus und findet die Sperre unverändert vor. Die Abfrage holt deshalb
eine Zeile mehr, als sie zeigt, und der **Meldungstext des Dienstes** sagt es, wenn sie kam
(„Es sind mehr als 20; genannt werden die ersten 20."). `errorMessageWithRules` hängt die
Aufzählung an genau diesen Text an — die Oberfläche braucht dafür keine Änderung. Wird der
Satz später in der Oberfläche gebaut, kann der Zusatz hier ersatzlos weg.

**5. Ein eigener Ergebnistyp für `orphaned/resolve`.**
Statt `StopTimerResult` um `orphan_discarded` zu erweitern gibt es
`ResolveOrphanedTimerResult`; beide teilen die Gestalt über `StopOutcome<Reason>`. Ein
gemeinsamer Typ zwänge jede Aufrufstelle von `POST /timer/stop` zu einer Fallunterscheidung für
einen Grund, den diese Route nicht liefern kann. Die OpenAPI hielt beide Routen schon
auseinander (`const: timer_too_short` gegen `enum: [timer_too_short, orphan_discarded]`); jetzt
tut es der Dienst auch.

**6. H-2 wird abgewiesen, nicht bereinigt.** Ein stilles Entfernen änderte die Eingabe, ohne
dass der Benutzer es erführe. Der abgewiesene Wert steht **nicht** in der Meldung (B-4.3
Punkt 5). Erfasst sind `U+0000`–`U+001F`, `U+007F`–`U+009F`, `U+202A`–`U+202E` und
`U+2066`–`U+2069`; `U+0020` bleibt erlaubt. Geprüft: `z.toJSONSchema` bildet ein `.refine`
nicht ab, `proof:openapi` Abschnitt 3 bleibt unberührt.

**7. `legacy_alter_table` wird ohne Bedingung zurückgesetzt.** Anders als `foreign_keys`
schaltet der Läufer diesen Schalter nie selbst ein — es gibt keine Marke in der Datei, an der
er es festmachen könnte. `OFF` ist die Vorgabe von SQLite; ein Pragma je Migration kann keinen
Fall verfehlen, den ein Textvergleich übersehen hätte.

---

## Risiken

**R1 — Vertragsänderung an zwei Routen, parallel gebaut.** `PUT`/`DELETE /todos/{todoId}/done`
liefern jetzt ein Feld mehr. Der Zusatz ist rein additiv (Annahme 2), aber frontend-dev baut in
derselben Welle dagegen. Wer `poolMovement` unter `data.todo` sucht, findet es nicht — es steht
neben `id` und `title`. **Der Vertrag steht in der OpenAPI unter `TodoAfterDone` und ist von
`proof:openapi` gegen die echten Antworten gemessen.**

**R2 — Verhaltensänderung am Stopp, in einer Ecke.** `movementOfBooking` setzt `after`
nicht mehr aus `todo.completedAt` in beiden Zuständen zusammen, sondern über
`ENTRY_CLOSED_EFFECT`. Das Ergebnis ist zeichengleich mit vorher; die Umstellung ist eine
Umbenennung derselben Rechnung. Der Fall, in dem es **anders** wäre, ist der, den Annahme 1
beschreibt, und dort ist die neue Fassung die richtige.

**R3 — H-2 kann bestehende Namen unlöschbar machen.** Die Prüfung sitzt am **Eingang**. Ein
Name mit Steuerzeichen, der vor T-101 angelegt wurde, bleibt im Bestand und lässt sich weiter
lesen und löschen — aber ein `PATCH`, der ihn unverändert zurückschickt, wird jetzt mit 422
abgewiesen. Kein Bestand dieser Art ist bekannt (`tests/fixtures/**` ist leer), und eine
Migration, die vorhandene Namen umschreibt, wäre die stille Änderung, die Annahme 6 ablehnt.
**Als Beobachtung gemeldet, nicht behoben.**

**R4 — H-3 ist eine Obergrenze, keine Antwort auf viele Regeln.** Bei mehr als zwanzig
Regeln nennt der Dialog zwanzig und sagt, dass es mehr sind. Der Benutzer muss zweimal
hinsehen. Die vollständige Lösung ist der Satz in der Oberfläche („… und 12 weitere") plus eine
Ansicht „Regeln, die dieses Tag nennen" — beides frontend-dev, beides nicht in dieser Welle.

**Sicherheit.** Keine neue Fläche nach außen. `details` trägt weiterhin ausschließlich Namen
und Kennungen aus dem eigenen Bestand (B-2.4) und ist jetzt der Zahl nach begrenzt. Die
`/done`-Antworten geben Poolnamen heraus — dieselbe Klasse Auskunft wie `POST /timer/start`
seit E-058, dieselben Routen der Hauptfläche, **nicht** am Add-in-Token (Bedrohungsmodell
15.3 gilt unverändert). Die Notiz-Trennung ist unberührt: `TodoDoneResult` trägt `Todo` und
`PoolMovement`, keinen Vermerk; `proof:openapi` misst das weiterhin über den ganzen Durchlauf
(„der interne Vermerk steht in keiner Antwort außer der Vermerksroute").

---

## Offene Fragen

**F1 — W-1 liegt im Add-in-Abschnitt. Ich habe ihn stehen lassen.**
`apps/local-api/openapi/takt-local-api.yaml`, Beschreibung von
`POST /addin/todos/{todoId}/time-entries` („Was geschehen ist, sagt die **Antwort** … `poolNames`.
Die Kanban-Spalte bleibt, wo sie ist (E-023)"). Die Route trägt `tags: [Add-in]`; nach E-053
gehört der Add-in-Abschnitt integration-dev. Dazu kommt: Der Satz nennt `poolNames`, und genau
diese Liste fällt in Welle F nach E-061 Punkt 3 weg — die Stelle wird dort ohnehin angefasst.
`proof-openapi.mjs:454` prüft an derselben Route auf `doneCleared` und `poolNames` im
**Antwortschema**; wer die Liste ersetzt, zieht diese Zeile mit. **Bitte an integration-dev
weitergeben (Welle F), zusammen mit E-061 Punkt 3.** Soll ich sie stattdessen anfassen, sage
Bescheid — es ist eine Textstelle.

**F2 — Aufzählung der Anlässe an zwei Routen.** `DELETE /done` verlangt den Anlass `'reopen'`,
`PUT /done` den Anlass `'booking'`; der Dienst liefert nur `poolMovement` und **nicht** den
Anlass, weil er aus der Route folgt (so wie an allen drei Timer-Routen, wo er stets `'booking'`
beziehungsweise am Start je nach `doneCleared` gewählt wird). Die Zuordnung steht in der
OpenAPI an `TodoAfterDone` als Tabelle. Falls frontend-dev sie lieber im Rumpf hätte, ist das
ein Feld mehr und eine Zeile Arbeit — aber es wäre die zweite Stelle, an der derselbe Satz
entschieden wird.

**F3 — O-C und O-M bleiben offen** (`GET /settings` ohne Merkmale zum Datenbankpfad; die
Aufruferseite des Add-ins ist von `proof:callers` nicht erfasst). Beide standen nicht in T-101.

**F4 — O-I Restfrage weiter offen** (`resolveRule`/`resolveExcluded` zugunsten von
`resolveAxes` streichen oder den Kommentar richtigstellen). Nicht in T-101, und ein Streichen
berührte `packages/storage/test/repo-tags.test.ts` — fremde Hoheit.

---

## Nächster Schritt

1. **integration-dev, Welle F:** E-061 Punkt 3 auf den vorbereiteten Funktionen. Zu rufen sind
   aus `apps/local-api/src/usecases/pool-movement.ts`: `bookingMovementStates(todo, entries)`
   mit `entries` als `{ hasOpen, hasExported }` — genau das, was `exportPresence` je Todo
   liefert, und im Add-in aus `openSeconds > 0` / `exportedSeconds > 0` zu bilden. Das lokale
   `BOOKING_EFFECT` in `routes/addin/service.ts:246` und beide von Hand gebauten Paare
   (`:312-319`, `:734-741`) entfallen dabei ersatzlos. Dazu F1.
2. **unit-tester:** drei Ecken sind neu und ungemessen —
   (a) `switchTodoDone` in beiden Richtungen samt `null` beim zweiten Aufruf;
   (b) `closedEntryMovementStates` gegen `bookingMovementStates` am Fall „während des laufenden
   Timers erledigt gesetzt" (die Gegenprobe oben);
   (c) `resolveOrphanedTimer` mit `discard` → `orphan_discarded` und mit
   `book_until_heartbeat` ohne Lebenszeichen → `timer_too_short`.
   Dazu die reinen Fälle in der Domäne: `BOOKING_EFFECT` ist eingefroren und enthält genau zwei
   Achsen, und `poolReferences` kürzt bei 21 Zeilen auf 20 mit Hinweis.
3. **e2e-tester:** die in T-103 vorbereiteten Fälle laufen jetzt — der Bewegungssatz nach
   „Erledigt"/„Wieder offen" und `orphan_discarded`.
4. **Orchestrator:** entscheiden, ob `RULE_REFERENCE_LIMIT` in einer späteren Welle durch den
   Satz in der Oberfläche abgelöst wird (Risiko R4), und R3 zur Kenntnis nehmen.
