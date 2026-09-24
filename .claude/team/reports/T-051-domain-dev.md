Aufgabe: T-051 — Die Sicherung, die gefehlt hat: ein Prüflauf, der die Aufrufer der Oberfläche
gegen die Routenschemata des Dienstes hält. Dazu die beiden kleinen Punkte aus T-050 Punkt 7.

Status: fertig

---

Artefakte:

Neu:

```
apps/local-api/scripts/proof-callers.mjs   NEU (552) — der Nachweis: Wege, Rümpfe,
                                           Fragezeichenparameter, blinde Flecken, Selbstprobe
apps/local-api/scripts/caller-scan.mjs     NEU (286) — der Leser: TypeScript-Syntaxbaum von
                                           `endpoints.ts`, Schlüssel je Aufruf, Typauflösung
                                           über `types.ts`. Urteilt nicht
```

Geändert:

```
package.json (Wurzel)                          `proof:callers` und derselbe Eintrag in der
                                               `check`-Kette, hinter `proof:openapi`
apps/local-api/package.json                    `proof:callers`
apps/local-api/src/routes/structure.ts    330  `statusCreateSchema` nimmt `color` entgegen (T-050
                                               Punkt 7a), Begründung am Schema
apps/local-api/src/usecases/structure.ts  528  `createStatus` reicht die Farbe durch
apps/local-api/openapi/takt-local-api.yaml     `POST /todo-statuses` beschreibt `color`; der
                                               Vermerk „nimmt keine Farbe entgegen" ist ersetzt
apps/local-api/scripts/service-scenario.mjs 621 legt die Spalte mit einer erkennbaren Farbe an
                                               (`STATUS_COLOR`)
apps/local-api/scripts/proof-openapi.mjs  949  eine Probe mehr: „eine mit Farbe angelegte Spalte
                                               trägt sie auch" (45 → 46)
packages/storage/src/ports.ts             732  `TodoStatusPort.create` nimmt `color` — hinter
                                               `now` und weglassbar, damit kein Aufrufer bricht
packages/storage/src/sqlite/repo-statuses.ts 211 das INSERT schreibt die Farbe statt NULL
docs/architektur.md                      1020  Abschnitt 5.0a „Die dritte Seite des Dreiecks",
                                               eine Zeile in der Tabelle in 7
```

`apps/web/**`, `apps/outlook-addin/**`, `tests/**`, `packages/*/test/**`, `packages/export/**`,
`apps/desktop/**` und `docs/spec.md`: **unangetastet**. `apps/web/src/api/endpoints.ts` habe ich
ausschließlich gelesen — auch für die Gegenprobe, siehe Punkt 4. Kein neues Paket,
`pnpm-lock.yaml` unverändert.

---

Zusammenfassung:

**1 — Was der Lauf tut.**

`pnpm proof:callers` liest `apps/web/src/api/endpoints.ts` mit dem TypeScript-Syntaxbaum und hält
jeden der 61 `request(...)`-Aufrufe gegen den Dienst. Vier Vergleiche:

| Was | Wogegen | Fände |
|---|---|---|
| Methode + Pfad | die Operationen der Beschreibung (`/todos/${id}` → `/todos/{}`) | einen Weg, den es nicht gibt |
| Rumpfschlüssel | `REQUEST_SCHEMAS` in den Routendateien | `neuerParentId`, `reihenfolge`, `color` |
| Abfrageschlüssel | die Fragezeichenparameter der Operation | `nurOffene` |
| Gegenrichtung | jede Operation außerhalb `/addin` hat einen Aufrufer | eine unerreichbare Route |

Die Namensquelle für Rümpfe ist dieselbe wie bei `proof:openapi`: die zod-Schemata neben den
Routen, nicht die Beschreibung. Für die Fragezeichenparameter ist es die Beschreibung — sie darf
es sein, weil `proof:openapi` Abschnitt 10 jeden beschriebenen Parameter im Quelltext der Routen
nachweist. Zusammen ist das eine Kette Aufrufer → Beschreibung → Routenquelle, kein Zirkel.

**2 — Der Leser kann mehr als grep, und wo er aufhört, sagt er es.**

Er versteht Objektliterale, Kurzschreibweise, und vor allem die Form, in der diese Datei ihre
Abfragen baut: `...(x === undefined ? {} : { a: x })`. Beide Zweige zählen — ein Schlüssel, der
manchmal mitgeht, geht manchmal mit. Einen Bezeichner löst er über den **Typ seines Parameters**
auf: `createPool(body: PoolWrite)` wird zu den Feldern von `PoolWrite` aus `types.ts`. Damit sind
alle 30 Rümpfe und alle 7 Abfragen der Datei erfasst, ohne eine einzige Lücke.

