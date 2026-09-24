# T-239 — O-BB und O-AY: erst nachgemessen, dann einer davon gebaut

Aufgabe: T-239 (Welle AL) — O-BB (`REQUEST_SCHEMAS` an der Tür) und O-AY (Herkunftswächter
sucht eine Zahl statt ihrer Bedeutung)
Status: fertig

## Der erste Schritt war nachmessen — und er hat einen der beiden Punkte erledigt

**O-BB ist bereits gebaut, in T-149.** Nicht angefaßt.

| Was | Fundstelle |
|---|---|
| Die Aufstellung an der Tür | `apps/local-api/src/routes/addin/schema.ts:435` — `export const REQUEST_SCHEMAS = Object.freeze({ createAddinTodo, createAddinTimeEntry })` |
| Die Wache dazu, **beide Richtungen** | `apps/outlook-addin/scripts/proof-addin.mjs`, `check('O-BB: jede beschriebene Add-in-Route mit Rumpf hat ein Schema an der Tür')` |
| Der Riegel gegen den leeren Sammler (E-094 Punkt 3) | dieselbe Prüfung: `assert.ok(mitRumpf.length >= 2, 'nur … Add-in-Rümpfe — der Leser greift ins Leere')` — schärfer als „nicht null" |
| Identität statt Ähnlichkeit | `assert.equal(ADDIN_REQUEST_SCHEMAS.createAddinTodo, addinCreateTodoSchema)` und dasselbe für `createAddinTimeEntry` |

Beide von der Aufgabe verlangten Richtungen stehen dort schon: `deepEqual([...mitRumpf].sort(),
Object.keys(ADDIN_REQUEST_SCHEMAS).sort())` wird rot, wenn ein Endpunkt ohne Schema **oder** ein
Schema ohne Endpunkt bleibt.

**Auch die Folgezeile O-CE ist erledigt**, in T-159: `apps/local-api/scripts/proof-openapi.mjs:100`
importiert `REQUEST_SCHEMAS as ADDIN_SCHEMAS`, Zeile 393 setzt `...ADDIN_SCHEMAS`, und der falsche
Kommentar ist berichtigt. Damit war der eine Vermerk, der noch **falsch** war, ausgerechnet der in
meiner eigenen Datei: `routes/addin/schema.ts` behauptete weiter, `proof:openapi` führe „daneben
weiterhin zwei Einzelimporte" und der Vermerk dort stimme nicht mehr. Das ist berichtigt — dieselbe
Klasse Befund, gegen die O-BB geschrieben war (eine Aussage, die von der Sache abgelaufen ist, auf
die sie zeigt).

## O-AY — die Entscheidung ist **schärfen**, und hier ist die Zahl dazu

Gemessen im heutigen Quellbaum des Aufgabenbereichs (32 `.ts`/`.tsx`-Dateien):

