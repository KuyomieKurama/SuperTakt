# T-350 — Die drei roten Timer-Fälle, und was sie über „verwaist" sagen

**Rolle:** domain-dev. **Stand:** 2026-09-13, Welle 8.

## Status

**Fertig.** Die Verengung ist **richtig**. Die drei Prüffälle messen einen Zustand, den die
Anwendung ausdrücklich nicht mehr herstellt — Befund samt fertigem Rezept unten, Abschnitt 5.
Die Regel in `timer.ts` ist **verhaltensgleich geblieben** (gemessen, Abschnitt 6). Nebenbefund
mit eigener Messung: die Verengung hat **eine Lücke**, und sie liegt nicht dort, wo der Auftrag
sie vermutet hat (Abschnitt 4).

## Artefakte

- `apps/local-api/src/features/timer/timer.ts` — Begründung am Quelltext (was „verwaist" heißt,
  warum das kein A-24.7-Widerspruch ist, die bekannte Lücke), und die Regel steht jetzt als
  **eine** benannte Funktion `foundAtServiceStart` statt zweimal wörtlich in einer `if`-Bedingung.
  **Kein Verhaltenswechsel.**
- `docs/datenmodell.md` — ein Absatz bei `timer_heartbeat`: „ohne Ende" und „verwaist" sind nicht
  dasselbe, und was das Schema an dieser Frage nicht beantwortet.
- `.claude/team/reports/T-350-domain-dev.md` — dieser Bericht.

Nicht angefaßt: `tests/**`, `packages/**`, `apps/web/**`, `apps/local-api/src/features/version/**`,
`apps/local-api/scripts/**`.

## 1 — Die Frage, und die Antwort

**Die Verengung ist richtig.** Sie ist nicht eine nachträgliche Verschärfung von E-036, sondern
dessen erste tatsächliche Umsetzung.

Der Wortlaut ist in drei Papieren derselbe und war nie strittig:

- E-036: „Beim nächsten **Start** erkennt Takt die verwaiste Buchung."
- `packages/domain/src/time-entry.ts`, `decideOrphanedTimer`: „Verwaist ist eine Buchung ohne
  Ende, die **beim Start der Anwendung** vorgefunden wird: Absturz, Abmeldung, Stromausfall."
- `packages/storage/src/ports.ts`, `TimerHeartbeatPort.orphaned()`: „Die beim **Start**
  vorgefundene, unvollständige Buchung."

Gemessen wurde dieser Satz bis zum 2026-09-09 **nirgends**. `orphaned()` liefert jede Zeile mit
`ended_at IS NULL` — und weil `ux_time_entry_running` höchstens eine solche Zeile zuläßt (A-6.8),
ist das **immer genau der gerade laufende Timer**. Die Abfrage beantwortete die Frage „ist etwas
abgestürzt?" also mit dem Timer, den der Benutzer in diesem Moment sichtbar laufen sieht. Der
Kommentar am Port sagte seit jeher etwas zu, was seine Abfrage nicht einlöst; `captureTimerRecovery`
löst es ein. Das ist keine zusätzliche Bedingung — das ist die Bedingung.

## 2 — „Kann beides zugleich gelten?" — Ja, und so

