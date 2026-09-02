# Glossar — Takt

Stand: 2026-09-01, nach Abschluss aller Aufgaben. Das Domänenmodell aus T-001
(`docs/datenmodell.md`) liegt vor: Tabellen- und Spaltennamen sind englisch und stabil. Die
TypeScript-Typen in `packages/domain` und `packages/storage` sind es ebenfalls: T-013 und T-013b
(E-015) haben die Umbenennung abgeschlossen, belegt in `.claude/team/reports/T-013-domain-dev.md`.
Wo dieses Glossar einen Domänentyp nennt, ist das der aktuelle, englische Name.

Regel für dieses Glossar: Ein Ding bekommt einen Namen. Wo die Spezifikation zwei Namen für
dieselbe Sache verwendet, steht der zweite Name in der Spalte „Spezifikation nennt auch". Wo
unklar war, ob zwei Namen wirklich dieselbe Sache meinen, steht der Fall unter „Geklärte
Doppelbenennungen" am Ende dieses Dokuments statt als eigene Begriffszeile.

Quellenangaben sind Anforderungs-IDs aus `docs/spec.md` (A-x.x, S-xx, I-xx, §xx), Einträge aus
`.claude/team/decisions.md` (E-xxx) oder Abschnitte aus `docs/datenmodell.md`.

---

## Die wichtigste Unterscheidung: zwei Notizen, zwei Namen (R-08, E-016)

Takt hat zwei getrennte Notizfelder, und beide heißen in der Spezifikation „Notiz":

- die persönliche Notiz am Todo (A-7.1), die die Anwendung nie verlässt (A-7.2)
- die Notiz an der einzelnen Zeitbuchung (A-7.3), die beim Export an das Abrechnungstool geht
  (A-7.4)

Das ist der wahrscheinlichste Bedienfehler des Produkts: Jemand trägt eine interne Bemerkung dort
ein, wo die Beschreibung für die Rechnung stehen sollte, oder umgekehrt. Der Fehler fällt erst
auf, wenn die Rechnung beim Kunden liegt.

**Verbindliche Namen, bestätigt am 2026-08-31 durch den Auftraggeber:**

| Bisherige Bezeichnung (spec.md) | Neuer Name | Geht in den Export? |
|---|---|---|
| Persönliche Notiz am Todo (A-7.1) | **Vermerk** | Nein |
| Notiz der Zeitbuchung (A-7.3, A-7.4) | **Leistung** | Ja |

Zwei frühere Vorschläge sind damit vom Tisch. „Persönliche Notiz" gegen „Leistungsnotiz" (T-005)
teilt sich weiter den Wortstamm „Notiz" und verwechselt sich unter Zeitdruck genauso leicht wie
vorher. „Leistungsbeschreibung" (T-004, frühere Fassung dieses Glossars) trennt sauber, ist als
Feldbeschriftung aber zu lang. Den Namen für das exportierte Feld hat der Auftraggeber selbst
gesetzt: Leistung.

Die Begründung von T-004 gilt für beide Namen weiter: Sie teilen sich keinen gemeinsamen
Wortstamm, und jeder Name sagt selbst, wohin der Text geht. Ein Vermerk bleibt in der Anwendung,
eine Leistung geht auf die Rechnung.

Der JSON-Schlüssel im Export bleibt `Notiz` (A-8.2), weil ihn das Abrechnungstool vorgibt und
`CLAUDE.md` ihn nicht zur Änderung freigibt. Das betrifft nur das technische Übertragungsformat.
Auf dem Bildschirm, in der Dokumentation und im Review heißt das Feld Leistung.

---

## Exportstatus: zwei Werte, vier Anzeigen (E-032, E-047, E-050)

Der Exportstatus einer Zeitbuchung kennt genau zwei Werte: **offen** und **exportiert**
(Datenbankwerte `open` und `exported`). Das gilt für jeden Filter, jede Abfrage und jede
Exportauswahl — auch für eine Buchung, deren Exportstatus zurückgesetzt wurde (E-012). Sie ist
danach wieder **offen**, nicht „erneut offen". „Erneut offen" ist kein dritter Wert und darf eine
Buchung nie aus der Menge der zu exportierenden herausnehmen.

