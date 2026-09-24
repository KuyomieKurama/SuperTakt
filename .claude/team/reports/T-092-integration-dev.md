Aufgabe: T-092 — E-058 Absatz 3 im Add-in

Status: fertig

**Zustand des Baums in einem Satz:** Der Add-in-Dienst rechnet die Poolbewegung nicht mehr selbst
— `poolNamer`, `bookingStates`, `PoolCandidate`, `AddinPoolMovement` und `NamedPoolRule` sind weg,
`poolMovementNamer` aus `usecases/pool-movement.ts` steht an ihrer Stelle; das Add-in formuliert
den Satz nicht mehr selbst — `poolSentence`, `bookingPoolSentence`, `CARD_STAYS`, `listPools`,
`inPools` und `ReopenNotice.aside` sind weg, `poolMovementSentence` aus `@takt/domain` steht an
ihrer Stelle; `proof:addin` prüft den Satz **gegen die Funktion** und nicht gegen eine Abschrift
und steht bei **134** Prüfungen (vorher 131), und fünf Mutationen machen genau die dafür gebauten
Zeilen rot.

---

Artefakte:

Neu: keine Datei. Fünf Bezeichner und eine CSS-Klasse gelöscht.

Geändert:

```
apps/local-api/src/routes/addin/service.ts        (-326 Zeilen netto)
    Gelöscht: `poolNamer`, `bookingStates`, `PoolCandidate`,
    `AddinPoolMovement` (war exportiert, ohne Aufrufer), `NamedPoolRule`.
    Aus der Importliste gefallen: `matchesPool`, `tagAxisIsUnresolved`,
    `MatchesPoolRule`, `AddinUnit`. Neu: `poolMovementNamer` und der Typ
    `PoolMovementState` aus `../../usecases/pool-movement.ts`, dazu die
    Konstante `BOOKING_EFFECT` — die **Wirkung** der Handlung (zwei Achsen),
    nicht die Rechnung. `findMatches` und `bookOnTodo` bilden das Zustandspaar
    je selbst als `{ before, after: { ...before, ...BOOKING_EFFECT } }`.
    Die Antwortfelder (`poolNames`, `enteringPoolNames`, `leavingPoolNames`)
    sind unverändert; `loadContext` bleibt bei `list()` (E-058 Punkt 7).

apps/outlook-addin/src/duplicate/reopen.ts        (-207 Zeilen netto)
    Gelöscht: `PoolMovement` (lokale Zweitschrift), `listPools`, `inPools`,
    `poolSentence`, `bookingPoolSentence`, `CARD_STAYS`, `ReopenNotice.aside`.
    `reopenPreview`/`reopenOutcome` rufen `poolMovementSentence(movement,
    'future'|'past', 'reopen')`, `bookingOutcome` ruft sie mit `'booking'`.
    `REOPEN_HINT`, `BookingNotice`, die drei Bauplan-Funktionen und ihre
    Signaturen bleiben.

apps/outlook-addin/src/duplicate/rule.ts
    `offerMovement` gibt `PoolMovement` aus `@takt/domain` zurück statt aus
    `./reopen.ts`.

apps/outlook-addin/src/ui/TaskPane.tsx
    `MovementNote` ruft `poolMovementSentence(movement, 'future', 'booking')`.
    `PoolMovement` aus `@takt/domain`. Die Zeile `<p className="effects__aside">`
    in `ReopenAnnouncement` ist ersatzlos weg.

apps/outlook-addin/src/styles/addin.css
    `.effects__aside` gelöscht, mit Begründung an ihrer Stelle.

apps/outlook-addin/scripts/proof-addin.mjs        (+3 Prüfungen, 131 → 134)
    Importe: `CARD_STAYS`, `poolSentence`, `bookingPoolSentence` raus,
    `poolMovementSentence` aus `@takt/domain` rein. Neun bestehende Prüfungen
    erzeugen ihre Erwartung jetzt **aus der Funktion**; die Wortlaut-Abschriften
    („in dem Pool …", „den Pools …", die vier Satz-Zeichenketten) sind durch
    wortlautunabhängige Eigenschaften ersetzt. Drei neue Prüfungen in
    Abschnitt 0 (keine zweite Fassung des Satzes im Add-in; `CARD_STAYS`
    ersatzlos gestrichen; der Dienst wertet keine Poolregel mehr aus). Die
    Prüfung „die Auskunft nach der Buchung ist dieselbe wie davor" deckt jetzt
    **alle drei** Listen ab.

apps/outlook-addin/scripts/fixtures.mjs
    Keine Verhaltensänderung nötig — nachgezogen wurde die Begründung: Der
    Port-Ausschnitt `pools` ist seit T-092 der, gegen den `poolMovementNamer`
    läuft (`Pick<PoolPort, 'list' | 'resolveAxes'>`).
```

