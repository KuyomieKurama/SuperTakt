# T-369 — Freigaberunde über T-358 und T-363 (R-34, der Geldpfad)

**Rolle:** code-reviewer. **Stand:** 2026-09-14, Welle 10. **Gegenstand:** T-358
(`features/data-transfer/data-transfer.ts`) und T-363 (`features/timer/timer.ts`,
`openapi/takt-local-api.yaml`). Ausgelassen wie beauftragt: T-359 (`apps/web/**`), T-360/T-364
(`features/version/**`).

## Urteil

| Gegenstand | Urteil | blockierender Befund |
|---|---|---|
| **T-358** | **Nacharbeit (klein)** | `data-transfer.ts:732–740` — der Absatz „Was das **nicht** deckt" behauptet seit T-363 das Gegenteil des Codes |
| **T-363** | **Nacharbeit** | `idle.ts:71` und `idle.ts:41` — zwei ungedeckelte Türen, gemessen **39 000 s** gegen **1 200 s**; dazu `timer.ts:248` — überlappende Buchung bei Lebenszeichen aus der Zukunft, gemessen **43 200 s** bei **39 600 s** Wanduhr |

**R-34 darf nicht geschlossen werden.** Der Vorschlag in T-363 Abschnitt 12 ist an den Routen
aufgespannt, die der Bericht kennt, nicht an der Anforderung (E-099 Punkt 3). Es waren nicht drei
Wege plus einer, sondern **fünf plus einer**, und zwei davon sind offen.

---

## Befunde

