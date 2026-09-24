# R-1 — Code-Review `status-als-regelterm`

**Umfang.** `git diff 7c71186..HEAD`, vier Commits (`48c982a`, `a2d74ef`, `08162fd`, `3240dcc`),
Quellen in `packages/**` und `apps/**`. Gelesen: `docs/spec.md` A-3.4, `decisions.md` E-054 bis
E-057, die Berichte T-076, T-082, T-086, T-087, T-088.

**Ausgeführt.** `pnpm run typecheck` grün (einschließlich `typecheck:test`). `pnpm run test`
grün, 37 Dateien, 595 Fälle. `pnpm run proof:openapi`, `proof:addin`, `proof:conflicts`,
`proof:callers` grün. Port 17843 war frei; es lief kein zweiter Reviewer dagegen. Zusätzlich habe
ich zwei Behauptungen dieses Berichts an einer frischen SQLite-Datei aus
`packages/storage/migrations` nachgestellt statt sie zu vermuten (Befund 3 und die Gegenprobe zum
`RESTRICT` auf `status_id`).

Schweregrade: `blockierend` (hält die Freigabe auf), `sollte` (vor der nächsten Welle),
`Hinweis`.

---

## Was in Ordnung ist — kurz, weil daraus keine Arbeit folgt

Die eine Wahrheit je Frage ist an den Stellen, an denen der Auftrag sie vermutet hat, wirklich
eine. „Ist diese Regel leer" beantwortet `poolRuleIsEmpty`, „trifft sie nichts"
`poolRuleMatchesNothing`, und beide werden von der Domäne (`matchesPool`, `resolvePool`), von der
Übersetzung nach SQL (`buildConditions`), vom Dienst (`poolWithResolution`) und von der Oberfläche
(`apps/web/src/lib/poolRule.ts`) **aufgerufen** statt nachgebaut; die dritte Fassung, die T-083 in
`apps/web` beseitigt hat, ist tatsächlich weg. Die Parameterreihenfolge in `buildConditions` ist
im Fall `0 = 1` repariert: `poolParams` wandert erst nach `params`, wenn die Bedingungen auch im
Text landen (`repo-todos.ts:139-236`), und Suche wie Blätterung hängen dahinter richtig
(`repo-todos.ts:374-424`). Die Ordnerrekursion `down(root, id, depth)` zählt nicht doppelt
(`tagIds` ist eine Menge, `UNION` statt `UNION ALL`) und ist über `depth < 1000` gegen Zyklen
gedeckelt. Migration 0011 ist symmetrisch, und ihre Rückrichtung benennt ihren Verlust, statt ihn
zu verschweigen. Die Notiz-Trennung hält: `TODO_COLUMNS` nennt `todo_note` nicht, `AddinTodoMatch`
trägt keinen Vermerk, und die neuen Board- und Pool-Antworten tragen nur `Todo`.

---

## Blockierende Befunde

```
apps/desktop/release/x86_64-unknown-linux-gnu/Takt_0.1.0_amd64.AppImage:1   blockierend
```
138,7 MB AppImage und 47,5 MB `.deb` liegen seit `48c982a` in der Historie — in einem Commit über
Regelstrukturen. `.git` ist dadurch 181 MB groß. Das widerspricht der `.gitignore`, die derselbe
Branch in `3240dcc` anlegt und die wörtlich begründet, warum gebündelte Binärdateien nicht in die
Historie gehören; `3240dcc` hat die erzeugte Lizenzbeilage herausgenommen und diese beiden Dateien
stehen lassen. **Fix:** `git rm --cached apps/desktop/release/…` und `release/` in
`apps/desktop/.gitignore` aufnehmen — und den Branch vor dem Zusammenführen umschreiben
(`git rebase`/`filter-repo`), denn nach einem Merge in den Hauptzweig sind die 186 MB dauerhaft
drin. `SHA256SUMS` und `.release-config.json` können bleiben.

