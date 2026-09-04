Aufgabe: T-080 — Die Frage „ist diese Regel leer" gehört in die Domäne, nicht in die Oberfläche

Status: fertig

Artefakte:

```
packages/domain/src/tag.ts                    +302/−52 (netto): `PoolRuleAxes` als Aufzählung der
                                              fünf Achsen, `POOL_RULE_AXIS_CONDITIONS` als über
                                              diesen Typ abgebildete Tabelle,
                                              `countPoolRuleConditions`, `poolRuleIsEmpty`,
                                              `PoolResolution`/`resolvePool`; `MatchesPool` in
                                              `MatchesPoolRule` + `MatchesPoolCandidate` zerlegt,
                                              `POOL_RULE_AXIS_OF_FIELD` als Gegenrichtung;
                                              `Pool extends PoolRuleAxes`
packages/storage/src/sqlite/repo-todos.ts     `buildConditions` fragt `poolRuleIsEmpty` statt
                                              `axes.length === 0` selbst zu entscheiden; die alte
                                              Zeile bleibt als Sicherheitsnetz daneben
apps/local-api/src/usecases/structure.ts      `PoolWithResolution`, `poolWithResolution`,
                                              `withResolution`; `listPools`, `createPool`,
                                              `updatePool` liefern die Auflösung mit
apps/local-api/src/usecases/board.ts          jede Spalte trägt ihre Auflösung — ohne zusätzliche
                                              Abfrage, die beiden Taglisten wurden schon aufgelöst
apps/local-api/openapi/takt-local-api.yaml    +85: `PoolResolution`, `PoolWithResolution`; die vier
                                              Antworten, die eine Regel anzeigen, zeigen darauf
apps/local-api/scripts/proof-openapi.mjs      +188: Abschnitt 13, acht Prüfungen
apps/local-api/scripts/service-scenario.mjs   +22: Spalte über einen **leeren Ordner**
apps/local-api/scripts/proof-callers.mjs      −11: die beiden `NEVER_SENT`-Zeilen sind weg
docs/architektur.md                           zwei Zeilen in der Domänentabelle, Begründung,
                                              Routentabelle
docs/datenmodell.md                            4.4 (SQL fragt die Domäne) und neu 4.4b („Zwei Arten
                                              von Leere")
.claude/team/reports/T-080-domain-dev.md      dieser Bericht
```

Nicht angefasst: `apps/web/**`, `packages/*/test/**`, `tests/e2e/**`,
`apps/local-api/src/routes/addin/**`, `packages/export/**`. Kein Feld umbenannt und keines
entfernt — `tests/e2e/support/api.ts` und `/addin/context` laufen unverändert weiter.

---

Zusammenfassung:

Die achte Doppelung ist beseitigt, und sie war eine **dreifache**: „alle Achsen neutral" stand in
`matchesPool`, ein zweites Mal als `axes.length === 0` in der Übersetzung nach SQL und ein drittes
Mal als `countConditions` in `apps/web`. Jetzt stellt die Frage jeder an derselben Stelle
(`poolRuleIsEmpty`), und die Aufzählung der Achsen ist ein Typ, über den eine Tabelle abgebildet
ist: Eine sechste Achse lässt `tsc` an fünf Stellen in drei Paketen fehlschlagen — nachgemessen,
nicht behauptet. Die Gegenrichtung ist ebenfalls zu: Ein neues Feld an der Regelseite von
`matchesPool` verlangt die Angabe, zu welcher Achse es gehört.

Über die Leitung geht **nicht** die Leere, sondern die **Auflösung**. Die Begründung steht in
Abschnitt 3; kurz: Die Oberfläche braucht die Antwort auch für den Entwurf im Formular, und ein
Feld an der gespeicherten Regel hätte den Entwurf nicht beantwortet — die Oberfläche hätte weiter
selbst gerechnet, und die Doppelung wäre nur umgezogen. Was der Aufrufer dagegen unmöglich wissen
kann, ist, ob in einem genannten Ordner überhaupt ein Tag liegt; das steht seit T-080 als
`resolved` an jeder ausgelieferten Regel.

`pnpm check` Exitcode **0**, alle dreizehn Nachweispfade plus Bündelprüfung, 581 Prüffälle in
Vitest, `proof:openapi` **72 von 72** (vorher 64: acht neue), `proof:callers` **18 von 18**.

---

## 1. Was jetzt in der Domäne steht

