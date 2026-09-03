Aufgabe: T-076 — Der Status wird ein dritter Regelterm. Nach der Zwischenmeldung des
Orchestrators: Die Regel wird eine **Struktur mit benannten Feldern** nach dem Vorbild von Super
Productivity.

Status: teilweise — und **eine Rückfrage zu E-055**, die ich nicht selbst entscheiden wollte
(Offene Frage 1: „die leere Regel trifft jetzt alles"). Alles andere ist gebaut und gemessen.

**Zustand des Baums in einem Satz:** Modell, Migration, Speicherung, Abfrage, Routen und
Schnittstellenbeschreibung stehen; **alle dreizehn Nachweispfade sind grün** (`proof:openapi` von
53 auf 64 Prüfungen, `proof:conflicts` von 142 auf 149), die Migration läuft vorwärts, rückwärts
**mit Daten** und wieder vorwärts, `pnpm build` ist grün und alle 567 bestehenden Prüffälle
laufen unverändert durch. **`pnpm check` endet mit Exitcode 1** an genau einer Stelle: Die
Zweigabdeckung von `packages/storage/src` liegt bei **79,54 %** statt 80 % — vier Zweige. Die
neuen Zweige sind die fünf Achsen der Regel in SQL, und die Prüffälle dafür liegen unter
`packages/storage/test/**`, also in fremder Hoheit. Abschnitt 6 nennt die sechs Fälle, die die
Lücke schließen.

---

Artefakte:

Neu:

```
packages/storage/migrations/0011_pool_rule_axes.up.sql     NEU (181) — zwei ALTER TABLE auf
                                                    `pool`, Umbau von `pool_rule` nach dem
                                                    zwölfschrittigen Verfahren, vier Indizes
packages/storage/migrations/0011_pool_rule_axes.down.sql   NEU (70) — Rückbau auf die Form
                                                    von 0001, mit benanntem Verlust
```

Geändert:

```
packages/domain/src/tag.ts             `PoolTagTerm` (neu benannt), `PoolRuleTerm` bleibt als
                                       **derselbe** Typ unter dem alten Namen;
                                       `PoolCompletionFilter`, `PoolExportFilter`;
                                       `Pool` bekommt `excludedTags`, `statusIds`,
                                       `completion`, `exportState`; `matchesPool` bekommt
                                       fünf Achsen (219 → 330 Zeilen mit Begründung)
packages/domain/src/board.ts           `BoardColumnRule` und `BoardCard` tragen die neuen
                                       Achsen; `boardAppearances` trennt Zugehörigkeit
                                       (`matchesPool`) von Sichtbarkeit (`isVisibleInPool`)
packages/storage/src/ports.ts          `PoolPort.create` nimmt die vier Achsen freiwillig
                                       entgegen; `PoolPort.resolveExcluded` neu;
                                       `TimeEntryPort.exportPresence` neu; Kopfkommentar
                                       über `todo_status` richtiggestellt
packages/storage/src/sqlite/mappers.ts `toPoolCompletion`/`toPoolExportState` (exportiert),
                                       `toPool` nimmt die übrigen Achsen entgegen
packages/storage/src/sqlite/repo-tags.ts   `partsOf` liest alle drei Rollen in einer Abfrage;
                                       `writeRule` schreibt sie gemeinsam; `resolvePoolRule`
                                       bekommt ein `role`-Argument; `poolAxes` neu
packages/storage/src/sqlite/repo-todos.ts  `ResolvedPool` als Typ; `buildConditions`
                                       übersetzt fünf Achsen statt einer
packages/storage/src/sqlite/repo-time.ts   `exportPresence` — eine Abfrage für alle Todos
packages/storage/src/sqlite/repo-statuses.ts  vierter Grund gegen das Löschen: der Status
                                       steht in einer Regel (`status_in_use`)
packages/storage/src/sqlite/unit-of-work.ts   `resolvePools` löst alle fünf Achsen auf
packages/storage/src/sqlite/migrations.embedded.ts  erzeugt (22 Dateien)
apps/local-api/src/usecases/board.ts   Spaltenregeln mit allen Achsen; Ausblendung erledigter
                                       Karten je Spalte; Buchungskennzeichen nur, wenn eine
                                       Spalte danach fragt
apps/local-api/src/usecases/structure.ts   `PoolInput` mit den vier Achsen; `listPoolMembers`
                                       lässt die Regel der Ansichtseinstellung vorgehen
apps/local-api/src/routes/structure.ts `poolTagListSchema`, `poolStatusListSchema`,
                                       `completionSchema`, `exportStateSchema`; **die vier
                                       neuen Felder werden im `POST` weitergereicht** (siehe
                                       Abschnitt 4, Befund 1)
apps/local-api/openapi/takt-local-api.yaml  `PoolCompletionFilter`, `PoolExportFilter`, `Pool`
                                       mit fünf Achsen, `PoolCreate`/`PoolUpdate` erweitert
apps/local-api/scripts/service-scenario.mjs  sieben weitere Spalten, ein **zweiter**
                                       Board-Durchgang nach Timer und Exportlauf
apps/local-api/scripts/proof-openapi.mjs   Abschnitt 12 neu (11 Prüfungen); Abweichungen
                                       nennen jetzt Spaltennamen statt Kennungen
apps/local-api/scripts/proof-conflicts.mjs Abschnitt 6 neu (7 Prüfungen)
apps/local-api/scripts/proof-callers.mjs   die vier Felder als benannte Übergabe an
                                       frontend-dev eingetragen
docs/datenmodell.md                    3.5 neu geschrieben, 4.4 und 4.4a erweitert, 8.4f neu,
                                       sechs Zeilen in 8.5, Objektzählung auf Stand 0011
docs/architektur.md                    Zeile in der Regeltabelle
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `packages/export/**`, `tests/e2e/**`,
`packages/*/test/**`, `apps/local-api/src/routes/addin/**` und die Add-in-Abschnitte der
Schnittstellenbeschreibung (E-053).

---

Zusammenfassung:

Der Auftrag war zunächst ein dritter Termtyp neben `tag` und `folder`; die Zwischenmeldung mit
dem Vorbild aus Super Productivity hat das Modell ausgetauscht, und zwar zu Recht — eine Liste
gleichartiger Terme kann drei Dinge nicht: „nicht" ausdrücken, Größen aufnehmen, die keine
Tagmenge sind, und je Bedingung einen Neutralwert tragen. Seit T-076 hat **jede Bedingung ihr
eigenes Feld**: erforderliche Tags (mit `matchMode`), ausgeschlossene Tags, Status, Erledigt,
Exportstatus. Die Felder sind mit „und" verbunden, jedes engt weiter ein, und stehen alle neutral,
trifft die Regel nichts. Migration 0011 baut `pool_rule` um (Rolle und Statuskennung, erschöpfender
CHECK) und hängt zwei Spalten an `pool`; **jede bestehende Regel trifft danach genau dieselben
Todos wie davor**, weil die einzige Frage, die eine solche Umstellung raten müsste, seit 0001 in
`pool.match_mode` je Regel einzeln beantwortet dasteht. Gemessen wird das Ergebnis nicht behauptet,
sondern gegen den echten Dienst gefahren: eine Spalte nur über den Status, eine über einen
unbenutzten Status als Gegenprobe, eine gemischte, eine mit ausgeschlossenem Tag, eine über
Erledigt und zwei über den Exportstatus — dazu die Karte, die dadurch zugleich in einer Tag- und
in einer Statusspalte steht.

---

## 1. Was ich vorgefunden habe — die Frage, die die Migration nicht raten muss

Der Orchestrator hat ausdrücklich verlangt nachzusehen, statt zu raten: „Eine heutige Tagliste
wird zu ‚erforderliche Tags‘ — oder zu ‚mindestens eines davon‘, je nachdem, wie sie heute wirkt."

E-055 setzt in seiner Tabelle „Erforderliche Tags | alle müssen vorhanden sein" — und verlangt im
selben Text, nachzusehen statt zu raten. Beides zugleich geht nur auf **einem** Weg, und der
steht unten.

**Befund: Die Frage stellt sich nicht, weil die Antwort seit Migration 0001 in den Daten steht.**
`pool.match_mode` hält sie je Regel einzeln, und ihr Vorgabewert ist an allen vier Stellen
derselbe:

| Ort | Vorgabe |
|---|---|
| `0001_initial.up.sql` | `match_mode TEXT NOT NULL DEFAULT 'any'` |
| `poolCreateSchema` (Route) | `.default('any')` |
| `PoolCreate` (Beschreibung) | `default: any` |
| `apps/web/src/screens/PoolFormDialog.tsx` | `useState<"any" \| "all">("any")` |

Und `apps/web/src/screens/BoardScreen.tsx:572` schreibt es dem Benutzer wörtlich hin:
`pool.matchMode === "any" ? "Mindestens eines von" : "Alle von"`.

Eine heutige Tagliste bedeutet also **„mindestens eines davon"**, außer wo jemand ausdrücklich
`all` gewählt hat. Die Migration überführt deshalb jede vorhandene Zeile nach `role = 'required'`
und **fasst `match_mode` nicht an**. Hätte ich der Vorlage blind folgend „erforderliche Tags = alle"
gesetzt, hätte jede bestehende Regel mit mehr als einem Tag schlagartig weniger oder nichts mehr
getroffen.

Zweiter Befund dazu: **Migration 0002 legt keine Pools an.** Es gibt keinen mitgelieferten
Regelbestand, der umgedeutet werden könnte; alles, was da ist, hat ein Mensch eingerichtet.

`matchMode` bleibt deshalb, wo es ist, und gilt ausdrücklich **nur** für die erforderlichen Tags.
Die ausgeschlossenen sind immer „keines davon", die Status immer „einer von diesen".

**Das ist die einzige Stelle, an der ich von E-055 abweiche, und die Abweichung folgt aus E-055
selbst.** Die Tabelle dort sagt „alle müssen vorhanden sein"; hätte ich das ohne `matchMode`
umgesetzt, träfe jede bestehende Regel mit mehr als einem Tag nach der Migration weniger oder gar
nichts — und genau das schließt der Schlussabsatz von E-055 aus. `matchMode` **ist** die
Beschriftung, nach der E-055 verlangt; sie steht nur an der Liste statt in ihrem Namen:
„Erforderliche Tags: alle davon" gegen „Erforderliche Tags: mindestens eines davon". Ein Benutzer
liest damit weiterhin keine Aussagenlogik, und die Vorgabe für **neue** Regeln lässt sich in der
Oberfläche jederzeit auf „alle" stellen, ohne dass ein Bestand umgedeutet wird. Wenn der
Auftraggeber `any` ganz abschaffen will, ist das eine eigene Entscheidung mit einem
Datenübergang — siehe Offene Frage 1.

## 2. Die Verknüpfung — und warum sie keine Entscheidung mehr ist

Die ursprüngliche Aufgabe nannte die Verknüpfung „die eigentliche Entscheidung". Mit der
Feldstruktur ist sie keine mehr, und das ist der Gewinn des Vorbilds:

| Achse | Speicherung | Verknüpfung | Neutralwert |
|---|---|---|---|
| erforderliche Tags | `pool_rule`, `role='required'` | `match_mode`: alle / mindestens eines | leere Liste |
| ausgeschlossene Tags | `pool_rule`, `role='excluded'` | keines davon | leere Liste |
| Status | `pool_rule`, `role='status'` | einer von diesen | leere Liste = „Alle" |
| Erledigt | `pool.completion` | `any` / `done` / `open` | `any` |
| Exportstatus | `pool.export_state` | `any` / `open` / `exported` | `any` |

**Zwischen** den Achsen gilt „und". Das ist keine Wahl, die man auch anders treffen könnte: Ein
„oder" zwischen erforderlichen und ausgeschlossenen Tags wäre sinnlos, und eine zusätzlich
genannte Bedingung, die das Ergebnis **vergrößert**, wäre in jeder Ansicht eine Überraschung.

**Innerhalb** der Statusachse ist „einer von diesen" keine Entscheidung, sondern eine Tatsache:
`todo.status_id` trägt genau einen Wert. Ein „alle davon" über zwei Status wäre nicht streng,
sondern **unerfüllbar** — eine Spalte, die garantiert leer bleibt, ohne dass jemand sähe, warum.

**Bestehende Regeln ändern ihre Bedeutung nicht.** Wer nur Tags nennt, bekommt Zeichen für Zeichen
die Auswertung von vor T-076: Jede Achse auf ihrem Neutralwert wird übersprungen. Die leere Regel
trifft weiterhin nichts (A-3.4) — nicht „alle null Bedingungen sind erfüllt".

**Und E-054 bleibt.** Ein Statusfeld macht die Spalte nicht wieder zum Status. Eine Spalte kann
mehrere Status umfassen, keinen, oder Status und Tags mischen; dieselbe Karte steht weiterhin in
mehreren Spalten, und zwei zutreffende Bedingungen derselben Spalte ergeben weiterhin **eine**
Nennung — `matchesPool` antwortet mit ja oder nein und nicht mit einer Anzahl. Beides ist gemessen
(`proof:openapi` Abschnitt 11 unverändert grün).

## 3. Die zwei Achsen, die nicht aus dem Vorbild kommen

**Erledigt** gibt es im Vorbild („Aufgabenstatus erledigt: Alle / Erledigt / Unerledigt"), aber bei
Takt kollidiert es mit einer bestehenden Einstellung: `includeCompleted` (E-039) blendet erledigte
Karten in Pool-Ansichten aus. Zwei Regeln über dasselbe Kennzeichen, eine in der Regel, eine in
der Ansicht.

Aufgelöst so: **Zugehörigkeit und Sichtbarkeit sind zwei Fragen, in dieser Reihenfolge.** Sagt die
Regel nichts (`any`), entscheidet die Ansicht wie bisher. Sagt sie etwas, hat sie das letzte Wort
— sonst wäre eine Spalte „Erledigt" unter der Vorgabe `includeCompleted=false` **dauerhaft leer**,
und die zweite Bedingung hat der Benutzer nie für diese Spalte gesetzt.

**Exportstatus** gibt es im Vorbild nicht; der Orchestrator hat ihn ergänzt („was habe ich noch
nicht abgerechnet"). Er gehört der **Buchung**, nicht dem Todo (E-032), also fragt die Achse nach
dem Vorhandensein: `open` = mindestens eine abgeschlossene, offene Buchung; `exported` =
mindestens eine exportierte. Ein Todo mit beidem steht in beiden Spalten — die andere denkbare
Lesart („vollständig abgerechnet") wäre nicht die Umkehrung von `open`, sondern deren Verneinung,
und ein Todo mit einer offenen und einer exportierten Buchung fiele durch beide Raster.

## 4. Zwei Befunde, die der eigene Nachweis gefunden hat

**Befund 1 — die Route streifte die neuen Felder still ab.** `pools.post('/')` zählt die Felder
einzeln auf und reichte die vier neuen nicht weiter. Zod nahm sie an, die Antwort sah aus wie
Erfolg, die angelegte Spalte war eine andere als bestellt. **Genau die Falle aus T-051 (Farbe) und
T-050 (`nurOffene`)**, und sie ist nur aufgefallen, weil Abschnitt 12 nicht misst, ob die Felder
beschrieben sind, sondern ob die Spalte danach anders trifft. Behoben; die vier Felder stehen
jetzt in der Aufzählung, mit einem Kommentar über der Stelle.

**Befund 2 — Abfrage und Domänenregel liefen auseinander, sobald eine erledigte Karte ladbar
wurde.** Solange keine Spalte erledigte Karten zeigen konnte, kam eine erledigte Karte gar nicht
in die Antwort: `onlyOpen` hielt sie aus **jeder** Spalte heraus, und `boardAppearances` bekam sie
nie zu sehen. Mit einer Spalte `completion: 'done'` wird sie geladen — und die Domänenregel
behauptete daraufhin, dieselbe Karte stehe auch in allen übrigen Spalten, dort, wo die Abfrage sie
soeben ausgeblendet hatte.

Der erste Versuch, die Ansichtseinstellung als **Erledigt-Achse** in die Regel zu schieben, hat
sofort einen zweiten Fehler erzeugt und ihn ebenfalls gemessen: Eine Spalte **ohne** Regel bekam
dadurch die Bedingung „alle unerledigten" und zeigte **alles statt nichts** — A-3.4 gebrochen.

Endgültig gelöst über die Trennung aus Abschnitt 3: `boardAppearances` prüft erst `matchesPool`
(Zugehörigkeit) und danach `isVisibleInPool` (Sichtbarkeit), mit derselben Ausblendung, unter der
die Abfrage gelaufen ist. `BoardColumnRule.includeCompleted` trägt sie und ist ausdrücklich
**keine** Achse der Regel.

## 5. Gemessen

`proof:openapi` Abschnitt 12, elf Prüfungen gegen den echten Dienst und die echte Datenbank. Der
Bestand ist so gewählt, dass keine Antwort zufällig richtig sein kann — Karte A trägt `Beratung`
und `Rückfrage`, Karte B nur `Beratung`, beide denselben Status:

| Spalte | Regel | Erwartet | Ergebnis |
|---|---|---|---|
| nur über den Status | `statusIds: [S1]` | A und B | 2 Karten |
| über einen unbenutzten Status | `statusIds: [S2]` | leer | leer |
| über Tag **und** Status | `rule: [Rückfrage]`, `statusIds: [S1]` | nur A, weniger als die Tagspalte | 1 von 2 |
| mit ausgeschlossenem Tag | `rule: [Beratung]`, `excludedTags: [Rückfrage]` | nur B | 1, und nicht A |
| **eine Karte in Tag- und Statusspalte** | — | mindestens eine | 2 |
| nur über Erledigt | `completion: 'done'` | die erledigte Karte, trotz `includeCompleted=false` | 1 |
| mit offener Buchung | `exportState: 'open'` | genau die Todos aus der Buchungsliste | deckungsgleich |
| mit exportierter Buchung | `exportState: 'exported'` | dito | deckungsgleich |
| Erledigt schlägt Sichtbarkeit | — | die erledigte Karte hat eine offene Buchung und steht trotzdem nur in der Erledigt-Spalte | bestätigt |
| Abfrage gegen Domänenregel, alle fünf Achsen | — | dieselben Spalten | deckungsgleich |

Die Erwartung für die beiden Exportspalten wird **nicht angenommen**, sondern aus einem zweiten,
unabhängigen Weg gelesen: der Liste der Buchungen (`GET /time-entries`). Laufen die beiden
auseinander, zeigt das Board eine Spalte „noch nicht abgerechnet", die etwas anderes meint als die
Buchungsliste.

`proof:conflicts` Abschnitt 6, sieben Prüfungen: Eine Spalte mit Statusterm lässt sich anlegen;
das Löschen dieses Status wird mit **409 `status_in_use`** abgewiesen und nicht mit 500; die
Meldung nennt die Regel und nicht den Fremdschlüssel; und nachdem der Statusterm herausgenommen
ist, geht es wieder — ohne diese Gegenprobe wäre die Sperre eine Sackgasse.

Migration, außerhalb der Nachweispfade gefahren (SQLite aus Node 22.23.2):

| Fall | Ergebnis |
|---|---|
| 0 → 11 auf leerer Datei | 17 Tabellen, 34 Indizes, 17 Trigger, 1 Sicht |
| sechs Wachen | Tag und Status in einer Zeile → CHECK; Rolle `status` ohne Kennung → CHECK; unbekannte Rolle → CHECK; derselbe Term zweimal → `ux_pool_rule`; `completion='vielleicht'` → CHECK; `export_state='vielleicht'` → CHECK |
| RESTRICT auf dem Status | Löschen eines Status aus einer Regel → `FOREIGN KEY constraint failed` |
| dasselbe Tag erforderlich **und** ausgeschlossen | zulässig — unsinnig, aber Benutzereingabe, und sie trifft nichts |
| 11 → 10 **mit Daten** (zwei Regeln, eine gemischt) | erforderliche Terme unverändert, ausgeschlossene und Statusterme weg, beide Spalten weg, `pool_rule` wortgleich wie 0001 |
| 10 → 11 wieder | die überlebende Zeile trägt `role='required'`, `pragma_foreign_key_check` leer |

Dreizehn Nachweispfade, alle grün: openapi 64, access 75, export 97, export-api 69, taskpane 25,
addin-wiring 32, route-policy 40, template-fields 30, db-permissions 17, callers 18, tags 42,
conflicts 149, sidecar 20. `pnpm build` grün. 567 Prüffälle grün.

## 6. Warum `pnpm check` trotzdem rot ist — und was es schließt

Ein einziger Punkt: **Zweigabdeckung `packages/storage/src` 79,54 % gegen die Schwelle 80 %.**
Vier Zweige. `packages/domain/src` liegt wieder darüber.

Die fehlenden Zweige sind die neue Übersetzung der fünf Achsen in SQL. Prüffälle dafür gehören
nach `packages/storage/test/**` — **unit-tester**, ausdrücklich außerhalb meiner Hoheit und in der
Aufgabenstellung unter „Nicht anfassen" genannt. Ich habe stattdessen den Weg genommen, der mir
offensteht: Das Verhalten ist über die echten Routen und die echte Datenbank gemessen (Abschnitt
5), es zählt nur nicht in die v8-Abdeckung, weil die Nachweispfade in eigenen Prozessen laufen.

Was ich in meiner Hoheit getan habe, um die Lücke zu verkleinern, ohne die Zahl zu jagen: vier
echte Vereinfachungen — `poolAxes` benutzt jetzt **dieselben** Mapper wie `toPool` statt einer
zweiten Fassung der Normalisierung; `writeRule` hat eine Schleife statt zweier; `ResolvedPool`
führt Pflichtfelder statt `?? []` an jeder Lesestelle; `matchesPool` prüft den unbekannten Status
nicht mehr eigens, weil er ohnehin in keiner Statusliste steht. Das hat die Domäne über die
Schwelle gebracht und die Speicherung von 78,9 % auf 79,54 %.

**Die sechs Prüffälle, die die restlichen vier Zweige schließen** (jeder ein bis fünf Zeilen,
Zeilennummern aus dem aktuellen Stand):

1. `repo-tags.test.ts` — `pools.create` mit `excludedTags`, `statusIds`, `completion`,
   `exportState` und `pools.load` darauf: die Achsen kommen zurück, wie sie hineingingen.
   (`repo-tags.ts` 721, 725)
2. `repo-tags.test.ts` — `pools.update` mit **nur** `excludedTags`: die erforderlichen Tags
   bleiben stehen. Das ist die Zusage aus `PoolPort.update` und der einzige Fall, in dem die
   Vollständigkeit des Regelschreibens auffällt. (`repo-tags.ts` 739–747)
3. `repo-todos.test.ts` — `pools.members` auf einer Regel mit ausgeschlossenem Tag: Das Todo mit
   dem Tag fehlt, das ohne es ist da. (`repo-todos.ts` 143)
4. `repo-todos.test.ts` — `pools.members` auf einer Regel mit `statusIds` und auf einer mit
   `statusIds` **und** Tag: die zweite trifft weniger als die erste. (`repo-todos.ts` 155)
5. `repo-todos.test.ts` — je eine Regel mit `completion: 'done'`/`'open'` und mit
   `exportState: 'open'`/`'exported'`. (`repo-todos.ts` 164, 165, 167, 176)
6. `repo-time.test.ts` — `timeEntries.exportPresence` mit drei Todos: eines mit offener, eines mit
   exportierter, eines ohne Buchung. Die Methode hat bisher **keinen** Prüffall.

Dazu, wenn es leicht mitgeht: `mappers.test.ts` für `toPoolCompletion`/`toPoolExportState` mit
`'done'`/`'open'`/`'exported'` und einem unbekannten Wert (`mappers.ts` 145, 150), und
`repo-statuses.test.ts` für den vierten Löschgrund (Status in einer Regel → `status_in_use`).

---

Annahmen:

1. **`Pool.rule` behält seinen Namen** und bedeutet jetzt „erforderliche Tags". Ein Umbenennen auf
   `requiredTags` hätte `apps/web` (zwei Dateien), `packages/storage/test/repo-tags.test.ts` und
   die Beschreibung in einem Zug anfassen müssen — drei fremde Hoheiten. Die Bedeutung steht am
   Feld, und `excludedTags` daneben macht sie unübersehbar. Der Umbau gehört in eine Aufgabe, die
   alle Aufrufer zugleich anfasst; ich habe ihn unter „Offene Fragen" gemeldet.
2. **`PoolRuleTerm` bleibt als derselbe Typ** unter dem alten Namen (`type PoolRuleTerm =
   PoolTagTerm`). Dieselbe Bauart wie `checkTagName`/`checkName` in T-074 und aus demselben
   Grund: fremde Aufrufer, kein zweiter Wert.
3. **Kein ausgeschlossener Status.** Er wäre eine vierte Rolle für eine Bedingung, die sich ohne
   sie ausdrücken lässt — wer „alles außer Erledigt" meint, wählt die übrigen Status. Bei Tags
   geht das nicht, dort sind es Tausende; genau deshalb gibt es die Ausschlussliste für Tags und
   nicht für Status. Der CHECK des Schemas erzwingt es.
4. **`exportState: 'exported'` heißt „hat mindestens eine exportierte Buchung"**, nicht
   „vollständig abgerechnet". Begründung in Abschnitt 3.
5. **`pool_rule.status_id` auf ON DELETE RESTRICT**, anders als `tag_id` (CASCADE). Eine Regel,
   der ihr letzter Statusterm stillschweigend entzogen wird, träfe danach mehr Todos als vorher —
   oder gar keine. Der fachliche Satz kommt aus `TodoStatusPort.remove`, bevor die Datenbank ihren
   sagen muss.
6. **Die Erwartungen im Nachweis kommen aus dem Bestand, nicht aus einer Zahl.** Die beiden
   Exportspalten werden gegen `GET /time-entries` gehalten, die erledigten Karten gegen die
   Erledigt-Spalte. Ein Prüfpfad, der seine eigene Erwartung hinschreibt, misst sich selbst.

Risiken:

1. **Das Add-in benennt die Pools eines Todos falsch, sobald eine Regel eine der neuen Achsen
   benutzt.** `poolNamer` in `apps/local-api/src/routes/addin/service.ts` ruft `matchesPool` mit
   **nur** Tags auf (`resolveRule` liefert die erforderlichen). Für eine Regel mit ausgeschlossenem
   Tag, Status, Erledigt oder Exportstatus behauptet das Add-in dann Zugehörigkeit, die nicht
   besteht — es nennt zu viele Pools, nie zu wenige. **Kein Datenschaden**, aber eine falsche
   Auskunft. Die Datei gehört integration-dev; der Patch steht unter „Offene Fragen" als Frage 1,
   ausformuliert. Bis dahin gilt: Für jede Regel, die es heute gibt, ist die Antwort unverändert
   richtig — die neuen Achsen kann bisher niemand über die Oberfläche setzen.
2. **`pnpm check` ist rot** (Abschnitt 6). Kein fachliches Risiko, aber der Baum ist nicht
   abnahmefertig, bis unit-tester die sechs Fälle hat.
3. **Der Rückweg von 0011 verliert Bedingungen.** Ausgeschlossene Tags, Statusterme und die beiden
   Spalten haben in der Form von 0001 kein Feld. Eine Regel, die nur daraus bestand, ist danach
   leer und trifft nichts — sichtbar leer, nicht heimlich alles. Die Sicherungskopie des Läufers
   ist wie immer der eigentliche Rückweg.
4. **Das Regelformular in `apps/web` kennt die vier neuen Felder nicht.** Bis es sie kennt, lassen
   sich die Achsen nur über die Route setzen. `proof:callers` trägt sie als benannte Übergabe;
   wer die vier Zeilen dort entfernt, ohne dass das Formular sendet, bekommt den Befund zurück.
5. **Sicherheit:** keine neue Fläche. Kein Wert aus einer Anfrage berührt SQL-Text — die neuen
   Achsen gehen wie alle anderen als Parameter, die Listen sind auf 200 Einträge begrenzt, und
   der `IN (…)`-Baum entsteht ausschließlich aus Fragezeichen. Der neue Port `exportPresence`
   liest Kennungen und zwei Wahrheitswerte, keine Notizen; die Notiz-Trennung (A-7.2, R-06) ist
   unberührt, `TODO_COLUMNS` unverändert.

Offene Fragen:

1. **An den Auftraggeber und den Orchestrator: E-055 sagt, die leere Regel trifft jetzt
   *alles*. Ich habe das nicht umgesetzt.**

   Wörtlich in E-055: „Mit ‚Alle' als Vorgabewert jeder Zeile ist die leere Regel der Normalfall
   und trifft alles, statt nichts zu treffen."

   Ich habe es bei „trifft nichts" belassen, aus vier Gründen, und melde es zurück, statt zu
   raten:

   - **Meine Aufgabenstellung sagt das Gegenteil**, ausdrücklich: „Denk daran, was E-054 über die
     leere Regel sagt: Sie trifft nichts." E-055 ist danach entstanden.
   - **Es widerspricht E-055 selbst.** Der Schlussabsatz verlangt, dass ein Pool nach der
     Migration dasselbe trifft wie vorher. Eine Regel ohne Bedingungen — es gibt sie, sie ist der
     Zustand direkt nach dem Anlegen (S-05) — spränge von „kein Todo" auf „jedes Todo".
   - **A-3.4, T-009 und E-054 hängen daran**, ebenso `proof:openapi` Abschnitt 11 („eine Spalte
     ohne Regel zeigt nichts — nicht alles") und der Satz in `PoolCreate` der Beschreibung.
   - **Die Richtung des Fehlers ist die schlechtere.** Eine halbfertige Regel, die nichts zeigt,
     ist offensichtlich halbfertig. Eine, die alles zeigt, sieht aus, als hätte jemand sie so
     gewollt — und auf einem Board mit zwölf Spalten steht dann jede Karte in jeder leeren.

   Die Änderung wäre klein und gut gekapselt: eine Bedingung in `matchesPool`
   (`packages/domain/src/tag.ts`), ein `0 = 1` → `1 = 1` in `buildConditions`
   (`packages/storage/src/sqlite/repo-todos.ts`), dazu drei Prüfungen und drei Sätze in der
   Beschreibung. Ich mache sie auf ein Wort hin. Sie ist aber eine **Produktentscheidung** und
   kein Versehen meinerseits, und sie ändert das Verhalten bestehender Regeln — deshalb steht sie
   hier und nicht im Quelltext.

   Am Rande, falls das die Antwort erleichtert: Im Vorbild ist der Fall harmloser, weil dort eine
   Spalte **immer** einen Titel und einen Zweck hat, den ein Mensch gerade eintippt. Bei Takt ist
   dieselbe Entität zugleich ein Pool, und Pools werden angelegt, bevor die Regel steht.

2. **An integration-dev (über den Orchestrator): drei Zeilen in
   `apps/local-api/src/routes/addin/service.ts`.** `poolNamer` muss die übrigen Achsen
   mitgeben, sonst nennt das Add-in Pools, in denen das Todo nicht ist (Risiko 1). Die Ports
   liefern alles Nötige bereits; `AddinUnit.pools` müsste in `routes/addin/ports.ts` um
   `resolveExcluded` erweitert werden (`Pick<PoolPort, 'list' | 'resolveRule' | 'resolveExcluded'>`).
   Im Filter dann:

   ```ts
   matchesPool({
     todoTagIds,
     ruleTagIds: pool.ruleTagIds,
     matchMode: pool.matchMode,
     excludedTagIds: pool.excludedTagIds,   // await unit.pools.resolveExcluded(pool.id)
     ruleStatusIds: pool.statusIds,         // steht am geladenen Pool
     todoStatusId: todo.statusId,           // steht bereits in AddinTodoMatch
     completedAt: todo.completedAt,         // ebenso
     completion: pool.completion,
     exportState: pool.exportState,
   })
   ```

   Die Exportstatus-Achse braucht zusätzlich `hasOpenEntries`/`hasExportedEntries`; die stehen im
   Add-in schon als `openSeconds > 0` beziehungsweise `exportedSeconds > 0` zur Verfügung.
   Ich habe `PoolPort.resolveRule` ausdrücklich **nicht** in der Rückgabe geändert, damit die
   Datei ohne Zutun weiter übersetzt.

3. **An unit-tester: die sechs Prüffälle aus Abschnitt 6.** Sie schließen die einzige rote Stelle
   von `pnpm check`.

4. **An den Orchestrator: soll `Pool.rule` in `requiredTags` umbenannt werden?** Der Name ist seit
   T-076 eine halbe Wahrheit. Das Umbenennen ist mechanisch, aber es fasst `apps/web` (zwei
   Dateien), `packages/storage/test/repo-tags.test.ts`, die Beschreibung und die Prüfpfade in
   **einem** Zug an — also drei Hoheiten und damit eine eigene Aufgabe, keine Welle mit anderen.

5. **An den Auftraggeber: „Sortieren nach" aus dem Vorbild ist bewusst ausgelassen** (der
   Orchestrator hat es so entschieden: Anzeige, keine Regel). Falls es doch gewünscht ist, gehört
   es an `pool` und nicht in `pool_rule` — dieselbe Bauart wie `completion`.

6. **An spec-ux-reviewer: A-3.2 und A-3.3 der Spezifikation beschreiben eine Regel über Tags.**
   Sie sind nicht falsch geworden, aber unvollständig: Sie kennen weder Ausschluss noch Status,
   Erledigt oder Exportstatus. Ich habe die Spezifikation nicht angefasst (fremde Hoheit); der
   Abgleich gehört in eine Prüfung.

Nächster Schritt:

Eine Welle mit drei unabhängigen Aufgaben, die sich nicht ins Gehege kommen:

1. **unit-tester** — die sechs Prüffälle aus Abschnitt 6. Danach ist `pnpm check` grün. Das ist
   die einzige Aufgabe auf dem kritischen Pfad.
2. **integration-dev** — der Patch aus Frage 1 in `routes/addin/service.ts` und `ports.ts`.
3. **frontend-dev** — das Regelformular: zwei Taglisten statt einer, eine Mehrfachauswahl über die
   Status, zwei Optionsgruppen mit „Alle" als Vorgabe. Die Route nimmt alles bereits an, und die
   Beschreibung sagt für jedes Feld, was der Neutralwert ist. Der Auftraggeber hat für die
   Anordnung ein Vorbild geliefert; es steht in der Zwischenmeldung des Orchestrators.

Erst danach e2e-tester: Ein End-zu-Ende-Fall über die Oberfläche hat vor dem Formular nichts zu
klicken.
