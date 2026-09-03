Aufgabe: T-078 — Das Add-in benennt Pools falsch, sobald eine Regel die neuen Achsen benutzt

Status: fertig — einschließlich **E-056**, das der Orchestrator während der Arbeit entschieden hat.

**Zustand des Baums in einem Satz:** `poolNamer` gibt `matchesPool` jetzt alle fünf Achsen mit und
rechnet seit E-056 **beide Richtungen** — wo das Todo nach der Buchung steht und woraus es dabei
verschwindet; `proof:addin` steht bei **112 Prüfungen** (100 → 109 mit T-078, → 112 mit E-056) mit
einem neuen Abschnitt 12, der gegen die echten Routen misst, `pnpm typecheck` und `pnpm build` sind
grün, und `pnpm check` endete beim letzten vollständigen Lauf mit **Exitcode 0** (581 Prüffälle,
Zweigabdeckung `packages/storage` 83,78 % — unit-tester hat die Lücke aus T-076 parallel
geschlossen). **Fünf Nachweispfade konnte ich zuletzt nicht fahren**, weil ein fremder Dienst den
gemeinsamen Port 17843 hält; Einzelheiten in Abschnitt 6.

---

Artefakte:

Neu: keine Datei.

Geändert unter `apps/local-api/src/routes/addin/`:

```
service.ts   `PoolCandidate` (dateiintern), `AddinPoolMovement` und `bookingStates`
             neu; `poolNamer` nimmt statt einer Tagliste ein **Zustandspaar**
             entgegen, löst je Pool **beide** Taglisten auf und liefert
             `{ appears, leaves }`; die zwei Aufrufstellen in `findMatches` und
             `bookOnTodo` reichen das Paar durch. `bookOnTodo` liest beide
             Buchungssummen **vor** `timeEntries.create` — nachher wäre die offene
             Summe der Zustand danach. `AddinTodoMatch` und `AddinBookResult`
             tragen `leavingPoolNames`. 509 → 715 Zeilen, davon rund zehn Zeilen
             Logik und der Rest Begründung.
ports.ts     `AddinUnit.pools` ist `Pick<PoolPort, 'list' | 'resolveRule' |
             'resolveExcluded'>`; der Kopfkommentar begründet den dritten Zug und
             sagt ausdrücklich, warum `exportPresence` **nicht** dazukommt.
index.ts     `leavingPoolNames` in der Antwort der Buchungsroute — eine Zeile, und
             genau die, die T-076 Befund 1 als Falle benannt hat: Die Antwort zählt
             ihre Felder einzeln auf, ein neues Feld am Ergebnis kommt hier nicht
             von selbst an. Der Kommentar darüber sagt das.
```

Geändert unter `apps/outlook-addin/`:

```
scripts/fixtures.mjs      `POOLS` heißt `DEFAULT_POOLS` und ist exportiert; die vier
                          Achsen aus T-076 stehen dort auf ihrem **Neutralwert** statt
                          zu fehlen. `createFakeStore({ pools })` neu; `resolveTerms`
                          löst beide Taglisten mit **derselben** Funktion auf;
                          `pools.resolveExcluded` neu. `AXIS_POOL`, `AXIS_TODO`,
                          `AXIS_POOLS` (sieben Regeln) und `buildAxisTodos` (zwei
                          Todos) neu — alles erfunden, im selben Duktus wie der
                          Bestand von T-038.
scripts/proof-addin.mjs   Abschnitt 12 neu, zwölf Prüfungen gegen die echten Routen
                          (100 → 109 mit T-078, → 112 mit E-056). `matchesPool` als
                          Import — nur für die Gegenproben, siehe Punkt 3 und 5.
                          Die sechs Aufrufstellen von `reopenPreview`,
                          `reopenOutcome` und `poolSentence` übergeben jetzt das
                          Paar statt einer Liste.
src/duplicate/reopen.ts   `PoolMovement` neu; `poolSentence` schreibt **vier** Fälle
                          aus statt Bausteine zu verketten; `reopenPreview` und
                          `reopenOutcome` nehmen das Paar. Die Zahl der Wirkungen
                          bleibt drei.
src/duplicate/rule.ts     `OfferDescription.leavingPoolNames`, aus dem Treffer
                          übernommen.
src/api/types.ts          `leavingPoolNames` an `TodoMatchDto` und an
                          `BookResponseDto`; Kommentar an `poolNames`: fünf Achsen,
                          und der Zeitpunkt ist der nach der Buchung.
src/ui/TaskPane.tsx       Der gemerkte Zustand führt die **Bewegung** statt einer
                          Poolliste; beide Anzeigestellen geben sie weiter.
```

Geändert unter `apps/local-api/openapi/` (nur die Add-in-Abschnitte, E-053):

