Aufgabe: T-103 — End-to-End-Pflege

Status: fertig

Artefakte:

```
tests/e2e/support/services.ts                  GEÄNDERT — lokaler Typalias
                                                ChildProcessByStdio<null, Readable, Readable>
                                                statt ChildProcessWithoutNullStreams für
                                                startWeb()/RunningServices.web (Typfehler 1/4)
tests/e2e/support/web-build-services.ts        GEÄNDERT — dieselbe Reparatur für
                                                startWebPreview()/stopChild() (Typfehler 2/4)
tests/e2e/support/global-setup-outlook-build.ts GEÄNDERT — dieselbe Reparatur für
                                                startTaskpane() (Typfehler 3/4)
tests/e2e/tag-input.spec.ts                    GEÄNDERT — noCreateOffer(): ReturnType<typeof
                                                expect> → Promise<void> (Typfehler 4/4)
tests/e2e/tag-folder-rule-lock.spec.ts         GEÄNDERT — H-7: vier new RegExp(name) durch
                                                { name } ersetzt
tests/e2e/tags-folders.spec.ts                 GEÄNDERT — H-7: fünf new RegExp(name) durch
                                                { name } ersetzt (davon eine in expandFolder())
tests/e2e/support/api.ts                       GEÄNDERT — neue Typen/Helfer für den E-060/O-R-
                                                Entwurf: TodoDoneResult, setTodoDoneWithMovement,
                                                reopenTodoWithMovement (ungenutzt, für die
                                                künftige Spezifikation); ResolveOrphanedTimerResult
                                                .reason von string auf 'timer_too_short' |
                                                'orphan_discarded' geschärft (O-R)
docs/testplan.md                               GEÄNDERT — neuer Abschnitt 18: typecheck:e2e
                                                (vier Fehler, Ursache, Behebung), H-7
                                                (Befund, Entscheidung „ohne RegExp“, Ergebnis)
```

Nicht angefasst: `apps/**`, `packages/**` — fremde Hoheit, mitten im Umbau (T-101/T-102, Welle E).
Keine Spezifikationsdatei für E-060/O-R angelegt — wie beauftragt nur als Entwurf unten und nicht
eingecheckt.

Zusammenfassung:

