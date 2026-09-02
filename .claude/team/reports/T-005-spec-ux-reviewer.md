# T-005 — Screen- und Zustandsmatrix für Takt

Aufgabe: T-005 — Screen- und Zustandsmatrix
Status: fertig
Artefakte: `.claude/team/reports/T-005-spec-ux-reviewer.md` (neu, einzige Datei)
Zusammenfassung: Aus `docs/spec.md` und den Entscheidungen E-001 bis E-014 sind 14 Screens mit
Zweck, Anforderungsdeckung, Daten, Aktionen und Ausgängen abgeleitet, dazu die von Abschnitt 15
ausdrücklich verlangten sechs Zustände je Screen mit konkretem Inhalt statt Platzhaltern. Die
Interaktionen I-01 bis I-15 sind als vollständige Zustandsfolgen beschrieben; weil weder Code
noch Prototyp existieren (E-013), ist die Klickpfad-Prüfung nach vorn gerichtet und benennt die
Stellen, an denen abgeleiteter Zustand die Kette bricht, bevor sie gebaut wird. Dazu kommen die
vollständige Liste der Orte, an denen eine Buchung auftaucht und ihr Exportstatus sichtbar sein
muss, die Oberflächentrennung der beiden Notizfelder, eine Begriffsliste für das Glossar aus
T-004 und die Navigationsstruktur samt Einordnung von S-14. Es sind 18 Befunde und acht offene
Fragen entstanden.
Annahmen: siehe Abschnitt 9. Die wichtigsten: A-2.5 löst keinen Bestätigungsdialog aus, weil die
Anforderung „automatisch" sagt — stattdessen Rückmeldung mit Rückgängig; die Abschlussspalte des
Kanban-Boards ist eine Eigenschaft der konfigurierbaren Statusstruktur und nicht ihr Name; das
manuelle Markieren als exportiert ist innerhalb des Toastfensters rücknehmbar, ein echter Export
nicht.
Risiken: R-08 und R-10 lassen sich in der Oberfläche nur über Beschriftung und Dialogtext
entschärfen und bleiben damit fragil. A-8.9 macht die Exportvorschau zu einer Stelle, an der
Kundendaten im Klartext auf dem Bildschirm stehen. Die Vorschau in S-07 und S-14 ist die einzige
Stelle, an der ein Bruch der Notiz-Trennung vor dem Schreiben sichtbar würde — sie muss deshalb
denselben Renderer benutzen wie der Export selbst.
Offene Fragen: acht, siehe Abschnitt 10. Blockierend für T-006 sind O-01, O-02 und O-03.
Nächster Schritt: O-01 bis O-03 als Entscheidungen E-015 bis E-017 festhalten, danach diese
Matrix als Bauvorgabe an T-006 und die spätere Umsetzung geben.

---

## Lesehinweise

- Belegt wird mit Anforderungs-IDs aus `docs/spec.md` (`A-…`, `I-…`, `S-…`), mit Abschnitten
  (`§12`, `§15`), mit Entscheidungen (`E-…`) und Risiken (`R-…`). Wo ein Erfolgskriterium aus
  WCAG 2.2 AA die Ausgestaltung bestimmt, steht es als `SC …` daneben; Grundlage dafür ist
  A-13.8 zusammen mit §15.
- Es gibt keinen Prototyp (E-013). Diese Matrix ist deshalb keine Gegenprobe, sondern Vorgabe.
- Befunde sind als `B-nn` nummeriert und stehen gesammelt in Abschnitt 8.

---

## 1. Screens S-01 bis S-14

### S-01 — Dashboard / Startseite

**Zweck.** Ein Blick genügt, um zu sehen, ob gerade Zeit läuft, wie viel heute zusammengekommen
ist, wie viel noch unabgerechnet liegt und woran zuletzt gearbeitet wurde.

**Deckt.** §12, §14, A-6.6, A-6.7, A-8.6, A-13.1, A-13.4, A-13.5, I-01, I-04, I-05.

**Zeigt.** Laufender Timer mit Todo-Titel, Startzeit und mitlaufender Dauer; heute erfasste
Arbeitszeit als Summe; Anzahl und Summe der noch nicht exportierten Buchungen (A-6.6); Anzahl
offener und erledigter Todos; die meistgenutzten Tags beziehungsweise Projekte (A-4.5); die
zuletzt bearbeiteten Todos mit Titel, Status, Tags und Gesamtzeit.

**Bietet an.** Timer stoppen samt Eingabe der Buchungsnotiz (A-7.3); Timer auf einem der zuletzt
bearbeiteten Todos starten (A-6.2, damit auch I-05); neues Todo anlegen (I-01); Sprung in den
Export mit vorbelegter Auswahl (I-11); Sprung in eine gefilterte Todo-Liste über eine Tag- oder
Poolkachel.

**Führt zu.** S-02, S-03, S-04, S-05, S-06, S-07, S-09.

### S-02 — Todo-Liste

**Zweck.** Alle Todos in einer filter- und durchsuchbaren Liste, aus der heraus sich die
Alltagsaktionen ohne Detailwechsel erledigen lassen.

**Deckt.** A-2.1, A-2.2, A-2.3, A-2.4, A-3.3, A-13.1, A-13.2, A-13.7, I-01, I-02, I-03, I-06,
I-10.

**Zeigt.** Je Zeile Titel, Status, Tags als Chips mit Ordnerpfad im Tooltip (A-4.3, A-13.3),
Call-Nummer (A-2.6), erfasste Gesamtzeit und deren Aufteilung in offen und exportiert (A-6.6);
Kopfzeile mit Suchfeld, Pool-, Tag- und Statusfilter und Trefferzahl; ein Hinweiszeichen, wenn
eine persönliche Notiz vorhanden ist — nicht deren Inhalt (A-7.2, R-08).

**Bietet an.** Neues Todo anlegen; erledigt setzen und zurücknehmen (A-2.4); Tags direkt in der
Zeile ändern (I-06); Timer starten und stoppen, sofern die Zeilenaktion angeboten wird — dann
mit demselben Verhalten wie überall (A-2.5); Mehrfachauswahl für Tagvergabe; Sortierung.

**Führt zu.** S-03, S-04, S-05, S-08, S-11.

### S-03 — Todo-Detailansicht

**Zweck.** Alles zu einem Todo an einer Stelle: Stammdaten, Tags, persönliche Notiz und die
vollständige Liste seiner Zeitbuchungen.

**Deckt.** A-2.2, A-2.3, A-2.4, A-2.6, A-6.1, A-6.3, A-6.4, A-6.5, A-6.9, A-7.1, A-7.3, I-02,
I-03, I-04, I-05, I-06.

**Zeigt.** Titel, Status, Call-Nummer, Tags, persönliche Notiz mit dem Hinweis, dass sie die
Anwendung nicht verlässt (A-7.2); Summe der erfassten Zeit, getrennt nach offen und exportiert;
die Buchungsliste mit Startzeit, Endzeit, Dauer, gerundetem Exportwert (A-8.3, E-008),
Buchungsnotiz und Exportstatus-Badge je Zeile (A-6.4, A-6.5).

**Bietet an.** Alle Felder bearbeiten (I-02); erledigt setzen (I-03); Timer starten und stoppen
(I-04, I-05); einzelne Buchung bearbeiten, sofern offen, sonst gesperrt mit Begründung (A-6.9);
Buchung manuell als exportiert markieren (I-09); Exportstatus zurücksetzen (E-012); Buchung von
Hand anlegen, weil A-6.3 mehrere Buchungen erlaubt und A-6.1 nicht verlangt, dass alle aus einem
Timer stammen.

**Führt zu.** S-02, S-04, S-05, S-06, S-08.

### S-04 — Kanban-Board

**Zweck.** Der Arbeitsfluss über die konfigurierbaren Statusspalten, mit Zeiterfassung direkt an
der Karte.

**Deckt.** A-5.1 bis A-5.6, A-13.6, I-03, I-05, I-14.

**Zeigt.** Spalten gemäß konfigurierter Statusstruktur mit Kartenzahl je Spalte; je Karte Titel,
Tags, Call-Nummer, erfasste Gesamtzeit, ein Zeichen für laufenden Timer und den zusammengefassten
Exportstatus der Buchungen dieses Todos (A-6.6, siehe B-01); Boardfilter nach Pool, Tag und Suche
(A-3.3, A-13.7).

**Bietet an.** Karte per Drag & Drop verschieben (A-5.2, I-14) und dieselbe Bewegung über
Tastatur oder Kontextmenü (SC 2.5.7); Todo aus der Karte öffnen (A-5.5); Timer an der Karte
starten und stoppen (A-5.6); neues Todo in einer Spalte anlegen (I-01); Spalten konfigurieren
(A-5.4).

**Führt zu.** S-03, S-05, S-09.

### S-05 — Time-Tracking-Ansicht

**Zweck.** Die Arbeitsfläche für den laufenden Tag: was läuft, was heute gebucht wurde, und der
schnellste Weg, eine Buchung zu ergänzen.

**Deckt.** A-6.1, A-6.2, A-6.3, A-6.4, A-6.8, A-7.3, A-13.4, I-04, I-05, I-10.

**Zeigt.** Den laufenden Timer groß mit Todo, mitlaufender Dauer, Startzeit und dem Feld für die
Buchungsnotiz; darunter die Buchungen des gewählten Zeitraums als Tagesliste mit Uhrzeiten,
Dauer, gerundetem Exportwert, Notiz und Exportstatus (A-6.5); Tages- und Wochensumme;
Schnellzugriff auf zuletzt bebuchte Todos.

**Bietet an.** Timer starten, stoppen, auf ein anderes Todo umschalten (A-6.8); Buchung von Hand
anlegen und bearbeiten, solange offen (A-6.9); Buchungsnotiz während des Laufens schreiben;
Zeitraum wechseln.

**Führt zu.** S-03, S-06, S-07.

### S-06 — Übersicht aller Zeitbuchungen

**Zweck.** Die Buchungsebene über alle Todos hinweg — die Ansicht, in der man prüft, was
abgerechnet wurde und was nicht.

**Deckt.** A-6.3, A-6.4, A-6.5, A-6.6, A-6.7, A-6.9, A-8.6, E-012, I-09, I-10.

**Zeigt.** Eine Tabelle mit Datum, Startzeit, Endzeit, Dauer, gerundetem Exportwert, Todo,
Call-Nummer, Buchungsnotiz und Exportstatus; als sekundäres Kennzeichen an einer offenen Buchung
„schon einmal exportiert", wenn ihr Status zurückgesetzt wurde (E-012, R-10); Summen der Auswahl;
die Filterleiste aus I-10 mit aktiven Filtern als entfernbare Chips.

**Bietet an.** Filtern und suchen (I-10); Mehrfachauswahl; als exportiert markieren (I-09);
Exportstatus zurücksetzen (E-012); Buchung bearbeiten oder löschen, solange offen (A-6.9);
Verlauf einer Buchung einsehen (R-10); Auswahl an den Export übergeben (I-11).

**Führt zu.** S-03, S-07.

### S-07 — Export-Ansicht

**Zweck.** Offene Buchungen auswählen, das Ergebnis vor dem Schreiben ansehen und den Export als
einen Vorgang auslösen.

**Deckt.** A-8.1 bis A-8.6, A-8.8, A-8.9, E-008, E-011, I-11, I-15 (Einstieg), R-05, R-10, R-11.

**Zeigt.** Alle noch nicht exportierten Buchungen als Auswahlliste mit Todo, Call-Nummer,
Rohdauer und gerundetem Wert (A-8.3); die gewählte Exportvorlage (A-8.7); die Vorschau in zwei
Spalten — das JSON, wie es geschrieben wird, und daneben dieselben Datensätze in lesbarer Form,
damit die Base64-Notiz prüfbar bleibt (A-8.4, A-8.9); den konfigurierten Zielordner mit vollem
Pfad (E-011); Anzahl und Summe der Auswahl; Warnbanner, wenn die Auswahl schon einmal exportierte
Buchungen enthält (R-10) oder wenn die Vorlage für einzelne Buchungen ein Feld nicht füllen kann
(A-2.6, A-8.7).