```
takt-local-api.yaml   `AddinTodoMatch.poolNames` und `poolNames` in der Antwort von
                      `POST /addin/todos/{todoId}/time-entries`: beide Beschreibungen
                      sagen jetzt, dass alle fünf Achsen ausgewertet werden, dass die
                      Liste die **Zugehörigkeit** und nicht die Sichtbarkeit meint und
                      auf welchen Zeitpunkt sie sich bezieht. **`leavingPoolNames`
                      an beiden Stellen neu**, in `required` und mit der Begründung
                      aus E-056. `proof:openapi` bleibt bei 64 Prüfungen — die
                      Beschreibung sagt mehr, die Gestalt zwei Felder mehr.
```

Randnotiz zum Werkzeug: Der hauseigene YAML-Leser (`scripts/openapi-reader.mjs`) verträgt keine
über zwei Zeilen umbrochene Flussliste. `required:` bleibt deshalb einzeilig, auch wenn die Zeile
lang wird. Aufgefallen, weil der Nachweispfad daran mit einem Wurf abbrach — nicht mit einer
falschen Aussage.

Nicht angefasst: `packages/domain/**`, `packages/storage/**`, `apps/web/**`,
`packages/*/test/**`, `apps/local-api/scripts/**`, `apps/local-api/src/**` außer
`routes/addin/`, `packages/export/**` (an dieser Aufgabe war nichts zu tun), `tests/e2e/**`.

---

Zusammenfassung:

Der Patch aus dem T-076-Bericht ist eingebaut, und zwar vollständig: `resolveExcluded` im Port,
alle fünf Achsen im Aufruf. Beim Messen ist ein **zweiter Teil desselben Fehlers** aufgefallen,
den der ausformulierte Patch nicht abdeckt — er hätte, wörtlich übernommen, eine neue Falschaussage
erzeugt, diesmal in die andere Richtung. Der Grund ist genau die Unterscheidung, nach der die
Aufgabe zu fragen verlangt hat, nur eine Ebene tiefer: Es geht nicht bloß um Zugehörigkeit **oder**
Sichtbarkeit, sondern um Zugehörigkeit **wann**. Der Aufgabenbereich sagt einen Satz im Futur — „Es
erscheint dann wieder in dem Pool …" —, und seit T-076 ist „jetzt" nicht mehr dasselbe wie
„danach": Eine Regel `completion: 'done'` enthält das erledigte Todo jetzt und nach der Buchung
nicht mehr, eine Regel `exportState: 'open'` umgekehrt. Genannt wird deshalb der Zustand nach der
Buchung, aus **einer** Funktion für beide Sätze. Gemessen ist das gegen die echten Routen mit
sieben Regeln, die alle dieselben erforderlichen Tags tragen — jeder Unterschied im Ergebnis kommt
damit nachweisbar aus einer der neuen Achsen. Die Gegenprobe ist gefahren: Mit dem alten Aufruf
werden sechs der neun neuen Prüfungen rot.

**Nachtrag E-056.** Der Orchestrator hat entschieden, dass der Aufgabenbereich auch ausspricht,
woraus das Todo verschwindet. Das ist keine zweite Auskunft, sondern die andere Richtung derselben:
Der Dienst rechnet jetzt **ein Zustandspaar** statt eines Zustands und liefert `{ appears, leaves }`;
der Satz nennt beides in **einer** Aussage, und wenn keine Regel betroffen ist, kommt Zeichen für
Zeichen der Satz von vorher heraus. Der Fall, für den das entschieden wurde, steht jetzt als Regel
im Bestand des Nachweispfads: `completion: 'done'` **mit** `exportState: 'open'` — die
Abrechnungsliste.

---

## 1. Was der Patch aus T-076 leistet — und was noch fehlte

Der ausformulierte Patch stimmt in jeder Zeile. `poolNamer` rief `matchesPool` mit drei Feldern
auf; `matchesPool` überspringt jede Achse, die es nicht genannt bekommt (das ist Absicht und der
Grund, warum keine bestehende Regel ihre Bedeutung geändert hat), und „übersprungen" heißt hier
„schränkt nicht ein". Eine Regel „Wartung, **außer** Störung" wurde damit zu „Wartung". Der Fehler
konnte nur in eine Richtung gehen — zu viele Pools, nie zu wenige —, und das ist die
unangenehmere: Wer einmal vergeblich in einem genannten Pool gesucht hat, glaubt der Anzeige beim
nächsten Mal nicht mehr, und dann trägt T-038 nichts mehr.

Beim Einbauen sind drei Dinge dazugekommen, die im Patch nicht stehen konnten, weil sie an der
Aufrufstelle liegen:

1. **Der Zeitpunkt** (Abschnitt 2 und 3). `todo.completedAt` unverändert weiterzureichen — so
   steht es im Patch — hätte in `bookOnTodo` die Spalte „Erledigt" genannt, aus der das Todo durch
   genau diese Buchung verschwunden ist.
