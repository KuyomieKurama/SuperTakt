# T-349 — A-A-106: der Hebel selbst, nicht der achte Wächtername

**Rolle:** domain-dev. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie (in ihr
stehen die unveröffentlichten Stände von T-341/T-342 und die parallel laufenden Wellen).
**Vorlagen:** `.claude/team/reports/T-346-code-reviewer.md`, `T-347-security-checker.md`,
`T-342-domain-dev.md`, `T-335-domain-dev.md`; `docs/bedrohungsmodell.md` 42.4, 42.9, 43.9, 44.5
(**A-A-106**, **A-A-117**, **A-A-118**); `docs/spec.md` A-18.11, A-18.12, A-V-5, A-V-11, A-V-12.

**Geänderte Dateien — drei, alle in eigener Hoheit:**

| Datei | Was |
|---|---|
| `apps/local-api/src/features/version/version.ts` | A-A-106 gebaut: der Weg zur Anfrage ist synchron; Frist, Satz und Schlüssel für den schweigenden Speicher |
| `apps/local-api/scripts/proof-release-safety.mjs` | 6g-1 neu (ganzer Rumpf, Untergrenze **in** der Regel), **6i-2** neu (A-A-117), Lückenliste um die **fünfte Art** (A-A-118), berichtigte Zusagen, 8 neue Gegenproben, 1 neue Zeile in Abschnitt 0 |
| `docs/architektur.md` | Abschnitt 5 der Versionsprüfung: A-A-106 samt der Eigenschaft, die dabei **schwächer** geworden ist; zwei veraltete Zahlen berichtigt |

`packages/**`, `tests/**`, `apps/web/**`, `apps/local-api/src/features/timer/**`, `risks.md`,
`package.json` sind **nicht** angefaßt. Die beiden Meßmutationen an `version.ts` und `source.ts`
sind zeichengleich zurückgeschrieben (`md5sum -c`, zweimal OK).

---

## 1 Die Entscheidung: der Weg wird synchron, nicht die Zusage befristet

A-A-106 bot zwei Wege an — „entweder wird `store.write` nicht mehr abgewartet, oder es bekommt
eine Frist". Gebaut ist **beides zugleich**, und die Aufgabenteilung ist der Kern:

- **Der Weg zur Anfrage wartet auf nichts.** `remember` ist synchron (`function remember(at:
  Date): void`). `lastRequestAt` steht nach der ersten Anweisung; das Schreiben wird angestoßen
  und nicht abgewartet. In `run()` steht damit **genau ein `await`: die Anfrage selbst.**
- **Die Frist hält nichts auf, sie macht aus Schweigen eine Zeile.**
  `VERSION_CHECK_STORE_DEADLINE_MS` = 5 000 ms, `unref()`t, wird beim Ausgang des Schreibens
  abgeräumt. Läuft sie ab, gilt derselbe Weg wie beim Wurf: `store = null`, **eine** Zeile im
  Protokoll, der Takt unberührt.

**Warum nicht nur die Frist** (die kleinere Änderung): Sie hätte die Zusage an den Rumpf von
`remember` gehängt, und ein Wächter darüber hätte Zeichen vergleichen müssen. Die Klasse aus
R-30 heißt aber nicht „`store.write` hängt", sondern „**irgendein** fremdes Versprechen auf dem
Weg hängt". Ein synchroner Weg hebt die Klasse auf, statt ihren heute bekannten Vertreter
einzuzäunen — und er ist über den Quelltext in **einer** Zeile entscheidbar: kein `await`.

