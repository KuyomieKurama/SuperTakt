# T-371 — R-34 an der Anforderung aufgespannt: die beiden idle-Türen, der Deckel nach oben, die Überlappung

**Rolle:** domain-dev. **Stand:** 2026-09-14, Welle 12. `HEAD` = `311b26e`.

## Status

**Fertig — mit einem gemessenen Befund an fremdem Gerät, der in die nächste Welle gehört:**
18 vorbestehende Prüffälle in `apps/local-api/test/usecases/idle.test.ts` sind rot. Sie sind
**keine Regression**, sondern eine Fixture-Lücke, und ich habe das bewiesen statt behauptet
(Abschnitt 6). Eine Zeile im `beforeEach` macht alle 23 Fälle der Datei grün; die Datei gehört
dem unit-tester, ich habe sie nicht angefaßt.

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/time-entry.ts` | **B-2** — `decideOrphanedTimer` deckelt auf `min(heartbeatAt, now)`; neues optionales `now`, private `earlierOf` |
| `apps/local-api/src/features/timer/timer.ts` | `bookingEndOfStop` → **exportiertes** `bookingEndOf(context, unit, running, wish)`; `foundAtServiceStart` exportiert; `now` an alle drei `decideOrphanedTimer`-Aufrufe; Schreibstelle in `stopTimer` ausgeschrieben |
| `apps/local-api/src/features/timer/idle.ts` | **B-1** — `beginIdle` weist ab, `completeReturn` deckelt; beide über `bookingEndOf`; Kopfabsatz mit der Begründung |
| `apps/local-api/src/features/data-transfer/data-transfer.ts` | **B-4** — der Absatz „Was das **nicht** deckt" durch den gemessenen Stand ersetzt |
| `packages/storage/src/sqlite/unit-of-work.ts` | **Punkt 5** — die ungeschriebene Zusage `return next` als Kommentar an die Stelle. **Kein Verhalten geändert.** |
| `apps/local-api/scripts/proof-layers.mjs` | **Neu: Abschnitt 7 und 8** — der Wächter, der die Menge aus der Platte zieht. 36/0 → **51/0** |
| `apps/local-api/openapi/takt-local-api.yaml` | Der neue `409` an `/timer/idle/begin`; der Deckel nach oben an `bookableSeconds` |

## Zusammenfassung

Ich habe die Menge nicht an den zwei Zeilen aufgespannt, die im Auftrag stehen, sondern von unten
an der Speicherung: **drei** SQL-Anweisungen schreiben `ended_at` auf eine bestehende Zeile, alle
drei in `repo-time.ts`, und darüber liegen **sieben** Aufrufe im Dienst, die sie auslösen können.
Fünf fragten, zwei nicht. Beide fehlenden stehen jetzt an derselben Funktion, und die Regel steht
nicht siebenmal da, sondern einmal — `bookingEndOf` fragt, `foundAtServiceStart` weiß, was
„vorgefunden" heißt, `decideOrphanedTimer` weiß, was daraus folgt. Damit die achte Tür nicht
wieder erst von einem Prüfer gefunden wird, zieht `proof:layers` Abschnitt 7 die Menge jetzt aus
der Platte: Jede schließende Zeile muß `bookingEndOf` sichtbar an der Schreibstelle tragen oder
namentlich mit Grund in einer Ausnahmeliste stehen, und jede Ausnahme muß etwas treffen. Der
Wächter hat beim ersten Lauf sofort zwei Stellen gefunden, an denen ich die Frage in eine
Zwischenvariable ausgelagert hatte — die Bauart, an der T-363 gescheitert ist; beide sind jetzt
ausgeschrieben.

---

## 1 — Die Tabelle: **alle** Stellen, die `ended_at` auf einen offenen Eintrag schreiben

### 1a — Wie ich die Menge aufgespannt habe, und warum sie vollständig ist

Nicht an Routen, nicht an einer Liste, die ich kenne, sondern an **zwei Engpässen**, durch die
jeder Weg muß:

**Engpaß 1 — die Speicherung.** Eine Buchung entsteht aus einem offenen Eintrag genau dann, wenn
jemand `ended_at` auf eine **bestehende** Zeile schreibt. Gemessen über den ganzen Quellbaum von
`@takt/storage`:

```
UPDATE time_entry SET ended_at …    3 Treffer, alle in packages/storage/src/sqlite/repo-time.ts
```

Alles andere, was `ended_at` überhaupt anfaßt, legt Zeilen **mit** Ende an und kann einen offenen
Eintrag nicht berühren — das ist kein Vertrauen, sondern nachgelesen:

- `timeEntries.create` (`repo-time.ts:179`), `foreign.ts:547`, `addin/service.ts:934` —
  `INSERT … VALUES (…, ?, …)` mit einem Ende aus der Eingabe. Kein offener Eintrag im Spiel.
- `timeEntries.update` (`repo-time.ts:~220`) kann `ended_at` setzen, aber `loadOne(id)` gibt für
  `ended_at IS NULL` grundsätzlich `null` zurück → `not_found`, **bevor** eine Anweisung gebaut
  wird. Strukturell zu, nicht nach Absprache.
- `dataArchive.replaceAll` (`repo-data-archive.ts`) schreibt `time_entry` **im ganzen** aus einem
  Archiv. Das ist der *zweite Eingang* aus R-34 und wird nicht gedeckelt, sondern nachgeführt —
  `importDataArchive` stellt in **derselben** Klammer die Aufnahme neu (T-358). Ein Archiv kann
  einen offenen Eintrag mitbringen; es kann keinen **schließen**, den es nicht selbst gebracht hat.
- `repo-time.ts:356` und `:414` sind die `INSERT`s der beiden Anweisungen darunter: sie eröffnen
  den Nachfolger, sie schließen nichts.

**Engpaß 2 — die Aufrufe.** Über den drei Anweisungen liegen genau drei Portmethoden
(`timer.stop`, `timer.separateIdle`, `timer.start` mit Verdrängung). Gemessen über den ganzen
Quellbaum von `apps/local-api/src`, Prosa ausgenommen, `timer.start` mit literalem `false`
ausgenommen (der Port kann dann nichts schließen): **sieben** Aufrufe. Das ist dieselbe Sieben,
die T-370 gezählt hat — unabhängig und von unten erreicht.

**Warum die Menge vollständig ist:** Sie ist **komplementär** gebildet, nicht aufgezählt. Eine
neue Datei, ein neues Merkmal, ein verschobener Anwendungsfall — alles landet ohne Zutun *in* der
Messung, weil `proof:layers` seine Dateimenge als „alles unter `src/`, was nicht ausdrücklich
Rand ist" bildet (T-268) und ich denselben Träger benutze. Wer eine achte Tür aufmacht, muß sie
**eintragen**, um grün zu bleiben, und der Eintrag ist sichtbar. Der Beweis, daß das greift: Der
erste Lauf des neuen Abschnitts war **rot** — er hat zwei eigene Stellen gefunden, an denen ich
die Frage eine Zeile vom Schreibvorgang weggerückt hatte.

### 1b — Die sieben Stellen

| # | Stelle | Weg | vorher | **nach dieser Änderung fragt sie?** |
|---|---|---|---|---|
| 1 | `features/timer/timer.ts:657` `stopTimer` | `timer.stop` | gedeckelt (T-363) | **ja** — `bookingEndOf(…, timestamp)`, jetzt ausgeschrieben an der Schreibstelle |
| 2 | `features/timer/timer.ts:460` `startTimer`, vorgefundener verdrängter Eintrag | `timer.stop` | gedeckelt (T-363) | **ja** — `bookingEndOf(…, timestamp)` |
| 3 | `features/timer/timer.ts:471` `startTimer` → `timer.start(…, stopRunning, …)` | Port verdrängt selbst | ungedeckelt für einen Timer **dieses** Laufs (richtig) | **begründete Ausnahme** — ein vorgefundener Eintrag ist eine Zeile darüber schon geschlossen (`closedBeforeStart`), sonst ist die Wanduhr richtig |
| 4 | `features/timer/timer.ts:808` `resolveOrphanedTimer`, Ausgang „verwerfen" | `timer.stop` | gedeckelt (E-036) | **begründete Ausnahme** — Zeitpunkt = Startzeitpunkt, Dauer 0, Zeile fällt weg; die Frage steht darüber |
| 5 | `features/timer/timer.ts:834` `resolveOrphanedTimer`, Ausgang „buchen" | `timer.stop` | gedeckelt (E-036), **aber ohne Deckel nach oben** | **begründete Ausnahme + B-2 behoben** — Ende aus `decideOrphanedTimer`, das jetzt `now` bekommt |
| 6 | `features/timer/idle.ts:121` `completeReturn` → `separateIdle` | `separateIdle` | **offen — 39 000 s gemessen** | **ja, deckelt** — `bookingEndOf(…, pending.startedAt)` |
| 7 | `features/timer/idle.ts:175` `beginIdle`, Pause aus | `timer.stop` | **offen — 39 000 s gemessen** | **ja, zweite Wand** — die Abweisung davor macht sie für einen vorgefundenen Eintrag unerreichbar; sie fragt trotzdem |

**Nicht in der Menge, geprüft und begründet:** `idle.ts:130` und `idle.ts:221` rufen
`timer.start(…, false, …)` — mit literalem `false` kann der Port nichts schließen, und beide
stehen zusätzlich hinter `running === null`.

---

## 2 — B-1: die Entscheidung, und warum sie in zwei Richtungen ausfällt

**Die Frage des Auftrags — deckeln oder abweisen? — hat zwei verschiedene Antworten, und die
Trennlinie ist nicht der Weg, sondern ob es einen anderen Ausgang aus dem Zustand gibt.**

### `beginIdle` **weist ab** (`409 conflict`)

> „Diese Buchung ohne Ende stammt aus einem früheren Lauf. Entscheiden Sie zuerst, ob sie gebucht
> oder verworfen wird."

Drei Gründe, in dieser Reihenfolge:

1. **Der Stopp ist eine Antwort, dieser Aufruf ist es nicht.** T-363 hat den Stopp mit dem Satz
   begründet, der Benutzer sage „buchen", und genau das sei die Vorgabe des Dialogs. Für
   `idle/begin` trägt der Satz nicht: `useIdleTimer` schickt ihn von selbst, sobald jemand
   weggeht. Ein Deckel schlösse die Buchung auf 1 200 s, **während der Benutzer nicht am
   Rechner ist**, und nähme ihm dabei den Ausgang „verwerfen", den E-036 ausdrücklich anbietet.
   E-036 sagt zu, daß die Buchung unvollständig bleibt und in keinen Export geht, *bis der
   Benutzer geantwortet hat*. Ein stiller Deckel bricht diese Zusage; eine Abweisung nicht.
2. **Es ist der einzige Ort, an dem eine Inaktivitätsphase auf einem vorgefundenen Eintrag
   überhaupt entstehen kann.** Wird sie hier verweigert, entsteht sie nie — und damit auch nicht
   das Zuordnungsfenster, aus dem der Benutzer hinterher Stunden auf Todos verteilen könnte, die
   ein toter Lauf nicht gearbeitet hat. Deckeln hätte die *Buchung* verkleinert und das *Fenster*
   stehengelassen; das ist die halbe Wahrheit, und die teurere Hälfte.
3. **Es entsteht keine Sackgasse.** Ohne offene Inaktivität bleiben `GET /timer/orphaned`,
   `POST /timer/orphaned/resolve` (beide Ausgänge!) und `POST /timer/stop` offen — alle drei
   gedeckelt. Genau das Argument, mit dem T-363 gegen ein `conflict` am Stopp entschied, fällt
   hier also andersherum aus.

### `completeReturn` **deckelt**

Nach der Abweisung oben sieht diese Stelle einen vorgefundenen Eintrag nur noch auf **einem** Weg:
Die Inaktivitätsphase lag schon in SQLite, als der Dienst hochkam (A-24.7) — abgestürzter Lauf
oder Archiv. Dort wäre Abweisen eine **echte** Sackgasse: `stopTimer`, `loadOrphanedTimer` und
`resolveOrphanedTimer` verweigern alle drei, solange eine unbestätigte Rückkehr aussteht. Beide
Türen zu, und der Benutzer käme nur mit einem Datenbankeditor heraus.

Also: schließen, aber `min(pending.startedAt, letztes Lebenszeichen)`. Das ist **keine tote Zeile**
— gemessen (Fall [8]): Trägt ein Archiv eine Abwesenheit ab `10:00` bei einem Lebenszeichen von
`06:20`, buchte der Rückkehrweg vorher **14 400 s** und jetzt **1 200 s**. Fehlt das Lebenszeichen
ganz, gibt `bookingEndOf` den Startzeitpunkt zurück, `separateIdle` räumt die Zeile ab, und es
entsteht **gar keine** Buchung — derselbe Ausgang wie „verwerfen" im Dialog, gemessen.

**A-24 gegen E-036 ist damit nicht aufgelöst, sondern verortet:** A-24 gilt für den Timer eines
**lebenden** Laufs, E-036 für die Leiche eines toten. Der Satz steht im Kopf von `idle.ts`.

---

## 3 — B-2: der Deckel nach oben, in `packages/domain`

`decideOrphanedTimer` bekommt ein **optionales** `now` und bucht bis `min(heartbeatAt, now)`.
Zwei Folgen, beide gemessen:

- **Keine Buchung in der Zukunft** — und damit auch keine Überlappung mit dem, was der Lauf
  danach startet (Abschnitt 4).
- **Eine rückwärts laufende Uhr verwirft.** Liegt `now` vor `startedAt`, rechnet `decideTimerStop`
  eine negative Dauer und gibt `timer_too_short`. Die billige Richtung.

**`now` ist optional, und das ist ein Zugeständnis, kein Entwurf.** Ein Pflichtfeld wäre die
ehrlichere Zusage — es würde die teure Ausfallrichtung („kein `now`, kein Deckel") ausschließen.
Es ist heute nicht schreibbar: sechs vorbestehende Fälle in `packages/domain/test/timer.test.ts`
rufen die Funktion ohne `now` und würden zu `tsc`-Fehlern; Prüffälle gehören dem unit-tester, und
`pnpm typecheck` muß grün sein. **Der Ersatz ist eine Messung statt eines Typs:** `proof:layers`
Abschnitt 7 verlangt, daß **jeder** Aufruf im Dienst `now` übergibt (heute 3 von 3). Wenn der
unit-tester die sechs Fälle nachzieht, ist das Pflichtfeld eine Einzeilenänderung — Vorschlag
unter „Offene Fragen".

---

## 4 — Die Überlappung: beidseitig gemessen, und sie fällt mit B-2

T-369 hat sie an `startTimer` gefunden und als Regression aus T-363 eingeordnet. Das stimmt, und
die Ursache ist nicht `startTimer`, sondern der fehlende Deckel: Die verdrängte Buchung erbte das
Ende aus einem Lebenszeichen der Zukunft, der neue Timer begann bei „jetzt".

```
vorher (T-363-Stand)  geschlossen 06:00 → 9999-12-31 (251 613 021 599 s), laufend ab 17:00   Überlappung JA
jetzt                 geschlossen 06:00 → 17:00      (39 600 s),           laufend ab 17:00   Überlappung nein
```

Sekundengenau anschließend, ohne Überlappung und ohne Loch — A-24 gehalten, ohne daß `startTimer`
eine eigene Meinung bekommt.

**Zum Hinweis aus T-368** („die Fehlschlagspfade von `startTimer` sind ungemessen, und dort liegt
die Überlappung"): Die Überlappung lag gemessen auf dem **Erfolgsweg** — `start=started` in beiden
Läufen oben. Der Fehlschlagspfad bleibt trotzdem ungemessen und trägt einen eigenen, unveränderten
Befund von T-369 (`timer.ts`, der Wurf nach `closedBeforeStart` wirft den Grund weg). Ich habe ihn
**nicht** angefaßt; er ändert einen Antwortcode und gehört in einen eigenen Auftrag.

---

## 5 — Läufe und Messungen, alle selbst gefahren

### 5a — Beidseitige Messung (zwei `:memory:`-Bestände, zwei bewegliche Uhren, echter Weg `exportDataArchive` → `importDataArchive` → Anwendungsfall; kein HTTP)

T0 = `06:00`, Lebenszeichen `06:20`, Zieluhr `17:00`, Abwesenheit ab `16:50`.
„vorher" = `git show HEAD:…/idle.ts` für die idle-Fälle, und für die Deckelfälle dieselbe
gelieferte Datei **ohne** die zwei `now`-Zeilen (der T-363-Stand liegt nicht in `git`, er ist
unfertig im Arbeitsbaum).

| Fall | vorher | **jetzt** |
|---|---|---|
| [1] Archiv, `keepTimerRunning = true` (Vorgabe), `idle/begin`+`idle/return` | **39 000 s**, `export_status = open` | `begin` → **409 conflict**, **keine Buchung** |
| [1] Archiv, `keepTimerRunning = false` | **39 000 s** | 409 conflict, keine Buchung |
| [2] **ohne Archiv**, gewöhnlicher Absturz, dieselben zwei Aufrufe | **39 000 s** | 409 conflict, keine Buchung |
| [1] Dialogangebot für denselben Eintrag, alle Fälle | 1 200 s | 1 200 s (unverändert) |
| [3] **eigener Timer**, `keepTimerRunning = true` | 39 000 s gebucht, laufend ab `17:00` | **zeichengleich** |
| [3] **eigener Timer**, `keepTimerRunning = false` | 39 000 s gebucht, kein laufender | **zeichengleich** |
| [4] Lebenszeichen `9999-12-31`, Dialog / Stopp | **251 613 021 599 s / 251 613 021 599 s** | **39 600 / 39 600** |
| [5] Verdrängung bei Lebenszeichen `9999-12-31` | 06:00 → **9999-12-31**, **Überlappung JA** | 06:00 → 17:00, **keine Überlappung** |
| [6] Archiv, direkter `POST /timer/stop` (Gegenprobe T-363) | 1 200 s | **1 200 s** |
| [6] eigener Timer, Stopp (der gewöhnliche Fall) | 39 600 s | **39 600 s** |
| [7] Archiv mit **offener** Inaktivität, Rückkehr (T-363 M5) | 600 s gebucht, Fenster 39 000 s | **identisch** — B-5 unberührt |
| [8] Archiv, Abwesenheit ab `10:00`, Lebenszeichen `06:20` | **14 400 s** | **1 200 s**, kein Überlappen |
| [9] dasselbe **ohne** Lebenszeichen auf dem Zielrechner | — | `return` → ok, **gar keine Buchung**, frischer Timer ab `17:00`, kein Dialogrest |

### 5b — Nachweisläufe

| Lauf | Ergebnis |
|---|---|
| `tsc` Wurzel + `packages/{domain,storage,export}` + `apps/{local-api,outlook-addin,desktop}` | **Exit 0** je Projekt |
| `tsc -p …/tsconfig.test.json` für `packages/{domain,storage,export}` und `apps/local-api` | **Exit 0** je Projekt |
| `pnpm typecheck` **als Ganzes** | **rot — in `apps/web`, nicht bei mir.** `src/features/todos/TodoTagsCell.tsx(166,5): error TS2304: Cannot find name 'closedFromIntent'` (plus 5 gleichartige). Die Datei ist **unversioniert** (`?? apps/web/src/features/todos/TodoTagsCell.tsx`) und stammt aus der laufenden Arbeit des frontend-dev in dieser Welle. `typecheck:e2e` läuft danach grün; `typecheck:test` bricht an derselben Datei ab, **nachdem** meine vier Projekte grün durch sind. |
| `pnpm boundaries` | grün, **532** Quelldateien außerhalb der Domäne, „Notiz-Trennung: alle Schichten unverletzt" |
| `vitest run packages/{domain,storage,export}/test` | **1 283 grün**, 0 rot, 53 Dateien |
| `vitest run apps/local-api/test` | **347 grün, 18 rot, 2 übersprungen** — alle 18 in `usecases/idle.test.ts`, siehe Abschnitt 6 |
| `proof:layers` | **51 bestanden, 0 fehlgeschlagen** (vorher 36/0; +15 durch die neuen Abschnitte 7 und 8) |
| `proof:openapi` | 115 / 0 |
| `proof:callers` | 74 / 0 |
| `proof:route-policy` | 48 / 0 |
| `proof:codepoints` | 46 / 0 |
| `proof:db-permissions` | 27 / 0 |
| `proof:release-safety` | 158 / 0 |
| `proof:access` (bindet 17843 — `ss -ltn` vorher: frei) | 111 / 0 |
| `proof:conflicts` (dito) | 154 / 0 |

**Nicht gefahren, und warum:** `pnpm check` als Ganzes, `test:coverage`, `build`, `test:rust`,
`test:e2e` — im Arbeitsbaum liegen unfertige Änderungen anderer Agenten (`apps/web/**`,
`features/version/**`), und `apps/web` bricht schon am Typecheck ab. **Nichts davon ist hier als
grün gemeldet.**

### 5c — Ein eigener Fehler, der fremde Läufe rot gemacht hat

**Ich habe meine Meßkopien im Quellbaum abgelegt, und das war falsch.** Für die beidseitige
Messung lagen `head-t371-idle.ts` und `head-t371-timer.ts` zeitweise unter
`apps/local-api/src/features/timer/`, dazu `measure-t371.mts`, `probe-t371.mts` und zwei
`dbg*.mts` unter `apps/local-api/`. Solange eine solche Datei dort liegt, ist **jeder**
`typecheck`, `boundaries` und `proof:*`-Lauf jedes anderen Agenten rot — und keiner von ihnen kann
sehen, warum. Der frontend-dev der parallelen Welle hat genau das gemeldet:
`pnpm typecheck` scheiterte an `head-t371-timer.ts`. Sein Wiederholungslauf war grün, es ist also
nichts kaputtgegangen; der Fehler liegt trotzdem bei mir, nicht bei ihm.

Der richtige Weg wäre der von T-368 gewesen — Meßkopien außerhalb von `apps/**` und `packages/**`,
und wenn ein Meßweg die Datei zwingend am Originalort braucht, die Produktivdatei kurzzeitig
ersetzen und **byte-identisch** zurückschreiben. Mein Meßweg brauchte den Originalort **nicht**:
Die zwei HEAD-Fassungen mußten nur irgendwo liegen, wo `@takt/…` auflöst. Ich hätte sie unter
`/tmp` legen und die Einfuhren absolut schreiben können.

**Stand jetzt, gegengelesen statt behauptet:**

```
find apps packages tests -name '*t371*' -o -name 'measure-*' -o -name 'probe-*' \
                         -o -name 'dbg*'  -o -name 'head-*'
  apps/web/scripts/engine-parity/measure-bands.py      (versioniert, fremd, seit PR #9)

git status --porcelain   →  aus meiner Hand genau acht Einträge:
  M apps/local-api/openapi/takt-local-api.yaml
  M apps/local-api/scripts/proof-layers.mjs
  M apps/local-api/src/features/data-transfer/data-transfer.ts
  M apps/local-api/src/features/timer/idle.ts
  M apps/local-api/src/features/timer/timer.ts
  M packages/domain/src/time-entry.ts
  M packages/storage/src/sqlite/unit-of-work.ts
  ?? .claude/team/reports/T-371-domain-dev.md
```

**Keine Meßdatei ist übriggeblieben**, weder unter `apps/**` noch unter `packages/**` noch unter
`tests/**`. Die Kopien liegen im Kritzelverzeichnis der Sitzung. Nach dem Aufräumen habe ich die
Läufe, die eine solche Datei umgeworfen hätte, **noch einmal** gefahren:
`tsc` je `tsconfig.json` **und** `tsconfig.test.json` für `packages/{domain,storage,export}` und
`apps/local-api` — Exit 0; `pnpm boundaries` — grün, 532 Dateien; `proof:layers` — 51/0.

---

## 6 — Der Befund an fremdem Gerät: 18 rote Prüffälle, gemessen als Fixture-Lücke

`apps/local-api/test/usecases/idle.test.ts` baut seinen Zusammenhang im `beforeEach` **ohne**
`timerRecovery`:

```ts
context = { transactions: db.transactions, clock: { now: () => clock } } as AppContext;
```

`foundAtServiceStart` fällt ohne Aufnahme auf „verwaist" — die billige Richtung, die T-363
bewußt so gewählt und als Falle **vorhergesagt** hat (T-363 Abschnitt 4, Fall G: „Jeder von Hand
gebaute Zusammenhang, in dem ein Timer läuft, muß `timerRecovery: { entryId: null }` tragen").
Bis heute fiel das nicht auf, weil `idle.ts` die Frage gar nicht stellte. Jetzt stellt sie sie,
und in diesem Zusammenhang gilt jeder Eintrag als Leiche.

**Gemessen statt vermutet:** Ich habe eine **Kopie** der Datei im Bestand angelegt, genau diese
eine Zeile um `timerRecovery: { entryId: null }` ergänzt, gefahren und die Kopie wieder gelöscht:

```
vitest run apps/local-api/test/usecases/t371-fixture-probe.test.ts
  Test Files  1 passed (1)
  Tests       23 passed (23)
```

**Alle 23 Fälle grün, keine einzige Erwartung geändert.** Die 18 roten sind also die Fixture, nicht
das Verhalten. Die Zeile gehört dem unit-tester; ich habe sie im Bestand **nicht** gesetzt.

Zwei Dinge dazu, die über den Fall hinausgehen:

- **Jede korrekte Behebung von B-1 hätte diese 18 rot gemacht**, auch die reine Deckelvariante:
  In diesem Zusammenhang gibt es kein Lebenszeichen, `bookingEndOf` gäbe den Startzeitpunkt
  zurück, und die erwarteten 600 s fielen als „zu kurz" weg. Die Wahl zwischen Abweisen und
  Deckeln ist an dieser Stelle also **kein** Unterschied — das war für mich kein Kriterium.
- Es ist genau der Fall aus CLAUDE.md („T-315/T-316"): Wer eine Schnittstelle umbaut und wer sie
  mißt, gehören in aufeinanderfolgende Wellen. T-369 hat vor dieser Gleichzeitigkeit ausdrücklich
  gewarnt.

---

## 7 — Der Wächter: `proof:layers` Abschnitt 7 und 8

Weil ein neuer Lauf einen Eintrag in `package.json` bräuchte (Orchestrator) und ein Wächter, den
niemand fährt, keiner ist, liegt er in `proof:layers` — demselben Lauf, der schon mißt, daß eine
Regel der Domäne nicht in der Anwendungsfallschicht zweitentschieden wird. Er prüft:

1. `UPDATE time_entry SET ended_at` steht in **genau einer** Datei der Speicherung, und es sind
   **genau drei** Anweisungen.
2. **Alle sieben** schließenden Aufrufe im Dienst tragen `bookingEndOf` **an der Schreibstelle**
   oder stehen mit **Wortlaut und Grund** in `BEGRUENDETE_AUSNAHMEN`.
3. Jede Ausnahme trifft heute eine Zeile auf der Platte (E-103 Punkt 1, zweiseitig).
4. **Alle** Aufrufe von `decideOrphanedTimer` übergeben `now` — der Ersatz für das Pflichtfeld,
   das der Typ nicht tragen kann.
5. Abschnitt 8: sechs Gegenproben, darunter „eine achte Tür ohne `bookingEndOf` fällt auf",
   „dieselbe Zeile als Kommentar zitiert gilt **nicht** als Tür" und „ein `decideOrphanedTimer`
   ohne `now` fällt auf".

**Er hat sich beim ersten Lauf selbst bewährt:** rot, drei Treffer — zwei echte (ich hatte die
Frage in `stopTimer` und `completeReturn` in eine Zwischenvariable ausgelagert; genau die Bauart,
die die Frage von der Schreibstelle wegrückt) und ein Fehlalarm auf einer **Prosazeile**, die den
Aufruf zitiert. Beide echten Stellen sind jetzt ausgeschrieben, der Fehlalarm ist mit einer
Gegenprobe in beide Richtungen abgestellt.

---

## 8 — Annahmen

1. **`beginIdle` weist ab, `completeReturn` deckelt** (Abschnitt 2). Das ist die Entscheidung, die
   der Auftrag mir überlassen hat. T-370 hielt durchgängiges Deckeln für richtig; ich weiche für
   `beginIdle` begründet ab und für `completeReturn` nicht.
2. **`decideOrphanedTimer.now` bleibt optional** (Abschnitt 3), gemessen statt getippt.
3. **`bookingEndOfStop` heißt jetzt `bookingEndOf`** und nimmt einen **Wunsch** statt einer
   Wanduhr. Die vier Aufrufstellen unterscheiden sich nur in diesem Wunsch; die Regel steht
   einmal.
4. **Die Frage steht ausgeschrieben an der Schreibstelle**, auch wo eine Zwischenvariable sich
   schöner läse. Begründet an `stopTimer` und vom Wächter gemessen.
5. **Keine Prüffälle geschrieben, keine fremde Prüfdatei geändert.** Die Meßkopie in
   `apps/local-api/test/usecases/` existierte für einen Lauf und ist gelöscht. **Sie hätte
   dort nicht liegen dürfen** — siehe Abschnitt 5c, das gilt für alle meine Meßkopien dieser
   Aufgabe.
6. **B-5 nicht gebaut, nur benannt** (Abschnitt 9, Risiko 2) — der Auftrag verlangt das Benennen.
7. **Vier T-369-Befunde nicht angefaßt**, weil sie Antwortcodes oder Schnittstellen ändern und
   nicht zu B-1/B-2 gehören: der weggeworfene Wurfgrund in `startTimer`, `updated_at` aus der
   Vergangenheit nach einem gedeckelten Stopp, die doppelte Aufnahmezeile
   (`data-transfer.ts` ↔ `captureTimerRecovery`), der Ausgang „verwerfen" als verschlüsselter
   Zeitstempel. Alle vier stehen unter „Offene Fragen".

---

## 9 — Risiken, einschließlich Sicherheitshinweisen

1. **Die Oberfläche zeigt jetzt eine Fehlermeldung, wo vorher still gebucht wurde.**
   `useIdleTimer` reicht den Text des `409` durch (`setError(errorMessage(cause))`) und wiederholt
   frühestens nach 60 s (`retryAt = Date.now() + SERVER_SYNC_MS`) — kein Sturm, aber sichtbar.
   Der Satz ist deshalb einer, der sagt, was zu tun ist. **`apps/web` gehört mir nicht**; ob der
   Text dort an der richtigen Stelle landet, muß frontend-dev oder der ux-Reviewer beurteilen.
2. **B-5 ist unverändert offen und gemessen** (Fall [7]): Ein Archiv mit **offener**
   Inaktivitätsphase führt nach der Rückkehr zu einem Zuordnungsfenster von **39 000 s**, die der
   Benutzer auf Todos verteilen kann. Die *Buchung* ist richtig (600 s), das *Fenster* trägt die
   Uhrdifferenz. Kein stiller Weg — es braucht eine ausdrückliche Verteilung —, aber es ist
   derselbe Uhrversatz in einem Dialog. Gehört zu A-24, nicht zu E-036.
3. **Keine Obergrenze für eine Dauer** (A-A-127, B-3, offen seit T-357). Der Deckel aus B-2 nimmt
   die beiden größten gemessenen Zahlen weg, ersetzt aber keine Obergrenze: Eine
   `time_entry`-Zeile aus einem Archiv kann weiterhin beliebig lang sein, und `foreign.ts` nimmt
   Sekunden aus einer fremden Datei ohne obere Schranke.
4. **Die Ausfallrichtung ohne `timerRecovery` ist schärfer geworden.** Bis heute hieß „kein
   Zusammenhang" nur, daß weniger gebucht wird; seit dieser Änderung heißt es zusätzlich, daß
   `POST /timer/idle/begin` **verweigert**. Für das Erzeugnis ohne Belang (`composition.ts` setzt
   das Feld im einzigen Zweig, in dem ein `AppContext` entsteht), für jeden von Hand gebauten
   Zusammenhang eine Falle — und genau das sind die 18 roten Fälle aus Abschnitt 6.
5. **`decideOrphanedTimer.now` ist optional.** Ein Aufrufer ohne den Wert bekommt keinen Deckel.
   Heute mißt `proof:layers` Abschnitt 7, daß es keinen solchen Aufrufer gibt; fällt dieser
   Abschnitt, fällt die Zusage still.
6. **Die eine Klammer aus T-358 hängt weiterhin an einer ungemessenen Zeile.** Ich habe den Satz
   als Kommentar an `unit-of-work.ts:236` geschrieben, wie beauftragt — **mehr nicht**. Solange
   kein Prüffall einen nebenher gereihten Leser mißt, ist die Zusage eine Absicht.
7. **Ich habe fremde Läufe rot gemacht** (Abschnitt 5c). Behoben und gegengelesen, aber es ist ein
   Risiko für die Welle gewesen und keines des Erzeugnisses: Ein anderer Agent hat einen roten
   `typecheck` gesehen, dessen Ursache in einer Datei lag, die ihn nichts anging. Wäre er ihm
   nicht aufgefallen, hätte er einen eigenen Befund dort gesucht, wo keiner war.
8. **Sicherheit im engeren Sinn:** keine neue Adresse, kein neuer Pfad, keine neue Route, keine
   geänderte Rumpfgrenze, kein `any`, keine neue Typzusicherung, kein `@ts-ignore`. Die
   OpenAPI-Änderungen sind ausschließlich Beschreibungstexte plus die genauere `409`-Angabe an
   einem **bestehenden** Pfad; `security` ist unberührt. Die Notiz-Trennung ist unberührt
   (`pnpm boundaries` grün). Gerundet wird weiterhin ausschließlich im Export.

---

## 10 — Offene Fragen an den Orchestrator

1. **Die eine Zeile in `apps/local-api/test/usecases/idle.test.ts`** — gemessen genügt
   `timerRecovery: { entryId: null }` im `beforeEach`, und alle 23 Fälle sind grün. Auftrag an den
   unit-tester in der **nächsten** Welle, nicht gleichzeitig mit einem Agenten in `features/timer/**`.
2. **Soll `decideOrphanedTimer.now` Pflicht werden?** Ich halte es für richtig; es kostet die
   Anpassung von sechs Fällen in `packages/domain/test/timer.test.ts` und muß deshalb **nach**
   dem unit-tester kommen. Bis dahin trägt `proof:layers` Abschnitt 7 die Zusage.
3. **A-A-127 (Obergrenze) in dieser Welle?** Sie ist die einzige Auflage aus Kapitel 45.5, die
   seit drei Prüfungen unberührt steht, und sie fängt B-1 bis B-3 als zweite Wache ab.
4. **B-5 — das A-24-Zuordnungsfenster aus einem Archiv** (39 000 s). Braucht eine Entscheidung,
   bevor jemand baut: Soll eine Inaktivitätsphase, deren Eintrag beim Dienststart vorgefunden
   wurde, überhaupt noch verteilbar sein, oder gilt sie als unbelegt und wird abgeräumt? Das ist
   eine Produktfrage an A-24, keine Codefrage.
5. **Die vier unangetasteten T-369-Befunde** (Annahme 7). Der erste — `startTimer` wirft den Grund
   weg — ändert einen Antwortcode und braucht eine OpenAPI-Zeile; die anderen drei sind Hygiene.
   Ein kleiner eigener Auftrag, nicht dieser.
6. **`apps/web/src/features/timer/api.ts:207`** tippt die Antwort von `POST /timer/heartbeat` als
   `{ seenAt: Timestamp }`, obwohl `null` seit T-363 der zweite Regelfall ist (Befund von T-369).
   Fremde Hoheit; gemeldet, nicht angefaßt.
7. **`risks.md`, R-34.** Vorschlag für den Wortlaut: die beiden idle-Türen als **geschlossen**
   führen (39 000 s → 409 conflict, beidseitig gemessen, mit Archiv und ohne, in beiden Stellungen
   von `idleKeepTimerRunning`), den Deckel nach oben als geschlossen
   (251 613 021 599 s → 39 600 s) samt der Überlappung — und **offen** stehenlassen: die fehlende
   Obergrenze (B-3/A-A-127), das A-24-Zuordnungsfenster (B-5) und die ungemessene Zusage in
   `unit-of-work.ts`. Die Einstufung gehört dem Orchestrator; meine Empfehlung ist, R-34 **nicht**
   zu schließen, bevor die 18 Prüffälle grün sind und ein Fall die idle-Tür mißt — sonst ist die
   Schließung zum dritten Mal eine Behauptung.

---

## 11 — Nächster Schritt

1. **unit-tester, nächste Welle, ein Auftrag:** die eine Fixture-Zeile (Abschnitt 6), dazu die
   Fälle, die diese Arbeit gegen ein Zurückdrehen sichern —
   **(a)** vorgefundener Eintrag + `POST /timer/idle/begin` → `conflict`, **keine** Zeile
   geschrieben, in **beiden** Stellungen von `idleKeepTimerRunning`, mit Archiv und ohne;
   **(b)** vorgefundener Eintrag + eingespielte **offene** Inaktivität → Rückkehr bucht
   `bookableSeconds`, `not.toBe(39900)`, und ohne Lebenszeichen **gar nichts**;
   **(c)** Gegenprobe: eigener Timer, Inaktivität, `39 000 s` gebucht und der Folgetimer beginnt
   bei der Rückkehr — **ohne Überlappung**;
   **(d)** Lebenszeichen aus der Zukunft: Dialog **und** Stopp nennen dieselbe Zahl, und
   `startTimer` erzeugt kein `ended_at` hinter dem `started_at` des Nachfolgers;
   **(e)** der nebenher gereihte Leser aus `unit-of-work.ts` (Risiko 6).
2. **code-reviewer und security-checker, danach:** B-1, B-2 und die Überlappung gegen diesen
   Stand; für den security-checker zusätzlich A-A-128/A-A-129 und die Frage, ob die Abweisung in
   `beginIdle` die richtige Seite von A-24 gegen E-036 ist.
3. **spec-ux-reviewer:** der neue `409`-Satz an `/timer/idle/begin` — er erscheint in der
   Oberfläche, und er ist der einzige Ort, an dem der Benutzer erfährt, warum die
   Inaktivitätserkennung gerade nichts tut.
4. **Orchestrator:** `risks.md` R-34 (offene Frage 7) und die Entscheidung zu B-5 (offene Frage 4).