2. **Die Buchungslage.** Der Patch verweist für `hasOpenEntries`/`hasExportedEntries` auf
   `openSeconds > 0` / `exportedSeconds > 0`. Das trägt in `findMatches`, wo beide Zahlen schon
   dastehen; in `bookOnTodo` gab es keine davon. Dort steht jetzt ein zusätzliches `sumSeconds`
   **innerhalb** derselben Transaktion.
3. **Ein Typ statt einer Argumentliste.** `PoolCandidate` führt die drei Angaben über die Karte
   zusammen. Nicht der Ordnung wegen: `matchesPool` nimmt jedes dieser Felder freiwillig, und ein
   vergessenes Feld ist deshalb kein Übersetzungsfehler, sondern ein leiser. Mit dem Typ
   widerspricht `tsc`, sobald jemand eine Achse hinzufügt und diese Datei sie nicht mitgibt — der
   Fehler, der T-078 überhaupt nötig gemacht hat.

## 2. Zugehörigkeit oder Sichtbarkeit — geprüft, nicht geraten

Die Aufgabe verlangt eine Wahl mit Begründung. Sie fällt auf **Zugehörigkeit** (`matchesPool`),
und zwar aus zwei unabhängigen Gründen:

- **Sichtbarkeit ist im Add-in nicht bestimmbar.** `isVisibleInPool` braucht `includeCompleted` —
  eine Einstellung der **Ansicht** in der Hauptanwendung (E-039), je Pool-Ansicht und je Benutzer.
  Das Add-in kennt sie nicht, bekommt sie über keine seiner vier Routen und müsste sie raten. Eine
  geratene Eingabe in einer Auskunft, die Vertrauen tragen soll, ist schlechter als gar keine.
- **Sie trüge auch nichts bei.** Der Satz redet über den Zustand nach der Buchung, und danach ist
  das Todo unerledigt (A-2.5). `isVisibleInPool({ completedAt: null, … })` ist dann für **jeden**
  Pool `true`, unabhängig von `includeCompleted`. Die zweite Frage hätte also nur eine Antwort und
  brächte einen geratenen Wert herein, um sie zu bekommen.

Was dabei auffällt und in die Irre führen kann: Die Achse `completion` **sieht aus** wie eine
Sichtbarkeitsfrage („Erledigt: Alle / Erledigte / Unerledigte") und ist eine Zugehörigkeitsfrage.
T-076 hat das ausdrücklich getrennt und trägt es in `PoolCompletionFilter` ein. Wer sie für
Sichtbarkeit hält, greift zu `isVisibleInPool`, bekommt eine Funktion, die von der Regel nichts
weiß, und nennt wieder zu viele Pools. Der Weg über `matchesPool` beantwortet beide Fragen mit
einer.

## 3. Der zweite Teil derselben Unterscheidung: Zugehörigkeit **wann**

Damit ist die Wahl getroffen, aber noch nicht der Eingabewert. `matchesPool` urteilt über einen
Zustand, und es gibt zwei mögliche: den jetzigen und den nach der Buchung.

Bis T-076 war das keine Frage: Die Zugehörigkeit hing allein an den Tags, und die Buchung fasst
keine Tags an. Seitdem hängt sie an fünf Größen, von denen die Buchung **zwei** verändert:

| Größe | jetzt | nach der Buchung |
|---|---|---|
| Tags | unverändert | unverändert |
| Status | unverändert (E-023: die Spalte bleibt) | unverändert |
| Erledigt | wie am Todo | **immer offen** (A-2.5, seit T-038 ohne Schalter) |
| offene Buchung | wie gebucht | **immer vorhanden** (E-032: eine neue Buchung ist offen) |
| exportierte Buchung | wie gebucht | unverändert |

Der Aufgabenbereich zeigt `poolNames` ausschließlich im Wiederöffnen-Fall (`TaskPane.tsx`:
`booking.isDone` beziehungsweise `done.reopened`), und die Sätze dazu stehen im Futur
beziehungsweise im Perfekt der eben geschehenen Handlung (`duplicate/reopen.ts`: „Es erscheint dann
wieder in …" / „Es ist zurück in …"). Beide reden über **danach**. Also rechnet der Dienst
danach — und beide Aufrufstellen benutzen dieselbe Funktion `afterBooking`, aus demselben Grund,
aus dem die Sätze selbst in einer Datei stehen: Zwei Rechnungen wären zwei Gelegenheiten,
Verschiedenes zu behaupten.

Die zwei festgesetzten Werte sind keine Vermutung, sondern die Wirkung der Handlung, um die es
geht: Die Aufhebung von „Erledigt" ist seit T-038 nicht abwählbar (das misst Abschnitt 9 des
Nachweispfads bis heute), und eine entstehende Buchung ist abgeschlossen und offen.

