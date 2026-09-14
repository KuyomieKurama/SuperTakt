# T-363 — `stopTimer` fragt dieselbe Frage wie die Anzeige

**Rolle:** domain-dev. **Stand:** 2026-09-14, Welle 10. Auftrag: der Restpunkt von **R-34**.

## Status

**Fertig — mit einem Befund, der den Auftrag größer macht, als er gestellt war.**

Der beauftragte Punkt ist beidseitig gemessen zu: `POST /timer/stop` bucht nach dem Einspielen
**1 200 s statt 39 600 s**, und der gewöhnliche Fall bleibt zeichengleich bei der Wanduhr.

**Der Auftrag nennt den direkten Stopp „den letzten Weg zu elf unverdienten Stunden". Das trifft
nicht zu — es waren drei, und ich habe alle drei gemessen und geschlossen:**

| Weg | HEAD | ausgeliefert |
|---|---|---|
| `POST /timer/stop` nach dem Einspielen | 39 600 s | **1 200 s** |
| `POST /timer/stop` nach einem **gewöhnlichen Absturz, ganz ohne Archiv** | 39 600 s | **1 200 s** |
| `POST /timer/start {stopRunning:true}` verdrängt den vorgefundenen Timer | 39 600 s | **1 200 s** |
| `POST /timer/heartbeat` hebt die Grenze des Dialogs an | 1 200 → **39 600** | **1 200 → 1 200** |

Die zweite Zeile ist der Fall, für den E-036 überhaupt geschrieben wurde; sie braucht kein Archiv.
Die dritte ist der **bequemste** Weg: Die Oberfläche fragt beim Start auf einem anderen Todo „Ein
Timer läuft. Stoppen?", und ein Ja genügt. Die vierte hob den Deckel auch für den Dialog wieder an
— ohne sie wäre meine eigene Änderung nach einer Minute Oberfläche wieder wirkungslos gewesen.

---

## 1 — Die Änderungen

Eine Datei Fachcode: `apps/local-api/src/features/timer/timer.ts`. Dazu die
Schnittstellenbeschreibung `apps/local-api/openapi/takt-local-api.yaml`.
**`context.ts` und `composition.ts` sind nicht angefaßt** (Begründung in Abschnitt 4).

**a) Eine neue Funktion, in der die Regel einmal steht** — `bookingEndOfStop`:

```ts
async function bookingEndOfStop(context, unit, running, wallClock): Promise<Timestamp> {
  if (!foundAtServiceStart(context, running.id)) return wallClock;
  const decision = decideOrphanedTimer({
    running,
    heartbeatAt: await unit.heartbeat.lastSeen(running.id),
    resolution: 'book_until_heartbeat',
  });
  return decision.kind === 'recorded' ? decision.entry.endedAt : running.startedAt;
}
```

Sie entscheidet nichts selbst: Was „verwaist" heißt, steht weiterhin allein in
`foundAtServiceStart` (T-350), und was daraus folgt, in `decideOrphanedTimer` (`packages/domain`).
Neu ist nur, **wer fragt**.

**b) `stopTimer`** übergibt `unit.timer.stop(note, endsAt)` statt `(note, timestamp)`. Ein Weg,
auf dem eine Buchung entsteht, eine Stelle, die über die Mindestdauer urteilt.

**c) `startTimer`** schließt einen **vorgefundenen** verdrängten Timer vorher und gedeckelt und
startet danach ohne Verdrängung. Beides in derselben Klammer; die beiden fachlichen Gründe, aus
denen der Port einen Start abweist, werden vorher geprüft (`before !== null`, `idle.pending()`),
und ein Fehlschlag der Speicherung danach **wirft**, damit die Klammer zurückrollt — dieselbe
Begründung wie in `idle.ts`, und `onError` macht daraus `internal_error` ohne Textleck.

**d) `touchHeartbeat`** schreibt für einen vorgefundenen Eintrag **kein** Lebenszeichen mehr und
antwortet mit `seenAt: null` (Abschnitt 3).

**e) Der falsche Kommentar** über „die bekannte Lücke" ist ersetzt (Auftragspunkt 4). Der
Ersatztext aus dem T-358-Bericht ist übernommen und um das erweitert, was seitdem gemessen ist —
insbesondere, daß der zweite Eingang nicht der einzige war.

