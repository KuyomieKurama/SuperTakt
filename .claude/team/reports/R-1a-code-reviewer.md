# R-1a — Wiedervorlage Code-Review `status-als-regelterm`

**Umfang.** `git diff 3240dcc..HEAD` (Stand `aca53df`): Welle A (T-089, T-090, T-091), Welle B
(T-092 bis T-096), Welle C (T-097) und T-098 auf `apps/desktop/scripts`. Gelesen: `CLAUDE.md`,
E-054 bis E-059 samt Ergänzung 4–7, die Board-Abschnitte der drei Wellen, die Restpunkte O-R,
O-S, O-T, O-U, O-J, O-L und die Berichte T-089 bis T-098. Ausgangspunkt ist mein Bericht R-1.

**Ausgeführt.** `pnpm run typecheck` (einschließlich `typecheck:test` über fünf Konfigurationen)
Exitcode **0**. `packages/storage/test/migration-0012-pool-rule-restrict.test.ts` und
`repo-tags-folder-in-rule.test.ts` einzeln gefahren: 7/7 grün. Die vierzehn Wortlaute aus
`poolMovementSentence` habe ich zur Laufzeit gegen die Tabelle im Board gehalten, statt sie zu
lesen (`node --experimental-strip-types`, acht Stichproben, alle zeichengleich). Die
Randfälle von `path.relative` habe ich gegen `path.win32` gemessen (UNC, zwei Server, zwei
Laufwerke, Groß-/Kleinschreibung, Geschwisterordner `b-alt`). `pnpm check`, `proof:*` und
`test:e2e` habe ich auftragsgemäß **nicht** laufen lassen; Port 17843 blieb unberührt, kein
fremder Prozess wurde beendet.

Gewichte: `blockierend` (hält die Freigabe auf), `wesentlich` (vor dem Zusammenführen),
`Hinweis`.

---

## 1. Die vier Blockierer aus R-1 — alle vier erledigt, jeder gemessen

**R-1 Befund 1, `TagFolderPort.remove` und der entkernte Ordnerterm: erledigt.**
`packages/storage/src/sqlite/repo-tags.ts:509-528` fragt jetzt nach der Regel und weist mit
`tag_in_use` samt den Namen der betroffenen Regeln in `details` ab. Darunter liegt Migration
0012 (`packages/storage/migrations/0012_pool_rule_restrict.up.sql:84-85`): `tag_id` und
`folder_id` stehen auf `ON DELETE RESTRICT`, wie `status_id` seit 0011. Die Rückrichtung ist
symmetrisch und benennt, was sie wieder aufmacht. Der Prüffall misst das an der rohen Datenbank
und nicht am Port: `DELETE FROM tag_folder` wirft, die Regel behält ihren Term, nach dem Rückweg
verschwindet der Term wieder (`ruleCountFor(pool.id)` fällt auf 0, mit einem Kommentar, der
genau das als die gefährliche Richtung benennt), und nach dem erneuten Vorwärtslauf sind
`integrity_check` und `foreign_key_check` sauber. Das ist die Bauart, die ich verlangt habe, und
sie ist besser belegt als verlangt.

**R-1 Befund 2, die festgeschriebene Buchung bei gemeldetem Fehlschlag: erledigt.**
`apps/local-api/src/routes/addin/service.ts:596-610` führt `AbortBooking` ein,
`:715` wirft sie, wenn `clearDone` scheitert, und `:754-762` fängt sie außerhalb von
`inTransaction` und übersetzt sie dort in `rejected`. Der Kommentar, der vorher das Gegenteil
behauptete, ist durch eine ausgeschriebene Begründung ersetzt. Die beiden Zweige, die weiterhin
zurückgeben statt zu werfen (`not_found` bei `:670`, `!created.ok` bei `:705`), stehen vor jedem
Schreibvorgang — dort gibt es nichts zurückzunehmen, und der Kommentar sagt es.

**R-1 Befund 3, E-056 wirkt nicht für reine Kanban-Spalten: erledigt.**
Die Rechnung liegt jetzt in `apps/local-api/src/usecases/pool-movement.ts:146` und fragt
`unit.pools.list('all')`. Wichtiger als der Fix ist, dass der Prüfpfad ihn sehen kann:
`apps/outlook-addin/scripts/fixtures.mjs:440-444` wertet das Flächenargument aus, und unter den
Regeln stehen jetzt eine mit `placement: 'board'` (`:975`) und eine mit `'both'` (`:993`). Die
Einschränkung, unter der ich R-1 abgeschlossen habe, ist damit aufgehoben.

**R-1 Befund 4, 186 MB Bauerzeugnis in der Historie: erledigt.**
`git rev-list --objects` über `status-als-regelterm`, `main`, `kanban-regelspalten`,
`release-workflow`, `fix/windows-sidecar-bundle-check` und die drei gleichnamigen
Fernzweige findet die AppImage- und `.deb`-Blobs **nirgends** mehr. `release/` steht in
`apps/desktop/.gitignore`. Erreichbar sind sie ausschließlich über den lokalen Sicherungszweig
`backup/status-als-regelterm-vor-filter`; siehe Hinweis H-6.