```
apps/local-api/src/features/timer/idle.ts:71                       hoch     beginIdle schließt bei idleKeepTimerRunning=false den laufenden Eintrag mit unit.timer.stop(note, input.startedAt), ohne foundAtServiceStart zu fragen. Auf einem beim Dienststart vorgefundenen Eintrag bucht das die Wanduhr bis zum Beginn der Inaktivität: gemessen 39 000 s, während loadOrphanedTimer für denselben Eintrag 1 200 s anbietet. Fix: denselben Deckel wie stopTimer anlegen — endsAt = min(input.startedAt, bookingEndOfStop(...)); bookingEndOfStop dafür aus timer.ts exportieren, statt die Regel ein zweites Mal zu schreiben.
apps/local-api/src/features/timer/idle.ts:41                       hoch     completeReturn trennt über unit.timer.separateIdle(running.id, pending.startedAt, …) und setzt ended_at damit auf den Beginn der Inaktivität — ebenfalls ohne foundAtServiceStart. Gemessen dieselbe Buchung 06:00 → 16:50 = 39 000 s auf einem vorgefundenen Eintrag (idleKeepTimerRunning=true, der Vorgabewert). Fix: für einen vorgefundenen Eintrag gar nicht trennen, sondern ihn über bookingEndOfStop schließen und den weiterlaufenden Timer bei pending.returnedAt neu eröffnen; ersatzweise startedAt vor separateIdle auf bookingEndOfStop deckeln.
apps/local-api/src/features/timer/timer.ts:248                     hoch     bookingEndOfStop deckelt nach unten (Lebenszeichen), aber nicht nach oben. Liegt heartbeatAt hinter der Wanduhr — Archiv von einem Rechner, dessen Uhr vorgeht —, bucht stopTimer mehr als die Wanduhr (gemessen 43 200 s bei 39 600 s), und startTimer erzeugt eine geschlossene Buchung 06:00 → 18:00 neben einem neuen laufenden Eintrag ab 17:00: eine Stunde doppelt belegt und ein Ende in der Zukunft. Die Überlappung ist neu mit T-363 (HEAD schloss immer bei „jetzt"). Fix hier: `return decision.entry.endedAt < wallClock ? decision.entry.endedAt : wallClock;`. Richtiger Ort ist decideOrphanedTimer in packages/domain mit einem now-Parameter, damit der Dialogweg denselben Deckel erbt — dort läuft T-364, also nächste Welle.
apps/local-api/src/features/data-transfer/data-transfer.ts:732     mittel   Der Absatz „Was das **nicht** deckt" sagt „stopTimer fragt foundAtServiceStart nicht … ein direkter POST /timer/stop bucht gemessen 39 600 s — auch mit dieser Klammer". Seit T-363 bucht er 1 200 s (selbst nachgemessen). Ein Satz über eine Lücke, die zu ist, ist derselbe Fehler wie ein Satz über eine Handlung, die es nicht gibt (CLAUDE.md, E-100). Fix: den Absatz durch den Stand ersetzen — gedeckelt sind Stopp, Verdrängung und Lebenszeichen; offen sind die beiden idle.ts-Türen oben.
apps/local-api/src/features/timer/timer.ts:422                     mittel   throw new Error(`… (${result.error.code})`) rollt die Klammer richtig zurück, aber der Text erreicht niemanden: app.onError protokolliert ausschließlich „Unerwarteter Fehler in POST /timer/start" und wirft error.message weg. Im einzigen Fall, in dem diese Zeile je feuert, steht der Grund nirgends. Fix: das Muster aus derselben Merkmalsmappe nehmen — eine Fehlerklasse wie IdleWriteFailure (idle.ts:20) tragen, außerhalb der Klammer nach err(problem) zurückwandeln; der Aufrufer bekommt dann den echten Code statt internal_error, und der Rückbau bleibt erhalten.
apps/local-api/src/features/timer/timer.ts:600                     mittel   unit.timer.stop(note, endsAt) schreibt updated_at = endsAt (repo-time.ts:455). Eine um 17:00 geschriebene Buchung trägt damit updated_at = 06:20 — gemessen. Die Zeile behauptet, elf Stunden vor ihrem Schreibvorgang zuletzt angefasst worden zu sein; dasselbe gilt für startTimer:408 und bei einer vorgehenden Fremduhr sogar in die Zukunft. Fix: TimerPort.stop einen getrennten Parameter für die Wanduhr geben (stop(note, endsAt, now)) und updated_at daraus schreiben; ended_at bleibt endsAt.
packages/storage/src/sqlite/unit-of-work.ts:236                    mittel   Die eine Klammer aus T-358 hält nur, weil inTransaction `next` zurückgibt und `queue = next.then(...)` eine Ableitung davon ist: die Fortsetzung hinter dem await des Einspielens läuft dadurch garantiert vor der nächsten gereihten Transaktion. An dieser Reihenfolge hängt seit T-358 die Zuweisung von timerRecovery.entryId und damit Geld — sie steht aber in keiner Zeile Text und in keinem Prüffall. Wer hier `return queue` schriebe, öffnete das Fenster wieder, ohne dass etwas rot würde. Fix: zwei Sätze an inTransaction, die die Zusage benennen, plus den Prüffall aus T-358 Abschnitt 8 Fall E um einen nebenher gereihten Leser erweitern.
apps/local-api/src/features/data-transfer/data-transfer.ts:744     mittel   `(await unit.timer.running())?.id ?? null` steht jetzt zweimal wörtlich: hier und in captureTimerRecovery (timer.ts:142). Die Regel „was heißt verwaist" ist richtigerweise nicht abgeschrieben, aber die Invariante „timerRecovery.entryId ist der offene Eintrag, der vorgefunden wurde" hat seit T-358 zwei Schreiber in zwei Merkmalen. Fix: in timer.ts eine exportierte `runningEntryId(unit: UnitOfWork)` anlegen, die captureTimerRecovery und data-transfer.ts gemeinsam rufen; die Zuweisung bleibt in beiden Fällen hinter dem await.
apps/local-api/src/features/timer/timer.ts:248                     niedrig  Der Ausgang „verwerfen" wird als Zeitstempel verschlüsselt: running.startedAt zurückgeben, damit decideTimerStop im Port die Dauer 0 rechnet und die Zeile löscht. Das ist richtig, aber nur über zwei Dateien lesbar. Fix: `{ kind: 'book'; at: Timestamp } | { kind: 'discard' }` zurückgeben und in stopTimer/startTimer auswerten.
apps/local-api/src/features/timer/timer.ts:149                     niedrig  „Bis T-350 stand sie zweimal wörtlich in einer if-Bedingung" — an HEAD steht sie noch zweimal (loadOrphanedTimer, resolveOrphanedTimer); herausgezogen hat sie erst T-363. Fix: T-350 durch T-363 ersetzen.
apps/local-api/openapi/takt-local-api.yaml:2278                    niedrig  Der 409 an /timer/stop nennt jetzt timer_not_running und conflict — richtig. Nicht genannt ist, dass POST /timer/start seit timer.ts:422 einen 500 internal_error erzeugen kann, wo vorher ein fachlicher Fehler stand. Fix: entfällt, wenn timer.ts:422 auf das IdleWriteFailure-Muster umgestellt wird; sonst dort dokumentieren.
```

