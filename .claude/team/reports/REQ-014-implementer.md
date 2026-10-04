Aufgabe: REQ-20261002-014 W1 — Zeilendichte kompakt sichtbar wirksam (Variante A)
Status: braucht Review (Runde 2 von 3)
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
- Der neue Playwright-Test misst echte Kanban-, Pool-, Buchungslisten-, Buchungs-Tabellen- und Baumzeilen mit getBoundingClientRect und verlangt kompakt kleiner als Normal.

Prüfung:
- pnpm typecheck: bestanden.
- pnpm boundaries: bestanden.
- pnpm contrast: bestanden.
- pnpm proof:all: bestanden (alle Nachweisläufe).
- Playwright-Hauptconfig, density-visible.spec.ts, --workers=2: bestanden; ein Test lief erwartungsgemäß seriell wegen fullyParallel=false. Messwerte: Kanban-Karte 134.5px Normal / 126.5px kompakt; Pool-Zeile 99px / 91px; Buchungslisten-Zeile `.entry-row` 48px / 40px; Buchungstabellen-Zeile 40px / 35.59375px; Baumzeile 40px / 32px.
- Negativprobe mit DENSITY_NEGATIVE_PROBE=1: absichtlich rot; alle Paare waren gleich (Kanban 134.5px, Pool 99px, `.entry-row` 48px, Tabelle 40px, Baum 40px), erster Fehler Kanban, tatsächlicher Playwright-Exit 1.
- Zwölf echte Screenshots (classic hell/Everfrost dunkel × Normal/kompakt × Kanban/Pools/Buchungen) erzeugt.
- Normal-Gegenvergleich mit cff389a: bestanden. Jeweils `getComputedStyle` für `.kcard`, `.pick-row`, `.entry-row` und `.table tbody td` in classic und clear bei `data-density="comfortable"`: padding-top/-bottom, min-height und gap sind zeichengleich. Werte: Kachel 12px/12px/auto/4px; Auswahl- und Buchungslisten-Zeile 8px/8px/auto/8px; Tabellenzelle 0px/0px/0px/normal; nur clear-Auswahl-Zeile 8px/8px/56px/8px. Die Messung lief in einem temporären Worktree auf cff389a und im Arbeitsstand; beide liefen grün, danach wurde der Worktree entfernt.
- apps/web Unit-Suite: `pnpm exec vitest run apps/web/test --passWithNoTests` bestanden (22 Dateien, 248 Tests).
- Kanban-E2E über Hauptconfig mit `--workers=2`: `kanban.spec.ts`, `kanban-layout.spec.ts`, `kanban-card-header-overflow.spec.ts` bestanden (7 Tests).
- Nicht ausgeführt: vollständiges `pnpm check`; die spezifizierten Einzelgates und die aufgabennahen Tests wurden ausgeführt.

Annahmen:
- Der in der Karte bestätigte req_hash b321305c2fdb4bd8 bezieht sich auf exakt den kanonischen 12-Zeilen-Anforderungstext.
- Die echte Buchungslisten-Zeile wird stabil auf der Todo-Detailansicht gemessen, weil die Dashboard- und Zeiterfassungsansichten an der UTC/Ortszeit-Tagesgrenze nur lokale Tagesbuchungen anzeigen.

Risiken:
- Keine Daten, Texte, Netzverbindungen oder Konfigurationen geändert.
- Die Screenshots sind ein geprüfter Entwicklungsnachweis; sie liegen als generierte PNGs im Berichtspfad.

Offene Fragen:
- Keine.

Nächster Schritt: Reviewer prüft die separate `.entry-row`-Messung, die protokollierten positiven Höhen und die Normal-Baseline-Messung.
