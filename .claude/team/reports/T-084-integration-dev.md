Aufgabe: T-084 — Der Poolsatz gehört auch zu einem offenen Todo, wenn die erste Buchung es in eine
Spalte hebt.

Status: fertig

**Zustand des Baums in einem Satz:** Der Dienst liefert neben `poolNames` (Zustand) jetzt
`enteringPoolNames` (Bewegung), der Aufgabenbereich baut daraus einen **eigenen** Satz ohne
„wieder" — vor der Buchung und nach ihr —, und er läßt ihn ganz weg, wenn die Buchung nichts
bewegt; `proof:addin` steht bei **117** Prüfungen (112 → 117), `pnpm typecheck`,
`pnpm run boundaries`, `proof:addin-wiring`, `proof:taskpane`, `proof:callers`,
`proof:route-policy`, `proof:access` und der Bau des Add-ins sind grün. `proof:openapi` ist im
Baum gerade **rot**, und zwar außerhalb meiner Fläche: `emptyRuleFolderIds` an `/pools` und
`/board` ist geliefert, aber noch nicht beschrieben — die laufende E-057-Arbeit des domain-dev.
Ohne meine Änderungen lautet die Meldung gleich.

---

Artefakte:

Neu: keine Datei.

Geändert:

```
apps/local-api/src/routes/addin/service.ts
    `AddinPoolMovement.enters` neu — die Teilmenge von `appears`, für die vorher
    nicht galt, was nachher gilt. `poolNamer` rechnet sie im **selben** Durchgang
    je Pool aus (`const held = holds(pool, before)`), nicht aus zwei Namenslisten.
    `AddinTodoMatch.enteringPoolNames` und `AddinBookResult.enteringPoolNames` neu.
    Im Kopf festgehalten, **nicht** behoben: `unresolvedRequired` aus E-057 geht
    an `matchesPool` weiterhin nicht mit (siehe „Offene Fragen" Punkt 1).

apps/local-api/src/routes/addin/index.ts
    `enteringPoolNames` in der 201-Antwort der Buchungsroute. Die Trefferliste
    reicht `matches` unverändert durch und brauchte keine Zeile.

apps/local-api/openapi/takt-local-api.yaml   (nur Add-in-Abschnitte)
    `enteringPoolNames` an `AddinTodoMatch` und an der 201-Antwort von
    `POST /addin/todos/{todoId}/time-entries`, beide in `required`.

apps/outlook-addin/src/api/types.ts
    `enteringPoolNames` an `TodoMatchDto` und `BookResponseDto`.

apps/outlook-addin/src/duplicate/rule.ts
    `OfferDescription.enteringPoolNames`; `offerMovement` neu und **exportiert** —
    die eine Stelle, an der aus einem Angebot ein `PoolMovement` wird. Der
    Aufgabenbereich und der Nachweispfad benutzen dieselbe.

apps/outlook-addin/src/duplicate/reopen.ts
    `PoolMovement.enters`; `inPools` aus `poolSentence` ins Modul gehoben (zwei
    Sätze brauchen ihn, `poolSentence` liefert Zeichen für Zeichen dasselbe wie
    vorher); `bookingPoolSentence` und `bookingOutcome`/`BookingNotice` neu.

apps/outlook-addin/src/ui/TaskPane.tsx
    `MovementNote` über der Schaltfläche im Nicht-erledigt-Zweig (bis T-084 stand
    dort `null`), `BookedOutcome` in der Bestätigung. Der Satz „15 Minuten sind
    gebucht. …" ist aus dem JSX in `bookingOutcome` gezogen — unverändert, aber
    jetzt meßbar.

apps/outlook-addin/scripts/proof-addin.mjs
    Fünf neue Prüfungen für T-084 — zwei rein (Abschnitt 5), drei gegen die echten
    Routen (Abschnitt 12). Alle vorhandenen `PoolMovement`-Attrappen um `enters`
    ergänzt.
```

---

Zusammenfassung:

