Aufgabe: T-090 — Reparatur nach Review (R-1, R-2) im Add-in-Dienst und Add-in.

Status: fertig

**Zustand des Baums in einem Satz:** `poolNamer` fragt seit T-090 `unit.pools.list('all')` und
sieht damit auch reine Board-Spalten; `bookOnTodo` bricht bei einem gescheiterten `clearDone`
durch einen **Wurf** ab, sodass die bereits geschriebene Buchung mit zurückgenommen wird; die
Attrappe wertet das Flächenargument aus, `proof:addin` steht bei **131** Prüfungen (vorher 123),
und die drei Mutationen, die die jeweiligen Fehler wiederherstellen, machen genau die dafür
gebauten Zeilen rot.

---

Artefakte:

Neu: keine Datei.

Geändert:

```
apps/local-api/src/routes/addin/service.ts
    `poolNamer` ruft `unit.pools.list('all')` statt `list()` (R-1 Befund 3,
    R-2 B-4). Neuer Typ `NamedPoolRule` — eine Abbildung über
    `MatchesPoolRule` mit `-?`, die jedes Feld der Regelseite zur Pflicht
    macht; `resolved` und die Rückgabe der `map`-Klammer sind darauf getippt.
    `holds` **spreizt** die Regelseite in `matchesPool`, statt sie Feld für
    Feld abzuschreiben (R-1, „sollte" zu `:306`). `bookOnTodo` ist `async`
    mit `try`/`catch` um die Transaktionsklammer; der Zweig für ein
    gescheitertes `clearDone` wirft die neue, nicht exportierte Klasse
    `AbortBooking` (R-1 Befund 2). Der Funktionskommentar, der bisher das
    Gegenteil behauptete, ist berichtigt und um die Begründung erweitert.

apps/outlook-addin/src/ui/TaskPane.tsx
    `FIELD_LABEL.statusId` heißt „Status" statt „Spalte" (R-2 S-4, E-054),
    mit Begründung daneben.

apps/outlook-addin/scripts/fixtures.mjs
    Die Attrappe `pools.list` wertet das Flächenargument aus (`'pool'` als
    Vorgabe, `'board'`, `'all'`; `both` zählt zu beiden Flächen). Neue
    Option `clearDoneFailure` — damit lässt sich der Fehlschlag beim
    Wiederöffnen überhaupt herstellen. Neu: `PLACEMENT_POOL` und
    `PLACEMENT_POOLS` — dreimal dieselbe Regel, einmal je Anzeigeort.

apps/outlook-addin/scripts/proof-addin.mjs
    Abschnitt 14 „Der Anzeigeort ist keine Antwort" (4 Prüfungen) und
    Abschnitt 15 „Scheitert das Wiederöffnen, fällt die Buchung mit"
    (3 Prüfungen). In Abschnitt 12 eine Prüfung, die die Brücke zwischen
    Achse und Feld hält. Importe: `POOL_RULE_AXIS_IDS`,
    `POOL_RULE_AXIS_OF_FIELD`, `PLACEMENT_POOLS`.
```

---

Zusammenfassung:

**1 — R-1 Befund 3 / R-2 B-4, `unit.pools.list()`.** `PoolPort.list` setzt ohne Argument die
Fläche `'pool'` ein und liefert nur Regeln mit `placement` `pool` oder `both`. Diese Vorgabe ist
für ihre Aufrufer richtig — sie meinen „die Pools" —, und `poolNamer` war einmal einer von ihnen.
Seit E-056 ist er es nicht mehr: Er beantwortet nicht „in welchen Pools steht das Todo", sondern
was diese Buchung ändert, und diese Frage kennt keine Fläche. Der Aufruf lautet jetzt
`list('all')`. `loadContext` einige Zeilen weiter oben ruft weiterhin ohne Argument, und das ist
kein Übersehen: `GET /addin/context` liefert die Pool-Liste als **Fläche**, nicht eine Bewegung.
Beide Aufrufe stehen mit ihrer Begründung im Kopf von `poolNamer`, damit die Verschiedenheit nicht
als Unachtsamkeit gelesen wird.