---

Zusammenfassung:

**1 — Die Rechnung: `poolMovementNamer` statt `poolNamer`.** Der Add-in-Dienst hielt eine zweite
Fassung derselben Rechnung, samt eigenem Zustandstyp, eigenem Bewegungstyp und eigener Regelwache.
Alle vier sind gelöscht; `findMatches` und `bookOnTodo` rufen `poolMovementNamer(unit)`. Der
Anwendungsfall ist so zugeschnitten, dass `AddinUnit.pools` ohne Anpassung passt (`Pick<PoolPort,
'list' | 'resolveAxes'>`) — der Port-Ausschnitt des Add-ins ist unverändert, und das Add-in-Token
bekommt keine Fläche dazu. Aus der Importliste sind `matchesPool` und `tagAxisIsUnresolved`
gefallen: Im Add-in-Dienst wird keine Poolregel mehr ausgewertet, und eine neue Prüfung hält das
fest, statt es zu behaupten.

**2 — Das Zustandspaar: `BOOKING_EFFECT` statt `bookingStates`.** Der Auftrag verlangt, dass die
Aufrufer das Paar bilden — der Anwendungsfall entscheidet ausdrücklich **nicht**, was eine
Handlung am Zustand ändert. Zwei Stellen bilden es also: die Duplikatsuche (Ankündigung) und
`bookOnTodo` (Bestätigung). Damit sie nicht Verschiedenes über dieselbe Handlung annehmen, steht
die **Wirkung** als ein Wert da (`completedAt: null`, `hasOpenEntries: true`), und beide Paare
entstehen als `{ ...before, ...BOOKING_EFFECT }`. Das Spreizen trägt die Wache mit: Kommt eine
sechste Achse, wird `before` rot, weil `PoolMovementState` sie verlangt, und `after` bekommt die
richtige Vorgabe „durch diese Buchung unverändert", statt sie still zu verlieren. Gemessen wird es
trotzdem — siehe Annahme 1 und Mutation 1.

**3 — Der Satz: `poolMovementSentence` statt zweier Abschriften.** `poolSentence` und
`bookingPoolSentence` sind gelöscht, mitsamt ihren Bausteinen. Die drei Bauplan-Funktionen
(`reopenPreview`, `reopenOutcome`, `bookingOutcome`) und `MovementNote` rufen die Domänenfunktion
mit dem passenden Anlass. Die Signaturen der drei Funktionen sind unverändert, ebenso `REOPEN_HINT`
und der Satz `booked` — der Aufgabenbereich sieht an jeder Stelle gleich aus, außer dass die vierte
Zeile fehlt.

**4 — `CARD_STAYS` und `aside`: ersatzlos.** Kein Ersatztext, keine leere Zeile, kein Abstand, der
eine fehlende andeutet. Das Feld ist aus `ReopenNotice` verschwunden, die `<p>`-Zeile aus
`ReopenAnnouncement` und die Klasse `.effects__aside` aus `addin.css` — eine Klasse ohne Element
ist die Einladung, den Satz wieder darunterzuschreiben. Eine statische Prüfung trifft alle drei
zugleich und auch die Wiedereinführung.

**5 — `proof:addin` prüft gegen die Funktion.** Neun Prüfungen hielten bisher den Wortlaut Zeichen
für Zeichen fest — das war in T-090 richtig (der Wortlaut sollte die Umstellung nicht
versehentlich überleben) und wäre jetzt falsch: T-093 ändert den Satz nach E-058 Punkt 4, und
eine Abschrift im Add-in hätte genau das rot gemacht. Die Erwartung entsteht deshalb aus
`poolMovementSentence(…)` mit denselben Argumenten. Das ist keine Prüfung, die sich selbst
bestätigt: Gemessen wird nicht, **welchen** Satz die Domäne formuliert — das messen die
Einheitentests dort (T-095) —, sondern ob der Aufgabenbereich denselben zeigt, mit demselben
Anlass, derselben Zeitform und derselben Bewegung. Eine Abschrift, ein vertauschter Anlass und
eine unterwegs verlorene Liste sind drei verschiedene Fehler, und jeder macht eine Zeile rot
(Mutationen 2 und 3). Buchstabiert werden weiterhin die Eigenschaften, die **unabhängig vom
Wortlaut** gelten: Namen einzeln genannt statt gezählt, kein „wieder"/„zurück" im Buchungssatz,
ein Satz und nicht zwei, `null` ohne Bewegung — und, neu, **kein Gattungswort vor dem Namen**
(E-058 Punkt 4), gemessen an genau der reinen Board-Spalte, für die der Punkt entschieden wurde.