Was er nicht kann — berechnete Schlüsselnamen, eine Verbreitung aus einer Variablen ohne
Typangabe, ein Rumpf aus einem Funktionsaufruf —, kommt als **unaufgelöst** heraus und macht den
Lauf rot. Nicht, weil der Aufruf falsch wäre, sondern weil niemand mehr sagen kann, ob er richtig
ist. Der Auftrag verlangte genau das: lieber sagen, dass ein Aufruf sich nicht zuordnen lässt, als
ihn stillschweigend zu überspringen. Heute ist die Zahl null.

Der zweite benannte Fleck ist die **eine** gelesene Datei. Diese Beschränkung ist nur so viel wert
wie die Zusicherung, dass es keine zweite Stelle gibt, die den Dienst anruft — also wird sie
gemessen und nicht geglaubt: `fetch` steht nur in `api/client.ts`, `request(` nur in
`api/endpoints.ts`, über alle 82 Quelldateien der Oberfläche. Baut jemand einen zweiten Weg, wird
der Lauf rot, und die richtige Antwort ist dann, ihn aufzunehmen, nicht die Probe zu lockern.

Was der Lauf **nicht** misst, sind Werte: dass `stopRunning` da ist, nicht dass ein Wahrheitswert
darin steht. Das steht im Kopf des Skripts, damit niemand mehr von ihm erwartet.

**3 — Er hat sofort etwas gefunden, und es war die dritte Sorte desselben Fehlers.**

`POST /todo-statuses`: Die Oberfläche sendet `{ name, color }`, das Schema war `{ name, position }`.
Zod streift ab, kein 422, keine Farbe, keine Meldung. Bemerkenswert ist das Datum: Genau dieses
`color` steht schon im Bericht zu **T-039** — dort als Feld, das die *Beschreibung* führte und der
Dienst nicht las. Die Antwort war damals, es aus der Beschreibung zu streichen. Dass zugleich die
*Oberfläche* es sendete, hat niemand gesehen, weil niemand danach gesehen hat. Derselbe blinde
Fleck wie bei `neuerParentId`, nur zwölf Aufgaben früher.

Von den beiden möglichen Antworten habe ich die genommen, die mir offensteht und die auch
fachlich die bessere ist: **Die Route nimmt es an.** Farbe war das einzige Feld einer Spalte, das
sich nur in einem zweiten Schritt setzen ließ. Der Weg geht durch alle Schichten — Schema,
Anwendungsfall, Port, Repository, Beschreibung. `TodoStatusPort.create` bekommt `color` **hinter**
`now` und weglassbar; das ist nicht die schönste Stelle, aber sie bricht keinen der dreizehn
vorhandenen Aufrufer in `packages/storage/test/**`, die mir nicht gehören.

Und weil ein abgestreifter Schlüssel in einer Gestaltprüfung wie ein Erfolg aussieht — die Antwort
trägt dann `color: null`, und `null` ist erlaubt —, legt der Durchlauf in `service-scenario.mjs`
die Spalte jetzt mit einer erkennbaren Farbe an, und `proof:openapi` sieht in der Antwort nach
genau diesem Wert. Gegenprobe gemacht: Nimmt man `color` aus `statusCreateSchema` heraus, wird der
Lauf an zwei Stellen rot (`beschrieben, aber nicht gelesen: color` und `geliefert null`).

**4 — Der Prüfer prüft sich selbst, bei jedem Lauf.**

Die Gegenprobe verlangt, einen der drei Namen wieder einzusetzen. Sie darf aber nicht einmalig
sein, und `apps/web/src/api/endpoints.ts` darf ich nicht schreiben. Beides ist gelöst, indem die
Gegenprobe **im Lauf selbst** steht: Abschnitt 6 nimmt den echten Text der echten Datei, setzt
darin — im Arbeitsspeicher — `neuerParentId`, `reihenfolge` und `nurOffene` wieder ein, dazu einen
erfundenen Pfad, und verlangt für jeden **genau eine** neue Beanstandung. Gemessen wird der
Zuwachs gegenüber dem unveränderten Text; damit steht die Selbstprobe auch dann noch, wenn die
Datei einmal wirklich einen Fehler hat. Lässt sich eine Ersetzung nicht anwenden, weil jemand die
Stelle umgeschrieben hat, wird der Lauf rot und sagt welche — eine Selbstprobe, die ins Leere
greift, ist keine.

Der Wortlaut jedes Befundes steht in der Ausgabe, nicht nur der Haken:

