Aufgabe: T-017a — E-029/E-030 und die Folge-Entscheidungen E-025, E-026, E-028, E-031 bis E-035
ins Glossar und in die Handbuchgerüste ziehen
Status: fertig

Artefakte:
- `docs/glossar.md` (überarbeitet)
- `docs/benutzerhandbuch.md` (Überschriften ergänzt, keine neuen Fließtexte)
- `docs/entwicklerhandbuch.md` (Überschriften ergänzt, keine neuen Fließtexte)
- `.claude/team/reports/T-017a-documenter.md` (dieser Bericht)

Zusammenfassung:

**E-029 und E-030, die beiden ursprünglich offenen Fragen.** Todo/Ticket und
Timer/Zeiterfassung sind jetzt entschieden im Glossar verankert. Ich habe den Abschnitt „Offene
Punkte: dieselbe Sache oder zwei?" in „Geklärte Doppelbenennungen" umbenannt, statt ihn zu
löschen: Alle drei früher dort geführten Fälle (Erledigt/Kanban-Spalte, Todo/Ticket,
Timer-Wortfamilie) sind entschieden, aber der Abschnitt bleibt als Beleg stehen, warum die
Spezifikation an diesen Stellen anders klingt als die Anwendung — genau dafür war er gedacht. Die
Begriffszeilen „Todo", „Timer" und „Zeiterfassung" verweisen jetzt dorthin statt auf „offen", und
die weggefallenen Wörter („Ticket", „Time-Tracker", „Time-Tracking", „Zeittracking-Anwendung")
stehen weiterhin in der Spalte „Spezifikation nennt auch", jetzt mit dem Vermerk, dass sie als
Oberflächentext entfallen.

**E-031 bis E-034, die Tagesgruppe.** Neuer Begriff „Tagesgruppe" in der Haupttabelle, mit
Domänentyp `ExportGroup` und der persistierten `ExportRunGroup`. Der Eintrag deckt in einem
Beleg, was zusammengehört: Kalendertag des Timerstarts (E-025), Zusammenführung der
Leistungstexte mit Semikolon und Randnormalisierung (E-026, E-028), Aufklappbarkeit der
Exportvorschau mit Neuberechnung beim Ausschließen einzelner Buchungen (E-031), und die
Nicht-Exportierbarkeit einer Gruppe ohne Leistungstext (E-034). Zusätzlich ein eigener Kasten
„Exportstatus: zwei Werte, eine zusätzliche Anzeige" (E-032), der den Unterschied zwischen dem
zweiwertigen Status und der Anzeige „Erneut offen" (Variante A aus T-006, angenommen mit dem
Designsystem, E-024) ausdrücklich benennt — sonst hält ihn jemand für einen dritten Wert, wie es
die Aufgabe befürchtet hat.

**E-033, `booking.*` gegen Gruppenquellen.** In den Einträgen „Exportvorlage" und „Leistung"
vermerkt, mit einer Einschränkung, die ich für nötig hielt: E-033 ist eine Entscheidung, aber
noch keine umgesetzte Tatsache. Ich habe `docs/datenmodell.md` (§7) gegengelesen — dort steht
`ExportSourcePath` weiterhin mit `booking.*`, weil die Änderung laut E-033 selbst „Auflage für
T-007" ist. Das Glossar sagt deshalb beides: die Entscheidung (`booking.*` entfällt, `group.*`
kommt, mit dem einzigen in E-033 wörtlich genannten Beispiel `group.quarters`) und den noch
unveränderten Stand des Codes. Die weiterreichende Namensliste (`group.note`, `group.day` und so
fort) aus dem T-013-Bericht ist dort ausdrücklich als „Vorschlag für T-007, nicht umgesetzt"
gekennzeichnet; ich habe sie deshalb nicht ins Glossar übernommen, um keine noch nicht getroffene
Entscheidung als Fakt hinzustellen.

