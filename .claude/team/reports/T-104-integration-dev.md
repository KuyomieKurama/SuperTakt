# T-104 — Add-in-Routen auf die eine Form (E-061 Punkt 3)

**Aufgabe:** T-104 — Add-in-Routen liefern `poolMovement` statt dreier Namenslisten
**Rolle:** integration-dev
**Stand:** Zweig `status-als-regelterm`, Ausgangspunkt `4d1da1c`, unkommittiert
**Status:** fertig

---

## Artefakte

### Dienst — Add-in-Routen (`apps/local-api/src/routes/addin/**`, eigene Hoheit)

| Datei | Was |
|---|---|
| `service.ts` | `AddinTodoMatch` und `AddinBookResult.booked` tragen `poolMovement: PoolMovement \| null` statt `poolNames`/`enteringPoolNames`/`leavingPoolNames`. Das lokale `BOOKING_EFFECT` (`:246`) und **beide** von Hand gebildeten Zustandspaare (`:312-319`, `:734-741`) sind ersatzlos weg. Neu: eine Hilfsfunktion `bookingMovement(namer, todo, entries)`, die beide Routen benutzen; sie ruft `bookingMovementStates` aus `usecases/pool-movement.ts` und darüber `poolMovementNamer`. `list('all')` unverändert (steckt im Anwendungsfall). |
| `index.ts` | Die Buchungsantwort zählt ein Feld statt dreier auf (`poolMovement: result.poolMovement`); die Routenbeschreibung nennt `poolMovement`. |
| `schema.ts` | Kommentar `:112` nennt `poolMovement` statt `poolNames`. |

### Aufgabenbereich (`apps/outlook-addin/**`, eigene Hoheit)

| Datei | Was |
|---|---|
| `src/api/types.ts` | `TodoMatchDto.poolMovement` und `BookResponseDto.poolMovement`, beide `PoolMovement \| null`. Der Typ kommt als `import type` aus `@takt/domain` statt als vierte Abschrift (Begründung im Dateikopf, Annahme 3). |
| `src/duplicate/rule.ts` | `OfferDescription.poolMovement`; `offerMovement()` ersatzlos gestrichen — der Dienst liefert den Wert zusammengesetzt, es gibt nichts mehr zusammenzusetzen. |
| `src/duplicate/reopen.ts` | `reopenPreview`, `reopenOutcome` und `bookingOutcome` nehmen `PoolMovement \| null`. `bookingOutcome` gibt bei `null` keine Zeile aus (wie `apps/web/src/lib/movement.ts`); die Wiederöffnen-Sätze bleiben **genau drei**, mit `NOTHING_MOVED` als begründeter Vorsichtsfassung (Annahme 2). |
| `src/ui/TaskPane.tsx` | Liest `poolMovement` aus Treffer und Buchungsantwort und reicht es unverändert an `poolMovementSentence` weiter; `MovementNote` und `BookedOutcome` nehmen `null` und lassen die Fläche dann ganz weg. Anlässe unverändert: erledigtes Todo → `'reopen'`, sonst `'booking'`. |
| `scripts/proof-addin.mjs` | Attrappen und Prüfungen auf die neue Form gezogen; zwei **neue** Wachen (Schlüsselvergleich an `AddinTodoMatch` und an der Buchungsantwort: eine Form, keine Reste); zwei Prüfungen messen jetzt `poolMovement === null` statt dreier leerer Listen. |

### Schnittstellenbeschreibung (Add-in-Abschnitt nach E-053)

| Stelle | Was |
|---|---|
| `openapi/takt-local-api.yaml` `/addin/todos/{todoId}/time-entries` | **W-1 erledigt**: Der Absatz „Die Kanban-Spalte bleibt, wo sie ist (E-023)" ist weg, ersetzt durch denselben Aufbau wie an `/timer/start` — was sich bewegt, steht in `poolMovement`; was bleibt, ist der **Status** (E-023). Antwort: `required: [timeEntry, todoWasDone, doneCleared, poolMovement]`, `poolMovement` als `oneOf [PoolMovement, null]`. |
| `openapi` `AddinTodoMatch` | Drei Listenfelder → `poolMovement`; **W-15 erledigt**: durchgehend „Regeln — Pools wie Board-Spalten", mit dem Grund (`list('all')`, E-054/E-056) und dem Hinweis, warum der Satz kein Gattungswort trägt (E-058 Punkt 4). |

