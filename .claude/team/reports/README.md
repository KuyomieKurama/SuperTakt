# Berichte

Jeder Agent legt hier eine Datei je Aufgabe ab, benannt `T-00X-<rolle>.md`, zum Beispiel
`T-001-domain-dev.md`. Ein Agent schreibt ausschließlich seine eigene Datei.

Aufbau, unverändert zu übernehmen:

```
Aufgabe: T-007 — Zeitbuchungen: Rundung und Exportstatus
Status: fertig | blockiert | braucht Review | teilweise
Artefakte: geänderte oder neue Dateien
Zusammenfassung: 3 bis 5 Sätze, was gemacht wurde
Annahmen: was ich entschieden habe, ohne zu fragen
Risiken: einschließlich Sicherheitshinweisen
Offene Fragen: an den Orchestrator
Nächster Schritt: konkreter Vorschlag
```

Dieselbe Struktur kommt zusätzlich als Kurzfassung im Rückgabewert an den Orchestrator.

Der Status ist wahrheitsgemäß. Ein Test, der nicht lief, ist nicht bestanden. Eine Aufgabe, die
zur Hälfte fertig ist, ist `teilweise`, nicht `fertig`.
