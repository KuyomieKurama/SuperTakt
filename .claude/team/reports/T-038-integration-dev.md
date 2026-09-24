Aufgabe: T-038 — Befund C-03: „Erledigt" wird im Add-in automatisch aufgehoben (A-2.5, I-05)

Status: fertig

---

Artefakte:

Neu:

```
apps/outlook-addin/src/duplicate/reopen.ts   die Sätze für „vorher" und „nachher", an einem Ort
```

Geändert unter `apps/local-api/src/routes/addin/`:

```
service.ts   bookOnTodo hebt „Erledigt" ohne Bedingung auf; poolNamer über matchesPool;
             AddinTodoMatch und das Buchungsergebnis tragen poolNames
schema.ts    reopenIfDone entfernt; begründet, warum ein Nachzügler kein 422 bekommt
index.ts     Flag nicht mehr durchgereicht, poolNames in der Antwort, Routenkopf neu
ports.ts     pools bekommt resolveRule dazu — mit Begründung an Ort und Stelle
```

Geändert unter `apps/outlook-addin/`:

```
src/api/types.ts           TodoMatchDto.poolNames, BookResponseDto.poolNames
src/api/client.ts          BookRequest ohne reopenIfDone
src/duplicate/rule.ts      OfferDescription.poolNames; „Erledigt" im Kurztext
src/ui/DuplicateOffer.tsx  Ankündigung statt Bedingung in der Trefferliste
src/ui/TaskPane.tsx        Kästchen entfernt; Ankündigung vor dem Buchen,
                           drei Wirkungen danach; Knopfbeschriftung nennt beides
src/styles/addin.css       .effects/.effects__aside neu, .checkline entfernt (unbenutzt)
scripts/fixtures.mjs       pools.resolveRule in der Attrappe, Auflösung über den Baum
scripts/proof-addin.mjs    sieben neue Prüfungen, drei umgeschriebene
```

Nicht angefasst: `apps/web/**`, `packages/domain/**`, `packages/storage/**`,
`packages/export/**` (dort war nichts zu tun), `apps/local-api/**` außer den
Add-in-Routen, `tests/e2e/**`, die Wurzeldateien, `docs/**`. Kein `git commit`.

---

Zusammenfassung:

Das Kästchen ist ersatzlos weg. Eine Buchung aus dem Add-in auf ein erledigtes
Todo hebt das Kennzeichen jetzt in derselben Transaktion auf, ohne Nachfrage und
ohne Voreinstellung — dieselbe Wirkung wie der Timerstart in der Hauptanwendung.
Damit die Aufhebung trotzdem keine stille Änderung ist, sagt der Aufgabenbereich
sie **vorher** an: Die Duplikatsuche liefert zu jedem Treffer die Namen seiner
Pools, die Trefferliste zeigt bei einem erledigten Todo eine Zeile dazu, und der
Bestätigungsschritt nennt über der Schaltfläche die drei Wirkungen einzeln
(Buchung, Kennzeichen, Pools) samt dem Satz „Die Karte bleibt, wo sie ist". Nach
dem Buchen stehen dieselben drei Sätze noch einmal, aus derselben Quelle
(`reopen.ts`) und mit den Pools, die der Dienst tatsächlich zurückgemeldet hat.
Die Pool-Zugehörigkeit wird nicht im Add-in gerechnet, sondern im Dienst über
`matchesPool` aus `@takt/domain` — dieselbe Funktion, die die Pool-Ansicht der
Hauptanwendung benutzt.

`pnpm --filter @takt/outlook-addin proof:addin` steht bei **80 bestanden, 0
fehlgeschlagen** (vorher 73/0). Sieben Prüfungen sind neu, darunter der statische
Riegel „kein Schalter im Add-in", der Nachweis, dass „erledigt" und die Pools
**vor** der Buchung in der Antwort stehen, und der Fall eines Aufrufers aus der
Zeit vor T-038, der `reopenIfDone: false` weiterhin mitschickt: Er bekommt 201
und die Aufhebung trotzdem.

---

Annahmen:

1. **Kein „Rückgängig" im Add-in.** Die Hauptanwendung bietet nach I-05 eines an,
   das die Sekundenbuchung verwirft und das Kennzeichen zurücksetzt. Dasselbe im
   Add-in setzte zwei neue Fähigkeiten auf dem **dauerhaften** Add-in-Token
   voraus: eine Buchung löschen und ein Todo als erledigt kennzeichnen. Das ist
   genau die Ausweitung, die T-034 zurückgebaut hat (B-2.9 Punkt 3, RR-1) — ein
   entwendetes Token käme damit an fremde Buchungen. Der Ersatz ist nicht
   weniger, sondern früher: Die vollständige Auskunft steht **vor** der
   Entscheidung, und der Auftrag nennt als Ziel „der Benutzer soll dasselbe
   erfahren". Die Begründung steht im Kopf von `duplicate/reopen.ts`; ein
   Vorschlag für den Fall, dass es doch gewünscht ist, steht unten unter
   „Offene Fragen".
2. **Ein `reopenIfDone` in der Anfrage ergibt kein 422, sondern wird
   weggeworfen.** Zwei Gründe: Ein `false` von einem älteren Aufrufer darf die
   Aufhebung nicht verhindern — und tut es nicht —, und ein 422 ließe eine
   fachlich vollständige Buchung scheitern. `apps/local-api/scripts/proof-addin-wiring.mjs`
   (fremde Hoheit) schickt das Feld heute noch mit und läuft unverändert grün.
