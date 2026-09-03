# Takt — Projektregeln

Takt ist eine lokale Todo- und Zeittracking-Anwendung mit konfigurierbarem Export an ein
externes Abrechnungstool und einem Outlook-Add-in.

Verbindliche Quellen:

- `docs/spec.md` — die Produktspezifikation. Keine Umsetzung ohne Deckung durch eine
  Anforderungs-ID daraus.
- `docs/prototype/takt-ui-konzept.html` — liegt noch nicht vor. Bis dahin ist das Designsystem
  aus Aufgabe T-006 die visuelle Referenz.
- `.claude/team/decisions.md` — getroffene Architektur- und Produktentscheidungen.

## Betriebsform

Alles läuft lokal. Kein Cloud-Dienst, kein Datenbankserver, keine Telemetrie. Gespeichert wird
in einer eingebetteten SQLite-Datei im Anwendungsdatenverzeichnis des Benutzers.

## Stack

| Schicht | Technik |
|---|---|
| Hülle | Tauri, Rust-Anteil bewusst dünn: Fenster, Menü, Lebenszyklus des Sidecars, Windows-Benutzername |
| Oberfläche | React + Vite + TypeScript |
| Lokaler Dienst | Node als Tauri-Sidecar, gebunden auf `127.0.0.1`, versorgt Oberfläche und Outlook-Add-in |
| Speicherung | Eingebettetes SQLite, eine Datei, kein Serverprozess |
| Add-in | Office.js + TypeScript |
| Tests | Vitest für Einheiten und Integration, Playwright für End-to-End |

Die Fachlogik liegt in `packages/domain` und kennt weder HTTP noch SQL. Der Zugriff auf die
Speicherung läuft über Ports in `packages/storage`; der SQLite-Adapter ist austauschbar. Das ist
die Bedingung dafür, dass „lokal, zumindest derzeit" später ohne Umbau der Fachlogik aufgehoben
werden kann.

## Sprache

Oberflächentexte, Fehlermeldungen und Dokumentation auf Deutsch. Bezeichner im Code, Dateinamen,
Commit-Präfixe und technische Schlüssel auf Englisch. Die Schlüssel im Exportformat (`Call`,
`Zeit`, `Notiz`, `WindowsUser`) sind Vorgabe des Abrechnungstools und bleiben, wie sie sind.

## Verzeichnisse und Hoheit

Zwei gleichzeitig laufende Agenten fassen nie dieselbe Datei an.

| Pfad | Gehört |
|---|---|
| `packages/domain/**`, `packages/storage/**` | domain-dev |
| `apps/local-api/**` außer `src/routes/addin/` | domain-dev |
| `apps/web/**`, `apps/desktop/**` | frontend-dev |
| `packages/export/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**` | integration-dev |
| `packages/*/test/**`, `apps/*/test/**` | unit-tester |
| `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md` | e2e-tester |
| `docs/bedrohungsmodell.md` | security-checker |
| `docs/**` außer spec, prototype, datenmodell, architektur, testplan, bedrohungsmodell; `README.md` | documenter |
| `.claude/team/reports/**` | jeder Agent, ausschließlich seine eigene Datei |

Gemeinsame Dateien ändert nur der Orchestrator, also die Hauptsession: `CLAUDE.md`,
`.claude/team/board.md`, `decisions.md`, `risks.md`, `.claude/settings.json`, `package.json`,
`pnpm-workspace.yaml`, `tsconfig.base.json` und alle `tsconfig*.json` der Pakete, die
Modulregistrierung des lokalen Dienstes und die Reihenfolge der Datenbankmigrationen.

## Ablauf

Arbeit läuft in Wellen. Unabhängige Aufgaben werden als mehrere Task-Aufrufe in einer Nachricht
gestartet und laufen parallel. Abhängige Aufgaben kommen in die nächste Welle.

Agenten sprechen nicht miteinander. Alles läuft über `board.md`, die Berichte und den
Orchestrator.

Jeder Agent legt seinen Bericht als `.claude/team/reports/T-00X-<rolle>.md` ab und gibt dieselbe
Struktur als Kurzfassung zurück:

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

Bei einer Blockade rät ein Agent nicht. Er meldet zurück und beendet seine Aufgabe.

## Qualitätstor

Eine Aufgabe ist erst fertig, wenn Code-Reviewer, Spezifikations- und UX-Reviewer, Tester und
Security-Checker freigegeben haben. Der Dokumentierer arbeitet als Letzter.

## Fachliche Punkte, die in Review und Test immer geprüft werden

- Zeitbuchungen werden für den Export auf Schritte von 0,25 gerundet: 1,00 = 60 Minuten,
  0,75 = 45, 0,50 = 30, 0,25 = 15.
- Standard-Exportformat: `Call`, `Zeit`, `Notiz` als UTF-8 nach Base64, `WindowsUser`. Die
  Struktur ist über Exportvorlagen konfigurierbar; die Standardvorlage bildet genau dieses
  Format ab.
- Jede Buchung ist eindeutig exportiert oder offen, und das ist überall sichtbar.
- Die Notiz der Buchung geht in die Abrechnung. Die Notiz des Todos bleibt intern und darf in
  keinem Export auftauchen.
- Wird der Timer auf einem erledigten Todo gestartet, hebt die Anwendung „Erledigt" automatisch
  auf; das Todo landet wieder in seinem Pool.
- Tag-Ordner sind beliebig tief verschachtelbar, Pools werden über Tags definiert, Standard-Tags
  greifen bei jedem neuen Todo — auch bei Anlage aus dem Add-in.
- Das Outlook-Add-in holt Tags, Ordner und Pools über die lokale API, erkennt die Call-Nummer
  über einen konfigurierbaren regulären Ausdruck und bietet bei bereits vorhandenem Call an, auf
  das existierende Todo zu buchen statt ein Duplikat anzulegen.

## Sicherheit

Keine Zugangsdaten, keine Kundendaten und keine echten Call-Nummern im Repository. Testdaten
sind erfunden und liegen unter `tests/fixtures/`.

Base64 ist eine Kodierung, keine Verschlüsselung. Exportdateien enthalten lesbare Kundendaten.

Der lokale Dienst hört ausschließlich auf `127.0.0.1` und ist damit für jeden Prozess auf dem
Rechner erreichbar. Diese Vertrauensgrenze wird im Bedrohungsmodell bewertet, nicht ignoriert.

## Befehle

Noch nicht eingerichtet. Der lokale Dienst, die Oberfläche und die Testläufe werden in Welle 2
mit `package.json` festgelegt. Bis dahin trägt jeder Agent die von ihm benötigten Befehle in
seinen Bericht ein, statt sie zu erfinden.
