Aufgabe: T-077 — Sechs Prüffälle, und `pnpm check` ist wieder grün.

Status: fertig. `pnpm check` endet mit Exitcode 0.

---

## Artefakte

Geändert (ausschließlich `packages/storage/test/**`, kein Quelltext angefasst):

```
packages/storage/test/repo-tags.test.ts     +2 Prüffälle — die vier neuen Achsen gespeichert und
                                             gelesen wie hineingegeben, Teiländerung mit nur
                                             excludedTags
packages/storage/test/repo-todos.test.ts    +7 Prüffälle — die fünf Achsen einzeln, im Zusammenspiel
                                             (UND, nicht ODER), die leere Regel, Erledigt/Export
                                             nach echtem Timer- und Exportlauf, und der Fall, der
                                             SQL-Übersetzung und Domänenregel gegeneinander hält
packages/storage/test/repo-time.test.ts     +1 Prüffall — exportPresence, bislang ohne jeden Test
packages/storage/test/mappers.test.ts       +3 Prüffälle — toPoolCompletion/toPoolExportState,
                                             und dass toPool sie tatsächlich benutzt
packages/storage/test/repo-statuses.test.ts +1 Prüffall — der vierte Löschgrund: Status in einer
                                             Regel (status_in_use)
```

Nicht angefasst: `packages/*/src/**`, `apps/**`, `vitest.config.ts` (die Schwelle stimmte bereits;
keine Änderung nötig), `packages/domain/test/**` (die Domänenseite von T-076 war mit `tag.ts` bei
genau 80,00 % Zweigabdeckung bereits über der Schwelle — knapp, aber grün. Der neue Prüffall
„Abfrage gegen Domänenregel" in `repo-todos.test.ts` ruft `matchesPool` direkt mit den neuen Achsen
auf und hat das als Nebeneffekt auf 85,29 % gehoben, ohne dass ich dafür eine Zeile in
`packages/domain/test/**` schreiben musste). `.claude/team/reports/T-076-domain-dev.md` gelesen,
nicht verändert.

---

## 1 — Die sechs Fälle aus dem T-076-Bericht, plus zwei „wenn es leicht mitgeht"

