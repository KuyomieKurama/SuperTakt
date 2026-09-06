# Entscheidungen

Kurzeinträge. Kontext, Entscheidung, Konsequenz. Neue Einträge unten anhängen, alte nicht
umschreiben — wird eine Entscheidung revidiert, bekommt sie einen Nachfolger, der sie ablöst.

---

## E-001 — Alles läuft lokal, kein Server, keine Cloud

**Kontext.** Frage an den Auftraggeber zur Datenbank. Antwort: „Das soll alles Lokal sein. Es
darf keine DB Anbindung oder Cloud Anbindung geben. Zumindest derzeit."

**Entscheidung.** Takt ist eine lokale Anwendung. Keine Cloud, kein Datenbankserver, keine
Telemetrie. Das „zumindest derzeit" wird architektonisch ernst genommen: Der Zugriff auf die
Speicherung läuft über Ports, der Adapter ist austauschbar.

**Konsequenz.** Der ursprüngliche Vorschlag mit NestJS, Prisma und PostgreSQL entfällt. Die
Fachlogik in `packages/domain` darf weder HTTP noch SQL kennen, sonst ist der Adapter später
nicht austauschbar.

---

## E-002 — Stack: durchgehend TypeScript

**Kontext.** Zwei Stack-Optionen zur Wahl: durchgehend TypeScript oder ein Python-Backend.

**Entscheidung.** Durchgehend TypeScript. Bestätigt vom Auftraggeber.

**Konsequenz.** Das Outlook-Add-in ist über Office.js ohnehin TypeScript. Rundung und
Exportformat existieren genau einmal und werden von Oberfläche, Add-in und Exportmotor geteilt.
Das vorhandene Werkzeug greift: `typescript-lsp`, `ecc:typescript-reviewer`, `ecc:react-patterns`.

---

## E-003 — Tauri als Hülle, eingebettetes SQLite als Speicher

**Kontext.** Auswahl zwischen Tauri, Electron und reinem Browserbetrieb sowie zwischen SQLite
und JSON-Dateien.

**Entscheidung.** Tauri plus eingebettetes SQLite. Gewählt vom Auftraggeber.

**Konsequenz.** Kleine Binärdatei, echter Dateisystemzugriff, der Windows-Benutzername ist vom
System lesbar statt aus einer Einstellung. SQLite hält Abfragen über tiefe Tag-Bäume schnell und
macht den Timer-Stopp atomar. Preis: eine Rust-Toolchain im Bauablauf, für die es im Inventar
keinen Skill gibt, und Migrationen brauchen Disziplin.

---

## E-004 — Der lokale Dienst läuft als Node-Sidecar unter Tauri

**Kontext.** Tauri hat keinen Node-Prozess. Das Outlook-Add-in braucht aber eine HTTP-API, und
laut E-002 soll die Fachlogik durchgehend TypeScript sein. Ein Rust-Backend würde die Fachlogik
in eine zweite Sprache zwingen und sie doppeln.

**Entscheidung.** `apps/local-api` läuft als Node-Sidecar, den die Tauri-Hülle startet und
beendet, gebunden auf `127.0.0.1`. Weboberfläche und Outlook-Add-in sprechen denselben Dienst
an. Der Rust-Anteil bleibt dünn: Fenster, Menü, Lebenszyklus des Sidecars, Windows-Benutzername.

**Konsequenz.** Ein Datenpfad für alle Clients, keine doppelte Fachlogik. Dafür muss der Sidecar
als Binärdatei gebündelt werden, und ein auf `127.0.0.1` lauschender Dienst ist für jeden
Prozess auf dem Rechner erreichbar. Letzteres ist das wichtigste offene Sicherheitsthema und
Gegenstand von T-003.

---

## E-005 — Das Exportformat ist konfigurierbar

**Kontext.** Die Spezifikation gibt eine feste JSON-Struktur vor. Der Auftraggeber: „Jedoch
ermögliche es so, dass ich theoretisch die Struktur des Exports anpassen kann. [...] jedoch
möchte ich selbst in der App entscheiden können, was export wird."

**Entscheidung.** Ein Vorlagen-Motor in `packages/export`. Eine Exportvorlage ist eine geordnete
Liste von Feldern aus Name, Quellenpfad, Transformation und optionaler Bedingung. Die
Standardvorlage bildet `Call`, `Zeit`, `Notiz` als Base64 und `WindowsUser` exakt ab, ist nicht
löschbar, aber kopierbar.

**Konsequenz.** Es kommt ein Screen hinzu, der in der Spezifikation nicht vorgesehen war: der
Vorlageneditor mit Vorschau, geführt als S-14. Die Trennung aus A-7.2 wird zur harten Regel im
Motor: Die Todo-Notiz ist als Feldquelle nicht wählbar, sonst ließe sich die Datenschutzgrenze
über eine Vorlage aushebeln.

---

## E-006 — Das Todo bekommt ein Feld `callNumber`

**Kontext.** Abschnitt 8 der Spezifikation verlangt ein Exportfeld `Call`. Abschnitt 2 nennt nur
„optional weitere Metadaten". Das Add-in soll die Call-Nummer per regulärem Ausdruck erkennen.

**Entscheidung.** Das Todo trägt ein eigenes Feld `callNumber`, das die Erkennung im Add-in
füllt und das die Standardquelle für `Call` ist.

**Konsequenz.** Die Duplikaterkennung im Add-in kann darauf abfragen. Alternative wäre gewesen,
die Nummer über ein Tag zu führen — dann wäre die Abfrage teurer und die Eindeutigkeit nicht
erzwingbar. Der Auftraggeber wurde auf die Annahme hingewiesen und hat nicht widersprochen.

---

## E-007 — GitHub-Anbindung und Context7-Schlüssel bleiben aus

**Kontext.** Nachfrage zu GitHub-MCP und zu einem Context7-API-Schlüssel.

**Entscheidung.** Beides nein. GitHub-Plugin bleibt deaktiviert, kein Schlüssel hinterlegt.

**Konsequenz.** Keine PR- oder Issue-Anbindung; der Arbeitsstand lebt im Board. Context7 läuft
ohne Schlüssel, gegebenenfalls mit Ratenbegrenzung.

---

## E-008 — Rundung: aufwärts auf die nächste Viertelstunde, Minimum 0,25

**Kontext.** Die Spezifikation nennt die Stufen 1,00 / 0,75 / 0,50 / 0,25, nicht die Regel für
Werte dazwischen. Nachfrage an den Auftraggeber, zwei Antworten: 7 Minuten 30 Sekunden werden
zu 0,25, und eine Buchung von 3 Minuten wird ebenfalls zu 0,25, nicht zu 0,00.

**Entscheidung.** Für den Export wird jede Dauer auf die nächsthöhere Viertelstunde aufgerundet.
Der kleinste exportierbare Wert ist 0,25. Eine Buchung von 0 Minuten Dauer existiert nicht und
wird nicht exportiert.

**Konsequenz.** 1 Minute, 3 Minuten, 7 Minuten 30 Sekunden und 15 Minuten ergeben alle 0,25.
16 Minuten ergeben 0,50. Das ist die branchenübliche Aufrundung bei Dienstleistungsabrechnung.

