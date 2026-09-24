Aufgabe: T-416 — Verwaiste Testdatei quick-command.test.ts entfernen
Status: fertig
Artefakte: `apps/outlook-addin/test/office/quick-command.test.ts` gelöscht (nicht committet)
Zusammenfassung: Die Testdatei importierte `src/quick-command.ts`, das T-398c bereits im Zuge von E-134 Punkt 2 (toter Schnellbefehl) gelöscht hat. Ohne passenden Produktivcode war die Datei nur noch eine Ruine; sie wurde entfernt, sonst nichts angefasst.
Prüfung:
- Vor der Löschung: `npx vitest run apps/outlook-addin` → 1 Datei rot (`Cannot find module '.../src/quick-command.ts'`), 5 Dateien grün, 43 Tests grün. Roter Zustand damit nachgewiesen.
- Nach der Löschung: `npx vitest run apps/outlook-addin` → 5 Dateien grün, 43 Tests grün, keine rote Datei mehr.
Annahmen: Der Fall lag eindeutig vor (Quelldatei fehlt vollständig, Test unbrauchbar) — keine Rückfrage nötig.
Risiken: keine.
Offene Fragen: keine.
Nächster Schritt: Löschung bei Bedarf im nächsten regulären Commit des Orchestrators mit aufnehmen (Auftrag verlangt ausdrücklich „nicht committen").
