---
description: Nächste Arbeitswelle starten — Abhängigkeiten prüfen, Design vor Implementierung, QA vor Freigabe
---

Starte die nächste Arbeitswelle für Takt.

1. Lies `.claude/team/board.md`, `.claude/team/decisions.md` und `.claude/team/risks.md`.
2. Nimm alle Aufgaben aus **Offen**, deren Abhängigkeiten in **Fertig** stehen.
3. Prüfe Dateikollisionen gegen die Hoheitstabelle in `CLAUDE.md`.
4. Bei neuen oder stark veränderten UI-Flows gilt die Reihenfolge: `ux-designer` → `ui-designer` →
   `frontend-dev` → `visual-qa` → `spec-ux-reviewer` → `code-reviewer`/`security-checker` → Tests/Docs.
   UX und UI dürfen parallel laufen, wenn sie unterschiedliche Designartefakte bearbeiten.
5. Bestehende Backend-/Integrationsaufgaben dürfen parallel laufen, wenn ihre Dateipfade kollisionsfrei sind.
6. Starte verbleibende Aufgaben als mehrere Task-Aufrufe in einer einzigen Nachricht, je Aufgabe ein Agent.
7. Übergib jedem Agenten Aufgaben-ID, Wortlaut, Dateihoheit, Spec-/Decision-Verweise und Berichtsschema.
8. Verschiebe gestartete Aufgaben nach **Läuft**.
9. Melde in höchstens fünf Zeilen, was läuft und was bewusst nicht gestartet wurde.

Wenn keine Aufgabe startbar ist, sag das und nenne den blockierenden Punkt. Starte nichts ersatzweise.