Der Auftrag fragt, ob eine Bedingung am **Startzeitpunkt des Prozesses** neben einer Anforderung
stehen kann, die verlangt, daß offene Phasen einen Neustart überleben (A-24.7, CLAUDE.md: „in
SQLite, nicht im Arbeitsspeicher"). Sie kann, und der Grund ist eine Unterscheidung:

**`timerRecovery.entryId` ist kein Zustand, sondern eine Beobachtung.** Gespeicherter Zustand ist
etwas, das verlorengeht, wenn der Prozeß stirbt. Dieser Wert geht nicht verloren — er wird bei
**jedem** Start aus SQLite neu gewonnen (`captureTimerRecovery` liest `unit.timer.running()`), und
zwar mit demselben Ergebnis, weil er aus derselben Zeile stammt. Der offene Eintrag selbst liegt
im Bestand und überlebt alles. Die Frage „lag er schon da, als ich hochkam?" kommt nach einem
Neustart nicht abhanden; sie **entsteht** dort überhaupt erst.

**Die Vermutung des Auftrags ist damit widerlegt, nicht abgewogen.** „Ein Timer, der über einen
Neustart des Dienstes hinweg läuft, wäre nach der Verengung nicht mehr verwaist" — das Gegenteil
ist der Fall: Genau dieser Eintrag ist der, den `captureTimerRecovery` aufnimmt. Gemessen in
Abschnitt 3, zweimal, auf zwei Wegen.

**Die Trennlinie zwischen E-036 und A-24 ist „hat der Prozeß überlebt?"**

| Prozeß | Anforderung | Erkennung | Ausgang |
|---|---|---|---|
| tot | E-036 | Aufnahme beim Start | bis zum letzten Lebenszeichen buchen oder verwerfen |
| lebt | A-24 | systemweite Inaktivität, `timer_idle` in SQLite | Abwesenheit vorgemerkt, Timer läuft weiter, Rückkehr schließt ab |

Ohne die Verengung beanspruchen **beide** Mechanismen denselben Eintrag, und der Benutzer bekommt
zwei Dialoge über denselben Sachverhalt. Genau das war der Anlaß des Eingriffs — der Commit heißt
`Fix idle recovery dialog conflicts`.

## 3 — Messungen (jede echt gefahren, mit Zahl)

**M1 — in einem Prozeß, ohne HTTP** (`openDatabase` + die Anwendungsfälle direkt, temporärer
Bestand, node 22.23.2):

| Fall | Frage | Ergebnis |
|---|---|---|
| A | Timer derselben Dienstsitzung → verwaist? | **false** |
| B | derselbe Bestand, **neuer** Prozeß, Eintrag aus Lauf 1 → verwaist? | **true**, `bookableSeconds` = 1 200 bei 36 000 s Wanduhr |
| C | mitten im Lauf **eingespieltes** Archiv mit offenem Eintrag → verwaist? | **false** — siehe Abschnitt 4 |

**M2 — echter Dienst auf 17843, echter `kill -9`, echter Neustart, derselbe Bestand** (eigenes
Anwendungsdatenverzeichnis unter dem Kratzverzeichnis, `main({ releaseSource })` ohne Verbindung
nach außen, wie `proof-access-entry.ts`):

```
A) GET /timer/orphaned im SELBEN Lauf:          {"data":null}
B) GET /timer/orphaned nach ECHTEM Neustart:    {"data":{"running":{…},"todoTitle":"M2-Verwaist",
                                                 "heartbeatAt":"…:03Z","bookableSeconds":2}}
C) POST /timer/orphaned/resolve {book_until_heartbeat}:
                                                {"kind":"recorded","entry":{…,"durationSeconds":2,
                                                 "exportStatus":"open"},"poolMovement":{…}}
D) danach GET /timer/orphaned:                  {"data":null}
```

E-036 ist also **vollständig da**: erkannt, auf das letzte Lebenszeichen gedeckelt (2 s statt
Wanduhr), gebucht, und danach ist die Frage weg. Ports vor und nach jedem Lauf gemessen
(`ss -ltn`): 17843, 17844 und 5173 frei, keine Waisenprozesse.

## 4 — Nebenbefund mit eigener Messung: die Lücke liegt woanders

Die Aufnahme geschieht **einmal** und wird nicht nachgeführt. Das trägt, solange offene Einträge
ausschließlich durch `unit.timer.start` entstehen — und in diesem Merkmal ist das so (gezählt:
`startTimer` in `timer.ts`, `resolveIdle`/`returnFromIdle` in `idle.ts`, sonst nirgends im
Bestand).

Es gibt aber einen **zweiten Eingang**: `dataArchive.replaceAll` aus `POST /data-transfer/archive`
(A-20). `DATA_ARCHIVE_TABLES` führt `time_entry` **und** `timer_heartbeat`; ein Archiv, das bei
laufendem Timer erzeugt wurde, trägt einen Eintrag **ohne Ende** mit, und der landet mitten im Lauf
im Bestand, ohne daß jemand noch einmal hinsieht.

**Gemessen (M1 Fall C, über den echten Anwendungsfall `exportDataArchive` → `importDataArchive`):**

- der eingespielte offene Eintrag gilt **nicht** als verwaist (`GET /timer/orphaned` → `null`,
  `resolve` → `timer_not_running`),
- er zeigt sich statt dessen als **laufender Timer** seit dem Startzeitpunkt des Quellrechners,
- ein Stopp buchte **39 600 s Wanduhr** statt der **1 200 s** bis zum mitgereisten Lebenszeichen.

Das ist wörtlich der Schaden, gegen den E-036 gebaut wurde („ein über Nacht vergessener Timer
bucht vierzehn Stunden, und nach der Aufrundung aus E-008 landet das in einer Rechnung"), und es
ist zugleich die Stelle, an der A-24.7s „überleben … Datensicherung" heute halb eingelöst ist: Die
Zeile reist mit, ihre Einordnung nicht.

**Behoben habe ich das nicht**, und zwar aus zwei Gründen, nicht aus einem: Die Behebung ist ein
**Wechsel der Polarität** — aufnehmen, was *dieser* Lauf gestartet hat, statt was er vorgefunden
hat; verwaist ist dann alles andere Offene. Das ist die exakte Regel (keine Heuristik über
Zeitstempel), sie schließt die Lücke ohne Zusatzabfrage, und sie dreht die Ausfallrichtung von
„im Zweifel weiterzählen" auf „im Zweifel fragen", was die E-036-konforme Richtung ist. Sie faßt
aber `context.ts`, `composition.ts`, `main.ts`, `timer.ts`, `idle.ts` **und** einen fremden
Prüffall an (`apps/local-api/test/usecases/idle.test.ts` nennt `captureTimerRecovery` beim Namen
und prüft `timerRecovery.entryId` auf Gleichheit) — Umbau und Messung gehören nach CLAUDE.md in
aufeinanderfolgende Wellen, und der Auftrag hat mich auf `features/timer/**` gestellt. Vorschlag
als eigener Auftrag unten.

## 5 — Für den e2e-tester: welcher Fall künftig welche Frage stellt

Die drei Fälle in `tests/e2e/timer-stop-announcement.spec.ts` prüfen **Auskunft**, nicht
**Erkennung**: den Bewegungssatz am Toast, `orphan_discarded` gegen `timer_too_short`, die beiden
Wortlaute. Sie brauchen einen verwaisten Timer nur als Vorrichtung. Ihre Vorrichtung ist seit dem
2026-09-09 ungültig, und der Satz, auf den sie sich beruft, steht wörtlich im Prüffall selbst:
„`loadOrphanedTimer` meldet **jeden** zum Zeitpunkt des Ladens unvollständigen Eintrag als
verwaist". Das galt, war aber die Fehlfassung — kein Prüffall kann diesen Zustand künftig über
die rohe API herstellen, gleich wie er geschrieben ist.

**Die neue Vorrichtung ist ein echter Prozeß-Neustart nach dem Anlegen des Eintrags**, dieselbe
Bauform wie `attachment-persistence-live.spec.ts` (`services.ts#restartLocalApi`, eigene
Ausführungskonfiguration, weil ein Neustart mitten in der geteilten Reihe jedem Nachbarfall den
Dienst unter den Füßen wegzöge). Die Einschätzung aus T-345 Abschnitt 5 ist damit bestätigt, und
zwar gemessen statt vermutet: **Alle drei Ausgänge sind über diesen Weg herstellbar**, hier gegen
den heutigen Dienst gefahren.

| Fall | Vorrichtung | gemessene Antwort des Dienstes |
|---|---|---|
| `:216` `recorded` + Bewegungssatz | Todo + Pool anlegen, `startTimer`, **≥ 1 s warten**, `touchTimerHeartbeat`, **Dienst neu starten**, dann erst navigieren | `{"kind":"recorded","entry":{…,"durationSeconds":2,"exportStatus":"open"},"poolMovement":{…}}` |
| `:316` `orphan_discarded` | dasselbe, dann im Dialog **„Verwerfen"** | `{"kind":"discarded","reason":"orphan_discarded","poolMovement":null}` |
| `:368` `timer_too_short` | Todo anlegen, `startTimer`, **kein zusätzliches Lebenszeichen, keine Wartezeit**, **Dienst neu starten** | `GET /timer/orphaned` → `bookableSeconds: 0`; `resolve {book_until_heartbeat}` → `{"kind":"discarded","reason":"timer_too_short","poolMovement":null}` |

Drei Dinge, die beim Schreiben Zeit sparen, alle gemessen:

1. **„Kein Lebenszeichen" gibt es nicht.** `startTimer` schreibt selbst sofort das erste
   (`timer.ts`, E-036: sonst verwürfe ein Neustart unmittelbar nach dem Start die Buchung). Nach
   dem Neustart steht deshalb `heartbeatAt === startedAt` und `bookableSeconds: 0` — genau das
   trägt den `timer_too_short`-Fall. Der heutige Kommentar im Prüffall („Kein Lebenszeichen")
   beschreibt das Ergebnis richtig und den Mechanismus falsch.
2. **Die Reihenfolge ist Inhalt.** Der Neustart muß **nach** dem Lebenszeichen und **vor** der
   ersten Navigation der Seite liegen. Vorher genügt nicht, nachher ist zu spät.
3. **Der Dialog erscheint erst bei der ersten Navigation** einer frischen Seite
   (`TimerProvider`s Einmal-Abfrage `GET /timer/orphaned`) — das bleibt, wie es war.

**Was ich ausdrücklich nicht gebaut habe:** eine Tür, über die ein Prüffall den Zustand ohne
Neustart herstellen könnte. Ein Prüfpfad in den Dienst ist ein Eingang in die Vertrauensgrenze,
und er wäre hier der zweite Weg zu einer Regel, die es nur einmal geben darf.

## 6 — Was ich an `timer.ts` geändert habe, und was nicht

**Nicht geändert:** die Regel. Der Ausdruck ist logisch identisch
(`!foundAtServiceStart(…)` gegenüber `timerRecovery !== undefined && entryId !== id`), beide
Aufrufstellen unverändert im Ablauf.

**Geändert:** die Regel hat einen Namen und steht an einer Stelle statt zweimal wörtlich in einer
längeren `if`-Bedingung; darüber steht, was sie sagt, warum sie am Prozeßstart hängt, warum das
A-24.7 nicht bricht, und wo ihre Lücke ist. Der einzige Kommentar dazu war bis heute eine
englische Zeile („Capture once before serving requests: only a timer from the previous run is
orphaned") — sie ist wahr und hat drei End-zu-Ende-Fälle nicht davor bewahrt, gegen die alte
Fassung zu messen.

**Nachweise, alle echt gefahren:**

| Lauf | Ergebnis |
|---|---|
| `vitest run apps/local-api/test/usecases/idle.test.ts timer-orphan-resolution.test.ts` **vorher** | 27/27 grün, 1,05 s |
| dieselben **nachher** | 27/27 grün, 1,01 s |
| `vitest run apps/local-api/test` | **349 grün, 2 übersprungen, 0 rot**, 5,73 s |
| `pnpm typecheck` (alle 8 Projekte + Prüf- und E2E-Konfigurationen) | **0 Fehler** |
| `pnpm -C apps/local-api proof:layers` | 36 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:callers` | 74 bestanden, 0 fehlgeschlagen |
| `pnpm -C apps/local-api proof:conflicts` | 154 bestanden, 0 fehlgeschlagen |
| M1 vor und nach dem Eingriff | zeichengleiche Ausgabe (A false, B true/1 200, C false/39 600) |
| M2 vor und nach dem Eingriff | zeichengleiche Ausgänge (null / verwaist / recorded / null) |

`pnpm test:e2e` habe ich **nicht** gefahren — die drei Fälle bleiben rot, bis der e2e-tester ihre
Vorrichtung erneuert, und ein Lauf gegen eine Vorrichtung, von der ich gerade nachgewiesen habe,
daß sie nicht mehr trägt, hätte nichts gemessen.

## Annahmen

- **Die Verengung gilt, der Prüffall weicht.** Das ist die inhaltliche Entscheidung dieses
  Auftrags, getroffen aus drei übereinstimmenden Papierstellen plus zwei Messungen — nicht aus
  der Tatsache, daß der Code heute so aussieht.
- **Die Lücke aus Abschnitt 4 melde ich, statt sie mit einer Heuristik zuzuhalten.** Ein
  Vergleich „Startzeitpunkt des Eintrags liegt vor dem Start des Dienstes" hätte sie in der
  Praxis geschlossen, wäre aber bei Uhrenversatz zwischen zwei Rechnern falsch — und eine
  Abrechnungsregel, die auf fremde Uhren baut, ist keine Regel.
- **Der Absatz in `docs/datenmodell.md` fällt in meine Hoheit** (Rollentabelle), auch wenn der
  Auftrag nur `features/timer/**` nennt. Er sagt nichts Neues, sondern hält fest, was das Schema
  an dieser Frage **nicht** beantwortet — die Stelle, an der drei Prüffälle das Gegenteil
  angenommen haben.

## Risiken

- **Die Lücke ist offen** (Abschnitt 4). Wer eine Datensicherung einspielt, die bei laufendem
  Timer erzeugt wurde, bekommt einen Eintrag, den der Dienst bis zum nächsten Neustart für einen
  laufenden Timer hält — mit Wanduhr statt Lebenszeichen als Deckel. Gemessen 39 600 s gegen
  1 200 s. Kein Datenverlust, aber eine mögliche Falschbuchung, und sie geht in den Export.
- **Die Verengung ist abschaltbar, indem man ein Feld vergißt.** `AppContext.timerRecovery` ist
  optional; fehlt es, gilt wieder jeder offene Eintrag als verwaist. Im Erzeugnis setzt
  `composition.ts` es im einzigen Zweig, in dem überhaupt ein `AppContext` entsteht — die Lage
  ist heute sicher, aber sie hängt an einer Gewohnheit statt am Typ. Ein Pflichtfeld daraus zu
  machen dreht das Verhalten der von Hand gebauten Prüfzusammenhänge stillschweigend um (aus
  „alles verwaist" würde „nichts verwaist"); das gehört gemessen, nicht nebenbei geändert.
- **Zwei Stellen sagen weiterhin etwas zu, was sie nicht einlösen**:
  `packages/storage/src/ports.ts` (`TimerHeartbeatPort.orphaned()`, „die beim Start vorgefundene
  … Buchung") und `packages/storage/src/sqlite/repo-time.ts` (derselbe Satz über der Abfrage).
  Beide liefern **jeden** offenen Eintrag. `packages/**` war mir in diesem Auftrag ohne Rückfrage
  verwehrt — der Wortlaut, der stimmen würde, wäre „**jede** unvollständige Buchung; **ob** sie
  verwaist ist, entscheidet der Anwendungsfall (`foundAtServiceStart`)". Genau dieser falsche Satz
  ist im Prüffall zitiert und hat ihn dort festgehalten.

## Offene Fragen

1. **Wer behebt die Archiv-Lücke?** Vorschlag: ein Auftrag „Polarität der Timer-Aufnahme"
   für domain-dev in einer Welle, in der niemand sonst `apps/local-api/src/context.ts`,
   `composition.ts`, `main.ts` oder `features/timer/**` anfaßt — und der unit-tester in der
   **darauffolgenden**, weil `apps/local-api/test/usecases/idle.test.ts`
   `captureTimerRecovery` beim Namen nennt.
2. **Darf ich die zwei Kommentare in `packages/storage` richtigstellen?** Reine Prosa, kein
   Verhalten, zwei Dateien. Sie sind die Quelle des Mißverständnisses und bleiben sonst als
   Falle liegen.
3. **Der Auftrag für die drei E2E-Fälle** braucht weiterhin eine Zeile in `package.json`
   (Orchestrator) plus `playwright.*.config.ts` und `global-setup-*.ts` (e2e-tester) — die
   fachliche Hälfte ist mit Abschnitt 5 geklärt und gemessen; es fehlt nur noch die
   Ausführungskonfiguration.
4. **`timer_idle` hat in `docs/datenmodell.md` keinen eigenen Abschnitt**, obwohl die Tabelle
   seit A-24 im Bestand und im Archiv steht. Mir aufgefallen beim Verweisen; nicht in diesem
   Auftrag nachgeholt.

## Nächster Schritt

Zwei Aufträge vormerken, in dieser Reihenfolge: (1) die drei E2E-Fälle auf die Neustart-Vorrichtung
aus Abschnitt 5 umstellen — fachlich geklärt, Rezept steht, nur Konfiguration fehlt; (2) die
Polarität der Timer-Aufnahme drehen und damit die Archiv-Lücke schließen, mit der Messung aus
Abschnitt 4 als Gegenprobe. Beide sind voneinander unabhängig; (1) ist der kleinere und macht
`pnpm test:e2e` wieder grün.