Der Befund stimmt: `bookingStates` setzte `after.hasOpenEntries` schon immer auf wahr, und eine
Spalte `exportState: 'open'` nimmt ein Todo damit auf — nur sah das niemand. Der Dienst konnte es
auch nicht sagen, denn `poolNames` ist der **Zustand danach** und ist auch dann besetzt, wenn sich
nichts rührt. Aus ihm allein läßt sich „erscheint neu in" nicht von „steht ohnehin schon in"
unterscheiden. Die fehlende Auskunft ist deshalb ein dritter Wert und keine Anzeigefrage:
`enteringPoolNames`, im selben Durchgang durch die Regeln gerechnet wie `poolNames` und
`leavingPoolNames`. Ein Nachrechnen im Add-in wäre ein Vergleich über Namen gewesen, und zwei Pools
dürfen denselben Namen tragen — dieselbe Begründung, aus der E-056 `leaves` nicht diffen läßt.

Der Satz hat eine eigene Form. `poolSentence` erklärt eine **Aufhebung** („Es erscheint dann wieder
in …") und zählt dafür alle Pools auf, in denen das Todo danach steht — richtig, weil ein
erledigtes Todo in keinem davon zu sehen war. Für ein offenes Todo wäre beides falsch: „wieder"
behauptet eine Vorgeschichte, die es nicht gibt, und die Aufzählung bestünde fast nur aus
Unverändertem, in dem die eine Änderung untergeht. `bookingPoolSentence` nennt deshalb `enters` und
`leaves` und lautet „Es erscheint dann in dem Pool „X“." beziehungsweise „Es steht jetzt in dem
Pool „X“."

Die Auflage „kein Text ohne Inhalt" liegt im Rückgabetyp und nicht in der Oberfläche:
`bookingPoolSentence` liefert `string | null`, und `null` bei leerer Bewegung. Kein leerer String —
den hätte die Oberfläche in eine Zeile gebaut, ohne daß es jemandem auffällt. Beide Aufrufstellen
prüfen darauf und lassen die Fläche ganz weg. Angezeigt wird der Satz an beiden Orten, an denen
auch der Wiederöffnen-Satz steht: unmittelbar über der Schaltfläche und in der Bestätigung. Das ist
die Zusage aus dem Kopf von `reopen.ts` — vorher und nachher geben dieselbe Auskunft, aus derselben
Funktion.

---

Nachweis (die zwei Fälle aus der Definition of Done):

```
offenes Todo ohne Buchung, Spalte exportState: 'open', Buchung
  enters   ['Wartung, noch nicht abgerechnet']            ← genau die Spalte
  leaves   []
  appears  ['Wartung Nord', 'Wartung, noch nicht abgerechnet']   ← unverändert seit T-078
  vorher   Es erscheint dann in dem Pool „Wartung, noch nicht abgerechnet“.
  nachher  Es steht jetzt in dem Pool „Wartung, noch nicht abgerechnet“.

dasselbe Todo, eine Buchung später
  enters   []
  leaves   []
  appears  ['Wartung Nord', 'Wartung, noch nicht abgerechnet']   ← Zustand gleich, Bewegung weg
  vorher   null   (keine Fläche über der Schaltfläche)
  nachher  15 Minuten sind gebucht. Gerundet wird beim Export, auf die Tagessumme.
           — und sonst nichts. Zeichen für Zeichen der Text von vor T-084.
```

Gemessen wird über die **echten** Routen (`GET /addin/todo-matches`, `POST
/addin/todos/{todoId}/time-entries`) am Todo „Notbetrieb prüfen" (`TCK-000517`, erfunden), und die
Gegenprobe ist dasselbe Todo nach seiner ersten Buchung — nicht ein zweites, ähnlich gebautes. Der
Satz wird zusätzlich über den Weg gebaut, den der Aufgabenbereich geht (Treffer → `describeOffers`
→ `offerMovement`), damit eine Zusammensetzung, die unterwegs ein Feld verliert, hier auffällt und
nicht erst in Outlook.

**Gegenprobe der Messung.** Einmal mutiert, dreimal rot:

```
enters.push(pool.name) ohne `if (!held)`  → 3 von 3 T-084-Routenprüfungen FEHL
```

Die beiden reinen Prüfungen bleiben dabei grün — sie messen die Sätze und nicht den Dienst. Das ist
gewollt und macht sichtbar, welche Prüfung woran hängt.

---

Annahmen:

1. **Ein dritter Wert statt einer neuen Bedeutung für `appears`.** `poolNames` hätte auch „nur die
   neuen" heißen können; dann wäre der Wiederöffnen-Satz still falsch geworden, ohne daß eine
   Zeile bricht. Der Zustand und die Bewegung sind zwei Fragen, und beide werden gebraucht.
   `enters` ist eine Teilmenge von `appears` — die Invariante entsteht durch den Aufbau der
   Schleife und nicht durch eine Prüfung danach.

2. **Der Satz steht auch vor der Buchung, nicht nur danach.** Die Aufgabe verlangt ihn ausdrücklich
   nur für den Nachweis nach der Buchung. Der Kopf von `reopen.ts` verlangt seit T-038, daß
   „vorher" und „nachher" dieselbe Auskunft geben; eine Ankündigung nur im einen Fall wäre die
   Ungleichheit, die C-03 einmal gekostet hat. Beide Sätze kommen aus **einer** Funktion, nur in
   zwei Zeitformen.

3. **Der Fall „ein offenes Todo verliert einen Pool" ist ausgeschrieben, obwohl er im Betrieb nicht
   vorkommt.** Auf einem offenen Todo ändert eine Buchung genau eine Achse — `hasOpenEntries`, von
   falsch auf wahr —, und die kann eine Regel nur zusätzlich erfüllen, nie brechen. Der Zweig steht
   trotzdem da: Kommt eine Achse hinzu, die das ändert, sagt der Satz weiterhin die Wahrheit,
   statt eine Hälfte wegzulassen. Genau diese Auslassung war der Befund hinter E-056.

4. **Der E-057-Hinweis aus dem Auftrag ist geprüft — mit einem Befund, den ich *nicht*
   mitbehoben habe.** Keine Fixture nennt einen leeren Ordner, ihr Ergebnis ändert sich also
   nicht. Der Grund dafür ist aber ein anderer als „E-057 betrifft das Add-in nicht": Der Aufruf
   gibt `unresolvedRequired` gar nicht mit und bekommt deshalb weiterhin die Antwort von vor
   E-057. Einzelheiten in „Offene Fragen" Punkt 1. Ich hatte es ergänzt und wieder
   zurückgenommen, als die Domäne die Signatur von `tagAxisIsUnresolved` **während** dieser
   Aufgabe um `emptyTerms` erweitert hat: eine laufende fremde Entscheidung, und darauf zu raten
   ist genau das, was der Auftrag ausschließt. Im Kopf von `poolNamer` steht die Lücke jetzt
   ausgeschrieben, damit sie niemand für Vollständigkeit hält.

5. **Die Überschrift „Was sich dadurch ändert"** über dem Hinweis vor der Buchung ist Rahmen und
   keine zweite Behauptung — zwischen dem Titel des Todos und dieser Stelle liegen zwei
   Eingabefelder, und die Fläche begänne sonst mit „Es".

---

Risiken:

1. **Der Satz erscheint jetzt häufiger als vorher.** Jede erste Buchung auf einem Todo bringt eine
   Hinweisfläche, sofern eine Spalte über den Exportstatus eingerichtet ist. Wer keine solche
   Spalte hat, sieht nie etwas — dort ist `enters` leer. Ich halte das für die richtige Seite des
   Fehlers: Die Alternative ist die stille Bewegung, die E-056 abgeschafft hat.

2. **Die Anzeige selbst ist nicht maschinell geprüft.** Der Nachweispfad mißt die Sätze und die
   Antworten des Dienstes, nicht das gerenderte JSX; das Add-in läuft hier nicht in Outlook. Daß
   `MovementNote` und `BookedOutcome` an den richtigen Stellen stehen, ist gelesen und nicht
   gemessen. Ein Playwright-Fall im Aufgabenbereich (e2e-tester) wäre die Lücke.

3. **Sicherheit: unverändert.** Kein neues Feld am Token, keine neue Route, keine neue Fähigkeit.
   `enteringPoolNames` trägt Pool**namen** — dieselbe Art Angabe, die `poolNames` seit T-038 über
   dieselbe Leitung schickt. Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum im
   Bestand: `TCK-000517`/`TCK-000518`, „Musterbetrieb Nord", „Wartung Nord" sind erfunden.

4. **Ein gleichnamiger Pool bleibt ein gleichnamiger Pool.** Der Satz nennt Namen, und zwei Pools
   dürfen denselben tragen. Die Rechnung unterscheidet sie (sie vergleicht Regeln, nicht Namen),
   der Satz kann es nicht. Das gilt seit T-038 und ist durch T-084 nicht schlimmer geworden.

---

Offene Fragen:

1. **Der Aufgabenbereich nennt Pools, die das Board seit E-057 nicht mehr führt — wer behebt das,
   und über welchen Port?** `matchesPool` nimmt `unresolvedRequired` nur **freiwillig** entgegen;
   wer es wegläßt, bekommt die zu weite Antwort von vorher. `poolNamer` läßt es weg. Eine Regel
   „Tags aus Ordner X **und** Status In Arbeit", in der X kein Tag enthält, trifft damit im
   Add-in jedes Todo im Status In Arbeit und in der Hauptanwendung keines. Das ist Wort für Wort
   der Schaden aus T-078, nur über eine weitere Achse — und in der schlechteren Richtung: zu
   viele Pools, nie zu wenige.

   Ergänzen kann ich es nicht allein. Die Auskunft steckt nicht in
   `resolveRule`/`resolveExcluded` — eine flache Tagmenge kann nicht sagen, **welcher** genannte
   Ordner nichts beigetragen hat —, sondern in `PoolPort.resolveAxes` (`PoolAxesResolution`).
   Deren eigene Doku nennt „ein Aufrufer in fremder Hoheit (`routes/addin/service.ts`)" als
   Grund, warum die schmalen Methoden daneben bestehen bleiben. Nötig wären: `resolveAxes` im
   Port-Ausschnitt `AddinUnit.pools` (meine Datei), die Ableitung in ihrer **endgültigen**
   Fassung, eine Attrappe dafür in `fixtures.mjs` (meine Datei) und ein Prüffall mit einem
   leeren Ordner. Etwa zwanzig Zeilen, sobald E-057 steht — aber vorher eine Entscheidung
   darüber, ob das Add-in-Token diese breitere Auskunft bekommen soll.

2. **Soll die Hauptanwendung denselben Satz bekommen?** Beim Timerstart in `TimerContext.tsx`
   entsteht dieselbe Bewegung — die erste Buchung hebt ein Todo in jede Spalte über den
   Exportstatus. Der dortige Text redet bisher nur über die Aufhebung von „Erledigt"
   (`CARD_STAYS`, T-045/T-072). Die Datei gehört frontend-dev; ich habe sie nicht angefaßt.

3. **`poolNames` und `enteringPoolNames` heißen im DTO verschieden, in `PoolMovement` heißen sie
   `appears` und `enters`.** Das ist gewachsen (T-038 hat `poolNames` vergeben) und liest sich an
   der Übergabestelle uneben. Umbenennen wäre eine reine Namensänderung über vier Dateien; ich
   habe sie nicht ohne Auftrag gemacht.

---

Nächster Schritt:

`pnpm check` in einem Zug, sobald der Baum nicht mehr mitten in zwei Wellen steht. Bei mir liefen
alle Teilschritte einzeln grün außer `proof:openapi` (fremde Fläche, siehe oben) sowie
`test:coverage` und `verify:bundle`, die ich in einem Baum mit laufenden fremden Änderungen nicht
sinnvoll deuten kann. Danach der Playwright-Fall aus Risiko 2: Angebot wählen, buchen, der Satz
steht in der Bestätigung — und derselbe Ablauf ein zweites Mal auf demselben Todo, mit der
Bestätigung ohne Satz.

Befehle, die ich benutzt habe:

```
pnpm typecheck
pnpm run boundaries
pnpm --filter @takt/outlook-addin proof:addin      (117 Prüfungen)
pnpm --filter @takt/outlook-addin build
pnpm run proof:addin-wiring   pnpm run proof:openapi (rot, fremde Fläche)
pnpm run proof:taskpane       pnpm run proof:callers
pnpm run proof:route-policy   pnpm run proof:access
```