**Der Preis dieser Wahl, benannt:** Eine Regel `completion: 'done'` kann vom Add-in **nie** genannt
werden. Das ist richtig und nicht bequem — aus dem Add-in heraus verlässt jedes Todo diese Spalte
in dem Augenblick, in dem gebucht wird. Der Nachweispfad hält beides fest: dass der Pool nicht
genannt wird **und** dass das Todo jetzt gerade hineinfällt (Prüfung „Erledigt: der Pool
„Erledigte Wartung" wird nicht genannt"). Ohne die zweite Hälfte wäre die erste auch dann grün,
wenn die Regel überhaupt niemanden träfe.

## 4. Gemessen

`proof:addin` Abschnitt 12, **zwölf** Prüfungen gegen die echten Add-in-Routen — neun aus T-078,
drei aus E-056 (Abschnitt 5). Der Bestand ist so gewählt, dass keine Antwort zufällig richtig sein
kann: **acht** Regeln, davon sieben mit **wortgleich derselben** Tagliste (Ordner „Wartung", mit
Unterordnern, `matchMode: 'any'`). Eine Auswertung, die nur die Tags kennt, müsste für jedes Todo
alle sieben nennen.

Zwei erfundene Todos, die sich in jeder Achse unterscheiden:

| | Tag „Störung" | Status | Erledigt | offene Buchung | exportierte Buchung |
|---|---|---|---|---|---|
| `TCK-000517` | ja | In Arbeit | nein | nein | nein |
| `TCK-000518` | nein | Backlog | ja | ja | ja |

| Prüfung | Erwartet | Ergebnis |
|---|---|---|
| Ausgangslage | alle sieben Regeln fordern dieselben Tags, beide Todos erfüllen sie | bestätigt |
| ausgeschlossenes Tag | nicht für 517, **doch** für 518 | bestätigt, beide Richtungen |
| Status | nicht für 517 (In Arbeit), doch für 518 (Backlog) | bestätigt |
| Exportstatus | „bereits abgerechnet" nur für 518; „noch nicht abgerechnet" für beide | bestätigt |
| Erledigt | „Erledigte Wartung" für keines — und 518 fällt jetzt gerade hinein | bestätigt |
| leere Regel | „Noch nicht eingerichtet" für keines (A-3.4) | bestätigt |
| vollständige Liste | 517: 2 von 8; 518: 5 von 8, in Poolreihenfolge | `deepEqual` |
| vor = nach | Suche, Buchung und die Suche danach nennen dieselben Pools — seit E-056 in beiden Hälften | deckungsgleich |
| der Satz | nennt „Wartung Nord" und „noch nicht abgerechnet", **nicht** „ohne Störungen", „im Backlog", „Noch nicht eingerichtet" | bestätigt |

Die letzte Prüfung geht bis in den Text, den der Benutzer liest (`describeOffers` →
`reopenPreview`), und nicht nur bis zur Antwort des Dienstes. Der Schaden aus dem Befund entsteht
in diesem Satz und nirgends sonst.

**Die Gegenprobe: Kann die Messung rot werden?** Ja. Mit dem Aufruf von vor T-078 (nur
`todoTagIds`, `ruleTagIds`, `matchMode`) fallen **neun der zwölf** Prüfungen um, mit genau den
Befunden, die T-076 vorhergesagt hat — im Bestand vor E-056 waren es sechs von neun:

```
  FEHL  Ausgeschlossenes Tag …   der Pool wird genannt, obwohl das Todo das Tag trägt
  FEHL  Status …                 der Status wird nicht ausgewertet
  FEHL  Exportstatus …
  FEHL  Erledigt …               genannt wird ein Pool, aus dem das Todo verschwindet
  FEHL  Die vollständige Auskunft …   + 'Wartung ohne Störungen'
                                      + 'Wartung im Backlog'
                                      + 'Erledigte Wartung'
                                      + 'Wartung, bereits abgerechnet'
  FEHL  E-056: die Abrechnungsliste …
  FEHL  E-056: kein Halbsatz …
  FEHL  E-056: ein Satz, dieselbe Aussage …
  FEHL  Der Satz, den der Benutzer liest …
```

Drei Prüfungen bleiben grün, und alle drei sind selbst ein Befund:

- **„vor = nach"** ist auch dann erfüllt, wenn **beide** Seiten falsch rechnen. Die Zusage aus
  T-038 allein hätte diesen Fehler nie gefunden.
- **Die leere Regel** traf schon vorher nichts — sie hängt an keiner der neuen Achsen.
- **Die Ausgangslage** ist eine Aussage über den Bestand und nicht über den Dienst; sie muss grün
  bleiben, sonst prüfte der Abschnitt etwas anderes als er behauptet.

Übrige Nachweise nach dem T-078-Umbau alle grün: openapi 64, access 75, export 97, export-api 69,
taskpane 25, addin-wiring 32, route-policy 40, template-fields 30, db-permissions 17, callers 18,
tags 42, conflicts 149. `proof:addin-wiring` ist dabei der wichtigste Nebenbefund: Er fährt den
**echten** Sidecar gegen eine **echte** migrierte Datenbank und ruft `todo-matches` und die
Buchungsroute über HTTP — der neue Portzug `resolveExcluded` und das zusätzliche `sumSeconds`
laufen dort gegen den echten Adapter und nicht gegen die Attrappe. Nach dem E-056-Umbau ließen sich
fünf davon nicht wiederholen; warum, steht in Abschnitt 6.