| Größe | Zahl |
|---|---|
| Freistehende Vorkommen der Zahl `500` | **8** (auf 7 Zeilen; `office/mail.ts` trägt „hier 500, dort 500") |
| davon meinen den Titeldeckel | **7** — `text/cut.ts` (4), `office/mail.ts` (3) |
| davon meinen einen **HTTP-Statuscode** | **1** — `api/client.ts:47`, „Alles Übrige, einschließlich 500." |
| davon sieht der Wächter heute | **0** — alle acht stehen in Kommentaren, `sourceWithoutComments` streicht sie |

Die 1 von 8 ist nicht der tragende Teil der Begründung. Der tragende Teil ist, **wo** sie steht:
116 Zeilen unter jenem Kommentar läuft in `api/client.ts:163-167` bereits eine Statusleiter **im
Code** — `401`, `403`, `404`, `422`, `400` —, und ihre sechste Sprosse ist im Kommentar oben schon
angekündigt. Der Fehlalarm ist damit keine Möglichkeit, sondern eine terminierte Sache: Wer
`if (status >= 500) …` ergänzt, tut das Richtige und bekommt einen roten Lauf, der ihm etwas über
den Titeldeckel erzählt.

Hinnehmen hieße: der nächste, der diese Leiter erweitert, findet einen Wächter, der ohne Grund rot
ist. Ein falscher Alarm ist teurer als ein fehlender, weil er abgeschaltet wird und danach nichts
mehr misst. Also: schärfen, die Ausnahme eng halten, und die Ausnahme **selbst messen**.

### Was gebaut wurde

`apps/outlook-addin/scripts/proof-addin.mjs`: neue reine Funktion `traegerStellen(quelltext, wert)`.
Sie liefert die Stellen, an denen ein Quelltext die Zahl **selbst trägt**, und nimmt genau zwei
Formen aus, in denen sie nachweislich einen HTTP-Status meint:

1. **Vergleich** — die andere Seite ist ein statusartiger Name: `status`, `statusCode`,
   `httpStatus`, `response.status`, `antwort.statusCode`; in beiden Leserichtungen und über acht
   Operatoren.
2. **`case 500:`** — aber **nur** unter einem `switch`, dessen Kopf über einen statusartigen Wert
   entscheidet. Ohne diese Bedingung wäre die Ausnahme ein Loch: Jeder Deckel unter einem
   beliebigen `case` liefe hindurch.

Nicht ausgenommen und weiter rot: die Zahl in einer Zeichenkette (`'HTTP 500'`) und ein `case` an
einem Schalter, der über etwas anderes entscheidet. Beides kommt heute nicht vor; es steht im
Quelltext, damit der nächste Leser die **Grenze** der Ausnahme kennt, statt sie zu erraten.

Dazu, wie verlangt: der Riegel gegen den leeren Sammler. `assert.ok(durchsucht.length > 15, …)` —
findet der Dateisammler zu wenige TypeScript-Dateien, ist der Lauf rot und nicht `ok`. Und die
Meldung nennt jetzt die **Zeile** statt nur der Datei und sagt ausdrücklich, dass ein Statuscode
schon ausgenommen ist — „diese Zeile hier abzuschalten ist nicht der nächste Schritt".

### Gegenprobe, beide Richtungen, plus die Mutation am echten Baum

Neue Prüfung `O-AY, Gegenprobe: der Wächter beißt weiter — und nicht mehr in den Statuscode`:

* **Richtung A**, sieben Bauarten, in denen eine zweite Fassung des Deckels entstünde
  (`const … = 500`, `.slice(0, 500)`, `.max(500)`, `length > 500`, `suggestTitle(text, 500)`,
  `[500, 64]`) — jede muss gefunden werden.
* **Richtung B**, sechs Schreibweisen des Statuscodes — keine darf rot machen.
* **Richtung C**, die Ausnahme ist kein Loch: `case 500` unter `switch (modus)` bleibt rot, und ein
  Deckel in derselben Zeile wie ein Status (`if (status === 404) { const deckel = 500; }`) bleibt rot.
* Selbstprobe: das Muster wird aus `DOMAENE_MAX_TITEL` **erzeugt**; `501` ist kein Träger.

Und weil eine Prüfung gegen erfundene Zeichenketten nur die Funktion misst, nicht den Baum, beides
am **echten** Baum mutiert:

| Mutation | alter Wächter | neuer Wächter |
|---|---|---|
| `if (status >= 500) return 'failed';` in `api/client.ts` (die sechste Sprosse) | **ROT** — `Träger: ["api/client.ts"]` | **grün**, 229/0 |
| `export const MAX_TITLE_CHARACTERS_LOKAL = 500;` in `text/cut.ts` | rot | **ROT**, und nennt die Zeile |

Beide Mutationen sind zurückgenommen; `git status` über `apps/outlook-addin/src` ist leer.

## Läufe

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm run proof:addin` | 228 bestanden, 0 fehlgeschlagen | **229 bestanden, 0 fehlgeschlagen** |
| `pnpm typecheck` | — | **0 Fehler** |
| `pnpm test` | — | **77 Dateien, 1464 bestanden** |
| `pnpm run boundaries` | — | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run proof:openapi` (weil ich `routes/addin/schema.ts` angefaßt habe) | — | 114 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:taskpane` | **nicht gefahren** | **nicht gefahren** |

`proof:taskpane` **bindet einen Port**: `apps/local-api/scripts/proof-taskpane.mjs:57` setzt
`const PORT = 17944;` und `startTaskpaneServer` hört darauf. Wie angewiesen nicht gefahren.
`proof:addin` bindet keinen — er läuft gegen `openDatabase({ location: ':memory:' })` und
`mountAddinRoutes(deps)` im selben Prozess. `proof:all` wurde nicht gefahren (E-083 Punkt 3).

## Suchregel eingehalten

`git grep` **und** ein roher Lauf über `apps/*/src`, `packages/*/src`, `apps/*/scripts`, `tests/`,
Bauergebnisse ausgeschlossen (`apps/desktop/src-tauri/taskpane/` nicht durchsucht). Beide Läufe
ergaben dieselben 7 Zeilen; `git status --untracked-files=all` über `apps/outlook-addin/src`,
`packages/export/src` und `apps/local-api/src/routes/addin` meldete **keine** unversionierte
Quelldatei — heute deckt sich `git grep` mit dem Arbeitsbaum, was es nicht immer tut und deshalb
gemessen und nicht angenommen wurde.

## Artefakte

* `apps/outlook-addin/scripts/proof-addin.mjs` — `traegerStellen`, `zeileUm`, `STATUS_NAME`,
  `STATUS_OPERATOR`; Teil 1 des Herkunftswächters geschärft; neue Gegenprobe; Riegel gegen den
  leeren Sammler
* `apps/local-api/src/routes/addin/schema.ts` — nur Begründungstext: der Vermerk über
  `proof:openapi` war seit T-159 falsch

## Annahmen

* Die Ausnahme deckt **nur** den HTTP-Status, und nur in Vergleichs- und `case`-Form. Ich habe die
  Zahl in Zeichenketten bewusst **nicht** ausgenommen: Zeichenkettenerkennung per regulärem
  Ausdruck (Schablonen, Maskierungen) ist selbst fehleranfällig, der Fall kommt heute nicht vor,
  und ein Wächter mit einem Fehler in seiner eigenen Ausnahme ist schlimmer als einer mit einer
  bekannten, benannten Kante.
* „Statusartig" heißt: der Bezeichner endet auf `status`/`Status`/`statusCode`/`StatusCode`,
  gegebenenfalls hinter genau einem Punktzugriff. Ein `const meinStatus = 500;` (Zuweisung ohne
  Vergleich) bleibt rot — das ist Absicht, denn eine benannte Zahl ohne Vergleich ist von einer
  zweiten Fassung des Deckels nicht zu unterscheiden.
* O-BB und O-CE habe ich als erledigt **stehengelassen** statt neu zu bauen.

## Risiken

* Die Ausnahme ist eine Aufweichung. Sie ist eng, gegengeprüft und in drei Richtungen gemessen,
  aber sie ist eine: Ein Deckel, den jemand als `if (status === 500)` tarnte, liefe hindurch. Das
  ist mutwillig und nicht die Klasse Fehler, gegen die dieser Wächter steht.
* Dieselbe Bauart (roher Zahlenvergleich über den Quelltext) steht an mindestens einer weiteren
  Stelle in `proof-addin.mjs` (Abschnitt um Zeile 4599, `const traeger = files…`). Ich habe sie
  **nicht** angefaßt, weil ihre Zahl eine andere ist und der Auftrag O-AY hieß. Siehe „Nächster
  Schritt".
* Keine echten Call-Nummern, Kundennamen oder Zugangsdaten hinzugefügt; die Gegenprobe arbeitet mit
  erfundenen Quelltextschnipseln.

## Offene Fragen

1. **O-BB und O-CE sind erledigt und ihre Boardzeilen sagen es nicht.** Beide stehen weiter als
   offene Punkte (`board.md:1060` und `:1070`). Genau die Klasse, die in dieser Welle zweimal eine
   Aufgabe gekostet hat. Bitte streichen — Belege oben.
2. Soll die zweite Stelle derselben Bauart (`proof-addin.mjs` um Zeile 4599) dieselbe Behandlung
   bekommen? Ich habe sie gefunden, aber nicht gemessen, welche Zahl sie sucht und wie viele
   fremde Bedeutungen die im Baum hat. Das ist eine eigene Messung, keine Nebensache.
3. `proof:taskpane` steht als Nachweis in meinem Auftrag, bindet aber Port 17944 und ist damit
   nicht ohne Absprache mit domain-dev fahrbar. Soll er künftig aus meiner Nachweisliste heraus,
   oder wird er in einer Welle ohne portgebundene Läufe nachgeholt?

## Nächster Schritt

Boardzeilen O-BB und O-CE streichen (Frage 1). Danach die zweite Stelle derselben Bauart in
`proof-addin.mjs` **erst messen** — welche Zahl, wie viele Vorkommen, wie viele davon meinen die
Grenze — und dann entscheiden, statt sie aus Symmetrie mitzuschärfen.
