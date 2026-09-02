Aufgabe: T-003 — Bedrohungsmodell

Status: fertig

Artefakte:
- `docs/bedrohungsmodell.md` (neu, 1553 Zeilen, 52 Bedrohungen B-1.1 bis B-12.5)
- `.claude/team/reports/T-003-security-checker.md` (neu, diese Datei)
- Keine weitere Datei angefasst. Der security-checker behebt nichts selbst.

Zusammenfassung:
Erstellt wurde ein Entwurfs-Bedrohungsmodell auf Architekturbasis, gegliedert in Werte (W-01 bis
W-11), Vertrauensgrenzen (VG-1 bis VG-9), Akteure (A-01 bis A-09), 52 Bedrohungen mit Auswirkung,
umsetzbarem Gegenmittel, zuständiger Rolle und zugehöriger Prüfung, sowie Restrisiko (RR-1 bis
RR-9). Alle elf Pflichtthemen sind abgedeckt; die verlangten Bewertungen sind ausdrücklich
beantwortet: Der Port darf vorhersagbar sein, weil ein zufälliger Port keine Schutzwirkung hat
(B-1.5); eine Freitext-Pfadangabe für Exportvorlagen ist nicht vertretbar, nur eine geschlossene
Auswahlliste ist sicher (B-3.1); die Herkunftsprüfung fängt einen Tokendiebstahl nicht auf, weil
sie nur gegen browserbasierte Angreifer wirkt und gegen jeden lokalen Prozess wirkungslos ist
(B-2.9). Abschnitt 6 priorisiert 18 Gegenmittel nach Schaden gegen Aufwand, Abschnitt 7 leitet 23
konkrete Prüfungen für T-002 und T-010 ab, Abschnitt 8 legt je Aufgabe ein Sicherheitstor fest.
Drei Befunde sind neu gegenüber `risks.md` und brauchen dort einen Eintrag: das Add-in-Token in
Office-`RoamingSettings` (synchronisiert in das Postfach und damit in die Cloud, gegen E-001),
Roaming- beziehungsweise OneDrive-Synchronisierung von SQLite-Datei und Exportordner, und das
Fehlen einer `.gitignore` vor der ersten Installation in T-008.

Annahmen:
- „Anwendungsdatenverzeichnis" aus der Spezifikation wird als `%LOCALAPPDATA%` gelesen, nicht als
  `%APPDATA%` (Roaming). Begründet in B-7.1: Roaming kopiert die Kundendatenbank auf einen
  Dateiserver und beschädigt SQLite über die WAL-Dateien. Gehört als Entscheidung in T-008
  festgeschrieben.
