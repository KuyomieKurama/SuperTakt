# T-115 — Wiedervorlage Code, Welle E bis H

**Umfang.** `git diff aca53df..71c6695`. Der Bereich enthält **neun** Commits, nicht vier: die
vier Wellen `4d1da1c` (E), `3282322` (F), `4dd3171` (G), `71c6695` (H), dazu `b51a2cb` (Welle D,
Einheitentests und Wiedervorlagen), `10556ad`/`ece52a7` (Prüfsummen vor der Veröffentlichung,
zusammengeführt), `1019ffa` (Typprüfung für `apps/desktop/test` und `tests/e2e`) und `6b22165`
(`typecheck:e2e` in die Kette). 134 Dateien, +15 706/−1 409.

Gelesen: `CLAUDE.md` (Stand `71c6695`, mit `packages/ui-tokens/**` bei frontend-dev), E-054 bis
E-062, `R-1a`, die Berichte T-101 bis T-113 und die Board-Abschnitte der vier Wellen.

**Ausgeführt und gemessen** (2026-09-04, 11:0x–11:2x):

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` (8 Pakete, 6 Test-Konfigurationen, `tests/e2e`) | **0** |
| `pnpm run test` | **787/787**, 53 Dateien |
| `pnpm run boundaries` | **0** — 321 Dateien auf Tiefenzugriffe, Notiz-Trennung unverletzt |
| `pnpm run proof:all` | Exitcode **0**, 13 Nachweisketten, **0** fehlgeschlagen (u. a. `proof:addin` 134/0, `proof:openapi` 105/0, `proof:addin-wiring` 32/0) |

`pnpm check`, `test:e2e` und `verify:bundle` habe ich auftragsgemäß **nicht** gefahren; die Ports
17843/17844 habe ich nicht belegt und keinen fremden Prozess beendet.

**Einschränkung zur Messung.** Während der Durchsicht arbeitete integration-dev an T-114. Der
Arbeitsbaum trug bei den Läufen zeitweise `apps/local-api/src/routes/addin/schema.ts`,
`apps/local-api/openapi/takt-local-api.yaml`, `apps/outlook-addin/scripts/proof-addin.mjs`,
`apps/outlook-addin/src/office/mail.ts` und `apps/outlook-addin/src/ui/TaskPane.tsx` als
geändert. Die Läufe oben schließen diese Änderungen also ein. Sie verschärfen nur Prüfungen
(Steuerzeichen an `title`/`tagNames`) und nehmen nichts weg; die Aussage „`71c6695` übersetzt,
prüft und beweist sich" bleibt damit tragfähig, ist aber nicht isoliert gemessen. **Alle
Zeilennummern zu diesen fünf Dateien habe ich aus `git show 71c6695:…` genommen, nicht aus dem
Arbeitsbaum.** Was sich dort während der Prüfung geändert hat, gehört zur nächsten Runde.

Gewichte nach Auftrag: `muss` (hält die Freigabe auf), `sollte` (vor dem Zusammenführen),
`Hinweis`.

---

## 1. Die eine Form der Poolbewegung — Zuordnung Vorgang → Rechnung, acht Mal nachgerechnet

Gefragt war, ob die Zuordnung an jeder Stelle stimmt. **Sie stimmt an allen acht.** Ich habe sie
nicht gelesen, sondern gegen die Schreibpfade gehalten:

| Vorgang | Rechnung | Wirkung | belegt an |
|---|---|---|---|
| `POST /timer/start`, verdrängt Timer **desselben** Todos | `bookingMovementStates` | `BOOKING_EFFECT` | `timer.ts:242-244`; `repo-time.ts:381-386` schreibt `completed_at = NULL`, `:366-369` schließt den verdrängten Timer ab |
| `POST /timer/start`, sonst | `completionMovementStates(…, null)` | Erledigt-Achse | `timer.ts:244`; der frische Timer trägt `ended_at NULL` (`:390-393`) und ist keine Buchung |
| `POST /timer/stop` | `closedEntryMovementStates` | `ENTRY_CLOSED_EFFECT` | `timer.ts:393`; `repo-time.ts` `stop` schreibt `ended_at`, `note`, `updated_at` — nichts an `todo` |
| `POST /timer/orphaned/resolve` (gebucht) | `closedEntryMovementStates` | dito | `timer.ts:575`, derselbe `movementOfBooking` |
| `POST /time-entries` | `closedEntryMovementStates` | dito | `timer.ts:682`; **nachgeprüft:** `repo-time.ts:174-189` fügt eine Zeile in `time_entry` ein und sonst nichts, und **kein** Trigger schreibt `completed_at` (`grep 'CREATE TRIGGER'` über alle 24 Migrationen, `completed_at` steht nur in `0001` und `0011`, beide ohne Trigger) |
| `PUT /todos/{id}/done` | `completionMovementStates` | Erledigt-Achse, Anlaß `'booking'` | `usecases/todos.ts:332` |
| `DELETE /todos/{id}/done` | dieselbe Funktion, Anlaß `'reopen'` | dito | `usecases/todos.ts:358`, `lib/movement.ts:70` |
| beide Add-in-Routen | `bookingMovementStates` | `BOOKING_EFFECT` | `routes/addin/service.ts:238`; `bookOnTodo` ruft `clearDone` in derselben Transaktion (`:690`) |

**Die Korrektur aus T-107 trägt.** Der Nachtrag zu E-061 nannte ursprünglich
`bookingMovementStates` für `POST /time-entries`; das wäre falsch gewesen, und die Begründung des
domain-dev ist an der Quelle nachweisbar, nicht nur plausibel: Die Route hebt „Erledigt" nicht
auf, weder im Adapter noch über einen Trigger. Mit `BOOKING_EFFECT` meldete sie für ein
erledigtes Todo ein Verlassen jeder `completion: 'done'`-Spalte, das nicht stattfindet.
`apps/local-api/test/usecases/time-entry-movement.test.ts:225` und
`tests/e2e/manual-booking-movement.spec.ts:253` messen genau diesen Unterschied. **Ein Befund
bleibt trotzdem**, siehe (1): Die Oberfläche schreibt in ihrem Vertragskommentar weiterhin den
falschen Namen.

**Die Bedeutung von `null` ist überall dieselbe** — „hier war keine Bewegung möglich", im
Unterschied zu drei leeren Listen („nachgesehen, nichts gefunden"). Die vier Wachen sind
dieselbe Aussage in vier Formulierungen, und alle vier sind richtig:

```
timer.ts:238            !doneCleared && !(bookedOnThisTodo && !presence.hasOpen)
timer.ts:382            presence.hasOpen                       (Stopp, verwaiste Buchung, Hand)
addin/service.ts:232    todo.completedAt === null && entries.hasOpen
usecases/todos.ts:325   before.completedAt === after.completedAt
```

Jede ist die Bedingung „das Zustandspaar wäre zweimal derselbe Wert". Die zweite Bedeutung von
`null` — „das Todo war nicht zu lesen" (`timer.ts:233`, `:387`) — liegt hinter einem
Fehlerzweig, der vorher genommen wurde; beide Stellen sagen das im Kommentar.

**Transaktionsgrenzen.** `createTimeEntry` (`timer.ts:675-684`), `switchTodoDone`
(`usecases/todos.ts:311-334`), `stopTimer`, `resolveOrphanedTimer` und `bookOnTodo` lesen den
Vorzustand **innerhalb** derselben Klammer, in der sie schreiben, und der Namensgeber läuft
ebenfalls innen. `bookOnTodo` nimmt bei fehlgeschlagenem `clearDone` die Buchung über
`AbortBooking` mit zurück (`service.ts:696`) — unverändert richtig.

---

## 2. Befunde

```
apps/web/src/api/types.ts:581                     sollte    frontend-dev
```
**Der Vertragskommentar nennt die Rechnung, die ausdrücklich nicht benutzt wird.** „Der Dienst
rechnet die Bewegung deshalb nach derselben Rechnung wie der Timerstopp
(`bookingMovementStates`)" — der Timerstopp rechnet mit `closedEntryMovementStates`, und
`POST /timer/stop` wie `POST /time-entries` tun es auch. Der Klammerausdruck ist die
Erstfassung des E-061-Nachtrags, die T-107 richtiggestellt hat; sie steht hier als einzige
Stelle im ganzen Baum noch (`grep` über Quelltext, OpenAPI, `docs/**`: alle anderen elf
Fundstellen nennen `closedEntryMovementStates`). Das ist genau der Kommentar, dem jemand glaubt:
Wer ihn liest und den Dienst „angleicht", baut den Fehler ein, gegen den
`ENTRY_CLOSED_EFFECT` in T-101 eingeführt wurde. **Fix:** `bookingMovementStates` →
`closedEntryMovementStates`, dahinter den Halbsatz aus `usecases/timer.ts:621-625` („die Buchung
von Hand hebt „Erledigt" nicht auf, A-2.5").

```
apps/local-api/src/usecases/todos.ts:337          sollte    domain-dev
```
**„Die Kanban-Spalte bleibt (E-023)" — an derselben Funktion, die das Gegenteil ausrechnet.**
Der Einzeiler an `markTodoDone` behauptet, das Erledigen lasse die Spalte unberührt; seit E-054
ist eine Spalte eine Regel und seit E-055 fragt sie nach „Erledigt", und `switchTodoDone` fünf
Zeilen darüber rechnet die Bewegung über `list('all')` — reine Board-Spalten eingeschlossen. Das
ist wörtlich W-3 aus R-2a, eine Ebene höher: In `packages/storage/src/sqlite/repo-todos.ts:567`
ist der Satz in T-101 durch fünfzehn richtige Zeilen ersetzt worden, hier ist er stehengeblieben.
**Fix:** dieselbe Aussage wie dort — der **Status** bleibt (E-023), Pools und Spalten nicht
(E-060).

```
apps/web/src/lib/movement.ts:74                   sollte    frontend-dev
apps/web/src/lib/movement.ts:32
```
**Die Datei, die es „genau einmal" geben soll, zählt ihre Aufrufer unvollständig auf.**
`bookingSentence` trägt „Stopp und verwaiste Buchung" im Titel und „**Beide** Antworten, die
diese Funktion versorgen" im Rumpf. Es sind seit T-108 **drei**: dazugekommen ist
`POST /time-entries` (`screens/BookingDialogs.tsx:128`). In der Zuordnungstabelle `:28-34`, deren
erklärter Zweck es ist, die Verwechslung des Anlasses unmöglich zu machen, fehlt die Zeile
ebenfalls. Kein Fehlverhalten — der Anlaß ist in allen drei Fällen `'booking'` —, aber die
Tabelle ist die einzige Stelle, an der die Zuordnung überhaupt geprüft werden kann. **Fix:** Zeile
`| POST /time-entries | 'booking' | Die Buchung von Hand kann die erste sein (O-V) |` ergänzen,
„Beide Antworten" → „Alle drei Antworten".

```
apps/local-api/openapi/takt-local-api.yaml:4195   sollte    domain-dev
```
**Die Aufzählung, die „vollständig geführt" wird, zählt sich selbst falsch.** „Es waren einmal
drei Vorgänge; inzwischen sind es **sieben**, und die Aufzählung wird hier vollständig geführt,
weil eine unvollständige den Eindruck erweckt, die übrigen schwiegen." Die Tabelle darunter
(`:4199-4208`) hat **acht** Zeilen; die achte (`POST /time-entries`) ist in Welle G dazugekommen,
die Zahl im Satz nicht. Genau die Sorte Zahl, an der man abliest, ob man alle hat. **Fix:**
„sieben" → „acht".

```
apps/web/src/app/ToastContext.tsx:189             Hinweis   frontend-dev
```
**Die Acht-Sekunden-Regel ist keine, solange Meldungen nachkommen.** `ToastItem` hängt seinen
Zeitgeber an `[hasAction, onDismiss]`, und `onDismiss` entsteht in `ToastProvider` als
`() => dismiss(toast.id)` bei **jedem** Zeichnen neu (`:174`). Jede neue oder geschlossene
Meldung zeichnet den Anbieter neu, damit wechselt die Kennung der Funktion, damit läuft der
Aufräumer und der Zeitgeber beginnt von vorn. Regel 1 im Dateikopf („Ohne Rückweg schließt die
Meldung nach acht Sekunden") gilt also als „acht Sekunden nach der letzten Änderung am Stapel".
**Fix:** `id` und das stabile `dismiss` an `ToastItem` durchreichen, Abhängigkeiten
`[hasAction, id, dismiss]`. **Achtung, ein Test hängt daran:**
`tests/e2e/toast-eviction.spec.ts:84` löst fünf Meldungen nacheinander aus und erwartet danach
`toHaveCount(4)`; das geht heute nur auf, weil die Frist der ersten mitläuft. Nach dem Fix
braucht der Fall eine eigene Absicherung (Uhr anhalten oder die vier Meldungen ohne Wartezeit
auslösen) — e2e-tester.

```
apps/local-api/src/http/input.ts:111              Hinweis   domain-dev
```
**Die Richtungszeichen sind zur Hälfte erfasst.** `FORBIDDEN_IN_NAMES` deckt die Einbettungen und
Überschreibungen (`U+202A`–`U+202E`) und die Isolate (`U+2066`–`U+2069`) ab, nicht aber die
**Marken** `U+200E` (LRM), `U+200F` (RLM) und `U+061C` (ALM). Der Kommentar darüber begründet die
Klasse mit „Sie stehen in keinem geschriebenen Namen und drehen den Rest der Zeile optisch um" —
das trifft auf die Marken ebenso zu, sie wirken nur schwächer. Da der Regelname seit T-107 als
`details[].name` **ohne umgebenden Text** in einen Löschdialog geht, ist das die Stelle, an der
es zählt. **Fix:** `\u061c` sowie `\u200e-\u200f` in die Zeichenklasse (als Escape-Folge geschrieben, nicht als rohes Zeichen — T-112-H2); der Kommentar nennt die
Klasse und nicht die Codepunkte, er bleibt richtig.

```
packages/storage/src/ports.ts:217                 Hinweis   domain-dev
```
**Die einzige der drei Sperren ohne Vertrag.** `TagFolderPort.remove` (`:281-289`) und
`TodoStatusPort.remove` beschreiben, dass `details` je Regel `code: 'pool_rule'`, die Kennung in
`field`, den Namen in `name` und den Satz in `message` trägt. `TagPort.remove` steht nackt da,
obwohl der Adapter das seit T-101 ebenso liefert (`repo-tags.ts:249-255`) und die Oberfläche es
liest (`errorText.ts:111`). Ein Port sagt zu, was er liefert; wer nur den Port liest, weiß es
hier nicht. **Fix:** dieselben drei Zeilen an `:217`.

```
apps/local-api/openapi/takt-local-api.yaml:4229   Hinweis   domain-dev
apps/local-api/openapi/takt-local-api.yaml:4233
apps/local-api/openapi/takt-local-api.yaml:4237
```
**Die Feldbeschreibungen sagen „Pools", der Absatz darüber sagt, dass es nicht nur Pools sind.**
`:4178-4192` erklärt ausführlich, dass auch reine Kanban-Spalten in den drei Listen stehen und
dass sie „Namen, aber keine Fläche" tragen. Die drei `description`-Zeilen der Felder nennen sie
trotzdem durchweg „Pools". Das ist W-15 in klein und in derselben Datei. **Fix:** „Regeln — Pools
wie Board-Spalten", wie an `:3023-3060` bereits geschehen.

```
apps/local-api/openapi/takt-local-api.yaml:1790   Hinweis   domain-dev
apps/local-api/src/usecases/timer.ts:235
```
**Der verdrängte Timer eines *anderen* Todos bewegt dieses Todo, und niemand sagt es.**
`POST /timer/start` mit `stopRunning: true` schließt den laufenden Timer ab. Lief er auf einem
anderen Todo, entsteht dort möglicherweise die **erste** abgeschlossene Buchung, und jede Regel
mit `exportState: 'open'` nimmt jenes Todo auf — die Antwort meldet nur die Bewegung des
gestarteten Todos, und die Beschreibung sagt zur Lage nichts. Nach der Begründung aus E-058
Punkt 6 ist das die halbe Wahrheit. **Die Hauptanwendung ist nicht betroffen:**
`TimerContext.confirmSwitch` (`:550-551`) stoppt und startet in zwei Aufrufen, der Stopp trägt
seinen eigenen Satz. Betroffen ist allein der direkte Aufruf mit `stopRunning: true`. **Fix:** ein
Satz in der Tabellenzeile — „die Bewegung eines **verdrängten** Todos meldet diese Antwort nicht;
wer sie braucht, stoppt und startet getrennt" — oder ausdrücklich als offener Punkt aufnehmen.

```
apps/local-api/src/usecases/timer.ts:517          Hinweis   domain-dev
apps/local-api/src/usecases/timer.ts:571
```
**Unverändert aus R-1a:** `resolveOrphanedTimer` fragt die Uhr und wirft die Antwort mit
`void timestamp;` weg (gebucht wird bis zum Lebenszeichen). Der Wurf steht jetzt zusätzlich
**hinter** dem verworfenen Zweig, also mitten im gebuchten — er liest sich, als gehörte er
dorthin. **Fix:** `now(context)` streichen oder in einer Zeile begründen, warum es stehenbleibt,
und den `void` an die Fundstelle setzen.

```
apps/desktop/test/paths.test.ts:21                Hinweis   unit-tester
apps/desktop/test/paths.test.ts:36
```
**Der Kopf beschreibt einen Zustand, den `1019ffa` beendet hat.** „Eine `tsconfig.test.json`
anzulegen ist eine gemeinsame Datei … und wird hier deshalb **nicht** angelegt. `pnpm run
typecheck:test` deckt diese Datei folglich nicht ab." Es gibt sie
(`apps/desktop/tsconfig.test.json`), `package.json` ruft sie, und der Lauf ist grün. Damit ist
das `@ts-expect-error` an `:36` sogar **nachgewiesen** — bekämen die Skripte Typen, fiele es auf.
Der Kommentar verschenkt seine eigene stärkste Aussage. **Fix:** die beiden Absätze auf den
heutigen Stand ziehen.

```
packages/storage/src/sqlite/repo-tags.ts:253      Hinweis   domain-dev
packages/storage/src/sqlite/repo-tags.ts:568
```
**„Regel eines Pools" für eine reine Board-Spalte.** `repo-statuses.ts:322` sagt bei derselben
Lage „die Regel eines Pools **oder einer Kanban-Spalte**". Beide Tag-Sperren nennen nur den Pool,
obwohl `pool_rule` seit E-054 beides führt und der Benutzer den genannten Namen dann in der
Pool-Liste vergeblich sucht. **Fix:** den Wortlaut aus `repo-statuses.ts` an beiden Stellen
übernehmen.

```
packages/ui-tokens/tokens.css:385                 Hinweis   frontend-dev
```
**Die Begründung sagt das Gegenteil dessen, was der Wert bewirkt.** „Hoeher als alles andere,
weil eine Meldung ueber den Ausgang einer Handlung **nichts verdecken darf**, was der Benutzer
gerade liest." Ein hoher Wert bewirkt, dass sie verdeckt; gemeint ist offensichtlich „nicht
verdeckt werden darf". Der zweite Absatz (die Ausnahme unter dem Dialog) ist richtig und gut
belegt. **Fix:** ein Wort. Der Text stammt vom Orchestrator; die Datei gehört seit T-110
frontend-dev.

```
apps/local-api/src/routes/addin/schema.ts:74      Hinweis   integration-dev (läuft bereits)
```
Im Stand `71c6695`: „Der Wortlaut des Schemas ist zeichengleich der aus `routes/todos.ts`
(`nameSchema` = `z.string().trim().min(1).max(200)`)". Seit T-101 ist `nameSchema`
`withoutControlCharacters(z.string().trim().min(1).max(200))`; zeichengleich ist es nicht mehr,
und die Aussage deckt genau die Lücke zu, die T-112-1 gefunden hat. **Wird in T-114 behoben** —
die Datei liegt geändert im Arbeitsbaum, mit richtiggestelltem Kopf. Hier nur der
Vollständigkeit halber, kein offener Auftrag.

```
apps/local-api/test/usecases/*.test.ts            Hinweis   unit-tester
packages/storage/test/*.test.ts
```
**`unit as unknown as UnitOfWork` und `… as unknown as AppContext` in fünf Prüfdateien.** Die
Attrappe füllt, was der Anwendungsfall heute ruft; die Zusicherung schaltet die Prüfung ab, ob
sie noch reicht. Bekommt `UnitOfWork` eine Methode, die der Anwendungsfall benutzt, wird nicht
`tsc` rot, sondern der Lauf mit „is not a function". Der Schaden ist begrenzt (es fällt sofort
auf), aber der Nachweis ist schwächer, als er sein müsste. **Fix beim nächsten Anfassen:** die
Attrappe gegen `Pick<UnitOfWork, …>` bauen und mit `satisfies` festnageln, statt sie auf den
ganzen Typ zu heben.

```
apps/web/src/app/TimerContext.tsx:219             Hinweis   Orchestrator
```
**`undoReactivation` ist drei Aufrufe und keine Klammer.** Stoppen, Buchung löschen, „Erledigt"
setzen — schlägt der zweite oder dritte fehl, bleibt ein Zwischenstand stehen (Buchung da, Todo
offen), und die Meldung „Das Zurücknehmen hat nicht geklappt" sagt nicht, wie weit es gekommen
ist. Das ist **nicht neu** in dieser Runde (T-097) und die Wirkung ist keine falsche Abrechnung —
eine offen liegengebliebene Buchung ist sichtbar und löschbar. Es ist aber die einzige Stelle in
der Anwendung, an der eine mehrschrittige Rücknahme ohne gemeinsame Klammer läuft. **Vorschlag:**
entweder die Meldung nennt den erreichten Zustand, oder der Rückweg bekommt eine eigene Route.
Braucht eine Entscheidung, deshalb an den Orchestrator.

```
apps/web/src/screens/BoardScreen.tsx:179          Hinweis   spec-ux-reviewer
```
**Zwei Schutzniveaus für dieselbe Handlung, wieder.** „Erledigt" aus der Todo-Liste bietet
„Rückgängig" im Toast (`TodoListScreen.tsx:215-221`), dieselbe Handlung vom Board aus nicht
(`BoardScreen.tsx:179-190`). Das ist die Lage, die S-5 aus R-2 und E-059 für „Vom Board nehmen"
zugunsten der einheitlichen Fassung aufgelöst haben. Kein Codefehler; gehört zu R-2b.

---

## 3. Nachgezogene Hinweise aus R-1a und R-3a — alle sieben erledigt, jeder gemessen

| Punkt | Stand |
|---|---|
| **H-2** Steuer- und Bidi-Zeichen | **erledigt.** `http/input.ts:111` weist C0, C1 und die Bidi-Einbettungen/Isolate ab, `titleSchema` und `nameSchema` teilen **eine** Prüfung (`:121`), die Meldung gibt den Wert nicht wieder. Lücke bei den Bidi-**Marken**, siehe Befund oben |
| **H-3** Obergrenze in `details` | **erledigt, und besser als verlangt.** `RULE_REFERENCE_LIMIT = 20`, `RULE_REFERENCE_PROBE = 21` (`mappers.ts:279-282`), alle **drei** Sperren fragen mit `LIMIT` und einer Zeile mehr (`repo-tags.ts:245`, `:560`, `repo-statuses.ts:316`), die Kürzung steht im Meldungstext statt still zu sein |
| **H-4** `legacy_alter_table` im `finally` | **erledigt.** `migration-runner.ts:304`, ohne Bedingung und mit der Begründung, warum ohne (`OFF` ist die Vorgabe, ein Textvergleich könnte einen Fall verfehlen) |
| **W-1** `TagPort.remove` ohne `details` | **erledigt**, `repo-tags.ts:239-256`, mit `ORDER BY p.position, p.name` wie beim Ordner |
| **W-2** O-R, `orphan_discarded` | **erledigt.** Eigener `ResolveOrphanedTimerResult` über `StopOutcome<Reason>` (`timer.ts:303-333`), der Grund kommt aus `decision.reason` (`:547`), `POST /timer/stop` behält seinen einen Wert. „Unterscheiden, nicht kürzen" ist genau so umgesetzt |
| **W-3** CASCADE-Begründungen | **erledigt.** `repo-tags.ts:189-210` und `repo-statuses.ts:275-291` beschreiben jetzt die Lage seit 0012 und benennen ausdrücklich, was vorher falsch dastand |
| **W-4** `labels.ts` Aufzählungen | **erledigt.** Acht Aufzählungen kommen aus der Domäne (`labels.ts:47-67`, `Theme as ThemeSetting`), eine bleibt mit genanntem Grund (`DoneFlagState`) |
| R-1a (5) Untergrenze Prüfsummen | **erledigt, und besser.** `verify-node-checksums.mjs:123` prüft `MIN_ARCHIVES`, `:141-167` zusätzlich gegen die ausgeführte `ARCHIVES`-Tabelle in beide Richtungen samt Prüfsummenabgleich — der Ausdruck kann nicht mehr still weniger finden |
| R-1a (6) `popstate` in einer Engine | **erledigt.** `navigate()` vergleicht mit `shownHash()` und meldet den Wiederbesuch selbst (`router.ts:215-226`), `popstate` bleibt Ergänzung. Der Weg aus dem Programm hängt an keiner Engine mehr |
| R-1a (7) Platzhalter bei `bump()` | **erledigt.** `useAsync` hat zwei Abhängigkeitslisten (`useAsync.ts:94-114`), `version` läuft über `refreshDeps` → `run(true)`, der Inhalt bleibt stehen |
| **H-5** `decodeURIComponent` | **erledigt**, `router.ts:88-95`, Rückfall auf den Rohtext mit genannter Begründung |
| **H-6** Mindestabstand | **erledigt**, `useDataFreshness.ts:98`, 1 s, ausdrücklich **nicht** am `revisit` |
| **W-8/W-11/W-13** | **erledigt.** `pool-movement.ts:76-90` nennt `ux_pool_name`; `poolReference` ist der einzige Bildungsort (`grep` über `apps/**`, `packages/**`: eine erzeugende Stelle, `mappers.ts:244`, ein lesender Schlüssel, `errorText.ts:82`); „Regel über Tags" ist an allen genannten Stellen ersetzt |
| **W-9** `ReactivationNotice` | **erledigt, ersatzlos**, mit einer Notiz an seiner Stelle (`Timer.tsx:143-166`) und den `.reactivation*`-Stilen |
| `service-scenario.mjs:757` | **erledigt**, die Prosa nennt die eine Form |

---

## 4. Was ich zusätzlich geprüft habe und wozu es keine Arbeit gibt

**Typsicherheit.** Kein `any`, kein `@ts-ignore` im Produktivcode. `@ts-expect-error` genau
einmal, in einem Prüffall, begründet und nachgewiesen. `as unknown as` ausschließlich in
Prüfdateien (Kennungsmarkierung und Attrappen, siehe Hinweis). `err(outcome.error as never)`
steht unverändert 24-mal in den Adaptern — unverändert aus R-1a, kein neuer Zuwachs.

**`TaktFieldError.name`.** Freiwillig (`kernel.ts:177`), mit genanntem Grund („ein Befund über ein
Eingabefeld hat nichts zu benennen"). Die Oberfläche behandelt sein Fehlen als beschriebenen
Vertragsfall und nicht als stillen Rückfall: `ruleList` (`errorText.ts:109-116`) entscheidet über
das Gattungswort für den **ganzen** Satz und nicht je Eintrag, damit „die Regeln Regel „Ost“"
nicht entstehen kann. `TaktApiError.details` ist in T-110 auf `ApiFieldError` gezogen worden —
vorher hätte die strukturelle Zuweisbarkeit das vierte Feld verschluckt; das ist ein guter Fund.

**`CreateTimeEntryResult` und `TodoDoneResult` als flache Formen.** `TimeEntry & { poolMovement }`
bzw. `Todo & { poolMovement }`, zusammengesetzt im Adapter (`routes/time.ts:297-301`,
`routes/todos.ts:294-296`), nicht im Anwendungsfall — der liefert weiter `{ entry, poolMovement }`
bzw. `{ todo, poolMovement }`. Die Grenze sitzt richtig: Der Anwendungsfall entscheidet nichts
über HTTP, der Adapter nichts über die Sache. Additiv, kein Aufrufer bricht.

**Die Ebenen-Regel.** `body:has(.scrim) .toast-layer { z-index: calc(var(--z-scrim) - 1) }` plus
`body:has(.scrim) .toast { pointer-events: none }`. Nachgesehen: `.scrim` wird an genau vier
Stellen gesetzt (`ConfirmDialog`, `FormDialog`, `InfoDialog`, `ShellStatus` mit
`scrim--blocking`), alle vier sind modal — die Regel greift nirgends zu weit. Kein Dialog
schließt bei einem Klick auf die Abdunklung, ein auf die Meldung gezielter Klick verwirft also
keine Eingabe. `--z-popover` (320) bleibt über dem Dialog, die Auswahllisten funktionieren weiter.
Die Begründung im Stilblatt ist gemessen und nicht behauptet (`elementFromPoint`, drei
Fenstergrößen) — das ist die Sorte Beleg, die ich sehen will.

**Verschluckte Fehler.** Zwei neue `catch` in dieser Runde: `router.ts:92` (`decodeURIComponent`,
Rückfall auf den Rohtext, begründet und die richtige Richtung) und `migration-runner.ts:272`
(`ROLLBACK` auf einer bereits beendeten Transaktion, mit Grund). Kein stilles `null`, kein
`?? []` über eine Bewegung. `NOTHING_MOVED` in `duplicate/reopen.ts:100` ist der einzige
Rückfallwert im Bewegungspfad; er ist unerreichbar (der Dienst liefert für ein erledigtes Todo
immer einen Wert, `service.ts:232`) und zeigt in die vorsichtige Richtung — er verspricht **kein**
Wiederauftauchen. Vertretbar und begründet.

**Doppelte Fachlogik.** `BOOKING_EFFECT`/`ENTRY_CLOSED_EFFECT` stehen einmal, in
`packages/domain/src/time-entry.ts:429-496`, beide `Object.freeze`. Die zweite Fassung im
Add-in-Dienst ist weg. Die drei Zustandspaare stehen einmal, in `usecases/pool-movement.ts`, und
alle acht Vorgänge rufen sie. `offerMovement` im Add-in ist ersatzlos entfallen. Rundung,
Base64 und der Exportstatuswechsel sind in dieser Runde nicht angefasst worden;
`check-export-boundary.mjs` meldet 321 Dateien geprüft, Notiz-Trennung unverletzt.

**Deutsch und Englisch.** Durchgehend eingehalten, auch in den neuen Dateien (`errorText.ts`,
`movement.ts`, `poolRule.ts`, `RuleSummary`-Zusatz).

**Hoheit.** Kein neuer Verstoß. Die einzige Abweichung dieser Runde ist die von T-104 selbst
gemeldete und vom Orchestrator angenommene Anpassung an `apps/local-api/scripts/proof-openapi.mjs`
und `proof-addin-wiring.mjs` als Vertragsfolge. Die Lücke `packages/ui-tokens/**` ist mit
`71c6695` in `CLAUDE.md` geschlossen.

---

## Urteil

**freigegeben** für Welle E bis H.

Es blockiert **nichts**. Kein Befund dieser Runde führt zu Datenverlust, zu einer doppelten
Abrechnung oder zu einer Regel, die mehr trifft als gesagt. Die Sache, um die es in diesen vier
Wellen ging — eine Rechnung, eine Wirkung, eine Form —, ist an allen acht Vorgängen richtig
zugeordnet und an jedem gegen den Schreibpfad belegbar; die Korrektur des domain-dev an meinem
Nachtrag zu E-061 ist die richtige, und sie ist an der Quelle nachweisbar.

Vor dem Zusammenführen einzuplanen sind die vier `sollte`-Befunde, in dieser Reihenfolge:

1. `apps/web/src/api/types.ts:581` — der falsche Rechnungsname im Vertragskommentar. Ein Wort, und
   es ist das Wort, dem der nächste Umbau glaubt.
2. `apps/local-api/src/usecases/todos.ts:337` — W-3 einen Stock höher, an der Funktion, die das
   Gegenteil ausrechnet.
3. `apps/web/src/lib/movement.ts:74`/`:32` — die Zuordnungstabelle kennt ihren dritten Aufrufer
   nicht.
4. OpenAPI `:4195` — sieben gegen acht Zeilen in derselben Tabelle.

Alle übrigen sind Hinweise; der einzige mit einer Nebenwirkung ist `ToastContext.tsx:189`, weil
ein End-zu-End-Fall heute daran hängt.

**Was in die nächste Runde gehört und hier nicht bewertet ist:** T-114 (integration-dev) lag
während der Prüfung im Arbeitsbaum — `routes/addin/schema.ts`, der Add-in-Abschnitt der OpenAPI,
`proof-addin.mjs`, `office/mail.ts` und `TaskPane.tsx`. Der Befund zu `schema.ts:74` ist dort
sichtbar bereits behoben; geprüft habe ich ihn nicht.
