# T-375 — Die achtzehn roten Fälle, die Fixture-Lücke und die fünf Fälle, die R-34 schließen

**Rolle:** unit-tester. **Stand:** 2026-09-14. `HEAD` = `a5641e1`, Arbeitsbaum war beim Start
sauber (außer parallel laufenden Designer-Agenten in `docs/design/**`, nie berührt).

## Status

**Fertig.**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/test/usecases/idle.test.ts` | **Eine Zeile** im `beforeEach`: `timerRecovery: { entryId: null }` ergänzt — die gemessene Fixture-Lücke aus T-371 Abschnitt 6, nachgemessen, nicht übernommen |
| `apps/local-api/test/usecases/idle-service-start-guard.test.ts` | **Neu.** Die vier der fünf benannten Fälle, die `idle.ts`/`packages/domain` betreffen: `beginIdle` weist ab (beide Stellungen von `idleKeepTimerRunning`), eine eingespielte offene Inaktivitätsphase wird gedeckelt (mit und ohne Lebenszeichen), die Gegenprobe am eigenen Timer, das Lebenszeichen aus der Zukunft an beiden Stellen |
| `apps/local-api/test/usecases/data-transfer-timer-recovery.test.ts` | **Fall F ergänzt** — der fünfte Fall: ein nebenläufiger Leser gegen `unit-of-work.ts`, mit siebzehn Lesern statt einem |
| `packages/domain/test/timer.test.ts` | Die sechs vorbestehenden `decideOrphanedTimer`-Aufrufe tragen jetzt `now`; zwei neue Fälle testen den Deckel selbst auf Domänenebene |

Kein Produktivcode dauerhaft geändert. Für den Rot-Nachweis wurden `apps/local-api/src/features/timer/idle.ts` und `packages/domain/src/time-entry.ts` **kurzzeitig** durch `git show 311b26e:…` ersetzt, `packages/storage/src/sqlite/unit-of-work.ts` und `apps/local-api/src/features/data-transfer/data-transfer.ts` kurzzeitig durch eine selbst geschriebene Gegenfassung — alle vier danach **byte-identisch** zurückgeschrieben, mit `md5sum`-Nachweis (Abschnitt 3).

## Zusammenfassung

Die eine Fixture-Zeile aus T-371 trifft zu: Sie macht alle 23 Fälle in `idle.test.ts` grün, und für alle 18 vorher roten Fälle ist es dieselbe Behauptung wie vorher — die Fixture simulierte fälschlich „kein `captureTimerRecovery` lief", wodurch jeder frisch gestartete Timer als Leiche eines fremden Laufs galt; mit der Korrektur ist er wieder, was er in jedem dieser 18 Fälle sein soll: der eigene, gewöhnliche Timer dieser Sitzung, für den `bookingEndOf` unverändert die reine Durchreiche ist. Ich habe das nicht angenommen, sondern für die beiden archivbezogenen Fälle (die T-375 ausdrücklich nannte) einzeln durchgerechnet und alle 18 Namen gegen die Tabelle in Abschnitt 2 geprüft. Die fünf vom Orchestrator benannten neuen Fälle stehen, jeder rot gegen den vor-T-371-Stand und grün gegen `HEAD`, mit dem Rot-Nachweis selbst gefahren (nicht vermutet); die sechs `decideOrphanedTimer`-Bestandsfälle tragen jetzt `now`, und zwei neue Domänenfälle sichern den Deckel selbst ab. `apps/local-api/test` steht bei 374 grün (vorher 352 Baseline + 18 rot), `packages/domain/test` bei 391 grün (22 in `timer.test.ts`), `pnpm test:coverage` bei **1914 grün, 0 rot, 2 übersprungen** über 101 Dateien, `pnpm typecheck` grün über alle acht Projekte samt Test- und E2E-Konfiguration.

---

## 1 — Wie der rote Stand hergestellt wurde

**Für die 18 vorbestehenden Fälle:** Der rote Stand ist `HEAD` selbst — ich habe die Fixture-Zeile
kurz entfernt (mit dem Edit-Werkzeug, keine `git`-Operation nötig, da es meine eigene, noch
ungrüne Änderung war) und den vollständigen Fehlschlag mit Namen protokolliert
(`pnpm vitest run apps/local-api/test/usecases/idle.test.ts --reporter=verbose`, 18 × `×`, 5 × `✓`
— die Liste steht vollständig in Abschnitt 2). Danach wieder eingefügt, 23/23 grün.

**Für die vier neuen Fälle in `idle-service-start-guard.test.ts`, die `idle.ts` betreffen (Fall 1
und Fall 2, vier Einzelfälle):** `idle.ts` ist seit `f6f4d6d` bis `311b26e` **unverändert**
(`git diff --stat f6f4d6d 311b26e -- .../idle.ts` liefert keine Ausgabe). Der Stand vor T-371 ist
damit `git show 311b26e:apps/local-api/src/features/timer/idle.ts` — ich habe die Produktivdatei
kurzzeitig damit ersetzt:

```
md5sum vorher   d3b9d9f4e535b1c9be6f219a6300cafc
md5sum nachher  d3b9d9f4e535b1c9be6f219a6300cafc   (nach dem Zurückschreiben, identisch)
git diff --stat -- apps/local-api/src/features/timer/idle.ts   → keine Ausgabe (byte-identisch)
```

Ergebnis: Fall 1 (beide Stellungen) und Fall 2 (mit und ohne Lebenszeichen) — **vier von vier
rot**; Fall 3 (Gegenprobe) und Fall 4 (Lebenszeichen aus der Zukunft) blieben **grün**, wie
erwartet, weil sie `idle.ts` gar nicht oder nicht auf diesem Weg berühren.

**Für Fall 4 (`packages/domain/src/time-entry.ts`, `decideOrphanedTimer.now`):** derselbe Weg,
`git show 311b26e:packages/domain/src/time-entry.ts`:

```
md5sum vorher   311d52ad27070268bd1096d7c0d50c95
md5sum nachher  311d52ad27070268bd1096d7c0d50c95
git diff --stat -- packages/domain/src/time-entry.ts   → keine Ausgabe
```

Ergebnis: beide Fall-4-Fälle rot (`251613021599 s` statt `39600 s`, exakt die Zahl aus dem Bericht
des security-checkers), Fall 1–3 blieben grün (unberührt von dieser Datei).

**Für Fall 5 (`unit-of-work.ts`, „`return next` statt `return queue`"):** Diese Gegenfassung
existiert in keinem Git-Ref — T-358/T-363/T-371 liefen alle unversioniert im selben Arbeitsbaum.
Ich habe sie selbst geschrieben (eine Zeile, `return next;` → `return queue;`), mit `md5sum`
gesichert, den bestehenden Fall E gegen sie laufen lassen, zurückgeschrieben und erneut per
`md5sum` und `git diff --stat` geprüft (beide leer/identisch). **Befund, der über die Aufgabe
hinausgeht:** Diese Änderung ist **nicht** die stille Regression, die der Kommentar in
`unit-of-work.ts:259` befürchtet — sie ist laut: `queue` löst **immer** zu `undefined` auf
(`queue = next.then(() => undefined, () => undefined)`), und ein `return queue;` gibt diesen Wert
an **jeden** Aufrufer zurück, auch an einen erfolgreichen. Beim ersten Lauf gegen diese Fassung
sind nicht nur meine Fälle, sondern praktisch der gesamte restliche Bestand in
`apps/local-api/test` rot (jeder `await unit.…`, der einen Rückgabewert erwartet, bekommt
`undefined`). Für die von T-371 tatsächlich befürchtete **Reihenfolge**-Regression (nicht der
Rückgabewert, sondern *wann* die Zuweisung `context.timerRecovery.entryId = …` gegen einen
nebenher gereihten Leser gewinnt) habe ich zusätzlich die im T-358-Bericht verworfene
**Zwei-Transaktionen-Anordnung** in `data-transfer.ts` nachgebaut (kurzzeitig, `md5sum` vorher/
nachher `2fa0e9531b1883f3fa55f1561ae9c294`, identisch) und meinen neuen Fall F fünfmal in Folge
dagegen gefahren:

```
Zwei-Transaktionen-Anordnung (verworfen)   0 von 17 Lesern sahen 1200 s — alle 17 sahen `null` (5/5 Läufe)
Diese Anordnung (aktuell, eine Klammer)   17 von 17 Lesern sahen 1200 s (5/5 Läufe)
```

Das ist deterministischer, als T-358 es mit einem einzigen Leser gemessen hatte (16/17) — mit 17
synchron vor dem ersten `await` gestarteten Lesern (derselbe Kunstgriff wie in Fall E, nur
skaliert) trifft die Zwei-Transaktionen-Anordnung in meinen Läufen **jedes Mal jeden** Leser, nicht
nur einen von siebzehn.

---

## 2 — Tabelle (a): die achtzehn Fälle

Alle achtzehn nageln nach der Fixture-Korrektur **dieselbe** Behauptung fest wie vorher — **ja**
in jeder Zeile. Der Grund ist einheitlich und in Abschnitt 4 hergeleitet: Kein einziger der
achtzehn Fälle legt einen Timer an, der beim Dienststart vorgefunden worden wäre; alle arbeiten mit
dem in `beforeEach` frisch gestarteten `entryId`. Mit der korrekten Fixture ist dieser Timer nicht
mehr fälschlich eine Leiche, `bookingEndOf` bleibt für ihn die reine Durchreiche (`!foundAtServiceStart`
→ `return wish`), und das ist **exakt**, was der Code vor T-371 für jeden Aufruf ohnehin getan hat
— T-371 hat an dieser Stelle nichts geändert, nur eine neue, davor liegende Frage eingeführt, die
für diesen Timer immer „nein" beantwortet werden muss und es nach der Korrektur auch tut.

| # | Fall (Zeile in `idle.test.ts`) | dieselbe Behauptung wie vorher? |
|---|---|---|
| 1 | 59 — speichert die Pausenoption und pausiert bis zur Zuordnung | ja |
| 2 | 73 — lässt den Timer während der Abwesenheit laufen | ja |
| 3 | 85 — teilt 40 Minuten ohne Überlappung auf | ja |
| 4 | 104 — verwirft ausschließlich die Pause | ja |
| 5–10 | 111 — `it.each` (2399, 2401, 0, -1, 1.5, NaN): weist unvollständige/überzählige Zuordnung ab | ja (alle sechs Unterfälle identisch begründet) |
| 11 | 118 — Doppelklick und Wiederholung erzeugen keine zweite Buchung | ja |
| 12 | 126 — rollt auch die erste Teilbuchung zurück, wenn die zweite scheitert | ja |
| 13 | 138 — erlaubt nach der Rückkehr Timerwechsel | ja |
| 14 | 150 — behält Leistung und Timer bei erneutem Rückkehr-Aufruf | ja |
| 15 | 169 — trennt eine vollständig inaktive Buchung ohne Nullsekunden-Buchung ab | ja |
| 16 | 175 — **stellt einen weiterlaufenden Timer zusammen mit der offenen Zuordnung aus dem Archiv wieder her** | ja — siehe Einzelprüfung unten |
| 17 | 192 — speichert Schwelle, berücksichtigt Ausschalten | ja |
| 18 | 203 — **sichert die noch offene Phase im Datenarchiv und stellt sie wieder her** | ja — siehe Einzelprüfung unten |

**Die beiden besonders angesehenen Archivfälle (Zeile 175 und 203):** Beide rufen
`db.transactions.inTransaction(unit => unit.dataArchive.replaceAll(snapshot))` **direkt über den
Port**, nicht über den Anwendungsfall `importDataArchive` aus `data-transfer.ts`. Das bedeutet:
`context.timerRecovery.entryId` bleibt in beiden Fällen während des ganzen Tests bei `null`
(gesetzt vom `beforeEach`) — es wird **nie** nachgeführt, weil nur `importDataArchive` das tut, und
dieser Weg wird hier nicht benutzt. Der über die Zeit laufende, immer wieder neu gebildete
`entryId` der jeweils aktiven Buchung ist zu keinem Zeitpunkt gleich `null`, also gilt
`foundAtServiceStart` in beiden Fällen **durchgängig als falsch** — vor und nach dem
Archiv-Roundtrip, unverändert. Beide Fälle messen damit ausschließlich, ob `dataArchive.replaceAll`/
`readAll` den Zustand von `time_entry`, `idle_session` und `timer_heartbeat` bit-genau
wiederherstellen (A-20.4, Round-Trip) — eine Frage, die von B-1/B-2 vollständig unberührt ist. Das
ist **kein** Zufall, sondern genau der Unterschied zu meinen neuen Fällen 1–2 in
`idle-service-start-guard.test.ts`, die bewußt den **Anwendungsfall** `importDataArchive` benutzen,
damit die Aufnahme tatsächlich nachgeführt wird und der gefundene Eintrag wirklich als vorgefunden
gilt.

**Kein Fall unter den 18 mußte in seiner Erwartung geändert werden.** Die einzige Änderung am
Bestand war die eine Fixture-Zeile.

---

## 3 — Tabelle (b): die neuen Fälle

| # | Fall | Was er festnagelt | Rot gegen welchen Stand | Datei : Zeile |
|---|---|---|---|---|
| N1a | `idleKeepTimerRunning=true` | `POST /timer/idle/begin` auf einem vorgefundenen Eintrag → `409 conflict`, keine Buchung, laufender Eintrag unverändert | rot gg. `idle.ts` = `git show 311b26e:…` (4/4 der Gruppe N1–N2 rot) | `idle-service-start-guard.test.ts:107` |
| N1b | `idleKeepTimerRunning=false` | dasselbe, für die zweite Stellung | rot gg. `idle.ts` = 311b26e | `idle-service-start-guard.test.ts:107` (zweiter Durchlauf des `it.each`) |
| N2a | eingespielte offene Phase, **mit** Lebenszeichen | `completeReturn` deckelt auf 1200 s, nicht 14400 s (der behauptete, ungeprüfte Beginn) | rot gg. `idle.ts` = 311b26e | `idle-service-start-guard.test.ts:130` |
| N2b | eingespielte offene Phase, **ohne** Lebenszeichen | keine Buchung entsteht, Timer setzt sekundengenau bei der Rückkehr fort | rot gg. `idle.ts` = 311b26e | `idle-service-start-guard.test.ts:168` |
| N3a | Gegenprobe, eigener Timer, Stopp | 39600 s, zeichengleich zu vorher | **grün gg. beide Stände** — Invariante, siehe Abschnitt 4 | `idle-service-start-guard.test.ts:205` |
| N3b | Gegenprobe, eigener Timer, Inaktivität | 39000 s Buchung, Timer setzt ohne Überlappung fort | **grün gg. beide Stände** — Invariante | `idle-service-start-guard.test.ts:221` |
| N4a | Lebenszeichen aus der Zukunft, Verwaistendialog | `251613021599 s → 39600 s` (Zahl exakt aus T-370) | rot gg. `packages/domain/src/time-entry.ts` = 311b26e | `idle-service-start-guard.test.ts:275` |
| N4b | Lebenszeichen aus der Zukunft, direkter Stopp | dieselbe gedeckelte Zahl wie am Dialog, kein Ende in der Zukunft | rot gg. `time-entry.ts` = 311b26e | `idle-service-start-guard.test.ts:287` |
| N5 | siebzehn nebenläufige Leser gegen `unit-of-work.ts` | kein Leser sieht je den Zwischenstand — auch nicht einer von siebzehn | rot gg. selbst geschriebener Zwei-Transaktionen-Anordnung in `data-transfer.ts` (0/17 statt 17/17, 5/5 Läufen reproduziert); **nicht** rot gegen den wörtlichen `return queue`-Tausch, weil dieser bereits durch den Rückgabewert (`undefined`) praktisch den ganzen Bestand rot macht — siehe Befund in Abschnitt 1 | `data-transfer-timer-recovery.test.ts:313` (Fall F) |
| N6a/b | sechs vorbestehende `decideOrphanedTimer`-Aufrufe tragen jetzt `now` | keine geänderte Erwartung — reine Nachziehung, damit ein künftiges Pflichtfeld sie nicht bricht | nicht zutreffend (keine neue Behauptung) | `packages/domain/test/timer.test.ts:148,162,180,215,231,259` |
| N7a | Deckel nach oben, `now` vor dem Lebenszeichen | gebucht wird bis `now` (20 min), nicht bis zum Lebenszeichen (60 min) | rot gg. `time-entry.ts` = 311b26e | `packages/domain/test/timer.test.ts:272` |
| N7b | Deckel nach oben, `now` vor dem Start | rückwärts laufende Uhr → `discarded/timer_too_short`, negative Dauer, keine Buchung | rot gg. `time-entry.ts` = 311b26e | `packages/domain/test/timer.test.ts:299` |

**Ehrlicher Absatz, wie von T-368 vorgemacht:** N3a und N3b sind **Invarianten**, keine
Verengungen — sie bleiben bei jeder mir bekannten Gegenfassung grün, weil sie einen Weg messen, den
weder B-1 noch B-2 anfassen (der Timer ist niemals „vorgefunden"). Ihr Wert liegt darin, daß sie
bei einem künftigen, zu aggressiven Umbau der beiden Türen (der versehentlich **jeden** Timer
erfaßt) sofort rot würden — das ist der Sinn einer Gegenprobe, nicht ihre Schwäche.

---

## 4 — Warum die 18 Fälle und N3a/N3b von derselben Regel getragen werden

`bookingEndOf(context, unit, running, wish)` (`apps/local-api/src/features/timer/timer.ts:286`):

```ts
if (!foundAtServiceStart(context, running.id)) return wish;
```

und `foundAtServiceStart`:

```ts
return context.timerRecovery === undefined || context.timerRecovery.entryId === entryId;
```

Mit `timerRecovery: { entryId: null }` und einem `entryId`, der niemals `null` ist (jede
`unit.todos.create`/`unit.timer.start`-Kombination erzeugt eine echte Kennung), ist
`foundAtServiceStart` für den eigenen Timer **immer** `false`, in **jedem** der 18 Fälle und in
N3a/N3b — `bookingEndOf` ist die reine Durchreiche, `beginIdle`s neue Abweisung wird nie erreicht.
Das ist wortwörtlich der Zustand vor T-371 für einen Timer dieser Sitzung, nicht eine
Annäherung daran.

---

## 5 — Nachweisläufe, alle selbst gefahren

| Lauf | Ergebnis |
|---|---|
| `vitest run apps/local-api/test/usecases/idle.test.ts` (Fixture entfernt) | **18 rot, 5 grün** — vollständige Namensliste protokolliert (Abschnitt 1) |
| `vitest run apps/local-api/test/usecases/idle.test.ts` (mit Fixture) | **23 grün, 0 rot** |
| `vitest run apps/local-api/test/usecases/idle-service-start-guard.test.ts` gg. `HEAD` | **8 grün, 0 rot** |
| dieselbe Datei gg. `idle.ts` = 311b26e | **4 rot (Fall 1+2), 4 grün (Fall 3+4)** |
| dieselbe Datei gg. `time-entry.ts` = 311b26e | **2 rot (Fall 4), 6 grün (Fall 1–3)** |
| `vitest run apps/local-api/test/usecases/data-transfer-timer-recovery.test.ts` gg. `HEAD` | **6 grün** (Fall A–F) |
| dieselbe Datei, Fall F, gg. Zwei-Transaktionen-Anordnung, 5 Wiederholungen | **0/17 → 17/17 jedes Mal** (0/5 Läufe grün) |
| `vitest run packages/domain/test/timer.test.ts` gg. `HEAD` | **22 grün** |
| dieselbe Datei gg. `time-entry.ts` = 311b26e | **2 rot (N7a/b), 20 grün** |
| `vitest run apps/local-api/test packages/domain/test packages/storage/test packages/export/test` | **1659 grün, 2 übersprungen, 0 rot**, 80 Dateien |
| `pnpm test:coverage` | **1914 grün, 2 übersprungen, 0 rot**, 101 Dateien; `packages/domain` 95,07 % Anweisungen, `packages/export` 97,95 % — beide über der 80-%-Auflage. Ein Lauf zuvor zeigte **1 rot** in `apps/local-api/test/version/checker.test.ts` (außerhalb meiner Hoheit, von T-358 bereits als einmal flackernd gemeldet); ein Wiederholungslauf war wieder vollständig grün. Nicht von mir angefaßt, nicht als durchgehend grün behauptet — hier ausdrücklich benannt. |
| `pnpm typecheck` | **grün**, alle acht Projekte samt `tsconfig.test.json` und `tests/e2e/tsconfig.json` |
| `git status --porcelain` nach Abschluss | ausschließlich meine vier Dateien plus fremde, unberührte Einträge (`board.md`, zwei `docs/design/*`, zwei fremde Berichte) |
| `md5sum` vorher/nachher an allen vier kurzzeitig ersetzten Produktivdateien | in allen vier Fällen identisch, `git diff --stat` an jeder leer |

**Nicht gefahren:** `pnpm check` als Ganzes, `build`, `test:rust`, `test:e2e` — nicht Teil des
Auftrags, und im Arbeitsbaum liefen parallel ein visual-qa und zwei Designer, deren Stand ich
nicht als „grün" für mich in Anspruch nehme.

---

## Annahmen

1. **Die Fixture-Korrektur ist keine Erfindung, sondern die Nachbildung von `main.ts`:** Genau wie
   `composition.ts` es im echten Dienst tut, ruft ein von Hand gebauter Prüfzusammenhang
   `captureTimerRecovery` (implizit über `{ entryId: null }`) **vor** dem ersten Timerstart — exakt
   das Muster, das T-358/T-363 in ihren eigenen Testdateien schon benutzt haben und das T-363
   Abschnitt 7 Fall G als Falle vorhergesagt hatte.
2. **N3a/N3b sind Invarianten und als solche ausgewiesen**, nicht als Verengungen deklariert — im
   Geist von T-368s ehrlichstem Absatz.
3. **`decideOrphanedTimer.now` zur Pflicht machen — nichts spricht mehr dagegen, soweit ich messen
   kann.** Alle drei Produktionsaufrufe (`timer.ts:294,754,800`) übergeben `now` bereits (von
   domain-dev in T-371 gebaut und von `proof:layers` Abschnitt 7 gemessen); alle acht
   Domänen-Testaufrufe tun es jetzt auch. Die Umsetzung selbst — das Feld im Typ von optional auf
   verpflichtend zu setzen — ist eine Änderung an `packages/domain/src/time-entry.ts` und damit
   Produktivcode; ich habe sie nicht vorgenommen, nur die Testseite dafür vorbereitet.
4. **Kein Produktivcode dauerhaft verändert.** Alle vier kurzzeitigen Ersetzungen sind mit
   `md5sum` und `git diff --stat` als restlos zurückgenommen nachgewiesen (Abschnitt 5).
5. **Keine Testdaten mit echten Call-Nummern, Kundennamen oder Zugangsdaten.** Alle Titel sind
   generisch („Rückruf", „Anderes Todo", „Prüfrechner").
6. **Meßkopien nicht im Quellbaum belassen.** Alle Backups und die probeweise „Fall F"-Datei lagen
   ausschließlich im Sitzungs-Scratchpad; `git status --porcelain` wurde nach jedem Rückschreiben
   gegengelesen (Abschnitt 5).

## Risiken

1. **Der einmal geflackerte Fall in `apps/local-api/test/version/checker.test.ts`** trat bei einem
   von zwei vollen `test:coverage`-Läufen auf, beim zweiten nicht. Ich habe die Datei nicht
   angefaßt (T-367 wartet dort auf Freigabe) und melde ihn nur, statt ihn zu reparieren oder zu
   verschweigen.
2. **N5 (der nebenläufige Leser) ist rot gegen die Zwei-Transaktionen-Anordnung, nicht gegen den
   wörtlichen `return next` → `return queue`-Tausch.** Letzterer ist keine stille Regression,
   sondern eine laute (Rückgabewert `undefined` an jeden Aufrufer) und wird bereits von praktisch
   jedem anderen Prüffall im Bestand abgedeckt. Der Kommentar in `unit-of-work.ts:259` („nichts
   würde rot") trifft für **diese eine** Gegenfassung nicht zu — das ist ein Befund, kein
   Widerspruch zu N5, das die tatsächlich befürchtete Reihenfolge-Regression mißt.
3. **B-3 (fehlende Obergrenze für eine Dauer) und B-5 (das A-24-Zuordnungsfenster nach einem
   Archiv mit offener Inaktivität) bleiben unangefaßt** — beide sind Produkt-/Domänenentscheidungen
   des Orchestrators (T-371 Abschnitt 10, offene Fragen 3 und 4), keine Prüflücke, die ich in
   dieser Aufgabe schließen sollte.

## Offene Fragen

Keine an den Orchestrator zu meiner eigenen Arbeit. Eine Antwort auf T-371s Frage steht in
Abschnitt 6.

## Nächster Schritt

1. **code-reviewer / security-checker, Wiedervorlage:** die fünf neuen Fälle plus die
   Fixture-Korrektur gegen B-1/B-2 aus T-371 lesen; insbesondere N5s Befund zum
   `unit-of-work.ts`-Kommentar (Risiko 2) verdient eine eigene Zeile im Bericht der nächsten
   Sicherheitsprüfung.
2. **domain-dev, wenn gewünscht:** `decideOrphanedTimer.now` von optional auf verpflichtend
   heben — die Testseite ist dafür vorbereitet (Annahme 3), die sechs Bestandsfälle brechen dabei
   nicht.
3. **Orchestrator:** `risks.md` R-34, siehe Abschnitt 6.

---

## 6 — Antwort auf T-371s offene Frage: trägt mein Prüfstand die Schließung von R-34?

**Ja, mit einer Einschränkung, die ich benenne statt zu verschweigen.**

T-371 wollte R-34 nicht geschlossen sehen, „bevor die achtzehn grün sind und ein Fall die
idle-Tür mißt — sonst ist die Schließung zum dritten Mal eine Behauptung." Beide Bedingungen sind
jetzt erfüllt und **selbst gemessen, nicht übernommen**:

- Die achtzehn sind grün, und ich habe für jeden einzelnen geprüft, daß er dieselbe Behauptung
  festnagelt wie vor der Fixture-Korrektur (Tabelle a) — nicht nur die Zahl „18 → 0" genommen.
- Die idle-Tür ist gemessen: **beide** Türen aus B-1 (`beginIdle` weist ab, `completeReturn`
  deckelt), **beide** Stellungen von `idleKeepTimerRunning`, mit Archiv-Roundtrip über den echten
  Anwendungsfall (nicht den rohen Port), mit und ohne Lebenszeichen, und jeder einzelne Fall rot
  gegen den tatsächlichen Vor-T-371-Stand von `idle.ts` (nicht vermutet — mit `md5sum` belegt
  hergestellt und zurückgenommen).
- Der Deckel nach oben (B-2) ist an **zwei** Stellen gemessen (Verwaistendialog und direkter
  Stopp) und zusätzlich auf Domänenebene direkt an `decideOrphanedTimer`, nicht nur über den
  Anwendungsfall.
- Die Überlappung, die drei Aufträge hintereinander betraf, ist über die Gegenprobe N3b
  mitgesichert (Timer setzt nach einer Inaktivität sekundengenau ohne Überlappung fort) — ergänzend
  zu T-371s eigener Messung an `startTimer`, die ich nicht dupliziert, aber durch die Gegenprobe am
  benachbarten Weg gestützt habe.

**Die Einschränkung:** N5 sichert die von T-369/T-370 benannte Ordnungs-Zusage in
`unit-of-work.ts` empirisch (17/17 gegen 0/17, fünfmal reproduziert) und über die tatsächlich
befürchtete Zwei-Transaktionen-Regression — aber sie ist **kein** Ersatz für einen geschriebenen
Vertrag an der Datei selbst (weiterhin nur ein Kommentar, wie T-371 es beauftragt bekam). Wer die
beiden Zeilen in `unit-of-work.ts` anders anordnet, ohne dabei den Rückgabewert zu brechen, könnte
einen Fall treffen, den ich nicht konstruiert habe. Für die konkrete, von zwei Prüfern unabhängig
benannte Sorge (Zwei-Transaktionen-Anordnung, Reihenfolge der Zuweisung gegen einen nebenher
gereihten Leser) trägt mein Stand.

Damit: **R-34 kann aus meiner Sicht als geschlossen geführt werden**, mit B-3 und B-5 weiterhin
offen (wie von T-371 selbst vorgeschlagen) und mit dem Hinweis, daß die `unit-of-work.ts`-Zusage
eine gemessene, aber nicht typgesicherte Garantie bleibt.
