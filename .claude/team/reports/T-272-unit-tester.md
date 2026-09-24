Aufgabe: T-272 — Der ungeprüfte dritte Übergang des Exportstatus
Status: fertig

Artefakte:
- `packages/domain/test/export-status.test.ts` (einzige geänderte Datei)

Zusammenfassung:
Ergänzt in `packages/domain/test/export-status.test.ts`:

1. Der fehlende dritte Übergang `checkExportStatusTransition('open', 'exported', 'not_billed')` als eigener Prüffall (bislang war `not_billed` in der Domänenregel nur über SQL/Protokoll erreicht, nie direkt am Wächter).
2. Der spiegelbildlich falsche Auslöser `checkExportStatusTransition('exported', 'open', 'not_billed')` (NICHT erlaubt) sowie die bisher fehlenden Selbstübergänge `open->open` und `exported->exported` mit Auslöser `not_billed` — damit ist die Matrix jetzt wirklich vollständig (3 erlaubt + 9 abgelehnt = 12 = 2×2×3), nicht nur die alte 2×2×2-Matrix aus der Zeit vor E-047.
3. Ein Mengenprüffall auf `allowedExportStatusTransitions()`: ein `toHaveLength(3)` plus drei einzelne `toContainEqual`-Aufrufe (je Übergang einer), ausdrücklich ohne eine zweite, von Hand geschriebene Liste als Erwartungswert — genau die Auflage aus dem Auftrag.
4. Den im Auftrag benannten Irrtum im Kopfkommentar berichtigt: „die zwei erlaubten Übergänge … x {export_run, reset}" → „die drei erlaubten Übergänge … x {export_run, not_billed, reset}", „sechs verbleibende Kombinationen" → „neun verbleibende Kombinationen", und den veralteten Dateiverweis „`ExportStatusTransition` (time-entry.ts)" → „(export-status.ts)" (der Typ steht seit T-261 dort). Ein NACHTRAG-Absatz dokumentiert die Korrektur, wie es die vorherigen Nachträge in derselben Datei bereits vormachen.
5. Den Import auf `../src/export-status.js` korrigiert (dort liegen `checkExportStatusTransition`, `isLocked`, `allowedExportStatusTransitions` seit T-261/T-270 tatsächlich) statt `../src/time-entry.js`.

Rot-vor-Grün-Nachweis: Zunächst mit absichtlich falschen Erwartungswerten geprüft — `expect(result.ok).toBe(false)` für den `not_billed`-Übergang und `toHaveLength(2)` für die Menge — beide Fälle liefen rot:

```
FAIL … open -> exported via "not_billed" ist erlaubt … AssertionError: expected true to be false
FAIL … allowedExportStatusTransitions … liefert genau drei Übergänge
  AssertionError: expected […] to have a length of 2 but got 3
```

Danach auf die korrekten Erwartungswerte zurückgesetzt: 24/24 grün (`npx vitest run packages/domain/test/export-status.test.ts`, vorher 16/24 — 8 neue Fälle).

Coverage: `pnpm test:coverage` — 88 Dateien / **1578** bestanden (vorher 1570, +8, deckt sich mit den 8 neuen Fällen) / 3 übersprungen, alles grün. `export-status.ts` steht jetzt bei **100 % Anweisungen / 100 % Zweige / 100 % Funktionen / 100 % Zeilen** (vorher laut Auftrag ca. 70 % Zweige wegen des ungeprüften `not_billed`-Zweigs bei Zeile 257). `packages/domain/src` gesamt: 94,74 % Anweisungen / 93,22 % Zweige — über der 80-%-Schwelle. `packages/export/src`: 97,95 % Anweisungen / 92,85 % Zweige — ebenfalls klar über 80 %. `pnpm typecheck` (per `tsc -p packages/domain/tsconfig.json --noEmit`) läuft sauber durch.