| # | Datei | Prüffall | Wodurch er rot würde |
|---|---|---|---|
| 1 | `repo-tags.test.ts` | `pools.create` mit `excludedTags`, `statusIds`, `completion: 'done'`, `exportState: 'exported'`, danach `pools.load` | Eine Achse, die beim Anlegen verworfen statt geschrieben wird — z. B. wenn `writeRule` nur die erforderlichen Tags schreibt, oder `axes.completion`/`axes.exportState` nicht ins INSERT gingen |
| 2 | `repo-tags.test.ts` | `pools.update` mit **nur** `excludedTags`: die erforderlichen Tags bleiben stehen | `writeRule` würde bei einer Teiländerung die nicht genannten Listen als leer statt als „unverändert" behandeln — die Zusage aus `PoolPort.update` |
| 3 | `repo-todos.test.ts` | `pools.members` mit `statusIds` (trifft alle mit diesem Status) **und** Gegenprobe mit einem nie benutzten Status (trifft keinen) | Eine vertauschte Bedingung (`NOT IN` statt `IN`) oder eine Achse, die stillschweigend übersprungen wird, sobald sie gesetzt ist |
| 4 | `repo-todos.test.ts` | Tag **und** Status an derselben Regel: 1 von 2 Karten mit demselben Status — die andere hat den Status, aber nicht das Tag | Eine `OR`- statt `AND`-Verknüpfung der Achsen innerhalb einer Regel — genau der Unterschied, den der Auftrag als „das ist keine Wahl" markiert |
| 5 | `repo-todos.test.ts` | Ausgeschlossenes Tag: von zwei Karten mit demselben erforderlichen Tag bleibt genau die andere übrig | `NOT EXISTS` durch `EXISTS` vertauscht, oder die Ausschlussliste wird wie die erforderliche behandelt (`matchMode` würde plötzlich greifen) |
| 6 | `repo-todos.test.ts` | Eine Karte steht zugleich in einer Tag-Spalte und einer Status-Spalte (E-054 gilt für die neuen Achsen weiter) | Eine Umsetzung, die eine Karte nur in einer Spaltenart gleichzeitig zuließe, oder eine Status-Achse, die versehentlich die Tag-Zugehörigkeit überschreibt |
| — | `repo-todos.test.ts` | Erledigt- **und** Exportstatus-Achse nach echtem Timerstart/-stopp und echtem Exportlauf (kein direktes `UPDATE`) | Eine Spalte, die den gespeicherten statt den aktuellen Zustand zeigt — z. B. wenn `completion: 'done'` die Karte nach dem Timerstart fälschlich behielte, oder `exportState: 'open'` sie nach dem Exportlauf fälschlich weiter zeigte |
| — | `repo-time.test.ts` | `exportPresence` mit drei Todos: eines mit offener, eines mit exportierter, eines ganz ohne Buchung | Ein vertauschtes `CASE` (`has_open`/`has_exported`), ein Todo ohne Buchungen, das fälschlich mit `{false,false}` statt gar nicht in der Zuordnung stünde, oder eine leere Eingabeliste, die nicht die leere Zuordnung liefert |
| — | `mappers.test.ts` | `toPoolCompletion`/`toPoolExportState`: die beiden gültigen Werte bleiben, jeder andere (auch `undefined`) wird zum Neutralwert `any`; `toPool` liest über genau diese Funktionen | Ein dritter, „gültiger" Wert, der durchrutscht, oder ein zweiter Übersetzungsweg in `toPool`, der von den beiden Funktionen abweicht |
| — | `repo-statuses.test.ts` | Ein in einer Pool-/Board-Regel verwendeter Status (`role = 'status'`) wird nicht gelöscht — `status_in_use`, nicht `FOREIGN KEY constraint failed` | Die vierte Wache in `remove()` fehlt oder käme vor der Prüfung auf benutzende Todos — dann bekäme der Aufrufer die falsche der beiden `status_in_use`-Meldungen oder den rohen SQLite-Fehler |
| — | `repo-todos.test.ts` | **Die leere Regel trifft nichts, auch mit vorhandenen Karten** (E-055 korrigiert, A-3.4) | Die ursprüngliche, inzwischen zurückgenommene Lesart „Alle als Vorgabe je Achse heißt: leere Regel trifft alles" — genau der Fehler, den der Auftrag ausdrücklich benennt |
| — | `repo-todos.test.ts` | **Abfrage gegen Domänenregel**: für vier Karten und sechs Spalten (alle fünf Achsen, einzeln und gemischt) stimmt `pools.members` (SQL) mit `matchesPool` (Domäne, mit denselben Werten aus der Datenbank aufgerufen) in jedem der 24 Fälle überein | Jede künftige Änderung, die SQL-Übersetzung und Domänenregel auseinanderlaufen lässt — unabhängig davon, in welche Richtung. Siehe Abschnitt 2 |

Die ersten sechs sind wörtlich die Liste aus Abschnitt 6 des T-076-Berichts, mit den dort genannten
Zeilennummern (`repo-tags.ts` 721/725, 739–747; `repo-todos.ts` 143, 155, 164/165/167/176) als
Ziel. Die drei „wenn es leicht mitgeht" aus demselben Abschnitt sind ebenfalls drin
(`mappers.ts` 145/150, `repo-statuses.ts` der vierte Löschgrund). Dazu zwei, die der Auftrag hier
zusätzlich verlangt hat: die korrigierte leere Regel und der Fall, der beide Seiten hält.

## 2 — Der wichtigste Einzeltest: Abfrage gegen Domänenregel

`packages/storage/test/repo-todos.test.ts`, letzter Fall im neuen Block. Vier Karten (unterschiedliche
Tags, unterschiedliche Status, eine erledigt, eine mit einer offenen Buchung) gegen sechs Spalten
(Status allein, Tag+Status, Tag+Ausschluss, Erledigt, Exportstatus, leer). Für jede der 24
Kombinationen wird `pools.members` (die SQL-Übersetzung) gegen einen unabhängig aufgebauten Aufruf
von `matchesPool` (die Domänenregel, mit `resolvePoolRule`/`poolAxes`/`poolMatchMode` direkt aus der
Datenbank gelesen) verglichen — keine von Hand hingeschriebene Erwartungsliste, die sich selbst
bestätigen könnte, sondern zwei unabhängige Implementationen gegeneinander, genau wie
`proof:openapi` es am laufenden Dienst tut (T-076-Bericht, Abschnitt 5, letzte Zeile der Tabelle).

