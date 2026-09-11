# T-252 — Welle 3 der Umstrukturierung: `features/timer` und `features/bookings`

Aufgabe: T-252 — `features/timer` und `features/bookings` bauen
Status: **braucht Review** — beide Merkmale stehen, **alle Läufe grün**, einschließlich
`proof:all` (Ausgangskode 0, alle neunzehn Nachweise). Die E2E-Fälle stehen bei 4 roten; drei
davon sind die benannten offenen, der vierte ist ein **fünfter, bisher nicht gemeldeter** —
und alle vier habe ich am rückgebauten Vorzustand gegengemessen, statt sie zu behaupten
(Abschnitt 8).

---

## 1  Die Reihenfolgefrage, gemessen: **zwei Features, und sie kosten nichts**

Der Auftrag gibt mir die Wahl zurück, falls eine Trennung eine Barrel-Datei, einen Ringverweis
oder eine Zwischenschicht erzwingt. **Keines der drei tritt ein.** Gemessen am fertigen Baum:

```
timer  → bookings : 1 Kante   (TimeScreen.tsx → ../bookings/BookingDialogs, BookingFormDialog)
bookings → timer  : 0 Kanten
```

Eine Richtung, eine Kante, kein Ring. Keine Barrel-Datei; jede Einfuhr nennt ihre Datei. Keine
Zwischenschicht: Es gibt keinen gemeinsamen Zustand zwischen den beiden — `BookingFormDialog`
nimmt `todoId` und `todoTitle` entgegen und holt sich `bump` selbst.

**Der Grund, warum es so billig ist, ist ein sachlicher.** Der Timer schreibt eine Buchung, die
er nie wieder ansieht: `stopTimer` liefert sie, `reportStopped` liest ihre Dauer, danach gehört
sie der Buchungsverwaltung. Umgekehrt fragt keine der vier Buchungsrouten nach einem laufenden
Timer. „Timer läuft" und „Buchung liegt vor" sind auch im Quelltext zwei Dinge, nicht nur für
den Benutzer.

**Was ich dabei melde, ohne daß es diese Welle betrifft:** `todos` und `timer` verweisen
gegenseitig aufeinander — `features/todos/TodoDetailScreen.tsx` → `../timer/TimerContext`,
`features/timer/useReactivation.ts` → `../todos/api`. Auf **Modulebene** ist das kein Ring:
`todos/api.ts` führt keine Einfuhr aus `timer/`, ist also ein Blatt. Der Bau meldet keinen
Ringverweis. Die Beziehung besteht seit Welle 2 unverändert; ich habe sie nur sichtbar gemacht.

---

## 2  Artefakte

### Neu — **fünf** Quelldateien

| Datei | Zeilen | Was |
|---|---|---|
| `apps/web/src/features/timer/api.ts` | 235 | zehn Routen (sechs Timer, vier Inaktivität) und elf feature-eigene Typen |
| `apps/web/src/features/timer/useReactivation.ts` | 158 | A-2.5/I-05 — die wiedereröffneten Todos, `announceStart`, der Rückweg |
| `apps/web/src/features/timer/stopMessage.ts` | 89 | die fünf Rümpfe der Stopp-Meldung, ohne React |
| `apps/web/src/features/bookings/api.ts` | 130 | vier Routen und `CreateTimeEntryResult` |
| `apps/web/src/features/bookings/bookingRows.ts` | 64 | `STATE_ORDER` + `toRows`, ohne React |
| `docs/decisions/timer.md` | 100 | Vorgeschichte aus `features/timer/**` |
| `docs/decisions/bookings.md` | 78 | Vorgeschichte aus `features/bookings/**` |

**Fünf** neue Quelldateien, eine gelöschte (`api/idle.ts`). Netto **+4** — die Zahl steht unten
in drei unabhängigen Zählern.

### Verschoben (`git mv`, Inhalt außer Importzeilen unverändert)

Nach `features/timer/`: `app/TimerContext.tsx`, `app/TimerBar.tsx`, `app/useIdleTimer.ts`,
`components/Timer.tsx`, `components/IdleRecovery.tsx`, `components/IdleTaskSelect.tsx`,
`screens/TimeScreen.tsx`, `lib/idle.ts`.

Nach `features/bookings/`: `screens/BookingsScreen.tsx`, `screens/BookingDialogs.tsx`,
`components/BookingTable.tsx`.

Gelöscht: `api/idle.ts` (14 Zeilen — drei Typen und ein Wiederausfuhr-Satz; beides steht jetzt
in `features/timer/api.ts`, wo die Routen selbst entstehen).

### Angefaßt, aber nur die Importzeile

