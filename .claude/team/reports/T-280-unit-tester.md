Aufgabe: T-280 — Der neue Speicher und der Streuwert sind ungemessen, und der Lauf ist trotzdem grün

Status: fertig

Artefakte:

- `packages/storage/test/repo-version-check.test.ts` (**neu**, 20 Prüffälle) — `lastCheckAt()`/`recordCheck()`
  gegen einen echten migrierten Bestand, `NULL` bei frischem Bestand, `updated_at` bleibt unangetastet,
  eine Zukunft wird angenommen, die fehlende Einstellungszeile wirft nicht, und der GLOB-CHECK aus
  Migration 0022 wird sowohl mit gültigen als auch mit acht ungültigen Formen geprüft.
- `packages/domain/test/version.test.ts` (geändert, +20 Prüffälle) — `versionCheckDelayWithJitter`:
  alle genannten Ränder (0, 1, negativ, > 1, `NaN`, `±Infinity`, negativer/nicht endlicher Grundwert,
  negativer/nicht endlicher/nullwertiger Boden), eine Zählung über 1 000 000 echte Ziehungen ohne
  eine einzige Verletzung in beide Richtungen, und eine permanente Gegenprobe: eine lokal
  nachgebaute, absichtlich nach unten streuende Fassung fällt bei derselben Zählmethode zuverlässig
  durch.
- `apps/local-api/test/version/checker.test.ts` (geändert, +7 Prüffälle) — zwei `createVersionChecker`-
  Instanzen auf **demselben** echten `VersionCheckStatePort`-Adapter (wörtlich dieselbe Verdrahtung wie
  `composition.ts`) simulieren einen Neustart: der zweite Prüfer fragt nicht; die Gegenprobe **ohne**
  Speicher zeigt, daß derselbe „neue" Prüfer dort sehr wohl fragt; der Bestand trägt den Zeitpunkt
  bereits **während** der laufenden Anfrage; ein lesend bzw. schreibend werfender Speicher ergibt
  genau eine Protokollzeile und beendet die Prüfung nicht; `random: () => 0` gegen `random: () => 1`
  wird an der echten Uhr gemessen, dazu eine werfende Zufallsquelle.
- `apps/local-api/test/usecases/data-transfer.test.ts` (geändert, +3 Prüffälle) — der Round-Trip von
  `last_version_check_at` über Export/Bestandsänderung/Import, ein Archiv der Fassung 5 **ohne** das
  Feld (Ergebnis `NULL`), ein Archiv **mit** `null` (bleibt `null`, nicht überschrieben mit einem
  bestehenden Bestandswert).
- `.claude/team/reports/T-280-unit-tester.md` (dieser Bericht)

Zusammenfassung: Die vier Vorschläge aus dem T-279-Bericht des domain-dev geprüft und alle vier
übernommen, jeweils mit eigener roter Gegenprobe vor der Übernahme gefahren — nicht nur gelesen.
`repo-version-check.ts` stand bei 0 % und steht jetzt bei 100 % (Statements/Branches/Functions/Lines).
Für den Streuwert ist die Auflage „verlängert nur, verkürzt nie" nicht nur an der echten Funktion
gemessen (1 000 000 Ziehungen, null Verletzungen), sondern als permanenter Prüffall auch daran, daß
eine bewußt kaputte, nach unten streuende Variante bei derselben Zählmethode durchfällt. Für „ein
Neustart fragt nicht erneut" liegt jetzt sowohl der Beleg (zwei Prüfer auf einem Speicher: 0 statt 1
Anfrage) als auch die geforderte Gegenprobe ohne Speicher (1 Anfrage) im selben Prüflauf, gegen den
echten Storage-Adapter und nicht gegen eine Nachbildung. `pnpm test:coverage`: 88 → **89 Dateien**,
1582 → **1632 grün** (+50), 3 übersprungen unverändert, 0 rot. `pnpm typecheck` vollständig grün.

Der rote Test vor dem grünen, gemessen und nicht behauptet — vier Durchgänge, jeweils Produktivcode
**temporär** verändert, Prüfsumme vor und nach der Rückstellung verglichen (identisch in allen vier
Fällen):

| Datei | Mutation | Ergebnis rot | Prüfsumme vor = nach |
|---|---|---|---|
| `packages/domain/src/version.ts` | `return base + span * unit;` → `return base + span * (unit * 2 - 1);` (streut nach unten) | 10 von 20 neuen Fällen rot, darunter die 1 000 000-Ziehungen-Zählung selbst | `755e271d…c583ccd63` |
| `packages/storage/src/sqlite/repo-version-check.ts` | `recordCheck` schreibt nicht mehr (`void at;` statt `UPDATE …`) | 3 von 20 Fällen rot (alle `recordCheck`/`lastCheckAt`-Paarungen) | `0bf0ecac…d920491962` |
| `apps/local-api/src/features/version/version.ts` | `await restore();` entfernt (Stand vor T-279) | genau die 2 auf `restore()` angewiesenen neuen Fälle rot („zwei Prüfer" und „ohne Speicher"-Gegenprobe blieb korrekt grün — sie prüft ja gerade das Fehlen) | `110a2e84…f873194f` |
| `packages/storage/src/sqlite/repo-data-archive.ts` | `last_version_check_at` aus der `columns`-Liste von `app_setting` entfernt | 8 Fälle rot: alle 3 neuen Round-Trip-Fälle plus 5 bestehende Fassungs-Fälle (Kollateralschaden durch dieselbe Zeile — bestätigt, daß die Spalte tatsächlich an dieser einen Stelle hängt) | `abd208bb…0d627a34b5` |

