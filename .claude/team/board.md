# Aufgabenboard — Takt

Stand: 2026-09-01, Abschluss des Durchlaufs. 55 Aufgaben, 55 Berichte.

Nachtrag T-053 bis T-055: Takt startete nicht — der gebündelte Sidecar starb beim Start, weil im
Bündel weder Quelltextort noch Migrationsverzeichnis existieren. Elf Nachweispfade waren grün,
weil **jeder von ihnen aus dem Quelltext lief**. Behoben; der Sidecar-Nachweis wuchs von 12 auf
20 Prüfungen, läuft jetzt in `pnpm desktop` mit, und die Warnung, die den Fehler die ganze Zeit
angesagt hatte, bricht den Bau. Für Oberfläche und Add-in wurde gemessen, dass dieselbe Lücke
dort **nicht** klafft — mit Gegenproben. Und das Bündel des Add-in-Aufgabenbereichs wird jetzt
überhaupt erst ausgeliefert.

---

## Fertig

Alle Aufgaben von T-001 bis T-052. Berichte unter `.claude/team/reports/`.

| Bereich | Ergebnis |
|---|---|
| Domäne und Speicherung | 17 Tabellen, 7 Migrationen vorwärts und rückwärts geprüft, Abdeckung 100 Prozent |
| Lokaler Dienst | 64 Operationen hinter Nachweisprüfung, Export transaktional und gemessen |
| Oberfläche | 14 Screens gegen den echten Dienst, 332 Kontrastpaare ohne Durchfaller |
| Tauri-Hülle | `.deb` und `.AppImage`, 22 Rust-Tests, Sidecar mit Lebenszyklus |
| Outlook-Add-in | 86 Prüfungen, konfigurierbarer regulärer Ausdruck, Duplikatangebot |
| Exportmotor | Vorlagen mit geschlossener Quellenliste, ein Renderer für Vorschau und Datei |
| Tests | 556 Unit- und Integrationsfälle, 28 End-to-End-Fälle, 11 Nachweispfade |
| Dokumentation | Benutzer- und Entwicklerhandbuch, Glossar, README |
| Prüfberichte | Bedrohungsmodell (52 Bedrohungen), Testplan (125 Fälle), Zustandsmatrix (14 Screens) |

Urteile: Spezifikations- und UX-Abgleich **freigegeben** (T-042). Sicherheitsprüfung und
Code-Review haben je vier blockierende Befunde gemeldet, alle behoben.

## Offen — Restpunkte, keine Blocker

| Nr | Punkt | Wer |
|---|---|---|
| O-A | Kanban-Spalten lassen sich nicht umbenennen — es gibt keine Bedienmöglichkeit dafür (T-052) | frontend-dev |
| O-B | `PoolWrite` kennt kein `position`; jeder neue Pool entsteht auf 0. Fachliche Frage: sollen Pools sortierbar sein? | Auftraggeber |
| O-C | `GET /settings` belegt keine Merkmale zum Datenbankpfad, anders als beim Exportordner | domain-dev |
| O-D | Die Aufruferseite des Add-ins ist von `proof:callers` nicht erfasst | domain-dev |
| O-G | Die Quellkarten des Add-ins gehen in die Auslieferung mit (1,1 MiB, über HTTPS abrufbar). Nichts wurde stillschweigend gefiltert — die Frage gehört entschieden. | Auftraggeber |
| O-H | `pnpm desktop` braucht jetzt beide Ports frei (17843 und 17844). Verhaltensänderung durch den mitlaufenden Nachweis; die Kette bleibt sauber stehen und nennt den Grund. | — |
| O-E | Neun End-to-End-Fälle nicht gelaufen: Add-in (kein Office.js-Wirt), drei Hüllenzustände (kein echter Tauri-Prozess), Stichprobe über die 19 Orte mit Exportstatus, Standard-Tags über die Oberfläche | e2e-tester |
| O-F | 14 Befunde aus T-025 unverändert offen, geordnet nach Gewicht ab C-12 | spec-ux-reviewer |

## Blockiert — braucht eine Umgebung, die hier nicht steht

| ID | Aufgabe | Blockiert durch |
|---|---|---|
| T-B02 | Add-in gegen die Referenzbilder | Referenzbilder liegen nicht vor |
| T-B05 | Windows-Prüfliste, jetzt sieben Punkte | Kein Windows-Rechner. Wichtigster Punkt: Takt mit gesetzter Umgebungsvariable starten und prüfen, dass trotzdem der richtige Name im Export landet (B-8.1, E-042). **Neu:** Nach der Installation muss `…\Takt\taskpane\index.html` existieren — dass NSIS Ressourcen nach `$INSTDIR` legt, ist die unbewiesene Annahme, auf der die Auslieferung des Add-ins steht. |
| T-B08 | Die `.AppImage` mit Playwright fahren | Playwright hat auf Linux keinen Anknüpfungspunkt für Tauris Webview — belegt über die Bibliotheksabhängigkeiten und das Fehlen jeder Tauri-Unterstützung in der Schnittstelle, anders als bei Electron. Keine Auslassung, eine Grenze. |
| T-B06 | 42Crunch-Audit und -Scan | `42c-ast` nicht installiert, keine Zugangsberechtigung. **Es gibt keinen Auditwert.** |
| T-B07 | `cargo audit` über den Rust-Baum | Nicht installiert. Der Rust-Anteil ist nie auf Abhängigkeiten geprüft worden. |

## Offene Fragen an den Auftraggeber

| Nr | Frage |
|---|---|
| F-14 | `WindowsUser` im Export — nackter Name oder `DOMAIN\benutzer`? Die Hülle liefert beides, die Stelle ist beschriftet. |
| F-15 | Was steht hinter „Wenden Sie sich an Ihre Systembetreuung"? Der Satz steht an vier Stellen. Arbeitest du allein mit Takt, ist er eine Sackgasse. |
| F-17 | Sollen Pools sortierbar sein (siehe O-B)? |
