Aufgabe: T-071 — `boardRank` aus der Oberfläche, und die Ordnung einer Spalte, in der nicht mehr
gezogen wird

Status: fertig

Artefakte:

Geändert:

```
apps/web/src/api/types.ts          `Todo.boardRank` und `TodoUpdate.boardRank` gestrichen;
                                    der Kopf von `Todo` trägt den Wegfall unter „Was hier
                                    bewusst fehlt" (716 → 722 Zeilen: zwei Felder weg,
                                    acht Zeilen Begründung dazu)
apps/web/src/screens/BoardScreen.tsx  `byRecency` als Vergleicher auf Modulebene, mit der
                                    Begründung der Ordnung darüber; an der einen Stelle, die
                                    sortiert, steht statt
                                    `.sort((left, right) => left.boardRank.localeCompare(…))`
                                    jetzt `.sort(byRecency)` (497 → 529 Zeilen)
.claude/team/reports/T-071-frontend-dev.md  dieser Bericht
```

Nicht im Baum, sondern im Wegwerfordner der Sitzung (`…/scratchpad/`): die beiden Messskripte
`measure-t071.mjs` (zwölf Prüfungen, Abschnitt 2) und `measure-t071-keyboard.mjs` (sechs
Prüfungen, Abschnitt 3). Sie starten denselben Dienst und dieselbe Oberfläche wie
`tests/e2e/support/services.ts`, liegen aber ausdrücklich **außerhalb** des Projekts, weil
`tests/e2e/**` und `apps/web/test/**` nicht meine Hoheit sind.