Annahmen:
- Die im Auftrag verlangten drei zusätzlichen Kombinationen mit `not_billed` (open-open, exported-exported als Selbstübergang, exported-open als falscher Auslöser) habe ich über den explizit genannten Fall hinaus ergänzt, um die Matrix — dem eigenen Anspruch der Datei folgend („vollständige Übergangsmatrix") — tatsächlich vollständig zu machen. Das ist eine Erweiterung, keine Abschwächung.
- Den Import-Pfad (`time-entry.js` → `export-status.js`) habe ich mitkorrigiert, weil er im aktuellen Arbeitsbaum (nach dem noch unversionierten T-261/T-270-Schnitt) sonst auf die falsche Quelle gezeigt hätte; das ist dieselbe „veraltete Angabe im Präsens", die der Auftrag für den Kommentartext ausdrücklich benennt.

Risiken:
- Keine sicherheitsrelevanten Funde in dieser Datei. Keine Zugangsdaten, Kundennamen oder echten Call-Nummern verwendet (die Datei arbeitet ausschließlich mit den literalen Statuswerten `open`/`exported`).
- Der Git-`HEAD` dieses Arbeitsbaums ist massiv hinter dem tatsächlichen Stand (Hunderte unversionierte Änderungen, u. a. `packages/domain/src/export-status.ts` selbst ist noch nicht committet). Ein `git diff`/`git show HEAD` auf diese Datei ist daher irreführend, wenn man ihn als Stand der Wahrheit nimmt — das ist keine Auswirkung meiner Arbeit, sondern der bereits in `CLAUDE.md` beschriebene Rückstand des Boards gegenüber dem Bestand. Für den Rot-Nachweis habe ich deshalb keine Git-Operationen verwendet, sondern die Erwartungswerte im laufenden Testfall selbst vorübergehend verfälscht und wieder korrigiert.

Weitere Funde zur „Regel als abgeschriebene Zahl" (Suchauftrag, nicht behoben):
Gefunden wurden zwei strukturell verwandte, aber nicht identische Fälle in meiner Hoheit:
- `packages/domain/test/due-date.test.ts:171-176` — `expect(Object.keys(DUE_STATE_PRESENCE).sort()).toEqual(['due_later', 'due_today', 'no_due_date', 'overdue'].sort())`.
- `packages/domain/test/attachment.test.ts:64-66` — `expect(Object.keys(ATTACHMENT_KIND_PRESENCE).sort()).toEqual(['file', 'image', 'link'].sort())`.

Beide pinnen eine `PRESENCE`-Aufzählung aus der Produktivdatei (`due-date.ts`, `attachment.ts`) gegen eine von Hand geschriebene Literalliste in der Testdatei — dieselbe Bauart wie beim export-status.ts-Fall (eine Menge, die an einer Abschrift hängt statt an der Anforderung). Anders als beim export-status.ts-Fund ist hier kein Kommentar betroffen, sondern eine tatsächlich ausgeführte Zusicherung, die bei Drift sofort rot liefe — der Schaden ist also kleiner, das Muster aber dasselbe. Ich habe das **nicht** behoben: Eine Auflösung ohne Literal würde entweder Produktivcode ändern (z. B. einen zu `allowedExportStatusTransitions()` analogen, aus dem Typ gerechneten Helfer in `due-date.ts`/`attachment.ts` exportieren — nicht meine Hoheit) oder das Verhalten der Zusicherung abschwächen (z. B. nur noch `.length` statt der konkreten Werte prüfen), was die Regel „keine Zusicherung wird abgeschwächt" verletzen würde. Das ist ein Fall für domain-dev, falls gewünscht.

Offene Fragen:
- Soll domain-dev für `due-date.ts` und `attachment.ts` einen zu `allowedExportStatusTransitions()` analogen, gerechneten Helfer anbieten (z. B. eine `Assert<...>`-Vollständigkeitsprobe wie in `export-status.ts`), damit die beiden oben genannten Prüffälle ohne Literalabschrift auskommen? Das wäre dann ein eigener, kleiner Auftrag außerhalb T-272.

Nächster Schritt: Orchestrator kann T-272 als fertig einstufen; bei Bedarf einen Folgeauftrag an domain-dev für die zwei gemeldeten `PRESENCE`-Fälle einplanen.
