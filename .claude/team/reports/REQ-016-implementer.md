Aufgabe: REQ-016 (req_hash 683418b0954855e6) — source-map-js anheben, damit `pnpm audit` und die Release-Prüfung wieder grün sind
Status: fertig
Artefakte: pnpm-lock.yaml (Commit b585399, Branch fix/audit-source-map-js, Basis main 4bd2b3e); .claude/team/reports/REQ-016-implementer.md
Zusammenfassung: `corepack pnpm update source-map-js -r` hat im Lockfile source-map-js 1.2.1 auf 1.2.2 gehoben (5 Zeilen ersetzt: Paketeintrag, Snapshot, zwei Verweise von magicast und postcss). pnpm hat weder minimumReleaseAge noch trustPolicy beanstandet; package.json und pnpm-workspace.yaml blieben unberührt. `pnpm audit` meldet danach keine bekannten Schwachstellen.
Prüfung:
  Vorher (main, `pnpm audit`): 1 vulnerability, Severity 1 high, source-map-js >=1.0.0 <1.2.2, GHSA-68fv-2mgg-jv7q, 10 Pfade.
  pnpm why source-map-js vorher: `source-map-js@1.2.1` (über magicast@0.5.4 und postcss@8.5.26 > vite@7.3.6) — "Found 1 version of source-map-js".
  pnpm why source-map-js nachher: `source-map-js@1.2.2` (gleiche Pfade) — "Found 1 version of source-map-js".
  `git diff --stat` vor dem Commit: nur pnpm-lock.yaml, 5 insertions, 5 deletions.
  `corepack pnpm install --frozen-lockfile` nach dem Update: "Already up to date".
  `corepack pnpm audit`: Exit 0, "No known vulnerabilities found".
  Einzelne Stufen von `pnpm check` (je `corepack pnpm run <stufe>`), alle Exit 0:
    themes:check 0; typecheck 0; boundaries 0 ("Notiz-Trennung: alle Schichten unverletzt");
    contrast 0 ("0 von 2297 Paaren durchgefallen", "13 von 13 Gegenproben bestanden");
    proof:all 0 ("283 bestanden, 0 fehlgeschlagen");
    verify:bundle 0 ("21 bestanden, 0 fehlgeschlagen");
    test:coverage 0 (Test Files 134 passed | 1 skipped (135); Tests 2113 passed | 2 skipped (2115); Lines 94.84 %, Branches 86.75 %);
    build 0; audit 0 ("No known vulnerabilities found").
  Nicht ausgeführt: test:rust. Im Sandkasten fehlt `certutil` (libnss3-tools); dadurch scheitern zwei Tests in outlook_certificate::unix auch auf unverändertem main (laut Auftrag bekannt). Das habe ich nicht geprüft und nicht behoben; die Änderung betrifft nur JS-Lockfile-Einträge von Entwicklungsabhängigkeiten, nicht den Rust-Code.
Annahmen:
  - Die Ursache des Release-Fehlers in der CI ist aus der lokalen Reproduktion abgeleitet: `pnpm check` endet mit `pnpm audit`, und das meldet lokal auf main genau diese eine HIGH-Meldung. Die CI selbst war nicht beobachtbar (unbekannt, ob dort weitere Fehler auftreten).
  - Dass source-map-js 1.2.2 älter als 7 Tage und damit nach minimumReleaseAge zulässig ist, folgt aus der Angabe im Auftrag (veröffentlicht 2026-09-30); pnpm hat das Update ohne Fehler zugelassen. Ich habe den Zeitstempel nicht selbst an der Registry nachgeprüft.
  - Die Lockfile-Integritätssumme von 1.2.2 stammt von pnpm aus der Registry; nicht unabhängig gegengeprüft.
  - Ob ein späterer `pnpm update` oder eine neue Abhängigkeit source-map-js wieder auf eine ältere Version zieht, ist unbekannt; es gibt keine Absicherung per `overrides` (nicht beauftragt, Dateien gesperrt).
Risiken: Gering. Reines Patch-Update einer transitiven Entwicklungsabhängigkeit (postcss, magicast); sie landet nicht im ausgelieferten Erzeugnis, soweit ich es sehe (nicht eigens geprüft). Rückweg: `git revert b585399` und `corepack pnpm install --frozen-lockfile`.
Offene Fragen: Keine.
Nächster Schritt: Reviewer prüft Commit b585399 (Lockfile) und den Berichts-Commit; danach Branch durch den Orchestrator pushen (Agenten pushen nicht) und das Release-Workflow neu starten.
