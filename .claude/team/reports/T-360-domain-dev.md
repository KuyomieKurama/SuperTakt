# T-360 — Drei Reste an der Versionsprüfung, und einer braucht kein `await`

**Rolle:** domain-dev. **Stand:** 2026-09-13 (zweiter Anlauf). **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-356-code-reviewer.md`, `T-357-security-checker.md`,
`T-349-domain-dev.md`; `docs/bedrohungsmodell.md` Abschnitt 45 (A-A-123 bis A-A-125);
`docs/spec.md` A-18.11, A-18.12, A-V-5, A-V-11, A-V-12.

**Geänderte Dateien — vier, alle in eigener Hoheit:**

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | 6g-1 mißt den **Weg** statt eines Rumpfes und verbietet die **Schleife** darauf; vier neue Gegenproben; Lückenliste um A-A-125; Zählwerk fortgeschrieben |
| `apps/local-api/src/features/version/version.ts` | vorgefundener Zwischenstand **übernommen** (A-A-123, `stop()`, A-A-124) plus zwei Stellen Selbstbeschreibung nachgezogen |
| `apps/local-api/src/features/version/source.ts` | vorgefundener Zwischenstand **übernommen** (Bedingung am Port) |
| `docs/architektur.md` | A-A-123 bis A-A-125, die Entscheidung zur Quelle, Gegenprobenzahl 96 → 100 |

`packages/**`, `tests/**`, `apps/web/**`, `features/data-transfer/**`, `features/timer/**`,
`risks.md`, `board.md`, `package.json` sind **nicht** angefaßt. Kein Prüffall geschrieben.

**Ports.** Keine eigene Bindung auf 17843/17844/5173 — vor und nach jedem Lauf frei (`ss -ltn`).
Die eine Netzmessung bindet einen **flüchtigen** Port auf `127.0.0.1` (38157 im Lauf) und
schließt ihn. Alle Meßkopien liegen im Kratzverzeichnis; im Quellordner der Versionsprüfung
liegen unverändert `routes.ts`, `source.ts`, `version.ts` und sonst nichts.

---

## 0 Der vorgefundene Zwischenstand — was er war und was ich damit gemacht habe

**Urteil: übernommen, nachdem er gemessen war.** Nicht geglaubt und nicht verworfen.

Zuerst die Einordnung, weil sie für die Bewertung trägt: `git diff` gegen `311b26e` zeigt an
`version.ts` **394** geänderte Zeilen — das ist **nicht** der abgebrochene Anlauf, sondern
T-349 **plus** T-360. T-349 ist selbst noch unveröffentlicht. Vom abgebrochenen Anlauf stammen
genau drei Dinge, und sie sind an den Befunden von T-356/T-357 zu erkennen:

1. `if (store === null) return;` als erste Zeile von `forgetStore` (A-A-123),
2. `schwebendeFristen` als Menge und ihr Abräumen in `stop()` (Befund T-356 zu `version.ts:509`),
3. der Satz am Grund `threw`, der die **Folge** nennt statt nur den Vorgang (A-A-124), dazu die
   Prosa zu beidem und die Bedingung am `ReleaseSourcePort` in `source.ts`.

Am Nachweislauf hatte er **eine** Zeile geschafft: `'Set'` in `MODUL_LAUFZEITNAMEN`. Die ist
kein Beiwerk, sondern das Ritual, das dieser Lauf selbst vorschreibt — ohne sie ist er 153/1
(„nimmt `Set` aus der Laufzeit"). Der Nullpunkt **154/0** aus dem Auftrag stimmt also, und er
stimmt nur mit dieser Zeile.

**Gemessen statt gelesen** (eigener Aufbau, Attrappen für Quelle und Speicher, Modul direkt
geladen; Mutanten sind Kopien im Kratzverzeichnis, der Arbeitsbaum steht still):

| Lage | ohne den Riegel aus dem Zwischenstand | mit ihm (heute) |
|---|---|---|
| M1 Takt 5 ms, Frist 120 ms, `write` antwortet nie, 600 ms | **24** Zeilen `…write_timeout` | **1** |
| M1b dieselbe Lage, `write` wirft | 1 × `…unwritable` | 1 × `…unwritable` |
| M2 Frist 300 ms, `stop()` nach 120 ms | **1** Zeile **nach** `stop()` | **0** |
| M3 Speicher schreibt sofort (Takt 10 ms, 400 ms) | — | 40 Anfragen, 40 Schreibversuche, **0** Zeilen |
| M3b ohne Speicher | — | 40 Anfragen, 0 Schreibversuche, 0 Zeilen |
| M4 A-18.12 bei ablaufender Frist | — | `unknown` → `known`, keine Fläche, nur `info` im Protokoll |

Damit sind beide Befunde aus T-356 behoben **und** die Behebung ist gegengeprobt: Nimmt man die
eine Zeile weg, kommen die 24 zurück; nimmt man das Abräumen in `stop()` weg, kommt die Zeile
nach dem Abschalten zurück. Der gewöhnliche Fall ist unverändert. Was ich hinzugefügt habe, sind
zwei Stellen Selbstbeschreibung in `version.ts`, die nach meiner Arbeit am Wächter sonst zu eng
gewesen wären.

---

## 1 Rest 1 — „genau eine Protokollzeile" (A-A-123, A-A-124)

Gebaut ist die Fassung, die T-356 vorgeschlagen hat: Die Ablage prüft sich selbst
(`if (store === null) return;`), und damit ist die Zusage eine über das **Modul** und nicht über
die Verdrahtung. Der zweite Befund ist mit einer Menge schwebender Fristen behoben, die `stop()`
abräumt — `unref()` heißt „hält die Ereignisschleife nicht am Leben", nicht „feuert nicht".

**A-A-124 bleibt ein benannter Preis und ist keine Behebung.** Der abgelegte Speicher bleibt für
die Laufzeit abgelegt; `app_setting.last_version_check_at` trägt danach den **letzten
geglückten** Wert weiter, und eine Datensicherung nennt einen beliebig alten Zeitpunkt, der
gültig aussieht. Auflösen ließe sich das nur am Port — er kennt `write` und sonst nichts, und
„vergiß den Wert" ist keine Schreibung eines Zeitpunkts. Das ist `packages/storage` und war mir
in diesem Auftrag ausdrücklich verwehrt. Der Preis steht jetzt an drei Stellen im Quelltext
(bei `forgetStore`, an beiden Protokollsätzen) und in `docs/architektur.md`; der Vorschlag für
einen Folgeauftrag steht unten unter „Offene Fragen".

---

## 2 Rest 3 — 6g-1 maß den Rumpf, jetzt mißt es den Weg (Befund T-356)

Der Ausgang ist zuerst **nachgestellt** worden, und zwar in der Gestalt, die wirklich durchkommt.
Meine erste Nachstellung war rot — aber aus dem falschen Grund (`Awaited` und `undefined` sind
keine festgenagelten Laufzeitnamen, 6i sprach). Mit ausschließlich festgenagelten Namen
(`ReturnType`) ist sie das, was T-356 gemessen hat:

| Gestalt in `version.ts` | `tsc` | Lauf **vorher** | am Modul |
|---|---|---|---|
| **G-1** Anfrage in örtlicher Hilfsfunktion, hängendes `await` in `run()` | Exit 0 | **154/0 grün** | **0 statt 40** Anfragen, `unknown`, 0 Zeilen |
| **G-2** synchroner Riegel in `run()` (T-357 R-4) | Exit 0 | **154/0 grün** | Dienst eingefroren |
| **G-3** derselbe Riegel in `remember`, 150 ms | Exit 0 | **154/0 grün** | **3 statt 40** Anfragen, **0** Zeilen |

Gebaut ist daraufhin die zweite der beiden von T-356 vorgeschlagenen Fassungen, weil sie die
Anforderung trifft und nicht eine Stelle: **jedes `await` auf dem Weg vom geplanten Eintritt bis
zur Anfrage**. Der Leser sucht den `setTimeout`-Rückruf, geht von dort über örtliche Aufrufe zu
dem Rumpf, in dem die Anfrage steht, und läßt auf jedem Glied davor genau **ein** `await` zu:
das, welches das nächste Glied trägt. In eine verschachtelte Funktion steigt er dabei nicht ab —
was dort wartet, hält das Glied nicht auf, es sei denn, das Glied wartet auf den Aufruf, und dann
steht das `await` sichtbar da.

**Beidseitig, wie beauftragt.** Die zweite Richtung steht **in** der Regel: Findet der Leser den
Weg nicht, ist das ein Befund. Ohne diesen Satz wäre er über jeder Aussage über einen Weg, den
es nicht gibt, stumm und grün — dieselbe Lehre wie bei der leeren Warteliste aus T-349.

Heute ist der Weg eingliedrig: `<Zeitgeberrückruf> → run`.

---

## 3 Rest 2 — der fünfte Weg, gemessen und **teilweise** gefangen (A-A-125)

**Die Antwort auf die gestellte Frage: ja, eine Gestalt ist zu fangen, die Klasse nicht — und
der Preis ist keine Zeile, sondern die Schleife.**

Gebaut ist eine Regel über eine **Eigenschaft** statt über eine Aufzählung: Auf dem Weg und in
allem, was von ihm aus **synchron** erreichbar ist, steht keine Schleife (`while`, `do`, `for`,
`for…in`, `for…of`). Damit sind G-2 **und** G-3 rot — die laute Fassung im Eintritt und die
leise eine Funktion tiefer, die T-357 als die gefährliche benannt hat.

**Wie weit das greift, ist gezählt und nicht geschätzt:** Das Modul hat **elf** benannte
örtliche Funktionen; **zehn** davon liegen im synchron erreichbaren Abschluß (alles außer der
Fabrik `createVersionChecker` selbst). Verboten ist dort **eine Sprachform**, nicht eine Zeile;
das Modul enthält heute genau **eine** Schleife, und die steht in `stop()` — einem Mitglied des
zurückgegebenen Objektliterals, das von diesem Weg aus nicht erreichbar ist. Der Lauf ist
deshalb grün, ohne daß irgend etwas umgebaut werden mußte. Wer künftig eine Schleife auf diesem
Weg braucht, wird rot und bestätigt sie — dasselbe Ritual wie bei `MODUL_LAUFZEITNAMEN`.

**Was damit ausdrücklich nicht geschlossen ist** (steht jetzt in der Lückenliste bei
`checkNoStoreReadback`): Ein **fremder** Aufruf, der synchron nicht zurückkehrt, hat in diesem
Modul keine Schleife, sondern einen **Namen**. Drei Namen auf diesem Weg kommen von außen —
`now`, `logger` und der Rumpf einer Funktion aus einem fremden Paket (Art (V)). Für `store.write`
nagelt 6g-2 die Anweisungen des einen Adapters zeichengleich fest; für die übrigen liest dieser
Lauf nichts, und ein `conn.prepare(…).run(…)`, das auf eine Sperre wartet, ist von einem, das
schreibt, in keinem Quelltext zu unterscheiden. Wer die Klasse schließen will, schließt sie an
der **Bauart** — eine ausgehende Anfrage, die nicht hinter einem synchronen Rumpf hängt —, nicht
an einer Liste von Schreibweisen. Eine Aufzählung hätte hier dieselbe Niederlage geholt wie
zweimal bei 6i (T-346, T-347 K-10c).

---

## 4 Rest 4 — die Quelle bekommt denselben Riegel **nicht**, und warum

**Entscheidung getroffen, mit Zahl.** Die Lage ist reproduziert: Eine Quelle, deren `latest` nie
antwortet, ergibt **1** Anfrage, Zustand `unknown`, **0** Protokollzeilen (M5).

Dagegen stehen drei Gründe, die einzeln nicht tragen und zusammen schon:

1. **Die gebaute Quelle bringt ihre Gesamtfrist selbst mit, und die trägt auch den Rumpf.** Das
   ist nachgemessen und nicht von T-357 übernommen: eigener Wirt auf einem flüchtigen Port,
   200 mit Kopfzeilen sofort, Rumpf tropft — **Ausgang nach 5 002 ms**, `{"ok":false,"reason":
   "timeout"}`. Der Umweg lief über den `fetch`-Port der Quelle; `source.ts` blieb unberührt.
2. **Ein Riegel hieße überlappende ausgehende Anfragen.** Ein fremdes Versprechen ist nicht zu
   beenden, nur stehenzulassen: Wer nach einer Frist weitermacht, hat die erste Anfrage noch
   unterwegs, wenn die zweite hinausgeht. Genau die eine, selbstgetaktete Anfrage ist der Grund,
   warum dieses Modul so gebaut ist (R-19, A-V-11).
3. **Er kostete die Zusage, die heute mißt.** Ein Riegel steht als `Promise.race([…])`; die
   Anfrage stünde dann nicht mehr unmittelbar unter dem einen `await`, und 6g-1 mißt genau das
   (gemessen: `Promise.all` daneben ist rot).

Was bleibt, ist als **Bedingung am Port** aufgeschrieben — wer `ReleaseSourcePort` einsetzt,
bringt eine eigene Gesamtfrist mit; der Prüfer hat keine. Das ist die Stelle, an der ein
künftiger zweiter Adapter geprüft wird, und sie steht in `source.ts`, nicht in einem Bericht.

---

## 5 Läufe, jeder mit Zahl

| Lauf | Ergebnis |
|---|---|
| `proof:release-safety` Nullpunkt / Endpunkt | **154/0** → **158/0** (122 Gegenproben, 122 mit `erwartet`) |
| Gestalten G-1, G-2, G-3 gegen den **alten** Leser | 3 × `tsc` Exit 0, 3 × **154/0 grün** |
| dieselben gegen den **neuen** Leser | 3 × `tsc` Exit 0, 3 × **157/1 rot**, je mit benennendem Satz |
| Rückfall-Gestalten R-1, R-2, R-3 aus T-357 | 3 × `tsc` Exit 0, 3 × **157/1 rot** (unverändert gefangen) |
| Leser-Mutationen: Weg-Regel / Untergrenze / Schleifen-Regel abgeschaltet | **157/1**, **157/1**, **156/2** — 1+1+2 = 4 = Zahl der neuen Einträge, keine fremde Zeile fällt mit |
| Modulmessung `version.ts` (M1, M1b, M2, M3, M3b, M4, M5) | Tabellen oben; Mutanten für „ohne Riegel" und „ohne Abräumen" |
| Netzmessung gegen tropfenden Rumpf (flüchtiger Port 38157) | **5 002 ms**, `reason: timeout` |
| `pnpm typecheck` (8 Pakete + Prüf- und E2E-Programme) | **Exit 0** |
| `vitest run apps/local-api/test/version` | **2 Dateien, 52 Prüffälle grün** |
| `proof:codepoints` / `layers` / `callers` / `route-policy` / `template-fields` / `db-permissions` / `openapi` | **46/0** · 36/0 · grün · 48/0 · 30/0 · 27/0 · **115/0** |
| `version.ts` nach allen Gestalten byteweise gleich | `md5` vor und nach jedem Lauf gleich |
| **nicht gefahren** | `verify:bundle`, `test:e2e`, `proof:access`/`conflicts`/`tags`/`export`/`export-api`/`taskpane`/`addin`/`addin-wiring` (Ports), `test:rust`, `build`, `audit`, `pnpm check` als Ganzes |

---

## 6 Vorschlag für `risks.md` (nicht von mir geändert)

**R-30 — anzuhängen:**

> **Fortgeschrieben am 2026-09-13 (T-360), Klasse enger, nicht zu.** Die drei Befunde aus
> T-356/T-357 sind behoben und gemessen: „genau eine Zeile" gilt jetzt für das Modul
> (24 → **1** bei Takt 5 ms und Frist 120 ms), nach `stop()` kommt **keine** Zeile mehr an
> (1 → 0), und der gewöhnliche Fall ist unverändert (40 Anfragen, 0 Zeilen). Der Wächter mißt
> seit T-360 den **Weg** statt eines Rumpfes: Die Gestalt aus T-356 — Anfrage eine Funktion
> tiefer, hängendes `await` in `run()`, am Modul **0 statt 40** Anfragen — war `tsc` Exit 0 und
> 154/0 grün und ist jetzt 157/1 rot. **Die zweite Achse ist teilweise geschlossen:** Ein
> synchroner Riegel auf dem Weg ist rot, solange er eine **Schleife** ist (beide Gestalten aus
> T-357, laut wie leise). Ein **fremder** Aufruf, der synchron nicht zurückkehrt, bleibt
> ungemessen — er hat keine Schleife, sondern einen Namen, und für `now`, `logger` und den Rumpf
> eines fremden Pakets liest kein Lauf etwas. **Offen bleibt außerdem**, daß eine Quelle, deren
> `latest` nie antwortet, `run()` aufhält (1 Anfrage, 0 Zeilen); eng gehalten wird das allein von
> der Gesamtfrist der gebauten Quelle, und die ist erneut nachgemessen: **5 002 ms**,
> `reason: timeout`, gegen einen eigenen tropfenden Wirt. Die Entscheidung gegen einen zweiten
> Riegel ist in `version.ts` und `docs/architektur.md` begründet (überlappende Anfragen; der
> Riegel kostete die Zusage, die heute mißt).

---

## Kurzfassung

```
Aufgabe: T-360 — Drei Reste an der Versionsprüfung, und einer braucht kein `await`
Status: fertig (braucht Review)
Artefakte: apps/local-api/scripts/proof-release-safety.mjs,
  apps/local-api/src/features/version/version.ts, .../source.ts, docs/architektur.md,
  .claude/team/reports/T-360-domain-dev.md
Zusammenfassung: Den vorgefundenen Zwischenstand habe ich zuerst eingeordnet (von den 394
  geänderten Zeilen in `version.ts` stammt der größte Teil aus T-349, nicht aus dem Abbruch)
  und dann gemessen statt geglaubt: Die drei Dinge des Abbruchs — Riegel in `forgetStore`,
  Abräumen der schwebenden Fristen in `stop()`, der Satz zu A-A-124 — sind gegengeprobt (24 → 1
  Zeile; 1 → 0 Zeilen nach `stop()`; gewöhnlicher Fall unverändert 40/0) und übernommen; die
  eine Zeile, die er am Wächter geschafft hatte (`Set`), ist der Grund, warum der Nullpunkt
  überhaupt 154/0 war. Neu gebaut ist die Erweiterung von 6g-1: Gemessen wird der **Weg** vom
  `setTimeout`-Rückruf bis zu dem Rumpf mit der Anfrage — jedes Glied wartet auf genau eines,
  das nächste — und dazu die **Schleife** auf diesem Weg und in allem, was von ihm aus synchron
  erreichbar ist. Damit sind alle drei gemessenen Ausgänge rot, die vorher grün waren (Anfrage
  eine Funktion tiefer: 0 statt 40 Anfragen; Riegel in `run()`; Riegel in `remember`: 3 statt 40,
  Protokoll leer), jeder mit `tsc` Exit 0. Vier neue Gegenproben, 154/0 → 158/0, und jede neue
  Zeile des Lesers einzeln abgeschaltet macht genau ihre eigenen rot (1+1+2). Für die Quelle ist
  entschieden, keinen zweiten Riegel zu bauen; die tragende Zahl dafür ist nachgemessen (5 002 ms,
  `reason: timeout`, gegen einen eigenen tropfenden Wirt).
Annahmen: (1) Der Zwischenstand wird übernommen, weil er gemessen trägt — nicht, weil er
  dastand; jede seiner drei Wirkungen ist gegen einen Mutanten ohne sie gemessen. (2) Die
  Schleifensperre gilt für den synchron erreichbaren Abschluß (10 von 11 benannten Funktionen)
  und nicht nur für die Glieder des Weges, weil die **leise** Gestalt aus T-357 genau eine
  Funktion tiefer sitzt. Verboten ist dort eine Sprachform, keine Zeile; das Modul hat heute
  genau eine Schleife, und die steht in `stop()`, außerhalb dieser Menge. (3) A-A-124 ist als
  Preis benannt und nicht behoben — die Behebung säße am Port in `packages/storage`, und der war
  mir in diesem Auftrag verwehrt.
Risiken: Die Klasse „ein Riegel braucht kein `await`" ist **enger, nicht zu**: Ein fremder
  Aufruf, der synchron nicht zurückkehrt, hat keine Schleife, sondern einen Namen — `now`,
  `logger` und der Rumpf eines fremden Pakets sind auf diesem Weg ungemessen. Das steht als
  benannte Lücke im Nachweis, nicht als Zusage. Die Schleifensperre ist ein Ritual mit Preis:
  Wer später eine Schleife auf diesem Weg braucht, wird rot und muß sie bestätigen. Der Weg wird
  über `setTimeout` als **freien Namen** gefunden; ein Zeitgeber aus einer Einfuhr (`node:timers`)
  wäre für diesen Leser keiner — er sagt es dann („von keinem `setTimeout`-Rückruf erreicht"),
  aber 6a müßte die Einfuhr ohnehin schon abweisen.
Offene Fragen: (1) **A-A-124 braucht einen eigenen Auftrag an `packages/storage`:** Der Port
  kennt nur `write`; solange er kein „vergiß den Wert" kennt, hinterläßt ein abgelegter Speicher
  einen veralteten statt eines fehlenden Zeitpunkts in der Datensicherung. Mein Vorschlag ist
  **nicht** ein zweites Portmitglied, sondern ein Schreiben von `null` — das bleibt eine
  Schreibung und läßt die Zusage „kein Rückweg" unberührt; entschieden ist es nicht.
  (2) Der Wortlaut für R-30 steht in Abschnitt 6 dieses Berichts.
  (3) Kein Prüffall geschrieben und keiner geändert — `apps/local-api/test/version` ist mit
  52/52 grün. Der Fall, der den **Anstoß** gegen den **Abschluß** festnagelt, ist von meiner
  Arbeit nicht berührt; T-355 hat nichts nachzuziehen.
Nächster Schritt: (a) code-reviewer und security-checker über diese vier Dateien — insbesondere
  gegen die beiden neuen Sätze von 6g-1 ansetzen, nicht gegen die alten: Die interessante Frage
  ist, ob ein Weg zu finden ist, der weder ein `await` auf einem Glied noch eine Schleife im
  Abschluß braucht. (b) Danach der Auftrag zu A-A-124 an `packages/storage` samt Prüffall in
  getrennter Welle (Schnittstelle und Messung nie gleichzeitig, T-315/T-316).
```
