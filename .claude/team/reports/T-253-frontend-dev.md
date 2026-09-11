# T-253 — Welle 4 der Umstrukturierung: `features/board`

Aufgabe: T-253 — `features/board` bauen
Status: **braucht Review** — das Merkmal steht, **alle Läufe grün**, einschließlich
`proof:all` (Ausgangskode 0). Die E2E-Fälle zum Board stehen bei 2 roten; beide sind die
benannten offenen (TP-KANBAN-04 und `toast-eviction.spec.ts:123`), und **beide habe ich am
zurückgebauten Vorzustand gegengemessen**, statt sie zu behaupten (Abschnitt 9).

Ein Befund gehört sofort gemeldet, weil er beinahe ein roter Lauf geworden wäre und **nicht**
in meiner Hoheit liegt: Abschnitt 6.

---

## 1  Artefakte

### Neu — **fünf** Quelldateien

| Datei | Zeilen | Was |
|---|---|---|
| `apps/web/src/features/board/api.ts` | 123 | zwei Routen (`getBoard`, `listPoolTodos`) und drei merkmalseigene Typen |
| `apps/web/src/features/board/BoardColumn.tsx` | 362 | eine Spalte, ihre drei Leerzustände, das Kartenmenü, die Karte |
| `apps/web/src/features/board/BoardSetupDialog.tsx` | 268 | „Spalten des Boards" (S-11), einschließlich der Reihenfolge |
| `apps/web/src/features/board/BoardEmptyState.tsx` | 157 | der Leerzustand des ganzen Boards |
| `apps/web/src/shared/ui/ExportSummaryStrip.tsx` | 67 | der Exportstreifen — **mit** benanntem zweiten Benutzer |
| `docs/decisions/board.md` | 168 | Vorgeschichte aus `features/board/**` |

**Fünf** neue Quelldateien, **keine** gelöschte. Netto **+5** — die Zahl steht unten in drei
unabhängigen Zählern (Abschnitt 8).

### Verschoben (`git mv`, Inhalt außer Importzeilen unverändert)

`screens/BoardScreen.tsx` → `features/board/BoardScreen.tsx`
`components/Kanban.tsx` → `features/board/Kanban.tsx`

### Angefaßt, aber nur die Importzeile

Sechs Dateien: `app/App.tsx`, `features/todos/TodoRow.tsx`, `showcase/BoardSection.tsx`,
`showcase/data.ts`, `showcase/ExportStatusSection.tsx` — und `api/endpoints.ts` /
`api/types.ts`, aus denen der Board-Abschnitt herausgeschnitten ist.

### Eine Textstelle, die meine Änderung falsch gemacht hätte

`showcase/InventorySection.tsx:66` — die Musterseite nennt zu jedem Baustein seine Datei. Der
Eintrag „Exportstand-Zusammenfassung" nannte `Kanban.tsx`; er nennt jetzt
`ExportSummaryStrip.tsx`. Kein gestrichener Satz, kein geänderter zugänglicher Name — eine
Dateiangabe, die durch den Umzug unwahr geworden wäre. **E-087 vorher gemessen:** `git grep` und
ein Lauf über den Arbeitsbaum finden „Kanban.tsx" in `tests/**` nur zweimal, beide Male als
Kommentar zu `KanbanCard`/`KanbanColumn` (`tests/e2e/kanban.spec.ts:91` und `:209`) — und die
beiden liegen weiter in `Kanban.tsx`. Kein Prüffall hängt an der Inventarzeile.

Dazu `apps/web/design/DESIGNSYSTEM.md` (zwei Pfadangaben und eine Inventarzeile, eigene Hoheit).

**14 Dateien insgesamt in dieser Welle**, gezählt über `diff -rq` gegen einen Abzug des Baumes
von unmittelbar vor dem ersten Schnitt.

---

## 2  Die Zuordnungen, selbst gemessen — und **vier Korrekturen** an der Auftragsliste

Gemessen über die tatsächlichen Einfuhren, nicht über Dateinamen.

1. **`components/FilterBar.tsx` gehört nicht zum Board.** Neun Einfuhrstellen, sechs davon
   außerhalb der Musterseite, in **fünf** Bereichen: `features/bookings/BookingsScreen`,
   `features/timer/TimeScreen`, `features/todos/TodoListFilters`, `features/todos/TodoListScreen`,
   `screens/ExportAuditScreen` — und das Board, das davon **einen** Namen benutzt
   (`FilterToggle`). Was fünf Bereiche tragen, gehört keinem. **Bleibt in `components/`.**