- Der Vorgabe-Exportordner ist `%LOCALAPPDATA%\Takt\exports\`, nicht Desktop oder Dokumente, weil
  diese unter Windows regelmäßig nach OneDrive umgeleitet sind (B-5.3).
- Der Nachweis läuft über eine eigene Kopfzeile, nicht über Cookies. Das ist eine
  Entwurfsvorgabe, keine bloße Empfehlung, weil ohne Cookies die gesamte CSRF-Klasse entfällt
  (B-1.2).
- Vorgeschlagene Schwellen sind als Vorschlag gekennzeichnet und nicht gesetzt: 100 ms Zeitgrenze
  für den regulären Ausdruck, 20 000 Zeichen Eingabelänge, 1 MB Rumpfgrenze, 10 Fehlversuche in
  60 Sekunden, 3 Sekunden Erreichbarkeitsprüfung, 3 bis 64 Zeichen für die Call-Nummer.
- Für den Exportstatus wird zusätzlich zum zweiwertigen Status aus A-6.9 ein Zähler
  `exportAnzahl` und eine anhängende Tabelle `export_protokoll` vorgeschlagen. Das ist ein
  Eingriff in das Datenmodell aus T-001 und braucht die Zustimmung von domain-dev.
- Die Empfehlung, das Token dienstseitig nur als SHA-256-Hashwert zu speichern und den Klartext
  genau einmal anzuzeigen, ist die sicherere Variante; der verträgliche Rückweg über DPAPI ist
  mitbeschrieben, weil es auch eine Bedienungsfrage ist.

Risiken:
- Neu, Vorschlag für `risks.md`: **R-12** — das Add-in-Token in `Office.context.roamingSettings`
  wird im Postfach gespeichert und über Exchange/M365 synchronisiert. Damit verlässt das
  Geheimnis, das den Zugriff auf alle lokalen Kundendaten öffnet, den Rechner. Schwere: hoch.
  Betrifft integration-dev. Gegenmittel in B-2.8.
- Neu, Vorschlag für `risks.md`: **R-13** — SQLite-Datei und Exportordner unter `%APPDATA%`
  (Roaming) oder in einem OneDrive-Ordner. Zwei Schäden gleichzeitig: Kundendaten verlassen den
  Rechner entgegen E-001, und SQLite wird über unabhängig synchronisierte WAL-Dateien beschädigt.
  Schwere: hoch. Betrifft Orchestrator (T-008) und domain-dev. Gegenmittel in B-7.1 und B-5.3.
- Neu, Vorschlag für `risks.md`: **R-14** — es gibt weder ein Git-Repository noch eine
  `.gitignore`. Wird in T-008 installiert und gestartet, bevor beides existiert, landen Token,
  SQLite-Datei und Exportdateien mit Kundendaten in der ersten Übertragung und bleiben dauerhaft
  in der Historie. Schwere: hoch, weil die Reihenfolge das einzige Gegenmittel ist. Betrifft
  Orchestrator. Gegenmittel in B-11.2.
- Neu, Vorschlag für `risks.md`: **R-15** — ein konfigurierbarer regulärer Ausdruck, der auf jede
  E-Mail zutrifft, erzeugt zusammen mit der Duplikaterkennung aus A-10.9 eine Buchung auf den
  falschen Kundenvorgang. Das ist ein Abrechnungsfehler mit Außenwirkung, kein Anzeigefehler.
  Schwere: hoch. Betrifft integration-dev und domain-dev. Gegenmittel in B-4.3, Kern: eine leere
  Call-Nummer ist nie ein Übereinstimmungskriterium.
- Verschärfung zu R-09: Die Herkunftsprüfung fängt einen Tokendiebstahl nicht auf (B-2.9). Der
  Vorschlag, den Oberflächenpfad vom Add-in-Token zu trennen, ist der einzige, der die
  Angriffsfläche des Tokens strukturell verkleinert; er braucht eine Entscheidung, weil er
  T-011 im Zuschnitt verändert.
- Ergänzung zu R-11: Ein Netzlaufwerk als Exportziel schickt Kundennotizen ins Netz. Der
  Vorschlag ist eine ausdrückliche Rückfrage statt eines Verbots, weil es der gewollte
  Übergabeweg an das Abrechnungstool sein kann (B-5.2, RR-7).
- Werkzeugstand, ausdrücklich: Der Semgrep-Lauf ist mangels Code aussagearm. Die drei
  Guardian-Werkzeuge lieferten **nichts**, weil keine Anmeldung besteht. Ein 42Crunch-Audit war
  nicht möglich, weil keine OpenAPI-Beschreibung existiert. Die Definition of Done des
  security-checkers ist zum Stand von Welle 1 damit nicht erfüllbar; die Punkte sind als Tore für
  T-008 und T-011 weitergereicht (Abschnitt 8 des Modells).

Werkzeuge — was lief und was nicht:
- Semgrep CLI, lokal, `p/default` + `p/secrets`: **lief**. 0 Befunde, 0 Fehler. Wiederholung
  nach dem Schreiben des Dokuments mit `p/secrets`: ebenfalls 0 Befunde.
- Manuelle Baumprüfung auf Schlüsselmuster, Call-Nummern, Ziffernfolgen ab sechs Stellen und
  E-Mail-Adressen: **lief**. Keine Geheimnisse, keine Kundendaten, keine Call-Nummern. Die drei
  Treffer der Geheimnissuche sind Werkzeugnamen und das Wort „Farbtoken".
- `mcp__plugin_semgrep_guardian__get_semgrep_sast_findings`: **lief nicht** —
  „Not logged into Semgrep Guardian." Kein Ergebnis, auch kein negatives.
- Guardian Secrets und Guardian Supply Chain: **liefen nicht**, gleicher Grund. Die
  Lieferkettenprüfung wäre zusätzlich gegenstandslos, weil keine `pnpm-lock.yaml` existiert.
- `42crunch-audit`: **lief nicht** — es gibt keine OpenAPI-Beschreibung.
- `42crunch-scan`: **lief nicht** — der lokale Dienst existiert nicht und läuft nicht.
- `gitleaks` und `trufflehog` sind auf dem Rechner nicht installiert.

Offene Fragen:
1. Unter welcher Herkunft wird `apps/outlook-addin` ausgeliefert? Ohne diese Angabe ist die
   CORS-Positivliste aus B-1.4 nicht bestimmbar. Blockiert T-011 nicht, muss aber vor dessen
   Abschluss beantwortet sein.
2. Token einmalig anzeigen und dienstseitig nur den Hashwert speichern, oder dauerhaft abrufbar
   über DPAPI? Sicherheitsempfehlung ist die erste Variante; die Entscheidung ist auch eine
   Bedienungsfrage und gehört zur Abnahme.
3. Erwartet das Abrechnungstool `DOMAIN\benutzer` oder den nackten Windows-Benutzernamen?
   Frage an den Auftraggeber; betrifft die Standardvorlage.
4. Kennt das Abrechnungstool eine Dublettenprüfung? Die Antwort verschiebt die Schwere von R-10
   und B-9.1 erheblich. Frage an den Auftraggeber.
5. Welcher Nummernraum ist für erfundene Call-Nummern in `tests/fixtures/` nachweislich unbenutzt?
   Frage an den Auftraggeber, betrifft T-002.
6. `node:sqlite` statt `better-sqlite3` prüfen? Das würde ein natives Modul und einen zur
   Installationszeit heruntergeladenen Vorabbau aus dem Abrechnungspfad entfernen (B-10.3).
   Gehört nach der Prüfung in T-008 als Entscheidung in `decisions.md`.
7. Soll eine Semgrep-Guardian-Anbindung eingerichtet werden? Ohne sie bleiben die drei
   Guardian-Werkzeuge dauerhaft stumm, und die Definition of Done ist nur über das lokale CLI
   erfüllbar.
8. Beobachtung, kein Auftrag: `.claude/settings.json` enthält bereits ein ausgearbeitetes
   Berechtigungsschema. R-07 und T-B03 führen das noch als blockiert. Zwei Anmerkungen dazu in
   B-11.3, unter anderem: Nach T-008 verdienen `*.sqlite*`, der Exportordner und die Tokendatei
   denselben `deny`-Eintrag wie heute `.env` und `*.key`, sonst zieht ein Agent bei der
   Fehlersuche Kundendaten in seinen Kontext.

Nächster Schritt:
Der Orchestrator nimmt R-12 bis R-15 in `risks.md` auf und trägt zwei Entscheidungen nach:
`%LOCALAPPDATA%` als Ablageort (B-7.1) und die geschlossene Auswahlliste für Feldquellen statt
Freitextpfad (B-3.1) — beides betrifft T-007 und T-008 unmittelbar und sollte nicht erst im Review
auffallen. Für T-008 gilt als erste Handlung, vor jeder Installation: `.gitignore` anlegen, dann
`git init` (B-11.2). T-011 bekommt die Punkte B-1.1 bis B-1.7 und B-2.1 bis B-2.7 als
Anforderungsliste und erzeugt eine OpenAPI-Beschreibung des lokalen Dienstes, damit der
42Crunch-Audit überhaupt fahrbar wird. T-002 und T-010 übernehmen die 23 Prüfungen aus Abschnitt 7
des Modells; die wichtigste ist Nummer 8 — der Eigenschaftstest über beliebige Exportvorlagen, der
den Text der Todo-Notiz sowohl im Klartext als auch base64-kodiert im Ergebnis sucht.
Der security-checker meldet sich zur erneuten Prüfung nach T-007, T-008 und T-011.
