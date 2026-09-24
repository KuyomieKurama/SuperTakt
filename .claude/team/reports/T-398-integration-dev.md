Aufgabe: T-398 — Add-in in Welle 18b: E-125 Punkt 1 (`poolMovement`), A-28.9, O-GF, O-LE
Status: braucht Review
Artefakte:
- apps/local-api/src/routes/addin/service.ts — `AddinTodoMatch.poolMovement`, `bookingMovement` und der Import aus `pool-movement.ts` entfernt; `findMatches` rechnet keine Bewegung mehr
- apps/local-api/src/routes/addin/ports.ts — `AddinUnit.pools` enger: nur noch `list` (ohne `resolveAxes`)
- apps/outlook-addin/src/api/types.ts — `TodoMatchDto.poolMovement` und der `PoolMovement`-Import entfernt; Kopfkommentar zur Typ-Ausnahme berichtigt
- apps/outlook-addin/src/ui/texts.ts — neu: Textbündel des Aufgabenbereichs mit `deadlineHintAddinPrefix` und `deadlineHintCore` (E-118)
- apps/outlook-addin/src/ui/TaskPane.tsx — Fristhinweis aus dem Bündel (Add-in-Satz + Leerzeichen + Kern)
- apps/outlook-addin/src/ui/create-gate.ts — zitierter Wortlaut im Kommentar nachgezogen („Leer lassen")
- apps/outlook-addin/scripts/proof-addin.mjs — Abschnitte 12–14 (maßen `poolMovement` am Treffer) gestrichen, T-090-Wache bleibt als Abschnitt 12; Schlüsselvergleich des Treffers ohne `poolMovement`; E-058-Wache verbietet jetzt `poolMovementNamer(`/`bookingMovementStates(` im Add-in-Dienst; neue A-28.9-Prüfung in 18b; Abschnitt 19d neu (O-GF, GF-01, GF-03 samt Gegenprobe); `paneQuelle` nach oben gezogen; eine rohe `4000` im Kommentar durch den Namen ersetzt
- apps/outlook-addin/scripts/fixtures.mjs — Achsen-, E-057- und Platzierungsbestände, `buildAxisTodos`, `resolveAxis`/`resolveTerms`/`tagsInFolder`, Option `pools` und `resolveRule`/`resolveExcluded`/`resolveAxes` entfernt (ohne Leser)
- .claude/team/reports/T-398-integration-dev.md — dieser Bericht

Zusammenfassung: Der Treffer von `GET /addin/todo-matches` trägt kein `poolMovement` mehr (Dienst, Port, DTO, Attrappe, Nachweis). Der Fristhinweis im Aufgabenbereich ist der in T-393 freigegebene Wortlaut, gebündelt in `src/ui/texts.ts`; `proof:addin` 19d vergleicht den Kern zeichengleich mit dem Bündel der Hauptanwendung. A-28.9 war bereits erfüllt und ist jetzt gemessen; O-LE ist gemessen, ohne Bedarf für einen neuen Zahlwächter.

Einzelheiten:

1. E-125 Punkt 1. `routes/addin/schema.ts` führt kein Antwortschema für die Treffer — die Route reicht `result.matches` aus `findMatches` durch. Die Änderung sitzt deshalb im Dienst (`AddinTodoMatch`) und nicht im Schema. `AddinUnit.pools` braucht danach nur noch `list` für den Kontext; `resolveAxes` hatte außer dem Namensgeber keinen Leser.

2. A-28.9 / E-122 Punkt 3. Weder `dueDateSchema` (nur `isCalendarDay`, Jahre 1970–2999) noch `readDueDate` noch das Datumsfeld (kein `min`) wiesen eine vergangene Frist ab; `dueTime` ist ohne Eingabe `null` (`TaskPane.tsx:385`, Schema `.default(null)`). Kein Codeumbau nötig. Neu in `proof:addin` 18b: vergangene Tage (heute − 30 Tage und 2020-01-15) werden von Feld und Tür angenommen, die Tür setzt `dueTime: null`, das Datumsfeld hat kein `min`.

3. O-GF. Bündelschlüssel wie von T-393 vorgeschlagen: `deadlineHintCore` (Kern) und `deadlineHintAddinPrefix` (Add-in-Satz). Angezeigt wird „SuperTakt liest die Frist nicht aus der E-Mail — Sie tragen sie selbst ein. Ein Kalendertag, die Uhrzeit ist optional. Überfällig ist die Frist erst ab dem Folgetag. Leer lassen heißt: keine Frist. Sie ändert nichts an Pools, Spalten, Buchungen oder Export." — zeichengleich mit der Gesamtfassung Add-in aus T-393. Abschnitt 19d mißt:
   - V-04 (Stellung): die Aussage über die E-Mail steht vor „Kalendertag".
   - GF-01: Add-in-Satz und Kern sind der freigegebene Wortlaut, als Anforderung ausgeschrieben und nicht aus dem Bündel abgeleitet.
   - E-122 Punkt 3: kein „00:00" im Hinweis; `dueTime: dueDate ? dueTime || null : null` im Aufgabenbereich.
   - Bündel statt JSX: Das Fristfeld liest beide Schlüssel, und keine `.tsx` trägt den Kern wörtlich.
   - A-19.1: „Leer lassen" bleibt gesagt.
   - GF-03: Das Bündel der Hauptanwendung wird über `locateSingleSource` unter `apps/web/src` am Schlüssel `deadlineHintCore:` gefunden, nicht über einen Pfad. Ohne Fundstelle, bei zwei Dateien mit dem Schlüssel oder ohne lesbare Zeichenkette ist die Zeile rot mit Grund (E-121 Punkt 10). Grün ist sie nur, wenn einer der Werte genau der Kern des Add-ins ist; dadurch stört ein englischer Wert in derselben Datei nicht. Die Gegenprobe prüft den Leser selbst: Verkettung mit `+`, Maskierung, Abweichung und Vorlagenliteral mit `${`.
   - Gestrichen wurde die Wache „V-04: der Fülltext der Hauptanwendung steht nicht mehr im Aufgabenbereich", die „Pools/Spalten/Export" im Add-in-Hinweis verbot. Der freigegebene Wortlaut nimmt A-19.7 ausdrücklich auf (GF-01 nennt das Fehlen als Befund). Beides zugleich ließ sich nicht halten. Die Freigabe steht in T-393; nach E-078 Punkt 3 bitte ich den spec-ux-reviewer, das zu bestätigen.

4. O-LE, gemessen:
   - Die Stelle aus T-239 („um Zeile 4599, `const traeger = files`") ist heute die Wache „der Aufgabenbereich führt keine eigene Form der Frist". Sie sucht keine Zahl, sondern `DUE_DATE_SHAPE.source` (`^\d{4}-\d{2}-\d{2}$`) als Teilzeichenkette. Treffer im Add-in-Quellbaum ohne Kommentare: **0**. Einen Fehlalarm wie bei O-AY (dieselbe Ziffer mit fremder Bedeutung) kann es dort nicht geben, denn nur eine wörtliche Kopie der Form trifft. **Nicht geschärft.**
   - Freistehende `4000` heute: Add-in-Quellbaum 2 (`office/mail.ts:33` Definition `MAX_TAKEOVER_CHARACTERS`, `:202` Kommentar); `routes/addin/schema.ts` 2 (`:83` `ADDIN_NOTE_MAX_LENGTH`, `:272` `excerpt: z.string().max(4000)` roh); `proof-addin.mjs` 1 (Kommentar, jetzt durch den Namen ersetzt). Alle meinen dieselbe Grenze für übernommenen Mailtext; keine meint etwas anderes, etwa einen Status.
   - Kein Wächter mißt noch die gestrichene Fläche. Die „Leistung"-Prüfung (O-AR, `ADDIN_BOOKING_NOTE_MAX_LENGTH`) ist mit T-389 gefallen; `addinBookSchema`, `MAIN_TIME_SCHEMAS` und `ADDIN_BOOKING_NOTE` kommen nicht mehr vor.
   - Entscheidung: kein neuer Zahlwächter jetzt. Die drei 4000er werden in 18c auf die Domänenkonstante aus T-397 umgestellt (Auftrag Punkt 5). Danach ist eine Herkunftsprüfung nach O-AY-Bauart für die Auszugsgrenze sinnvoll, und zwar aus einem gemessenen Grund: `excerpt` steht dann nicht mehr roh da. Die Bauart der O-AY-Prüfung übernehme ich dafür nicht einfach.

Prüfung:
- `pnpm --filter @takt/outlook-addin typecheck`: grün.
- `pnpm --filter @takt/local-api typecheck`: grün (mit dem Zwischenstand von T-397 zum Zeitpunkt des Laufs).
- `tsc -p apps/outlook-addin/tsconfig.test.json`: grün.
- `vitest run apps/outlook-addin`: 6 Dateien, 49 Tests grün.
- `pnpm --filter @takt/outlook-addin build`: grün.
- `node --check` für `proof-addin.mjs` und `fixtures.mjs`: grün. Die neuen Helfer aus 19d (`textWerte`, Wortlautkonstanten, Feldausschnitt, `dueTime`-Muster) habe ich einzeln gegen `texts.ts` und `TaskPane.tsx` gefahren: alle wie erwartet.
- **Nicht gefahren:** `proof:addin` (laut Auftrag erst in 18d). Erwartet rot bis T-400a steht: die GF-03-Zeile, weil das Bündel der Hauptanwendung `deadlineHintCore` noch nicht führt. Das ist die Weigerung, keine Panne.
- `tsc -p apps/local-api/tsconfig.test.json`: rot, nur in `apps/local-api/test/routes/addin/service.test.ts` (Hoheit unit-tester). Vorbestehend aus T-389: Zeilen 54, 143, 181. Neu durch T-398: Zeile 109 (`resolveAxes` nicht mehr in `AddinUnit.pools`) sowie 217, 250, 251, 294, 295 (`poolMovement` am Treffer).
- `pnpm typecheck` gesamt, `pnpm check` und e2e nicht gefahren (Portsperre, parallele Wellen).

E-087 — heutiger Wortlaut gesucht mit `git grep` (ohne `docs/design`, `.claude`) und über `apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test`, `packages/*/test`, `apps/*/scripts`, ohne `dist`, `taskpane`, `node_modules`:
- „SuperTakt sucht in der E-Mail nicht nach einer Frist — Sie tragen sie selbst ein. Uhrzeit optional; leer lassen heißt: keine Frist.": nur `TaskPane.tsx:507` (ersetzt) und die Teilstrings in `proof-addin.mjs` (`'Uhrzeit optional'` in 19d, ersetzt; `:7119` ein erfundener Hinweis in 19a, bleibt). Kein Treffer in `tests/**`, `apps/*/test/**` oder `packages/*/test/**`.
- „leer lassen heißt: keine Frist" zusätzlich: `create-gate.ts:16` (Kommentar, nachgezogen) und `apps/web/.../TodoFormDialog.tsx:254` (Hoheit frontend-dev, T-400a).
- `docs/design/textbestand.md` (SP-04, SP-A-02) pflegt der ux-designer.

Annahmen:
- Das Textbündel liegt als `apps/outlook-addin/src/ui/texts.ts` mit einem eingefrorenen `TEXTS`-Objekt. Es gibt noch keine Sprachauswahl im Add-in (E-120: folgt später), und alte Sätze ziehe ich nicht aus Symmetrie um. Nur die beiden O-GF-Schlüssel stehen darin.
- Der Schlüsselname im Bündel der Hauptanwendung ist `deadlineHintCore`, wie von T-393 vorgeschlagen und in `docs/design/textbestand.md` SP-04 genannt. Wählt T-400a einen anderen Namen oder eine verschachtelte Form ohne `deadlineHintCore:`, bleibt GF-03 rot und nennt den Grund.
- Die Abschnitte 12–14 fallen, weil sie die Bewegung am Treffer maßen, die es nicht mehr gibt. Die Regelauswertung wird dort geprüft, wo sie läuft: `apps/local-api/test/usecases/pool-movement.test.ts` (Board-Spalten `'all'`, leerer Ordner E-057, Aufteilung appears/enters/leaves) und `packages/domain/test/matches-pool-guard.test.ts` (T-082). Behalten habe ich die reine Domänenwache T-090 (jede Achse hat ein Feld), weil ich sie sonst nirgends gefunden habe.
- `schema.ts` blieb unverändert. Weder Trefferantwort noch Fristregel stehen dort.

Risiken:
- Abdeckung: Mit den Abschnitten 12–14 fallen Zusicherungen über die Achsen Status, Exportstatus und Erledigt sowie die Reihenfolge der Pools am **zusammengesetzten** Namensgeber. Ob `pool-movement.test.ts` jede davon einzeln trägt, habe ich nur an den Überschriften gelesen, nicht Fall für Fall abgeglichen.
- Sicherheit: Die Trefferantwort sagt weniger über die Poolstruktur (Poolnamen) an einen Inhaber des Add-in-Tokens. Die Portfläche des Add-ins ist um `pools.resolveAxes` kleiner geworden.
- `proof:addin` bleibt bis T-400a an GF-03 rot. Wird 18d vor T-400a gefahren, ist das der erwartete Grund.

Offene Fragen:
1. An unit-tester: `apps/local-api/test/routes/addin/service.test.ts`. Neben den T-389-Stellen: Die Attrappe in Zeile 109 führt `resolveAxes`, und der Block `findMatches — poolMovement …` (ab Zeile 192) mißt ein gestrichenes Feld. Er sollte statt dessen die Abwesenheit des Schlüssels prüfen. Außerdem gehört die T-090-Wache (`POOL_RULE_AXIS_IDS` ↔ `POOL_RULE_AXIS_OF_FIELD`) nach `packages/domain/test`; danach kann Abschnitt 12 in `proof:addin` fallen.
2. An frontend-dev (T-400a): Der Kern muß im Bündel der Hauptanwendung als `deadlineHintCore: '<Kern>'` stehen (eine Zeichenkette oder mit `+` verkettete Literale, kein Vorlagenliteral mit `${`), genau in einer Datei unter `apps/web/src`, damit GF-03 messen kann.
3. An e2e-tester (T-399): `tests/e2e/outlook-addin-build.spec.ts:173` schickt in der Attrappe noch `poolMovement: null` im Treffer mit. Das ist unschädlich, aber es beschreibt einen Vertrag, den es nicht mehr gibt.
4. An spec-ux-reviewer (E-078 Punkt 3): Die 19d-Wache „kein Pools/Spalten/Export im Add-in-Hinweis" (V-04, T-165) ist durch den freigegebenen O-GF-Wortlaut ersetzt. Bitte die Streichung dieser Wache bestätigen.
5. An domain-dev (T-397), zur Kenntnis: `bookingMovementStates` und `poolMovementNamer` haben unter `routes/addin` keinen Leser mehr, werden aber weiter in `features/timer/movement.ts` gebraucht. Die Tabelle in `pool-movement.ts:50` nennt noch „Buchung aus dem Add-in (Ankündigung und Bestätigung)" als Aufrufer.

Nächster Schritt: T-400a legt `deadlineHintCore` im Bündel der Hauptanwendung an. In 18c stellt integration-dev `MAX_TAKEOVER_CHARACTERS` (`office/mail.ts`) sowie `ADDIN_NOTE_MAX_LENGTH` und `excerpt` (`routes/addin/schema.ts`) auf die Domänenkonstante aus T-397 um und ergänzt die Herkunftsprüfung für diese Grenze. In 18d läuft `proof:addin`; erwartet grün, einschließlich GF-03.