13 Dateien: `app/App.tsx`, `features/todos/{TodoDetailScreen,TodoDoneSwitch,TodoListScreen}.tsx`,
`screens/{BoardScreen,DashboardScreen,ExportScreen,TemplatePreview}.tsx`,
`showcase/{data.ts,DataSection.tsx,TimeSection.tsx}` — und zwei reine **Pfadangaben in
Kommentaren**: `lib/movement.ts` (zwei) und `styles/components.css` (eine). Dazu
`apps/web/scripts/proof-foreign.mjs` Zeile 1026, ebenfalls nur eine Pfadangabe im Kommentar.

**32 Dateien insgesamt in dieser Welle**, gezählt über `diff -rq` gegen einen Abzug des Baumes
von unmittelbar vor dem ersten Schnitt.

---

## 3  Die Zuordnungen, selbst gemessen — und **drei Korrekturen** an der Auftragsliste

Gemessen über die tatsächlichen Einfuhren, nicht über Dateinamen.

1. **`app/dayGroup.ts` gehört nicht zu `bookings`.** Fünf Benutzer in vier Bereichen:
   `TimerContext` und `BookingDialogs` lesen `loadDayGroupInsight`, `TodoDetailScreen`,
   `DashboardScreen` und `TimeScreen` lesen `previewOpenEntries`. Genau **einer** davon liegt in
   `bookings`. Was vier Merkmale lesen, gehört keinem. **Bleibt in `app/`.**
2. **`lib/idle.ts` gehört zu `timer` — aber `api/idle.ts` löst sich auf.** `lib/idle.ts` hat
   zwei Leser (`useIdleTimer`, der Prüffall), beide im Timer → zieht mit als
   `features/timer/idle.ts`. `api/idle.ts` dagegen war eine Zwitterdatei: drei Typen **und**
   eine Wiederausfuhr von vier Funktionen, die in `endpoints.ts` standen, das seinerseits die
   Typen von dort zurückholte. Nach E-102 gehören Route und Typ in **eine** Aufrufdatei des
   Merkmals; die Zwitterdatei fällt damit weg, und der gegenläufige Typverweis
   `endpoints.ts → ./idle` mit ihr.
3. **Nicht jede Zeitbuchungsroute gehört zu `bookings`.** Gemessen je Route:

   | Route | Aufrufer | Ergebnis |
   |---|---|---|
   | `createTimeEntry` | `BookingDialogs` | → `features/bookings/api.ts` |
   | `updateTimeEntry` | `BookingDialogs` | → `features/bookings/api.ts` |
   | `markNotBilled` | `BookingDialogs` | → `features/bookings/api.ts` |
   | `resetExportStatus` | `BookingDialogs`, `BookingsScreen` | → `features/bookings/api.ts` |
   | `listTimeEntries` | **neun** Dateien in vier Bereichen | bleibt in `api/endpoints.ts` |
   | `getTimeEntry` | `app/exportAudit.ts` | bleibt |
   | `deleteTimeEntry` | `TimerContext` **und** `TodoDetailScreen` | bleibt |

   Die Gegenprobe war nötig: Drei Namen (`markNotBilled`, `updateTimeEntry`,
   `resolveOrphanedTimer`) stehen zusätzlich in **Kommentaren** von `components/ExportStatus.tsx`,
   `showcase/ExportStatusSection.tsx` und `api/types.ts`. Ein Textfund ist kein Aufrufer.

**Was ich sonst noch gegengemessen habe:** `RunningTimeEntry` bleibt in `api/types.ts`. Es hat
einen Leser außerhalb jedes Merkmals — `api/client.ts` trägt es in der Konflikthülle des
Übertragungswegs. `TimeEntry`, `ExportStatus` und `TimeEntrySource` bleiben aus demselben Grund
(zehn, siebzehn und vier Leser).

---

## 4  Die Schnitte — und die vier, gegen die ich mich entschieden habe

### `TimerContext.tsx`: 913 → 706, zwei Verantwortlichkeiten heraus

Vollständig gelesen, dann benannt. Was herauskam, kam heraus, **weil es ohne Fäden geht**:

1. **`useReactivation.ts` (158).** Der Satz `reactivated`, `clearReactivated`,
   `undoReactivation` und `announceStart`. Er trägt genau die Regel, die der Auftrag als heikel
   benennt: Ein Start hebt „Erledigt" auf, und es gibt einen Weg zurück. **Eine einzige
   durchgereichte Abhängigkeit** — `refresh`, die dem Timer gehört; `bump` und den
   Meldungsstapel holt der Haken aus denselben Kontexten wie sein Aufrufer, nach derselben
   Regel wie `features/todos/TodoDoneSwitch.tsx` in Welle 2. Der Zustand `reactivated` wandert
   **ganz** mit, es bleibt keine zweite Fassung zurück.
