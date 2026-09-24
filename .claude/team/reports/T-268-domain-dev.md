Aufgabe: T-268 — `proof:layers` ist zweimal ausgehebelt worden (A-A-75)
Status: braucht Review — **und ein Schaden von mir, der oben steht und nicht unten**

Artefakte:
- `apps/local-api/scripts/proof-layers.mjs` — neu geschrieben. Menge an der Anforderung
  aufgespannt, Marken verbreitert mit ausgeschriebener Reichweite, beide Aushebelungen als
  Gegenproben im Lauf. **20/0 → 36/0**
- `apps/local-api/scripts/proof-route-policy.mjs` — T-266-7: der Kommentar an
  `addinSurface.length === 4` sagt jetzt, daß es eine Zahl und keine Menge ist und wo die
  Deckung liegt. Kein Prüfsatz geändert, weiter **44/0**
- `apps/local-api/src/features/todos/todos.ts` — **Wiederherstellung eines Schadens, den ich
  selbst angerichtet habe.** Siehe „Der Schaden" unten
- `.claude/team/reports/T-268-domain-dev.md` (diese Datei)

---

## Der Schaden — zuerst, weil er nicht der Nebensatz eines grünen Berichts sein darf

Beim Fahren der zweiten Aushebelung am echten Baum habe ich die Datei nach dem Angriff mit
`git checkout -- src/features/todos/todos.ts` zurückgenommen. **Das war falsch.** `git checkout`
stellt aus dem **Index** her, und dieser Baum trägt 165 Dateien mit Änderungen, die vorgemerkt
**und** darüber hinaus im Arbeitsbaum geändert sind (`RM`). `todos.ts` war eine davon. Die nicht
vorgemerkte Fassung ist damit überschrieben.

**Was verloren ging, gemessen statt vermutet:**

| | sha256 |
|---|---|
| Arbeitsbaum vorher (auch von T-266 so vermerkt) | `cfb40cf7ff62a670126840f47cbb60bdd175ef009af75aa2a92588cde9db1651` |
| Index-Fassung, die `git checkout` hergestellt hat | `153af77b66b764f8aeda5a4914c00dec546c2468c8d94806761ab1b0fcd1e758` |
| meine Wiederherstellung | `9f746c73ca1619e1da8dd66169e9eee48d24b2bf06e23b80d65131a175c44a2c` |

**Nicht wiederherstellbar aus dem Bestand.** Ich habe alle Git-Objekte des Bestands zwischen
20 000 und 30 000 Byte durchgerechnet und keins mit `cfb40cf7…` gefunden; auf der Platte gibt es
keine zweite Kopie der Datei. Die Fassung war nie vorgemerkt und ist deshalb nie ein Objekt
geworden.

**Wie ich sie wiederhergestellt habe, und woran ich das festgemacht habe.** `pnpm typecheck` hat
den Verlust sofort benannt: drei Einfuhrziele der Index-Fassung zeigen auf `./context.ts`,
`./pool-movement.ts` und `./tag-names.ts` — Dateien, die mit T-257 nach `src/` gezogen sind. Die
Index-Fassung ist ein **reiner Umzug ohne Nachzug der Einfuhren** und hat nie übersetzt; der
Nachzug lag genau in der Fassung, die ich überschrieben habe. Ich habe die drei Zeilen auf
`../../` gesetzt — dieselbe Form, die **jede** Schwesterdatei führt (`features/timer/timer.ts`,
`features/board/board.ts`, `features/todos/attachments.ts`, alle drei nachgesehen). Der
Unterschied meiner Fassung zur eingecheckten `usecases/todos.ts` ist danach **genau diese drei
Zeilen** und sonst nichts.

**Was ich nicht behaupten kann.** Meine Fassung ist **nicht zeichengleich** mit der verlorenen.
Ich habe sechs Vertauschungen der Einfuhrreihenfolge, die Zeilenendenfassungen und den
Prettier-Durchlauf durchgerechnet — keine trifft `cfb40cf7…`. In der verlorenen Fassung stand
also **mehr** als der Einfuhrnachzug, und ich weiß nicht, was. Zum Vergleich: Der übliche nicht
vorgemerkte Anteil in diesem Baum ist Einfuhrnachzug **plus** nachgezogene Ortsangaben in
Fließtext (`usecases/…` → `features/…`, gemessen an `attachments.ts` und `tag-names.ts`) — in
`todos.ts` kommt das Wort `usecases` allerdings gar nicht vor, dieser Anteil kann es also nicht
gewesen sein.