**Bietet an.** Auswahl ändern und filtern (I-10); Vorlage wechseln; Vorlage bearbeiten, Sprung
nach S-14 (I-15); Zielordner ändern, Sprung nach S-09 (E-011); exportieren (I-11); nach dem
Export den Zielordner öffnen; den Export-Verlauf einsehen (R-10).

**Führt zu.** S-06, S-09, S-14.

### S-08 — Tag- und Ordnerverwaltung

**Zweck.** Tags anlegen und in einer beliebig tiefen Ordnerstruktur ordnen, ohne dass die Tiefe
die Übersicht kostet.

**Deckt.** A-4.1 bis A-4.6, A-13.3, A-13.6, I-06, I-07, I-08.

**Zeigt.** Den Ordnerbaum links mit auf- und zuklappbaren Knoten, Trefferzahl je Ordner und
vollem Pfad als Brotkrume über dem Inhalt; rechts die Tags des gewählten Ordners mit Name, Farbe,
Pfad und der Anzahl der Todos, die das Tag tragen; eine Suche, die auch tief liegende Tags findet
und dabei ihren Pfad zeigt (A-4.4).

**Bietet an.** Tag und Ordner anlegen, umbenennen, löschen; Tag in einen Ordner verschieben
(I-07); Ordner verschachteln (I-08) mit Zyklusverhinderung bereits beim Ziehen (A-4.6, siehe
B-06); Drag & Drop und gleichwertige Bedienung über Kontextmenü und Tastatur (SC 2.5.7).

**Führt zu.** S-02 (gefiltert auf ein Tag), S-10, S-11.

### S-09 — Einstellungen

**Zweck.** Der Ort für alles, was das Verhalten der Anwendung dauerhaft festlegt.

**Deckt.** A-5.4, A-9.4, A-8.7 (Einstieg), E-009, E-010, E-011, A-13.5.

**Zeigt.** Bereich Export mit Zielordner samt Pfad und Prüfergebnis (vorhanden, beschreibbar),
Standardvorlage und Link nach S-14 (E-011, A-8.7); Bereich Statusstruktur mit den Kanban-Spalten
und der Markierung, welche davon die Abschlussspalte ist (A-5.4, siehe O-02); Bereich
Standard-Tags mit Sprung nach S-10 (A-9.4); Bereich Pools mit Sprung nach S-11; Bereich
Add-in-Zugang mit dem Token, standardmäßig verdeckt (E-009, R-09); Bereich Anwendung mit
Speicherort der Datenbank und Windows-Benutzername als reiner Anzeigewert (E-010).

**Bietet an.** Ordner wählen und prüfen; Spalten anlegen, umbenennen, sortieren, löschen; Token
anzeigen, kopieren, neu erzeugen mit Bestätigungsdialog, weil das alte sofort ungültig wird
(E-009).

**Führt zu.** S-10, S-11, S-14, S-04.

### S-10 — Verwaltung der Standard-Tags

**Zweck.** Festlegen, welche Tags ein neues Todo ohne Zutun mitbringt.

**Deckt.** A-9.1 bis A-9.5, I-12.

**Zeigt.** Die derzeit gesetzten Standard-Tags als geordnete Chipliste mit Ordnerpfad; einen
Auswahlbereich mit dem Tagbaum aus S-08; eine Vorschauzeile „Ein neues Todo bekommt: Intern,
Todo, Nicht abgerechnet" (A-9.2); den Hinweis, dass die Tags auch für Todos aus dem
Outlook-Add-in gelten (A-9.5) und dass bestehende Todos unverändert bleiben (A-9.3, siehe B-11).

**Bietet an.** Tag hinzufügen, entfernen, Reihenfolge ändern; auf Auslieferungszustand
zurücksetzen.

**Führt zu.** S-08, S-09.

### S-11 — Todo-Pool-Konfiguration

**Zweck.** Pools über Tagregeln definieren und sofort sehen, welche Todos hineinfallen.

**Deckt.** A-3.1 bis A-3.4, A-2.5, I-13.

**Zeigt.** Die Liste der Pools mit Name, Regel und aktueller Trefferzahl; im Editor die Regel als
Tagauswahl mit Verknüpfung, darunter eine Live-Vorschau der derzeit passenden Todos (A-3.3); den
Hinweis, dass die Zugehörigkeit abgeleitet ist und ein Todo in mehreren Pools liegen kann (A-3.4,
siehe B-12).

**Bietet an.** Pool anlegen, bearbeiten, umbenennen, löschen mit Bestätigungsdialog, der sagt,
dass keine Todos verloren gehen (A-3.4); Pool in der Navigation anheften; Sprung in die
gefilterte Liste.

**Führt zu.** S-02, S-08.

### S-12 — Outlook-Add-in

**Zweck.** Aus einer geöffneten E-Mail heraus ein Todo anlegen oder auf ein vorhandenes buchen,
ohne Outlook zu verlassen.

**Deckt.** A-10.1 bis A-10.7, A-10.9, A-2.6, A-9.3, A-9.5, I-01, R-09.

**Zeigt.** Titelvorschlag aus dem Betreff; erkannte Call-Nummer mit dem Hinweis, woraus sie
stammt (A-10.8); die Standard-Tags bereits gesetzt und entfernbar (A-9.3, A-9.5); den über die
API geladenen Tag- und Ordnerbaum mit Suche (A-10.4, A-10.5); Feld für die persönliche Notiz mit
demselben Hinweis wie in S-03 (A-7.2); bei Trefferfall die Karte des vorhandenen Todos mit
derselben Call-Nummer samt Status, Tags und Exportstatus seiner Buchungen (A-10.9, siehe B-04).

**Bietet an.** Todo anlegen; stattdessen auf das vorhandene Todo buchen (A-10.9); Inhalte aus der
E-Mail übernehmen; Verbindung prüfen; Sprung in die Add-in-Einstellungen.

**Führt zu.** S-13.

### S-13 — Einstellungen des Outlook-Add-ins

**Zweck.** Verbindung zur lokalen Anwendung herstellen und die Call-Nummer-Erkennung einstellen.

**Deckt.** A-10.3, A-10.8, E-009, R-09.

**Zeigt.** Adresse des lokalen Dienstes; das Zugangstoken als verdecktes Eingabefeld mit
Verbindungsstatus (E-009); den regulären Ausdruck für die Call-Nummer als Eingabefeld mit
Testbereich, in dem ein Beispieltext eingegeben und das Trefferergebnis sofort gezeigt wird
(A-10.8); Angaben zur zuletzt erfolgreichen Verbindung.

**Bietet an.** Token eintragen und prüfen; regulären Ausdruck ändern und testen; auf
Auslieferungswert zurücksetzen.

**Führt zu.** S-12.

### S-14 — Editor für Exportvorlagen

**Zweck.** Festlegen, welche Felder der Export enthält, und das Ergebnis an echten offenen
Buchungen prüfen, bevor es zur Abrechnung geht.

**Deckt.** A-8.7, A-8.2 bis A-8.5, E-005, E-008, R-06, I-15.

**Zeigt.** Links die Vorlagenliste mit der nicht löschbaren Standardvorlage (A-8.7); in der Mitte
die geordnete Feldliste mit Name, Quelle, Transformation und Bedingung je Zeile; rechts die
Live-Vorschau auf tatsächlich offenen Buchungen, wieder zweispaltig als JSON und lesbar (A-8.7,
A-8.4); unter der Quellenauswahl den festen Hinweis, dass die persönliche Todo-Notiz nicht
exportierbar ist (A-7.2, R-06).

**Bietet an.** Vorlage anlegen, kopieren, umbenennen, löschen außer der Standardvorlage (A-8.7);
Feld hinzufügen, entfernen, per Drag & Drop und per Tastatur umsortieren (A-13.6, SC 2.5.7);
Quelle, Transformation und Bedingung setzen; Vorschau auf eine andere Buchung umschalten;
speichern und verwerfen.

**Führt zu.** S-07, S-09.

---

## 2. Zustandsmatrix

§15 verlangt Empty States, Loading States, Hover States, aktive Zustände, Fehlermeldungen und
Bestätigungsdialoge ausdrücklich. Fehlt einer davon in der Umsetzung, ist das ein Verstoß gegen
§15 und kein Verbesserungsvorschlag. Die Zellen nennen, was zu sehen ist, nicht dass etwas zu
sehen ist.

Zwei Regeln gelten für alle Screens und werden nicht je Zeile wiederholt:

- **Hover heißt Hover und Fokus.** Jede Zustandsänderung bei Zeigerkontakt hat dieselbe Wirkung
  bei Tastaturfokus, und Zusatzinhalte bei Hover bleiben erreichbar und schließbar (SC 1.4.13,
  SC 2.4.11). Ein reiner Hover-Zustand erfüllt §15 nicht, weil A-13.9 zwar Desktop meint,
  A-13.8 aber Responsivität verlangt.
- **Fehlermeldungen sagen drei Dinge.** Was nicht ging, welche Folge das für die Daten hat, und
  was jetzt zu tun ist (SC 3.3.3). Die mittlere Angabe ist bei allem, was mit Export zu tun hat,
  Pflicht, weil A-8.8 Ganz-oder-gar-nicht zusagt und der Benutzer das nur glauben kann, wenn es
  dasteht.

### S-01 Dashboard

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Frische Installation, keine Todos, keine Buchungen: Karte „Noch nichts erfasst" mit drei Schritten — erstes Todo anlegen, Standard-Tags prüfen (S-10), Exportordner festlegen (S-09) — jeder als Schaltfläche. Nicht „keine Daten". |
| Loading | Kacheln als Platzhalter in ihrer späteren Größe, damit das Layout nicht springt; der laufende Timer wird zuerst gefüllt, weil er die einzige Angabe ist, die sich pro Sekunde ändert (A-13.4). Nach zehn Sekunden zusätzlich „Datenbank antwortet nicht wie erwartet" mit Wiederholen. |
| Hover/Fokus | Kachel hebt sich an und zeigt ihre Zielansicht als Beschriftung, etwa „Zur Export-Ansicht"; Zeile eines zuletzt bearbeiteten Todos zeigt die Zeilenaktionen Timer starten und öffnen. |
| Aktiv | Läuft ein Timer, ist die Timerkachel dauerhaft hervorgehoben, die Dauer läuft sekundenweise mit, der Titel des Todos steht darin; die zugehörige Zeile in der Liste ist ebenfalls markiert. |
| Fehler | „Die Kennzahlen konnten nicht geladen werden. Deine Daten sind unverändert." mit Wiederholen; eine einzelne scheiternde Kachel zeigt den Fehler in sich, statt den ganzen Screen zu ersetzen. |
| Bestätigung | Timer stoppen öffnet den Buchungsdialog aus I-04, keinen reinen Bestätigungsdialog; Timer auf einem erledigten Todo starten öffnet keinen Dialog (A-2.5, siehe B-02), sondern meldet danach. |

### S-02 Todo-Liste

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Zwei getrennt formulierte Fälle (B-13). Ohne Todos: „Noch keine Todos. Neue Todos bekommen automatisch die Tags Intern, Todo, Nicht abgerechnet." mit „Todo anlegen" und Link nach S-10. Mit Filter ohne Treffer: „Keine Treffer für Pool ‚Kunde Nord' und Tag ‚Prio hoch'." mit „Filter zurücksetzen" und der Gesamtzahl ohne Filter. |
| Loading | Fünf bis acht Platzhalterzeilen in Zeilenhöhe; die Filterleiste ist schon bedienbar, die Trefferzahl steht auf „…"; kein Vollbild-Spinner. |
| Hover/Fokus | Zeile bekommt Hintergrund, die Zeilenaktionen werden sichtbar statt zu erscheinen — sie belegen auch im Ruhezustand Platz, damit nichts springt; Tag-Chip zeigt seinen vollen Ordnerpfad (A-4.3, A-13.3). |
| Aktiv | Zeile des Todos mit laufendem Timer trägt einen Balken am linken Rand und die mitlaufende Dauer; ausgewählte Zeilen sind markiert, die Aktionsleiste unten zeigt „3 ausgewählt". |
| Fehler | Beim Speichern einer Zeilenänderung: die Zeile kehrt sichtbar zum alten Wert zurück und zeigt „Änderung nicht gespeichert" mit Wiederholen; die Liste bleibt bedienbar. |
| Bestätigung | Löschen eines Todos mit Buchungen: „Dieses Todo hat 4 Zeitbuchungen, davon 2 bereits exportiert. Beim Löschen gehen sie mit verloren." Abbrechen ist vorbelegt. Ohne Buchungen genügt ein Toast mit Rückgängig. |