Die Attrappe hat das Argument bis heute verschluckt (`list: async () => pools`), und genau deshalb
hat es niemand gemessen. Sie wertet es jetzt aus. Das ist die Auflage, unter der R-1 den Fix
überhaupt als geprüft gelten lässt — ohne sie misst `proof:addin` an dieser Stelle nichts.

Der neue Prüfbestand `PLACEMENT_POOLS` ist dreimal dieselbe Regel über demselben Ordner, einmal je
Anzeigeort: `pool` (Kontrolle, ohne Erledigt-Achse), `board` (die Abrechnungsliste aus E-056,
`completion: 'done'` mit `exportState: 'open'`) und `both` (dieselbe Liste, an beiden Orten
sichtbar). Der Zuschnitt ist so gewählt, dass allein der Anzeigeort den Unterschied macht — die
`both`-Regel wurde schon vor T-090 genannt, die `board`-Regel nie. Daran ist der Befund zu
erkennen: Es lag nie an der Regel.

Ein **eigener** Poolsatz und keine zusätzliche Zeile in `AXIS_POOLS`, aus demselben Grund, den
`E057_POOLS` bereits ausschreibt: Die Namenslisten, die T-078, E-056 und T-084 Zeichen für Zeichen
festhalten, sollen weiterhin dasselbe messen. Eine zusätzliche Spalte im Achsen-Bestand hätte drei
bestehende Erwartungen verschoben, ohne einen Fehler zu zeigen.

**2 — R-1 Befund 2, `bookOnTodo`.** Der Zweig für ein gescheitertes `clearDone` gab
`{ kind: 'rejected' }` zurück. `createTransactionPort.run` nimmt nur bei einem **Wurf** zurück;
eine gewöhnliche Rückgabe führt zu `COMMIT`, und die Buchung war zu diesem Zeitpunkt bereits
geschrieben. Ergebnis: festgeschriebene Zeit bei gemeldetem Fehlschlag, das Todo weiterhin
erledigt — und derselbe Zeitraum ein zweites Mal in der Abrechnung, sobald der Benutzer es noch
einmal versucht.

