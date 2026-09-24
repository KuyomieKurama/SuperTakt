Aufgabe: T-088 — Prüffälle zu E-057 und `typecheck:test` grün

Status: fertig

---

Artefakte:

```
packages/domain/test/board.test.ts                       25 Literale um `unresolvedRequired: false`
                                                          ergänzt (24 BoardColumnRule-Objekte, ein
                                                          matchesPool-Aufruf, der jetzt
                                                          `column.unresolvedRequired` durchreicht)
packages/domain/test/tags-and-pools.test.ts               9 matchesPool-Aufrufe um
                                                          `unresolvedRequired: false` ergänzt
packages/domain/test/timer.test.ts                        toter Typimport `TimerStartResult` entfernt
                                                          (TS6196)
packages/domain/test/pool-rule-unresolved.test.ts         NEU — reine Funktionen `tagAxisIsUnresolved`
                                                          und `poolRuleMatchesNothing`, die vier Ecken
                                                          aus T-082 §4 plus der termweise Fall, je mit
                                                          unabhängiger Vergleichsfunktion als
                                                          Rot-Nachweis
packages/storage/test/repo-time.test.ts                   `CalendarDay`-Marke aus `@takt/domain`
                                                          benutzt statt zweier nackter Strings
packages/storage/test/repo-todos.test.ts                  Kreuzprüfung `pools.members`/`matchesPool`
                                                          von `resolvePoolRule` auf `resolvePoolAxis` +
                                                          `tagAxisIsUnresolved` umgestellt
                                                          (Modulfunktionen aus `repo-tags.ts`)
packages/storage/test/pool-rule-unresolved-required.test.ts
                                                          NEU — die vier Fälle aus T-082 §4 an
                                                          `pools.members`/SQL-Übersetzung, jeder mit
                                                          Gegenprobe; Fall 4 zusätzlich über den PORT
                                                          `PoolPort.resolveAxes` (bislang ungetestet)
packages/export/test/exportability.test.ts                zweite Importzeile von
packages/export/test/note-boundary-property.test.ts       `@takt/domain/export` auf `@takt/domain`
packages/export/test/plan.test.ts                         umgestellt (`CalendarDay`, `TimeEntryId`,
packages/export/test/render-defensive-guards.test.ts      `Timestamp`, `TodoId` werden von der
packages/export/test/templates.test.ts                    Exportgrenze nicht re-exportiert)
.claude/team/reports/T-088-unit-tester.md                 dieser Bericht
```

Nicht angefasst: jede Datei unter `src/` in allen drei Paketen. Kein Befund, der eine Behebung in
Produktivcode nötig gemacht hätte — dazu unten mehr.

---

Zusammenfassung:

`pnpm run typecheck:test` ist grün: 62 Fehler auf 0. In domain und storage lag das ausschließlich
an fehlenden `unresolvedRequired`-Werten in bestehenden Testliteralen (E-057) und zwei falsch
typisierten Zeichenketten statt `CalendarDay`; in export an einem falschen Einstiegspunkt für vier
Markentypen, die `@takt/domain/export` nie führte. Zusätzlich stehen jetzt die vier Prüffälle aus
`T-082-domain-dev.md` §4 an zwei Ebenen: als reine Funktionsprüfung in `packages/domain/test/`
(`tagAxisIsUnresolved`, `poolRuleMatchesNothing`, die geforderten Ecken `(1,0,1)`, `(0,0,0)`,
`(1,1,0)`, `(0,3,0)`, `(2,1,1)`) und als Integrationsprüfung gegen die echte SQL-Übersetzung in
`packages/storage/test/` (`pools.members`), jeweils mit der verlangten Gegenprobe und einer
unabhängig geschriebenen, nachweislich falschen Vergleichsfunktion statt eines bloßen
Gleichheitstests. Alle 37 Testdateien (595 Prüffälle) in den drei Paketen sind grün,
`pnpm run test:coverage` hält die 80-Prozent-Schwelle in allen drei Paketen ein, und
`pnpm run typecheck` läuft inzwischen vollständig durch — die für T-086 angekündigte rote Stelle in
`routes/addin/service.ts:326` war bei meiner Messung bereits behoben (Patch aus T-082 §5 ist im
Repository sichtbar).

