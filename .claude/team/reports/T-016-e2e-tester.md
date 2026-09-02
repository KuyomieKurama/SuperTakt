Aufgabe: T-016 — Testplan um die Funde aus Welle 1 und die bestätigten Entscheidungen ergänzen
Status: fertig
Artefakte:
- `docs/testplan.md` (überarbeitet und erweitert)
- `.claude/team/reports/T-016-e2e-tester.md` (dieser Bericht)

Gesamtzahl der Fälle: vorher 82 einzeln benannte Testfälle in den Abschnitten 0–11 (Zählweise wie
im T-002-Bericht), plus 14 Zeilen der separat gezählten Zustandsmatrix (Abschnitt 12) — macht 96
inklusive. Nachher 125 in den Abschnitten 0–11 plus dem neuen Abschnitt 9a (Gruppierung) und dem
neuen Abschnitt 13 (Bedrohungsmodell-Prüfungen), plus die unveränderte Zustandsmatrix (14) — macht
139 inklusive. Zuwachs: 43 neue oder wesentlich umgeschriebene Fälle, dazu mehrere bestehende
Fälle mit erweiterten Zusicherungen ohne neue ID (siehe unten).

Zusammenfassung:

Zwei mitten in der Bearbeitung eingetroffene Korrekturen des Orchestrators haben den Auftrag
inhaltlich verändert, nachdem Teile bereits geschrieben waren. Beide sind im Dokument an Ort und
Stelle nachgezogen und ausdrücklich als Korrektur benannt, nicht stillschweigend überschrieben:

1. **Rundung wird pro Todo und Tag gruppiert, nicht mehr je Buchung** (E-020, abgelöst von der
   vorläufigen „je Buchung"-Fassung). Abschnitt 1 ist umgeschrieben (die reine Rundungsfunktion
   bleibt unverändert testbar, nur was ihr übergeben wird, ändert sich), und ein neuer Abschnitt
   9a mit sieben Kernfällen (`TP-EXPORT-11` bis `-17`) plus vier Zusatzfällen zu Mitternacht,
   Trennzeichen und Segment-Rändern (`TP-EXPORT-15a`, `-16a` bis `-16d`) deckt die Gruppierung,
   ihr Zusammenspiel mit dem Exportstatus (R-10 wird dadurch schärfer) und die Randfälle ab.
   Zwei Folgefragen kamen im Lauf der Aufgabe noch zur Antwort: der Starttag zählt bei einer
   Buchung über Mitternacht vollständig (`TP-EXPORT-15`), und die Leistungstexte werden ohne
   jedes Escaping — Randnormalisierung, dann „; "-Verbindung, leere Segmente übersprungen — nie
   zurückgeparst (`TP-EXPORT-16`, `-16a`). Offen bleibt einzig der Fall, in dem alle Segmente
   einer Tagesgruppe leer sind (`TP-EXPORT-16c`) — das hat der Orchestrator selbst so gelassen,
   weil es von einer ungeklärten Eigenschaft des Abrechnungstools abhängt.
2. **„Erledigt" ist unabhängig von der Kanban-Spalte.** Eine zwischenzeitlich vom Orchestrator
   weitergegebene „Rückkehr-Spalte" (E-023) existiert laut ausdrücklicher Richtigstellung des
   Auftraggebers nicht. Ich hatte `TP-TIMER-04` bis `-06` bereits um diese Annahme erweitert und
   einen eigenen `TP-TIMER-08` dafür angelegt — beides ist wieder vollständig entfernt. Stattdessen
   prüfen zwei neue Fälle (`TP-KANBAN-05`, `-06`) ausdrücklich, dass Erledigt-Status und
   Kanban-Spalte unabhängige, gleichzeitig beliebig kombinierbare Zustände sind und dass Setzen/
   Aufheben von Erledigt die Spalte nicht verschiebt. **Hinweis für die zuständige Stelle:** In
   `.claude/team/decisions.md` steht E-023 weiterhin als Entscheidung mit Auftraggeber-Zitat. Das
   widerspricht der mir mitgeteilten Richtigstellung. Ich kann und darf `decisions.md` nicht
   ändern (nicht meine Dateihoheit) — das muss dort korrigiert oder als abgelöst markiert werden,
   sonst zeigen Testplan und Entscheidungsprotokoll widersprüchliche Wahrheiten.

Die zehn Auftragspunkte im Einzelnen:

1. **R-18 (wichtigster Nachtrag).** Der Fall, der den Marker nur im Klartext gesucht hätte, war
   `TP-NOTE-02` (Volltextprüfung), nicht `TP-NOTE-04` wie im Auftrag benannt — `TP-NOTE-04` ist im
   Dokument der API-Umgehungstest, kein Textsuchtest. Ich habe `TP-NOTE-02` umgeschrieben: er
   sucht jetzt den Todo-Marker im Klartext **und** base64-kodiert, über drei Vorlagen, mit zwei
   Buchungen desselben Tages (damit die Zusammenführung aus E-020 mitgeprüft wird). `TP-NOTE-03`
   (Vorschau) ist entsprechend um dieselbe doppelte Suche erweitert. Beides verweist ausdrücklich
   auf Prüfung 8 aus `docs/bedrohungsmodell.md` Abschnitt 7.
2. **R-17.** Zwei neue Fälle: `TP-EXPORT-07` (Integration, Vorschau- und Schreibfunktion
   programmatisch gegeneinander vergleichen) und `TP-EXPORT-08` (End-to-End, S-07 und S-14 gegen
   die tatsächliche Datei). `TP-TPL-06`/`-07` verweisen darauf, statt sie zu duplizieren.
   `TP-EXPORT-16d` prüft dasselbe zusätzlich für die Segmentgrenzen der Gruppierung.
3. **R-15.** `TP-ADDIN-02` ist um die Zusicherung erweitert, dass Titel und Call-Nummer vor der
   Bestätigung angezeigt werden. Zwei neue Fälle: `TP-ADDIN-10` (Muster `.*`, kein automatisches
   Zusammenlegen zweier Kunden) und `TP-ADDIN-11` (leere Call-Nummer ist nie ein Treffer).
4. **E-017.** Neuer Fall `TP-TPL-08`: nicht gelistete Quelle wird abgelehnt, auch bei direktem
   API-Aufruf unter Umgehung der Oberfläche, auch bei Leerzeichen- oder
   Groß-/Kleinschreibungsvarianten einer sonst gültigen Quelle.
5. **E-008 bestätigt.** `TP-ROUND-07` ist nicht mehr bedingt; R-03 ist geschlossen. Neuer Fall
   `TP-ROUND-16` prüft den umschaltbaren kaufmännischen Modus selbst (16 und 61 Minuten in beiden
   Modi), neuer Fall `TP-EXPORT-09` prüft, dass der aktive Modus je Exportlauf protokolliert wird.
6. **E-023.** Ursprünglich wie im Auftrag beschrieben umgesetzt (Rückkehr-Spalte, Löschfall) —
   dann per Korrektur vollständig zurückgenommen, siehe oben. Kein `TP-TIMER-08` mehr im Dokument.
7. **E-018/E-019.** Neue Fälle `TP-EXPORT-10` (Ablageorte unter `%LOCALAPPDATA%`/
   `~/.local/share/takt/`, ausdrücklich als nicht ohne laufenden Tauri-Prozess prüfbar markiert)
   und `TP-ADDIN-13` (Token in `localStorage` der Add-in-Herkunft, nicht in
   `Office.context.roamingSettings`).
8. **23 Prüfungen aus dem Bedrohungsmodell.** Neuer Abschnitt 13 mit einer vollständigen Tabelle
   aller 23 Prüfungen, je mit Ebene. 9 davon verweisen auf bestehende oder in dieser Aufgabe neue
   Fälle (`TP-ADDIN-07`, `TP-NOTE-02`, `TP-TPL-08`, `TP-ADDIN-03`, `TP-ADDIN-11`, `TP-EXPST-04`,
   `TP-EXPORT-04`, `TP-ADDIN-10`, `TP-ADDIN-08`), statt sie zu wiederholen. 14 sind neu unter dem
   Präfix `TP-SEC-`.
9. **19 Orte mit Exportstatus.** Neuer Fall `TP-EXPST-09` bildet die vollständige Liste aus
   T-005 Abschnitt 4 als Prüfliste ab, mit Verweis auf bestehende Fälle, wo einer existiert.
   Ausdrücklich offen benannt: 9 der 19 Orte (Dashboard-Kacheln, globale Suche, globale
   Navigation u. a.) sind noch durch keinen anderen Testfall belegt, weil der jeweilige
   Screen-Ausschnitt in den fachlichen Abschnitten bisher nicht auf dieser Detailebene behandelt
   wird.