`pnpm typecheck` grün. `pnpm build` grün. `pnpm check` **grün, Exitcode 0** (581 Prüffälle,
Zweigabdeckung `packages/storage` 83,78 %) — die rote Stelle aus T-076 ist von unit-tester
geschlossen worden, während diese Aufgabe lief.

## 5. E-056 — das Verschwinden, im selben Satz

**Die Entscheidung.** Der Aufgabenbereich soll aussprechen, woraus ein Todo durch die Buchung
verschwindet. Auflagen: ein Satz, dieselbe Aussage wie das Erscheinen, kein zweiter Absatz, keine
zweite Liste — und **kein Halbsatz**, wenn keine Regel betroffen ist.

**Was das rechnerisch heißt.** `bookingStates` liefert nicht mehr einen Zustand, sondern zwei:
`before` mit dem echten `completedAt` des Todos und seiner echten Buchungslage, `after` mit
`completedAt: null` und `hasOpenEntries: true`. `poolNamer` geht je Pool **einmal** durch: Trifft
die Regel auf `after` zu, ist der Name ein Erscheinen; trifft sie nur auf `before` zu, ist er ein
Verschwinden. Zwei Namenslisten hinterher gegeneinander zu diffen wäre kürzer und falsch — zwei
Pools dürfen denselben Namen tragen, und dann stünde der eine für den anderen ein.

**Warum der Zustand von jetzt hier kein Rückschritt ist**, und warum das an der Stelle im Quelltext
steht: In T-078 war falsch, den **jetzigen** Zustand für eine Aussage über **danach** zu benutzen.
Hier wird er für eine Aussage über jetzt benutzt — „woraus verschwindet es" hat keine Antwort, wenn
man nicht weiß, worin es gerade steht. Wer `before.completedAt` auf `null` setzt, macht beide
Zustände gleich; `leaves` ist dann für immer leer, und **nichts bricht**. Genau deshalb steht der
Satz „das wäre die stille Rückabwicklung von E-056" über der Zeile — und deshalb gibt es die
Gegenprobe unten.

**Eine Abfrage mehr, und sie steht vorne.** `bookOnTodo` liest beide Buchungssummen jetzt **vor**
`timeEntries.create`. Danach wäre die offene Summe unbrauchbar: Sie enthielte die soeben entstandene
Buchung und wäre der Zustand danach, nicht davor. Das ist die Art Fehler, die nie auffällt, weil das
Ergebnis plausibel bleibt.

**Der Satz.** `poolSentence` schreibt vier Fälle aus, statt Bausteine zu verketten. Der Grund steht
im vierten: „Auf dieses Todo passt derzeit keine Poolregel" und „es verschwindet aus dem Pool X"
können nicht beide wahr sein. Aus Bausteinen zusammengesetzt hätte genau dieser Fall sich
widersprochen — er ist der seltenste, und niemand hätte ihn gelesen.

| Fall | Futur |
|---|---|
| erscheint, verliert nichts | „Es erscheint dann wieder in dem Pool „X"." — **unverändert** |
| erscheint und verliert | „Es erscheint dann wieder in dem Pool „X" und verschwindet aus dem Pool „Y"." |
| erscheint nirgends, verliert | „Es verschwindet dann aus dem Pool „Y" und erscheint in keinem anderen." |
| weder noch | „Auf dieses Todo passt derzeit keine Poolregel — es erscheint danach in keinem Pool." |

Die Zahl der Wirkungen bleibt **drei**; das Verschwinden ist keine vierte Zeile geworden. Beides
wird geprüft.

**Gemessen** (drei Prüfungen, Abschnitt 12, gegen die echten Routen):

| Prüfung | Erwartet | Ergebnis |
|---|---|---|
| die Abrechnungsliste steht in `leavingPoolNames` | `['Erledigte Wartung', 'Erledigt, noch nicht abgerechnet']`, und kein Name in beiden Listen | `deepEqual`, Schnittmenge leer |
| kein Halbsatz, wenn nichts betroffen ist | der Satz enthält weder „verschwind" noch „und aus", zeichengleich der Satz von vor E-056 | bestätigt |
| ein Satz, dieselbe Aussage | drei Wirkungen, unveränderte Nicht-Wirkung, beide Hälften im selben Satz, der Punkt am Ende und sonst nirgends | bestätigt, Futur und Perfekt |