**Woran ich messe, daß nichts Fachliches fehlt** — vier Läufe, alle nach der Wiederherstellung:

- `pnpm typecheck` **Ausgangskode 0** über alle Pakete einschließlich aller `tsconfig.test.json`
  und `tests/e2e`. Eine fehlende Ausfuhr fiele hier auf, weil die Prüffälle sie nennen.
- `npx vitest run apps/local-api/test` — **18 Dateien, 255 Prüffälle, alle grün.**
- `pnpm proof:all` **248/0, Ausgangskode 0.**
- `pnpm boundaries` grün, „Notiz-Trennung: alle Schichten unverletzt".

**Genau eine Datei ist betroffen.** Die erste Aushebelung lief gegen `src/pool-movement.ts`; die
Datei steht im Bestand als `R ` (vorgemerkt, ohne weitere Änderung), ihr sha256 ist vor und nach
der Rücknahme `6be5ce9d532a7186230a8a8a339f07fdf41d49000225977c83a97d450dde842b` — dort ist
nichts verlorengegangen.

**Die Regel, die ich mir daraus mitnehme und die hier stehen sollte:** In einem Baum mit nicht
vorgemerkten Änderungen wird ein Angriff **nicht** mit `git checkout` zurückgenommen, sondern aus
einer vorher gezogenen Kopie. T-266 hat dieselbe Messung gefahren und dieselbe Falle knapp
verfehlt, weil seine zweite Zieldatei zufällig vorgemerkt-gleich war.

**Bitte an den Orchestrator:** Wer immer `features/todos/todos.ts` in der Umstrukturierung
geschrieben hat, sollte einmal darüberlesen. Ich kann sagen, daß sie übersetzt, ihre Prüffälle
besteht und das Tor grün läßt — ich kann **nicht** sagen, daß sie zeichengleich mit der Fassung
von heute mittag ist.

---

## 1. Die Menge an der Anforderung aufgespannt

Die alte Menge:

```js
const anwendungsfaelle = DATEIEN.filter(
  (p) => !istRoute(p) &&
    ['src/features/', 'src/routes/'].some((ort) => name(p).startsWith(ort)),
);
```

**31 von 63 Dateien fielen heraus.** Die neue Menge ist die **Ergänzung**: alles unter `src/`,
außer Routendateien, außer drei ausgeschriebenen Randordnern, außer neun ausgeschriebenen
Einstiegsdateien. Die Begründung steht im Kopfabsatz des Laufs an der Stelle, an der sie gilt —
so wie bei Zeile 302 von `proof-release-safety.mjs` und bei der verworfenen `fetch`-Prüfung.

Der Grund für die Ergänzung statt einer Aufzählung, in einem Satz: **Eine neue oder verschobene
Datei landet ohne Zutun in der Messung.** Wer eine Datei herausnehmen will, muß sie
**eintragen**, und der Eintrag ist zu lesen und zu begründen. Es gibt keine Ritze mehr, durch die
etwas still fällt.

Ausdrücklich als Muster **verworfen**: „alles unmittelbar unter `src/` ist Einstieg". Das hätte
`context.ts`, `pool-movement.ts` und `tag-names.ts` wieder herausgenommen — also genau die drei
Dateien, um die es geht. Die neun Einstiegsdateien stehen deshalb einzeln da.

**Die Ausnahmeliste trägt ihren Wächter nach E-103, in beide Richtungen** (Abschnitt 5, neu):

1. Jeder der zwölf Einträge muß auf der Platte etwas treffen — eine tote Ausnahme wird rot.
2. `Routen + Rand + Einstiege + Anwendungsfälle` muß die Zahl der gelesenen Dateien **genau**
   ergeben. Die vier Mengen werden unabhängig gebildet; überschnitten sie sich, wäre die Summe
   zu groß. Heute: **9 + 19 + 9 + 26 = 63.**
3. Keine Einstiegsdatei darf zugleich Rand oder Route sein.

Gemessen vorher/nachher:

| | vorher | nachher |
|---|---|---|
| gelesene Quelldateien | 63 | 63 |
| gemessene Anwendungsfälle | 23 | **26** |
| **ungemessen** | **31** | **0** |

