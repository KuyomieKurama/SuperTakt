Aufgabe: T-050 — `neuerParentId` → `newParentId` in `apps/web/src/api/endpoints.ts`. Dazu prüfen,
ob die Oberfläche weitere deutsche Feldnamen in Anfragerümpfen sendet, und das Verschieben eines
Tag-Ordners am laufenden Dienst nachweisen statt am Typ.

Status: fertig

---

Artefakte:

```
GEÄNDERT
apps/web/src/api/endpoints.ts          621 (+28) — drei Feldnamen berichtigt, zwei veraltete
                                       Abweichungsvermerke richtiggestellt, ein Kopfabsatz zur
                                       Herkunft der Feldnamen
apps/web/src/app/StructureContext.tsx  194 — der einzige Aufrufer von `listPoolTodos` folgt der
                                       geänderten Option
```

`apps/local-api/**`, `packages/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `docs/**` und
`apps/web/test/**` (existiert nicht): **unangetastet**. Kein `any`, keine Typzusicherung, kein
neues Paket, `pnpm-lock.yaml` unverändert. Das Prüfskript für den Nachweis liegt außerhalb des
Repos im Kritzelverzeichnis und ist kein Artefakt.

---

Zusammenfassung:

**1 — Es war nicht einer, es waren drei. Zwei davon haben Funktionen unbenutzbar gemacht.**

Der gemeldete Fehler stimmt und ist behoben. Die geforderte Suche nach weiteren deutschen
Feldnamen hat aber zwei weitere gefunden, und einer davon ist **derselbe Fehler mit derselben
Wirkung an einer anderen Stelle**:

| Stelle | gesendet | vom Dienst gelesen | Wirkung vor T-050 |
|---|---|---|---|
| `POST /tag-folders/{id}/move` | `neuerParentId` | `newParentId` | **422**, S-08 konnte keinen Ordner verschieben |
| `PUT /todo-statuses/order` | `reihenfolge` | `order` | **422**, A-5.4 konnte keine Spalte umsortieren |
| `GET /pools/{id}/todos` | `nurOffene` | `includeCompleted` | still wirkungslos, siehe Punkt 3 |

`reihenfolge` war nicht gemeldet. Er steht neun Zeilen über `neuerParentId` in derselben Datei und
hat dieselbe Herkunft — beide sind Reste aus der Zeit vor T-013b. `statusOrderSchema` verlangt
`order` mit `min(1)`; ein Rumpf ohne diesen Schlüssel fällt nicht auf einen Standardwert zurück,
sondern wird abgewiesen. **Die Pfeile „nach links"/„nach rechts" in der Spaltenverwaltung des
Kanban-Boards haben nie etwas bewirkt.** Am laufenden Dienst nachgemessen, Punkt 4.

Das ist der eigentliche Ertrag dieser Aufgabe: Der gemeldete Befund war die Spitze. Wer nur die
eine Zeile geändert hätte, hätte eine zweite kaputte Funktion stehen lassen, die durch dieselben
Netze gefallen ist.

**2 — Warum der Typecheck nichts merkt, in einem Satz.**

`body` ist ein Objektliteral gegen einen `unknown`-förmigen Parameter. Ein Schlüssel, den niemand
liest, ist typkorrekt. Deshalb steht jetzt im Kopf von `endpoints.ts` ein Absatz, der genau das
sagt, mitsamt der Anweisung, einen neuen Feldnamen gegen `apps/local-api/src/routes/**`
abzugleichen und nicht gegen das Gedächtnis. Das ist die einzige Sicherung, die diese Datei tragen
kann, solange die Rümpfe nicht aus der Beschreibung erzeugt werden.

**3 — `nurOffene` war eine Falle, keine Störung.**

`GET /pools/{id}/todos` liest `includeCompleted` und blendet erledigte Todos ohne Angabe aus
(E-039). Die Oberfläche schickte `nurOffene=true` — ein Name, den der Dienst nicht kennt, und der
folglich verworfen wurde. Weil der einzige Aufrufer genau die Vorgabe wollte (nur offene), war das
Ergebnis **zufällig richtig**. Falsch wäre es beim ersten Aufruf mit der anderen Absicht geworden:
`{ onlyOpen: false }` hätte still die offenen Todos geliefert statt aller.

Ich habe den Namen des Dienstes übernommen statt eine Übersetzung zu bauen: `listPoolTodos` nimmt
jetzt `{ includeCompleted?: boolean }` und sendet `includeCompleted=true` nur, wenn es wirklich
gemeint ist. Der einzige Aufrufer — `poolsContaining` in `StructureContext.tsx`, die Auskunft „in
welchen Pools ist dieses Todo jetzt" nach einer Wiederbelebung durch Timerstart (I-05) — steht auf
`{ includeCompleted: false }`. **Auf dem Draht ändert sich für ihn nichts**; die Frage wird zum
Zeitpunkt des Aufrufs an einem gerade wieder offenen Todo gestellt.

**4 — Am laufenden Dienst geprüft, mit Gegenprobe. So:**

Nicht am Typ und nicht nur am grünen Test. Ein Skript außerhalb des Repos startet denselben Dienst
und dieselbe Oberfläche wie `tests/e2e/support/services.ts` (echtes `apps/local-api/src/index.ts`,
eigenes `XDG_DATA_HOME`, echter Vite auf 5173, kein Attrappen-`fetch`), fährt Chromium dagegen und
protokolliert die Rümpfe mit.

*Ordner verschieben:* drei Ordner angelegt, „Wanderer" unter „Heimat". Dann **durch die
Oberfläche** — S-08, Ordner in der Baumzeile ausgewählt, „Verschieben", im Dialog „Ordner
verschachteln" das Feld „Neuer übergeordneter Ordner" auf „Ziel" gestellt, abgeschickt. Danach
`GET /tag-tree` gelesen und den Knoten gesucht:

```
-> POST /tag-folders/…/move  {"newParentId":"01a05da2-4e30-71d8-a6db-9aeb83b0abe8"}
<- 200 {"data":{…,"parentId":"01a05da2-4e30-71d8-a6db-9aeb83b0abe8",…}}
OK  parentId nachher = Ziel, Dialog geschlossen
```

Der Ordner liegt danach dort, wo er soll — nicht nur „der Aufruf ging durch".

*Spalte umsortieren:* Kanban → „Spalten verwalten" → „„Backlog" nach rechts". Danach
`GET /todo-statuses`:

```
-> PUT /todo-statuses/order  {"order":[…]}
<- 200
OK  vorher:  Backlog | In Progress | Waiting | Done
    nachher: In Progress | Backlog | Waiting | Done
```

*`includeCompleted`:* Pool über eine Tag-Regel angelegt, ein Todo mit diesem Tag auf erledigt
gesetzt, dann dreimal gefragt:

```
OK  ohne Parameter = 0 · ?nurOffene=false = 0 (alter Name, ohne Wirkung) · ?includeCompleted=true = 1
```

*Gegenprobe.* Dieselbe Prüfung mit den **alten** Namen wieder eingesetzt:

```
FEHL  Ordner verschieben  — 422 validation_error, details[0].field = "newParentId"
                            Dialog blieb offen, parentId unverändert
FEHL  Spalte umsortieren  — 422 validation_error, details[0].field = "order"
                            Reihenfolge unverändert
```

Damit ist beides belegt: dass die Fehler real waren und dass die Änderung sie behebt.

**5 — Befund, der über diese Aufgabe hinausgeht: `tags-folders.spec.ts` hätte es nicht gefunden.**

Der Auftrag nennt den Testfall als vorbereitet — „er wird grün, sobald die Zeile stimmt". Das ist
richtig, aber es sagt weniger, als es klingt: **Ich habe den Testfall mit dem noch eingebauten
Fehler laufen lassen, und er war grün.**

```
✓ tests/e2e/tags-folders.spec.ts:35 › anlegen, navigieren, Tag und Ordner verschieben,
                                      Zyklus wird abgelehnt (2.1s)   ← mit `neuerParentId`
```

Der Grund steht im Testfall selbst. Der **gelingende** Zug (`moveTagFolder(emptyFolder.id,
level1.id)`, Zeile 58) geht über `tests/e2e/support/api.ts`, und die Hilfsfunktion sendet
`newParentId` selbst — sie fährt am Code von `apps/web` vorbei. Der einzige Zug **durch die
Oberfläche** (Zeile ab „Zyklus-Ablehnung im Verschieben-Dialog") ist der abgelehnte, und er prüft
`getByText('Das hat nicht geklappt')` plus „Dialog bleibt offen". Ein 422 wegen eines unbekannten
Feldnamens sieht an dieser Zusicherung genauso aus wie der erwartete 409 `tag_folder_cycle`.

Es fehlt also weiterhin ein **gelingender** Ordnerzug über die Oberfläche mit anschließender
Nachschau, wo der Ordner liegt. Genau das prüft mein Skript, aber ein Skript im Kritzelverzeichnis
ist kein Netz. `tests/e2e/**` gehört dem e2e-tester; ich habe nichts daran geändert. **Bitte an den
Orchestrator: als Aufgabe an den e2e-tester weiterreichen**, Vorschlag in Punkt 8.

**6 — Was ich sonst noch gesucht und nicht gefunden habe.**

Alle 47 Routenaufrufe der Oberfläche gegen die Zod-Schemata in `apps/local-api/src/routes/**`
abgeglichen, Feld für Feld — nicht nur nach deutschen Wörtern gegrept, sondern jeden gesendeten
Schlüssel gegen den gelesenen gehalten. Todos, Zeitbuchungen, Timer, Export, Vorlagen,
Einstellungen, Standard-Tags, Suche und Protokoll stimmen. `apps/web/src/api/client.ts` ist die
einzige Stelle mit `fetch`; außerhalb von `endpoints.ts` setzt keine Ansicht einen Rumpf zusammen.
`apps/desktop/src/shell.ts` spricht nicht mit dem Dienst.

Zwei **veraltete** Vermerke habe ich dabei richtiggestellt, weil sie in die falsche Richtung
zeigten. In `endpoints.ts` stand, die Beschreibung nenne `q`/`nurOffene` (bei `GET /todos`) und
`vonTag`/`bisTag`/`nurSchonEinmalExportiert` (bei `GET /time-entries`). Seit T-039 stimmt das
nicht mehr: Die Beschreibung nennt dieselben Namen wie die Route. Ein Vermerk, der eine längst
geschlossene Abweichung als bestehend führt, ist gefährlicher als keiner — er lädt dazu ein, den
nächsten deutschen Namen für einen bekannten, geduldeten Sonderfall zu halten. Genau das ist
`neuerParentId` fünf Aufgaben lang gewesen.

**7 — Zwei Beobachtungen, die ich nicht selbst geändert habe.**

Beide liegen im Grenzbereich zwischen `apps/web` und `apps/local-api`; die Behebung gehört nicht
mir. Keine ist ein laufender Fehler.

*a) `POST /todo-statuses` verwirft `color` still.* Die Oberfläche sendet `{ name, color }`,
`statusCreateSchema` ist `{ name, position }`. Zod streift unbekannte Schlüssel ab: kein 422, aber
die Farbe kommt nicht an. Heute unschädlich, weil der einzige Aufrufer (`BoardScreen.tsx:363`)
`null` übergibt und die Farbe danach per PATCH setzbar ist. Wer aber eines Tages eine Farbe beim
Anlegen mitgibt, verliert sie lautlos — dieselbe Bauart wie `nurOffene`. Umgekehrt kennt die
Oberfläche `position` beim Anlegen nicht; jede neue Spalte entsteht auf 0.

*b) `PoolWrite` kennt kein `position`.* `poolCreateSchema` und `poolUpdateSchema` führen es, der
Typ in `apps/web/src/api/types.ts` nicht. Jeder neue Pool entsteht damit auf Position 0, und die
Reihenfolge der Pools ist aus der Oberfläche heraus nicht einstellbar. Ob Pools überhaupt sortierbar
sein sollen, steht in keiner Aufgabe, die ich kenne — deshalb Frage statt Änderung.

**8 — Vorschlag für den Netzschluss (nicht von mir umgesetzt, fremde Dateihoheit).**

- `tests/e2e/**` (e2e-tester): ein gelingender Ordnerzug **über die Oberfläche** mit Nachschau im
  `tag-tree`, und ein Zug der Spaltenreihenfolge über „Spalten verwalten" mit Nachschau in
  `GET /todo-statuses`. Beides fährt heute niemand durch die Oberfläche.
- `apps/local-api/scripts/**` (integration-dev oder domain-dev): `proof:openapi` prüft die
  Beschreibung gegen die Routenschemata. Es gibt keine Prüfung, die die **Aufrufer** einbezieht.
  Ein kleiner Abgleich, der die Objektliterale aus `apps/web/src/api/endpoints.ts` gegen
  `REQUEST_SCHEMAS` hält, hätte alle drei Namen ohne Browser gefunden — und findet den vierten,
  bevor ihn ein Benutzer findet. Das ist die Sicherung, die hier gefehlt hat.

---

Prüfungen:

```
pnpm typecheck    fehlerfrei, alle 8 Projekte
pnpm contrast     0 von 332 Paaren durchgefallen  (unverändert — keine Farbe berührt)
pnpm build        fehlerfrei, alle Projekte
pnpm test         34 Dateien, 556 Tests, alle grün
pnpm exec playwright test -c tests/e2e/playwright.config.ts
                  23 Tests, alle grün
Nachweis am laufenden Dienst (Skript außerhalb des Repos)
                  3 von 3 — Ordnerzug, Spaltenzug, includeCompleted
Gegenprobe mit den alten Namen
                  2 von 3 durchgefallen, beide mit 422 und dem erwarteten `field`
```

Die 332 Paare stehen unverändert: An Farben, Abständen und Auszeichnung hat sich nichts geändert.
Auch die 556 Vitest-Fälle sind unverändert grün — sie waren es mit dem Fehler ebenso, und das ist
der Befund aus Punkt 5, nicht ein Einwand gegen sie.

---

Offene Fragen:

1. **An den Orchestrator / e2e-tester.** Soll der fehlende gelingende Ordnerzug über die
   Oberfläche als eigene Aufgabe laufen? Ich kann ihn nicht schreiben (`tests/e2e/**`), habe ihn
   aber als Skript nachgestellt und weiß, dass er heute fehlt (Punkt 5).
2. **An domain-dev / integration-dev.** Soll `POST /todo-statuses` `color` (und die Oberfläche
   `position`) annehmen, oder soll `createTodoStatus` in `apps/web` den Parameter verlieren, den
   der Dienst wegwirft? Ich habe nichts geändert, weil beide Wege über eine fremde Dateihoheit
   führen (Punkt 7a).
3. **An domain-dev.** Ist die Reihenfolge der Pools eine Größe, die der Benutzer setzen können
   soll? `position` existiert im Dienst, in der Oberfläche nicht (Punkt 7b).
4. **An den Orchestrator.** Der Abgleich aus T-039 hat `neuerParentId` gefunden und als „vom Dienst
   nie gelesen" abgelegt, ohne nach Sendern zu fragen. Lohnt eine Aufgabe, die diese Blickrichtung
   dauerhaft schließt — Aufrufer gegen `REQUEST_SCHEMAS`, im Prüfpfad (Punkt 8)?

---

## Was wo steht — für den Abgleich

| Gegenstand | Wirkung in der Oberfläche | Datei, Zeile |
|---|---|---|
| `newParentId` statt `neuerParentId` | S-08 → Ordner auswählen → „Verschieben" | `api/endpoints.ts`, `moveTagFolder` |
| `order` statt `reihenfolge` | Kanban → „Spalten verwalten" → nach links/rechts | `api/endpoints.ts`, `reorderTodoStatuses` |
| `includeCompleted` statt `nurOffene` | I-05 → Meldung „Es ist zurück in den Pools …" | `api/endpoints.ts`, `listPoolTodos` |
| der einzige Aufrufer davon | — | `app/StructureContext.tsx`, `poolsContaining` |
| Herkunft der Feldnamen, Anweisung | — | `api/endpoints.ts`, Dateikopf |
| richtiggestellte Vermerke zu T-039 | — | `api/endpoints.ts`, `listTodos` und `listTimeEntries` |