Dazu erweitert: „vorher = nachher" hält jetzt **beide** Hälften fest. Und die Suche **nach** der
Buchung sagt `leaves: []` — das ist keine Abweichung, sondern dieselbe Rechnung auf einem anderen
Bestand: Das Todo ist nicht mehr erledigt, eine weitere Buchung nähme es aus keiner Erledigt-Regel
mehr heraus. Stünde dort noch etwas, kündigte der Aufgabenbereich eine Bewegung an, die schon
geschehen ist.

**Die Gegenprobe, zweimal gefahren.** Setzt man `before.completedAt` auf `null` — die stille
Rückabwicklung, vor der der Kommentar warnt —, werden **genau zwei** der drei E-056-Prüfungen rot
und keine andere im ganzen Lauf; die dritte bleibt grün, und das ist richtig, denn sie misst den
Fall, in dem gar nichts verschwindet. Nimmt man stattdessen den Aufruf von vor T-078 zurück, fallen
**alle drei** E-056-Prüfungen zusätzlich um (Abschnitt 4): Ohne die Achsen gibt es weder ein
Erscheinen noch ein Verschwinden, das stimmt.

**Zur zweiten Frage: die leere Regel trifft nichts.** Nachgesehen — meine Prüfung schreibt die
entschiedene Fassung fest, nicht das Gegenteil: „A-3.4: eine Regel ohne Bedingungen wird für
niemanden genannt" verlangt für **beide** Todos, dass „Noch nicht eingerichtet" **nicht** in der
Antwort steht. Fiele die Entscheidung um, würde diese Prüfung rot, und zwar an der richtigen
Stelle. Der Kommentar an der Regel nennt jetzt E-055 in seiner berichtigten Fassung.

## 6. Fünf Nachweispfade konnte ich zuletzt nicht fahren — und warum das nicht meins ist

`proof:access`, `proof:export-api`, `proof:addin-wiring`, `proof:tags` und `proof:conflicts` binden
alle **denselben** Port 17843 und brechen mit dem hauseigenen Satz ab: „Auf 127.0.0.1:17843 lauscht
bereits etwas, auch nach 5 s Warten."

Dort lauscht ein fremder Dienst: PID 1068931, `node apps/local-api/src/index.ts`, gestartet von
`scratchpad/start-api.sh` — das Skript reicht ein Startgeheimnis mit dem Namensbestandteil
**`t079`** herein und läuft seit knapp einer Stunde. Das ist die Arbeitsumgebung einer anderen,
gleichzeitig laufenden Aufgabe. Ich habe **nicht** abgeschossen, was mir nicht gehört, und rund
zwanzig Minuten in mehreren Anläufen gewartet.

Was ich stattdessen tun konnte:

- **Dieselben fünf liefen in dieser Sitzung bereits grün**, nach dem T-078-Umbau und mit dem neuen
  Portzug `resolveExcluded`: access 75, export-api 69, addin-wiring 32, tags 42, conflicts 149.
  `proof:addin-wiring` ist dabei der einzige, der die Add-in-Routen berührt — und er fährt den
  echten Sidecar gegen eine echte migrierte Datenbank.
- **Die E-056-Änderung ist additiv**: ein Feld in einer Antwort. Die einzige Prüfung in
  `proof-addin-wiring.mjs`, die auf diese Antwort schaut, fragt `Array.isArray(…poolNames)`; die
  einzige strenge Schlüsselmengenprüfung im ganzen Pfad steht auf `/addin/context`, das ich nicht
  angefasst habe.
- **Was zu fahren war, ist gefahren:** `proof:addin` 112, `proof:openapi` 64, `proof:export` 97,
  `proof:taskpane` 25, `proof:route-policy` 40, `proof:template-fields` 30,
  `proof:db-permissions` 17, `proof:callers` 18, `pnpm typecheck`, `pnpm build`, `pnpm boundaries`.

Das ist eine Aussage über den Rechner und keine über den Baum — sie gehört trotzdem hierher, weil
sonst „alle Nachweispfade grün" dastünde und ich es nicht gesehen hätte.

## 7. Was ich am Port **nicht** getan habe

`AddinUnit.pools` bekommt genau einen Zug dazu. Drei naheliegende Erweiterungen sind unterblieben,
jede mit demselben Maßstab (RR-1: die Fläche des dauerhaften Tokens klein halten):

- **`TimeEntryPort.exportPresence`** (neu in T-076, genau für diese Achse gebaut) bleibt draußen.
  `timeEntries.sumSeconds` steht seit T-019 im Port und beantwortet dieselbe Frage: Eine Buchung
  hat mindestens eine Sekunde (`CHECK duration_seconds >= 1`, Migration 0001), eine laufende hat
  `NULL` und fällt aus der Summe, eine exportierte ist gesperrt und kann nicht auf null schrumpfen.
  `sumSeconds(…, 'exported') > 0` ist damit zeichengleich „es gibt eine exportierte Buchung" — und
  `has_open` in `exportPresence` verlangt seinerseits `ended_at IS NOT NULL`, also dieselbe
  Abgrenzung. Ein zweiter Weg zu derselben Auskunft wäre die Stelle, an der beide eines Tages
  auseinanderlaufen.