Die drei dazugekommenen sind genau die aus 35.2.1: `src/context.ts`, `src/pool-movement.ts`,
`src/tag-names.ts`. Der Lauf schreibt sie in seiner zweiten Kopfzeile selbst hin.

## 2. Die Marken — und ihre Reichweite, hingeschrieben

Drei Marken, im Kopfabsatz nach Tragfähigkeit geordnet, mit ausgeschriebener Grenze (A-A-55,
E-101, Form nach T-247):

1. **Die Bindung an `hono`** — fünf Wege statt einem: statische Einfuhr, Wiederausfuhr,
   Nebenwirkungseinfuhr, **dynamische Einfuhr**, `require`. Beliebiges Untermodul, einfache,
   doppelte und schräge Anführungszeichen, `@hono/…` mit. Hängt an keinem Bezeichner.
2. **Der mittelbare Weg** — hono kann einen Anwendungsfall über eine Kette örtlicher Einfuhren
   erreichen. Gerechnet wird die **Hülle** über die Einfuhrkanten des Baums; heute erreichen 15
   von 63 Modulen `hono`. Ein roter Lauf nennt die **ganze Kette**.
3. **Die eingehenden Marken** — `HTTPException` und ein Aufruf der hono-Antwortseite auf einem
   Zusammenhang, der `c` **oder `ctx`** heißt.

**Ausdrücklich nicht gefangen**, und das steht so im Quelltext:

- ein frei gewählter Name für den Zusammenhang (`const k = ctx; k.json(…)`);
- `Response` — bleibt begründet gefallen (global, nicht an hono gebunden; `version/source.ts`
  liest damit die Antwort von GitHub). `Context<` ist **nicht** verloren und der Grund steht
  daneben;
- der Eingang an hono vorbei über `node:http` — andere Anforderung, gehört `proof:route-policy`.

**Zusammengefaßt: gefangen sind Irrtum und Bequemlichkeit, nicht Absicht mit Schreibrecht.** Wer
diese Datei ändern kann, kann jeden Wächter abstellen. Der Satz steht im Lauf, damit niemand aus
einem grünen Ergebnis mehr liest, als darin steht.

### Der Zwischenfall, der zeigt, daß die Sache trägt

Meine **erste** Fassung der zweiten Marke fragte: „führt ein Anwendungsfall aus `src/http/` oder
aus einer Routendatei ein?" Sie wurde beim ersten Lauf **rot** — an
`src/routes/addin/schema.ts`, das aus `src/http/input.ts` einführt.

Das war ein **Fehlalarm**, und zwar aus genau dem Grund, gegen den dieser Auftrag geschrieben
ist: Die Marke war wieder an einem **Ordnerpräfix** aufgespannt, eine Ebene tiefer als vorher.
`http/input.ts` ist ein Bündel zod-Schemata und **bezieht `hono` nicht**; es liegt dort, weil es
dort einmal hingelegt wurde. Ein Wächter, der das rot macht, erzwingt beim nächsten Mal eine
Ausnahmeliste, und die Ausnahme wäre größer als die Regel.

Ersetzt durch die gerechnete Hülle über die Einfuhrkanten — sie kommt aus dem **Inhalt** und
nicht aus Orten. Eine Umbenennung von `src/http/` in `src/eingang/` bewegt sie nicht. Der
Vorgang steht als Absatz im Quelltext, mit dem Fehlalarm als Begründung.

## 3. Beide Aushebelungen als Gegenproben — und am echten Baum gefahren

Im Lauf (Abschnitt 6), jede einzeln, jede muß rot werden **und den Weg nennen**. Die Ziele sind
**nicht namentlich hinterlegt**, sondern aus der Menge gezogen — ein Name dort wäre wieder eine
Zusage an einen Ort. Die Gegenproben fahren `httpVerstoesse`, also **dieselbe** Funktion wie der
Ernstfall, gegen eine gedachte Fassung des Baums; die Hülle wird dabei neu gerechnet und nie
zwischengespeichert (die Falle aus T-247-7).

**Zusätzlich am echten Baum gefahren, wie T-266 es getan hat:**

Weg 1 — der Router aus 35.2.2 in `src/pool-movement.ts`:

```text
FEHL  keiner der 26 Anwendungsfälle bezieht `hono` — src/pool-movement.ts: statische Einfuhr `from 'hono…'`
FEHL  keiner der 26 erreicht `hono` über eine Kette örtlicher Einfuhren (21 von 63 Modulen erreichen es)
      — src/features/timer/bookings.ts: über `…bookings.ts` → `…movement.ts` → `src/pool-movement.ts`; … (6 Ketten)
FEHL  keiner nennt `HTTPException` … — src/pool-movement.ts: `HTTPException`; … `c` oder `ctx`
32 bestanden, 4 fehlgeschlagen.        Ausgangskode 1
```

Vorher **20/0, Ausgangskode 0**. Die Hülle nennt zusätzlich die sechs Module, die den Verstoß
mittelbar erben — das ist mehr, als der Auftrag verlangt hat, und es ist beim Aufräumen wert.
Datei danach `6be5ce9d…`, zeichengleich zurückgenommen.

Weg 2 — die dynamische Einfuhr aus 35.2.3 in `features/todos/todos.ts`:

```text
FEHL  keiner der 26 Anwendungsfälle bezieht `hono` — src/features/todos/todos.ts: dynamische Einfuhr `import('hono…')`
FEHL  keiner nennt `HTTPException` … — src/features/todos/todos.ts: Aufruf der hono-Antwortseite auf `c` oder `ctx`
33 bestanden, 3 fehlgeschlagen.        Ausgangskode 1
```

Vorher **20/0, Ausgangskode 0**. Beide Marken nennen ihren Weg getrennt. Die Rücknahme dieser
Datei ist der Schaden oben.

Dazu vier weitere neue Gegenproben, die A-A-75 Punkte (3) bis (5) einlösen: der unveränderte Baum
bleibt still; ein erfundener Randordner **und** eine erfundene Einstiegsdatei werden je als tote
Ausnahme gefunden; und drei erfundene Orte — `src/neuer-anwendungsfall.ts`,
`src/domain-nah/regel.ts`, `src/x/y/z/tief.ts` — fallen alle **in** die gemessene Menge.

Und ein neuer Prüfsatz, der aus dem Fehlalarm entstanden ist: **ein Einfuhrziel, das sich nicht
auflösen läßt, macht rot.** Über ein Modul, das der Lauf nicht findet, kann er nichts sagen; ein
Loch in der Hülle wird benannt statt still übergangen. (Genau dieser Prüfsatz hätte den Schaden
oben binnen einer Sekunde gemeldet, hätte ich ihn vor der Rücknahme gefahren.)

## 4. Die weiteren Befunde des security-checkers

- **T-266-2** — erledigt, siehe Abschnitt 2 und die zweite Gegenprobe.
- **T-266-11** — erledigt. Die sechste Gegenprobe prüfte `Array#includes`. Der Prüfsatz aus
  Abschnitt 4 steht jetzt als Funktion `merkmalIstVollstaendig` da, und **drei** Gegenproben
  fahren sie an einem echten Merkmalsnamen: fehlende `<merkmal>.ts`, fehlende `routes.ts`, und
  der vollständige Ordner wird nicht beanstandet.
- **T-266-7** — erledigt, ohne Prüfsatzänderung. Der Kommentar an `addinSurface.length === 4`
  sagt jetzt, daß es eine **Zahl und keine Menge** ist, daß ein Tausch hier grün bliebe, daß die
  Deckung bei `proof:addin` Abschnitt 18 mit den vier ausgeschriebenen Pfaden liegt (A-A-71) und
  daß dieser Lauf einzeln der schwächere ist. Warum die Zahl trotzdem stehenbleibt, steht
  daneben: Sie schlägt auch bei einer fünften Tür auf einem Pfad an, den `ADDIN_FLAECHE` gar
  nicht kennt. `proof:route-policy` unverändert **44/0**.
- **T-266-5** (`ROUTE_SOURCE_MARKERS`) — **nicht angefaßt**, wie angewiesen.

## 5. Läufe

| Lauf | Ergebnis |
|---|---|
| `proof:layers` | **36 bestanden, 0 fehlgeschlagen** (vorher 20/0) |
| `proof:all` | **248 bestanden, 0 fehlgeschlagen**, Ausgangskode 0 |
| `proof:route-policy` einzeln | 44/0, unverändert |
| `pnpm typecheck` | Ausgangskode **0**, alle Pakete und alle Prüf-`tsconfig` |
| `pnpm boundaries` | grün, Notiz-Trennung unverletzt |
| `vitest apps/local-api/test` | 18 Dateien, 255 Prüffälle, grün |

