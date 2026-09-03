# Testplan — Takt

Stand: 2026-09-01. Welle 1, Aufgabe T-002; ergänzt in T-016 um die Funde aus Welle 1 und die
seither bestätigten Entscheidungen, einschließlich dreier Korrekturen, die während T-016 selbst
eintrafen: die Gruppierung je Todo und Tag (Abschnitt 1 und der neue Abschnitt 9a), die
Festlegung von Mitternachtsregel und Trennzeichen für die Leistungstexte (ebenfalls Abschnitt 9a)
und die Richtigstellung, dass „Erledigt" unabhängig von der Kanban-Spalte ist (Abschnitt 5 und 8;
eine zunächst angenommene „Rückkehr-Spalte" nach E-023 existiert nicht und ist wieder entfernt).

Grundlage: `docs/spec.md` (verbindlich, besonders Abschnitt 11 „Pflicht-Screens" und Abschnitt 16
„Interaktionen und Zustände"), `.claude/team/decisions.md` (E-001 bis E-024, besonders E-008,
E-009, E-011, E-012, E-016 bis E-020), `.claude/team/risks.md` (besonders R-03, R-06,
R-08, R-10, R-15, R-17, R-18), `docs/bedrohungsmodell.md` Abschnitt 7 (23 Prüfungen) und
`.claude/team/reports/T-005-spec-ux-reviewer.md` Abschnitt 4 (19 Orte mit sichtbarem
Exportstatus). **Hinweis zu E-023:** Dieses Dokument setzt E-023 (Rückkehr-Spalte) nach
ausdrücklicher Richtigstellung des Auftraggebers während T-016 **nicht** um — siehe Abschnitt 5.
Das ist ein möglicher Widerspruch zu `decisions.md`, der dort von der zuständigen Stelle zu
klären ist; dieser Testplan kann `decisions.md` nicht selbst berichtigen.

**Nachtrag T-081 — Abschnitt 8 ist durch E-054/E-055 abgelöst, nicht nur ergänzt.** Seit E-054
ist eine Kanban-Spalte eine **Regel über Tags**, dieselbe Entität wie ein Pool; Ziehen zwischen
Spalten (A-5.2, I-14) gibt es nicht mehr, ebenso wenig die „Statusspalten"-Verwaltung, die
Abschnitt 8 in der bis T-080 gültigen Fassung beschrieb. Seit E-055 ist die Regel eine Struktur
mit fünf benannten Achsen (erforderliche Tags, ausgeschlossene Tags, Status, Erledigt,
Exportstatus) statt einer Liste von Termen. Abschnitt 8 ist deshalb vollständig neu geschrieben,
nicht ergänzt — die vorherige Fassung prüfte eine Bedienung, die es nicht mehr gibt (Bericht
`T-081-e2e-tester.md`). Die Korrektur aus T-016 in Abschnitt 5 („Erledigt ist unabhängig von der
Kanban-Spalte") gilt fachlich fort, aber nur für eine Spalte, die zur Achse „Erledigt" neutral
steht; für eine Spalte, die auf „Erledigt" oder „Unerledigt" filtert, ist das Gegenteil richtig
und beabsichtigt (E-054, Abschnitt 8, TP-KANBAN-04) — das ist die einzige Art, wie eine Karte
heute noch ohne Tag-Änderung die Spalte wechselt.

**Begriffe.** Seit E-016 heißen die beiden Notizfelder in der Oberfläche, in diesem Dokument und
im Review **Vermerk** (am Todo, ausschließlich intern, A-7.2) und **Leistung** (an der Buchung,
geht in den Export, A-7.4). Der JSON-Schlüssel im Export bleibt `Notiz` (A-8.2) — das betrifft
nur das Übertragungsformat an das Abrechnungstool, nicht die Bildschirmbeschriftung. Wo dieses
Dokument aus älteren Abschnitten noch „Todo-Notiz" oder „Buchungsnotiz" verwendet, ist das
gleichbedeutend mit Vermerk beziehungsweise Leistung; neue Abschnitte verwenden durchgehend die
neuen Begriffe.

**Nachtrag während T-016: Rundung wird pro Todo und Tag gruppiert, nicht mehr je Buchung
(E-020, abgelöst von der vorläufigen Fassung, bestätigt 2026-08-31).** Alle noch offenen
Buchungen desselben Todos am selben Kalendertag werden addiert, danach wird die Summe
aufgerundet (Regel unverändert: aufwärts auf die nächste Viertelstunde, Minimum 0,25, E-008).
Ergebnis ist eine Exportzeile je Todo und Tag, nicht je Buchung. Die Leistungstexte der Buchungen
einer Gruppe werden zu einem Text zusammengeführt, sortiert nach Startzeit; Base64 wird auf den
zusammengeführten Text angewandt, nicht je Einzeltext. Der Exportstatus bleibt je Buchung; eine
bereits exportierte Buchung fließt nicht in die Summe der Gruppe ein. Diese Korrektur kam ein,
nachdem Abschnitt 1 und Abschnitt 9 dieses Dokuments bereits in T-002 geschrieben waren; beide
sind unten überarbeitet, Abschnitt 9a ist neu. Alle drei ursprünglichen Folgefragen aus E-020 sind
inzwischen während T-016 beantwortet worden: Bei einer Buchung über Mitternacht zählt der
**Starttag** vollständig (`TP-EXPORT-15`); die Leistungstexte werden ohne jedes Escaping mit
„; " verbunden, wobei jedes Segment nur an den Rändern normalisiert (Leerzeichen, ein
abschließendes Semikolon oder ein abschließender Punkt entfernt) und leere Segmente übersprungen
werden (`TP-EXPORT-16`, `TP-EXPORT-16a`) — beides ausdrücklich eine Festlegung des Orchestrators,
keine Auftraggeber-Entscheidung. Neu und eigenständig offen ist dagegen der Randfall, in dem
**alle** Segmente einer Tagesgruppe leer sind (`TP-EXPORT-16c`) — den hat der Orchestrator selbst
als ungeklärt benannt, weil er davon abhängt, ob das Abrechnungstool eine leere Notiz annimmt.

**Ausführungsstand dieses Dokuments.** Dies ist ein Plan, keine Ausführung. Zum Zeitpunkt der
Erstellung existiert weder das Projektgerüst (T-008) noch die Fachlogik (T-009) noch eine
Playwright-Umgebung. Kein Testfall in diesem Dokument wurde gelaufen; es gibt aktuell nichts,
gegen das er laufen könnte. Sobald T-008/T-009 stehen, wandern die als „Unit" und „Integration"
markierten Fälle in `packages/*/test/**` beziehungsweise `apps/*/test/**` (Zuständigkeit
unit-tester, T-010), die als „End-to-End" markierten Fälle nach `tests/e2e/**` (Zuständigkeit
e2e-tester, noch keine eigene Aufgabe auf dem Board — siehe „Offene Punkte" am Ende).

## Aufbau dieses Dokuments

Jeder Testfall enthält: ID, Titel, betroffene Anforderungs-IDs aus `docs/spec.md`, Vorbedingung,
Schritte, erwartetes Ergebnis, Ebene. Bei den beiden vollständig durchparametrisierten Blöcken
(Rundung, Base64) ist die Vorbedingung/Schrittfolge identisch für alle Werte; sie steht einmal
voran, die wertspezifischen Teile (Titel/Eingabe, Erwartung) stehen in einer Tabelle. Das ist
bewusst kompakter als 15 Mal derselbe Absatz, enthält aber weiterhin jedes geforderte Feld je
Fall.

ID-Schema: `TP-<Bereich>-<Nummer>`. Bereiche: `BASE` (Basis-CRUD), `ROUND` (Rundung), `B64`
(Base64), `NOTE` (Notiz-Trennung, Vermerk gegen Leistung), `EXPST` (Exportstatus), `TIMER`, `TAG`,
`DTAG` (Standard-Tags), `KANBAN`, `EXPORT` (Export Ende-zu-Ende, seit T-016 einschließlich der
Gruppierung je Todo und Tag), `TPL` (Exportvorlagen), `ADDIN`, `STATE` (Zustände je Screen),
`SEC` (neu in T-016: Prüfungen, die unmittelbar aus `docs/bedrohungsmodell.md` Abschnitt 7
folgen und in keinem anderen Bereich schon abgedeckt sind).

Abschnitte 1–12 entsprechen den elf Pflichtbereichen aus dem Auftrag; Abschnitt „Export" ist
dabei in „Export Ende-zu-Ende" (9, mit neuem Unterabschnitt 9a zur Gruppierung) und
„Exportvorlagen" (10) aufgeteilt, weil beides im allgemeinen Rollenauftrag als zwei getrennte
durchgehende Abläufe genannt ist. Abschnitt 13 ist neu in T-016 und bildet die 23 Prüfungen aus
dem Bedrohungsmodell ab.

Gültige Werte für „Ebene": **Unit**, **Integration**, **End-to-End**. Unit und Integration
gehören dem unit-tester (Vitest, in `packages/*/test/**` bzw. `apps/*/test/**`). End-to-End
gehört dem e2e-tester (Playwright, in `tests/e2e/**`).

---

## Testdaten-Konventionen für `tests/fixtures/`

Es werden noch keine Fixture-Dateien angelegt — diese Aufgabe liefert nur den Plan. Die
folgenden Konventionen gelten, sobald Fixtures entstehen (voraussichtlich in einer künftigen
e2e-Testaufgabe, siehe „Offene Punkte").

Alle Inhalte sind erfunden. Keine echten Call-Nummern, Kundennamen oder Benutzernamen — auch
nicht die des Entwicklungsrechners oder eines Teammitglieds, auch nicht in abgewandelter Form.

Vorgeschlagene Verzeichnisstruktur:

```
tests/fixtures/
  todos/       Beispiel-Todos als JSON (Titel, Tags, Notiz, Status, callNumber)
  buchungen/   Beispiel-Zeitbuchungen (Dauer, Notiz, Exportstatus)
  tags/        Tag- und Ordnerbäume, u. a. die vierstufige Teststruktur
  vorlagen/    Exportvorlagen-Definitionen, u. a. eine abweichende Vorlage
  emails/      Beispiel-E-Mails für das Add-in-Szenario (.eml oder .html-Auszug)
  exporte/     Erwartete Export-Ergebnisse zum Abgleich (golden files)
  texte/       Lange bzw. sonderzeichenreiche Notiztexte als eigene .txt-Dateien
```

Namenskonvention: kebab-case, sprechend, mit Themenpräfix. Beispiele:
`todo-erledigt-mit-laufender-buchung.json`, `buchung-notiz-sonderzeichen-umlaute.json`,
`buchung-dauer-16-minuten.json` (der Unterscheidungsfall aus E-008),
`vorlage-minimal-ohne-notiz.json`, `email-call-bereits-vorhanden.eml`,
`exporte/erwartet-standardvorlage-happy-path.json`.

Platzhalterwerte:
- Call-Nummern nach einem klar fiktiven Muster, z. B. `TCK-000042`, passend zu einem in den
  Add-in-Einstellungen konfigurierten Test-Regex. Nie ein Muster, das einer im Unternehmen
  tatsächlich vergebenen Ticket-ID ähnelt.
- Kundennamen als generische Platzhalter: „Muster GmbH", „Beispiel AG", „Test-Kunde 3".
- `WindowsUser` als klar erkennbare Testkennung: „t.beispiel", „test.user01" — niemals ein
  echter Benutzername, auch nicht der des Rechners, auf dem getestet wird. Die Testumgebung
  stubbt die Systemabfrage des Benutzernamens; sie liest ihn nie tatsächlich vom Betriebssystem.
- Notiztexte frei erfunden, thematisch neutral, nie Ausschnitte aus echten Supportfällen.

Kodierung: alle Fixture-Dateien UTF-8 ohne BOM, damit die Base64-Tests reproduzierbar bleiben.

Zeitangaben: keine festen absoluten Zeitstempel in Fixtures, wo vermeidbar; Start-/Endzeiten von
Buchungen werden im Test relativ zum Testlaufzeitpunkt erzeugt, um Flakiness durch Datumsdrift
zu vermeiden.

Änderungsdisziplin: Eine Fixture-Datei gehört zu dem Testfall, der sie eingeführt hat, und wird
nur zusammen mit diesem geändert. Gemeinsam genutzte Fixtures (z. B. die vierstufige
Tag-Ordner-Struktur) liegen in einer eigenen, klar benannten Datei und werden von mehreren
Testfällen nur lesend referenziert.

---

## 0. Grundfunktionen (Basis-Abdeckung von I-01 bis I-04)

Bevor die Sonderfälle geprüft werden, muss der Grundweg funktionieren. Diese Fälle sind bewusst
knapp gehalten; sie sind Voraussetzung für praktisch jeden anderen Testfall in diesem Dokument.

### TP-BASE-01 — Todo anlegen
**Anforderungen:** A-2.1, A-2.2, I-01, S-01, S-02
**Ebene:** End-to-End
**Vorbedingung:** Anwendung gestartet, mindestens ein Tag existiert.
**Schritte:**
1. Über die Todo-Liste (S-02) ein neues Todo mit Titel „Beispielaufgabe 1" anlegen.
2. Speichern.
**Erwartetes Ergebnis:** Das Todo erscheint in der Todo-Liste und im Dashboard (S-01) unter
„zuletzt bearbeitet". Status ist aktiv, nicht erledigt.

### TP-BASE-02 — Todo bearbeiten
**Anforderungen:** A-2.2, A-2.3, I-02, S-03
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo aus TP-BASE-01 existiert.
**Schritte:**
1. Todo öffnen, Titel ändern, einen Tag hinzufügen, Vermerk eintragen.
2. Speichern, Seite neu laden.
**Erwartetes Ergebnis:** Alle drei Änderungen sind nach dem Neuladen weiterhin vorhanden.

### TP-BASE-03 — Todo als erledigt markieren
**Anforderungen:** A-2.4, I-03
**Ebene:** End-to-End
**Vorbedingung:** Ein aktives Todo, das über ein Tag einem Pool zugeordnet ist.
**Schritte:**
1. Todo als „Erledigt" markieren.
2. Pool-Ansicht öffnen, die zuvor das Todo zeigte.
**Erwartetes Ergebnis:** Todo trägt „Erledigt", verschwindet aus der aktiven Pool-Ansicht (sofern
diese erledigte Todos ausblendet). Gegenprobe zu TP-TIMER-04 bis TP-TIMER-06.

### TP-BASE-04 — Timer starten und stoppen, Normalfall
**Anforderungen:** A-6.1, A-6.2, A-6.4, I-04, S-05
**Ebene:** End-to-End
**Vorbedingung:** Ein aktives Todo ohne laufenden Timer.
**Schritte:**
1. Timer starten.
2. Nach einer plausiblen Zeitspanne Timer stoppen.
**Erwartetes Ergebnis:** Eine neue Zeitbuchung entsteht mit Start-, Endzeit und Dauer. Ihr
Exportstatus ist „offen".

---

## 1. Rundung (E-008: aufwärts auf die nächste Viertelstunde, Minimum 0,25 — bestätigt)

**Hintergrund, Stand nach T-016.** E-008 ist nicht mehr vorläufig: Der Auftraggeber hat am
2026-08-31 „Rundung aufwärts" bestätigt, nachdem T-001 beide Varianten (immer aufrunden gegen
kaufmännisch runden) über die volle Wertetabelle gerechnet vorgelegt hatte — 16,00 Stunden gegen
15,25 Stunden, 4,9 Prozent Unterschied, abweichend nur bei 16 und 61 Minuten. **R-03 ist damit
geschlossen**, nicht nur „weitgehend geklärt". Die Rundungsfunktion selbst wird unten weiterhin
isoliert auf Unit-Ebene geprüft; **`TP-ROUND-07` (16 Minuten) ist jetzt ein verbindlicher, nicht
mehr bedingter Testfall** — sein erwarteter Wert 0,50 ändert sich nicht mehr in Abhängigkeit von
einer künftigen Entscheidung. Die kaufmännische Alternative bleibt laut E-008 im Code umschaltbar
und der verwendete Modus wird je Exportlauf mitgeschrieben; dafür kommt unten `TP-ROUND-16` neu
hinzu, damit die Umschaltung selbst nicht unbemerkt kaputtgeht.

**Nachtrag während T-016: Was hier gerundet wird, hat sich verschoben, die Formel nicht.**
E-020 (siehe Kopf dieses Dokuments) gruppiert seit dem 2026-08-31 alle noch offenen Buchungen
desselben Todos am selben Kalendertag und rundet erst die **Summe**. Die Fälle `TP-ROUND-01` bis
`TP-ROUND-16` prüfen weiterhin ausschließlich die reine Rundungsfunktion — sie ist unverändert
eine Funktion von einer Dauer in Minuten auf einen `Zeit`-Wert in Schritten von 0,25, unabhängig
davon, ob diese Dauer eine einzelne Buchung oder eine bereits gebildete Tagessumme mehrerer
Buchungen ist. Was sich ändert, ist ausschließlich, **was** vor dem Aufruf dieser Funktion an sie
übergeben wird — das prüft nicht dieser Abschnitt, sondern der neue Abschnitt 9a (Gruppierung je
Todo und Tag), der die Aggregation selbst und ihr Zusammenspiel mit dem Exportstatus abdeckt.
Die Spalte „Eingabe" unten ist entsprechend als „Dauer in Minuten (eine Buchung oder eine bereits
gebildete Tagessumme)" zu lesen, nicht mehr zwingend als Einzelbuchung.

**Der Wert, der die beiden Regeln tatsächlich unterscheidet, ist 16 Minuten:** „immer aufrunden"
ergibt 0,50, „kaufmännisch runden" ergäbe 0,25. Das macht `TP-ROUND-07` zum wichtigsten
Einzeltest der gesamten Abrechnungslogik — er allein hätte entschieden, ob die falsche Regel
unentdeckt bliebe, wäre der Auftraggeber anders ausgefallen. Zur Vollständigkeit: Auch 61 Minuten
unterscheidet (siehe `TP-ROUND-13`, vom Auftraggeber selbst als zweiter abweichender Wert
bestätigt), ebenso 22 Minuten (kaufmännisch näher an 15 als an 30), 23 Minuten dagegen nicht
(kaufmännisch bereits näher an 30). Diese Beobachtung ersetzt nicht die Vorgabe, 16 Minuten als
den ausdrücklich benannten Fall zu behandeln, stützt aber, warum die volle Wertetabelle und nicht
nur die zwei Punkte aus dem ursprünglichen Auftraggebergespräch geprüft werden muss.

**Gemeinsame Vorbedingung (für alle TP-ROUND-*):** Die Rundungsfunktion der Fachlogik
(voraussichtlich `packages/domain`, Name noch offen aus T-001) ist aufrufbar mit einer Dauer in
Sekunden oder Minuten und liefert den `Zeit`-Wert in Schritten von 0,25 zurück.

**Gemeinsame Schritte (für alle TP-ROUND-*):**
1. Rundungsfunktion mit der Eingabedauer aus der Tabelle aufrufen.
2. Rückgabewert exakt mit dem Tabellenwert vergleichen. Empfehlung an domain-dev/unit-tester:
   intern mit ganzzahligen Viertelstunden-Einheiten rechnen und erst beim Export in die
   Dezimaldarstellung wandeln, damit der Vergleich nicht an Fließkomma-Ungenauigkeiten scheitert.

**Anforderungen (für alle TP-ROUND-*):** A-8.3, E-008

**Ebene (für alle TP-ROUND-*):** Unit

