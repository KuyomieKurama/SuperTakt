---
description: Nächste Arbeitswelle starten — Board lesen, freie Aufgaben parallel dispatchen
---

Starte die nächste Arbeitswelle für Takt.

1. Lies `.claude/team/board.md`, `.claude/team/decisions.md` und `.claude/team/risks.md`.
2. Nimm alle Aufgaben aus **Offen**, deren Abhängigkeiten in **Fertig** stehen.
3. Prüfe Dateikollisionen: Vergleiche die Schreibpfade der Kandidaten gegen die Hoheitstabelle
   in `CLAUDE.md`. Zwei Aufgaben, die dieselbe Datei anfassen, dürfen nicht in dieselbe Welle.
   Betrifft eine Aufgabe eine gemeinsame Datei, erledigst du sie selbst statt sie zu delegieren.
4. Starte die verbleibenden Aufgaben als **mehrere Task-Aufrufe in einer einzigen Nachricht**,
   damit sie parallel laufen. Ein Aufruf je Aufgabe, an den im Board eingetragenen Agenten.
5. Gib jedem Agenten mit: die Aufgaben-ID, den Wortlaut der Aufgabe, seine Dateihoheit, die
   Verweise auf `docs/spec.md` und `.claude/team/decisions.md`, und das Berichtsschema aus
   `CLAUDE.md`.
6. Verschiebe die gestarteten Aufgaben im Board nach **Läuft**.
7. Melde mir in höchstens fünf Zeilen, was läuft und was bewusst nicht gestartet wurde.

Wenn keine Aufgabe startbar ist, sag das und nenne den blockierenden Punkt. Starte nichts
ersatzweise.