2. **`stopMessage.ts` (89).** Die fünf Rümpfe der Stopp-Meldung als reine Funktion: hinein die
   Auskunft der Tagesgruppe, heraus `{ tone, title, body }` mit bereits angehängtem
   Bewegungssatz. Kein React, kein Meldungsstapel, kein Netz. `reportStopped` ist damit vier
   Zeilen lang: fragen, zeigen.

**Gegen diese Schnitte habe ich mich entschieden — das ist der wichtigere Teil:**

- **Die verwaiste Buchung (E-036) bleibt drin, und zwar wegen einer gemessenen Sekunde.** Sie
  ist der unabhängigste Block: eigener Ladevorgang, eigene Auflösung, rührt weder `running`
  noch `anchor` noch `stopNote` an. Sie teilt sich mit den beiden anderen Dialogen aber
  `busy` und `dialogError`. Zöge sie mit eigenem `busy` aus, änderte sich **eine** Wache:
  `requestStop` prüft `busy || stopOpen || conflict !== null` und **nicht** `orphan !== null`.
  Nachgesehen: `guardIdle` und `idle.blocked` prüfen `orphan !== null` mit, der öffentliche Weg
  wäre also weiter versperrt — aber `guardIdle` prüft **synchron** und ruft die Handlung erst
  **nach** einem `await idle.check()`. In diesem Fenster kann `orphan` von der Abfrage beim
  Start nicht-null werden. Das ist ein Haarspalt, und „nicht eine Sekunde" ist ein Haarspalt.
  **Nicht angefaßt.** Wer sie später ziehen will, entscheidet zuerst über das geteilte `busy`;
  das ist eine Verhaltensentscheidung, keine Umbaufrage.
- **Die drei Dialoge als reine Anzeigebausteine.** Zusammen 23 Eigenschaften, um 110 Zeilen JSX
  zu verlagern, während ihre Logik zurückbleibt. Eine Datei, die man ohne die andere nicht
  versteht, ist keine Trennung.
- **Start und Stopp als eigene Haken.** `performStop`, `requestStop`, `confirmStop`,
  `performSwitch`, `start` und `toggle` schreiben alle auf `running`, `anchor`, `busy`,
  `dialogError` und `runningRef` und rufen alle `refresh`, `bump`, `toasts`. **Der Timer ist
  eine Zustandsmaschine.** Sie zu teilen hieße, sechs Werte durch eine Zwischenschicht zu
  fädeln — genau das dritte der drei Übel aus dem Auftrag.

Was bleibt, sind 706 Zeilen, die eine Sache tun: den einen laufenden Timer führen und die drei
Dialoge zeigen, die zu ihm gehören.

### `BookingsScreen.tsx`: 601 → 545, eine Verantwortlichkeit heraus

**`bookingRows.ts` (64).** `STATE_ORDER` und `toRows` — hinein die Antwort des Dienstes und die
Sortierung, heraus die Zeilen. Ohne React, ohne Zustand, ohne Rückrufe. Dieselbe Bauart wie
`features/tags/treeData.ts` (Welle 1) und `features/todos/todoDayGroups.ts` (Welle 2).

**Gegen den zweiten Schnitt entschieden:** `rowMenu` (~75 Zeilen) bleibt. Als reine Funktion
bräuchte es fünf Rückrufe, und die vier Sperrbegründungen daran (E-047, E-050) hängen an
`data.state`, das der Screen führt.

### `BookingDialogs.tsx`: bleibt bei 538, ungeschnitten

Vier Dialoge, keiner teilt Zustand mit einem anderen; der Schnitt wäre also **kostenlos**, und
ich habe ihn trotzdem nicht gemacht:

- 538 Zeilen liegen unter der Schwelle, an der Welle 2 geschnitten hat (722 und 721).
- Die vier haben eine **gemeinsame** Präambel, die erklärt, warum sie zusammenstehen: zwei
  Vorgänge, die Geld betreffen, ihr Gegenweg und die Gegenprobe, die nur liest. Vier Dateien
  müßten sie viermal führen oder verlieren.
- Es gibt kein **Problem**, nur eine Größe, und die Größe ist nicht groß. Ein Schnitt wäre
  Bewegung, keine Struktur.

`BookingFormDialog` hat fünf Aufrufer, die drei übrigen zwei. Wenn ein Prüfer den Schnitt
trotzdem will, ist die Bruchstelle sauber: `BookingFormDialog.tsx` heraus, der Rest bleibt.

---

## 5  Die feature-eigenen Typen: gemessen, nicht geraten

