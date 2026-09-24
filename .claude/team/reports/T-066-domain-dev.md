Aufgabe: T-066 — Kanban-Spalten werden Regeln. Modell, Migration, Routen.

Status: fertig

---

Artefakte:

Neu:

```
packages/domain/src/board.ts                          NEU (154) — `BoardColumn` (Alias auf
                                                       `Pool`), `BoardColumnRule`, `BoardCard`,
                                                       `BoardAppearance`, `boardAppearances`.
                                                       Rein, ohne laufenden Dienst prüfbar
packages/storage/migrations/0009_pool_placement.up.sql    NEU (93) — eine Spalte, kein Index,
                                                       kein UPDATE, keine Datenwanderung
packages/storage/migrations/0009_pool_placement.down.sql  NEU (20) — ein DROP COLUMN
apps/local-api/src/usecases/board.ts                  NEU (166) — `loadBoard`, `BoardView`,
                                                       `BoardColumnView`, `BoardRequest`
apps/local-api/src/routes/board.ts                    NEU (70) — `GET /api/v1/board`, nur lesend
```

Geändert:

```
packages/domain/src/tag.ts             `PoolPlacement`, `PoolSurface`, `Pool.placement`;
                                        Kopf von `Pool` auf „Pool **und** Spalte"
packages/domain/src/todo.ts            `TodoStatus` heißt im Text jetzt Status und nicht
                                        Spalte; `Todo.boardRank` als tot beschriftet
packages/domain/src/index.ts           `export * from './board.ts'`
packages/storage/src/ports.ts          `PoolPort.list(shownOn?)`, `create(... placement?)`;
                                        Abschnittskopf „Pools **und** Kanban-Spalten"
packages/storage/src/sqlite/mappers.ts `toPoolPlacement`, defensiv wie `match_mode`
packages/storage/src/sqlite/repo-tags.ts  `POOL_COLUMNS`, `list` nach Fläche, `create`/`update`
                                        mit `placement`; Kopf von `createPoolPort`
packages/storage/src/sqlite/migrations.embedded.ts  neu erzeugt (18 Dateien)
apps/local-api/src/app.ts              `/board` eingehängt, hinter derselben Kette
apps/local-api/src/routes/structure.ts `placement` in `poolCreateSchema`/`poolUpdateSchema`,
                                        `GET /pools?placement=pool|board|all`
apps/local-api/src/usecases/structure.ts  `listPools(context, shownOn?)`, `PoolInput.placement`
apps/local-api/openapi/takt-local-api.yaml  `/board`, `Board`, `BoardColumn`, `BoardAppearance`,
                                        `PoolPlacement`; `Pool`/`PoolCreate`/`PoolUpdate`;
                                        Fragezeichenparameter an `/pools`; Beschreibung von
                                        `Todo.boardRank`; zwei Schlagworttexte.
                                        **Kein Zeichen in einem Add-in-Abschnitt** (E-053)
apps/local-api/scripts/service-scenario.mjs  vier Spalten, ein zweites Tag, `GET /board`
apps/local-api/scripts/proof-openapi.mjs     Abschnitt 11 (7 Prüfungen), `board.ts` in den
                                        Quellen für Abschnitt 10
apps/local-api/scripts/proof-callers.mjs     zwei **benannte** Übergaben an frontend-dev
docs/datenmodell.md                    1, 3.1, 3.2, 3.5, 4.4a (neu), 8.4d (neu), 8.5, 9
docs/architektur.md                    1.2, 3.1, 5.0a, 5.1

apps/local-api/src/taskpane/certificate.ts   **nicht T-066** — der Befund V-4/S-04 aus der
                                        Veröffentlichungsprüfung: `Math.random` →
                                        `crypto.randomBytes` für die Seriennummer.
                                        Abschnitt 8
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `tests/e2e/**`, `packages/*/test/**`, `package.json`, `pnpm-workspace.yaml`.
Kein `git commit`.

---

Zusammenfassung:

Eine Kanban-Spalte ist jetzt eine Regel über Tags — und zwar **dieselbe Entität wie ein Pool**,
nicht eine zweite daneben. `pool.placement` (`pool` | `board` | `both`) sagt, auf welcher Fläche
eine Regel erscheint; alles andere — Name, Regelterme, Auflösung über Ordner samt Unterordnern,
Mitglieder als Abfrage, „leere Regel trifft nichts" — bleibt, wie es seit T-009 ist und wird nicht
ein zweites Mal geschrieben. Migration 0009 hängt eine Spalte an und rührt den Bestand sonst nicht
an: Jede vorhandene Regel bleibt ein Pool, das Board ist danach **sichtbar leer**, bis jemand eine
Spalte einrichtet. `GET /api/v1/board` liefert die Spalten in ihrer Reihenfolge, je Spalte die
erste Seite und die Karten, die in mehr als einer Spalte stehen; Spalten eingerichtet werden über
`/pools`, weil eine Spalte ein Pool ist. `todo.board_rank` **bleibt** — er ist tot, aber sein
Wegfall geht nicht ohne drei Dateien in fremder Hoheit; er ist an vier Stellen als tot
beschriftet. `pnpm check` steht auf 0, alle zwölf Nachweispfade sind grün, und der Fall, den es
vorher nicht geben konnte, ist gemessen statt behauptet.

---

## 1 — Die Entscheidung, um die die Aufgabe gebeten hat: eine Entität oder zwei

**Eine.** `pool` mit einer Spalte `placement`. Begründung in der Reihenfolge ihres Gewichts.

**Was eine zweite Tabelle abgeschrieben hätte.** Ich habe es aufgezählt, statt es zu schätzen: den
Namen samt eindeutigem Index, die Position samt eindeutigem Index, `match_mode`,
`include_subfolders`, die Regeltermtabelle samt `CHECK ((tag_id IS NULL) <> (folder_id IS NULL))`
und ihren drei Indizes, `resolvePoolRule` mit der rekursiven Ordnerauflösung (die einzige Stelle
im Bestand, die beliebig tief absteigt), die Mitgliederabfrage in `buildConditions`, den
Sonderfall der leeren Regel (`0 = 1`), den Mapper, den Port, die Anwendungsfälle, vier Routen und
vier Schemata in der Beschreibung. Das ist die achte Doppelung dieses Projekts gewesen — und die
erste, bei der die Kopie einen **rekursiven Abstieg** mitgenommen hätte.

**Was die eine Entität kostet.** Das Wort „Pool" bezeichnet jetzt zwei Dinge. Der Preis wird an
genau einer Stelle bezahlt, `placement`, und die steht in jeder Abfrage sichtbar da. Drei
Vorkehrungen dagegen, dass daraus Unklarheit wird:

1. **`PoolPort.list` fragt nach der Fläche, nicht nach allem.** Ohne Argument gilt `'pool'`. Das
   ist kein bequemer Vorgabewert, sondern der Grund, warum das Argument weglassbar ist: Jeder
   Aufrufer aus der Zeit vor E-054 meinte „die Pools" — allen voran `poolNamer` in
   `routes/addin/service.ts`, der die Pools eines Todos beim Namen nennt. Der bekommt weiterhin
   Pools und nicht die Spalten eines Boards, **ohne dass die Datei angefasst werden musste**
   (fremde Hoheit). Das Board fragt ausdrücklich: `list('board')`.
2. **Der Typalias `BoardColumn = Pool`.** Er ist buchstäblich `Pool`. Wer ihn benutzt, bekommt
   keinen anderen Wert, sondern eine andere Lesart — und wer stattdessen ein eigenes
   `interface BoardColumn` hinschreibt, hat die Entscheidung zurückgenommen und sieht es an der
   Zeile, die er löschen muss.
3. **Getrennte Flächen in der Schnittstelle.** `GET /pools` liefert **ohne Angabe** die
   Pool-Liste. Eine Regel, die der Benutzer ausdrücklich nur auf das Board gestellt hat, taucht
   in der Pool-Navigation nicht auf; sie dort stillschweigend mitzuliefern hieße, seine
   Entscheidung zu übergehen. `?placement=board` und `?placement=all` gibt es daneben.

**Warum dreiwertig und nicht zwei Wahrheitswerte.** `zeigt_im_pool` und `zeigt_auf_board`
nebeneinander hätten vier Zustände, und einer davon — beide falsch — wäre eine Regel, die nirgends
erscheint und die niemand wiederfindet. Dieselbe Überlegung wie beim Exportstatus: zweiwertig, nie
leer, nie mehrdeutig. Hier eben dreiwertig.

**Position.** Eine Spalte, für beide Flächen. Die Pool-Liste sortiert die Regeln mit `pool`/`both`
danach, das Board die mit `board`/`both`. Eine zweite Positionsspalte je Fläche wäre eine zweite
Wahrheit über dieselbe Ordnung — und O-B (Pools sind aus der Oberfläche heraus nicht sortierbar)
wäre dann zweimal offen statt einmal.

---

## 2 — `todo.board_rank`: er kann weg, aber nicht von mir allein

**Befund: Er ist tot.** Gemessen, nicht vermutet:

* Kein Aufrufer setzt ihn. `TodoUpdate.boardRank` ist die einzige schreibbare Stelle; weder
  `apps/web/src/api/endpoints.ts` noch das Add-in noch ein Prüfpfad schickt das Feld
  (`proof:callers` liest jeden Rumpf der Oberfläche und hat ihn nirgends gefunden).
* Der Wert eines neuen Todos ist seine eigene Kennung (`repo-todos.ts`). Die Reihenfolge ist damit
  die der Anlage, nicht die eines Benutzers.
* Sortiert wurde danach an genau einer Stelle: `apps/web/src/screens/BoardScreen.tsx:218`, im
  Ziehen-Board. A-5.2 ist mit E-054 entfallen.
* `ux_todo_rank` (eindeutig, `status_id, board_rank`) und `ix_todo_status`
  (`status_id, board_rank`) hängen daran. Beide sind ohne Ziehen ohne Aufgabe; ein Index auf
  `status_id` allein bliebe sinnvoll, weil nach Status weiterhin gefiltert wird.

**Entscheidung: Er bleibt in T-066 stehen, als tot beschriftet.** Der Grund ist nicht fachlich,
sondern eine Hoheitsgrenze, und er ist gemessen:

```
packages/storage/test/support/migrated-database.ts:61
    INSERT INTO todo (id, title, call_number, status_id, board_rank, ...)
      → nach einem DROP COLUMN: „no such column: board_rank" in **jedem** Test,
        der diese Hilfe benutzt (Zeitbuchungen, Timer, Export, Protokoll)
packages/storage/test/repo-todos.test.ts:84
    it('board_rank eines neuen Todos ist seine eigene Kennung')
      → expect(todo.boardRank) — bricht schon im `tsc`, sobald `Todo.boardRank` fällt
packages/storage/test/mappers.test.ts:79
    board_rank: 'todo-1' in der Beispielzeile — harmlos, aber irreführend
```

`packages/*/test/**` gehört unit-tester. Ein Wegfall hier machte `pnpm typecheck` und
`pnpm test:coverage` rot, und die Definition of Done verlangt Exitcode 0. Ein **halb** entfernter
Sortierschlüssel — aus der Domäne raus, in der Datenbank drin — wäre die schlechteste der drei
Möglichkeiten gewesen.

Beschriftet ist er jetzt an vier Stellen, damit niemand ihn erneut in Betrieb nimmt:
`packages/domain/src/todo.ts` (`Todo.boardRank` und `TodoUpdate.boardRank`), die Beschreibung von
`Todo.boardRank` in der OpenAPI-Datei, `docs/datenmodell.md` 3.2 und die Indextabelle in 9.

**Der fertige Schnitt für die Folgeaufgabe** (Migration 0010, eine Welle mit unit-tester):

```sql
-- up: die Indizes zuerst, sonst verweigert SQLite das DROP COLUMN
--     („error in index ix_todo_status after drop column") — gemessen.
DROP INDEX ux_todo_rank;
DROP INDEX ix_todo_status;
ALTER TABLE todo DROP COLUMN board_rank;
CREATE INDEX ix_todo_status ON todo (status_id);

-- down: verlustfrei, weil der einzige je vergebene Wert die Kennung war
ALTER TABLE todo ADD COLUMN board_rank TEXT NOT NULL DEFAULT '';
UPDATE todo SET board_rank = id;
DROP INDEX ix_todo_status;
CREATE INDEX ix_todo_status ON todo (status_id, board_rank);
CREATE UNIQUE INDEX ux_todo_rank ON todo (status_id, board_rank);
```

Beide Richtungen habe ich gegen `node:sqlite` 3.51.3 durchgespielt; sie laufen. Dazu gehören
`Todo.boardRank`, `TodoUpdate.boardRank`, `TODO_COLUMNS` und der INSERT in `repo-todos.ts`, die
beiden Felder in der OpenAPI-Datei — und die drei Testdateien oben. Es ist eine kleine Änderung an
zwei Hoheiten, keine an einer.

---

## 3 — Was die Oberfläche bekommt

`GET /api/v1/board?limit=&includeCompleted=`

```jsonc
{ "data": {
  "columns": [                       // in der Reihenfolge von position
    { "column": { …Pool… },          // vollständig, mit Regel: „warum steht die Karte hier"
      "todos": [ …Todo… ],           // erste Seite dieser Spalte
      "nextCursor": null,            // einzulösen bei GET /pools/{id}/todos
      "total": 12 }                  // alle Mitglieder, nicht nur die geladenen
  ],
  "appearances": [                   // NUR Karten in mehr als einer Spalte
    { "todoId": "…", "columnIds": ["…", "…", "…"] }
  ],
  "generatedAt": "2026-09-02T08:00:00Z"
} }
```

Vier Punkte, die die Oberfläche wissen muss:

1. **`columns: []` heißt „keine Spalte eingerichtet"**, nicht „nichts zu tun". Nach der
   Aktualisierung ist das der Ausgangszustand (Abschnitt 4). Der eine Fall braucht „Spalte
   einrichten", der andere „nichts offen" — das ist nicht dieselbe leere Ansicht.
2. **Dieselbe Karte kommt in mehreren `columns[].todos` vor.** Das ist richtig so: Sie steht
   wirklich in mehreren Spalten. `appearances` sagt daneben, welche Karte wo überall steht, mit
   den Spaltenkennungen in der Reihenfolge der Spalten — genug für „steht auch in *Rückfragen*".
3. **Die Mehrfachnennung hängt an keiner Seitengröße.** Sie wird nicht aus den geladenen Seiten
   gezählt, sondern über die Regel gerechnet (`matchesPool`). Aus den Seiten gezählt wäre sie
   falsch, sobald eine Spalte mehr Karten hat, als eine Seite fasst — die Karte stünde in Spalte A
   auf Seite 1 und in Spalte B auf Seite 2, und die Antwort behauptete, sie stünde nur einmal da.
   Das ist genau der Fehler aus T-042, bei dem der Protokollknopf gerade bei den großen Läufen
   versagte.
4. **Weiterblättern je Spalte über `GET /pools/{id}/todos`**, mit dem `nextCursor` aus derselben
   Spalte. Eine eigene Blätterroute für das Board wäre dieselbe Abfrage unter einem zweiten Namen.
   Eine Fortsetzungsmarke nimmt `/board` ausdrücklich **nicht** entgegen: Eine Marke gehört zu
   genau einer geordneten Liste, und hier sind es so viele Listen wie Spalten.

Eine Spalte anlegen: `POST /pools` mit `placement: "board"`. Ändern, umbenennen, Regel setzen,
löschen: die Pool-Routen. Es gibt **keine** Route, die eine Karte in eine Spalte legt — Ziehen ist
mit E-054 entfallen. Den Status ändert weiterhin `PATCH /todos/{id}`.

---

## 4 — Was Migration 0009 mit dem Bestand macht: nichts, und warum das die Entscheidung ist

Jede vorhandene Regel bekommt `placement = 'pool'`. Das Board ist nach der Aktualisierung leer.

Die beiden Alternativen habe ich verworfen, und zwar mit Begründung, weil beide auf den ersten
Blick freundlicher aussehen:

* **Die vier Statuswerte in Spalten übersetzen.** Es gibt keine Übersetzung. Eine Spalte ist eine
  Regel über **Tags**; „In Progress" ist kein Tag. Eine Migration, die dafür vier Tags anlegte und
  an jedes Todo hängte, täte genau das, was der Auftraggeber ausgeschlossen hat: *„du darfst keine
  Tags setzen."*
* **Alle vorhandenen Pools auf `both`.** Das Board wäre eine Kopie der Pool-Liste, die niemand
  bestellt hat; der Benutzer müsste zuerst aufräumen, was ihm eingerichtet wurde.

Ein leeres Board ist sichtbar leer. Ein Board, das mit erfundenen Spalten gefüllt wurde, sieht
aus, als hätte es jemand so gewollt.

**Kein Index auf `placement`,** und das ist eine Aussage und keine Auslassung: `pool` hält die
Regeln, die ein Mensch von Hand eingerichtet hat — eine Handvoll Zeilen. Ein partieller Index
behauptete einen Zugriffspfad, den kein Abfrageplan je wählen würde. Dieselbe Begründung wie bei
`timer_heartbeat` (datenmodell.md 9).

**Der Rückweg verliert genau eine Auskunft, und die richtige.** Nach `9 → 8` ist jede Regel wieder
ein Pool; welche eine Spalte war, steht nirgends mehr. Name, Regel, Position und alle Todos
bleiben unangetastet. Regeln mit `placement = 'board'` beim Rückweg zu löschen, „weil es sie
vorher nicht gab", nähme dem Benutzer eine von Hand eingerichtete Regel weg, ohne zu fragen.

---

## 5 — Der Fall, den es vorher nicht geben konnte, gemessen

`pnpm proof:openapi`, Abschnitt 11 — sieben Prüfungen, alle grün. Der Durchlauf richtet vier
Spalten ein, und der Bestand ist so gewählt, dass eine Karte in drei davon fällt:

| Spalte | Regel | trifft |
|---|---|---|
| Spalte über ein Tag | `tag: Beratung` | beide Karten |
| Spalte über einen Ordner | `folder: Mandant Beispiel`, mit Unterordnern | beide Karten — **andere Regelgestalt, dieselbe Karte** |
| Spalte über zwei Tags | `tag: Beratung`, `tag: Rückfrage`, Modus `any` | die erste Karte, über **zwei** zutreffende Terme |
| Spalte ohne Regel | `[]` | nichts |

```
11  Das Board: dieselbe Karte in mehreren Spalten (E-054)
  ok  eine als Spalte angelegte Regel kommt auch als Spalte zurück (placement)
  ok  das Board führt die vier eingerichteten Spalten und nur die (4)
  ok  eine Regel mit placement "pool" steht nicht auf dem Board
  ok  eine Spalte ohne Regel zeigt nichts — nicht alles (T-009)
  ok  mindestens eine Karte steht in mehreren Spalten (2)
  ok  mehrere zutreffende Regelterme einer Spalte liefern die Karte einmal, nicht mehrfach
  ok  Abfrage und Domänenregel nennen dieselben Spalten (2 Mehrfachnennungen)
```

Die letzte Zeile ist die wichtigste und der Grund, warum ich sie überhaupt geschrieben habe.
**Welche Karte in welcher Spalte steht, entscheidet SQL** (`PoolPort.members`, dieselbe Abfrage
wie für einen Pool). **Welche Karte mehrfach vorkommt, entscheidet `matchesPool`** in der Domäne.
Das sind zwei Fassungen derselben Regel — dieselbe Lage wie zwischen `matchesPool` und
`buildConditions`, nur jetzt in **einer** Antwort nebeneinander. Der Prüflauf hält für jede Spalte
die Menge der Abfrage gegen die Menge der Regel und wird rot, sobald sie sich unterscheiden.
Liefen sie auseinander, zeigte das Board eine Karte in einer Spalte und behauptete daneben, sie
stünde dort nicht.

Die erste Zeile ist die Lehre aus T-051: Ein stillschweigend abgestreiftes `placement` sähe in
einer Gestaltprüfung wie Erfolg aus. Der Durchlauf legt die Spalte deshalb mit `record` an und
sieht in der Antwort nach dem Wert.

---

## 6 — Migration vorwärts, rückwärts, vorwärts mit Daten

Eigener Lauf gegen eine echte Datei (`node:sqlite` 3.51.3, Node 22.23.2), 20 Prüfungen, alle grün.
Das Skript lag im Wegwerfordner und ist nach dem Lauf gelöscht; die Prüfungen stehen als Zeilen in
`docs/datenmodell.md` 8.5.

```
1  Vorwärts auf leerer Datei: 0 → 9
   9 ist die höchste bekannte Fassung · Anlegen ohne placement ergibt einen Pool ·
   board/both kommen zurück, wie sie geschrieben wurden · list() liefert Pool und Beides,
   list('board') Spalte und Beides, list('all') alle drei · eine Spalte liefert ihre Karte
   über dieselbe Abfrage wie ein Pool · eine leere Regel trifft nichts ·
   UPDATE ... placement='quatsch' am Adapter vorbei: vom CHECK abgewiesen
2  Rückwärts mit Daten: 9 → 8
   Spalte weg · alle drei Regeln stehen unverändert da · Regelterme unangetastet ·
   die Karte steht noch da
3  Wieder vorwärts, mit Daten: 8 → 9
   alle drei Regeln da · jede wieder ein Pool — genau wie die Rückwärtsdatei ansagt ·
   das Board leer · die Karte und ihr interner Vermerk haben Hin- und Rückweg überlebt
20 bestanden, 0 fehlgeschlagen
```

---

## 7 — Nachweispfade

`pnpm check` → **Exitcode 0**. Alle zwölf:

| Pfad | Prüfungen |
|---|---|
| `proof:access` | 75 |
| `proof:export` | 97 |
| `proof:export-api` | 69 |
| `proof:taskpane` | 25 |
| `proof:addin-wiring` | 32 |
| `proof:route-policy` | 40 |
| `proof:template-fields` | 30 |
| `proof:db-permissions` | 17 |
| `proof:openapi` | **53** (46 + 7 neue in Abschnitt 11); 65 Operationen, 90 Antworten verglichen |
| `proof:callers` | 18 |
| `proof:tags` | 42 |
| `proof:addin` (outlook) | 100 |

Dazu: `pnpm typecheck` grün über alle acht Projekte, `pnpm boundaries`, `pnpm contrast`,
556 Prüffälle in 34 Dateien grün, Abdeckung `packages/domain/src` 85,0 / 83,2 / 93,0 / 85,1 und
`packages/storage/src/sqlite` 90,0 / 80,1 / 94,5 / 93,8 — beide Schwellen (80) gehalten.
`packages/domain/src/board.ts` selbst liegt bei 10 %: Die Funktion hat **keinen Prüffall**, weil
`packages/domain/test/**` unit-tester gehört. Sie wird über `proof:openapi` gefahren, aber das ist
kein Ersatz — siehe Offene Fragen.

---

## 8 — Nachtrag außerhalb von T-066: `Math.random` in der Zertifikatserzeugung (V-4 / S-04)

Vom Orchestrator während der Aufgabe hereingereicht, weil er in meiner Hoheit liegt und die
Veröffentlichung blockiert. Erledigt, eine Zeile.

`apps/local-api/src/taskpane/certificate.ts` — die Seriennummer des selbst erzeugten Zertifikats
kam aus `Math.random`:

```ts
const serial = Buffer.alloc(16);
for (let index = 0; index < serial.byteLength; index += 1) {
  serial[index] = Math.floor(Math.random() * 256);      // vorher
}
```

```ts
const serial = randomBytes(16);                          // nachher
// Das oberste Bit fällt: ASN.1 INTEGER ist vorzeichenbehaftet, und eine
// negative Seriennummer ist nach RFC 5280 unzulässig.
serial[0] = (serial[0] ?? 1) & 0x7f;
```

`randomBytes` kommt aus `node:crypto` — derselben Einfuhrzeile, die schon `generateKeyPairSync`
und `sign` holt, jetzt mehrzeilig. Kein weiterer Aufrufer, keine Schnittstellenänderung.

Im Quelltext steht jetzt daneben, **warum**, und zwar in dieser Reihenfolge: Für dieses Zertifikat
war es folgenlos (lokal erzeugt, lokal angenommen, keine Zertifizierungsstelle); bei einer echten
Stelle ist die Seriennummer dagegen eine Sicherheitsgröße, weil sie zusammen mit dem
Hash-Verfahren Kollisionsangriffe verteuert — deshalb schreibt das CA/Browser-Forum mindestens
64 Bit aus einer geeigneten Quelle vor; und das Repository wird öffentlich, also dürfen zwei
Dateien nebeneinander nicht zwei Aussagen machen (`access/token.ts` schreibt in ihrem Kopf
„Ausdrücklich nicht: `Math.random`").

Der Aufwand ist an dieser Stelle nicht messbar: Die Zeile läuft **einmal** im Leben einer
Installation, neben einer RSA-2048-Schlüsselerzeugung, die um Größenordnungen länger dauert.

Gegenprobe: `grep -rn "Math.random"` über `apps/local-api/src` und `packages/*/src` findet danach
nur noch **Erwähnungen in Kommentaren** (`access/token.ts` 24, `storage/.../ids.ts` 52 und die
neue Begründung in `certificate.ts`), keinen Aufruf mehr. `pnpm --filter @takt/local-api
proof:taskpane` 25 Prüfungen grün, `proof:access` 75, `pnpm check` weiterhin Exitcode 0.

**An den security-checker (die Datei gehört ihm, nicht mir):** In `docs/bedrohungsmodell.md`
treffen vier Stellen nicht mehr zu und sind nachzuziehen —

* Zeile 1801, Befundtabelle Rang 3 („`Math.random` für den Zertifikatswert … Eine Zeile:
  `randomBytes(16)`") → behoben,
* Zeile 1849, „Nicht blockierend, aber zu erledigen: S-04 …" → S-04 ist erledigt,
* Zeile 2099, „**Mangel:** die Seriennummer kommt aus `Math.random` — Befund S-04",
* Zeile 2212, Eintrag **V-4** samt Gegenmittel („unverändert offen") → nicht mehr offen; die dort
  vorgeschlagene Einfuhrzeile ist genau die gewählte.

Zeile 2295 nennt V-4 ausdrücklich als „vor dem ersten Commit zu beheben und der Absatz dann zu
[streichen]" — das ist der Auftrag an den Absatz, nicht an mich. Eine behobene Schwäche, die als
offen dokumentiert bleibt, ist schlechter als gar kein Eintrag: Sie verbraucht beim nächsten Leser
dieselbe Aufmerksamkeit noch einmal.

---

Annahmen:

1. **Eine Entität, nicht zwei.** Begründet in Abschnitt 1. Die Aufgabe hat die Wahl mir überlassen.
2. **`GET /pools` liefert ohne Angabe nur die Pool-Liste**, nicht mehr alles. Für den vorhandenen
   Bestand ändert das nichts (nach 0009 ist jede Regel ein Pool). Es ändert etwas, sobald jemand
   eine reine Board-Spalte anlegt — und genau dann ist es richtig.
3. **`PoolPort.list()` ohne Argument bedeutet `'pool'`.** Damit blieb `routes/addin/service.ts`
   unangetastet und bedeutet weiterhin, was sein Name sagt.
4. **`board_rank` bleibt.** Abschnitt 2, mit fertigem Schnitt für die Folgeaufgabe.
5. **Kein `color` an der Spalte.** Die Statusspalten haben eine Farbe, Regeln nicht. Die Aufgabe
   sagt „bau nichts vor, was die Oberfläche nicht angefordert hat"; E-054 nennt Anzahl,
   Bezeichnung und Regel. Eine Farbe ist eine Spalte in `pool` und zwei Zeilen im Schema — wenn
   die Oberfläche sie braucht, sagt sie es, und dann ist es Migration 0010.
6. **Kein `PUT /board/...`** und keine Spaltenroute unter `/board`. Alles Schreibende geht über
   `/pools`.
7. **`generatedAt` in der Antwort.** Ein Board aus Regeln hat keinen gespeicherten Zustand; es ist
   die Antwort auf eine Frage zu einem Zeitpunkt.
8. **Die Zertifikatsänderung (Abschnitt 8) gehört nicht zu T-066** und ist getrennt aufgeführt,
   damit sie sich im Rückblick einzeln wiederfinden lässt. Sie berührt weder Modell noch
   Migration noch Routen.
9. **`app.ts` habe ich selbst angefasst.** CLAUDE.md nennt „die Modulregistrierung des lokalen
   Dienstes" als Datei des Orchestrators; der Auftrag zu T-066 nennt die Routen ausdrücklich als
   meine Arbeit und `apps/local-api/**` als meine Hoheit. Geändert sind dort vier Zeilen: ein
   Import, ein `api.route('/board', …)` mit Kommentar, ein Wort im Kopf. Wenn das falsch war, ist
   es in einem Zug zurückzunehmen.

---

Risiken:

* **R-neu: Zwei Fassungen derselben Regel in einer Antwort.** SQL entscheidet die Mitgliedschaft,
  `matchesPool` die Mehrfachnennung. Ich habe die Übereinstimmung messbar gemacht
  (`proof:openapi` 11) statt sie zuzusichern; ohne diesen Lauf wäre es die neunte Doppelung. Der
  Lauf misst sie am festen Bestand des Durchlaufs, also nicht an jedem denkbaren Regelzuschnitt —
  ein Prüffall in `packages/domain/test/` über `boardAppearances` bliebe wünschenswert.
* **`packages/domain/src/board.ts` ist zu 10 % abgedeckt.** Der Schwellwert des Pakets hält (85 %
  im Aggregat), aber die neue Funktion selbst hat keinen eigenen Prüffall. Für unit-tester
  aufgeschrieben unter „Offene Fragen"; die vier Fälle, die ich schreiben würde, stehen dort.
* **Ein Board mit vielen Spalten stellt viele Abfragen.** Je Spalte eine Mitgliederabfrage (zählen
  + Seite + Tags) und eine Regelauflösung. Bei sechs Spalten sind das rund zwanzig Abfragen gegen
  eine lokale SQLite-Datei — vertretbar, aber es wächst linear mit der Spaltenzahl. Wenn jemand
  fünfzig Spalten einrichtet, ist das messbar. Eine Sammelabfrage wäre möglich und wäre eine
  zweite Fassung von 4.4; ich habe sie nicht gebaut, solange niemand das Board so benutzt.
* **Sicherheit: nichts Neues.** `/board` liegt hinter derselben Kette und fällt in
  `route-policy.ts` in den `session`-Zweig, weil dort alles hineinfällt, was nicht ausdrücklich
  abgesenkt ist (B-2.10). Ein Add-in-Token erreicht die Route nicht — `proof:route-policy`, 40
  Prüfungen, grün. Die Antwort enthält `Todo`-Werte und **keinen** internen Vermerk; die
  Notiz-Prüfung in `proof:openapi` Abschnitt 6 fährt jetzt auch über die Board-Antwort und findet
  ihn dort nicht.
* **Der Bruch für die Oberfläche ist benannt, nicht still.** `BoardScreen.tsx` gruppiert weiter
  nach `statusId` und sortiert nach `boardRank`. Das funktioniert unverändert — ich habe weder das
  Feld noch die Statusroute angefasst —, zeigt aber nicht das, was E-054 meint. Die beiden Lücken
  stehen namentlich in `proof-callers.mjs` (`NOT_CALLED_BY_UI: 'getBoard'`,
  `NEVER_SENT.createPool/updatePool: 'placement'`), mit Begründung daneben. Wer sie entfernt, ohne
  dass die Oberfläche nachgezogen hat, bekommt den Befund zurück — so soll es sein.

---

Offene Fragen:

1. **An unit-tester (über den Orchestrator): vier Prüffälle für `boardAppearances`.** Die Funktion
   ist rein und ohne laufenden Dienst prüfbar; ich darf `packages/domain/test/**` nicht anfassen.
   Was ich prüfen würde:
   * eine Karte, die zwei Spaltenregeln erfüllt → beide Kennungen, in Spaltenreihenfolge;
   * eine Karte, die genau eine erfüllt → **kein** Eintrag (die Liste führt nur Mehrfache);
   * eine Spalte mit leerer Regel → trifft nichts, auch im Modus `all`;
   * eine Spalte im Modus `any` mit fünf Tags und eine Karte mit dreien → **eine** Nennung.
2. **An unit-tester: drei Dateien für den Wegfall von `board_rank`** (Abschnitt 2), falls der
   Orchestrator Migration 0010 in Auftrag gibt. Das SQL steht fertig im Bericht.
3. **An frontend-dev, für die Board-Aufgabe:** Die Ansicht muss zwei bisher unmögliche Zustände
   zeigen — „keine Spalte eingerichtet" (`columns: []`) und „diese Karte steht auch in …"
   (`appearances`). Und sie muss das Ziehen entfernen; A-5.2, I-14 und der zugehörige
   End-to-End-Fall sind mit E-054 entfallen. Die Spaltenverwaltung ist danach eine
   **Regelverwaltung** über `/pools` mit `placement`, keine Statusverwaltung mehr — die
   Statusverwaltung bleibt daneben bestehen (O-A: Statusspalten lassen sich immer noch nicht
   umbenennen).
4. **An e2e-tester:** Der Fall „Karte in mehreren Spalten" ist am Dienst gemessen
   (`proof:openapi` 11), aber nicht durch die Oberfläche. Sinnvoll erst nach der Board-Aufgabe.
5. **An den Auftraggeber, über den Orchestrator:** Soll eine Kanban-Spalte eine **Farbe** haben?
   Die Statusspalten haben eine; Regeln haben bisher keine. Zwei Zeilen Migration, wenn ja.
   Verwandt mit F-17/O-B: Sortierbarkeit von Pools ist jetzt zugleich die Sortierbarkeit der
   Spalten, weil beide dieselbe `position` benutzen. Eine Antwort auf F-17 beantwortet beides.
6. **An den security-checker:** vier Stellen im Bedrohungsmodell zu V-4/S-04 — Abschnitt 8.
7. **Nachtrag für `board.md`:** Die Zeile „Tests: … 11 Nachweispfade" ist seit dem Add-in-Pfad
   zwölf; `proof:openapi` führt jetzt 53 statt 46 Prüfungen, und der Dienst hat 65 Operationen
   statt 64.

---

Nächster Schritt:

Die Board-Ansicht in `apps/web` als eigene Aufgabe an frontend-dev — sie ist der einzige Grund,
warum `getBoard` heute in der Ausnahmeliste von `proof:callers` steht. Parallel dazu die vier
Prüffälle aus Punkt 1 an unit-tester; sie hängen an nichts und schließen die einzige Stelle, an der
neue Fachlogik ohne eigenen Prüffall im Bestand liegt.
