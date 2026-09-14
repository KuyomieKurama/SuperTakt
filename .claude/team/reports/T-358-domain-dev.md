# T-358 — R-34: die elf Stunden, die niemand gearbeitet hat (zweiter Anlauf)

**Rolle:** domain-dev. **Stand:** 2026-09-13, Welle 9. **Dieser Bericht ist überschrieben**, nicht
fortgeschrieben — der Grund steht in Abschnitt 0.

## Status

**Fertig.** Die Aufnahme wird beim Einspielen nachgeführt, und sie steht **in derselben
Transaktion** wie `replaceAll` statt in einer zweiten dahinter. Beidseitig gemessen: ohne die
Nachführung `GET /timer/orphaned` → `null` und kein Weg zur richtigen Buchung; mit ihr
`bookableSeconds: 1200` und `resolve` bucht **1 200 s** statt **39 600 s**.

**R-34 ist damit nicht geschlossen.** Die Restbehauptung des ersten Anlaufs ist jetzt **gemessen
statt vermutet, und sie trifft zu**: Ein direkter `POST /timer/stop` nach dem Einspielen bucht
**39 600 s — auch mit dieser Änderung**. Details in Abschnitt 4 und Risiko 1.

---

## 0 — Was ich vorgefunden und was ich damit gemacht habe

Vorgefunden habe ich zwei Dinge aus dem abgebrochenen ersten Anlauf:

1. `apps/local-api/src/features/data-transfer/data-transfer.ts` — geändert, ungeprüft: ein Import
   von `captureTimerRecovery` aus `../timer/timer.ts` und ein
   `await captureTimerRecovery(context)` als **zweite Transaktion** unmittelbar hinter
   `replaceAll`, dazu rund 60 Zeilen Begründung.
2. `.claude/team/reports/T-358-domain-dev.md` — mit Status „Fertig" und einer vollständig
   ausgeschriebenen Meßtabelle.

**Behandelt habe ich beides als fremd.** Der Bericht behauptete Messungen, die nach der
Auftragslage nicht zu Ende gelaufen sind; ein Papier, das „fertig" sagt, ist kein Nachweis. Ich
habe deshalb **jede** Zahl neu gefahren, nicht eine übernommen.

**Ergebnis der Nachprüfung:**

| Behauptung des ersten Anlaufs | nachgemessen |
|---|---|
| ohne die Zeile buchen 39 600 s, mit ihr 1 200 s | **bestätigt** (Abschnitt 3) |
| Archiv ohne laufenden Timer erzeugt nichts | **bestätigt** (Abschnitt 5) |
| ungültiges Archiv verändert nichts, auch nicht die Aufnahme | **bestätigt** (Abschnitt 6) |
| „**Kein fremder Leser liegt dazwischen**", 16 von 17 sahen richtig, das 17. sei „vor dem Schreiben abgeschickt" gewesen | **widerlegt** (Abschnitt 4) |
| Restpunkt `POST /timer/stop` (unbelegt gelassen) | **gemessen, trifft zu**: 39 600 s |

Der vierte Punkt ist der Grund, warum ich den Zwischenstand **nicht übernommen, sondern die
Anordnung geändert** habe. Der Leser, den der erste Anlauf als harmlos abgetan hat, war nicht
harmlos: Er wurde zwar **vor** dem Schreiben in die Warteschlange gereiht, lief aber **nach** dem
`COMMIT` und **vor** der Aufnahme — und sah damit genau den Zustand, gegen den die Änderung gebaut
wird. Nachgemessen: Er sah einen **laufenden Timer mit 39 600 s und keine Waisenmeldung.**

