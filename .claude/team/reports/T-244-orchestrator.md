# T-244 — Die drei roten GitHub-Prüfungen

Aufgabe: T-244 — die auf Commit `5d869ae` unter `push` und `pull_request` doppelt
fehlgeschlagenen Rust- und Engine-Prüfungen ursächlich beheben
Status: fertig
Artefakte: `.github/workflows/pruefung.yml`, `.github/workflows/release.yml`,
`apps/web/scripts/proof-engine-parity.mjs`,
`apps/web/scripts/engine-parity/shoot-webkitgtk.py`,
`apps/desktop/src-tauri/src/attachment.rs`, `.claude/team/decisions.md`

## Befund

Die sechs roten Einträge in der Pull-Request-Ansicht waren zwei Auslöser desselben
Commits. Der GitHub-Lauf `34084228314`, Versuch 2, hatte drei technische Fehler:

- `cargo test --lib` auf `ubuntu-24.04`, Code 101;
- `cargo test --lib` auf `windows-2022`, Code 101;
- `proof:engines --kein-uebersprung` auf `ubuntu-24.04`, Code 1.

Die öffentlichen GitHub-Metadaten nennen nur Schritt und Ausgangscode. Beide Ursachen
ließen sich aber in sauberen Umgebungen vollständig nachstellen.

### Rust

Ein aus `git archive HEAD` erzeugter Baum brach vor dem ersten Prüffall ab:

1. Tauri verlangte `binaries/takt-local-api-x86_64-unknown-linux-gnu`;
2. nach dessen reinem Testplatzhalter verlangte es außerdem einen Treffer für
   `taskpane/**/*`.

Diese Dateien sind mit Absicht nicht versioniert. Auf dem Entwicklungsrechner hatte
`verify:bundle` sie schon erzeugt und den Fehler dadurch verdeckt. Der Prüfworkflow legt
nun für die reine Übersetzung leere, nie ausgeführte Platzhalter für Sidecar,
Aufgabenbereich und Lizenzbeilage an. Das Ziel-Tripel kommt wie beim echten Bau von
`rustc -vV`; nur Windows erhält `.exe`. Derselbe Schritt steht auch im Release-Workflow,
der sonst beim nächsten sauberen Auslieferungsbau an derselben Stelle abgebrochen wäre.
Der anschließende echte Bau ersetzt alle drei Ergebnisse.

Mit diesen Platzhaltern: sauberer Archivbaum, `cargo test --lib --locked`, **62/62**.

Der erste GitHub-Wiederholungslauf bestätigte das auf Ubuntu, legte aber einen zweiten,
zuvor von den fehlenden Bündeldateien verdeckten Fehler frei: Mehrere Rust-Prüffälle
behaupteten, plattformneutral zu sein, verwendeten jedoch literale Pfade wie `/tmp/...`,
`/pfad/...` oder erwarteten ausdrücklich die Linux-Deutung von `C:\\...`. Unter Windows
endete die Prüffolge deshalb früher beziehungsweise später mit einem anderen, dort
richtigen Ablehnungsgrund.

Die plattformneutralen Fälle erzeugen ihre absoluten, garantiert fehlenden Pfade nun im
jeweiligen System-Temp-Verzeichnis. Die Belege, die laut A-A-28 absichtlich echte
Doppelpunkte in Linux-Dateinamen messen, tragen `#[cfg(not(windows))]`. Der Windows-Block
hat dafür zwei zusätzliche Betriebssystembelege: Ein echtes Temp-Dokument zeigt, dass der
Laufwerksdoppelpunkt nicht zum Dateinamen zählt; eine reale `x.lnk` zeigt, dass
`x.lnk::$DATA` auf ihren unbenannten NTFS-Datenstrom auflöst und trotzdem vor der
Endungsprüfung mit `PathStreamSeparator` abgewiesen wird. Damit nennen und messen die nun
fünf Windows-Fälle tatsächlich Punkt, Leerzeichen und Doppelpunkt aus A-A-32.

Die Cargo-Schritte veröffentlichen bei einem Fehlschlag außerdem die letzten hundert
Testzeilen als Check-Anmerkung. So bleibt der konkrete Fehler auch ohne angemeldeten
Zugriff auf das Actions-Protokoll sichtbar; der ursprüngliche Cargo-Ausgangscode wird
dabei unverändert weitergereicht.

### Engine-Vergleich

In einem frischen `ubuntu:24.04` mit den bisherigen Workflow-Paketen trat nach rund
30 Sekunden auf:

```text
TypeError: Couldn't find foreign struct converter for 'cairo.Surface'
WebKitGTK: Zeitueberschreitung
```

`python3-gi` und WebKitGTK waren vorhanden, aber nicht die PyGObject-Cairo-Brücke
`python3-gi-cairo`. Die bisherige Verfügbarkeitsprobe prüfte diese Brücke nicht und ließ
den Lauf deshalb bis zum Schnappschuss gehen.

Jetzt ist `python3-gi-cairo` die fünfte ausdrückliche Voraussetzung. Der Workflow
installiert sie, und der Lauf prüft mit `gi.require_foreign("cairo")` genau die später
benötigte Umwandlung. Ohne Paket wird der Teilübersprung sofort mit Code 1 und dem
Paketnamen gemeldet; mit Paket liefert derselbe frische Ubuntu-24.04-Container
**23/23**, beide Engines und vier Gegenproben. Der Python-Schießer fängt einen dennoch
auftretenden `TypeError` sofort ab, statt den wirklichen Grund mit der Notbremse zu
überdecken.

## Nachweis

| Lauf | Ergebnis |
|---|---|
| sauberer Archivbaum, Rust mit Workflow-Platzhaltern | **62/62**, Code 0 |
| Ubuntu 24.04 ohne `python3-gi-cairo` | Voraussetzung namentlich gemeldet, Code 1 |
| Ubuntu 24.04 mit `python3-gi-cairo` | **23/23**, 2 Engines, Code 0 |
| lokaler `proof:engines --kein-uebersprung` | **23/23**, Code 0 |
| `pnpm check` | **Code 0**, 1464/1464 und 62/62 |
| Rust nach Pfadkorrektur auf Linux | **62/62**, Code 0 |
| Windows-Testquellen, `cargo check --tests --target x86_64-pc-windows-msvc` | Code 0 |

Annahmen: Die von GitHub bereitgestellten x64-Läufer melden ihr tatsächliches Ziel-Tripel
über `rustc`; der Workflow setzt keinen Zielwechsel über `--target`.
Risiken: Die wirkliche Win32-/NTFS-Namensauflösung ist nur auf dem GitHub-Windows-Läufer
ausführbar; die lokale Kreuzübersetzung prüft Typen und bedingte Übersetzung, nicht diese
Betriebssystemwirkung. Genau dafür bleibt der Windows-Auftrag bei jedem Push und jedem
Pull Request Bestandteil des Tores.
Offene Fragen: keine.