### S-03 Todo-Detailansicht

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Todo ohne Buchungen: „Für dieses Todo ist noch keine Zeit erfasst." mit „Timer starten" und „Buchung von Hand anlegen" (A-6.1, A-6.3). Leere persönliche Notiz zeigt den Platzhalter „Nur für dich. Wird nie exportiert." (A-7.2). |
| Loading | Kopfbereich zuerst, Buchungsliste als Platzhalterzeilen nach; Felder sind währenddessen schreibgeschützt, damit keine Eingabe verloren geht. |
| Hover/Fokus | Buchungszeile zeigt ihre Aktionen; über der Dauer erscheint „00:03 wird als 0,25 exportiert" (A-8.3, E-008); über einem gesperrten Feld der Grund „Bereits exportiert am 12.03.2026" (A-6.9). |
| Aktiv | Läuft der Timer für dieses Todo, steht oben ein laufender Balken mit Stoppschaltfläche und dem Feld für die Buchungsnotiz; geänderte, ungespeicherte Felder sind gekennzeichnet. |
| Fehler | Speichern schlägt fehl: feldweise Meldung unter dem betroffenen Feld, Text bleibt erhalten. Versuch, eine exportierte Buchung zu ändern: „Diese Buchung ist als exportiert markiert und deshalb gesperrt. Du kannst den Exportstatus zurücksetzen, dann wird sie erneut abgerechnet." (A-6.9, E-012). |
| Bestätigung | Verlassen mit ungespeicherten Änderungen; Löschen einer Buchung; Zurücksetzen des Exportstatus (Wortlaut in 3.2); Erledigt setzen bei laufendem Timer (Wortlaut in 3.5). |

### S-04 Kanban-Board

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Board leer: „Noch keine Todos auf dem Board" mit „Todo anlegen" in der ersten Spalte. Einzelne leere Spalte: gestrichelter Rahmen mit Spaltenname und „Karte hierher ziehen oder hier anlegen" — die Spalte bleibt sichtbar, sonst ist sie kein Ablageziel mehr (A-5.2). Keine Spalten konfiguriert: Hinweis mit Link nach S-09 (A-5.4). |
| Loading | Spaltenköpfe mit Namen sofort, Karten als Platzhalter in Kartenhöhe; Ziehen ist bis zum Ende gesperrt, damit kein Ziehen ins Leere passiert. |
| Hover/Fokus | Karte hebt sich leicht an und zeigt Timer- und Öffnen-Aktion; die Spalte unter dem Zeiger bekommt während des Ziehens einen farbigen Rahmen und einen Einfügeplatzhalter an der Zielposition. |
| Aktiv | Gezogene Karte folgt dem Zeiger und lässt an ihrer Herkunft eine Lücke; die Karte mit laufendem Timer trägt ein dauerhaftes Zeichen und die mitlaufende Dauer; die aktive Spalte bei Tastaturbedienung ist umrandet und wird angesagt. |
| Fehler | Verschieben schlägt fehl: die Karte springt sichtbar in die Ausgangsspalte zurück und meldet „Status nicht geändert" mit Wiederholen — sie bleibt nicht in der Zielspalte stehen. |
| Bestätigung | Ziehen in die Abschlussspalte bei laufendem Timer: derselbe Dialog wie I-03. Löschen einer Spalte mit Karten: „In ‚Waiting' liegen 6 Todos. Wohin sollen sie?" mit Zielauswahl (A-5.4). |

### S-05 Time-Tracking-Ansicht

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Kein Timer, keine Buchung heute: „Heute noch nichts erfasst" mit einer Auswahl der zuletzt bebuchten Todos zum Direktstart und „Buchung von Hand anlegen". |
| Loading | Der Timerbereich ist zuerst da, weil er der Grund für den Besuch ist; die Tagesliste lädt als Platzhalter; Tages- und Wochensumme stehen bis dahin auf „…". |
| Hover/Fokus | Buchungszeile zeigt Bearbeiten und Löschen; über der Dauer die Rundungserklärung (E-008); über dem Exportstatus-Badge das Exportdatum oder „noch offen". |
| Aktiv | Der laufende Timer ist der optisch stärkste Punkt der Seite, mit Todo-Titel, Startzeit, mitlaufender Dauer und dem Notizfeld, das ausdrücklich als abrechnungsrelevant beschriftet ist (A-7.4, R-08). |
| Fehler | Timer startet nicht: „Der Timer wurde nicht gestartet." und der vorherige Zustand bleibt unverändert — kein halb gestarteter Timer (A-6.8). Beim Stoppen bleibt die Notiz im Feld und der Timer läuft weiter, bis das Speichern gelingt. |
| Bestätigung | Start bei bereits laufendem Timer (A-6.8, Wortlaut in 3.5); Löschen einer Buchung; Verwerfen einer angefangenen Buchungsnotiz. |

### S-06 Übersicht aller Zeitbuchungen

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Ohne Buchungen: „Noch keine Zeitbuchungen. Starte einen Timer an einem Todo oder lege eine Buchung von Hand an." Mit Filter ohne Treffer: „Keine Buchungen im Zeitraum 01.–07.08. mit Status ‚offen'." plus „Filter zurücksetzen" und Gesamtzahl. Filter „offen" ohne Treffer bekommt zusätzlich die Entwarnung „Alles exportiert." (A-6.6). |
| Loading | Kopfzeile und Filter sofort, Zeilen als Platzhalter; die Summenzeile bleibt leer, statt eine falsche Zwischensumme zu zeigen. |
| Hover/Fokus | Zeile zeigt Aktionen; das Exportstatus-Badge zeigt Datum und Dateiname des Exports; das Zusatzkennzeichen „schon einmal exportiert" zeigt die Kette „exportiert am … / zurückgesetzt am …" (R-10). |
| Aktiv | Ausgewählte Zeilen markiert, Aktionsleiste zeigt „7 ausgewählt · 5,25 h · davon 2 exportiert" — die letzte Angabe verhindert, dass jemand eine gemischte Auswahl unbemerkt weiterverarbeitet (A-6.6). |
| Fehler | Statuswechsel scheitert: die Zeile zeigt wieder den alten Status und die Meldung „Status nicht geändert. Es wurde nichts exportiert." |
| Bestätigung | Als exportiert markieren (3.2); Exportstatus zurücksetzen (3.2); Löschen einer exportierten Buchung ist gesperrt, nicht bestätigbar (A-6.9). |

### S-07 Export-Ansicht

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Keine offenen Buchungen: „Alles exportiert. Zuletzt am 31.08.2026 um 14:32, 8 Buchungen, 6,25 h." mit Link auf den Verlauf — eine Erfolgsmeldung, keine Leere. Kein Zielordner gesetzt: blockierender Zustand „Bevor du exportieren kannst, wähle einen Zielordner" mit Schaltfläche nach S-09 (E-011), nicht erst als Fehler nach dem Klick. |
| Loading | Auswahlliste als Platzhalter; die Vorschau zeigt „Vorschau wird erzeugt" und behält ihre Größe; während des Schreibens ist der Screen gesperrt, die Schaltfläche zeigt „Wird geschrieben …", die Liste ist nicht änderbar (A-8.8). |
| Hover/Fokus | Zeile der Auswahlliste hebt in der Vorschau den zugehörigen Datensatz hervor und umgekehrt — nur so ist prüfbar, welche Buchung welchen JSON-Block erzeugt. Über einem Base64-Wert steht der Klartext (A-8.4, A-8.9). |
| Aktiv | Ausgewählte Zeilen markiert; Kopfzeile zeigt „8 von 11 Buchungen · 6,25 h · Vorlage ‚Standard' · Ziel C:\Takt\Export"; enthält die Auswahl schon einmal exportierte Buchungen, steht darüber ein Warnbanner (R-10). |
| Fehler | Fünf Fälle, jeweils mit dem Satz „Es wurde nichts exportiert und keine Buchung markiert." (A-8.8): Ordner fehlt, Ordner nicht beschreibbar, Netzlaufwerk nicht erreichbar (R-11), Vorlage liefert für eine Buchung ein verlangtes Feld nicht (A-2.6), Schreiben abgebrochen. Jeder Fall nennt den Pfad und die passende Abhilfe. |
| Bestätigung | Vor dem Schreiben: „8 Buchungen (6,25 h) werden nach C:\Takt\Export\takt-export-2026-08-31-1432.json geschrieben und danach als exportiert markiert. Die Datei enthält lesbare Kundennotizen." (A-8.8, A-8.9, R-05). Zusatzsatz, wenn zurückgesetzte Buchungen dabei sind (R-10). |

### S-08 Tag- und Ordnerverwaltung

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Keine Tags: „Noch keine Tags. Tags sind die Grundlage für Pools, Projekte und Filter." mit „Tag anlegen" und „Ordner anlegen" (A-4.5). Leerer Ordner: „In ‚Kunden/Nord' liegt noch nichts" mit beiden Schaltflächen — der Ordner bleibt als Ablageziel sichtbar (I-07). |
| Loading | Der Baum lädt ebenenweise; ein Knoten, dessen Kinder noch kommen, zeigt den Platzhalter an der Stelle, an der sie erscheinen, nicht an der Wurzel. |
| Hover/Fokus | Knoten zeigt seine Aktionen und den vollen Pfad; beim Ziehen wird ein gültiges Ziel farbig umrandet, ein ungültiges bleibt unverändert und der Zeiger zeigt Verbot (A-4.6). |
| Aktiv | Gewählter Ordner ist im Baum markiert und steht als Brotkrume über der Tagliste; aufgeklappte Knoten sind am Pfeil erkennbar; der Knoten mit Tastaturfokus ist deutlich umrandet (SC 2.4.11). |
| Fehler | Ein Verschieben, das einen Zyklus erzeugen würde, ist gar nicht erst möglich (A-4.6); scheitert es anderweitig, springt der Knoten sichtbar zurück mit „Verschieben nicht gespeichert". Namenskonflikt im selben Ordner: Meldung unter dem Feld mit Namensvorschlag. |
| Bestätigung | Ordner mit Inhalt löschen: „In ‚Kunden' liegen 3 Unterordner und 14 Tags. Die Tags sind an 62 Todos vergeben." mit den Möglichkeiten Inhalt verschieben oder alles löschen. Vergebenes Tag löschen: Anzahl der betroffenen Todos und Hinweis, welche Pools dadurch leerer werden (A-3.2, A-3.4). |

### S-09 Einstellungen

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Kein echter Leerzustand; unausgefüllte Pflichtangaben sind gekennzeichnet: „Zielordner: nicht gesetzt — Export ist bis dahin nicht möglich" (E-011), „Add-in-Token: noch nicht erzeugt" (E-009). |
| Loading | Werte als Platzhalter; die Prüfung des Zielordners läuft sichtbar als eigener Vorgang mit „Ordner wird geprüft …". |
| Hover/Fokus | Über dem Zielordner erscheint der vollständige Pfad, auch wenn er gekürzt dargestellt ist; über dem verdeckten Token steht „Zum Anzeigen klicken", nicht der Wert (R-09). |
| Aktiv | Der zuletzt geänderte Bereich ist kurz hervorgehoben; ein geänderter, ungespeicherter Wert ist gekennzeichnet; das Token ist nur sichtbar, solange es ausdrücklich angezeigt wird, und verdeckt sich wieder. |
| Fehler | Zielordner fehlt oder ist nicht beschreibbar: Meldung am Feld mit Pfad und der Folge „Export ist damit nicht möglich" (E-011, R-11). Token-Neuerzeugung scheitert: das alte Token bleibt gültig, und das steht in der Meldung. |
| Bestätigung | Token neu erzeugen: „Das bisherige Token wird sofort ungültig. Das Outlook-Add-in verbindet sich erst wieder, wenn du das neue Token dort einträgst." (E-009). Abschlussspalte wechseln: Hinweis auf die Folge für bereits erledigte Todos (A-5.4, O-02). |