**Was von der Vorarbeit geblieben ist:** die Einsicht, daß die Nachführung hierhin gehört, und die
Stelle. **Was ich verworfen habe:** die Anordnung in zwei Transaktionen, der Import aus
`../timer/timer.ts`, und der Begründungstext samt seiner Zahlen (8,7 ms / 0,06 ms / „16 von 17"),
weil er die Lücke als geschlossen beschrieb, die er selbst gemessen hatte.

---

## 1 — Die Änderung

`apps/local-api/src/features/data-transfer/data-transfer.ts`, in `importDataArchive`, an der Stelle
des bisherigen `replaceAll`-Aufrufs:

```ts
const timerAfterImport = await context.transactions.inTransaction(async (unit) => {
  await unit.dataArchive.replaceAll(tables);
  return (await unit.timer.running())?.id ?? null;
});
if (context.timerRecovery !== undefined) context.timerRecovery.entryId = timerAfterImport;
```

Kein neuer Import, keine neue Kante zwischen Merkmalen: `unit.timer` ist ein Port aus
`@takt/storage`, den `data-transfer.ts` über dieselbe `UnitOfWork` erreicht wie `unit.dataArchive`.

**Was hier nicht abgeschrieben wird:** die Regel, was „verwaist" *heißt*. Die steht weiterhin an
genau einer Stelle — `foundAtServiceStart` in `features/timer/timer.ts` (T-350). Hier wird nur
dieselbe **Frage** gestellt, die `captureTimerRecovery` beim Start stellt.

**Warum nicht `captureTimerRecovery(context)` innerhalb der Klammer:** Verschachtelte
Transaktionen werden vom Port ausdrücklich abgewiesen. Gemessen, nicht gelesen:

```
captureTimerRecovery INNERHALB einer Transaktion -> Verschachtelte Transaktionen sind unzulässig. …
```

---

## 2 — Der Meßweg

Aufbau nach T-350 Abschnitt 4 (M1 Fall C), über den echten Anwendungsfallweg
`exportDataArchive` → `importDataArchive`, zwei Bestände, zwei Uhren, node 22.23.2:

- **Quellrechner**, Uhr `T0 = 2026-09-13T06:00:00Z`: Todo, `startTimer`, Uhr auf `T0 + 1200 s`,
  `touchHeartbeat`, `exportDataArchive`. Das Archiv trägt 1 `time_entry` ohne Ende und
  1 `timer_heartbeat`.
- **Zielrechner**, eigener `openDatabase({ location: ':memory:' })`, Uhr auf `T0 + 39 600 s`
  (`2026-09-13T17:00:00Z`), `captureTimerRecovery` beim Start wie in `main.ts`
  (→ `entryId: null`), dann `importDataArchive`.

„Ohne die Änderung" ist dabei nicht auskommentierter Code, sondern die **HEAD-Fassung der Datei**,
eingesetzt und wieder zurückgenommen (`git show HEAD:…`). Kein Port gebunden, kein Kindprozeß,
17843/17844/5173 unberührt.

---

## 3 — Die beiden Zahlen, beidseitig

| Frage an den Zielrechner | **ohne** (HEAD) | **mit** (ausgeliefert) |
|---|---|---|
| Aufnahme nach dem Einspielen | `entryId = null` | `entryId = <eingespielter Eintrag>` |
| `GET /timer` | laufend seit `06:00:00Z`, `elapsedSeconds = 39600` | dasselbe (siehe Risiko 1) |
| `GET /timer/orphaned` | **`null`** | **`bookableSeconds = 1200`**, `heartbeatAt = 06:20:00Z` |
| `POST /timer/orphaned/resolve {book_until_heartbeat}` | `timer_not_running` | `recorded`, `durationSeconds = 1200`, `exportStatus = open` |
| **über den Dialog gebucht** | **0 s — es gibt keinen Weg, richtig zu buchen** | **1 200 s** |
| `POST /timer/stop` (direkt, ohne Dialog) | `recorded`, **`durationSeconds = 39600`** | `recorded`, **`durationSeconds = 39600`** |

Die Zahl aus R-34 ist damit auf beiden Seiten reproduziert — und die letzte Zeile ist der Rest,
der bleibt.

---

## 4 — Frage 1 des Auftrags: Steht die Aufnahme an der richtigen Stelle?

**Jetzt ja. In der Anordnung des ersten Anlaufs: nein, und das ist gemessen.**

`inTransaction` reiht alle Transaktionen dieser Verbindung in **eine** Warteschlange
(`packages/storage/src/sqlite/unit-of-work.ts`, FIFO). Entscheidend ist nicht, wie schnell die
Aufnahme **nach** dem `COMMIT` kommt, sondern wer sich **während** `replaceAll` eingereiht hat: Er
steht vor ihr. Das Fenster ist genau so breit wie `replaceAll` dauert — bei einem Archiv an der
256-MiB-Grenze kein Sekundenbruchteil.

Gemessen mit einem umhüllten `TransactionPort`, der die Reihenfolge aufzeichnet, und siebzehn
nebenher abgeschickten `GET /timer/orphaned` (eines sofort, acht über `setImmediate`, acht über
`setTimeout`), Archiv mit 2 001 Todos. Aufzeichnung der zwei-Klammern-Anordnung:

```
   1.46 ms  #1 gereiht  importDataArchive #1 (replaceAll)
   1.55 ms  #2 gereiht  GET /timer/orphaned [0]        <- reiht sich WÄHREND des Schreibens ein
   1.71 ms  #1 beginnt  importDataArchive #1 (replaceAll)
  11.51 ms  #1 endet    importDataArchive #1 (replaceAll)   ← COMMIT
  11.53 ms  #3 gereiht  importDataArchive #2 (captureTimerRecovery)
  11.55 ms  #2 beginnt  GET /timer/orphaned [0]        <- LIEST ZWISCHEN COMMIT UND AUFNAHME
  11.71 ms  #2 endet    GET /timer/orphaned [0]
  11.72 ms  #3 beginnt  importDataArchive #2 (captureTimerRecovery)
```

Drei Anordnungen, sonst identisch, je viermal gefahren und jedes Mal gleich:

| Anordnung | sahen `1 200 s` verwaist | sahen **laufenden Timer, 39 600 s, keine Waisenmeldung** |
|---|---|---|
| HEAD, gar keine Aufnahme | 0 von 17 | **17 von 17** |
| erster Anlauf: zwei Klammern | 16 von 17 | **1 von 17** |
| ausgeliefert: eine Klammer | **17 von 17** | **0 von 17** |

Der erste Anlauf hat diesen einen Leser gesehen und als unbedenklich eingeordnet („war
abgeschickt, bevor das Archiv geschrieben war, und sah richtigerweise `null`"). Das ist der Fehler
in der Auswertung: Er war **gereiht**, bevor geschrieben war, aber er **lief** nach dem `COMMIT`.
Er hat den eingespielten Eintrag gelesen — und ihn für einen Timer dieses Laufs gehalten. Genau
der Ausgang, gegen den die Änderung gebaut wird.

Gegengeprüft über den **echten** `importDataArchive` mit demselben Instrument: mit der
ausgelieferten Fassung eröffnet das Einspielen **eine** Transaktion statt zwei, es gibt keine
Lücke mehr zu treffen, und alle siebzehn Leser sehen `bookableSeconds = 1200`.

---

## 5 — Frage 2: Archiv ohne laufenden Timer

Gemessen mit einem Zielrechner, der **selbst** einen verwaisten Eintrag hatte (eigener offener
Eintrag, `captureTimerRecovery` darauf, Lebenszeichen `+300 s`), und einem Archiv mit
`0` offenen `time_entry`-Zeilen:

```
vor  dem Einspielen:  entryId = <eigener Eintrag>,  orphaned -> bookableSeconds = 300
nach dem Einspielen:  entryId = null
                      GET /timer/orphaned -> null
                      GET /timer          -> null
                      POST /timer/stop    -> timer_not_running
```

`null` ist keine Erfindung, sondern die Lage: `replaceAll` hat den eigenen offenen Eintrag mit
ersetzt, es gibt buchstäblich keinen mehr. Ein Zustand, den es vorher nicht gab, entsteht nicht.

**Nebenbefund, der für die Änderung spricht:** In derselben Lage behält HEAD `entryId` auf dem
**gerade gelöschten** Eintrag stehen — eine Aufnahme, die auf eine Zeile zeigt, die es nicht mehr
gibt. Heute fällt das nicht auf, weil danach gar nichts Offenes existiert; es ist trotzdem ein
Wert, der etwas über den Bestand behauptet, was nicht mehr stimmt. Die Änderung räumt ihn mit ab.

---

## 6 — Frage 3: Ungültiges Archiv verändert nichts

Drei Formen gegen einen Zielrechner mit eigenem verwaisten Eintrag:

| Archiv | Antwort |
|---|---|
| unbekannte Fassung (`schemaVersion: 99`) | `ok = false`, `validation_error` |
| fremde Formatkennung | `ok = false`, `validation_error` |
| gar kein Objekt (`"kaputt"`) | `ok = false`, `validation_error` |

Danach: `entryId` **zeichengleich unverändert**, `orphaned` weiterhin `bookableSeconds = 300`,
Todos vorher/nachher 1/1.

Das hängt an der Bauform, nicht am Zufall: `parseArchive` bricht **vor** der Transaktion ab und
kommt hier nie an; die Zuweisung steht **hinter** dem `await` und in **keinem** `finally`, ein Wurf
aus der Klammer übergeht sie also. Das von T-357 nachgemessene Rückrollen ist unberührt — die
Änderung fügt der Transaktion eine **Lesung** hinzu, keinen Schreibvorgang.

---

## 7 — Frage 4: `AppContext.timerRecovery` ist optional

Gemessen mit einem Zusammenhang **ohne** das Feld (so baut `setup()` in
`apps/local-api/test/usecases/data-transfer.test.ts` ihn heute):

```
timerRecovery vorher:   undefined
import ok = true,       timerRecovery nachher: undefined
GET /timer/orphaned ->  bookableSeconds = 1200   (jeder offene Eintrag gilt als verwaist)
```

Kein Wurf, kein neuer Zweig, die Zuweisung unterbleibt — dieselbe Ausfallrichtung wie in
`captureTimerRecovery`, und die ungefährlichere („im Zweifel fragen").

**Sollte es Pflicht werden? Ja — aber nicht in diesem Auftrag, und nicht wegen Ästhetik.** Fehlt
das Feld, gilt wieder **jeder** offene Eintrag als verwaist; das ist die Lage vor der Aufnahme aus
E-036. Heute setzt `composition.ts` es im einzigen Zweig, in dem überhaupt ein `AppContext`
entsteht — die Zusage hängt also an einem **Zweig**, nicht am **Typ**. Ich habe sie nicht
verschoben: `context.ts` ist nicht meine Datei in diesem Auftrag, und Pflicht zu machen heißt
`composition.ts` plus jeden von Hand gebauten Prüfzusammenhang anzufassen (`as unknown as
AppContext` verdeckt dort fehlende Pflichtfelder ohnehin stumm, der Typ trüge die Zusage also auch
dann nur halb). Gehört in denselben Folgeauftrag wie Risiko 1.

---

## 8 — Vorgabe für den Prüffall (unit-tester, nächste Welle)

Ort: `apps/local-api/test/usecases/data-transfer.test.ts` oder eine Nachbardatei. **Kein laufender
Dienst, kein Port, keine Datei auf der Platte** — es gibt keine Anhänge in diesen Fällen.

**Wichtig:** `setup()` in jener Datei baut den Zusammenhang **ohne** `timerRecovery`. Für die Fälle
A–C und E muß er gesetzt werden, sonst messen sie nichts:

```ts
const ziel = { ...context, timerRecovery: { entryId: null } } as unknown as AppContext;
```

Werte, mit denen auch dieser Bericht gemessen hat:

- Quelluhr `T0 = '2026-09-13T06:00:00Z'`, Lebenszeichen `T0 + 1200 s` = `'2026-09-13T06:20:00Z'`,
  Zieluhr `T0 + 39 600 s` = `'2026-09-13T17:00:00Z'`.
- Quelle: `unit.todos.create({ title, callNumber: null, statusId: null, tagIds: [], note: '', now: T0 }, [])`,
  `startTimer(quelle, todoId, false)`, `touchHeartbeat` mit der Uhr auf `T0 + 1200`, dann
  `exportDataArchive(quelle)`.
- Ziel: eigener `openDatabase({ location: ':memory:' })`, Uhr `T0 + 39 600 s`,
  `await captureTimerRecovery(ziel)` (liefert `entryId: null`), dann
  `await importDataArchive(ziel, archive)`.

**Fall A — die beiden Zahlen (der eigentliche Prüffall):**

```ts
expect((await loadOrphanedTimer(ziel))?.bookableSeconds).toBe(1200);
const gelöst = await resolveOrphanedTimer(ziel, 'book_until_heartbeat');
expect(gelöst.ok && gelöst.value.kind === 'recorded').toBe(true);
expect(gelöst.value.entry.durationSeconds).toBe(1200);
expect(gelöst.value.entry.durationSeconds).not.toBe(39600);   // die Zahl aus R-34
```

Die letzte Zeile ist keine Doppelung: **39 600** ist der Wert, den der Fehler erzeugt hat, und er
gehört mit seinem Namen in den Prüffall. Ohne die Änderung fällt schon das erste `expect`
(`loadOrphanedTimer` → `null`), und `resolveOrphanedTimer` gäbe `timer_not_running`.

**Fall B — Archiv ohne laufenden Timer erzeugt nichts.** Quelle wie oben, aber `stopTimer` vor dem
Sichern. Ziel mit **eigenem** offenen Eintrag, `captureTimerRecovery` **davor**, damit er verwaist
ist. Nach dem Einspielen: `ziel.timerRecovery.entryId === null`, `loadOrphanedTimer` → `null`,
`loadRunningTimer` → `null`, `stopTimer` → `timer_not_running`.

**Fall C — ungültiges Archiv verändert auch die Aufnahme nicht.** Ziel mit eigenem verwaisten
Eintrag, `entryId` und `bookableSeconds` merken, dann drei ungültige Archive
(`schemaVersion: 99`; fremdes `format`; `'kaputt'`) → je `ok === false`. Danach: `entryId`
unverändert, `loadOrphanedTimer` liefert **denselben** Eintrag mit **derselben**
`bookableSeconds`, Zahl der Todos unverändert.

**Fall D — ohne `timerRecovery` bleibt alles, wie es war.** `importDataArchive` mit dem
unveränderten `setup()`-Zusammenhang: `ok === true`, `context.timerRecovery` danach immer noch
`undefined`. Das hält die heutige Bauform von `setup()` fest, statt sie zu verschweigen.

**Fall E — die Stelle, nicht nur die Wirkung. Der Fall mit dem meisten Wert, und der einzige, der
den ersten Anlauf rot gemacht hätte.** `ziel.transactions` umhüllen und mitzählen:

```ts
expect(eröffneteTransaktionen).toBe(1);   // replaceAll UND die Lesung in EINER Klammer
```

Ein Prüffall, der nur die 1 200 s mißt, bleibt grün, wenn jemand die Lesung wieder in eine zweite
Transaktion dahinter schiebt — und genau dann ist sie gemessen für jeden nebenher fragenden Leser
wirkungslos (Abschnitt 4). Wer es schärfer will: einen `GET /timer/orphaned` über `setImmediate`
nebenher abschicken, während `importDataArchive` läuft, und erwarten, daß er `1200` sieht statt
`null`.

---

## 9 — Läufe

| Lauf | Ergebnis |
|---|---|
| beidseitige Messung „ohne" (HEAD-Fassung eingesetzt) | `orphaned` → `null`, `resolve` → `timer_not_running`, direkter Stopp **39 600 s** |
| beidseitige Messung „mit" (ausgelieferter Stand) | `bookableSeconds 1200`, `resolve` → **1 200 s**, direkter Stopp **39 600 s** |
| Nebenläufigkeit, 17 Leser, HEAD | 0 von 17 sahen verwaist |
| Nebenläufigkeit, 17 Leser, zwei Klammern (erster Anlauf) | 16 von 17; **1 sah 39 600 s laufend ohne Waisenmeldung** — 4× wiederholt, 4× gleich |
| Nebenläufigkeit, 17 Leser, eine Klammer (ausgeliefert) | **17 von 17**, `bookableSeconds 1200`, 0 daneben — 4× wiederholt, 4× gleich |
| Nebenläufigkeit über den **echten** `importDataArchive` | 17 von 17, **eine** statt zwei Transaktionen |
| Verschachtelungsprobe `captureTimerRecovery` in einer Klammer | wirft „Verschachtelte Transaktionen sind unzulässig" |
| `pnpm typecheck` (8 Projekte + Prüf- und E2E-Konfigurationen) | **Exit 0** |
| `vitest run apps/local-api/test` | **352 grün, 2 übersprungen, 0 rot**, 5,70 s |
| `pnpm boundaries` | grün, 528 Quelldateien geprüft, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm -C apps/local-api proof:layers` | 36 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:callers` | 74 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:conflicts` | 154 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:openapi` | 115 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:route-policy` | 48 bestanden, 0 fehlgeschlagen |
| `pnpm proof:codepoints` | 46 bestanden, 0 fehlgeschlagen |
| `pnpm proof:migrations` | aktuell, 46 Dateien |

**Nicht gefahren, und warum:** `proof:access` und `proof:export-api` binden 17843 — dort kann eine
echte `pnpm desktop`-Sitzung laufen, und der Auftrag verbietet sie anzufassen. Beide messen Kette
und Rechte, nicht diesen Anwendungsfall. `pnpm check` als Ganzes ebenfalls nicht (enthält beide).

**Ein Fremdfall hat einmal geflackert:** `apps/local-api/test/version/checker.test.ts:760`
(`expect(mitEins).toBeGreaterThanOrEqual(200)`) fiel in **einem** Lauf, während meine Messungen
nebenher liefen. Isoliert viermal nacheinander gefahren: 23/23 grün, 4 von 4. Es ist ein Fall, der
**Wanduhr** mißt, er gehört unit-tester, liegt in `features/version`-Nähe (T-360 läuft parallel)
und hat mit dieser Änderung nichts zu tun. **Nicht angefaßt**, hier nur gemeldet.

---

## 10 — Annahmen

- **Die kleine Form bleibt die Form — die Anordnung nicht.** Der Auftrag gab „eine Zeile hinter
  `replaceAll`" vor. Es ist eine Zeile geblieben, aber **innerhalb** der Klammer statt dahinter,
  weil die Anordnung dahinter an der eigenen Prüffrage 1 des Auftrags scheitert („Liegt dazwischen
  ein Leser, ist die Zeile falsch plaziert"). Der Polaritätswechsel über fünf Dateien bleibt
  ungebaut, wie beauftragt.
- **Kein neuer Oberflächentext, keine neue Warnung in `ImportSummary`.** Siehe offene Frage 3.
- **Der dritte Eingang existiert nicht.** Nachgesehen statt angenommen: `foreign.ts` legt Buchungen
  ausschließlich über `unit.timeEntries.create` mit gesetztem `endedAt` an, erzeugt also nie eine
  Zeile ohne Ende. Offene Einträge entstehen weiterhin nur durch `unit.timer.start` und
  `dataArchive.replaceAll`.
- **Kein Prüffall geschrieben**, wie beauftragt. Vorgabe in Abschnitt 8.

---

## 11 — Risiken

1. **`POST /timer/stop` bleibt ungeschützt — das ist der Rest von R-34, und er ist jetzt
   gemessen.** Nach dem Einspielen meldet `GET /timer` den fremden Eintrag weiterhin als laufend
   mit `elapsedSeconds = 39600`; `stopTimer` fragt `foundAtServiceStart` **nicht**. Ein direkter
   Stopp bucht **39 600 s**, mit und ohne diese Änderung. Der einzige Schutz ist, daß die
   Oberfläche beim Laden `GET /timer/orphaned` fragt und den Dialog zeigt — ein Schutz in der
   Anzeige, nicht im Dienst. **Der Polaritätswechsel ändert daran nichts**, er faßt `stopTimer`
   ebenfalls nicht an. Auftrag dafür: `stopTimer` und `loadRunningTimer` gegen
   `foundAtServiceStart` prüfen, `features/timer/**`.
2. **Eine offene Inaktivitätsphase im Archiv ist nicht gemessen.** `DATA_ARCHIVE_TABLES` führt
   `timer_idle` mit. Bringt ein Archiv eine Phase ohne `returned_at` mit, schweigt
   `loadOrphanedTimer` (die Idle-Abfrage geht vor) und `resolveOrphanedTimer` antwortet mit
   `conflict` — der Benutzer landet im Rückkehrdialog aus A-24 statt im Verwaistendialog aus E-036.
   Ob das der richtige Ausgang ist, habe ich **nicht** entschieden und **nicht** gemessen; es liegt
   in `features/timer/idle.ts`. Siehe offene Frage 1.
3. **Die Klammer ist jetzt länger.** `replaceAll` und eine Lesung liegen in derselben
   `BEGIN IMMEDIATE`-Klammer. Die Lesung ist ein Indexzugriff auf `ux_time_entry_running`
   (höchstens eine Zeile); gemessen an 2 001 Todos liegt die Klammer bei rund 9 ms mit wie ohne
   sie. Bei einem 256-MiB-Archiv dominiert `replaceAll` ohnehin um Größenordnungen.

---

## 12 — Offene Fragen

1. **Der Zielrechner erbt eine offene Inaktivitätsphase** (Risiko 2). Soll das Einspielen offene
   `timer_idle`-Zeilen genauso behandeln wie den offenen Zeiteintrag — als etwas, das
   **vorgefunden** wurde? Das ist eine Entscheidung über A-24.7 gegen E-036 und gehört nicht in
   diesen Auftrag.
2. **Soll `AppContext.timerRecovery` Pflicht werden?** Ich halte ja für richtig (Abschnitt 7), habe
   es aber nicht getan: `context.ts` und `composition.ts` liegen außerhalb dieses Auftrags. Gehört
   in denselben Folgeauftrag wie Risiko 1.
3. **Soll das Einspielen sagen, daß ein laufender Timer mitgereist ist?** Ein Satz in
   `ImportSummary.warnings` wäre hier billig, landet aber in der Anzeige von T-359. Wenn ja,
   Vorschlag: „Die Sicherung enthielt einen laufenden Timer. Er wird als unvollständige Buchung
   behandelt; Sie werden gefragt, was damit geschehen soll."
4. **`features/timer/timer.ts` trägt einen Kommentar, der jetzt falsch ist.** Der Absatz „Die
   bekannte Lücke: der zweite Eingang in den Bestand (Befund T-350)" endet mit „Die Behebung ist
   ein Wechsel der Polarität … gehört deshalb in einen eigenen Auftrag". Die Lücke ist zu, der
   Absatz behauptet das Gegenteil. **Nicht angefaßt** (`features/timer/**` ohne Not, und T-360
   läuft parallel). Vorschlag für den Ersatz des Absatzes:

   > **Der zweite Eingang, und wo er geschlossen wird (T-350, T-358, R-34)**
   >
   > Die Aufnahme geschieht **einmal** beim Start. Offene Einträge entstehen im Betrieb nur durch
   > `unit.timer.start` (hier, `resolveIdle`/`returnFromIdle` in `idle.ts`) — und durch
   > `dataArchive.replaceAll` (A-20). Dieser zweite Eingang kommt **nach** dem Start: Ein Archiv,
   > das bei laufendem Timer entstand, bringt eine `time_entry`-Zeile ohne Ende mit.
   > `importDataArchive` (`features/data-transfer/data-transfer.ts`) stellt deshalb dieselbe Frage
   > wie {@link captureTimerRecovery} noch einmal, und zwar **in derselben Transaktion** wie
   > `replaceAll` — eine zweite Klammer dahinter ließ gemessen einen nebenher fragenden Leser
   > zwischen `COMMIT` und Aufnahme geraten. Ohne die Nachführung buchte ein Stopp 39 600 s
   > Wanduhr statt der 1 200 s bis zum mitgereisten Lebenszeichen.
   >
   > **Nicht gedeckt ist weiterhin {@link stopTimer}:** Es fragt `foundAtServiceStart` nicht, und
   > wer statt des Dialogs direkt stoppt, bucht die Wanduhr (R-34, Restpunkt).

---

## 13 — Vorschlag für `risks.md` (gehört dem Orchestrator)

R-34 **nicht schließen**, sondern auf den Restpunkt einengen. Vorschlag als Ergänzung unter den
bestehenden Absatz:

> **Zur Hälfte behoben am 2026-09-13 (T-358).** `importDataArchive` liest den laufenden Timer
> **in derselben Transaktion** wie `replaceAll` und führt `timerRecovery.entryId` damit nach
> (`apps/local-api/src/features/data-transfer/data-transfer.ts`). Beidseitig über den echten
> Einspielweg gemessen: ohne die Nachführung `GET /timer/orphaned` → `null` und
> `resolve` → `timer_not_running` — es gibt keinen Weg, richtig zu buchen; mit ihr
> `bookableSeconds: 1200` und `resolve {book_until_heartbeat}` bucht **1 200 s** statt der
> **39 600 s** Wanduhr.
>
> **Die Anordnung ist Inhalt, nicht Geschmack.** Eine zweite Transaktion *hinter* `replaceAll`
> ließ gemessen **einen von siebzehn** nebenher fragenden Lesern zwischen `COMMIT` und Aufnahme
> geraten; er sah einen laufenden Timer mit 39 600 s und keine Waisenmeldung. Das Fenster ist so
> breit wie `replaceAll` dauert. In einer Klammer: 17 von 17 richtig.
>
> **Offen bleibt `POST /timer/stop`, und das ist jetzt gemessen statt vermutet.** Es fragt
> `foundAtServiceStart` nicht; `GET /timer` meldet den eingespielten Eintrag weiterhin als laufend,
> und ein direkter Stopp bucht **39 600 s — auch mit T-358**. Der Polaritätswechsel ändert daran
> nichts, beide Wege lassen `stopTimer` unberührt. Schwere damit **mittel** statt hoch: Es braucht
> jetzt eine Handlung am Dialog vorbei, nicht mehr nur eine ehrliche Datensicherung.

---

## 14 — Nächster Schritt

1. **unit-tester, nächste Welle:** die Fälle A bis E aus Abschnitt 8, mit den Zahlen 1 200 und
   39 600. Fall E ist der wichtige — er ist der einzige, der die Anordnung festhält.
2. **domain-dev, eigener Auftrag in `features/timer/**`:** `stopTimer` und `loadRunningTimer` gegen
   `foundAtServiceStart` prüfen (Risiko 1), den Kommentar aus offener Frage 4 ersetzen und — falls
   der Orchestrator zustimmt — `timerRecovery` zur Pflicht machen. Alle drei hängen an derselben
   Datei und gehören in **einen** Auftrag. Nicht gleichzeitig mit T-360.
3. **security-checker:** A-A-126 gegen den neuen Stand prüfen. Die Fläche ist kleiner, der
   Restpunkt aus Risiko 1 ist derselbe Weg in die Abrechnung und jetzt mit Zahl belegt.