```
6  Der Prüfer prüft sich selbst — mit den drei Namen aus T-050
  ok    `neuerParentId` statt `newParentId` (S-08 konnte keinen Ordner verschieben) wird gefunden
        → moveTagFolder (Zeile 253) → moveTagFolder: sendet „neuerParentId", gelesen werden newParentId
  ok    `reihenfolge` statt `order` (die Pfeile der Spaltenverwaltung wirkten nie) wird gefunden
        → reorderTodoStatuses (Zeile 188) → reorderTodoStatuses: sendet „reihenfolge", gelesen werden order
  ok    `nurOffene` statt `includeCompleted` (still wirkungslos) wird gefunden
        → listPoolTodos (Zeile 293) → listPoolTodos: sendet „?nurOffene", beschrieben sind cursor/limit/includeCompleted
  ok    ein Weg, den es nicht gibt wird gefunden
        → getTagTree (Zeile 200): ruft „GET /tag-baum" an — diese Operation gibt es nicht
  ok    der unveränderte Text ergibt keine einzige Beanstandung
```

Alle drei Namen aus T-050 werden gefunden, ohne einen Browser zu starten. Die Einschätzung des
frontend-dev stimmt.

**Dazu die zweite Gegenprobe, von der anderen Seite und am ganzen Lauf.** Weil ich die Datei der
Oberfläche nicht anfassen darf, habe ich denselben Fehler dort erzeugt, wo er mir gehört: in
`folderMoveSchema` das Feld auf `neuerParentId` umbenannt. Derselbe Fehler, nur von der
Dienstseite. Ergebnis (Auszug, `4 fehlgeschlagen`, Exitcode 1):

```
3  Die Rümpfe: jeder gesendete Schlüssel wird auch gelesen
  FEHL  kein Rumpfschlüssel, den die getroffene Route nicht kennt
        — moveTagFolder (Zeile 253) → moveTagFolder: sendet „newParentId", gelesen werden neuerParentId
  FEHL  kein Feld, das der Dienst liest und die Oberfläche unerklärt nie sendet — moveTagFolder.neuerParentId
6  …
  FEHL  `neuerParentId` statt `newParentId` … wird gefunden — nichts beanstandet
  FEHL  der unveränderte Text ergibt keine einzige Beanstandung
```

Zurückgenommen und mit `sha256sum -c` nachgewiesen, dass die Datei byteweise wieder die alte ist.
Dasselbe für die Gegenprobe zur Farbe.

**5 — In der `check`-Kette, nicht daneben.**

`pnpm check` ruft jetzt `typecheck → boundaries → contrast → proof:openapi → proof:callers →
test:coverage → build`. Der Auftrag sagt den Grund besser, als ich es könnte: Ein Nachweis, den man
eigens aufrufen muss, wird derselbe blinde Fleck wie `pnpm contrast` vor T-011.

**6 — Was dieser Lauf strukturell nicht ersetzt.**

Er misst Namen, keine Wirkung. Dass ein Ordner nach dem Verschieben *dort liegt*, misst nur ein
Zug durch die Oberfläche — der Vorschlag des frontend-dev an den e2e-tester (T-050 Punkt 8) bleibt
gültig und wird durch T-051 nicht erledigt. Er misst außerdem nur die Oberfläche; das Add-in hat
mit `proof:addin-wiring` einen eigenen Pfad, dessen Aufruferseite ich nicht angesehen habe.

---

Abweichungen:

**1 — `TodoStatusPort.create` bekommt den neuen Parameter hinter `now`.** Die Reihenfolge
`(name, position, now, color?)` ist nicht die, die man neu schreiben würde; naheliegender wäre
`create(fields, now)` wie bei `todos.create`. Der Grund ist Dateihoheit: Dreizehn Aufrufe stehen in
`packages/storage/test/**`, das mir nicht gehört, und jede andere Form hätte den Typecheck dort
gebrochen. Ein Umbau der Signatur gehört in eine Aufgabe, die die Tests mitnehmen darf.

**2 — Ich habe zwei Dateien vorübergehend verändert, um die Prüfer zu prüfen** (Punkt 3 und 4),
beide in meiner Hoheit, beide byteweise zurückgenommen und per Prüfsumme nachgewiesen. Ein Prüfer,
den niemand hat scheitern sehen, ist kein Nachweis, sondern eine Behauptung.

---

Prüfungen:

```
pnpm check          Exitcode 0
                    typecheck: 8 Projekte fehlerfrei
                    boundaries: fehlerfrei
                    contrast: 0 von 332 Paaren durchgefallen
                    proof:openapi: 46 bestanden, 0 fehlgeschlagen  (45 vorher, +1 für die Farbe)
                    proof:callers: 18 bestanden, 0 fehlgeschlagen  (NEU)
                    test:coverage: 34 Dateien, 556 Tests, alle grün
                                   Statements 92,4 % · Branches 84,48 % · Functions 95,95 %
                    build: alle Pakete
```