### S-10 Verwaltung der Standard-Tags

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Keine Standard-Tags gesetzt: „Neue Todos bekommen derzeit keine Tags automatisch." mit dem Beispiel aus A-9.2 als Vorschlag zum Übernehmen. |
| Loading | Chipliste als Platzhalter, der Tagbaum lädt wie in S-08. |
| Hover/Fokus | Chip zeigt seinen Ordnerpfad und ein Entfernen-Kreuz; ein bereits gesetztes Tag im Auswahlbaum zeigt „bereits Standard". |
| Aktiv | Gesetzte Tags sind im Auswahlbaum markiert; die Vorschauzeile aktualisiert sich bei jeder Änderung sofort. |
| Fehler | Speichern scheitert: die Chipliste kehrt zum gespeicherten Stand zurück mit „Standard-Tags nicht geändert". Ein zwischenzeitlich gelöschtes Tag wird als ungültig markiert, statt still zu verschwinden. |
| Bestätigung | Alle Standard-Tags entfernen: „Neue Todos bekommen dann keine Tags mehr. Das betrifft auch Todos aus dem Outlook-Add-in." (A-9.5). |

### S-11 Todo-Pool-Konfiguration

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Keine Pools: „Noch keine Pools. Ein Pool ist eine Tagregel — alle Todos mit dem Tag ‚Kunde Nord' zum Beispiel." mit „Pool anlegen" (A-3.2). Pool ohne Treffer: „Diese Regel trifft derzeit auf kein Todo zu." mit der Regel im Klartext. |
| Loading | Poolliste als Platzhalter; die Trefferzahl je Pool erscheint nach, ohne dass die Zeile springt. |
| Hover/Fokus | Poolzeile zeigt Bearbeiten, Löschen und „Todos anzeigen"; über der Trefferzahl steht die Regel im Klartext. |
| Aktiv | Der bearbeitete Pool ist markiert, die Live-Vorschau zeigt die passenden Todos, die Zahl ändert sich bei jeder Regeländerung mit. |
| Fehler | Regel ohne Tag: „Wähle mindestens ein Tag." am Feld; Speichern scheitert: alter Stand kehrt sichtbar zurück. |
| Bestätigung | Pool löschen: „Der Pool wird entfernt. Die 23 Todos bleiben unverändert, sie sind nur nicht mehr über diesen Pool erreichbar." (A-3.4). |

### S-12 Outlook-Add-in

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Keine E-Mail geöffnet: „Öffne eine E-Mail, um daraus ein Todo anzulegen." Keine Tags vorhanden: das Todo lässt sich trotzdem anlegen, mit Hinweis, dass nur die Standard-Tags gesetzt werden (A-9.5). Keine Call-Nummer erkannt: leeres Feld mit „Keine Call-Nummer im Text gefunden — du kannst sie eintragen" (A-2.6, A-10.8). |
| Loading | Der Tag- und Ordnerbaum kommt über die API und braucht sichtbar Zeit: Platzhalterbaum plus „Tags werden geladen" (A-10.4); Titel und Call-Nummer stehen vorher schon, weil sie aus der E-Mail stammen. |
| Hover/Fokus | Tag im Baum zeigt seinen Pfad; die Karte des vorhandenen Todos bei Call-Treffer zeigt „In Takt öffnen". |
| Aktiv | Gewählte Tags als Chips oben; die Standard-Tags sind vorbelegt und als solche gekennzeichnet, damit erkennbar ist, dass sie nicht vom Benutzer stammen (A-9.3, A-9.5). |
| Fehler | Keine Verbindung: „Takt ist nicht erreichbar. Läuft die Anwendung?" mit Link nach S-13 und Wiederholen; Token ungültig: „Das hinterlegte Token wird nicht akzeptiert." ohne den Wert zu nennen (R-09); Anlegen scheitert: die Eingaben bleiben stehen. |
| Bestätigung | Bei vorhandener Call-Nummer eine Wahl, keine stille Entscheidung: „Zu Call 4711 gibt es bereits das Todo ‚Rechnungslauf hängt'. Darauf buchen oder trotzdem ein neues Todo anlegen?" (A-10.9). |

### S-13 Einstellungen des Outlook-Add-ins

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Kein Token eingetragen: „Noch nicht verbunden. Das Token findest du in Takt unter Einstellungen." mit der Schrittfolge (E-009). |
| Loading | Beim Prüfen: „Verbindung wird geprüft …" an der Schaltfläche, die Felder bleiben lesbar. |
| Hover/Fokus | Über dem Feld für den regulären Ausdruck steht ein Beispiel; über dem Verbindungszeichen der Zeitpunkt der letzten erfolgreichen Verbindung. |
| Aktiv | Der Testbereich zeigt den Treffer im Beispieltext hervorgehoben, sobald der Ausdruck gültig ist (A-10.8). |
| Fehler | Ungültiger regulärer Ausdruck: „Der Ausdruck ist nicht gültig" mit der Stelle, ohne den gespeicherten Ausdruck zu überschreiben; Verbindung schlägt fehl: Grund in Worten, nie mit Tokenwert (R-09). |
| Bestätigung | Ausdruck auf Auslieferungswert zurücksetzen; Token ersetzen, wenn bereits eines eingetragen ist. |

### S-14 Editor für Exportvorlagen

| Zustand | Was zu sehen ist |
|---|---|
| Empty | Nur die Standardvorlage vorhanden: „Es gibt bisher nur die Standardvorlage. Sie lässt sich nicht ändern, aber kopieren." mit „Standardvorlage kopieren" (A-8.7). Neue Vorlage ohne Felder: „Noch kein Feld. Füge das erste hinzu — die Vorschau zeigt sofort, was dabei herauskommt." Keine offenen Buchungen für die Vorschau: ausdrücklich gekennzeichnete Beispieldaten mit dem Satz „Beispieldaten, weil derzeit keine offenen Buchungen vorliegen" (B-09). |
| Loading | Feldliste zuerst, Vorschau als Platzhalter mit „Vorschau wird erzeugt"; bei jeder Änderung wird die Vorschau neu berechnet, ohne dass die Feldliste den Fokus verliert. |
| Hover/Fokus | Feldzeile zeigt Griff, Duplizieren und Löschen; über einer Quelle steht ihr Beispielwert aus der gerade gezeigten Buchung; über einer Transformation ihre Wirkung, etwa „0:03 → 0,25" (E-008) oder „UTF-8 nach Base64" (A-8.4). |
| Aktiv | Bearbeitetes Feld ist markiert und im Vorschau-JSON hervorgehoben; die gezogene Feldzeile hinterlässt eine Lücke und zeigt ihre Zielposition; ungespeicherte Änderungen sind am Vorlagennamen gekennzeichnet. |
| Fehler | Doppelter Feldname, leerer Name, fehlende Quelle, Transformation passt nicht zur Quelle, ungültige Bedingung — jeweils an der Feldzeile, und die Vorschau zeigt für den betroffenen Datensatz „Feld kann nicht erzeugt werden", statt zu verschwinden. Erzeugt die Vorlage für jede Buchung ein leeres Objekt: Warnung über der Vorschau. |
| Bestätigung | Vorlage löschen; Editor mit ungespeicherten Änderungen verlassen; Vorlage löschen, die in S-07 gerade ausgewählt ist: zusätzlich die Frage, welche stattdessen gelten soll. Die Standardvorlage bietet kein Löschen an, sie zeigt es gesperrt mit Begründung (A-8.7). |

---

## 3. Klickpfade I-01 bis I-15

### 3.0 Zustandsregeln, aus denen die Pfade folgen

Weil es keinen Code gibt, ist der erste Schritt einer Klickpfad-Prüfung — die Karte der
Nebenwirkungen je Zustandsänderung — hier eine Vorgabe. Sie ist der Grund, warum die Pfade
unten so und nicht anders aussehen.

| Vorgang | Setzt | Darf nicht zurücksetzen |
|---|---|---|
| `timerStarten(todo)` | laufender Timer, offene Buchung mit Startzeit; bei erledigtem Todo zusätzlich Erledigt-Flag auf falsch (A-2.5) | Auswahl, Filter, ungespeicherte Feldeingaben, Notizentwurf |
| `timerStoppen(notiz)` | Endzeit, Dauer, Buchungsnotiz, Exportstatus offen (A-6.4, A-6.5) | Erledigt-Flag, Status des Todos |
| `todoAuswaehlen(id)` | gewähltes Todo | laufender Timer, Auswahl in S-06, Filter |
| `alsExportiertMarkieren(ids)` | Exportstatus exportiert, Sperre nach A-6.9 | Auswahl anderer Zeilen, Filter |
| `exportstatusZuruecksetzen(id)` | Exportstatus offen, Zusatzkennzeichen „schon einmal exportiert" (E-012, R-10) | Buchungsdaten, Notiz |
| `exportieren(auswahl)` | erst nach erfolgreichem Schreiben: Exportstatus aller enthaltenen Buchungen (A-8.8) | nichts vorab — keine vorgezogene Kennzeichnung |
| `tagsAendern(todo)` | Tags | Poolzugehörigkeit als gespeicherter Wert, weil es keine gibt (A-3.4) |

Drei Regeln, deren Verletzung genau die Fehlerklasse erzeugt, für die diese Prüfung gedacht ist:

1. **Poolzugehörigkeit, Spaltenzuordnung und Kennzahlen sind abgeleitet, nicht zwischengespeichert**
   (A-3.4). Wer sie beim Laden einmal berechnet und in einer eigenen Ablage hält, bekommt genau
   den Fehler aus B-03: A-2.5 hebt „Erledigt" auf, das Todo ist aktiv, taucht aber nicht wieder
   im Pool auf, weil niemand die Ableitung neu gerechnet hat. Jede der drei Wirkungen von A-2.5
   funktioniert einzeln, die Kette bricht trotzdem.
2. **Kein Screen hält eine eigene Kopie eines Todos oder einer Buchung.** Detailansicht,
   Kanban-Karte, Dashboardkachel und Zeiterfassung lesen denselben Zustand, sonst zeigt eine
   Ansicht „Erledigt" und die andere nicht.
3. **Nichts wird vorab als geschehen dargestellt, was noch scheitern kann.** Das betrifft den
   Export (A-8.8) und den Timerwechsel (A-6.8): Wird ein Bestätigungsdialog abgebrochen, hat sich
   an keiner Stelle etwas geändert.

### 3.1 I-05 — Timer auf einem erledigten Todo starten (kritisch)

**Anforderung.** A-2.5 nennt drei Wirkungen: der Erledigt-Status wird aufgehoben, das Todo wird
wieder aktiv, und es landet erneut in seinem Pool. A-3.4 erklärt, wie die dritte zustande kommt.
A-5.6, A-6.2 und §12 legen fest, wo ein Timer startbar ist.

**Startpunkte, an denen die Folge identisch sein muss.** S-03 Detailansicht (A-6.1, A-6.2), S-04
Kanban-Karte (A-5.6), S-05 Zeiterfassung (A-6.2), S-01 Dashboard (§12), S-02 Todo-Liste, sofern
sie eine Zeilenaktion anbietet, und S-12 Add-in, wenn dort auf ein vorhandenes erledigtes Todo
gebucht wird (A-10.9). Der letzte ist der, der erfahrungsgemäß vergessen wird (B-04).

**Zustandsfolge.**

1. **Ausgangszustand.** Todo T ist erledigt (A-2.4): Erledigt-Kennzeichen sichtbar, Karte in der
   Abschlussspalte, in einer nach Pool gefilterten Liste nicht enthalten, in der Kachel „erledigte
   Todos" mitgezählt.
