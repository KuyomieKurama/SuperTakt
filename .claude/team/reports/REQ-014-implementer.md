Aufgabe: REQ-20261002-014 W1 — Zeilendichte kompakt sichtbar wirksam (Variante A)
Status: braucht Review
Artefakte:
- packages/ui-tokens/tokens.css
- apps/web/src/styles/components.css
- apps/web/src/styles/app.css
- tests/e2e/density-visible.spec.ts
- .claude/team/reports/req014-*.png (12 echte 1280x900-Screenshots)
- .claude/team/reports/REQ-014-implementer.md

Zusammenfassung:
- Dichteabhängige vertikale Tokens steuern jetzt Kanban-Karten, Auswahl- und Buchungszeilen sowie Pool-Zeilen; Normalwerte entsprechen den bisherigen festen Werten.
- Die frühere clear-Sonderregel für die Dashboard-Auswahlzeile liest nun das gemeinsame Min-Höhen-Token; die kompakte Sonderregel entfällt, weil das Token sie vollständig abdeckt.
- Der neue Playwright-Test misst echte Kanban-, Pool-, Buchungs-Tabellen- und Baumzeilen mit getBoundingClientRect und verlangt kompakt kleiner als Normal.

Prüfung:
- pnpm typecheck: bestanden.
- pnpm boundaries: bestanden.
- pnpm contrast: bestanden.
- pnpm proof:all: bestanden (alle Nachweisläufe).
- Playwright-Hauptconfig, density-visible.spec.ts, --workers=2: bestanden; ein Test lief erwartungsgemäß seriell wegen fullyParallel=false.
- Negativprobe mit DENSITY_NEGATIVE_PROBE=1: absichtlich rot; Kanban 134.5px gegen 134.5px, Exit 1.
- Zwölf echte Screenshots (classic hell/Everfrost dunkel × Normal/kompakt × Kanban/Pools/Buchungen) erzeugt.
- Nicht ausgeführt: vollständige apps/web Unit-Tests, pnpm check, vollständige Kanban-E2E-Suite sowie getComputedStyle-Gegenvergleich mit cff389a; diese Prüfungen waren zum Abschluss dieser Welle nicht erneut gemessen.

Annahmen:
- Der in der Karte bestätigte req_hash b321305c2fdb4bd8 bezieht sich auf exakt den kanonischen 12-Zeilen-Anforderungstext.
- Die Buchungstabelle ist der geforderte sichtbare Nachweis für Buchungen; .entry-row erhält denselben Listentoken und wird durch den CSS-Änderungsumfang mit abgedeckt.

Risiken:
- Keine Daten, Texte, Netzverbindungen oder Konfigurationen geändert.
- Die Screenshots sind ein geprüfter Entwicklungsnachweis; sie liegen als generierte PNGs im Berichtspfad.

Offene Fragen:
- Keine.

Nächster Schritt: Reviewer prüft Token-Namen, den sichtbaren Umfang der Dichteänderung und die noch nicht wiederholten Vollgates.
