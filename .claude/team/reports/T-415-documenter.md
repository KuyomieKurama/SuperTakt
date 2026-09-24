Aufgabe: T-415 — Dokumente nach dem Schnellbefehl-Rückbau (Welle 18, E-134 Punkt 2)
Status: fertig
Artefakte:
- docs/outlook-bridge-alignment.md (Tabellenzeile 36, Abnahmezuordnung Zeilen 113/114/116, neuer Abschnitt „Function command removed" am Dateiende)

Zusammenfassung:
Die Erwähnungen des entfernten Funktionsbefehls (`commands.html`, `commands.ts`, `quick-command.ts`, `FunctionFile`/`commandsUrl`) in `docs/outlook-bridge-alignment.md` sind auf den heutigen Stand gebracht: der Vergleichstabellenzeile ein Verweis auf den Rückbau angehängt, die drei betroffenen Abnahmezuordnungs-Zeilen korrigiert (Fall 14 als entfallen markiert, Fall 9–10 ohne den toten Test, Fall 11 mit offen benanntem Lückenpunkt) und ein neuer, datierter Abschnitt am Dateiende ergänzt, der den Rückbau, den Grund (T-409b-2) und den verbleibenden Zustand (ein `ShowTaskpane`-Eintrag, zwei Formularabschnitte „Neues Todo"/„E-Mail anhängen", keine Buchung) belegt. Die Erwähnung der Buchungsroute war bereits korrekt (Zeile 156, Vergangenheitsform); dort war nichts zu ändern. `apps/outlook-addin/README.md` gegengelesen: keine weiteren veralteten Stellen gefunden.

Prüfung:
- E-087-Suche (repo-weit, `git grep`-Äquivalent über den gesamten Baum) für jeden geänderten/entfernten Satz: „Funktionsbefehl ohne Seitenleiste", „gemeinsamer saveMail-Aufruf", „Schnellbefehlsfälle", „Schnellbefehl wartet und beendet genau einmal" — alle vier Treffer lagen ausschließlich in der jetzt geänderten Datei selbst, keine Duplikate in `tests/**`, `apps/*/test/**`, `apps/*/src`, `packages/*/src` oder Bauergebnissen.
- Gegengelesen gegen den Code: `apps/outlook-addin/manifest.xml` (nur `ShowTaskpane`, kein `FunctionFile`), `apps/outlook-addin/src/ui/texts.ts` und `TaskPane.tsx` (Sektionen „Neues Todo"/„E-Mail anhängen", Knöpfe „Neues Todo anlegen"/„E-Mail an Todo anhängen"), `tests/e2e/outlook-addin-build.spec.ts` (Test `the single Outlook ribbon command opens the task pane for mail assignment` bestätigt genau einen `ShowTaskpane`-Eintrag; derselbe Testlauf deckt Standardstatus, verschachtelte Tags, neuen Tagnamen und Neuladen bereits ab).
- Bestätigt per `Glob`, dass `src/quick-command.ts`, `src/commands.ts`, `commands.html` im Add-in nicht mehr existieren; `apps/outlook-addin/test/office/quick-command.test.ts` existiert noch und importiert weiterhin das gelöschte Modul (unit-tester-Aufgabe laut T-398c, nicht meine Hoheit).
- Jeder neu geschriebene Fließtext (neuer Abschnitt, drei Tabellenzeilen) selbst nach den Regeln von `humanizer:humanizer` durchgesehen: Gedankenstriche entfernt, keine Füllphrasen, keine erfundenen Angaben, gerade Anführungszeichen.
- Nicht geprüft: `apps/outlook-addin/README.md` inhaltlich verändert (nicht meine Hoheit, nur gegengelesen) und keine automatisierten Prüfungen (`pnpm check` u. Ä.) — reine Dokumentänderung, keine Code-Änderung.

Annahmen:
- „Erwähnungen … auf den heutigen Stand bringen" verstehe ich als Korrektur plus ergänzende Erklärung, nicht als stillschweigendes Überschreiben der historischen Vergleichstabelle: Die ursprüngliche Zeile 36 bleibt als Planungs-/Umsetzungsstand stehen, bekommt aber einen Verweis auf den späteren Rückbau statt gelöscht zu werden.
- Sprache: Da mein Auftrag dieses (durchgehend deutsche) Dokument ohnehin berührt, sind die von mir neu verfassten bzw. inhaltlich umgeschriebenen Stellen (neuer Abschnitt, die drei Abnahmezuordnungs-Zeilen, der Zusatz in Zeile 36) Englisch (E-118); unberührte Abschnitte bleiben Deutsch, da eine Vollübersetzung des 182-Zeilen-Dokuments nicht Teil dieses engen Auftrags war.
- Für Abnahmefall 11 (Abbruch/Nachrichtenwechsel) habe ich keine Ersatzabdeckung behauptet, weil ich keinen dedizierten Testfall dafür gefunden habe — als offenen Punkt im Dokument selbst vermerkt statt eine Lücke zu verschweigen oder eine Abdeckung zu erfinden.

Risiken:
- Keine sicherheitsrelevanten Funde in diesem Auftrag; die sicherheitsrelevante Beobachtung (veraltete Risikonotiz zum „noch gebauten" Schnellbefehl) liegt in fremder Hoheit, siehe unten.

Offene Fragen / Meldungen an andere Rollen:
1. **Orchestrator:** `docs/spec.md` A-10.11 nennt weiterhin den Funktionsbefehl „Schnell in Inbox" (Zeile 571: „Outlook-Funktionsbefehl „Schnell in Inbox" und „Aufgabe erstellen" mit Seitenleiste"). `docs/spec.md` gehört nicht zu meiner Hoheit.
2. **security-checker:** `docs/bedrohungsmodell.md` Zeilen 14838–14840 beschreibt den Befund „T-409b-2, niedrig — Der abgelöste Schnellbefehl ist noch gebaut" als offenes Risiko. Nach dem heutigen Rückbau (T-398c: `quick-command.ts`, `commands.ts`, `commands.html`, `FunctionFile`/`commandsUrl` sind gelöscht bzw. bereits vorher aus dem Manifest entfernt) ist dieser Befund erledigt und sollte geschlossen oder aktualisiert werden. `docs/bedrohungsmodell.md` gehört nicht zu meiner Hoheit.
3. **ux-designer:** `docs/design/addin-anhangsuebernahme-fluss.md` nennt an mehreren Stellen (Zeilen 144, 154, 168, 371, 379, 970) die Knopfbeschriftung „Neue Aufgabe anlegen" und in AK-22 (Zeile 1075) ausdrücklich „Die Knopfbeschriftung „Neue Aufgabe anlegen" ist unverändert." Der aktuelle Wortlaut im Code ist „Neues Todo anlegen" (`apps/outlook-addin/src/ui/texts.ts`, `createButton`). `docs/design/**` gehört nicht zu meiner Hoheit.
4. **integration-dev (nur Vermerk, keine Handlung nötig von mir):** `apps/outlook-addin/README.md` gegengelesen — keine weiteren veralteten Schnellbefehl-/Buchungs-Erwähnungen gefunden. Der Abschnitt „Aufbau" listet korrekt keine `quick-command.ts`/`commands.ts`/`commands.html` mehr.

Nächster Schritt: security-checker und ux-designer die jeweiligen Fundstellen in einer der nächsten Wellen nachziehen lassen; Orchestrator entscheidet über `docs/spec.md` A-10.11.