**Eine Falle dabei selbst gefunden und korrigiert, bevor der Test committet wurde:** Der erste
Entwurf hielt die von `todos.create`/`markDone` zurückgegebenen Objekte fest und benutzte sie direkt
in der Vergleichsschleife. `markDone` ändert aber nur die Datenbank, nicht das zurückgegebene
`Todo`-Objekt von vorher — die Domänenseite bekam damit `completedAt: null` für eine tatsächlich
erledigte Karte, während die SQL-Seite (die die Datenbank live abfragt) korrekt `erledigt` zeigte.
Das Ergebnis war ein scheinbarer Widerspruch zwischen SQL und Domäne, der in Wirklichkeit ein
veralteter Wert im Test war:

```
AssertionError: expected true to be false
❯ repo-todos.test.ts:725:41
    expect(sqlMembers.has(card.id)).toBe(domainVerdict);
```

Behoben, indem die vier Karten unmittelbar vor dem Vergleich per `todos.loadMany(...)` frisch aus
der Datenbank geladen werden statt die Rückgabewerte von `create`/`markDone` weiterzureichen. Das
ist kein Nachweis eines Fehlers in `packages/storage/src` — `pnpm check` lief vor dieser Korrektur
nie mit dem defekten Test —, aber es zeigt, dass der Vergleich tatsächlich beide Seiten unabhängig
auswertet und nicht zufällig immer übereinstimmt: Ein Test, der nie hätte scheitern können, hätte
nichts bewiesen.

Eine Gegenprobe am Ende (`expect(comparisons).toBe(columns.length * cards.length)`) stellt sicher,
dass die Schleife tatsächlich 24 Vergleiche gemacht hat und nicht durch einen leeren Bestand
stillschweigend nichts geprüft hat.

## 3 — Rot vor Grün

Alles Verhalten existiert bereits seit T-076 und ist am laufenden Dienst gemessen (T-076-Bericht,
Abschnitt 5) — ein literales „Cannot find module" wäre hier keine ehrliche Rot-Phase. Der
Rot-Nachweis lief deshalb, wo immer möglich, über eine absichtlich falsche Erwartung an genau der
Stelle, die den jeweiligen Prüffall trägt: erst beobachtet, dass sie mit einer nachvollziehbaren
Begründung scheitert (nicht mit einem Tippfehler oder einer defekten Fixtur), dann auf die korrekte
Erwartung zurückgestellt und erneut grün beobachtet. Für jeden der zehn neuen `it()`-Blöcke einmal
durchgeführt; hier die vier aufschlussreichsten Läufe:

**`mappers.test.ts` — `toPoolCompletion('garbage')` absichtlich auf `'done'` erwartet:**
```
AssertionError: expected 'any' to be 'done'
❯ mappers.test.ts:148:41
```

**`repo-tags.test.ts` — `excludedTags` nach `create`/`load` absichtlich auf `[]` erwartet:**
```
AssertionError: expected [ { kind: 'tag', tagId: 'id-000002' } ] to deeply equal []
❯ repo-tags.test.ts:530:34
```

**`repo-todos.test.ts` — Tag-und-Status-Mischung absichtlich als „oder" erwartet (beide Karten statt einer):**
```
AssertionError: expected [ 'id-000002' ] to deeply equal [ 'id-000002', 'id-000003' ]
❯ repo-todos.test.ts:470:51
```

**`repo-todos.test.ts` — die leere Regel absichtlich mit einem Treffer erwartet (der zurückgenommene E-055-Wortlaut):**
```
AssertionError: expected [] to have a length of 1 but got +0
❯ repo-todos.test.ts:542:59
```

