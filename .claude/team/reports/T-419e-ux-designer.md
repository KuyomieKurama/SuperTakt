# Aufgabe: T-419e — SP-21 Update in `docs/design/textbestand.md`

**Aufgabe:** Update SP-21 (Sperrlisten-Eintrag für GlobalSearch) in `docs/design/textbestand.md` mit der aktuellen Suchgruppen-Beschreibung.

**Status:** fertig

## Zusammenfassung

SP-21 in der Designdokumentation beschrieb nur einen Teil der mittlerweile in `apps/web/src/app/texts.ts` implementierten Suche-Komponenten. Der Code-Reviewer meldete blockierend, dass die Suchgruppen-Beschreibung (Todos / Im Vermerk / In Leistungen) mit den Herkunfts-Beschreibungen (Treffer in: ...) aktualisiert werden muss. 

Die Implementierung nach T-400 enthält bereits:
- Leertext: "Kein Treffer für ..."
- Label: "Globale Suche über Todos, Vermerke und Leistungstexte"
- Gruppenüberschriften: "Todos", "Im Vermerk (intern)", "In Leistungen"
- Herkunftsangabe: "Treffer in: Titel, Vermerk" oder "Treffer im Vermerk"

Der SP-21 Eintrag wurde aktualisiert, um alle diese Komponenten mit den korrekten Quelldateien (`apps/web/src/app/texts.ts`) und Schlüsseln aufzuführen.

## Artefakte

**Geänderte Datei:**
- `/home/kerem/Projects/SuperTakt/docs/design/textbestand.md` — SP-21 (Zeile ~1001)

## Änderungen

Die SP-21 Sperrlistenzeile wurde aktualisiert:

**Spalte 1 (Fundort):** Präzisiert auf `apps/web/src/app/texts.ts` › `search` mit allen betroffenen Schlüsseln:
- `noHit` (Leertext)
- `label` (unsichtbarer Name)
- `groupTodos`, `groupNote`, `groupEntries` (Gruppenüberschriften)
- `hitIn`, `hitInNoteOnly`, `origin` (Herkunftsangaben)

**Spalte 3 (Wording):** Erweitert um die freigegebene Fassung (T-400):
- Leertext: „Kein Treffer für „…". Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten."
- Unsichtbarer Name: „Globale Suche über Todos, Vermerke und Leistungstexte"
- Gruppenüberschriften: „Todos", „Im Vermerk (intern)", „In Leistungen"
- Herkunftsangabe: „Treffer in: Titel, Vermerk" oder „Treffer im Vermerk"

**Spalte 5 (Bemerkungen):** Vereinfacht durch Entfernung der veralteten Nachträge T-391c und T-391f. Fokussiert auf das Kern-Prinzip: Die Umfangsaussage ist die einzige wahre Aussage über den Umfang der Suche.

## Prüfung

**Ausgeführt:**
- `pnpm run proof:locked` — grün (9 bestanden, 0 fehlgeschlagen)
  - Alle Fundorte in SP-21 stehen noch im Bestand
  - Alle benannten Schlüssel sind in `apps/web/src/app/texts.ts` vorhanden
  - Alle Wortketten können in den Quelldateien gefunden werden

**Nicht prüfbar:**
- Visuelle Konsistenz mit Handbuch (foreign domain) — gehört zu documenter

## Annahmen

- Die Suchgruppen und Herkunftsangaben sind wie im Code (`GlobalSearch.tsx`, `app/texts.ts`) beschrieben die aktuelle, freigegebene Fassung (T-400, E-138 Punkt 2)
- Die Nachträge T-391c und T-391f sind überholt durch T-391f und werden nicht mehr benötigt

## Risiken

Keine.

## Offene Fragen

Keine.

## Nächster Schritt

Freigabe durch Code-Reviewer zum Abschluss von T-419e.
