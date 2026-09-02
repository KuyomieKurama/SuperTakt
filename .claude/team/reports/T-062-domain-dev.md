Aufgabe: T-062 — Ein Angebot einlösen, bevor die Doppelung erstarrt

Status: fertig

---

Artefakte:

Neu:

```
apps/local-api/src/usecases/tag-names.ts   NEU (204) — `resolveTagNames`, `AbortTodoCreate`,
                                            `TagNameUnit`, `ResolvedTagNames`. Alles exportiert.
                                            Kein Verhalten geändert, nur Ort und Zuschnitt
```

Geändert:

```
apps/local-api/src/usecases/todos.ts          521 → 405 Zeilen — `resolveTagNames` (83) und
                                               `AbortTodoCreate` (37) heraus, ein Import herein;
                                               zwei Typimporte (`TagNameCandidate`, `TaktError`)
                                               entfallen; ein Absatz im Kommentar von
                                               `createTodo`
apps/local-api/openapi/takt-local-api.yaml    die Fußnote am Dateiende ersetzt (nur Kommentar,
                                               kein Schema, keine Zeile innerhalb der
                                               Add-in-Abschnitte)
docs/architektur.md 3.4                       Pfad im Schaubild; „Nicht auf dem Add-in-Weg" war
                                               seit T-061 falsch und ist jetzt „Auch auf dem
                                               Add-in-Weg", mit dem Zuschnitt und einem
                                               ausdrücklichen Stand
```

Nicht angefasst: `apps/local-api/src/routes/addin/**`, `apps/outlook-addin/**`, `apps/web/**`,
`packages/export/**`, `tests/e2e/**`, `packages/*/test/**`, die Wurzeldateien. Kein `git commit`.

---

Zusammenfassung:

`resolveTagNames` ist exportiert, zusammen mit `AbortTodoCreate`. Sie liegt jetzt in einem
eigenen, schmalen Modul `usecases/tag-names.ts` statt in `usecases/todos.ts`, und ihr Parameter
ist nicht mehr `UnitOfWork`, sondern genau das, was sie benutzt. **Der Zuschnitt aus dem Vorschlag
trägt nicht** — `Pick<UnitOfWork,'tags'>` ist `{ tags: TagPort }` und nimmt `AddinUnit` nicht an,
weil `AddinUnit.tags` seinerseits schon ein `Pick` ist. Ich habe eine Ebene enger geschnitten:
`{ tags: Pick<TagPort, 'findByKey' | 'create'> }`. Beide Arbeitseinheiten erfüllen das, keine
musste dafür angefasst werden. Gemessen, nicht behauptet: Ich habe den Aufruf des integration-dev
in seiner Gestalt gegen `tsc` gehalten (grün) und den vorgeschlagenen Zuschnitt ebenfalls (rot,
`TS2345`), beide Wegwerfdateien danach gelöscht. Dazu ist die Fußnote am Ende der
Schnittstellenbeschreibung ersetzt, die seit T-019 das Gegenteil dessen sagte, was in der Datei
steht.

---

## 1 — Die Antwort auf die Frage, die zählt: kann er ohne weitere Änderung importieren?

**Ja.** Er ersetzt seine 60 Zeilen durch zwei:

```ts
import { AbortTodoCreate, resolveTagNames } from '../../usecases/tag-names.ts';
```

und in `createTodo` in `routes/addin/service.ts`:

```ts
const resolved = await resolveTagNames(unit, names.value, now);
// ...
} catch (error) {
  if (error instanceof AbortTodoCreate) return err(error.failure);
  throw error;
}
```

Zu löschen: `AbortAddinTodoCreate` (Zeilen 268–291) und `resolveTagNames` samt Kommentar
(Zeilen 396–489). Das sind rund 120 Zeilen einschließlich Kommentar, davon etwa 60 Quelltext —
seine Schätzung.

**Was er mit löschen muss.** Genau ein Typimport wird unbenutzt: `TagNameCandidate` — und
`noUnusedLocals` steht in `tsconfig.base.json` auf `true`, das ist also kein Schönheitsfehler,
sondern ein roter `tsc`. Sonst nichts: `TaktError`
bleibt (Rückgabetyp von `createTodo`), `Tag` bleibt (`createdTags`), `Timestamp` bleibt
(`AddinTodoMatch`, `AddinBookInput`), `checkTagNames` bleibt. Der Rückgabewert `{ all, fresh }`
ist derselbe wie bisher und heißt jetzt `ResolvedTagNames`, falls er ihn benennen will.