## 2. Die sechs „sollte"-Befunde aus R-1

| Befund | Stand |
|---|---|
| `ports.ts` — tote `resolveRule`/`resolveExcluded` mit falscher Begründung | **erledigt.** Die Begründung an `packages/storage/src/ports.ts:473-482` ist berichtigt und sagt selbst, dass es in `src` keinen Aufrufer mehr gibt; die Streichung ist als O-I an den Orchestrator abgegeben, statt sie halb zu tun. |
| Typwache gegen die sechste Achse deckt nur vier von sechs Stellen | **erledigt.** `packages/domain/src/board.ts:104` ist `BoardColumnRule extends MatchesPoolRule`, `:222` reicht die Regelseite als Ganzes weiter. `apps/local-api/src/usecases/pool-movement.ts:122` tippt die aufgelöste Regel als `MatchesPoolRule`. Eine sechste Achse wird jetzt an beiden Stellen rot. |
| `POST /pools` zählt jedes Feld einzeln auf | **erledigt.** `apps/local-api/src/routes/structure.ts:365-370` reicht `parsed.data` als Ganzes weiter; nur die drei markierten Listen stehen daneben. |
| `as never` in `structure.ts` | **erledigt.** Ersetzt durch `poolTerms` (`:107`) und `poolStatusIds` (`:126`), beide mit Eingabetyp aus `z.infer`. `patchOf` in `apps/local-api/src/http/input.ts` löst denselben Fall im `PATCH`, ohne Feld für Feld zu zählen. |
| OpenAPI-Beschreibung zu `DELETE /todo-statuses/{statusId}` nennt den vierten Grund nicht | **erledigt.** `apps/local-api/openapi/takt-local-api.yaml:1274-1298`, samt dem Vertrag über `details`. |
| `PoolCompletionFilter`/`PoolExportFilter` doppelt in `apps/web` | **halb erledigt.** Die beiden genannten Typen kommen jetzt aus `@takt/domain`. `ThemeSetting` und `PoolMatchMode` nicht — siehe W-4. |

Beide Hinweise aus R-1 stehen unverändert: die Paketbeschreibung `apps/web/package.json:6` ist
nachgezogen (erledigt), die Schranke `depth < 1000` steht weiterhin dreimal als nackte Zahl
(`packages/storage/src/sqlite/repo-tags.ts:258`, `:274`, `:979`) — H-5.

---

## 3. E-058: eine Rechnung, ein Satz — gehalten

Ich habe die Frage so geprüft, wie sie gestellt war: Gibt es noch eine **zweite**
Bewegungsrechnung oder einen **zweiten** Wortlaut?

Nein, an keiner der beiden Flächen. `poolNamer`, `bookingStates`, `NamedPoolRule`,
`poolSentence`, `bookingPoolSentence`, `CARD_STAYS` und `StructureContext.poolsContaining` sind
ersatzlos gelöscht; die Namen kommen nur noch in Kommentaren vor, die erklären, warum sie weg
sind. Die Rechnung steht einmal (`apps/local-api/src/usecases/pool-movement.ts:146`), der Satz
einmal (`packages/domain/src/pool-movement.ts:217`), und beide Flächen rufen ihn:
`apps/outlook-addin/src/duplicate/reopen.ts:147/164/178`,
`apps/outlook-addin/src/ui/TaskPane.tsx:705`, `apps/web/src/app/TimerContext.tsx:122` und `:323`.

Zwei Einzelheiten, die ich ausdrücklich nachgesehen habe:

**Der Wegfall von `poolsContaining` ist mehr als eine Aufräumarbeit.** Die alte Fassung trug in
`StructureContext` ein `catch { return null }` je Pool und ein `slice(0, 12)` — ein verschluckter
Fehler und eine stille Kürzung in derselben Funktion. Beides ist mit ihr verschwunden, und die
Begründung im Kommentar (`apps/web/src/app/StructureContext.tsx:103-119`) benennt den
grundsätzlichen Mangel richtig: Der alte Weg lief **nach** der Handlung und konnte `leaves`
nicht kennen.

**`null` heißt überall „keine Fläche".** Ich habe den gesamten geänderten Baum nach `?? ''`
abgesucht. An keiner Stelle wird ein Bewegungssatz mit einem leeren String aufgefüllt;
`withMovement` (`TimerContext.tsx:132`) und `TaskPane.tsx:706` lassen die Fläche ganz weg. Das
einzige `?? ''` in der Nähe steht in `listPools` (`pool-movement.ts:151`) und in
`enumerateGerman` (`errorText.ts:66`) — beide über einer Liste, deren Leerfall die Aufrufstelle
vorher abfängt.