Die übrigen Nachweispfade, die nicht in der Kette stehen, nach den Änderungen an Route, Port und
Repository einzeln gefahren:

```
proof:access           75 bestanden, 0 fehlgeschlagen
proof:export           97 bestanden, 0 fehlgeschlagen
proof:export-api       69 bestanden, 0 fehlgeschlagen
proof:taskpane         25 bestanden, 0 fehlgeschlagen
proof:addin-wiring     32 bestanden, 0 fehlgeschlagen
proof:route-policy     40 bestanden, 0 fehlgeschlagen
proof:template-fields  30 bestanden, 0 fehlgeschlagen
proof:db-permissions   17 bestanden, 0 fehlgeschlagen
```

Gegenproben (jeweils zurückgenommen, Prüfsumme geprüft):

```
folderMoveSchema → `neuerParentId`     proof:callers 14 bestanden, 4 fehlgeschlagen, Exitcode 1
statusCreateSchema ohne `color`        proof:openapi 44 bestanden, 2 fehlgeschlagen, Exitcode 1
```

---

Offene Fragen:

**1 — `PoolWrite` kennt kein `position`: Absicht oder Rest?** (T-050 Punkt 7b, hier nachgemessen.)
`poolCreateSchema` und `poolUpdateSchema` führen `position`, `apps/web/src/api/types.ts` nicht.
Jeder neue Pool entsteht damit auf 0, und die Reihenfolge der Pools ist aus der Anwendung heraus
nicht einstellbar. **Ich habe es nicht geändert**, weil die Änderung in `apps/web` läge und weil
die Frage keine technische ist, sondern eine fachliche: Sollen Pools überhaupt sortierbar sein? In
`docs/spec.md` finde ich dazu nichts; A-3.* sagt über eine Reihenfolge der Pools nichts. Die
Möglichkeit steht seit T-021 im Dienst und ist nie benutzt worden.

Bis zur Entscheidung steht sie namentlich in `proof-callers.mjs` unter `NEVER_SENT`, mit
Begründung — ein Feld, das der Dienst liest und die Oberfläche nie sendet, wird sonst rot. Kommt
ein weiteres dazu, wird es rot, und jemand muss es benennen. Zwei mögliche Ausgänge:
*(a)* `PoolWrite` bekommt `position?: number` und S-09 eine Sortierung (Aufgabe für frontend-dev),
*(b)* `position` fällt aus beiden Schemata und aus der Beschreibung (Aufgabe für mich, kleiner).
Ich rate zu (a) oder zum bewussten Stehenlassen; (b) wäre die einzige Variante, die etwas
wegnimmt.

**2 — `README.md` führt „zehn Nachweispfade"; es sind jetzt elf.** Die Datei gehört mir nicht.
Vorschlag für den Zuständigen: `proof:callers` in die Aufzählung unter „Prüfen" aufnehmen und den
Satz über `pnpm check` um den Abgleich der Aufrufer ergänzen. Der Text nennt heute
„Abgleich der OpenAPI-Beschreibung des lokalen Dienstes gegen sein tatsächliches Verhalten" —
dazu käme „und der Aufrufe der Oberfläche gegen die Routenschemata".

**3 — Die Aufruferseite des Add-ins ist ungeprüft.** `apps/outlook-addin` ruft `/addin/*` an;
`proof:addin-wiring` prüft die Verdrahtung, aber nicht die gesendeten Schlüssel gegen
`routes/addin/schema.ts`. Der Leser aus `caller-scan.mjs` ist dafür brauchbar, wenn das Add-in
seine Aufrufe ähnlich bündelt. Ich habe es nicht angefasst: `apps/outlook-addin/**` und
`apps/local-api/src/routes/addin/**` gehören dem integration-dev. Der Aufwand wäre klein, der
mögliche Fund derselbe wie hier — und das Add-in schreibt Zeit, an der Geld hängt.

**4 — Ein grüner `proof:callers` sagt nichts über Wirkung.** Er hätte alle drei Namen aus T-050
gefunden, aber er hätte nicht gemerkt, wenn `moveTagFolder` den richtigen Schlüssel mit dem
falschen *Wert* schickt. Der fehlende gelingende Ordnerzug durch die Oberfläche (T-050 Punkt 8,
e2e-tester) bleibt offen und wird durch diese Aufgabe nicht ersetzt.
