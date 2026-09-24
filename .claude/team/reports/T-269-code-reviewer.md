# T-269 — `apps/local-api/src/features/todos/todos.ts` gegengelesen

Gegenstand: die Rekonstruktion nach dem `git checkout --` aus dem Index.
Gemessen, nicht vermutet. Alle Zahlen unten sind mit `git`, `diff`, `grep` und
`tsc` auf diesem Rechner erhoben.

## 1. Was die Datei heute *ist* — die Messung

`git show HEAD:apps/local-api/src/usecases/todos.ts | diff - features/todos/todos.ts`
liefert **genau drei geänderte Zeilen**, alle drei Einfuhrpfade:

    38  './context.ts'        ->  '../../context.ts'
    39  './pool-movement.ts'  ->  '../../pool-movement.ts'
    41  './tag-names.ts'      ->  '../../tag-names.ts'

Zeichen 620 von 620 sonst gleich. Die Datei ist eine **wortgetreue HEAD-Kopie
plus drei Pfadzeilen** — nicht mehr und nicht weniger.

## 2. Fällt sie aus der Machart? — der Vergleich mit den Schwestern

Ich habe alle Dateien, die T-257 **nicht aufgeteilt** hat, gegen ihren
HEAD-Stand gestellt. Das ist der einzige belastbare Maßstab dafür, was T-257 an
einer solchen Datei überhaupt getan hat:

| Datei | geänderte Zeilen | Art der Änderung |
|---|---|---|
| `features/export/export.ts` | 1 | Einfuhrpfad |
| `features/todos/image-sweep.ts` | 1 | Einfuhrpfad |
| `features/board/board.ts` | 2 | Einfuhrpfade |
| `features/todos/attachments.ts` | 2 | Einfuhrpfad **+ 1 Prosa-Verweis** |
| `features/todos/routes.ts` | 6 | Einfuhrpfade |
| **`features/todos/todos.ts`** | **3** | **Einfuhrpfade** |

T-257 hat an unaufgeteilten Dateien **zweierlei** getan: Einfuhrpfade
nachgezogen und Pfadangaben in der Prosa nachgezogen. Die Prosa-Kehrung ist an
der unmittelbaren Nachbardatei belegt — `attachments.ts:83` sagt heute
``siehe `features/todos/todos.ts` `` und sagte in HEAD ``siehe `usecases/todos.ts` ``.

Für `todos.ts` wäre diese zweite Kehrung ein **Leerlauf** gewesen. Die Datei
trägt vier Pfadangaben, und alle vier treffen heute:

    119  `tag-names.ts`                                  -> src/tag-names.ts        ok
    121  `routes/addin/service.ts`                       -> existiert unveraendert  ok
    306  `kernel.ts`                                     -> packages/domain/src/    ok
    469  `packages/storage/src/sqlite/repo-todos.ts`     -> existiert               ok

Keine davon enthielt je `usecases/`. Der Befund aus T-264 (vierzehn tote
Pfadangaben in Gegenwartsform) trifft diese Datei also **nicht**. Er trifft
ihre Nachbarn — dazu Abschnitt 6.

Wurde etwas aus `todos.ts` herausgetrennt? Nein. `features/todos/` enthält vier
Dateien, drei davon bilden HEAD 1:1 ab (`attachments.ts`, `image-sweep.ts`,
`routes.ts`). Es gibt keine fünfte Datei in dieser Mappe, deren Inhalt aus
`todos.ts` stammen könnte — anders als bei `timer/` (`movement.ts` aus
`timer.ts`) und `structure/` (`settings.ts` aus `structure.ts`), wo die
Auftrennung 312 bzw. 430 Zeilen bewegt hat.

`tsc -p apps/local-api/tsconfig.json --noEmit` läuft mit Rückgabewert 0.

**Zwischenurteil:** Die Rekonstruktion ist nicht bloß plausibel, sie ist
**genau das, was T-257 an dieser Datei getan haben muß**, Zeile für Zeile
belegt an fünf Schwestern. Der Satz „Es stand also mehr darin, und ich weiß
nicht, was" ist ehrlich, aber durch nichts gestützt. Was übrigbleibt, ist ein
enges Restrisiko: ein Satz, den T-257 **nur** in diese Datei geschrieben hätte
und in keine ihrer Schwestern. Code kann es nicht gewesen sein — jede
Codeänderung schlüge als Typfehler, als gebrochener Aufrufer oder als roter
Nachweis durch, und alle drei sind grün.

