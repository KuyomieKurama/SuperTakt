Aufgabe: T-106 — End-to-End nachziehen für Welle E

Status: fertig

Artefakte:

```
tests/e2e/timer-stop-announcement.spec.ts   GEÄNDERT — drei Wortlaute auf den gemessenen Stand
                                             aus reports/T-102-frontend-dev.md Abschnitt 2 gebracht
                                             (Zeilen 103-104, 173-176, 256 des Ausgangsstands);
                                             neue describe-Gruppe TP-TIMER-11 (O-R): zwei Fälle
                                             („Verwerfen“ → orphan_discarded, „zu kurz“ →
                                             timer_too_short, mit wörtlich verschiedenen Texten)
tests/e2e/tag-folder-rule-lock.spec.ts      GEÄNDERT — Ordner- und Tag-Fall klicken nach der
                                             Absage jetzt „Schließen“ statt „Abbrechen“ (T-102);
                                             Tag-Fall erwartet den Regelnamen jetzt wörtlich
                                             (T-101 hat den in T-096/T-099 gemessenen Fund
                                             behoben); Kopfkommentar nachgezogen
tests/e2e/done-movement-announcement.spec.ts NEU — TP-EXPST-13 (E-060): drei Fälle (Setzen,
                                             Aufheben, kein Treffer) an der Detailansicht, echte
                                             Spezifikation aus dem T-103-Entwurf, gegen den
                                             tatsächlich ausgelieferten Quelltext geschrieben
tests/e2e/support/api.ts                    GEÄNDERT — TodoDoneResult von der angenommenen Hülle
                                             { todo, poolMovement } auf die gemessene, flache
                                             Gestalt (extends Todo) gebracht; Kommentare an
                                             setTodoDoneWithMovement/reopenTodoWithMovement
docs/testplan.md                            GEÄNDERT — neuer Abschnitt 19 (fünf Wortlaute,
                                             TP-EXPST-13, TP-TIMER-11, api.ts-Hülle, W-13);
                                             W-13-Stellen :21 und :838 („Regel über Tags“ → „Regel“
                                             mit den fünf Achsen im Nebensatz)
```

Nicht angefasst (fremde Hoheit, laufender Umbau): `tests/e2e/pool-movement-sentence.spec.ts`, die
Add-in-Helfer in `support/api.ts` (`AddinTodoMatch`, `AddinBookResult`, `addinTodoMatches`,
`addinBookOnTodo`) — integration-dev stellt die Add-in-Routen in dieser Welle auf `poolMovement`
um, das Nachziehen ist Welle G.

Zusammenfassung:

Alle vier Aufträge sind umgesetzt und gemessen. Punkt 1: die fünf gemeldeten Wortlaute stehen jetzt
gegen den tatsächlichen Quelltext (`TimerContext.tsx`, `TagsScreen.tsx`); der Bewegungssatz bleibt
überall aus `poolMovementSentence` gezogen, nicht abgeschrieben. Punkt 2: `TodoDoneResult` in
`support/api.ts` ist von der angenommenen Hülle `{ todo, poolMovement }` auf die von T-101/T-102
tatsächlich gelieferte flache Gestalt (`extends Todo`) korrigiert. Punkt 3: die beiden T-103-Entwürfe
sind als echte, laufende Spezifikationen angelegt — TP-EXPST-13 (E-060, neue Datei) und TP-TIMER-11
(O-R, neue Gruppe in `timer-stop-announcement.spec.ts`), beide mit Gegenproben gegen den jeweils
vorher bestehenden Fund (Titel ohne Todo-Namen bzw. `orphan_discarded` immer als `timer_too_short`).
Punkt 4: `docs/testplan.md` Abschnitt 19 dokumentiert alles, dazu die zwei W-13-Stellen. Ein echter,
in dieser Aufgabe gefundener und behobener Fehler in der Testbauart selbst: `locator.check()`/
`.uncheck()` passen nicht auf die serverbestätigte (nicht optimistische) Checkbox der Detailansicht
und werfen reproduzierbar „did not change its state“, obwohl die Anwendung korrekt arbeitet — behoben
durch `.click()` plus eine selbst wartende `expect(...).toBeChecked()`, dieselbe Bauart wie überall
sonst in `tests/e2e/**`.

