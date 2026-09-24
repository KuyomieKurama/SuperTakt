# T-409c — Spezifikations- und UX-Gegenprobe über PR #18, #19, #20

Aufgabe: T-409c — Qualitätstor PR #18–#20, Spezifikation/UX
Status: fertig (Nachtrag vom 2026-09-24: PR #18 beurteilt; E-133 eingearbeitet)
Artefakte: nur dieser Bericht
Rolle: spec-ux-reviewer, nur lesend, nichts committet

## Grenzen der Prüfung (vorweg, weil sie das Urteil tragen)

1. **Kein Diffinhalt gelesen.** In dieser Sitzung gab es weder Bash noch git. Für PR #18 lag mir
   die Dateiliste `f6f4d6d..7eeb073` vor (261 Dateien, vom Orchestrator nachgereicht). Für
   PR #19 und #20 hatte ich keine Liste. Geprüft habe ich in allen drei Fällen den
   **Arbeitsbaum**, also HEAD plus die nicht committeten Stände aus Welle 18 (T-397/T-398/T-400a
   laufen noch). Welche Fläche zu PR #19 und #20 gehört, habe ich aus Inhalt und Datum
   abgeleitet: A-10.11–A-10.17, A-26 und A-27 sind Aufträge vom 15. und 16.09. und damit PR #19;
   `serviceStartup.ts` ist PR #20.
2. Keine Browsermessung, wie im Auftrag festgelegt. Die Oberfläche wird von T-400a gerade in
   Textbündel umgebaut. Wo ein Befund einen Text betrifft, der schon in `features/*/texts.ts`
   steht, gilt er **dem Wortlaut**, nicht dem Ort, an dem der Text steht.
3. Die Skills `ecc:click-path-audit`, `ecc:product-lens`, `ecc:accessibility` und
   `ui-ux-pro-max` habe ich nicht aufgerufen. Ihre Maßstäbe (Klickpfade mit Zuständen,
   zugängliche Namen, Live-Regionen, deaktivierte Absendeknöpfe) habe ich von Hand am Quelltext
   angewandt.

## Regelwidersprüche — erledigt durch E-133

- **R-1** (CLAUDE.md gegen Spezifikation 25a): Nach Auskunft des Orchestrators ist CLAUDE.md
  nachgezogen, und A-10.9 und A-19.19 tragen den Ersetzt-Hinweis. Ich hatte einen alten Stand
  gelesen. Geschlossen.
- **R-2** (Sprachregel in CLAUDE.md): Mit derselben Nachziehung geschlossen.
- **Leitbegriff:** Es bleibt „Todo“ (E-029, E-133). Die neuen „Aufgabe“-Texte werden damit zum
  Befund, siehe unten.
- **`MailEntry.kind`:** Der gespeicherte Wert bleibt, angezeigt wird er über einen Textschlüssel
  (E-133). Der Befund ist entsprechend umformuliert.

## Befunde

Form: `A-ID  Screen/Flow  Abweichung  Vorschlag`. **B** heißt blockierend.

### PR #18 — Anhänge aus Outlook, Versionsprüfung, fensterfeste Flächen, Todo-Tabelle

**Abgrenzung über die Dateiliste.** Die Produktflächen sind:
- Add-in: Anhangsübernahme beim Anlegen (`attachments/*`, `ui/Attachments.tsx`, `TaskPane.tsx`
  +893), abgedeckt durch A-19.19 in der Fassung E-108 und A-19.23 bis A-19.34.
- Hauptanwendung: Öffnen-Rückfrage mit Herkunft, Endung und Nachbau (`AttachmentOpenDialog.tsx`,
  `AttachmentRow.tsx`, `attachmentLabel.ts`), abgedeckt durch A-19.15 und A-19.22b/23a/23b.
- Todo-Tabelle und Tag-Fläche (`TodoTable.tsx`, `TodoTagsCell.tsx`, `TodoRow.tsx` entfällt),
  abgedeckt durch A-25.9 und A-4.4.
- Fensterfeste Flächen (`ScreenBody.tsx`, `viewport-layout.css`, alle Screens), abgedeckt durch
  A-25.
- Kartenkopf im Board (`BoardScreen.tsx`), abgedeckt durch A-25 und `kartenkopf-board.md`.
- Versionsprüfung im Dienst (`version.ts`), abgedeckt durch A-18.
- Timer-Wiederherstellung und Inaktivität (`timer.ts`, `idle.ts`), abgedeckt durch A-24 und R-34.
- Migration 0023 (`attachment_origin`).

Jede dieser Flächen hat eine Anforderungs-ID. Eine Fläche ohne Deckung habe ich nicht gefunden.

**Herkunft.** Anders als PR #19 und #20 ist dieser Inhalt **im Wellenmodell** entstanden
(T-281 bis T-375, die Berichte liegen im Diff). Auch die Spezifikations- und UX-Gegenproben
T-308, T-343, T-351, T-366 und T-376 sind gelaufen. Ihr letzter Stand vor dem Merge war
„Nacharbeit“. Die Reste liefen danach auf `main` als T-382 (fertig) und T-383 (Designpapier; im
Board nur als gestartet vermerkt, ein Abschluss ist nicht eingetragen). Es fehlte also das Tor
über den **Squash als Ganzes**, nicht die Prüfung der einzelnen Flächen.

Befunde am heutigen Stand dieser Flächen:

- `A-27.4 gegen A-25.9/todo-tabelle.md  TodoTagsCell, Tastatur`
  Abweichung: Das ist ein Widerspruch zwischen Design und Spezifikation. PR #18 hat die
  Tag-Fläche absichtlich so gebaut, dass sie bei bloßem Fokus **nicht** aufgeht
  (`TodoTagsCell.tsx:222–227`: „wer mit dem Tabulator durch hundert Zeilen geht …“). PR #19
  nutzt denselben Baustein im Kanban, und A-27.4 verlangt dort: „Überfahren, **Fokus** und Klick
  öffnen die vorhandene Tag-Fläche“. Der Bau folgt dem Design, nicht A-27.4.
  Vorschlag: Das entscheidet der Orchestrator oder der Auftraggeber. Meine Empfehlung: A-27.4
  berichtigen („Überfahren, Klick sowie Eingabe und Leertaste“), weil ein Aufgehen bei Fokus in
  Tabelle und Board eine Tabulatorfalle wäre. Nicht blockierend.

- `A-4.4 / A-25.9 (a11y)  TodoTagsCell, zugänglicher Name`
  Abweichung: Der Auslöser heißt in jeder Zeile nur „3 Tags“ (`aria-label={label}`, Z. 264).
  In einer Tabelle mit vielen Zeilen sind die Namen deshalb gleich, und in der Liste der
  Bedienelemente eines Screenreaders ist die Zeile nicht erkennbar.
  Vorschlag: „3 Tags von ‚<Todo-Titel>‘“ oder `aria-describedby` auf die Titelzelle.

- `A-19.15  AttachmentOpenDialog, dritter Zustand`
  Abweichung: Keine neue. Der ruhige dritte Zustand (O-KT/O-LC) ist offen und steht bei T-400.
  Nur als Querverweis, damit PR #18 nicht als „vollständig“ gilt, solange T-400 fehlt.

- `A-19.19 (Fassung E-108)  Add-in, Sätze zum vorhandenen Todo`
  Abweichung: Keine mehr. Der Satz aus PR #18, dass am vorhandenen Todo kein Anhang entsteht,
  ist mit PR #19 zu `NO_ATTACHMENT_ON_EXISTING` = „Erneutes Zuordnen derselben E-Mail erzeugt
  keine doppelten Mail-Einträge oder Anhänge“ umgeschrieben und passt jetzt zu A-10.13. Nur der
  **Name** der Konstante nennt noch die alte Regel.
  Vorschlag: Konstante umbenennen (Sache der Code-Prüfung).

Ohne Befund an den gelesenen Stellen:
- `AttachmentOpenDialog.tsx`: voller Pfad ungekürzt, Name, aufgelöster Name, Name aus der E-Mail,
  abgesetzte Endung, Herkunft mit Absender als fremdem Text, Nachbau-Hinweis. Kein Knopf ist
  vorausgewählt, Fokus liegt auf dem Dialog. Eine vorhersehbare Absage erscheint ohne
  Öffnen-Knopf, die Absage der Hülle bleibt im Dialog in einer ständigen Live-Region.
- Die Nachtragsanweisung im Aufgabenbereich („am Todo unter ‚Anhänge‘ mit ihrem vollständigen
  Pfad hinzufügen“) nennt eine Handlung, die es gibt (A-19.11).
- Tag-Fläche: Überfahren mit Nachlauf, Klick, Eingabe und Leertaste öffnen sie; Escape und
  Bildlauf des Ankers schließen sie, der Fokus kehrt nur nach ausdrücklichem Öffnen zurück.

### PR #19 — Outlook-Angleichung (A-10.11 bis A-10.17)

- **B** `A-10.16 / O-LB  Add-in, Fehlschlag oder Abbruch beim Ergänzen`
  Abweichung: Die Fehler- und Abbruchsätze kennen nur die Neuanlage. `Failure` sagt immer
  „Es ist kein Todo entstanden.“ (`TaskPane.tsx:764`), `CANCELLED_NOTE` sagt „Abgebrochen. Es
  ist kein Todo entstanden.“ (Z. 69). Beim Ergänzen einer vorhandenen Aufgabe (`appending`)
  sollte auch keines entstehen; die eigentliche Auskunft fehlt: Ist die E-Mail angehängt oder
  nicht? Die Aufzählung enthält den wirklichen Fall nicht.
  Vorschlag: Beide Sätze nach `appending` unterscheiden, zum Beispiel „Die E-Mail wurde nicht
  ergänzt. Eine gesendete Anfrage kann bereits gespeichert sein …“.

- **B** `A-10.11 / A-10.16  Add-in, mehrere Treffer`
  Abweichung: Ist `offers.length > 1` und noch keine Wahl getroffen, heißt der Abschnitt
  „E-Mail anhängen“ (`showCreateFields` ist false), der Knopf aber „Neue Aufgabe anlegen“
  (`appending` ist false). Er ist gesperrt, und `gate.reason` nennt dafür keinen Grund
  (Z. 621–626). Der Knopf beschreibt eine Handlung, die in diesem Zustand gar nicht gemeint ist.
  Vorschlag: Beschriftung „E-Mail an Todo anhängen“, sobald `offers.length > 0` und
  `target !== 'new'`. Der Sperrgrund „Bitte ein Todo auswählen“ steht als `pane-note` wie die
  anderen Gründe (E-093).

- `A-10.16  Add-in, DuplicateOffer`
  Abweichung: Der Satz „Die E-Mail wird als Anhang an der ausgewählten Aufgabe gespeichert …“
  bleibt stehen, nachdem „Stattdessen neue Aufgabe erstellen“ gedrückt wurde
  (`DuplicateOffer.tsx:14`). Dann stimmt er nicht mehr.
  Vorschlag: Den Satz nur bei `typeof target === 'object'` zeigen.

- `A-10.12 / A-6.6  Add-in, DuplicateOffer`
  Abweichung: `describeOffer` berechnet `summary` mit offener und **bereits exportierter** Zeit.
  Die Begründung im Quelltext lautet: „ein abgerechneter Vorgang … soll niemandem entgehen“
  (`rule.ts:31–37`). Angezeigt wird `summary` nirgends. Der Benutzer ergänzt eine E-Mail an einem
  abgerechneten Todo, ohne es zu sehen.
  Vorschlag: `summary` unter der Radiozeile ausgeben oder das Feld streichen (E-125 Punkt 1).

- `A-10.11 (a11y)  Add-in, DuplicateOffer`
  Abweichung: Der Umschlag mit Radiogruppe und Knopf trägt `role="status"`
  (`DuplicateOffer.tsx:11`). Eine Live-Region mit Bedienelementen liest bei jeder Änderung die
  ganze Gruppe vor, auch nach jedem Tastendruck im Call-Feld.
  Vorschlag: `role="status"` nur um den Satz „Zu Call … gibt es noch kein Todo“ und um eine
  kurze Trefferansage legen.

- `A-10.17  Add-in, Rückstände des Schnellbefehls`
  Abweichung: A-10.17 sagt, der Befehl „ersetzt den Schnellbefehl“. Trotzdem sind noch da:
  `commands.ts`, `quick-command.ts`, der `FunctionFile`-Eintrag im Manifest, der Kommentar
  „Both Outlook commands use this contract“ (`save-mail.ts:32`) und „Schnell in Inbox“ in
  `apps/outlook-addin/README.md:4`. Der README-Satz nennt eine Handlung, die es im Menüband nicht
  mehr gibt.
  Vorschlag: Den Rückbau in einem Auftrag erledigen, mit E-087-Suche nach „Schnell in Inbox“.

- `A-10.15  Add-in-Einstellungen, Call-Erkennung`
  Abweichung: Gebaut ist „Gruppe 1, sonst Gesamttreffer“ (`run.ts:47`). Die Oberfläche sagt
  aber „Übernommen wird immer der Inhalt der ersten Klammer“ (`SettingsView.tsx:308`) und
  „Genau eine Klammer um die Nummer“ (Z. 338).
  Vorschlag: „Mit Klammer wird deren Inhalt übernommen, sonst der ganze Treffer.“

- `A-19.2  Add-in, Neuanlage`
  Abweichung: Das Feld heißt „Fälligkeitsuhrzeit (optional)“ (`TaskPane.tsx:575`) und steht
  getrennt vom Frist-Feld hinter den Tags.
  Vorschlag: Beschriftung „Uhrzeit der Frist (optional)“ und das Feld direkt unter „Frist“
  stellen.

- `A-10.14  Add-in-Einstellungen, „Standard-Tags“`
  Abweichung: Die lokale Vorauswahl heißt „Standard-Tags“ (`SettingsView.tsx:168`), während
  derselbe Picker die echten Standard-Tags aus A-9 als gesperrt „Standard“ zeigt. Im
  Aufgabenbereich heißt es „Ablagevorgabe: Status“, in den Einstellungen „Standard-Status“.
  Vorschlag: „Vorausgewählte Tags“ und „Vorausgewählter Status“; im Aufgabenbereich schlicht
  „Status“.

- `E-029/E-133  Add-in und Hauptanwendung, Leitbegriff`
  Abweichung: PR #19 führt „Aufgabe“ als Oberflächenbegriff ein: „Neue Aufgabe anlegen“,
  „Passende Aufgabe“, „Stattdessen neue Aufgabe erstellen“, „E-Mail an Aufgabe anhängen“,
  Board-Lead „Aufgaben im Blick“, `noExportCard` „Diese Aufgabe …“, „Erledigte Aufgaben sind
  ausgeblendet“. E-133 bestätigt „Todo“.
  Vorschlag: Auf „Todo“ umstellen, mit E-087-Suche. Achtung: „Stattdessen neue Aufgabe
  erstellen“ ist ein **Wortlaut der Spezifikation** (A-10.16). Die Spezifikation muss mitgeändert
  werden, sonst zeigt die Umbenennung gegen A-10.16.

- `A-10.12 / E-133 / A-28.2  Hauptanwendung, Mailverlauf und Anhangsnamen`
  Abweichung: `MailEntry.kind` (`'Antwort' | 'Weiterleitung' | 'E-Mail'`) wird roh angezeigt
  (`TodoDetailScreen.tsx:301`, `attachmentChronology.ts:24`). In englischer Oberfläche steht
  deshalb „Antwort – 13/07/2026 …“.
  Vorschlag (nach E-133): Der Wert bleibt gespeichert, die Anzeige geht über einen Textschlüssel
  je Wert (T-400).

- `A-10.16 (a11y)  Add-in, TagPicker`
  Abweichung: Bei aktiver Suche bleiben die Ordnerknöpfe fokussierbar mit `aria-expanded` und tun
  beim Klick nichts (`TagPicker.tsx:192`). `aria-label="Tag-Ordner"` steht auf einem `div` ohne
  Rolle.
  Vorschlag: Während der Suche `aria-disabled` setzen oder die Ordner als Überschrift darstellen,
  dazu `role="group"` am Umschlag.

- `A-10.16  Add-in, DoneView nach dem Ergänzen`
  Abweichung: „Noch etwas aus dieser E-Mail“ führt nach einem **Ergänzen** in die Neuanlage.
  Vorschlag: Nach `appended` oder `already_present` heißt der Knopf „Zusätzlich neues Todo
  anlegen“.

### PR #19 — NoExport (A-26)

- `A-26.1  Todo-Dialog, Detail, Buchungszeilen`
  Abweichung: Sichtbar steht der Bezeichner `NoExport`, auch in deutscher Oberfläche. Das kann mit
  „Nicht abrechnen/Nicht abgerechnet“ (E-047/E-050) verwechselt werden.
  Vorschlag: Eine Beschriftung wie „Ohne Abrechnung“, die Abgrenzung legt ux-designer fest.

- `A-26.2  Buchungsübersicht, Todo-Filter`
  Abweichung: Die Todo-Auswahl lädt auch NoExport-Todos (`BookingsScreen.tsx:122`). Wer eines
  wählt, sieht eine leere Liste ohne Grund.
  Vorschlag: NoExport-Todos ausnehmen oder mit einem Hinweis zeigen.

- `A-26.2 / A-28.7  Buchung von Hand auf ein NoExport-Todo`
  Abweichung: Die Rückmeldung meldet „gebucht“, die Zeile erscheint aber nicht in der
  Buchungsübersicht. Dass kein Exportwert behauptet wird, ist heute nur zufällig richtig
  (`loadDayGroupInsight` ohne `includeNoExport`).
  Vorschlag: In T-400 ausdrücklich behandeln, in T-402 einen Prüffall ergänzen.

- `A-26.3  Todo-Detail, Buchungsmenü`
  Abweichung: Auf NoExport-Zeilen bleibt „Nicht abrechnen“ anwählbar. Das sperrt die Zeile
  dauerhaft, entgegen „beim Ausschalten … wieder verfügbar“.
  Vorschlag: Den Eintrag bei `todo.noExport` sperren und den Grund nennen.

### PR #19 — Prioritäten (A-27)

- **B** `A-27.3 / O-LB  Kanban, leere Spalte bei aktivem Prioritätsfilter`
  Abweichung: Eine leere Spalte sagt „Keine Karte trifft diese Regel — … erfüllt sie kein Todo“
  (`board/texts.ts:58–59`), auch wenn nur der Filter ausblendet. `BoardColumn` erfährt vom Filter
  nichts.
  Vorschlag: Den Filterzustand an `BoardColumn` geben, einen eigenen Satz für diesen Fall und die
  Aktion „Filter zurücksetzen“ anbieten.

- `A-27.1 / E-093  Einstellungen → Prioritäten`
  Abweichung: `submitDisabled={!valid}` sperrt den Absendeknopf ohne Grund.
  Vorschlag: Knopf nicht sperren, Feldfehler nach E-084.

- `A-27.2  Prioritäten, Löschen`
  Abweichung: Ein Fehler erscheint hinter dem offenen Bestätigungsdialog
  (`PrioritySettings.tsx:38`).
  Vorschlag: Den Fehler im Dialog zeigen.

- `A-27.1 (a11y)  Prioritäten, Zeilenaktionen`
  Abweichung: „Bearbeiten“ und „Löschen“ stehen in jeder Zeile ohne Namen, die zugänglichen
  Namen sind also gleich.
  Vorschlag: Namen der Priorität in das `aria-label` aufnehmen.

- `A-27.1  Prioritäten, Beschreibung`
  Abweichung: „… bei **dieser** Sortierung“ bezieht sich auf eine Sortierung, die auf dieser
  Fläche nicht vorkommt.
  Vorschlag: „… im Kanban bei der Sortierung nach Priorität …“.

- `A-27.1  Kanban-Karte, Prioritätsmarke`
  Abweichung: Die Marke zeigt immer einen Pfeil nach oben, auch bei Gewichtung 0 oder negativ;
  ein Screenreader hört den Namen ohne Bezug.
  Vorschlag: Neutrales Symbol und `visually-hidden` „Priorität:“ davor.

- `E-118 Punkt 3 / A-28.2  PrioritySettings.tsx, UpdateNotice.tsx, serviceStartup.ts, App.tsx (Boot-Fehler)`
  Abweichung: Diese neuen Texte stehen noch außerhalb der Bündel.
  Vorschlag: In T-400a/T-400 mit abdecken.

Ohne Befund an den gelesenen Stellen:
- A-27.4 bis auf den Widerspruch oben, A-27.5, A-27.7, A-27.9, A-27.10, A-27.12.
- A-10.13 (Dateiauswahl standardmäßig an und abwählbar).
- A-10.14 (leerer Betreff, Darstellung, Neuladen mit erhaltener Auswahl).
- A-10.16 (Formular bleibt bei Treffern verborgen; keine Zeiterfassung oder Schätzung im Add-in).
- A-10.17 (Manifest, EML-Beschriftung, Sortierung, „hinzugefügt“).
- A-10.12 (Mailverlauf neueste zuerst). Dass Mailverlauf und Anhangsliste gegenläufig sortiert
  sind, ist spezifikationskonform; ob das so bleibt, ist eine Frage an den Auftraggeber.

### PR #20 — Warten auf den lokalen Dienst

- `A-28.5 / A-11  Boot-Fehlerfläche`
  Abweichung: Der Titel heißt „nicht erreichbar“, die Meldung „noch nicht bereit“. Die
  Starthinweise hängen mit `\n` an (`serviceStartup.ts:68`) und laufen deshalb in eine Zeile.
  „Erneut versuchen“ ist vorhanden. Es gibt keine eigene A-ID, der Fall ist eine
  Fehlerbehebung innerhalb der Betriebsform.
  Vorschlag: Bei T-400 (A-28.5/A-28.10) den Titel nach Ursache wählen und die Hinweise als Liste
  zeigen.

## Urteil

- **PR #18: freigegeben** für die Seite Spezifikation und UX. Alle Produktflächen haben eine
  Anforderungs-ID, keine blockierenden Befunde. Nicht blockierend: der Widerspruch
  A-27.4 gegen das Design der Tag-Fläche (braucht eine Entscheidung) und die gleichen
  zugänglichen Namen an „n Tags“. Vorbehalte: T-383 (Designpapier) hat im Board keinen Abschluss,
  und der dritte Zustand der Öffnen-Rückfrage (O-KT/O-LC) steht bei T-400. Der blockierende
  Code-Befund aus T-380 (R-34, `earlierOf`) gehört T-409a/T-409b und ist von diesem Urteil nicht
  gedeckt.
- **PR #19: Nacharbeit.** Blockierend:
  1. Fehlschlag- und Abbruchsatz beim Ergänzen (A-10.16/O-LB).
  2. Knopfbeschriftung bei mehreren Treffern (A-10.11/A-10.16).
  3. Leere Kanban-Spalte bei aktivem Prioritätsfilter (A-27.3/O-LB).
- **PR #20: freigegeben**, mit dem nicht blockierenden Hinweis zur Boot-Fehlerfläche.

## Prüfung

- Gelesen: `docs/spec.md` Abschnitte 10, 25a, 26, 27, 28; `decisions.md` 15.09.-Einträge und
  E-118 bis E-131; `docs/outlook-bridge-alignment.md`; `board.md` (Welle 18 und die Einträge zu
  T-343/T-351/T-366/T-372/T-376/T-380/T-382/T-383); die Dateiliste zu PR #18.
- Quelltext zu PR #19 und #20: wie im ersten Durchgang, rund 25 Dateien in Add-in, Web, Domäne
  und Speicherung.
- Zusätzlich zu PR #18: `AttachmentOpenDialog.tsx` vollständig, `TodoTagsCell.tsx`
  Z. 180–304, dazu die Add-in-Flächen aus PR #18 (`TaskPane.tsx` DoneView und
  Nachtragssätze, `plan.ts`) aus dem ersten Durchgang.
