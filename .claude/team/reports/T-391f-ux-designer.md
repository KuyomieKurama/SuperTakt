Aufgabe: T-391f — SP-21 auf den gebauten Wortlaut der Suche (T-400) ziehen
Status: braucht Review
Artefakte: docs/design/textbestand.md (Sperrlistenzeile SP-21, Fußnote „SP-21, update T-391f")
Zusammenfassung: Spalte 3 von SP-21 trägt jetzt zeichengleich „Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten." und „Globale Suche über Todos, Vermerke und Leistungstexte". Die Begründungsspalte beschreibt die Umfangsaussage nicht mehr als Abwesenheit; Nachtrag T-391f vermerkt die Streichung der alten Fassung, der Nachtrag T-391c ist als überholt markiert.
Prüfung: `proof:locked` nicht gefahren (in dieser Sitzung kein Shell-Werkzeug). Gegengelesen: beide Sätze stehen zeichengleich in apps/web/src/app/texts.ts Zeilen 24 und 33; der Leertext-Anker ist nur der zweite Satz, weil der erste einen Platzhalter trägt. proof-locked-text.mjs liest nur Spalte 3; die Zeile hat weiter fünf Spalten, kein zusätzliches „|".
Annahmen: Ortsspalte unverändert gelassen (Schlüssel `noHit`, Bündel app/texts.ts).
Risiken: keine; die alte Fassung steht nur noch in Spalte 5 und der Fußnote, die das Werkzeug nicht als Anker liest.
Offene Fragen: keine.
Nächster Schritt: `pnpm --filter @takt/web run proof:locked` durch den Orchestrator fahren lassen.