Auf dem Bildschirm zeigt Takt zu diesen zwei Werten vier Erscheinungsbilder, weil zwei
Zusatzfälle für die Anzeige wichtig sind, ohne dass sie den Status selbst vermehren:

- **Offen** — Wert `open`, `export_count = 0` oder noch nie exportiert.
- **Exportiert** — Wert `exported`, aus einem echten Exportlauf entstanden.
- **Erneut offen** — Wert `open` bei `export_count > 0`. Dass eine offene Buchung schon einmal in
  einem Exportlauf war, zeigt die Oberfläche als zusätzliches Merkmal an, mitgezählt in
  `time_entry.export_count`, mit dem Etikett „Erneut offen" (Variante A aus T-006, abgenommen mit
  dem Designsystem, E-024).
- **Nicht abgerechnet** — Wert `exported`, aber aus dem Vorgang „nicht abrechnen" entstanden statt
  aus einem Exportlauf (E-047, E-050). Diese Buchung war nie in einer Exportdatei; das Protokoll
  hält die Herkunft über den Ereignistyp `not_billed` fest. Ohne dieses vierte Anzeigebild trüge
  eine ausgebuchte Buchung dasselbe Etikett wie eine tatsächlich exportierte, und genau diese
  Unterscheidung war der ganze Zweck von E-047.

Beide Zusatzbilder bleiben Anzeigeeigenschaften einer der zwei tatsächlichen Werte, nie ein
dritter oder vierter Status und nie ein Filterkriterium. Wer „Erneut offen" oder „Nicht
abgerechnet" als eigene Klasse filtert, lässt eine Buchung versehentlich aus dem nächsten Export
herausfallen oder verwechselt eine Ausbuchung mit einem echten Export.

---

## Begriffe

