# Optimiertes Claude-Code-Team für Takt

## Ziel
Dieses Paket trennt **UX-Entscheidung**, **UI-Design**, **Frontend-Implementierung** und **visuelle QA**,
damit neue Weboberflächen nicht von einem einzigen Agenten entworfen und gleichzeitig umgesetzt werden.

## Empfohlene Rollen
- `ux-designer.md` — Nutzerfluss, Informationsarchitektur, Zustände
- `ui-designer.md` — visuelle Richtung, Designsystem, Komponenten
- `frontend-dev.md` — React/Tauri-Implementierung
- `visual-qa.md` — reale Browseroberfläche prüfen
- `spec-ux-reviewer.md` — Spezifikations- und UX-Gegenprobe
- `e2e-tester.md` — durchgehende Browserabläufe
- `code-reviewer.md` — Codequalität
- `security-checker.md` — Security-Gate
- `domain-dev.md` — Fachlogik, Storage, lokale API
- `integration-dev.md` — Outlook und Export
- `unit-tester.md` — Unit-/Integrationstests
- `documenter.md` — Dokumentation als letzter Schritt

## Plugin-Stack
Aktiviert sind zusätzlich:
- `frontend-design` — visuelle Designführung und bewusstes Frontend-Design
- `playwright` — Browser-Automation, Screenshots und E2E/Visual-QA

Bestehende Engineering-, Security-, Context7-, Superpowers-, TypeScript-LSP- und Humanizer-Plugins bleiben erhalten.
`ui-ux-pro-max` wird weiterhin als Skill verwendet.

## Wellenmodell
**UX → UI → Code → Browser-QA → Spec/UX-Review → Code/Security → Tests → Docs**

Backend und Integrationen laufen parallel, sofern die Dateihoheit keine Kollision erzeugt.

## Installation
Die Datei `settings.json` ersetzt die bisherige `settings(1).json`. `settings.local.json` bleibt lokal.