**Warum trotzdem die Frist:** Ohne sie wäre ein Speicher, der nie antwortet, von einem, der
geschrieben hat, in nichts zu unterscheiden. Genau diese Ununterscheidbarkeit war der Kern von
T-332 K-1 („es ist stiller als ein Fehlschlag"), und das Abnahmekriterium von A-A-106 verlangt
ausdrücklich **eine** Zeile. Zwei Schlüssel, damit der Leser die beiden Fälle trennen kann:
`version_check_state_unwritable` (Wurf, unverändert) und
`version_check_state_write_timeout` (neu). Beide gehen durch die reine Funktion
`describeVersionCheckStoreFailure` — derselbe Bau wie `describeVersionCheckFailure`, ohne
laufenden Dienst prüfbar, Sätze als Konstanten, Schlüssel aus dem geschlossenen Vorrat (A-V-20).
**A-18.12 bleibt gewahrt:** nichts davon erreicht eine Fläche, der Zustand bleibt, was er ist.

### 1.1 Die Wirkung, am Modul gemessen (Attrappe für die Quelle, 400 ms je Lage)

| Modul | Speicher | ausgehende Anfragen | Zustand | Protokollzeilen |
|---|---|---|---|---|
| `HEAD` | **antwortet nie** | **0** | `unknown` | **0** |
| `HEAD` | wirft | 10 | `known` | 1 (`_unwritable`) |
| `HEAD` | schreibt | 10 | `known` | 0 |
| **neu** | **antwortet nie** | **10** | `known` | **1** (`_write_timeout`) |
| **neu** | wirft | 10 | `known` | 1 (`_unwritable`) |
| **neu** | schreibt | 10 | `known` | 0 |

Das ist der Hebel aus 42.4, umgelegt: Der Ausschalter von T-332 K-1 schaltet nichts mehr ab, und
er ist nicht mehr stumm.

### 1.2 Was dabei ehrlich **schwächer** geworden ist — und es ist gemessen

Zugesichert ist seit T-349 der **Anstoß** vor der Anfrage, nicht der **Abschluß**. Gemessen mit
einem künstlich verzögerten Adapter (5 ms vor dem Schreiben):

| Modul | Adapter | Zeitpunkt im Speicher, **während** die Anfrage läuft |
|---|---|---|
| `HEAD` | synchron | gesetzt |
| `HEAD` | verzögert | gesetzt |
| **neu** | synchron (**der gebaute**, `repo-version-check.ts` führt sein `UPDATE` im Aufruf aus) | gesetzt |
| **neu** | verzögert | **nicht gesetzt** (danach gesetzt) |

Der Preis ist klein und benannt: Der Bestandswert ist seit T-285 **kein Betriebspfad** mehr,
sondern eine Tatsache für die Datensicherung (A-20.4). Was ein Absturz zwischen Anstoß und
Schreiben kostet, ist eine fehlende Angabe in einer Sicherung — **nicht** ein fehlender Boden;
der hängt an `lastRequestAt` im Arbeitsspeicher. Der Satz steht so in `version.ts` und in
`docs/architektur.md`, damit ihn niemand aus dem grünen Prüffall herausliest.

**Daraus folgt eine Meldung an den unit-tester, kein Eingriff von mir** (Abschnitt 5).

---

## 2 Der Wächter: 6g-1 mißt jetzt den ganzen Rumpf, und die Untergrenze steht **in** der Regel

`CHECKER_AWAITED_BEFORE_REQUEST = new Set(['remember'])` ist
`CHECKER_AWAITED_BESIDES_REQUEST = new Set()` geworden. Der Name ist mitgewandert, weil die
**Menge** eine andere ist; die alte Schreibweise steht im Kopf der Konstanten, damit ein `grep`
aus T-335, A-A-106 oder dem Board dort landet.

Drei Sätze statt zwei:

1. **Obergrenze** — ein `await` im Rumpf der Anfrage, das nicht die Anfrage ist. **Neu ist das
   „dahinter"**: Ein `await`, das *nach* der Anfrage nie eintrifft, verhindert zwar diese eine
   Anfrage nicht, hält aber `inFlight` auf wahr und beendet jede weitere — derselbe Ausschalter,
   eine Zeile später. Der alte Leser sah nur nach vorn und war dafür blind.
2. **Zweite Richtung** — ein festgenagelter Name, der nicht mehr vorkommt. Heute unerreichbar
   (leere Menge), bleibt stehen für den nächsten Eintrag.
3. **Untergrenze** — *die Anfrage selbst steht unter keinem `await`*. Sie mußte gebaut werden:
   Solange die Menge einzeilig war, trug sie selbst die Untergrenze; **eine leere Erlaubnisliste
   ist über jedem stummen Leser wahr.** Jetzt beantwortet der Leser die Frage, die er ohnehin
   beantworten muß, und meldet sich, wenn er den Rumpf nicht gelesen hat.

Gegenproben zu 6g-1: **4 → 6**. Neu: „der Stand **vor** A-A-106" (`await remember(…)`, also der
Rückfall, mit Namen), „ein Warten **nach** der Anfrage", „die Anfrage steht unter keinem
`await`". Der Eintrag mit dem fremden Namen (`drossel`) bleibt — er mißt die Regel, der andere
den Rückfall; die Doppelung ist im Quelltext begründet.