Nicht angefasst: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`,
`docs/**`, `apps/desktop/**` (dort steht kein `boardRank`, nachgesehen). Kein `git commit`
(kein Git-Verzeichnis in dieser Umgebung).

---

Zusammenfassung:

`pnpm check` steht auf **Exitcode 0**, und alle **zwölf** Nachweispfade sind grün, `proof:callers`
mit 18 von 18 (Abschnitt 4). Der Baum ist committierbar.

Die Entscheidung, die dabei zu treffen war: **zuletzt geändert zuerst, mit der Kennung als
zweitem Schlüssel** — also `updatedAt` absteigend, bei Gleichstand `id` absteigend. Das ist der
Vorschlag des domain-dev, um genau einen Schlüssel erweitert, und der Grund dafür steht in
Abschnitt 1. Es ist wörtlich die Ordnung, in der `GET /todos` die Liste ohnehin liefert
(`repo-todos.ts`: `ORDER BY t.updated_at DESC, t.id DESC`); die Ansicht stellt damit keine zweite
Ordnung neben die des Dienstes, sie spricht dessen Ordnung aus. Gerechnet wird nichts: Beide
Felder sind Zeichenketten des Dienstes, und für beide sagt die Beschreibung zu, dass der Vergleich
als Text die zeitliche Reihenfolge ergibt (`Timestamp`: „Lexikographische Sortierung ist
chronologisch"; `Id`: UUID Fassung 7, „nach Erzeugungszeit sortierbar").

Der behobene Fehler ist **nachgewiesen, nicht behauptet**: zwei Karten in einer Spalte, im echten
Browser, gegen den echten Dienst — beide Karten sichtbar, kein `pageerror`, keine Fehlerausgabe in
der Konsole. Derselbe Lauf zeigt am selben Datenbestand, dass der alte Vergleicher dort
`TypeError: Cannot read properties of undefined (reading 'localeCompare')` wirft und bei **einer**
Karte schweigt — der blinde Fleck des bestehenden End-zu-Ende-Falls, in einem Lauf sichtbar
gemacht (Abschnitt 2).

---

## 1 — Die Ordnung, und warum sie einen zweiten Schlüssel hat

Übernommen ist der Vorschlag: `updatedAt` absteigend. Dazugekommen ist der Gleichstandsschlüssel
`id` absteigend, und zwar aus einem gemessenen Grund und nicht aus Ordnungsliebe:

**Zeitstempel sind sekundengenau** (`Timestamp`, `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$`). Zwei
Karten, die in derselben Sekunde entstehen oder geändert werden, tragen denselben Wert — im
Messlauf ist genau das ohne die eingebauten Wartezeiten von 1,2 Sekunden regelmäßig eingetreten.
Ein Vergleicher nur über `updatedAt` gäbe für diese beiden `0` zurück; welche Karte dann oben
steht, entschiede die Stabilität von `Array.prototype.sort` zusammen mit der **Reihenfolge, in der
die Karten hereinkamen**. Diese Reihenfolge ist heute richtig (der Dienst liefert `id DESC`), aber
sie steht in `takt-local-api.yaml` nirgends zugesichert: `GET /todos` beschreibt Filter, Umschlag
und Blätterung, nicht die Sortierung. Eine Ansicht, die sich auf eine Eigenschaft verlässt, die
nicht zugesagt ist, hat kein Verhalten, sondern Glück.

Mit `id` als zweitem Schlüssel ist der Vergleicher **vollständig**: Für je zwei Karten steht die
Reihenfolge fest, unabhängig davon, wie sie ankommen. Und er bleibt dieselbe eine Wahrheit, weil
er Feld für Feld die Klausel des Dienstes wiederholt und nichts hinzuerfindet.

Verworfen habe ich zwei Alternativen:

* **Gar nicht sortieren** und die Reihenfolge des Dienstes durchreichen (`filter` erhält sie).
  Das Ergebnis ist heute identisch — aber es hinge stillschweigend an der oben genannten,
  unzugesagten Eigenschaft, und niemand, der die Zeile später liest, sähe, dass hier überhaupt
  eine Ordnung gilt.
* **Alphabetisch nach Titel.** Wäre eine eigene, zweite Ordnung über dieselbe Liste — genau die
  Doppelung, die dieses Projekt achtmal hatte. Außerdem wäre sie für den Zweck falsch: Wer eine
  Karte gerade verschoben oder bearbeitet hat, sucht sie dort, wo er sie zuletzt angefasst hat.

**Eine Nebenwirkung, die eine Verbesserung ist und die ich gemessen habe:** Eine Karte, die in eine
andere Spalte wandert — gezogen oder mit `Strg+→` —, wird dadurch geändert und steht deshalb in der
Zielspalte **oben**. Sie landet also an einer vorhersagbaren Stelle statt irgendwo in der Mitte.
Gemessen in Abschnitt 3, Prüfung 3.

---

## 2 — Der Nachweis: zwei Karten in einer Spalte, kein Wurf

Der bestehende Fall `tests/e2e/kanban.spec.ts` kann das nicht zeigen — er stellt je Fall **eine**
Karte in eine frische Spalte, und `sort` ruft den Vergleicher bei einem Element nicht auf. Da
`tests/e2e/**` und `apps/web/test/**` nicht meine Hoheit sind, habe ich stattdessen **außerhalb des
Projekts** gemessen, mit demselben Aufbau, den der End-zu-Ende-Lauf benutzt: echter Dienst aus dem
Quelltext (`node apps/local-api/src/index.ts`, eigenes `XDG_DATA_HOME` im Wegwerfordner), echte
Oberfläche (Vite auf 5173), echter Chromium über Playwright. Kein Attrappen-Server, kein gestubbtes
`fetch`.

Aufbau: eine neue Statusspalte, **zwei** Todos darin, 1,2 Sekunden auseinander angelegt (damit die
sekundengenauen Zeitstempel sich unterscheiden).

```
OK    Zwei Karten in einer Spalte, vom Dienst geliefert
        items: 2
OK    GET /todos fuehrt keinen Schluessel boardRank
        {"id":"01a0615b-f6b6-722e-80d9-6931f71196a3","title":"T071 Karte B","callNumber":null,
         "statusId":"01a0615b-f1f9-709b-947e-5023af50d344","completedAt":null,"tagIds":[],
         "createdAt":"2026-09-02T09:03:32Z","updatedAt":"2026-09-02T09:03:32Z"}
OK    Alter Vergleicher, EINE Karte: kein Wurf (der blinde Fleck)
        kein Wurf
OK    Alter Vergleicher, ZWEI Karten: wirft — der Fehler, um den es geht
        TypeError: Cannot read properties of undefined (reading 'localeCompare')
OK    Neuer Vergleicher, ZWEI Karten: kein Wurf
        kein Wurf
OK    Neuer Vergleicher ordnet zuletzt geaendert zuerst
        T071 Karte B (2026-09-02T09:03:32Z) | T071 Karte A (2026-09-02T09:03:30Z)
OK    Board zeigt BEIDE Karten derselben Spalte
        ["T071 Karte B","T071 Karte A"]
OK    Ordnung im Board: zuletzt geaendert zuerst (B ist neuer als A)
        ["T071 Karte B","T071 Karte A"]
OK    Kein pageerror beim Aufbau des Boards
        []
OK    Keine Fehlerausgabe in der Konsole
        []
OK    Nach Aenderung von A steht A oben — die Ordnung ist wirklich updatedAt
        ["T071 Karte A (bearbeitet)","T071 Karte B"]
OK    Auch nach dem Neuladen kein pageerror
        []

12 bestanden, 0 fehlgeschlagen
```

Drei Dinge daran sind wichtiger als die Zahl:

1. **Die Zeile mit dem `TypeError` und die Zeile mit „kein Wurf" stammen aus demselben Lauf und
   demselben Datenbestand.** Damit ist nicht nur belegt, dass es jetzt geht, sondern auch, dass es
   vorher an genau dieser Stelle brach — und warum der grüne End-zu-Ende-Fall kein Freispruch war:
   Bei einer Karte schweigt auch der alte Vergleicher.
2. **Die Gestalt ist mitgemessen, nicht angenommen.** `Object.hasOwn(todo, 'boardRank')` ist für
   jede Karte falsch; der abgedruckte Umschlag ist die rohe Antwort des Dienstes.
3. **Die letzte Prüfung dreht die Ordnung um.** Nach einem `PATCH` auf Karte A steht A oben. Ohne
   diesen Schritt hätte der Lauf nur gezeigt, dass die Reihenfolge des Anlegens erhalten bleibt —
   was jede beliebige Ordnung auch täte.

---

## 3 — Der Tastaturweg, mit einem Befund

Zweiter Lauf, zwei Spalten: zwei Karten links, eine rechts. Karte fokussieren, `Strg+→`
(`Kanban.tsx`, SC 2.5.7).

```
OK    Aufbau: zwei Karten in Spalte A
OK    Aufbau: eine Karte in Spalte B
OK    Mit der Tastatur verschobene Karte steht oben in der Zielspalte
        ["T071 Karte 1","T071 Karte 3"]
FEHL  Der Fokus bleibt nach dem Verschieben auf einem bedienbaren Element
        vorher: T071 Karte 1 | nachher: body: Zum Inhalt springenTTaktDashboardTodos33
OK    Die Live-Ansage sagt etwas
        „T071 Karte 1“ verschoben nach T071-B-…. Das Erledigt-Kennzeichen bleibt unverändert: offen.
OK    Kein pageerror
        []
```

**Zur roten Zeile: sie ist nicht von dieser Aufgabe verursacht und ich habe sie nicht behoben.**
Die Karte wird beim Spaltenwechsel aus der einen Spalte ausgehängt und in der anderen neu
aufgebaut — React kann denselben DOM-Knoten über zwei verschiedene Elternlisten hinweg nicht
behalten. Das galt mit `boardRank` genauso; die Ordnung innerhalb der Spalte hat damit nichts zu
tun. Wirkung für den Tastaturbenutzer: Nach `Strg+→` steht der Fokus wieder am Dokumentanfang, und
er tabbt sich erneut durch die ganze Hülle zur Karte. Die Live-Ansage sagt, **was** geschehen ist,
aber der Fokus sagt nicht mehr, **wo** man ist. Eine Behebung ist mehr als diese Aufgabe und
braucht eine Entscheidung (Fokus nach dem Neuladen auf die verschobene Karte zurücksetzen, an
`todo.id` festgemacht) — sie gehört in eine eigene Aufgabe, siehe „Offene Fragen" 1. Ich habe sie
nicht in einem Zug mitgenommen, weil der Zweck dieser Aufgabe ein committierbarer Baum ist und
eine Fokusrückgabe über einen asynchronen Neuladelauf keine Änderung ist, die man ungeprüft
danebenlegt.

---

## 4 — Was gemessen grün ist

`pnpm check` — **Exitcode 0**, vollständig durchgelaufen (Protokoll im Wegwerfordner):

```
pnpm typecheck    grün über alle acht Projekte
pnpm boundaries   grün — 283 Quelldateien auf Tiefenzugriffe geprüft, Notiz-Trennung unverletzt
pnpm contrast     grün
proof:openapi     53 bestanden, 0 fehlgeschlagen
proof:callers     18 bestanden, 0 fehlgeschlagen
proof:tags        42 bestanden, 0 fehlgeschlagen
test:coverage     Exitcode 0 · 91,05 / 82,95 / 95 / 93,98
build             Exitcode 0 (alle acht Projekte, apps/web 357 Module)
```

Die neun übrigen Nachweispfade, einzeln nachgefahren:

| Pfad | T-070 | jetzt |
|---|---|---|
| `proof:access` | 75 | **75** |
| `proof:export` | 97 | **97** |
| `proof:export-api` | 69 | **69** |
| `proof:taskpane` | 25 | **25** |
| `proof:addin-wiring` | 32 | **32** |
| `proof:route-policy` | 40 | **40** |
| `proof:template-fields` | 30 | **30** |
| `proof:db-permissions` | 17 | **17** |
| `proof:addin` (outlook) | 100 | **100** |
| `proof:openapi` | 53 | **53** |
| `proof:tags` | 42 | **42** |
| **`proof:callers`** | **16 + 2 rot** | **18, 0 rot** |

Die beiden Beanstandungen aus T-070 sind namentlich weg:

```
3  Die Rümpfe: jeder gesendete Schlüssel wird auch gelesen
  ok    kein Rumpfschlüssel, den die getroffene Route nicht kennt
  ok    kein Feld, das der Dienst liest und die Oberfläche unerklärt nie sendet

6  Der Prüfer prüft sich selbst — mit den drei Namen aus T-050
  ok    der unveränderte Text ergibt keine einzige Beanstandung
```

Der Prüfer stellt sich in Abschnitt 6 weiterhin selbst auf die Probe — er findet die drei
erfundenen Falschnamen aus T-050 und den erfundenen Weg. Es ist also nicht „grün, weil er nichts
mehr sieht".

---

Annahmen:

1. **Der Gleichstandsschlüssel `id` ist meine Zutat, nicht die des domain-dev.** Begründet in
   Abschnitt 1. Wer nur `updatedAt` will, streicht die zweite Zeile von `byRecency`; das Ergebnis
   ist heute dasselbe und hinge dann an der Stabilität von `sort` zusammen mit einer nicht
   zugesagten Eigenschaft von `GET /todos`.
2. **Zwei Zeichenketten mit `localeCompare` zu vergleichen, ist hier keine Zeitrechnung.** Beide
   Werte kommen fertig vom Dienst, beide haben feste Breite und festes Format, und die
   Beschreibung sagt für beide ausdrücklich zu, dass der Textvergleich die zeitliche Reihenfolge
   ergibt. `localeCompare` statt `<`/`>` ist die Schreibweise, die in `apps/web` an allen anderen
   Sortierstellen steht (`ExportScreen`, `TimeScreen`, `BookingsScreen`, `TodoDetailScreen`) —
   eine zweite Schreibweise für dieselbe Sache wäre die schlechtere Wahl.
3. **Der Kopf über `Todo` in `types.ts` nennt `boardRank` beim Namen.** Das ist eine Beschriftung
   für etwas, das es **nicht** gibt, und damit ausdrücklich nicht der Fall, den T-066 verworfen
   hat (eine tote Spalte, die weiter existiert). `takt-local-api.yaml` und
   `packages/domain/src/todo.ts` führen denselben Hinweis; die Oberfläche schweigt nun nicht als
   einzige. Für `proof:callers` ist er folgenlos: `caller-scan.mjs` liest den Syntaxbaum, nicht
   den Text — Kommentare kommen dort nicht vor.
4. **Der Board-Schirm bleibt ein Schirm über Statusspalten.** E-054 beschreibt Spalten als Regeln
   über Tags, und `GET /board` gibt es; die Oberfläche ruft es nicht. Das zu ändern war nicht
   Gegenstand dieser Aufgabe, und `PATCH /todos { statusId }` gibt es weiterhin — das Ziehen
   **zwischen** Spalten wirkt also. Siehe „Offene Fragen" 2.

---

Risiken:

* **R-1 (gering, gemessen) — der Fokus geht beim Verschieben verloren.** Abschnitt 3. Nicht neu,
  nicht von dieser Änderung verursacht, aber jetzt belegt statt vermutet. Betrifft den
  Tastaturweg, den SC 2.5.7 gerade als Ersatz für das Ziehen verlangt.
* **R-2 (gering) — die Live-Ansage sagt nicht, wo die Karte gelandet ist.** Sie sagt die Spalte
  und dass das Erledigt-Kennzeichen unberührt bleibt. Dass die Karte in der Zielspalte **oben**
  steht, sieht ein sehender Benutzer; ein Screenreader-Benutzer erfährt es nicht. Ich habe den
  Satz **nicht** ergänzt, weil er im seltenen Gleichstandsfall (zwei Karten in derselben Sekunde
  geändert) falsch wäre und eine Ansage, die fast immer stimmt, schlechter ist als keine. Eine
  immer wahre Fassung wäre eine Aussage über die Regel statt über die Karte („Karten stehen in
  ihrer Spalte nach zuletzt geändert") — das ist eine Textentscheidung, siehe „Offene Fragen" 3.
* **R-3 (keine neue Angriffsfläche).** Ein Feld weniger im Antworttyp, ein Feld weniger im
  Rumpftyp, ein Vergleicher ohne Zustand und ohne Netzzugriff. `proof:route-policy` (40),
  `proof:access` (75) und die Notiz-Trennung (`pnpm boundaries`) sind unverändert grün.
* **R-4 (Bestand)** — `apps/outlook-addin/scripts/**` setzt weiterhin `boardRank` auf seinen
  Attrappen (vier Zeilen, aus T-070 Risiken). Nicht meine Hoheit, gemessen folgenlos
  (`proof:addin` 100 von 100), weiterhin tot.

---

Offene Fragen:

1. **Fokusrückgabe nach dem Verschieben einer Karte — eigene Aufgabe?** Gemessen in Abschnitt 3.
   Ich schlage vor: nach `bump()` den Fokus auf `.kcard__open` der Karte mit derselben `todo.id`
   zurücksetzen, sobald die neue Liste steht; dazu ein sichtbarer Fokusring, den es schon gibt.
   Das ist meine Hoheit und ich kann es übernehmen — aber es ist eine Änderung an der
   Fokusführung über einen asynchronen Neuladelauf, und die gehört nicht ungeprüft in eine
   Aufgabe, deren Zweck ein grüner Baum ist.
2. **Steht der Kanban-Schirm noch richtig zu E-054?** `BoardScreen` gruppiert nach `statusId` und
   lässt zwischen Statusspalten ziehen; die Migration 0010 beschreibt Kanban-Spalten dagegen als
   Regeln über Tags, und `GET /board` liefert genau das, wird aber von der Oberfläche nicht
   gerufen (`NOT_CALLED_BY_UI` in `proof-callers.mjs`). Zusätzlich führt `Pool` in
   `takt-local-api.yaml` ein Pflichtfeld `placement`, das der Typ `Pool` in
   `apps/web/src/api/types.ts` nicht kennt. Beides sieht nach einer nachzuziehenden Ansicht aus,
   nicht nach einem Fehler in dieser Aufgabe. Ich habe es nicht angefasst und rate nicht: Wenn das
   Board auf `GET /board` umgestellt werden soll, ist das eine eigene, größere Aufgabe mit einer
   Entscheidung über die Bedienung (was bedeutet Ziehen, wenn die Spalte eine Regel ist?).
3. **Soll die Live-Ansage die Ordnung nennen?** R-2. Ein Satz, immer wahr formuliert:
   „Karten stehen in ihrer Spalte nach zuletzt geändert." Kostet bei jedem Verschieben eine
   Vorlesezeile mehr. Ich mache es auf Zuruf, nicht ungefragt.

---

Nächster Schritt:

Nichts hängt mehr an T-071. `pnpm check` ist auf 0, alle zwölf Nachweispfade sind grün,
`todo.board_rank` ist in Schema, Domäne, Adapter, Dienst, Beschreibung, Tests **und** Oberfläche
weg. Der Baum kann committiert werden.

Danach, in dieser Reihenfolge und jeweils als eigene Aufgabe: die Fokusrückgabe aus „Offene
Fragen" 1 (klein, meine Hoheit, gemessener Anlass), dann die Klärung aus „Offene Fragen" 2 —
denn solange sie offen ist, beschreibt `takt-local-api.yaml` ein Board, das die Oberfläche nicht
zeigt. Und ein End-zu-Ende-Fall, der **zwei** Karten in **eine** Spalte stellt, gehört in
`tests/e2e/kanban.spec.ts`: Die Messung aus Abschnitt 2 belegt den heutigen Stand, aber sie läuft
in keinem Prüflauf mit, und genau diese Lücke hat den Fehler zwei Aufgaben lang getragen.
