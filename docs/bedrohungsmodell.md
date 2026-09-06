# Bedrohungsmodell — Takt

Stand: **2026-09-05, Aufgabe T-156** — Wiedervorlage der vierundzwanzig Auflagen aus Abschnitt 20
gegen den gebauten Code für Frist und Anhänge (Abschnitt **21**), mit acht eigenen Messungen, den
zwei Zeilen zu `sqlite`/`code` und dem Riegel im Protokollierer (O-BD) und der Prüfung der einen
Verbindung nach außen (R-19, O-CI, E-077).
Vorstand: 2026-09-05, Aufgabe T-145 — Wiedervorlage der zwanzig Auflagen aus 18.9 gegen den
ausgelieferten Code (Abschnitt **19**) und Vorabbewertung der Grenze VG-11 für Frist und Anhänge,
bevor sie gebaut wird (Abschnitt **20**).
Davor: 2026-09-04, Aufgabe T-136 — Vorabbewertung des Ausgangs ins Netz (Abschnitt 18).
Davor: 2026-09-04, Aufgaben T-112 und T-125 (Abschnitte 16 und 17).
Davor: 2026-09-03, Aufgabe R-3 — Nachprüfung des Branches `status-als-regelterm`.
Vorstand: 2026-09-02, Aufgabe T-067 — Prüfung vor der Veröffentlichung.
Davor: 2026-09-01, Aufgabe T-023, Welle 8 — Gegenprobe gegen den fertigen Code.
Erstfassung: 2026-08-31, Aufgabe T-003, Welle 1. Verantwortlich: security-checker.

Was T-156 geändert hat: der neue **Abschnitt 21** (die vierundzwanzig Auflagen A-A-1 bis A-A-24
gegen den gebauten Code, Auflage für Auflage, mit acht eigenen Messungen), die berichtigten
Fassungen **A-A-5′**, **A-A-15′**, **A-A-20′** und die neuen **A-A-25** bis **A-A-27**, die zwei
Zeilen aus T-132 in 21.5 (samt Berichtigung einer eigenen Zahl aus T-145: 576 statt 336) und die
Prüfung von R-19 bei dieser Freigabe in 21.6. Am Katalog B-1.1 bis B-19.x ist nichts umnummeriert
und nichts umgeschrieben. **Drei Befunde der Stufe „muss"** (T-156-1, T-156-2, T-156-3); Urteil:
**Nacharbeit**.

Was T-145 geändert hat: die neue Grenze **VG-11** in der Tabelle in Abschnitt 3, der neue
**Abschnitt 19** (die zwanzig Auflagen aus 18.9, Auflage für Auflage gegen den Code gemessen,
mit sieben eigenen Messungen und den berichtigten Fassungen A-V-1′, A-V-4′, A-V-6′, A-V-12′,
A-V-14′ sowie den neuen A-V-21 bis A-V-23) und der neue **Abschnitt 20** (Frist und Anhänge,
bewertet **bevor** sie gebaut werden, mit vierundzwanzig Auflagen A-A-1 bis A-A-24). Am Katalog
B-1.1 bis B-12.x ist nichts umnummeriert; die neuen Bedrohungen heißen B-19.1 bis B-19.6.
Zwei Befunde der Stufe „muss" gegen den ausgelieferten Stand (T-145-1, T-145-2) und zwei gegen
den Entwurf der Anhänge (T-145-7, T-145-8).

Was R-3 geändert hat: der neue **Abschnitt 14**. Er schreibt **VG-2** (was das Add-in seit
T-076/T-084/T-086 zusätzlich bekommt), **B-1.7** (zwei gemessene Zahlen) und **B-11.4** samt
Abschnitt 13 fort (der Baum, der veröffentlicht würde, trägt jetzt 186 MB Bauergebnisse). Am
Katalog B-1.1 bis B-12.x ist nichts umnummeriert und nichts umgeschrieben; das Urteil in
Abschnitt 11 bleibt stehen.

Was T-067 geändert hat: Abschnitt 0 um den Werkzeugstand vom 2026-09-02, die neuen Bedrohungen
**B-11.4** (der erste Commit ist die Veröffentlichung) und **B-11.5** (Lizenz und fremdes
Urheberrecht), der neue **Abschnitt 13** mit der Prüfung des Baums, der veröffentlicht würde,
und das Urteil in Abschnitt 11. Nachgezogen am Nachmittag des 2026-09-02: V-4/S-04 ist behoben
(T-066), an fünf Stellen vermerkt, und die Zählung offener Punkte in 13.6 ist korrigiert —
sie war zu kurz, und zwar aus einem anderen Grund als dem behobenen Befund.

**Wichtig für den Leser dieses Dokuments:** Die vier in T-023 als blockierend geführten Befunde
sind behoben, ebenso S-04 und S-05; Abschnitt 13.6 hält je Befund fest, wo im Code das steht,
und zählt am Schluss ausdrücklich auf, welche **zwei** Punkte offen sind. Wer dieses Dokument
als Landkarte offener Lücken liest, liest es falsch: Der weitaus größte Teil beschreibt
geschlossene Türen und wie sie geschlossen wurden.

Was T-023 geändert hat: Abschnitt 0 (Werkzeugstand), eine neue Bedrohung **B-2.10**,
Prüfung 24 in Abschnitt 7, der neue **Abschnitt 12** mit der Gegenprobe je Bedrohung und
das Urteil in Abschnitt 11. Alles andere steht unverändert, damit der Entwurfsstand von
T-003 nachlesbar bleibt.

*Rahmen von T-003, unverändert stehengelassen:* Dies war ein **Entwurfs-Bedrohungsmodell**. Es
gab noch keinen Produktivcode. Bewertet wurde die Architektur aus `docs/spec.md`, `CLAUDE.md`
und `.claude/team/decisions.md` (E-001 bis E-014). **Seit T-023 gibt es acht Pakete, rund
40 000 Zeilen Code und einen laufenden Dienst; Abschnitt 12 hält fest, was davon im Code
tatsächlich steht.**
Jede Bedrohung nennt Auswirkung, ein Gegenmittel, das ein Programmierer umsetzen kann, die
zuständige Rolle und die Prüfung, die das Gegenmittel nachweist.

Das Dokument wird gepflegt: Es wird nach T-008 (Gerüst steht, Abhängigkeiten sind installiert),
nach T-011 (Token-Verfahren) und nach T-007 (Exportvorlagen) erneut durchgegangen.

Rahmen: `ecc:security-review` (Geheimnisse, Eingabevalidierung, Injektion, Authentisierung und
Autorisierung, XSS, CSRF, Ratenbegrenzung, Datenabfluss, Lieferkette) plus die architekturnahen
Themen, die dieser Katalog nicht abdeckt: Loopback-Dienst, DNS-Rebinding, Dateirechte, ReDoS,
Abrechnungsintegrität.

---

## 0. Stand der Werkzeuge — was tatsächlich gelaufen ist

Fortgeschrieben in **T-023** (2026-09-01, Welle 8). Die Tabelle aus T-003 steht darunter, damit
der Unterschied sichtbar bleibt. Damit niemand ein Prüfergebnis annimmt, das es nicht gibt:

### Stand T-156 (2026-09-05) — Frist und Anhänge, gegen den gebauten Code

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI, lokal, `p/nodejsscan p/typescript p/javascript` | **ja** | 188 Regeln, 288 Ziele, **24 Befunde**, sämtlich in bekannten Falschmeldungsklassen: `react-insecure-request` auf `http://127.0.0.1:17843` (das **ist** die Architektur, E-001), `node_secret` auf `redactSecrets` selbst, `node_timing_attack` auf Vergleichen ohne Geheimnis, `regex_dos` auf festen Ausdrücken aus dem eigenen Baum, `node_insecure_random_generator` und `node_username` in Nachweis- und Musterflächen. **Kein Befund hoher Schwere, und kein einziger im neuen Code für Frist und Anhänge.** |
| Semgrep Guardian | **nein** | `Not logged into Semgrep Guardian.` **Zehntes** Mal. |
| **42Crunch-Audit / -Scan** | **nein** | Kein `42c-ci-cli`, kein `~/.42crunch`, keine Berechtigung. **Neuntes** Mal. Ersatz bleibt `proof:openapi` (110/0). **Es existiert weiterhin kein Auditwert.** |
| `cargo test --lib` | **ja** | **31/0 — unverändert gegenüber T-145.** Kein Prüffall in `attachment.rs` (Befund T-156-2). |
| `pnpm test` (Vitest) | **ja** | 69 Dateien, **1 359/0**. |
| Dreizehn Nachweisläufe einzeln | **teils** | Acht grün; fünf (`conflicts`, `tags`, `access`, `export-api`, `addin-wiring`) **nicht gemessen**, weil `127.0.0.1:17843` belegt war. |
| `ss -tnp` alle 0,2 s während `proof:all`, elf Einzelläufen und `pnpm test` | **ja** | **Null** Verbindungen außerhalb `127.0.0.1`. A-V-22 gehalten, T-145-1 behoben. |
| Eigene Messungen gegen den geschnittenen Prüfteil von `attachment.rs` und gegen den Bildspeicher | **ja** | Acht, in 21.3. Sie stehen in keinem Ablauf. |
| Repository-Hygiene über 154 geänderte Dateien | **ja** | Sauber. Keine Zugangsdaten, kein Schlüsselmaterial, keine echten Call-Nummern (`TCK-000042`, `TCK-000815`, `TCK-000517/518` — erfunden), keine echten Adressen (`example.org`, `.example`, `.invalid` sind reserviert). `/Export/` ist ignoriert, die dort liegende Datei trägt `0600`. |

**Folge für die Definition of Done:** „Semgrep ohne offene Befunde hoher Schwere" ist **erfüllt**.
„42Crunch-Audit über der Schwelle" ist **unverändert nicht erfüllbar**, seit neun Aufgaben, aus
demselben Grund.

### Stand T-067 (2026-09-02) — der Baum, der veröffentlicht würde

Diese Zeile ist neu und sie ist die wichtigste: Bis zu diesem Tag ist **nie committet** worden.
Der erste Commit ist zugleich die Veröffentlichung. Geprüft wurde deshalb nicht „der Code",
sondern die **473 Dateien, die `git status --porcelain -uall` nach der Ergänzung der
`.gitignore` auflistet**.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI, lokal, `p/secrets p/security-audit p/typescript p/owasp-top-ten` | **ja** | 12 442 Ziele, **4 Befunde**, **kein einziger von hoher Schwere**, alle vier in einem Nachweisskript und nach Prüfung unecht (13.1). Aus `p/secrets` **null** Treffer. |
| Semgrep Guardian, SAST / Geheimnisse / Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Unverändert seit T-003 und T-023. Erneut versucht, erneut abgewiesen. Offene Frage 8 bleibt offen. |
| `gitleaks` / `trufflehog` | **nein** | Weiterhin nicht auf dem Rechner. Ersetzt durch Mustersuchen von Hand über alle 473 Dateien (13.2). |
| **42Crunch-Audit** | **nein** | `42c-ast` **nicht installiert**, `~/.42crunch` existiert nicht, keine Zugangsberechtigung. Unverändert gegenüber T-023. **Es existiert weiterhin kein Auditwert.** Die OpenAPI-Beschreibung liegt inzwischen vor (188 KB, 44 Pfade) — das Hindernis ist ausschließlich das Werkzeug. |
| 42Crunch-Scan | **nein** | Setzt den Audit voraus. |
| Entpacken und Durchsehen der vier Playwright-Berichte | **ja** | Die eingebetteten ZIP-Anhänge ausgepackt und gelesen (13.3). |
| Lizenzabgleich über den aufgelösten pnpm-Speicher | **ja** | 210 Pakete, **keine Copyleft-Lizenz**, keine Lizenzangabe fehlt (13.5). |
| Suche nach fremden Urheberrechtshinweisen im gesamten Baum | **ja** | **Ein** Hinweis im ganzen Repository, der eigene (13.5). |

**Folge für die Definition of Done:** „Semgrep ohne offene Befunde hoher Schwere" ist **erfüllt**.
„42Crunch-Audit über der Schwelle" ist **unverändert nicht erfüllbar** — das ist eine
Beschaffungsentscheidung und keine technische.

### Stand T-023 (2026-09-01) — acht Pakete, rund 40 000 Zeilen, laufender Dienst

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI, lokal, `p/default p/secrets p/typescript p/javascript p/nodejs p/sql-injection p/xss p/command-injection p/rust` | **ja** | 321 Ziele, 278 Regeln, **15 Befunde**, davon **kein echter** von hoher Schwere. Aufschlüsselung in Abschnitt 12.1. |
| Semgrep CLI über die Testverzeichnisse (die die Vorgabe-`.semgrepignore` auslässt) | **ja** | 42 Dateien, **0 Befunde**. |
| Semgrep Guardian, SAST / Geheimnisse / Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Unverändert seit T-003. Es liegt kein Plattformbefund vor, weder positiv noch negativ. Offene Frage 8 aus Abschnitt 10 ist weiterhin offen. |
| `pnpm audit` | **ja** | 182 Abhängigkeiten, **0 Verwundbarkeiten** in allen Schweregraden. |
| `cargo audit` / `cargo deny` | **nein** | Beide **nicht installiert**. Der Rust-Baum (tauri 2, `tauri-plugin-shell`, `tauri-plugin-single-instance`, `getrandom`, `libc`, `serde`) ist **nie** gegen eine Schwachstellendatenbank geprüft worden. B-10.4 Punkt 2 ist damit offen — siehe Befund S-07. |
| **42Crunch-Audit** | **nein** | Das Programm `42c-ast` ist **nicht installiert** (`~/.42crunch` existiert nicht), und es liegt **keine Zugangsberechtigung** vor. Die Einrichtung verlangt einen Download und ein Konto bei 42Crunch. **Es existiert kein Auditwert.** Das Tor aus Abschnitt 8 für T-011 ist mit den vorhandenen Mitteln **nicht einlösbar** — Entscheidung des Orchestrators nötig (Zugang beschaffen oder das Tor streichen und ersetzen). |
| **42Crunch-Scan** | **nein** | Hängt am selben Programm und derselben Berechtigung wie der Audit. |
| Ersatzprüfung der OpenAPI-Beschreibung von Hand (nicht 42Crunch) | ja | 3060 Zeilen, gültiges YAML, OpenAPI 3.1.0, 63 Operationen. Ergebnis in Abschnitt 12.4. **Dies ist ausdrücklich kein 42Crunch-Ergebnis und darf nicht als solches geführt werden.** |
| `gitleaks` / `trufflehog` | **nein** | Beide weiterhin nicht auf dem Rechner. Ersetzt durch Mustersuchen von Hand über alle 357 Dateien, die ein `git add -A` aufnähme (Abschnitt 12.5). |
| Angriffsreihe gegen den **laufenden** Dienst auf `127.0.0.1:17843` | **ja** | 21 Proben gegen Nachweis, `Host`-Positivliste, Herkunft, CSRF, Abrufkontext, Token in der Adresse. Alle wie entworfen abgewiesen (Abschnitt 12.2). |
| Eigene Angriffe auf die Notiz-Grenze durch den vollständigen HTTP-Stapel | **ja** | Vier Wege, alle gehalten (Abschnitt 12.3). |
| Prüfpfade des Projekts selbst | **ja** | 33 Vitest-Dateien mit **545** Prüfungen und fünf Nachweisskripte mit **269** Prüfungen (75 + 73 + 66 + 30 + 25), sämtlich grün. |

**Folge für die Definition of Done:** „Semgrep ohne offene Befunde hoher Schwere" ist **erfüllt**.
„42Crunch-Audit über der Schwelle des Sicherheitsgates" ist **nicht erfüllt und derzeit nicht
erfüllbar** — nicht wegen eines Mangels an der Beschreibung, sondern weil das Werkzeug nicht
betriebsbereit ist.

### Stand T-003 (2026-08-31) — nur Markdown, kein Code

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI, lokal, `p/default` + `p/secrets` | ja | 18 Dateien, 53 anwendbare Regeln, **0 Befunde**, 0 Fehler. Der Baum enthält nur Markdown und eine JSON-Datei; die Aussagekraft ist entsprechend gering. |
| Semgrep Guardian, SAST-Befunde | **nein** | `Not logged into Semgrep Guardian.` Keine Plattformbefunde abrufbar. Es liegt kein Ergebnis vor, weder positiv noch negativ. |
| Semgrep Guardian, Geheimnis-Befunde | **nein** | dito. |
| Semgrep Guardian, Lieferketten-Befunde | **nein** | dito. Zusätzlich gegenstandslos: Es gibt keine `pnpm-lock.yaml`, keine `Cargo.lock`, kein `node_modules`. |
| 42Crunch-Audit | **nein** | Es existiert keine OpenAPI-Beschreibung. Der Audit ist erst nach T-008/T-011 durchführbar. |
| 42Crunch-Scan | **nein** | Der lokale Dienst existiert nicht und läuft nicht. |
| Manuelle Baumprüfung (Geheimnismuster, Call-Nummern, E-Mail-Adressen) | ja | Siehe B-11.1 bis B-11.3. |

---

## 1. Werte

Was in diesem Produkt schützenswert ist, nach Schutzziel geordnet.

| ID | Wert | Vertraulichkeit | Integrität | Verfügbarkeit |
|---|---|---|---|---|
| W-01 | Buchungsnotizen (A-7.3) — beschreiben Kundenarbeit im Klartext, gehen in die Abrechnung | hoch | hoch | mittel |
| W-02 | Todo-Notizen (A-7.1, A-7.2) — persönlich, ausdrücklich **nicht** für die Abrechnung bestimmt | hoch | mittel | niedrig |
| W-03 | Call-Nummern (A-2.6) — identifizieren Kundenvorgänge | mittel | hoch | mittel |
| W-04 | Zeitbuchungen und Exportstatus (A-6.4 bis A-6.7) — sind Geld | mittel | **sehr hoch** | mittel |
| W-05 | Die SQLite-Datei als Ganzes — enthält W-01 bis W-04 und die Tag-Struktur, in der Kundennamen als Tags stehen (A-4.5) | hoch | hoch | hoch |
| W-06 | Das Add-in-Token (E-009) — der gesamte Zugriffsschutz des lokalen Dienstes | **sehr hoch** | hoch | mittel |
| W-07 | Exportdateien (A-8.1, A-8.9) — W-01 und W-03 außerhalb der Anwendung, Base64 ist kein Schutz | hoch | hoch | niedrig |
| W-08 | Exportvorlagen (A-8.7) — bestimmen, welche Daten die Anwendung verlassen | mittel | hoch | niedrig |
| W-09 | Einstellungen des Add-ins, besonders der reguläre Ausdruck (A-10.8) | niedrig | hoch | mittel |
| W-10 | Der Ruf der Abrechnung — eine Doppelabrechnung ist ein Schaden beim Kunden des Auftraggebers, nicht nur ein Datenfehler | — | **sehr hoch** | — |
| W-11 | Der Rechner des Benutzers — Takt darf kein Einstiegspunkt für lokale Rechteausweitung werden | — | hoch | hoch |

Nicht Wert dieses Modells: Verfügbarkeit gegen einen Angreifer, der bereits Administrator auf dem
Rechner ist. Siehe Abschnitt 9, Grundannahmen.

---

## 2. Architektur in der für Sicherheit nötigen Auflösung

```
   ┌──────────────────────── Rechner des Benutzers ───────────────────────┐
   │                                                                       │
   │  Tauri-Hülle (Rust)          ──VG-9──▶  Webview (React/Vite)          │
   │   Fenster, Menü,                          Oberfläche S-01..S-11, S-14 │
   │   Lebenszyklus Sidecar,                        │                      │
   │   Windows-Benutzername                         │ HTTP                 │
   │        │ startet                               ▼                      │
   │        └──────────────▶  apps/local-api (Node-Sidecar)  ◀──VG-1──     │
   │                            127.0.0.1:PORT                    ▲        │
   │                                 │                            │        │
   │                     packages/domain, packages/export         │        │
   │                                 │                            │        │
   │                            ─VG-3─▼                           │        │
   │                    %LOCALAPPDATA%\Takt\                      │        │
   │                      takt.sqlite (+ -wal, -shm)              │        │
   │                      token / config                          │        │
   │                                 │                            │        │
   │                            ─VG-4─▼                           │        │
   │                    Exportordner (E-011) → *.json             │        │
   │                                                              │        │
   │  Outlook  ──VG-8──  Add-in (Office.js, Webview) ─────────────┘        │
   │             ▲                                            VG-2         │
   └─────────────┼─────────────────────────────────────────────────────────┘
                 │
        E-Mail eines beliebigen Absenders — nicht vertrauenswürdige Eingabe

   Ebenfalls auf demselben Rechner und ebenfalls an VG-1:
   der Browser des Benutzers mit einer beliebigen Webseite,
   jedes andere Programm im selben Benutzerkonto,
   Sicherungs-, Synchronisierungs- und Virenschutzagenten (an VG-3 und VG-4).
```

---

## 3. Vertrauensgrenzen

| ID | Grenze | Warum sie eine ist |
|---|---|---|
| VG-1 | Beliebiger lokaler Prozess → lokaler Dienst auf `127.0.0.1` | `127.0.0.1` grenzt nur den Rechner ab, nicht den Prozess. Jedes Programm im Benutzerkonto und **jede Webseite im Browser des Benutzers** kann den Dienst ansprechen. Das ist die wahrscheinlichste echte Lücke dieser Architektur (R-02). |
| VG-2 | Outlook-Add-in → lokaler Dienst | Das Add-in läuft in einem von Microsoft gehosteten Webview mit fremder Herkunft. Es weist sich mit dem Token aus (E-009). Alles, was das Add-in kann, kann ein Angreifer mit dem Token auch. |
| VG-3 | Betriebssystem und andere Benutzer → Anwendungsdatenverzeichnis | Die SQLite-Datei und das Token liegen im Dateisystem. Die Grenze wird von Dateirechten getragen, nicht von der Anwendung. Sicherungs- und Synchronisierungsagenten überschreiten sie planmäßig. |
| VG-4 | Anwendung → Exportdatei | Ab hier kontrolliert Takt nichts mehr. Base64 ist keine Verschlüsselung (A-8.9). |
| VG-5 | Todo-Notiz → Export | Eine **Datenklassifikationsgrenze innerhalb** der Anwendung. A-7.2 gegen A-7.4. Sie verläuft mitten durch `packages/export` und wird nur von Code gehalten (R-06). |
| VG-6 | Benutzerkonfiguration → Programmverhalten | Regulärer Ausdruck (A-10.8), Exportvorlage (A-8.7), Exportordner (E-011). Konfiguration, die Verhalten steuert, ist Eingabe und wird wie Eingabe geprüft. |
| VG-7 | Lieferkette → ausgeliefertes Binärprogramm | npm-Pakete, crates, Tauri-Vorlagen, vorgebaute native Module, die Sidecar-Bündelung. |
| VG-8 | E-Mail → Add-in | Der Absender einer E-Mail kontrolliert Betreff und Inhalt vollständig. Diese Zeichenkette wird vom regulären Ausdruck verarbeitet und landet über `callNumber` in der Abrechnung. |
| VG-9 | Webview → Rust-Kern | Tauri-Befehle und -Fähigkeiten. Ein XSS im Webview ist hier deutlich schwerer als im Web, weil dahinter Dateisystem und Prozessstart liegen. |
| VG-10 | Lokaler Dienst → GitHub (Versionsprüfung) | **Neu am 2026-09-04 (A-18.*, E-064, R-19).** Die erste und einzige Grenze, an der Takt den Rechner verlässt. Sie trägt in **zwei** Richtungen: hinaus geht ein Lebenszeichen (Quelladresse, Zeitpunkt, SNI `api.github.com`), herein kommt eine Antwort beliebiger Größe und Gestalt, aus der Text in die Oberfläche und — wenn man es zulässt — eine Adresse in den Browser des Benutzers wandern kann. Bewertet in Abschnitt 18, **bevor** sie gebaut wird. |
| VG-11 | Anhang im Bestand → Öffnen-Befehl der Hülle | **Neu am 2026-09-05 (A-19.8 bis A-19.19, E-071, E-072, R-21, R-22).** Die schwerere Schwester von VG-10. Dort war die Zeichenkette eine Fassungsbezeichnung aus einer bekannten Quelle; hier ist sie eine **Adresse oder ein Pfad aus dem Bestand**, und „öffnen" heißt beim Typ Datei: die Standardanwendung starten. Wer in den Bestand schreiben kann (VG-1, VG-3), schreibt damit einen Öffnen-Befehl auf den Rechner des Benutzers. Bewertet in Abschnitt **20**, bevor sie gebaut wurde; gegen den gebauten Code gemessen in Abschnitt **21**. |

---

## 4. Akteure

| ID | Akteur | Fähigkeiten | Motiv |
|---|---|---|---|
| A-01 | Der Benutzer selbst | Vollzugriff auf seinen Rechner, seine Dateien, seine Datenbank | Normalfall. Als Angreifer nur bei Abrechnungsbetrug relevant (B-09.1). |
| A-02 | **Eine beliebige Webseite im Browser des Benutzers** | Kann `fetch`/`XHR`/Formular an `http://127.0.0.1:PORT` senden, Unterdomänen auf 127.0.0.1 auflösen lassen, WebSockets öffnen. Kann `Origin`, `Host` und `Sec-Fetch-*` **nicht** fälschen. | Datenabfluss, neugierige Werbenetze, gezielter Angriff. **Wahrscheinlichster externer Angreifer.** |
| A-03 | Ein anderer Prozess im selben Benutzerkonto | Beliebige HTTP-Anfragen mit **frei gewählten** Kopfzeilen, Lesen aller Dateien mit Benutzerrechten, Prozessliste und Befehlszeilen einsehen | Schadsoftware, ein anderes Outlook-Add-in, ein neugieriges Werkzeug |
| A-04 | Ein anderer angemeldeter Benutzer auf demselben Rechner (Terminalserver, geteilter PC) | Zugriff auf alles, was nicht durch Dateirechte geschützt ist | Kollege, Neugier, Datenabfluss |
| A-05 | Sicherungs-, Synchronisierungs- und Virenschutzagenten | Lesen und kopieren Dateien, teils in die Cloud | Keins. Unbeabsichtigter Datenabfluss — deshalb gefährlich. |
| A-06 | Der Absender einer E-Mail | Kontrolliert die Zeichenkette, die der reguläre Ausdruck verarbeitet | Störung des Add-ins, falsche Call-Nummern in der Abrechnung |
| A-07 | Ein Paketautor in der Lieferkette | Führt Code beim Installieren und zur Laufzeit aus | Übernommene npm-Konten sind der Regelfall, nicht die Ausnahme |
| A-08 | Wer den Rechner in die Hand bekommt | Offline-Zugriff auf die Datenträgerinhalte | Diebstahl, Reparatur, Ausmusterung |
| A-09 | Das Abrechnungstool als Empfänger | Verarbeitet, was Takt liefert | Kein Angreifer, aber eine Senke: Was Takt falsch exportiert, wird dort zu Geld. |
| A-10 | **Wer die Antwort auf der Strecke zu GitHub bestimmt** | Kontrolliert Rumpf, Kopfzeilen, Statuscode, Weiterleitungsziel, Größe und Dauer der Antwort. Umfasst drei sehr verschiedene Lagen: ein übernommenes GitHub-Konto oder eine böswillige Fassungsbeschreibung im eigenen Bestand; ein TLS-abschließender Unternehmens-Proxy mit eigenem Wurzelzertifikat; ein Angreifer im Netzweg ohne gültiges Zertifikat (kommt nur bis zum TLS-Fehler). **Kann nicht:** die Zieladresse verlegen, solange A-V-1 und A-V-3 gelten. | Den Benutzer auf eine fremde Seite führen, von der er „Takt“ herunterlädt — er ist an dieser Stelle darauf vorbereitet, eine Datei zu holen und auszuführen. Das ist das größte Motiv an dieser Grenze und der Grund für B-18.2. |
| A-11 | GitHub als Beobachter | Sieht Quelladresse, Zeitpunkt und Wiederholung jeder Anfrage sowie den abgefragten Bestand | Kein Angreifer. Eine **Senke** wie A-09: Was Takt mitschickt, ist mitgeteilt und nicht zurückzuholen (A-18.12, 18.6). |

---

## 5. Bedrohungen und Gegenmittel

Schwere: **hoch** = muss vor der ersten benutzbaren Fassung sitzen; **mittel** = vor Abnahme;
**niedrig** = dokumentierte Sorgfalt.

---

### 5.1 Der lokale Dienst auf `127.0.0.1` (E-004, R-02, VG-1)

`127.0.0.1` ist keine Zugriffskontrolle. Es schließt das Netz aus, nicht den Rechner. Alles in
diesem Abschnitt behandelt A-02 und A-03 als gegeben.

#### B-1.1 — Jeder lokale Prozess spricht den Dienst ohne Nachweis an
**Schwere:** hoch. **Betrifft:** W-01 bis W-05. **Akteure:** A-02, A-03. **Bezug:** E-004, E-009, R-02.

**Auswirkung.** Ohne Nachweis liest ein beliebiges Programm sämtliche Todos, Notizen,
Call-Nummern und Buchungen aus, legt Todos an, ändert Buchungen und stößt Exporte an. Der
gesamte Datenbestand ist über eine unauthentisierte HTTP-Schnittstelle abrufbar.

**Gegenmittel.**
1. **Jede** Route außer einem inhaltsleeren `GET /health` verlangt das Token aus E-009. Der
   Nachweis läuft als erste Middleware vor jedem Router, nicht je Route — sonst ist die nächste
   neue Route die vergessene.
2. `GET /health` gibt ausschließlich `{"ok":true}` zurück. Keine Version, kein Pfad, kein
   Benutzername, keine Anzahl offener Buchungen.
3. Bindung fest auf `127.0.0.1` im Code, nicht aus Konfiguration oder Umgebungsvariable
   ableitbar. Kein `0.0.0.0`, kein `::`, kein `localhost` als Bindeadresse (löst je nach System
   auf `::1` **und** `0.0.0.0` auf). In der Produktionsfassung existiert kein Schalter, der das
   ändert.
4. Der Dienst prüft beim Start, dass er tatsächlich nur auf Loopback lauscht, und beendet sich
   sonst mit Fehler statt weiterzulaufen.

**Zuständig:** domain-dev (T-011), Orchestrator (T-008 für die Modulregistrierung).
**Prüfung:** Integrationstest — jede registrierte Route ohne Token ergibt 401; ein Test, der die
Routenliste des Dienstes durchläuft und für jede neue Route 401 erzwingt, damit die Prüfung nicht
nur die heute bekannten Routen abdeckt. Test auf die Bindeadresse über `server.address()`.

#### B-1.2 — Anfragefälschung aus einem fremden Browsertab (CSRF gegen den lokalen Dienst)
**Schwere:** hoch. **Akteure:** A-02. **Bezug:** R-02.

**Auswirkung.** Eine beliebige Webseite sendet `POST http://127.0.0.1:PORT/...` ab. Ohne
Vorabanfrage („preflight") gelingt das für einfache Anfragen: `GET`, `HEAD` und `POST` mit
`Content-Type: text/plain`, `application/x-www-form-urlencoded` oder `multipart/form-data`.
Die Antwort kann die Seite ohne CORS nicht lesen — die **Wirkung** tritt trotzdem ein: Todos
anlegen, Buchungen ändern, Exportstatus zurücksetzen, einen Export in einen von ihr gewählten
Ordner auslösen. Das ist Integritätsschaden an W-04 ohne jeden Lesezugriff.

**Gegenmittel.**
1. **Keine Cookies, keine Sitzung, keine `Authorization`-Basisauthentisierung über den
   Browser-Anmeldedialog.** Der Nachweis läuft ausschließlich über eine eigene Kopfzeile, zum
   Beispiel `X-Takt-Token`. Damit gibt es keine automatisch mitgesendete Berechtigung
   („ambient authority"), und CSRF verliert seine Grundlage.
2. Zustandsändernde Routen akzeptieren **ausschließlich** `Content-Type: application/json` und
   weisen alles andere mit 415 ab, bevor der Rumpf gelesen wird. Zusammen mit der eigenen
   Kopfzeile erzwingt das eine Vorabanfrage, die der Angreifer nicht besteht.
3. Keine zustandsändernde Wirkung über `GET`. `GET` ist lesend, sonst nichts.
4. `Sec-Fetch-Site` auswerten, wo vorhanden: alles außer `none` und `same-origin` wird
   abgewiesen, es sei denn, die Herkunft steht in der Positivliste aus B-1.4.

**Zuständig:** domain-dev (T-011). **Prüfung:** Integrationstests, die eine einfache Anfrage
(`text/plain`, kein Token, fremde `Origin`) gegen jede zustandsändernde Route senden und 401 oder
415 erwarten — **vor** jeder Wirkung in der Datenbank.

#### B-1.3 — DNS-Rebinding
**Schwere:** hoch. **Akteure:** A-02. **Bezug:** R-02.

**Auswirkung.** `evil.example` löst zunächst auf die Adresse des Angreifers auf, nach kurzer
Lebensdauer auf `127.0.0.1`. Der Browser hält die Herkunft weiterhin für `evil.example`, also
gilt der Zugriff als gleichherkünftig: **CORS greift nicht mehr, die Antworten sind lesbar.**
Der gesamte Datenbestand fließt ab. Eine Herkunftsprüfung allein hilft nicht, weil `Origin` in
diesem Fall der Angreiferdomäne entspricht und ohnehin nicht gesendet wird.

**Gegenmittel.**
1. **Positivliste für die `Host`-Kopfzeile.** Der Dienst akzeptiert ausschließlich
   `127.0.0.1:<port>` und `localhost:<port>` — buchstäblich, ohne Platzhalter. Jeder andere Wert,
   auch ein fehlender, führt zu 421 oder 403, bevor Router und Nachweis greifen. Das ist das
   wirksame Gegenmittel gegen Rebinding, weil der Browser den vom Angreifer gewählten Namen in
   `Host` einträgt.
2. Diese Prüfung steht **vor** der Token-Prüfung, damit der Angriff nicht einmal einen
   Zeitunterschied am Token beobachten kann.
3. Das Token bleibt zusätzlich verlangt. Rebinding verschafft Herkunft, kein Geheimnis.

**Zuständig:** domain-dev (T-011). **Prüfung:** Integrationstest mit
`Host: evil.example:PORT` gegen `/health` und eine Datenroute; erwartet 403/421 und **kein**
Datenbankzugriff. Ein Test ohne `Host` (HTTP/1.0-Stil) gehört dazu.

#### B-1.4 — Zu weite oder reflektierende CORS-Regel
**Schwere:** hoch. **Akteure:** A-02. **Bezug:** R-02, E-009.

**Auswirkung.** `Access-Control-Allow-Origin: *` macht alle Antworten für jede Webseite lesbar.
Das Zurückspiegeln der eingehenden `Origin` ist noch schlimmer, weil es zusammen mit
`Allow-Credentials: true` wie eine Positivliste aussieht und keine ist. Beides hebt B-1.1 und
B-1.2 vollständig auf.

**Gegenmittel.**
1. Feste, im Code stehende Positivliste. Sie enthält genau: die Herkunft des Tauri-Webviews
   (unter Windows `https://tauri.localhost`, unter Linux `tauri://localhost` — beim Aufsetzen
   in T-008 belegen, nicht raten) und die Herkunft, unter der das Add-in ausgeliefert wird.
   Sonst nichts.
2. Kein Platzhalter, kein Zurückspiegeln, kein Abgleich per `startsWith` oder `includes`
   (`https://tauri.localhost.evil.example` besteht sonst die Prüfung). Vergleich auf
   Zeichengleichheit der vollständigen Herkunft.
3. `Access-Control-Allow-Credentials` bleibt aus. Es wird nicht gebraucht (B-1.2, Punkt 1).
4. Eine Anfrage mit vorhandener, aber nicht gelisteter `Origin` wird **abgewiesen**, nicht nur
   ohne CORS-Kopfzeilen beantwortet. Sonst tritt bei zustandsändernden Routen die Wirkung ein,
   obwohl der Browser die Antwort verwirft.
5. `Access-Control-Allow-Headers` listet genau die verwendeten Kopfzeilen, `Allow-Methods` genau
   die verwendeten Verben. `Access-Control-Max-Age` klein halten.

**Zuständig:** domain-dev (T-011), integration-dev (Add-in-Herkunft).
**Prüfung:** Tabellentest über Herkünfte, darunter `https://tauri.localhost.evil.example`,
`null`, leer und die echte Add-in-Herkunft.

#### B-1.5 — Darf der Port vorhersagbar sein?
**Schwere:** mittel. **Akteure:** A-02, A-03.

**Bewertung, ausdrücklich.** Ein zufälliger Port ist **keine Sicherheitsmaßnahme**. Eine
Webseite kann Loopback-Ports über `fetch` und Zeitmessung durchprobieren; einige tausend Ports
sind in Sekunden abgeklopft. Ein lokaler Prozess (A-03) sieht die offenen Ports ohnehin. Ein
zufälliger Port kostet zudem Bedienbarkeit, weil das Add-in ihn kennen muss.

**Entscheidung, die dieses Modell vorschlägt.** Fester Vorgabeport, in den Einstellungen
änderbar, **ausdrücklich nicht als Geheimnis behandelt**. Der Schutz kommt aus B-1.1 bis B-1.4,
nicht aus der Portnummer. Was daraus folgt:

**Gegenmittel.**
1. Der Dienst belegt den Port exklusiv (`exclusive: true` bzw. ohne `SO_REUSEADDR`-Umgehung).
   Ist der Port belegt, **startet Takt nicht** und meldet das verständlich, statt auf einen
   anderen Port auszuweichen. Sonst kann ein fremder Prozess den Port zuerst belegen und sich
   gegenüber dem Add-in als Takt ausgeben, um Tokens einzusammeln.
2. Portnummer und Dienstzustand landen in einer Datei im Anwendungsdatenverzeichnis mit den
   Rechten aus B-7.2 — das Token gehört **nicht** in dieselbe Datei, wenn sie irgendwo anders
   gelesen wird.
3. Die Portnummer darf in Fehlermeldungen erscheinen. Das Token nicht (B-2.4).

**Zuständig:** domain-dev (T-011), Orchestrator (T-008).
**Prüfung:** Start bei belegtem Port ergibt einen sauberen Fehler und keinen zweiten Prozess.

#### B-1.6 — Der Sidecar überlebt die Anwendung oder wird von fremder Hand gestartet
**Schwere:** mittel. **Akteure:** A-03. **Bezug:** E-004, R-04.

**Auswirkung.** Ein verwaister Sidecar lauscht weiter, nachdem der Benutzer Takt geschlossen hat
— mit Datenbankzugriff und ohne sichtbares Fenster. Umgekehrt: Das gebündelte Sidecar-Binärprogramm
liegt im Installationsverzeichnis und ist ausführbar. Startet A-03 es selbst mit eigenen
Argumenten (`--db`, `--token`, `--port`), zeigt es auf die echte Datenbank mit einem Token, das
der Angreifer kennt. Der gesamte Zugriffsschutz ist damit umgangen.

**Gegenmittel.**
1. In der Produktionsfassung kennt der Sidecar **keine** Argumente für Datenbankpfad, Tokenpfad
   oder Bindeadresse. Diese Werte kommen fest aus den Betriebssystempfaden. Entwicklungsschalter
   nur hinter einer zur Bauzeit gesetzten Kennzeichnung, die im Produktionsbau fehlt.
2. Der Sidecar verlangt beim Start ein Einmalgeheimnis von der Tauri-Hülle, das nicht über die
   Befehlszeile übergeben wird (Befehlszeilen sind für jeden lokalen Prozess sichtbar), sondern
   über `stdin` oder eine Umgebungsvariable, die nur der Kindprozess erbt. Ohne dieses Geheimnis
   beendet er sich sofort.
3. Der Sidecar beobachtet die Elternverbindung (geschlossene `stdin`-Leitung oder ein
   Lebenszeichen im Sekundentakt) und beendet sich, wenn die Hülle weg ist.
4. Die Hülle beendet den Sidecar beim Schließen ausdrücklich, auch bei Absturz und
   Abmeldung — nicht nur im regulären Weg.
5. Einzelinstanz-Sperre: Ein zweiter Takt-Start bringt das vorhandene Fenster nach vorn, statt
   einen zweiten Sidecar auf dieselbe Datenbank zu setzen (siehe auch B-12.5).

**Zuständig:** Orchestrator (T-008, Sidecar-Bündelung), domain-dev (T-011).
**Prüfung:** Manuell nach T-008: Takt beenden, Prozessliste prüfen. Direkter Start des
Sidecar-Binärprogramms von Hand endet mit Fehler.

#### B-1.7 — Erschöpfung durch große oder viele Anfragen
**Schwere:** niedrig. **Akteure:** A-02, A-03.

**Auswirkung.** Ein Rumpf ohne Größengrenze oder eine Endlosschleife von Anfragen legt den
Sidecar lahm; die Oberfläche wirkt eingefroren, ein laufender Timer ist betroffen.

**Gegenmittel.** Rumpfgrenze (Vorschlag: 1 MB, für Notizfelder reichlich), Zeitgrenze je Anfrage,
einfache Ratenbegrenzung auf den fehlgeschlagenen Nachweis (siehe B-2.6). Eine allgemeine
Ratenbegrenzung auf erfolgreiche Anfragen ist bei einem Einbenutzerdienst nicht nötig und würde
die Oberfläche behindern.

**Zuständig:** domain-dev (T-011).

---

### 5.2 Das Add-in-Token (E-009, R-09, VG-2)

Der gesamte Zugriffsschutz hängt an einer Zeichenkette, die der Benutzer von Hand in Outlook
einträgt. Der Weg dorthin führt über Zwischenablage, Notizzettel und gelegentlich eine E-Mail
an sich selbst (R-09).

#### B-2.1 — Schwaches oder vorhersagbares Token
**Schwere:** hoch. **Bezug:** E-009.

**Auswirkung.** Ein aus `Math.random`, einer Zeitmarke oder einer UUID v1 erzeugtes Token ist
ratbar. Damit ist der Dienst offen.

**Gegenmittel.**
1. `crypto.randomBytes(32)` aus `node:crypto`, ausgegeben als base64url. 256 Bit Entropie.
   Ausdrücklich nicht: `Math.random`, `Date.now`, `uuid` v1/v3/v5, `crypto.randomUUID` als
   alleinige Quelle (122 Bit sind vertretbar, aber die Semantik „Kennung" lädt zum Protokollieren
   ein — ein Token ist kein Bezeichner).
2. Ein festes Präfix, zum Beispiel `takt_`, damit eigene Geheimnisregeln in Semgrep und
   Geheimnis-Suchen im Repository das Format erkennen. Das Präfix ist keine Sicherheitsmaßnahme,
   sondern Fundbarkeit.
3. Erzeugt wird ausschließlich vom Dienst, nie von der Oberfläche, nie vom Add-in.

**Zuständig:** domain-dev (T-011). **Prüfung:** Unit-Test auf Länge und Zeichenvorrat; Test, dass
zwei Erzeugungen sich unterscheiden; Codeprüfung, dass keine Zufallsquelle außer `node:crypto`
im Tokenpfad vorkommt.

#### B-2.2 — Ablage des Tokens auf der Dienstseite
**Schwere:** hoch. **Akteure:** A-03, A-04, A-05, A-08. **Bezug:** E-009, R-09.

**Auswirkung.** Liegt das Token als Klartext in einer Datei mit Standardrechten, liest es jeder
andere Benutzer des Rechners (A-04) und jeder Sicherungs- und Synchronisierungsagent (A-05).
Liegt es im Roaming-Profil, wandert es beim Abmelden auf einen Dateiserver.

**Gegenmittel.**
1. Ablage in `%LOCALAPPDATA%\Takt\` — **nicht** in `%APPDATA%` (Roaming) und nicht in einem von
   OneDrive erfassten Ordner. Siehe B-7.1.
2. Der Dienst speichert **nur den SHA-256-Hashwert** des Tokens, nicht das Token selbst. Der
   Klartext wird bei der Erzeugung genau einmal in der Oberfläche gezeigt, mit Kopierschaltfläche
   und dem klaren Hinweis, dass er danach nicht wieder abrufbar ist. Wer ihn verliert, erzeugt
   ein neues. Damit gibt es dienstseitig kein wiederherstellbares Geheimnis mehr.
   *Verträglicher Rückweg, falls die Abnahme das Einmalanzeigen ablehnt:* Klartext, aber über
   die Windows-DPAPI an Benutzer und Rechner gebunden abgelegt, sichtbar nur nach ausdrücklicher
   Handlung. Dann ist B-2.3 zwingend.
3. Datei mit Rechten `0600`, Verzeichnis `0700`. Unter Windows: Vererbung entfernen und eine ACL
   setzen, die ausschließlich den aktuellen Benutzer und `SYSTEM` enthält; die Gruppen `Users`
   und `Authenticated Users` haben keinen Eintrag.
4. Beim Start prüft der Dienst die Rechte der Datei und warnt sichtbar, wenn sie zu weit sind.

**Zuständig:** domain-dev (T-011), Orchestrator (T-008 für die Pfadwahl).
**Prüfung:** Test, dass die erzeugte Datei den erwarteten Modus hat; manuelle Nachprüfung der
ACL unter Windows nach T-008.

#### B-2.3 — Anzeige des Tokens in der Oberfläche
**Schwere:** mittel. **Akteure:** A-04 (Schulterblick), Bildschirmaufnahmen, Bildschirmfreigabe.

**Auswirkung.** Ein dauerhaft sichtbares Token in den Einstellungen landet in jedem Screenshot,
in jeder Bildschirmfreigabe und in jeder Supportanfrage.

**Gegenmittel.** Voreinstellung verdeckt (`••••••••`). Anzeige nur nach ausdrücklicher Handlung
und dann zeitlich begrenzt (Vorschlag: 30 Sekunden, danach automatisch wieder verdeckt). Die
Kopierschaltfläche kopiert, ohne anzuzeigen. Ein Hinweis, dass die Zwischenablage von anderen
Programmen gelesen werden kann. Kein Token in einem `<input>` ohne `autocomplete="off"`, kein
Token im DOM, solange es verdeckt ist (nicht per CSS ausblenden — nicht rendern).

**Zuständig:** frontend-dev (S-09), integration-dev (S-13).
**Prüfung:** Playwright-Test, dass der Klartext im DOM erst nach der Anzeigehandlung vorkommt.

#### B-2.4 — Token in Protokollen, Fehlermeldungen und URLs
**Schwere:** hoch. **Akteure:** A-03, A-04, A-05. **Bezug:** E-009, R-09.

**Auswirkung.** Ein Token in einer Protokolldatei ist ein Token in der Sicherung, im
Synchronisierungsdienst und in jeder Supportanfrage. Ein Token in einer URL steht zusätzlich im
Zugriffsprotokoll, im Browserverlauf und in der `Referer`-Kopfzeile fremder Ziele.

**Gegenmittel.**
1. **Das Token wird ausschließlich in einer Kopfzeile übertragen.** Nie als Abfrageparameter,
   nie im Pfad, nie im Rumpf. Der Dienst weist eine Anfrage, die ein Token in der URL mitführt,
   mit 400 ab und **erklärt das ohne den Wert zu wiederholen** — zusätzlich wird das Token dann
   als kompromittiert behandelt und der Benutzer zur Neuerzeugung aufgefordert.
2. Zentrale Ausgabefunktion mit fester Positivliste protokollierbarer Felder. Kopfzeilen werden
   nie vollständig ausgegeben; `X-Takt-Token` und `Authorization` sind namentlich unterdrückt.
   Kein `console.log(req)`, kein `console.log(err)` mit vollständigem Objekt.
3. Die 401-Antwort lautet immer gleich, unabhängig davon, ob das Token fehlte, falsch war oder
   die falsche Länge hatte. Kein Vergleichsergebnis, keine Teilzeichenkette, kein „erwartet …".
4. Ausnahmeobjekte auf dem Weg zur Oberfläche werden auf Meldungstext und Fehlernummer
   reduziert. Kein Aufrufstapel an den Client, auch nicht lokal — der Client kann ein fremder
   Browsertab sein.
5. Kein Absturzbericht verlässt den Rechner (E-001, keine Telemetrie): Tauri-Aktualisierungsdienst
   und jede Fehlerberichterstattung sind in `tauri.conf.json` ausdrücklich abgeschaltet.

**Zuständig:** domain-dev (T-011), integration-dev (Add-in-Fehlerbehandlung).
**Prüfung:** Test, der eine Anfrage mit gültigem und mit ungültigem Token stellt und die
gesamte Protokollausgabe des Testlaufs auf das Tokenpräfix `takt_` absucht — erwartet: kein
Treffer. Derselbe Test für die Antwortkörper.

#### B-2.5 — Vergleich, der Laufzeit verrät
**Schwere:** mittel. **Akteure:** A-02, A-03. **Bezug:** E-009.

**Auswirkung.** Ein Vergleich mit `===` bricht beim ersten abweichenden Zeichen ab. Lokal, ohne
Netzrauschen und mit beliebig vielen Wiederholungen, ist das messbar. Ein Angreifer erschließt
das Token zeichenweise.

**Gegenmittel.**
1. Beide Seiten zuerst über SHA-256 auf feste Länge bringen, dann `crypto.timingSafeEqual` auf
   den beiden 32-Byte-Digests. Der Umweg über den Hashwert vermeidet, dass `timingSafeEqual` bei
   ungleicher Länge wirft und dadurch die Länge verrät.
2. Der Pfad bis zur Antwort ist längenunabhängig: keine vorgezogene Längenprüfung, kein früher
   Abbruch bei leerer Kopfzeile mit anderer Antwortzeit.

**Zuständig:** domain-dev (T-011). **Prüfung:** Unit-Test auf die Vergleichsfunktion mit
gleichlangen und ungleichlangen Eingaben; Codeprüfung, dass im Nachweispfad kein `===` auf das
Token angewandt wird.

#### B-2.6 — Erraten durch Wiederholung
**Schwere:** niedrig bei 256 Bit, aber die Erkennung fehlt sonst ganz.

**Auswirkung.** Ein 256-Bit-Token ist nicht erratbar. Ohne Zählung merkt aber niemand, dass es
jemand versucht.

**Gegenmittel.** Fehlgeschlagene Nachweise zählen und ab einer Schwelle (Vorschlag: 10 in
60 Sekunden) mit ansteigender Verzögerung beantworten. Der Dienst hinterlegt eine sichtbare
Warnung in der Oberfläche: „Es gab wiederholt Anfragen mit falschem Token." Das ist der einzige
Weg, auf dem der Benutzer von einem Angriff aus B-1.1 überhaupt erfährt. Protokolliert wird
Zeitpunkt, Herkunft und Anzahl — **nicht** der geratene Wert.

**Zuständig:** domain-dev (T-011), frontend-dev (Anzeige).

#### B-2.7 — Neuerzeugung ohne sofortige Ungültigkeit des alten Tokens
**Schwere:** hoch. **Bezug:** E-009.

**Auswirkung.** Der Benutzer erzeugt ein neues Token, weil er das alte für kompromittiert hält.
Bleibt das alte in einer Nachfrist gültig, war die Handlung wirkungslos.

**Gegenmittel.**
1. Es gibt genau **einen** gültigen Hashwert. Neuerzeugung überschreibt ihn in einer Transaktion.
   Keine Liste, keine Nachfrist, keine zweite Gültigkeit.
2. Laufende Anfragen mit dem alten Token schlagen ab dem Überschreiben fehl. Das ist gewollt.
3. Die Oberfläche sagt vor dem Bestätigen ausdrücklich, dass das Add-in danach nicht mehr
   funktioniert, bis das neue Token dort eingetragen ist.
4. Der Zeitpunkt der letzten Verwendung wird festgehalten und angezeigt („zuletzt verwendet am
   …"). So sieht der Benutzer, ob überhaupt noch jemand mit dem Token arbeitet.

**Zuständig:** domain-dev (T-011), frontend-dev (S-09).
**Prüfung:** Integrationstest — Token erzeugen, Anfrage erfolgreich, neu erzeugen, dieselbe
Anfrage mit dem alten Token ergibt 401.

#### B-2.8 — Ablage des Tokens im Add-in: Office-`RoamingSettings` bringt es in das Postfach
**Schwere:** hoch. **Neu, nicht in den bisherigen Risiken enthalten.** **Bezug:** E-001, E-009, R-09.

**Auswirkung.** Der naheliegende Ablageort in einem Office.js-Add-in ist
`Office.context.roamingSettings`. Diese Werte werden **im Postfach des Benutzers gespeichert und
über den Exchange- beziehungsweise Microsoft-365-Dienst synchronisiert.** Damit verlässt das
Token den Rechner und liegt in der Cloud — bei einem Produkt, dessen erste Entscheidung E-001
lautet „keine Cloudanbindung". Wer Zugriff auf das Postfach hat (Administrator, ein
kompromittiertes Konto, ein anderes Add-in mit Postfachrechten), hat den Schlüssel zu den
lokalen Kundendaten.

**Gegenmittel.**
1. Das Token gehört **nicht** in `RoamingSettings`. Es wird im `localStorage` der Add-in-Herkunft
   abgelegt, also je Rechner und je Browserprofil — was zum lokalen Charakter des Dienstes passt:
   Auf einem anderen Rechner nützt das Token ohnehin nichts, weil der Dienst dort ein anderes hat.
2. `RoamingSettings` darf ausschließlich Werte aufnehmen, die keine Geheimnisse sind — der
   reguläre Ausdruck aus A-10.8 und die Portnummer sind vertretbar, das Token nicht.
3. Findet das Add-in kein Token, führt es den Benutzer zu S-13 statt eine Fehlermeldung zu zeigen.
4. Der Ablageort wird im Entwicklerhandbuch begründet, damit ihn niemand später „zur
   Bequemlichkeit" umstellt.

**Zuständig:** integration-dev (S-13, `apps/outlook-addin/**`).
**Prüfung:** Codeprüfung — `roamingSettings` kommt im Tokenpfad nicht vor. Ein Test, der die
Menge der in `RoamingSettings` geschriebenen Schlüssel gegen eine Positivliste prüft.

#### B-2.9 — Die Kernfrage: Fängt die Herkunftsprüfung einen Tokendiebstahl auf?
**Bezug:** R-09, ausdrücklich zu beantworten.

**Antwort: Nein. Nicht einmal ansatzweise, und der Unterschied ist grundsätzlich.**

Die Herkunftsprüfung (`Origin`, `Host`, `Sec-Fetch-*`) wirkt nur gegen Angreifer, die durch einen
Browser gezwungen sind, wahrheitsgemäße Werte zu senden — also gegen A-02, die fremde Webseite.
Sie ist gegen diesen Akteur sehr wirksam und deshalb unverzichtbar.

Gegen A-03, einen beliebigen lokalen Prozess, ist sie **wirkungslos**. Ein Skript in drei Zeilen
setzt `Host: 127.0.0.1:PORT` und `Origin: https://tauri.localhost` von Hand. Wer das Token hat,
ist damit von der echten Oberfläche nicht mehr unterscheidbar. Dasselbe gilt für A-04 auf einem
Terminalserver.

Daraus folgt:

1. **Herkunftsprüfung und Token sind zwei Maßnahmen gegen zwei verschiedene Akteure, keine zwei
   Schichten gegen denselben.** Beide sind nötig, keine ersetzt die andere.
2. Gegen A-03 tragen ausschließlich: die Ablage des Tokens (B-2.2, B-2.8), seine Abwesenheit in
   Protokollen (B-2.4), die erkennbare Neuerzeugung (B-2.7) und die sichtbare Warnung bei
   Fehlversuchen (B-2.6). Also Reduktion der Angriffsfläche und Erkennbarkeit — keine Verhinderung.
3. **Empfohlene Verschärfung, zur Entscheidung durch den Orchestrator:** Die Weboberfläche in der
   Tauri-Hülle sollte **kein** Add-in-Token verwenden. Sie kann sich über einen Kanal ausweisen,
   den ein Browser grundsätzlich nicht ansprechen kann — ein je Start von der Hülle an Webview
   und Sidecar übergebenes Sitzungsgeheimnis, oder auf Dauer eine benannte Pipe statt TCP für den
   Oberflächenpfad. Dann bleibt das dauerhafte Token allein an der Add-in-Strecke hängen, und
   sein Verlust kostet weniger. Diese Trennung ist der einzige Vorschlag in diesem Dokument, der
   die Angriffsfläche des Tokens strukturell verkleinert statt sie nur zu bewachen.
4. Ein echtes Auffangen eines Tokendiebstahls bräuchte Bindung an den aufrufenden Prozess
   (unter Windows: benannte Pipe und Prüfung der SID des Gegenübers). Das ist mit TCP nicht
   erreichbar und wird für den Add-in-Pfad, den Microsoft über HTTP führt, auch nicht erreichbar
   sein. Das ist ein **Restrisiko**, siehe Abschnitt 9.

---

#### B-2.10 — Das Add-in-Token erreicht die vollen Fachrouten
**Schwere:** hoch. **Neu in T-023**, gemeldet aus T-033, hier bestätigt und eingeordnet.
**Betrifft:** W-01, W-02, W-04, W-05, W-07, W-10. **Akteure:** A-03, A-04.
**Bezug:** E-009, E-045, R-09, RR-1, B-2.9 Punkt 3, T-019.

**Der Befund.** Die Kette in `apps/local-api/src/app.ts` verlangt für **jede** Route einen
gültigen Nachweis — das hält (B-1.1). Sie unterscheidet aber nicht, **welcher** der beiden
Nachweise vorliegt. `requireCredential('session')` steht an genau drei Routen: `GET /token`,
`POST /token` und `GET /security/notices`. Alle übrigen 60 Operationen hängen ohne diese Prüfung
an der Kette und nehmen deshalb **beide** Geheimnisse an.

**Gemessen** (T-023, gegen den zusammengesetzten Dienst über `app.fetch`, mit einem echten über
`tokens.rotate` erzeugten Add-in-Token und ohne jedes Sitzungsgeheimnis):

| Aufruf mit **ausschließlich** dem Add-in-Token | Ergebnis |
|---|---|
| `GET /todos/{id}/note` | **200 — der interne Vermerk im Klartext** |
| `PUT /todos/{id}/note` | **200 — der Vermerk wird überschrieben** |
| `PATCH /settings` mit `exportDirectory` auf einen frei gewählten Ordner | **200 — Ziel gesetzt** |
| `POST /export/runs` | **201 — Datei im vom Aufrufer gewählten Ordner geschrieben** |
| `PATCH /settings` mit `roundingMode` | **200 — eine Abrechnungsgröße geändert** |
| `GET /todos`, `GET /time-entries`, `GET /export/templates`, `POST /export/preview` | 200 |
| `GET /token`, `POST /token`, `GET /security/notices` | 401 — diese drei halten |

**Auswirkung.** Das Add-in-Token ist das **dauerhafte** Geheimnis. Sein Weg zum Benutzer führt
über Zwischenablage, Notizzettel und gelegentlich eine E-Mail an sich selbst (R-09); es liegt im
`localStorage` einer Herkunft, die in einem von Microsoft gehosteten Webview geladen wird. Genau
deshalb hat T-019 dem Add-in eine **schmale Fläche** aus vier Routen gegeben statt der 62.

Diese Trennung besteht heute nur in der Routenliste des Add-ins, nicht im Dienst. Wer das Token
hat, hat damit:

1. **Den internen Vermerk.** A-7.2 ist die härteste Grenze des Projekts. Sie ist gegen die
   Exportvorlage vollständig gebaut (B-3.1, in T-023 über vier Wege erfolglos angegriffen) — und
   gegen einen Nachweis gar nicht. Der Vermerk ist über eine gewöhnliche Leseroute abrufbar.
2. **Einen Abfluss sämtlicher offener Buchungen an einen selbst gewählten Ort**, in zwei
   Aufrufen: Ordner setzen, Lauf auslösen. Ohne Datenbankzugriff, ohne Dateirechte, ohne
   Kenntnis des Ablageorts. Das ist der kürzeste Weg zu W-01 und W-03, den dieses System kennt.
3. **Eine Abrechnungswirkung.** Der Lauf markiert die Buchungen als exportiert. Die Arbeit ist
   damit aus der echten Abrechnung heraus (W-04, W-10), und `roundingMode` ist ohnehin frei
   änderbar.

**Der Kommentar ist mitbetroffen.** `app.ts` sichert im Kopf des Add-in-Blocks ausdrücklich zu:
„Kein Löschen, kein Export, kein Zugriff auf den Vermerk eines fremden Todos, keine
Einstellungen. … Ein entwendetes Add-in-Token kommt genau so weit, wie diese Fläche reicht."
Das ist **falsch**. Ein Kommentar, der eine Sicherheitseigenschaft zusichert, die der Code nicht
herstellt, ist ein eigener Befund: Der nächste Leser prüft sie nicht nach, weil sie dasteht.

**Welche der beiden Seiten hat recht?** Der Kommentar. Der Entwurf ist richtig — er ist B-2.9
Punkt 3, und T-019 hat die schmale Fläche eigens dafür gebaut. Die **Umsetzung** fehlt. Der
Kommentar bleibt also stehen und der Code holt ihn ein; er wird nicht abgeschwächt.

**Gegenmittel.**
1. `RequiredCredential` um `'addin'` erweitern oder — sauberer — die Vorgabe umdrehen: Die Kette
   setzt für **alle** Routen `session` voraus, und ausschließlich der Teilbaum `/addin` senkt die
   Anforderung ausdrücklich auf `any`. Eine neue Fachroute ist dann von selbst geschlossen. Die
   heutige Richtung („alles offen, drei Ausnahmen") hat denselben Fehler wie eine Prüfung je
   Route: Die nächste neue Route ist die vergessene (B-1.1 Punkt 1).
2. Die Fläche, die ein Add-in-Token erreichen darf, ist der Zuschnitt aus T-019 und **nichts
   darüber hinaus**: Baum und Vorbelegungen lesen, nach einer Call-Nummer suchen, ein Todo
   anlegen, eine Zeit buchen. Kein `/todos/{id}/note` in beide Richtungen, kein `/settings`,
   kein `/export/*`, kein Löschen.
3. Ein Prüfpfad über die **Routenliste des Dienstes**, nicht über eine von Hand gepflegte
   Aufzählung: Jede registrierte Route außerhalb von `/addin` ergibt mit einem Add-in-Token 401.
   Das ist dieselbe Bauform wie Prüfung 1 aus Abschnitt 7 und aus demselben Grund.
4. Erst danach trägt der Satz in `app.ts` wieder.

**Zuständig:** domain-dev (`apps/local-api/src/app.ts`, `src/http/guards.ts`,
`src/access/verifier.ts`), unit-tester (Prüfung 24).
**Prüfung:** Siehe Abschnitt 7, Prüfung 24.

---

### 5.3 Exportvorlagen als Benutzereingabe (E-005, A-8.7, R-06, VG-5, VG-6)

#### B-3.1 — Eine Feldquelle löst auf die Todo-Notiz auf
**Schwere:** hoch. **Betrifft:** W-02, VG-5. **Bezug:** A-7.2, A-8.7, E-005, R-06.

**Auswirkung.** A-7.2 ist eine Datenschutzgrenze, kein Komfortmerkmal: Die persönliche Notiz ist
ausschließlich innerhalb der Anwendung sichtbar. Löst eine Vorlage die Quelle `todo.notiz` auf,
steht diese Notiz in der Exportdatei und geht an das Abrechnungstool — ohne dass jemand es
bemerkt, denn die Vorlage sieht aus wie jede andere.

**Gegenmittel — und die verlangte Bewertung.**

**Eine Freitext-Pfadangabe ist nicht vertretbar.** Begründung, nicht Geschmack:

- Ein allgemeiner Pfadauflöser über den Objektgraphen ist ein **Leseprimitiv über alles, was
  ihm übergeben wird**. Er sperrt nicht die Todo-Notiz aus, er lässt sie nur zufällig aus,
  solange die Zeichenkette nicht getroffen wird. `todo.notiz`, `todo['notiz']`, `todo.Notiz`,
  `todo.\u006eotiz`, `..notiz` — jede Sperrliste ist eine Aufzählung von Schreibweisen, die
  jemand vergisst.
- Er ist **nicht zukunftssicher**. Jedes Feld, das die Fachlogik später bekommt — ein interner
  Vermerk, ein zwischengespeicherter Wert, im schlimmsten Fall ein Einstellungsobjekt mit dem
  Token — wird in dem Moment exportierbar, in dem es existiert. Niemand wird beim Hinzufügen
  eines Feldes an den Vorlagenmotor denken.
- Er öffnet `__proto__`, `constructor`, `prototype` als Pfadbestandteile.
- Die Prüfung würde in einer Zeichenkettenanalyse liegen. Das ist die Sorte Schutz, die im
  Test besteht und im Betrieb bricht.

**Also: geschlossene Auswahlliste, strukturell.**

1. In `packages/export` steht eine **Konstante**: eine Tabelle erlaubter Feldquellen. Jeder
   Eintrag besteht aus einem Schlüssel (`todo.callNumber`, `buchung.notiz`, `buchung.dauer`,
   `buchung.start`, `buchung.ende`, `system.windowsUser`, `todo.tags`, `todo.titel` — die Liste
   ist bei T-007 festzulegen) und einer eigenen, ausgeschriebenen Zugriffsfunktion. **Es gibt
   keinen generischen Pfadauflöser im Code.**
2. Eine Vorlage speichert den **Schlüssel**, nicht den Pfad. Ein unbekannter Schlüssel macht die
   Vorlage ungültig.
3. Die Prüfung greift **zweimal**: beim Speichern der Vorlage und **erneut beim Ausführen des
   Exports**. Vorlagen liegen in SQLite, und die Datei kann außerhalb der Anwendung bearbeitet
   werden (A-01, A-03). Eine Prüfung nur bei der Eingabe ist keine Prüfung.
4. Bei einer ungültigen Vorlage bricht der Export **ab**. Er lässt das Feld nicht aus und setzt
   es nicht auf leer — sonst ist ein manipulierter Schlüssel ein stiller Datenverlust in der
   Abrechnung.
5. Die Typdefinition erzwingt es mit: `quelle: FeldQuelle` als Vereinigungstyp aus Zeichenketten,
   nicht `quelle: string`. Damit fällt der Fehler schon beim Übersetzen auf.
6. Der Vorlageneditor (S-14) bietet die Liste als Auswahlfeld an. Es gibt kein Freitextfeld für
   die Quelle. Das ist zugleich die bessere Bedienung.

**Zuständig:** integration-dev (T-007, `packages/export/**`), unit-tester (T-010).
**Prüfung — und diese ist die wichtigste im ganzen Projekt:**
- Ein Test über **beliebige** Vorlagen (Eigenschaftstest über die Menge aller erlaubten
  Schlüssel in allen Reihenfolgen und Kombinationen), der prüft, dass der Text der Todo-Notiz im
  Ergebnis nicht vorkommt.
- Der Test sucht den Notiztext **sowohl im Klartext als auch base64-kodiert**. Sonst besteht ihn
  jede Vorlage, die die Notiz über die Transformation `base64` ausgibt.
- Ein Test, der eine Vorlage mit unbekanntem Schlüssel direkt in die Speicherung schreibt (an der
  Oberfläche vorbei) und erwartet, dass der Export abbricht.
- Ein Test, der die Konstante selbst prüft: kein Eintrag der Auswahlliste liefert die Todo-Notiz.

#### B-3.2 — Der Feldname der Vorlage vergiftet das Ergebnisobjekt
**Schwere:** mittel. **Bezug:** A-8.7.

**Auswirkung.** Der Name ist laut A-8.7 ein „frei wählbarer Schlüssel im JSON". Wird das
Ergebnis mit `obj[feld.name] = wert` auf einem gewöhnlichen Objekt aufgebaut, verändern die Namen
`__proto__`, `constructor` und `prototype` den Prototyp statt ein Feld zu setzen — im besten Fall
fehlt das Feld in der Ausgabe, im schlechteren Fall verhält sich der Prozess danach anders
(Prototype Pollution). Doppelte Namen überschreiben sich still.

**Gegenmittel.** Ergebnis über `Object.create(null)` oder eine `Map` aufbauen und erst zum
Schluss serialisieren. Feldnamen gegen einen Zeichenvorrat prüfen (Vorschlag: `[A-Za-z0-9_-]{1,64}`)
und `__proto__`, `constructor`, `prototype` ausdrücklich abweisen. Doppelte Namen innerhalb einer
Vorlage werden beim Speichern abgewiesen, nicht still zusammengeführt.

**Zuständig:** integration-dev (T-007). **Prüfung:** Unit-Tests mit genau diesen drei Namen und
mit einem Duplikat.

#### B-3.3 — Die Bedingung wird zu einer kleinen Programmiersprache
**Schwere:** hoch, falls sie so gebaut wird. **Bezug:** A-8.7 („bedingung optional").

**Auswirkung.** Der bequeme Weg für „Feld wird nur ausgegeben, wenn erfüllt" ist ein
JavaScript-Ausdruck, ausgewertet mit `eval` oder `new Function`. Damit steht in einer
Einstellungstabelle einer SQLite-Datei Code, der im Sidecar-Prozess mit vollem Datei- und
Netzzugriff ausgeführt wird. Wer die Datei ändern kann (A-03), führt beliebigen Code aus. Das
wäre die schwerwiegendste Lücke, die dieses Projekt bauen könnte.

**Gegenmittel.**
1. Die Bedingung ist eine **Datenstruktur**, kein Text: `{ quelle: FeldQuelle, operator:
   'ist_leer' | 'ist_nicht_leer' | 'gleich' | 'ungleich' | 'enthaelt' | 'groesser_als', wert?:
   string | number }`. Der Operatorvorrat ist abgeschlossen und klein.
2. `eval`, `new Function`, `vm`, `vm2`, `setTimeout(string)` und jede Vorlagensprache mit
   Ausdrucksauswertung sind im Vorlagenmotor untersagt.
3. Eine Lint-Regel (`no-eval`, `no-implied-eval`, `no-new-func`) fängt Rückfälle. Für
   `packages/export` gilt sie als Fehler, nicht als Warnung.

**Zuständig:** integration-dev (T-007), Orchestrator (Lint-Konfiguration in T-008).
**Prüfung:** Semgrep-Regel gegen `eval`/`new Function` in `packages/export/**`; Typtest.

#### B-3.4 — Transformationen als Angriffsfläche
**Schwere:** niedrig bis mittel. **Bezug:** A-8.7.

**Auswirkung.** `datum(format)` nimmt eine Formatzeichenkette entgegen. Je nach Bibliothek kann
sie unerwartete Bestandteile ausgeben oder bei sehr langen Eingaben stark verlangsamen.
`konstante` erlaubt beliebigen Text im Export — harmlos gegenüber Takt, aber es ist der Weg,
über den ein Benutzer der Abrechnung frei erfundene Werte unterschiebt.

**Gegenmittel.** Formatzeichenketten aus einer Positivliste von Mustern wählen lassen (z. B.
`TT.MM.JJJJ`, `JJJJ-MM-TT`, `TT.MM.JJJJ HH:mm`), nicht frei eintippen. Länge der `konstante`
begrenzen (Vorschlag: 256 Zeichen). Die Rundung `runde_auf_viertelstunde` benutzt genau die
Funktion aus `packages/domain` (E-008) und implementiert nichts nach — zwei Rundungen, die
auseinanderlaufen, sind ein Abrechnungsfehler.

**Zuständig:** integration-dev (T-007).

#### B-3.5 — Die Live-Vorschau zeigt echte Kundendaten
**Schwere:** niedrig. **Bezug:** A-8.7 („Live-Vorschau auf tatsächlich offenen Buchungen").

**Auswirkung.** Die Vorschau rendert echte Buchungsnotizen in die Oberfläche. Lokal ist das in
Ordnung. Nicht in Ordnung wäre es, wenn die Vorschau nebenbei eine Datei schreibt, in ein
Protokoll geht oder in einer Fehlermeldung landet.

**Gegenmittel.** Die Vorschau läuft ausschließlich im Arbeitsspeicher und schreibt keine Datei.
Kein Zwischenspeichern im Dateisystem, kein Protokolleintrag mit dem Vorschauergebnis. Bei einem
Fehler in der Vorschau erscheint die Fehlerursache, nicht das halb erzeugte Ergebnis.

**Zuständig:** integration-dev (T-007), frontend-dev (S-14).

---

### 5.4 Der konfigurierbare reguläre Ausdruck im Add-in (A-10.8, VG-6, VG-8)

Zwei nicht vertrauenswürdige Eingaben treffen aufeinander: das Muster kommt vom Benutzer, der
Text vom Absender der E-Mail.

#### B-4.1 — Katastrophales Backtracking friert den Outlook-Bereich ein
**Schwere:** hoch. **Akteure:** A-01 unabsichtlich, A-06 absichtlich. **Bezug:** A-10.8.

**Auswirkung.** Ein Muster wie `(\d+)+[A-Z]` oder `(a|a)*$` braucht auf einem passenden Text
exponentielle Zeit. JavaScript-Ausdrücke sind **nicht unterbrechbar**: Der Einzelfaden des
Add-ins bleibt in der Auswertung stehen. Der Outlook-Aufgabenbereich reagiert nicht mehr, und
der Benutzer kann ihn nicht einmal schließen — er sieht einen Fehler von Outlook, nicht von Takt.
Ein Absender (A-06) kann das gezielt auslösen, sobald er das Muster kennt oder errät; ein
Benutzer stolpert unabsichtlich hinein, weil A-10.8 das Muster ausdrücklich in die
Benutzerhand legt.

**Gegenmittel.**
1. **Die Auswertung läuft in einem Web Worker mit harter Zeitgrenze.** Der Hauptfaden startet
   den Worker, wartet höchstens 100 Millisekunden und ruft danach `worker.terminate()`. Das ist
   der einzige Weg, eine laufende Auswertung in JavaScript tatsächlich abzubrechen. Alle anderen
   Vorschläge (Zeitmessung im selben Faden, `setTimeout`) tun nichts, weil der Faden blockiert
   ist.
2. **Eingabelänge begrenzen.** Zuerst der Betreff, dann höchstens die ersten 20 000 Zeichen des
   Inhalts. Signaturen, Zitatverläufe und HTML-Ballast tragen ohnehin nichts zur Call-Nummer bei
   und vervielfachen die Laufzeit.
3. **Muster beim Speichern prüfen.** Statische Analyse auf verschachtelte Quantoren und
   Alternativen mit gemeinsamem Präfix; ein Werkzeug wie `recheck` oder eine eigene Heuristik.
   Zusätzlich ein Probelauf gegen erzeugte Zeichenketten wachsender Länge mit derselben
   Zeitgrenze. Fällt das Muster durch, wird es mit einer verständlichen deutschen Meldung
   abgelehnt: „Dieser Ausdruck kann bei langen E-Mails sehr lange rechnen und wurde nicht
   gespeichert."
4. **Angebotener Vorrat statt leeres Feld.** S-13 liefert eine kurze Liste erprobter Muster
   (z. B. `\bC[0-9]{6}\b`), die den Normalfall abdeckt. Das Freitextfeld ist der Ausnahmeweg,
   sichtbar als „für Fortgeschrittene" gekennzeichnet.
5. Keine Rückverweise und keine Rückschau anbieten, wenn ein Muster über die Auswahl kommt —
   sie sind die häufigsten Ursachen.

**Zuständig:** integration-dev (`apps/outlook-addin/**`, S-13).
**Prüfung:** Unit-Test mit einem bekannt bösartigen Muster und einer passenden Eingabe; erwartet
wird Abbruch nach der Zeitgrenze und ein sauberes „nicht erkannt", **kein** Einfrieren. Der Test
muss eine Obergrenze für die Gesamtlaufzeit haben, sonst hängt der Testlauf.

#### B-4.2 — Ungültiger Ausdruck
**Schwere:** mittel. **Bezug:** A-10.8.

**Auswirkung.** `new RegExp("[")` wirft. Wird das nicht aufgefangen, stirbt die Initialisierung
des Aufgabenbereichs, und das Add-in ist unbrauchbar — bei einem Wert, den der Benutzer selbst
eingetragen hat und den er ohne funktionierendes Add-in nicht mehr korrigieren kann. Eine
Sackgasse.

**Gegenmittel.**
1. Prüfung beim Speichern in S-13, mit Fehlermeldung an der Eingabe: „Der Ausdruck ist nicht
   gültig: …" — die Meldung der Laufzeitumgebung darf gezeigt werden, sie enthält keine
   Geheimnisse.
2. **Erneute Prüfung bei jeder Verwendung**, in `try`/`catch`. Einstellungen können außerhalb
   des Add-ins verändert werden, und ein Wert aus einer früheren Fassung kann heute ungültig sein.
3. Bei Fehlschlag: keine Erkennung, das Feld `callNumber` bleibt leer, der Benutzer kann es von
   Hand füllen, und ein Hinweis führt ihn zu S-13. Das Add-in bleibt in jedem Fall bedienbar.
4. Kein Ausdruck aus den Einstellungen wird beim Laden des Add-ins ohne Absicherung übersetzt.

**Zuständig:** integration-dev. **Prüfung:** Test mit `[`, `(`, `\` und leerer Zeichenkette.

#### B-4.3 — Ein Ausdruck, der auf jede E-Mail zutrifft
**Schwere:** hoch — und das ist die unterschätzte Variante. **Akteure:** A-01, A-06.
**Bezug:** A-10.8, A-10.9, A-2.6.

**Auswirkung.** `.*`, `^`, `\s*` oder eine leere Erfassungsgruppe treffen auf jede E-Mail zu und
liefern meist eine leere oder unsinnige Call-Nummer. Dann greift A-10.9: Das Add-in findet ein
vorhandenes Todo mit derselben (leeren) Call-Nummer und bietet an, darauf zu buchen. Der Benutzer
bestätigt, weil er den Vorschlag für richtig hält. **Ergebnis: Arbeitszeit für Kunde A wird auf
den Vorgang von Kunde B gebucht und so abgerechnet.** Das ist kein Anzeigefehler, das ist ein
Abrechnungsfehler mit Außenwirkung (W-10), und er fällt erst beim Kunden auf.

**Gegenmittel.**
1. Das Muster **muss** mindestens eine Erfassungsgruppe enthalten; ohne wird es abgelehnt. Nicht
   der Gesamttreffer wird verwendet, sondern Gruppe 1.
2. Muster, die auf die leere Zeichenkette passen, werden abgelehnt. Prüfung beim Speichern:
   trifft der Ausdruck auf `""` zu, ist er ungültig.
3. **Der erkannte Wert wird plausibilisiert, bevor er `callNumber` wird:** nicht leer, nach
   Beschneiden mindestens 3 und höchstens 64 Zeichen, Zeichenvorrat `[A-Za-z0-9._/-]`. Alles
   andere gilt als „nicht erkannt".
4. **Eine leere Call-Nummer ist nie ein Übereinstimmungskriterium.** Die Duplikatabfrage aus
   A-10.9 überspringt leere und nur aus Leerzeichen bestehende Werte grundsätzlich. Diese eine
   Regel entschärft den Hauptschaden.
5. Der erkannte Wert wird in S-12 **sichtbar angezeigt und vom Benutzer bestätigt**, bevor ein
   Todo entsteht oder eine Buchung auf ein vorhandenes Todo geht. A-10.9 verlangt das ohnehin
   („legt nicht stillschweigend an oder zusammen"); die Sicherheitsbegründung ist diese hier.
6. Beim Vorschlag „auf vorhandenes Todo buchen" zeigt das Add-in Titel und Kunden-Tag des
   gefundenen Todos, nicht nur die Nummer. Ein Mensch erkennt den falschen Kunden sofort, eine
   Nummer allein sagt ihm nichts.

**Zuständig:** integration-dev (S-12, S-13, `apps/local-api/src/routes/addin/**`),
domain-dev (Duplikatabfrage in `packages/domain`).
**Prüfung:** Unit-Test, dass die Duplikatsuche bei leerer Call-Nummer nie einen Treffer liefert.
Test der Plausibilisierung mit Grenzwerten. E2E-Fall in T-002: Muster `.*`, zwei E-Mails
verschiedener Kunden, erwartet werden zwei getrennte Todos.

#### B-4.4 — Zustand am Ausdruck und Injektion in nachgelagerte Systeme
**Schwere:** niedrig. **Akteure:** A-06.

**Auswirkung.** Ein mit `g` erzeugter Ausdruck behält `lastIndex` zwischen Aufrufen; derselbe
Ausdruck trifft dann bei jeder zweiten E-Mail nicht — ein sporadischer Fehler, den niemand
reproduziert. Getrennt davon: Der erkannte Wert stammt aus einer fremden E-Mail und wird als
`Call` an ein System weitergegeben, dessen Verhalten Takt nicht kennt.

**Gegenmittel.** Ausdruck je Verwendung neu übersetzen oder `lastIndex` vor jeder Verwendung auf
0 setzen; besser: `g` gar nicht anbieten, es wird für einen Treffer nicht gebraucht. Der
Zeichenvorrat aus B-4.3 Punkt 3 dient zugleich als Ausgangsprüfung — er schließt Steuerzeichen,
Zeilenumbrüche, Anführungszeichen und die für Tabellenkalkulationen gefährlichen führenden
Zeichen `=`, `+`, `-`, `@` aus. Sollte je eine Exportvorlage CSV erzeugen, ist das der Punkt, an
dem Formelinjektion verhindert wird; im JSON-Fall ist es Vorsorge.

**Zuständig:** integration-dev.

---

### 5.5 Der Exportordner (E-011, R-11, VG-4, VG-6)

#### B-5.1 — Pfadtraversierung und Ausbruch aus dem gewählten Ordner
**Schwere:** hoch. **Bezug:** E-011, R-11.

**Auswirkung.** Der Zielordner ist Benutzereingabe. Setzt sich der Dateiname aus Daten zusammen
(Vorlagenname, Kundentag, Call-Nummer), genügt ein `..\`, ein `/`, ein Doppelpunkt (NTFS-
Alternativdatenstrom `datei.json:versteckt`) oder ein absoluter Pfad, um außerhalb des Ordners zu
schreiben. Im schlimmsten Fall wird eine fremde Datei überschrieben; läuft Takt erhöht, auch eine
Systemdatei.

**Gegenmittel.**
1. **Der Ordner wird ausschließlich über den Ordnerauswahldialog des Betriebssystems gewählt**
   (Tauri-`dialog`-Plugin). Kein Freitextfeld in S-09. Der Pfad wird angezeigt, nicht getippt.
2. **Der Dateiname enthält keine Benutzerdaten.** Festes Muster, zum Beispiel
   `takt-export-JJJJMMTT-HHMMSS-<lauf-id>.json`. Die Lauf-ID stammt aus `crypto.randomUUID`.
   Damit gibt es keine Zeichenkette aus Benutzer- oder E-Mail-Hand im Pfad.
3. **Kanonisierung und Prüfung zur Schreibzeit:** Ordner und vollständiger Zielpfad über
   `fs.realpath` auflösen, dann prüfen, dass der Zielpfad ein Kind des aufgelösten Ordners ist —
   **segmentweise**, nicht per `startsWith` (sonst besteht `C:\Export-Geheim` die Prüfung gegen
   `C:\Export`). Unter Windows Groß- und Kleinschreibung normalisieren.
4. Vor dem Schreiben prüfen, dass der Zielordner **kein Verknüpfungspunkt und keine symbolische
   Verknüpfung** ist, die woandershin zeigt, und mit `O_NOFOLLOW`-artiger Semantik bzw. dem
   Schreibflag `wx` arbeiten, damit ein vorhandener Eintrag nicht verfolgt und nicht überschrieben
   wird.
5. Reservierte Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`),
   nachgestellte Punkte und Leerzeichen sowie Pfadlängen über 250 Zeichen fangen — durch Punkt 2
   ausgeschlossen, aber als Zusicherung geprüft.

**Zuständig:** integration-dev (`packages/export/**`), frontend-dev (S-09, Auswahldialog).
**Prüfung:** Unit-Tests der Pfadprüfung mit `..`, absolutem Pfad, `C:\Export-Geheim` gegen
`C:\Export`, `datei.json:strom`. Ein Test, der eine symbolische Verknüpfung im Zielordner anlegt
und erwartet, dass nicht dahinter geschrieben wird.

#### B-5.2 — Systemverzeichnisse, Netzlaufwerke und Wechseldatenträger als Ziel
**Schwere:** mittel. **Akteure:** A-05. **Bezug:** E-011, R-11, E-001.

**Auswirkung.** Der Benutzer kann `C:\Windows\System32`, eine UNC-Freigabe `\\server\freigabe`
oder einen USB-Stick wählen. Ein Systemverzeichnis führt zu Fehlern oder, bei erhöhten Rechten,
zu einer abgelegten Datei an sehr schlechter Stelle. Eine UNC-Freigabe **schickt Kundendaten
über das Netz** — bei einem Produkt, das laut E-001 vollständig lokal ist, ist das eine
Grundsatzverletzung, die der Benutzer nicht als solche wahrnimmt. Eine nicht erreichbare Freigabe
lässt den Schreibvorgang bis zum Zeitablauf hängen; ohne Zeitgrenze friert die Oberfläche ein.

**Gegenmittel.**
1. Bekannte Systempfade abweisen: das Windows-Verzeichnis, `Program Files`, `Program Files (x86)`,
   das Wurzelverzeichnis eines Laufwerks. Verständliche deutsche Meldung mit Vorschlag.
2. UNC-Pfade und zugeordnete Netzlaufwerke werden erkannt und mit einer ausdrücklichen
   Rückfrage bestätigt: „Dieser Ordner liegt auf einem Netzlaufwerk. Die Exportdatei enthält
   lesbare Kundennotizen und verlässt damit diesen Rechner." Nicht verbieten — es kann der
   gewollte Übergabeweg an das Abrechnungstool sein — aber niemals stillschweigend zulassen.
3. Vor dem Schreiben eine **Erreichbarkeits- und Schreibprüfung mit Zeitgrenze** (Vorschlag:
   3 Sekunden). Schlägt sie fehl, endet der Export mit einer Meldung, **bevor** eine Buchung
   angefasst wird (A-8.8).
4. Der Schreibvorgang läuft nicht im Faden der Oberfläche; die Oberfläche zeigt einen Ladezustand
   und bleibt bedienbar (A-13, Abschnitt 15 verlangt Ladezustände ohnehin).

**Zuständig:** integration-dev, frontend-dev (S-07, S-09).
**Prüfung:** E2E-Fall in T-002 mit nicht existierendem Ordner: verständlicher Fehler, kein
Absturz, **keine** Buchung als exportiert markiert.

#### B-5.3 — Voreinstellung des Exportordners
**Schwere:** mittel — die Voreinstellung entscheidet, was in 95 % der Installationen passiert.
**Akteure:** A-05. **Bezug:** E-011, R-11, E-001.

**Bewertung.** Die naheliegenden Voreinstellungen sind **alle schlecht**:

- `Desktop` und `Dokumente` sind unter Windows regelmäßig über „Bekannte Ordner verschieben" in
  **OneDrive umgeleitet**. Eine Exportdatei landet dann in der Cloud — automatisch, unsichtbar,
  gegen E-001. Das ist auf einem geschäftlich verwalteten Windows-Rechner der Normalfall, nicht
  der Ausnahmefall.
- `Downloads` wird von Aufräumwerkzeugen geleert und von jedem Browser beschrieben.
- Das Installationsverzeichnis ist schreibgeschützt.

**Gegenmittel.**
1. Voreinstellung: `%LOCALAPPDATA%\Takt\exports\`. Nicht synchronisiert, nicht umgeleitet, mit
   den Rechten aus B-7.2 anlegbar, und außerhalb der Reichweite anderer Benutzer.
2. In S-07 eine Schaltfläche „Exportordner öffnen", die über die Betriebssystem-Schnittstelle
   öffnet — **nicht** über einen zusammengesetzten Shell-Befehl (`cmd /c start "<pfad>"` ist eine
   Befehlsinjektion, sobald der Pfad Anführungszeichen oder `&` enthält).
3. Wählt der Benutzer einen Ordner, der zu einem bekannten Synchronisierungsdienst gehört
   (`OneDrive`, `Dropbox`, `Google Drive`, `Nextcloud` im Pfad), erscheint derselbe Hinweis wie
   bei einem Netzlaufwerk. Eine Heuristik, kein Schutz — aber sie erwischt den häufigsten Fall.

**Zuständig:** frontend-dev (S-07, S-09), integration-dev.

#### B-5.4 — Rechte und Erzeugungsweise der Exportdatei
**Schwere:** mittel. **Akteure:** A-04, A-05. **Bezug:** A-8.8, A-8.9, R-05, R-11.

**Auswirkung.** Eine mit Standardrechten erzeugte Datei ist für andere Benutzer des Rechners
lesbar. Ein abgebrochener Schreibvorgang hinterlässt eine halbe Datei, die aussieht wie ein
gültiger Export — und A-8.8 verlangt ausdrücklich, dass genau das nicht passiert.

**Gegenmittel.**
1. Erzeugen mit `mode: 0o600` und dem Flag `wx` (Fehler statt Überschreiben). Unter Windows die
   ACL des Zielordners prüfen und, wenn es der Vorgabeordner ist, beim Anlegen einschränken.
2. **Atomar schreiben:** temporäre Datei im **selben** Ordner (nicht in `%TEMP%`, sonst ist die
   Umbenennung kein atomarer Vorgang und die Daten liegen zwischenzeitlich an einer dritten
   Stelle), `fsync`, dann umbenennen. Erst wenn die Umbenennung erfolgreich war, läuft die
   Datenbanktransaktion, die die Buchungen als exportiert markiert, und wird bestätigt.
   Reihenfolge ist wichtig: **Datei zuerst, Markierung danach.** Ein Absturz dazwischen
   hinterlässt eine Datei ohne Markierung — ärgerlich, aber ohne Geldverlust und für den
   Benutzer erkennbar. Die umgekehrte Reihenfolge hinterlässt markierte Buchungen ohne Datei;
   diese Arbeit wird nie abgerechnet.
3. Scheitert irgendetwas, wird die temporäre Datei gelöscht und **keine** Buchung markiert.
4. Der Exportname darf keine Notiz und keine Call-Nummer enthalten — der Dateiname steht in
   Verzeichnisauflistungen, Sprunglisten und Sicherungsindizes, die schwächer geschützt sind als
   der Inhalt.

**Zuständig:** integration-dev (`packages/export/**`), domain-dev (Transaktion).
**Prüfung:** Test mit erzwungenem Fehler nach dem Schreiben der temporären Datei: keine
Zieldatei, keine markierte Buchung, keine Reste.

---

### 5.6 Base64 ist keine Verschlüsselung (A-8.9, R-05, VG-4)

#### B-6.1 — Die Exportdatei ist Klartext für jeden mit Lesezugriff
**Schwere:** mittel — hoch in der Wirkung, gering in der Neuheit. **Akteure:** A-04, A-05, A-08.

**Auswirkung.** `Notiz` ist base64-kodiert (A-8.4). Jede Person und jedes Programm mit
Lesezugriff dekodiert das in einer Sekunde. Buchungsnotizen beschreiben, was für welchen Kunden
gemacht wurde — im Beispiel der Spezifikation „Fehleranalyse im Backend durchgeführt". In einer
Sammlung über Monate ist das ein Abbild der Kundenbeziehungen des Auftraggebers. Base64 wirkt
dabei aktiv schädlich: Es sieht nach Schutz aus und senkt die Sorgfalt beim Ablegen (R-05).

**Gegenmittel.**
1. In der Oberfläche, an der Stelle, an der es zählt: In S-07 steht neben dem Exportziel dauerhaft
   ein Satz wie „Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine
   Verschlüsselung." Nicht in einem Hilfetext, sondern in der Ansicht.
2. Beim ersten Export in einen neu gewählten Ordner ein einmaliger Bestätigungsdialog mit
   demselben Inhalt.
3. Das Benutzerhandbuch (T-004, documenter) führt es als eigenen Abschnitt: Wo die Dateien
   liegen, wer sie lesen kann, was nach der Übergabe an das Abrechnungstool mit ihnen geschehen
   soll.
4. Ein Aufräumangebot in S-07: „Exportdateien älter als N Tage löschen", Voreinstellung
   ausgeschaltet, aber sichtbar. Ohne das sammeln sich Jahre an Kundendaten in einem Ordner an,
   den niemand mehr ansieht.
5. Empfehlung im Handbuch, den Rechner mit BitLocker oder gleichwertig zu verschlüsseln. Takt
   kann das nicht erzwingen; es kann es aussprechen.
6. Der Weg der Datei zum Abrechnungstool (E-Mail-Anhang, Freigabe, Kopie) liegt außerhalb von
   Takt und gehört ausdrücklich ins Handbuch, statt unerwähnt zu bleiben.

**Zuständig:** frontend-dev (S-07), documenter (T-004), integration-dev (Aufräumfunktion).
**Nachtrag für später:** Eine echte Verschlüsselung der Exportdatei ist nur sinnvoll, wenn das
Abrechnungstool sie entschlüsseln kann. Das ist unbekannt. Vorschlag für den Rückstand, nicht für
jetzt — hier ausdrücklich als Restrisiko geführt (Abschnitt 9).

---

### 5.7 Die SQLite-Datei (VG-3)

#### B-7.1 — Ablageort: Roaming-Profil und Cloud-Synchronisierung
**Schwere:** hoch — und zugleich eine Korrektheitsfrage, nicht nur eine Sicherheitsfrage.
**Akteure:** A-05. **Bezug:** E-001, E-003, Spezifikation Abschnitt 1 („Anwendungsdatenverzeichnis").

**Auswirkung.** „Anwendungsdatenverzeichnis" lässt unter Windows zwei Deutungen zu:
`%APPDATA%` (Roaming) und `%LOCALAPPDATA%` (Local). Bei `%APPDATA%`:

- In Domänenumgebungen mit servergespeicherten Profilen wird der gesamte Inhalt beim An- und
  Abmelden **auf einen Dateiserver kopiert**. Die komplette Kundendatenbank liegt dann außerhalb
  des Rechners — gegen E-001, ohne dass jemand eine Entscheidung getroffen hätte.
- SQLite verträgt Netzpfade und Synchronisierungsdienste schlecht: Die Sperren funktionieren auf
  SMB unzuverlässig, und die WAL-Dateien `-wal` und `-shm` werden von Synchronisierungsdiensten
  unabhängig von der Hauptdatei kopiert. Das Ergebnis ist eine **beschädigte Datenbank**, also
  Verlust von W-04 und W-05.

**Gegenmittel.**
1. **`%LOCALAPPDATA%\Takt\`** verwenden, in Tauri `app_local_data_dir`, ausdrücklich nicht
   `app_data_dir`/`app_config_dir`, wenn diese auf Roaming zeigen. Das ist beim Aufsetzen in
   T-008 festzuschreiben und in `docs/architektur.md` (T-001) zu vermerken.
2. Beim Start prüfen, ob der Datenbankpfad auf einem Netzlaufwerk oder unter einem bekannten
   Synchronisierungsordner liegt; wenn ja, sichtbar warnen.
3. Ein Datenbankpfad ist in der Produktionsfassung nicht konfigurierbar (siehe B-1.6).

**Zuständig:** Orchestrator (T-008), domain-dev (`packages/storage/**`).
**Prüfung:** Der aufgelöste Pfad wird in einem Test gegen die erwartete Umgebungsvariable geprüft.

#### B-7.2 — Dateirechte der Datenbank und ihrer Begleitdateien
**Schwere:** hoch. **Akteure:** A-03, A-04.

**Auswirkung.** Ohne eingeschränkte Rechte liest jeder andere Benutzer des Rechners die gesamte
Kundendatenbank — einschließlich der Todo-Notizen aus A-7.2, die die Anwendung nicht einmal
exportiert. Der interne Schutz aus VG-5 ist wertlos, wenn die Datei offen liegt.

**Gegenmittel.**
1. Die Rechte werden auf dem **Verzeichnis** gesetzt, nicht nur auf der Datei: SQLite erzeugt
   `takt.sqlite-wal` und `takt.sqlite-shm` selbst, und die erben vom Verzeichnis. Ein `chmod`
   nur auf der Hauptdatei ist ein häufiger und lautloser Fehler.
2. POSIX: Verzeichnis `0700`, Dateien `0600`. Windows: Vererbung am Verzeichnis entfernen, ACL
   auf den aktuellen Benutzer und `SYSTEM` beschränken.
3. Beim Start prüfen und bei zu weiten Rechten sichtbar warnen, statt still weiterzuarbeiten.

**Zuständig:** domain-dev (`packages/storage/**`), Orchestrator (T-008).
**Prüfung:** Test, der nach der Erstinitialisierung Modus von Verzeichnis und allen drei Dateien
prüft.

#### B-7.3 — Sicherung und Kopie im laufenden Betrieb
**Schwere:** mittel. **Akteure:** A-05, A-01.

**Auswirkung.** Jede Sicherung enthält die Kundendaten im Klartext — das ist unvermeidlich und
zu dokumentieren. Gefährlicher ist die Umkehrung: Kopiert der Benutzer die `.sqlite` bei
laufender Anwendung als „Sicherung", fehlt der Inhalt der WAL-Datei. Die Kopie ist unvollständig
und wirkt intakt. Im Ernstfall stellt er sie wieder her und verliert die letzten Buchungen —
also Geld.

**Gegenmittel.**
1. Eine eigene Funktion „Datensicherung erstellen" in S-09, die `VACUUM INTO` verwendet. Das
   liefert eine in sich stimmige Datei ohne Begleitdateien.
2. Im Handbuch (T-004) ausdrücklich: nicht die laufende Datei kopieren, sondern diese Funktion
   verwenden.
3. Die Sicherungsdatei erbt dieselbe Behandlung wie der Export (B-5.4, B-6.1) — sie enthält
   **mehr** als der Export, nämlich auch die internen Todo-Notizen.
4. Kein automatischer Versand, kein automatisches Hochladen (E-001).

**Zuständig:** domain-dev, frontend-dev (S-09), documenter (T-004).

#### B-7.4 — SQL-Injektion, Erweiterungen und `ATTACH`
**Schwere:** mittel. **Akteure:** A-01 unabsichtlich, A-02/A-03 über die API.

**Auswirkung.** Auch eine Einbenutzer-Datenbank ist injizierbar. Eingaben fließen von mehreren
Seiten in Abfragen: Tag- und Ordnernamen, Notizen, Suchbegriffe (A-13.7), Call-Nummern aus
fremden E-Mails (A-06!), Vorlagen-Feldnamen. Ein Tag namens `'; DROP TABLE zeitbuchung; --` darf
nichts bewirken. Zusätzlich sind SQLite-spezifische Wege offen: geladene Erweiterungen führen
nativen Code aus, `ATTACH` öffnet beliebige Dateien als Datenbank.

**Gegenmittel.**
1. Ausschließlich parametrisierte Anweisungen. Keine Zeichenkettenverkettung in SQL — auch nicht
   für Sortierrichtung oder Spaltennamen; die kommen aus einer Positivliste im Code.
2. Der rekursive CTE für den Tag-Baum (A-4.3) bekommt seine Wurzel als Parameter und hat eine
   Tiefenbegrenzung, damit ein Zyklus in Altdaten nicht zur Endlosschleife wird (A-4.6 verhindert
   neue Zyklen; die Begrenzung schützt vor bestehenden).
3. Bei `LIKE`-Suche werden `%`, `_` und der Escape-Zeichen selbst maskiert, sonst wird jede Suche
   nach `100%` zu einer Volltabellensuche.
4. `enableLoadExtension` bleibt aus. `ATTACH` wird nicht verwendet; falls doch, nur mit festem
   Pfad aus dem Code. `PRAGMA trusted_schema=OFF`, `PRAGMA foreign_keys=ON`,
   `journal_mode=WAL`.
5. Alle Eingaben werden vor dem Speichern mit einem Schema geprüft (Zod oder gleichwertig):
   Längenbegrenzungen für Titel, Notizen, Tagnamen, Call-Nummer, Vorlagenfelder. Ohne
   Längenbegrenzung ist ein 50-MB-Notizfeld ein wirksamer Ausfall der Oberfläche.

**Zuständig:** domain-dev (`packages/storage/**`, `packages/domain/**`), unit-tester (T-010).
**Prüfung:** Tests mit Anführungszeichen, Semikolon, `--`, `%`, Nullbyte und sehr langen
Zeichenketten in Tagnamen, Notizen und Suchbegriffen. Semgrep-Regel gegen
Zeichenkettenverkettung in SQL-Aufrufen.

---

### 5.8 `WindowsUser` (E-010, A-8.5, VG-3)

#### B-8.1 — Der Wert stammt aus einer Umgebungsvariablen und ist damit setzbar
**Schwere:** mittel. **Akteure:** A-01, A-03. **Bezug:** E-010, A-8.5.

**Bewertung, wie beauftragt.** E-010 nimmt den Wert aus der Benutzereingabe heraus — das
schließt die Vertrauensgrenze in Richtung Oberfläche. Es schließt **nicht** die Grenze in
Richtung Prozessumgebung. Der bequeme Weg in Rust ist `std::env::var("USERNAME")`, und
Umgebungsvariablen setzt derjenige, der den Prozess startet. Eine Verknüpfung mit
`set USERNAME=kollege.mueller && takt.exe` genügt, und jede Exportzeile trägt einen fremden
Namen. Bei einem Feld, das in der Abrechnung darüber entscheidet, wem Arbeitszeit zugerechnet
wird, ist das relevant.

**Gegenmittel.**
1. Der Name wird über die **Betriebssystem-Schnittstelle** gelesen: `GetUserNameW` beziehungsweise
   `GetUserNameExW` über das `windows`-Crate. Ausdrücklich nicht `USERNAME`, nicht `USERPROFILE`,
   nicht `whoami` als Unterprozess (das erbt die Umgebung und die `PATH`-Suche — ein
   untergeschobenes `whoami.exe` im aktuellen Verzeichnis wäre zusätzlich eine
   Codeausführung).
2. Codeprüfung in `apps/desktop`: `env::var` kommt im Pfad des Benutzernamens nicht vor. Eine
   Semgrep-Regel dafür ist billig und dauerhaft wirksam.

**Zuständig:** frontend-dev/Orchestrator (`apps/desktop/**`, Rust-Anteil).
**Prüfung:** Manuell nach T-008: Takt mit gesetzter `USERNAME`-Variable starten, exportieren,
Wert in der Datei prüfen.

#### B-8.2 — Der Weg vom Betriebssystem in die Exportdatei
**Schwere:** mittel. **Akteure:** A-03. **Bezug:** E-004, E-010.

**Auswirkung.** Zwischen der Rust-Hülle und der Exportdatei liegen mehrere Übergaben: Hülle →
Sidecar, Sidecar → Zustand, Zustand → Vorlagenmotor → Datei. Übergibt die Hülle den Namen als
Befehlszeilenargument, ist er (a) für jeden lokalen Prozess in der Prozessliste sichtbar —
harmlos, denn er ist kein Geheimnis — und (b) **von jedem setzbar, der den Sidecar selbst
startet** (B-1.6). Wird er einmal in einer Einstellungstabelle zwischengespeichert, ist er ab
dann Datenbankinhalt und über die API oder direkt in der Datei änderbar.

**Gegenmittel.**
1. `system.windowsUser` ist eine **Funktion, die zum Exportzeitpunkt fragt**, kein gespeicherter
   Wert. Der Wert wird nicht in SQLite abgelegt und nicht in den Anwendungszustand kopiert.
2. Die Übergabe von der Hülle an den Sidecar läuft über denselben abgesicherten Startkanal wie
   das Einmalgeheimnis aus B-1.6 (`stdin` oder geerbte Umgebung des Kindprozesses), nicht über
   `argv`. Zusammen mit B-1.6 Punkt 2 ist damit der einzige Weg, den Wert zu setzen, der
   Betriebssystemaufruf.
3. Es gibt keine API-Route und kein Einstellungsfeld, das `windowsUser` schreibt. Auch nicht
   „für Tests" — Testfassungen setzen ihn über eine Einspeisung im Testaufbau, nicht über die
   Produktionsschnittstelle.
4. Hinweis für den documenter: Der Wert kann `DOMAIN\benutzer` lauten. Ob das Abrechnungstool das
   erwartet oder nur den nackten Namen, ist **offen** und gehört gefragt (siehe Abschnitt 10).
5. Der Wert ist ein Personenbezug und verlässt mit der Datei den Rechner. Das gehört ins
   Handbuch, nicht weil Takt etwas falsch macht, sondern weil es dokumentiert sein muss.

**Zuständig:** domain-dev, integration-dev (T-007), Orchestrator (T-008).
**Prüfung:** Test, dass die Standardvorlage denselben Wert liefert wie der
Betriebssystemaufruf, und dass kein Schreibpfad auf dieses Feld existiert.

---

### 5.9 Zurücksetzen des Exportstatus (E-012, A-6.9, R-10)

#### B-9.1 — Doppelabrechnung: als Missbrauch und als Unfall
**Schwere:** hoch in der Auswirkung (W-04, W-10), mittel in der Eintrittswahrscheinlichkeit.
**Akteure:** A-01. **Bezug:** E-012, A-6.9, R-10.

**Auswirkung.** *Als Unfall:* Der Benutzer setzt eine Buchung zurück, um einen Tippfehler in der
Notiz zu beheben, vergisst sie, und der nächste Export nimmt sie mit. Dieselbe Stunde wird zweimal
in Rechnung gestellt. Das fällt beim Kunden auf, nicht bei Takt. *Als Missbrauch:* Dieselbe
Handlung, absichtlich, wiederholt. Da Takt keine Rollen kennt und der Benutzer die Datenbank
ohnehin besitzt, ist **Verhindern nicht möglich** — es geht um Erschweren, Sichtbarmachen und
Nachvollziehbarkeit. Der einzige echte Gegenspieler ist die Dublettenprüfung des Abrechnungstools,
und über die weiß Takt nichts.

**Gegenmittel.**
1. **Zählerstand statt Schalter.** Neben dem zweiwertigen Exportstatus (A-6.9, bleibt wie
   spezifiziert) führt jede Buchung `exportAnzahl` (ganzzahlig, nur steigend) und
   `zuletztExportiertAm`. Eine zurückgesetzte Buchung ist damit nicht von einer nie exportierten
   unterscheidbar — außer über den Zähler, und genau der macht den Unterschied sichtbar.
2. **Sichtbare Kennzeichnung.** In S-06 und S-07 trägt jede offene Buchung mit `exportAnzahl ≥ 1`
   ein eigenes Abzeichen: „schon einmal exportiert am …". Kein Grauton, kein Symbol allein — Text.
   A-13.5 verlangt eindeutige Visualisierung des Exportstatus; das ist der dritte Zustand, den es
   in Wahrheit gibt.
3. **Der Bestätigungsdialog nennt die Folge**, nicht die Handlung: nicht „Exportstatus
   zurücksetzen?", sondern „Diese Buchung wurde am 12.08.2026 exportiert. Nach dem Zurücksetzen
   geht sie beim nächsten Export erneut an die Abrechnung. Fortfahren?" Mit Datum und Zielort des
   damaligen Exports.
4. **Zweite Hürde in der Exportansicht.** Enthält ein anstehender Export Buchungen mit
   `exportAnzahl ≥ 1`, werden sie in S-07 getrennt aufgeführt und einzeln bestätigt. Der Benutzer
   soll nicht „Exportieren" drücken und dabei versehentlich eine Wiederholung mitnehmen.
5. **Anhängendes Protokoll.** Eine Tabelle `export_protokoll` mit Buchungs-ID, Vorgang
   (`exportiert` | `zurückgesetzt`), Zeitpunkt, Lauf-ID, Vorlagenname, Zieldatei,
   Betriebssystembenutzer. Die Anwendung schreibt dort ausschließlich neue Zeilen; es gibt keinen
   Code, der ändert oder löscht, und keine Oberflächenfunktion dafür. Zusätzlich, falls machbar,
   SQLite-Trigger, die `UPDATE` und `DELETE` auf dieser Tabelle mit `RAISE(ABORT, …)` abweisen.
6. **Lauf-ID in der Exportdatei.** Jeder Exportlauf bekommt eine ID, die im Dateinamen steht und
   — als vorlagenunabhängiges Feld oder zumindest im Dateinamen — mitgeführt wird. Damit ist auf
   der Empfängerseite feststellbar, dass zwei Lieferungen dieselbe Buchung enthalten.
7. Eine Ansicht in S-09 oder S-07, die das Protokoll lesbar zeigt. Ein Protokoll, das niemand
   ansehen kann, ist keins.

**Grenzen, die ausgesprochen gehören.** Das Protokoll ist eine Spur gegen Unfälle und gegen
gelegentlichen Missbrauch. Es ist **nicht fälschungssicher**: Der Benutzer ist Eigentümer der
SQLite-Datei und kann sie mit jedem Werkzeug bearbeiten. Manipulationssicherheit bräuchte einen
Zeugen außerhalb des Rechners, und den verbietet E-001. Das ist ein bewusst getragenes
Restrisiko (Abschnitt 9), keine Lücke im Entwurf.

**Zuständig:** domain-dev (T-009, Statuswechsel und Protokoll), frontend-dev (S-06, S-07),
spec-ux-reviewer (Dialogtexte), e2e-tester (T-002).
**Prüfung:** Unit-Test, dass `exportAnzahl` beim Zurücksetzen nicht sinkt. Test, dass ein
`UPDATE` auf `export_protokoll` scheitert. E2E-Fall: exportieren, zurücksetzen, erneut
exportieren — erwartet werden zwei Protokollzeilen, `exportAnzahl = 2` und die getrennte
Anzeige in S-07.

---

### 5.10 Lieferkette (VG-7)

Zustand heute: keine Abhängigkeit installiert, keine `pnpm-lock.yaml`, keine `Cargo.lock`, kein
`node_modules`. Eine Lieferkettenprüfung ist derzeit **gegenstandslos**, nicht „bestanden".
Dieser Abschnitt ist die Vorgabeliste für T-008.

#### B-10.1 — Installationsskripte führen fremden Code aus
**Schwere:** hoch — der häufigste Weg einer npm-Kompromittierung.

**Auswirkung.** `postinstall` läuft mit den Rechten des Benutzers, sobald jemand `pnpm install`
tippt — auf dem Entwicklungsrechner und im Bauablauf. Ein übernommenes Konto in einer
Abhängigkeit dritter Ordnung genügt.

**Gegenmittel für T-008.** pnpm 10 blockiert Skripte standardmäßig; das bleibt so. Pakete, die
Skripte wirklich brauchen, kommen einzeln und mit Begründung in `onlyBuiltDependencies`. Die
Liste ist kurz und wird bei jeder Erweiterung begutachtet. `pnpm config set minimumReleaseAge`
auf einige Tage setzen, damit eine frisch veröffentlichte kompromittierte Fassung nicht sofort
einfließt.

#### B-10.2 — Nicht festgelegte Versionen
**Schwere:** mittel.

**Gegenmittel für T-008.** `pnpm-lock.yaml` und `Cargo.lock` **werden eingecheckt** — auch
`Cargo.lock`, obwohl es sich um Bibliotheken handeln mag; Takt ist eine Anwendung. Installation
im Bauablauf ausschließlich mit `--frozen-lockfile`. Exakte Versionen ohne `^` und `~` mindestens
für alles im Abrechnungspfad (`packages/export`, Datumsbibliothek, Rundung), für alles Native und
für die Werkzeuge, die das Binärprogramm erzeugen. Eine Erneuerung von Abhängigkeiten ist eine
eigene Änderung mit eigener Prüfung, nie ein Nebenprodukt.

#### B-10.3 — Native Module und heruntergeladene Vorabbauten
**Schwere:** hoch. **Betrifft:** die Wahl des SQLite-Treibers.

**Auswirkung.** `better-sqlite3` ist nativ. Bei der Installation lädt `prebuild-install` eine
fertige Binärdatei aus einer GitHub-Veröffentlichung herunter und führt sie danach im Prozess
aus. Das ist ein Binärprogramm aus dem Netz im Abrechnungspfad — die längste Kette in diesem
Projekt.

**Gegenmittel für T-008.**
1. **Zuerst `node:sqlite` prüfen** — seit Node 22 in der Laufzeitumgebung enthalten. Fällt die
   Wahl darauf, entfällt das native Modul, der Vorabbau, der Download und ein
   Kompatibilitätsproblem bei jeder Node-Aktualisierung vollständig. Da der Sidecar ohnehin mit
   einer festgelegten Node-Fassung gebündelt wird (E-004), ist die Verfügbarkeit kein Hindernis.
   Prüfpunkte: Reifegrad der Schnittstelle, Unterstützung für WAL und `VACUUM INTO` (B-7.3).
2. Bleibt es bei `better-sqlite3`: Fassung exakt festlegen, den Vorabbau **einmal** prüfen, seine
   Prüfsumme im Repository festhalten und bei jeder Installation vergleichen — oder aus dem
   Quelltext bauen und `prebuild-install` abschalten.
3. Ergebnis der Entscheidung gehört als eigener Eintrag in `decisions.md` (Orchestrator).

#### B-10.4 — Herkunft der Tauri-Vorlagen und die Rust-Seite
**Schwere:** mittel. **Bezug:** E-014, R-04.

**Gegenmittel für T-008.**
1. Gerüst ausschließlich mit `create-tauri-app` aus der offiziellen Organisation `tauri-apps`.
   Keine Vorlage aus einem Blogbeitrag, keinem Gist, keinem Video. Die erzeugten Dateien werden
   vor dem ersten Übersetzen gelesen — besonders `tauri.conf.json` und `build.rs`.
2. `Cargo.lock` einchecken, `cargo audit` beziehungsweise `cargo deny` in den Prüfablauf
   aufnehmen. Die Rust-Seite bleibt dünn (E-004), also ist die Liste kurz und die Pflege billig.
3. **Tauri-v2-Fähigkeiten nach dem Prinzip der geringsten Rechte.** Es werden genau die
   Berechtigungen erteilt, die belegbar gebraucht werden: der Ordnerauswahldialog, der
   Sidecar-Start für genau ein Binärprogramm, das Öffnen des Exportordners über die
   Betriebssystem-Schnittstelle. Ausdrücklich **nicht**: `fs:default`, `shell:allow-execute`,
   `shell:allow-open` mit weitem Bereich, `http:default`. Jede Fähigkeit steht mit Begründung im
   Entwicklerhandbuch.
4. **CSP in `tauri.conf.json` setzen**, nicht leer lassen: `default-src 'self'`,
   `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `connect-src 'self'` plus
   die Sidecar-Herkunft. Kein `unsafe-inline`, kein `unsafe-eval` — Vite erzeugt für den
   Produktionsbau nichts, was sie braucht.
   `dangerousDisableAssetCspModification` bleibt aus, `withGlobalTauri` bleibt aus.
5. Der Tauri-Aktualisierungsdienst bleibt **abgeschaltet**. Er würde signierten Code aus dem Netz
   nachladen — das widerspricht E-001 und wäre bei aktivierter Funktion der stärkste
   Lieferkettenhebel gegen den Benutzer. Falls er später gewünscht wird, ist das eine eigene
   Entscheidung mit einem eigenen Kapitel über die Signierschlüssel.

#### B-10.5 — Die Sidecar-Bündelung erzeugt ein Binärprogramm
**Schwere:** mittel. **Bezug:** E-004, R-04.

**Gegenmittel für T-008.** Festhalten, **womit** gebündelt wird (Node SEA, `pkg`, esbuild plus
festgelegte Node-Laufzeit), **welche Node-Fassung** darin steckt und **welche Prüfsumme** das
Ergebnis hat. Der Ablauf ist wiederholbar zu beschreiben. Ein Bündelwerkzeug, das seinerseits
Binärdateien aus dem Netz zieht, wird angemerkt und mit Prüfsumme festgenagelt. Node-Fassung mit
Sicherheitsunterstützung wählen und ihr Ende der Unterstützung im Entwicklerhandbuch vermerken.

#### B-10.6 — Office.js kommt zwingend von einem Microsoft-Server
**Schwere:** niedrig, aber eine ehrliche Einschränkung von E-001.

**Auswirkung.** Office-Add-ins müssen `office.js` von
`https://appsforoffice.microsoft.com/lib/1/hosted/office.js` laden; Microsoft verlangt das und
aktualisiert die Datei laufend. Eine Integritätsprüfung per SRI ist deshalb praktisch nicht
haltbar. Das Add-in ist also **nicht** vollständig offline, anders als der Rest von Takt.

**Gegenmittel.** Als Ausnahme dokumentieren, nicht verschweigen (documenter, T-004). Die
Add-in-Seite lädt sonst **nichts** von außen: keine Schriftart aus einem CDN, kein Icon-Paket,
keine Analysebibliothek. Die CSP der Add-in-Seite erlaubt genau diese eine Herkunft für Skripte
und `connect-src` nur auf `http://127.0.0.1:PORT`. `AppDomains` im Add-in-Manifest ist eng
gesetzt.

#### B-10.7 — Abhängigkeitsdisziplin im Abrechnungspfad
**Schwere:** mittel.

**Gegenmittel.** In `packages/domain` und `packages/export` gilt: erst die Laufzeitumgebung
(`node:crypto`, `Intl`, `Temporal`/`Date`), dann eine Abhängigkeit. Rundung (E-008),
Base64-Kodierung (A-8.4) und Viertelstundenlogik werden nicht durch ein Kleinstpaket erledigt.
Jede Abhängigkeit im Abrechnungspfad ist eine Stelle, an der ein Fremder das Ergebnis
beeinflussen kann.

**Prüfung nach T-008.** `pnpm audit`, ein Abgleich gegen die OSV-Datenbank und ein erneuter
Anlauf der Semgrep-Lieferkettenprüfung, sobald eine `pnpm-lock.yaml` existiert. Erst dann ist
die Aussage „keine bekannten Schwachstellen" überhaupt möglich.

---

### 5.11 Repository-Hygiene

#### B-11.1 — Befund: keine Geheimnisse, keine Kundendaten, keine echten Call-Nummern
**Ergebnis der Prüfung vom 2026-08-31.**

Der Baum umfasst 18 Dateien, ausschließlich Markdown und `.claude/settings.json`. Geprüft wurde:

- Semgrep CLI mit `p/default` und `p/secrets`: **0 Befunde** bei 53 anwendbaren Regeln.
- Suche nach Schlüsselmustern (`api_key`, `secret`, `password`, `token`, `Bearer`,
  `BEGIN … PRIVATE KEY`, `sk-…`, `ghp_…`, `AKIA…`, `xox…`): Drei Treffer, alle harmlos — zwei
  Werkzeugnamen (`…get_semgrep_secrets_findings`) und das deutsche Wort „Farbtoken" in
  `.claude/agents/frontend-dev.md`.
- Suche nach Call-Nummern-Mustern (`CALL-…`, `INC…`, `TICKET…`, Ziffernfolgen ab sechs Stellen):
  **kein Treffer.**
- Suche nach E-Mail-Adressen: **kein Treffer.**
- `docs/spec.md` verwendet in den Beispielen `"..."` statt echter Werte. Korrekt.

**Urteil für den heutigen Stand: sauber.** Die Aussagekraft ist gering, weil es keinen Code gibt.

#### B-11.2 — Es gibt keine `.gitignore` und kein Git-Repository
**Schwere:** hoch, weil der Zeitpunkt entscheidet. **Bezug:** CLAUDE.md, Abschnitt Sicherheit.

**Auswirkung.** `/home/kerem/Projects/SuperTakt` ist kein Git-Repository, und eine `.gitignore`
existiert nicht. In T-008 werden `pnpm install` und der erste Anwendungsstart Folgendes erzeugen:
`node_modules/`, `dist/`, `target/`, die SQLite-Datei samt `-wal` und `-shm`, die Tokendatei und
den Vorgabe-Exportordner mit Kundendaten. Wird danach — womöglich mit `git add -A` —
versioniert, landen **Token und Kundendaten in der Historie**. Aus einer Git-Historie bekommt man
sie praktisch nicht wieder heraus, und ein einmal veröffentlichtes Token ist verbrannt.

**Gegenmittel — Reihenfolge ist das Gegenmittel.**
1. **Bevor** in T-008 irgendetwas installiert oder gestartet wird: `.gitignore` anlegen, dann
   `git init`. Mindestinhalt: `node_modules/`, `dist/`, `build/`, `target/`, `.vite/`,
   `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`, `*.db`, `exports/`, `*.takt-export.json`,
   `token`, `*.token`, `.env`, `.env.*`, `*.pem`, `*.key`, `playwright-report/`,
   `test-results/`, `.DS_Store`.
2. Vorgabe-Exportordner und Datenbank liegen ohnehin unter `%LOCALAPPDATA%` und damit außerhalb
   des Repositoriums (B-5.3, B-7.1). Die `.gitignore` ist die zweite Sicherung, nicht die erste.
3. Testdaten sind erfunden und liegen unter `tests/fixtures/` (CLAUDE.md). Der e2e-tester (T-002)
   legt sie an; sie enthalten keine echten Kundennamen und keine echten Call-Nummern. Vorschlag
   für erkennbar erfundene Nummern: Präfix `TEST-` oder ein Nummernraum, den der Auftraggeber
   nachweislich nicht verwendet — das ist bei ihm zu erfragen.
4. Eine Geheimnisprüfung vor dem Übertragen einrichten (`gitleaks` oder eine Semgrep-Regel auf
   das Tokenpräfix `takt_` aus B-2.1). Weder `gitleaks` noch `trufflehog` sind derzeit auf dem
   Rechner installiert.

**Zuständig:** Orchestrator (T-008 — `.gitignore` ist eine gemeinsame Datei).

#### B-11.3 — Beobachtungen zum Berechtigungsschema
**Schwere:** niedrig. **Bezug:** R-07, T-B03.

`.claude/settings.json` enthält bereits ein ausgearbeitetes Berechtigungsschema mit `allow`,
`ask` und `deny`. R-07 und T-B03 führen es noch als blockiert. Offenbar hat der Auftraggeber es
selbst übernommen; das ist dem Orchestrator zur Prüfung gemeldet, damit Risiko und Board den
Stand abbilden (der security-checker ändert diese Datei nicht).

Zwei inhaltliche Anmerkungen zum vorhandenen Schema, ebenfalls für den Orchestrator:

1. Die `deny`-Liste sperrt `.env`, `*.pem` und `*.key` fürs Lesen. Nach T-008 kommen mit
   `*.sqlite*`, dem Exportordner und der Tokendatei drei Pfade hinzu, die dieselbe Sperre
   verdienen — sonst kann ein Agent Kundendaten in seinen Kontext ziehen, und das ist kein
   theoretischer Fall, sondern die naheliegende Folge einer Fehlersuche.
2. Es gibt keinen `deny`-Eintrag auf das Schreiben von `.claude/settings.json` selbst. Ob das
   gewollt ist, entscheidet der Auftraggeber.

**Nachtrag T-067.** Beide Anmerkungen sind unverändert offen, und die Datei geht mit in die
Veröffentlichung. Dazu kommt ein dritter Punkt, der erst durch die Veröffentlichung entsteht —
siehe B-11.4 Punkt 3: Sämtliche zwölf `allow`- und `deny`-Regeln stehen mit dem absoluten Pfad
`/home/kerem/...`. Bei jedem, der das Repository klont, greift **keine** davon.

---

#### B-11.4 — Der erste Commit ist die Veröffentlichung
**Schwere:** hoch, weil der Zeitpunkt entscheidet und die Wirkung nicht zurücknehmbar ist.
**Bezug:** T-067, B-11.1, B-11.2. **Rolle:** Auftraggeber, security-checker.

**Auswirkung.** B-11.2 hat in T-003 den Fall beschrieben, dass ein `git add -A` nach dem ersten
`pnpm install` Datenbank, Token und Exportordner mitnimmt. Die `.gitignore` aus T-008a hat das
abgewendet. Der Fall, den T-067 hinzufügt, ist ein anderer und schärfer: Das Repository geht
**öffentlich**, und es ist bis dahin **nie committet** worden. Es gibt keinen Verlauf, in dem
etwas versehentlich stünde — es gibt genau einen Commit, und der enthält alles auf einmal.

Der Unterschied zu jedem anderen Befund dieses Dokuments: Ein Fehler im Code wird behoben und
ist weg. Ein veröffentlichtes Geheimnis ist in Kopien, Zwischenspeichern und Suchmaschinen und
bleibt es. Ein späteres `git rm` und ein erzwungener Push entfernen nichts.

**Gegenmittel.**

1. **Der Umfang wird gemessen, nicht geschätzt.** `git status --porcelain -uall` listet den Baum,
   der veröffentlicht würde. Vor dem ersten Commit geht diese Liste **vollständig** durch eine
   Prüfung — nicht eine Stichprobe. In T-067 waren das 473 Dateien.
2. **Ignorierregeln mit Suffix.** Die Regeln `playwright-report/` und `test-results/` treffen nur
   die Vorgabenamen. Die vier Playwright-Konfigurationen unter `tests/e2e/` hängen ein Suffix an
   und erzeugen `playwright-report-e2e/`, `-web-build/`, `-outlook-build/` und die drei
   zugehörigen `test-results-*`. Sechs Ordner, die durch das Raster fielen. In T-067 auf
   `playwright-report*/`, `test-results*/`, `blob-report*/`, `coverage*/` erweitert. Dieselbe
   Sorte Lücke traf `Export/` mit grossem E gegen die Regel `exports/`; auch das ist ergänzt.
   **Die allgemeine Lehre:** Eine Ignorierregel, die einen exakten Namen nennt, ist eine
   Vermutung über die Werkzeugkette. Werkzeuge hängen Suffixe an.
3. **Absolute Pfade in mitgelieferter Konfiguration.** `.claude/settings.json` nennt zwölfmal
   `/home/kerem/...`. Das ist erstens eine Preisgabe von Benutzername und Ablage — geringfügig,
   weil derselbe Name ohnehin in der Git-Identität steht. Es ist zweitens ein **funktionaler**
   Mangel, der schwerer wiegt: Wer klont, bekommt eine Datei, in der die `deny`-Regeln auf
   `~/.ssh`, `~/.aws`, `~/.gnupg` und `**/.env` **nicht mehr greifen**, weil sie auf einen Pfad
   zeigen, den es auf seinem Rechner nicht gibt. Eine Schutzregel, die still ins Leere zeigt,
   ist schlechter als keine, weil sie gelesen wird und beruhigt. Relative Muster (`./**`,
   `~/.ssh/**`) lösen beides zugleich.
4. **Testberichte werden angesehen, bevor sie ignoriert werden.** Ein Bericht, der ausgeschlossen
   wird, ist kein geprüfter Bericht. Steht dort echtes Material, ist das ein Befund über die
   **Testdaten** und nicht über die `.gitignore` — die Testdaten laufen weiter, der Bericht wird
   beim nächsten Lauf neu erzeugt. In T-067 nachgesehen: sauber (13.3).

**Prüfung.** Vor dem ersten Commit: `git status --porcelain -uall` vollständig durchgehen;
`git check-ignore -v` gegen jede Datei in jedem Berichtsordner; Mustersuche nach Geheimnissen,
E-Mail-Adressen, absoluten Pfaden, Call-Nummern und nicht-loopback-Adressen über die
gesamte Liste.

---

#### B-11.5 — Lizenz, Urheberschaft und fremdes Urheberrecht
**Schwere:** mittel — nicht für die Vertraulichkeit, sondern für die Rechtslage.
**Bezug:** T-067. **Rolle:** Auftraggeber.

**Auswirkung.** Zwei entgegengesetzte Fehler, beide nach der Veröffentlichung schlecht zu
korrigieren:

- **Keine Lizenz.** Dann gilt volles Urheberrecht. Der Code ist sichtbar, aber niemand darf ihn
  benutzen, kopieren oder ableiten. Wer ihn trotzdem benutzt, tut es unrechtmäßig — meist ohne
  es zu wissen, weil „auf GitHub" als Erlaubnis missverstanden wird.
- **Eine Lizenz, die weiter reicht als die Rechte, die man hat.** Wer MIT vergibt, sagt zu, dass
  jeder den Code kopieren, verändern und verkaufen darf. Steht im Baum ein Ausschnitt, dessen
  Urheberrecht jemand anderem gehört, oder verlangt eine Abhängigkeit strengere Bedingungen,
  dann ist diese Zusage nicht gedeckt. Sie zurückzunehmen geht nicht: Eine einmal erteilte
  MIT-Lizenz ist unwiderruflich für jede Fassung, die jemand erhalten hat.

**Gegenmittel.**

1. **Die Entscheidung trifft der Auftraggeber, nicht der Prüfer.** Der Prüfer stellt fest, was
   die Entscheidung trägt. Stand T-067: `LICENSE` liegt an der Wurzel (MIT, „Copyright (c) 2026
   KuyomieKurama"), und alle neun `package.json` tragen `"license": "MIT"`.
2. **Lizenzangaben müssen über alle Ökosysteme hinweg dasselbe sagen.** Ein Repository mit einer
   MIT-`LICENSE` und einer Paketdatei, die `UNLICENSED` sagt, hat zwei Aussagen und deshalb
   keine. Der Fall ist in diesem Projekt eingetreten und behoben: `apps/desktop/src-tauri/Cargo.toml`
   stand auf `license = "UNLICENSED"` (Befund V-2, 13.4), seit dem 2026-09-02 auf `"MIT"`.
   **Warum das leicht übersehen wird:** Der Abgleich der neun `package.json` war sauber; die
   zehnte Lizenzangabe lag in einem anderen Ökosystem. Wer nur ein Paketformat prüft, prüft
   nicht das Repository.
3. **Abhängigkeiten prüfen, bevor die Lizenz vergeben wird.** Eine Copyleft-Abhängigkeit im
   Auslieferungspfad zwingt das Ergebnis unter ihre Bedingungen. Der Abgleich läuft über den
   **aufgelösten** Baum, nicht über die direkten Angaben in den Paketdateien — die transitive
   Abhängigkeit ist der Fall, den man übersieht.
4. **Fremde Urheberrechtshinweise suchen.** Kopierte Beispielausschnitte, Dateiköpfe aus
   Vorlagen, Symbole. Suchmuster: `Copyright`, `(c) JJJJ`, `©`, `SPDX-License-Identifier`,
   `All rights reserved`, dazu `adapted from`, `based on`, `taken from`.
5. **Weitergabepflichten der permissiven Lizenzen sind nicht null.** Apache-2.0 verlangt beim
   Weitergeben des Erzeugnisses, Lizenztext und `NOTICE` mitzuliefern. Das betrifft nicht die
   Veröffentlichung des Quelltextes, wohl aber die `.deb`, die `.AppImage` und den gebündelten
   Sidecar.

**Prüfung.** Lizenzfeld jeder Paketdatei und jeder `Cargo.toml` gegen die `LICENSE` an der
Wurzel; Lizenzabgleich über den aufgelösten Paketspeicher; Mustersuche nach fremden
Urheberrechtshinweisen über den gesamten zu veröffentlichenden Baum.

---

### 5.12 Querschnittliches

#### B-12.1 — XSS im Tauri-Webview wiegt schwerer als im Web
**Schwere:** hoch, falls HTML gerendert wird. **Betrifft:** VG-9, W-11.

**Auswirkung.** Notizen, Titel und Tagnamen sind Freitext; über das Add-in fließt zusätzlich
E-Mail-Inhalt hinein (A-06 kontrolliert ihn). React maskiert von sich aus — bis jemand
`dangerouslySetInnerHTML` einsetzt, weil Notizen „ein bisschen Formatierung" bekommen sollen.
Ein XSS im Tauri-Webview steht nicht in einer Sandbox: Dahinter liegen die Tauri-Befehle, also
Dateisystem und Prozessstart. Aus einem Skript in einer Notiz kann Codeausführung auf dem
Rechner werden.

**Gegenmittel.**
1. Kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein `eval`, kein `new Function` in
   `apps/web/**` und `apps/outlook-addin/**`. Als Lint-Fehler festschreiben, nicht als Warnung.
2. Wird später Markdown gewünscht: mit abgeschaltetem Roh-HTML rendern und anschließend
   bereinigen (DOMPurify), `javascript:`- und `data:`-URLs entfernen.
3. Verweise in Notizen werden nicht im Webview geöffnet, sondern über die
   Betriebssystem-Schnittstelle im Standardbrowser, und nur nach Prüfung auf `http:`/`https:`.
   `file:` und `javascript:` werden abgewiesen.
4. Die CSP aus B-10.4 wirkt als zweite Ebene.

**Zuständig:** frontend-dev, integration-dev, code-reviewer.
**Prüfung:** Semgrep-Regel auf `dangerouslySetInnerHTML`; ein Test, der eine Notiz mit
`<img src=x onerror=alert(1)>` speichert und anzeigt.

#### B-12.2 — Protokolldateien des Sidecars
**Schwere:** mittel. **Akteure:** A-04, A-05.

**Auswirkung.** Ein Dienst, der Anfragen protokolliert, protokolliert Notizen, Call-Nummern und
womöglich Tokens (B-2.4). Die Protokolldatei hat selten die Rechte der Datenbank und liegt oft
länger.

**Gegenmittel.** Vorgabestufe niedrig. Keine Anfragerümpfe, keine Antwortrümpfe, keine Notizen,
keine Call-Nummern, keine Kopfzeilen. Protokolliert werden Zeit, Methode, Pfad ohne
Abfrageparameter, Statuscode, Dauer. Ablage neben der Datenbank mit denselben Rechten (B-7.2),
Umlauf mit Größen- und Altersgrenze. Ein ausführlicher Ablaufmodus ist möglich, aber nur nach
ausdrücklichem Einschalten, mit sichtbarem Hinweis in der Oberfläche, dass Kundendaten in die
Datei geschrieben werden, und mit automatischer Abschaltung beim nächsten Start.

**Zuständig:** domain-dev (T-011).

#### B-12.3 — E-Mail-Inhalt wandert unbemerkt in die Abrechnung
**Schwere:** mittel. **Akteure:** A-06. **Betrifft:** VG-5, VG-8. **Bezug:** A-10.5, A-7.2, A-7.4.

**Auswirkung.** A-10.5 erlaubt, „relevante Informationen aus der E-Mail" zu übernehmen. Landet
dieser Text in der **Buchungsnotiz**, geht er nach A-7.4 in den Export — also Inhalt aus der
E-Mail eines Dritten an das Abrechnungstool, möglicherweise mit Angaben, die dort nichts zu
suchen haben. Es ist derselbe Grenzfall wie R-08, nur mit fremdem Text.

**Gegenmittel.**
1. Übernommener E-Mail-Text geht standardmäßig in die **Todo-Notiz** (intern, A-7.2), nicht in
   die Buchungsnotiz. Das ist die richtige Vorgabe: Kontext bleibt intern.
2. Was übernommen wird, ist im Add-in vor dem Anlegen sichtbar und änderbar. Keine stille
   Übernahme.
3. Länge begrenzen (Vorschlag: 4000 Zeichen) und beim Übernehmen kürzen, statt einen ganzen
   Zitatverlauf mitzuschleppen.
4. In S-12 ist beschriftet, welches Feld intern bleibt und welches in die Abrechnung geht —
   dieselbe Beschriftung wie in der Hauptanwendung (R-08, Glossar aus T-004).

**Zuständig:** integration-dev (S-12), spec-ux-reviewer (Beschriftung), documenter (T-004).

#### B-12.4 — Uhrzeit und Dauer stammen aus der lokalen Uhr
**Schwere:** niedrig. **Akteure:** A-01.

**Auswirkung.** Start und Ende einer Buchung kommen von der Systemuhr, die der Benutzer stellt.
Damit sind Dauern manipulierbar. Nachträgliches Bearbeiten von Buchungen ist ohnehin vorgesehen.

**Gegenmittel.** Kein technisches, es gibt keins ohne externen Zeitgeber (E-001). Was hilft:
Dauer aus einer monotonen Uhr (`performance.now`, `Instant`) berechnen statt aus der Differenz
zweier Wanduhrzeiten, damit eine Zeitumstellung, ein Zeitzonenwechsel oder eine
Zeitsynchronisierung während eines laufenden Timers die Dauer nicht verfälscht — das ist
gleichzeitig ein Korrektheitsgewinn. Negative und unplausibel lange Dauern (Vorschlag: über
24 Stunden) werden abgewiesen und angezeigt. Bewusst getragenes Restrisiko.

**Zuständig:** domain-dev (T-009), unit-tester (T-010).

#### B-12.5 — Zwei Instanzen auf derselben Datenbank
**Schwere:** mittel. **Bezug:** A-8.8, E-004.

**Auswirkung.** Startet Takt zweimal, laufen zwei Sidecars auf derselben Datei. Zwei gleichzeitige
Exporte können dieselben offenen Buchungen lesen, beide schreiben eine Datei, beide markieren —
oder einer markiert, während der andere schon gelesen hat. Ergebnis: dieselbe Buchung in zwei
Exportdateien. Das ist B-9.1 auf technischem Weg, ohne dass jemand etwas falsch gemacht hätte.

**Gegenmittel.** Einzelinstanz-Sperre in der Tauri-Hülle (das offizielle
`single-instance`-Plugin); ein zweiter Start holt das vorhandene Fenster nach vorn. Zusätzlich
belegt der Sidecar den Port exklusiv (B-1.5). Unabhängig davon läuft die Markierung der
Buchungen in **einer** Transaktion, die mit `BEGIN IMMEDIATE` beginnt, sodass die Auswahl der
offenen Buchungen und ihre Markierung nicht auseinanderfallen können.

**Zuständig:** Orchestrator (T-008), domain-dev (T-009).

---

## 6. Was zuerst gebaut wird

Nach Verhältnis von Schaden zu Aufwand geordnet. Die ersten sieben Punkte sind die, ohne die
Takt nicht ausgeliefert werden sollte.

| Rang | Gegenmittel | Bedrohung | Aufgabe | Rolle |
|---|---|---|---|---|
| 1 | Token-Prüfung als erste Middleware vor allen Routen | B-1.1 | T-011 | domain-dev |
| 2 | `Host`-Positivliste gegen DNS-Rebinding | B-1.3 | T-011 | domain-dev |
| 3 | Feste CORS-Positivliste, kein Platzhalter, keine Cookies | B-1.2, B-1.4 | T-011 | domain-dev |
| 4 | Geschlossene Auswahlliste für Feldquellen statt Freitextpfad | B-3.1 | T-007 | integration-dev |
| 5 | Zeitkonstanter Vergleich, kein Token in Protokoll und URL | B-2.4, B-2.5 | T-011 | domain-dev |
| 6 | Token nicht in `RoamingSettings` | B-2.8 | T-007/Add-in | integration-dev |
| 7 | `%LOCALAPPDATA%` statt Roaming, Rechte auf dem Verzeichnis | B-7.1, B-7.2 | T-008 | Orchestrator, domain-dev |
| 8 | Regex im Worker mit Zeitgrenze, Erfassungsgruppe erzwungen | B-4.1, B-4.3 | Add-in | integration-dev |
| 9 | Leere Call-Nummer ist nie ein Übereinstimmungskriterium | B-4.3 | T-009 | domain-dev |
| 10 | Atomarer Schreibvorgang, Datei vor Markierung | B-5.4 | T-007 | integration-dev |
| 11 | Pfadprüfung und Ordnerauswahldialog statt Freitext | B-5.1 | T-007, S-09 | integration-dev, frontend-dev |
| 12 | `exportAnzahl`, anhängendes Protokoll, zweite Hürde in S-07 | B-9.1 | T-009 | domain-dev, frontend-dev |
| 13 | `.gitignore` **vor** der ersten Installation | B-11.2 | T-008 | Orchestrator |
| 14 | Tauri-Fähigkeiten und CSP eng, Aktualisierungsdienst aus | B-10.4 | T-008 | Orchestrator |
| 15 | Benutzername über `GetUserNameW`, nicht über die Umgebung | B-8.1 | T-008 | Orchestrator |
| 16 | Parametrisierte Anweisungen, keine Erweiterungen | B-7.4 | T-009 | domain-dev |
| 17 | Kein `dangerouslySetInnerHTML`, kein `eval` — als Lint-Fehler | B-12.1, B-3.3 | T-008 | Orchestrator |
| 18 | Einzelinstanz-Sperre und `BEGIN IMMEDIATE` | B-12.5 | T-008, T-009 | Orchestrator, domain-dev |

---

## 7. Prüfungen, die aus diesem Modell folgen

Für T-010 (unit-tester) und T-002 (e2e-tester). Jede dieser Prüfungen belegt genau ein
Gegenmittel; ohne sie ist das Gegenmittel eine Absichtserklärung.

**Unit- und Integrationsebene**

1. Jede registrierte Route ohne Token → 401. Der Test läuft über die Routenliste, nicht über eine
   von Hand gepflegte Aufzählung. (B-1.1)
2. `Host: evil.example` → 403/421, ohne Datenbankzugriff. (B-1.3)
3. Herkunftstabelle mit `https://tauri.localhost.evil.example`, `null`, leer. (B-1.4)
4. Einfache Anfrage (`text/plain`, ohne Token, fremde Herkunft) gegen jede zustandsändernde
   Route → keine Wirkung. (B-1.2)
5. Tokenvergleich mit gleich- und ungleichlangen Eingaben; kein `===` im Nachweispfad. (B-2.5)
6. Protokollausgabe und Antwortkörper des gesamten Testlaufs enthalten `takt_` nirgends. (B-2.4)
7. Neues Token erzeugt → altes ergibt sofort 401. (B-2.7)
8. **Eigenschaftstest über beliebige Exportvorlagen: Die Todo-Notiz erscheint nie im Ergebnis —
   weder im Klartext noch base64-kodiert.** (B-3.1)
9. Vorlage mit unbekanntem Quellschlüssel, direkt in die Speicherung geschrieben → Export bricht
   ab. (B-3.1)
10. Feldnamen `__proto__`, `constructor`, `prototype` und Duplikate → abgewiesen. (B-3.2)
11. Bösartiges Muster mit passender Eingabe → Abbruch nach der Zeitgrenze, Gesamtlaufzeit
    begrenzt. (B-4.1)
12. Ungültige Muster `[`, `(`, `\`, `""` → verständlicher Fehler, Add-in bleibt bedienbar. (B-4.2)
13. Duplikatsuche mit leerer Call-Nummer → nie ein Treffer. (B-4.3)
14. Pfadprüfung mit `..`, absolutem Pfad, `C:\Export-Geheim` gegen `C:\Export`,
    `datei.json:strom`, symbolischer Verknüpfung. (B-5.1)
15. Fehler nach dem Schreiben der temporären Datei → keine Zieldatei, keine Markierung, keine
    Reste. (B-5.4)
16. `exportAnzahl` sinkt beim Zurücksetzen nicht; `UPDATE` auf `export_protokoll` scheitert. (B-9.1)
17. Tagnamen und Notizen mit `'`, `;`, `--`, `%`, Nullbyte und Überlänge. (B-7.4)
18. Modus von Datenbankverzeichnis, `.sqlite`, `-wal`, `-shm`, Tokendatei und Exportdatei nach
    der Erstinitialisierung. (B-2.2, B-5.4, B-7.2)

**End-to-End**

19. Export in einen nicht existierenden Ordner → verständlicher Fehler, **keine** Buchung
    markiert. (B-5.2)
20. Exportieren, zurücksetzen, erneut exportieren → zwei Protokollzeilen, `exportAnzahl = 2`,
    getrennte Anzeige in S-07. (B-9.1)
21. Muster `.*` in S-13, zwei E-Mails verschiedener Kunden → zwei getrennte Todos, kein
    Zusammenlegen. (B-4.3)
22. Notiz mit `<img src=x onerror=…>` speichern und in allen Ansichten anzeigen → als Text
    dargestellt. (B-12.1)
23. Token verdeckt; Klartext erst nach ausdrücklicher Handlung im DOM. (B-2.3)

**Nachtrag T-023**

24. **Jede registrierte Route außerhalb von `/api/v1/addin` ergibt mit einem gültigen
    Add-in-Token 401.** Der Test läuft über die Routenliste des Dienstes, nicht über eine von
    Hand gepflegte Aufzählung — sonst ist die nächste neue Fachroute die vergessene. Gegenprobe:
    dieselben Routen mit dem Sitzungsgeheimnis ergeben nicht 401. (B-2.10)
25. Vorlagenfeldnamen `__proto__`, `constructor`, `prototype`, ein Name außerhalb von
    `[A-Za-z0-9_-]{1,64}` und zwei Felder gleichen Namens werden beim **Speichern** abgewiesen;
    zusätzlich baut der Renderer die Zeile über `Object.create(null)`. (B-3.2, TP-SEC-07)
26. Nach der Erstinitialisierung tragen `takt.db`, `takt.db-wal`, `takt.db-shm` und die
    Sicherungskopie des Migrationsläufers den Modus `0600`; ein zu weiter Modus führt beim Start
    zu einer sichtbaren Warnung. (B-7.2)

**Nachtrag T-136 — die Versionsprüfung (Abschnitt 18).** Diese acht Prüfungen sind **vor** dem Bau
geschrieben. Sie sind die Bedingung für die Abnahme von T-138 und T-139, nicht ihr Nachklang.

27. **Weiterleitung.** Ein Prüfserver antwortet `302` auf ein zweites Ziel. Erwartet: stiller
    Fehlschlag der Versionsprüfung **und null** eingegangene Anfragen am Umleitungsziel. Die
    zweite Hälfte ist die Aussage. (B-18.3, A-V-3)
28. **Obergrenze gegen die entpackte Größe.** Eine gzip-Antwort mit rund 51 KiB auf der Leitung
    und 50 MiB Inhalt führt zum Abbruch vor 65 537 gelesenen Bytes und zu **keinem** `JSON.parse`.
    Eine Prüfung, die nur `content-length` liest, muss an diesem Fall rot werden. (B-18.1, A-V-6)
29. **Frist über den ganzen Vorgang.** Ein Prüfserver schreibt `{"a":` und schweigt. Erwartet:
    Ende nach höchstens 5 500 ms, still, ohne Wurf nach außen. (B-18.1, A-V-5)
30. **Gestalt der Antwort.** `tag_name` als `null`, `42`, `{}`, `[]`, `true`, fehlend, leer, mit
    60 000 Zeichen, als `../../evil`, als `1.2.3?x=1`; dazu ein tief verschachtelter Rumpf. Jeder
    Fall ergibt einen stillen Fehlschlag ohne Wurf und ohne Anzeige. (B-18.1, A-V-7, A-V-8)
31. **Die Adresse entsteht nicht aus der Antwort.** Der Rust-Befehl `takt_open_release` wird mit
    den zehn Ausbruchsversuchen aus 18.3 gefahren und gibt jedes Mal `Err` zurück, ohne zu
    öffnen. Gegenprobe: `capabilities/**` enthält kein `shell:`, und `apps/web/src` enthält kein
    `href` auf github.com. (B-18.2, A-V-16, A-V-17, A-V-18)
32. **Kein Netzaufruf aus einem Anfragebehandler.** Die Route wird 100-mal aufgerufen; am
    Prüfserver kommt **eine** ausgehende Anfrage an. (B-18.4, A-V-10)
33. **Die Kopfzeilen gegen eine feste Liste.** Ein Prüfserver zeichnet **alle** eingegangenen
    Kopfzeilen auf; der Vergleich läuft gegen eine geschlossene Liste und wird rot, sobald eine
    hinzukommt. Gegenprobe: die installierte Fassung kommt als Zeichenkette in keiner Kopfzeile
    und in keinem Teil der Adresse vor. (B-18.5, A-V-13)
34. **Kein Weg führt zu einem Download.** Über den gesamten Vorgang — Dienst, Oberfläche, Hülle —
    entsteht keine Datei und startet kein Prozess außer dem Öffnen des Browsers. (A-18.9)

---

## 8. Sicherheitstor je Aufgabe

| Aufgabe | Freigabe durch security-checker setzt voraus |
|---|---|
| T-007 Exportvorlagen | B-3.1 bis B-3.5, B-5.1, B-5.4, B-8.2. Prüfung 8 aus Abschnitt 7 ist die Kernprüfung. |
| T-008 Gerüst | B-7.1, B-7.2, B-10.1 bis B-10.5, B-11.2, B-12.1, B-12.5. Zusätzlich: erster echter Semgrep-Lauf über Code, erster Lieferkettenlauf über `pnpm-lock.yaml`. |
| T-009 Fachlogik | B-4.3 (Duplikatregel), B-7.4, B-9.1, B-12.4, B-12.5. |
| T-011 Token und Dienst | B-1.1 bis B-1.7, B-2.1 bis B-2.7, B-12.2. Zusätzlich: OpenAPI-Beschreibung erzeugen und 42Crunch-Audit fahren; danach 42Crunch-Scan gegen den laufenden Dienst. |
| Add-in | B-2.8, B-4.1 bis B-4.4, B-10.6, B-12.1, B-12.3. |

**Nachtrag T-023.** Zwei Tore kommen hinzu, und eines ist neu zu bewerten:

| Aufgabe | Freigabe durch security-checker setzt voraus |
|---|---|
| Nachfolgeaufgabe zu B-2.10 | Prüfung 24. Ohne sie ist die Trennung der beiden Geheimnisse eine Absichtserklärung im Kommentar. |
| Nacharbeit zu T-007 | Prüfungen 25 (B-3.2) und die Ordnerwahl aus B-5.1 Punkt 1 samt der Rückfragen aus B-5.2. |
| Nacharbeit zu T-008 | Prüfung 26 (B-7.2 auf der Datenbank), `PRAGMA trusted_schema = OFF`, `cargo audit` im Prüfablauf. |
| **T-138 Dienst und Domäne (Versionsprüfung)** | B-18.1, B-18.3, B-18.4, B-18.6, B-18.7 und die Auflagen A-V-1 bis A-V-14, A-V-19, A-V-20 aus 18.9. Prüfungen 27, 28, 29, 30, 32, 33. Zusätzlich: `proof:route-policy` Abschnitt 4 prüft **eine Route mehr** als vorher und bleibt grün; `pnpm-lock.yaml` wächst nicht. |
| **T-139 Hülle und Oberfläche (Versionsprüfung)** | B-18.2 und die Auflagen A-V-15 bis A-V-18. Prüfungen 31 und 34. Ohne die Ausbruchsliste als Prüffälle **neben** dem Rust-Befehl gibt es keine Freigabe — nach T-136-1 ist diese Prüfung die Vertrauensgrenze und nicht ihre Bestätigung. |
| T-011, Torbedingung 42Crunch | **Derzeit nicht einlösbar** (Abschnitt 0). Der Orchestrator entscheidet: Zugang beschaffen oder das Tor durch eine benannte Ersatzprüfung ersetzen. Als erfüllt geführt werden darf es nicht. |

---

## 9. Restrisiko

Was auch bei vollständiger Umsetzung aller Gegenmittel bleibt. Bewusst getragen, nicht übersehen.

**Grundannahmen.** Takt schützt nicht gegen einen Angreifer, der bereits Administrator auf dem
Rechner ist, und nicht gegen den Benutzer selbst in seiner Rolle als Eigentümer seiner Daten.
Beides ist bei einer lokalen Einbenutzeranwendung ohne Serverzeugen nicht erreichbar.

| ID | Restrisiko | Warum es bleibt | Umgang |
|---|---|---|---|
| RR-1 | Ein lokaler Prozess mit dem Token ist von der echten Oberfläche nicht unterscheidbar | TCP kennt kein Gegenüber. Die Herkunftsprüfung wirkt nur gegen Browser (B-2.9). | Angriffsfläche des Tokens klein halten; Fehlversuche sichtbar machen; Trennung des Oberflächenpfads prüfen (B-2.9 Punkt 3) |
| RR-2 | Wer die Datei hat, hat die Daten | Keine Verschlüsselung im Ruhezustand; ein Schlüssel läge auf demselben Rechner | Dateirechte, Ablage außerhalb synchronisierter Ordner, Empfehlung Datenträgerverschlüsselung |
| RR-3 | Die Exportdatei ist nach der Übergabe außerhalb jeder Kontrolle | Der Empfänger ist ein Fremdsystem | Handbuch, Hinweis in S-07, Aufräumfunktion |
| RR-4 | Das Exportprotokoll ist nicht fälschungssicher | Der Benutzer besitzt die SQLite-Datei; Manipulationssicherheit bräuchte einen externen Zeugen, den E-001 verbietet | Spur gegen Unfälle und gelegentlichen Missbrauch; dem Auftraggeber gegenüber ausgesprochen |
| RR-5 | Zeitangaben sind manipulierbar | Lokale Uhr (B-12.4) | Monotone Messung, Plausibilitätsgrenzen |
| RR-6 | Das Add-in lädt `office.js` von Microsoft | Von Microsoft vorgeschrieben (B-10.6) | Dokumentiert; sonst keine externen Ressourcen |
| RR-7 | Ein Benutzer, der von Hand eine Netzfreigabe als Exportziel wählt, schickt Kundendaten ins Netz | Bewusste Entscheidung des Benutzers; es kann der gewollte Übergabeweg sein | Ausdrückliche Rückfrage statt Verbot (B-5.2) |
| RR-8 | Eine kompromittierte Abhängigkeit läuft mit den Rechten des Benutzers | Gilt für jedes npm-Projekt | Skripte gesperrt, Versionen festgelegt, Abhängigkeitsdisziplin im Abrechnungspfad (B-10.x) |
| RR-9 | Es gibt keine Rollen und keine Vier-Augen-Prüfung vor der Abrechnung | Einbenutzerprodukt nach Vorgabe | Sichtbarkeit statt Kontrolle (B-9.1) |

---

## 10. Offene Fragen

Diese gehören dem Orchestrator und, wo angegeben, dem Auftraggeber.

1. **Herkunft des Add-ins.** Unter welcher Herkunft wird `apps/outlook-addin` ausgeliefert
   (lokale Datei, `https://localhost:3000`, ein interner Server)? Ohne diese Angabe ist die
   CORS-Positivliste aus B-1.4 nicht bestimmbar.
2. **Herkunft des Tauri-Webviews.** Muss in T-008 belegt werden (`https://tauri.localhost` unter
   Windows) statt geraten.
3. **Einmalanzeige des Tokens** (B-2.2, Variante Hashwert) oder dauerhaft abrufbar über DPAPI?
   Sicherheitsempfehlung: Einmalanzeige. Das ist eine Bedienungsentscheidung und gehört zur
   Abnahme.
4. **Erwartet das Abrechnungstool `DOMAIN\benutzer` oder den nackten Benutzernamen?** (B-8.2)
   Betrifft die Standardvorlage, nicht nur die Sicherheit.
5. **Kennt das Abrechnungstool eine Dublettenprüfung?** Die Antwort verschiebt die Schwere von
   B-9.1 erheblich in die eine oder andere Richtung.
6. **Nummernraum für Testdaten** (B-11.2, Punkt 3): Welches Präfix oder welcher Bereich ist
   nachweislich nicht in Gebrauch?
7. **`node:sqlite` oder `better-sqlite3`?** (B-10.3) Entscheidung mit Sicherheitsanteil; gehört
   nach der Prüfung in T-008 als Eintrag in `decisions.md`.
8. **Semgrep Guardian ist nicht angemeldet.** Soll eine Anbindung eingerichtet werden, oder
   bleibt es beim lokalen CLI? Ohne Anbindung liefern die drei Guardian-Werkzeuge dauerhaft
   nichts, und die Definition of Done des security-checkers ist nur über das CLI erfüllbar.

---

## 11. Urteil

### Stand T-067 (2026-09-02) — **Nacharbeit**, aber knapp und mit benannten Punkten

Bezogen auf die Frage von T-067: **Darf dieser Baum öffentlich werden?**

Die vertraulichkeitsrelevante Antwort ist **ja**. Über alle 473 Dateien: keine Zugangsdaten,
kein Schlüsselmaterial, keine Kundendaten, keine echte Call-Nummer, keine echte E-Mail-Adresse,
keine Adresse ausserhalb des Loopback, kein fremder Urheberrechtshinweis. Semgrep meldet keinen
Befund hoher Schwere; aus `p/secrets` keinen einzigen. Die vier Blocker aus T-023 sind behoben
und im Code nachgesehen (13.6). Die eine echte Exportdatei mit Kundendaten liegt im Baum und
wird von der `.gitignore` gehalten — seit T-067 durch zwei Regeln statt durch eine.

**Nacharbeit** heisst es trotzdem, wegen **einem** Punkt, der vor dem ersten Commit zu
entscheiden ist. Zwei weitere standen hier bis zum Nachmittag des 2026-09-02 und sind behoben —
siehe unter der Tabelle.

| Rang | Blockierend | Befund | Rolle |
|---|---|---|---|
| 1 | **`.claude/settings.json` mit zwölf absoluten `/home/kerem`-Pfaden.** Bei jedem Klon greift keine Regel, auch keine `deny`-Regel auf `~/.ssh` oder `**/.env`. Eine Schutzregel, die ins Leere zeigt, ist schlechter als keine. | V-3, B-11.4 P3 | Auftraggeber |

**Behoben am 2026-09-02, beides nachgesehen.**

*Erstens die Lizenzangabe (V-2).* `apps/desktop/src-tauri/Cargo.toml` steht jetzt auf
`license = "MIT"`, mit dem Kommentar, dass `publish = false` daran nichts ändert — richtig: Der
Schalter verhindert die Veröffentlichung auf crates.io, nicht die Aussage. Damit sagen die
`LICENSE` an der Wurzel, alle neun `package.json` und die `Cargo.toml` dasselbe.

*Zweitens der Zufallswert (V-4, S-04).* `Math.random` für die Seriennummer des selbst
erzeugten Zertifikats ist weg. In
`apps/local-api/src/taskpane/certificate.ts` steht jetzt `const serial = randomBytes(16);`,
`randomBytes` ist in die vorhandene `node:crypto`-Einfuhr aufgenommen, und das oberste Bit
fällt weiterhin (ASN.1 INTEGER ist vorzeichenbehaftet; eine negative Seriennummer ist nach
RFC 5280 unzulässig). Der Kommentar an der Stelle nennt beide Gründe, und der zweite ist der
für dieses Dokument bemerkenswerte: *„Dieses Repository wird öffentlich. Zwei Dateien
nebeneinander dürfen nicht zwei Aussagen machen."* Genau das war das Argument aus 13.5 — die
Veröffentlichung ändert nicht die Vertraulichkeit, sondern das Gewicht dessen, was
abgeschrieben wird. `Math.random` kommt im Dienst nur noch in Kommentaren vor, die vor ihm
warnen.

Nicht blockierend, aber zu entscheiden: die 68 Dateien unter `.claude/team/` (bewusst zu
entscheiden, nicht zu beheben — siehe unten), V-5 (Benutzername in einem Bericht), V-6
(Lizenzabschnitt im README), die `NOTICE`-Pflicht aus Apache-2.0 vor der ersten Auslieferung
eines Bündels, und S-07 (`cargo audit` nie gelaufen).

**Zu `.claude/team/` — 68 Dateien, davon 65 Berichte, zusammen rund 23 900 Zeilen.** Sie enthalten die vollständige
Fehlergeschichte des Projekts: welche Annahme falsch war, welcher Nachweis an der Anwendung
vorbeilief, wo ein Agent sich geirrt hat. Das ist für ein öffentliches Repository nicht falsch,
sondern ungewöhnlich ehrlich, und es ist der Teil, aus dem ein Leser am meisten lernt. Was ein
anderer darin nicht veröffentlichen würde, ist ausdrücklich zu nennen, damit die Entscheidung
bewusst fällt: sieben Werkzeugausgaben mit `/home/kerem` und `kerem kerem` (V-5); der
namentliche Zuschnitt, welcher Agent welchen Fehler gemacht hat; die Formulierung, dass elf
grüne Nachweispfade an einer Anwendung vorbeiliefen, die nicht startete (T-053). Nichts davon
ist ein Sicherheitsbefund. Es ist eine Entscheidung über Aussenwirkung, und sie gehört dem
Auftraggeber.

**Zur Definition of Done, wahrheitsgemäss.** „Semgrep ohne offene Befunde hoher Schwere" ist
**erfüllt**. „42Crunch-Audit über der Schwelle" ist **unverändert nicht erfüllbar**: `42c-ast`
ist nicht installiert, eine Zugangsberechtigung existiert nicht. Die OpenAPI-Beschreibung liegt
seit T-023 vor — es fehlt allein das Werkzeug. Semgrep Guardian antwortet weiterhin
`Not logged into Semgrep Guardian.` Drei der vorgesehenen Werkzeuge dieser Rolle haben in
diesem Projekt nie ein Ergebnis geliefert; das steht seit T-003 in Abschnitt 0 und wird hier
zum dritten Mal wiederholt, weil ein nicht gelaufenes Werkzeug sonst mit der Zeit als
bestandene Prüfung gelesen wird.

**Was gesagt gehört.** Der Baum ist sauberer, als bei einem Projekt dieser Grösse zu erwarten
war. Ein einziger Urheberrechtshinweis in 40 000 Zeilen, keine Copyleft-Abhängigkeit, keine
Adresse ausserhalb des Loopback, und Testdaten, die durchgehend als erfunden erkennbar sind —
`4711`, `000815`, `Musterkunde Nord`. Die sechs Berichtsordner, die durchgefallen sind, waren
inhaltlich harmlos; die Lücke war eine Vermutung über Werkzeugnamen und keine Nachlässigkeit
gegenüber Daten.

### Stand T-023 (2026-09-01) — **Nacharbeit**

Die Architektur trägt, und sie trägt inzwischen an den meisten Stellen aus dem Code heraus und
nicht mehr aus einer Absichtserklärung. Von den 53 Bedrohungen — 52 aus T-003 und die in T-023
hinzugekommene B-2.10 — sind **43 umgesetzt, 7 teilweise, 3 offen** (B-2.10, B-3.2, B-5.2).
Vier Punkte blockieren die Freigabe:

| Rang | Blockierend | Bedrohung | Rolle |
|---|---|---|---|
| 1 | **B-2.10 — das Add-in-Token erreicht die vollen Fachrouten.** Es liest und überschreibt den internen Vermerk, setzt den Exportordner und löst einen Exportlauf aus. Gemessen, nicht vermutet. | B-2.10, R-09, RR-1 | domain-dev |
| 2 | **B-3.2 — Vorlagenfeldnamen werden nicht geprüft.** `__proto__` und Doppelnamen führen zu stillem Feldverlust in der Abrechnungsdatei. Tor aus Abschnitt 8 für T-007; die zugehörige Prüfung 10 existiert nicht. | B-3.2 | integration-dev, unit-tester |
| 3 | **B-7.2 — die Datenbankdateien liegen mit 0644.** Token und Zertifikat mit 0600; die Datei mit den Kundendaten nicht. Tor aus Abschnitt 8 für T-008. | B-7.2 | domain-dev |
| 4 | **B-5.1 Punkt 1 und B-5.2 — der Exportordner ist ein Freitextfeld ohne jede Rückfrage.** Eine UNC-Freigabe oder ein OneDrive-Ordner wird stillschweigend angenommen. Tor aus Abschnitt 8 für T-007. | B-5.1, B-5.2, B-5.3 | frontend-dev, domain-dev |

Nicht blockierend, aber zu erledigen: S-04 (`Math.random` in der Zertifikatserzeugung —
**behoben in T-066, siehe Abschnitt 13.6**), S-05
(`trusted_schema`), S-06 (Base64-Hinweis in S-07), S-07 (`cargo audit` läuft nicht), S-08
(OpenAPI: 500 und 429 fehlen, nichts ist `additionalProperties: false`), S-09
(`style-src 'unsafe-inline'`).

**Zur Definition of Done, wahrheitsgemäß.** „Semgrep ohne offene Befunde hoher Schwere" ist
erfüllt — 15 Befunde, keiner davon nach Prüfung echt. „42Crunch-Audit über der Schwelle" ist
**nicht erfüllt und mit den vorhandenen Mitteln nicht erfüllbar**: Das Programm ist nicht
installiert, eine Zugangsberechtigung existiert nicht, und die Beschaffung ist eine
Beschaffungsentscheidung, keine technische. Das Tor aus Abschnitt 8 für T-011 gehört damit dem
Orchestrator: entweder Zugang beschaffen oder das Tor durch eine benannte Ersatzprüfung ersetzen.
Es einfach als erfüllt zu führen wäre die eine Sorte Fehler, die dieses Dokument seit Abschnitt 0
zu vermeiden versucht.

**Was aufgefallen ist und positiv gesagt gehört.** Drei Dinge sind besser gebaut, als dieses
Modell verlangt hat: das Token liegt nur als Abdruck auf der Platte statt über DPAPI (B-2.2,
Rückweg nicht gebraucht); `node:sqlite` statt `better-sqlite3` hat die längste Lieferkette des
Projekts ersatzlos gestrichen (B-10.3); und im Abrechnungspfad steht keine einzige fremde
Laufzeitabhängigkeit (B-10.7). Die Notiz-Grenze hat vier Angriffe gehalten, und sie hält aus
fünf voneinander unabhängigen Gründen (12.3) — das ist der Unterschied zwischen „nicht
vorgesehen" und „nicht möglich", den B-3.1 verlangt hat.

**Und die unbequeme Beobachtung dazu.** Genau diese Grenze wird durch B-2.10 umgangen — nicht
durch die Vorlage, sondern durch einen Nachweis. Fünf Schichten schützen den Vermerk vor dem
Export, und `GET /todos/{id}/note` gibt ihn einem dauerhaften Token heraus, das der Benutzer über
die Zwischenablage in Outlook trägt. Eine Grenze ist so stark wie ihr schwächster Zugang, und der
lag hier nicht dort, wo alle hingesehen haben.

### Stand T-003 (2026-08-31) — Nacharbeit

**Nacharbeit** — im Sinne von: Der Entwurf ist tragfähig, aber er trägt nur mit den Gegenmitteln
aus Abschnitt 6. Für T-003 selbst liegt kein Mangel vor; das Urteil bezieht sich auf den Zustand
der Architektur, den dieses Modell bewertet.

Begründet:

- Die Architektur ist für ein lokales Produkt vernünftig geschnitten, und die Entscheidungen
  E-009 bis E-012 greifen die richtigen Punkte auf. Kein Fund in diesem Modell stellt eine
  getroffene Entscheidung in Frage.
- Drei Punkte sind **neu** gegenüber `risks.md` und brauchen eine Aufnahme dort: das Token in
  Office-`RoamingSettings` (B-2.8), Roaming- und OneDrive-Synchronisierung von Datenbank und
  Export (B-7.1, B-5.3) und das Fehlen einer `.gitignore` vor der ersten Installation (B-11.2).
- Die Definition of Done des security-checkers ist zum Stand von Welle 1 **nicht erfüllbar**:
  Der Semgrep-Lauf ist mangels Code aussagearm, die Guardian-Werkzeuge sind nicht angemeldet, und
  eine OpenAPI-Beschreibung für den 42Crunch-Audit existiert nicht. Diese Punkte werden zu Toren
  von T-008 und T-011 (Abschnitt 8).
- Die eine Frage, an der die Architektur wirklich hängt, ist in B-2.9 beantwortet: Die
  Herkunftsprüfung fängt einen Tokendiebstahl **nicht** auf. Sie deckt einen anderen Angreifer
  ab. Wer beides für Redundanz hält, baut eine Schicht zu wenig.

Erneut zu prüfen nach T-007, T-008 und T-011.

---

## 12. Gegenprobe T-023 (2026-09-01) — was im Code tatsächlich steht

T-003 hat 52 Bedrohungen aus einem Entwurf abgeleitet, als es nur Markdown gab. Dieser Abschnitt
hält fest, was von den Gegenmitteln acht Wellen später **im Code** steht. Grundsatz der
Gegenprobe: dem Bericht wird nicht geglaubt, es wird nachgesehen — und wo es möglich war, wird
angegriffen statt gelesen.

### 12.1 Semgrep — die 15 Befunde einzeln

321 Ziele, 278 Regeln aus neun Regelsätzen. Kein Befund von hoher Schwere nach Prüfung:

| Schwere | Regel | Ort | Einordnung |
|---|---|---|---|
| ERROR ×2 | `react-insecure-request` | `apps/desktop/scripts/verify-sidecar.mjs:228,233` | **Falschmeldung.** `fetch('http://127.0.0.1:17843/health')` in einem Bauprüfskript. Der Dienst spricht nach E-043 bewusst HTTP auf Loopback; HTTPS dort ist die Konstellation, die E-043 ausdrücklich verbietet. |
| INFO ×7 | `rust.unsafe-usage` | `apps/desktop/src-tauri/src/identity.rs`, `appdata.rs` | **Erwartet und richtig.** Die einzigen `unsafe`-Blöcke sind die FFI-Aufrufe `GetUserNameW`, `GetUserNameExW` und `getpwuid` — genau die Betriebssystemschnittstelle, die B-8.1 anstelle der Umgebungsvariablen fordert. Jeder Block trägt einen `SICHERHEIT:`-Kommentar über die Zusicherung, die er braucht. |
| WARNING ×4 | `detect-non-literal-regexp` | `apps/outlook-addin/src/callnumber/pattern.ts:121,295,329`, `run.ts:27` | **Kein Befund, sondern das Merkmal.** A-10.8 stellt den Ausdruck in die Benutzerhand. Genau darum gibt es B-4.1 bis B-4.4, und sie sind umgesetzt (12.6). |
| WARNING ×1 | `detect-non-literal-regexp` | `apps/local-api/src/access/origin-policy.ts:174` | `new RegExp(secretPattern.source)` — ein Neuaufbau aus einer **Konstante** des Codes, um `lastIndex` zu vermeiden (B-4.4). Keine fremde Eingabe. |
| WARNING ×1 | `missing-integrity` | `apps/outlook-addin/index.html:49` | `office.js` von `appsforoffice.microsoft.com` ohne SRI. **Bekannt und unvermeidbar**: B-10.6 und RR-6 führen es als ausgesprochene Einschränkung von E-001. Microsoft aktualisiert die Datei laufend; SRI wäre nicht haltbar. |

**Zwei Einschränkungen der Aussagekraft, die dazugehören:**

1. Semgrep meldete **Teilparse-Fehler** in vier Dateien — `packages/domain/src/index.ts:34`,
   `packages/storage/src/index.ts:14`, `packages/storage/src/sqlite/paging.ts:40`,
   `apps/web/src/lib/exportTemplateModel.ts:503`. Teile dieser Dateien sind **nicht analysiert
   worden**. Sie wurden dafür von Hand gelesen.
2. Der YAML-Parser von Semgrep scheiterte an `apps/local-api/openapi/takt-local-api.yaml:2575`.
   Die Datei selbst ist in Ordnung: PyYAML liest sie vollständig, 3060 Zeilen, OpenAPI 3.1.0.
   Es ist eine Schwäche des Werkzeugs, kein Mangel der Beschreibung.

### 12.2 Der Prüfpfad des Dienstes — gegen den laufenden Prozess gemessen

21 Proben gegen `127.0.0.1:17843`, im Betrieb, ohne Token:

| Probe | Erwartet | Gemessen |
|---|---|---|
| `GET /health` ohne Token | 401 | **401** — `/health` liegt hinter dem Nachweis und verrät nicht einmal, dass Takt läuft |
| `GET /todos`, `GET /token`, `POST /token` ohne Token | 401 | **401** |
| Falsches Token | 401 | **401**, gleicher Text |
| `Host: evil.example:17843` | 403 | **403** (B-1.3) |
| `Host: 127.0.0.1:17843.evil.example` | Abweisung | **400** |
| `Host: 127.0.0.1` ohne Port | 403 | **403** |
| `Host: localhost:17843` | durchgelassen bis zum Nachweis | **401** |
| `Origin: https://evil.example` | 403 | **403** (B-1.4) |
| `Origin: http://tauri.localhost.evil.example` | 403 | **403** — die Präfixfalle greift nicht |
| `Origin: null` | 403 | **403** |
| `Origin: tauri://localhost` | bis zum Nachweis | **401** |
| `POST` `text/plain` mit fremder Herkunft | Abweisung vor Wirkung | **403** (B-1.2) |
| `POST` `x-www-form-urlencoded` ohne Herkunft | 415 | **415** |
| `POST` `multipart/form-data`, `Sec-Fetch-Site: cross-site` | 403 | **403** |
| `Sec-Fetch-Mode: navigate` | 403 | **403** |
| `Sec-Fetch-Site: cross-site` | 403 | **403** |
| `GET /health?token=takt_…` | 400, ohne den Wert zu nennen | **400**, `token_in_url`, Vorfall in den Meldungen (B-2.4 Punkt 1) |

Die Protokollzeilen des Laufs tragen ausschließlich `ts`, `level`, `method`, `path` (ohne
Abfrageteil), `status`, `durationMs`, `outcome`. Kein Kopfzeilenwert, kein Rumpf, kein
`takt_`-Treffer im gesamten Protokoll (B-2.4, B-12.2).

**Was das nicht zeigt.** Diese Reihe wirkt gegen A-02. Gegen A-03 ist sie wirkungslos, und das
ist so gemeint — B-2.9 sagt es, `origin-policy.ts` wiederholt es im Dateikopf. Der einzige
Riegel gegen A-03 ist das Token, und **B-2.10 zeigt, wie weit dieses Token heute trägt.**

### 12.3 Die Notiz-Trennung — vier Angriffe, alle abgewehrt

Aufbau: ein Todo mit dem Vermerk `GEHEIMER-INTERNER-VERMERK-Kunde-Meier-Kuendigung`, eine
abgeschlossene Buchung mit dem Leistungstext `abrechenbare Leistung`, Angriffe durch den
**vollständigen** HTTP-Stapel (`app.fetch`, also dieselbe Kette, die der Server bedient).

1. **Vorlage über die Route.** 17 Schreibweisen — `todo.note`, `todo.notiz`, `todo.vermerk`,
   `todo.Note`, `todo.NOTE`, `todo.body`, `todo.noteBody`, `todo['note']`, `todonote`,
   `note`, `__proto__`, `constructor.prototype.note`, `todo..note`, `" todo.note "`,
   `entries.0.todoNote`, `group.note`, `group.entries.0.bookingNote`. **Alle 17: 422
   `export_source_forbidden`.** Kein Feld ausgelassen, keine Vorlage teilweise übernommen.
2. **Vorschau mit ungespeicherter Vorlage** (E-051, der Weg, der die Speicherung umgeht).
   `todo.note` → 422. Gegenprobe `group.bookingNotes` → 200, und der Vermerk ist nicht darin.
3. **Vorlage an Oberfläche und Route vorbei direkt in SQLite geschrieben** (Abschnitt 7,
   Prüfung 9). Ein `INSERT INTO export_template` mit `{"source":"todo.note"}`, danach der Dienst
   neu aufgesetzt. Vorschau **422**, Exportlauf **422**, **keine Datei** im Exportordner,
   **keine** Buchung markiert (`exportStatus` bleibt `open`). Der Lauf bricht ab, statt das Feld
   still auszulassen.
4. **Über die eingebaute Vorlage und über jede Leseroute.** Vorschau, `GET /todos`,
   `GET /todos/{id}`, `GET /search`, `GET /time-entries`, `GET /addin/context`,
   `GET /addin/todos` — der Vermerk kommt **weder im Klartext noch base64-kodiert** vor. Die
   geschriebene Datei enthält `{"Call":…,"Zeit":1,"Notiz":"TGVpc3R1bmc=","WindowsUser":…}`, also
   den Leistungstext und nicht den Vermerk.

**Warum sie hält — die fünf Schichten, von innen nach außen:** die SQL-Sicht
`v_export_candidate` führt die Spalte nicht; `ExportCandidate` und `ExportGroup` haben kein Feld
dafür und keinen Verweis; `ExportGroupHasNoTodoNote` und `NoSourceIsCalledPlainNote` binden das
an den Übersetzer; `readExportSource` ist ein `switch` mit zwölf ausgeschriebenen Zweigen und
**keinem** Pfadauflöser; `validateExportTemplateDefinition` gleicht wörtlich gegen die
geschlossene Liste ab und wird beim Speichern **und** bei jedem Lauf aufgerufen.

**Die eine Bresche liegt woanders.** Sie führt nicht durch die Vorlage, sondern am ganzen
Apparat vorbei: `GET /todos/{id}/note` gibt den Vermerk einem **Add-in-Token** heraus. Siehe
B-2.10. Die Notiz-Grenze ist gegen den Export gebaut und gegen den Nachweis nicht.

### 12.4 OpenAPI — Ersatzprüfung von Hand, **kein** 42Crunch-Ergebnis

3060 Zeilen, OpenAPI 3.1.0, 63 Operationen, gültiges YAML. Was gut ist: **0** Operationen ohne
`security`, ohne `401`, ohne `403`, ohne irgendeine 4xx-Antwort, ohne `operationId`. Ein
`apiKey`-Verfahren in einer eigenen Kopfzeile, kein `Authorization`, keine Cookies — die
Begründung steht in der Beschreibung selbst.

Was fehlt, und was ein Audit anstriche:

| Punkt | Zahl | Einordnung |
|---|---|---|
| Operationen ohne `429` | 63 | Der Dienst antwortet auf gehäufte Fehlversuche mit **Verzögerung**, nicht mit 429 (B-2.6). Entweder 429 einführen oder die Entwurfsentscheidung in der Beschreibung nennen. |
| Operationen ohne `500`/`default` | 63 | **Echte Abweichung:** `app.onError` liefert 500 `internal_error`. Die Beschreibung kennt diese Antwort nicht. Ein Konformitätsscan meldete sie als „nicht im Vertrag". |
| Objekte ohne `additionalProperties: false` | 130 | Zur Laufzeit unkritisch: zod verwirft unbekannte Schlüssel stillschweigend. Aber `.strict()` kommt in keinem der 30 `z.object(...)` vor — ein Rumpf mit Tippfehler im Feldnamen wird angenommen statt beanstandet. |
| Zeichenketten ohne `maxLength` | 30 | Zur Laufzeit begrenzt (`titleSchema` 500, `textSchema` 20 000, `idSchema` 64, `nameSchema` 200 …). Der Vertrag sagt es nicht. |
| Felder ohne `maxItems` | 41 | dito (`tagIds` 200, `timeEntryIds` 20 000, `order` 100). |
| Zahlen ohne Grenzen | 22 | dito (`limit` 1–200). |

**Das Tor aus Abschnitt 8 für T-011 bleibt offen** — nicht wegen dieser Liste, sondern weil
42Crunch nicht betriebsbereit ist (Abschnitt 0).

### 12.5 Repository-Hygiene — über alle 357 Dateien, die ein `git add -A` aufnähme

Das Repository ist weiterhin **nie committet** worden; `git log` ist leer. Die `.gitignore` steht
also **vor** dem ersten Commit — die Reihenfolge aus B-11.2 ist eingehalten. Sie deckt
`node_modules/`, `dist/`, `target/`, `*.db*`, `*.sqlite*`, `exports/`, `*.pem`, `*.key`,
`token`, `*.token`, `addin-token*`, `*.log`, `coverage/`, `playwright-report/`,
`test-results/`, dazu `*.db.bak` und `takt-export*.json`. `pnpm-lock.yaml` und `Cargo.lock` sind
ausdrücklich **nicht** ausgenommen und werden mitversioniert (B-10.2). Das gebündelte
Sidecar-Binärprogramm (125 MB) ist über `apps/desktop/.gitignore` ausgenommen.

Gesucht und gefunden:

- **Geheimnisse:** zehn Treffer auf `takt_…`, sämtlich in `apps/outlook-addin/scripts/proof-addin.mjs`
  und sämtlich erkennbar erfunden (`takt_AAAA…`, `takt_BBBB…`). Das ist die richtige Bauform:
  formgültig, damit der Prüfpfad etwas prüft, und auf den ersten Blick als Attrappe erkennbar.
- **E-Mail-Adressen:** zwei, `a.beispiel@example.org` und `b.muster@example.com` — die für
  Beispiele reservierten Domänen.
- **Call-Nummern:** `TCK-000042`, `TCK-000815`, `TCK-999999`, `INC0004711`, `CALL-2026`.
  Erkennbar erfunden. Offene Frage 6 aus Abschnitt 10 (Nummernraum vom Auftraggeber bestätigen)
  ist damit praktisch entschärft, formal aber weiter offen.
- **Kundennamen, Schlüsseldateien, `.env`:** keine.
- Semgrep `p/secrets` über die Testverzeichnisse, die die Vorgabe-`.semgrepignore` auslässt:
  42 Dateien, **0 Befunde**.

**Urteil: sauber.** Anders als in T-003 ist die Aussage jetzt belastbar, weil es Code gibt.

### 12.6 Die 52 Bedrohungen — Stand je Gruppe

| Bedrohung | Stand | Beleg |
|---|---|---|
| B-1.1 … B-1.7 | **umgesetzt** | 12.2; feste Bindung in `config.ts`, Loopback-Zusicherung und `exclusive: true` in `main.ts`, Rumpfgrenze 1 MB und Zeitgrenze 15 s in `app.ts` |
| B-2.1 | umgesetzt | `randomBytes(32)` als base64url, Präfix `takt_`, nur in `crypto.ts` |
| B-2.2 | umgesetzt, **stärker als gefordert** | Auf der Platte liegt nur der SHA-256-Abdruck; Verzeichnis 0700 und Datei 0600 gemessen; `O_EXCL`, `chmod` nach dem Schreiben, unteilbares Umbenennen, `fsync` auf Datei und Verzeichnis |
| B-2.3 | umgesetzt | Der Klartext steht genau einmal da und ist danach nicht wieder abrufbar |
| B-2.4 | umgesetzt | Feste Feldliste im Protokoll, `redactSecrets` auf jeder Zeile, `token_in_url` gemessen, keine Ausnahmehülle nach außen |
| B-2.5 | umgesetzt | Beide Seiten über SHA-256, `timingSafeEqual`, bitweises ODER statt `\|\|`, kein früher Ausstieg — im Code nachgelesen |
| B-2.6 | umgesetzt | Zählung, ansteigende Verzögerung, sichtbare Meldung unter `/security/notices` |
| B-2.7 | umgesetzt, **im Versuch belegt** | Ein `POST /token` mitten in einer Prüfreihe machte das vorher erzeugte Token augenblicklich ungültig — die Neuerzeugung wirkt ohne Nachfrist |
| B-2.8 | umgesetzt | `roamingSettings` kommt im Add-in nicht vor, auch nicht im Typ |
| B-2.9 Punkt 3 | **halb** | Die Trennung in zwei Geheimnisse ist gebaut; die Rechte dahinter fehlen — **B-2.10** |
| **B-2.10** | **offen — blockierend** | Neu, siehe oben |
| B-3.1 | umgesetzt | 12.3, vier Angriffe |
| **B-3.2** | **offen** | Feldnamen werden **nicht** geprüft: `__proto__`, `constructor`, `prototype`, Doppelnamen, jede Länge, jeder Zeichenvorrat. Befund S-01 im Bericht zu T-023 |
| B-3.3 | umgesetzt | Die Bedingung ist eine Datenstruktur mit zwei Operatoren; `eval`, `new Function`, `vm` kommen im Baum nicht vor |
| B-3.4 | umgesetzt | Drei geschlossene Transformationen; die Rundung wird aus `packages/domain` **aufgerufen** |
| B-3.5 | umgesetzt | Ein Renderer für Vorschau und Datei; die Vorschau schreibt nichts |
| B-4.1 … B-4.4 | umgesetzt | Ein Worker je Auswertung, harte Grenze 100 ms mit `terminate()`, getrennte Startfrist, 20 000 Zeichen, Erfassungsgruppe erzwungen, Leertreffer abgelehnt, Rückverweise und Rückschau abgelehnt, Plausibilisierung in der Domäne, Duplikatsuche unterbleibt bei unplausiblem Wert und wird im Dienst mit **derselben** Funktion erneut geprüft (E-045). Die Heuristik gegen Rückzugsverhalten lässt `(.*a){20}b` durch (im Versuch 3,8 s bei 28 Zeichen) — **das ist der entworfene Fall**: Sie ist erklärtermaßen eine Heuristik, und die harte Zeitgrenze fängt, was sie durchlässt |
| B-5.1 | **teilweise** | Der Schreibpfad hält (Dateiname vom Dienst gebildet, Prüfung gegen den aufgelösten Ordner, im Versuch belegt). **Punkt 1 fehlt:** S-09 hat ein Freitextfeld statt des Ordnerauswahldialogs. Keine `realpath`-Auflösung gegen Verknüpfungspunkte. Befund S-03 |
| B-5.2 | **offen** | Keine Erkennung von UNC-Pfaden und Netzlaufwerken, keine Rückfrage, keine Abweisung von Systemverzeichnissen, keine Erreichbarkeitsprüfung mit Zeitgrenze. Befund S-03 |
| B-5.3 | teilweise | Punkt 3 (Heuristik auf OneDrive, Dropbox, Google Drive, Nextcloud) fehlt vollständig |
| B-5.4 | **umgesetzt, gemessen** | Nachbardatei mit `wx` und `0o600`, `fsync`, unteilbares Umbenennen, Datei **vor** der Markierung, Aufräumen liegengebliebener `.takt-*.tmp` beim Start. Die geschriebene Datei trug im Versuch `0600` |
| B-6.1 | teilweise | Der Satz steht in S-14 und im Handbuch, **nicht** in S-07 neben dem Exportziel; kein einmaliger Bestätigungsdialog für einen neu gewählten Ordner; keine Aufräumfunktion. Befund S-06 |
| B-7.1 | umgesetzt | `%LOCALAPPDATA%` bzw. `XDG_DATA_HOME`/`~/.local/share`, **kein** Rückfall auf Roaming — ein fehlendes `%LOCALAPPDATA%` ist ein Startfehler |
| **B-7.2** | **teilweise — Befund** | Verzeichnis 0700 gemessen. Aber `takt.db`, `takt.db-wal`, `takt.db-shm` liegen mit **0644**; es gibt kein `chmod` und keine Startprüfung auf die Datenbank. Token und Zertifikat sind korrekt 0600 — die Ungleichbehandlung ist das Verdächtige. Befund S-02 |
| B-7.3 | teilweise | Der Migrationsläufer sichert mit `VACUUM INTO` — richtig gewählt. Eine Funktion „Datensicherung erstellen" in S-09 gibt es nicht; die Sicherungsdatei erbt die Rechte aus S-02 |
| B-7.4 | umgesetzt bis auf einen Punkt | Ausschließlich Platzhalter, Spaltennamen aus Konstanten, `LIKE` mit `ESCAPE`, Längengrenzen überall, Erweiterungen im Treiber standardmäßig aus, `foreign_keys=ON`, `journal_mode=WAL`, `synchronous=FULL`. **`PRAGMA trusted_schema = OFF` fehlt.** Befund S-05 |
| B-8.1 | **umgesetzt** | `GetUserNameW` / `GetUserNameExW` über FFI, auf POSIX `getpwuid(geteuid())`. Kein `USERNAME`, kein `USERPROFILE`, kein Unterprozess `whoami`. Der einzige `env::var("USER")` im Baum steht in einem Test, der genau prüft, dass der Wert **nicht** daher kommt |
| B-8.2 | umgesetzt | Zweite `stdin`-Zeile (E-042), auf Steuerzeichen und Länge geprüft, nie in SQLite, keine Route schreibt ihn. Ohne ihn startet der Dienst nicht |
| B-9.1 | umgesetzt | `export_count`, Anhänge-Trigger `RAISE(ABORT,'append_only')` auf `export_audit`, `export_run`, `export_run_group`, `export_run_entry`; Migration 0006 ergänzt `trg_time_entry_exported_needs_provenance` — ein Statuswechsel ohne Lauf verlangt die Protokollzeile, und geprüft wird die **jüngste**. Kennzeichnung in S-06/S-07 vorhanden |
| B-10.1, B-10.2 | umgesetzt | `minimumReleaseAge: 10080` (sieben Tage), `trustPolicy: no-downgrade`, `blockExoticSubdeps`, `strictDepBuilds`, `allowBuilds` nur `esbuild`, zwei begründete `trustPolicyExclude`-Einträge, beide Sperrdateien versioniert. `pnpm audit`: 0 Verwundbarkeiten bei 182 Abhängigkeiten. Die Rust-Fassungen stehen als Bereiche (`"2"`, `"1"`) — durch `Cargo.lock` festgenagelt |
| B-10.3 | **erledigt, besser als vorgeschlagen** | E-035 wählt `node:sqlite`. Das native Modul, der Vorabbau, der Download und die Prüfsumme entfallen vollständig |
| B-10.4 | umgesetzt bis auf zwei Punkte | Fähigkeiten sind `core:default` und `core:window:allow-start-dragging` — **mehr nicht**; kein `fs`, kein `shell`, kein `http` für den Webview. CSP `default-src 'none'`, `script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`, `form-action 'none'`. Kein Aktualisierungsdienst, `withGlobalTauri: false`, `assetProtocol.enable: false`. **Offen:** `style-src 'unsafe-inline'` (Befund S-09) und `cargo audit`/`cargo deny` laufen nicht (Befund S-07) |
| B-10.5 | umgesetzt | `verify-sidecar.mjs` prüft das Bündel; Node-Fassung und Ablauf sind festgeschrieben |
| B-10.6 | umgesetzt | Add-in-CSP: `script-src 'self' https://appsforoffice.microsoft.com`, `connect-src` nur auf die beiden Loopback-Adressen und dieselbe Microsoft-Herkunft; `<AppDomains>` enthält genau `https://localhost:17844` |
| B-10.7 | **umgesetzt, vorbildlich** | `packages/domain` hat **null** Laufzeitabhängigkeiten. `packages/export` und `packages/storage` hängen ausschließlich an `@takt/domain`. Im Abrechnungspfad steht kein fremder Code |
| B-11.1, B-11.2 | umgesetzt | 12.5 |
| B-11.3 | unverändert | Weiterhin Sache des Auftraggebers |
| B-12.1 | **umgesetzt** | `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`, `eval`, `new Function` kommen in `apps/web`, `apps/outlook-addin` und `packages/**` **kein einziges Mal** vor |
| B-12.2 | umgesetzt | 12.2 |
| B-12.3 | umgesetzt | Übernommener E-Mail-Text geht in die Todo-Notiz, Länge begrenzt |
| B-12.4 | wie entworfen getragen | Restrisiko RR-5 |
| B-12.5 | umgesetzt | `tauri-plugin-single-instance`, `exclusive: true` auf beiden Ports |

### 12.7 Neu geprüft, weil es in T-003 noch nicht existierte

- **Das selbst erzeugte X.509-Zertifikat (E-046).** RSA-2048, SHA-256, `basicConstraints` kritisch
  und ohne CA-Recht, `keyUsage` kritisch, `extKeyUsage` nur `serverAuth`, `subjectAltName` mit
  `localhost` und `127.0.0.1`, 825 Tage, Erneuerung 14 Tage vorher, Schlüssel und Zertifikat mit
  **0600 gemessen**, Schlüssel gehört nachweislich zum Zertifikat (`checkPrivateKey`). **Ein
  Mangel:** die Seriennummer kam aus `Math.random` — Befund S-04. **Nachtrag T-067: behoben
  in T-066**, `randomBytes(16)` aus `node:crypto`. Damit hat das Zertifikat keinen bekannten
  Mangel mehr.
- **Der Aufgabenbereich-Port 17844.** Nur statische Dateien, gebunden auf `127.0.0.1`,
  Positivliste der Endungen (eine `.pem` oder `.db` im Bündelordner ginge nicht hinaus), Auflösung
  gegen die Wurzel mit `root + sep` — die Form des Präfixvergleichs, die B-5.1 Punkt 3 zulässt.
  Keine `realpath`-Auflösung, also folgte eine symbolische Verknüpfung **im** Bündelordner nach
  außen; geringes Gewicht, weil der Ordner zum Auslieferungsbestand gehört. Der Kommentar über
  kodierte Trenner beschreibt mehr, als der Code prüft — die Auflösung trägt es trotzdem.
- **Migration 0006 und `markNotBilled` (E-047).** Der Umbau folgt dem vorgeschriebenen Weg;
  die Marke `-- takt: foreign_keys=off` verschiebt die Fremdschlüsselprüfung, statt sie
  wegzulassen — nach dem letzten Befehl und **vor** dem Festschreiben läuft
  `PRAGMA foreign_key_check` über den ganzen Bestand. Die Anhänge-Trigger werden wortgleich
  wiederhergestellt. Der neue CHECK ist gleich streng wie der alte und macht `not_billed` an
  seiner **Belegfreiheit** erkennbar, nicht am Namen. `IS NOT` statt `<>` ist richtig gewählt:
  ohne jede Protokollzeile liefert die Unterabfrage NULL. Die Sortierung `occurred_at DESC,
  id DESC` ist eindeutig, weil die Kennungen UUIDv7 aus `node:crypto` sind und damit zeitgeordnet.
  **Kein Befund.**
- **Die Lieferkettenschalter in `pnpm-workspace.yaml`.** Siehe B-10.1. Die beiden Ausnahmen sind
  begründet und tragen: `undici-types` und `semver@6.3.1` haben kein Lebenszyklus-Skript.

---

## 13. Prüfung vor der Veröffentlichung — T-067 (2026-09-02)

Anlass: Das Repository soll **öffentlich** werden, und es ist bis zu diesem Tag **nie committet**
worden. Der erste Commit ist die Veröffentlichung von allem auf einmal. Das ist die einzige
Prüfung dieses Projekts, deren Ergebnis sich nachträglich nicht korrigieren lässt.

Grundsatz wie in Abschnitt 12: Es wird nachgesehen, nicht angenommen. Geprüft wurde nicht „das
Projekt", sondern die Liste, die `git status --porcelain -uall` ausgibt — vor der Ergänzung der
`.gitignore` 476 Einträge, danach 473.

### 13.1 Semgrep — die vier Befunde einzeln

12 442 Ziele, vier Konfigurationen (`p/secrets`, `p/security-audit`, `p/typescript`,
`p/owasp-top-ten`). **Kein Befund hoher Schwere.** Alle vier liegen in derselben Datei,
`apps/desktop/scripts/verify-sidecar.mjs`, einem Nachweisskript, das nicht ausgeliefert wird.

| Regel | Ort | Urteil |
|---|---|---|
| `unknown-value-with-script-tag` (LOW) | Zeile 184 | **unecht.** Das Skript schreibt eine Prüfseite mit einem `<script src>`-Tag; die eingesetzte Zeichenkette ist ein selbst berechneter Pfad im eigenen Arbeitsverzeichnis, keine Eingabe. |
| `react-insecure-request` (MEDIUM), 3× | Zeilen 437, 442, 457 | **unecht.** `http://127.0.0.1` gegen den eigenen Sidecar. Genau die Adresse, die E-004 vorschreibt; TLS auf dem Loopback ersetzte keine Vertrauensgrenze. |

Aus `p/secrets` kam **kein einziger** Treffer. Zwei Zeichenketten, die eine Mustersuche von Hand
zunächst hochspült, sind nachgesehen und harmlos:

- `apps/desktop/scripts/verify-sidecar.mjs:193` schreibt die Zeichenkette
  `-----BEGIN PRIVATE KEY-----\n` in eine Datei `nicht-ausliefern.pem`. Kein Schlüsselmaterial —
  eine Attrappe für den Nachweis, dass die Endungs-Positivliste des Aufgabenbereich-Ports diese
  Datei **nicht** herausgibt. Der Nachweis lautet nicht „gibt es nicht", sondern „gibt es, wird
  aber nicht ausgeliefert". Das ist die bessere Form.
- `apps/outlook-addin/scripts/proof-addin.mjs` enthält neun Token der Form
  `takt_AAAA…`, `takt_BBBB…`. Erkennbar konstruiert, aus wiederholten Buchstaben.

**Semgrep Guardian** wurde erneut aufgerufen und antwortete erneut
`Not logged into Semgrep Guardian.` Es liegt weiterhin kein Plattformbefund vor.

### 13.2 Mustersuche über alle 473 Dateien

Ersatz für `gitleaks`/`trufflehog`, die beide nicht auf dem Rechner sind.

| Gesucht | Gefunden |
|---|---|
| Token-Formen (`ghp_`, `sk-`, `xox…`, `AKIA…`, JWT), `BEGIN … PRIVATE KEY`/`CERTIFICATE` | nur die zwei oben erklärten Attrappen |
| `password`/`secret`/`api_key`-Zuweisungen mit Literal | nur Entwurfstoken der Oberfläche (`--bg-canvas`, `--text-lg`) — das Wort „Token" in seiner anderen Bedeutung |
| E-Mail-Adressen | **zwei**, `a.beispiel@example.org` und `b.muster@example.com`, beide nur in diesem Dokument. `example.org`/`example.com` sind nach RFC 2606 für genau diesen Zweck reserviert. |
| IP-Adressen | **ausschließlich** `127.0.0.1`. Keine einzige Adresse aus einem fremden Netz. |
| Hostnamen | `localhost`, `tauri.localhost`, `ipc.localhost`, Normungsgremien (`www.w3.org`), Microsoft-Endpunkte des Add-ins, `react.dev`, `nodejs.org` — und die Testdomänen `evil.example`, `boese.example`, `fremde.example`, `tauri.localhost.evil.example`. Kein interner Rechnername. |
| Call-Nummern | `TCK-000042`, `TCK-000815`, `TCK-999999`, `TCK-0000420`, `INC0004711`, `SVC-4711`, `CALL-2026-03xx/04xx`. Sämtlich als erfunden erkennbar. |
| Kundennamen | „Musterkunde Nord", „Musterwerk AG", „Beispiel GmbH", „Musterfirma". |
| Absolute Pfade mit Benutzernamen | siehe 13.4 — **ein echter Befund**. |
| Fremde Urheberrechtshinweise | **einer im ganzen Baum**, der eigene in `LICENSE`. |

**Was nicht mitgeht, obwohl es auf der Platte liegt.** `Export/takt-export-20260901-230315.json`
ist eine **echte** Exportdatei aus einem Handlauf: `"WindowsUser": "kerem"` und eine
base64-kodierte Notiz, die im Klartext „Ollama wurde deinstalliert" lautet — die gelebte
Bestätigung von B-6.1, dass Base64 nichts verbirgt. Die Datei war allein durch das
Dateinamensmuster `takt-export*.json` gedeckt. In T-067 kommt der Ordner selbst dazu.

### 13.3 Die sechs Berichtsordner — angesehen, nicht bloß ignoriert

`playwright-report-e2e/`, `-web-build/`, `-outlook-build/` und die drei zugehörigen
`test-results-*` fielen durch die Regeln `playwright-report/` und `test-results/`, weil sie ein
Suffix tragen. Sie wären mitgegangen.

Bevor sie ausgeschlossen wurden, sind sie **ausgepackt und gelesen** worden. Jede der vier
`index.html` trägt ein `data:application/zip;base64`-Anhängsel; darin liegen 1 bis 11
JSON-Dateien mit dem Berichtsinhalt.

| Gesucht | Ergebnis |
|---|---|
| Anhänge (Bildschirmfotos, Videos, Ablaufaufzeichnungen) | **null.** In keiner der 15 JSON-Dateien ist ein `attachments`-Feld belegt. |
| Antwortkörper aus Testläufen | keine |
| Pfade mit Benutzernamen, `C:\…`, `/home/…` | keine |
| E-Mail-Adressen, Call-Nummern | keine |
| Eingebettete PNG | **eines je Bericht, in allen vier byteweise identisch** (SHA-256 `9390701c…`, 68 036 Bytes) — der Werbe-Bildschirmschuss des Playwright-Trace-Viewers, ein Bestandteil des Berichterstatters. Kein Bild aus einem Testlauf. |

Was tatsächlich drinsteht: Testtitel auf Deutsch, Dateinamen und Zeilennummern der
Spezifikationsdateien, Laufzeiten und Quelltextausschnitte aus eben diesen Spezifikationen — die
alle ohnehin mitveröffentlicht werden.

**Ergebnis: kein Befund über die Testdaten.** Der Ausschluss bleibt trotzdem richtig, aus einem
Grund, der nichts mit diesem Lauf zu tun hat: Ein Bericht ist ein Abbild des Laufs, der ihn
erzeugt hat. Läuft die Reihe einmal gegen einen Bestand mit echten Daten, oder schlägt ein Fall
fehl und Playwright hängt Bildschirmfoto und Ablaufaufzeichnung an, dann steht in demselben
Ordner etwas völlig anderes. Die Regel muss vor diesem Lauf stehen, nicht nach ihm.

### 13.4 Befunde

| Nr | Ort | Schwere | Was |
|---|---|---|---|
| V-1 | die sechs Berichtsordner | mittel | Fielen durch die `.gitignore`. **In T-067 behoben** (`playwright-report*/`, `test-results*/`, `blob-report*/`, `coverage*/`, `/Export/`, `/export/`). Inhaltlich unbedenklich (13.3). |
| V-2 | `apps/desktop/src-tauri/Cargo.toml` | mittel | **Behoben am 2026-09-02, nachgesehen.** Stand auf `license = "UNLICENSED"` gegen die MIT-`LICENSE` an der Wurzel und die neun `package.json` auf `MIT` — zwei widersprüchliche Aussagen, und `UNLICENSED` ist zudem eine npm-Konvention und **keine gültige SPDX-Kennung**, die Cargo erwartet. Jetzt `license = "MIT"`; alle elf Lizenzangaben des Repositorys sagen dasselbe. |
| V-3 | `.claude/settings.json` | mittel | Zwölf Regeln mit dem absoluten Pfad `/home/kerem/…`. Bei jedem Klon greift keine davon — auch die `deny`-Regeln auf `~/.ssh`, `~/.aws`, `~/.gnupg` und `**/.env` nicht. Siehe B-11.4 Punkt 3. Gegenmittel: relative Muster. Nicht meine Datei. |
| V-4 | `apps/local-api/src/taskpane/certificate.ts` | niedrig | **Behoben am 2026-09-02 (T-066), nachgesehen.** Die Seriennummer kam aus `Math.random` (Befund S-04 aus T-023). Der Schlüssel selbst kam schon immer aus `generateKeyPairSync`; die Seriennummer ist kein Geheimnis, und TLS brach daran nicht. Es war aber die einzige Stelle im Dienst mit Zufall aus einem Pseudogenerator, sie stand in einer Datei namens `certificate.ts`, und die Nachbardatei `access/token.ts` schreibt in ihrem Kopf „Ausdrücklich nicht: `Math.random`". Jetzt: `const serial = randomBytes(16);`. |
| V-5 | `.claude/team/reports/T-008b-frontend-dev.md` | niedrig | Sieben eingefügte Werkzeugausgaben mit `/home/kerem/…` und `drwx------ 2 kerem kerem`. Preisgabe von Benutzername und Ablage; derselbe Name steht ohnehin im Add-in-Nachweis und in der Git-Identität. Bewusst zu entscheiden, nicht zu beheben. |
| V-6 | `README.md` | niedrig | Kein Abschnitt zur Lizenz, obwohl `LICENSE` vorliegt. Auf GitHub fällt das kaum auf; in einer Kopie des Verzeichnisses schon. |

**Kein Befund** waren: `apps/outlook-addin/manifest.xml` (erfundene GUID, ausdrücklich als solche
beschriftet, `ReadItem` als schwächste ausreichende Stufe, ausschließlich `localhost`-Adressen,
keine Mandantenkennung), die 16 PNG (sämtlich Anwendungssymbole, das Quellsymbol ein blaues „T"),
`.claude/team/decisions.md` (die Zitate des Auftraggebers sind fachlich und nennen niemanden),
und die 68 Dateien unter `.claude/team/` (65 Berichte, rund 23 900 Zeilen).

### 13.5 Lizenz und fremdes Urheberrecht

**Der eigene Baum.** Über alle 473 Dateien gesucht nach `Copyright`, `(c) JJJJ`, `©`,
`SPDX-License-Identifier`, `All rights reserved`, `adapted from`, `based on`, `taken from`,
`copied from`, `vendored`: **ein** Treffer, `LICENSE:3`, der eigene. Keine fremden Dateiköpfe,
keine kopierten Beispielausschnitte, keine Fremdsymbole. Bei rund 40 000 Zeilen ist das
bemerkenswert und gehört gesagt.

**Die Abhängigkeiten.** Abgeglichen über den **aufgelösten** pnpm-Speicher, nicht über die
direkten Angaben — 210 Pakete:

| Lizenz | Anzahl | Verträglich mit MIT |
|---|---|---|
| MIT | 185 | ja |
| Apache-2.0 | 9 | ja, mit Auflage (siehe unten) |
| ISC | 7 | ja |
| BSD-3-Clause | 4 | ja |
| Apache-2.0 OR MIT | 3 | ja — MIT wählbar (Tauri) |
| 0BSD | 1 | ja |
| CC-BY-4.0 | 1 | ja (`caniuse-lite`, nur Bauzeit) |

**Keine Copyleft-Lizenz im Baum.** Kein GPL, LGPL, AGPL, MPL, EPL, CDDL, SSPL, BUSL. Kein Paket
ohne Lizenzangabe. Der Rust-Anteil hängt an Tauri und dessen Kisten, die durchgängig
`Apache-2.0 OR MIT` führen. **MIT ist für dieses Projekt tragfähig.**

Die eine Auflage, die nicht null ist: Von den neun Apache-2.0-Paketen sind sechs reine
Bauzeit-Abhängigkeiten (Playwright, TypeScript, `expect-type`, `baseline-browser-mapping`), drei
gehen in die Auslieferung (`@internationalized/date`, `@internationalized/number` über Ark UI,
`@swc/helpers`). Apache-2.0 §4 verlangt beim **Weitergeben des Erzeugnisses** Lizenztext und
`NOTICE`. Das betrifft die `.deb`, die `.AppImage` und den gebündelten Sidecar — **nicht** die
Veröffentlichung des Quelltextes. Kein Hindernis für T-067, aber ein Punkt für die erste
Auslieferung.

**Was die MIT-Lizenz an der Bewertung dieses Dokuments ändert.** Sie ändert die Vertraulichkeit
nichts: Was nicht hinausgehört, gehört unter jeder Lizenz nicht hinaus. Sie ändert zwei andere
Dinge:

1. **Der Code wird abgeleitet, nicht nur gelesen.** Eine Schwäche in einer Kopie lässt sich nicht
   mehr durch einen Commit hier beheben. Das erhöht das Gewicht jeder Stelle, die zum Abschreiben
   einlädt — und `Math.random` für einen Zertifikatswert (V-4) war genau so eine Stelle: in Takt
   folgenlos, in einer Kopie, die daraus einen Schlüssel oder ein Token ableitet, nicht.
   **Dieses Argument hat sich noch am selben Tag bewährt:** V-4 ist in T-066 behoben worden, und
   die Begründung im Quelltext nennt als zweiten Grund wörtlich, dass das Repository öffentlich
   wird. Der Befund war damit nicht „eine Zeile Kosmetik", sondern der erste Fall, in dem die
   Veröffentlichung eine Bewertung tatsächlich verschoben hat.
2. **Die Gewährleistung ist ausgeschlossen, die Verantwortung für die Zusage nicht.** MIT schließt
   Haftung aus; sie setzt aber voraus, dass man die Rechte hatte, die man vergibt. Deshalb steht
   die Suche nach fremdem Urheberrecht oben und nicht in einer Fußnote.

### 13.6 Die vier Blocker aus T-023 — nachgesehen, alle behoben

Ohne diesen Abschnitt wäre die Veröffentlichung dieses Dokuments unverantwortlich: Abschnitt 11
führt vier blockierende Befunde mit ausgeschriebenem Angriffsweg. Sie stammen vom 2026-09-01. In
T-067 ist je Befund im Code nachgesehen worden.

| Aus T-023 | Stand 2026-09-02 | Wo |
|---|---|---|
| **B-2.10** — das Add-in-Token erreicht die vollen Fachrouten, liest und überschreibt den internen Vermerk, setzt den Exportordner, löst einen Export aus | **behoben** (T-034). Die Richtung ist umgedreht: **alles** verlangt `session`, abgesenkt wird nur im Teilbaum `/api/v1/addin` und für den einen Pfad `GET /health`. Eine neu hinzugefügte Fachroute ist damit von selbst geschlossen. Punktsegmente werden gar nicht erst abgesenkt. | `apps/local-api/src/access/route-policy.ts` |
| **B-3.2** — Vorlagenfeldnamen ungeprüft, `__proto__` und Doppelnamen führen zu stillem Feldverlust | **behoben.** `RESERVED_FIELD_NAMES` weist `__proto__`, `constructor` und `prototype` ab; die Ergebniszeile entsteht als `Object.create(null)`, hat also gar keinen Prototyp, den man vergiften könnte. Zwei voneinander unabhängige Gründe. | `packages/export/src/template.ts`, `packages/export/src/render.ts:155` |
| **B-7.2** — die Datenbankdateien liegen mit 0644 | **behoben.** `DATABASE_FILE_MODE = 0o600`, angewandt auf die Hauptdatei **und** ihre Begleiter `-wal`/`-shm` — der lautlose Fehler, `chmod` nur auf die Hauptdatei zu setzen, ist ausdrücklich vermieden. Verzeichnisse `0o700`. Ein Dateisystem ohne POSIX-Rechte lässt den Start nicht scheitern. | `packages/storage/src/sqlite/database.ts`, `apps/local-api/src/access/paths.ts` |
| **B-5.1 P1 / B-5.2** — der Exportordner ist ein Freitextfeld ohne Rückfrage | **behoben.** Der Ordner wird im Systemdialog gewählt; die Fähigkeitenliste der Hülle gibt davon **ausschließlich** `dialog:allow-open` frei (kein `save`, `message`, `ask`, `confirm`). Dienstseitig erkennt eine Merkmalsprüfung Systemverzeichnisse, Netzdateisysteme, UNC-Pfade und Synchronisationsordner; die Oberfläche kennt drei Stufen `reject`/`confirm`/`warn`. | `apps/local-api/src/access/export-directory.ts`, `apps/web/src/lib/exportDirectoryAdvice.ts`, `apps/desktop/src-tauri/capabilities/default.json` |

Von den nicht blockierenden Restpunkten aus T-023: **S-05 behoben**
(`PRAGMA trusted_schema = OFF`). **S-08 überholt** — die 44 Pfade der OpenAPI verweisen über
gemeinsame Bausteine 65-mal auf `Unauthorized`, `OriginRejected` und `TokenInUrl`, dazu
`NotFound`, `Conflict`, `UnprocessableEntity`, `UnsupportedMediaType`, `PayloadTooLarge`; `429`
fehlt zu Recht, weil der Dienst diesen Code nirgends sendet. Offen bleiben `500` und das
bewusst begründete Fehlen von `additionalProperties: false`. **S-04 offen** (V-4).
**S-09 unverändert** (`style-src 'unsafe-inline'`, an Ort und Stelle begründet). **S-07
unverändert**: `cargo audit` ist nicht installiert, der Rust-Baum ist nie gegen eine
Schwachstellendatenbank geprüft worden — unter MIT wiegt das etwas schwerer, weil Dritte den
Baum übernehmen.

**Damit zur Frage, ob dieses Dokument einem Angreifer mehr gibt als einem Leser.** Die
Bedrohungen sind mit ihren Gegenmitteln beschrieben, und die Gegenmittel stehen im Code, den
derselbe Angreifer ohnehin liest. Ein Bedrohungsmodell, das nur die gelösten Fälle nennt, wäre
Werbung.

Trotzdem sind die Stellen zu benennen, an denen dieses Dokument eine **unbehobene** Schwäche
ausschreibt. Kriterium, damit die Zählung nachprüfbar ist: *im ausgelieferten Code vorhanden,
im Dokument beim Namen genannt, und ohne Gegenmittel, das an derselben Stelle beschrieben
ist.* Nach diesem Kriterium sind es **zwei**:

1. **Die fehlende `realpath`-Auflösung im Aufgabenbereich-Port** (12.7, dritter Anstrich).
   `apps/local-api/src/taskpane/server.ts` prüft das Präfix auf dem **lexikalischen** Pfad
   (`target.startsWith(root + sep)`) und löst danach mit `stat` auf, das symbolischen
   Verknüpfungen folgt. Eine Verknüpfung **im** Bündelordner, die nach außen zeigt, wird
   ausgeliefert. Das Gewicht bleibt gering — wer dort eine Verknüpfung anlegen kann, hat
   Schreibrecht im Installationsverzeichnis und braucht den Umweg nicht —, und die
   Endungs-Positivliste begrenzt, was überhaupt herausgeht. Es ist trotzdem ein benannter,
   offener Punkt und kein getragenes Restrisiko: Ein `realpath` nach der Auflösung mit
   anschließender zweiter Präfixprüfung schlösse ihn.
2. **S-07 — `cargo audit` ist nie gelaufen.** Kein Ausnutzungsweg, sondern eine Wissenslücke:
   Der Rust-Baum ist nie gegen eine Schwachstellendatenbank geprüft worden. Ihre offene
   Benennung nützt mehr, als sie schadet, und unter MIT besonders — wer den Baum übernimmt,
   weiß, was er selbst prüfen muss.

**Korrektur an der eigenen Zählung.** Hier stand am Vormittag des 2026-09-02 „zwei Stellen:
V-4 und S-07". Das war schon damals falsch, und zwar nicht wegen V-4, sondern weil ich den
Punkt aus 12.7 übersehen hatte — es waren drei. Inzwischen ist V-4 behoben, und es sind wieder
zwei, aber es sind **andere** zwei. Der Fehler ist hier stehen gelassen statt weggeschrieben,
weil eine Zählung, die man nicht nachrechnen kann, genau die Sorte Aussage ist, vor der
Abschnitt 0 seit T-003 warnt.

Nicht in dieser Zählung, weil sie das Kriterium nicht erfüllen und das begründet: die neun
Restrisiken RR-1 bis RR-9 (bewusst getragen, Abschnitt 9) und S-09 (`style-src 'unsafe-inline'`
— eine Abschwächung, aber mit vollständigem Gegenargument an Ort und Stelle in
`apps/desktop/src/shell.ts`: `script-src` bleibt `'self'`, und kein Skript wird je aus einer
Zeichenkette ausgeführt).

Alles Übrige in diesem Dokument beschreibt geschlossene Türen und wie sie geschlossen wurden.
Das ist für einen Leser wertvoll und für einen Angreifer wertlos.

---

## 14. Nachprüfung R-3 (2026-09-03) — die Regel als Struktur

Anlass: der Branch `status-als-regelterm` (E-055 bis E-057), vier Commits, 99 geänderte Dateien.
Die Regel eines Pools ist keine Liste gleichartiger Terme mehr, sondern eine Struktur mit fünf
Achsen: erforderliche Tags mit Modus, ausgeschlossene Tags, Status, Erledigt, Exportstatus. Der
vollständige Befundbericht steht in `.claude/team/reports/R-3-security-checker.md`; hier steht
nur, was die **Bewertung** dieses Dokuments ändert.

### 14.1 Werkzeugstand

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 64 geänderten Quelldateien | **ja** | 129 Regeln, **0 Befunde** |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum vierten Mal. Offene Frage 8 bleibt offen. |
| 42Crunch-Audit und -Scan | **nein** | `42c-ast` weiterhin nicht installiert, `~/.42crunch` existiert nicht. **Es gibt weiterhin keinen Auditwert.** |
| `pnpm run boundaries`, `proof:route-policy`, `proof:access`, `proof:db-permissions`, `proof:openapi`, `proof:addin`, `proof:conflicts` | **ja** | sämtlich grün; 485 Prüfungen |
| Eigene Messungen gegen den zusammengesetzten Dienst (Injektion, Kosten, Statuscodes) | **ja** | 14.3 |
| Inhalt der beiden eingecheckten Bündel | **nein** | weder `unsquashfs` noch `dpkg-deb` auf dieser Maschine. Siehe 14.4. |

### 14.2 VG-2 fortgeschrieben — was das Add-in jetzt bekommt

Die Fläche des Add-in-Tokens ist in dieser Welle **inhaltlich gewachsen und im Ausschnitt
geschrumpft**. Beides gehört zusammengelesen:

- `AddinUnit.pools` steht auf `Pick<PoolPort, 'list' | 'resolveAxes'>`. Vorher waren es
  `'list' | 'resolveRule'` plus vorübergehend `'resolveExcluded'` — zwei Methoden sind weg, eine ist
  dazugekommen, und sie liest dieselben Zeilen derselben Tabelle.
- `GET /addin/context` liefert weiterhin Tagbaum, Status, Standard-Tags und die Pools. Der `Pool`
  trägt seit T-076 vier Felder mehr: `excludedTags`, `statusIds`, `completion`, `exportState`.
- Die Treffer- und die Buchungsantwort tragen zwei Namenslisten mehr: `enteringPoolNames` und
  `leavingPoolNames` neben dem bestehenden `poolNames`. *(Stand T-086. Seit T-104 tragen beide
  Antworten stattdessen **ein** Feld `poolMovement: { appears, enters, leaves } | null` — E-061
  Punkt 3, dieselbe Form wie an jeder anderen Route. Siehe 16.2; an der Bewertung dieses
  Abschnitts ändert das nichts, es ist dieselbe Auskunft in einer Hülle statt in dreien.)*

**Bewertung: dieselbe Datenklasse, keine neue.** Ordnerkennungen verließen den Dienst an dieser
Route schon vorher — als `folderId` im Regelterm und ohnehin vollständig über `folders.loadTree()`.
Die neu berechneten `emptyFolderIds` bleiben **im Dienst**: Sie werden ausschließlich zu
`unresolvedRequired` verrechnet und stehen in keiner Antwort. Poolnamen gingen seit T-038 hinaus;
`appears`/`enters`/`leaves` sind drei Sichten auf dieselbe Menge. Die vier zusätzlichen Regelfelder
sind Konfiguration, die der Benutzer selbst angelegt hat: Sie sagen, wonach eine Spalte filtert,
nicht was in ihr steht. Ein entwendetes Dauertoken (B-2.8, B-2.9) gewinnt damit Kenntnis über die
**Einrichtung**, nicht über Kundendaten — keine Todos, keine Vermerke, keine Buchungen fremder
Todos. `PoolWithResolution` hängt ausdrücklich an `/pools` und am Board und **nicht** an
`/addin/context`.

**B-2.10 bleibt geschlossen.** `requiredCredentialForPath` ist unverändert; abgesenkt sind nur der
Teilbaum `/api/v1/addin` und `GET /health`. `proof:route-policy` misst, dass die Add-in-Fläche
**genau vier Routen** sind, dass daneben genau `GET /health` abgesenkt ist und dass alle übrigen
60 Routen mit dem Add-in-Token 401 ergeben.

**Was dieser Nachweis nicht deckt, und das gehört in dieses Dokument.** Er bewacht die **Zahl und
Identität** der erreichbaren Routen, nicht den **Inhalt** ihrer Antworten. Die Add-in-Fläche wächst
künftig nicht über eine fünfte Route — die würde rot —, sondern über ein neues Feld an einer der
vier bestehenden Antworten. Genau das ist in dieser Welle zweimal geschehen (T-084, T-086), beide
Male begründet und beide Male vertretbar. Die Wache dagegen ist zweiteilig und **kein** Exitcode:
der Port-Ausschnitt in `routes/addin/ports.ts`, den ein Entwickler anfassen muss, um an neue Daten
zu kommen, und die Gestaltprüfung in `proof:openapi`. Wer diese Grenze künftig beurteilt, prüft
`ports.ts` und nicht die Routenliste.

### 14.3 B-1.7 fortgeschrieben — zwei gemessene Zahlen

Der Fragezeichenparameter `poolId` von `GET /todos` wird zerteilt, ohne geprüft und ohne gezählt zu
werden (`apps/local-api/src/routes/todos.ts:105`, `:114`). Injektion ist ausgeschlossen — gemessen
mit `'`, `a' OR '1'='1` und `%` als Poolkennung, alle drei ergeben 200 mit leerer Trefferliste, weil
die Abfrage ausschließlich mit Platzhaltern arbeitet. Die Wirkung ist Rechenzeit und ein
Statuscode:

| Anfrage (Ordnerkette 200 tief, Regel mit 200 Ordnertermen) | Antwort |
|---|---|
| eine Regel genannt | 200 in 42 ms |
| dieselbe Regel 200-mal genannt | 200 in **8 370 ms** |
| 999 unbekannte Kennungen | 200 |
| 1 000 unbekannte Kennungen | **500** `internal_error` (Ausdrucksbaumgrenze von SQLite) |

Die 500 verrät nichts: Der Text ist konstant, die Protokollzeile nennt nur den Schlüssel. Sie ist
ein **falscher Statuscode**, kein Auskunftsproblem — 422 wäre richtig. Die Schwelle liegt am
ODER-Aufbau und ist älter als dieser Branch; die 8,4 Sekunden sind neu in dieser Höhe, weil je
Poolkennung jetzt rund acht Abfragen statt zweier laufen.

**Einordnung.** A-02, die fremde Webseite, erreicht diesen Weg nicht: Die Kette weist sie vor dem
Router ab (eigene Kopfzeile, Herkunftsprüfung, `Sec-Fetch-Site`). Es bleibt A-03, ein lokaler
Prozess mit dem Sitzungsgeheimnis — und der hat größere Möglichkeiten, als den Dienst zu
beschäftigen. Der Sidecar ist allerdings einfädig: Acht Sekunden in einer Abfrage sind acht
Sekunden stehende Oberfläche und ein ausbleibendes Lebenszeichen des Timers, und das trifft auch
den Benutzer, der sich selbst eine ungünstige Regel gebaut hat. **Gegenmittel:** `poolId`,
`statusId` und `tagId` nach dem Zerteilen durch `z.array(idSchema).max(50)`.

Dazu gehört eine zweite Zahl. Die rekursive Ordnerauflösung trägt seit E-057 die Wurzel im Tripel
(`down(root, id, depth)`), weil sonst nicht zu sagen wäre, **welcher** genannte Ordner nichts
beigetragen hat. Der Preis: Der Aufwand ist je Term statt je Teilbaum. Gemessen an derselben Kette
kostet ein Ordnerterm 0,6 ms und kosten 200 Ordnerterme auf dieselbe Kette 41,6 ms — Faktor 70 bei
gleicher aufgelöster Tagmenge. Nach oben begrenzen ihn `max(200)` je Liste und die Schranke
`down.depth < 1000`; letztere ist zugleich das, was einen Zyklus im Ordnerbaum enden ließe, weil
das `UNION` über `(root, id, depth)` entdoppelt und `depth` mitläuft. Wer die Spitze nehmen will,
begrenzt die Zahl der **Ordner**terme enger als die der Tagterme.

### 14.4 B-11.4 und Abschnitt 13 fortgeschrieben — der Baum trägt jetzt 186 MB Bauergebnisse

Abschnitt 13 hat am 2026-09-02 „die 473 Dateien, die `git status --porcelain -uall` auflistet"
geprüft und für hygienisch befunden. Diese Aussage gilt für den Branch `status-als-regelterm`
**nicht mehr**. Mit `48c982a` sind hinzugekommen:

```
apps/desktop/release/x86_64-unknown-linux-gnu/Takt_0.1.0_amd64.AppImage   138 721 784 Bytes
apps/desktop/release/x86_64-unknown-linux-gnu/Takt_0.1.0_amd64.deb         47 511 598 Bytes
apps/desktop/release/x86_64-unknown-linux-gnu/SHA256SUMS                          179 Bytes
```

`git check-ignore` meldet Exitcode 1: Die Dateien sind von **keiner** Ignorierregel gedeckt.
`apps/desktop/.gitignore` schließt jedes andere erzeugte Ergebnis aus — `binaries/`,
`src-tauri/target/`, `src-tauri/taskpane/`, `.sidecar-build/` und seit `3240dcc` auch
`src-tauri/licenses/`, jedes mit ausgeschriebener Begründung. Der Ordner `release/` ist neu und in
keiner dieser Regeln enthalten. Es ist eine Lücke, keine Entscheidung.

**Wirkung, im Rahmen dieses Dokuments.**

1. **Nicht prüfbar (Abschnitt 13, VG-7).** Ein Bündel dieser Größe sieht in einem Review niemand
   an. `strings` über die `.AppImage` findet keine Pfade aus dem Heimatverzeichnis des
   Entwicklers; der Inhalt liegt aber in einem SquashFS, und weder `unsquashfs` noch `dpkg-deb`
   stehen hier zur Verfügung. **Was in diesen 186 MB steckt, ist nicht festgestellt.** Das Bündel
   enthält bauartbedingt die Sidecar-Binärdatei und das Add-in-Bündel aus `src-tauri/taskpane/`,
   also alles, was zur Bauzeit in diesen Verzeichnissen lag.
2. **Lieferkette (VG-7, B-10.x).** Eine eingecheckte, vorgebaute Binärdatei mit daneben liegender
   `SHA256SUMS` sieht aus wie eine beglaubigte Auslieferung und ist eine Selbstauskunft. Der
   nächste Schritt, der „nimm die Datei aus dem Repository" heißt, stünde auf einer Grundlage, die
   niemand geprüft hat.
3. **B-11.4 wörtlich.** „Der erste Commit ist die Veröffentlichung." Der Branch ist noch **nicht**
   gepusht — `git branch -r` kennt ihn nicht. Solange das so ist, kostet die Bereinigung einen
   Rebase; danach kostet sie eine Historienumschreibung auf einem geteilten Branch, und die 186 MB
   liegen bis dahin in jedem Klon.

**Gegenmittel (Orchestrator, vor dem Push).** `release/` in `apps/desktop/.gitignore` aufnehmen,
mit derselben Begründung wie bei `src-tauri/licenses/`; die drei Dateien aus der Historie des
Branches nehmen. Ein `git rm` in einem weiteren Commit genügt nicht — die Blobs blieben in der
Historie.

### 14.5 `pool_rule.status_id ON DELETE RESTRICT` — kein neuer Angriffsweg

Wer eine Regel mit einem Statusterm anlegt, macht diesen Status unlöschbar, bis die Regel geändert
oder entfernt ist. Ausdrücklich bewertet, weil die Frage nahe liegt:

1. **Der Hebel liegt hinter dem Sitzungsgeheimnis.** `POST /pools` ist eine der 60 Routen, die mit
   dem Add-in-Token 401 ergeben. Ein entwendetes Dauertoken erreicht ihn nicht.
2. **Wer das Sitzungsgeheimnis hat, hat mehr.** Todos löschen, Buchungen ändern, den Exportstatus
   zurücksetzen (B-2.10 beschreibt den Fall). Ein unlöschbarer Status ist demgegenüber kein
   Zugewinn.
3. **Reversibel und sichtbar.** 409 mit `status_in_use` und einem deutschen Satz; `proof:conflicts`
   misst die Gegenprobe, dass der Status nach dem Herausnehmen des Terms löschbar ist.

`RESTRICT` ist überdies die sicherheitlich richtige Wahl: `CASCADE` entkernte eine Regel
stillschweigend, und eine Spalte, die danach **mehr** Todos trifft als vorher, ist der Fehler in
die gefährliche Richtung. Kein Eintrag im Bedrohungskatalog, festgehalten als geprüft.

### 14.6 Was in dieser Welle nachweislich gehalten hat

- **VG-5, die Notiz-Trennung.** Alle vier Schichten grün, und zusätzlich dynamisch: `proof:openapi`
  sammelt jede Antwort des Szenariodurchlaufs ein und misst, dass der interne Vermerk in keiner
  außer seiner eigenen Route vorkommt. `Todo` trägt weiterhin kein Notizfeld.
- **Injektion.** Die neu zusammengesetzten Bedingungen arbeiten ausschließlich mit Platzhaltern;
  `IN`-Listen sind auf 200 begrenzt beziehungsweise geblockt. Nachgemessen, nicht gelesen.
- **Integrität der Abfrage.** Der in T-082 behobene Fehler an der Parameterreihenfolge wäre nach
  E-057 erreichbar geworden und hätte **alle** folgenden Werte einer Abfrage verschoben,
  einschließlich derer von Suche und Blätterung. Das ist ein Integritätsproblem an W-04 über den
  Umweg der Anzeige, und es ist behoben.
- **Fehlerhülle (B-2.4).** Fremdschlüssel- und Eindeutigkeitsverletzungen werden 422
  beziehungsweise 409 mit konstanten Sätzen; kein Indexname, keine SQLite-Meldung, kein
  Aufrufstapel verlässt den Dienst.
- **Lieferkette (VG-7).** `pnpm-lock.yaml` ist im gesamten Diff unverändert. Kein neues Paket.
- **Kein neuer XSS- oder ReDoS-Weg.** Kein `dangerouslySetInnerHTML`, kein `eval`, kein
  `new RegExp` im Diff; der konfigurierbare reguläre Ausdruck des Add-ins ist nicht angefasst.

### 14.7 Ein Nachweis, der grün wird, ohne etwas geprüft zu haben

Zum Schluss ein Punkt, der kein Loch ist und trotzdem in dieses Dokument gehört, weil mehrere
Aussagen darauf ruhen.

`packages/domain/scripts/check-export-boundary.mjs` trägt die vierte Schicht der Notiz-Trennung —
die, die kein Paketmanager erzwingen kann. Zwei seiner Prüfungen laufen über gesammelte Dateien und
melden deren Zahl als Fließtext (`packages/export: 8 Quelldatei(en)`, `298 Quelldatei(en)
außerhalb der Domäne`), **prüfen die Zahl aber nicht**. `collect()` gibt für ein nicht vorhandenes
Verzeichnis eine leere Liste zurück. Eine Umbenennung, ein Umzug oder ein Fehler im Sammler ergäbe
„0 Quelldatei(en) geprüft", Exitcode 0 und die Schlusszeile „Notiz-Trennung: alle Schichten
unverletzt."

Das ist die allgemeine Gestalt eines Risikos, das dieses Projekt an mehreren Stellen trägt: Die
Nachweisskripte unter `scripts/**/*.mjs` sieht kein Übersetzer (Board-Punkt O-L), und sie sind das
Sicherheitsnetz für Aussagen, die sonst niemand nachrechnet. Sie scheitern laut, wenn sie werfen —
Node beendet sich mit Code 1 —, aber sie scheitern **still**, wenn ihre Grundmenge leer ist oder
eine Vergleichszeile beidseitig `undefined` vergleicht. Die Gegenmaßnahme ist billig und steht in
`proof:route-policy` bereits vorbildlich da: eine Untergrenze auf die Zahl der geprüften Gegenstände
(`routes.length >= 60`), die rot wird, statt eine Null zu drucken. Dieselben zwei Zeilen fehlen im
Grenzwächter.

Ebenfalls unter O-L: `matchesPool` verlangt seit T-082 das Feld `unresolvedRequired`, und ein
fehlendes Feld liest sich zur Laufzeit als „nein" — also als die zu weite Antwort von vor E-057.
Für übersetzten Code und seit T-088 auch für die Prüffälle in domain, storage und export hält das
Typsystem; für `scripts/**/*.mjs` und `apps/*/test/**` hält es nichts. Die Skripte dieser Welle
geben das Feld ausdrücklich mit, und `proof-addin.mjs` misst sogar in **beide** Richtungen, dass es
den Unterschied macht. Die dauerhafte Antwort wäre ein Wurf in `matchesPool`, wenn das Feld kein
Wahrheitswert ist: Ein Aufrufer, der die Frage nicht beantwortet, bekäme einen lauten Fehler statt
einer zu weiten Antwort.

### 14.8 Urteil dieser Nachprüfung

**Freigegeben mit einer Auflage.** Der Code des Branches ist aus Sicht dieses Dokuments in Ordnung:
Die neuen Achsen sind an der Routengrenze geprüft und begrenzt, die Abfrage ist parametrisiert, die
Add-in-Grenze ist enger geworden, die Notiz-Trennung hält, und die Migration ist in beide
Richtungen mit engen Dateirechten gefahren. Die Auflage betrifft den **Baum**, nicht den Code: Die
186 MB aus 14.4 sind vor dem Push zu entfernen. Bis dahin gilt die Aussage aus Abschnitt 13 — „der
Baum, der veröffentlicht würde, ist geprüft" — für diesen Branch nicht.

---

## 15. Wiedervorlage R-3a (2026-09-04) — was aus den Befunden geworden ist

Anlass: `git diff 3240dcc..HEAD`, die Wellen A bis C und der eingemergte Zweig
`fix/windows-sidecar-bundle-check`; 113 geänderte Dateien. Abschnitt 14 bleibt stehen, wie er ist —
hier steht nur, was sich an seiner **Bewertung** ändert. Der vollständige Befundbericht liegt in
`.claude/team/reports/R-3a-security-checker.md`.

### 15.1 Werkzeugstand

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 85 geänderten Quelldateien | **ja** | 156 Regeln, **4 Befunde**, sämtlich in `apps/desktop/scripts/verify-sidecar.mjs` und sämtlich Fehlalarme (15.6). Keiner in Produktivcode. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **fünften** Mal. Offene Frage 8 bleibt offen. |
| 42Crunch-Audit und -Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Unverändert seit T-023. Es gibt weiterhin keinen Auditwert. |
| `pnpm run boundaries` | **ja** | grün, und diesmal mit belastbaren Zahlen: 8 Quelldateien in `packages/export`, 312 außerhalb der Domäne — beide über den neuen Untergrenzen. |
| `pnpm run typecheck` | **ja** | grün über neun Konfigurationen einschließlich `typecheck:test`. |
| `pnpm --filter @takt/storage migrations:embed:check` | **ja** | aktuell, 24 Datei(en). Eigener Vergleich: 24 zu 24, **null** inhaltliche Unterschiede, Schlüssel aufsteigend sortiert. |
| Nachweisläufe `proof:*`, `pnpm check`, `test:e2e` | **nein** | Port 17843 gehörte in diesem Zeitraum dem e2e-tester. Der Stand ist die Messung des Orchestrators zu `aca53df` (848/0, 648 Einheitentests, e2e 37/37) und **nicht** meine eigene. |

### 15.2 Die Auflage aus 14.4 ist erledigt — mit einem Rest

`3240dcc` ist **kein Vorfahr von `HEAD`** mehr; die Historie ist umgeschrieben worden
(`git filter-branch`, vermerkt im Board vor Welle A). Nachgemessen statt geglaubt: Der größte Blob
in der Historie von `HEAD` ist `apps/local-api/openapi/takt-local-api.yaml` mit 224 426 Bytes. Die
beiden Bündel kommen darin nicht mehr vor, und `apps/desktop/.gitignore:40` schließt `release/`
jetzt aus, mit ausgeschriebener Begründung wie bei allen Nachbarregeln. Die Aussage aus Abschnitt 13
— „der Baum, der veröffentlicht würde, ist geprüft" — gilt für diesen Branch damit wieder.

**Was übrig ist und in dieses Dokument gehört:** Der Sicherungszweig
`backup/status-als-regelterm-vor-filter` liegt weiterhin lokal und trägt die 186 MB. Er ist der
**einzige** Verweis in diesem Bestand, über den die Blobs noch erreichbar sind — daher auch die
181 MB im Paket und die 182 MB unter `.git`. `git push origin status-als-regelterm` veröffentlicht
ihn nicht; `git push --all` und `git push --mirror` tun es. B-11.4 („der erste Commit ist die
Veröffentlichung") ist damit nicht aufgehoben, sondern an eine Aufrufform verschoben. Er gehört
gelöscht, sobald die Wiedervorlagen angenommen sind, und danach `git reflog expire --expire=now
--all && git gc --prune=now` — sonst bleibt die Größe im Klon jedes Mitarbeiters, der ihn einmal
hatte.

### 15.3 VG-2 fortgeschrieben — die reine Board-Spalte hat die Grenze überschritten

Abschnitt 14.2 sagt, die Add-in-Fläche wachse künftig nicht über eine fünfte Route, sondern über
ein neues Feld an einer der vier bestehenden Antworten, und die Wache dagegen sei der
Port-Ausschnitt in `routes/addin/ports.ts`. Beides hat sich in dieser Welle bewährt und beides ist
zugleich vorgeführt worden:

- **Der Port-Ausschnitt ist unverändert.** `AddinUnit.pools` steht weiter auf
  `Pick<PoolPort, 'list' | 'resolveAxes'>` (`apps/local-api/src/routes/addin/ports.ts:146`); die
  Datei ist im ganzen Diff nicht angefasst worden. Neue Routen gibt es keine, und
  `apps/local-api/src/access/**`, `app.ts`, `config.ts` und `composition.ts` sind ebenfalls
  unberührt.
- **Und trotzdem sieht das Add-in seit dieser Welle etwas Neues.**
  `apps/local-api/src/usecases/pool-movement.ts:152` fragt `pools.list('all')`, also einschließlich
  der Regeln mit `placement: 'board'`. Der Add-in-Dienst benutzt genau diesen Anwendungsfall
  (`routes/addin/service.ts:291`, `:722`) und gibt seine drei Namenslisten als `poolNames`,
  `enteringPoolNames` und `leavingPoolNames` heraus (`routes/addin/index.ts:367`, `:373`, `:379`).
  Die **Namen reiner Kanban-Spalten** verlassen den Dienst damit erstmals über das Add-in-Token.
  `GET /addin/context` bleibt bei `list()` (E-058 Punkt 7) — die Vordertür ist zu, die Seitentür
  steht auf. *(Zeilen und Feldnamen sind der Stand von R-3a. Seit T-104 ist es **ein** Feld
  `poolMovement`; die heutigen Stellen stehen in 16.2. Die Bewegung selbst und damit die Bewertung
  dieses Abschnitts sind unverändert.)*

**Bewertung: begründet, dokumentiert, und dennoch eine Grenzverschiebung.** Sie ist die
unvermeidliche Folge von E-056: Der Fall, für den der Satz geschrieben wurde, **ist** die reine
Board-Spalte „erledigt und noch nicht abgerechnet". Wer die Bewegung aus ihr heraus verschweigt,
sagt die halbe Wahrheit — dagegen ist der Zuwachs an Kenntnis gering. Die Datenklasse bleibt
dieselbe wie in 14.2: Namen von Regeln, die der Benutzer selbst angelegt hat. Sie sagen, wonach
gefiltert wird, nicht was in der Spalte steht. Die Regelfelder reiner Spalten
(`excludedTags`, `statusIds`, `completion`, `exportState`) bleiben draußen, weil `list()` sie gar
nicht erst liefert; `emptyFolderIds` bleibt wie bisher im Dienst und wird nur zu
`unresolvedRequired` verrechnet.

**Kein Bedrohungseintrag, wohl aber eine Festlegung für den nächsten Leser.** Ein entwendetes
Add-in-Token (B-2.8, B-2.9) kann über wiederholtes Anlegen und Bebuchen von Todos einen Teil der
Spaltennamen aufzählen. Das ist der Preis von E-056, er ist bewusst gezahlt, und die
OpenAPI-Beschreibung sagt es an ihrem Schema ausdrücklich („**Auch reine Kanban-Spalten stehen
darin**", `PoolMovement`). Was daraus folgt: **Die Add-in-Grenze wird ab jetzt nicht mehr allein an
`ports.ts` beurteilt.** Der Port-Ausschnitt ist gleich geblieben, während die Fläche wuchs — weil
die Ausweitung nicht in einer neuen Methode lag, sondern in einem **Argument** an einer alten
(`list()` gegen `list('all')`). Wer diese Grenze künftig prüft, liest den Ausschnitt **und** die
Argumente, mit denen er gerufen wird.

### 15.4 Zwei Nachweispfade, die es gibt und die niemand ruft

14.7 hat die allgemeine Gestalt beschrieben: Nachweisskripte scheitern laut, wenn sie werfen, und
still, wenn ihre Grundmenge leer ist. Der Grenzwächter ist repariert
(`packages/domain/scripts/check-export-boundary.mjs:221-222`, Untergrenzen 1 und 50, dazu ein
`fail()`, wenn `packages/export` fehlt). Zwei Prüfungen derselben Familie fehlen jedoch nicht in
ihrer Aussage, sondern in ihrer **Aufrufkette**:

1. **`migrations:embed:check` steht in keiner Kette.** `packages/storage/package.json:17` kennt ihn,
   `pnpm check` und `proof:all` rufen ihn nicht. `migrations.embedded.ts` ist erzeugter Code und die
   einzige Fassung der Migrationen, die im Node-SEA überhaupt vorhanden ist — was nicht durch den
   Bündler geht, gibt es in der ausgelieferten Anwendung nicht. Heute stimmen die 24 Dateien Zeichen
   für Zeichen mit `packages/storage/migrations/` überein; das habe ich gemessen. Nichts hält das
   fest. Ein Auseinanderlaufen hat zwei Ausgänge, und beide sind teuer: Entweder führt die
   ausgelieferte Fassung anderes DDL aus, als das Repository zeigt, oder — häufiger —
   `schema_migration.checksum` weicht ab und der Dienst verweigert den vorhandenen Bestand des
   Kunden („Die bereits gelaufene Migration N unterscheidet sich von der mitgelieferten Datei. Es
   wird nichts migriert."). Das ist ein Verfügbarkeitsausfall beim Kunden aus einem vergessenen
   Befehl. Eine Zeile in `proof:all`.
2. **Die veröffentlichte `SHA256SUMS` prüft niemand.** `.github/workflows/release.yml:421` legt die
   Prüfsummendateien der drei Läufer zusammen, `:506` veröffentlicht sie neben den Erzeugnissen —
   dazwischen steht kein `sha256sum -c`. Die Datei behauptet also etwas über Dateien, die im selben
   Auftrag heruntergeladen und nie dagegen gehalten wurden. Das ist wörtlich der Vorwurf aus 14.4
   Punkt 2 („sieht aus wie eine beglaubigte Auslieferung und ist eine Selbstauskunft"), nur eine
   Ebene weiter: Er trifft jetzt nicht mehr eingecheckte Binärdateien, sondern die tatsächliche
   Auslieferung. `cd versand && sha256sum -c SHA256SUMS` vor dem `gh release create` macht aus der
   Selbstauskunft eine Prüfung. Nebenbei: `cp -n` im selben Schritt verschluckt eine
   Namenskollision lautlos, und die Vollzähligkeitsprüfung zählt nur „mindestens eine je Muster".

**Was am Auslieferungsablauf ausdrücklich in Ordnung ist**, weil er neu in diesem Baum liegt und
sonst niemand ihn gegen VG-7 gehalten hat: Alle Aktionen sind auf vollständige Commit-Hashes
festgenagelt, mit der Fassung als Kommentar daneben. `permissions` steht oben auf `contents: read`
und nur der Veröffentlichungsauftrag hebt es auf `contents: write`. Es gibt kein `pull_request_target`
und kein langlebiges Zugangsmerkmal — allein `secrets.GITHUB_TOKEN`. Die vom Benutzer wählbare
Fassungsangabe geht über `env:` in die Shell und nicht mitten in eine Zeile, sie wird gegen
`^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` geprüft **bevor** sie nach `$GITHUB_OUTPUT` geschrieben
wird, und `gh release create --verify-tag` legt kein Etikett an, das es nicht gibt. Das ist mehr
Sorgfalt, als dieser Punkt gewöhnlich bekommt.

### 15.5 Neu bewertet: Regelnamen als Text, und der Anker der Oberfläche

Beides ist in Welle C hinzugekommen und beides ist die richtige Frage.

**Regelnamen in Fehlertexten (`details[]`).** Der Dienst legt seit T-089 die blockierenden Regeln
beim Namen in `details` ab (`packages/storage/src/sqlite/mappers.ts:226` `poolReference`, gerufen in
`repo-tags.ts:522` und `repo-statuses.ts:310`), und `apps/web/src/lib/errorText.ts:98` baut daraus
einen zweiten Satz. **Kein XSS-Weg:** Im gesamten Diff steht kein `dangerouslySetInnerHTML`, kein
`innerHTML`, kein `eval` und kein `new Function`; die Texte gehen als Kinder in React-Elemente
(`StatusSettings.tsx:422-434`, `TagsScreen.tsx:425-430`) und werden dort maskiert. Zwei Kanten
bleiben, beide ohne Angreifer und beide billig zu schließen:

- **Steuer- und Richtungszeichen sind erlaubt.** `nameSchema`
  (`apps/local-api/src/http/input.ts:58`) ist `z.string().trim().min(1).max(200)` — ohne Aussage
  über U+0000 bis U+001F, U+007F oder die bidirektionalen Steuerzeichen U+202A bis U+202E und
  U+2066 bis U+2069. React maskiert HTML; es macht ein U+202E nicht unschädlich, und das dreht den
  Rest der Zeile optisch um. Diese Namen reisen seit dieser Welle weiter als je zuvor: in den
  Bewegungssatz an **beiden** Flächen, in den Aufgabenbereich des Add-ins und in die Löschdialoge.
  `apps/local-api/src/access/session-secret.ts:85` trägt die passende Prüfung bereits ausgeschrieben.

  > **Nachtrag T-125 (2026-09-04).** Die Aufzählung oben ist der Stand von R-3a und **unvollständig
  > gemessen an heute**: Es fehlen die drei Richtungsmarken U+061C (ALM), U+200E (LRM) und U+200F
  > (RLM), die T-117 nachgetragen hat. Der Absatz bleibt als Protokoll stehen — er sagt, was am
  > 2026-09-04 vor Welle K bekannt war —, aber wer ihn als Beschreibung der Klasse liest, liest
  > eine Auswahl. **Die maßgebliche Fassung steht seit T-122 an genau einer Stelle im Baum:**
  > `packages/domain/src/characters.ts`, als Codepunktbereiche und nicht als Ausdruck. Der Satz
  > „session-secret.ts:85 trägt die passende Prüfung bereits ausgeschrieben" ist überholt und in der
  > guten Richtung: Diese Datei trägt die Prüfung nicht mehr selbst, sie liest sie (T-122, siehe 17.1).
- **`details` ist der Zahl nach unbegrenzt.** Die beiden Abfragen liefern eine Zeile je verweisender
  Regel, ohne `LIMIT`, und eine Obergrenze für die Zahl der Pools gibt es nirgends. Bei zweihundert
  Zeichen je Name steht der ganze Bestand in einem Satz. Kein Grenzübertritt — Pools legt nur an,
  wer das Sitzungsgeheimnis hat —, aber der Dialog wird unlesbar, lange bevor er teuer wird.

**Der Anker (`navigate` über `location.assign`).** Ausdrücklich geprüft, weil ein `location.assign`
mit fremdem Text der klassische Weg zu `javascript:` und zum Protokollwechsel ist: **Hier ist er es
nicht.** `href()` (`apps/web/src/app/router.ts:54-59`) setzt den Anker aus drei Teilen zusammen, und
keiner davon ist frei: das Segment aus `SEGMENT`, einem festen `Record<RouteName, string>`, die
Kennung durch `encodeURIComponent` und die Abfragezeichenkette durch `URLSearchParams.toString()`.
Das Ergebnis beginnt bauartbedingt mit `#/`; ein `javascript:`, ein `//host` oder ein
Protokollwechsel ist daraus nicht herstellbar, auch nicht aus einer Kennung, die aus einer Antwort
des Dienstes stammt. Die Gegenrichtung hat eine Kante: `parseRoute` ruft `decodeURIComponent` ohne
Netz (`router.ts:93`, `:106`), und `#/todos/%` ist ein `URIError`. In `useRoute.ts:75` fällt der in
den Aufbau des Zustands, die Oberfläche entsteht dann gar nicht. Erreichbar ist das nur, wenn jemand
den Anker von Hand setzt — die Anwendung selbst erzeugt ihn nie.

**Das Neuladen (`useDataFreshness`).** Kein Zeitgeber, keine Schleife, keine Wiederholung nach einem
Fehlschlag: Die Zahl steigt ausschließlich durch eine Navigation (`useRoute.ts:96-103`), und
`visibilitychange` hängt an einer Handlung des Benutzers. Ein abgelaufenes oder ungültiges
Sitzungsgeheimnis erzeugt deshalb **keinen** Anfragesturm — die 401 wird zum Fehlerzustand der
Ansicht und bleibt dort stehen. Ein Neuanmelden gibt es nicht; der Weg zurück ist der Neustart der
Anwendung, und das ist bei einem Geheimnis, das nur im Arbeitsspeicher lebt, die richtige Antwort.
Was fehlt, ist eine Bremse: Jeder Fensterwechsel löst `reload()` **und** `bump()` aus, also einen
Schwung Anfragen gegen einen einfädigen Sidecar. Bei zwanzig Wechseln in zwanzig Sekunden sind das
zwanzig Schwünge. Wettläufe entstehen dabei nicht — `useAsync` verwirft veraltete Antworten über
seinen Generationenzähler (`useAsync.ts:36`, `:45`).

### 15.6 Migration 0012 und die vier Semgrep-Meldungen

**Migration 0012 ist sauber gebaut.** Der Tabellenumbau ist Zeile für Zeile der aus 0011, die Marke
`-- takt: foreign_keys=off` steht in beiden Richtungen, der Läufer setzt das Pragma **vor** `BEGIN`
(`migration-runner.ts:248`), führt `pragma_foreign_key_check` über den **ganzen** Bestand aus, bevor
er festschreibt (`:354`), und stellt die Prüfung in einem `finally` wieder her (`:274`). Die
Rückwärtsrichtung verliert **nichts**: dieselben fünf Spalten, derselbe CHECK, derselbe Inhalt; sie
setzt allein `tag_id` und `folder_id` auf CASCADE zurück und sagt in ihrem eigenen Kopf, was sie
damit wieder aufmacht. `RESTRICT` auf allen drei Termspalten ist die Fortsetzung von 14.5 und aus
demselben Grund richtig.

Eine Unsymmetrie bleibt: `legacy_alter_table` wird **nicht** im `finally` zurückgesetzt, sondern nur
von der letzten Zeile der Migrationsdatei (`0012_pool_rule_restrict.up.sql:122`). Wirft eine
Migration mittendrin, läuft `ROLLBACK`, und die Verbindung behält `legacy_alter_table = ON` — eine
Einstellung, unter der ein `RENAME` die Verweise der Nachbartabellen nicht mehr nachzieht. Heute
folgenlos, weil ein Fehlschlag den Start beendet. Der Schalter gehört trotzdem in dieselbe Klammer
wie `foreign_keys`, aus demselben ausgeschriebenen Grund.

**Die vier Semgrep-Meldungen** stehen alle in `apps/desktop/scripts/verify-sidecar.mjs`, einem
Prüfskript der Bauzeit, das nie ausgeliefert wird. Dreimal `react-insecure-request` (`:467`, `:472`,
`:487`) trifft `fetch('http://127.0.0.1:…')` — das ist die Architektur dieses Projekts und keine
Nachlässigkeit; die Begründung, warum die Schleife ohne TLS auskommt, steht in Abschnitt 5. Einmal
`unknown-value-with-script-tag` (`:212`) trifft ein `<script src="./assets/taskpane.js">` in einer
festen Zeichenkette, in die nichts eingesetzt wird; die Regel stört sich an der Variablen
`taskpaneDir` daneben, die ein Dateipfad ist. Alle vier: kein Befund.

Zwei Einschränkungen dieses Laufs, damit sie niemand überliest: Semgrep hat
`apps/local-api/openapi/takt-local-api.yaml` (ab Zeile 4141) und `packages/domain/src/index.ts`
(Zeile 37) nur **teilweise** geparst. Die Aussage „100 % geparst" aus 14.1 gilt für diesen Lauf
nicht.

### 15.7 Was in dieser Welle nachweislich gehalten hat

- **Die Notiz-Trennung (VG-5)** — und diesmal mit einem Wächter, der nicht mehr über nichts grün
  werden kann. `packages/export` ist im ganzen Diff **unberührt**; `usecases/pool-movement.ts` und
  `packages/domain/src/pool-movement.ts` kennen kein Notizfeld. Die drei Listen tragen Namen und
  sonst nichts. *(Seit T-104 sind es die drei Listen **innerhalb** von `poolMovement`; für die
  Notiz-Trennung ändert das nichts — siehe 16.6.)*
- **Die Eingabeprüfung von `GET /todos`.** `commaSeparatedIds`
  (`apps/local-api/src/http/input.ts:52`) zerlegt **vor** der Prüfung und hält dann
  `z.array(idSchema).min(1).max(50)`; `todos.ts:122-124` schickt alle drei Kennungslisten hindurch.
  Aus dem `500` von 14.3 ist ein `422` mit Feldangabe geworden, und die dort gemessenen 8,4 Sekunden
  sind auf ein Viertel gedeckelt. `as never` ist an dieser Stelle verschwunden.
- **Die Vertrauensgrenze selbst.** `access/**`, `app.ts`, `config.ts`, `composition.ts` und
  `taskpane/server.ts` sind nicht angefasst. Die Pfadprüfung des Aufgabenbereichs
  (`taskpane/server.ts:236-239`) hat weiterhin ihre **eigene** Fassung und ist nicht durch das neue
  `isInside` aus `apps/desktop/scripts/paths.mjs` ersetzt worden — richtig so: Das eine ist
  Laufzeit an einer Vertrauensgrenze, das andere zählt zur Bauzeit Dateien in einem Bündel.
- **Die Lieferkette.** `pnpm-lock.yaml` ist im gesamten Diff unverändert, kein neues Paket.
  `verify-node-checksums.mjs` ist ein reiner Vergleich ohne Schreibzugriff und benennt seine Grenze
  selbst: Er prüft die **Signatur** von `SHASUMS256.txt` nicht und sagt das im Kopf, statt es zu
  verschweigen.
- **Repository-Hygiene.** Keine Zugangsdaten, keine Schlüssel in versionierten Dateien. Die
  Call-Nummern sind durchweg erfunden und als solche erkennbar (`TCK-000042`, `TCK-000815`,
  `SVC-4711`, `TCK-999999`). Die neuen End-zu-End-Fälle arbeiten mit `E2E-…-${run}`-Namen. Die
  einzigen echten E-Mail-Adressen im Arbeitsbaum stehen in
  `apps/desktop/src-tauri/licenses/THIRD-PARTY-LICENSES.txt` — Autorenangaben fremder Pakete, und
  die Datei ist seit `3240dcc` ignoriert und nicht versioniert.
- **Der konfigurierbare reguläre Ausdruck des Add-ins** (`apps/outlook-addin/src/callnumber/**`) ist
  im ganzen Diff nicht angefasst. B-4.2 bleibt, wie es war.

### 15.8 Urteil dieser Wiedervorlage

**Freigegeben.** Alle Befunde aus R-3, die eine Nacharbeit verlangten, sind erledigt und
nachgemessen: die 186 MB aus der Historie, die Untergrenzen im Grenzwächter, die Prüfung der drei
Kennungslisten, der 409 mit dem Namen der Regel und die Laufzeitwache in `matchesPool`. Kein
blockierender Befund. Die drei Punkte aus 15.2 bis 15.4 — der Sicherungszweig, der ungerufene
`migrations:embed:check` und die ungeprüfte `SHA256SUMS` — sind Gates und Hygiene, keine Löcher im
laufenden Erzeugnis; sie gehören vor den Push beziehungsweise vor die erste Auslieferung erledigt.
Das Tor aus Abschnitt 8 bleibt an einer Stelle uneinlösbar: Für inzwischen über 44 Pfade gibt es
weiterhin keinen 42Crunch-Auditwert, und Semgrep Guardian war zum fünften Mal nicht erreichbar.
Beides ist eine Beschaffungsentscheidung und kein Befund dieses Branches.

---

## 16. Prüfung T-112 (2026-09-04) — Wellen E bis G: eine Form, ein Feld, eine Tür zu wenig

Prüfumfang: `git diff aca53df..4dd3171` — die Wellen E (T-101 bis T-103), F (T-104 bis T-106) und
G (T-107 bis T-109) samt der Wiedervorlagen R-1a, R-2a, R-3a. 120 geänderte Dateien, davon 97
übersetzbare Quelldateien. Verantwortlich: security-checker.

### 16.1 Werkzeugstand

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 97 geänderten Quelldateien | **ja** | 156 Regeln, 97 Ziele, **0 Befunde**, rund 99,9 % geparst. Aus `p/secrets` null Treffer. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **sechsten** Mal, seit T-003 unverändert. Es liegt kein Plattformbefund vor, weder positiv noch negativ. |
| 42Crunch-Audit, 42Crunch-Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Die OpenAPI-Beschreibung liegt vor und ist weiter gewachsen; das Hindernis ist ausschließlich das Werkzeug. Offene Frage 8 bleibt offen. |
| `pnpm run proof:migrations` | **ja** | „`migrations.embedded.ts` ist aktuell (24 Datei(en))." |
| `pnpm run boundaries` | **ja** | grün: 8 Quelldateien in `packages/export`, **319** außerhalb der Domäne, „Notiz-Trennung: alle Schichten unverletzt". |
| Eigene Mustersuche über den versionierten Baum (Zugangsdaten, Call-Nummern, E-Mail-Adressen, unsichtbare Zeichen) | **ja** | siehe 16.7 |
| `pnpm check`, `pnpm test`, `pnpm test:e2e`, die portgebundenen Nachweispfade | **nein** | Untersagt: Die Ports 17843/17844 gehören dem Orchestrator, und `apps/web/**` sowie `apps/*/test/**` sind gerade in fremder Arbeit. Wo ich mich unten auf einen Nachweispfad berufe, steht dazu, dass es eine fremde Messung ist. |

**Zwei Befunde aus R-3a sind seither erledigt, und ich habe es nachgemessen.** `proof:migrations`
steht jetzt als erster Schritt in `proof:all` (`package.json`; Befund S-2 aus R-3a), und
`.github/workflows/release.yml:423` hält die veröffentlichte Prüfsummenliste mit
`sha256sum -c --strict` gegen die Dateien, die daneben hochgehen (S-3) — das `--strict` geht über
den Vorschlag hinaus und ist richtig so. **S-1 steht unverändert:** Der Zweig
`backup/status-als-regelterm-vor-filter` existiert weiter, `size-pack` misst unverändert
181,07 MiB. Von den sieben Hinweisen aus R-3a sind H-4 (`legacy_alter_table` im `finally`,
`migration-runner.ts:281`), H-5 (`decodeSegment` mit `try`, `router.ts:90-96`), H-6
(`VISIBILITY_MIN_GAP_MS`, `useDataFreshness.ts:138`) und H-7 (kein `new RegExp` aus einem Namen
mehr im End-zu-End-Test) erledigt; H-1 und H-3 stehen unten in neuer Fassung, H-2 in 16.4.

### 16.2 VG-2 fortgeschrieben — die Add-in-Antworten tragen jetzt `poolMovement`

Die Form, die 14.2 und 15.3 mit `poolNames`/`enteringPoolNames`/`leavingPoolNames` beschreiben, gibt
es nicht mehr. Seit T-104 (E-061 Punkt 3) liefern **beide** Add-in-Routen dasselbe Feld wie jede
andere Route:

| Stelle | heute |
|---|---|
| `apps/local-api/src/routes/addin/service.ts:192` | `AddinTodoMatch.poolMovement: PoolMovement \| null` |
| `apps/local-api/src/routes/addin/service.ts:323`, `:716` | `bookingMovement(...)` — eine Hilfsfunktion für beide Routen |
| `apps/local-api/src/routes/addin/index.ts:217` | `matches: result.matches` — `GET /addin/todo-matches` |
| `apps/local-api/src/routes/addin/index.ts:377` | `poolMovement: result.poolMovement` — `POST /addin/todos/{todoId}/time-entries` |
| `apps/local-api/src/usecases/pool-movement.ts:381` | `unit.pools.list('all')` — unverändert der Ort, an dem die reine Board-Spalte hereinkommt |
| `apps/local-api/src/routes/addin/ports.ts:146` | `Pick<PoolPort, 'list' \| 'resolveAxes'>` — **unverändert** |

**Bewertung: dieselbe wie in 15.3.** Es ist dieselbe Auskunft — Namen von Regeln, die der Benutzer
selbst angelegt hat, einschließlich reiner Kanban-Spalten — in **einer** Hülle statt in dreien. Es
kommt kein Feld hinzu, es gehen zwei weg, und keine Zeichenkette wechselt ihre Datenklasse. Die
Feststellung aus 15.3 gilt unverändert und jetzt in beide Richtungen: Der Port-Ausschnitt ist
derselbe geblieben, während die Fläche sich erst ausdehnte (T-086) und nun wieder einzog —
**wer diese Grenze prüft, liest den Ausschnitt, die Argumente, mit denen er gerufen wird, und zählt
die Felder der Antwort; die Methodenliste des Ports allein sagt es nicht.**

Dieselbe Form liefern seit dieser Welle auch `PUT`/`DELETE /todos/{todoId}/done` (E-060, T-101) und
`POST /time-entries` (Nachtrag zu E-061, T-107) — beides Routen der **Hauptfläche**, hinter dem
Sitzungsgeheimnis und nicht am Add-in-Token. Für VG-2 ändert sich dadurch nichts.

**Gemessen, nicht angenommen:** `apps/local-api/src/access/**`, `app.ts`, `config.ts`,
`composition.ts`, `apps/local-api/src/taskpane/**`, `packages/export/**`,
`apps/outlook-addin/src/callnumber/**`, `packages/storage/migrations/**`,
`apps/desktop/src-tauri/**` und `pnpm-lock.yaml` sind im **ganzen** Diff `aca53df..4dd3171`
unberührt — null geänderte Dateien je Pfad. Der Diff über `apps/local-api/src/routes/` enthält
keine einzige hinzugefügte `routes.get/post/put/patch/delete`-Zeile. Das Tokenmodell aus T-011, die
Herkunftsprüfung, die Pfadprüfung des Aufgabenbereichs und der Worker um den konfigurierbaren
regulären Ausdruck stehen unverändert.

### 16.3 `details[].name` — eine neue Ausgabestelle desselben Namens

Seit T-107 trägt `TaktFieldError` neben `field`, `code` und `message` das freiwillige Feld `name`
(`packages/domain/src/kernel.ts:177`): den **bloßen** Regelnamen, ohne Gattungswort und ohne
Anführungszeichen. Gebildet wird er an genau einer Stelle — `poolReference` in
`packages/storage/src/sqlite/mappers.ts:244` —, und über sie erben ihn alle drei Sperren, die eine
Regel nennen: `TagPort.remove` (`repo-tags.ts:250`), `TagFolderPort.remove` (`repo-tags.ts:565`)
und `TodoStatusPort.remove` (`repo-statuses.ts:320`).

**Was daran gut ist.** Eine Bildungsstelle statt dreier; `message` bleibt Zeichen für Zeichen, wie
es war, die Änderung ist rein additiv; und der Grund ist der richtige: Ohne dieses Feld müsste die
Oberfläche den Namen aus einem fremden Satz **herausschneiden**, und ein Ausdruck, der heute das
Wort „Regel" abschneidet, schneidet morgen die Hälfte des Namens ab, ohne dass jemand rot wird.

**Was daran neu ist.** Der Name geht zum ersten Mal **unumhüllt** hinaus. Bisher stand er in einem
deutschen Satz; jetzt liegt er als eigener Wert bereit, den eine Oberfläche roh setzen kann. Die
Datenklasse ändert sich damit nicht — es ist derselbe Wert, den `GET /pools` ohnehin liefert
(B-2.4) —, wohl aber die Zahl der Stellen, an denen er ohne umgebenden Text erscheint.

**Die Obergrenze aus H-3 hält, und sie hat eine Sollbruchstelle.** Alle drei Abfragen tragen
`LIMIT RULE_REFERENCE_PROBE` (21) und geben höchstens `RULE_REFERENCE_LIMIT` (20) Namen heraus
(`mappers.ts:279`, `:292`). Die Kürzung wird **bemerkt**, weil eine Zeile mehr geholt wird, als
gezeigt wird — die stille Kürzung aus B-3b ist damit vermieden. Der Hinweis darauf steht aber im
`message` der **Hülle** („Es sind mehr als 20; genannt werden die ersten 20.",
`repo-tags.ts:253`) und **nicht** in `details`. Wer den Satz künftig allein aus `details[].name`
zusammensetzt und den Text des Dienstes weglässt, holt die stille Kürzung zurück. Das ist kein
Befund am heutigen Stand — es ist die Bedingung, unter der `details[].name` benutzt werden darf, und
sie gehört an die Stelle, an der er benutzt wird.

**XSS-Weg: keiner, heute.** Über den **ganzen** Baum `apps/web/src`, `apps/outlook-addin/src`,
`apps/local-api/src` und `packages/*/src` steht kein `dangerouslySetInnerHTML`, kein `innerHTML`,
kein `outerHTML`, kein `insertAdjacentHTML`, kein `document.write`, kein `eval` und kein
`new Function`. `errorMessageWithRules` (`apps/web/src/lib/errorText.ts:98`) liest zum Zeitpunkt
dieser Prüfung weiterhin `entry.message` und geht als React-Textknoten in
`StatusSettings.tsx:423-433` und in `TagsScreen.tsx`. B-12.1 Gegenmittel 1 hält.

**Nachgeprüft: T-110 ist während dieser Prüfung im Arbeitsbaum gelandet, und es hält.** Als ich
den obigen Absatz schrieb, las `errorText.ts` noch `entry.message`; frontend-dev hat die
Umstellung im selben Zeitraum abgelegt. Gegen den neuen Stand geprüft:

- **Kein neuer Ausgabeweg.** `ruleList` bildet weiterhin **Zeichenketten**, und
  `errorMessageWithRules` gibt eine Zeichenkette zurück, die an denselben zwei Stellen als
  React-Kind steht. Über den ganzen Arbeitsbaum steht unverändert kein `dangerouslySetInnerHTML`,
  kein `innerHTML`, kein `eval`, keine `new Function`.
- **Die Sollbruchstelle aus H-3 ist nicht ausgelöst.** `errorMessageWithRules` beginnt mit
  `errorMessage(cause)` — dem Satz des Dienstes samt „Es sind mehr als 20; genannt werden die
  ersten 20." — und hängt die Aufzählung daran. Der Kürzungshinweis geht nicht verloren.
- **Der Rückfall ist ausgesprochen und nicht still.** `name === undefined` nimmt `message`, und
  `named` verlangt, daß **jeder** Eintrag einen Namen mitbringt, bevor das Gattungswort nach vorn
  wandert. Ein gemischter Satz („die Regeln Regel „Ost“ und „Nord“") kann so nicht entstehen.
- **Offen bleibt allein Punkt 2 aus 16.5:** Die Namen stehen weiterhin in **einem**
  zusammengefügten Satz, und die Anführungszeichen setzt seit T-110 die Oberfläche
  (`„${name}“`) statt des Dienstes. Das ist kein Rückschritt — ein Name konnte auch im Satz des
  Dienstes ein Anführungszeichen tragen —, aber die Bauart, die diese Frage endgültig
  beantwortet, ist die Liste aus eigenen Knoten und nicht der eine Satz.

### 16.4 Befund T-112-1 — die Wache aus H-2 fehlt an der Add-in-Tür

**Schwere: sollte.** **Akteure:** A-06 (der Absender einer E-Mail), A-01 unabsichtlich.
**Betrifft:** B-12.1, B-12.3, VG-2, VG-8. **Zuständig:** integration-dev
(`apps/local-api/src/routes/addin/**` ist seine Hoheit). **Ort:**
`apps/local-api/src/routes/addin/schema.ts:66` (`title`) und `:85` (`tagNames`).

T-101 hat H-2 aus R-3a umgesetzt: `apps/local-api/src/http/input.ts:111` führt eine Zeichenklasse
über C0 (U+0000 bis U+001F), C1 (U+007F bis U+009F) und die bidirektionalen Formatierungszeichen
(U+202A bis U+202E, U+2066 bis U+2069), und `titleSchema` (`:126`) wie `nameSchema` (`:127`) weisen
einen Treffer mit 422 ab, ohne den Wert in der Meldung zu wiederholen. Das ist gut gebaut: eine
Prüfung, zwei Schemata, deutsche Meldung, kein stilles Bereinigen. Über sie laufen alle Namen der
Hauptfläche — Tags, Ordner, Regeln, Status, Exportvorlagen (`routes/structure.ts`,
`routes/export.ts`) — und die Titel und Tagnamen aus `POST /todos` (`routes/todos.ts:51`, `:66`).

> **Nachtrag T-125 (2026-09-04).** Auch diese Aufzählung ist der Stand vor Welle K und
> **unvollständig**: T-117 hat U+061C, U+200E und U+200F ergänzt, T-122 die ganze Klasse nach
> `packages/domain/src/characters.ts` gelegt. `input.ts` führt sie seither nicht mehr, sondern
> liest sie (`hasForbiddenNameCharacter`, `FORBIDDEN_NAME_CHARACTER_MESSAGE`; nachgesehen an
> `input.ts:15-17`, `:140`). Der Absatz bleibt als Protokoll stehen; die vollständige und
> gemessene Fassung steht in 17.1.

**Die Add-in-Routen laufen nicht über sie.** `routes/addin/schema.ts` hat sein eigenes Schema, und
es ist auf dem Stand von vor T-101 geblieben: `title` ist `z.string().trim().min(1).max(512)`,
`tagNames` ist ein Feld aus `z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH)`. Keine
Zeichenprüfung an beiden.

Die Fachregel dahinter schließt die Lücke nicht: `checkTagNames` und darunter `checkName`
(`packages/domain/src/tag-name.ts:213`) normalisieren nach NFC und ziehen Leerraum zusammen, und die
Menge `WHITESPACE` (`:147`) enthält U+0009 bis U+000D, U+00A0, U+2000 bis U+200A, U+2028, U+2029,
U+202F, U+205F, U+3000 und U+FEFF — aber **nicht** U+0000 bis U+0008, **nicht** U+000E bis U+001F,
**nicht** U+007F bis U+009F und **nicht** die bidirektionalen Formatierungszeichen. Sie gehen durch.

**Warum das mehr wiegt als H-2 selbst.** R-3a hat H-2 mit dem Satz bewertet: „Es ist kein
Grenzübertritt — nur wer das Sitzungsgeheimnis hat, legt Pools an." An dieser Tür stimmt der Satz
nicht mehr:

- Der Kopfkommentar von `routes/addin/schema.ts` sagt es selbst: „Jede Zeichenkette, die hier
  hereinkommt, hat mindestens eine fremde Quelle berührt: den Betreff, den Text oder einen
  Anhangnamen einer E-Mail, die jemand geschickt hat (Akteur A-06)."
- Der Titel ist mit dem Betreff **vorbelegt**: `apps/outlook-addin/src/ui/TaskPane.tsx:120` setzt
  `useState(() => suggestTitle(mail.subject))`, und `suggestTitle`
  (`apps/outlook-addin/src/office/mail.ts:41`) streicht nur `AW:`/`RE:`-Vorsätze. Eine Handlung des
  Benutzers — „Anlegen" — genügt, und der Betreff eines Fremden steht als Todo-Titel im Bestand.
- Der Titel wird danach überall angezeigt: Todo-Liste, Kanban-Karte, Dialogüberschriften und seit
  T-108 auch im Titel der Meldung nach einer Buchung von Hand („Zeit gebucht auf „X“.").
- `todo.title` und `todo.tags` sind zulässige **Feldquellen einer Exportvorlage**
  (`packages/export/src/sources.ts:34`, `:35`). Der Weg endet also nicht in der Oberfläche.

**Auswirkung.** Kein Codeausführungsweg — React maskiert, und die Exportdatei wird über
`JSON.stringify` geschrieben (`packages/export/src/plan.ts:131`), das Steuerzeichen als
Escape-Folge ausschreibt; die Datei bricht daran nicht auf. Was bleibt, ist genau das, wogegen H-2
geschrieben wurde, nur mit einem entfernten Urheber: **eine Anzeige, die etwas anderes zeigt, als
im Bestand steht.** Ein U+202E im Betreff dreht den Rest der Zeile optisch um — in der Todo-Liste,
auf der Karte, im Löschdialog und in jedem Satz, der den Titel nennt. Ein U+0000 oder U+0007 mitten
im Titel steht danach in einer Datei, die ein fremdes Abrechnungswerkzeug liest, und was das damit
tut, weiß niemand in diesem Projekt.

**Gegenmittel.** Eine Zeile, und sie ist schon geschrieben. `withoutControlCharacters` aus
`apps/local-api/src/http/input.ts:121` auf `title` und auf die Einträge von `tagNames` in
`routes/addin/schema.ts` anwenden — dieselbe Prüfung, dieselbe Meldung, dieselbe Abweisung mit 422
über `toFieldIssues`. Der Bezug über die Modulgrenze ist unbedenklich: `routes/addin/index.ts`
holt `readJson` bereits aus `../http/input.ts`.

> **Nachtrag T-125 (2026-09-04) — der Befund ist geschlossen, das Gegenmittel war an zwei Stellen
> falsch.** Nachgemessen an `c96a2b2`: `routes/addin/schema.ts:128` ist `title: titleSchema`,
> `:168` ist `tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX)`, und der Kommentar, der die
> Zeichengleichheit zusicherte, steht bei `:140-154` richtiggestellt da. Damit ist es nicht mehr
> ein zeichengleiches, sondern **dasselbe** Schema — die bessere Antwort als die vorgeschlagene.
>
> Zwei Angaben dieses Absatzes waren falsch, und T-114 hat sie beim Ausführen bemerkt; sie stehen
> hier, damit die nächste Prüfung sie nicht abschreibt:
>
> 1. `withoutControlCharacters` war **nicht exportiert**. „Eine Zeile, und sie ist schon
>    geschrieben" traf nicht zu; benutzbar waren nur die beiden Anwendungen `titleSchema` und
>    `nameSchema`.
> 2. `readJson` ist in `routes/addin/index.ts` **lokal definiert** und nicht importiert. Der
>    Import über die Modulgrenze, den es gibt, ist `statusFor` aus `../../http/problem.ts`. Die
>    Schlussfolgerung stimmte, die Fundstelle nicht.
>
> Der Preis der guten Lösung steht in T-114 Annahme 1: Der Titeldeckel sinkt von 512 auf 500.
> Was der Befund nicht mit erledigt hat, ist die **Anzeigeseite** — siehe E-063 und 17.1.

**Und der Kommentar daneben gehört mit richtiggestellt.** `routes/addin/schema.ts:74` sagt heute:
„Der Wortlaut des Schemas ist zeichengleich der aus `routes/todos.ts` (`nameSchema` =
`z.string().trim().min(1).max(200)`), damit die Hauptanwendung und das Add-in dieselbe Eingabe
annehmen und dieselbe abweisen." Seit T-101 ist dieser Satz falsch. Ein Kommentar, der eine
Gleichheit zusichert, die es nicht mehr gibt, ist der Grund, warum diese Lücke bei der nächsten
Änderung wieder übersehen würde — er sagt dem Leser ausdrücklich, er brauche nicht nachzusehen.

**Was der Befund nicht ist.** Kein Grenzübertritt: Wer `POST /addin/todos` ruft, hat das
Add-in-Token. Kein Weg für den Absender allein — er braucht den Benutzer, der anlegt. Und kein
Ersatz für die Frage, ob ein Titel überhaupt Steuerzeichen tragen darf; die ist mit H-2 bereits
beantwortet, nur an einer von zwei Türen.

### 16.5 Was die Wache aus H-2 auch mit geschlossener Add-in-Tür nicht leistet

Damit niemand mehr von ihr erwartet, als sie zusagt. Drei Grenzen, alle drei **kein Befund**:

1. **Der Altbestand.** Die Prüfung sitzt am Eingang. Ein Name, der vor T-101 mit einem
   Steuerzeichen angelegt wurde, steht weiterhin im Bestand und wird weiterhin angezeigt; die
   Migrationen fassen keinen Namen an (`packages/storage/migrations/**` ist im ganzen Diff
   unberührt), und eine Migration, die vorhandene Namen umschriebe, wäre die stille Änderung, die
   T-101 Annahme 6 ausdrücklich ablehnt. Ein solcher Bestand ist auf dieser Maschine nicht bekannt
   (`tests/fixtures/**` ist leer, die mitgelieferten Zeilen aus Migration 0002 sind sauber). Der
   Nebeneffekt ist ein Bedienfall und kein Sicherheitsfall: Ein `PATCH`, der einen solchen Namen
   **unverändert** zurückschickt, wird jetzt mit 422 abgewiesen; umbenennen lässt er sich trotzdem,
   löschen auch.
2. **Sichtbare Zeichensetzung.** Die Prüfung erfasst **unsichtbare** Zeichen. Ein Name, der selbst
   deutsche Anführungszeichen, Kommas oder das Wort „und" enthält, geht durch — und die Oberfläche
   setzt ihn in einen Satz, der aus genau diesen Zeichen aufgebaut ist („Betroffen sind Regel
   „Ost“, Regel „Nord“ und Regel „Abrechnung“."). Eine Regel, deren Name selbst ein
   Anführungszeichen und ein „und" enthält, liest sich damit als eine andere Aussage, als der
   Dienst gemacht hat. Nur der Inhaber des Sitzungsgeheimnisses legt Regeln an, und er täuscht damit
   allein sich selbst; die Schwere ist entsprechend gering. **Die Bauart, die es beantwortet, ist
   keine weitere Zeichenprüfung, sondern die Anzeige:** Wer die Namen als eigene Knoten setzt — eine
   Liste statt eines zusammengefügten Satzes —, hat das Problem nicht. Das ist zugleich die Fassung,
   für die `details[].name` überhaupt geschaffen wurde.
3. **Vermerk und Leistung sind nicht erfasst, und das ist richtig.** `textSchema`
   (`input.ts:129`) und die Notizfelder des Add-ins (`schema.ts:86`, `:96`) prüfen nur die Länge.
   Ein Freitextfeld, aus dem Steuerzeichen entfernt würden, wäre ein Freitextfeld, das den Text des
   Benutzers ändert. Der Unterschied zum Namen ist der Verwendungszweck: Ein Name wird in fremde
   Sätze eingesetzt, ein Vermerk wird als Absatz gezeigt.

### 16.6 `POST /time-entries` mit `poolMovement` — bewertet wie die Timer-Routen

`apps/local-api/src/usecases/timer.ts:670` rechnet die Bewegung in **derselben** Transaktion, in
der die Buchung entsteht: `presenceBeforeBooking` vor dem Schreiben, `unit.timeEntries.create`,
dann `movementOfBooking` über denselben `unit`. Das ist die Anordnung, die es sein muss — eine
Bewegung, die über einen Bestand urteilt, den es zum Zeitpunkt der Handlung nicht mehr gab, wäre
eine Falschauskunft. Die Antwort steht flach (`routes/time.ts`, `entryAfterBooking`), wie an
`PUT`/`DELETE /done`.

**Datenklasse: keine neue.** Es sind Namen von Regeln aus dem eigenen Bestand, an einer Route der
Hauptfläche hinter dem Sitzungsgeheimnis. Die Notiz-Trennung ist unberührt: `TimeEntry.note` ist die
**Leistung** und gehört per A-7.4 in die Abrechnung; `Todo` trägt überhaupt kein Notizfeld
(`packages/domain/src/todo.ts:88-100`), der interne Vermerk liegt in `todo_note` und an einer
eigenen Route. `pnpm run boundaries` ist grün, von mir gemessen.

**Fachlich ist die vorsichtigere der beiden möglichen Rechnungen gewählt worden**, und das ist auch
sicherheitlich die richtige Richtung: `closedEntryMovementStates` statt `bookingMovementStates`
(T-107 Frage 1, im Nachtrag zu E-061 richtiggestellt). Eine Buchung von Hand hebt „Erledigt" nicht
auf; die andere Fassung hätte dem Benutzer ein Verlassen der Erledigt-Spalten gemeldet, das nicht
stattfindet. Ein Satz, der weniger sagt, als geschehen ist, ist die harmlose Richtung; einer, der
mehr behauptet, ist die andere.

**H-1 in neuer Fassung — der Aufwand je Anfrage.** Jede Route, die eine Bewegung rechnet, ruft
`poolMovementNamer` (`usecases/pool-movement.ts:379`), und der löst **jede** Regel des Bestands
über `resolveAxes` auf. Zwei Dinge haben sich gegenüber R-3 H-1 verbessert, eines ist hinzugekommen:

- **Besser:** Die Ordnerterme einer Achse werden in **einer** rekursiven Abfrage aufgelöst
  (`repo-tags.ts:1018`, `f.id IN (…)`, `depth < 1000`) und nicht mehr je Term. Der Faktor aus
  R-3 H-1 gilt für diesen Pfad nicht.
- **Besser:** Der Normalfall kostet nichts. `movementOfBooking` gibt `null` zurück, **bevor** es
  liest, wenn das Todo schon eine offene Buchung hatte (`timer.ts:382`); `switchTodoDone` ebenso,
  wenn das Kennzeichen sich nicht bewegt hat (`usecases/todos.ts:325`); die Duplikatsuche des
  Add-ins baut den Namensgeber verzögert und höchstens einmal je Anfrage.
- **Neu:** Die Zahl der Aufrufstellen ist von drei auf **acht** gewachsen (Start, Stopp,
  `orphaned/resolve`, `PUT`/`DELETE /done`, `POST /time-entries`, zwei Add-in-Routen), und die
  Rechnung läuft bei `POST /time-entries` innerhalb einer **schreibenden** Transaktion auf einer
  einzelnen SQLite-Datei. Der verbleibende Multiplikator ist die Zahl der Regeln, und für die gibt
  es nirgends eine Obergrenze: ein `resolveAxes` je Regel, je Anfrage.

Das bleibt ein **Hinweis** und kein Befund: Wer viele Regeln anlegt, hat das Sitzungsgeheimnis, und
er verlangsamt allein sich selbst. Es gehört trotzdem festgehalten, weil die billige Antwort — eine
Obergrenze für die Zahl der Regeln oder eine engere für Ordnerterme je Liste (heute `max(200)`) —
mit jeder neuen Aufrufstelle mehr wert wird.

**`orphan_discarded`** (T-101, O-R) ist sicherheitlich folgenlos und ausdrücklich richtig gebaut:
Der Grund ist ein Aufzählungswert aus der Domäne (`packages/domain/src/time-entry.ts:607`), kein
Freitext, er wird in `usecases/timer.ts:547` durchgereicht statt neu gesetzt, und der
Verwerfen-Zweig liest **nichts** und löst keine Regel auf. Die Antwort trägt in diesem Fall
`poolMovement: null` per Typ (`timer.ts:315`).

**`MAX_TOASTS`/`evict()`** (`apps/web/src/app/ToastContext.tsx`) ist kein Sicherheitsthema: eine
Anzeigegrenze im Speicher eines Browserfensters, deren einzige Ausnahme — der Stapel wächst über
vier hinaus, wenn ausschließlich Meldungen mit Rückweg darinstehen — je Eintrag eine ausdrückliche
Handlung des Benutzers voraussetzt und mit dem Schließen des Fensters endet.

### 16.7 Repository-Hygiene

Geprüft über den **ganzen** versionierten Baum, nicht nur über den Diff.

- **Zugangsdaten.** Muster aus Schlüsselwort, Zuweisung und mindestens 16 Zeichen Ausweis über die
  97 geänderten Quelldateien: **ein** Treffer, der bekannte Kunstwert
  `apps/outlook-addin/scripts/proof-addin.mjs:1068`. Semgrep `p/secrets`: null Treffer. Das
  Sitzungsgeheimnis der End-zu-End-Hilfe heißt unverändert
  `takt-e2e-erfundenes-sitzungsgeheimnis-2026-08` und sagt im Namen, was es ist.
- **Call-Nummern.** Alle Muster im Baum sind erfunden und als Zählwert oder Scherz erkennbar:
  `TCK-000042` (60-mal), `TCK-000517`/`TCK-000518`, `TCK-000815`, `TCK-000816`, `TCK-000777`,
  `TCK-999999`. Kein Muster, das nach einem echten Ticketbestand aussieht.
- **Kundendaten.** Die neuen End-zu-End-Fälle arbeiten durchweg mit `E2E-…-${run}`-Namen; 16 Dateien
  unter `tests/e2e` tragen das Präfix. Neue Fixtures sind nicht hinzugekommen; `tests/fixtures/**`
  ist unverändert **leer** (sieben Ordner, keine Datei). Das bleibt die Abweichung von CLAUDE.md aus
  R-3a — dort liegen keine falschen Daten, sondern gar keine — und keine Sicherheitsfrage.
- **E-Mail-Adressen.** In den 97 geänderten Dateien: keine, außer Paketnamen mit `@`.
- **Abhängigkeiten.** `pnpm-lock.yaml` ist im gesamten Diff **unverändert**. Kein neues Paket, keine
  neue Fassung, keine neue Lieferkettenfläche.
- **Unsichtbare Zeichen im Quelltext (Trojan Source).** Eigene Suche über **jede** versionierte
  Datei nach U+202A bis U+202E, U+2066 bis U+2069, U+200B bis U+200F, U+061C und U+FEFF: **fünf**
  Treffer, alle in `apps/local-api/test/http/input.test.ts` und alle der Zweck dieser Datei — sie
  prüft die Wache aus 16.4. Sonst ist der Baum frei davon. Siehe aber den Hinweis T-112-H2: Dass
  diese Zeichen dort **roh** stehen und nicht als Escape-Folge, hat Folgen.

### 16.8 Befunde und Hinweise dieser Prüfung

| Kennung | Schwere | Ort | Zuständig |
|---|---|---|---|
| **T-112-1** | sollte | `routes/addin/schema.ts:66`, `:85` — die Wache aus H-2 fehlt an der Add-in-Tür, und der Kommentar `:74` sichert das Gegenteil zu; siehe 16.4 | integration-dev |
| **T-112-H1** | Hinweis | `usecases/pool-movement.ts:379` — acht Aufrufstellen, ein `resolveAxes` je Regel, keine Obergrenze für die Zahl der Regeln; siehe 16.6 | Auftraggeber, Orchestrator |
| **T-112-H2** | Hinweis | `apps/local-api/test/http/input.test.ts` — die Steuer- und Bidi-Zeichen stehen roh im Quelltext statt als Escape-Folge. Ein NUL macht die Datei für Git zu einer **Binärdatei**: `git diff` zeigt „Bin 0 -> 7238 bytes" statt Zeilen, und Semgrep parst sie nur teilweise (Syntaxfehler bei `:60`). Ausgerechnet der Nachweis einer Sicherheitswache ist damit im Review unsichtbar. Escapes prüfen dasselbe und lassen die Datei Text bleiben. | unit-tester |
| **T-112-H3** | Hinweis, halb erledigt | `apps/web/src/lib/errorText.ts` — T-110 ist während der Prüfung eingetroffen und **hält**: kein neuer Ausgabeweg, der Satz des Dienstes samt Kürzungshinweis bleibt stehen, der Rückfall auf `message` ist ausgesprochen (16.3). Offen bleibt allein, daß die Namen in **einem** zusammengefügten Satz stehen statt als eigene Knoten (16.5 Punkt 2) — geringe Schwere, kein Rückschritt gegenüber vorher. | frontend-dev |
| S-1 (aus R-3a) | sollte, vor dem Push | Zweig `backup/status-als-regelterm-vor-filter`, `size-pack` 181,07 MiB — unverändert offen | Orchestrator |

### 16.9 Urteil dieser Prüfung

**Nacharbeit an einem Punkt, sonst freigegeben.** Die Wellen E bis G verkleinern die Angriffsfläche,
statt sie zu vergrößern: eine Form statt zweier an der Add-in-Grenze, zwei Felder weniger in den
Antworten, eine Bildungsstelle für Regelnamen statt dreier, drei Obergrenzen, wo vorher keine
standen, und zwei Wiederherstellungen im `finally` statt einer. Die Vertrauensgrenze selbst ist im
ganzen Diff nicht angefasst worden — keine neue Route, kein geänderter Zugriffsschutz, keine neue
Abhängigkeit. Semgrep meldet über 97 geänderte Quelldateien null Befunde.

Der eine Punkt, der Nacharbeit verlangt, ist **T-112-1**: H-2 ist an der Haupttür umgesetzt und an
der Add-in-Tür nicht, und die Add-in-Tür ist diejenige, hinter der ein Fremder steht. Der Aufwand
ist eine Zeile plus die Richtigstellung eines Kommentars, der heute das Gegenteil zusichert. Ohne
sie steht in `apps/local-api` eine Prüfung, die man für vorhanden hält, weil sie an einer Stelle
vorhanden ist.

Das Tor aus Abschnitt 8 bleibt an zwei Stellen uneinlösbar: kein 42Crunch-Auditwert für eine weiter
gewachsene Beschreibung, und Semgrep Guardian zum sechsten Mal nicht erreichbar. Beides ist eine
Beschaffungsentscheidung und kein Befund dieses Branches.

---

## 17. Prüfung T-125 (2026-09-04) — Wellen J bis L: eine Wahrheit an einem Ort, und was daneben noch stand

Prüfumfang: `git diff 71c6695..c96a2b2` — Wellen I (T-113 bis T-116), J (T-117, T-118) und K
(T-119 bis T-122). 68 geänderte Dateien, davon 54 übersetzbare Quelldateien. **Bewerteter Stand:
`c96a2b2`**, Arbeitsbaum zum Zeitpunkt der Messung sauber bis auf `board.md`. Während der Prüfung
haben integration-dev und frontend-dev abgelegt; was dadurch zugefallen ist, steht gemessen in
17.9 und ist nicht Teil der Bewertung von `c96a2b2`.

Anlass ist die Kette, die Befund T-112-1 ausgelöst hat: T-114 schloss die Add-in-Tür, T-117
erweiterte die Zeichenklasse an der Haupttür um `U+061C`, `U+200E`, `U+200F`, `suggestTitle` zog
nicht nach — **und der Nachweis, der genau das verhindern sollte, blieb grün, weil er gegen eine
abgeschriebene Liste prüfte** (T-119, E-063 Punkt 4).

### 17.0 Was tatsächlich gelaufen ist

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 54 geänderten Quelldateien | **ja** | 156 Regeln, 54 Ziele, **0 Befunde**, ~99,9 % geparst. Aus `p/secrets` null Treffer. Keine Teilparser-Meldung mehr — der Hinweis T-112-H2 ist an `input.test.ts` erledigt. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **siebten** Mal, seit T-003 unverändert. Kein Plattformbefund, weder positiv noch negativ. Kein Ersatz vorgetäuscht. |
| 42Crunch-Audit, 42Crunch-Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Die Beschreibung liegt vor (5417 Zeilen); das Hindernis ist ausschließlich das Werkzeug. |
| Eigene Messungen: Codepunktsuche über **jede** der 604 versionierten Dateien; Auszählung der Prosafassungen der Zeichenklasse über den YAML-Leser des Projekts; Verhalten von `server.close()` unter einer offenen lokalen Verbindung auf diesem Node; Diff je Pfad; Muster für Zugangsdaten, Call-Nummern, E-Mail-Adressen; Lesen der Wächter und ihrer Reichweite | **ja** | 17.1 bis 17.6 |
| `pnpm proof:access`, `proof:openapi`, `proof:addin`, `pnpm test`, `pnpm test:e2e` | **nein** | Die portgebundenen Pfade belegen 17843/17844, und integration-dev sowie frontend-dev arbeiteten parallel in `apps/outlook-addin/**` und `apps/web/**`; `proof:access` Abschnitt 13 misst Zeitverhalten und wird unter fremder Last falsch rot (T-122 hat das gemessen). Die Zahlen der anderen Berichte sind hier **nicht** als eigene ausgegeben. Statt eines Laufs: der Quelltext der Wächter gelesen und ihre Reichweite ausgemessen. |

Die Definition of Done ist an einem Punkt erfüllt („Semgrep ohne Befunde hoher Schwere") und an
einem unverändert **nicht erfüllbar** („42Crunch über der Schwelle"). Das steht seit T-023 und ist
eine Beschaffungsentscheidung, kein Befund dieses Branches.

### 17.1 Trägt die geteilte Fassung die Antwort?

**Für den ausführbaren Teil: ja.** `packages/domain/src/characters.ts` führt die Klasse als
Codepunktbereiche, und vier Stellen lesen sie, statt sie zu kopieren — nachgesehen, nicht
angenommen:

```
apps/local-api/src/http/input.ts:15-17,140      hasForbiddenNameCharacter, FORBIDDEN_NAME_CHARACTER_MESSAGE
apps/local-api/src/access/session-secret.ts     isPlausibleUserName über dieselbe Funktion (T-122)
apps/local-api/src/routes/addin/schema.ts:128   title: titleSchema
apps/local-api/src/routes/addin/schema.ts:168   tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX)
```

Dazu zwei **abgeleitete** Wächter, die eine Abweichung rot machen, ohne dass jemand daran denken
muss: `proof:openapi` Abschnitt 16 hält `titleSchema` über `0x0000`–`0x20FF` gegen
`isForbiddenNameCharacter`; `proof:addin` Abschnitt 17 sammelt aus der Add-in-Tür über die ganze
BMP, was sie abweist, und hält `dropHidden` und `visibleText` dagegen. Beide **fragen** und
schreiben nicht ab. Das ist die richtige Bauart, und die Begründung in `characters.ts` — Zahlen
statt eines `RegExp`, weil ein Ausdruck mit `g` sich `lastIndex` merkt und weil Bereiche sich
**lesen** lassen — ist die tragende.

**Für den nicht ausführbaren Teil: an `c96a2b2` nein.** Die Wahrheit stand weiter an mehreren
Orten, und die Wächter deckten nicht alle. Vollständige Bilanz des bewerteten Standes:

| Träger | Art | Wächter |
|---|---|---|
| `packages/domain/src/characters.ts` | **maßgeblich** | — |
| `http/input.ts`, `access/session-secret.ts`, `routes/addin/schema.ts` | liest | `proof:openapi` 16, `proof:access` 0b/0c, `proof:addin` 16/17 |
| `apps/outlook-addin/src/text/hidden.ts:83` | **zweite Fassung** (`HIDDEN_SOURCE`, ein Ausdruck) | `proof:addin` 17 — misst, greift |
| `apps/outlook-addin/scripts/proof-addin.mjs:3359-3380` | 20 abgeschriebene Codepunkte | nur **Teilmengenprüfung**: kann unvollständig werden, nicht falsch |
| `apps/outlook-addin/scripts/proof-addin.mjs`, `istLeerraum` | Abschrift von `CONTROL_WHITESPACE` | keiner — fällt aber laut aus |
| OpenAPI `components.responses.UnprocessableEntity.description` | Prosa | `proof:openapi` 16 |
| OpenAPI `/addin/todos` → `title.description` | **Prosa** | **keiner** |
| OpenAPI `/addin/todos` → `tagNames.description` | **Prosa** | **keiner** |
| `routes/addin/schema.ts:88-91` (Kommentar, historisch) | Prosa, unvollständig | keiner |
| `apps/local-api/test/http/input.test.ts`, `apps/outlook-addin/test/text/hidden.test.ts` | Randfälle | prüfen Ränder, nicht die Klasse — und sollen es auch nicht |
| `docs/bedrohungsmodell.md` 15 und 16.4 (zweimal) | Prosa, unvollständig | keiner — mit dieser Prüfung als Nachtrag richtiggestellt |

Die Prosafassungen in der OpenAPI habe ich über den YAML-Leser des Projekts ausgezählt und gegen
die elf Grenzen aus `FORBIDDEN_NAME_CHARACTERS` gehalten:

```
Grenzen der Klasse: U+0000, U+001F, U+007F, U+009F, U+061C, U+200E, U+200F, U+202A, U+202E, U+2066, U+2069
Prosafassungen an c96a2b2: 3 — alle drei zu diesem Zeitpunkt vollständig
vom Wächter gelesen:       components.responses.UnprocessableEntity.description   (1 von 3)
```

**Warum das kein Formalismus war.** Die beiden ungewachten waren genau die beiden, die schon einmal
auseinandergelaufen sind: T-119 musste dort die drei Marken aus T-117 von Hand nachtragen („hier
mit T-119 nachgetragen" stand wörtlich in beiden). Der Wächter deckte die eine Fassung, die nie
abgewichen ist, und keine der beiden, die es getan hatten.

**Und eine Zusicherung war unwahr.** `UnprocessableEntity.description` sagte an `c96a2b2`: „der
Dienst liest sie dort … und das Add-in liest dieselbe Fassung, statt sie abzuschreiben."
`apps/outlook-addin/src/text/hidden.ts` hatte zu diesem Zeitpunkt **keine einzige `import`-Zeile**
— es schrieb ab. Der Grund, der dort für die Doppelung stand — der Aufgabenbereich dürfe
`@takt/local-api` nicht führen —, galt seit T-122 nicht mehr: Die Klasse liegt nicht mehr dort, und
`@takt/domain` steht in der Abhängigkeitsliste des Add-ins.

**Fünf Wellen — warum es so lange gedauert hat.** Die Regression hat nicht überdauert, weil niemand
hingesehen hätte. Sie hat überdauert, weil an jeder Stelle **etwas** hingesehen hat: Abschnitt 16
des Nachweispfads war grün, der Kommentar sagte „dasselbe Schema", die Beschreibung nannte die
Klasse. Drei Zeugen, und alle drei sagten dasselbe aus derselben Quelle — einer Abschrift. Erst
T-119 hat einen Zeugen gebaut, der die Tür selbst fragt. **Die Bedingung dafür, dass sich das nicht
wiederholt, ist nicht Wachsamkeit, sondern dass jeder Träger entweder liest oder gemessen wird.**
Eine Beschreibung kann nicht importieren; deshalb muss sie gemessen werden, und an `c96a2b2` wurde
eine von drei gemessen.

### 17.2 Der verwaiste Sidecar und die Vertrauensgrenze

**Was offen war.** `readStartupHandshake` las `stdin` im fließenden Zustand und meldete danach nur
seine Zuhörer ab; das Dateiende ging im Startfenster an einen Strom ohne Zuhörer, und
`watchParentLink` meldete sich anschließend mit `once('end')` an einem beendeten Strom an. Mit dem
echten Dienst nachgestellt: 15 Sekunden und weiter laufend (T-122 Abschnitt 3).

**Was das für die Vertrauensgrenze bedeutet.** Die Reihenfolge in `main.ts` ist der Kern der Sache:
`server.listen` steht bei `:217`, `watchParentLink` bei `:283`. **Der Dienst hört auf
`127.0.0.1:17843`, bevor der Wächter über die Elternverbindung angemeldet ist.** Dazwischen liegen
Migration, Bestandssicherung und das Zertifikat des Aufgabenbereichs — Sekunden. Ein Dienst, der
den Elternprozess überlebt, ist deshalb nicht bloß ein hängender Prozess:

- Er ist **für jeden Prozess auf dem Rechner erreichbar** (VG-1) und hält den Datenbestand offen,
  ohne dass ein Fenster ihn zeigt. Die einzige Anzeige, an der ein Benutzer bemerken könnte, dass
  Takt noch läuft, ist weg.
- Er hält **den Port**, und das ist die zweite Hälfte: Takt weicht bewusst nicht auf einen anderen
  Port aus (`sidecar.rs:312`, B-1.5), weil sich sonst ein fremdes Programm als Takt ausgeben
  könnte. Ein verwaister Sidecar macht damit jeden weiteren Start unmöglich, und der Benutzer sieht
  „Der Port 17843 ist belegt", ohne dass ein Fenster offen wäre, das er schließen könnte.
- Er hat das **Sitzungsgeheimnis** der beendeten Sitzung noch im Speicher, und der Add-in-Weg
  (17844, Zertifikat) steht ebenfalls weiter.

Das ist der Grund, warum B-1.6 Punkt 3 keine Aufräumfrage ist, sondern die Bedingung dafür, dass
„lokal" überhaupt eine Grenze beschreibt: **Die Lebensdauer des Dienstes ist die Lebensdauer der
Sitzung**, und alles andere in diesem Modell hängt daran.

**Die Behebung ist die richtige, und sie sitzt an der Ursache.** `input.pause()` im Handschlag lässt
das Dateiende ungelesen liegen, bis `watchParentLink` es mit seinem `resume()` abholt; und wer sich
an einem bereits beendeten Strom anmeldet (`readableEnded || destroyed`), bekommt die Meldung
sofort. Das eine verhindert den Verlust, das andere fängt ihn ab — zwei unabhängige Zeilen für
einen Fall, und das ist hier angemessen, weil die eine über Zeitverhalten urteilt.

**Ist `proof:access` Abschnitt 0d der richtige Wächter? Fast.** Er ist deutlich besser als sein
Vorgänger: Er schließt die Röhre **unmittelbar nach dem Handschlag**, ohne auf `/health` zu warten,
hängt damit nicht am Zeitverhalten des Rechners und hat eine gefahrene Gegenprobe („ohne Behebung
rot"). Mit 0c (Röhre zu, sobald `/health` antwortet) und 15 (Röhre zu im Ruhezustand) sind drei
Punkte des Lebenslaufs abgedeckt. Zwei Dinge sieht er nicht:

1. **Er misst einen Zeitpunkt, nicht das Fenster.** Der Fehler lag zwischen `finish()` und
   `watchParentLink`; 0d trifft dieses Fenster sicher, aber nur an seinem Anfang. Das ist
   verzeihlich — der Anfang ist die schärfste Stelle — und der Grund, warum die Behebung an der
   **Ursache** mehr wert ist als der Nachweis.
2. **Er misst mit einer stillen Leitung.** Kein Abschnitt schließt die Röhre, während eine
   Verbindung auf 17843 offen ist. Genau dann hält `shutdown()` nicht Wort — siehe 17.3.

### 17.3 `shutdown()` hat keine Frist — Befund T-125-4

`apps/local-api/src/main.ts:275-281` ruft `taskpane?.close()`, `database?.close()` und dann
`server.close(() => process.exit(0))`. Der **einzige** Weg zu `process.exit(0)` führt durch diesen
Rückruf, und `server.close()` hört zwar sofort auf zu lauschen, wartet aber auf die offenen
Verbindungen. Gemessen auf dem Node dieses Rechners (v22.23.2, eigener Server auf einem flüchtigen
Port, damit 17843 unbelegt bleibt):

```
keepAliveTimeout 5000   headersTimeout 60000   requestTimeout 300000
ein lokaler Prozess verbindet sich und schickt einen unvollständigen Kopf
→ close() hat nach 8000 ms nicht zurückgerufen; der Prozess läuft weiter
→ die Schranke ist headersTimeout (60 s), bei stockendem Rumpf requestTimeout (300 s)
```

**Was das entschärft, ebenfalls gemessen:** Der Lauscher ist sofort weg — ein zweiter Server bindet
denselben Port unmittelbar nach `close()` wieder. `database.close()` und `taskpane.close()` sind
vorher gelaufen. Der überlebende Prozess hält also **weder den Port noch einen offenen
Datenbestand**; die schweren Folgen aus 17.2 treten nicht ein.

**Was bleibt.** Die Zusage aus B-1.6 Punkt 3 lautet „der Sidecar überlebt die Hülle nicht". Sie gilt
heute mit einer Fußnote: *es sei denn, ein lokaler Prozess entscheidet anders* — und ein lokaler
Prozess ist genau der Akteur, gegen den dieses Modell geschrieben ist. Er kann das Ende um bis zu
fünf Minuten verzögern, ohne ein Geheimnis zu kennen; eine TCP-Verbindung und ein halber Kopf
genügen. Der Gewinn für ihn ist gering, der Aufwand für uns auch: `server.closeAllConnections()`
vor `server.close(…)`, und ein `setTimeout(() => process.exit(0), …).unref()` als Boden, damit das
Anhalten eine Frist hat statt einer Hoffnung. **Schwere: Hinweis. Zuständig: domain-dev.** Ein
Abschnitt 0e, der die Röhre mit **einer offenen Verbindung** schließt, wäre der Nachweis dazu.

**Der zweite Befund aus T-122 — Code 1 beim ordentlichen Anhalten — ist richtig behoben und
sicherheitlich mehr als Kosmetik.** `end` und `close` feuerten beide auf derselben Röhre, `onLost`
lief zweimal, das zweite `database.close()` warf `ERR_INVALID_STATE`, und ein Wurf aus einem
Ereignisbehandler endet mit Code 1. Die Hülle liest diesen Code, um den Grund zu **unterscheiden**
(74 Port, 78 Konfiguration, sonst „unerwartet beendet", `sidecar.rs:304-333`). Eine 1 für ein
ordentliches Anhalten ist damit keine falsche Zahl, sondern eine **falsche Diagnose an den
Benutzer** — und sie trat nicht bei jedem Lauf auf, also genau die Sorte Meldung, der man beim
nächsten Mal nicht glaubt. Zwei Sperren (`reported` in `watchParentLink`, `stopping` an
`shutdown`), beide an der richtigen Stelle: Sie machen das Anhalten idempotent, statt den Wurf zu
fangen.

### 17.4 `WindowsUser` — die Entscheidung „abweisen" bewertet

**Woher der Wert kommt, ist die Vorfrage, und sie ist gut beantwortet.**
`apps/desktop/src-tauri/src/identity.rs` holt ihn unter Windows aus `GetUserNameW` und
`GetUserNameExW(NameSamCompatible)` — **nicht** aus `USERNAME`, **nicht** aus `USERPROFILE`,
**nicht** über einen Unterprozess `whoami`, und ohne Rückfall auf eine dieser Quellen, wenn der
Systemaufruf scheitert („Ein Wert, der von jedem setzbar ist, wäre schlechter als gar keiner: Er
sähe richtig aus."). Unter Unix `getpwuid(geteuid())` und `trusted: false`. Damit ist die Frage aus
CLAUDE.md — Betriebssystem oder Benutzereingabe — für die Abrechnung eindeutig beantwortet: **kein
vom Benutzer setzbares Feld.** Das ist die eigentliche Antwort auf B-8.1.

**Die Entscheidung des Orchestrators — abweisen, nicht bereinigen und nicht markieren — ist
richtig, und die tragende Begründung ist nicht die naheliegende.**

- **Bereinigen** hieße, unter einem Namen abzurechnen, den es nicht gibt. **Markieren** hieße,
  `U+FFFD` in die Abrechnungsdatei zu schreiben. Beides ergibt still eine Rechnung mit falschem
  Urheber; beides ist schlechter als ein lauter Nichtstart.
- **Der eigentliche Grund:** Auf Windows kann dieser Fall aus der genannten Quelle **nicht**
  entstehen — ein SAM-Konto verbietet Steuerzeichen. Greift `user_invalid` je, hat nicht der
  Benutzer einen ungewöhnlichen Namen, sondern **etwas hat in die Röhre geschrieben, was dort nicht
  hingehört.** `user_invalid` ist damit kein Namensprüfer, sondern ein **Manipulationssignal**, und
  ein Manipulationssignal beantwortet man nicht mit Weiterlaufen.
- **Was die Prüfung ausdrücklich nicht leistet**, damit niemand mehr von ihr erwartet: Wer in die
  Röhre schreiben kann, schreibt `kollege.mueller` und keine Richtungsmarke. Gegen die
  Namensvertauschung aus B-8.1 hilft sie nicht — dagegen hilft, dass die Hülle `GetUserNameW`
  liest. Sie deckt die **Anzeige- und Kodierungsfolgen** eines Namens mit Richtungszeichen ab, und
  das ist eine kleinere, aber echte Klasse: Der Wert geht unverändert in die Exportdatei (A-8.5)
  und steht in `GET /settings`.
- **Wer die Röhre beschreiben kann**, ist allein die Hülle. Der Nichtstart eröffnet damit keinen
  neuen Verweigerungsweg: Wer ihn auslösen kann, kann Takt ohnehin nicht starten lassen.
- **Der Wert steht in keiner Meldung** (`main.ts`, dritte Meldung für `user_invalid`) — richtig,
  denn er trägt genau die Zeichen, um die es geht (B-2.4, B-4.3 Punkt 5).

**Die Folge, die der Auftrag nennt — der Benutzer kann seinen Windows-Namen nicht ändern —, ist
real, aber die betroffene Menge ist auf Windows praktisch leer.** Auf einer
Unix-Entwicklungsmaschine ist sie es nicht; dort wäre ein Konto mit einem C1-Zeichen konstruierbar,
und Takt startete nicht. Das ist ein Entwicklungsfall und kein Auslieferungsfall.

**Wo die Entscheidung an `c96a2b2` noch nicht ankam — Befund T-125-5.** Der ganze Grund für zwei
getrennte Gründe war, dass der Benutzer an verschiedenen Stellen sucht (T-122). Die Hülle machte
diesen Unterschied nicht: `explain_exit` (`apps/desktop/src-tauri/src/sidecar.rs:318-327`) hat
**einen** Text für Code 78, und er lautet „Der Dienst hat Startgeheimnis oder
Windows-Benutzernamen **nicht erhalten**". Für `user_invalid` ist das die falsche Auskunft — der
Name ist angekommen und wurde **zurückgewiesen**. Der Benutzer wird an die Stelle geschickt, an der
nichts fehlt, und ein Manipulationssignal verschwindet in einem Satz über etwas Fehlendes. Siehe
17.9: T-124 hat das inzwischen von der anderen Seite beantwortet.

### 17.5 Die Anzeige nach E-063 und die Flächen, die sie nicht deckt

**Die Berichtigung aus T-119 ist die richtige und gehört ins Modell.** `unicode-bidi: isolate`
allein reicht **nicht**: Es trennt den Block von seiner Umgebung, aber innerhalb des isolierten
Blocks wirkt ein `U+202E` weiter (UBA X2–X5), und `bidi-override` öffnet nach denselben Regeln eine
neue Ebene. **Keine CSS-Eigenschaft nimmt einem Text ein Zeichen weg.** Es gehören zwei Hälften
zusammen, und beide stehen im Add-in: `<bdi>` schützt die **Umgebung** (`Foreign` in
`Primitives.tsx`, `bdi { unicode-bidi: isolate }` in `addin.css`), `visibleText` nimmt dem
**Inhalt** die Zeichen und setzt `U+FFFD` an ihre Stelle. Der Vorschlag aus T-114 („eine CSS-Zeile
oder `<bdi>`") war die halbe Antwort und ist hiermit im Modell berichtigt.

**Markieren statt streichen** ist die richtige Wahl: Ein ersatzlos entferntes Zeichen ergibt eine
Anzeige, die harmlos aussieht und es nicht ist. Die Länge bleibt erhalten, weil jedes Zeichen genau
eines wird. **Rechtsläufige Schrift bleibt unangetastet**, und das ist keine Nachlässigkeit,
sondern die Grenze der Klasse: Arabisch und Hebräisch sind Text und kein Angriff.

**Was die Anzeigeseite nicht deckt** — beides bewusst und beides ohne Befund:

1. **`apps/web` hat kein `<bdi>` und kein `visibleText`** (über den ganzen Baum gemessen: null
   Treffer). E-063 Punkt 1 ist an den Aufgabenbereich adressiert, und dort ist fremder Text der
   Regelfall. In der Hauptanwendung sind Namen und Titel durch die Tür gegangen; die eine fremde
   Fläche ist der **interne Vermerk**, der über das Add-in mit E-Mail-Text vorbelegt wird
   (`prepareNote`) und die Zeichenprüfung bewusst nicht trägt (T-114 Punkt 4). Er steht in
   `TodoDetailScreen.tsx` ausschließlich in einer `textarea` — also in einem Eingabefeld, und das
   ist genau die Stelle, die E-063 Punkt 1 unangetastet lässt. Sollte der Vermerk je als Absatz
   **angezeigt** werden, ist das die Stelle, an der `visibleText` gebraucht wird.
2. **Der Altbestand.** Die Prüfung sitzt am Eingang, nicht am Bestand (`characters.ts` schreibt es
   ausdrücklich hin). Titel, die vor T-114 über die Add-in-Tür angelegt wurden, können die Klasse
   tragen und werden in `apps/web` roh angezeigt. Auf dieser Maschine ist ein solcher Bestand nicht
   bekannt; die Anwendung ist nicht ausgeliefert.

### 17.6 Repository-Hygiene

Geprüft über den **ganzen** versionierten Baum (604 Dateien), nicht nur über den Diff.

- **Zugangsdaten.** Muster aus Schlüsselwort, Zuweisung und mindestens 16 Zeichen Ausweis über den
  Diff `71c6695..c96a2b2`: **null** Treffer. Semgrep `p/secrets` über die 54 geänderten
  Quelldateien: null.
- **Call-Nummern.** Im Diff nur `TCK-000042` und `TCK-0000…` — erfunden und als Zählwert erkennbar.
- **E-Mail-Adressen.** Eine: `a.beispiel@beispiel.invalid`. `.invalid` ist die von RFC 2606 für
  genau diesen Zweck reservierte Endung. Richtig gewählt.
- **Lieferkette.** `pnpm-lock.yaml` im gesamten Diff **unverändert**. `package.json` ändert eine
  Zeile: `typecheck:test` nimmt `apps/outlook-addin/tsconfig.test.json` mit auf. Kein neues Paket,
  keine neue Fassung, keine neue Lieferkettenfläche.
- **Unsichtbare Zeichen im Quelltext (Trojan Source).** Eigene Codepunktsuche über jede versionierte
  Datei nach C0 ohne Tab/LF/CR, C1, `U+061C`, `U+200B`–`U+200F`, `U+202A`–`U+202E`,
  `U+2066`–`U+2069`, `U+FEFF`. Ergebnis: die Symboldateien unter `apps/desktop/**/icons/`
  (Bilddateien, erwartet) — und drei Textstellen:

| Stelle | Was | Bewertung |
|---|---|---|
| `packages/storage/src/sqlite/paging.ts:40` | `const SEPARATOR = …;` mit einem **rohen `U+0000`** | **Befund T-125-6.** Git sieht die Datei als **Binärdatei** — sie taucht in `git grep -I` nicht auf, und ein `git diff` über sie zeigt keine Zeilen. Sie steht so seit dem allerersten Commit (`d9555d0`) und ist seither nie geändert worden; **kein Code-Review hat sie je lesen können.** Das ist die Klasse aus T-112-H2, diesmal in Produktivcode statt in einem Test. Fachlich harmlos: Der Trenner fügt Zeitstempel und Kennung zu einer Blättermarke, und keiner der beiden kann ein NUL tragen. Gegenmittel: die Escape-Folge `\u0000` schreiben und im Kommentar daneben das Zeichen beim Namen nennen. **Zuständig: domain-dev.** |
| `.claude/team/reports/T-111-unit-tester.md:115` | rohes `U+0000` | **Hinweis T-125-H7.** Bericht, kein Code. |
| `.claude/team/reports/T-121-unit-tester.md:64, 221, 288` | rohe `U+200D`, `U+202E`, `U+061C` | **Hinweis T-125-H7.** Bericht, kein Code — der Bericht sagt an `:288` selbst, ein Codepunktscan finde „keine rohen Exemplare"; das stimmt für die Testdatei und nicht für den Bericht. **Zuständig: unit-tester.** |

**T-112-H2 ist erledigt.** `apps/local-api/test/http/input.test.ts` trägt kein rohes Zeichen mehr,
Semgrep parst die Datei vollständig, und beides ist nachgemessen.

**Eigenprobe, weil sie das Gewicht von T-125-6 besser belegt als jedes Argument.** Beim Schreiben
dieses Abschnitts ist das rohe `U+0000` aus `paging.ts:40` **zweimal** in meine eigene Arbeit
geraten: einmal beim Kopieren der Fundstelle in einen Shell-Befehl — der Befehl wurde abgewiesen,
weil das Zeichen in der Bestätigung unsichtbar gewesen wäre — und einmal in den Fließtext dieser
Datei, wo es erst die Gegenmessung gefunden hat. Beide Male stammte es aus einer `sed`-Ausgabe, in
der es wie ein Leerzeichen aussah. Genau das ist der Schaden: Ein rohes Steuerzeichen im Quelltext
verbreitet sich beim Zitieren weiter, und niemand sieht dabei etwas. Der Text steht jetzt als
Escape-Folge da, und `docs/bedrohungsmodell.md` ist über eine Codepunktsuche als frei nachgewiesen.

### 17.7 Befunde und Hinweise dieser Prüfung (Stand `c96a2b2`)

| Kennung | Schwere | Ort | Zuständig |
|---|---|---|---|
| **T-125-1** | sollte | `takt-local-api.yaml`, `UnprocessableEntity.description` sagt, das Add-in lese die gemeinsame Fassung; `apps/outlook-addin/src/text/hidden.ts` hatte an `c96a2b2` keine `import`-Zeile und schrieb ab. Entweder der Vertrag aus T-122 Abschnitt 1 landet, oder der Satz wird berichtigt — eine zugesicherte Gleichheit, die es nicht gibt, ist der Grund, aus dem T-117 fünf Wellen überstanden hat. **Siehe 17.9: geschlossen.** | integration-dev |
| **T-125-2** | sollte | `apps/local-api/scripts/proof-openapi.mjs` Abschnitt 16 las **eine von drei** Prosafassungen der Zeichenklasse. Ungewacht: `/addin/todos` → `title.description` und `tagNames.description` — genau die beiden, die T-119 von Hand nachtragen musste. Gegenmittel: den Wächter über **jede** Beschreibung laufen lassen, die die Klasse nennt, oder die beiden Add-in-Beschreibungen auf den einen Ort verweisen lassen, statt die Liste zu wiederholen. **Siehe 17.9: geschlossen, auf dem zweiten Weg.** | domain-dev (Wächter), integration-dev (Text, E-053) |
| **T-125-3** | Hinweis | `proof-addin.mjs` Abschnitt 16: Seit T-114 sind beide Türen **dasselbe Schemaobjekt**; „beide Türen weisen dieselben 20 Zeichen ab" war damit tautologisch, und die abgeschriebene Liste konnte nur unvollständig werden, nie falsch. Ein Abschnitt, der wie ein Wächter aussieht und keiner ist, ist schlechter als keiner. **Siehe 17.9: geschlossen.** | integration-dev |
| **T-125-4** | Hinweis | `apps/local-api/src/main.ts:275-281` — `shutdown()` hat keine Frist (17.3). Port und Datenbank sind zum Zeitpunkt des Wartens frei, die schweren Folgen aus 17.2 treten nicht ein, aber B-1.6 Punkt 3 gilt mit der Fußnote „es sei denn, ein lokaler Prozess entscheidet anders". Gegenmittel: `closeAllConnections()` und ein `setTimeout(…).unref()` als Boden; dazu ein `proof:access` 0e mit einer offenen Verbindung. **Offen.** | domain-dev |
| **T-125-5** | Hinweis | `apps/desktop/src-tauri/src/sidecar.rs:318-327` — ein Text für Code 78, „nicht erhalten". Für `user_invalid` die falsche Auskunft; verdeckt ein Manipulationssignal (17.4). **Siehe 17.9: von der anderen Seite beantwortet, Rest klein.** | frontend-dev |
| **T-125-6** | Hinweis | `packages/storage/src/sqlite/paging.ts:40` — rohes `U+0000` macht eine **Produktivdatei** für Git zur Binärdatei; seit `d9555d0` nie im Review lesbar. **Offen.** | domain-dev |
| **T-125-H7** | Hinweis | rohe unsichtbare Zeichen in `T-111-unit-tester.md` und `T-121-unit-tester.md`. Berichte, kein Code. **Offen.** | unit-tester |
| T-112-H1 | Hinweis, unverändert offen | `usecases/pool-movement.ts` — ein `resolveAxes` je Regel, keine Obergrenze für die Zahl der Regeln. In diesem Diff nicht verschlechtert. | Auftraggeber, Orchestrator |
| T-112-H3 | Hinweis, halb offen | `apps/web/src/lib/errorText.ts` — die Namen stehen in **einem** zusammengefügten Satz statt als eigene Knoten. | frontend-dev |
| S-1 (aus R-3a) | sollte, vor dem Push | Zweig `backup/status-als-regelterm-vor-filter`. Bis zur Bereinigung: ausschließlich benannte Zweige pushen, nie `--all`, nie `--mirror`. | Orchestrator |

**Erledigt und nachgemessen:** T-112-1 (beide Türen benutzen dasselbe Schemaobjekt, der zusichernde
Kommentar ist richtiggestellt), T-112-H2 (kein rohes Zeichen mehr in `input.test.ts`), B-1.6 Punkt 3
im Startfenster (Ursache behoben, Nachweis 0d mit gefahrener Gegenprobe), der Beendigungscode 1 beim
ordentlichen Anhalten.

### 17.8 Urteil dieser Prüfung

**Freigegeben für die Wellen J bis L.**

Die Wellen verkleinern die Angriffsfläche deutlich: eine Zeichenklasse an einem Ort statt an
zweien, vier Stellen, die lesen statt abzuschreiben, zwei abgeleitete Wächter, die eine Abweichung
rot machen, der Windows-Benutzername unter derselben Klasse mit eigenem Grund, die Anzeigeseite
nach E-063 vollständig gebaut, und ein verwaister Sidecar aus der Welt — an der Ursache und nicht
am Symptom. Kein neuer Zugriffsweg, keine neue Route, keine neue Abhängigkeit, keine
Lieferkettenänderung. Semgrep meldet über 54 geänderte Quelldateien null Befunde.

Die beiden Auflagen der Stufe „sollte" waren **T-125-1** und **T-125-2**, und sie waren derselbe
Satz zweimal: Die Lehre aus E-063 Punkt 4 war im Quelltext angekommen und in der Beschreibung noch
nicht. Beide sind während dieser Prüfung geschlossen worden (17.9); die Freigabe steht damit ohne
Auflage. Was offen bleibt, sind vier Hinweise, von denen keiner eine Vertrauensgrenze berührt.

Das Tor aus Abschnitt 8 bleibt an zwei Stellen uneinlösbar: kein 42Crunch-Auditwert, und Semgrep
Guardian zum **siebten** Mal nicht erreichbar. Beides ist eine Beschaffungsentscheidung und kein
Befund dieses Branches.

### 17.9 Nachmessung — was während dieser Prüfung zugefallen ist

integration-dev und frontend-dev haben während der Prüfung abgelegt. Der Arbeitsbaum ist **nicht**
der bewertete Stand; die folgenden Zahlen sind trotzdem gemessen und nicht angenommen, weil sie
genau die drei Befunde betreffen, die oben stehen. Sie gehören formal in die nächste Runde.

| Befund | Stand `c96a2b2` | Arbeitsbaum, gemessen |
|---|---|---|
| **T-125-1** | `hidden.ts` ohne jede `import`-Zeile, die Beschreibung sagt das Gegenteil | **geschlossen.** `apps/outlook-addin/src/text/hidden.ts` ist eine reine Wiederausfuhr: `export { HIDDEN_MARKER, dropHiddenCharacters as dropHidden, hasHiddenCharacter as hasHidden, visibleText } from '@takt/domain'`. Der Satz in `UnprocessableEntity.description` ist damit wahr. |
| **T-125-2** | 3 Prosafassungen, 1 gewacht | **geschlossen, auf dem zweiten der beiden vorgeschlagenen Wege.** Erneute Auszählung über den YAML-Leser: **1 Prosafassung**, und es ist genau die, die Abschnitt 16 liest. Die beiden Add-in-Beschreibungen wiederholen die Liste nicht mehr. Der stehengebliebene Kommentar in `routes/addin/schema.ts:88-91` ist ebenfalls weg. |
| **T-125-3** | `ABGEWIESENE_ZEICHEN`, 20 abgeschriebene Codepunkte | **geschlossen.** `proof-addin.mjs` führt `FORBIDDEN_NAME_CHARACTERS` aus `@takt/domain` ein (`:162`) und rollt die Bereiche aus (`:3401-3406`). Die Abschrift ist weg. `istLeerraum` (`:3411`) bleibt als Abschrift von `CONTROL_WHITESPACE` stehen — sie fällt bei einer Änderung laut aus und ist kein Befund. |
| **T-125-5** | `explain_exit` sagt „nicht erhalten" | **von der anderen Seite beantwortet.** `apps/desktop/src-tauri/**` ist unverändert, `explain_exit` sagt weiter „nicht erhalten". T-124 hat den Fall stattdessen in der Oberfläche gelöst: `readUserNameFinding` (`apps/web/src/app/connection.ts`) fragt die Hülle nach dem Betriebssystembenutzer und wertet ihn mit **`hasForbiddenNameCharacter` aus `@takt/domain`** aus — keine zweite Fassung, ausdrücklich mit Verweis auf diese Regression. Der Name wird nicht behalten und steht in keiner Meldung (B-8.2 Punkt 1, B-4.3 Punkt 5), und `"unknown"` statt `"ok"`, wenn die Frage nicht beantwortet werden kann. Das ist die bessere Antwort als ein eigener Beendigungscode: Sie erklärt den Fehlschlag, statt ihn zu kodieren. **Rest:** Der Satz in `explain_exit` bleibt für `user_invalid` sachlich falsch; ob er neben der neuen Fläche überhaupt noch erscheint, ist eine Frage an spec-ux-reviewer und keine der Sicherheit. |

**Die Bilanz aus 17.1 im Arbeitsbaum:** Jeder Träger der Zeichenklasse liest jetzt entweder
(`input.ts`, `session-secret.ts`, `addin/schema.ts`, `hidden.ts`, `proof-addin.mjs`,
`connection.ts`) oder wird gemessen (`UnprocessableEntity.description` durch `proof:openapi` 16;
die Tür durch den BMP-Scan in `proof:addin` 17). Übrig bleiben die beiden Testdateien, die Ränder
prüfen und sollen, und `istLeerraum`, das laut ausfällt. **Damit trägt die geteilte Fassung die
Antwort — im Arbeitsbaum, nicht schon an `c96a2b2`.**

---

## 18. Vorabbewertung T-136 (2026-09-04) — der Ausgang ins Netz, bevor er gebaut wird

Dieser Abschnitt bewertet eine Vertrauensgrenze, die es **noch nicht gibt**. Das ist sein Sinn:
Die Anforderungen A-18.1 bis A-18.12 stehen seit heute in der Spezifikation, E-064 legt die
Bauform fest, gebaut wird in Welle Q (T-138, T-139). Alles, was hier als **Auflage** steht, ist
damit keine Nachforderung an fertigen Code, sondern die Vorgabe, gegen die gebaut und geprüft
wird.

Bis heute galt der stärkste einzelne Satz dieses Entwurfs: Takt kennt keine Adresse außerhalb
von `127.0.0.1` (E-001). Er gilt ab jetzt mit **einer** benannten Ausnahme. Eine Ausnahme ist
kein Zustand, sondern ein Ort — und dieser Ort heißt VG-10.

### 18.0 Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| Semgrep, lokal (`p/nodejsscan`, `p/typescript`) über `apps/*/src`, `apps/desktop/src-tauri/src`, `packages` | 188 Regeln, 193 Dateien, **9 Befunde**, alle in den seit T-023 bekannten Klassen: 3× `regex_dos` an Ausdrücken über *eigene* Konstanten (`origin-policy.ts:175,182`, `migration-runner.ts:305`), 4× `node_timing_attack` an React-Kontextvergleichen (`===` auf Zustandsmarken, kein Geheimnis), 1× `node_secret` an `redactSecrets` (die Funktion heißt so, sie enthält keins), 1× `node_username` in `showcase/ShellStateSection.tsx` (Anschauungsdaten). **Kein Befund hoher Schwere.** Zwei Parse-Warnungen an `export type *` in `packages/domain/src/index.ts` — TS-5-Syntax, die der Semgrep-Parser nicht kennt, kein Befund. |
| Semgrep Guardian (SAST, Geheimnisse, Lieferkette) | **Nicht erreichbar — „Not logged into Semgrep Guardian".** Zum **achten** Mal in Folge. Beschaffungsentscheidung, kein Befund dieses Zweigs. |
| 42Crunch Audit gegen `apps/local-api/openapi/takt-local-api.yaml` | **Nicht gelaufen.** Kein `42c-ci-cli`, kein Token, kein `~/.42crunch`. Unverändert die Lücke aus 12.4, 13, 14.1, 15.1, 16.1 und 17.0. Ersatz: die Auflagen A-V-19 und A-V-20 beschreiben, was die neue Route in der Beschreibung leisten muss. |
| Eigene Messungen gegen Node 22.23.2 und `tauri-plugin-shell 2.3.6` | Sechs Messungen, alle unten mit Zahl belegt (18.2, 18.3, 18.4, 18.5, 18.6). Sie sind der Grund, warum drei der Auflagen anders lauten, als man sie ohne Messung geschrieben hätte. |
| Repository-Hygiene über die geänderten Dateien | Keine Zugangsdaten, keine Kundendaten, keine echten Call-Nummern. `github.com` kommt im Produktivcode **an keiner Stelle** vor — die Zählung aus A-V-1 startet damit bei null und ist ab dem ersten Commit von T-138 aussagekräftig. |

### 18.1 Was hier bewertet wird

Der Aufbau nach E-064, in der Reihenfolge, in der die Daten laufen:

```text
  GitHub (api.github.com)
        │  (1) Antwort: beliebig groß, beliebig geformt, fremder Text
        ▼
  Lokaler Dienst  apps/local-api   ← VG-10, hier liegt die ganze Prüfung
        │  (2) heraus: eine geprüfte Fassungsbezeichnung, sonst nichts
        ▼
  Oberfläche  apps/web             ← CSP: darf GitHub gar nicht fragen
        │  (3) Knopf „Installieren" → takt_open_release(version)
        ▼
  Hülle  apps/desktop/src-tauri    ← baut die Adresse selbst
        │  (4) app.shell().open(feste Adresse + geprüfte Fassung)
        ▼
  Browser des Benutzers            ← VG-9 hinaus; kein Weg zurück
```

Vier Wege, vier Bedrohungen, und die Reihenfolge ist absteigend nach Schaden: (2) und (3) sind
die Stellen, an denen ein Fehler den Benutzer auf eine fremde Seite führt, von der er eine Datei
holt und ausführt.

**Zwei Eigenschaften der Bauform, die vorab festzuhalten sind, weil sie später tragen.**

1. **Die Oberfläche kann GitHub nicht fragen, und das ist gemessen, nicht angenommen.** Die CSP
   in `apps/desktop/src-tauri/tauri.conf.json` setzt `default-src 'none'` und
   `connect-src 'self' ipc: http://ipc.localhost http://127.0.0.1:17843`. Ein `fetch` aus dem
   Webview nach `api.github.com` scheitert an der Richtlinie, nicht an einer Verabredung. Solange
   diese Zeile so bleibt, ist ein XSS im Webview kein Weg ins Netz — und **deshalb** darf sie
   nicht geöffnet werden. Siehe Befund T-136-2 zur Beschreibung dieser Zeile.
2. **Die Route ist von selbst geschlossen.** `requiredCredentialForPath`
   (`apps/local-api/src/access/route-policy.ts:111`) verlangt `session` für **alles**, was nicht
   unter `/api/v1/addin` liegt oder wörtlich in `SHARED_PATHS` steht. Eine neu registrierte Route
   muss nirgends eingetragen werden, um geschlossen zu sein; sie müsste eingetragen werden, um
   offen zu sein. Das ist die Richtung aus B-2.10, und sie trägt hier zum ersten Mal, ohne dass
   jemand daran gedacht hat.

---

### 18.2 B-18.1 — Die fremde Antwort im Prozess
**Schwere:** hoch. **Betrifft:** W-01 bis W-05, die Verfügbarkeit des Dienstes. **Akteure:** A-10.
**Bezug:** A-18.3, A-18.11, E-063, E-064 Punkt 2, R-19 Punkt 1. **Grenze:** VG-10.

**Auswirkung.** Die Antwort ist ein Datenblock, den der Dienst nicht kontrolliert. Vier Dinge
können daran falsch sein, und sie sind verschieden schlimm:

1. **Größe.** Die Antwort ist unbegrenzt. Wird sie vollständig gelesen, entscheidet der
   Absender über den Arbeitsspeicher des Sidecars.
2. **Dauer.** Die Antwort kann anfangen und nie enden. Wird sie ohne Frist gelesen, hält sie
   einen Zeitgeber, eine Verbindung und beim Anhalten die Ereignisschleife.
3. **Gestalt.** `tag_name` kann fehlen, `null`, eine Zahl, ein Objekt oder eine 60 000 Zeichen
   lange Zeichenkette sein. Der Rumpf kann tief verschachtelt sein.
4. **Inhalt.** `body` (die Fassungsbeschreibung), `name` und `html_url` sind Text, den jemand
   anderes geschrieben hat. Er kann Steuer- und Richtungszeichen tragen, Markdown, HTML, eine
   fremde Adresse.

**Was die bestehende Behandlung leistet — und was sie hier ausdrücklich nicht leistet.**

E-063 ist die richtige Klasse, aber sie deckt diesen Fall nur zur Hälfte. `<Foreign>`
(`apps/web/src/components/Foreign.tsx`) setzt fremden Text in ein `<bdi>` und ersetzt unsichtbare
Zeichen durch `U+FFFD`; `proof:foreign` erzwingt über den Typ `ForeignText`, dass keine
Anzeigestelle daran vorbeikommt. Das greift, **sobald** ein Text in der Oberfläche steht.

Es greift **nicht** für:

* **Alles vor der Anzeige.** Die Größe der Antwort, die Frist, die Verschachtelung des JSON und
  der Speicher des Sidecars sind vor `<Foreign>`. Ein Dienst, der beim Lesen der Antwort stirbt,
  hat kein Anzeigeproblem.
* **Adressen.** `<Foreign>` behandelt Text zur *Anzeige*. Ein Wert, der in ein `href`, in eine
  `URL` oder in einen Öffnen-Befehl geht, ist keine Anzeige, und die Behandlung wäre dort
  wirkungslos: `U+FFFD` an der Stelle eines Steuerzeichens macht eine Adresse nicht sicher, es
  macht sie kaputt. Das ist B-18.2 und ein eigener Weg.
* **Markdown und HTML.** Die Fassungsbeschreibung ist Markdown. `<Foreign>` nimmt ihr keine
  Auszeichnung; es setzt sie als Text. Solange sie **nicht angezeigt** wird, ist das kein Thema —
  und genau deshalb ist „wird nicht angezeigt" die Auflage und nicht „wird behandelt".
* **Zahlen.** `0.10.0` gegen `0.9.0` ist kein Anzeige-, sondern ein Ordnungsproblem (A-18.4).
  Eine Fassungskomponente mit 30 Ziffern verlässt den genauen Bereich von `Number`.

**Die einfachste falsche Lösung, und warum sie falsch ist.** `const daten = await antwort.json()`
liest den Rumpf **vollständig**, bevor irgendeine Grenze greifen kann. Eine Prüfung von
`content-length` hilft dagegen nicht — siehe die Messung unten.

**Gemessen (Node 22.23.2, lokaler Prüfserver).** Eine Antwort mit
`content-encoding: gzip` und `content-length: 50989` ergab nach dem automatischen Auspacken durch
undici **52 428 800 Bytes** im Speicher. Faktor **1 028**. Wer die Obergrenze aus `content-length`
liest, hat keine Obergrenze; wer `response.json()`, `response.text()` oder
`response.arrayBuffer()` ruft, ebenfalls nicht.

**Gemessen.** `JSON.parse('['.repeat(50000))` wirft `SyntaxError`, ebenso
`JSON.parse('{"a":'.repeat(20000) + '1')`. Ein Wurf ist hier kein Schutz, sondern eine Pflicht:
Er muss gefangen werden, sonst ist die unerwartete Antwort aus A-18.11 ein Absturz statt eines
stillen Fehlschlags.

**Gegenmittel.** Die Auflagen A-V-5 bis A-V-9 und A-V-14 (18.9).

**Zuständig:** domain-dev (T-138) für Frist, Grenze, Auswertung und Ordnung; frontend-dev (T-139)
für die Anzeige. **Prüfung:** unit-tester (T-140) gegen einen lokalen Prüfserver, der die
Antworten aus A-V-6 bis A-V-8 nachstellt.

---

### 18.3 B-18.2 — Der Weg einer Adresse in den Browser des Benutzers
**Schwere:** hoch — **die höchste in diesem Vorhaben.** **Akteure:** A-10, A-02 (über ein XSS im
Webview), A-03. **Bezug:** A-18.8, A-18.9, E-064 Punkt 4, R-19 Punkt 2. **Grenzen:** VG-9, VG-10.

**Auswirkung.** Der Benutzer klickt „Installieren", weil Takt ihm sagt, es gebe eine neue Fassung.
Er ist in diesem Moment darauf eingestellt, eine Datei zu holen und auszuführen — die Erzeugnisse
sind **unsigniert** (`.github/release-preamble.md` sagt es ausdrücklich), SmartScreen und Gatekeeper
warnen also ohnehin, und er ist darauf vorbereitet, die Warnung wegzuklicken. Führt der Klick auf
eine fremde Seite, ist das keine Phishing-Mail, der er misstrauen könnte, sondern seine eigene
Anwendung, die ihn hinschickt. Der Schaden ist Codeausführung im Benutzerkonto, und damit alles:
die SQLite-Datei, die Exportdateien, das Add-in-Token, W-01 bis W-05 vollständig.

**Zwei Bauformen, und der Unterschied ist die ganze Aufgabe.**

*Die naheliegende:* Die Antwort trägt `html_url`. Die Oberfläche bekommt sie, reicht sie an einen
Öffnen-Befehl, fertig. Zwei Zeilen weniger, und in der Fähigkeitenliste steht dafür `shell:default`
oder `shell:allow-open`.

*Die festgelegte (E-064 Punkt 4):* Der Befehl nimmt **keine Adresse** entgegen, sondern die
Fassungsbezeichnung, prüft sie und setzt sie in eine fest hinterlegte Adresse ein.

**Warum die naheliegende Form nicht trägt — gemessen an `tauri-plugin-shell 2.3.6`, nicht
vermutet:**

1. **`shell:default` enthält `allow-open`.** In `permissions/default.toml` steht
   `permissions = ["allow-open"]`. Wer den Vorgabesatz aufnimmt, um „nur das Nötige" zu erlauben,
   erlaubt das Öffnen.
2. **Die Vorgabeprüfung von `open` lässt jede `https:`-Adresse durch.** Der Ausdruck steht in
   `src/open.rs:107`: `^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+`. Er prüft das Schema und
   sonst nichts — kein Wirt, kein Pfad, und er ist am Ende nicht verankert. Ein XSS im Webview
   oder ein aus der Antwort übernommenes `html_url` öffnet damit **jede** Seite im Browser des
   Benutzers. Das ist eine offene Weiterleitung, deren Ziel nicht ein Reiter, sondern der Browser
   des Benutzers ist.
3. Ein selbstgeschriebener Prüfausdruck in `tauri.conf.json > plugins > shell > scope > open`
   verlagert das Problem nur: Ein fehlendes `$`, ein unmaskierter Punkt, ein `.*` an der falschen
   Stelle, und `https://github.com.evil.example/...` besteht. Das ist wörtlich dieselbe Falle, die
   `ALLOWED_ORIGINS` (`config.ts:70-75`) mit „Zeichengleichheit, kein `startsWith`" vermeidet und
   die B-5.1 Punkt 3 für Pfade beschreibt.

**Und der Befund, der die festgelegte Form von einer Vorsichtsmaßnahme zur Grenze selbst macht:**

> **Auf dem Rust-Weg prüft `tauri-plugin-shell` gar nichts.** `Shell::open` (`src/lib.rs:76-78`)
> ruft `open::open(None, path, with)`, und `open::open` (`src/open.rs:122-136`) sagt im eigenen
> Quelltext: *„when running directly from Rust code we don't need to validate the path"*. Der
> `OpenScope` mit dem Prüfausdruck wird ausschließlich betreten, wenn der Aufruf aus JavaScript
> kommt (`scope.rs:207-224`).

Für den Befehl aus E-064 Punkt 4 heißt das: **Es gibt kein zweites Netz.** Zwischen der Antwort
von GitHub und `ShellExecuteW` beziehungsweise `xdg-open` steht genau eine Kontrolle, und das ist
die Formprüfung, die T-139 schreibt. Sie ist deshalb keine Sorgfalt, sondern die Vertrauensgrenze.
Geführt als Befund **T-136-1**.

**Was die Prüfung der Fassungsbezeichnung leisten muss.**

| Frage | Antwort, prüfbar |
|---|---|
| Welche Form? | `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$`, angewandt auf die Bezeichnung **ohne** führendes `v`. |
| Welche Zeichen? | Ausschließlich `0-9`, `A-Z`, `a-z`, `.` und `-`. **Nicht** enthalten und damit nicht möglich: `/`, `\`, `?`, `#`, `:`, `@`, `%`, Leerzeichen, Zeilenumbruch, `..` als vollständiges Segment (jedes Segment beginnt mit `v` und einer Ziffer). Das ist der Grund, warum die Zusammensetzung sicher ist — nicht eine Meinung über die Adresse, sondern der Zeichenvorrat. |
| Welche Länge? | Höchstens 94 Zeichen (9+1+9+1+9+1+64). Der Ausdruck bindet jede Komponente; ohne die Schranken wäre er in der Länge unbegrenzt. |
| Woher die Form? | Sie ist die Regel aus `.github/workflows/release.yml` (`^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$`) und `apps/desktop/scripts/build-app.mjs:161` — **um Ziffern- und Längenschranken verengt**. Die Tür ist damit enger als der Erzeuger. Folge, die benannt gehört: Ein Etikett mit einer Vorabkennung von mehr als 64 Zeichen würde stillschweigend nicht gemeldet. Das ist der bessere Fehlschlag, aber es ist einer. |
| Was bei Nichtbestehen? | **Kein Aufruf, kein Öffnen, keine Anzeige, kein zweiter Versuch** (A-18.11). Der Rust-Befehl gibt `Err` mit einem technischen Schlüssel zurück und **ohne** den abgelehnten Wert; der Dienst protokolliert einen Schlüssel und keinen Inhalt. Ein abgewiesener Wert in einer Meldung wäre derselbe fremde Text an einer neuen Stelle. |

**Gemessen.** 500 000 erzeugte Zeichenketten aus dem erlaubten Vorrat, jede an die feste Adresse
`https://github.com/KuyomieKurama/SuperTakt/releases/tag/v` angehängt und durch den URL-Parser
geschickt: **null Ausbrüche.** In jedem Fall blieb `origin` gleich `https://github.com`, der Pfad
begann mit `/KuyomieKurama/SuperTakt/releases/tag/v`, und `search` und `hash` blieben leer.
Gegenprobe mit `../../../evil`, `1.2.3/../../evil`, `1.2.3?x=1`, `1.2.3#a`, `1.2.3@evil.example`,
`1.2.3\evil`, `1.2.3%2f..%2f..%2fevil`, `1.2.3 evil`, `1.2.3\n` und
`999999999999999999999.0.0`: **jeder** von der Form abgewiesen, keiner erreichte die
Zusammensetzung.

**Gegenmittel.** Die Auflagen A-V-15 bis A-V-18 (18.9).

**Zuständig:** frontend-dev (T-139). **Prüfung:** unit-tester (T-140) — die Ausbruchsliste oben
als Prüffälle in `#[cfg(test)]` neben dem Befehl, jeder mit erwartetem `Err`; dazu die Gegenprobe,
dass **kein** Weg im ganzen Vorhaben zu einem Download führt (A-18.9).

---

### 18.4 B-18.3 — Weiterleitung auf einen fremden Wirt
**Schwere:** hoch. **Akteure:** A-10. **Bezug:** A-18.3, E-064 Punkt 1, R-19. **Grenze:** VG-10.

**Auswirkung.** Eine Antwort mit `302` und `location: https://evil.example/…` verlegt die Adresse,
die laut A-18.3 „weder einstellbar noch aus einer Antwort übernehmbar" ist — und zwar über den
einen Weg, den man beim Lesen der Anforderung übersieht, weil er nicht wie eine Übernahme
aussieht. Der Wirt am anderen Ende bestimmt danach alles aus B-18.1 und kann eine Fassung
melden, die es nicht gibt. Er sieht außerdem die Anfrage, die für GitHub gedacht war.

**Die Zusage, die der Netzaufruf halten muss:** Es wird **genau eine** Verbindung aufgebaut,
und zwar zu `api.github.com`. Eine Antwort mit einem Statuscode 3xx wird nicht ausgewertet; ihre
`location`-Kopfzeile wird nicht gelesen und nicht angesteuert.

**Woran sie messbar ist.** `fetch(…, { redirect: 'error' })`.

**Gemessen (Node 22.23.2).** Mit der Vorgabe `redirect: 'follow'` folgt Node bis zu 20
Weiterleitungen, ohne etwas zu melden — das ist der Zustand, den man bekommt, wenn man die Option
nicht setzt. Mit `redirect: 'manual'` liefert undici die 302 samt lesbarem
`location: http://127.0.0.1:1/evil` zurück; die Zusage hinge dann daran, dass der Aufrufer sie
nicht liest. Mit `redirect: 'error'` wirft `fetch` einen `TypeError` mit
`cause: Error: unexpected redirect`, die `location` wird nie gelesen und nie verbunden. Nur die
letzte Form ist eine Zusage und keine Verabredung.

**Der Prüffall, und er hat zwei Hälften.** Ein lokaler Prüfserver antwortet mit `302` auf einen
zweiten lokalen Prüfserver. Erwartet wird (1) ein stiller Fehlschlag der Versionsprüfung **und**
(2) **null** eingegangene Anfragen am Umleitungsziel. Die zweite Hälfte ist die eigentliche
Aussage; ohne sie belegt der Prüffall nur, dass etwas schiefging.

**Und die Wahl der Adresse folgt daraus.** `https://github.com/…/releases/latest` ist die
HTML-Seite und antwortet mit `302` auf die Seite des Etiketts. Unter `redirect: 'error'` wäre sie
damit **nie** benutzbar. Die maschinenlesbare Quelle
`https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest` antwortet unmittelbar und
liefert `tag_name`. Sie schließt außerdem Entwürfe und Vorabfassungen aus, was A-18.2
(„veröffentlichte Fassung") genau trifft. Die Verengung aus A-V-3 wählt damit die Adresse aus
A-V-1 mit aus — das ist kein Zufall, sondern der Nutzen einer Auflage, die früh genug steht.

**Was gegen einen Angreifer im Netzweg schützt, ist nicht diese Auflage, sondern TLS.** Deshalb
A-V-4: `https:` ausschließlich, keine eigene Zertifikatsprüfung, kein `dispatcher`, kein
`ProxyAgent`, kein `NODE_TLS_REJECT_UNAUTHORIZED`. Nachgesehen: Keine dieser Zeichenketten kommt
heute irgendwo in `apps/**` oder `packages/**` vor. Die Auflage hält einen Zustand, sie stellt
ihn nicht her.

**Zuständig:** domain-dev (T-138). **Prüfung:** unit-tester (T-140), beide Hälften.

---

### 18.5 B-18.4 — Betriebsmittel: Frist, Größe, Häufigkeit, Anhalten
**Schwere:** mittel. **Akteure:** A-10, A-03. **Bezug:** A-18.11, E-064. **Grenze:** VG-10.

**Auswirkung.** Ohne Zahlen ist jede der folgenden Größen vom Absender bestimmt: wie lange der
Dienst wartet, wie viel Speicher er belegt, wie oft er hinausgeht und ob er sich noch beenden
lässt. Der letzte Punkt ist der, der in diesem Bestand schon einmal weh getan hat: 17.2
(verwaister Sidecar) und T-125-4 (`shutdown()` ohne Frist) sind dieselbe Klasse.

**Die Zahlen, und jede mit ihrem Grund.**

| Größe | Wert | Grund |
|---|---|---|
| Gesamtfrist | **5 000 ms** | Deckt Verbindung, Kopfzeilen **und** das Lesen des Rumpfes in **einer** Frist. Die eingehende Frist des Dienstes ist 15 000 ms (`REQUEST_TIMEOUT_MS`); die ausgehende muss deutlich darunter liegen, weil sie im Hintergrund läuft und niemanden warten lässt. **Gemessen:** `AbortSignal.timeout(700)` bricht eine Antwort, die `{"a":` schreibt und dann schweigt, nach **703 ms** ab (`TimeoutError`). Die Frist greift also auch beim Rumpf und nicht nur beim Verbindungsaufbau. |
| Obergrenze der gelesenen Antwort | **65 536 Bytes des entpackten Stroms** | Beim Lesen gezählt, nicht aus `content-length` und nicht aus `content-encoding` abgeleitet (Messung in 18.2: Faktor 1 028). Die echte Antwort von `releases/latest` liegt für diesen Bestand bei rund 15 KiB (Vorspann, Prüfsummen, erzeugte Beschreibung, acht Erzeugnisse); 64 KiB gibt das Vierfache. **Auflage an T-138:** die tatsächliche Größe einmal gegen die echte Adresse messen und in den Bericht schreiben. Liegt sie über 32 KiB, wird die Zahl **bewusst** angehoben und nicht stillschweigend. |
| Antwort, die nie endet | fällt unter die Gesamtfrist | Der bis dahin gelesene Teil wird **verworfen**, nicht geparst. Ein halbes JSON ist keine Antwort. |
| Häufigkeit | **eine** ausgehende Anfrage je Start, danach höchstens eine je **24 h**; harter Boden von **60 min** zwischen zwei Anfragen desselben Laufs | A-18.2 verlangt „beim Start und danach regelmäßig". 24 h ist für ein Werkzeug, das ein paar Mal im Jahr eine Fassung bekommt, reichlich. Der Boden schützt gegen einen Zeitgeber, der aus irgendeinem Grund öfter feuert. |
| Nach einem Fehlschlag | **kein zweiter Versuch im selben Lauf** | Wörtlich A-18.11. Der Zeitgeber wird nach einem Fehlschlag **nicht** neu gestellt. Das ist strenger, als man es von selbst bauen würde, und es ist die Anforderung. |
| Zeitgeber und laufender Aufruf beim Anhalten | Zeitgeber `unref()`t, `fetch` an einem `AbortController`, den `shutdown()` auslöst | Sonst hält ein Netzaufruf, der auf eine Antwort wartet, die Ereignisschleife über die Abschaltfrist hinaus — genau der Weg zu 17.2. `main.ts:420` macht es beim Abschalt-Zeitgeber bereits vor. |

**Und die Auflage, die man ohne den lokalen Bedrohungsraum nicht schriebe.**

> **Der Netzaufruf läuft nie innerhalb eines eingehenden Anfragebehandlers.** Die Route gibt das
> zuletzt ermittelte Ergebnis zurück; sie löst keine ausgehende Anfrage aus.

Grund: Der Dienst ist für jeden lokalen Prozess erreichbar (R-02, VG-1). Ein Prozess mit dem
Sitzungsgeheimnis — A-03, und ein Prozess im Benutzerkonto kommt an eine Datei, die die Hülle
gelesen hat — könnte die Route sonst in einer Schleife aufrufen und Takt beliebig viele Anfragen
von der Adresse des Benutzers an GitHub schicken lassen. Drei Folgen, alle unerwünscht: Takt wird
zum Anfragegenerator; das Lebenszeichen aus B-18.5 wird von einem Dritten getaktet statt von Takt;
und die 60 Anfragen je Stunde und Quelladresse, die GitHub nicht angemeldeten Aufrufern zugesteht,
sind in Sekunden verbraucht. **Prüffall:** die Route 100-mal aufrufen und am Prüfserver **eine**
ausgehende Anfrage zählen.

**Zuständig:** domain-dev (T-138). **Prüfung:** unit-tester (T-140); das Anhalten gehört in
`proof:access` neben die Messung aus T-125-4.

---

### 18.6 B-18.5 — Das Lebenszeichen
**Schwere:** mittel. **Akteure:** A-11 (Senke), A-10. **Bezug:** A-18.12, R-19 Punkt 3.
**Grenze:** VG-10.

**Auswirkung.** Jede Anfrage teilt mit, dass an dieser Adresse zu dieser Zeit jemand Takt fährt.
A-18.12 verbietet, mehr mitzuschicken als nötig — und die ehrliche Lesart ist: „mehr", nicht
„etwas". Die Anfrage selbst ist nicht wegzukürzen; die Frage ist, was **zusätzlich** darin steht.

**Was ohne Zutun drinsteht — gemessen, Node 22.23.2, `fetch` ohne jede Option:**

```text
host: 127.0.0.1:43137          ← der Wirt, unvermeidlich
connection: keep-alive
accept: */*                    ← wird von A-V-13 überschrieben
accept-language: *             ← wörtlich der Stern, NICHT die Sprache des Benutzers
sec-fetch-mode: cors
user-agent: node               ← wird von A-V-13 überschrieben
accept-encoding: gzip, deflate ← der Grund für die Messung in 18.2
```

Der Befund dieser Messung ist ein guter: **Keine dieser Kopfzeilen trägt den Benutzer, den
Rechnernamen, die Sprache des Systems, eine Kennung oder die Fassung.** `accept-language` ist
wörtlich `*` und nicht `de-DE` — hätte Node hier die Systemsprache eingesetzt, wäre das ein
Merkmal gewesen, das man erst bemerkt, wenn man nachsieht. Der Prüffall dazu ist deshalb kein
Vorwand: Er hält diesen Zustand fest, damit eine spätere Node-Fassung ihn nicht stillschweigend
ändert.

**Was gesetzt werden darf, und mehr nicht:**

* `accept: application/vnd.github+json` — der Vertrag mit der Quelle.
* `x-github-api-version: 2022-11-28` — nagelt die Antwortgestalt fest, sagt nichts über den
  Benutzer.
* `user-agent: Takt` — **ohne Fassungsnummer.** GitHub verlangt eine Kennung; die Adresse nennt
  den Bestand ohnehin, die Kennung fügt also nichts hinzu, was nicht schon dasteht. Die
  Fassungsnummer wäre dagegen genau die Angabe aus R-19 Punkt 3, und sie ist für die Anfrage
  nicht nötig: **Der Vergleich der Fassungen findet auf diesem Rechner statt.** Wer die
  installierte Fassung in die Anfrage schreibt, verschenkt die einzige Zurückhaltung, die diese
  Bauform überhaupt erlaubt.

**Und ausdrücklich nicht:** `authorization`, `cookie`, eine Kennung der Installation, der
Windows-Benutzername, der Rechnername, die Anzahl der Todos, irgendein Wert aus dem Bestand.
Kein Rumpf, kein Abfrageparameter, keine `POST`-Methode.

**Was bleibt und nicht wegzuverhandeln ist (Restrisiko, 18.11):** Quelladresse, Zeitpunkt,
Wiederholungsmuster, der TLS-Namenshinweis `api.github.com` und die Tatsache, dass **dieser**
Bestand abgefragt wird. GitHub protokolliert das; ein TLS-abschließender Unternehmens-Proxy sieht
zusätzlich den Inhalt. Das ist der Preis von A-18.2 und gehört ins Benutzerhandbuch, nicht in eine
Fußnote.

**Zuständig:** domain-dev (T-138), documenter (T-141) für den Satz im Handbuch.
**Prüfung:** unit-tester (T-140) — die Prüfung läuft gegen einen Prüfserver, der **alle**
Kopfzeilen aufzeichnet; die Behauptung wird gegen eine **feste Liste** gehalten und wird rot,
sobald eine Kopfzeile hinzukommt. Zusätzlich die Gegenprobe, dass die installierte Fassung als
Zeichenkette in keiner Kopfzeile und in keinem Teil der Adresse vorkommt.

---

### 18.7 B-18.6 — Die neue Route und die Vertrauensgrenze zum Add-in
**Schwere:** mittel. **Akteure:** A-02, A-03. **Bezug:** B-2.10, R-02, R-09. **Grenzen:** VG-1, VG-2.

**Auswirkung.** Eine neue Route ist eine neue Tür. Steht sie offen, liest jeder lokale Prozess
und jede Webseite im Browser des Benutzers ab, dass hier Takt in Fassung X läuft — eine Angabe,
die `GET /health` seit B-1.1 Punkt 2 bewusst **nicht** herausgibt, damit ein Angreifer ohne
Nachweis nicht einmal erfährt, dass Takt läuft.

**Der Bestand trägt das bereits, und zwar ohne Zutun.** `requiredCredentialForPath`
(`route-policy.ts:111-131`) gibt `session` für jeden Pfad zurück, der nicht unter
`${API_BASE_PATH}/addin` liegt und nicht wörtlich in `SHARED_PATHS` steht — heute ist das genau
`/api/v1/health`. Eine Route `/api/v1/version` fällt damit in den `session`-Zweig, ohne dass
jemand sie eintragen muss. Ein Add-in-Token bekommt dort **401** und erfährt nicht einmal, dass es
die Route gibt.

**Darf das Add-in sie sehen? Nein.** Es braucht sie nicht: Es legt Todos an und bucht Zeiten, es
aktualisiert Takt nicht. Und es weist sich mit dem **dauerhaften** Token aus, das im
`localStorage` eines von Microsoft gehosteten Webviews liegt (E-009, E-019, R-09, VG-2). Jede
Angabe, die dieses Token erreicht, ist eine Angabe, die ein entwendetes Token erreicht. Die Fläche
aus T-019 bleibt bei vier Routen.

**Drei Auflagen, damit das so bleibt und gemessen ist:**

1. Die Route wird an **derselben** Hono-Anwendung registriert wie alle anderen. Dann erfasst sie
   `proof:route-policy` Abschnitt 4 von selbst — der Lauf fragt den zusammengebauten Dienst nach
   **seiner eigenen** Routenliste (`Hono#routes`) und fährt jede Route außerhalb von `/addin`
   einmal mit dem Add-in-Token an, erwartet 401. Eine Route auf einem eigenen Server oder einem
   eigenen Port wäre an diesem Nachweis vorbei.
2. Sie kommt **nicht** in `SHARED_PATHS` und **nicht** unter `/api/v1/addin`.
3. `GET /addin/context` bekommt **kein** Feld zur Fassung.

**Nachweis, den es schon gibt und der zählt:** Nach dem Bau von T-138 muss die Zahl der von
`proof:route-policy` Abschnitt 4 geprüften Routen um genau eins steigen, und der Lauf muss grün
bleiben. Steigt sie nicht, ist die Route an der Aufzählung vorbei registriert — und das ist der
Befund, nicht der 401.

**Zuständig:** domain-dev (T-138). **Prüfung:** `proof:route-policy`, dazu ein Prüffall „Route
ohne Nachweis ergibt 401" und „mit Add-in-Token ergibt 401".

---

### 18.8 B-18.7 — Zulieferung
**Schwere:** mittel. **Akteure:** A-07. **Bezug:** VG-7, 5.10. **Grenze:** VG-7.

**Die Frage.** Braucht der Netzaufruf eine neue Abhängigkeit? Eine neue Abhängigkeit **an dieser
Stelle** wäre besonders unangenehm: Sie liefe im Prozess, der als Einziger nach außen spricht,
und sie sähe die Antwort vor jeder Prüfung.

**Die Antwort: nein, auf beiden Seiten.**

* **Node.** Der Arbeitsbereich verlangt `node >= 22.5.0` (Wurzel-`package.json`), der
  Auslieferungsablauf nagelt `22.23.2` fest (`release.yml`, `NODE_VERSION`). Globales `fetch` ist
  dort vorhanden und stabil; `AbortSignal.timeout`, `redirect: 'error'` und der Lesestrom über
  `response.body` ebenfalls — alle vier in 18.2 bis 18.5 auf genau dieser Fassung gemessen.
  **Auflage:** `apps/local-api/package.json` bekommt für die Versionsprüfung **keine** neue
  Abhängigkeit. Kein `node-fetch`, kein `axios`, kein `got`, kein `undici` als unmittelbare
  Abhängigkeit, und **keine Bibliothek für die Ordnung der Fassungen** — sie liegt nach E-064
  Punkt 3 als Fachlogik in `packages/domain`, wo sie ohne Netz und ohne Paket prüfbar ist.
  Messbar: `pnpm-lock.yaml` wächst durch T-138 nicht, und `dependencies` von `@takt/local-api`
  bleibt bei sechs Einträgen.
* **Rust.** `tauri-plugin-shell` steht bereits in `Cargo.toml:37` — dort allerdings für den
  Sidecar (`ShellExt` in `sidecar.rs:50`), nicht für das Öffnen. Das Öffnen braucht **kein**
  weiteres Paket: `app.shell().open(...)` ist dieselbe Kiste. **Auflage:** kein
  `tauri-plugin-opener`, keine HTTP-Kiste in der Hülle. Die Hülle spricht nicht mit dem Netz;
  das tut der Dienst.

**Ein Hinweis, der dazugehört.** `Shell::open` trägt
`#[deprecated(since = "2.1.0", note = "Use tauri-plugin-opener instead.")]`. Der Aufruf braucht
also ein `#[allow(deprecated)]`. Das ist die richtige Wahl: Ein neues Paket in VG-7 aufzunehmen,
um eine Abkündigungswarnung loszuwerden, tauscht eine Warnung gegen einen Lieferanten. Das
`#[allow]` gehört mit genau diesem Satz kommentiert, damit die nächste Aufräumaufgabe es nicht
für Nachlässigkeit hält.

**Zuständig:** domain-dev (T-138), frontend-dev (T-139). **Prüfung:** `pnpm-lock.yaml` und
`Cargo.lock` im Review; `pnpm install --frozen-lockfile` im Auslieferungsablauf.

---

### 18.9 Die Auflagen — die Vorgabe für T-138 und T-139

Zwanzig Auflagen. Jede ist so geschrieben, dass sie entweder eine Zahl oder eine Gegenprobe hat.
„Sorgfältig behandelt" steht in keiner.

**An T-138 (domain-dev): der Dienst und die Domäne**

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-V-1** | Die Adresse ist **eine** Konstante im Quelltext: `https://api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest`. Nicht aus einer Umgebungsvariablen, nicht aus einer Einstellung, nicht aus der Datenbank, nicht zusammengesetzt aus einem gelesenen Wert. | `grep -rn "api\.github\.com" apps/local-api/src` liefert **genau eine** Fundstelle. Heute liefert `grep -rn "github\.com"` über den gesamten Produktivcode **null** — die Zählung beginnt sauber. |
| **A-V-2** | Nur `GET`. Kein Rumpf, kein Abfrageparameter, kein `authorization`, kein `cookie`. | Prüfserver zeichnet Methode und Adresse auf. |
| **A-V-3** | `redirect: 'error'`. | Prüfserver antwortet 302 auf ein zweites Ziel: stiller Fehlschlag **und** null Anfragen am Ziel. |
| **A-V-4** | Ausschließlich `https:`. Kein `dispatcher`, kein `Agent`, kein `ProxyAgent`, kein `NODE_USE_ENV_PROXY`, kein `NODE_TLS_REJECT_UNAUTHORIZED`, keine eigene Zertifikatsprüfung. | `grep` über `apps/**` und `packages/**` findet keine dieser Zeichenketten. Heute: keine. |
| **A-V-5** | **Eine** Gesamtfrist von **5 000 ms** über `AbortSignal.timeout`, an `fetch` **und** an das Lesen des Rumpfes. | Prüfserver schreibt `{"a":` und schweigt: Ende nach ≤ 5 500 ms, still. |
| **A-V-6** | Obergrenze **65 536 Bytes des entpackten Stroms**, beim Lesen gezählt. Nicht `content-length`, nicht `response.json()`, nicht `response.text()`, nicht `response.arrayBuffer()`. | gzip-Bombe (50 989 Bytes → 52 428 800 Bytes, gemessen): Abbruch vor 65 537 gelesenen Bytes, **kein** `JSON.parse`. Dazu: die echte Antwortgröße einmal messen und in den Bericht schreiben. |
| **A-V-7** | Aus dem geparsten Objekt wird **ein** Feld gelesen: `tag_name`. `body`, `name`, `html_url`, `assets`, `author`, `upload_url` und jedes weitere werden nicht gelesen, nicht protokolliert, nicht gespeichert, nicht weitergereicht. | Genau ein Feldzugriff im Quelltext. |
| **A-V-8** | `tag_name` muss `typeof === 'string'` sein; ohne führendes `v` muss es `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$` erfüllen. Sonst stiller Fehlschlag. | Prüffälle: `null`, `42`, `{}`, `[]`, `true`, fehlend, `""`, 60 000 Zeichen, `../../evil`, `1.2.3?x=1` — jeder ergibt einen stillen Fehlschlag ohne Wurf. |
| **A-V-9** | Die Ordnung liegt in `packages/domain`, zerlegt in drei Zahlen und vergleicht numerisch. `0.10.0 > 0.9.0`. Eine Vorabkennung gilt als **kleiner** als dieselbe Fassung ohne (sonst meldete sich `1.2.3` gegenüber installiertem `1.2.3-rc.1` nicht). Jede Komponente ≤ 999 999 999. | Tabellenprüfung in `packages/domain/test`; kein `localeCompare`, kein `<` auf Zeichenketten. |
| **A-V-10** | **Kein Netzaufruf in einem eingehenden Anfragebehandler.** Die Route gibt das zuletzt ermittelte Ergebnis zurück. | Route 100-mal aufrufen, am Prüfserver **eine** ausgehende Anfrage zählen. |
| **A-V-11** | Eine Anfrage je Start, danach höchstens eine je 24 h, harter Boden 60 min. Nach einem Fehlschlag **kein** zweiter Versuch im selben Lauf. | Zeitgeberprüfung mit gestellter Uhr; nach einem erzwungenen Fehlschlag bleibt die Zahl der ausgehenden Anfragen bei eins. |
| **A-V-12** | Zeitgeber `unref()`t, laufender `fetch` an einem `AbortController`, den `shutdown()` auslöst. | `proof:access`: nach `shutdown()` endet der Prozess innerhalb der Frist, **auch während** eine ausgehende Anfrage läuft. |
| **A-V-13** | Gesetzte Kopfzeilen: `accept: application/vnd.github+json`, `x-github-api-version: 2022-11-28`, `user-agent: Takt` — **ohne Fassungsnummer**. Sonst keine. | Prüfserver zeichnet **alle** Kopfzeilen auf; Vergleich gegen eine feste Liste, rot bei jeder zusätzlichen. Gegenprobe: die installierte Fassung kommt als Zeichenkette in keiner Kopfzeile und in keinem Teil der Adresse vor. |
| **A-V-14** | Was den Dienst verlässt: die geprüfte Fassungsbezeichnung, die installierte Fassung, ein Kennzeichen (neuer / nicht neuer / unbekannt). **Kein** Text aus der Antwort, **kein** `html_url`, **keine** Fassungsbeschreibung. | Antwortschema der Route hat drei Felder; kein Feld vom Typ „freier Text aus der Antwort". |
| **A-V-19** | Die Route steht in `openapi/takt-local-api.yaml`, wird von `proof:openapi` erfasst und ist an derselben Hono-Anwendung registriert. Nicht in `SHARED_PATHS`, nicht unter `/addin`. `GET /addin/context` bekommt kein Fassungsfeld. | `proof:route-policy` Abschnitt 4 prüft **eine Route mehr** als vorher und bleibt grün; `proof:openapi` bleibt grün. |
| **A-V-20** | Der Grund eines Fehlschlags geht als **technischer Schlüssel** aus einer geschlossenen Aufzählung ins Protokoll — etwa `version_check_unreachable`, `version_check_redirect`, `version_check_too_large`, `version_check_timeout`, `version_check_malformed`, `version_check_no_release`. **Nie** ein Ausschnitt der Antwort, nie die Meldung des Wurfs, nie eine Adresse aus einer `location`-Kopfzeile. | `logger.lifecycle(level, message, reason)` mit festem `reason`; im Quelltext keine Zeichenkettenverkettung aus einem Wert der Antwort. Der dritte Parameter entsteht gerade in T-132 (`src/logger.ts:79`, im Arbeitsbaum, nicht in `d9555d0`); landet T-132 nicht, gilt dieselbe Auflage für den zweiten. |

**An T-139 (frontend-dev): die Hülle und die Oberfläche**

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-V-15** | Die installierte Fassung kommt aus `app.package_info().version` — den in die Binärdatei eingeprägten Angaben. **Nicht** aus einer Datei neben der ausführbaren Datei, nicht aus `tauri.conf.json` zur Laufzeit, nicht vom Sidecar. | Genau ein Rust-Aufruf; kein Lesen einer Datei für die Fassung; die Hülle liefert, der Dienst fragt nicht zurück. |
| **A-V-16** | `#[tauri::command] takt_open_release(version: String)` — **kein** Parameter, der Adresse, Schema, Wirt oder Pfad trägt. Prüft `version` gegen A-V-8, setzt sie in `https://github.com/KuyomieKurama/SuperTakt/releases/tag/v{version}` ein, ruft `app.shell().open(url, None)`. Bei Nichtbestehen: kein Aufruf, `Err` mit technischem Schlüssel **ohne** den abgelehnten Wert. | Signatur trägt genau einen `String`. `#[cfg(test)]` fährt die zehn Ausbruchsversuche aus 18.3 und erwartet jedes Mal `Err`. |
| **A-V-17** | `capabilities/default.json` bekommt **keinen** Eintrag `shell:*` — weder `shell:default` (das `allow-open` enthält) noch `shell:allow-open`, `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-kill`, `shell:allow-stdin-write`. Auch **kein** `plugins > shell > scope > open` in `tauri.conf.json`. | `grep -n "shell:" apps/desktop/src-tauri/capabilities/*.json` bleibt leer; heute ist es leer, die Liste trägt `core:default`, `core:window:allow-start-dragging`, `dialog:allow-open`. |
| **A-V-18** | Die CSP wird **nicht** geöffnet: `connect-src` bleibt `'self' ipc: http://ipc.localhost http://127.0.0.1:17843`. Kein `https://api.github.com`, kein `*`. Der Verweis in der Oberfläche ist ein **Knopf**, der `takt_open_release` ruft, **kein** `<a href>`: Ein Anker würde den Webview selbst zu github.com navigieren und den Benutzer aus seiner Anwendung tragen — es gibt keinen `on_navigation`-Wächter, der das abfinge. Die Adresse darf als **Text** danebenstehen; sie ist lokal gebaut. | Zeichengleicher Vergleich der `csp`-Zeichenkette; `grep` über `apps/web/src` findet kein `href` mit `github`. |

---

### 18.10 Befunde dieser Vorabbewertung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-136-1** | **muss** | **`tauri-plugin-shell` prüft auf dem Rust-Weg nichts.** `Shell::open` (`lib.rs:76-78`) → `open::open(None, …)`, und `open.rs:122-136` sagt selbst: *„when running directly from Rust code we don't need to validate the path"*. Der `OpenScope` wird nur bei Aufrufen aus JavaScript betreten. Damit ist die Formprüfung aus A-V-16 die **einzige** Kontrolle zwischen der Antwort von GitHub und `xdg-open`/`ShellExecuteW` — kein zweites Netz, keine Vorgabeprüfung, die im Zweifel greift. Gegenmittel: A-V-16 und A-V-17 zusammen, und die Ausbruchsliste als Prüffälle **neben** dem Befehl, nicht in einer fernen Testdatei. | frontend-dev (T-139), unit-tester (T-140) |
| **T-136-2** | Hinweis | **Die Zusage über die CSP beschreibt die Datei nicht genau.** `CLAUDE.md` (Abschnitt „Versionsprüfung") und E-064 Punkt 2 nennen drei Einträge — „sich selbst, `ipc:` und `http://127.0.0.1:17843`". `tauri.conf.json` trägt vier: `'self' ipc: http://ipc.localhost http://127.0.0.1:17843`. Der vierte ist die IPC-Herkunft unter Windows und völlig berechtigt; die Zusage ist trotzdem eine Abschrift, die nicht stimmt, und sie wird ab jetzt bei jeder Freigabe geprüft. Zwei Wege, und der zweite ist der aus E-063 Punkt 4/5: (a) den Eintrag in den Satz aufnehmen, oder (b) ein Wächter liest die `csp`-Zeichenkette aus `tauri.conf.json` und prüft, dass `connect-src` genau diese vier Marken trägt und **kein** `api.github.com`. (b) ist die Antwort, die nicht wieder veraltet. | Orchestrator (Text), frontend-dev (Wächter) |
| **T-136-3** | Hinweis | **E-065 sagt nicht ganz, woher die Zahl im Erzeugnis kommt.** „Führende Quelle ist `version` in `tauri.conf.json`" gilt für den Entwicklungsbau; dort steht `0.0.0`. Im ausgelieferten Erzeugnis kommt die Zahl aus `TAKT_RELEASE_VERSION` — also aus dem Git-Etikett —, und `apps/desktop/scripts/build-app.mjs:153-170` legt sie beim Bauen als Überlagerung über `tauri.conf.json`. Sicherheitsrelevant ist daran nur eines, und das steht als A-V-15: Die Zahl muss zur Laufzeit aus den **eingeprägten** Angaben kommen. Läse die Hülle sie aus einer Datei neben der ausführbaren Datei, könnte A-03 sie herabsetzen und Takt dauerhaft eine Aktualisierungsaufforderung zeigen lassen — auf einen Knopf, bei dem der Benutzer darauf eingestellt ist, eine unsignierte Datei zu holen und auszuführen. Das ist B-18.2 von der anderen Seite. | Orchestrator (E-065 präzisieren), frontend-dev (A-V-15) |
| **T-136-4** | Hinweis | **Die übersprungene Fassung ist Benutzereingabe** (VG-6). Sie steht als Einstellung im Bestand und ist damit für jeden schreibbar, der das Sitzungsgeheimnis hat. Auflage: Beim **Lesen** gegen die Form aus A-V-8 prüfen; ein ungültiger gespeicherter Wert heißt „nichts übersprungen", führt zu keinem Wurf und geht in **keine** Adresse. Schaden im schlimmsten Fall: ein unterdrückter Hinweis. Angenommen, aber benannt. | domain-dev (T-138) |
| **T-136-5** | Hinweis | **Die Anfragebegrenzung von GitHub ist geteilt.** Nicht angemeldete Aufrufer haben 60 Anfragen je Stunde **und Quelladresse**. In einem Haus hinter einer Adresse teilen sich alle Takt-Installationen dieses Kontingent. Folge: `403`, stiller Fehlschlag nach A-18.11 — das Verhalten ist richtig, die Zuverlässigkeit sinkt mit der Verbreitung. Ein weiteres Argument für A-V-11 und gegen jeden Wiederholungsversuch. Kein Gegenmittel nötig, aber es gehört ins Entwicklerhandbuch. | documenter (T-141) |
| **T-136-6** | Hinweis | **Semgrep Guardian zum achten Mal nicht erreichbar, 42Crunch zum siebten Mal ohne Werkzeug.** Das Tor aus Abschnitt 8 ist an zwei von vier Stellen weiterhin nicht einlösbar. Der lokale Semgrep-Lauf deckt SAST ab; Lieferkette und OpenAPI-Bewertung bleiben ungemessen — und die Lieferkette ist bei einem Vorhaben, das erstmals nach außen spricht, die Lücke, die man am wenigsten möchte. Beschaffungsentscheidung. | Auftraggeber, Orchestrator |

---

### 18.11 Restrisiko dieser Grenze

Vier Punkte bleiben, und keiner ist durch eine Auflage zu schließen.

1. **Die Anfrage ist das Lebenszeichen.** Auch mit A-V-13 erfährt GitHub Quelladresse, Zeitpunkt
   und Wiederholung. A-18.12 („überträgt nichts über den Benutzer, den Bestand oder die Nutzung")
   ist damit über den Inhalt einlösbar und über die Existenz der Anfrage nicht. Das ist keine
   Schwäche der Umsetzung, sondern der Preis von A-18.2, und es gehört als Satz ins
   Benutzerhandbuch — die Zusage „alles bleibt auf diesem Rechner" braucht ab jetzt einen
   Nachsatz.
2. **Ein TLS-abschließender Unternehmens-Proxy sieht alles.** Wo ein eigenes Wurzelzertifikat im
   Systemspeicher liegt, ist die Verbindung für den Betreiber offen. Takt kann das weder
   verhindern noch bemerken, ohne selbst eine Zertifikatsbindung mitzubringen — und die wäre eine
   eigene, größere Entscheidung.
3. **Der Bestand selbst ist die Quelle der Wahrheit.** Wer das GitHub-Konto übernimmt, kann eine
   Fassung veröffentlichen, auf die Takt zeigt. Die Erzeugnisse sind **unsigniert**; die einzige
   Kontrolle sind die Prüfsummen in der Fassungsbeschreibung, und die stammen aus derselben
   Quelle. Alle Auflagen dieses Abschnitts schützen den Weg, nicht das Ziel. Eine Signatur wäre
   das Gegenmittel und ist eine Beschaffungsentscheidung (siehe `release.yml`, „Keine Signatur").
4. **Es gibt keinen Schalter, der die Prüfung abstellt.** A-18 verlangt keinen, E-064 verbietet
   nur ein „nie wieder fragen" für den **Hinweis**. Ein Benutzer ohne Internet merkt nichts (der
   Fehlschlag ist still); ein Benutzer, der aus Datenschutzgründen keine ausgehende Verbindung
   möchte, hat keine Möglichkeit. Das ist eine Produktfrage und keine Sicherheitsentscheidung, die
   dieser Abschnitt trifft — siehe offene Frage unten.

### 18.12 Urteil dieser Vorabbewertung

**Freigegeben für den Bau — mit den zwanzig Auflagen aus 18.9 als Bedingung.**

Es gibt nichts abzunehmen: T-138 und T-139 sind nicht geschrieben. Das Urteil bezieht sich auf die
**Bauform** aus E-064, und sie trägt. Die entscheidende Wahl — der Öffnen-Befehl nimmt keine
Adresse entgegen — ist nach der Messung an `tauri-plugin-shell 2.3.6` nicht bloß die vorsichtigere
Variante, sondern die einzige, die überhaupt eine Kontrolle hat: Der Prüfausdruck des Plugins wird
auf dem Rust-Weg nie betreten (T-136-1), und der Vorgabesatz `shell:default` ließe im
JavaScript-Weg jede `https:`-Adresse durch. Wer hier die naheliegende Form gebaut hätte, hätte eine
offene Weiterleitung in den Browser des Benutzers gebaut und es an keiner Stelle gemerkt.

Zwei Auflagen lauten anders, als man sie ohne Messung geschrieben hätte, und beide sind der
Ertrag dieser Vorabbewertung: **A-V-6** (die Obergrenze zählt entpackte Bytes — 50 989 auf der
Leitung ergaben 52 428 800 im Speicher, Faktor 1 028; eine Prüfung von `content-length` ist keine
Grenze) und **A-V-10** (kein Netzaufruf in einem Anfragebehandler — sonst taktet ein beliebiger
lokaler Prozess das Lebenszeichen aus R-19 Punkt 3).

Der Bestand passt zu diesem Entwurf, und zwar an drei Stellen ohne Zutun: Die CSP schließt den
Weg über die Oberfläche, `requiredCredentialForPath` schließt die neue Route, bevor sie existiert,
und `proof:route-policy` Abschnitt 4 misst das von selbst. Ein Befund der Stufe „muss"
(T-136-1) und fünf Hinweise; keiner davon blockiert den Bau, alle sind vor der Abnahme von T-138
und T-139 zu schließen.

Das Tor aus Abschnitt 8 bleibt an zwei Stellen uneinlösbar (T-136-6). Semgrep, lokal gefahren:
neun Befunde, alle in bekannten Falschmeldungsklassen, **kein Befund hoher Schwere**.

**Wiedervorlage:** nach dem Rücklauf von T-138 und T-139. Dann wird gegen Code gemessen, was hier
gegen einen Entwurf gefordert ist — Auflage für Auflage, mit den Zahlen aus 18.9.

---

## 19. Wiedervorlage T-145 (2026-09-05) — die zwanzig Auflagen gegen den Code

Abschnitt 18 hat gegen einen **Entwurf** freigegeben: T-138 und T-139 waren nicht geschrieben,
die zwanzig Auflagen aus 18.9 waren die Bedingung. Jetzt liegt der Code vor, und der Stand ist
als `v0.1.0` ausgeliefert. Diese Wiedervorlage kommt damit **nach** der Auslieferung; was hier
gefunden wird, geht in `0.1.1`.

Prüfumfang: `git diff 0635aea..HEAD` auf dem Zweig `versionspruefung-gegen-github`, 99 Dateien.
Gemessen wurde gegen den Baum, nicht gegen die Berichte.

### 19.0 Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| Semgrep, lokal (`p/nodejsscan`, `p/typescript`) über `apps/*/src`, `apps/desktop/src-tauri/src`, `packages` | 188 Regeln, 231 Dateien, **10 Befunde**, alle in den seit T-023 bekannten Klassen: 3× `regex_dos` an Ausdrücken über *eigene* Konstanten (`origin-policy.ts:175,182`, `migration-runner.ts:305`), 5× `node_timing_attack` an `=== null`-Vergleichen (vier React-Kontexte, dazu `outlook-addin/src/api/client.ts:167` — die fünfte ist neu **im Prüfumfang**, nicht im Code: die Datei steht nicht im Diff), 1× `node_secret` an `redactSecrets` (`token.ts:110` — die Funktion heißt so, sie enthält keins), 1× `node_username` in `showcase/ShellStateSection.tsx` (Anschauungsdaten). **Kein Befund hoher Schwere.** Der neue Code der Versionsprüfung erzeugt **keinen einzigen** Befund; insbesondere kein `regex_dos` an `VERSION_SHAPE` — der Ausdruck ist linear und in jeder Komponente in der Länge gebunden. |
| Semgrep Guardian (SAST, Geheimnisse, Lieferkette) | **Nicht erreichbar — „Not logged into Semgrep Guardian".** Zum **neunten** Mal in Folge. Beschaffungsentscheidung, kein Befund dieses Zweigs. |
| 42Crunch Audit gegen `apps/local-api/openapi/takt-local-api.yaml` | **Nicht gelaufen.** Kein `42c-ci-cli`, kein Token, kein `~/.42crunch`. Achtes Mal. Ersatz: `proof:openapi`, 110 Prüfungen, grün. |
| `pnpm proof:release-safety` | 23 bestanden, 0 fehlgeschlagen — davon 6 **Gegenproben**, in denen ein eingesetzter Verstoß den Lauf rot machen muss. |
| `pnpm proof:shell-surface` | 4 Prüfungen und 10 Gegenproben bestanden. |
| `pnpm proof:route-policy` | 40 bestanden; **61 Routen**, keine davon nimmt das Add-in-Token an. |
| `pnpm proof:openapi` | 110 bestanden. |
| `pnpm proof:access` | 105 bestanden — **und dabei eine Verbindung nach `api.github.com` aufgebaut**, siehe Befund T-145-1. |
| `vitest` über `apps/local-api/test/version`, `apps/local-api/test/routes/version.test.ts`, `apps/local-api/test/startup.test.ts`, `packages/domain/test/version.test.ts` | 124 Prüffälle, alle grün. |
| `cargo test` in `apps/desktop/src-tauri` | 31 Prüffälle, alle grün — **von Hand gefahren**. Kein Ablauf ruft ihn, siehe Befund T-145-2. |
| Eigene Messungen gegen Node 22.23.2, `url 2.5.8` und die echte Antwort von `releases/latest` | Sieben Messungen, alle unten mit Zahl belegt. Zwei davon ziehen eine Zahl aus 18.9 gerade. |
| Repository-Hygiene über die 99 geänderten Dateien | Keine Zugangsdaten, keine Kundendaten. Die einzigen Treffer der Mustersuche sind `TCK-4711` (die erfundene Call-Nummer dieses Vorhabens), `a.beispiel@example.org` und `1.2.3@evil.example` — letzteres ein Ausbruchsversuch in `release.rs`. `example.org` und `example` sind nach RFC 2606 reserviert. |

### 19.1 Die zwanzig Auflagen, einzeln

**Legende.** *erfüllt* — die Sache **und** die Messung stimmen. *abweichend erfüllt* — die Sache
ist gewahrt, die Messung in 18.9 beschreibt sie falsch oder sie ist enger ausgefallen als
gefordert. *nicht erfüllt* — die Sache fehlt.

| ID | Urteil | Woran gemessen |
|---|---|---|
| **A-V-1** | **abweichend erfüllt** | Die Adresse steht als Konstante in `apps/local-api/src/version/source.ts:91` und sonst nirgends; `proof:release-safety` Abschnitt 2 misst das mit einer Gegenprobe. **Die Messung aus 18.9 stimmt nicht mehr:** `grep -rn "api\.github\.com" apps/local-api/src` liefert **zwei** Zeilen — 91 (die Konstante) und 83 (ein Kommentar, der begründet, warum es `api.github.com` und nicht `github.com` ist). Und `grep -rn "github\.com"` über den ganzen Produktivcode liefert **sechs** statt der in 18.9 als Ausgangspunkt genannten null: drei Zeichenketten (`source.ts:91`, `web/src/lib/releasePage.ts:43`, `src-tauri/src/release.rs:55`), eine Prüffallerwartung (`release.rs:260`) und zwei Kommentare. Alle sechs sind erklärt und alle sechs werden gemessen. Eine Zählung über rohen Text ist an dieser Stelle nicht mehr die richtige Messung; die richtige ist `proof:release-safety`, das Kommentare vorher wegschneidet (`stripComments`, mit fünf eigenen Gegenproben). **Auflage neu formuliert als A-V-1′ in 19.5.** |
| **A-V-2** | erfüllt | `source.ts:237-248`: `method: 'GET'`, kein `body`, kein Abfrageparameter, kein `authorization`, kein `cookie`. Gegen einen Prüfserver gemessen (19.2, Messung 3): `GET /`, sonst nichts. |
| **A-V-3** | erfüllt | `redirect: 'error'` (`source.ts:246`). Zwei Prüffälle in `source.test.ts` fahren 302 und 301 gegen einen Prüfserver und messen, daß am Ziel **nichts** ankommt. |
| **A-V-4** | **abweichend erfüllt** | Kein `dispatcher`, kein `Agent`, kein `ProxyAgent`, kein `NODE_USE_ENV_PROXY`, kein `NODE_TLS_REJECT_UNAUTHORIZED`, kein `rejectUnauthorized` — als **Code**. Die Messung „`grep` findet keine dieser Zeichenketten" trifft nicht mehr: `dispatcher`, `ProxyAgent` und `undici` stehen je einmal in `source.ts` (Zeilen 66, 67, 219) — in dem Kommentar, der erklärt, daß sie dort nicht stehen. Auch das ist ein Fall für `stripComments`. **A-V-4′ in 19.5.** |
| **A-V-5** | erfüllt | `AbortSignal.timeout(5_000)`, über `AbortSignal.any` mit dem Abbruchsignal des Dienstes verbunden und an `fetch` übergeben. **Gemessen** (19.2, Messung 4): Ein Prüfserver, der Kopfzeilen sendet und dann `{"a":` schreibt und schweigt, endet nach **5 007 ms** mit `timeout` — die Frist deckt das Lesen des Rumpfes mit ab. Verlangt waren ≤ 5 500 ms. |
| **A-V-6** | **abweichend erfüllt** | Der Strom wird gelesen und dabei gezählt (`readBounded`, `source.ts:280-347`); kein `response.json()`, kein `.text()`, kein `.arrayBuffer()`, kein Blick auf `content-length`. Die gzip-Bombe aus 18.2 (50 989 Bytes auf der Leitung → 52 428 800 entpackt) ergibt `too_large` in 17 ms, ohne `JSON.parse`. **Die Zahl in der Messung ist trotzdem falsch:** „Abbruch vor 65 537 gelesenen Bytes". Gezählt wird **nach** dem Anfügen einer Leseeinheit, und die Leseeinheit ist bei Node 22 **16 384 Bytes**. Gemessen wurden **81 920 gelesene Bytes**, also 65 536 + 16 384. Die Sache ist gewahrt (die Obergrenze ist eine Obergrenze, 52 MB landen nie im Speicher), die Zusage muß die Leseeinheit nennen. Dazu die zweite Hälfte dieser Auflage — „die echte Antwortgröße einmal messen" — in 19.2, Messung 1. **A-V-6′ in 19.5.** |
| **A-V-7** | erfüllt | Ein Feldzugriff, hinter `Object.hasOwn`, über eine Konstante `TAG_FIELD`. `proof:release-safety` Abschnitt 2 zählt `'tag_name'` im ganzen Baum: genau eins, und `.tag_name` als Punktzugriff ist **überall** verboten, auch an der erlaubten Stelle. `html_url`, `browser_download_url`, `upload_url`, `assets_url`, `zipball_url`, `tarball_url`, `body_html` sind als Zeichenketten im Code verboten. Mit Gegenprobe. Ein Prüffall mißt, daß bei fehlendem `tag_name` **nicht** auf `name` ausgewichen wird. |
| **A-V-8** | erfüllt | `VERSION_SHAPE` in `packages/domain/src/version.ts:91`, zeichengleich mit der Form aus 18.9, beidseitig verankert, ohne `g`. `checkVersion` nimmt `unknown` und wirft nicht. Die zehn geforderten Fälle stehen als Prüffälle; `null`, `42`, `{}`, `[]`, `true`, fehlend, `""`, 60 000 Zeichen, `../../evil`, `1.2.3?x=1` ergeben je einen stillen Fehlschlag. |
| **A-V-9** | erfüllt | `comparePrecedence` zerlegt in drei Zahlen und vergleicht numerisch; `0.10.0 > 0.9.0` ist ein Prüffall. Eine Vorabkennung gilt als kleiner als dieselbe Fassung ohne. Kein `localeCompare`, kein `<` auf Zeichenketten. Jede Komponente ≤ 999 999 999, in der Form gebunden. |
| **A-V-10** | erfüllt | `routes/version.ts:81` gibt `current()` heraus und ruft nichts. Der Prüffall „`current()` löst niemals eine Anfrage aus, auch nicht nach 100 Aufrufen" zählt am Port **null** ausgehende Anfragen. Die Entscheidung dazu ist E-069 und sie ist **nach** 18.9 gefallen — sie ist der Grund für die Abweichung bei A-V-14. |
| **A-V-11** | erfüllt | Eine Anfrage je Start (nach `START_DELAY_MS`), danach `intervalMs` = 24 h, harter Boden `minIntervalMs` = 60 min, geprüft an einer gestellten Uhr. Nach einem Fehlschlag wird **nicht** neu geplant — ein eigener Prüffall mißt, daß auch bei einer sehr kurzen „Regelfrist" die Zahl bei eins bleibt. |
| **A-V-12** | **abweichend erfüllt** | Der Zeitgeber ist `unref()`t (`checker.ts:160`), `stop()` löst einen `AbortController` aus, und `main.ts:373` ruft `stop()` als **ersten** Schritt des Anhaltens, vor `taskpane.close()` und `database.close()`. Prüffälle messen `stop()` während einer ausstehenden Antwort und `start()` gefolgt von sofortigem `stop()`. **Die Messung aus 18.9 ist es nicht:** „`proof:access`: nach `shutdown()` endet der Prozess innerhalb der Frist, **auch während** eine ausgehende Anfrage läuft" — `proof:access` mißt das nicht. Es mißt in Abschnitt 0e den umgekehrten Fall (ein fremder Prozeß hält eine **eingehende** Verbindung), und der Fall „ausgehende Anfrage läuft" tritt dort zufällig ein oder nicht, je nachdem, wie lange ein einzelner Dienst lebt. Was trägt, ist die harte Abschaltfrist aus T-126: Der Prozeß endet auch dann, wenn `stop()` nichts bewirkte. **A-V-12′ in 19.5.** |
| **A-V-13** | erfüllt | **Gegen einen Prüfserver gemessen** (19.2, Messung 3), nicht gegen den Quelltext. Hinaus gehen acht Kopfzeilen: die drei gesetzten (`accept: application/vnd.github+json`, `x-github-api-version: 2022-11-28`, `user-agent: Takt`) und fünf, die Node selbst anhängt (`accept-encoding: gzip, deflate`, `accept-language: *`, `connection: keep-alive`, `host`, `sec-fetch-mode: cors`). Keine davon trägt Benutzer, Rechnernamen, Sprache oder Fassung. Die Gegenprobe aus 18.9 hält: Die installierte Fassung kommt in keiner Kopfzeile und in keinem Teil der Adresse vor — der Dienst kennt sie überhaupt nicht (E-069). |
| **A-V-14** | **abweichend erfüllt, enger als gefordert** | Die Route gibt **zwei** Felder heraus: `state` (`unknown` \| `known`) und `latestVersion` (`string \| null`). Gefordert waren drei; das dritte war die installierte Fassung, und die kennt der Dienst seit E-069 nicht mehr. Der **Kern** der Auflage — „kein Text aus der Antwort, kein `html_url`, keine Fassungsbeschreibung" — ist gewahrt und wird von `proof:release-safety` mit einer Gegenprobe gemessen. Die Auflage nannte eine Zahl, wo sie eine Verbotsliste hätte nennen müssen: Eine Zahl wird bei jeder Entwurfsänderung falsch, eine Verbotsliste nicht. **A-V-14′ in 19.5.** |
| **A-V-15** | erfüllt | `release.rs:157-159`: `app.package_info().version.to_string()`, ein Aufruf, kein Zweig, keine Datei. `proof:shell-surface` mißt, daß die Oberfläche die Hülle ausschließlich über `@takt/desktop/shell` erreicht — ein eigenes `invoke` in `apps/web/src` macht den Lauf rot (Gegenprobe vorhanden). |
| **A-V-16** | **abweichend erfüllt** | Die Signatur trägt genau einen `String` (`release.rs:173`), prüft ihn gegen die Form aus A-V-8, setzt ihn in eine hier fest stehende Adresse ein und gibt bei Nichtbestehen `Err("version_rejected")` **ohne** den abgewiesenen Wert zurück. Die zehn Ausbruchsversuche aus 18.3 stehen wörtlich als `AUSBRUCHSVERSUCHE` **neben** dem Befehl, dazu fünf weitere aus T-140. Alle 31 Rust-Prüffälle sind grün. **Aber sie laufen nirgends von selbst:** `cargo test` kommt in `package.json`, in `apps/desktop/package.json` und in `.github/workflows/release.yml` **kein einziges Mal** vor. Die Messung dieser Auflage ist damit vorhanden und nicht in Kraft — Befund T-145-2. |
| **A-V-17** | erfüllt | `capabilities/default.json` trägt `core:default`, `core:window:allow-start-dragging`, `dialog:allow-open` und keine `shell:`-Zeile; `tauri.conf.json` hat kein `plugins > shell > scope > open`. `proof:shell-surface` mißt beides und wird von fünf eingesetzten Verletzungen rot — darunter `shell:default` und eine **leere** Fähigkeitenliste (ein Wächter, der bei leerer Eingabe grün wäre, misst nichts). |
| **A-V-18** | erfüllt | `connect-src` trägt zeichengleich `'self' ipc: http://ipc.localhost http://127.0.0.1:17843`; `proof:shell-surface` hält die vier Marken gegen die Datei und wird von `https://api.github.com` **und** von einer gestrichenen Marke rot. `grep` über `apps/web/src` findet kein `href` mit `github`; `UpdateDialog.tsx` benutzt einen Knopf. Zusätzlich, über die Auflage hinaus: Prüfung 4 des Laufs hält die **angezeigte** Adresse zeichengleich gegen die **geöffnete**. Damit ist T-136-2 geschlossen, und zwar auf dem Weg (b) — gemessen statt nachgezogen. |
| **A-V-19** | erfüllt | Die Route hängt an derselben Hono-Anwendung, steht in `openapi/takt-local-api.yaml`, nicht in `SHARED_PATHS` und nicht unter `/addin`. `proof:route-policy` fährt jetzt **61** Routen mit dem Add-in-Token an; keine nimmt es an. `GET /addin/context` hat kein Fassungsfeld. |
| **A-V-20** | erfüllt | Acht Schlüssel aus einem geschlossenen Vorrat (`ReleaseLookupFailure`), übersetzt in `describeVersionCheckFailure` — eine reine Funktion, Schlüssel herein, Satz und Grund heraus. Keine Zeichenkettenverkettung aus einem Wert der Antwort; der einzige eingesetzte Wert ist ein Statuscode, und der ist auf ganzzahlig 100–599 geprüft. `classifyNetworkError` liest die Meldung eines Wurfs **nicht** — es fragt nach `name` und danach, **ob** das Wort `redirect` in `cause.message` vorkommt, und übernimmt daraus nichts. Der dritte Parameter von `logger.lifecycle` ist aus T-132 tatsächlich gekommen. |

**Zwischenstand: keine Auflage nicht erfüllt.** Sechs sind *abweichend erfüllt*, und fünf davon
sind Fehler in der **Messung**, nicht im Code — 18.9 hat an fünf Stellen eine Zahl oder eine
Zählung genannt, wo eine Eigenschaft gemeint war. Das ist derselbe Fehler, den T-136-2 an einer
Zusage über die CSP gefunden hat, nur diesmal im eigenen Text. Die sechste (A-V-16) ist keine
Textfrage: dort läuft eine vorhandene Messung nicht.

### 19.2 Die sieben Messungen

**Messung 1 — die echte Antwort von `releases/latest`, jetzt mit `v0.1.0`.** T-138 hat gegen
einen Bestand ohne Veröffentlichung gemessen: 404 mit 130 Bytes. Seit gestern gibt es eine, und
die Zahl sieht anders aus.

| Größe | Wert |
|---|---|
| Status | 200 |
| `content-encoding` | `gzip` |
| Auf der Leitung (`content-length`) | **4 126 Bytes** |
| **Entpackt** | **21 683 Bytes** |
| `tag_name` | `v0.1.0` |
| Felder im Rumpf | 21 |
| davon `assets` | **14 996 Bytes** für 9 Anhänge — **1 666 Bytes je Anhang** |
| davon `body` (die Fassungsbeschreibung) | 4 734 Bytes |
| davon `author` | 1 102 Bytes |
| Rest | 851 Bytes |

Die Obergrenze von 65 536 Bytes ist damit **kein** Vierfaches der echten Antwort, wie der
Kommentar an `VERSION_CHECK_MAX_BYTES` sagt („rund 15 KiB … das Vierfache"), sondern das
**3,02-fache**. Die Zahl selbst bleibt richtig; ihre Begründung im Quelltext ist um ein Drittel
zu großzügig und gehört berichtigt.

Wichtiger ist, **woran** die Antwort wächst: an den Anhängen, mit 1 666 Bytes je Stück. Bei
gleichbleibender Fassungsbeschreibung ist die Grenze bei rund **35 Anhängen** erreicht
((65 536 − 851 − 1 102 − 4 734) / 1 666). Heute sind es neun: vier Erzeugnisse, drei
Lizenzdateien, `LICENSE.txt`, `SHA256SUMS`. Eine Auslieferung, die macOS Intel, Linux arm64,
eine `.msi` neben der `.exe`, eine `.rpm` und je eine Signaturdatei dazunimmt, liegt bei zwanzig
bis fünfundzwanzig. Der Abstand ist real, aber er ist kein Faktor zehn — und der Ausgang beim
Überschreiten ist der **stille** Fehlschlag aus A-18.11: Die Versionsprüfung hörte auf zu
arbeiten, und niemand außer einer Protokollzeile `version_check_too_large` sagte es. Das ist
Befund T-145-3.

**Messung 2 — die gzip-Bombe gegen den echten Leser.** 50 989 Bytes auf der Leitung, 52 428 800
entpackt. Ergebnis `too_large` nach 17 ms, kein `JSON.parse`. **Tatsächlich gelesen: 81 920
Bytes** — die Grenze plus genau eine Leseeinheit von 16 384. Die Sache hält, die Zahl in A-V-6
hält nicht.

**Messung 3 — was wirklich hinausgeht.** Der echte `createGithubReleaseSource`, gelenkt auf
einen Prüfserver, der jede Kopfzeile mitschreibt. Methode `GET`, Pfad `/`, acht Kopfzeilen
(oben unter A-V-13 aufgezählt). Keine Kennung, keine Sprache außer `*`, keine Fassung.

**Messung 4 — die Frist deckt den Rumpf.** Antwort beginnt, endet nie: `timeout` nach 5 007 ms.

**Messung 5 — die ganze Kette gegen die echte Quelle.** Ein Dienst wurde gestartet wie die Hülle
ihn startet (Geheimnis und Benutzername über `stdin`), und die Route wurde zweimal gefragt:

```text
nach  4 s: 200 {"data":{"state":"unknown","latestVersion":null}}
nach 14 s: 200 {"data":{"state":"known","latestVersion":"0.1.0"}}
```

Die Kette trägt: feste Adresse, echte Antwort, geprüfte Fassungsbezeichnung ohne `v`, zwei
Felder heraus, keine Protokollzeile. Und sie zeigt zugleich Befund T-145-1, siehe unten.

**Messung 6 — `proof:access` spricht mit GitHub.** Während `pnpm run proof:access` lief, wurde
`ss -tnp` im Viertelsekundentakt abgefragt. Ergebnis:

```text
ESTAB 192.168.11.45:43256  140.82.121.6:443  users:(("node",pid=1385648,fd=27))
```

`140.82.121.6` ist `api.github.com` (Rückwärtsauflösung: `lb-140-82-121-6-fra.github.com`).
Befund T-145-1.

**Messung 7 — `cargo test`.** 31 Prüffälle in `apps/desktop/src-tauri`, alle grün, Laufzeit nach
dem Übersetzen 0,00 s. Es gibt keinen Ablauf, der sie ruft. Befund T-145-2.

### 19.3 Die beiden Zeilen, um die T-132 gebeten hat

**`sqlite` und `code` sind neue Angaben in der Ausgabe des Dienstes.** Bewertet als das, was sie
sind: zwei zusätzliche Felder in einer Zeile auf `stderr`, die die Hülle mitliest.

* Woher sie kommen, ist beschränkt und nicht beliebig. `errorCodeOf`
  (`packages/storage/src/migration.ts:166`) nimmt `error.code` nur an, wenn es
  `^[A-Z][A-Z0-9_]{0,31}$` erfüllt — also ein Laufzeitschlüssel wie `ENOENT` oder `EACCES` und
  höchstens 32 Zeichen. `sqliteResultCodeOf` nimmt `error.errcode` nur als ganze Zahl. `pair()`
  in `startup.ts:88` schreibt eine Zahl nur, wenn sie eine nicht negative sichere Ganzzahl ist,
  und einen Text nur kleingeschrieben.
* Ein Pfad kommt dort nicht durch: Er trägt Trennzeichen und Kleinbuchstaben und fällt an
  `^[A-Z]`. Ein Windows-Benutzername kommt nicht durch: Er steht in keiner `.code`-Eigenschaft
  eines Wurfs aus `node:sqlite` oder `node:fs`.
* Was sie **preisgeben**, ist der Grund eines Startabbruchs — 5 belegt, 11 beschädigt, 26 keine
  Datenbank, 10 Ein-/Ausgabefehler. Das ist eine Aussage über den Zustand des Rechners, auf dem
  der Leser ohnehin sitzt, und sie ist genau die Angabe, deren Fehlen T-132 ausgelöst hat.

**Urteil: unbedenklich.** Beide Felder erweitern die Ausgabe um Werte aus geschlossenen
beziehungsweise formgebundenen Vorräten und um nichts sonst.

**Der Riegel im Protokollierer ist eine Gestalt-, keine Inhaltsprüfung — und das ist richtig so,
solange man weiß, was er nicht kann.** `REASON_SHAPE` (`logger.ts:63`) verlangt einen Schlüssel
aus höchstens 48 Kleinbuchstaben, gefolgt von höchstens acht Paaren `name=wert` mit höchstens 32
Zeichen aus `[a-z0-9_]` je Wert. Gemessen, was durchkommt und was nicht:

| Eingabe | Riegel |
|---|---|
| `version_check_timeout`, `version_check_status code=403`, `port_in_use port=17843` | durch — die vorgesehenen Fälle |
| `C:\Users\Kerem` | abgewiesen (Rückstriche, Großbuchstaben) |
| `/home/kerem/.local/share/takt/takt.sqlite3` | abgewiesen (Schrägstriche, Punkte) |
| `x user=kerem` | **durch** |
| `x tag=kunde_mueller` | **durch** |
| `x n=tck4711` | **durch** |
| ein neunter Wert im selben Grund | abgewiesen |
| ein Wert mit 33 Zeichen | abgewiesen |

Die größte Zeile, die durchkommt, ist 336 Zeichen lang, davon **256 Zeichen Wertinhalt**. Damit
ist die ehrliche Formulierung: Der Riegel begrenzt **Gestalt und Menge**, nicht **Herkunft**. Ein
kleingeschriebener Wert aus dem Bestand — ein Tag-Name ohne Großbuchstaben, ein Benutzername in
Kleinschreibung, eine Call-Nummer ohne Bindestrich — käme durch, wenn eine künftige Aufrufstelle
ihn übergäbe. Was ihn davon abhält, ist heute nicht der Riegel, sondern die Tatsache, daß alle
Aufrufstellen Konstanten übergeben.

Ein Sonderfall ist geschlossen: Ein Sitzungsgeheimnis paßt zwar der Länge nach in den
Schlüsselteil (48 Zeichen), aber `redactSecrets` läuft **danach** über die ganze Zeile und
ersetzt `takt_[A-Za-z0-9_-]{43}` unabhängig von der Schreibweise. Zwei Schichten, und die zweite
trägt genau den Fall, den die erste nicht sieht.

**Auflage daraus (A-V-21 in 19.5):** Der dritte Parameter von `lifecycle` soll kein `string`
sein, sondern eine geschlossene Vereinigung — dann trüge der Übersetzer, was heute der Riegel
auffängt, und der Riegel bliebe als Boden darunter.

### 19.4 Befunde dieser Wiedervorlage

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-145-1** | **muss** | **Die Nachweisläufe sprechen mit GitHub.** `main.ts` sagt im Kommentar zu `versionCheck.start()`: „Damit stellt kein Nachweispfad, kein Prüffall und keine Messung eine Verbindung nach außen her — nur der echte Prozess tut das." Gemessen ist das Gegenteil: `proof:access` startet den echten Einstiegspunkt `src/index.ts` mit `spawn`, der Lauf dauert 28 s, mehrere Dienste leben über die 10 s Startverzögerung hinaus — und während des Laufs stand eine ESTAB-Verbindung nach `140.82.121.6:443` (= `api.github.com`) offen. Folgen: (a) Jeder `pnpm check`, auch der im Auslieferungstor auf `ubuntu-24.04`, gibt das Lebenszeichen aus R-19 Punkt 3 ab — mit der Quelladresse des Läufers oder des Entwicklers. (b) Die 60 Anfragen je Stunde und Quelladresse (T-136-5) werden von der Prüfinfrastruktur mitverbraucht. (c) Der Satz im Quelltext ist eine Zusage, die nicht stimmt — dieselbe Klasse wie T-136-2. Gegenmittel: Der Aufruf von `versionCheck.start()` gehört hinter eine Bedingung, die im Prüfbetrieb nicht zutrifft, **und** der Nachweis muß messen, daß im Prüfbetrieb keine ausgehende Verbindung entsteht. Ein Kommentar allein ist es nach E-063 Punkt 5 nicht. **Das Muster liegt bereits vor:** T-142 hat für den End-zu-Ende-Lauf einen zweiten, nie ausgelieferten Einstiegspunkt gebaut (`tests/e2e/support/version-check-entry.ts`), der `compose({ releaseSource })` mit einer Attrappe füttert und dabei Frist, `redirect: 'error'`, Lesestrom und Auswertung unverändert aus `version/source.ts` fährt. `proof:access` startet dagegen unverändert `apps/local-api/src/index.ts` — also den echten Einstiegspunkt ohne Naht. Dieselbe Naht dort zu benutzen ist der kürzeste Weg. | domain-dev, Orchestrator |
| **T-145-2** | **muss** | **`cargo test` läuft nirgends.** Die 31 Rust-Prüffälle — darunter die fünfzehn Ausbruchsversuche gegen `is_release_version`, die Längengrenzen, die `v`/`V`-Fälle und `release_url_ist_wirklich_none_und_keine_teiladresse` — sind die **einzige** Kontrolle zwischen einer Fassungsbezeichnung und `xdg-open`/`ShellExecuteW` (T-136-1). Sie werden von keinem Ablauf gerufen: `cargo test` steht nicht in `package.json`, nicht in `apps/desktop/package.json` und nicht in `.github/workflows/release.yml`. Von Hand gefahren sind sie grün und brauchen nach dem Übersetzen 0,00 s. A-V-16 ist damit formal erfüllt und faktisch ungesichert — und mit den Anhängen aus Abschnitt 20 wächst genau dieses Modul um die **gesamte** Adress- und Pfadprüfung. Gegenmittel: `cargo test` in `pnpm check` einhängen, vor `pnpm build`. | Orchestrator, frontend-dev |
| **T-145-3** | Hinweis | **Die 64-KiB-Grenze hat drei Fach Luft, nicht vier — und ihr Ausgang ist still.** Gemessen: 21 683 Bytes entpackt, davon 14 996 in `assets` bei 1 666 Bytes je Anhang. Rechnerisch ist die Grenze bei rund 35 Anhängen erreicht; heute sind es neun. Wird sie überschritten, ist der Ausgang `too_large`, also ein stiller Fehlschlag ohne Wiederholung im selben Lauf — die Versionsprüfung stellte den Betrieb ein, und die einzige Spur wäre eine Protokollzeile. Zwei Gegenmittel, und sie schließen sich nicht aus: (a) die Grenze auf 262 144 Bytes anheben (immer noch eine Grenze, immer noch weit unter jeder Bombe) und (b) im Auslieferungsablauf messen, daß die entpackte Antwort von `releases/latest` unter der Grenze bleibt — dort, wo die Anhänge entstehen. Dazu die Berichtigung des Kommentars an `VERSION_CHECK_MAX_BYTES` („rund 15 KiB … das Vierfache" → 21,2 KiB, Faktor 3,02). | domain-dev |
| **T-145-4** | Hinweis | **Fünf der zwanzig Auflagen aus 18.9 nennen eine Zählung, wo sie eine Eigenschaft meinen** (A-V-1, A-V-4, A-V-6, A-V-12, A-V-14). Eine Zählung über rohen Text zählt Kommentare mit; eine Zählung über Felder wird von der nächsten Entwurfsentscheidung falsch (E-069 hat A-V-14 überholt). Die Neufassungen stehen in 19.5 und sind ab sofort die geltende Formulierung. Das ist derselbe Befund wie T-136-2, nur gegen den eigenen Text. | security-checker (erledigt in 19.5) |
| **T-145-5** | Hinweis | **`logger.lifecycle` nimmt `string`.** Der Riegel `REASON_SHAPE` begrenzt Gestalt und Menge (höchstens 256 Zeichen Wertinhalt), nicht Herkunft; ein kleingeschriebener Wert aus dem Bestand käme durch. Heute übergeben alle Aufrufstellen Konstanten. Gegenmittel: eine geschlossene Vereinigung als Typ des dritten Parameters, der Riegel bleibt als Boden. Siehe A-V-21. | domain-dev |
| **T-145-6** | Hinweis | **Semgrep Guardian zum neunten Mal nicht erreichbar, 42Crunch zum achten Mal ohne Werkzeug.** Das Tor aus Abschnitt 8 ist an zwei von vier Stellen weiterhin nicht einlösbar. Der lokale Semgrep-Lauf deckt SAST ab; **Lieferkette** bleibt ungemessen — und der Baum hat mit `v0.1.0` zum ersten Mal etwas ausgeliefert. Beschaffungsentscheidung, unverändert seit T-023. | Auftraggeber, Orchestrator |

### 19.5 Die berichtigten Auflagen

Diese Fassungen gelten ab sofort und ersetzen die gleichnamigen aus 18.9. Sie sind ebenso
prüfbar und zählen nicht mehr, was Kommentare mitzählen.

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-V-1′** | Die Abfrageadresse steht **im Code** an genau einer Stelle: `apps/local-api/src/version/source.ts`. Die Adresse der Release-Seite steht **im Code** an genau zwei Stellen, `src-tauri/src/release.rs` und `apps/web/src/lib/releasePage.ts`, und beide sind zeichengleich. Eine dritte Adresse auf `github.com` gibt es nicht. | `proof:release-safety` Abschnitt 2 und 3, gemessen **nach** `stripComments` und mit Gegenprobe. Eine rohe `grep`-Zählung ist ausdrücklich **nicht** mehr die Messung. |
| **A-V-4′** | Im **Code** — nicht in Kommentaren — kommt keine der Zeichenketten `dispatcher`, `Agent`, `ProxyAgent`, `NODE_USE_ENV_PROXY`, `NODE_TLS_REJECT_UNAUTHORIZED`, `rejectUnauthorized` vor, und `undici` ist keine unmittelbare Abhängigkeit. | `proof:release-safety` Prüfung „nirgends ein Herunterladen, kein Installieren, kein zweiter Netzweg", gemessen nach `stripComments`, mit Gegenprobe. |
| **A-V-6′** | Die Zahl der **gelesenen entpackten Bytes** ist begrenzt auf `VERSION_CHECK_MAX_BYTES` **plus höchstens eine Leseeinheit**. Die Leseeinheit ist bei Node 22 16 384 Bytes; die messbare Obergrenze ist damit 81 920. Es wird nichts geparst, was oberhalb der Grenze gelesen wurde. Die Begründung der Zahl im Quelltext nennt die zuletzt gemessene echte Antwortgröße. | Ein Prüffall zählt die gelesenen Bytes am Strom und erwartet ≤ 81 920 bei einer 50-MiB-Bombe. Die Zahl im Kommentar wird bei jeder Wiedervorlage neu gemessen. |
| **A-V-12′** | Nach `stop()` geht keine weitere Anfrage hinaus, ein laufender Aufruf endet als `aborted`, und der Prozeß endet innerhalb der Abschaltfrist **auch dann, wenn `stop()` nichts bewirkte**. | Die Prüffälle in `checker.test.ts` messen das erste und zweite; die harte Abschaltfrist aus T-126 (`proof:access` Abschnitt 0e) trägt das dritte. `proof:access` mißt **nicht** den Fall „ausgehende Anfrage läuft" und soll das auch nicht vorgeben. |
| **A-V-14′** | Was den Dienst verläßt, ist **ausschließlich** die geprüfte Fassungsbezeichnung und ein Kennzeichen, ob überhaupt etwas bekannt ist. Verboten und einzeln gemessen: `html_url`, `browser_download_url`, `upload_url`, `assets_url`, `zipball_url`, `tarball_url`, `body_html`, `body`, `name`, `author` und jedes Feld vom Typ „freier Text aus der Antwort". Die Zahl der Felder im Antwortschema ist **kein** Maß. | `proof:release-safety` Abschnitt 2, Prüfung „aus der Antwort wird ein Feld gelesen", mit Gegenprobe. |
| **A-V-21** | Der Grund einer Lebenslaufzeile ist ein Wert aus einer **geschlossenen Vereinigung** und kein freier `string`. `REASON_SHAPE` bleibt als Boden darunter. | Der Typ des dritten Parameters von `Logger.lifecycle`; `tsc` bricht ab, wenn eine Aufrufstelle etwas anderes übergibt. |
| **A-V-22** | Kein Nachweislauf und kein Prüffall baut eine Verbindung nach außen auf. | Ein Lauf beobachtet die ausgehenden Verbindungen des Prüfbetriebs und ist rot, sobald eine davon nicht auf `127.0.0.1` zeigt. Bis dahin gilt: `versionCheck.start()` steht hinter einer Bedingung, die im Prüfbetrieb nicht zutrifft. |
| **A-V-23** | `cargo test` läuft in `pnpm check`. | Der Befehl steht in `package.json` und ist Teil des Auslieferungstors. |

### 19.6 Urteil der Wiedervorlage

**Nacharbeit für `0.1.1` — der ausgelieferte Stand ist tragfähig, die Nachweise sind es an zwei
Stellen nicht.**

Zur Sache: **Keine der zwanzig Auflagen ist nicht erfüllt.** Der Weg, den 18.9 beschrieben hat,
ist gebaut worden, und zwar an den beiden Stellen genau so, wo eine bequemere Umsetzung nahegelegen
hätte: Der Öffnen-Befehl nimmt keine Adresse entgegen, und der Netzaufruf liegt in keinem
Anfragebehandler. Die Kette wurde in dieser Prüfung **gegen die echte Quelle** gefahren und
liefert `0.1.0` — geprüft, ohne `v`, zwei Felder, keine Protokollzeile.

Zu den Nachweisen: Zwei Befunde der Stufe „muss". Der erste (T-145-1) ist der Beweis dafür, daß
eine Zusage im Quelltext nicht dasselbe ist wie eine Messung — der Satz „kein Nachweispfad stellt
eine Verbindung nach außen her" steht im Code und ist gemessen falsch. Der zweite (T-145-2) ist
der schwerere: Die **einzige** Kontrolle zwischen einer fremden Zeichenkette und dem
Prozeßstart auf dem Rechner des Benutzers ist durch Prüffälle abgesichert, die kein Ablauf ruft.
Das war für die Versionsprüfung schon zu viel Vertrauen; mit den Anhängen aus Abschnitt 20 wird
dieselbe Datei um die gesamte Adreß- und Pfadprüfung wachsen, und dann ist es keine Frage mehr.

Vier Hinweise, davon einer (T-145-4) gegen den eigenen Text dieses Dokuments: Fünf Auflagen haben
gezählt, wo sie hätten beschreiben sollen. Die Neufassungen stehen in 19.5.

Semgrep, lokal gefahren: zehn Befunde, alle in bekannten Falschmeldungsklassen, **kein Befund
hoher Schwere**. Guardian zum neunten, 42Crunch zum achten Mal nicht verfügbar (T-145-6).

**Wiedervorlage:** mit `0.1.1`, gegen T-145-1, T-145-2, T-145-3 und A-V-21 bis A-V-23.

---

## 20. Vorabbewertung T-145 (2026-09-05) — Frist und Anhänge, bevor sie gebaut werden

Dieser Abschnitt bewertet eine Vertrauensgrenze, die es **noch nicht gibt**. `docs/spec.md`
Abschnitt 19 (A-19.1 bis A-19.19) steht seit heute, E-070, E-071 und E-072 legen die Bauform
fest, R-21 und R-22 benennen die Risiken. Gebaut ist davon **nichts**: `grep` über
`packages/storage/migrations`, `packages/domain/src` und `apps/local-api/src` findet weder
`attachment` noch `due_date`. Alles, was hier als **Auflage** steht, ist damit die Vorgabe, gegen
die gebaut und wiedervorgelegt wird.

Dasselbe Vorgehen wie bei T-136 — und dort hat es den Befund T-136-1 zutage gefördert, also den
einen, der den Entwurf gerettet hat.

**Das ist die schwerere Grenze von beiden.** Bei VG-10 war die Zeichenkette eine
Fassungsbezeichnung aus einer bekannten Quelle, in einem Zeichenvorrat ohne `/`, `:`, `\`, `?`,
`#` und Leerzeichen — sieben Zeilen von Hand geschriebene Formprüfung reichten aus. Hier ist die
Zeichenkette eine **Adresse oder ein Pfad aus dem Bestand**, sie darf all diese Zeichen tragen,
und „öffnen" heißt beim Typ Datei: die Standardanwendung starten. Das ist ein Doppelklick im
Dateimanager, ausgelöst von einem Wert, den Takt gespeichert hat.

### 20.0 Was hier bewertet wird

```text
  Benutzer  ──▶  Eingabefeld (Adresse / Dateipfad / Bilddatei)
                        │
                        ▼
  Lokaler Dienst  apps/local-api          ← VG-1: jeder lokale Prozeß schreibt hier auch hin
                        │
                        ▼
  SQLite  attachment                      ← VG-3: jeder Prozeß im Benutzerkonto schreibt hier auch hin
                        │  (1) die Zeichenkette liegt jetzt im Bestand
                        ▼
  Oberfläche  apps/web                    ← zeigt Titel und Ersatzbeschriftung an (A-19.12)
                        │  (2) Knopf „Öffnen" → Rückfrage → takt_open_*
                        ▼
  Hülle  apps/desktop/src-tauri           ← VG-11, hier liegt die ganze Prüfung
                        │  (3) app.shell().open(…)
                        ▼
  Browser  /  Standardanwendung des Systems
```

Zwischen (1) und (2) liegt der Bestand, und das ist der ganze Unterschied zu einer Prüfung im
Eingabefeld. Drei Wege führen an einem Eingabefeld vorbei in den Bestand, und alle drei
existieren heute schon: die Routen des Dienstes (VG-1, jeder lokale Prozeß mit dem
Sitzungsgeheimnis), die Datei selbst (VG-3, jeder Prozeß im Benutzerkonto, `sqlite3` genügt) und
jede künftige Migration.

**Zwei Eigenschaften des Bestands, die hier tragen, ohne daß jemand sie dafür gebaut hätte.**

1. **Die Fähigkeitenliste ist leer, was die Shell angeht** (A-V-17, gemessen von
   `proof:shell-surface`). Der Öffnen-Weg aus JavaScript ist zu; er bleibt zu. Aber: T-136-1 gilt
   unverändert — auf dem **Rust**-Weg prüft `tauri-plugin-shell` gar nichts
   (`open::open(None, …)`, „when running directly from Rust code we don't need to validate the
   path"). Was in `release.rs` die Formprüfung war, muß hier die Adreß- und Pfadprüfung sein, und
   sie ist wieder die **einzige** Kontrolle.
2. **`dialog:allow-open` steht bereits in der Liste** und liefert den Ordnerauswahldialog für den
   Exportordner (Befund S-04). Derselbe Dialog gibt mit `directory: false` einen **Dateipfad**
   zurück, ohne zu lesen und ohne zu schreiben. Der Zuwachs an Fläche für den Typ Datei ist damit
   null — vorausgesetzt, der Pfad kommt aus dem Dialog und nicht aus einem Textfeld.

---

### 20.1 B-19.1 — Der Dateianhang ist ein Startknopf
**Schwere:** hoch. **Betrifft:** A-19.9, A-19.10, A-19.15, A-19.18. **Akteure:** A-02 (Prozeß im
Benutzerkonto), A-06 (Absender einer E-Mail, mittelbar), A-03. **Bezug:** R-21, E-072 Punkt 2
und 3, T-136-1. **Grenze:** VG-11.

**Auswirkung.** „Mit der Standardanwendung öffnen" ist bei einer `.txt` ein Editor und bei einer
`.bat`, `.cmd`, `.exe`, `.scr`, `.hta`, `.vbs`, `.ps1`, `.msi`, `.jar`, `.reg`, `.cpl`, `.msc`
oder `.pif` eine **Ausführung** — mit den Rechten des Benutzers, ohne Rückfrage des
Betriebssystems, ohne Mark-of-the-Web-Warnung, denn Takt lädt nichts herunter und setzt deshalb
auch keine Zone. Der Weg ist kurz: Wer in den Bestand schreiben kann, schreibt einen Pfad; wer
den Benutzer dazu bringt, auf „Öffnen" zu klicken, hat einen Prozeßstart.

**Welche Prüfung trägt.**

| Prüfung | Trägt sie? |
|---|---|
| Der Pfad kommt aus dem **Systemdialog** (`dialog:allow-open`, `directory: false`) und nicht aus einem Textfeld | **Ja, und sie ist die wirksamste von allen** — der Benutzer hat die Datei gesehen und ausgewählt, bevor sie im Bestand steht. Sie trägt aber **nur beim Anlegen**; zwischen Anlegen und Öffnen liegt der Bestand (E-072 Punkt 2). |
| **Absoluter** Pfad | Ja, aber sie ist eine Hygienemaßnahme, keine Grenze: Ein relativer Pfad würde gegen das Arbeitsverzeichnis der Hülle aufgelöst, und das ist ein Ort, den niemand bewußt gewählt hat. |
| **Kein UNC-Pfad** | Ja — und sie ist unter Windows **nicht** aus `Path::is_absolute()` ableitbar: `\\server\freigabe\datei.exe` ist absolut. Sie braucht einen ausdrücklichen Test auf das Präfix (`std::path::Prefix::UNC`, `VerbatimUNC`, `Verbatim`, `DeviceNS`) **und** auf die Schreibweise mit Schrägstrichen (`//server/freigabe`), die Windows ebenso auflöst. Ohne sie ist jedes Öffnen einer Datei zugleich ein Anmeldeversuch gegen einen fremden Rechner (dieselbe Sache wie in R-22, nur über den anderen Typ). |
| Die Datei **existiert** | Nein, nicht als Sicherheitsprüfung. Sie ist die Voraussetzung für A-19.15 („sagt das an Ort und Stelle") und nichts weiter — zwischen `exists()` und `open()` liegt ein Wettlauf, den niemand gewinnt. |
| **Endungs-Verbotsliste** | **Nein, sie ist keine Grenze.** Begründung unten. |

**Zur Verbotsliste, ausdrücklich.** Sie ist erfahrungsgemäß schwach, und hier ist sie es aus drei
nachrechenbaren Gründen. Erstens ist die Menge unter Windows nicht fest: `PATHEXT` bestimmt, was
ohne Endung startbar ist, und `PATHEXT` ist **eine Umgebungsvariable, die der Benutzer setzen
kann**. Zweitens ist die Menge auch bei fester `PATHEXT` nicht abzählbar — neben den Klassikern
starten `.lnk`, `.url`, `.scf`, `.chm`, `.msc`, `.jar`, `.iso` (wird eingehängt), `.docm`
(Makros), `.desktop` (Linux) und je nach installierter Software ein Dutzend weitere. Drittens
lehrt eine Liste, die blockiert, den Benutzer das Umbenennen — und eine Datei, die der Benutzer
selbst umbenannt hat, öffnet er danach ohne jedes Zögern.

**Trotzdem trägt sie an genau einer Stelle etwas bei, und zwar an einer anderen als der
erwarteten.** Fünf Endungen sind nicht „gefährlich, weil ausführbar", sondern **Umleitungen**:
`.lnk`, `.url`, `.pif`, `.scf` (Windows) und `.desktop` (Linux). Bei ihnen zeigt der Pfad, den
die Rückfrage nennt, **nicht** auf das, was startet — eine `rechnung.lnk` kann jedes Ziel und
jedes Symbol tragen. Für sie ist die Rückfrage aus E-072 Punkt 3 nicht bloß schwach, sie ist
**aktiv irreführend**: Sie sagt die Wahrheit über die Datei und lügt über die Wirkung. Diese fünf
gehören hart abgewiesen, und zwar mit genau dieser Begründung. Alles andere ist eine Liste, die
beruhigt.

**Was die Rückfrage zeigen muß, damit sie kein Wegklicker ist.** E-072 Punkt 3 verlangt sie; hier
steht, woran sie zu messen ist.

1. **Der volle Pfad, ungekürzt, und der Dateiname davon abgesetzt.** Eine Kürzung in der Mitte
   (`C:\Users\…\rechnung.exe`) verbirgt genau das Stück, an dem man erkennt, wo die Datei
   herkommt.
2. **Durch die Behandlung für fremden Text.** Der Dateiname ist fremder Text — er stammt aus dem
   Bestand, in den geschrieben werden kann, und im Zweifel aus einer E-Mail. Ohne `visibleText`
   zeigt eine Datei namens `rechnung\u{202e}cod.exe` in der Rückfrage `rechnungexe.doc` an. Takt
   hat die Behandlung seit E-063, sie ist typgebunden (`ForeignText`) und `proof:foreign` mißt
   ihre Anwendung. **Das ist die wichtigste einzelne Anforderung an diesen Dialog**, und sie
   kostet nichts, weil sie existiert.
3. **Die Wirkung im Satz, nicht die Handlung.** Nicht „Datei öffnen?", sondern: die Datei wird
   mit der Standardanwendung des Systems geöffnet — dasselbe wie ein Doppelklick.
4. **Keine Vorauswahl.** Derselbe Grundsatz wie A-18.7: keiner der beiden Knöpfe ist
   vorbelegt, keiner hat den Anfangsfokus, `Enter` löst nichts aus.
5. **Kein „nicht mehr fragen".** Ein Haken, der die Rückfrage abschaltet, macht sie zu einer
   Rückfrage, die genau einmal gestellt wird — und der Benutzer schaltet sie beim ersten
   harmlosen Anhang ab. R-20 beschreibt denselben Mechanismus von der anderen Seite.
6. **Sie steht in der Hülle-Anwendung, nicht im Webview-`confirm()`.** `confirm()` ist eine
   Zeile, die ein eingeschleustes Skript nachbauen kann; und sie kann Punkt 2 nicht.

---

### 20.2 B-19.2 — Der Verweis ist alles, was wie eine Adresse aussieht
**Schwere:** hoch. **Betrifft:** A-19.9, A-19.10, A-19.12. **Akteure:** A-02, A-03.
**Bezug:** R-22, E-072 Punkt 2. **Grenze:** VG-11.

**Auswirkung.** `javascript:`, `file:///`, `data:`, `vbscript:`, `ms-msdt:`, `search-ms:` und vor
allem der UNC-Pfad `\\server\freigabe` — ein Eingabefeld für eine Adresse nimmt alles davon
widerspruchslos entgegen, und beim Öffnen tut jedes davon etwas anderes als „eine Seite im
Browser zeigen". Der UNC-Pfad ist der unauffälligste und der schlimmste: Unter Windows ist er ein
**Anmeldeversuch gegen einen fremden Rechner**, und was dabei über die Leitung geht, ist der
NTLM-Handshake des angemeldeten Benutzers.

**Reicht eine Positivliste aus `http` und `https`?** Gemessen, nicht vermutet. Der Zerleger ist
`url 2.5.8` — er liegt bereits im Baum (`Cargo.lock:4286`, transitiv über `tauri`) und ist im
lokalen Zwischenspeicher, eine unmittelbare Abhängigkeit wäre also **kein Zuwachs in der
Lieferkette** (VG-7, B-18.7). Drei Fassungen wurden gegen die **22** Zeichenketten der
folgenden Tabelle gefahren (bis T-164 stand hier „28“; nachgezählt in 22.2):
`naiv` (`to_lowercase().starts_with("http://" | "https://")`), `geparst` (`Url::parse` +
Positivliste auf `scheme()`) und `streng` (dazu: keine Steuerzeichen, Wirt vorhanden).

| Eingabe | naiv | geparst | streng | Schema laut Zerleger |
|---|---|---|---|---|
| `https://example.org/seite` | ✓ | ✓ | ✓ | `https`, Wirt `example.org` |
| `HTTP://example.org/` | ✓ | ✓ | ✓ | `http` — das Schema wird kleingeschrieben |
| `javascript:alert(1)` | ✗ | ✗ | ✗ | `javascript` |
| `file:///etc/passwd` | ✗ | ✗ | ✗ | `file` |
| `file:///C:/Windows/System32/calc.exe` | ✗ | ✗ | ✗ | `file` |
| `data:text/html,<script>…` | ✗ | ✗ | ✗ | `data` |
| `vbscript:msgbox(1)` | ✗ | ✗ | ✗ | `vbscript` |
| `ms-msdt:/id PCWDiagnostic` | ✗ | ✗ | ✗ | `ms-msdt` |
| `search-ms:query=x&crumb=location:\\server\f` | ✗ | ✗ | ✗ | `search-ms` |
| **`\\server\freigabe\datei.txt`** | ✗ | ✗ | ✗ | **läßt sich gar nicht zerlegen** |
| **`file://server/freigabe/datei.txt`** | ✗ | ✗ | ✗ | **`file`, Wirt `server`** — der UNC-Pfad **in Adreßform** |
| `//server/freigabe` | ✗ | ✗ | ✗ | läßt sich nicht zerlegen |
| `http:/\example.org/` | ✗ | **✓** | **✓** | `http`, Wirt `example.org` |
| `␣https://example.org` (führendes Leerzeichen) | ✗ | **✓** | **✓** | `https` |
| `ht<TAB>tps://example.org` | ✗ | **✓** | ✗ | **`https`** — der Zerleger entfernt Tabulator und Zeilenumbruch |
| `java<LF>script:alert(1)` | ✗ | ✗ | ✗ | `javascript` — dieselbe Entfernung, hier zu unseren Gunsten |
| `http<NUL>s://example.org` | ✗ | ✗ | ✗ | läßt sich nicht zerlegen |
| `https://exаmple.org/` (kyrillisches а) | ✓ | ✓ | ✓ | **`https`, Wirt `xn--exmple-4nf.org`** |
| `https://evil.example@gutartig.example/` | ✓ | ✓ | ✓ | `https`, Wirt **`gutartig.example`** |
| `https:///pfad` | ✓ | ✓ | ✓ | `https`, Wirt **`pfad`** |
| `https://example.org/<RLO>gpj.exe` | ✓ | ✓ | ✓ | `https` |
| `https://exam<ZWSP>ple.org/` | ✓ | ✓ | ✓ | **`https`, Wirt `example.org`** — das Zeichen verschwindet |

**Die Antwort ist: ja, eine Positivliste aus `http` und `https` reicht gegen die Schemata — und
sie reicht gegen den UNC-Pfad in beiden Schreibweisen.** Das ist das erste belastbare Ergebnis:
`\\server\freigabe` zerfällt am Zerleger, und `file://server/freigabe` fällt an der Positivliste.
Eine **eigene** UNC-Regel braucht der Typ *Verweis* damit **nicht** — sie braucht der Typ
*Datei*, wo es keine Adresse und kein Schema gibt (20.1).

**Was an einer naiven Fassung vorbeikommt, ist etwas anderes als erwartet.** Die naive Fassung
ist nicht durchlässiger, sondern **strenger** — und genau daraus entsteht die Gefahr. Der
Zerleger **normalisiert**: Er macht aus `http:/\example.org/` ein `http://example.org/`, schneidet
führenden Leerraum weg, entfernt Tabulator und Zeilenumbruch **an jeder Stelle**, wandelt
Homoglyphen nach Punycode und läßt eine Nullbreite im Wirtsnamen verschwinden. Daraus folgt der
eigentliche Befund dieses Abschnitts:

> **Der geprüfte Wert und der geöffnete Wert müssen dieselbe Zeichenkette sein.**

Wird die **Rohfassung** gespeichert und angezeigt, aber die **Normalform** geprüft und geöffnet,
dann liest der Benutzer `ht<TAB>tps://exam<ZWSP>ple.org` und Takt öffnet `https://example.org/`.
Vier der obigen Zeilen sind genau dieser Fall. Es ist dieselbe Regel, die der Add-in-Zweig schon
kennt: *„Geprüft wird der beschnittene Wert, also genau der, der gespeichert würde. Über die
Rohfassung zu urteilen und die beschnittene zu schreiben hieße, etwas anderes zu prüfen als
abzulegen."* (`routes/addin/index.ts:284`).

**Die messbare Form davon ist ein Festpunkt.** Gemessen, ob die Normalform idempotent ist:

```text
https://example.org/seite        -> https://example.org/seite            idempotent
http://example.org               -> http://example.org/                  idempotent
HTTP://Example.ORG/Pfad          -> http://example.org/Pfad              idempotent
http:/\example.org/              -> http://example.org/                  idempotent
␣https://example.org             -> https://example.org/                 idempotent
ht<TAB>tps://example.org         -> https://example.org/                 idempotent
https://exam<ZWSP>ple.org/       -> https://example.org/                 idempotent
https://example.org/a b          -> https://example.org/a%20b            idempotent
https://example.org/<RLO>gpj.exe -> https://example.org/%E2%80%AEgpj.exe idempotent
https://exаmple.org/             -> https://xn--exmple-4nf.org/          idempotent
https://evil.example@gutartig…   -> <abgewiesen>                         —
alle idempotent: true
```

Damit ist die Auflage schreibbar und nicht lästig: **Beim Anlegen wird einmal normalisiert und
die Normalform gespeichert; der Öffnen-Befehl verlangt, daß der gespeicherte Wert bereits ein
Festpunkt ist** (`Url::parse(gespeichert).as_str() == gespeichert`). Ein Wert, den jemand
nachträglich in den Bestand geschrieben hat, ist es in aller Regel nicht — und wenn doch, ist er
bereits die Form, die der Benutzer liest.

Drei Nebenwirkungen dieser Bauform, alle erwünscht:

* Der **RLO** im Pfad wird zu `%E2%80%AE` — er kann die Anzeige nicht mehr umdrehen.
* Der **Homoglyph** wird zu `xn--exmple-4nf.org` — der Benutzer sieht, wohin es geht. Die
  Homoglyphenfrage selbst ist **nicht** Takts Grenze; sie gehört dem Browser und seiner
  IDN-Anzeige. Takts Aufgabe endet damit, daß Anzeige und Ziel dieselbe Zeichenkette sind.
* **Zugangsdaten im Wirt** (`https://evil.example@gutartig.example/`) müssen abgewiesen werden,
  nicht normalisiert: Die Normalform behält sie, und die Anzeige liest sich dann wie ein anderer
  Wirt, als sie ansteuert. Das ist die klassische Verwechslung, und sie kostet eine Zeile
  (`username().is_empty() && password().is_none()`).

Und einer, der bleibt: `https:///pfad` wird zu `https://pfad/`. Harmlos — es ist ein `https`-Ziel
wie jedes andere —, aber es zeigt, daß ein leerer Wirtsteil das erste Pfadstück zum Wirt
befördert. Der Wirt muß deshalb vorhanden **und** nicht leer sein.

---

### 20.3 B-19.3 — Die Prüfung sitzt im Öffnen-Befehl, und der Nachweis muß mehr können als zählen
**Schwere:** hoch. **Betrifft:** A-19.18. **Bezug:** E-072 Punkt 2 und Punkt 5, T-136-1,
T-145-2. **Grenze:** VG-11.

**Warum der Prüfort nicht verhandelbar ist.** Eine Prüfung im Eingabefeld prüft, was der Benutzer
tippt. Geöffnet wird, was im Bestand steht. Zwischen beidem liegen heute schon drei Wege, und
keiner davon führt durch das Eingabefeld:

1. **VG-1.** Der Dienst hört auf `127.0.0.1`. Jeder Prozeß im Benutzerkonto, der an das
   Sitzungsgeheimnis kommt — und ein Prozeß im Benutzerkonto kommt an eine Datei, die die Hülle
   gelesen hat (R-02) —, schreibt über die Route in den Bestand.
2. **VG-3.** Die SQLite-Datei liegt im Anwendungsdatenverzeichnis mit `0700`/`0600`. Das hält
   andere **Benutzer** ab, nicht andere **Prozesse desselben Benutzers**. `sqlite3` und ein
   `UPDATE` genügen.
3. **Jede künftige Migration und jeder zweite Schreibpfad.** Der Import einer Sicherung, eine
   Zusammenführung, ein Reparaturlauf — alles davon schreibt am Eingabefeld vorbei.

Eine Prüfung im Eingabefeld ist deshalb eine Bequemlichkeit für den Benutzer (er erfährt sofort,
daß seine Eingabe nichts taugt) und **keine** Kontrolle. Die Kontrolle sitzt an der letzten
Stelle, hinter der nichts mehr kommt: dem Öffnen-Befehl. Das ist dieselbe Begründung wie bei
A-V-16, und sie wiegt hier schwerer, weil die Wirkung nicht ein Reiter im Browser ist, sondern
ein Prozeßstart.

**Was `proof:shell-surface` können muß.** Heute mißt der Lauf: *„Es gibt `1` Aufrufort für
`open`; erlaubt ist genau einer."* Die Zahl steht in `checkOpenCallSites`
(`proof-shell-surface.mjs:340`), und die Datei ist auf `release.rs` festgenagelt. Mit den
Anhängen kommen mindestens zwei Aufruforte dazu (Verweis und Datei), womöglich drei. **Ein
Nachweis, der nur zählt, trägt das nicht mehr** — und er würde beim ersten Bauschritt rot, ohne
etwas über Sicherheit zu sagen, was der sicherste Weg ist, ihn abzuschalten.

Der Umbau, der trägt, ist nicht „die Zahl auf 3 setzen", sondern eine **namentliche Liste mit
Bedingung**:

* Jeder Aufrufort für `.open(` steht in einer eingetragenen Datei **und** in einer eingetragenen
  Funktion. Die Liste ist im Nachweislauf ausgeschrieben; ein vierter Aufrufort, gleich wo, macht
  ihn rot.
* Für **jeden** Aufrufort gilt: Im selben Funktionsrumpf steht ein Aufruf der zugehörigen
  Prüffunktion, und der Aufruf des Öffnens ist von ihrem Ergebnis abhängig. Gemessen als Text:
  Zwischen dem Beginn der Funktion und dem `.open(` steht ein `?`/`ok_or`/`if !…{ return Err`
  über genau eine der eingetragenen Prüffunktionen.
* Jede Prüffunktion hat **neben sich** — nicht in einer fernen Datei — eine Fallliste, und die
  Fallliste enthält die Zeichenketten aus 20.2 und 20.1.
* Und, weil ein Wächter, der nie rot war, eine Behauptung über einen Wächter ist: für jede dieser
  drei Prüfungen eine **Gegenprobe** im selben Lauf, so wie die zehn, die es heute schon gibt.

Dazu kommt die Bedingung, ohne die das alles nichts mißt: **`cargo test` muß laufen**
(T-145-2, A-V-23). Solange es das nicht tut, ist die gesamte Prüfung dieses Abschnitts eine
Datei, die niemand ausführt.

---

### 20.4 B-19.4 — Die Vertrauensgrenze zum Add-in
**Schwere:** mittel (die Folge ist hoch, der Weg ist heute zu). **Betrifft:** A-19.19.
**Akteure:** A-06 (Absender einer E-Mail), A-09 (Inhaber eines entwendeten Tokens).
**Bezug:** E-072 Punkt 1, R-06, R-09, VG-2, VG-8. **Grenze:** VG-11 ∩ VG-2.

**Auswirkung.** Ein Anhang, den eine E-Mail anlegt, ist ein **von außen geschriebener
Öffnen-Befehl** auf den Rechner des Benutzers. Der Absender kontrolliert Betreff und Inhalt
vollständig (VG-8); käme daraus ein Dateipfad oder eine Adresse in den Bestand, hinge alles an
der Rückfrage aus 20.1 — und die ist die letzte Verteidigung, nicht die einzige, die man haben
möchte.

**Kann diese Grenze im Bestand so gebaut werden, wie sie gemeint ist?** Nachgesehen. Ja, und
zwar in drei Stufen, von denen die dritte die eigentliche ist.

1. **Heute schon strukturell, aber nur zufällig.** `createTodoSchema`
   (`routes/addin/schema.ts:124`) ist ein `z.object()` ohne `.strict()`; ein unbekanntes Feld
   `attachments` wird von Zod **stillschweigend entfernt**. Das ist wirksam und trotzdem die
   schwächste der drei Formen: Sie ist eine Voreinstellung der Bibliothek, kein Entwurf, und sie
   sagt nichts, wenn jemand doch etwas schickt.
2. **Der Aufrufort ist bereits explizit.** `routes/addin/index.ts:305-312` baut die Eingabe des
   Anwendungsfalls **Feld für Feld** aus sechs benannten Werten. Ein `attachments` an
   `createTodo` würde hier nicht von selbst mitwandern. Das ist gut und hängt an der Disziplin
   des nächsten, der die Datei anfaßt.
3. **Das Vorbild ist der Exportmotor, und es ist übertragbar.** `packages/export/src/sources.ts`
   hält die Datenklassifikationsgrenze VG-5 nicht mit einer Filterliste, sondern mit einem Typ:
   `ExportSourcePath` ist eine geschlossene Vereinigung in der Domäne,
   `SOURCE_PRESENCE: Record<ExportSourcePath, true>` erzwingt Vollständigkeit beim Übersetzen,
   und der Auflöser ist ein `switch` und **kein** `get(objekt, "a.b.c")`. Der Kommentar dort sagt
   den Satz, um den es geht: *„Was keinen Zweig hat, hat keinen Wert."* Dazu ist
   `ExportCandidate` (`packages/domain/src/export.ts:62`) eine eigene Projektion mit elf
   Feldern — die Todo-Notiz steht dort nicht, weil der **Typ** sie nicht hat, nicht weil jemand
   sie herausfiltert.

**Die übertragene Form ist die stärkste und zugleich die billigste: Anhänge entstehen über eine
eigene Route, und die liegt außerhalb von `/addin`.** Dann trägt die Grenze ohne einen einzigen
neuen Wächter, weil `requiredCredentialForPath` (`access/route-policy.ts:111`) alles außerhalb
von `/addin` und `SHARED_PATHS` von selbst schließt — und `proof:route-policy` Abschnitt 4 fährt
**jede** Route der zusammengebauten Anwendung mit dem Add-in-Token an. Heute sind das 61 Routen,
und keine nimmt es an. Kommt eine Anhangsroute dazu, wird sie automatisch mitgemessen; niemand
muß daran denken.

**Was gemessen werden muß, damit sie hält.** Vier Dinge, und sie sind alle billig:

* `proof:route-policy` bleibt grün, und die Zahl der geprüften Routen wächst um die
  Anhangsrouten. Keine davon steht in `SHARED_PATHS`, keine unter `/addin`.
* Die Eingabetypen der Add-in-Anwendungsfälle tragen **kein** Anhangsfeld — und zwar als Typ,
  nicht als Prüfung. Ein `tsc`, der beim Hinzufügen abbricht, ist der Nachweis.
* Ein Prüffall schickt einen vollständigen Anhang an `POST /api/v1/addin/todos` und mißt danach
  am Bestand: **null** Anhänge. Nicht „422" — das wäre die Bibliothek, die antwortet, und nicht
  die Grenze, die hält. Gemessen wird die Wirkung, nicht die Antwort.
* `GET /api/v1/addin/context` bekommt **kein** Anhangsfeld — dieselbe Auflage wie A-V-19 für die
  Fassung, aus demselben Grund (R-09: was das dauerhafte Token erreicht, erreicht ein
  entwendetes Token auch).

---

### 20.5 B-19.5 — Das Bild ist eine fremde Datei, die Takt liest und ausliefert
**Schwere:** mittel. **Betrifft:** A-19.9, A-19.13, A-19.15. **Bezug:** E-071 Punkt 2 und 3,
E-018, VG-3. **Grenze:** VG-11.

**Auswirkung.** E-071 macht aus dem Bild etwas anderes als aus Verweis und Datei: Takt **kopiert**
es und **liest** es danach bei jeder Anzeige. Damit übernimmt Takt drei Rollen, die es bisher
nicht hatte — es liest eine fremde Datei, es hält eine Kopie, und es liefert Bytes an den Webview
aus. Vier Fragen daran, und die dritte ist die, die man beim ersten Entwurf übersieht.

1. **Größe.** Ohne Obergrenze entscheidet die gewählte Datei über den Arbeitsspeicher — beim
   Kopieren, beim Lesen, beim Kodieren nach Base64 (Faktor 4/3) und im Webview noch einmal. Ein
   30-MB-Foto aus einer Handykamera ist nicht bösartig und trotzdem ein Problem. E-071 Punkt 3
   nennt „eine Obergrenze für die Bildgröße, und sie steht an einer Stelle" — sie braucht eine
   **Zahl**, und sie muß **beim Lesen gezählt** werden, nicht aus `stat` gelesen: dieselbe
   Begründung wie bei A-V-6, wo `content-length` keine Grenze war.
2. **Typ.** Eine Datei, die vorgibt, ein Bild zu sein, ist der Regelfall und nicht die Ausnahme.
   Die Endung sagt nichts. Was trägt, ist die **Kopfsignatur** (`\x89PNG`, `\xFF\xD8\xFF`,
   `RIFF…WEBP`, `GIF8`) und eine Positivliste daraus. Was **nicht** trägt: der `content-type`,
   den irgendwer angibt, und `image/*` als Klasse.
3. **SVG ist kein Bild wie die anderen.** Ein `.svg` in einem `<img>`-Element führt in keinem
   heutigen Browser Skripte aus — insofern ist es im Vorschaubild harmlos. Aber dieselbe Datei,
   über den Typ **Datei** mit der Standardanwendung geöffnet, landet im Browser oder im Editor,
   und **dort** laufen die Skripte. SVG gehört deshalb nicht in die Positivliste der
   Kopfsignaturen: Es ist Text, es hat keine, und die Ausnahme dafür wäre genau die Ausnahme, die
   man später bereut.
4. **Die Kopie liegt im Anwendungsdatenverzeichnis.** Das ist richtig (E-018: `0700`, dieselben
   Rechte wie der Bestand) und hat eine Folge, die in die Dokumentation gehört: Die Bilder
   **wachsen** dort, sie werden von jedem Sicherungs- und Synchronisierungsagenten mitgenommen
   (VG-3, dieselbe Sache wie B-11.4), und sie müssen beim Entfernen eines Anhangs und beim
   Löschen eines Todos **mitgehen**. Eine verwaiste Kopie ist Kundenmaterial ohne Eigentümer.

**Ist die `data:`-Lösung wirklich billiger als eine erweiterte CSP — oder nur anders?** Die
Begründung in E-071 Punkt 3 lautet: Die Positivliste bleibt unverändert, denn `img-src 'self'
data:` steht ohnehin schon in `tauri.conf.json`. Das stimmt (nachgesehen: Zeile 59) und ist
trotzdem das **schwächere** der beiden Argumente. Die Alternative wäre ein Eintrag
`http://127.0.0.1:17843` in `img-src`, und weil `connect-src` denselben Eintrag bereits trägt,
wäre der Zuwachs an Fläche nach außen null.

Das **stärkere** Argument ist ein anderes, und es entscheidet die Frage:

> Ein `<img src="http://127.0.0.1:17843/…">` trägt **kein** `X-Takt-Token`. Der Browser setzt bei
> einem Bildabruf keine eigenen Kopfzeilen.

Damit hätte die CSP-Variante nur zwei Wege: eine **unauthentifizierte** Byte-Route auf einem Port,
den jeder lokale Prozeß erreicht (VG-1) — also Kundenmaterial ohne Nachweis herausgeben —, oder
ein **Geheimnis in der Adresse**. Letzteres ist genau das, wogegen `stripQuery` im Protokollierer
geschrieben ist (B-2.4), und es stünde danach im Verlauf, im Speicher des Webviews und in jeder
Fehlermeldung.

**Urteil: `data:` ist wirklich billiger, aber aus dem Grund, den E-071 nicht nennt.** Der Preis
ist benannt und tragbar: Base64 kostet ein Drittel mehr Arbeitsspeicher, das ganze Bild liegt als
Zeichenkette im Webview, und `img-src data:` bleibt offen — was es ohnehin ist. Die
Größenobergrenze aus Punkt 1 ist deshalb keine Nebensache, sondern die Bedingung, unter der
dieser Entwurf trägt. E-071 Punkt 3 sollte um den Satz über die fehlende Kopfzeile ergänzt
werden; ohne ihn liest sich die Entscheidung wie eine Geschmacksfrage, und die nächste Welle
macht `img-src` auf.

---

### 20.6 B-19.6 — Die Frist
**Schwere:** niedrig. **Betrifft:** A-19.1 bis A-19.7, A-19.17. **Bezug:** E-070.

Erwartungsgemäß harmlos, und hier steht warum, statt daß es stillschweigend übergangen wird.

Die Frist ist **ein Tag ohne Uhrzeit**, sie wird **nicht gespeichert als Zustand**, sondern aus
dem gespeicherten Tag und heute gerechnet (E-070 Punkt 3), und sie steuert **nichts**: keinen
Pool, keine Spalte, keine Zeitbuchung, keinen Export (A-19.7). Damit ist sie kein Fall von VG-6
— sie ist Konfiguration, die kein Verhalten steuert. Sie eröffnet keinen neuen Datenpfad nach
außen, sie erreicht keinen Öffnen-Befehl, und sie ist kein fremder Text: Ein Tag ist ein Tag.

Drei Kleinigkeiten bleiben, alle eine Zeile wert:

* **Die Form ist zu prüfen wie jede andere Eingabe.** `YYYY-MM-DD`, und der Wert muß ein
  **existierender** Tag sein — `2026-02-30` paßt auf die Form und ist keiner. Sonst entsteht in
  der Berechnung „überfällig / heute / später" ein `Invalid Date`, und der wird an einer Stelle
  auftauchen, an der ihn niemand erwartet. Dasselbe gilt für die Bandbreite: Ein Jahr `0000` oder
  `999999` ist keine Frist, sondern eine Eingabe, die die Anzeige zerlegen soll.
* **Der Tag ist der aus E-025**, also derselbe wie der der Tagesgruppierung des Exports. Das ist
  eine Richtigkeitsfrage und keine Sicherheitsfrage, aber sie wird zu einer, wenn zwei
  Tagesbegriffe im selben Programm entstehen: Dann ist „welcher Tag" eine Frage mit zwei
  Antworten, und Fragen mit zwei Antworten sind die Stellen, an denen später etwas durchrutscht.
* **A-19.17, geprüft.** Weder Frist noch Anhang gelangen in einen Export — und das ist im Bestand
  **strukturell** gesichert und nicht durch Sorgfalt. Nachgesehen: `ExportSourcePath` in
  `packages/domain/src/export.ts:172` ist eine geschlossene Vereinigung mit zwölf Werten
  (`todo.callNumber`, `todo.title`, `todo.tags`, `group.day`, `group.quarters`,
  `group.durationSeconds`, `group.bookingNotes`, `group.startedAt`, `group.endedAt`,
  `group.entryCount`, `system.windowsUser`, `system.exportedAt`); `SOURCE_PRESENCE` erzwingt
  Vollständigkeit beim Übersetzen; der Auflöser ist ein `switch`; und `isExportSourcePath`
  vergleicht **wörtlich**, ohne jede Normalisierung. Solange `ExportSourcePath` nicht wächst,
  kann eine Vorlage — **beliebige** Vorlage, nicht nur die Standardvorlage — weder eine Frist
  noch einen Anhang auflösen. Die messbare Auflage daraus ist deshalb keine Filterprüfung,
  sondern eine **Zahl**: zwölf Quellen, wörtlich aufgezählt, und der Prüffall wird rot, wenn eine
  dreizehnte dazukommt.

---

### 20.7 Die Auflagen — die Vorgabe für die Bauaufgaben der nächsten Welle

Vierundzwanzig Auflagen. Jede ist so geschrieben, daß sie eine Zahl, eine Liste oder eine
Gegenprobe hat. Aus T-145-4 gelernt: Wo eine Zählung über rohen Text stünde, steht stattdessen
die Eigenschaft und der Lauf, der sie mißt.

**An frontend-dev: die Hülle — hier liegt die ganze Kontrolle (VG-11)**

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-A-1** | Es gibt **genau zwei** Öffnen-Befehle: `takt_open_attachment_link(url: String)` und `takt_open_attachment_file(path: String)`. Beide nehmen **einen** `String` und keinen zweiten Parameter, der Schema, Wirt, Pfad, Anwendung oder Argumente trüge. Ein gemeinsamer Befehl mit einem Typkennzeichen ist ausgeschlossen: Ein falsch gesetztes Kennzeichen wäre der Weg, eine Adresse durch die Pfadprüfung zu schicken. | Die beiden Signaturen tragen je genau einen `String`. `proof:shell-surface` führt die Aufruforte namentlich (A-A-9). |
| **A-A-2** | **Verweis:** Positivliste `http` und `https` auf dem **geparsten** Schema, nicht auf einem Präfix der Rohfassung. Zusätzlich: Wirt vorhanden und nicht leer; **keine** Zugangsdaten (`username()` leer **und** `password()` ist `None`); Gesamtlänge ≤ 2 048 Bytes; kein Zeichen mit `char::is_control()` **vor** dem Zerlegen. | `#[cfg(test)]` **neben** dem Befehl fährt die **22** Zeichenketten aus 20.2 und erwartet für jede genau das dort gemessene Ergebnis. (Bis T-164 stand hier „28“ — eine Zahl, die es in 20.2 nie gab; berichtigt in 22.2.) |
| **A-A-3** | **Der geprüfte Wert ist der geöffnete Wert.** Der Öffnen-Befehl verlangt, daß die gespeicherte Adresse bereits ein **Festpunkt** der Normalform ist: `Url::parse(gespeichert)?.as_str() == gespeichert`. Trifft das nicht zu, wird nicht normalisiert und nicht geöffnet, sondern abgewiesen. Normalisiert wird **einmal**, beim Anlegen, und gespeichert wird die Normalform. | Prüffälle: die zehn Zeilen der Festpunkttabelle aus 20.2; jede Rohfassung wird abgewiesen, jede Normalform angenommen, und `norm(norm(x)) == norm(x)` gilt für alle. |
| **A-A-4** | **Datei:** absoluter Pfad; **kein UNC** — weder `\\server\…` noch `//server/…` noch ein Windows-Präfix der Art `UNC`, `VerbatimUNC`, `Verbatim` oder `DeviceNS`; kein Zeichen mit `char::is_control()`; Länge ≤ 4 096 Bytes. `Path::is_absolute()` allein genügt **nicht** und darf nicht als Begründung stehen: Unter Windows ist ein UNC-Pfad absolut. | `#[cfg(test)]` neben dem Befehl, und die Fallliste läuft auf **Windows** (`#[cfg(windows)]` für die Präfixfälle). A-A-10 sorgt dafür, daß sie dort auch gefahren wird. |
| **A-A-5** | **Fünf Endungen werden hart abgewiesen**, und zwar mit der Begründung „die Rückfrage kann über sie nicht die Wahrheit sagen": `.lnk`, `.url`, `.pif`, `.scf`, `.desktop`. Vergleich ohne Rücksicht auf Groß- und Kleinschreibung, auf dem letzten Punktsegment des Dateinamens. **Eine darüber hinausgehende Verbotsliste ausführbarer Endungen gibt es nicht** — sie wäre unter Windows über `PATHEXT` ohnehin benutzerbestimmt und lehrte das Umbenennen. | Prüffälle: `x.lnk`, `X.LNK`, `x.url`, `x.pif`, `x.scf`, `x.desktop` werden abgewiesen; `x.exe`, `x.bat`, `x.ps1` werden **nicht** hier abgewiesen, sondern gehen durch die Rückfrage (A-A-6). |
| **A-A-6** | **Vor dem Öffnen einer Datei fragt Takt in seiner eigenen Oberfläche**, und die Rückfrage erfüllt sechs Eigenschaften: (1) voller Pfad, ungekürzt, Dateiname abgesetzt; (2) jeder angezeigte Teil geht durch die Behandlung für fremden Text (`visibleText`, Typ `ForeignText`); (3) der Satz nennt die **Wirkung** („wird mit der Standardanwendung des Systems geöffnet — dasselbe wie ein Doppelklick"); (4) keiner der beiden Knöpfe ist vorbelegt, keiner hat den Anfangsfokus, `Enter` löst nichts aus; (5) **kein** „nicht mehr fragen"; (6) kein `window.confirm`. | `proof:foreign` erkennt die Anzeigestellen an ihrem Typ und wird rot, wenn eine roh ist. Ein Prüffall legt einen Anhang mit `rechnung\u{202e}cod.exe` an und mißt die **angezeigte** Zeichenkette. Ein E2E-Fall mißt, daß `Enter` auf dem Dialog nichts öffnet. |
| **A-A-7** | **Bei einem Verweis genügt die Handlung selbst** — keine Rückfrage. Ein Browser ist der erwartete Ausgang, und eine Rückfrage, die immer erscheint, ist die Rückfrage, die weggeklickt wird und danach auch bei der Datei weggeklickt wird. | Ein E2E-Fall öffnet einen Verweis ohne Zwischendialog. |
| **A-A-8** | Bei Nichtbestehen: **kein** Aufruf von `open`, `Err` mit einem technischen Schlüssel aus einer geschlossenen Aufzählung, **ohne** den abgewiesenen Wert — etwa `link_scheme_rejected`, `link_not_normalized`, `link_userinfo`, `path_not_absolute`, `path_unc`, `path_indirect_extension`, `path_control_character`. | Prüffälle vergleichen die Rückgabe gegen die Aufzählung; kein Prüffall findet einen abgewiesenen Wert in der Meldung. |
| **A-A-9** | `proof:shell-surface` führt die Aufruforte für `.open(` **namentlich** (Datei **und** Funktion) statt sie zu zählen, und für jeden Aufrufort mißt es, daß im selben Funktionsrumpf die zugehörige Prüffunktion aufgerufen wird und das Öffnen von ihrem Ergebnis abhängt. Ein nicht eingetragener Aufrufort macht den Lauf rot. | Drei neue Gegenproben im selben Lauf: ein vierter Aufrufort; ein Aufrufort ohne Prüfung davor; eine Prüfung, deren Ergebnis nicht verwendet wird. |
| **A-A-10** | `cargo test` läuft in `pnpm check` (A-V-23) **und** die Pfadfälle aus A-A-4 laufen auf einem Windows-Läufer. | Der Befehl steht in `package.json`; der Auslieferungsablauf hat bereits einen `windows-2022`-Läufer. |
| **A-A-11** | `capabilities/default.json` bekommt **keine** `shell:`-Zeile (A-V-17 gilt unverändert). Für die Dateiauswahl wird `dialog:allow-open` mit `directory: false` benutzt; **kein** `dialog:allow-save`, **kein** `fs:*`. | `proof:shell-surface`, Prüfung 1 samt ihren Gegenproben, unverändert. |
| **A-A-12** | Die CSP wird **nicht** geöffnet: `img-src` bleibt `'self' data:`, `connect-src` bleibt bei seinen vier Marken. Kein `http://127.0.0.1:17843` in `img-src`. | `proof:shell-surface`, Prüfung 2, um `img-src` erweitert, mit Gegenprobe. |

**An domain-dev: der Dienst, die Domäne, der Bestand**

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-A-13** | Der Dienst nimmt eine Adresse **nur in Normalform** entgegen und speichert sie so. Die Normalisierung liegt an **einer** Stelle in `packages/domain` — nicht im Dienst, nicht in der Oberfläche, nicht in der Hülle —, so wie das führende `v` der Fassung an genau einer Stelle fällt (E-066 Punkt 3). | Ein Prüffall in `packages/domain/test`; `grep` findet keine zweite Normalisierung. |
| **A-A-14** | Die Tür des Dienstes weist für Adresse, Pfad und Titel dieselbe Zeichenklasse ab wie jede andere Tür: `FORBIDDEN_NAME_CHARACTERS` aus `packages/domain/src/characters.ts`. Zusätzlich für die **Adresse**: `U+200B` (Nullbreite) und `U+FEFF`, weil der Zerleger sie stillschweigend entfernt und damit Anzeige und Ziel auseinanderfallen läßt (gemessen in 20.2). | `proof:codepoints`; ein Prüffall mit `https://exam\u{200b}ple.org/`. |
| **A-A-15** | **Bild:** Obergrenze der Bildgröße als **eine** Konstante, gezählt **beim Lesen** und nicht aus `stat`; Vorschlag **8 388 608 Bytes**. Überschreitung ist ein benannter Fehlschlag und kein Wurf. | Ein Prüffall legt eine Datei knapp über der Grenze vor und mißt, daß nichts kopiert und nichts kodiert wurde. |
| **A-A-16** | **Bild:** Positivliste auf der **Kopfsignatur** — PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), GIF (`47 49 46 38`), WebP (`52 49 46 46 … 57 45 42 50`). **Kein** SVG, **kein** Vertrauen auf die Endung, **kein** Vertrauen auf einen angegebenen `content-type`. | Prüffälle: eine als `.png` benannte `.exe`, eine `.svg`, eine leere Datei, eine Datei mit gültiger Signatur und beschädigtem Rest. Jede wird abgewiesen oder als „nicht lesbar" nach A-19.15 angezeigt, keine wirft. |
| **A-A-17** | Die Bildkopie liegt im Anwendungsdatenverzeichnis unter `0700` (Verzeichnis) und `0600` (Datei), ausdrücklich gesetzt und nicht der `umask` überlassen (E-018). Der Dateiname der Kopie wird **erzeugt** und nicht aus dem Namen der Quelle übernommen. | `proof:db-permissions`, um das Bildverzeichnis erweitert. |
| **A-A-18** | Wird ein Anhang entfernt oder ein Todo gelöscht, geht die Bildkopie **mit**. Eine verwaiste Kopie ist Kundenmaterial ohne Eigentümer. | Ein Prüffall zählt die Dateien im Bildverzeichnis vor und nach dem Löschen. |
| **A-A-19** | **Frist:** `YYYY-MM-DD`, ein **existierender** Tag (kein `2026-02-30`), Jahr zwischen 1970 und 2999. Der Tagesbegriff ist der aus E-025 und steht an **einer** Stelle. Der Zustand (überfällig / heute / später) wird gerechnet und nicht gespeichert. | Prüffälle für `2026-02-30`, `0000-01-01`, `2026-2-3`, `2026-02-30T00:00:00Z`; ein Prüffall stellt die Uhr über Mitternacht und mißt den Wechsel des Zustands ohne Schreibvorgang. |
| **A-A-20** | **A-19.17, strukturell:** `ExportSourcePath` bleibt bei **zwölf** Werten, wörtlich aufgezählt. Weder Frist noch Anhang wird eine Feldquelle. `ExportCandidate` und `ExportGroup` bekommen **kein** Frist- und **kein** Anhangsfeld. | Ein Prüffall vergleicht `EXPORT_SOURCE_PATHS` gegen die ausgeschriebene Liste der zwölf und wird rot bei einer dreizehnten. `proof:export` fährt **beliebige** Vorlagen, nicht nur die Standardvorlage (R-06). |

**An integration-dev: die Add-in-Tür**

| ID | Auflage | Woran messbar |
|---|---|---|
| **A-A-21** | **Über das Add-in entstehen keine Anhänge** (A-19.19) — strukturell. Anhänge entstehen über eigene Routen **außerhalb** von `/api/v1/addin`; sie stehen nicht in `SHARED_PATHS`. Die Eingabetypen der Add-in-Anwendungsfälle tragen kein Anhangsfeld, und zwar als **Typ**, nach dem Vorbild von `ExportCandidate` (R-06). | `proof:route-policy` Abschnitt 4 mißt die neuen Routen von selbst mit; `tsc` bricht ab, wenn ein Anhangsfeld in einen Add-in-Eingabetyp gerät. |
| **A-A-22** | Ein Prüffall schickt einen vollständig ausgefüllten Anhang an `POST /api/v1/addin/todos` und mißt danach **am Bestand**: null Anhänge. Gemessen wird die **Wirkung**, nicht der Statuscode — ein 422 wäre die Bibliothek, die antwortet, und nicht die Grenze, die hält. | Der Prüffall liest nach dem Aufruf die Anhangstabelle. |
| **A-A-23** | `GET /api/v1/addin/context` bekommt **kein** Anhangs- und **kein** Fristfeld. | `proof:addin` und die OpenAPI-Beschreibung. |
| **A-A-24** | Kein Anhang öffnet sich als Nebenwirkung (A-19.18): nicht beim Laden einer Liste, nicht beim Öffnen eines Todos, nicht als Vorabholen, nicht als Vorschau, die im Hintergrund etwas startet. Das Vorschaubild ist die **einzige** Anzeige, die ohne Handlung des Benutzers entsteht, und es startet nichts. | Ein E2E-Fall lädt eine Liste mit je einem Anhang jeder Art und zählt die Aufrufe der Öffnen-Befehle: **null**. |

---

### 20.8 Befunde dieser Vorabbewertung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-145-7** | **muss** | **`proof:shell-surface` zählt, wo es benennen muß.** Der Lauf mißt heute *„genau ein Aufrufort für `open`"* (`proof-shell-surface.mjs:340`) und nagelt die Datei auf `release.rs` fest. Mit den Anhängen kommen zwei bis drei Aufruforte dazu; die Zahl auf 3 zu setzen wäre der Nachweis, der grün wird, ohne etwas geprüft zu haben (14.7). Er braucht eine namentliche Liste **und** die Bedingung „im selben Funktionsrumpf steht die zugehörige Prüfung, und das Öffnen hängt von ihrem Ergebnis ab", mit drei neuen Gegenproben. Vor dem Bau der Anhänge zu erledigen, nicht danach — sonst wächst der Lauf mit dem Code mit und ist am Ende eine Zahl, die jemand angepaßt hat. | frontend-dev |
| **T-145-8** | **muss** | **Die einzige Kontrolle liegt wieder in Rust, und Rust wird nicht geprüft.** T-145-2 hat gemessen, daß `cargo test` in keinem Ablauf steht. Für die Versionsprüfung war das eine Nachlässigkeit; für die Anhänge ist es die Bedingung, unter der überhaupt etwas geprüft wird: Nach E-072 Punkt 2 liegt die **gesamte** Adreß- und Pfadprüfung im Öffnen-Befehl, also in `src-tauri`. Ohne `cargo test` in `pnpm check` ist jede Auflage dieses Abschnitts eine Datei, die niemand ausführt. **Die Bauaufgaben der nächsten Welle dürfen nicht beginnen, bevor A-V-23 steht.** | Orchestrator |
| **T-145-9** | Hinweis | **E-071 Punkt 3 begründet die richtige Entscheidung mit dem schwächeren Argument.** „Die Positivliste bleibt unverändert" trifft zu, wiegt aber wenig: `img-src` um `http://127.0.0.1:17843` zu erweitern brächte keinen Zuwachs an Fläche nach außen, weil `connect-src` denselben Eintrag schon trägt. Das Argument, das die Frage entscheidet, ist ein anderes: **Ein `<img src>` trägt kein `X-Takt-Token`.** Die CSP-Variante bräuchte deshalb eine unauthentifizierte Byte-Route auf `127.0.0.1` (VG-1) oder ein Geheimnis in der Adresse (B-2.4) — beides schlechter als ein Drittel mehr Arbeitsspeicher. E-071 Punkt 3 sollte um diesen Satz ergänzt werden; sonst liest sich die Entscheidung wie eine Geschmacksfrage und die nächste Welle macht `img-src` auf. | Orchestrator |
| **T-145-10** | Hinweis | **E-072 Punkt 2 nennt „kein UNC-Pfad" beim Verweis, und dort braucht man ihn nicht.** Gemessen (20.2): `\\server\freigabe` läßt sich gar nicht zu einer Adresse zerlegen, und `file://server/freigabe` fällt an der Positivliste `http`/`https`. Die UNC-Regel gehört zum Typ **Datei**, wo es kein Schema gibt und `Path::is_absolute()` unter Windows für UNC `true` liefert. Die Entscheidung ist nicht falsch, nur an der falschen Stelle betont — und wer sie so liest, wie sie dasteht, baut sie beim Verweis ein und beim Pfad nicht. | Orchestrator |
| **T-145-11** | Hinweis | **Der Zerleger normalisiert, und darin liegt der eigentliche Angriff dieses Abschnitts.** Nicht das durchgelassene Schema, sondern die auseinanderfallende Anzeige: `ht<TAB>tps://exam<ZWSP>ple.org` wird zu `https://example.org/`, ein Homoglyph zu `xn--exmple-4nf.org`, ein RLO zu `%E2%80%AE`. Wer die Rohfassung anzeigt und die Normalform öffnet, hat einen Verweis gebaut, der etwas anderes tut, als er sagt. Die Antwort ist A-A-3 (Festpunkt), und sie ist gemessen idempotent. Gehört in die Bauaufgabe **und** in das Entwicklerhandbuch, weil es die Art Falle ist, die beim zweiten Anlauf wiederkommt. | frontend-dev, documenter |
| **T-145-12** | Hinweis | **`url 2.5.8` liegt bereits im Baum** (`Cargo.lock:4286`, transitiv über `tauri`, im lokalen Zwischenspeicher vorhanden). Eine unmittelbare Abhängigkeit darauf ist **kein** Zuwachs in der Lieferkette (VG-7) — es wird ohnehin übersetzt. Damit entfällt das Argument, das bei `is_release_version` für die handgeschriebene Prüfung sprach („eine Ausdrucksbibliothek wäre für sieben Zeilen mehr Fläche als Gewinn"). Eine Adresse von Hand zu zerlegen wäre hier die schlechtere Wahl: Die Fälle in 20.2 zeigen, wie viele Regeln man dabei nachbauen müßte. | frontend-dev |

### 20.9 Restrisiko dieser Grenze

Vier Punkte, und keiner ist durch eine Auflage zu schließen.

1. **Ein geöffneter Verweis ist ein geöffneter Verweis.** `https://` sagt nichts darüber, was auf
   der anderen Seite steht. Takt garantiert nach diesen Auflagen, daß die geöffnete Adresse die
   angezeigte ist und daß sie im Browser landet — nicht, daß die Seite dahinter harmlos ist. Das
   ist der Punkt, an dem Takts Zuständigkeit endet und die des Browsers beginnt, und er gehört
   als Satz ins Benutzerhandbuch.
2. **Die Rückfrage ist die letzte Verteidigung, und sie ist ein Mensch.** Alle sechs
   Eigenschaften aus A-A-6 zusammen machen aus ihr eine gute Rückfrage; sie machen aus ihr keine
   Kontrolle. Wer den Benutzer dazu bringt, eine Datei anzulegen und danach zu öffnen, hat
   gewonnen — genauso wie im Dateimanager. Der Unterschied zu vorher ist, daß Takt diesen Weg
   vorher nicht hatte.
3. **Die Bildkopie ist Kundenmaterial an einem zweiten Ort.** Bisher lag alles in einer Datei
   (VG-3, B-11.4). Ab jetzt liegen Bilder daneben, werden von Sicherungs- und
   Synchronisierungsagenten mitgenommen und tragen im Zweifel Namen, die etwas verraten. A-A-17
   verlangt deshalb einen **erzeugten** Dateinamen; die Rechte tragen den Rest, und mehr ist ohne
   Verschlüsselung nicht zu haben — die wäre eine eigene, größere Entscheidung.
4. **Der Pfad zeigt auf eine Datei, über die Takt nichts weiß.** Zwischen dem Anlegen und dem
   Öffnen kann der Inhalt der Datei ein anderer geworden sein; `exists()` ist kein Versprechen
   über den Inhalt. Das ist der Preis dafür, daß Verweis und Datei eine Zeichenkette speichern
   und kein Byte (E-071 Punkt 1), und es ist der richtige Preis: Die Alternative wäre, jede
   angehängte Datei zu kopieren.

### 20.10 Urteil dieser Vorabbewertung

**Freigegeben für den Bau — mit den vierundzwanzig Auflagen aus 20.7 als Bedingung und mit einer
Vorbedingung, die vor der ersten Bauaufgabe steht.**

Die Bauform aus E-070, E-071 und E-072 trägt. Die entscheidende Wahl — die Prüfung sitzt im
Öffnen-Befehl und nicht im Eingabefeld — ist nach dem Blick auf die drei Schreibwege in den
Bestand nicht die vorsichtigere Variante, sondern die einzige, die überhaupt eine Kontrolle ist.
Und die zweite Wahl, Anhänge aus der Add-in-Tür strukturell auszuschließen, ist im Bestand nicht
nur baubar, sondern billiger als ihre Alternative: Eine Route außerhalb von `/addin` ist von
selbst geschlossen, und `proof:route-policy` mißt sie, ohne daß jemand daran denkt.

Zwei Messungen haben Auflagen erzeugt, die man ohne sie anders geschrieben hätte. **Erstens:** Die
Positivliste aus `http` und `https` reicht — auch gegen den UNC-Pfad, in beiden Schreibweisen
(20.2). Die Gefahr liegt nicht bei den Schemata, sondern bei der **Normalisierung**: Der Zerleger
entfernt Tabulatoren, Nullbreiten und führenden Leerraum und wandelt Homoglyphen, und wer die
Rohfassung anzeigt und die Normalform öffnet, hat einen Verweis gebaut, der lügt. Die Antwort ist
der Festpunkt aus A-A-3, und er ist gemessen idempotent. **Zweitens:** Die `data:`-Lösung für das
Vorschaubild ist wirklich billiger als eine erweiterte CSP — aber aus dem Grund, den E-071 nicht
nennt: Ein `<img src>` trägt kein Token.

Zur Endungs-Verbotsliste, weil danach ausdrücklich gefragt war: Sie ist **keine Grenze** und darf
nicht als eine verkauft werden. Sie trägt an genau einer Stelle etwas bei, und das ist eine
andere als die erwartete — bei den fünf **Umleitungen** (`.lnk`, `.url`, `.pif`, `.scf`,
`.desktop`), über die die Rückfrage nicht die Wahrheit sagen kann. Für die stehen sie in A-A-5.
Alles darüber hinaus beruhigt und lehrt das Umbenennen.

**Die Vorbedingung.** Nach E-072 Punkt 2 liegt die gesamte Adreß- und Pfadprüfung in
`src-tauri`. T-145-2 hat gemessen, daß `cargo test` in **keinem** Ablauf steht — nicht in
`package.json`, nicht in `apps/desktop/package.json`, nicht in `.github/workflows/release.yml`.
Damit wäre jede Auflage dieses Abschnitts eine Datei, die niemand ausführt. **A-V-23 (`cargo test`
in `pnpm check`) und T-145-7 (`proof:shell-surface` benennt statt zu zählen) sind vor der ersten
Bauaufgabe zu erledigen**, nicht mit ihr und nicht danach.

Sechs Befunde: zwei der Stufe „muss" (T-145-7, T-145-8), vier Hinweise. Drei davon betreffen den
Wortlaut von E-071 und E-072 und keinen Code — sie sind billig und sie verhindern, daß die
nächste Welle die richtige Entscheidung aus dem falschen Grund umsetzt.

**Wiedervorlage:** nach dem Rücklauf der Bauaufgaben zu Abschnitt 19 der Spezifikation. Dann wird
gegen Code gemessen, was hier gegen einen Entwurf gefordert ist — Auflage für Auflage, mit den
Zahlen aus 20.7, und diesmal ohne Zählungen über rohen Text.

---

## 21. Wiedervorlage T-156 (2026-09-05) — die vierundzwanzig Auflagen gegen den gebauten Code

Abschnitt 20 hat Frist und Anhänge bewertet, **bevor** sie gebaut wurden, und den Bau mit
vierundzwanzig Auflagen und einer Vorbedingung freigegeben. T-146, T-147 und T-149 haben gebaut.
Dieser Abschnitt mißt das Ergebnis — **gegen den Code, nicht gegen die Berichte.** Wo Bericht und
Baum auseinandergehen, gilt der Baum.

Dasselbe Vorgehen wie in Abschnitt 19, und mit derselben Trennung: Eine Auflage, deren **Sache**
gewahrt ist und deren **Messung** fehlt oder falsch beschrieben war, heißt *abweichend erfüllt*.
In Abschnitt 19 waren fünf der sechs Abweichungen Fehler in der Messung und nicht im Code. Hier
ist das Verhältnis ein anderes: **acht Abweichungen, davon sieben fehlende Messungen und eine
Lücke in der Regel selbst.**

### 21.1 Was gemessen wurde und was nicht

| Lauf | Ergebnis |
|---|---|
| `cargo test --lib` in `apps/desktop/src-tauri` | **31/0** — Zahl **unverändert** gegenüber T-145. Kein einziger neuer Prüffall in `attachment.rs`. |
| `pnpm test` (Vitest) | 69 Dateien, **1 359/0**. |
| `proof:shell-surface` | 6 Prüfungen + **20** Gegenproben, grün. Drei der Gegenproben sind wörtlich die aus A-A-9. |
| `proof:addin` | **187/0**, darunter A-A-21, A-A-22 samt Gegenprobe und A-A-23. |
| `proof:route-policy` | 40/0 — **70 Operationen**, 4 Add-in-Routen, **65 Routen außerhalb `/addin` ergeben mit dem Add-in-Token 401**. |
| `proof:release-safety` | 31/0. |
| `proof:openapi` | 110/0. |
| `proof:codepoints` | 45/0. |
| `proof:foreign` | 14/0 — 114 Quelldateien, **164 behandelte Übergaben**. |
| `proof:db-permissions` | 17/0 — **und keine einzige davon betrifft das Bildverzeichnis** (Befund T-156-4). |
| `proof:export`, `proof:taskpane`, `proof:template-fields` | 97/0, 25/0, 30/0. |
| `proof:conflicts`, `proof:tags`, `proof:access`, `proof:export-api`, `proof:addin-wiring` | **nicht gemessen.** Auf `127.0.0.1:17843` lauschte während dieser Aufgabe der Dienst eines gleichzeitig laufenden Prüflaufs (T-153). Kein Ergebnis, weder positiv noch negativ. |
| Playwright | **nicht gefahren** (Auflage der Aufgabe: die Ports sind belegt). Die E2E-Fälle sind gelesen, nicht ausgeführt. |
| Semgrep CLI lokal, `p/nodejsscan p/typescript p/javascript` | 188 Regeln, 288 Ziele, **24 Befunde**, alle in bekannten Falschmeldungsklassen (21.6). **Kein Befund hoher Schwere, und keiner im neuen Code für Frist und Anhänge.** |
| Semgrep Guardian | **Nicht erreichbar** — „Not logged into Semgrep Guardian", **zehntes** Mal. |
| 42Crunch Audit / Scan | **Nicht gelaufen** — kein `42c-ci-cli`, kein `~/.42crunch`, keine Berechtigung. **Neuntes** Mal. Ersatz bleibt `proof:openapi`. |
| Eigene Messungen | Acht, siehe 21.3. |

### 21.2 Die vierundzwanzig Auflagen, Auflage für Auflage

| Urteil | Auflagen |
|---|---|
| erfüllt (15) | A-A-1, A-A-7, A-A-8, A-A-9, A-A-11, A-A-12, A-A-13, A-A-14, A-A-15, A-A-16, A-A-19, A-A-21, A-A-22, A-A-23, A-A-24 |
| abweichend erfüllt (8) | A-A-2, A-A-3, A-A-4, A-A-6, A-A-10, A-A-17, A-A-18, A-A-20 |
| nicht erfüllt (1) | **A-A-5** — in der Sache, nicht im Wortlaut. Siehe T-156-1. |

**A-A-1 — erfüllt.** `attachment.rs:317` und `:345`: `takt_open_attachment_link(app, url: String)`
und `takt_open_attachment_file(app, path: String)`. Je genau ein aufrufbarer Parameter; der
`AppHandle` wird von Tauri gestellt und nicht vom Aufrufer. Kein gemeinsamer Befehl, kein
Typkennzeichen. Gemessen: `proof:shell-surface` führt **drei** Aufruforte namentlich, mit Datei,
Funktion und Prüffunktion.

**A-A-2 — abweichend erfüllt.** Der Code hält alle fünf Bedingungen und in der verlangten
Reihenfolge (`attachment.rs:183-212`): leer, Länge (2 048 Bytes, vor dem Zerlegen), Steuerzeichen
**vor** dem Zerlegen, Positivliste auf `parsed.scheme()`, Wirt vorhanden und nicht leer, keine
Zugangsdaten. **Die verlangte Messung fehlt vollständig:** Es gibt keinen `#[cfg(test)]`-Block in
`attachment.rs`, und `cargo test` zählt dieselben 31 Fälle wie vor der Bauwelle. Ich habe die 22
Zeichenketten deshalb selbst gefahren (21.3, Messung 1) — der Code besteht sie. (Hier stand bis
T-164 „28“; berichtigt in 22.2.)

**A-A-3 — abweichend erfüllt.** Der Festpunkt steht wörtlich da
(`if parsed.as_str() != value { return Err(Rejection::LinkNotNormalized) }`), und geöffnet wird
`checked.as_str()` und nicht die Rohfassung. Normalisiert wird an **einer** Stelle
(`packages/domain/src/attachment.ts:406`), und die Hülle normalisiert nicht, sie prüft. Gemessen
in `packages/domain/test/attachment.test.ts` (105 Fälle, Idempotenz eingeschlossen) — **in Rust
nicht.** Ich habe die zehn Zeilen der Festpunkttabelle selbst gefahren (21.3, Messung 2).

**A-A-4 — abweichend erfüllt, und das ist die Abweichung mit dem längsten Schatten.** Der Code
ist richtig und begründet: `is_unc` trägt **beide** Hälften — die Schreibweise (`\\`, `//`), die
auf jeder Plattform greift, und das Präfix (`UNC`, `VerbatimUNC`, `Verbatim`, `DeviceNS`), das
nur unter Windows entsteht; die UNC-Prüfung steht **vor** `is_absolute()`, mit der richtigen
Begründung im Quelltext. **Die Auflage verlangte die Fallliste auf Windows.** Es gibt keine
Fallliste, also auch keine auf Windows. Auf einem Linux-Läufer habe ich gemessen, daß die erste
Hälfte alle vier Schreibweisen fängt (21.3, Messung 3); der Zweig `Component::Prefix` und der
Fall „`C:\…` ist absolut" sind **nicht gemessen** und auf diesem Läufer auch nicht meßbar.

**A-A-5 — nicht erfüllt in der Sache.** Der Wortlaut ist umgesetzt: fünf Endungen, ohne Rücksicht
auf Groß- und Kleinschreibung, auf dem letzten Punktsegment; `.exe`, `.bat`, `.ps1` fallen hier
**nicht**. Gemessen (21.3, Messung 4). Aber die Regel greift an einem Namen vorbei, den Windows
selbst erzeugt: **ein nachgestellter Punkt oder ein nachgestelltes Leerzeichen.** Siehe
**T-156-1**.

**A-A-6 — abweichend erfüllt.** Alle sechs Eigenschaften stehen in
`apps/web/src/components/AttachmentOpenDialog.tsx`, jede an einer benennbaren Stelle: voller
ungekürzter Pfad in Festbreitenschrift mit abgesetztem Dateinamen; `foreignText` auf Pfad,
Dateiname **und** Endung; die Wirkung im Satz („dasselbe wie ein Doppelklick im Dateimanager"),
bei ausführbarer Endung ein zweiter Satz und die Knopfbeschriftung „Ausführen"; Anfangsfokus auf
dem Dialog selbst (`tabIndex={-1}`), keine Vorbelegung, beide Knöpfe in derselben Gestalt; kein
Kontrollkästchen; kein `window.confirm`. Der Dialog bekommt `pendingOpen.target` — **denselben**
Wert, der an den Öffnen-Befehl geht; Anzeige und Ziel sind zeichengleich. `proof:foreign` ist
grün. **Zwei der drei verlangten Messungen fehlen:** der Prüffall mit `rechnung\u{202e}cod.exe`
und der E2E-Fall, der mißt, daß `Enter` auf dem Dialog nichts öffnet.

**A-A-7 — erfüllt.** Ein Verweis geht ohne Rückfrage (`Attachments.tsx:531-537`), eine Datei
über den Dialog. E2E-Fall TP-ANH-05 vorhanden (gelesen, nicht gefahren).

**A-A-8 — erfüllt.** `Rejection` ist eine geschlossene Aufzählung mit fünfzehn Fällen und einer
`key()`-Abbildung; kein Zweig trägt den abgewiesenen Wert. `shell.ts` reicht den Schlüssel
durch, ohne eine zweite Liste zu führen. Die Schlüssel sind wortgleich mit `LinkRejection` und
`PathRejection` in der Domäne — Dienst und Hülle sagen über denselben Fall dasselbe.

**A-A-9 — erfüllt, und das ist die sauberste Umsetzung dieser Welle.** `proof:shell-surface` führt
`OPEN_CALL_SITES` mit Datei, Funktion, Prüffunktion und Begründung; `rustFunctions` zerlegt das
kommentar- und zeichenkettenfreie Gerüst in Funktionsrümpfe; `guardCarriesTheOpen` verlangt, daß
der Aufruf der Prüffunktion **vor** dem `.open(` steht **und** in einer Anweisung endet, die `?`,
`ok_or` oder `return Err` trägt. Gelesen wird rekursiv, über alle drei Fähigkeitenendungen. Die
drei geforderten Gegenproben laufen wörtlich mit: ein vierter Aufrufort in einem Untermodul; ein
eingetragener Aufrufort ohne seine Prüfung; eine Prüfung, deren Ergebnis das Öffnen nicht trägt.
Befund T-145-7 ist damit geschlossen.

**A-A-10 — abweichend erfüllt: der Ablauf steht, die Fälle fehlen.** `pnpm check` fährt
`test:rust` (`cargo test --lib`), und `.github/workflows/release.yml:372` fährt `cargo test --lib`
auf allen drei Läufern, **vor** dem Bau, mit der richtigen Begründung im Kommentar. Damit ist
A-V-23 erfüllt und die Vorbedingung T-145-8 formal eingelöst. Nur: Der Windows-Läufer fährt
dieselben 31 Fälle wie der Linux-Läufer, und keiner davon berührt einen Pfad. Die Rohrleitung
liegt; es fließt nichts hindurch.

**A-A-11 — erfüllt.** `capabilities/default.json` trägt `core:default`,
`core:window:allow-start-dragging` und `dialog:allow-open`. Keine `shell:`-Zeile, kein
`dialog:allow-save`, kein `fs:*`. Gemessen mit vier Gegenproben, darunter eine `shell.toml` in
einem Unterordner und eine `.json5` mit einer Shell-Zeile.

**A-A-12 — erfüllt.** `img-src 'self' data:` unverändert, `connect-src` bei seinen vier Marken.
Gegenprobe „`http://127.0.0.1:17843` in img-src" wird rot.

**A-A-13 — erfüllt.** `normalizeAttachmentLink` ist im ganzen Baum genau einmal definiert und hat
genau zwei Aufrufer: den Anwendungsfall beim Anlegen (`usecases/attachments.ts:179`) und
`attachmentLabel`, das nur liest. Weder Dienst noch Oberfläche noch Hülle normalisieren.

**A-A-14 — erfüllt.** `checkAttachmentPath` und `normalizeAttachmentLink` rufen beide
`hasForbiddenNameCharacter`; für die Adresse kommt `INVISIBLE_IN_ADDRESS` (`U+200B`, `U+FEFF`)
hinzu, und die Zeichen werden **abgewiesen und nicht entfernt** — die richtige Richtung, weil
eine stillschweigend geänderte Eingabe die zweite Hälfte desselben Fehlers wäre. `proof:codepoints`
45/0, ein Domänenprüffall mit `https://exam\u{200b}ple.org/`.

**A-A-15 — erfüllt.** `MAX_ATTACHMENT_IMAGE_BYTES = 8_388_608`, eine Konstante, und gezählt wird
an den **gelesenen** Bytes (`attachment-store.ts:205-215`), nicht an `stat`. Der Abbruch ist ein
benannter Fehlschlag (`too_large`) und kein Wurf. Selbst gemessen (21.3, Messung 5): nichts
kopiert, nichts kodiert. **Nuance wie bei A-V-6′:** Der Abbruch geschieht, nachdem bis zu
Grenze + eine Leseeinheit (65 536 Bytes) gelesen wurden. Als Zahl ist die Grenze also
8 454 144, als Sache ist sie 8 388 608.

**A-A-16 — erfüllt.** Positivliste auf der Kopfsignatur, zwölf Bytes, PNG/JPEG/GIF/WebP, kein
SVG, und die Signatur wird **beim Lesen erneut** gemessen statt dem Namen zu glauben. Selbst
gemessen (21.3, Messung 6): eine `MZ`-Datei unter dem Namen `.png` und eine SVG-Datei ergeben
beide `not_an_image`, ein leeres Feld `empty`.

**A-A-17 — abweichend erfüllt.** Der Code ist richtig: `mkdir` mit `0700` **und** ein
nachgezogenes `chmod` (weil `mkdir` den Modus nur bei neu angelegten Ebenen setzt und die `umask`
ihn filtert), `open(…, 'w', 0o600)` **und** ein nachgezogenes `chmod`, erzeugter Name aus
`randomUUID` ohne Bindestriche, Nachbardatei und Umbenennen. Der Name wird beim Lesen **erneut**
gegen `^[0-9a-f]{32}\.(png|jpg|gif|webp)$` gehalten und danach der aufgelöste Pfad verglichen —
zwei Riegel, wo die Auflage einen verlangte. **Die verlangte Messung fehlt:**
`proof:db-permissions` ist **nicht** um das Bildverzeichnis erweitert worden; seine 17 Prüfungen
betreffen ausschließlich `takt.db`, `-wal`, `-shm` und die Sicherungskopie. Selbst gemessen
(21.3, Messung 7), unter `umask 000`: Verzeichnis `700`, Datei `600`, Quellrechte `666` werden
nicht geerbt.

**A-A-18 — abweichend erfüllt.** Die Kopie geht an **drei** Stellen mit: bei einem gescheiterten
`insert` (`usecases/attachments.ts:212`), beim Entfernen eines Anhangs (`:263`) und beim Löschen
des Todos (`usecases/todos.ts:362`), dort mit der richtigen Reihenfolge — erst lesen, dann
löschen, dann die Dateien — und einer ausgeschriebenen Begründung, warum `ON DELETE CASCADE` das
nicht erledigt. Gemessen ist `imageTargets` auf Portebene; **die verlangte Zählung der Dateien im
Bildverzeichnis vor und nach dem Löschen fehlt.** Selbst gemessen (21.3, Messung 8): 2 → 1 → 0,
und `removeImage` mit einem Ausbruchsnamen wirft nicht und ändert nichts.

**A-A-19 — erfüllt.** `DUE_DATE_SHAPE`, Jahresbandbreite 1970–2999 und der Existenztest über
`Date.UTC` und den Rückweg. Der Zustand wird gerechnet (`dueState`) und nirgends gespeichert;
Migration 0014 legt ausdrücklich **keine** Spalte `due_state` an und begründet es. Der CHECK in
SQL ist bewußt weiter als die Domäne und sagt das auch. Gemessen: Domänenprüffälle einschließlich
lokaler Mitternacht in einer echten Zeitzone, und `proof:addin` weist `2026-02-30` mit 422 ab —
„und kein halbes Todo".

**A-A-20 — abweichend erfüllt.** `ExportSourcePath` steht bei zwölf Werten, `SOURCE_PRESENCE`
erzwingt Vollständigkeit beim Übersetzen, `isExportSourcePath` vergleicht wörtlich ohne
Normalisierung, und weder `ExportCandidate` noch `ExportGroup` tragen ein Frist- oder Anhangsfeld.
**Die verlangte Messung trägt nicht:** Es gibt keinen Prüffall, der `EXPORT_SOURCE_PATHS` gegen
die ausgeschriebene Liste der zwölf hält. Und der Übersetzer ersetzt ihn **nicht** — er wird rot,
wenn jemand `SOURCE_PRESENCE` und den Typ auseinanderlaufen läßt, aber **grün**, wenn jemand eine
dreizehnte Quelle ordentlich an beiden Stellen einträgt. Genau der Fall, den die Auflage
abfangen wollte, ist der einzige, den sie nicht abfängt.

**A-A-21 — erfüllt.** Anhänge hängen als Unterressource am Todo
(`/api/v1/todos/{todoId}/attachments`), stehen nicht in `SHARED_PATHS` und liegen damit
**strukturell** außerhalb der Add-in-Tür. `AddinUnit` führt keinen `AttachmentPort`; die
Portauswahl ist weiterhin `Pick<…>` und benennt jede erlaubte Methode einzeln. Gemessen:
`proof:route-policy` fährt **alle 65 Routen außerhalb `/addin`** mit dem Add-in-Token an und
bekommt 401; `proof:addin` mißt die **Form der Tür** (`Object.keys(addinTuer.shape)` enthält kein
Feld, das auf `attach|anhang|file|image|url` paßt) und zusätzlich, daß `dueDate` da ist — sonst
mäße der Fall daneben nichts.

**A-A-22 — erfüllt, und die Gegenprobe ist die richtige.** Ein voll ausgefüllter Anhang in **vier**
Schreibweisen (`attachments`, `attachment`, `attachmentUrl`, `attachmentPath`) an
`POST /addin/todos` ergibt 201, die Frist kommt an, und `SELECT COUNT(*) FROM todo_attachment`
zählt **null**. Danach prüft derselbe Fall, daß keiner der Werte in Titel, Call-Nummer oder
Vermerk gewandert ist. Die Gegenprobe schreibt per `INSERT` an der Tür vorbei und verlangt, daß
die Zählung dann **eins** sagt — ohne sie wäre die Null die schlimmste Sorte grün.

**A-A-23 — erfüllt.** `GET /addin/context` liefert `tagTree`, `pools`, `statuses`,
`defaultStatusId`, `defaultTagIds` — kein Anhangs- und kein Fristfeld, in der Beschreibung wie im
Prüflauf.

**A-A-24 — erfüllt.** Kein Anhang öffnet sich als Nebenwirkung: `openAttachmentLink` und
`openAttachmentFile` haben im ganzen Oberflächenbaum genau **zwei** Aufrufstellen, beide in
`Attachments.tsx` und beide an einem Klick. Das Vorschaubild entsteht aus Bytes über
`readAttachmentImage` — Bytes zu lesen ist kein Öffnen-Befehl. E2E-Fall TP-ANH-14 zählt null
Aufrufe über Listenladen, Todo öffnen, erneut öffnen und Neuladen.

### 21.3 Die acht eigenen Messungen

Sie stehen hier, weil sie das ersetzen, was die Auflagen als Prüffälle verlangt hatten. Ein
Ersatz ist keine Erfüllung: Diese Messungen laufen in **keinem** Ablauf und sind beim nächsten
Umbau weg.

Für die Messungen 1 bis 4 habe ich den geprüften Teil von `attachment.rs` **mechanisch**
geschnitten (von `use std::path::` bis zum Ende von `check_file`, ohne die
`tauri_plugin_shell`-Zeile) und gegen `url 2.5.8` in einer Wegwerf-Kiste übersetzt. Der Schnitt
ist zeichengleich mit dem Original — geprüft, nicht angenommen. Gemessen wird damit der
ausgelieferte Text und nicht eine Abschrift.

**1 — die 22 Zeichenketten aus 20.2 gegen `check_link`.** (Hier stand bis T-164 „28“ im selben
Satz, der zwei Sätze später „22“ sagte; berichtigt in 22.2.) Von den 22 Zeilen der Tabelle wird
**genau eine** angenommen: `https://example.org/seite`, die einzige, die bereits Normalform ist.
Alle übrigen fallen, und sie fallen an der Stelle, an der sie fallen sollen:
`javascript:`, `file:`, `data:`, `vbscript:`, `ms-msdt:`, `search-ms:` an `link_scheme_rejected`;
`\\server\freigabe` und `//server/freigabe` an `link_unparsable`; `file://server/freigabe` an der
Positivliste; `ht<TAB>tps://`, `java<LF>script:` und `http<NUL>s://` an
`link_control_character` **vor** dem Zerlegen; `https://evil.example@gutartig.example/` an
`link_userinfo`; und `HTTP://example.org/`, `http:/\example.org/`, `␣https://example.org`,
`https:///pfad`, der Homoglyph, der RLO und die Nullbreite alle an **`link_not_normalized`**.

Das ist der eigentliche Beleg dieser Wiedervorlage: **Die Gefahr lag bei der Normalisierung, und
der Festpunkt fängt sie.** Nicht das Schema hat die vier lügenden Zeilen abgewiesen, sondern die
Forderung, daß der geprüfte Wert der geöffnete ist.

**2 — die Festpunkttabelle.** Alle sechs Normalformen werden angenommen, alle fünf zugehörigen
Rohfassungen abgewiesen. `norm(norm(x)) == norm(x)` für alle zehn Zeilen: **idempotent**. Die
Auflage ist also streng und trotzdem erfüllbar — genau das, was 20.2 versprochen hatte.

**3 — UNC gegen `check_file`, auf Linux.** `\\server\freigabe\datei.exe`,
`//server/freigabe/datei.exe`, `\\?\C:\x.txt` und `\\.\pipe\x` ergeben alle vier `path_unc`. Die
Hälfte über die Schreibweise trägt also allein, und sie trägt auf einem Läufer, auf dem
`Component::Prefix` nie entsteht. `C:\Windows\System32\calc.exe` ergibt hier
`path_not_absolute` — **unter Windows wäre dieser Pfad absolut**, und was dann geschieht, ist auf
diesem Läufer nicht meßbar.

**4 — die fünf Umleitungen.** `.lnk`, `.LNK`, `.url`, `.pif`, `.scf`, `.desktop` ergeben
`path_indirect_extension`, und zwar **vor** der Existenzprüfung. `.exe`, `.bat`, `.ps1` fallen
hier **nicht**: Eine wirklich angelegte `/tmp/…exe` wird angenommen und geht damit an die
Rückfrage, wie A-A-5 es will. Eine wirklich angelegte `/tmp/….lnk` wird abgewiesen.

**5 — die Bildgrenze.** Eine Datei von 8 MiB + 8 Bytes mit gültiger PNG-Signatur ergibt
`too_large`; im Bildverzeichnis liegt danach **eine** Datei, nämlich die von vorher. Nichts
kopiert, nichts kodiert.

**6 — die Kopfsignatur.** `4D 5A` (`MZ`, eine Windows-Binärdatei) unter dem Namen `bild.png`
ergibt `not_an_image`. Ein SVG mit `<script>` darin ergibt `not_an_image`. Beim **Lesen** ergibt
ein Name in Ausbruchsform (`../../takt.db`, `..%2Ftakt.db`) `bad_name`, ein wohlgeformter, aber
unbekannter Name `unreadable` — kein Wurf, keine Auskunft über das Dateisystem.

**7 — die Rechte, unter `umask 000`.** Bildverzeichnis `0700`, Bildkopie `0600`, während die
Quelldatei `0666` trägt. Die Kopie erbt die Rechte der Quelle also nicht, und die weite `umask`
schlägt nicht durch. Der Name der Kopie ist 32 Hexziffern plus Endung und trägt nichts vom Namen
der Quelle; zwei Kopien derselben Quelle tragen verschiedene Namen.

**8 — die Kopie geht mit.** Zwei Kopien → `removeImage` → 1 → `removeImage` → 0. `removeImage`
mit `../../takt.db` und mit einem unbekannten Namen wirft nicht und ändert nichts.

### 21.4 Befunde

| Kennung | Schwere | Sache |
|---|---|---|
| **T-156-1** | **muss** | **Ein nachgestellter Punkt oder ein nachgestelltes Leerzeichen hebt A-A-5 auf.** Gemessen: `/…/rechnung.lnk.` und `/…/rechnung.lnk ` bestehen `check_file` — `Path::extension()` liefert `""` beziehungsweise `"lnk "`, und keines davon steht in `INDIRECT_EXTENSIONS`. Unter Windows schneidet die Win32-Pfadauflösung nachgestellte Punkte und Leerzeichen vom letzten Namensbestandteil ab, **bevor** die Datei aufgelöst wird: `is_file()` bejaht, weil es dieselbe Abkürzung nimmt, und `ShellExecuteW` öffnet danach die Verknüpfung. Genau der Fall, für den die fünf Endungen dastehen — der Pfad, den die Rückfrage nennt, zeigt nicht auf das, was startet. **Und die Rückfrage lügt mit:** `extensionOf` in `apps/web/src/lib/attachmentLabel.ts:113` gibt für `…exe.` und `…exe ` ebenfalls „keine Endung" zurück, also sagt der Dialog „Diese Datei wird geöffnet" statt „wird ausgeführt". Der Weg dahin ist der, für den die Prüfung im Öffnen-Befehl überhaupt existiert: VG-1 oder VG-3 schreiben den Wert in `todo_attachment.target`, der Benutzer klickt. **Auf Windows nicht gemessen** — der Läufer war Linux; die Mechanik ist die dokumentierte Win32-Namensnormalisierung. **Gegenmittel:** vor dem Endungsvergleich nachgestellte `.` und Leerzeichen vom letzten Namensbestandteil abschneiden und **auf dem beschnittenen Namen** vergleichen — oder, strenger und billiger, einen Pfad abweisen, dessen letzter Bestandteil auf `.` oder Leerzeichen endet. Dieselbe Änderung in `extensionOf`. Zuständig: frontend-dev. |
| **T-156-2** | **muss** | **`attachment.rs` hat keinen einzigen Prüffall.** `cargo test` zählt 31 — dieselben 31 wie in T-145, alle in `release.rs`, `sidecar.rs`, `identity.rs`, `appdata.rs`. A-A-2, A-A-3, A-A-4, A-A-5 und A-A-8 verlangten die Fälle ausdrücklich **neben dem Befehl**; A-A-10 verlangte sie auf Windows. Die Rohrleitung dafür ist gebaut (`test:rust` in `pnpm check`, `cargo test --lib` auf allen drei Läufern **vor** dem Bau), aber sie führt nichts. Damit ist die einzige Kontrolle zwischen einer Zeichenkette aus dem Bestand und `ShellExecuteW` weiterhin ungesichert — dieselbe Sache wie T-145-2, nur an der schwereren Grenze. **Und T-156-1 ist der Beleg, daß das nicht theoretisch ist:** Ein Prüffall `x.lnk.` hätte ihn beim Schreiben gefunden. Zuständig: unit-tester (benannte Ausnahme in `CLAUDE.md`), Windows-Fälle unter `#[cfg(windows)]`. |
| **T-156-3** | **muss** | **Die E2E-Hauptreihe spricht bei jedem Lauf mit `api.github.com` (O-CI).** `tests/e2e/support/services.ts:86` startet `node apps/local-api/src/index.ts`; `index.ts` ruft `main()` **ohne** Argument, `main()` baut den Prüfer mit `createGithubReleaseSource()` und ruft `versionCheck.start()` (`main.ts:448`). Belegt am laufenden Prozeß: `node apps/local-api/src/index.ts` (PID 2289990) hört auf 17843 und 17844. Dieselbe Überschreitung wie T-145-1, nur an der anderen Reihe — und die Naht dagegen liegt seit T-146 fertig daneben: `proof-access-entry.ts` reicht eine Abholfunktion, die nirgendwohin geht, an `main({ releaseSource })`. Folgen unverändert: ein Lebenszeichen je Lauf (R-19 Punkt 3), Mitverbrauch der 60 Anfragen je Stunde und Quelladresse, und — neu und schlimmer — **ein zeitabhängiger modaler Dialog vor der Oberfläche** (E-077, T-150). Ein Prüflauf, dessen Ergebnis davon abhängt, wann er läuft, ist kein Prüflauf. Zuständig: e2e-tester. |
| **T-156-4** | Hinweis | **Sieben verlangte Messungen fehlen, bei richtigem Code.** A-A-2/A-A-3/A-A-4/A-A-5/A-A-8 (Rust, siehe T-156-2), A-A-6 (RLO-Anzeige, `Enter`), A-A-17 (`proof:db-permissions` um das Bildverzeichnis), A-A-18 (Dateizahl vor und nach), A-A-20 (die zwölf gegen die ausgeschriebene Liste). Ich habe fünf davon selbst nachgemessen (21.3) — aber eine Messung, die in keinem Ablauf steht, ist eine Momentaufnahme und keine Zusage. |
| **T-156-5** | Hinweis | **A-A-20 fängt den Fall nicht, für den sie geschrieben wurde.** `Record<ExportSourcePath, true>` hält Typ und Laufzeitliste zusammen; es hält die **Zahl** nicht fest. Wer `'todo.dueDate'` sauber an beiden Stellen einträgt, übersetzt grün. Die Auflage verlangte eine ausgeschriebene Liste der zwölf in einem Prüffall, und genau die fehlt. Neufassung als **A-A-20′**. |
| **T-156-6** | Hinweis | **Die Bildgrenze ist als Zahl 8 454 144, nicht 8 388 608.** Gezählt wird nach dem Lesen eines Blocks von 65 536 Bytes, der Abbruch geschieht also frühestens danach. Als Sache ist die Auflage erfüllt (nichts wird kopiert, nichts kodiert); als Zahl ist sie wie A-V-6 zu berichtigen. Neufassung als **A-A-15′**. |
| **T-156-7** | Hinweis | **`logger.lifecycle` nimmt weiterhin `string`** (A-V-21 aus T-145, unerledigt). Der Riegel ist eine Gestaltprüfung, siehe 21.5. |
| **T-156-8** — *erledigt seit T-168; die Beschreibung hier war danach falsch, berichtigt in T-241 (2026-09-06), Begründung in 32.1* | Hinweis, geschlossen | **Der Satz, der bis heute hier stand, lautete: „`attachmentLabel` schneidet `https://` beziehungsweise `http://` weg". Für `http://` war er falsch — und er beschrieb damit ausgerechnet die Sicherheitseigenschaft weg, um die es in dieser Zeile geht.** Heute nachgemessen an `packages/domain/src/attachment.ts:1044` (`url.protocol === 'https:' ? rest : protocol + '//' + rest`), Werte aus dem Lauf: `https://beispiel.example/tickets/4711` → `beispiel.example/tickets/4711`; `http://beispiel.example/tickets/4711` → **`http://beispiel.example/tickets/4711`**; `http://beispiel.example/` → **`http://beispiel.example`**; `http://beispiel.example:8443/a?b=1#c` → **`http://beispiel.example:8443/a?b=1#c`**. **Weg fällt genau ein Schema, und zwar das, das nichts unterscheidet.** Jedes andere — heute nur `http:` — bleibt sichtbar stehen. Damit steht die **Herabstufung von `https` auf `http` schon in der ersten Zeile**, also dort, wo sie vor dem Klick gebraucht wird: Bei einem Verweis fragt Takt nicht zurück (A-A-7, richtig so), die Liste ist die ganze Anzeige. Das sichtbare `http://` ist eine **bewußte** Abweichung von X-04 (zwei Anhänge tragen nie dieselbe Ersatzbeschriftung — `http://a/b` und `https://a/b` sind zwei Anhänge) und von spec-ux-reviewer in T-237 erneut geprüft und **bestätigt**. Kein Fund im Sinne von R-22: Anzeige und Ziel bleiben zeichengleich. **Wer diese Zeile künftig als Auftrag läse, kürzte eine Sicherheitseigenschaft weg** — deshalb steht die Berichtigung hier und nicht als Nachtrag am Ende. |
| **T-156-9** | Hinweis | **Semgrep Guardian zum zehnten, 42Crunch zum neunten Mal ohne Werkzeug.** Die Lieferkette ist weiterhin nie gemessen worden, und seit `v0.1.0` sind Binärdateien draußen. Beschaffungsentscheidung, unverändert. |
| **T-156-10** | Hinweis | **Fünf Nachweisläufe konnten nicht laufen**, weil der Port belegt war (21.1). Sie stehen hier als *nicht gemessen* und nicht als grün. |

**Was aus T-145 geschlossen ist:** T-145-1 (`proof:access` greift nach draußen) — behoben und
nachgemessen, in drei Läufen keine einzige `node`-Verbindung außerhalb `127.0.0.1`. T-145-2 und
T-145-8 (`cargo test` in keinem Ablauf) — der Ablauf steht; der Inhalt fehlt, siehe T-156-2.
T-145-7 (`proof:shell-surface` zählt statt zu benennen) — vollständig behoben.

### 21.5 Die zwei Zeilen für das Bedrohungsmodell aus T-132 (O-BD)

**`sqlite` und `code` als neue Angaben in der Ausgabe: unbedenklich, und hier steht warum.**
`errorCodeOf` (`packages/storage/src/migration.ts:166`) nimmt `error.code` nur an, wenn es
`^[A-Z][A-Z0-9_]{0,31}$` erfüllt — ein Pfad fällt an `^[A-Z]`, ein Benutzername an derselben
Stelle, eine Meldung von SQLite an der Länge oder am Leerzeichen. `sqliteResultCodeOf` nimmt nur
eine sichere ganze Zahl. `pair()` (`apps/local-api/src/startup.ts:88`) schreibt Zahlen nur, wenn
sie nicht negative sichere Ganzzahlen sind, und Text nur kleingeschrieben; ein `null` verschwindet
rückstandsfrei. Die Ausgabe ist damit auf zwei Wegen verengt: an der Quelle nach Gestalt, an der
Zusammensetzung nach Typ. **Es gibt keine `.code`-Eigenschaft in einem Wurf aus `node:sqlite` oder
`node:fs`, die einen Benutzernamen oder einen Pfad trüge** — `code` ist dort durchweg `ENOENT`,
`EACCES`, `ENOSPC`, `ERR_SQLITE_ERROR`; der Pfad steht in `path`, und `path` wird nicht gelesen.

**Der Riegel im Protokollierer ist eine Gestalt-, keine Inhaltsprüfung — und das ist die richtige
Bauart, solange man weiß, was er nicht kann.** `REASON_SHAPE`
(`apps/local-api/src/logger.ts:63`) verlangt eine kleingeschriebene Wortmarke von höchstens 48
Zeichen, gefolgt von bis zu acht Paaren `name=wert` mit je höchstens 32 Zeichen. Gemessen:

```text
state_unreadable code=enoent sqlite=14        durch    (der erwartete Regelfall)
C:\Users\Kerem                                abgewiesen
/home/kerem/.local/share/takt/takt.sqlite3    abgewiesen
x user=kerem                                  durch
x tag=kunde_mueller                           durch
x n=tck4711                                   durch
x p=c_users_kerem_desktop_rechnung            durch
größte durchkommende Zeile: 576 Zeichen, davon 256 Zeichen Wertinhalt (8 Paare × 32)
```

Er begrenzt **Gestalt und Menge**, nicht **Herkunft**. Ein Pfad mit Schrägstrichen fällt; derselbe
Pfad mit Unterstrichen käme durch, wenn ihn jemand so zusammensetzte. Die Zusage lautet deshalb
nicht „hier steht nichts Persönliches", sondern „hier steht nichts, was nicht wie ein technischer
Schlüssel aussieht" — und die zweite Zusage ist die, die ein Aufrufer einhalten muß, nicht der
Protokollierer. Der Sonderfall Sitzungsgeheimnis ist unabhängig davon von `redactSecrets`
geschlossen, das auf der fertigen Zeile arbeitet.
**Kein ReDoS:** Der Ausdruck ist nicht geschachtelt; gegen 2 000 Paare mit anschließendem
Fehlschlag läuft er in 0,007 ms.

**Berichtigung meiner eigenen Zahl aus T-145:** Dort steht „336 Zeichen, davon 256 Zeichen
Wertinhalt". Die 256 stimmen, die 336 nicht — bei voll ausgeschöpften Namen sind es **576**
(48 + 8 × 66). Dieselbe Sorte Fehler, die T-145-4 an fünf anderen Auflagen beschrieben hat, hier
im eigenen Text.

Die Auflage **A-V-21** (dritter Parameter von `lifecycle` als geschlossene Vereinigung statt
`string`) bleibt damit offen und bleibt richtig: Sie verlegte die Zusage von der Gestalt auf die
Herkunft, und das ist die einzige Stelle, an der sie zu halten ist.

### 21.6 Die eine Verbindung nach außen (R-19), bei dieser Freigabe geprüft

Drei Aussagen, jede gemessen:

1. **Kein Nachweislauf spricht nach außen** (A-V-22). Während `proof:all`, während elf einzelnen
   Nachweisläufen und während `pnpm test` habe ich alle fünftel Sekunden `ss -tnp` gelesen und auf
   Verbindungen außerhalb `127.0.0.1` gefiltert: **null Zeilen** in allen drei Läufen. Befund
   T-145-1 ist behoben, und der Riegel ist der richtige — ein ausdrücklicher Parameter an `main()`,
   keine Umgebungsvariable, die von außerhalb des Prozesses setzbar wäre.
2. **Die E2E-Hauptreihe spricht nach außen.** Siehe T-156-3. Das ist der offene Rest von O-CI.
3. **Die Adresse steht weiterhin an genau einer Stelle.** `proof:release-safety` 31/0, darunter
   sechs Gegenproben; `api.github.com` steht im Produktivcode nur in
   `apps/local-api/src/version/source.ts`.

Zu **E-077**: Daß in Prüfläufen zeitabhängig ein modaler Dialog vor der Oberfläche springt, ist
kein Bedienfehler der Prüfreihe, sondern die **Wirkung** von Punkt 2. Die Umkehr der Vorgabe im
Hüllen-Ersatz (`installedVersion: '9999.0.0'`) behebt das Symptom in jeder einzelnen Datei; die
Ursache behebt nur der Riegel an der Quelle. Beide sind richtig, und die Reihenfolge ist:
erst der Riegel, dann darf die Vorgabe bleiben, wo sie ist.

### 21.7 Berichtigte und neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-5′** | Die fünf Umleitungsendungen werden auf dem **beschnittenen** letzten Namensbestandteil verglichen: nachgestellte `.` und Leerzeichen fallen vorher weg, weil Windows sie vor der Dateiauflösung ebenfalls abschneidet. Gleichwertig zulässig: Ein Pfad, dessen letzter Bestandteil auf `.` oder ein Leerzeichen endet, wird als Ganzes abgewiesen. Dieselbe Regel gilt für `extensionOf` in der Oberfläche, weil dieselbe Zeichenkette dort über das Wort „Öffnen" oder „Ausführen" entscheidet. | Prüffälle `x.lnk.`, `x.lnk<SP>`, `x.lnk..`, `x.LNK.`, `x.url.`, `x.desktop.`, `x.exe.`, `x.exe<SP>` — die ersten sechs abgewiesen, die letzten beiden im Dialog als **Ausführung** beschriftet. Unter `#[cfg(windows)]` zusätzlich gegen eine wirklich angelegte Datei. |
| **A-A-15′** | Die Bildgrenze ist eine Zahl (8 388 608) **und** eine Zusage über das Verhalten: Es wird abgebrochen, bevor mehr als Grenze + eine Leseeinheit gelesen ist, und nichts wird kopiert oder kodiert. Die Leseeinheit ist zu messen und nicht anzunehmen. | Die gelesenen Bytes zählen, nicht nur den Ausgang prüfen. |
| **A-A-20′** | Ein Prüffall hält `EXPORT_SOURCE_PATHS` gegen eine im Prüffall **ausgeschriebene** Liste der zwölf Werte und gegen die Zahl 12. Er wird rot, wenn eine dreizehnte Quelle hinzukommt — auch dann, wenn sie ordentlich in Typ **und** `SOURCE_PRESENCE` eingetragen ist. | Der Prüffall selbst; `proof:export` fährt weiterhin beliebige Vorlagen. |
| **A-A-25** | Die Prüffälle zu A-A-2 bis A-A-5 und A-A-8 stehen in einem `#[cfg(test)]`-Block **in `attachment.rs`**, nicht in einer fernen Datei — dieselbe Begründung wie für `release.rs` (T-136-1, benannte Ausnahme in `CLAUDE.md`). Die Pfadfälle laufen zusätzlich unter `#[cfg(windows)]`. | `cargo test --lib` zählt danach mehr als 31 Fälle, und der Windows-Läufer fährt Fälle, die auf Linux nicht laufen. |
| **A-A-26** | Kein Prüflauf und kein Nachweispfad startet den Dienst so, daß die Versionsprüfung nach außen greift — auch die E2E-Reihe nicht. Die Naht ist `main({ releaseSource })`, und sie ist ein **Parameter** und keine Umgebungsvariable. | `ss -tnp` während der vollständigen E2E-Reihe: keine `node`-Verbindung außerhalb `127.0.0.1`. Dieselbe Messung, die A-V-22 für die Nachweisläufe verlangt. |
| **A-A-27** | `proof:db-permissions` mißt das Bildverzeichnis mit: `0700` für das Verzeichnis, `0600` für jede Kopie, unter absichtlich weiter `umask`, im **echten** Startpfad des Dienstes. | Derselbe Abschnitt 4, um zwei Zeilen erweitert, mit Gegenprobe. |

### 21.8 Urteil dieser Wiedervorlage

**Der Entwurf aus Abschnitt 20 hat gehalten, und er hat an der Stelle gehalten, an der es darauf
ankam.** Der Festpunkt aus A-A-3 ist die tragende Erfindung dieser Grenze: Gemessen weist er
**vier** Zeichenketten ab, die jede Schemaprüfung passiert hätten und deren Anzeige danach etwas
anderes gesagt hätte als ihr Ziel. Die Bildbehandlung ist strenger gebaut als verlangt — zwei
Riegel auf dem Namen statt einem, die Signatur beim Lesen **erneut** gemessen. Die Add-in-Grenze
ist strukturell und nicht per Voreinstellung, und ihre Messung hat die Gegenprobe, die sie
braucht. `proof:shell-surface` benennt jetzt, statt zu zählen.

**Freigegeben wird trotzdem nicht.** Drei Befunde der Stufe „muss" stehen, und sie hängen
zusammen: Es gibt keinen Prüffall in `attachment.rs` (T-156-2), deshalb ist eine Lücke in der
Endungsregel zwei Wellen lang unbemerkt geblieben (T-156-1), und die Reihe, die das hätte finden
können, hat ein eigenes Problem, das ihre Ergebnisse vom Zeitpunkt abhängig macht (T-156-3).

Der Rest ist Buchführung: sieben verlangte Messungen fehlen bei richtigem Code. Das ist derselbe
Befund wie T-145-4 und T-136-2, zum dritten Mal — **eine Auflage, die einen Prüffall nennt, ist
erst erfüllt, wenn der Prüffall in einem Ablauf steht.** Fünf davon habe ich in dieser Aufgabe
selbst nachgemessen; sie stehen in 21.3, und sie sind mit dem Ende dieser Aufgabe weg.

**Urteil: Nacharbeit.** Nach Behebung von T-156-1, T-156-2 und T-156-3 und Eintragen der
Messungen aus 21.7 ist diese Grenze freigabefähig.

---

## 22. Prüfung T-164 (2026-09-05) — vier Punkte, eine Wiedervorlage und eine Zahl, die nie gestimmt hat

Vier zugewiesene Punkte (O-DF, O-DI, O-DD, O-BD) und die Wiedervorlage von V-01/T-156-2 gegen die
Fallliste aus T-160. Kein Produktivcode angefasst; die Befunde stehen hier und im Bericht, die
Behebung gehört den zuständigen Programmierern.

### 22.0 Werkzeugstand

| Werkzeug | Ergebnis |
|---|---|
| `cargo test --lib` (Linux, `apps/desktop/src-tauri`) | **50/50**, davon 19 in `attachment::tests`. Die drei `#[cfg(windows)]`-Fälle werden auf diesem Läufer **nicht einmal übersetzt**. |
| Semgrep (lokal, `p/rust` + `p/typescript` + `p/javascript`, 85 Regeln, 263 Dateien) | **8 Befunde, alle INFO**, keiner hoher Schwere: sieben `unsafe-usage` (`identity.rs` 77/82/105/109/156/162, `appdata.rs:372` — die bekannten Win32- und `getpwuid`-Aufrufe) und ein `temp-dir` in `attachment.rs:461`, dem Prüfhelfer aus T-160. |
| Semgrep Guardian (Plattform) | **Nicht gelaufen, elftes Mal.** Kein Zugang; die lokale Regelmenge ist die ohne Anmeldung erreichbare (85 statt mehrerer hundert Regeln). Die Lieferkette ist damit weiterhin **nie** gemessen worden. |
| 42Crunch Audit / Scan | **Nicht gelaufen, zehntes Mal.** Kein `42c-ci-cli`, keine Berechtigung. Ersatz bleibt `proof:openapi`. |
| Eigene Messung: mechanischer Schnitt aus `attachment.rs` | `attachment.rs:116-359` ohne die `ShellExt`-Zeile, gegen `url 2.5.8` in einer Wegwerf-Kiste übersetzt. Der Schnitt ist mit `diff` als zeichengleich bestätigt, bevor gemessen wurde. |

### 22.1 O-DF — die zwei Nachbarn des nachgestellten Punktes, einzeln beurteilt

**Ausgangslage.** T-157 hat zwei weitere Windows-Namensfragen benannt und ausdrücklich nicht
angefasst: alternative Datenströme und 8.3-Kurznamen. Beide gehören derselben Klasse an wie
T-156-1 — **der Name, den `Path` sieht, ist nicht der Name, den Windows auflöst**. Die Klasse ist
richtig benannt; die beiden Fälle gehen aber verschieden aus.

#### 22.1.1 Alternative Datenströme — **trägt.** Gemessen, nicht vermutet.

Der Weg, den T-157 vermutet hat (`…\rechnung.txt:evil.lnk`), ist **nicht** der gefährliche.
`has_indirect_extension` (`attachment.rs:269-280`) zerlegt den **ganzen** letzten
Namensbestandteil und nimmt dessen letztes Punktsegment; bei `bericht.txt:evil.lnk` ist das `lnk`,
und der Pfad fällt. Die Prüfung ist in dieser Richtung strenger als Windows, nicht schwächer.

Gefährlich ist die **umgekehrte** Schreibweise, und sie ist erreichbar. Gemessen gegen den
zeichengleichen Schnitt aus `attachment.rs`, auf Linux, gegen wirklich angelegte Dateien
(auf ext4 ist der Doppelpunkt ein gewöhnliches Namenszeichen):

```text
rechnung.lnk:harmlos.txt   existiert=true    -> ANGENOMMEN
rechnung.lnk::$DATA        existiert=true    -> ANGENOMMEN
bericht.txt:evil.lnk       existiert=true    -> abgewiesen: path_indirect_extension
rechnung.lnk               existiert=true    -> abgewiesen: path_indirect_extension
bericht.txt                existiert=true    -> ANGENOMMEN
rechnung.lnk:harmlos.txt   existiert=false   -> abgewiesen: path_missing
rechnung.lnk::$DATA        existiert=false   -> abgewiesen: path_missing
```

Und die Zerlegung dazu, ebenfalls gemessen:

```text
/x/rechnung.lnk::$DATA   file_name="rechnung.lnk::$DATA"   letztes Punktsegment "lnk::$DATA"  -> keine Umleitung
/x/rechnung.LNK::$DATA   file_name="rechnung.LNK::$DATA"   letztes Punktsegment "LNK::$DATA"  -> keine Umleitung
/x/verweis.url::$DATA    file_name="verweis.url::$DATA"    letztes Punktsegment "url::$DATA"  -> keine Umleitung
/x/rechnung.lnk::$DATA   mit nachgestelltem Punkt oder Leerzeichen: die Beschneidung greift, die Endung bleibt trotzdem unerkannt
```

**Der Angriffsweg, Schritt für Schritt.**

1. Ein Prozeß im Benutzerkonto legt irgendwo eine Verknüpfung `rechnung.lnk` an — oder benutzt
   eine, die es schon gibt. Eine `.lnk` trägt jedes Ziel, jedes Argument und jedes Symbol.
2. Derselbe Prozeß schreibt in `todo_attachment.target` den Wert
   `C:\…\rechnung.lnk::$DATA`. Zwei Wege stehen dafür offen und keiner führt durch ein
   Eingabefeld: die Route des Dienstes mit dem Sitzungsgeheimnis (VG-1) oder ein `UPDATE` über
   `sqlite3` auf die Bestandsdatei (VG-3). Das ist genau die Begründung, aus der die Prüfung im
   Öffnen-Befehl sitzt und nicht im Feld (20.3).
3. Der Benutzer klickt den Anhang an. Die Oberfläche zeigt die Rückfrage mit dem vollen Pfad —
   und `extensionOf` (`apps/web/src/lib/attachmentLabel.ts`) liest dort dasselbe letzte
   Punktsegment, also weder `lnk` noch eine Endung von der Liste `RUNS_WHEN_OPENED`. Der Dialog
   sagt „wird geöffnet".
4. `check_file` (`attachment.rs:332-359`) läuft: kein UNC, absolut (unter Windows ist
   `C:\…` absolut), **keine** Umleitungsendung (siehe Messung), und `is_file()` — NTFS löst
   `datei::$DATA` auf den unbenannten Datenstrom von `datei` auf, die Prüfung bejaht.
   Der Wert kommt als `Ok` zurück.
5. `takt_open_attachment_file` (`attachment.rs:402-409`) reicht ihn weiter. Der Aufrufpfad,
   nachgemessen im Quelltext der Kisten im lokalen Zwischenspeicher:
   `app.shell().open(…)` → `tauri_plugin_shell::Shell::open` (`tauri-plugin-shell-2.3.6/src/lib.rs:77`)
   → `tauri_plugin_shell::open::open(None, …)` (`…/src/open.rs:122-137`, Kommentar wörtlich:
   *„when running directly from Rust code we don't need to validate the path"*)
   → `::open::that_detached` (`open 5.4.2`) → unter Windows
   `powershell.exe -NoProfile -NonInteractive -Command "Start-Process -FilePath $env:OPEN_RS_TARGET"`
   und, wenn das fehlschlägt, `explorer.exe <Pfad>` (`open-5.4.2/src/windows.rs:66-92`).

**Was an diesem Weg gemessen ist und was nicht.** Gemessen ist Schritt 4 bis einschließlich
`check_file`: Der Wert wird angenommen, und zwar auch dann, wenn die Datei wirklich existiert.
Gemessen ist außerdem, daß die Endungsprüfung `lnk::$DATA` nicht als `lnk` sieht.
**Nicht gemessen** ist, ob `Start-Process` beziehungsweise `explorer.exe` die Verknüpfung dann
auch wirklich ausführt: Die Klassenauflösung von ShellExecute geht über die Endung der ganzen
Zeichenkette, und was sie mit `.lnk::$DATA` tut, ist auf einem Linux-Läufer nicht zu messen.

**Warum das an der Bewertung nichts ändert.** Die Datei sagt über sich selbst
(`attachment.rs:87-114`): *„geprüft wird der Name, den Windows auflöst, nicht der gespeicherte"*.
Diese Zusage ist gemessen falsch, sobald ein Doppelpunkt im Namen steht — `is_file()` nimmt die
Win32-Auflösung, `has_indirect_extension` nimmt die Zeichenkette, und die beiden reden über
verschiedene Dateien. Eine Kontrolle, deren Voraussetzung nachweislich nicht gilt, ist zu
schließen; der Nachweis, daß der Rest der Kette daraus einen Prozeßstart macht, ist nicht die
Bedingung dafür. Es ist derselbe Satz wie im Nachtrag zu R-21: Der Läufer ist Linux, und die
Zweige, die nur unter Windows etwas anderes tun, sind die, die niemand betritt.

**Das Gegenmittel, so genau, daß es ohne Rückfrage baubar ist.** Neue Auflage **A-A-28**:

* Ein neuer Ablehnungsgrund `Rejection::PathStreamSeparator` mit dem Schlüssel
  `path_stream_separator`, eingetragen in die Aufzählung (`attachment.rs:148-165`) und in
  `key()` (`attachment.rs:169-187`). Der deutsche Satz dazu gehört in dieselbe Zuordnung der
  Oberfläche, in der die vierzehn anderen Schlüssel schon stehen.
* Eine eigene Funktion neben `has_indirect_extension`:

  ```rust
  /// Trägt der letzte Namensbestandteil einen Doppelpunkt? (A-A-28.)
  ///
  /// Unter Windows ist der Doppelpunkt der Trenner eines alternativen
  /// Datenstroms: `datei::$DATA` löst NTFS auf den unbenannten Datenstrom von
  /// `datei` auf, `datei:strom` auf einen benannten. `Path` weiß davon nichts
  /// und behandelt ihn als gewöhnliches Zeichen — womit die Endungsprüfung
  /// über einen anderen Namen urteilt als den, den das Betriebssystem öffnet.
  ///
  /// Gefragt wird nur der **letzte** Bestandteil, damit der Laufwerksbuchstabe
  /// (`C:`) nicht mitfällt; er ist ein Präfix und kein Namensbestandteil.
  fn has_stream_separator(path: &Path) -> bool {
      match path.file_name().and_then(|name| name.to_str()) {
          Some(name) => name.contains(':'),
          None => false,
      }
  }
  ```

* Aufgerufen in `check_file` **nach** `is_absolute` und **vor** `has_indirect_extension`. Nach
  `is_absolute`, weil sonst unter Linux ein Windows-Laufwerkspfad (`C:\…`) mit dem neuen Grund
  statt mit `path_not_absolute` abgewiesen würde und die Meldung in die Irre führte. Vor
  `has_indirect_extension`, weil ein Name mit Doppelpunkt ohnehin nicht mehr beurteilt werden
  kann — welche Endung er trägt, ist dann keine sinnvolle Frage mehr.
* **Auf jeder Plattform**, nicht unter `#[cfg(windows)]`. Dieselbe Begründung wie bei `is_unc`
  und `effective_file_name` (A-A-10): Ein Zweig, der nur auf einem Betriebssystem etwas tut, ist
  auf dem Läufer der Reihe unmeßbar.
* **Der Preis, ausgeschrieben.** Unter Linux und macOS ist der Doppelpunkt ein zulässiges
  Namenszeichen, und `Besprechung 10:30.pdf` ist kein erfundener Name. Takt öffnet eine solche
  Datei danach nicht mehr; sie bleibt als Anhang sichtbar, der Pfad steht weiter da, und der
  Benutzer öffnet sie über seinen Dateimanager. Unter Windows — der Plattform, für die Takt
  gebaut ist (`WindowsUser` im Export, Outlook-Add-in) — kostet die Regel **nichts**: Ein
  Doppelpunkt kann dort in keinem gültigen Dateinamen vorkommen.
* **Dieselbe Regel in `extensionOf`** (`apps/web/src/lib/attachmentLabel.ts`), aus demselben
  Grund wie bei A-A-5′: Ein Bestandteil mit Doppelpunkt hat keine beurteilbare Endung, und der
  Dialog darf für ihn nicht „wird geöffnet" sagen. Da `check_file` den Wert ohnehin abweist, ist
  das Bequemlichkeit und nicht Grenze — es kostet eine Zeile und hält die beiden Seiten
  zusammen.

**Und wie das auf Linux nachweisbar ist — der Kern der Auflage.** Vier Fälle, alle unter Linux
lauffähig, drei davon **rot vor der Behebung**:

| Fall | Vorher | Nachher |
|---|---|---|
| Wirklich angelegte Datei `rechnung.lnk:harmlos.txt`, absoluter Pfad | **`Ok`** — gemessen | `path_stream_separator` |
| Wirklich angelegte Datei `rechnung.lnk::$DATA`, absoluter Pfad | **`Ok`** — gemessen | `path_stream_separator` |
| Wirklich angelegte Datei `bericht.txt:evil.lnk` | `path_indirect_extension` | `path_stream_separator` |
| Nicht vorhandener Pfad `/…/rechnung.lnk::$DATA` | `path_missing` | `path_stream_separator` (die Regel steht vor der Existenzprüfung) |
| Gegenprobe: `bericht.txt`, `programm.exe` — wirklich angelegt | `Ok` | `Ok` (unverändert) |

Die ersten beiden Zeilen sind der Beleg: Sie fallen **heute** durch die Kontrolle, auf dem
Läufer, den es gibt, ohne Windows und ohne Mutmaßung. Ein Prüffall, der sie mißt, mißt die
Behebung und nicht eine ohnehin schon richtige Eigenschaft — das ist die Forderung, die T-160
für A-A-5′ mit seiner Gegenprobe erfüllt hat, und sie gilt hier genauso.

Zusätzlich, unter `#[cfg(windows)]` und damit erst auf dem Windows-Läufer: eine wirklich
angelegte `x.lnk` und die Zusicherung, daß `Path::new("…x.lnk::$DATA").is_file()` **wahr** ist.
Dieser eine Fall belegt die Win32-Auflösung selbst und damit die gebrochene Voraussetzung; er ist
das Gegenstück zu den drei Fällen, die T-160 für den nachgestellten Punkt geschrieben hat.

#### 22.1.2 8.3-Kurznamen — **trägt hier nicht.** Und hier steht, warum.

Gemessen an derselben Zerlegung:

```text
/x/RECHNU~1.LNK    -> Umleitung erkannt
/x/VERWEI~1.URL    -> Umleitung erkannt
/x/START~1.PIF     -> Umleitung erkannt
/x/ORDNER~1.SCF    -> Umleitung erkannt
/x/APP~1.DESKTOP   -> Umleitung erkannt
/x/APP~1.DES       -> NICHT erkannt
```

Drei Gründe, und der erste trägt allein:

1. **Vier der fünf Umleitungsendungen sind genau drei Zeichen lang.** `lnk`, `url`, `pif`, `scf`
   überstehen die 8.3-Verkürzung unverändert; verglichen wird ohnehin ohne Rücksicht auf Groß-
   und Kleinschreibung (`attachment.rs:278`). Der Kurzname eines Umleiters trägt dieselbe Endung
   wie sein Langname und fällt an derselben Zeile.
2. **Nur `desktop` verkürzt sich** — zu `DES`, und das wird nicht erkannt. Ein `.desktop` tut
   unter Windows aber nichts; es steht auf der Liste für den XDG-Fall unter Linux, und unter
   Linux gibt es keine 8.3-Namen. Es gibt damit kein Paar aus Plattform und Endung, bei dem der
   Kurzname zugleich durchkommt **und** etwas bewirkt.
3. Nachrangig und nicht tragend: Auf aktuellen Windows-Installationen ist die Erzeugung von
   8.3-Namen nicht mehr überall eingeschaltet. Darauf stützt sich diese Bewertung nicht — sie
   stützt sich auf Punkt 1.

**Was trotzdem festzuhalten ist:** Punkt 1 ist eine Eigenschaft der *heutigen* Liste und keine
der Prüfung. Trüge `INDIRECT_EXTENSIONS` eines Tages einen Windows-Umleiter mit mehr als drei
Zeichen — `appref-ms` etwa, der ClickOnce-Starter —, wäre der Kurzname (`.APP`) sofort ein
Vorbeiweg. Deshalb neue Auflage **A-A-30**: Ein Prüffall hält fest, daß jeder Eintrag in
`INDIRECT_EXTENSIONS` außer `desktop` höchstens drei Zeichen lang ist, mit dem Grund im Text des
Prüffalls; und die vier gemessenen Kurznamen oben stehen als Fälle daneben. Beides läuft auf
Linux, beides kostet zehn Zeilen, und beides wird rot, wenn jemand die Liste erweitert, ohne an
8.3 zu denken.

### 22.2 O-DI — 28 gegen 22: **22 stimmte.**

Nachgezählt: Die Tabelle in 20.2 trägt **22** Datenzeilen (`docs/bedrohungsmodell.md`, Kopfzeile
plus Trennzeile plus 22). Die Zahl **28 hat in diesem Dokument nie einen Gegenstand gehabt** —
auch nicht als Vereinigung mit der Festpunkttabelle darunter: Von deren elf Zeilen sind acht
Wiederholungen aus der Tabelle, drei sind neu (`http://example.org`, `HTTP://Example.ORG/Pfad`,
`https://example.org/a b`), macht 25. Es gibt keine Menge von 28 Zeichenketten in 20.2.

**T-160 hat richtig gemessen**, gegen die 22, und die Abweichung gemeldet statt sie zu übergehen.
`attachment.rs:479` fährt eine `[( &str, Option<Rejection>); 22]` — die Zahl steht dort im Typ,
was der beste Ort dafür ist.

Berichtigt wurden vier Stellen in diesem Dokument, jede mit einer Marke, damit die Änderung
sichtbar bleibt und nicht als stille Umschreibung des Protokolls durchgeht:

| Stelle | Vorher | Jetzt |
|---|---|---|
| 20.2, Fließtext über der Tabelle | „gegen 28 Zeichenketten gefahren" | „gegen die **22** Zeichenketten der folgenden Tabelle" |
| **A-A-2**, Spalte Messung (20.7) | „fährt die 28 Zeichenketten aus 20.2" | „fährt die **22** Zeichenketten aus 20.2" |
| 21.2, A-A-2 abweichend erfüllt | „Ich habe die 28 Zeichenketten selbst gefahren" | „die 22" |
| 21.3, Messung 1 | „die 28 Zeichenketten aus 20.2" (und zwei Sätze später „von den 22 Zeilen") | „die 22 Zeichenketten aus 20.2" |

Eine fünfte Stelle steht außerhalb meiner Hoheit und bleibt als Befund T-164-5:
`apps/desktop/src-tauri/src/attachment.rs:41` sagt im Dateikopf ebenfalls „T-145 hat 28
Zeichenketten gegen drei Fassungen gefahren".

**Wie so etwas künftig auffällt — und warum es diesmal nicht aufgefallen ist.** Der Fehler ist
harmlos, seine Bauart nicht: Eine Auflage nennt eine Zahl, die Quelle trägt eine andere, und ein
Nachweis kann gegen *beide* grün sein — gegen 22, weil es 22 sind, und gegen „alle 28", weil
niemand nachzählt. T-156 hat im selben Satz „28" und „von den 22 Zeilen" geschrieben, und der
Widerspruch stand vier Absätze lang unbemerkt in einem Dokument, das sonst jede Zahl belegt. Das
ist nicht Unachtsamkeit, sondern die vorhersehbare Folge davon, daß eine Zahl **abgeschrieben**
statt **abgefragt** wird — dieselbe Sache, an der `proof:codepoints` seinerzeit gescheitert wäre
und die es heute verhindert, indem es die Klasse aus der Domäne liest.

Die Gegenmaßnahme ist deshalb dieselbe Bauart und nicht mehr Sorgfalt: **Eine Auflage soll keine
Zahl nennen, die sie nicht selbst zählt.** Wo eine Menge gemeint ist, ist die Menge zu benennen
(„die Zeichenketten der Tabelle in 20.2") und die Zahl höchstens in Klammern dahinter. Im Code
gehört sie in den Typ, wie T-160 es getan hat — `[( &str, Option<Rejection>); 22]` wird rot, wenn
jemand eine Zeile hinzufügt oder wegnimmt, und niemand muß dafür ein Dokument gelesen haben.
Diese Regel ist der einzige dauerhafte Ertrag von O-DI und steht deshalb hier und nicht nur im
Bericht.

### 22.3 O-DD — der Dateiname in der Protokollzeile: **bestätigt**, mit einer Berichtigung der Begründung

**Bewertet, nicht angenommen.** Die Zeile steht in
`apps/local-api/src/access/attachment-store.ts:404-408` und lautet im Kern
`…liegt weiter im Anwendungsdatenverzeichnis: ${name}`.

Der Wert `name` ist gegenstandslos für den Kunden, und der Grund ist **stärker** als der im
Kommentar genannte:

1. Der Kommentar sagt: „Er ist nach A-A-17 erzeugt und hat keinen Bezug zur Quelldatei."
   Das stimmt für Namen, die dieser Adapter erzeugt hat (`attachment-store.ts:295`,
   `randomUUID().replaceAll('-','')` plus eine feste Endung; T-156 hat in 21.3 Messung 7
   nachgemessen, daß zwei Kopien derselben Quelle verschiedene Namen tragen und keiner etwas vom
   Namen der Quelle enthält). Als **Zusage** trägt es nicht: `removeImage` bekommt seinen Namen
   aus `todo_attachment.target`, und in diese Spalte kann geschrieben werden, ohne durch diesen
   Adapter zu gehen (VG-1, VG-3) — genau das begründet an anderer Stelle in derselben Datei die
   erneute Prüfung beim Lesen.
2. Was tatsächlich trägt, steht drei Zeilen über der Protokollzeile:
   `removeImage` ruft zuerst `pathOf(name)` (`attachment-store.ts:380-381`) und verläßt die
   Methode mit `unknown_name`, wenn der Name nicht `GENERATED_NAME_SHAPE`
   (`attachment-store.ts:132`, `/^[0-9a-f]{32}\.(?:png|jpg|gif|webp)$/`) erfüllt. **Die
   Protokollzeile ist unerreichbar für jeden Namen, der nicht 32 Kleinhexziffern plus eine von
   vier festen Endungen ist.** Das ist eine Formzusage am Aufrufort, kein Vertrauen in den
   Erzeuger — und sie hält auch dann, wenn jemand `todo_attachment.target` mit einem Kundennamen
   überschreibt.

**Ergebnis: unbedenklich.** Was die Zeile preisgibt, ist die Tatsache, daß ein Bildanhang
existierte und seine Kopie liegengeblieben ist, plus 38 oder 39 Zeichen ohne Wortinhalt. Wer das
Protokoll lesen kann, läuft im selben Benutzerkonto und kann das Bildverzeichnis ohnehin
auflisten (VG-3); ein Zuwachs an Auskunft entsteht nicht. Der Nutzen — die liegengebliebene Datei
ist ohne den Namen nicht wiederzufinden — ist der, den T-159 beschrieben hat.

**Die Berichtigung, und sie gehört zu O-BD.** Der Kommentar an der Stelle stützt sich auf die
falsche Hälfte. Wer ihn liest und daraus schließt, ein Wert im Protokoll sei schon deshalb
harmlos, weil Takt ihn erzeugt hat, baut die nächste Zeile ohne den Riegel. Der Satz müßte
lauten: *„Der Name darf in die Zeile, weil die Methode für jeden anderen Namen vorher mit
`unknown_name` verlassen wird."* Als Befund geführt: **T-164-4**, Hinweis, zuständig domain-dev.

### 22.4 O-BD — die zwei Zeilen aus T-132, und die Hälfte, die in 21.5 fehlte

Beide Aussagen sind in **21.5** eingetragen und gegen den heutigen Code nachgeprüft:
`errorCodeOf` (`packages/storage/src/migration.ts:166`) und `pair()`
(`apps/local-api/src/startup.ts:88`) verengen `sqlite` und `code` an der Quelle nach Gestalt und
an der Zusammensetzung nach Typ; `REASON_SHAPE` (`apps/local-api/src/logger.ts:63`) begrenzt
Gestalt und Menge, nicht Herkunft. Damit ist O-BD sachlich erledigt.

**Eine Hälfte fehlte dort, und sie ist die wichtigere.** 21.5 beschreibt den Riegel, ohne zu
sagen, **worauf** er liegt. Er liegt auf `reason` und auf nichts sonst:

* `lifecycle` (`logger.ts:99-105`) prüft `reason` gegen `REASON_SHAPE` und ersetzt ihn durch
  `unclassified`, wenn die Gestalt nicht paßt.
* `message` — der deutsche Satz — geht **ungeprüft** in die Zeile. Das einzige, was ihn berührt,
  ist `redactSecrets` auf der fertigen Zeile (`logger.ts:85`), und das ist ein Riegel gegen genau
  ein Geheimnis, keine Gestaltprüfung.

Die Zusage lautet also nicht „im Protokoll steht nichts, was nicht wie ein technischer Schlüssel
aussieht", sondern: **„im Feld `reason` steht nichts, was nicht wie ein technischer Schlüssel
aussieht; für `message` bürgt allein die Aufrufstelle."** Das ist die richtige Bauart — aber sie
verlangt, daß jede Aufrufstelle es weiß, und drei Stellen setzen heute schon Werte in `message`
ein:

| Stelle | Eingesetzter Wert | Bewertung |
|---|---|---|
| `apps/local-api/src/access/attachment-store.ts:404` | der erzeugte Bildname | unbedenklich, siehe 22.3 — die Form ist am Aufrufort erzwungen |
| `apps/local-api/src/app.ts:317` | `c.req.method`, `c.req.path`, `stored.code` | **Anfragetext im Protokoll.** Der Pfad kommt aus der Anfrage und damit von jedem lokalen Prozeß (VG-1) |
| `apps/local-api/src/app.ts:328` | `c.req.method`, `c.req.path` | dieselbe Sache im Netz für unerwartete Würfe |

Zu den beiden Zeilen in `app.ts`, damit die Bewertung vollständig ist und nicht größer wird, als
sie ist: Die Zeile entsteht über `JSON.stringify` (`logger.ts:84`), ein Steuerzeichen kann sie
also nicht aufbrechen — eine Protokoll-Einschleusung ist ausgeschlossen. `stripQuery` läuft hier
nicht, wird aber auch nicht gebraucht, weil `c.req.path` den Abfrageteil nicht enthält. Erreichbar
sind beide Stellen nur, wenn eine bestehende Route wirklich wirft; ein erfundener Pfad ergibt
einen 404 und keine Zeile. Was bleibt, ist ein Pfadbestandteil aus fremder Hand — eine Kennung,
die jemand frei wählen kann — in einem Protokoll, das ein Benutzer im Fehlerfall weitergibt.
Schwere: gering, **Hinweis T-164-6**, zuständig domain-dev. Das Gegenmittel ist eine Zeile: den
Pfad durch das gematchte Routenmuster ersetzen (`c.req.routePath`) statt durch den tatsächlichen
Pfad. Der Nutzen für die Fehlersuche ist derselbe, der fremde Text ist weg.

Die Auflage **A-V-21** (dritter Parameter von `lifecycle` als geschlossene Vereinigung) bleibt
offen und wird durch diesen Abschnitt eher dringender: Sie verlegt die Zusage für `reason` von
der Gestalt auf die Herkunft. Für `message` gibt es keine entsprechende Auflage, und mit drei
Einsetzstellen ist es Zeit für eine — als **A-A-31** geführt, siehe 22.7.

### 22.5 Wiedervorlage V-01 / T-156-2 — mißt die Fallliste etwas?

**Der Ausgangsbefund ist behoben.** `attachment.rs` hatte keinen einzigen `#[cfg(test)]`-Block;
sie hat jetzt einen, und er steht **in** der Datei, wie A-A-25 es verlangt.
`cargo test --lib` nachgemessen: **50 bestanden, 0 fehlgeschlagen** auf diesem Läufer, davon 19
in `attachment::tests`. Mit den drei `#[cfg(windows)]`-Fällen sind es 53.

**Und er mißt etwas.** T-160 hat den Nachweis nicht behauptet, sondern geführt: eine Testhilfe,
die die Fassung **vor** T-157 nachbaut (`attachment.rs:771-776`), und ein Fall, der verlangt, daß
alt und neu bei genau neun Eingaben auseinanderfallen (`attachment.rs:779-822`). Ein Fall, der
vor der Behebung ebenfalls grün gewesen wäre, ist damit ausgeschlossen — und die reinen
Positivfälle, die tatsächlich nichts über die Behebung sagen, stehen ausdrücklich **nicht** in
der Gegenprobe, sondern daneben. Das ist genau die Trennung, die T-156-2 verlangt hat.

Auflage für Auflage gegen meine eigene Forderung aus T-156-2:

| Verlangt | Gemessen | Urteil |
|---|---|---|
| **A-A-2** — fünf Bedingungen, Steuerzeichen **vor** dem Zerlegen | `schema_und_normalform_gegen_die_22_zeilen_aus_20_2` (alle 22 mit dem erwarteten Grund), `leerer_und_zu_langer_verweis` (2 048 genau und 2 049), `steuerzeichen_werden_vor_dem_zerlegen_erkannt_nicht_erst_danach`, `leerer_wirt_wird_nicht_zum_ersten_pfadstueck`, `zugangsdaten_im_wirt_…` | **erfüllt.** Der Reihenfolge-Fall mißt wirklich die Reihenfolge: Liefe die Steuerzeichenprüfung erst nach dem Zerlegen, ergäbe `java<LF>script:` den Grund `link_scheme_rejected` statt `link_control_character`. |
| **A-A-3** — Festpunkt, idempotent | `festpunkttabelle_rohfassung_abgewiesen_normalform_angenommen_und_idempotent`, alle zehn Zeilen | **erfüllt** |
| **A-A-4** — UNC, absolut, Länge, Steuerzeichen | `unc_ueber_die_schreibweise_auf_jeder_plattform` (vier Schreibweisen), `ein_windows_laufwerkspfad_ist_unter_linux_nicht_absolut_…`, `leerer_zu_langer_und_steuerzeichenbehafteter_pfad`, `relativer_pfad_ist_path_not_absolute` | **erfüllt mit einer Einschränkung**, siehe T-164-3 |
| **A-A-5 / A-A-5′** — die fünf Umleitungen, am beschnittenen Namen | zehn Positivfälle, sechs Gegenfälle, zwei Reihenfolgefälle, ein Fall gegen eine wirklich angelegte `.lnk`, die Gegenprobe | **erfüllt, und es ist die beste Stelle des Blocks** |
| **A-A-8** — der abgewiesene Wert steht in **keiner** Meldung | **nichts.** Kein Prüffall berührt `Rejection::key()`; die Aufzählung und ihre fünfzehn Schlüssel sind ungemessen | **nicht erfüllt** — Befund T-164-2 |
| **A-A-10** — die Pfadfälle laufen auf Windows | drei Fälle unter `#[cfg(windows)]`, geschrieben und plausibel | **bedingt erfüllt** — Befund T-164-3 |

#### T-164-2 — A-A-8 ist ungemessen geblieben

`Rejection::key()` (`attachment.rs:169-187`) ist die Schnittstelle zwischen der Hülle und der
Oberfläche: Was hier zurückkommt, entscheidet, welchen deutschen Satz der Benutzer liest. Beide
Befehle reichen ihn wörtlich weiter (`attachment.rs:375` und `attachment.rs:403`). Kein Prüffall
berührt ihn. Zwei Dinge sind damit ungesichert, und beide sind still:

* **Ein vertauschter Schlüssel** — `Rejection::PathUnc => "path_not_absolute"` — bliebe grün.
  Der Benutzer bekäme bei einem UNC-Pfad den Satz für einen relativen Pfad zu sehen, und die
  einzige Stelle, an der jemand von dem Anmeldeversuch gegen einen fremden Rechner erfährt, sagt
  etwas anderes.
* **Die Zusage selbst** — „ohne den abgewiesenen Wert" — steht nur im Kommentar
  (`attachment.rs:142-147`). Sie ist heute wahr, weil `key()` `&'static str` zurückgibt; sie wäre
  in dem Augenblick nicht mehr wahr, in dem jemand aus Hilfsbereitschaft ein `format!` daraus
  macht.

Auflage **A-A-29**: Ein Prüffall hält jede Ausprägung von `Rejection` gegen ihren Schlüssel, in
einer im Prüffall **ausgeschriebenen** Liste von fünfzehn Paaren, und prüft zusätzlich, daß die
Schlüssel paarweise verschieden sind. Ein sechzehnter Ablehnungsgrund — etwa der aus A-A-28 —
macht ihn rot, auch wenn er ordentlich eingetragen ist. Dieselbe Bauart wie A-A-20′, und aus
demselben Grund: Eine geschlossene Aufzählung, deren Vollständigkeit niemand mißt, ist eine
Verabredung und keine Zusage. Der Prüffall läuft auf Linux und braucht kein Dateisystem.

#### T-164-3 — zwei Zusagen über die Windows-Fälle, die nicht halten

**Erstens: die Windows-Bahn geht erst am Etikett auf.** `release.yml` ist der **einzige** Ablauf
in `.github/workflows/`, und er löst nur auf `v[0-9]+.[0-9]+.[0-9]+` oder von Hand aus
(`release.yml:68-80`). `cargo test --lib` auf `windows-2022` steht im Bau-Auftrag
(`release.yml:372`). Die drei `#[cfg(windows)]`-Fälle aus T-160 werden auf keinem anderen Läufer
**auch nur übersetzt**: Ein Tippfehler darin fällt frühestens bei der nächsten Auslieferung auf,
und dann in dem Auftrag, der das Erzeugnis baut. Das ist wörtlich der Zustand, vor dem der
Nachtrag zu R-21 warnt, eine Ebene höher: Es gibt keinen grünen Lauf auf dem falschen
Betriebssystem, es gibt gar keinen.

**Zweitens: `release.yml:361-368` sagt die Unwahrheit über das, was es mißt.** Dort steht,
`Prefix::UNC` und seine drei Geschwister gebe es nur unter Windows und dieser Auftrag sei „der
einzige Ort, an dem sie gemessen werden". Sie werden auch dort nicht gemessen. `is_unc`
(`attachment.rs:301-312`) kehrt vorher zurück: Jede Zeichenkette, die eines dieser vier Präfixe
erzeugt — `\\server\…`, `\\?\…`, `\\?\UNC\…`, `\\.\…` und dieselben mit Schrägstrichen —, beginnt
zwangsläufig mit zwei Trennern und fällt schon an `value.starts_with("\\\\") || starts_with("//")`.
Der `match`-Zweig über `Component::Prefix` kann das Ergebnis **auf keiner Plattform** ändern. Das
ist kein Fehler in der Sache — die Prüfung ist richtig und die Doppelung mit Absicht dokumentiert
(`attachment.rs:290-300`) —, aber die Zusage im Ablauf beschreibt eine Messung, die es nicht
gibt.

Auflage **A-A-32**: `cargo test --lib` läuft auf `windows-2022` in einem Ablauf, der bei jedem
Stand aufgeht und nicht erst am Etikett; und der Kommentar in `release.yml` sagt, was der
Windows-Läufer wirklich mißt, nämlich die **Namensauflösung** (nachgestellter Punkt, Leerzeichen,
Doppelpunkt nach A-A-28) und nicht `Component::Prefix`.

#### Urteil der Wiedervorlage

**V-01 / T-156-2: freigegeben mit Auflage.** Der Block existiert, er steht am richtigen Ort, er
deckt vier der fünf benannten Auflagen, und er mißt die Behebung nachweislich statt sie zu
wiederholen — die Gegenprobe ist die beste Arbeit an dieser Grenze bisher. Die zwei Auflagen sind
**A-A-29** (A-A-8, unit-tester, Linux, klein) und **A-A-32** (die Windows-Bahn, Orchestrator).
Keine der beiden hindert die Freigabe des Prüfblocks; beide verhindern, daß daraus wieder eine
Zusage wird, die niemand einlöst.

### 22.6 Befunde dieser Prüfung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-164-1** | **muß** | **Ein Doppelpunkt im Dateinamen hebt A-A-5 auf.** Gemessen gegen den zeichengleichen Schnitt aus `attachment.rs`, gegen wirklich angelegte Dateien: `…/rechnung.lnk:harmlos.txt` und `…/rechnung.lnk::$DATA` werden **angenommen**. Unter NTFS löst `datei::$DATA` auf den unbenannten Datenstrom von `datei` auf; `is_file()` folgt dieser Auflösung, `has_indirect_extension` nicht. Weg in den Bestand: VG-1 oder VG-3, wie bei T-156-1. Gegenmittel und Nachweis vollständig in 22.1.1, Auflage **A-A-28**. | frontend-dev |
| **T-164-2** | **muß** | **A-A-8 ist ungemessen.** `Rejection::key()` hat keinen Prüffall; ein vertauschter Schlüssel bliebe grün und zeigte dem Benutzer bei einem UNC-Pfad den Satz für einen relativen. Auflage **A-A-29**. | unit-tester |
| **T-164-3** | **muß** | **Die Windows-Prüffälle laufen in keinem Ablauf, der vor der Auslieferung aufgeht**, und `release.yml:361-368` sagt, es messe `Component::Prefix` — was `is_unc` konstruktiv nie erreicht. Auflage **A-A-32**. | Orchestrator |
| **T-164-4** | Hinweis | **Die Begründung im Kommentar von `attachment-store.ts:399-402` stützt sich auf die falsche Hälfte.** Der Name ist nicht deshalb harmlos, weil Takt ihn erzeugt hat, sondern weil `pathOf` die Methode für jeden anderen Namen vorher verläßt. Die Bewertung selbst ist **bestätigt** (22.3). | domain-dev |
| **T-164-5** | Hinweis | **`attachment.rs:41` trägt die falsche Zahl 28** (siehe 22.2). Ein Satz im Dateikopf. | frontend-dev |
| **T-164-6** | Hinweis | **`app.ts:317` und `app.ts:328` setzen `c.req.path` in `message` ein** — fremder Text in einem Protokoll, das ein Benutzer weitergibt. Kein Einschleusen möglich (`JSON.stringify`), Erreichbarkeit setzt einen echten Wurf voraus. Gegenmittel: `c.req.routePath` statt `c.req.path`. Auflage **A-A-31**. | domain-dev |
| **T-164-7** | Hinweis | **Semgrep Guardian zum elften, 42Crunch zum zehnten Mal ohne Werkzeug.** Die Lieferkette ist nie gemessen worden, und seit `v0.1.0` liegen unsignierte Binärdateien in einer Veröffentlichung. Beschaffungsentscheidung. | Auftraggeber |
| **T-164-8** | Hinweis | **`temp-dir` in `attachment.rs:461`** (Semgrep, INFO): Der Prüfhelfer aus T-160 legt Verzeichnisse unter dem System-Temp mit vorhersagbarem Namen an (Prozeßkennung plus Zähler) und räumt nicht auf. In einem Prüflauf harmlos, in einem geteilten Läufer eine Fläche für einen Wettlauf. Kein Produktivcode. | unit-tester, bei Gelegenheit |

### 22.7 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-28** | `check_file` weist jeden Pfad ab, dessen **letzter Namensbestandteil** einen Doppelpunkt trägt — auf jeder Plattform, mit eigenem Ablehnungsgrund `path_stream_separator`, nach der Absolutheitsprüfung und **vor** der Endungsprüfung. Der Doppelpunkt ist unter Windows der Trenner eines alternativen Datenstroms; `Path` kennt ihn nicht, und damit urteilt die Endungsprüfung über einen anderen Namen als den, den das Betriebssystem öffnet. Dieselbe Regel für `extensionOf` in der Oberfläche. | Auf **Linux**, gegen wirklich angelegte Dateien: `rechnung.lnk:harmlos.txt` und `rechnung.lnk::$DATA` — heute `Ok`, danach abgewiesen; `bericht.txt:evil.lnk` — heute `path_indirect_extension`, danach `path_stream_separator`; ein nicht vorhandener Pfad mit Doppelpunkt fällt **vor** der Existenzprüfung; `bericht.txt` und `programm.exe` bleiben angenommen. Unter `#[cfg(windows)]` zusätzlich: eine wirklich angelegte `x.lnk`, und `Path::new("…x.lnk::$DATA").is_file()` ist **wahr**. |
| **A-A-29** | Ein Prüffall hält jede Ausprägung von `Rejection` gegen ihren Schlüssel, in einer im Prüffall **ausgeschriebenen** Liste, und prüft die Schlüssel auf paarweise Verschiedenheit. Ein neuer Ablehnungsgrund macht ihn rot, auch wenn er ordentlich eingetragen ist. | Der Prüffall selbst, in `attachment.rs`, ohne Dateisystem. |
| **A-A-30** | Ein Prüffall hält fest, daß jeder Eintrag in `INDIRECT_EXTENSIONS` außer `desktop` höchstens **drei** Zeichen lang ist, und nennt im Text den Grund: Ein längerer Windows-Umleiter wäre über seinen 8.3-Kurznamen erreichbar. Die vier gemessenen Kurznamen stehen als Fälle daneben. | `RECHNU~1.LNK`, `VERWEI~1.URL`, `START~1.PIF`, `ORDNER~1.SCF` werden erkannt; die Längenprüfung über die Liste selbst. Beides auf Linux. |
| **A-A-31** | Kein Aufruf von `lifecycle` setzt einen Wert aus einer **Anfrage** in `message` ein. Wo ein Ort in der Meldung gebraucht wird, steht das gematchte Routenmuster und nicht der tatsächliche Pfad. `message` trägt keinen Riegel — die Zusage liegt bei der Aufrufstelle, und das gehört an der Aufrufstelle geprüft. | Ein Nachweislauf über die Aufrufe von `.lifecycle(` prüft, daß keine Vorlagenzeichenkette `c.req.path` oder einen anderen Anfragewert einsetzt. Dieselbe Bauart wie `proof:callers`. |
| **A-A-32** | `cargo test --lib` läuft auf `windows-2022` in einem Ablauf, der bei jedem Stand aufgeht und nicht erst an einem Etikett. Der Kommentar im Ablauf benennt, was der Windows-Läufer wirklich mißt: die **Namensauflösung** (nachgestellter Punkt, Leerzeichen, Doppelpunkt), nicht `Component::Prefix`. | Der Ablauf; und eine Gegenprobe, die einen absichtlich falschen `#[cfg(windows)]`-Fall rot werden läßt, bevor irgendetwas gebaut wird. |

### 22.8 Urteil dieser Prüfung

**Die Grenze VG-11 hat sich seit T-156 an drei von vier Stellen verbessert, und die vierte war
schon vorher da.** Der Prüfblock in `attachment.rs` ist geschrieben, er steht am richtigen Ort,
und er mißt die Behebung statt sie zu wiederholen — die Gegenprobe von T-160 ist der Nachweis, den
T-156-2 verlangt hat, und nicht sein Ersatz. Die Zahl aus O-DI stimmte auf der Seite, auf der
gemessen wurde. Der Wert in der neuen Protokollzeile ist unbedenklich, und er ist es aus einem
besseren Grund als dem, der danebensteht.

**Freigegeben wird trotzdem nicht.** Der nachgestellte Punkt hatte einen Nachbarn, und der
Nachbar ist gemessen offen: Zwei Zeichenketten, die auf einem Linux-Läufer gegen den
ausgelieferten Code laufen, kommen heute durch eine Kontrolle, deren einziger Zweck es ist, sie
aufzuhalten. Daneben stehen zwei Zusagen, die nicht halten — A-A-8 ist ungemessen, und die
Windows-Bahn geht erst an einem Etikett auf.

Der wiederkehrende Satz dieses Dokuments gilt zum vierten Mal, und er hat diesmal eine schärfere
Fassung: **Eine Auflage, die einen Prüffall nennt, ist erst erfüllt, wenn der Prüffall in einem
Ablauf steht — und der Ablauf muß auf dem Betriebssystem laufen, über das die Auflage etwas
behauptet.**

**Urteil: Nacharbeit.** Nach Behebung von T-164-1, T-164-2 und T-164-3 ist diese Grenze
freigabefähig. **V-01 / T-156-2 einzeln: freigegeben mit Auflage** (A-A-29 und A-A-32).

## 23. Prüfung T-176 (2026-09-05) — die verkleinerte Schranke, der Doppelpunkt in gebauter Form, und der einzige Lauf, der ohne Klick löscht

**Anlaß.** Drei Nachschauen vor der Abnahme von Welle Z, alle drei an Stellen, an denen in
Welle Y etwas an einer Sicherheitsgrenze **kleiner** oder **selbsttätig** geworden ist:

1. **O-ET, erste Hälfte.** `proof:shell-surface` schließt seit T-173 `#[cfg(test)] mod`-Blöcke
   von der Prüfung „keine zweite fremde Adresse im Rust-Anteil" aus. E-082 Punkt 4 verlangt
   dafür ausdrücklich den Blick dieser Rolle.
2. **O-ET, zweite Hälfte.** A-A-28 (Doppelpunkt im Dateinamen) ist gebaut. Zu prüfen ist nicht,
   ob die Funktion existiert, sondern ob **Reihenfolge** und **Plattformunabhängigkeit** die
   der Auflage sind — und ob der dritte Zustand der Rückfrage aus T-167 dieselbe Wahrheit sagt
   wie die Hülle oder eine zweite daneben aufmacht.
3. **O-EN.** `sweepOrphanedImages` ist die **einzige** Stelle in Takt, die Kundenmaterial ohne
   einen Klick des Benutzers löscht.

### 23.0 Stand der Werkzeuge

**Semgrep Guardian und 42Crunch wurden nicht erneut versucht** (E-079 Punkt 3, T-B06). Ein
elfter Fehlversuch erzeugte keinen Erkenntnisgewinn; die Beschaffungsfrage steht seit T-164-7
beim Auftraggeber und ist keine, die eine Prüfrolle durch Wiederholung löst.

**Der neue Prüfauftrag ist die Antwort auf A-A-32, und er ist die richtige.**
`.github/workflows/pruefung.yml` fährt `cargo test --lib` in einer Matrix aus `ubuntu-24.04` und
`windows-2022`, bei jedem Anstoß und nicht am Etikett, mit `fail-fast: false` — die Auskunft
„Linux und Windows urteilen verschieden" geht damit nicht verloren, und genau sie ist der Zweck
des zweiten Läufers. Dazu die Lieferkette (`cargo audit` über 498 Kisten, `pnpm audit` über 271).
**A-A-32 gilt als erfüllt.** Damit laufen die `#[cfg(windows)]`-Fälle zu A-A-28 zum ersten Mal
auf dem Betriebssystem, über das sie etwas behaupten. Der wiederkehrende Satz aus 22.8 ist an
dieser Stelle eingelöst.

**Örtlich gemessen:** `cargo test --lib` in `apps/desktop/src-tauri` — 60 Prüffälle, 0 Fehler,
darunter sechs mit dem Namenspräfix `a_a_28_`. `proof:shell-surface` grün (6 Prüfungen, 23
Gegenproben, 0 blind). `proof:all` **nicht** gefahren (E-083 Punkt 3, Port 17843).

### 23.1 O-ET, erste Hälfte — der Ausschluß der Prüfmodule (E-082 Punkt 4)

Gemessen wurde nicht am Text der Änderung, sondern an ihrem Verhalten: Eine Kopie von
`apps/desktop/scripts/proof-shell-surface.mjs` mit umgehängter Wurzel liegt außerhalb des
Bestands, ihre Prüffunktionen sind exportiert, und gegen sie liefen zehn Kunstquellen und sieben
Verstümmelungen der eigenen Umsetzung. Der Bestand selbst wurde dabei nicht angefaßt.

#### 23.1.1 (a) Ist der Ausschluß blockgenau?

Für alles, was heute im Baum steht: **ja**, und für die zwei Fallen, die E-082 Punkt 2 nennt,
nachweislich. Die Grenze wird auf dem Gerüst gezogen (`proof-shell-surface.mjs:379`), Kommentare
und Zeichenkettenrümpfe sind längentreu geleert, die Tiefenzählung endet an der **zugehörigen**
Klammer (`:396-406`), und ein Block ohne schließende Klammer wird gar nicht ausgeschlossen
(`:406`). Zehn Kunstquellen, jede mit einer Adresse an der Stelle, an der sie sichtbar bleiben
muß — `}` im Kommentar, `}` in einer Zeichenkette, verschachtelter Block, Adresse **vor** dem
Block, `'{'` und `'}'` als Zeichenliteral, Attribut zwischen `#[cfg(test)]` und `mod` —, wurden
**alle zehn** gemeldet.

**Und dann die elfte.** `stripRustComments` und `stripRustStrings` kennen die **rohe
Zeichenkette** von Rust nicht (`r"…"`, `r#"…"#`). Enthält sie ein Anführungszeichen, laufen beide
Zustandsautomaten aus dem Takt, die Klammerzählung zählt an der falschen Stelle, und der
Ausschluß endet **hinter** dem Modul statt an ihm. Gemessen, in der schärfsten Form, die diese
Datei prüft:

```rust
#[cfg(test)]
mod tests {
    const S: &str = r#"a"b"#;
}

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    let _ = "https://boese.example/x";
    Ok(())
}
```

Diese Datei in `src-tauri/src/` gelegt, alles übrige unverändert: **`proof:shell-surface` bleibt
grün, Beendigungscode 0.** Ein vierter Aufrufort für `open` — der Fall, für den es diesen Lauf
laut Kopfkommentar überhaupt gibt (`:28-34`) — und eine zweite fremde Adresse sind zugleich
unsichtbar.

Zwei Einordnungen gehören dazu, und beide sind für das Urteil wichtig:

- **Es ist keine Verschlechterung durch T-173.** Dieselbe Kunstquelle gegen die Fassung **vor**
  dem Ausschluß gefahren (`stripRustComments(source.text)` statt
  `stripRustComments(stripCfgTestModules(source.text))`): ebenfalls **null Befunde**. Die
  Blindheit steckt in den beiden Textwerkzeugen und ist so alt wie sie; T-173 hat sie geerbt,
  nicht erzeugt.
- **Die Zusage darüber stimmt trotzdem nicht.** `:372-373` sagt wörtlich: „Im Zweifel misst
  dieser Lauf zu viel, nie zu wenig." Für die rohe Zeichenkette ist es umgekehrt, und ein Satz
  in einem Wächter, der das Gegenteil dessen behauptet, was er tut, ist die schlechtere Hälfte
  eines Meßfehlers — er nimmt der nächsten Prüfrolle den Anlaß nachzusehen.

Heute steht keine rohe Zeichenkette im Rust-Anteil (`grep -n 'r#"' src-tauri/src/*.rs` — leer),
und `attachment.rs` ist die Datei, in der die nächste am ehesten entstünde: Ein Prüffall über
Windows-Pfade schreibt sich mit `r"C:\Users\…"` erheblich angenehmer als mit doppelten
Rückstrichen. Der Befund ist damit nicht theoretisch, sondern einen bequemen Prüffall entfernt.

**Gegenmittel — Auflage A-A-33, eine Zeile, kein Zerleger.** Der Lauf soll nicht lernen, rohe
Zeichenketten zu lesen; er soll sich weigern, eine Datei zu beurteilen, die er nicht lesen kann.
Ein Befund je Rust-Quelle, deren Text `/\br#*"/` trifft, mit dem Satz, daß die Textwerkzeuge
diese Form nicht kennen und die Aussage über die Datei deshalb keine ist. Das ist dieselbe
Bauart wie der Längenwächter in `:382` und dieselbe Richtung: im Zweifel rot.

#### 23.1.2 (b) Bleibt gemessen, was nicht die ausgeschlossene Form ist?

**Ja, an jeder der vier verlangten Stellen, gemessen und nicht gelesen.** `#[cfg(test)]` vor
einem `use`, vor einer einzelnen Funktion, `#[cfg(any(test, …))]` und `#[cfg(test)] mod tests;`
mit dem Modul in einer eigenen Datei: In allen vier Fällen scheitert entweder der Attributausdruck
(`:384`, er verlangt zeichengenau `cfg(test)`) oder der Kopfausdruck (`:393`, er verlangt die
Modulzeile **mit** öffnender Klammer), der Ausschluß unterbleibt, und die eingesetzte Adresse
wird gemeldet. Das Attribut zwischen `#[cfg(test)]` und `mod` (`:393`, `(?:\s|#\[[^\]]*\])*`)
öffnet nichts: Ein `mod`, das ein `#[cfg(test)]` trägt, ist test-gebunden, gleich was sonst
danebensteht.

#### 23.1.3 (c) Tragen die Gegenproben, oder sind sie blind?

**Die vier Verstümmelungen aus T-173 sind nachgemessen; die Behauptung darüber ist zu
berichtigen.** Jede Verstümmelung als eigene Kopie des Laufs, alle drei Gegenproben aktiv:

| Verstümmelung | Prüfungen rot | Gegenproben blind | ohne die dritte Gegenprobe |
|---|---|---|---|
| A — Ausschluß bis Dateiende | 0 | 2 | **bemerkt** (Sonde 2 bleibt blind) |
| B — Ende an der ersten schließenden Klammer | 1 | 1 | **bemerkt** (Prüfung 3 rot) |
| C — Klammern in Zeichenketten zählen mit | 0 | 1 | **unbemerkt** |
| D — Klammern in Kommentaren zählen mit | 1 | 1 | **bemerkt** (Prüfung 3 rot) |

T-173 berichtet, ohne die dritte Gegenprobe blieben **C und D** unbemerkt. Gemessen ist es
**C allein**. Das ist kein Streit um eine Zahl, sondern eine Einordnung, die in die andere
Richtung geht: B und D machen eine **Prüfung** rot, aber nur deshalb, weil im Baum gerade
Prüffälle mit `https://example.org/…` liegen. Verschwänden sie morgen, wären B und D genauso
still wie C. Die dritte Gegenprobe ist damit **mehr** wert als der Bericht sagt: Sie ist die
einzige der drei, deren Aussage nicht am zufälligen Inhalt des Baums hängt.

**Die fünfte Verstümmelung, die alle drei überlebt.** Der Attributausdruck in `:384` wird
geweitet, so daß auch `#[cfg(any(test, …))]` den Ausschluß auslöst:

```js
const attribute = /#\s*\[\s*cfg\s*\(\s*(?:test|any\([^)]*\))\s*\)\s*\]/g;
```

Gegen den Bestand gefahren: **6 Prüfungen grün, 23 Gegenproben bestanden, 0 blind.** Keine der
drei E-082-Gegenproben bemerkt etwas, weil alle drei mit `#[cfg(test)]` arbeiten. Der Unterschied
ist trotzdem der ganze Punkt der Entscheidung: Ein Modul unter `#[cfg(any(test, feature = "dev"))]`
**wird** übersetzt, sobald das Merkmal gesetzt ist, und steht dann im ausgelieferten Erzeugnis.
Gemessen mit einer Kunstquelle genau dieser Form, die einen vierten Aufrufort für `open` enthält:
unveränderter Lauf **Beendigungscode 1**, verstümmelter Lauf **Beendigungscode 0**.

E-082 Punkt 1 begründet den Ausschluß damit, daß `#[cfg(test)]` in kein ausgeliefertes Erzeugnis
übersetzt wird. Diese Begründung trägt genau so weit wie die Form, auf die sie sich stützt — und
daß die Form eng bleibt, ist heute unbewacht. **Auflage A-A-34:** eine vierte Gegenprobe, die den
geweiteten Attributausdruck einsetzt und verlangt, daß eine Adresse unter
`#[cfg(any(test, feature = "…"))]` **gemeldet** wird.

#### 23.1.4 Bewertung des Ausschlusses selbst

**Die Entscheidung ist richtig, und die Umsetzung ist die sichere Richtung — mit einer
gemessenen Ausnahme.** Was in einem `#[cfg(test)] mod` steht, ist keine Fläche der Hülle; ein
Wächter, der es mitzählt, mißt etwas anderes als das, worüber er urteilt, und ein Wächter, der
aus diesem Grund dauerhaft rot steht, wird abgeschaltet — das ist die teuerste aller Lockerungen.
Die Grenze ist eng gezogen, sie ist gegengeprobt, und sechs von sieben Verstümmelungen fallen
auf. Die Ausnahme ist die rohe Zeichenkette, und sie ist älter als diese Änderung.

### 23.2 O-ET, zweite Hälfte — A-A-28 in gebauter Form

#### 23.2.1 Die Hülle: Reihenfolge und Plattformunabhängigkeit

**Beides entspricht der Auflage, zeichengenau.** `check_file` (`attachment.rs:387-417`) prüft in
dieser Reihenfolge: leer, Länge, Steuerzeichen, `is_unc` (`:400`), `is_absolute` (`:403`),
`has_stream_separator` (`:406`), `has_indirect_extension` (`:409`), `is_file` (`:412`). A-A-28
verlangt „nach der Absolutheitsprüfung und **vor** der Endungsprüfung" — genau das steht dort.

`has_stream_separator` (`:301-306`) trägt **kein** `#[cfg(windows)]`. Es fragt
`path.file_name()` und damit nur den letzten Bestandteil, womit der Laufwerksbuchstabe nicht
mitfällt; der eigene Ablehnungsgrund `Rejection::PathStreamSeparator` steht in der Aufzählung
(`:188`) und trägt seinen eigenen Schlüssel (`:210`).

Drei Nachfragen, alle drei geprüft:

- **Warum nach `is_absolute` und nicht davor?** Weil `C:\datei.txt` unter Linux sonst mit
  `path_stream_separator` statt mit `path_not_absolute` zurückkäme und die Meldung in die Irre
  führte. Sicherheitlich ist die Stelle gleichwertig — beide Zweige weisen ab —, und ein
  Prüffall hält die Unterscheidung fest
  (`a_a_28_windows_laufwerksbuchstabe_ist_kein_doppelpunkt_im_dateinamen`).
- **Warum der rohe Name und nicht der aus `effective_file_name`?** Die Beschneidung dort nimmt
  nachgestellte Punkte und Leerzeichen weg und kann einen Doppelpunkt nicht entfernen; beide
  Wege liefern dieselbe Antwort. Bestätigt.
- **Fällt der Doppelpunkt vor der Existenzprüfung?** Ja (`:406` vor `:412`), und der Prüffall
  `a_a_28_doppelpunkt_faellt_vor_der_existenzpruefung_nicht_path_missing` mißt es.

**Sechs Prüffälle mit dem Präfix `a_a_28_` laufen** — auf Linux örtlich, auf `windows-2022` seit
`pruefung.yml` bei jedem Anstoß. Darunter die Gegenprobe
`gegenprobe_a_a_28_die_fassung_vor_t_167_war_bei_drei_faellen_anders`, die die alte Fassung
nachbaut und verlangt, daß sie bei genau drei Fällen anders urteilt. Das ist der Nachweis der
Behebung und nicht ihre Wiederholung.

**T-164-1 ist behoben. A-A-28 gilt in der Hülle als erfüllt.**

#### 23.2.2 Die Oberfläche: ist der dritte Zustand dieselbe Wahrheit?

Der Vorwurf, gegen den zu prüfen war: Eine Oberfläche, die die Prüfung der Hülle **vorwegnimmt**,
ist eine zweite Wahrheit über dieselbe Frage, und die erste, die veraltet, ist immer die
abgeschriebene.

**Hier ist sie es nicht, und der Grund ist die Richtung.** `foreseeableRefusalOf`
(`apps/web/src/lib/attachmentLabel.ts:270-274`) kann die Rückfrage nur **enger** machen:
Steht ein Satz in `foreseenRefusal`, entfällt der Öffnen-Knopf
(`AttachmentOpenDialog.tsx:236`, `:364-368`); steht keiner, läuft der Klick unverändert über
`openAttachmentFile` in `check_file`. Es gibt keinen Zweig, in dem die Vorhersage etwas
**öffnet** — die Kontrolle bleibt die Hülle, und sie läuft bei jedem Aufruf neu.

Damit bleiben zwei Abweichungsrichtungen, und beide wurden durchgerechnet:

- **Oberfläche milder als Hülle** (sagt „wird geöffnet", Hülle weist ab): möglich für UNC, nicht
  absolut, zu lang, Steuerzeichen, fehlende Datei. Ausgang ist der Fehlerzustand **im** Dialog,
  also genau das Verhalten von vor T-167. Kein Zuwachs an Fläche.
- **Oberfläche strenger als Hülle** (verweigert, was die Hülle öffnete): wäre ein Verlust an
  Bedienbarkeit, keine Lücke — und sie ist konstruktiv ausgeschlossen. `lastSeparator`
  (`attachmentLabel.ts:148-150`) schneidet an `/` **und** `\`, `Path::file_name()` unter Linux
  nur an `/`. Der Name der Oberfläche ist damit stets ein **Suffix** des Namens der Hülle;
  enthält das Suffix einen Doppelpunkt, enthält ihn der längere Name auch. Unter Windows sind
  beide gleich.

Die fünf Umleitungsendungen holt die Oberfläche aus `@takt/domain` (`INDIRECT_EXTENSIONS`) statt
sie abzuschreiben, und `extensionOf` (`:218-232`) gibt für einen Namen mit Doppelpunkt
ausdrücklich nichts zurück — dieselbe Aussage wie die Reihenfolge in `check_file`, an derselben
Stelle im Ablauf. `runsWhenOpened` ist zusätzlich hinter `blocked` gehängt (`:237`), so daß der
Dialog nicht zugleich „wird nicht geöffnet" und „wird ausgeführt" sagt.

**Eine Auflage bleibt.** Die Reihenfolge in `foreseeableRefusalOf` und die in `check_file` sind
heute dieselbe, weil zwei Menschen sie gleich geschrieben haben. Fällt eine dritte Vorhersage
dazu — und Abschnitt 19 hat noch Ablehnungsgründe übrig —, bemerkt es niemand.
**Auflage A-A-35:** ein Prüffall hält die Liste `ForeseeableRefusal` gegen `Rejection::key()`,
so wie A-A-29 es für die Schlüssel selbst tut, und mißt für eine ausgeschriebene Fallliste, daß
Oberfläche und Hülle für denselben Pfad denselben Schlüssel liefern.

### 23.3 O-EN — der Aufräumlauf beim Start

`apps/local-api/src/usecases/image-sweep.ts` entfernt Bildkopien ohne Anhang. Es ist die einzige
Stelle in Takt, an der Kundenmaterial ohne einen Klick verschwindet — die Prüfung dafür ist
deshalb nicht „räumt er genug auf", sondern **„fällt jeder Zweifel auf die Seite des
Liegenlassens"**.

#### 23.3.1 Die Reihenfolge und das Rennen

Der Code hält, was der Kopf zusagt: `listImages()` (`:102`), dann `knownImageTargets(found)`
(`:105`), dann die Schleife (`:107-112`); und der Aufruf steht in `main.ts:315-325`, also
**vor** `listen`. Eine Kopie, die zwischen beiden Schritten entsteht, ist in der Antwort des
Bestands enthalten und überlebt.

**Der Beleg dafür liegt aber nicht dort, wo der Kommentar ihn sucht.** „Solange keine Route
zuhört, kann zwischen beiden Schritten kein Anhang entstehen" gilt für **diesen** Prozeß. Ein
zweiter Prozeß auf derselben Datenbank wäre ein Schreiber, den der Aufräumlauf nicht sieht: Er
läge in seinem Zeitfenster zwischen Kopie und Zeile, und die frische Kopie fiele. Daß es diesen
zweiten Prozeß im Erzeugnis nicht gibt, hängt an einer Zeile in einer anderen Sprache in einem
anderen Verzeichnis — `tauri_plugin_single_instance` in
`apps/desktop/src-tauri/src/lib.rs:105`, registriert als **erstes** Plugin und damit vor dem
`setup`, in dem der Sidecar entsteht. Der Anschlag auf den Port (`main.ts:373`, `EADDRINUSE`)
trüge es **nicht**: Er greift erst beim Lauschen, also nach dem Aufräumen.

Das ist kein Befund am Code, sondern einer an der Begründung: Eine Zusage, deren Träger in einem
anderen Erzeugnis steht, gehört benannt, sonst fällt sie mit dem ersten Umbau, den niemand mit
ihr in Verbindung bringt. **Auflage A-A-36**, erste Hälfte.

Im Entwicklungsbetrieb (`apps/local-api` von Hand gestartet, ohne Hülle) gibt es die Einzigkeit
nicht. Das Fenster ist schmal und die Folge ist eine verlorene Bildkopie, kein Datenabfluß; es
gehört trotzdem in den Satz.

#### 23.3.2 Jede Verzweigung, einzeln

| Fall | Verhalten | fällt der Zweifel richtig? |
|---|---|---|
| Verzeichnis nicht lesbar, nicht vorhanden, kein Datenträger | `listImages` fängt und gibt `[]` (`attachment-store.ts:427-445`), der Lauf endet bei `:103` | **ja** — es wird nichts entfernt |
| Datei mit fremder Form im Bildverzeichnis | `GENERATED_NAME_SHAPE` (`:132`) läßt sie nicht in die Liste; sie ist für den Lauf unsichtbar | **ja** |
| Unterordner, halbe Kopie, Symlink | `entry.isFile()` schließt aus, was keine Datei ist | **ja** |
| `knownImageTargets` wirft (Tabelle fehlt nach Rückweg 0015) | äußeres `catch` (`:113`), eine Warnzeile, **kein** Entfernen | **ja** |
| ein Abfrageblock wirft | dieselbe Klammer, die Schleife hat noch nicht begonnen | **ja** |
| `removeImage` liefert `unknown_name` | `pathOf` hat die Form erneut gemessen; nicht gezählt, Datei bleibt | **ja** |
| `removeImage` liefert `failed` (`EBUSY`) | eigene Protokollzeile im Adapter, nicht gezählt | **ja** |
| `removeImage` wirft | äußeres `catch`, Rest der Liste bleibt liegen | **ja** |
| Bestand wächst zwischen den Schritten | siehe 23.3.1 — getragen von der Einzigkeit des Prozesses | **ja, aber der Träger steht anderswo** |
| **Antwort kommt, ist aber leer** | jede gefundene Datei gilt als Waise und wird entfernt | **nein — siehe unten** |

#### 23.3.3 Die eine Verzweigung, an der der Zweifel falsch fällt

Der Kopf der Datei sagt: „Bleibt die Antwort aus, wird nichts entfernt." Das stimmt. Eine
**leere** Antwort ist aber keine ausbleibende, und sie wird als Beweis der Verwaistheit gelesen.

Die Abfrage lautet
`WHERE a.kind = 'image' AND a.target IN (…)` (`repo-attachments.ts:187-215`). Der Filter ist
nötig, weil `ix_todo_attachment_image` ein **Teilindex** über `WHERE kind = 'image'` ist
(Migration 0015). Zugleich ist die Menge der Arten in dieser Datenbank ausdrücklich **Daten und
keine Schemaklausel** — der ganze Grund, aus dem 0015 eine Nachschlagetabelle
`todo_attachment_kind` anlegt, ist, daß eine vierte Art ein `INSERT` sein soll und kein Umbau.

Damit steht hier eine hart eingetragene Annahme über eine Menge, die absichtlich wachsen kann:
Bekäme ein Bild je eine zweite Art — ein Bildschirmabzug, eine eingebettete Zeichnung, was auch
immer —, zählte diese Abfrage die zugehörigen Zeilen nicht mit, und der nächste Start entfernte
**Kundenmaterial, das einen Eigentümer hat**. Kein Angriff, kein fremder Prozeß; ein Datenverlust
durch eine Migration, die an einer ganz anderen Stelle geschrieben wird.

**Gegenmittel — Auflage A-A-36, zweite Hälfte, billig und in der richtigen Richtung.** Der Lauf
fragt vor dem Aufräumen, ob die Arten noch die drei bekannten sind — `todo_attachment_kind` hat
drei Zeilen —, und **räumt gar nicht auf**, wenn es mehr sind; eine Protokollzeile sagt, warum.
Eine Abfrage über eine Tabelle mit drei Zeilen, keine Schemaänderung, kein Verlust des
Teilindex. Genau die Regel, die der Kopf dieser Datei für sich in Anspruch nimmt: Im Zweifel
bleibt es liegen.

#### 23.3.4 Zwei Beobachtungen ohne Auflage

- **Groß- und Kleinschreibung.** `GENERATED_NAME_SHAPE` läßt nur Kleinbuchstaben zu; eine Datei
  `AB…png` ist für `listImages` unsichtbar und wird nie entfernt. Der umgekehrte Fall — Zeile
  mit `AB…png`, Datei `ab…png`, auf einem Dateisystem ohne Unterscheidung — setzt eine von Hand
  geschriebene Zeile voraus (VG-3) und ist damit ein Fall, in dem der Bestand ohnehin fremd ist.
  Vermerkt, nicht bewertet.
- **Der Lauf schweigt bei einem unlesbaren Verzeichnis vollständig.** Das ist bewußt und richtig
  für den Regelfall der frischen Einrichtung. Für den seltenen Fall „es liegt etwas, und es ließ
  sich nicht lesen" bleibt es damit still — aber es wird auch nichts entfernt, und A-A-18
  verlangt keine Meldung, sondern kein verwaistes Material.

### 23.4 Befunde dieser Prüfung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-176-1** | **muß** | **Eine rohe Zeichenkette mit Anführungszeichen macht den Rest einer Rust-Datei für `proof:shell-surface` unsichtbar.** Gemessen: eine Datei mit `#[cfg(test)] mod tests { const S: &str = r#"a"b"#; }` und danach einem vierten Aufrufort für `open` samt fremder Adresse — der Lauf bleibt **grün, Beendigungscode 0**. Die Blindheit steckt in `stripRustComments`/`stripRustStrings` und ist älter als T-173 (gegen die Fassung davor ebenfalls null Befunde); die Zusage in `:372-373` („nie zu wenig") sagt dazu das Gegenteil. Gegenmittel: **A-A-33**. | frontend-dev |
| **T-176-2** | soll | **Der Ausschluß ist an seiner Form unbewacht.** Eine Weitung des Attributausdrucks auf `#[cfg(any(test, …))]` überlebt alle 23 Gegenproben (0 blind, 0 rot), obwohl ein solches Modul mit gesetztem Merkmal ausgeliefert wird. Gemessen: unveränderter Lauf Beendigungscode 1, verstümmelter Lauf 0. Gegenmittel: **A-A-34**. | frontend-dev |
| **T-176-3** | soll | **Der Aufräumlauf liest eine leere Antwort als Beweis der Verwaistheit.** `knownImageTargets` filtert auf `kind = 'image'`; die Menge der Arten ist nach Migration 0015 ausdrücklich erweiterbar. Eine vierte Bildart ließe den nächsten Start Kundenmaterial mit Eigentümer entfernen. Gegenmittel: **A-A-36**, zweite Hälfte. | domain-dev |
| **T-176-4** | Hinweis | **Die Reihenfolge-Zusage des Aufräumlaufs wird von `tauri_plugin_single_instance` getragen, nicht vom fehlenden Lauscher.** `lib.rs:105`, ein anderes Erzeugnis, eine andere Sprache. Der Portanschlag (`main.ts:373`) trägt sie nicht — er greift nach dem Aufräumen. Gegenmittel: **A-A-36**, erste Hälfte. | domain-dev |
| **T-176-5** | Hinweis | **Die Behauptung in `T-173-frontend-dev.md`, ohne die dritte Gegenprobe blieben C und D unbemerkt, ist zu berichtigen: es ist C allein.** B und D machen eine Prüfung rot — aber nur, weil im Baum gerade Prüffälle mit `https://example.org/…` liegen. Die dritte Gegenprobe ist damit die einzige, deren Aussage nicht am Inhalt des Baums hängt, und wertvoller als der Bericht sagt. | keine Behebung, Einordnung |
| **T-176-6** | Hinweis | **Vorhersage und Kontrolle sind heute zufällig gleich sortiert.** `foreseeableRefusalOf` und `check_file` prüfen den Doppelpunkt vor der Endung, weil zwei Menschen es gleich geschrieben haben. Gegenmittel: **A-A-35**. | unit-tester |

### 23.5 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-33** | `proof:shell-surface` **weigert sich**, eine Rust-Quelle zu beurteilen, deren Text eine rohe Zeichenkette (`/\br#*"/`) enthält, und meldet das als Befund. Der Satz dazu nennt den Grund: Die Textwerkzeuge dieses Laufs kennen die Form nicht, und eine Aussage über eine Datei, die sie nicht lesen können, ist keine. Zugleich wird die Zusage in `:372-373` auf das berichtigt, was der Lauf wirklich leistet. | Eine Gegenprobe mit der Kunstquelle aus 23.1.1 (`r#"a"b"#` im Prüfmodul, vierter Aufrufort dahinter): Sie muß einen Befund erzeugen. Heute erzeugt sie keinen. |
| **A-A-34** | Eine vierte Gegenprobe zu E-082 setzt den **geweiteten Attributausdruck** ein — `#[cfg(any(test, …))]` löst den Ausschluß mit aus — und verlangt, daß eine Adresse in einem so bezeichneten Modul weiterhin gemeldet wird. Der Ausschluß bleibt an die Form `#[cfg(test)] mod name { … }` gebunden, und daß er es bleibt, ist gemessen. | Die Gegenprobe selbst, im vorhandenen Gegenprobenteil, ohne zweiten Lauf. |
| **A-A-35** | Ein Prüffall mißt für eine im Prüffall **ausgeschriebene** Fallliste, daß `foreseeableRefusalOf` in der Oberfläche und `check_file` in der Hülle für denselben Pfad denselben Schlüssel liefern — oder die Oberfläche `null` und die Hülle einen Grund, der sich vor dem Klick nicht wissen läßt. Ein neuer vorhersagbarer Ablehnungsgrund macht ihn rot. | Vitest über `attachmentLabel.ts` gegen die Fallliste; die Rust-Seite steht als erwarteter Schlüssel im Prüffall, wie in A-A-29. |
| **A-A-36** | Erste Hälfte: Der Kopf von `image-sweep.ts` **benennt** `tauri_plugin_single_instance` als Träger der Reihenfolge-Zusage und sagt, daß der Portanschlag sie nicht trägt. Zweite Hälfte: Der Lauf prüft vor dem Aufräumen, daß `todo_attachment_kind` genau die drei bekannten Arten führt, und räumt bei jeder Abweichung **gar nicht** auf; eine Protokollzeile nennt den Grund. | Ein Prüffall mit einer vierten Art in der Nachschlagetabelle: Es wird **nichts** entfernt, und die Zeile steht. Ein zweiter mit den drei bekannten Arten: unverändertes Verhalten. |

### 23.6 Urteil dieser Prüfung

**Punkt 1 — E-082, der Ausschluß der Prüfmodule: Nacharbeit.** Die Entscheidung ist richtig, die
Grenze ist eng gezogen, sie ist blockgenau für alles, was heute im Baum steht, und sechs von
sieben Verstümmelungen fallen auf. Freigegeben wird trotzdem nicht: Es gibt eine gemessene
Zeichenfolge, mit der dieser Wächter grün bleibt, während ein vierter Aufrufort für `open` und
eine fremde Adresse in der Datei stehen. Daß der Fehler älter ist als die Änderung, ändert am
Zustand nichts — er ist jetzt gemessen, und er kostet eine Zeile (A-A-33). Dazu A-A-34, damit
die Form, auf der die ganze Begründung ruht, bewacht ist.

**Punkt 2 — A-A-28 in gebauter Form: freigegeben.** Reihenfolge und Plattformunabhängigkeit sind
die der Auflage, zeichengenau und mit sechs Prüffällen samt Gegenprobe belegt; seit
`pruefung.yml` laufen die Windows-Zweige bei jedem Anstoß. **T-164-1 ist behoben, A-A-32
erfüllt.** Der dritte Zustand der Rückfrage ist **keine** zweite Wahrheit: Er kann nur enger
sein als die Hülle, nie weiter, und der Klick geht unverändert durch `check_file`. Die Auflage
A-A-35 hält das für die Zukunft fest und hindert die Freigabe nicht.

**Punkt 3 — der Aufräumlauf: freigegeben mit Auflage.** Neun von zehn Verzweigungen lassen im
Zweifel liegen, und sie tun es aus Konstruktion und nicht aus Vorsicht: drei Riegel, von denen
jeder einzelne genügt. Die zehnte ist die leere Antwort, und sie hängt an einer Annahme über
eine Menge, die dieselbe Migration ausdrücklich zum Wachsen gebaut hat. Dazu die Zusage, deren
Träger in einem anderen Erzeugnis steht. Beides ist A-A-36, beides ist klein, und keines
verhindert die Auslieferung dieser Welle.

**Der Satz dieser Prüfung.** Drei Wächter standen zur Nachschau, und alle drei waren an der
Stelle richtig, an der man sie liest. Blind waren sie an der Stelle, an der jemand etwas
schreibt, das es heute noch nicht gibt: eine rohe Zeichenkette, ein zweites Merkmal, eine vierte
Anhangsart. **Ein Wächter ist so weit gültig wie die Form, die er annimmt — und die Form ist der
Teil, den niemand prüft, solange sie stimmt.**

## 24. Prüfung T-183 (2026-09-06) — die nachgemessene Weigerung, zwei weitere Wächter und der Doppelpunkt als Produktfrage

**Anlaß.** Drei Punkte, und der erste ist eine Nachmessung an der eigenen Auflage:

1. **O-FH.** A-A-33 und A-A-34 sind gebaut (T-173-2). Der Erbauer ist an zwei Stellen bewußt vom
   Wortlaut abgewichen und hat beide Abweichungen begründet. Beide gehören von dieser Rolle
   bestätigt oder verworfen — und die tragende Begründung der ersten ist ein Satz, der sich messen
   läßt.
2. **O-FD.** `proof:foreign` und `proof:callers` sind auf die Blindheit aus T-176-1 nie geprüft
   worden.
3. **O-FO.** Der Doppelpunkt an der Tür — eine Produktfrage, zu der diese Rolle sagt, was die
   Sicherheit verlangt, und was sie nicht verlangt.

### 24.0 Stand der Werkzeuge

**Semgrep Guardian und 42Crunch wurden nicht erneut versucht** (E-079 Punkt 3, T-B06). Der zwölfte
Fehlversuch erzeugte keinen Erkenntnisgewinn; die Beschaffungsfrage steht seit T-164-7 beim
Auftraggeber.

**Örtlich gemessen:** `cargo test --lib` in `apps/desktop/src-tauri` — **60 Prüffälle, 0 Fehler**,
unverändert gegenüber T-176. `proof:shell-surface` grün (6 Prüfungen, 25 Gegenproben, 0 blind).
`proof:foreign` grün (14 bestanden, 114 Quelldateien). `proof:callers` grün (32 bestanden).
`proof:all` **nicht** gefahren (E-083 Punkt 3, Port 17843).

**Wie gemessen wurde.** Wie in T-176: nicht am Text, sondern am Verhalten, und außerhalb des
Bestands. Für `proof:shell-surface` liegt der Rust-Anteil samt Fähigkeitenliste, `tauri.conf.json`,
`apps/web/src` und `packages/domain/src/version.ts` als Spiegel unter `/tmp`; der Lauf dort ist
zeichengleich derselbe und liefert dieselbe Ausgabe (6/25/0). Für `proof:foreign` liegt
`apps/web` als Spiegel unter `/tmp` mit einem Verweis auf die echten Modulbestände; der Lauf dort
liefert dieselben Zahlen wie im Bestand (14 bestanden, 114 Quelldateien, 165 behandelte Übergaben,
20 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 5 Aufrufen). **Der Bestand wurde nicht
angefaßt** — kein Produktivcode, keine Prüfdatei, keine Kunstquelle im Baum.

### 24.1 O-FH — die zwei Abweichungen vom Wortlaut, einzeln beurteilt

#### 24.1.1 Abweichung 1 — der Anlaß stimmt, der tragende Satz nicht

Die Weigerung sucht auf dem **Gerüst** (`proof-shell-surface.mjs:727`,
`RAW_STRING_OPENER.test(stripRustStrings(stripRustComments(source.text)))`) und nicht im Urtext.

**Der Anlaß ist nachgemessen und richtig.** `apps/desktop/src-tauri/src/appdata.rs:241` trägt
`.arg("/inheritance:r")`. Der Ausdruck aus A-A-33 trifft dort auf `:r"` — `:` ist kein Wortzeichen,
`r` ist eines, also greift `\b`. Wörtlich über den Urtext angewandt ist der Lauf **heute rot, und
zwar falsch**. Die Abweichung hat einen Gegenstand.

**Der Satz, auf dem sie ruht, ist falsch.** T-173-2 begründet sie so: „Die **erste** rohe
Zeichenkette einer Datei steht immer noch im Takt beider Werkzeuge und ist dort sichtbar — aus dem
Takt laufen sie erst **an** ihr." Die Frage dieser Prüfung war genau diese: Gibt es eine Datei, in
der die erste rohe Zeichenkette nicht mehr im Takt steht? **Es gibt sie, und sie ist keine Exotik.**

Der Grund steht in den beiden Werkzeugen selbst. `stripRustComments` kennt das **Zeichenliteral**
und hat dafür seit je eine eigene Zeile (`:285`, mit dem Ausdruck `^'(\\.|[^'\\])'`, der die
Lebenszeit `&'a str` davon unterscheidet). `stripRustStrings` kennt es **nicht**: Diese Funktion
verfolgt ausschließlich `"` (`:341`). Und das Gerüst wird gebaut, indem
`stripRustStrings` **außen** läuft. Ein `'"'` — ein Zeichenliteral, das ein Anführungszeichen
enthält — öffnet dort also eine Zeichenkette, die nie zugeht, und ab dieser Stelle ist im Gerüst
Code geleert und Zeichenkettenrumpf sichtbar. Das `r#` der ersten rohen Zeichenkette fällt damit
weg, bevor der Ausdruck es sehen kann.

#### 24.1.2 Die Kunstquelle, die die Weigerung überlebt

Gemessen gegen den Spiegel, alles übrige unverändert:

```rust
/// Trennt an Anfuehrungszeichen — ein ganz gewoehnliches Zeichenliteral.
pub fn trenner() -> char {
    '"'
}

#[cfg(test)]
mod tests {
    const ROH: &str = r#"a"b"#;
    const Z: char = '"';
}

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    Ok(())
}
```

Diese Datei in `src-tauri/src/` gelegt: **`proof:shell-surface` bleibt grün, Beendigungscode 0,
6 Prüfungen und 25 Gegenproben, 0 blind.** Die Schlußzeile des Laufs sagt dabei wörtlich, der
Rust-Anteil habe „genau diese Aufruforte für `open`" und zählt drei auf, während ein **vierter**,
ungeprüfter daneben steht. Die Zwischenwerte, einzeln gemessen: `RAW_STRING_OPENER` trifft den
Urtext (`true`), das Gerüst nicht (`false`); `stripCfgTestModules` schließt gar nichts aus, weil
das Attribut im Gerüst mit geleert ist; und `rustFunctions` sieht `takt_heimlich` nicht, weil die
Signatur im Gerüst in einem vermeintlichen Zeichenkettenrumpf liegt.

Dieselbe Bauart ohne das zweite Zeichenliteral, dafür mit einer fremden Adresse statt des
Aufruforts, ergibt ebenfalls **null Befunde**: Die Adresse `https://evil.example/holen` ist
unsichtbar, weil `stripRustComments` an der rohen Zeichenkette aus dem Takt läuft und das `//` in
`https://` danach als Zeilenkommentar liest.

**Wie nah das am Bestand ist.** Der Rust-Anteil trägt heute **elf** Zeichenliterale — `':'`
(`appdata.rs:363`, `attachment.rs:303`), `'.'`, `' '`, `'-'`, `'?'`, `'#'`. Keines davon ist `'"'`.
Ein `'"'` entsteht bei der nächsten Frage, ob ein Name ein Anführungszeichen trägt — in
`attachment.rs`, der Datei, die Namensbestandteile zerlegt, ist das kein weit hergeholter Gedanke.
Dieselbe Wirkung haben `b'"'` und `'\"'`.

#### 24.1.3 Ein zweiter Weg zum selben Ergebnis — der geschachtelte Blockkommentar

Damit nicht ein einzelner Fall für eine Klasse gehalten wird: Rust **schachtelt** Blockkommentare,
`stripRustComments` zählt sie aber nicht, sondern führt eine Fahne (`:261`, `:301`). Ein Kommentar
der Form `/* aussen /* innen */ er sagte " */` endet für das Werkzeug am ersten `*/`; das `"`
danach öffnet eine Zeichenkette, und die erste rohe Zeichenkette hinter dem Kommentar ist im
Gerüst wieder unsichtbar. Gemessen: `RAW_STRING_OPENER` auf dem Urtext `true`, auf dem Gerüst
`false`.

**Die Klasse ist damit benannt, und sie ist nicht „rohe Zeichenkette".** Sie ist: *jede
Erscheinung, die eines der beiden Textwerkzeuge vor der ersten rohen Zeichenkette aus dem Takt
bringt.* Eine Aufzählung dieser Erscheinungen ist genau die Bauart, die in diesem Vorhaben schon
zweimal versagt hat (E-063 Punkt 4). Deshalb steht im Gegenmittel nicht nur die Behebung der zwei
gemessenen Wege, sondern auch eine Gegenprobe für den Satz selbst.

#### 24.1.4 Abweichung 2 — `b?` statt des Wortlauts: **bestätigt, und tragend**

`RAW_STRING_OPENER = /\bb?r#*"/` (`:360`) statt `/\br#*"/`. Die Begründung — dieselbe Form,
dieselbe Blindheit, strengere Richtung — trifft zu, und die Abweichung ist **nicht** kosmetisch.
Gemessen: Wird `b?` gestrichen, also der Wortlaut der Auflage hergestellt, dann trifft der Ausdruck
`br#"a"b"#` nicht mehr — zwischen `b` und `r` steht keine Wortgrenze. Eine Kunstquelle mit
`br#"a"b"#` im Prüfmodul und einem vierten Aufrufort dahinter ergibt dann **null Befunde**, und der
Lauf bleibt bei 6 Prüfungen und 25 Gegenproben, 0 blind. **Die Abweichung ist bestätigt; der
Wortlaut von A-A-33 wird hiermit auf sie berichtigt.**

Der Hinweis des Erbauers, kein `g`-Merker am Ausdruck zu setzen, ist ebenfalls richtig und ebenfalls
tragend: Ein globaler Ausdruck behielte zwischen zwei `test`-Aufrufen `lastIndex` und übersähe jede
zweite Datei.

#### 24.1.5 Die vierte Verstümmelung, die die 25 überlebt — es sind zwei

Gefragt war, ob es eine Verstümmelung gibt, die auch die neuen 25 Gegenproben überlebt. Es gibt
zwei, beide an derselben Zeile, beide gemessen:

| Verstümmelung | Änderung | Bestand | Kunstquelle |
|---|---|---|---|
| **H** | `/\bb?r#+"/` statt `#*` — mindestens ein Gatter verlangt | 6 Prüfungen, 25 Gegenproben, **0 blind**, Code 0 | `r"C:\Users\Public\"` mit viertem Aufrufort und fremder Adresse dahinter: **0 Befunde** |
| **I** | `/\br#*"/` — der **Wortlaut der Auflage**, `b?` gestrichen | 6 Prüfungen, 25 Gegenproben, **0 blind**, Code 0 | `br#"a"b"#` mit viertem Aufrufort dahinter: **0 Befunde** |

Verstümmelung H ist die ernstere, und zwar aus einem Grund, der im Bericht des Erbauers selbst
steht: Er sagt voraus, die nächste rohe Zeichenkette entstehe als `r"C:\Users\…"` in einem Prüffall
über Windows-Pfade. **Die Gegenprobe, die er dazu geschrieben hat, benutzt `r#"a"b"#`** — die
Form mit Gatter. Gemessen ist damit die Form, die er gewählt hat, und nicht die, die er
vorhergesagt hat. Genau derselbe Satz stand in T-176 über die vier Verstümmelungen aus T-173, und
er ist derselbe hier: **Eine Gegenprobe, die die Lücke des Nachweises nicht trifft, ist keine** —
so wie es `proof-release-safety.mjs:625-638` für den Ausgang ins Netz bereits ausbuchstabiert.

#### 24.1.6 Die Berichtigung T-176-5 — nachgezogen und gegen die 25 bestätigt

T-173-2 hat die Berichtigung angenommen. Sie ist gegen den heutigen Stand **nachgemessen**:
Verstümmelung C (die Klammerzählung läuft auf `stripRustComments(text)` statt auf dem Gerüst, also
zählen Klammern in Zeichenketten mit) ergibt gegen den unveränderten Bestand
**0 Prüfungen rot, 1 Gegenprobe blind** — und die blinde ist die dritte
(„E-082: der Ausschluss endet an der zugehörigen Klammer, nicht an der ersten"). Nichts anderes
fällt auf. Die Einordnung aus 23.1.3 gilt unverändert und ist jetzt auch gegen die 25 belegt.

#### 24.1.7 Das Gegenmittel — gemessen, nicht vorgeschlagen

Beide Behebungen wurden am Spiegel gebaut und gemessen. Sie sind klein, sie erzeugen **keinen**
falschen Alarm auf dem Bestand, und sie stellen den Satz her, auf dem die Abweichung ruht:

1. **`stripRustStrings` lernt das Zeichenliteral** — dieselbe Zeile, die `stripRustComments` bei
   `:285` schon trägt. Der Rumpf des Literals wird längentreu geleert.
2. **`stripRustComments` zählt Blockkommentare, statt eine Fahne zu führen** — `inBlock` wird zu
   `blockDepth`, ein `/*` im Kommentar erhöht, ein `*/` senkt.

Gemessen nach beiden Änderungen: Bestand **grün** (6/25/0, Code 0, kein Befund über `appdata.rs`);
die Kunstquelle aus 24.1.2 erzeugt die **Weigerung**; die Kunstquelle mit der fremden Adresse
ebenso; die Kunstquelle mit dem geschachtelten Kommentar ebenso.

Dazu, und das ist der Teil, der nicht an einer Aufzählung hängt: **eine Gegenprobe für den Satz
selbst.** Die Kunstquelle aus 24.1.2 gehört in den Gegenprobenteil, damit die Behauptung „die erste
rohe Zeichenkette ist im Gerüst sichtbar" nicht wieder Prosa ist. Das ist A-A-37.

### 24.2 O-FD — dieselbe Frage an `proof:foreign` und `proof:callers`

**Die Voraussetzung des Auftrags trifft für beide nicht zu, und das ist die erste Auskunft.** Weder
`proof:foreign` noch `proof:callers` liest Text und nimmt eine Form an. `proof-foreign.mjs:166`
baut ein **Übersetzerprogramm** (`ts.createProgram`) samt Typprüfer aus derselben `tsconfig.json`,
mit der die Oberfläche gebaut wird; `caller-scan.mjs:59` und `:362` bauen einen **Syntaxbaum**
(`ts.createSourceFile`). Die Klasse aus T-176-1 — zwei handgeschriebene Zustandsautomaten, die aus
dem Takt laufen — gibt es dort strukturell nicht. Der Ausdruck über den Urtext ist in beiden Läufen
die Ausnahme und nicht die Regel; wo er vorkommt, ist er gemessen worden (24.2.4).

Damit verschiebt sich die Frage, aber sie verschwindet nicht: Ein AST-Leser ist nicht blind für die
Form, sondern für das, was **außerhalb seines Programms** liegt und für das, was seine Regel nicht
nennt.

#### 24.2.1 `proof:foreign` — die Kunstquelle wird gefunden

Gegen den Spiegel gemessen. Eine Kunstquelle `src/screens/KunstRoh.tsx`, die einen fremden Titel
roh anzeigt:

```tsx
export function KunstRoh({ todo }: { readonly todo: Todo }): ReactElement {
  return <span title={todo.title}>{todo.title}</span>;
}
```

Ergebnis: **rot, zwei Befunde** — `Attribut todo.title (<span title>)` und `Inhalt todo.title`.
Der Lauf trifft, wofür es ihn gibt.

Und er hat Untergrenzen, die ihn davor bewahren, leer zu laufen: `sourceFiles.length > 60`
(`:663`), `treatedCount > 80` (`:664`), `foreignJoins > 2` (`:735`), `inputCount > 5` (`:923`),
`crossings.length > 0` (`:1020`), `crossingCalls > 3` (`:1103`). Das ist mehr, als die meisten
Wächter dieses Vorhabens tragen, und es ist die richtige Bauart.

#### 24.2.2 Was `proof:foreign` nicht sieht — und wo er es nicht sagt

Drei Kunstquellen, jede eine Zeile lang, jede gegen den Spiegel gemessen:

| Kunstquelle | Ergebnis |
|---|---|
| **A** `const titel: string = todo.title;` dann `{titel}` | **rot** — „kein fremder Wert wird in ein Feld ohne Herkunft geschrieben" |
| **B** `const titel = todo.title as string;` dann `{titel}` | **grün**, 14 bestanden, 0 fehlgeschlagen |
| **C** `const teile: string[] = []; teile.push(todo.title);` dann `{teile[0]}` | **grün**, 14 bestanden, 0 fehlgeschlagen |

**A ist genau der Fall, den der Kopf des Laufs für sich in Anspruch nimmt** (`:101-104`:
„Umwege über `String(x)`, `JSON.stringify` oder eine Bindung, die ausdrücklich `: string` heißt.
… die letzte findet Abschnitt 4"). Er findet sie. **B unterscheidet sich von A um ein Schlüsselwort
und wird nicht gefunden**, und der Kopf nennt ihn nicht: Dort steht nur, daß `as string` **aus einem
`unknown`** seit T-133 in Abschnitt 6 gefunden wird — aus einem *fremden* Wert wird es nirgends
gefunden und nirgends behauptet. **C** ist derselbe Verlust an einem Parameter, der keiner eigenen
Funktion gehört: Abschnitt 4 mißt eigene Funktionen, `Array.prototype.push` ist keine.

Wichtig für die Einordnung: **Beide gehen durch `pnpm typecheck`.** Es sind gültige
TypeScript-Programme; es gibt keinen zweiten Lauf, der sie auffinge.

Und die vierte Kunstquelle, die die Frage „merkt der Lauf, daß er blind ist" beantwortet: Dieselbe
Datei wie oben, aber mit **verschriebener Einfuhr** (`from "../api/typen"`). Der Titel steht dann
roh im Inhalt **und** im `title`-Attribut, `todo` ist ein Fehlertyp, `isForeign` sagt `false` —
**der Lauf bleibt grün, 14 bestanden, 0 fehlgeschlagen**, und `tsc` meldet dazu
`error TS2307: Cannot find module '../api/typen'`. Der Lauf liest keine Übersetzerbefunde und
behauptet trotzdem eine Aussage über den Typ jeder Anzeigestelle. Sein Grün ist damit an einen Lauf
gebunden, den er weder nennt noch mißt.

Das ist milder als T-176-1 — `pnpm typecheck` **fängt** diesen Fall, im Gegensatz zu B und C —,
aber es ist dieselbe Bauart: Eine Zusage, deren Träger woanders steht und nicht benannt ist
(vergleiche 23.3.1 und A-A-36 erste Hälfte).

#### 24.2.3 `proof:callers` — der einzige Lauf dieses Vorhabens, der seine Zählung zweimal herleitet

`proof:callers` ist in dieser Frage **vorbildlich**, und das gehört genauso festgehalten wie eine
Lücke:

- **Abschnitt 0 leitet die Zahl der Aufrufe zweimal her** — einmal aus dem Syntaxbaum, einmal aus
  dem Rohtext (`proof-callers.mjs:358-362`) — und verlangt Gleichheit. Das ist genau die Antwort
  auf die Frage „merkt der Lauf, daß er blind ist", und sie steht dort seit T-051.
- **Was der Leser nicht auflösen kann, wird gezählt und macht den Lauf rot** (`:277-281`,
  Abschnitt 5). Der Kopf sagt es wörtlich: rot „nicht, weil der Aufruf falsch wäre, sondern weil
  niemand mehr sagen kann, ob er richtig ist". Das ist die Regel aus A-A-33, drei Wellen älter.
- **Er hat echte Gegenproben, nicht nur Untergrenzen** (`:571-655` und der Add-in-Teil): die drei
  Namen aus T-050 und ein Weg, den es nicht gibt, in den **echten** Text eingesetzt, im
  Arbeitsspeicher, gemessen als **Zuwachs** gegenüber dem unveränderten Lauf, mit einer Prüfung,
  daß die Ersetzung überhaupt gegriffen hat, und einer Umkehrung, daß der unveränderte Text nichts
  ergibt. Gemessen: **32 bestanden, 0 fehlgeschlagen.**

#### 24.2.4 Die eine Zusage von `proof:callers`, die niemand mißt

Der ganze Lauf liest **eine** Datei je Fläche, und der Kopf sagt selbst, was diese Beschränkung
wert ist: „Diese Beschränkung ist nur so viel wert wie die Zusicherung, daß es keine zweite gibt.
Also wird sie gemessen und nicht geglaubt." Gemessen wird sie mit diesem Ausdruck, zweimal:

```js
if (/(?<![\w.])fetch\s*\(/.test(body) && name !== 'api/client.ts') strayFetch.push(name);
```

`proof-callers.mjs:406` für `apps/web/src`, `:707` für `apps/outlook-addin/src`.

**Das ist zeichengleich der Ausdruck, den T-143 S-1 als blind gemessen hat.** Gemessen, hier
erneut:

```text
gesehen     fetch(url)
UNSICHTBAR  window.fetch(url)
UNSICHTBAR  globalThis.fetch(url)
UNSICHTBAR  self.fetch(url)
UNSICHTBAR  const { fetch: holen } = globalThis
```

Der negative Rückblick `(?<![\w.])` ist gewollt — er soll `options.fetch(...)` als Port
durchlassen —, und genau deshalb läßt er auch `globalThis.fetch(` durch. `proof-release-safety.mjs`
hat diese Lücke nach T-143 behoben und führt seither **vier** Gegenproben für den Ausgang
(`:659-678`): nacktes `fetch(`, `globalThis.fetch(`, `window.fetch(` und eine Zerlegung. Die
Behebung ist in diesem Bestand also bereits einmal geschrieben; `proof:callers` hat sie nicht
geerbt.

Dazu kommt: **Für diese Zusage gibt es in `proof:callers` keine einzige Gegenprobe.** Die
Selbstproben in Abschnitt 6 und 8 setzen Rumpfschlüssel, Abfrageschlüssel und Wege ein — nie einen
zweiten Weg zum Dienst. Der Wächter über den Wächter sieht dieselbe Stelle nicht, genau wie damals.

**Und die Lücke steht heute im Baum.** `apps/outlook-addin/src/ui/App.tsx:58` trägt
`fetch: window.fetch.bind(window)`. Das ist zulässig und richtig — es ist die Einspeisung des Ports,
die der Kopf bei `:686-689` ausdrücklich beschreibt. Aber der Lauf sieht sie nicht: Sein Grün ist
identisch, ob diese Zeile dort steht oder nicht.

**Wie schwer das wiegt.** Nicht als Abflußweg: Die CSP der Hülle bindet `connect-src` an vier
Marken, die des Add-ins (`apps/outlook-addin/index.html:34`) an den lokalen Dienst und
`appsforoffice.microsoft.com`. Ein zweiter `fetch` in der Oberfläche käme also nicht nach draußen.
Was verlorenginge, ist der **Vertrag**: Ein Aufruf, der an `endpoints.ts` vorbei zusammengesetzt
wird, ist von diesem Lauf nicht gemessen — und das ist genau die Klasse aus T-050, drei stille
Namen, zwei davon wochenlang unbenutzbare Funktionen. Deshalb **soll** und nicht **muß**.

### 24.3 O-FO — der Doppelpunkt an der Tür: was die Sicherheit verlangt, und was nicht

**Die Frage.** Seit T-178 weist auch die Tür (`checkAttachmentPath`,
`packages/domain/src/attachment.ts:832`) einen Doppelpunkt im letzten Namensbestandteil ab, auf
jeder Plattform. Unter Linux und macOS ist `:` ein gewöhnliches Namenszeichen;
`Besprechung 10:30.pdf` läßt sich seither weder eintragen noch öffnen. Muß die Tür dieselbe Strenge
tragen wie die Hülle?

**Die Antwort in einem Satz: Nein — aber die Folgerung daraus ist nicht „die Tür warnt nur".**

#### 24.3.1 Warum die Hülle streng bleiben muß, ohne Ausnahme

Die Begründung aus 22.1.1 gilt unverändert und ist an die **Hülle** gebunden, nicht an die Tür:

- Der Doppelpunkt ist gefährlich, weil `is_file()` die Win32-Auflösung nimmt und
  `has_indirect_extension` die Zeichenkette — bei `rechnung.lnk::$DATA` reden die beiden über
  verschiedene Dateien. Das ist die einzige Kontrolle zwischen einem gespeicherten Wert und
  `Start-Process` beziehungsweise `explorer.exe`.
- **Der Wert kommt an der Tür vorbei in den Bestand.** VG-1: die Routen des Dienstes mit dem
  Sitzungsgeheimnis — jeder Prozeß im Benutzerkonto, der das Geheimnis liest, schreibt
  `todo_attachment.target`. VG-3: ein `UPDATE` mit `sqlite3` auf die Bestandsdatei, ganz ohne
  Dienst. Beide Wege stehen seit 20.3 im Modell, und beide sind der Grund, aus dem die Kontrolle
  überhaupt im Öffnen-Befehl sitzt.
- Ein Angreifer, der einen Doppelpunktpfad einschleusen will, benutzt also **nie** die Tür. Für ihn
  ist die Strenge der Tür wirkungslos — heute wie nach jeder Lockerung.

Daraus folgt unmittelbar: **Die Strenge der Tür trägt gegen diesen Angriff nichts bei.** Was sie
beiträgt, steht ausgeschrieben in ihrer eigenen Erklärung
(`apps/local-api/src/usecases/attachments.ts`): Sie hält den Wert aus dem Bestand heraus, **solange
er über die Tür kommt**, und sie nennt dem Benutzer den Grund **im Augenblick der Eingabe** statt
nach einem Klick auf einen Anhang, den er schon angelegt hat.

#### 24.3.2 Was die Sicherheit an der Tür verlangt — und was nicht

**Sie verlangt nicht:** die Doppelpunktregel an der Tür. Nachgerechnet über jede Verwendung, die
ein gespeicherter Pfad in Takt hat:

| Verwendung | Trägt ein Doppelpunkt ein Risiko? |
|---|---|
| Öffnen (`takt_open_attachment_file`) | **ja** — und dort steht `check_file`, unverändert streng |
| Ein anderer Öffnen-Weg | es gibt keinen; `proof:shell-surface` mißt genau drei Aufruforte — **mit dem Vorbehalt aus 24.1** |
| Anzeige (Beschriftung, Rückfrage) | nein — der Pfad läuft als fremder Text durch `Foreign` |
| Protokoll | nein — `REASON_SHAPE` (`apps/local-api/src/logger.ts:64`) läßt keinen Doppelpunkt zu und macht jeden Grund in falscher Gestalt zu `unclassified`; Werte stehen dort ohnehin nicht |
| Export | nein — Anhänge gelangen in keinen Export (A-19, E-070) |
| Bilddatei im Anwendungsdatenverzeichnis | nein — der Name wird von Takt erzeugt (`GENERATED_NAME_SHAPE`) und nicht übernommen |

**Sie verlangt sehr wohl:** daß die Tür **nie milder ist als die Hülle in einer Weise, die einen
Wert in den Bestand läßt, den die Hülle später öffnet.** Das ist die Richtung, die E-085 Punkt 2
bereits als Regel führt — die Hülle darf strenger sein, die Domäne nie — und sie bleibt gewahrt,
gleich wie diese Frage ausgeht.

#### 24.3.3 Die drei Wege, und was jeder kostet

**Weg 1 — alles bleibt.** Ein Satz, eine Regel, auf beiden Seiten dieselbe, auf dem Läufer meßbar,
`proof:attachment-parity` (E-085) hat nichts zu unterscheiden. Preis: `Besprechung 10:30.pdf` ist
unter Linux und macOS nicht als Anhang verwendbar. Unter Windows — der Plattform, für die Takt
gebaut ist — kostet die Regel nichts, weil ein Doppelpunkt dort in keinem gültigen Dateinamen
vorkommt.

**Weg 2 — die Tür warnt nur, die Hülle bleibt streng.** Sicherheitlich unbedenklich, und **trotzdem
rate ich davon ab.** Er kauft eine kleine Bequemlichkeit mit einer größeren Unbequemlichkeit: Der
Benutzer legt unter Linux `Besprechung 10:30.pdf` an, sieht den Anhang in der Liste, klickt ihn —
und **dann** weist die Hülle ab. Die Absage wandert vom Augenblick der Eingabe, wo sie einen Satz
mit einem Grund hat, hinter einen Klick, wo sie wie ein Fehler aussieht. Dazu käme der Zustand, den
23.2.2 als den teuren beschreibt: zwei Wahrheiten über dieselbe Frage, hier auch noch mit der
milderen an der Stelle, die zuerst gelesen wird.

**Weg 3 — die Regel wird plattformabhängig, an beiden Stellen, aus einer Entscheidung.** Der
Doppelpunkt fällt dort, wo das Betriebssystem, das die Datei öffnet, ihn als Stromtrenner auflöst
— also unter Windows. Sicherheitlich ist das **vertretbar**: Auf ext4 und APFS ist der Doppelpunkt
ein gewöhnliches Zeichen, `Path::file_name()` und das Betriebssystem sind sich einig, und die
Voraussetzung des ganzen Befundes („der Name, den `Path` sieht, ist nicht der, den Windows
auflöst") gilt dort nicht. Ein unter Linux eingetragener Pfad ist unter Windows ohnehin nicht
absolut und fällt dort mit `path_not_absolute`; ein mitgenommener Bestand macht daraus also keine
Lücke.

Sein Preis ist keiner an der Sicherheit, sondern an der **Meßbarkeit**, und der ist heute konkret:

- A-A-28 steht ausdrücklich **ohne** `#[cfg(windows)]` da, mit derselben Begründung wie `is_unc`
  und `effective_file_name` (A-A-10): ein Zweig, der nur auf einem Betriebssystem etwas tut, ist
  auf dem Läufer der Reihe unmeßbar. Dieses Argument ist seit `pruefung.yml` **halb** entkräftet —
  `cargo test --lib` läuft auf `windows-2022` bei jedem Anstoß. Nur eben `cargo test --lib`: Die
  pnpm-Nachweise, und damit `proof:attachment-parity` aus E-085, laufen dort **nicht**
  (`.github/workflows/pruefung.yml`, Auftrag `rust`, und der Kopf sagt ausdrücklich, `pnpm check`
  in voller Länge stehe hier nicht).
- Damit entstünden vier Kombinationen (Tür/Hülle mal Linux/Windows), von denen der Nachweis aus
  E-085 nur zwei je Läufer messen könnte — und die Domäne bekäme eine Plattformfrage, obwohl sie
  „kein Dateisystem kennt" (ihre eigene Erklärung bei `checkAttachmentPath`).

#### 24.3.4 Empfehlung an den Orchestrator — keine Entscheidung

1. **Die Hülle bleibt, wie sie ist**: `has_stream_separator` ohne `#[cfg]`, nach `is_absolute`,
   vor der Endungsprüfung. Das ist nicht verhandelbar und unabhängig von jedem der drei Wege.
2. **Weg 2 nicht.** Er ist sicherheitlich unbedenklich und produkttechnisch der schlechteste der
   drei.
3. **Zwischen Weg 1 und Weg 3 entscheidet nicht die Sicherheit, sondern das Produkt.** Meine
   Empfehlung ist **Weg 1, vorerst**: Takt ist für Windows gebaut (`WindowsUser` im Export, das
   Outlook-Add-in), dort kostet die Regel nichts, und Weg 3 kostet eine zweite Meßfläche, die es
   heute nicht gibt.
4. **Wenn Weg 3 gewählt wird**, dann mit drei Bedingungen, und alle drei sind meßbar:
   (a) **eine** Entscheidung, die die Plattformfrage an **einer** Stelle beantwortet, aus der beide
   Seiten sie beziehen; (b) `proof:attachment-parity` (E-085) trägt die Plattform als Fall und mißt
   für **jede** Plattform beide Richtungen, nicht nur die des Läufers; (c) der Nachweis läuft auch
   auf `windows-2022` — sonst ist die Windows-Hälfte der neuen Regel eine Absichtserklärung, und
   das ist genau der Zustand, den A-A-32 beendet hat.
5. **Und die Reihenfolge.** Weg 3 gehört **nicht** vor die Behebung aus 24.1 gebaut. Der Satz
   „es gibt genau drei Aufruforte für `open`, und deshalb ist `check_file` die einzige Kontrolle"
   ist die halbe Begründung dafür, daß die Tür überhaupt gelockert werden darf — und dieser Satz
   ruht heute auf einem Wächter, von dem in 24.1.2 gemessen ist, daß er grün bleibt, während ein
   vierter danebensteht.

### 24.4 Befunde dieser Prüfung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-183-1** | **muß** | **Die Weigerung aus A-A-33 ist mit einem gewöhnlichen Zeichenliteral zu umgehen.** `stripRustStrings` (`proof-shell-surface.mjs:321-350`) kennt `'"'` nicht, obwohl `stripRustComments` es bei `:285` kennt; das Gerüst wird aber mit `stripRustStrings` **außen** gebaut. Gemessen: Kunstquelle aus 24.1.2 im Baum, Lauf **grün, Code 0, 6/25/0**, während ein vierter, ungeprüfter Aufrufort für `open` danebensteht. Zweiter Weg zum selben Ergebnis: geschachtelter Blockkommentar (`:261`, `:301`). Der tragende Satz aus T-173-2 („die erste rohe Zeichenkette steht noch im Takt") ist damit **widerlegt**. Gegenmittel: **A-A-37**. | frontend-dev |
| **T-183-2** | soll | **Zwei Verstümmelungen überleben alle 25 Gegenproben.** H: `#+` statt `#*` — `r"C:\Users\Public\"` wird nicht mehr gemeldet, und genau diese Form sagt der Bericht des Erbauers als nächste voraus. I: `b?` gestrichen, also der **Wortlaut von A-A-33** — `br#"…"#` wird nicht mehr gemeldet. Beide: 6/25/0, Code 0. Gegenmittel: **A-A-38**. | frontend-dev |
| **T-183-3** | soll | **`proof:foreign` verliert die Herkunft an zwei Stellen still, die `pnpm typecheck` nicht fängt.** `todo.title as string` und `teile.push(todo.title)` in ein `string[]`: beide grün (14/0). Die eine Zeile daneben — `const titel: string = todo.title` — ist rot, und der Kopf des Laufs nennt genau sie als abgedeckt (`:101-104`). Gegenmittel: **A-A-39**. | frontend-dev |
| **T-183-4** | Hinweis | **`proof:foreign` liest keine Übersetzerbefunde.** Eine verschriebene Typeinfuhr macht jede Anzeigestelle der Datei zu `any`, der Lauf bleibt **grün**, `tsc` meldet `TS2307`. Gefangen wird das von `pnpm typecheck` — einem Lauf, den `proof:foreign` weder nennt noch mißt. Gegenmittel: **A-A-39**, zweite Hälfte. | frontend-dev |
| **T-183-5** | soll | **`proof:callers` mißt seine tragende Zusage mit dem Ausdruck, den T-143 S-1 als blind gemessen hat.** `/(?<![\w.])fetch\s*\(/` (`:406`, `:707`) sieht `globalThis.fetch(`, `window.fetch(`, `self.fetch(` und eine Zerlegung nicht; für diese Zusage gibt es **keine** Gegenprobe. Die Behebung steht in diesem Bestand bereits (`proof-release-safety.mjs:659-678`). Belegt am Baum: `apps/outlook-addin/src/ui/App.tsx:58` trägt `window.fetch.bind(window)` und ist unsichtbar. Kein Abflußweg (CSP beidseitig), aber der Vertrag aus T-050 wäre unbewacht. Gegenmittel: **A-A-40**. | frontend-dev |
| **T-183-6** | Hinweis | **`proof:callers` ist im übrigen der Maßstab.** Zwei Herleitungen derselben Zahl (`:358-362`), unauflösbares macht rot (`:277-281`), echte Gegenproben mit Zuwachsmessung, Anwendbarkeitsprüfung und Umkehrung (`:571-655`). Wer für einen neuen Wächter eine Vorlage sucht, nimmt diese. | Einordnung |
| **T-183-7** | Hinweis | **Berichtigung T-176-5 ist angenommen und gegen die 25 nachgemessen**: Verstümmelung C ergibt 0 Prüfungen rot und **1** blinde Gegenprobe, und es ist die dritte. Unverändert gültig. | Einordnung |
| **T-183-8** | Produktfrage | **Der Doppelpunkt an der Tür ist keine Sicherheitsanforderung.** Die tragende Kontrolle ist und bleibt `check_file`; ein eingeschleuster Wert nimmt die Tür nie (VG-1, VG-3). Empfehlung: Weg 1 vorerst, Weg 2 **nicht**, Weg 3 nur mit den drei Bedingungen aus 24.3.4 und **nach** T-183-1. | Orchestrator |

### 24.5 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-37** | Der Satz, auf dem die Weigerung ruht — „die erste rohe Zeichenkette einer Datei ist im Gerüst sichtbar" —, wird **hergestellt und gemessen**, statt behauptet. Erste Hälfte: `stripRustStrings` lernt das Zeichenliteral, mit derselben Zeile, die `stripRustComments` bei `:285` schon trägt, und leert seinen Rumpf längentreu. Zweite Hälfte: `stripRustComments` führt für Blockkommentare einen **Zähler** statt einer Fahne, weil Rust sie schachtelt. Dritte Hälfte: der Absatz „Was diese Grenze nicht leistet" nennt beides und sagt, daß die Weigerung nur so weit trägt wie das Gerüst. | Zwei Gegenproben, beide heute blind: (1) die Kunstquelle aus 24.1.2 — Zeichenliteral `'"'`, dann `r#"a"b"#`, dann ein vierter Aufrufort — **muß** die Weigerung erzeugen; heute erzeugt sie **null Befunde**. (2) dieselbe Quelle mit `/* aussen /* innen */ er sagte " */` statt des Zeichenliterals. Beide Behebungen sind am Spiegel gebaut und gemessen: Bestand danach grün (6/25/0), beide Kunstquellen rot. |
| **A-A-38** | Die Gegenprobe zu A-A-33 mißt **alle vier Formen** der rohen Zeichenkette und nicht eine: `r"…"`, `r#"…"#`, `br"…"`, `br#"…"#`. Zugleich wird der Wortlaut von A-A-33 auf `/\bb?r#*"/` berichtigt — das `b?` ist gemessen tragend und nicht kosmetisch. | Verstümmelung H (`#+` statt `#*`) und Verstümmelung I (`b?` gestrichen) müssen je eine Gegenprobe rot machen. Heute überleben beide alle 25. Als Kunstquelle für H eignet sich `r"C:\Users\Public\"` — die Form, die T-173-2 selbst als die nächste vorhersagt. |
| **A-A-39** | Erste Hälfte: `proof:foreign` bekommt eine Prüfung über den Weg, an dem die Herkunft heute still abfällt — eine Zusicherung `as`, die einen fremden Wert auf einen Texttyp **ohne** Marke bringt, ist ein Fund; ebenso ein fremder Wert als Argument einer Funktion, deren Parameter Text ohne Marke ist, auch wenn die Funktion nicht die eigene ist. Zweite Hälfte, unabhängig davon und billiger: Der Lauf fragt `ts.getPreEmitDiagnostics` und wird **rot**, wenn das Programm nicht fehlerfrei übersetzt — mit dem Satz, daß eine Aussage über Typen in einem Programm mit Typfehlern keine ist. Das ist dieselbe Regel wie A-A-33, eine Sprache weiter. | Drei Gegenproben im Lauf, alle drei heute grün: `const titel = todo.title as string`, `teile.push(todo.title)` in ein `string[]`, und eine verschriebene Typeinfuhr. Jede muß den Lauf rot machen. Die Kunstquellen können wie in `proof:callers` im Arbeitsspeicher entstehen (ein `CompilerHost` mit einer überlagerten Datei); `apps/web/src` wird dafür nicht angefaßt. |
| **A-A-40** | Der Ausdruck, mit dem `proof:callers` „es gibt keinen zweiten Weg zum Dienst" mißt (`:406` und `:707`), wird durch den ersetzt, den `proof-release-safety.mjs` nach T-143 S-1 schon trägt — er erkennt `fetch(`, `globalThis.fetch(`, `window.fetch(`, `self.fetch(` und die Zerlegung —, und die zulässige Ausnahme wird **benannt** statt durch einen Rückblick erschlichen: `options.fetch(` als Port in `api/client.ts` und die Einspeisung in `apps/outlook-addin/src/ui/App.tsx`. Dazu **vier Gegenproben** in beiden Selbstprobenteilen (Abschnitt 6 und 8), je eine Schreibweise. | Die vier Gegenproben selbst, aufgebaut wie die vorhandenen: der echte Text im Arbeitsspeicher, Zuwachs gegen den unveränderten Lauf, Anwendbarkeit geprüft. Vorlage steht in `proof-release-safety.mjs:659-678`. Heute gibt es für diese Zusage **null** Gegenproben. |

### 24.6 Urteil dieser Prüfung

**Punkt 1 — O-FH: Nacharbeit.** Abweichung 2 (`b?`) ist **bestätigt** und tragend; der Wortlaut von
A-A-33 wird auf sie berichtigt. Abweichung 1 hat einen echten Anlaß — `appdata.rs:241` macht die
wörtliche Umsetzung falsch rot —, aber der Satz, mit dem sie ihre Schärfe behauptet, ist gemessen
falsch. Ein gewöhnliches `'"'` genügt, und die Weigerung schweigt; dahinter steht ein vierter,
ungeprüfter Aufrufort für `open`, und der Lauf sagt in seiner Schlußzeile, es gebe genau drei.
Die Behebung ist zwei kleine Änderungen groß, beide sind gemessen, beide erzeugen keinen falschen
Alarm (A-A-37). Dazu A-A-38, weil zwei Verstümmelungen alle 25 Gegenproben überleben und die
ernstere genau die Form trifft, die der Erbauer selbst als nächste erwartet.

**Punkt 2 — O-FD: freigegeben mit Auflage, für beide Läufe.** Die Voraussetzung des Auftrags trifft
nicht zu: Beide lesen einen Syntaxbaum, nicht Text mit angenommener Form; die Klasse aus T-176-1
gibt es dort nicht. `proof:callers` ist darüber hinaus der **Maßstab** dieses Vorhabens für die
Frage „merkt der Lauf, daß er blind ist" — zwei Herleitungen derselben Zahl, Unauflösbares macht
rot, echte Gegenproben mit Zuwachsmessung. Beide haben trotzdem je eine Stelle, an der eine
ausgesprochene Zusage nicht gemessen wird: bei `proof:foreign` der Verlust der Herkunft an einer
Zusicherung und an einem fremden Parameter, bei `proof:callers` die Zusage, daß es keinen zweiten
Weg zum Dienst gibt — gemessen mit dem Ausdruck, der in dieser Werkstatt schon einmal als blind
befunden und anderswo bereits ersetzt wurde. Keiner der beiden Punkte hindert die Auslieferung.

**Punkt 3 — O-FO: Empfehlung, keine Entscheidung.** Die Sicherheit verlangt die Doppelpunktregel
**an der Hülle**, auf jeder Plattform, unverändert. Sie verlangt sie **nicht an der Tür**: Wer
einen solchen Pfad einschleusen will, nimmt VG-1 oder VG-3 und damit nie die Tür. Was die Tür
beiträgt, ist die Auskunft im Augenblick der Eingabe — und genau deshalb rate ich von „die Tür
warnt nur" ab: Das verlegt die Absage hinter einen Klick und macht aus einer Regel zwei Wahrheiten.
Empfohlen ist, es vorerst zu lassen; wird gelockert, dann an beiden Stellen aus einer Entscheidung,
mit `proof:attachment-parity` als Messung, auf beiden Läufern — und **nach** T-183-1.

**Der Satz dieser Prüfung.** Eine Auflage, die an einer Stelle abweicht, ist nicht deshalb falsch,
weil sie abweicht — beide Abweichungen hier hatten einen Anlaß, und eine ist besser als der
Wortlaut. Aber eine Abweichung ruht auf einem Satz, und dieser Satz ist ab dem Augenblick, in dem
er im Quelltext steht, eine **Zusage über die Zukunft**. Zweimal in drei Wellen war er falsch, und
beide Male stand er da, wo niemand ihn messen konnte, weil er wie eine Begründung aussah.
**Wo ein Wächter etwas begründet, statt es zu messen, gehört die Begründung in die nächste
Gegenprobe.**

---

## 25. Prüfung T-189 (2026-09-06) — die dritte und die vierte Umgehung derselben Weigerung, und ein Wächter der Barrierefreiheit, der die Hälfte nicht ansieht

**Auftrag.** Zwei Punkte. Erstens die Nachmessung der Auflagen **A-A-37** und **A-A-38**, die
T-183 gestellt und T-173-3 gebaut hat — sie entscheidet die Abnahme von Punkt 1 der Prüfung T-183.
Zweitens **O-GH**: Wie viele der 480 Farbpaare aus `apps/web/scripts/contrast-check.mjs` prüfen
einen Wert, den keine Klasse zeichnet — und, die gefährlichere Richtung, wie viele Klassen zeichnen
eine Farbe, die kein Paar prüft.

### 25.0 Stand der Werkzeuge

Wie in T-176 und T-183: gemessen am Verhalten, außerhalb des Bestands. Der Spiegel liegt unter
`/tmp/t189-spiegel` mit derselben Verzeichnisform, die `proof-shell-surface.mjs` erwartet
(`apps/desktop/scripts`, `src-tauri/src` als echte Kopie, `capabilities`, `tauri.conf.json`,
`apps/web/src`, `build-app.mjs` und `packages/domain/src/version.ts` als Verweise). Er liefert
**zeichengleich** dieselben 44 Zeilen wie der Bestand — `diff` ohne Ausgabe, beide Code 0, beide
**6 Prüfungen und 28 Gegenproben, 0 blind**. Das ist der Beleg, daß er dasselbe mißt.

Alle Kunstquellen und alle elf Verstümmelungen sind dort entstanden und dort geblieben; im Baum
wurde **keine** Datei angefaßt. `proof:all` nicht gefahren (E-083 Punkt 3). Guardian und 42Crunch
nicht erneut versucht (E-079 Punkt 3). Die Lieferkette nicht erneut gemessen (E-079, T-B06).

### 25.1 A-A-37 und A-A-38 — jede Zahl des Erbauers nachgemessen

#### 25.1.1 Die elf Verstümmelungen, einzeln gegen den unveränderten Bestand

Jede als Textersatz an genau einer Stelle, jede einzeln gefahren, danach die unveränderte Fassung
zurückgestellt. Die Spalte „gemeldet" ist die Tabelle aus `.claude/team/reports/T-173-3-frontend-dev.md`.

| Verstümmelung | gemeldet | **gemessen** |
|---|---|---|
| A — Ausschluß bis Dateiende | 0 rot, 2 blind | **0 rot, 2 blind** ✓ |
| B — Ende an der ersten Klammer | 1 rot, 1 blind | **1 rot, 1 blind** ✓ |
| C — Klammern in Zeichenketten zählen mit | 0 rot, 1 blind | **0 rot, 1 blind** ✓ |
| D — Klammern in Kommentaren zählen mit | 1 rot, 1 blind | **1 rot, 1 blind** ✓ |
| E — Weigerung ausgebaut | 0 rot, 3 blind | **0 rot, 3 blind** ✓ |
| F — Attributausdruck auf `any(test, …)` geweitet | 0 rot, 1 blind | **0 rot, 1 blind** ✓ |
| G — Weigerung auf dem Urtext statt auf dem Gerüst | 1 rot (falscher Alarm) | **1 rot, 0 blind** ✓ |
| **H — `#+` statt `#*`** | 0 rot, 1 blind (A-A-38) | **0 rot, 1 blind — A-A-38** ✓ |
| **I — `b?` gestrichen** | 0 rot, 1 blind (A-A-38) | **0 rot, 1 blind — A-A-38** ✓ |
| **J — `stripRustStrings` ohne Zeichenliteral** | 0 rot, 2 blind (A-A-37) | **0 rot, 2 blind** — es sind die Gegenproben „ein Zeichenliteral `'"'` nimmt der Weigerung nicht die Sicht" und „Zeichenliteral und geschachtelter Kommentar verstecken keinen Aufrufort" ✓ |
| **K — `stripRustComments` mit Fahne statt Zähler** | 0 rot, 2 blind (A-A-37) | **0 rot, 2 blind** — „ein geschachtelter Blockkommentar nimmt ihr die Sicht ebenso wenig" und dieselbe letzte ✓ |

**Elf von elf stimmen, Zahl für Zahl und Gegenprobe für Gegenprobe.** J und K sind der Kern: Sie
stellen genau den Zustand her, in dem T-183 den Lauf grün gemessen hat, und er ist jetzt rot — ohne
daß eine Kunstquelle im Bestand liegen muß. Die Behauptung des Erbauers, der tragende Satz stehe
jetzt im Gegenprobenteil statt in der Prosa, ist damit **hergestellt und belegt**.

#### 25.1.2 Die drei Kunstquellen aus 24.1.2 und 24.1.3

Je einzeln als `src-tauri/src/kunst.rs` in den Spiegel gelegt:

| Kunstquelle | vor T-173-3 (T-183 gemessen) | **jetzt gemessen** |
|---|---|---|
| 24.1.2 — `'"'`, `r#"a"b"#`, vierter Aufrufort | grün, Code 0, 6/25/0 | **Code 1, Weigerung** ✓ |
| 24.1.2 — dieselbe Bauart mit fremder Adresse | grün, Code 0 | **Code 1, Weigerung** ✓ |
| 24.1.3 — geschachtelter Blockkommentar | grün, Code 0 | **Code 1, Weigerung** ✓ |

Kein falscher Alarm auf `appdata.rs`; der Bestand bleibt grün.

**A-A-37 und A-A-38 sind damit erfüllt, in dem Umfang, in dem sie gestellt waren.**

### 25.2 Die Frage zum dritten Mal — und es sind zwei weitere Wege

Gefragt war, ob ein **dritter** Weg aus dem Takt der beiden Textwerkzeuge existiert, den auch die
28 Gegenproben nicht sehen. Der Erbauer schließt ihn ausdrücklich nicht aus. **Es gibt zwei, beide
gemessen, beide ohne jede Änderung am Lauf.**

#### 25.2.1 Weg 3 — die rohe **C**-Zeichenkette `cr"…"` / `cr#"…"#`

Rust kennt seit 1.77 C-Zeichenketten (`c"…"`) und ihre rohe Form (`cr"…"`, `cr#"…"#`). Die
Weigerung sucht mit `RAW_STRING_OPENER = /\bb?r#*"/` (`proof-shell-surface.mjs:395`). Der Ausdruck
verlangt eine Wortgrenze **vor** `b?r`. Vor dem `r` in `cr` steht mit `c` ein Wortzeichen — **es
gibt dort keine Grenze, und der Ausdruck trifft nicht.** Beide Textwerkzeuge kennen die rohe Form
ohnehin nicht und laufen an ihr aus dem Takt.

Kunstquelle, in `src-tauri/src/` gelegt:

```rust
#[cfg(test)]
mod tests {
    const ROH: &std::ffi::CStr = cr#"a"b"#;
}

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    let _ = "https://boese.example/x";
    Ok(())
}
```

**Gemessen: `proof:shell-surface` bleibt grün, Beendigungscode 0, 6 Prüfungen und 28 Gegenproben,
0 blind** — und die Schlußzeile zählt wieder genau drei Aufruforte auf, während ein vierter samt
fremder Adresse danebensteht. Die Zwischenwerte: `RAW_STRING_OPENER` trifft **weder** den Urtext
(`false`) **noch** das Gerüst (`false`); im Gerüst ist alles ab `cr#"` Zeichenkettenrumpf:

```
    const ROH: &std::ffi::CStr = cr#" "b"
                 ← ab hier geleert, die ganze Funktion samt open()
            "https:
    Ok(())
```

Dieselbe Wirkung hat `cr"C:\Users\Public\"` (ebenfalls gemessen, Code 0, grün): Der abschließende
Rückstrich frißt für das Werkzeug die schließende Anführung, weil es in einer **rohen**
Zeichenkette keine Fluchtfolgen gibt — der Fall aus Verstümmelung H, nur mit dem Präfix, das
niemand aufgezählt hat.

**Das ist zeichengenau dieselbe Bauart wie Befund T-183-2, einen Buchstaben weiter.** Dort war es
`b?`, das im Wortlaut fehlte; hier ist es `c`, das in keiner Fassung je stand.

#### 25.2.2 Weg 4 — das Zeichenliteral mit Fluchtfolge, **ganz ohne rohe Zeichenkette**

Beide Werkzeuge erkennen das Zeichenliteral mit `/^'(\\.|[^'\\])'/` (`:285`, `:365`). Der Ausdruck
kennt genau zwei Rümpfe: ein Zeichen, oder ein Rückstrich und ein Zeichen. Rusts Fluchtfolgen sind
länger: `'\x22'` und `'\u{22}'` sind gültige Schreibweisen für dasselbe Anführungszeichen, und
**keine von beiden trifft der Ausdruck.** Beide Apostrophe bleiben dann stehen und gelten als
Lebenszeit — und der schließende paart sich mit dem nächsten Apostroph zu einem **Scheinliteral**.
Danach öffnet die folgende Anführung eine Zeichenkette, die nie zugeht.

Kunstquelle, vollständig — mehr steht nicht darin:

```rust
pub const TRENNER: [char; 2] = ['\u{22}','"'];

#[tauri::command]
pub fn takt_heimlich(app: AppHandle, url: String) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())?;
    let _ = "https://boese.example/x";
    Ok(())
}
```

Das Werkzeug liest `','` als Zeichenliteral (Komma), verschiebt sich damit um ein Zeichen und
nimmt die Anführung des echten `'"'` als Beginn einer Zeichenkette. **Gemessen: grün, Code 0,
6/28/0** — vierter Aufrufort und fremde Adresse unsichtbar, im Gerüst nachgeprüft.

**Warum dieser Weg schwerer wiegt als Weg 3:** In der Datei steht **keine rohe Zeichenkette**. Die
Weigerung aus A-A-33 kann hier gar nicht greifen, gleich wie ihr Ausdruck lautet — sie schaut nur
auf rohe Zeichenketten. Der ganze Riegel A-A-33/A-A-37/A-A-38 liegt neben der Tür.

**Der Auslöser, genau bestimmt** (je gemessen): Es genügt nicht die Fluchtfolge allein. Nötig ist,
daß hinter dem schließenden Apostroph mit **genau einem** Zeichen Abstand ein weiterer Apostroph
folgt.

| Schreibweise | Wirkung |
|---|---|
| `['\u{22}','"']` | **blind** |
| `['\u{22}', '"']` (mit Leerzeichen) | sichtbar |
| `matches!(c, '\u{201C}'\|'"')` | **blind** |
| `matches!(c, '\u{201C}' \| '"')` | sichtbar |
| `['\x22','"']` | **blind** |
| `const A: char = '\u{22}';` allein | sichtbar |

Ein Formatierer setzte das Leerzeichen und nähme dem Weg die Wirkung — **`cargo fmt` wird in
diesem Vorhaben nirgends erzwungen**, weder in `package.json` noch in den Arbeitsläufen unter
`.github/workflows/`. Auf diese Abwesenheit läßt sich keine Zusage stützen.

**Nähe zum Bestand.** Zeichenliterale mit Fluchtfolge gibt es heute keine; die elf vorhandenen sind
`'.'`, `':'`, `'-'`, `'\n'`, `'\0'`, `'?'`, `'#'`, `' '` und alle vom Ausdruck gedeckt.
`attachment.rs` schreibt aber bereits `"https://exam\u{200b}ple.org/"` und
`"https://example.org/\u{202e}gpj.exe"` (`:594` und die Zeilen darunter) — dieselbe Fluchtfolge, nur
in einer Zeichenkette statt in einem Zeichenliteral. Die Datei, die unsichtbare Zeichen aus Namen
entfernt, ist genau die, in der `'\u{202e}'` als Zeichenliteral als nächstes entsteht.

#### 25.2.3 Was daraus folgt, und was ausdrücklich nicht

Was **nicht** folgt: daß A-A-37 falsch war oder schlecht gebaut. Beide Auflagen sind vollständig
und sauber erfüllt, die elf Verstümmelungen sitzen, die drei Kunstquellen sind rot.

Was folgt: **Die Aufzählung ist als Verfahren am Ende.** Drei Wellen, vier Wege, jeder einzeln
behoben, jeder einzeln gegengeprobt — und der jeweils nächste stand schon daneben. Genau das sagt
E-063 Punkt 4 über diese Bauart, und 24.1.3 hat es für diese Klasse ausdrücklich vorhergesagt.

**Eine allgemeine Eigenschaft statt einer Aufzählung habe ich gesucht und gemessen — sie trägt
nicht.** Die naheliegende Fassung lautet: Weigere dich, wenn eines der Werkzeuge die Datei nicht
im neutralen Zustand verläßt (offene Zeichenkette, `blockDepth > 0`). Gemessen über alle acht
Rust-Dateien des Bestands und über alle sechs Kunstquellen: **Der Bestand ist neutral — und alle
sechs Kunstquellen sind es auch.** Die Anführungen gehen in jedem der Fälle zufällig gerade auf.
Die Eigenschaft findet nichts und steht deshalb hier als **gemessener Fehlschlag** und nicht als
Vorschlag.

Was trägt, sind zwei kleine, je gemessene Berichtigungen und eine offene Entscheidung
(**A-A-41**, **A-A-42**, **A-A-43** in 25.5).

### 25.3 O-GH — die 480 Farbpaare gegen die Klassen, die sie zu bewachen behaupten

**Anlaß.** Beim Nachtrag zu T-181 trug `contrast-check.mjs` ein Paar unter dem Namen
„Einstellungsschiene", das `--border-accent` maß, während die Fläche `--accent-border-subtle`
zeichnete. Der Lauf war grün und sagte über das Produkt nichts. Das ist die Klasse aus A-A-33 und
A-A-37 — ein Wächter, der etwas zusichert, was er nicht mißt —, nur in der Barrierefreiheit.

**Wie gemessen wurde.** Die Paarliste wird aus `apps/web/scripts/contrast-check.mjs` als Literal
ausgewertet (240 Paare, mal zwei Farbmodi = **480**). Dagegen gehalten: jede Deklaration in
`apps/web/src/styles/{app,base,components,showcase}.css` und jedes `var(--…)` in den `.ts`/`.tsx`
unter `apps/web/src`, aufgeteilt danach, ob der Token in einer **Vordergrund**-Eigenschaft steht
(`color`, `border*-color`, `outline-color`, `fill`, `stroke`, `accent-color`, Kurzformen) oder in
einer **Flächen**-Eigenschaft (`background*`). Farbtoken werden von Maßtoken über ihren Wert in
`packages/ui-tokens/tokens.css` getrennt.

Grundzahlen: **222** Token deklariert, **69** von Paaren genannt (48 als Vordergrund, 30 als
Fläche), **143** von den Klassen gezeichnet.

#### 25.3.1 Erste Richtung — Paare, die einen Wert prüfen, den keine Klasse zeichnet: **null**

**0 von 480.** Alle 69 Token, die die Paarliste nennt, werden von mindestens einer Klasse
gezeichnet. Der Anlaßfall ist behoben: `--accent-border-subtle` steht seit dem Nachtrag selbst in
der Liste (`contrast-check.mjs:400`, als `exempt`, „Rahmen der Exportkopfzeile, rein abgrenzend").

**Und genau hier gehört die Einschränkung hin, damit die Null nicht mehr behauptet, als sie
trägt.** Diese Messung ist **tokengenau, nicht flächengenau**. Der Anlaßfall war ein Fehler der
zweiten Art: Der Token `--border-accent` **wird** gezeichnet, nur nicht auf der Fläche, für die das
Paar ihn maß. Eine tokengenaue Messung hätte ihn nie gefunden, und sie findet auch heute keinen
seinesgleichen. Wer wissen will, ob ein Paar die richtige Fläche mißt, braucht die aufgelöste
Kaskade — und die hat niemand. **Die Null ist eine Untergrenze, nicht die Antwort.**

#### 25.3.2 Zweite Richtung — Klassen, die eine Farbe zeichnen, die kein Paar prüft: **15 Token**

Die gefährlichere Richtung, weil dort ein zu geringer Kontrast unbemerkt bleibt. Von den 15 sind
vier ohne Kontrastfrage: `--shadow-xs`, `--shadow-sm`, `--shadow-lg` (je `box-shadow`) und
`--bg-scrim` (die Abdunklung hinter dem Dialog). **Elf bleiben, und ich habe jede in ihrer
gezeichneten Umgebung gemessen**, hell und dunkel, mit derselben Rechnung, die der Lauf benutzt:

| Token, wo gezeichnet | gemessen gegen | hell | dunkel | Einordnung |
|---|---|---:|---:|---|
| `--danger-bg-hover` — `.btn--danger:hover` (`components.css:100`) | `--text-on-solid` | 9,00 | 11,45 | ausreichend |
| `--danger-bg-active` — `.btn--danger:active` (`:105`) | `--text-on-solid` | 11,52 | 14,84 | ausreichend |
| `--focus-ring-contrast` — `.on-solid:focus-visible` (`base.css:186`) | `--accent-bg` | 5,98 | 6,26 | ausreichend |
| `--note-billing-bg` — `.note--billing .note__frame` (`:1387`) | `--text-primary` | 15,76 | 14,64 | ausreichend |
| `--status-exported-border` — `.badge--exported` (`:397`) | `--bg-surface` | 8,93 | 11,41 | ausreichend |
| `--success-border` — `.chip--success` (`:538`) | `--bg-surface` | 1,50 | 2,04 | trägt keine Grenze |
| `--danger-border` — `.chip--danger` (`:548`) | `--bg-surface` | 1,66 | 1,79 | trägt keine Grenze |
| `--note-internal-border` — `.note` (`:1319`) | `--bg-surface` | 1,46 | 1,57 | trägt keine Grenze |
| `--note-billing-border` — `.note--billing` (`:1325`) | `--bg-surface` | 1,53 | 1,98 | trägt keine Grenze |
| `--timer-idle-border` — `.timer` (`:1201`) | `--bg-surface` / `--bg-subtle` | 1,46 / 1,30 | 1,57 / 1,43 | trägt keine Grenze |
| **`--status-reopened-hatch`** — `.badge--reopened` (`:409`) | `--status-reopened-bg` | **1,24** | **1,45** | **Befund** |

**Die fünf „trägt keine Grenze" sind kein Fehler, aber eine Lücke im Vertrag.** Ein Rahmen, dessen
Aussage schon in Füllung und Schrift steht — und beide sind gemessen —, ist Zierde und fällt nicht
unter SC 1.4.11. Das ist bei allen fünf so. Der Punkt ist ein anderer: **Für zwei Geschwister
derselben Bauart ist diese Entscheidung aufgeschrieben, für die fünf nicht.** `--warning-border`
steht als Merkposten im Lauf, mit den vier Zahlen und dem Satz, damit niemand die weichere Farbe
„aus Konsistenz" zurückholt; `--accent-border-subtle` steht als `exempt`-Paar. Die fünf stehen
nirgends. Wer morgen `.chip--danger` den Rahmen zur einzigen Unterscheidung macht, bekommt von
keinem Lauf ein Wort.

#### 25.3.3 Der Befund — die Schraffur, die ihre eigene Zusage nicht hält

`components.css:401` sagt über das Etikett „Erneut offen" wörtlich:

> *Erneut offen: Kontur plus Schraffur. Die Schraffur traegt die Unterscheidung auch dann, wenn
> Farbe nicht wahrgenommen wird.*

Eine Schraffur, die eine Unterscheidung **trägt**, ist ein grafisches Objekt, das zum Verständnis
nötig ist — SC 1.4.11, 3:1. Gemessen: **1,24:1 hell, 1,45:1 dunkel** gegen ihre eigene Fläche,
1,25:1 und 1,41:1 gegen die Karte. Ein Kontrastverhältnis von 1,24 ist eine Aussage über die
Leuchtdichte: **In Graustufen ist diese Schraffur so gut wie nicht vorhanden.** Der Satz im
Quelltext behauptet genau das Gegenteil, und **kein Paar mißt ihn.**

**Und derselbe Fall ein zweites Mal**, mit einem Unterschied, der ihn schlimmer macht.
`components.css:1329-1331` sagt über die gestreifte Randschiene des Leistungsfeldes:

> *Zweites Merkmal neben der Farbe: Die Schiene des Leistungsfelds ist gestreift, die des Vermerks
> einfarbig. Der Unterschied bleibt in Graustufen und bei Farbfehlsichtigkeit bestehen (R-08,
> SC 1.4.1).*

| gemessen | hell | dunkel |
|---|---:|---:|
| `--note-billing-rail-stripe` gegen `--note-billing-rail` (der Streifen gegen die Schiene) | **1,76** | **1,98** |
| `--note-billing-rail` gegen `--note-internal-rail` (die zwei Schienen gegeneinander) | **1,71** | **1,31** |

Hier sind **beide** Token in der Paarliste — aber beide nur gegen `--bg-surface`, also gegen die
Karte. **Gegen einander, und das ist die Frage, für die sie zitiert werden, mißt sie niemand.**
Das Ergebnis: Die Farbe unterscheidet die zwei Feldarten mit 1,71:1 und 1,31:1, das zweite Merkmal
mit 1,76:1 und 1,98:1. Beide Träger sind schwach, und der Satz über Graustufen und
Farbfehlsichtigkeit hält gemessen nicht.

**Warum das nicht kosmetisch ist.** Die Unterscheidung zwischen **Leistung** und **Vermerk** ist
die zwischen einem Feld, das in die Abrechnung geht, und einem, das intern bleibt (E-016). Sie
gehört zu den wenigen Stellen der Oberfläche, an denen Verwechslung Kundendaten in einen Export
trägt oder eine Leistung nicht abgerechnet läßt. Ein Wächter, der zwei Farben je gegen eine dritte
mißt und nie gegeneinander, sagt über diese Unterscheidung nichts.

#### 25.3.4 Dritte Richtung, gemessen und verworfen — die Rolle

Elf Token werden in einer Rolle gezeichnet, in der kein Paar sie mißt. **Zehn davon sind ein
Fehler meiner Einteilung, kein Befund:** Marker und Punkte (`--status-*-marker`,
`--timer-running-pulse`) werden mit `background-color` gezeichnet, weil sie kleine gefüllte Flächen
sind; ihre Füllung **ist** ihr Vordergrund, und die Paare messen sie richtig als solchen. Ebenso
`--accent-bg-*` als `border-color`. Bleibt `--border-subtle` als Trennlinienfläche
(`components.css:2312`) — Zierde. **Diese Richtung ergibt keinen Befund; sie steht hier, damit
niemand sie ein zweites Mal fährt.**

### 25.4 Befunde dieser Prüfung

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-1** | **muß** | **Dritter Weg an der Weigerung vorbei: die rohe C-Zeichenkette.** `cr"…"` und `cr#"…"#` (Rust ≥ 1.77) bringen beide Textwerkzeuge aus dem Takt, und `RAW_STRING_OPENER = /\bb?r#*"/` (`proof-shell-surface.mjs:395`) trifft sie nicht, weil vor dem `r` in `cr` keine Wortgrenze steht. Gemessen: Kunstquelle im Baum, Lauf **grün, Code 0, 6/28/0**, vierter Aufrufort für `open` und fremde Adresse unsichtbar, `RAW_STRING_OPENER` auf Urtext **und** Gerüst `false`. Zeichengleiche Bauart wie T-183-2. Gegenmittel: **A-A-41**. | frontend-dev |
| **T-189-2** | **muß** | **Vierter Weg, und er braucht gar keine rohe Zeichenkette.** `/^'(\\.\|[^'\\])'/` (`:285`, `:365`) kennt Rusts Fluchtfolgen `\x22` und `\u{22}` nicht; beide Apostrophe bleiben stehen, der schließende paart sich mit dem nächsten zu einem Scheinliteral, die folgende Anführung öffnet eine Zeichenkette, die nie zugeht. Gemessen mit `['\u{22}','"']` als **einziger** Zutat: **grün, Code 0, 6/28/0**. Der Riegel A-A-33/37/38 liegt hier neben der Tür, weil er nur auf rohe Zeichenketten schaut. `cargo fmt` wird nirgends erzwungen. Gegenmittel: **A-A-42**. | frontend-dev |
| **T-189-3** | Hinweis | **A-A-37 und A-A-38 sind erfüllt.** Elf von elf Verstümmelungen nachgemessen, jede Zahl und jede blinde Gegenprobe stimmt; die drei Kunstquellen aus 24.1.2/24.1.3 erzeugen die Weigerung, Code 1; kein falscher Alarm auf `appdata.rs`; Spiegel und Bestand zeichengleich. | Einordnung |
| **T-189-4** | Hinweis | **Die allgemeine Eigenschaft trägt nicht.** „Weigere dich, wenn ein Werkzeug die Datei nicht neutral verläßt" findet über alle acht Rust-Dateien und alle sechs Kunstquellen **nichts** — die Anführungen gehen jedes Mal zufällig auf. Gemessener Fehlschlag, kein Vorschlag. Was bleibt, ist ein voller Zerleger (**A-A-43**) — eine Entscheidung, keine Zeile. | Orchestrator |
| **T-189-5** | **soll** | **Die Schraffur hält ihre eigene Zusage nicht.** `components.css:401` sagt, die Schraffur trage die Unterscheidung auch ohne Farbwahrnehmung; gemessen **1,24:1** hell und **1,45:1** dunkel gegen ihre eigene Fläche. Kein Paar prüft `--status-reopened-hatch`. Gegenmittel: **A-A-44**. | frontend-dev / ui-designer |
| **T-189-6** | **soll** | **Die gestreifte Schiene ebenso, und sie trennt Leistung von Vermerk (E-016).** `components.css:1329-1331` beruft sich auf Graustufen und Farbfehlsichtigkeit. Gemessen: Streifen gegen Schiene **1,76 / 1,98**, die zwei Schienen gegeneinander **1,71 / 1,31**. Beide Token stehen in der Paarliste — aber nur gegen `--bg-surface`, nie gegeneinander. Gegenmittel: **A-A-44**. | frontend-dev / ui-designer |
| **T-189-7** | soll | **Fünfzehn gezeichnete Farben ohne jedes Paar**, elf davon mit Kontrastfrage (25.3.2). Fünf Rahmen liegen zwischen 1,30 und 2,04:1 und tragen deshalb keine Grenze — richtig, aber **nirgends aufgeschrieben**, während dieselbe Entscheidung für `--warning-border` und `--accent-border-subtle` im Lauf steht. `--focus-ring-contrast` ist die zugänglichkeitskritischste Farbe des Systems und hat kein Paar (mißt 5,98/6,26, also ausreichend). Gegenmittel: **A-A-45**. | frontend-dev |
| **T-189-8** | Hinweis | **Erste Richtung: null von 480** — kein Paar nennt einen Token, den keine Klasse zeichnet. Die Zahl ist tokengenau und damit eine **Untergrenze**: Der Anlaßfall (richtiger Token, falsche Fläche) wäre von ihr nicht gefunden worden. Wer die Frage flächengenau beantworten will, braucht die aufgelöste Kaskade. | Einordnung |

### 25.5 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-41** | Die Weigerung erkennt die rohe Zeichenkette **an ihrer Bauart statt an einer Liste von Präfixen**. In Rust berührt ein Bezeichner eine Anführung nur als Literalpräfix; die rohe Form ist genau die, deren Präfix auf `r` endet. Der Ausdruck lautet deshalb `/(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]*?r#*"\|(?<![A-Za-z0-9_])r#*"/` — er deckt `r`, `br`, `cr` und **jedes künftige Präfix**; `b"…"` und `c"…"` bleiben unberührt, weil sie gewöhnliche Zeichenketten mit gewöhnlichen Fluchtfolgen sind. Kein `g`-Merker, aus dem Grund, der bei `:395` schon steht. | Gemessen, beide Richtungen: **kein falscher Alarm** über alle acht Rust-Dateien des Bestands (auch nicht auf `attachment.rs:531`/`:594`, die `b""` tragen), und **alle sechs** Formen werden getroffen — `r"…"`, `r#"…"#`, `br"…"`, `br#"…"#`, `cr"…"`, `cr#"…"#`. Gegenproben: die vier aus A-A-38 plus **zwei neue** für `cr"…"` und `cr#"…"#`. Verstümmelungsprobe: Wer `r` aus dem Ausdruck streicht oder die Rückschau entfernt, muß eine Gegenprobe blind machen. |
| **A-A-42** | Der Ausdruck für das Zeichenliteral kennt **Rusts vollständige Fluchtfolgen-Grammatik**. Sie ist geschlossen und kurz, also ist das eine vollständige Aufzählung und keine offene: `/^'(\\u\{[0-9a-fA-F]{1,6}\}\|\\x[0-9a-fA-F]{2}\|\\.\|[^'\\\n])'/`. Er tritt an **beiden** Stellen an die Stelle des heutigen (`:285` und `:365`), damit die zwei Werkzeuge nicht wieder auseinanderlaufen. Das `\n` in der letzten Alternative hält die Lebenszeit weiterhin draußen. | Gemessen: `'a'`, `'\n'`, `'\0'`, `'\''`, `'\"'` unverändert getroffen; `'\x22'`, `'\u{22}'`, `'\u{1F600}'` **neu** getroffen; ein unabgeschlossenes `'a` weiterhin **nicht**. Zwei Gegenproben, beide heute blind: die Kunstquelle `['\u{22}','"']` mit viertem Aufrufort und fremder Adresse (verlangt: beide gefunden), und dieselbe mit `'\x22'`. Verstümmelungsprobe: Wer den Ausdruck auf die alte Fassung zurücksetzt, macht beide blind. |
| **A-A-43** | **Entscheidung, keine Zeile:** Ob `proof:shell-surface` einen vollen Zerleger für Rust bekommt. Vier Wege in drei Wellen, jeder einzeln behoben und einzeln gegengeprobt, der jeweils nächste stand daneben; die allgemeine Eigenschaft ist gemessen und trägt nicht (T-189-4). Solange nicht entschieden ist, steht im Kopf des Laufs, **daß** die Reichweite an einer Aufzählung hängt und daß diese Aufzählung viermal unvollständig war — dort, wo heute die Begründung steht. | Keine Messung; eine Entscheidung des Orchestrators. Die Kosten der Alternative sind bekannt: A-A-41 und A-A-42 sind zusammen zwei Ausdrücke und vier Gegenproben. |
| **A-A-44** | `contrast-check.mjs` bekommt die vier Paare, für die sich der Quelltext auf Graustufen und Farbfehlsichtigkeit beruft: `--status-reopened-hatch` gegen `--status-reopened-bg` (min 3), `--note-billing-rail-stripe` gegen `--note-billing-rail` (min 3), `--note-billing-rail` gegen `--note-internal-rail` (min 3) und `--focus-ring-contrast` gegen `--accent-bg` (min 3). Fällt eines durch, wird **entweder** der Tokenwert berichtigt **oder** der Satz im Quelltext zurückgenommen, der die Zusage macht — beides ist zulässig, keines von beiden stillschweigend. | Vier Paare, drei davon heute unter dem Mindestwert: 1,24/1,45 · 1,76/1,98 · 1,71/1,31. Das vierte (5,98/6,26) besteht und wird aufgenommen, weil der Fokusring die zugänglichkeitskritischste Farbe des Systems ist. |
| **A-A-45** | `contrast-check.mjs` mißt **seine eigene Vollständigkeit**. Der Lauf liest `apps/web/src/styles/**`, sammelt jeden Token, der dort in einer farbtragenden Eigenschaft steht, und wird **rot**, sobald einer davon in keinem Paar vorkommt — es sei denn, er steht in einer Ausnahmeliste **mit Grund**, wie sie `--warning-border` und `--accent-border-subtle` heute schon haben. Damit heißt „480 Paare bestanden" nicht mehr nur „diese 480 stimmen", sondern „und es wird nichts gezeichnet, das keines von ihnen ansieht". Das ist A-A-33 eine Sprache weiter: lieber verweigern als still durchgehen. | Zwei Gegenproben: (1) ein Token in eine Klasse geschrieben, den kein Paar nennt → der Lauf muß rot werden; (2) ein Paar aus der Liste gestrichen → derselbe Token wird unbedeckt, der Lauf muß rot werden. Die Ausgangslage ist gemessen: **15 Token** sind heute unbedeckt, davon vier ohne Kontrastfrage (drei Schatten, ein Scrim). Die Grenze der Messung gehört in den Kopf des Laufs: Sie ist **tokengenau, nicht flächengenau** — der Fall aus dem Nachtrag zu T-181 (richtiger Token, falsche Fläche) bliebe unentdeckt. |

### 25.6 Urteil dieser Prüfung

**Punkt 1 — die Nachmessung von A-A-37 und A-A-38: abnahmefähig.** Elf von elf Verstümmelungen
liefern gegen meinen Spiegel Zahl für Zahl das, was der Erbauer berichtet, bis hinunter zu der
Frage, **welche** Gegenprobe blind wird; die drei Kunstquellen aus 24.1.2 und 24.1.3 erzeugen die
Weigerung; der Bestand bleibt grün und `appdata.rs` löst nichts aus. Der Satz, auf dem die
Abweichung von T-173-2 ruhte, steht nicht mehr in der Prosa, sondern in vier Gegenproben — und J
und K zeigen, daß er rot wird, sobald ihn jemand wieder aufgibt. **Punkt 1 der Prüfung T-183 ist
damit abgenommen.**

**Punkt 2 — die Frage zum dritten Mal: die Antwort ist zum dritten Mal ja, und diesmal zweimal.**
`cr"…"` geht an der Weigerung vorbei, weil ihr Ausdruck ein Präfix aufzählt statt eine Bauart zu
beschreiben. `['\u{22}','"']` geht an ihr vorbei, weil sie nur rohe Zeichenketten ansieht und in
der Datei keine steht. Beide sind gemessen, beide lassen den Lauf **grün, Code 0, 6/28/0**, und
beide lassen einen vierten Aufrufort für `open` samt fremder Adresse im Baum stehen, während die
Schlußzeile drei aufzählt. Das sind zwei neue Befunde der Schwere **muß** — **nicht** eine Rücknahme
der Abnahme aus Punkt 1.

**Und deshalb ausdrücklich zu E-088 Punkt 4: die Wiedervorlage wird nicht frei.** Die Bedingung
dort lautet nicht „A-A-37 ist gebaut", sondern: der Satz „`check_file` ist die einzige Kontrolle vor
dem Prozeßstart" darf nicht länger auf einem Wächter ruhen, der nachweislich grün bleibt, während
ein vierter Aufrufort danebensteht. **Diese Bedingung ist heute noch nicht erfüllt** — sie ist
zweimal neu verletzt, mit zwei Kunstquellen, die diesen Bericht gemessen begleiten. Die
Wiedervorlage wird frei, wenn A-A-41 und A-A-42 gebaut sind und ihre sechs Gegenproben stehen; das
ist zusammen weniger Arbeit als A-A-37 war. Bis dahin gilt E-088 Punkt 1 unverändert weiter, und
das kostet nichts als einen Doppelpunkt in einem Dateinamen unter Linux.

**Punkt 3 — O-GH: Nacharbeit, in der zweiten Richtung.** Die erste Richtung ist null, und die Null
ist ehrlich nur als Untergrenze zu haben. Die zweite trägt: **15 gezeichnete Farben ohne Paar**,
und zweimal darunter beruft sich der Quelltext ausdrücklich auf eine Wirkung — die Schraffur des
Etiketts „Erneut offen" und der Streifen der Leistungsschiene —, die **gemessen 1,24:1 und 1,76:1**
beträgt und die er deshalb nicht hat. Der zweite Fall trennt Leistung von Vermerk und damit das,
was in die Abrechnung geht, von dem, was intern bleibt.

**Der Satz dieser Prüfung.** Ein Wächter, der eine Klasse durch Aufzählung deckt, ist so weit
verläßlich, wie jemand die Klasse überblickt hat — und dieser Überblick wird in dem Augenblick zur
Zusage, in dem der Wächter grün leuchtet. Viermal in drei Wellen war er unvollständig, und jedes
Mal war die nächste Lücke einen Buchstaben entfernt: `b`, dann `#`, dann `c`, dann `\u`. **Wo ein
Wächter aufzählt, gehört die Aufzählung selbst in eine Gegenprobe — oder an ihre Stelle die
Bauart.**

---

## 26. Nachmessung T-189/2 (2026-09-06) — A-A-41 und A-A-42 in gebauter Form, der fünfte Weg, und ein Kriterium statt eines Berichts

**Auftrag.** Nachmessung der Auflagen A-A-41 und A-A-42 (gebaut in T-173-4), Beurteilung der
Gegenprobe mit `9r"x"`, und die Frage nach einem fünften Weg. Spiegel wie in 25.0; nach dem
Einspielen der neuen Fassung liefert er `diff`-frei dieselbe Ausgabe wie der Bestand, beide Code 0,
beide **6 Prüfungen und 31 Gegenproben, 0 blind**. `proof:all` nicht gefahren (E-083 Punkt 3),
Guardian und 42Crunch nicht erneut versucht (E-079 Punkt 3).

### 26.1 A-A-41 und A-A-42 sind erfüllt

**Fünfzehn Verstümmelungen, fünfzehn Treffer**, und zwar nicht nur nach Zahl, sondern nach
**welcher** Gegenprobe blind wird: L2 (Rückschau entfernt) → „A-A-41: die Rückschau"; M (Ausdruck
zurück auf T-173-3) → „alle sechs Formen"; N (Zeichenliteral zurück) → „A-A-42: Fluchtfolgen";
J (`stripRustStrings` ohne Zeichenliteral) → **drei** blind, die zwei aus A-A-37 und die aus A-A-42.
L1 (`r` aus dem Ausdruck gestrichen) → 1 rot und 8 blind.

**Sieben Kunstquellen, je Code 1.** Die fünf mit roher Zeichenkette über die Weigerung; die zwei
Fluchtfolgen-Quellen (`['\u{22}','"']`, `['\x22','"']`) über den **gefundenen** vierten Aufrufort
samt fremder Adresse — dort kann die Weigerung strukturell nicht greifen, der Lauf mußte die Datei
also richtig lesen. Beide Ausdrücke sind zeichengleich aus A-A-41 und A-A-42 übernommen
(`proof-shell-surface.mjs:291` und `:467`).

### 26.2 Die Gegenprobe `9r"x"` — ehrlich benannt, aber keine Verhaltens-Gegenprobe

Die Rückschau `(?<![A-Za-z0-9_])` ist gegen **gültiges** Rust wirkungslos. Gemessen: mit und ohne
sie verglichen über alle acht Rust-Dateien des Bestands, je im Urtext und im Gerüst, und über 23
gültige Schreibweisen — **null Unterschiede**. Der Unterschied entsteht nur, wenn dem `r` eine
reine Ziffernfolge unmittelbar vorangeht, und genau das lehnt der Übersetzer ab: `rustc --edition
2021` meldet für `9r"x"` einen Syntaxfehler und für `a9r"x"` ``prefix `a9r` is unknown``; `cr"x"`
dagegen lexiert sauber (nur `E0308`). Hinzu kommt: Ohne die Rückschau trifft der Ausdruck **mehr**
Texte, der Lauf verweigert also **mehr** Dateien — er wird strenger, nie milder, und ein falscher
Alarm auf dem Bestand entsteht nicht (L2: 0 Prüfungen rot).

**Folgerung.** L2 war nie eine Schwächung. Eine Verstümmelung, die an keiner Eingabe etwas ändert,
welche die Sprache erzeugen kann, **soll** die Gegenproben überleben. Sie mit `9r"x"` zu beantworten
macht aus einer Verhaltens-Gegenprobe eine **Festschreibung des Quelltextes** — sie sagt nur noch,
daß diese Zeichen im Ausdruck noch stehen —, und sie zählt ununterschieden in „31 Gegenproben, 0
blind". Der Wert dieser Liste hängt daran, daß jeder Eintrag mit „ja, und hier ist der Verstoß, den
sie gefangen hätte" beantwortbar ist. **Hinweis, keine Nacharbeit**: Die Anmerkung im Quelltext
nennt die Quelle ausdrücklich künstlich, und damit ist der Maßstab aus T-183 („die zulässige
Ausnahme wird benannt statt erschlichen") gewahrt. Berichtigt wird die Einordnung, nicht die
Absicht (**A-A-48**).

### 26.3 Der fünfte Weg — das Zeichenliteral außerhalb der BMP

`CHAR_LITERAL` (`:291`) trägt keinen `u`-Merker; ohne ihn trifft `[^'\\\n]` genau **eine
UTF-16-Einheit**. Ein Zeichen oberhalb von U+FFFF steht als Ersatzpaar, also als zwei — der Rumpf
paßt nicht, beide Apostrophe bleiben als vermeintliche Lebenszeit stehen, der schließende paart
sich mit dem nächsten zu einem Scheinliteral, und die folgende Anführung öffnet eine Zeichenkette,
die nie zugeht. **Derselbe Mechanismus wie T-189-2, eine Kodierungsebene tiefer.**

Die ganze Kunstquelle:

```rust
pub const TRENNER: [char; 2] = ['😀','"'];
```

Dahinter ein vierter Aufrufort für `open` und `https://boese.example/x`. **Gemessen: grün,
Beendigungscode 0, 6 Prüfungen und 31 Gegenproben, 0 blind**, und Prüfung 3 meldet wörtlich
„3 namentliche Aufruforte für `open`, jeder mit seiner Prüfung".

**Die Kontrollprobe:** dieselbe Datei, dasselbe Zeichen, andere Schreibweise. `['\u{1F600}','"']`
→ **Code 1**, Aufrufort und Adresse gefunden. Ein Zeichen, zwei Schreibweisen, entgegengesetzte
Ergebnisse.

**Nähe zum Bestand: geringer als bei allen vier Vorgängern.** Der Rust-Anteil trägt heute kein
einziges Zeichen oberhalb der BMP; das Nicht-ASCII dort ist durchweg BMP. Der Befund bleibt
trotzdem **muß**, weil das Ergebnis dasselbe ist — ein grüner Lauf, der drei Aufruforte zusichert,
während vier dastehen — und weil die Behebung **ein Zeichen** kostet (A-A-46, gemessen: Bestand
grün ohne falschen Alarm, drei Kunstquellen rot, Längentreue erhalten).

### 26.4 Neunzehn Formen, achtzehn gefangen — die Klasse ist erstmals begrenzt

Damit die Frage nach dem sechsten Weg nicht wieder an der Vorstellungskraft des Prüfers hängt, ist
die lexikalische Grammatik der Rust-Referenz **vollständig** durch den Lauf gefahren worden, je
eine Kunstquelle mit einer Anführung im Rumpf und demselben vierten Aufrufort dahinter:
Zeichenliteral (`'"'`, `'\u{22}'`, `'\x22'`, `'😀'` allein), Byteliteral (`b'"'`, `b'\x22'`),
Zeichenkette, Bytezeichenkette, C-Zeichenkette, die drei rohen Formen, Zeilen-, Block- und
geschachtelter Blockkommentar, Lebenszeit, Fortsetzungszeile und `['\u{22}','"']`.

**Achtzehn rot, eine grün** — und die eine ist `['😀','"']`. Damit ist „gibt es einen sechsten
Weg?" erstmals eine **begrenzte** Frage.

### 26.5 Befunde

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-9** | **muß** | Fünfter Weg: `['😀','"']`. Lauf **grün, Code 0, 6/31/0**, Prüfung 3 sichert drei Aufruforte zu, während vier dastehen. Kontrollprobe mit derselben Zeichenkodierung als Fluchtfolge: Code 1. Gegenmittel **A-A-46**. | frontend-dev |
| **T-189-10** | Hinweis | `9r"x"` mißt den Ausdruck, nicht die Sprache; null Unterschiede über acht Dateien und 23 Schreibweisen, `rustc` lehnt den Unterschiedsfall ab. Gegenmittel **A-A-48**. | frontend-dev |
| **T-189-11** | Hinweis | A-A-41 und A-A-42 erfüllt; fünfzehn von fünfzehn und sieben von sieben nachgemessen. | Einordnung |
| **T-189-12** | Hinweis | Neunzehn lexikalische Formen gefahren, achtzehn gefangen. Gegenmittel **A-A-47**. | frontend-dev |

### 26.6 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-46** | `CHAR_LITERAL` bekommt den `u`-Merker (oder `[\uD800-\uDBFF][\uDC00-\uDFFF]` als weitere Alternative), damit ein Zeichen oberhalb der BMP als **ein** Zeichen gilt. | Gemessen: Bestand grün ohne falschen Alarm (6/31/0); `['😀','"']` mit und ohne fremde Adresse **rot**; `['\u{1F600}','"']` unverändert rot; `'a'`, `'ä'`, `'字'`, `'\n'`, `'\0'`, `'\''`, `'\x22'`, `'\u{22}'` unverändert getroffen; `'a`, `'a str`, `'static` unverändert nicht. Längentreue erhalten (`'😀'` → UTF-16-Länge 4). Eine Gegenprobe, heute blind: `['😀','"']` mit viertem Aufrufort **und** fremder Adresse. |
| **A-A-47** | Die Reichweite wird an einer **geschlossenen** Liste gemessen statt an der Erfindungskraft des jeweiligen Prüfers: je eine Kunstquelle für **jede** lexikalische Form der Rust-Referenz, in der eine Anführung vorkommen kann. Der Kopf des Laufs nennt diese Liste als das, woran seine Reichweite gemessen ist — an die Stelle der Aufzählung der bisher gefundenen Wege. | Die neunzehn Läufe aus 26.4 sind die Ausgangsmessung: achtzehn gefangen, eine blind. Die Liste ist der Referenz entnommen und damit endlich und nachprüfbar. |
| **A-A-48** | Die Gegenprobe „A-A-41: die Rückschau" wird aus der Zählung genommen — eigene Rubrik oder ersatzlos. Die Rückschau selbst **bleibt**. Daneben steht das hier Gemessene. | 26.2. |

### 26.7 Urteil

**Punkt 1 aus T-183 bleibt abgenommen.** A-A-41 und A-A-42 sind vollständig und sauber erfüllt;
an der Arbeit aus T-173-4 ist nichts zu beanstanden.

**Die Wiedervorlage aus E-088 Punkt 4 wird nicht frei.** Die Bedingung dort lautet wörtlich: der
Satz „`check_file` ist die einzige Kontrolle vor dem Prozeßstart" darf nicht länger auf einem
Wächter ruhen, *der nachweislich grün bleibt, während ein vierter Aufrufort danebensteht*. Mit
`['😀','"']` bleibt er nachweislich grün, Code 0, und sagt dabei „3 namentliche Aufruforte". Die
Bedingung ist wörtlich verletzt.

**Und damit das nicht ein viertes Mal so ausgeht, gehört der Ausweg in dieselbe Zeile.** Eine
Bedingung, die an einem Negativbeweis hängt — „dem Prüfer ist nichts mehr eingefallen" —, kann
niemand erfüllen. **Vorschlag an den Orchestrator, als Entscheidung:** Die Wiedervorlage wird frei,
wenn **A-A-46 gebaut und A-A-47 erfüllt** ist. Das ist geschlossen und abhakbar; erfüllt ist es
heute zu 18 von 19, und es fehlt ein Zeichen im Ausdruck sowie die Aufnahme der neunzehn Quellen
in den Gegenprobenteil.

**Der Satz dieser Nachmessung.** Fünf Wege in vier Wellen, jeder gefunden, jeder behoben, jeder
gegengeprobt — und jedes Mal war die Antwort auf „gibt es noch einen?" ein Bericht statt eines
Kriteriums. **Eine Aufzählung hört erst dann auf, ein Risiko zu sein, wenn sie von außen kommt:
nicht aus dem, was ein Prüfer sich vorstellen konnte, sondern aus der Grammatik der Sprache, die
der Wächter zu lesen behauptet.**

---

## 27. Nachmessung T-189/3 (2026-09-06) — der Wächter ist zu

**Auftrag.** Nachmessung von A-A-46, A-A-47 und A-A-48 (gebaut in T-173-5) und die Entscheidung
über E-088 Punkt 4 in der Fassung von E-089. Spiegel wie in 25.0; er liefert `diff`-frei dieselbe
Ausgabe wie der Bestand, beide Code 0, beide **6 Prüfungen und 49 Gegenproben, 0 blind**.
`proof:all` nicht gefahren; Guardian und 42Crunch nicht erneut versucht.

### 27.1 A-A-47 ist erfüllt — neunzehn zu neunzehn

Die Ausgabe trägt **19** Zeilen `A-A-47: <Form>`, eins zu eins mit der Aufstellung aus 26.4, ohne
Rest. Die Kunstquellen sind die **echten**: `RUST_LEXICAL_FORMS` setzt für die entscheidende Form
`['😀','"']` **ohne Leerzeichen nach dem Komma**, also mit genau der Apostrophpaarung, die den Takt
bricht — ein Leerzeichen hätte die Probe trivial bestehen lassen. `lexicalFormProbe` hängt an jeden
Kopf denselben vierten Aufrufort für `open` samt fremder Adresse und verlangt bei sechzehn Formen
**beide** Befunde, bei den drei rohen die Weigerung.

**Eine blinde Zeile nennt die Form.** Verstümmelung **O** (`u`-Merker gestrichen) macht **genau
eine** Gegenprobe blind, und sie lautet `A-A-47: Apostrophpaarung mit einem Zeichen oberhalb
U+FFFF`. **L2** (Rückschau entfernt) ergibt Code 0, 0 rot, 0 blind — wie A-A-48 es erwartet.
Einundzwanzig Verstümmelungen gefahren, alle gemeldeten bestätigt; E, I, M, J, K und N nennen die
gefallene Form beim Namen. Neun Kunstquellen, neun rot, darunter der fünfte Weg mit und ohne
fremde Adresse und die Kontrollprobe `['\u{1F600}','"']`.

### 27.2 Beißen alle neunzehn? Dreizehn ja, sechs nicht — und das ist kein Mangel

Sechs weitere Verstümmelungen eigens für diese Frage: **Q** (Zeilenkommentar-Zweig entfernt) und
**T** (Blockkommentar-Zweig entfernt) machen die zugehörige Formprobe blind; **R** (Fluchtzeichen
in `stripRustStrings` entfernt) macht Zeichenkette, Bytezeichenkette und C-Zeichenkette zugleich
blind; **P** (Zeichenliteral überbreit) macht eine **Prüfung rot** statt einer Probe blind.

Sechs Proben habe ich unter keiner der 21 Verstümmelungen blind bekommen: die drei
Zeichenliteral-Formen **allein** (`\u{…}`, `\x…`, oberhalb U+FFFF), das Byteliteral mit `\x…`, die
Fortsetzungszeile und die Lebenszeit. **Für vier ist der Grund gemessen:** Ein alleinstehendes,
unverstandenes Zeichenliteral hinterläßt zwei lose Apostrophe und **keine Anführung** — es bricht
nichts. N nimmt dem Ausdruck `\u{…}` und `\x…`, O nimmt ihm das Zeichen oberhalb U+FFFF, und keine
der drei „allein"-Proben wird blind, wohl aber die zugehörigen **Apostrophpaarungen**. Jeder
Mechanismus der Liste ist damit von mindestens einer beißenden Probe gedeckt; die Lebenszeit
schützt die Gegenrichtung und ist über P gedeckt.

**Einordnung, kein Befund:** „49 Gegenproben, 0 blind" führt jetzt Proben unterschiedlicher Kraft
in einer Zahl. Anders als bei A-A-48, wo eine Probe **nie** beißen konnte, können hier sechs es
**derzeit** nicht — der Unterschied ist erheblich und wird nicht eingeebnet. Empfehlung: in der
Kopfzeile vermerken, welche Form eine paarige beißende Probe hat (T-189-14).

### 27.3 Die Liste stammt aus der Referenz, nicht aus der Sprache

Der Erbauer hat das selbst benannt und in den Kopf des Laufs geschrieben. **Ein Satz im Kopf reicht
nicht ganz** — das ist genau die Bauart, die in diesem Faden fünfmal nachgegeben hat, und ich bin
an 24.6 gebunden: *wo ein Wächter etwas begründet, statt es zu messen, gehört die Begründung in die
nächste Gegenprobe.*

`apps/desktop/src-tauri/Cargo.toml:5-6` erklärt `edition = "2021"` und `rust-version = "1.82"`.
Eine `rust-toolchain.toml` gibt es nicht, die Arbeitsläufe legen keine Fassung fest, örtlich läuft
`rustc 1.89.0` — und **nirgends steht, gegen welches Rust die Liste gelesen wurde**. Der billige
Wächter darüber ist **A-A-49**. Die Referenz zur Laufzeit zu holen ist ausgeschlossen: das wäre
eine zweite Adresse außerhalb `127.0.0.1` und damit eine Aufhebung von E-001.

**Größenordnung, damit das nicht überzeichnet wird:** Rust hat in einem Jahrzehnt **eine** neue
Literalform bekommen (`c"…"` / `cr"…"`, stabil seit 1.77). Das Restrisiko ist echt, aber langsam,
und seine Folge ist genau die Klasse, die diese Liste findbar macht. Deshalb **soll**, nicht muß.

### 27.4 Befunde und Auflage

| Kennung | Schwere | Sache | Zuständig |
|---|---|---|---|
| **T-189-13** | Hinweis | A-A-46, A-A-47, A-A-48 erfüllt und nachgemessen: 19 von 19 Formen als eigene, namentlich benannte Probe; O macht genau eine blind und nennt sie; L2 wie erwartet Code 0/0/0; 21 Verstümmelungen, 9 Kunstquellen. | Einordnung |
| **T-189-14** | Hinweis | Sechs der 19 Proben unter keiner Verstümmelung blind; für vier ist der Grund gemessen und harmlos. Empfehlung: paarige Deckung in der Kopfzeile vermerken. | frontend-dev |
| **T-189-15** | soll | Die Bindung der Liste an die Referenz ist ein Satz, keine Messung; nirgends steht, gegen welches Rust sie gelesen wurde. Gegenmittel **A-A-49**. | frontend-dev |

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-49** | Der Lauf liest `edition` und `rust-version` aus `apps/desktop/src-tauri/Cargo.toml` und wird **rot**, sobald einer der Werte von dem abweicht, gegen den `RUST_LEXICAL_FORMS` geprüft ist; daneben steht die `rustc`-Fassung, mit der die Referenz gelesen wurde, und die Grenze: `rust-version` ist die untere Schranke, nicht die Baufassung. Die Referenz zur Laufzeit zu holen ist **ausgeschlossen** (E-001). | Zwei Gegenproben: `edition` auf `2024` → rot; `rust-version` auf `1.90` → rot. Ausgangslage: `2021` / `1.82`, örtlich `rustc 1.89.0`, keine Toolchain-Festlegung. |

### 27.5 Urteil

**A-A-46, A-A-47 und A-A-48 sind erfüllt.**

**Die Wiedervorlage aus E-088 Punkt 4 in der Fassung von E-089 wird frei.** E-089 Punkt 1 nennt die
Bedingung — A-A-46 gebaut, A-A-47 erfüllt —, und beides ist nachgemessen. Von der Sicherheitsseite
steht der Doppelpunktfrage als Entscheidungsvorlage nichts mehr im Weg. **T-189-14 und T-189-15
sind Hinweise für die nächste Welle und ausdrücklich kein Vorbehalt gegen diese Freigabe**; ich
habe das Kriterium selbst vorgeschlagen und hänge keine Bedingung daran, die vorher nicht dastand.

**Der Satz dieser Nachmessung.** Fünf Wege in fünf Wellen, und was den Faden beendet hat, war nicht
der sechste Fund, sondern der Wechsel der Frage: von „ist jemandem noch etwas eingefallen" zu
„steht jede Form der Referenz da". Die erste kann niemand beantworten, die zweite war in einer
Welle abgehakt. **Ein Wächter wird nicht dadurch vollständig, daß man länger sucht, sondern
dadurch, daß sein Maßstab von außerhalb kommt.**

---

## 28. Prüfung T-206 (2026-09-06) — eine Abnahme, die nie stattgefunden hat, und drei Läufe an derselben Frage

**Auftrag.** Zwei Punkte. **O-HF:** SP-09 aus `docs/design/textbestand.md` wartet seit T-177 auf
eine Stellungnahme von dieser Seite, und es gibt keine — die Abnahme in T-189/3 betraf den
Codepunkt-Wächter im Rust-Anteil, nicht `NoteField`. **O-GV:** Gilt die Weigerungsregel aus A-A-33
sinngemäß auch für `proof:openapi`, `proof:route-policy` und `proof:template-fields`? Die Frage
steht seit T-183 offen; ich hatte sie selbst gestellt und nur die zwei beauftragten Läufe geprüft.

### 28.0 Wie gemessen wurde

Wie in T-176, T-183 und T-189: am Verhalten, außerhalb des Bestands. Ein Spiegel unter `/tmp` mit
dem vollständigen Baum, ein Verweis auf den echten Modulbestand, die drei Läufe zuerst dort gegen
den unveränderten Baum. **Die Prüfzeilen des Spiegels sind zeichengleich mit denen des Bestands**
(gemessen über eine Prüfsumme aller `ok`/`FEHL`-Zeilen: `proof:template-fields` 30/0,
`proof:route-policy` 40/0, `proof:openapi` 110/0 — beide Seiten dieselbe Summe). Kunstquellen und
Verstümmelungen sind im Spiegel entstanden und dort geblieben; nach jeder Messung ist der Spiegel
zurückgesetzt und gegen die Ausgangszahlen nachgefahren worden.

**`proof:all` nicht gefahren** (E-083 Punkt 3), Guardian und 42Crunch **nicht** erneut versucht
(E-079 Punkt 3) — **elftes** Mal ohne Werkzeug. Gesucht wurde über die versionierten Dateien
(`git grep`), weil im Arbeitsbaum Bauergebnisse mit veralteten Abschriften liegen.

---

### 28.1 O-HF — SP-09, und was von ihm fallen darf

**Was SP-09 heute ist.** Sechs Texte in `apps/web/src/components/NoteField.tsx`, drei je Feldart:
Kopfband, Marke (nur für Vorlesehilfen, im `<label>`), Fußnote (`help`, über `aria-describedby`
verbunden).

| Träger | Wortlaut | Zeichen |
|---|---|---|
| Kopfband Leistung | „Verlässt Takt · steht in der Abrechnung" | 39 |
| Marke Leistung | „Wird exportiert" | 15 |
| Fußnote Leistung | „Wird beim Export an das Abrechnungstool übertragen und steht dort auf der Rechnung des Kunden. Standardvorlage: Feld „Notiz“." | **125** |
| Kopfband Vermerk | „Bleibt in Takt" | 14 |
| Marke Vermerk | „Wird nicht exportiert" | 21 |
| Fußnote Vermerk | „Bleibt in Takt. Wird nie exportiert — auch nicht über eine eigene Exportvorlage." | **80** |

Die vorgemerkte Kürzung gilt der **Fußnote der Leistung**; die Aufnahme führt sie als
„**SP-09 Kürzung** `NoteField.tsx:50` (falls gewollt) | spec-ux-reviewer **und**
security-checker | E-016, R-06, R-08". Die Zeilennummer ist veraltet, gemeint ist der Satz mit 125
Zeichen. Anlaß ist Regel S-05: „**Höchstens 80 Zeichen, solange er dauerhaft sichtbar ist.** Alles
darüber ist entweder zustandsgebunden (T1) oder es fällt."

#### 28.1.1 Was die Zusicherung des Vermerks wirklich trägt

Bevor über den Satz zu urteilen ist, war zu messen, ob er allein steht. Er steht nicht allein —
die Grenze selbst ist **sechsfach** gebaut, und fünf der sechs Schichten sind gemessen:

1. **Typ der Domäne.** `ExportSourcePath` kennt keinen Notizpfad; `ExportGroup` und
   `ExportCandidate` tragen das Feld nicht.
2. **Zweiter Typwächter am Katalog.** `apps/local-api/src/usecases/export-catalog.ts` führt
   `NoteSourceIsNotPublished` als `Assert<…>` — „Übersetzungsfehler, sobald ein Notizpfad wählbar
   würde."
3. **Die Auswahlliste, wörtlich verglichen.** `packages/export/src/sources.ts`: „**Ohne jede
   Normalisierung.**" Gemessen an der gebauten Funktion: `todo.note` und `todo.internalNote`
   ergeben `export_source_forbidden`, ebenso `Todo.CallNumber` und `" todo.callNumber "`; nur die
   wörtliche Form kommt durch.
4. **Der Renderer, wenn man die Prüfung umgeht.** Mit einer Gruppe, der ich das Feld `todoNote`
   angehängt habe, und der Quelle `todo.note` liefert `renderExportGroup`
   `{"Notiz":null,"Call":"TCK-000009"}` — kein Wert, nicht der Vermerk.
5. **Durch den HTTP-Stapel.** `proof:export-api`: „der Vermerk als Quelle ergibt
   `export_source_forbidden`".
6. **In der geschriebenen Datei.** `proof:export`: „der interne Vermerk steht nirgends in der Datei
   (A-7.2, R-06)", dazu `packages/export/test/note-boundary-property.test.ts`.

**Daraus folgt für die Fußnote des Vermerks: Sie sagt die Wahrheit, und die Wahrheit ist
durchgesetzt.** Das ist kein Grund, sie zu streichen — es ist der Grund, warum sie stehenbleiben
darf, ohne eine Zusage zu machen, die der Code nicht hält.

#### 28.1.2 Welcher Satz von SP-09 die Grenze allein trägt

Über die versionierten Dateien gesucht, im **Produkt** (die Musterseite unter `showcase/**` zeigt
ein Beispiel und ist kein Träger):

- **„Rechnung des Kunden"** kommt in der Oberfläche genau **einmal** vor: in dieser Fußnote. Kein
  anderer Text im Produkt nennt den **Empfänger** des Leistungstextes.
- **„Wird nie exportiert — auch nicht über eine eigene Exportvorlage"** kommt genau **einmal** vor.
  Kein anderer Text im Produkt sagt dem Benutzer, daß die Zusicherung eine selbstgebaute
  Exportvorlage überlebt.
- **Kein Prüffall und kein Nachweispfad hält heute einen dieser sechs Texte fest.** Weder
  `tests/e2e/**` noch ein `proof:`-Lauf nennt „Verlässt Takt", „Bleibt in Takt", „Rechnung des
  Kunden" oder „eigene Exportvorlage".

#### 28.1.3 Urteil zu SP-09

**SP-09 bleibt. Von den sechs Texten darf genau einer gekürzt werden, und zwar um genau einen
Satz.**

| Träger | Urteil von dieser Seite |
|---|---|
| Kopfband beider Feldarten | **muß stehen.** Das Paar Sicht/Gehör; die Datei selbst begründet bei „Merkmal 1 und 4 tragen auch dann, wenn das Kopfband abgeschnitten ist" |
| Marke beider Feldarten | **muß stehen.** Sie ist der einzige Träger im **Namen** des Feldes und damit das, was eine Vorlesehilfe vor der Eingabe ansagt |
| Fußnote Vermerk, ganz | **muß stehen, unverändert.** 80 Zeichen, also innerhalb von S-05; der zweite Halbsatz ist die einzige Antwort des Produkts auf R-06 |
| Fußnote Leistung, Satz 1 („… und steht dort auf der Rechnung des Kunden.") | **muß stehen, einschließlich der Empfängerangabe** |
| Fußnote Leistung, Satz 2 („Standardvorlage: Feld „Notiz“.") | **darf fallen** — unter drei Bedingungen |

**Warum Satz 1 nicht angetastet werden darf.** Er ist eine **Folge**, keine Mechanik. Streicht man
„und steht dort auf der Rechnung des Kunden", bleibt „wird übertragen" — eine Aussage über einen
Vorgang innerhalb der Werkzeugkette. Genau die Verwechslung, die R-08 „der wahrscheinlichste
Bedienfehler in diesem Produkt" nennt und die „erst in der Abrechnung sichtbar" wird, hängt daran,
daß der Benutzer beim Tippen weiß, wer mitliest. Es ist außerdem die **einzige** Stelle im Produkt,
an der das dasteht, und sie steht am Ort der Eingabe — die Warnung des Exportbildschirms (SP-10)
kommt an, wenn der Text längst geschrieben ist.

**Warum Satz 2 fallen darf.** Er nennt eine **Zuordnung**, keine Grenze: daß der Schlüssel `Notiz`
in der Datei die Leistung meint (A-8.2, E-016). Ein Irrtum darüber kann **keinen** Vermerk
exportieren — das verhindern die sechs Schichten aus 28.1.1 —, er kann nur eine falsche Vorstellung
darüber erzeugen, was in einer Datei steht, die man ohnehin lesen kann. Und die Zuordnung steht
bereits dort, wo sie gebraucht wird: `export-catalog.ts` gibt zur Quelle `group.bookingNotes` den
Satz „Die Leistungstexte aller enthaltenen Buchungen, vom Dienst zu einem Text zusammengeführt.
**Die Quelle für das Feld „Notiz“ der Standardvorlage.**" aus, und `TemplateFields.tsx` zeigt ihn
im Vorlageneditor als `hint` beziehungsweise als `sourceInfo(...)?.description`. Am Notizfeld ist
der Satz damit ein **D** zum Editor, nicht ein **F** an seinem Ort.

**Die drei Bedingungen.** Ich lege hier keine Fassung vor; verfassen und genehmigen in einer Hand
geht nach E-078 Punkt 3 nicht. Ich nenne, woran eine Fassung zu messen ist:

- **B-1 — die Kürzung stellt S-05 nicht her, und das ist offen zu sagen.** Ohne Satz 2 bleiben
  **94** Zeichen, die Grenze liegt bei 80. Wer die Kürzung vorlegt, sagt dazu, welchen der drei
  Ausgänge von S-05 er nimmt. Eine weitere Kürzung **zu Lasten der Empfängerangabe** ist von dieser
  Zustimmung **nicht** gedeckt.
- **B-2 — der Ausgang „zustandsgebunden" ist für dieses Feld versperrt.** S-05 sagt: „Ein Hinweis,
  der nur in einem Zustand gilt, steht nur in diesem Zustand — und dann **auch** nicht in
  `aria-describedby`." Für die Fußnote der Leistung hieße das: Der einzige hörbare Träger vor der
  Eingabe wäre die Marke „Wird exportiert" — sie sagt **daß**, nicht **wohin**. **UM-01 darf auf
  `NoteField` nicht angewendet werden**, solange die Empfängerangabe nur in der Fußnote steht.
- **B-3 — Satz 2 darf nur fallen, solange der Editor die Zuordnung nennt.** Der Satz in
  `export-catalog.ts` ist heute durch nichts festgehalten. Fällt er, ist die Zuordnung nirgends
  mehr im Produkt. Dazu die Auflage **A-A-50**.

**Nicht berührt:** die Fußnote des Vermerks, beide Kopfbänder, beide Marken, `NoteField.required`
(das ist O-FX/T-184 und gehört nicht hierher) und die Reihenfolge der sechs Merkmale.

---

### 28.2 O-GV — dieselbe Frage an drei weitere Läufe

**Die Regel, um die es geht.** A-A-33: Ein Lauf, der über einen Bestand urteilt, **weigert sich**,
wenn er den Bestand nicht lesen kann, und meldet das als Befund — statt grün zu bleiben über etwas,
das er nicht gesehen hat. Für die drei Läufe hier ist die Regel zu übersetzen, denn keiner von
ihnen liest Quelltext als Text: Alle drei **führen** den zusammengebauten Dienst aus. Die
sinngemäße Fassung lautet deshalb:

> **Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden hat.** Eine Aufzählung,
> die still schrumpfen kann, eine Menge, die leer sein darf, und ein Angriff, der nicht ankommt,
> sind dieselbe Blindheit wie ein Zerleger, der aus dem Takt gerät.

Gemessen wurde nach diesem Maßstab, mit Kunstquelle und Verstümmelung, wie fünfmal zuvor.

#### 28.2.1 Befund: eine Route, die beide Läufe nicht sehen (T-206-1)

`proof-route-policy.mjs` und `proof-openapi.mjs` fragen den Dienst nach seiner eigenen Routenliste
und filtern beide mit **derselben Zeile** und beinahe demselben Kommentar:

- `proof-route-policy.mjs`: „`Hono#routes` führt auch die Kettenglieder. Sie stehen als `ALL /*` und
  sind keine Endpunkte — alles mit konkreter Methode ist einer." → `if (route.method === 'ALL') continue;`
- `proof-openapi.mjs`: „`Hono#routes` führt auch die Kettenglieder. Sie stehen als `ALL /*`." →
  `if (route.method === 'ALL') continue;`

Der Satz stimmt für Kettenglieder. Er stimmt **nicht** für `app.all(...)` und `app.on('ALL', …)` —
Hono trägt beides mit derselben Methode ein, und der Filter wirft es mit weg.

**Kunstquelle, im Spiegel gemessen.** Eine Zeile in `app.ts`, unmittelbar vor
`app.route(API_BASE_PATH, api)`:

```ts
api.all('/addin/leak', (c) => c.json({ data: { leak: 'GEHEIMER-INTERNER-VERMERK' } }));
```

Gemessen mit dem echten Add-in-Token durch die vollständige Kette:

| Aufruf | Ergebnis |
|---|---|
| `GET /api/v1/addin/leak` mit **Add-in-Token** | **200**, `{"data":{"leak":"GEHEIMER-INTERNER-VERMERK"}}` |
| dasselbe mit Sitzungsgeheimnis | 200 |
| dasselbe ohne gültigen Nachweis | 401 |

**Und beide Läufe bleiben grün.** `proof:route-policy` **40 bestanden, 0 fehlgeschlagen, Code 0**;
`proof:openapi` **110/0, Code 0**. Dabei stehen vier Zusicherungen im Klartext da, und alle vier
sind in diesem Augenblick falsch:

- „die Routenliste des Dienstes ist auslesbar und vollständig (70 Operationen)" — es sind 71.
- „die Add-in-Fläche sind genau vier Routen (4)" — es sind fünf.
- „keine Route gibt es nur im Dienst" — eine schon.
- „beide Seiten führen dieselbe Zahl (70)" — sie führen sie nicht.

**Warum das die schwerste der vier Beobachtungen ist.** `proof:route-policy` existiert wegen
B-2.10 und schreibt sich selbst zu: „Wer künftig eine Route registriert, ohne sie unter `/addin` zu
hängen, bekommt sie hier automatisch mitgeprüft — und wenn sie offen steht, wird dieser Lauf rot,
ohne dass jemand daran gedacht haben muss." Genau das leistet er für eine ganze Registrierungsart
nicht. Die Fläche des Add-in-Tokens ist die Fläche, die ein **entwendetes** Token erreicht (R-09);
sie zu vermessen ist der einzige Zweck des Laufs. Daß `proof:openapi` an derselben Stelle blind ist,
nimmt die zweite Chance: Die Route stünde auch in keiner Beschreibung, und 42Crunch — sobald es je
läuft — liest die Beschreibung.

**Heute liegt keine solche Route im Bestand.** Gemessen: der unveränderte Baum führt **10**
`ALL`-Einträge, und **jeder** trägt einen Platzhalter im Pfad. Der Befund ist also kein Leck,
sondern ein Wächter, an dem man vorbeigehen kann — dieselbe Art wie T-176-1, T-183-1, T-189-1.

**Gegenmittel: A-A-51**, gebaut und in beide Richtungen gemessen (siehe 28.4).

#### 28.2.2 Befund: die Zusicherung über den Vermerk prüft die leere Menge (T-206-2)

`proof-openapi.mjs`, Abschnitt 6, prüft die Notiz-Grenze am gesamten Durchlauf:

> „A-7.2, R-06 — der interne Vermerk verlässt seine eigene Route nicht. Der Durchlauf hat ihn beim
> Anlegen zweier Todos mitgegeben. Er darf in genau zwei Antworten stehen: in der der Vermerksroute
> selbst. Diese Probe kostet nichts, weil ohnehin jede Antwort eingesammelt wird — und sie misst
> eine Zusicherung, die sonst nur behauptet wird."

Der Test lautet `noteBearing.every((id) => id === 'getTodoNote' || id === 'putTodoNote')`. **Über
der leeren Liste ist `every` wahr.** Die Zahl zwei, die der Kommentar nennt, wird nirgends geprüft.

**Verstümmelung, gemessen** — *Stand 2026-09-06, nachgemessen in T-241; die Zahlen der ersten Fassung
waren teils falsch und teils überholt, siehe die zweite Tafel und 32.3.* Im Spiegel schreibt
`service-scenario.mjs` an seinen drei Stellen statt `INTERNAL_NOTE` eine andere Zeichenkette — genau
das, was passiert, wenn jemand den Durchlauf umbaut, ein Todo streicht oder die Vermerksroute den
Text nicht mehr zurückgibt.

**Erste Fassung (T-206, 2026-09-05) — als Stand aufbewahrt, nicht als geltende Zahl:**

| Zustand | Antworten mit dem Vermerk | Lauf |
|---|---|---|
| Bestand | 2 (`getTodoNote`, `putTodoNote`) | 110/0 |
| ~~eine der drei Stellen umgeschrieben~~ | ~~1~~ | ~~**110/0**~~ |
| ~~alle drei umgeschrieben~~ | ~~**0**~~ | ~~**110/0, Code 0**~~ |

**Zwei Berichtigungen, und beide sind gemessen.** Erstens: Die Zeile „eine der drei Stellen" galt nie
für alle drei — **tragend sind zwei**, die dritte schreibt einen Vermerk über die **Add-in-Route** und
speist keine Antwort (T-215, 29.3, T-223-6). Zweitens: Die letzte Zeile ist seit dem Bau von
**A-A-52** überholt — der Lauf mißt die Zwei inzwischen selbst und wird rot.

**Geltender Stand (2026-09-06, jede Stelle einzeln im Spiegel, `proof:openapi` gegen den heutigen
Baum):**

| ersetzt | Antworten mit dem Vermerk | Lauf | Code | Die Zeile, die zuschlägt |
|---|---|---|---|---|
| nichts (Bestand) | **2** (`getTodoNote`, `putTodoNote`) | **114/0** | **0** | — |
| Stelle 1 — `note: INTERNAL_NOTE` bei `createTodo` (`:449`) | **1** | **113/1** | **1** | A-A-52, `1: putTodoNote` |
| Stelle 2 — `text: INTERNAL_NOTE` bei `putTodoNote` (`:520`) | **1** | **113/1** | **1** | A-A-52, `1: getTodoNote` |
| **Stelle 3 — `note: INTERNAL_NOTE` bei `createAddinTodo` (`:877`)** | **2**, unverändert | **114/0** | **0** | keine — und das ist richtig so |
| alle drei | **0** | **113/1** | **1** | A-A-52, `0:` |

**Eine Zahl, nicht zwei: tragend sind zwei der drei Stellen.** Die dritte bleibt trotzdem stehen; sie
ist ein **negativer** Beitrag zur Zusicherung (der Vermerk kommt über die Add-in-Tür herein und darf
in keiner Antwort erscheinen), und die Zusicherung mißt Antworten, nicht Eingaben. Ausführlich in
29.3.

Die Zeile sagte bis A-A-52 weiterhin „der interne Vermerk steht in keiner Antwort außer der
Vermerksroute (A-7.2)" und hatte nichts gemessen. **Heute mißt sie:** Die A-A-52-Zeile davor nennt
die Zahl und wird ohne sie rot — in drei der vier Verstümmelungen oben, und die vierte ist keine.

**Das Gegenmittel steht im selben Lauf schon zweimal**, und dort ist es ausgeschrieben: Abschnitt 16
prüft „die Klasse ist nicht leer — sonst prüfte alles Folgende die leere Menge", Abschnitt 8 prüft
„es wurden genug Antworten verglichen (105, mindestens 60)". Für diese Zeile fehlt es.
**Gegenmittel: A-A-52.**

Einordnung: Die Grenze selbst ist damit **nicht** offen — 28.1.1 zählt sechs Schichten, fünf davon
gemessen. Offen ist die Zusage dieses Laufs über sie. Deshalb **soll** und nicht **muß**.

#### 28.2.3 Befund: die Aufzählung wird nur geprüft, wenn beide Seiten eine haben (T-206-3)

`proof-openapi.mjs`, Abschnitt 3, hält jedes Rumpffeld der Beschreibung gegen das zod-Schema des
Dienstes. Für die Zahlengrenzen zieht er ausdrücklich die einseitige Grenze:

> „Eine Grenze, die der Dienst zieht, muss beschrieben sein — sonst läuft ein gültig aussehender
> Aufruf in ein 422, das niemand angekündigt hat."

Für die Aufzählung fehlt derselbe Satz. Der Vergleich beginnt mit
`if (describedEnum !== undefined && enforcedEnum !== undefined)` — fehlt eine Seite, geschieht
nichts.

**Zwei Messungen, beide im Spiegel:**

1. **Verstümmelung des Lesers.** Läßt der YAML-Leser jeden Schlüssel `enum` fallen, bleibt der Lauf
   bei **110/0**. Zum Vergleich, derselbe Eingriff auf `maxLength`: **108/2**, und Abschnitt 0
   nennt die Zahl („gelesen 39" statt 55). Auf `required`: **105/5**. Von den drei Facetten ist
   allein die Aufzählung unverankert.
2. **Kunstquelle in der Beschreibung.** In `takt-local-api.yaml` aus
   `theme: { type: string, enum: [system, light, dark] }` ein `theme: { type: string }` gemacht —
   der Dienst erzwingt weiter drei Werte, die Beschreibung sagt „irgendeine Zeichenkette". Lauf:
   **110/0**. Umgekehrt, ein erfundener vierter Wert in der Beschreibung: **109/1**, „updateSettings.theme:
   Aufzählung [dark|gestohlen|light|system] gegen [dark|light|system]".

Die Aufzählung ist die **geschlossene Werteliste** einer Schnittstelle. Eine Beschreibung, die sie
verschweigt, ist genau der Fehlertyp, gegen den dieser Lauf gebaut wurde (T-022, T-029, T-039), und
sie ist zugleich das, was ein Prüfwerkzeug von außen — 42Crunch — als einzige Quelle hat.
**Gegenmittel: A-A-53**, gebaut und in beide Richtungen gemessen.

#### 28.2.4 Befund: drei Zusicherungen, die auch ohne den Angriff bestehen (T-206-4)

`proof-template-fields.mjs`, Abschnitt 5, ist der wichtigste Teil des Laufs: die Vorlage wird per
`INSERT` **an Oberfläche und Route vorbei** in die Datenbank gesetzt, danach der Dienst neu
aufgebaut. Drei Zusicherungen dort halten nicht, was sie sagen:

- `check('die Vorlage steckt an jeder Prüfung vorbei in der Datenbank', true);` — die Bedingung ist
  wörtlich `true`. Es wird nichts nachgesehen.
- „die Vorschau gegen die eingeschmuggelte Vorlage bricht ab" — Bedingung `preview.status >= 400`.
- „der Exportlauf bricht ab, statt das Feld still auszulassen (B-3.1 Punkt 4)" — Bedingung
  `run.status >= 400`.

**Verstümmelung, gemessen.** Im Spiegel unterbleibt der `INSERT`; alles andere bleibt. Ergebnis:
Die Vorlage existiert nicht, Vorschau und Lauf antworten **404** mit
`{"error":{"code":"not_found","message":"Diese Exportvorlage gibt es nicht."}}` — und **alle drei
Zusicherungen bestehen**. Der Lauf endet trotzdem rot (28/2, Code 1), aber an zwei ganz anderen
Zeilen: den beiden Prüfungen über `error.details`, die T-046 aus einem anderen Anlaß hinzugefügt
hat. **Der Lauf wird durch einen Zufall der Geschichte gerettet, nicht durch seine Anlage.**

Zur Einordnung, ebenfalls gemessen: der Lauf hat sonst kräftige Zähne. Nimmt man im Spiegel die
Feldnamenprüfung in `packages/export/src/template.ts` außer Kraft, wird er **17/13** — auf allen
drei Ebenen, bis hin zu „es liegt keine Exportdatei im Ordner —
takt-export-20260906-121504.json". Der Befund betrifft allein die Verankerung des fünften
Abschnitts. **Gegenmittel: A-A-54**, gebaut und in beide Richtungen gemessen.

#### 28.2.5 Wo ich nichts gefunden habe — und das ist ein Ergebnis

Vier Stellen, an denen ich einen Befund erwartet und **keinen** bekommen habe. Sie stehen hier, weil
ein gemessener Fehlschlag genauso zählt wie ein Fund:

1. **Der YAML-Leser weigert sich bereits, und zwar seit T-039.** `openapi-reader.mjs` sagt es im
   Kopf: „Er versteht sie streng und **wirft**, wo er etwas nicht kennt. Das ist der wichtige Teil
   — ein Leser, der Unbekanntes überspringt, macht einen Nachweispfad grün, der nichts mehr misst.
   Genau diese Sorte Grün ist der Grund, warum es T-039 gibt." Anker, Verweise, Dokumenttrenner,
   mehrzeilige Flußausdrücke, Kommentare hinter einem Wert: allesamt ein Wurf. **Das ist die Regel
   aus A-A-33, drei Wellen älter als A-A-33.**
2. **Abschnitt 0 von `proof:openapi` prüft den Leser gegen den Rohtext**, nicht gegen eine
   niedergeschriebene Zahl: Pfade, benannte Bauteile, `maxLength`, `$ref`. Gemessen: jede
   Verstümmelung, die eine dieser vier Sorten verschluckt, wird rot, und der Text nennt die
   Differenz. Eine doppelte Pfadzeile oder ein doppeltes Bauteil fällt aus demselben Grund auf.
3. **Die Untergrenzen sind da, wo sie gebraucht werden.** `proof:route-policy` prüft
   „die Routenliste des Dienstes ist auslesbar und vollständig", Bedingung `routes.length >= 60`,
   und fährt in Abschnitt 5 die Gegenprobe: **keine** der Routen weist das Sitzungsgeheimnis ab.
   Eine leere Aufzählung erfüllt beides nicht. `proof:openapi` prüft „es wurden genug Antworten
   verglichen (105, mindestens 60)" und „jede der 70 beschriebenen Operationen wird mindestens
   einmal angefahren".
4. **Die Vermerksmessung in `proof:route-policy` ist positiv verankert** — anders als die in
   `proof:openapi`. Sie legt ein Todo mit Vermerk an, prüft, daß die Oberfläche ihn liest, und erst
   danach, daß das Add-in-Token ihn nicht bekommt. Fehlte der Vermerk, wäre der Lauf rot, bevor die
   Sicherheitsaussage überhaupt drankommt. **So sieht die Zeile aus, die A-A-52 in `proof:openapi`
   herstellen soll.**

**Antwort auf O-GV.** Ja — sinngemäß, in der Fassung aus 28.2, und nicht als neue Bauart, sondern
als drei benannte Löcher in vorhandenen Läufen. Als **allgemeine** Regel gilt sie in allen drei
Läufen bereits an den meisten Stellen; ausgesprochen ist sie in keinem. Dazu **A-A-55**.

---

### 28.3 Befunde

| Nr. | Stufe | Befund | Zuständig |
|---|---|---|---|
| **T-206-1** | **muß** | **Eine mit `all` registrierte Route ist für `proof:route-policy` und `proof:openapi` unsichtbar.** Beide filtern `if (route.method === 'ALL') continue;` mit der Begründung, `ALL` seien Kettenglieder. Gemessen: `api.all('/addin/leak', …)` im Baum — mit dem Add-in-Token **200** samt Rumpf, `proof:route-policy` **40/0 Code 0**, `proof:openapi` **110/0 Code 0**, dabei vier namentliche Zusicherungen falsch („genau vier Routen (4)", „(70 Operationen)", „keine Route gibt es nur im Dienst", „beide Seiten führen dieselbe Zahl (70)"). Im unveränderten Baum: 10 `ALL`-Einträge, alle mit Platzhalter — die Behebung kostet heute keinen falschen Alarm. Gegenmittel: **A-A-51**. | domain-dev |
| **T-206-2** | soll | **Die Notiz-Grenze in `proof:openapi` besteht über der leeren Menge.** `noteBearing.every(…)` ohne Untergrenze; der Kommentar nennt „genau zwei Antworten", geprüft wird die Zahl nicht. Gemessen: Durchlauf ohne den Vermerk → 0 Treffer, Lauf **110/0, Code 0**. Der Lauf führt das Gegenmittel an zwei anderen Stellen selbst („die Klasse ist nicht leer — sonst prüfte alles Folgende die leere Menge"). Gegenmittel: **A-A-52**. | domain-dev |
| **T-206-3** | soll | **Eine Aufzählung, die der Dienst erzwingt und die Beschreibung verschweigt, fällt nicht auf.** `if (describedEnum !== undefined && enforcedEnum !== undefined)`; für `maxLength` zieht derselbe Abschnitt die einseitige Grenze ausdrücklich. Gemessen: `enum` aus `theme` entfernt → **110/0**; Leser ohne `enum` → **110/0**; dieselbe Verstümmelung auf `maxLength` → 108/2, auf `required` → 105/5. Gegenmittel: **A-A-53**. | domain-dev |
| **T-206-4** | soll | **`proof:template-fields` Abschnitt 5 besteht auch dann, wenn der Angriff nicht ankommt.** `check('die Vorlage steckt an jeder Prüfung vorbei in der Datenbank', true)`, dazu zweimal `status >= 400`. Gemessen: ohne den `INSERT` antworten Vorschau und Lauf **404 `not_found`**, alle drei Zusicherungen bestehen; rot wird der Lauf nur an den zwei `details`-Zeilen aus T-046. Gegenmittel: **A-A-54**. | domain-dev |
| **T-206-5** | Hinweis | **SP-09 ist durch nichts festgehalten.** Keiner der sechs Texte kommt in `tests/e2e/**` oder in einem `proof:`-Lauf vor. Zwei davon tragen eine Grenze **allein** — die Empfängerangabe „Rechnung des Kunden" und der Halbsatz „auch nicht über eine eigene Exportvorlage"; beide stehen im Produkt genau einmal. Nach dem Kriterium, mit dem `proof:addin` seine drei Zusicherungen begründet (E-090), gehören genau diese zwei gemessen — die Liste als ganze **nicht**. Gegenmittel: **A-A-50**. | frontend-dev, unit-tester |

### 28.4 Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-50** | Drei Sätze, die je **allein** eine Grenze tragen, bekommen je eine Zusicherung — **nicht** die Sperrliste, nach E-090: die Empfängerangabe der Fußnote „Leistung" (`NoteField.tsx`), der Halbsatz „auch nicht über eine eigene Exportvorlage" der Fußnote „Vermerk" und der Satz „Die Quelle für das Feld „Notiz“ der Standardvorlage." in `export-catalog.ts`. Der dritte ist die Bedingung, unter der Satz 2 der Fußnote „Leistung" fallen darf (28.1.3 B-3). | Je eine Gegenprobe: Satz entfernt → rot. Die Zusicherungen prüfen den **Satz**, nicht den ganzen Text; eine Umformulierung, die die Aussage behält, darf nicht rot werden. |
| **A-A-51** | `proof:route-policy` und `proof:openapi` **weigern sich**, über die Routenliste zu urteilen, solange ein `ALL`-Eintrag ohne Platzhalter im Pfad darunter ist. Begründung im Text: Hono trägt Kettenglieder und `app.all(…)` mit derselben Methode ein; ein Eintrag ohne Platzhalter ist von einer Route nicht zu unterscheiden, und eine Aussage über eine Liste, aus der etwas herausfällt, ist keine. Wer künftig ein Kettenglied auf einen genauen Pfad legt, schreibt es mit Platzhalter oder nennt es hier. | Gebaut und im Spiegel gemessen, **beide Richtungen**: unveränderter Baum **41/0** und **111/0** — kein falscher Alarm; mit `api.all('/addin/leak', …)` beide **rot, Code 1**, und die Meldung nennt den Pfad `/api/v1/addin/leak`. |
| **A-A-52** | Vor der Zeile „der interne Vermerk steht in keiner Antwort außer der Vermerksroute (A-7.2)" steht die Untergrenze, die der Kommentar ohnehin behauptet: der Durchlauf trägt den Vermerk in **genau zwei** Antworten, und es sind `getTodoNote` und `putTodoNote`. Dasselbe Muster wie Abschnitt 16 und wie `proof:route-policy` Abschnitt 1. | Gebaut und im Spiegel gemessen, beide Richtungen: unveränderter Baum **111/0**; Durchlauf ohne den Vermerk **rot**, Meldung „0: ". |
| **A-A-53** | Die Aufzählung wird wie die Zahlengrenzen behandelt: Erzwingt der Dienst eine und beschreibt die Beschreibung keine, ist das ein Befund; beschreibt die Beschreibung eine, die der Dienst nicht erzwingt, ebenso. Dieselbe Ausnahme wie bei den Facetten für Felder, die auf ein benanntes Bauteil zeigen. | Gebaut und im Spiegel gemessen, beide Richtungen: unveränderter Baum **110/0** — kein falscher Alarm über alle 29 Rumpfschemata; `enum` aus `theme` entfernt → **109/1**, „updateSettings.theme: Aufzaehlung [dark\|light\|system] wird erzwungen, aber nicht beschrieben". |
| **A-A-54** | `proof:template-fields` Abschnitt 5 verankert seinen Angriff: (1) statt `check(…, true)` wird die eingeschmuggelte Zeile **zurückgelesen** und ihre Definition zeichengleich verglichen; (2) Vorschau und Lauf müssen nicht bloß `>= 400` antworten, sondern mit dem Schlüssel `validation_error` — dem Schlüssel des Feldnamens, nicht dem eines fehlenden Datensatzes. | Gebaut und im Spiegel gemessen, beide Richtungen: unveränderter Baum **30/0**; ohne den `INSERT` **25/5**, und die drei bisher stillen Zeilen sind jetzt die roten („keine Zeile", zweimal „Status 404 … not_found"). |
| **A-A-55** | Der Satz aus 28.2 steht **einmal** ausgeschrieben — im Kopf von `proof-route-policy.mjs`, weil dort schon die Begründung der Aufzählung steht —, und die anderen Läufe verweisen darauf: *Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden hat.* Wer eine Zusicherung über eine Menge schreibt, schreibt die Untergrenze dieser Menge daneben. | Keine Messung; ein Satz. Seine Wirkung ist an A-A-51 bis A-A-54 ablesbar: alle vier Behebungen sind Anwendungen davon. |

### 28.5 Urteil

**Nacharbeit.** Ein Befund der Stufe **muß** (T-206-1), drei der Stufe **soll**, ein Hinweis.

**Zu O-HF: SP-09 bleibt**, ein Satz von sechs Texten darf fallen, und die Bedingung dafür steht in
28.1.3. Eine Fassung lege ich nicht vor.

**Zu O-GV: ja, sinngemäß** — und die Antwort hat drei Löcher zutage gefördert, von denen zwei
(T-206-1 und T-206-2) unmittelbar an der Notiz-Grenze und an der Fläche des Add-in-Tokens liegen.

**Der Satz dieser Prüfung.** Sechsmal in sechs Wellen war die Antwort auf dieselbe Frage „ja", und
sechsmal lag die Blindheit nicht in dem, was der Lauf prüft, sondern in dem, was er **vorher für
selbstverständlich hält**: daß die Datei lesbar ist, daß die Liste vollständig ist, daß der Angriff
angekommen ist, daß die Menge nicht leer ist. **Ein Wächter irrt sich selten über sein Urteil. Er
irrt sich über seinen Gegenstand.**

---

## 29. Prüfung T-223 (2026-09-06) — eine Abnahme, ein Rest, der keiner bleiben darf, und dieselbe Frage an drei weitere Läufe

**Auftrag.** Vier Punkte. **Abnahme** von A-A-51 bis A-A-55, gebaut in T-215. **Entscheidung**
über den Rest, den der Erbauer bewußt offengelassen und ausdrücklich mir überlassen hat: ein
Endpunkt, der selbst auf einem Platzhalter liegt. **Berichtigung** einer Zahl in meinem eigenen
Papier — 28.2.2 zählt drei tragende Stellen, gemessen sind zwei. Und **O-JV**: Gilt die
Weigerungsregel sinngemäß auch für `proof:export`, `proof:export-api` und `proof:access`? Die
Frage steht seit 28.2.5; ich hatte angekündigt, sie zu stellen.

### 29.0 Stand der Werkzeuge und wie gemessen wurde

**Guardian und 42Crunch: zwölftes Mal ohne Werkzeug** (E-079 Punkt 3, nicht erneut versucht). Die
Feststellung aus 28.0 bleibt stehen und wird durch diese Prüfung nicht besser, sondern
unbequemer: **Die Aussage über die OpenAPI-Beschreibung ruht vollständig auf `proof:openapi` —
auf einem Lauf, in dem zwei der vier Befunde von T-206 saßen.** Ein zweites, fremdes Augenpaar auf
dieselbe Datei gibt es nicht, und der einzige Ersatz dafür ist, den Lauf selbst regelmäßig gegen
Verstümmelungen zu fahren. Genau das ist der Grund, warum O-GV und O-JV überhaupt gestellt werden.

**`proof:all` nicht gefahren** (E-083 Punkt 3), einzelne Pfade schon.

**Gemessen wurde am Verhalten, außerhalb des Bestands** — wie in T-176, T-183, T-189 und T-206.
Der Spiegel liegt unter `/tmp/t223/root/apps/local-api` und trägt **die Gestalt des
Arbeitsbereichs**, nicht nur die des Pakets: `packages` und `node_modules` sind Verweise auf die
echten, damit die relativen Verknüpfungen von pnpm auflösen. Ohne das läuft kein einziger
Nachweispfad, und ein Spiegel, in dem nichts läuft, mißt nichts.

**Die Prüfzeilen des Spiegels sind zeichengleich mit denen des Bestands.** Belegt zweifach: über
`diff -rq` gegen `src`, `scripts` und `openapi` — ohne Unterschied — und über eine Prüfsumme aller
`ok`/`FEHL`-Zeilen, vor der ersten und nach der letzten Messung:

| Lauf | Prüfsumme vorher | Prüfsumme nachher | Zahlen |
|---|---|---|---|
| `proof:route-policy` | `f0030ef14f0f9722` | `f0030ef14f0f9722` | **41/0** |
| `proof:openapi` | `f8e9e839d7906fe9` | `f8e9e839d7906fe9` | **112/0** |
| `proof:template-fields` | `96f7112191785dcb` | `96f7112191785dcb` | **30/0** |

Kunstquellen und Verstümmelungen sind ausschließlich im Spiegel entstanden. Der versionierte
Bestand führt weder `verifier-teil2` noch `t223`; die Zeichenkette `addin/leak` steht dort an genau
zwei Stellen, und beide sind Kommentare in `proof-route-policy.mjs` und `proof-openapi.mjs`, die
den gemessenen Befund festhalten — so soll es sein.

**Ein Nachweispfad ließ sich nicht fahren, und das steht hier statt zu fehlen.** Die
Aufspaltungs-Gegenprobe zu Abschnitt 13 von `proof:access` (29.4.4, zweite Fassung) ist **fünfmal**
angesetzt und fünfmal an `Auf 127.0.0.1:17843 lauscht bereits etwas` gescheitert. Das ist der Fall
aus **E-083 Punkt 2**: In dieser Welle laufen portgebundene Nachweispfade — `proof:access` und
`proof:export-api` gehören zu meiner Messung — **neben** dem e2e-Lauf. Die erste Fassung derselben
Gegenprobe ist durchgekommen und trägt den Befund; die zweite fehlt. Ein Nachweis, der nicht lief,
ist kein grüner Nachweis.

---

### 29.1 Abnahme A-A-51 bis A-A-55 — **abnahmefähig**, jede Zahl nachgemessen

Nicht abgeschrieben. Jede der zehn Gegenproben des Erbauers ist hier eigenständig gefahren.

#### 29.1.1 Der Befund, von mir nachgestellt

Kunstquelle im Spiegel, eine Zeile in `src/app.ts` unmittelbar vor `app.route(API_BASE_PATH, api)`:
`api.all('/addin/leak', (c) => c.json({ data: { leak: 'GEHEIMER-INTERNER-VERMERK' } }));`

Durch die vollständige Kette gefahren, mit `Host: 127.0.0.1:17843` und der Herkunft des Add-ins:

| Aufruf | gemessen |
|---|---|
| `GET /api/v1/addin/leak` mit **Add-in-Token** | **200**, `{"data":{"leak":"GEHEIMER-INTERNER-VERMERK"}}` |
| dasselbe mit Sitzungsgeheimnis | **200**, derselbe Rumpf |
| dasselbe ohne gültigen Nachweis | **401**, `unauthorized` |

Deckungsgleich mit 28.2.1 und mit dem Bericht zu T-215. **Der Befund war echt, und er ist
nachstellbar geblieben.**

#### 29.1.2 Die fünf Auflagen, einzeln

| Auflage | Urteil | Meine Messung |
|---|---|---|
| **A-A-51** | **erfüllt** | Unveränderter Baum **41/0** und **112/0**, Code 0 — kein falscher Alarm. Mit der Kunstquelle: `proof:route-policy` **40/1, Code 1**, `proof:openapi` **111/1, Code 1**, beide mit derselben Zeile `FEHL kein ALL-Eintrag ohne Platzhalter … — mit ALL registriert und damit aus der Liste gefallen: /api/v1/addin/leak`. Die Bedingung ist in beiden Dateien zeichengleich. |
| **A-A-52** | **erfüllt** | Stelle 1 ersetzt → **111/1**, Meldung `1: putTodoNote`. Stelle 2 ersetzt → **111/1**, `1: getTodoNote`. Alle drei → **111/1**, `0: `. Jede mit Code 1. |
| **A-A-53** | **erfüllt** | `enum` aus `theme` in der Beschreibung entfernt → **111/1**, „wird erzwungen, aber nicht beschrieben". `z.enum([…])` → `z.string()` in `src/routes/export.ts` → **111/1**, „ist beschrieben, aber wird nicht erzwungen". YAML-Leser läßt jeden Schlüssel `enum` fallen → **111/1** mit **fünf** Fundstellen über fünf verschiedene Rumpfschemata (`createPool.matchMode`, `updatePool.matchMode`, `resetExportStatus.status`, `resolveOrphanedTimer.resolution`, `updateSettings.theme`). |
| **A-A-54** | **erfüllt** | Ohne den `INSERT` → **25/5, Code 1**, und die drei bisher stillen Zeilen sind jetzt die roten: „keine Zeile", zweimal `Status 404 … not_found`. Mit unverdächtiger Definition → **22/8, Code 1**, Meldung `gelesen: {"version":1,"fields":[{"name":"Call",…}]}`. |
| **A-A-55** | **erfüllt** | Der Satz steht einmal ausgeschrieben im Kopf von `proof-route-policy.mjs`: *„**Keine Zusicherung darf bestehen, ohne daß das Geprüfte stattgefunden hat.** Wer eine Zusicherung über eine Menge schreibt, schreibt die Untergrenze dieser Menge daneben."* `proof-openapi.mjs` verweist darauf und nennt seine drei Anwendungen; `proof-template-fields.mjs` ebenso. |

**Die dritte Gegenprobe zu A-A-53 ist die aussagekräftigste, und ich bestätige die Einschätzung des
Erbauers:** Derselbe Eingriff, der vor der Behebung 110/0 ergab, findet jetzt fünf verschwiegene
Aufzählungen über fünf verschiedene Rumpfschemata. Der Wächter hängt nicht an `theme`.

#### 29.1.3 Eine Beobachtung zur Bauart der Weigerung — kein Befund, aber sie gehört gesagt

Die Weigerung steht **vor** den Zusicherungen, die sie schützt; das ist gemessen und richtig. Was
sie **nicht** tut: die geschützten Zeilen anhalten. Mit der Kunstquelle liest sich die Ausgabe von
`proof:route-policy` so:

```
FEHL  kein ALL-Eintrag ohne Platzhalter … : /api/v1/addin/leak
ok    die Routenliste des Dienstes ist auslesbar und vollständig (70 Operationen)
ok    die Add-in-Fläche sind genau vier Routen (4)
```

Die beiden `ok`-Zeilen sind in diesem Augenblick **falsch**, und in `proof:openapi` gilt dasselbe
für „keine Route gibt es nur im Dienst" und „beide Seiten führen dieselbe Zahl (70)". Der Erbauer
hat das als Annahme 2 offengelegt und begründet: „Ein harter Abbruch hätte die restliche Messung
verschluckt, und damit die Frage ‚was noch?'."

**Ich stimme zu, und zwar aus einem Grund, den er nicht nennt:** Wer eine `ALL`-Route findet, will
als nächstes wissen, was der Rest des Laufs sagt — ein Abbruch nähme ihm das. Der Beendigungscode
ist 1, die Zusammenfassung nennt die Zeile, und beide Läufe sind rot. Das trägt. **Bedingung:** Die
vier `ok`-Zeilen dürfen nicht einzeln zitiert werden, solange die Weigerung rot ist. Wer aus einem
roten Lauf eine grüne Zeile herausschneidet, hat den Lauf nicht gelesen — dagegen hilft keine
Bauart.

---

### 29.2 Der offene Rest — **entschieden: er braucht eine eigene Auflage**

Die Frage des Erbauers (T-215, Offene Frage 1): Reicht A-A-51 in der gebauten Fassung, oder braucht
der Rest eine eigene Auflage? Er hat sie ausdrücklich nicht für mich entschieden, und seine
Begründung ist die interessantere Hälfte.

#### 29.2.1 Der Rest ist größer, als er beschrieben ist — gemessen

Er nennt einen Fall: `api.all('/addin/*', …)`. Gemessen sind **drei**, und alle drei sind erreichbar,
während **beide** Wächter voll grün bleiben:

| Kunstquelle | Aufruf | Add-in-Token | Sitzung | ohne Nachweis | `route-policy` | `openapi` |
|---|---|---|---|---|---|---|
| `api.all('/addin/leak/:id', …)` | `/addin/leak/42` | **200** samt Rumpf | 200 | 401 | **41/0, Code 0** | **112/0, Code 0** |
| `api.all('/addin/*', …)` | `/addin/beliebig` | **200** samt Rumpf | 200 | 401 | **41/0, Code 0** | **112/0, Code 0** |
| `api.all('/*', …)` | `/beliebig` | 401 | **200** samt Rumpf | 401 | **41/0, Code 0** | **112/0, Code 0** |

Zwei der drei liegen **auf der Fläche des Add-in-Tokens** — also auf der Fläche, die ein
entwendetes Token erreicht (R-09), und damit auf genau der Fläche, deren Vermessung der einzige
Zweck von `proof:route-policy` ist. Das ist derselbe Befund wie T-206-1, nur eine Schreibweise
weiter. **Die Stufe des Befunds ändert sich nicht dadurch, daß seine Behebung schwerer ist.**

#### 29.2.2 Die verworfene Verschärfung: er hat recht, und ich habe es nachgemessen

Die Stelligkeit trägt tatsächlich — und tatsächlich nicht. Gemessen an
`probe.app.routes.filter(r => r.method === 'ALL').map(r => r.handler.length)`:

- alle **zehn** Kettenglieder des Bestands: Stelligkeit **2**
- der eingesetzte Endpunkt: Stelligkeit **1**

Die Angabe des Erbauers stimmt. Sein Urteil auch: `api.all('/x', async (c, next) => …)` hebt sie
auf, ebenso `(...args) =>` (Stelligkeit 0) und jede Bequemlichkeit, die einen zweiten Parameter
mitschreibt, ohne ihn zu benutzen. **Eine Unterscheidung, die von der Schreibweise abhängt und
nicht vom Verhalten, ist in einem Sicherheitswächter schlechter als gar keine** — sie erzeugt
Vertrauen ohne Deckung. Der Satz *„eine unsichere Heuristik in diesem Wächter wäre schlechter als
ein benannter Rest"* ist richtig, und ich übernehme ihn.

#### 29.2.3 Aber die Wahl war nicht „Liste oder nichts" — es gibt eine dritte Form, und sie ist eine Zahl

Der Erbauer stellt die Alternative als **gepflegte Aufstellung der erlaubten Kettenglieder** dar
und verwirft sie, weil sie „genau das ist, wogegen dieser Lauf gebaut ist". Die Begründung dafür
steht im Kopf von `proof-route-policy.mjs`: *„Eine von Hand gepflegte Liste hätte genau den Fehler,
aus dem B-2.10 entstanden ist: Die nächste hinzugefügte Fachroute ist die vergessene."*

**Dieses Argument gilt für Routen. Es gilt nicht für Kettenglieder, und der Unterschied ist
gemessen:**

1. **Eine Fachroute wird nie unter `ALL` registriert.** Der Bestand führt heute kein einziges
   `.all(` als Routenregistrierung — gesucht über `git grep` und über die Quellverzeichnisse.
   Die Liste, um die es hier geht, wächst also nicht mit dem Produkt.
2. **Alle zehn Kettenglieder stehen an einer Stelle**, in einem zusammenhängenden Block in
   `apps/local-api/src/app.ts`, und zwar wörtlich als `app.use('*', …)`:
   `securityHeaders`, `requestLog`, `hostGuard`, `originGuard`, `urlSecretGuard`,
   `contentTypeGuard`, der Rumpfgrößenwächter, `timeout`, `authGuard`, `credentialPolicy`. Der
   Kopf der Datei sagt selbst: *„Wer einen Router ergänzt, hängt ihn **hinter** `app.use(...)`."*
3. **Diese zehn sind nicht irgendeine Liste — sie sind die Vertrauensgrenze selbst.** Herkunft,
   Wirt, Nachweis, Inhaltstyp, Rumpfgröße, Frist. Eine Änderung daran soll auffallen. Das ist der
   Unterschied zu einer Fachroute, deren Hinzufügung Alltag ist.

Gemessen habe ich deshalb **drei** Regeln gegen **fünf** Kunstquellen. Regel 1 ist die gebaute.

| Kunstquelle | R1: „Platzhalter genügt" (gebaut) | R2: „Pfad ist genau `/*`" | R3: „Anzahl ist **10**" |
|---|---|---|---|
| *unveränderter Baum* | **grün** | **grün** | **grün** |
| `api.all('/addin/leak', …)` | rot | rot | rot |
| `api.all('/addin/leak/:id', …)` | **grün** | rot | rot |
| `api.all('/addin/*', …)` | **grün** | rot | rot |
| `api.all('/*', …)` | **grün** | rot | rot |
| `app.all('/*', …)` auf der Wurzel-App | **grün** | **grün** | rot |

**R3 ist auf allen fünf rot und auf dem unveränderten Baum grün.** Sie kostet **eine ganze Zahl**,
keine Aufstellung von Pfaden. R2 kostet nichts, weil der Bestand ohnehin nur diese eine Form
benutzt, und fängt vier der fünf — sie ist die Verschärfung von R1, die der Erbauer nicht geprüft
hat.

**Und das ist die Schreibweise, die dieses Papier und diese Läufe längst benutzen.** „die
Add-in-Fläche sind genau vier Routen (4)", „genau zwei Antworten führen ihn", „die Routenliste …
(70 Operationen)", „In allen 55 Antwortkörpern stehen genau 2 Tokens". Eine benannte Zahl ist hier
kein Fremdkörper, sondern die Hausform. Der Erbauer hat die Alternative als Liste gedacht und die
Liste zu Recht verworfen; als **Zahl** ist sie billiger als der Rest, den sie ersetzt.

#### 29.2.4 Die Durchgriffsprobe — gemessen, wirksam, und trotzdem nicht die Auflage

Weil eine Verhaltensmessung einer Formmessung vorzuziehen wäre, habe ich eine gebaut und gefahren:
Jeder `ALL`-Eintrag wird in einen konkreten, nirgends registrierten Pfad übersetzt (`:name` → eine
formgültige Kennung, `*` → ein Wegabschnitt, den es nicht gibt) und mit gültigem Sitzungsgeheimnis
und gültiger Herkunft aufgerufen. **Ein Kettenglied reicht durch, und am Ende antwortet 404. Ein
Endpunkt antwortet selbst.**

| Zustand | Ergebnis der Durchgriffsprobe |
|---|---|
| unveränderter Baum, alle zehn Kettenglieder | **404** `not_found` — durchgereicht, kein falscher Alarm |
| `api.all('/addin/leak/:id', …)` | **200** samt Rumpf — gefangen |
| `api.all('/addin/*', …)` | **200** samt Rumpf — gefangen |
| `api.all('/*', …)` | **200** samt Rumpf — gefangen |
| `api.all('/addin/notes/:noteId', …)`, dessen Handler für eine unbekannte Kennung 404 antwortet | **404** — **nicht** gefangen, obwohl die Route mit dem Add-in-Token 200 samt Rumpf liefert |

**Die letzte Zeile ist der Grund, warum ich sie nicht zur Auflage mache.** Ein Endpunkt, der einen
Datensatz nachschlägt, antwortet auf eine erfundene Kennung genauso wie ein durchreichendes
Kettenglied — und das ist keine Bosheit, sondern die gewöhnlichste Bauart, die es gibt. Die
Durchgriffsprobe ist eine echte Verbesserung und keine Schließung. Sie gehört als **Hilfe**
genannt, nicht als Bedingung: Wer die Zahl aus R3 anhebt, kann mit ihr in einem Zug beantworten, ob
der neue Eintrag durchreicht oder antwortet. Steht in **A-A-56** als zweiter Satz.

#### 29.2.5 Entscheidung

**Der benannte Rest reicht nicht. Er bekommt eine eigene Auflage: A-A-56.**

Nicht, weil der Erbauer falsch geurteilt hätte — sein Urteil über die Stelligkeit ist richtig und
ist hier nachgemessen. Sondern weil ein **benannter** Rest an dieser Stelle das ist, was A-A-51
selbst über eine unvollständige Liste sagt: *„Eine Aussage über eine Liste, aus der etwas
herausfällt, ist keine."* Nach der Behebung fällt weiter etwas heraus, nur leiser. Ein Kommentar ist
kein Wächter, und die Fläche, um die es geht, ist die des entwendeten Add-in-Tokens.

**Die Auflage verlangt ausdrücklich nicht die Aufstellung, gegen die er zu Recht argumentiert hat.**

---

### 29.3 Zahl gegen Zahl, zum zweiten Mal in meinem eigenen Papier — **zwei stimmte**

Der Erbauer meldet (T-215, Offene Frage 2): Die Tabelle in 28.2.2 zählt drei tragende Stellen,
gemessen sind es zwei. **Nachgemessen, jede der drei Stellen einzeln, im Spiegel:**

| ersetzt | Antworten mit dem Vermerk | `proof:openapi` | Code |
|---|---|---|---|
| Stelle 1 — `note: INTERNAL_NOTE` bei `createTodo` | **1** (`putTodoNote`) | 111/1 | 1 |
| Stelle 2 — `text: INTERNAL_NOTE` bei `putTodoNote` | **1** (`getTodoNote`) | 111/1 | 1 |
| **Stelle 3 — `note: INTERNAL_NOTE` bei `createAddinTodo`** | **2**, unverändert | **112/0** | **0** |
| alle drei | **0** | 111/1 | 1 |

**Der Erbauer hat recht. Die Zahl, die stimmte, ist die Zwei.**

Die Berichtigung, mit Marke, damit sie nicht als stille Umschreibung durchgeht:

| Stelle | Vorher | Jetzt |
|---|---|---|
| 28.2.2, Tabelle „Verstümmelung, gemessen" | „eine der drei Stellen umgeschrieben → 1" | **gilt für Stelle 1 und Stelle 2. Stelle 3 umgeschrieben → weiterhin 2.** Tragend sind **zwei** der drei Stellen |
| 28.2.2, Fließtext | „genau das, was passiert, wenn jemand den Durchlauf umbaut" | unverändert richtig — aber nur für die zwei Stellen, die eine **Antwort** speisen |

**Was die dritte Stelle wirklich ist, und warum sie stehenbleiben soll.** Sie ist kein Beiwerk und
kein Fehler: Sie schreibt einen internen Vermerk **über die Add-in-Route** in den Bestand
(`POST /addin/todos` nimmt `note` entgegen, `apps/local-api/src/routes/addin/schema.ts`:
`note: z.string().max(ADDIN_NOTE_MAX_LENGTH).default('')`). Daß dieser Vermerk in **keiner**
Antwort auftaucht, ist eine Aussage über die Add-in-Fläche und damit ein **negativer** Beitrag zur
Zusicherung — im Gegensatz zu den zwei **positiven**, die je eine Antwort speisen. Die Zusicherung
mißt Antworten, nicht Eingaben; deshalb ändert ihr Wegfall die Zahl nicht, und deshalb ist sie
trotzdem nicht überflüssig.

**Die Regel aus 22.2, auf mich selbst angewandt.** Sie lautet: *„Eine Auflage soll keine Zahl
nennen, die sie nicht selbst zählt."* Zum zweiten Mal ist die Verletzung nicht in einer Auflage
aufgetreten, sondern in der **Beschreibung eines Befunds** — und beide Male hat sie nicht der
Prüfer gefunden, der sie geschrieben hat, sondern der Erbauer, der danach gebaut hat. Das ist die
brauchbare Hälfte der Beobachtung: **Der Bau ist die Nachzählung.** Wer eine Zahl in ein Papier
schreibt, bekommt sie geprüft, sobald jemand danach baut — und nur dann. Für A-A-52 ist die Sache
folgenlos: Die Behebung mißt Antworten und hat mit der Zahl der Eingabestellen nichts zu tun.

---

### 29.4 O-JV — dieselbe Frage an `proof:export`, `proof:export-api` und `proof:access`

**Die Regel, in der Fassung aus 28.2:** *Keine Zusicherung darf bestehen, ohne daß das Geprüfte
stattgefunden hat.* Gemessen wurde nach diesem Maßstab, mit Kunstquelle und Verstümmelung, zum
siebten Mal. Ausgangszahlen im Spiegel: `proof:export` **97/0**, `proof:export-api` **69/0**,
`proof:access` **105/0**, alle Code 0.

**Das Ergebnis ist unangenehmer als bei den drei Läufen aus T-206**, weil drei der vier Befunde
nicht irgendeine Zusicherung betreffen, sondern **die Notiz-Grenze** (A-7.2, R-06) und **die
Geheimnisgrenze im Protokoll** (B-2.4).

#### 29.4.1 T-223-1 — die Notiz-Grenze in `proof:export` besteht über einem Bestand ohne Vermerk

`proof-export.mjs` legt in `freshContext()` ein Todo mit
`note: 'Interner Vermerk — darf nie in den Export'` an und prüft nach dem Exportlauf:

> `'der interne Vermerk steht nirgends in der Datei (A-7.2, R-06)'`

Die Bedingung sucht die Zeichenkette `'Interner Vermerk'` in der geschriebenen Datei und im
Base64-Rumpf des Feldes `Notiz`. **Nichts prüft, daß der Vermerk je im Bestand war.** Die beiden
Zeichenketten sind außerdem nicht dasselbe Literal — angelegt wird mit dem vollen Satz, gesucht
wird nach dem Präfix.

**Verstümmelung, gemessen:** `note: ''` statt des Vermerks, alles andere unverändert.

| Zustand | Lauf | Code | Die Zeile |
|---|---|---|---|
| Bestand | 97/0 | 0 | `ok` |
| **der Vermerk gelangt gar nicht erst in den Bestand** | **97/0** | **0** | **`ok`** |

Die Zusicherung sagt weiterhin „der interne Vermerk steht nirgends in der Datei (A-7.2, R-06)" und
hat nichts gemessen. **Das ist die sechste der sechs Schichten aus 28.1.1** — diejenige, die ich
dort als „in der geschriebenen Datei" geführt und als gemessen gezählt habe.

#### 29.4.2 T-223-2 — dieselbe Blindheit in `proof:export-api`, Abschnitt 8

`proof-export-api.mjs` schreibt `VERMERK` **einmal** in den Bestand — `note: VERMERK` beim Anlegen
des Todos — und prüft in Abschnitt 8:

> `'weder in der Auswahlliste noch in einer Vorschau'` — Bedingung `!seenBodies.some((text) => text.includes(VERMERK))`

`some` über einer leeren Menge ist falsch, die Verneinung also wahr; und selbst über einer vollen
Menge ist die Zusicherung leer, wenn der gesuchte Text nie in den Bestand kam. **Nichts liest ihn
zurück.**

**Verstümmelung, gemessen:** `note: 'harmlos, kein Vermerk'` statt `note: VERMERK`.

| Zustand | Lauf | Code | Die Zeilen |
|---|---|---|---|
| Bestand | 69/0 | 0 | `ok` |
| **der Vermerk gelangt gar nicht erst in den Bestand** | **69/0** | **0** | **`ok`**, beide |

Zum Vergleich, und das ist der Maßstab: `proof:route-policy` macht es an derselben Grenze richtig —
es legt ein Todo mit Vermerk an, prüft, **daß die Oberfläche ihn liest**, und erst danach, daß das
Add-in-Token ihn nicht bekommt (28.2.5 Punkt 4). Genau diese Zeile fehlt in beiden Exportläufen.

#### 29.4.3 T-223-3 — zwei Zusicherungen über eine Ausgabe, die nicht angekommen sein muß

Im selben Abschnitt 8 stehen zwei weitere Zeilen, und die zweite ist eine Geheimnisgrenze:

> `'auch nicht in der Ausgabe des Dienstes'` — `!` `${stdout}\n${stderr}` `.includes(VERMERK)`
> `'und kein Token steht in der Protokollausgabe (B-2.4)'` — `!/takt_[A-Za-z0-9_-]{43}/.test(…)`

`stdout` und `stderr` werden aufgesammelt und **nur durchsucht, nie auf Inhalt geprüft**.

**Verstümmelung, gemessen:** die beiden Sammler werden unmittelbar vor Abschnitt 8 geleert — das
Modell für „die Ausgabe des Kindes ist nicht angekommen", etwa weil der Sidecar sein Protokoll
künftig in eine Datei schreibt.

| Zustand | Lauf | Code | Die Zeilen |
|---|---|---|---|
| Bestand | 69/0 | 0 | `ok` |
| **die Ausgabe des Kindes ist leer** | **69/0** | **0** | **`ok`**, beide |

**B-2.4 ist damit in diesem Lauf eine Zusicherung ohne Gegenstand**, sobald der Dienst schweigt.
Die Untergrenze ist trivial zu haben: Der Dienst protokolliert im Betrieb je Anfrage eine
JSON-Zeile; eine Mindestzahl davon ist eine Zeile Code.

#### 29.4.4 T-223-4 — die vier durchsuchten Dateien in `proof:access` sind eine gepflegte Liste

`proof-access.mjs`, Abschnitt 13, ist der einzige **statische** Teil eines sonst durchweg
verhaltensmessenden Laufs — und damit die A-A-33-Klasse selbst. Er durchsucht vier Dateien nach
einem Vergleich von Geheimnismaterial mit `===`:

```
const sources = ['src/access/verifier.ts', 'src/access/crypto.ts',
                 'src/http/guards.ts', 'src/access/token-service.ts'];
```

und schließt: `check('Kein === auf Tokenmaterial im Nachweispfad', offending.length === 0, …)`.

`src/access/` führt **dreizehn** Dateien. Was der Nachweispfad ist, entscheidet diese Aufstellung —
und nichts mißt, ob sie noch stimmt.

**Kunstquelle, gemessen:** eine Zeile
`export const t223Vergleich = (presented: string, secret: string): boolean => presented === secret;`
in `src/access/token-store.ts` — dieselbe Schublade, nicht auf der Liste.

| Zustand | Lauf | Code | Die Zeile |
|---|---|---|---|
| Bestand | 105/0 | 0 | `ok` |
| **`===` auf Geheimnismaterial eine Datei weiter** | **105/0** | **0** | **`ok Kein === auf Tokenmaterial im Nachweispfad`** |

Die zweite, schärfere Fassung derselben Gegenprobe — `verifier.ts` in zwei Dateien aufgeteilt, der
Vergleich in der neuen — **ließ sich nicht fahren** (29.0, Port belegt). Sie hätte den Fall belegt,
in dem die Aufstellung nicht durch Nachlässigkeit veraltet, sondern durch eine gewöhnliche
Umgliederung. Der Befund steht ohne sie, weil die erste Fassung ihn trägt.

#### 29.4.5 Wo ich nichts gefunden habe — vier gemessene Fehlschläge

Wie in 28.2.5: Ein Fehlschlag zählt so viel wie ein Fund, und er zählt nur, wenn er aufgeschrieben
wird.

1. **`proof:access` weigert sich bereits, wenn eine durchsuchte Datei fehlt.** Erwartet hatte ich
   ein stilles Überspringen. Gemessen: `verifier.ts` in der Aufstellung umbenannt → der Lauf hält an
   mit `ENOENT: no such file or directory, open '…/src/access/verifier-umbenannt.ts'` und **Code
   1**. Das ist die Weigerung, und sie ist nicht gebaut worden, sondern ergibt sich daraus, daß der
   Lauf `readFile` ohne Auffangnetz benutzt. **Der Rest von 29.4.4 bleibt trotzdem stehen:** Eine
   Aufstellung, die merkt, wenn ein Eintrag verschwindet, merkt nicht, wenn ein Eintrag **fehlt**.
2. **Die Auswahlliste in `proof:export-api` ist sauber verankert.** Die Zusicherung „keine
   ausgelieferte Quelle heißt nach einer Notiz (R-06, B-3.1)" ist `paths.every(…)` und damit dem
   Muster nach verdächtig — aber unmittelbar darüber stehen zwei Zeilen, die die Menge festnageln:
   `paths.length === EXPORT_SOURCE_PATHS.length` und der wörtliche Mengenvergleich „die gelieferte
   Menge ist wörtlich die des Motors (EXPORT_SOURCE_PATHS)". **Über der leeren Menge kann sie nicht
   bestehen.** Das ist die Bauart, die A-A-52 herstellen soll, und hier war sie schon da.
3. **Die `every`-Zusicherungen in `proof:export` sind durch Zählungen daneben verankert.** Abschnitt
   1: `before.entries.length === 3` vor dem Lauf, `after.auditCount === 3` und
   `after.openCandidates === 0` danach. Abschnitt 4 und 5: `alle drei Buchungen sind weiterhin
   Kandidaten` mit `after.openCandidates === 3` neben jedem `every`. Der Abbruchfall ist über
   `check('der Lauf bricht ab', threw)` verankert — **der Angriff, der nicht ankommt, kommt hier
   nicht durch.** Zwei schwächere Stellen (der Fall „verschwundener Ordner" und der Fall
   „dieselbe Tagesgruppe zweimal") tragen keinen eigenen Anker, hängen aber am selben
   `freshContext()` wie Abschnitt 1 und fielen mit ihm.
4. **`proof:access` Abschnitt 12 trägt die Regel bereits ausgeschrieben**, drei Wellen vor ihrer
   Formulierung — wie der YAML-Leser in 28.2.5 Punkt 1: „In allen 55 Antwortkörpern stehen genau **2**
   Tokens — die beiden Erzeugungen". Eine Zusicherung über eine Menge, mit der Untergrenze **und**
   der Obergrenze daneben, und die Zahl der Menge im Text. **So sieht die Zeile aus, die A-A-57 und
   A-A-58 in den beiden Exportläufen herstellen sollen — im selben Lauf, in dem A-A-59 fehlt.**

#### 29.4.6 Antwort auf O-JV

**Ja — sinngemäß, in derselben Fassung, und diesmal härter als bei den drei Läufen aus T-206.**

Von den drei Läufen ist keiner frei. Und anders als in T-206, wo die schwerste Blindheit an einer
Routenliste lag, liegen hier **drei von vier** Befunden an einer **Grenze, die dieses Papier
mehrfach als tragend geführt hat**: zweimal die Notiz-Grenze, einmal B-2.4.

**Was das für 28.1.1 heißt, und ich schreibe es gegen mein eigenes Papier.** Dort habe ich sechs
Schichten der Notiz-Grenze gezählt und fünf davon als gemessen ausgewiesen. Nach dieser Prüfung
sind es **vier**:

| Schicht aus 28.1.1 | Stand nach T-223 |
|---|---|
| 1 Typ der Domäne (`ExportSourcePath`) | steht, strukturell |
| 2 Typwächter am Katalog (`NoteSourceIsNotPublished`) | steht, strukturell |
| 3 Auswahlliste, wörtlich verglichen | **gemessen**, und in `proof:export-api` sauber verankert (29.4.5 Punkt 2) |
| 4 Renderer bei umgangener Prüfung | **gemessen** (28.1.1) |
| 5 durch den HTTP-Stapel (`proof:export-api`) | die Quellen-Zusicherung trägt; **Abschnitt 8 desselben Laufs trägt nicht** (T-223-2) |
| 6 in der geschriebenen Datei (`proof:export`) | **trägt nicht** (T-223-1) |

**Die Grenze selbst ist damit nicht offen** — die Schichten 1 bis 4 sind strukturell oder gemessen,
und `packages/export/test/note-boundary-property.test.ts` liegt daneben. Offen ist, wie oft dieses
Papier gesagt hat, sie sei gemessen. Das ist genau die Sorte Irrtum, gegen die A-A-55 geschrieben
ist, und sie ist mir selbst unterlaufen.

---

### 29.5 Befunde dieser Prüfung

| Nr. | Stufe | Befund | Zuständig |
|---|---|---|---|
| **T-223-0** | **Abnahme** | **A-A-51 bis A-A-55 sind erfüllt.** Alle zehn Gegenproben eigenständig nachgefahren, dazu der Befund selbst nachgestellt (200/200/401). Zahlen bestätigt: `route-policy` **41/0**, `openapi` **112/0**, `template-fields` **30/0**, alle Code 0; jede Verletzung rot mit Code 1 und mit der Meldung, die die Auflage vorhersagt. Kein falscher Alarm. | — |
| **T-223-1** | **muß** | **Ein `ALL`-Endpunkt auf einem Platzhalter ist für beide Wächter weiterhin unsichtbar.** Gemessen in **drei** Formen, nicht in einer: `api.all('/addin/leak/:id', …)`, `api.all('/addin/*', …)` und `api.all('/*', …)` — je **200 samt Rumpf**, zwei davon mit dem **Add-in-Token**, und beide Läufe bleiben **41/0** und **112/0, Code 0**. Die Stelligkeit trägt nicht (nachgemessen: zehn Kettenglieder Stelligkeit 2, Endpunkt 1 — und durch die Schreibweise aushebelbar); das Urteil des Erbauers darüber ist richtig. Die Wahl war aber nicht Liste oder nichts: **„Pfad ist genau `/*`" fängt vier der fünf Formen, „die Anzahl ist eine benannte Zahl" fängt alle fünf** — kein falscher Alarm auf dem unveränderten Baum. Gegenmittel: **A-A-56**. | domain-dev |
| **T-223-2** | **muß** | **Die Notiz-Grenze in `proof:export` besteht über einem Bestand ohne Vermerk.** `'der interne Vermerk steht nirgends in der Datei (A-7.2, R-06)'` sucht eine Zeichenkette, die nichts in den Bestand geschrieben haben muß. Gemessen: `note: ''` statt des Vermerks → **97/0, Code 0**, Zeile grün. Dies ist Schicht 6 der sechs aus 28.1.1. Gegenmittel: **A-A-57**. | domain-dev |
| **T-223-3** | **muß** | **Dieselbe Blindheit in `proof:export-api`, Abschnitt 8.** `!seenBodies.some(…)` ohne Untergrenze und ohne Rücklesung; der Vermerk wird einmal geschrieben und nie gelesen. Gemessen: `note: 'harmlos, kein Vermerk'` → **69/0, Code 0**, beide Zeilen grün. `proof:route-policy` macht es an derselben Grenze richtig (positiv verankert) — die Bauart ist im Baum vorhanden. Gegenmittel: **A-A-57**. | domain-dev |
| **T-223-4** | soll | **Zwei Zusicherungen über die Protokollausgabe des Dienstes bestehen ohne Protokollausgabe**, eine davon B-2.4 („und kein Token steht in der Protokollausgabe"). `stdout`/`stderr` werden gesammelt und nur durchsucht. Gemessen: beide Sammler leer → **69/0, Code 0**, beide Zeilen grün. Gegenmittel: **A-A-58**. | domain-dev |
| **T-223-5** | soll | **Die vier durchsuchten Dateien in `proof:access` Abschnitt 13 sind eine gepflegte Aufstellung ohne Anker.** `src/access/` führt dreizehn Dateien. Gemessen: ein `===` auf Geheimnismaterial in `src/access/token-store.ts` → **105/0, Code 0**, Zeile „Kein === auf Tokenmaterial im Nachweispfad" grün. Eine **fehlende** Datei fällt auf (harter Abbruch, Code 1); eine **hinzugekommene** nicht. Die schärfere Gegenprobe (Aufspaltung von `verifier.ts`) ließ sich nicht fahren — Port belegt, E-083 Punkt 2. Gegenmittel: **A-A-59**. | domain-dev |
| **T-223-6** | Berichtigung | **28.2.2 zählte drei tragende Stellen; es sind zwei — die Zwei stimmte.** Einzeln nachgemessen: Stelle 1 → `1: putTodoNote`, Stelle 2 → `1: getTodoNote`, **Stelle 3 → unverändert 2, Lauf 112/0, Code 0**. Berichtigt in 29.3, mit Marke. Die dritte Stelle bleibt: Sie schreibt einen Vermerk über die **Add-in-Route** und ist damit ein negativer Beitrag, kein Fehler. A-A-52 ist davon unberührt. | — |
| **T-223-7** | Hinweis | **28.1.1 hat sechs Schichten der Notiz-Grenze gezählt und fünf als gemessen ausgewiesen; nach T-223-2 und T-223-3 sind es vier.** Die Grenze ist nicht offen — die Schichten 1 bis 4 sind strukturell oder gemessen. Berichtigt in 29.4.6. Ein Papier, das zählt, was es nicht selbst nachgezählt hat, ist derselbe Fehler wie ein Wächter, der über eine Menge urteilt, die er nicht gesehen hat. | — |

### 29.6 Neue Auflagen

| ID | Wortlaut | Messung |
|---|---|---|
| **A-A-56** | Der offene Rest von A-A-51 wird geschlossen, und zwar **ohne** eine Aufstellung der erlaubten Pfade. Zwei Sätze, beide in `proof:route-policy` und `proof:openapi`, beide **vor** den Zusicherungen über die Routenliste: (1) **Jeder `ALL`-Eintrag trägt den Pfad `/*`** — die eine Form, die der Bestand benutzt; jede engere oder andere Form ist ein Befund. (2) **Die Zahl der `ALL`-Einträge ist eine benannte Zahl im Lauf** (heute zehn) und wird mit ihr verglichen. Wer ein Kettenglied hinzufügt oder entfernt, ändert die Zahl und sagt im selben Zug, welches — genau das ist der Zweck: Diese zehn sind die Vertrauensgrenze und kein Alltagsbestand. Die Begründung dafür, daß dies **keine** gepflegte Liste im Sinne von B-2.10 ist, gehört in den Kommentar: eine Fachroute wird nie unter `ALL` registriert, und alle zehn stehen als `app.use('*', …)` in einem Block in `app.ts`. **Als Hilfe, nicht als Bedingung:** Wer die Zahl anhebt, kann mit der Durchgriffsprobe aus 29.2.4 belegen, ob der neue Eintrag durchreicht oder antwortet. | In **beide** Richtungen: unveränderter Baum grün, kein falscher Alarm über die zehn Einträge; je eine Gegenprobe mit `api.all('/addin/leak/:id', …)`, `api.all('/addin/*', …)`, `api.all('/*', …)` und `app.all('/*', …)` auf der Wurzel-App — **alle vier rot, Code 1**, und die Meldung nennt den Pfad beziehungsweise die geänderte Zahl. Die Zahlen aus 29.2.3 sind die Erwartung. |
| **A-A-57** | Die Notiz-Grenze wird in `proof:export` und in `proof:export-api` **positiv verankert**, nach dem Muster, das `proof:route-policy` Abschnitt 1 bereits fährt: Der Vermerk wird über die reguläre Route **zurückgelesen** und muß dort **stehen**, bevor die Zusicherung urteilt, daß er anderswo fehlt. In `proof:export` außerdem: angelegt und gesucht wird **dasselbe Literal**, nicht ein Satz und sein Präfix. | In beide Richtungen: unveränderter Baum **97/0** und **69/0** — kein falscher Alarm; der Vermerk nicht in den Bestand geschrieben → **beide rot, Code 1**, und die Meldung sagt, daß er im Bestand fehlt, nicht daß er in der Datei steht. |
| **A-A-58** | Vor den beiden Zusicherungen über die Ausgabe des Dienstes in `proof:export-api` steht die Untergrenze, die sie voraussetzen: Die Ausgabe des Kindprozesses ist **nicht leer** und trägt mindestens die Protokollzeilen, die die gefahrenen Anfragen erzeugt haben. Ohne sie ist B-2.4 in diesem Lauf eine Zusicherung ohne Gegenstand. | In beide Richtungen: unveränderter Baum **69/0**; die Sammler leer → **rot, Code 1**, Meldung nennt die gemessene Länge. |
| **A-A-59** | Die Aufstellung der durchsuchten Dateien in `proof:access` Abschnitt 13 bekommt einen Anker. Zwei tragfähige Formen stehen zur Wahl, und die Entscheidung darüber gehört zum Bau: entweder **die Aufstellung entfällt** und der Lauf durchsucht `src/access/**` und `src/http/**` vollständig, oder sie bleibt und der Lauf **weigert sich**, solange es in diesen Verzeichnissen eine Datei gibt, die er nicht angesehen hat. Die zweite Form ist die billigere und die genauere; sie verlangt eine benannte Zahl der ausgenommenen Dateien mit je einem Wort dazu, warum. | In beide Richtungen: unveränderter Baum **105/0** — kein falscher Alarm; ein `===` auf Geheimnismaterial in `src/access/token-store.ts` → **rot, Code 1**, und die Meldung nennt Datei und Zeile. Zusätzlich die Gegenprobe, die ich nicht fahren konnte: `verifier.ts` in zwei Dateien aufgeteilt, der Vergleich in der neuen → **rot**. |
| **A-A-60** | Die Regel aus A-A-55 gilt **für alle** Nachweispfade dieses Baums und nicht nur für die sechs, an denen sie bisher gemessen wurde. Wer einen neuen `proof:`-Lauf baut oder einen bestehenden um eine Zusicherung erweitert, schreibt neben jede Aussage über eine **Menge** deren Untergrenze und neben jede Aussage über einen **Angriff** den Nachweis, daß er angekommen ist. Der Satz steht bereits im Kopf von `proof-route-policy.mjs`; diese Auflage macht ihn von einer Beobachtung zu einer Bedingung der Abnahme. | Keine eigene Messung. Ihre Wirkung ist an A-A-51 bis A-A-54 und A-A-56 bis A-A-59 ablesbar: **neun** Behebungen in zwei Wellen sind Anwendungen desselben Satzes. |

### 29.7 Urteil dieser Prüfung

**Zur Abnahme von T-215: freigegeben.** A-A-51 bis A-A-55 sind erfüllt, jede Zahl ist eigenständig
nachgemessen, der behobene Befund ist vorher nachgestellt worden. Der Erbauer hat den Weg
genommen, den diese Seite fünfmal vorgemacht hat — den Befund erst nachstellen, dann beheben,
dann in beide Richtungen messen —, und er hat den Rest, den er nicht schließen konnte, benannt
statt ihn zu verschweigen. **Das ist der Grund, warum diese Abnahme so kurz sein konnte.**

**Zur Prüfung insgesamt: Nacharbeit.** Drei Befunde der Stufe **muß**, zwei der Stufe **soll**,
eine Berichtigung, ein Hinweis. Fünf neue Auflagen, dazu eine sechste, die keine Bauarbeit ist,
sondern eine Bedingung der Abnahme.

**Zur Entscheidung, um die ich gebeten wurde:** Der benannte Rest reicht nicht. Nicht weil das
Urteil des Erbauers falsch war — es war richtig, und es ist hier nachgemessen —, sondern weil er
die Alternative als **Liste** gedacht hat. Als **Zahl** kostet sie eine Zeile und fängt jede der
fünf Formen. Ein Wächter, dessen ganzer Zweck Sicherheit ist, darf keine unsichere Heuristik
tragen; er darf aber auch nicht bei der ersten verworfenen Heuristik stehenbleiben.

**Der Satz dieser Prüfung.** Siebenmal in sieben Wellen war die Antwort auf dieselbe Frage „ja",
und diesmal traf sie die Grenze, die dieses Papier am häufigsten als gesichert geführt hat. Zwei
Läufe sagen seit Wellen, der interne Vermerk stehe nicht in der Exportdatei und in keiner Antwort —
und beide sagen es genauso, wenn es ihn gar nicht gibt. In 28.1.1 habe ich sie als zwei von sechs
Schichten gezählt und nicht nachgesehen, was sie messen. **Der Wächter irrt sich über seinen
Gegenstand; der Prüfer, der ihn zählt, ohne ihn zu fahren, irrt sich mit ihm.**

---

## 30. Prüfung T-230 (2026-09-06) — A-A-60 an vier weiteren Läufen, und ein Wächter, der 0 Dateien durchsieht und es „ok" nennt

**Auftrag.** Zwei Punkte. **Erstens A-A-60** an vier Nachweispfaden, die diesen Maßstab noch nicht
gesehen haben: `proof:tags`, `proof:conflicts`, `proof:callers`, `proof:db-permissions`. Die Frage
ist dieselbe wie sechsmal zuvor — **weiß der Lauf, wenn er blind ist, und prüft eine Zusicherung
ihre eigene Vorbedingung?** **Zweitens** die Entscheidung über den Rest, den domain-dev in T-225
zu A-A-56 benannt hat: Wer ein Kettenglied entfernt und im selben Zug einen Endpunkt unter `ALL`
auf `/*` legt, ergibt wieder die richtige Zahl und die richtige Form.

### 30.0 Stand der Werkzeuge, was gemessen wurde und was nicht

**Guardian und 42Crunch: dreizehntes Mal ohne Werkzeug** (E-079 Punkt 3, nicht erneut versucht).
Neu ist der Grund: Der Auftraggeber hat auf Nachfrage bestätigt, daß es **keinen Zugang gibt**.
Damit ist das ein **Zustand** und keine Warteposition mehr, und die Feststellung aus 28.0 und 29.0
wiegt entsprechend schwerer: **Die Aussage über die OpenAPI-Beschreibung ruht vollständig auf
`proof:openapi`.** Ein zweites, fremdes Augenpaar auf dieselbe Datei wird es nicht geben. Der
einzige Ersatz ist, die eigenen Läufe regelmäßig gegen Verstümmelungen zu fahren — und genau das
ist, was A-A-60 zur Bedingung macht.

**`proof:all` nicht gefahren** (E-083 Punkt 3).

**Der Port gehörte in dieser Welle e2e-tester** (E-083 Punkt 2). Das ist keine Nebenbemerkung,
sondern der Zuschnitt dieser Prüfung, und deshalb steht er hier vollständig:

| Lauf | portgebunden? | gemessen |
|---|---|---|
| `proof:callers` | **nein** | **vollständig**, 45 Zeilen |
| `proof:tags` | ab Abschnitt 4 | **Abschnitte 1 bis 3**, 16 Zeilen |
| `proof:conflicts` | ab Abschnitt 2 | **Abschnitt 1**, 61 Zeilen |
| `proof:db-permissions` | Abschnitt 4 | **Abschnitte 1 bis 3**, 11 Zeilen |

Die Portbindung ist nicht umgehbar: `PORT = 17843` steht fest in `proof-tags.mjs` und
`proof-conflicts.mjs`, und der Dienst nimmt `DEFAULT_PORT` aus
`apps/local-api/src/config.ts` — dort ausdrücklich als „**im Code festgelegt und zur Laufzeit
nicht änderbar**", weil „B-1.1 Punkt 3 verlangt, dass die Bindeadresse nicht aus Konfiguration
oder Umgebungsvariable ableitbar ist". Ein Ausweichport wäre eine Aufhebung von B-1.1 gewesen und
kommt nicht in Frage. **Was nicht lief, steht hier als Vorhersage (30.6) und nicht als grüner
Haken.**

**Gemessen wurde am Verhalten, außerhalb des Bestands** — wie in T-176, T-183, T-189, T-206 und
T-223. Der Spiegel liegt unter `/tmp/t230/root` und trägt die Gestalt des Arbeitsbereichs:
`apps/local-api`, `apps/web` und `apps/outlook-addin` als Kopien, `packages` ebenfalls als Kopie
(anders als in T-223 — die Messung an `proof:db-permissions` verlangt eine Verstümmelung in
`packages/storage`, und die durfte den echten Baum nicht berühren), `node_modules` als Verweis auf
den echten.

Die portgebundenen Teile sind nicht abgeschaltet, sondern **abgeschnitten**: `tags-teil1.mjs` ist
zeichengleich Zeile 1 bis 410 von `proof-tags.mjs`, `conflicts-teil1.mjs` Zeile 1 bis 532 von
`proof-conflicts.mjs`, `dbperm-teil13.mjs` Zeile 1 bis 206 und 269 bis Ende von
`proof-db-permissions.mjs`, je mit der unveränderten Schlußauswertung. Keiner der drei Schnitte
enthält `spawn(process.execPath` oder `waitForPortFree(PORT)` — nachgezählt, je **0**. Dieselbe
Bauart, die domain-dev in T-225 benutzt hat.

**Zeichengleichheit doppelt belegt.** `diff -rq` über `apps/web/src`, `apps/outlook-addin/src`,
`apps/local-api/scripts` und `packages/storage/src/sqlite/database.ts` ohne Unterschied, und eine
Prüfsumme über alle `ok`/`FEHL`-Zeilen vor der ersten und nach der letzten Messung:

| Lauf | vorher | nachher | Zahlen |
|---|---|---|---|
| `proof:callers` | `3479464283` | `3479464283` | **45/0** |
| `proof:tags` Abschnitte 1–3 | `181362322` | `181362322` | **16/0** |
| `proof:conflicts` Abschnitt 1 | `2453847206` | `2453847206` | **61/0** |
| `proof:db-permissions` Abschnitte 1–3 | `3239101755` | `3239101755` | **11/0** |

`proof:callers` ist zusätzlich **im Bestand selbst** gefahren, portfrei, und ergibt dieselbe
Prüfsumme `3479464283`. Der Spiegel bildet also nicht nur sich selbst ab.

Alle Kunstquellen und Verstümmelungen sind ausschließlich im Spiegel entstanden und mit ihm
gelöscht. Der versionierte Bestand führt weder `Zweitweg` noch `teil1` noch `t230`.

---

### 30.1 `proof:callers` — drei Befunde an derselben Zusage

Dieser Lauf ist der bestbewachte der vier, und das ist der Grund, warum er hier zuerst steht: Er
prüft sich in **zwei** Abschnitten selbst (6 und 8), er hat in T-188 mit A-A-40 eine
Blindheitsmessung eingebaut bekommen, und sein Abschnitt 0 ist die Vorlage, die dieses Papier seit
T-206 zitiert. Die drei Befunde sitzen alle an **einer** Zusage — der aus Abschnitt 1 und 7, ohne
die der ganze Lauf nichts wert wäre:

> Dieser Lauf liest **eine** Datei. Diese Beschränkung ist nur so viel wert wie die Zusicherung,
> dass es keine zweite gibt. Also wird sie gemessen und nicht geglaubt.

#### 30.1.1 T-230-1 (muß) — „0 Dateien durchgesehen" ist eine grüne Zeile

`proof-callers.mjs` sammelt die zu durchsuchenden Dateien selbst:

```js
const webSources = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) walk(child);
    else if (/\.tsx?$/.test(entry.name)) webSources.push(child);
  }
};
walk(WEB_SOURCE_DIR);
```

Die Zahl der eingesammelten Dateien geht in den **Namen** der Zusicherung und in keine Bedingung:

```js
check(
  `\`fetch\` steht nur in api/client.ts (${webSources.length} Dateien durchgesehen)`,
  strayFetch.length === 0,
  strayFetch.map(describeStray).join(' | '),
);
```

**Verstümmelung** (nur der Sammler, die Dateien bleiben auf der Platte): `/\.tsx?$/` →
`/\.KEINETREFFER$/`.

**Ergebnis: `45 bestanden, 0 fehlgeschlagen`, Code 0.** Die Zeile lautet dann wörtlich:

```
  ok    `fetch` steht nur in api/client.ts (0 Dateien durchgesehen)
```

Dieselbe Verstümmelung am Sammler des Add-ins (`walkAddin`) ergibt ebenso **45/0, Code 0** mit

```
  ok    `fetch` steht im Add-in nur in api/client.ts (0 Dateien durchgesehen)
```

**Warum die sechs Gegenproben das nicht sehen — und strukturell nicht sehen können.** Der Lauf hat
seit T-188 für genau diese Zusage eine Selbstprobe, `proveFetchGuard`, mit fünf Schreibweisen und
einer Umkehrprobe. In beiden Verstümmelungen bleiben **alle sechs grün**. Der Grund steht in ihr
selbst:

```js
const probe = (source) =>
  strayGlobalFetch([...files, { name: INJECTED, source }], allowed)
    .map((finding) => finding.name)
    .filter((name) => !baseline.includes(name));
```

Die eingesetzte Datei wird der **Liste** hinzugefügt und nicht der Platte. Damit prüft
`proveFetchGuard` das **Sieb** und nie die **Ernte**. Ein Sieb, durch das nichts geschüttet wird,
ist tadellos.

**Auswirkung.** Die Zusage „es gibt keinen zweiten Weg zum Dienst" ist die Vorbedingung der
Abschnitte 2 bis 5 und 7 — also von 41 der 45 Zeilen. Fällt der Sammler aus (ein umbenanntes
Verzeichnis, eine Umstellung auf ein anderes Werkzeug, eine Änderung an der Endung), meldet der
Lauf nicht, daß er blind ist. Er meldet 45/0.

**Gegenmittel: A-A-61.**

#### 30.1.2 T-230-2 (muß) — der Ausdruck, den derselbe Lauf drei Absätze weiter oben verurteilt

Unmittelbar unter der `fetch`-Zusicherung steht ihre Zwillingszeile:

```js
const strayRequest = [];
for (const file of webFiles) {
  if (
    /(?<![\w.])request\s*[<(]/.test(file.source) &&
    file.name !== 'api/endpoints.ts' &&
    file.name !== 'api/client.ts'
  ) {
    strayRequest.push(file.name);
  }
}
check('`request(` steht nur in api/endpoints.ts', strayRequest.length === 0, strayRequest.join(', '));
```

Der Kommentar zwanzig Zeilen darüber sagt über **denselben** Ausdruck in seiner `fetch`-Fassung:

> Hier stand `/(?<![\w.])fetch\s*\(/`. Das ist **zeichengleich** der Ausdruck, den T-143 als S-1 an
> einem anderen Wächter als blind gemessen und den T-146 dort ersetzt hat: Der Rückblick auf `.`
> schließt **jedes** `.fetch` aus, um zwei Fälle durchzulassen — und läßt damit `globalThis.fetch(`,
> `window.fetch(`, `self.fetch(` und jede Zerlegung durch. Für diese Zusage gab es außerdem **null**
> Gegenproben; sie stehen jetzt in Abschnitt 6.

Für die `request`-Fassung steht der Ausdruck unverändert da, und Gegenproben gibt es für sie
**null** — auch nach A-A-40.

**Kunstquelle**, eine Datei in `apps/web/src/app/Zweitweg.tsx` im Spiegel:

```ts
import * as client from "../api/client";

export async function alleTodosLoeschen(): Promise<void> {
  await client.request("/todos/00000000-0000-4000-8000-000000000000", { method: "DELETE" });
}
```

**Ergebnis: `45 bestanden, 0 fehlgeschlagen`, Code 0.** Beide Zeilen grün, die Zahl steigt
klaglos von 117 auf 118 Dateien.

**Gegenprobe** (dieselbe Datei, benannte Einfuhr statt Namensraum): `import { request } from
"../api/client";` → **`44 bestanden, 1 fehlgeschlagen`, Code 1**, mit

```
  FEHL  `request(` steht nur in api/endpoints.ts — app/Zweitweg.tsx
```

Der Wächter hat also Zähne; er sieht nur eine von zwei Schreibweisen derselben Sache.

**Warum das ein Weg ist und keine Spitzfindigkeit.** `request` ist ausgeführt exportiert —
`apps/web/src/api/client.ts` führt `export async function request<T>(path: string, options:
RequestOptions = {}): Promise<T>`. Eine Ansicht, die ihn über den Namensraum ruft, spricht den
Dienst mit **demselben Sitzungsgeheimnis und derselben Grundadresse** an wie `endpoints.ts` und
geht dabei an Abschnitt 2 bis 5 dieses Laufs vorbei — an der Wegprüfung, an der Rumpfprüfung, an
der Abfrageprüfung und an der Zählung der blinden Flecken. **Der `fetch`-Wächter fängt sie
ebensowenig**: Diese Ansicht ruft kein `fetch`, sie benutzt das eine, das erlaubt ist.

**Auswirkung.** Genau der Fehler aus T-050 — ein Schlüssel, den niemand liest, 422 oder stilles
Verwerfen, wochenlang unbemerkt — wäre in einer so geschriebenen Ansicht wieder unsichtbar. Der
Lauf, der dagegen gebaut wurde, sagt dazu „ok".

**Gegenmittel: A-A-62.**

#### 30.1.3 T-230-3 (soll) — der Sammler sieht zwei Endungen, der Bündler fünf mehr

Dieselbe Kunstquelle — ein nacktes `fetch(` auf `http://127.0.0.1:17843/api/v1/…` in einer neuen
Datei unter `apps/web/src/app/` — in sieben Schreibweisen der Dateiendung, sonst zeichengleich:

| Endung | Lauf | Code | Zeile |
|---|---|---|---|
| `.tsx` | **44/1** | **1** | `FEHL … (118 Dateien durchgesehen) — app/Zweitweg.tsx:2 — await fetch(…` |
| `.ts` | **44/1** | **1** | `FEHL … (118 Dateien durchgesehen) — app/Zweitweg.ts:2 — await fetch(…` |
| `.jsx` | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |
| `.js` | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |
| `.mts` | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |
| `.cts` | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |
| `.mjs` | **45/0** | 0 | `ok … (117 Dateien durchgesehen)` |

Fünf von sieben sind unsichtbar, und die Zahl im Text bleibt bei 117 stehen — der Lauf bemerkt
nicht, daß es eine 118. Datei gibt. Vite löst alle fünf auf; keine von ihnen ist eine
Verlegenheitsform.

Dies ist derselbe Befund wie T-230-1 aus der anderen Richtung: Dort war die Ernte **leer**, hier
ist sie **schmaler als der Bau**. Die Stufe ist niedriger, weil heute keine solche Datei im Baum
liegt und die Behebung in einem Zeichen besteht.

**Gegenmittel: A-A-61**, zweiter Satz.

---

### 30.2 T-230-4 (muß) — `proof:tags` Abschnitt 1: dreißig Namen, null Zeilen

Der Abschnitt legt dreißig Tagnamen an Kanten der Faltungsregel an, fährt Migration 0008 darüber
und vergleicht das Ergebnis mit der Domänenfunktion:

```js
const rows = db.prepare('SELECT id, name, name_key FROM tag ORDER BY created_at').all();
…
rows.forEach((row, index) => {
  const original = NAMES[index];
  if (row.name_key !== tagNameKey(original)) { keyMismatch.push(…); }
  if (row.name !== normalizeTagName(original)) { nameMismatch.push(…); }
});

check(
  `die Migration errechnet für alle ${String(NAMES.length)} Namen denselben Schlüssel wie die Domäne`,
  keyMismatch.length === 0,
  keyMismatch.slice(0, 3).join(' | '),
);
```

Die Zahl im Text kommt aus `NAMES.length` — der **Erwartung**. Die Schleife läuft über `rows` —
die **Messung**. Verglichen werden die beiden nie.

**Verstümmelung A — der Leser sieht keine Zeile** (`SELECT … WHERE 0 ORDER BY created_at`):
**`16 bestanden, 0 fehlgeschlagen`, Code 0.** Die Zeile lautet unverändert

```
  ok    die Migration errechnet für alle 30 Namen denselben Schlüssel wie die Domäne
```

und `und dieselbe Anzeigeform` ebenso. Kein einziger anderer Haken wird rot.

**Verstümmelung B — die Vorlagen gelangen nicht in den Bestand** (der `insert.run(…)` der
Anlegeschleife entfällt): **`15 bestanden, 1 fehlgeschlagen`, Code 1** — aber beide Zeilen von
Abschnitt 1 bleiben **grün**, und rot wird eine Zeile **einen Abschnitt später** und aus einem
anderen Anlaß:

```
  FEHL  ein zweites Tag mit demselben Schlüssel wird abgewiesen — am Adapter vorbei — durchgekommen
```

Der Lauf wird also gerettet, aber nicht von seiner Zusicherung, sondern davon, daß Abschnitt 2
zufällig auf demselben Bestand aufsetzt — und er nennt den falschen Grund. Wer die Meldung liest,
sucht am eindeutigen Index und nicht an den fehlenden Vorlagen.

**Das Gegenmittel steht zwei Abschnitte weiter im selben Lauf.** Abschnitt 3 macht es richtig:

```js
check(
  'kein Tag geht verloren',
  after.length === 6,
  `${String(after.length)} statt 6`,
);
```

Eine Zeile derselben Bauart in Abschnitt 1 — `rows.length === NAMES.length` neben
`keyMismatch.length === 0` — schließt den Befund.

**Auswirkung.** Migration 0008 setzt den Vergleichsschlüssel für Tags. Sie ist die Stelle, an der
aus zwei Schreibweisen ein Tag wird, und ihre Richtigkeit hängt daran, daß SQL und Domäne
dieselbe Faltung rechnen. Rechnete eine künftige Fassung von 0008 anders — oder ließe sie Zeilen
aus —, sagte dieser Abschnitt weiterhin, sie rechne für alle dreißig Namen richtig.

**Gegenmittel: A-A-63.**

---

### 30.3 T-230-5 (muß) — `proof:conflicts` Abschnitt 1: die Verletzung tritt ein, aber nicht die benannte

Der Abschnitt löst vierzehn Verletzungen eindeutiger Indizes aus und übersetzt sie mit der
Funktion, die auch der Dienst benutzt. Der Auslöser prüft seine Vorbedingung — **im Wortlaut**:

```js
check(
  `${indexName}: die Verletzung tritt ein`,
  translated !== null,
  raw === '' ? 'kein Wurf — die Vorbedingung stimmt nicht' : raw,
);
if (translated === null) return;
```

Was er nicht prüft: **welche** Verletzung eingetreten ist. `raw` enthält die Meldung von SQLite und
damit den Indexnamen; sie wird als Erläuterung mitgeführt und in keiner Bedingung benutzt.

**Kunstquelle.** Der Block für `ux_tag_name` legt heute bewußt einen Schlüssel ohne Zwilling an —
der Kommentar daneben sagt warum: „`ux_tag_name` lässt sich nur isoliert auslösen, wenn der
Vergleichsschlüssel **nicht** kollidiert — sonst schlägt `ux_tag_name_key` mit zu." Genau das ist
die Kunstquelle: `'ein schluessel ohne zwilling'` → `nameKey('Alpha')`.

**Ergebnis: `61 bestanden, 0 fehlgeschlagen`, Code 0.** Alle vier Zeilen des `ux_tag_name`-Blocks
bleiben grün. Mit ausgegebenem `raw` sieht man, was tatsächlich geschah:

```
        ROH ux_tag_name: UNIQUE constraint failed: index 'ux_tag_name_key'
        ROH ux_tag_name_key: UNIQUE constraint failed: index 'ux_tag_name_key'
```

Zwei der vierzehn Blöcke messen denselben Index. `ux_tag_name` ist in diesem Lauf **überhaupt
nicht** geprüft, und der Lauf sagt 61/0.

**Warum das dieselbe Gefahr ist, die der Abschnitt drei Blöcke früher benennt.** Er tut es
ausführlich, und er tut es an der richtigen Stelle für den **Übersetzer**:

> `ux_tag_name` ist eine Teilzeichenkette von `ux_tag_name_key`. Ein Zuordner, der blank nach
> Teilzeichenketten sucht, ordnet die Meldung des einen dem Eintrag des anderen zu. Heute wäre das
> folgenlos — beide tragen denselben Satz —, morgen nicht mehr.

Er geht sogar einen Schritt weiter als jeder andere Lauf dieses Baums und prüft, daß seine eigene
Gegenprobe nicht über der leeren Menge steht:

```js
const nested = mapped.filter((name) => mapped.some((other) => other !== name && other.includes(name)));
check(
  `es gibt überhaupt einen Indexnamen, der in einem anderen steckt (${nested.join(', ') || 'keinen'})`,
  nested.length > 0,
  'ohne einen solchen Fall sagt die Prüfung darüber nichts',
);
```

**Und dann fällt die Wachsamkeit genau dort aus, wo sie zum zweiten Mal gebraucht wird** — bei der
**Provokation** statt bei der Übersetzung. Die Behebung ist eine Bedingung mehr in einer Zeile,
die es schon gibt: `raw.includes(indexName)` neben `translated !== null`.

**Auswirkung.** Die vierzehn Blöcke sind die Zusage, daß jede Verletzung eines eindeutigen Index
im Dienst zu einem eigenen, deutschen Satz wird und **nicht** zur allgemeinen Auskunft — und daß
die Meldung von SQLite nicht in der Antwort steht (B-2.4). Ein Block, der einen anderen Index
trifft, prüft B-2.4 zweimal für denselben Index und für einen gar nicht. Solange beide Indizes
dieselbe Kennung tragen, bleibt es folgenlos; der Abschnitt selbst schreibt „morgen nicht mehr".

**Gegenmittel: A-A-64.**

---

### 30.4 T-230-6 (soll, mit Berichtigung) — `proof:db-permissions`: welcher Abschnitt mißt das `chmod`?

Der Kopf der Datei sagt:

> Damit Abschnitt 1 und 2 wirklich das `chmod` messen und nicht die `umask`, setzt dieser Prüfpfad
> seine eigene `umask` ausdrücklich **weit** (`0o000`) — und der Kindprozess in Abschnitt 4 erbt
> sie.

Gesetzt wird sie in einer Zeile: `const vorherigeUmask = process.umask(0o000);`. **Gemessen wird
sie nirgends.**

Zwei Verstümmelungen, beide in `packages/storage/src/sqlite/database.ts` beziehungsweise im
Prüfpfad, beide nur im Spiegel:

| Verstümmelung | Lauf | Code | Abschnitt 1 | Abschnitt 2 | Abschnitt 3 |
|---|---|---|---|---|---|
| — (unverändert) | **11/0** | 0 | grün | grün | grün |
| **M1** `secureDatabaseFiles` fällt aus, `umask` weit (`0o000`) | **6/5** | **1** | **3× rot** (`0644`) | **rot** | **rot** |
| **M2** `secureDatabaseFiles` fällt aus, `umask` eng (`0o077`) | **10/1** | 1 | **3× grün** | **rot** | **grün** |

**M1 belegt, daß die Abschnitte Zähne haben.** Das ist die Gegenprobe, ohne die der Befund nichts
wert wäre.

**M2 ist der Befund.** Mit ausgeschalteter Maßnahme des Produkts melden Abschnitt 1 („takt.db
liegt mit 0600 (war: 0644)", dreimal) und Abschnitt 3 („die Sicherungskopie liegt mit 0600") **ok**
— sie messen dann die `umask` und nicht das `chmod`, also genau das, was der Kopf ausschließt.

**Und der einzige Abschnitt, der M2 überlebt, ist der einzige, der seine Vorbedingung mißt.**
Abschnitt 2 stellt die Ausgangslage nicht nur her, er behauptet sie als eigene Zeile:

```js
check('Ausgangslage hergestellt: takt.db liegt mit 0644', mode(path) === 0o644, octal(mode(path)));

const second = openConnection(path);
check(
  'nach dem Öffnen liegt sie mit 0600',
  mode(path) === DATABASE_FILE_MODE,
  octal(mode(path)),
);
```

Vorher `0644`, nachher `0600`, in zwei Zeilen desselben Laufs — das ist eine Aussage über die
**Wirkung** und nicht über den Zustand. Sie ist gegen jede `umask` immun.

**Berichtigung.** Der Satz im Kopf der Datei ist zu weit: Es ist **Abschnitt 2**, der das `chmod`
mißt, nicht Abschnitt 1 und 2. Abschnitt 1 mißt das Ergebnis beider Maßnahmen und kann sie nicht
auseinanderhalten. Die Behebung kostet eine Zeile — `check('die umask dieses Laufs ist weit',
process.umask() === 0o000, …)` vor Abschnitt 1 —, und dann stimmt der Satz.

**Stufe soll und nicht muß**, weil der Lauf als Ganzes in M2 rot wird. Er wird es aber nur wegen
Abschnitt 2, und er nennt dabei drei grüne Zeilen, die falsch sind.

**Gegenmittel: A-A-65.**

---

### 30.5 Wo ich nichts gefunden habe — sechs Erwartungen, die sich nicht bestätigt haben

Dieser Abschnitt ist so wichtig wie die fünf davor. „Hier ist nichts" ist nur dann eine Aussage,
wenn dabeisteht, wonach gesucht wurde.

1. **`proof:conflicts` Abschnitt 1 trägt A-A-60 in drei Formen — und im Wortlaut.** Er hat eine
   **Untergrenze** (`inSchema.length > 0`, „das Schema führt N eindeutige Indizes"), er prüft
   **beide Richtungen** (jeder Index hat einen Eintrag, kein Eintrag ist verwaist), und er prüft,
   daß seine eigene Gegenprobe nicht leer läuft (`nested.length > 0`, „ohne einen solchen Fall
   sagt die Prüfung darüber nichts"). Der Erläuterungstext seines Auslösers lautet buchstäblich
   „kein Wurf — **die Vorbedingung stimmt nicht**". Das ist die Regel aus A-A-55, ausgeschrieben
   in einem Lauf, der Wellen vor ihrer Formulierung entstanden ist — dieselbe Beobachtung wie zu
   `proof:access` Abschnitt 12 in T-223. Der Befund T-230-5 sitzt **neben** dieser Sorgfalt und
   nicht statt ihrer.
2. **`proof:db-permissions` Abschnitt 2 ist die sauberste Vorbedingungsmessung dieses Baums.** Sie
   ist oben belegt: der einzige Abschnitt, der M2 überlebt.
3. **`proof:db-permissions` Abschnitt 4 fängt seine Blindheit ausdrücklich** — gelesen, nicht
   gemessen (Port). `check('der Dienst legt seinen Bestand an', appeared, stderr.slice(-300));`
   steht **vor** allen Rechteaussagen, und die Durchsicht des ganzen Verzeichnisses liegt
   **innerhalb** von `if (appeared)`. Erwartet hatte ich hier eine Zusicherung über eine
   Verzeichnisliste, die leer sein darf; sie ist es nicht.
4. **`proof:callers` Abschnitt 0 ist die Vorlage, die dieses Papier zitiert, und er hält.** Die
   Zahl der Aufrufe wird auf **zwei** Wegen ermittelt — aus dem Syntaxbaum und aus dem Rohtext —
   und gegeneinander gehalten (`rawCalls > 0 && result.calls.length === rawCalls`), dazu eine
   Untergrenze (`>= 45`), dazu `unreadable.length === 0`. Abschnitt 5 trägt
   `withBody >= 25 && withQuery >= 5`. Abschnitt 7 hat dieselbe Doppelermittlung für den zweiten
   Aufrufer. Ich habe an drei Stellen eine fehlende Untergrenze erwartet und keine gefunden.
5. **Eine Selbstprobe, die ins Leere greift, wird rot gemeldet.** `proof:callers` Abschnitt 6 und
   8: `if (spoiled === callerText) { check('die Probe „…" lässt sich anwenden', false, 'die Stelle
   wurde nicht gefunden'); continue; }`, dazu die Prüfung, daß die Ersetzung einzeilig bleibt.
   Erwartet hatte ich ein stilles Überspringen — wie in T-223 an `proof:access` erwartet und
   ebenfalls nicht gefunden.
6. **`proof:tags` Abschnitt 3 bis 8 sind positiv verankert.** `after.length === 6` („kein Tag geht
   verloren"), `creators.length === 1`, `responses.length - creators.length === 7`,
   `(todosOnTag?.items ?? []).length === 8`, `theTag !== undefined &&` vor der Aussage über die
   acht Todos. Die Blindheit dieses Laufs sitzt in Abschnitt 1 und **nur** dort — was den Befund
   T-230-4 schärfer macht, nicht milder.

---

### 30.6 Was der Port verhindert hat — drei Vorhersagen statt drei Auslassungen

Nicht gemessen: `proof:tags` Abschnitte 4 bis 9, `proof:conflicts` Abschnitte 2 bis 6,
`proof:db-permissions` Abschnitt 4. Sie stehen hier als benannte Erwartungen mit der Verstümmelung,
die sie prüfen würde, damit die nächste portfreie Welle sie nachfahren kann statt sie neu zu
suchen.

**V-1 — `proof:tags` Abschnitt 9: ein Status ohne einen Grund.**

```js
check('mehr als fünfzig Namen werden abgewiesen', tooMany.status === 422, `Status ${String(tooMany.status)}`);
…
check('ein Name aus lauter Leerzeichen wird abgewiesen', blank.status === 422, `Status ${String(blank.status)}`);
```

Dieselbe Klasse wie T-230-5: Die Zusicherung sagt „abgewiesen **weil**", gemessen wird
„abgewiesen". Der Nachbarabschnitt 8 macht es richtig — `(ambiguous.body?.error?.details ??
[]).some((entry) => entry.code === 'tag_name_ambiguous')`. **Erwartung:** Eine Kunstquelle, die
die Anfrage aus einem anderen Grund auf 422 bringt (etwa ein zu langer Titel), läßt beide Zeilen
grün.

**V-2 — `proof:tags` Abschnitt 5: die Zusage ist die Transaktion, gemessen wird die Zahl.**
Die Überschrift lautet „Kein Tag ohne sein Todo — die achte Stelle aus T-047", und der Kommentar
nennt die gemeinsame Transaktion als das Geprüfte. Gemessen wird
`afterFailure.length === beforeFailure`. Das ist wahr, wenn die Transaktion zurückrollt — **und
ebenso**, wenn das Tag nie entstanden ist, weil die Anfrage schon an der Eingabeprüfung
gescheitert ist. **Erwartung:** Eine Kunstquelle, die den Fehlschlag **vor** die Tag-Anlage legt,
läßt alle drei Zeilen grün, und die Zusage über die Transaktion steht dann über der leeren Menge.
Unterscheidbar wäre es an der Fehlerkennung der Antwort.

**V-3 — `proof:db-permissions` Abschnitt 4 hat als einziger der drei keine Portmeldung.**
`proof:tags` und `proof:conflicts` beginnen ihren Dienstteil mit `waitForPortFree(PORT)` und einer
Meldung im Klartext („Auf 127.0.0.1:17843 lauscht bereits etwas, auch nach 5 s Warten. Läuft Takt
oder ein anderer Prüfpfad noch?"). `proof:db-permissions` hat weder das eine noch das andere,
sondern eine Annahme im Kommentar:

> Er wird den Port 17843 möglicherweise nicht bekommen — die Anwendung oder ein anderer Prüfpfad
> kann laufen. Das macht nichts: Verzeichnis, Datenbank und Migration entstehen im Start **vor**
> dem Binden.

**Erwartung:** Stimmt der Satz, ist alles gut. Stimmt er nicht, wird der Lauf bei belegtem Port
rot mit der **falschen** Begründung — „der Dienst legt seinen Bestand an" statt „der Port ist
belegt" —, und der nächste Leser sucht an den Dateirechten. Der Satz ist eine unbelegte Zusage
über eine Reihenfolge im Startpfad, und er ist ausgerechnet in der Welle nicht prüfbar, in der er
gebraucht wird. **Zu messen in einer portfreien Welle:** einmal mit belegtem Port fahren und die
Meldung lesen.

---

### 30.7 Der Rest von A-A-56 — er trägt, und hier ist der Satz, der ihn trägt

domain-dev hat ihn in T-225 benannt statt ihn zu verschweigen, und die Frage ist an mich gegangen.
Die Antwort lautet: **Ja, der Rest ist tragbar. Er bleibt benannt, und er bekommt keine weitere
Auflage.** Dieser Absatz ist der Satz, den der nächste Prüfer lesen soll, bevor er ihn für ein
Versehen hält.

**Der Rest.** Wer ein Kettenglied **entfernt** und im selben Zug einen Endpunkt unter `ALL` auf
`/*` legt, ergibt wieder die Zahl zehn und wieder die Form `/*`. Beide Sätze von A-A-56 bleiben
grün.

**Erstens: A-A-56 fängt das nicht, und sie soll es nicht fangen.** Die Zahl ist ein Wächter gegen
eine **Route, die dem Leser entgeht** — gegen `if (route.method === 'ALL') continue;`, den Filter,
der T-206-1 und T-223-1 möglich gemacht hat. Sie ist kein Wächter gegen ein **Kettenglied, das
jemand entfernt**. Das zweite ist keine Frage einer Aufstellung, sondern des Verhaltens: Ein
fehlender Herkunftswächter, ein fehlender Tokenwächter, eine fehlende `Host`-Prüfung sind an einer
**Antwort** erkennbar und nicht an einer Zahl. Gemessen wird das an den Läufen, die den Dienst
fahren — `proof:access` (**106/0**) und `proof:route-policy` (**43/0**) —, und dort gehört es hin.
Wer die Zahl zum Wächter über die Kettenglieder macht, verlegt eine Verhaltensfrage in einen
Zeichenvergleich; das ist genau der Fehler, gegen den B-2.10 geschrieben ist.

**Zweitens: die Reichweite des getarnten Sammelpfads ist gemessen — und dieser Absatz war zu
milde.** *Berichtigt in T-241 (2026-09-06); die Zahlen stehen in 32.2, hier steht, was von dem Satz
bleibt.* Zweimal unabhängig — von mir in 29.2.2 und von domain-dev in T-225 — antwortet ein
`ALL`-Eintrag auf `/*` dem **Add-in-Token mit 401** und nur dem **Sitzungsgeheimnis** mit 200.
**Das gilt für einen Eintrag, der hinter der Kette liegt** (im Teilbaum `api`, nach
`credentialPolicy`) — und **genau den fängt A-A-56 ohnehin an der Zahl**. Für den Rest, um den es
hier geht, gilt es **nicht**: Der Rest ist der **Tausch**, und ein getauschtes Kettenglied liegt
**in** der Kette. Nachgemessen im Spiegel, `app.fetch`, unveränderter Nachweisstand:

| Tausch an | ohne jeden Nachweis | fremde Herkunft (`Origin: https://boese.example`) | fremder `Host` |
|---|---|---|---|
| Stelle 6 der zehn (`contentTypeGuard`) | **200** | 403 `origin_not_allowed` | 403 `host_not_allowed` |
| **Stelle 1 der zehn (`securityHeaders`)** | **200** | **200** | **200** |
| Vergleich: `/api/v1/todos`, keine Änderung | 401 `unauthorized` | — | — |

**Der Grund ist die Reihenfolge, und sie steht bereits als Satz in `app.ts`: „Reihenfolge ist
Inhalt".** Ein getauschtes Glied **antwortet**, statt durchzureichen; damit laufen für seinen Pfad
alle Glieder dahinter nicht mehr. Ein Tausch an Stelle *k* schaltet für diesen einen Pfad
**11 − *k*** Wächter ab. An Stelle 1 sind das alle zehn — und dann ist der getarnte Pfad aus **jeder
Webseite im Browser des Benutzers** erreichbar, also genau die Klasse, die `CLAUDE.md` als die
wahrscheinlichste echte Lücke dieser Architektur benennt. Der Satz „die Reichweite ist klein" gilt
für den **hinzugefügten** Eintrag; für den getauschten ist er falsch.

**Was von diesem Absatz trägt:** Der Rest verlangt weiterhin **zwei** Änderungen in **derselben**
Datei (`apps/local-api/src/app.ts`), von denen die erste eine Sicherheitsschicht entfernt. Das ist
die richtige Beobachtung — aber sie macht den Rest nicht klein, sondern **überprüfbar**, und genau
daraus wird in 32.2 eine Auflage (**A-A-69**), die keine Aufstellung von Pfaden ist.

**Drittens, und das ist der Teil, der ohne Begründung wie ein Versehen aussieht: die
Durchgriffsprobe aus 29.2.4 wird ausdrücklich nicht zur Bedingung gemacht.** Das ist kein
Vergessen und keine Bequemlichkeit, sondern ein **gemessenes** Ergebnis. In T-223 habe ich sie
gefahren: Jeden `ALL`-Eintrag in einen nirgends registrierten Pfad übersetzen und mit gültigem
Nachweis aufrufen — die zehn Kettenglieder antworten 404 (sie reichen durch), drei der vier
Endpunktformen antworten 200 (sie werden gefangen). **Die vierte nicht:** Ein Endpunkt, dessen
Handler einen Datensatz nachschlägt und für eine erfundene Kennung 404 antwortet, ist von einem
Kettenglied nicht zu unterscheiden — obwohl derselbe Endpunkt mit einer echten Kennung 200 samt
Rumpf liefert. **Eine Bedingung, die falsch negativ ist und dabei jeden Lauf um einen Dienststart
teurer macht, ist schlechter als eine Hilfe, die man bewußt zieht.** Wer sie zur Bedingung machen
will, löst zuerst diesen Fall; solange er offen ist, wäre die Verschärfung eine Zusicherung, die
ihre eigene Vorbedingung nicht prüft — und damit ausgerechnet ein Verstoß gegen A-A-60.

*Nachgetragen T-241 (2026-09-06), und diesmal mit dem Fall statt mit dem Argument:* Der getarnte
Sammelpfad aus 32.2 ist selbst der zweite falsch negative Fall. Sein Glied lautet
`(c, next) => (c.req.path.endsWith('/leak') ? c.json(…) : next())` — für jeden **nirgends
registrierten** Pfad reicht es durch, und die Durchgriffsprobe hielte es für ein Kettenglied,
während es auf seinem einen Pfad 200 samt Rumpf liefert. **Die Probe kann einen getarnten Pfad
nicht finden, weil sie ihn raten müßte.** Punkt drei gilt damit unverändert, und er gilt jetzt aus
zwei gemessenen Gründen statt aus einem.

**Was stattdessen gilt.** Der Rest steht als benannter Rest in diesem Papier und in A-A-56 unter
„als Hilfe, nicht als Bedingung". Wer die Zahl `MIDDLEWARE_COUNT` **senkt**, sagt im selben Zug,
welches Kettenglied wegfällt und warum — das ist keine Prüfregel, sondern eine Reviewfrage, und
sie ist bei einer Zweizeilenänderung an der Vertrauensgrenze die richtige Stelle.

---

### 30.8 Befunde

| Nr. | Stufe | Befund | Zuständig |
|---|---|---|---|
| **T-230-1** | **muß** | **`proof:callers` sagt „ok", wenn er 0 Dateien durchgesehen hat.** Die Zahl der eingesammelten Dateien steht im Namen der Zusicherung und in keiner Bedingung. Gemessen: Sammler verstümmelt → **45/0, Code 0**, Zeile „`fetch` steht nur in api/client.ts (**0 Dateien durchgesehen**)"; dasselbe für den Add-in-Sammler. **Die sechs Gegenproben aus A-A-40 können das strukturell nicht sehen**, weil `proveFetchGuard` die eingesetzte Datei der **Liste** hinzufügt (`[...files, { name: INJECTED, source }]`) und damit das Sieb prüft, nie die Ernte. Betrifft die Vorbedingung von 41 der 45 Zeilen. Gegenmittel: **A-A-61**. | domain-dev |
| **T-230-2** | **muß** | **Ein zweiter Weg zum Dienst über den Namensraum ist für beide Wächter unsichtbar.** `/(?<![\w.])request\s*[<(]/` — zeichengleich der Ausdruck, den derselbe Lauf zwanzig Zeilen darüber als blind ausweist und für `fetch` seit T-188 ersetzt hat; für `request` steht er unverändert und hat **null** Gegenproben. Gemessen: `import * as client …; client.request('/todos/…', { method: 'DELETE' })` in einer Ansicht → **45/0, Code 0**; benannte Einfuhr → **44/1, Code 1** mit Dateinamen. `request` ist exportiert (`apps/web/src/api/client.ts`), der Weg benutzt das erlaubte `fetch` und geht an Abschnitt 2 bis 5 vorbei. Gegenmittel: **A-A-62**. | domain-dev |
| **T-230-3** | soll | **Der Sammler sieht `.ts` und `.tsx`; der Bündler löst fünf Endungen mehr auf.** Dieselbe Kunstquelle in sieben Schreibweisen: `.tsx`/`.ts` → **44/1, Code 1**; `.jsx`, `.js`, `.mts`, `.cts`, `.mjs` → je **45/0, Code 0**, und die Zahl bleibt bei 117 stehen. Gegenmittel: **A-A-61**, zweiter Satz. | domain-dev |
| **T-230-4** | **muß** | **`proof:tags` Abschnitt 1 vergleicht dreißig Namen über null Zeilen.** Die Zahl im Text kommt aus `NAMES.length`, die Schleife läuft über `rows`; verglichen werden sie nie. Gemessen: Leser sieht keine Zeile → **16/0, Code 0**, beide Zeilen grün; Vorlagen gelangen nicht in den Bestand → **15/1**, Abschnitt 1 grün, rot wird Abschnitt 2 mit dem falschen Grund. Das Gegenmittel steht zwei Abschnitte weiter im selben Lauf (`after.length === 6`). Gegenmittel: **A-A-63**. | domain-dev |
| **T-230-5** | **muß** | **`proof:conflicts` prüft, daß *eine* Verletzung eintritt, nicht daß es *die benannte* ist.** `raw` trägt den Indexnamen und geht in keine Bedingung. Gemessen: der Block `ux_tag_name` mit kollidierendem Schlüssel → SQLite meldet `index 'ux_tag_name_key'`, alle vier Zeilen grün, Lauf **61/0, Code 0**; zwei der vierzehn Blöcke messen denselben Index, einer gar keinen. Der Abschnitt benennt genau diese Gefahr drei Blöcke früher für den **Übersetzer** und sichert dort sogar seine Gegenprobe gegen die leere Menge — bei der **Provokation** fällt sie aus. Behebung: `raw.includes(indexName)`. Gegenmittel: **A-A-64**. | domain-dev |
| **T-230-6** | soll | **`proof:db-permissions` Abschnitt 1 und 3 messen die `umask`, nicht das `chmod`.** Die Vorbedingung „weite `umask`" wird gesetzt und nie gemessen. Gemessen: Maßnahme aus + weite `umask` → **6/5, Code 1** (Zähne belegt); Maßnahme aus + enge `umask` (`0o077`) → **10/1**, Abschnitt 1 dreimal **grün**, Abschnitt 3 **grün**, rot allein Abschnitt 2. **Berichtigung:** Der Kopf der Datei sagt „Abschnitt 1 und 2"; es ist Abschnitt 2. Behebung: eine Zeile `process.umask() === 0o000`. Gegenmittel: **A-A-65**. | domain-dev |
| **T-230-7** | Feststellung | **Sechs Erwartungen haben sich nicht bestätigt** (30.5), darunter `proof:conflicts` Abschnitt 1, der A-A-60 in drei Formen und im Wortlaut trägt („kein Wurf — die Vorbedingung stimmt nicht"), und `proof:db-permissions` Abschnitt 2, die sauberste Vorbedingungsmessung dieses Baums. **Drei Vorhersagen (30.6) sind portbedingt ungemessen** und stehen als Erwartung mit ihrer Verstümmelung da. | — |

### 30.9 Neue Auflagen

| Auflage | Was zu tun ist | Wie geprüft wird |
|---|---|---|
| **A-A-61** | `proof:callers` bekommt in Abschnitt 1 und 7 die Untergrenze, die seine Zusage voraussetzt, **vor** der Zusage: Der Sammler hat eine benannte Mindestzahl an Dateien eingesammelt, **und** die Datei, um die es geht (`api/client.ts`), ist nachweislich darin — eine Zahl allein ließe einen Sammler durch, der irgendetwas sammelt. Zweiter Satz: Die Endungen werden auf die erweitert, die der Bündler auflöst (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, `.cjs`), oder die Beschränkung wird als **gemessene** Zusage geführt („in diesen Bäumen gibt es keine solche Datei"). | In beide Richtungen: unveränderter Baum **45/0**, kein falscher Alarm; Sammler verstümmelt → **rot, Code 1**, und die Meldung nennt die gemessene Zahl; die Kunstquelle aus 30.1.3 in `.js` → **rot** mit Dateinamen. |
| **A-A-62** | Die Zusage „`request(` steht nur in `api/endpoints.ts`" wird mit derselben Bauart gemessen wie die `fetch`-Zusage seit T-188: eine Regel, die den Zugriff über Namensraum, `globalThis.`, `window.`, `self.` und eine Zerlegung mitsieht, und **eigene Gegenproben** nach dem Muster von `FETCH_FORMS` — fünf Schreibweisen, die gefunden werden müssen, und eine harmlose, die nicht anschlagen darf. Ein Ausdruck, den derselbe Lauf zwanzig Zeilen darüber als blind ausweist, darf nicht in seiner Zwillingszeile stehenbleiben. | In beide Richtungen: unveränderter Baum **45/0**; die Kunstquelle aus 30.1.2 (`client.request(…)`) → **rot, Code 1**, Meldung nennt `app/Zweitweg.tsx`; die benannte Einfuhr bleibt rot wie heute; kein falscher Alarm auf Prosa und auf `options.request(`-artige Portaufrufe. |
| **A-A-63** | `proof:tags` Abschnitt 1 vergleicht die **gemessene** Zeilenzahl mit der **erwarteten**, bevor er über die Schlüssel urteilt: `rows.length === NAMES.length` als Bedingung derselben Zeile oder als eigene Zeile davor. Die Bauart steht zwei Abschnitte weiter im selben Lauf. | In beide Richtungen: unveränderter Baum **16/0** im Schnitt der Abschnitte 1 bis 3 (voller Lauf unverändert); Leser sieht keine Zeile → **rot, Code 1**; Vorlagen gelangen nicht in den Bestand → **rot in Abschnitt 1**, nicht erst in Abschnitt 2. |
| **A-A-64** | `provoke` in `proof:conflicts` prüft, daß die eingetretene Verletzung **die benannte** ist. Der Wert liegt bereits vor: `raw` enthält die Meldung von SQLite. Eine Bedingung mehr in einer Zeile, die es gibt. | In beide Richtungen: unveränderter Baum **61/0** im Schnitt von Abschnitt 1 (voller Lauf unverändert); die Kunstquelle aus 30.3 (`nameKey('Alpha')` als Schlüssel im `ux_tag_name`-Block) → **rot, Code 1**, und die Meldung nennt beide Indexnamen. |
| **A-A-65** | `proof:db-permissions` mißt seine eigene Vorbedingung: Die `umask` dieses Laufs ist weit, geprüft **vor** Abschnitt 1. Und der Kopf der Datei wird berichtigt — es ist **Abschnitt 2**, der das `chmod` mißt. | In beide Richtungen: unveränderter Baum **11/0** im Schnitt der Abschnitte 1 bis 3; `process.umask(0o077)` statt `0o000` → **rot, Code 1**, Meldung nennt den gemessenen Wert. Zusätzlich M1 und M2 aus 30.4 als Beleg, daß die Abschnitte danach das `chmod` messen. |

### 30.10 Urteil dieser Prüfung

**Nacharbeit.** Vier Befunde der Stufe **muß**, zwei der Stufe **soll**, eine Berichtigung, eine
Feststellung. Fünf neue Auflagen, alle fünf in `apps/local-api/scripts/**`, keine berührt
Produktivcode.

**Zum Rest von A-A-56: er trägt** (30.7). Der Satz, der ihn trägt, steht dort ausgeschrieben,
einschließlich der Begründung dafür, warum die Durchgriffsprobe keine Bedingung wird — sie ist
**gemessen** falsch negativ, und sie zur Bedingung zu machen wäre selbst ein Verstoß gegen A-A-60.

**Zur Bilanz an dieser Frage.** Achtmal in acht Wellen war die Antwort auf dieselbe Frage „ja",
und diesmal in vier Läufen von vier. Bemerkenswert ist nicht mehr, **daß** es Befunde gibt,
sondern **wo** sie sitzen: nicht in nachlässigen Läufen, sondern jedesmal einen Schritt neben
einer Sorgfalt, die derselbe Lauf an anderer Stelle vorbildlich übt. `proof:conflicts` sichert
seine Gegenprobe gegen die leere Menge und läßt die Provokation ungeprüft. `proof:tags` zählt in
Abschnitt 3 jede Zeile und in Abschnitt 1 keine. `proof:db-permissions` mißt in Abschnitt 2 die
Wirkung und in Abschnitt 1 den Zustand. Und `proof:callers`, der Lauf mit **zwei**
Selbstprüfungsabschnitten, hat eine Selbstprobe, die ihre eigene Ernte umgeht.

**Der Satz dieser Prüfung.** Eine Selbstprobe, die den Prüfgegenstand an der Sammelstelle vorbei
einspeist, prüft den Prüfer und nicht die Prüfung. Sie ist deshalb nicht wertlos — sie hat in
T-188 vier echte Lücken gefunden —, aber sie ist keine Antwort auf die Frage, ob der Lauf weiß,
wann er blind ist. **Sie ist der Grund, warum er es nicht weiß.**

---

## 31. Prüfung T-234 (2026-09-06) — drei Vorhersagen am freien Port, die fehlende Gegenprobe aus zwei Wellen, und eine Auflage, die für ihren eigenen Fall falsch war

**Auftrag.** Vier Punkte, und alle vier hängen an derselben Bedingung: **der Port war in dieser
Welle frei** (E-083 Punkt 2, kein e2e-Lauf). **Erstens** die drei Vorhersagen V-1 bis V-3 aus 30.6,
die ich aufgeschrieben habe, **weil** ich sie nicht messen konnte. **Zweitens** die zweite
Gegenprobe zu T-223-5, die seit zwei Wellen fehlt und die kein grüner Lauf ersetzt. **Drittens**
zwei Bestätigungen an gebauter Arbeit (O-KK und O-KL aus T-231). **Viertens** die vier Läufe aus
T-231 nachfahren, mit den vier Gegenproben, die der Erbauer selbst als die entscheidenden nennt.

### 31.0 Stand der Werkzeuge, was gemessen wurde und was nicht

**Guardian und 42Crunch: vierzehntes Mal ohne Werkzeug** (E-079 Punkt 3, nicht erneut versucht;
30.0 zählte das dreizehnte). Der Grund ist seit T-230 kein Termin mehr, sondern eine Antwort des
Auftraggebers: **es gibt keinen Zugang**. Damit gilt unverändert und mit jeder Welle schwerer:
**Die Aussage über die OpenAPI-Beschreibung ruht dauerhaft auf `proof:openapi`** — einem Lauf, in
dem T-206 zwei von vier Befunden gefunden hat. Ein zweites, fremdes Augenpaar auf dieselbe Datei
wird es nicht geben. Der einzige Ersatz ist, die eigenen Läufe gegen Verstümmelungen zu fahren;
diese Prüfung ist die neunte Anwendung dieses Ersatzes.

**`proof:all` nicht gefahren** (Auftrag, E-083 Punkt 3).

**Der Port war frei.** Alle Läufe sind **vollständig** gefahren, kein Schnitt, keine Vorhersage.
Zusätzlich ist er in dieser Prüfung einmal **absichtlich belegt** worden — das ist die Messung V-3.

**Eine Grenze halbiert sich, und sie gehört hierher berichtigt.** Der Satz „von drei
ausgelieferten Erzeugnissen sind zwei in ihrer Engine ungemessen" stimmt so nicht mehr: `Xvfb` und
`python3-gi` mit `WebKit2 4.1` stehen auf diesem Rechner, und die Engine-Familie des
Linux-Erzeugnisses ist damit gemessen — zeichengleiche Bänder wie in Chromium. Es bleibt
**macOS/WKWebView ungemessen**, und gemessen ist die **Engine-Familie**, nicht die gebaute
Binärdatei. Die Grenze ist kleiner geworden; verschwunden ist sie nicht.

**Gemessen wurde am Verhalten, außerhalb des Bestands** — wie in T-176, T-183, T-189, T-206, T-223
und T-230. Der Spiegel liegt unter `/tmp/t234/root` und trägt die Gestalt des Arbeitsbereichs:
`apps/local-api`, `apps/web`, `apps/outlook-addin` und `packages` als Kopien, `node_modules` als
Verweis auf den echten. Alle Verstümmelungen — auch die drei in **Produktivcode** (`routes/todos.ts`,
`usecases/todos.ts`, `packages/storage/.../database.ts`) und die eine **neue Datei**
(`src/access/verifier-match.ts`) — sind ausschließlich im Spiegel entstanden und mit ihm gelöscht.

**Zeichengleichheit doppelt belegt.** `diff -rq` über `apps/local-api/src`,
`apps/local-api/scripts`, `packages`, `apps/web/src` und `apps/outlook-addin/src` nach der letzten
Messung **ohne Unterschied**, und eine Prüfsumme über alle `ok`/`FEHL`-Zeilen vor der ersten und
nach der letzten Verstümmelung:

| Lauf | vorher | nachher | Zahlen |
|---|---|---|---|
| `proof:callers` | `1597254575` | `1597254575` | **56/0** |
| `proof:tags` | `689993371` | `689993371` | **43/0** |
| `proof:conflicts` | `2545999469` | `2545999469` | **154/0** |
| `proof:db-permissions` | `197552816` | `197552816` | **18/0** |
| `proof:access` | `3048530334` | `3048530334` | **106/0** |

`proof:callers` ist zusätzlich **im Bestand selbst** gefahren, portfrei: **56/0, Code 0**. Der
Spiegel bildet also nicht nur sich selbst ab. Der versionierte Bestand führt weder `verifier-match`
noch `unter/` noch `t234`.

---

### 31.1 Die zweite Gegenprobe zu T-223-5 — nachgeholt, und sie trägt in beide Richtungen

Sie fehlt seit zwei Wellen (29.4.4: „ließ sich nicht fahren — Port belegt"), und ich habe sie
zweimal ausdrücklich **nicht** für erledigt erklärt, obwohl `proof:access` längst mit 106/0
vollständig läuft: **das ist eine Gegenprobe und kein grüner Lauf.** Jetzt ist sie gefahren.

**Die Umgliederung.** `verifier.ts` in zwei Dateien aufgeteilt — der Vergleich zieht nach
`src/access/verifier-match.ts`, `verifyCredential` ruft ihn dort. Genau der Fall, den A-A-59
benennt: nicht eine Aufstellung, die durch Nachlässigkeit veraltet, sondern eine **gewöhnliche
Umgliederung**, nach der es eine Datei mehr gibt.

| Zustand | Lauf | Code | Die Zeile |
|---|---|---|---|
| Bestand | **106/0** | 0 | `ok Kein === auf Tokenmaterial im Nachweispfad` |
| Aufspaltung, Vergleich **verhaltensneutral** in der neuen Datei | **105/1** | **1** | `FEHL Kein === auf Tokenmaterial im Nachweispfad — src/access/verifier-match.ts:28: const gleich = presented === secret;` |
| dieselbe Aufspaltung, gemessen gegen die **Fassung von T-223** (die vier Dateien als Aufstellung) | **106/0** | 0 | `ok Kein === auf Tokenmaterial im Nachweispfad` |

Die dritte Zeile ist der Beleg, den 29.4.4 offenlassen mußte: **Die alte Fassung hätte diese
Umgliederung nicht gesehen** — und zwar auch dann nicht, wenn man ihr die Vorbedingung von heute
gegeben hätte, denn vier durchsuchte Dateien sind „mindestens vier". Die gebaute Fassung sieht sie
und nennt Datei und Zeile.

**Nebenbefund, und er ist der wertvollste Teil dieser Messung.** Die erste, nicht
verhaltensneutrale Fassung derselben Umgliederung war kein Stilfehler, sondern ein **echter
Umgehungsweg**: Die neue Datei enthielt die naheliegende Bequemlichkeit
`if (presented === secret) return { addin: 1, session: 0 };`. Gemessen an der Funktion selbst,
ohne HTTP:

```
kein Token, kein Add-in-Token eingerichtet: {"ok":true,"kind":"addin"}
leeres Token, kein Add-in-Token eingerichtet: {"ok":true,"kind":"addin"}
kein Token, Add-in-Token eingerichtet:       {"ok":false}
falsches Token:                              {"ok":false}
```

Solange **kein** Add-in-Token eingerichtet ist — der Zustand jeder frischen Installation —
authentifiziert eine Anfrage **ohne jeden Nachweis**. `proof:access` fängt diese Fassung dreifach:
**103/3, Code 1**, die statische Zeile aus Abschnitt 13 und zusätzlich zwei Verhaltenszeilen aus
Abschnitt 3 (`Ohne Token: 401`, `Beide 401-Antworten sind zeichengleich`). Das ist der Grund,
warum B-2.5 keine Stilregel ist: Die verbotene Zeile und der Umgehungsweg sind dieselbe Zeile.

**Urteil zu A-A-59: erfüllt, in beiden Richtungen abgenommen.** Unveränderter Baum 106/0, kein
falscher Alarm; beide Gegenproben rot mit Code 1 und mit Datei und Zeile in der Meldung.

#### 31.1.1 Und ein Rest, der aus derselben Messung fällt — die Untergrenze sagt nichts

Die Vorbedingung von Abschnitt 13 lautet gebaut:

```js
check(
  `Der Nachweispfad ist vollständig durchsucht — ${scanned.length} Dateien unter ${scanRoots.join(' und ')} (A-A-59)`,
  scanned.length >= TRAGENDE_DATEIEN.length && fehlend.length === 0,
  …
);
```

`TRAGENDE_DATEIEN` hat **vier** Einträge. Die Untergrenze ist damit „mindestens die vier, die
ohnehin einzeln geprüft werden" — sie schützt gegen die **leere** Ernte und gegen **nichts
darüber hinaus**. Das ist genau die Lücke, die A-A-61 für `proof:callers` mit einer **benannten**
Zahl (100 und 25, bei 117 und 31) geschlossen hat.

Gemessen, mit einer realistischen Regression statt einer erfundenen: `src/access` bekommt einen
Unterordner (`src/access/unter/verifier-match.ts` mit derselben verbotenen Zeile), und aus dem
Sammler fällt **ein Wort**:

| Sammler | Lauf | Code | Die Zeile |
|---|---|---|---|
| `readdirSync(…, { recursive: true, … })` | **105/1** | **1** | nennt `src/access/unter/verifier-match.ts:28` |
| `recursive: true` entfernt | **106/0** | **0** | `ok Der Nachweispfad ist vollständig durchsucht — 16 Dateien …` |

Der Lauf sagt „**vollständig** durchsucht" über sechzehn von siebzehn Dateien und übersieht dabei
die einzige, auf die es ankommt. **Gegenmittel: A-A-68.**

---

### 31.2 V-1 — bestätigt, und härter als vorhergesagt: die Regel darf fehlen, die Zeile bleibt grün

**Die Vorhersage** (30.6): Eine Kunstquelle, die die Anfrage aus einem anderen Grund auf 422
bringt, läßt beide Zeilen von `proof:tags` Abschnitt 9 grün.

**Die Kunstquelle.** `.padEnd(600, '!')` an den beiden Titeln der Anfragen — 600 Zeichen gegen
`MAX_TITLE_CHARACTERS = 500`. Die Anfrage scheitert damit an der Eingabeprüfung, bevor irgendetwas
über Tagnamen entschieden wird.

| Zustand | Lauf | Code | Abschnitt 9 |
|---|---|---|---|
| Bestand | **43/0** | 0 | beide grün |
| **Kunstquelle** (langer Titel) | **43/0** | **0** | **beide grün** |
| **Produktivregel entfernt** (`z.array(nameSchema).max(50)` → `.max(500)`) **und** Kunstquelle | **43/0** | **0** | **beide grün** |
| Produktivregel entfernt, Lauf **unverändert** | **42/1** | **1** | `FEHL mehr als fünfzig Namen werden abgewiesen — Status 201` |

Die dritte Zeile ist der Befund, und sie geht über die Vorhersage hinaus: Es bleibt nicht bei
„die Zusicherung sagt mehr, als sie mißt". **Die bewachte Regel des Produkts ist weg — Takt nimmt
51 Tagnamen mit 201 an —, und der Lauf sagt 43/0, Code 0.** Die vierte Zeile belegt, daß die
Zusicherung Zähne hat; die Kunstquelle zieht sie.

Der Nachbarabschnitt 8 macht es im selben Lauf richtig:
`(ambiguous.body?.error?.details ?? []).some((entry) => entry.code === 'tag_name_ambiguous')`.
**Gegenmittel: A-A-66.**

---

### 31.3 V-2 — bestätigt, und es ist die achte Stelle aus T-047

**Die Vorhersage** (30.6): Eine Kunstquelle, die den Fehlschlag **vor** die Tag-Anlage legt, läßt
alle drei Zeilen von Abschnitt 5 grün, und die Zusage über die gemeinsame Transaktion steht dann
über der leeren Menge.

**Die Kunstquelle.** Statt `statusId: 'gibt-es-nicht'` (scheitert **in** der Transaktion, nach der
Tag-Anlage) ein Titel mit 600 Zeichen (scheitert **vor** ihr). Die erste Zeile des Abschnitts
(`doomed.status >= 400`) bleibt erfüllt.

**Die Verstümmelung des Produkts.** `createTodo` legt die Tags in einer **eigenen** Klammer an:

```ts
const vorab = await context.transactions.inTransaction(async (eigen) =>
  resolveTagNames(eigen, names.value, timestamp),
);
```

Damit überlebt das Tag den Fehlschlag des Todos — genau der Fall, gegen den A-7 und die achte
Stelle aus T-047 geschrieben sind.

| Zustand | Lauf | Code | Abschnitt 5 |
|---|---|---|---|
| Bestand | **43/0** | 0 | drei Zeilen grün |
| **Kunstquelle** | **43/0** | **0** | **drei Zeilen grün** |
| **Transaktion gebrochen**, Lauf unverändert | **41/2** | **1** | `FEHL das Tag der gescheiterten Anfrage gibt es nicht — ["backend","rücklauf"]`, `FEHL und es ist überhaupt kein Tag hinzugekommen — 1 vorher, 2 nachher` |
| **Transaktion gebrochen** und **Kunstquelle** | **43/0** | **0** | **drei Zeilen grün** |

Die letzte Zeile ist der Befund in seiner schärfsten Form: **Die gemeinsame Transaktion ist offen,
ein Vokabular aus einem Fehlschlag bleibt im Bestand stehen — und der Lauf sagt 43/0, Code 0.**

**Zwei Ehrlichkeiten dazu.** Erstens war meine erste, gröbere Fassung der Verstümmelung (die
eigene Klammer **außerhalb** der Fehlerbehandlung) zusätzlich in Abschnitt 8 rot — nicht wegen
Abschnitt 5, sondern weil `AbortTodoCreate` dort an der Übersetzung vorbeilief (500 statt 422).
Deshalb steht oben die feinere Fassung, bei der **nur** Abschnitt 5 rot wird. Zweitens: Der
Unterschied wäre an der **Fehlerkennung** der Antwort erkennbar, nicht an der Zahl — dieselbe
Bauart, die A-A-66 verlangt. **Gegenmittel: A-A-67.**

---

### 31.4 V-3 — widerlegt: der Satz stimmt, und jetzt ist er gemessen

**Die Vorhersage** (30.6): `proof:db-permissions` Abschnitt 4 hat als einziger der drei keine
Portmeldung, sondern eine **Annahme im Kommentar** — „Verzeichnis, Datenbank und Migration
entstehen im Start **vor** dem Binden". Stimmt der Satz, ist alles gut; stimmt er nicht, wird der
Lauf bei belegtem Port rot mit der falschen Begründung.

**Gemessen mit einem eigenen Lauscher auf `127.0.0.1:17843`:**

| Lauf, Port belegt | Ergebnis |
|---|---|
| `proof:db-permissions` (voll) | **18/0, Code 0**, in 0,68 s — Abschnitt 4 sechs Zeilen grün |
| `proof:tags` (zum Vergleich) | **Code 1**: `FEHLER: Auf 127.0.0.1:17843 lauscht bereits etwas, auch nach 5 s Warten. Läuft Takt oder ein anderer Prüfpfad noch?` |

**Der Startpfad selbst, einzeln gemessen** (Dienst mit belegtem Port gestartet): Verzeichnis
`0700`, `takt.db` `0600`, `takt.db-wal` `0600` — **alle drei vorhanden** —, dann
`{"level":"error","message":"Der Port 17843 ist belegt. Takt startet nicht und weicht nicht auf
einen anderen Port aus.","reason":"port_in_use port=17843"}` und **Exitcode 74**. Die Reihenfolge
ist im Bestand auch strukturell nachlesbar: `ensureDirectory` (`main.ts:179`), Migration (`:234`),
`server.listen` (`:405`).

**Und die zweite Hälfte der Vorhersage ist halb falsch.** Ich hatte geschrieben, der nächste Leser
suche dann „an den Dateirechten". Gemessen (Wartepfad des Laufs künstlich auf eine Datei gelenkt,
die nie entsteht, Port belegt): Die **Überschrift** ist tatsächlich falsch — `FEHL der Dienst legt
seinen Bestand an` —, aber der **Beleg** derselben Zeile trägt den wahren Grund im Klartext, weil
der Lauf `stderr.slice(-300)` als Detail mitgibt: `…"reason":"port_in_use port=17843"`. Der Leser
wird also nicht in die Irre geschickt, sondern nur der Zeilentitel. **Kein Befund, eine
Feststellung** — und der Kommentar in Abschnitt 4 ist ab jetzt keine Annahme mehr, sondern
gemessen (dieser Absatz ist der Beleg).

---

### 31.5 O-KK — bestätigt, und der Fund geht gegen meine eigene Auflage

**Die Frage** (T-231, Offene Frage 1): A-A-64 nennt als Behebung wörtlich `raw.includes(indexName)`.
domain-dev hat gemessen, daß der eine Indexname **Teilzeichenkette** des anderen ist, und statt
dessen einen **ganzen** Namensvergleich in beiden Gestalten der Datenbank gebaut — zwei Zeilen
mehr, als die Auflage sagt.

**Erstens: die Teilzeichenketten-Beziehung mißt der Lauf selbst**, seit T-231 als eigene Zeile:

```
ok    es gibt überhaupt einen Indexnamen, der in einem anderen steckt (ux_tag_name)
```

**Zweitens: die Auflage ist in ihrem Wortlaut nicht nur zu schwach, sie ist unbrauchbar.** Ich habe
sie wörtlich gebaut — `translated !== null && raw.includes(indexName)` in `provoke`, sonst nichts —
und gemessen:

| Zustand | Lauf | Code | `ux_tag_name`-Block |
|---|---|---|---|
| **A-A-64 wörtlich**, unveränderter Baum | **126/7** | **1** | grün |
| **A-A-64 wörtlich** + Kunstquelle aus 30.3 | **126/7** | **1** | **vier Zeilen grün** |
| **gebaute Fassung** (ganzer Name) + Kunstquelle aus 30.3 | **150/1** | **1** | **rot**, mit beiden Indexnamen |

**Sieben Fehlalarme auf dem gesunden Baum.** SQLite nennt den Index in sieben der vierzehn Blöcke
gar nicht, sondern die Spalten — `UNIQUE constraint failed: todo_status.name`. Eine
Teilzeichenkettensuche darauf findet den Indexnamen nie, und die Meldung liest sich absurd:

```
FEHL  ux_todo_status_name: die Verletzung tritt ein — und es ist diese
      — UNIQUE constraint failed: todo_status.name → ux_todo_status_name, erwartet war ux_todo_status_name
```

**Und der gemeldete Fall bliebe grün.** Die zweite Zeile der Tafel ist die Bestätigung von O-KK:
Mit dem wörtlichen Bau ändert die Kunstquelle aus 30.3 **nichts** — 126/7 vorher wie nachher, der
`ux_tag_name`-Block viermal grün, obwohl `ux_tag_name_key` zugeschlagen hat. **Die Auflage hätte
den Fall nicht gefangen, für den sie geschrieben wurde.**

**Urteil: bestätigt. Der Bau löst A-A-64 ein und überschreitet sie nicht.** Der Wortlaut der
Auflage war falsch, nicht ihr Ziel; das Ziel („nicht *eine* Verletzung, sondern **die benannte**")
ist erfüllt. Die zwei Zeilen mehr sind der Preis dafür, daß SQLite zwei Gestalten hat und beide am
Baum vorkommen. **A-A-64 wird hiermit im Wortlaut berichtigt** (31.9, Berichtigung) — mit dem
Satz, den ich dort hätte schreiben müssen: *Verglichen wird der ganze Name; eine
Teilzeichenkettensuche ist an dieser Stelle selbst der Fehler.*

Der Erbauer hat außerdem die **Vorbedingung des Zuordners** mitgebaut (keine zwei eindeutigen
Indizes mit derselben Spaltenliste — `die Spaltenform ist eindeutig zuzuordnen (7 von 14 Indizes
nennen Spalten)`) und vier Proben darauf. Das ist A-A-60 angewandt, ohne daß eine Auflage es
verlangt hätte.

---

### 31.6 O-KL — beides aufgenommen: ein Befund ist größer, und ein Zwilling fehlt begründet

**Erstens: T-230-6 ist größer als beschrieben.** 30.4 nennt Abschnitt 1 und 3 als die, die unter M2
grün bleiben. Nachgemessen gegen den **gebauten** Stand (`secureDatabaseFiles` fällt aus,
`umask 0o077`):

| Abschnitt | Zeilen | unter M2 |
|---|---|---|
| 0 (neu, A-A-65) | 1 | **rot** — `die umask dieses Laufs ist weit (0000) — gemessen: 0077 — Abschnitt 1, 3 und 4 messen dann die umask und nicht das chmod` |
| 1 | 5 | **grün** |
| 2 | 2 | **rot** — `nach dem Öffnen liegt sie mit 0600 — 0644` |
| 3 | 4 | **grün** |
| **4** | **6** | **grün** |

Lauf **16/2, Code 1**. **Drei von vier Abschnitten messen unter M2 den Zustand statt der Wirkung**,
nicht zwei. Der Befund verschiebt sich dadurch nicht — er wird größer, und die Behebung ist
dieselbe. Bemerkenswert: Die gebaute Meldung von Abschnitt 0 **nennt Abschnitt 4 bereits mit**; der
Erbauer hat die Vergrößerung in den Text des Laufs geschrieben, bevor sie hier stand. 30.4 gilt mit
dieser Ergänzung.

**Zweitens: kein Zwilling im Add-in — gemessen, nicht angenommen.** Die Frage lag nahe, ob
`proof:callers` Abschnitt 7 für `call(` dieselbe Lücke hat wie Abschnitt 1 für `request(`
(T-230-2). Nachgemessen:

- `call<` beziehungsweise `call(` kommt in **genau einer** Datei vor —
  `apps/outlook-addin/src/api/client.ts`, fünf Stellen, alle innerhalb von `createApiClient`
  (`const call` in Zeile 189, die Funktion beginnt in Zeile 186).
- **Keine Ausfuhr:** Unter den `export`-Zeilen dieser Datei steht kein `call`; die Bildschirme
  bekommen ein `ApiClient`-Objekt, keinen Modulexport.
- Außerhalb der Datei kommt das Wort nur in Prosa, in `className="badge badge--call"` und in
  `htmlFor="call"` vor — kein Zugriff, weder benannt noch über einen Namensraum.

**Der Satz gehört aufgeschrieben, damit ihn niemand für ein Vergessen hält:** Für `call` gibt es
keine zweite Regel, weil es keinen zweiten Weg gibt. Kommt eines Tages ein `export`
vor diese Funktion, entsteht der Zwilling von T-230-2 — dann ist A-A-62 die Vorlage.

---

### 31.7 Die vier Läufe aus T-231 nachgefahren, mit den vier entscheidenden Gegenproben

Jede Zahl eigenständig gemessen, keine übernommen.

| Lauf | T-231 sagt | gemessen | Code |
|---|---|---|---|
| `proof:callers` | 45/0 → **56/0** | **56/0** | 0 |
| `proof:tags` | 42/0 → **43/0** | **43/0** | 0 |
| `proof:conflicts` | 149/0 → **154/0** | **154/0** | 0 |
| `proof:db-permissions` | 17/0 → **18/0** | **18/0** | 0 |

**Die vier Gegenproben, die der Erbauer selbst als die entscheidenden nennt:**

| Gegenprobe | T-231 sagt | gemessen | Die Meldung |
|---|---|---|---|
| A-A-61: Sammler leer (`/\.KEINETREFFER$/`) | 54/2 | **54/2, Code 1** | `der Sammler hat mindestens 100 Dateien eingesammelt (0) — 0 statt mindestens 100 — der Sammler greift ins Leere`, dazu `die Ernte ist leer` |
| A-A-61: Sammler überspringt `api/` | 55/1 | **55/1, Code 1** | `mindestens 100 Dateien eingesammelt (114)` **grün**, `und api/client.ts und api/endpoints.ts sind darunter — nicht eingesammelt: api/client.ts, api/endpoints.ts` **rot** |
| A-A-64: Kunstquelle aus 30.3 | 150/1 | **150/1, Code 1** | `ux_tag_name: die Verletzung tritt ein — und es ist diese — UNIQUE constraint failed: index 'ux_tag_name_key' → ux_tag_name_key, erwartet war ux_tag_name` |
| A-A-64: Zuordner als Teilzeichenkettensuche | 149/2 | **149/2, Code 1** | `der Zuordner: ux_tag_name_key bleibt ux_tag_name_key — der Fall aus T-230-5 — ux_tag_name statt ux_tag_name_key`, dazu der `ux_tag_name_key`-Block |

**Alle vier Zahlen stimmen zeichengenau**, und die zweite Zeile ist die, auf die es ankommt: Sie
belegt den **zweiten Satz** von A-A-61 — eine Zahl allein ließe einen Sammler durch, der
irgendetwas sammelt. Hier sammelt er 114 Dateien und übersieht die eine, um die es geht.

**Abnahme A-A-61 bis A-A-65: erfüllt.** Dazu, außerhalb der vier: A-A-65 in beiden Richtungen
(31.6), A-A-63 und A-A-64 im **vollen** Lauf statt im Schnitt (die Schnitte trugen den Befund,
nicht die Abnahme), und A-A-59 aus der Welle davor (31.1).

---

### 31.8 Befunde

| Nr. | Stufe | Befund | Zuständig |
|---|---|---|---|
| **T-234-0** | **Abnahme** | **A-A-59 und A-A-61 bis A-A-65 sind erfüllt.** Alle vier Läufe eigenständig nachgefahren (56/0, 43/0, 154/0, 18/0), die vier entscheidenden Gegenproben zeichengenau bestätigt (54/2, 55/1, 150/1, 149/2), dazu A-A-59 mit der Gegenprobe, die zwei Wellen lang nicht zu fahren war. Kein falscher Alarm auf dem unveränderten Baum. | — |
| **T-234-1** | **muß** | **`proof:tags` Abschnitt 9 mißt „abgewiesen", nicht „abgewiesen weil" — und die bewachte Regel darf dabei fehlen.** Gemessen: langer Titel als Kunstquelle → **43/0, Code 0**, beide Zeilen grün; **zusätzlich mit entfernter Produktivregel** (`.max(50)` → `.max(500)`, Takt nimmt 51 Tagnamen mit 201 an) → **weiterhin 43/0, Code 0**. Zähne belegt: dieselbe Regel entfernt, Lauf unverändert → **42/1, Code 1** (`Status 201`). Der Nachbarabschnitt 8 macht es richtig. Gegenmittel: **A-A-66**. | domain-dev |
| **T-234-2** | **muß** | **`proof:tags` Abschnitt 5 zusichert die gemeinsame Transaktion und mißt eine Zahl.** Gemessen: Fehlschlag vor die Tag-Anlage gelegt → **43/0, Code 0**, alle drei Zeilen grün; **mit gebrochener Transaktion** (Tag-Anlage in eigener Klammer, Tag überlebt den Fehlschlag) **und** derselben Kunstquelle → **weiterhin 43/0, Code 0**. Zähne belegt: gebrochene Transaktion mit unverändertem Lauf → **41/2, Code 1**. Betroffen ist die achte Stelle aus T-047 (A-7). Gegenmittel: **A-A-67**. | domain-dev |
| **T-234-3** | soll | **Die Untergrenze von `proof:access` Abschnitt 13 ist die Länge der Liste, die ohnehin geprüft wird.** `scanned.length >= TRAGENDE_DATEIEN.length` heißt „mindestens vier" — sie schützt gegen die leere Ernte und gegen nichts sonst. Gemessen: verbotene Zeile in `src/access/unter/verifier-match.ts`; mit `recursive: true` → **105/1, Code 1** mit Datei und Zeile, **ein Wort entfernt** → **106/0, Code 0**, und die Zeile sagt „**vollständig** durchsucht — 16 Dateien". Dieselbe Klasse, die A-A-61 für `proof:callers` mit 100 und 25 geschlossen hat. Gegenmittel: **A-A-68**. | domain-dev |
| **T-234-4** | Berichtigung | **A-A-64 war in ihrem Wortlaut falsch, und zwar für ihren eigenen Fall.** `raw.includes(indexName)` liefert auf dem gesunden Baum **sieben** Fehlalarme (SQLite meldet dort die Spaltenform und nennt den Index nicht) und läßt den gemeldeten Fall aus 30.3 **grün** (126/7 mit und ohne Kunstquelle, `ux_tag_name`-Block viermal grün). Der gebaute ganze Namensvergleich in beiden Gestalten löst die Auflage ein und überschreitet sie nicht — **O-KK bestätigt**. Wortlaut berichtigt in 31.9. | — |
| **T-234-5** | Ergänzung | **T-230-6 ist größer als beschrieben: unter M2 bleibt auch Abschnitt 4 vollständig grün** (sechs Zeilen), also **drei von vier** Abschnitten statt zwei. Gemessen am gebauten Stand: **16/2, Code 1**, rot allein Abschnitt 0 und 2. **O-KL erster Teil bestätigt**; 30.4 gilt mit dieser Ergänzung. | — |
| **T-234-6** | Feststellung | **Kein Zwilling im Add-in — gemessen.** `call(`/`call<` steht in genau einer Datei (fünf Stellen, alle in `createApiClient`), wird nicht exportiert, und außerhalb kommt das Wort nur in Prosa, einer CSS-Klasse und einem `htmlFor` vor. Für `call` gibt es keine zweite Regel, **weil es keinen zweiten Weg gibt** — kein Vergessen. **O-KL zweiter Teil bestätigt.** | — |
| **T-234-7** | Feststellung | **V-3 ist widerlegt: der Satz im Kommentar stimmt.** Mit belegtem Port läuft `proof:db-permissions` **18/0, Code 0**; der Dienst legt Verzeichnis (0700) und Bestand (0600) an und scheitert danach am Binden (`port_in_use port=17843`, Exitcode 74). Halb widerlegt ist auch meine zweite Hälfte: Würde Abschnitt 4 doch rot, wäre der **Zeilentitel** falsch, aber der **Beleg** trägt den Grund im Klartext. | — |
| **T-234-8** | Feststellung | **Hygiene: `tmp-chrome.mjs` liegt unversioniert im Wurzelverzeichnis und ist nicht ignoriert.** Inhalt harmlos (sechs Zeilen Playwright-Abzug, keine Zugangsdaten, keine Kundendaten, keine Call-Nummer), aber ein `git add -A` nähme sie mit. Sie gehört nach `/tmp` oder in `.gitignore`. | Orchestrator |

### 31.9 Neue Auflagen

| Auflage | Was zu tun ist | Wie geprüft wird |
|---|---|---|
| **A-A-66** | `proof:tags` Abschnitt 9 prüft den **Grund** der Abweisung, nicht nur den Status: Neben `status === 422` steht die Fehlerkennung beziehungsweise der `details`-Eintrag der Antwort, nach dem Muster von Abschnitt 8 desselben Laufs (`entry.code === 'tag_name_ambiguous'`). Für beide Zeilen. | In beide Richtungen: unveränderter Baum **43/0**; `.max(50)` → `.max(500)` im Dienst → **rot, Code 1** in Abschnitt 9 (heute: 42/1 — das bleibt); dieselbe Anfrage mit zusätzlich überlangem Titel → **rot**, nicht grün. Die Zahlen aus 31.2 sind die Erwartung. |
| **A-A-67** | `proof:tags` Abschnitt 5 sichert seine eigene Vorbedingung: Der Fehlschlag muß **in** der Transaktion eintreten, nicht davor. Zwei tragfähige Formen, die Entscheidung gehört zum Bau: entweder die **Fehlerkennung** der Antwort wird geprüft (der Fall „Kanban-Spalte gibt es nicht" hat eine andere als eine Eingabeprüfung), oder es wird **positiv verankert** — das Tag ist während des Versuchs entstanden und danach wieder weg. Die zweite Form ist die genauere; die erste ist eine Zeile. | In beide Richtungen: unveränderter Baum **43/0**; die Verstümmelung aus 31.3 (Tag-Anlage in eigener Klammer) → **rot, Code 1** in Abschnitt 5 **auch dann**, wenn der Fehlschlag vor die Tag-Anlage gelegt wird. Ohne diese letzte Bedingung ist die Auflage nicht eingelöst. |
| **A-A-68** | Die Untergrenze in `proof:access` Abschnitt 13 wird eine **benannte** Zahl nach dem Muster von A-A-61 (dort 100 und 25 bei 117 und 31) und nicht die Länge der tragenden Liste. Heute sind es 16 Dateien; eine Zahl mit Luft nach unten, aber deutlich über den vier tragenden. Das Wort „vollständig" in der Zeile trägt sonst mehr, als die Bedingung prüft. | In beide Richtungen: unveränderter Baum **106/0**, kein falscher Alarm; `recursive: true` aus dem Sammler entfernt (oder eine Endung verengt) → **rot, Code 1**, und die Meldung nennt die gemessene Zahl. Zusätzlich die Gegenprobe aus 31.1 bleibt rot. |
| **A-A-64** *(berichtigt)* | **Berichtigung des Wortlauts, keine neue Arbeit.** Der Satz „Behebung: `raw.includes(indexName)`" aus 30.8 und die Formulierung „eine Bedingung mehr in einer Zeile, die es gibt" aus 30.9 sind **falsch** und durch diesen Satz ersetzt: *Verglichen wird der **ganze** Indexname, und zwar in beiden Gestalten, in denen SQLite den verletzten Index nennt — als `index 'NAME'` und als Spaltenliste. Eine Teilzeichenkettensuche ist an dieser Stelle selbst der Fehler, weil `ux_tag_name` in `ux_tag_name_key` steckt.* | Bereits erfüllt (31.5, 31.7). Die Messung gegen den wörtlichen Bau — **126/7 auf dem gesunden Baum, gemeldeter Fall grün** — ist der Beleg dafür, warum die Berichtigung nötig war. |

### 31.10 Urteil dieser Prüfung

**Zur Abnahme von T-231 und A-A-59: freigegeben.** Sechs Auflagen erfüllt, jede Zahl eigenständig
nachgemessen, keine übernommen. Die zwei Fragen des Erbauers sind beantwortet: **O-KK bestätigt**
(und die Auflage war es, die falsch war, nicht der Bau), **O-KL in beiden Teilen bestätigt**.

**Zur Prüfung insgesamt: Nacharbeit.** Zwei Befunde der Stufe **muß**, einer der Stufe **soll**,
eine Berichtigung an meiner eigenen Auflage, vier Feststellungen. Drei neue Auflagen, alle drei in
`apps/local-api/scripts/**`, **keine berührt Produktivcode**.

**Zur Bilanz an derselben Frage.** Neunmal in neun Wellen war die Antwort auf „weiß der Lauf, wann
er blind ist?" **ja**. Diesmal aber nicht in vier Läufen von vier: `proof:callers`,
`proof:conflicts` und `proof:db-permissions` haben nach T-231 gehalten, was sie versprechen, und
`proof:access` hat die Gegenprobe bestanden, die zwei Wellen offen war. Die beiden `muß`-Befunde
sitzen **beide** in `proof:tags`, und beide an Abschnitten, die derselbe Lauf zwei Abschnitte
weiter vorbildlich macht. Das ist dieselbe Beobachtung wie in 30.10 — die Blindheit sitzt einen
Schritt neben der Sorgfalt.

**Was diese Welle über den Port gelernt hat.** Drei Vorhersagen sind gefahren worden: **zwei
bestätigt und beide härter als vorhergesagt**, **eine widerlegt**. Eine Vorhersage ist kein Befund
— aber sie ist auch keine verlorene Arbeit: Alle drei ließen sich in dieser Welle in unter einer
Stunde messen, weil die Verstümmelung schon dastand. **Aufgeschriebene Erwartungen sind billiger
als vergessene Fragen.** Die Entzerrung des festen Ports (E-083 Punkt 4, O-KJ) bleibt trotzdem
fällig; sie hat diese Prüfung zwei Wellen gekostet.

**Der Satz dieser Prüfung.** Eine Auflage, die ihre eigene Behebung wörtlich hinschreibt, ist so
gut gemessen wie der Lauf, den sie verbessern soll — und meine war es nicht. `raw.includes(…)`
hätte sieben gesunde Blöcke rot und den einen kranken grün gemacht. **Der Erbauer hat sie nicht
befolgt, sondern verstanden; das ist der Grund, warum sie jetzt trägt.**

---

## 32. Prüfung T-241 (2026-09-06) — drei Punkte am eigenen Papier, und einer davon hatte eine Sicherheitseigenschaft wegbeschrieben

**Auftrag.** Drei Punkte, alle drei ohne Port: **O-KS** (die Zeile über `attachmentLabel`),
**O-JL** (der benannte Rest von A-A-51, mit einer Zahl zu entscheiden), **O-JM** (Zahl gegen Zahl in
28.2.2). Die Abnahme von T-235 war ausdrücklich **nicht** Teil dieses Auftrags; sie braucht den
Port. Was sich für sie ohne Port vorbereiten ließ, steht in 32.4.

### 32.0 Was gemessen wurde und was nicht (E-094, angewandt auf diese Prüfung selbst)

**Den Weg, den ich gegangen bin.** Alle Zahlen dieses Kapitels sind an diesem Baum entstanden, keine
ist aus einem früheren Kapitel übernommen. Die Verstümmelungen liefen in einem **Spiegel** unter
`/tmp/t241-spiegel` — eine Kopie von `apps/local-api` und `packages` mit einem Verweis auf die
`node_modules` des Baums —, damit kein Produktivstand angefaßt wird. Der Spiegel ist gegen den Baum
geeicht: `proof:openapi` liefert dort **114/0, Code 0**, zeichengleich mit dem Baum.

**Den Weg, den ich ausgelassen habe, und er ist benannt.** `e2e-tester` hält 5173 und 17843. Kein
portgebundener Lauf: kein `proof:access`, kein `proof:tags`, kein `proof:db-permissions`, kein
`proof:taskpane` (bindet 17944), kein `proof:all`. Gefahren sind ausschließlich `proof:openapi` und
`proof:route-policy` — beide gehen über `app.fetch` und binden nichts; die Begründung dafür steht im
Kopf von `proof-route-policy.mjs` und ist heute nachgelesen, nicht angenommen. **Was daraus folgt:**
Die Aussagen dieses Kapitels über die **Routenliste**, über den **Vermerk** und über die
**Erreichbarkeit über `app.fetch`** sind gemessen. Die Aussagen über `proof:access` und
`proof:tags` in 32.4 sind **statisch gelesen und ausdrücklich nicht gemessen**; sie stehen dort als
Vorbereitung und nicht als Abnahme.

**Die Suchregel** aus `CLAUDE.md` ist in beiden Hälften gefahren: `git grep` **und** ein roher Lauf
über `apps/*/src`, `packages/*/src`, `tests/` und `docs/`, Bauergebnisse
(`apps/desktop/src-tauri/taskpane/`) ausgeschlossen. Ergebnis für O-KS in 32.1.

**E-087, auf den Auftrag selbst angewandt.** Zwei der drei Punkte hatten seit ihrer Meldung eine
Antwort bekommen, die im Auftrag nicht stand — O-JM ist in 29.3 bereits berichtigt worden (nur nicht
**an Ort und Stelle**, O-JZ), und O-JL ist in 30.7 bereits entschieden worden. **Beide Befunde gibt
es heute trotzdem noch**, und zwar an anderer Stelle als gemeldet: bei O-JM stand die falsche Zahl
weiter in der Tafel, die der nächste Leser zuerst sieht; bei O-JL trug die Entscheidung eine
**gemessen zu milde** Begründung. Beides ist jetzt an Ort und Stelle berichtigt.

---

### 32.1 O-KS — die Zeile, die die Sicherheitseigenschaft wegbeschrieb

**Den Befund gibt es heute noch, und er ist größer als „falsch".**

`docs/bedrohungsmodell.md:5236` (Hinweis T-156-8) sagte: *„`attachmentLabel` schneidet `https://`
beziehungsweise `http://` weg."* **Für `http://` ist das seit T-168 falsch.** Nachgemessen an
`packages/domain/src/attachment.ts:1044` und am laufenden Erzeugnis:

| Ziel | Beschriftung ohne Titel |
|---|---|
| `https://beispiel.example/tickets/4711` | `beispiel.example/tickets/4711` |
| `http://beispiel.example/tickets/4711` | **`http://beispiel.example/tickets/4711`** |
| `https://beispiel.example/` | `beispiel.example` |
| `http://beispiel.example/` | **`http://beispiel.example`** |
| `http://beispiel.example:8443/a?b=1#c` | **`http://beispiel.example:8443/a?b=1#c`** |

Die beiden Beschriftungen von `http://…/tickets/4711` und `https://…/tickets/4711` sind **nicht
gleich**, und die erste beginnt mit `http://`.

**Warum das kein Schreibfehler ist.** Der Hinweis T-156-8 war seinerzeit richtig, und er hat gewirkt:
Er ist die Begründung, die heute im Kopf von `attachmentLabel` steht (*„Zweitens ist es die einzige
Stelle vor dem Klick, an der eine Herabstufung von `https` auf `http` zu sehen ist — bei einem
Verweis fragt Takt nicht zurück (A-A-7) … (Bedrohungsmodell, Hinweis T-156-8)"*). Der Code ist dem
Hinweis gefolgt; **das Papier ist ihm nicht gefolgt**. Damit stand in der
Sicherheitsbewertung dieser Anwendung ein Satz, der die Eigenschaft, die den Befund geschlossen hat,
als nicht vorhanden beschreibt. Wer ihn als Auftrag läse — „das Schema fällt ohnehin weg, also kann
es auch bei `http` weg" —, kürzte die Herabstufungsanzeige weg und hielte das für Aufräumen.

**Die Gegenprobe: gibt es die Eigenschaft heute wirklich, oder beschreibe ich sie herbei?** Sie ist
dreifach verankert, und keine der drei Verankerungen ist von mir:

1. **Im Code**, als Zweig mit ausgeschriebener Begründung (`attachment.ts:1041–1044`).
2. **Im Prüffall**, zweimal namentlich: *„Verweis ohne Titel: `http://` bleibt SICHTBAR stehen —
   Absicht, nicht vergessen (T-168 1.4)"* und *„http und https auf demselben Pfad bleiben
   unterscheidbar, weil `http://` sichtbar bleibt"* (`packages/domain/test/attachment.test.ts:679`
   und `:748`).
3. **In der Prüfung durch spec-ux-reviewer**, T-237, als bewußte Abweichung von X-04 erneut geprüft
   und bestätigt.

**Suchregel, beide Hälften, Ergebnis.** `git grep` findet die falsche Formulierung an **einer**
Stelle im Papier; der rohe Lauf über die Quellverzeichnisse findet **dieselbe eine** und sonst
nichts. Zusätzlich gefunden und ausdrücklich **nicht** zu berichtigen:
`.claude/team/reports/T-156-security-checker.md:231` schreibt *„`attachmentLabel` schneidet
`https://` weg"* — **ohne** das `http://`. Der Bericht war richtig; die Abweichung ist beim Übertrag
ins Papier entstanden. Ein Bericht ist ein Stand seines Tages und wird nicht rückwirkend
umgeschrieben.

**Erledigt.** Zeile 5236 ist an Ort und Stelle berichtigt, mit Marke, mit den gemessenen Werten und
mit dem Satz, warum die Kürzung hier nicht stattfindet. Der Hinweis T-156-8 ist damit **geschlossen**
und nicht offen: Was er verlangte, ist gebaut.

---

### 32.2 O-JL — der benannte Rest von A-A-51, entschieden mit Zahlen

#### Die Zahlen, um die gebeten wurde

Gezählt an `probe.app.routes` des zusammengesetzten Dienstes, heutiger Baum:

| Größe | Zahl |
|---|---|
| Einträge in der Routenliste | **83** |
| davon Kettenglieder (Methode `ALL`) | **10** |
| davon Endpunkte (Methode `GET`/`POST`/`PATCH`/`PUT`/`DELETE`) | **73** |
| **Endpunkte, die auf einem Platzhalter liegen** | **30** (auf 18 verschiedenen Pfaden) |
| davon mit `*` im Pfad | **0** |
| **Endpunkte, die an ihrem Pfad ununterscheidbar sind** | **0** |

**Warum die letzte Zahl null ist, und warum das die Frage nicht erledigt.** Ununterscheidbarkeit
setzt die Methode `ALL` voraus — nur dort trägt Hono Kettenglieder und Endpunkte in denselben Topf.
Unter `ALL` steht heute **kein einziger Endpunkt**. Die 30 Endpunkte auf Platzhaltern tragen
sämtlich eine konkrete Methode und sind deshalb an ihrem Eintrag zu erkennen, Platzhalter hin oder
her. **Die ununterscheidbare Klasse ist ausschließlich die der zehn Kettenglieder.**

#### Warum eine gepflegte Aufstellung hier nicht teuer, sondern wirkungslos wäre

Das ist die Zahl, auf die es ankommt:

| Unterscheidungsmerkmal | verschiedene Werte über die zehn Kettenglieder | Unterscheidungskraft |
|---|---|---|
| **Pfad** | **1** (`/*`, zehnmal derselbe) | **null** |
| Name der Handlerfunktion | 3 (`bodyLimit2`, `timeout2`, **8 × der leere Name**) | null für die acht, die die Grenze tragen |
| Stelligkeit des Handlers | 1 (alle zehn nehmen `(c, next)`) | null |

**Eine Aufstellung der erlaubten Kettenglied-*Pfade* hätte genau ein Element und könnte über die
zehn nichts sagen.** Sie wäre nicht der teure, aber wirksame Weg — sie wäre der teure und
**unwirksame**. Das ist der Grund, aus dem ich sie nicht anordne, und er ist gemessen und nicht
gefühlt. Der zweitbeste Fingerabdruck, der Handlername, ist für **8 von 10** leer, weil die Wächter
aus Fabrikfunktionen kommen; auch er trägt nicht.

#### Was A-A-56 heute fängt und was nicht — vier Gegenproben, im Spiegel

Jede Gegenprobe ist eine Zeile in `src/app.ts`, gefahren gegen die **echten** Läufe:

| Gegenprobe | `proof:openapi` | Code | Die Zeile, die zuschlägt |
|---|---|---|---|
| unveränderter Spiegel | **114/0** | **0** | — (kein falscher Alarm) |
| **R2** `api.all('/*', …)` **zusätzlich** | **112/2** | **1** | A-A-56 Form (`/api/v1/*`) **und** Zahl (`11`) |
| **R3** `api.all('/addin/leak/:id', …)` | **112/2** | **1** | A-A-56 Form **und** Zahl |
| **R4** `api.all('/addin/leak', …)` | **111/3** | **1** | A-A-51 **und** A-A-56 Form **und** Zahl |
| **R1** Kettenglied 6 (`contentTypeGuard`) **ersetzt** durch `app.all('*', …)` | **114/0** | **0** | **keine** |
| **R1b** Kettenglied 1 (`securityHeaders`) **ersetzt** durch `app.all('*', …)` | **114/0** | **0** | **keine** |

`proof:route-policy` bleibt bei R1 und R1b ebenfalls **43/0, Code 0**. **Drei der vier Formen sind
gefangen; die vierte — der Tausch bei gleichbleibender Zahl — ist der benannte Rest, und er ist
heute zum ersten Mal an diesem Baum gemessen und nicht nur beschrieben.**

#### Und noch eine Form, die im Auftrag nicht stand: die **Reihenfolge**

Sie ist mir beim Bauen der Gegenproben in die Hand gefallen, und sie gehört hierher, weil sie
dieselbe Lücke ist:

| Gegenprobe | Kettenglieder gezählt | `proof:openapi` | `proof:route-policy` | Code |
|---|---|---|---|---|
| **(3)** `authGuard` und `hostGuard` **vertauscht** | **10**, in **anderer** Reihenfolge | **114/0** | **43/0** | **0** |
| **(4)** `originGuard` **ersatzlos gestrichen** | **9** | **113/1** | **42/1** | **1** |
| zum Vergleich: `credentialPolicy` und `authGuard` vertauscht | 10 | **rot** (der Durchlauf bekommt 401) | — | 1 |

**Streichen wird gefangen, Vertauschen nicht — jedenfalls nicht zuverlässig.** Die dritte Zeile zeigt,
daß **manche** Vertauschung am Verhalten auffällt, weil der Durchlauf dann nicht mehr durchkommt; die
erste zeigt, daß **andere** vollständig unsichtbar bleiben. Über dem Block in `src/app.ts` steht
*„Die Kette. Reihenfolge ist Inhalt"* — **und kein Lauf dieses Baums mißt diesen Inhalt.** Ob eine
bestimmte Vertauschung ein Loch aufreißt, ist eine Frage für sich und hier nicht behauptet; daß der
Wächter dagegen fehlt, ist gemessen.

#### Die Reichweite des Restes — hier ist 30.7 zu milde gewesen

Der getarnte Sammelpfad antwortet in R1/R1b auf `/api/v1/leak` und auf `/leak`; für jeden anderen
Pfad reicht er durch. Erreichbarkeit, gemessen über `app.fetch`:

| Tausch an | ohne jeden Nachweis | fremde Herkunft | fremder `Host` |
|---|---|---|---|
| Stelle 6 (`contentTypeGuard`) | **200** | 403 `origin_not_allowed` | 403 `host_not_allowed` |
| **Stelle 1 (`securityHeaders`)** | **200** | **200** | **200** |
| Vergleich `/api/v1/todos`, unverändert | 401 | — | — |

**Ein Tausch an Stelle *k* schaltet für den getarnten Pfad 11 − *k* Wächter ab**, weil das getauschte
Glied antwortet statt durchzureichen. An Stelle 1 sind es alle zehn, und dann ist der Pfad aus
**jeder Webseite im Browser des Benutzers** erreichbar — genau die Klasse, die `CLAUDE.md` als die
wahrscheinlichste echte Lücke dieser Architektur benennt. 30.7 ist an dieser Stelle berichtigt: Der
Satz *„die Reichweite ist klein"* gilt für den **hinzugefügten** Eintrag (den A-A-56 ohnehin fängt),
nicht für den **getauschten**.

Und die Durchgriffsprobe aus 29.2.4 schließt ihn auch nicht: Das Glied aus R1 reicht für jeden
nirgends registrierten Pfad durch und sähe in der Probe wie ein Kettenglied aus. 30.7 Punkt drei
gilt damit unverändert — jetzt mit einem gemessenen Fall statt mit einem Argument.

#### Die Entscheidung

**Hinnehmen mit benanntem Rest — keine Aufstellung von Pfaden. Und der Rest bekommt eine Auflage,
die keine Aufstellung von Pfaden ist: A-A-69.**

Die Begründung in einem Satz: **Der Pfad kann den Rest nicht schließen, weil alle zehn denselben
Pfad tragen; die Reihenfolge kann es, weil sie schon Inhalt ist.** In `src/app.ts` steht über dem
Block wörtlich *„Die Kette. Reihenfolge ist Inhalt"* — und `MIDDLEWARE_COUNT = 10` ist bereits die
**Mächtigkeit** genau der Liste, die A-A-69 verlangt. Der Schritt von der Zahl zu den zehn Namen in
ihrer Reihenfolge legt deshalb **keinen neuen Pflegeort** an; er füllt den bestehenden aus.

**Der Preis, ausgeschrieben, damit ihn niemand später als verschwiegen findet.** A-A-69 liest den
**Quelltext** von `src/app.ts` und nicht das Verhalten. Sie prüft, daß die zehn Wächter dort in
dieser Reihenfolge registriert sind — nicht, daß sie laufen; das messen `proof:access` und
`proof:route-policy`. Wer die Kette umbaut (etwa in eine Hilfsfunktion zieht), macht sie rot, ohne
daß ein Sicherheitsfehler vorläge; das ist der bewußt gewählte Preis, und er kostet eine Zeile im
Lauf. **Gemessener Ertrag:** Ein Prototyp, der `app.(use|all|on)('…', Wächter(` aus der Datei liest,
zählt am unveränderten Baum die zehn in genau dieser Reihenfolge und meldet bei **beiden**
Tauschformen **9 statt 10** und **welcher** Wächter fehlt.

---

### 32.3 O-JM — Zahl gegen Zahl, jetzt an der Stelle, an der die Zahl steht

**Den Befund gibt es heute noch — an einer anderen Stelle, als er gemeldet war.** 29.3 hat die
Berichtigung schon 2026-09-06 aufgeschrieben, vollständig und mit Marke. Sie steht aber **hinter**
der Tafel, die sie berichtigt, und über 4 000 Zeilen davon entfernt. Wer 28.2.2 liest, liest die
falsche Zahl und erfährt nichts von 29.3. Das ist O-JZ in Reinform: ein Nachtrag, der die
berichtigte Stelle nicht erreicht.

**Nachgemessen, jede der drei Stellen einzeln, im Spiegel, gegen den heutigen Lauf:**

| ersetzt | Antworten mit dem Vermerk | `proof:openapi` | Code |
|---|---|---|---|
| nichts | **2** | **114/0** | 0 |
| Stelle 1 (`:449`) | **1** | **113/1** | **1** |
| Stelle 2 (`:520`) | **1** | **113/1** | **1** |
| **Stelle 3 (`:877`, Add-in-Route)** | **2** | **114/0** | **0** |
| alle drei | **0** | **113/1** | **1** |

**Die Zahl ist zwei.** Und die zweite Hälfte der alten Tafel ist nicht nur falsch, sondern
**überholt**: Die Zeile *„alle drei umgeschrieben → 110/0, Code 0"* war der Befund; heute ist es
**113/1, Code 1**, weil A-A-52 gebaut ist und die Zwei selbst mißt. Eine Tafel, die einen behobenen
Befund als offen führt, ist derselbe Schaden wie eine, die eine falsche Zahl führt.

**Erledigt.** 28.2.2 trägt jetzt beide Tafeln: die erste als **Stand mit Datum und Herkunft**
(durchgestrichen, nicht gelöscht — sie ist die Spur des Befunds), die zweite als geltende Messung mit
Datum. E-087 Punkt 2, angewandt auf mein eigenes Papier.

---

### 32.4 Vorbereitung der Abnahme T-235 — was ohne Port ging, und was ausdrücklich nicht

Die Abnahme selbst ist **nicht** gefahren; sie braucht 17843. Was sich statisch feststellen ließ:

| Auflage | Gebaut? | Statisch gelesen |
|---|---|---|
| **A-A-66** | ja | `proof-tags.mjs:789` und `:796` prüfen den **Grund** neben dem Status: *„und die Antwort sagt, daß es an ihrer Zahl lag"*, *„und die Antwort nennt den leeren Namen"*. |
| **A-A-67** | ja | `proof-tags.mjs:645` und `:664` — **beide** Formen, die die Auflage als tragfähig genannt hat: die Fehlerkennung („der Fehlschlag trägt keine Feldangabe") **und** die positive Verankerung („derselbe Rumpf ohne die unmögliche Spalte legt das Tag an"). Die Auflage verlangte eine; gebaut sind zwei. |
| **A-A-68** | ja | `proof-access.mjs:1118` `MINDESTENS_DURCHSUCHT = 14`, dazu ein **zweiter Weg** (`vonHand`, von Hand abgestiegen statt `recursive: true`) mit `scanned.length === vorhanden.length`. |

**Eine Zahl davon ist ohne Port nachzählbar und stimmt:** Unter den beiden Sammelwurzeln
`src/access` und `src/http` liegen heute **16** `.ts`-Dateien. Die benannte Untergrenze 14 läßt zwei
verschwinden, ohne rot zu werden, und liegt mit Faktor dreieinhalb über den vier tragenden — das
Verhältnis, das die Auflage verlangt hat.

**Was ausdrücklich offen bleibt:** die Zahlen. Die Erwartung des Erbauers liegt vor und wird in der
nächsten Welle **zeichengenau** gegengeprüft: `proof:tags` **45/0** und `proof:access` **108/0** auf
unverändertem Baum, **acht** Gegenproben rot mit Code 1, darunter die entscheidenden **43/2**
(`proof:tags`, je Verstümmelung **plus** Kunstquelle) und **107/1** (`proof:access`,
Unterordnerdatei **plus** gestrichenes `recursive: true`). Kein Wort davon ist hier abgenommen.

---

### 32.5 Befunde

| Nr. | Stufe | Befund | Zuständig |
|---|---|---|---|
| **T-241-1** | **Berichtigung** | **Das Papier hat eine Sicherheitseigenschaft wegbeschrieben, der es selbst zum Leben verholfen hat.** Zeile 5236 sagte, `attachmentLabel` schneide `https://` **und** `http://` weg. Gemessen: `http://beispiel.example/tickets/4711` → `http://beispiel.example/tickets/4711`, `https://…` → `beispiel.example/…`; die beiden Beschriftungen sind nicht gleich. Der Code folgt seit T-168 dem Hinweis T-156-8 und nennt ihn im Kommentar; das Papier ist ihm nicht gefolgt. Dreifach verankert (Code, zwei namentliche Prüffälle, T-237). **An Ort und Stelle berichtigt, Hinweis T-156-8 geschlossen.** | — |
| **T-241-2** | **Berichtigung** | **30.7 war an einer Stelle gemessen zu milde.** Der Satz *„die Reichweite des getarnten Sammelpfads ist klein — 401 für das Add-in-Token"* gilt für einen **hinzugefügten** `ALL`-Eintrag hinter der Kette (den A-A-56 an der Zahl fängt), nicht für den **getauschten** in der Kette. Gemessen: Tausch an Stelle 6 → **200 ohne jeden Nachweis**; Tausch an Stelle 1 → **200 auch mit fremder Herkunft und fremdem `Host`**, also aus jeder Webseite im Browser. Beide Male `proof:openapi` **114/0** und `proof:route-policy` **43/0**, Code 0. **An Ort und Stelle berichtigt.** | — |
| **T-241-3** | **soll** | **Der Rest von A-A-51 ist tragbar, aber er soll nicht unbewacht bleiben — und der Wächter ist billig.** Gemessen: Der Tausch bei gleichbleibender Zahl ist die einzige der vier `ALL`-Formen, die beide Läufe grün läßt (114/0 und 43/0, Code 0); die anderen drei sind rot (112/2, 112/2, 111/3, alle Code 1). Eine Aufstellung der erlaubten **Pfade** hilft nicht: **10 von 10 Kettengliedern tragen denselben Pfad `/*`**, und **8 von 10** tragen den leeren Handlernamen. Was hilft, ist die **Reihenfolge** — sie ist in `app.ts` bereits als Inhalt bezeichnet (*„Die Kette. Reihenfolge ist Inhalt“*), und `MIDDLEWARE_COUNT = 10` ist bereits ihre Mächtigkeit. **Dazu ein zweiter, größerer Teil desselben Lochs, beim Bauen der Gegenproben gemessen:** `authGuard` und `hostGuard` vertauscht → zehn Kettenglieder in anderer Reihenfolge, `proof:openapi` **114/0** und `proof:route-policy` **43/0**, beide Code 0 — **kein Lauf dieses Baums mißt die Reihenfolge der Kette**, obwohl `app.ts` sie ausdrücklich Inhalt nennt. Gestrichen wird gefangen (`originGuard` weg → 113/1 und 42/1, Code 1), vertauscht nicht. Gegenmittel: **A-A-69**. | domain-dev |
| **T-241-4** | **Berichtigung** | **28.2.2 führte eine falsche und eine überholte Zahl.** Falsch: „eine der drei Stellen → 1" gilt nur für zwei der drei. Überholt: „alle drei → 110/0, Code 0" ist seit A-A-52 **113/1, Code 1**. Beides in 29.3 bereits gemeldet, aber **hinter** der Tafel und 4 000 Zeilen entfernt (O-JZ). **Beide Tafeln stehen jetzt an Ort und Stelle: die alte als Stand mit Datum, die neue als Messung mit Datum.** | — |
| **T-241-5** | Feststellung | **Kein Endpunkt liegt heute unter `ALL`.** 83 Einträge, 73 Endpunkte, 10 Kettenglieder; **30** Endpunkte auf einem Platzhalter (18 verschiedene Pfade), **0** davon mit `*`, **0** am Pfad ununterscheidbar. Die ununterscheidbare Klasse ist ausschließlich die der zehn Kettenglieder. Damit ist die Frage aus O-JL beantwortet, und die Antwort ist der Grund, warum die Aufstellung wirkungslos wäre. | — |
| **T-241-6** | Feststellung | **Der Bericht war richtig, das Papier war falsch.** `.claude/team/reports/T-156-security-checker.md:231` schreibt „schneidet `https://` weg" — ohne `http://`. Die Abweichung ist beim Übertrag ins Papier entstanden. Berichte werden nicht rückwirkend umgeschrieben; die Beobachtung gehört trotzdem aufgeschrieben, weil sie sagt, **wo** der Fehler entsteht: nicht beim Messen, beim Zusammenfassen. | — |
| **T-241-7** | Hinweis | **Semgrep Guardian und 42Crunch weiterhin ohne Werkzeug.** Unverändert seit T-156-9: Die Lieferkette dieses Baums ist nie gemessen worden, und seit `v0.1.0` sind Binärdateien draußen. Beschaffungsentscheidung, nicht Agentenarbeit. | Orchestrator |
| **T-241-8** | Feststellung | **Der Port hat diese Prüfung weniger gekostet als die zwei davor — weil zwei Läufe über `app.fetch` gehen.** Ohne Port fahrbar und gefahren: `proof:openapi` und `proof:route-policy` je einmal am unveränderten Baum, dazu **sechzehn** Läufe an einer Verstümmelung im Spiegel (**zwölf** `proof:openapi`, **vier** `proof:route-policy`), `proof:codepoints` einmal, **sieben** Läufe des Prototyps zu A-A-69 und vier eigene Messungen am zusammengesetzten Dienst (Beschriftung, Routenliste, Handlernamen, Erreichbarkeit). **Nicht fahrbar und deshalb nicht behauptet:** `proof:access`, `proof:tags`, `proof:db-permissions`, `proof:taskpane` — und mit ihnen die ganze Abnahme von T-235. Die Entzerrung des festen Ports (E-083 Punkt 4, O-KJ) bleibt fällig. | Orchestrator |

### 32.6 Neue Auflagen

| Auflage | Was zu tun ist | Wie geprüft wird |
|---|---|---|
| **A-A-69** | Der Rest von A-A-51 wird bewacht, **ohne** eine Aufstellung von Pfaden — die trüge nichts (10 von 10 Kettengliedern haben den Pfad `/*`). Bewacht wird die **Reihenfolge**: `proof:route-policy` liest `src/app.ts` als Text und hält die Registrierungen an der Wurzel-App gegen eine im Lauf **ausgeschriebene** Liste der zehn Wächter **in ihrer Reihenfolge** — `securityHeaders`, `requestLog`, `hostGuard`, `originGuard`, `urlSecretGuard`, `contentTypeGuard`, `bodyLimit`, `timeout`, `authGuard`, `credentialPolicy`. `MIDDLEWARE_COUNT` wird von dieser Liste abgeleitet und nicht mehr daneben geführt; damit entsteht **kein zweiter Pflegeort**. Der Kommentar nennt drei Dinge: daß die Reihenfolge Inhalt ist (der Satz steht schon in `app.ts`), daß ein getauschtes Glied **antwortet statt durchzureichen** und deshalb alles hinter sich abschaltet, und daß dieser Lauf **Quelltext** liest und nicht Verhalten — das Verhalten messen `proof:access` und `proof:route-policy` an ihren eigenen Zeilen. | In **beide** Richtungen. Unveränderter Baum: grün, kein falscher Alarm; die Zeile nennt die zehn in ihrer Reihenfolge. Vier Gegenproben, alle **rot mit Code 1** und alle mit dem **Namen** des betroffenen Wächters in der Meldung: (1) `securityHeaders` durch `app.all('*', …)` ersetzt, (2) `contentTypeGuard` durch `app.all('*', …)` ersetzt, (3) zwei Glieder vertauscht (`authGuard` vor `hostGuard`), (4) ein Glied ersatzlos gestrichen. Der Prototyp aus 32.2 liefert für (1), (2) und (4) bereits **9 statt 10** und **benennt den fehlenden Wächter** — das ist der Zugewinn gegenüber A-A-56, die bei (4) zwar rot wird (113/1), aber nur die Zahl nennt und nicht, welches Glied fehlt. Für (3) zählt der Prototyp **10** und muß an der **Reihenfolge** rot werden; eine Zahlmeldung wäre dort der falsche Befund. Gemessen: (3) läßt heute `proof:openapi` bei **114/0** und `proof:route-policy` bei **43/0**, beide Code 0. Zusätzlich als Nichtregression: `proof:openapi` bleibt bei **114/0** und `proof:route-policy` bei seiner heutigen Zahl **+ den neuen Zeilen**. |
| **A-A-70** | **Eine Regel gegen die Fehlerart aus T-241-1 und T-241-4, und sie kostet nichts.** Wird in diesem Papier eine Aussage über gemessenes Verhalten berichtigt oder überholt, steht die Berichtigung **an der Stelle**, an der die alte Aussage steht — mit Marke und Datum —, und nicht nur im Kapitel der Prüfung, die sie gefunden hat. Ein Nachtrag im hinteren Teil darf die Stelle **ergänzen**, aber nicht **ersetzen**. Der Grund ist zweimal gemessen: 29.3 hat O-JM vollständig berichtigt und die falsche Zahl stand danach zwei Wellen weiter in der Tafel, die der nächste Leser zuerst sieht; T-156-8 hat eine Sicherheitseigenschaft ausgelöst und beschrieb sie danach als nicht vorhanden. | Keine Messung; eine Regel über dieses Papier. Ihre Wirkung ist an 21.4, 28.2.2 und 30.7 in dieser Fassung ablesbar — drei Stellen, an denen die Berichtigung jetzt dort steht, wo die Aussage steht. |

### 32.7 Urteil dieser Prüfung

**Zu den drei Punkten: erledigt, alle drei, und alle drei an Ort und Stelle.** O-KS berichtigt und
der Hinweis T-156-8 geschlossen; O-JL entschieden — **hinnehmen mit benanntem Rest, keine Aufstellung
von Pfaden**, begründet mit der Zahl **1** (so viele verschiedene Pfade tragen die zehn Kettenglieder)
und der Zahl **0** (so viele Endpunkte sind heute an ihrem Pfad ununterscheidbar); O-JM nachgemessen,
auf **eine** Zahl gebracht und die alte als Stand mit Datum aufbewahrt.

**Was im Auftrag nicht stand und trotzdem hier steht.** Beim Bauen der Gegenproben für O-JL ist eine zweite, größere Form derselben Lücke aufgefallen: **Die Reihenfolge der zehn Kettenglieder wird von keinem Lauf gemessen.** Zwei Glieder vertauscht — `proof:openapi` **114/0**, `proof:route-policy` **43/0**, beide Code 0. Ein gestrichenes Glied fällt auf (die Zahl), ein verschobenes nicht. A-A-69 deckt beides ab, weil eine Liste in Reihenfolge beides trägt — das ist der Grund, warum die Auflage die Reihenfolge und nicht nur die Namen verlangt.

**Zur Prüfung insgesamt: Nacharbeit.** Ein Befund der Stufe **soll** (T-241-3, Gegenmittel A-A-69),
drei Berichtigungen an meinem eigenen Papier, zwei neue Auflagen. **Keine berührt Produktivcode**;
A-A-69 liegt in `apps/local-api/scripts/**`, A-A-70 in diesem Papier.

**Der Satz dieser Prüfung.** Zweimal in einem Auftrag hat mein eigenes Papier eine Sache falsch
beschrieben, die es selbst durchgesetzt hat — die Herabstufungsanzeige und die Zwei im Vermerk. Beide
Male war der **Code** richtig, beide Male war der **Bericht** richtig, und beide Male war die
**Zusammenfassung** falsch. Der Fehler entsteht nicht beim Messen. Er entsteht, wenn eine Messung zu
einem Satz wird und der Satz danach ohne die Messung weiterlebt. **Deshalb A-A-70, und deshalb steht
in diesem Kapitel neben jeder Zahl, wann sie gemessen wurde.**