3. **`poolNames` steht an jedem Treffer, nicht nur an erledigten.** Die Auflösung
   der Poolregeln kostet einmal je Anfrage, unabhängig von der Trefferzahl. Die
   Alternative — nur bei Bedarf füllen — hätte ein `null` erzeugt, dessen
   Bedeutung von den *anderen* Treffern derselben Antwort abhinge.
4. **`doneCleared` und `todoWasDone` bleiben beide in der Antwort**, obwohl sie
   jetzt immer gleich sind. Sie sagen Verschiedenes (Vorzustand, Wirkung), und
   der Nachweispfad hält fest, dass sie nicht mehr auseinanderfallen können.
5. **Pool-Aufzählung mit Komma.** Die Hauptanwendung verbindet Poolnamen mit
   „und" (`join(" und ")`), was ab drei Pools holprig wird. Das Add-in schreibt
   „„A", „B" und „C"". Inhaltlich dieselbe Auskunft, andere Zeichensetzung.

---

Risiken:

- **Die OpenAPI-Beschreibung ist jetzt falsch.**
  `apps/local-api/openapi/takt-local-api.yaml` (Zeile 2259 und 2276, fremde
  Hoheit) führt `reopenIfDone` samt der Begründung, die C-03 verursacht hat. Wer
  gegen die Beschreibung baut statt gegen den Dienst, baut den Befund nach.
  Konkreter Änderungsvorschlag unter „Offene Fragen".
- Die Add-in-Fläche des Tokens ist um **eine lesende** Fähigkeit gewachsen
  (`PoolPort.resolveRule`). Sie gibt Regeln heraus, keine Bestände — kein
  fremdes Todo, kein Vermerk. Die engere Alternative gab es nicht: `pools.members`
  wäre eine Abfrage über fremde Todos gewesen. Die Begründung steht in
  `ports.ts`, damit die nächste Erweiterung dort auf einen Präzedenzfall trifft
  und nicht auf ein Schweigen.
- `findMatches` löst jetzt zusätzlich die Poolregeln auf. Die Suche läuft im
  Aufgabenbereich bei **jeder** Änderung des Call-Nummer-Feldes ohne
  Entprellung — das war vorher so und ist jetzt einen Satz Abfragen teurer. Auf
  einer lokalen SQLite-Datei mit einstelliger Poolzahl nicht messbar; bei sehr
  vielen Pools wäre eine Entprellung der erste Handgriff.
- Keine echte Call-Nummer, kein echter Kundenname, kein Zugangsdatum in den
  Prüfdaten. Das neue Todo im Nachweispfad heißt „Nochmals erledigt" und trägt
  `TCK-000816`; die Prüfung auf Beispieldomänen läuft unverändert mit.
- Ungeprüft bleibt wie bisher alles, was Outlook selbst tut. Die Umgestaltung
  betrifft nur React-Bausteine, die auch bisher in keiner Outlook-Sitzung
  gelaufen sind.

---

Offene Fragen:

1. **An domain-dev (Dateihoheit `apps/local-api/openapi/`):** Bitte
   `reopenIfDone` aus dem Rumpfschema von `createAddinTimeEntry` streichen und
   den Absatz darüber ersetzen — etwa: „War das Todo erledigt, ist es nach
   dieser Buchung offen (A-2.5). Das ist keine Option der Anfrage. Die Antwort
   trägt `doneCleared` und `poolNames`." Ebenso in
   `apps/local-api/scripts/proof-addin-wiring.mjs` das Feld aus dem Rumpf
   nehmen; die Prüfung läuft mit und ohne, aber sie liest sich sonst wie eine
   Zusage.
2. **An den Orchestrator:** Soll das Add-in doch ein Rückgängig bekommen? Es
   ginge nur mit einer neuen Route unter `/api/v1/addin` — Vorschlag:
   `POST /addin/time-entries/{id}/discard`, die ausschließlich eine **offene**
   (nicht exportierte) Buchung jünger als wenige Minuten verwirft und das Todo
   wieder als erledigt kennzeichnet. Das verlangt `timeEntries.remove` und
   `todos.markDone` auf der Add-in-Fläche und gehört vor dem Bau vom
   security-checker angesehen. Ich habe es nicht gebaut, weil die Ausweitung
   der Token-Fläche eine Entscheidung ist und keine Nacharbeit.
3. **An spec-ux-reviewer:** Die Bestätigung nach dem Buchen zeigt bei einem
   wieder geöffneten Todo **nur** die drei Wirkungen und nicht zusätzlich die
   bisherige Zeile „Zeit gebucht". Zweimal „15 Minuten sind gebucht" wäre Text,
   den man zu überfliegen lernt — die Zusammenfassung „Gerundet wird beim
   Export" steht weiterhin darunter. Wenn die Prüfung die alte Zeile erwartet,
   ist es ein Handgriff.

---

Nächster Schritt:

`apps/local-api/openapi/takt-local-api.yaml` und
`apps/local-api/scripts/proof-addin-wiring.mjs` bei domain-dev nachziehen
(Offene Frage 1) — solange dort `reopenIfDone` steht, beschreibt die
Schnittstellenbeschreibung einen Dienst, den es nicht mehr gibt. Danach lohnt
ein Blick des spec-ux-reviewer auf S-12: Der Befund C-03 ist geschlossen, die
Sätze im Add-in und die in `apps/web/src/app/TimerContext.tsx` sagen jetzt
dasselbe, sind aber nicht zeichengleich — ob das genügt, entscheidet die
Abnahme und nicht der Bauende.