**f) Zwei Korrekturen in der OpenAPI-Beschreibung**, die nicht Text zur Änderung sind, sondern
Befunde:

- `/timer/stop` sagte: „Die Dauer entsteht aus einer **monotonen Messung**, nicht aus der
  Differenz zweier Wanduhrzeiten." **Das war nie so.** `decideTimerStop` rechnet
  `secondsBetween(startedAt, now)`; `ClockPort.monotonicSeconds` existiert, wird aber von keiner
  Stelle des Timers gerufen (geprüft über den ganzen Bestand: drei Fundstellen, alle in
  `packages/storage`, davon zwei Kommentar). Ich habe die **Beschreibung an den Code** angeglichen
  und nicht umgekehrt: Eine monotone Dauermessung wäre eine Änderung an der Abrechnung.
- Der `409` an `/timer/stop` nannte nur `timer_not_running`. Gemessen kommt dort auch `conflict`
  heraus (unbestätigte Rückkehr aus der Inaktivität, A-24). Jetzt genannt.

---

## 2 — Frage 1 des Auftrags: Was bucht der Stopp?

**Dieselbe Zahl, die die Anzeige nennt — `bookableSeconds` bis zum letzten Lebenszeichen.** Nicht
eine andere.

Der Grund ist der, den der Auftrag selbst nennt: Zwei Zahlen für denselben Eintrag wären ein neuer
Fehler. Welche in der Abrechnung landete, entschied bis heute der **Weg durch die Oberfläche**.

