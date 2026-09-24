Aufgabe: T-070 — `todo.board_rank` entfernen. Migration und Tests in einem Zug.

Status: blockiert

**Zustand des Baums in einem Satz:** Die Spalte ist überall weg, wo ich hoheitlich hinreiche —
Migration, Domäne, Adapter, Dienst, Beschreibung, die drei Testdateien, alle Beschriftungen. Elf
der zwölf Nachweispfade sind grün, `verify:bundle` ist grün, 567 Prüffälle sind grün.
**`proof:callers` ist rot**, mit zwei Beanstandungen aus **einer** Ursache, und die liegt in
`apps/web/` — der **vierten** gekoppelten Stelle, die weder in T-066 noch in T-069 noch im Auftrag
stand. Drei Zeilen dort schließen es. Sie stehen ausformuliert in Abschnitt 3.

---

Artefakte:

Neu:

```
packages/storage/migrations/0010_drop_board_rank.up.sql    NEU (67) — zwei DROP INDEX, ein
                                                    DROP COLUMN, ein CREATE INDEX
packages/storage/migrations/0010_drop_board_rank.down.sql  NEU (56) — ADD COLUMN, UPDATE,
                                                    beide Indizes aus 0001 wortgleich zurück
```

Geändert:

```
packages/storage/src/sqlite/migrations.embedded.ts  neu erzeugt (20 Dateien, vorher 18)
packages/domain/src/todo.ts            `Todo.boardRank` und `TodoUpdate.boardRank` samt ihren
                                        beiden „tot"-Beschriftungen entfernt; im Kopf von `Todo`
                                        steht der Wegfall jetzt unter „Was hier bewusst fehlt"
packages/storage/src/sqlite/mappers.ts  `boardRank: text(row, 'board_rank')` aus `toTodo`
packages/storage/src/sqlite/repo-todos.ts  `TODO_COLUMNS`, der INSERT in `create` samt
                                        Rangkommentar, der `boardRank`-Zweig in `update`,
                                        der Sortierkommentar in `list`
packages/storage/src/sqlite/ids.ts     Kopf: `board_rank` war eine der drei Begründungen für
                                        die Zeitsortierbarkeit von UUIDv7 — jetzt stehen die
                                        drei, die es wirklich gibt
apps/local-api/src/routes/todos.ts     `boardRank` aus `updateSchema` und aus der Übergabe
apps/local-api/src/usecases/todos.ts   `UpdateTodoInput.boardRank` und die Übergabe
apps/local-api/openapi/takt-local-api.yaml  `Todo.boardRank` (Feld, `required`, Beschreibung),
                                        `TodoUpdate.boardRank`; im Kopf von `Todo` steht der
                                        Wegfall.
                                        **Kein Zeichen in einem Add-in-Abschnitt** (E-053)
apps/local-api/scripts/proof-openapi.mjs  `boardRank` aus dem Beispielumschlag; die Prüfung
                                        „ein Pflichtfeld tief in einer Liste fällt auf" fährt
                                        jetzt über `statusId`
docs/datenmodell.md                    1 (Objektzählung 34 → 33 Indizes), 3.2, 8.4e (neu),
                                        8.5 (sieben Zeilen), 9 (`ux_todo_rank` raus,
                                        `ix_todo_status` neu benannt)

packages/storage/test/support/migrated-database.ts   ausnahmsweise, laut Auftrag
packages/storage/test/repo-todos.test.ts             ausnahmsweise, laut Auftrag
packages/storage/test/mappers.test.ts                ausnahmsweise, laut Auftrag
```

Die drei Diffs des unit-testers habe ich geprüft statt übernommen; sie passen wörtlich auf meine
Migration und sind unverändert angewandt. Sein Befund 3 (`mappers.test.ts` ist über `text()` an
`toTodo` gekoppelt, nicht bloß kosmetisch) hat sich bestätigt.

