# T-025 — Abgleich der gebauten Anwendung gegen die Spezifikation

Aufgabe: T-025 — Abnahmeprüfung gegen `docs/spec.md`, gegen die Matrix aus T-005/T-005n und gegen
die 51 Entscheidungen
Status: fertig
Artefakte: `.claude/team/reports/T-025-spec-ux-reviewer.md` (neu, einzige Datei)

Zusammenfassung: Geprüft wurden alle 14 Screens gegen ihre Anforderungen, die 19 Orte mit
Exportstatus einzeln, die Klickpfade I-01 bis I-15, die sechs Zustände aus Abschnitt 15 je Screen,
die Begriffe über alle Ansichten hinweg und — der wertvollste Teil — die Spezifikation Anforderung
für Anforderung auf das, was niemand gebaut hat. Ergebnis: **Der schwierige Teil sitzt.** E-023,
E-020, E-025, E-031, E-032, E-034, E-047 und E-050 sind vollständig und an der richtigen Stelle
umgesetzt; I-05 ist an den Startpunkten, an denen es erreichbar ist, mustergültig gelöst — Toast
mit allen drei Wirkungen, genannten Pools, dem Satz zur Spalte und Rückgängig. Die Notiz-Trennung
trägt in der Hauptanwendung auf sechs Merkmalen. Von meinen neun Auflagen sind sieben geschlossen.

Was nicht sitzt, ist der Rand: **B-08 ist unverändert offen** — das Protokoll, das R-10 gegen
Doppelabrechnung absichert, hat eine Route, eine Client-Funktion und keinen Ort in der Oberfläche.
**B-14 ist halb geschlossen** — S-14 zeigt JSON und Klartext, S-07 zeigt gar kein JSON, also fehlt
die Kontrolle genau an der Stelle, an der geschrieben wird. Und I-05, die meistzitierte
Anforderung der Spezifikation, ist von drei der sechs vorgeschriebenen Startpunkte aus nicht mehr
erreichbar oder nicht mehr automatisch — im Add-in ist die Reaktivierung ein Kontrollkästchen mit
Voreinstellung „aus", obwohl A-2.5 „automatisch" sagt und keine Entscheidung das abgelöst hat.

23 Befunde, davon 4 blockierend.

Annahmen: siehe Abschnitt 9. Die wichtigste: Ich hatte in dieser Sitzung **keine Shell**, konnte
also weder `pnpm dev` starten noch gegen `127.0.0.1:5173` klicken. Geprüft wurde gegen den
Quelltext von `apps/web/src`, `apps/outlook-addin/src` und `apps/local-api/src`, gegen das
Designsystem und gegen die Berichte T-012, T-022, T-031 und T-035. Alles, was ich als „fehlt"
melde, ist im Quelltext nachgewiesen und mit Datei und Zeile belegbar; alles, was von der
Bildschirmwirkung abhängt (Hover-Feinheiten, Fühlen der 400 ms), ist ausdrücklich nicht geprüft.

Risiken: Die drei größten Lücken hängen zusammen — sie liegen alle am Übergang von erfasster Zeit
zu abgerechnetem Geld. Wer eine Buchung zurücksetzt, kann nirgends nachsehen, was mit ihr schon
geschehen ist (C-01). Wer exportiert, sieht vorher nicht, was in der Datei steht (C-02). Wer aus
Outlook auf ein erledigtes Todo bucht, bekommt kein wieder offenes Todo, sondern eines, das
erledigt bleibt und dessen Zeit trotzdem in die Abrechnung geht (C-03). Jede dieser drei Stellen
ist für sich klein; zusammen sind sie der Teil des Produkts, in dem ein Fehler beim Kunden ankommt.

Offene Fragen: vier, siehe Abschnitt 10.

Nächster Schritt: C-01 bis C-04 schließen, danach erneut vorlegen. C-05 bis C-09 gehen ohne weitere
Entscheidung an die Umsetzung.

---

## 0. Wie geprüft wurde

- Belegt wird mit Anforderungs-IDs aus `docs/spec.md` (`A-…`, `S-…`, `I-…`, `§12`, `§15`), mit
  Entscheidungen (`E-…`), Risiken (`R-…`) und meinen eigenen Befunden aus T-005/T-005n (`B-…`).
- Neue Befunde heißen `C-nn`, damit sie sich nicht mit `B-nn` aus T-005 vermischen. Wo ein `C`
  einen `B` fortschreibt, steht das dabei.
- Ein Befund ohne Beleg steht nicht in diesem Bericht.

---

## 1. Die neun Auflagen aus T-005n

| Auflage | Beleg | Stand | Nachweis |
|---|---|---|---|
| **B-03** Ableitung statt Zwischenspeicher | A-2.5, A-3.4 | **geschlossen** | `TimerContext.announceStart` ruft `bump()`; jede Ansicht hängt an `version` (`RefreshContext`). Pools kommen je Aufruf aus `poolsContaining(todoId)`, nirgends gespeichert. `TagsScreen` sagt es im Text mit. |
| **B-04** Add-in als fünfter Buchungsort | A-10.9, A-2.5, A-6.6 | **halb** | Karte zeigt Titel, Call, Erledigt und die Aufteilung offen/exportiert (`duplicate/rule.ts:90-96`) — das ist geschlossen. Die Meldung nach dem Buchen nennt Spalte und Rückkehr, **aber nur wenn der Benutzer das Kästchen gesetzt hat** → C-03. |
| **B-08** Protokoll braucht einen Ort | R-10, E-012 | **offen** | `GET /export/audit` existiert, `listExportAudit()` in `api/endpoints.ts:531` existiert — **kein einziger Aufruf in `apps/web/src`**. → C-01 |
| **B-14** Vorschau JSON und Klartext | A-8.4, A-8.9, A-7.2 | **halb** | S-14 `TemplatePreview.tsx:536-577` zweispaltig, mit Klartext der Leistung darunter — vorbildlich. S-07 `ExportScreen.tsx` rendert `totals.rows` **nie**, nur `rows.length`. → C-02 |
| **B-18** Bedienung ohne Ziehen | A-13.6, SC 2.5.7 | **geschlossen** | S-04: Strg+Pfeil und Kartenmenü „Nach … verschieben" (`BoardScreen.tsx:148-155`, `Kanban.tsx:82-91`). S-14: Knöpfe „nach oben"/„nach unten" (`TemplateFields.tsx:447,454`). S-08 hat gar kein Ziehen — SC 2.5.7 damit nicht verletzt, A-13.6 aber unerfüllt → C-11. |
| **B-19** Ausblenden sichtbar machen | A-2.5, A-3.3, E-023, E-039 | **geschlossen** | `TodoListScreen.HiddenDoneNotice`: „3 erledigte Todos sind ausgeblendet" mit Schalter, und der Satz sagt, dass ein Timerstart sie zurückholt. Genau der Wortlaut, den B-19 verlangt hat. |
| **B-20** Exportwert nur an der Tagesgruppe | E-020, E-025, A-8.3 | **geschlossen** | `BookingTable.tsx:56-65` führt bewusst keinen Wert je Zeile und begründet es. Stoppdialog: „An diesem Tag sind für dieses Todo 0:35 h offen — das ergibt beim Export 0,75" (`TimerContext.reportStopped`). Restfall in C-13. |
| **B-21** „Erneut offen" ist keine dritte Klasse | A-6.9, E-032 | **geschlossen** | `ExportStatus.tsx` trennt `ExportStatus` (zwei Werte) von `ExportDisplayState` (vier). Der Filter in S-06 bietet genau „Offen" und „Exportiert"; die Einengung „nur schon einmal exportierte" sitzt als eigener Schalter **neben** dem Statusfeld, nicht darin. |
| **B-22** S-07 gliedert nach Tagesgruppen | E-020, A-8.1, A-8.6 | **geschlossen** | `ExportGroups.tsx` mit Gruppenkopf, Aufklappen, Abwählen einzelner Buchungen und sofort neu gerechnetem Gruppenwert. Die Kopfzeile zählt beides: „7 Buchungen in 3 Exportzeilen". Das ist E-031 wörtlich. |