**`features/timer/api.ts` bekommt elf.** Keiner hat außerhalb des Merkmals einen Leser:
`RunningTimerView`, `StartTimerResult`, `StopTimerResult`, `RecordedStop` (nicht ausgeführt),
`ResolveOrphanedTimerResult`, `OrphanedTimerView`, `OrphanResolution`, `IdleSession`,
`IdleAllocation`, `IdleResolution` — und `RunningTimeEntry` **nicht**, siehe Abschnitt 3.

**`features/bookings/api.ts` bekommt einen.** `CreateTimeEntryResult`. Der einzige weitere
Fundort war `lib/movement.ts` — ein **Kommentar**, kein Typ; ich habe die Pfadangabe darin
nachgezogen.

**`TimeEntryFilter` bleibt in `api/types.ts`**, weil `listTimeEntries` bleibt. Es ist damit
zufällig der Ersatzname, den ich in Welle 2 für die feste Zeile in `proof:callers` vorgeschlagen
hatte — der Befund hat sich anders erledigt, siehe Abschnitt 7.

---

## 6  Kommentare — was wanderte, was blieb

Nach demselben mechanischen Kriterium wie in Welle 1 und 2: Rückblick, der nichts mehr anweist,
geht ins Papier. **Elf Blöcke**, verteilt auf zwei Papiere:

| Woher | Was |
|---|---|
| `timer/useReactivation.ts`, `announceStart` | „Bis T-094 stand hier ein zweiter Weg …" samt der drei Fehler |
| `timer/useReactivation.ts`, `announceStart` | „Der zweite Fall war bis T-094 gar nicht sichtbar (O-G)" |
| `timer/api.ts`, `StartTimerResult` | „Bis T-094 fragte die Oberfläche stattdessen je Pool …" |
| `timer/api.ts`, `ResolveOrphanedTimerResult` | „Bis T-101 gab der Dienst in beiden Fällen …" |
| `timer/TimerContext.tsx`, `confirmOrphan` | derselbe Rückblick, zweite Fassung |
| `timer/TimerBar.tsx` | „Bis T-056 stand der Stoppknopf zwischen Zeit und Titel …" |
| `timer/TimeScreen.tsx` | „Bis T-040 lud diese Ansicht ihre Auswahlliste mit `onlyOpen: true` …" |
| `timer/TimeScreen.tsx` | „Bis T-045 wurde der Fehlschlag hier verschluckt …" |
| `bookings/api.ts`, `CreateTimeEntryResult` | „Der Nachtrag zu E-061 nannte in seiner ersten Fassung …" |
| `bookings/BookingDialogs.tsx`, `attempted` | „Bis T-175 stand hier **eine** Meldung für **zwei** Pflichtfelder …" |
| `bookings/BookingDialogs.tsx`, Anlegen | „Bis T-108 stand hier „Zeit gebucht." mit dem Todo im Rumpf …" |
| `bookings/BookingDialogs.tsx`, `ResetExportDialog` | „Bis T-045 sahen beide gleich aus" |
| `bookings/BookingDialogs.tsx`, `BookingHistoryDialog` | „Bis T-040 gab es diese Auskunft nirgends …" |

Die **Regel** jedes Blocks steht weiter im Quelltext: „Die Oberfläche zählt die Namen nicht
selbst auf", „Die Reihenfolge in der Leiste ist die Lesereihenfolge", „jedes Feld trägt seine
eigene Meldung", „Der Titel nennt das Todo, der Rumpf sagt, was mit ihm geschehen ist", „Der
Dialog schreibt nichts". Jede betroffene Datei trägt „Vorgeschichte: `docs/decisions/…`".

**Stehengelassen, mit Begründung** — jeder beginnt mit „Bis …" und ist trotzdem der Grund,
warum der heutige Code überrascht:

1. `timer/api.ts`, `StopTimerResult`: „Bis T-102 beantwortete dieser Typ auch
   `POST /timer/orphaned/resolve`" — ohne ihn steht unerklärt, warum es **zwei** Typen mit
   einem gemeinsamen `RecordedStop` gibt.
2. `timer/stopMessage.ts`: „Bis T-097 sagte die Oberfläche das nur am Start" — das ist die
   Antwort auf „Warum der Satz überhaupt hierher gehört", also die Daseinsberechtigung dieser
   Datei.
3. `timer/TimerContext.tsx`, `performSwitch`: „Bis T-118 stand `setConflict(null)` **hinter**
   dem Start" — erklärt eine Reihenfolge, die sonst wie ein Versehen aussieht und beim nächsten
   Aufräumen zurückgedreht würde.
4. `timer/Timer.tsx`, die Grabinschrift von `ReactivationNotice`: sie sagt selbst, wozu sie da
   ist — „damit ihn niemand aus bester Absicht neu baut".
