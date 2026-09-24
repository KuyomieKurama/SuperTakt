# T-370 — Sicherheitsprüfung über T-358 und T-363 (R-34, der Geldpfad)

**Rolle:** security-checker. **Stand:** 2026-09-14, Welle 11. `HEAD` = `311b26e`.

## Status

**Braucht Review — geteiltes Urteil.**

- **T-358: freigegeben**, mit einer Auflage, die einen Absatz betrifft und keine Zeile Code
  (A-A-130).
- **T-363: nicht freigegeben.** Blockierender Befund: **B-1**, der fünfte und sechste Weg in
  `apps/local-api/src/features/timer/idle.ts`. Gemessen **39 900 s** auf einer abrechenbaren
  Zeile, während dieselbe Anwendung für denselben Eintrag 1 200 s als buchbar ausweist — mit
  Archiv, ohne Archiv, in beiden Stellungen von `idleKeepTimerRunning`.

## Artefakte

- `.claude/team/reports/T-370-security-checker.md` (diese Datei)
- `docs/bedrohungsmodell.md` — neues **Kapitel 46**, `Prüfung T-370 (2026-09-14)`, mit den
  Auflagen **A-A-128** bis **A-A-130**. Geändert, weil vier gemessene Zeilen aus Abschnitt 45.4
  durch diese beiden Arbeiten **unwahr geworden** sind (1a: 39 600 → 1 200 s; 1a `orphaned`:
  `null` → 1 200 s; 1b: 497 028 → 0,5 Stunden Exportzeile; 1c: 8 999 868 Stunden → verworfen) und
  weil der Satz „der Weg braucht keinen Angreifer" auf keinen der gemessenen Fälle mehr zutrifft.
  Kein Produktivcode angefaßt.

## Zusammenfassung

Ich habe die Behauptungen beider Berichte **nicht übernommen, sondern neu gefahren** — ohne HTTP,
über den echten Anwendungsfallweg `exportDataArchive` → `importDataArchive` → Timer, mit zwei
`:memory:`-Beständen und zwei beweglichen Uhren. T-358 hält in allen vier geprüften Punkten: die
eine Transaktionsklammer ist nicht nur gemessen, sondern **strukturell** dicht; ein ungültiges
Archiv verändert weiterhin nichts, auch nicht die Aufnahme; der Pfad wird weiterhin **vor** dem
Schreiben und **auch ohne Bytes** neu gesetzt; die drei Rumpfgrenzen sind unberührt. T-363
schließt die drei Türen, die es nennt, und läßt den gewöhnlichen Fall zeichengleich — aber es hat
seine Menge an den **Routen** aufgespannt und nicht an der Anforderung: Von den sieben Stellen im
Bestand, die `ended_at` auf einen offenen Eintrag schreiben, fragen zwei `foundAtServiceStart`
nicht, beide in `features/timer/idle.ts`, und beide buchen gemessen die Wanduhr eines fremden
Rechners. Dazu kommt, daß der neue Deckel (`heartbeatAt`) aus derselben fremden Datei stammt wie
der Anfang und gegen `now` nicht geprüft wird — für ein präpariertes Archiv bucht `stopTimer`
damit **mehr** als HEAD. Eine Obergrenze für eine Dauer gibt es weiterhin nicht (A-A-127).

## Befunde

### B-1 (blockierend, T-363) — der fünfte und sechste Weg: `features/timer/idle.ts`

**Pfad.** `apps/local-api/src/features/timer/idle.ts`, Zeile 71 (`beginIdle` →
`unit.timer.stop(running.note, input.startedAt)`) und Zeile 41 (`completeReturn` →
`unit.timer.separateIdle(running.id, pending.startedAt, …)`, das in
`packages/storage/src/sqlite/repo-time.ts` `UPDATE time_entry SET ended_at = ?` auf den laufenden
Eintrag schreibt).