`pnpm run typecheck:e2e` steht auf Exitcode 0 (vier Fehler behoben, keiner davon hat das Verhalten
eines Testfalls geändert). H-7 ist behoben: `new RegExp` aus zur Laufzeit erzeugten Namen ist aus
`tag-folder-rule-lock.spec.ts` und — von R-3a nicht namentlich benannt, aber mit derselben Bauart —
aus `tags-folders.spec.ts` verschwunden, ersetzt durch reine Zeichenketten, weil
`page.getByRole(role, { name })` bei einer Zeichenkette ohnehin case-insensitive als Teilstring
sucht — dieselbe Wirkung wie das bisherige unverankerte `RegExp`, ohne dessen
Sonderzeichen-Risiko. Für E-060 und O-R liegt unten ein ausgearbeiteter Testentwurf mit Vorbedingungen,
Schritten, Selektoren und den aus der Domänenfunktion gezogenen Sätzen; dazu drei neue,
ungenutzte Helfer/Typen in `support/api.ts`. Während der Messung sind zwei fremde, dem laufenden
Umbau zuzuordnende Fehlschläge aufgetreten (unten unter „Fremde Fehlschläge" belegt), keiner
davon behoben.

## Punkt 1 — `pnpm run typecheck:e2e`

Vier Fehler, wie im Auftrag benannt, alle auf denselben zwei Ursachen:

**Drei `ChildProcessByStdio`-Fehler** (`services.ts:160`, `web-build-services.ts:170`,
`global-setup-outlook-build.ts:90`). Jede der drei Funktionen (`startWeb`, `startWebPreview`,
`startTaskpane`) ruft `spawn(..., { stdio: ['ignore', 'pipe', 'pipe'] })` auf und war mit
`ChildProcessWithoutNullStreams` beschriftet — dieser Typ verlangt ein beschreibbares `stdin`
(`stdin: Writable`), die tatsächliche `stdio`-Angabe liefert aber `stdin: null`. Unter
`exactOptionalPropertyTypes` (`tsconfig.base.json`) ist das kein Formalismus, sondern ein echter
Widerspruch. Behoben mit einem lokalen Typalias je Datei:

```ts
type ChildProcessWithoutStdin = ChildProcessByStdio<null, Readable, Readable>;
```

— genau der Typ, den `@types/node` für `spawn` mit dieser `stdio`-Reihenfolge zurückgibt (geprüft
gegen die Überladungen in `node_modules/@types/node/child_process.d.ts`). `RunningServices.web`
(`services.ts`) und `stopChild()` (`web-build-services.ts`) sind entsprechend mitgezogen.
`startLocalApi()` bleibt unverändert bei `ChildProcessWithoutNullStreams` — ihr `spawn` läuft mit
`stdio: ['pipe', 'pipe', 'pipe']`, also mit echtem `stdin`, und der Typ stimmte dort bereits.

**Ein Rückgabetyp-Fehler** (`tag-input.spec.ts:78`). `noCreateOffer` war mit
`ReturnType<typeof expect>` beschriftet; der tatsächliche Rückgabewert (`expect(...)
.toHaveCount(0)`) ist ein `Promise<void>`, kein `Matchers`-Objekt. Beschriftung geändert.

**Nachweis:**

```
$ pnpm run typecheck:e2e
$ tsc -p tests/e2e/tsconfig.json
EXIT=0
```

Mehrfach reproduziert (vor und nach den H-7- und `support/api.ts`-Änderungen). Kein Eingriff in
`tests/e2e/tsconfig.json` — die gehört laut Auftrag dem Orchestrator, und sie hat für diese vier
Fehler nichts gebraucht (keine zusätzliche `lib`, kein zusätzlicher Typ).

## Punkt 2 — H-7: `new RegExp` aus Namen

**Befund.** `tag-folder-rule-lock.spec.ts` baute an vier Stellen
`page.getByRole('treeitem', { name: new RegExp(lockedFolder.name) })` — ein zur Laufzeit aus einem
Testnamen erzeugtes Muster, ohne die im regulären Ausdruck wirksamen Zeichen
(`. * + ? ^ $ { } ( ) | [ ] \`) zu maskieren. Mit den heutigen, selbst erzeugten Namen
(`E2E-…-${Date.now()}`) blieb das folgenlos, ist als Bauart aber der falsche Weg: Ein Name mit
einem dieser Zeichen hätte ein anderes Muster ergeben als gemeint. Dieselbe Bauart stand,
von R-3a nicht namentlich benannt, zusätzlich fünfmal in `tags-folders.spec.ts` (`grep -rn
"new RegExp(" tests/e2e/` vor der Änderung, neun Treffer in zwei Dateien).

**Entscheidung: „ohne RegExp prüfen", nicht maskieren.** `page.getByRole(role, { name })`
vergleicht bei einer Zeichenkette laut Playwright-Vertrag ohnehin case-insensitive als Teilstring
(„By default, matching is case-insensitive and searches for a substring" —
`node_modules/.../playwright-core/types/types.d.ts`) — dieselbe Wirkung, die ein unverankertes
`new RegExp(name)` ohne Schalter auch hatte (nur zusätzlich case-sensitiv), ohne dessen
Sonderzeichen-Risiko. Maskieren hätte denselben Zweck mit mehr Code erreicht; da an keiner der
neun Stellen tatsächlich ein regulärer Ausdruck gebraucht wird (kein Anker, keine Gruppe, keine
Wiederholung), ist der Verzicht auf `RegExp` die einfachere und zugleich sicherere Lösung. Alle
neun Stellen sind jetzt `{ name: lockedFolder.name }` bzw. (in `expandFolder`, wo `name` bereits
der Parametername ist) `{ name }` — kein `RegExp`-Import mehr in beiden Dateien.

**Nachweis:**

```
tag-folder-rule-lock.spec.ts   4/4 bestanden (isoliert über --grep "tag-folder-rule-lock",
                                zweifach reproduziert)
tag-input.spec.ts              5/5 bestanden (isoliert über --grep "tag-input", zweifach)
tags-folders.spec.ts           2/2 bestanden, isoliert dreifach reproduziert; im Verbund mit
                                tag-input.spec.ts einmal mit einem Timeout beim ersten Klick auf
                                den Knopf „Verschieben" (60 s überschritten), im selben Lauf beim
                                automatischen Wiederholungsversuch grün — isoliert danach
                                dreimal hintereinander grün, jedes Mal unter 2,5 s. Zugeordnet
                                der parallel auf derselben Maschine laufenden Last (mehrere
                                Agenten gleichzeitig, siehe playwright.config.ts-Kopf), nicht
                                der Umstellung: Der betroffene Testschritt (Klick auf
                                „Verschieben") berührt keine der geänderten Zeilen.
```

## Punkt 3 — Entwurf für E-060 und O-R (nicht eingecheckt)

T-101 und T-102 liefen während dieser Aufgabe parallel an genau den Stellen, die diese Entwürfe
brauchen (`apps/local-api/src/usecases/{timer,pool-movement}.ts`,
`apps/web/src/{app/TimerContext.tsx,screens/TodoDetailScreen.tsx,lib/movement.ts}`,
`packages/domain/src/{pool-movement,time-entry}.ts`, `packages/storage/src/sqlite/repo-tags.ts`).
Ich habe **nur gelesen**, nichts angefasst, und die Entwürfe unten daraus informiert — ausdrücklich
als Zwischenstand gekennzeichnet, nicht als Vertrag. Sobald beide Aufgaben als „fertig" auf dem
Board stehen, sind diese Entwürfe in echte Spezifikationsdateien zu überführen und gegen den
tatsächlich gelieferten Wortlaut zu prüfen, nicht gegen das, was unten vermutet wird.

### Entwurf A — TP-EXPST-13: Toast nach „Erledigt"/„Wieder offen" trägt den Bewegungssatz (E-060)

**Datei (Vorschlag):** `tests/e2e/done-movement-announcement.spec.ts`, Bauart wie
`timer-stop-announcement.spec.ts` (dieselbe Familie von Vorbedingungen: Pool/Spalte anlegen, Timer-
und Detailansicht-Helfer aus `support/api.ts` und `support/nav.ts`).

**Vorbereitung über `support/api.ts`** (bereits vorhanden, keine weitere Ergänzung nötig für den
UI-Weg): `createTag`, `createPool` (mit `completion: 'done'` für eine „Nur erledigt"-Spalte —
dieselbe Bauart wie im `leaves`-Fall aus `pool-movement-sentence.spec.ts`), `createTodo`,
`gotoTodo`. Die neu ergänzten `setTodoDoneWithMovement`/`reopenTodoWithMovement` dienen dabei
**nicht** der eigentlichen Prüfung (die läuft über die Oberfläche — der Klick auf die Checkbox ist
die geprüfte Bedienung), sondern ausschließlich der Kontrolle: einmal roh aufrufen, um den vom
Dienst gelieferten `poolMovement`-Wert unabhängig vom UI-Pfad festzuhalten und den erwarteten Satz
daraus mit `poolMovementSentence` zu bilden — dieselbe Zweiteilung wie in
`pool-movement-sentence.spec.ts` und `timer-stop-announcement.spec.ts`.

**Selektoren (Stand des Arbeitsbaums bei Berichtabgabe, unfertig, unbestätigt):** Die Checkbox
liegt in `apps/web/src/screens/TodoDetailScreen.tsx` in einem `<label className="done-switch">`
ohne eigenes `aria-label` auf dem `<input type="checkbox">` — der zugängliche Name wird aus dem
gesamten Label-Inhalt gebildet (Zustandstext plus Hinweistext), also vermutlich mehrdeutig für
`getByRole('checkbox', { name: … })`. Vorschlag für den Entwurf: `page.locator('.done-switch
input[type="checkbox"]')`, robust gegenüber dem genauen Wortlaut des Labels. Toast wie in den
bestehenden Dateien: `.toast__title`, `.toast__body`.

**Fall 1 — Setzen (`PUT`, Anlass `'booking'`, E-060 Punkt 2: neutrale Form, keine „wieder"-Sprache):**
1. Spalte mit `completion: 'done'` über ein Tag anlegen (`columnName`).
2. Todo mit diesem Tag anlegen, **nicht** erledigt.
3. Detailansicht öffnen, Checkbox „Erledigt" setzen.
4. Aus der (parallel über die rohe API kontrollierten) Antwort `poolMovement =
   { appears: [columnName], enters: [columnName], leaves: [] }` bilden:
   `poolMovementSentence(movement, 'past', 'booking')` = **„Es steht jetzt in „<columnName>“."**
   (E-058-Tabelle, Zeile „booking, nur enters").
5. Erwartung: `.toast__body` endet auf genau diesem Satz.

**Fall 2 — Aufheben (`DELETE`, Anlass `'reopen'`):**
1. Dieselbe Spalte, ein Todo, das **bereits** erledigt ist und das Tag trägt (also aktuell in der
   Spalte steht).
2. Checkbox „Erledigt" aufheben.
3. `poolMovement = { appears: [], enters: [], leaves: [columnName] }`;
   `poolMovementSentence(movement, 'past', 'reopen')` =
   **„Es ist aus „<columnName>“ verschwunden und erscheint sonst nirgends."** (E-058-Tabelle,
   Zeile „reopen, nur leaves").

**Fall 3 — kein Treffer (`poolMovement: null`):** Ein Todo ohne jeden Tag-/Regelbezug; Checkbox
setzen oder aufheben. Erwartung: `.toast__body` trägt **keinen** angehängten Satz (`withMovement`
lässt ihn bei `null` weg) — nur den festen Basissatz über Status/Kennzeichen.

**Offener Punkt, den ich nicht auflöse, sondern melde (siehe „Offene Fragen"):** E-060 Punkt 4
sagt wörtlich: „Die Sätze „Erledigt." und „Wieder offen." bleiben Titel; der Bewegungssatz ist der
Rumpf." Der bei Berichtabgabe im Arbeitsbaum sichtbare, unfertige und nicht committete Stand von
`TodoDetailScreen.tsx` zeigt stattdessen `title: done ? „„<Titel>“ ist wieder offen." : „„<Titel>“
ist erledigt."` — mit dem Todo-Namen im Titel, keine der beiden in der Entscheidung genannten
Kurzformen. Das könnte eine bewusste Übertragung von W-5 (Todo-Name im Titel statt „Es" ohne
Bezug) auf diesen dritten Ort sein, oder ein Zwischenstand, der noch auf den Text aus der
Entscheidung zurückgeführt wird — ich habe keine Möglichkeit, das aus dem Diff allein zu
entscheiden, und rate deshalb nicht. Der Entwurf oben prüft bewusst nur den **Rumpf** (der Satz
aus der Domänenfunktion, unstrittig) und lässt die Titelerwartung als Platzhalter offen, bis
T-102 als „fertig" gilt.

### Entwurf B — TP-TIMER-11: `orphan_discarded` wird unterschieden und angesagt (O-R)

**Datei (Vorschlag):** Erweiterung von `tests/e2e/timer-stop-announcement.spec.ts` (neuer
Testfall neben TP-TIMER-10, gleiche Vorbereitung: Pool mit `exportState: 'open'`, Timer über die
rohe API starten, `support/api.ts#startTimer`/`touchTimerHeartbeat`).

**Vertrag laut O-R (T-093-Fund, jetzt in `support/api.ts#ResolveOrphanedTimerResult` vorgezogen):**
`POST /timer/orphaned/resolve` soll `reason: 'timer_too_short'` liefern, wenn die Wahl „Bis zum
letzten Lebenszeichen buchen" mangels Lebenszeichen bzw. unter einer Sekunde nichts zu buchen
findet, und `reason: 'orphan_discarded'`, wenn der Benutzer „Verwerfen" gewählt hat — vor T-101
lieferte der Dienst in beiden Fällen `timer_too_short`.

**Selektoren (Stand des Arbeitsbaums, unfertig):** Dialog `page.getByRole('dialog', { name: 'Eine
Buchung ohne Ende' })` (bereits in TP-TIMER-10 verwendet); Auswahl über zwei benannte Radios,
sichtbarer Text „Bis zum letzten Lebenszeichen buchen" (Vorgabe) und „Verwerfen"
(`apps/web/src/app/TimerContext.tsx`, `orphanChoice`); Bestätigung über
`getByRole('button', { name: 'Entscheiden', exact: true })` — `exact: true` weiterhin nötig, siehe
Fund aus T-099 (sonst Teiltreffer auf „Später entscheiden").

**Fall A — „Verwerfen":**
1. Timer über die rohe API starten, Detailansicht **erstmals** in einer frischen Seite aufsuchen
   (macht ihn verwaist, wie in TP-TIMER-10).
2. Im Dialog die Option „Verwerfen" wählen, „Entscheiden" klicken.
3. Erwartung: `POST /timer/orphaned/resolve` antwortet
   `{ kind: 'discarded', reason: 'orphan_discarded', poolMovement: null }`. Toast-Titel „Buchung
   verworfen.", Rumpf nennt den Todo-Titel ausdrücklich („Sie haben die unvollständige Buchung auf
   „<Titel>“ verworfen. Es ist keine Zeit gebucht worden." — Wortlaut wie oben beim E-060-Entwurf
   nur informativ aus dem Zwischenstand übernommen, nicht als Vertrag zu verstehen). Kein
   Bewegungssatz, weil `poolMovement` im verworfenen Zweig fest `null` ist (unverändert seit
   E-058 Punkt 6).

**Fall B — „zu kurz":**
1. Timer über die rohe API starten, **ohne** Lebenszeichen (oder mit einem, das unter einer
   Sekunde nach dem Start liegt) sofort die Detailansicht aufsuchen.
2. Die Vorgabe „Bis zum letzten Lebenszeichen buchen" bestätigen, ohne sie umzuschalten.
3. Erwartung: `reason: 'timer_too_short'`. Toast-Titel und -Text unterscheiden sich **wörtlich**
   von Fall A (das ist der eigentliche Prüfkern von O-R — vor T-101 waren beide identisch).

**Gegenprobe, die den O-R-Fund direkt widerlegt oder bestätigt:** Beide Fälle in derselben
Testdatei, mit `expect(fallA.reason).not.toBe(fallB.reason)` und
`expect(toastTextA).not.toBe(toastTextB)` — ein Rückfall auf „immer `timer_too_short`" wird damit
rot, nicht nur ein falscher Einzelwert.

### Neue Helfer in `support/api.ts` für beide Entwürfe

```ts
export interface TodoDoneResult {
  readonly todo: Todo;
  readonly poolMovement: PoolMovementNames | null;
}
export async function setTodoDoneWithMovement(id: string): Promise<TodoDoneResult> { … } // PUT
export async function reopenTodoWithMovement(id: string): Promise<TodoDoneResult> { … }  // DELETE
```

Bewusst **nicht** anstelle von `markTodoDone`/`clearTodoDone` geändert: Die beiden bestehenden
Funktionen antworten heute (vor T-101) noch mit dem blanken `Todo`, und mehrere bestehende, grüne
Testfälle (`kanban.spec.ts`, `pool-movement-sentence.spec.ts`) rufen sie unverändert auf. Eine
Umbeschriftung ihres Rückgabetyps auf die künftige Hülle wäre eine Behauptung über den heutigen
Dienst gewesen, die nicht stimmt. Die beiden neuen Funktionen sind bis zur tatsächlichen Umstellung
**ungenutzt** — das ist beabsichtigt (kein `noUnusedLocals`-Konflikt, weil beide exportiert sind)
und im Kommentar an Ort und Stelle vermerkt. Die Hülle `{ todo, poolMovement }` ist eine begründete
Annahme (analog zu `StopTimerResult`), keine Messung — siehe „Annahmen" unten.

`ResolveOrphanedTimerResult.reason` ist von `string` auf `'timer_too_short' | 'orphan_discarded'`
geschärft — ungefährlich, weil kein heutiger Aufrufer (nur `cleanupAnyTimer`) den Wert ausliest,
und dieselbe geschlossene Aufzählung, die T-101 laut Diff bereits selbst verwendet (siehe unten,
„Annahmen").

## Fremde Fehlschläge, beobachtet, nicht behoben

Zur Erfüllung des Nachweises für Punkt 1 und 2 waren mehrere gezielte Läufe nötig; dabei sind drei
fremde, dem laufenden Umbau (T-101/T-102) zuzuordnende Fehlschläge sichtbar geworden. Keiner
berührt eine von mir geänderte Zeile; alle drei sind unten mit dem jeweiligen Beleg dokumentiert,
keiner wurde behoben.

1. **`tag-folder-rule-lock.spec.ts` — „Tag, Oberfläche: … Regelname fehlt (Fund, siehe unten)".**
   Dieser Fall behauptet ausdrücklich, dass der Tag-Löschdialog **keinen** Regelnamen zeigt (der
   in T-096/T-099 gemessene und dokumentierte Fund `repo-tags.ts`, `TagPort.remove()` ohne
   `details`). Genau das ist Punkt (4) der T-101-Aufgabe in Welle E
   (`repo-tags.ts:213`, „liefert `details` mit Regelnamen wie Ordner und Status"). Im Verlauf
   dieser Aufgabe ist dieser Fall von 4/4 bestanden auf 3/4 gekippt — reproduzierbar, nicht
   flackernd (zweifach mit `--retries=0` bestätigt):
   ```
   Expected substring: not "Betroffen ist Regel"
   Received string: "… Dieses Tag wird in der Regel eines Pools verwendet.
     Betroffen ist Regel „E2E-TagSperre-UI-Regel-…“. …"
   ```
   Das ist eine **gute** Nachricht für die Anwendung (der seit T-096 offene Fund ist behoben) und
   eine **veraltete** Zusicherung in meiner Datei. Ich habe sie bewusst **nicht** angepasst: Die
   Aufgabe hier ist H-7 und die Typprüfung, nicht diese Nacharbeit, und T-101 stand beim Schreiben
   dieses Berichts noch nicht als „fertig" auf dem Board — eine jetzt vorgenommene Anpassung
   müsste den tatsächlich ausgelieferten Wortlaut aus einem unfertigen Zwischenstand raten. Siehe
   „Nächster Schritt".
2. **`timer-stop-announcement.spec.ts` — zwei von drei Fällen (`recorded`, `orphaned/resolve`).**
   Beide erwarten die Toast-Titel „Zeit gebucht."/„Buchung abgeschlossen." ohne Todo-Namen; der
   Zwischenstand von `TimerContext.tsx` liefert stattdessen „Buchung auf „<Todo>“
   abgeschlossen." — die im Board für T-102 vorgesehene W-5-Änderung (Todo-Name im Titel statt
   „Es" ohne Bezug). Reproduzierbar, nicht behoben:
   ```
   Expected: "Buchung abgeschlossen."
   Received: element(s) not found
     (tatsächlich vorhanden: "Buchung auf „E2E-STOPP-VERWAIST-…“ abgeschlossen.")
   ```
   Diese Datei liegt zwar in meiner Hoheit, aber ihre Anpassung an W-5 ist nicht Teil von T-103 —
   sie gehört, wie Fund 1, in die e2e-Nachziehwelle nach T-101/T-102 (siehe Board, Zeile nach der
   Welle-E-Tabelle).
3. **`pool-movement-sentence.spec.ts` — einmalig `PUT /todos/{id}/done -> 500 internal_error`,
   danach wieder grün.** Ein einzelner Lauf während der laufenden T-101-Bearbeitung traf einen
   Zwischenzustand, in dem diese Route serverseitig einen unerwarteten Fehler warf; ein
   unmittelbar folgender Lauf (gleicher Testinhalt, keine Änderung meinerseits) war wieder 3/3
   grün. Nicht reproduzierbar isoliert — als Momentaufnahme eines im Umbau befindlichen Dienstes
   gewertet, nicht als Befund gegen einen stabilen Zustand.

Alle drei sind mit den Zeitpunkten ihrer Beobachtung dem `git status`/`git diff --stat` desselben
Moments zuordenbar (`apps/local-api/src/usecases/{timer,pool-movement}.ts`,
`packages/storage/src/sqlite/repo-tags.ts`, `apps/web/src/app/TimerContext.tsx`,
`apps/web/src/screens/TodoDetailScreen.tsx`, `apps/web/src/lib/movement.ts` — allesamt als „M"
bzw. „??" ohne meine Beteiligung geführt).

Annahmen:

1. **`{ todo, poolMovement }` als Hülle für `PUT`/`DELETE /todos/{id}/done`** — nicht gemessen,
   sondern in Anlehnung an `StopTimerResult` gewählt (eine Entität neben `poolMovement`, keine
   `kind`-Marke, weil beide Routen anders als der Timer keinen zweiten Ausgang kennen). Muss gegen
   die tatsächliche Antwort geprüft werden, sobald T-101 sie liefert.
2. **`ResolveOrphanedTimerResult.reason` geschärft, ohne Rücksprache** — ungefährlich (kein
   heutiger Aufrufer liest den Wert), zusätzlich durch den beim Lesen von `usecases/timer.ts`
   (nur zur Orientierung, nicht verändert) beobachteten identischen Aufzählungstyp gedeckt.
3. **Erfundene Testdaten**, durchgehend mit `E2E-`-Präfix. Keine echte Call-Nummer, kein
   Kundenname, kein Benutzername — auch in den Entwürfen oben.
4. **Kein `test.skip`, keine Spezifikationsdatei für E-060/O-R** — wie beauftragt nur der Entwurf
   oben, nichts davon eingecheckt.
5. **`tags-folders.spec.ts` gehört zwar nicht wörtlich zu „tag-folder-rule-lock.spec.ts" aus dem
   Auftrag**, trägt aber dieselbe H-7-Bauart und war von R-3a ersichtlich nicht erfasst (dort nur
   eine Datei benannt) — deshalb im selben Zug mitbehoben, wie der Auftrag es vorsieht („Prüfen,
   ob dieselbe Bauart in anderen Spezifikationen unter `tests/e2e/**` steht — dann dort auch").

Risiken:

1. **Zwei fremde, dokumentierte Fehlschläge (oben, Fund 1 und 2) sind reale Lücken zwischen dieser
   Aufgabe und dem Landen von T-101/T-102** — wer jetzt `pnpm run test:e2e` vollständig laufen
   lässt, sieht sie rot, ohne dass ein Agent sie „vergessen" hätte. Sie sind auf dem Board als
   e2e-Nachziehwelle vorgesehen (Zeile nach der Welle-E-Tabelle).
2. **Sicherheit: keine neue Angriffsfläche.** Alle Änderungen sind Typkorrekturen, ein
   Selektor-Tausch ohne Semantikänderung und rein additive, ungenutzte Typen/Funktionen in
   `support/api.ts`. Keine neue Route, kein neues Geheimnis, keine geänderte Testdaten-Herkunft.
3. **H-7 ist behoben, aber ungetestet gegen einen Namen mit tatsächlich wirksamen Zeichen** — die
   heutigen Testnamen enthalten nie `. * + ? ^ $ { } ( ) | [ ] \`, also hätte weder die alte noch
   die neue Fassung je einen Unterschied gezeigt. Der Fix ist strukturell richtig (siehe
   Playwright-Vertrag oben), aber ich habe keinen eigenen Testfall angelegt, der einen Namen mit
   einem solchen Zeichen tatsächlich durchspielt — das wäre über den Auftrag hinausgegangen (H-7
   verlangt die Behebung, keinen neuen Regressionsfall dafür).
4. **Der Entwurf für E-060/O-R hängt an einem unfertigen, uncommitteten Zwischenstand** — die
   genannten Wortlaute und Selektoren können sich bis zum tatsächlichen Landen noch ändern. Als
   Entwurf gekennzeichnet, nirgends als Zusicherung verwendet.

Offene Fragen: an den Orchestrator

1. **E-060 Punkt 4 („Titel bleibt „Erledigt."/„Wieder offen.“") gegen den beobachteten
   Zwischenstand von `TodoDetailScreen.tsx` (Titel mit Todo-Namen, `„<Titel>“ ist erledigt."`).**
   Ist das eine bewusste Erweiterung analog W-5, oder soll der Titel auf den in der Entscheidung
   festgehaltenen Kurzsatz zurückgeführt werden, bevor T-102 als fertig gilt? Ich habe absichtlich
   nicht geraten (siehe Entwurf A oben).
2. **Reihenfolge der e2e-Nachziehwelle:** Sollen die beiden oben dokumentierten fremden
   Fehlschläge (Tag-Regelname jetzt vorhanden, Stopp-/Orphan-Toast mit Todo-Namen) in derselben
   Welle behoben werden wie die Umsetzung der E-060/O-R-Entwürfe, oder getrennt, sobald T-101 bzw.
   T-102 einzeln „fertig" melden?

Nächster Schritt:

Sobald T-101 und T-102 auf dem Board als „fertig" stehen: (1) `tag-folder-rule-lock.spec.ts`,
Tag-Fall, auf die jetzt gelieferten `details` umstellen (Erwartung dreht sich von „kein Regelname"
auf „Regelname wie bei Ordner/Status"); (2) `timer-stop-announcement.spec.ts` auf die
tatsächlichen W-5-Titel umstellen; (3) die beiden Entwürfe oben (TP-EXPST-13, TP-TIMER-11) als
echte Spezifikationsdateien anlegen, gegen den dann feststehenden Wortlaut, und in
`docs/testplan.md` Abschnitt 19 aufnehmen; (4) `docs/testplan.md` Abschnitt 17/18
entsprechend um die dann korrigierten Ergebnisse ergänzen.

Befehle, die ich benutzt habe:

```
pnpm run typecheck:e2e
pnpm exec playwright test -c tests/e2e/playwright.config.ts --grep "<muster>" --reporter=list
pnpm exec playwright test -c tests/e2e/playwright.config.ts <datei> [<datei> …] --reporter=list [--retries=0]
```
