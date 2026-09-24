Aufgabe: T-069 — Prüffälle für die Board-Regeln, und ein totes Feld entfernen.

Status: Teil 1 fertig. Teil 2 nicht umgesetzt — Befund und fertige Diffs für eine gemeinsame Welle
mit domain-dev, siehe Abschnitt 2.

---

## Artefakte

Neu:

```
packages/domain/test/board.test.ts   NEU (12 Prüffälle) — boardAppearances (E-054, T-066)
```

Nicht angefasst: `packages/*/src/**`, `apps/**`, `tests/e2e/**`, `docs/**`,
`packages/storage/test/support/migrated-database.ts`,
`packages/storage/test/repo-todos.test.ts`, `packages/storage/test/mappers.test.ts` — Begründung in
Abschnitt 2. Kein `git commit` (Repository ist ohnehin kein Git-Verzeichnis in dieser Umgebung).

---

## 1 — Vier Prüffälle für `boardAppearances`, plus zwei

`packages/domain/src/board.ts` lag laut T-066-Bericht bei 10 % Abdeckung (Zeile für Zeile über
`proof:openapi` gefahren, aber ohne eigenen Prüffall). `packages/domain/test/board.test.ts` deckt
jetzt genau die vier Fälle aus der „Offenen Frage 1" des T-066-Berichts ab, dazu die beiden aus dem
Auftragstext ausdrücklich genannten Ergänzungen (leere Regel, Übereinstimmung mit `matchesPool`)
und zwei Randfälle. Zwölf Prüffälle insgesamt, sechs Blöcke:

| Block | Prüffälle | Was er zusichert | Wodurch er rot würde |
|---|---|---|---|
| Mehrere Spalten gleichzeitig | 3 | Karte in 2 von 3 Spalten → beide Kennungen, in Spaltenreihenfolge; Karte in genau 1 Spalte → **kein** Eintrag; drei Spalten, Fund-Reihenfolge der Tags ≠ Spaltenreihenfolge → Ausgabe folgt trotzdem der Spaltenliste | Eine übersehene/zusätzliche Spalte in der Trefferliste; ein `>= 1`-Schwellwert statt `> 1`; eine nach Fund statt nach Spaltenindex sortierte Ausgabe |
| Leere Regel trifft nichts | 3 | `any` mit leerer Regel: kein Treffer; **`all` mit leerer Regel: kein Treffer** — der eigentliche Fallstrick, weil `[].every(...)` in JavaScript vakuos `true` liefert; zwei leere Spalten gleichzeitig, Karte mit vielen Tags: keine Mehrfachnennung | Der Fehlschluss „leere Regel im Modus `all` ist immer erfüllt" — d. h. wenn die `if (ruleTagIds.length === 0) return false`-Wache aus `matchesPool` vor der `every`-Verzweigung entfernt würde |
| Mehrere zutreffende Regelterme EINER Spalte = eine Nennung | 3 | `any` mit 5 Regel-Tags, 3 davon zutreffend → 1 Nennung, nicht 3; `all` mit 3 zutreffenden Tags → 1 Nennung; **Nachweisfall** mit einer absichtlich falschen Vergleichsimplementierung, die pro zutreffendem Regel-Tag zählt statt pro Spalte | Eine Umsetzung, die über `ruleTagIds` statt über `columns` iteriert und pro Treffer erneut `columnIds.push(column.columnId)` aufruft — **exakt der im Auftrag beschriebene Fehler**, siehe Rot-Nachweis unten |
| Übereinstimmung mit `matchesPool` | 1 | Für einen Bestand aus 4 Spalten (`any`/`all`/leer gemischt) und 5 Karten wird die erwartete Mehrfachliste **unabhängig** aus `matchesPool` nachgebaut und gegen `boardAppearances` verglichen | `boardAppearances` würde rot, sobald sie irgendeine eigene, von `matchesPool` abweichende Logik verwendet — z. B. eine andere Behandlung von `all` bei teilweisem Treffer, oder eine Sonderregel für leere Karten |
| Randfälle | 2 | Keine Spalten → `[]`; keine Karten → `[]` | Ein Zugriffsfehler auf ein leeres Array, oder eine Umsetzung, die versehentlich Einträge für nicht existente Karten/Spalten erzeugt |