- **`pools.members`** wäre die bequeme Antwort auf „in welchen Pools steht dieses Todo" und ist die
  weite Fläche: eine Abfrage über **fremde** Todos. `resolveRule`/`resolveExcluded` lesen die Regel
  eines Pools und nie einen Bestand — dieselbe Begründung wie in T-038.
- **`isVisibleInPool`** und die dafür nötige Ansichtseinstellung: siehe Abschnitt 2.

---

Annahmen:

1. **`poolNames` bedeutet „nach einer Buchung", nicht „jetzt".** Begründet in Abschnitt 3, in
   beiden Beschreibungen der Schnittstelle nachgetragen und im Nachweispfad festgehalten. Der
   einzige Aufrufer außerhalb des Add-ins ist ein beliebiger lokaler Prozess mit einem Token; für
   ihn steht es jetzt in der Beschreibung. Wäre „jetzt" gewünscht, wären es zwei Listen — und der
   Aufgabenbereich hat einen Satz, nicht zwei.
2. **Die Reihenfolge der Namen ist die Reihenfolge der Pools** (`position`), wie seit T-038.
   Der Nachweis hält sie jetzt mit `deepEqual` fest statt mit `includes`; ein Umsortieren fällt
   damit auf.
3. **`Pool.rule` heißt weiter `rule`** und bedeutet „erforderliche Tags" — Annahme 1 aus T-076,
   unverändert übernommen. Die Attrappe in `fixtures.mjs` benutzt denselben Namen, damit sie nicht
   eine andere Gestalt nachbildet als der Betrieb.
4. **Die Attrappe führt die Neutralwerte ausdrücklich**, statt die neuen Felder wegzulassen. Beides
   verhält sich in `matchesPool` gleich, aber nur das erste bildet den Bestand nach, den es im
   Betrieb gibt: Migration 0011 setzt jeder vorhandenen Regel `completion='any'` und
   `export_state='any'`.
5. **Beide Listen sind ein benanntes Paar und keine zwei Argumente** — im Dienst
   (`AddinPoolMovement`), in der Antwort (zwei Felder) und in der Oberfläche (`PoolMovement`). Zwei
   `readonly string[]` nebeneinander lassen sich vertauschen, ohne dass `tsc` etwas sagt, und das
   Ergebnis wäre ein Satz, der sich fehlerfrei liest und das Gegenteil behauptet. Der Preis sind
   sechs geänderte Aufrufstellen im Nachweispfad; ich halte ihn für richtig angelegt.
6. **`reopenPreview` und `reopenOutcome` nehmen das Paar verpflichtend**, nicht freiwillig mit
   Vorgabe `[]`. Ein Aufrufer, der das Verschwinden vergäße, bekäme einen Satz, der sich vollständig
   liest und die Hälfte weglässt — genau die Bauart Fehler, die T-078 im Dienst behoben hat.
7. **Ein Pool steht nie in beiden Listen**, und die Entscheidung darüber fällt im Dienst, nicht im
   Satzbau: `poolSentence` hat keine Poolregel und darf deshalb nicht darüber urteilen.

Risiken:

1. **Eine sechste Achse bricht diese Stelle wieder** — leise, in dieselbe Richtung. `matchesPool`
   nimmt jedes Achsenfeld freiwillig; ein nicht mitgegebenes Feld ist kein Übersetzungsfehler.
   `PoolCandidate` verkleinert das Risiko (wer die Karte um ein Feld erweitert, muss es füllen),
   beseitigt es aber nicht: Eine neue Achse, die **nur** an der Regel hängt und keine Angabe über
   die Karte braucht, würde weiterhin stumm übersprungen. Der wirksame Schutz ist Abschnitt 12 des
   Nachweispfads — er würde eine solche Regel nennen sehen, wo sie nicht hingehört, sofern jemand
   sie in `AXIS_POOLS` einträgt.
2. **Kein Nachweis über die Oberfläche.** Dass `TaskPane.tsx` die Liste unverändert an
   `reopenPreview` weiterreicht, ist im Quelltext zu sehen und über `describeOffers` gemessen; in
   Outlook geklickt hat es niemand. Das gehört zum bekannten Rest von T-019 (Windows, Outlook,
   WebView2) und ist durch diese Aufgabe weder größer noch kleiner geworden.
3. **`bookOnTodo` macht eine Abfrage mehr.** Ein `SELECT SUM(...)` je Buchung, in derselben
   Transaktion, über `ix_time_entry_todo`. Das Add-in bucht einzeln und auf Knopfdruck; ein N+1
   entsteht hier nicht. In `findMatches` kommt **keine** Abfrage dazu — beide Summen standen schon
   da. Was dazukommt, ist `resolveExcluded` je Pool, parallel zu `resolveRule` in demselben
   `Promise.all`; bei vielen Pools ist das eine Abfrage je Pool mehr, wie schon zuvor.
