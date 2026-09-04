# T-107 — Buchung von Hand mit Poolbewegung, Reviewer-Hinweise im Dienst und in der Domäne

Aufgabe: T-107 — Buchung von Hand mit Poolbewegung, Reviewer-Hinweise im Dienst und in der Domäne
Status: braucht Review

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/kernel.ts` | `TaktFieldError.name?: string` (W-11), mit Begründung am Typ |
| `packages/domain/src/pool-movement.ts` | W-8: die falsche Begründung „zwei Pools dürfen denselben Namen tragen" ersetzt |
| `packages/domain/src/board.ts`, `todo.ts`, `tag.ts` | W-13: „Regel über Tags" → Regel mit fünf Achsen |
| `packages/storage/src/sqlite/mappers.ts` | `poolReference` liefert `name` neben `field`, `code`, `message` |
| `packages/storage/src/ports.ts` | Vertrag von `TagFolderPort.remove` um `name` ergänzt; W-13 |
| `packages/storage/src/sqlite/repo-tags.ts`, `repo-statuses.ts` | W-13 |
| `apps/local-api/src/usecases/timer.ts` | `CreatedTimeEntry`, `createTimeEntry` liefert `poolMovement` (O-V) |
| `apps/local-api/src/routes/time.ts` | `POST /time-entries` antwortet mit `entryAfterBooking(...)` |
| `apps/local-api/src/usecases/pool-movement.ts` | Tabelle im Kopf um die neue Aufrufstelle ergänzt; W-8 |
| `apps/local-api/src/usecases/board.ts` | W-13 |
| `apps/local-api/src/http/input.ts` | Hinweis: der Regelname reist jetzt auch als eigenes Feld |
| `apps/local-api/openapi/takt-local-api.yaml` | `TimeEntryAfterBooking` neu; `createTimeEntry`-Antwort und -Beschreibung; `PoolMovement`-Aufzählung (T-104 F2) und W-8; `ErrorEnvelope.details[].name` (W-11); W-13 an drei Stellen |
| `apps/local-api/scripts/service-scenario.mjs` | Prosa (`poolNames` → `poolMovement`); ein frisches Todo mit **erster** Buchung von Hand |
| `apps/local-api/scripts/proof-openapi.mjs` | fünf neue Prüfungen: beide Zweige von `POST /time-entries`, flache Gestalt, Satz, `details[].name` |
| `docs/architektur.md` | 5.3 Fehlerformat um `name`; Abschnitt zur Poolbewegung um `POST /time-entries` |
| `docs/datenmodell.md` | W-13 an fünf Stellen; Vertrag `details` um `name` |

---

## Zusammenfassung

`POST /time-entries` liefert jetzt `poolMovement` neben der Buchung, flach im selben Rumpf wie
`PUT`/`DELETE /todos/{todoId}/done` das Todo liefern, gerechnet in derselben Transaktion und mit
demselben Anlaß `'booking'` wie der Timerstopp. Der Belegfehler aus W-8 ist an drei Stellen
richtiggestellt — `ux_pool_name` ist UNIQUE NOCASE seit Migration 0001 und wird von keiner
späteren Migration aufgehoben, die Bauart „Regeln statt Namen vergleichen" steht seitdem auf drei
tragfähigen Gründen statt auf einem falschen. `TaktFieldError` trägt zusätzlich `name`; der
einzige Ort, der `details` mit Regelnamen bildet, ist `poolReference` in `mappers.ts`, und über
ihn erben alle drei Sperren (Tag, Ordner, Status) das Feld. „Regel über Tags" ist in allen zwölf
Vorkommen meiner Hoheit richtiggestellt; die Migrationen 0009/0010 und ihre Beschreibung in
`datenmodell.md` bleiben als Geschichtsschreibung stehen, nur ausdrücklich als solche kenntlich.

**Eine fachliche Abweichung vom Wortlaut der Aufgabe, siehe Offene Frage 1**: Die Route rechnet
mit `closedEntryMovementStates` und nicht mit `bookingMovementStates`.

---

## Der Vertrag, den andere Hoheiten brauchen

### 1. `POST /time-entries` (frontend-dev, e2e-tester)

**Antwort 201, unverändert flach, ein Feld mehr:**

```jsonc
{
  "data": {
    "id": "…", "todoId": "…", "startedAt": "…", "endedAt": "…",
    "durationSeconds": 1200, "note": "…", "exportStatus": "open",
    "exportCount": 0, "source": "manual", "createdAt": "…", "updatedAt": "…",
    "poolMovement": { "appears": ["…"], "enters": ["…"], "leaves": [] }   // oder null
  }
}
```

* `poolMovement` ist **immer da**, `null` oder drei Listen. `null` heißt „hier war keine Bewegung
  möglich": Das Todo hatte bereits eine abgeschlossene, offene Buchung.
* Der Anlaß ist `'booking'`, die Zeitform `'past'`:
  `poolMovementSentence(movement, 'past', 'booking')`. Ergebnis kann `null` sein (nichts zu
  sagen); dann bleibt die Zeile weg — genau wie am Stopp (E-058 Punkt 6).
* Titel bleibt „Zeit gebucht." (`BookingDialogs.tsx:107`), Rumpf bleibt „Die Buchung liegt auf
  „X“."; der Bewegungssatz kommt als zweite Zeile darunter, wie am Stopp.
* `PATCH /time-entries/{id}` trägt das Feld **nicht** und soll es nicht bekommen.
* Kein bestehender Aufrufer bricht: Das Feld kommt hinzu, nichts wird umgehängt. `pnpm proof:callers`
  und `typecheck:e2e` sind grün.

### 2. `details[].name` (frontend-dev)

```jsonc
{ "error": { "code": "tag_in_use",
  "message": "Dieses Tag wird in der Regel eines Pools verwendet.",
  "details": [
    { "field": "pool-1", "code": "pool_rule", "name": "Ost",  "message": "Regel „Ost“" },
    { "field": "pool-2", "code": "pool_rule", "name": "Nord", "message": "Regel „Nord“" }
  ] } }
