# Glossar — Takt

Stand: 2026-09-05. Das Domänenmodell aus T-001 (`docs/datenmodell.md`) liegt vor: Tabellen- und
Spaltennamen sind englisch und stabil. Die TypeScript-Typen in `packages/domain` und
`packages/storage` sind es ebenfalls: T-013 und T-013b (E-015) haben die Umbenennung
abgeschlossen, belegt in `.claude/team/reports/T-013-domain-dev.md`. Wo dieses Glossar einen
Domänentyp nennt, ist das der aktuelle, englische Name.

Die Anwendung ist nicht fertig. Seit dem ersten Stand dieses Glossars (2026-09-01) sind unter
anderem die Kanban-Spalten zu Regeln geworden (E-054, E-055), und die Spezifikation hat Abschnitt
18 (Versionsprüfung) und Abschnitt 19 (Frist und Anhänge) dazubekommen. Dieses Glossar zieht bei
jeder solchen Änderung nach, statt am Ende in einem Zug aktualisiert zu werden — und ist deshalb
zwischen zwei Aktualisierungen auch einmal im Rückstand.

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

## Eine Regel, zwei Anzeigeorte (E-054, E-055, E-057)

Bis E-054 war `todo_status` zwei Dinge zugleich: die Eigenschaft eines Todos und die Spalte des
Kanban-Boards. Ein Todo trug genau einen Status, und der Status war die Spalte. Der Auftraggeber
hat das getrennt: „Die Statusspalte ist nicht gleichbedeutend mit einem Kanban-Board. [...] Daher
sollen die Kanban-Spalten unabhängig vom Status konfigurierbar sein."

Seitdem ist eine Kanban-Spalte kein eigener Datensatz mehr, sondern derselbe wie ein Pool: Tabelle
`pool`, Domänentyp `Pool`. Was die beiden unterscheidet, ist ausschließlich die Spalte
`pool.placement` — nur im Pool-Bereich (`pool`), nur auf dem Board (`board`), oder an beiden
Stellen (`both`). Eine eigene Tabelle für Board-Spalten gibt es absichtlich nicht:
`docs/datenmodell.md` führt sie unter „Was bewusst keine Tabelle ist".

Eine Regel prüft seit E-055 fünf Achsen statt allein Tags, und alle fünf sind mit „und" verbunden:

| Achse | Feld | Bedeutung | Neutralwert |
|---|---|---|---|
| erforderliche Tags | `pool.match_mode`, `pool_rule` mit `role = 'required'` | mindestens eines oder jedes der genannten Tags | leere Liste |
| ausgeschlossene Tags | `pool_rule` mit `role = 'excluded'` | keines dieser Tags | leere Liste |
| Status | `pool_rule` mit `role = 'status'` | einer dieser Status | leere Liste = „Alle" |
| Erledigt | `pool.completion` | alle, nur erledigte oder nur unerledigte | `any` |
| Exportstatus | `pool.export_state` | alle, mit noch nicht abgerechneter oder mit abgerechneter Buchung | `any` |

Stehen alle fünf Achsen auf ihrem Neutralwert, trifft die Regel nichts, nicht alles (A-3.4). Eine
Ausnahme: Ein Ordnerterm, der auf keinen Tag auflöst, zählt als Einschränkung ohne Treffer statt
als Neutralwert, weil eine Regel sonst stillschweigend mehr träfe, als eingerichtet wurde (E-057).

Weil Status, Erledigt und Exportstatus jetzt Achsen einer Regel sind, kann eine Karte die Spalte
wechseln, ohne dass jemand sie zieht: Ein Timerstart hebt das Erledigt-Kennzeichen auf, die erste
abgeschlossene Buchung setzt den Exportstatus. Ziehen zwischen Spalten gibt es deshalb nicht mehr,
und eine Karte kann in mehreren Spalten zugleich stehen. Die Begriffe dazu stehen unten unter
„Regel", „Status", „Pool" und „Board-Spalte".

---