Nach jeder Rückstellung erneut grün gemessen (die jeweils betroffene Testdatei einzeln gefahren).
`pnpm test:coverage` am Ende des gesamten Durchgangs ein letztes Mal vollständig gefahren: 89/1632/3/0.

Coverage vorher/nachher (die eine Datei, um die es ging, plus die Gesamtzahl aus dem T-279-Bericht als
Vergleichsbasis):

| | vorher (T-279-Bericht) | nachher (dieser Bericht) |
|---|---|---|
| `repo-version-check.ts` | **0 %** (Statements/Branches/Functions/Lines) | **100 %** (Statements/Branches/Functions/Lines) |
| Statements gesamt | 91,12 % | **91,31 %** |
| Branches gesamt | 85,33 % | **85,64 %** |
| Functions gesamt | 94,28 % | **94,87 %** |
| Lines gesamt | 93,25 % | **93,48 %** |

Die Gesamtzahl liegt jetzt sogar leicht **über** dem Stand vor T-279 (91,28/85,53/94,83/93,45 laut
T-276) — die neuen Prüffälle decken nicht nur die neue Datei ab, sondern auch vorher ungemessene
Zweige in `apps/local-api/src/features/version/version.ts` (Speicherfehler, Streuwert), die außerhalb
der Coverage-Schwelle liegen (`apps/local-api/src/**` ist nicht Teil der 80-%-Gruppen), aber jetzt
trotzdem am laufenden Prüfer gemessen sind.

Annahmen:

1. Für den „Neustart"-Prüffall habe ich **denselben Adapter-Code** gebaut, den `composition.ts`
   zwischen `VersionCheckStatePort` (Zeitstempel) und `VersionCheckStorePort` (`Date`) verdrahtet
   (`packages/storage`s `createVersionCheckStatePort` plus `toTimestamp`), statt eine eigene
   Nachbildung des Speichers zu schreiben. Der Prüffall mißt damit die Naht, durch die T-279
   tatsächlich läuft, nicht eine Behauptung darüber.
2. „Neustart" ist im Prüffall zwei unabhängige `VersionChecker`-Instanzen auf demselben `store` (und
   bei der Storage-Round-Trip-Prüfung: derselben `SqlConnection`), nicht ein echter Prozeßneustart.
   Das ist dieselbe Abstraktion, die domain-dev im T-279-Bericht selbst verwendet hat („zwei Prüfer
   auf demselben Bestand"), und der einzige praktikable Weg, das ohne Sidecar-Start in einem
   Einheitentest zu messen.
3. Die Gegenprobe zum Streuwert (Punkt 2 des Auftrags) liegt **permanent** im Prüffall (eine lokal
   nachgebaute, nach unten streuende Fassung, die an derselben Zählmethode scheitert) — zusätzlich
   zur temporären Produktivcode-Mutation, die nur im Bericht dokumentiert ist und nicht im Bestand
   verbleibt. Beides war nötig: Der Auftrag verlangt „muß rot werden können, gemessen und nicht
   zugesichert" für die Prüffälle selbst (dafür die permanente Gegenprobe) UND „roter Test vor
   grünem nachgewiesen" für den Übernahmeprozeß (dafür die temporäre Mutation mit Prüfsummenvergleich,
   wie in T-274 vorgemacht).
4. Bei der Mutation von `repo-data-archive.ts` sind zusätzlich zu den drei neuen Fällen fünf
   **bestehende** Fassungs-Prüffälle rot geworden (Fassung 1 bis 4), weil `parseArchive`s
   `hasOwn`-Zweig das Feld unbedingt (für **jede** Fassung) ergänzt und die fehlende Spalte in der
   `columns`-Liste dann bei jeder Zeile als „ungültige Zeile" auffällt. Das ist kein Fehler meiner
   Prüffälle, sondern die Bestätigung, daß beide Stellen (`parseArchive`s `hasOwn`-Zweig und
   `repo-data-archive.ts`s `columns`-Liste) zusammengehören — im Bericht stehengelassen, weil er
   genau das zeigt, was domain-dev als „Fund aus T-276" beschrieben hat.
5. Testdaten sind durchgehend erfunden (`2026-09-11T09:12:34Z`, `2999-01-01T00:00:00Z` als
   Zukunftsfall); keine echten Call-Nummern, Kundennamen oder Zugangsdaten.

Risiken: keine neuen. An Produktivcode wurde nichts dauerhaft geändert — vier Mutationen, vier
Rückstellungen, vier Prüfsummenvergleiche, alle identisch. Die im T-279-Bericht offen benannten
Punkte (VG-3 wird durch den Bestandswert nicht abgewehrt; `DATA_ARCHIVE_VERSION` bleibt bei 5;
Bedrohungsmodell-Nachtrag) sind nicht meine Hoheit und bleiben offen, wie dort beschrieben.

Offene Fragen: keine.

Nächster Schritt: security-checker für die im T-279-Bericht offene Frage 2 (Bedrohungsmodell,
T-275-7/T-275-8 zur Hälfte beantwortet). Danach `pnpm check` in einem Zug — `typecheck` und
`test:coverage` sind hier bereits einzeln grün gemessen; `proof:all`/`proof:access`/`test:e2e`
teilen sich Port 17843 und wurden in dieser Aufgabe bewußt nicht gefahren (kein anderer Agent lief
parallel, aber diese Läufe gehören laut Auftrag zusammenhängend in einem Zug, nicht hier einzeln
vorgezogen).