```ts
export interface PoolRuleAxes {
  readonly rule: readonly unknown[];          // erforderliche Tags
  readonly excludedTags: readonly unknown[];  // ausgeschlossene Tags
  readonly statusIds: readonly unknown[];
  readonly completion: PoolCompletionFilter;
  readonly exportState: PoolExportFilter;
}
export type PoolRuleAxisId = keyof PoolRuleAxes;

export const countPoolRuleConditions = (axes: PoolRuleAxes): number
export const poolRuleIsEmpty        = (axes: PoolRuleAxes): boolean
export const resolvePool: ResolvePool   // { axes, ruleTagIds, excludedTagIds } → PoolResolution
```

**Warum die drei Listen `readonly unknown[]` sind.** Weil dieselbe Frage an **zwei** Gestalten
derselben Regel gestellt wird und die Antwort beide Male dieselbe sein muss: gespeichert (Terme,
ein Ordner steht für beliebig viele Tags) und aufgelöst (Tagkennungen). Gezählt wird beide Male
die Länge, mehr liest die Frage nicht. Ein engerer Typ hätte zwei Fassungen der Funktion erzwungen
— und zwei Fassungen sind genau das, was hier wegsollte. Nebenwirkung, die ich in Kauf genommen
habe: Der Typ nimmt auch eine Liste von etwas anderem an. `{ length: number }` wäre noch lockerer
gewesen (eine Zeichenkette hätte gepasst), ein Positionstyp `PoolTagTerm | TagId` wäre enger, aber
dann hätte die Oberfläche mit ihren eigenen, unmarkierten Kennungen nicht mehr hineingepasst.

**Die Feldnamen sind die der Schnittstelle.** `rule`, `excludedTags`, `statusIds`, `completion`,
`exportState` — deshalb erfüllt ein `Pool` den Typ unverändert, und die Oberfläche reicht ihren
Formularentwurf ohne einen einzigen Umbau hinein. Nachgewiesen, nicht angenommen: Ich habe die
Typen aus `apps/web/src/api/types.ts` und `lib/labels.ts` wortgleich in eine eigene Datei
außerhalb des Projekts kopiert und `poolRuleIsEmpty(axes)` sowie `countPoolRuleConditions(axes)`
darauf übersetzt — unter `--strict --exactOptionalPropertyTypes` ohne Befund. Der frontend-dev kann
`countConditions`/`hasNoCondition` Zeile für Zeile ersetzen; `apps/web` hängt schon an
`@takt/domain` (wegen `tagNameKey`).

## 2. Wodurch das rot wird — gemessen, nicht behauptet

Ich habe beide Richtungen ausprobiert und die Fehler abgeschrieben.

**a) Eine sechste Achse in `PoolRuleAxes`** (`readonly priority: 'any' | 'high'`):

| Paket | Datei, Zeile | Fehler |
|---|---|---|
| domain | `tag.ts:670` | TS2741 `'priority' is missing` — die Achsentabelle |
| domain | `tag.ts:766` | TS2345 — das Literal in `matchesPool` |
| domain | `tag.ts:817` | TS2345 — das Literal in `resolvePool` |
| storage | `mappers.ts:171` | TS2741 — `toPool` liefert die Achse nicht |
| storage | `repo-todos.ts:200` | TS2345 — die Übersetzung nach SQL |
| local-api | `structure.ts:352` | TS2379 — `pools.create` nimmt sie nicht an |

Das ist der Punkt der Aufgabe: Nicht nur die neue Funktion wird rot, sondern **die Übersetzung
nach SQL**. Genau die war beim Tagesgrenzen-Fehler die Stelle, die still danebenlag.

**b) Ein neues Feld an der Regelseite von `matchesPool`** (`rulePriority`):
`tag.ts:710` TS2741 — `POOL_RULE_AXIS_OF_FIELD` verlangt die Zuordnung zu einer Achse, und Achsen
gibt es nur die in `PoolRuleAxes`. Damit wird im selben Zug die Tabelle aus (a) rot. Ohne diese
Abbildung wäre die Richtung offen geblieben: Ein Feld an `matchesPool` **muss** man anfassen, damit
eine Achse überhaupt wirkt, `PoolRuleAxes` nicht.

**c) Eine Achse aus der Beschreibung entfernt** (`exportState` aus `required` von `Pool`):
`proof:openapi` Abschnitt 13, `FEHL  jede Achse der Domäne ist beschrieben — Pool.exportState nicht
Pflicht`. Die Aufzählung kommt dort aus `POOL_RULE_AXIS_IDS`, also aus der Domäne, und wird gegen
die Beschreibung, gegen die zod-Prüfung beider Routen **und** gegen die tatsächlich ausgelieferten
42 Regeln gehalten.