2. **Klick auf „Timer starten".** Die Schaltfläche geht sofort in den Wartezustand, bleibt aber
   an ihrem Platz und behält ihre Breite.
3. **Prüfung A-6.8.** Läuft ein anderer Timer, erscheint der kombinierte Dialog aus 3.5 —
   ein Dialog, nicht zwei hintereinander (Annahme AN-03). Abbruch führt zurück zu Schritt 1,
   und zwar vollständig: kein aufgehobenes Erledigt, kein gestarteter Timer.
4. **Kein Bestätigungsdialog für die Reaktivierung.** A-2.5 sagt „automatisch". Ein Dialog wäre
   eine Abweichung, kein Zusatznutzen (B-02).
5. **Wirkung 1 (A-2.5).** Erledigt-Kennzeichen verschwindet — in derselben Interaktion an allen
   sichtbaren Stellen, nicht erst nach einem Wechsel der Ansicht.
6. **Wirkung 2 (A-2.5).** Das Todo ist aktiv: es erscheint in der Liste offener Todos, die Karte
   verlässt die Abschlussspalte, die Dashboardzahlen verschieben sich um eins.
7. **Wirkung 3 (A-2.5, A-3.4).** Das Todo erscheint erneut in jedem Pool, dessen Regel seine Tags
   erfüllen. Steht der Benutzer gerade in einer poolgefilterten Ansicht, erscheint es dort ohne
   Neuladen. Trifft es mehrere Pools, werden alle genannt (B-12).
8. **Timer läuft.** Die globale Timerleiste zeigt Todo-Titel und mitlaufende Dauer (§14, A-13.4).
9. **Rückmeldung, die alle drei Wirkungen ausspricht.** Toast: „Timer gestartet. »Rechnungslauf
   hängt« ist wieder offen und zurück im Pool »Kunde Nord«." mit „Rückgängig". Derselbe Satz geht
   in einen `aria-live`-Bereich (SC 4.1.3), weil die Änderung sonst für Screenreader unsichtbar
   bleibt. Ohne diesen Satz erfüllt die Umsetzung A-2.5 datenseitig und lässt den Benutzer
   trotzdem im Unklaren (B-02).
10. **Rückgängig.** Solange der Toast steht (zehn Sekunden, angehalten bei Hover und Fokus,
    SC 2.2.1): Timer stoppen, die eben entstandene Buchung verwerfen, Erledigt wiederherstellen.
    Das Verwerfen ist richtig und nicht datenverlustträchtig, weil eine Buchung von Sekunden nach
    E-008 auf 0,25 aufgerundet würde und damit eine Viertelstunde abrechnen würde, die es nicht
    gab. Der Toast sagt das in seiner Beschriftung.

**Prüfung je Startpunkt.**

| Startpunkt | Was zusätzlich sichtbar werden muss | Typischer Bruch |
|---|---|---|
| S-03 Detail | Erledigt-Schalter kippt an Ort und Stelle; Statusfeld zeigt den neuen Status; neue offene Buchungszeile erscheint oben | Detailansicht arbeitet mit dem beim Öffnen geladenen Todo und zeigt weiter „Erledigt" |
| S-04 Karte | Karte wechselt in derselben Interaktion die Spalte, Zähler beider Spalten ändern sich, Timerzeichen erscheint | Spaltenzuordnung einmal beim Laden gruppiert: die Karte bleibt mit laufendem Timer in der Abschlussspalte stehen |
| S-05 Zeiterfassung | Das Todo war womöglich gar nicht sichtbar, weil die Ansicht offene Todos zeigt; es muss erscheinen und in den Blick gerückt werden | Timer läuft für ein Todo, das nirgends auf dem Bildschirm steht |
| S-01 Dashboard | „erledigte Todos" minus eins, „offene Todos" plus eins, Timerkachel gefüllt | Kacheln nur beim Betreten geladen, Zahlen bleiben falsch stehen |
| S-02 Liste | Zeile verlässt den Erledigt-Filter beziehungsweise erscheint im Pool-Filter, mit Hinweis, wohin sie gegangen ist | Zeile verschwindet kommentarlos und wirkt gelöscht |
| S-12 Add-in | Antwort der API enthält die Reaktivierung; das Add-in zeigt denselben Satz wie die Anwendung (A-10.9, A-2.5) | Add-in meldet nur „gebucht" und verschweigt, dass ein abgeschlossenes Todo wieder offen ist |

### 3.2 I-09 und E-012 — als exportiert markieren und zurücksetzen (kritisch)

**Weg A, manuelles Markieren (I-09).** Für Zeiten, die außerhalb von Takt abgerechnet wurden.

1. In S-06 Zeilen auswählen; die Aktionsleiste zeigt Anzahl, Summe und wie viele davon schon
   exportiert sind (A-6.6).
2. „Als exportiert markieren".
3. Bestätigungsdialog, weil A-6.9 die Buchungen danach sperrt: „3 Buchungen (2,50 h) werden als
   exportiert markiert. Sie sind danach nicht mehr bearbeitbar und werden beim nächsten Export
   nicht mehr berücksichtigt. Es wird keine Datei erzeugt." Der letzte Satz ist wichtig, sonst
   sucht jemand hinterher die Datei.
4. Nach Bestätigung: Badge wechselt an allen Orten aus Abschnitt 4, Zeilen werden schreibgeschützt
   mit erkennbarer Begründung, die Auswahl wird geleert, Toast mit „Rückgängig".
5. Rückgängig innerhalb des Toastfensters stellt den vorherigen Zustand her und setzt **kein**
   Kennzeichen „schon einmal exportiert", weil nie exportiert wurde. Danach ist nur noch Weg B
   möglich (Annahme AN-04).

**Weg B, Exportstatus zurücksetzen (E-012, R-10).** Der Weg mit Geldfolge.

1. Startpunkte: Zeilenmenü in S-06, Buchungszeile in S-03, Verlauf in S-07. An allen dreien
   derselbe Dialog.
2. Bestätigungsdialog, der die Folge ausspricht statt sie zu umschreiben: „Diese Buchung wurde am
   12.03.2026 exportiert, Datei `takt-export-2026-03-12-0914.json`. Nach dem Zurücksetzen geht sie
   beim nächsten Export erneut an die Abrechnung. Ist sie dort bereits verbucht, entsteht eine
   Doppelabrechnung." Die auslösende Schaltfläche ist als eingreifend gestaltet und heißt
   „Zurücksetzen und erneut exportierbar machen"; der Fokus liegt auf „Abbrechen" (SC 3.3.4 dem
   Sinn nach, weil die Handlung eine finanzielle Verpflichtung auslöst).
3. Nach Bestätigung bleibt der Exportstatus zweiwertig (A-6.9): er steht auf offen. Das „schon
   einmal exportiert" ist ein **zusätzliches** Kennzeichen mit eigenem Aussehen, kein dritter
   Statuswert — sonst wäre A-6.9 verletzt (B-07).
4. Die Buchung ist wieder bearbeitbar (A-6.9) und erscheint wieder in der Auswahl von S-07 — dort
   sichtbar abgesetzt und mit Warnbanner über der Liste (R-10).
5. Der Vorgang wird protokolliert (R-10). Damit „nachvollziehbar" nicht nur in der Datenbank gilt,
   braucht das Protokoll einen Ort in der Oberfläche: der Verlauf je Buchung in S-06 und der
   Export-Verlauf in S-07. Ohne diesen Ort ist R-10 nicht abgedeckt (B-08).

### 3.3 I-11 — Export von der Auswahl bis zur Datei (kritisch)

1. **S-07 öffnen.** Ladezustand. Ist kein Zielordner gesetzt, erscheint der blockierende
   Leerzustand mit Sprung nach S-09 — vor dem Klick, nicht als Fehler danach (E-011).
2. **Auswahl.** Standardmäßig alle offenen Buchungen ausgewählt (A-8.1), abwählbar, filterbar
   (I-10). Kopfzeile zeigt Anzahl, Summe, Vorlage und Zielpfad.
3. **Vorschau.** Zwei Spalten: das JSON, wie es geschrieben wird, und dieselben Sätze lesbar.
   Die zweite Spalte ist keine Zugabe: A-8.4 kodiert die Notiz nach Base64, und ohne Klartext
   kann niemand prüfen, was das Haus verlässt (B-14). Die Vorschau benutzt denselben Renderer wie
   der Export selbst, sonst kann sie etwas anderes zeigen als geschrieben wird.
4. **Prüfung vor dem Klick.** Buchungen, für die die Vorlage ein verlangtes Feld nicht füllen kann
   — etwa eine leere Call-Nummer bei einer Vorlage, die sie fordert (A-2.6) — werden in der Liste
   markiert, mit Zählung im Banner und dem Angebot, sie zurückzustellen. Das ist besser als ein
   Fehler nach dem Klick, weil A-8.8 dann alles zurückrollt und der Benutzer nicht weiß, welche
   Buchung schuld war.
5. **Bestätigungsdialog** mit Zielpfad, Dateiname, Anzahl, Summe und dem Satz zur Lesbarkeit der
   Kundennotizen (A-8.9, R-05). Enthält die Auswahl zurückgesetzte Buchungen, steht das hier
   ebenfalls (R-10).
6. **Schreiben.** Screen gesperrt, Schaltfläche im Wartezustand, `aria-busy`. Es wird **nichts**
   vorab markiert (A-8.8).
7. **Erfolg.** Ergebnisbereich mit Dateiname, vollem Pfad, Anzahl, Summe, Zeitpunkt und
   „Ordner öffnen"; die exportierten Buchungen verschwinden aus der Auswahlliste und tragen ab
   sofort überall das Exportiert-Badge (Abschnitt 4); der Verlauf bekommt einen Eintrag.
8. **Fehlerfälle.** Jeder mit dem Satz „Es wurde nichts exportiert und keine Buchung markiert."
   (A-8.8), weil sonst erneut exportiert und doppelt abgerechnet wird:
   - Ordner existiert nicht: Pfad nennen, „Ordner wählen" anbieten (E-011).
   - Ordner nicht beschreibbar: Pfad nennen, anderen Ordner anbieten (R-11).
   - Netzlaufwerk nicht erreichbar: als eigener Fall benennen, weil der Benutzer sonst das
     Programm verdächtigt (R-11).
   - Datei mit diesem Namen existiert: kein stilles Überschreiben; es wird ein Name mit Zähler
     verwendet und der tatsächliche Name genannt.
   - Abbruch oder Absturz während des Schreibens: nach dem Neustart zeigt S-07 dieselbe
     unveränderte Liste offener Buchungen (A-8.8).

### 3.4 I-15 — Exportvorlage anlegen, bearbeiten, Vorschau prüfen (kritisch)

1. **Einstieg** über S-07, Bereich „Vorlagen", oder über S-09 (Abschnitt 7). Liste mit der
   Standardvorlage, die als nicht löschbar gekennzeichnet ist (A-8.7).
2. **Anlegen** nur durch Kopieren oder als leere Vorlage. Die Kopie der Standardvorlage ist der
   empfohlene Weg, weil sie A-8.2 bis A-8.5 bereits korrekt abbildet.
3. **Felder bearbeiten.** Geordnete Liste (A-8.7): Name, Quelle, Transformation, Bedingung.
   Umsortieren per Ziehen und gleichwertig per Tastatur (A-13.6, SC 2.5.7).
4. **Quellenauswahl.** Angeboten werden `todo.callNumber`, `buchung.notiz`, `buchung.dauer`,
   `buchung.startzeit`, `buchung.endzeit`, `system.windowsUser`, `todo.tags`, `konstante`.
   `todo.notiz` steht **nicht** in der Liste, auch nicht gesperrt — E-005 und R-06 verlangen die
   Sperre strukturell. Stattdessen steht unter der Auswahl der feste Satz: „Die persönliche
   Todo-Notiz kann nicht exportiert werden." (A-7.2). Er klärt auf, ohne die Möglichkeit
   anzubieten.
