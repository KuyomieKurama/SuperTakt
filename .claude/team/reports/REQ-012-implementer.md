Aufgabe: REQ-012 — Kanban-Karte ohne Kopfzeile, Werkzeugzeile in Filterleiste
Status: braucht Review
Artefakte:
- apps/web/src/features/board/BoardScreen.tsx
- apps/web/src/features/board/Kanban.tsx
- apps/web/src/styles/app.css
- apps/web/src/styles/components.css
- apps/web/test/features/board/kanbanCardHeader.test.ts
- tests/e2e/kanban-card-header-overflow.spec.ts
- tests/e2e/support/kanban-screenshot.tsx
- .claude/team/reports/REQ-012-implementer.md
- .claude/team/reports/req012-board-before-1280.png
- .claude/team/reports/req012-board-after-1280.png

Zusammenfassung:
- Die Standanzeige, „Mehr Karten laden“, Refresh-Hinweis und „Neu berechnen“ liegen jetzt in der vorhandenen Filterleiste. Die Aktionsgruppe ist bei Desktopbreite rechts ausgerichtet und wird unter 600 px als eigene Zeile im selben Filterrahmen umgebrochen.
- Die Kartenkopfzeile ist entfernt. Der Titel ist immer das erste Kartenelement; Call, Erledigt-/Reaktiviert-Marke, Frist, Priorität und Tagzähler stehen in der einzigen umbrechenden Metazeile darunter. Der sichtbar verborgene Text für „Offen“ und der A-19.5-Kommentar zur optionalen Fristmarke bleiben erhalten.
- Die Karten werden dadurch um die frühere Kopfzeile samt Zwischenabstand kompakter. Timer- und Menüknopf bleiben unverändert in der rechten Aktionsspalte; die vorhandenen Mindestgrößen der Knöpfe wurden nicht verändert.

E-087-Suche vor dem Umbau:
- Git-Index: Treffer in BoardScreen.tsx, Kanban.tsx, texts.ts, app.css, components.css, kanbanCardHeader.test.ts, kanban-card-header-overflow.spec.ts, kanban.spec.ts und todo-revival.spec.ts; zusätzlich historische Verweise in docs/design/fensterfeste-flaechen*.md, docs/design/kartenkopf-board.md und docs/testplan.md.
- Arbeitsbaum: apps/web/src ergab dieselben Produktstellen; apps/web/test nur kanbanCardHeader.test.ts; tests/ die genannten drei E2E-Dateien. Die Suche umfasste kcard__top, kcard__call, kcard__flag, kcard__deadline, board__bar, board__stamp, text.stamp, „Neu berechnen“ und recalculate; Bauergebnisse waren ausgeschlossen.
- Angepasst wurden der statische Kartenkopf-Test und der gezielte Overflow-E2E-Test. Die Funktionsprüfungen in kanban.spec.ts und todo-revival.spec.ts bleiben gültig, weil die Klasse kcard__flag und ihr sichtbarer Text erhalten sind. Die historischen Dokumente liegen außerhalb der durch diesen Auftrag zu ändernden Hoheit und wurden nicht geändert.

Prüfung:
- pnpm typecheck: bestanden.
- pnpm test -- apps/web/test/features/board/kanbanCardHeader.test.ts: bestanden, 134 Testdateien bestanden, 1 übersprungen; 2.113 Tests bestanden, 2 übersprungen.
- pnpm boundaries: bestanden.
- pnpm contrast: bestanden, 0 von 522 Kontrastpaaren durchgefallen.
- PLAYWRIGHT_BROWSERS_PATH=/work/.ms-playwright pnpm exec playwright test -c tests/e2e/playwright.config.ts --workers=1 --retries=0 tests/e2e/kanban.spec.ts tests/e2e/kanban-layout.spec.ts tests/e2e/kanban-card-header-overflow.spec.ts tests/e2e/viewport-fit.spec.ts: 14 bestanden, 3 fehlgeschlagen. Alle Kanban-Fälle einschließlich des neuen TP-KANBAN-07 bestanden. Die drei Fehler liegen in viewport-fit.spec.ts bei Tags/Einstellungen: A8 scrollHeight des settings-layout, A5 fehlender Laufbereich Tags und A9 PageDown auf Einstellungen. Diese Aufgabe ändert weder Tags noch Einstellungen; die Fehler wurden nicht verändert.
- Nach der CSS-Ausrichtung zusätzlich: kanban-layout.spec.ts bestanden (1280 px, Filter und Aktionen in einer Reihe; bei 600 px kein Dokumentüberlauf).
- Screenshots: Der deterministische Zwei-Spalten-Fixture-Lauf gegen origin/main 9102015 erzeugte req012-board-before-1280.png; derselbe Lauf auf diesem Branch erzeugte req012-board-after-1280.png. Beide PNGs sind 1280×900. Sichtprüfung: je zwei Spalten, mindestens eine Karte ohne Call sowie eine mit Frist; danach steht auf allen Karten der Titel oben und die Metazeile darunter.

Annahmen:
- Die in docs/design und docs/testplan vorhandenen Beschreibungen der früheren Kopfzeile sind historische Entwurfs- und Nachweisreferenzen. Ihre fachliche Aktualisierung wurde nicht in der Anforderung verlangt und liegt nach der Hoheitstabelle nicht bei dieser Rolle.

Risiken:
- Der vollständige angeforderte E2E-Satz ist wegen der drei dokumentierten Viewport-Fit-Fehler nicht vollständig grün. Die beiden geänderten Kanban-E2E-Prüfungen und der Layoutnachweis sind grün.
- Die Vorher-Aufnahme nutzt dieselbe Test-Fixture mit einer ergänzten call-losen Karte, aber den unveränderten Produktstand von origin/main; so unterscheiden sich die Bilder nur im Kartenmarkup und den Styles der Umsetzung.

Offene Fragen:
- Keine zur Umsetzung. Die drei Viewport-Fit-Fehler benötigen gegebenenfalls eine getrennte Aufgabe für Tags/Einstellungen.

Nächster Schritt: Code- und UX-Review der kompakten Karte, Filterleiste und Screenshots; danach Entscheidung über die nicht zu diesem Auftrag gehörenden Viewport-Fit-Fehler.