**Was sich an seiner Fläche nicht ändert.** `AddinUnit` bleibt Zeichen für Zeichen, wie es ist.
Ich habe den Parametertyp so geschnitten, dass er zu `AddinUnit` passt, und nicht `AddinUnit` so,
dass es zum Parametertyp passt. Das ist die Richtung, die die Angriffsfläche des Add-in-Tokens
nicht anfasst.

**Der Prüffall bleibt stehen.** `proof:addin` 11c („derselbe Name über beide Wege ergibt dasselbe
Tag") misst nach seinem Handgriff etwas Triviales. Genau das war das Ziel: Ein Prüffall, der eine
Doppelung bewacht, ist eine schlechtere Lösung als keine Doppelung — aber er ist nicht dadurch
wertlos, dass er trivial wird. Er hält weiterhin fest, dass beide Wege dieselbe Datenbank
dieselbe Frage fragen.

---

## 2 — Warum `Pick<UnitOfWork,'tags'>` nicht reicht, und was stattdessen dasteht

Der Vorschlag lautete:

```ts
unit: Pick<UnitOfWork, 'tags'>   // statt UnitOfWork: dann passt auch AddinUnit
```

Das aufgelöst ist `{ readonly tags: TagPort }` — der **volle** Tag-Port mit `load`,
`listInFolder`, `rename`, `move`, `remove`, `setOnTodo`. `AddinUnit.tags` ist aber selbst schon
ein `Pick<TagPort, 'findByKey' | 'create'>` (T-061, aus RR-1 und mit ausgeschriebener Begründung
in `routes/addin/ports.ts`). Ein Parameter, der den vollen Port verlangt, nimmt das nicht an.

Nachgemessen statt vermutet — eine Wegwerfdatei unter `apps/local-api/src`, ein Lauf, dann
gelöscht:

```
src/__t062-neg.ts(4,45): error TS2345: Argument of type 'AddinUnit' is not assignable to
  parameter of type 'Pick<UnitOfWork, "tags">'.
    Types of property 'tags' are incompatible.
      Type 'Pick<TagPort, "create" | "findByKey">' is missing the following properties from
        type 'TagPort': load, listInFolder, rename, move, and 2 more.
```

Hätte ich den Vorschlag wörtlich umgesetzt, wäre er beim Import gegen genau diese Meldung
gelaufen und hätte ein zweites Mal fragen müssen. Das war die eine Sache, die diese Aufgabe nicht
passieren lassen durfte.

Deshalb steht dort:

```ts
export interface TagNameUnit {
  readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
}
```

**Der Zuschnitt ist keine Formalie, er ist der Grund für die Doppelung gewesen.** Ein Parameter,
der mehr verlangt, als die Funktion benutzt, schließt Aufrufer aus, die weniger haben — und die
haben weniger meist aus einem guten Grund. Hier: weil das Add-in-Token nicht mehr können soll.
Der Aufrufer steht dann vor der Wahl, seine Fläche zu verbreitern oder abzuschreiben, und beides
ist falsch. Ein zu weiter Parametertyp erzeugt also nicht bloß Unsauberkeit, sondern genau die
Doppelung, die er verhindern soll. Das steht so auch im Quelltext an der Schnittstelle.

Gegengemessen ist auch die positive Richtung: dieselbe Bauart Wegwerfdatei, drei Aufrufe —
`UnitOfWork`, `AddinUnit`, und der vollständige Aufruf aus `deps.inTransaction(...)` heraus mit
`catch (error) { if (error instanceof AbortTodoCreate) ... }`. `tsc` grün, Datei gelöscht.

---

## 3 — Warum ein eigenes Modul und nicht nur ein `export`

Ein `export` vor die vorhandene Funktion hätte gereicht, um die zweite Fassung zu löschen. Das
Modul ist die zweite Hälfte derselben Überlegung, die der Auftrag beim Parametertyp anstellt, nur
eine Ebene höher — und es ist dieselbe Überlegung wie bei `@takt/domain/export`:

Wer die Auflösung von Tagnamen braucht, sollte nicht das Modul einbinden müssen, in dem `createTodo`,
`updateTodo`, `searchEverything`, `findTodosByCallNumber` und `setDefaultTags` stehen. Für die
Add-in-Routen hieße das, aus einem Verzeichnis zu importieren, dessen restlicher Inhalt sie
ausdrücklich nichts angeht; ihr bislang einziger Import aus dem übrigen Dienst ist `statusFor`
aus `http/problem.ts`, und der holt eine Zahl. Ein Import auf `usecases/tag-names.ts` sagt am
Importpfad, was geholt wurde, und macht später sichtbar, wenn jemand mehr holt.

Es gibt **keinen** Re-Export aus `usecases/todos.ts`. Zwei Namen für dieselbe Sache sind der
Anfang der Frage, welcher der richtige ist. Niemand importierte sie bisher von dort — sie war ja
nicht exportiert —, also kostet der eine Pfad niemanden etwas.

**Was sich nicht geändert hat:** kein Zeichen am Verhalten. Dieselben drei Fälle (0/1/>1
Treffer), derselbe Fehlerschlüssel `tag_name_ambiguous`, derselbe Satz, dasselbe `field:
'tagNames'`, dasselbe Anlegen auf Wurzelebene und farblos, derselbe Wurf statt Rückgabewert
(T-047). `proof:tags` steht unverändert auf 42/0, `proof:export` (97/0) fährt `createTodo`
weiter, `proof:openapi` (46/0) fährt alle 64 Operationen.

---

## 4 — Die Fußnote

Am Dateiende von `apps/local-api/openapi/takt-local-api.yaml` stand:

```
# Nicht in dieser Datei beschrieben
#
# Der Namensraum /api/v1/addin/** gehört integration-dev
# (`apps/local-api/src/routes/addin/`) und wird gesondert beschrieben.
```

Beides ist seit T-019 falsch. In der Datei stehen vier Add-in-Operationen (`getAddinContext`,
`findAddinDuplicates`, `createAddinTodo`, `createAddinTimeEntry`) und zwei Add-in-Bauteile
(`AddinTodoCreated`, `AddinTodoMatch`), und `proof:openapi` vergleicht die Routen in **beide**
Richtungen — eine unbeschriebene Route wäre rot.

Die neue Fußnote sagt vier Dinge:

1. Der Namensraum **steht** in dieser Datei, seit T-019, mit den vier Operationen beim Namen.
2. Was vorher dastand, wie lange, und warum es niemandem geschadet hat: Es ist eine Aussage
   **über** die Datei, und die führt kein Lauf aus. Deshalb hat sie ein Mensch gefunden und kein
   Nachweispfad. Der Vermerk steht da, damit die nächste Aussage dieser Art als solche erkennbar
   ist.
3. Wem welcher Abschnitt gehört — die vier `/addin`-Pfade und die zwei Add-in-Bauteile dem
   integration-dev, alles Übrige mir — und warum es **eine** Datei mit zwei Abschnitten ist und
   nicht zwei Dateien: gemeinsame Bauteile, gemeinsame Token-Prüfung, gemeinsames Fehlerformat.
   Zwei Dateien hätten davon irgendwann zwei Fassungen, und die Add-in-Fläche ist die, bei der
   ein Auseinanderlaufen zuletzt auffiele.
4. Was **wirklich** nicht in der Datei steht: der Aufgabenbereich selbst, ausgeliefert auf einem
   zweiten Port über HTTPS (E-046), ausschließlich statische Dateien, keine Operation. Also
   nichts zu beschreiben, nicht bloß nichts Beschriebenes.

Die alte Zusicherung „keine Route, die den internen Vermerk an eine Exportfläche weiterreicht"
(A-7.2, R-06) ist unverändert übernommen. Es ist ein YAML-Kommentar; kein Schema, kein
Statuscode, keine Zeile innerhalb der Add-in-Abschnitte hat sich bewegt. `proof:openapi` bleibt
bei 46/0.

---

Annahmen:

1. **Der Zuschnitt ist eine Ebene enger als vorgeschlagen.** `{ tags: Pick<TagPort, 'findByKey' |
   'create'> }` statt `Pick<UnitOfWork,'tags'>`. Ich habe das nicht rückgefragt, weil der
   Vorschlag seinen eigenen Zweck („dann passt auch `AddinUnit`") mit dem wörtlichen Typ nicht
   erreicht hätte und die enge Fassung ihn erreicht. Der Typ heißt `TagNameUnit` und ist
   exportiert.
2. **Eigenes Modul statt `export` in `todos.ts`.** Begründung in Abschnitt 3. Wenn der
   Orchestrator den Import lieber auf `usecases/todos.ts` sähe, ist das ein Re-Export von zwei
   Zeilen; ich halte ihn für schlechter und habe ihn deshalb nicht gesetzt.
3. **Der Name bleibt `AbortTodoCreate`,** nicht `AbortTagResolution`. Der Wurf nimmt das Anlegen
   des Todos mit; genau das soll an der `catch`-Zeile stehen. Der integration-dev nannte den Namen
   in seinem Vorschlag ebenfalls so.
4. **`docs/architektur.md` 3.4 ist nachgezogen.** Das stand als Vorschlag an den documenter in
   T-061; die Datei liegt aber in meiner Hoheit, der Satz „Nicht auf dem Add-in-Weg" war seit
   T-061 falsch, und der Pfad im Schaubild wäre durch **meine** Verschiebung falsch geworden. Ein
   Dokument, das den falschen Dateinamen nennt, ist dieselbe Art Fehler wie die Fußnote, die ich
   in derselben Aufgabe repariere. Der Abschnitt sagt ausdrücklich, was heute gilt und was noch
   aussteht (der Handgriff in `routes/addin/service.ts`), statt den Endzustand vorwegzunehmen.
5. **Die zwei Wegwerfdateien sind gelöscht.** `src/__t062-check.ts` und `src/__t062-neg.ts` haben
   je einen `tsc`-Lauf gesehen und liegen nicht mehr im Baum. Ihr Inhalt steht in Abschnitt 1 und
   2 dieses Berichts, damit die Messung nachvollziehbar ist, ohne dass ein Dauerartefakt entsteht,
   das niemand fährt.

---

Risiken:

1. **Die Doppelung ist noch da — bis der integration-dev seinen Handgriff macht.** Ich habe die
   Voraussetzung gebaut, nicht die Auflösung durchgeführt; `routes/addin/**` ist fremde
   Dateihoheit. Bis dahin trägt weiterhin `proof:addin` 11c die Gleichheit der beiden Fassungen.
   Das ist der Zustand, den T-061 hinterlassen hat, nur mit dem Weg heraus jetzt zwei Zeilen
   breit statt gar nicht vorhanden.
2. **Die Verschiebung berührt eine Datei, die andere lesen.** `apps/outlook-addin/scripts/
   proof-addin.mjs` importiert `createTodo` aus `../../local-api/src/usecases/todos.ts` — das
   bleibt gültig, `createTodo` ist dort geblieben. `apps/local-api/scripts/proof-export.mjs`
   ebenso. Nachgemessen: `proof:addin` 100/0, `proof:export` 97/0.
3. **Der Kommentar in `routes/addin/service.ts` ist ab jetzt teilweise überholt.** Er sagt, die
   Schwesterfassung sei „dort **nicht exportiert**". Das stimmt nicht mehr. Ich darf die Zeile
   nicht anfassen; sie verschwindet ohnehin mit der Funktion, an der sie hängt.
4. **Kein Sicherheitsbezug.** Keine Route, kein Schema, kein Statuscode, keine Fehlermeldung und
   keine Port-Fläche hat sich bewegt. `AddinUnit` ist unverändert; `proof:route-policy` (40/0),
   `proof:access` (75/0) und `proof:addin-wiring` (32/0) sind grün.
5. **Das neue Modul ist nicht in der Prüfsuite abgedeckt, weil es dort vorher auch nicht war.**
   Die Funktion war und ist über `proof:tags` (42), `proof:addin` (14 Prüfungen in Abschnitt 11)
   und `proof:export` gefahren, nicht über Vitest. Die Verschiebung ändert daran nichts; die
   Abdeckungszahlen des Laufs sind unverändert (Statements 90,99 %).

---

Offene Fragen:

1. **An den integration-dev (über den Orchestrator): der Handgriff steht bereit, mit dieser
   Signatur.**

   ```ts
   // apps/local-api/src/usecases/tag-names.ts
   export interface TagNameUnit {
     readonly tags: Pick<TagPort, 'findByKey' | 'create'>;
   }
   export interface ResolvedTagNames {
     readonly all: readonly Tag[];
     readonly fresh: readonly Tag[];
   }
   export class AbortTodoCreate extends Error {
     readonly failure: TaktError;
     constructor(failure: TaktError);
   }
   export function resolveTagNames(
     unit: TagNameUnit,
     candidates: readonly TagNameCandidate[],
     timestamp: Timestamp,
   ): Promise<ResolvedTagNames>;
   ```

   Import: `import { AbortTodoCreate, resolveTagNames } from '../../usecases/tag-names.ts';`
   Nicht `usecases/todos.ts` — Begründung in Abschnitt 3. **Er muss nicht noch einmal fragen**,
   und er muss an meiner Seite nichts ändern lassen: `AddinUnit` passt unverändert, gemessen.

2. **An den Orchestrator: die zweite offene Frage aus T-061 ist mit dieser Aufgabe halb
   beantwortet.** Die neue Fußnote schreibt die Aufteilung der YAML-Datei so fest, wie der
   Auftrag sie mir genannt hat: Add-in-Abschnitte beim integration-dev, alles Übrige bei mir. Ist
   das die endgültige Entscheidung, gehört sie als Eintrag nach `decisions.md`; ich schreibe dort
   nichts hinein. Solange sie nur in einem YAML-Kommentar und in zwei Aufgabenstellungen steht,
   meldet er sie beim nächsten Mal wieder als Abweichung.

3. **An den unit-tester (Angebot, kein Bedarf):** `usecases/tag-names.ts` ist jetzt einzeln
   importierbar und hängt an keinem `AppContext`, keiner Uhr und keinem HTTP. `resolveTagNames`
   gegen eine Attrappe mit zwei Methoden zu fahren, ist ein Dreizeiler. **Bitte nicht doppeln:**
   Der Wettlauf und der Vergleich beider Wege gehören in `proof:tags` und `proof:addin` — sie
   brauchen acht gleichzeitige Anfragen und eine echte migrierte Datenbank. Interessant wären
   allein die drei Verzweigungen (0/1/>1 Treffer) und dass ein Fehlschlag von `tags.create` als
   Wurf herauskommt und nicht als Wert.

---

Nächster Schritt:

1. **integration-dev:** Import setzen, `AbortAddinTodoCreate` und die eigene `resolveTagNames`
   löschen, `proof:addin` fahren. Erwartung: 100/0, unverändert. Danach steht die Auflösung
   einmal im Baum, so wie die Gleichheitsregel immer einmal im Baum stand.
2. **Orchestrator:** entscheiden, ob die Aufteilung der Schnittstellenbeschreibung nach
   `decisions.md` gehört (offene Frage 2).
3. **documenter:** `docs/architektur.md` 3.4 trägt jetzt einen Satz „Stand", der nach dem
   Handgriff aus Schritt 1 hinfällig wird. Er ist bewusst so geschrieben, dass er dann zu
   streichen und nicht umzuformulieren ist.

---

Befehle, die diese Aufgabe belegen:

```
pnpm check                                           exit 0 — typecheck, boundaries,
                                                     contrast (0 von 376 durchgefallen),
                                                     proof:openapi, proof:callers, proof:tags,
                                                     Abdeckung, alle Bauten
pnpm --filter @takt/local-api proof:openapi          46 / 0
pnpm --filter @takt/local-api proof:callers          18 / 0
pnpm --filter @takt/local-api proof:tags             42 / 0
pnpm --filter @takt/outlook-addin proof:addin       100 / 0
pnpm --filter @takt/local-api proof:export           97 / 0
pnpm --filter @takt/local-api proof:export-api       69 / 0
pnpm --filter @takt/local-api proof:access           75 / 0
pnpm --filter @takt/local-api proof:addin-wiring     32 / 0
pnpm --filter @takt/local-api proof:route-policy     40 / 0
pnpm --filter @takt/local-api proof:taskpane         25 / 0
pnpm --filter @takt/local-api proof:template-fields  30 / 0
pnpm --filter @takt/local-api proof:db-permissions   17 / 0
```

Dazu zwei Läufe, die kein Dauerartefakt hinterlassen haben:

```
tsc gegen src/__t062-check.ts   grün  — UnitOfWork, AddinUnit und der vollständige Aufruf
                                        aus deps.inTransaction(...) mit dem catch
tsc gegen src/__t062-neg.ts     rot   — TS2345 für Pick<UnitOfWork,'tags'> gegen AddinUnit,
                                        also der Beleg, dass der wörtliche Vorschlag ihn
                                        ein zweites Mal hätte fragen lassen
```

Alle Läufe nacheinander; `proof:tags`, `proof:access` und `proof:addin-wiring` belegen weiterhin
denselben Port 17843.