**„Übereinstimmung zwischen SQL-Abfrage und Domänenregel" — was davon in `packages/domain/test`
prüfbar ist und was nicht.** `packages/domain` kennt kein SQL (E-001, Kopfkommentar von
`kernel.ts`). Die SQL-Seite der Übereinstimmung bleibt zwingend Sache von `proof:openapi`
Abschnitt 11 am laufenden Dienst (dort bereits grün, siehe T-066-Bericht Abschnitt 5). Was sich
hier, rein und ohne Dienst, zusichern lässt und die Domänenseite dieser Übereinstimmung ist: dass
`boardAppearances` seine Entscheidung ausschließlich über `matchesPool` trifft — dieselbe Funktion,
die `repo-todos.ts` in SQL nachbildet — und keine eigene, zweite Fassung der Regel enthält. Das ist
der Block „Übereinstimmung mit `matchesPool`" in der Tabelle oben.

### Rot vor Grün

`boardAppearances` existiert bereits vollständig seit T-066 und ist rein; sie war nie ein
Funktionstyp-Stub wie z. B. `matchesPool` in T-010. Ein literales „Cannot find module" wäre hier
keine ehrliche Rot-Phase. Der Rot-Nachweis lief deshalb über eine absichtlich falsche
Vergleichsimplementierung, die exakt den im Auftrag benannten Fehler begeht — sie zählt zutreffende
Regel-**Terme** statt zutreffende **Spalten**:

```ts
function boardAppearancesCountingRuleTerms(columns, cards) {
  const appearances = [];
  for (const card of cards) {
    const columnIds = [];
    const onCard = new Set(card.tagIds);
    for (const column of columns) {
      for (const ruleTagId of column.ruleTagIds) {          // Fehler: pro Regel-Tag statt pro Spalte
        if (onCard.has(ruleTagId)) columnIds.push(column.columnId);
      }
    }
    if (columnIds.length > 1) appearances.push({ todoId: card.todoId, columnIds });
  }
  return appearances;
}
```

Erster Lauf, mit der (falschen, naiven) Erwartung `expect(buggy).toEqual(correct)`:

```
FAIL  packages/domain/test/board.test.ts > … > Nachweis: die falsche Vergleichsimplementierung …
AssertionError: expected [ { todoId: 'todo-9', …(1) } ] to deeply equal []
- Expected
+ Received
- []
+ [
+   {
+     "columnIds": [ "col-weit", "col-weit" ],
+     "todoId": "todo-9",
+   },
+ ]
 Test Files  1 failed (1)
      Tests  1 failed | 11 passed (12)
```

Eine Karte, die über **zwei** Regel-Tags derselben, einzigen Spalte hineinpasst, wird von der
naiven Umsetzung fälschlich als „Mehrfachnennung" mit `columnIds: ["col-weit", "col-weit"]`
gemeldet — dieselbe Spalte zweimal, obwohl die Karte gar nicht in mehreren Spalten steht. Genau der
Fall aus dem Auftrag: „eine falsche Umsetzung dieselbe Karte doppelt zeigt".

Danach die Zeile durch die dauerhaft grüne Fassung ersetzt, die beide Ergebnisse ausdrücklich
auseinanderhält (`expect(buggy).toEqual([...])`, `expect(correct).toEqual([])`,
`expect(buggy).not.toEqual(correct)`) und um einen zweiten Teilfall mit einer echten zweiten Spalte
ergänzt, damit der Beweis auch im committeten, grünen Lauf sichtbar bleibt statt nach der
Korrektur der Erwartung wieder zu verschwinden:

```
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

Die naive Funktion (`boardAppearancesCountingRuleTerms`) steht ausschließlich in der Testdatei,
wird nirgends exportiert oder importiert und ist keine Kopie von etwas in `src/`.

### Abdeckung

| | Statements | Branches | Funktionen | Zeilen |
|---|---|---|---|---|
| `board.ts` **vorher** (bestätigt neu gemessen, `pnpm run test:coverage`) | 10 | 0 | 0 | 11,11 |
| `board.ts` **nachher** | 100 | 100 | 100 | 100 |
| `packages/domain/src` **vorher** (Aggregat) | 85,0 | 83,2 | 93,02 | 85,1 |
| `packages/domain/src` **nachher** (Aggregat) | 89,09 | 86,4 | 95,34 | 89,36 |

Beide Zahlen für „vorher" durch einen eigenen Lauf ohne `board.test.ts` (Datei kurzzeitig aus dem
Testordner entfernt, Lauf wiederholt, Datei zurückgelegt) neu gemessen — nicht nur aus dem
T-066-Bericht übernommen. Sie stimmen exakt überein (85,0/83,2/93,02/85,1), was zusätzlich bestätigt,
dass in der Zwischenzeit sonst niemand `packages/domain/src` oder `packages/domain/test`
verändert hat.

---

## 2 — `todo.board_rank`: Befund gemessen, Weg 2 gewählt, keine Änderung an den Testdateien

Der Auftrag nennt zwei Wege: entweder ziehe ich meine beiden Stellen jetzt nach (er liefert die
Migration danach nach), oder — falls das nicht ohne Umweg geht — wir melden uns über den
Orchestrator ab und er macht beides in einem. **Ich bin Weg 2 gegangen**, und zwar nicht aus
Vorsicht, sondern weil ich Weg 1 zuerst ausprobiert und **gemessen** habe, dass er nicht ohne
Umweg geht:

### Befund 1 — `migrated-database.ts:61` lässt sich nicht isoliert ändern

`board_rank` ist in Migration 0001 `TEXT NOT NULL` **ohne** `DEFAULT`:

```sql
board_rank TEXT NOT NULL,
```

Ich habe das INSERT probeweise ohne die Spalte gegen eine frisch migrierte In-Memory-Datenbank
gefahren (Wegwerfskript, nicht Teil des Bestands):

```
INSERT ohne board_rank schlaegt fehl: NOT NULL constraint failed: todo.board_rank
```

Das heißt: Entferne ich `board_rank` aus dem INSERT in `insertTodo()`, **bevor** Migration 0010 die
Spalte fallen lässt, bricht jeder Test, der diese Hilfsfunktion benutzt — Zeitbuchungen, Timer,
Export, Protokoll — sofort mit einem Datenbankfehler. Das ist kein vorübergehendes Rot zwischen zwei
Aufgaben, sondern ein harter technischer Block: Es gibt keine Reihenfolge von „ich zuerst, er
danach", die dazwischen `pnpm check` grün ließe.

### Befund 2 — `repo-todos.test.ts:84` ist umgekehrt gekoppelt, aber ungefährlich in der falschen Richtung

Diese Zeile (`expect(todo.boardRank).toBe(todo.id)`) bricht **nicht** heute, sondern erst, sobald
`Todo.boardRank` aus `packages/domain/src/todo.ts` entfernt wird — dann schlägt `tsc` mit „Property
'boardRank' does not exist on type 'Todo'" fehl, weil ich `packages/*/src/**` nicht anfassen darf,
um das vorwegzunehmen, und der domain-dev `packages/*/test/**` nicht anfassen darf, um es
nachzuziehen. Das ist die im T-066-Bericht selbst benannte Kopplung.

### Befund 3, zusätzlich gemessen (nicht im Auftrag namentlich genannt, aber ebenso betroffen) —
`mappers.test.ts:79`

Der T-066-Bericht nennt diese Zeile „harmlos, aber irreführend" — gemeint war: harmlos, **solange
niemand sie anfasst**. Ich habe geprüft, ob sich zumindest diese dritte Stelle schon jetzt gefahrlos
bereinigen lässt, weil `SqlRow` nur `Record<string, SqlValue>` ist (kein striktes Interface). Das
Ergebnis: **Nein.** `toTodo()` in `mappers.ts` liest `board_rank` weiterhin über
`text(row, 'board_rank')`, und `text()` wirft `Error("Spalte board_rank ist kein Text.")`, sobald
der Schlüssel fehlt (`typeof undefined !== 'string'`). Entferne ich `board_rank: 'todo-1'` aus dem
Beispielobjekt `base`, schlägt jeder Test fehl, der `toTodo(base, …)` aufruft — heute, nicht erst
nach der Migration. Auch diese Stelle ist also an `mappers.ts` (fremde Hoheit) gekoppelt, nicht nur
kosmetisch.

### Entscheidung

Alle drei Testdatei-Stellen — die zwei im Auftrag genannten und die eine zusätzlich gemessene — sind
**bidirektional** an `packages/storage/src/**`/`packages/domain/src/**` gekoppelt: Ich kann keine
davon vorziehen, ohne `pnpm check` sofort rot zu machen (Befund 1 und 3), und der domain-dev kann
seine Seite nicht vorziehen, ohne meine Seite (mindestens Befund 2) rot zu machen. Genau das hatte
er selbst schon festgestellt: „Es ist eine kleine Änderung an zwei Hoheiten, keine an einer." Ich
habe keine der drei Dateien angefasst — ein „halb entferntes" Feld wäre nach seiner eigenen
Einschätzung „die schlechteste der drei Möglichkeiten" gewesen, und das gilt für die Testseite
genauso wie für die Quellseite.

**Für die künftige gemeinsame Welle liegen die drei Diffs fertig hier:**

`packages/storage/test/support/migrated-database.ts`, Zeile 60–63:

```diff
- db.prepare(
-   `INSERT INTO todo (id, title, call_number, status_id, board_rank, created_at, updated_at)
-    VALUES (?, ?, NULL, ?, ?, ?, ?)`,
- ).run(fields.id, fields.title ?? 'Testtodo', DEFAULT_STATUS_ID, `a${fields.id}`, now, now);
+ db.prepare(
+   `INSERT INTO todo (id, title, call_number, status_id, created_at, updated_at)
+    VALUES (?, ?, NULL, ?, ?, ?)`,
+ ).run(fields.id, fields.title ?? 'Testtodo', DEFAULT_STATUS_ID, now, now);
```

`packages/storage/test/repo-todos.test.ts`, Zeile 84–91 (ganzer `it`-Block entfernen):

```diff
- it('board_rank eines neuen Todos ist seine eigene Kennung', async () => {
-   db = openTestDatabase();
-   const todo = await db.unit.todos.create(
-     { title: 'T', callNumber: null, statusId: null, tagIds: [], note: '', now: NOW },
-     [],
-   );
-   expect(todo.boardRank).toBe(todo.id);
- });
```

`packages/storage/test/mappers.test.ts`, Zeile 79 (Schlüssel aus dem Beispielobjekt `base`
entfernen):

```diff
    status_id: 'status-1',
-   board_rank: 'todo-1',
    completed_at: null,
```

Diese drei Änderungen setzen voraus, dass **im selben Zug** — nicht davor, nicht danach —
Migration 0010 (SQL bereits im T-066-Bericht fertig ausformuliert) sowie die Änderungen an
`packages/storage/src/sqlite/mappers.ts` (`toTodo`, `board_rank`-Zeile entfernen),
`packages/storage/src/sqlite/repo-todos.ts` (`TODO_COLUMNS`, INSERT, das Sortieren beim Update) und
`packages/domain/src/todo.ts` (`Todo.boardRank`, `TodoUpdate.boardRank`) landen. Ich empfehle dem
Orchestrator, das als eine Aufgabe an domain-dev zu geben, die in derselben Sitzung diese drei
Testdatei-Diffs mit übernimmt — entweder über eine ausdrückliche, einmalige Ausnahme von der
Hoheitsgrenze für genau diese drei Zeilenpaare, oder als unmittelbar aufeinanderfolgende Teilschritte
einer einzigen Freigabe, weil kein Zwischenstand `pnpm check` grün hält.

---

## Nachweise

```
pnpm check                                                              Exitcode 0
  Test Files  35 passed (35)   Tests  568 passed (568)   (vorher 34 Dateien, 556 Tests — 12 neu, alle in board.test.ts)
  packages/domain/src/board.ts       10 / 0 / 0 / 11,11        → 100 / 100 / 100 / 100
  packages/domain/src (Aggregat)     85,0 / 83,2 / 93,02 / 85,1 → 89,09 / 86,4 / 95,34 / 89,36
  packages/storage/src/sqlite        90,0 / 80,1 / 94,5 / 93,8  → 90,0 / 80,13 / 94,53 / 93,81 (unverändert, keine Datei dort geändert)
  packages/export/src                97,95 / 92,26 / 100 / 97,82 (unverändert, keine Datei dort geändert)
npx vitest run packages/domain/test/board.test.ts   12/12 grün (isoliert)
Rot-Lauf (Nachweis, danach korrigiert): 1 fehlgeschlagen, 11 bestanden — Fehlermeldung oben zitiert
node --experimental-sqlite -e '…'   INSERT ohne board_rank schlägt mit
  "NOT NULL constraint failed: todo.board_rank" fehl (Wegwerfskript, nicht Teil des Bestands)
```

---

## Annahmen

1. **Kein `git commit`.** Das Arbeitsverzeichnis ist laut Umgebungsangabe kein Git-Repository;
   „keine Testdaten mit echten Call-Nummern, Kundennamen oder Zugangsdaten" ist trotzdem erfüllt —
   alle Bezeichner in `board.test.ts` sind erfundene Platzhalter (`beratung`, `mandant-a`,
   `rueckfrage`, `col-weit` …), keine realen Werte.
2. **`BoardColumnRule.ruleTagIds` ist die bereits aufgelöste Tagmenge.** Wie im Kopfkommentar von
   `board.ts` festgehalten, ist das Auflösen von `folder`-Regelteilen (samt Unterordnern) Aufgabe
   des Ports, nicht dieser Domänenfunktion. Der Test „Spalte über einen Ordner" aus der Tabelle im
   T-066-Bericht ist deshalb hier als bereits aufgelöste Tagmenge nachgebildet, nicht als
   `folder`-Regelteil — eine getreue Nachbildung der Ordnerauflösung selbst würde in
   `packages/storage/test/**` gehören, wo der Baum existiert.
3. **`text()`/`SqlRow`-Verhalten in `packages/storage/src/sqlite/database.ts` als gegeben
   angenommen**, um Befund 3 in Abschnitt 2 zu stützen — dort nur gelesen, nicht verändert.
4. **Für Teil 2 keine Datei angefasst**, auch nicht versuchsweise mit anschließendem
   Zurücksetzen: Anders als bei den Migrationsmutationen in T-032 (dort eigene, in meiner Hoheit
   liegende Dateien) hätte ein versuchsweises Ändern hier fremde Dateien
   (`packages/storage/src/**`) betroffen — das schließt „ausschließlich Testordner" ausdrücklich
   aus, auch für einen Versuch mit Rücksetzung. Stattdessen: ein eigenständiges Wegwerfskript
   außerhalb des Bestands (`node --experimental-sqlite -e '…'`) gegen die echten, unveränderten
   Migrationsdateien, um Befund 1 zu erhärten, ohne eine einzige Zeile in `packages/storage/**`
   zu berühren.

---

## Risiken

1. **`todo.board_rank` bleibt ein weiteres Mal stehen.** Nach T-066 und jetzt T-069 ist die
   Reihenfolge, in der die Entfernung *nicht* geht, jetzt zweimal unabhängig gemessen
   (Domänentyp-seitig im T-066-Bericht, Testdatei-seitig hier). Ohne eine ausdrückliche
   Orchestrator-Entscheidung für eine gemeinsame Welle bleibt das Feld ein drittes Mal liegen —
   und jede weitere Aufgabe, die eine der drei Dateien anfasst, trägt das Risiko unwissentlich
   weiter.
2. **Der Nachweis in Abschnitt 1 hängt an der Fixtur der Tabelle im T-066-Bericht, nicht an einem
   Zufallsgenerator.** Wie schon dort selbst als Grenze benannt: Der Prüflauf hier deckt die
   beschriebenen Fallklassen ab, aber keinen Property-Test über beliebige Spalten-/Kartenzahlen.
   Für die Größe dieser reinen Funktion halte ich das für angemessen — ein Eigenschaftstest wäre
   das nächste, aber unaufgeforderte Werkzeug gewesen.
3. **`packages/domain/src/board.ts` selbst hat jetzt keine ungetestete Verzweigung mehr** (100 %
   auf allen vier Achsen) — das einzige verbleibende Risiko am Zuschnitt der Datei ist die im
   T-066-Bericht selbst benannte lineare Wachstumsrate der Board-Abfrage bei vielen Spalten, ein
   Leistungsrisiko außerhalb dieser Domänenfunktion.

---

## Offene Fragen

1. **An den Orchestrator: eine gemeinsame Welle für `todo.board_rank`.** Migration 0010 (SQL fertig
   im T-066-Bericht), die zugehörigen Änderungen in `packages/storage/src/sqlite/{mappers,
   repo-todos}.ts` und `packages/domain/src/todo.ts`, **und** die drei Diffs aus Abschnitt 2 dieses
   Berichts müssen in einem Zug landen. Ich kann meinen Teil nicht vorziehen (gemessen, Befund 1
   und 3), domain-dev kann seinen nicht vorziehen, ohne meinen Teil zu brauchen (Befund 2, aus
   seinem eigenen Bericht). Vorschlag: entweder eine einmalige, eng begrenzte Ausnahme für
   domain-dev, in derselben Aufgabe genau diese drei Zeilenpaare in `packages/storage/test/**`
   mitzuziehen, oder ein Auftrag an mich, der im selben Arbeitsschritt wie seine Migration läuft.

---

## Nächster Schritt

Die vier (plus zwei) Prüffälle für `boardAppearances` sind geschlossen, `packages/domain/src`
hat wieder deutlichen Puffer über der 80-Prozent-Schwelle auf allen vier Achsen, und
`packages/domain/src/board.ts` steht bei 100 %. `todo.board_rank` bleibt ein drittes Mal offen —
mit jetzt zwei unabhängig gemessenen Gründen, warum eine Aufteilung auf zwei Aufgaben nicht ohne
Umweg geht, und drei fertigen Diffs für den Moment, in dem der Orchestrator eine gemeinsame Welle
ansetzt.
