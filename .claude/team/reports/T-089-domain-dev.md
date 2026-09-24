Aufgabe: T-089 — Reparatur nach Review (R-1, R-3) und E-058 Teil 1 und 2

Status: braucht Review

**Der Baum in einem Satz.** Alle acht Befunde sind behoben, E-058 Teil 1 und 2 stehen, und
`pnpm run typecheck` (einschließlich `typecheck:test`), `boundaries`, `proof:openapi` (jetzt
**93** statt 81), `proof:conflicts` (149), `proof:callers` (18), `proof:tags` (42) und
`pnpm run test` (37 Dateien, **595** Fälle) sind grün — ebenso die übrigen acht Nachweispfade,
die ich zur Sicherheit mitgelaufen bin. Keine einzige Prüfung in fremder Hoheit ist rot geworden.
Neu ist eine **Migration 0012**; die Reihenfolge gehört dir, deshalb steht sie unter „Offene
Fragen" als erster Punkt.

---

Artefakte:

Neu:

```
packages/domain/src/pool-movement.ts            `PoolMovement`, `PoolMovementTense`,
                                                `PoolMovementOccasion`, `poolMovementSentence`
                                                (E-058 Teil 2). Ohne einen einzigen Import.
apps/local-api/src/usecases/pool-movement.ts    `PoolMovementState`, `PoolMovementStates`,
                                                `PoolMovementUnit`, `PoolMovementNamer`,
                                                `poolMovementNamer` (E-058 Teil 1)
packages/storage/migrations/0012_pool_rule_restrict.up.sql
packages/storage/migrations/0012_pool_rule_restrict.down.sql
```

Geändert:

```
packages/domain/src/board.ts              `BoardColumnRule extends MatchesPoolRule` statt einer
                                          eigenen Achsenliste; `boardAppearances` trennt die
                                          Regelseite ab und reicht sie geschlossen weiter
packages/domain/src/tag.ts                Laufzeitwache in `matchesPool` gegen ein fehlendes
                                          `unresolvedRequired`; der Kommentar an `PoolRuleAxes`
                                          sagt jetzt, wie weit „jede dieser Stellen wird rot"
                                          wirklich reicht
packages/domain/src/index.ts              das neue Modul am Domänen-Einstieg
packages/domain/scripts/check-export-boundary.mjs
                                          zwei Untergrenzen und ein `fail` statt eines `note`,
                                          wenn `packages/export` fehlt
packages/storage/src/sqlite/repo-tags.ts  `TagFolderPort.remove` prüft die Verwendung in
                                          `pool_rule` und nennt die Regeln beim Namen
packages/storage/src/sqlite/repo-statuses.ts
                                          derselbe Zusatz für `status_in_use` (R-3 H-2)
packages/storage/src/sqlite/mappers.ts    `poolReference` — eine Regel als Feldangabe in
                                          `details`, von beiden Stellen benutzt
packages/storage/src/ports.ts             `TagFolderPort.remove` kann `tag_in_use`; die
                                          Begründung an `resolveRule`/`resolveExcluded` ist
                                          richtiggestellt (O-I)
packages/storage/src/sqlite/migrations.embedded.ts
                                          **erzeugt**, `migrations:embed`, 24 Dateien
apps/local-api/src/routes/todos.ts        die drei Kennungslisten gehen durch ein Schema (S-2)
apps/local-api/src/http/input.ts          `commaSeparatedIds` und `patchOf`
apps/local-api/src/routes/structure.ts    `POST /pools` reicht den geprüften Rumpf als Ganzes
                                          durch; `poolTerms`/`poolStatusIds` statt `as never`
apps/local-api/src/usecases/timer.ts      `StartTimerResult.poolMovement`, `movementOfStart`
apps/local-api/openapi/takt-local-api.yaml
                                          `PoolMovement`-Schema, `poolMovement` an der 201 von
                                          `POST /timer/start`, vierter Grund für
                                          `status_in_use`, zweiter Grund für `deleteTagFolder`
apps/local-api/scripts/service-scenario.mjs
                                          Spalte `openOnly`, zwei Timerstarts, ein Löschversuch
                                          auf dem leeren Ordner in einer Regel
apps/local-api/scripts/proof-openapi.mjs  Abschnitt 15, zwölf Prüfungen
docs/architektur.md                       Domänentabelle, Begründung, 409-Liste
docs/datenmodell.md                       3.3 (Löschordnung eines Ordners), 3.4 (fünfter Grund
                                          beim Status), 3.5 (alle drei RESTRICT), 8.4g, 8.5
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
`packages/export/**`, `packages/*/test/**`, `tests/e2e/**`. Die Änderungen, die `git status` dort
zeigt, sind die parallele Arbeit von T-090 und des frontend-dev im selben Baum.

---

## 1. R-1 Befund 1 — der leere Ordner in einer Regel (blockierend)

Der Befund stimmt Wort für Wort. Ich habe ihn an einer frischen Datei nachgestellt, bevor ich
etwas geändert habe: Die Regel „Ordner Ost **und** Status offen" verliert beim Löschen von Ost
ihren Term und heißt danach „Status offen" — sie trifft **mehr**.

**Die Entscheidung zur Frage, die du gestellt hast: beides, nach dem Muster von `status_id`.**

Das Muster aus Migration 0011 ist nicht „RESTRICT **oder** Wache im Adapter", sondern beides mit
einer Rollenteilung, und der Kommentar in `repo-statuses.ts` schreibt sie aus: „bei den Status
weist auch die Datenbank ab, und diese Prüfung nimmt ihr nur das Wort aus dem Mund". Die Wache im
Adapter liefert den fachlichen Satz; die Datenbank sorgt dafür, dass ein zweiter Schreibpfad, den
es heute nicht gibt, nicht still gehorcht. Genau der Fall ist eingetreten: Bei den Tags war die
Prüfung im Adapter die **einzige** Wache, und beim Ordner hat sie zwei Jahre lang gefehlt, ohne
dass irgendetwas es gemerkt hätte.

Deshalb **Migration 0012**: `pool_rule.tag_id` und `pool_rule.folder_id` gehen von
ON DELETE CASCADE auf **RESTRICT**. Damit verhalten sich alle drei Termspalten gleich; nur
`pool_id` kaskadiert weiter, und das ist richtig — ein Term ohne Regel ist kein Datensatz.
`tag_id` habe ich mitgenommen, obwohl der Befund nur den Ordner nennt: Die Begründung in 0011
gilt dort wörtlich genauso, und eine Tabelle, in der zwei von drei gleichartigen Spalten
gegenteilig reagieren, ist die Sorte Ungleichheit, aus der der nächste Befund entsteht.

**Der Fehlerschlüssel ist `tag_in_use`**, wie R-1 vorgeschlagen hat, mit dem Satz „Dieser Ordner
wird in der Regel eines Pools verwendet." Ein eigener Schlüssel wäre genauer, aber er wäre der
vierte Zweig für dieselbe Handlung: Der Aufrufer muss den Ordner irgendwo herausnehmen, und das
gilt für Tag und Ordner gleichermaßen. `tag_in_use` trägt heute schon drei verschiedene Gründe.
Welches Ding gemeint ist, sagt die Route.

**Die Regel steht mit Namen in der Antwort** — und das ist der Teil, der über R-1 hinausgeht und
zugleich R-3 H-2 erledigt. Beide Sperren (`tag_in_use` am Ordner, `status_in_use` am Status)
liefern jetzt `details`, je betroffener Regel einen Eintrag:

```
{ "field": "<Kennung des Pools>", "code": "pool_rule", "message": "Regel „Wartung Nord“" }
```

**Warum die Kennung in `field` steht** — das ist eine Entscheidung und keine Selbstverständlichkeit.
`TaktFieldError` hat drei Felder, und bei einer Löschanfrage gibt es kein Eingabefeld, dem etwas
vorzuwerfen wäre; die Anfrage besteht aus einem Pfadbestandteil. `field` ist damit der einzige
Platz in der Hülle, der eine maschinenlesbare Angabe tragen kann, und die Oberfläche braucht genau
sie: Sie soll dorthin verweisen können, wo der Benutzer den Term herausnimmt. Der Vertrag steht so
im Quelltext (`mappers.ts`, `poolReference`), an beiden Ports und in der
Schnittstellenbeschreibung. Ein Aufrufer liest `details.filter((d) => d.code === 'pool_rule')`.

Gemessen im Nachweispfad (Abschnitt 15, drei Prüfungen): 409 mit `tag_in_use`, mindestens ein
Eintrag mit nicht leerer Kennung, und der Name einer bekannten Spalte im Text. Dazu die
Gegenprobe, ohne die die Sperre auch an einer Fassung grün wäre, die **jeden** Ordner sperrt: Ein
Ordner ohne Regel und ohne Inhalt wird weiterhin mit 204 gelöscht.

**Die Gegenprobe zur Behebung.** Ich habe die neue Wache abgeschaltet (`if (false && …)`) und den
Nachweispfad laufen lassen:

```
FEHL  ein Ordner, den eine Regel nennt, wird mit 409 `tag_in_use` abgewiesen — — null
FEHL  die Abweisung nennt die Regeln beim Namen und mit Kennung (0) — []
FEHL  jeder gelieferte Statuscode ist beschrieben (105 Aufrufe)
```

Die dritte Zeile ist die interessante: Ohne die Wache im Adapter greift die Datenbank, und der
durchgerutschte Fremdschlüsselfehler kommt als Statuscode heraus, den die Beschreibung an dieser
Route nicht führt. Beide Schichten sind also einzeln messbar da.

---

## 2. R-3 S-1 — der Wächter über null Dateien

Zwei Untergrenzen, gebaut wie `routes.length >= 60` in `proof:route-policy`:
`packages/export/src` hat mindestens **eine** Quelldatei, der Tiefenzugriffslauf mindestens
**fünfzig**. Die Zahlen liegen weit unter dem Bestand (8 und 302); sie sollen den Wegfall fangen,
nicht das Wachstum bremsen.

Dazu ein dritter Punkt, den R-3 nicht genannt hat: `checkExportPackage` meldete ein fehlendes
`packages/export` als `note` mit dem Text „existiert noch nicht (T-007)". Das war 2026 in Ordnung,
seit T-007 ist es die Beschreibung eines Zustands, den es nicht mehr geben darf — und es ist
derselbe stille Ausgang wie die null Dateien, nur eine Ebene höher. Jetzt `fail`.

---

## 3. R-3 S-2 — `poolId` ohne Prüfung und ohne Zahl

`commaSeparatedIds` in `http/input.ts`: `z.preprocess(split, z.array(idSchema).min(1).max(50))`,
angewandt auf `poolId`, `statusId` und `tagId` in einem gemeinsamen Objektschema. Fehlschlag ist
422 mit Feldangabe.

**Die Grenze 50, begründet.** Sie liegt über jedem Arbeitsablauf und weit unter der Schwelle, an
der die Antwort teuer wird. Darüber: Die Kennungen kommen aus einer Auswahl, nicht aus einem
Eingabefeld; fünfzig gleichzeitig gewählte Pools sind kein Filter mehr, sondern eine Liste ohne
Filter, und fünfzig Status gibt es in keinem Bestand. Dieselbe Zahl steht mit derselben Begründung
schon bei `tagNames` beim Anlegen. Darunter: R-3 hat 8 370 ms bei 200 Poolkennungen gemessen; bei
50 bleibt davon rund ein Viertel, und die 500 aus `SQLITE_MAX_EXPR_DEPTH` (ab 1 000) ist um den
Faktor 20 außer Reichweite. Aus dem 500 wird damit ein 422 — der Aufrufer erfährt, dass **er** zu
viel verlangt hat.

`.min(1)` je Liste ist Absicht: `?poolId=` allein ergäbe sonst eine Liste mit einer leeren
Kennung, die nichts trifft und trotzdem eine Abfrage kostet. Die Oberfläche schickt so etwas nicht
— `queryString` in `apps/web/src/api/client.ts` lässt leere Werte und leere Listen weg —, ich habe
nachgesehen, bevor ich die Grenze gesetzt habe.

---

## 4. R-1 — die Wache gegen die sechste Achse (`board.ts:86`)

Du hast eine Lösung bevorzugt, die die Signatur von `matchesPool` **nicht** bricht. Die gibt es,
und sie ist die einfachere von beiden: `BoardColumnRule extends MatchesPoolRule`.

Der Typ zählte die Achsen als eigene, freiwillige Felder auf und war damit ein zweites,
unabhängiges Abbild — eines, das nicht mitwächst. Jetzt **ist** die Regelseite einer Spalte die
Regelseite von `matchesPool`. Übrig bleiben zwei Felder, die keine Achsen sind: `columnId` und
`includeCompleted` (die Ansichtseinstellung aus E-039).

`boardAppearances` trennt sie ab und reicht den Rest geschlossen weiter:

```ts
const { columnId, includeCompleted, ...axes } = column;
matchesPool({ ...axes, todoTagIds: card.tagIds, /* die vier Kartenfelder */ });
```

**Warum nicht `...column` mit den beiden Zusatzfeldern darin** — ein Spread gibt sie mit, und
sollte `MatchesPoolRule` je ein Feld gleichen Namens bekommen, ginge die Ansichtseinstellung
stillschweigend als Bedingung durch. So ist `axes` genau die Regelseite: Fehlt darin etwas, sagt
es der Übersetzer.

**Die Signatur von `matchesPool` ist unverändert.** Der integration-dev wird von mir also nicht
rot. Ich habe außerdem nachgesehen, was er in T-090 parallel gebaut hat: `NamedPoolRule` als
`{ [K in keyof MatchesPoolRule]-?: … }` und `list('all')` — dieselbe Wache und dieselbe Flächenwahl,
unabhängig gefunden. Es gibt keinen Widerspruch zwischen unseren Dateien; `pnpm typecheck` läuft
über beide.

Den Kommentar an `PoolRuleAxes` (`tag.ts:538`) habe ich nicht gestrichen, sondern präzisiert: Er
galt für die Stellen, die dieses Gebilde **zusammensetzen**, und nicht für die Aufrufer von
`matchesPool`, die sich ihre Regelseite selbst bauten. Jetzt steht dort, wie weit er reicht, und
die Auflage für den nächsten Aufrufer: erben oder durchreichen, nicht nachbauen.

---

## 5. R-1 — `POST /pools` und `as never`

`POST /pools` reicht den geprüften Rumpf als Ganzes durch (`...parsed.data`), so wie `PATCH` es
seit jeher tat. Eine Achse, die ins Schema und in `PoolInput` kommt, kann hier nicht mehr
vergessen werden.

Die drei markierten Listen stehen daneben, weil das Schema Zeichenketten liefert und die Domäne
markierte Kennungen erwartet:

```ts
const poolTerms = (terms: z.infer<typeof poolTagListSchema>): readonly PoolTagTerm[] => …
const poolStatusIds = (ids: z.infer<typeof poolStatusListSchema>): readonly StatusId[] => …
```

Beide leiten ihren Eingabetyp aus dem Schema ab. Ändert sich die Gestalt von `poolTagListSchema`,
wird die Funktion rot statt von einer Zusicherung überdeckt zu werden — das war der Kern des
Befunds: `as never` schaltet nicht die Markierung, sondern jede Prüfung ab.

Beim `PATCH` kam ein zweites Problem hoch, das das alte `as never` mit verdeckt hatte:
`exactOptionalPropertyTypes` unterscheidet „fehlt" von „ist `undefined`", und Zod liefert für
`.optional()` das zweite. Die Antwort darauf ist `patchOf` in `http/input.ts` — fünf Zeilen, die
Schlüssel mit dem Wert `undefined` weglassen, mit **einer** Zusicherung an einer Stelle statt einer
je Aufrufer. `null` bleibt erhalten: Es ist ein Wert und heißt „setze auf leer".

---

## 6. R-1 — der vierte Grund für `status_in_use` in der Beschreibung

Die Tabelle an `DELETE /todo-statuses/{statusId}` führt jetzt vier Gründe, zwei davon unter
demselben Schlüssel, mit der Begründung dazu (E-054/T-076: eine Spalte ist eine Regel und kann
nach dem Status filtern) und mit dem Hinweis auf `details`. `docs/datenmodell.md` 3.4 zieht nach
und hat jetzt fünf statt vier Punkte in der Löschordnung.

---

## 7. O-I — die Begründung an `resolveRule`/`resolveExcluded`

Richtiggestellt, nicht gestrichen. Dort steht jetzt, dass es in `src` **keinen** Aufrufer mehr
gibt und dass die Prüffälle und die Attrappe im Add-in-Nachweispfad die letzten sind. Die
Streichung selbst zöge zwei Dateien in fremder Hoheit nach; sie steht als Vorschlag unter „Offene
Fragen".

---

## 8. O-L / R-3 H-3 — die Laufzeitwache in `matchesPool`

`matchesPool` wirft jetzt bei `typeof unresolvedRequired !== 'boolean'`. Der Fehlertext nennt das
Feld, E-057 und den Weg zur Antwort (`PoolPort.resolveAxes` mit `tagAxisIsUnresolved`).

Ein Wurf und kein `false`: „diese Regel trifft nichts" wäre eine fachliche Antwort auf eine Frage,
die niemand gestellt hat. Fail-closed ist hier möglich, weil kein zulässiger Aufrufer das Feld
weglassen darf — es ist keine Bedingung, sondern eine Auskunft über eine.

**Alle `.mjs`-Aufrufer geprüft**, nicht nur die in meiner Hoheit. In `apps/local-api/scripts/**`
gibt es keinen einzigen Aufruf von `matchesPool`. In `apps/outlook-addin/scripts/proof-addin.mjs`
gibt es sechs, und alle sechs tragen das Feld seit T-086 — zwei davon mit einem ausgeschriebenen
Kommentar, warum es von Hand dasteht. `proof:addin` läuft mit der Wache auf 131 von 131 durch.

---

## 9. E-058 Teil 1 — `usecases/pool-movement.ts`

`poolMovementNamer(unit)` löst alle Regeln **einmal** auf und liefert eine Funktion, die ein
Zustandspaar auf `{ appears, enters, leaves }` abbildet. Die Bedeutungen sind die aus T-084.

Vier Dinge, die ich so gebaut habe, dass der Add-in-Dienst in Welle B ohne Umbau darauf umstellen
kann:

- **Derselbe Port-Ausschnitt.** `PoolMovementUnit.pools` ist `Pick<PoolPort, 'list' | 'resolveAxes'>`
  — Zeichen für Zeichen der, den `AddinUnit.pools` seit T-086 führt.
- **Dieselben Eingaben.** Das Zustandspaar trägt Tags, Status, `completedAt`, offene und
  exportierte Buchungen; `bookingStates` im Add-in-Dienst baut heute genau dieses Paar.
- **Dieselbe Auflösung**, `unresolvedRequired` über `resolveAxes` und `tagAxisIsUnresolved`,
  termweise gefragt.
- **`list('all')`**, wie E-058 es verlangt — auch reine Board-Spalten.

Die Regelseite steht als `MatchesPoolRule` und nicht ausgeschrieben: dieselbe Wache wie in
`board.ts`.

**Was der Anwendungsfall ausdrücklich nicht tut:** Er entscheidet nicht, was eine Handlung am
Zustand ändert. Ob ein Timerstart „Erledigt" aufhebt, steht in A-2.5 und in `usecases/timer.ts`;
ob eine Buchung „hat offene Buchungen" setzt, in E-032. Wer das Paar bildet, weiß es; wer die
Bewegung ausrechnet, braucht es nicht zu wissen. Das ist der Grund, warum derselbe Anwendungsfall
für den Timerstart und für die Add-in-Buchung taugt.

---

## 10. E-058 — `POST /timer/start` liefert `poolMovement`

`StartTimerResult` trägt `poolMovement: PoolMovement | null`. Die Route musste dafür keine Zeile
ändern; sie reicht `result.value` durch.

**Wann gerechnet wird — und die Antwort auf die Frage, die im Auftrag offenblieb.** „Oder die
erste Buchung entsteht" braucht beim **Start** eine Erklärung, denn ein laufender Timer ist keine
Buchung: Die Abfrage verlangt `ended_at IS NOT NULL`, „ein laufender Timer ist noch nichts, was
man abrechnen könnte". Der Fall tritt trotzdem ein, und zwar genau einmal: wenn der Start mit
`stopRunning` einen laufenden Timer **desselben** Todos beendet. Dann wird aus dem laufenden Timer
eine offene Buchung, und jede Regel mit `exportState: 'open'` nimmt das Todo auf. Erkannt wird das
an `result.value.stopped?.todoId === todoId`.

```
poolMovement != null  ⟺  doneCleared  ∨  (auf diesem Todo gebucht ∧ vorher keine offene Buchung)
```

Sonst `null`. Das ist nicht dasselbe wie drei leere Listen: Das eine heißt „hier war keine Bewegung
möglich", das andere „es wurde nachgesehen". Beide führen zu derselben Anzeige, aber nur das erste
kostet **keine** Ordnerauflösung — im Normalfall wird also nichts aufgelöst.

Der Zustand von vorher wird gelesen, **bevor** `timer.start` schreibt. Danach steht `completed_at`
schon auf `NULL`, und `leaves` wäre für immer leer, ohne dass etwas bricht — die stille
Rückabwicklung von E-056.

**Gemessen** (`proof:openapi` Abschnitt 15, sechs Prüfungen, über die echte Route):

```
Timerstart auf dem erledigten Todo „Akte 4712 — Telefonat"
  leaves   ['Spalte nur über Erledigt']            ← completion: 'done'
  enters   ['Spalte nur über Unerledigt']          ← completion: 'open'
  nirgends 'Spalte über einen leeren Ordner', 'Spalte über einen leeren Ordner und den
           Status', 'Spalte über ein Tag oder einen leeren Ordner'   ← E-057
  enters ⊆ appears, enters ∩ leaves = ∅

derselbe Start auf einem offenen Todo mit Buchungen
  poolMovement  null
```

Die Spalte `completion: 'open'` gab es im Durchlauf noch nicht; ich habe sie angelegt
(`BOARD_COLUMNS.openOnly`). Ohne sie wäre nur das Verschwinden gemessen und das Erscheinen
geraten.

**Gegenprobe der Messung.** Eine Mutation, drei rote Prüfungen:

```
list('all') → list()   FEHL  er **verlässt** die Spalte „Spalte nur über Erledigt" — []
                       FEHL  er **betritt** die Spalte „Spalte nur über Unerledigt" — []
                       FEHL  der Wiederöffnen-Satz nennt beide Richtungen
```

Das ist zugleich der Beleg, dass `list('all')` keine Formsache ist: Beide Spalten tragen
`placement: 'board'`, und mit `list()` sind sie unsichtbar. Es ist R-1 Befund 3, gemessen an der
Timer-Route statt an der Add-in-Route.

---

## 11. E-058 Teil 2 — `poolMovementSentence`

```ts
poolMovementSentence(movement, tense: 'future' | 'past', occasion: 'reopen'): string
poolMovementSentence(movement, tense: 'future' | 'past', occasion: 'booking'): string | null
poolMovementSentence(movement, tense, occasion: PoolMovementOccasion): string | null
```

**Die Signatur ist eine Entscheidung, und hier ist sie begründet.** E-058 nennt
`poolMovementSentence(movement, tense)` und verlangt zugleich, dass beide Sätze erreichbar
bleiben. Beide aus denselben drei Listen abzuleiten geht nicht: Sie unterscheiden sich nicht in
der Formulierung, sondern darin, **welche Liste** sie aufzählen — `appears` beim Wiederöffnen,
`enters` bei der reinen Buchung — und ob es überhaupt etwas zu sagen gibt. Aus
`{appears, enters, leaves}` allein ist nicht zu erkennen, welche der beiden Fragen gestellt wurde.

Also ein drittes Argument, und **ohne Vorgabewert**: Wer schweigt, bekäme sonst einen von zwei
verschiedenen Sätzen, und niemand würde rot. Dieselbe Falle wie bei `unresolvedRequired`, nur
billiger — sie kostet einen falschen Satz statt einer falschen Menge.

Die drei Überladungen sagen dem Aufrufer, was er bekommt: `'reopen'` hat **immer** etwas zu sagen,
auch bei leeren Listen („Auf dieses Todo passt derzeit keine Regel — es erscheint danach in keinem
Pool."); `'booking'` liefert `null`, wenn `enters` und `leaves` leer sind. `null` und nicht der
leere String — ein leerer String ist ein Satz mit null Zeichen, und die Oberfläche baut ihm eine
Zeile. Die dritte Überladung ist für den Aufrufer, der erst zur Laufzeit zwischen den beiden
Anlässen unterscheidet; sie gibt die schwächere Zusage.

**Die eine Änderung gegenüber `reopen.ts`:** „Poolregel" heißt „Regel" (E-058 Absatz 2). Alles
andere ist Wort für Wort übernommen, einschließlich `listPools` und `inPools`. Das ist Absicht:
Die Sätze sind an beiden Flächen erprobt, und eine Verbesserung nebenbei wäre eine Änderung, die
in keiner Entscheidung steht.

Das Modul importiert **nichts**. `check:boundary` ist grün, und das ohne Zutun: Die Datei hängt an
keinem Typ der Domäne, weil sie keinen braucht.

Drei Prüfungen in Abschnitt 15 messen die Funktion, davon zwei rein und eine gegen die Bewegung,
die soeben über die Leitung kam: Der Wiederöffnen-Satz muss beide Spaltennamen enthalten, in
beiden Zeitformen die richtige Einleitung tragen, und der Satz für „keine Regel trifft" muss
zeichengleich der neue sein.

---

## 12. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` (inkl. `typecheck:test`) | grün, alle acht Pakete |
| `pnpm run test` | 37 Dateien, **595** Fälle, grün |
| `pnpm run boundaries` | grün; 8 und 302 Quelldateien geprüft, beide über der Untergrenze |
| `pnpm run proof:openapi` | **93 von 93** (vorher 81; Abschnitt 15 neu mit 12) |
| `pnpm run proof:conflicts` | 149 grün |
| `pnpm run proof:callers` | 18 grün |
| `pnpm run proof:tags` | 42 grün |
| `proof:addin` 131, `proof:access` 75, `proof:route-policy` 40 | grün |
| `proof:export` 97, `proof:export-api` 69, `proof:taskpane` 25 | grün |
| `proof:addin-wiring` 32, `proof:template-fields` 30, `proof:db-permissions` 17 | grün |
| `migrations:embed --check` | aktuell, 24 Dateien |

Migration 0012, an einer Datei im Arbeitsspeicher über den echten Läufer:

| Fall | Ergebnis |
|---|---|
| 0 → 12 vorwärts | 17 Tabellen, 34 benannte Indizes, 17 Trigger, 1 Sicht — Zahl und Namen wie nach 0011 |
| Ordner, Tag und Status je in einer Regel gelöscht | dreimal `FOREIGN KEY constraint failed`, alle drei Terme unversehrt |
| 12 → 11 rückwärts, mit Daten | drei Terme unverändert da, `tag_id`/`folder_id` wieder CASCADE |
| Gegenprobe unmittelbar danach | das Löschen des Ordners geht durch und nimmt seinen Term mit (3 → 2) — der Zustand, gegen den 0012 geschrieben ist |
| 11 → 12 wieder vorwärts | `integrity_check` = ok, `foreign_key_check` leer, 81 Objekte |

---

Annahmen:

1. **`tag_in_use` statt eines eigenen Schlüssels für den Ordner.** R-1 hat ihn vorgeschlagen, und
   der Bestand teilt diesen Schlüssel schon dreifach. Ein `tag_folder_in_use` wäre genauer, aber
   ein vierter Zweig für dieselbe Handlung. Zurücknehmbar, es ist eine Zeile in zwei Dateien plus
   der Beschreibung.
2. **Migration 0012 nimmt `tag_id` mit**, obwohl der Befund nur den Ordner nennt. Begründung oben.
3. **Die Kennung der Regel steht in `field`.** Der Vertrag ist dokumentiert, aber er ist neu — bis
   T-089 war `field` immer der Name eines Eingabefeldes.
4. **Die Grenze für Kennungslisten ist 50** und gilt für alle drei Listen gleich. Eine engere
   Grenze für Ordnerterme (R-3 H-1 schlägt 25 vor) ist damit nicht getroffen; das ist deine
   Entscheidung und eine andere Stelle.
5. **`poolMovement` beim Timerstart, nicht beim Stopp und nicht beim Auflösen einer verwaisten
   Buchung.** E-058 nennt nur den Start. `POST /timer/stop` und
   `POST /timer/orphaned/resolve` erzeugen ebenfalls eine erste Buchung und bewegen damit ebenso —
   sie liefern die Auskunft bis auf weiteres nicht. Siehe „Offene Fragen" Punkt 5.
6. **Der Satz sagt weiterhin „dem Pool"**, auch wenn die Bewegung eine reine Kanban-Spalte nennt.
   Siehe „Offene Fragen" Punkt 4.
7. **`docs/testplan.md` habe ich nicht angefasst** — fremde Hoheit. Die neuen Fälle stehen unten
   als Vorschlag.

Risiken:

1. **Verhaltensänderung ohne Migration des Bestands: Ein Ordner in einer Regel lässt sich nicht
   mehr löschen.** Wer heute eine Regel über einen leeren Ordner hat und den Ordner loswerden
   will, muss ihn zuerst aus der Regel nehmen. Das ist der Zweck, aber es ist eine sichtbare
   Änderung, und die Oberfläche sollte den Weg dorthin anbieten — die Kennungen stehen in
   `details`. Ohne sie ist die Sperre bei zwanzig Regeln eine Suche.
2. **`matchesPool` wirft.** Ein Aufrufer in einem `.mjs`-Skript, das ich nicht gesehen habe,
   stürbe jetzt statt eine zu weite Antwort zu bekommen. Ich habe alle sechs Aufrufer im Baum
   geprüft; sie tragen das Feld. Die Richtung des Fehlers ist die richtige — laut statt still —,
   aber sie ist laut.
3. **`GET /todos` antwortet auf mehr als 50 Kennungen mit 422 statt mit einer langsamen 200.** Die
   Oberfläche kann das nicht auslösen (sie schickt Auswahllisten), ein Skript schon.
4. **Sicherheit.** Keine neue Route, keine neue Fähigkeit am Token, keine neue Datenklasse.
   `poolMovement` trägt Pool**namen** — dieselbe Art Angabe, die `/addin/context` und
   `poolNames` seit T-038 liefern —, und `POST /timer/start` liegt hinter dem
   Sitzungsgeheimnis, nicht hinter dem Add-in-Token (`proof:route-policy` misst das, 40 grün).
   `details` nennt Pool**kennungen** und Pool**namen**; beides liefert `GET /pools` demselben
   Aufrufer ohnehin. Die Notiz-Trennung ist unberührt: Kein neuer Lesepfad zum Vermerk, und
   `check:boundary` läuft jetzt sogar strenger.
5. **Testdaten.** Alles erfunden: „Ost", „Ost offen", „Spalte nur über Unerledigt", „Akte 4712 —
   Telefonat", `C-4712-2026`. Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum.

Offene Fragen: an den Orchestrator

1. **Migration 0012 ist angelegt und muss von dir bestätigt werden.**
   `0012_pool_rule_restrict.up.sql` / `.down.sql`, dazu die neu erzeugte
   `packages/storage/src/sqlite/migrations.embedded.ts` (24 Dateien,
   `pnpm --filter @takt/storage migrations:embed`). Die Reihenfolge der Migrationen ist deine
   Sache; ich habe sie angelegt, gemessen und melde sie.

2. **Geänderte Signaturen — wen es betrifft.**
   - `matchesPool`: **unverändert.** Der integration-dev wird von mir nicht rot.
   - `BoardColumnRule` ist jetzt `interface BoardColumnRule extends MatchesPoolRule` mit
     `columnId` und `includeCompleted`. Aufrufer: `apps/local-api/src/usecases/board.ts` (meine,
     nachgezogen) und `packages/domain/test/board.test.ts` (unit-tester, **grün** —
     `typecheck:test` läuft darüber). `tests/e2e/support/actions.ts` führt einen gleichnamigen
     eigenen Typ, der nichts damit zu tun hat.
   - `TagFolderPort.remove` kann jetzt `tag_in_use`. Wer den Fehlertyp aufzählt, muss ihn
     mitnehmen; im Baum tut das niemand.
   - **Neu für Welle B:** `poolMovementSentence(movement, tense, occasion)` aus `@takt/domain`,
     dazu die Typen `PoolMovement`, `PoolMovementTense`, `PoolMovementOccasion`. Der
     Add-in-Aufrufer ersetzt `poolSentence(m, t)` durch `poolMovementSentence(m, t, 'reopen')`
     und `bookingPoolSentence(m, t)` durch `poolMovementSentence(m, t, 'booking')`; die
     Rückgabetypen bleiben dabei gleich (`string` beziehungsweise `string | null`). Der
     Wortlaut ändert sich an **einer** Stelle: „Poolregel" → „Regel". `PoolMovement` in
     `reopen.ts` ist strukturgleich mit dem Domänentyp und kann durch ihn ersetzt werden.
   - **Neu für den frontend-dev:** `POST /timer/start` liefert `poolMovement`; der Typ in
     `apps/web/src/api/types.ts` muss nachziehen, und `CARD_STAYS` entfällt (E-058 Absatz 2).

3. **Streichung von `resolveRule`/`resolveExcluded` (O-I) — Vorschlag, nicht getan.** Sie haben in
   `src` keinen Aufrufer mehr. Die Streichung berührt `packages/storage/src/ports.ts` und
   `repo-tags.ts` (meine) **plus** `packages/storage/test/repo-tags.test.ts` (unit-tester) und
   `apps/outlook-addin/scripts/fixtures.mjs` (integration-dev). Drei Hoheiten, also eine Aufgabe
   und keine Nebenbei-Änderung. Die Begründung an den beiden Methoden ist bis dahin
   richtiggestellt.

4. **Nennt der Satz eine reine Kanban-Spalte weiterhin „Pool"?** `PoolMovement` trägt Namen und
   keine Flächen, also kann `poolMovementSentence` nicht „Spalte" sagen. R-1 hat das im Rahmen von
   Befund 3 angemerkt („die Formulierung muss eine Spalte auch Spalte nennen können"). Das wäre
   eine zweite Änderung am Wortlaut und steht in E-058 nicht; sie hätte außerdem Folgen für die
   Gestalt der drei Listen (Name **und** `placement` je Eintrag). Ich habe sie nicht getroffen.

5. **Soll `POST /timer/stop` und `POST /timer/orphaned/resolve` dieselbe Auskunft liefern?** Beide
   erzeugen eine erste Buchung und bewegen das Todo damit in jede Spalte über den Exportstatus.
   E-058 nennt nur den Start. Der Anwendungsfall trägt beides ohne Änderung; es sind je vier
   Zeilen plus Beschreibung.

6. **R-3 H-1 bleibt offen** (Ordnerauflösung je Term, Faktor 70). R-3 nennt zwei billige Hebel —
   engere Grenze für Ordnerterme oder eine flachere Tiefenschranke — und bezeichnet beide
   ausdrücklich als deine Entscheidung. Ich habe keinen gezogen. Mit der Grenze aus S-2 ist der
   Schlimmstfall über die Route jetzt um den Faktor 4 kleiner.

7. **R-1 Befund 2 (`bookOnTodo` schreibt trotz `rejected` fest) und Befund 4 (186 MB in der
   Historie)** liegen nicht in meiner Hoheit und sind von mir nicht angefasst.

Nächster Schritt:

Welle B nach E-058 Absatz 3: **integration-dev** stellt `routes/addin/service.ts` auf
`poolMovementNamer` um und `duplicate/reopen.ts` auf `poolMovementSentence`; **frontend-dev**
liest `poolMovement` aus `POST /timer/start` und ersetzt `poolsContaining` plus `CARD_STAYS`.
Beide brauchen dafür nichts von mir außer dem, was oben unter Punkt 2 steht.

Parallel für den **unit-tester** vier Fälle, alle rein und ohne laufenden Dienst:

1. `poolMovementSentence` — acht Ausgänge (zwei Anlässe × zwei Zeitformen × zwei Randfälle) plus
   `null` bei leerer Bewegung im Anlass `booking` und **kein** `null` im Anlass `reopen`.
2. `poolMovementNamer` gegen eine Attrappe des Ports: `enters ⊆ appears`,
   `enters ∩ leaves = ∅`, und eine Regel über einen leeren Ordner in keiner der drei Listen.
3. `matchesPool` wirft ohne `unresolvedRequired` — mit der Gegenprobe, dass `false` nicht wirft.
4. `TagFolderPort.remove` auf einem leeren Ordner in einer Regel: `tag_in_use`, `details` nennt
   die Regel; Gegenprobe ohne Regel: gelöscht.

Für den **e2e-tester** ein Fall, der den Weg schließt: Spalte „erledigt und noch nicht
abgerechnet" einrichten, Todo erledigen, Timer starten — die Karte verschwindet aus der Spalte,
und die Anwendung sagt es vorher.

Befehle, die ich benutzt habe:

```
pnpm run typecheck            pnpm run test
pnpm run boundaries           pnpm run proof:openapi
pnpm run proof:conflicts      pnpm run proof:callers      pnpm run proof:tags
pnpm run proof:addin          pnpm run proof:access       pnpm run proof:route-policy
pnpm run proof:export         pnpm run proof:export-api   pnpm run proof:taskpane
pnpm run proof:addin-wiring   pnpm run proof:template-fields
pnpm run proof:db-permissions
node packages/storage/scripts/embed-migrations.mjs [--check]
```