| ID | Eingabe (Minuten) | Erwartetes `Zeit` | Anmerkung |
|---|---|---|---|
| TP-ROUND-01 | 0 Minuten | Buchung existiert nicht / kein Export-Datensatz | E-008 wörtlich: „Eine Buchung von 0 Minuten Dauer existiert nicht." Erwartung ist Ablehnung/Nichtspeicherung, kein `Zeit`-Wert. Gilt unverändert auch für eine Tagesgruppe, deren Summe 0 ergäbe (kann praktisch nicht vorkommen, da jede Einzelbuchung bereits > 0 sein muss). |
| TP-ROUND-02 | 1 Minute | 0,25 | Mindestgrenze greift |
| TP-ROUND-03 | 3 Minuten | 0,25 | vom Auftraggeber bestätigter Punkt; unterscheidet die Regeln nicht |
| TP-ROUND-04 | 7 Minuten 30 Sekunden | 0,25 | vom Auftraggeber bestätigter Punkt; unterscheidet die Regeln nicht |
| TP-ROUND-05 | 8 Minuten | 0,25 | innerhalb der ersten Stufe |
| TP-ROUND-06 | 15 Minuten | 0,25 | exakte Stufengrenze, bleibt auf der Stufe |
| TP-ROUND-07 | **16 Minuten** | **0,50** | **Unterscheidungsfall, seit E-008-Bestätigung verbindlich.** Alternative Regel („kaufmännisch runden") ergäbe 0,25. Wichtigster Einzeltest dieses Bereichs; siehe `TP-ROUND-16` für die Prüfung des umschaltbaren Modus selbst. |
| TP-ROUND-08 | 22 Minuten | 0,50 | würde bei „kaufmännisch runden" ebenfalls 0,25 ergeben (Mittelpunkt 22,5) — zusätzliche Bestätigung von E-008 |
| TP-ROUND-09 | 23 Minuten | 0,50 | liegt bei beiden Regeln auf 0,50, kein Unterscheidungswert |
| TP-ROUND-10 | 30 Minuten | 0,50 | exakte Stufengrenze |
| TP-ROUND-11 | 45 Minuten | 0,75 | exakte Stufengrenze |
| TP-ROUND-12 | 60 Minuten | 1,00 | exakte Stufengrenze |
| TP-ROUND-13 | 61 Minuten | 1,25 | **Zweiter, vom Auftraggeber ausdrücklich bestätigter Unterscheidungsfall.** „Kaufmännisch runden" ergäbe 1,00 (61 Minuten liegen näher an 60 als an 75). |
| TP-ROUND-14 | 90 Minuten | 1,50 | exakte Stufengrenze |
| TP-ROUND-15 | 458 Minuten | 7,75 | großer Wert, mehrere Stufen übersprungen (458 → aufgerundet auf 465 Minuten = 7,75 h); dient zugleich als Stellvertreter für eine große Tagessumme aus vielen kleinen Buchungen |

### TP-ROUND-16 — Umschaltbarer kaufmännischer Modus bleibt korrekt und wird protokolliert
**Anforderungen:** A-8.3, E-008
**Ebene:** Unit
**Vorbedingung:** Die Rundungsfunktion nimmt den Rundungsmodus als Parameter entgegen oder liest
ihn aus einer injizierten Einstellung. Zwei Modi existieren im Code: `aufrunden` (Produktivmodus
laut E-008) und `kaufmaennisch` (weiterhin vorhanden, aber nicht die aktuelle Vorgabe).
**Schritte:**
1. Modus auf `kaufmaennisch` stellen, Rundungsfunktion mit 16 Minuten und mit 61 Minuten
   aufrufen — den beiden Werten, die laut E-008 zwischen den Regeln unterscheiden.
2. Modus zurück auf `aufrunden` stellen, dieselben zwei Werte erneut aufrufen.
**Erwartetes Ergebnis:** Im Modus `kaufmaennisch` ergibt 16 Minuten 0,25 und 61 Minuten 1,00 —
beides abweichend von der Tabelle oben. Im Modus `aufrunden` liefert dieselbe Funktion wieder
0,50 beziehungsweise 1,25, exakt wie in `TP-ROUND-07` und `TP-ROUND-13`. Kein Modus beeinflusst
den jeweils anderen (kein globaler Seiteneffekt zwischen zwei aufeinanderfolgenden Aufrufen).
Ergänzend siehe `TP-EXPORT-09`: dort wird geprüft, dass der aktive Modus je Exportlauf
mitgeschrieben wird, nicht nur korrekt rechnet.

**Ergänzender End-to-End-Spotcheck:** `TP-EXPORT-01` (Abschnitt 9) verwendet unter den
Testbuchungen ausdrücklich eine Buchung mit 16 Minuten Dauer, damit der Unterscheidungsfall auch
im echten Export-Durchlauf sichtbar bestätigt wird, nicht nur isoliert in der Unit-Ebene. Seit
der Gruppierung aus E-020 gilt das nur, solange diese Buchung die einzige offene Buchung ihres
Todos an ihrem Kalendertag ist — sonst würde sie mit anderen Buchungen summiert, bevor gerundet
wird, und der 16-Minuten-Wert wäre in der resultierenden Exportzeile nicht mehr isoliert
erkennbar. `TP-EXPORT-01` ist unten entsprechend präzisiert.

---

## 2. Base64 über UTF-8 (A-8.4)

**Hintergrund.** Das Exportfeld `Notiz` (Bildschirmbegriff: Leistung, siehe Begriffe im Kopf
dieses Dokuments) wird vor dem Export als Base64 kodiert, die Eingabe ist UTF-8 (A-8.4). Hin- und
Rückweg müssen für Sonderzeichen verlustfrei sein. **Nachtrag E-020:** Seit der Gruppierung je
Todo und Tag ist die Eingabe in den Fällen unten weiterhin ein einzelner Text auf Zeichenebene —
das reine Encoder/Decoder-Paar kennt keine Buchungen und keine Gruppen, es kodiert, was man ihm
gibt. Ob dieser Text aus einer einzelnen Buchung stammt oder bereits das Ergebnis der
Textzusammenführung mehrerer Buchungen eines Tages ist, prüft dieser Abschnitt nicht — das
gehört zu Abschnitt 9a (`TP-EXPORT-16`). Die Encoder-Tests unten bleiben so wie sie sind: sie
zeigen, dass die Kodierung selbst verlustfrei ist, unabhängig davon, was am Ende hineinläuft.

**Gemeinsame Vorbedingung (für alle TP-B64-*):** Encoder/Decoder-Funktion der Fachlogik ist
aufrufbar (z. B. `zuBase64(text: string): string` und `vonBase64(kodiert: string): string`).

**Gemeinsame Schritte (für alle TP-B64-*):**
1. Eingabetext kodieren.
2. Ergebnis dekodieren.
3. Dekodiertes Ergebnis mit dem ursprünglichen Eingabetext auf exakte Gleichheit vergleichen
   (Byte für Byte bzw. Codepoint für Codepoint, nicht nur „sieht gleich aus").

**Anforderungen (für alle TP-B64-*):** A-8.4

**Ebene (für alle TP-B64-*):** Unit

| ID | Eingabe (Beispiel, erfunden) | Besonderheit |
|---|---|---|
| TP-B64-01 | `""` | leere Notiz |
| TP-B64-02 | `"Übertragung mit Ärger, Grüße"` | Umlaute |
| TP-B64-03 | `"Straße, groß, Fuß"` | scharfes S |
| TP-B64-04 | `"café, façade, à bientôt"` | Akzente |
| TP-B64-05 | `"Fertig 🎉 vielen Dank 👍"` | Emoji (Mehrbyte-Codepoints außerhalb der Basic Multilingual Plane) |
| TP-B64-06 | `"Erste Zeile\nZweite Zeile"` | eingebetteter Zeilenumbruch |
| TP-B64-07 | ca. 10.000 Zeichen erfundener Fülltext | sehr lange Notiz, prüft Performanz und Blockgrenzen der Base64-Kodierung |
| TP-B64-08 | Kombination aus 02–06 in einem Text | worst case: alle Besonderheiten gleichzeitig |

**Ergänzende Tests:**

### TP-B64-09 — Transformation nur bei konfiguriertem Feld
**Anforderungen:** A-8.4, A-8.7
**Ebene:** Integration
**Vorbedingung:** Zwei Exportvorlagen: eine mit `transformation: base64` auf dem Leistungsfeld
(Quelle `buchung.notiz`), eine mit `transformation: roh` auf demselben Feld.
**Schritte:**
1. Dieselbe Leistung (Buchungsnotiz) mit Sonderzeichen über beide Vorlagen exportieren; die
   zugehörige Buchung ist die einzige offene Buchung ihres Todos an ihrem Kalendertag, damit die
   Gruppierung aus E-020 hier nicht dazwischenfunkt.
**Erwartetes Ergebnis:** Bei `base64` liegt das Feld kodiert vor und dekodiert korrekt zum
Original. Bei `roh` liegt der Text unverändert vor. Die Vorlage steuert die Transformation
unabhängig vom Inhalt.

### TP-B64-10 — Sichtprüfung im echten Export
**Anforderungen:** A-8.4
**Ebene:** End-to-End
**Vorbedingung:** Teil des Ablaufs `TP-EXPORT-01`.
**Schritte:** Siehe Abschnitt 9; eine der dortigen Testbuchungen trägt eine Leistung mit Umlauten
und einem Zeilenumbruch und ist die einzige offene Buchung ihres Todos an ihrem Kalendertag.
**Erwartetes Ergebnis:** Das `Notiz`-Feld der erzeugten Datei dekodiert (Base64 → UTF-8) exakt
zum ursprünglichen Leistungstext.

---

## 3. Notiz-Trennung — Vermerk gegen Leistung (A-7.2 gegen A-7.4, R-06) — wichtigster Sicherheitstest im Projekt

**Hintergrund.** Der Vermerk am Todo ist ausschließlich intern (A-7.2), die Leistung an der
Buchung geht in die Abrechnung (A-7.4). R-06 warnt ausdrücklich: Sobald Exportvorlagen frei
konfigurierbar sind (A-8.7), ist die Grenze nur so stark wie die Prüfung im Vorlagen-Motor
selbst — die Prüfung darf sich nicht auf die Standardvorlage beschränken. Jeder folgende Testfall
muss deshalb mit mindestens zwei unterschiedlichen Vorlagen laufen: der Standardvorlage und
mindestens einer frei konfigurierten, abweichenden Vorlage.

**Nachtrag T-016, R-18 — der wichtigste Einzelfund dieser Welle.** Ein Test, der den Vermerktext
nur im Klartext im Exportergebnis sucht, besteht bei jeder Vorlage, die das Feld über die
Transformation `base64` ausgibt — also genau im Fall der Standardvorlage. Der Test wäre grün und
die Grenze trotzdem gebrochen. `TP-NOTE-02` war in der ursprünglichen Fassung dieses Dokuments
genau dieser blinde Test: „Volltext durchsuchen" ohne die base64-kodierte Form des Markers
mitzuprüfen. Er ist unten umgeschrieben und sucht jetzt beide Formen. Das entspricht wörtlich
Prüfung 8 aus `docs/bedrohungsmodell.md` Abschnitt 7 („Eigenschaftstest über beliebige
Exportvorlagen: Die Todo-Notiz erscheint nie im Ergebnis — weder im Klartext noch
base64-kodiert"); Abschnitt 13 dieses Dokuments verweist für Prüfung 8 auf `TP-NOTE-02` statt sie
zu wiederholen.

**Nachtrag T-016, E-020 — Gruppierung.** Seit der Gruppierung je Todo und Tag wird der exportierte
Leistungstext nicht mehr je Buchung, sondern als Zusammenführung mehrerer Leistungstexte einer
Tagesgruppe gebildet, sortiert nach Startzeit, und erst danach base64-kodiert (siehe Kopf dieses
Dokuments und Abschnitt 9a). Die Volltextprüfung unten muss deshalb den Marker nicht nur im
einzelnen, sondern auch im zusammengeführten Leistungstext suchen — sonst würde ein Bruch der
Trennung erst bei mehreren Buchungen am selben Tag sichtbar, den ein Test mit nur einer Buchung
je Todo und Tag nie triggert.

### TP-NOTE-01 — `todo.notiz` ist als Feldquelle strukturell nicht wählbar
**Anforderungen:** A-7.2, A-8.7, R-06
**Ebene:** Unit
**Vorbedingung:** Validierungsfunktion für Exportvorlagen-Felder liegt vor.
**Schritte:**
1. Versuchen, ein Vorlagenfeld mit `quelle: "todo.notiz"` zu erzeugen, mit verschiedenen
   Transformationen (`roh`, `base64`) und mit/ohne Bedingung.
**Erwartetes Ergebnis:** Jeder Versuch wird abgelehnt (Validierungsfehler oder die Quelle ist im
zugrundeliegenden Typ gar nicht repräsentierbar). Kein Pfad akzeptiert `todo.notiz` als Quelle,
unabhängig von Transformation oder Bedingung. Ergänzend siehe `TP-TPL-08` (Abschnitt 10): dieselbe
Ablehnung muss für jede nicht gelistete Quelle gelten, nicht nur für `todo.notiz` (E-017).

**Befund (T-060, 2026-09-02), behoben in T-063 (2026-09-02).** War aktuell rot — dieselbe Ursache
wie bei `TP-TAG-03`: die inzwischen abgeschlossene Ark-UI-Umstellung des Auswahlfelds (T-059).
`getByLabel('Quelle')` traf zwei Elemente (Auslöser-Knopf **und** die gleich beschriftete, anfangs
verborgene Listbox — beide tragen `aria-labelledby` auf dieselbe Beschriftung). Ersatz:
`getByRole('combobox', { name: 'Quelle' })` für den Auslöser, danach `getByRole('option')
.locator('.select__option-label')` für die Beschriftungstexte selbst (nicht `.locator('option')`
und nicht der volle `innerText` je Eintrag — Optionen tragen seit T-059 zusätzlich eine
Beschreibungszeile, die "Notiz" durchaus legitim enthalten darf, z. B. bei der erlaubten Quelle
"Leistung"). Bestanden, dreifach wiederholt, keine Wiederholung gebraucht. Siehe
`tests/e2e/note-separation.spec.ts`.

### TP-NOTE-02 — Volltextprüfung über beliebige Vorlagen, Klartext **und** base64-kodiert
**(umgeschrieben in T-016, R-18)**
**Anforderungen:** A-7.2, A-7.4, A-8.7, R-06, R-18
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit einem Vermerk, der einen eindeutigen Marker enthält (erfunden,
z. B. `"GEHEIM-TODO-MARKER-9f3a"`). Zwei Zeitbuchungen dieses Todos am selben Kalendertag, jede
mit einer eigenen Leistung, die einen eigenen eindeutigen Marker enthält (z. B.
`"OFFEN-BUCHUNG-MARKER-71ab"` und `"OFFEN-BUCHUNG-MARKER-caf3"`) — bewusst zwei Buchungen statt
einer, damit die Zusammenführung aus E-020 mitgeprüft wird. Mindestens drei Exportvorlagen: die
Standardvorlage (Leistungsfeld mit `transformation: base64`), eine minimale abweichende Vorlage
mit `transformation: roh` auf dem Leistungsfeld, eine Vorlage, die möglichst viele erlaubte
Quellenpfade gleichzeitig nutzt.
**Schritte:**
1. Vor dem Export den erwarteten zusammengeführten Leistungstext der Tagesgruppe bilden (beide
   Buchungsmarker, nach Startzeit sortiert) und davon die Base64-Kodierung berechnen.
2. Export mit jeder der drei Vorlagen ausführen.
3. Jede erzeugte Ausgabedatei als Volltext durchsuchen — **zweifach**: einmal auf das Vorkommen
   des Todo-Markers im Klartext, einmal auf das Vorkommen seiner Base64-Kodierung als
   Teilzeichenkette. Dieselbe doppelte Suche für den Buchungsmarker bzw. den in Schritt 1
   berechneten zusammengeführten Text und dessen Base64-Form. Die gesamte Datei wird durchsucht,
   nicht nur das `Notiz`-Feld isoliert.
**Erwartetes Ergebnis:** Der Todo-Marker (`GEHEIM-TODO-MARKER-9f3a`) erscheint in keiner der drei
Dateien, **weder im Klartext noch base64-kodiert**, an keiner Stelle. Die Buchungsmarker
erscheinen in jeder Datei, deren Vorlage ein Leistungsfeld auf `buchung.notiz` enthält — je nach
Vorlage im Klartext (`roh`) oder base64-kodiert, aber in jedem Fall auffindbar, und zwar als Teil
des zusammengeführten Tagestexts, nicht als zwei getrennte Notiz-Einträge.

**Befund (T-060, 2026-09-02), behoben in T-063 (2026-09-02).** Zwei der drei Vorlagenläufe in
`tests/e2e/note-separation.spec.ts` (die abweichende „roh"-Vorlage und die Vorlage mit den meisten
Quellenpfaden) waren rot, aus demselben Grund wie bei `TP-NOTE-01`/`TP-TAG-03`: Beide wechselten
die aktive Exportvorlage über `page.getByLabel('Exportvorlage').selectOption(...)`, und das
Zielelement ist seit der Ark-UI-Umstellung (T-059) kein `<select>` mehr. Ersatz:
`getByRole('combobox', { name: 'Exportvorlage' }).click()`, danach `getByRole('option', { name:
<Vorlagenname>, exact: true }).click()`. Alle drei Läufe bestanden, dreifach wiederholt, keine
Wiederholung gebraucht.

### TP-NOTE-03 — Trennung sichtbar in der Oberfläche und in der Vorschau, Klartext **und** base64-kodiert
**Anforderungen:** A-7.2, A-7.4, A-8.7, R-06, R-08, R-17, R-18
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-NOTE-02, zusätzlich Zugriff auf S-14 (Vorlageneditor) und S-07
(Export-Ansicht) mit Live-Vorschau.
**Schritte:**
1. Vorlageneditor öffnen, Feld-Quelle-Auswahl für ein neues Feld öffnen.
2. Prüfen, ob „Vermerk" bzw. eine Quelle, die dem Vermerk entspricht, als Option angeboten wird.
3. Mit der Standardvorlage und mit einer eigens angelegten abweichenden Vorlage jeweils die
   Live-Vorschau (A-8.7) auf den tatsächlich offenen Testbuchungen öffnen; den angezeigten
   Vorschautext nach dem Todo-Marker durchsuchen, sowohl im dargestellten Klartext als auch —
   sofern die Vorschau die base64-kodierte Rohform irgendwo mit anzeigt oder als Attribut
   mitführt — in dieser kodierten Form.
4. Export mit beiden Vorlagen tatsächlich ausführen und die Ergebnisdateien öffnen.
**Erwartetes Ergebnis:** Der Vermerk ist in der Feldquellen-Auswahl nicht auswählbar (Schritt 2).
Der Todo-Marker erscheint weder in der Live-Vorschau noch in einer der beiden tatsächlich
erzeugten Exportdateien — in keiner der beiden Formen. Die Leistung erscheint in Vorschau und
Datei überall dort, wo die jeweilige Vorlage ein Leistungsfeld vorsieht. Da Vorschau und Datei
denselben Renderer benutzen müssen (R-17, siehe `TP-EXPORT-07`/`TP-EXPORT-08`), ist dieser Fall
zugleich der Beleg dafür, dass ein Bruch der Trennung in der Vorschau überhaupt sichtbar würde,
statt dass die Vorschau eine andere, harmlosere Wahrheit zeigt als die tatsächliche Datei.

### TP-NOTE-04 — Umgehung über die API direkt (Verteidigung in der Tiefe)
**Anforderungen:** A-7.2, A-8.7, R-06, R-02
**Ebene:** Integration
**Vorbedingung:** Lokaler Dienst läuft, gültiges Token vorhanden.
**Schritte:**
1. Direkt gegen die API des lokalen Dienstes (nicht über die Oberfläche) eine Exportvorlage mit
   Feldquelle `todo.notiz` anlegen bzw. speichern versuchen, unter Umgehung der UI-Auswahl.
**Erwartetes Ergebnis:** Die API lehnt die Anfrage ab (Validierungsfehler), unabhängig von der
UI. Die Prüfung liegt im Vorlagen-Motor selbst, nicht nur im Frontend-Dropdown — sonst wäre die
Datenschutzgrenze durch einen direkten API-Aufruf (z. B. vom Add-in aus) aushebelbar. Ergänzend
siehe `TP-TPL-08`: dieselbe Prüfung, aber für jede nicht gelistete Quelle allgemein (E-017), nicht
nur für `todo.notiz` im Besonderen.

---

## 4. Exportstatus (A-6.5 bis A-6.9, E-012, R-10)

### TP-EXPST-01 — Zweiwertiger, nie leerer Status
**Anforderungen:** A-6.4, A-6.5, A-6.9
**Ebene:** Unit
**Vorbedingung:** Datentyp/Enum für Exportstatus liegt vor.
**Schritte:** Prüfen, dass der Typ ausschließlich zwei Werte zulässt (z. B. „offen" und
„exportiert") und kein dritter, leerer oder Null-Wert konstruierbar ist.
**Erwartetes Ergebnis:** Jede Buchung hat zu jedem Zeitpunkt genau einen der zwei Werte.

### TP-EXPST-02 — Offen wird zu exportiert
**Anforderungen:** A-6.5, A-6.6, A-8.1
**Ebene:** Integration
**Vorbedingung:** Mehrere offene Buchungen vorhanden.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Alle in den Export einbezogenen Buchungen wechseln atomar auf
„exportiert". Nicht einbezogene Buchungen bleiben „offen".

### TP-EXPST-03 — Zweiter Export gibt dieselbe Buchung nicht erneut aus
**Anforderungen:** A-6.5, A-8.1
**Ebene:** Integration
**Vorbedingung:** Export aus TP-EXPST-02 bereits gelaufen.
**Schritte:** Export erneut ausführen, ohne zwischenzeitlich neue Buchungen anzulegen.
**Erwartetes Ergebnis:** Die bereits exportierten Buchungen erscheinen in keiner neuen
Ausgabedatei. Gibt es keine offenen Buchungen mehr, produziert der Export keine Datei mit
Inhalt bzw. zeigt einen Empty State, statt eine leere oder wiederholte Datei zu erzeugen.

### TP-EXPST-04 — Abgebrochener Export hinterlässt keinen Zwischenzustand
**Anforderungen:** A-8.8
**Ebene:** Integration
**Vorbedingung:** Speicher-Adapter so instrumentiert, dass der Schreibvorgang nach der Auswahl
der Buchungen, aber vor dem endgültigen Commit, gezielt fehlschlägt (z. B. simulierter
Schreibfehler).
**Schritte:**
1. Export auslösen.
2. Fehlschlag mitten im Vorgang provozieren.
3. Zustand der betroffenen Buchungen und des Zielordners prüfen.
**Erwartetes Ergebnis:** Keine Buchung ist als „exportiert" markiert. Keine unvollständige oder
angebrochene Datei bleibt im Zielordner zurück. Ein erneuter Export nach Beheben der
Fehlerursache funktioniert normal, ohne fehlende oder doppelte Buchungen.

### TP-EXPST-05 — Exportierte Buchung ist nicht bearbeitbar
**Anforderungen:** A-6.9
**Ebene:** End-to-End
**Vorbedingung:** Eine exportierte Buchung liegt vor.
**Schritte:** Versuchen, Dauer oder Notiz dieser Buchung zu ändern.
**Erwartetes Ergebnis:** Die Felder sind gesperrt bzw. die Änderung wird mit einer verständlichen
Meldung abgelehnt, die auf das Zurücksetzen des Exportstatus verweist.

### TP-EXPST-06 — Zurücksetzen je Buchung, mit Bestätigung und Protokoll
**Anforderungen:** A-6.9, E-012, R-10
**Ebene:** End-to-End
**Vorbedingung:** Eine exportierte Buchung liegt vor.
**Schritte:**
1. „Exportstatus zurücksetzen" für genau diese eine Buchung auslösen.
2. Bestätigungsdialog lesen (muss ausdrücklich benennen, dass die Buchung danach erneut
   exportierbar ist).
3. Einmal abbrechen, prüfen, dass sich nichts ändert.
4. Erneut auslösen und bestätigen.
**Erwartetes Ergebnis:** Nach Abbruch (Schritt 3) bleibt der Status „exportiert" unverändert.
Nach Bestätigung (Schritt 4) wird nur diese eine Buchung „offen"; andere exportierte Buchungen
bleiben unberührt. Die Buchung ist danach in der Oberfläche sichtbar als „schon einmal
exportiert" gekennzeichnet — nicht mit demselben visuellen Zustand wie eine Buchung, die noch
nie exportiert wurde. Der Vorgang ist protokolliert (Zeitpunkt, betroffene Buchung).

### TP-EXPST-07 — Exportstatus überall gleich erkennbar
**Anforderungen:** A-6.6, A-6.7, A-13.5
**Ebene:** End-to-End
**Vorbedingung:** Eine Buchung, die zurückgesetzt wurde (Zustand aus TP-EXPST-06).
**Schritte:** Dieselbe Buchung in der Übersicht aller Zeitbuchungen (S-06), in der
Todo-Detailansicht (S-03) und in der Export-Ansicht (S-07) betrachten.
**Erwartetes Ergebnis:** Der Status ist an allen drei Stellen erkennbar und stimmt inhaltlich
überein, einschließlich der Kennzeichnung „schon einmal exportiert" nach einem Reset — nicht nur
an einer der drei Stellen sichtbar.

### TP-EXPST-08 — Zeitbuchungen filtern (I-10)
**Anforderungen:** A-6.6, I-10
**Ebene:** End-to-End
**Vorbedingung:** Übersicht (S-06) enthält offene und exportierte Buchungen mehrerer Todos.
**Schritte:** Nach Status filtern, nach Todo filtern, Filter kombinieren, Filter zurücksetzen.
**Erwartetes Ergebnis:** Liste zeigt jeweils nur passende Treffer; kombinierte Filter schränken
weiter ein; Zurücksetzen zeigt wieder alle Buchungen.

### TP-EXPST-09 — Exportstatus an allen 19 aus T-005 benannten Orten sichtbar (neu in T-016)
**Anforderungen:** A-6.6, A-6.7, A-8.6, A-10.9, A-13.5, A-13.7, E-012
**Ebene:** End-to-End
**Vorbedingung:** `.claude/team/reports/T-005-spec-ux-reviewer.md` Abschnitt 4 benennt 19 Orte,
an denen der Exportstatus sichtbar sein muss. Dieselbe Testbuchung wie in `TP-EXPST-07` (einmal
zurückgesetzt, damit auch das Zusatzkennzeichen „schon einmal exportiert" aus E-012 mitgeprüft
wird), zusätzlich mindestens eine noch nie exportierte und eine bereits exportierte Buchung eines
anderen Todos.
**Schritte:** Jede der folgenden 19 Stellen einzeln aufsuchen und den dort sichtbaren
Exportstatus mit dem tatsächlichen Status der jeweiligen Buchung abgleichen. Die Liste ist eine
reine Prüfliste, kein neuer Ablauf; wo eine Stelle bereits durch einen anderen Testfall exakt
geprüft wird, verweist die letzte Spalte darauf, statt die Prüfung zu wiederholen.

| # | Ort (aus T-005 Abschnitt 4) | Erwartete Sichtbarkeit | Bereits geprüft durch |
|---|---|---|---|
| 1 | S-01, Kachel „nicht exportierte Zeiten" | Anzahl und Summe der offenen Buchungen | — |
| 2 | S-01, laufender Timer | als begrifflich offen gekennzeichnet | — |
| 3 | S-01, zuletzt bearbeitete Todos | Aufteilung „offen"/„gesamt" je Zeile | — |
| 4 | S-02, Todo-Zeile | dieselbe Aufteilung je Todo | — |
| 5 | S-03, Buchungsliste | Badge je Zeile plus getrennte Summen | `TP-EXPST-07` |
| 6 | S-04, Kanban-Karte | zusammengefasstes Zeichen „enthält offene Buchungen" | — |
| 7 | S-05, Tagesliste | Badge je Buchung | — |
| 8 | S-05, laufender Timer | wie 2 | — |
| 9 | S-06, Tabelle | Statusspalte, Filter, Zusatzkennzeichen „schon einmal exportiert" | `TP-EXPST-06`, `TP-EXPST-07`, `TP-EXPST-08` |
| 10 | S-06, Aktionsleiste der Auswahl | „7 ausgewählt · davon 2 exportiert" | — |
| 11 | S-07, Auswahlliste | enthält per Definition nur offene, als Überschrift kenntlich | `TP-EXPORT-01` |
| 12 | S-07, Vorschau | jeder Datensatz einer Buchung zuordenbar | `TP-TPL-02` |
| 13 | S-07, Ergebnis nach dem Export | Anzahl der eben umgestellten Buchungen | `TP-EXPORT-02` |
| 14 | S-07, Export-Verlauf | welcher Lauf welche Buchungen enthielt | `TP-EXPORT-09`, `TP-EXPORT-17` |
| 15 | S-14, Live-Vorschau | Hinweis, dass die Vorschau auf offenen Buchungen läuft | `TP-TPL-02` |
| 16 | S-12 Add-in, Karte des gefundenen Todos | Aufteilung offen/exportiert | `TP-ADDIN-02` (dort um diese Zusicherung erweitert) |
| 17 | Globale Suche | Treffer trägt das Badge | — |
| 18 | Globale Navigation | Zähler der offenen Buchungen am Eintrag „Export" | — |
| 19 | Toast nach jedem Statuswechsel | nennt den erreichten Status im Klartext | `TP-EXPST-06` |

**Erwartetes Ergebnis:** An allen 19 Orten stimmt der angezeigte Status mit dem tatsächlichen
Status derselben Buchung überein; keine der 19 Stellen zeigt einen abweichenden, veralteten oder
fehlenden Status. Die Darstellungsregel aus T-005 gilt an jeder Stelle: der Unterschied hängt
nicht allein an der Farbe (SC 1.4.1), sondern trägt Wort, Form und Farbe; das Zusatzkennzeichen
aus E-012 ist ein eigenes, deutlich anderes Zeichen neben dem Badge, kein dritter Badge-Zustand.
Zeilen 1, 2, 3, 4, 6, 7, 8, 10, 17 und 18 sind zum Zeitpunkt dieses Plans nicht durch einen
anderen Testfall belegt — für sie existiert noch kein dedizierter TP-Fall, weil der jeweilige
Screen-Ausschnitt (Dashboard-Kacheln, globale Suche, globale Navigation) in den Abschnitten 0–12
bisher nicht auf dieser Detailebene behandelt wird. Das ist hier absichtlich offen sichtbar
gemacht statt stillschweigend als „erledigt" markiert.

---

## 5. Timer und Wiederbelebung erledigter Todos (A-2.5, A-6.8, I-05)

**Hintergrund.** Wird der Timer eines bereits erledigten Todos erneut gestartet, hebt die
Anwendung „Erledigt" automatisch auf; das Todo wird aktiv und erscheint wieder in seinem Pool
(A-2.5, A-3.4). Dieser Ablauf wird von jeder Stelle aus geprüft, an der ein Timer startbar ist.

**Korrektur während T-016: „Erledigt" ist etwas eigenes, unabhängig von der Kanban-Spalte.** Ein
früherer Zwischenstand dieses Dokuments hatte hier eine „Rückkehr-Spalte" nach E-023 angenommen
und `TP-TIMER-04` bis `TP-TIMER-06` sowie einen eigenen `TP-TIMER-08` entsprechend erweitert. Der
Auftraggeber hat das ausdrücklich richtiggestellt, nachdem diese Annahme zwischenzeitlich falsch
weitergegeben worden war: „Erledigt ist etwas eigenes. Die Kanban Phase sind selbst definierbar.
Daher ist Kanban-Abschluss nicht gleich Erledigt." Es gibt weder eine gemerkte noch eine
konfigurierte Rückkehr-Spalte. Alle Rückkehr-Spalten-Zusicherungen sind unten wieder entfernt.
Stattdessen gilt: **A-2.5 löst sich ausschließlich über Sichtbarkeit.** Pools sind
tag-abgeleitet (A-3.4); ein erledigtes Todo wird darin ausgeblendet. Hebt der Timerstart das
Kennzeichen „Erledigt" auf, erscheint das Todo wieder im Pool — die Kanban-Spalte, in der es
liegt, ändert sich dabei **nicht**.

**Nachtrag T-081, seit E-054/E-055 zu ergänzen statt zu widerrufen.** Die vorstehende Aussage
gilt unverändert für jede Spalte, deren Achse „Erledigt" auf ihrem Neutralwert „Alle" steht — das
ist der Normalfall, und `TP-TIMER-04` bis `TP-TIMER-06` unten prüfen genau diesen. Seit eine
Regel die Achse „Erledigt" ausdrücklich auf „Erledigt" oder „Unerledigt" stellen kann (E-055),
gibt es die eine Ausnahme, für die das Gegenteil beabsichtigt ist: Eine solche Spalte **soll**
die Karte verlieren bzw. bekommen, sobald der Timerstart das Kennzeichen aufhebt — sonst wäre die
Achse wirkungslos. Das prüft `TP-KANBAN-04` (Abschnitt 8), nicht diese Fälle hier. Die früheren
`TP-KANBAN-05`/`TP-KANBAN-06` aus T-016 sind mit dieser Überarbeitung in `TP-KANBAN-04`
aufgegangen — sie beschrieben ein manuelles Verschieben zwischen Spalten, das es seit E-054 nicht
mehr gibt (siehe Abschnitt 8).

### TP-TIMER-01 — Domänenregel: Start auf erledigtem Todo
**Anforderungen:** A-2.5, A-3.4
**Ebene:** Unit
**Vorbedingung:** Ein Todo im Zustand „erledigt", auf einer beliebigen Kanban-Spalte, nicht
notwendigerweise einer Abschlussspalte (siehe Korrektur oben: die beiden Zustände sind getrennt).
**Schritte:** Timer-Start-Funktion auf diesem Todo aufrufen.
**Erwartetes Ergebnis:** Todo-Status wechselt zu „aktiv", Timer läuft. Die Tags des Todos bleiben
unverändert — die Rückkehr in den Pool ergibt sich allein daraus, dass die abgeleitete
Pool-Zugehörigkeit (A-3.4) das Todo nicht mehr als „erledigt" ausfiltert. Die Kanban-Spalte des
Todos bleibt ebenfalls unverändert, sofern ihre Achse „Erledigt" neutral steht (Querverweis
`TP-KANBAN-04`, Abschnitt 8, für die Spalte, die das ausdrücklich nicht tut).

### TP-TIMER-02 — Pool-Sichtbarkeit nach Wiederbelebung
**Anforderungen:** A-2.5, A-3.2, A-3.4
**Ebene:** Unit
**Vorbedingung:** Wie TP-TIMER-01, das Todo trägt ein Tag, das einen Pool definiert.
**Schritte:** Nach dem Timer-Start die Pool-Zugehörigkeits-Abfrage für dieses Todo auswerten.
**Erwartetes Ergebnis:** Das Todo erscheint wieder in der Ergebnismenge des Pools, ohne dass eine
gespeicherte Zuordnung manuell aktualisiert wurde. Das ist die vollständige Erfüllung von A-2.5:
eine Frage der Sichtbarkeit im Pool, kein Spaltenwechsel auf dem Kanban-Board.

### TP-TIMER-03 — Nur ein Timer gleichzeitig
**Anforderungen:** A-6.8
**Ebene:** Unit
**Vorbedingung:** Timer A läuft auf Todo 1.
**Schritte:** Timer B auf Todo 2 starten.
**Erwartetes Ergebnis:** Timer A wird gestoppt (nach Rückfrage, siehe TP-TIMER-07 für die
UI-Seite), es läuft nie mehr als ein Timer gleichzeitig.

### TP-TIMER-04 — Wiederbelebung von der Detailansicht aus
**Anforderungen:** A-2.5, A-6.8, I-05, S-03
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo existiert, liegt auf einer bestimmten Kanban-Spalte (nicht
notwendigerweise einer Abschlussspalte).
**Schritte:**
1. Todo anlegen.
2. Zeit über die Detailansicht (S-03) buchen (Timer starten und stoppen).
3. Todo als erledigt markieren, Kanban-Spalte notieren.
4. Timer erneut von der Detailansicht aus starten.
**Erwartetes Ergebnis:** „Erledigt" ist weg, das Todo ist aktiv, erscheint wieder in seinem
Pool. Der Timer läuft für dieses Todo. Die Kanban-Spalte ist nach Schritt 4 identisch mit der in
Schritt 3 notierten — weder das Erledigen noch das Wiederbeleben verschiebt die Karte.

### TP-TIMER-05 — Wiederbelebung von der Kanban-Karte aus
**Anforderungen:** A-2.5, A-5.6, A-6.8, I-05, S-04
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-TIMER-04, Todo ist zusätzlich auf dem Kanban-Board sichtbar.
**Schritte:** Wie TP-TIMER-04, aber Schritt 2 und 4 direkt über die Kanban-Karte statt über die
Detailansicht.
**Erwartetes Ergebnis:** Wie TP-TIMER-04. Zusätzlich: die Karte selbst zeigt den Zustandswechsel
(„Erledigt"-Kennzeichen verschwindet, Timer-Indikator aktiv auf der Karte), bleibt dabei aber in
derselben Spalte, in der sie vor dem Erledigen lag — nicht in einer Abschluss- oder sonst
automatisch zugewiesenen Spalte.

### TP-TIMER-06 — Wiederbelebung von der Zeiterfassungsansicht aus
**Anforderungen:** A-2.5, A-6.8, I-05, S-05
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-TIMER-04.
**Schritte:** Wie TP-TIMER-04, aber Schritt 2 und 4 direkt über die Time-Tracking-Ansicht (S-05).
**Erwartetes Ergebnis:** Wie TP-TIMER-04.

### TP-TIMER-07 — Start bei laufendem Timer stoppt den laufenden (UI-Seite)
**Anforderungen:** A-6.8
**Ebene:** End-to-End
**Vorbedingung:** Timer läuft auf Todo 1.
**Schritte:** Timer auf Todo 2 starten (von beliebiger Stelle, z. B. Kanban-Karte).
**Erwartetes Ergebnis:** Rückfrage erscheint, ob der laufende Timer gestoppt werden soll. Nach
Bestätigung: Timer 1 stoppt, seine Buchung wird mit korrekter Dauer gespeichert, Timer 2 startet
für Todo 2. Bei Abbruch der Rückfrage bleibt Timer 1 unverändert weiterlaufen und Timer 2 startet
nicht.

---

## 6. Tags und Ordner (A-4.1 bis A-4.6, A-3.4)

### TP-TAG-01 — Vier Ebenen tief anlegen (Unit)
**Anforderungen:** A-4.1, A-4.2, A-4.3
**Ebene:** Unit
**Vorbedingung:** Leere Tag-/Ordnerstruktur.
**Schritte:** Ordner → Unterordner → Unterordner → Unterordner → Tag anlegen (die Tiefe aus dem
Beispiel in A-4.3).
**Erwartetes Ergebnis:** Struktur wird angenommen, Tiefe ist nicht künstlich auf vier begrenzt
(A-4.3 „beliebig tief"). Ergänzender Fall: fünfte und sechste Ebene anlegen, ebenfalls
akzeptiert.

### TP-TAG-02 — Zyklusprüfung (Unit)
**Anforderungen:** A-4.6
**Ebene:** Unit
**Vorbedingung:** Struktur aus TP-TAG-01.
**Schritte:**
1. Versuchen, einen Ordner als seinen eigenen übergeordneten Ordner zu setzen.
2. Versuchen, einen Ordner unter einen seiner eigenen Nachfolger (z. B. Enkelordner) zu
   verschieben.
**Erwartetes Ergebnis:** Beide Versuche werden abgelehnt, mit verständlicher Fehlermeldung.
Struktur bleibt unverändert.

### TP-TAG-03 — Vier Ebenen tief, vollständiger Ablauf über die Oberfläche
**Anforderungen:** A-4.1 bis A-4.6, S-08
**Ebene:** End-to-End
**Vorbedingung:** Leere oder überschaubare Tag-/Ordnerstruktur in der Testumgebung.
**Schritte:**
1. Vier Ordnerebenen anlegen, jeweils benannt und navigierbar; einen Tag auf der untersten Ebene
   anlegen.
2. In die Struktur hinein- und wieder hinausnavigieren (Übersichtlichkeit gemäß A-4.4 prüfen:
   Breadcrumb oder Baumdarstellung zeigt den aktuellen Pfad).
3. Den Tag in einen anderen Ordner verschieben.
4. Einen ganzen Ordner (mit Inhalt) in einen anderen Elternordner verschieben.
5. Versuchen, einen Ordner in sich selbst bzw. in einen seiner Unterordner zu verschieben.
**Erwartetes Ergebnis:** Schritte 1–4 gelingen, die Struktur bleibt nach jedem Schritt korrekt
und navigierbar. Schritt 5 wird von der Oberfläche abgelehnt, mit einer verständlichen Meldung,
keine Datenkorruption.

**Befund (T-060, 2026-09-02), behoben in T-063 (2026-09-02).** War rot, beide Fälle in
`tests/e2e/tags-folders.spec.ts`. Ursache war keine Regression, sondern die inzwischen
abgeschlossene Umstellung des Auswahlfelds auf Ark UI (T-059): Das Ziel der Verschieben-Dialoge ist
ein `<button role="combobox">`, kein `<select>` mehr — `locator.selectOption()` scheiterte mit
„Element is not a `<select>` element". Ersatz: `getByRole('combobox', { name: … }).click()`, danach
`getByRole('option', { name: …, exact: true }).click()` — `exact: true`, weil die Beschriftung
jedes Ordner-Eintrags der volle Pfad ist (`folder.path.join(" / ")`) und ein Ordnername als
Teilstring auch in den Pfaden seiner eigenen Unterordner steckt; ohne `exact: true` träfe die Suche
nach einem Wurzelordner auch dessen Nachfahren. Bestanden, dreifach wiederholt, keine Wiederholung
gebraucht. Siehe `tests/e2e/tags-folders.spec.ts`.

### TP-TAG-04 — Pool-Zugehörigkeit folgt Tags (A-3.4)
**Anforderungen:** A-3.2, A-3.4
**Ebene:** End-to-End
**Vorbedingung:** Ein Pool ist über ein bestimmtes Tag definiert (S-11).
**Schritte:**
1. Ein Todo mit dem Pool-Tag versehen, Pool-Ansicht prüfen.
2. Das Tag vom Todo entfernen, Pool-Ansicht erneut prüfen.
**Erwartetes Ergebnis:** Nach Schritt 1 erscheint das Todo im Pool. Nach Schritt 2 verschwindet
es wieder, ohne manuelle Neuzuordnung — die Mitgliedschaft ist abgeleitet, nicht gespeichert.

### TP-TAG-05 — Tags an einem Todo hinzufügen und entfernen (I-06)
**Anforderungen:** A-2.3, I-06, S-03
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo mit mindestens einem Tag.
**Schritte:** Weiteres Tag hinzufügen, danach ein Tag wieder entfernen.
**Erwartetes Ergebnis:** Änderungen werden gespeichert und bleiben nach Neuladen erhalten;
abgeleitete Pool-Zugehörigkeit aktualisiert sich entsprechend (Querverweis TP-TAG-04).

### TP-TAG-06 — Todo-Pools konfigurieren (I-13)
**Anforderungen:** A-3.1, A-3.2, A-3.3, I-13, S-11
**Ebene:** End-to-End
**Vorbedingung:** Mindestens ein Tag existiert.
**Schritte:** In S-11 einen neuen Pool über ein Tag definieren, die Regel eines bestehenden
Pools ändern, einen Pool löschen.
**Erwartetes Ergebnis:** Änderungen wirken sich sofort auf die Pool-Zugehörigkeit betroffener
Todos aus (siehe TP-TAG-04). Löschen eines Pools entfernt nur die Pool-Definition, keine Todos
oder Tags.

---

## 7. Standard-Tags (A-9.1 bis A-9.5)

### TP-DTAG-01 — Standard-Tags greifen bei Anlage über die Oberfläche
**Anforderungen:** A-9.1, A-9.3, S-10, I-01
**Ebene:** End-to-End
**Vorbedingung:** In den Einstellungen (S-10) sind Standard-Tags konfiguriert, z. B. „Intern",
„Todo", „Nicht abgerechnet" (Beispielwerte aus A-9.2, in Fixtures durch gleichwertige erfundene
Werte ersetzt, falls Verwechslungsgefahr mit echten Firmenbegriffen besteht — hier unproblematisch,
da bereits Beispieltext der Spezifikation selbst).
**Schritte:** Neues Todo über die Hauptoberfläche anlegen, ohne Tags manuell zu setzen.
**Erwartetes Ergebnis:** Das neue Todo trägt automatisch genau die konfigurierten Standard-Tags.

### TP-DTAG-02 — Standard-Tags greifen bei Anlage über das Add-in
**Anforderungen:** A-9.3, A-9.5, S-12
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-DTAG-01, zusätzlich Add-in mit gültigem Token verbunden.
**Schritte:** Neues Todo aus dem Outlook-Add-in heraus anlegen.
**Erwartetes Ergebnis:** Dieselben Standard-Tags sind gesetzt wie bei Anlage über die
Hauptoberfläche. Kein Unterschied im Ergebnis je nach Entstehungsweg.

### TP-DTAG-03 — Änderung der Standard-Tags wirkt auf künftige Todos
**Anforderungen:** A-9.4
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-DTAG-01.
**Schritte:** Standard-Tags in S-10 ändern (ein Tag entfernen, ein anderes hinzufügen). Neues
Todo anlegen.
**Erwartetes Ergebnis:** Das neue Todo trägt die aktualisierte Menge an Standard-Tags, nicht die
alte. Bereits bestehende Todos werden durch die Einstellungsänderung nicht rückwirkend verändert.

### TP-DTAG-04 — Domänenregel (Unit)
**Anforderungen:** A-9.1, A-9.3, A-9.5
**Ebene:** Unit
**Vorbedingung:** Funktion zur Todo-Erzeugung nimmt die aktuelle Standard-Tag-Konfiguration als
Parameter oder liest sie aus einer injizierten Einstellungsquelle.
**Schritte:** Todo-Erzeugungsfunktion mit verschiedenen Standard-Tag-Konfigurationen aufrufen,
unabhängig vom Entstehungsweg (Hauptanwendung oder Add-in rufen dieselbe Funktion auf).
**Erwartetes Ergebnis:** Ergebnis-Todo trägt exakt die übergebene Menge an Standard-Tags. Es
gibt in der Fachlogik nur einen Erzeugungspfad, den beide Oberflächen nutzen — das ist die
Voraussetzung dafür, dass TP-DTAG-01 und TP-DTAG-02 dasselbe Ergebnis liefern können.

---

## 8. Kanban (A-5.1, A-5.3 bis A-5.6, E-054, E-055)

**Vollständig neu geschrieben in T-081.** Bis T-080 beschrieb dieser Abschnitt ein Kanban-Board,
das es seit E-054 nicht mehr gibt: feste Statusspalten, Karten per Drag & Drop verschoben,
Spalten in einem Dialog „Statusspalten" verwaltet. **A-5.2 und I-14 sind aufgehoben** — eine Regel
lässt sich nicht durch Verschieben umkehren, ohne dass die Anwendung selbst Tags setzt, und genau
das hat der Auftraggeber ausgeschlossen (`decisions.md`, E-054). Die frühere Fassung dieses
Abschnitts prüfte diese Bedienung trotzdem weiter — ein Testfall, der grün blieb, obwohl er nichts
mehr maß, das schlimmere Ergebnis als gar kein Test (Bericht `T-081-e2e-tester.md`).

**Was seit E-054/E-055 gilt.** Eine Kanban-Spalte ist eine **Regel über Tags**, dieselbe Entität
wie ein Pool (A-3.2, A-3.4); `placement` sagt, ob eine Regel im Pool-Bereich, auf dem Board oder
an beiden Stellen erscheint. Seit E-055 ist die Regel eine Struktur mit fünf benannten Achsen,
nicht eine Liste von Termen:

| Achse | Wirkung | Neutralwert |
|---|---|---|
| Erforderliche Tags | alle bzw. mindestens eines müssen vorhanden sein (`matchMode`) | keiner genannt |
| Ausgeschlossene Tags | keiner davon darf vorhanden sein | keiner genannt |
| Status | einer der genannten Statuswerte | „Alle" |
| Erledigt | nur erledigte / nur unerledigte | „Alle" |
| Exportstatus | mindestens eine offene / mindestens eine exportierte Buchung | „Alle" |

Zwischen den Achsen gilt „und"; eine Regel, in der jede Achse neutral steht, trifft **nichts**,
nicht alles (A-3.4) — das ist der Zustand unmittelbar nach dem Anlegen einer Spalte. Daraus folgt,
was diese vier Testfälle prüfen: Zugehörigkeit ist eine berechnete Antwort auf eine Regel, keine
gespeicherte Position, und die Oberfläche muss das an drei Stellen ehrlich zeigen — eine Karte kann
in mehreren Spalten zugleich stehen, eine Spalte ohne Bedingung ist etwas anderes als eine Spalte
mit Bedingung ohne Treffer, und der einzige noch verbliebene Weg, wie eine Karte ohne
Tag-Änderung die Spalte wechselt, ist ein Timerstart, der „Erledigt" aufhebt.

### TP-KANBAN-01 — Zugehörigkeit folgt der Regel, nicht der Ablage
**Anforderungen:** A-3.4, A-5.1, A-5.3, E-054, E-055
**Ebene:** End-to-End (`tests/e2e/kanban.spec.ts`)
**Vorbedingung:** Ein Tag existiert; ein Todo existiert, trägt dieses Tag zunächst **nicht**.
**Schritte:**
1. Über die Oberfläche eine Board-Spalte anlegen, deren einzige Bedingung das Tag verlangt
   („Spalten verwalten" → „Neue Spalte anlegen" → Regelformular, nicht über die API).
2. Board betrachten: Spalte vorhanden, Karte fehlt, Leerzustand nennt eine gestellte, aber
   unerfüllte Bedingung.
3. Über die Todo-Liste (Menü „Bearbeiten") das Tag am Todo ergänzen und speichern.
4. Board erneut betrachten.
5. Über dieselbe Bedienung das Tag wieder entfernen und speichern.
6. Board ein drittes Mal betrachten.
**Erwartetes Ergebnis:** Nach Schritt 2 zeigt die Spalte „Keine Karte trifft diese Regel" (nicht
„keine Bedingung"). Nach Schritt 4 steht die Karte in der Spalte, ohne dass irgendetwas an der
Regel selbst geändert wurde. Nach Schritt 6 ist sie wieder verschwunden, und der ursprüngliche
Leerzustand steht wieder da. Jede Änderung, die Zugehörigkeit herstellt oder aufhebt, geschieht an
den **Tags des Todos**, nie an der Spalte — die Falle, die dieser Auftrag ausdrücklich benennt,
ist ein Testaufbau, der Spalten an der Datenbank vorbei anlegt; dieser Fall tut es nicht.

### TP-KANBAN-02 — Eine Karte in mehreren Spalten zugleich
**Anforderungen:** A-5.1, A-5.3, E-054
**Ebene:** End-to-End (`tests/e2e/kanban.spec.ts`)
**Vorbedingung:** Zwei Tags; ein Todo, das **beide** trägt.
**Schritte:**
1. Über die Oberfläche zwei Board-Spalten anlegen, jede mit genau einem der beiden Tags als
   einziger Bedingung.
2. Board betrachten.
3. Auf das Etikett „Steht auch in …" einer der beiden Kartenvorkommen klicken.
4. Ein zweites Mal klicken.
**Erwartetes Ergebnis:** Die Karte erscheint in **beiden** Spalten, jedes Vorkommen trägt das
Etikett „Steht auch in …" mit dem Namen der jeweils anderen Spalte. Nach Schritt 3 tragen **beide**
Vorkommen die Hervorhebung, und eine Anwendungsmeldung (Live-Region) nennt Titel und beide
Spaltennamen. Nach Schritt 4 ist die Hervorhebung an beiden Vorkommen wieder weg. Das ist der Fall,
der vor E-054 unmöglich war (bei einem Statuswert trug ein Todo genau einen) und den der
unit-tester in T-077 bereits auf der SQL-Seite mit vier Karten über sechs Spalten gemessen hat; an
dieser Stelle wird dieselbe Mehrfachnennung erstmals durch die Oberfläche gemessen.

### TP-KANBAN-03 — Eine Spalte ohne Bedingung ist kein „keine Treffer"
**Anforderungen:** A-3.4, E-055
**Ebene:** End-to-End (`tests/e2e/kanban.spec.ts`)
**Vorbedingung:** Keine.
**Schritte:** Über die Oberfläche eine Board-Spalte anlegen, ohne irgendeine der fünf Achsen zu
belegen — nur der Name wird ausgefüllt. Anlegen bestätigen.
**Erwartetes Ergebnis:** Anlegen ist möglich (seit T-079 nicht mehr gesperrt); die
Erfolgsmeldung ist ausdrücklich ein Warnton und sagt, dass die Spalte „noch keine Bedingung"
nennt. Unter dem Spaltenkopf steht „Ohne Bedingung — diese Spalte bleibt leer." Der Leerzustand in
der Spalte selbst trägt ein Warndreieck, die Überschrift „Diese Spalte hat noch keine Bedingung"
und den primären Knopf „Bedingung ergänzen" — **nicht** dieselbe Formulierung wie bei einer Spalte
mit Bedingung, die nur zufällig gerade nichts trifft (TP-KANBAN-01, Schritt 2). Der Knopf
„Bedingung ergänzen" öffnet tatsächlich das Regelformular dieser Spalte.

### TP-KANBAN-04 — Timer auf erledigter Karte hebt „Erledigt" auf und ändert dadurch die Spaltenzugehörigkeit
**Anforderungen:** A-2.5, A-5.6, E-054, E-055, I-05
**Ebene:** End-to-End (`tests/e2e/kanban.spec.ts`)
**Vorbedingung:** Ein Tag existiert; ein erledigtes Todo trägt es.
**Schritte:**
1. Über die Oberfläche zwei Board-Spalten anlegen, beide mit demselben Tag als Bedingung, eine
   zusätzlich mit der Achse „Erledigt" auf „Erledigt", die andere auf „Unerledigt".
2. Board betrachten.
3. Auf der Karte in der „Erledigt"-Spalte direkt den Timer starten — ohne die Detailansicht zu
   öffnen.
4. Board erneut betrachten.
5. Timer über dieselbe Karte wieder stoppen.
**Erwartetes Ergebnis:** Vor Schritt 3 steht die Karte ausschließlich in der „Erledigt"-Spalte,
unabhängig vom Schalter „Erledigte einblenden" — eine Regel, die selbst etwas über „Erledigt"
sagt, hat das letzte Wort (T-076). Der Klick auf den Timer-Knopf hebt „Erledigt" automatisch auf
(A-2.5); danach steht dieselbe Karte in der „Unerledigt"-Spalte und **nicht mehr** in der
„Erledigt"-Spalte, ohne dass irgendjemand ihre Tags oder eine Regel angefasst hat. Das ist der
**einzige** Weg, auf dem eine Karte heute noch ohne Regel- oder Tag-Änderung die Spalte wechselt
(siehe Abschnitt 5, Nachtrag T-081). Nach dem Stoppen entsteht eine Zeitbuchung mit plausibler
Dauer. Dieser Fall schließt zugleich das frühere `TP-KANBAN-04` (Timer direkt von der Karte
starten/stoppen, A-5.6) ein — eine Karte ohne jede reale Spalte konnte diese Bedienung gar nicht
sinnvoll prüfen, siehe Vorbedingung oben.

**Aufgegangen in TP-KANBAN-04, nicht mehr eigenständig geführt:** die früheren `TP-KANBAN-05` und
`TP-KANBAN-06` aus T-016 („Erledigt und Kanban-Spalte sind unabhängige Zustände"). Beide setzten
ein manuelles Verschieben zwischen Spalten voraus, das es seit E-054 nicht mehr gibt; ihre
fachliche Aussage — eine Spalte, die zur Achse „Erledigt" neutral steht, ändert sich durch Setzen
oder Aufheben von „Erledigt" nicht — ist weiterhin durch `TP-TIMER-04` bis `TP-TIMER-06`
(Abschnitt 5) geprüft, die ausschließlich neutrale Spalten voraussetzen.

**TP-KANBAN-05 — Todo direkt vom Board aus öffnen und bearbeiten** (vormals TP-KANBAN-03,
A-5.5): durch E-054/E-055 unberührt — das Öffnen einer Karte zur Detailansicht ist keine
Bedienung, die sich an der Spaltendefinition ändert. **Noch nicht als eigene Datei unter
`tests/e2e/**` automatisiert** (weder vor noch nach T-081); nicht Gegenstand dieses Auftrags.

---

## 9. Export von Anfang bis Ende (A-8.1 bis A-8.6, A-8.8, A-8.9, E-011)

### TP-EXPORT-01 — Vollständiger Export, Standardvorlage
**Anforderungen:** A-8.1, A-8.2, A-8.3, A-8.4, A-8.5, A-8.9, E-008, E-010, E-011, E-020
**Ebene:** End-to-End
**Vorbedingung:** Mindestens vier offene Buchungen auf mindestens vier erfundenen Todos — je
Todo genau eine Buchung an einem eigenen Kalendertag, damit die Gruppierung aus E-020 hier keine
Buchungen zusammenfasst und jede Exportzeile weiterhin einer einzelnen, isoliert prüfbaren
Buchung entspricht. Darunter ausdrücklich: eine Buchung mit 16 Minuten Dauer (Unterscheidungsfall
aus Abschnitt 1), eine mit Leistungstext mit Umlauten und Zeilenumbruch, eine mit leerer
Leistung, eine mit gesetzter `callNumber` und eine ohne. Exportordner ist konfiguriert und
beschreibbar. Testumgebung stubbt den Systembenutzernamen auf einen erfundenen Wert (z. B.
„t.beispiel"), liest ihn nie vom echten Betriebssystem. Die Gruppierung selbst — mehrere
Buchungen desselben Todos am selben Tag zu einer Zeile — ist nicht Gegenstand dieses Falls,
sondern von Abschnitt 9a.
**Schritte:**
1. Export-Ansicht (S-07) öffnen, Standardvorlage auswählen (ist vorausgewählt, da Standard).
2. Export ausführen.
3. Erzeugte JSON-Datei öffnen und strukturell prüfen.
**Erwartetes Ergebnis:**
- Datei enthält genau die Schlüssel `Call`, `Zeit`, `Notiz`, `WindowsUser` je Buchung, keine
  zusätzlichen oder fehlenden Schlüssel.
- `Zeit` folgt der Rundungstabelle aus Abschnitt 1, insbesondere ist die 16-Minuten-Buchung mit
  `0.5` vertreten.
- `Notiz` ist gültiges Base64, dekodiert exakt zum ursprünglichen UTF-8-Leistungstext (auch für
  die leere Leistung: dekodiert zu einem leeren String). Da je Todo hier nur eine Buchung an
  ihrem Tag existiert, ist der zusammengeführte Text aus E-020 in diesem Fall identisch mit dem
  Text der Einzelbuchung — die eigentliche Zusammenführung mehrerer Texte prüft `TP-EXPORT-16`.
- `Call` entspricht der `callNumber` der jeweiligen Todos bzw. ist gemäß Vorlage weggelassen,
  wenn keine Nummer vorhanden ist und die Vorlage das zulässt (A-2.6).
- `WindowsUser` entspricht dem gestubbten Testbenutzernamen, nicht einem echten Wert.
- Die Datei liegt im konfigurierten Exportordner (E-011), nirgends sonst.

### TP-EXPORT-02 — Exportstatus nach dem Export
**Anforderungen:** A-6.5, A-8.1
**Ebene:** End-to-End
**Vorbedingung:** TP-EXPORT-01 durchgeführt; zusätzlich mindestens eine Buchung, die absichtlich
nicht in den Export einbezogen wurde (z. B. weil nach dem Export angelegt oder durch Filter
ausgeschlossen).
**Schritte:** Status aller beteiligten Buchungen in der Übersicht (S-06) prüfen.
**Erwartetes Ergebnis:** Alle exportierten Buchungen zeigen „exportiert". Die nicht einbezogene
Buchung zeigt weiterhin „offen".

### TP-EXPORT-03 — Zweiter Export ohne neue Buchungen
**Anforderungen:** A-8.1
**Ebene:** End-to-End
**Vorbedingung:** Nach TP-EXPORT-02, keine neuen offenen Buchungen außer der bewusst
ausgeschlossenen.
**Schritte:** Export erneut ausführen.
**Erwartetes Ergebnis:** Die bereits exportierten Buchungen aus TP-EXPORT-01 tauchen in keiner
neu erzeugten Datei wieder auf. Nur die zuvor ausgeschlossene, weiterhin offene Buchung würde in
einem neuen Export erscheinen.

### TP-EXPORT-04 — Fehlender Exportordner
**Anforderungen:** E-011, R-11
**Ebene:** End-to-End
**Vorbedingung:** Exportordner in den Einstellungen auf einen nicht existierenden Pfad gesetzt.
**Schritte:** Export mit mindestens einer offenen Buchung ausführen.
**Erwartetes Ergebnis:** Verständliche, deutschsprachige Fehlermeldung, kein Absturz, keine
Buchung wird als exportiert markiert (Konsistenz mit A-8.8).

### TP-EXPORT-05 — Schreibgeschützter Exportordner
**Anforderungen:** E-011, R-11
**Ebene:** End-to-End
**Vorbedingung:** Exportordner existiert, ist aber ohne Schreibrecht für den ausführenden
Prozess (z. B. Testverzeichnis mit entzogenen Schreibrechten).
**Schritte:** Export mit mindestens einer offenen Buchung ausführen.
**Erwartetes Ergebnis:** Wie TP-EXPORT-04: verständliche Meldung, kein Absturz, kein
teilweiser Export, keine Buchung wechselt den Status.

### TP-EXPORT-06 — Strukturprüfung unterhalb der Oberfläche
**Anforderungen:** A-8.1 bis A-8.5
**Ebene:** Integration
**Vorbedingung:** Export-Engine direkt ansprechbar (ohne Browser), echte Buchungsdaten in
SQLite-Testdatenbank.
**Schritte:** Export-Funktion direkt aufrufen, Ergebnis-JSON prüfen.
**Erwartetes Ergebnis:** Gleiche strukturellen Zusicherungen wie TP-EXPORT-01, aber ohne
UI-Overhead — dient als schnellere, CI-taugliche Basisprüfung, bevor die vollständige
End-to-End-Variante läuft.

### TP-EXPORT-07 — Vorschau und Datei nutzen denselben Renderer, programmatisch (neu in T-016, R-17)
**Anforderungen:** A-8.6, A-8.7, R-17
**Ebene:** Integration
**Vorbedingung:** Die Vorschaufunktion (genutzt von S-07 und S-14) und die tatsächliche
Export-Schreibfunktion sind beide direkt ansprechbar, ohne Browser.
**Schritte:**
1. Dieselben offenen Buchungen und dieselbe Vorlage (einmal Standardvorlage, einmal eine
   abweichende Vorlage aus `TP-TPL-01`) einmal an die Vorschaufunktion, einmal an die tatsächliche
   Export-Schreibfunktion übergeben.
2. Das Vorschau-Ergebnis (Datenstruktur, nicht Bildschirmdarstellung) Feld für Feld mit dem
   Inhalt der geschriebenen Datei vergleichen.
**Erwartetes Ergebnis:** Beide Ergebnisse sind inhaltlich identisch — gleiche Feldnamen, gleiche
Werte, gleiche Transformationen, gleiche Reihenfolge. Eine Abweichung wäre der Beleg, dass
Vorschau und Export zwei getrennte Codepfade sind, was R-17 ausdrücklich als Fehlzustand benennt.

### TP-EXPORT-08 — Vorschau und Datei stimmen überein, sichtbar in S-07 und S-14 (neu in T-016, R-17)
**Anforderungen:** A-8.6, A-8.7, R-17
**Ebene:** End-to-End
**Vorbedingung:** Offene Testbuchungen vorhanden, Zugriff auf S-07 und S-14.
**Schritte:**
1. In S-07 die Live-Vorschau mit der Standardvorlage öffnen, die angezeigten Werte je Buchung
   notieren.
2. Export tatsächlich ausführen, die erzeugte Datei öffnen.
3. In S-14 eine abweichende Vorlage öffnen (z. B. aus `TP-TPL-01`), deren Live-Vorschau auf
   denselben (inzwischen neuen, noch offenen) Testbuchungen betrachten, die angezeigten Werte
   notieren.
4. Export mit dieser abweichenden Vorlage ausführen, die erzeugte Datei öffnen.
**Erwartetes Ergebnis:** In beiden Fällen (Schritt 1/2 für S-07, Schritt 3/4 für S-14) stimmen die
in der Vorschau angezeigten Werte exakt mit den in der jeweiligen Datei geschriebenen Werten
überein, Feld für Feld. Das ist die End-to-End-Ergänzung zu `TP-EXPORT-07`: Dort wird die
Renderer-Identität programmatisch belegt, hier wird sie in beiden Oberflächen sichtbar bestätigt.

### TP-EXPORT-09 — Rundungsmodus wird je Exportlauf protokolliert (neu in T-016, E-008)
**Anforderungen:** E-008
**Ebene:** Integration
**Vorbedingung:** Export-Verlauf (Ort 14 aus `TP-EXPST-09`) existiert und ist auslesbar.
**Schritte:**
1. Export im Modus `aufrunden` ausführen.
2. Rundungsmodus in den Einstellungen auf `kaufmaennisch` umstellen (siehe `TP-ROUND-16`).
3. Export erneut mit neuen offenen Buchungen ausführen.
**Erwartetes Ergebnis:** Jeder Eintrag im Export-Verlauf trägt den zum Zeitpunkt des jeweiligen
Laufs aktiven Rundungsmodus. Die beiden Läufe aus Schritt 1 und 3 unterscheiden sich sichtbar in
diesem Feld; ein späterer Wechsel des Einstellungswerts ändert die bereits protokollierten
früheren Läufe nicht rückwirkend.

### TP-EXPORT-10 — Ablageorte unter dem lokalen Datenverzeichnis, nicht unter Roaming (E-018)
**Anforderungen:** E-018, R-13
**Ebene:** End-to-End
**Vorbedingung:** Frische Installation ohne bestehende Konfiguration. Testumgebung mit
kontrollierbaren Pfaden für `%LOCALAPPDATA%`/`%APPDATA%` (Windows) bzw. `~/.local/share`,
`~/.config` (Linux) — das setzt einen tatsächlich laufenden Tauri-Prozess bzw. Sidecar voraus
(T-008) und ist ohne diesen **nicht prüfbar formuliert**, nur als reiner Unit-Mock auf eine
Pfad-Konstante, was die eigentliche Zusicherung (wo das Betriebssystem tatsächlich schreibt)
nicht abdeckt.
**Schritte:**
1. Anwendung/Sidecar erstmalig starten, tatsächlichen Pfad der erzeugten SQLite-Datei ermitteln.
2. Vorgabewert des Exportordners in den Einstellungen (S-09) ablesen, ohne ihn manuell gesetzt zu
   haben.
**Erwartetes Ergebnis:** Die SQLite-Datei liegt unter `%LOCALAPPDATA%\Takt\` (Windows) bzw.
`~/.local/share/takt/` (Linux), nicht unter `%APPDATA%` oder einem vergleichbaren
Roaming-Pfad. Die Vorgabe des Exportordners liegt ebenfalls dort, nicht unter Desktop oder
Dokumente (beide potenziell OneDrive-umgeleitet).

---

## 9a. Gruppierung je Todo und Tag (E-020, Nachtrag während T-016)

**Hintergrund.** Der Auftraggeber hat am 2026-08-31 entschieden: Alle noch offenen Buchungen
desselben Todos am selben Kalendertag werden addiert, dann wird die Summe aufgerundet (Regel wie
in Abschnitt 1, unverändert). Ergebnis ist eine Exportzeile je Todo und Tag, nicht je Buchung.
Diese Entscheidung traf ein, nachdem Abschnitt 1 und Abschnitt 9 bereits geschrieben waren — sie
sind oben nachgezogen, dieser Abschnitt deckt die Gruppierung selbst ab: die Bildung der Gruppen,
ihr Zusammenspiel mit dem Exportstatus (R-10 wird dadurch schärfer, siehe `TP-EXPORT-17`), sowie
die zugehörige Mitternachts- und Trennzeichen-Regel. Alle drei ursprünglichen Folgefragen aus
E-020 sind während T-016 beantwortet worden (`TP-EXPORT-15`, `TP-EXPORT-16`/`-16a`/`-16b`); offen
ist nur noch der Sonderfall, in dem alle Segmente einer Tagesgruppe leer sind (`TP-EXPORT-16c`),
weil er von einer Eigenschaft des Abrechnungstools abhängt, die noch niemand geklärt hat.

**Gemeinsame Vorbedingung (soweit nicht abweichend angegeben):** Export-Engine direkt ansprechbar
oder über S-07, mit einer konfigurierbaren „aktuellen Zeit" bzw. mit Buchungen, deren Start- und
Endzeiten im Test gezielt gesetzt werden (siehe die Konvention gegen Datumsdrift im Abschnitt
„Testdaten-Konventionen" am Kopf dieses Dokuments).

### TP-EXPORT-11 — Mehrere Buchungen, ein Todo, ein Tag: eine Zeile, Summe gerundet
**Anforderungen:** A-8.1, A-8.3, E-008, E-020
**Ebene:** Integration
**Vorbedingung:** Ein erfundenes Todo (z. B. „Call 4711", passend zum vom Auftraggeber
bestätigten Beispiel), drei offene Buchungen an diesem Todo am selben Kalendertag mit 10, 20 und
5 Minuten Dauer, jede mit einem eigenen, unterscheidbaren Leistungstext.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Die Ausgabedatei enthält genau **eine** Zeile für dieses Todo und diesen
Tag. `Zeit` ist `0.75` (35 Minuten aufgerundet auf die nächste Viertelstunde) — exakt der vom
Auftraggeber bestätigte Beispielwert, nicht die Summe dreier einzeln gerundeter Werte
(0,25 + 0,50 + 0,25 = 1,00, das falsche Ergebnis der alten, jetzt abgelösten Regel aus E-020).
`Notiz` dekodiert zum zusammengeführten Text aller drei Leistungen (Reihenfolge siehe
`TP-EXPORT-16`).

### TP-EXPORT-12 — Dasselbe Todo, verschiedene Tage: getrennte Zeilen
**Anforderungen:** A-8.1, E-020
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit zwei offenen Buchungen an zwei unterschiedlichen Kalendertagen.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Zwei getrennte Exportzeilen für dasselbe Todo, je Tag eine, jede mit der
für ihren Tag korrekt gerundeten Summe. Keine Vermischung über Tagesgrenzen hinweg.

### TP-EXPORT-13 — Verschiedene Todos, derselbe Tag: getrennte Zeilen
**Anforderungen:** A-8.1, E-020
**Ebene:** Integration
**Vorbedingung:** Zwei verschiedene Todos mit je einer offenen Buchung am selben Kalendertag.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Zwei getrennte Exportzeilen, eine je Todo. Keine Zusammenführung über
Todo-Grenzen hinweg, nur weil der Tag identisch ist.

### TP-EXPORT-14 — Gemischter Exportstatus innerhalb einer Tagesgruppe (kritisch, R-10)
**Anforderungen:** A-6.5, A-8.1, E-020, R-10
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit drei Buchungen am selben Kalendertag; eine davon ist bereits als
„exportiert" markiert (aus einem früheren Lauf), die beiden anderen sind offen.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Die exportierte Buchung fließt **nicht** in die Summe der neuen
Exportzeile ein und wird nicht erneut ausgegeben. Die neue Zeile enthält ausschließlich die Summe
und den zusammengeführten Leistungstext der beiden noch offenen Buchungen. Dies ist der Fall, in
dem eine Umsetzung, die den Exportstatus beim Summieren übersieht, stillschweigend doppelt
abrechnen würde — die bereits abgerechnete Buchung würde ein zweites Mal in eine Summe
einfließen. Ergänzend siehe `TP-EXPORT-17` für die umgekehrte Richtung (Zurücksetzen einer
bereits exportierten Buchung innerhalb einer Gruppe).

### TP-EXPORT-15 — Buchung über Mitternacht: der Starttag zählt vollständig (entschieden)
**Anforderungen:** E-020
**Ebene:** Integration
**Vorbedingung:** Eine Buchung, deren Startzeit vor Mitternacht und deren Endzeit nach Mitternacht
liegt (z. B. Start 23:40, Ende 00:20 des Folgetags), auf einem Todo, das an ihrem Starttag sonst
keine weitere Buchung hat.
**Schritte:** Export ausführen, prüfen, welcher Tagesgruppe die mitternachtsüberschreitende
Buchung zugeordnet wird.
**Erwartetes Ergebnis:** Die Buchung zählt **vollständig zu ihrem Starttag** — dem Tag, an dem der
Timer gestartet wurde, nicht dem Tag, an dem er gestoppt wurde. Sie wird **nicht gesplittet** und
nicht anteilig dem Folgetag zugerechnet; ihre volle Dauer (hier 40 Minuten) fließt in die Summe
der Starttag-Gruppe ein. Die Regel ist verbindlich, nicht mehr offen.

### TP-EXPORT-15a — Zwei Buchungen knapp vor und knapp nach Mitternacht: zwei getrennte Gruppen
**Anforderungen:** E-020
**Ebene:** Integration
**Vorbedingung:** Dasselbe Todo, zwei Buchungen: eine startet um 23:50 des Tages X, die andere um
00:10 des Folgetags X+1 — nur zwanzig Minuten auseinander, aber auf verschiedenen Kalendertagen.
**Schritte:** Export ausführen.
**Erwartetes Ergebnis:** Zwei getrennte Exportzeilen für dasselbe Todo, eine für Tag X und eine
für Tag X+1 — trotz des geringen zeitlichen Abstands zwischen den beiden Buchungen. Die Regel aus
`TP-EXPORT-15` (Starttag zählt) gilt konsistent auch hier: keine Zusammenlegung über die
Kalendergrenze hinweg, obwohl beide Buchungen „an einem Abend" wirken.

### TP-EXPORT-16 — Zusammenführung der Leistungstexte: Randnormalisierung, Trennung mit „; ", leere Segmente übersprungen (entschieden, kein Escaping)
**Anforderungen:** A-7.4, A-8.4, E-020
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit drei offenen Buchungen am selben Tag, mit unterschiedlichen
Startzeiten nicht in chronologischer Anlagereihenfolge (z. B. zuerst angelegt: 14:00, dann 09:00,
dann 11:30), eine davon mit leerem Leistungstext.
**Schritte:** Export ausführen, `Notiz`-Feld base64-dekodieren.
**Erwartetes Ergebnis:** Jedes Segment wird vor dem Zusammenführen ausschließlich an den Rändern
normalisiert: führende und abschließende Leerzeichen entfernt, ein abschließendes Semikolon oder
ein abschließender Punkt entfernt. Der restliche Textinhalt bleibt **unverändert** — kein
Escaping, keine Ersetzung, keine Kürzung (A-7.4 verlangt, dass die Leistung übertragen wird, nicht
dass sie umgeschrieben wird). Die verbleibenden, nicht leeren Segmente erscheinen im
zusammengeführten Text in der Reihenfolge ihrer **Startzeit** (09:00, dann 14:00), nicht in
Anlage- oder Speicherreihenfolge, verbunden durch **„; "** (Semikolon plus Leerzeichen). Das
Segment mit leerem Leistungstext wird vollständig übersprungen — kein leerer Abschnitt, kein
doppeltes oder führendes/nachgestelltes Trennzeichen an seiner Stelle. Base64 wird auf den
bereits zusammengeführten Text angewandt, nicht je Einzeltext — derselbe Punkt, den R-18 und
`TP-NOTE-02` für die Notiz-Trennung ausdrücklich mitprüfen.

**Herkunft dieser Festlegung.** Trennzeichen „; " und Randnormalisierung sind **keine
Auftraggeber-Entscheidung** — sie stehen nicht in `docs/decisions.md` mit einem
Auftraggeber-Zitat, sondern sind eine Festlegung des Orchestrators während T-016. Das gilt
ausdrücklich auch für den Verzicht auf jedes Escaping (Punkt 1 unten): „Der Leistungstext wird
beim Export nicht verändert. Was der Benutzer geschrieben hat, geht so zum Kunden." Das ist hier
vermerkt, damit domain-dev und unit-tester wissen, dass dies eine Umsetzungskonvention ist, keine
bestätigte Kundenanforderung, und leichter revidierbar als eine Auftraggeber-Entscheidung.

### TP-EXPORT-16a — Randnormalisierung an Segmenträndern, kein Rückparsen, kein Escaping
**Anforderungen:** A-7.4, A-8.4, E-020
**Ebene:** Integration
**Gemeinsame Vorbedingung:** Ein Todo mit zwei offenen Buchungen am selben Tag; die Buchung um
10:00 trägt immer den festen Leistungstext „Test"; die Buchung um 09:00 trägt den Text aus der
Tabelle. Export ausführen, `Notiz`-Feld base64-dekodieren, mit dem Tabellenwert vergleichen.

| ID | Text der 09:00-Buchung (roh, unverändert eingegeben) | Erwarteter zusammengeführter Text |
|---|---|---|
| TP-EXPORT-16a-1 | `Analyse gemacht; Fix eingespielt` (Semikolon in der Mitte) | `Analyse gemacht; Fix eingespielt; Test` — der Text bleibt unverändert, kein Escaping des mittleren Semikolons, auch wenn dadurch nicht mehr eindeutig rückverfolgbar ist, wo ein Segment endet. |
| TP-EXPORT-16a-2 | `Rückruf erledigt;` (endet auf Semikolon) | `Rückruf erledigt; Test` — das abschließende Semikolon entfällt bei der Randnormalisierung, es entsteht kein `;;`. |
| TP-EXPORT-16a-3 | `Rückruf erledigt.` (endet auf Punkt) | `Rückruf erledigt; Test` — der abschließende Punkt entfällt, es entsteht kein `.; `. |
| TP-EXPORT-16a-4 | `   ` (nur Leerzeichen) | `Test` — als leeres Segment behandelt und vollständig übersprungen, kein führendes Trennzeichen. |

**Erwartetes Ergebnis:** siehe Tabelle je Zeile, exakter Textvergleich nach der Base64-Dekodierung.
Kein Testfall dieses Dokuments versucht, aus dem zusammengeführten Text die ursprünglichen
Segmente zurückzugewinnen (kein Rückparsen) — die Zuordnung, welche Buchungen zu welcher
Exportzeile gehören, lebt in `export_run_entry`, nicht im Text (E-020, Konsequenzen). Ein Test,
der auf ein eindeutiges Rückparsen angewiesen wäre, wäre falsch angelegt und ist hier bewusst
nicht enthalten.

### TP-EXPORT-16b — Tagesgruppe mit genau einer Buchung: kein Trennzeichen, nur Randnormalisierung
**Anforderungen:** A-7.4, E-020
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit genau einer offenen Buchung an ihrem Tag, Leistungstext mit
umschließenden Leerzeichen und einem abschließenden Punkt (z. B. `"  Kunde zurückgerufen.  "`).
**Schritte:** Export ausführen, `Notiz`-Feld dekodieren.
**Erwartetes Ergebnis:** Der Text lautet `Kunde zurückgerufen` — Randnormalisierung greift auch
bei nur einem Segment, aber es wird kein Trennzeichen eingefügt, weil kein zweites Segment
existiert.

### TP-EXPORT-16c — Tagesgruppe, in der alle Segmente leer sind (offene Frage)
**Anforderungen:** A-7.4, E-020
**Ebene:** Integration
**Vorbedingung:** Ein Todo mit zwei offenen Buchungen am selben Tag, beide mit leerem
Leistungstext.
**Schritte:** Export ausführen, `Notiz`-Feld betrachten.
**Erwartetes Ergebnis:** **Nicht abschließend festgelegt.** Der Orchestrator hat diesen Fall
ausdrücklich offengelassen: „Er hängt daran, ob das Abrechnungstool eine leere Notiz annimmt, und
das weiß ich nicht." Denkbare Ergebnisse sind ein leerer String nach Base64-Kodierung (analog zur
Einzelbuchungs-Regel aus `TP-EXPORT-01`) oder ein anderer Umgang mit dem Feld insgesamt. Dieser
Fall hält die Testdaten bereit, ohne eine Erwartung zu erfinden, die niemand bestätigt hat. **Nicht
prüfbar mit einer festen Erwartung, solange das nicht geklärt ist.**

### TP-EXPORT-16d — Vorschau zeigt dieselben Segmentgrenzen wie der Export (R-17)
**Anforderungen:** A-8.6, A-8.7, R-17, E-020
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo mit drei offenen Buchungen an einem Tag, drei unterschiedliche
Leistungstexte. Zugriff auf S-07 und S-14.
**Schritte:**
1. Live-Vorschau in S-07 öffnen; die dort dargestellten Segmentgrenzen (z. B. als sichtbar
   getrennte Zeilen oder Aufzählung je Buchung, nicht als ein einziger verschmolzener Block)
   notieren.
2. Dasselbe in S-14 mit einer die Leistung exportierenden abweichenden Vorlage wiederholen.
3. Export ausführen, den tatsächlich zusammengeführten Text (nach Randnormalisierung gemäß
   `TP-EXPORT-16`) mit den in Schritt 1 und 2 gezeigten Segmenten abgleichen.
**Erwartetes Ergebnis:** Beide Vorschauen (S-07 und S-14) stellen die Segmente sichtbar getrennt
dar — Takt kennt die Grenzen zwischen den Buchungen, auch wenn der exportierte Text sie nach dem
Zusammenführen nicht mehr trägt. Inhalt und Reihenfolge der in der Vorschau gezeigten Segmente
stimmen mit denen überein, die tatsächlich in den zusammengeführten Exporttext einfließen. Das ist
der Ort, an dem ein unglücklich formulierter oder falsch zugeordneter Leistungstext vor dem
Versand auffallen soll — nicht ein Escape-Verfahren im Export selbst, das es laut Festlegung
ausdrücklich nicht gibt.

### TP-EXPORT-17 — Zurücksetzen einer Buchung verändert die Summe ihrer Tagesgruppe (schärferes R-10)
**Anforderungen:** A-6.9, E-012, E-020, R-10
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo mit zwei Buchungen am selben Tag, beide bereits exportiert als eine
gemeinsame Exportzeile (Ergebnis eines vorherigen Laufs von `TP-EXPORT-11`-artiger Gruppierung).
**Schritte:**
1. Exportstatus einer der beiden Buchungen zurücksetzen (Ablauf wie `TP-EXPST-06`).
2. Eine dritte, neue Buchung für dasselbe Todo am selben Tag anlegen.
3. Export erneut ausführen.
**Erwartetes Ergebnis:** Die zurückgesetzte Buchung taucht wieder als „offen" auf und fließt beim
erneuten Export erneut in ihre Tagesgruppe ein — zusammen mit der neuen dritten Buchung, aber
**ohne** die weiterhin exportierte zweite Buchung aus dem ersten Lauf. Die resultierende
Exportzeile enthält die neu berechnete, gerundete Summe aus den beiden jetzt offenen Buchungen
(der zurückgesetzten und der neuen), nicht die ursprüngliche Dreiergruppe und nicht die bereits
abgerechnete zweite Buchung ein zweites Mal. Der Export-Verlauf (Ort 14 aus `TP-EXPST-09`) zeigt
beide Läufe getrennt, mit nachvollziehbarer Zuordnung, welche Buchungen in welchem Lauf
enthalten waren — das ist die Voraussetzung dafür, dass eine Doppelabrechnung trotz der
Gruppierung nachträglich auffällt.

---

## 10. Exportvorlagen (A-8.7, S-14, I-15)

### TP-TPL-01 — Abweichende Vorlage anlegen
**Anforderungen:** A-8.7, I-15, S-14
**Ebene:** End-to-End
**Vorbedingung:** Vorlageneditor (S-14) geöffnet.
**Schritte:** Neue Vorlage anlegen mit genau zwei Feldern: `Ticket` (Quelle `todo.callNumber`,
Transformation `roh`) und `Dauer` (Quelle `buchung.dauer`, Transformation
`runde_auf_viertelstunde`) — bewusst ohne `WindowsUser` und ohne Leistungsfeld, um zu zeigen,
dass die Engine nicht auf die vier Standardfelder festgelegt ist.
**Erwartetes Ergebnis:** Vorlage wird gespeichert, ist in der Vorlagenauswahl der Export-Ansicht
verfügbar.

### TP-TPL-02 — Live-Vorschau
**Anforderungen:** A-8.7
**Ebene:** End-to-End
**Vorbedingung:** Vorlage aus TP-TPL-01, tatsächlich offene Testbuchungen vorhanden.
**Schritte:** Vorschau öffnen, ein weiteres Feld zur Vorlage hinzufügen, ohne zwischendurch zu
speichern.
**Erwartetes Ergebnis:** Vorschau zeigt von Anfang an ausschließlich die konfigurierten Felder
mit korrekt transformierten Beispielwerten aus echten offenen Buchungen, und aktualisiert sich
nach Hinzufügen des Feldes ohne vorheriges Speichern.

### TP-TPL-03 — Export mit abweichender Vorlage gegen die Vorlage prüfen
**Anforderungen:** A-8.7
**Ebene:** End-to-End
**Vorbedingung:** Vorlage aus TP-TPL-01.
**Schritte:** Export mit dieser Vorlage ausführen, Ergebnisdatei öffnen.
**Erwartetes Ergebnis:** Datei enthält ausschließlich die Schlüssel `Ticket` und `Dauer`, mit
Werten gemäß der konfigurierten Quellen und Transformationen. Kein `Notiz`-Feld (Leistung) und
kein `WindowsUser`-Feld, weil nicht konfiguriert. Querverweis TP-NOTE-03: Feldquellen-Auswahl
bietet auch hier den Vermerk (`todo.notiz`) nicht an.

### TP-TPL-06 — Vorschau und Datei nutzen denselben Renderer, programmatisch
**Verweis:** siehe `TP-EXPORT-07` (Abschnitt 9), dort ausformuliert, weil sie dieselbe Vorlage
und dieselben Testbuchungen benötigt wie die dortigen Export-Ende-zu-Ende-Fälle. Nicht doppelt
aufgeführt, um keine zwei leicht unterschiedliche Versionen desselben Tests zu pflegen.

### TP-TPL-07 — Vorschau und Datei stimmen überein, sichtbar in S-07 und S-14
**Verweis:** siehe `TP-EXPORT-08` (Abschnitt 9), aus demselben Grund wie oben.

### TP-TPL-08 — Feldquelle nur aus geschlossener Liste, auch am Dienst direkt (neu in T-016, E-017)
**Anforderungen:** E-017, R-06
**Ebene:** Integration
**Vorbedingung:** Die geschlossene Liste gültiger Feldquellen ist bekannt (z. B.
`todo.callNumber`, `buchung.notiz`, `buchung.dauer`, `system.windowsUser` — die tatsächliche
Liste legt T-007 fest). Lokaler Dienst läuft, gültiges Token vorhanden.
**Schritte:**
1. Über die Oberfläche versuchen, eine Vorlage mit einer frei getippten, nicht gelisteten Quelle
   zu speichern (z. B. einem erfundenen Pfad wie `todo.metadaten.irgendwas`).
2. Direkt gegen die API des lokalen Dienstes, unter Umgehung der Oberfläche, dieselbe nicht
   gelistete Quelle speichern versuchen.
3. Zusätzlich direkt gegen die API: eine leere Quelle, eine sonst gültige Quelle mit
   umschließenden Leerzeichen, und eine Groß-/Kleinschreibungsvariante einer gültigen Quelle
   (z. B. `Buchung.Notiz` statt `buchung.notiz`) speichern versuchen.
**Erwartetes Ergebnis:** Jeder Versuch aus Schritt 1 bis 3 wird abgelehnt (Validierungsfehler),
unabhängig davon, ob er über die Oberfläche oder direkt gegen den Dienst erfolgt. Es gibt keinen
Weg, eine Quelle zu speichern, die nicht wörtlich und exakt in der geschlossenen Liste steht — ein
generischer Pfadauflöser, der laut E-017 gerade deshalb entfällt, weil er ein Leseprimitiv auf
beliebige Felder wäre, darf an keiner Stelle wieder auftauchen, auch nicht über eine tolerante
Normalisierung von Groß-/Kleinschreibung oder Leerzeichen.

### TP-TPL-04 — Standardvorlage nicht löschbar, aber kopierbar
**Anforderungen:** A-8.7
**Ebene:** End-to-End
**Vorbedingung:** Standardvorlage vorhanden.
**Schritte:** Löschen der Standardvorlage versuchen. Danach: Standardvorlage kopieren.
**Erwartetes Ergebnis:** Löschversuch wird verhindert bzw. die Option ist nicht verfügbar,
mit einer erklärenden Meldung. Kopie erzeugt eine neue, unabhängige, editierbare und löschbare
Vorlage mit denselben Feldern; die Standardvorlage bleibt unverändert.

### TP-TPL-05 — Bedingtes Feld
**Anforderungen:** A-2.6, A-8.7
**Ebene:** Integration
**Vorbedingung:** Vorlage mit einem Feld `Call`, Quelle `todo.callNumber`, Bedingung „nur wenn
`callNumber` gesetzt ist".
**Schritte:** Export einmal mit einer Buchung, deren Todo eine `callNumber` trägt, einmal mit
einer Buchung, deren Todo keine trägt.
**Erwartetes Ergebnis:** Im ersten Fall ist `Call` im Ergebnis enthalten. Im zweiten Fall ist das
Feld vollständig weggelassen (nicht als `null` oder leerer String vorhanden) — konsistent mit
A-2.6, wonach eine Buchung ohne Call-Nummer exportierbar ist, sofern die Vorlage das zulässt.

---

## 11. Outlook-Add-in (A-10.4, A-10.8, A-10.9, E-009)

### TP-ADDIN-01 — Call-Nummer wird per konfigurierbarem Regex erkannt
**Anforderungen:** A-10.8
**Ebene:** Integration
**Vorbedingung:** Add-in-Einstellungen (S-13) mit einem konfigurierten Muster, z. B. `TCK-\d{6}`.
Erfundene Beispiel-E-Mail mit Text „... zu Vorgang TCK-000042 bitte ...".
**Schritte:** E-Mail-Inhalt gegen das konfigurierte Muster prüfen lassen.
**Erwartetes Ergebnis:** `callNumber` wird korrekt als `TCK-000042` erkannt. Das Muster selbst
steht in der Konfiguration, nicht im Code.

### TP-ADDIN-02 — Vorhandener Call: Angebot statt Duplikat
**Anforderungen:** A-10.9, R-15
**Ebene:** End-to-End
**Vorbedingung:** Ein Todo mit `callNumber = "TCK-000042"` existiert bereits. Erfundene E-Mail
mit erkennbarer Call-Nummer `TCK-000042`.
**Schritte:**
1. Add-in mit dieser E-Mail öffnen.
2. Beobachten, welche Aktion das Add-in anbietet, **bevor** eine Bestätigung erfolgt.
3. Anbieten „auf vorhandenes Todo buchen" bestätigen.
**Erwartetes Ergebnis:** Das Add-in erkennt den vorhandenen Call und bietet ausdrücklich an, auf
das existierende Todo zu buchen, statt automatisch ein neues anzulegen. **R-15:** Vor der
Bestätigung in Schritt 3 zeigt das Add-in Titel und Call-Nummer des gefundenen Todos an — nicht
nur eine anonyme Ja/Nein-Frage, sondern genug Information, damit erkennbar ist, ob es sich
wirklich um denselben Kundenvorgang handelt. Nach Bestätigung entsteht keine zweite Todo mit
derselben `callNumber`; die neue Zeitbuchung landet am vorhandenen Todo. Abbruch der Aktion legt
ebenfalls kein Duplikat an.

### TP-ADDIN-03 — Ungültiger regulärer Ausdruck führt nicht zum Absturz
**Anforderungen:** A-10.8
**Ebene:** Integration
**Vorbedingung:** Add-in-Einstellungen erlauben Eingabe eines Musters.
**Schritte:** Nacheinander die folgenden syntaktisch ungültigen Ausdrücke eingeben und jeweils
speichern versuchen: `TCK-(\d{6` (unbalancierte Klammer), `[` , `(`, `\`, `""` (leere
Zeichenkette als Muster).
**Erwartetes Ergebnis:** Jeder Versuch wird mit einer verständlichen Validierungsmeldung
abgelehnt, oder das zuletzt gültige Muster bleibt aktiv. Das Add-in bleibt nach jedem der fünf
Versuche funktionsfähig, kein Absturz, kein unbehandelter Fehler beim nächsten Öffnen einer
E-Mail. Deckt Prüfung 12 aus `docs/bedrohungsmodell.md` Abschnitt 7 (B-4.2) vollständig ab.

### TP-ADDIN-04 — Kein Duplikat auch bei mehreren Treffern
**Anforderungen:** A-10.9
**Ebene:** Integration
**Vorbedingung:** Zwei bestehende Todos mit unterschiedlichen `callNumber`-Werten.
**Schritte:** Duplikatsprüfung für eine E-Mail mit einer der beiden Nummern anstoßen.
**Erwartetes Ergebnis:** Nur das exakt passende Todo wird als Vorschlag angeboten; kein neues
Todo wird stillschweigend angelegt oder mit dem falschen Todo zusammengeführt.

### TP-ADDIN-05 — Tag- und Ordnerstruktur über die API abrufbar
**Anforderungen:** A-10.4
**Ebene:** Integration
**Vorbedingung:** Vierstufige Tag-/Ordnerstruktur aus Abschnitt 6 existiert, gültiges Token.
**Schritte:** Struktur über die API abrufen, wie es das Add-in beim Öffnen tut.
**Erwartetes Ergebnis:** Vollständige Struktur inklusive aller vier Ebenen wird zurückgegeben und
ist im Add-in durchsuchbar/auswählbar (A-10.5).

### TP-ADDIN-06 — Ohne gültiges Token wird abgewiesen
**Anforderungen:** E-009, R-02, R-09
**Ebene:** Integration
**Vorbedingung:** Lokaler Dienst läuft.
**Schritte:** Anfrage ohne Token, mit leerem Token, mit offensichtlich falschem Token und mit
einem zuvor gültigen, aber inzwischen durch Neuerzeugung ungültig gewordenen Token senden.
**Erwartetes Ergebnis:** Alle vier Anfragen werden abgewiesen, mit einheitlicher Fehlermeldung,
die nicht verrät, ob das Token nahe an einem gültigen Format war oder nicht (kein Auskunfts-Orakel
für Angreifer). Kein Token-Wert erscheint in der Fehlermeldung oder in Protokollausgaben.

### TP-ADDIN-07 — Neuerzeugung macht das alte Token sofort ungültig
**Anforderungen:** E-009
**Ebene:** Integration
**Vorbedingung:** Gültiges Token A ist im Einsatz.
**Schritte:** Neues Token B erzeugen. Direkt danach Anfrage mit Token A senden.
**Erwartetes Ergebnis:** Anfrage mit Token A wird abgewiesen, ohne Übergangsfenster. Anfrage mit
Token B wird angenommen.

### TP-ADDIN-08 — Token-Rotation über beide Oberflächen hinweg (End-to-End)
**Anforderungen:** E-009, S-09, S-13
**Ebene:** End-to-End
**Vorbedingung:** Hauptanwendung und Add-in beide erreichbar.
**Schritte:** In den Einstellungen der Hauptanwendung (S-09) ein neues Token erzeugen, es in den
Add-in-Einstellungen (S-13) eintragen.
**Erwartetes Ergebnis:** Add-in kann danach erfolgreich mit dem lokalen Dienst kommunizieren
(z. B. Tag-Struktur laden). Ein Versuch mit dem alten Token (falls noch irgendwo hinterlegt)
schlägt fehl. Das Token wird an keiner Stelle der Oberfläche standardmäßig angezeigt, nur auf
ausdrückliche Anforderung. **Ergänzt in T-016 (deckt Prüfung 23 aus `docs/bedrohungsmodell.md`
Abschnitt 7, B-2.3):** Vor der ausdrücklichen Anforderung das gerenderte DOM der
Add-in-Einstellungen (S-13) direkt inspizieren (z. B. `page.content()` in Playwright) und
sicherstellen, dass der Token-Klartext an keiner Stelle darin vorkommt, auch nicht in einem
versteckten Element oder einem `data-`-Attribut. Erst nach der ausdrücklichen Anzeige-Handlung
darf der Klartext im DOM erscheinen.

### TP-ADDIN-09 — Standard-Tags auch über das Add-in
**Anforderungen:** A-9.5
**Ebene:** End-to-End
**Vorbedingung:** Wie TP-DTAG-02.
**Schritte:** Siehe TP-DTAG-02 (dieser Fall ist der Add-in-Teil jenes Testfalls und wird hier nur
zur Vollständigkeit der Add-in-Abdeckung referenziert, nicht doppelt ausgeführt).
**Erwartetes Ergebnis:** Siehe TP-DTAG-02.

### TP-ADDIN-10 — Regex trifft auf jede E-Mail zu: kein automatisches Zusammenlegen (neu in T-016, R-15)
**Anforderungen:** A-10.8, A-10.9, R-15
**Ebene:** End-to-End
**Vorbedingung:** Add-in-Einstellungen mit dem Muster `.*` (trifft auf jeden Text zu). Zwei
erfundene E-Mails erkennbar unterschiedlicher (fiktiver) Kunden, keine der beiden enthält eine
im engeren Sinn gültige Call-Nummer.
**Schritte:**
1. Add-in mit E-Mail 1 öffnen, Todo anlegen.
2. Add-in mit E-Mail 2 öffnen.
**Erwartetes Ergebnis:** Das Add-in legt für E-Mail 2 ein **eigenes** Todo an; es bucht nicht
stillschweigend auf das Todo aus E-Mail 1, nur weil der weite Ausdruck auf beide zutrifft. Ein
allein durch einen zu weiten Ausdruck erzeugter „Treffer" ohne eine tatsächlich extrahierte,
nicht leere Call-Nummer darf nicht als Übereinstimmungskriterium für A-10.9 dienen. Deckt Prüfung
21 aus `docs/bedrohungsmodell.md` Abschnitt 7 (B-4.3) ab.

### TP-ADDIN-11 — Leere Call-Nummer ist nie ein Übereinstimmungskriterium (neu in T-016, R-15)
**Anforderungen:** A-10.9, R-15
**Ebene:** Integration
**Vorbedingung:** Zwei bestehende Todos, deren `callNumber`-Feld beide leer ist.
**Schritte:** Duplikatsprüfung mit einer E-Mail ausführen, aus der keine Call-Nummer extrahiert
werden konnte (leeres Erkennungsergebnis).
**Erwartetes Ergebnis:** Kein Todo wird als Treffer vorgeschlagen, obwohl beide bestehenden Todos
ebenfalls eine leere `callNumber` tragen — eine leere oder unplausible Call-Nummer ist nie ein
Übereinstimmungskriterium, auf keiner Seite des Vergleichs. Deckt Prüfung 13 aus
`docs/bedrohungsmodell.md` Abschnitt 7 (B-4.3) ab.

### TP-ADDIN-13 — Add-in-Token liegt im `localStorage` der Add-in-Herkunft, nicht in `Office.context.roamingSettings` (E-019, neu in T-016)
**Anforderungen:** E-019, R-12
**Ebene:** End-to-End
**Vorbedingung:** Add-in installiert und mit einem Token verbunden (Zustand nach `TP-ADDIN-08`).
**Schritte:**
1. Token in den Add-in-Einstellungen (S-13) eintragen und speichern.
2. Im Browser-Kontext des Add-ins den `localStorage` der Add-in-Herkunft auslesen (z. B. über
   `page.evaluate(() => window.localStorage)` in Playwright) und auf das Token prüfen.
3. `Office.context.roamingSettings` (bzw. dessen Testdouble/Mock, sofern Office.js in der
   Testumgebung simuliert wird) auf das Token prüfen.
**Erwartetes Ergebnis:** Das Token ist im `localStorage` der Add-in-Herkunft auffindbar.
`Office.context.roamingSettings` enthält das Token an keiner Stelle, unter keinem Schlüssel — es
verlässt damit nicht über Exchange/M365 den Rechner (R-12).

---

## 12. Zustände je Screen (Abschnitt 15/16, S-01 bis S-14)

**Hintergrund.** Verlangt sind je Screen, soweit anwendbar: Empty State, Loading State, Hover
State, aktiver Zustand, Fehlermeldung, Bestätigungsdialog. Nicht jeder Zustand ist für jeden
Screen sinnvoll; wo ein Zustand nicht anwendbar ist, ist das ausdrücklich vermerkt statt
stillschweigend übersprungen. Alle Fälle in diesem Abschnitt sind Ebene **End-to-End**
(visuelle Prüfung, `ecc:browser-qa`).

| ID | Screen | Empty | Loading | Hover | Aktiv | Fehler | Bestätigungsdialog |
|---|---|---|---|---|---|---|---|
| TP-STATE-01 | S-01 Dashboard | Erststart ohne Daten | Kennzahlen werden aggregiert | Schnellaktionen auf Karten | laufender Timer prominent markiert | Kennzahl konnte nicht geladen werden | n/a auf dieser Ebene, siehe TP-TIMER-07 falls Timer-Stopp vom Dashboard aus möglich ist |
| TP-STATE-02 | S-02 Todo-Liste | keine Todos / kein Treffer bei Filter | Liste lädt | Zeilen-Hover zeigt Aktionen | aktiver Filter-Chip erkennbar | Liste konnte nicht geladen werden | Massenaktion (z. B. mehrere als erledigt markieren), sofern vorhanden — in Spezifikation nicht ausdrücklich benannt, als Annahme markiert |
| TP-STATE-03 | S-03 Todo-Detail | Todo ohne Zeitbuchungen zeigt Empty-Hinweis im Buchungsteil | Detaildaten laden | Bearbeiten-Icons bei Hover | „Erledigt"-Umschalter aktiv, Timer läuft | Speichern fehlgeschlagen | Todo löschen; Exportstatus einer Buchung zurücksetzen (TP-EXPST-06) |
| TP-STATE-04 | S-04 Kanban | zwei Leerzustände (T-081): „keine Bedingung" gegen „Bedingung ohne Treffer" (TP-KANBAN-03) | Board lädt | Kartenmenü/Spaltenmenü bei Hover — kein Ziehen mehr, siehe Abschnitt 8 | Timer läuft auf einer Karte (TP-KANBAN-04) | Regel konnte nicht gespeichert werden | Spalte vom Board nehmen (Regel bleibt als Pool erhalten, kein Karten-Verlust möglich — anders als bei einer Statusspalte gibt es hier nichts, das an der Spalte selbst hängt) |
| TP-STATE-05 | S-05 Time-Tracking | keine Buchungen im gewählten Zeitraum | Buchungen laden | Zeilenaktionen bei Hover | laufender Timer prominent (A-13.4) | Timer konnte nicht gestartet/gestoppt werden | Timer wechseln (TP-TIMER-07), Buchung löschen |
| TP-STATE-06 | S-06 Übersicht Zeitbuchungen | keine Buchungen / Filter ohne Treffer | Liste lädt | Zeilen-Hover | Filter aktiv, Status-Badges sichtbar | Liste konnte nicht geladen werden | Exportstatus zurücksetzen (TP-EXPST-06) |
| TP-STATE-07 | S-07 Export-Ansicht | keine offenen Buchungen (TP-EXPORT-03) | Export läuft | Vorlagenauswahl bei Hover | ausgewählte Vorlage hervorgehoben | Ordner ungültig/schreibgeschützt (TP-EXPORT-04/05) | in der Spezifikation kein eigener Bestätigungsdialog für den Exportvorgang selbst vorgesehen — nur für das Zurücksetzen (Abschnitt 4); nicht erfunden |
| TP-STATE-08 | S-08 Tag-/Ordnerverwaltung | keine Tags/Ordner angelegt | Baum lädt | Drag-Handle bei Hover | ausgewählter Ordner im Baum | Verschieben in sich selbst abgelehnt (TP-TAG-02/03) | Tag/Ordner löschen, besonders wenn noch Todos daran hängen |
| TP-STATE-09 | S-09 Einstellungen | kein Exportordner gesetzt | Einstellungen laden | Abschnitts-Hover | aktiver Einstellungsbereich/Tab | ungültiger Ordnerpfad, Token-Aktion fehlgeschlagen | Token neu erzeugen (macht altes sofort ungültig — Annahme: Bestätigung sinnvoll, in Spezifikation nicht ausdrücklich verlangt) |
| TP-STATE-10 | S-10 Standard-Tags | keine Standard-Tags konfiguriert | Einstellung lädt | Tag-Hover in Auswahl | hinzugefügtes Tag hervorgehoben | Speichern fehlgeschlagen | Standard-Tag entfernen — reine Konfigurationsänderung, kein Dialog zwingend nötig (Annahme) |
| TP-STATE-11 | S-11 Pool-Konfiguration | keine Pools definiert | Konfiguration lädt | Regel-Hover | Pool-Regel in Bearbeitung | ungültige Regel (referenziertes Tag existiert nicht mehr) | Pool löschen |
| TP-STATE-12 | S-12 Outlook-Add-in | kein Call erkannt / keine Tags geladen | Tag-/Ordnerstruktur lädt von der API | Tag-Auswahl bei Hover | Call erkannt und passendes Todo gefunden | API nicht erreichbar / Token ungültig (TP-ADDIN-06) | auf vorhandenes Todo buchen vs. neu anlegen (TP-ADDIN-02) |
| TP-STATE-13 | S-13 Add-in-Einstellungen | kein Regex/Token gesetzt | Einstellungen laden | Muster-Test-Hervorhebung bei Hover | aktueller Regex-Treffer hervorgehoben | ungültiger regulärer Ausdruck (TP-ADDIN-03), ungültiges Token | Speichern trotz Warnung, falls Muster testweise keine Treffer liefert |
| TP-STATE-14 | S-14 Vorlageneditor | neue Vorlage ohne Felder | Vorschau wird berechnet | Feld-Optionen bei Hover | Feld in Bearbeitung ausgewählt | Vorlage ohne Felder speichern, ungültige Quelle/Transformation | Vorlage löschen; Standardvorlage-Löschversuch wird abgelehnt (TP-TPL-04) |

Wo in der Tabelle „Annahme" vermerkt ist, handelt es sich um eine Ermessensentscheidung dieses
Testplans, keine Vorgabe aus `docs/spec.md`. Sie ist hier bewusst sichtbar gemacht, damit
spec-ux-reviewer (T-005) und frontend-dev (T-006) sie bestätigen oder korrigieren können, statt
dass sie unbemerkt in einer Testerwartung verschwindet.

---

## 13. Prüfungen aus dem Bedrohungsmodell (neu in T-016)

`docs/bedrohungsmodell.md` Abschnitt 7 leitet 23 nummerierte Prüfungen ab, ausdrücklich „für T-010
(unit-tester) und T-002 (e2e-tester)". Alle 23 sind hier aufgenommen. Wo eine Prüfung einen
bereits vorhandenen oder in dieser Aufgabe neu geschriebenen Testfall dieses Dokuments dupliziert,
verweist die Tabelle darauf, statt ihn zu wiederholen — 9 der 23 Prüfungen sind solche Verweise,
14 sind neu und tragen das Präfix `TP-SEC-`, weil sie in keinem der bestehenden Bereiche
(BASE/ROUND/B64/NOTE/EXPST/TIMER/TAG/DTAG/KANBAN/EXPORT/TPL/ADDIN/STATE) sauber unterkommen.

| # | Bedrohungsmodell | Prüfung (gekürzt) | TP-ID / Verweis | Ebene |
|---|---|---|---|---|
| 1 | B-1.1 | Jede registrierte Route ohne Token → 401, über die tatsächliche Routenliste, nicht von Hand gepflegt | `TP-SEC-01` | Integration |
| 2 | B-1.3 | `Host: evil.example` → 403/421, ohne Datenbankzugriff | `TP-SEC-02` | Integration |
| 3 | B-1.4 | Herkunftstabelle mit `https://tauri.localhost.evil.example`, `null`, leer | `TP-SEC-03` | Integration |
| 4 | B-1.2 | Einfache Anfrage (`text/plain`, ohne Token, fremde Herkunft) gegen jede zustandsändernde Route → keine Wirkung | `TP-SEC-04` | Integration |
| 5 | B-2.5 | Tokenvergleich zeitkonstant, kein `===` im Nachweispfad | `TP-SEC-05` | Unit |
| 6 | B-2.4 | Protokollausgabe und Antwortkörper des gesamten Testlaufs enthalten `takt_` nirgends | `TP-SEC-06` | Integration |
| 7 | B-2.7 | Neues Token erzeugt → altes ergibt sofort 401 | **Verweis:** `TP-ADDIN-07` (deckt dies bereits vollständig) | Integration |
| 8 | B-3.1 | Eigenschaftstest: Todo-Notiz (Vermerk) erscheint nie im Ergebnis, weder Klartext noch base64-kodiert, über beliebige Vorlagen | **Verweis:** `TP-NOTE-02` (in T-016 genau dafür umgeschrieben) | Integration |
| 9 | B-3.1 | Vorlage mit unbekanntem Quellschlüssel, direkt in die Speicherung geschrieben → Export bricht ab | **Verweis:** `TP-TPL-08` (neu in T-016) | Integration |
| 10 | B-3.2 | Feldnamen `__proto__`, `constructor`, `prototype` und Duplikate → abgewiesen | `TP-SEC-07` | Unit |
| 11 | B-4.1 | Bösartiges Regex-Muster mit passender Eingabe → Abbruch nach der Zeitgrenze, Gesamtlaufzeit begrenzt (ReDoS) | `TP-SEC-08` | Unit |
| 12 | B-4.2 | Ungültige Muster `[`, `(`, `\`, `""` → verständlicher Fehler, Add-in bleibt bedienbar | **Verweis:** `TP-ADDIN-03` (in T-016 um genau diese Musterliste erweitert) | Integration |
| 13 | B-4.3 | Duplikatsuche mit leerer Call-Nummer → nie ein Treffer | **Verweis:** `TP-ADDIN-11` (neu in T-016) | Integration |
| 14 | B-5.1 | Pfadprüfung mit `..`, absolutem Pfad, `C:\Export-Geheim` gegen `C:\Export`, `datei.json:strom` (ADS), symbolischer Verknüpfung | `TP-SEC-09` | Integration |
| 15 | B-5.4 | Fehler nach dem Schreiben der temporären Datei → keine Zieldatei, keine Markierung, keine Reste | **Verweis:** `TP-EXPST-04` (identische Zusicherung, bereits vorhanden) | Integration |
| 16 | B-9.1 | `exportAnzahl` sinkt beim Zurücksetzen nicht; `UPDATE` auf `export_protokoll` scheitert | `TP-SEC-10` | Integration |
| 17 | B-7.4 | Tagnamen und Leistungen mit `'`, `;`, `--`, `%`, Nullbyte und Überlänge | `TP-SEC-11` | Integration |
| 18 | B-2.2, B-5.4, B-7.2 | Dateimodus von Datenbankverzeichnis, `.sqlite`, `-wal`, `-shm`, Tokendatei und Exportdatei nach der Erstinitialisierung | `TP-SEC-12` | Integration |
| 19 | B-5.2 | Export in einen nicht existierenden Ordner → verständlicher Fehler, **keine** Buchung markiert | **Verweis:** `TP-EXPORT-04` (identisch, bereits vorhanden) | End-to-End |
| 20 | B-9.1 | Exportieren, zurücksetzen, erneut exportieren → zwei Protokollzeilen, `exportAnzahl = 2`, getrennte Anzeige in S-07 | `TP-SEC-13` | End-to-End |
| 21 | B-4.3 | Muster `.*` in S-13, zwei E-Mails verschiedener Kunden → zwei getrennte Todos, kein Zusammenlegen | **Verweis:** `TP-ADDIN-10` (neu in T-016) | End-to-End |
| 22 | B-12.1 | Leistung mit `<img src=x onerror=…>` speichern und in allen Ansichten anzeigen → als Text dargestellt | `TP-SEC-14` | End-to-End |
| 23 | B-2.3 | Token verdeckt; Klartext erst nach ausdrücklicher Handlung im DOM | **Verweis:** `TP-ADDIN-08` (in T-016 um genau diesen DOM-Check erweitert) | End-to-End |

Die neuen `TP-SEC-*`-Fälle im Einzelnen:

### TP-SEC-01 — Jede registrierte Route ohne Token → 401
**Anforderungen (Bedrohungsmodell):** B-1.1. **Ebene:** Integration.
**Vorbedingung:** Lokaler Dienst läuft; die tatsächliche Routenliste ist zur Testzeit abrufbar
(z. B. über das Router-Objekt selbst), nicht von Hand im Test dupliziert.
**Schritte:** Für jede Route aus der abgerufenen Routenliste eine Anfrage ohne Token senden.
**Erwartetes Ergebnis:** Jede einzelne Route antwortet mit 401. Eine künftig neu hinzugefügte
Route fällt automatisch unter denselben Test, weil die Liste zur Laufzeit ermittelt wird, nicht
gepflegt werden muss.

### TP-SEC-02 — Host-Header-Fälschung
**Anforderungen (Bedrohungsmodell):** B-1.3. **Ebene:** Integration.
**Vorbedingung:** Lokaler Dienst läuft.
**Schritte:** Anfrage mit `Host: evil.example` senden, dabei beobachten, ob ein
Datenbankzugriff stattfindet (z. B. über Instrumentierung/Mock der Speicherschicht).
**Erwartetes Ergebnis:** Antwort 403 oder 421, **kein** Datenbankzugriff vor der Ablehnung.

### TP-SEC-03 — Herkunftstabelle mit bösartigen, leeren und `null`-Werten
**Anforderungen (Bedrohungsmodell):** B-1.4. **Ebene:** Integration.
**Vorbedingung:** Lokaler Dienst läuft.
**Schritte:** Anfragen mit `Origin: https://tauri.localhost.evil.example`, `Origin: null` und
ohne `Origin`-Header (leer) senden.
**Erwartetes Ergebnis:** Alle drei werden abgelehnt; insbesondere die Subdomain-Täuschung
(`tauri.localhost.evil.example` enthält `tauri.localhost` nur als Präfix eines fremden Namens)
darf nicht versehentlich als vertrauenswürdig durchgehen.

### TP-SEC-04 — Einfache Anfrage ohne Vorprüfung gegen jede zustandsändernde Route
**Anforderungen (Bedrohungsmodell):** B-1.2. **Ebene:** Integration.
**Vorbedingung:** Lokaler Dienst läuft; Liste aller zustandsändernden Routen (POST/PUT/PATCH/
DELETE) bekannt.
**Schritte:** Gegen jede dieser Routen eine „einfache" Anfrage senden (`Content-Type: text/plain`,
kein Token, fremde Herkunft) — eine Anfrageform, die ein Browser ohne Preflight verschicken
könnte.
**Erwartetes Ergebnis:** Keine dieser Anfragen hat eine Wirkung (kein Datensatz verändert), auch
nicht teilweise.

### TP-SEC-05 — Zeitkonstanter Tokenvergleich
**Anforderungen (Bedrohungsmodell):** B-2.5. **Ebene:** Unit.
**Vorbedingung:** Vergleichsfunktion für Token liegt vor.
**Schritte:** Vergleich mit gleich langen, aber falschen Eingaben und mit deutlich kürzeren/
längeren Eingaben aufrufen; Quelltext des Nachweispfads auf `===`/`==` zwischen Rohwerten prüfen.
**Erwartetes Ergebnis:** Kein einfacher Werte-Vergleichsoperator im Nachweispfad; eine
zeitkonstante Vergleichsfunktion wird verwendet. (Laufzeitmessung ist auf Unit-Ebene notorisch
unzuverlässig — der verlässliche Teil dieses Tests ist die Codeprüfung auf die richtige Funktion,
nicht eine Zeitmessung im Test selbst.)

### TP-SEC-06 — Kein Tokenpräfix in Protokoll oder Antwortkörper des gesamten Testlaufs
**Anforderungen (Bedrohungsmodell):** B-2.4. **Ebene:** Integration (querschnittlich).
**Vorbedingung:** Vollständiger Testlauf inklusive Token-bezogener Fälle (`TP-ADDIN-06` bis
`TP-ADDIN-08`, `TP-ADDIN-13`) mit mitgeschnittener Protokollausgabe und mitgeschnittenen
Antwortkörpern.
**Schritte:** Nach Abschluss des Testlaufs die gesamte mitgeschnittene Ausgabe nach der
Zeichenkette `takt_` (dem Tokenpräfix) durchsuchen.
**Erwartetes Ergebnis:** Kein Treffer, an keiner Stelle. Dieser Fall ist bewusst als Meta-Prüfung
über den gesamten Lauf formuliert, nicht als isolierter Einzeltest, weil ein Tokenleck in einer
beliebigen Fehlermeldung entstehen kann, nicht nur in den offensichtlichen Token-Tests.

### TP-SEC-07 — Gefährliche Feldnamen in Exportvorlagen abgewiesen
**Anforderungen (Bedrohungsmodell):** B-3.2. **Ebene:** Unit.
**Vorbedingung:** Validierungsfunktion für Vorlagenfelder liegt vor.
**Schritte:** Feldname `__proto__`, `constructor`, `prototype` sowie zwei Felder mit identischem
Namen in derselben Vorlage anlegen versuchen.
**Erwartetes Ergebnis:** Alle vier Versuche werden abgewiesen. Insbesondere führt kein Feldname
zu einer Prototype-Pollution beim späteren Zusammenbau des Export-Objekts.

### TP-SEC-08 — ReDoS-Schutz für das Add-in-Muster
**Anforderungen (Bedrohungsmodell):** B-4.1. **Ebene:** Unit.
**Vorbedingung:** Regex-Ausführungs-Wrapper der Fachlogik liegt vor.
**Schritte:** Ein bekanntermaßen katastrophal rückverfolgendes Muster (z. B. `(a+)+$`) zusammen
mit einer speziell konstruierten, passenden Eingabe ausführen.
**Erwartetes Ergebnis:** Die Ausführung bricht nach einer festen Zeitgrenze ab, statt die
Anwendung einzufrieren; die Gesamtlaufzeit ist nachweislich begrenzt.

### TP-SEC-09 — Pfadprüfung des Exportordners gegen Traversierung, ADS und Verknüpfungen
**Anforderungen (Bedrohungsmodell):** B-5.1. **Ebene:** Integration.
**Vorbedingung:** Pfadprüfungsfunktion für den Exportordner liegt vor; ein gültiger
Referenzordner `C:\Export` (bzw. plattformgerechtes Äquivalent) ist konfiguriert.
**Schritte:** Prüfung nacheinander mit `..\..\Windows`, einem absoluten Pfad außerhalb des
Referenzordners, `C:\Export-Geheim` (Namenspräfix-Verwechslung mit `C:\Export`),
`datei.json:strom` (alternativer NTFS-Datenstrom) und einer symbolischen Verknüpfung, die aus dem
Referenzordner heraus auf ein Ziel außerhalb zeigt, aufrufen.
**Erwartetes Ergebnis:** Jeder der fünf Fälle wird abgelehnt oder auf den tatsächlichen,
aufgelösten Pfad geprüft (nicht auf den unaufgelösten String) — `C:\Export-Geheim` insbesondere
wird nicht allein wegen des gemeinsamen Präfixes als „innerhalb von `C:\Export`" akzeptiert.

### TP-SEC-10 — `exportAnzahl` sinkt beim Zurücksetzen nicht
**Anforderungen (Bedrohungsmodell):** B-9.1. **Ebene:** Integration.
**Vorbedingung:** Buchung mit `exportAnzahl = 1` nach einem Exportlauf.
**Schritte:** Exportstatus zurücksetzen (Ablauf wie `TP-EXPST-06`); versuchen, `exportAnzahl` per
direktem `UPDATE` auf `export_protokoll` zu verringern oder den Protokolleintrag zu löschen.
**Erwartetes Ergebnis:** `exportAnzahl` bleibt nach dem Zurücksetzen unverändert bei 1 (das
Zurücksetzen ändert den Status der Buchung, nicht die Historie ihrer bisherigen Exporte); ein
direkter Schreibversuch, der die Zählung verringern würde, scheitert an einer Datenbankregel
(z. B. Check-Constraint oder Trigger), nicht erst an Anwendungslogik, die umgangen werden könnte.

### TP-SEC-11 — SQL- und Kodierungs-Robustheit bei Tag- und Leistungstexten
**Anforderungen (Bedrohungsmodell):** B-7.4. **Ebene:** Integration.
**Vorbedingung:** Tag-Anlage und Leistungstext-Eingabe sind ansprechbar.
**Schritte:** Tagnamen und Leistungstexte nacheinander mit `'`, `;`, `--`, `%`, einem eingebetteten
Nullbyte und einer deutlich überlangen Zeichenkette (z. B. 100.000 Zeichen) anlegen bzw. speichern.
**Erwartetes Ergebnis:** Kein SQL-Fehler, keine fehlerhafte Truncation, kein Absturz; alle Werte
werden entweder unverändert gespeichert oder mit einer verständlichen, nicht technischen Meldung
abgelehnt (z. B. bei Überlänge).

### TP-SEC-12 — Dateirechte nach der Erstinitialisierung
**Anforderungen (Bedrohungsmodell):** B-2.2, B-5.4, B-7.2. **Ebene:** Integration.
**Vorbedingung:** Frische Installation, erster Start.
**Schritte:** Nach dem ersten Start den Dateimodus des Datenbankverzeichnisses, der `.sqlite`-,
`-wal`- und `-shm`-Dateien, der Tokendatei und einer frisch erzeugten Exportdatei auslesen.
**Erwartetes Ergebnis:** Alle genannten Pfade sind ausschließlich für den aktuellen Benutzer
lesbar/schreibbar (kein „für alle lesbar"), soweit das Betriebssystem das unterstützt.

### TP-SEC-13 — Zwei Exportläufe mit Zurücksetzen dazwischen bleiben getrennt nachvollziehbar
**Anforderungen (Bedrohungsmodell):** B-9.1. **Ebene:** End-to-End.
**Vorbedingung:** Eine offene Buchung.
**Schritte:** Exportieren, Exportstatus dieser Buchung zurücksetzen (`TP-EXPST-06`), erneut
exportieren.
**Erwartetes Ergebnis:** Der Export-Verlauf (Ort 14 aus `TP-EXPST-09`) zeigt **zwei** getrennte
Protokollzeilen, `exportAnzahl` dieser Buchung steht auf 2, und S-07 zeigt beide Läufe getrennt
an, nicht zu einem verschmolzen.

### TP-SEC-14 — Gespeicherter Skriptinhalt wird überall als Text dargestellt
**Anforderungen (Bedrohungsmodell):** B-12.1. **Ebene:** End-to-End.
**Vorbedingung:** Zugriff auf mindestens Todo-Detailansicht (S-03), Zeitbuchungsübersicht (S-06)
und Export-Vorschau (S-07).
**Schritte:** Eine Leistung mit dem Inhalt `<img src=x onerror=alert(1)>` speichern; anschließend
alle drei genannten Ansichten öffnen.
**Erwartetes Ergebnis:** In allen drei Ansichten erscheint der Inhalt als sichtbarer Text
(einschließlich der spitzen Klammern), es wird kein Bild-Tag gerendert, kein Skript ausgeführt,
kein Dialog ausgelöst.

---

## Rückverfolgbarkeit (Anforderungs-ID → Testfälle, Auswahl)

| Anforderung/Interaktion | Testfälle |
|---|---|
| A-2.5 (Wiederbelebung) | TP-TIMER-01, -02, -04, -05, -06 (neutrale Spalte bleibt unverändert); TP-KANBAN-04 (Spalte, die auf „Erledigt" filtert, ändert sich absichtlich) |
| A-2.6 (`callNumber`) | TP-EXPORT-01, TP-TPL-05, TP-ADDIN-01, -02 |
| A-3.4 (Pool abgeleitet) | TP-TIMER-02, TP-TAG-04 |
| A-4.1–A-4.6 (Tags/Ordner) | TP-TAG-01 bis TP-TAG-06 |
| A-5.1, A-5.3–A-5.6 (Kanban, E-054/E-055) | TP-KANBAN-01 bis TP-KANBAN-06 — **A-5.2 entfällt** (Drag & Drop, aufgehoben durch E-054) |
| A-6.4–A-6.9 (Zeitbuchung/Exportstatus) | TP-EXPST-01 bis TP-EXPST-09 |
| A-7.2/A-7.4 (Vermerk/Leistung-Trennung) | TP-NOTE-01 bis TP-NOTE-04 |
| A-8.1–A-8.6, A-8.9 (Export) | TP-EXPORT-01 bis TP-EXPORT-10, TP-EXPORT-11 bis -17 (Gruppierung, Abschnitt 9a), TP-ROUND-*, TP-B64-* |
| A-8.7 (Vorlagen) | TP-TPL-01 bis TP-TPL-08, TP-NOTE-01/02/04 |
| A-8.8 (Transaktion) | TP-EXPST-04 |
| A-9.1–A-9.5 (Standard-Tags) | TP-DTAG-01 bis TP-DTAG-04, TP-ADDIN-09 |
| A-10.4, A-10.8, A-10.9 (Add-in) | TP-ADDIN-01 bis TP-ADDIN-04, -06 bis -11, -13 |
| E-008 (Rundung, bestätigt) | TP-ROUND-01 bis TP-ROUND-16, TP-EXPORT-09 |
| E-009/R-02/R-09 (Token) | TP-ADDIN-06, -07, -08 |
| E-011/R-11 (Exportordner) | TP-EXPORT-04, -05 |
| E-012/R-10 (Zurücksetzen) | TP-EXPST-06, -07, TP-EXPORT-14, -17 (Zusammenspiel mit der Gruppierung) |
| E-017 (geschlossene Feldquellen-Liste) | TP-NOTE-01, -04, TP-TPL-08 |
| E-018/R-13 (Ablageorte, nicht Roaming) | TP-EXPORT-10 |
| E-019/R-12 (Token nicht in roamingSettings) | TP-ADDIN-13 |
| E-020 (Gruppierung je Todo und Tag) | TP-EXPORT-11 bis TP-EXPORT-17 (Abschnitt 9a) |
| R-06 (Vorlagen hebeln Trennung aus) | TP-NOTE-01 bis TP-NOTE-04, TP-TPL-08 |
| R-08 (zwei Notizfelder verwechselbar) | TP-NOTE-03 (Sichtbarkeit in der UI) |
| R-15 (zu weiter Add-in-Regex) | TP-ADDIN-02, -10, -11 |
| R-17 (Vorschau muss zur Datei passen) | TP-EXPORT-07, -08, TP-EXPORT-16d, TP-NOTE-03 |
| R-18 (Notiz-Test besteht sonst versehentlich) | TP-NOTE-02, TP-NOTE-03 |
| I-01–I-04 (Grundfunktionen) | TP-BASE-01 bis TP-BASE-04 |
| I-05 (Wiederbelebung) | TP-TIMER-04 bis TP-TIMER-06 |
| I-06/I-07/I-08 (Tags/Ordner-Interaktionen) | TP-TAG-05, TP-TAG-03 |
| I-09 (als exportiert markieren) | TP-EXPST-02 |
| I-10 (Buchungen filtern) | TP-EXPST-08 |
| I-11 (Daten exportieren) | TP-EXPORT-01 bis TP-EXPORT-06 |
| I-12 (Standard-Tags konfigurieren) | TP-DTAG-01, -03 |
| I-13 (Pools konfigurieren) | TP-TAG-06 |
| I-14 (Drag & Drop) | **aufgehoben durch E-054** (T-081) — es gibt seit E-054 keine Bedienung mehr, die dies prüfen könnte; `TP-KANBAN-01` bedeutet seit T-081 etwas anderes (siehe Abschnitt 8) |
| I-15 (Exportvorlage anlegen/prüfen) | TP-TPL-01 bis TP-TPL-04 |
| S-01 bis S-14 (alle Screens) | je einmal explizit in Abschnitt 12 (TP-STATE-01 bis -14), zusätzlich in den fachlichen Abschnitten 0–11 |

---

## Offene Punkte und Abhängigkeiten

- Kein Testfall in diesem Dokument wurde ausgeführt. Voraussetzung für die erste tatsächliche
  Ausführung ist T-008 (Projektgerüst, Playwright-Setup) und, für die Unit-/Integrationsfälle,
  T-009 (Fachlogik) nach T-010 (Unit-Tests zuerst geschrieben).
- Für die als „End-to-End" markierten Fälle existiert auf dem aktuellen Board keine eigene
  Aufgabe, die sie tatsächlich als Playwright-Dateien unter `tests/e2e/**` anlegt — das ist
  ausdrücklich nicht Teil von T-002. Diese Lücke gehört in die Wellenplanung (siehe Bericht).
- **Aus T-081, erledigt:** Die frühere `TP-KANBAN-02` markierte eine Annahme zum Ort der
  Kanban-Spaltenkonfiguration, die mit T-005 abzugleichen war. Der Ort steht seit T-072 fest
  (Dialog „Spalten des Boards" auf S-04 selbst, `BoardScreen.tsx`); die Frage ist damit
  gegenstandslos, und Abschnitt 8 ist vollständig neu geschrieben (E-054/E-055).
- Mehrere Zellen in der Zustandstabelle (Abschnitt 12) markieren Ermessensentscheidungen, die
  nicht wörtlich aus der Spezifikation folgen (z. B. Bestätigungsdialoge, die dort nicht
  ausdrücklich verlangt sind). Diese sind bewusst sichtbar gemacht, nicht heimlich als Vorgabe
  behandelt.
- **Aus T-016, erledigt:** Der Rundungswert für 16 Minuten (`TP-ROUND-07`) ist nicht mehr
  bedingt. Der Auftraggeber hat „Rundung aufwärts" am 2026-08-31 bestätigt (E-008); R-03 ist
  geschlossen. Der Testfall ist jetzt verbindlich, siehe Abschnitt 1.
- **Aus T-016, während der Bearbeitung eingetroffen:** Mehrere Korrekturen des Orchestrators
  kamen ein, nachdem Teile dieses Dokuments bereits geschrieben waren, und sind jeweils an Ort und
  Stelle nachgezogen: die Gruppierung je Todo und Tag (E-020, Abschnitt 1 und neuer Abschnitt 9a),
  die anschließende Festlegung von Mitternachtsregel und Trennzeichen für die zusammengeführten
  Leistungstexte (ebenfalls Abschnitt 9a), und die Richtigstellung, dass „Erledigt" unabhängig von
  der Kanban-Spalte ist (Abschnitt 5 und 8 — eine zwischenzeitlich angenommene „Rückkehr-Spalte"
  nach E-023 existiert nicht und wurde aus allen Testfällen wieder entfernt). Diese Korrekturen
  zeigen, dass dieser Testplan mit dem Wissensstand mehrerer Zeitpunkte innerhalb derselben
  Aufgabe entstanden ist; wo eine spätere Nachricht eine frühere Annahme widerlegt hat, ist die
  frühere Annahme nicht stillschweigend überschrieben, sondern die Korrektur ist im Text sichtbar
  benannt.
- **Weiterhin offen, absichtlich ohne erfundene Erwartung:** `TP-EXPORT-16c` (Tagesgruppe, in der
  alle Leistungstexte leer sind — hängt von einer noch ungeklärten Eigenschaft des
  Abrechnungstools ab). `TP-EXPORT-16a` Zeile 1 hält zusätzlich fest, dass ein Leistungstext, der
  selbst ein Semikolon enthält, bewusst unverändert bleibt (keine Maskierung) — das ist keine
  offene Frage mehr, sondern eine getroffene Festlegung, die hier nur deshalb erwähnt wird, weil
  sie auf den ersten Blick wie eine Lücke aussehen könnte.
- **Nicht ausführbar ohne laufende Anwendung, ausdrücklich benannt statt stillschweigend
  angenommen:** `TP-EXPORT-10` (Ablageorte unter `%LOCALAPPDATA%`/`~/.local/share/takt/`) braucht
  einen tatsächlich laufenden Tauri-Prozess bzw. Sidecar aus T-008; ein reiner Unit-Mock auf eine
  Pfad-Konstante würde nicht prüfen, wo das Betriebssystem tatsächlich schreibt. `TP-ADDIN-13`
  (Token in `localStorage`, nicht in `roamingSettings`) braucht mindestens ein Testdouble für
  Office.js, wenn keine echte Outlook-Umgebung zur Verfügung steht.
- Aus T-005 Abschnitt 4 (`TP-EXPST-09`) sind neun der neunzehn Orte mit sichtbarem Exportstatus
  noch durch keinen anderen Testfall belegt (Dashboard-Kacheln, laufender Timer außerhalb der
  Detail-/Time-Tracking-Ansicht, globale Suche, globale Navigation) — nicht, weil sie unwichtig
  wären, sondern weil der jeweilige Screen-Ausschnitt in den Abschnitten 0–12 bisher nicht auf
  dieser Detailebene behandelt wird. Siehe die Tabelle dort für die genaue Liste.

---

## 14. Nachträge aus T-048 (Klickpfad- und Verhaltensänderungen seit T-035/T-040/T-041/T-045)

Diese Fälle sind neu gegenüber dem Stand von T-016 bzw. präzisieren einen bestehenden Fall. Sie
liegen jetzt als End-to-End-Fälle in `tests/e2e/**` vor (e2e-tester, T-048); der jeweilige Bezug
zu einem bestehenden Abschnitt ist genannt, statt den Fall dort zu duplizieren.

### TP-LOCK-01 — Gesperrter Export: Gesamtvorschau antwortet nicht
**Anforderungen:** A-8.6, T-045 (Blocker aus dem Code-Review). **Ebene:** End-to-End.
**Vorbedingung:** Mindestens zwei offene Tagesgruppen; `POST /export/preview` ist gezielt zum
Scheitern gebracht (im Test über `page.route()`, da der Dienst selbst nicht Testgegenstand ist).
**Schritte:** Eine Gruppe abwählen, sodass die Gesamtvorschau erneut angefragt wird, während die
Route fehlschlägt; danach die Route wieder freigeben und „Erneut versuchen" auslösen.
**Erwartetes Ergebnis:** „Export ausführen" ist gesperrt, solange die Vorschau fehlt; eine
Meldung mit der Ursache aus dem Dienst und einem Weg zurück ersetzt eine geratene Zeilenzahl
(kein `?? 0`, A-8.6). Nach „Erneut versuchen" ist die Schaltfläche wieder frei, die Auswahl
unverändert. Siehe `tests/e2e/export-audit-and-locks.spec.ts`.

### TP-LOCK-02 — Gesperrter Export: Fehlschlag bei bereits offenem Bestätigungsdialog
**Anforderungen:** A-8.6, T-045. **Ebene:** End-to-End.
**Vorbedingung:** Wie `TP-LOCK-01`, aber die Vorschau ist beim Öffnen des Dialogs noch erfolgreich.
**Schritte:** Bestätigungsdialog öffnen (Zustand `ready`); danach die Auswahl ändern, während die
Vorschau-Route fehlschlägt.
**Erwartetes Ergebnis:** Der Bestätigungsdialog verschwindet, sobald die Vorschau den Zustand
`ready` verlässt, und kommt nicht von selbst zurück. Siehe `tests/e2e/export-audit-and-locks.spec.ts`.

### TP-EXPST-10 — Verlauf einer Buchung: Leerzustand bei nie exportiert, Reihenfolge bei mehreren Vorgängen
**Anforderungen:** R-10, E-012, E-047, T-040 (Befund C-01). **Ebene:** End-to-End.
**Vorbedingung a)** eine nie exportierte Buchung; **b)** eine Buchung, die exportiert,
zurückgesetzt und erneut exportiert wurde (in dieser Reihenfolge, siehe `TP-SEC-13`).
**Schritte:** „Verlauf dieser Buchung" öffnen.
**Erwartetes Ergebnis a)** Leerzustand „Für diese Buchung ist nichts protokolliert", kein
Fehlerzustand. **b)** drei Zeilen, jüngste zuerst, mit der Begründung des Zurücksetzens in der
mittleren Zeile. Siehe `tests/e2e/export-audit-and-locks.spec.ts`.

### TP-EXPST-11 — „Nicht abrechnen" ohne Grund: der Verlauf nennt das Feld freiwillig
**Anforderungen:** E-047, T-040 (offene Frage 2b). **Ebene:** End-to-End.
**Vorbedingung:** Eine offene Buchung.
**Schritte:** „Nicht abrechnen" ohne Eintrag im Feld „Grund (freiwillig)" bestätigen; danach
„Verlauf dieser Buchung" öffnen.
**Erwartetes Ergebnis:** Exportstatus `exported`, `exportCount` bleibt 0. Im Verlauf steht „Ohne
Begründung ausgebucht. Das Feld ist freiwillig (E-047) …", nicht eine leere Begründungszeile.
Siehe `tests/e2e/export-mixed-status-and-billing.spec.ts`.

### TP-TAG-07 — Zyklus-Ablehnung im Verschieben-Dialog der Oberfläche, an einem Ordner mit Inhalt
**Anforderungen:** A-4.6, I-08. **Ebene:** End-to-End.
**Vorbedingung:** Vierstufige Ordnerstruktur (wie `TP-TAG-03`).
**Schritte:** Einen Ordner mit Inhalt auswählen (seit T-035 möglich, siehe unten), „Verschieben"
öffnen, einen seiner eigenen Nachfahren als neuen übergeordneten Ordner wählen, absenden.
**Erwartetes Ergebnis:** Der Dialog bleibt offen und zeigt eine Fehlermeldung; der Ordner bleibt
an seinem Platz. Vorher (T-012) nicht ausführbar, weil ein Ordner mit Inhalt über den Baum nicht
auswählbar war — siehe `TP-TAG-08`. Siehe `tests/e2e/tags-folders.spec.ts`.

**Befund (T-060), behoben in T-063 (2026-09-02).** War rot, derselbe Fund wie bei `TP-TAG-03`
(Ark-UI-Umstellung T-059, dort ausführlich beschrieben und behoben). Bestanden.

### TP-TAG-08 — Auswählen und Aufklappen sind getrennt (T-035, Befund aus T-012, behoben)
**Anforderungen:** A-4.2, A-4.4, SC 2.5.8. **Ebene:** End-to-End.
**Schritte:** Auf das Dreieck eines Ordnerknotens klicken; auf den Namen/die Zeile eines Knotens
mit Kindern klicken.
**Erwartetes Ergebnis:** Das Dreieck klappt auf/zu und ändert die Auswahl **nicht**. Klick auf
Namen/Zeile wählt aus, auch bei einem Ordner mit Inhalt. Siehe `tests/e2e/tags-folders.spec.ts`.

### TP-TIME-01 — Tagesgrenze in Ortszeit statt UTC (Code-Review-Befund, T-041)
**Anforderungen:** A-6.6, I-10, Code-Review-Befund (`repo-time.ts`, sechste Doppelung des
Kalendertags). **Ebene:** End-to-End.
**Vorbedingung:** Eine Buchung kurz nach Mitternacht Ortszeit (Ortszeit-Tag und UTC-Tag fallen
auseinander — auf einer Maschine mit positivem UTC-Versatz z. B. 00:00–02:00 Ortszeit).
**Schritte:** Zeitbuchungen (S-06) nach „Ab Tag"/„Bis Tag" filtern: einmal auf den Ortstag der
Buchung, einmal auf den Tag davor.
**Erwartetes Ergebnis:** Die Buchung erscheint nur beim Filter auf ihren tatsächlichen Ortstag,
nie beim UTC-Tag ihres gespeicherten Zeitstempels. Siehe `tests/e2e/calendar-day-boundary.spec.ts`
(dort zusätzlich der im Auftrag genannte Kontrollfall 23:30 Ortszeit).

### TP-TPL-09 — Unzulässige oder doppelte Feldnamen ergeben 422 (T-034/T-046)
**Anforderungen:** A-8.7, TP-SEC-07. **Ebene:** End-to-End (ergänzt die Unit-Ebene von
`TP-SEC-07` um den tatsächlichen Weg über `POST /export/templates`).
**Schritte:** Eine Vorlage mit dem Feldnamen `__proto__` anlegen versuchen; eine Vorlage mit zwei
gleichnamigen Feldern anlegen versuchen; zur Gegenprobe eine gültige, abweichende Vorlage mit
eindeutigen Namen anlegen.
**Erwartetes Ergebnis:** Die ersten beiden Versuche scheitern mit `422` (`validation_error` bzw.
`export_template_invalid`); der dritte gelingt mit `201`. Siehe
`tests/e2e/export-template-validation.spec.ts`.

**Zur Dateihoheit:** Diese Fälle sind über `POST /export/templates` direkt geprüft, nicht über
das manuelle Zusammenklicken im Vorlageneditor (S-14) — das bleibt der in T-012 benannte
Nachtrag „Feldzeilen per Hand hinzufügen, umbenennen, per Ziehen umsortieren", weiterhin offen.

---

## 15. Bauergebnis gegen Entwicklungsserver (T-055, T-060)

**Warum diese Achse eine eigene Nummer bekommt statt in Abschnitt 0–14 aufzugehen.** T-053 hat
den Startfehler des gebündelten Sidecars behoben und dabei die gemeinsame Ursache benannt:
„jeder Nachweis läuft aus dem Quelltext" — auch jeder bisherige End-to-End-Fall in diesem
Bestand. `tests/e2e/support/services.ts` startet `apps/local-api` mit `node
apps/local-api/src/index.ts` (Quelltext) und die Oberfläche mit `vite` (Entwicklungsserver).
Beides ist für alle Fälle in Abschnitt 0–14 richtig und bleibt unverändert — es prüft nur nicht,
was `vite build` tatsächlich ausliefert. Diese Abschnittsnummer bündelt die Fälle, die genau das
zusätzlich messen, mit einer eigenen Ausführungskonfiguration je Bauergebnis (siehe „Siehe"-Zeile
je Fall) statt mit der gemeinsamen `tests/e2e/playwright.config.ts`.

**Ausführungsstand: alle fünf Fälle gelaufen, alle fünf bestanden** (6 Playwright-`test()`-Blöcke,
weil TP-BUILD-05 aus einem Hauptfall und seiner permanenten Gegenprobe besteht), dreifach
wiederholt für `apps/web` und dreifach für `apps/outlook-addin`, jeweils ohne eine einzige
Wiederholung (`retries: 1` in beiden Konfigurationen nie gebraucht). Für drei der fünf Fälle liegt
zusätzlich eine Gegenprobe vor (siehe je Fall) — die beiden anderen (`TP-BUILD-01`/`TP-BUILD-03`,
„stürzt nicht ab") sind ihre eigene Gegenprobe: Vor der Behebung in T-053 wäre genau diese Sorte
Fall („die Anwendung kommt hoch") das gewesen, was gefehlt hat.

**TP-BUILD-05 (T-060) ist neu** und schließt eine Lücke, die bis dahin niemand geprüft hatte: dass
die Musterseite des Designsystems im ausgelieferten Bündel tatsächlich **nicht** erreichbar ist
(Auftraggeber-Vorgabe zu T-057). Anlass war ein Testfall (`TP-BUILD-01`), der bis dahin genau den
umgekehrten, inzwischen abgeschafften Weg geprüft hatte — einen Knopf zur Musterseite, den es seit
T-057 nicht mehr gibt. Einzelheiten beim Fall selbst.

### TP-BUILD-01 — `apps/web`, gebaut und statisch serviert, ohne Hülle: Erklärung statt Absturz
**Anforderungen:** T-053 (offene Frage 3, „gehört gemessen, nicht vermutet"). **Ebene:** End-to-End.
**Vorbedingung:** `pnpm --filter @takt/web build`, danach `vite preview` auf 127.0.0.1:5173 (nicht
4173 — Begründung in `tests/e2e/support/build-check-session.ts`: `ALLOWED_ORIGINS` im Dienst
lässt nur 5173 zu).
**Schritte:** Die Adresse ohne jede Hülle und ohne `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` öffnen
(dieser Umweg funktioniert im Bauergebnis ohnehin nicht mehr — `import.meta.env.DEV` ist dort
fest `false`, `apps/web/src/app/connection.ts#developmentFallback`); danach auf eine unbekannte
Adresse (`#/kaputte-adresse`) wechseln.
**Erwartetes Ergebnis:** `NoShellNotice` erscheint wörtlich („Takt läuft in der Takt-Anwendung"),
`.boot` trägt tatsächlich das ausgelieferte `display: flex`, der Wechsel auf die unbekannte
Adresse bricht nichts (`router.ts#parseRoute` fällt auf die Startroute zurück), keine
`pageerror`/`console`-Fehler.
**Befund:** Bestanden, dreifach. Die Lücke aus T-053 betrifft `apps/web`s eigenes Bündel **nicht**
— das Bauergebnis lädt vollständig und degradiert kontrolliert, statt abzustürzen oder leer zu
bleiben. Gegenprobe: Hauptskript per `page.route()` blockiert → rot mit demselben Zeitüberschreitungsfehler,
den ein tatsächlich gebrochenes Bündel gezeigt hätte; Datei danach byteidentisch
wiederhergestellt (`diff`). Siehe `tests/e2e/web-build-smoke.spec.ts`,
`tests/e2e/playwright.web-build.config.ts`.

**Geändert in T-060:** Bis dahin war der zweite Beleg ein Klick auf „Designsystem ansehen" in
`NoShellNotice` mit anschließender Erwartung von `.designsystem-frame`. T-057 hat genau diesen
Weg auf Auftrag des Auftraggebers geschlossen (kein Knopf, keine Route, keine Navigation mehr zur
Musterseite) — der Fall hätte nie wieder bestehen können, ohne dass das etwas über das Bündel
aussagt. Ersetzt durch zwei von der Musterseite unabhängige Belege (Vorschlag aus
`.claude/team/reports/T-057-frontend-dev.md`): die tatsächlich angewendeten Stile (`.boot`) und
ein Wechsel auf eine unbekannte Adresse, der im minimierten Routing-Code nichts zum Einsturz
bringt. Geprüfter Gegenstand unverändert: lädt das Bündel, funktioniert es, statt abzustürzen.

### TP-BUILD-05 — `apps/web`, gebaut: die Musterseite des Designsystems ist nicht erreichbar (T-060)
**Anforderungen:** Auftraggeber-Vorgabe zu T-057 („Der Zugriff … soll … nicht mehr über die
normale Anwendung erreichbar sein"). **Ebene:** End-to-End.
**Vorbedingung:** Wie `TP-BUILD-01` — derselbe, mit `TAKT_DESIGNSYSTEM` ausdrücklich aus der
Bauumgebung entfernte Bau (`tests/e2e/support/web-build-services.ts#buildWeb`), damit die
Vorbedingung nicht von einer zufällig gesetzten Variable im Prozessbaum abhängt.
**Schritte:** `apps/web/dist` auf `designsystem.html` und Showcase-Textreste durchsuchen;
`/designsystem.html` sowohl über eine reine HTTP-Anfrage als auch im Browser öffnen und mit `/`
vergleichen; zur Gegenprobe denselben Bau mit `TAKT_DESIGNSYSTEM=1`
(`pnpm --filter @takt/web build:designsystem`) wiederholen.
**Erwartetes Ergebnis:** Ohne die Variable: keine `designsystem.html` im Bündel, keine
Showcase-Zeichenkette irgendwo in `dist`, `/designsystem.html` liefert byteidentisch dieselbe
Antwort wie `/` und zeigt im Browser dieselbe `NoShellNotice`, nicht die Musterseite. Mit der
Variable: Die Datei entsteht tatsächlich; der nächste gewöhnliche Bau lässt sie wieder
verschwinden.
**Befund:** Bestanden. **Gemessen statt geglaubt (Fund dieser Aufgabe):** `vite preview`s
SPA-Rückfall antwortet auf **jede** unbekannte Adresse mit `200` und dem Inhalt von `index.html`
— unabhängig von der Dateiendung (nachgemessen: auch `GET /irgendwas.js` → `200`, `text/html`).
Ein Fall, der hier nur den Statuscode geprüft hätte, wäre unabhängig vom tatsächlichen Zustand der
Musterseite immer grün gewesen — deshalb prüft dieser Fall den Antwortinhalt, nicht den Code. Als
Nebenbefund: `apps/web/index.html`s `<title>` lautet bereits „Takt — Designsystem" (nicht erst
`designsystem.html`s Titel) — vermutlich ein Kopierfehler beim Anlegen des zweiten
Einstiegspunkts in T-057, hier nicht behoben (`apps/web/**` liegt nicht in dieser Dateihoheit),
aber gemeldet. Siehe `tests/e2e/web-build-smoke.spec.ts`,
`tests/e2e/support/web-build-services.ts`.

### TP-BUILD-02 — `apps/web`, gebaut, mit nachgebildeter Hülle: TP-TIMER-01/02 (S-03) läuft echt
**Anforderungen:** I-05, T-053 (offene Frage 3). **Ebene:** End-to-End.
**Vorbedingung:** Wie `TP-BUILD-01`; zusätzlich `page.addInitScript(installTauriShim, …)` bildet
`window.__TAURI_INTERNALS__.invoke` für `takt_service_handshake`/`takt_shell_state`/`takt_quit`
nach (`tests/e2e/support/tauri-shim.ts`) — der lokale Dienst selbst läuft echt, aus dem
Quelltext, wie in jedem anderen Fall dieses Bestands.
**Schritte:** Derselbe Ablauf wie `TP-TIMER-01`/`TP-TIMER-02` (Abschnitt 5), Startpunkt S-03:
Todo anlegen, als erledigt markieren, Todo-Detailansicht öffnen, Timer starten.
**Erwartetes Ergebnis:** „Erledigt" wird zu „Erledigt aufgehoben", der Kanban-Status bleibt
unverändert (E-023) — geprüft über dieselbe API wie in Abschnitt 5, nicht nur an der Oberfläche.
**Befund:** Bestanden, dreifach. Belegt, dass der im Bündel neu aufgeteilte und minimierte
Code (u. a. der dynamisch geladene `shell-*.js`-Chunk aus `apps/desktop/src/shell.ts`) sich
funktional nicht vom Entwicklungsbetrieb unterscheidet, sobald eine Hülle vorhanden ist. Siehe
`tests/e2e/web-build-smoke.spec.ts`.

### TP-BUILD-03 — `apps/outlook-addin`, gebaut und über den echten Aufgabenbereich-Server ausgeliefert
**Anforderungen:** E-046, T-053 (offene Frage 3, dort als „wahrscheinlicherer" der beiden Fälle
benannt). **Ebene:** End-to-End.
**Vorbedingung:** `pnpm --filter @takt/outlook-addin build`; das Ergebnis wird über den echten,
unveränderten `startTaskpaneServer()` aus `apps/local-api/src/taskpane/server.ts` (T-053)
ausgeliefert — über echtes TLS, mit selbst erzeugtem Zertifikat, auf Port 17944 statt des
produktiven 17844 (Begründung: parallel laufende Team-Agenten könnten 17844 belegt halten,
wie schon in `apps/local-api/scripts/proof-taskpane.mjs`).
**Schritte:** Die Adresse ohne Office-Wirt öffnen.
**Erwartetes Ergebnis:** Das Bündel lädt vollständig (Kopfleiste „Takt", keine
`pageerror`/relevanten `console`-Fehler) und zeigt einen der beiden vorgesehenen Zustände aus
`office/host.ts`/`App.tsx#Body` — welchen, hängt von der Erreichbarkeit von
`appsforoffice.microsoft.com` ab (siehe Befund) und ist nicht Gegenstand dieses Falls.
**Befund:** Bestanden, dreifach. **Messung statt Annahme:** Diese Maschine erreicht
`appsforoffice.microsoft.com` tatsächlich; `office.js` lädt, `Office.onReady()` löst innerhalb
der 5-Sekunden-Grenze auf, aber `Office.context.mailbox.item` bleibt ohne echtes Outlook-Fenster
`undefined` — der Zustand ist deshalb `no_item` („Keine E-Mail geöffnet"), nicht `no_host`
(„Kein Outlook"), wie zunächst angenommen und durch den Lauf selbst widerlegt. Ein zweiter,
unabhängig davon gemessener Befund: Chromium meldet `The Content Security Policy directive
'frame-ancestors' is ignored when delivered via a <meta> element.` — eine allgemeine
Browsereigenschaft von `<meta http-equiv="Content-Security-Policy">` (nur ein echter HTTP-Kopf
wendet `frame-ancestors`/`sandbox` an), unverändert seit vor dieser Aufgabe und identisch im
Entwicklungsbetrieb, also kein Fund dieser Aufgabe. Siehe `tests/e2e/outlook-addin-build.spec.ts`,
`tests/e2e/playwright.outlook-build.config.ts`.

### TP-BUILD-04 — `apps/outlook-addin`, gebaut: der Web-Worker-Chunk der Call-Nummer-Erkennung
**Anforderungen:** B-4.1, T-053 (offene Frage 3). **Ebene:** End-to-End.
**Vorbedingung:** Wie `TP-BUILD-03`.
**Schritte:** Einstellungen öffnen (Zahnrad); im Testbereich aus S-13 mit unverändertem
Vorgabemuster und -Beispieltext „Ausdruck auf den Beispieltext anwenden" klicken.
**Erwartetes Ergebnis:** „Erkannt", Wert `TCK-000042` — das setzt voraus, dass
`new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`
(`callnumber/browser-channel.ts`, die einzige Stelle im Add-in, die `new Worker(...)` aufruft) im
Bauergebnis tatsächlich lädt: Vite erzeugt dafür einen eigenen Chunk
(`assets/worker-*.js`), dessen Ladeweg sich vom Entwicklungsbetrieb bekanntermaßen unterscheidet.
**Befund:** Bestanden, dreifach — der wahrscheinlichste vermutete Fund dieser Aufgabe hat sich
**nicht** bestätigt. **Gegenprobe:** `**/assets/worker-*.js` per `page.route()` blockiert → rot
(„Erkannt"-Callout bleibt aus, Zeitüberschreitung); Datei danach byteidentisch wiederhergestellt
(`diff`). Siehe `tests/e2e/outlook-addin-build.spec.ts`.

### Was diese Fälle nicht abdecken (Grenze, keine Auslassung)

**Die `.AppImage` selbst, mit Playwright gegengeprüft: nicht gelaufen.** Zwei getrennte Gründe,
beide unabhängig voneinander hinreichend:

1. **Playwright kann eine laufende Tauri-Anwendung unter Linux nicht ansteuern.** Tauri bettet
   keinen Chromium ein, sondern den systemeigenen WebView (unter Linux WebKitGTK — mit `ldd`
   gegen das vorhandene, allerdings veraltete `Takt_0.0.0_amd64.AppImage` geprüft:
   `libwebkit2gtk-4.1.so.0`). Playwright hat für Electron eine eigene, dokumentierte Andockstelle
   (`_electron`, `ElectronApplication` — geprüft in den Typdefinitionen von `playwright-core`,
   weil Electron Chromium mitbringt und darüber das Chrome DevTools Protocol spricht); für
   WebKitGTK/Tauri gibt es keine solche Stelle, weder in den Typdefinitionen noch in der
   Dokumentation. Playwrights eigener „webkit"-Browser ist ein von Playwright selbst gestarteter,
   gepatchter WebKit-Build mit einem eigenen Treiberprotokoll — kein generisches Andocken an einen
   fremden, bereits laufenden WebKitGTK-Prozess.
2. **Das vorhandene `Takt_0.0.0_amd64.AppImage` ist veraltet** (gebaut 01.09. 04:09 Uhr, also vor
   den T-053-Behebungen ab 20:20 Uhr desselben Tages) **und `apps/desktop` steht während dieser
   Aufgabe unter aktiver Bearbeitung** (frontend-dev, neue `taskpane`-Bauschritte in
   `apps/desktop/package.json`, live während dieser Aufgabe beobachtet). Ein Neubau jetzt liefe
   gegen ein bewegliches Ziel und widerspräche der Dateihoheit („apps/\*\* nicht anfassen, der
   frontend-dev arbeitet gerade an apps/desktop"). Ein Neubau war deshalb nicht nur unnötig
   (Grund 1 macht das Ergebnis für Playwright ohnehin nicht ansteuerbar), sondern in dieser
   Aufgabe auch nicht angebracht.

Das Gegenstück, das stattdessen ginge — die AppImage tatsächlich starten und ihre beiden Ports
**ohne** Playwright, per HTTP/HTTPS-Anfrage von außen prüfen (kommt der Dienst hoch? antwortet der
Aufgabenbereich?) —, ist aus Grund 2 ebenfalls nicht gelaufen, wäre aber technisch möglich und
bliebe der naheliegende nächste Schritt, sobald `apps/desktop` wieder unbeteiligt ist.

---

## 16. Nachträge aus T-063 (Ark-UI-Umstellung nachgezogen, die Tag-Eingabe neu geprüft)

T-059 (Ark UI) ist abgeschlossen. Die fünf Fälle, die T-060 als „aktuell rot, Umstellung läuft
noch" gemeldet hatte (`TP-NOTE-01`, zwei Läufe von `TP-NOTE-02/03`, `TP-TAG-03`, `TP-TAG-07`), sind
in T-063 nachgezogen worden — Befunde direkt bei den jeweiligen Fällen oben aktualisiert, nicht
verdoppelt. Zwei weitere Änderungen aus derselben Umstellung trafen keinen bestehenden Fall: Menü-
einträge tragen jetzt `data-highlighted` statt `data-active` (kein Testfall in `tests/e2e/**` griff
auf dieses Attribut zu — geprüft per Suche über den gesamten Bestand); die Chip-Wand `.tag-picker`
im Todo-Dialog gibt es nicht mehr (kein bestehender Fall referenzierte sie).

**Neu und vorher entweder gar nicht möglich oder gar nicht geprüft:** die Tag-Eingabe
(`apps/web/src/components/TagInput.tsx`) ist seit T-059 **eine** Komponente an vier Stellen (Todo-
Dialog, Standard-Tags S-10, Poolregel S-11, Todo-Filter S-02) statt vier verschiedener Bauarten.
Zwei davon hatten vorher keine funktionierende Bedienung (Todo-Filter: gar kein Bedienelement;
Poolregel: hart auf 40 Tags gekappt). `tests/e2e/tag-input.spec.ts` ist neu und deckt das ab, dazu
den vom frontend-dev gemeldeten, bis dahin unbewiesenen Fund zur zugeklappten Liste. Pool-Regel
(S-11) selbst ist **nicht** eigens geprüft — sie teilt sich denselben Baustein mit den vier hier
geprüften Stellen, das Restrisiko einer stellenspezifischen Regression ist klein, aber nicht null
(siehe Bericht zu T-063).

### TP-TAG-09 — Vorschläge folgen derselben Namensregel wie der Dienst
**Anforderungen:** A-4.1, A-4.4, T-059 (Punkt 6 des T-059-Berichts). **Ebene:** End-to-End.
**Vorbedingung:** Zwei Tags mit unterscheidbaren Namen, einer davon mit einem Buchstaben, der eine
eigene Groß-/Kleinschreibung kennt (`ß`), im Todo-Dialog.
**Schritte:** In der Tag-Eingabe des Todo-Dialogs nacheinander eingeben: den echten Namen in
Kleinschreibung; denselben Namen mit umgebenden Leerzeichen (und dabei tatsächlich auswählen); den
zweiten echten Namen exakt geschrieben; denselben Namen mit `ß` durch `ss` ersetzt.
**Erwartetes Ergebnis:** Die ersten drei Eingaben zeigen das jeweils vorhandene Tag als Vorschlag
und bieten kein Anlegen an — `tagNameKey` aus `packages/domain` behandelt Groß-/Kleinschreibung und
umgebende Leerzeichen als gleich. Die vierte Eingabe bietet stattdessen das Anlegen eines **neuen**
Tags an und zeigt das `ß`-Tag nirgends als Treffer — `Straße` ≠ `Strasse`, dieselbe Unterscheidung
wie im Dienst. **Ergebnis: bestanden**, dreifach wiederholt. Siehe `tests/e2e/tag-input.spec.ts`.

### TP-TAG-10 — ein neuer Tagname entsteht beim Anlegen eines Todos in derselben Transaktion
**Anforderungen:** A-4.1, E-052, T-058, T-059 (Punkt 8 des T-059-Berichts). **Ebene:** End-to-End.
**Vorbedingung:** Ein noch nicht vergebener Tagname.
**Schritte:** Im Todo-Dialog einen neuen Namen in die Tag-Eingabe tippen, das Angebot „als neues
Tag anlegen" auswählen, das Todo speichern.
**Erwartetes Ergebnis:** Vor dem Speichern existiert das Tag im Dienst noch nicht (`GET /tags`);
der Chip trägt bereits die drei Merkmale eines noch nicht angelegten Tags (gestrichelte Kontur,
Pluszeichen, Wort „neu"). Nach dem Speichern: Der Erfolgs-Toast nennt das neu angelegte Tag beim
Namen, das Tag existiert auf der Wurzelebene, und das gespeicherte Todo trägt seine Kennung.
**Ergebnis: bestanden**, dreifach wiederholt. Siehe `tests/e2e/tag-input.spec.ts`.

### TP-TAG-11 — Todo-Filter (S-02) nimmt jetzt ein Tag entgegen
**Anforderungen:** A-3.4, I-10, T-059 (Punkt 5 des T-059-Berichts: „vorher gar nichts"). **Ebene:**
End-to-End.
**Vorbedingung:** Zwei Todos mit je einem eigenen, unterscheidbaren Tag.
**Schritte:** In der Todo-Liste über die Tag-Eingabe im Filter eines der beiden Tags auswählen;
danach den aktiven Filter über sein eigenes Entfernen-Symbol wieder loswerden.
**Erwartetes Ergebnis:** Nach der Auswahl zeigt die Liste nur das zum Tag passende Todo, der aktive
Filter ist als Chip sichtbar (I-10). Nach dem Entfernen erscheinen wieder beide Todos.
**Ergebnis: bestanden**, dreifach wiederholt. Siehe `tests/e2e/tag-input.spec.ts`.

### TP-TAG-12 — Standard-Tags (S-10): auswählen aus dem Bestand, kein Anlegen
**Anforderungen:** A-9.1, T-059 (Punkt 7 des T-059-Berichts: `allowCreate` nur im Todo-Dialog).
**Ebene:** End-to-End.
**Vorbedingung:** Ein vorhandenes Tag, das noch kein Standard-Tag ist.
**Schritte:** In den Einstellungen (Bereich „Standard-Tags") das Tag über die Tag-Eingabe
auswählen und speichern.
**Erwartetes Ergebnis:** Der Vorschlag zeigt das vorhandene Tag, kein Angebot zum Anlegen erscheint
an dieser Stelle (anders als im Todo-Dialog). Nach dem Speichern führt `GET
/settings/default-tags` das Tag tatsächlich. **Ergebnis: bestanden.** Ursprünglicher Bestand der
Standard-Tags nach dem Fall wiederhergestellt (geteilte, globale Einstellung). Siehe
`tests/e2e/tag-input.spec.ts`.

### TP-TAG-13 — geschlossenes Auswahlfeld bleibt für Tastatur und Vorlesehilfen unsichtbar (Fund des frontend-dev, T-059)
**Anforderungen:** SC 2.1.1, SC 4.1.2, T-059 (Punkt 2, „Drittens": `[hidden]` wurde von
`.select__content { display: flex }` überschrieben, in `base.css` mit einer eigenen
`!important`-Regel behoben, bis T-063 nicht geprüft). **Ebene:** End-to-End.
**Vorbedingung:** Ein Dialog mit mindestens zwei Auswahlfeldern hintereinander (Todo-Dialog:
Statusspalte, danach Tags).
**Schritte:** Das erste, geschlossene Auswahlfeld fokussieren, ohne es zu öffnen; die zugehörige,
über `aria-controls` benannte Liste auf das `hidden`-Attribut prüfen; Tabulatortaste drücken.
**Erwartetes Ergebnis:** Die geschlossene Liste trägt tatsächlich `hidden` (nicht nur
`data-state="closed"` am Auslöser) und ist unsichtbar. Der nächste Tabulatorschritt landet auf dem
folgenden Feld, nicht in der (eigentlich unsichtbaren) Optionsliste — weder der Browser-Fokus noch,
stellvertretend geprüft, ein Tabulator-Durchlauf zeigt ein Element innerhalb der geschlossenen
Liste als Ziel. **Ergebnis: bestanden**, dreifach wiederholt. Siehe `tests/e2e/tag-input.spec.ts`.

**Nicht gelaufen, aus dieser Aufgabe heraus nicht überprüfbar:** eine echte Vorlesehilfe
(NVDA/JAWS/Orca) tatsächlich mitschneiden, ob sie die geschlossene Liste ansagt. Der Fall oben
prüft den DOM-Zustand, von dem dieses Verhalten abhängt (`hidden`, keine Tab-Erreichbarkeit), nicht
die Ansage selbst — das ist eine Grenze der Werkzeugausstattung, keine Auslassung im Test.

---

## 17. Nachträge aus T-096 (Welle B nach R-1/R-3 — Ordnersperre, leerer Ordner in einer Regel)

Grundlage: `decisions.md` E-057 (Ordnerterm ohne Treffer ist eine Einschränkung, kein
Neutralwert) und der R-1-Befund aus der Review-Runde, behoben in T-089 (Migration 0012,
`pool_rule.tag_id`/`folder_id` von `CASCADE` auf `RESTRICT`, `tag_in_use` mit `details`). Beide
Fälle unten sind **neu und bestanden**, dreifach nachgemessen über `pnpm run test:e2e` (37/37,
Exitcode 0). Der von T-094 parallel umgebaute Bewegungssatz (Hauptanwendung gegen Add-in) ist
ausdrücklich **nicht** Teil dieser Welle — er wäre hier zwangsläufig rot, siehe „Für Welle C
zurückgestellt" am Ende dieses Abschnitts.

### TP-KANBAN-06 — Ein leerer Ordner in der Regel: die Spalte trifft nichts und sagt es (E-057)
**Anforderungen:** A-3.4, A-4.2, E-057
**Ebene:** End-to-End (`tests/e2e/kanban.spec.ts`)
**Vorbedingung:** Ein leerer Tag-Ordner (kein Tag darin); ein eigener Statuswert; ein Todo mit
genau diesem Status, ohne Tags.
**Schritte:**
1. Über die Oberfläche eine Board-Spalte anlegen, deren Regel **zwei** Achsen kombiniert: den
   leeren Ordner als „Erforderliche Ordner" und den Statuswert als „Status" — bewusst zwei
   Achsen und nicht nur den Ordner allein, damit der Fall geprüft wird, den E-057 eigentlich
   meint: Ein leerer Ordnerterm **neben** einer für sich genommen erfüllbaren Achse verschwindet
   nicht als Neutralwert, sondern lässt die ganze Regel nichts treffen (`RulePickers.tsx`,
   `FolderPicker`/`StatusPicker`, über `tests/e2e/support/actions.ts`, `createBoardColumn`).
2. Spalte betrachten.
3. Ein Tag im betroffenen Ordner anlegen und dem Todo zuweisen.
4. Spalte erneut betrachten (nach Neuladen).
**Erwartetes Ergebnis:** Nach Schritt 2 trifft die Spalte nichts — der Leerzustand
(`BoardColumnEmpty`) zeigt „Der geforderte Ordner enthält kein Tag" und nennt den Ordner beim
Namen, nicht den allgemeinen Zustand „keine Karte trifft diese Regel"; dieselbe Auskunft steht
bereits unter dem Spaltenkopf an der Regelvorschau selbst (`RuleSummary`,
`describeRuleReach`: „kein Tag darin" am Chip, „… trifft damit nichts" im Satz darunter). Das
Todo mit dem passenden Status landet **trotzdem nicht** in der Spalte — der leere Ordner
schränkt ein, unabhängig davon, dass die Statusachse erfüllt wäre. Nach Schritt 3 löst sich der
Ordnerterm auf; die Karte erscheint, und der Leerzustand ist weg.

**Befund während der Umsetzung, behoben.** Die Tag-Zuweisung an das Todo lief für diesen Fall
bewusst über die API (`support/api.ts`, `setTodoTags`) und nicht über den Bearbeiten-Dialog —
beides ist als Vorbereitung zulässig (das eigentliche Verhalten der Bearbeiten-Dialog-Zuweisung
prüft bereits `TP-KANBAN-01`). Genau das deckte einen zweiten, unabhängigen Befund auf: Ein
zweiter `page.goto()` auf **dieselbe** bereits offene Route (`#/kanban` → `#/kanban`, ohne
zwischenzeitliche Navigation auf eine andere Route) löst in dieser Oberfläche **keine** neue
Anfrage aus — dasselbe Muster wie in `TP-KANBAN-04`, wo `markTodoDone` über die API am
`bump()`-Mechanismus der Oberfläche vorbeiläuft. Der Testfall benutzt deshalb nach der
API-Zuweisung `page.reload()` statt eines zweiten `gotoBoard()`. Das ist eine Eigenschaft der
Testvorbereitung (eine Änderung an der Oberfläche vorbei verlangt ein ausdrückliches Neuladen),
keine Regression der geprüften Funktion selbst — mit der echten Bearbeiten-Dialog-Zuweisung
(`TP-KANBAN-01`) navigiert die Oberfläche ohnehin über eine andere Route und lädt frisch.
**Ergebnis: bestanden**, dreifach wiederholt.

### TP-TAG-14 — Ein Ordner in einer Regel ist nicht löschbar (409 `tag_in_use`, R-1 Befund 1 / T-089)
**Anforderungen:** A-3.2, A-3.4, A-4.2, E-057
**Ebene:** End-to-End (`tests/e2e/tag-folder-rule-lock.spec.ts`), ein Fall davon zusätzlich als
Integrationsprobe direkt über die API (wie `TP-TPL-08`/`export-template-validation.spec.ts`)
**Vorbedingung:** Ein Ordner, der als erforderlicher Term in einer Regel (Pool oder
Kanban-Spalte) steht; ein zweiter Ordner ohne jeden Regelbezug, als Gegenprobe.
**Schritte:**
1. Über die API direkt `DELETE /tag-folders/{id}` auf dem in der Regel stehenden Ordner
   aufrufen.
2. Denselben Aufruf ein zweites Mal, ohne zwischenzeitliche Änderung.
3. `DELETE /tag-folders/{id}` auf dem Ordner ohne Regelbezug.
4. Über die Oberfläche (S-08): den in der Regel stehenden Ordner auswählen, „Löschen" auslösen,
   im Bestätigungsdialog erneut „Löschen" bestätigen.
5. Dialog mit „Abbrechen" schließen, Tags-Ansicht neu aufsuchen.
**Erwartetes Ergebnis:** Schritt 1 und 2 antworten `409` mit dem Fehlerschlüssel `tag_in_use`;
`details` enthält mindestens einen Eintrag mit `code: "pool_rule"`, der Kennung des Pools in
`field` und seinem Namen in Anführungszeichen in `message` — beides maschinenlesbar und für die
Oberfläche verwertbar. Schritt 3 antwortet mit Erfolg (204) — ein Ordner ohne Regelbezug bleibt
löschbar, dieselbe Sperre trifft nicht jeden Ordner. Schritt 4: Der Bestätigungsdialog schließt
**nicht** und zeigt den vom Dienst gelieferten Grund („Dieser Ordner wird in der Regel eines
Pools verwendet."). Nach Schritt 5 ist der Ordner weiterhin im Tag-Baum vorhanden — die Ablehnung
hat nichts verändert.

**Zur Erwartung „Regelname in der Oberfläche" aus dem Auftrag — abweichend gemessen, nicht
stillschweigend gelockert.** Der Auftrag benannte die Erwartung „die Oberfläche zeigt den
Regelnamen in der Fehlermeldung (wie bei `status_in_use`)". Nachgesehen im Quelltext:
`TaktApiError.details` (`apps/web/src/api/client.ts`) wird im gesamten `apps/web`-Baum an keiner
einzigen Stelle gelesen — weder für `tag_in_use` (`TagsScreen.tsx`, `deleteError` ist schlicht
`cause.message`) noch für das namensgleiche Vorbild `status_in_use`
(`StatusSettings.tsx`, `errorMessage(cause)`, ebenfalls nur die allgemeine Dienstmeldung ohne
Namen). Beide Flächen zeigen heute denselben generischen Satz ihres jeweiligen Fehlerschlüssels,
aber **nicht** den konkreten Regelnamen aus `details` — die Auskunft liegt seit T-089 vollständig
vor (Kennung und Name je Regel), nur die Oberfläche liest sie noch nicht. Dieser Testfall prüft
deshalb genau den tatsächlichen, stabilen Stand (Sperre greift sichtbar, Grund wird genannt,
Ordner bleibt erhalten) und behauptet nicht mehr, als der Quelltext hergibt — ein wissentlich
rot geschriebener Fall widerspräche dem Auftrag „nur die stabilen Fälle". Die Lücke ist eine
offene Frage an den Orchestrator/frontend-dev, keine Auslassung dieses Testfalls.
**Ergebnis: bestanden**, dreifach wiederholt.

### Nachgezogener Kommentar: `tests/e2e/support/actions.ts` (T-091, `RadioRow`-Umbau)

Der Kommentar über der `completion`-Auswahl in `createBoardColumn` beschrieb noch die vor T-091
gültige Bauform von `RadioRow` — der erklärende Hinweistext stand bis dahin **im** `<label>`,
wodurch der zugängliche Name „Erledigt Nur erledigte Todos. …" statt schlicht „Erledigt" lautete.
Seit T-091 hängt der Hinweis als Geschwister der Optionsliste über `aria-describedby` an jedem
Knopf; der zugängliche Name ist wieder nur das Wort selbst. Der Kommentar ist berichtigt, das am
Anfang verankerte Muster (`/^Erledigt\b/`) bleibt unverändert stehen — es traf schon vor T-091
genau einen Knopf, weil „Unerledigt" nicht mit „Erledigt" **beginnt**, sondern nur damit endet,
und trifft ihn nach der Berichtigung unverändert. Kein eigener Testfall, weil `TP-KANBAN-01` bis
`TP-KANBAN-06` diesen Zugriff bei jedem Lauf mitprüfen.

### Für Welle C zurückgestellt (nicht in dieser Welle geschrieben, absichtlich)

Zwei Fälle sind im Auftrag zu T-096 ausdrücklich ausgenommen, weil sie mit dem Wortlaut aus
E-058 Punkt 4 arbeiten, den `T-093`/`T-094` zum Zeitpunkt dieser Welle erst umbauen — ein hier
geschriebener Fall wäre zwangsläufig rot, keine Auslassung:

- **TP-EXPST-12 (Arbeitstitel) — Bewegungssatz Hauptanwendung gegen Add-in.** Derselbe
  Timerstart, einmal über die Hauptanwendung (`Timer.tsx`/`TimerContext.tsx`,
  `poolMovementSentence(movement, 'past', …)`) und einmal über das Add-in
  (`duplicate/reopen.ts`), muss zeichengleich denselben Satz melden — die Eigenschaft, für die
  E-058 überhaupt geschrieben wurde. Geplant für Welle C, nach T-094 (`docs/testplan.md`,
  Board-Eintrag T-096).
- **TP-TIMER-08 (Arbeitstitel) — Stopp-Antwort trägt `poolMovement`.** `POST /timer/stop` und
  `POST /timer/orphaned/resolve` liefern seit T-093 `poolMovement` mit Anlass `booking`
  (E-058 Punkt 6); die Oberfläche bindet die Stopp-Antwort laut Board-Eintrag T-094 aber
  „noch **nicht**" an — das ist Gegenstand von Welle C. Ein Testfall, der die Anzeige nach dem
  Stoppen prüft, wäre bis dahin zwangsläufig rot.
