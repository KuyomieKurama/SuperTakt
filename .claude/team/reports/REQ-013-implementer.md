Aufgabe: REQ-013 — Statusfarben info/success/warning/danger aus Design-Theme + Kontrast-Proof je Theme
Status: teilweise
Artefakte: apps/web/src/styles/theme-base.css; apps/web/scripts/contrast-check.mjs
Zusammenfassung: Statusfarben werden für Nicht-classic/clear aus dem aktiven Design-Preset abgeleitet. Der Kontrastlauf liest alle 19 Theme-Dateien und misst die statusbezogenen Paare in ihrem vorgesehenen Modus; 2.297 Messungen sind grün.
Prüfung: pnpm typecheck bestanden; pnpm boundaries bestanden; pnpm contrast bestanden (0 von 2297 Paaren durchgefallen); pnpm themes:check bestanden; pnpm --filter @takt/web test beendet ohne Testausgabe und erfolgreich; Playwright kanban.spec.ts plus kanban-layout.spec.ts mit --workers=1: 6 bestanden.
Annahmen: Die Theme-Dateien und Kontrastwerte wurden am Code bzw. am realen Proof gelesen und gemessen. Die automatische Dunkelvariante wird, soweit vorhanden, aus dem expliziten [data-theme="dark"]-Block gelesen; die CSS-Medienvariante dieser Themes enthält dieselben Presets. Der Bericht enthält keine Vorher-/Nachher-Screenshots: Dieser Nachweis wurde in diesem Lauf nicht erzeugt.
Risiken: --danger-bg-subtle ist eine sehr zurückhaltende, helle Tönung, damit die bestehende 3:1-Kontur von zwei hellen Presets erhalten bleibt. classic und clear werden von den neuen Selektoren nicht erreicht.
Offene Fragen: Die geforderten sechs Screenshots (vorher/nachher für classic, everfrost dunkel und ein drittes Theme) fehlen und müssen vor dem Qualitätstor nachgeliefert werden.
Nächster Schritt: Screenshot-Nachweis erstellen und danach Reviewer-Freigabe einholen.