---

## 1. Lage Teil 1 — `typecheck:test` grün

### 1.1 `packages/domain`

**`board.test.ts` und `tags-and-pools.test.ts`.** Beide Dateien bauen `BoardColumnRule`- und
`MatchesPoolRule`-Literale ausschließlich aus bereits **aufgelösten** Tagkennungen zusammen — kein
einziges Literal in diesen beiden Dateien enthält einen Ordnerterm oder eine sonstige Quelle, aus
der `unresolvedRequired: true` folgen könnte. Ich habe deshalb nicht blind `false` eingetragen,
sondern jedes der 33 betroffenen Literale einzeln daraufhin gelesen, ob es einen Ordnerterm meint —
keines tut das, also ist `false` in jedem Fall die sachlich richtige, nicht nur die
typprüfungs-beruhigende Antwort. Eine Ausnahme lag anders: Der Kreuzprüfungstest in `board.test.ts`
(„Übereinstimmung mit `matchesPool`") und die vier Spalten `c1`–`c4` bauen das erwartete Ergebnis
unabhängig aus `matchesPool` nach; dort reiche ich jetzt `column.unresolvedRequired` durch (statt
eines zweiten hartkodierten `false`), damit der Test tatsächlich prüft, was durchgereicht wird, und
nicht nur, was ich vermute.

**`timer.test.ts`.** `TimerStartResult` war importiert, aber nirgends benutzt (TS6196) — laut Kopfkommentar der Datei ein Typ, den `decideTimerStart` nie in dieser Form braucht; ich habe ihn aus dem Typimport entfernt, ohne den Text der Datei sonst anzufassen.

### 1.2 `packages/storage`

**`repo-time.test.ts:132`.** Zwei nackte Zeichenketten (`'2026-08-30'`) standen dort, wo
`TodoTimeEntrySearchFilter.fromDay`/`.toDay` eine `CalendarDay`-Marke verlangen. Ich habe **nicht**
`as unknown as CalendarDay` an der Aufrufstelle eingestreut, sondern — wie von der Aufgabe verlangt
(„Marke aus der Domäne benutzen") — denselben Helfer übernommen, den
`calendar-day-boundary.test.ts` bereits für genau diesen Zweck führt: `const day = (value: string):
CalendarDay => value as CalendarDay;`, mit `CalendarDay` importiert aus `@takt/domain`. Das ist
dieselbe Marke, keine zweite Fassung davon.

**`repo-todos.test.ts:719`.** Das war der in T-082 §4 namentlich genannte Fall: Die Kreuzprüfung
`pools.members` gegen `matchesPool` rief `resolvePoolRule` (liefert nur eine flache Tagliste) und
konnte `unresolvedRequired` deshalb gar nicht ermitteln — mit dem Pflichtfeld wäre das zur Laufzeit
`undefined` gewesen, also die Antwort von vor E-057, unbemerkt, weil beide Seiten (SQL-Abfrage und
handgebauter Vergleich) denselben Fehler gemacht hätten. Ich habe die Kreuzprüfung exakt nach dem im
Bericht vorgezeichneten Muster auf `resolvePoolAxis` (liefert `{named, tagIds, emptyFolderIds}`) und
`tagAxisIsUnresolved` aus `@takt/domain` umgestellt. Der bestehende bunte Bestand aus vier Karten und
sechs Spalten (darunter „Erledigt", „Noch nicht abgerechnet", „Leer") bleibt unverändert — keiner
dieser sechs Pools benutzt einen Ordnerterm, also ändert die Umstellung an sich das Ergebnis dieses
bestehenden Tests nicht; sie macht ihn nur wieder typkorrekt **und** tatsächlich diskriminierend für
künftige Ordnerterme in diesem Bestand.

### 1.3 `packages/export`

Alle fünf betroffenen Dateien importierten `CalendarDay`, `TimeEntryId`, `Timestamp`, `TodoId` aus
`@takt/domain/export` — dem schmalen Einstiegspunkt, der laut Kopfkommentar von
`packages/domain/src/export.ts` diese vier Markentypen absichtlich nicht re-exportiert (sie werden
dort nur `import type`et, nicht `export type`et; nachgesehen mit `grep -n "^export"`). Der
`check-export-boundary.mjs`-Wächter scannt ausdrücklich nur `packages/export/src` (Zeile 228,
`collect(path.join(exportRoot, 'src'), …)`), **nicht** `packages/export/test` — Testdateien dürfen
also den vollen `@takt/domain`-Einstieg sehen, ohne die Notiz-Trennung zu verletzen (dort steht
ohnehin kein `Todo`, kein `TodoNote`). Ich habe deshalb ausschließlich die zweite Importzeile (die
vier Markentypen) auf `@takt/domain` umgehängt; die erste Zeile (`ExportGroup`,
`ExportSourcePath`, `ExportSystemContext`) bleibt bei `@takt/domain/export`, weil die dort korrekt
und absichtlich re-exportiert sind. Danach `pnpm run boundaries` erneut gelaufen: grün, „Notiz-
Trennung: alle Schichten unverletzt."

---

## 2. Lage Teil 2 — die vier Fälle aus T-082 §4, mit Gegenprobe und Rot-Nachweis

Meine Hoheit ist ausschließlich `packages/*/test/**` — ich habe `src` an keiner Stelle angefasst,
auch nicht vorübergehend zum Messen. Für jeden Fall stehen deshalb **zwei** Nachweise nebeneinander:
was T-082 selbst am laufenden Dienst gemessen hat (Referenz, nicht wiederholt), und ein von mir
selbst ausgeführter Nachweis auf Ebene der reinen Funktion, der ohne `src` anzufassen auskommt —
durch eine unabhängig in der Testdatei geschriebene, nachweislich **falsche** Vergleichsfunktion,
nicht durch einen Gleichheitstest, den beide Seiten gleich falsch bestehen könnten.

### Fall 1 — Gemischte Achse (`pool-rule-unresolved-required.test.ts`)

Regel: ein leerer Ordnerterm **und** `statusIds`. `pools.members` liefert nichts. Gegenprobe:
dieselbe `statusIds`-Achse ohne den Ordner liefert die Karte mit passendem Status.

*Würde rot, wenn entfernt:* `packages/storage/src/sqlite/repo-todos.ts:229`
(`unresolvedRequired: pool.unresolvedRequired,` — durch `false` ersetzt). Gemessen von T-082 selbst
(§4a, „Entscheidung ganz aus"): `karten: 2` statt `0` an genau dieser Spaltenform. Ich reproduziere
dasselbe Muster in der Testdatei als eigenständigen `matchesPool`-Aufruf mit
`unresolvedRequired: false` erzwungen — der liefert `true`, wo `pools.members` `[]` liefert.

### Fall 2 — Gemischte Terme (`pool-rule-unresolved-required.test.ts`)

Regel `[{tag}, {folder leer}]`, `matchMode: 'any'`. Liefert nichts, obwohl der Tagterm für sich
einen Tag beisteuert (Gegenprobe: derselbe Tagterm allein liefert die Karte).

*Würde rot, wenn entfernt:* `packages/storage/src/sqlite/unit-of-work.ts:116`
(`emptyTerms: required.emptyFolderIds.length,` — durch `0` ersetzt, also achsenweise statt
termweise). Gemessen von T-082 selbst (§4b): `tagCount: 1` bei gleichzeitig genanntem leerem
Ordner. In meiner Testdatei rufe ich `tagAxisIsUnresolved` zusätzlich direkt zweimal auf — einmal
mit `emptyTerms: 1` (termweise, echt), einmal mit `emptyTerms: 0` (achsenweise, falsch) — und zeige,
dass die achsenweise Fassung `false` liefert, wo `pools.members` `[]` liefert.

### Fall 3 — Ausschluss über einen leeren Ordner (`pool-rule-unresolved-required.test.ts`)

`excludedTags: [{folder leer}]` neben einem Tagterm liefert **dieselbe** Menge wie ohne den
Ausschluss. Das ist der Fall, an dem eine zu grobe Behebung auffällt: Wer `unresolvedRequired`
versehentlich auch auf die **ausgeschlossene** Achse anwendet, macht aus „keiner davon über nichts
schließt nichts aus" ein „trifft nichts".

Für diesen Fall gibt es in T-082 keine passende Vorher-Messung, weil die Domäne diese Verallgemeinerung nie gemacht hat — es ist eine Regressionssicherung gegen eine Behebung, die es nie
gab, nicht der Nachweis einer, die es gab. Ich habe den Nachweis deshalb ausschließlich über eine
in der Testdatei selbst geschriebene „zu grobe" Vergleichsfunktion geführt: Sie wendet
`tagAxisIsUnresolved` fälschlich auf die aufgelöste **Ausschluss**-Achse an und würde `false` statt
der tatsächlichen, nicht leeren Kartenmenge liefern. Sollte diese Verallgemeinerung künftig
tatsächlich in `packages/domain/src/tag.ts` (etwa in `poolRuleMatchesNothing`, aktuell Zeile 1004:
`poolRuleIsEmpty(axes) || axes.unresolvedRequired`) oder in
`packages/storage/src/sqlite/unit-of-work.ts`/`repo-todos.ts` eingebaut werden, wird genau dieser
Test rot, weil `withUselessExclusion` dann plötzlich leer bliebe.

### Fall 4 — Kreuzprüfung `pools.members` gegen `matchesPool` (`pool-rule-unresolved-required.test.ts`)

Für dieselben drei Spaltenformen aus Fall 1–3 und drei passend gebaute Karten läuft die
Kreuzprüfung über den **Port** `PoolPort.resolveAxes` (nicht über die interne Repo-Funktion
`resolvePoolAxis`, die der allgemeine Kreuzprüfungstest in `repo-todos.test.ts` benutzt) — genau der
Weg, den auch `routes/addin/service.ts` (`poolNamer`, T-082 §5) inzwischen geht. `PoolPort.resolveAxes` hatte vor dieser Aufgabe keinen einzigen Testfall in `packages/storage/test/**` (nachgesehen: `grep -rn resolveAxes packages/storage/test/*.test.ts` traf vorher nichts). Eine Gegenprobe zählt die Vergleiche (`columns.length * cards.length`) und dass genau zwei der drei Spalten leer bleiben, damit ein zufällig leerer Bestand nicht denselben grünen Test ergäbe.

*Würde rot, wenn entfernt:* dieselben zwei Zeilen wie Fall 1 und Fall 2, plus — spezifisch für den
Port-Pfad — `packages/storage/src/sqlite/repo-tags.ts`, `resolveAxes`-Implementierung (liefert
`required`/`excluded` je mit `tagIds` und `emptyFolderIds`; würde eine der beiden Listen weglassen
oder vertauschen, träfe die Kreuzprüfung sofort auseinander).

### Die reinen Funktionen — `pool-rule-unresolved.test.ts` (domain)

Fünf Ecken `(named, resolved, emptyTerms)`:

| Ecke | Erwartung | Diskriminierend? |
|---|---|---|
| `(1,0,1)` | `true` | Nein — ein einzelner Ordnerterm ist schon über `resolved === 0` erkennbar; die `emptyTerms`-Klausel und die alte `named>0 && resolved===0`-Klausel stimmen hier überein, weil bislang nur Ordnerterme leer ausgehen können. |
| `(0,0,0)` | `false` | Nein — Randbedingung: keine Achse genannt, `poolRuleIsEmpty` entscheidet, nicht diese Funktion. |
| `(1,1,0)` | `false` | Nein — ein Term, sauber aufgelöst. |
| `(0,3,0)` | `false` | Nein — dokumentiert, dass `named` und nicht `resolved` die Vorfrage entscheidet; in der Praxis unerreichbar, weil Tags nie ohne Term entstehen. |
| `(2,1,1)` | `true` | **Ja** — das ist die einzige Ecke, an der eine termweise und eine achsenweise Zählung auseinanderlaufen. Ich habe daneben eine unabhängige `axisWiseWrong`-Funktion geschrieben (`named>0 && resolved===0`, die Formel **ohne** die `emptyTerms`-Klausel) und geprüft, dass sie hier `false` liefert — das Gegenteil der echten Funktion. |

*Würde rot, wenn entfernt:* `packages/domain/src/tag.ts:953`
(`axis.emptyTerms > 0 || (axis.named > 0 && axis.resolved === 0)` — die erste Teilbedingung
gestrichen). Nur die Ecke `(2,1,1)` würde kippen, die übrigen vier blieben unverändert grün — das
steht so auch im Kommentar der Testdatei, damit niemand die vier Randfälle für vollwertige
Rot-Nachweise hält, die sie nicht sind.

Dazu `poolRuleMatchesNothing`: eine neutrale Regel (`isEmpty=true`) trifft nichts; eine „gemischte
Achse" (`isEmpty=false`, `unresolvedRequired=true`) trifft ebenfalls nichts — mit einer unabhängig
geschriebenen `isEmptyOnly`-Vergleichsfunktion (reproduziert `poolRuleIsEmpty` von Hand, ohne
`axes.unresolvedRequired`), die hier `false` liefert, wo die echte Funktion `true` liefert; und eine
Regel mit genannter, sauber aufgelöster Bedingung trifft nicht „nichts" (Sanity, keiner der beiden
Gründe greift).

*Würde rot, wenn entfernt:* `packages/domain/src/tag.ts:1004`
(`poolRuleIsEmpty(axes) || axes.unresolvedRequired` — auf `poolRuleIsEmpty(axes)` gekürzt). Genau
der von T-082 §4a gemessene Fall, hier auf Ebene der reinen Funktion nachvollzogen.

---

## 3. Messungen

```
pnpm run typecheck:test                                    Exitcode 0 (vorher 62 Fehler)
pnpm vitest run packages/domain --passWithNoTests            8 Testdateien, 139 Prüffälle, grün
pnpm vitest run packages/storage --passWithNoTests           21 Testdateien, 336 Prüffälle, grün
pnpm vitest run packages/export --passWithNoTests             8 Testdateien, 120 Prüffälle, grün
pnpm run test:coverage                                      Exitcode 0, 37 Testdateien, 595 Prüffälle
                                                            domain/src   88.56 % Stmts / 85.79 % Branch
                                                            export/src   97.95 % Stmts / 92.26 % Branch
                                                            storage/src  90.26 % Stmts / 81.84 % Branch
                                                            (Sqlite-Unterordner; alle drei Schwellen
                                                            aus vitest.config.ts bei 80 % eingehalten)
pnpm run boundaries                                        grün, „Notiz-Trennung: alle Schichten
                                                            unverletzt"
pnpm run typecheck                                         Exitcode 0 — vollständig, einschließlich
                                                            apps/local-api; die für T-086 erwartete
                                                            rote Stelle in
                                                            routes/addin/service.ts:326 war zum
                                                            Messzeitpunkt bereits durch den in T-082 §5
                                                            beschriebenen Patch behoben (nachgesehen:
                                                            `unresolvedRequired` steht dort inzwischen
                                                            in `poolNamer`)
```

`pnpm --filter @takt/domain test` / `@takt/storage test` / `@takt/export test` — wie in der Aufgabe
vorgeschlagen ausprobiert, liefern aber **keine** Prüfläufe: Keines der drei `package.json` führt
ein `test`-Skript (nachgesehen mit `grep`), der Testlauf ist im Arbeitsbereich zentral über die
Wurzel-`vitest.config.ts` organisiert (`include: ['packages/*/test/**/*.{test,spec}.{ts,tsx,mts}',
…]`). `pnpm --filter … test` beendet sich dabei lautlos mit Exitcode 0, ohne eine einzige Zeile
Ausgabe — das sieht nach einem grünen Lauf aus, ist aber keiner. Ich habe stattdessen
`pnpm vitest run packages/<paket> --passWithNoTests` benutzt, das dieselbe Wurzelkonfiguration lädt
und nur den Pfad einschränkt.

---

Annahmen:

- **`unresolvedRequired: false` in `board.test.ts`/`tags-and-pools.test.ts` ist inhaltlich richtig,
  nicht nur pragmatisch.** Ich habe jedes der 33 betroffenen Literale gegen die Frage „meint das
  einen Ordnerterm?" gelesen; keines tut das. Die Aufgabe warnte ausdrücklich davor, blind `false`
  einzutragen — an keiner Stelle war das nötig.
- **Kein neuer Prüffall wandert in `board.test.ts` oder `tags-and-pools.test.ts` hinein.** Diese
  beiden Dateien haben laut eigenem Kopfkommentar einen festen Testplan-Bezug (TP-TAG-\*, T-069);
  die vier neuen E-057-Fälle stehen deshalb in eigenen Dateien
  (`pool-rule-unresolved.test.ts`, `pool-rule-unresolved-required.test.ts`), nicht eingemischt in
  bestehende Beschreibungsblöcke.
- **Fall 4 läuft zusätzlich über `PoolPort.resolveAxes`**, nicht (nur) über die interne
  `resolvePoolAxis`-Funktion aus `repo-tags.ts`, die die allgemeine Kreuzprüfung in
  `repo-todos.test.ts` schon vor T-082 benutzte. Beide Wege sind jetzt geprüft; ohne diese
  Entscheidung hätte der Port selbst — genau der Weg, den das Add-in nimmt — keinen eigenen
  Prüffall gehabt.
- **Der `CalendarDay`-Helfer in `repo-time.test.ts` ist eine wörtliche Übernahme** aus
  `calendar-day-boundary.test.ts`, keine dritte Variante. Zwei verschiedene Helfer mit derselben
  Aufgabe in zwei Testdateien wären genau die Art Doppelung, die dieses Projekt sonst konsequent
  vermeidet.
- **Fall 3 hat keine „vorher"-Messung von T-082**, weil die dort behobene Regel diese
  Verallgemeinerung nie gemacht hat. Ich habe das im Bericht ausdrücklich als Regressionssicherung
  gegen eine mögliche künftige Über-Behebung gekennzeichnet, nicht als Nachweis einer vergangenen.

Risiken:

- **Keine sicherheitsrelevanten Befunde.** Alle neuen Testdaten sind erfunden (Tags „Support",
  „Beratung", Ordner „Ost", „Leer" usw.), keine echten Call-Nummern, keine Zugangsdaten.
- **Kein Fehler in `src` aufgedeckt.** Alle vier T-082-Fälle, die vier Ecken und der termweise Fall
  verhalten sich exakt so, wie die Domäne und die SQL-Übersetzung es seit T-082 vorsehen — es gab in
  dieser Aufgabe nichts an den Orchestrator zu melden, das über das hinausgeht, was T-082 selbst
  schon als offenen Punkt („Nachwelle für `routes/addin/**`") benannt hatte, und das war zum
  Messzeitpunkt bereits erledigt.
- **`pnpm --filter @takt/domain test` (und die beiden Geschwister) täuschen einen grünen Lauf vor,
  ohne zu laufen.** Das ist kein Befund zu meiner Aufgabe, aber ein stumpfes Werkzeug: Wer diesen
  Befehl künftig in einem Skript oder einer CI-Stufe benutzt, bekommt Exitcode 0 ganz gleich, ob
  auch nur ein Test gelaufen ist. Ich melde es hier, statt es in `package.json` zu beheben — das ist
  eine Datei in gemeinsamer Hoheit des Orchestrators.
- **Die drei bestehenden Board-/Pool-Testdateien sind nach den 33 Ergänzungen sichtbar
  ausführlicher**, ohne dass sich an ihrer Aussage etwas geändert hätte. Das ist der Preis eines
  neuen Pflichtfelds an einer viel benutzten Schnittstelle und keine Abweichung, die ich getroffen
  hätte — die Alternative (ein Freiwilligkeits-Kompromiss) hätte E-057 genau an der Stelle
  aufgeweicht, die T-082 als Wache verankert hat.

Offene Fragen: keine.

Nächster Schritt: Aus meiner Sicht ist T-088 abgeschlossen und bereit für Review (Code-Reviewer,
Spezifikations-/UX-Reviewer, Security-Checker gemäß Qualitätstor in `CLAUDE.md`). Sinnvoll wäre,
`pnpm --filter <paket> test` entweder mit `--if-present`-Absicherung im Skriptaufruf oder mit einem
echten `"test": "vitest run --root ../.. <pfad>"`-Durchreicher in den drei Paket-`package.json`
auszustatten, damit der in dieser und vermutlich auch in T-082 benutzte Befehl nicht länger lautlos
nichts tut — das ist eine Änderung an `package.json`-Dateien der Pakete und liegt außerhalb meiner
Hoheit.