## Punkt 1 — fünf Wortlaute

Alle drei Stellen in `timer-stop-announcement.spec.ts` sind mit den in
`reports/T-102-frontend-dev.md` Abschnitt 2 gemessenen Sätzen abgeglichen und zusätzlich gegen den
aktuellen Quelltext von `TimerContext.tsx` (`confirmOrphan`, `reportStopped`-Pfad) gegengelesen:

- `recorded`: Titel `Zeit gebucht auf „${todo.title}“.` (Filter auf Teiltext „Zeit gebucht“, da der
  volle alte Satz nicht mehr vorkommt).
- `discarded` (direkter Stopp): Titel bleibt „Nichts gebucht.“, Rumpf jetzt
  `Der Timer auf „${todo.title}“ lief weniger als eine Sekunde. …`.
- `orphaned/resolve`, `recorded`: Titel `Buchung auf „${todo.title}“ abgeschlossen.`.

In `tag-folder-rule-lock.spec.ts` klicken der Ordner- und der Tag-Fall nach der Absage jetzt
„Schließen“ (vorher „Abbrechen“) — T-102 hat beide Dialoge auf denselben Knopfwechsel gebracht wie
`StatusSettings` seit T-097. Der Tag-Fall behauptete bislang ausdrücklich das **Fehlen** des
Regelnamens (der in T-096/T-099 gemessene Fund `repo-tags.ts`, `TagPort.remove()` ohne `details`)
— T-101 hat genau das behoben; der Testfall erwartet den Regelnamen jetzt wörtlich
(`Betroffen ist Regel „${pool.name}“.`), wie beim Ordner- und Status-Fall. Dafür musste der Pool in
diesem Fall zusätzlich in einer Variablen gehalten werden (vorher nur angelegt, nicht referenziert).

## Punkt 2 — `TodoDoneResult` auf die gemessene Hülle

`TodoDoneResult` war `{ todo: Todo; poolMovement: PoolMovementNames | null }` — eine ausdrücklich
als Annahme gekennzeichnete Hülle aus T-103. Gemessen mit T-101 (Dienst, `doneBody()` in
`routes/todos.ts`) und T-102 (Oberfläche, gegen die echte Route gelesen) liegt das Todo **flach**
wie bisher, `poolMovement` als zusätzliches Feld daneben — dieselbe Gestalt wie an
`POST /timer/start`. `TodoDoneResult` ist jetzt `extends Todo` mit `poolMovement: PoolMovementNames
| null`. `markTodoDone`/`clearTodoDone` bleiben unverändert bei der Beschriftung `Todo` — kein
bestehender Aufrufer (`kanban.spec.ts`, `pool-movement-sentence.spec.ts`) liest `poolMovement` über
diese beiden Funktionen, die Umstellung bricht dort nichts.

## Punkt 3 — E-060 und O-R als Spezifikationen

**TP-EXPST-13** (`done-movement-announcement.spec.ts`, neu): drei Fälle an der Detailansicht
(Setzen/`booking`, Aufheben/`reopen`, kein Treffer). Der Bewegungssatz kommt aus
`poolMovementSentence`, gebildet aus der tatsächlichen `PUT`/`DELETE`-Antwort — kein Literal. Der
feste Rumpf-Grundsatz („Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte
Größen.“) ist als Literal geprüft, gegen `TodoDetailScreen.tsx` gegengelesen; er ist kein Teil der
Bewegungsfunktion und muss es nicht sein. Der Titel trägt den Todo-Namen — der T-103-Entwurf hatte
diesen Punkt als offene Frage stehen lassen (ob das eine bewusste Erweiterung oder ein
Zwischenstand war); T-102 hat es so ausgeliefert, der Testfall prüft jetzt den tatsächlich
gelieferten Titel.