**Die eine bewegte Zahl, vorgerechnet:** `proof:layers` 20 → 36, also **+16**. Abschnitt 1
+2 (Hülle, Auflösbarkeit), Abschnitt 5 **+3** (neu), Abschnitt 6 6 → 17, also **+11**.
20 + 2 + 3 + 11 = 36. `proof:all` bewegt sich um dieselben +16 und um nichts sonst — der einzige
weitere Eingriff ist ein Kommentar in `proof-route-policy.mjs`, das gemessen bei 44/0 bleibt.

Und die Zahl, die **nicht** in der Summe steht und die eigentliche ist: **ungemessene
Quelldateien 31 → 0.**

---

Annahmen:
- **`src/http/input.ts` ist kein HTTP-Rand im Sinne dieser Zusage**, obwohl es unter `src/http/`
  liegt: Es bezieht `hono` nicht und führt zod-Schemata. Deshalb ist die zweite Marke die
  gerechnete Hülle und nicht das Ordnerpräfix. Wäre `input.ts` eines Tages hono-nah, zöge die
  Hülle es von selbst ein — die Entscheidung muß niemand nachpflegen.
- **`c` und `ctx` sind die zwei Namen, die die dritte Marke kennt.** Ein frei gewählter dritter
  Name geht durch. Ich habe die Grenze hingeschrieben, statt sie durch Aufzählen weiterer Namen
  zu verwischen — jeder weitere Name wäre wieder eine Schreibweise und keine Sache.
- **Die neun Einstiegsdateien stehen einzeln statt als Muster.** Ein Muster wäre kürzer und hätte
  genau den Fehler wiederholt, den T-266 gefunden hat.
- Die drei Einfuhrzeilen in `features/todos/todos.ts` habe ich nach der Form **jeder**
  Schwesterdatei gesetzt. Das ist eine Entscheidung ohne Rückfrage, und sie steht oben.

Risiken:
- **`features/todos/todos.ts` ist wiederhergestellt, nicht zeichengleich.** Vier Läufe sagen, daß
  nichts Fachliches fehlt; keiner kann sagen, daß nichts Redaktionelles fehlt. Das ist der
  Hauptpunkt dieses Berichts.
- **Der Baum trägt 165 Dateien mit nicht vorgemerkten Änderungen.** Jeder Agent, der einen
  Angriff am echten Baum fährt und mit `git checkout` zurücknimmt, richtet denselben Schaden an.
  Das gehört als Regel irgendwohin, wo es gelesen wird, nicht nur in diesen Bericht.
- Der Lauf mißt weiterhin nur den Dienst. Ob `packages/domain` und `packages/storage` HTTP
  kennen, sagt `boundaries`, nicht dieser Lauf. Das war vorher so und ist es weiter.
- Alles hier Gemessene gilt für **diesen Arbeitsbaum**, nicht für einen Commit.

Offene Fragen an den Orchestrator:
1. **Soll `features/todos/todos.ts` von dem Agenten gegengelesen werden, der sie in T-249..T-263
   geschrieben hat?** Ich halte es für angezeigt und kann es nicht selbst entscheiden.
2. **Der Index dieses Baums enthält Fassungen, die nie übersetzt haben** — `todos.ts` ist der
   Beleg: vorgemerkt steht ein reiner Umzug ohne Einfuhrnachzug. Wird so committet, ist der
   Bestand rot. Das ist keine Aufgabe von mir, aber es sollte jemand vor dem nächsten Commit
   ansehen.
3. **A-A-75 ist damit eingelöst; die Feststellung gehört ins Bedrohungsmodell** und das ist
   nicht meine Datei. Der security-checker möge Abschnitt 35.2 nachziehen — und dabei bitte
   prüfen, ob die Reichweitenerklärung im Kopfabsatz die Form aus T-247 trifft.

Nächster Schritt: `proof:layers` durch den security-checker gegenprüfen lassen — er hat die
zwei Wege gefunden und kennt einen dritten, wenn es ihn gibt. Parallel die Frage 2 oben
ansehen, weil sie den nächsten Commit betrifft.