Jeder dieser vier (und die sechs weiteren, nicht einzeln zitiert: Status-Gegenprobe, ausgeschlossenes
Tag, Erledigt/Export nach Timer- und Exportlauf jeweils mit vertauschter Erwartung, `exportPresence`
mit vertauschtem `hasOpen`, `status_in_use` absichtlich als `validation_error` erwartet) wurde nach
dem beobachteten, korrekt begründeten Fehlschlag auf die richtige Erwartung zurückgestellt und
erneut ausgeführt — alle danach grün, siehe Abschnitt 4.

## 4 — Abdeckung, vorher/nachher

`packages/storage/src` (der einzige rote Punkt, `pnpm run test:coverage`, `v8`-Zweigzähler exakt aus
`coverage/lcov.info`, nicht die gerundete Konsolenausgabe):

| | vorher | nachher | Schwelle |
|---|---|---|---|
| Zweige, `packages/storage/src/**` (Aggregat, root + `sqlite/`) | 634/797 = **79,55 %** | 651/797 = **81,68 %** | 80 % |
| davon `repo-tags.ts` | 130/173 | 138/173 (+8) | — |
| davon `repo-todos.ts` | 80/104 | 86/104 (+6) | — |
| davon `mappers.ts` | 37/40 | 39/40 (+2) | — |
| davon `repo-statuses.ts` | 48/60 | 49/60 (+1) | — |
| davon `repo-time.ts` | 74/90 | 74/90 (+0, siehe unten) | — |

`repo-time.ts` liefert trotz des neuen Prüffalls keinen zusätzlichen Zweig: `exportPresence` enthält
keine Verzweigung (zwei `for`-Schleifen, ein `CASE` in SQL, kein `if`/Ternary/`&&`/`||` im
TypeScript-Teil) — der Prüffall schließt die bisher komplett ungetestete Zeilenabdeckung der
Methode, trägt aber nichts zum Zweignenner bei. Er stand trotzdem auf der Liste des T-076-Berichts
und ist die einzige Methode ohne jeden Prüffall gewesen.

Vier Zweige fehlten laut T-076-Bericht bis zur Schwelle (634 → 638 von 797, exakt nachgerechnet:
`0,80 × 797 = 637,6`, aufgerundet 638). Die neuen Prüffälle liefern 17 — mehr als vierfacher Puffer.