5. **Transformation** je Quelle vorbelegt: Notiz auf `base64` (A-8.4), Dauer auf
   `runde_auf_viertelstunde` (A-8.3, E-008). Unpassende Kombinationen werden nicht angeboten.
6. **Live-Vorschau auf tatsächlich offenen Buchungen** (A-8.7), rechts, aktualisiert bei jeder
   Änderung, umschaltbar auf eine andere Buchung. Gibt es keine offenen Buchungen, zeigt sie
   gekennzeichnete Beispieldaten statt einer leeren Fläche (B-09). Auch hier Base64 und Klartext
   nebeneinander.
7. **Prüfen und speichern.** Fehler an der Feldzeile, nicht als Sammelmeldung. Nach dem Speichern
   ist die Vorlage in S-07 wählbar. Ein Hinweis sagt, dass bereits geschriebene Exportdateien sich
   nicht ändern.
8. **Löschen.** Bestätigungsdialog; die Standardvorlage bietet es gesperrt mit Begründung an
   (A-8.7); ist die Vorlage in S-07 ausgewählt, wird nach der Nachfolgevorlage gefragt.
9. **Verlassen mit ungespeicherten Änderungen** öffnet einen Bestätigungsdialog (§15).

### 3.5 Die übrigen Interaktionen

**I-01 Todo erstellen.** Startpunkte: S-01, S-02, S-04 je Spalte, S-12. Das Formular zeigt die
Standard-Tags bereits gesetzt und entfernbar (A-9.3, A-9.5) — würden sie erst beim Speichern
angehängt, wäre A-9.3 zwar erfüllt, aber für den Benutzer unsichtbar (B-10). Entfernt er ein
Standard-Tag vor dem Speichern, bleibt es entfernt; ein erneutes Anhängen beim Speichern wäre
genau der Fehler, den diese Prüfung sucht. Anlage aus einer Kanban-Spalte setzt deren Status
(A-5.2, A-5.4). Anlage in einer poolgefilterten Liste: entweder wird das Pool-Tag mitgesetzt oder
es steht der Hinweis „Dieses Todo erscheint nicht im aktuellen Filter" — sonst verschwindet das
eben angelegte Todo sofort (A-3.2, A-3.4). Danach: Toast mit „Öffnen", Fokus auf dem neuen Eintrag.

**I-02 Todo bearbeiten.** Inline in S-02 oder vollständig in S-03. Speichern zeigt sich am Feld,
Scheitern stellt den alten Wert sichtbar wieder her und verwirft nichts. Felder einer exportierten
Buchung sind gesperrt, nicht unsichtbar, mit Begründung (A-6.9). Verlassen mit ungespeicherten
Änderungen fragt nach (§15).

**I-03 Todo als erledigt markieren.** Startpunkte: Kontrollkästchen in S-02, Schalter in S-03,
Ziehen in die Abschlussspalte in S-04 (siehe O-02). Läuft für dieses Todo ein Timer, erscheint ein
Dialog, der beides in einem Schritt erledigt: „Für dieses Todo läuft seit 00:42 der Timer. Er wird
gestoppt und gebucht." mit dem Feld für die Buchungsnotiz darin (A-7.3) — sonst geht die Notiz
verloren oder es folgen zwei Dialoge hintereinander. Verschwindet das Todo dadurch aus der
aktuellen Ansicht, sagt der Toast, wohin es gegangen ist, und bietet Rückgängig; sonst wirkt es
gelöscht (A-13.1).

**I-04 Time-Tracker starten und stoppen.** Starten bei bereits laufendem Timer (A-6.8) öffnet
einen Dialog, der den laufenden Timer nennt, seine bisherige Dauer zeigt, die Buchungsnotiz für
ihn abfragt und ankündigt, welcher Timer danach läuft. Abbruch ändert nichts. Stoppen zeigt vor
dem Speichern Rohdauer **und** gerundeten Exportwert nebeneinander, etwa „00:03 → 0,25" (A-8.3,
E-008) — ohne diese Angabe kann niemand nachvollziehen, was abgerechnet wird (B-15). Eine leere
Buchungsnotiz ist erlaubt, wird aber angemerkt, weil A-8.2 das Feld `Notiz` vorsieht; solche
Buchungen sind in S-07 als „ohne Notiz" erkennbar. Beim Start der Anwendung mit einem noch
laufenden Timer siehe O-04.

**I-06 Tags hinzufügen und entfernen.** In S-02, S-03, S-08 und S-12. Auswahl mit Suche, die den
Ordnerpfad mitzeigt (A-4.3, A-13.3), und der Möglichkeit, ein Tag direkt anzulegen (A-4.1).
Entfernt eine Änderung das Todo aus dem gerade gefilterten Pool, sagt der Toast das und bietet
Rückgängig (A-3.4) — auch hier verschwindet sonst eine Zeile ohne Erklärung.

**I-07 Tags in Ordner verschieben.** Ziehen mit hervorgehobenem Ziel und gleichwertigem
Kontextmenü „Verschieben nach …" (A-13.6, SC 2.5.7). Erfolgsmeldung nennt Quelle und Ziel und
bietet Rückgängig. Scheitert es, springt das Tag sichtbar zurück.

**I-08 Ordner verschachteln.** A-4.3 verlangt vier Ebenen und mehr, A-4.4 verlangt, dass es
übersichtlich bleibt: Einrückung nur bis zu einer festen Tiefe, danach Brotkrume statt weiterer
Einrückung; jeder Treffer der Suche zeigt seinen vollen Pfad. A-4.6 sagt „verhindert das beim
Verschieben" — die Anwendung markiert deshalb ungültige Ziele bereits **während** des Ziehens als
nicht ablegbar und bietet sie im Menü nicht an. Eine Fehlermeldung nach dem Ablegen wäre eine
Abweichung von A-4.6 (B-06). Kommt es trotzdem dazu, lautet sie: „»Kunden« kann nicht nach
»Kunden/Nord« verschoben werden, weil »Kunden/Nord« darin liegt."

**I-10 Zeitbuchungen filtern.** Filter über Zeitraum, Exportstatus (A-6.5), Todo, Tag, Pool,
Call-Nummer und „hat Notiz". Aktive Filter stehen als entfernbare Chips über der Tabelle, daneben
die Trefferzahl und „Filter zurücksetzen". Der Leerzustand unterscheidet „keine Buchungen
vorhanden" von „keine Treffer" (B-13). Filter bleiben beim Wechsel nach S-07 erhalten, damit die
Auswahl nachvollziehbar bleibt.

**I-12 Standard-Tags konfigurieren.** In S-10. Vorschauzeile aktualisiert sich sofort. Der Screen
sagt ausdrücklich, dass bestehende Todos unverändert bleiben (A-9.3 spricht nur vom Erstellen) und
dass die Tags auch für das Add-in gelten (A-9.5). Da das Add-in die Tags über die API holt
(A-10.4), muss es sie beim Öffnen neu laden und nicht zwischenspeichern.

**I-13 Todo-Pools konfigurieren.** In S-11. Regel als Tagauswahl, Live-Trefferzahl (A-3.3).
Löschen erklärt, dass keine Todos verloren gehen (A-3.4). Überlappende Pools sind zulässig und
werden als solche gezeigt (B-12).

**I-14 Todos per Drag & Drop verschieben.** Aufnehmen, Ziehen, Ablegen mit den in S-04
beschriebenen Zuständen (A-5.2, A-13.6). Ungültige Ziele werden während des Ziehens erkennbar.
Für jede Ziehbewegung gibt es eine gleichwertige Bedienung ohne Ziehen (SC 2.5.7); A-5.2 ist damit
erfüllt, ohne Tastaturbedienung auszuschließen. Ein laufender Timer bleibt vom Verschieben
unberührt. Ablegen in der Abschlussspalte folgt I-03.

---

## 4. Wo eine Buchung auftaucht und ihr Exportstatus sichtbar sein muss

A-6.6 sagt „jederzeit erkennbar", A-6.7 verlangt eine klare visuelle Unterscheidung, A-8.6
wiederholt es für den Export. „Jederzeit" heißt: an jeder der folgenden Stellen, nicht nur in
S-07. Die Liste ist die Prüfliste für jede spätere Abnahme.

| # | Ort | Wie der Status erscheint | Beleg |
|---|---|---|---|
| 1 | S-01, Kachel „nicht exportierte Zeiten" | Anzahl und Summe der offenen Buchungen; die Kachel ist der Einstieg in S-07 | A-6.6, §12 |
| 2 | S-01, laufender Timer | Die laufende Buchung ist begrifflich immer offen; das steht dabei | A-6.5 |
| 3 | S-01, zuletzt bearbeitete Todos | Je Zeile die Aufteilung „3,50 h, davon 1,25 offen" | A-6.6 |
| 4 | S-02, Todo-Zeile | Dieselbe Aufteilung je Todo | A-6.6 |
| 5 | S-03, Buchungsliste | Badge je Zeile, plus Summe getrennt nach offen und exportiert | A-6.5, A-6.7 |
| 6 | S-04, Kanban-Karte | Zusammengefasstes Zeichen für „enthält offene Buchungen" | A-6.6, B-01 |
| 7 | S-05, Tagesliste | Badge je Buchung | A-6.5 |
| 8 | S-05, laufender Timer | wie 2 | A-6.5 |
| 9 | S-06, Tabelle | Statusspalte, Filter, Zusatzkennzeichen „schon einmal exportiert" | A-6.5, A-6.7, E-012 |
| 10 | S-06, Aktionsleiste der Auswahl | „7 ausgewählt · davon 2 exportiert" | A-6.6 |
| 11 | S-07, Auswahlliste | Enthält per Definition nur offene, und das steht als Überschrift dabei | A-8.1, A-8.6 |
| 12 | S-07, Vorschau | Jeder Datensatz ist einer Buchung zuordenbar | A-8.6 |
| 13 | S-07, Ergebnis nach dem Export | Anzahl der eben umgestellten Buchungen | A-8.6, A-8.8 |
| 14 | S-07, Export-Verlauf | Welcher Lauf welche Buchungen enthielt | R-10, B-08 |
| 15 | S-14, Live-Vorschau | Hinweis, dass die Vorschau auf offenen Buchungen läuft | A-8.7 |
| 16 | S-12 Add-in, Karte des gefundenen Todos | Aufteilung offen und exportiert, weil sonst auf ein abgerechnetes Todo weitergebucht wird, ohne dass es auffällt | A-10.9, A-6.6, B-04 |
| 17 | Globale Suche | Trifft ein Ergebnis auf eine Buchung, trägt es das Badge | A-13.7, A-6.6 |
| 18 | Globale Navigation | Zähler der offenen Buchungen am Eintrag „Export" — das ist die eigentliche Erfüllung von „jederzeit" | A-6.6, §14 |
| 19 | Toast nach jedem Statuswechsel | Nennt den erreichten Status im Klartext | A-6.5 |

**Darstellungsregel.** Der Unterschied darf nicht allein an der Farbe hängen (SC 1.4.1), sonst ist
A-6.7 für einen Teil der Benutzer nicht erfüllt. Ein Badge trägt deshalb Wort, Form und Farbe:
„offen" mit offenem Ring, „exportiert" mit gefülltem Haken. Das Zusatzkennzeichen aus E-012 ist
ein eigenes, deutlich anderes Zeichen neben dem Badge, kein dritter Zustand desselben Badges
(A-6.9, B-07).

---

## 5. Notiz-Trennung in der Oberfläche (A-7.2, A-7.4, R-08)

Beide Felder heißen in der Spezifikation „Notiz". Nur die Buchungsnotiz geht in die Abrechnung.
Der Fehler wird erst in der Rechnung sichtbar, deshalb muss die Oberfläche ihn vorher verhindern.

**Wo beide gleichzeitig sichtbar sind.**