`docs/architektur.md` **nicht** geändert: Dort steht kein `board_rank`. Die einzige Stelle, die
das Ziehen erwähnt (Zeile 806, `/board`), sagt bereits, dass es mit E-054 entfallen ist, und ist
weiterhin wahr.

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `tests/e2e/**`, alles Weitere unter `packages/*/test/**`, die Wurzeldateien,
`docs/bedrohungsmodell.md`. Kein `git commit` (kein Git-Verzeichnis in dieser Umgebung).

---

Zusammenfassung:

`todo.board_rank` ist weg, samt `ux_todo_rank` und dem zweiten Feld von `ix_todo_status`.
Migration 0010 läuft vorwärts, rückwärts **mit Daten** und wieder vorwärts; 25 Prüfungen gegen eine
echte Datei, alle grün, und der Rückweg ist verlustfrei, weil der einzige Wert, der je in der
Spalte stand, die Kennung des Todos selbst war. Der gebündelte Sidecar startet danach und migriert
seinen Bestand — `verify:bundle`, 20 Prüfungen, grün; das war die Auflage aus T-053, und sie hält.
Die vier „tot"-Beschriftungen sind weg, weil eine Beschriftung für etwas, das es nicht mehr gibt,
die nächste Falschaussage wäre.

**Was nicht hält, ist `pnpm check`,** und zwar an genau einer Stelle. `proof:callers` liest
`apps/web/src/api/endpoints.ts` und löst `updateTodo(id, body: TodoUpdate)` über den Typ
`TodoUpdate` aus `apps/web/src/api/types.ts` auf. Dieser Typ führt weiterhin `boardRank`. Damit
sendet die Oberfläche nach Lesart des Prüfers einen Schlüssel, den die Route nicht mehr kennt —
genau die Fehlerklasse S-08, für die es diesen Lauf gibt. Der Befund ist **richtig**, nicht
lästig; ihn wegzudefinieren hieße, dem einzigen Prüfer, der Aufrufer gegen Dienst hält, eine
Ausnahme für seinen eigenen Zweck beizubringen.

Dahinter steht kein Formfehler, sondern ein echter Bruch: `BoardScreen.tsx:218` liest
`todo.boardRank` **unbedingt**. Ab zwei Karten in derselben Statusspalte wirft die Ansicht.
Gemessen, nicht vermutet (Abschnitt 2).

Damit ist die Zahl der gekoppelten Hoheiten nicht drei, sondern vier: domain-dev (Quelle),
unit-tester (drei Testdateien, ausnahmsweise mir übertragen) — und frontend-dev
(`apps/web`, drei Zeilen). Die vierte fehlte in der Welle.

---

## 1 — Migration 0010, gemessen

Eigener Lauf gegen eine echte Datei (`node:sqlite`, Node 22.23.2), 25 Prüfungen, alle grün. Das
Skript lag im Wegwerfordner; die Prüfungen stehen als Zeilen in `docs/datenmodell.md` 8.5.

```
1  Vorwärts auf leerer Datei: 0 → 10
   board_rank weg · ux_todo_rank weg · ix_todo_status einspaltig auf status_id ·
   die vier übrigen todo-Indizes unverändert · INSERT ohne board_rank gelingt ·
   zwei Todos in derselben Statusspalte sind zulässig ·
   EXPLAIN QUERY PLAN nimmt für WHERE status_id = ? weiterhin ix_todo_status
2  Rückwärts mit Daten: 10 → 9
   board_rank wieder da und wieder gleich der Kennung · alle drei Todos unverändert ·
   der interne Vermerk hat den Rückweg überlebt · beide Indizes wortgleich wie in 0001 ·
   doppelter Rang: UNIQUE · ausgelassener Rang beim zweiten INSERT: UNIQUE
3  Wieder vorwärts, mit Daten: 9 → 10
   Spalte wieder weg · Todos und Vermerk unverändert ·
   integrity_check = ok · foreign_key_check leer
4  Ganz zurück und wieder hoch: 10 → 0 → 10
   todo verschwindet und steht danach wieder ohne board_rank
25 bestanden, 0 fehlgeschlagen
```

Drei Entscheidungen, die in der Datei begründet stehen und hier kurz:

**Die Indizes fallen zuerst, weil SQLite sonst das `DROP COLUMN` verweigert.** Der Fehlertext
(`error in index ix_todo_status after drop column: no such column: board_rank`) stand schon im
T-066-Bericht; ich habe die Reihenfolge übernommen und nicht neu erfunden.

**`ix_todo_status` bleibt, einspaltig, unter demselben Namen.** `TodoFilter.statusIds` filtert
weiterhin darüber, und `todo_status` löscht mit ON DELETE RESTRICT — beides braucht den Zugriffspfad.
Ein zweiter Name für dieselbe Aufgabe wäre eine zweite Auskunft über dieselbe Sache. Dass der Plan
ihn danach wirklich noch nimmt, ist gemessen und nicht angenommen.

**Der Rückweg trägt `DEFAULT ''`, und das ist kein Schlendrian.** SQLite nimmt eine über
`ADD COLUMN` entstehende NOT-NULL-Spalte nur mit Vorgabewert an; `0001_initial.up.sql` hat keinen.
Der Unterschied ist nach Schritt 3 folgenlos, weil `ux_todo_rank` wieder steht: Ein INSERT, der
`board_rank` ausließe, bekäme `''` und liefe beim zweiten Mal in derselben Statusspalte in die
Eindeutigkeitsbedingung. Die Wache überlebt, sie heißt nur anders — UNIQUE statt NOT NULL. Auch das
ist gemessen (Abschnitt 2 der Tabelle oben) und nicht bloß behauptet. Die verlustfreie Alternative
wäre ein Tabellenneubau nach dem zwölfschrittigen Verfahren gewesen: vier CHECK-Bedingungen, vier
weitere Indizes und drei Fremdschlüssel neu aufbauen — das Wesentliche (die Kundendaten) für das
Unwesentliche (ein fehlendes DEFAULT) aufs Spiel setzen.

---

## 2 — Die vierte gekoppelte Stelle, gemessen statt vermutet

**Was rot ist:**

```
3  Die Rümpfe: jeder gesendete Schlüssel wird auch gelesen
  FEHL  kein Rumpfschlüssel, den die getroffene Route nicht kennt
        — updateTodo (Zeile 126) → updateTodo: sendet „boardRank",
          gelesen werden title/callNumber/statusId/tagIds
6  Der Prüfer prüft sich selbst — mit den drei Namen aus T-050
  FEHL  der unveränderte Text ergibt keine einzige Beanstandung
        — dieselbe Ursache

16 bestanden, 2 fehlgeschlagen
```

**Warum der Prüfer das sieht, obwohl keine Ansicht `boardRank` je setzt.** `caller-scan.mjs` löst
einen Rumpfbezeichner über die Typangabe am Parameter auf: `updateTodo(id: Id, body: TodoUpdate)`
wird zu den Feldern von `TodoUpdate` aus `apps/web/src/api/types.ts`. Das ist eine
Überabschätzung — und die richtige: Ein optionales Feld im Rumpftyp ist ein Feld, das die
Oberfläche senden **kann**. Wer es morgen setzt, bekommt stilles Verwerfen statt einer Antwort.
Genau dagegen ist der Lauf gebaut.

**Und dahinter steht ein echter Bruch, kein Formfehler.**
`apps/web/src/screens/BoardScreen.tsx:218` lautet unverändert:

```ts
.sort((left, right) => left.boardRank.localeCompare(right.boardRank));
```

Gegen die Gestalt, die `GET /todos` nach Migration 0010 liefert:

```
  eine Karte je Spalte:   kein Wurf
  zwei Karten je Spalte:  TypeError: Cannot read properties of undefined (reading 'localeCompare')
```

**Warum die End-zu-End-Fälle das trotzdem nicht finden.** `tests/e2e/kanban.spec.ts` läuft grün
(3 bestanden, eigens nachgefahren). Der Grund ist Glück und nicht Sicherheit: Jeder der drei Fälle
legt eine frische Statusspalte an und stellt **eine** Karte hinein.
`Array.prototype.sort` ruft den Vergleicher bei einem Element nicht auf. Ab der zweiten Karte in
derselben Spalte wirft er. Das ist dieselbe Art blinder Fleck wie in T-050: grün, weil der
gelingende Weg an der Stelle vorbeiläuft, die bricht.

