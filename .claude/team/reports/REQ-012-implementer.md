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

Nachbesserung P1 — Filterleiste (REQ-20260930-012, d758de079359e68a)

Status: braucht Review

Artefakte:
- apps/web/src/features/board/BoardScreen.tsx
- apps/web/src/styles/app.css
- tests/e2e/kanban-layout.spec.ts
- .claude/team/reports/req012-filterbar-after-classic.png
- .claude/team/reports/req012-filterbar-after-everfrost.png

Zusammenfassung:
- Die Standanzeige ist jetzt das erste Element der rechten Aktionsgruppe, unmittelbar vor „Mehr Karten laden“, Refresh-Hinweis und „Neu berechnen“. Der Abstand zur Hilfe bleibt durch `margin-inline-start: auto` zwischen den Gruppen; in der Aktionsgruppe gilt `gap: var(--space-3)`.
- Hilfe und Standanzeige verwenden nun beide `--text-sm` und `--leading-normal`; die Aktionsgruppe richtet ihren Inhalt mittig aus und schließt als Gruppe mit den Feldern ab.
- Der Layouttest zeichnet mit `KANBAN_FILTERBAR_SCREENSHOT_PATH` die echte `BoardScreen`-Filterleiste bei 1280×900 in classic/light bzw. everfrost/dark auf. Er stellt nach frischem Laden außerdem fest, dass „Neu berechnen“ nicht `:focus-visible` ist.

Prüfung:
- pnpm typecheck: bestanden.
- pnpm contrast: bestanden (vollständiger Lauf, keine Fehler).
- KANBAN_FILTERBAR_THEME=classic KANBAN_FILTERBAR_SCREENSHOT_PATH=… pnpm exec playwright test -c /tmp/req012-playwright.config.mjs --workers=1 --retries=0: bestanden; echte BoardScreen, 1280×900.
- Dasselbe mit `KANBAN_FILTERBAR_THEME=everfrost`: bestanden; echte BoardScreen, 1280×900.
- Sichtprüfung beider PNGs: Stand steht vor den Aktionen mit sichtbarem Abstand, keine dauerhafte rosa Kontur an „Neu berechnen“.
- Der vollständige normale Playwright-Aufruf konnte nicht starten, weil ein fremder Vite-Prozess Port 5173 bereits belegte. Ein API-only-Ausweichlauf von kanban.spec.ts gegen diesen fremden Webserver lief folgerichtig in fünf Timeouts auf „Spalten verwalten“; das ist keine Aussage über die Änderung. Der Vorgängerstand dokumentiert kanban.spec.ts und kanban-layout.spec.ts mit 6 bestanden.

Annahmen:
- Die laufende Vite-Instanz auf Port 5173 war nicht von diesem Task und wurde nicht beendet, um parallele Arbeit nicht zu stören.

Risiken:
- Der vollständige kanban.spec.ts-Nachweis ist in diesem Lauf wegen der fremden Portbelegung nicht erneut grün. Die unmittelbar geänderte BoardScreen-Layoutprüfung ist grün.

Offene Fragen:
- Keine zur Umsetzung; nach Freigabe kann der vollständige E2E-Satz auf einem freien Port-5173-Slot erneut laufen.

Rückweg: Den Commit „fix(board): align board stamp with filter bar“ zurücksetzen. Das stellt die frühere Position der Standanzeige, die kleineren Schriftwerte und den früheren Screenshot-Hook wieder her.

Nachbesserung W3 — Filterleiste klein (REQ-20260930-012, d758de079359e68a)

Status: braucht Review

Artefakte:
- apps/web/src/features/board/BoardScreen.tsx
- apps/web/src/features/board/BoardSetupDialog.tsx
- apps/web/src/features/board/texts.ts
- apps/web/src/styles/app.css
- tests/e2e/kanban-layout.spec.ts
- .claude/team/reports/req012-w3-filterbar-1024x768-classic.png
- .claude/team/reports/req012-w3-filterbar-1024x768-everfrost.png
- .claude/team/reports/req012-w3-filterbar-1290x800-classic.png
- .claude/team/reports/req012-w3-filterbar-1290x800-everfrost.png
- .claude/team/reports/req012-w3-filterbar-1920x1080-classic.png
- .claude/team/reports/req012-w3-filterbar-1920x1080-everfrost.png

Zusammenfassung:
- Die Filterleiste hat jetzt eine linke Feldgruppe und eine rechte Aktionsgruppe. Bis 1290 × 800 liegen sie in einer Zeile; unter 1120 px steht die vollständige Aktionsgruppe linksbündig in einer zweiten Zeile.
- „Spalten verstehen“ und sein Aufklapper sind entfernt. Die unveränderten Sätze über die Regelbewegung und ausgeblendete erledigte Todos stehen nun im Dialog „Spalten verwalten“.
- Der Layouttest misst bei 1290 px die Top-Koordinaten von Priorität und Aktionsgruppe mit höchstens 2 px Differenz und nimmt über `KANBAN_FILTERBAR_VIEWPORT` die drei geforderten Viewports auf.