**d) Der Prüfer prüft sich selbst.** Abschnitt 13 setzt je Achse einmal einen Wert bei sonst
neutralen Nachbarn und verlangt, dass **jede einzelne** die Leere aufhebt — und dass die neutrale
Regel als leer gilt. Ohne das wäre die Prüfung auch grün, wenn `poolRuleIsEmpty` immer dasselbe
antwortete.

## 3. Über die Leitung: die Auflösung als Feld, die Leere als Funktion

Entscheidung, und warum sie nicht symmetrisch ist:

| Frage | Wer antwortet | Warum so |
|---|---|---|
| Nennt die Regel eine Bedingung? | `poolRuleIsEmpty`, aufgerufen | Die Felder liegen dem Aufrufer vor — **auch beim Entwurf im Formular, den keine Route kennt.** Ein Feld hätte nur den gespeicherten Stand beantwortet, und für den Entwurf hätte die Oberfläche weiter selbst gezählt. Die Doppelung wäre umgezogen, nicht verschwunden. |
| Was ergeben ihre Ordner? | `resolved` am Pool | Kann nur der Dienst sagen; die Auflösung steigt rekursiv über den Ordnerbaum ab (E-022). |

Das folgt E-045 („eine Fassung in `packages/domain`, von beiden Seiten aufgerufen") und
widerspricht E-049 nicht: Dort ging es um eine **Liste von Auswahlmöglichkeiten**, die
`packages/export` gehört — ein Paket, das `apps/web` nicht einbinden darf. Hier geht es um eine
**Regel**, und die Domäne darf jeder einbinden.

Ein **eigener Endpunkt** wäre die dritte Möglichkeit gewesen und die schlechteste: Das Board zeigt
zwölf Spalten, das wären zwölf Auskünfte neben der Antwort, die die Spalten ohnehin liefert — und
für den Entwurf im Formular hätte auch er nichts beigetragen.

**`Pool` bleibt `Pool`, daneben steht `PoolWithResolution`** (`allOf`). Die vier Antworten, die
eine Regel **anzeigen** — `GET /pools`, `POST /pools`, `PATCH /pools/{id}`, `GET /board` —, liefern
die Auflösung; `/addin/context` liefert weiterhin die nackte Regel. Zwei Gründe: Der Aufgabenbereich
nennt Pools beim Namen und zeichnet keinen Leerzustand, und `apps/local-api/src/routes/addin/**`
gehört mir nicht — ein Pflichtfeld am gemeinsamen `Pool` hätte eine fremde Route rot gemacht, die
ich nicht anfassen darf.

## 4. Die aufgelöste Tagzahl — und der stille Fall, den sie sichtbar macht

```json
"resolved": { "tagCount": 12, "excludedTagCount": 0, "isEmpty": false }
```

Damit sind drei Zustände unterscheidbar, die vorher zwei hießen:

| Zustand | Erkennungsmerkmal | Wer es behebt |
|---|---|---|
| keine Bedingung genannt | `poolRuleIsEmpty(pool)` | nur der Benutzer, durch Ergänzen |
| Bedingung zeigt ins Leere | `resolved.tagCount === 0` bei nicht leerem `rule` | nur der Benutzer, durch ein Tag im Ordner |
| trifft gerade nichts | keines von beidem, `total === 0` | löst sich mit dem nächsten passenden Todo |

**Der Befund, den ich dabei gefunden habe und der schwerer wiegt als der Leerzustand.** Eine leere
Tagmenge ist der **Neutralwert** dieser Achse — `matchesPool` überspringt sie. Eine Regel „Tags aus
diesem Ordner **und** Status offen" mit einem leeren Ordner ist damit faktisch „Status offen": Sie
trifft **mehr** als beabsichtigt, nicht weniger, und nichts an ihr sieht danach aus. Der Fall fährt
seit T-080 im Prüfpfad mit (Spalte „Spalte über einen leeren Ordner", Abschnitt 13) und steht in
`datenmodell.md` 4.4b. Fachlich geändert habe ich daran nichts — das wäre eine Entscheidung, nicht
eine Aufgabe (siehe offene Frage 1).

## 5. Die beiden `NEVER_SENT`-Zeilen sind weg

`createPool`/`updatePool` mit `excludedTags`, `statusIds`, `completion`, `exportState` — gelöscht,
nicht fortgeschrieben, mit einem Satz an ihrer Stelle, der sagt, wann sie eingelöst wurden (T-079).
`proof:callers` bleibt bei 18 von 18: Der Lauf wäre rot geworden, wenn die Oberfläche eines der
vier Felder nicht sendet, also ist die Übergabe wirklich abgeschlossen und nicht nur behauptet.

## 6. Was ich nicht getan habe

- **Kein Feld umbenannt, keines entfernt.** `resolved` kommt hinzu, sonst nichts. Der e2e-Bestand
  (`tests/e2e/support/api.ts`) liest `id` und `name` aus der Antwort und sendet nur Anfragefelder —
  er läuft unverändert mit.
- **Keine Migration.** Es gibt nichts zu speichern: `resolved` ist abgeleitet, wie die
  Pool-Zugehörigkeit selbst (A-3.4). Vorwärts/rückwärts musste deshalb nichts laufen.
- **Kein Port dazu.** `withResolution` ruft zweimal je Regel die vorhandene Auflösung auf, statt
  eine dritte SQL-Fassung der Ordnerrekursion zu schreiben. Ein Sammelaufruf wäre eine zweite
  Auflösung geworden — genau die Doppelung, um die es hier geht. Das Board zahlt gar nichts: Es löst
  für `boardAppearances` ohnehin auf und gibt die Listen jetzt weiter, statt sie zweimal zu holen.
- **`apps/web` nicht angefasst.** `countConditions` und `hasNoCondition` stehen dort noch; die
  Ersetzung ist eine Zeile je Aufrufstelle (drei) und gehört dem frontend-dev.

## 7. Prüfstand

```
pnpm check            Exitcode 0
pnpm typecheck        grün, alle Projekte
proof:openapi         72 bestanden, 0 fehlgeschlagen   (Abschnitt 13 neu, 8 Prüfungen)
proof:callers         18 bestanden, 0 fehlgeschlagen
proof:tags            149 | proof:access 42 | proof:export 75 | proof:export-api 97
proof:conflicts       69 | proof:route-policy 112 | proof:template-fields 40
proof:db-permissions  30 | proof:addin-wiring 25 | proof:taskpane 32 | proof:addin 17
vitest                35 Dateien, 581 Prüffälle, 0 fehlgeschlagen
Abdeckung             packages/domain/src/tag.ts: 95,71 / 92,59 / 94,73 / 100
                      (unbedeckt: 859, 864 — beide aus T-076, nicht aus dieser Aufgabe)
```

Zwei Messungen, die ich zusätzlich gemacht habe:

- **Rot-Tests** aus Abschnitt 2, alle drei mit dem abgeschriebenen Fehler, danach zurückgesetzt.
- **Laufzeit von `matchesPool`.** Der Neutralitätstest legt jetzt ein kleines Objekt je Aufruf an
  und ruft fünf Funktionen aus der Tabelle. Gemessen an einem Board mit 12 Spalten und 200 Karten,
  also 2400 Zugehörigkeitsprüfungen: **0,65 ms je Board** (20 Durchläufe, 12,9 ms). Der Aufwand
  liegt drei Größenordnungen unter der Antwortzeit der Route.

Ein Hinweis zum Ablauf, nicht zur Sache: Ein Lauf von `pnpm check` ist mir mit
`Auf 127.0.0.1:17843 lauscht bereits etwas` abgebrochen — ein `apps/local-api`-Prozess eines
parallel laufenden Agenten. Ich habe ihn **nicht** abgeschossen, sondern gewartet und neu
gestartet; der Wiederholungslauf ist Exitcode 0. Zwei Prüfpfade, die beide 17843 binden, können
nicht gleichzeitig laufen.

## 8. Annahmen

1. **Der Neutralwert einer Achse ist keine Bedingung.** `matchMode` und `includeSubfolders` zählen
   deshalb nicht mit: Sie sagen, **wie** eine Achse verknüpft ist, nicht **dass** sie etwas fordert.
   Eine Regel, an der nur `matchMode` umgestellt wurde, nennt keine Bedingung. Das ist die Lesart,
   die `apps/web` in T-079 schon hatte; ich habe sie übernommen und in `POOL_RULE_AXIS_OF_FIELD`
   ausdrücklich ausgeschlossen, statt sie stillschweigend weglassen.
2. **Die Auflösung gehört an jede Regel, die angezeigt wird** — auch an die Antwort von `POST` und
   `PATCH`. Eine Regel, die beim Anlegen anders aussieht als beim Lesen, wäre für die Oberfläche
   zwei Typen.
3. **`resolved.isEmpty` ist eine Zusage über die Abfrage**: Ist es wahr, liefert die
   Mitgliederabfrage nichts. Abschnitt 13 misst die Richtung, die etwas taugt (leer ⇒ keine
   Mitglieder), und verlangt mindestens drei Gegenproben, damit sie nicht leer gemessen ist.
4. **`ResolvePool` heißt so und nicht `PoolResolutionOf`.** In `packages/storage` gibt es
   `resolvePoolRule` — ähnlicher Name, andere Aufgabe (das ist die Ordnerabfrage). Ich habe die
   Namen nebeneinander stehen lassen, weil der eine in der Domäne und der andere im Adapter lebt
   und beide dort das Naheliegende heißen. Wer das für verwechselbar hält, soll es sagen, bevor
   Aufrufer daran hängen.

## 9. Risiken

- **R-neu (klein): `readonly unknown[]` nimmt zu viel an.** `poolRuleIsEmpty({ rule: [1, 2], … })`
  übersetzt. Der Schaden wäre eine falsche Anzahl, nie ein falscher Export; der Gewinn ist eine
  Funktion statt zweier. Enger getippt hätte die Oberfläche nicht hineingepasst.
- **Die SQL-Übersetzung bleibt eine zweite Fassung der Regel.** T-080 hat ihre **Leerheitsfrage**
  vereinheitlicht, nicht ihre fünf Bedingungen. Die Übereinstimmung hängt weiterhin an
  `proof:openapi` Abschnitt 11/12 — das ist unverändert und war nicht Auftrag dieser Aufgabe.
- **Sicherheitslage unverändert.** Keine neue Route, kein neues Eingabefeld, keine neue
  Vertrauensgrenze. `resolved` sind zwei Zahlen und ein Wahrheitswert über Tags — keine Kundendaten,
  keine Notiz, kein Vermerk. Die Notiz-Trennung ist nicht berührt: `PoolResolution` kennt keinen
  Text.
- **Ein Prozess auf 17843 blockiert einen Prüflauf.** Nicht neu, aber jetzt zweimal aufgetreten;
  siehe Abschnitt 7.

## 10. Offene Fragen

**1. Soll ein leerer Ordnerterm die Regel weiterhin still verbreitern?** (Abschnitt 4) Heute wird
eine Regel „Tags aus Ordner X **und** Status offen" zu „Status offen", wenn in X kein Tag liegt —
sie trifft mehr, nicht weniger. Drei Möglichkeiten, ich habe keine davon gewählt:

- **so lassen**, jetzt sichtbar über `resolved.tagCount` (der Stand);
- **fail closed**: ein genannter, aber leerer Ordnerterm lässt die Regel nichts treffen. Fachlich
  das, was der Benutzer wohl meint, aber es macht `matchesPool` von „genannt" abhängig und nicht
  mehr nur von der aufgelösten Menge — die Funktion bräuchte dann beide Gestalten;
- **beim Speichern abweisen.** Schlecht: Ein Ordner kann nachträglich leer werden.

Das ist eine Produktentscheidung mit Wirkung auf die Abrechnung („was habe ich noch nicht
abgerechnet" als Spalte), deshalb nicht von mir.

**2. Übergabe an frontend-dev.** `countConditions`/`hasNoCondition` in
`apps/web/src/lib/poolRule.ts` durch `countPoolRuleConditions`/`poolRuleIsEmpty` aus
`@takt/domain` ersetzen (Assignability nachgewiesen, Abschnitt 1); `resolved` in `Pool`
(`api/types.ts`) ergänzen und den zweiten Leerzustand aufteilen: „dieser Ordner enthält kein Tag"
gegen „keine Karte trifft diese Regel". Die benannte Ungenauigkeit im Kopf von `poolRule.ts` kann
dann weg.

**3. Übergabe an integration-dev.** Der dateiinterne `PoolCandidate` in
`apps/local-api/src/routes/addin/service.ts` ist jetzt in der Domäne zu haben:
`MatchesPoolCandidate` (Kartenseite) und `MatchesPoolRule` (Regelseite). Das aufgelöste
Pool-Objekt in `poolNamer` erfüllt `MatchesPoolRule` strukturell; wer es so tippt, bekommt beim
Hinzufügen einer Achse denselben Fehler wie alle anderen. Ich habe die Datei nicht angefasst.

**4. Übergabe an unit-tester.** Ohne eigene Prüffälle sind heute `resolvePool` (nur über
`proof:openapi` Abschnitt 13 befahren) und die Randfälle von `countPoolRuleConditions`. Vorschlag:
je Achse einzeln (fünf Fälle, die Zahl 1), alle zusammen (5), alle neutral (0), und ein Fall mit
`matchMode: 'all'` bei leeren Listen — er muss 0 ergeben.

Nächster Schritt: T-081 für den frontend-dev (offene Frage 2, drei Aufrufstellen plus der zweite
Leerzustand), und eine Entscheidung zu offener Frage 1 durch den Auftraggeber, bevor jemand die
Spalte „noch nicht abgerechnet" als Abrechnungsliste benutzt.