**Anforderung.** R-34, E-036, A-A-126 („Ein offener Zeiteintrag, den dieser Lauf nicht gestartet
hat, ist verwaist"), A-24. Und E-099 Punkt 3: die Menge wird an der Anforderung aufgespannt, nicht
an der Route, die man kennt.

**Auswirkung.** Gemessen, Zieluhr `2026-09-13T17:45:00Z`, inaktive Zeit ab `17:05`, vorgefundener
Eintrag ab `06:00` mit Lebenszeichen `06:20`:

```
GET /timer/orphaned                       bookableSeconds = 1 200
POST /timer/idle/begin                    ok
POST /timer/idle/return                   ok
  time_entry: 06:00:00Z -> 17:05:00Z  =  39 900 s   (export_status = open)
```

Identisch **mit** eingespieltem Archiv und **ohne** jedes Archiv (gewöhnlicher Absturz), und
identisch für `idleKeepTimerRunning = true` (Vorgabe; die Buchung entsteht im `return`) wie für
`= false` (die Buchung entsteht schon im `begin`). Die Zeile steht auf `open` und ist damit
Exportkandidat. Es ist derselbe Schaden wie in R-34, unverändert in Art und Größe.

Drei Punkte, die ihn schwerer machen als einen Randfall:

1. **Keine Handlung, die nach einer Buchung aussieht.** `useIdleTimer.ts` schickt `begin` und
   `return` von selbst im Zweisekundentakt; der Benutzer geht weg und kommt wieder.
2. **Der einzige Riegel liegt wieder in der Anzeige.** `TimerContext.tsx` hält die
   Inaktivitätserkennung an, solange der Verwaistendialog offen steht
   (`blocked: … || orphan !== null`) — aber `GET /timer/orphaned` wird nur beim Aufbau der Seite
   geholt. Nach einem Einspielen **im laufenden Betrieb** ist `orphan` dort `null`, der Riegel
   also offen. Genau die Bauart, die T-363 an den anderen drei Türen richtig beseitigt hat.
3. **Die Einstellung ist kein Gegenmittel** (beide Stellungen führen zum selben Betrag).

**Gegenmittel (für domain-dev, `features/timer/**`).** Beide Aufrufstellen über dieselbe Funktion
führen, die `stopTimer` seit T-363 benutzt: `bookingEndOfStop(context, unit, running, …)` statt
eines rohen Zeitpunkts. Konkret

- `beginIdle`: `unit.timer.stop(running.note, input.startedAt)` →
  `unit.timer.stop(running.note, await bookingEndOfStop(context, unit, running, input.startedAt))`;
- `completeReturn`: vor `separateIdle` prüfen, ob `running.id` beim Dienststart vorgefunden wurde,
  und in diesem Fall **nicht** trennen, sondern den Eintrag gedeckelt schließen und den neuen
  Timer ab `end` eröffnen — oder den Aufruf mit `conflict` abweisen („beantworten Sie zuerst die
  Frage aus E-036"), was hier tragbar ist, weil `stopTimer` denselben Ausgang für eine offene
  Inaktivität bereits kennt.

`bookingEndOfStop` und `foundAtServiceStart` sind heute `module-private` in `timer.ts`; sie
gehören exportiert oder beide Anwendungsfälle in eine gemeinsame Stelle. **Die Regel darf nicht
abgeschrieben werden** — sie steht seit T-350 an genau einem Ort, und das ist der Wert der
bisherigen Arbeit.

**Nachweis, den ich sehen will.** Ein Prüffall, der `POST /timer/idle/begin` +
`/idle/return` auf einem vorgefundenen Eintrag fährt und `durationSeconds === 1200` **und**
`not.toBe(39900)` erwartet — in beiden Stellungen von `idleKeepTimerRunning`. Dazu der Lauf aus
A-A-128, der die Menge aus der Platte zieht statt aus einer Liste bekannter Routen.

### B-2 (Auflage, T-363) — der Deckel kommt aus derselben fremden Datei wie der Anfang

**Pfad.** `packages/domain/src/time-entry.ts`, `decideOrphanedTimer` →
`decideTimerStop({ …, now: input.heartbeatAt ?? input.running.startedAt })`. `timer_heartbeat`
steht in `DATA_ARCHIVE_TABLES`; `heartbeatAt` wird gegen nichts geprüft, insbesondere nicht gegen
`now`.

**Auswirkung.** Gemessen über den echten Einspielweg:

| Archiv | `GET /timer/orphaned` | `POST /timer/stop` | Exportzeile |
|---|---|---|---|
| Start `1000-01-01`, Lebenszeichen `9999-12-31` | 284 012 524 799 s | 284 012 524 799 s | `"Zeit": 78 892 368` |
| Start `2026-09-13` (unauffällig), Lebenszeichen `9999-12-31` | 251 613 021 599 s | 251 613 021 599 s | `"Zeit": 69 892 506` |

An der zweiten Stelle buchte **HEAD 39 600 s**. Für ein präpariertes Archiv ist der Stopp also
großzügiger geworden. Einordnung, damit das nicht größer klingt, als es ist: Der Wert war seit
E-036 über `POST /timer/orphaned/resolve` erreichbar; T-363 hat ihn nicht erfunden, sondern den
zweiten Weg richtigerweise auf denselben Wert gelegt. Er braucht ein **verändertes** Archiv — der
Fall ohne Angreifer ist zu.

**Gegenmittel.** `min(heartbeatAt, now)` in **`decideOrphanedTimer`** (`packages/domain`), damit
Dialog und Stopp den Deckel gemeinsam bekommen. Nicht in `bookingEndOfStop` — das wäre wieder eine
zweite Meinung. T-363 hat das selbst als Risiko 2 und offene Frage 4 gemeldet und
`packages/domain` nicht angefaßt, weil dort T-364 läuft; das ist richtig entschieden und gehört in
die nächste Welle, nicht in diesen Auftrag.

### B-3 (Auflage, offen seit T-357) — es gibt weiterhin keine Obergrenze

`duration_seconds >= 1` ist die einzige Schranke der Speicherung, `MINIMUM_DURATION_SECONDS` die
einzige der Domäne, E-008 rundet **auf**. **A-A-127 ist unberührt.** Die alte Obergrenze aus 45.4
(rund 6,4 × 10¹⁰ s, aus der Vierstelligkeit des Jahres im `started_at`-CHECK) ist nicht gefallen,
sondern verschoben: Sie spannt sich jetzt zwischen zwei vierstelligen Jahren auf und liegt bei
rund **2,84 × 10¹¹ s**. Dieselbe fehlende Grenze trifft `foreign.ts` (`timeByDay`-Sekunden aus
einer fremden Datei, `seconds < 1` wird übersprungen, nach oben nichts).

### B-4 (Auflage, T-358/T-363 gemeinsam) — ein Satz, der eine geschlossene Lücke behauptet

`apps/local-api/src/features/data-transfer/data-transfer.ts`, im Kommentarblock vor der
Transaktionsklammer:

> `stopTimer` fragt `foundAtServiceStart` nicht. […] ein direkter `POST /timer/stop` bucht
> gemessen **39 600 s** — auch mit dieser Klammer. […] Das ist der Restpunkt von R-34.

Gemessen an genau dieser Stelle: **1 200 s.** Der Absatz war bei T-358 wahr und ist es seit T-363
nicht mehr. CLAUDE.md nennt den umgekehrten Fall ausdrücklich („Ein Satz, der eine Handlung nennt,
die es nicht gibt, ist derselbe Fehler"); hier ist es dieselbe Klasse in die andere Richtung.
Gehört mit der Freigabe von T-363 in **einen** Auftrag (A-A-130). Nicht blockierend — es ist ein
Kommentar, kein Verhalten.

### B-5 (nur benannt, ohne Geldbezug) — das A-24-Zuordnungsfenster aus einem Archiv

Ein Archiv mit offener `timer_idle`-Zeile führt nach der Rückkehr zu einem Zuordnungsfenster von
gemessen `06:10 → 17:00` = **39 000 s**, die der Benutzer auf Todos verteilen kann. Kein stiller
Weg (es braucht eine ausdrückliche Verteilung), aber derselbe Uhrversatz in einem Dialog. Von
T-363 als Risiko 3 gemeldet, liegt in `features/timer/idle.ts` und gehört in denselben Auftrag wie
B-1.

## Was gehalten hat — je Prüfpunkt des Auftrags

1. **Die Menge der Wege.** Sieben Aufrufstellen im Bestand schließen einen offenen Eintrag; fünf
   fragen die Frage, zwei nicht (B-1). Strukturell zu und deshalb nicht in der Liste:
   `unit.timeEntries.update` kann einen laufenden Eintrag nicht anfassen (`loadOne` liefert für
   `ended_at IS NULL` grundsätzlich `null` → `not_found`), und `foreign.ts` legt ausschließlich
   Zeilen **mit** `endedAt` an.
2. **Obergrenze.** Fehlt weiterhin — B-3.
3. **Das Archiv als fremder Inhalt, unter der einen Klammer.** `schemaVersion: 99`, fremde
   Formatkennung und `"kaputt"` werden je mit `validation_error` abgewiesen; danach
   `timerRecovery.entryId` zeichengleich, `bookableSeconds` 1 200 → 1 200, Todos 1 → 1, Titel
   unverändert. Das gültige Archiv unmittelbar danach spielt ein und setzt beides neu. Die längere
   Klammer nimmt nicht mehr zurück und läßt nicht mehr stehen: Sie hat eine **Lesung**
   dazubekommen, keinen Schreibvorgang, und die Zuweisung steht hinter dem `await` und in keinem
   `finally`. Schlägt die Lesung fehl, rollt `replaceAll` mit zurück **und** die Aufnahme bleibt
   alt — beides konsistent. Die alte Anordnung konnte genau das nicht.
4. **Der Pfad reist nicht mit.** Ein Archiv mit **0** mitgereisten Dateien und
   `target = C:\Users\anna\AppData\Roaming\de.takt.desktop\email\<32 Hexziffern>.eml` landet auf
   dem Zielrechner als `<Anwendungsdatenverzeichnis>/email-attachments/<32 Hexziffern>.eml`. Das
   Umschreiben geschieht beim Bau von `tables`, also **vor** `replaceAll`; die Umklammerung hat
   daran nichts verschoben. `ARCHIVED_FILE_NAME` + `lastSegmentOf` stehen unverändert davor.
5. **`timerRecovery` optional.** `foundAtServiceStart` gibt bei `undefined` **`true`** zurück →
   alles gilt als verwaist → `bookingEndOfStop` deckelt. Gemessen: Zusammenhang ohne das Feld,
   elf Stunden Wanduhr, Stopp → **verworfen**. Die Ausfallrichtung ist die billige (eigene Zeit
   statt Rechnung des Kunden); der Preis ist ein Verfügbarkeitsverlust in einem Zusammenhang, den
   das Erzeugnis nicht baut. `composition.ts` setzt das Feld im einzigen Zweig, in dem ein
   `AppContext` entsteht, und `main.ts` ruft `captureTimerRecovery` in Zeile 293, `server.listen`
   in Zeile 505 — die Reihenfolge stimmt und ist von keinem Lauf gemessen (T-363 Fall H).
   Die Entscheidung gegen ein Pflichtfeld ist aus Sicherheitssicht **richtig**: Ein Pflichtfeld
   machte `context.timerRecovery === undefined` zu einem `tsc`-Fehler, die Abzweigung fiele, und
   die Ausfallrichtung drehte auf die teure Seite.
6. **Rumpfgrenzen.** 1 MiB / 64 MiB / 256 MiB stehen zeichengleich in `config.ts`; `app.ts`
   ordnet sie unverändert zu. Die Speicherspitze entsteht beim Lesen des Rumpfes, lange vor der
   Transaktion — die Klammer berührt sie nicht. **Die 934 MB habe ich nicht nachgemessen.**
7. **Hygiene.** Semgrep `p/typescript` + `p/secrets` über die drei Artefakte: 111 Regeln, 11
   Dateien, **0 Befunde**. Semgrep `p/secrets` über 385 versionierte Quell-, Prüf- und
   Dokumentdateien: **0 Befunde**. Kein `nosemgrep`, kein `@ts-ignore`, kein `eslint-disable` in
   den Artefakten. Die einzige fünfstellige Zahl in den Diffs ist `17843`.
8. **E-001.** Keine Adresse außerhalb von `127.0.0.1` in den drei Artefakten. `proof:release-safety`
   158/0 grün.

Zusätzlich geprüft, weil beide Arbeiten daran hängen: `POST /data-transfer/archive` und
`POST /timer/idle/*` liegen außerhalb von `/addin`, verlangen also Sitzungsnachweis **und**
zugelassene Herkunft (`requiredCredentialForPath` → `session`). Eine fremde Seite im Browser
erreicht keine der beiden. Bei B-1 ist der Aufrufer ohnehin die eigene Oberfläche.

## Läufe — alle selbst gefahren, mit Zahl

| Lauf | Ergebnis |
|---|---|
| Kernmessung R-34 (Einspielen, Stopp, Verdrängung, Lebenszeichen, gewöhnlicher Fall) | `orphaned` 1 200 · `elapsed` 39 600 · Stopp **1 200** · Verdrängung **1 200** (Ende `06:20`) · Heartbeat `null`, bleibt 1 200 · Timer dieses Laufs **39 600** |
| Ungültige Archive, drei Formen | je `validation_error`; `entryId` zeichengleich, 1 200 → 1 200, Todos 1 → 1 |
| Pfadumschreibung ohne Bytes | fremder Windows-Pfad → Zielverzeichnis, 0 Dateien im Archiv |
| Nebenläufigkeit, 17 Leser, Archiv mit 2 000 Todos | **17 von 17** sahen `bookableSeconds = 1 200` |
| Ausfallrichtung ohne `timerRecovery` | Stopp **verworfen** statt 39 600 s |
| **Idle-Weg, mit Archiv und ohne** | **39 900 s**, `export_status = open`, in beiden Stellungen von `idleKeepTimerRunning` |
| Deckel aus der Zukunft, zwei Archive | **284 012 524 799 s** / **251 613 021 599 s**; Exportzeilen `"Zeit": 78 892 368` / `69 892 506` |
| `vitest run apps/local-api/test` | **352 grün**, 2 übersprungen, 0 rot |
| `vitest run packages/{domain,storage,export}/test` | **1 283 grün**, 0 rot, 53 Dateien |
| `pnpm typecheck` | **Exit 0** |
| `pnpm boundaries` | grün, 530 Quelldateien außerhalb der Domäne, „Notiz-Trennung: alle Schichten unverletzt" |
| `proof:openapi` | 115 bestanden, 0 fehlgeschlagen |
| `proof:route-policy` | 48 / 0 |
| `proof:layers` | 36 / 0 |
| `proof:callers` | 74 / 0 |
| `proof:db-permissions` | 27 / 0 |
| `proof:release-safety` | 158 / 0 |
| `proof:access` (bindet 17843 — Port war frei, `ss -ltnp` vorher geprüft) | 111 / 0 |
| `proof:conflicts` (dito) | 154 / 0 |
| Semgrep `p/typescript` + `p/secrets`, drei Artefakte | 111 Regeln, 11 Dateien, **0 Befunde** |
| Semgrep `p/secrets`, 385 versionierte Dateien | **0 Befunde** |

**Nicht gefahren, und warum:**

- **42Crunch-Audit.** Weder CLI noch Zugangsdaten in dieser Umgebung (`~/.42c*` fehlt, `42c` nicht
  im Pfad, keine Umgebungsvariable). Ein Audit lüde außerdem die Beschreibung des Dienstes zu
  einem fremden Dienst hoch. **Gemeldet, nicht grün.** Ersatzweise am Diff gelesen: Die Änderungen
  an `takt-local-api.yaml` sind ausschließlich Beschreibungstexte — kein neuer Pfad, kein
  geändertes Schema, kein berührtes `security`-Element, 62 Zeilen hinzu, 7 gestrichen.
- **Semgrep Guardian (Plattform).** Liefert Befunde **früherer** Läufe aus der Plattform; es gibt
  für diesen Bestand keine. Der lokale Lauf oben ist der Ersatz, und er ist als solcher benannt.
- **`pnpm check` als Ganzes**, `test:coverage`, `build`, `test:rust`, `test:e2e`: nicht mein
  Auftrag und im Arbeitsbaum stehen fremde unfertige Änderungen (T-359, T-360, T-364).

## Annahmen

- **Ein `git diff` ist kein Meßgegenstand**, wie beauftragt. Ich bin von den Artefaktlisten der
  beiden Berichte ausgegangen und habe sie gegen `git status` gehalten: Genau drei Dateien sind
  aus diesen beiden Aufträgen geändert (`timer.ts`, `data-transfer.ts`, `takt-local-api.yaml`),
  `packages/domain` ist unberührt. Kein Kollateralschaden.
- **Ich habe keine Zahl der beiden Berichte übernommen.** Alle Zahlen oben sind neu gefahren; wo
  sie übereinstimmen, stimmen sie.
- **Meßskripte liegen im Sitzungs-Scratchpad**, nicht im Bestand. Kein Produktivcode angefaßt,
  keine Datei im Arbeitsbaum erzeugt oder gelöscht.
- **B-1 blockiert T-363, nicht T-358.** `idle.ts` gehört zu derselben Anforderung wie T-363 und
  zu keiner Zusage von T-358.
- **B-2 blockiert nicht.** Der Wert war vor T-363 über den Dialog erreichbar, T-363 durfte
  `packages/domain` nicht anfassen, und der Fall braucht ein verändertes Archiv.
- **Die Einstufung von R-34 in `risks.md` gehört dem Orchestrator.** Meine Empfehlung steht in
  Kapitel 46.7.

## Risiken

1. **B-1 ist der einzige gemessene Weg, der heute ohne Zutun eines Angreifers Geld bewegt.** Er
   braucht nur, daß jemand nach einem Neustart oder einem Einspielen fünf Minuten vom Rechner
   weggeht — die Vorgabe von `idleThresholdMinutes`.
2. **Die Dichtheit der einen Klammer hängt an zwei ungemessenen Zeilen.** `queue = next.then(…)`
   steht in `unit-of-work.ts` **vor** der `await`-Fortsetzung des Aufrufers; deshalb gewinnt die
   Zuweisung an `timerRecovery.entryId` gegen jeden nebenher Eingereihten. Wer diese Reihenfolge
   umbaut, öffnet das Fenster wieder, und kein Lauf sagt es (A-A-128, zweiter Teil).
3. **Ein Prüffall, der nur die 1 200 s mißt, hält die Anordnung nicht.** T-358 hat das selbst
   gesehen (Fall E). Solange er nicht geschrieben ist, ist die Anordnung eine Absicht.
4. **Fremde Läufe im Arbeitsbaum.** `apps/web/**` und `features/version/**` tragen unfertige
   Änderungen anderer Agenten. Die Aussagen dieses Berichts über `TimerContext.tsx` und
   `useIdleTimer.ts` sind am heutigen Stand gelesen und können sich mit T-359 verschieben — der
   Befund B-1 hängt aber nicht daran: Er ist im Dienst gemessen, ohne Oberfläche.

## Offene Fragen

1. **Soll `beginIdle`/`returnFromIdle` auf einem vorgefundenen Eintrag deckeln oder abweisen?**
   Ich halte Deckeln für richtig (gleiche Zahl wie die Anzeige, kein Zustand, aus dem der Benutzer
   nicht herauskommt), sehe aber das Argument für `conflict` — `stopTimer` weist für eine offene
   Inaktivität ebenfalls ab. Entscheidung gehört zu A-24 gegen E-036 und damit zum Orchestrator.
2. **Wollen wir A-A-127 in dieser Welle?** Eine nennbare Obergrenze ist die einzige Auflage aus
   45.5, die seit zwei Prüfungen unberührt steht, und sie fängt alle drei Befunde B-1 bis B-3 als
   zweite Wache ab.
3. **Soll `GET /timer` einen vorgefundenen Eintrag kennzeichnen?** T-363 offene Frage 1. Aus
   Sicherheitssicht nebensächlich (die Anzeige entscheidet nichts mehr), aus Sicht der
   Wahrhaftigkeit der Auskunft nicht.

## Nächster Schritt

1. **domain-dev, `features/timer/**`, nächste Welle:** B-1 beheben (beide Aufrufstellen in
   `idle.ts` über `bookingEndOfStop`), B-4 mitnehmen (der Absatz in `data-transfer.ts`), B-5
   wenigstens benennen. Ein Auftrag, eine Datei-Familie.
2. **domain-dev, `packages/domain`, nach T-364:** B-2 — `min(heartbeatAt, now)` in
   `decideOrphanedTimer`. Dieselbe Welle wie A-A-127, wenn der Orchestrator sie will.
3. **unit-tester, dieselbe Welle wie 1:** die Fälle A–E aus T-358 Abschnitt 8 und T363-A bis H aus
   T-363 Abschnitt 7, **plus** der Idle-Fall aus B-1 in beiden Stellungen von
   `idleKeepTimerRunning`. Wichtig sind T-358 Fall E (eine Transaktion) und T363-C/F (der
   gewöhnliche Fall darf sich nicht ändern).
4. **security-checker, Wiedervorlage:** A-A-128 und A-A-129 gegen den dann gebauten Stand. T-358
   braucht keine Wiedervorlage, nur die Abnahme von A-A-130.