```
apps/local-api/src/routes/addin/service.ts:303   blockierend
```
`poolNamer` ruft `unit.pools.list()` ohne Argument. `PoolPort.list` setzt dann `surface = 'pool'`
und liefert `WHERE placement IN ('pool','both')` (`repo-tags.ts:601-611`). Eine reine
Kanban-Spalte (`placement: 'board'`) ist für das Add-in damit unsichtbar — und `board` ist die
Vorgabe, wenn eine Spalte über das Board angelegt wird
(`apps/web/src/screens/BoardScreen.tsx:355`). E-056 ist genau für diesen Fall geschrieben: die
Spalte „erledigt und noch nicht abgerechnet" als Abrechnungsliste. Bucht der Benutzer per Add-in
darauf, bleibt `leavingPoolNames` leer, `bookingPoolSentence` liefert `null`, und die Karte
verschwindet wortlos aus genau der Liste, in der er sie sucht. Das ist der Schaden, den E-056
benennt, und E-056 ist damit für seinen eigenen Anlassfall nicht umgesetzt. Der Prüfpfad kann es
nicht sehen: `apps/outlook-addin/scripts/fixtures.mjs:398` schreibt `list: async () => pools` und
ignoriert das Argument, und alle Regeln in den Fixtures tragen `placement: 'pool'`. **Fix:** in
`poolNamer` `unit.pools.list('all')`; die Formulierung in `duplicate/reopen.ts` (`inPools`:
„dem Pool" / „den Pools") muss dann eine Spalte auch Spalte nennen können; die Attrappe muss das
Argument auswerten, sonst bleibt die Lücke ungemessen.