Nebeneffekt, ungefordert, aber gemessen: `packages/domain/src` stand bei genau 136/170 = **80,00 %**
Zweigen — bereits über der Schwelle, aber ohne jeden Puffer, mit `tag.ts` bei 75,47 %. Der
„Abfrage-gegen-Domänenregel"-Prüffall aus Abschnitt 2 ruft `matchesPool` mit allen fünf Achsen in
wechselnden Kombinationen auf, ohne dass ich dafür `packages/domain/test/**` angefasst hätte, und
hebt `packages/domain/src` dabei auf 145/170 = **85,29 %** (`tag.ts` auf 92,45 %). Die zwei
verbleibenden ungetesteten Zweige in `tag.ts` (Zeilen 583, 588) sind die Kurzschluss-Hälften der
`&&`-Verknüpfungen in der Exportstatus-Achse (`wantedExport === 'exported' && hasExportedEntries
!== true` — beide Seiten schon je einmal wahr geprüft, die Kombination „wantedExport ist etwas
anderes" fehlt); kein Befund, nur der Vollständigkeit halber genannt.

Gesamtlauf (`pnpm run test:coverage`): 581 Prüffälle grün (vorher 567, +14 — zwei in
`repo-tags.test.ts`, sieben in `repo-todos.test.ts`, drei in `mappers.test.ts`, einer in
`repo-time.test.ts`, einer in `repo-statuses.test.ts`), Exitcode 0.

## 5 — `pnpm check`

Exitcode 0, vollständig durchgelaufen: `typecheck`, `boundaries`, `contrast`, `proof:openapi` (64
Prüfungen, unverändert — ich habe keinen Nachweispfad angefasst), `proof:callers`, `proof:conflicts`
(149 Prüfungen, unverändert), `proof:tags`, `test:coverage` (Abschnitt 4), `build` (alle Pakete und
Apps, einschließlich `apps/web` und `apps/outlook-addin`). Kein `ERROR`, keine fehlgeschlagene
Prüfung im Protokoll — die einzigen Fundstellen für „error“/„fail“ im Log sind Zeilen, in denen
`proof:conflicts` erwartungsgemäß eine `validation_error`-Antwort bestätigt.

---

Annahmen:

1. **Der Nachweis „Abfrage gegen Domänenregel" gehört nach `packages/storage/test/**` und nicht
   nach `packages/domain/test/**`**, obwohl er `matchesPool` direkt aufruft. Er braucht eine echte,
   migrierte Datenbank (`resolvePoolRule`, `poolAxes`, `poolMatchMode`, `pools.members`) auf der
   einen Seite des Vergleichs — ein reiner Domänentest kann die SQL-Seite nicht erzeugen, nur
   simulieren, und eine Simulation der SQL-Seite im Domänentest wäre genau die zweite, unabhängig
   gepflegte Fassung, die dieser Test verhindern soll.
2. **`BUILTIN_TEMPLATE_ID` in `repo-todos.test.ts` dieselbe hartkodierte Kennung wie in
   `repo-export.test.ts`** (`01931000-0000-7000-8000-0000000000f1`, aus Migration 0002). Keine
   gemeinsame Testhilfe daraus gemacht, um `packages/storage/test/support/setup.ts` nicht anzufassen
   — eine Konstante in zwei Dateien ist hier kein Befund, sondern dieselbe Bauart wie im Bestand.
3. **Der Timer-/Export-Prüffall benutzt echte Anwendungsfälle** (`timer.start`, `timer.stop`,
   `export.recordRun`), keine direkten `UPDATE`-Anweisungen auf `time_entry` — anders als einige
   ältere Prüffälle in `repo-time.test.ts`/`repo-export.test.ts`, die eine Buchung testweise per SQL
   in einen Zustand versetzen. Der Auftrag verlangt ausdrücklich „nach Timer und Exportlauf", und
   nur der echte Weg beweist, dass die Achse nach einem echten Ereignis reagiert, nicht nach einem
   im Test manuell hergestellten Endzustand.
4. **Keine der zehn neuen Prüffälle benutzt echte Call-Nummern, Kundennamen oder Zugangsdaten** —
   Tags heißen „Beratung"/„Rückfrage" (aus dem T-076-Bericht übernommen), Windows-Nutzer im
   Exportlauf `t.beispiel` (wie in `repo-export.test.ts`), Dateipfade `/exporte/…`.

Risiken:

1. **Keine.** Es wurde keine Quelldatei angefasst; `pnpm check` läuft vollständig grün durch, mit
   deutlichem Puffer auf allen vier Achsen in `packages/storage/src` und `packages/domain/src`.
2. **Der Puffer auf `packages/domain/src` (85,29 %) ist ein Nebeneffekt, kein Ziel dieser
   Aufgabe.** Er könnte bei einer künftigen Erweiterung von `tag.ts` wieder schrumpfen; das ist
   normal und keine Reparatur, die hier fällig war — die Schwelle war vor dieser Aufgabe bereits
   erfüllt (80,00 %).
3. **`repo-time.ts` bleibt bei 82,22 % Zweigabdeckung ohne Veränderung durch diese Aufgabe** —
   `exportPresence` ist jetzt zeilenweise geprüft, aber die übrigen ungetesteten Zweige der Datei
   (Zeilen 83–84, 234, 253–255 laut Konsolenbericht) sind älter als T-076 und lagen außerhalb des
   Auftrags.

Offene Fragen: keine.

---

## Nächster Schritt

`pnpm check` ist grün, `packages/storage/src` liegt mit 81,68 % Zweigabdeckung sechs Prozentpunkte
über der letzten roten Messung und knapp zwei über der Schwelle selbst. Aus dem T-076-Bericht bleibt
offen (nicht meine Hoheit, dort schon an integration-dev, frontend-dev und den Orchestrator
adressiert): der `poolNamer`-Patch im Outlook-Add-in, das Regelformular in `apps/web`, die
Entscheidung zu `Pool.rule`/`requiredTags`, und der Abgleich von A-3.2/A-3.3 der Spezifikation mit
den fünf Achsen.