Prüfung:
- Arbeitsbaum-Suche ohne Bauergebnisse: 0 Treffer für „Spalten verstehen“, `howColumnsWork` und `board__help` in `apps/web/src`, `apps/local-api/src`, `apps/desktop/src-tauri/src`, `apps/outlook-addin/src` und `tests`.
- `pnpm typecheck`: bestanden.
- `pnpm contrast`: bestanden.
- `pnpm exec playwright test -c tests/e2e/playwright.kanban-layout.config.ts`: bestanden.
- Je ein echter Layoutlauf für classic und everfrost bei 1290 × 800, 1024 × 768 und 1920 × 1080: 6/6 bestanden; die PNG-Dateien haben die jeweiligen gemessenen Abmessungen.
- `pnpm --filter @takt/web test`: bestanden.
- `pnpm exec playwright test tests/e2e/kanban.spec.ts --workers=1`: nicht bestanden; alle fünf Fälle konnten die lokale API auf 127.0.0.1:17843 nicht erreichen. Das ist ein Umgebungsblocker vor der geänderten Oberfläche.

Annahmen:
- Die bei 1120 px gesetzte Umbruchschwelle ist der aus den geforderten Screenshots abgeleitete Rückfall: 1290 bleibt einzeilig, 1024 zeigt die vollständige Aktionsgruppe unter den Feldern.

Risiken:
- Der vollständige API-gestützte Kanban-E2E-Satz ist in dieser Sandbox nicht durchführbar, solange der lokale Dienst auf 127.0.0.1:17843 nicht läuft.

Offene Fragen:
- Keine zur Umsetzung.

Nächster Schritt: Code-, UX- und Spezifikationsreview der W3-Änderung; anschließend den API-gestützten Kanban-Satz in einer laufenden lokalen Dienstumgebung wiederholen.

Rückweg: Den folgenden W3-Commit zurücksetzen. Das stellt den Aufklapper, seine Texte und die frühere Ein-Gruppen-Layoutregel wieder her.

Lieferkette — hono 4.13.5 auf 4.13.7 (REQ-20260930-012, d758de079359e68a)

Status: fertig

Artefakte:
- apps/local-api/package.json
- pnpm-lock.yaml
- .claude/team/reports/REQ-012-implementer.md

Zusammenfassung:
- `hono` ist im lokalen Dienst exakt auf 4.13.7 angehoben. Damit ist GHSA-hxh3-vqpv-xpqv geschlossen; `@hono/node-server` bleibt bei 2.1.1, weil seine deklarierte Peer-Abhängigkeit `hono: ^4` die 4.13.7 einschließt.
- Der Lockfile-Diff enthält ausschließlich die Auflösung 4.13.5 → 4.13.7 für `hono` und die davon abhängige Peer-Suffix-/Snapshot-Referenz von `@hono/node-server`; keine andere Paketauflösung bewegt sich.

Prüfung:
- Vor dem Lauf waren nur ein fremder Web-Vite-Prozess, dessen Node-Elternprozess und esbuild sichtbar; sie wurden nicht beendet.
- `pnpm install --lockfile-only`: bestanden. Der Offline-Versuch brach erwartungsgemäß bei fehlenden Metadaten für die unabhängige Root-Abhängigkeit `@playwright/test` ab; der anschließende normale Lauf löste ausschließlich die angeforderte Lockfile-Aktualisierung auf. `pnpm install`: bestanden, 2 Pakete ersetzt.
- `pnpm audit`: bestanden, `No known vulnerabilities found`.
- `pnpm typecheck`: bestanden.
- `pnpm --filter @takt/local-api test`: bestanden (keine Ausgabe, Exit 0).
- Dienststart-Smoke: bestanden. Der echte Proof-Einstieg startete gegen isolierte temporäre Anwendungsdaten mit `TAKT_PROOF_PORT=17845`; `GET /api/v1/health` mit gültigem Origin und Token antwortete `{"data":{"status":"ok"}}`. Der Prozess wurde danach beendet, der temporäre Bestand entfernt und der Port war nicht mehr erreichbar.
- Lokal installiertes `node_modules/hono/package.json` bestätigt 4.13.7. Lokale Release Notes bzw. ein Changelog für 4.13.5 → 4.13.7 waren nicht vorhanden und wurden daher nicht gesichtet.

Annahmen:
- Der zur Laufzeit verwendete, isolierte Proof-Einstieg ist ein ausreichend naher Dienststart-Smoke: Er verwendet denselben `main()`-Zusammenbau, ersetzt nur die Versionsquelle durch eine netzlose Stütze und lässt den Produktport unverändert.

Risiken:
- Keine bekannten. Der temporäre Smoke erzeugte ein lokales Entwicklungszertifikat ausschließlich im anschließend entfernten temporären Anwendungsdatenverzeichnis.

Offene Fragen:
- Keine.

Nächster Schritt: Commit und Push des Sicherheitsfixes; anschließend Review.

Rückweg: Den Commit `build(local-api): bump hono to 4.13.7 (GHSA-hxh3-vqpv-xpqv)` zurücksetzen. Das stellt `hono` 4.13.5 und die zugehörigen Lockfile-Referenzen wieder her, stellt aber die gemeldete Sicherheitslücke erneut her.