## Frist: ein Tag, vier Zustände (Abschnitt 19, E-070, E-073, E-074)

Die Frist ist ein Kalendertag, keine Uhrzeit (A-19.6). Sie rechnet mit demselben Tagesbegriff wie
die Tagesgruppierung des Exports (E-025) — derselben Funktion, derselben Zeitzone —, damit „heute
fällig" und „heute gebucht" an einem Reisetag nicht auseinanderlaufen (E-070). Gespeichert wird
ausschließlich der Tag, Spalte `todo.due_date`; ihre drei sichtbaren Zustände — überfällig, heute
fällig, später fällig — werden bei jeder Anfrage aus dem Tag und dem heutigen Datum neu berechnet
und nirgends gespeichert. Der Domänentyp `DueState` führt dafür einen vierten Wert, `no_due_date`,
statt `null`: Ein Todo ohne Frist hat keinen der drei Zustände (A-19.5), und das ist eine Auskunft,
keine fehlende Angabe.

Die Frist ist keine Achse einer Regel: Sie geht nicht in Pools, nicht in Spalten und nicht in
einen Export (A-19.7, A-19.17). Sie ordnet und filtert stattdessen die Todo-Liste (A-19.20); ein
Todo ohne Frist steht dabei in beiden Sortierrichtungen am Ende, ohne Platzhalterdatum (E-074
Punkt 2). Das Outlook-Add-in darf die Frist beim Anlegen eines Todos setzen (A-19.21). Anhänge
entstehen über das Add-in weiterhin nicht — A-19.19 bleibt unangetastet (E-074 Punkt 3).

---

## Anhang: drei Arten, unterschiedlich viel gespeichert (E-071, E-072)

Ein Anhang hat eine von drei Arten, und Takt hält von jeder etwas anderes: Ein **Verweis**
speichert eine Adresse in Normalform, eine **Datei** einen Pfad — beide als Zeichenkette, kein
Byte. Ein **Bild** wird als Kopie in das Anwendungsdatenverzeichnis übernommen; gespeichert wird
der erzeugte Name der Kopie, nie der Pfad der Quelldatei. Öffnen bedeutet je nach Art etwas
anderes: Ein Verweis öffnet im Browser, eine Datei mit der Standardanwendung des Systems, ein Bild
öffnet nichts nach draußen — es wird nur angezeigt (E-072 Punkt 2).

Ein Anhang, der sich nicht öffnen lässt — die Datei ist weg, die Adresse ist unbrauchbar, das Bild
ist nicht mehr lesbar —, sagt das an seiner Stelle und verschwindet nicht (A-19.15). Vor dem
Öffnen einer Datei fragt die Oberfläche und nennt den vollen Pfad: Eine Datei mit der
Standardanwendung zu öffnen ist dasselbe wie ein Doppelklick im Dateimanager (E-072 Punkt 3). Ein
Anhang geht nie in einen Export, und über das Outlook-Add-in entstehen keine Anhänge —
strukturell, nicht per Voreinstellung (A-19.17, A-19.19).

---

## Begriffe