**Bestätigt am 2026-08-31** durch den Auftraggeber („Rundung aufwärts"), nachdem T-001 beide
Varianten gerechnet vorgelegt hatte: über die sechzehn Prüfwerte 16,00 Stunden gegenüber 15,25
Stunden bei kaufmännischer Rundung, 4,9 Prozent Unterschied, abweichend nur bei 16 und 61
Minuten. Damit ist R-03 geschlossen. Die kaufmännische Variante bleibt im Code umschaltbar, der
verwendete Modus wird je Exportlauf mitgeschrieben.

---

## E-009 — Das Add-in weist sich mit einem in der App erzeugten Token aus

**Kontext.** Der lokale Dienst auf `127.0.0.1` nimmt sonst Anfragen von jedem Prozess auf dem
Rechner an, auch von beliebigen Webseiten im Browser des Benutzers. Nachfrage beantwortet.

**Entscheidung.** Die Anwendung erzeugt einmalig ein Token, das der Benutzer in den
Add-in-Einstellungen einträgt. Es lässt sich jederzeit neu erzeugen; das Add-in muss dann
gepflegt werden. Jede Anfrage an den lokalen Dienst wird gegen dieses Token geprüft.

**Konsequenz.** Das Token ist ein Geheimnis. Es wird im Anwendungsdatenverzeichnis abgelegt,
nie im Repository, nie in Protokollausgaben und nie in Fehlermeldungen. Beim Neuerzeugen wird
das alte sofort ungültig. Der Vergleich läuft zeitkonstant. Zusätzlich prüft der Dienst die
Herkunft der Anfrage, damit ein Token allein aus einem fremden Browsertab nicht reicht.

---

## E-010 — `WindowsUser` wird vom Betriebssystem gelesen

**Kontext.** Nachfrage, ob der Wert vom System kommt oder eintragbar ist.

**Entscheidung.** Vom Betriebssystem, über die Tauri-Hülle.

**Konsequenz.** Das Feld ist keine Benutzereingabe mehr und damit keine Vertrauensgrenze in
Richtung Abrechnung. Es ist aber der Grund, warum die Tauri-Hülle nicht durch reinen
Browserbetrieb ersetzbar ist — siehe R-04.

---

## E-011 — Exportdateien gehen in einen einstellbaren Ordner

**Kontext.** Nachfrage nach dem Ablageort der Exportdatei.

**Entscheidung.** Ein in den Einstellungen konfigurierbarer Ordner.

**Konsequenz.** Der Pfad ist Benutzereingabe und wird geprüft: keine Pfadtraversierung, kein
Schreiben außerhalb des gewählten Ordners, verständlicher Fehler statt Absturz, wenn der Ordner
fehlt oder nicht beschreibbar ist. Der Ordner enthält lesbare Kundennotizen, siehe R-05.

---

## E-012 — Der Exportstatus ist je Buchung zurücksetzbar

**Kontext.** Nachfrage, ob und in welcher Granularität sich „exportiert" rückgängig machen lässt.

**Entscheidung.** Für jede einzelne Buchung, nicht nur für den zuletzt erzeugten Export.

**Konsequenz.** Die Sperre aus A-6.9 bleibt bestehen, bekommt aber einen ausdrücklichen
Ausstieg. Zurücksetzen ist eine bewusste Handlung mit Bestätigungsdialog, weil die Buchung
danach erneut in die Abrechnung geht. Der Vorgang wird protokolliert, damit eine
Doppelabrechnung nachvollziehbar bleibt.

---

## E-013 — Kein Framer-Prototyp; das Designsystem entsteht im Projekt

**Kontext.** Nachfrage, ob `takt-ui-konzept.html` nachgereicht wird. Antwort: nein, das Design
wird selbst erstellt.

**Entscheidung.** Es gibt keine externe visuelle Referenz. Das Designsystem aus T-006 ist die
Referenz und bleibt es. Der Auftraggeber nimmt es ab.

**Konsequenz.** R-01 ist geschlossen, die Nacharbeit durch einen späteren Abgleich entfällt.
Dafür trägt T-006 mehr Gewicht: Was dort festgelegt wird, gilt für alle 14 Screens. Die
Abnahme durch den Auftraggeber wird zum Tor vor Welle 2.

---

## E-014 — Rust-Toolchain ist nicht installiert

**Kontext.** Nachfrage zur Voraussetzung für Tauri. Antwort: nicht installiert.

**Entscheidung.** Die Entscheidung für Tauri aus E-003 bleibt. Die Installation der Toolchain
wird Teil von T-008 und läuft über den Auftraggeber, nicht über einen Agenten.

**Konsequenz.** T-008 wird die riskanteste Aufgabe der zweiten Welle. Scheitert die Toolchain
oder die Sidecar-Bündelung, ist der Rückweg ein lokaler Dienst plus Browser — dann fällt E-010
und der Windows-Benutzername muss doch aus einer Einstellung kommen. Welle 1 ist davon nicht
betroffen.

---

## E-015 — Bezeichner im Code bleiben englisch; T-001 wird nachgearbeitet

**Kontext.** `CLAUDE.md` legt fest: Oberflächentexte deutsch, Bezeichner im Code englisch. T-001
hat das SQL-Schema englisch benannt (`tag_folder`, `time_entry`, `export_run`), die
TypeScript-Typen daneben aber deutsch (`TagOrdner`, `TagOrdnerKnoten`, `Rundungsmodus`,
`ExportKandidat`, `wurzelOrdner`, `unterordner`, `vorfahrenDesZiels`, `PruefeVerschiebung`,
`GehoertZuPool`, `WendeStandardTagsAn`). Der frontend-dev hat den Widerspruch in T-006 gemeldet.

**Entscheidung.** Die Regel bleibt. Die Typen werden auf Englisch umbenannt, passend zu den
Tabellennamen, die es schon sind.

**Konsequenz.** Der aktuelle Stand ist nicht nur regelwidrig, sondern in sich gemischt: dieselbe
Sache heißt in der Datenbank `tag_folder` und im Typ `TagOrdner`. Jetzt ist die Umbenennung
billig, weil nur Typdefinitionen existieren und keine Umsetzung. Nach T-009 wäre sie teuer.
Aufgabe T-013.

---

## E-016 — Namen der beiden Notizfelder — zur Bestätigung offen

**Kontext.** R-08: Todo-Notiz und Buchungsnotiz heißen beide „Notiz", nur eine geht in die
Abrechnung. Zwei Agenten haben unabhängig umbenannt und sind sich uneins. T-004 schlägt
**Vermerk** und **Leistungsbeschreibung** vor, T-005 schlägt **Persönliche Notiz** und
**Leistungsnotiz** vor; T-006 hat den Vorschlag aus T-005 bereits in die Musterseite gebaut.

**Entscheidung, bestätigt am 2026-08-31.** **Vermerk** — bleibt in der Anwendung. **Leistung** —
geht in den Export. Der Auftraggeber hat den zweiten Namen selbst gesetzt („Es soll Leistung
sein"); der erste bleibt wie von T-004 vorgeschlagen.

Beide Vorschläge der Agenten waren damit unterlegen: „Persönliche Notiz" gegen „Leistungsnotiz"
aus T-005 teilt sich weiterhin den Wortstamm „Notiz" und verwechselt sich unter Zeitdruck genau
so leicht wie vorher; „Leistungsbeschreibung" aus T-004 trennt sauber, ist als Feldbeschriftung
aber zu lang.

**Konsequenz.** Der JSON-Schlüssel bleibt `Notiz` (A-8.2), weil das Abrechnungstool ihn vorgibt —
das betrifft nur das Übertragungsformat. Auf dem Bildschirm, in der Dokumentation und im Review
heißen die Felder Vermerk und Leistung. Glossar (T-004), Musterseite (T-006) und Zustandsmatrix
(T-005) ziehen nach.

---

## E-017 — Exportvorlagen bekommen eine geschlossene Auswahlliste, keinen Freitextpfad

**Kontext.** E-005 sah frei angebbare Quellenpfade vor. Das Bedrohungsmodell aus T-003 (B-3.1)
hält das für nicht vertretbar: Ein generischer Pfadauflöser ist ein Leseprimitiv auf alles, was
man ihm übergibt, und macht jedes später hinzugefügte Feld automatisch exportierbar.

**Entscheidung.** Die Feldquelle wird aus einer geschlossenen Liste gewählt. Jede Quelle ist eine
ausgeschriebene Zugriffsfunktion, kein ausgewerteter Pfad.

**Konsequenz.** Schränkt E-005 ein, ohne den Nutzen zu nehmen: Der Benutzer bestimmt weiterhin,
welche Felder in welcher Reihenfolge und unter welchem Namen exportiert werden. Neue Quellen
kommen künftig durch eine Codeänderung dazu, nicht durch Tippen im Editor. Das ist die vierte
und äußerste Schicht der Notiz-Trennung aus R-06. Auflage für T-007.

---

## E-018 — Ablage unter `%LOCALAPPDATA%`, nicht `%APPDATA%`

**Kontext.** T-003 (B-7.1, B-5.3). Roaming-Profile kopieren das Anwendungsdatenverzeichnis auf
einen Dateiserver. Zwei Schäden: Die Kundendatenbank verlässt den Rechner, was E-001
widerspricht, und unabhängig synchronisierte WAL-Dateien beschädigen SQLite.

**Entscheidung.** SQLite-Datei und Vorgabe-Exportordner liegen unter `%LOCALAPPDATA%\Takt\`
beziehungsweise `~/.local/share/takt/`. Der Vorgabe-Exportordner ist nicht Desktop oder
Dokumente, weil beide unter OneDrive umgeleitet sein können.

**Konsequenz.** Der Benutzer kann den Exportordner weiterhin frei setzen (E-011); die Vorgabe
lenkt ihn nur nicht selbst in einen Synchronisierungsordner.

---

## E-019 — Das Add-in-Token gehört nicht in `Office.context.roamingSettings`

**Kontext.** T-003 (B-2.8, R-12). `roamingSettings` liegt im Postfach und wird über Exchange
oder M365 synchronisiert. Das Geheimnis, das sämtliche lokalen Kundendaten öffnet, verließe
damit den Rechner — gegen E-001.

**Entscheidung.** Das Token liegt im `localStorage` der Add-in-Herkunft, nicht in
`roamingSettings`.

**Konsequenz.** Das Token gilt je Rechner und Browserprofil, nicht je Postfach. Wer Outlook auf
zwei Rechnern nutzt, trägt es zweimal ein. Das ist der Preis dafür, dass es den Rechner nicht
verlässt. Auflage für T-007.

---

## E-020 — Gerundet wird auf die Tagessumme je Todo — ABGELÖST, siehe Entscheidung unten

**Kontext.** Von T-001 aufgeworfen, in der Spezifikation nicht geregelt. Ich hatte vorläufig „je
Buchung" gesetzt, weil jede Buchung ihre eigene Leistung in den Export trägt (A-7.4).

**Entscheidung, bestätigt am 2026-08-31.** Nicht je Buchung. Alle noch offenen Buchungen
desselben Todos am selben Kalendertag werden addiert, **dann** wird die Summe aufgerundet
(aufwärts, Minimum 0,25 nach E-008). Ergebnis ist eine Exportzeile je Todo und Tag.

Der Auftraggeber hat zwischen zwei ausgerechneten Varianten gewählt. Beispiel Todo „Call 4711"
am Montag mit 10, 20 und 5 Minuten: eine Zeile mit 0,75 statt drei Zeilen mit zusammen 1,00.

**Konsequenz — die Änderung reicht weit.**

- Die Leistungstexte der Buchungen einer Gruppe werden zu einem Text zusammengeführt, sortiert
  nach Startzeit. Base64 wird auf den zusammengeführten Text angewandt, nicht je Einzeltext.
- Der Exportstatus bleibt je Buchung (A-6.5). Ist eine von drei Buchungen einer Tagesgruppe
  bereits exportiert, wird nur über die offenen summiert. Eine Umsetzung, die das übersieht,
  rechnet stillschweigend doppelt ab.
- Ein zurückgesetzter Exportstatus (E-012) bringt die Buchung beim nächsten Export in ihre
  Tagesgruppe zurück und verändert deren gerundete Summe. Das schärft R-10.
- Die Zuordnung Buchung zu Exportzeile ist nicht mehr eins zu eins. `export_run_entry` muss die
  Beziehung tragen.
- Die Typen aus T-001 waren auf die Einzelbuchung geschnitten und brauchen eine Ebene darüber.
  Auflage an T-013.

**Drei Punkte, die daraus folgen und noch offen sind:** Welcher Kalendertag zählt bei einer
Buchung über Mitternacht? Welches Trennzeichen führt die Leistungstexte zusammen? Was geschieht
mit einer Buchung, deren Leistungstext leer ist? Alle drei werden von den Agenten gemeldet, nicht
gesetzt.

---

## E-021 — In T-008 kommt `.gitignore` und `git init` vor jeder Installation

**Kontext.** T-003 (B-11.2, R-14). Das Verzeichnis ist kein Git-Repository und hat keine
`.gitignore`. Wird in T-008 installiert und gestartet, bevor beides existiert, landen
Add-in-Token, SQLite-Datei und Exportdateien dauerhaft in der Historie.

**Entscheidung.** Erste Handlung in T-008: `.gitignore` schreiben, dann `git init`, dann erst
installieren. Die Reihenfolge ist das einzige wirksame Gegenmittel.

**Konsequenz.** `.gitignore` deckt mindestens: `node_modules/`, `dist/`, `target/`, `*.db`,
`*.db-wal`, `*.db-shm`, `.env*`, `*.pem`, `*.key`, Exportverzeichnisse und Tokendateien.

---

## E-022 — Tag-Baum als Adjazenzliste

**Kontext.** T-001 hat beide Kandidaten gebaut und gemessen: bei Tiefe 4 bis 10 und bis 19 530
Ordnern liegt die rekursive CTE bei 55 µs, die Closure-Tabelle bei 18 µs. Beide Abfragepläne
ohne Basistabellenscan.

**Entscheidung.** Adjazenzliste mit rekursiver CTE.

**Konsequenz.** Faktor drei auf einer Größenordnung, die nicht wehtut, gegen Pflegeaufwand
genau an der Stelle, an der A-4.6 hängt. Eine Closure-Tabelle bleibt später als reiner
Lesebeschleuniger nachrüstbar, ohne die Domäne anzufassen.

---

## E-023 — Erledigt ist ein eigenes Kennzeichen; A-2.5 löst sich über Sichtbarkeit

**Kontext.** O-01 und O-02 aus T-005. Die Spezifikation verknüpft das Erledigt-Kennzeichen
(A-2.4) und die Kanban-Abschlussspalte (A-5.3) nirgends. A-2.5 verlangt, dass ein Todo nach dem
Timerstart wieder aktiv wird und erneut in seinem Pool landet.

**Zwei Fehlversuche von mir, festgehalten weil sie erklären, warum das Modell so aussieht.**
Auf die Antwort „Soll der Punkt dazu zurückkehren, wo dieser konfiguriert ist" hatte ich
zunächst eine in den Einstellungen konfigurierte Rückkehr-Spalte abgeleitet und an T-013
weitergegeben. T-014 meldete den Widerspruch zu `todo.status_id_before_done` aus T-001, worauf
ich auf den gemerkten Zustand umgestellt habe. Beides war in der falschen Achse gedacht.

**Entscheidung, 2026-09-01.** Erledigt und Kanban-Spalte sind zwei getrennte Dinge. Wortlaut des
Auftraggebers: „Nein, es ist nicht dasselbe. Erledigt ist etwas eigenes. Die Kanban Phase sind
selbst definierbar. Daher ist Kanban-Abschluss nicht gleich Erledigt."

Daraus folgt zwingend:

- Das Todo trägt ein eigenes Erledigt-Kennzeichen, ohne Kopplung an `todo_status`. Ein Todo kann
  in „Done" stehen und nicht erledigt sein, und es kann erledigt sein und in „In Progress"
  stehen.
- Weder das Setzen noch das Aufheben von Erledigt ändert die Kanban-Spalte. Es gibt nichts
  wiederherzustellen, also auch keine Rückkehr-Spalte — weder gemerkt noch konfiguriert.
  `todo.status_id_before_done` entfällt.
- A-2.5 löst sich über Sichtbarkeit: Pools sind tag-abgeleitet (A-3.4), erledigte Todos werden in
  Pool-Ansichten ausgeblendet. Hebt der Timerstart das Kennzeichen auf, erscheint das Todo wieder
  in seinem Pool. Das ist wörtlich, was A-2.5 sagt — „landet erneut in dem zuvor definierten
  Todo-Pool", Pool und nicht Spalte.

**Konsequenz.** Das Modell wird einfacher, nicht komplizierter: ein Feld weniger, eine Migration
weniger, keine neue Einstellung. Die Last verschiebt sich in die Oberfläche, die zwei
unabhängige Zustände je Kanban-Karte gleichzeitig lesbar machen muss. Auflage an T-015.

**Weiterhin offen:** O-03, Timer-Aktion je Zeile in der Todo-Liste. Siehe E-027.

---

## E-025 — Für die Tagesrundung zählt der Tag des Timerstarts

**Kontext.** Aus E-020 entstanden: Wenn über die Tagessumme je Todo gerundet wird, braucht es
eine Regel für Buchungen über Mitternacht. Nachfrage beantwortet: „der Tag wo der Timer gestartet
wurde".

**Entscheidung.** Der Kalendertag der Startzeit bestimmt die Tagesgruppe. Eine Buchung von 23:40
bis 00:20 zählt vollständig zum Starttag. Es wird nicht gesplittet und nicht dem Endtag
zugerechnet.

**Konsequenz.** Einfach umzusetzen und einfach zu erklären. Der Sonderfall, der auffallen wird:
Zwei Buchungen auf dasselbe Todo, eine um 23:50 und eine um 00:10 des Folgetags, liegen zwanzig
Minuten auseinander und ergeben trotzdem zwei Tagesgruppen und zwei Exportzeilen — jede für sich
aufgerundet auf mindestens 0,25.

---

## E-026 — Leistungstexte einer Tagesgruppe werden mit Semikolon verbunden

**Kontext.** Aus E-020: Fasst der Export mehrere Buchungen zu einer Zeile zusammen, müssen ihre
Leistungstexte zu einem Text werden. Nachfrage beantwortet: „Semikolon".

**Entscheidung.** Die Texte werden nach Startzeit sortiert und mit Semikolon verbunden.
Buchungen mit leerem Leistungstext werden übersprungen, damit keine leeren Abschnitte entstehen —
**das habe ich entschieden, nicht der Auftraggeber.**

**Konsequenz.** Base64 wird auf den zusammengeführten Text angewandt, nicht je Einzeltext. Offen
bleibt, was mit einem Leistungstext geschieht, der selbst ein Semikolon enthält; die
Spezifikation gibt dazu nichts her, und der Empfänger ist ein externes Abrechnungstool. T-016
führt den Fall, entscheidet ihn aber nicht.

---

## E-027 — Timer-Aktion je Zeile in der Todo-Liste

**Kontext.** O-03 aus T-005, vom Auftraggeber nicht beantwortet.

**Entscheidung, vom Orchestrator gesetzt.** Ja. Die Todo-Liste (S-02) bietet je Zeile eine
Aktion, den Timer zu starten und zu stoppen.

**Begründung.** A-5.6 verlangt das ausdrücklich für die Kanban-Karte, A-13.4 verlangt
Zeiterfassung „prominent, aber nicht störend". Eine Liste, in der man ein Todo erst öffnen muss,
um die Zeit zu starten, erfüllt das nicht. Der Klickpfad I-05 muss dann auch von hier aus
geprüft werden.

**Konsequenz.** Zurücknehmbar, falls der Auftraggeber widerspricht — es ist eine Zeile in der
Liste, keine Modelländerung.

---

## E-024 — Das Designsystem ist abgenommen

**Kontext.** E-013 hatte die Abnahme des Designsystems aus T-006 zum Tor vor Welle 2 gemacht,
weil es ohne Prototyp die einzige visuelle Referenz ist.

**Entscheidung.** Abgenommen am 2026-08-31: „Das Design sieht gut aus. Damit kannst du arbeiten."

Zur offenen A/B-Frage — wie eine Buchung dargestellt wird, deren Exportstatus zurückgesetzt
wurde — hat sich der Auftraggeber nicht ausdrücklich geäußert. Es gilt **Variante A**, die
Empfehlung des frontend-dev aus T-006, bis er widerspricht.

**Konsequenz.** Das Tor ist offen, T-008 ist nach T-013 startbar. Die Token, die Typografie, das
Abstandsraster, die drei Darstellungen des Exportstatus und die zwei Feldarten für Vermerk und
Leistung sind ab jetzt verbindlich für alle 14 Screens. Änderungen daran laufen über eine neue
Entscheidung, nicht nebenbei in einer Aufgabe.

---

## E-028 — Ein Semikolon im Leistungstext wird nicht behandelt

**Kontext.** E-026 verbindet die Leistungstexte einer Tagesgruppe mit Semikolon. Was geschieht,
wenn ein Text selbst ein Semikolon enthält? Der Auftraggeber hat die Entscheidung an den
Orchestrator gegeben.

**Entscheidung.** Der Text bleibt unverändert. Kein Escaping, keine Ersetzung, keine Kürzung.

**Begründung — es gibt keinen technischen Rückweg-Bedarf.** Wer wissen will, welche Buchungen in
einer Exportzeile stecken, fragt `export_run_entry`; die Beziehung steht in der Datenbank, nicht
im Text. Der zusammengeführte Text ist Prosa für einen Menschen auf einer Rechnung, keine
Datenstruktur. Sobald man aufhört, ihn parsen zu wollen, ist die Mehrdeutigkeit kein Problem
mehr.

Die beiden naheliegenden Alternativen sind schlechter:

- **Escaping** wäre schädlich. Das Abrechnungstool kennt unser Verfahren nicht, also stünde `\;`
  oder `;;` wörtlich auf der Kundenrechnung — schlimmer als das Problem.
- **Ersetzen durch Komma** würde still Kundendaten verändern. A-7.4 sagt „wird übertragen", nicht
  „wird umgeschrieben".

**Was stattdessen geschieht — Normalisierung nur an den Rändern.** Jedes Segment wird getrimmt,
ein abschließendes Semikolon oder ein abschließender Punkt fällt weg, dann werden die Segmente
nach Startzeit mit `"; "` verbunden. Leere Segmente werden übersprungen. Damit entsteht nie
`";;"`, nie `".; "` und nie `"; ; "`. Der Text „Analyse gemacht; Fix eingespielt" verbindet sich
mit „Test" zu „Analyse gemacht; Fix eingespielt; Test" — lesbar, auch wenn die Grenze zwischen
den Buchungen darin nicht mehr erkennbar ist.

**Wo der Fall trotzdem auffällt.** Die Exportvorschau in S-07 und S-14 stellt die Segmente
sichtbar getrennt dar, weil Takt die Grenzen kennt. Der Benutzer sieht vor dem Export, wie sich
sein Text zusammensetzt, und kann eine Buchung nachbearbeiten, bevor sie zum Kunden geht. Das ist
der richtige Ort für dieses Problem — nicht ein Kodierverfahren, von dem der Empfänger nichts
weiß.

**Ein Fall bleibt offen:** Was steht im Feld, wenn alle Segmente einer Tagesgruppe leer sind? Das
hängt daran, ob das Abrechnungstool eine leere Notiz annimmt. T-016 führt den Fall, entscheidet
ihn nicht.

---

## E-029 — Todo ist der Leitbegriff, Ticket ein Synonym

**Kontext.** Offene Frage aus T-004 und T-014. Die Spezifikation benutzt in Abschnitt 2 „Todos
bzw. Tickets" und danach überwiegend „Todo".

**Entscheidung, vom Orchestrator gesetzt.** Ein Ding, ein Name: **Todo**. „Ticket" ist ein
Synonym aus dem Sprachgebrauch des Auftraggebers und wird in Oberfläche, Dokumentation und Code
nicht verwendet.

**Begründung.** Die Spezifikation stellt die Wörter mit „bzw." gleich, führt aber keine
Eigenschaft ein, die nur ein Ticket hätte. Zwei Namen für dieselbe Sache kosten in jedem
Glossareintrag, jeder Beschriftung und jedem Review Aufmerksamkeit und bringen nichts.

**Konsequenz.** Zurücknehmbar, falls der Auftraggeber „Ticket" für etwas Eigenes hält — dann wäre
es eine Modelländerung und keine Umbenennung, und sie käme vor T-009.

---

## E-030 — Zeiterfassung ist der Bereich, Timer das Bedienelement

**Kontext.** Offene Frage aus T-004 und T-014. Die Spezifikation benutzt „Timer",
„Time-Tracker", „Time-Tracking" und „Zeiterfassung" nebeneinander, Abschnitt 14 führt
„Time Tracking" als Navigationspunkt.

**Entscheidung, vom Orchestrator gesetzt.**

- **Timer** — das Bedienelement, das man startet und stoppt. Sein Stopp erzeugt eine Zeitbuchung.
- **Zeiterfassung** — der Bereich der Anwendung, in dem Buchungen entstehen und verwaltet werden.
  Das ist der Name des Navigationspunkts (S-05).
- **Time-Tracking** und **Time-Tracker** werden nicht verwendet. Die Regel aus `CLAUDE.md` gilt:
  Oberflächentexte auf Deutsch.

**Konsequenz.** Der Navigationspunkt aus Abschnitt 14 heißt „Zeiterfassung", nicht
„Time Tracking". Damit ist die Wortfamilie auf zwei Begriffe reduziert, die verschiedene Dinge
benennen — ein Werkzeug und ein Ort.

---

## E-031 — Die Export-Ansicht gliedert nach Tagesgruppen und lässt sich aufklappen

**Kontext.** Befund B-22 aus T-005n. Seit E-020 entsteht eine Exportzeile je Todo und Tag, die
Auswahlliste in S-07 war aber nach Einzelbuchungen gegliedert. Der Benutzer wählt sieben
Buchungen und bekommt drei Zeilen in der Datei, ohne dass ihm jemand sagt, warum. A-8.6 verlangt
ausdrücklich, dass deutlich dargestellt wird, welche Zeiten exportiert werden — das ist damit
nicht erfüllt.

**Entscheidung.** S-07 gliedert nach Tagesgruppen, also nach der Einheit, die auch die Datei
hat. Jede Gruppe zeigt Todo, Kalendertag, die gerundete Zeit und die zusammengeführte Leistung.
Eine Gruppe lässt sich aufklappen und zeigt darunter die einzelnen Buchungen mit ihrer
ungerundeten Dauer und ihrem eigenen Leistungstext.

Ausgewählt wird auf Gruppenebene. Innerhalb einer aufgeklappten Gruppe kann der Benutzer einzelne
Buchungen ausschließen; die Gruppe wird dann sofort neu berechnet und zeigt die veränderte
gerundete Zeit an.

**Begründung.** Die Rundung ist die Stelle, an der aus erfasster Zeit ein Rechnungsbetrag wird.
Sie darf nicht zwischen Auswahl und Datei verschwinden. Wer sieben Buchungen anhakt und drei
Zeilen bekommt, hat die wichtigste Umformung des ganzen Vorgangs nicht gesehen. Die
Aufklappbarkeit hält beides zusammen: die Gliederung der Datei oben, die erfasste Wirklichkeit
darunter.

Der Nebeneffekt ist der eigentliche Gewinn: Das Ausschließen einer Buchung zeigt sofort, was es
mit der gerundeten Zeit macht. Bei drei Buchungen mit 10, 20 und 5 Minuten fällt die Gruppe von
0,75 auf 0,50, wenn man die mittlere herausnimmt — das versteht man in einer Sekunde und in
keinem Handbuch.

**Konsequenz.** Auflage für T-007 und für die Umsetzung von S-07. Nach T-007 wäre die Umstellung
teuer, weil sie die Datenform der Ansicht betrifft und nicht nur ihre Darstellung. Die
Exportvorschau benutzt denselben Renderer wie die Datei (R-17), die aufgeklappte Ebene kommt
zusätzlich und nicht statt dessen.

---

## E-032 — „Erneut offen" ist keine dritte Klasse des Exportstatus

**Kontext.** Befund B-21 aus T-005n. E-012 erlaubt, den Exportstatus einer Buchung
zurückzusetzen, und T-006 zeigt dafür eine eigene Darstellung. Führt irgendein Filter diesen
Zustand als eigene Klasse neben „offen" und „exportiert", fällt eine zurückgesetzte Buchung aus
der Menge der zu exportierenden heraus — und R-10 steht auf dem Kopf.

**Entscheidung.** Der Exportstatus bleibt zweiwertig, wie A-6.9 es verlangt. Eine zurückgesetzte
Buchung ist **offen**, nicht „erneut offen". Dass sie schon einmal exportiert wurde, ist eine
zusätzliche Eigenschaft für die Anzeige, kein dritter Wert und niemals ein Filterkriterium, das
sie aus dem Export heraushält.

**Konsequenz.** Jeder Filter, jede Abfrage und jede Exportauswahl kennt genau zwei Werte. Die
dritte Darstellung aus T-006 bleibt, aber sie hängt an einem eigenen Merkmal, nicht am Status.
Auflage für T-007, T-009 und als Abnahmefall in den Testplan.

---

## E-033 — `booking.*` verschwindet als Quellenpfad, statt seine Bedeutung zu wechseln

**Kontext.** Vorschlag des domain-dev aus T-013b. `ExportSourcePath` war auf die Einzelbuchung
geschnitten. Seit E-020 erzeugt eine Tagesgruppe die Exportzeile, also meint `booking.duration`
faktisch nicht mehr die Buchung, sondern die Gruppe.

**Entscheidung.** `booking.*` wird entfernt, nicht umgedeutet. An seine Stelle treten
Gruppenquellen, unter anderem `group.quarters` als Quelle für `Zeit` und die zusammengeführte
Leistung der Gruppe.

**Begründung, wörtlich vom domain-dev.** Ein Pfad, der weiterhin `booking` heißt und die Gruppe
meint, wäre genau der stille Bedeutungswechsel, den T-013 gerade beseitigt hat. Ein entfernter
Name bricht sichtbar; ein umgedeuteter bricht still und erst in der Abrechnung.

**Konsequenz.** Auflage für T-007. Bestehende Exportvorlagen gibt es noch nicht, also kostet die
Entfernung nichts. Die Zusicherungen in `packages/domain/src/export.ts` zieht der domain-dev
nach, sie bleiben in seiner Hoheit.

---

## E-034 — Eine Tagesgruppe ohne Leistungstext wird nicht exportiert, hält aber den Export nicht auf

**Kontext.** Offene Frage F-10 aus E-026 und E-028: Was steht im Feld `Notiz`, wenn alle
Buchungen einer Tagesgruppe ohne Leistungstext sind? Antwort des Auftraggebers: Eine leere Notiz
wird vom Abrechnungstool nicht angenommen.

**Entscheidung.** Eine Tagesgruppe ohne Leistungstext ist nicht exportierbar. Sie wird in der
Exportvorschau als solche gekennzeichnet, mit dem Grund, und der Benutzer kann den Text direkt
dort nachtragen.

Der Export der übrigen Gruppen läuft trotzdem. Die betroffene Gruppe bleibt offen und erscheint
beim nächsten Mal wieder.

**Begründung.** Die drei Alternativen sind schlechter. Einen Platzhaltertext einzusetzen hieße,
erfundene Daten an den Kunden zu schicken. Die Gruppe stillschweigend auszulassen ließe erfasste
Arbeitszeit verschwinden, ohne dass es jemandem auffällt. Den gesamten Export abzubrechen hieße,
dass eine einzige vergessene Notiz die Abrechnung eines ganzen Monats aufhält.

**Konsequenz.** Die Exportvorschau aus E-031 ist genau der richtige Ort dafür: Sie gliedert
ohnehin nach Tagesgruppen und lässt sich aufklappen, also kann der Benutzer die fehlende Leistung
dort sehen und sofort nachtragen. Auflage für T-007. Der Testplan braucht den Fall, dass ein
Export mit einer nicht exportierbaren Gruppe teilweise durchläuft — einschließlich der Prüfung,
dass die ausgelassene Gruppe danach weiterhin als offen geführt wird.

---

## E-035 — Der lokale Dienst benutzt `node:sqlite`, nicht `better-sqlite3`

**Kontext.** T-001 hatte `better-sqlite3` als Bibliothek genannt. Auf dem Rechner läuft Node
22.23, und `node:sqlite` ist dort vorhanden, aber als experimentell gekennzeichnet.

**Entscheidung.** `node:sqlite`.

**Begründung.** Der lokale Dienst wird als Sidecar-Binärdatei gebündelt (E-004). `better-sqlite3`
ist ein natives Modul, und native Module in einem gebündelten Node-Prozess sind erfahrungsgemäß
der fummeligste Teil eines Tauri-Aufbaus — genau das, was R-04 als Risiko benennt. `node:sqlite`
ist Teil der Laufzeit und zieht nichts ins Bündel.

Der Preis ist die Experimental-Kennzeichnung. Sie bedeutet eine Warnung beim Start und die
Möglichkeit, dass sich die Schnittstelle ändert; ab Node 24 ist das Modul stabil. Der domain-dev
hat die Migrationen in T-013b bereits gegen `node:sqlite` durchlaufen lassen, vorwärts, rückwärts
und wieder vorwärts, mit sauberem `integrity_check`.

**Konsequenz.** Der Zugriff läuft ohnehin über den Adapter aus `packages/storage`. Erweist sich
`node:sqlite` als untragbar, wird der Adapter getauscht, nicht die Fachlogik — genau dafür ist
die Trennung aus E-001 da.

---

## E-036 — Ein Timer, der beim Beenden noch läuft, wird nie stillschweigend weitergezählt

**Kontext.** O-04 aus T-005. A-6.4 verlangt für jede Buchung eine Endzeit. Was passiert mit einem
laufenden Timer, wenn die Anwendung beendet wird, abstürzt oder der Rechner heruntergefahren wird?

**Entscheidung.**

- **Geordnetes Beenden:** Die Anwendung fragt, ob der laufende Timer gestoppt werden soll. Der
  Benutzer entscheidet.
- **Ungeordnetes Ende** — Absturz, Abmeldung, Stromausfall: Der Timer schreibt im Betrieb
  regelmäßig ein Lebenszeichen, mindestens jede Minute. Beim nächsten Start erkennt Takt die
  verwaiste Buchung und fragt: bis zum letzten Lebenszeichen buchen, oder verwerfen? Die Buchung
  bleibt bis zur Antwort unvollständig und geht nicht in einen Export.

**Begründung.** Die Alternative wäre, die Endzeit beim nächsten Start zu setzen. Dann bucht ein
über Nacht vergessener Timer vierzehn Stunden, und das landet nach der Aufrundung aus E-008 in
einer Rechnung. Das Lebenszeichen deckelt den Schaden auf eine Minute und macht die Frage
beantwortbar, statt sie zu verstecken.

**Konsequenz.** Die Buchungstabelle braucht ein Feld für das letzte Lebenszeichen. Auflage für
T-009 und ein Testfall für T-010.

---

## E-037 — Manuelles Markieren als exportiert verlangt keine Begründung, wird aber protokolliert

**Kontext.** O-07 aus T-005. Eine Buchung lässt sich von Hand als exportiert markieren, ohne dass
sie je in einer Datei war.

**Entscheidung.** Keine Begründungspflicht. Ein Bestätigungsdialog, der ausspricht, was geschieht:
Diese Zeit wird nicht abgerechnet. Ein Freitextfeld für einen Grund, freiwillig. Der Vorgang wird
im Protokoll mit der Herkunft `manual` festgehalten.

**Begründung.** Ein Pflichtfeld erzeugt in der Praxis den Text „x" und nichts weiter. Was wirklich
zählt, ist die Nachvollziehbarkeit: Im Protokoll steht, dass hier jemand Zeit ohne Abrechnung
abgehakt hat, und wann.

---

## E-038 — Die globale Suche trifft auch Zeitbuchungen

**Kontext.** O-08 aus T-005. A-13.7 verlangt globale Suche und Filter, sagt aber nicht, worüber.

**Entscheidung.** Die Suche trifft Todo-Titel, Call-Nummer, Vermerk und Leistungstexte. Die
Ergebnisse werden nach Trefferart gruppiert, damit erkennbar bleibt, ob ein Treffer aus einem
internen Vermerk oder aus einem Text stammt, der beim Kunden gelandet ist.

**Begründung.** Der Leistungstext ist der Satz, der auf der Rechnung steht. „Wann habe ich das
letzte Mal etwas zur Schnittstelle geschrieben" ist die naheliegendste Frage überhaupt, und ohne
Treffer in Buchungen ist sie nicht beantwortbar.

---

## E-039 — Erledigte Todos sind in Pool-Ansichten ausgeblendet, aber einblendbar

**Kontext.** O-09 aus T-005n. E-023 löst A-2.5 über Sichtbarkeit: Erledigte Todos verschwinden aus
Pool-Ansichten und kehren zurück, wenn der Timerstart das Kennzeichen aufhebt.

**Entscheidung.** Ausgeblendet als Voreinstellung, über einen Schalter in der Filterleiste
einblendbar. Die Wahl wird je Ansicht gemerkt.

**Begründung.** Dauerhaft sichtbar würde A-2.5 sinnlos machen — es gäbe nichts, wohin ein Todo
zurückkehren könnte. Gar nicht einblendbar wäre auch falsch: Wer sucht, was er letzte Woche
abgeschlossen hat, soll es finden, ohne den Filter zu suchen.

---

## E-040 — `base.css` bleibt in `apps/web`

**Kontext.** F-12. T-006 hatte vorgeschlagen, sowohl `tokens.css` als auch `base.css` in ein
gemeinsames Paket zu legen. T-008a hat nur die Token verschoben und die Frage gestellt.

**Entscheidung.** Nur `tokens.css` liegt in `packages/ui-tokens`. `base.css` bleibt in `apps/web`.

**Begründung.** Die Token sind Werte — Farben, Abstände, Schriftgrößen — und die soll das
Outlook-Add-in teilen, damit es zur Hauptanwendung passt (A-10.6). `base.css` ist Zurücksetzung
und Grundlayout einer eigenständigen Anwendung. Das Add-in lebt in einem Outlook-Fenster mit
eigenen Vorgaben und würde ein fremdes Grundlayout nicht wollen. Geteilt wird, was gleich sein
muss, nicht was zufällig nebeneinander liegt.

---

## E-041 — Zwei fehlende Beschriftungen

**Kontext.** F-13. Der documenter hat in T-017a zwei Zuordnungen offen gelassen, statt sie zu
erfinden.

**Entscheidung.**

| Wert | Beschriftung |
|---|---|
| `time_entry.source = 'timer'` | Timer |
| `time_entry.source = 'manual'` | Von Hand |
| `app_setting.theme = 'system'` | Systemvorgabe |
| `app_setting.theme = 'light'` | Hell |
| `app_setting.theme = 'dark'` | Dunkel |

---

## E-042 — Der Windows-Benutzername geht über eine zweite `stdin`-Zeile an den Sidecar

**Kontext.** Offene Frage 1 aus T-008b. E-010 legt fest, dass der Benutzername vom Betriebssystem
gelesen wird, weil er in den Export geht. Die Tauri-Hülle liest ihn, der Sidecar braucht ihn — bis
jetzt liest der Dienst beim Start nur eine Zeile, das Sitzungsgeheimnis.

**Entscheidung.** Der Sidecar liest beim Start eine **zweite** `stdin`-Zeile mit dem
Benutzernamen, über denselben abgesicherten Kanal wie das Sitzungsgeheimnis.

**Begründung.** Die naheliegende Alternative wäre die Umgebungsvariable `USERNAME` — und die ist
genau das Loch, das B-8.1 im Bedrohungsmodell beschreibt. Wer Takt mit
`set USERNAME=fremder && Takt.exe` startet, bekäme fremde Arbeitszeit unter seinem Namen in die
Abrechnung. Die Befehlszeile scheidet aus demselben Grund aus wie beim Sitzungsgeheimnis: Sie
steht jedem lokalen Prozess in der Prozessliste offen.

**Konsequenz.** Kleine Änderung in `apps/local-api`, Hoheit des domain-dev. Die Prüfung dazu ist
schon benannt: Auf dem ersten Windows-Rechner Takt mit gesetzter Umgebungsvariable starten und
nachweisen, dass trotzdem der richtige Name im Export landet.

---

## E-043 — `https://tauri.localhost` fällt aus der Herkunfts-Positivliste

**Kontext.** Offene Frage 3 aus T-008b. Der Eintrag entsteht nur, wenn `useHttpsScheme` auf `true`
steht — und dieser Schalter darf nicht umgelegt werden, weil der Webview dann wegen gemischter
Inhalte jede Anfrage an `http://127.0.0.1:17843` verweigert. Gemessen wurde im Auslieferungsbau
`Origin: tauri://localhost`.

**Entscheidung.** Der Eintrag wird gestrichen. Ein Eintrag in einer Positivliste, der im Betrieb
nie vorkommt, ist keine Vorsorge, sondern eine offene Tür, an die sich niemand mehr erinnert.

**Konsequenz.** Auflage an den domain-dev in `apps/local-api`. Zusammen damit gehört ein Kommentar
an den Schalter `useHttpsScheme`, der sagt, warum er auf `false` bleiben muss — sonst legt ihn
irgendwann jemand um und wundert sich über eine Anwendung, die nichts mehr lädt.

---

## E-044 — Der Sidecar bringt seine eigene Node-Binärdatei mit

**Kontext.** Befund 1 aus T-008b, nachgestellt und belegt. Eine mit `/usr/bin/node` erzeugte
SEA-Binärdatei stirbt mit SIGSEGV — nachgewiesen mit `console.log("hallo")` als einzigem Inhalt.
`postject` warnt dabei `Can't find string offset for section name '.note'` und schreibt trotzdem.
Mit der Binärdatei von nodejs.org derselben Fassung tritt der Fehler nicht auf.

**Entscheidung.** Der Bauablauf lädt Node 22.23.2 von nodejs.org und prüft den SHA-256 gegen
Werte, die im Repository stehen.

**Konsequenz.** Der Sidecar wird 120 MiB groß, im `.deb` sind es 46 MiB. Der erste Bau braucht
Netzzugang. Beides ist der Preis dafür, dass die ausgelieferte Anwendung startet, statt beim
Anwender mit einem Speicherzugriffsfehler zu sterben — und die Prüfsumme im Repository macht aus
dem Netzzugriff eine überprüfbare Zutat statt einer Wundertüte.

---

## E-045 — Die Plausibilisierung der Call-Nummer gehört nach `packages/domain`

**Kontext.** Offene Frage 3 aus T-019. Der integration-dev hat die Prüfung, ob eine erkannte
Call-Nummer plausibel ist, bewusst zweimal gebaut — im Add-in als Bedienhilfe, im Dienst als
Vertrauensgrenze — und einen Wächter dagegengestellt, der beide zusammenhält.

**Entscheidung.** Eine Fassung in `packages/domain`, von beiden Seiten aufgerufen. Der Wächter
entfällt damit.

**Begründung.** Die doppelte Fassung war für den Moment richtig: Das Add-in konnte nicht auf eine
Funktion warten, die es noch nicht gab, und der Wächter verhindert das Auseinanderdriften. Aber
genau diese Regel entscheidet mit, ob das Duplikatangebot auf den richtigen Kundenvorgang zeigt
(R-15) — und eine Regel, die über Geld entscheidet, gehört genau einmal in die Domäne. Das ist
dieselbe Begründung wie bei der Rundung: Der Motor ruft sie auf, statt sie nachzubauen.

Das Add-in darf `@takt/domain` einbinden. Die Einschränkung aus E-017 gilt für `packages/export`
und dessen schmalen Einstiegspunkt, nicht für das Add-in.

**Konsequenz.** Auflage an domain-dev (Umzug) und integration-dev (beide Fassungen entfernen).
Kein Übergangspfad mit zwei zulässigen Fassungen — dieselbe Begründung wie bei `roh` gegen `raw`.

---

## E-046 — Der lokale Dienst liefert den Aufgabenbereich des Add-ins über HTTPS aus

**Kontext.** Offene Frage 5 aus T-019. Ein Office-Add-in lädt seinen Aufgabenbereich
ausschließlich über HTTPS; das Add-in nennt als Herkunft `https://localhost:17844`. Bisher
liefert niemand diese Seite aus.

**Entscheidung.** Der lokale Dienst übernimmt es, auf einem zweiten Port mit HTTPS und einem
Zertifikat, das beim ersten Start erzeugt und im Anwendungsdatenverzeichnis abgelegt wird
(E-018). Nicht die Tauri-Hülle und kein Fremdteil.

**Begründung.** Der Dienst läuft ohnehin, kennt das Anwendungsdatenverzeichnis mit seinen engen
Rechten und hat die Prüfschicht aus T-011 bereits. Ein zweiter Prozess nur für statische Dateien
wäre eine weitere Lebenszyklusfrage und eine weitere Stelle, an der etwas verwaisen kann. Die
Hülle scheidet aus, weil das Add-in auch dann erreichbar sein muss, wenn Takt als Fenster
geschlossen, der Dienst aber noch da ist.

**Konsequenz.** Auflage für T-021. Das selbst erzeugte Zertifikat muss der Benutzer einmalig
annehmen — das gehört ins Benutzerhandbuch und ist einer der Punkte, die erst auf einem
Windows-Rechner mit Outlook wirklich geprüft werden können (T-B05). Der HTTPS-Port liefert nur
statische Dateien; die API bleibt auf 17843 mit ihrer Prüfschicht.

---

## E-047 — „Nicht abrechnen" ersetzt das manuelle Markieren als exportiert

**Kontext.** T-021 meldet, dass E-037 mit dem heutigen Schema nicht umsetzbar ist: Der CHECK auf
`export_audit` verlangt für `event='exported'` einen zugehörigen Exportlauf. Domäne und OpenAPI
folgen dem bereits, ohne dass es jemand entschieden hätte. Zusätzlich hat ein Prüfpfad gezeigt,
dass „exported von Hand" heute „ist schon so" meldet statt „geht so nicht".

**Entscheidung.** E-037 wird ersetzt. Es gibt keinen Vorgang „von Hand als exportiert markieren".
An seine Stelle tritt **„nicht abrechnen"** mit eigenem Ereignistyp im Protokoll, der keinen
Exportlauf verlangt. Der Exportstatus der Buchung wird dabei auf `exported` gesetzt — zweiwertig
bleibt zweiwertig (E-032) —, aber das Protokoll hält fest, was tatsächlich geschah.

**Begründung.** Das Schema hat einen Denkfehler sichtbar gemacht, den ich in E-037 übersehen
hatte: „Als exportiert markieren" beschreibt nicht, was der Benutzer will. Er will diese Zeit
**nicht abrechnen** — exportiert wurde sie nie. Ein Protokoll, das eine Ausbuchung als Export
führt, beantwortet die Frage „wie viel Zeit haben wir nie abgerechnet" nicht mehr, und genau das
ist die Auswertung, für die man ein Protokoll führt.

Das Schema zu lockern wäre der bequemere Weg gewesen und hätte den Fehler festgeschrieben.

**Konsequenz.** Aus E-037 bleibt: keine Begründungspflicht, ein Bestätigungsdialog, der ausspricht
was geschieht, ein freiwilliges Freitextfeld. Neu ist der eigene Ereignistyp. Auflagen für
domain-dev (Schema, Domäne, OpenAPI), frontend-dev (Beschriftung: nicht „als exportiert
markieren", sondern „nicht abrechnen") und unit-tester.

---

## E-048 — Die Abdeckung wurde gemessen; nur die Tabelle log

**Kontext.** T-021 meldete als Randbefund, `packages/domain/src` erscheine nicht in der
Abdeckungstabelle. Ich habe es nachgeprüft, bestätigt gesehen und Alarm geschlagen: die
wichtigste Prüffläche des Projekts angeblich ungemessen.

**Aufklärung durch T-027, 2026-09-01 — meine Diagnose war falsch.**

Vitest 4.1.11 erzwingt auf dem `text`-Reporter `skipFull: true`, sobald es eine Agentenumgebung
erkennt. `skipFull` blendet jeden Eintrag aus, der auf allen drei Achsen bei 100 Prozent liegt —
und genau dort lag `packages/domain/src`. `export/src` war sichtbar, weil es **nicht** bei 100
Prozent lag, nicht wegen seiner Importendungen.

Die Messung selbst war die ganze Zeit korrekt: `coverage-final.json` und die Schwellenprüfung
haben immer die richtigen Zahlen gehabt. Gelogen hat nur die gedruckte Tabelle.

**Auch meine zweite Vermutung war falsch.** Ich hatte auf die `.js`-Endungen in den Importen der
Domäne getippt, weil sich die beiden Pakete darin unterscheiden. T-027 hat das mit isolierten
Einzelläufen widerlegt und `packages/domain/src` deshalb unangetastet gelassen — richtig so.

**Entscheidung.** `reporter: [['text', { skipFull: false }], 'html', 'lcov']` in
`vitest.config.ts`. Nachgewiesen mit Tabellen vor und nach der Änderung und mit einer Gegenprobe:
Werden alle Domänentests entfernt, fällt die Zahl sichtbar und es erscheinen vier
Schwellen-Fehlerzeilen.

**Was ich daraus mitnehme.** Der Alarm war überzogen, die Untersuchung nicht. Eine Tabelle, die
100 Prozent verschweigt, um kurz zu bleiben, ist in einem Projekt, das seine Schwellen ernst
nimmt, das denkbar schlechteste Verhalten — sie zeigt nur die Zeilen, bei denen man ohnehin
hinschaut, und verschweigt die, deren Verschwinden alarmiert. Und: Wer eine Ursache vermutet,
soll sie messen. Ich habe zwei Hypothesen geliefert, beide waren falsch, und beide hätten zu
einem Umbau geführt, der nichts behoben hätte.

---

## E-049 — Der Dienst liefert die Liste der Feldquellen aus

**Kontext.** Offene Frage 2 aus T-031, die konkrete Fassung einer Frage aus T-022. Die zwölf
Quellen einer Exportvorlage stehen heute zweimal: in `packages/export/src/sources.ts` und noch
einmal in `apps/web/src/lib/exportTemplateModel.ts`, weil die Oberfläche weder `@takt/export`
einbinden darf noch eine Route hat, die sie abfragen könnte.

**Entscheidung.** `GET /api/v1/export/sources` liefert die Quellen und die Transformationen. Die
Oberfläche fragt, statt zu wissen. Keine Paketabhängigkeit von `apps/web` auf `@takt/export`.

**Begründung.** Der frontend-dev hat den Vorschlag selbst gemacht und richtig begründet: Es hält
die Paketgrenze und macht die Liste zu dem, was sie ist — eine Auskunft des Dienstes. Eine
Abhängigkeit würde die Oberfläche an ein Paket binden, das sie sonst nirgends braucht.

Er hat die Doppelung so eng wie möglich gefasst — eine Vereinigung von Zeichenketten ohne
Bedeutung, mit einem `Record`, dessen Vollständigkeit der Übersetzer prüft, und der Dienst weist
eine unbekannte Quelle beim Speichern ab. Der Schaden einer Abweichung wäre eine fehlende Auswahl,
nie ein ungewollter Export. Trotzdem: Es ist die fünfte Doppelung in diesem Projekt, und die
anderen vier sind alle beseitigt worden.

---

## E-050 — „Nicht abgerechnet" wird ein eigener Anzeigezustand

**Kontext.** Offene Frage 3 aus T-031. Eine nach E-047 ausgebuchte Buchung trägt heute das Etikett
„Exportiert" — das ist ihr Statuswert und fachlich richtig (E-032, zwei Werte). Aber der Vorgang
heißt bewusst nirgends „als exportiert markieren", und danach steht genau das in der Liste.

**Entscheidung.** Ein vierter Anzeigezustand **„Nicht abgerechnet"** neben offen, exportiert und
erneut offen. Er ist ableitbar: Exportstatus `exported` bei Exportzähler 0 gibt es nur nach E-047,
das ist gemessen.

**Begründung.** Der ganze Sinn von E-047 war, dass „exportiert" nicht beschreibt, was geschehen
ist — diese Zeit wurde nie exportiert, sie wird nicht abgerechnet. Wenn die Anzeige sie dann doch
so nennt, ist die Entscheidung zur Hälfte umgesetzt, und die Unterscheidung lebt nur noch im
Protokoll, wo sie niemand sieht.

**Konsequenz.** Der Statuswert bleibt zweiwertig (E-032) — das hier ist Anzeige, kein dritter Wert
und nie ein Filterkriterium, das eine Buchung aus dem Export hält. Der frontend-dev hat den Umfang
benannt: eigene Merkmale in vier Dimensionen, Token, Kontrastpaare, ein Eintrag in der Musterseite.
`ExportStatus.tsx` ist ein abgenommener Baustein (E-024), die Erweiterung gehört entsprechend
sorgfältig gemacht.

---

## E-051 — Die Exportvorschau nimmt eine Vorlagendefinition entgegen

**Kontext.** Offene Frage 1 aus T-031. `POST /export/preview` nimmt heute nur eine
Vorlagenkennung. Eine ungespeicherte Änderung kann der Dienst deshalb nicht rendern — und die
Oberfläche darf es nicht, weil R-17 einen einzigen Renderer verlangt. Der frontend-dev hat das
richtig gelöst, indem die Vorschau ausdrücklich sagt, welchen Stand sie zeigt.

**Entscheidung.** Die Vorschau nimmt zusätzlich einen Rumpf mit einer Definition entgegen, geprüft
wie beim Speichern, aber ohne zu schreiben.

**Begründung.** A-8.7 verlangt eine Vorschau, die sich bei jeder Änderung aktualisiert. Ohne diese
Erweiterung ist sie nur mit einem zweiten Renderer in der Oberfläche erfüllbar — genau das, was
R-17 verbietet, und was in diesem Projekt schon viermal zu einer Doppelung geführt hat.

**Konsequenz.** Auflage für domain-dev, danach fällt in S-14 der Hinweis „zeigt den gespeicherten
Stand" weg.

---

## E-052 — Ark UI für Verhalten, das Designsystem bleibt

**Kontext.** Der Auftraggeber hat Takt benutzt und gemeldet, die Oberfläche wirke „nicht schön und
flüssig". Auf seinem Bildschirmfoto ist eine aufgeklappte Auswahlliste in Systemschrift zu sehen —
ein natives `<select>` kann seine Liste browserseitig nicht gestalten. Er fragte, ob eine
Component Library wie Chakra UI eingeführt werden soll, und bat ausdrücklich um eine Analyse vor
der Einführung.

**Befund.** `apps/web` hängt an React und `@takt/ui-tokens`, sonst nichts. Alle Bausteine sind
selbst gebaut, an vier Stellen steht ein natives `<select>`.

**Entscheidung.** **Ark UI** — ungestylte Verhaltensprimitive, von denselben Leuten wie Chakra UI.
Kein Chakra, kein fremdes Theming.

**Begründung.** Was fehlt, ist nicht Aussehen, sondern Verhalten. Das Designsystem ist abgenommen
(E-024), 358 Farbpaare sind gemessen, und eine gestylte Bibliothek brächte ihr eigenes Theming mit
— sie würde diese Arbeit entwerten statt sie zu ergänzen. Umgekehrt ist eine Kombobox mit
Auto-Vervollständigung nichts, was man nebenbei richtig baut: Tastaturführung, Vorlesehilfen,
Fokusverwaltung und die Zustände dazwischen sind Tage Arbeit, die anderswo erledigt ist.

Ark UI liefert genau diese Hälfte und überlässt das Aussehen den vorhandenen Token.

**Umfang.** Nur was gebraucht wird: Kombobox (für die Tag-Eingabe), Auswahlfeld (die vier nativen
`<select>`) und Kontextmenü. Alles andere bleibt selbst gebaut — die Statusetiketten, die
Notizfelder, die Exportgruppen, die Kanban-Karte tragen fachliche Bedeutung und haben kein
Gegenstück in einer allgemeinen Bibliothek.

**Zu beachten.** Der Arbeitsbereich führt strenge Lieferkettenschalter: `minimumReleaseAge` von
sieben Tagen, `blockExoticSubdeps`, `strictDepBuilds`, `trustPolicy: no-downgrade`. Ark UI zieht
Pakete nach; eine frisch veröffentlichte Fassung wird abgewiesen. Das ist Absicht (T-008a) und
kein Grund, die Schalter zu lockern — die passende Fassung wird gewählt, nicht die Regel geändert.

---

## E-053 — Die Schnittstellenbeschreibung hat zwei Abschnitte mit zwei Eigentümern

**Kontext.** `apps/local-api/openapi/takt-local-api.yaml` beschreibt sowohl die Fachrouten als auch
die Add-in-Fläche. Der integration-dev musste sie dreimal ändern, weil `proof:openapi` es erzwang —
jedes Mal außerhalb seiner Hoheit, jedes Mal als Abweichung gemeldet. Der domain-dev weist zu
Recht darauf hin, dass eine Regel, die nur in einem YAML-Kommentar und zwei Aufgabenstellungen
steht, beim nächsten Mal wieder als Abweichung auftaucht.

**Entscheidung.** Eine Datei, zwei Abschnitte:

- Die **Add-in-Abschnitte** gehören dem integration-dev, passend zu seiner Hoheit über
  `apps/local-api/src/routes/addin/**`.
- Alles Übrige gehört dem domain-dev, einschließlich der Fußnote am Dateiende und aller Aussagen
  über die Datei als Ganzes.

**Begründung.** Der Beschreibungsteil gehört zu dem, was er beschreibt. Wer eine Route ändert, muss
ihre Beschreibung mitziehen können — sonst laufen beide auseinander, und genau das ist in diesem
Projekt dreimal passiert: vier Abweichungen in T-022, zwölf in T-029, eine in T-039.

Zwei Dateien wären die Alternative gewesen. Dagegen spricht, dass `proof:openapi` die Beschreibung
gegen die tatsächlichen Routen hält und eine Aufteilung dort nur Buchführung erzeugt hätte.

**Konsequenz.** Zwei Agenten schreiben in dieselbe Datei, aber nie in dieselben Zeilen. Fassen sie
sie gleichzeitig an, gilt wie überall: Der Orchestrator setzt sie nicht in dieselbe Welle.

---

## E-054 — Kanban-Spalten sind Regeln, und das Board wird eine reine Ansicht

**Kontext.** Der Auftraggeber: „Die Statusspalte ist nicht gleichbedeutend mit einem Kanban-Board.
Ein Kanban-Board kann aus einer oder mehreren frei konfigurierbaren Spalten bestehen. Daher sollen
die Kanban-Spalten unabhängig vom Status konfigurierbar sein."

Bisher war `todo_status` beides zugleich: die Eigenschaft am Todo **und** die Spalte auf dem Board.
Ein Todo trug genau ein `status_id`, die Spalten waren die Statuswerte.

Ich habe drei Zuschnitte zur Wahl gestellt. Seine Antwort: **„Nimm Vorschlag zwei, jedoch du
darfst keine Tags setzen. Verschieben fliegt dann ebenfalls raus."**

**Entscheidung.**

- Eine Kanban-Spalte ist eine **Regel** über Tags, wie ein Pool (A-3.2, A-3.4). Frei
  konfigurierbar in Anzahl, Bezeichnung und Regel.
- **Kein Ziehen mehr auf dem Board.** Eine Regel lässt sich nicht durch Verschieben umkehren, ohne
  Tags zu setzen — und das ist ausgeschlossen.
- Der **Status bleibt** als Eigenschaft am Todo und wird in Detailansicht und Liste geändert.

**Was das aufhebt.** **A-5.2 der Spezifikation entfällt** („Todos können per Drag & Drop zwischen
verschiedenen Status-Spalten verschoben werden"), ebenso **I-14** und der zugehörige
End-to-End-Fall. A-5.6 bleibt: Der Timer lässt sich weiterhin von einer Karte aus starten.

**Was daraus folgt und vorher nicht möglich war.** Eine Karte kann in **mehreren Spalten
gleichzeitig** stehen, wenn sie mehreren Regeln entspricht. Bei Status war das ausgeschlossen, bei
Regeln ist es unvermeidlich — die Oberfläche muss es sichtbar machen, statt es zu verstecken.

**Begründung des Auftraggebers, wie ich sie verstehe.** Ein Board, dessen Spalten Regeln sind,
beantwortet Fragen, die ein Statusboard nicht kann: alle Todos eines Kunden, alle mit hoher
Priorität, alle ohne Zuordnung. Der Preis ist das Ziehen — und er hat ihn ausdrücklich in Kauf
genommen, statt ihn sich durch stilles Tag-Setzen erschleichen zu lassen. Das ist die
konsequentere Hälfte seiner Antwort.

---

## E-055 — Eine Regel ist eine Struktur mit benannten Feldern, keine Liste von Termen

**Kontext.** Der Auftraggeber wollte den Status als Regelbedingung aufnehmen. Ich hatte das als
dritten Termtyp neben `tag` und `folder` beauftragt und dem domain-dev die Frage überlassen, wie
mehrere Terme verknüpft werden — „und" oder „oder".

Dann schickte er ein Bildschirmfoto der Board-Konfiguration von **Super Productivity** mit dem
Satz: „Nimm dir ein Beispiel daran. Das regelt das."

**Was dort steht:** Erforderliche Tags. Ausgeschlossene Tags. Aufgabenstatus erledigt als
Dreiwahl mit „Alle". Planungsstatus ebenso. Projekt als Auswahl. Und ein Kästchen für
übergeordnete Aufgaben.

**Entscheidung.** Eine Regel ist eine Struktur mit benannten Feldern:

| Feld | Wirkung |
|---|---|
| Erforderliche Tags | alle müssen vorhanden sein |
| Ausgeschlossene Tags | keiner darf vorhanden sein |
| Status | Auswahl, „Alle" als Vorgabe, mehrere wählbar |
| Erledigt | Alle / Erledigt / Unerledigt |
| Exportstatus | Alle / Offen / Exportiert |

**Begründung — die Frage nach der Verknüpfung stellt sich nicht mehr.** Sie folgt aus der
Beschriftung: „Erforderlich" heißt und, „Ausgeschlossen" heißt nicht. Ein Und/Oder-Schalter
verlangt vom Benutzer, Aussagenlogik zu lesen; zwei benannte Listen verlangen nichts.

Zwei Dinge kann eine Liste gleichartiger Terme grundsätzlich nicht, und beide fehlen dadurch: Sie
hat **keinen Platz für die Verneinung** — „alles außer in Bearbeitung" ist nicht ausdrückbar —,
und ihre leere Fassung ist ein **Sonderfall**, den man eigens regeln muss. Mit „Alle" als
Vorgabewert jeder Zeile ist der Neutralzustand je Achse der Normalfall statt einer Ausnahme.

**Korrektur, 2026-09-03.** Ich hatte hier zusätzlich geschrieben, die vollständig leere Regel
solle „alles treffen statt nichts". Der domain-dev hat in T-076 widersprochen, statt es
umzusetzen — zu Recht. Es widerspricht dem Absatz weiter unten in derselben Entscheidung: Wenn
eine Regel ohne Bedingungen alles trifft, trifft ein bestehender Pool nach der Migration eben
nicht mehr dasselbe wie vorher. Und eine Regel ohne Bedingungen ist der Zustand **direkt nach dem
Anlegen** — sie spränge von „kein Todo" auf „jedes Todo", und ein Pool, der alles enthält, ist
kein Pool.

Bei Super Productivity ist das stimmig, weil dort ausschließlich Boards konfiguriert werden. Bei
uns sind Pool und Kanban-Spalte seit E-054 **dieselbe Entität**; was für die eine Fläche
einleuchtet, wäre auf der anderen falsch.

**Es bleibt also bei A-3.4 und E-054: Die leere Regel trifft nichts.** Der Neutralwert „Alle" je
Achse bleibt davon unberührt — er sagt „diese Achse schränkt nicht ein", nicht „diese Regel
trifft alles". Dass eine Spalte ohne jede Bedingung leer bleibt, gehört in den Leerzustand der
Oberfläche, nicht ins Modell.

**Was nicht übernommen wird.** Planungsstatus, Rückstandsaufgaben, Projekt und übergeordnete
Aufgaben — die Begriffe gibt es in Takt nicht. „Sortieren nach" ist Anzeige, keine Regel.

**Was dazukommt und im Vorbild fehlt.** Der **Exportstatus** als Dreiwahl. Er ist bei Takt die
Unterscheidung, um die sich alles dreht, und beantwortet als Spalte die Frage „was habe ich noch
nicht abgerechnet".

**Konsequenz.** Bestehende Regeln müssen überführt werden. Ob eine heutige Tagliste „alle davon"
oder „mindestens eines davon" bedeutet, entscheidet, ob ein Pool nach der Migration dasselbe
trifft wie vorher — das ist nachzusehen, nicht zu raten.

---

## E-056 — Der Aufgabenbereich nennt auch, woraus ein Todo verschwindet

**Frage aus T-078.** Eine Regel mit `completion: 'done'` kann das Add-in **nie** nennen: Das
Buchen hebt „Erledigt" auf (A-2.5), also fällt das Todo aus jedem Pool heraus, der Erledigte
sammelt. Soll der Aufgabenbereich das aussprechen, oder still bleiben?

**Entscheidung: aussprechen** — ein Satz, und nur wenn es tatsächlich Pools betrifft.

**Warum.** Der Satz erscheint ausschließlich im Wiederöffnen-Fall, also genau dann, wenn das Todo
erledigt war. Sein Zweck ist, dem Benutzer die Folge seiner Handlung zu zeigen, bevor sie
eintritt. Das Verschwinden ist dieselbe Folge wie das Erscheinen, nur in die andere Richtung —
sie wegzulassen macht die Auskunft nicht kürzer, sondern halb.

Entscheidend ist der Fall, für den man so eine Spalte überhaupt anlegt: **erledigt und noch nicht
abgerechnet** (`completion: 'done'` mit `exportState: 'open'`). Wer dort arbeitet, benutzt die
Spalte als Abrechnungsliste. Bucht er per Add-in auf eine Karte, verschwindet sie aus genau der
Liste, in der er sie sucht — und das ist der Moment, in dem eine unerklärte Bewegung als
Datenverlust gelesen wird.

**Nicht** aussprechen, wenn keine Regel betroffen ist. Kein zweiter Absatz, keine zweite Liste;
die Nennung gehört in denselben Satz wie das Erscheinen.

---

## E-057 — Ein Ordnerterm, der auf nichts auflöst, ist eine Bedingung ohne Treffer, kein Neutralwert

**Befund aus T-080.** In `matchesPool` gilt eine leere Tagmenge als Neutralwert der Achse. Ein
Ordnerterm über einen leeren Ordner löst auf eine leere Menge auf — und **verschwindet damit aus
der Regel**. „Tags aus Ordner X **und** Status offen" wird zu „Status offen". Die Regel trifft
mehr, als der Benutzer gesagt hat.

Bei einer Regel, die nur aus diesem Term besteht, fällt es nicht auf: Sie ist dann leer und trifft
nichts (A-3.4), und ein bestehender Prüffall belegt genau das. Sobald eine zweite Achse dazukommt,
ist die Regel nicht mehr leer, die Ordnerachse aber still weg.

**Entscheidung.** Ein Ordnerterm, der auf keinen Tag auflöst, ist keine neutrale Achse. Er ist
eine **Einschränkung ohne Treffer** — und die Regel trifft damit nichts, unabhängig vom Modus und
von den übrigen Achsen.

**Warum.** Der Benutzer hat eine Einschränkung ausgesprochen. Dass sie sich ins Leere auflöst,
macht sie nicht zur Nicht-Einschränkung; es macht sie zur Einschränkung, die niemand erfüllt.
Die Alternative — die Achse fällt weg — ist der gefährliche Fehler in die falsche Richtung: Eine
Spalte, die plötzlich mehr zeigt, wird nicht bemerkt. Eine, die leer bleibt, wird bemerkt, und
seit T-080 steht die aufgelöste Tagzahl am Pool, sodass die Oberfläche sagen kann, **warum**.

**Zum Modus.** Aussagenlogisch wäre „alle davon" über eine leere Menge wahr (Vakuum) und
„mindestens eines davon" falsch. Diese Unterscheidung wird hier **nicht** nachgebaut: Der
Benutzer meint mit „Ordner X" nicht die Menge, sondern die Zugehörigkeit zu X — und die hat
niemand, wenn X leer ist. Beide Modi treffen nichts.

**Nicht betroffen.** Ein Term, der auf mindestens einen Tag auflöst, verhält sich wie bisher.
Ausgeschlossene Tags über einen leeren Ordner schließen nichts aus — das ist die richtige
Lesart von „keiner davon" über nichts, und es engt nicht ein, sondern lässt in Ruhe.

## E-058 — Die Poolbewegung wird einmal berechnet und an beiden Flächen in denselben Worten gesagt

**Befund aus R-1 und R-2 (2026-09-03).** Der Satz `CARD_STAYS` („Die Karte bleibt, wo sie ist —
die Spalte ändert sich dadurch nicht.") steht zeichengleich in `apps/web/src/lib/labels.ts` und
`apps/outlook-addin/src/duplicate/reopen.ts`. Er stammt aus der Zeit, in der eine Spalte nur an
Tags hing. Seit E-055 entscheidet eine Spalte auch über „Erledigt" und über den Exportstatus, und
beides ändert ein Timerstart: Das Kennzeichen fällt, die erste Buchung setzt „hat offene
Buchungen". Der Satz ist also falsch, und er ist es an vier Flächen gleichzeitig. Dazu berechnet
das Add-in die Bewegung serverseitig (`bookingStates`, drei Listen), die Hauptanwendung fragt
`poolsContaining` und kürzt bei zwölf — zwei Auskünfte für dieselbe Handlung, und die zweite
kennt `leaves` nicht.

**Entscheidung.**

1. Die Bewegung eines Todos durch die Pools ist **ein** Anwendungsfall des lokalen Dienstes:
   `apps/local-api/src/usecases/pool-movement.ts` nimmt das Zustandspaar vor und nach der
   Handlung (Tags, Status, `completedAt`, offene und exportierte Buchungen) und alle Pools
   (`list('all')`, auch reine Board-Spalten) und liefert `{ appears, enters, leaves }` mit den
   Bedeutungen aus T-084: `appears` = gilt nachher, `enters` = gilt nachher und galt vorher nicht,
   `leaves` = galt vorher und gilt nachher nicht. Der Add-in-Dienst benutzt ihn statt einer
   eigenen Fassung; `POST /timer/start` liefert ihn als `poolMovement` mit, wenn der Start das
   Kennzeichen aufgehoben hat oder die erste Buchung entsteht — sonst `null`.
2. Der Satz dazu ist eine reine Funktion in `packages/domain` (`poolMovementSentence(movement,
   tense)`), übernommen aus `reopen.ts` und in einer Hinsicht geändert: Er spricht nicht mehr von
   „Poolregel auf seine Tags", sondern von „Regel", weil eine Regel fünf Achsen hat. Beide
   Oberflächen rufen diese Funktion; keine hält eine eigene Abschrift. `CARD_STAYS` entfällt
   ersatzlos — wo nichts hinzukommt und nichts wegfällt, sagt die Funktion das, und wo sich etwas
   ändert, sagt sie was.
3. Reihenfolge: domain-dev baut 1 und 2 (Welle A). integration-dev und frontend-dev stellen um,
   sobald beides steht (Welle B). Bis dahin bleibt der falsche Satz stehen, mit Board-Eintrag,
   nicht stillschweigend.

**Warum die Funktion in der Domäne liegt.** Sie ist reine Abbildung von drei Listen auf einen
Satz, ohne HTTP und ohne SQL. Ein Text, der an zwei Flächen zeichengleich sein muss, hat genau
eine Quelle; `proof:addin` prüft die Gleichheit weiter, jetzt gegen die Funktion statt gegen eine
Abschrift.

**Nicht entschieden.** Ob der Aufgabenbereich des Add-ins den *Grund* einer fehlenden Spalte nennen
kann (O-K), bleibt beim Auftraggeber.

**Ergänzung (2026-09-03, nach Welle A).**

4. **Kein Gattungswort im Satz.** Die drei Listen tragen Namen, aber keine Fläche, und die
   Funktion darf nicht raten, ob ein Name einen Pool, eine Kanban-Spalte oder beides bezeichnet.
   Der Satz nennt deshalb nur den Namen in Anführungszeichen: „Es erscheint dann wieder in
   „Abrechnung“ und „Ost“.", nicht „in dem Pool „Abrechnung““. Die Zahl der Namen ändert nur die
   Aufzählung, nicht den Artikel. Der Satz ohne Treffer lautet: „Auf dieses Todo passt derzeit
   keine Regel — es erscheint danach in keinem Pool und in keiner Spalte." (Ankündigung) bzw.
   „Auf dieses Todo passt derzeit keine Regel, es erscheint also in keinem Pool und in keiner
   Spalte." (Bericht). „… und erscheint in keinem anderen" wird zu „… und erscheint sonst
   nirgends", weil „anderen" ohne Gattungswort keinen Bezug mehr hat. Alle übrigen Sätze aus
   T-089 bleiben, nur der Einschub `inPools` wird durch die reine Aufzählung ersetzt. Der
   vollständige Wortlaut aller vierzehn Sätze steht in `.claude/team/board.md` bei T-093 und
   ist die Vorlage für Domäne, Tests und beide Oberflächen.
5. **Dritter Parameter `occasion`** (`'reopen' | 'booking'`) bleibt, wie in T-089 gebaut, ohne
   Vorgabewert; die Überladungen (`'reopen'` gibt `string`, `'booking'` gibt `string | null`)
   sind die Signatur, gegen die beide Oberflächen bauen.
6. **Auch `POST /timer/stop` und `POST /timer/orphaned/resolve` liefern `poolMovement`**, mit
   Anlass `'booking'`: Die erste abgeschlossene Buchung setzt „hat offene Buchungen", und jede
   Spalte mit `exportState: 'open'` nimmt das Todo damit auf. Wer nur am Start eine Auskunft gibt
   und am Stopp schweigt, sagt die halbe Wahrheit. `null`, wenn sich nichts bewegt.
7. **`GET /addin/context` bleibt bei `list()`.** Der Aufgabenbereich hat kein Board; die Liste
   dort dient der Auswahl. Reine Spalten erreichen das Add-in ausschließlich über den
   Bewegungssatz.

## E-059 — Zwei Wortlaute der Oberfläche, aus T-091

- Der Exportstatus einer Spalte heißt in der Oberfläche **„Noch nicht abgerechnet"** und
  **„Abgerechnet"**, nicht „Offen" und „Exportiert". „Offen" ist bereits das Gegenteil von
  „Erledigt" (Achse Erledigt) und darf nicht zugleich das Gegenteil von „Exportiert" sein; ein
  Wort mit zwei Bedeutungen auf demselben Dialog ist ein Fehler, den der Benutzer ausbadet.
  Der Wert im Datenmodell (`export_state = 'open'`) bleibt.
- **„Vom Board nehmen" fragt nicht nach**, sondern bietet „Rückgängig" an — auf dem Board und im
  Regeldialog. Die Handlung ist umkehrbar und verliert nichts (die Regel bleibt als Pool
  bestehen); ein Bestätigungsdialog vor einer umkehrbaren Handlung ist Reibung ohne Schutz.
  Löschen einer Regel fragt weiterhin nach.

## E-060 — Auch „Erledigt" setzen und aufheben von Hand liefern die Poolbewegung

**Befund (O-U, aus T-093 und R-2a, 2026-09-04).** `PUT` und `DELETE /todos/{todoId}/done`
liefern kein `poolMovement`; der Board-Toast nach „Erledigt" schweigt deshalb über Spalten,
während derselbe Übergang über einen Timerstart angesagt wird. Die Begründung aus E-058 Punkt 6
gilt wörtlich: Wer an einer Stelle Auskunft gibt und an der anderen schweigt, sagt die halbe
Wahrheit — und seit E-055 ist „Erledigt" eine Achse, die Spalten entscheidet.

**Entscheidung.**

1. Beide Routen liefern `poolMovement: { appears, enters, leaves } | null`, gerechnet vom
   selben Anwendungsfall `usecases/pool-movement.ts` aus dem Zustandspaar vor und nach der
   Handlung, mit `list('all')`. `null`, wenn sich nichts bewegt.
2. **Zwei Anlässe genügen.** `DELETE /done` (Aufheben) ist der Anlass `'reopen'`: Das Todo war
   erledigt und kehrt zurück; „wieder" stimmt. `PUT /done` (Setzen) nimmt den Anlass `'booking'`.
   Dessen Satz trägt kein Wort von Buchung — „Es steht jetzt in „Erledigt“ und ist aus „Offen“
   verschwunden." — und nennt nur `enters` und `leaves`; das ist die neutrale Form für jede
   Bewegung, die keine Rückkehr ist. Ein dritter Anlass hätte denselben Satz mit anderem Namen.
3. Der Anlass wird **nicht** umbenannt. `'booking'` steht in Domäne, Dienst, Oberfläche, Add-in
   und den End-to-End-Tests; ein treffenderer Name (`'plain'`) kostete vier Hoheiten und gewänne
   nichts, was der Kommentar an `PoolMovementOccasion` nicht auch sagt. Der Kommentar dort nennt
   künftig beide Anlässe, für die die neutrale Form steht.
4. Die Oberfläche nutzt den Satz im Toast nach beiden Handlungen wie beim Stopp (E-058 Punkt 6):
   Zeitform `'past'`, Zeile weglassen, wenn `null`. Der Bewegungssatz ist der Rumpf.

   **Richtiggestellt nach T-116 (Auflage 1, 2026-09-04).** Dieser Punkt nannte als Titel die
   Sätze „Erledigt." und „Wieder offen."; gebaut ist „„X“ ist erledigt." beziehungsweise
   „„X“ ist wieder offen.". Der Code hat recht und die Entscheidung wird nachgezogen: E-060
   verweist für die Form auf E-058 Punkt 6, und der Stopp-Toast trägt den Namen des Todos seit
   R-2a W-5 im Titel. Ein Titel ohne Namen wäre in einer Liste von Meldungen nicht zuzuordnen —
   genau der Grund, aus dem W-5 den Namen dort hineingeholt hat. Die jüngere Regel schlägt den
   älteren Wortlaut.

## E-061 — Eine Rechnung, eine Wirkung, eine Form für die Poolbewegung

**Befund (O-S, O-T, R-1a, 2026-09-04).** Das Zustandspaar „Wirkung einer Buchung"
(`completedAt: null`, `hasOpenEntries: true`) wird an vier Stellen gebildet: zweimal in den
Add-in-Routen, in `timer/start` und in `timer/stop` samt `orphaned/resolve`. Und die Bewegung
hat zwei Formen: Die Add-in-Routen liefern `poolNames`/`enteringPoolNames`/`leavingPoolNames`,
die Timer-Routen `poolMovement: { appears, enters, leaves }`. Zwei Hoheiten, eine OpenAPI.

**Entscheidung.**

1. **Die Wirkung liegt in der Domäne.** Was eine Buchung an einem Todo ändert — Kennzeichen
   fällt, „hat offene Buchungen" wird wahr — ist Fachwissen und steht als benannte Konstante
   bzw. reine Funktion in `packages/domain` (Arbeitstitel `BOOKING_EFFECT`, Name ist Sache von
   domain-dev). Sie kennt weder Buchungen im Speicher noch Pools.
2. **Die Rechnung liegt im Anwendungsfall.** `usecases/pool-movement.ts` bekommt eine Hilfsfunktion
   (Arbeitstitel `bookingMovementStates(todo, entries)`), die das Zustandspaar aus dem Todo und
   seinen Buchungen bildet, indem sie die Wirkung aus 1 anwendet. Alle vier Stellen rufen sie;
   keine bildet das Paar selbst.
3. **Eine Form.** `poolMovement: { appears, enters, leaves } | null` ist die einzige Form, in
   der eine Bewegung über HTTP geht — auch an den Add-in-Routen. Die drei Namenslisten dort
   entfallen; das Add-in liest `poolMovement` und ruft `poolMovementSentence` wie bisher.
4. **Reihenfolge.** domain-dev baut 1 und 2 und stellt die Timer-Routen um (Welle E).
   integration-dev stellt die Add-in-Routen, das Add-in und den Add-in-Abschnitt der OpenAPI um
   (Welle F, nach E-053 getrennte Abschnitte, deshalb nicht dieselbe Welle). Bis dahin bleiben
   die Add-in-Routen bei den drei Listen, mit Board-Eintrag.

**Nachtrag (O-V, 2026-09-04).** Auch `POST /time-entries` — die Buchung von Hand — kann die
erste Buchung eines Todos sein und damit `hasOpenEntries` von falsch auf wahr setzen; ein Todo
ohne Buchung erscheint dann in einer Spalte `exportState: 'open'`. Die Route liefert deshalb
`poolMovement` nach derselben Rechnung wie der Timerstopp — `closedEntryMovementStates` mit
`ENTRY_CLOSED_EFFECT`, denn eine Buchung von Hand hebt „Erledigt" nicht auf (A-2.5, nur der
Timerstart tut das); `bookingMovementStates` wäre falsch, es meldete für ein erledigtes Todo ein
Verlassen jeder `completion: 'done'`-Spalte, das nicht stattfindet — und mit demselben Anlaß
`'booking'` wie der Timerstopp; `null` gilt wie überall, wenn keine Bewegung möglich war. Die
Oberfläche nutzt den Satz im Toast „Zeit gebucht." wie beim Stopp (E-058 Punkt 6) und nennt
das Todo in derselben Form wie dort. Ein Zeitraum, der die Buchung ändert (`PATCH`), bewegt
nichts und bleibt ohne `poolMovement`; das gilt auch, wenn der `PATCH` das `todoId` umhängt
und damit die Achse an zwei Todos in entgegengesetzte Richtungen umlegt (offen als O-X).
*(Richtiggestellt nach T-107, Frage 1: Die erste Fassung nannte `bookingMovementStates`; das war
ein Versehen des Orchestrators.)*

## E-062 — Bausteine der Oberfläche werden im Browser geprüft, nicht in einer Nachbildung

**Befund (T-111 Frage 1, 2026-09-04).** `evict()` in `apps/web/src/app/ToastContext.tsx` ist die
Regel, die seit W-10 eine Meldung mit Rückweg vor dem Verdrängen schützt — seit E-059 der
einzige Schutz vor „Vom Board nehmen". Der unit-tester konnte sie nicht prüfen: Es gibt keinen
Testrahmen für React-Bausteine im Baum, `evict` ist nicht ausgeführt, und beides zu ändern lag
außerhalb seiner Hoheit.

**Entscheidung.** Es kommt kein jsdom und keine Testing-Library dazu. Was eine Fläche tut, wird
dort gemessen, wo sie steht: im Browser, über Playwright. T-108 hat fünf Erwartungen an
`evict()` gegen den echten Baustein gemessen, T-113 legt den End-to-End-Fall daneben. Eine
Nachbildung des Browsers würde eine zweite Wahrheit über Ereignisse, Zeit und Fokus aufmachen,
und der Fall, der uns hier interessiert — eine Meldung überlebt vier andere und ihr Knopf ist
bedienbar —, ist genau der, den eine Nachbildung am schlechtesten trifft (siehe T-110: Der
Stapel lag über einem Dialog, mit der Maus bedienbar und mit der Tastatur unerreichbar; das
sieht man nur im Browser).

**Folge.** Reine Funktionen der Oberfläche (`lib/**`, Formatierer, Aufzählungen) prüft der
unit-tester weiter mit Vitest. Alles, was einen Baum, ein Ereignis oder eine Zeit braucht,
gehört dem e2e-tester. Sagt ein unit-tester „nicht prüfbar, kein Testrahmen", ist das kein
Auftrag an den Orchestrator, einen zu beschaffen, sondern der Hinweis, dass der Fall in die
End-to-End-Ebene gehört.

## E-063 — Fremder Text wird isoliert und markiert, Eingabefelder nicht

**Befund (T-119, 2026-09-04).** Der Aufgabenbereich zeigt Text, den ein anderer geschrieben hat —
Betreff, Absender, Textkörper. Das ist dort der Regelfall und nicht die Ausnahme. Ein `U+202E` im
Betreff drehte die Anzeige um, ohne je durch die Tür zu gehen: Die Zeichenwache greift beim
Anlegen, die Anzeige kommt davor. `unicode-bidi: isolate` allein reicht dagegen **nicht** — es
schützt die Umgebung, aber innerhalb des isolierten Blocks dreht ein `U+202E` weiter um
(UBA X2–X5); `bidi-override` hilft ebenfalls nicht. Das ist die Berichtigung des Vorschlags aus
T-114.

**Entscheidung.**

1. **Anzeigen und Eingeben sind zwei verschiedene Dinge.** Fremder Text, der angezeigt wird, läuft
   über einen Baustein, der ihn in ein `<bdi>` setzt und ihm die unsichtbaren Zeichen nimmt. Text
   in einem Eingabefeld bleibt unangetastet: Seinen Inhalt zu ändern hieße, die Eingabe des
   Benutzers zu ändern.
2. **Markieren, nicht streichen.** Ein entferntes Zeichen ist eine Anzeige, die verschweigt, daß
   etwas da war. Die Anzeige setzt `U+FFFD` an seine Stelle, sichtbar.
3. **Der Vorschlag wird bereinigt, die Eingabe abgewiesen** (aus T-114, gilt weiter). Was der
   Benutzer nicht selbst geschrieben hat, darf die Anwendung glattziehen; was er geschrieben hat,
   weist sie zurück und sagt warum.
4. **Ein Nachweis prüft gegen die Tür, nicht gegen eine Abschrift der Tür.** T-117 erweiterte die
   Zeichenklasse um `U+061C`, `U+200E`, `U+200F` und der Nachweispfad des Add-ins bemerkte es
   nicht, weil er gegen eine kopierte Liste hielt — die Sackgasse aus T-114 stand für drei Zeichen
   wieder offen. Wer zwei Stellen zusammenhalten will, fragt die maßgebliche ab und schreibt sie
   nicht ab.

5. **Und er prüft, ob es zwei Fassungen gibt — nicht, ob sie dasselbe tun.** Nachsatz aus T-123,
   mit einer Messung belegt: Setzt man die alte, **zeichengleiche** Fassung wieder ein, bleiben
   163 Verhaltensprüfungen grün. Ein Ergebnisvergleich wird erst rot, wenn die Doppelung schon
   falsch ist — er bewacht den Schaden, nicht die Ursache. Der Wächter fragt deshalb nach der
   Gleichheit der Sache selbst (dieselbe Funktion, derselbe Ort) und danach, dass es keinen
   zweiten Träger gibt: keine zweite Fassung im Quelltext, keine zweite Aufzählung in einer
   Beschreibung. Eine Beschreibung, die eine Klasse aufzählt, ist eine Abschrift, die nur nicht
   rot werden kann; sie verweist stattdessen auf den einen Ort.

6. **Wo die Behandlung für den Normalfall die Identität ist, kann kein Verhaltenstest sie
   vermissen.** Nachsatz aus T-129, wieder mit einer Zahl: 175 behandelte Stellen und 71 grüne
   Tests haben **elf rohe Anzeigestellen** nicht bemerkt — darunter die Vorschau der Exportzeile,
   also die Ansicht, an der ein Benutzer prüft, was er abrechnet. Für einen gewöhnlichen Namen
   liefert die Behandlung denselben Text zurück; ein Test, der Namen einsetzt, sieht nie einen
   Unterschied. Dann genügt es nicht, die Behandlung zu haben — die **Pflicht** muß im Typ
   stehen und ein Wächter sie lesen. Die Herkunft eines Textes gehört deshalb in seinen Typ und
   nicht in eine gepflegte Namensliste im Nachweis: Eine Liste ist wieder eine Abschrift, und
   Punkt 4 gilt für sie wie für jede andere.

---

## E-064 — Die Versionsprüfung ist die einzige Verbindung nach außen, und sie darf nur fragen

**Kontext.** Der Auftraggeber am 2026-09-04: Takt soll beim Start und regelmäßig prüfen, ob auf
GitHub eine neuere Fassung vorliegt, den Benutzer fragen und ihn zur Release-Seite führen —
ausdrücklich **ohne** eigenen Download und **ohne** eigene Installation. Aufgenommen als
Abschnitt 18 der Spezifikation, A-18.1 bis A-18.12.

**Entscheidung.**

1. **E-001 gilt weiter, wird aber benannt eingeschränkt.** Takt kannte bisher keine Adresse
   außerhalb von `127.0.0.1`. Ab hier kennt es genau eine: die Releases des offiziellen
   Bestands. Sie steht fest im Erzeugnis, ist nicht einstellbar, und **keine Antwort kann sie
   verlegen** — weder über einen Verweis in der Antwort noch über eine Umleitung. Alles andere
   an E-001 bleibt unberührt: kein Cloud-Dienst, kein Datenbankserver, keine Telemetrie.

2. **Die Frage stellt der lokale Dienst, nicht die Oberfläche.** Die CSP der Hülle erlaubt dem
   Webview `connect-src` nur auf sich selbst, `ipc:` und `http://127.0.0.1:17843`
   (`tauri.conf.json`). Die Oberfläche kann GitHub also gar nicht fragen, und das soll so
   bleiben: Eine Liste, die man für eine Funktion aufmacht, bleibt für alles andere offen. Der
   Dienst holt die Antwort, wirft alles weg, was er nicht braucht, und gibt der Oberfläche eine
   Fassung, einen Verweis und sonst nichts.

3. **Die Ordnung der Versionsnummern liegt in `packages/domain`.** Sie ist Fachlogik ohne HTTP
   und ohne SQL, sie wird an drei Stellen gebraucht (Dienst, Oberfläche, Prüfungen), und ein
   Zeichenkettenvergleich stellt `0.10.0` vor `0.9.0`. Dazu gehört die Regel, wann überhaupt
   etwas gezeigt wird: neuer **und** nicht übersprungen.

4. **Die Release-Seite öffnet die Hülle, und sie baut die Adresse selbst.** `tauri-plugin-shell`
   liegt bereits vor. Der Befehl nimmt **keine** Adresse entgegen, sondern höchstens die
   Fassungsbezeichnung, prüft sie gegen eine enge Form und setzt sie in eine im Erzeugnis
   festgelegte Adresse ein. Eine Adresse aus einer Antwort an einen Öffnen-Befehl zu reichen
   wäre dieselbe Bauart wie eine offene Weiterleitung — nur mit dem Browser des Benutzers als
   Ziel.

5. **Übersprungen wird eine Fassung, nicht die Prüfung.** Der übersprungene Wert steht als
   Einstellung im Bestand, wie jede andere Einstellung. Eine spätere, höhere Fassung meldet sich
   wieder. Es gibt keinen Schalter „nie wieder fragen", weil er nicht verlangt wurde.

6. **Ein Fehlschlag ist kein Ereignis.** Nicht erreichbar, unerwartete Antwort, fehlende
   Fassungsangabe, gar keine Veröffentlichung: Die Prüfung endet still, der Grund steht im
   Protokoll, die Oberfläche zeigt nichts. Ein Hinweis „Aktualisierungsprüfung fehlgeschlagen"
   wäre eine Fehlerfläche für ein Problem, das den Benutzer bei seiner Arbeit nicht behindert.

**Konsequenz.** Der Dienst bekommt eine Route und einen Ausgang ins Netz; damit gehört die
Verbindung ins Bedrohungsmodell (neues Risiko R-19) und in die Prüfung jeder künftigen Freigabe.
Die Zeitüberschreitung, das Fehlen jeder Weiterleitung auf einen fremden Wirt und die Obergrenze
der gelesenen Antwort sind Teil der Umsetzung und nicht Feinschliff.

---

## E-065 — Die Fassung von Takt steht an einer Stelle

**Kontext.** `tauri.conf.json`, `apps/desktop/package.json`, `Cargo.toml` und jede
Arbeitsbereichsdatei tragen heute `0.0.0`. Eine Prüfung gegen GitHub braucht eine Zahl, die
etwas bedeutet, und A-18.1 verlangt sie aus **einer** Quelle.

**Entscheidung.** Führende Quelle ist `version` in `apps/desktop/src-tauri/tauri.conf.json`. Die
Hülle liest sie zur Laufzeit aus den Angaben des Erzeugnisses und gibt sie der Oberfläche; sie
wird nicht abgeschrieben. Wo eine zweite Datei dieselbe Zahl führen muss, wird sie beim Bauen
daraus abgeleitet und der Gleichlauf gemessen — dieselbe Regel wie bei den Zahlen aus T-128 und
O-AS: nicht „hier steht dasselbe", sondern „das kommt von dort".

**Konsequenz.** Solange `0.0.0` steht, ist jede veröffentlichte Fassung neuer, und die Prüfung
meldet sich sofort. Das ist richtig so und keine Fehlfunktion; die erste echte Fassungsnummer zu
vergeben ist eine Entscheidung des Auftraggebers und keine des Bauablaufs.

---

## E-066 — Die feste Adresse und die prüfbare Naht sind nicht dasselbe

**Kontext.** T-137 hat den Testplan vor dem Bau geschrieben und dabei die Frage gestellt, an der
er hängt: Wie zeigt der Dienst im Prüflauf auf eine Nachbildung von GitHub, ohne A-18.3 zu
verletzen („Die Adresse ist fest im Erzeugnis hinterlegt und weder einstellbar noch aus einer
Antwort übernehmbar")? 22 von 26 Fällen warten darauf. Dazu drei kleinere Fragen aus derselben
Aufgabe.

**Entscheidung.**

1. **Einstellbar heißt: von außen veränderbar. Das ist die Grenze, und sie verläuft am Prozess.**
   A-18.3 verbietet, dass irgendetwas **außerhalb** des Erzeugnisses die Adresse verlegt: keine
   Route, keine Einstellung im Bestand, keine Umgebungsvariable, kein Argument der Befehlszeile,
   keine Datei daneben, keine Antwort und keine Weiterleitung. Der Sidecar kennt schon heute
   keine Argumente (B-1.6 Punkt 1); dieselbe Härte gilt hier.

   Sie verbietet **nicht**, dass der Zusammenbau im selben Prozess eine andere Abholfunktion
   einsetzt. Genau so hängt in diesem Bestand jeder andere Anschluss: `compose()` nimmt Ports,
   der Adapter ist austauschbar (E-001, E-035), und der Prüflauf baut sich seinen eigenen
   Zusammenbau. Die Adresse bleibt dabei eine Festlegung im Erzeugnis mit genau einem Ort; die
   **Naht** ist die Abholfunktion, nicht die Zeichenkette.

   Bedingung, ohne die diese Entscheidung nicht gilt: Es muss ein Nachweis messen, dass im
   ausgelieferten Zusammenbau **kein** Weg zu einer anderen Adresse führt. Ohne diesen Nachweis
   ist die Naht ein Schalter, den nur noch niemand gefunden hat.

2. **Gefragt wird `GET /repos/<besitzer>/<bestand>/releases/latest`.** Ein Gegenstand statt einer
   Liste, Entwürfe und Vorabfassungen sind darin von GitHub bereits ausgenommen, und „es gibt
   keine Veröffentlichung" ist ein 404 und damit ein klarer, stiller Fall (A-18.11).

3. **Die Ordnung folgt der Vorrangregel von SemVer**, einschließlich „Vorabfassung steht unter
   der gleichnamigen Fassung". Sie wird gebraucht, obwohl Punkt 2 keine Vorabfassung liefern
   kann: Die **installierte** Fassung kann eine sein, und dann muss `1.2.0-rc.1` unter `1.2.0`
   stehen. Ein führendes `v` gehört zur Bezeichnung der Veröffentlichung, nicht zur Fassung, und
   wird vor dem Vergleich abgeschnitten — an genau einer Stelle.

4. **Der Nachweis `proof:release-safety` gehört zu T-138** (Skript unter
   `apps/local-api/scripts/`, es sieht den ganzen Baum an). Der Eintrag in `proof:all` ist Sache
   des Orchestrators. Er misst mindestens: genau eine Adresse im Baum, kein Weg von einer Antwort
   zum Öffnen-Befehl, und nirgends ein Herunterladen einer Datei aus einer Veröffentlichung.

**Konsequenz.** T-138 kann bauen. Die eigentlichen Prüfdateien unter `tests/e2e/**` samt der
Nachbildung der GitHub-Antwort bekommen eine eigene Aufgabe (T-142) in derselben Welle wie die
Umsetzung, nicht davor — sie brauchen die Naht aus Punkt 1.

---

## E-067 — Woher die Hülle die Fassung nimmt, und was sie dem Öffnen-Befehl nicht gibt

**Kontext.** T-136 hat gemessen, was `tauri-plugin-shell` auf dem Rust-Weg prüft: **nichts.**
`Shell::open` reicht durch an `open::open(None, …)`, und die Quelle sagt dort wörtlich, dass bei
einem Aufruf aus Rust nicht geprüft werden muss; der Prüfbereich wird nur bei Aufrufen aus
JavaScript betreten. Damit ist die Formprüfung der Fassungsbezeichnung die **einzige** Kontrolle
zwischen der Antwort von GitHub und `xdg-open` beziehungsweise `ShellExecuteW`. Zweiter Befund:
Die Vorgabeberechtigung `shell:default` enthält `allow-open` mit einem Muster, das **jede**
`https:`-Adresse durchlässt — eine Zeile in `capabilities/default.json` wäre eine offene
Weiterleitung in den Browser des Benutzers. Dazu die Frage aus T-136-3: E-065 sagt nicht genau
genug, woher die Fassung zur Laufzeit kommt.

**Entscheidung.**

1. **Die Hülle liest die Fassung aus den einkompilierten Angaben des Erzeugnisses**
   (`app.package_info().version`, gefüllt aus `tauri.conf.json` beim Bauen). **Nicht** aus einer
   Datei neben der Binärdatei, nicht aus einer Umgebungsvariablen, nicht aus einem Argument.
   Sonst hinge die Aussage „diese Fassung ist installiert" an etwas, das jeder Prozess auf dem
   Rechner ändern kann — und an ihr hängt, ob ein Hinweis erscheint und welche Adresse geöffnet
   wird.

2. **In `apps/desktop/src-tauri/capabilities/**` steht keine Shell-Berechtigung.** Weder
   `shell:default` noch `shell:allow-open`. Der Öffnen-Weg läuft ausschließlich über einen
   eigenen Befehl in Rust, der die Fassungsbezeichnung gegen eine enge Form prüft und die Adresse
   selbst zusammensetzt. Das ist keine Vorsicht mehr, sondern die einzige vorhandene Kontrolle.

3. **Beides wird gemessen, nicht zugesagt.** Ein Nachweis hält fest, dass die Berechtigungsdateien
   keine Shell-Zeile tragen und dass die zugesagten Einträge der CSP mit denen in
   `tauri.conf.json` übereinstimmen (T-136-2: die Zusage nennt drei, die Datei trägt vier). Vor
   dem Bau kostet das eine halbe Stunde, danach eine Wiedervorlage.

**Konsequenz.** Auflagen für T-139. Die zwanzig Auflagen aus `docs/bedrohungsmodell.md`
Abschnitt 18.9 sind die Bedingung der Freigabe von T-136 und werden dort Auflage für Auflage
gegen den Code wiedervorgelegt, nicht gegen den Entwurf.

---

## E-068 — Kein Schalter, den niemand verlangt hat

**Kontext.** T-136 fragt, ob die Versionsprüfung abschaltbar sein soll. Abschnitt 18 der
Spezifikation verlangt keinen Schalter; E-064 verbietet nur ein „nie wieder fragen" für den
Hinweis.

**Entscheidung.** Vorerst kein Schalter. Ohne Anforderungs-ID wird nichts gebaut — das ist die
Regel, und sie gilt auch, wenn die Erweiterung klein und plausibel wäre. Die Frage geht als
**F-18** an den Auftraggeber, weil sie ihm gehört: In einer Anwendung, die für sich in Anspruch
nimmt, ausschließlich lokal zu laufen, ist „darf ich das abstellen?" eine berechtigte Frage und
keine Bequemlichkeit.

**Konsequenz.** Wird der Schalter gewünscht, ist er eine Einstellung wie jede andere und keine
Ausnahme im Startpfad.

---

## E-069 — Die Prüfung läuft nach der Uhr, die Route liest nur ab

**Kontext.** Auflage A-V-10 aus `docs/bedrohungsmodell.md` 18.9: Der Netzaufruf darf **nie** in
einem eingehenden Anfragebehandler liegen. Sonst taktet jeder lokale Prozess, der das
Sitzungsgeheimnis hat (R-02), das Lebenszeichen aus R-19 Punkt 3 und verbraucht die
Ratenbegrenzung von GitHub. Der naheliegende Entwurf — die Oberfläche fragt eine Route, die Route
fragt GitHub — ist damit ausgeschlossen. Er war in E-064 nicht ausdrücklich verboten, und ohne
diesen Eintrag hätte ihn jemand gebaut.

**Entscheidung.** Der Dienst prüft **von sich aus**: einmal beim Start, danach höchstens einmal
in 24 Stunden. Das Ergebnis liegt im Arbeitsspeicher des Dienstes. Die Route gibt genau dieses
Ergebnis heraus und löst **nie** eine Anfrage aus — auch nicht, wenn noch keines vorliegt; dann
antwortet sie „noch nichts geprüft", und das ist eine gültige Antwort und kein Fehler.

Der Vergleich selbst bleibt in der Oberfläche, weil dort die installierte Fassung liegt (E-067
Punkt 1): Die Hülle nennt sie, `packages/domain` ordnet, die Oberfläche entscheidet, ob etwas
erscheint. Der Dienst weiß nur, was GitHub zuletzt gesagt hat.

**Konsequenz.** Die Häufigkeit steht an einer Stelle und ist ablesbar. Ein zweiter Aufruf der
Route kostet nichts. Und der Weg, auf dem ein fremder lokaler Prozess Takt zum Senden bringt,
existiert nicht — statt nur unwahrscheinlich zu sein.

---

## Berichtigung zu E-064 Punkt 2 (T-136-2, gemessen in T-139)

E-064 zählt für `connect-src` drei Marken auf. Die Datei trägt **vier**: `'self'`, `ipc:`,
`http://ipc.localhost` und `http://127.0.0.1:17843`. Die Entscheidung ändert sich dadurch nicht —
die Aufzählung war unvollständig, nicht die Absicht. Seit T-139 zählt niemand mehr von Hand:
`proof:shell-surface` hält die Zusage zeichengleich gegen `tauri.conf.json`, und ein eingesetzter
fünfter Eintrag macht den Nachweis rot.

---

## E-070 — Die Frist ist ein Tag, und der Tag ist derselbe wie beim Export

**Kontext.** A-19.1 bis A-19.7. Zwei Fragen sind zu beantworten, bevor jemand ein Feld anlegt:
Trägt die Frist eine Uhrzeit, und wessen Tag ist gemeint?

**Entscheidung.**

1. **Ein Tag, keine Uhrzeit.** Die drei verlangten Zustände — überfällig, heute fällig, später
   fällig — sind Tagesvergleiche. Eine Uhrzeit brächte einen vierten Zustand („in zwei Stunden
   fällig"), und der ist ohne Erinnerung sinnlos; eine Erinnerung ist nicht verlangt. Wer eine
   Uhrzeit braucht, schreibt sie in die Notiz.

2. **Der Tag ist der aus E-025.** Die Tagesgruppierung des Exports rechnet bereits in einer
   Zeitzone, und der Dienst kennt sie. Ein zweiter Tagesbegriff im selben Programm hieße, dass
   „heute fällig" und „heute gebucht" an einem Reisetag verschiedene Tage meinen. Die Frist nimmt
   denselben.

3. **Der Zustand wird gerechnet, nicht gespeichert.** Gespeichert ist der Tag; „überfällig"
   entsteht aus ihm und aus heute. Ein gespeicherter Zustand wäre über Nacht falsch, ohne dass
   jemand etwas angefasst hat.

4. **Die Frist ist keine Achse.** Sie geht nicht in Pools, nicht in Spalten, nicht in den Export
   (A-19.7, A-19.17). Wer sie später als Regelterm will, bekommt eine eigene Entscheidung —
   `pool_rule` hat seit 0011 die Form dafür.

---

## E-071 — Anhänge: was gespeichert wird und was nur gezeigt

**Kontext.** A-19.8 bis A-19.15, mit der Anhangfunktion von Super Productivity als Vorbild. Drei
Arten, und sie unterscheiden sich nicht nur im Etikett, sondern darin, **was Takt eigentlich
hält**.

**Entscheidung.**

1. **Verweis und Datei speichern eine Zeichenkette, kein Byte.** Ein Verweis ist eine Adresse,
   eine Datei ist ein Pfad. Takt kopiert nichts und verwaltet nichts davon; verschwindet die
   Datei, sagt der Anhang das (A-19.15), statt sie wiederherstellen zu wollen.

2. **Ein Bild wird kopiert.** Es liegt als Kopie im Anwendungsdatenverzeichnis, neben dem
   Bestand und unter denselben Rechten (`0700`, E-018). Grund: Ein Vorschaubild, dessen Quelle
   der Benutzer verschiebt, ist ein Anhang, der nach zwei Wochen leer ist — und ein Vorschaubild,
   das bei jedem Zeichnen eine fremde Datei liest, ist ein Lesezugriff, den niemand angefordert
   hat.

3. **Das Vorschaubild kommt als `data:`-Adresse in die Oberfläche.** Die CSP der Hülle erlaubt
   `img-src 'self' data:` — mehr nicht, und sie wird dafür **nicht** geöffnet. Die Oberfläche
   holt die Bytes über die schon erlaubte Verbindung zu `127.0.0.1:17843` und baut daraus die
   Adresse selbst. Damit bleibt die Positivliste unverändert; sie eine Zeile weiter zu machen,
   hieße sie für alles andere mitzuöffnen. Dafür gibt es eine Obergrenze für die Bildgröße, und
   sie steht an einer Stelle.

4. **Anhänge gehen in keinen Export** (A-19.17). Dieselbe Grenze wie die Todo-Notiz, aus
   demselben Grund, und mit demselben Prüfanspruch: nicht nur die Standardvorlage, sondern
   beliebige Vorlagen.

---

## E-072 — Einen Anhang öffnet der Benutzer, und die Hülle prüft, was sie öffnet

**Kontext.** A-19.9, A-19.18, A-19.19. Ein Verweis öffnet den Browser, eine Datei die
Standardanwendung des Systems. Das ist genau der Weg, den T-136 vermessen hat:
`tauri-plugin-shell` prüft auf dem Rust-Weg **nichts**, und in `capabilities/**` steht deshalb
seit E-067 keine Shell-Berechtigung. Was hier dazukommt, ist schwerer als die Versionsprüfung:
Dort war die Zeichenkette eine Fassungsbezeichnung aus einer bekannten Quelle. Hier ist sie eine
Adresse oder ein Pfad, und beide kommen aus dem Bestand.

**Entscheidung.**

1. **Der Bestand ist keine vertrauenswürdige Quelle, wenn von außen hineingeschrieben werden
   kann.** Deshalb: **Über das Add-in entstehen keine Anhänge** (A-19.19). Ein Anhang, den eine
   E-Mail anlegt, wäre ein von außen geschriebener Öffnen-Befehl auf den Rechner des Benutzers.
   Die Add-in-Türen nehmen das Feld nicht entgegen — nicht per Voreinstellung, sondern
   strukturell, wie die Todo-Notiz im Exportmotor (R-06).

2. **Der Öffnen-Befehl der Hülle prüft bei jedem Aufruf neu, nach Art getrennt.** Eine Prüfung
   beim Eingeben allein trägt nicht: Zwischen Eingabe und Öffnen liegen der Bestand, eine
   Migration und jeder künftige zweite Schreibpfad.
   * **Verweis:** ausschließlich `http` und `https`. Kein `file:`, kein `javascript:`, kein
     `data:`, kein sonstiges Schema — und kein UNC-Pfad. Ein `\\server\freigabe` in einem
     Verweis ist unter Windows ein Anmeldeversuch gegen einen fremden Rechner, kein Öffnen.
   * **Datei:** ein absoluter Pfad, der existiert, und kein UNC-Pfad.
   * **Bild:** öffnet nichts nach draußen. Es wird angezeigt, und das ist der ganze Umfang.

3. **Vor dem Öffnen einer Datei fragt die Oberfläche, und die Frage nennt den vollen Pfad.**
   Eine Datei mit der Standardanwendung zu öffnen ist dasselbe wie ein Doppelklick im
   Dateimanager — bei einer `.bat`, einer `.lnk` oder einer `.exe` ist es eine Ausführung. Der
   Benutzer soll sehen, was er startet, bevor es startet. Bei einem Verweis genügt die
   Handlung selbst; ein Browser ist der erwartete Ausgang.

4. **Nichts öffnet sich von selbst** (A-19.18). Kein Vorabholen, keine Vorschau, die im
   Hintergrund etwas startet, keine Nebenwirkung beim Laden einer Liste.

5. **Gemessen, nicht zugesagt.** `proof:shell-surface` misst heute einen Aufrufort für `open`.
   Kommen die Anhänge dazu, wächst die Zahl — und der Nachweis muss dann sagen, **welche** und
   dass jeder durch eine Prüfung geht. Ein Nachweis, der nur zählt, hätte diese Aufgabe nicht
   überstanden.

**Konsequenz.** Das Bedrohungsmodell bewertet diese Grenze, bevor gebaut wird — so wie bei der
Versionsprüfung, wo genau dieses Vorgehen den Befund T-136-1 zutage gefördert hat.

---

## E-073 — Nachträge zu E-065, E-070 und E-071 (aus T-144)

**Kontext.** T-144 hat drei Sätze gefunden, an denen sich der nächste Agent orientiert und die
nicht stimmen oder nicht genau genug sind. Zwei davon sind Fragen, die vor dem Bau von
Abschnitt 19 beantwortet sein müssen.

**Entscheidungen.**

1. **Berichtigung zu E-065 (T-144 U-06, offen seit T-136-3).** E-065 nennt `tauri.conf.json` die
   führende Quelle der Fassung. Im **Auslieferungsbau** stimmt das nicht: Dort kommt sie aus
   `TAKT_RELEASE_VERSION`, das `build-app.mjs` als zweite Datei über die Konfiguration legt
   (`release.yml` füllt sie aus dem Etikett); die Datei im Repository trägt weiter `0.0.0`. Das
   ist **so gebaut und richtig** — `tauri.conf.json` ist JSON5 mit Kommentaren, und ein Werkzeug,
   das sie neu schreibt, wirft die Begründung zu E-043 weg. Die Entscheidung ändert sich nicht;
   der Satz war falsch. Richtig ist: **Die führende Quelle einer Veröffentlichung ist das
   Etikett**, `tauri.conf.json` ist der Rückfallwert für jeden Bau ohne Etikett. `CLAUDE.md`
   sagt das jetzt so.

2. **Wann „heute fällig" neu gerechnet wird (E-070 Punkt 3 sagte *dass*, nicht *wann*).** Der
   Zustand wird bei jedem Zeichnen aus dem gespeicherten Tag und dem heutigen gerechnet. Damit
   eine Anwendung, die über Nacht offen bleibt, nicht bis zum nächsten Klick falsch anzeigt,
   wird zusätzlich neu gezeichnet: bei `visibilitychange` und über einen Zeitgeber auf die
   nächste Mitternacht der maßgeblichen Zeitzone. Das ist dieselbe Bauart wie `useDataFreshness`
   aus T-097 und kein neuer Mechanismus. Ein Zeitgeber auf „alle 60 Sekunden" wäre die
   naheliegende Antwort und die schlechtere: Er rechnet 1439 Mal umsonst und trifft die
   Grenze trotzdem nur zufällig genau.

3. **Wo die Obergrenze für die Bildgröße steht (E-071 Punkt 3).** In `packages/domain`, bei den
   übrigen Grenzwerten aus T-128 — dieselbe Klasse, dieselbe Behandlung. Die Tür prüft sie, und
   der Nachweis fragt nach der **Herkunft** und nicht nach der Zahl (der Anspruch aus T-134).
   Wert: **5 MiB** je Bild. Begründung, damit sie später jemand ändern kann statt sie zu raten:
   Das Bild wird als `data:`-Adresse in die Oberfläche gereicht und dort um rund ein Drittel
   größer; fünf Anhänge an einem Todo sind dann etwa 33 MiB im Webview, und das ist die Grenze
   dessen, was ein Vorschaubild wert ist.

4. **Nicht entschieden, sondern gefragt.** Ob nach der Frist **sortiert und gefiltert** werden
   darf und ob das **Add-in** eine Frist setzen darf, steht in keiner Anforderungs-ID.
   Abschnitt 19 verlangt Sichtbarkeit (A-19.4), nicht Sortierung. Beides geht als **F-20** an den
   Auftraggeber. Ohne ID wird nichts gebaut — dieselbe Regel wie bei E-068, und sie gilt auch,
   wenn die Erweiterung klein und plausibel wäre.

---

## E-074 — Sortieren und Filtern nach der Frist, und das Add-in setzt sie

**Kontext.** Antwort des Auftraggebers auf F-20 am 2026-09-05: „Ja, es soll sortiert und gefiltert
werden können und das addin soll diese werte auch setzten können." Aufgenommen als A-19.20 und
A-19.21.

**Entscheidung.**

1. **Sortieren und Filtern sind Anzeige, keine Achse.** E-070 Punkt 4 bleibt unverändert: Die
   Frist geht **nicht** in Pools, nicht in Spalten, nicht in den Export. Sie ordnet und filtert
   die Todo-Liste, und das ist etwas anderes als ein Regelterm. Wer sie später als Pool-Achse
   will, bekommt eine eigene Entscheidung; `pool_rule` hat seit 0011 die Form dafür.

2. **Ein Todo ohne Frist ist beim Sortieren nicht „ganz oben".** Es hat keinen Wert, keinen
   frühesten und keinen spätesten. Es steht am Ende, in beiden Richtungen, und die Oberfläche
   sagt das nicht mit einem Platzhalterdatum. Ein leeres Feld als „01.01.1970" zu sortieren ist
   die Sorte Bequemlichkeit, die niemandem auffällt, bis sie in einer Abrechnung steht.

3. **Das Add-in setzt die Frist — und nur sie.** A-19.21 nennt die Frist. **A-19.19 bleibt
   unangetastet: über das Add-in entstehen weiterhin keine Anhänge.** Der Unterschied ist nicht
   Vorsicht, sondern Art: Eine Frist ist ein Tag, den die Anwendung anzeigt. Ein Anhang ist eine
   Adresse oder ein Pfad, den die Anwendung auf Klick **öffnet** — aus einer E-Mail geschrieben
   wäre er ein von außen gesetzter Öffnen-Befehl auf den Rechner des Benutzers (R-21, R-22).
   Sollte auch das gewollt sein, ist es eine eigene Frage mit einer eigenen Antwort, und das
   Bedrohungsmodell bewertet sie neu.

4. **Die Frist aus dem Add-in ist Eingabe von außen** und wird an ihrer Tür geprüft wie jedes
   andere Feld dort: ein Tag in fester Form, kein freier Text, keine Uhrzeit, keine Rechnung aus
   einer E-Mail. Der Wert kommt aus einem Feld, das der Benutzer im Aufgabenbereich ausfüllt,
   nicht aus einem erkannten Muster im Text.

---

## E-075 — Vier Nachträge nach Welle T

1. **Die Bildgrenze ist 8 MiB, nicht 5 MiB (berichtigt E-073 Punkt 3).** E-073 hat die Zahl
   gesetzt, bevor T-145 sie vermessen hatte; A-A-15 im Bedrohungsmodell nennt 8 388 608 Bytes,
   und T-146 hat so gebaut. Die spätere, gemessene Zahl gilt. Der Ort bleibt `packages/domain`,
   und der Nachweis fragt weiterhin nach der **Herkunft** und nicht nach der Zahl.

2. **Die Suche trifft den Vermerk — sie tut es nur noch nicht (O-BK, O-BY).** Gemessen von
   T-147: `repo-todos.ts` sucht in `title` und `call_number`, der Vermerk ist nicht dabei; der
   Text in der Suchfläche sagt damit heute die Wahrheit, und E-038, `glossar.md` und das
   Benutzerhandbuch versprechen etwas, das es nicht gibt. **E-038 bleibt gültig**, weil die
   versprochene Sache die richtige ist: Ein Vermerk, den der eigene Rechner nicht durchsuchen
   kann, ist eine Notiz, die man zweimal schreibt. Gebaut wird also die Suche, nicht die
   Streichung — **mit einer Bedingung:** T-116 hat den Befund C-22 mit genau der Begründung
   geschlossen, dass die Suche den Vermerk trifft. Mit dem Bau lebt er wieder auf, und
   spec-ux-reviewer legt ihn zusammen mit der Umsetzung erneut vor. Ohne diese Wiedervorlage
   wird nicht gebaut.

3. **`apps/desktop` darf `@takt/domain` einbinden (O-BZ, altes O-AO).** `build-app.mjs` führt
   heute eine **dritte** Fassung der Formprüfung für die Fassungsbezeichnung, und der Gleichlauf
   ist gemessen statt aufgelöst — dieselbe Klasse, die T-128, T-131 und T-134 in drei Wellen
   aufgeräumt haben. Eine Arbeitsbereichsabhängigkeit auf ein Paket, das ohnehin ausgeliefert
   wird, ist der billigere Preis. `package.json` und die Sperrdatei ändert der Orchestrator.

4. **`release.yml` misst die Größe von `releases/latest` nicht (T-146 Frage 3).** T-146 hat die
   Grenze von rund 38 auf rund 153 Anhänge angehoben und den `too_large`-Satz die **Folge**
   nennen lassen. Ein Meßschritt im Auslieferungsablauf beantwortete die Frage „reicht die
   Grenze noch?" einmal je Veröffentlichung — und die Antwort läge in einem Ablaufprotokoll,
   das niemand liest. Wird die Grenze eines Tages knapp, sagt es die Protokollzeile des Dienstes
   an dem Rechner, an dem es zählt.


---

## E-076 — Ark UI weiter, aber in Stufen, und der Vertrag der Oberfläche bleibt

**Kontext.** Der Auftraggeber will die Oberfläche „konsequent auf Ark UI ausrichten bzw. Ark UI
dort einsetzen, wo es sinnvoll ist", ausdrücklich **ohne** Neubau und ohne Verlust des
bestehenden Designs. Zu prüfen war zuerst der Stand.

**Befund (Orchestrator, gemessen am Bestand).**

1. **Ark UI ist seit T-059 im Baum** (`@ark-ui/react ^5.39.0` in `apps/web/package.json`,
   entschieden in E-052) und trägt heute genau drei Bausteine: `Select.tsx` (Auswahlfeld),
   `TagInput.tsx` (Kombobox), `Menu.tsx` (Kontextmenü). Es ist also **keine Einführung**,
   sondern eine Erweiterung eines vorhandenen Musters. Kein neues Paket, keine neue Fassung,
   keine Änderung an `package.json` oder an den Lieferkettenschaltern.
2. **Die eigene Abstraktionsschicht existiert:** `apps/web/src/components/` (Primitives, Icon,
   Foreign, Tag, …) über `@takt/ui-tokens` als einziger Farb- und Maßquelle, dazu die Musterseite
   unter `src/showcase/`. Die Schichtung, die der Auftrag verlangt, ist da; sie hat nur an einer
   Stelle keinen Unterbau.
3. **Diese Stelle sind die Dialoge.** `FormDialog`, `ConfirmDialog`, `InfoDialog`,
   `UpdateDialog`, `AttachmentOpenDialog` und die Sperrfläche in `ShellStatus` führen `role`,
   `aria-modal`, Fokuseinsprung, Fokusrückgabe, Tabulatorschleife (`lib/focus.ts`) und
   Escape-Behandlung **von Hand**. Zwei Notbehelfe darin sind bereits als Befund vermerkt:
   die Abfrage auf `event.defaultPrevented`, weil eine Ark-Liste im Portal ihr Escape sonst
   zweimal wirken lässt, und `recoverFocus`, weil ein verschwindender Knopf den Fokus auf
   `body` fallen lässt (T-072). Beides sind Fälle, die eine Dialog-Zustandsmaschine kennt.

**Entscheidung.**

1. **Der Umfang aus E-052 wird erweitert, nicht ersetzt** — und in **Stufen**, nicht in einem
   Zug. Reihenfolge nach Verhaltensdichte, nicht nach Dateizahl:
   **Stufe 1 (jetzt): Dialog.** Stufe 2: Kontrollkästchen, Auswahlgruppe, Schalter.
   Stufe 3: **Datumsauswahl** für die Frist. Stufe 4: Meldungen (Toast). Stufe 5: Baumansicht
   der Tag-Ordner. Jede Stufe ist eine eigene Aufgabe mit eigener Freigabe; keine Stufe beginnt,
   bevor die vorige durch Sichtprüfung und Spezifikationsabgleich ist.
2. **Was nicht auf Ark UI wandert, und warum.** Layout, Text, Karten, Etiketten, Exportgruppen,
   die Kanban-Karte, die Statusanzeige und die Zeitleiste tragen fachliche Bedeutung und haben
   in einer allgemeinen Bibliothek kein Gegenstück — E-052 Absatz „Umfang" gilt wörtlich weiter.
   Es gibt in Takt **keine** Reiter und **keine** Aufklappabschnitte; für diese beiden
   Ark-Bausteine wird keine Fläche erfunden. Die **Sperrfläche der Hülle** (`ShellStatus`,
   `.scrim--blocking`) bleibt vorerst von Hand: Sie ist der einzige Ausgang aus einem Zustand,
   in dem die Anwendung nicht bedienbar ist (T-133, O-AF), und ein Dialog, der sich schließen
   lässt, wäre dort ein Fehler und keine Verbesserung.
3. **Der Vertrag der Oberfläche bleibt zeichengleich.** Rolle, zugänglicher Name, Klassennamen
   und Datenmerkmale jeder migrierten Fläche bleiben, wie sie sind. Der Grund ist gemessen:
   **315** Zugriffe in `tests/e2e` gehen über `getByRole` (T-152 zählte 222, T-163 am 2026-09-05
   dann 286, T-203 am 2026-09-06 315 — die Zahl wächst mit jeder Prüfwelle und ist ein **Stand**,
   kein Nachweis, E-087 Punkt 2), `contrast-check.mjs` prüft heute 242 Paare in 484 Messungen
   gegen die Klassen, und `proof-foreign.mjs` liest das JSX. Eine Migration, die diese drei
   Ketten rot macht, hat nichts bewiesen. **Ark UI liefert Verhalten; das Aussehen und die
   Ansprache bleiben aus diesem Bestand** — dieselbe Bedingung wie in E-052, jetzt als
   Abnahmekriterium.
4. **Keine Fachlogik wandert mit.** Kein Griff an Dienst, Domäne, Datenmodell oder OpenAPI. Wo
   ein Baustein heute eine fachliche Frage stellt (die Rückfrage vor dem Öffnen einer Datei,
   die Bestätigung mit Kontrollkästchen vor dem Zurücksetzen eines Exportstatus), bleibt die
   Frage wörtlich und die Bedingung unverändert.
5. **`lib/focus.ts` bleibt, solange es einen Träger hat.** Die Sperrfläche der Hülle benutzt es
   weiter. Gestrichen wird es erst, wenn es keinen Aufrufer mehr hat — nicht vorher, und keine
   Kopie „für alle Fälle".

**Nachtrag zu E-076 (nach T-152, Stufe 1).**

6. **Die Dialoge laufen mit `modal={false}`, ausdrücklichem `trapFocus`, `closeOnInteractOutside={false}` und `aria-modal="true"` von Hand.** Das sieht nach einem Widerspruch aus und ist keiner. `modal` schaltet in der Zustandsmaschine von Ark UI zusätzlich `hideContentBelow`, und das setzt beim Öffnen **einmalig** `aria-hidden="true"` auf alles neben dem Dialog. Zwei Folgen, beide von T-152 gemessen: Erstens verschwände die aufgeklappte Liste **jedes Auswahlfelds im Dialog** aus dem Zugänglichkeitsbaum — sie hängt im Portal am Dokumentkörper, ist im Augenblick des Öffnens zu, und die Ausnahmeregel dafür verlangt `aria-expanded="true"`. Das ist ein Fehler in der Sache und kein Testproblem. Zweitens verlöre jede Fläche hinter dem Dialog ihre Rolle, was Punkt 3 dieser Entscheidung untersagt.

   `aria-modal="true"` am Dialog ist ohnehin der Weg, den Vorlesehilfen heute lesen; `aria-hidden` auf den Geschwistern ist der ältere Rückfall. Wer diese Zeile später „aufräumen" will, ändert damit zwei Dinge auf einmal — er soll den gemessenen Fall aus T-152 vorher nachstellen.

7. **Was Stufe 1 hinterlässt und Stufe 2 aufräumt.** `stopClosingKeys` in `Select.tsx` und `Menu.tsx` ist ohne die Notbehelfe wirkungslos geworden; `hideContentBelow` bliebe nur zusammen mit `lazyMount` und `unmountOnExit` an `Select`, `TagInput` und `Menu` erreichbar und kollidiert dann mit TAGINPUT-05. Beides wird **nicht** nebenbei gemacht, sondern in Stufe 2, zusammen mit `AttachmentOpenDialog`.

---

## E-077 — Die Vorgabe der Fassung im Hüllen-Ersatz kehrt sich um

**Kontext.** T-150 hat beim Bau der End-to-End-Fälle zu Abschnitt 19 einen Fund gemacht, der
älter ist als die Aufgabe: Seit T-146/T-147 fragt der lokale Dienst die Versionsprüfung **real**
gegen den echten Bestand — und seit der Auslieferung gibt es dort tatsächlich `v0.1.0`. Jede
Prüfdatei, die `installShellShim` **ohne** `installedVersion` benutzt, bekommt deshalb den
Vorgabewert `0.0.0`, also eine Fassung unterhalb jeder veröffentlichten. Nach der ersten
Abfrage steht ein **modaler** Aktualisierungsdialog vor der Oberfläche und blockiert alles
dahinter. Ob er es tut, hängt an der seit Dienststart verstrichenen Zeit; betroffen waren auch
zwei bestehende Dateien (`shell-quit-failure.spec.ts`, `shell-username-lock.spec.ts`), die
zufällig nicht angeschlagen haben.

**Entscheidung.**

1. **Die Vorgabe kehrt sich um.** `installShellShim` liefert künftig von sich aus eine Fassung,
   die **keinen** Dialog auslöst. Wer den Aktualisierungsdialog messen will, sagt es
   ausdrücklich. Die heutige Polung verlangt von jeder neuen Prüfdatei, an einen Nebeneffekt zu
   denken, der mit ihrem Gegenstand nichts zu tun hat — und eine Vorsichtsmaßnahme, an die man
   denken muss, ist eine, die irgendwann vergessen wird. Das ist dieselbe Klasse wie O-BS und
   O-BT, nur an der anderen Seite: dort ein Nachweis, den niemand startet, hier eine Falle, die
   niemand sieht.
2. **Die Zeile pro Datei ist die Behebung, nicht die Lösung.** T-150 hat sie an den betroffenen
   Stellen gesetzt, damit die Reihe grün steht. Die Umkehr der Vorgabe gehört in **Welle V** zu
   e2e-tester, mitsamt einer Gegenprobe: eine Datei **ohne** Angabe darf keinen Dialog bekommen,
   eine Datei **mit** ausdrücklicher Angabe muss ihn bekommen.
3. **Die größere Frage bleibt offen und bekommt einen Punkt.** Dass eine Prüfreihe überhaupt
   nach draußen greift, ist dieselbe Überschreitung, die T-145 an `proof:access` gefunden hat
   (O-BU): Der Lauf, der eine Vertrauensgrenze misst, überschreitet sie selbst. T-142 hat mit
   `tests/e2e/support/version-check-entry.ts` bereits eine Naht dafür gebaut. Ob die Hauptreihe
   sie ebenfalls benutzt, ist eine eigene Aufgabe und keine Beigabe zu dieser Entscheidung.
4. **Die neue Ausführungskonfiguration hängt ab sofort in der Kette** (Orchestrator, sofort
   erledigt). `playwright.attachment-persistence.config.ts` misst einen echten Prozeßneustart
   des Dienstes und lief nur von Hand. `pnpm test:e2e` ruft jetzt alle drei Reihen
   hintereinander. Dritter Fall dieser Klasse nach O-BS und O-BT.

---

## E-078 — Weniger Text. Jeder Satz in der Oberfläche muss sich rechtfertigen

**Kontext.** Vorgabe des Auftraggebers vom 2026-09-05: Text im gesamten Produkt bewusst kurz und
prägnant. Keine langen Erklärungen, keine Textwände, keine doppelte Information, keine
überflüssigen Überschriften, keine unnötigen Hinweisfelder, keine langen Schaltflächentexte.
Bevorzugt: kurze Beschriftungen, klare Schaltflächen, prägnante Hinweise, eindeutige Sinnbilder,
und zusätzliche Auskunft **erst dann, wenn sie gebraucht wird**. Das Ergebnis soll modern, ruhig,
übersichtlich und hochwertig wirken.

**Warum das hier eine Entscheidung braucht und keine Stilnotiz ist.** Takt hat sich seine Länge
verdient: Fast jeder lange Satz in der Oberfläche steht dort, weil ein Prüfer ihn verlangt hat.
Die Rückfrage vor dem Öffnen einer Datei nennt den vollen Pfad, weil ein kurzer Satz dort einen
Programmstart verschleiern würde (R-21). Der Hinweis am Fristfeld des Aufgabenbereichs ist lang,
weil er eine **Abwesenheit** ausspricht, die man sonst nicht sieht (E-074 Punkt 4, V-03). Wer
diese Sätze nach Zeichenzahl kürzt, kürzt genau die Stellen weg, die dieses Vorhaben teuer
gelernt hat.

**Entscheidung.**

1. **Die Regel gilt, und sie gilt zuerst für die Menge, nicht für den einzelnen Satz.** Gestrichen
   wird, was **doppelt** dasteht, was **erklärt, was man sieht**, und was **auf Vorrat** erklärt.
   Nicht gestrichen wird, was eine **Folge** benennt, eine **Abwesenheit** ausspricht oder eine
   **Absage** begründet. Ein Satz, der den Benutzer vor einer nicht umkehrbaren Handlung warnt,
   ist kein Fülltext, auch wenn er lang ist.
2. **Progressive Enthüllung ist der bevorzugte Weg zur Kürze**, nicht die Streichung. Wo eine
   Auskunft heute dauerhaft dasteht und nur in einem Zustand zählt, gehört sie in diesen Zustand
   — nicht in den Papierkorb. Das ist die Bauart, die T-158 im Aufgabenbereich schon benutzt
   (Hinweis bleibt, Meldung tritt daneben).
3. **Kein Satz fällt, den ein Prüfer verlangt hat, ohne dass derselbe Prüfer zustimmt.** Die
   Sätze aus B-5, V-03, R-21, R-22, E-063 und A-19.x tragen Anforderungs-IDs oder Befundnummern.
   Wer sie kürzen will, legt die neue Fassung dem Prüfer vor, der sie verlangt hat. Alles andere
   ist eine stille Rücknahme einer Freigabe.
4. **Die Reihenfolge ist die aus dem Ablauf:** ux-designer schreibt die Bestandsaufnahme und die
   Regel je Textsorte, ui-designer sagt, was das für Hierarchie, Dichte und Sinnbilder bedeutet,
   erst dann ändert frontend-dev Text. Ein Textdurchgang, den ein Programmierer nebenbei macht,
   ist ein Durchgang ohne Gegenüber.
5. **Deutsch bleibt Deutsch** (Sprachregel unverändert), und **Sinnbilder ersetzen Text nur, wenn
   sie ohne Beschriftung eindeutig sind**. Ein Sinnbild mit Erklärungstext daneben ist keine
   Kürzung, sondern eine Verdopplung; ein Sinnbild ohne zugänglichen Namen ist ein Verstoß gegen
   SC 4.1.2 und keine Gestaltung.

**Nachtrag vom 2026-09-05, nach der Bestandsaufnahme T-163** (`docs/design/textbestand.md`).

6. **Progressive Enthüllung hat drei Träger, und einen vierten gibt es nicht ohne Entscheidung.**
   Punkt 2 nennt die Enthüllung als bevorzugten Weg, E-076 verbietet zugleich, Aufklappabschnitte
   zu erfinden, die es in Takt nie gab. Beides gilt weiter. Erlaubt sind deshalb genau die
   Träger, die schon stehen: **Zustandsbindung** (die Auskunft erscheint in dem Zustand, in dem
   sie zählt), **Handlungsbindung** (sie erscheint an der Handlung, die sie betrifft) und das
   **Handbuch** (sie verlässt die Oberfläche ganz). Ein vierter Träger — Aufklappabschnitt,
   Sprechblase, Zweitfläche — ist eine eigene Entscheidung mit ux-designer und ui-designer, nicht
   die Wahl des Umsetzenden. Wer keinen der drei Träger findet, streicht nicht: er meldet.
7. **E-078 gilt auch für den Aufgabenbereich des Add-ins.** Die Regel ist eine Produktregel, keine
   Regel einer Fläche; dass die Bestandsaufnahme T-163 nur `apps/web` umfaßt, ist eine Frage der
   Hoheit und nicht des Geltungsbereichs. Für den Aufgabenbereich führt integration-dev die
   eigene Aufnahme, und der Fristhinweis bekommt **eine** Fassung für beide Flächen — der
   Zeitpunkt dafür ist die Wiedervorlage V-03/V-04 in T-165, nicht ein späterer Durchgang.
8. **Was eine Vorlesehilfe hört, muß ein Sehender sehen können, und umgekehrt.** Die Enthüllung
   nach Punkt 2 darf Blick und Gehör nicht auseinanderlaufen lassen: ein Hinweis, der aus dem
   Blickfeld verschwindet, aber in `aria-describedby` stehen bleibt, ist derselbe Fehler, den
   R-2a schon einmal abgelehnt hat, nur in die andere Richtung. Die Symmetrie ist bei jedem
   Eintrag der Umbauliste zu **messen**, nicht zuzusichern.

## E-079 — Die Lieferkette wird gemessen, wo sie messbar ist, und der Rest bekommt eine Größe

**Anlaß.** O-CW: Zehn Wellen lang hat der security-checker vermerkt, daß die Lieferkette nicht
gemessen werden konnte — Guardian ohne Werkzeug (zehnter Anlauf), 42Crunch ohne Werkzeug
(neunter), `cargo audit` nicht installiert (T-B07). Ein Vermerk, der zehnmal gleich lautet, ist
keine Feststellung mehr, sondern eine Gewohnheit. Der Orchestrator entscheidet ihn deshalb.

**Was am 2026-09-05 tatsächlich gemessen wurde**, mit den Werkzeugen, die hier stehen:

- `pnpm audit`: **0 Meldungen** über **271** Abhängigkeiten (97 Laufzeit, 174 Bauzeit, 65
  wahlweise). Erste Messung der Lieferkette in diesem Vorhaben überhaupt.
- Lebenszyklus-Skripte: **eine** Freigabe (`esbuild`, begründet in `pnpm-workspace.yaml`),
  `strictDepBuilds` bricht bei jeder weiteren ab.
- Herkunft: `blockExoticSubdeps` schließt Git-, URL- und Dateiquellen aus; `minimumReleaseAge`
  hält sieben Tage Abstand zu frischen Veröffentlichungen; `trustPolicy: no-downgrade`
  verhindert das stille Herabsetzen dieser Schalter. Zwei begründete Ausnahmen, beide ohne
  Laufzeitanteil und ohne Lebenszyklus-Skript.
- Rust: **498** Kisten in `apps/desktop/src-tauri/Cargo.lock`, davon **null** je auf Warnungen
  geprüft.

**Entscheidung.**

1. **`pnpm audit` gehört ab sofort ins Tor**, nicht in einen Bericht. Es ist der einzige
   Lieferkettennachweis, der hier ohne fremdes Werkzeug läuft, und er lief bisher nie. Eine
   Meldung ist ein Befund für den security-checker, kein Grund, den Lauf zu übergehen. Eingehängt
   als `pnpm run audit` am **Ende** von `pnpm check`, hinter dem Bau: Der Schritt braucht als
   einziger im Tor eine Verbindung zur Registry, und ohne Netz **fällt er laut aus**, statt still
   zu überspringen. Ein Tor, das ohne Netz grün wird, obwohl es die Lieferkette nicht gesehen
   hat, wäre genau der Fehler, den O-BU und O-CI an anderer Stelle beschreiben.
2. **Der Rust-Anteil wird dort gemessen, wo Werkzeug und Netz stehen: im Bauauftrag.**
   `cargo audit` gehört auf einen Läufer mit Werkzeug und Netz, nicht auf diesen Rechner. T-B07
   bleibt für den lokalen Lauf blockiert, aber die Blockade hat jetzt eine Größe (498 Kisten) und
   einen Weg. **Umgesetzt am selben Tag** als eigener Auftrag `.github/workflows/pruefung.yml`,
   nicht in `release.yml`: Eine Lieferkettenmessung, die erst beim Bau einer Veröffentlichung
   läuft, meldet den untergeschobenen Baustein zu dem Zeitpunkt, zu dem er schon im Erzeugnis
   ist. Derselbe Auftrag fährt die Rust-Prüffälle auf **Windows** bei jedem Anstoß — die zweite
   Hälfte von A-A-32 (T-164).
3. **Guardian und 42Crunch werden nicht mehr je Welle erneut versucht.** Beide brauchen eine
   Zugangsberechtigung, die es hier nicht gibt; ein elfter Fehlversuch erzeugt keinen Erkenntnis-
   gewinn. Sie bleiben als T-B06 in der Liste der blockierten Aufgaben stehen — dort, wo das
   Fehlen sichtbar ist, statt in jedem Bericht neu.
4. **Was gemessen wurde, steht im Bedrohungsmodell**, mit Datum und Zahl. Die Lieferkette ist
   damit nicht sicher, sondern zum ersten Mal **beziffert** — der Unterschied gehört
   aufgeschrieben, weil sonst die erste grüne Zahl als Freispruch gelesen wird.

## E-080 — Takt siezt

**Anlaß.** T-165 (X-01): `apps/web` siezt an über zwanzig Stellen, das Add-in duzt an sechs, und
in der Hauptanwendung duzt genau eine Zeile (`apps/web/src/components/NoteField.tsx:59`). Weder
`CLAUDE.md` noch `docs/spec.md` haben die Anrede je geregelt — das ist eine fehlende Entscheidung
und kein Verstoß, und deshalb entscheidet sie der Orchestrator statt sie zu melden.

**Entscheidung.**

1. **Takt siezt, überall.** Hauptanwendung, Aufgabenbereich des Add-ins, Fehlermeldungen der
   Hülle, Handbuch. Die Mehrheit steht schon so, und der Preis der Gegenrichtung wären über
   zwanzig Änderungen an Sätzen, die Prüfer freigegeben haben.
2. **Sieben Stellen ziehen nach**: `NoteField.tsx:59` (frontend-dev) und sechs im Add-in
   (integration-dev): `DuplicateOffer.tsx:78`, `callnumber/labels.ts:33`, `SettingsView.tsx:207`,
   `TaskPane.tsx:288`, `:515`, `:864`, `:1081` — `labels.ts:33` und `TaskPane.tsx:1081` sind
   derselbe Satz an zwei Stellen und damit zugleich ein Fall für E-078.
3. **Der Fristsatz aus T-158 wird dabei mitgezogen**, nicht neu verhandelt: V-04 ist von T-165
   freigegeben, die Anrede ist die einzige Änderung. Wer ihn dabei kürzt, braucht die Zustimmung
   aus T-165 — E-078 Punkt 3.
4. **Die beste Anrede ist keine.** Wo ein Satz ohne Anrede auskommt, ist das die kürzere und die
   ruhigere Fassung, und E-078 zieht sie vor: „Keine Call-Nummer im Text gefunden — sie lässt sich
   eintragen." braucht weder „du" noch „Sie".

## E-081 — Die Ungleichheit an `RadioRow` ist Absicht, und sie überlebt E-078

**Anlaß.** T-171 (B-1, B-2): E-078 Nachtrag Punkt 8 verlangt, daß Blick und Gehör nicht
auseinanderlaufen. `apps/web/src/components/RadioRow.tsx` tut aber genau das, und zwar seit S-6
aus R-2 mit Absicht: Die Erläuterung **jeder** Option liegt dauerhaft als `visually-hidden` im
Baum und hängt über `aria-describedby` an ihrem eigenen Bedienelement (`:114`, `:139-141`);
**sichtbar** steht nur die Erläuterung der **gewählten** Option, und die ist `aria-hidden`
(`:145-152`), damit sie nicht ein zweites Mal angesagt wird. Nachgemessen am 2026-09-05.

**Entscheidung.**

1. **Das bleibt so.** Wer die Auswahl mit der Tastatur durchgeht, hört zu **jeder** Option, was sie
   bedeutet, **bevor** er sie wählt — sehend liest man dieselbe Auskunft erst nach der Wahl. Das
   ist keine Benachteiligung, sondern der Ausgleich dafür, daß ein Durchgang mit Vorlesehilfe
   linear ist und kein Auge über die Fläche springen kann.
2. **Nachtrag 8 zu E-078 gilt gegen Verluste, nicht gegen Zugaben.** Verboten ist, daß eine
   Auskunft **verschwindet** und nur noch in `aria-describedby` weiterlebt. Erlaubt bleibt, daß
   das Gehör mehr bekommt als der Blick, wenn die Bauart es begründet.
3. **UM-02 fällt aus der Umbauliste** (`docs/design/textbestand.md`): Der Umbau ist bereits
   gebaut. Ihn im Wortsinn auszuführen änderte sichtbar nichts und nähme S-6 still zurück. An der
   Stelle bleibt ST-03. Sinngemäß dasselbe gilt für `POOL_MATCH_MODE_HINT` und
   `Attachments.tsx:420-422`.
4. **Streichung und Ausgleich gehören in einen Auftrag.** T-171 hat für ST-05 gezeigt, wie eng
   das hängt: Fällt die Kompensation an der Regelzeile weg, ist der Satz gestrichen **ohne**
   Ersatz. Kein Textdurchgang wird in zwei Wellen zerlegt, deren erste nur streicht.

## E-082 — Der Wächter über die Fläche der Hülle mißt das Erzeugnis, nicht die Prüffälle

**Anlaß.** `pnpm run proof:shell-surface` ist rot, und zwar seit T-160 und unabhängig von jeder
Änderung aus Welle Y (T-167 hat den Stand davor wiederhergestellt und beides gemessen). Grund:
Der Wächter liest `apps/desktop/src-tauri/src/**` als **eine** Zeichenkette und findet in den
`#[cfg(test)]`-Fällen aus T-160 die Beispieladressen `https://example.org/…` — genau die Fälle,
die T-154 als V-01 blockierend verlangt hat. Zwei Auflagen des Vorhabens stehen damit
gegeneinander: *keine zweite Adresse im Rust-Anteil* und *die letzte Kontrolle vor `open` ist
gemessen*.

**Entscheidung.**

1. **Der Wächter schließt `#[cfg(test)]`-Blöcke aus.** Das ist keine Lockerung, sondern die
   Berichtigung eines Meßfehlers: Was in einem `#[cfg(test)]`-Block steht, wird in das
   ausgelieferte Erzeugnis nicht übersetzt. Der Wächter behauptet etwas über das Erzeugnis; also
   muß er lesen, was das Erzeugnis ist.
2. **Der Ausschluß ist blockgenau und wird gegengeprobt.** Zwei Gegenproben, beide verlangt:
   eine Adresse im **Produktivteil** derselben Datei muß den Lauf weiterhin rot machen, und der
   Ausschluß darf nicht am ersten `}` enden, sondern muß den Block wirklich zählen. Ein
   Ausschluß ohne Gegenprobe wäre genau der blinde Wächter, den dieser Lauf selbst als Befund
   führt.
3. **Die Prüffälle bleiben, wie sie sind.** Sie auf `.invalid` umzuschreiben verlegte den Fehler
   nur: Der Wächter sähe dann eine andere fremde Adresse, und die Fälle verlören die Form, gegen
   die sie prüfen. Ein Prüffall richtet sich nach dem, was er messen soll, nicht nach dem
   Wächter, der zufällig dieselbe Datei liest.
4. **security-checker sieht es nach**, bevor die Welle abgenommen wird — es ist eine Änderung an
   einer Sicherheitsschranke, auch wenn sie eine Meßgrenze berichtigt.

## E-083 — Der feste Port ist eine Regel der Wellenplanung, bis er es nicht mehr sein muß

**Anlaß.** T-168 und T-169 konnten fünf beziehungsweise einen Nachweispfad nicht fahren:
`proof:conflicts`, `proof:tags`, `proof:access`, `proof:export-api` und `proof:addin-wiring`
brauchen `127.0.0.1:17843` — und dort lauschte der e2e-Lauf derselben Welle. Viermal versucht,
viermal `FEHLER: Auf 127.0.0.1:17843 lauscht bereits etwas`. Das ist kein Fehler eines Agenten,
sondern einer der Planung: Zwei Aufgaben derselben Welle haben denselben Port als stille
Voraussetzung.

**Entscheidung.**

1. **Der Port des Erzeugnisses bleibt fest.** `http://127.0.0.1:17843` steht in der CSP der Hülle
   und wird von `proof:shell-surface` zeichengleich gemessen. Ihn einstellbar zu machen, um
   Prüfläufe zu entzerren, hieße die Zusage zu öffnen, die E-001 trägt.
2. **Solange er fest ist, laufen portgebundene Nachweispfade und `test:e2e` nicht in derselben
   Welle.** Der Orchestrator plant das, nicht die Agenten. Wo es sich nicht vermeiden läßt, holt
   der Orchestrator die fehlenden Pfade **nach** der Welle nach — ein Nachweis, der nicht lief,
   ist kein grüner Nachweis.
3. **Innerhalb einer Welle fährt kein Agent `proof:all`.** Auch zwei Nachweisläufe stolpern
   übereinander, nicht nur ein Lauf über eine Prüfreihe. Jeder Agent fährt die Pfade, die seine
   Änderung betreffen; **den vollständigen Lauf fährt der Orchestrator nach der Welle**, auf
   einem Baum, an dem niemand mehr schreibt. Wer einen Pfad nicht fahren konnte, schreibt hin,
   welchen — ein Nachweis, der nicht lief, ist kein grüner Nachweis.
4. **Die Entzerrung ist dennoch eine Aufgabe.** Ein Prüflauf, der sich nicht neben einen anderen
   stellen läßt, wird mit wachsender Reihe teurer. Ob die Prüfläufe (nicht das Erzeugnis) ihren
   Port aus einer Umgebungsvariablen nehmen können, ohne die Zusage aus Punkt 1 zu berühren, ist
   zu prüfen und zu entscheiden — nicht nebenbei zu bauen.

## E-084 — Die eigene Feldprüfung steht vor der des Browsers

**Anlaß.** T-170 hat beim Bau der Fokusreihe einen Nebenbefund gemessen, der schwerer wiegt als
der Anlaß: Ein wirklich leeres Pflichtfeld erreicht die **deutsche** Fehlermeldung der Anwendung
gar nicht. Kein Formular trägt `noValidate`, also fängt Chromium den Absendeversuch selbst ab und
zeigt seine eigene Sprechblase — auf Englisch, in einer Gestalt, die Takt nicht kennt, und ohne
die Live-Region, die T-118 und T-162 für genau diesen Fall gebaut haben. Der Befund gilt
vermutlich für **jedes** `required`-Feld der Anwendung, nicht nur den Titel; nachgemessen ist
bisher einer.

**Entscheidung.**

1. **Die Formulare tragen `noValidate`, und die Prüfung der Anwendung ist die maßgebliche.** Zwei
   Gründe, und beide sind Regeln des Vorhabens: Oberflächentexte sind deutsch, und eine Meldung,
   die während eines stehenden Dialogs entsteht, wird **angesagt** (B-5, SC 4.1.3) — die native
   Sprechblase tut beides nicht.
2. **Bedingung, ohne die Punkt 1 nicht gilt:** Jedes `required`-Feld braucht seine eigene
   Prüfung, bevor ihm die des Browsers genommen wird. Wer `noValidate` setzt und ein Feld ohne
   eigene Prüfung zurückläßt, hat keine Meldung verbessert, sondern eine entfernt. Die Liste der
   betroffenen Felder wird **gezählt**, nicht geschätzt.
3. **Der Nachweis ist eine Prüfreihe, kein Bericht.** T-170 hat die Meßlücke selbst gefunden,
   weil `role="alert"` in einem `TextField` nie gemessen wurde. Die neue Reihe bleibt und wächst
   um die Felder aus Punkt 2.

## E-085 — Domäne und Hülle stellen dieselbe Frage, und das wird gemessen statt zugesichert

**Anlaß.** T-179 hat gemessen, was zwei Berichte daneben behaupteten: `checkAttachmentPath` in der
Domäne und `check_file` in der Hülle urteilten **verschieden** — bei `/home/nutzer/.lnk` sagte die
Domäne `ok`, die Hülle wies ab. Zwei grüne Prüffälle behaupteten beides zugleich
(`apps/desktop/src-tauri/src/attachment.rs:763` gegen `packages/domain/test/attachment.test.ts:421`).
T-178 hat nachgemessen: es waren **7 von 10** Namen, nicht einer — führender Punkt, nachgestellter
Punkt, nachgestelltes Leerzeichen. Nach der Behebung: 0 von 14.

Das ist keine Schlamperei eines Agenten. Es ist die vorhersehbare Folge davon, daß dieselbe Regel
in zwei Sprachen steht und **kein Lauf sie gegeneinander hält** — genau die Klasse, die in diesem
Vorhaben schon zweimal zugeschlagen hat (O-CR bei der Beschriftung, jetzt hier).

**Entscheidung.**

1. **Es gibt einen Nachweispfad `proof:attachment-parity`.** Er nimmt die Zeichenketten aus der
   Falltabelle des `#[cfg(test)]`-Blocks in `attachment.rs` und fährt sie durch
   `checkAttachmentPath` der Domäne. Weichen die Urteile ab, ist der Lauf rot — und die
   Fehlermeldung nennt den Namen, beide Urteile und die Stelle.
2. **Die Hülle darf strenger sein, die Domäne nie.** Das ist die Richtung, die zählt: Ein Name,
   den die Tür annimmt und die Hülle abweist, kostet einen Benutzer eine Fehlermeldung. Ein Name,
   den die Tür abweist und die Hülle annehmen würde, kostet nichts. Der Lauf mißt deshalb **eine
   Richtung als Fehler** und die andere als Hinweis.
3. **Er gehört zu frontend-dev**, weil dort schon der Wächter über dieselbe Datei liegt
   (`proof-shell-surface.mjs`), und weil die Alternative — zwei Eigentümer für einen Lauf über
   zwei Sprachen — die Frage nur verschiebt.
4. **Er wird gegengeprobt wie jeder andere:** eine eingesetzte Abweichung in der Domäne und eine
   in der Rust-Falltabelle müssen ihn rot machen. Sonst ist er der dritte Wächter, der etwas
   zusichert, was er nicht mißt (T-176-1 war der zweite).

## E-086 — Wo eine Regel in zwei Sprachen steht, mißt ein Lauf sie gegeneinander

**Anlaß.** Dieselbe Klasse hat in zwei Wellen dreimal zugeschlagen: `checkAttachmentPath` gegen
`check_file` (T-179 fand eine Abweichung, T-178 maß nach — **7 von 10** Namen), `is_release_version`
gegen `VERSION_SHAPE` (T-184: der Zweig, der dem Benutzer rät, den Verweis von Hand aufzurufen, ist
**nur** deshalb unerreichbar, weil beide heute zeichengleich sind, **und nichts mißt das**), und der
Kontrastlauf, der ein Farbpaar unter eigenem Namen führte, das keine Klasse zeichnete (T-181).
Jedes Mal war der Lauf grün und sagte nichts über das Erzeugnis.

**Entscheidung.**

1. **Jede Regel, die in zwei Sprachen steht, bekommt einen Lauf, der beide Seiten fährt.** Nicht
   zwei gepflegte Listen — die sind irgendwann *zufällig gleich sortiert*. Die **Falltafel gehört
   dem Lauf**, und er schickt jede Zeichenkette durch beide Seiten.
2. **Die Aussage ist nicht überall dieselbe, und sie wird je Lauf benannt.** Bei den Anhängen
   (`proof:attachment-parity`, E-085) darf die Hülle **strenger** sein, die Domäne nie — nur eine
   Richtung schadet. Bei der Fassungsprüfung wird **Gleichheit** gemessen: Ist die Hülle strenger,
   schickt Takt den Benutzer auf eine Seite, die es nicht gibt; ist die **Domäne** strenger, meldet
   sie `show: false` — und das ist nach A-18.11 von „alles aktuell" **nicht zu unterscheiden**.
   Eine wirklich veröffentlichte Fassung erschiene nie, ohne jede Fehlerfläche. Die stille
   Richtung ist die schlimmere.
3. **Gegenprobe in beide Richtungen, sonst zählt der Lauf nicht.** Eine eingesetzte Abweichung auf
   jeder Seite muß ihn rot machen. Das ist keine Förmlichkeit: T-176 hat einen Wächter gefunden,
   der 23 Gegenproben bestand und trotzdem blind war.
4. **Die Zahl gehört zur Gleichheit.** Wo beide Seiten eine Schranke tragen (`VERSION_MAX_LENGTH`
   gegen `MAX_VERSION_LEN`, heute 94), wird auch sie gemessen — eine Regel ist nicht nur ihre Form.

## E-087 — Eine Messung altert. Gemessen wird im Auftrag, nicht im Papier

**Anlaß.** T-163 hat gemessen, daß **kein** Streichkandidat in `tests/**` durch einen Textvergleich
festgenagelt ist, und diese Zusage trug die Freigabe des Textdurchgangs. T-181 fand beim Bauen den
ersten Gegenbeleg (ST-07), T-184 beim Nachmessen den zweiten — und der zweite ist der lehrreiche:
`S-19` zählt fünf Kennungen im Oberflächentext, es sind **sechs**, und ausgerechnet die übersehene
ist die einzige mit einem Prüffall. Dieselbe Alterung traf schon die Zahl der `getByRole`-Zugriffe
(222, nachgemessen 286).

Die Zusage war **nicht falsch**, sie war **richtig und veraltet**: gefahren gegen einen Baum, der
seither zehn Streichungen, die Pflichtmeldungen und X-04 aufgenommen hat.

**Entscheidung.**

1. **Vor jedem Streich- oder Umbenennungsauftrag wird der *heutige* Wortlaut gesucht** — in
   `tests/**` und `apps/*/test/**` —, und das Ergebnis steht **im Auftrag**, nicht im Designpapier.
   Ein Suchlauf je Eintrag. Der Auftraggeber des Auftrags trägt die Messung, nicht der Umsetzende.
2. **Eine Zahl in einem Papier ist ein Datum, kein Nachweis.** Wo sie trägt, gehört das Datum ihrer
   Messung daneben. Wer sie später benutzt, mißt neu oder nennt sie als Stand.
3. **Der Bestand hat das Mittel dafür schon** (`proof-shell-surface` Prüfung 3b und 4) — es wird
   nur nicht angewandt, wenn der Träger ein **Kommentar oder ein Designpapier** ist statt Code.
   Genau dort ist es künftig anzuwenden.
4. **Nachtrag vom 2026-09-06: gesucht wird über den Wortlaut, nicht über die Zeile.** T-196 hat es
   gezählt: In einer Datei stand **keine einzige** der dreizehn Zeilenangaben des eigenen Papiers
   richtig — elf davon exakt um acht verschoben, ohne daß ein Wortlaut sich geändert hätte. Und
   die drei Fundstellen, die T-195 wenige Stunden zuvor **ausdrücklich am Baum gemessen** hatte,
   waren schon wieder verrutscht. **Die Substanz hielt jedes Mal, die Zahl nie.** Also: ein Zitat
   ist der Anker, die Zeile höchstens ein Hinweis, und eine fremde Datei wird **ohne**
   Zeilenangabe genannt. Wer Zeilen doch nachführt, führt nur die nach, die er selbst gemessen
   hat, und kennzeichnet den Rest — eine stille Aktualisierung erzeugt genau die Zusicherung,
   gegen die diese Entscheidung gerichtet ist.

## E-088 — Die Doppelpunktregel bleibt vorerst an beiden Stellen, und der Grund steht dazu

**Anlaß.** O-FO: Seit T-178 weist Takt einen Doppelpunkt im Dateinamen **auch an der Tür** ab, auf
jeder Plattform. Unter Linux und macOS ist `:` ein gewöhnliches Namenszeichen — `Besprechung
10:30.pdf` läßt sich seither weder eintragen noch öffnen. Das ist eine Produktentscheidung, keine
Umsetzungsfrage, und security-checker hat sie in T-183 vorbereitet statt getroffen.

**Was die Sicherheit wirklich verlangt** (T-183, Abschnitt 24.3): die Regel an der **Hülle**, nicht
an der Tür. `check_file` ist die einzige Kontrolle vor dem Prozeßstart, und ein Wert erreicht den
Bestand über VG-1 und VG-3 an der Tür **vorbei** — ein Angreifer nimmt die Tür nie. Außerhalb des
Öffnens trägt der Doppelpunkt kein Risiko; nachgerechnet über Anzeige, Protokoll (`REASON_SHAPE`
läßt ihn ohnehin nicht durch), Export (Anhänge gelangen in keinen) und Bildablage.

**Entscheidung.**

1. **Die Regel bleibt vorerst an beiden Stellen.** Takt ist für Windows gebaut; dort kostet sie
   nichts. Der Preis fällt heute allein bei der Entwicklung an, und dort ist er sichtbar statt
   still.
2. **Der abgeratene Weg bleibt abgeraten:** „die Tür warnt nur" ist sicherheitlich unbedenklich,
   verlegt aber die Absage vom Augenblick der Eingabe hinter einen Klick und macht aus einer Regel
   zwei Wahrheiten — mit der milderen vorn.
3. **Eine plattformabhängige Regel ist vertretbar, kostet aber Meßbarkeit.** `pruefung.yml` fährt
   auf `windows-2022` nur `cargo test --lib`, nicht die pnpm-Nachweise; `proof:attachment-parity`
   liefe dort nicht. Wer diesen Weg will, baut zuerst den Läufer, dann die Regel.
4. **Wiedervorlage, nicht Abschluß** — und **nicht vor A-A-37**. Die ganze Begründung ruht auf dem
   Satz „`check_file` ist die einzige Kontrolle vor dem Prozeßstart", und dieser Satz ruht auf
   einem Wächter, der nachweislich grün bleibt, während ein vierter Aufrufort danebensteht.

## E-089 — Eine Bedingung, die niemand erfüllen kann, wird durch eine ersetzt, die man abhaken kann

**Anlaß.** E-088 Punkt 4 macht die Wiedervorlage der Doppelpunktregel davon abhängig, daß
`proof:shell-surface` nicht „grün bleibt, während ein vierter Aufrufort danebensteht". Diese
Bedingung ist inzwischen **dreimal** an einem Befund gescheitert, den derselbe Prüfer selbst
gefunden hat — `cr"…"`, das Zeichenliteral mit Fluchtfolge, und jetzt `['😀','"']`, wo ein Zeichen
oberhalb der BMP als Ersatzpaar den Rumpf sprengt. Er sagt es selbst: eine Bedingung, die an einem
**Negativbeweis** hängt („es fällt niemandem mehr etwas ein"), kann niemand erfüllen.

Zugleich hat er die Frage zum ersten Mal **begrenzt**: die lexikalische Grammatik der
Rust-Referenz vollständig durch den Lauf gefahren, **19 Formen, achtzehn gefangen, eine blind**.

**Entscheidung.**

1. **E-088 Punkt 4 wird ersetzt.** Die Wiedervorlage der Doppelpunktregel wird frei, sobald
   **A-A-46** gebaut (der `u`-Merker, ein Zeichen) und **A-A-47** erfüllt ist: je eine Kunstquelle
   für **jede** lexikalische Form der Rust-Referenz im Gegenprobenteil. Heute 18 von 19.
2. **Der Unterschied ist die Art der Frage.** Vorher hieß sie „ist jemandem noch etwas
   eingefallen?" — eine Frage, die nur der nächste Fund beantwortet. Jetzt heißt sie „steht jede
   Form der Referenz im Gegenprobenteil?" — abhakbar, und ihr Maßstab liegt außerhalb dieses
   Vorhabens.
3. **Die künstliche Gegenprobe fällt aus der Zählung** (A-A-48). `9r"x"` mißt keine Eingabe, die
   die Sprache erzeugen kann — gemessen über acht Dateien und 23 Schreibweisen: **null**
   Unterschiede, und `rustc` lehnt genau die abweichenden Fälle ab. Die Rückschau bleibt (ohne sie
   ist der Ausdruck **strenger**, nie milder); die Probe wird nicht mitgezählt, weil sie sonst
   ununterschieden in „31 Gegenproben" steht und eine Verhaltensprobe vortäuscht, wo eine
   Festschreibung des Quelltextes steht.
4. **Der Erbauer hat sie als künstlich benannt, und das rettet sie vor der Nacharbeit.** Der
   Maßstab dieses Vorhabens ist nicht, keine Notlösung zu bauen, sondern keine ungekennzeichnete.

**Nachtrag zu E-088 vom 2026-09-06 — die Wiedervorlage ist gelaufen, und Punkt 1 bleibt.**

Die Bedingung aus Punkt 4 ist in der Fassung von E-089 erfüllt: A-A-46 gebaut, A-A-47 erfüllt,
von security-checker nachgemessen (neunzehn Formen eins zu eins, die entscheidende Probe **ohne**
Leerzeichen nach dem Komma — mit Leerzeichen hätte sie trivial bestanden). Der Wächter ist zu, und
damit ruht der Satz „`check_file` ist die einzige Kontrolle vor dem Prozeßstart" erstmals auf einer
Messung statt auf einer Zusage.

**Die Doppelpunktregel bleibt an beiden Stellen, und das ist jetzt eine Entscheidung statt eines
Aufschubs.** Drei Gründe, in dieser Reihenfolge:

1. **Die Absage gehört in den Augenblick der Eingabe.** Nimmt man sie an der Tür heraus, nimmt
   der Bestand den Wert an und die Hülle weist ihn beim Öffnen ab — der Benutzer erfährt vom
   Fehler erst, wenn er ihn nicht mehr mit dem Eintippen in Verbindung bringt. Dasselbe Argument,
   das E-088 Punkt 2 gegen „die Tür warnt nur" führt.
2. **Der Preis fällt heute allein bei der Entwicklung an.** Takt wird für Windows gebaut; dort ist
   `:` in einem Dateinamen ohnehin unzulässig. Unter Linux kostet die Regel einen Dateinamen wie
   `Besprechung 10:30.pdf` — sichtbar, sofort, und nicht still.
3. **Zwei Fassungen derselben Regel sind teurer als eine strenge.** Die plattformabhängige
   Variante ist sicherheitlich vertretbar, kostet aber Meßbarkeit: `pruefung.yml` fährt auf
   `windows-2022` nur `cargo test --lib`, nicht die pnpm-Nachweise. Wer sie will, baut zuerst den
   Läufer, dann die Regel — und dann trägt E-085/E-086 sie mit.

**Damit ist E-088 abgeschlossen.** Wird die Regel je gelockert, geschieht es über eine neue
Entscheidung mit einem Läufer im Rücken, nicht über eine Zeile Code.

## E-090 — Ein Wächter mißt, was allein trägt, nicht alles, was in einem Papier steht

**Anlaß.** T-199 hat für zwei Sätze eine Zusicherung in `proof:addin` gebaut und dann **von sich
aus nicht ausgedehnt** — mit der Begründung, der Lauf würde sonst „eine zweite Quelle neben dem
Papier". Die Frage, ob er die ganze Sperrliste halten soll, hat er an den Orchestrator gegeben,
statt sie selbst zu entscheiden.

**Entscheidung.**

1. **Gemessen wird, was allein trägt.** Ein Satz kommt in einen Wächter, wenn er die **einzige**
   Stelle ist, an der eine Auskunft steht — dann kostet sein stiller Verlust etwas. Ein Satz, der
   neben zwei anderen dasselbe sagt, gehört nicht dorthin; sein Verlust ist eine Kürzung, keine
   Lücke.
2. **Ein Wächter, der ein ganzes Papier spiegelt, ist ein zweites Papier.** Er läuft mit der
   Aufnahme auseinander, sobald eine Welle beide anfaßt, und dann hat das Vorhaben zwei Listen
   und keine Wahrheit — genau die Klasse, die E-085, E-086 und O-GC beschreiben.
3. **Die Auswahl gehört begründet, nicht behauptet.** Wer einen Satz in einen Wächter legt,
   schreibt dazu, **warum er allein trägt**. Fällt die Begründung später weg (weil ein zweiter
   Träger entsteht), fällt die Zusicherung mit.

## E-091 — Wer streicht, darf den Sperreintrag datieren: eine zweite benannte Ausnahme

**Anlaß.** T-211 hat einen echten Widerspruch zwischen zwei Regeln gemeldet, statt ihn zu umgehen:
**E-081 Punkt 4** verlangt, daß Streichung und Ausgleich in **einem** Auftrag laufen — und seit
T-203 gehört zum Ausgleich ein Eintrag in der **Sperrliste**, mit dem **Datum des Falls** als
Pflichtangabe. Die Sperrliste steht in `docs/design/textbestand.md`, und die gehört ux-designer.
Der bauende Agent müßte also in fremder Hoheit schreiben — oder melden und warten, und dann steht
die Halbierung wieder da, die E-081 Punkt 4 gerade verbietet.

In dieser Welle ist es genau so passiert: frontend-dev hat beim Fall der Karte das Datum
nachgetragen, sachlich richtig und von der Auflage verlangt, **formal als zweiter Schreiber**.
Es ging gut aus, weil die Zeilen auseinanderlagen und ux-designer vor jedem weiteren Schreiben
nachgesehen hat. Das ist kein Verfahren, das ist Glück.

**Entscheidung — eine zweite benannte Ausnahme, so eng wie die erste.**

1. **Der bauende Agent darf in einem bestehenden Sperrlisteneintrag genau eine Angabe setzen: das
   Datum des Falls** (und, wo die Sorte es verlangt, den Verweis auf die gefallene Fläche). Nichts
   sonst — kein neuer Eintrag, kein geänderter Wortlaut, keine Umsortierung.
2. **Er sagt es im Bericht**, in einem Satz, mit der Zeile, die er gesetzt hat. Ein stiller
   Eingriff in fremder Hoheit bleibt ein Verstoß, auch unter dieser Ausnahme.
3. **Läuft ux-designer in derselben Welle**, meldet der bauende Agent es **zusätzlich** an den
   Orchestrator, damit die Kollision gesehen wird, statt gutzugehen.
4. **Der Grund ist derselbe wie bei `release.rs`:** Die Alternative ist nicht sauberer, sondern
   schlechter. Ein Datum, das eine Welle später nachgetragen wird, steht eine Welle lang falsch —
   und T-211 hat gemessen, wie das aussieht: die eigene Nachtragszeile war **eine Stunde lang**
   falsch, weil sie vor dem Fall geschrieben und nach dem Fall nicht nachgesehen wurde.

## E-092 — Eine verbindliche Regel, die niemand findet, ist keine Regel

**Anlaß.** T-212 hat gemessen, was passiert, wenn eine Regel nur in einem Aufgabenbericht steht:
frontend-dev hat in T-207 einen Umbauvorschlag gemacht, der **wörtlich P-9 ist** — der Regel, die
spec-ux-reviewer selbst geschrieben hat und die seit T-184 als **verbindlich** gilt. Er hat sie
nicht ignoriert, er hat sie **wiedererfunden**, weil ihr Wortlaut im ganzen Bestand nicht steht:
drei bare Verweise, und der einzige im Code liest sie **falsch herum**.

**Entscheidung.**

1. **Eine Regel, die über ihre Welle hinaus bindet, steht in `decisions.md`** — nicht in dem
   Bericht, in dem sie entstanden ist. Berichte sind Belege, keine Nachschlagewerke.
2. **Die drei Regeln, die diese Runde gekostet haben, stehen hiermit hier**, im Wortlaut ihres
   Verfassers:

   > **P-1 (berichtigt, T-184).** Ein Satz, mit Punkt, kein Ausrufezeichen, kein „Bitte", kein
   > „Sie müssen". Die Grundform nach P-3 bleibt bei **60 Zeichen**. Ein Satz mit dem zweiten
   > Halbsatz aus P-4 darf **80** — dieselbe Grenze wie ein dauerhaft sichtbarer Feldhinweis
   > (S-05), und P-4 begrenzt ihn ohnehin auf einmal je Formular.

   > **P-8 (T-184, verbindlich).** Eine Pflichtmeldung erscheint erst, wenn der Benutzer **an
   > diesem Feld etwas getan hat**. „Berührt" heißt: eine Eingabe, nicht ein Durchqueren. Ein
   > Feld, das seit dem Öffnen unverändert ist, wird beim bloßen Weitertabben nicht getadelt.
   > Ein Absendeversuch setzt `touched` weiterhin **immer**.

   > **P-9 (T-184, verbindlich).** **Der Auslöser folgt dem Knopf.** Läßt sich der Absendeknopf
   > drücken, kommt die Meldung beim **Absendeversuch**. Ist er von Anfang an gesperrt, kommt sie
   > beim **Verlassen nach einer Eingabe** (P-8), **und** der Grund für die Sperre steht von der
   > ersten Sekunde an als zustandsgebundener **Hinweis** daneben — nicht als Meldung.

3. **Die übrigen (P-2 bis P-7, und die S-Regeln aus den Textpapieren) zieht spec-ux-reviewer
   nach.** Solange sie nur in Berichten stehen, wird die nächste wiedererfunden — und dann steht
   sie zweimal da und läuft auseinander, wie es in dieser Sitzung viermal geschehen ist.

## E-093 — Die neun gesperrten Absendeknöpfe werden umgebaut

**Anlaß.** frontend-dev hat in T-207 gezählt, zerlegt und **gegen den eigenen Umbauvorschlag**
gefragt, ob ein dauerhafter Hinweis nicht billiger und besser wäre. spec-ux-reviewer hat in T-212
mit **dessen eigenen Zahlen** dagegen entschieden, und zwei der drei nicht in Zeilen meßbaren
Kosten halten nachweislich nicht: Die eine Messung, die achtmal wöge, ist auf dem Board längst als
erledigt geführt, und der Riegel wiegt nicht neunmal, weil er **zentral** in `FormDialog.tsx`
liegt — alle neun laufen hindurch.

**Entscheidung.**

1. **Alle neun werden umgebaut**, nicht fünf. Neun Dialoge in zwei Bauarten sind schlechter als
   neun in einer — die Lehre dieser Sitzung aus dem halb umgesetzten Textdurchgang.
2. **Die Eingabetaste ist der Gewinn, nicht der Preis.** Der gesperrte Absendeknopf ist der
   Standardknopf des Formulars; Enter im frisch geöffneten Dialog ist damit heute ein **stummer
   Leerlauf**. Das ist die Sorte Fehler, die niemand meldet, weil sie wie Absicht aussieht.
3. **Vorher zu messen** ist die Behauptung über die Eingabetaste — sie ist gerechnet, nicht im
   Browser gesehen, und sie trägt einen Teil dieses Urteils.
4. **Nicht parallel zu Bündel 0.** Beide fassen `FormDialog.tsx` an; sie laufen nacheinander, und
   die Reihenfolge entscheidet der Orchestrator, nicht der Zufall.
5. **Nachtrag vom 2026-09-06 (T-221), und er ist blockierend — beide Punkte standen bis eben nur
   in einem Bericht, also genau dort, wogegen E-092 geschrieben wurde.**
   - **Der Riegel steht an der falschen Stelle.** `if (busy || submitDisabled) return;` liegt in
     `FormDialog.tsx` **vor** dem Setzen des Zustands, an dem die Rückführung und die Meldung
     hängen. Wörtlich gebaut **erschiene der freigegebene Satz nie** — der Knopf bliebe stumm, und
     alle Prüffälle der Sorte „es wird nichts geschickt" wären grün. Der Riegel muß den
     **Versuch** zählen und **dann** abbrechen.
   - **Der Satz gehört nicht in den Fehlerkanal.** `TextField.error` setzt `aria-invalid="true"`
     und die Fehlerfarbe — das erklärt einen **gültigen, gespeicherten** Wert für ungültig. Das
     Vorbild steht im Bestand: die Absage im Bestätigungsdialog liegt in einer Statusfläche
     **ohne** `aria-invalid`. Es ist der einzige Befund dieser Runde, der einer Vorlesehilfe
     etwas **Falsches sagt**.

## E-094 — Eine Selbstprobe geht denselben Weg wie ihr Prüfgegenstand, oder sie sagt, welchen sie ausläßt

**Anlaß.** T-230, die achte Anwendung derselben Frage — diesmal in **vier Läufen von vier**. Der
schwerste Fall zeigt die Bauart: `proof:callers` meldet `ok` mit **„0 Dateien durchgesehen"** und
bleibt **45/0, Code 0**, wenn sein Sammler nichts einsammelt. Und seine **sechs** Gegenproben
können das **strukturell nicht sehen**, weil die Kunstquelle der **Liste hinzugefügt** wird: Sie
prüfen damit das **Sieb**, nie die **Ernte**.

Dieselbe Sitzung hat davon acht Ausprägungen gesehen — ein Wächter, der grün blieb, während ein
vierter Aufrufort danebenstand; ein Ausdruck, der zwanzig Zeilen unter seiner eigenen
Blindheitswarnung wieder benutzt wird; eine Zusicherung über **30 Namen** nach **null** verglichenen
Zeilen; ein Farbpaar, das nie eine sichtbare Fläche hatte.

**Entscheidung.**

1. **Eine Gegenprobe muß denselben Weg nehmen wie das, was sie prüft.** Wird die eingesetzte
   Verletzung an dem Schritt **vorbei** eingespeist, den sie prüfen soll, mißt sie sich selbst.
2. **Wo das nicht geht, sagt der Lauf es** — im Kopf, nicht im Bericht: *welchen Schritt diese
   Probe ausläßt und was deshalb ungemessen bleibt*. Ein benannter Rest ist tragbar, ein
   unbenannter nicht.
3. **Und der Zähler gehört zur Aussage.** „0 Dateien durchgesehen" darf nicht `ok` sein. Wo ein
   Lauf über eine Menge urteilt, prüft er **zuerst**, daß die Menge nicht leer ist — dieselbe
   Regel, die T-215 für eine Zusicherung über der leeren Menge schon einmal gebaut hat.
4. **Der Vorschlag kam von security-checker, die Entscheidung ist meine** — er hat sie ausdrücklich
   nicht selbst getroffen, weil verfassen und genehmigen in einer Hand nicht geht.

## E-095 — Ein überspringbarer Lauf gehört nicht in eine Menge, deren Wert das Nichtüberspringen ist

**Anlaß:** T-232 hat die Engine-Messung dauerhaft gemacht — `proof:engines`, 23 Prüfungen, zwei
Engines (WebKitGTK 2.52.6 und Chromium 151.0.7922.34), vier Gegenproben, jede in **beiden** Engines
gerendert. Der Erbauer hat gefragt, ob der Lauf in `proof:all` gehört, und **selbst nein gesagt**,
mit dem Argument, das trägt: Der Lauf braucht `xvfb-run`, `python3-gi` mit `WebKit2 4.1`, Pillow und
Playwrights Chromium. Fehlen sie, sagt er ehrlich *„ÜBERSPRUNGEN — dieser Lauf hat nichts
gemessen"* — und geht mit **Code 0** hinaus.

`proof:all` besteht aus neunzehn Läufen, die auf jedem Rechner **dasselbe** messen. Ein
überspringbarer zwanzigster macht die Menge weicher, ohne daß es jemand sieht: `proof:all` bliebe
grün und hieße auf zwei Rechnern zweierlei. Dazu 18 Sekunden gegen Millisekunden.

**Entscheidung.**

1. **`proof:engines` steht als Wurzelbefehl neben `test:e2e`** — nicht in `proof:all`, nicht in
   `check`. Gemessen über den Wurzelbefehl: **23 bestanden, 0 fehlgeschlagen**.
2. **Der Preis dafür ist benannt, nicht verschwiegen:** Ein Lauf, der nichts messen kann und
   trotzdem mit Code 0 hinausgeht, ist die Bauform, vor der **E-094 Punkt 3** warnt. Hier ist sie
   vertretbar, weil der Lauf **freiwillig** gefahren wird und im selben Atemzug sagt, was ungemessen
   blieb. Sie ist **nicht** vertretbar dort, wo die Umgebung feststeht.
3. **Also: in der Prüfstrecke wird ein Übersprung rot.** Der Lauf bekommt einen Schalter, der
   jeden Übersprung zu Code 1 macht, und die Prüfstrecke richtet die vier Voraussetzungen ein und
   fährt ihn damit. Ohne den Schalter wäre die Prüfstrecke grün, gerade weil sie nichts gemessen
   hat — und das ist der Fehler, den diese Sitzung achtmal gefunden hat. **Eine Prüfung des
   Ausgabetextes durch die Prüfstrecke ist ausdrücklich nicht die Antwort:** sie wird beim ersten
   umformulierten Satz still blind.
4. **Die Bilder werden nicht aufbewahrt.** `--keep=<Pfad>` bleibt der einzige Weg, sie zu sehen;
   ein fester Ordner im Bestand bräuchte einen Eintrag in `.gitignore` und würde bei jedem Lauf
   überschrieben, ohne daß jemand hinsieht. Die gemessenen **Zahlen** stehen im Bericht.