**Sieben von neun geschlossen. B-08 offen, B-04 und B-14 halb.**

Ergänzend, weil sie in T-005 als Bauvorgaben liefen: B-01, B-02, B-05, B-09, B-12, B-13, B-15,
B-16, B-17 sind geschlossen. **B-06, B-10 und B-11 sind offen** → C-08, C-09, C-10.

---

## 2. Die 19 Orte mit Exportstatus

Der e2e-tester hat 2 von 19 abgedeckt und den Rest als nicht gelaufen gemeldet (T-012, Fall 13).
Das ist meine Liste aus T-005, Abschnitt 4. Ich bin sie einzeln durchgegangen.

| # | Ort | Stand | Nachweis / Abweichung |
|---|---|---|---|
| 1 | S-01 Kachel „nicht exportierte Zeiten" | ✓ | `DashboardScreen` StatTile „Noch nicht exportiert" mit Summe, Zeilenzahl, gerundetem Wert und Sprung nach S-07 |
| 2 | S-01 laufender Timer | ✗ | Das Timerfeld sagt nirgends, dass die laufende Buchung offen ist (A-6.5). → C-12 |
| 3 | S-01 zuletzt bearbeitete Todos | ✗ | `pick-row` zeigt Start-Knopf, Titel, zwei Tags. **Keine Zeit, keine Aufteilung.** T-005 verlangte „3,50 h, davon 1,25 offen". → C-12 |
| 4 | S-02 Todo-Zeile | ✓ | `ExportSummaryStrip` je Zeile, vier Zustände mit Form und Zahl |
| 5 | S-03 Buchungsliste | ✓ | Badge je Zeile, dazu „Gesamt" und „Noch offen" getrennt |
| 6 | S-04 Kanban-Karte | ✓ | `ExportSummaryStrip` im Kartenfuß — B-01 geschlossen |
| 7 | S-05 Tagesliste | ✓ | `TodayRow` mit `ExportStatusBadge iconOnly` |
| 8 | S-05 laufender Timer | ✗ | wie Ort 2. → C-12 |
| 9 | S-06 Tabelle | ✓ | Randmarkierung, Zustandspunkt, Etikett — dreifach getragen, wie A-6.7 es verlangt |
| 10 | S-06 Aktionsleiste | teilweise | „7 Buchungen ausgewählt · 5:25 h", die Zahl der exportierten steht nur in der Knopfbeschriftung „Exportstatus zurücksetzen (2)". Erfüllt den Zweck knapp. |
| 11 | S-07 Auswahlliste | teilweise | Enthält per Aufbau nur offene, sagt es aber nirgends als Überschrift |
| 12 | S-07 Vorschau | ✗ | **Es gibt keine.** → C-02 |
| 13 | S-07 Ergebnis nach dem Export | ✓ | `RunResult`: Datei, Buchungen, Exportzeilen, Stunden, Bytes, Prüfsumme, ausgelassene Gruppen |
| 14 | S-07 Export-Verlauf | ✗ | „Letzte Exportläufe" zeigt Pfad, Anzahl, Summe, Größe — **nicht, welche Buchungen darin waren**. `getExportRun` ist ungenutzt. → C-01 |
| 15 | S-14 Live-Vorschau | ✓ | „an Ihren tatsächlich offenen Buchungen", in jedem der drei Kopfzustände |
| 16 | S-12 Karte des gefundenen Todos | ✓ | „Bereits gebucht: 2:15 h offen · 4:00 h bereits exportiert · Dieses Todo ist als erledigt gekennzeichnet." — B-04 erster Teil geschlossen |
| 17 | Globale Suche | ✓ | `ExportStatusMarker` an jedem Buchungstreffer |
| 18 | Globale Navigation | ✓ | Zähler am Punkt „Export", mit eigener Ansage für Hilfsmittel |
| 19 | Toast nach Statuswechsel | ✓ | Zurücksetzen, Nicht abrechnen und Export nennen den erreichten Zustand im Klartext |

**14 von 19 erfüllt, 2 teilweise, 3 nicht.** Die drei Fehlenden hängen an zwei Befunden: C-12
(Dashboard und Timer) und C-01/C-02 (Export).

---

## 3. Klickpfade I-01 bis I-15

