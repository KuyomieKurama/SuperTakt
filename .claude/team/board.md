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

## Läuft — Welle vom 2026-09-03

Ausgangspunkt: T-076 hat die Regel von einer Liste gleichartiger Terme auf eine **Struktur mit
benannten Feldern** umgebaut (E-055, Vorbild Super Productivity): erforderliche Tags mit Modus,
ausgeschlossene Tags, Status, Erledigt, Exportstatus. Alle dreizehn Nachweispfade grün.
`pnpm check` rot an genau einem Punkt — Zweigabdeckung `packages/storage/src` 79,54 gegen 80.

| Nr | Aufgabe | Wer |
|---|---|---|
| ~~T-077~~ | **fertig.** `pnpm check` Exitcode 0. Zweigabdeckung Speicherung 79,55 auf 81,68, Domäne 80,00 auf 85,29 | unit-tester |
| ~~T-078~~ | **fertig.** `poolNamer` behoben, E-056 gebaut, `proof:addin` 100 auf 112 | integration-dev |
| ~~T-079~~ | **fertig.** Regelformular, `PoolFormDialog` 236 auf 604 Zeilen, Kontrast 416 Paare ohne Durchfaller | frontend-dev |

Alle drei fertig, committet als `48c982a`. `pnpm check` grün.

**Dabei gefunden und behoben — dieselbe Lücke wie T-053:** `pnpm check` lief nur **vier der
dreizehn** Nachweispfade. Die anderen neun waren nur im Unterpaket erreichbar und hingen in keiner
Kette. Alle dreizehn hängen jetzt an `proof:all`, dazu `verify:bundle`: 770 Prüfungen in 37
Sekunden, ganzer Durchlauf 71.

### Welle vom 2026-09-03, zweite Runde

| Nr | Aufgabe | Wer |
|---|---|---|
| T-080 | `poolRuleIsEmpty` in die Domäne — die Oberfläche baut die Bedingung aus `matchesPool` nach (**achte Doppelung derselben Fachregel**). Dazu aufgelöste Tagzahl am Pool, `NEVER_SENT` aufräumen | domain-dev |
| ~~T-081~~ | **fertig.** 3 gegenstandslose Fälle gelöscht, 4 neue; dazu 2 Fälle in anderen Dateien repariert, die dieselbe Umstellung gebrochen hatte. **34/34** | e2e-tester |

T-080 wurde mit HTTP 529 abgebrochen und per Nachricht fortgesetzt, nicht neu gestartet.

**Dabei gefunden — wieder ein Nachweis, der nur von Hand lief:** `pnpm test:e2e` benutzte den
Wurzel-`playwright.config.ts` ohne `globalSetup`, startete keine Dienste, und **alle 34 Fälle
scheiterten sofort**. Die echte Konfiguration lag seit T-012 in `tests/e2e/`, mit dem richtigen
Aufruf im Dateikopf dokumentiert — den man kennen musste. Wurzel-Config gelöscht, `test:e2e`
zeigt auf die echte. Gemessen: 34 passed über `pnpm test:e2e`.

Kollisionsfrei: `packages/*/test/**` gegen `routes/addin/**` gegen `apps/web/**`.
End-to-End erst danach — `tests/e2e/kanban.spec.ts` prüft noch das Ziehen, das E-054 abgeschafft
hat.

## Offen — Restpunkte, keine Blocker

| Nr | Punkt | Wer |
|---|---|---|
| O-A | Kanban-Spalten lassen sich nicht umbenennen — es gibt keine Bedienmöglichkeit dafür (T-052) | frontend-dev |
| O-B | `PoolWrite` kennt kein `position`; jeder neue Pool entsteht auf 0. Fachliche Frage: sollen Pools sortierbar sein? | Auftraggeber |
| O-C | `GET /settings` belegt keine Merkmale zum Datenbankpfad, anders als beim Exportordner | domain-dev |
| O-D | `Pool.rule` heißt weiter `rule`, enthält aber nur noch die erforderlichen Tags. Umbenennen berührt drei Hoheiten — eigene Aufgabe | Orchestrator |
| O-F | **Nachlauf offen:** `proof:access`, `export-api`, `addin-wiring`, `tags`, `conflicts` konnten in T-078 nicht laufen — Port 17843 war von der Arbeitsumgebung der parallelen Aufgabe belegt. Der Agent hat nicht abgeschossen, was ihm nicht gehört. Eine Minute Nachlauf, sobald der Port frei ist | Orchestrator |
| O-G | Der Poolsatz erscheint nur im Wiederöffnen-Fall. Für ein **offenes** Todo liefert der Dienst `poolNames`, die niemand liest. Der Agent hielt das für vollständig gedeckt, weil nur dort etwas *verschwinden* kann — aber **erscheinen** kann auch ohne Wiederöffnen: Die erste Buchung auf einem Todo ohne Buchung setzt `hasOpenEntries` von falsch auf wahr, und eine Spalte `exportState: 'open'` nimmt es damit auf. `bookingStates` rechnet das bereits richtig; nur die Anzeige fehlt | frontend-dev |
| O-H | `forbidOnly: CI` stand nur in der gelöschten Wurzel-Config. In `tests/e2e/playwright.config.ts` nachtragen — ein vergessenes `test.only` soll im Bauserver rot sein, nicht still 33 Fälle überspringen | e2e-tester |
| O-E | Soll das **Ziehen für reine Status-Spalten** zurückkommen? Der Status ist eine Eigenschaft, kein Tag; das wäre umkehrbar, ohne E-054 zu verletzen | Auftraggeber |
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