**Der Wortlaut stimmt zeichengenau.** Acht der vierzehn Sätze zur Laufzeit gegen die Tabelle bei
T-093 gehalten, einschließlich der Mehrfachaufzählung („in „A“, „B“ und „C“") und des
`null`-Falls bei `booking`. Kein Gattungswort, „erscheint sonst nirgends" statt „in keinem
anderen", beide Flächen im treffer­losen Satz. E-058 Punkte 1, 2, 4, 5 und 6 sind umgesetzt.

---

## 4. Wesentliche Befunde

```
packages/storage/src/sqlite/repo-tags.ts:213   wesentlich   domain-dev
```
**Der Löschdialog für ein Tag nennt die Regel nicht beim Namen — obwohl drei andere Stellen es
zusagen.** `TagPort.remove` gibt im Regelfall `taktError('tag_in_use', …)` ohne `details`
zurück. `TagFolderPort.remove` (`:520-527`) und `TodoStatusPort.remove`
(`repo-statuses.ts:310-316`) liefern dort die Namen. Die Oberfläche liest sie:
`apps/web/src/screens/TagsScreen.tsx:451` ruft `errorMessageWithRules(cause)` für **Tag und
Ordner** — beim Ordner erscheint „Betroffen ist Regel „Ost“.", beim Tag nichts. Der Kopf von
Migration 0012 (`0012_pool_rule_restrict.up.sql:49-51`) sagt wörtlich: „`TagPort.remove` und
`TagFolderPort.remove` fragen vorher und antworten fachlich (`tag_in_use`, 409, mit den Namen der
betroffenen Regeln in `details`)." Für die erste der beiden stimmt das nicht. **Fix:** dieselbe
Abfrage wie im Ordnerfall, hier über `WHERE r.tag_id = ?` und ohne Einschränkung auf `role`
(ein Tag kann erforderlich **und** ausgeschlossen sein), `details: rows.map(poolReference)`. Die
Todos- und die Standard-Tag-Bedingung bleiben, wie sie sind — dort gibt es keine Regel zu nennen.

```
packages/storage/src/sqlite/repo-tags.ts:192   wesentlich   domain-dev
packages/storage/src/sqlite/repo-statuses.ts:277   wesentlich   domain-dev
```
**Zwei Begründungen behaupten das Gegenteil dessen, was Migration 0012 hergestellt hat.** An
`repo-tags.ts:192` steht: „Die Fremdschlüssel stehen auf `ON DELETE CASCADE` … Sie würde in
diesem Fall nicht abweisen, sondern gehorchen." An `repo-statuses.ts:277`: „`pool_rule.tag_id`
steht auf ON DELETE **CASCADE** … Bei den Tags ist die Prüfung hier die einzige Wache." Seit
0012 steht `tag_id` auf `RESTRICT`, und die Prüfung ist die **erste** von zwei Wachen. Das ist
derselbe Befundtyp wie R-1s Befund über `ports.ts:419`, und ich führe ihn aus demselben Grund
als wesentlich: In diesem Bestand tragen die Kommentare die Begründung, und ein Kommentar, dem
jemand glaubt, ist teurer als gar keiner — hier glaubte man, die Datenbank gehorche still, und
baute den nächsten Schreibpfad danach. **Fix:** beide Absätze auf 0012 umschreiben; an
`repo-tags.ts` bleibt der Satz richtig, dass hier **vorher** gefragt wird, nur die Begründung
wechselt von „sie würde gehorchen" zu „sie würde mit einem Fremdschlüsselfehler abweisen, und
der ist kein Satz für einen Benutzer".

```
apps/local-api/src/usecases/timer.ts:511   wesentlich   domain-dev
apps/local-api/src/usecases/timer.ts:294   wesentlich
apps/local-api/openapi/takt-local-api.yaml:2043   wesentlich
```
**O-R: Der Dienst wirft die Antwort der Domäne weg und setzt eine falsche an ihre Stelle.** Das
ist mehr als eine zu weite Aufzählung in der Schnittstellenbeschreibung.
`decideOrphanedTimer` (`packages/domain/src/time-entry.ts:507`) unterscheidet die beiden Fälle
bereits und liefert für die Benutzerwahl „verwerfen" ausdrücklich
`reason: 'orphan_discarded'`. `resolveOrphanedTimer` liest diesen Wert und antwortet zwei
Zeilen später mit dem festen Literal `'timer_too_short'` — also „der Timer war zu kurz", wo der
Benutzer gerade selbst entschieden hat. Der zweite `discarded`-Zweig (`:527`) ist der echte
Zu-kurz-Fall, und beide sind danach ununterscheidbar. `StopTimerResult` (`:294`) engt den Typ auf
den einen Wert ein, `apps/web/src/api/types.ts:614` zieht diese Enge nach, und die OpenAPI
verspricht weiterhin beide Werte. Drei Fassungen, drei verschiedene Aussagen.

**Empfehlung: unterscheiden, nicht kürzen.** Die Aufzählung zu kürzen hieße, eine Auskunft
wegzuwerfen, die die Domäne bereits ausrechnet, und die Oberfläche hat für sie eine Verwendung.
`apps/web/src/app/TimerContext.tsx:605-612` sagt heute in beiden Fällen „Buchung verworfen. Es
ist keine Zeit gebucht worden." — beim gewählten Verwerfen ist das die Bestätigung einer
Handlung, beim Zu-kurz-Fall die Erklärung eines Fehlschlags, den der Benutzer nicht gewollt hat
(er hatte „bis zum Lebenszeichen" gewählt, und es gab kein Lebenszeichen). Nur der zweite Fall
braucht einen zweiten Satz. Konkret: `StopTimerResult` auf
`reason: 'timer_too_short' | 'orphan_discarded'` erweitern, `:511` `decision.reason` durchreichen,
`:407` und `:527` bei `'timer_too_short'` belassen, `apps/web/src/api/types.ts` nachziehen und
im `discarded`-Zweig von `confirmOrphan` verzweigen. `POST /timer/stop` behält seinen `const`
(`yaml:1840`) — dort gibt es den zweiten Fall nicht. Das Add-in ist nicht betroffen: Es kennt
weder Route noch Feld. Hoheit: domain-dev für `usecases/timer.ts` und die OpenAPI, frontend-dev
für `api/types.ts` und den Toast.

```
apps/web/src/lib/labels.ts:86    wesentlich   frontend-dev
apps/web/src/lib/labels.ts:239   wesentlich   frontend-dev
```
**Die letzte Hälfte des R-1-Befundes über doppelte Aufzählungen — und die Begründung stimmt
nicht mehr.** Der Kopf der Datei (`:36-40`) sagt: „`ThemeSetting` und `PoolMatchMode` fuehrt die
Domaene bis heute nur als Inline-Vereinigung an ihrem Feld (`settings.ts:37`, `tag.ts:283`); es
gibt dort keinen Namen zum Importieren. Sobald sie einen bekommen, gehoeren beide in die Liste
darueber." Sie haben ihn seit T-093 bekommen: `packages/domain/src/settings.ts:26`
(`export type Theme`) und `packages/domain/src/tag.ts:146` (`export type PoolMatchMode`), beide
über `packages/domain/src/index.ts` ausgeführt. Die Bedingung, die der Kommentar selbst nennt,
ist eingetreten; der Kommentar ist stehengeblieben. Die Richtung, die weh tut, ist unverändert
die aus R-1: Bekommt die Domäne einen vierten Modus oder ein viertes Erscheinungsbild, bleibt
die Fassung in `apps/web` **enger**, jede Zuweisung bleibt gültig, nichts wird rot, und
`POOL_MATCH_MODE_LABEL`/`THEME_LABEL` liefern `undefined`, wo ihr Typ `string` verspricht.
**Fix:** beide in den bestehenden `import type … from "@takt/domain"` aufnehmen und
re-exportieren (`Theme as ThemeSetting`, wenn der Name in `apps/web` bleiben soll), die lokalen
Typzeilen streichen, den Absatz `:32-40` auf „acht Aufzählungen, eine bleibt hier" umschreiben
und die Begründung an `:234` entfernen.

```
apps/desktop/scripts/verify-node-checksums.mjs:91   wesentlich   frontend-dev
```
**Ein Prüflauf, der weniger prüft, als sein Kopf zusagt — und grün meldet.** Der Kopf (`:73`)
sagt: „Findet er keine sechs Einträge, ist das ein Fehler und keine Fußnote: Dann hat sich der
Aufbau der Datei geändert, und dieser Lauf prüfte still weniger als er behauptet." Die Prüfung
darunter fängt aber allein den Fall **null**. Fällt die Tabelle in `sidecar-runtime.mjs` von
sechs auf zwei Einträge, oder passt der reguläre Ausdruck nach einer Umformatierung nur noch auf
vier, dann meldet der Lauf „4 von 4 Einträgen stimmen überein", endet mit 0 und schreibt
„Damit ist belegt, dass der Bau unter Windows und macOS gegen dieselbe Quelle prüft" — für
Plattformen, deren Zeile er gar nicht angesehen hat. Ich habe nachgezählt: heute greift der
Ausdruck auf alle sechs. Das ist genau die Bauart, die T-089 nebenan bereits eingeführt hat
(`packages/domain/scripts/check-export-boundary.mjs:218-219`, `MIN_EXPORT_SOURCES` und
`MIN_DEEP_IMPORT_SOURCES`, mit derselben Begründung im Kommentar). **Fix:** dieselbe Untergrenze
hier, `const EXPECTED_ARCHIVES = 6` mit `fail()` bei Abweichung — oder besser gegen die Liste der
unterstützten Tripel aus `sidecar-runtime.mjs` statt gegen eine Zahl, damit eine siebte Plattform
den Lauf nicht bremst, sondern erfasst wird.

```
apps/web/src/app/router.ts:134   wesentlich   frontend-dev
apps/web/src/app/useRoute.ts:96
```
**Das erneute Ansteuern hängt an einer Browsereigenschaft, die nur in Chromium gemessen wurde.**
Der Zuschnitt selbst ist richtig und die Ereignistabelle in `useRoute.ts:33-40` ist die beste
Sorte Beleg: gemessen statt vermutet. Die Messung lief aber in Chromium (Playwright), und die
Hülle, für die Takt ausgeliefert wird, benutzt drei verschiedene Webviews — WebView2 (Chromium,
Windows), **WebKitGTK** (Linux, und die `.AppImage`/`.deb` sind die Erzeugnisse, die heute
vorliegen) und WKWebView (macOS). Die Zeile, auf der alles ruht — `location.assign` auf die
**identische** Adresse feuert `popstate` — ist an einer Stelle in der HTML-Spezifikation, an der
die Umsetzungen erfahrungsgemäß auseinandergehen: Eine Navigation auf eine gleiche URL wird als
`replace` behandelt, und ob dabei ein `popstate` entsteht, steht dort nicht so eindeutig, wie es
die Tabelle nahelegt. Geht es schief, ist die Wirkung still: Der Klick auf den Navigationseintrag,
auf dem man schon steht, tut wieder nichts, und niemand merkt es — bis der nächste
End-zu-End-Test unter Chromium wieder grün meldet. Dazu kommt eine zweite Abhängigkeit von der
Reihenfolge: `onPopState` erkennt den echten Wechsel daran, dass `popstate` **vor** `hashchange`
kommt (`useRoute.ts:98`); käme es umgekehrt, zählte jeder Wechsel zusätzlich als Wiederbesuch und
löste doppelt Anfragen aus. **Fix:** die Ereignisse als Ergänzung behalten, den Weg aus dem
Programm aber nicht daran hängen — `navigate()` vergleicht das Ziel mit
`window.location.hash` und löst bei Gleichheit den Wiederbesuch selbst aus (eigenes Ereignis oder
ein Zähler im Router, den `useRoute` liest). Dann ist der Klick auf den eigenen Eintrag auf jeder
Engine deterministisch, und `popstate` deckt weiterhin die Wege ab, die nicht durch `navigate()`
gehen (`page.goto()` im End-zu-End-Test, ein Verweis im Dokument).

```
apps/web/src/app/useDataFreshness.ts:73   wesentlich   frontend-dev
apps/web/src/app/useAsync.ts:35
```
**„Es blinkt nichts" stimmt für die eine Hälfte und nicht für die andere.** Zur gestellten
Frage: Es sind keine doppelten Anfragen — `reload()` holt die Struktur, `bump()` die Ansichten,
zwei verschiedene Endpunkte, und ein Rennen zwischen ihnen gibt es nicht, weil `useAsync` mit
`generation` jede überholte Antwort verwirft (`useAsync.ts:44/49`). Auch die beiden Anlässe
überschneiden sich nicht: Ein Klick auf den eigenen Navigationseintrag ist kein
`visibilitychange`, und umgekehrt.

Der Befund liegt woanders. `bump()` erhöht `version`, und `version` steht in den
**Abhängigkeiten** von `useAsync` (`BoardScreen.tsx:128` und ebenso in den übrigen Ansichten).
Der Weg über die Abhängigkeiten ruft `run(false)` (`useAsync.ts:57`), und `run(false)` setzt den
Zustand auf `{ status: "loading" }` und **verwirft den vorhandenen Wert** (`:36-40`). Der
schonende Weg mit `refreshing: true` steht nur `reload()` offen. Wirkung: Jedes Zurückwechseln
ins Takt-Fenster — aus Outlook, aus einem anderen Programm, nach dem Wiederherstellen des
Fensters — wirft die gerade angesehene Liste auf ihre Platzhalterflächen zurück, bevor sie
dieselben Daten wieder einsetzt. Das ist die Bewegung, die der Kommentar an `:60-62` ausdrücklich
ausschließt („`reload()` behält dabei den vorhandenen Inhalt stehen … es blinkt nichts"), und
`visibilitychange` macht aus einem seltenen Fall einen alltäglichen. **Fix:** `version` nicht über
die Abhängigkeiten führen, sondern über den schonenden Weg — `useAsync` bei einer reinen
Änderung von `version` `run(true)` nehmen lassen, oder in `useDataFreshness` statt `bump()` die
`reload()` der sichtbaren Ansicht auslösen. Ob das Blinken hinnehmbar ist, ist eine Frage an
R-2a; dass der Kommentar es ausschließt und der Code es tut, ist eine an den Code.

---

## 5. O-S — wohin das Zustandspaar gehört

Gefragt war, ob `bookingMovementStates(todo, entries)` in `usecases/pool-movement.ts` der
richtige Ort ist. **Halb.** Der Vorschlag löst die kleinere Hälfte und läßt die größere stehen.

Die vier Stellen sind nicht vier gleichartige. Zwei bilden **wörtlich dasselbe** Paar:
`apps/local-api/src/routes/addin/service.ts:312-319` (Duplikatsuche, Ankündigung) und
`:735-741` (`bookOnTodo`, Bestätigung) — beide lesen zwei `sumSeconds`, bauen daraus dasselbe
`before` und legen `BOOKING_EFFECT` darüber. Die anderen zwei sind verschiedene Handlungen:
`usecases/timer.ts:231-247` (`movementOfStart`, mit `hasOpenEntries: hadOpenEntries ||
bookedOnThisTodo` — der Start erzeugt nur im Verdrängungsfall eine Buchung) und
`:366-372` (`movementOfBooking`, `false` auf `true`, aus `exportPresence` statt aus `sumSeconds`).
Die letzten beiden zusammenzuziehen wäre falsch; sie sagen Verschiedenes.

Was an allen vier Stellen **dasselbe** ist, ist die fachliche Aussage: *Eine abgeschlossene
Buchung hebt „Erledigt" auf (A-2.5) und erzeugt eine offene Buchung (E-032).* Diese Aussage
steht heute als `BOOKING_EFFECT` in `apps/local-api/src/routes/addin/service.ts:246` — also im
Routenbaum des Add-ins, in der Hoheit des integration-dev. `usecases/timer.ts` gehört dem
domain-dev, kann sie von dort nicht benutzen, ohne die Grenze zu überschreiten, und schreibt sie
deshalb ein zweites Mal aus. Das ist die Doppelung, die zählt, und sie ist genau die Sorte, die
CLAUDE.md verbietet: dieselbe Fachlogik zweimal, in zwei Hoheiten.

**Empfehlung, zweiteilig.**

1. **Die reine Wirkung gehört in `packages/domain`.** Sie ist eine Abbildung von einem Zustand
   auf einen Zustand, ohne HTTP und ohne SQL — dieselbe Bauart wie `matchesPool` und
   `poolMovementSentence`, und in dieser Runde ist bereits zweimal bewiesen worden, dass eine
   solche Aussage nur an einem Ort haltbar ist. Konkret: `PoolMovementState` aus
   `usecases/pool-movement.ts:80` wandert nach `packages/domain/src/pool-movement.ts` (sie ist
   die Kartenseite von `matchesPool` ohne die Kennung, also ohnehin eine Domänengröße), und
   daneben steht `stateAfterBooking(before): PoolMovementState`. Kommt eine sechste Achse dazu,
   wird die Domäne rot statt der Add-in-Route.
2. **Das Lesen des Bestands bleibt im Anwendungsfall.** `bookingMovementStates(unit, todo)` in
   `usecases/pool-movement.ts` braucht einen Port und darf deshalb nicht in die Domäne; es faßt
   die beiden Add-in-Stellen zusammen und ruft `stateAfterBooking`. `movementOfStart` und
   `movementOfBooking` in `timer.ts` behalten ihre eigenen `before`-Fassungen — sie lesen aus
   verschiedenen Quellen — und rufen dieselbe Domänenfunktion für das `after`.

Reihenfolge: Schritt 1 ist domain-dev allein, Schritt 2 berührt `usecases/pool-movement.ts`
(domain-dev) und `routes/addin/service.ts` (integration-dev) und gehört damit in zwei Aufgaben
einer Welle, nicht in eine. Das ist derselbe Zuschnitt, den O-T verlangt, und beide sollten
zusammen geplant werden.

---

## 6. T-098 — `isInside` und der Prüfsummenlauf

Die Funktion ist richtig gebaut, und die Begründung, warum `path.relative` und nicht
`folder + sep`, trifft. Ich habe die Randfälle nachgemessen statt sie zu glauben:

| Fall | `path.win32.relative` | `isInside` |
|---|---|---|
| UNC, gleiche Freigabe | `b` | wahr — richtig |
| UNC, zwei Server | absolut | falsch — richtig, über die `isAbsolute`-Wache |
| zwei Laufwerke `D:` / `C:` | absolut | falsch — richtig |
| Laufwerksbuchstabe `D:` gegen `d:` | `b` | wahr — richtig |
| Geschwister `b` gegen `b-alt` | `..\b-alt\c` | falsch — richtig, dafür steht die `..`-Zeile |
| gemischte Trenner, abschließender Trenner | `c` | wahr — richtig |

Groß- und Kleinschreibung: `path.posix.relative('/a/B', '/a/b/c')` gibt `../b/c`, also
`isInside` falsch — richtig für POSIX, wo `B` und `b` zwei Ordner sind. Der Aufrufer
(`build-sidecar.mjs:266/272`) macht beide Seiten vorher absolut. Symlinks: `relative` rechnet
rein lexikalisch, und in einem pnpm-Arbeitsbereich sind die Paketverweise Symlinks. Das geht
heute auf, weil esbuild die Eingaben aufgelöst meldet; es ist eine Annahme, die niemand
aufgeschrieben hat.

```
apps/desktop/scripts/paths.mjs:68   Hinweis   frontend-dev
```
Die JSDoc verlangt absolute Pfade („Beide Angaben müssen absolut sein"), die Funktion prüft es
nicht. Zwei relative Pfade liefern dann eine Antwort, die zufällig richtig aussieht; ein
gemischtes Paar löst gegen `process.cwd()` auf und liefert eine, die es nicht ist. `scripts/**`
sieht kein Übersetzer (O-L), der Fehler bliebe also still — und still falsch gezählt zu haben
ist genau der Schaden, der T-098 ausgelöst hat. **Fix:** zwei Zeilen am Anfang, die bei
`!path.isAbsolute(...)` werfen. Dieselbe Haltung wie die Laufzeitwache in `matchesPool`.

`verify-node-checksums.mjs`: der Wechsel von `slice(repoRoot.length + 1)` auf `relative` ist
richtig und der Kommentar an `:170-175` nennt den Grund (`D:\` als Wurzel). Der eigentliche
Befund an dieser Datei steht oben unter „wesentlich".

---

## 7. Hinweise

```
apps/local-api/src/usecases/timer.ts:531   Hinweis   domain-dev
```
`void timestamp;` — `resolveOrphanedTimer` ruft `now(context)` am Anfang und wirft den Wert am
Ende ausdrücklich weg. Der Zeitpunkt wird tatsächlich nicht gebraucht (gebucht wird bis zum
Lebenszeichen). Eine Uhr abzufragen und die Antwort zu verwerfen, liest sich wie ein
Übriggebliebenes. **Fix:** `now(context)` streichen oder in einer Zeile begründen, warum es
stehenbleibt.

```
packages/domain/src/board.ts:222   Hinweis   domain-dev
```
`const { columnId, includeCompleted, ...axes } = column;` — der Kommentar darüber begründet
ausführlich, warum **nicht** gespreizt wird: Ein Spread gäbe die zwei Zusatzfelder mit, und
bekäme `MatchesPoolRule` je ein Feld gleichen Namens, ginge die Ansichtseinstellung als
Bedingung durch. Die Zerlegung hat den spiegelbildlichen Fall: Bekäme `MatchesPoolRule` ein Feld
namens `includeCompleted` oder `columnId`, würde es hier **still herausgeschnitten**, und die
Achse fiele weg — ohne dass etwas rot wird. Das ist derselbe Schaden in die andere Richtung, und
der Satz „fehlt darin etwas, sagt es der Übersetzer" deckt ihn nicht. **Fix:** entweder eine
Zeile, die den Fall benennt, oder die beiden Zusatzfelder in einem eigenen verschachtelten Feld
führen (`{ rule: MatchesPoolRule; columnId; includeCompleted }`), dann gibt es keine
Namenskollision mehr.

```
packages/storage/src/sqlite/repo-tags.ts:154 und 23 weitere Stellen   Hinweis   domain-dev
```
`err(outcome.error as never)` steht 24-mal in den Speicheradaptern. `outcome.error` ist ein
`TaktError` mit dem weiten Codebereich; die Portmethode sagt einen engen zu. `as never` trägt
das nicht nach, es schaltet die Prüfung ab — dieselbe Begründung, aus der R-1 das `as never` in
`structure.ts` beanstandet hat und aus der T-089 es dort ersetzt hat. Der Bestand ist älter als
dieser Zweig und der Schaden ist begrenzt (die HTTP-Schicht bildet Codes ohnehin allgemein ab),
deshalb nur ein Hinweis — aber die Stelle, die man beim nächsten Anfassen mitnimmt.

```
packages/storage/src/sqlite/repo-tags.ts:258, :274, :979   Hinweis   domain-dev
```
Unverändert aus R-1: `WHERE down.depth < 1000` steht dreimal als nackte Zahl. A-4.3 sagt
„beliebig tief"; jenseits der Schranke liefert die Auflösung stillschweigend zu wenige Tags, und
über E-057 würde daraus „dieser Ordner ist leer" — eine falsche Auskunft statt einer
Fehlermeldung. Praktisch unerreichbar. **Fix:** eine benannte Konstante, und im Erreichensfall
abbrechen statt kürzen.

```
apps/desktop/scripts/paths.mjs   Hinweis   Orchestrator
```
**Hoheit.** Während dieser Durchsicht lag die Datei zeitweise im Arbeitsbaum mit einer bewußt
zerstörten `isInside` („TEMPORÄR KAPUTT für T-100 Rotnachweis — nicht committen", Rückgabe über
einen `startsWith`-Vergleich mit angehängtem Schrägstrich — also genau der Fehler, den T-098
behoben hat). Sie ist inzwischen zurückgesetzt, nichts wurde festgeschrieben,
und der Zweck — den Prüffall rot sehen, bevor man ihm glaubt — ist die richtige Arbeitsweise.
Nach der Hoheitstabelle in CLAUDE.md gehört `apps/desktop/**` allerdings dem frontend-dev; der
unit-tester hat `apps/*/test/**`. Ich melde es, weil die Regel keine Ausnahme für „nur kurz"
kennt und ein solcher Zwischenstand genau einen unaufmerksamen Commit von der Auslieferung
entfernt ist. Vorschlag: Der Rotnachweis läuft über eine Kopie der Funktion im Prüffall oder über
`vi.mock`, nicht über die Quelldatei.

```
backup/status-als-regelterm-vor-filter   Hinweis   Orchestrator
```
Der Sicherungszweig hält die beiden Blobs weiterhin am Leben; `.git` misst 182 MB. Solange er
lokal bleibt, schadet er nichts. Er darf nur nie gepusht werden, und nach dem Zusammenführen
sollte er zusammen mit `git gc --prune=now` fallen — sonst wandern die 186 MB beim nächsten
`git push --all` doch noch hinaus.

---

## 8. Was ich geprüft habe und wozu es keine Arbeit gibt

Kurz, weil daraus nichts folgt. Kein `any`, keine Typzusicherung außer den oben genannten, kein
`@ts-ignore` und kein `@ts-expect-error` im gesamten geänderten Quelltext. Kein `catch` ohne
Behandlung: Die sieben Fangzweige in den Skripten sind einzeln begründet und laufen alle in einen
lauten Abbruch (`collect-release.mjs:149` gibt eine leere Liste zurück, `:185` bricht darauf ab),
`readJson` (`input.ts:142`) macht aus kaputtem JSON ein 422 statt eines 500, und die beiden
Fangzweige im Add-in-Dienst unterscheiden den geplanten Abbruch vom Wurf und werfen den zweiten
weiter. Die Transaktionsgrenzen halten: `bookOnTodo` schreibt atomar oder gar nicht (siehe oben),
`stopTimer` und `resolveOrphanedTimer` lesen den Vorzustand innerhalb derselben Klammer, in der
sie schreiben (`timer.ts:400`, `:517`), und `poolMovementNamer` läuft ausdrücklich innen, damit
er nicht einen Bestand beurteilt, den es zur Zeit der Handlung nicht mehr gab. Rundung auf
Viertelstunden, Base64 und der Exportstatuswechsel sind in dieser Runde nicht angefasst worden;
`check-export-boundary.mjs` bewacht die Notiz-Trennung jetzt mit zwei Untergrenzen statt mit
einem Fließtext. Oberflächentexte deutsch, Bezeichner englisch — durchgehend, auch in den neuen
Dateien.

---

## Urteil

**freigegeben.**

Alle vier blockierenden Befunde aus R-1 sind behoben, und drei davon sind besser belegt, als ich
verlangt hatte: Migration 0012 wird an der rohen Datenbank samt Rückweg gemessen, die Attrappe
des Add-ins wertet die Fläche aus, und die vierzehn Sätze stehen zeichengenau. Vier der sechs
„sollte"-Befunde sind erledigt, der fünfte zur Hälfte (W-4), der sechste bewußt an den
Orchestrator abgegeben (O-I). Kein Befund dieser Runde ist blockierend: Keiner führt zu
Datenverlust, zu einer doppelten Abrechnung oder zu einer Regel, die mehr trifft als gesagt.

Es blockiert **nichts**. Vor dem Zusammenführen einzuplanen sind die sieben wesentlichen
Befunde, in dieser Reihenfolge:

1. `repo-tags.ts:213` — die Regelnamen beim Tag, weil drei andere Stellen sie zusagen und die
   Oberfläche sie bereits liest. Eine Abfrage, zehn Zeilen.
2. `usecases/timer.ts:511` (O-R) — der Dienst darf die Antwort der Domäne nicht überschreiben.
3. `repo-tags.ts:192` und `repo-statuses.ts:277` — zwei Begründungen, die das Gegenteil der
   heutigen Lage behaupten.
4. `labels.ts:86/239` — die zweite Hälfte des R-1-Befundes, jetzt mit einer Begründung, deren
   eigene Bedingung eingetreten ist.
5. `verify-node-checksums.mjs:91` — die Untergrenze, die nebenan schon steht.
6. `router.ts:134` — den Wiederbesuch nicht von einer in einer Engine gemessenen
   Ereigniseigenschaft abhängen lassen.
7. `useDataFreshness.ts:73` — entweder blinkt es nicht, oder der Kommentar sagt, dass es blinkt.

O-S beantworte ich mit einer Ergänzung zum Vorschlag aus T-092: Die Rechnung gehört in
`usecases/pool-movement.ts`, die **Wirkung** (`BOOKING_EFFECT`) aber in `packages/domain` —
sie ist Fachlogik, sie steht heute in fremder Hoheit, und genau deshalb schreibt `timer.ts` sie
ein zweites Mal aus.