2. **`components/Menu.tsx` gehört ebenfalls nicht zum Board** — und der Riecher des Auftrags
   stimmt: Neun Einfuhrstellen, sechs außerhalb der Musterseite, davon **fünf außerhalb des
   Boards** (`features/bookings/BookingsScreen`, `features/bookings/BookingTable`,
   `features/todos/TodoDetailScreen`, `features/todos/TodoListScreen`,
   `features/todos/TodoRow`). Nach dem Kriterium aus Welle 2 („ein Baustein in `shared/ui/`
   nimmt Werte entgegen") gehörte es dorthin. **Ich habe es trotzdem nicht bewegt** — siehe
   Abschnitt 4, letzter Punkt.
3. **`components/Kanban.tsx` ist eine Zwitterdatei**, dieselbe Bauart wie `api/idle.ts` in
   Welle 3. Gemessen je Ausfuhr:

   | Ausfuhr | Leser außerhalb der Musterseite | Ergebnis |
   |---|---|---|
   | `KanbanCard`, `KanbanColumn`, `KanbanCardData`, `KanbanTagRef`, `KanbanAppearance` | nur `BoardScreen` | → `features/board/Kanban.tsx` |
   | `ExportSummaryStrip`, `ExportSummaryStripProps`, `ExportSummary` | **`features/todos/TodoRow.tsx`** | → `shared/ui/ExportSummaryStrip.tsx` |

   Der Streifen zeigt den Exportstand der Buchungen **einer Zeile** — auf der Karte, in der
   Todo-Liste und auf der Musterseite. Ihn mit ins Board zu nehmen hieße, daß die Todo-Liste aus
   `features/board/` einführt, und zwar für etwas, das mit dem Board nichts zu tun hat. Der
   zweite Benutzer ist **benannt** und keine Vermutung; das ist die Bedingung, unter der
   `shared/ui/` kein Sammelordner wird.
4. **Nicht jede Poolroute gehört zum Board — aber `listPoolTodos` gehört hin.** Gemessen je
   Route:

   | Route | Aufrufer | Ergebnis |
   |---|---|---|
   | `getBoard` | `BoardScreen` | → `features/board/api.ts` |
   | `listPoolTodos` | **keiner** | → `features/board/api.ts` (siehe unten) |
   | `updatePool` | `BoardScreen`, `BoardSetupDialog`, `features/tags/PoolAdministration`, `screens/PoolFormDialog`, `screens/PoolRenameDialog` | bleibt in `api/endpoints.ts` |
   | `createPool`, `deletePool`, `listPools` | Pool-Fläche und Regelformular | bleiben |

   `listPoolTodos` hat seit T-094 keinen Aufrufer. Sein eigener Kommentar sagt seit damals,
   **wozu** es dasteht: „sie ist der Weiterblätterweg einer Board-Spalte". Eine Route ohne
   Aufrufer gehört dem Merkmal, das sie brauchen würde, nicht der Sammelstelle — und außerhalb
   des Boards hat sie keinen Sinn. **Der Umzug hat außerdem einen Lauf gerettet**, siehe
   Abschnitt 6.

**Was ich sonst gegengemessen und dagelassen habe:** `components/RuleSummary.tsx` (fünf Leser,
einer im Board), `components/RulePickers.tsx` (nur Regelformular und Musterseite),
`lib/poolRule.ts` (acht Leser in sechs Bereichen), `app/exportSummary.ts` (drei Leser: Board,
`features/todos/TodoListScreen`, `features/todos/TodoRow`), `screens/PoolFormDialog.tsx` und
`screens/PoolRenameDialog.tsx` (je zwei Leser: Board **und** `features/tags/PoolAdministration`
— zöge ich sie ins Board, führte die Tag-Fläche aus `features/board/` ein).

---

## 3  Die feature-eigenen Typen: gemessen, nicht geraten

**`features/board/api.ts` bekommt drei:** `BoardColumnView`, `BoardAppearance`, `BoardView`.
Keiner hat außerhalb des Merkmals einen Leser — gemessen über den ganzen Baum einschließlich
`apps/web/test/**` und `tests/**`.

`Pool`, `Todo`, `Id`, `PageCursor`, `Timestamp`, `Page` und `Pagination` bleiben, wo sie sind.
`Pagination` führt `features/board/api.ts` aus `api/endpoints.ts` ein — dieselbe Form, die
`features/todos/api.ts` seit Welle 2 benutzt.

**Kein `features/board/types.ts`**, wie im Auftrag entschieden.

---

## 4  Die Schnitte — und die neun, gegen die ich mich entschieden habe

### `BoardScreen.tsx`: 1332 → 576, drei Verantwortlichkeiten heraus

Vollständig gelesen, dann benannt. **Der entscheidende Befund beim Lesen:** Die Datei enthält
nicht einen Bildschirm mit 1332 Zeilen, sondern **vier Bausteine mit vier fertig
ausgeschriebenen Eigenschaftsflächen**, getrennt durch vier Trennbalken, die schon sagen, wo die
Naht liegt. Der Schnitt erfindet also keine Schnittstelle, er zieht eine vorhandene heraus:

| Heraus | Zeilen | Eigenschaften | Eigener Zustand |
|---|---|---|---|
| `BoardColumn.tsx` | 362 | `BoardColumnProps` — 20, **vorher schon ausgeschrieben** | keiner |
| `BoardSetupDialog.tsx` | 268 | 12, vorher schon ausgeschrieben | `reordering` — **ganz** mit umgezogen |
| `BoardEmptyState.tsx` | 157 | `BoardEmptyStateProps` — 4, **schon vorher ausgeführt** | keiner |

Das ist der Unterschied zu dem Schnitt, den Welle 3 an `BookingDialogs` abgelehnt hat („23
Eigenschaften, um 110 Zeilen JSX zu verlagern"): Dort wären die Eigenschaften **entstanden**,
hier waren sie da. Die Kosten des Schnitts sind zwei `export`-Schlüsselwörter (Abschnitt 7).

`BoardColumn.tsx` nimmt `cardMenu`, `toCard` und `BoardColumnEmpty` mit, weil sie **nur** von
dort aus erreichbar sind (`BoardColumnEmpty` zusätzlich von der Musterseite, wie schon bisher).

**Was bleibt, sind 576 Zeilen, die eine Sache tun:** den Zustand des Bildschirms führen — acht
`useState`, zwei Handlungen mit Meldung und Rückweg (`toggleDone`, `setPlacement`), das
Spaltenmenü und die Komposition der fünf Dialoge.

### `Kanban.tsx`: 394 → 352, eine Verantwortlichkeit heraus

`ExportSummaryStrip` samt `ExportSummary` und `ExportSummaryStripProps` nach `shared/ui/`, siehe
Abschnitt 2 Punkt 3.

### Gegen diese Schnitte habe ich mich entschieden — das ist der wichtigere Teil

1. **`cardMenu` und `toCard` bekommen keine eigene Datei.** Zusammen 76 Zeilen, beide nur von
   `BoardColumn` aus erreichbar, und `toCard` nimmt `ReturnType<typeof useStructure>` entgegen.
   Drei Dateien, die man nur zusammen lesen kann, sind keine Trennung — die Regel aus Welle 3.
2. **`BoardColumnEmpty` bleibt bei `BoardColumn`.** Es *ist* der Leerzustand dieser Spalte; sein
   einziger Leser außerhalb der Musterseite ist `BoardColumn`. Als eigene Datei wäre es eine
   ehrliche 110-Zeilen-Datei — aber sie stünde neben einer 250-Zeilen-Datei, die ohne sie
   unvollständig ist.
3. **`KanbanCard` und `KanbanColumn` bleiben in einer Datei.** Sie teilen `Menu`, `Icon`,
   `IconButton` und die zusammengehörige CSS-Familie `kcard__*` / `kcolumn__*`; keine der beiden
   ist 200 Zeilen. Ein Schnitt wäre Bewegung, keine Struktur.
4. **`seedTagIds` und `seedTagsOf` bleiben im Bildschirm.** Zwei Funktionen, sieben Zeilen, drei
   Aufrufstellen — alle drei im Bildschirm.
5. **`toggleDone` und `setPlacement` werden keine Haken.** Beide schreiben nichts an eigenem
   Zustand, aber beide bilden ihre Meldung aus Werten, die der Bildschirm führt (`showDone` bei
   `toggleDone`), und `setPlacement` ruft sich für „Rückgängig" **selbst** auf. Der
   ausgeschriebene Typ `PlacementChange` steht ausdrücklich deshalb da (der Kommentar sagt es:
   ohne ihn setzte der Übersetzer `any` ein). Ein Haken dazwischen wäre eine Zwischenschicht für
   nichts.
6. **`components/FilterBar.tsx`, `components/RuleSummary.tsx`, `lib/poolRule.ts`,
   `app/exportSummary.ts` bleiben** — gemessen, Abschnitt 2.
7. **`screens/PoolFormDialog.tsx` und `screens/PoolRenameDialog.tsx` bleiben.** Eine Regel ist
   ein Pool-Ding; die Pool-Fläche liegt in `features/tags`. Ins Board gezogen kehrte die
   Abhängigkeit sich um.
8. **`api/types.ts` behält `PoolRuleTerm`, `PoolResolution` und `PoolSurfaceQuery`.** Sie
   beschreiben die Regel, nicht das Board, und haben Leser in `features/tags`, im Regelformular
   und in `lib/poolRule.ts`.
9. **`components/Menu.tsx` bleibt, wo es ist — und ich sage, warum.** Es erfüllt das Kriterium
   für `shared/ui/`, das ist gemessen. Aber: Der Umzug faßt neun Dateien an, betrifft das Board
   nur mit **einem Typnamen**, und er gehört in denselben Auftrag wie `Primitives.tsx` (über
   dreißig Leser), `FormDialog.tsx` und `FilterBar.tsx` — sonst hat `shared/ui/` nach Welle 5
   drei Bausteine derselben Sorte an zwei Orten. **Ein Schnitt, der nicht zur Aufgabe gehört,
   wird nicht nebenbei gemacht.** Vorschlag steht in Abschnitt 12.

---

## 5  Die Kantenfrage, gemessen

```
board → todos  : 3 Kanten   (BoardScreen → ../todos/api, ../todos/TodoFormDialog, ../todos/undoDone)
board → timer  : 1 Kante    (BoardScreen → ../timer/TimerContext)
todos  → board : 0 Kanten
timer  → board : 0 Kanten
tags   → board : 0 Kanten
bookings → board : 0 Kanten
```

**Das Board ist ein Blatt.** Kein anderes Merkmal führt aus `features/board/` ein — genau
deshalb mußte `ExportSummaryStrip` heraus: Er wäre die einzige Kante `todos → board` gewesen,
und zwar für einen Baustein, der vom Board nichts weiß.

Der Rückgriff `features/board/ → screens/` steht bei drei Stellen: `screens/parts`,
`screens/PoolFormDialog`, `screens/PoolRenameDialog`. Dieselbe Übergangsform wie in Welle 1
bis 3 (Abschnitt 11).

---

## 6  Der Befund, der nicht meiner ist: `proof:callers` wäre beinahe rot geworden

**Gemessen, nicht vermutet.** Nach dem ersten Schnitt — `getBoard` in `features/board/api.ts`,
`listPoolTodos` weiter in `api/endpoints.ts` — lief `proof:callers` auf **60 bestanden, 1
fehlgeschlagen**:

```
FEHL  die Probe „`nurOffene` statt `includeCompleted` (still wirkungslos)" lässt sich anwenden
      — die Stelle steht in 2 Aufrufdateien: api/endpoints.ts, features/board/api.ts
```

Die Selbstprobe `REGRESSIONS` (`apps/local-api/scripts/proof-callers.mjs:1237`) sucht die
Zeichenkette `includeCompleted: "true"` und verlangt **genau eine** Trägerdatei. Der Kommentar
daneben sagt es selbst: „Zwei heißt: Der Zuwachs unten wäre zwei, und die Probe verlangt eins."
Solange `getBoard` und `listPoolTodos` in derselben Datei standen, war es eine. Ein Merkmal
herauszuschneiden macht daraus zwei.

**Ich habe die Datei nicht angefaßt.** Der Umzug von `listPoolTodos` nach `features/board/api.ts`
(Abschnitt 2 Punkt 4) führt beide Vorkommen wieder in **eine** Aufrufdatei zusammen; der Lauf
steht damit wieder bei **61 bestanden, 0 fehlgeschlagen**. Das war nicht der Grund für den
Umzug — der Grund steht in Abschnitt 2 —, aber es ist sein Nebeneffekt, und er verdeckt ein
Strukturproblem:

> **Offene Frage 1.** Die Probe hält nur so lange, wie jede ihrer vier Zeichenketten in genau
> einer Aufrufdatei steht. Bei sechs Aufrufdateien und wachsender Zahl ist das Glück, nicht
> Bauart. `includeCompleted: "true"` steht heute zweimal in derselben Datei; sobald jemand
> `listPoolTodos` benutzt oder eine dritte Route diesen Abfrageschlüssel schickt, ist der Lauf
> rot, ohne daß am Bestand etwas falsch wäre. **Gehört domain-dev**, nicht mir.

### Und die Auflage aus dem Auftrag: `NOT_CALLED_BY_UI`

**Beide Einträge sagen heute etwas Falsches.** Gemessen:

| Eintrag | Der Satz daneben | Gemessen |
|---|---|---|
| `getBoard` | „bis dahin gruppiert `BoardScreen.tsx` weiterhin selbst nach Status und ruft diese Route nicht an" | `features/board/api.ts:86` ruft `request<BoardView>("/board", …)` an, `features/board/BoardScreen.tsx:159` ruft `getBoard({ … })` |
| `getVersionCheck` | „Der Aufrufer entsteht mit dem Dialog in T-139" | `api/endpoints.ts:416` ruft `request<VersionCheckView>("/version-check")` an, `app/useUpdateNotice.ts:145` ruft `getVersionCheck()` |

Beide Schlüssel liegen damit in `result.covered` — die Route-Prüfung aus Abschnitt 2 des Laufs
ist grün, also haben beide Aufrufe eine vorhandene Operation getroffen. Der Lauf wird durch die
Streichung **nicht rot**; die Zeilen sagen nur etwas Falsches, und die Sätze daneben behaupten
einen Bauzustand, den es seit T-072 beziehungsweise T-139 nicht mehr gibt.

**Gemeldet, nicht eingetragen** — `apps/local-api/scripts/proof-callers.mjs` gehört domain-dev.

---

## 7  Gegenprobe, daß nichts verlorenging

Wie in Welle 1 bis 3 **zeilenweise gegen einen Abzug des Baumes von vor dem ersten Schnitt**
(nicht gegen `git show HEAD:…` — HEAD kennt Welle 1 bis 3 noch nicht, der Vergleich wäre
unscharf gewesen; im Arbeitsbaum stehen 20 geänderte Dateien aus fremden Aufträgen).

**Der schärfste Vergleich zuerst.** Ich habe aus beiden Ständen Blockkommentare,
Zeilenkommentare, JSX-Kommentare und Einfuhrzeilen entfernt und die verbleibenden
**Anweisungszeilen** als Mengen verglichen:

| Vergleich | Anweisungszeilen vorher | Ergebnis |
|---|---|---|
| `BoardScreen.tsx` → die vier Dateien | 800 | **zwei** Unterschiede, ausgeschrieben unten |
| `Kanban.tsx` → `Kanban.tsx` + `shared/ui/ExportSummaryStrip.tsx` | 228 | **CODE IDENTISCH** |
| `api/endpoints.ts` + `api/types.ts` → dieselben + `features/board/api.ts` | 585 | **CODE IDENTISCH** |

**Die zwei Unterschiede, die durch das Aufteilen entstanden sind und die ich einzeln benenne:**

```
function BoardColumn({       →  export function BoardColumn({
function BoardSetupDialog({  →  export function BoardSetupDialog({
```

Mehr nicht. **Kein Ausdruck geändert, keine Anweisungszeile verloren, keine hinzugekommen** —
dieselbe Klasse Unterschied wie `function toRows(` → `export function toRows(` in Welle 3.

**Der zweite Vergleich, gegen Leerraum normalisiert, über alle Zeilen einschließlich
Kommentaren**, ergibt darüber hinaus genau drei Sorten:

1. **Einfuhrzeilen** — der Pfad ist eine Ebene tiefer, die Sammelzeilen sind je Datei neu
   sortiert.
2. **Vier Trennbalken-Blöcke** (`/* ==== */ /* Eine Spalte */ /* ==== */` und drei weitere).
   Ihre Überschriften stehen jetzt als Dateikopf beziehungsweise als Dateiname. Der vierte
   Balken („Der Leerzustand einer einzelnen Spalte") steht unverändert **in**
   `BoardColumn.tsx`, weil diese Datei zwei Dinge führt.
3. **Die Kommentarblöcke aus Abschnitt 8**, die ins Papier gewandert sind.

**`features/board/api.ts` ist zeichengleich** zu `api/types.ts:537-580` und
`api/endpoints.ts:159-217` — Gegenprobe: aus den beiden Quellabschnitten sind nur die vier
Trennbalken und die zwei Abschnittsüberschriften nicht wiederzufinden, sonst nichts. Beide
`{@link}`-Verweise (`getBoard` ↔ `listPoolTodos`) stehen **wieder zeichengleich**, weil beide
Funktionen in derselben Datei gelandet sind.

**`api/types.ts` hat null hinzugefügte Zeilen** — nur der Board-Abschnitt ist heraus.
**`api/endpoints.ts`** ebenso, dazu die zwei Typnamen `BoardView` und `Todo` aus der
Einfuhrliste, die dort nicht mehr gebraucht werden.

---

## 8  Kommentare — was wanderte, was blieb

Nach demselben mechanischen Kriterium wie in Welle 1 bis 3: Rückblick, der nichts mehr anweist,
geht ins Papier. **Neun Blöcke** in `docs/decisions/board.md`:

| Woher | Was |
|---|---|
| `BoardScreen.tsx`, Kopf | „stand bis T-091 an elf Stellen und schickte den Benutzer … suchen" |
| `BoardScreen.tsx`, `toggleDone` | „Bis T-091 stand hier „Die Regeln ihrer Spalten treffen unverändert zu" …" samt der T-094-Fortsetzung |
| `BoardScreen.tsx`, `toggleDone`, `action` | „Bis dahin bot ihn nur die Todo-Liste an — dieselbe Handlung mit zwei Schutzniveaus" |
| `BoardScreen.tsx`, `setPlacement` | „Bis T-091 war „Vom Board nehmen" auf dieser Fläche durch einen Bestätigungsdialog geschützt …" |
| `BoardScreen.tsx`, `setPlacement` | „Bis dahin gab jede Aufrufstelle ihren Titel selbst mit (`spoken`) — vier Stellen …" |
| `BoardScreen.tsx`, `columnMenu` | „Bis T-133 gab es den Eintrag nicht: Wer eine Spalte umbenennen wollte …" |
| `BoardScreen.tsx`, `onAdopt`/`onRemove` | „Bis T-102 tat das nur „Vom Board nehmen" …" |
| `BoardEmptyState.tsx`, `onOpenSetup` | „Bis dahin hieß diese Eigenschaft `onCreate` und sprang direkt in `PoolFormDialog` …" |
| `Kanban.tsx`, `KanbanAppearance.otherColumns` | „Bis T-133 hieß dieses Feld `readonly string[]` …" |

Die **Regel** jedes Blocks steht weiter im Quelltext: „Die Ansicht rechnet die Bewegung nicht
selbst", „Der Rückweg an allen drei Flächen, keiner in der Gegenrichtung", „Kein
Bestätigungsdialog, und das ist Absicht", „Der Wortlaut steht nicht hier", „Es sind zwei
Handlungen und nicht eine", „Beide Knöpfe schließen den Dialog, und zwar vor der Meldung", „Der
Name sagt, wohin es geht, nicht was am Ende herauskommt", „Die Marke sitzt am Element und nicht
an der Reihe". Jede betroffene Datei trägt „Vorgeschichte: `docs/decisions/board.md`" — fünfmal
in `BoardScreen.tsx`, je einmal in den vier übrigen.

### Stehengelassen, mit Begründung — **sechs**, und vier davon hat ein Prüfer verlangt

1. `BoardScreen.tsx`, „## Was hier nicht mehr steht" — die Grabinschrift des Ziehens
   (`DRAG_MIME`, `draggable`, `dropColumn`, `moveByOffset`). Ohne sie baut sie jemand aus
   bester Absicht neu.
2. `Kanban.tsx`, „## Warum hier nichts mehr gezogen wird" — dieselbe Inschrift und dazu die
   **Zusage zu SC 2.5.7**: „Was es nicht gibt, braucht keine Ersatzbedienung." Ein Satz über
   eine Barrierefreiheitsanforderung fällt nicht beim Aufräumen.
3. `BoardScreen.tsx`, der Kommentar am `lead` — **Auflage aus T-177 Abschnitt 1.1**: „Der Satz
   bleibt ungekuerzt."
4. `BoardEmptyState.tsx`, der Ausgleichsnachweis zu UM-08 — **E-081 Punkt 4**, nennt für jeden
   der vier gestrichenen Punkte den heutigen Träger, darunter **SP-22** auf der Sperrliste.
5. `BoardEmptyState.tsx`, der Kommentar an `description` mit dem Verweis auf
   `tests/e2e/board-empty-state-rule-chain.spec.ts` — **Auflage Z-07 Punkt 1**, und er sagt
   selbst: „Ein Kommentar, der die Erfuellung einer Auflage behauptet, nennt entweder die
   Stelle, an der sie gemessen wird, oder er behauptet sie nicht."
6. `BoardSetupDialog.tsx`, der Kommentar an `description={RULE_IS_A_RULE}` — dieselbe Auflage,
   zweite Stelle.

**Kein Satz eines Prüfers ist gefallen** (E-078 Punkt 3). Die zwei offenen Fragen aus Welle 1
(`consequence` in `TagAdministration.tsx`, „(Befund O-DZ, T-167.)") sind erneut nicht angefaßt.

**Kein Oberflächentext gestrichen und kein zugänglicher Name geändert** (E-087). Die eine
geänderte Zeichenkette ist die Dateiangabe der Musterseite (Abschnitt 1), vorher gemessen.
Gegenprobe: `contrast`, `proof:surface` (29 Live-Regionen, 2 geduldete Sätze), `proof:codepoints`
und die Prüfsumme über 1570 Prüffälle sind **zeichengleich**.

---

## 9  Zahlen — vorher gemessen, nicht zitiert

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | **grün** |
| `pnpm boundaries` | 429 Quelldateien außerhalb der Domäne | **434** (+5) |
| `pnpm contrast` | 261 Paare, 0 von 522, 83/83 Farbtoken, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **144** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 6 Aufrufen | 21/0 — **149**, sonst zeichengleich |
| `pnpm run proof:surface` | 27/0 — **144** Quelldateien, 2 Einstiegsseiten, 7 Stilblätter, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **149**, sonst zeichengleich |
| `pnpm run proof:callers` | 61/0, **5** Aufrufdateien, 4 zu 4, 75 Aufrufe | 61/0, **6** Aufrufdateien, **5 zu 5**, **75** Aufrufe |
| `pnpm run proof:all` | Ausgangskode 0 | **Ausgangskode 0** |
| `pnpm test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `apps/web` `pnpm build` | grün | grün, `BoardScreen` 18,32 kB und `ExportSummaryStrip` 1,66 kB als **eigene** Stücke |

**Die einzige Zahl, die sich bewegt hat, ist dieselbe in drei unabhängigen Zählern: +5.** Fünf
neue Quelldateien, keine gelöschte. `boundaries` zählt über den Modulgraphen, `proof:foreign`
über den TypeScript-Übersetzer, `proof:surface` über den eigenen Sammler — drei Wege, dieselbe
Fünf. **75 Aufrufe, unverändert**: zwei Routen sind umgezogen, nicht vermehrt.

Zeilen: `BoardScreen.tsx` **1332 → 576**, `Kanban.tsx` 394 → 352, `api/endpoints.ts` 492 →
**429** (−63), `api/types.ts` 1100 → **1055** (−45).

### E2E — einzeln über `tests/e2e/playwright.config.ts`

| Dateien | Ergebnis |
|---|---|
| `kanban`, `board-empty-state-rule-chain`, `done-movement-announcement`, `focus-return-after-dialog` | 15 bestanden, **1 rot: TP-KANBAN-04** |
| `toast-eviction`, `focus-return-after-dialog`, `pool-movement-sentence`, `todo-revival` | 16 bestanden, **1 rot: `toast-eviction.spec.ts:123`** |
| `foreign-title-display`, `midnight-redraw`, `web-build-smoke`, `todo-filter-layout` | **5 bestanden** |

**TP-KANBAN-01, -02, -03 und -06 sind grün**, ebenso `board-empty-state-rule-chain`
(TP-KANBAN-08, die Kette Leerzustand → Einrichtungsdialog → `RULE_IS_A_RULE`) und
`done-movement-announcement`. Das sind die Fälle, die genau das messen, was ich zerschnitten
habe.

**Beide roten am zurückgebauten Vorzustand gemessen, nicht behauptet.** Ich habe den Baum
vollständig in den Stand vor T-253 zurückversetzt (`apps/web/src` aus dem Abzug ersetzt,
`typecheck` grün als Beleg, daß der Rückbau vollständig war), dieselben Läufe dort gefahren und
danach zeichengleich wiederhergestellt (`diff -r` gegen den Abzug, ohne Befund, `typecheck`
erneut grün):

| Fall | vorher | nachher | Urteil |
|---|---|---|---|
| `kanban.spec.ts:288` TP-KANBAN-04 | **rot**, `expect(cardInOpen).not.toHaveClass(/kcard--running/)` (`:350`) | rot, **dieselbe Zusicherung, dieselbe Zeile** — in einem von zwei Läufen flatternd (erster Lauf: bestanden nach Wiederholung) | nicht meiner (benannt) |
| `toast-eviction.spec.ts:123` | **rot**, Zeitüberschreitung bei `Spalte … verwalten` (`:153`) | rot, Zeitüberschreitung bei `Erledigte einblenden` (`:166`, **auf der Todo-Liste**) | nicht meiner (benannt) |

Zu `toast-eviction.spec.ts:123` gehört eine Beobachtung, die ich melde, weil sie den Befund
schärft: Der Fall bricht in beiden Ständen an der **60-Sekunden-Frist des Prüffalls** ab, aber
an verschiedenen Stellen — vorher schon am Spaltenmenü des Boards, nachher erst 13 Zeilen
später am Filterknopf der **Todo-Liste**. Er kommt mit meinem Stand also **weiter**, nicht
kürzer. Die Stelle, an der er jetzt hängt (`features/todos/TodoListFilters.tsx`), habe ich in
dieser Welle nicht angefaßt. Der Fall ist damit weiterhin der fünfte benannte rote — aber die
Zeilenangabe in der Liste sollte nicht auf das Spaltenmenü festgeschrieben werden: **er hängt
nicht an einer Stelle, sondern an seiner Laufzeit.**

Der Stand bleibt **106/5**.

---

## 10  Grenzüberschreitungen, die ich melde

**Keine in `apps/web/test/**`.** Der Umbau hat dort nichts zu tun: Kein Prüffall führt
`components/Kanban`, `screens/BoardScreen`, `api/endpoints` oder `ExportSummaryStrip` ein
(gemessen über den ganzen Ordner). Die stehende Erlaubnis war diesmal nicht nötig.

**Zwei Dateien in eigener Hoheit, die kein Quelltext sind:**

- `apps/web/design/DESIGNSYSTEM.md` — zwei Pfadangaben (Zeile 796) und eine Inventarzeile
  (Zeile 992/993, aus einer Zeile werden zwei, weil der Exportstreifen jetzt woanders liegt).
  `apps/web/**` gehört frontend-dev; ich melde es trotzdem, weil das Papier gelesen wird.
- `docs/decisions/board.md` — neu, ausdrücklich im Auftrag.

---

## 11  Annahmen

1. **`screens/parts.tsx` bleibt, wo es ist.** `features/board/BoardScreen.tsx` greift mit
   `../../screens/parts` darauf zurück — dieselbe Übergangsform wie in Welle 1 bis 3. Es ist
   jetzt der Rückgriff von **fünf** Merkmalsordnern (`tags`, `todos`, `timer`, `bookings`,
   `board` — sieben Dateien). Die Frage aus Welle 3 ist unbeantwortet; ich habe sie **nicht**
   nebenbei entschieden.
2. **`features/board/Kanban.tsx` behält seinen Dateinamen.** Nach der in Welle 3 geschärften
   Regel („Ein Baustein, der den Namen des Merkmals trägt, gehört ins Merkmal") ist das der
   Regelfall: Der Ordner heißt `board`, der Baustein heißt `Kanban`, und beide meinen dasselbe.
3. **Der Bildschirm behält seinen Namen** (`BoardScreen.tsx`), wie in Welle 1 bis 3.
4. **`shared/ui/ExportSummaryStrip.tsx` führt aus `components/ExportStatus.tsx` ein.** Das ist
   heute richtig — `ExportStatus.tsx` hat 16 Leser in allen Bereichen — und wird zur
   verkehrten Richtung, falls Welle 5 `ExportStatus.tsx` nach `features/export/` zöge. Es
   gehört nach `shared/ui/`, nicht ins Merkmal. Siehe offene Frage 3.
5. **`ExportSummary` steht jetzt zweimal im Baum** — in `shared/ui/ExportSummaryStrip.tsx` und
   zeichengleich in `app/exportSummary.ts:31`. **Das war schon vorher so** (`components/Kanban.tsx:57`
   gegen `app/exportSummary.ts:31`); ich habe die Doppelung verschoben, nicht erzeugt, und sie
   nicht aufgelöst, weil das eine Entscheidung über den Ort ist und keine Umbaufrage. Siehe
   offene Frage 4.

---

## 12  Risiken

- **Zeilennummern in Papieren zeigen ins Leere** — dieselbe Klasse wie in Welle 1 bis 3.
  Gemessen, nicht angefaßt (fremde Hoheit):
  - `docs/design/traeger-und-zusage.md:806` — `apps/web/src/screens/BoardScreen.tsx:1046-1053`
  - `docs/design/textbestand.md:25, 485, 499, 592, 644, 645, 654, 658, 659` — `BoardScreen.tsx`
    mit acht verschiedenen Zeilenangaben
  - `.claude/team/board.md:1395` — `apps/web/src/screens/BoardScreen.tsx:975-1008`
    (gestrichener Eintrag O-EC)
  - `tests/e2e/kanban.spec.ts:215, 393`, `tests/e2e/toast-eviction.spec.ts:21, 150`,
    `tests/e2e/toast-tab-order-scroll.spec.ts:15`, `tests/e2e/support/actions.ts:136` — alle
    nennen `BoardScreen.tsx` **ohne Pfad**; der Dateiname ist unverändert, sie zeigen weiter
    richtig.
- **`proof:callers`, Abschnitt „REGRESSIONS"** — Abschnitt 6, offene Frage 1. Heute grün, aber
  aus einem Grund, der beim nächsten Schnitt wieder wegfallen kann.
- **Keine Sicherheitsfläche berührt.** Kein neues `fetch`, kein neuer `request`-Ort außer der
  einen gemessenen Aufrufdatei, keine Adresse, kein Öffnen-Befehl, keine CSP.
  `proof:release-safety`, `proof:route-policy` und `proof:shell-surface` unverändert grün
  (`proof:all`, Ausgangskode 0).
- **Die Rundung ist nicht angefaßt.** Das Board rechnet nichts; `formatDuration` zeigt an, was
  `app/exportSummary.ts` aus den Antworten des Dienstes addiert, und gerundet wird weiterhin
  ausschließlich im Export.
- **Der Timer auf einem erledigten Todo** — die Regel aus A-2.5 läuft über
  `timer.toggle(todo.id, todo.title)` und `timer.reactivated`; beide stehen zeichengleich, nur
  eine Ebene tiefer. `todo-revival` und `done-movement-announcement` sind grün.
- **Der A-19.19-Widerspruch ist nicht berührt.** An der Add-in-Fläche nichts gebaut, weder aus-
  noch zurück.

---

## 13  Offene Fragen

1. **`proof:callers`, `REGRESSIONS`** (Abschnitt 6) — die Selbstprobe verlangt genau **eine**
   Trägerdatei je Zeichenkette. Bei sechs Aufrufdateien ist das nicht mehr gesichert. **Gehört
   domain-dev.**
2. **`NOT_CALLED_BY_UI`** (Abschnitt 6) — `getBoard` und `getVersionCheck` gehören heraus, samt
   der beiden Absätze daneben, die einen Bauzustand behaupten, den es nicht mehr gibt. Gemessen,
   nicht eingetragen. **Gehört domain-dev.**
3. **`components/ExportStatus.tsx` und `components/Menu.tsx`, `Primitives.tsx`, `FormDialog.tsx`,
   `FilterBar.tsx`** — fünf Bausteine mit vielen Lesern, die nach dem Kriterium aus Welle 2 in
   `shared/ui/` gehören und heute in `components/` liegen. **Vorschlag: ein eigener Auftrag
   „`shared/ui` schließen" nach Welle 5**, damit `shared/ui/` nicht bausteinweise entsteht und
   `ExportSummaryStrip` nicht als einziger Bewohner aus `components/` einführt (Annahme 4).
4. **`ExportSummary` steht zeichengleich an zwei Orten** (Annahme 5). Auflösen heißt: einen Ort
   wählen. `shared/ui/ExportSummaryStrip.tsx` wäre der Baustein, `app/exportSummary.ts` der
   Erzeuger. Ich habe nicht entschieden.
5. **`screens/parts.tsx`** — Welle 1 bis 3 haben gefragt, Welle 4 fragt wieder, jetzt mit
   **fünf** rückgreifenden Merkmalsordnern. Nach der Schnittregel gehört es nach `shared/ui/`.
   Es wäre in Auftrag 3 mitzunehmen.
6. **`toast-eviction.spec.ts:123`** (Abschnitt 9) — der Fall bricht an seiner Laufzeit ab, nicht
   an einer Stelle: Er hängt im Vorzustand am Spaltenmenü, in meinem Stand dreizehn Zeilen
   später auf der Todo-Liste. Wer ihn übernimmt, sucht keinen kaputten Knopf, sondern eine
   60-Sekunden-Frist, die für vier Todos, eine Spalte, zwei Bildschirmwechsel und sechs
   Meldungen zu kurz ist.
7. **`visual-qa` habe ich nicht gefahren** — die Rolle steht mir in dieser Sitzung nicht als
   Werkzeug zur Verfügung. Ersatzweise gemessen: der Bau ist grün und schneidet `BoardScreen`
   als eigenes Stück, `proof:surface` zählt dieselben 29 Live-Regionen und dasselbe Raster,
   `contrast` ist zeichengleich, und die gerenderten Board-Flächen werden von **36 bestandenen
   E2E-Zusicherungen** bedient, darunter alle sechs Kanban-Fälle außer dem benannten roten. Es
   gibt **keine** Änderung an CSS, an Klassennamen oder an JSX-Text. Ein Abnahmeblick bleibt
   offen.

---

## 14  Nächster Schritt

`features/export` als Welle 5 — `screens/ExportScreen.tsx` (1340 Zeilen) ist jetzt die letzte
vierstellige Datei im Baum. Es nähme `ExportScreen`, `ExportAuditScreen`, `TemplatesScreen`,
`TemplateFields`, `TemplatePreview`, `components/Export*` (fünf Dateien), `app/exportAudit.ts`,
`lib/exportTemplateModel.ts`, `lib/exportDirectoryAdvice.ts` und die Exportrouten mit — **und
dann auch `app/dayGroup.ts`**, dessen fünf Leser alle dieselbe eine Frage stellen.

Danach ist `api/endpoints.ts` klein genug, daß `structure` und `settings` in einem Zug gehen.

Vor Welle 5 gehören die Fragen 1 und 2 beantwortet — sie liegen beide in `proof-callers.mjs`,
und Welle 5 verschiebt erneut Routen. Frage 3 ist der natürliche Auftrag **nach** Welle 5.
