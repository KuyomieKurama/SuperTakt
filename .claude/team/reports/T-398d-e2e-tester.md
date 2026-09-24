Aufgabe: T-398d — Nachträge aus T-398c (Welle 18)
Status: fertig
Artefakte: tests/e2e/outlook-addin-build.spec.ts
Zusammenfassung: Die fünf in T-398c Offene Frage 2 genannten Namen sind in `tests/e2e/outlook-addin-build.spec.ts` nachgezogen (Zeilen 187/189, 198, 206, 209, 226). E-087-Suche vorher: kein weiteres Vorkommen im Testbestand. Punkte 2 (unit-tester) und 3 (frontend-dev/verify-sidecar) sind nur geprüft und gemeldet, nicht angefasst.

Einzelpunkte:
1. Ersetzt: `/Zur Aufgabe ergänzen/` → `/Zum Todo ergänzen:/` (radio-Locator, zwei Stellen); `'E-Mail an Aufgabe anhängen'` → `'E-Mail an Todo anhängen'`; `'Stattdessen neue Aufgabe erstellen'` → `'Stattdessen neues Todo anlegen'`; `'Fälligkeitsuhrzeit (optional)'` → `'Uhrzeit der Frist (optional)'`; `'Neue Aufgabe anlegen'` → `'Neues Todo anlegen'`. Alle fünf Werte gegen den aktuellen Quelltext geprüft (`apps/outlook-addin/src/ui/texts.ts`: `deadlineTimeLabel`, `createButton`, `appendButton`, `offerOptionPrefix`, `offerCreateInstead`) — zeichengleich übernommen, inklusive des Doppelpunkts in `offerOptionPrefix`.
2. E-087-Suche vor der Änderung: `git grep -F` über `tests/**` und `apps/*/test/**` sowie ein roher Lauf über `apps/*/src`, `packages/*/src`, `tests/` und zusätzlich `apps/*/test` — für alle fünf alten Sätze traf ausschließlich die fünf Stellen in `outlook-addin-build.spec.ts`, sonst nichts. Ein Nebenbefund, kein Streichkandidat: `apps/desktop/src-tauri/taskpane/assets/index-CP1rD1A9.js` (Bauergebnis, per `.gitignore` ausgenommen) enthält alle fünf alten Sätze noch — erwartungsgemäß, weil das ein veraltetes gebautes Bündel von vor T-398c ist. Kein Handlungsbedarf, da kein Quelltext und nicht Teil meiner Hoheit; wird beim nächsten Bau ersetzt.
3. Beim Lesen der Datei fiel auf, dass sie bereits vor meiner Änderung unversionierte, e2e-tester-eigene Änderungen aus einer früheren Welle trug (Entfernen von `poolMovement` aus der `/todo-matches`-Attrappe mit Kommentar zu E-125/T-398, und `mode: 'new'` statt der alten `action === 'no_match' ? 'auto' : 'new'`-Unterscheidung an Zeile 228). Das war schon vor meinem ersten Edit im Arbeitsbaum (`git status` zeigte die Datei bereits als `M`) und ist nicht Teil dieses Auftrags — nicht angetastet, nur zur Kenntnis genommen, damit die Diff-Größe nicht überrascht.

Prüfung:
- `tsc -p tests/e2e/tsconfig.json --noEmit`: **fehlerfrei**, Exit-Code 0.
- `pnpm test:e2e` nicht ausgeführt: bräuchte den gebauten Sidecar/Aufgabenbereich (`playwright.outlook-build.config.ts` baut `apps/outlook-addin` global) — außerhalb dieses engen Auftrags, der laut Vorgabe nur `tsc` verlangt. Damit ausdrücklich nicht geprüft, ob der Test mit den neuen Namen tatsächlich grün gegen den echten Bau läuft; die Übernahme stützt sich auf den zeichengleichen Abgleich mit `texts.ts`.

Annahmen:
- `Uhrzeit der Frist (optional)` als Label-Text (nicht als Platzhalter oder ARIA-Beschreibung) — bestätigt durch `deadlineTimeLabel` in `texts.ts`, exakt derselbe Wortlaut wie am Eingabefeld erwartet.
- Der Doppelpunkt in `'Zum Todo ergänzen:'` gehört zum Radiofeld-Namen (Teil von `offerOptionPrefix`, gefolgt vom Todo-Titel) und wurde in den Regex übernommen, weil Playwrights `RegExp`-Namensabgleich Teilstrings matcht — die Auftragsvorgabe schrieb den Doppelpunkt explizit vor.

Risiken: keine neuen. Die zwei gemeldeten offenen Punkte unten bleiben bestehen, bis unit-tester bzw. frontend-dev sie bearbeiten.

Offene Fragen an den Orchestrator (Meldung, keine eigene Änderung):
1. **unit-tester:** `apps/outlook-addin/test/office/quick-command.test.ts` existiert weiterhin und importiert das laut T-398c gelöschte `apps/outlook-addin/src/quick-command.ts` (`import { quickAddToInbox } from '../../src/quick-command.ts';`). `vitest run apps/outlook-addin` bleibt deshalb rot, bis die Datei gelöscht wird (E-134 Punkt 2). Ich habe sie nicht angefasst — nicht meine Hoheit (`apps/*/test/**`).
2. **frontend-dev (T-400) oder Orchestrator:** `apps/desktop/scripts/verify-sidecar.mjs:441-447` prüft weiterhin `GET /commands.html` und erwartet ein `<script src="…commands…js">` im ausgelieferten Bündel. Da `commands.html` mit T-398c aus `rollupOptions` und dem Manifest entfernt wurde, wird diese Prüfung fehlschlagen, sobald sie gegen einen aktuellen Bau läuft. Bestätige den Vorschlag aus T-398c: Prüfung umkehren auf „kein `commands.html` im Bündel“ (`index.status` z. B. 404 statt 200 erwarten). Nicht angefasst — `apps/desktop/scripts/**` ist frontend-dev-Hoheit.

Nächster Schritt: Orchestrator legt die Löschung von `quick-command.test.ts` (unit-tester) und die Umkehrung der `verify-sidecar.mjs`-Prüfung (frontend-dev) in die nächste Welle. Danach kann `vitest run apps/outlook-addin` und `verify:bundle`/`verify-sidecar` für die Add-in-Hälfte von PR #19 grün laufen.