Behoben auf demselben Weg, den `createTodo` einen Abschnitt weiter oben geht: eine eigene
Abbruchklasse `AbortBooking`, geworfen innen, außerhalb der Klammer gefangen und dort in
`rejected` übersetzt. Eine eigene Klasse statt `AbortTodoCreate`, weil deren Name sagt, was der
Abbruch mitnimmt („das Anlegen des Todos") und der Kommentar dort sich ausdrücklich darauf beruft;
hier nimmt er die Buchung mit. Nicht exportiert — sie wird in einer Datei geworfen und in
derselben gefangen.

Die beiden Zweige davor bleiben Rückgaben, wie R-1 es ausdrücklich freigibt: `not_found` steht vor
jedem Schreibvorgang, und ein abgewiesenes `timeEntries.create` hat nichts geschrieben. Die
äußere Antwort ist unverändert `{ kind: 'rejected', code, message }` und damit weiterhin 422 mit
durchgereichtem Schlüssel — der Vertrag der Route ändert sich nicht, nur der Zustand der
Datenbank danach. Siehe dazu Risiko 2.

**3 — R-1 „sollte" zu `service.ts:306`, die sechste Achse.** Der Aufruf von `matchesPool` in
`holds` schrieb die Regelseite Feld für Feld ab, und `resolved` hatte gar keinen Typ — eine
sechste Achse wäre hier still übersprungen worden. Zwei Änderungen, die zusammen greifen: Der Typ
`NamedPoolRule` ist eine Abbildung über `MatchesPoolRule` mit `-?` und macht damit **jedes** Feld
der Regelseite zur Pflicht; und `holds` spreizt die Regel, statt sie abzuschreiben. Eine
Aufzählung, die eine Achse vergisst, sieht aus wie eine, die keine vergisst; ein Spreizen kann
nichts vergessen.

Der domain-dev hat in T-089 keinen Erbauer gebaut, der alle Achsen verlangt — `BoardColumnRule`
ist inzwischen `extends MatchesPoolRule` (der andere Teil desselben R-1-Befundes), die geerbten
Achsen bleiben dort aber freiwillig. Meine Fassung ist deshalb **strenger** als R-1 es
vorgeschlagen hat (`MatchesPoolRule & { name: string }` wäre für eine neue **freiwillige** Achse
nicht rot geworden) und tut genau das, was der Auftrag verlangt: Sie zwingt zur vollständigen
Belegung. Siehe offene Frage 1.

**4 — R-2 S-4, „Spalte" am Statusfeld.** `FIELD_LABEL.statusId` heißt jetzt „Status". Das Wort
war einmal richtig — der Status **war** die Spalte des Boards; seit E-054 ist eine Spalte eine
Regel und der Status eine Eigenschaft am Todo. Wer nach einer abgewiesenen Eingabe „Spalte: …"
las, suchte auf dem Board nach einem Feld, das im Formular vor ihm steht.

**5 — Die übrigen „sollte"-Punkte aus R-2.** Das Add-in ist außer S-4 nur an einer weiteren Stelle
betroffen: Zeile 7 der Sprachtabelle („Pool" als einziges Gattungswort des Aufgabenbereichs,
`reopen.ts:129-130`). R-2 vermerkt dazu „mit B-4 zusammen entscheiden", und der Auftrag schließt
`poolSentence`/`bookingPoolSentence`/`CARD_STAYS` ausdrücklich aus. Nicht umgesetzt, Vorschlag
unter „Offene Fragen 2". Alles Übrige aus Abschnitt 4 von R-2 (S-1 bis S-3, S-5 bis S-10, D-1 bis
D-3, H-1 bis H-4) liegt in `apps/web`, in `docs/` oder auf dem Board — fremde Hoheit, nicht
angefasst.

**6 — `matchesPool` in den Add-in-Skripten.** Nachgezählt, nicht geglaubt: In
`apps/outlook-addin/scripts/**/*.mjs` gibt es **sechs** Aufrufe von `matchesPool` (Zeilen 2245,
2328, 2513, 2517, 2737, 2742 der jetzigen Fassung). Vier nennen `unresolvedRequired` unmittelbar
im Argument, zwei bekommen es über das Spreizen eines Objekts, das es trägt (`regel`,
`aufgeloest`). **Kein Aufruf ohne das Feld.** T-086 spricht von „vier"; das sind die vier
Objektliterale, die das Feld schreiben — die beiden zusätzlichen Aufrufstellen lesen dieselben
Literale weiter. Eine Laufzeitwache in der Domäne, die bei fehlendem Feld wirft, läuft hier grün
durch; wird `proof:addin` danach trotzdem rot, ist ein siebter Aufruf hinzugekommen, den es zum
Zeitpunkt dieses Berichts nicht gibt. Ich habe in T-090 keinen neuen `matchesPool`-Aufruf
angelegt.

---

Messungen:

```
pnpm --filter @takt/local-api typecheck        Exitcode 0
pnpm --filter @takt/outlook-addin typecheck    Exitcode 0
pnpm run typecheck  (vollständig, mit typecheck:test)   Exitcode 0
pnpm run proof:addin           131 bestanden, 0 fehlgeschlagen   (vorher 123)
pnpm run proof:addin-wiring     32 bestanden, 0 fehlgeschlagen
pnpm run proof:taskpane         25 bestanden, 0 fehlgeschlagen
pnpm run proof:route-policy     40 bestanden, 0 fehlgeschlagen
pnpm run proof:access           75 bestanden, 0 fehlgeschlagen
pnpm run proof:openapi          81 bestanden, 0 fehlgeschlagen
```

Kein Pipe hinter den Läufen, die den Ausgang bewerten. Port 17843 war belegt: nein — `proof:addin`
fährt über `app.request` und `openDatabase(':memory:')` und belegt ihn ohnehin nicht; `proof:access`
startet den Dienst und ist im zweiten Anlauf durchgelaufen (siehe Risiko 3).

