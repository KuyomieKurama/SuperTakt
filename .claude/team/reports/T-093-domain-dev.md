Aufgabe: T-093 — E-058 Punkte 4 und 6, Kommentar, benannte Typen

Status: fertig

**Zuerst, weil es die Auflage war:** An `poolMovementSentence`, `poolMovementNamer` und
`PoolMovement` ist **keine Signatur** geändert. Der Übersetzer sieht keinen Unterschied; geändert
haben sich allein die erzeugten Zeichenketten und ein nicht ausgeführter, dateilokaler Helfer
(`inPools`), der gestrichen ist. `git diff packages/domain/src/pool-movement.ts` zeigt auf den
`export`-Zeilen genau nichts.

Neu ist ein Feld an zwei Antworten (`poolMovement` an `POST /timer/stop` und
`POST /timer/orphaned/resolve`) und zwei benannte Typen in der Domäne.

---

Artefakte:

Geändert:

```
packages/domain/src/pool-movement.ts        `inPools` gestrichen, alle Einschübe über
                                            `listPools`; zwei Sätze im Wortlaut geändert;
                                            Begründung E-058 Punkt 4 an `listPools` und im Kopf
packages/domain/src/tag.ts                  `PoolMatchMode` neu und exportiert; `Pool.matchMode`
                                            und `MatchesPoolRule.matchMode` darüber getippt
packages/domain/src/settings.ts             `Theme` neu und exportiert; `AppSettings.theme` und
                                            `AppSettingsUpdate.theme` darüber getippt
packages/storage/src/ports.ts               `PoolPort.list` — Begründung der Vorgabe `'pool'`
                                            richtiggestellt (nicht mehr `poolNamer`)
packages/storage/src/sqlite/repo-todos.ts   `ResolvedPool.matchMode: PoolMatchMode`
packages/storage/src/sqlite/repo-tags.ts    `poolMatchMode(): PoolMatchMode`
apps/local-api/src/usecases/timer.ts        `StopTimerResult` trägt `poolMovement`;
                                            `presenceBeforeBooking`, `movementOfBooking`;
                                            `stopTimer` und `resolveOrphanedTimer` rechnen mit
apps/local-api/src/usecases/structure.ts    `PoolInput.matchMode`, `SettingsUpdate.theme` über
                                            die benannten Typen
apps/local-api/openapi/takt-local-api.yaml  `poolMovement` an beiden Ausgängen von
                                            `/timer/stop` und `/timer/orphaned/resolve`;
                                            Schema `PoolMovement` um E-058 Punkt 4 ergänzt
apps/local-api/scripts/service-scenario.mjs zwei zusätzliche aufgezeichnete Stopps: einer, der
                                            die erste offene Buchung erzeugt, und die Gegenprobe
apps/local-api/scripts/proof-openapi.mjs    Abschnitt 15: 7 neue Prüfungen (93 → 100)
docs/architektur.md                         Kein Gattungswort; drei Vorgänge liefern die Bewegung
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`,
alle Testordner.

---

Zusammenfassung:

Der Bewegungssatz nennt jetzt nur noch Namen in Anführungszeichen; der Baustein, der „dem Pool"
beziehungsweise „den Pools" davorsetzte, ist gestrichen, und alle vierzehn Sätze stimmen
**zeichengenau** mit der Tabelle im Board überein — gemessen, nicht behauptet. `POST /timer/stop`
und `POST /timer/orphaned/resolve` liefern dieselbe Auskunft wie der Start, mit Anlass Buchung:
Die erste abgeschlossene Buchung setzt „hat offene Buchungen", und jede Spalte mit
`exportState: 'open'` nimmt das Todo damit auf; das Zustandspaar bildet `usecases/timer.ts`, die
Rechnung bleibt in `usecases/pool-movement.ts`. Der Kommentar an `PoolPort.list` nennt statt des
verschwundenen `poolNamer` die beiden Zeugen, die die Vorgabe wirklich tragen — die Pool-Ansicht
und `GET /addin/context` —, und sagt dazu, dass die Bewegung über `'all'` rechnet. `Theme` und
`PoolMatchMode` sind benannt und exportiert, die fünf ausgeschriebenen Aufzählungen in Domäne,
Speicherung und Dienst zeigen jetzt darauf.

---

Annahmen:

1. **Das Feld steht auch im verworfenen Ausgang, nicht nur im gebuchten.** `StopTimerResult` hat
   zwei Zweige; `poolMovement` steht an beiden, im verworfenen fest als `null` getippt
   (`readonly poolMovement: null`). Der Wortlaut der Aufgabe („`null`, wenn sich nichts bewegt",
   „Verwerfen bewegt nichts → `null`") liest sich als „Feld da, Wert `null`" und nicht als „Feld
   weg". Begründung im Code: Ein Feld, das je nach `kind` vorhanden ist oder fehlt, zwingt jede
   Aufrufstelle zu einer Fallunterscheidung vor der eigentlichen — und `movement?.appears` auf
   einem Zweig, der es nicht kennt, liest sich fehlerfrei und fragt ins Leere. Der Unterschied ist
   für die Oberfläche keiner: `null` bleibt `null`.

2. **`stopTimer` liest den laufenden Timer, bevor es stoppt.** Ein zusätzlicher Zugriff auf
   `ux_time_entry_running` je Stopp. Er ist unvermeidbar: Erst er sagt, auf welchem Todo der
   Timer sitzt, und **nach** dem Stopp ist die Frage „gab es schon eine abgeschlossene Buchung?"
   nicht mehr zu stellen, weil es ab dann immer eine gibt. Läuft kein Timer, wird nichts gelesen
   und nichts geraten — den Fehler bildet weiterhin `timer.stop` an genau einer Stelle.

3. **Keine Ordnerauflösung im Normalfall.** `movementOfBooking` steigt aus, sobald das Todo schon
   eine offene Buchung hatte — dann sind beide Zustände gleich, und die Antwort wäre drei leere
   Listen zum Preis einer Auflösung jedes Ordnerbaums. Das ist der Normalfall ab der zweiten
   Buchung, und er kostet jetzt einen Indexzugriff und sonst nichts. Der Todo-Datensatz wird
   ebenfalls erst gelesen, wenn feststeht, dass es etwas zu berichten gibt.

4. **Zwei zusätzliche Aufzeichnungen im Nachweisbestand.** Ohne sie wäre Abschnitt 15 auch an
   einer Fassung grün, die bei jedem Stopp alle Regeln auflöst: Sie lieferte drei leere Listen
   statt `null`, und niemand würde rot. Der Bestand hat deshalb jetzt einen Stopp, der die erste
   offene Buchung erzeugt (nach dem Exportlauf, deshalb ist sie wieder die erste), und
   unmittelbar danach denselben Stopp ein zweites Mal — echte zwei Minuten, keine Bewegung,
   `null`. Beide sind erfunden (`Rückfrage geklärt`, `Nachtrag zur Akte`).

5. **`PoolMatchMode` ersetzt die Aufzählung auch dort, wo niemand danach gefragt hat** — in
   `repo-todos.ts`, `repo-tags.ts` und `usecases/structure.ts`. Ein benannter Typ, den die Hälfte
   der Fundstellen ignoriert, ist keine Quelle, sondern eine sechste Abschrift. Die zwei
   Zod-Aufzählungen an den Routen (`z.enum(['any','all'])`, `z.enum(['system','light','dark'])`)
   bleiben, wie sie sind: Sie prüfen eine Anfrage von außen und dürfen nicht aus demselben Typ
   abgeleitet sein, der die Antwort tippt. Die Wertebereiche sind unverändert.

---

Risiken:

- **Der Wortlaut ist jetzt an vier Stellen dieselbe Zeichenkette und an einer die Prüfung
  dagegen.** `packages/domain/src/pool-movement.ts` erzeugt ihn, `packages/domain/test/
  pool-movement.test.ts` (unit-tester, T-095) misst ihn zeichengenau, `proof:openapi` misst ihn
  ein zweites Mal, und Oberfläche und Add-in rufen die Funktion. Wer den Satz ändern will, ändert
  ihn in der Domäne und wird an zwei Stellen rot. Das ist gewollt.

- **Sicherheit: keine neue Fläche.** Es kommt kein Feld hinzu, das der Export lesen könnte; die
  Todo-Notiz ist nicht berührt. `poolMovement` trägt **Pool- und Spaltennamen**, also
  Benutzereingaben, an einen Aufrufer, der die Pools ohnehin über `GET /pools` lesen darf. Für
  das Add-in gilt das mit der Einschränkung aus E-058 Punkt 7: Es sieht über `GET /addin/context`
  weiterhin nur Pools, erfährt reine Board-Spalten aber über den Bewegungssatz — das ist
  ausdrücklich entschieden und keine neue Undichtigkeit, sondern dieselbe wie beim Start seit
  T-089.

- **Zwei Buchungen mehr im Nachweisbestand.** Sie verschieben Summen in
  `proof:openapi`/`service-scenario.mjs`. Gemessen: alle 100 Prüfungen grün, einschließlich der
  Kreuzprüfung `GET /time-entries` gegen den Bestand und der Abschnitte über Export und Board.
  Der `e2e`-Bestand ist ein anderer und nicht berührt.

- **Der Aufwand einer Bewegung ist unverändert der aus T-089** — eine Auflösung je Regel über
  beliebig tiefe Ordnerbäume, `list('all')`. R-3 H-1 („Ordnerauflösung Faktor 70") gilt für
  diesen Weg genauso und liegt weiter beim Auftraggeber. Neu ist nur, dass er jetzt auch am
  Stopp erreichbar ist — und dort im Normalfall gar nicht betreten wird (Annahme 3).

---

Offene Fragen: an den Orchestrator

1. **Welle C, frontend-dev:** `apps/web/src/api/types.ts` beschreibt die Antwort von
   `POST /timer/stop` noch ohne `poolMovement`. Das ist so vorgesehen (Board: „Stopp-Antwort noch
   **nicht** anbinden"), aber die Typfassung dort ist damit unvollständig, nicht falsch. Beim
   Anbinden in Welle C ist der Anlass `'booking'` und **nie** `'reopen'`: Ein Stopp hebt kein
   „Erledigt" auf. `poolMovementSentence(movement, 'past', 'booking')` gibt `string | null`, und
   `null` heißt „Fläche ganz weglassen", nicht `?? ''`.

2. **`POST /timer/orphaned/resolve` verspricht in der Beschreibung `reason` als
   `enum [timer_too_short, orphan_discarded]`, der Dienst liefert ausnahmslos
   `timer_too_short`.** Das ist ein Rest aus der Zeit vor E-036 und **nicht** durch T-093
   entstanden; `schema-match` winkt es durch, weil ein Aufzählungswert genügt. Es ist dieselbe
   Schadensart wie T-039 und T-041: Wer gegen die Beschreibung baut, behandelt einen Fall, den es
   nicht gibt. Entweder der Dienst unterscheidet die beiden Gründe (dann sieht der Benutzer beim
   Verwerfen „verworfen" statt „zu kurz"), oder die Aufzählung schrumpft auf einen Wert. Ich habe
   nichts davon getan, weil beides eine Verhaltens- beziehungsweise Vertragsänderung ohne
   Entscheidung wäre.

3. **O-M und O-C stehen unverändert offen** (Aufruferseite des Add-ins nicht von
   `proof:callers` erfasst; `GET /settings` belegt keine Merkmale zum Datenbankpfad). O-I ist
   erledigt — der Kommentar an `resolveRule`/`resolveExcluded` wurde bereits mit T-089
   richtiggestellt; offen bleibt allein die Frage, ob die beiden schmalen Methoden zugunsten von
   `resolveAxes` entfallen (zwei Dateien in fremder Hoheit).

4. **Fremder Baum, nur zur Kenntnis:** `pnpm run typecheck` steht rot in
   `apps/outlook-addin` (drei Fehler in `src/ui/TaskPane.tsx` gegen `reopen.ts`) und
   `proof:addin` mit einer Prüfung (`CARD_STAYS` noch in drei Dateien). Beides ist T-092 mitten
   im Lauf, nicht meine Änderung. Ebenso ist `pnpm run test:coverage` in einer soeben von der
   unit-testerin angelegten Datei rot (`packages/storage/test/repo-tags-folder-in-rule.test.ts`,
   `UNIQUE constraint failed: pool.position` — ein Bestandsfehler im Prüffall, keine Regression).

---

Messung (Exitcodes, ohne Pipe):

```
pnpm --filter @takt/domain    typecheck   0
pnpm --filter @takt/storage   typecheck   0
pnpm --filter @takt/export    typecheck   0
pnpm --filter @takt/local-api typecheck   0
pnpm run typecheck:test                   0
pnpm run boundaries                       0
pnpm run test                             0   40 Dateien, 633 Fälle
pnpm run proof:openapi                    0   100 bestanden (vorher 93)
pnpm run proof:access                     0   75 bestanden
pnpm run proof:callers                    0   18
pnpm run proof:conflicts                  0   149
pnpm run proof:tags                       0   42
pnpm run proof:export                     0   97
pnpm run proof:export-api                 0   69
pnpm run proof:taskpane                   0   25
pnpm run proof:addin-wiring               0   32
pnpm run proof:route-policy               0   40
pnpm run proof:template-fields            0   30
pnpm run proof:db-permissions             0   17
pnpm run proof:addin                      1   133 / 1 rot — fremde Hoheit, T-092 im Lauf
```

Zweigabdeckung `packages/domain/src`: 87,5 % (Anweisungen 89,52 %); `pool-movement.ts` 100 %
Anweisungen, 94,73 % Zweige. Die 69,72 % aus der Messung nach Welle A sind damit erledigt.

Zusätzlich gemessen, außerhalb der Nachweispfade: alle **vierzehn** Sätze aus der Tabelle im
Board, Zeichen für Zeichen, in beiden Anlässen und beiden Zeitformen, dazu die beiden `null`.
16 von 16 gleich. Die Prüfung liegt seit T-095 dauerhaft in `packages/domain/test/`; mein Lauf
war die Gegenprobe dazu.

---

Nächster Schritt:

Welle C wie geplant: frontend-dev bindet die Stopp-Antwort an (`poolMovement` aus
`POST /timer/stop`, Anlass `'booking'`, `null` heißt Fläche weglassen), e2e-tester vergleicht den
Bewegungssatz zwischen Hauptanwendung und Aufgabenbereich. Davor sollte T-092 grün sein — solange
`CARD_STAYS` im Add-in steht, misst der Vergleich zwei verschiedene Quellen.

Für die Wiedervorlage R-1a empfehle ich, Frage 2 oben (`orphan_discarded`) mit aufzunehmen: Es
ist derselbe Befund wie R-1 „`status_in_use` ohne vierten Grund in OpenAPI", nur an einer anderen
Route.
