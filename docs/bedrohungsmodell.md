# Bedrohungsmodell — Takt

Stand: **2026-09-03, Aufgabe R-3** — Nachprüfung des Branches `status-als-regelterm`.
Vorstand: 2026-09-02, Aufgabe T-067 — Prüfung vor der Veröffentlichung.
Davor: 2026-09-01, Aufgabe T-023, Welle 8 — Gegenprobe gegen den fertigen Code.
Erstfassung: 2026-08-31, Aufgabe T-003, Welle 1. Verantwortlich: security-checker.

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