```
packages/storage/src/sqlite/repo-tags.ts:442   blockierend
```
`TagFolderPort.remove` prüft nur, ob der Ordner leer ist. Er prüft **nicht**, ob er in einer Regel
steht, und `pool_rule.folder_id` steht auf `ON DELETE CASCADE`
(`packages/storage/migrations/0011_pool_rule_axes.up.sql:128`). Nachgestellt an einer frischen
Datenbank: Die Regel „Ordner Ost **und** Status offen" verliert beim Löschen von Ost still ihren
erforderlichen Term und heißt danach „Status offen" — sie trifft **mehr**, als der Benutzer gesagt
hat. Das ist wörtlich die Richtung, die E-057 als die gefährliche bezeichnet, und sie ist durch die
Hintertür wieder offen: Löschbar ist nur ein **leerer** Ordner, und der leere Ordner in einer
erforderlichen Achse ist genau der Fall, um den dieser Branch gebaut ist. Die Oberfläche schickt
den Benutzer sogar dorthin — der Leerzustand bietet „Tag anlegen" in `TagsScreen` an, und ein
Schritt weiter steht dort „Ordner löschen". Zwei Funktionen darüber, bei
`TagPort.remove` (`repo-tags.ts:188-216`), steht dieselbe Überlegung ausgeschrieben und die
Prüfung ist da. **Fix:** die Unterabfrage in `remove` um
`(SELECT COUNT(*) FROM pool_rule WHERE folder_id = ?)` erweitern und einen fachlichen Fehler
zurückgeben (`tag_in_use` gibt es bereits als Schlüssel, Text: „Dieser Ordner wird in der Regel
eines Pools verwendet.").

```
apps/local-api/src/routes/addin/service.ts:841   blockierend
```
Scheitert `unit.todos.clearDone`, gibt `bookOnTodo` `{ kind: 'rejected' }` **zurück**.
`createTransactionPort.run` nimmt nur bei einem Wurf zurück und macht bei einer normalen Rückgabe
`COMMIT` (`packages/storage/src/sqlite/unit-of-work.ts:190-193`; der Kopf dort sagt es
ausdrücklich: „Ein fachlicher Fehlschlag ist kein Wurf … er rollt also nicht von selbst zurück").
Die zwei Zeilen darüber ist die Buchung bereits geschrieben. Ergebnis: Die Zeitbuchung ist
festgeschrieben, das Todo gilt weiter als erledigt, und der Aufgabenbereich meldet „abgewiesen" —
der Benutzer bucht erneut, und dieselbe Zeit geht zweimal in die Abrechnung. Der Kommentar der
Funktion behauptet das Gegenteil (`service.ts:793`: „Scheitert das Aufheben, scheitert die
**ganze** Buchung (`rejected`, die Transaktion rollt zurück)"). Der Befund ist Bestand aus
`7c71186`, aber dieser Branch hat die Funktion umgebaut und den Satz stehen gelassen. **Fix:**
denselben Weg wie bei `createTodo` gehen — eine eigene Abbruchklasse werfen (Vorbild
`AbortTodoCreate` in `usecases/tag-names.ts`), sie außerhalb von `inTransaction` fangen und dort in
`rejected` übersetzen. Der Zweig für `!created.ok` darf bleiben, wie er ist: dort ist noch nichts
geschrieben.

---

## Befunde, die vor die nächste Welle gehören

```
packages/storage/src/ports.ts:419   sollte
packages/storage/src/ports.ts:429   sollte
```
`resolveRule` und `resolveExcluded` haben nach T-086 keinen Aufrufer in `src` mehr — nur noch
`packages/storage/test/repo-tags.test.ts` und die Attrappe in `fixtures.mjs`. Die Begründung an
`:419` nennt als Grund für ihr Bestehenbleiben genau den Aufrufer, der sie nicht mehr benutzt
(„An dieser Signatur hängt ein Aufrufer in fremder Hoheit (`routes/addin/service.ts`)"); der
Ausschnitt dort heißt seit T-086 `Pick<PoolPort, 'list' | 'resolveAxes'>`
(`apps/local-api/src/routes/addin/ports.ts:146`). Tote Portfläche mit einer Begründung, die nicht
mehr stimmt, ist schlechter als tote Portfläche allein: Beim nächsten Mal glaubt ihr jemand.
**Fix:** beide aus `PoolPort`, aus `repo-tags.ts:775/785` und aus der Attrappe entfernen; der Test
zieht auf `resolveAxes` um. Wer sie behalten will, ersetzt die Begründung durch die zutreffende.

```
packages/domain/src/board.ts:86   sollte
apps/local-api/src/routes/addin/service.ts:306   sollte
```
Die Typwache gegen die sechste Achse deckt vier der sechs Stellen. Rot würden:
`POOL_RULE_AXIS_CONDITIONS` (`-?`-Abbildung), die beiden Literale an `poolRuleMatchesNothing` in
`matchesPool` und in `buildConditions`, `resolvePool`, `toPool` (weil `Pool extends PoolRuleAxes`)
und in `apps/web` jede Stelle, die eine `RuleAxes` zusammensetzt. **Nicht** rot würden die beiden
übrigen Aufrufer von `matchesPool`: `BoardColumnRule` zählt die Achsen als eigene, **freiwillige**
Felder auf, und `poolNamer` gibt seiner aufgelösten Liste gar keinen Typ — sie ist aus einem
Objektliteral abgeleitet. Beide würden die neue Achse still überspringen; das ist die Falle aus
T-078, eine Achse später. Der Kommentar in `tag.ts:538` behauptet, jede dieser Stellen werde rot.
**Fix:** `BoardColumnRule` als `MatchesPoolRule & { columnId: PoolId; includeCompleted?: boolean }`
schreiben und in `boardAppearances` `...column` spreizen; in `service.ts` die Elemente von
`resolved` als `MatchesPoolRule & { name: string }` tippen und in `holds` ebenso spreizen. Dann
trägt der Übersetzer die Wache, die der Kommentar verspricht.

```
apps/local-api/src/routes/structure.ts:307   sollte
```
`POST /pools` zählt jedes Feld einzeln auf, und in `PoolInput`
(`apps/local-api/src/usecases/structure.ts:279-292`) sind alle vier neuen Achsen freiwillig. Eine
Achse, die ins Schema und in `PoolInput` kommt, aber hier vergessen wird, verschwindet still —
nichts wird rot. Der Kommentar darüber sagt das selbst und verweist auf `proof:openapi`
Abschnitt 12 als einzige Wache; das ist ein Laufzeitnachweis für etwas, das der Übersetzer könnte.
`PATCH` daneben (`:331`) reicht `parsed.data` als Ganzes durch und kann nichts vergessen. **Fix:**
im `POST` denselben Weg gehen (ein Wert statt zehn Zeilen), oder die Achsen in `PoolInput`
verpflichtend machen und die Neutralwerte im Schema setzen — dort stehen sie ohnehin schon
(`.default([])`, `.default('any')`).

```
apps/web/src/lib/labels.ts:198   sollte
apps/web/src/lib/labels.ts:215   sollte
```
`PoolCompletionFilter` und `PoolExportFilter` stehen hier ein zweites Mal, obwohl `apps/web`
`@takt/domain` als Abhängigkeit führt und `lib/poolRule.ts:1` bereits daraus importiert. Die
Richtung, die weh tut, ist die wahrscheinliche: Bekommt die Domäne einen vierten Wert, bleibt die
Fassung in `apps/web` **enger**, `RuleAxes extends PoolRuleAxes` bleibt zuweisbar, nichts wird rot
— und `COMPLETION_TEXT`/`EXPORT_TEXT` (beide `Record<Exclude<…>>` über den Web-Typ) liefern
stillschweigend `undefined`, wo der Typ `string` verspricht. Das ist dieselbe Doppelung, die E-049
für die Exportquellen ausdrücklich als Ausnahme begründet hat — hier gibt es die Begründung nicht,
weil die Paketgrenze schon offen ist. **Fix:**
`import type { PoolCompletionFilter, PoolExportFilter } from "@takt/domain"` und re-exportieren;
in `labels.ts` bleiben nur die Beschriftungstabellen. `PoolMatchMode` (`:172`) desgleichen, sobald
die Domäne den Modus als eigenen Typ führt.

```
apps/local-api/src/routes/structure.ts:314   sollte
```
`as never` an `rule`, `excludedTags` und `statusIds`. `never` ist an alles zuweisbar — die
Zusicherung schaltet nicht die Markierung ab, sondern jede Prüfung. Ändert sich die Gestalt von
`poolTagListSchema`, merkt es niemand. **Fix:** `as readonly PoolTagTerm[]` beziehungsweise
`as readonly StatusId[]`, oder eine kleine Markierungsfunktion, die genau das tut und nichts
sonst. Dasselbe gilt für `parsed.data as never` in `:331`.

```
apps/local-api/openapi/takt-local-api.yaml:1255   sollte
```
Die Beschreibung zu `DELETE /todo-statuses/{statusId}` nennt weiterhin drei Gründe und erklärt
`status_in_use` als „Todos tragen diesen Status noch". Seit T-076 gibt es einen vierten Grund, und
er hat denselben Schlüssel: Der Status steht in der Regel eines Pools oder einer Spalte
(`packages/storage/src/sqlite/repo-statuses.ts:272-300`). `packages/storage/src/ports.ts:494` ist
nachgezogen, die Schnittstellenbeschreibung nicht. Die Prüfung selbst ist richtig gebaut — ich habe
nachgestellt, dass das `RESTRICT` auf `pool_rule.status_id` greift und dass der Dienst mit
`status_in_use` (409) davor abweist statt mit `storage_error`; ein durchgerutschter
Fremdschlüsselfehler landete über `errors.ts:357` als `validation_error` (422) und nicht als 500.
Nur die Beschreibung fehlt. **Fix:** eine Zeile in der Tabelle.

---

## Hinweise

```
apps/web/package.json:6   Hinweis
```
Die Beschreibung sagt „`@takt/domain` steckt hier ausschliesslich wegen `tagNameKey`". Seit T-083
kommen `countPoolRuleConditions`, `poolRuleIsEmpty` und `PoolRuleAxes` dazu, und das ist der
wichtigere Grund. **Fix:** Satz ergänzen — er ist die einzige Stelle, an der jemand nachliest,
warum die Abhängigkeit besteht.

```
packages/storage/src/sqlite/repo-tags.ts:912   Hinweis
```
`WHERE down.depth < 1000` begrenzt den Abstieg. A-4.3 sagt „beliebig tief"; jenseits der Schranke
liefert die Auflösung stillschweigend zu wenige Tags, und über E-057 würde daraus „dieser Ordner
ist leer" — eine falsche Auskunft statt einer Fehlermeldung. Praktisch unerreichbar, aber die
Grenze steht nirgends geschrieben. **Fix:** eine benannte Konstante mit Kommentar, und im
Erreichensfall lieber abbrechen als kürzen.

---

## Urteil

**Nacharbeit.**

Die Freigabe blockieren vier Befunde, in dieser Reihenfolge:

1. `packages/storage/src/sqlite/repo-tags.ts:442` — das Löschen eines leeren Ordners entkernt eine
   Regel still und lässt sie **mehr** treffen. Das ist die Richtung, gegen die E-057 geschrieben
   wurde, und der Branch macht sie durch den Leerzustand erst gut sichtbar erreichbar.
2. `apps/local-api/src/routes/addin/service.ts:841` — eine festgeschriebene Buchung bei gemeldetem
   Fehlschlag. Doppelte Abrechnung ist der teuerste Fehler dieses Bestands.
3. `apps/local-api/src/routes/addin/service.ts:303` — E-056 wirkt für reine Kanban-Spalten nicht,
   also für genau den Fall, den E-056 entschieden hat.
4. `apps/desktop/release/…` — 186 MB Bauerzeugnis in der Historie. Vor dem Zusammenführen
   behebbar, danach nicht mehr.

Befund 2 ist Bestand aus `7c71186`; ich führe ihn trotzdem als blockierend, weil dieser Branch die
Funktion umgebaut hat und ihre Dokumentation weiterhin das Gegenteil behauptet. Sollte der
Orchestrator ihn als eigene Aufgabe außerhalb dieses Branches führen wollen, bleiben 1, 3 und 4
als Blockierer.

Alles unter „sollte" ist Nacharbeit für die nächste Welle und hält die Freigabe nicht auf, sobald
die vier oben behoben sind — mit einer Einschränkung: Der Fix zu Befund 3 ist erst dann geprüft,
wenn `apps/outlook-addin/scripts/fixtures.mjs:398` das Flächenargument auswertet. Solange die
Attrappe es ignoriert, misst `proof:addin` an dieser Stelle nichts.