## 3. Die eine Stelle, an der sie aus der Machart fällt

    apps/local-api/src/features/todos/todos.ts:1  niedrig  Kein Satz darueber, was
      in dieser Merkmalsmappe liegt und warum. Jede andere Leitdatei traegt einen:
      data-transfer.ts:5 "Was hier liegt und was nebenan", export/status.ts:9
      "Nach `exported` fuehrt allein ein Exportlauf (`export.ts`)",
      timer/bookings.ts:10 "Der Grund, warum diese Datei im Merkmal `timer` liegt",
      timer/movement.ts:4 "Warum diese drei Funktionen eine eigene Datei sind".
      `todos.ts` erwaehnt `image-sweep.ts` nie und `attachments.ts` nur ueber eine
      Einfuhr. Fix: einen Absatz nachtragen, der die vier Dateien der Mappe nennt
      und sagt, warum der Bildkehrlauf und die Anhaenge hier liegen und nicht
      nebenan. Kosten: fuenf Zeilen. Das ist zugleich der einzige denkbare
      Kandidat fuer den Verlust — ein Nachweis dafuer ist es nicht.

## 4. Befunde in der Sache

Alle folgenden stehen **wortgleich schon in HEAD**. Sie sind keine Folge des
Vorfalls und kein Argument gegen die Rekonstruktion — sie sind das, was beim
Gegenlesen dieser Datei ohnehin auffällt.

    apps/local-api/src/features/todos/todos.ts:137  mittel  Der Ablehnungstext der
      Call-Nummer ist hier von Hand geschrieben und **falsch**. Er sagt "Erlaubt
      sind 3 bis 64 Zeichen aus Buchstaben, Ziffern, Punkt, Schraegstrich,
      Bindestrich und Unterstrich" — aber `checkCallNumber`
      (packages/domain/src/call-number.ts:131) weist ueber `FORMULA_STARTERS`
      = {=, +, -, @} jede Nummer ab, die mit einem Bindestrich **beginnt**. Fuer
      die Eingabe `-12345` liest der Benutzer also einen Satz, der seine Eingabe
      ausdruecklich erlaubt, waehrend sie abgewiesen wird. Die Domaene haelt
      dafuer seit T-188 `CALL_NUMBER_INPUT_MESSAGE` bereit — fuenf Saetze,
      exhaustiv gegen `CallNumberRejection` getypt, gebaut um genau diese
      Doppelung zu beenden. Die Add-in-Tuer benutzt sie
      (routes/addin/index.ts:316), die Haupttuer nicht. Fix: `const check =
      checkCallNumber(callNumber); if (!check.ok) return err(taktError(
      'validation_error', CALL_NUMBER_INPUT_MESSAGE[check.reason]));`

    apps/local-api/src/features/todos/todos.ts:221  mittel  Zweiter, dritter
      Wortlaut fuer dieselbe Regel: hier nur "Diese Call-Nummer ist nicht
      zulaessig." Dieselbe Eingabe erzeugt damit an drei Tueren drei
      verschiedene Saetze. Fix wie oben, `CALL_NUMBER_INPUT_MESSAGE[check.reason]`.

    apps/local-api/src/features/todos/todos.ts:66-71  mittel  Der Kopfkommentar an
      `dueDate` schreibt die Regel aus, die 66 Zeilen weiter unten gebrochen wird:
      "eine zweite, abweichende Fassung waere genau das, was E-045 fuer die
      Call-Nummer beseitigt hat." E-045 hat die Regel vereinheitlicht, T-188 den
      Text — und dieser Satz steht drei Bildschirmseiten ueber der zweiten,
      abweichenden Fassung des Call-Nummer-Textes. Ein Satz, der eine Zusage gibt,
      die der Nachbar bricht. Faellt mit dem Fix zu 137/221 von selbst.

    apps/local-api/src/features/todos/todos.ts:597  mittel  Stille Verkuerzung.
      `searchEverything` holt `unit.timeEntries.search({}, { limit: 200 })` und
      filtert den Leistungstext **im Arbeitsspeicher**. Wer eine Buchung sucht,
      die nicht unter den neuesten 200 liegt, bekommt "nichts gefunden" — und
      kann das nicht von "gibt es nicht" unterscheiden. Genau diese
      Unterscheidung baut dieselbe Datei 70 Zeilen hoeher als `DuplicateLookup`
      (Z. 524-528) ausdruecklich auf und begruendet sie dort ausfuehrlich.
      `TimeEntryFilter` (packages/storage/src/ports.ts:907) traegt heute **kein**
      Textfeld, der Umweg ist also nicht Bequemlichkeit, sondern eine fehlende
      Portfaehigkeit. Fix, in dieser Reihenfolge: `search?: string` in
      `TimeEntryFilter` aufnehmen und den Vergleich in SQL fuehren; bis dahin
      mindestens `readonly timeEntriesTruncated: boolean` in `SearchResult`
      fuehren und in der Oberflaeche sagen, dass die Liste abgeschnitten ist.

    apps/local-api/src/features/todos/todos.ts:594-596  mittel  Der Kommentar
      daneben deckt die Verkuerzung zu: "Er ist ein Filter auf derselben Suche,
      nur eine Ebene tiefer." Es ist nicht dieselbe Suche — `todos` bekommt die
      `pagination` des Aufrufers, `timeEntries` eine fest verdrahtete 200, die
      der Aufrufer weder setzen noch erfahren kann. Fix: den Satz durch die
      Wahrheit ersetzen, oder besser mit dem Fix zu 597 gegenstandslos machen.

    apps/local-api/src/features/todos/todos.ts:217-231  niedrig
      `normalizeCallNumber(input.callNumber)` wird zweimal gerechnet: einmal fuer
      die Pruefung (Z. 218), einmal fuer den geschriebenen Wert (Z. 231). Der
      geprueft Wert wird weggeworfen. Rein, also heute harmlos — aber es sind
      zwei Wege zu einem Wert, und der zweite kennt die Pruefung nicht. Fix:
      einmal in eine Konstante, diese in den Spread setzen.

    apps/local-api/src/features/todos/todos.ts:554  niedrig  `const matches = [];`
      ist ein sich entwickelndes `any[]`. Es traegt heute nur, weil die
      Rueckgabeannotation `Promise<DuplicateLookup>` die Form am Ende faengt. Fix:
      `const matches: { todo: Todo; openSeconds: number; exportedSeconds: number }[] = [];`

    apps/local-api/src/features/todos/todos.ts:251  niedrig  `/todos/{id}/note` —
      die Route heisst `/todos/{todoId}/note` (routes.ts:391, openapi Z. 801).
      Kein verlorener Verweis, ein ungenauer; dieselbe Ungenauigkeit steht auch
      in `takt-local-api.yaml:3284`. Fix: `{todoId}` an beiden Stellen.

    apps/local-api/src/features/todos/todos.ts:38-41  niedrig  Der Einfuhrblock ist
      nach der Umschreibung nicht mehr nach Tiefe gruppiert: `./attachments.ts`
      (Z. 40) steht zwischen zwei `../../`-Einfuhren. `timer/timer.ts:26-28` fuehrt
      nach dem Umbau erst beide `../../` und dann `./movement.ts`. Rein optisch,
      kein Werkzeug misst es (weder eslint noch prettier ist in diesem Bestand
      eingerichtet). Fix: Zeile 40 hinter Zeile 41 setzen.