**Code-Bezeichner-Abschnitt fertiggestellt.** T-013 und T-013b sind laut Auftrag fertig, also
habe ich beide Vorläufigkeitsmarkierungen aufgelöst, die im Glossar standen: „Ordner" trägt jetzt
den Domänentyp `TagFolder`, „Exportordner" die Spalte `app_setting.export_directory`. Die
Tabellenliste zählt jetzt 16 Tabellen (`export_run_group` ergänzt). Die frühere offene Frage, ob
`ExportQuellenpfad`, `Behauptung` und `NotizgrenzeIstDicht` mitübersetzt wurden, ist beantwortet:
`ExportSourcePath`, `Assert`, `NoteBoundaryIsSealed`. Neu ist die Tabelle „Wert zu Beschriftung"
mit der Zuordnung aus dem T-013-Bericht (`open` → offen, `exported` → exportiert, `manual` →
manuell, `reset` → zurückgesetzt, `up` → aufwärts, `nearest` → kaufmännisch, `light` → hell,
`dark` → dunkel). Für `time_entry.source = 'timer'` und `app_setting.theme = 'system'` nennt der
Bericht keine Beschriftung; ich habe das ausdrücklich vermerkt, statt eine zu erfinden.

**Beim Nacharbeiten eine sachliche Unstimmigkeit gefunden und korrigiert.** Der bestehende
Glossareintrag „Rundung" sagte noch, jede Zeitbuchung werde einzeln gerundet — das war seit E-020
falsch, nur noch nicht nachgezogen. Ich habe den Eintrag korrigiert (Rundung auf die
Tagesgruppen-Summe) und die Einträge „Dauer" und „Export" um denselben Hinweis ergänzt, damit
nicht an drei Stellen unterschiedliche Aussagen zur Rundung stehen.

**Handbuchgerüste.** `docs/benutzerhandbuch.md`, Abschnitt „Zeiten exportieren": vier neue
Überschriften — Zustandekommen der Tagesgruppen, Zusammenführung der Leistungstexte, die
aufklappbare Export-Vorschau, und ausdrücklich der Fall aus E-034 („Eine Tagesgruppe ohne
Leistung"), weil ein Benutzer genau darüber stolpern wird. Die Überschriften „Exportstatus
erkennen", „Welche Feldquellen sich auswählen lassen" und „Den Exportstatus einer Buchung
zurücksetzen" haben zusätzliche Belege (E-032, E-033) und je einen Satz mehr in der Klammerzeile
bekommen, ohne dass daraus Fließtext wurde. `docs/entwicklerhandbuch.md`: neuer Abschnitt
„Tagesrundung: Buchungen zu Tagesgruppen zusammenfassen" mit drei Unterabschnitten (Kalendertag,
Leistungstexte, Tagesgruppe ohne Leistungstext), zwei neue Unterabschnitte unter „Das
Exportvorlagen-Modell" (Gruppenquellen statt `booking.*`, gemeinsamer Renderer für Vorschau und
Datei) und eine erweiterte Klammerzeile bei „Exportstatus, Zurücksetzen und Protokoll" für den
dreistufigen Aufbau `export_run` / `export_run_group` / `export_run_entry`.

**Humanizer.** Ich habe den Skill auf alle neuen und geänderten Fließtextabschnitte angesetzt und
sie danach selbst gegen die Musterliste geprüft: keine Füllsätze, keine Werbesprache, keine
aufgeblähten Behauptungen, keine erfundenen Quellen. Die Gedankenstriche habe ich stehen lassen —
`decisions.md` selbst verwendet sie 65-mal, und schon die bestehende Überschrift „# Glossar —
Takt" trägt einen; das ist erkennbar der Ton dieses Projekts, kein KI-Muster, das entfernt gehört.

**Fortsetzung nach Unterbrechung.** Der Lauf wurde durch ein Session-Limit unterbrochen, nicht
durch einen Fehler. Ich habe `docs/glossar.md` vor dem Weiterarbeiten komplett gelesen und keine
abgeschnittene Stelle gefunden — der Abschnitt „Code-Bezeichner: aktueller Stand" war bereits
vollständig, einschließlich der Tabelle „Wert zu Beschriftung". Offen waren zu diesem Zeitpunkt
nur noch die beiden Handbücher und dieser Bericht.