| Ort | Konstellation |
|---|---|
| S-03 | Persönliche Notiz im Kopfbereich, Buchungsnotizen in der Liste darunter — der gefährlichste Ort, beide auf einem Bildschirm |
| S-05 | Notizfeld des laufenden Timers, während der Todo-Kontext mit seiner persönlichen Notiz danebensteht |
| Dialog beim Stoppen (I-04) und beim Erledigtsetzen (I-03) | Buchungsnotiz wird abgefragt, persönliche Notiz kann als Kontext danebenstehen |
| S-06 | Spalte Buchungsnotiz; das Todo daneben besitzt eine persönliche Notiz, die hier nicht gezeigt wird |
| S-12 | Persönliche Notiz aus der E-Mail beim Anlegen, Buchungsnotiz beim Buchen auf ein vorhandenes Todo (A-10.9) |
| S-07 und S-14 | Die Vorschau zeigt die Buchungsnotiz im Klartext; hier fiele ein Bruch der Trennung zuerst auf |

**Was die Oberfläche tut.**

1. **Kein Feld heißt „Notiz".** Die persönliche Notiz heißt in der Oberfläche durchgängig
   „Persönliche Notiz", die Buchungsnotiz „Leistungsnotiz". Der Schlüssel im Export bleibt
   `Notiz`, weil er vom Abrechnungstool vorgegeben ist — Beschriftung und Schlüssel dürfen
   auseinandergehen (A-8.2, CLAUDE.md, R-08). Alternativvorschlag, falls „Leistungsnotiz" nicht
   gefällt: „Abrechnungsnotiz". Die Entscheidung gehört ins Glossar (T-004, O-06).
2. **Jedes der beiden Felder trägt dauerhaft seine Folge**, nicht nur im Tooltip: unter der
   persönlichen Notiz steht „Bleibt in Takt. Wird nie exportiert." (A-7.2), unter der
   Leistungsnotiz „Wird beim Export an das Abrechnungstool übertragen." (A-7.4). Derselbe Text
   hängt als `aria-describedby` am Feld (SC 3.3.2).
3. **Unterschiedliches Aussehen.** Die Leistungsnotiz trägt das Exportzeichen, das auch am
   Exportstatus-Badge benutzt wird; die persönliche Notiz trägt ein Zeichen für „nur lokal".
   Gleiche Feldform für zwei verschiedene Wirkungen ist die Ursache des Fehlers.