5. `bookings/BookingDialogs.tsx`, der Hinweis zur fehlenden Leistung: „die Buchung von Hand
   sagte bis T-118 weder das eine noch das andere" steht **mitten** in dem Satz, der begründet,
   warum ausgerechnet dieser Weg den Hinweis braucht. Ihn herauszuschneiden hieße, den Satz zu
   zerschneiden.

**Und die zwei Fragen aus Welle 1 sind weiterhin offen** (E-078 Punkt 3): der
`consequence`-Block in `TagAdministration.tsx` und „(Befund O-DZ, T-167.)". Erneut nicht
angefaßt.

**Kein Oberflächentext gestrichen und kein zugänglicher Name geändert** (E-087). Alle dreizehn
verschobenen Blöcke stehen in `/* */` bzw. `/** */`. Gegenprobe: `contrast`, `proof:surface`
(29 Live-Regionen, 2 geduldete Sätze) und `proof:codepoints` (46/0) sind zeichengleich, und die
Prüfsumme über 1570 Prüffälle ebenso.

---

## 7  Der rote Lauf aus Welle 2 ist weg — und er ist **nicht** ersetzt worden

`proof:callers` steht bei **61 bestanden, 0 fehlgeschlagen** — schon **vor** meiner Änderung
(Grundmessung dieser Aufgabe). domain-dev hat die feste Zeile 726 berichtigt und dabei zwei
Prüfsätze **hinzugewonnen** (59 → 61). Nach meiner Änderung:

```
ok  die Aufrufdateien der Oberfläche sind gesucht und gefunden (5):
    api/endpoints.ts, features/bookings/api.ts, features/tags/api.ts,
    features/timer/api.ts, features/todos/api.ts
ok  Platte und Sammler sehen dieselben Aufrufdateien der Merkmalsordner (4 zu 4)
ok  so viele Aufrufe gelesen wie im Rohtext stehen (75)
ok  `request` steht nur in api/client.ts, wo es entsteht, und in den 5 gemessenen Aufrufdateien
```

**75 Aufrufe, unverändert.** Die zehn Timerrouten und die vier Buchungsrouten sind umgezogen,
nicht vermehrt. Zwei Merkmalsordner mehr, dieselbe Zahl Türen.

**Damit ist `proof:all` erstmals seit Welle 2 wieder vollständig grün** — Ausgangskode 0, alle
neunzehn Nachweise gefahren statt an vierter Stelle abgebrochen.

---

