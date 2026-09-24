Aufgabe: T-009 — Die Fachlogik von Takt umsetzen (rot nach grün)

Status: fertig

---

## Artefakte

Geändert unter `packages/domain/src/` — aus reinen Typdateien wurden Typdateien **mit**
Laufzeitregel. Kein Typ wurde entfernt, keine Signatur umgedeutet:

```
kernel.ts       135 → 226 Zeilen   ok/err/taktError, toCalendarDay, secondsBetween, resolveTimeZone
rounding.ts     108 → 152 Zeilen   roundToQuarterHours, quarterHoursToExportNumber,
                                   SECONDS_PER_QUARTER_HOUR
tag.ts          205 → 309 Zeilen   checkFolderMove, matchesPool, isVisibleInPool, applyDefaultTags
time-entry.ts   258 → 527 Zeilen   determineReopen, decideTimerStart, decideTimerStop,
                                   decideOrphanedTimer, isLocked, checkExportStatusTransition,
                                   MINIMUM_DURATION_SECONDS + vier Entwurfstypen
export.ts       420 → 541 Zeilen   groupExportCandidates + zwei Sortierschlüssel
index.ts         21 →  26 Zeilen   `export type *` → `export *` für die fünf Module mit Laufzeit
scripts/check-export-boundary.mjs  meldet jetzt „n von 7 Typbehauptungen", nicht blind „7"
```

Neu unter `packages/storage/migrations/`:

```
0003_timer_heartbeat.up.sql / .down.sql                     E-036, 58 + 15 Zeilen
0004_builtin_template_group_sources.up.sql / .down.sql      E-033, 67 + 33 Zeilen
```

Geändert:

```
packages/storage/src/ports.ts            TimerHeartbeatPort (nur Typen), in UnitOfWork aufgenommen
apps/local-api/openapi/takt-local-api.yaml   drei Operationen und ein Schema für E-036
docs/architektur.md                      Regeltabelle „wo welche Regel wohnt", Zeitzone, E-036
docs/datenmodell.md                      Abschnitt 3.4a timer_heartbeat, Migrationsnachweise
```

Nicht angefasst: `packages/*/test/**`, `packages/export/**`, `apps/web/**`, `apps/desktop/**`,
`apps/local-api/src/routes/**`, alle Wurzeldateien, `docs/**` außer den beiden eigenen. Nichts
installiert; `pnpm-lock.yaml` unverändert.

---

## Zusammenfassung

Die 70 Fälle in `packages/domain/test/` sind grün, ohne dass eine Testzeile angefasst wurde. Alle
acht von T-010 angenommenen Funktionsnamen stimmten — es gab keinen Namensversatz, kein Test
musste umgedeutet werden. Die Fachlogik liegt vollständig in `packages/domain`: Rundung,
Tagesgruppierung, Exportstatuswechsel, die vier Timer-Regeln, Zyklusprüfung, Pool-Ableitung,
Sichtbarkeit und Standard-Tags. Alles rein, ohne Uhr, Datei, Netz oder Datenbank, mit **einer**
eingehegten Ausnahme (Zeitzone, siehe Annahmen). Dazu zwei Migrationen: das Lebenszeichen aus
E-036 als eigene Tabelle und die Standardvorlage, die noch auf das mit E-033 entfernte `booking.*`
zeigte.

Der Abdeckungsbefund aus R-19 ist damit erledigt. Bis eben waren es 0 von 0 Zeilen — jede Schwelle
erfüllt, keine gemessen. Jetzt:

```
Statements   : 94.64 % ( 106/112 )
Branches     : 88.33 % (  53/60  )
Functions    : 93.10 % (  27/29  )
Lines        : 95.65 % (  88/92  )
```

Je Datei: `rounding.ts` 100 % in allen vier Maßen (deshalb blendet der Berichter sie aus),
`kernel.ts` 100/100/100/100, `export.ts` 100/85,71/100/100, `tag.ts` 96,87/92,85/100/100,
`time-entry.ts` 82,14/82,14/66,66/84,61. Die Schwelle von 80 % ist in jedem der vier Maße
überschritten, und zwar auf einer nicht leeren Menge.

Die zwei ungedeckten Funktionen sind `isLocked` (A-6.9) und `decideOrphanedTimer` (E-036); beide
sind gefordert, aber von keinem der 70 Fälle berührt — T-010 konnte sie nicht kennen, weil kein
Typ sie vorzeichnete. Vorschlag unter „Nächster Schritt".

---

## Die Rundungsregel, ausdrücklich

`roundToQuarterHours(seconds, mode)` in `packages/domain/src/rounding.ts` — der einzige Ort im
Projekt, an dem diese Regel steht.

```
up       quarters = max(1, ceil(seconds / 900))     E-008, Produktivmodus
nearest  quarters = max(1, floor(seconds / 900 + 0.5))   kaufmännisch, umschaltbar (R-03)
```