### Fremde Dateien, die ich angefaßt habe (Vertragsfolge, Punkt 5 der Aufgabe)

| Datei | Was und warum |
|---|---|
| `apps/local-api/scripts/proof-openapi.mjs:452-466` | Prüfte `poolNames` im Antwortschema der Add-in-Buchungsroute und wurde durch den Vertragswechsel rot. T-101 F1 hat die Zeile ausdrücklich hierher gegeben. Geändert: derselbe Test auf `poolMovement`, mit Kommentar. |
| `apps/local-api/scripts/proof-addin-wiring.mjs:319-323` | Prüfte `Array.isArray(data.poolNames)`. Neu: `poolMovement` ist gesetzt und trägt drei Listen (der gemessene Fall ist die **erste** Buchung auf einem offenen Todo — dort ist `null` falsch). |

Nicht angefaßt: `apps/local-api/src/usecases/**`, `packages/domain/**`, `packages/storage/**`,
`apps/web/**`, `apps/desktop/**`, alle Testordner, `tests/e2e/**`, `docs/**`, `package.json`,
`tsconfig*.json`, die Bauteile der OpenAPI außerhalb der beiden Add-in-Bauteile.
`packages/export/**` war von T-104 nicht berührt.

---

## Zusammenfassung

Die beiden Add-in-Routen liefern die Poolbewegung jetzt in derselben Form wie jede andere Route:
`poolMovement: { appears, enters, leaves } | null`, gerechnet über `bookingMovementStates(todo,
{ hasOpen, hasExported })` und `poolMovementNamer` aus `usecases/pool-movement.ts` — das lokale
`BOOKING_EFFECT` und beide Handpaare sind weg, und mit ihnen die letzte Stelle, an der der
Add-in-Dienst eine Fachaussage über die Wirkung einer Buchung selbst geschrieben hat. Der
Aufgabenbereich liest den Wert unverändert und reicht ihn an `poolMovementSentence` weiter; die
Zusammensetzungsfunktion `offerMovement` ist ersatzlos entfallen, weil ihr Grund (drei gleich
getippte Listen, die man vertauschen kann) mit den Listen verschwunden ist. `null` heißt an den
Add-in-Routen dasselbe wie überall — „hier war keine Bewegung möglich" —, und es tritt genau in
dem Fall ein, in dem `movementOfStart` in `usecases/timer.ts` ebenfalls `null` liefert: offenes
Todo, das schon eine offene Buchung hat. Im Add-in-Abschnitt der OpenAPI sind damit auch W-1 (der
gestrichene Satz „Die Karte bleibt, wo sie ist") und W-15 („die Pools" → „Regeln — Pools wie
Board-Spalten") erledigt.

---

## Nachweis

Alle Läufe gegen den abgelieferten Stand.

| Lauf | Exitcode | Ergebnis |
|---|---|---|
| `pnpm run typecheck` | **0** | acht Projekte plus `typecheck:test` |
| `pnpm run test` | **0** | 50 Dateien, **758 Prüfungen**, 0 rot |
| `pnpm run proof:addin` | **0** | **134 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:openapi` | **0** | **100 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:addin-wiring` | **0** | **32 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:all` (alle 14 Pfade) | **0** | 0 rot |
| `pnpm run boundaries` | **0** | 318 Dateien, Notiz-Trennung unverletzt |
| `pnpm --filter @takt/outlook-addin build` | **0** | Bündel baut (60 Module) |

Kein `test:e2e`-Lauf. Port 17843/17844 war zweimal durch einen fremden Lauf belegt; ich habe
gewartet und wiederholt, keinen fremden Prozess beendet.

**Was `proof:addin` jetzt zusätzlich mißt** (zwei neue Prüfungen innerhalb bestehender Fälle):
der Schlüsselvergleich an `AddinTodoMatch` (`callNumber, completedAt, exportedSeconds, id,
openSeconds, poolMovement, statusId, tagIds, title`) und an der Buchungsantwort (`doneCleared,
poolMovement, timeEntry, todoWasDone`). Ein Treffer, der **beide** Formen trüge, sähe an jeder
inhaltlichen Prüfung grün aus; der Schlüsselvergleich ist die einzige Stelle, an der „eine Form"
tatsächlich gemessen wird.

Zwei Prüfungen messen jetzt `null` statt dreier leerer Listen — beide Male der Fall „dieselbe
Frage ein zweites Mal, nachdem die Bewegung geschehen ist" (`proof-addin.mjs`, Abschnitt 12).

---

## Annahmen

**1. `null` an den Add-in-Routen heißt dasselbe wie an den Timer-Routen — und nie beim
Wiederöffnen.**
E-061 Punkt 3 schreibt die Form vor (`… | null`), nicht die Bedingung. Ich habe die aus
`movementOfStart` übernommen: gerechnet wird, wenn die Buchung „Erledigt" aufhebt **oder** die
erste abgeschlossene Buchung entsteht; sonst `null`. Das ist deckungsgleich mit „die beiden
Zustände des Paares sind verschieden" — `bookingMovementStates` setzt `completedAt: null` und
`hasOpenEntries: true`, also sind sie genau dann gleich, wenn das Todo offen ist und schon eine
offene Buchung hat.

Zwei Folgen, beide gewollt:

- Für ein **erledigtes** Todo steht immer ein Wert da. Das ist die Bedingung dafür, daß der
  Wiederöffnen-Satz (Anlaß `'reopen'`, der auch ohne jeden Treffer etwas zu sagen hat) nicht
  verlorengeht.
- Der Normalfall — zweite und jede weitere Buchung auf demselben Todo — löst **keine** Regel
  mehr über ihre Ordnerbäume auf. In `bookOnTodo` steht die Entscheidung vor dem Namensgeber; in
  `findMatches` entsteht der Namensgeber **verzögert** und höchstens einmal je Anfrage (ein
  gemerktes Versprechen, zugewiesen vor jedem `await`, damit die nebenläufig beurteilten Treffer
  ihn teilen). Vorher wurde er unbedingt gebaut.

Für die Anzeige ändert sich dadurch nichts: In genau diesem Fall gab `poolMovementSentence` mit
Anlaß `'booking'` schon vorher `null` zurück, weil `enters` und `leaves` leer waren. Der einzige
Wert, der an dieser Stelle **nicht** mehr über die Leitung geht, ist `appears` — der Zustand
danach —, und den zeigt der Aufgabenbereich für eine Buchung ohne Wirkung ohnehin nicht an.

**2. Die Wiederöffnen-Auskunft bleibt bei genau drei Sätzen; `null` bekommt dort eine benannte
Vorsichtsfassung.**
`ReopenNotice.effects` ist ein Dreitupel, und „fällt einer weg, ist es wieder eine halbe
Auskunft" steht so im Quelltext. Da der Typ des Feldes jetzt `PoolMovement | null` ist, mußte der
unerreichbare Fall trotzdem behandelt werden. Er wird auf `NOTHING_MOVED = { appears: [],
enters: [], leaves: [] }` abgebildet, mit ausgeschriebener Begründung: Der Satz daraus verspricht
**kein** Wiederauftauchen und nennt keinen Namen, den niemand geprüft hat — ein Todo, das nirgends
angekündigt wird und dann doch auftaucht, sucht niemand vergeblich; umgekehrt schon. Die
Alternative — den dritten Satz bei `null` weglassen — hätte eine dokumentierte Zusage für einen
Fall aufgeweicht, den der Dienst nicht erzeugen kann.

**3. `PoolMovement` wird in `apps/outlook-addin/src/api/types.ts` aus `@takt/domain` importiert,
nicht abgeschrieben.**
Der Dateikopf verbietet Importe aus der Domäne mit zwei Gründen; beide treffen auf diesen Typ
nicht zu (keine markierten Kennungen, und der Wert wird unverändert an `poolMovementSentence`
weitergereicht — dieselbe Funktion, die das Add-in seit E-058 ohnehin ruft). `import type`
bringt zur Laufzeit nichts ins Bündel; `pnpm run boundaries` bleibt grün. Eine vierte Abschrift
hätte sich still von der Domäne entfernen können — dieselbe Falle, die T-092 an `offerMovement`
begründet hat.

**4. `bookingMovement` ist eine Funktion in `routes/addin/service.ts` und nicht im
Anwendungsfall.**
Was sie enthält, ist die **Null-Entscheidung** dieser beiden Routen, und die steht bei den
Timer-Routen ebenso lokal (`movementOfStart`, `movementOfBooking` in `usecases/timer.ts`). Die
Rechnung selbst — Wirkung und Zustandspaar — kommt vollständig aus `packages/domain` und
`usecases/pool-movement.ts`; hier steht keine Achse mehr.

**5. Zwei fremde Nachweisskripte minimal nachgezogen.**
`proof-openapi.mjs` und `proof-addin-wiring.mjs` liegen in `apps/local-api/scripts/` und damit
außerhalb meiner Hoheitstabelle, sind aber durch den Vertragswechsel rot geworden; Punkt 5 der
Aufgabe verlangt, die Skripte mit den alten Feldnamen nachzuziehen, und T-101 F1 hat die Zeile in
`proof-openapi.mjs` ausdrücklich übergeben. Geändert ist je ein Prüfblock, keine Struktur. **Als
Abweichung gemeldet.**

---

## Risiken

**R1 — Der Vertrag der beiden Add-in-Routen bricht, und zwar absichtlich.** Ein Aufrufer, der
`poolNames` liest, bekommt `undefined` und nicht die halbe Wahrheit. Das ist die Ablösung, die
E-061 Punkt 4 in dieser Welle vorsieht; betroffen sind außer dem Aufgabenbereich nur die unten
genannten fremden Dateien. Der Vertrag steht in der OpenAPI (`AddinTodoMatch`, Antwort von
`createAddinTimeEntry`) und wird von `proof:openapi` gegen die echten Antworten gemessen.

**R2 — `appears` fehlt an der Vorschau, wenn nichts sich bewegt.** Siehe Annahme 1. Heute zeigt
der Aufgabenbereich diesen Wert in dem Fall nicht an. Sollte eine spätere Fläche „wo steht das
Todo gerade" beantworten wollen, ist das eine **andere** Frage als die Bewegung, und sie gehört
dann als eigenes Feld beantwortet und nicht als Nebenwirkung dieser Rechnung.

**R3 — Das eingecheckte Aufgabenbereich-Bündel unter `apps/desktop/src-tauri/taskpane/assets/`
ist veraltet.** Es trägt die alten Feldnamen (`index-D9Xu0OQL.js`). Es ist ein Bauartefakt aus
`apps/desktop/scripts/build-taskpane.mjs` (fremde Hoheit) und wird von keinem Nachweispfad gegen
die Quelle gehalten. `pnpm --filter @takt/outlook-addin build` läuft grün; das Nachziehen des
Bereitstellungsordners gehört zu `apps/desktop`.

**Sicherheit.** Keine neue Fläche nach außen: Es geht kein Feld hinzu, es gehen zwei weg, und
kein Wert wechselt seine Klasse — es sind weiterhin ausschließlich Regelnamen aus dem eigenen
Bestand (Bedrohungsmodell 15.3 gilt unverändert). Die Notiz-Trennung ist unberührt:
`AddinTodoMatch` trägt keinen Vermerk, `proof:addin-wiring` Abschnitt 5 mißt das weiter
(„auch das Duplikatangebot trägt ihn nicht"), `pnpm run boundaries` meldet die Notiz-Trennung
unverletzt. Testdaten sind unverändert erfunden (`TCK-…`, „Musterbetrieb", „Wartung Nord"); es
sind keine neuen hinzugekommen. Die Verzögerung des Namensgebers in `findMatches` verkleinert die
Arbeit je Anfrage, sie vergrößert sie nie.

---

## Offene Fragen

**F1 — Fremde Dateien, die durch den Vertragswechsel rot werden. Ich habe sie nicht angefaßt.**

| Datei und Zeile | Was zu tun ist | Hoheit |
|---|---|---|
| `tests/e2e/support/api.ts:570-572` (Treffer), `:595-597` (Buchungsantwort) | Die drei Listenfelder durch `poolMovement: PoolMovementNames \| null` ersetzen — dieselbe Gestalt, die die Datei für Start/Stopp/`done` schon führt | e2e-tester |
| `tests/e2e/pool-movement-sentence.spec.ts:136-138`, `:148-150` | `previewMovement`/`bookedMovement` sind jetzt `match.poolMovement` bzw. `booked.poolMovement`, unverändert durchgereicht. Beide Fälle laufen auf einem **erledigten** Todo, der Wert ist dort nie `null` | e2e-tester |
| `tests/e2e/pool-movement-sentence.spec.ts:232-234`, `:243-245` | `expect(match.poolMovement).toEqual({ appears: [], enters: [], leaves: [] })` statt dreier Erwartungen; das Todo ist `markTodoDone`, also nicht `null` | e2e-tester |
| `tests/e2e/pool-movement-sentence.spec.ts:120-124` | Kommentar nennt die drei Listen | e2e-tester |
| `docs/testplan.md:2313-2314` | Schritt 3 beschreibt das Zusammensetzen aus drei Listen; es entfällt | e2e-tester |
| `docs/bedrohungsmodell.md:2403-2404`, `:2638-2639` | Beschreiben die Add-in-Antwort mit den drei Namenslisten und mit `routes/addin/index.ts:367/373/379` | security-checker |
| `apps/local-api/scripts/service-scenario.mjs:757` | Kommentar nennt `poolNames`; nur Prosa, der Ablauf selbst bleibt gültig (das Todo wird vorher erledigt gesetzt, die Bewegung ist also nicht `null`) | domain-dev |

Kein Einheitentest unter `packages/*/test` oder `apps/*/test` ist betroffen; `pnpm run test` ist
grün (758).

**F2 — `PoolMovement` in der OpenAPI zählt die liefernden Routen auf, und die Aufzählung ist
unvollständig.** `apps/local-api/openapi/takt-local-api.yaml:4123`: „Geliefert wird die Bewegung
von drei Vorgängen: `POST /timer/start`, `POST /timer/stop` und
`POST /timer/orphaned/resolve`." Seit T-101 liefern auch `PUT`/`DELETE /todos/{todoId}/done`,
seit T-104 auch `GET /addin/todo-matches` und `POST /addin/todos/{todoId}/time-entries`. Das
Bauteil liegt außerhalb der beiden Add-in-Bauteile und damit in der Hoheit des domain-dev — ich
habe es stehen gelassen. **Bitte an domain-dev.**

**F3 — Der Anlaß steht weiterhin nicht im Rumpf, sondern folgt aus dem Zustand.** Am Add-in
entscheidet ihn `todoWasDone`/`isDone` (`'reopen'` bzw. `'booking'`, E-058 Punkt 5) — dieselbe
Lage wie an den Timer- und `/done`-Routen (T-101 F2). Ich halte das für richtig; wenn der
Orchestrator die Zuordnung lieber im Rumpf hätte, wäre es ein Feld und eine Zeile, aber die
zweite Stelle, an der derselbe Satz entschieden wird.

---

## Nächster Schritt

1. **e2e-tester:** die vier Stellen aus F1 in `tests/e2e/**` nachziehen; danach läuft
   `pool-movement-sentence.spec.ts` wieder. Der neue Fall, den es zu messen gäbe: dieselbe
   Add-in-Route auf einem **offenen** Todo mit bestehender offener Buchung liefert
   `poolMovement: null`, und der Aufgabenbereich zeigt keine Zeile.
2. **security-checker:** `docs/bedrohungsmodell.md` 15.x auf die neue Form ziehen (F1). Die
   Bewertung selbst ändert sich nicht — dieselbe Klasse Auskunft, ein Feld statt dreier.
3. **domain-dev:** F2, ein Absatz im Bauteil `PoolMovement`.
4. **Orchestrator:** Abweichung aus Annahme 5 zur Kenntnis nehmen (zwei Prüfblöcke in
   `apps/local-api/scripts/`), und entscheiden, wann `apps/desktop/src-tauri/taskpane/` neu
   gebaut wird (R3).
