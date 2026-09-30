Aufgabe: REQ-011 W2 — Fix: no-evidence.spec.ts vergleicht abgeleitete Flags (Review R1)
Status: fertig
Artefakte: tests/e2e/no-evidence.spec.ts
Zusammenfassung: Der E2E-Vergleich entfernt nur die beiden vom Todo abgeleiteten Felder `todoNoEvidence` und `todoNoExport` und vergleicht alle übrigen zur Laufzeit gelieferten Buchungsfelder unverändert. Er prüft zusätzlich ausdrücklich, dass `todoNoEvidence` nach dem Ausschalten `false` ist.
Prüfung: `PLAYWRIGHT_BROWSERS_PATH=/work/.ms-playwright pnpm exec playwright test -c tests/e2e/playwright.config.ts tests/e2e/no-evidence.spec.ts` grün: 1 passed. `pnpm typecheck` grün. Der Lauf vor der Änderung war reproduzierbar rot; sein Diff zeigte ausschließlich `todoNoEvidence: true` zu `false`, `updatedAt` blieb gleich.
Annahmen: Die Destrukturierung testet alle tatsächlich gelieferten Buchungsfelder, außer den beiden ausdrücklich abgeleiteten Todo-Flags; die Testhilfstypen deklarieren diese API-Felder noch nicht vollständig.
Risiken: Keine Produktcode-Änderung. Falls die API künftig weitere abgeleitete Todo-Felder liefert, werden sie absichtlich mitverglichen, bis die Anforderung sie ausnimmt.
Offene Fragen: Keine.
Nächster Schritt: Reviewer kann Commit 767d7f8 prüfen; ein Revert dieses Commits stellt den fehlerhaften Deep-Equality-Vergleich wieder her.