10. **Begriffe.** Vermerk/Leistung durchgängig nachgezogen (Kopf des Dokuments, Abschnitt 3
    umbenannt, TP-BASE-02, TP-B64-Hinweise, TP-EXPORT-01, TP-TPL-01/03). JSON-Schlüssel bleibt
    `Notiz`, das ist im Kopf des Dokuments ausdrücklich als reines Übertragungsformat erklärt.

Annahmen:
- Trennzeichen „; " und Randnormalisierung (Leerzeichen, abschließendes Semikolon/Punkt
  entfernen) für die Zusammenführung der Leistungstexte sind laut ausdrücklicher Aussage des
  Orchestrators dessen eigene Festlegung, keine Auftraggeber-Entscheidung — im Testplan an jeder
  betroffenen Stelle so gekennzeichnet, damit domain-dev/unit-tester wissen, dass das leichter
  revidierbar ist als eine bestätigte Anforderung.
- `TP-KANBAN-02` (Ort der Spaltenkonfiguration) ist weiterhin als offene Annahme markiert wie in
  T-002; T-016 ändert daran nichts.
- Die 14 neuen `TP-SEC-*`-Fälle sind bewusst in einem eigenen Abschnitt 13 statt über die
  bestehenden Bereiche verteilt, weil sie aus dem Bedrohungsmodell, nicht aus der Fachlogik
  abgeleitet sind und teils Meta-Prüfungen über den ganzen Testlauf sind (`TP-SEC-06`).

Risiken:
- **Widerspruch zu `decisions.md` (E-023), s. o.** Bis das dort korrigiert ist, zeigt das Board
  zwei einander widersprechende Aussagen zur Rückkehr-Spalte. Ich habe das im Kopf von
  `docs/testplan.md` und in „Offene Punkte" ausdrücklich vermerkt, kann es aber nicht selbst
  auflösen.
- `TP-EXPORT-16c` (Tagesgruppe mit ausschließlich leeren Leistungstexten) ist ohne Erwartung
  formuliert — nicht prüfbar, bis geklärt ist, ob das Abrechnungstool eine leere Notiz annimmt.
- `TP-EXPORT-10` und `TP-ADDIN-13` sind nicht sinnvoll ohne laufende Anwendung (Tauri-Sidecar
  bzw. Office.js-Umgebung) prüfbar; ein reiner Unit-Mock würde die eigentliche Zusicherung
  (wohin das Betriebssystem tatsächlich schreibt, wo der Browser das Token tatsächlich ablegt)
  nicht abdecken. Beide sind entsprechend im Dokument markiert.
- Kein einziger Testfall in diesem Dokument wurde ausgeführt — für T-016 nicht verlangt, da nach
  wie vor weder Projektgerüst (T-008) noch Fachlogik (T-009) noch Playwright-Umgebung existieren.
  Ein Testfall, der nicht laufen konnte, gilt hier ausdrücklich als nicht gelaufen, nicht als
  bestanden.
- Für die End-to-End-Fälle existiert weiterhin keine eigene Umsetzungsaufgabe auf dem Board
  (unverändert gegenüber T-002); mit T-016 wächst diese Lücke um deutlich mehr Fälle
  (`TP-EXPORT-07/-08/-10`, `TP-KANBAN-05/-06`, `TP-ADDIN-10/-11/-13`, mehrere `TP-SEC-*`, u. a.).

Offene Fragen:
- Soll ich (oder eine andere Stelle) `decisions.md` E-023 formal ablösen, damit Testplan und
  Entscheidungsprotokoll wieder übereinstimmen?
- Ist für `TP-EXPORT-16c` (leere Tagesgruppe) eine Rückfrage an den Auftraggeber vorgesehen, oder
  bleibt das bewusst dem Abrechnungstool-Verhalten überlassen, das noch niemand geprüft hat?
- Wird die Umsetzung der End-to-End-Fälle (weiterhin ohne eigene Board-Aufgabe) für eine
  kommende Welle eingeplant? Der Umfang ist mit T-016 spürbar gewachsen.

Nächster Schritt: Testplan an unit-tester übergeben für die als Unit/Integration markierten
neuen und geänderten Fälle (insbesondere `TP-ROUND-16`, `TP-NOTE-02`, `TP-TPL-08`, die
`TP-EXPORT-11` bis `-17`-Familie und die 14 `TP-SEC-*`-Fälle), damit sie vor T-009 als
Vitest-Tests entstehen. Parallel den Widerspruch bei E-023 an die für `decisions.md` zuständige
Stelle zurückspiegeln.