**Vier Mutationen, vier Farben.** Jede einzeln eingesetzt, gemessen und wieder zurückgenommen:

```
1  service.ts: `list('all')` → `list()`  (der Zustand vor T-090)
   FEHL  B-4: die reine Board-Spalte steht in `leaves` (E-056)
         erwartet ['Erledigt, noch nicht abgerechnet', 'Erledigte Wartung (Pool und Board)'],
         geliefert nur die zweite.
   Die Ausgangslage-Prüfung darüber bleibt grün — richtig so, sie misst die Attrappe.

2  fixtures.mjs: `list: async () => pools`  (die Attrappe von vor T-090)
   FEHL  Die Ausgangslage: die Attrappe unterscheidet die Flächen
         `GET /addin/context` nennt drei Regeln statt zweier.
   Und — das ist der Punkt, den R-1 gemacht hat — die B-4-Prüfung darunter bleibt **grün**.
   Ohne die Ausgangslage-Prüfung misst der ganze Abschnitt nichts.

3  service.ts: `throw new AbortBooking(...)` → `return { kind: 'rejected', ... }`
   FEHL  Scheitert `clearDone`, entsteht keine Buchung — und das Todo bleibt erledigt
         `state.timeEntries` trägt eine festgeschriebene Buchung über 900 Sekunden.
   Die Gegenprobe darunter bleibt grün: Ohne den Fehlschlag bucht derselbe Aufruf.

4  service.ts: `exportState` aus dem Objektliteral in `poolNamer` entfernt
   (die Nachstellung der sechsten Achse, gegen den Übersetzer statt gegen den Nachweispfad)
   src/routes/addin/service.ts(371,7): error TS2322: Type '{ … }' is not assignable to
   type 'NamedPoolRule'.
   Vor T-090 war dieselbe Stelle grün.
```

---

Annahmen:

1. **`loadContext` bleibt bei `list()`.** R-1 und R-2 nennen ausschließlich `poolNamer`. `GET
   /addin/context` liefert `pools` als **Fläche** („die Pool-Liste"), nicht als Antwort auf eine
   Bewegung; das Add-in liest das Feld derzeit ohnehin nirgends. Eine Umstellung hätte den Rumpf
   der Route und damit `proof:openapi` berührt, ohne dass ein Befund sie verlangt. Die
   Verschiedenheit der beiden Aufrufe steht mit Begründung im Quelltext — sonst liest sie der
   Nächste als Flüchtigkeitsfehler und „vereinheitlicht" sie.

2. **Die Antwort bei gescheitertem `clearDone` bleibt `rejected` (422).** R-1 schreibt „außerhalb
   fangen und dort in `rejected` übersetzen". Damit geht ein `storage_error` weiterhin als 422
   hinaus statt als 500. Das ist der Bestand und keine Verschlechterung; ich habe die Gestalt der
   Antwort nicht angefasst, weil sie in `proof:openapi` beschrieben ist. Siehe Risiko 2.

3. **Der Fehlschlag in der Attrappe ist `storage_error`.** Im echten Adapter kommt er aus
   `attempt()` (gesperrte Datei, volle Platte) oder als `not_found`, wenn das Todo zwischen `load`
   und `UPDATE` verschwindet. Ich habe den ersten gewählt, weil er der erreichbarere ist; der
   Prüffall hängt am Verhalten der Klammer und nicht am Schlüssel.

4. **`NamedPoolRule` ist strenger als R-1 vorgeschlagen hat.** R-1 schrieb
   `MatchesPoolRule & { name: string }`. Das hätte eine neue **freiwillige** Achse nicht rot
   gemacht — und alle bisherigen Achsen außer `ruleTagIds`, `matchMode` und `unresolvedRequired`
   sind freiwillig. Der Auftrag verlangt „vollständig belegen **muss**", also die Abbildung mit
   `-?`. Die Bauart ist dieselbe wie `POOL_RULE_AXIS_CONDITIONS` in der Domäne, die ihr `-?` mit
   derselben Begründung trägt.

5. **Der Poolsatz und `bookingStates` sind unangetastet.** Der Auftrag schließt sie aus (Welle B
   nach E-058). `CARD_STAYS` steht deshalb weiterhin unter einem Satz, der ihm widersprechen kann
   (R-2 B-1); die neue Prüfung in Abschnitt 14 hält den heutigen Wortlaut ausdrücklich fest, damit
   die Umstellung ihn nicht versehentlich beibehält.

---

Risiken:

1. **Der Satz nennt eine Board-Spalte „Pool".** Mit `list('all')` kann `leavingPoolNames` jetzt
   den Namen einer reinen Board-Spalte enthalten, und `inPools` in `duplicate/reopen.ts` setzt
   unbedingt „dem Pool" / „den Pools" davor. Der **Name** stimmt, das Gattungswort nicht. Das ist
   kein Rückschritt gegenüber vorher — vorher fehlte der Name ganz —, aber es ist eine Ungenauigkeit,
   die es vor T-090 nicht geben **konnte**. Die Prüfung „Der Satz nennt die Board-Spalte beim
   Namen" hält den heutigen Wortlaut fest und trägt den Hinweis auf E-058 im Kommentar. Vorschlag
   unter „Offene Fragen 2".

2. **Ein Speicherfehler geht als 422 hinaus.** Scheitert `clearDone` an der Datenbank, antwortet
   `POST /addin/time-entries` mit 422 und dem Schlüssel `storage_error`. Der Client liest das als
   `invalid_input` (`kindForStatus` im Add-in) und zeigt eine Fehlermeldung, die nach einem
   Eingabefehler klingt. Das ist Bestand, nicht neu — ich nenne es, weil dieser Pfad jetzt zum
   ersten Mal gemessen wird und damit sichtbar ist.

3. **Fremde Hoheit war während der Arbeit zeitweise rot.** `pnpm run typecheck` war um 19:30 Uhr
   rot mit acht Fehlern in `packages/domain/src/board.ts` (`MatchesPoolRule` noch nicht
   importiert), und `proof:access` war rot, weil `packages/storage/migrations/0012_pool_rule_restrict`
   angelegt, aber noch nicht eingebettet war (`migrations:embed`). Beides ist T-089 in Arbeit,
   beides ist inzwischen grün, und ich habe nichts davon angefasst. Die Messungen oben stammen aus
   dem Zustand nach der Beruhigung.

4. **Keine echten Daten.** `PLACEMENT_POOLS` und der Abbruchbestand benutzen ausschließlich die
   bereits vorhandenen erfundenen Call-Nummern `TCK-000517` und `TCK-000518`, erfundene UUIDs der
   Fassung 7 und erfundene Ordner-/Tagnamen. Keine Zugangsdaten, kein Token außerhalb der
   Platzhalter aus Wiederholungszeichen.

5. **`resolveRule`/`resolveExcluded` sind weiterhin tot.** R-1 führt das als „sollte"
   (`packages/storage/src/ports.ts:419/429`), und die Begründung dort nennt als Grund für ihr
   Bestehenbleiben genau meinen Teilbaum. Fremde Hoheit, nicht angefasst; die Begründung stimmt
   nach T-086 nicht mehr und nach T-090 erst recht nicht.

---

Offene Fragen: an den Orchestrator

1. **Zusammenführen mit T-089.** Der domain-dev hat `BoardColumnRule extends MatchesPoolRule`
   umgesetzt (die andere Hälfte desselben R-1-Befundes), aber keinen Erbauer gebaut, der alle
   Achsen verlangt. Meine Wache steht deshalb lokal in `routes/addin/service.ts` als
   `NamedPoolRule`. Wenn in Welle B ein solcher Erbauer in die Domäne kommt, sollte
   `NamedPoolRule` durch ihn ersetzt werden statt neben ihm zu stehen — zwei Fassungen derselben
   Zusicherung sind der Anfang zweier verschiedener Antworten. Ich melde das, damit die
   Zusammenführung nicht davon abhängt, dass jemand beide Berichte nebeneinanderlegt.

2. **Das Gattungswort im Satz des Aufgabenbereichs** (R-2 B-4, letzter Absatz; Sprachtabelle
   Zeile 7). Zwei Fassungen, beide umsetzbar in `poolMovementSentence` in Welle B:

   - **Neutral, ohne Gattungswort:** „Es erscheint dann in „Erledigt, noch nicht
     abgerechnet“." Das ist R-2s eigener Vorschlag und der billigste ehrliche Weg. Er verliert
     eine Auskunft — der Benutzer erfährt nicht mehr, **wo** er nachsehen soll — und gewinnt
     dafür, dass nie ein falsches Wort dasteht. Bei zwei Namen wird der Satz allerdings
     unbestimmt: „Es erscheint dann in „A“ und „B“." lässt offen, dass A eine Pool-Liste und B
     eine Board-Spalte ist.
   - **Unterscheidend, über `POOL_PLACEMENT_SHORT`:** Der Satz nennt Pools und Spalten getrennt,
     wenn beides betroffen ist, und benutzt sonst das zutreffende Wort. Er sagt mehr und ist
     länger; E-056 verlangt aber ausdrücklich **einen** Satz und keine zweite Liste, und zwei
     Aufzählungen in einem Satz sind schwer zu lesen.

   Ich rate zur **ersten** Fassung mit einer Ergänzung: `poolMovementSentence` bekommt die
   Anzeigeorte nicht, sondern der Satz verzichtet auf das Gattungswort — und das Add-in nennt den
   Anzeigeort dort, wo Platz dafür ist, nämlich an der Karte des gefundenen Todos, nicht im Satz.
   Die Entscheidung gehört zu E-058 und nicht in diese Aufgabe; ich habe sie ausdrücklich **nicht**
   getroffen.

3. **Die Begründung an `PoolPort.list`** (`packages/storage/src/ports.ts:328-335`) nennt
   `poolNamer` namentlich als den Aufrufer, für den die Vorgabe `'pool'` gebaut wurde: „allen
   voran `poolNamer` in `routes/addin/service.ts` … Der bekommt damit weiterhin Pools und nicht
   die Spalten eines Boards, ohne dass die Datei angefasst werden musste." Seit T-090 stimmt das
   nicht mehr. Die Vorgabe selbst bleibt richtig (R-2 sagt das ausdrücklich), nur ihr Kronzeuge ist
   abgesprungen. Fremde Hoheit — bitte an den domain-dev geben, zusammen mit R-1s „sollte" zu
   `resolveRule`/`resolveExcluded` an derselben Datei. Eine Begründung, die nicht mehr stimmt, ist
   schlechter als keine: Beim nächsten Mal glaubt ihr jemand.

4. **`GET /addin/context` liefert `pools` nach der Fläche `'pool'`** (Annahme 1). Falls der
   Aufgabenbereich diese Liste je benutzen soll — heute liest er sie nicht —, ist zu entscheiden,
   ob er die Pool-Liste meint oder alle Regeln. Solange er sie nicht liest, ist die Frage nicht
   dringend, aber sie ist gestellt.

---

Nächster Schritt:

Welle B nach E-058 kann laufen, sobald `poolMovementSentence` in der Domäne steht (T-089 hat
`packages/domain/src/pool-movement.ts` angelegt). Konkret für meine Hoheit: `poolSentence`,
`bookingPoolSentence` und `CARD_STAYS` in `apps/outlook-addin/src/duplicate/reopen.ts` auf die
Domänenfunktion umstellen, dabei das Gattungswort nach der Entscheidung zu offener Frage 2 setzen,
und die vier Prüfungen in `proof:addin` (Abschnitte 12 und 14), die den heutigen Wortlaut
festhalten, gegen die Funktion statt gegen die Abschrift führen. Der frontend-dev stellt in
derselben Welle `apps/web/src/lib/labels.ts` um; beides in **einer** Auflage, sonst laufen die
vier Flächen erneut auseinander.