| ID | Stand | Anmerkung |
|---|---|---|
| I-01 Todo erstellen | teilweise | Startpunkte S-01, S-02, S-04 je Spalte, S-12 alle vorhanden. Anlegen aus einer Kanban-Spalte setzt deren Status (`presetStatusId`). **Standard-Tags sind nicht vorbelegt und nicht entfernbar** → C-09 |
| I-02 Todo bearbeiten | ✓ | Ein Dialog für beide Fälle, Fehler bleibt am Feld, Eingaben bleiben stehen |
| I-03 Erledigt setzen | ✓ | Auslöser: Kästchen in S-02, Schalter in S-03, Kartenmenü in S-04 — **nicht** das Ziehen. Toast sagt, dass das Todo den Pool verlässt, und bietet Rückgängig |
| I-04 Timer starten/stoppen | ✓ | A-6.8 als **ein** Dialog (AN-03 erfüllt), Leistung darin, Stoppdialog nennt Tagesgruppe und gerundeten Wert. E-036 (verwaiste Buchung) mit Lebenszeichen umgesetzt |
| **I-05** Timer auf erledigtem Todo | **teilweise** | Die Wirkung selbst ist vorbildlich (siehe 3.1). Von sechs Startpunkten sind **drei** unerreichbar oder abweichend → C-03, C-04 |
| I-06 Tags hinzufügen/entfernen | ✓ | In S-02 (über Bearbeiten), S-03, S-12. Suche mit Pfad überall außer in S-08 → C-11 |
| I-07 Tags in Ordner verschieben | teilweise | Dialog mit Zielauswahl. Kein Ziehen (A-13.6) → C-11 |
| I-08 Ordner verschachteln | teilweise | Funktioniert bis in beliebige Tiefe; **die Zielauswahl bietet Zyklen an** → C-08 |
| I-09 → E-047 „Nicht abrechnen" | ✓ | Vorgang, Symbol, Etikett und Sperrbegründung sind zustandsgenau. E-047 und E-050 vollständig |
| I-10 Zeitbuchungen filtern | teilweise | Zeitraum, Exportstatus, Todo, „nur schon einmal exportierte", aktive Filter als Chips, zwei getrennte Leerzustände. **Tag, Pool, Call-Nummer und „hat Notiz" fehlen** → C-14 |
| I-11 Daten exportieren | teilweise | Transaktion, Ordnerprüfung vor dem Klick, fünf benannte Fehlerfälle, ausgelassene Gruppen nach E-034. **Bestätigungsdialog ohne Pfad, Dateiname und A-8.9-Satz** → C-05 |
| I-12 Standard-Tags konfigurieren | teilweise | In S-09. Kein Satz zu bestehenden Todos (B-11), kein Bestätigungsdialog beim Leeren → C-10 |
| I-13 Todo-Pools konfigurieren | teilweise | Regel als Tag- und Ordnerauswahl, Löschdialog sagt richtig, dass nichts verloren geht. **Keine Trefferzahl, keine Live-Vorschau** → C-06 |
| I-14 Drag & Drop | ✓ | Ablegen ändert die Spalte und sonst nichts; die Live-Ansage sagt es wörtlich: „Das Erledigt-Kennzeichen bleibt unverändert: offen." Genau T-005n, Abschnitt 3 |
| I-15 Exportvorlage | ✓ | Siehe Abschnitt 6 |

### 3.1 I-05 im Einzelnen — was richtig ist und was fehlt

**Richtig, und besser als meine Vorgabe.** `TimerContext.announceStart` spricht alle drei Wirkungen
aus, nennt die zutreffenden Pools einzeln (B-12), sagt „Die Karte bleibt, wo sie ist." (T-005n,
Schritt 8), bietet Rückgängig, und `undoReactivation` stoppt den Timer, **verwirft die Buchung**
und setzt Erledigt zurück (AN-05). Der dritte Anzeigezustand „Erledigt aufgehoben" existiert als
Sitzungszustand (`reactivated`) und endet, sobald der Benutzer das Kennzeichen selbst anfasst.
Trifft I-05 auf A-6.8, erscheint **ein** Dialog, nicht zwei. Das ist genau die Fassung aus T-005n.

**Die sechs Startpunkte:**

| Startpunkt | Beleg | Stand |
|---|---|---|
| S-03 Detailansicht | A-6.1, A-6.2 | ✓ erreichbar, Kennzeichen kippt, Buchungszeile erscheint |
| S-04 Kanban-Karte | A-5.6 | ✓ erreichbar über „Erledigte einblenden", Karte bleibt stehen, Spaltenzähler sinkt, Kennzeichen wechselt auf „Erledigt aufgehoben" |
| S-02 Todo-Liste | E-027 | ✓ erreichbar über „Erledigte einblenden", Zeile bleibt stehen |
| **S-01 Dashboard** | §12 | **✗** `listTodos({ onlyOpen: true })` — erledigte Todos erscheinen dort nie |
| **S-05 Zeiterfassung** | A-6.2 | **✗** `listTodos({ onlyOpen: true })` — und die Karte verspricht daneben ausdrücklich „Startet der Timer auf einem erledigten Todo, ist es danach wieder offen." |
| **S-12 Add-in** | A-10.9 | **✗** Reaktivierung nur, wenn der Benutzer ein Kästchen setzt; Voreinstellung aus |

Der dritte Anzeigezustand steht außerdem **nur auf der Kanban-Karte**. `TodoListScreen` und
`TodoDetailScreen` bekommen `timer.reactivated` nicht gereicht; dort sieht die Zeile hinterher aus,
als wäre sie nie erledigt gewesen — genau das, was T-005n, Abschnitt 1, Regel 1 verhindern sollte.

---

## 4. Die Zustände aus Abschnitt 15

`AsyncBoundary` und `LoadingBlock` liefern Loading und Fehler mit Wiederholung in **jeder** Ansicht
einheitlich; `EmptyState` unterscheidet in S-02, S-06 und S-14 „nichts vorhanden" von „nichts
gefunden" (B-13); `ConfirmDialog` fängt den Tabulator, gibt den Fokus zurück und hat für die
Vorgänge mit Geldfolge ein Kontrollkästchen und ein Begründungsfeld. Das ist die Grundlage, und sie
steht.