Die drei Randfälle, wie im Auftrag verlangt ausdrücklich entschieden:

| Fall | Ergebnis | Begründung |
|---|---|---|
| Dauer ≤ 0, auch negativ, auch `NaN` | `null` | Eine Buchung ohne Dauer existiert fachlich nicht (E-008). `null` ist kein Betrag, sondern die Aussage „nicht exportierbar". Der Code prüft `!(seconds > 0)` statt `seconds <= 0`, weil jeder Vergleich mit `NaN` falsch ist — sonst liefe `NaN` durch `ceil` und `max` hindurch bis in eine Rechnung. |
| Dauer **unter 7:30** | 0,25, nie 0,00 | Untergrenze aus E-008, vom Auftraggeber ausdrücklich bestätigt (3 Minuten → 0,25). Das ist der Grund für `max(1, …)`; ohne die Klammer ergäbe `nearest` für 3 Minuten 0,00. |
| Wert **genau auf** einer Stufe (900/1800/2700/3600 s) | bleibt auf der Stufe | 15 Minuten sind 0,25, nicht 0,50. `ceil` eines Vielfachen ist das Vielfache selbst. Die naheliegende Fehlimplementierung `floor(s/900)+1` verletzt genau das; TP-ROUND-06, -10, -11, -12 und -14 fangen sie ab. |
| Wert **genau zwischen** zwei Stufen (450/1350/2250/3150 s) | aufwärts | In `up` stellt sich die Frage nicht. In `nearest` wird zur größeren Stufe gerundet: 7:30 → 0,25, nicht 0,00. Damit deckt auch der kaufmännische Modus den vom Auftraggeber genannten Datenpunkt. |

Der Unterscheidungsfall steht: **16 Minuten ergeben 0,50** in `up` und 0,25 in `nearest`, 61
Minuten ergeben 1,25 gegen 1,00. Der Test „die beiden Modi liefern nachweislich unterschiedliche
Ergebnisse" hält fest, dass es zwei Regeln sind und nicht zwei Namen für einen Codepfad.

**Gerundet wird die Tagessumme je Todo, nicht die Buchung** (E-020). Die Funktion sieht davon
nichts — sie bekommt Sekunden. Was in diese Sekunden eingeht, entscheidet
`groupExportCandidates`.

---

## Tagesgruppen: die Stelle, an der eine falsche Umsetzung doppelt abrechnet

`groupExportCandidates` filtert **nicht** nach Exportstatus, und das ist Absicht. `ExportCandidate`
ist per Vertrag eine offene Buchung; `v_export_candidate` filtert bereits in SQL. Sind von drei
Buchungen eines Tages zwei offen, entsteht eine Gruppe aus zwei Buchungen — die dritte ist
abgerechnet und bleibt es. Eine Umsetzung, die hier „der Vollständigkeit halber" alle Buchungen
des Tages nachlädt, rechnet still doppelt ab (R-10). Der Kommentar an der Funktion sagt das
wörtlich, damit es niemand später „repariert".

Der Kalendertag kommt aus der **Startzeit in Ortszeit** (E-025). Das ist keine Feinheit: 22:50 UTC
und 23:10 UTC am 15.01. sind in Europe/Berlin der 15. und der 16. Januar. Eine Umsetzung, die den
Datumsanteil des UTC-Zeitstempels abschneidet, macht daraus eine Gruppe statt zweier — und rundet
20 Minuten Abstand zu einer einzigen Zeile zusammen. TP-EXPORT-15a fängt genau das.

`previouslyExported` an der Gruppe ist wahr, sobald **eine** enthaltene Buchung schon einmal
exportiert war (R-10, TP-EXPORT-17).

---

## Exportstatus

Zweiwertig, nie leer. `checkExportStatusTransition` kennt genau zwei erlaubte Übergänge, und der
Auslöser ist Teil der Bedingung, nicht Beiwerk:

```
open     --[ export_run ]--> exported
exported --[ reset      ]--> open
```

Alle acht übrigen Kombinationen der Matrix werden abgewiesen; jeder Wechsel auf sich selbst mit
`export_status_unchanged`, jeder Übergang mit falschem Auslöser mit `export_status_not_settable`.

**E-032 steht im Code als Abwesenheit.** Das Ergebnis eines Resets ist `open` — derselbe Wert wie
bei einer nie exportierten Buchung. Es gibt keinen Rückgabewert „erneut offen", kein drittes
Literal und damit nichts, das je in einen Filter geraten und die zurückgesetzte Buchung aus dem
nächsten Export heraushalten könnte. Dass sie schon einmal exportiert war, trägt `exportCount`;
das ist Anzeige, kein Status. Protokolliert wird über `export_audit` — Tabelle, Trigger gegen
UPDATE und DELETE und der Fehlerkatalog standen bereits, die Regel darüber liegt jetzt hier.

