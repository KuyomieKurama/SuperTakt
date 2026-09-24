# T-117 — Zahlen und Begründungen richtigstellen, die letzte Lücke der Zeichenwache

```
Aufgabe: T-117 — Zahlen und Begründungen richtigstellen, die letzte Lücke der Zeichenwache
Status: fertig
```

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (E-053 bis E-062), `docs/spec.md` (A-2.4, A-2.5,
A-3.4, A-6.8, A-7.4), die Berichte T-114, T-115, T-116 sowie R-2a (W-3, W-4, W-8) und T-101
(Annahme 6, R3).

---

## 1. Auflage 2 (B-9) — die Zahl ist weg, nicht richtiggestellt

Es sind acht, und genau deshalb steht die Zahl jetzt an **keiner** der beiden Stellen mehr. Eine
Zahl, die zweimal falsch geworden ist, weil ein Vorgang dazukam und nur die Tabelle nachgezogen
wurde, wird beim neunten wieder falsch — die Richtigstellung „sieben → acht" hätte den Befund
verlängert und nicht geschlossen.

**`apps/local-api/openapi/takt-local-api.yaml:4296-4310`** (Bauteil `PoolMovement`). Der Satz
nennt jetzt das **Kriterium** statt einer Zahl: „Es liefert jeder Vorgang, der eine der fünf
Achsen einer Regel umlegt — der vollziehende wie der ankündigende." Darunter steht ausdrücklich,
dass die Tabelle die Aufzählung **ist** und die Zahl bewusst nicht mehr daneben („Hier stand erst
„drei", dann „sieben" … Wer einen Vorgang hinzufügt, hängt eine Zeile an; wer wissen will, wie
viele es sind, zählt sie."). Damit gibt es genau eine Stelle, die mitwachsen muss, und sie ist
dieselbe, die man ohnehin anfasst.

**`docs/architektur.md:127-138`.** Dieselbe Bauart, und zusätzlich das Ende der Doppelführung:
Die Architekturbeschreibung zählt nicht mehr mit und zählt nicht mehr auf, sondern nennt das
Kriterium und verweist für die vollständige Liste auf das Bauteil `PoolMovement`. Der historische
Stand steht als Warnung darin („stand erst „drei", und sie wäre jetzt „acht""), nicht als
gepflegter Wert. Der Widerspruch zu `:357-380` ist damit an der Wurzel weg statt an einer von zwei
Stellen berichtigt — die spätere Passage ist die richtige und bleibt die einzige, die Vorgänge
nennt.

**Präzisiert dabei, weil das Kriterium sonst zu weit griffe:** „jeder, der umlegt" hätte
`GET /addin/todo-matches` ausgeschlossen (kündigt an, ohne zu schreiben) und
`PATCH /time-entries/{id}` eingeschlossen (legt um, liefert aber nicht). Beide Fälle sind jetzt im
Satz benannt: „der vollziehende wie der ankündigende", und „eine benannte Ausnahme steht unter der
Tabelle".

**Dritte Fundstelle derselben Klasse, mitbehoben:** `docs/architektur.md:933` sagte in der
Routentabelle „Alle drei schreibenden Vorgänge liefern `poolMovement`". Für die Zeile stimmte das,
als Aussage über den Dienst erweckte es denselben Eindruck wie „sieben". Jetzt: „Jeder schreibende
Vorgang dieser Zeile … — und er ist damit nicht allein", mit Verweis auf das Bauteil.

## 2. `PATCH /time-entries/{id}` — die Begründung zeigt auf O-X

`apps/local-api/openapi/takt-local-api.yaml:4327-4344` und `docs/architektur.md:378-384`. Die alte
Begründung („ändert einen Zeitraum oder eine Leistung; an keiner der fünf Achsen ändert das
etwas") war W-8 in klein: richtige Bauart, falscher Beleg. Die Route nimmt `todoId` entgegen
(`apps/local-api/src/routes/time.ts:66`, `updateEntrySchema`) und hängt die Buchung damit um.

Der neue Text sagt, was tatsächlich der Fall ist: Zeitraum und Leistung berühren keine Achse — das
stimmt —, `todoId` aber schon, und dann bewegen sich **zwei** Todos in entgegengesetzte
Richtungen (das abgebende verliert unter Umständen seine letzte offene Buchung, das aufnehmende
bekommt seine erste). Ein Feld für **eine** Bewegung kann das nicht tragen; welche Antwort
hingehört, ist **O-X** und liegt beim Auftraggeber. Bis dahin schweigt die Route bewusst, statt
die halbe Bewegung zu melden.

**Dazu neu, weil ein Leser der Route es dort sucht und nicht am Bauteil:**
`takt-local-api.yaml:1503-1511`. Die Beschreibung von `PATCH /time-entries/{timeEntryId}` sagte
über `todoId` bisher **nichts** — das Feld stand ohne eine Zeile Erklärung im Rumpfschema, obwohl
es Zeit und Leistung an ein anderes Todo und damit auf eine andere Rechnung hängt (A-7.4). Jetzt
steht dort ein Absatz, der das ausspricht und für die Begründung auf das Bauteil verweist.

## 3. T-115 — `usecases/todos.ts`, W-3 eine Ebene höher

`apps/local-api/src/usecases/todos.ts:338-355`. Aus dem Einzeiler „Die Kanban-Spalte bleibt
(E-023), die Pools nicht (E-060)" ist der Block geworden, den `repo-todos.ts` (`markDone`) seit
T-101 trägt, in derselben Aufteilung:

- **Der Status bleibt** (E-023) — das ist die Aussage, die stimmt, und `markDone` schreibt allein
  `completed_at`.
- **Die Kanban-Spalte bleibt deshalb nicht** — seit E-054 ist eine Spalte eine Regel, seit E-055
  fragt sie nach „Erledigt", und `switchTodoDone` fünf Zeilen darüber rechnet genau diese Bewegung
  über `list('all')`, reine Board-Spalten eingeschlossen, und gibt sie als `poolMovement` heraus
  (E-060).

Der Kommentar nennt beide Belegstellen (Schreibpfad in `packages/storage`, R-2a W-3) und sagt
ausdrücklich, dass hier bis T-117 das Gegenteil stand.

## 4. Sicherheit — die Zeichenwache ist vollständig

`apps/local-api/src/http/input.ts:152-153`:

```ts
const FORBIDDEN_IN_NAMES =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;
```

Dazugekommen sind die **Marken** `U+061C` (ALM), `U+200E` (LRM) und `U+200F` (RLM). Damit deckt
die Klasse alle drei Bauarten bidirektionaler Formatierungszeichen ab: Einbettungen und
Überschreibungen, Isolate, Marken. Der Kopfkommentar (`:82-105`) begründet die Erweiterung mit der
Zeile, die schon dastand — sie stehen in keinem geschriebenen Namen und verändern, wie der Rest
der Zeile aussieht —, und benennt, warum eine halb erfasste Klasse die schlechteste Fassung ist:
Sie liest sich wie eine Regel und ist eine Auswahl.

**Was ausdrücklich erlaubt bleibt und warum:** `U+200B` bis `U+200D`. Das letzte davon (ZWJ) hält
zusammengesetzte Emoji zusammen; es abzuweisen hieße, einem Titel mit einem Familien-Emoji die
Annahme zu verweigern, und dieser Wächter richtet sich gegen Richtungszeichen und nicht gegen
Emoji. Gemessen an den Rändern:

| Zeichen | vorher | jetzt |
|---|---|---|
| `U+061B`, `U+061D` | angenommen | angenommen |
| `U+061C` (ALM) | angenommen | **abgewiesen** |
| `U+200B`–`U+200D` (ZWSP, ZWNJ, ZWJ) | angenommen | angenommen |
| `U+200E`, `U+200F` (LRM, RLM) | angenommen | **abgewiesen** |
| `U+2010` | angenommen | angenommen |
| Familien-Emoji mit ZWJ | angenommen | angenommen |

Die Meldung bleibt zeichengleich („Steuerzeichen und Richtungszeichen sind in einem Namen nicht
erlaubt.") — sie ist in `apps/local-api/test/http/input.test.ts:29` als Konstante festgehalten,
und der Wortlaut trug die Richtungszeichen schon vorher.

**Wirkung über die Haupttür hinaus, ohne fremde Datei:** `apps/local-api/src/routes/addin/schema.ts`
benutzt seit T-114 `titleSchema` und `nameSchema` selbst; die Add-in-Tür weist die Marken damit
ab dem gleichen Augenblick ebenfalls ab. Ich habe die Datei nicht angefasst.

**Die Folge für den Altbestand ist genannt und nicht still migriert** — an drei Stellen, weil sie
an drei Stellen gesucht wird: im Kopfkommentar der Quelldatei (`input.ts:124-141`), in der
gemeinsamen Antwortbeschreibung `UnprocessableEntity` (`takt-local-api.yaml:3594-3616`) und in
diesem Bericht. Wortlaut der Sache: Die Prüfung sitzt am **Eingang**, nicht am Bestand. Ein Name,
der vor ihr angelegt wurde, bleibt lesbar und löschbar, aber ein `PATCH`, der ihn **unverändert**
zurückschickt, endet mit `422` — der Benutzer sieht seinen eigenen, ungeänderten Namen als
unzulässige Eingabe. Jede Erweiterung der Klasse vergrößert diesen Altbestand; die Marken tun es
mit T-117. Eine Migration, die vorhandene Namen umschreibt, wäre dieselbe stille Änderung der
Benutzereingabe, die diese Prüfung an ihrem eigenen Eingang ablehnt (T-101 Annahme 6, R3).

**Nebenbefund, nicht behoben:** Der Kopfkommentar behauptete, `access/session-secret.ts` prüfe
„dieselbe Klasse" am Windows-Benutzernamen. Das stimmte schon vor T-117 nicht und stimmt jetzt
weniger: Dort steht `/[\u0000-\u001f\u007f]/` — C0 und DEL, **ohne** C1 und ohne die
Richtungszeichen. Der Satz ist richtiggestellt (`input.ts:77-84`) und nennt den Unterschied samt
Grund (andere Grenze: `stdin` von der Hülle, nicht eine Anfrage). Ob die Prüfung dort nachziehen
soll, steht unter „Offene Fragen" — der Benutzername geht in die Exportdatei.

## 5. O-AD — `Todo.title`: 500 stimmt an jeder Tür, nicht an der Antwort

Geprüft, und die Antwort ist nicht „überall 500":

| Ort | Grenze | Beleg |
|---|---|---|
| `POST /todos`, `PATCH /todos/{todoId}` | 500 | `titleSchema` (`http/input.ts:167`) |
| `POST /addin/todos` | 500 seit T-114 | `routes/addin/schema.ts`, `title: titleSchema` |
| `todo.title` in der Datenbank | **keine** Längengrenze | `0001_initial.up.sql:75-82`: `TEXT NOT NULL`, `CHECK (length(trim(title)) > 0)`, kein Höchstwert |

Die 512 in `Todo.title` war nie eine Türgrenze, sondern die Obergrenze der **weitesten** Tür — und
die stand bis T-114 im Add-in. Ein damit angelegtes Todo steht weiter im Bestand, weil es keine
Migration gibt, die Titel kürzt. `maxLength: 500` an einer **Antwort** wäre deshalb eine Behauptung
über fremde Bestände, die niemand geprüft hat, und genau die stille Migration, die Punkt 4 ablehnt.

**Entscheidung: die Zahl bleibt 512, die Beschreibung kommt dazu**
(`takt-local-api.yaml:3766-3793`). Sie sagt, dass jede Tür 500 nimmt, woher die 512 stammt, dass
diese Zahl trägt, was eine **Antwort** tragen kann und nicht, was eine Anfrage setzen darf — und
sie nennt die sichtbare Folge für den Benutzer, dieselbe wie bei den Richtungszeichen: Ein solcher
Titel lässt sich nicht unverändert speichern, der Änderungsdialog schickt ihn mit und `PATCH`
weist ihn ab (C-03). Der Weg heraus ist, ihn zu kürzen.

Falls der Orchestrator 500 will, ist das eine Entscheidung mit Migration (Titel kürzen) oder mit
dem ausgesprochenen Verzicht auf die Zusicherung — beides größer als eine Zahl, deshalb nicht von
mir gesetzt.

## 6. O-AB — ausgesprochen, nicht gebaut

Zwei Stellen, weil zwei Leser: die Route und die Rechnung.

`takt-local-api.yaml:1808-1827` (`poolMovement` am `201` von `POST /timer/start`): „Das Feld trägt
die Bewegung des gestarteten Todos und nur diese (O-AB)." Beendet `stopRunning` einen Timer, der
auf einem **anderen** Todo lief, kann dort die erste abgeschlossene Buchung entstehen; jenes Todo
bewegt sich dann ebenfalls, und diese Antwort sagt darüber nichts.

Der Grund steht dabei, in der Fassung des Orchestrators und mit dem Beleg, warum es keine Lücke
ist: **Eine Antwort trägt eine Bewegung.** Zwei Bewegungen in einem `PoolMovement` wären nicht
auseinanderzuhalten — die drei Listen tragen Namen und keine Kennung des Todos, zu dem sie gehören
(E-058 Punkt 4). Ein zweites Feld daneben verlangte von jeder Oberfläche eine Fallunterscheidung
für einen Weg, den die Hauptanwendung nicht geht: `TimerContext.confirmSwitch` stoppt und startet
in zwei Aufrufen, und der Stopp trägt seinen eigenen Satz. Wer die Bewegung des verdrängten Todos
braucht, macht es genauso.

`apps/local-api/src/usecases/timer.ts:219-237`: derselbe Absatz an `movementOfStart`, dort
aufgehängt an `bookedOnThisTodo` — der Stelle, an der die Einschränkung entsteht.

Die Tabellenzeile am Bauteil (`:4313`) hat den Verweis bekommen, weil die Tabelle nach Punkt 1 die
einzige vollständige Aufzählung ist und ein Leser dort nicht den Eindruck bekommen soll, der Start
melde alles.

---

## Nachweis

Alle Läufe am 2026-09-04 nach der letzten Änderung, jeder in eine eigene Datei umgeleitet, Status
über `echo $?` direkt hinter dem Befehl (keine Pipe, `zsh`-`pipestatus` umgangen).

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 6 Test-Konfigurationen, `tests/e2e` |
| `pnpm test` | **0** | 53 Dateien, **787/787** |
| `pnpm proof:openapi` | **0** | **105 bestanden, 0 fehlgeschlagen** |
| `pnpm proof:all` | **0** | 13 Ketten, zusammen 847 Prüfungen, **0 fehlgeschlagen** |
| `pnpm boundaries` | **0** | 321 Dateien auf Tiefenzugriffe, Notiz-Trennung unverletzt |

Zusätzlich gemessen: die neue Zeichenklasse an ihren Rändern (Tabelle in Abschnitt 4), über
`titleSchema` und `nameSchema` gegen zwölf Codepunkte plus ein ZWJ-Emoji.

**Ein Zwischenlauf war rot und gehört nicht hierher.** Um 11:48 meldete `pnpm typecheck` zwei
TS6133 in `apps/outlook-addin/src/office/mail.ts` (`cutToCharacterBoundary`, `dropHidden` nicht
gelesen). Die Datei trug in derselben Minute den Zeitstempel von integration-dev, der parallel an
T-118 arbeitet; ein Lauf zwei Minuten davor und der Abschlusslauf danach sind grün. Keine meiner
Dateien war beteiligt, und ich habe die fremde Datei nicht angefasst. Zur Sicherheit einzeln
gemessen, alle **0**: `tsc -p tsconfig.json`, `@takt/local-api`, `@takt/domain`, `@takt/storage`,
`typecheck:test`.

Ports 17843/17844 habe ich nicht belegt, keinen fremden Prozess beendet, nichts committet,
gestasht oder ausgecheckt.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/openapi/takt-local-api.yaml` | `:1503` `todoId` an `PATCH /time-entries/{timeEntryId}`; `:1808` O-AB am Timerstart; `:3594` Zeichenklasse und Altbestand in `UnprocessableEntity`; `:3766` `Todo.title` 512 gegen 500; `:4296` Kriterium statt Zahl; `:4313` O-AB in der Tabellenzeile; `:4327` `PATCH` zeigt auf O-X |
| `apps/local-api/src/http/input.ts` | `:152` Marken `U+061C`, `U+200E`, `U+200F` in `FORBIDDEN_IN_NAMES`; `:57-150` Kopfkommentar: dritte Bauart, erlaubte Nachbarn, Altbestand, richtiggestellter Verweis auf `session-secret.ts` |
| `apps/local-api/src/usecases/todos.ts` | `:338` `markTodoDone`: der **Status** bleibt, die Spalte nicht |
| `apps/local-api/src/usecases/timer.ts` | `:219` `movementOfStart`: das verdrängte Todo eines anderen Todos wird nicht berichtet (O-AB) |
| `docs/architektur.md` | `:127` Kriterium statt Zahl und Aufzählung; `:378` `PATCH` zeigt auf O-X; `:933` Routentabelle |
| `.claude/team/reports/T-117-domain-dev.md` | dieser Bericht |

Nicht angefasst: `apps/local-api/src/routes/addin/**`, der Add-in-Abschnitt der OpenAPI
(`:2806-3234`, E-053), `apps/web/**`, `apps/outlook-addin/**`, alle Testordner, `packages/export/**`
und jede gemeinsame Datei.

---

## Annahmen

1. **B-9 wird durch Streichung der Zahl geschlossen, nicht durch „acht".** Der spec-ux-reviewer
   nennt sie „genau die Sorte Zahl, an der man abliest, ob man alle hat"; der Auftrag verlangt,
   dass sie beim nächsten Vorgang nicht wieder falsch wird. Eine gepflegte Zahl an zwei Stellen
   erfüllt das nicht — eine Aufzählung an einer Stelle erfüllt es. Die Zahl acht steht nur noch als
   historischer Hinweis in `architektur.md` („stand erst „drei", und sie wäre jetzt „acht"") und
   nirgends als Wert, den jemand pflegen müsste.
2. **`Todo.title` bleibt bei 512** (Abschnitt 5). 500 wäre eine Zusicherung über Bestände, die vor
   T-114 entstanden sind.
3. **Die Marken werden abgewiesen, `U+200B`–`U+200D` nicht.** Der Code-Reviewer nennt nur
   `U+061C`, `U+200E`, `U+200F`; ich habe geprüft, ob die Nachbarschaft mitgenommen werden sollte,
   und mich dagegen entschieden: `U+200D` hält zusammengesetzte Emoji zusammen, und ein Wächter
   gegen Richtungszeichen darf nicht nebenbei Emoji verbieten. Die Grenze ist an beiden Rändern
   gemessen.
4. **Der `PATCH`-Absatz nennt `todoId` auch an der Route**, nicht nur am Bauteil. Der Auftrag
   nannte den Absatz am Bauteil; ein Leser der Route findet dort aber bis heute **keine** Zeile zu
   `todoId`, obwohl das Feld die Buchung auf eine andere Rechnung hängt. Zwei Sätze, additiv, keine
   Verhaltensänderung.
5. **O-AB steht an der Route und in der Rechnung**, nicht nur an einer der beiden. Der Auftrag sagt
   „an die Route"; der Kommentar an `movementOfStart` ist die Stelle, an der die Einschränkung
   entsteht, und wer sie aufheben wollte, änderte dort.

---

## Risiken

**R1 — Verhaltensänderung, und sie kann fremde Tests rot machen.** Punkt 4 ist die einzige
Änderung dieser Aufgabe, die etwas anderes tut als vorher. Drei Namen, die bisher angenommen
wurden, enden jetzt in `422`. Ich habe den Bestand danach durchsucht und **keine** Prüfung
gefunden, die ein solches Zeichen als *angenommen* erwartet — `pnpm test` (787/787) und
`pnpm proof:all` (847/0) sind grün. Was trotzdem gemeldet und **nicht** von mir geändert wird,
weil es fremder Hoheit gehört:

| Stelle | Wer | Was fehlt |
|---|---|---|
| `apps/local-api/test/http/input.test.ts:1-24`, `:124-143` | unit-tester | Der Kopf nennt „zwei Klassen … `U+202A`–`U+202E`, `U+2066`–`U+2069`". Es sind drei Bauarten. Die Datei prüft die Ränder jedes Bereichs — für die Marken fehlen die Fälle (`U+061B`/`U+061C`/`U+061D`, `U+200D`/`U+200E`/`U+200F`/`U+2010`). Die Zahlen aus meiner Messung stehen in Abschnitt 4 |
| `apps/outlook-addin/scripts/proof-addin.mjs:3352-3374` | integration-dev | `ABGEWIESENE_ZEICHEN` führt 19 Codepunkte, die drei neuen fehlen. Der Nachweis ist damit schwächer als die Wache, aber nicht falsch — er läuft grün |
| `apps/local-api/src/routes/addin/schema.ts:88-93` | integration-dev | Der Kommentar zählt die Klassen auf und ist jetzt unvollständig. Die Tür selbst ist richtig, weil sie `titleSchema` benutzt |
| `takt-local-api.yaml:2905-2913`, `:2988-2998` | integration-dev (E-053) | Die Beschreibungen von `POST /addin/todos` nennen `title` und `tagNames` mit den alten zwei Bauarten. Ich habe den Abschnitt nicht angefasst |
| `docs/bedrohungsmodell.md:2723`, `:2960`, `:3002` | security-checker | Beschreibt die Klasse mit den alten Codepunkten. `:3124` nennt `U+200B`–`U+200F` und `U+061C` bereits als Suchmuster — die Beschreibung des Gegenmittels zieht nach |

**R2 — der Windows-Benutzername ist die verbleibende Lücke derselben Art.**
`apps/local-api/src/access/session-secret.ts:85` prüft `/[\u0000-\u001f\u007f]/` — kein C1, keine
Richtungszeichen. Der Name geht unverändert als `WindowsUser` in die Exportdatei (A-8.2, E-010) und
steht in `GET /settings`. Ein Richtungszeichen darin dreht eine Zeile der Abrechnungsdatei und die
Anzeige in den Einstellungen. Die Grenze ist eine andere (der Wert kommt über `stdin` von der
Hülle, nicht aus einer Anfrage), der Schaden wäre derselbe. Nicht in dieser Aufgabe geändert, weil
es eine Verhaltensänderung an der Startprüfung ist und `proof:access` daranhängt — als Frage
unten.

**R3 — kein Risiko aus 1, 2, 3, 5, 6.** Das sind ausschließlich Beschreibungen und Kommentare.
Keine Zeile Fachlogik, kein Schema, keine Antwortform. `proof:openapi` prüft Rumpfschemata gegen
die Zod-Schemata des Dienstes und ist unberührt; `z.toJSONSchema` bildet ein `.refine` ohnehin
nicht ab (T-101 Annahme 6).

**R4 — `Todo.title` bleibt eine Zahl, die einen Kommentar braucht.** Wer die Beschreibung nicht
liest, hält 512 für vergessen und zieht sie beim nächsten Anfassen auf 500. Der Absatz sagt das
ausdrücklich („Wer sie auf 500 zieht, behauptet über fremde Bestände etwas, das er nicht weiß"),
aber ein Kommentar ist schwächer als eine Prüfung. Eine Prüfung dagegen gibt es nicht und wäre
Aufwand ohne Nutzen, solange kein Bestand bekannt ist.

---

## Offene Fragen

1. **Soll `isPlausibleUserName` nachziehen?** (R2.) Der Windows-Benutzername wird heute nur gegen
   C0 und DEL geprüft, geht aber in die Exportdatei. Vorschlag: dieselbe Klasse wie
   `FORBIDDEN_IN_NAMES`. Das ist eine Verhaltensänderung am Handschlag mit der Hülle und berührt
   `proof:access` — eine eigene kleine Aufgabe, nicht nebenbei. Falls ja, gehört sie mir.
2. **`Todo.title`: 512 mit Begründung, oder 500 mit Migration?** Ich habe 512 gesetzt (Abschnitt 5,
   Annahme 2). 500 verlangt entweder eine Migration, die vorhandene Titel kürzt — und damit
   Benutzereingaben still ändert —, oder den ausgesprochenen Verzicht darauf, dass die Beschreibung
   für Altbestände gilt. Beides ist eine Entscheidung, keine Zahl.
3. **O-X bleibt beim Auftraggeber.** Die Begründung in OpenAPI und Architekturbeschreibung zeigt
   jetzt darauf, statt eine falsche zu geben. Zur Erinnerung, damit die Frage vollständig gestellt
   ist: Was soll `PATCH /time-entries/{id}` melden, wenn `todoId` wechselt — nichts (heute), zwei
   Bewegungen mit Todo-Kennung, oder nur die des aufnehmenden Todos?
4. **O-AB ist ausgesprochen und damit nicht mehr offen** — falls der Orchestrator das anders sieht,
   müsste die Antwortform von `POST /timer/start` um eine zweite Bewegung mit Todo-Kennung
   erweitert werden, und das berührt die Domäne (`poolMovementSentence` bildet heute einen Satz
   ohne Subjekt, E-058 Punkt 4). Ich halte das für teuer und den zweistufigen Weg für richtig.
5. **Vier fremde Dateien beschreiben die Zeichenklasse mit den alten zwei Bauarten** (R1, Tabelle).
   Keine ist falsch geworden im Sinne von „widerspricht dem Verhalten", alle sind unvollständig.
   Der Dokumentierer liest davon mindestens `bedrohungsmodell.md` — dieselbe Mechanik, aus der D-2
   entstanden ist.

---

## Nächster Schritt

1. **Auflage 2 aus T-116 ist erfüllt** — der Dokumentierer kann Architekturbeschreibung und
   OpenAPI lesen, ohne eine falsche Zahl ins Handbuch zu schreiben. Auflage 1 (E-060 Punkt 4) und
   Auflage 3 (B-8, Designsystem) liegen nicht bei mir.
2. **Eine kleine Aufgabe an unit-tester:** die Ränder der drei neuen Marken in
   `apps/local-api/test/http/input.test.ts` nachziehen, samt Kopfkommentar („drei Bauarten"). Die
   sechs Codepunkte und das erwartete Ergebnis stehen in Abschnitt 4; der Fall
   „Familien-Emoji mit ZWJ bleibt erlaubt" gehört dazu, weil er die Grenze nach unten festnagelt.
3. **Eine kleine Aufgabe an integration-dev:** drei Codepunkte in `ABGEWIESENE_ZEICHEN`
   (`proof-addin.mjs`), der Kommentar in `routes/addin/schema.ts:88-93` und die beiden
   Add-in-Beschreibungen in der OpenAPI (`:2905`, `:2988`). Rein beschreibend, kein Verhalten.
4. **Eine Zeile an security-checker:** `docs/bedrohungsmodell.md` beschreibt das Gegenmittel mit
   den alten Codepunkten; `:3124` nennt die Marken bereits als Suchmuster.
5. **Frage 1 entscheiden** (Windows-Benutzername). Wenn ja, nehme ich sie zusammen mit einem
   Prüffall in `proof:access`.