**Warum ich es nicht selbst behoben habe.** `apps/web/**` steht im Auftrag unter „Nicht anfassen".
Die erweiterte Hoheit galt ausdrücklich und ausschließlich den drei Dateien unter
`packages/storage/test/`.

**Warum ich es auch nicht wegdefiniert habe.** Für die Gegenrichtung („der Dienst liest ein Feld,
das die Oberfläche nie sendet") gibt es in `proof-callers.mjs` die Liste `NEVER_SENT`, mit
Begründung je Eintrag. Für **diese** Richtung gibt es keine solche Liste, und das ist Absicht: Sie
wäre eine Ausnahme für genau die Fehlerklasse, für die der Lauf existiert. Ich hätte sie in meiner
Hoheit anlegen können. Das wäre die neunte Doppelung gewesen, diesmal als Falschaussage im Prüfer
selbst.

**Warum ich die Spalte auch nicht halb dringelassen habe.** Die dritte Möglichkeit wäre gewesen,
`boardRank` im zod-Schema stehen zu lassen und den Wert zu verwerfen. Das ist wörtlich der Zustand,
den `proof:callers` in seinem eigenen Kopf als schlechteren von zwei Ausgängen beschreibt („422 …
oder stilles Verwerfen"), und es ist der halb entfernte Sortierschlüssel, den T-066 zweimal als
schlechteste der drei Möglichkeiten benannt hat.

---

## 3 — Was noch fehlt: drei Zeilen in `apps/web`

Für frontend-dev, anwendbar wie sie dastehen:

`apps/web/src/api/types.ts`, Zeile 87 (Schnittstelle `Todo`):

```diff
   readonly statusId: Id;
-  readonly boardRank: string;
   /** `null` heißt aktiv, ein Zeitstempel heißt erledigt (A-2.4). */
```

`apps/web/src/api/types.ts`, Zeile 132 (Schnittstelle `TodoUpdate`):

```diff
   readonly statusId?: Id;
-  readonly boardRank?: string;
   readonly tagIds?: readonly Id[];
```

`apps/web/src/screens/BoardScreen.tsx`, Zeile 216–218:

```diff
                 const cards = value.todos
                   .filter((todo) => todo.statusId === status.id)
-                  .sort((left, right) => left.boardRank.localeCompare(right.boardRank));
+                  // Seit E-054/Migration 0010 gibt es keinen vom Benutzer gesetzten
+                  // Rang mehr. Zuletzt geändert zuerst — dieselbe Ordnung, die der
+                  // Dienst für jede Todo-Liste liefert.
+                  .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
```

Die dritte Zeile ist ein **Vorschlag**, keine Vorgabe: Welche Ordnung eine Spalte ohne Ziehen haben
soll, ist eine Frage an die Oberfläche und nicht an mich. `updatedAt` absteigend ist die Ordnung,
die `GET /todos` ohnehin liefert (`repo-todos.ts`, `ORDER BY t.updated_at DESC, t.id DESC`), also
die einzige, die keine zweite Wahrheit einführt. Wer etwas anderes will, entscheidet es dort —
aber ein unbedingter Zugriff auf ein Feld, das die Antwort nicht mehr führt, kann es nicht bleiben.

Nach diesen drei Zeilen ist `proof:callers` wieder bei 18 von 18; nichts anderes hängt daran.

---

## 4 — Was gemessen grün ist

| Pfad | vorher | jetzt |
|---|---|---|
| `proof:access` | 75 | **75** |
| `proof:export` | 97 | **97** |
| `proof:export-api` | 69 | **69** |
| `proof:taskpane` | 25 | **25** |
| `proof:addin-wiring` | 32 | **32** |
| `proof:route-policy` | 40 | **40** |
| `proof:template-fields` | 30 | **30** |
| `proof:db-permissions` | 17 | **17** |
| `proof:openapi` | 53 | **53** |
| `proof:tags` | 42 | **42** |
| `proof:addin` (outlook) | 100 | **100** |
| `proof:callers` | 18 | **16 + 2 rot** — Abschnitt 2 |

Dazu:

```
pnpm typecheck            grün über alle acht Projekte (auch apps/web: es führt eigene Typen)
pnpm boundaries           grün — Notiz-Trennung unverletzt, 283 Dateien geprüft
pnpm contrast             grün
pnpm test:coverage        Exitcode 0 · Test Files 35 · Tests 567 (vorher 568; der eine
                          entfallene Fall ist „board_rank eines neuen Todos ist seine
                          eigene Kennung", der eine Spalte prüfte, die es nicht mehr gibt)
                          packages/storage/src/sqlite  90,12 / 80,21 / 94,53 / 93,97
                          mappers.ts                   100 / 96,29 / 100 / 100
                          beide Schwellen (80) gehalten
pnpm build                Exitcode 0
pnpm verify:bundle        Exitcode 0 · 20 von 20 · „Der Bestand ist migriert:
                          GET /todo-statuses ergibt 200" — der gebündelte Sidecar hat
                          Migration 0010 aus dem eingebetteten Abbild (20 Dateien)
                          vorwärts gefahren und antwortet
tests/e2e/kanban.spec.ts  3 von 3 grün — aber siehe Abschnitt 2, das ist kein Freispruch
```

Die Objektzählung nach 0010 ist nachgezählt statt fortgeschrieben: **17 Tabellen, eine Sicht, 33
Indizes, 17 Trigger** (`sqlite_master` nach dem Vorwärtslauf). 34 → 33, weil zwei Indizes fallen
und einer neu entsteht. `docs/datenmodell.md` 1 trägt jetzt diese Zahl.

---

Annahmen:

1. **Der Rückweg legt die Spalte mit `DEFAULT ''` an.** Begründet in Abschnitt 1 und in der
   Migrationsdatei. Der Bestand nach `10 → 9` unterscheidet sich damit vom Bestand nach `0001` in
   genau diesem einen Punkt, und der Punkt ist durch `ux_todo_rank` abgedeckt.
2. **`ix_todo_status` behält seinen Namen.** Ein Index mit gleicher Aufgabe und einem Feld weniger
   ist derselbe Index, nicht ein neuer.
3. **Kein Index auf sonst etwas.** 0010 nimmt weg und legt einen zurück; es fügt nichts hinzu.
4. **Die Prüfung „ein Pflichtfeld tief in einer Liste fällt auf" in `proof-openapi.mjs` fährt jetzt
   über `statusId`.** Sie brauchte irgendein Pflichtfeld tief in der Liste; `boardRank` war es
   zufällig. Die Aussage des Falls ändert sich nicht.
5. **Ich habe die drei Diffs des unit-testers geprüft, nicht übernommen.** Sie waren richtig; das
   war vorher nicht sicher, weil er meine Migration nicht kannte.
6. **Ich habe die Arbeit stehen lassen und nicht zurückgenommen.** Begründung unter „Offene
   Fragen" 1 — mit dem Weg zurück, falls der Orchestrator es anders will.

---

Risiken:

* **R-1 (der Blocker): `pnpm check` steht auf 1, und `BoardScreen` bricht ab zwei Karten je
  Statusspalte.** Bis die drei Zeilen aus Abschnitt 3 landen, ist die Board-Ansicht der Oberfläche
  für jeden Bestand mit mehr als einer Karte in einer Spalte unbenutzbar. Das ist die Kehrseite von
  „in einem Zug": Es gibt keine Reihenfolge, in der dieser Bruch nicht für die Dauer **einer**
  Aufgabe besteht — T-069 hat das für die Testdateien gemessen, ich habe es jetzt für `apps/web`
  gemessen. Die Welle war nur um eine Hoheit zu klein.
* **`apps/outlook-addin` setzt weiterhin `boardRank` auf seinen Attrappen-Todos**
  (`scripts/fixtures.mjs:244`, `scripts/proof-addin.mjs:983/994/1143`). Gemessen folgenlos:
  `proof:addin` ist bei 100 von 100, weil die Attrappe ein einfaches JavaScript-Objekt ist und
  niemand ihre Gestalt gegen ein Schema hält. Es ist aber ein Schlüssel, der ein Feld benennt, das
  es nicht mehr gibt — vier Zeilen zum Streichen für den, dem die Dateien gehören. Kein Blocker,
  keine Falschaussage nach außen, nur Ballast.
* **Ein Bestand, der `0010 → 0009` zurückgeht, bekommt eine `board_rank`-Spalte mit
  Vorgabewert.** Abschnitt 1. Wer danach von Hand INSERTs schreibt, die die Spalte auslassen,
  bekommt beim zweiten Mal `UNIQUE constraint failed` statt `NOT NULL constraint failed`. Andere
  Meldung, gleiche Wirkung.
* **Keine neue Angriffsfläche.** Ein Feld weniger in einer Antwort, ein Feld weniger in einem
  Eingabeschema. `proof:route-policy` (40), `proof:access` (75) und die Notiz-Trennung
  (`pnpm boundaries`, `proof:openapi` Abschnitt 6) sind unverändert grün.

---

Offene Fragen:

1. **An den Orchestrator: lassen oder zurücknehmen?** Ich habe die Arbeit stehen lassen. Der Grund:
   Von hier sind es drei Zeilen bis grün, von einem zurückgenommenen Stand ist es die vierte
   vollständige Wiederholung derselben Aufgabe — und die Beanstandung, die der Baum jetzt ausgibt,
   nennt die fehlende Arbeit in einer Zeile („updateTodo: sendet ‚boardRank'"), was
   `proof-callers.mjs` in seinem eigenen Kommentar zum benachbarten Fall ausdrücklich so haben
   will. Wenn du es anders willst: Zurückzunehmen sind die zwölf von Hand geänderten Dateien aus
   „Artefakte", dazu das Löschen der beiden Migrationsdateien und ein erneutes
   `pnpm --filter @takt/storage migrations:embed` (das `migrations.embedded.ts` wieder auf 18
   Dateien stellt). Sag Bescheid, dann mache ich es in einem Zug.
2. **An frontend-dev, über den Orchestrator: die drei Zeilen aus Abschnitt 3.** Die beiden in
   `types.ts` sind reines Streichen. Die dritte ist eine Entscheidung: Welche Ordnung hat eine
   Spalte, in der nicht mehr gezogen wird? Mein Vorschlag ist „zuletzt geändert zuerst", weil das
   die Ordnung ist, die der Dienst ohnehin liefert. Zusammen damit lässt sich, wenn es ohnehin
   angefasst wird, `getBoard` aus `NOT_CALLED_BY_UI` in `proof-callers.mjs` holen (T-066, offene
   Frage 3) — aber das ist eine eigene Aufgabe und keine Bedingung für diese hier.
3. **An unit-tester:** Ein Prüffall ist ersatzlos entfallen („board_rank eines neuen Todos ist
   seine eigene Kennung"), 568 → 567. Ein Ersatz ist nicht nötig — die Zusicherung, die er trug,
   gibt es nicht mehr. Falls dir eine Abdeckungslücke auffällt: `repo-todos.ts` steht unverändert
   bei 90,24 / 80 / 100 / 93.
4. **An den, dem `apps/outlook-addin/scripts/**` gehört:** vier Zeilen `boardRank` in den
   Attrappen, siehe Risiken. Folgenlos, aber tot.
5. **An den security-checker:** Die OpenAPI-Beschreibung führt zwei Felder weniger (`Todo.boardRank`,
   `TodoUpdate.boardRank`); `Todo.required` hat einen Eintrag weniger. Kein Add-in-Abschnitt ist
   berührt (E-053). Sonst nichts.

---

Nächster Schritt:

Die drei Zeilen aus Abschnitt 3 an frontend-dev, als kleinste denkbare Aufgabe. Danach ist
`proof:callers` bei 18 von 18 und `pnpm check` bei 0, und `todo.board_rank` ist nach drei Anläufen
tatsächlich weg — Schema, Domäne, Dienst, Beschreibung, Oberfläche und alle Beschriftungen in
einem Stand.