**Hinweis, kein Befund dieser Freigabe** (fremde Hoheit, `apps/web/**` baut in dieser Welle):
`apps/web/src/features/timer/api.ts:207` tippt die Antwort von `POST /timer/heartbeat` als
`{ seenAt: Timestamp }`. `null` war dort schon vor T-363 möglich („kein Timer läuft") und ist seit
T-363 der zweite Regelfall. Gehört an frontend-dev, nicht in diesen Auftrag.

---

## Die drei Prüffragen des Auftrags

### 1 — Trägt die eine Klammer, oder trug sie nur die Meßbedingungen?

**Sie trägt — und ich habe es nachgefahren, nicht übernommen.** Eigener Lauf über den echten
`exportDataArchive` → `importDataArchive` (Archiv mit 2 001 Todos, Zieluhr elf Stunden voraus),
17 nebenher abgeschickte `GET /timer/orphaned` (eines sofort, acht `setImmediate`, acht
`setTimeout`): **17 von 17 sahen `bookableSeconds = 1200`, 0 sahen einen laufenden Timer.**

**Der Weg zurück in zwei Klammern existiert, und er liegt nicht in `data-transfer.ts`.** Die
Zuweisung `context.timerRecovery.entryId = timerAfterImport` steht **hinter** dem `await` und
damit formal außerhalb der Transaktion; dass trotzdem kein Leser dazwischen gerät, liegt allein an
`unit-of-work.ts:236/246` (`return next` bei `queue = next.then(...)`). Das ist eine Zusage einer
**anderen Datei**, die dort nirgends als Zusage steht. Siehe Befund `unit-of-work.ts:236`.

Die Anordnung innerhalb der Klammer selbst ist richtig gewählt: die Zuweisung im Callback
vorzunehmen wäre falsch, weil ein Fehlschlag beim `COMMIT` den Bestand zurückrollt und die
Aufnahme auf einen Eintrag zeigen ließe, den es nicht gibt — und das ist die teure Richtung.

### 2 — Die drei Wege plus der vierte: sind es alle?

**Nein.** An der Anforderung aufgespannt („eine beim Start vorgefundene Buchung wird höchstens bis
zum letzten Lebenszeichen gebucht") ist die Menge die der Stellen, an denen aus einem offenen
Eintrag eine Buchung wird. Vollständig, gemessen über `grep` auf `timer.stop|timer.start|separateIdle`:

| # | Stelle | vorgefundener Eintrag | Stand |
|---|---|---|---|
| 1 | `timer.ts:600` `stopTimer` | 1 200 s | **gedeckelt (T-363)** |
| 2 | `timer.ts:408` `startTimer` verdrängt | 1 200 s | **gedeckelt (T-363)** |
| 3 | `timer.ts:739/765` `resolveOrphanedTimer` | 1 200 s | gedeckelt (E-036) |
| 4 | `timer.ts:661` `touchHeartbeat` hebt den Deckel | kein Schreibvorgang | **gedeckelt (T-363)** |
| 5 | `idle.ts:71` `beginIdle`, Pause aus | **39 000 s** | **offen** |
| 6 | `idle.ts:41` `separateIdle` bei der Rückkehr, Pause an (Vorgabe) | **39 000 s** | **offen** |

Eigene Messung, alle vier Fälle im selben Aufbau (T0 = 06:00, Lebenszeichen 06:20, Zieluhr 17:00,
Inaktivität ab 16:50):

```
1  POST /timer/stop                       Dialog bietet 1200 s  →  gebucht 06:00 → 06:20 =  1200 s
2  POST /timer/start {stopRunning:true}   Dialog bietet 1200 s  →  gebucht 06:00 → 06:20 =  1200 s
3  POST /timer/idle/begin, Pause aus      Dialog bietet 1200 s  →  gebucht 06:00 → 16:50 = 39000 s
4  idle/begin + idle/return, Pause an     Dialog bietet 1200 s  →  gebucht 06:00 → 16:50 = 39000 s
```

**Ohne Zutun des Benutzers erreichbar.** `useIdleTimer` (`apps/web`) schickt `beginIdleSession`
selbsttätig im 2-Sekunden-Takt, sobald `GET /timer` einen laufenden Timer meldet und die native
Inaktivität die Schwelle überschreitet — und `GET /timer` meldet den vorgefundenen Eintrag als
laufend (T-363 Annahme 1, ausdrücklich so gewollt). Der einzige Schutz ist
`blocked: … || orphan !== null` in `TimerContext.tsx:176` — also wieder ein Schutz in der
**Anzeige**, und genau der greift im Fall, für den T-358 gebaut wurde, nicht: Nach einem
Einspielen im laufenden Betrieb steht `orphan` auf `null`, weil die Oberfläche
`GET /timer/orphaned` nur beim Seitenaufbau holt. Einspielen, weggehen, wiederkommen — und die
Buchung steht auf elf Stunden.

Das ist dieselbe Sorte Befund, die T-363 an `stopTimer` behoben hat: zwei Zahlen für denselben
Eintrag, und welche in der Abrechnung landet, entscheidet der Weg durch die Oberfläche.

### 3 — `context.timerRecovery` bleibt optional: die `undefined`-Abzweigung in jeder Richtung

Die Entscheidung aus T-363 Abschnitt 4 ist **richtig, und die Begründung trägt**:

- `foundAtServiceStart` (`timer.ts:177`) fällt bei fehlendem Feld auf „verwaist" — die **billige**
  Richtung. Nachgesehen: Ein Pflichtfeld erzwänge das Streichen des `=== undefined`-Vergleichs
  (TS2367) und drehte damit die Ausfallrichtung auf die Wanduhr. Der Kommentar an `timer.ts:164`
  sagt das und ist zutreffend.
- Die einzige getippte Bildungsstelle ist `composition.ts:172` und setzt `{ entryId: null }`
  (nachgesehen, kein zweiter Bildungsort in `src/`).
- `main.ts:293` ruft `captureTimerRecovery` **vor** dem HTTP-Start; ein Wurf dort bricht den Start
  ab (`await main()` am Modulkopf von `index.ts`), es läuft also kein Dienst mit einer halben
  Aufnahme. Das ist die sichere Richtung.
- `data-transfer.ts:746` überspringt die Zuweisung bei fehlendem Feld ohne Wurf und ohne zweiten
  Zweig — dieselbe Richtung.

**Kein stiller Rückfall auf den alten Weg gefunden.** Ein Punkt bleibt und gehört in die Vorgabe
für den unit-tester, nicht in einen Befund: In einem Zusammenhang **ohne** `timerRecovery` schreibt
seit T-363 auch `touchHeartbeat` nichts mehr, weil `foundAtServiceStart` dort immer wahr ist — ein
Stopp verwirft dann (T-363 M6). Für das Erzeugnis ohne Belang, für jeden von Hand gebauten
Prüfzusammenhang eine Falle; T-363 Abschnitt 7 Fall G hält sie richtigerweise fest.

---

## Was ich geprüft und nicht beanstandet habe

- **Verschluckte Fehler.** Kein leeres `catch`, kein stilles `null` als Fehlerersatz auf den
  geänderten Wegen. `startTimer` prüft beide fachlichen Abweisungsgründe (`before !== null`,
  `idle.pending()`) **vor** dem Schließen; `unit.timer.start` prüft in derselben Reihenfolge
  (`repo-time.ts:388 ff.`: offene Inaktivität, Todo, laufender Timer), der Teilzustand ist damit
  ausgeschlossen. Einziger Rest: der weggeworfene Grund im Wurf (Befund `timer.ts:422`).
- **Transaktionsgrenzen.** Schließen und Starten liegen in derselben Klammer; ein zurückgegebener
  Fehler rollt nicht zurück, ein Wurf schon — die Änderung nutzt beides richtig. Das Einspielen
  schreibt und liest in **einer** Klammer; ein ungültiges Archiv kommt vor der Klammer zum Halten
  (`parseArchive`), ein Wurf übergeht die Zuweisung.
- **Typsicherheit.** Kein `any`, keine neue Typzusicherung in beiden Änderungen. `pnpm typecheck`
  über 8 Projekte plus Prüf- und E2E-Konfigurationen: **Exit 0**.
- **Doppelte Fachlogik.** Die Regel „was heißt verwaist" steht einmal (`foundAtServiceStart`), die
  Regel „was folgt daraus" einmal (`decideOrphanedTimer`, `packages/domain`). `bookingEndOfStop`
  entscheidet nichts selbst. Die Rundung ist unberührt — gerundet wird weiterhin ausschließlich im
  Export. Einzige Abschrift: die Aufnahmezeile (Befund `data-transfer.ts:744`).
- **Schichten.** Kein HTTP und kein SQL in der Fachlogik; `proof:layers` 36/0, `proof:callers`
  74/0, `pnpm boundaries` grün über 528 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt".
- **Dateihoheit.** Beide Arbeiten haben nur in domain-dev-Dateien geschrieben
  (`features/timer/timer.ts`, `features/data-transfer/data-transfer.ts`,
  `openapi/takt-local-api.yaml`). Die Meßkopien aus T-363 sind gelöscht; `git status` zeigt aus
  beiden Händen nichts Fremdes.
- **Sprache.** Bezeichner englisch, Prosa und Oberflächentexte deutsch. Die OpenAPI-Korrektur
  („monotone Messung" → Differenz zweier UTC-Zeitstempel) ist belegt: `monotonicSeconds` wird von
  keiner Stelle des Timers gerufen (nachgesehen). Beschreibung an den Code anzugleichen statt
  umgekehrt ist hier richtig.
- **A-24.7.** Die Aufnahme ist weiterhin eine Beobachtung im Arbeitsspeicher, die bei jedem Start
  aus SQLite neu gewonnen wird; der offene Eintrag selbst liegt im Bestand. Kein Verstoß.
- **A-20.4.** Der Round-Trip ist unberührt — die Änderung fügt der Klammer eine **Lesung** hinzu,
  keinen Schreibvorgang.

---

## Läufe (selbst gefahren, mit Zahl)

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` (8 Projekte + Prüf-/E2E-Konfigurationen) | **Exit 0** |
| `vitest run apps/local-api/test` | **352 grün**, 2 übersprungen, 0 rot, 5,69 s |
| `vitest run packages/{domain,storage,export}/test` | **1 283 grün**, 0 rot, 53 Dateien |
| `pnpm boundaries` | grün, 528 Quelldateien |
| `pnpm -C apps/local-api proof:openapi` | **115 bestanden, 0 fehlgeschlagen** |
| `pnpm -C apps/local-api proof:layers` | **36 bestanden, 0 fehlgeschlagen** |
| `pnpm -C apps/local-api proof:callers` | **74 bestanden, 0 fehlgeschlagen** |
| Eigene Messung: 17 nebenläufige Leser gegen den echten `importDataArchive` (2 001 Todos) | **17/17 sahen `bookableSeconds = 1200`**, 0 sahen einen laufenden Timer |
| Eigene Messung: vier Türen im selben Aufbau | Stopp **1 200 s**, Verdrängung **1 200 s**, `idle/begin` **39 000 s**, `idle/return` **39 000 s** |
| Eigene Messung: Lebenszeichen aus der Zukunft (Quelluhr +1 h) | Stopp bucht **43 200 s** bei **39 600 s** Wanduhr; `startTimer` erzeugt 06:00 → **18:00** neben laufendem Eintrag ab 17:00 |
| Eigene Messung: `updated_at` nach gedeckeltem Stopp | geschrieben um 17:00, `updated_at = 06:20` |

**Nicht gefahren:** `proof:access`, `proof:export-api`, `proof:conflicts` (binden 17843/17844 —
frei, aber außerhalb dieses Auftrags), `pnpm check` als Ganzes, `pnpm test:e2e`. Nichts davon ist
hier als grün gemeldet.

Meßskripte lagen im Kritzelverzeichnis der Sitzung, nicht im Bestand; kein Produktivcode
angefasst, keine Datei außer dieser geschrieben.

---

## Nächster Schritt

1. **domain-dev, ein Auftrag in `features/timer/**`:** die beiden Türen in `idle.ts` (Befunde 1
   und 2) und der Deckel nach oben in `bookingEndOfStop` (Befund 3). Alle drei hängen an derselben
   Funktion und gehören zusammen. **Nicht gleichzeitig mit einem unit-tester auf
   `apps/local-api/test/usecases/idle.test.ts`** — es ist derselbe Schnittstellenumbau wie
   T-315/T-316.
2. **Derselbe Auftrag oder ein kleiner daneben:** `data-transfer.ts:732–740` richtigstellen,
   `timer.ts:422` auf das `IdleWriteFailure`-Muster umstellen, die Aufnahmezeile
   zusammenführen, `timer.ts:149` umdatieren.
3. **Orchestrator, `risks.md`:** R-34 **nicht** schließen. Vorschlag: den Stand aus T-363
   übernehmen, aber den Satz „die drei Wege sind zu" ersetzen durch „vier von sechs Türen sind zu;
   offen sind `beginIdle` und `separateIdle` in `features/timer/idle.ts`, gemessen 39 000 s gegen
   1 200 s". Schwere bleibt **hoch**, weil der offene Weg ohne jedes Zutun eines Angreifers und
   ohne Handlung des Benutzers am Dialog vorbei zustandekommt.
4. **`packages/domain` (nach T-364):** der Deckel „nie nach jetzt" in `decideOrphanedTimer`, damit
   Dialogweg und Stoppweg ihn gemeinsam erben.
5. **unit-tester, nächste Welle:** die Fälle aus T-358 Abschnitt 8 und T-363 Abschnitt 7 —
   ergänzt um zwei Fälle für die idle-Türen (vorgefundener Eintrag, `beginIdle` mit und ohne
   Pausenoption, erwartet 1 200 s) und um den nebenläufigen Leser aus Prüffrage 1.
6. **security-checker:** A-A-126 gegen diesen Stand, mit den beiden offenen Türen als benanntem
   Rest.