Der Wortlaut aus T-093 lag beim Bau bereits im Baum. Die Prüfungen sind trotzdem so gebaut, dass
sie in **beiden** Fassungen grün sind; die Reihenfolge der beiden Aufgaben spielt für sie keine
Rolle.

---

Messungen:

```
pnpm run proof:addin                       134 bestanden, 0 fehlgeschlagen   (vorher 131)
pnpm run typecheck  (vollständig)          Exitcode 0
pnpm run test                              43 Dateien, 648 Fälle, Exitcode 0
pnpm run proof:addin-wiring                32 bestanden, 0 fehlgeschlagen
pnpm run proof:taskpane                    25 bestanden, 0 fehlgeschlagen
pnpm run proof:route-policy                40 bestanden, 0 fehlgeschlagen
pnpm run proof:openapi                    100 bestanden, 0 fehlgeschlagen
pnpm run proof:callers                     18 bestanden, 0 fehlgeschlagen
pnpm run proof:access                      75 bestanden, 0 fehlgeschlagen
pnpm --filter @takt/outlook-addin build    Exitcode 0
```

Kein Pipe hinter den Läufen, die den Ausgang bewerten; jeder Exitcode einzeln abgefragt.

**Port 17843:** war belegt. `proof:addin-wiring` lief erst im sechsten Anlauf durch, `proof:access`
erst nach mehreren Minuten Warten. Kein fremder Prozess beendet, nur gewartet und wiederholt.

**Zwischenzeitlich rot, beides fremde Hoheit, beides inzwischen grün:**

- `pnpm run typecheck` um 22:39 mit `apps/web/src/lib/poolRule.ts(5,3): error TS6133:
  'POOL_COMPLETION_LABEL' is declared but its value is never read` — T-094, während der Arbeit.
- `pnpm run test` um 22:41 mit einem Fehlschlag in
  `packages/storage/test/repo-tags-folder-in-rule.test.ts` (`UNIQUE constraint failed:
  pool.position`), einer **unversionierten** neuen Datei aus T-095.

Beide Messungen oben stammen aus dem Zustand nach der Beruhigung. Ich habe keine der beiden
Dateien angefasst.

**Fünf Mutationen, fünf Farben.** Jede einzeln eingesetzt, gemessen und zurückgenommen:

```
1  service.ts (bookOnTodo): `after: { ...before, ...BOOKING_EFFECT }` → `after: before`
   — die Annahme über die Wirkung läuft in den beiden Aufrufern auseinander
   FEHL  I-05: die Auskunft nach der Buchung ist dieselbe wie davor — in beiden Hälften
   FEHL  T-084: die Bestätigung nach der Buchung nennt dieselbe Spalte, im Perfekt
   FEHL  I-05 über die Flächen: die Bestätigung sagt dasselbe wie die Ankündigung

2  reopen.ts: `bookingOutcome` mit Anlass `'reopen'` statt `'booking'`
   FEHL  T-084: ohne Bewegung kein Satz — „ein Satz ohne Ereignis"
   FEHL  T-084: die Bestätigung nach der Buchung nennt dieselbe Spalte, im Perfekt
   FEHL  T-084: dasselbe Todo mit bestehender Buchung — kein Satz, kein Halbsatz

3  reopen.ts: eine zweite Fassung des Satzes als Konstante daneben
   FEHL  E-058: das Add-in hält keine zweite Fassung des Bewegungssatzes

4  service.ts: `matchesPool` wieder importiert und aufgerufen
   FEHL  E-058 Absatz 1: der Add-in-Dienst wertet keine Poolregel mehr selbst aus

5  TaskPane.tsx: `<p className="effects__aside">Die Karte bleibt, wo sie ist …</p>` zurück
   FEHL  E-058 Absatz 2: „Die Karte bleibt, wo sie ist" ist ersatzlos gestrichen
```

---

Annahmen:

1. **`bookingStates` ist gelöscht, die Wirkung steht als benannter Wert.** Der Auftrag sagt
   „`bookingStates` entfernen" und „die Aufrufer bilden das Zustandspaar". Beides wörtlich zu
   nehmen hieße, `after: { …, completedAt: null, hasOpenEntries: true, … }` zweimal
   auszuschreiben — und damit genau die Divergenz herzustellen, gegen die der Kopf von
   `bookingStates` geschrieben war. Ich habe deshalb die **Rechnung** und den **Paarbauer**
   gelöscht und allein die **Wirkung** als eine Konstante stehen lassen. Das ist kein
   umbenanntes `bookingStates`: Es bildet kein Paar, kennt kein Todo und trägt keine
   Zustandsliste. Die Aufrufer bilden das Paar, wie verlangt. Zusätzlich misst
   `proof:addin` jetzt alle drei Listen zwischen Ankündigung und Bestätigung statt zweier —
   Mutation 1 zeigt, dass die Zusage nicht nur im Kommentar steht. Wenn der Orchestrator die
   ganz wörtliche Fassung will, ist es eine Zeile; ich halte sie für die schlechtere.

2. **`loadContext` bleibt unverändert.** Der Auftrag nennt es unter denen, die „das Zustandspaar
   bilden", Punkt 4 und E-058 Punkt 7 sagen aber ausdrücklich, dass `GET /addin/context` bei
   `list()` bleibt. `loadContext` rechnet keine Bewegung und hat nie eine gerechnet; ich habe
   die Nennung als Aufzählung der Funktionen dieser Datei gelesen und nichts angefasst. Die
   bestehende Prüfung „Die Ausgangslage: die Attrappe unterscheidet die Flächen" hält fest, dass
   die Route die reine Board-Spalte weiterhin **nicht** sieht.

3. **`PoolMovement` kommt im Add-in aus `@takt/domain`, nicht aus `reopen.ts`.** `api/types.ts`
   begründet ausführlich, warum die **DTOs** keine Domänentypen sein dürfen (JSON hat keine
   markierten Kennungen). Für `PoolMovement` gilt das nicht: Es ist der Typ, den
   `poolMovementSentence` entgegennimmt, und drei Listen von Zeichenketten haben keine Kennung.
   Eine Zweitschrift daneben wäre dieselbe Falle wie beim Satz, eine Ebene tiefer. Das Add-in
   führt `@takt/domain` seit T-028 in seiner Abhängigkeitsliste; `@takt/local-api` und
   `@takt/storage` unverändert nicht.

4. **Die Antwortfelder der Add-in-Routen heißen weiter `poolNames`, `enteringPoolNames`,
   `leavingPoolNames`.** Sie stehen in `proof:openapi` und im Add-in-Client; E-058 verlangt an
   dieser Stelle nichts, und T-093 regelt allein `POST /timer/*`. Siehe offene Frage 2.

5. **Der Anlass am Wiederöffnen-Satz ist `'reopen'`, am Buchungssatz `'booking'` — fest, nicht
   zur Laufzeit gewählt.** Der Aufgabenbereich weiß beim Bauen der Fläche, welchen der beiden
   Fälle er zeigt (`booking.isDone`), und die Überladung gibt ihm dafür die stärkere Zusage:
   `'reopen'` liefert `string`, also braucht `ReopenNotice.effects[2]` keine Behandlung von
   `null`. Die dritte, schwächere Überladung (Anlass zur Laufzeit) benutzt das Add-in nicht.

---

Risiken:

1. **Die Wirkung der Handlung steht an einer Stelle, das Paar an zweien.** Das ist die eine
   Naht, die T-092 aufmacht (Annahme 1). Sie ist gemessen — Mutation 1 —, aber eine Messung ist
   kein Typ: Wer in einem der beiden Aufrufer `BOOKING_EFFECT` durch etwas anderes ersetzt, wird
   erst im Nachweispfad rot und nicht schon beim Übersetzen. Vorschlag unter „Offene Fragen 1".

2. **`GET /addin/context` und der Bewegungssatz sehen verschiedene Regelmengen.** Die Route
   liefert `list()` (nur Pools), die Bewegung rechnet über `list('all')` (auch reine
   Board-Spalten). Das ist E-058 Punkt 7 und ausdrücklich so gewollt — es heißt aber, dass der
   Aufgabenbereich einen Namen im Satz nennen kann, den er in seiner eigenen Pool-Liste nicht
   führt. Solange das Add-in die Liste nirgends liest, fällt es nicht auf; sobald es sie anzeigt,
   ist es eine Frage (O-K beim Auftraggeber).

3. **Der Satz kann sich ändern, ohne dass im Add-in etwas rot wird.** Das ist der Preis dafür,
   gegen die Funktion zu prüfen statt gegen eine Abschrift, und er ist beabsichtigt: Der Wortlaut
   gehört in die Domäne und wird dort gemessen. Das Add-in misst, dass es **denselben** Satz
   zeigt. Wer den Wortlaut an einer Fläche ändern will, muß ihn in der Domäne ändern — und trifft
   damit beide Flächen zugleich, was der ganze Zweck von E-058 ist.