- Nicht gelesen: der Diffinhalt (kein git), Flächen aus PR #18 außerhalb der Stichprobe
  (`ScreenBody.tsx`, `viewport-layout.css`, `ExportScreen.tsx`, `TimeScreen.tsx`,
  `DashboardScreen.tsx`). Für diese stütze ich mich auf die Wellenberichte und die
  e2e-Abdeckung (`viewport-fit.spec.ts`). Das ist **nicht selbst gemessen**.
- Nicht ausgeführt: jeder Lauf (`pnpm check`, e2e), weil es kein Bash gab. Keine
  Browsermessung (Auftrag).

## Annahmen

- Den Arbeitsbaum habe ich als Stellvertreter für den Stand der drei PRs genommen.
- Für PR #18 habe ich die Prüfung der einzelnen Flächen innerhalb der Wellen als Grundlage
  anerkannt und nur den heutigen Stand stichprobenartig nachgeprüft. Einen zweiten vollen
  Durchgang über 261 Dateien habe ich nicht gemacht.

## Risiken

- Der Knopf „Nicht abrechnen“ auf NoExport-Zeilen kann offene Zeit unbeabsichtigt dauerhaft aus
  dem Export nehmen (Geldpfad, gering).
- Wer das Kanban nur mit der Tastatur bedient, kommt an die Tag-Fläche nur über Eingabe oder
  Leertaste, nicht über Fokus. Das ist bewusst so gebaut, aber durch A-27.4 nicht gedeckt.

## Offene Fragen an den Orchestrator

1. Wird A-27.4 berichtigt (Fokus öffnet nicht), oder wird der Baustein geändert?
2. Wird die Spezifikation beim Umstellen auf „Todo“ an A-10.16 („Stattdessen neue Aufgabe
   erstellen“) mitgeändert?

## Nächster Schritt

- Die beiden Add-in-Befunde gehen an integration-dev, der Kanban-Leerzustand an frontend-dev nach
  T-400a.
- Die Umstellung auf „Todo“ und die Anzeige von `MailEntry.kind` gehören zu T-400 und zur
  Add-in-Welle.
- Die übrigen nicht blockierenden Befunde nimmt T-404 mit.