| Deutscher Begriff | Spezifikation nennt auch | Code | Bedeutung | Beleg |
|---|---|---|---|---|
| Todo | „Ticket" (Abschnitt 1, A-2.1) — entfällt als Oberflächentext, siehe „Geklärte Doppelbenennungen" | Tabelle `todo` | Eine Aufgabe, die ein Benutzer anlegt, um Arbeit zu planen, zu verfolgen und abzurechnen. | A-2.1, E-029, docs/datenmodell.md §3.2 |
| Zeitbuchung, kurz Buchung | „Buchung", „Arbeitszeit", „erfasste Zeiten", „Zeiten" | Tabelle `time_entry`; Domänentyp `TimeEntry` | Ein einzelner erfasster Zeitabschnitt an einem Todo, mit Startzeit, Endzeit, berechneter Dauer, Exportstatus und eigener Notiz (Leistung). | A-6.3, A-6.4, A-6.6, docs/datenmodell.md §3.4 |
| Timer | „Time-Tracker" (A-5.6) — entfällt als Oberflächentext, siehe „Geklärte Doppelbenennungen" | kein eigenes Speicherobjekt; „ein Timer läuft" bedeutet: eine Zeile in `time_entry` ohne `ended_at`, Domänentyp `RunningTimeEntry` | Das Bedienelement zum Starten und Stoppen der Zeitmessung an einem Todo. Sein Stopp erzeugt eine neue Zeitbuchung. Die Zeiterfassung ist der Bereich, der den Timer enthält (E-030). | A-6.1, A-6.2, A-5.6, E-030, docs/datenmodell.md §3.4 |
| Zeiterfassung | „Time-Tracking-Ansicht" (S-05), „Time Tracking" (§14), „Zeittracking-Anwendung" (`CLAUDE.md`) — alle drei entfallen als Oberflächentext, siehe „Geklärte Doppelbenennungen" | kein Speicherobjekt, Navigationsbegriff, Screen S-05 | Der Bereich der Anwendung, in dem Buchungen entstehen und verwaltet werden — mit dem Timer und den eigenen Zeitbuchungen des Tages. Name des Navigationspunkts aus Abschnitt 14. Timer und Zeiterfassung sind zwei verschiedene Dinge: ein Bedienelement und der Bereich, der es enthält (E-030). | §6 (Titel), S-05, §14, E-030 |
| Erledigt | „Done" (A-5.3, nur Beispielname einer Kanban-Spalte; mit Erledigt nicht verknüpft) | Spalte `todo.completed_at` (`NULL` = aktiv), unabhängig von `todo.status_id` | Kennzeichnet ein Todo als abgeschlossen, unabhängig von seinem Status: Ein Todo kann den Status „Done" tragen und nicht erledigt sein, oder erledigt sein und einen anderen Status tragen. Startet ein Benutzer den Timer auf einem erledigten Todo erneut, hebt die Anwendung das Kennzeichen auf; das Todo erscheint dann wieder in seinen Pool-Ansichten. Der Status ändert sich dabei nicht — ob das Todo danach in bestimmten Board-Spalten erscheint oder aus ihnen verschwindet, richtet sich seit E-054 nach deren Regeln (siehe „Regel"). | A-2.4, A-2.5, A-5.3, E-023, E-054, E-058, docs/datenmodell.md §3.1 f. |
| Regel | kein eigener Begriff in der Spezifikation; A-3.2 kennt nur ein Pool über ein Tag, die fünf Achsen sind eine spätere Entscheidung (E-054, E-055) | Tabellen `pool`, `pool_rule`; Domänentyp `Pool` (erbt `PoolRuleAxes`), `PoolMatchMode`, `PoolCompletionFilter`, `PoolExportFilter`, `PoolPlacement` | Eine Struktur aus fünf Achsen — erforderliche Tags, ausgeschlossene Tags, Status, Erledigt, Exportstatus —, die bestimmt, welche Todos zu ihr gehören. Die Zugehörigkeit wird bei jeder Abfrage aus den Tags und dem Zustand des Todos neu berechnet, nicht gespeichert (A-3.4). Wo eine Regel erscheint, sagt `pool.placement`: im Pool-Bereich, auf dem Board, oder an beiden Stellen — siehe „Pool" und „Board-Spalte". | A-3.1, A-3.2, A-3.4, E-054, E-055, E-057, docs/datenmodell.md §3.5 |
| Status | „Status-Spalten" (A-5.2, veraltet seit E-054), „Statusstruktur" (A-5.4) | Tabelle `todo_status`, Fremdschlüssel `todo.status_id`; Domänentyp `TodoStatus`; als Regelachse `pool_rule` mit `role = 'status'` | Eine Eigenschaft des Todos — geändert in Detailansicht und Liste —, unabhängig von seiner Kanban-Spalte. Backlog, In Progress, Waiting und Done sind Beispiele, keine feste Menge. Seit E-054 ist der Status keine Kanban-Spalte mehr, sondern nur noch eine von fünf Achsen, nach denen eine Regel fragen darf; er ist an das Erledigt-Kennzeichen nicht gekoppelt. Siehe „Eine Regel, zwei Anzeigeorte" oben. | A-5.3, A-5.4, E-023, E-054, E-055, docs/datenmodell.md §3.1 |
| Pool | „Todo-Pool" | `pool.placement = 'pool'` oder `'both'` | Der Anzeigeort einer Regel im Pool-Bereich der Einstellungen und in Filterlisten — siehe „Regel" für die fünf Achsen, die über die Zugehörigkeit entscheiden. Ein Todo kann in mehreren Pools zugleich liegen. | A-3.1 bis A-3.4, E-054 |
| Board-Spalte | „Status-Spalte" (A-5.2, veraltet seit E-054) | `pool.placement = 'board'` oder `'both'`; Domänentyp `BoardColumn` (Alias für `Pool`), `BoardColumnRule` | Der Anzeigeort derselben Regel auf dem Kanban-Board (S-04) — kein eigener Datensatz, dieselbe Regel wie ein Pool, nur an einer anderen Fläche sichtbar. Karten lassen sich nicht mehr zwischen Spalten ziehen; eine Karte wechselt die Spalte nur, wenn sich am Todo etwas ändert, das eine Regel abfragt, und sie kann in mehreren Spalten zugleich stehen. | A-5.1, A-5.5, E-054, E-058 |
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
| Frist | „Fälligkeitsdatum", „fällig am", „Deadline" — alle drei sind ausdrücklich ausgeschlossen (A-19.2) | Spalte `todo.due_date` (`YYYY-MM-DD`); Domänentyp `DueState` mit den Werten `overdue`, `due_today`, `due_later`, `no_due_date`; Funktionen `dueState`, `dueComparison`, `compareByDueDate` in `packages/domain/src/due-date.ts` | Ein optionaler Kalendertag am Todo, keine Uhrzeit. Ihre drei sichtbaren Zustände — überfällig, heute fällig, später fällig — werden bei jeder Anfrage neu berechnet, nie gespeichert. Sortier- und filterbar in der Todo-Liste; keine Achse einer Regel, kein Export. Das Outlook-Add-in kann sie beim Anlegen eines Todos setzen. | A-19.1 bis A-19.7, A-19.20, A-19.21, E-070, E-073, E-074 |
| Anhang | kein weiterer Name in der Spezifikation | Tabellen `todo_attachment`, `todo_attachment_kind`; Domänentyp `Attachment`, `AttachmentKind` mit den Werten `link`, `image`, `file` — auf dem Bildschirm „Verweis", „Bild", „Datei" | Beliebig viele je Todo, in drei Arten: Ein Verweis speichert eine Adresse in Normalform, eine Datei einen Pfad, ein Bild wird als Kopie in das Anwendungsdatenverzeichnis übernommen (nie der Pfad der Quelle). Geöffnet wird, was zur Art passt — der Browser, die Standardanwendung des Systems, oder bei einem Bild nur die Anzeige. Ein Anhang, der sich nicht öffnen lässt, sagt das an Ort und Stelle und verschwindet nicht. Geht nie in einen Export; über das Outlook-Add-in entstehen keine Anhänge. | A-19.8 bis A-19.15, A-19.17 bis A-19.19, E-071, E-072 |
| Windows-Benutzer | kein weiterer Name in der Spezifikation | kein Speicherobjekt (E-010, wird vom Betriebssystem gelesen); Exportschlüssel `WindowsUser`; Quellenpfad `system.windowsUser` | Der Windows-Anmeldename, den die Anwendung vom Betriebssystem liest und bei jedem Export mitschickt. Keine Benutzereingabe. | A-8.2, A-8.5, E-010 |
| Ordner | „Unterordner", „Ordnerstruktur", „Ordnerhierarchie", vereinzelt „Tag-Ordner" (A-10.5) | Tabelle `tag_folder`, `parent_id` als Adjazenzliste; Domänentyp `TagFolder` (Knoten `TagFolderNode`, Baum `TagTree`) | Ein Behälter für Tags, beliebig tief verschachtelbar, zyklusfrei. | A-4.2, A-4.3, A-4.6, docs/datenmodell.md §3.3, §4 |
| Tag | kein weiterer Name in der Spezifikation | Tabelle `tag` | Eine frei vergebene Kennzeichnung, mit der sich Todos einordnen, gruppieren und filtern lassen. | A-4.1, A-8.7, docs/datenmodell.md §3.3 |
| Standard-Tags | kein weiterer Name in der Spezifikation | Tabelle `default_tag`; Domänentyp `DefaultTag` | Tags, die die Anwendung jedem neu angelegten Todo automatisch zuweist, unabhängig vom Anlageweg, auch aus dem Outlook-Add-in. | A-9.1, A-9.3, A-9.5, docs/datenmodell.md §1 |
| Abrechnungstool | „externes Abrechnungstool" | kein Bestandteil von Takt | Das System, an das Takt seine Exportdateien übergibt. Takt hat keine Anbindung daran, nur ein gemeinsames Dateiformat. | §1, A-6.6 |
| Outlook-Add-in, kurz Add-in | kein weiterer Name in der Spezifikation | `apps/outlook-addin` | Der Teil von Takt, der in Outlook läuft und aus einer E-Mail heraus ein Todo anlegt oder auf ein vorhandenes bucht. Spricht ausschließlich mit dem lokalen Dienst, über eine eigens dafür geschnittene, schmale Routengruppe (`/api/v1/addin/*`). | A-10.1 |
| Add-in-Token | kein weiterer Name in der Spezifikation | liegt nicht in der Datenbank, siehe docs/datenmodell.md §1 „Was bewusst keine Tabelle ist"; Ablageort `localStorage` der Add-in-Herkunft | Ein von der Anwendung erzeugtes Geheimnis, mit dem sich das Outlook-Add-in beim lokalen Dienst ausweist. Jederzeit neu erzeugbar; das alte Token wird dabei sofort ungültig. Gilt je Rechner und Browserprofil, nicht je Postfach, weil es nicht über `Office.context.roamingSettings` läuft. | E-009, E-019, R-09 |
| Exportordner | „konfigurierbarer Ordner", „Ablageort" | Spalte `app_setting.export_directory`; Domänentyp `AppSettings.exportDirectory` | Der in den Einstellungen festgelegte Ordner, in den die Anwendung Exportdateien schreibt. Die Vorgabe liegt unter `%LOCALAPPDATA%\Takt\` beziehungsweise `~/.local/share/takt/`, nicht unter Desktop oder Dokumente, weil beide unter OneDrive umgeleitet sein können. | E-011, E-018, R-11 |
| Dashboard | „Startseite" (S-01) | kein Speicherobjekt, Screen S-01 | Die Startseite der Anwendung mit laufendem Timer, heutiger Arbeitszeit, offenen Exporten, zuletzt bearbeiteten Todos und einer Kachel „Überfällig" mit der Zahl überfälliger Todos (nur sichtbar, wenn sie größer als null ist, siehe „Frist"). | S-01, §12, E-074 |
| Einstellungen | „Verwaltung" (S-10), „Konfiguration" (S-11), für die jeweilige Unterseite | kein eigenes Speicherobjekt, Screen S-09; zugrundeliegender Domänentyp `AppSettings`, Tabelle `app_setting` | Oberbegriff für den Bereich, in dem alles Dauerhafte eingestellt wird. Die Unterseiten heißen nach ihrem Gegenstand: Standard-Tags, Pools, Exportvorlagen, Exportordner, Add-in-Zugang. | S-08 bis S-11 |
| Suche und Filter | kein weiterer Name; beide Wörter stehen im selben Satz | kein gemeinsames Speicherobjekt; Route `GET /search` | Zwei getrennte Bedienelemente, kein Synonympaar: Die Suche findet Treffer über Todo-Titel, Call-Nummern, den Vermerk eines Todos und die Leistungstexte von Zeitbuchungen (E-038); der Filter schränkt eine Liste stattdessen nach Kriterien wie Pool, Tag oder Status ein, unabhängig von einem Suchtext. Die Ergebnisse nach Trefferart sichtbar zu gruppieren, ist in der Oberfläche noch nicht umgesetzt. | A-13.7, E-038 |
| Fassung | „Version" (Abschnitt 18 durchgehend) | Domänentyp `VersionCheck`, `UpdateNotice`; Funktionen `checkVersion`, `comparePrecedence`, `decideUpdateNotice` in `packages/domain/src/version.ts`; Spalte `app_setting.skipped_version` | Die Versionsnummer von Takt, nach der Vorrangregel von SemVer verglichen und nicht als Zeichenkette. Die installierte Fassung kommt zur Laufzeit aus den einkompilierten Angaben des Erzeugnisses (`app.package_info().version`); im Auslieferungsbau stammt sie aus dem Git-Etikett über `TAKT_RELEASE_VERSION`, `tauri.conf.json` mit `0.0.0` ist nur der Rückfallwert für einen Bau ohne Etikett. Eine „übersprungene" Fassung steht im Bestand, nicht im Arbeitsspeicher; eine spätere, höhere Fassung meldet sich wieder. | A-18.1, A-18.3, A-18.4, A-18.10, E-064, E-065 |
| Versionsprüfung | kein weiterer Name in der Spezifikation | Route `GET /api/v1/version-check`; Dienst `apps/local-api/src/version/checker.ts`; Öffnen-Befehl `takt_open_release` in `apps/desktop/src-tauri/src/release.rs` | Fragt beim Start und danach höchstens einmal alle 24 Stunden die Releases des offiziellen GitHub-Bestands ab, ob eine neuere Fassung von Takt vorliegt — die einzige Verbindung, die Takt nach außen aufbaut. Liegt keine neuere vor, geschieht nichts. Liegt eine vor, zeigt ein Dialog die installierte und die verfügbare Fassung und fragt „Installieren" oder „Überspringen"; „Installieren" öffnet ausschließlich die Release-Seite dieser Fassung, Takt lädt nichts herunter und installiert nichts. Ein Fehlschlag bleibt still: kein Hinweis in der Oberfläche, kein zweiter Versuch im selben Lauf, der Grund steht im Protokoll. | A-18.1 bis A-18.12, E-064, E-065, E-069 |

---

## Geklärte Doppelbenennungen

Diese vier Fälle waren Namensfragen zwischen Spezifikation und Anwendung: Es war unklar, ob zwei
Wörter dieselbe Sache meinen oder zwei verschiedene, und die Antwort hätte in allen vier Fällen
das Domänenmodell verändert, nicht nur eine Beschriftung. Alle vier sind inzwischen entschieden.
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

### Status und Kanban-Spalte (E-054)

Bis E-054 war eine Kanban-Spalte nichts anderes als ein Statuswert: `todo_status` war zugleich die
Eigenschaft eines Todos und die Spalte, in der es auf dem Board stand. Der Auftraggeber hat beides
getrennt: „Die Statusspalte ist nicht gleichbedeutend mit einem Kanban-Board. [...] Daher sollen
die Kanban-Spalten unabhängig vom Status konfigurierbar sein." Eine Kanban-Spalte ist seitdem eine
Regel über fünf Achsen, von denen der Status nur eine ist; A-5.2 der Spezifikation („Todos lassen
sich per Drag & Drop zwischen Status-Spalten verschieben") entfällt damit, weil eine Regel sich
nicht durch Ziehen umkehren lässt, ohne Tags zu setzen — und das hat der Auftraggeber ausdrücklich
ausgeschlossen. Die Antwort steht bei den Einträgen „Regel", „Status" und „Board-Spalte" in der
Begriffstabelle oben.

---

## Code-Bezeichner: aktueller Stand

- Tabellen- und Spaltennamen in diesem Glossar sind gegen die Migrationen unter
  `packages/storage/migrations/` geprüft, jetzt 19 Tabellen: `todo`, `tag`, `tag_folder`,
  `time_entry`, `timer_heartbeat`, `pool`, `pool_rule`, `default_tag`, `export_template`,
  `export_run`, `export_run_group`, `export_run_entry`, `export_audit`, `app_setting`,
  `todo_status`, `todo_note`, `todo_tag`, dazu seit Migration 0015 (T-146) `todo_attachment` und
  `todo_attachment_kind`. Dazu `schema_migration`, die der Migrationsläufer selbst führt und die
  deshalb in keiner Migration steht. `docs/datenmodell.md` führt die beiden neuen Tabellen und die
  Spalte `todo.due_date` (Migration 0014) noch nicht auf — dort steht die Hoheit beim domain-dev.
- Die TypeScript-Typen in `packages/domain` und `packages/storage` sind seit T-013 und T-013b
  (E-015) durchgehend englisch. Ein Bezeichner-Prüfskript, das Kommentare und
  Zeichenkettenliterale entfernt, findet keinen deutschen Bezeichner und kein deutsches Literal
  mehr; die vollständige Zuordnungstabelle alt zu neu steht in
  `.claude/team/reports/T-013-domain-dev.md`. Für dieses Glossar wichtig: `TagFolder` (Ordner),
  `TimeEntry` (Zeitbuchung), `RunningTimeEntry` (laufender Timer), `TodoStatus` (Status),
  `TodoNote` (Vermerk), `ExportCandidate` und `ExportGroup` mit der persistierten
  `ExportRunGroup` (Tagesgruppe), `ExportTemplateEnvelope` (Exportvorlage), `AppSettings` mit dem
  Feld `exportDirectory` (Exportordner), `ExportAuditEvent` mit den drei Werten `exported`,
  `reset` und `not_billed` (Nicht abrechnen), und `ExportAuditEntry` (Exportprotokoll-Zeile).
- Seit E-054/E-055 (T-076, T-089) dazugekommen: `Pool` (Regel, erbt `PoolRuleAxes`) mit den
  Achsenwerten `PoolMatchMode`, `PoolCompletionFilter`, `PoolExportFilter` und dem Anzeigeort
  `PoolPlacement`; `BoardColumn` als reiner Alias für `Pool` und `BoardColumnRule` für die
  aufgelöste Fassung einer Board-Spalte. Seit E-064/E-065 (T-136 ff.): `VersionCheck` und
  `UpdateNotice` in `packages/domain/src/version.ts`. Seit E-070 bis E-072 (T-146): `DueState` in
  `due-date.ts` und `Attachment`/`AttachmentKind` in `attachment.ts`.
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
- Geklärt: Erledigt (`todo.completed_at`) und der Status (`todo.status_id`) sind voneinander
  unabhängige Felder. Weder das Setzen noch das Aufheben von Erledigt ändert den Status; es gibt
  dafür weder einen konfigurierten Rückkehr-Status noch ein Feld, das sich den vorherigen Status
  merkt. A-2.5 läuft über die Sichtbarkeit in Pool-Ansichten, nicht über den Status: Ein erledigtes
  Todo ist dort ausgeblendet, ein reaktiviertes erscheint wieder. Seit E-054 kann sich dabei
  zusätzlich die Zugehörigkeit zu Board-Spalten ändern, weil Erledigt eine Achse ihrer Regel ist
  (siehe „Eine Regel, zwei Anzeigeorte") — das ist eine Folge der Regel, keine dritte Kopplung der
  beiden Felder selbst. Beleg: A-2.4, A-5.3, E-023, E-054, docs/datenmodell.md §3.1 f.

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