4. **Ein Speicherfehler geht weiterhin als 422 hinaus.** Unverändert aus T-090 (Risiko 2 dort):
   Scheitert `clearDone` an der Datenbank, antwortet `POST /addin/time-entries` mit 422 und
   `storage_error`. Bestand, nicht neu, von T-092 nicht berührt.

5. **Keine echten Daten.** Kein neuer Prüfbestand angelegt. Die neuen und geänderten Prüfungen
   benutzen ausschließlich die vorhandenen erfundenen Call-Nummern (`TCK-000517`, `TCK-000518`),
   erfundene Pool- und Ordnernamen und die Platzhalter-Token aus Wiederholungszeichen. Die neuen
   Namen in den Beispielbewegungen (`Ost`, `West`) sind erfunden und stehen nur im Nachweispfad.

6. **Fremde Hoheit war während der Arbeit zeitweise rot** (siehe Messungen). Nichts davon
   angefasst.

---

Offene Fragen: an den Orchestrator

1. **Soll die Wirkung einer Handlung in den Anwendungsfall wandern?** `usecases/pool-movement.ts`
   sagt heute ausdrücklich: „Er entscheidet **nicht**, was eine Handlung am Zustand ändert … Wer
   das Paar bildet, weiß es." Das ist richtig für eine allgemeine Rechnung. Es gibt aber genau
   **eine** Handlung, die an mehreren Stellen dasselbe Paar braucht — die Buchung —, und sie wird
   inzwischen an vier Orten gebildet: zweimal im Add-in-Dienst (T-092), und nach T-093 in
   `POST /timer/start`, `POST /timer/stop` und `POST /timer/orphaned/resolve`. Vorschlag: ein
   Erbauer im Anwendungsfall, etwa `bookingMovementStates(todo, entries)`, der das Paar für „eine
   Buchung entsteht" bildet. Er gehört domain-dev; ich habe ihn deshalb **nicht** gebaut. Solange
   es ihn nicht gibt, steht die Wirkung im Add-in-Dienst als `BOOKING_EFFECT` an einer Stelle und
   wird im Nachweispfad gemessen.

2. **Sollen die drei Antwortfelder der Add-in-Routen zu einem `poolMovement` werden?** Nach T-093
   liefern `POST /timer/start|stop|orphaned/resolve` die Bewegung als **ein** Feld
   (`poolMovement: PoolMovement | null`), die Add-in-Routen liefern weiterhin drei flache Listen.
   Beide beschreiben denselben Wert. Die Zusammenführung berührt `openapi/`, `proof:openapi`,
   `routes/addin/index.ts` und den Add-in-Client — zwei Hoheiten, und der Auftrag nennt sie nicht.
   Ich melde es, damit die Ungleichheit eine Entscheidung ist und kein Übersehen.

3. **`AddinPoolMovement` war exportiert und hatte keinen Aufrufer.** Gelöscht. Falls jemand außerhalb
   des Baums (Dokumentation, Testplan) darauf verweist, ist der Verweis jetzt tot; ich habe in
   `docs/` und den Nachweispfaden nichts gefunden.

4. **Die drei neuen Prüfungen in Abschnitt 0 lesen eine fremde Datei.** „E-058 Absatz 1: der
   Add-in-Dienst wertet keine Poolregel mehr selbst aus" liest
   `apps/local-api/src/routes/addin/service.ts` — meine Hoheit, also unbedenklich. Sollte die
   Datei je in fremde Hoheit wandern, wandert die Prüfung mit.

---

Nächster Schritt:

Für Welle C: Der Vergleich Hauptanwendung gegen Add-in beim Bewegungssatz (e2e, T-096) kann laufen,
sobald T-094 gelandet ist — beide Flächen rufen dann dieselbe Funktion, und der Vergleich prüft
nicht mehr zwei Wortlaute, sondern zwei Aufrufer. Konkret schlage ich vor, ihn auf den Fall aus
E-056 zu legen: dasselbe erledigte Todo, dieselbe reine Board-Spalte, einmal über den Timerstart
der Hauptanwendung und einmal über die Buchung aus dem Aufgabenbereich — der Satz muss zeichengleich
sein, und die Zeitform ist der einzige erlaubte Unterschied.

Dazu die Entscheidung zu offener Frage 1: Solange die Wirkung „eine Buchung entsteht" an vier
Stellen gebildet wird, ist E-058 nur zur Hälfte eingelöst. Die Rechnung ist eine; die Annahme
darüber, was eine Buchung tut, ist es noch nicht.