Annahmen:
- E-029 und E-030 sind laut Auftrag „vom Orchestrator gesetzt", nicht vom Auftraggeber bestätigt.
  Ich habe das im Abschnitt „Geklärte Doppelbenennungen" so benannt, statt es wie eine
  Auftraggeber-Entscheidung klingen zu lassen.
- Für die Anzeige „Erneut offen" habe ich das Etikett aus dem T-006-Bericht übernommen (Variante
  A, „ein Etikett 'Erneut offen' mit Schraffur, Rücklaufpfeil und Rautenpunkt"), weil E-024 diese
  Variante bis zu einem Widerspruch des Auftraggebers für verbindlich erklärt. Sollte der
  Auftraggeber doch Variante B wählen, betrifft das nur den Kasten „Exportstatus: zwei Werte,
  eine zusätzliche Anzeige" und die Begriffszeile „Exportstatus", nicht die Statuslogik selbst.
- Bei „Vermerk", „Pool" und „Standard-Tags" habe ich die jeweiligen Domänentypnamen ergänzt
  (`TodoNote`, `Pool`/`PoolRuleTerm`, `DefaultTag`), obwohl das nicht ausdrücklich verlangt war —
  das folgt aus „Zieh die Spalte mit den Code-Bezeichnern im Glossar darauf nach" und macht die
  Tabelle in sich konsistent, statt nur die explizit genannten Zeilen zu ändern.
- Ich habe `time_entry.source = 'manual'` und `= 'timer'` beide erwähnt, aber nur für `manual`
  eine Beschriftung eingetragen, weil nur die im Bericht steht. Dasselbe Muster bei
  `app_setting.theme = 'system'`.

Risiken:
- **E-033 ist im Code noch nicht umgesetzt.** Das Glossar sagt das jetzt ausdrücklich, aber wer
  nur die Begriffstabelle liest und nicht bis zum Halbsatz „im derzeitigen Stand von
  `docs/datenmodell.md`" kommt, könnte `group.*` für bereits vorhanden halten. Sobald T-007 die
  Liste ausschreibt, muss die Exportvorlage-Zeile erneut geprüft werden — voraussichtlich mit der
  vollen Liste aus dem T-013-Bericht (`group.note`, `group.durationSeconds`, `group.day`, …),
  falls T-007 sie unverändert übernimmt.
- **Die Anzeige „Erneut offen" hängt an einer Empfehlung, nicht an einer ausdrücklichen
  Auftraggeber-Bestätigung.** E-024 sagt, Variante A gilt, „bis er widerspricht". Widerspricht der
  Auftraggeber später, ändert sich nur eine Beschriftung im Glossar, aber sie sollte dann
  zeitnah nachgezogen werden, damit Dokumentation und Musterseite nicht auseinanderlaufen.
- **Die Handbücher bleiben Gerüst.** T-007 und T-009 sind nicht fertig; die neuen Überschriften
  beschreiben entschiedene Regeln, keine gebaute Oberfläche. Das ist beabsichtigt, aber wer die
  Handbücher ohne diesen Kontext liest, könnte sie für fertige Anleitungen halten.
- **T-017 im Board nennt auch frontend-dev** (Musterseite, Navigation). Dieser Bericht deckt nur
  den dokumentierenden Teil ab; ob die Musterseite und die Navigation aus T-006 die Begriffe
  „Zeiterfassung" statt „Time Tracking" bereits tragen, habe ich nicht geprüft — das liegt
  außerhalb meiner Dateihoheit.

Nächster Schritt: Nach T-007 sollte die Zeile „Exportvorlage" im Glossar erneut geprüft werden,
sobald die Gruppenquellen tatsächlich im Code stehen. Der Orchestrator sollte klären, ob
frontend-dev den zweiten Teil von T-017 (Musterseite, Navigation) noch offen hat oder ob das
Board dafür ein eigenes Ticket braucht.
