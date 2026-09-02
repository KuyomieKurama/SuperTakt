Aufgabe: T-014 — Glossar und Handbuchgerüste auf die bestätigten Begriffe ziehen
Status: fertig

Artefakte:
- `docs/glossar.md` (überarbeitet)
- `docs/benutzerhandbuch.md` (Überschriften ergänzt, keine neuen Fließtexte)
- `docs/entwicklerhandbuch.md` (Überschriften ergänzt, keine neuen Fließtexte)
- `.claude/team/reports/T-014-documenter.md` (dieser Bericht)

Zusammenfassung: Das Glossar führt jetzt Vermerk und Leistung als verbindliche Namen der beiden
Notizfelder (E-016, vom Auftraggeber selbst benannt), mit der Historie der zwei unterlegenen
Vorschläge und der unveränderten Begründung aus T-004. Die 26-zeilige Begriffsliste aus dem
T-005-Bericht ist eingearbeitet: Die Haupttabelle „Begriffe" trägt jetzt eine eigene Spalte
„Spezifikation nennt auch", die alle von T-005 belegten Wortvarianten führt, statt sie an
verstreuten Stellen zu wiederholen. Zwei neu bestätigte Entscheidungen sind als Einträge
aufgenommen: Rundung (E-008, aufwärts auf die nächste Viertelstunde, Minimum 0,25, entsteht schon
bei einer Minute) und Rückkehr-Spalte (E-023, die in den Einstellungen festgelegte Kanban-Spalte
nach einem reaktivierenden Timerstart). Code-Bezeichner sind gegen `docs/datenmodell.md`
abgeglichen: Tabellen- und Spaltennamen stehen jetzt als belegte Fakten im Glossar, TypeScript-
Domänentypen bleiben ausdrücklich vorläufig mit Verweis auf T-013, weil die Umbenennung von
Deutsch auf Englisch noch läuft. Dabei ist mir aufgefallen, dass `docs/datenmodell.md` selbst
weitere deutsche Typnamen enthält (`ExportQuellenpfad`, `Behauptung`, `NotizgrenzeIstDicht`), die
nicht in der E-015-Liste stehen — im Glossar vermerkt, siehe Risiken. Die drei ungelösten
Fragen aus T-004 (Todo/Ticket, Timer-Wortfamilie, Erledigt gegen Kanban-Abschlussspalte) stehen
jetzt in einem eigenen Abschnitt „Offene Punkte: dieselbe Sache oder zwei?", jede mit einem Satz,
warum die Antwort das Domänenmodell ändert. Für die Erledigt-Frage konnte ich einen konkreten
Beleg ergänzen: `docs/datenmodell.md` modelliert „Erledigt" und die Kanban-Abschlussspalte bereits
als zwei getrennte Felder (`todo.completed_at` und `todo_status.is_done`), was die Frage nicht
beantwortet, aber zeigt, dass sie im Code schon eine Wirkung hat. Die Handbuchgerüste haben neue
Überschriften für die vier verlangten Themen bekommen (geschlossene Feldquellenliste E-017,
Add-in-Token-Pflege E-009/E-019, Exportordner-Vorgabeort E-011/E-018, Zurücksetzen des
Exportstatus E-012 mit einem eigenen Entwicklerhandbuch-Abschnitt zum Protokoll), weiterhin nur
als Überschrift mit Klammerzeile.

Annahmen:
- Für die Begriffe „Ordner" und „Tag-Ordner" führe ich weiter den Eintrag unter „Ordner", weil
  A-4.2/A-4.3 durchgehend „Ordner" sagen und „Tag-Ordner" nur einmal in A-10.5 vorkommt. Der
  Domänentyp bleibt vorläufig (siehe Code-Bezeichner-Abschnitt).
- Ich habe die Rückkehr-Spalte als eigenen Begriff aufgenommen, ohne sie mit dem in
  `docs/datenmodell.md` beschriebenen Mechanismus (`status_id_before_done`/`is_default`)
  gleichzusetzen. Beide beschreiben ein ähnliches Problem, aber nach meinem Lesen unterschiedliche
  Regeln — das ist ein Befund, keine Entscheidung, die dieses Glossar treffen kann.
- Ich habe das „Stand"-Datum des Glossars auf den tatsächlichen Bearbeitungstag aktualisiert
  (2026-09-01), weil sich das Systemdatum während der Bearbeitung geändert hat. Die zitierten
  Bestätigungsdaten der Entscheidungen selbst (2026-08-31) habe ich unverändert aus
  `decisions.md` übernommen.

Risiken:
- Möglicher Widerspruch zwischen E-023 und der bereits umgesetzten Modellierung in
  `docs/datenmodell.md` §3.2: E-023 beschreibt eine feste, konfigurierte Rückkehr-Spalte, für die
  jedes Todo beim Reaktivieren an dieselbe Stelle zurückkehrt. `docs/datenmodell.md` beschreibt
  stattdessen einen Mechanismus, der sich die vorherige Spalte je Todo merkt und nur ersatzweise
  auf eine Standardspalte ausweicht. Das sind unterschiedliche Regeln. Ich habe das im Glossar
  unter „Code-Bezeichner: aktueller Stand" vermerkt, aber nicht aufgelöst — das gehört domain-dev
  beziehungsweise dem Orchestrator, weil ich `docs/datenmodell.md` nicht bearbeiten darf.