**Warum nicht abweisen?** Die naheliegende Alternative wäre ein `conflict` („beantworten Sie zuerst
die Frage aus E-036"), wie es dieselbe Funktion für eine offene Inaktivitätsphase tut. Zwei Gründe
dagegen:

1. **Der Stopp ist bereits eine Antwort.** Der Benutzer sagt „buchen", und genau das ist die
   Vorgabe des Dialogs. Der Gegenausgang „verwerfen" läßt sich über `POST /timer/stop` nicht
   ausdrücken und bleibt deshalb beim Dialog — der Typ `StopTimerResult` ändert sich nicht,
   `orphan_discarded` kommt hier weiterhin nicht vor (O-R bleibt gültig).
2. **Nach einem Einspielen im laufenden Betrieb gibt es den Dialog gar nicht zu beantworten.**
   `TimerContext.tsx` holt `GET /timer/orphaned` **einmal beim Aufbau der Seite**
   (`useEffect(..., [refresh])`). Eine Abweisung ließe den Benutzer vor einem Timer stehen, den er
   nicht schließen kann, bis er neu lädt.

Unterschied zum Dialogweg: Gebucht wird mit der **Leistung aus dem Stopp**, nicht mit der am
Eintrag gespeicherten — `resolveOrphanedTimer` hat keine und nimmt deshalb die gespeicherte. Das
ist der einzige.

**Ohne Lebenszeichen** liefert `decideOrphanedTimer` `discarded`; der Stopp gibt dann
`kind: discarded`, `reason: timer_too_short`, und die Zeile wird abgeräumt — derselbe Weg wie im
Dialog. Erreichbar ist das fast nur über ein Archiv ohne `timer_heartbeat`: `startTimer` schreibt
das erste Lebenszeichen sofort mit.

---

## 3 — Der Befund, der die Änderung sonst wertlos gemacht hätte (M4)

**Ein einziges `POST /timer/heartbeat` hob `bookableSeconds` des vorgefundenen Eintrags von 1 200
auf 39 600** — und danach buchte auch der Dialog elf Stunden.

Das ist kein Randfall, sondern der Regelfall: `TimerContext.tsx` startet seinen Minutentakt,
sobald `GET /timer` einen laufenden Timer meldet (`useEffect(..., [running])`), und das tut es für
den vorgefundenen Eintrag ebenso wie für jeden anderen. Die Zusage aus E-036 — „das Lebenszeichen
deckelt den Schaden auf ein Schreibintervall" — hielt damit nur, solange niemand die Oberfläche
öffnete. Nach einem Absturz steht der Dialog offen, und sein Angebot wächst im Minutentakt mit.

Das Lebenszeichen ist der Beleg, daß ein **lebender** Lauf die Buchung mitgeschrieben hat. Wird es
für einen vorgefundenen Eintrag weitergeschrieben, wird aus „bis zum letzten Lebenszeichen"
stillschweigend „bis jetzt" — genau der Satz, den E-036 ausschließt.

**Die Gegenrichtung ist bedacht und sie ist die billigere.** Wer nach einem Neustart
**weitergearbeitet** hat, ohne den Dialog zu beantworten, bucht jetzt nur bis zum Absturz und muß
die Buchung von Hand verlängern. Der Fehler geht zu Lasten der eigenen Zeit, nicht zu Lasten der
Rechnung des Kunden — und für die Zeit danach gibt es ohnehin keinen Beleg. R-34 ist ein Risiko
über **unverdiente** Stunden; die Ausfallrichtung folgt dem.

---

## 4 — Frage 3 des Auftrags: Wird `timerRecovery` Pflicht? **Nein — und der Grund hat sich mit dieser Änderung gedreht**

T-358 hielt „Pflicht machen" für richtig und hat es nicht getan. Ich habe es entschieden, und die
Entscheidung lautet **nein**. Drei Gründe, der zweite ist neu und der schwerste:

1. **Es bringt keine Laufzeitzusage.** Die einzige getippte Bildungsstelle ist `composition.ts`
   (`const context: AppContext | null = …`), und sie setzt das Feld bereits. Jeder andere
   Zusammenhang entsteht über `as unknown as AppContext` und bliebe auch mit einem Pflichtfeld
   stumm unvollständig. Die Zusage hinge weiter am Zweig, nicht am Typ — nur sähe sie jetzt so aus,
   als hinge sie am Typ.
2. **Pflicht im Typ zwingt, die Ausfallabzweigung zu löschen — und an ihr hängt seit T-363 Geld.**
   `foundAtServiceStart` prüft `context.timerRecovery === undefined`. Mit einem Pflichtfeld ist
   dieser Vergleich ein `tsc`-Fehler (TS2367, keine Überlappung), die Zeile müßte fallen, und dann
   gilt bei fehlendem Feld **jeder** offene Eintrag als Timer dieses Laufs. Bis heute hieß die
   falsche Richtung „der Dialog erscheint seltener". Seit heute heißt sie **Wanduhr** — also genau
   die 39 600 s aus R-34, erreichbar aus jedem von Hand gebauten Zusammenhang.
3. **Eine echte Zusage kostet keinen Typ, sondern eine Messung.** Wer sie will, mißt sie: ein
   Prüffall, daß der in `composition.ts` gebildete Zusammenhang das Feld trägt und daß `main.ts`
   `captureTimerRecovery` **vor** dem HTTP-Start ruft. Das kann kein Cast unterlaufen. Vorschlag
   für den unit-tester in Abschnitt 7, Fall F.

**Der Preis dieser Entscheidung ist gemessen und muß in die nächste Welle** (M6): In einem
Zusammenhang **ohne** `timerRecovery` gilt jeder offene Eintrag als vorgefunden — also bekommt er
kein Lebenszeichen, und ein Stopp bucht bis zum Startzeitpunkt, das heißt **er verwirft**. HEAD
buchte dort 39 600 s. Für die Prüffälle heißt das: **Jeder von Hand gebaute Zusammenhang, in dem
ein Timer läuft, muß `timerRecovery: { entryId: null }` tragen.** Der 352 Fälle große Bestand von
`apps/local-api/test` bleibt davon unberührt (gemessen, Abschnitt 8) — der einzige Fall, der
`stopTimer` ruft, tut es mit `running() === null`.

---

## 5 — Frage 5a: Eine offene `timer_idle`-Phase aus einem Archiv (gemessen)

Aufbau: Quellrechner mit laufendem Timer ab `06:00`, Lebenszeichen `06:20`, Inaktivität ab `06:10`
**ohne Rückkehr**, dann gesichert. Zielrechner, Uhr `17:00`.

```
GET /timer/idle   → offen seit 2026-09-13T06:10:00Z, returnedAt = null
GET /timer/orphaned → null          (die Idle-Abfrage geht vor)
POST /timer/stop  → 409 conflict    „Bestätigen Sie zuerst Ihre Rückkehr."
POST /timer/idle/return
  → Buchung 06:00 → 06:10 = 600 s, neuer laufender Eintrag ab 17:00:00Z, elapsed 0
```

**Mit und ohne meine Änderung zeichengleich.** Der Ausgang ist der A-24-Rückkehrdialog, nicht der
E-036-Verwaistendialog — genau die Vermutung aus T-358 Risiko 2, jetzt belegt. Er ist **nicht** das
Loch aus R-34: Der Stopp ist gesperrt, und gebucht werden 600 s, die der Quellrechner wirklich
gearbeitet hat.

**Was dabei auffiel und nicht zu R-34 gehört:** Das Zuordnungsfenster, das der A-24-Dialog danach
zur Verteilung anbietet, ist `06:10 → 17:00` = **39 000 s**. Kein stiller Weg — der Benutzer müßte
diese Stunden ausdrücklich auf Todos verteilen —, aber es ist derselbe Uhrversatz, der in einem
Dialog als verteilbare Zeit auftaucht. Das ist eine Frage an A-24 und nicht an E-036; sie liegt in
`features/timer/idle.ts` und gehört in einen eigenen Auftrag (offene Frage 2).

---

## 6 — Frage 5b: Soll das Einspielen den laufenden Timer melden? Vorschlag ohne Bau

Ja, ein Satz in `ImportSummary.warnings`. `data-transfer.ts` ist in diesem Auftrag nicht meine
Datei; **nicht gebaut**, nur der Wortlaut:

> „Die Sicherung enthielt einen laufenden Timer. Er gilt als unvollständige Buchung: Gebucht wird
> höchstens bis zu seinem letzten Lebenszeichen, nicht bis jetzt."

Der Satz von T-358 („…; Sie werden gefragt, was damit geschehen soll") ist seit T-363 zu viel
versprochen: Gefragt wird nur, wer die Seite neu lädt — wer stoppt, bekommt dieselbe Zahl ohne
Frage. Der Vorschlag sagt deshalb, was **gilt**, nicht, was geschehen wird.

---

## 7 — Vorgabe für den unit-tester (nächste Welle, kein Prüffall von mir geschrieben)

Aufbau wie T-358 Abschnitt 8; **Quelluhr `T0 = '2026-09-13T06:00:00Z'`, Lebenszeichen
`T0 + 1200 s`, Zieluhr `T0 + 39 600 s`.** Kein Dienst, kein Port, keine Datei.

**Vorbedingung für alle Fälle:** der Zusammenhang trägt `timerRecovery: { entryId: null }` und
`captureTimerRecovery` läuft **vor** dem Einspielen. Fehlt das Feld, mißt der Fall etwas anderes
(siehe Fall G).

| Fall | Aufbau | Erwartung |
|---|---|---|
| **T363-A** | Archiv mit laufendem Timer einspielen, dann `stopTimer(ziel, 'x')` | `recorded`, `durationSeconds === 1200`, **`not.toBe(39600)`** |
| **T363-B** | wie A, aber **ohne Archiv**: Timer starten, Lebenszeichen `T0+1200`, neuer Zusammenhang mit Uhr `T0+39600`, `captureTimerRecovery`, `stopTimer` | `recorded`, `1200` — der reine E-036-Fall |
| **T363-C** | Timer **in dieser Sitzung** starten (`captureTimerRecovery` davor, `entryId: null`), Uhr auf `T0+39600`, `stopTimer` | `recorded`, **`39600`** — der gewöhnliche Fall darf sich nicht ändern |
| **T363-D** | wie B, aber vor dem Stopp `touchHeartbeat` mit der Uhr auf `T0+39600` | `loadOrphanedTimer()?.bookableSeconds === 1200` **nach** dem Aufruf, `touchHeartbeat` → `ok(null)`, Stopp `1200` |
| **T363-E** | wie A, danach `startTimer(ziel, anderesTodo, true)` | `value.stopped.durationSeconds === 1200`, `endedAt === '2026-09-13T06:20:00Z'`, neuer Timer läuft |
| **T363-F** | zwei Timer derselben Sitzung, `startTimer(b, true)` verdrängt `a` | `stopped.durationSeconds === 39600`; und `startTimer(a, false)` → `confirmation_required` (A-6.8 unberührt) |
| **T363-G** | Zusammenhang **ohne** `timerRecovery`, Timer starten, Uhr weiter, `stopTimer` | `discarded`/`timer_too_short` — hält die Ausfallrichtung aus Abschnitt 4 fest, statt sie zu verschweigen |
| **T363-H** | `composition.ts`: Zusammenhang bilden und `context.timerRecovery` lesen | ist gesetzt (`{ entryId: null }`) — die Zusage, die kein Typ tragen kann |

Die Fälle A–E aus **T-358** Abschnitt 8 stehen unverändert daneben; sie messen das Einspielen, hier
wird der Timer gemessen. Überschneidung gibt es nur bei der Zahl 1 200.

**Zwei Fallen, die Zeit sparen:**

- `setup()` in `apps/local-api/test/usecases/data-transfer.test.ts` baut den Zusammenhang **ohne**
  `timerRecovery`. Wer dort einen Timer stoppt, mißt Fall G und nicht Fall A.
- Eine Uhr, die sich bewegt, braucht `openDatabase({ now: () => aktuell })` **und**
  `clock: { now: () => aktuell }`; zwei getrennte feste Werte ergeben Buchungen mit einem
  `updated_at` aus der Vergangenheit.

---

## 8 — Läufe

| Lauf | Ergebnis |
|---|---|
| Beidseitige Messung, neun Fälle, HEAD-Fassung **als zweites Modul geladen** (`git show HEAD:…`), ein Lauf je Fassung | Tabelle in Abschnitt 0 und unten |
| `vitest run apps/local-api/test` | **352 grün**, 2 übersprungen, 0 rot (5,7 s) — zweimal gefahren, vor und nach der `startTimer`-Änderung |
| `vitest run packages/{domain,storage,export}/test` | **1 283 grün**, 0 rot (53 Dateien) |
| `pnpm typecheck` (8 Projekte + Prüf- und E2E-Konfigurationen) | **Exit 0** |
| `pnpm boundaries` | grün, 528 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm -C apps/local-api proof:openapi` | 115 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:layers` | 36 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:callers` | 74 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:route-policy` | 48 bestanden, 0 fehlgeschlagen |
| `pnpm proof:codepoints` | 46 bestanden, 0 fehlgeschlagen |

**Nicht gefahren, und warum:** `proof:conflicts`, `proof:access` und `proof:export-api` binden
17843. Dort läuft eine echte Sitzung des Benutzers (`ss -ltnp`: `takt-local-api` auf 17843 und
17844, Vite auf 5173) — der Auftrag verbietet, sie anzufassen. `proof:conflicts` habe ich einmal
angestoßen und den Abbruch („Auf 127.0.0.1:17843 lauscht bereits etwas") stehenlassen, ohne etwas
zu beenden. `pnpm check` als Ganzes aus demselben Grund nicht.

**Meßaufbau.** Zwei `openDatabase({ location: ':memory:' })` als zwei Rechner, zwei bewegliche
Uhren, echter Weg `exportDataArchive` → `importDataArchive` → Anwendungsfall. Kein HTTP, kein Port,
keine Datei. „Ohne die Änderung" ist die **HEAD-Fassung der Datei**, als zweites Modul neben der
ausgelieferten geladen und über einen Schalter gewählt — die gelieferte Datei wurde dafür nicht
getauscht. Meßkopien (`apps/local-api/measure-t363.mts`,
`apps/local-api/src/features/timer/head-t363.ts`) sind **gelöscht**; `git status` zeigt aus meiner
Hand nur die beiden Dateien aus Abschnitt 1.

**Die volle Tabelle:**

| Messung | HEAD | ausgeliefert |
|---|---|---|
| M1 Archiv eingespielt, `GET /timer/orphaned` | 1 200 s | 1 200 s |
| M1 Archiv eingespielt, `POST /timer/stop` | **39 600 s** | **1 200 s** |
| M1b Archiv eingespielt, über den Dialog | 1 200 s | 1 200 s |
| M2 Timer dieser Sitzung, `POST /timer/stop` | 39 600 s | 39 600 s |
| M2 Lebenszeichen dabei | geschrieben | geschrieben |
| M2b Timer dieser Sitzung, 42 s lang | 42 s | 42 s |
| M3 Absturz ohne Archiv, `POST /timer/stop` | **39 600 s** | **1 200 s** |
| M4 `heartbeat` auf dem vorgefundenen Eintrag | 1 200 → **39 600**, Stopp 39 600 | **1 200 → 1 200**, Stopp 1 200 |
| M5 Archiv mit offener `timer_idle` | conflict, dann 600 s | identisch |
| M6 Zusammenhang ohne `timerRecovery` | 39 600 s | **verworfen** |
| M7 nach der Dialogantwort neuer Timer | 1 800 s | 1 800 s |
| M8 Start verdrängt eingespielten Timer | **39 600 s** | **1 200 s** |
| M9 Start verdrängt Timer dieser Sitzung | 39 600 s | 39 600 s |

---

## 9 — Annahmen

- **`loadRunningTimer` bleibt, wie es ist.** T-358 schlug vor, auch `GET /timer` gegen
  `foundAtServiceStart` zu prüfen. Ich habe es **nicht** getan: Die Gefahr war nie die Anzeige,
  sondern die gebuchte Zahl, und ein `null` an dieser Stelle nähme dem Benutzer die einzige Fläche,
  über die er den Eintrag überhaupt schließen kann — nach einem Einspielen im laufenden Betrieb
  erscheint der Dialog ja nicht. Statt dessen steht die Trennung jetzt in der OpenAPI:
  `elapsedSeconds` ist die Wanduhr und ausdrücklich **nicht** die Dauer, die ein Stopp buchen
  würde; wer eine Dauer zur Entscheidung anzeigt, fragt `GET /timer/orphaned`.
- **Der Stopp bucht, statt abzuweisen** (Abschnitt 2).
- **Der vorgefundene Eintrag bekommt kein Lebenszeichen mehr** (Abschnitt 3). Über den Auftrag
  hinaus, ein `if`, rückbaubar — aber ohne ihn ist der Rest gemessen nach einer Minute Oberfläche
  wieder offen.
- **`startTimer` ist mitgeändert** (M8). Ebenfalls über den Auftrag hinaus, aber in derselben Datei,
  mit derselben Funktion und derselben Zahl; ein Auftrag, der den direkten Stopp schließt und die
  Schaltfläche daneben offen läßt, hätte R-34 nicht verkleinert, sondern verschoben.
- **Kein Prüffall geschrieben**, wie beauftragt. Vorgabe in Abschnitt 7.
- **Kein neuer Oberflächentext, keine neue Warnung** (Abschnitt 6 ist ein Vorschlag).

---

## 10 — Risiken

1. **Wer nach einem Dienstneustart weiterarbeitet, ohne den Dialog zu beantworten, verliert die
   Zeit danach.** Gewollt und in E-036 gedeckt („bis zum letzten Lebenszeichen"), aber es ist eine
   sichtbare Verhaltensänderung: Bisher wuchs die Grenze mit der Wanduhr mit. Die Buchung ist
   danach von Hand änderbar; die Oberfläche sagt es nicht. Wenn der ux-Reviewer dazu einen Satz
   will, gehört er in den Verwaistendialog („Gebucht wird bis 06:20 Uhr — die Zeit danach ist nicht
   belegt.").
2. **Ein Lebenszeichen aus der Zukunft bucht mehr als die Wanduhr.** Kommt das Archiv von einem
   Rechner, dessen Uhr vorgeht, liegt `heartbeatAt` nach `now`, und gebucht wird bis dorthin.
   **Das ist kein neuer Weg** — `resolveOrphanedTimer` tut das seit E-036 —, aber der Stopp teilt
   die Eigenschaft jetzt. Ein Deckel gehörte in `decideOrphanedTimer` (`packages/domain`), damit
   beide Wege ihn gemeinsam bekommen; dort läuft T-364, deshalb nicht angefaßt.
3. **Das A-24-Zuordnungsfenster aus einem Archiv ist groß** (39 000 s, Abschnitt 5). Kein stiller
   Weg, aber unbewertet.
4. **Die Ausfallrichtung ohne `timerRecovery` verwirft jetzt** (M6). Für das Erzeugnis ohne Belang
   (`composition.ts` setzt das Feld), für jeden künftigen Prüffall eine Falle. Abschnitt 4 und
   Fall G.
5. **Zwei Schritte statt eines in `startTimer`.** Der Teilzustand ist ausgeschlossen (beide
   fachlichen Abweisungsgründe vorher geprüft, Speicherungsfehler wirft und rollt zurück), aber der
   heißeste Pfad der Anwendung hat eine Abzweigung mehr. Der code-reviewer sollte genau dort
   hinsehen.

---

## 11 — Offene Fragen

1. **Soll `GET /timer` einen vorgefundenen Eintrag als solchen kennzeichnen?** Heute muß die
   Oberfläche dafür eine zweite Route fragen, und sie tut es nur beim Seitenaufbau. Ein Feld
   `foundAtServiceStart: boolean` an `RunningTimerView` wäre die ehrlichste Auskunft — es ist eine
   Schnittstellenänderung und berührt `apps/web`, gehört also abgestimmt und nicht in diesen
   Auftrag.
2. **A-24 gegen E-036 bei einer eingespielten offenen Inaktivität** (Abschnitt 5). Unverändert
   offen, jetzt mit Zahlen.
3. **Soll das Einspielen den laufenden Timer melden?** Wortlaut in Abschnitt 6, Bau in
   `features/data-transfer/**`.
4. **Wollen wir den Deckel „nie nach jetzt" in `decideOrphanedTimer`?** (Risiko 2, `packages/domain`.)

---

## 12 — Vorschlag für `risks.md` (gehört dem Orchestrator)

R-34 **schließen**, und dabei richtigstellen, wie groß die Fläche wirklich war:

> **Geschlossen am 2026-09-14 (T-363), nachdem T-358 die Aufnahme beim Einspielen nachgeführt
> hatte.** `stopTimer`, `startTimer` und `touchHeartbeat` (`features/timer/timer.ts`) stellen jetzt
> dieselbe Frage wie die Anzeige: Wurde der laufende Eintrag beim Dienststart **vorgefunden**, wird
> höchstens bis zum letzten Lebenszeichen gebucht. Die Regel steht an einer Stelle
> (`foundAtServiceStart` → `bookingEndOfStop` → `decideOrphanedTimer` in `packages/domain`).
>
> **Der Restpunkt war nicht einer, sondern drei, und alle drei sind beidseitig gemessen:** der
> direkte Stopp nach dem Einspielen (39 600 → 1 200 s), derselbe Stopp nach einem **gewöhnlichen
> Absturz ohne jedes Archiv** (39 600 → 1 200 s — der Fall, für den E-036 geschrieben wurde), und
> die Verdrängung durch `POST /timer/start {stopRunning:true}` (39 600 → 1 200 s), also die
> Schaltfläche, die die Oberfläche täglich anbietet.
>
> **Dazu ein vierter Befund, ohne den die anderen drei binnen einer Minute wieder offen gewesen
> wären:** Die Oberfläche schickt für den vorgefundenen Eintrag ihr Lebenszeichen im Minutentakt
> weiter; **ein einziger Aufruf** hob `bookableSeconds` von 1 200 auf 39 600 und damit auch das
> Angebot des Verwaistendialogs. Ein vorgefundener Eintrag bekommt seit T-363 kein Lebenszeichen
> mehr (`seenAt: null`). Der Deckel aus E-036 hielt vorher nur, solange niemand die Oberfläche
> öffnete.
>
> Der gewöhnliche Fall ist unverändert und gemessen: Ein Timer dieser Sitzung bucht weiter die
> Wanduhr (39 600 s), ein 42-Sekunden-Timer 42 s, die Rückfrage aus A-6.8 steht.

---

## 13 — Nächster Schritt

1. **unit-tester, nächste Welle:** die Fälle T363-A bis H aus Abschnitt 7, zusammen mit den Fällen
   A–E aus T-358. Wichtig sind **C und F** (der gewöhnliche Fall) und **D** (das Lebenszeichen) —
   ohne sie ist die Verengung nicht gegen ein Zurückdrehen gesichert.
2. **spec-ux-reviewer:** Abschnitt 3 gegen E-036 und A-24 lesen. Die Frage ist nicht der Code,
   sondern der Satz: Darf der Verwaistendialog wachsen, solange er offen steht? Ich sage nein und
   habe es so gebaut.
3. **security-checker:** A-A-126 gegen den neuen Stand. Die drei Wege sind zu; die beiden Reste mit
   Geldbezug stehen als Risiko 2 (Lebenszeichen aus der Zukunft) und Risiko 3 (A-24-Fenster) da.
4. **frontend-dev, eigener Auftrag:** offene Frage 1 — die Oberfläche zeigt für einen
   vorgefundenen Eintrag eine Wanduhr, die niemand buchen kann.