4. **Sicherheit:** keine neue Fläche außer `PoolPort.resolveExcluded`. Die Methode liest
   Tagkennungen aus der Regel eines Pools, keine Todos, keine Notizen, keine Einstellungen; sie
   schreibt nicht. Kein Wert aus einer Anfrage berührt SQL-Text. Die Notiz-Trennung (A-7.2, R-06)
   ist unberührt — `proof:access` (75) und die Grenzprüfung sind grün.
5. **`leavingPoolNames` ist ein neues Pflichtfeld in zwei Antworten.** Ein Aufrufer, der die
   Beschreibung streng gegen seine Typen prüft, sieht ein Feld mehr; ein Aufrufer, der es nicht
   liest, verliert nichts. Der Aufgabenbereich in diesem Baum liest es. Ein **älteres** Add-in gegen
   einen neuen Dienst bekäme `undefined` und stürbe an `.length` — dieselbe Fassung von beidem wird
   ausgeliefert, aber es ist der Grund, warum das Feld verpflichtend und nicht freiwillig ist: So
   fällt es beim Übersetzen auf und nicht beim Anzeigen.
6. **Fünf Nachweispfade sind zuletzt nicht gelaufen** (Abschnitt 6). Kein fachlicher Befund, aber
   eine Lücke in der Messung, die jemand schließen sollte, sobald der Port frei ist — ein Lauf von
   `pnpm --filter @takt/local-api proof:addin-wiring` genügt für den Teil, der das Add-in betrifft.
7. **Die Beschreibung ist an zwei Stellen geändert, die Gestalt an zwei weiteren.** Ein Prüfwerkzeug, das
   nur Strukturen vergleicht, sieht die geänderten **Beschreibungen** nicht; `proof:openapi` bleibt
   deshalb erwartungsgemäß bei 64 Prüfungen. Die Aussage über die Bedeutung von `poolNames` hängt
   damit an der Beschreibung und am Nachweispfad, nicht an einem Schema.

Offene Fragen:

*(Die beiden Fragen aus der ersten Fassung dieses Berichts sind beantwortet: E-056 ist gebaut und
gemessen — Abschnitt 5 —, und die leere Regel trifft nichts, was meine Prüfung bereits festschreibt.
Es bleiben drei.)*

1. **An den Orchestrator: soll die Auskunft auch außerhalb des Wiederöffnen-Falls erscheinen?**
   Heute zeigt der Aufgabenbereich den Poolsatz **nur**, wenn das Todo erledigt war
   (`booking.isDone` beziehungsweise `done.reopened`). Das ist der einzige Fall, in dem etwas
   verschwinden kann, also deckt sich die Anzeige mit E-056 vollständig. Für ein **offenes** Todo
   liefert der Dienst `poolNames` trotzdem, und niemand liest sie. Entweder ist das richtig so
   (dann bleibt es), oder der Satz gehört auch dorthin (dann ist es eine UX-Aufgabe, keine
   Korrektur). Ich habe nichts geändert.
2. **An den e2e-tester:** Abschnitt 12 misst gegen die Routen, nicht gegen Outlook. Sobald das
   Regelformular die vier neuen Felder sendet, ist ein End-zu-Ende-Fall möglich: Regel mit
   ausgeschlossenem Tag in der Hauptanwendung anlegen, im Aufgabenbereich ein Todo mit diesem Tag
   suchen, den Pool **nicht** im Satz finden.
3. **An den domain-dev (nur zur Kenntnis):** Der Patch aus T-076 Frage 2 ist übernommen, mit den
   drei Ergänzungen aus Abschnitt 1. `PoolPort.resolveRule` blieb in der Rückgabe unverändert —
   die Vorsicht, die im Bericht dafür angegeben wurde, hat sich ausgezahlt: Der Umbau kostete keine
   einzige Änderung an einer fremden Datei.

Nächster Schritt:

Nichts auf dem kritischen Pfad. Sinnvoll in dieser Reihenfolge:

1. **Wer als Nächstes einen freien Port hat** — `pnpm --filter @takt/local-api proof:addin-wiring`
   nachholen (Abschnitt 6). Eine Minute, und die Messlücke ist zu.
2. **frontend-dev** — das Regelformular (T-076, nächster Schritt 3). Bis es die vier Felder sendet,
   lassen sich die neuen Achsen nur über die Route setzen; danach ist der Fehler aus T-078 auch
   über die Oberfläche herstellbar — und behoben. Für E-056 ist das Formular die Voraussetzung:
   Ohne es kann niemand die Abrechnungsliste anlegen, für die entschieden wurde.
3. **e2e-tester** — der Fall aus Offener Frage 2, erst nach dem Formular. Er hat jetzt zwei Hälften:
   den Pool, in dem die Karte danach steht, und den, aus dem sie verschwunden ist.