```

* **Rein additiv.** `message` ist Zeichen für Zeichen dasselbe wie vorher. `errorText.ts:98-104`
  bleibt gültig, solange niemand es anfaßt.
* `name` ist der **bloße** Name: ohne Gattungswort, ohne Anführungszeichen. Wer will, setzt daraus
  „Betroffen sind die Regeln „Ost“, „Nord“ und „Abrechnung“." — die Fassung, die R-2a in W-11 als
  besseres Deutsch bezeichnet.
* `name` ist **freiwillig** (`name?: string`). Ein Befund über ein Eingabefeld trägt keinen; eine
  Oberfläche, die `name` liest, muß den Fall `undefined` behandeln und dann `message` nehmen.
* Es gibt keinen leeren Namen. Fehlt der Name, fehlt das Feld.
* Geliefert von allen drei Sperren, die eine Regel nennen: `TagPort.remove`,
  `TagFolderPort.remove`, `TodoStatusPort.remove` — sie teilen sich `poolReference`.
* Die Obergrenze aus H-3 (T-101) bleibt unangetastet: höchstens zwanzig Regeln, der Hinweis auf
  mehr steht weiter im `message` der Hülle und nicht in `details`.
* **T-097 Annahme 1 gilt weiter**: Die Oberfläche schneidet nichts aus fremdem Text heraus. Das
  Feld existiert genau deshalb.

---

## Annahmen

1. **Ich habe `closedEntryMovementStates` genommen und nicht `bookingMovementStates`.** Siehe
   Offene Frage 1. Die Wirkung ist an einem **nicht** erledigten Todo Zeichen für Zeichen dieselbe
   — die beiden Funktionen unterscheiden sich nur in der Erledigt-Achse.
2. **Der Rumpf bleibt flach.** `{ ...entry, poolMovement }` statt `{ entry, poolMovement }`, wie
   `doneBody` in `routes/todos.ts` und aus demselben Grund: Ein Umbau hätte jeden vorhandenen
   Aufrufer gebrochen und dieselbe Auskunft gegeben.
3. **Die falsche Begründung aus W-8 stand auch in der OpenAPI** (Bauteil `PoolMovement`), nicht nur
   an den beiden von R-2a genannten Codestellen. Ich habe sie dort mit richtiggestellt — dieselbe
   Aussage an drei Orten, und zwei davon zu berichtigen wäre halb.
4. **W-13 habe ich vollständig in meiner Hoheit erledigt**, also auch die fünf Vorkommen, die
   R-2a nicht aufzählt (`packages/storage/src/ports.ts:295`, `repo-tags.ts:594`,
   `repo-statuses.ts:4`, `docs/datenmodell.md:233`, `:1814`). `docs/architektur.md:335` und die
   OpenAPI-Stelle „keine Poolregel" (:3030) waren bereits richtig; dort blieb nichts zu tun.
   `datenmodell.md:1814` beschreibt die Begründung von Migration 0009 und ist jetzt ausdrücklich
   als damaliger Stand markiert („war damals"), statt als heutige Definition zu lesen.
5. **Ich habe `proof:openapi` erweitert statt nur grün zu halten.** Der Durchlauf buchte bisher nur
   auf ein Todo, das längst eine offene Buchung hatte — dort ist `poolMovement` immer `null`, und
   eine Fassung, die *nie* etwas berichtet, wäre grün geblieben. Der Bestand hat jetzt ein frisches
   Todo („Akte 4714 — Nachtrag von Hand"), auf das von Hand gebucht wird, **nach** dem Exportlauf,
   damit kein bereits berichteter Bestand sich ändert. Beide Zweige sind gemessen.
6. **`tag_name_ambiguous` (`usecases/tag-names.ts:177`) hat kein `name` bekommen.** W-11 spricht von
   Regelnamen; dort steht ein **Tagname** in einem anderen Satzbau, und das Add-in liest ihn heute
   nicht als eigenes Feld. Additiv nachrüstbar, wenn jemand es braucht.
7. **`docs/benutzerhandbuch.md:119,169` („keine Poolregel") habe ich nicht angefaßt** — Hoheit des
   Dokumentierers.

---

## Risiken

1. **Ein Einheitentest ist durch den Vertragswechsel rot** und gehört dem unit-tester:

   ```
   packages/storage/test/mappers.test.ts:362
     poolReference — ein einzelner Regelverweis für `details`
     erwartet { field, code, message }, bekommt zusätzlich name: 'Abrechnung'
   ```

   `toEqual` mit dem vollständigen Objekt. Die Erwartung ist um `name: 'Abrechnung'` zu ergänzen.
   Sonst ist `pnpm test` grün: 757 von 758.

2. **`pnpm typecheck` ist rot, und zwar in fremder Hoheit.** `apps/web` ist gerade in Arbeit
   (frontend-dev, parallele Welle). Gemessen:

   ```
   apps/web/src/showcase/BoardSection.tsx(1,37)   TS6133 'PoolMovement' nie gelesen
   apps/web/src/showcase/BoardSection.tsx(3,1)    TS6133 'useToasts' nie gelesen
   apps/web/src/showcase/BoardSection.tsx(178,7)  TS2304 Name 'toasts' nicht gefunden
   apps/web/src/showcase/BoardSection.tsx(181,36) TS2304 Name 'movementOf' nicht gefunden
   apps/web/src/showcase/BoardSection.tsx(185,26) TS2304 Name 'toasts' nicht gefunden
   ```

   Keine davon rührt von mir her; ich habe in `apps/web` keine Zeile geändert. Meine drei Pakete
   sind einzeln grün (`pnpm --filter @takt/domain --filter @takt/storage --filter @takt/local-api
   typecheck`, Endstatus 0), ebenso `tsc -p tsconfig.json --noEmit`, `pnpm run typecheck:test` und
   `pnpm run typecheck:e2e`.

3. **Sicherheit: der Regelname geht jetzt als eigenes, unumhülltes Feld heraus.** Bisher stand er
   eingebettet in einen deutschen Satz; eine Oberfläche, die ihn ohne umgebenden Text setzt, setzt
   ihn roher. Die einzige Wache dagegen ist die Namensprüfung beim Anlegen
   (`apps/local-api/src/http/input.ts`, R-3a H-2: C0/C1-Steuerzeichen und bidirektionale
   Formatierungszeichen werden abgewiesen). Ich habe den Kommentar dort um diesen Weg ergänzt.
   Neue Klasse ist es keine — derselbe Name reist seit T-089 im Bewegungssatz an beide Flächen —,
   aber der security-checker sollte es zur Kenntnis nehmen. React maskiert beim Setzen; ein
   `dangerouslySetInnerHTML` auf `details[].name` wäre der Fehler, der hier teuer würde.
4. **Kein Geheimnis, kein Pfad, keine Kundendaten kommen hinzu.** `name` ist derselbe Wert, den
   `GET /pools` ohnehin liefert (B-2.4).
5. **Der Bestand des Prüfdurchlaufs ist um ein Todo und eine Buchung gewachsen.** Alle abgeleiteten
   Prüfungen (Board gegen Buchungsliste, Regel gegen Abfrage) lesen den Bestand, statt ihn
   anzunehmen, und sind grün; der Exportlauf liegt davor und bleibt unberührt.

---

## Offene Fragen

### 1. (Entscheidend) `POST /time-entries` und das Erledigt-Kennzeichen — O-V präzisieren

Der Nachtrag zu E-061 sagt zweierlei, was nicht zusammengeht:

> „… liefert deshalb `poolMovement` nach derselben Rechnung (`bookingMovementStates`) und mit
> demselben Anlaß `'booking'` **wie der Timerstopp**"

Der Timerstopp rechnet mit `closedEntryMovementStates` (`ENTRY_CLOSED_EFFECT`), nicht mit
`bookingMovementStates` (`BOOKING_EFFECT`). Der Unterschied ist genau eine Achse:
`BOOKING_EFFECT` setzt zusätzlich `completedAt: null` — „Buchen hebt „Erledigt" auf".

**Der Befund.** `POST /time-entries` hebt „Erledigt" **nicht** auf. `TimeEntryPort.create`
(`packages/storage/src/sqlite/repo-time.ts:174-188`) schreibt eine Zeile in `time_entry` und sonst
nichts; kein Trigger faßt `todo.completed_at` an (geprüft: keine Migration legt einen an). Die
Buchung aus dem Add-in verhält sich anders — dort steht `clearDone` ausdrücklich in derselben
Transaktion (`routes/addin/service.ts:593-600`).

Mit `bookingMovementStates` meldete die Route für ein **erledigtes** Todo also ein Verlassen jeder
Spalte `completion: 'done'`, das nicht stattfindet: Der Benutzer läse „… und ist aus „Erledigt“
verschwunden.", während die Karte danebensteht. Das ist wörtlich der Fehler, gegen den
`ENTRY_CLOSED_EFFECT` in T-101 eingeführt wurde. Die Begründung des Nachtrags selbst nennt
ausschließlich `hasOpenEntries` — also genau `ENTRY_CLOSED_EFFECT`.

**Was ich getan habe.** `closedEntryMovementStates`, über die vorhandene `movementOfBooking`, die
schon `POST /timer/stop` und `POST /timer/orphaned/resolve` bedienen. Damit stimmt der Satz mit
dem Bestand überein, gleich wie die Frage beantwortet wird — er sagt höchstens weniger, nie etwas
Falsches. Die Begründung steht ausgeschrieben an `CreatedTimeEntry` in `usecases/timer.ts`.

**Der Unterschied in der Antwort.** Er tritt **nur** bei einer Buchung von Hand auf ein erledigtes
Todo auf. Bei jedem unerledigten Todo sind beide Rechnungen zeichengleich.

| | `closedEntryMovementStates` (jetzt) | `bookingMovementStates` |
|---|---|---|
| `null`, wenn | `presence.hasOpen` | `presence.hasOpen && completedAt === null` |
| erledigtes Todo, erste Buchung | betritt `exportState: 'open'`-Spalten; `leaves` leer | zusätzlich `leaves` = alle `completion: 'done'`-Spalten, `enters` = alle `completion: 'open'`-Spalten |

**Die Frage an den Orchestrator.** Welches der beiden ist gewollt?

* **(A) So, wie gebaut.** Der Nachtrag meint „dieselbe Rechnung wie der Timerstopp", die Klammer
  `(bookingMovementStates)` ist ein Versehen. Dann ist nichts zu tun; der Nachtrag sollte die
  Klammer verlieren.
* **(B) Die Buchung von Hand hebt „Erledigt" auf**, wie die des Add-ins. Dann ist das eine
  **Verhaltensänderung** und keine Auskunftsfrage: `createTimeEntry` müßte `todos.clearDone` in
  derselben Transaktion rufen, das Ergebnis (wie bei `/done`) mitliefern, und erst dann wäre
  `bookingMovementStates` richtig. Deckung dafür sehe ich in A-2.5 nicht — dort steht „Wird die
  Zeiterfassung … erneut **gestartet**" —, sie bräuchte eine eigene Entscheidung. Betroffen wären
  dann `usecases/timer.ts` (ich), `apps/web` (Toast, Listenauffrischung), `tests/e2e` und
  `docs/testplan.md`.

Bis zur Antwort ist der Zustand konsistent und gemessen; (B) kostet danach eine Zeile hier und
eine Transaktion dort.

### 2. `PATCH /time-entries/{id}` kann die Achse sehr wohl umlegen — an **zwei** Todos

Die Aufgabe sagt „Der Zeitraum-`PATCH` bewegt nichts", und für Zeitraum und Leistung stimmt das.
`updateEntrySchema` erlaubt aber auch `todoId` (`routes/time.ts:56-61`,
`UpdateTimeEntryInput.todoId`). Wird eine Buchung auf ein anderes Todo umgehängt und war sie die
einzige des alten, verliert das alte Todo „hat offene Buchungen" und das neue gewinnt es — zwei
Bewegungen in entgegengesetzte Richtungen an zwei verschiedenen Todos. Das paßt nicht in ein
`poolMovement`, das über **ein** Todo redet.

Ich habe nichts geändert und die OpenAPI schreibt jetzt ausdrücklich, daß `PATCH` das Feld nicht
trägt. Ob das Umhängen überhaupt eine Auskunft schuldet — und in welcher Gestalt —, ist eine
Frage an den Auftraggeber, nicht an mich. Falls ja, wäre die ehrliche Form zwei Felder
(`from`/`to`) und nicht eines.

### 3. Soll `tag_name_ambiguous` ebenfalls `name` tragen?

Siehe Annahme 6. Eine Zeile in `usecases/tag-names.ts`, additiv, ohne Wirkung auf Bestehendes.
Ich habe es gelassen, weil W-11 von Regelnamen spricht und niemand danach gefragt hat.

---

## Nächster Schritt

1. **Orchestrator:** Offene Frage 1 beantworten. Bei (A) den Klammerzusatz im Nachtrag zu E-061
   auf `closedEntryMovementStates` richtigstellen, damit die nächste Aufgabe nicht dieselbe
   Widersprüchlichkeit erbt.
2. **unit-tester:** `packages/storage/test/mappers.test.ts:362` um `name: 'Abrechnung'` ergänzen.
   Dazu die zwei Fälle, die es zu messen gäbe: `createTimeEntry` auf einem Todo **ohne** Buchung
   (Bewegung) und **mit** offener Buchung (`null`) — heute nur im Dienstdurchlauf gemessen,
   nicht als Einheitentest.
3. **frontend-dev:** den Bewegungssatz im Toast „Zeit gebucht." nach der Buchung von Hand
   (`BookingDialogs.tsx:106-107`), Vertrag oben unter 1. Und `errorText.ts:98-104` auf
   `details[].name` umstellen, Vertrag oben unter 2 — mit dem Rückfall auf `message`, wenn `name`
   fehlt.
4. **e2e-tester:** ein Fall für `POST /time-entries` auf einem Todo ohne Buchung, samt Toastzeile;
   und die Gegenprobe auf einem Todo mit offener Buchung (keine Zeile).
5. **security-checker:** Risiko 3 zur Kenntnis nehmen — `details[].name` als neue, unumhüllte
   Ausgabestelle desselben Namens.

---

## Befehle und Endstatus

| Befehl | Endstatus |
|---|---|
| `tsc -p tsconfig.json --noEmit` | 0 |
| `pnpm --filter @takt/domain --filter @takt/storage --filter @takt/local-api typecheck` | 0 |
| `pnpm run typecheck:test` | 0 |
| `pnpm run typecheck:e2e` | 0 |
| `pnpm typecheck` | **2** — allein `apps/web/src/showcase/BoardSection.tsx`, fremde Hoheit, siehe Risiko 2 |
| `pnpm test` | **1** — 757/758, allein `packages/storage/test/mappers.test.ts:362`, siehe Risiko 1 |
| `pnpm proof:openapi` | 0 — 105 bestanden, 0 fehlgeschlagen (vorher 100) |
| `pnpm proof:all` | 0 |
| `pnpm boundaries` | 0 — „Notiz-Trennung: alle Schichten unverletzt" |