### 2.1 Beidseitig gemessen, im **echten** Baum und nicht nur am Stumpf

Jede Gestalt einzeln eingesetzt, `tsc -p apps/local-api` und `proof:release-safety`, danach
zeichengleich zurückgeschrieben:

| | Gestalt | `tsc` | `release-safety` | gemeldeter Satz |
|---|---|---|---|---|
| Nullpunkt | der gebaute Stand | Exit 0 | **154 / 0** | — |
| **G-a** | **der Stand vor A-A-106** (`version.ts` aus `HEAD`) | Exit 0 | **153 / 1** | „wartet im Rumpf der ausgehenden Anfrage auf `remember`" |
| **G-b** | `await Promise.resolve()` **nach** der Anfrage | Exit 0 | **153 / 1** | „… auf `Promise.resolve`" |
| **G-d** | `await import(teile.join(':'))` in `latest()` (**T-347 K-10c**) | Exit 0 | **153 / 1** | „führt mit einem **gerechneten** Quellnamen ein" |
| **G-e** | `({}).constructor` in `latest()` (**T-346 (1)**) | Exit 0 | **153 / 1** | „greift auf `constructor` zu" |
| **G-f** | `[…][feld]` mit gerechnetem Schlüssel | Exit 0 | **153 / 1** | „greift mit einem Schlüssel zu, den dieser Leser nicht lesen kann" |
| Gegenprobe | K-10 mit **literalem** Quellnamen (`import('node:process')`) | Exit 0 | **153 / 1** | Gestalt 5: „importiert `node:process`" — unverändert rot |

G-a ist die Antwort auf den Auftrag: Der Prüffall, der heute an der Reihenfolge hing, mißt nach
der Änderung genau das, was sie zusichert, und ist **nicht bloß wieder grün** — der alte Stand
ist rot, und zwar mit einem Satz, der ihn benennt.

---

## 3 A-A-117: die dritte Tür — **geschlossen**, und die Zusage daneben berichtigt

Neu ist **6i-2** (`pruefeGerechneteZugriffeDerEntscheidungsmodule`) über `version.ts` und
`source.ts`. Gemessen wird die Eigenschaft „**dieser Leser kann den Namen lesen**" und nicht eine
Liste von Schreibweisen:

1. eine Einfuhr als Aufruf, deren Quellname **kein Zeichenkettenliteral** ist (A-A-117 im
   Wortlaut);
2. ein Griff nach `constructor` — als Feld **und** als lesbarer Schlüssel in eckigen Klammern
   (T-346 (1), samt der Schreibweise `[]['constructor']`, die der Vorschlag von T-346 noch nicht
   nannte);
3. ein Zugriff mit eckigen Klammern, dessen Schlüssel **unlesbar** ist, und jeder lesbare
   Schlüssel, der nicht festgenagelt ist.

„Lesbar" heißt: ein Literal, oder ein Bezeichner, den **dasselbe Modul** auf ein
Zeichenkettenliteral festlegt. Das ist genau der heutige Bestand — `source.ts` hat einen
einzigen Klammerzugriff, `(parsed as Record<string, unknown>)[TAG_FIELD]` mit
`const TAG_FIELD = 'tag_name'`. Diese eine Zeichenkette steht als
`MODUL_ZUGRIFFSSCHLUESSEL` fest und ist zugleich die **Untergrenze** von 6i-2: Die beiden
anderen Sätze verbieten etwas, das heute nirgends steht, und wären über einem blinden Leser
wahr; verliert er seine Augen, fällt `tag_name` aus der Messung und der Lauf sagt es.