Geprüft und **kein** Befund:

- Z. 373 `await context.attachmentBlobs.removeImage(name);` verwirft den
  Rückgabewert. Der Kommentar daneben behauptet, `removeImage` protokolliere
  den Fehlschlag. Das stimmt: `access/attachment-store.ts:452` schreibt
  `logger.lifecycle('warn', …, 'attachment_image_remove_failed')`. Keine stille
  Rückgabe.
- Z. 147-194 `createTodo`: eine Transaktionsklammer, `AbortTodoCreate` wird
  gefangen und als Wert beantwortet, jeder andere Wurf bleibt ein Wurf.
- Z. 352-376 `removeTodo`: lesen, löschen, festschreiben, **dann** Dateien.
  Die Reihenfolge ist begründet und richtig.
- Kein `any`, keine Typzusicherung, kein `as` in der ganzen Datei.
- Keine Datei außerhalb der eigenen Hoheit angefaßt — `features/todos/todos.ts`
  liegt in `apps/local-api/**` außer `src/routes/addin/`, also bei domain-dev.

## 5. Die Fachregeln, die diese Datei trägt

**Standard-Tags bei jedem neuen Todo, auf jedem Weg (A-9.5).** Die Regel selbst
(`applyDefaultTags`) liegt in `packages/domain` und wird von genau zwei Stellen
gerufen: `todos.ts:157` und `routes/addin/service.ts:459`. Weder `apps/web/src`
noch `apps/outlook-addin/src` rufen sie — geprüft. Die Zusage im Kopf der Datei
(„Nicht in der Oberfläche und nicht im Add-in") hält also.

Ich habe zusätzlich nachgemessen, ob beide Wege dasselbe schreiben, weil die
beiden Aufrufe `TodoPort.create` **unterschiedlich** füttern:

    todos.ts:166           tagIds: selected           (nur die gewaehlten)
    addin/service.ts:472   tagIds: effectiveTagIds    (mit den Standard-Tags)
    beide, 2. Argument:    effective / effectiveTagIds

`packages/storage/src/sqlite/repo-todos.ts:609` schreibt `writeTags(id, tagIds,
input.now)` — also das **zweite** Argument — und liest `input.tagIds` nirgends.
Beide Wege sind damit gleichwertig, A-9.5 hält auf beiden. Der Kommentar in
`todos.ts:164-165` sagt das korrekt.

    apps/local-api/src/routes/addin/service.ts:474-479  mittel  Der Kommentar dort
      begruendet die Gleichsetzung mit "Solange der Adapter aus T-009 fehlt, ist
      das eine offene Frage". Der Adapter fehlt seit langem nicht mehr und liest
      nachweislich das zweite Argument. Der Satz haelt eine geschlossene Frage
      offen. Fix: durch den Verweis auf repo-todos.ts:609 ersetzen. — Fremde
      Hoheit (integration-dev), deshalb nur gemeldet.

**Ein gestarteter Timer hebt „Erledigt" auf (A-2.5).** Steht **nicht** in dieser
Datei, sondern in `features/timer/timer.ts` — richtig so. `clearTodoDone`
(Z. 479-493) verweist darauf („Derselbe Vorgang, den der Timerstart auslöst, nur
ohne Timer") und schreibt die Regel kein zweites Mal. Genau einmal.

**Die Notiz des Todos bleibt intern (A-7.2).** Vierfach gehalten und in dieser
Datei an der richtigen Stelle begründet: `TodoDetail` (Z. 248-264) trägt sie
ausdrücklich nicht, mit Begründung; `loadTodoNote`/`writeTodoNote` sind eigene
Anwendungsfälle über einen eigenen Port; `CreateTodoInput.note` (Z. 62) sagt
„Geht **nie** in den Export (A-7.2)". Keine zweite Fassung, keine Abfrage, die
`todo` mit `todo_note` verbindet. Vollständig und genau einmal.

**Rundung auf Viertelstunden, Base64, Exportstatuswechsel** kommen in dieser
Datei nicht vor — richtig, sie gehören nicht hierher. `openSeconds` und
`exportedSeconds` werden über `exportStatus`-Filter am Port gezählt, nicht hier
entschieden.

## 6. Die toten Pfadangaben aus T-264 — was hier hängen blieb

`todos.ts` selbst trägt keine (Abschnitt 2). Aber die Kehrung von T-257 hat
`src/routes/addin/` ausgelassen, und **fünf der zehn** dort verbliebenen
Angaben zeigen auf die Datei, um die es hier geht:

    apps/local-api/src/routes/addin/index.ts:246    `usecases/todos.ts`
    apps/local-api/src/routes/addin/service.ts:354  `usecases/todos.ts`
    apps/local-api/src/routes/addin/service.ts:413  `usecases/todos.ts`
    apps/local-api/src/routes/addin/service.ts:451  `usecases/todos.ts`
    apps/local-api/src/routes/addin/service.ts:478  `usecases/todos.ts`
    apps/local-api/src/routes/addin/service.ts:414  `usecases/tag-names.ts`
    apps/local-api/src/routes/addin/service.ts:582  `usecases/tag-names.ts`
    apps/local-api/src/routes/addin/service.ts:654  `usecases/tag-names.ts`
    apps/local-api/src/routes/addin/service.ts:210  `usecases/pool-movement.ts`
    apps/local-api/src/routes/addin/service.ts:225  `usecases/timer.ts`

    apps/local-api/src/routes/addin/service.ts:210,225,354,413,414,451,478,582,654
    apps/local-api/src/routes/addin/index.ts:246
      mittel  Zehn Verweise in Gegenwartsform auf Pfade, die es seit T-257 nicht
      mehr gibt. Es ist **kein Verweis verlorengegangen** — jeder trifft eine
      Datei, die noch existiert, nur an anderer Stelle. Fix: `usecases/todos.ts`
      -> `features/todos/todos.ts`, `usecases/timer.ts` -> `features/timer/timer.ts`,
      `usecases/tag-names.ts` -> `tag-names.ts`, `usecases/pool-movement.ts` ->
      `pool-movement.ts` (so hat T-257 es in `features/timer/movement.ts:24` und
      `features/todos/attachments.ts:83` gemacht). Fremde Hoheit
      (integration-dev), in einem eigenen Auftrag.

## 7. Wie gut ist die Rekonstruktion durch Prüffälle festgenagelt?

Schwächer, als die grüne Gesamtzahl vermuten läßt — das gehört zum Urteil dazu.
Die Datei führt **14 Ausfuhren** (Funktionen und Werte). Genau **eine** Prüfdatei
führt das Modul unmittelbar ein:

    apps/local-api/test/usecases/todo-done-movement.test.ts:55
      import { clearTodoDone, markTodoDone } from '../../src/features/todos/todos.ts';

Damit sind 2 von 14 Ausfuhren unmittelbar gemessen. Alles übrige — `createTodo`,
`updateTodo`, `listTodos`, `loadTodo`, `removeTodo`, `findTodosByCallNumber`,
`searchEverything`, `today`, `loadTodoNote`, `writeTodoNote`, `listDefaultTags`,
`setDefaultTags` — ist nur mittelbar über Routen und E2E abgedeckt. Das ändert
am Urteil nichts, weil die Datei nachweislich zeichengleich mit HEAD ist; es
wäre aber der Hebel, falls jemand den Rest des Zweifels ausräumen will.

## 8. Urteil

**freigegeben.**

Die Rekonstruktion ist tragfähig und muß **nicht** neu geschrieben werden. Sie
ist keine Nachbildung nach Gefühl, sondern der HEAD-Stand plus genau die drei
Pfadzeilen, die T-257 an fünf vergleichbaren Schwesterdateien ebenfalls und
ausschließlich geändert hat. Die zweite Sorte T-257-Änderung — das Nachziehen
von Pfadangaben in der Prosa — wäre für diese Datei ein Leerlauf gewesen; alle
vier ihrer Pfadangaben treffen heute. `tsc` ist grün, kein Aufrufer bricht,
nichts wurde aus der Datei herausgetrennt.

Keiner der Befunde in Abschnitt 4 blockiert die Freigabe. Alle stehen wortgleich
in HEAD und sind älter als der Vorfall; sie sind Nacharbeit an der Datei, nicht
Nacharbeit an der Rekonstruktion. Ich würde sie in dieser Reihenfolge einplanen:

1. `todos.ts:137` und `:221` auf `CALL_NUMBER_INPUT_MESSAGE` umstellen — der
   Satz an Z. 137 ist heute nachweislich falsch, und die Domäne hält den
   richtigen bereit. Ein Auftrag, domain-dev.
2. `todos.ts:597` — die stille Verkürzung der Buchungssuche. Braucht ein
   Textfeld in `TimeEntryFilter`, also Domäne und Speicherung mit. Eigener
   Auftrag.
3. Der fehlende Mappen-Absatz (Abschnitt 3) — fünf Zeilen, gern im selben
   Auftrag wie 1.
4. Die zehn toten Pfadangaben in `routes/addin/` — integration-dev, eigener
   Auftrag, gehört zu T-264.

Zur offenen Frage von domain-dev, ob „mehr darin stand": Ich kann sie nicht mit
Sicherheit verneinen, und niemand kann das — der Blob ist weg, `git fsck
--dangling` findet nichts. Ich kann sagen, wie eng der Raum ist, in dem sich ein
Verlust verstecken könnte: Es müßte **Prosa** sein (Code schlüge durch),
**nur in dieser Datei** (die Schwestern zeigen das Muster), und **von T-257
neu** (HEAD ist zeichengleich erhalten). Der einzige Ort, an dem ich eine solche
Lücke sehe, ist der fehlende Mappen-Absatz. Der ist in fünf Minuten geschrieben,
und danach ist der Fall geschlossen — nicht durch einen Beweis, sondern weil
nichts mehr fehlt, das man vermissen könnte.