- `docs/datenmodell.md` enthält mit `ExportQuellenpfad`, `Behauptung` und `NotizgrenzeIstDicht`
  drei deutsche Typnamen, die nicht in der E-015-Liste der zu übersetzenden Bezeichner stehen.
  Möglich, dass T-013 sie deshalb übersieht. Im Glossar als offener Punkt vermerkt, nicht als
  Entscheidung behandelt.
- Solange T-013 nicht abgeschlossen ist, bleibt das Glossar bei den Domänentypen bewusst vage
  („noch nicht abschließend benannt"). Wird T-013 fertig, muss diese Aufgabe erneut ans Glossar,
  sonst veraltet der Hinweis stillschweigend.

Offene Fragen (unverändert aus T-004, jetzt mit Begründung im Glossar):
- Ist „Ticket" ein Synonym für Todo oder ein eigenes Konzept?
- Sind „Timer", „Time-Tracker", „Time-Tracking" und „Zeiterfassung" ein Bedienelement plus ein
  übergeordneter Bereich, oder mehrere Namen für dieselbe Sache?
- Ist „Erledigt" (A-2.4) dasselbe wie die Kanban-Abschlussspalte (A-5.3), oder bleiben es zwei
  unabhängige Felder, wie es `docs/datenmodell.md` bereits umsetzt?

Nächster Schritt: Der Orchestrator sollte den möglichen Widerspruch zwischen E-023 und
`docs/datenmodell.md` §3.2 an domain-dev zurückspiegeln, bevor T-009 den Mechanismus umsetzt.
Sobald T-013 die TypeScript-Domänentypen umbenannt hat, muss dieses Glossar erneut angefasst
werden, um die „vorläufig"-Markierungen durch die endgültigen Typnamen zu ersetzen — dabei auch
prüfen, ob `ExportQuellenpfad`, `Behauptung` und `NotizgrenzeIstDicht` mit umbenannt wurden. Die
drei verbliebenen offenen Fragen (Ticket, Timer-Wortfamilie, Erledigt/Abschlussspalte) brauchen
weiterhin eine Antwort vom Auftraggeber, bevor S-04 und S-05 im Frontend abschließend gebaut
werden.

---

## Nachtrag, 2026-09-01: Rückkehr-Spalte entfernt, Erledigt-Frage beantwortet

Der gemeldete Widerspruch aus dem Abschnitt „Risiken" oben hat die Klärung ausgelöst: E-023 ist
neu gefasst. Erledigt (A-2.4) und die Kanban-Spalte (A-5.3) sind zwei unabhängige Dinge. Ein Todo
kann in „Done" stehen und nicht erledigt sein, oder erledigt sein und in einer anderen Spalte
stehen. Weder das Setzen noch das Aufheben von Erledigt ändert die Spalte. A-2.5 läuft über
Sichtbarkeit: Erledigte Todos sind in Pool-Ansichten ausgeblendet, ein reaktiviertes Todo
erscheint dort wieder. Damit entfallen sowohl die von mir eingetragene „Rückkehr-Spalte" als auch
der in `docs/datenmodell.md` zuvor beschriebene Merk-Mechanismus (`status_id_before_done`); beide
sind laut Auftrag bereits aus `docs/datenmodell.md` und `docs/architektur.md` entfernt.

Geändert:
- `docs/glossar.md`: Begriffszeile „Rückkehr-Spalte" entfernt. Die Zeile „Erledigt" trägt jetzt
  die Antwort direkt (Beleg A-2.4, A-2.5, A-5.3, E-023), ebenso die Zeile „Status, Statusspalte"
  mit dem Zusatz, dass keine Kopplung besteht. Die dritte offene Frage
  „Erledigt und die Kanban-Abschlussspalte" ist aus dem Abschnitt „Offene Punkte" entfernt und
  durch einen kurzen Verweis auf die Antwort ersetzt; der Abschnitt führt jetzt nur noch die zwei
  verbliebenen Fälle (Todo/Ticket, Timer-Wortfamilie). Der frühere Hinweis zum vermeintlichen
  Widerspruch unter „Code-Bezeichner: aktueller Stand" ist durch einen kurzen, als geklärt
  markierten Eintrag ersetzt.
- `docs/benutzerhandbuch.md`: Die Klammerzeile zu „Was passiert, wenn der Timer auf einem
  erledigten Todo startet" beschreibt jetzt Sichtbarkeit in Pool-Ansichten statt einer Spalte,
  und nennt ausdrücklich, dass sich die Kanban-Spalte nicht ändert.
- `.claude/team/reports/T-014-documenter.md`: dieser Nachtrag.

Offene Fragen jetzt nur noch zwei: Todo gegen Ticket, und die Wortfamilie Timer / Time-Tracking /
Zeiterfassung. Beide unverändert gegenüber der ursprünglichen Fassung dieses Berichts.

`docs/datenmodell.md` und `docs/architektur.md` habe ich nicht angefasst; laut Auftrag sind sie
bereits korrigiert.