| Screen | Empty | Loading | Hover | Aktiv | Fehler | Bestätigung |
|---|---|---|---|---|---|---|
| S-01 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (Stoppdialog) |
| S-02 | ✓✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-03 | ✓ | ✓ | ✓ | ✓ | ✓ | **teilweise** — kein Dialog beim Verlassen mit ungespeichertem Vermerk (C-15) |
| S-04 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-05 | ✓ | ✓ | **✗** — die Buchungszeile bietet weder Bearbeiten noch Löschen, es gibt nichts zu zeigen (C-16) | ✓ | ✓ | ✓ (global) |
| S-06 | ✓✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-07 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓, Text unvollständig (C-05) |
| S-08 | teilweise — kein Leerzustand für einen leeren Ordner (C-11) | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-09 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-10 | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** — kein Dialog beim Entfernen aller Standard-Tags (C-10) |
| S-11 | ✓✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-12 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (Duplikatangebot) |
| S-13 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S-14 | ✓✓✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Drei Lücken, alle klein: C-10, C-15, C-16. Der Rest von Abschnitt 15 ist erfüllt, und an mehreren
Stellen besser als vorgegeben — der Leerzustand von S-14 („Die Vorschau läuft auf echten Daten und
erfindet keine.") ist die bessere Antwort auf B-09 als mein eigener Vorschlag mit gekennzeichneten
Beispieldaten. B-09 gilt als geschlossen.

---

## 5. Die Begriffe

Geprüft über alle 14 Screens und beide Anwendungen.

**Sauber durchgehalten:** Vermerk und Leistung (E-016) — mit sechs Merkmalen im `NoteField`, davon
nur eines Farbe. Zeiterfassung als Bereichsname (E-030). „Nicht abrechnen" für den Vorgang und
„Nicht abgerechnet" für den Zustand (E-047, E-050). Todo ohne „Ticket" (E-029). „Erledigt" als
Kennzeichen, „Statusspalte" für die Spalte, „Abschlussspalte" kommt nirgends vor (E-023).
„Tagesgruppe" und „Exportzeile" (E-020). „Erneut offen" nur als Anzeige (E-032). Der einzige
Ort, an dem „als exportiert markieren" noch steht, ist eine Erklärung, warum es das nicht mehr gibt.

**Zwei Abweichungen, beide belegt:**

1. **Der Timer heißt an zwei Stellen „Zeiterfassung".** `Timer.tsx:73` und `Kanban.tsx:168`
   beschriften den Knopf mit „Zeiterfassung starten" / „Zeiterfassung stoppen"; in S-01, S-02, S-03
   und S-05 heißt derselbe Knopf „Timer für ‚X' starten". E-030 sagt: Timer ist das Bedienelement,
   Zeiterfassung ist der Bereich. Man startet keinen Bereich. → C-17
2. **„Zielordner" gegen „Exportordner", und „Zielordner" heißt zweierlei.** S-09 beschriftet das
   Feld „Exportordner", beschreibt die Karte aber mit „Der Zielordner wird vor jedem Lauf …"; S-07
   nennt die Kachel „Zielordner". In S-08 heißt das Auswahlfeld beim Verschieben eines Tags
   ebenfalls „Zielordner" — und meint etwas völlig anderes. T-005, Abschnitt 6 setzt
   **Exportordner**. → C-18

**Eine dritte Stelle, formal kein Begriff, aber dieselbe Klasse Fehler:** Das Add-in beschriftet
seine beiden Felder richtig („Vermerk (bleibt in Takt)", „Leistung (geht in die Abrechnung)"),
benutzt aber zwei gewöhnliche `<textarea>` ohne Randschiene, Kopfband, Marke und Fußnote.
`addin.css` kennt keine `note--billing`/`note--internal`. T-015 und T-005n, 4.1 verlangen die sechs
Merkmale ausdrücklich auch dort — und T-005 nennt das Add-in den gefährlichsten Ort, weil hier Text
aus einer fremden E-Mail einfließt. → C-07

---

## 6. S-14 gegen E-005, E-017, E-031, E-034 und I-15

S-14 ist der Screen, den es in der ursprünglichen Spezifikation nicht gab, und er ist der
sauberste der vierzehn.

| Prüfung | Beleg | Stand |
|---|---|---|
| Vorlage ist eine geordnete Feldliste aus Name, Quelle, Transformation, Bedingung | A-8.7, E-005 | ✓ |
| Standardvorlage nicht löschbar, nicht änderbar, kopierbar | A-8.7 | ✓ Löschknopf gesperrt **mit Begründung**, Kopierdialog vorhanden |
| Quelle aus geschlossener Liste, kein Freitextpfad | E-017 | ✓ und **strenger als verlangt**: Die Liste kommt seit E-049 vom Dienst; `readSourceCatalog` wirft jeden gelieferten Pfad heraus, der nach Vermerk aussieht, und S-14 **spricht den Befund als Fehler aus**, statt still zu filtern |
| Vermerk nicht wählbar, erklärender Satz trotzdem da | A-7.2, R-06 | ✓ `catalog.noteBoundaryHint` unter der Auswahl |
| Vorschau auf tatsächlich offenen Buchungen | A-8.7 | ✓ echte Daten, kein Beispiel |
| Vorschau nach Tagesgruppen, aufklappbar | E-031 | ✓ |
| Segmente sichtbar getrennt | E-026, E-028 | ✓ jede Buchung mit eigener Zeile, eigenem Text und „Bearbeiten" |
| Gruppe ohne Leistung gekennzeichnet, Text direkt nachtragbar | E-034 | ✓ eigener Block mit Grund und Knopf, der den Buchungsdialog öffnet |
| JSON und Klartext nebeneinander | A-8.4, A-8.9, B-14 | ✓ „So steht es in der Datei" gegen „Feld für Feld", mit dem Satz zu Base64 und dem Klartext darunter |
| Vorschau zeigt den Stand im Editor | E-051 | ✓ Der Hinweis „zeigt den gespeicherten Stand" ist weg, weil er nicht mehr stimmt |
| Umsortieren ohne Ziehen | A-13.6, SC 2.5.7 | ✓ |
| I-15 vollständig | I-15 | ✓ anlegen, kopieren, bearbeiten, löschen, Vorschau, Fehler an der Feldzeile |

Eine einzige Anmerkung: S-07 fragt die Vorschau weiterhin mit der **Kennung** der aktiven Vorlage,
S-14 mit dem Entwurf. Das ist richtig so — der Lauf nimmt die gespeicherte Vorlage —, aber S-07
sagt es nicht. Der frontend-dev hat das selbst als offene Frage 4 gemeldet. → C-19

**S-14 ist abgenommen.**

---

## 7. Was die Spezifikation verlangt und niemand gebaut hat

Der Durchgang durch `docs/spec.md`, Anforderung für Anforderung. Was hier steht, ist im Quelltext
nachgewiesen abwesend — nicht bloß nicht gefunden.

| Anforderung | Was fehlt | Befund |
|---|---|---|
| **A-3.3** „Todos danach organisieren und filtern" | S-11 zeigt weder die Trefferzahl je Pool noch die Live-Vorschau der passenden Todos. Man legt eine Regel an und erfährt erst in S-02, ob sie etwas trifft | C-06 |
| **A-4.4** „Navigation und Verwaltung bleiben übersichtlich" | S-08 hat **keine Suche**. Das Add-in hat eine, der Todo-Dialog hat eine, ausgerechnet der Verwaltungsscreen für tiefe Bäume hat keine. Ebenso fehlt die Zahl der Todos je Tag | C-11 |
| **A-4.6** „verhindert das beim Verschieben" | Die Zielauswahl schließt nur den Ordner selbst aus, nicht seine Nachfahren. Der Zyklus wird erst vom Dienst abgelehnt (409), und im Dialog steht dessen Rohmeldung | C-08 |
| **A-8.5** Windows-Benutzername wird mitübertragen | Er steht **nirgends** in der Oberfläche. E-042 hat eigens einen abgesicherten Kanal gebaut, damit der richtige Name in die Abrechnung geht — nachsehen kann ihn niemand. Ebenso fehlt der Speicherort der Datenbank (E-010, T-005 S-09, Bereich Anwendung) | C-20 |
| **A-8.7** Vorlage kann ein verlangtes Feld nicht füllen | S-07 warnt nicht, wenn eine Gruppe ohne Call-Nummer in eine Vorlage läuft, die sie fordert. Gewarnt wird nur bei fehlender Leistung (E-034) | C-21 |
| **A-9.3** „Beim Erstellen werden diese Tags automatisch hinzugefügt" | Weder Formular noch Add-in zeigen sie vorbelegt und entfernbar; im Add-in sind sie ausdrücklich gesperrt (`disabled`, `locked`) | C-09 |
| **A-9.4** Standard-Tags jederzeit anpassbar | Es fehlt der Satz, dass bestehende Todos unverändert bleiben (B-11), und der Bestätigungsdialog beim Leeren | C-10 |
| **A-13.6** „Drag & Drop unterstützt" | Vorhanden in S-04 und S-14. In S-08 gibt es kein Ziehen — I-07 und I-08 laufen ausschließlich über einen Dialog | C-11 |
| **A-13.7** globale Suche und Filter | Die Suche trifft Todos und Leistungstexte (E-038) ✓, gruppiert die Treffer aber **nicht nach Trefferart**, wie E-038 es verlangt. In S-06 fehlen vier der acht Filter aus I-10 | C-14, C-22 |
| **§12** Dashboard | „aktuelle Projekte beziehungsweise Tags" fehlt als eigene Kachel; die Zeilen der zuletzt bearbeiteten Todos tragen weder Zeit noch Aufteilung | C-12 |
| **R-10** Protokoll | Kein Ort in der Oberfläche | C-01 |

Zwei Dinge, die ich ausdrücklich **nicht** als Mangel führe, obwohl T-005 sie anders vorgezeichnet
hatte, weil die gebaute Lösung besser ist:

- **Die Statusstruktur liegt am Board, nicht in S-09.** T-005 hatte sie in die Einstellungen
  gelegt. Sie dort zu verwalten, wo man sie sieht, ist richtiger; S-09 verweist allerdings nicht
  darauf, wer dort sucht, findet nichts. Kleine Anmerkung, kein Befund.
- **Eine Spalte mit Karten wird nicht gelöscht, statt nach einem Ziel zu fragen.** T-005 wollte die
  Zielauswahl. Ablehnen ist die sicherere Antwort und A-5.4 verlangt keine bestimmte. Kein Befund.

---

## 8. Befunde

```
C-01  R-10, E-012, A-6.6, B-08   kein Screen                              BLOCKIEREND
      Abweichung: Das Exportprotokoll hat eine Route (GET /export/audit), eine Client-Funktion
      (api/endpoints.ts:531) und keinen einzigen Aufrufer in apps/web/src. Damit ist die
      Maßnahme, mit der R-10 eine Doppelabrechnung nachvollziehbar hält, in der Oberfläche
      nicht vorhanden. Wer eine Buchung zurücksetzt, kann nirgends nachsehen, wann sie
      exportiert, wann sie zurückgesetzt und mit welcher Begründung — obwohl die Begründung
      Pflichtfeld ist und geschrieben wird. Dasselbe Loch trifft Ort 14 der 19: „Letzte
      Exportläufe" nennt Datei, Anzahl und Summe, aber nicht, welche Buchungen darin waren.
      Das war Auflage aus T-005, ausdrücklich vor der Abnahme zu schließen.
      Vorschlag: Zwei Orte, beide klein. (1) Zeilenmenü in S-06 und S-03 bekommt „Verlauf
      dieser Buchung" mit den Ereignissen aus listExportAudit(entryId) — Zeitpunkt, Art,
      Begründung, Lauf. (2) Ein Lauf in der Liste „Letzte Exportläufe" wird aufklappbar und
      zeigt über getExportRun seine Buchungen. Beide Datenwege existieren bereits.

C-02  A-8.4, A-8.6, A-8.9, A-7.2, B-14   S-07 Export-Ansicht              BLOCKIEREND
      Abweichung: S-07 zeigt Tagesgruppen, zusammengeführte Leistung und gerundete Zeit —
      aber an keiner Stelle das JSON, das geschrieben wird. `totals.rows` wird geholt und nur
      gezählt (ExportScreen.tsx:530). Damit fehlt die Kontrollstelle genau dort, wo sie zählt:
      S-14 prüft eine Vorlage, S-07 schreibt die Datei. Ein Benutzer, der in S-07 steht, sieht
      vor dem Schreiben weder die Feldnamen noch die Base64-Notiz noch deren Klartext — und ein
      Bruch der Notiz-Trennung fiele hier zuerst auf. Auflage aus T-005, halb geschlossen.
      Vorschlag: Die aufgeklappte Gruppe in S-07 bekommt denselben zweispaltigen Block, den
      TemplatePreview schon hat („So steht es in der Datei" / „Feld für Feld"). Die Zeile liegt
      in `totals.rows[i]` und ist über `groups[i]` bereits der Gruppe zugeordnet. Es ist ein
      Baustein, der existiert, und eine Zuordnung, die der Dienst schon liefert.

C-03  A-2.5, A-10.9, I-05, B-04   S-12 Add-in                             BLOCKIEREND
      Abweichung: Beim Buchen auf ein erledigtes Todo entscheidet ein Kontrollkästchen, ob
      „Erledigt" fällt — Voreinstellung aus (TaskPane.tsx:78, `reopenIfDone: reopen`). A-2.5
      sagt „hebt die Anwendung den Erledigt-Status automatisch auf", T-005n führt S-12 als
      sechsten Startpunkt mit identischer Folge, und keine Entscheidung in decisions.md hat das
      abgelöst. Die Folge ist nicht kosmetisch: Zeit wird auf ein Todo gebucht, das erledigt
      bleibt und damit aus jeder Pool-Ansicht ausgeblendet ist — die Buchung geht trotzdem in
      den Export. Der Text daneben sagt es sogar: „Es bleibt erledigt, sofern du es nicht
      ausdrücklich wieder aktiv setzt."
      Vorschlag: Entweder das Kästchen umdrehen (gesetzt als Voreinstellung, abwählbar, mit
      demselben Satz) — oder der Orchestrator hält als Entscheidung fest, dass eine
      nachgetragene Buchung aus dem Add-in kein Timerstart im Sinn von A-2.5 ist, und T-005n
      streicht S-12 aus den sechs Startpunkten. Beides ist vertretbar; der heutige Zustand
      widerspricht der verbindlichen Fassung, ohne dass jemand es entschieden hat.

C-04  A-2.5, I-05, §12   S-01 Dashboard, S-05 Zeiterfassung              BLOCKIEREND
      Abweichung: Beide Ansichten laden ihre Todo-Auswahl mit `onlyOpen: true`
      (DashboardScreen.tsx:55, TimeScreen.tsx:51). Ein erledigtes Todo erscheint dort nie, also
      ist I-05 von beiden Startpunkten aus nicht auslösbar. In S-05 steht daneben wörtlich
      „Startet der Timer auf einem erledigten Todo, ist es danach wieder offen." — ein
      Versprechen, das dieser Screen nicht einlösen kann. Von den sechs Startpunkten aus
      T-005n bleiben drei.
      Vorschlag: Derselbe Schalter „Erledigte einblenden", den S-02 und S-04 schon haben, in
      der Auswahlliste von S-05; auf S-01 genügt es, die erledigten Todos in „Zuletzt
      bearbeitet" mitzuführen und mit ihrem Kennzeichen zu zeigen. Der Schalter ist in
      TodoListScreen fertig und kostet in S-05 vier Zeilen.

C-05  A-8.8, A-8.9, R-05, §15   S-07 Bestätigungsdialog
      Abweichung: Der Dialog vor dem Schreiben nennt Anzahl, Exportzeilen, Stunden und die
      Sperre danach — aber weder den Zielpfad noch den Dateinamen noch den Satz, dass die Datei
      lesbare Kundennotizen enthält. A-8.9 ist ein Nachtrag der Spezifikation, und dieser
      Dialog ist der einzige Ort, an dem er den Benutzer erreicht: der letzte Augenblick, bevor
      Kundendaten die Anwendung verlassen.
      Vorschlag: Wortlaut aus T-005, 3.3, Schritt 5 — „8 Buchungen (6,25 h) werden nach
      C:\Takt\Export\takt-export-….json geschrieben und danach als exportiert markiert. Die
      Datei enthält lesbare Kundennotizen." Der Pfad steht in `settings.exportDirectory` und
      liegt zwei Zeilen darüber schon auf dem Bildschirm.

C-06  A-3.1 bis A-3.3, I-13   S-11 Pools
      Abweichung: Die Poolliste zeigt Name und Regel, aber keine Trefferzahl; der Editor zeigt
      keine Live-Vorschau der passenden Todos. A-3.3 verlangt, Todos „danach zu organisieren
      und zu filtern" — wer eine Regel baut, muss sehen, was sie trifft, sonst ist die Regel
      eine Vermutung. Die Auskunft gibt es bereits: listTodos({poolIds:[id]}).total.
      Vorschlag: Trefferzahl je Poolzeile, im Editor die Zahl plus die ersten fünf Titel, die
      sich bei jeder Regeländerung mitbewegen. Dazu der Satz aus B-12, dass Pools sich
      überschneiden dürfen.

C-07  A-7.2, A-7.4, A-10.6, R-08   S-12 Add-in
      Abweichung: Vermerk und Leistung stehen im Add-in als zwei gewöhnliche Textfelder
      nebeneinander, unterschieden allein durch Beschriftung und Hinweiszeile. `addin.css`
      kennt keine Entsprechung zu `note--billing`/`note--internal`. Die sechs Merkmale aus
      T-015 und T-005n, 4.1 — Randschiene, Kopfband mit Richtung, Symbol, Marke vor der
      Beschriftung, Schreibfläche, Fußnote — fehlen. Ausgerechnet dort, wo T-005 den
      gefährlichsten Ort sieht, weil Text aus einer fremden E-Mail einfließt und die
      Übernahme-Schaltfläche direkt daneben steht.
      Vorschlag: Die drei Merkmale übernehmen, die ohne base.css tragen — gestreifte gegen
      einfarbige Randschiene, Kopfband mit Pfeil beziehungsweise Schloss, Marke vor der
      Beschriftung. Die Token teilt das Add-in ohnehin (E-040).

C-08  A-4.6, B-06, I-08   S-08 Verschieben-Dialog
      Abweichung: Die Zielauswahl filtert nur den gewählten Ordner selbst heraus
      (TagsScreen.tsx:351). Ein Ordner lässt sich unter seinen eigenen Enkel wählen; abgelehnt
      wird erst vom Dienst mit 409, und im Dialog erscheint dessen Rohmeldung. A-4.6 sagt
      „Die Anwendung verhindert das beim Verschieben" — angeboten und dann abgelehnt ist nicht
      verhindert. Die Daten sind sicher; die Anforderung ist es nicht.
      Vorschlag: Nachfahren aus der Auswahl nehmen — der Baum liegt in `flatFolders` bereits
      als Pfadliste vor, ein Präfixvergleich genügt. Die Fehlermeldung bleibt als letzte
      Absicherung, dann aber mit dem Satz aus T-005: „»Kunden« kann nicht nach »Kunden/Nord«
      verschoben werden, weil »Kunden/Nord« darin liegt."

C-09  A-9.3, A-9.5, B-10   S-02/S-04 Todo-Formular, S-12 Add-in
      Abweichung: Die Standard-Tags sind nirgends vorbelegt und nirgends entfernbar. Das
      Formular sagt es sogar: „sie stehen hier nicht zur Wahl". Im Add-in stehen sie als Chips
      ohne Entfernen-Kreuz und als deaktivierte Kästchen (TagPicker.tsx:121-125). Die
      Begründung — dieselbe Regel nicht zweimal führen — ist gut; die Wirkung ist es nicht:
      A-9.2 nennt als Beispiel „Nicht abgerechnet". Wer ein abrechenbares Todo anlegt, muss es
      erst speichern und dann bearbeiten, um das Tag loszuwerden.
      Vorschlag: Der Dienst liefert die Standard-Tags ohnehin über den Kontext. Das Formular
      belegt sie vor, markiert sie als Standard und lässt sie entfernen; beim Anlegen wird die
      Liste geschickt, wie sie dasteht. Eine Regel, ein Ort — und der Benutzer sieht sie.

C-10  A-9.3, A-9.4, §15, B-11   S-10 Standard-Tags
      Abweichung: Es fehlt der feste Satz, dass eine Änderung bestehende Todos nicht berührt
      (A-9.3 spricht nur vom Erstellen), und es fehlt der Bestätigungsdialog beim Entfernen
      aller Standard-Tags. Der Hinweistext danach nennt zwar die Folge, aber erst hinterher.
      Vorschlag: Satz unter die Chipliste. Dialog mit dem Wortlaut aus T-005: „Neue Todos
      bekommen dann keine Tags mehr. Das betrifft auch Todos aus dem Outlook-Add-in."

C-11  A-4.1 bis A-4.4, A-13.3, A-13.6, I-06, I-07, §15   S-08
      Abweichung: Vier Lücken in einer Ansicht. (1) Keine Suche über Tags und Ordner — die
      einzige Ansicht mit tiefen Bäumen ist die einzige ohne Suche, während Add-in und
      Todo-Dialog eine haben. (2) Keine Zahl der Todos je Tag (`usageCount` wird nie gesetzt).
      (3) Kein Drag & Drop, obwohl A-13.6 es allgemein verlangt und I-07/I-08 die
      naheliegenden Fälle sind. (4) Kein Leerzustand für einen leeren Ordner. Der
      Löschdialog nennt außerdem nicht, wie viele Todos ein Tag trägt.
      Vorschlag: Suche zuerst — sie ist die billigste der vier und die, die A-4.4 wörtlich
      trägt. `flattenTagTree`/`filterTags` aus dem Add-in tun genau das schon.

C-12  A-6.6, §12   S-01 Dashboard
      Abweichung: Drei der 19 Orte fehlen hier. Die Zeilen unter „Zuletzt bearbeitet" tragen
      weder erfasste Zeit noch deren Aufteilung in offen und exportiert; der laufende Timer
      sagt weder auf S-01 noch auf S-05, dass die laufende Buchung offen ist. §12 nennt
      außerdem „aktuelle Projekte beziehungsweise Tags" als eigene Angabe; gezeigt werden nur
      zwei Chips je Zeile.
      Vorschlag: `ExportSummaryStrip` in die Zeile — der Baustein steht, `loadExportSummaries`
      auch. Am Timer ein „offen"-Etikett. Eine Kachel mit den meistgenutzten Tags.

C-13  E-020, B-20   S-03 Todo-Detailansicht
      Abweichung: Der Kopf einer Tagesgruppe zeigt „4 Buchungen · 1:05 h offen", aber nicht
      den gerundeten Wert dieser Gruppe. Der gerundete Wert steht nur als Summe über alle
      Gruppen in der Seitenleiste. Genau hier — an der Gruppe — wollte B-20 ihn haben, weil
      hier sichtbar wird, wie aus 10, 20 und 5 Minuten 0,75 werden.
      Vorschlag: Die Vorschau wird für dieses Todo ohnehin geholt (`previewExport(null,
      openIds)`); sie liefert `groups[].quarters` je Tag. Der Wert muss nur in den Gruppenkopf.

C-14  I-10, A-13.7   S-06
      Abweichung: I-10 nennt acht Filter — Zeitraum, Exportstatus, Todo, Tag, Pool,
      Call-Nummer und „hat Notiz". Gebaut sind Zeitraum, Exportstatus, Todo und die Einengung
      „schon einmal exportiert". Vier fehlen, darunter Tag und Pool, also genau die beiden,
      mit denen A-3.3 und A-4.5 arbeiten.
      Vorschlag: Tag und Pool zuerst; „hat Notiz" ist der Filter, mit dem man vor einem Export
      die Gruppen findet, die nach E-034 stehenbleiben würden.

C-15  §15   S-03
      Abweichung: Der Vermerk wird von Hand gespeichert und zeigt „Nicht gespeicherte
      Änderung", aber beim Verlassen der Ansicht fragt nichts nach. §15 verlangt
      Bestätigungsdialoge, T-005 nennt diesen Fall ausdrücklich für S-03.
      Vorschlag: `beforeunload` plus Abfangen des Routenwechsels, solange `noteDirty` gilt.

C-16  §15, A-6.9   S-05
      Abweichung: Die Buchungszeilen unter „Buchungen von heute" tragen keine Aktionen —
      weder Bearbeiten noch Löschen. Damit hat S-05 keinen Hover-Zustand im Sinn von §15, und
      T-005 S-05 („Buchung von Hand anlegen und bearbeiten, solange offen") ist nur zur Hälfte
      erfüllt. Wer die Leistung einer eben gestoppten Buchung nachtragen will, muss über das
      Todo gehen.
      Vorschlag: Dasselbe Zeilenmenü wie in S-06; `BookingFormDialog` liegt schon in dieser
      Datei.

C-17  E-030   Timer.tsx:73, Kanban.tsx:168, ControlsSection.tsx:74
      Abweichung: Der Timerknopf heißt in der Kanban-Karte und in der kleinen Timeranzeige
      „Zeiterfassung starten" / „Zeiterfassung stoppen", überall sonst „Timer für ‚X' starten".
      E-030 trennt beides ausdrücklich: Timer ist das Bedienelement, Zeiterfassung der
      Bereich. Ein Bereich lässt sich nicht starten.
      Vorschlag: „Timer starten" / „Timer stoppen", mit dem Todo-Titel darin, wo er bekannt
      ist — dann heißt derselbe Knopf auf allen fünf Screens gleich.

C-18  T-005 §6, E-011   S-07, S-08, S-09
      Abweichung: Derselbe Ordner heißt „Exportordner" (S-09, Feldbeschriftung) und
      „Zielordner" (S-09 Kartentext, S-07 Kachel, S-09 Fehlertext). Schlimmer: In S-08 heißt
      das Auswahlfeld beim Verschieben eines Tags ebenfalls „Zielordner" und meint einen
      Tag-Ordner. Ein Wort, zwei Sachen — und für die eine Sache zwei Wörter.
      Vorschlag: Durchgehend **Exportordner**. In S-08 „Neuer übergeordneter Ordner"
      beziehungsweise „Ordner für dieses Tag".

C-19  A-8.7, E-051   S-07
      Abweichung: S-07 rendert die Vorschau mit der Kennung der aktiven, gespeicherten
      Vorlage; S-14 rendert den Entwurf. Wer in S-14 einen ungespeicherten Stand sieht und
      nach S-07 wechselt, sieht dort etwas anderes, ohne dass es jemand sagt. Vom frontend-dev
      selbst gemeldet (T-035, offene Frage 4).
      Vorschlag: Ein Satz an der Vorlagenauswahl in S-07: „Gerechnet wird mit der
      gespeicherten Fassung dieser Vorlage." Der Lauf nimmt sie, also stimmt der Satz.

C-20  A-8.5, E-010, E-042   S-09
      Abweichung: Der Windows-Benutzername steht in keiner Ansicht. Er geht in jede
      Exportzeile (A-8.5), E-042 hat für ihn eigens einen abgesicherten Kanal gebaut, weil
      eine gesetzte Umgebungsvariable sonst fremde Arbeitszeit unter fremdem Namen abrechnen
      ließe — und der Benutzer kann nicht nachsehen, welcher Name das ist. Ebenso fehlt der
      Speicherort der Datenbank (E-010, T-005 S-09).
      Vorschlag: Ein Abschnitt „Diese Installation" in S-09 mit beidem als reinem
      Anzeigewert. Der Wert liegt bereits in der Antwort (`api/types.ts:479`).

C-21  A-2.6, A-8.7   S-07
      Abweichung: Kann die Vorlage für eine Gruppe ein verlangtes Feld nicht füllen — etwa
      `Call` bei einem Todo ohne Call-Nummer —, sagt das vor dem Klick niemand. Gewarnt wird
      nur bei fehlender Leistung (E-034). Nach A-8.8 rollt ein Fehlschlag alles zurück, und
      der Benutzer weiß dann nicht, welche Gruppe schuld war.
      Vorschlag: Die Gruppenzeile trägt „ohne Call" bereits; sie muss nur wissen, ob die
      aktive Vorlage ein Feld mit dieser Quelle und einer Bedingung führt, und das dann als
      Warnung zeigen. Die Vorlage liegt in derselben Ansicht.

C-22  E-038, A-13.7   Globale Suche
      Abweichung: Treffer aus Todos und aus Leistungstexten stehen in einer Liste
      hintereinander, unterschieden nur durch ein Symbol. E-038 verlangt ausdrücklich eine
      Gruppierung nach Trefferart, „damit erkennbar bleibt, ob ein Treffer aus einem internen
      Vermerk oder aus einem Text stammt, der beim Kunden gelandet ist".
      Vorschlag: Zwei Abschnitte mit Überschrift im Listenfeld, `role="group"` mit
      `aria-label`.

C-23  A-2.5, T-005n Abschnitt 1 Regel 1   S-02, S-03
      Abweichung: Der dritte Anzeigezustand „Erledigt aufgehoben" steht nur auf der
      Kanban-Karte. `timer.reactivated` wird an TodoListScreen und TodoDetailScreen nicht
      gereicht; dort sieht das Todo nach der Reaktivierung aus, als wäre es nie erledigt
      gewesen, und der Wechsel bleibt unerklärt.
      Vorschlag: Dasselbe Etikett in der Zeile von S-02 und im Erledigt-Schalter von S-03.
      Der Zustand liegt im Kontext bereit, der Baustein auf der Karte ebenfalls.
```

---

## 9. Annahmen

- **AN-01.** Keine Shell in dieser Sitzung: geprüft wurde gegen den Quelltext, nicht gegen die
  laufende Anwendung. Jeder Befund nennt Datei oder Bausteinnamen. Nicht geprüft sind:
  Bildschirmwirkung von Hover und Fokus, das Gefühl der 400-ms-Entprellung in S-14, die
  tatsächliche Ziehbewegung im Board, und ob die drei Sicherheitsbefunde des domain-dev die
  Routen zwischenzeitlich verändert haben.
- **AN-02.** Die 545 grünen Tests, die 14 bestandenen e2e-Fälle und die 266 Kontrastpaare habe ich
  nicht nachgerechnet, sondern als gemessen übernommen. Sie belegen, was sie prüfen; die elf nicht
  gelaufenen Fälle aus T-012 belegen nichts, und genau deren Fläche ist Abschnitt 2 dieses Berichts.
- **AN-03.** Wo eine Umsetzung von T-005 abweicht und die Abweichung besser ist, führe ich sie
  nicht als Befund. Betrifft: Leerzustand der Vorschau in S-14 (B-09), Ablehnen statt Zielauswahl
  beim Löschen einer Spalte mit Karten, Statusspalten am Board statt in den Einstellungen.
- **AN-04.** „Blockierend" heißt: vor der Abnahme zu schließen. C-01 und C-02 waren bereits
  Auflagen aus T-005; C-03 und C-04 betreffen die Anforderung, an der die Spezifikation am
  häufigsten hängt.

---

## 10. Offene Fragen an den Orchestrator

- **F-01, hängt an C-03.** Ist eine von Hand nachgetragene Buchung aus dem Add-in ein Timerstart im
  Sinn von A-2.5? Wenn ja, muss das Kästchen umgedreht werden. Wenn nein, gehört das als
  Entscheidung festgehalten und T-005n streicht S-12 aus den sechs Startpunkten. Beides ist
  vertretbar — nur der jetzige Zustand ist es nicht, weil er keiner Festlegung folgt.
- **F-02, hängt an C-09.** Sollen Standard-Tags im Formular vorbelegt und entfernbar sein (so
  B-10), oder bleibt es beim Ergänzen durch den Dienst? Der frontend-dev hat gut begründet, warum
  er es anders gebaut hat. Die Entscheidung ist eine Produktfrage.
- **F-03.** Soll der Windows-Benutzername in S-09 sichtbar sein (C-20)? Er ist kein Geheimnis, aber
  er ist auch nichts, was der Benutzer ändern kann. Ich halte das Anzeigen für richtig, weil E-042
  eigens gebaut wurde, damit der richtige Name in die Abrechnung geht.
- **F-04.** Der Exportordner ist in S-09 weiterhin ein Freitextfeld (Sicherheitsbefund, eigene
  Aufgabe, in T-035 ausdrücklich nicht angefasst). Aus Bediensicht ist das ein eigener Mangel — ein
  getippter Pfad ist die häufigste Ursache für den Fehlerfall „Ordner nicht da". Ich führe ihn
  nicht als Befund, weil er bereits eine Aufgabe hat; die Frage ist nur, ob sie vor der Abnahme
  läuft.

---

## 11. Urteil

**Nacharbeit.**

Blockierend: **C-01**, **C-02**, **C-03**, **C-04**.

- **C-01** und **C-02** sind meine eigenen Auflagen B-08 und B-14 aus T-005, ausdrücklich vor der
  Abnahme zu schließen, und beide sind es nicht. Beide betreffen dieselbe Stelle des Produkts: den
  Übergang von erfasster Zeit zu abgerechnetem Geld. Für beide liegen Daten, Route und Baustein
  bereits vor; es fehlt jeweils der Ort in der Oberfläche.
- **C-03** und **C-04** betreffen A-2.5, die Anforderung, die in der Spezifikation an fünf Stellen
  auftaucht und für die T-005n sechs Startpunkte mit identischer Folge festgelegt hat. Drei davon
  halten das nicht: zwei, weil erledigte Todos dort gar nicht erscheinen, einer, weil die
  Reaktivierung dort eine Voreinstellung mit „aus" ist. In S-05 steht dazu ein Satz auf dem
  Bildschirm, den dieser Screen nicht einlösen kann.

Die übrigen neunzehn Befunde sind Nacharbeit ohne Blockade und gehen ohne weitere Entscheidung an
die Umsetzung — mit Ausnahme von C-09, das an F-02 hängt, und C-20, das an F-03 hängt.

**Was ausdrücklich freigegeben ist:** S-14 vollständig (Abschnitt 6). Die Zustände aus Abschnitt 15
bis auf drei kleine Lücken. Die Begriffe bis auf zwei Abweichungen. Die Umsetzung von E-016, E-020,
E-023, E-025, E-031, E-032, E-034, E-036, E-039, E-047 und E-050 — alle elf sitzen dort, wo sie
hingehören, und die Kommentare im Quelltext sagen an jeder dieser Stellen, warum. Die
Zustandsmatrix aus T-005n ist gebaut worden, und zwar als Bauvorgabe gelesen und nicht als
Vorschlag. Das ist der Grund, warum dieser Bericht neunzehn kleine Befunde hat und nicht neunzehn
große.
