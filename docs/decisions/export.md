# Export — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-254 als Rückblick **im Quelltext** von
`apps/web/src/features/export/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert.
Dieselbe Trennlinie wie in `docs/decisions/tags.md` (T-250),
`docs/decisions/todos.md` (T-251), `docs/decisions/timer.md` und
`docs/decisions/bookings.md` (T-252) und `docs/decisions/board.md` (T-253).

**Ein Vorbehalt gilt für dieses Papier stärker als für die vier davor.** Der
Export ist die Fläche, über die abgerechnet wird. Kein Satz hier ändert eine
Regel: nicht die Rundung auf Viertelstunden über die **Tagessumme** (E-008,
E-020), nicht die Base64-Kodierung von UTF-8 (A-8.4), nicht den Exportstatus je
Buchung (E-032, E-050) und nicht die Trennung von Buchungsnotiz und internem
Todo-Vermerk (A-7.2, R-06, R-08). Wer aus einem Rückblick eine Regel liest, hat
das falsche Papier vor sich.

## Die Zeile, die in die Datei geht, war in S-07 nicht zu sehen (T-040, Befund C-02)

`ExportScreen.tsx`, Kopfkommentar — und `ExportRowPanes.tsx`, Kopfkommentar

Bis T-040 zeigte die Export-Ansicht Tagesgruppen, zusammengeführte Leistung und
gerundete Zeit — aber an keiner Stelle die **Zeile**, die in die Datei geht.
`totals.rows` wurde geholt und nur gezählt. Die Gegenüberstellung „So steht es
in der Datei" gegen „Feld für Feld" gab es nur in S-14, dem Vorlageneditor —
also genau dort nicht, wo die Datei entsteht.

Damit fehlte die Kontrollstelle an der Stelle, an der sie zählt: S-14 prüft eine
**Vorlage**, S-07 schreibt die **Datei**. Ein Bruch der Notiz-Trennung (A-7.2,
R-08) fiele in S-07 zuerst auf, und dort war nichts zu sehen.

Geblieben ist die Regel: Die Gegenüberstellung gehört an **beide** Stellen, und
sie ist derselbe Baustein (`ExportRowPanes`) und keine zweite Fassung. Zwei
Fassungen wären genau der Fehler, gegen den R-17 die Vorschau schützt.

## Eine Null, die „nicht gefragt" bedeutete (T-044, T-045, A-8.6)

`ExportScreen.tsx`, Kopfkommentar und `TotalsState`

Bis T-045 war die Gesamtvorschau ein `ExportPreview | null`, und der Fehlschlag
der Anfrage setzte dasselbe `null` wie „nichts ausgewählt". Die Folge stand zwei
Bildschirmzeilen weiter: Die Zusammenfassung sagte „0 Exportzeilen", der
Bestätigungsdialog wiederholte es — und der Lauf blieb auslösbar. Der Benutzer
sah, daß nichts zu exportieren sei, und drückte trotzdem, oder gerade deshalb
nicht; in beiden Fällen war die Anzeige eine Behauptung über etwas, das die
Anwendung nicht wußte.

Geblieben ist die Regel und ihr Träger: `TotalsState` mit vier Ausgängen,
„Export ausführen" nur bei `ready` freigegeben, der Fehlschlag als Meldung mit
einem Weg zurück. Eine geratene Zahl ist schlimmer als keine — und in eine
Datei, in der Arbeitszeit zu Geld wird, schreibt sie niemand.

## Der Abrechnungsname war erst nach dem Lauf zu sehen (T-042, C-20, E-010, E-042)

`ExportScreen.tsx`, `billingUser`

Bis T-042 stand der Windows-Benutzername, der in jede Zeile der Datei geht, nur
im Exportprotokoll — also **nach** dem Lauf. Ein Name, den man erst hinterher
prüfen kann, prüft niemand.

Geblieben ist die Regel: Er steht in S-07 und nicht nur in S-09, weil S-07 der
Augenblick ist, in dem es darauf ankommt.

## „Mit welcher Vorlage rechnet diese Ansicht eigentlich?" stand nirgends (T-035 offene Frage 2, T-036)

`ExportScreen.tsx`, der Hinweis an der Vorlagenauswahl

Bis T-036 stand nirgends, daß S-07 mit dem **gespeicherten** Stand einer Vorlage
rechnet und schreibt. Wer im Vorlageneditor gerade an einem ungespeicherten
Entwurf arbeitete, sah dort etwas anderes als hier und hatte keinen Satz, der
das erklärte.

Geblieben ist die Regel und ihr Ort: Der Satz steht an der Auswahl, die er
betrifft, und nicht in einem Handbuch.

## Die Vorschau mußte dazuschreiben, daß sie den gespeicherten Stand zeigt (E-051)

`TemplatePreview.tsx`, Kopfkommentar

Bis E-051 nahm `POST /export/preview` nur eine **Vorlagenkennung** entgegen.
Eine ungespeicherte Änderung konnte der Dienst deshalb nicht rendern, und die
Oberfläche durfte es nicht (R-17) — ein zweiter Renderer in `apps/web` ist genau
das, wogegen R-17 steht. Die Vorschau mußte stattdessen ausdrücklich
dazuschreiben, daß sie den gespeicherten Stand zeigt.

Geblieben ist die Regel: Die Vorschau schickt **immer** den Entwurf, den der
Benutzer gerade vor sich hat, nie eine Kennung; der Dienst prüft ihn mit
derselben Funktion wie das Speichern und schreibt dabei nichts. Der Hinweissatz
ist ersatzlos weg, weil A-8.7 seitdem erfüllt ist.

## Der Kopierdialog wurde an zwei Stellen von Hand aufgesetzt (T-186)

`TemplatesScreen.tsx`, `beginCopy`

Bis T-186 standen die drei Setzungen — Vorschlagstext, Berührungsmarke,
Dialogzustand — zweimal nebeneinander: in der Vorlagenliste und am Knopf der
Standardvorlage. Der Vorschlagstext selbst war bereits zeichengleich doppelt
geschrieben.

Geblieben ist die Regel: **ein** Einstieg, und Zwei Abschriften sind zwei
Gelegenheiten, bei der nächsten Änderung eine zu vergessen.

## Der zusammengeführte Leistungstext war einmal gewöhnlicher Text (T-133, O-AT)

`ExportGroups.tsx`, `ExportGroupData.mergedNote`

Bis T-133 hieß das Feld `string`. Die Herkunft fiel im `join` ab, und der Text
stand roh im Absatz **und** im `title` derselben Zeile. `apps/web/scripts/proof-foreign.mjs`
konnte die Behandlung damit nicht einfordern.

Geblieben ist die Regel — dieselbe wie bei `KanbanAppearance.otherColumns`
(`docs/decisions/board.md`): Die Marke sitzt am **Feld** und nicht erst an der
Anzeigestelle. Es ist die Zeile, an der ein Benutzer liest, was er gleich
abrechnet.

## Woher dieses Papier kommt

T-254, fünfte Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie des Auftraggebers: Was erklärt, warum der heutige Code überrascht,
und was eine Wiederholung verhindert, bleibt im Quelltext; Vorgeschichte,
Aufgabennummern und Meßprotokolle stehen hier.

**Zwölf Blöcke sind ausdrücklich nicht hierher gewandert.** Sechs, weil ein
Prüfer sie verlangt hat, sechs, weil sie eine Wiederholung verhindern:

Von einem Prüfer verlangt — **kein Satz davon ist gefallen** (E-078 Punkt 3):

1. `ExportAuditScreen.tsx`, der Kommentar an `counts` — **Befund C-25**: „Eine
   Kachel mit einer Zahl liest sich als Gesamtzahl."
2. `ExportAuditScreen.tsx`, der Kopfkommentar an `countByEvent` — derselbe
   Befund, zweite Stelle, samt dem Vergleich mit „einer Null, die ‚nicht
   gefragt' bedeutet".
3. `ExportDirectoryField.tsx`, der Kommentar am leeren Meldebehälter —
   **Befund O-GQ, T-191**: der Absatz ohne Rolle, den keine Vorlesehilfe ansagte.
4. `TemplateFieldRow.tsx`, derselbe Kommentar an der Meldefläche der Feldzeile —
   **B-5, T-162, T-186, O-GQ, T-191**, zweite Stelle.
5. `TemplatePreview.tsx`, die beiden Kommentare zu **ST-07 (T-181)** — „vier
   Abschriften desselben Satzes" und das Banner, das sie auf eine zusammenzieht.
   Ein Satz aus dem Textabbau fällt nicht beim Aufräumen.
6. `ExportScreen.tsx` (`SkippedRow`) und `PreviewGroupRow.tsx`, die Kommentare zu
   **T-222 Abschnitt 15.4 und 15.5, Befund O-JX** — der verborgene Zeilenbezug im
   Knopf statt eines `aria-label`, und warum er den **Tag** nennt und keine
   Buchung.

Weil sie eine Wiederholung verhindern:

7. `ExportScreen.tsx`, der Kommentar zu **C-26** am Knopf „Buchungen dieses
   Laufs" — er beschreibt keinen alten Zustand, sondern die heutige Grenze:
   `GET /export/audit` kennt den Lauf nicht als Abfrageparameter.
8. `ExportScreen.tsx`, der Kommentar an `run-row` — daß
   `GET /export/runs/{id}` die Gruppen **nicht** mitliefert, ist nachgemessen
   und der Grund, warum die Zeilenzahl aus der Vorschau kommt.
9. `exportTemplateModel.ts`, die E-049-Blöcke — sie erklären, warum die
   Auswahlliste **geholt** und nicht gewußt wird. Ohne sie schreibt sie jemand
   aus bester Absicht wieder hin.
10. `TemplateFieldRow.tsx`, der Kommentar an `sourceOptions` (T-057, T-059) — er
    erklärt, warum die Funktion **Daten** liefert und kein `<optgroup>` malt.
11. `ExportDirectoryField.tsx`, die Kommentare zu T-147 und T-133/O-AF — warum
    der Auswahlknopf **nicht** gesperrt ist, solange die Hülle schweigt, und
    warum ihr Fehlschlag nicht stumm bleibt.
12. `TemplatePreview.tsx`, der Absatz „Vorher hätte die Oberfläche entscheiden
    müssen, welcher Kalendertag zu einer Buchung gehört" — er ist die Begründung
    dafür, daß `groups` aus der Antwort kommt und nicht aus einer Rechnung hier
    (E-025, die Buchung um 23:50).
