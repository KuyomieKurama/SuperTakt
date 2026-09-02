Aufgabe: T-002 — Testplan aus der Fachlogik ableiten
Status: fertig
Artefakte:
- `docs/testplan.md` (neu)
- `.claude/team/reports/T-002-e2e-tester.md` (dieser Bericht)

Zusammenfassung: `docs/testplan.md` deckt alle elf geforderten Pflichtbereiche plus eine
Basis-CRUD-Ergänzung (0) und die Zustandsmatrix (12) ab, insgesamt 82 einzeln benannte
Testfälle (`TP-...`) mit ID, Titel, betroffenen Anforderungs-IDs, Vorbedingung, Schritten,
erwartetem Ergebnis und Ebene (Unit/Integration/End-to-End). Die vollständige
Rundungs-Wertetabelle (0 bis 458 Minuten) ist enthalten, mit 16 Minuten ausdrücklich als der
Fall herausgestellt, der E-008 von der kaufmännischen Alternative unterscheidet — dabei fiel
auf, dass rechnerisch auch 22 Minuten divergiert, was als stützende Randnotiz und nicht als
Ersatz für die geforderte Hervorhebung von 16 Minuten aufgenommen wurde. Die Notiz-Trennung
(R-06) ist als eigener Sicherheitsblock mit vier Testfällen ausgeführt, die ausdrücklich
mehrere Vorlagen und einen direkten API-Umgehungsversuch prüfen, nicht nur die Standardvorlage.
Alle neun im allgemeinen Rollenauftrag genannten durchgehenden Abläufe sind als End-to-End-Fälle
vorhanden und in der Rückverfolgbarkeitstabelle am Ende auf Anforderungs-IDs zurückgeführt.
Es wurde kein einziger Testfall ausgeführt — das war für T-002 nicht verlangt, da weder
Projektgerüst noch Fachlogik noch Playwright-Umgebung existieren; das Dokument sagt das
ausdrücklich in seiner Kopfzeile.

Annahmen:
- Ort der Kanban-Spaltenkonfiguration (A-5.4) ist keinem der 14 Screens eindeutig zugeordnet;
  TP-KANBAN-02 geht von S-09 oder einem Bearbeitungsdialog auf S-04 aus und markiert das
  ausdrücklich als zu bestätigende Annahme, nicht als Vorgabe.
- Einige Bestätigungsdialoge in der Zustandsmatrix (Abschnitt 12, z. B. Token-Neuerzeugung,
  Standard-Tag entfernen) sind nicht wörtlich aus der Spezifikation verlangt, aber aus
  Konsistenzgründen sinnvoll; jede solche Zelle ist als Ermessensentscheidung gekennzeichnet.
- ID-Schema `TP-<Bereich>-<Nummer>` und die Aufteilung „Export Ende-zu-Ende" (9) versus
  „Exportvorlagen" (10) selbst festgelegt, weil beide im allgemeinen Rollenauftrag als zwei
  getrennte durchgehende Abläufe genannt sind, in den elf Pflichtbereichen des konkreten
  Auftrags aber unter „Export" zusammengefasst waren.
- Für die parametrisierten Blöcke Rundung und Base64 wurde eine gemeinsame
  Vorbedingung/Schrittfolge vorangestellt statt 15- bzw. 8-facher Wiederholung; jedes geforderte
  Feld (ID, Titel/Eingabe, Anforderungs-IDs, Erwartung, Ebene) bleibt pro Fall vorhanden.
- Fixture-Konventionen unter `tests/fixtures/` sind festgelegt (Verzeichnisstruktur,
  Namensschema, Platzhalterregeln, Kodierung, Zeitstempel-Handhabung), es wurden aber
  ausdrücklich keine Fixture-Dateien angelegt, wie im Auftrag verlangt.
- „Ebene" wurde strikt nach Dateihoheit aus `CLAUDE.md` vergeben: Unit und Integration laufen
  beide über Vitest in `packages/*/test/**` bzw. `apps/*/test/**` (unit-tester), End-to-End über
  Playwright in `tests/e2e/**` (e2e-tester).

Risiken:
- Sicherheitshinweis: Der wichtigste Einzelblock im Plan ist Abschnitt 3 (Notiz-Trennung,
  R-06). TP-NOTE-04 prüft ausdrücklich, dass die Trennung nicht nur eine UI-Beschränkung ist,
  sondern im Vorlagen-Motor selbst durchgesetzt wird — ein direkter API-Aufruf (z. B. vom
  Add-in aus, das denselben lokalen Dienst nutzt) darf `todo.notiz` nicht als Feldquelle
  akzeptieren können. Wird dieser Testfall bei der Umsetzung übersprungen oder nur die UI
  geprüft, bleibt die Datenschutzgrenze aus A-7.2 auf dem Papier bestehen, ist aber technisch
  umgehbar.
- TP-ROUND-07 (16 Minuten) hängt an der in R-03 offenen Bestätigung des Auftraggebers. Solange
  die Bestätigung aussteht, ist der erwartete Wert 0,50 nach aktuellem Stand E-008 — der Test
  selbst bleibt bei einer Umkehrung der Entscheidung sinnvoll, nur der erwartete Wert dreht sich.
- Für die End-to-End-Fälle gibt es aktuell keine Folgeaufgabe auf dem Board, die sie tatsächlich
  als Playwright-Dateien anlegt. Ohne eine solche Aufgabe bleibt der komplette End-to-End-Teil
  dieses Plans nur Absicht, nicht Prüfung — insbesondere die sicherheitskritischen Fälle
  TP-NOTE-03, TP-ADDIN-02 und TP-EXPST-06.
- Ein zweiter, kleinerer Sicherheitshinweis: TP-ADDIN-06 verlangt ausdrücklich, dass
  Fehlermeldungen bei ungültigem Token kein Orakel für Angreifer sind (keine unterschiedliche
  Antwort je nachdem, wie nah ein falsches Token am richtigen Format ist). Das ist eine
  zusätzliche, über E-009 hinausgehende Präzisierung dieses Plans und sollte bei T-011
  (Token-Verfahren) mitgenommen werden.

Offene Fragen:
- Ist für die End-to-End-Fälle aus diesem Plan bereits eine eigene Aufgabe für eine spätere
  Welle vorgesehen (Playwright-Dateien unter `tests/e2e/**`), oder soll ich das für die
  Wellenplanung vorschlagen? Ohne eine solche Aufgabe bleibt der Plan unausgeführt.
- Soll TP-KANBAN-02 (Ort der Spaltenkonfiguration) explizit an T-005 (spec-ux-reviewer)
  zurückgespiegelt werden, damit die Screen-Zuordnung vor T-006/T-008 geklärt ist?
- Deckt der Plan aus Sicht des Orchestrators die „Rundung"-Erwartung ausreichend ab, oder soll
  ich zusätzlich zum Wert 22 Minuten (rechnerisch ebenfalls ein Unterscheidungsfall) einen
  eigenen benannten Testfall statt nur einer Anmerkung im Abschnitt anlegen?

Nächster Schritt: Testplan an unit-tester (T-010) übergeben, damit die als Unit/Integration
markierten Fälle vor der Fachlogik-Umsetzung (T-009) als Vitest-Tests entstehen. Parallel dazu
beim Orchestrator eine Folgeaufgabe für die End-to-End-Umsetzung dieses Plans (Playwright unter
`tests/e2e/**`, inklusive der hier festgelegten Fixture-Konventionen) für eine spätere Welle
anregen, sobald T-008 steht.