**TP-TIMER-11** (neue `describe`-Gruppe in `timer-stop-announcement.spec.ts`): zwei Fälle,
„Verwerfen“ (→ `orphan_discarded`, Toast „Buchung verworfen.“) und „zu kurz“ (→ `timer_too_short`,
Toast „Nichts zu buchen.“), mit einer expliziten Prüfung, dass die beiden Rumpftexte sich
unterscheiden — die Gegenprobe zum O-R-Fund aus T-093 (vor T-101 lieferte der Dienst in beiden
Fällen ausnahmslos `timer_too_short`; ein Rückfall darauf macht bereits den ersten Fall rot, weil
`reason` nicht mit `orphan_discarded` übereinstimmt).

**Echter Fund in dieser Aufgabe, in derselben Datei behoben:** Die „Erledigt“-Checkbox ist
serverbestätigt (`checked={done}` aus `useAsync`), nicht optimistisch. `locator.check()`/
`.uncheck()` prüfen den Haken **unmittelbar** nach dem Klick, bevor der `PUT`/`DELETE`-Umlauf
zurück ist, und werfen deshalb reproduzierbar „Clicking the checkbox did not change its state“ —
unabhängig davon, ob die Anwendung korrekt arbeitet (belegt: derselbe Ablauf lief über einen
manuell aufgesetzten lokalen Dienst und über direkte, parallele HTTP-Anfragen fehlerfrei durch;
ein einzelner, nicht reproduzierbarer Fall zeigte zusätzlich einen kurzzeitigen `404` auf die
unmittelbar folgende `GET /todos/{id}`, der sich weder über eine gleichwertige HTTP-Anfragefolge
noch über einen einfachen `.click()` wiederholen ließ — mit hoher Wahrscheinlichkeit eine weitere
Alterserscheinung derselben `.check()`-Race, nicht separat verfolgt). Behoben durch `.click()` plus
ein eigenes, selbst wiederholendes `expect(checkbox).toBeChecked()`/`.not.toBeChecked()` danach —
dieselbe Bauart, die jeder andere Testfall in `tests/e2e/**` für Knöpfe und Kontrollkästchen bereits
verwendet (kein einziger benutzt `.check()`/`.uncheck()`). Kein Produktivcode angefasst.

## Punkt 4 — `docs/testplan.md`

Neuer Abschnitt 19 mit allen vier Punkten oben, dazu die zwei W-13-Stellen: `:21` und `:838` (Stand
`aca53df`, an der aktuellen Datei nachgeprüft — beide lagen exakt an den gemeldeten Zeilen und
enthielten wörtlich „Regel über Tags“). Beide sind auf „Regel“ umformuliert, mit einem Nebensatz,
der die fünf Achsen nennt (Abschnitt 8 zählt sie unmittelbar danach ohnehin auf) — der Sinn ändert
sich nicht, nur die seit E-055 veraltete Verengung auf Tags fällt weg.

## Nachweis

```
pnpm run typecheck:e2e                                                          Exitcode 0
                                                                                 (dreifach reproduziert)

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  --grep "timer-stop-announcement|tag-folder-rule-lock|done-movement-announcement" \
  --reporter=list --retries=0
                                                                                 12/12, dreifach
                                                                                 reproduziert

pnpm exec playwright test -c tests/e2e/playwright.config.ts \
  tests/e2e/done-movement-announcement.spec.ts --reporter=list --retries=0
                                                                                 3/3, isoliert
                                                                                 dreifach reproduziert
```

Port 17843/17844 war bei jedem Lauf frei (`ss -ltnp` vor dem Start geprüft); kein fremder Prozess
beendet. Parallel liefen integration-dev (T-104, Add-in-Routen) und unit-tester (T-105) sichtbar
mit (`git status` zeigt Änderungen unter `apps/local-api/src/routes/addin/**`,
`apps/outlook-addin/**`, `packages/*/test/**` — keine davon von mir angefasst); kein voller
`pnpm run test:e2e` gefahren, wie beauftragt.

