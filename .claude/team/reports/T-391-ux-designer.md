Aufgabe: T-391 — UX-Flüsse für Welle 18
Status: braucht Review
Artefakte:
- docs/design/welle-18-fluss.md (neu, englisch)
- docs/design/todo-tabelle-fluss.md:1095 („A-25.9 Satz 4" → „Satz 2")
- .claude/team/reports/T-391-ux-designer.md

Zusammenfassung: Flüsse mit Zuständen, Fokus, Texten (deutsch, mit Schlüssel und englischem
Entwurf) und Akzeptanzkriterien für A-28.1, A-28.2, A-28.3, A-28.6, A-28.7, A-28.8, O-FZ und
O-Q (C-14, C-16, C-21, A-4.4). Entschieden: die Sprache wechselt sofort, ohne Neuladen. Bei
O-FZ bleibt die Vorwarnung einmal stehen, wörtlich an `TimeScreen.tsx:211`. Die drei übrigen
Stellen werden gekürzt; das entspricht ST-06, das nie gebaut wurde.

Prüfung:
- Wortlautsuche nach E-087 in tests/**, apps/*/test/**, packages/*/test/** (Grep, Arbeitsbaum):
  Für die drei gestrichenen O-FZ-Sätze und die alte Kartenbeschreibung „wirken sofort" gibt es
  keine Treffer. Treffer gibt es für „Gebucht: <Dauer>." in
  tests/e2e/manual-booking-movement.spec.ts:149,211,277; diese drei Stellen muss T-402 an A-28.7
  anpassen.
- `git grep` lief nicht, weil kein Shell-Werkzeug verfügbar war. Die Suche über die
  versionierten Dateien bleibt deshalb offen; frontend-dev holt sie in T-400 nach.
- Das Suchwerkzeug von ui-ux-pro-max lief ebenfalls nicht (kein Shell-Werkzeug). Die Regeln sind
  aus references/quick-reference.md §7–9 gelesen (inline-validation, error-clarity,
  focus-management, toast-accessibility, deep-linking, state-preservation). Das Frequenz-Gate
  stammt aus animate/SKILL.md. Ergebnis: keine neue Animation in dieser Welle.
- ecc:click-path-audit und ecc:accessibility habe ich nicht als Skill aufgerufen. Klickpfade und
  Fokus sind am Code nachverfolgt (TimerContext-Stopppfade, PreferencesContext, BoardSetupDialog,
  BookingsScreen-Menü).

Annahmen:
- A-28.1 kommt als eigene Karte unter Einstellungen → Arbeitsplatz. Einschalten verspricht keine
  sofortige Prüfung.
- A-28.2: Die Sprachwahl steht in Darstellung als RadioRow mit Endonymen („Deutsch" und
  „English"). Die Kartenbeschreibung wird zu einem Satz über alle vier Bedienelemente
  zusammengefasst. Für Englisch schlage ich en-GB vor (F-2).
- A-28.3: Die Regelliste in den Einstellungen ist die Gesamtliste. Ein Tausch mit dem Nachbarn
  verschiebt deshalb keine dritte Regel; das Board ändert sich nur, wenn beide Regeln
  Board-Spalten sind, und die Meldung sagt das dann.
- A-28.6: Die Frage nach dem Ende gilt für jeden Stopppfad über 24 h, also auch für den direkten
  Stopp bei ausgeschalteter Leistungsabfrage und für den Wechsel. Genau 24 h ist erlaubt.
  Abbrechen bucht nichts und startet nichts.
- A-28.7 übernimmt `stopMessage` unverändert. Es gibt keinen zweiten Wortlaut.
- A-28.8: Die Warnung steht am Ablageort. Die Zeile in „Sicherheitsmeldungen" entfällt, damit
  der Befund nicht doppelt erscheint. Quelle ist die vorhandene Meldung `file_permissions_wide`.
- C-14: „hat Notiz" lese ich als die Leistung der Buchung, nicht als den Vermerk am Todo.
- C-21 lese ich als: Ein Feld der Vorlage ohne Bedingung ist in einer Zeile leer (F-9). Der
  Bericht zu T-025 ist nicht mehr in Git.
- C-16: TodayRow bekommt den Todo-Titel und dasselbe Menü wie die Buchungsübersicht, erzeugt von
  derselben Funktion.

Risiken:
- F-4 und F-5: Die verwaiste Buchung und die Rückkehr aus der Inaktivität können über 24 h
  hinaus buchen. Ohne Entscheidung weist der Dienst sie nach T-388 ab, und der Benutzer steht in
  einer Sackgasse. A-24.5 und A-28.6 widersprechen sich an dieser Stelle.
- F-8: Die Zeiterfassung zählt NoExport-Buchungen heute unter „Noch offen" mit
  (`TimeScreen.tsx:161-164`). Das ist ein Befund gegen A-26.2 und A-6.6.
- Befund außerhalb des Auftrags: `TimeScreen.tsx:191-194` behauptet bei ausgeschalteter
  Leistungsabfrage, SuperTakt frage nach der Leistung. Vorschlag: den Satz nur bei eingeschalteter
  Abfrage zeigen, ohne neuen Text.
- Sicherheit: Beim Schalter für die Versionsprüfung misst T-397 im Dienst, dass ausgeschaltet
  keine Verbindung nach außen entsteht. Die Oberfläche misst nur, dass sie selbst nicht mehr
  abfragt.

Offene Fragen: F-1 bis F-10 in docs/design/welle-18-fluss.md §14. Vordringlich sind:
- F-1: Bewegungssatz aus der Domäne und die Sprachumschaltung.
- F-4 und F-5: 24 h bei verwaister Buchung und Inaktivität.
- F-7: C-14 braucht Filter im Dienst (`tagId`, `poolId`, `hasNote`), steht aber nicht in T-397.
- F-8: NoExport-Kennzeichen an der Buchung.

Nächster Schritt: Der Orchestrator entscheidet F-1, F-4, F-5, F-7 und F-8 vor T-397 und T-400.
T-392 legt Längen und Gestalt für §13 fest. T-404 bestätigt die O-FZ-Kürzung nach E-078
Punkt 3.