4. **Räumliche Trennung.** Die beiden Felder stehen nie unmittelbar untereinander. In S-03 liegt
   die Buchungsliste in einem eigenen, überschriebenen Bereich („Zeitbuchungen").
5. **In der Liste kein Inhalt.** S-02 zeigt nur, dass eine persönliche Notiz existiert, nicht
   deren Text (A-7.2).
6. **Im Vorlageneditor gar nicht erst wählbar.** `todo.notiz` erscheint nicht in der Quellenliste
   (E-005, R-06), der erklärende Satz steht trotzdem darunter — Abschnitt 3.4, Schritt 4.
7. **Die Vorschau ist die Kontrollstelle.** Wer prüfen will, ob die Trennung hält, sieht in S-07
   und S-14 den Klartext jeder exportierten Notiz. Beide benutzen denselben Renderer wie der
   Export, sonst prüft man etwas anderes, als geschrieben wird (A-7.2, A-8.4).

---

## 6. Begriffsliste für das Glossar (T-004)

Jede Zeile nennt die in der Spezifikation vorkommenden Wörter und den Vorschlag für die
Oberfläche. Wo mehrere Wörter dieselbe Sache meinen, ist das der eigentliche Befund; die
Entscheidung trifft der documenter im Glossar.

| Sache | In der Spezifikation | Vorschlag für die Oberfläche | Beleg |
|---|---|---|---|
| Arbeitseinheit | „Todo", „Ticket" | **Todo** durchgängig; „Ticket" nicht verwenden | §1, A-2.1 |
| Erfasster Zeitraum | „Zeitbuchung", „Buchung", „Arbeitszeit", „erfasste Zeiten", „Zeiten" | **Zeitbuchung**, kurz **Buchung** | A-6.3, A-6.6, §12, A-8.7 |
| Steuerung der Erfassung | „Timer", „Time-Tracker", „Zeiterfassung" | **Timer** für das Bedienelement, **Zeiterfassung** für den Vorgang | A-6.2, A-5.6, A-2.5 |
| Der Screen dafür | „Time-Tracking-Ansicht", „Time Tracking" | **Zeiterfassung** — die Navigation ist deutsch (CLAUDE.md) | S-05, §14 |
| Abgeschlossenes Todo | „Erledigt", „Done", „erledigte Todos" | **Erledigt**; „Done" nur, wenn der Benutzer eine Spalte selbst so nennt | A-2.4, A-5.3, §12 |
| Nicht abgeschlossen | „aktiv", „offene Todos", „wieder aktiv" | **offen** für Todos | A-2.5, §12 |
| Nicht exportiert | „noch nicht exportiert", „noch offen", „müssen noch exportiert werden", „offene Buchungen" | **offen** für Buchungen — ein Wort, überall dasselbe | A-6.5, A-6.6, A-8.6, A-8.7 |
| Exportiert | „bereits exportiert", „bereits übertragen", „an das Abrechnungstool übertragen" | **exportiert**; „übertragen" nicht verwenden | A-6.5, A-6.6, A-8.5 |
| Zustand des Todos | „Status", „Status-Spalten", „Statusstruktur" | **Status** und **Statusspalte** | A-2.2, A-5.2, A-5.4 |
| Zustand der Buchung | „Exportstatus" | **Exportstatus** — nie verkürzt auf „Status" | A-6.4, A-6.5 |
| Interne Notiz | „persönliche Notiz", „Notiz" | **Persönliche Notiz** | A-2.2, A-7.1 |
| Abrechnungsnotiz | „Notiz", „eigenes Notizfeld" | **Leistungsnotiz** oder **Abrechnungsnotiz**, siehe O-06 | A-6.4, A-7.3, A-8.2 |
| Gruppierung von Todos | „Todo-Pool", „Pool" | **Pool** | A-3.1, A-3.2 |
| Ablage für Tags | „Ordner", „Unterordner", „Ordnerstruktur", „Ordnerhierarchie" | **Ordner**, für die Gesamtheit **Ordnerstruktur** | A-4.2, A-4.3, A-4.6 |
| Nummer aus Outlook | „Call", „callNumber", „Call-Nummer" | **Call-Nummer** in der Oberfläche, `Call` nur als Exportschlüssel | A-8.2, A-2.6, A-10.8 |
| Gerundete Dauer | „Zeit" (Exportschlüssel), „Dauer" | **Dauer** in der Oberfläche; „Zeit" nur als Schlüssel, sonst mit Uhrzeit verwechselbar | A-8.2, A-6.4 |
| Ausgabeformat | „Exportvorlage", „Standardvorlage", „Exportformat", „Exportstruktur", „Standardformat" | **Exportvorlage**, die mitgelieferte heißt **Standardvorlage** | A-8.7, A-8.2, S-14, E-005 |
| Zielsystem | „Abrechnungstool", „externes Abrechnungstool" | **Abrechnungstool** | A-6.6, §1 |
| Outlook-Teil | „Outlook-Add-in", „Add-in", „Outlook-Anbindung" | **Outlook-Add-in**, kurz **Add-in** | A-10.1, §1 |
| Startseite | „Dashboard", „Startseite" | **Dashboard** | S-01 |
| Screens für Einstellungen | „Verwaltung", „Konfiguration", „Einstellungen" | **Einstellungen** als Oberbegriff; die Unterseiten heißen nach ihrem Gegenstand: „Standard-Tags", „Pools", „Exportvorlagen" | S-08, S-09, S-10, S-11 |
| Automatisch gesetzte Tags | „Standard-Tags" | **Standard-Tags** | A-9.1 |
| Suche und Einschränkung | „globale Suche", „Filter", „filtern" | **Suche** und **Filter** getrennt halten | A-13.7, I-10 |
| Zielordner | „konfigurierbarer Ordner", „Ablageort" | **Exportordner** | E-011 |

Zwei Wörter sind besonders zu beobachten, weil sie doppelt belegt sind: **Status** (Todo gegen
Export, A-2.2 gegen A-6.4) und **Notiz** (A-7.1 gegen A-7.3). Beide dürfen in der Oberfläche nie
allein stehen.

---

## 7. Navigationsstruktur (§14) und Einordnung von S-14

§14 nennt beispielhaft Dashboard, Todos, Kanban, Time Tracking, Export, Tags, Einstellungen und
verlangt, dass die Navigation jederzeit sichtbar ist. Daraus folgt eine dauerhaft eingeblendete
Seitenleiste, nicht ein aufklappbares Menü; A-13.9 erlaubt, dafür Platz zu opfern.

```
Dashboard          → S-01
Todos              → S-02   (S-03 als Detail, im Kontext geöffnet)
Kanban             → S-04
Zeiterfassung      → S-05   Bereich „Heute"
                     S-06   Bereich „Alle Buchungen"
Export             → S-07   Bereich „Export"
                     S-14   Bereich „Vorlagen"
                     Verlauf (R-10, B-08)
Tags               → S-08
Einstellungen      → S-09   mit S-10 Standard-Tags, S-11 Pools,
                            Verweis auf S-14, Add-in-Zugang
```

S-12 und S-13 stehen nicht in dieser Navigation; sie leben in Outlook (A-10.1) und übernehmen nur
das Aussehen (A-10.6).

**Wo S-14 hingehört.** Zum Export, als zweiter Bereich, nicht in die Einstellungen. Begründung
aus A-8.7: Der Vorlageneditor braucht eine Live-Vorschau auf tatsächlich offenen Buchungen. Diese
Daten sind der Gegenstand von S-07. Läge der Editor in den Einstellungen, wäre er von seiner
Vorschaugrundlage getrennt, und der Weg vom „so sieht es aus" zum „so exportiere ich" führte quer
durch die Anwendung. Aus S-09 führt ein Verweis dorthin, damit auch findet, wer dort sucht
(A-8.7, §14, E-005).

**Zwei Dinge gehören dauerhaft in die Navigation, weil zwei Anforderungen „jederzeit" sagen.**

- Die Timerleiste mit laufendem Todo, Dauer und Stopp. A-6.2 verlangt Starten und Stoppen,
  A-13.4 verlangt prominente, nicht störende Integration. Ohne globales Element ist Stoppen nur
  nach Rückkehr in S-05 möglich (B-16).
- Der Zähler offener Buchungen am Eintrag „Export". A-6.6 sagt „jederzeit erkennbar"; ein Zähler
  in der immer sichtbaren Navigation ist die einzige Stelle, an der das wörtlich zutrifft.

Ergänzend zur Bedienbarkeit: die Seitenleiste ist eine Landmarke, der Sprung „Zum Inhalt" liegt
vor ihr, der aktive Eintrag ist nicht allein farblich markiert (SC 1.4.1, SC 2.4.11), und die
Reihenfolge der Einträge ist auf allen Screens gleich (SC 3.2.3).

---

## 8. Befunde

Format: `ID  Beleg  Ort  Abweichung  Vorschlag`. Alle richten sich an die Umsetzung in T-006 und
später, weil es noch nichts gibt, wogegen zu prüfen wäre (E-013).

```
B-01  A-6.6  S-04 Kanban-Karte
      Abweichung: Die Spezifikation verlangt „jederzeit erkennbar", nennt aber für die Karte
      nur Titel und Zeiterfassung. Ohne Zeichen auf der Karte fehlt der Exportstatus an dem
      Screen, auf dem am längsten gearbeitet wird.
      Vorschlag: Zusammengefasstes Zeichen „enthält offene Buchungen" auf jeder Karte,
      Erläuterung bei Hover und Fokus.

B-02  A-2.5  alle Startpunkte des Timers
      Abweichung: A-2.5 beschreibt drei Wirkungen, aber keine Rückmeldung. Ohne sie hebt die
      Anwendung „Erledigt" auf, ohne dass der Benutzer davon erfährt.
      Vorschlag: Toast mit allen drei Wirkungen im Klartext, Rückgängig, dazu Ansage über
      aria-live. Kein Bestätigungsdialog davor, weil A-2.5 „automatisch" sagt.

B-03  A-2.5, A-3.4  S-02, S-04, S-01
      Abweichung: Die dritte Wirkung — Rückkehr in den Pool — ist abgeleitet und bricht still,
      wenn Poolzugehörigkeit, Spaltenzuordnung oder Kennzahlen einmalig berechnet und
      zwischengespeichert werden. Jede Einzelwirkung stimmt dann, die Kette nicht.
      Vorschlag: Ableitung bei jeder Darstellung, keine gespeicherte Zuordnung; Abnahmefall,
      der die Rückkehr in einer poolgefilterten Ansicht ohne Neuladen prüft.

B-04  A-10.9, A-2.5, A-6.6  S-12 Add-in
      Abweichung: Das Add-in ist der fünfte Ort, an dem Zeit auf ein Todo gebucht werden kann,
      wird bei A-2.5 und beim Exportstatus aber regelmäßig vergessen.
      Vorschlag: Die Karte des gefundenen Todos zeigt Erledigt-Status und die Aufteilung offen
      zu exportiert; nach dem Buchen auf ein erledigtes Todo erscheint dieselbe Meldung wie in
      der Anwendung.

B-05  A-6.9, E-012  S-03, S-06
      Abweichung: „Nicht mehr bearbeitbar" ohne sichtbaren Grund wirkt wie ein Fehler.
      Vorschlag: Gesperrte Felder bleiben sichtbar, tragen den Grund samt Exportdatum und
      verweisen auf das Zurücksetzen.

B-06  A-4.6  S-08, I-08
      Abweichung: A-4.6 sagt „verhindert das beim Verschieben". Eine Fehlermeldung nach dem
      Ablegen verhindert nichts.
      Vorschlag: Ungültige Ziele werden während des Ziehens als nicht ablegbar dargestellt und
      im Verschieben-Menü nicht angeboten; die Fehlermeldung bleibt nur als letzte Absicherung.

B-07  A-6.9, E-012, R-10  S-06 und alle Orte aus Abschnitt 4
      Abweichung: Das Kennzeichen „schon einmal exportiert" wird leicht zum dritten Wert des
      Exportstatus. A-6.9 verlangt aber zweiwertig, nie mehrdeutig.
      Vorschlag: Status bleibt offen/exportiert; das Kennzeichen ist ein zusätzliches, optisch
      klar anderes Zeichen daneben, mit Datum in der Erläuterung.

B-08  R-10  kein Screen
      Abweichung: R-10 verlangt, dass das Zurücksetzen protokolliert wird, damit eine
      Doppelabrechnung nachvollziehbar bleibt. Kein Screen der Spezifikation zeigt dieses
      Protokoll; damit ist die Maßnahme in der Oberfläche nicht erfüllt.
      Vorschlag: Verlauf je Buchung in S-06 und Export-Verlauf als dritter Bereich unter
      „Export"; beide zeigen Zeitpunkt, Datei und Anzahl.

B-09  A-8.7  S-14
      Abweichung: Die Live-Vorschau läuft auf tatsächlich offenen Buchungen. Der Zustand, in dem
      es keine gibt, tritt sicher ein und ist nicht geregelt.
      Vorschlag: Gekennzeichnete Beispieldaten mit dem Satz, warum sie erscheinen; niemals eine
      leere Vorschaufläche.

B-10  A-9.3, A-9.5  S-02, S-04, S-12
      Abweichung: Werden die Standard-Tags erst beim Speichern angehängt, ist A-9.3 technisch
      erfüllt und für den Benutzer unsichtbar; entfernt er eines vorab und es kommt beim
      Speichern zurück, widerspricht die Anwendung seiner Eingabe.
      Vorschlag: Formular und Add-in zeigen die Standard-Tags vorbelegt und entfernbar; entfernte
      Tags bleiben entfernt.

B-11  A-9.3  S-10
      Abweichung: A-9.3 gilt beim Erstellen. Ohne Hinweis erwartet der Benutzer, dass eine
      Änderung auch bestehende Todos erfasst.
      Vorschlag: Fester Satz auf S-10, dass bestehende Todos unverändert bleiben.

B-12  A-2.5, A-3.4  S-11, Meldung aus I-05
      Abweichung: A-2.5 spricht vom Todo-Pool im Singular, A-3.4 lässt über Tagregeln mehrere
      Zugehörigkeiten zu. Die Meldung nach I-05 kann dann nicht einen Pool nennen.
      Vorschlag: Alle zutreffenden Pools nennen; S-11 sagt, dass Pools sich überschneiden dürfen.

B-13  §15  S-02, S-06, S-08, S-14
      Abweichung: Ein einziger Leerzustand für „nichts vorhanden" und „nichts gefunden" führt bei
      gesetztem Filter zu der falschen Aussage, es gebe keine Daten.
      Vorschlag: Zwei getrennte Zustände; der Filterfall nennt die aktiven Filter und die
      Gesamtzahl ohne Filter.

B-14  A-8.4, A-8.9, A-7.2  S-07, S-14
      Abweichung: Eine Vorschau, die die Notiz nur als Base64 zeigt, ist nicht prüfbar. Genau
      hier müsste ein Bruch der Notiz-Trennung auffallen.
      Vorschlag: Zweispaltige Vorschau, JSON und Klartext, in beiden Screens mit demselben
      Renderer wie der Export.

B-15  A-8.3, E-008  Stoppdialog, S-03, S-05, S-06
      Abweichung: Ohne den gerundeten Wert neben der Rohdauer kann der Benutzer nicht
      nachvollziehen, was abgerechnet wird; drei Minuten werden zu einer Viertelstunde.
      Vorschlag: Überall dort, wo eine Dauer steht, den Exportwert daneben oder in der
      Erläuterung zeigen, im Stoppdialog vor dem Speichern.

B-16  A-6.2, A-13.4, §14  globale Navigation
      Abweichung: Ist der Timer nur in S-05 sichtbar, ist Stoppen von jedem anderen Screen aus
      nur über einen Ansichtswechsel möglich.
      Vorschlag: Timerleiste in der dauerhaft sichtbaren Navigation mit Todo, Dauer und Stopp.

B-17  A-6.7  alle Orte aus Abschnitt 4
      Abweichung: Eine Unterscheidung allein über Farbe erfüllt A-6.7 nicht für alle Benutzer
      (SC 1.4.1).
      Vorschlag: Badge aus Wort, Form und Farbe; dasselbe Badge überall identisch.

B-18  A-13.6, A-5.2, I-07, I-08, I-14  S-04, S-08, S-14
      Abweichung: Drag & Drop ist verlangt, eine Bedienung ohne Ziehen nicht vorgesehen. Damit
      sind drei Kerninteraktionen ohne Zeigegerät nicht ausführbar (SC 2.5.7).
      Vorschlag: Zu jeder Ziehbewegung ein gleichwertiger Weg über Kontextmenü und Tastatur;
      Drag & Drop bleibt der schnelle Weg.
```

---

## 9. Annahmen

- **AN-01.** Section- und Screennummern ohne A-ID (§12, §14, §15) sind als Anforderung behandelt,
  weil sie im verbindlichen Teil der Spezifikation stehen.
- **AN-02.** A-2.5 löst keinen Bestätigungsdialog aus. Grundlage ist das Wort „automatisch"; die
  Rückmeldung erfolgt danach und ist rücknehmbar (Abschnitt 3.1).
- **AN-03.** Trifft I-05 mit A-6.8 zusammen, erscheint **ein** Dialog, der den laufenden Timer
  stoppt und die Buchungsnotiz abfragt, nicht zwei nacheinander.
- **AN-04.** Manuelles Markieren als exportiert (I-09) ist innerhalb des Toastfensters rücknehmbar
  und setzt dann kein Kennzeichen „schon einmal exportiert", weil keine Datei entstand. Ein
  echter Export ist nur über den Weg aus E-012 rücknehmbar.
- **AN-05.** Die Rückgängig-Funktion nach I-05 verwirft die eben entstandene Buchung. Das ist
  beabsichtigt: nach E-008 würde sie sonst als 0,25 abgerechnet.
- **AN-06.** In S-07 sind zunächst alle offenen Buchungen ausgewählt, weil A-8.1 den Export der
  offenen Buchungen als Regelfall beschreibt.
- **AN-07.** Für die Oberfläche heißen die beiden Notizen „Persönliche Notiz" und
  „Leistungsnotiz". Der Exportschlüssel `Notiz` bleibt unverändert (A-8.2).
- **AN-08.** WCAG 2.2 AA ist als Maßstab angelegt, obwohl die Spezifikation es nicht nennt. Die
  angeführten Kriterien betreffen ausschließlich Stellen, an denen §15 oder A-13.x ohnehin einen
  Zustand verlangen.

---

## 10. Offene Fragen an den Orchestrator

- **O-01, blockierend für T-006.** Verhältnis von Kanban-Spalte und Erledigt-Kennzeichen. A-2.4
  kennt „Erledigt", A-5.3 nennt „Done" als Beispielspalte, A-5.4 macht die Statusstruktur
  konfigurierbar. Nirgends steht, ob das Ziehen in die letzte Spalte „Erledigt" setzt.
  Vorschlag: Genau eine Spalte trägt die Eigenschaft „Abschlussspalte"; ein Zug dorthin setzt
  Erledigt, A-2.5 hebt es wieder auf. Das ist in S-09 konfigurierbar.
- **O-02, blockierend für T-006.** Wohin geht die Karte, wenn A-2.5 „Erledigt" aufhebt? In die
  zuletzt eingenommene Spalte oder in die erste Spalte? Vorschlag: in die zuletzt eingenommene,
  ersatzweise in die erste. Ohne Festlegung ist I-05 auf S-04 nicht baubar.
- **O-03, blockierend für T-006.** Gibt es eine Zeilenaktion „Timer starten" in S-02? A-5.6 nennt
  nur Todo und Kanban-Karte. Ist sie vorhanden, gilt dort die vollständige Folge aus 3.1.
- **O-04.** Anwendung wird mit laufendem Timer beendet. A-6.4 verlangt eine Endzeit; ein
  offenes Ende ist kein zulässiger Zustand. Vorschlag: Beim Start fragt die Anwendung, ob
  weitergelaufen werden soll, bis zum Beenden gebucht wird oder die Buchung verworfen wird.
- **O-05.** Darf eine Buchungsnotiz leer bleiben, obwohl A-8.2 das Feld `Notiz` vorsieht?
  Vorschlag: ja, mit Kennzeichnung in S-07.
- **O-06.** „Leistungsnotiz" oder „Abrechnungsnotiz" für das exportierte Feld (R-08). Entscheidung
  gehört ins Glossar aus T-004.
- **O-07.** Braucht das manuelle Markieren als exportiert (I-09) eine Begründung oder Referenz,
  damit später nachvollziehbar ist, warum eine Buchung ohne Datei als exportiert gilt? Passt zum
  Protokoll aus R-10.
- **O-08.** Zeigt die globale Suche (A-13.7) auch Buchungen, oder nur Todos und Tags? Davon hängt
  Zeile 17 in Abschnitt 4 ab.

---

## 11. Urteil

**Nacharbeit.** Nicht an einer Umsetzung — es gibt keine —, sondern an der Spezifikation, bevor
gebaut wird.

Blockierend: **O-01**, **O-02**, **O-03**. Ohne diese drei Festlegungen ist I-05 auf dem
Kanban-Board nicht widerspruchsfrei baubar, und I-03 hat keinen definierten Auslöser.

Nicht blockierend, aber vor der Abnahme zu schließen: **B-03**, **B-04**, **B-07**, **B-08**,
**B-14**, **B-18**. B-03 und B-04 betreffen die vollständige Wirkung von A-2.5, B-07 und B-08 die
Absicherung gegen R-10, B-14 die einzige Kontrollstelle für die Notiz-Trennung vor dem Schreiben,
B-18 die Bedienbarkeit dreier Kerninteraktionen ohne Zeigegerät.

Die übrigen Befunde sind Bauvorgaben und gehen ohne weitere Entscheidung an T-006.