Keine echten Call-Nummern oder Kundendaten — alle Testdaten mit `E2E-`-Präfix, erfunden.

Annahmen:

1. **`.click()` statt `.check()`/`.uncheck()` für die neue Detailansicht-Checkbox** — nicht
   Bestandteil des Auftrags, aber ohne diese Korrektur wäre `done-movement-announcement.spec.ts`
   nicht verlässlich grün geworden. Reine Testbauart, kein Produktivcode berührt.
2. **Pool-Variable im Tag-Fall von `tag-folder-rule-lock.spec.ts` ergänzt** (`const pool = await
   createPool(...)`), um den jetzt erwarteten Regelnamen zu referenzieren — vorher wurde der Pool
   nur angelegt, nie zurückgehalten.
3. **TP-EXPST-13 prüft ausschließlich die Detailansicht**, nicht Board oder Liste — das deckt sich
   mit dem Umfang des T-103-Entwurfs (Entwurf A) und mit dem expliziten Auftrag, die dortigen
   Entwürfe „als Spezifikationen anzulegen“. E-060 selbst verlangt den Satz an allen drei Flächen;
   Board und Liste sind durch T-102s eigene, gegen die echte Route gemessene Stichprobe belegt
   (Bericht Abschnitt 1/2), aber von keinem laufenden Testfall automatisiert geprüft — siehe
   „Offene Fragen“.
4. **`pool.name` statt eines separat mitgeführten Namens** im Tag-Fall, konsistent mit dem
   Ordner-Fall in derselben Datei.

Risiken:

1. **TP-EXPST-13 deckt nur die Detailansicht ab, nicht Board und Todo-Liste.** E-060 Punkt 4 gilt
   an allen drei Flächen; die anderen beiden sind laut T-102s Bericht korrekt umgesetzt und dort
   manuell gegen die echte Route gemessen, aber ohne automatisierten End-to-End-Nachweis. Sollte
   künftig jemand nur `apps/web/src/screens/BoardScreen.tsx` oder `TodoListScreen.tsx` ändern, ohne
   `TodoDetailScreen.tsx` anzufassen, würde kein Testfall das bemerken.
2. **Der `.check()`-Fund ist nicht auf die Ursache zurückgeführt, nur umgangen.** Ob eine
   spätere, echte Optimistic-UI-Änderung an der Checkbox dieselbe Race erneut sichtbar macht,
   bleibt offen — die jetzige Testbauart (`.click()` + auto-retryendes `expect`) ist robust gegen
   beide Fälle (optimistisch und serverbestätigt), verlangt also keine erneute Anpassung.
3. **Sicherheit: keine neue Angriffsfläche.** Alle Änderungen sind Testfälle, ein Selektor-/
   Interaktionswechsel ohne Semantikänderung und eine Typkorrektur in `support/api.ts`. Keine neue
   Route, kein neues Geheimnis, keine geänderte Testdaten-Herkunft; alle Namen mit `E2E-`-Präfix.
4. **`tests/e2e/pool-movement-sentence.spec.ts` bleibt unangetastet**, wie beauftragt — läuft in
   Welle F noch grün (prüft den Start-Toast, unverändert), bricht aber sobald integration-dev die
   Add-in-Routen umstellt; Nachziehen ist für Welle G vorgesehen und dort schon im Board vermerkt.

Offene Fragen: an den Orchestrator

1. Soll TP-EXPST-13 in einer späteren Welle um Board- und Listenansicht erweitert werden (Risiko 1
   oben), oder gilt die Detailansicht-Stichprobe zusammen mit T-102s gemessenem Beleg als
   ausreichend?

Nächster Schritt:

Welle G wie im Board vorgesehen: integration-dev stellt die Add-in-Routen auf `poolMovement` um,
danach zieht e2e-tester `tests/e2e/pool-movement-sentence.spec.ts` und die Add-in-Helfer in
`support/api.ts` (`AddinTodoMatch`, `AddinBookResult`) nach und fährt den vollen
`pnpm run test:e2e`.