## 8  Zahlen — vorher gemessen, nicht zitiert

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | grün |
| `pnpm boundaries` | 425 Quelldateien außerhalb der Domäne | **429** (+4) |
| `pnpm contrast` | 261 Paare, 0 von 522, 83/83 Farbtoken, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **140** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 6 Aufrufen | 21/0 — **144**, sonst zeichengleich |
| `pnpm run proof:surface` | 27/0 — **140** Quelldateien, 2 Einstiegsseiten, 7 Stilblätter, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **144**, sonst zeichengleich |
| `pnpm run proof:callers` | 61/0, **3** Aufrufdateien, 2 zu 2, 75 Aufrufe | 61/0, **5** Aufrufdateien, 4 zu 4, **75** Aufrufe |
| `pnpm run proof:all` | Ausgangskode 0 | **Ausgangskode 0**, alle 19 |
| `pnpm test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `apps/web` `pnpm build` | grün | grün, `TimeScreen` 6,88 kB · `BookingsScreen` 13,36 kB · `BookingDialogs` 8,13 kB als **eigene** Stücke |

**Die einzige Zahl, die sich bewegt hat, ist dieselbe in drei unabhängigen Zählern: +4.** Fünf
neue Quelldateien minus die gelöschte `api/idle.ts`. `boundaries` zählt über den Modulgraphen,
`proof:foreign` über den TypeScript-Übersetzer, `proof:surface` über den eigenen Sammler — drei
Wege, dieselbe Vier. **Jede andere gemessene Zahl ist zeichengleich**, insbesondere 174
behandelte Übergaben, 29 Eingabefelder und 29 benannte Live-Regionen: derselbe Nachweis wie in
Welle 2, daß über dieselbe Oberfläche geurteilt wurde.

Zeilen: `api/endpoints.ts` 636 → **492** (−144), `api/types.ts` 1280 → **1100** (−180),
`TimerContext.tsx` 913 → **706**, `BookingsScreen.tsx` 601 → **545**, `api/idle.ts` 14 → 0.

### Gegenprobe, daß nichts verlorenging

Wie in Welle 1 und 2 **zeilenweise gegen einen Abzug des Baumes von vor dem ersten Schnitt**
(nicht gegen `git show HEAD:…` — HEAD kennt Welle 1 und 2 noch nicht, der Vergleich wäre
unscharf gewesen):

- **`features/timer/api.ts`** gegen `types.ts:655–793`, `idle.ts:3–12`, `endpoints.ts:349–395`
  und `:633–636`: `diff` sagt **IDENTISCH**. Null Unterschied.
- **`features/bookings/api.ts`** gegen `types.ts:606–644`, `endpoints.ts:264–285`, `:287–324`
  und `:330–343`: **IDENTISCH**. Null Unterschied.
- **`TimerContext.tsx` + `useReactivation.ts` + `stopMessage.ts`** gegen den Vorzustand,
  Zeilenmengen verglichen. Verschwunden sind ausschließlich Einfuhrzeilen, `interface
  StopMessage {` (steht jetzt als `export interface StopMessage {` auf Modulebene) und
  `toasts.show({ ...message, body: withMovement(message.body, movementSentence) });` — daraus
  wurden `return { ...message, body: withMovement(message.body, movementSentence) };` und
  `toasts.show(stopMessage(insight, todoTitle, durationSeconds, movementSentence));`.
  **Keine Inhaltszeile verloren, kein Ausdruck geändert.**
- **`BookingsScreen.tsx` + `bookingRows.ts`**: verschwunden sind ausschließlich Einfuhrzeilen
  und `function toRows(` → `export function toRows(`. Sonst nichts.
- **Die neun reinen Umzüge** (`TimerBar`, `Timer`, `TimeScreen`, `useIdleTimer`, `IdleRecovery`,
  `IdleTaskSelect`, `idle`, `BookingDialogs`, `BookingTable`): `diff` zeigt **ausschließlich**
  Importzeilen.
- **Die dreizehn Dateien mit Importzeilenpflege**: `diff` zeigt ausschließlich Importzeilen und
  drei Pfadangaben in Kommentaren.

**Der eine Unterschied, der durch das Aufteilen entstand und den ich einzeln benenne:** Der
Rumpf von `stopMessage` stand im Original als Rückruf eingerückt (6 bzw. 4 Leerzeichen) und
steht jetzt als Modulfunktion (2 bzw. 0 Leerzeichen weniger). **Nur Einrückung**; der Vergleich
oben ist deshalb gegen Leerraum normalisiert gefahren, und ohne Normalisierung ist der
Unterschied genau diese Einrückung.

### E2E — einzeln über `tests/e2e/playwright.config.ts`

| Dateien | Ergebnis |
|---|---|
| `timer-stop-announcement`, `timer-switch-scrim-toast`, `timer-prompt-setting`, `idle-recovery`, `todo-revival`, `manual-booking-movement` | 16 bestanden, **3 rot: die drei orphan-Fälle** |
| `manual-booking-movement`, `export-audit-and-locks`, `export-mixed-status-and-billing`, `calendar-day-boundary` | **13 bestanden** |
| `export-end-to-end`, `pool-movement-sentence`, `todo-revival`, `done-movement-announcement`, `midnight-redraw`, `web-build-smoke` | **16 bestanden** |
| `toast-eviction`, `toast-tab-order-scroll`, `focus-return-after-dialog`, `form-dialog-submit-guard`, `field-live-region-announcement`, `foreign-title-display`, `note-separation` | 17 bestanden, **1 rot: `toast-eviction.spec.ts:123`** |
| `kanban`, `tag-input`, `tags-folders`, `startup-appearance`, `board-empty-state-rule-chain` | 13 bestanden, **1 rot: TP-KANBAN-04** |
| `todo-filter-layout`, `deadline-computed-state`, `deadline-lifecycle`, `export-template-validation`, `tag-folder-rule-lock`, `attachment-crud` | 15 bestanden, 1 flatternd |

**`todo-revival` läuft an allen fünf Startpunkten grün** (S-01 bis S-05). Das ist die Regel, die
der Auftrag als heikel benennt — sie ist durch den Umzug von `announceStart` in eine eigene
Datei gegangen und kommt an jedem Einstieg unverändert heraus.

**Vier rote, und alle vier habe ich am rückgebauten Vorzustand gemessen, nicht behauptet.**
Ich habe den Baum zweimal vollständig in den Stand vor T-252 zurückversetzt (Inhalte aus dem
Abzug, die elf Dateien an ihre alten Pfade, `api/idle.ts` zurück, die fünf neuen entfernt;
`typecheck` grün als Beleg, daß der Rückbau vollständig war) und die betroffenen Läufe dort
gefahren:

| Fall | vorher | nachher | Urteil |
|---|---|---|---|
| `timer-stop-announcement.spec.ts:209` | **rot** | rot | nicht meiner (benannt) |
| `timer-stop-announcement.spec.ts:309` | **rot** | rot | nicht meiner (benannt) |
| `timer-stop-announcement.spec.ts:361` | **rot** | rot | nicht meiner (benannt) |
| `kanban.spec.ts:288` TP-KANBAN-04 | rot (T-251 gemessen) | rot | nicht meiner (benannt) |
| `toast-eviction.spec.ts:123` | **rot** | rot | nicht meiner — **fünfter, bisher nicht gemeldeter** |

Alle drei orphan-Fälle scheitern an derselben Zusicherung wie vorher:
`await expect(orphanDialog).toBeVisible()` — der Dialog „Eine Buchung ohne Ende" erscheint nicht.
Danach ist der Baum zeichengleich wiederhergestellt (`diff -r` gegen den Abzug, ohne Befund).

`deadline-lifecycle.spec.ts:156` flatterte erneut in **einem** Lauf und lief beim Wiederholen
durch — dieselbe Beobachtung wie in T-251, unverändert nicht als Befund gemeldet.

---

## 9  Der fünfte rote Fall — neu, und nicht meiner

`tests/e2e/toast-eviction.spec.ts:123` — „Toast-Stapel: eine Meldung mit Rückweg wird nicht
verdrängt (W-10)". Er scheitert bei

```
page.getByRole('button', { name: `Spalte ${undoColumnName} verwalten` }).click();
```

also am **Spaltenmenü des Kanban-Boards**, nicht am Meldungsstapel. Der Fall steht in keinem der
Berichte T-249 oder T-251 und nicht in der Vierer-Liste des Auftrags („Stand: 106/4"). Am
rückgebauten Vorzustand fällt er mit derselben Zeile.

**Das ist ein Befund über den Stand, nicht über diese Aufgabe.** Der Stand ist **106/5**, nicht
106/4. Er gehört auf die Liste, bevor jemand ihn beim nächsten Umbau für einen Neuschaden hält.

---

## 10  Grenzüberschreitung, die ich melde: **eine** Prüfdatei

`apps/web/test/idle.test.ts` — zwei Importangaben nachgezogen:

```
'../src/lib/idle'              → '../src/features/timer/idle'
'../src/components/IdleRecovery' → '../src/features/timer/IdleRecovery'
```

**Nur die zwei Pfade.** Keine Zusicherung, kein Prüffall, keine Zeile Logik. Dieselbe Lage wie
mit den vier Pfaden in Welle 2, die der Orchestrator nachträglich gebilligt hat. Die
Regelfrage aus T-251 (offene Frage 2) ist damit zum dritten Mal aufgetreten und weiterhin
unbeantwortet.

---

## 11  Annahmen

1. **`screens/parts.tsx` bleibt, wo es ist.** `features/timer/TimeScreen.tsx` greift mit
   `../../screens/parts` darauf zurück — dieselbe Übergangsform wie in Welle 1 und 2, dieselbe
   offene Frage. Es ist jetzt der Rückgriff von **drei** Merkmalsordnern (`tags`, `todos`,
   `timer`, `bookings` — vier Dateien, fünf Stellen).
2. **`features/timer/Timer.tsx` behält seinen Dateinamen.** Nach der Schnittregel aus Welle 2
   („ein Baustein in `shared/ui/` nimmt Werte entgegen") stünde `TimerDisplay` streng genommen
   in `shared/ui`: Es nimmt `state`, `display`, `size` — Werte, keinen Timer. **Ich schärfe die
   Regel um einen zweiten Halbsatz**, der beide Wellen weiter deckt: *Ein Baustein, der den
   Namen des Merkmals trägt, gehört ins Merkmal, auch wenn seine Eigenschaften Werte sind.*
   Ein Ordner `timer/`, in dem der Timer nicht liegt, verfehlt genau das Kriterium des
   Auftraggebers. Zweite Benutzer sind `screens/DashboardScreen.tsx` und
   `showcase/TimeSection.tsx` — beide dürfen nach der Präzedenz aus Welle 1 und 2 ins Merkmal
   greifen.
3. **Die Screens behalten ihre Namen** (`TimeScreen.tsx`, `BookingsScreen.tsx`), wie in Welle 1
   und 2.
4. **`features/timer/idle.ts` heißt nicht `idleActivity.ts`** — der alte Name bleibt, der Ordner
   trägt die Unterscheidung.
5. **`Pagination` und `Page` bleiben in `api/endpoints.ts` bzw. `api/types.ts`** und werden von
   beiden neuen Aufrufdateien nicht gebraucht.

---

## 12  Risiken

- **Zeilennummern in Papieren zeigen ins Leere** — dieselbe Klasse wie in Welle 1 und 2.
  Gemessen, nicht angefaßt (fremde Hoheit):
  - `docs/design/textbestand.md:2468` — `app/TimerContext.tsx`; `:3069` —
    `screens/BookingDialogs.tsx`
  - `docs/design/traeger-und-zusage.md:1835–1836` — `components/Timer.tsx`,
    `screens/BookingDialogs.tsx`, `screens/BookingsScreen.tsx`
  - `tests/e2e/timer-stop-announcement.spec.ts:9` und `:26`,
    `tests/e2e/timer-switch-scrim-toast.spec.ts:11`,
    `tests/e2e/pool-movement-sentence.spec.ts:11` — alle `app/TimerContext.tsx`
  - `tests/e2e/manual-booking-movement.spec.ts:15` — `screens/BookingDialogs.tsx`
  - `.claude/team/board.md:1372` — `screens/TimeScreen.tsx:66` (gestrichener Eintrag O-DG)
- **Keine Sicherheitsfläche berührt.** Kein neues `fetch`, kein neuer `request`-Ort außer den
  zwei gemessenen Aufrufdateien, keine Adresse, kein Öffnen-Befehl, keine CSP.
  `proof:release-safety` (32/0), `proof:route-policy` (44/0) und `proof:shell-surface`
  (7 Prüfungen + 54 Gegenproben) unverändert grün.
- **Die Rundung ist nicht angefaßt.** `formatQuarters` ist aus `TimerContext` nach
  `stopMessage.ts` gewandert und rechnet dort dasselbe; gerundet wird weiterhin ausschließlich
  im Dienst, die Oberfläche liest `insight.quarters`.
- **Die Inaktivität ist verschoben, nicht verändert.** `idleCandidate`, `idleReturnTime`,
  `idleTimestamp` und die ganze Ablauffolge in `useIdleTimer` stehen zeichengleich; der
  Prüffall `apps/web/test/idle.test.ts` läuft unverändert grün.
- **Der A-19.19-Widerspruch ist nicht berührt.** An der Add-in-Fläche nichts gebaut, weder aus-
  noch zurück.

---

## 13  Offene Fragen

1. **`toast-eviction.spec.ts:123`** (Abschnitt 9) — der fünfte rote Fall. Auf die Liste, und ein
   Auftrag für den, dem das Kanban-Spaltenmenü gehört.
2. **`apps/web/test/**`** (Abschnitt 10) — die Regelfrage aus T-251 zum dritten Mal: Zieht der
   unit-tester Prüfpfade im selben Auftrag nach, oder darf frontend-dev die Importzeile fassen?
3. **`screens/parts.tsx`** — Welle 1 und 2 haben gefragt, Welle 3 fragt wieder, jetzt mit vier
   rückgreifenden Merkmalsordnern. Nach der Schnittregel gehört es nach `shared/ui/`
   (`ScreenHeader({ title, lead, actions })` nimmt Werte). Soll Welle 4 es mitnehmen?
4. **Das geteilte `busy` im `TimerProvider`** (Abschnitt 4) — soll die verwaiste Buchung eine
   eigene Sperre bekommen? Das ist die Bedingung dafür, daß E-036 je aus `TimerContext.tsx`
   ausziehen kann, und es ist eine **Verhaltens**entscheidung: Heute sperrt ein laufendes
   Auflösen der verwaisten Buchung auch `requestStop`.
5. **`visual-qa` habe ich nicht gefahren** — die Rolle steht mir in dieser Sitzung nicht als
   Werkzeug zur Verfügung. Ersatzweise gemessen: der Bau ist grün und schneidet dieselben
   Stücke, `proof:surface` zählt dieselben 29 Live-Regionen und dasselbe Raster, `contrast` ist
   zeichengleich, und die gerenderten Timer-, Inaktivitäts- und Buchungsflächen werden von
   **90 bestandenen E2E-Zusicherungen** bedient. Es gibt keine Änderung an CSS (außer einer
   Pfadangabe im Kommentar), an Klassennamen oder an JSX-Text. Ein Abnahmeblick bleibt offen.

---

## 14  Nächster Schritt

`features/export` als Welle 4 — `ExportScreen.tsx` (1338 Zeilen) ist jetzt der schwerste Fall im
Baum, und das Muster hat dreimal getragen. Es nähme `ExportScreen`, `ExportAuditScreen`,
`components/Export*` (fünf Dateien), `app/exportAudit.ts`, `app/exportSummary.ts`,
`lib/exportTemplateModel.ts`, `lib/exportDirectoryAdvice.ts`, die Vorlagenansichten und die
Exportrouten mit — **und dann auch `app/dayGroup.ts`**, dessen fünf Leser alle dieselbe eine
Frage stellen: was der Export aus offenen Buchungen macht. Danach ist `api/endpoints.ts` klein
genug, daß `board`, `structure` und `settings` in einem Zug gehen.

Vor Welle 4 gehören die Fragen 1 und 2 beantwortet; Frage 3 wäre in Welle 4 billig
mitzunehmen, weil `ExportScreen` ohnehin `screens/parts.tsx` liest.