Sechs Gegenproben (gerechnete Einfuhr, `constructor` als Feld, `constructor` in Klammern,
unlesbarer Schlüssel, nicht festgenagelter lesbarer Schlüssel, Untergrenze) und **eine neue
Zeile in Abschnitt 0** („jedes Entscheidungsmodul hat eine festgenagelte
Zugriffsschlüsselliste") — die letzte, weil der Satz „steht nicht unter den Modulen mit
festgenagelten Zugriffsschlüsseln" über eine eingesetzte Datei nicht erreichbar ist; dieselbe
Bauart wie bei 6i.

**Der Satz bei `MODUL_LAUFZEITNAMEN` ist berichtigt.** Er lautete „Ein Modul kann auf genau zwei
Wegen … Zusammen ist das eine **geschlossene** Aussage". Er lautet jetzt: vier Wege sind gemessen
— Einfuhr (Gestalt 5), freier Name (6i), Parameter (6b/6e/6f), gerechneter Zugriff (6i-2) —,
**und daß es keinen fünften gibt, sagt dieser Lauf nicht**; er hat es zweimal behauptet und
zweimal unrecht behalten. Der Kandidat für eine echte Schließung steht dabei (eine Aussage über
eine **Eigenschaft**: kein Ausdruck dieser beiden Module hat den Typ `any`) — er verlangt den
Typprüfer und ist **nicht** gebaut. Das ist die ehrliche Grenze statt der achten Gestalt.

---

## 4 A-A-118: die fünfte Art — **benannt, nicht geschlossen**, mit Begründung

Die Lückenliste bei `checkNoStoreReadback` hat jetzt **fünf** Arten von Stellen, und der Satz
aus T-347 steht davor: *Die Einteilung trennt Stellen; gemessen werden Eigenschaften von
Stellen* — deshalb steht an jeder Art, **woraufhin** sie gelesen wird. Der Rumpf von `latest()`
ist das Beispiel: für Einfuhren, freie Namen und gerechnete Zugriffe gelesen, für alles übrige
durchlaufen.

**(V) Stellen hinter einer festgenagelten Einfuhr.** Festgenagelt ist der **Name**, nicht das
Verhalten; `packages/domain` kommt in diesem Lauf kein einziges Mal vor (T-347 K-9a/K-9b:
`tsc` Exit 0, 145/0 grün).

**Nicht geschlossen, und das ist eine Entscheidung, keine Auslassung.** Beide Gestalten fangen
die Einheitenprüfungen mit 31 beziehungsweise 17 roten Fällen (T-347, heute gemessen — ich habe
sie **nicht** nachgefahren, siehe Annahmen). Ein Zeichenvergleich über die Rümpfe eines fremden
Pakets wäre das falsche Werkzeug: Er nagelte eine Schreibweise fest, wo eine Prüfung Verhalten
mißt, und bräche bei jeder Umformulierung, ohne je eine Absicht zu fangen. Wer die Art schließen
will, schließt sie dort, wo sie gemessen wird — an den Einheitenprüfungen und ihrer Abdeckung.
Das steht so im Quelltext des Laufs.

Dazu drei neue Punkte in „was heute zu (III) gehört": der Rumpf aus dem fremden Paket, **ein
fünfter Weg an den vier gemessenen Türen vorbei** (nicht gemessen, zweimal widerlegt), und: was
ein Rumpf **rechnet**, nachdem die Anfrage ausging — 6g-1 mißt dort nur, daß nichts stillsteht.

---

## 5 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `pnpm proof:release-safety` (Nullpunkt, vor der Arbeit) | **145 / 0** |
| `pnpm proof:release-safety` (Endstand) | **154 / 0** (+8 Gegenproben, +1 Zeile in Abschnitt 0) |
| `pnpm typecheck` (acht Pakete plus Prüf- und E2E-Programme) | **Exit 0** |
| `pnpm boundaries` | **Exit 0**, 528 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `vitest` `apps/local-api/test/version` + `packages/domain/test/version.test.ts` + `packages/storage/test/repo-version-check.test.ts` | **150 / 150 grün** (Nullpunkt derselben Menge ohne den Speichertest: 130/130) |
| `proof:layers` / `callers` / `route-policy` / `codepoints` / `openapi` / `db-permissions` / `migrations` | 36/0 · 74/0 · 48/0 · 46/0 · 115/0 · 27/0 · Exit 0 |
| eigene Meßläufe | 6 Wirkungsmessungen am Modul (3 Lagen × 2 Fassungen), 4 Reihenfolgemessungen, 6 Gestalten × (`tsc` + `release-safety`) |
| **nicht gefahren** | `verify:bundle`, `test:e2e`, `proof:access`, `proof:conflicts`, `proof:tags`, `proof:export-api`, `proof:addin-wiring` (**portgebunden** — 17843/17844/5173 sind vergeben, T-345 und eine mögliche Benutzersitzung), `test:coverage` als Ganzes, `test:rust`, `build`, `proof:engines`, `proof:surface`/`clamp`/`foreign`/`shell-surface` (fremde Hoheit, unberührt) |

---

## 6 Annahmen

1. **Die Frist beträgt 5 000 ms** — dieselbe Zahl wie die Gesamtfrist der ausgehenden Anfrage
   (A-V-5). Begründet im Quelltext: Was länger braucht als der ganze Gang über das Netz, ist kein
   langsamer Schreibzugriff mehr. Im Betrieb läuft sie nie ab, weil der gebaute Adapter synchron
   schreibt.
2. **Die Option `storeDeadlineMs` ist neu** und ausdrücklich eine **Meßnaht**: Ein Prüffall setzt
   dort Millisekunden statt Sekunden. Die Verdrahtung setzt sie nicht, und 6b nagelt die
   Schlüssel des Aufrufobjekts weiterhin auf vier fest — der Lauf ist an dieser Stelle unberührt
   grün.
3. **`stop()` räumt eine schwebende Frist nicht ab.** Sie ist `unref()`t, hält also weder
   Abschaltung noch Ereignisschleife auf (B-1.6). Sie könnte nach dem Anhalten noch **eine**
   `info`-Zeile schreiben — im Betrieb unerreichbar, weil der Adapter synchron ist. Wer das
   anders will, gibt es mir als Auflage; es sind drei Zeilen.
4. **Die Zahlen zu K-9a/K-9b (31 und 17 rote Einheitenprüfungen) sind von T-347 übernommen** und
   nicht nachgefahren: Die Gestalt säße in `packages/domain`, und der Auftrag sagt ausdrücklich,
   daß eine Änderung dort ein Befund und keine Handlung von mir ist. Eine Mutation, auch eine
   zurückgenommene, wäre eine Handlung.
5. **Keine Prüfdatei angefaßt.** Der Prüffall zu A-A-106 fehlt und ist gemeldet (Abschnitt 8),
   nicht geschrieben.

---

## 7 Risiken

- **Die Klasse aus R-30 ist enger, nicht zu.** Geschlossen ist der Weg zur Anfrage **innerhalb
  des Prüfmoduls**. Ein `source`, dessen `latest` nie antwortet, hält `run()` weiterhin auf —
  derselbe stille Ausgang, eine Naht weiter rechts. Heute ist das eng gehalten: Die gebaute
  Quelle trägt `AbortSignal.timeout` (A-V-5), die Naht `releaseSource` messen 6e/6f, und im
  ausgelieferten Zusammenbau ist sie `undefined` (T-332 42.5). **Gemessen ist es nicht.** Ein
  Riegel wäre eine Frist über den ganzen Prüflauf, die `inFlight` freigibt und neu plant — sie
  erlaubt im Grenzfall zwei überlappende Anfragen und gehört deshalb entschieden, nicht gebaut.
  Vorschlag: eigene Auflage, eigene Welle.
- **Die neue Schwäche ist die Reihenfolge**, nicht die Anfrage (Abschnitt 1.2). Sie ist gemessen,
  benannt und kostet eine Angabe in einer Datensicherung, keinen Boden.
- **6i-2 verbietet eine Schreibweise, die morgen legitim sein kann.** Wer in `source.ts` künftig
  mit einem berechneten Schlüssel auf ein Feld zugreifen will, wird rot und muß den Schlüssel
  festnageln. Das ist gewollt (E-103) und der Preis dieser Gestalt.
- **Sicherheitsseitig sonst nichts Neues:** keine Adresse, keine Route, keine CSP, kein Datenweg,
  keine Einfuhr dazugekommen. Die Einfuhrliste beider Entscheidungsmodule ist unverändert; die
  zehn festgenagelten Laufzeitnamen von `version.ts` stimmen weiterhin zeichengenau.

---

## 8 Offene Fragen an den Orchestrator

1. **Der Prüffall zu A-A-106 fehlt und gehört dem unit-tester** (nächste Welle — wer baut und wer
   mißt, nicht gleichzeitig). Vorgabe aus dem Abnahmekriterium, jetzt baubar:
   `createVersionChecker({ …, storeDeadlineMs: 20, store: { write: () => new Promise(() => {}) } })`
   — die Anfrage geht hinaus, `current()` wird `known`, im Protokoll steht **genau eine** Zeile
   `version_check_state_write_timeout`. Dazu zwei kleine: `describeVersionCheckStoreFailure`
   (rein, zwei Zweige) und der Rückfall „ein zweiter Fehlschlag schreibt keine zweite Zeile".
2. **Der Prüffall, der an der Reihenfolge hängt, mißt jetzt weniger, als sein Name sagt.**
   `apps/local-api/test/version/checker.test.ts`, „der Zeitpunkt steht bereits IM Speicher,
   während die Anfrage noch läuft (T-279)" ist grün — **weil der gebaute Adapter synchron
   schreibt**, nicht mehr, weil der Prüfer wartet (gemessen, Abschnitt 1.2). Er sollte das sagen:
   entweder im Namen („… weil der Adapter im Aufruf schreibt") oder als zweiter Fall mit einem
   verzögerten Adapter, der die neue, schwächere Zusage festnagelt. **Das gehört dem
   unit-tester**, nicht mir.
3. **Wortlaut für `risks.md`, R-30 — fortschreiben, nicht schließen:**

   > **Fortgeschrieben am 2026-09-13 (T-349).** A-A-106 ist **gebaut**: Der Weg zur ausgehenden
   > Anfrage ist synchron, im Rumpf steht genau ein `await` — die Anfrage selbst, und sie trägt
   > ihre Frist (A-V-5). Am Modul gemessen: Ein Speicher, dessen `write` nie eintrifft, kostet
   > **0 → 10** Anfragen (in 400 ms) und **0 → 1** Protokollzeile; der Ausschalter aus T-332 K-1
   > schaltet nichts mehr ab und ist nicht mehr stumm. `proof:release-safety` mißt die Zusage in
   > beide Richtungen und über den **ganzen** Rumpf — der Stand vor A-A-106 ist im echten Baum
   > **rot** (153/1 bei `tsc` Exit 0), ebenso ein Warten **hinter** der Anfrage, das bis T-349
   > ungemessen war. **A-A-117 ist gebaut** (6i-2): die gerechnete Einfuhr (T-347 K-10c) und die
   > Konstruktorkette (T-346) sind rot, ebenso ein Klammerzugriff mit unlesbarem Schlüssel; die
   > Zusage „genau zwei Wege, zusammen geschlossen" ist durch eine gemessene ersetzt — **vier
   > Wege gemessen, ein fünfter nicht ausgeschlossen**. **A-A-118 ist benannt, nicht
   > geschlossen**: Die Lückenliste führt die fünfte Art (Rumpf einer Funktion aus
   > `packages/domain` hinter festgenagelter Einfuhr) samt dem Satz, welche Eigenschaft je Art
   > gemeint ist; gefangen wird sie von den Einheitenprüfungen und nicht von diesem Lauf. **Offen
   > bleibt** eine Quelle, deren `latest` nie antwortet — derselbe stille Ausgang eine Naht weiter
   > rechts, heute nur durch die Nähte 6e/6f und die Frist der gebauten Quelle eng gehalten.
4. **Soll die Quelle denselben Riegel bekommen?** (Risiko 1.) Das ist eine Entscheidung über
   überlappende Anfragen, nicht eine Zeile Code — ich rate nicht.
5. **`docs/bedrohungsmodell.md` 44.5** gehört dem security-checker: A-A-106, A-A-117 sind gebaut,
   A-A-118 ist als benannte Grenze umgesetzt. Ob das für ihn „erledigt" heißt, entscheidet er,
   nicht ich.
6. **Im Kratzbereich liegen weiterhin rund 620 MB fremder Meßkopien** (`tree0` 568 MB,
   `t331-code-review-probe` 23 MB und weitere aus früheren Wellen dieser Sitzung). Meine eigenen
   sind abgeräumt und nachgeprüft; die fremden rühre ich nicht an, solange parallele Aufträge
   laufen.

---

## Kurzfassung

```
Aufgabe: T-349 — A-A-106: der Hebel selbst, nicht der achte Wächtername
Status: braucht Review
Artefakte: apps/local-api/src/features/version/version.ts,
  apps/local-api/scripts/proof-release-safety.mjs, docs/architektur.md,
  .claude/team/reports/T-349-domain-dev.md
Zusammenfassung: A-A-106 ist an der Fachstelle gebaut und nicht am Wächter: `remember` ist
  synchron, das Schreiben in den Bestand wird angestoßen statt abgewartet, und im Rumpf der
  ausgehenden Anfrage steht genau ein `await` — die Anfrage selbst, mit ihrer eigenen Frist
  (A-V-5). Eine unref()te Frist von 5 000 ms verwandelt das Schweigen eines Speichers in genau
  eine Protokollzeile (`version_check_state_write_timeout`) und legt ihn ab; still im Sinn von
  A-18.12 bleibt alles, der Takt ist unberührt. Am Modul gemessen: Ein Speicher, dessen `write`
  nie eintrifft, ergibt 0 → 10 Anfragen und 0 → 1 Zeile. Der Wächter mißt jetzt den ganzen Rumpf
  statt nur „davor" — das Warten hinter der Anfrage war dieselbe Lücke, eine Zeile später — und
  seine Untergrenze steht in der Regel statt in der Erlaubnisliste, weil eine leere Liste über
  jedem stummen Leser wahr ist. Der Stand vor A-A-106 ist im echten Baum rot (153/1, tsc Exit 0),
  ebenso vier weitere eingesetzte Gestalten. A-A-117 ist gebaut (6i-2): gerechnete Einfuhr,
  Konstruktorkette und unlesbarer Klammerschlüssel sind Befunde; die Zusage „genau zwei Wege,
  zusammen geschlossen" ist durch vier gemessene Wege und den ausdrücklichen Satz ersetzt, daß
  ein fünfter nicht ausgeschlossen ist. A-A-118 ist benannt und nicht geschlossen — mit
  Begründung: Die Einheitenprüfungen fangen die Klasse, ein Zeichenvergleich über ein fremdes
  Paket wäre das falsche Werkzeug. Lauf: 145/0 → 154/0.
Annahmen: Frist 5 000 ms wie A-V-5; `storeDeadlineMs` als Meßnaht (Verdrahtung setzt sie nicht,
  6b unberührt); `stop()` räumt eine schwebende Frist nicht ab, sie ist unref()t; die Zahlen zu
  K-9 (31/17 rote Einheitenprüfungen) sind von T-347 übernommen, weil packages/domain nicht meine
  Datei ist — auch nicht für eine zurückgenommene Mutation; keine Prüfdatei angefaßt.
Risiken: Die Klasse ist enger, nicht zu — eine Quelle, deren `latest` nie antwortet, hält `run()`
  weiterhin auf; heute eng gehalten durch 6e/6f und die Frist der gebauten Quelle, aber nicht
  gemessen. Die Reihenfolgezusage ist schwächer geworden (Anstoß statt Abschluß) und gemessen:
  mit einem verzögerten Adapter steht der Zeitpunkt während der Anfrage nicht mehr im Bestand —
  Preis ist eine Angabe in der Datensicherung, kein Boden. 6i-2 verbietet eine Schreibweise, die
  morgen legitim sein kann; das ist gewollt (E-103).
Offene Fragen: (1) Der Prüffall zu A-A-106 fehlt — gehört dem unit-tester, Vorgabe im Bericht.
  (2) Der T-279-Prüffall ist grün, weil der Adapter synchron schreibt, nicht weil der Prüfer
  wartet — Name oder zweiter Fall nachziehen, ebenfalls unit-tester. (3) Wortlaut für R-30 steht
  in Abschnitt 8. (4) Soll die Quelle denselben Riegel bekommen? Das ist eine Entscheidung über
  überlappende Anfragen. (5) 44.5 im Bedrohungsmodell gehört dem security-checker. (6) 620 MB
  fremder Meßkopien im Kratzbereich, meine sind weg.
Nächster Schritt: unit-tester in der nächsten Welle mit den beiden Prüffällen aus (1) und (2);
  parallel security-checker über diesen Stand (A-A-106/117 gebaut, 118 benannt) und den
  R-30-Wortlaut. Danach entscheiden, ob die Quelle einen eigenen Riegel bekommt.
```