| Deutscher Begriff | Spezifikation nennt auch | Code | Bedeutung | Beleg |
|---|---|---|---|---|
| Todo | „Ticket" (Abschnitt 1, A-2.1) — entfällt als Oberflächentext, siehe „Geklärte Doppelbenennungen" | Tabelle `todo` | Eine Aufgabe, die ein Benutzer anlegt, um Arbeit zu planen, zu verfolgen und abzurechnen. | A-2.1, E-029, docs/datenmodell.md §3.2 |
| Zeitbuchung, kurz Buchung | „Buchung", „Arbeitszeit", „erfasste Zeiten", „Zeiten" | Tabelle `time_entry`; Domänentyp `TimeEntry` | Ein einzelner erfasster Zeitabschnitt an einem Todo, mit Startzeit, Endzeit, berechneter Dauer, Exportstatus und eigener Notiz (Leistung). | A-6.3, A-6.4, A-6.6, docs/datenmodell.md §3.4 |
| Timer | „Time-Tracker" (A-5.6) — entfällt als Oberflächentext, siehe „Geklärte Doppelbenennungen" | kein eigenes Speicherobjekt; „ein Timer läuft" bedeutet: eine Zeile in `time_entry` ohne `ended_at`, Domänentyp `RunningTimeEntry` | Das Bedienelement zum Starten und Stoppen der Zeitmessung an einem Todo. Sein Stopp erzeugt eine neue Zeitbuchung. Die Zeiterfassung ist der Bereich, der den Timer enthält (E-030). | A-6.1, A-6.2, A-5.6, E-030, docs/datenmodell.md §3.4 |
| Zeiterfassung | „Time-Tracking-Ansicht" (S-05), „Time Tracking" (§14), „Zeittracking-Anwendung" (`CLAUDE.md`) — alle drei entfallen als Oberflächentext, siehe „Geklärte Doppelbenennungen" | kein Speicherobjekt, Navigationsbegriff, Screen S-05 | Der Bereich der Anwendung, in dem Buchungen entstehen und verwaltet werden — mit dem Timer und den eigenen Zeitbuchungen des Tages. Name des Navigationspunkts aus Abschnitt 14. Timer und Zeiterfassung sind zwei verschiedene Dinge: ein Bedienelement und der Bereich, der es enthält (E-030). | §6 (Titel), S-05, §14, E-030 |
| Erledigt | „Done" (A-5.3, nur Beispielname einer Kanban-Spalte; mit Erledigt nicht verknüpft) | Spalte `todo.completed_at` (`NULL` = aktiv), unabhängig von `todo.status_id` | Kennzeichnet ein Todo als abgeschlossen, unabhängig von seiner Kanban-Spalte: Ein Todo kann in „Done" stehen und nicht erledigt sein, oder erledigt sein und in einer anderen Spalte stehen. Startet ein Benutzer den Timer auf einem erledigten Todo erneut, hebt die Anwendung das Kennzeichen auf; das Todo erscheint dann wieder in seinen Pool-Ansichten. Die Kanban-Spalte ändert sich dabei nicht. | A-2.4, A-2.5, A-5.3, E-023, docs/datenmodell.md §3.1 f. |
| Status, Statusspalte | „Status-Spalten", „Statusstruktur" | Tabelle `todo_status`, Fremdschlüssel `todo.status_id`; Domänentyp `TodoStatus` | Die Spalte des Kanban-Boards, in der ein Todo gerade steht. Die Spalten sind konfigurierbar; Backlog, In Progress, Waiting und Done sind Beispiele, keine feste Menge. Kein Merkmal koppelt eine Spalte an das Erledigt-Kennzeichen. | A-5.2, A-5.3, A-5.4, docs/datenmodell.md §3.1 |
| Exportstatus (offen / exportiert) | für „offen": „noch nicht exportiert", „müssen noch exportiert werden", „offene Buchungen"; für „exportiert": „bereits exportiert", „bereits übertragen", „an das Abrechnungstool übertragen" | Spalte `time_entry.export_status`, Werte `open` / `exported`, `CHECK` auf genau zwei Werte; Zähler `time_entry.export_count` für die Anzeige „Erneut offen" | Zeigt für jede Zeitbuchung eindeutig, ob sie schon an das Abrechnungstool übertragen wurde oder noch offen ist. Nie leer, nie mehrdeutig, genau zwei Werte in Datenbank, Domäne und API (E-032). „Übertragen" wird auf dem Bildschirm nicht verwendet, damit es nicht mit dem Wort „Export" konkurriert. Zum Unterschied zwischen diesem Status und den zwei zusätzlichen Anzeigen „Erneut offen" und „Nicht abgerechnet" siehe den Abschnitt „Exportstatus: zwei Werte, vier Anzeigen" oben. | A-6.4 bis A-6.6, A-6.9, E-032, E-047, E-050, docs/datenmodell.md §3.4, §6.1 |
| Nicht abrechnen | kein weiterer Name in der Spezifikation; abgelöst „als exportiert markieren" (E-037) | Route `POST /time-entries/{id}/not-billed`; Ereignistyp `export_audit.event = 'not_billed'`; Domänentyp `ExportAuditEvent` | Ein Vorgang, der eine Zeitbuchung auf den Wert `exported` setzt, ohne dass ein Exportlauf stattgefunden hat: Die Zeit wird ausdrücklich nicht abgerechnet, statt fälschlich als „exportiert" durchzugehen. Keine Begründungspflicht, aber protokolliert. Auf dem Bildschirm erscheint eine so ausgebuchte Buchung mit dem Etikett „Nicht abgerechnet", siehe oben. | E-037, E-047, E-050, docs/datenmodell.md §6.2 |
| Exportprotokoll | „Protokoll" | Tabelle `export_audit`; Domänentyp `ExportAuditEntry`; Route `GET /export/audit` | Eine anhängende, unveränderliche Liste jedes Statuswechsels einer Zeitbuchung: Zeitpunkt, Vorgangsart (Export, Zurücksetzen, Nicht abrechnen), Urheber und, wo vorhanden, Begründung und zugehöriger Exportlauf. Über eine einzelne Buchung lässt sie sich vollständig abfragen (Filter `timeEntryId`); über einen Exportlauf nur so weit, wie die Oberfläche das Protokoll bereits geladen hat (Filter `exportRunId`, seit T-042 vom Dienst unterstützt, von der Oberfläche noch nicht durchgereicht). | R-10, E-012, E-047, docs/datenmodell.md §6.2 |
| Rundung | in `docs/spec.md` nur die Stufen selbst (A-8.3), kein eigener Begriff | Regel in `packages/domain/src/rounding.ts`, Typ `RoundingMode`, Werte `up` / `nearest`, laut docs/datenmodell.md §5 | Vor dem Export wird die Summe der noch offenen Zeitbuchungen einer Tagesgruppe auf die nächste Viertelstunde aufgerundet, nicht jede Buchung einzeln (E-020). Der kleinste exportierbare Wert ist 0,25. Auf dem Bildschirm heißen die beiden Modi „aufwärts" und „kaufmännisch" (siehe „Wert zu Beschriftung" unter „Code-Bezeichner"). | E-008, E-020, bestätigt 2026-08-31, docs/datenmodell.md §5, §5.5 |
| Dauer | „Zeit" (nur als Exportschlüssel) | berechnete Spalte `time_entry.duration_seconds` | Die Zeitspanne einer Zeitbuchung. Auf dem Bildschirm heißt das Feld Dauer, damit es nicht mit einer Uhrzeit verwechselt wird. Der Exportschlüssel `Zeit` stammt nicht unmittelbar aus dieser Dauer, sondern aus der gerundeten Summe der Tagesgruppe, zu der die Buchung gehört (siehe Tagesgruppe). | A-6.4, A-8.2, A-8.3, E-020 |
| Export | kein weiterer Name in der Spezifikation | Tabellen `export_run`, `export_run_group`, `export_run_entry` | Das Übertragen noch nicht exportierter Zeitbuchungen als JSON-Datei an das Abrechnungstool. Die Datei gliedert sich in Tagesgruppen, nicht in einzelne Buchungen (siehe Tagesgruppe). Läuft als Transaktion: Entweder werden Datei und Exportstatus aller enthaltenen Buchungen zusammen geschrieben, oder es passiert nichts. | A-8.1, A-8.8, E-020, E-031, docs/datenmodell.md §3.6 |
| Tagesgruppe | kein eigener Begriff in der Spezifikation, ergibt sich aus A-6.4 und A-8.1 in Verbindung mit E-020 | Domänentyp `ExportGroup` (Kandidat vor dem Export, Feld `entries` als nach Startzeit sortierte Liste von `ExportCandidate`); nach dem Export Tabelle `export_run_group` | Alle noch offenen Zeitbuchungen desselben Todos am selben Kalendertag, aus denen beim Export eine einzelne Exportzeile entsteht. Maßgeblich ist der Tag, an dem der Timer gestartet wurde; eine Buchung von 23:40 bis 00:20 zählt vollständig zum Starttag (E-025). Die Dauer der Gruppe wird erst nach der Addition aller enthaltenen Buchungen aufgerundet, nicht je Buchung (E-020). Die Leistungstexte werden nach Startzeit sortiert, an den Rändern getrimmt und mit „; " verbunden (E-026, E-028). In der Exportansicht (S-07) lässt sich eine Tagesgruppe aufklappen; darunter erscheinen die einzelnen Buchungen mit ihrer ungerundeten Dauer und ihrem eigenen Leistungstext (E-031). Eine Tagesgruppe ganz ohne Leistungstext ist nicht exportierbar; sie wird in der Vorschau markiert und bleibt offen, während der übrige Export läuft (E-034). | E-020, E-025, E-026, E-028, E-031, E-034, docs/datenmodell.md §5.5, §6.3 |
| Exportvorlage, die mitgelieferte heißt Standardvorlage | „Standardformat" (A-8.2), „Exportstruktur" (§11) | Tabelle `export_template`, Spalte `definition` als JSON | Eine geordnete Liste von Exportfeldern mit Name, Quelle, Transformation und optionaler Bedingung. Die Standardvorlage bildet Call, Zeit, Notiz und WindowsUser ab, ist nicht löschbar, aber kopierbar. Die Feldquelle stammt aus einer geschlossenen Liste, kein Freitextpfad, ausgeliefert über `GET /export/sources` (E-049). Seit E-020 bezieht sich jede Feldquelle auf die Tagesgruppe, nicht auf die Einzelbuchung; der Pfad `booking.*` ist entfernt, nicht umgedeutet, zugunsten von Gruppenquellen wie `group.quarters`, der Quelle für `Zeit` (E-033). | A-8.7, E-005, E-017, E-020, E-033, E-049, docs/datenmodell.md §3.6, §7 |
| Vermerk | siehe Abschnitt oben | Tabelle `todo_note`; Domänentyp `TodoNote` | Die persönliche Notiz am Todo. Verlässt die Anwendung nie. | A-7.1, A-7.2, E-016, docs/datenmodell.md §3.7, §7 |
| Leistung | siehe Abschnitt oben | Spalte `time_entry.note`; Exportschlüssel `Notiz` (A-8.2) | Die Notiz der einzelnen Zeitbuchung. Fließt beim Export als Base64 an das Abrechnungstool, zusammengeführt mit den Leistungstexten derselben Tagesgruppe (siehe Tagesgruppe). Als eigener Quellenpfad einer Exportvorlage ist die Einzelbuchung seit E-033 nicht mehr vorgesehen; die Vorlage greift auf die Gruppenquelle zu. | A-7.3, A-7.4, A-8.2, A-8.4, E-016, E-020, E-033 |
| Call-Nummer | „Call", „callNumber" | Spalte `todo.call_number`; Exportschlüssel `Call`; Quellenpfad `todo.callNumber` | Die Nummer, über die ein Vorgang beim Abrechnungstool identifiziert wird. Das Outlook-Add-in erkennt sie per konfigurierbarem regulärem Ausdruck. Darf leer bleiben; nicht eindeutig erzwungen, weil der Benutzer selbst entscheiden soll, ob er auf ein vorhandenes Todo bucht oder ein zweites anlegt (A-10.9). | A-2.6, A-8.2, A-8.7, A-10.8, docs/datenmodell.md §3.2 |
| Windows-Benutzer | kein weiterer Name in der Spezifikation | kein Speicherobjekt (E-010, wird vom Betriebssystem gelesen); Exportschlüssel `WindowsUser`; Quellenpfad `system.windowsUser` | Der Windows-Anmeldename, den die Anwendung vom Betriebssystem liest und bei jedem Export mitschickt. Keine Benutzereingabe. | A-8.2, A-8.5, E-010 |
| Pool, Todo-Pool | „Todo-Pool" | Tabellen `pool`, `pool_rule`; Domänentyp `Pool`, `PoolRuleTerm` | Eine Gruppe von Todos, definiert über eine Tag-Regel. Die Zugehörigkeit wird bei jeder Abfrage neu berechnet, nicht gespeichert. Ein Todo kann in mehreren Pools zugleich liegen. | A-3.1, A-3.2, A-3.4, docs/datenmodell.md §3.5 |
| Ordner | „Unterordner", „Ordnerstruktur", „Ordnerhierarchie", vereinzelt „Tag-Ordner" (A-10.5) | Tabelle `tag_folder`, `parent_id` als Adjazenzliste; Domänentyp `TagFolder` (Knoten `TagFolderNode`, Baum `TagTree`) | Ein Behälter für Tags, beliebig tief verschachtelbar, zyklusfrei. | A-4.2, A-4.3, A-4.6, docs/datenmodell.md §3.3, §4 |
| Tag | kein weiterer Name in der Spezifikation | Tabelle `tag` | Eine frei vergebene Kennzeichnung, mit der sich Todos einordnen, gruppieren und filtern lassen. | A-4.1, A-8.7, docs/datenmodell.md §3.3 |
| Standard-Tags | kein weiterer Name in der Spezifikation | Tabelle `default_tag`; Domänentyp `DefaultTag` | Tags, die die Anwendung jedem neu angelegten Todo automatisch zuweist, unabhängig vom Anlageweg, auch aus dem Outlook-Add-in. | A-9.1, A-9.3, A-9.5, docs/datenmodell.md §1 |
| Abrechnungstool | „externes Abrechnungstool" | kein Bestandteil von Takt | Das System, an das Takt seine Exportdateien übergibt. Takt hat keine Anbindung daran, nur ein gemeinsames Dateiformat. | §1, A-6.6 |
| Outlook-Add-in, kurz Add-in | kein weiterer Name in der Spezifikation | `apps/outlook-addin` | Der Teil von Takt, der in Outlook läuft und aus einer E-Mail heraus ein Todo anlegt oder auf ein vorhandenes bucht. Spricht ausschließlich mit dem lokalen Dienst, über eine eigens dafür geschnittene, schmale Routengruppe (`/api/v1/addin/*`). | A-10.1 |
| Add-in-Token | kein weiterer Name in der Spezifikation | liegt nicht in der Datenbank, siehe docs/datenmodell.md §1 „Was bewusst keine Tabelle ist"; Ablageort `localStorage` der Add-in-Herkunft | Ein von der Anwendung erzeugtes Geheimnis, mit dem sich das Outlook-Add-in beim lokalen Dienst ausweist. Jederzeit neu erzeugbar; das alte Token wird dabei sofort ungültig. Gilt je Rechner und Browserprofil, nicht je Postfach, weil es nicht über `Office.context.roamingSettings` läuft. | E-009, E-019, R-09 |
| Exportordner | „konfigurierbarer Ordner", „Ablageort" | Spalte `app_setting.export_directory`; Domänentyp `AppSettings.exportDirectory` | Der in den Einstellungen festgelegte Ordner, in den die Anwendung Exportdateien schreibt. Die Vorgabe liegt unter `%LOCALAPPDATA%\Takt\` beziehungsweise `~/.local/share/takt/`, nicht unter Desktop oder Dokumente, weil beide unter OneDrive umgeleitet sein können. | E-011, E-018, R-11 |
| Dashboard | „Startseite" (S-01) | kein Speicherobjekt, Screen S-01 | Die Startseite der Anwendung mit laufendem Timer, heutiger Arbeitszeit, offenen Exporten und zuletzt bearbeiteten Todos. | S-01, §12 |
| Einstellungen | „Verwaltung" (S-10), „Konfiguration" (S-11), für die jeweilige Unterseite | kein eigenes Speicherobjekt, Screen S-09; zugrundeliegender Domänentyp `AppSettings`, Tabelle `app_setting` | Oberbegriff für den Bereich, in dem alles Dauerhafte eingestellt wird. Die Unterseiten heißen nach ihrem Gegenstand: Standard-Tags, Pools, Exportvorlagen, Exportordner, Add-in-Zugang. | S-08 bis S-11 |
| Suche und Filter | kein weiterer Name; beide Wörter stehen im selben Satz | kein gemeinsames Speicherobjekt; Route `GET /search` | Zwei getrennte Bedienelemente, kein Synonympaar: Die Suche findet Treffer über Todo-Titel, Call-Nummern, den Vermerk eines Todos und die Leistungstexte von Zeitbuchungen (E-038); der Filter schränkt eine Liste stattdessen nach Kriterien wie Pool, Tag oder Status ein, unabhängig von einem Suchtext. Die Ergebnisse nach Trefferart sichtbar zu gruppieren, ist in der Oberfläche noch nicht umgesetzt. | A-13.7, E-038 |

---

## Geklärte Doppelbenennungen

Diese drei Fälle waren Namensfragen zwischen Spezifikation und Anwendung: Es war unklar, ob zwei
Wörter dieselbe Sache meinen oder zwei verschiedene, und die Antwort hätte in allen drei Fällen
das Domänenmodell verändert, nicht nur eine Beschriftung. Alle drei sind inzwischen entschieden.
Sie bleiben hier stehen, nicht als offene Punkte, sondern als Beleg dafür, warum die
Spezifikation an diesen Stellen anders klingt als die Anwendung.

### Erledigt und Kanban-Abschlussspalte

Abschnitt 5.3 der Spezifikation nennt „Done" als Beispielname einer Kanban-Spalte, Abschnitt 2.4
ein eigenes Erledigt-Kennzeichen; ob beides dasselbe meint, war offen. Der Auftraggeber hat das
verneint: „Erledigt ist etwas eigenes. Die Kanban Phase sind selbst definierbar. Daher ist
Kanban-Abschluss nicht gleich Erledigt." (E-023). Die Antwort steht beim Eintrag „Erledigt" in der
Begriffstabelle oben.

### Todo und Ticket (E-029)

Abschnitt 1 der Spezifikation: „Takt verbindet Todo- und Ticketverwaltung." A-2.1: „Benutzer
können beliebig viele Todos beziehungsweise Tickets anlegen." Die Spezifikation stellt beide
Wörter mit „bzw." gleich, führt aber keine Eigenschaft ein, die nur ein Ticket hätte. Hätte sich
„Ticket" als eigenes Konzept erwiesen, hätte Takt eine zweite Entität mit eigenen Feldern und
Regeln gebraucht statt der einen Tabelle `todo`. Der Orchestrator hat entschieden — der
Auftraggeber wurde dazu nicht befragt: Todo ist der Leitbegriff, „Ticket" ist ein Synonym aus dem
Sprachgebrauch des Auftraggebers und wird in Oberfläche, Dokumentation und Code nicht verwendet.

### Timer, Time-Tracker, Time-Tracking, Zeiterfassung (E-030)

Die Spezifikation verwendet für den Bereich der Arbeitszeiterfassung mehrere Wörter:
„Zeiterfassung" (Abschnitt 6, Titel), „Timer" (A-6.1, A-6.2), „Time-Tracker" (A-5.6),
„Time-Tracking-Ansicht" (S-05) und „Time Tracking" als Navigationspunkt (§14); `CLAUDE.md` nennt
die Anwendung zusätzlich eine „Zeittracking-Anwendung". Wären „Timer" und „Zeiterfassung"
Dubletten statt Bedienelement und übergeordnetem Bereich, hätte die Navigationsstruktur aus T-005
einen Eintrag verloren. Der Orchestrator hat entschieden: Timer ist das Bedienelement, das man
startet und stoppt — sein Stopp erzeugt eine Zeitbuchung. Zeiterfassung ist der Bereich der
Anwendung und der Name des Navigationspunkts aus Abschnitt 14, nicht „Time Tracking", weil
Oberflächentexte deutsch sind. „Time-Tracking" und „Time-Tracker" entfallen als Oberflächentext.

---

## Code-Bezeichner: aktueller Stand

- Tabellen- und Spaltennamen in diesem Glossar sind gegen `docs/datenmodell.md` geprüft und
  stabil, jetzt 17 Tabellen: `todo`, `tag`, `tag_folder`, `time_entry`, `timer_heartbeat`, `pool`,
  `pool_rule`, `default_tag`, `export_template`, `export_run`, `export_run_group`,
  `export_run_entry`, `export_audit`, `app_setting`, `todo_status`, `todo_note`, `todo_tag`. Dazu
  `schema_migration`, die der Migrationsläufer selbst führt und die deshalb in keiner Migration
  steht.
- Die TypeScript-Typen in `packages/domain` und `packages/storage` sind seit T-013 und T-013b
  (E-015) durchgehend englisch. Ein Bezeichner-Prüfskript, das Kommentare und
  Zeichenkettenliterale entfernt, findet keinen deutschen Bezeichner und kein deutsches Literal
  mehr; die vollständige Zuordnungstabelle alt zu neu steht in
  `.claude/team/reports/T-013-domain-dev.md`. Für dieses Glossar wichtig: `TagFolder` (Ordner),
  `TimeEntry` (Zeitbuchung), `RunningTimeEntry` (laufender Timer), `TodoStatus` (Statusspalte),
  `TodoNote` (Vermerk), `ExportCandidate` und `ExportGroup` mit der persistierten
  `ExportRunGroup` (Tagesgruppe), `ExportTemplateEnvelope` (Exportvorlage), `AppSettings` mit dem
  Feld `exportDirectory` (Exportordner), `ExportAuditEvent` mit den drei Werten `exported`,
  `reset` und `not_billed` (Nicht abrechnen), und `ExportAuditEntry` (Exportprotokoll-Zeile).
- Die frühere offene Frage, ob `ExportQuellenpfad`, `Behauptung` und `NotizgrenzeIstDicht` von
  T-013 mit erfasst werden, ist geklärt: Sie heißen jetzt `ExportSourcePath`, `Assert` und
  `NoteBoundaryIsSealed`.
- Acht Datenwerte in `CHECK`-Bedingungen sind seit T-013b ebenfalls englisch:
  `time_entry.export_status` führt `open` / `exported` statt `offen` / `exportiert`,
  `time_entry.source` führt `timer` / `manual` statt `timer` / `manuell`, `export_audit.event`
  führt `exported` / `reset` / `not_billed` statt `exportiert` / `zurueckgesetzt` (der dritte Wert
  ist seit Migration 0006 dazugekommen, E-047, und hat kein deutsches Gegenstück aus einer
  früheren Fassung), `rounding_mode` (in `app_setting` und `export_run`) führt `up` / `nearest`
  statt `aufwaerts` / `kaufmaennisch`, `app_setting.theme` führt `system` / `light` / `dark` statt
  `system` / `hell` / `dunkel`. Auf dem Bildschirm bleiben die deutschen Beschriftungen; die
  Zuordnung steht in der Tabelle „Wert zu Beschriftung" unten.
- Die Feldquelle einer Exportvorlage bezieht sich seit E-033 ausschließlich auf die Tagesgruppe;
  der frühere Pfad `booking.*` ist entfernt, nicht umgedeutet, siehe die Einträge „Tagesgruppe"
  und „Exportvorlage" oben.
- Geklärt: Erledigt (`todo.completed_at`) und die Kanban-Spalte (`todo.status_id`) sind
  voneinander unabhängige Felder. Weder das Setzen noch das Aufheben von Erledigt ändert die
  Spalte; es gibt dafür weder eine konfigurierte Rückkehr-Spalte noch ein Feld, das sich die
  vorherige Spalte merkt. A-2.5 läuft über die Sichtbarkeit in Pool-Ansichten, nicht über die
  Spalte: Ein erledigtes Todo ist dort ausgeblendet, ein reaktiviertes erscheint wieder. Beleg:
  A-2.4, A-5.3, E-023, docs/datenmodell.md §3.1 f.

### Wert zu Beschriftung

Datenbank, Domäne und API führen ausschließlich den englischen Wert; die Oberfläche zeigt die
deutsche Beschriftung, gesammelt an einer Stelle in `apps/web/src/lib/labels.ts`, „damit dieselbe
Zuordnung nicht in vierzehn Ansichten neu getippt wird" (Kopfkommentar dieser Datei). Die beiden
zunächst offenen Beschriftungen aus T-017a sind mit E-041 nachgetragen.

| Spalte | Wert (Code) | Beschriftung (Oberfläche) |
|---|---|---|
| `time_entry.export_status` | `open` | offen |
| `time_entry.export_status` | `exported` | exportiert |
| `time_entry.source` | `timer` | Timer |
| `time_entry.source` | `manual` | Von Hand |
| `export_audit.event` | `exported` | exportiert |
| `export_audit.event` | `reset` | zurückgesetzt |
| `export_audit.event` | `not_billed` | nicht abgerechnet |
| `app_setting.rounding_mode`, `export_run.rounding_mode` | `up` | aufwärts |
| `app_setting.rounding_mode`, `export_run.rounding_mode` | `nearest` | kaufmännisch |
| `app_setting.theme` | `system` | Systemvorgabe |
| `app_setting.theme` | `light` | Hell |
| `app_setting.theme` | `dark` | Dunkel |

Zwei weitere Zuordnungen bestehen nur als Anzeigezustand, mit keinem eigenen Datenwert im
Datenmodell — sie leiten sich aus zwei bestehenden Feldern ab und stehen deshalb absichtlich nicht
in der Tabelle oben:

| Anzeigezustand (`ExportDisplayState`, vier Werte) | Herleitung | Beschriftung |
|---|---|---|
| `open` | `export_status = 'open'`, `export_count = 0` | Offen |
| `exported` | `export_status = 'exported'`, aus einem Exportlauf | Exportiert |
| `reopened` | `export_status = 'open'`, `export_count > 0` | Erneut offen |
| `not_billed` | `export_status = 'exported'`, aus „Nicht abrechnen" statt aus einem Lauf | Nicht abgerechnet |

| Erledigt-Kennzeichen (`DoneFlagState`, drei Werte) | Herleitung | Beschriftung |
|---|---|---|
| `open` | `todo.completed_at IS NULL`, nie erledigt gewesen oder gerade reaktiviert außerhalb der laufenden Sitzung | Offen |
| `done` | `todo.completed_at IS NOT NULL` | Erledigt |
| `reopened` | `todo.completed_at IS NULL`, aber in der laufenden Sitzung gerade durch einen Timerstart reaktiviert (E-023) | Erledigt aufgehoben |

`reopened` beim Erledigt-Kennzeichen lebt ausschließlich in der Sitzung der Oberfläche
(`TimerContext.reactivated`) und endet, sobald jemand das Kennzeichen selbst wieder anfasst; es
ist kein Datenbankwert und auch kein API-Feld.