---

## Timer

Vier reine Regeln, drei davon von T-010 geprüft:

- `decideTimerStart` — läuft bereits einer und fehlt `stopRunning`, ist das Ergebnis
  `confirmation_required`, **bevor** irgendetwas geschrieben wird. Es gibt keinen Pfad durch diese
  Funktion, der einen laufenden Timer stillschweigend beendet. Der Partialindex
  `ux_time_entry_running` ersetzt die Regel nicht, er sichert sie ab: Der Index verhindert den
  zweiten Timer, die Regel sorgt dafür, dass vorher gefragt wird statt ein Fehler zu erscheinen.
- `decideTimerStop` — unter einer Sekunde entsteht keine Buchung (Doppelklick auf „Start").
- `determineReopen` — ein Feld hinein, ein Feld hinaus. Kein Feld für eine Kanban-Spalte, weder
  hinein noch hinaus (E-023). Der Test prüft `Object.keys(result)` und würde eine
  wieder eingeführte „returnToStatusId" bemerken.
- `decideOrphanedTimer` — E-036, siehe unten.

**Die Kanban-Spalte bleibt unverändert**, und die Pool-Sichtbarkeit ergibt sich von selbst:
`isVisibleInPool` kennt nur `completedAt` und den Einblendschalter (E-039). Fällt das Kennzeichen,
fällt die Ausblendung. Kein Schreibvorgang, keine gespeicherte Mitgliedschaft, nichts
wiederherzustellen.

---

## Lebenszeichen (E-036) — neu, weil es fehlte

Weder Schema noch Ports kannten es. Ohne Lebenszeichen bleibt beim nächsten Start nur, das Ende
auf „jetzt" zu setzen — ein über Nacht vergessener Timer bucht dann vierzehn Stunden, und nach
der Aufrundung aus E-008 steht das auf einer Rechnung.

Migration 0003 legt `timer_heartbeat` an: eine Zeile, an die laufende Buchung gebunden, mit
`ON DELETE CASCADE` und zwei Triggern, die ein Lebenszeichen für eine bereits beendete Buchung
mit `timer_not_running` abweisen. **Eigene Tabelle, keine Spalte auf `time_entry`** — drei Gründe,
ausgeschrieben in der Migration und in `docs/datenmodell.md` 3.4a: der einzige Schreibvorgang im
Minutentakt darf die Zeile mit den Abrechnungsdaten nicht anfassen; SQLite verweigert
`DROP COLUMN` für eine Spalte, die in einem `CHECK` vorkommt, womit die Rückwärtsmigration ein
Tabellenumbau geworden wäre; und der Wert ist flüchtig.

`decideOrphanedTimer` bucht höchstens bis zum letzten Lebenszeichen. Fehlt es ganz, ist die Dauer
0 und die Buchung fällt als zu kurz heraus — es gibt nichts zu buchen, was jemand bezeugen könnte.
Eine dritte Möglichkeit „bis jetzt buchen" gibt es bewusst nicht. Nachgewiesen gegen SQLite:
`v_export_candidate` liefert eine unvollständige Buchung nicht, sie geht also in keinen Export.

---

## Nachweise

**70 von 70 grün, ohne eine Testzeile anzufassen.**

```
$ pnpm exec vitest run packages/domain/test/
Test Files  5 passed (5)
     Tests  70 passed (70)
```

**Migrationen vorwärts, rückwärts und wieder vorwärts** (Node 22.23.2, `node:sqlite`, E-035):

```
vorwärts:      0001 0002 0003 0004   integrity_check ok, foreign_key_check leer
               Standardvorlage: group.quarters / group.bookingNotes, kein booking.* mehr
               Lebenszeichen geschrieben, fortgeschrieben, auf beendeter Buchung abgewiesen
               unvollständige Buchung erscheint in keinem Export
               Lebenszeichen verschwindet mit der Buchung (ON DELETE CASCADE)
rückwärts:     0004 0003 0002 0001   0 verbleibende Objekte
erneut vorwärts:                     64 Objekte, Objektliste identisch zum ersten Lauf
Schemaumfang:  17 Tabellen, 32 Indizes, 14 Trigger, 1 Sicht
```

**Notiz-Trennung, sechs Proben — jeweils eingefügt, Fehler gezeigt, zurückgenommen** (R-06, R-18):

| Probe | Ergebnis |
|---|---|
| `'todo.note'` in `ExportSourcePath` | 3 × TS2344 (`NoteBoundaryIsSealed`, `TodoSourcesAreCovered`, `NoSourceIsCalledPlainNote`) |
| `'group.note'` in `ExportSourcePath` | 2 × TS2344 (`NoSourceIsCalledPlainNote`, `GroupSourcesAreCovered`) |
| `'booking.durationSeconds'` kehrt zurück | 1 × TS2344 (`BookingSourcesAreGone`) |
| `todoNote` als Feld auf `ExportCandidate` | 1 × TS2344 (`ExportCandidateHasNoTodoNote`) |
| `note` als Feld auf `ExportGroup` | 1 × TS2344 **und zusätzlich TS2741** in `groupExportCandidates` |
| eine Typbehauptung entfernt | Wächterskript bricht mit Exitcode 1 und benennt die fehlende |

Die fünfte Zeile ist der Zugewinn dieser Aufgabe: Solange `export.ts` nur Typen enthielt, brach
ein Vermerkfeld auf `ExportGroup` allein die Behauptung. Jetzt bricht **zusätzlich** die einzige
Stelle, die eine `ExportGroup` überhaupt baut — wer das Feld einführt, muss es sichtbar befüllen.
Aus einer Behauptung ist eine Konstruktionsbedingung geworden. Alle sieben Behauptungen stehen
unverändert, `pnpm boundaries` ist grün.

**Werkzeugkette:** `pnpm boundaries` grün. `pnpm build` grün. `pnpm exec tsc -p tsconfig.json` und
`typecheck` in `@takt/domain`, `@takt/storage`, `@takt/local-api`, `@takt/web` je Exitcode 0.
`pnpm typecheck` als Ganzes bricht in `apps/desktop` ab — dort fehlt `tsconfig.json`, das Paket
entsteht gerade in T-008b und gehört nicht mir (siehe Offene Fragen).

---

## Annahmen — was ich entschieden habe, ohne zu fragen

1. **Die Zeitzone ist die einzige Ausnahme von der Reinheit, und sie ist eingehegt.**
   `toCalendarDay` braucht eine Zone, weil der Kalendertag der Tag an der Wand des Benutzers ist
   und nicht der in UTC (E-025). Ich habe sie **nicht** in `app_setting` aufgenommen: Eine zweite,
   abweichend eingestellte Zone könnte von der Uhr des Rechners abweichen, und dann stimmt die
   Tagesgruppe nicht mehr mit dem überein, was der Benutzer am Abend gesehen hat. Sie kommt aus
   der Laufzeit (`Intl`), ist aber jeder betroffenen Funktion als Argument überschreibbar — damit
   bleibt die Regel prüfbar, ohne die Umgebung zu verstellen.

2. **Reine Regeln geben Entwürfe zurück, keine fertigen Zeilen.** Eine reine Funktion kann keine
   Kennung vergeben. `decideTimerStart` liefert deshalb `RunningTimeEntryDraft` /
   `StoppedTimeEntryDraft` — alles, was aus der Regel folgt, ohne die Felder, die erst die
   Speicherung setzt. `TimerStartResult` (Ergebnis **nach** dem Schreiben) blieb unverändert
   daneben stehen; ich habe ihn nicht umgedeutet, sondern `TimerStartDecision` daneben gestellt.

3. **Eine leere Pool-Regel trifft nichts, auch im Modus `all` nicht.** Die mathematisch saubere
   Lesart „alle null Bedingungen sind erfüllt" wäre fachlich falsch: Ein Pool, dessen Regel noch
   nicht fertig eingerichtet ist, hätte schlagartig jedes Todo als Mitglied.

4. **Gruppen und Buchungen werden über einen eindeutigen Sortierschlüssel geordnet**, nicht über
   eine Kette von Vergleichen. Zwei Läufe über denselben Bestand erzeugen dieselbe Datei in
   derselben Zeilenfolge (R-17). Der Schlüssel der Buchung ist `startedAt + timeEntryId`: Ohne den
   zweiten Teil hätten zwei zur selben Sekunde begonnene Buchungen keine bestimmte Reihenfolge,
   und die zusammengeführten Leistungstexte hüpften zwischen zwei Vorschauen.

5. **Migration 0004 zieht die Standardvorlage nach.** Sie zeigte noch auf `booking.durationSeconds`
   und `booking.note` — Quellen, die E-033 aus `ExportSourcePath` **entfernt** hat. Die
   mitgelieferte, nicht löschbare Vorlage wäre also unbenutzbar gewesen
   (`export_source_forbidden`), und zwar ausgerechnet die, die der Benutzer nicht reparieren kann.
   Ich habe die Transformation für `Zeit` dabei von `round_to_quarter_hour` auf
   `quarter_hours_to_number` umbenannt: Die alte bekam Sekunden und rundete sie, die neue bekommt
   eine bereits gerundete Anzahl Viertelstunden und teilt durch vier. Bliebe der alte Name stehen,
   läse eine wörtliche Umsetzung die Zahl 3 als Sekunden und machte daraus 0,25 — aus 0,75 würde
   still 0,25 auf einer Kundenrechnung. Ein unbekannter Name bricht sichtbar beim Validieren, ein
   umgedeuteter bricht still beim Abrechnen. Das ist die Begründung aus E-033, eine Ebene tiefer.
   **Der Name gehört T-007; wenn dort ein anderer entsteht, ist eine Zeile in 0004 zu ändern.**

6. **Als Migration, nicht als Änderung an 0002.** Es gibt noch keinen ausgelieferten Bestand, ein
   Eingriff in 0002 wäre also folgenlos gewesen — aber genau dafür ist der Prüfsummenmechanismus
   aus `schema_migration` da. Eine bereits gelaufene Datei wird nicht umgeschrieben.

---

## Risiken

- **R-19 ist geschlossen, aber `time-entry.ts` liegt mit 82,14 % Zweigabdeckung am nächsten an der
  Schwelle.** Die Lücke sind genau die beiden Regeln, die T-010 nicht kennen konnte (`isLocked`,
  `decideOrphanedTimer`) sowie der Verwerfungszweig von `decideTimerStop`. Kommt weitere
  ungedeckte Regel dazu, fällt die Datei unter 80 % und `pnpm check` bricht. Das ist gewollt.
- **R-10 bleibt scharf.** Die Domäne rechnet korrekt über das, was sie bekommt. Ob sie nur offene
  Buchungen bekommt, entscheidet `v_export_candidate` — also SQL, nicht diese Regeln. Die Sicht
  ist der Ort, an dem eine Doppelabrechnung entstehen würde, und sie hat noch keinen eigenen Test
  (`packages/storage/test/` existiert nicht).
- **Der Exportvorgang ist noch nicht transaktional, weil es ihn noch nicht gibt.** Die
  Transaktionsklammer (`TransactionPort`) und die anhängenden Tabellen stehen; der Anwendungsfall,
  der Datei schreiben und Buchungen markieren zusammenfasst, entsteht mit T-007 und den Routen.
  Ich führe das als offen und nicht als erledigt.
- **`pnpm check` ist derzeit rot**, aber nicht durch diese Aufgabe: `packages/export/test/` (85
  Fälle) findet sein Paket nicht, weil T-007 noch aussteht, und `apps/desktop` hat noch keine
  `tsconfig.json`.

---

## Offene Fragen

1. **An T-007 (integration-dev), drei Punkte.** (a) Heißt die Transformation für `Zeit`
   `quarter_hours_to_number`? Wenn nicht, ist Migration 0004 in einer Zeile anzupassen — bitte
   melden statt selbst ändern, `packages/storage/migrations` liegt bei mir. (b) Die
   Transformationsnamen sind in der Datenbank englisch (`raw`, `base64`), in
   `packages/export/test/templates.test.ts` deutsch (`roh`). Eines von beidem muss weichen.
   (c) `packages/export/test/{templates,note-boundary-property,exportability}.test.ts` benutzen
   weiterhin `booking.note` und `booking.durationSeconds`; seit E-033 gibt es diese Quellen nicht
   mehr. Der unit-tester hat das in T-010 als Befund 1 angekündigt — die Anpassung gehört ihm,
   nicht mir und nicht T-007.
2. **An den unit-tester.** Die `@ts-expect-error`-Kommentare über den Importen in allen fünf
   Dateien von `packages/domain/test/` sind jetzt gegenstandslos: Die Funktionen existieren. Zur
   Laufzeit stört das nicht (die Testordner liegen in keinem `tsconfig.json`, Vitest übersetzt
   ohne Typprüfung), aber sobald jemand die Tests in eine Typprüfung aufnimmt, schlagen sie mit
   TS2578 fehl. Ich habe sie nicht angefasst — Testdateien sind nicht meine.
3. **An den Orchestrator: zwei ungedeckte Regeln.** `isLocked` (A-6.9) und `decideOrphanedTimer`
   (E-036) sind gefordert, aber von keinem der 70 Fälle berührt, weil T-010 sie nicht kennen
   konnte — für `decideOrphanedTimer` gab es zum Zeitpunkt von T-010 weder Typ noch Tabelle.
   Vorschlag: ein kurzer Nachtrag an den unit-tester, etwa acht Fälle, statt sie ungeprüft zu
   lassen.
4. **An den Orchestrator: `packages/storage/test/` gibt es nicht.** Der unit-tester hat das in
   T-010 begründet ausgelassen. Jetzt, wo Migration 0003 und 0004 existieren und die Sicht
   `v_export_candidate` die Doppelabrechnung aus R-10 verhindert, wäre ein eigener Testauftrag
   gegen eine echte SQLite-Verbindung angebracht — mein Nachweisskript lief außerhalb des
   Repositorys und ist damit nicht dauerhaft.
5. **Befund 2 aus T-010 ist gegenstandslos.** `packages/domain/src/settings.ts` beschreibt die
   Rückkehr-Spalte bereits korrekt als entfallen (E-023); der beanstandete Kommentar wurde vor
   T-010 nachgezogen. Ich habe nichts geändert.
6. **`apps/desktop` bricht `pnpm typecheck` ab** (`error TS5058: tsconfig.json does not exist`).
   Das Paket entsteht gerade in T-008b beim frontend-dev und liegt außerhalb meiner Hoheit —
   gemeldet, damit es nicht wie eine Nebenwirkung dieser Aufgabe aussieht.

---

## Nächster Schritt

1. **T-007 kann starten.** `groupExportCandidates` liefert `ExportGroup`-Werte, `ExportSourcePath`
   ist abschließend und `booking.*`-frei, `roundToQuarterHours` und `quarterHoursToExportNumber`
   stehen bereit. Der Motor muss die Rundung **nicht** nachbauen und darf es auch nicht.
2. **Nachtrag an den unit-tester** für `isLocked` und `decideOrphanedTimer` (Punkt 3 oben), im
   selben Zug die stumpf gewordenen `@ts-expect-error` entfernen.
3. **Anwendungsfälle und Routen** in `apps/local-api`: Die Regeln stehen, die Ports stehen, die
   OpenAPI-Beschreibung hat mit `POST /timer/heartbeat`, `GET /timer/orphaned` und
   `POST /timer/orphaned/resolve` jetzt 57 Operationen. Erst dort wird der Exportvorgang
   transaktional — Datei geschrieben **und** alle Buchungen markiert, oder nichts.
4. **Eigener Testauftrag für `packages/storage`** (Punkt 4 oben), mit `v_export_candidate` und dem
   Partialindex `ux_time_entry_running` als ersten beiden Fällen.

---
---

# Nachtrag — vier Punkte des Orchestrators (2026-09-01)

Status: fertig

## Artefakte des Nachtrags

```
packages/domain/src/export.ts                     Re-Export der Rundung (Punkt 1)
packages/storage/migrations/0005_builtin_template_field_key.{up,down}.sql   (Punkt 2)
apps/local-api/src/access/session-secret.ts       zwei stdin-Zeilen statt einer (E-042)
apps/local-api/src/main.ts                        Übergabe und eigene Fehlermeldung (E-042)
apps/local-api/src/composition.ts                 windowsUser als Pflichtangabe (E-042)
apps/local-api/src/runtime.ts                     windowsUser im Laufzeitzustand (E-042)
apps/local-api/src/config.ts                      https://tauri.localhost gestrichen (E-043)
apps/local-api/src/access/origin-policy.ts        Prosa auf tauri://localhost (E-043)
apps/local-api/scripts/proof-access.mjs           zwei neue Prüffälle, Herkunftstabelle
docs/architektur.md                               dieselbe Herkunft im Prüfrezept
```

---

## 1. Der Re-Export — eine Zeile, wie gemeldet

In `packages/domain/src/export.ts`:

```ts
export { quarterHoursToExportNumber, roundToQuarterHours } from './rounding.js';
export type { RoundingMode, SecondsPerQuarterHour } from './rounding.js';
```

Die zweite Zeile kam dazu, weil `ExportSystemContext.roundingMode` den Typ `RoundingMode` trägt;
ohne sie könnte der Motor das Feld lesen, aber nicht benennen. Der Wächter lässt in dieser Datei
ohnehin nur `./kernel.js` und `./rounding.js` zu — was hier hinausgeht, kommt aus einem der beiden
Module, die die Exportfläche schon kennen darf. Die Fläche wächst also nicht, `pnpm boundaries`
bleibt grün, alle sieben Typbehauptungen stehen.

**Gemessen im Repository, nicht mit einer Attrappe:** `packages/export` übersetzt fehlerfrei,
**84 von 85** Fällen in `packages/export/test/` sind grün. Zusammen mit den Domänentests:
**169 von 170**.

Der eine rote Fall ist kein Umsetzungsfehler, sondern ein Fehler im Testdatensatz selbst:

```
FAIL packages/export/test/base64.test.ts > TP-B64-07
AssertionError: expected 9440 to be greater than 10000
 ❯ base64.test.ts:62   expect(longText.length).toBeGreaterThan(10_000);
```

Der Fülltext der Datei ist 9 440 Zeichen lang, die Zusicherung verlangt über 10 000. Sie schlägt
fehl, **bevor** `toBase64` überhaupt aufgerufen wird — der Kodierer ist daran unbeteiligt.
Reparatur: den Fülltext verlängern (etwa den Wiederholungsfaktor erhöhen), nicht die Schwelle
senken; die Zahl steht dort, weil sie mehrere Base64-Blockgrenzen überschreiten soll. Die Datei
gehört dem unit-tester, ich habe sie nicht angefasst.

---

## 2. Der Feldname: **`transformation`** gewinnt

**Antwort auf die gestellte Frage, damit niemand rät.**

| Was | Wert |
|---|---|
| Schlüssel im JSON der Vorlage | **`transformation`** |
| Werte | **englisch**: `raw`, `base64`, `quarter_hours_to_number` |

**Begründung zum Feldnamen.** `packages/domain/src/export.ts` benennt das Feld **nicht** — und das
ist Absicht: `ExportTemplateEnvelope.definition` ist `unknown`, weil das Vorlagenformat dem Motor
gehört und nicht der Domäne. Der einzige Typ, der das Feld überhaupt benennt, ist
`ExportFieldDefinition` in `packages/export/src/model.ts` (T-007), und dort heißt es
`transformation`. Damit gewinnt der Typ, und die Migration zieht nach — die umgekehrte Richtung
wäre schlechter gewesen: Ein in SQL festgeschriebener Feldname zwänge den Motor, sein eigenes
Format nach der Datenbank zu benennen, und genau diese Kopplung vermeidet `definition: unknown`.

**Begründung zu den Werten.** E-015: Bezeichner und Aufzählungswerte sind englisch. Migration 0004
schrieb bereits `raw`; 0005 bestätigt das. `quarter_hours_to_number` und `base64` sind ohnehin
englisch.

**Migration 0005** angelegt, vorwärts und rückwärts geprüft. Die Rückwärtsrichtung stellt den Stand
von 0004 wortgleich her, einschließlich `transform` — eine Rückwärtsmigration stellt den alten
Stand her, samt seiner Fehler.

**Was daraus für andere folgt — bitte nicht selbst entscheiden, sondern hiernach richten:**

- **integration-dev (T-007):** `ExportTransformation` in `packages/export/src/model.ts` ist
  `'roh' | 'base64' | 'quarter_hours_to_number'` — ein deutscher Wert zwischen zwei englischen.
  `roh` wird zu `raw`. Betroffen sind `model.ts` (Typ), `template.ts` (`TRANSFORMATION_PRESENCE`
  und die Standardvorlage in Zeile 240 ff.) und `render.ts` (`switch`). Bis das geschehen ist,
  weist der Motor die mitgelieferte Standardvorlage aus der Datenbank ab — das ist sichtbar und
  nicht still, genau wie beabsichtigt.
- **unit-tester (T-010):** `packages/export/test/templates.test.ts` prüft `transformation: 'roh'`.
  Der Feldname stimmt schon, der Wert wird `'raw'`.
- **Niemand ändert dafür eine Migration.** `packages/storage/migrations` liegt bei mir; wenn sich
  am Format doch etwas ändert, melden statt selbst schreiben.

---

## 3. E-042 — der Windows-Benutzername über die zweite `stdin`-Zeile

`readSessionSecret` ist zu `readStartupHandshake` geworden und liest **beide** Zeilen in **einem**
Lesevorgang. Das ist der entscheidende Punkt und nicht Geschmack: Schickt die Hülle beide Zeilen
in einem Schreibvorgang — der Normalfall bei einer Röhre —, liegen sie im selben Datenblock. Zwei
nacheinander geschaltete Leser hätten die zweite Zeile verschluckt, und der Fehler wäre erst auf
dem Rechner des Benutzers aufgefallen. Der Prüffall schreibt deshalb ausdrücklich beide Zeilen auf
einmal.

Geprüft wird der Name, nicht geglaubt: nicht leer, höchstens 256 Zeichen, keine Steuerzeichen — er
geht in die Abrechnung (A-8.5) und in Protokollzeilen, und Steuerzeichen sind das Werkzeug, mit dem
man beides von innen aufbricht. Er steht in keiner Fehlermeldung; eine Meldung, die fremde Eingabe
wörtlich wiedergibt, ist der bequemste Weg, ein Protokoll zu fälschen.

**Ohne zweite Zeile startet der Dienst nicht** (Code 78), mit eigener Meldung: „Der lokale Dienst
hat keinen Windows-Benutzernamen empfangen. Er startet nicht: Ein Export ohne Urheber wäre nicht
nachvollziehbar." Damit die Diagnose stimmt, merkt sich der Leser, ob die erste Zeile schon
angenommen war: Läuft danach die Zeitgrenze ab, meldet er `user_missing` und nicht `timeout` — der
Unterschied entscheidet, wo der Benutzer sucht.

`USERNAME` wird nirgends gelesen. Der Wert liegt in `AccessRuntime.windowsUser` und kommt
ausschließlich aus dem Zusammenbau, der ihn als Pflichtangabe verlangt — es gibt keinen stillen
Rückfall auf eine leere Zeichenkette.

**Kopplung an T-008b, bitte weitergeben:** Die Hülle muss ab sofort **zwei** Zeilen schreiben.
Schreibt sie nur eine, startet der Sidecar nicht mehr. Das ist die gewollte Richtung von E-042,
aber es ist eine Änderung, die beide Seiten gleichzeitig brauchen.

---

## 4. E-043 — `https://tauri.localhost` gestrichen

Aus `ALLOWED_ORIGINS` entfernt. Geblieben sind `tauri://localhost` (im Auslieferungsbau gemessen)
und `http://tauri.localhost`.

Der geforderte Kommentar steht dort, wo ich schreiben darf: unmittelbar an der Positivliste in
`apps/local-api/src/config.ts`. Er nennt Datei und Schlüssel des Schalters
(`apps/desktop/src-tauri/tauri.conf.json`, `app.windows[].useHttpsScheme`), warum er auf `false`
bleiben muss — der Webview verweigert sonst wegen gemischter Inhalte jede Anfrage an
`http://127.0.0.1:17843` — und dass, wer ihn doch umlegt, die Herkunft hier bewusst wieder
aufnehmen muss. Genau dieser Zwang ist der Sinn der Streichung.

**Der Kommentar an der Datei des Schalters selbst gehört dem frontend-dev**
(`apps/desktop/**` ist nicht meine Hoheit). Bitte weitergeben; der Wortlaut steht in `config.ts`
zur Übernahme bereit.

Der Fall ist nicht aus der Prüfung verschwunden, sondern hat die Seite gewechselt: In
`proof-access.mjs` steht `https://tauri.localhost` jetzt als **abgewiesene** Herkunft in der
Tabelle. Eine stille Rückkehr des Eintrags fällt damit sofort auf.

---

## Nachweise des Nachtrags

```
$ pnpm exec vitest run packages/domain/test/ packages/export/test/
Test Files  1 failed | 9 passed (10)      (der eine: base64-Fixtur, siehe Punkt 1)
     Tests  1 failed | 169 passed (170)

$ pnpm --filter @takt/local-api proof:access
75 bestanden, 0 fehlgeschlagen.
  darunter neu:  0a. Start ohne Windows-Benutzernamen -> Code 78, Meldung ohne Geheimnis
                 Origin tauri://localhost      -> 200
                 Origin http://tauri.localhost -> 200
                 Origin https://tauri.localhost -> 403   (E-043)

$ node --experimental-sqlite migrate-check.mjs
0001..0005 vorwärts, rückwärts, wieder vorwärts; 64 Objekte, Objektliste identisch
Standardvorlage: Schlüssel "transformation", Werte englisch (E-015)
integrity_check ok, foreign_key_check leer

typecheck: @takt/domain, @takt/storage, @takt/export, @takt/local-api, @takt/web — je Exitcode 0
boundaries: alle Schichten unverletzt, 7 von 7 Typbehauptungen
build: grün
```

**Abdeckung `packages/domain/src` jetzt vollständig.** Der unit-tester hat die fünf Dateien
zwischenzeitlich von 70 auf 85 Fälle erweitert und dabei die beiden Lücken geschlossen, die ich im
Hauptbericht gemeldet hatte:

```
export.ts       Zeilen 17/17   Funktionen 7/7   Zweige  7/7
kernel.ts       Zeilen 16/16   Funktionen 6/6   Zweige  7/7
rounding.ts     Zeilen  7/7    Funktionen 2/2   Zweige  4/4
tag.ts          Zeilen 26/26   Funktionen 8/8   Zweige 14/14
time-entry.ts   Zeilen 26/26   Funktionen 6/6   Zweige 28/28
```

100 Prozent in allen vier Maßen, auf einer nicht leeren Menge. Punkt 3 meiner offenen Fragen aus
dem Hauptbericht ist damit erledigt.

---

## Offene Fragen des Nachtrags

1. **`roh` → `raw`** in `packages/export/src/{model,template,render}.ts` und in
   `packages/export/test/templates.test.ts` — integration-dev und unit-tester, nicht ich.
2. **`base64.test.ts`, TP-B64-07:** Fülltext auf über 10 000 Zeichen verlängern. Die Zusicherung ist
   richtig, der Datensatz ist zu kurz. unit-tester.
3. **T-008b muss zwei `stdin`-Zeilen schreiben** (E-042), sonst startet der Sidecar nicht mehr.
4. **Kommentar an `useHttpsScheme`** in `apps/desktop/src-tauri/tauri.conf.json` — frontend-dev.
   Wortlaut steht in `apps/local-api/src/config.ts`.
5. **`docs/bedrohungsmodell.md`** nennt an mehreren Stellen `https://tauri.localhost` als die
   Herkunft des Tauri-Webviews (Zeilen 228, 494, 1512). Seit E-043 ist das falsch; die gemessene
   Herkunft ist `tauri://localhost`. Die Datei gehört dem security-checker beziehungsweise dem
   documenter. Dasselbe gilt für `docs/testplan.md` und `apps/desktop/README.md`.
6. **`packages/export/src` liegt unter der Abdeckungsschwelle** (Statements 74,89 %, Zweige
   69,13 %, Zeilen 73,63 %; `plan.ts` bei 0 %, `template.ts` bei 50 %). Nicht meine Hoheit,
   gemeldet, weil `pnpm check` daran hängt.
