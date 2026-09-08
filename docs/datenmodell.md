# Takt — Datenmodell

Stand: 2026-09-05, Aufgaben T-001 und T-013, nachgeführt bis Migration 0015 (T-146, eingetragen
mit T-159). Verbindlich für `packages/storage` und für alles, was über die Ports darauf zugreift.

T-013 hat die TypeScript-Bezeichner auf Englisch umbenannt (E-015, R-16), die Rundung von „je
Buchung" auf „je Todo und Kalendertag" umgestellt und die Kopplung zwischen dem
Erledigt-Kennzeichen und der Kanban-Spalte entfernt. Die Tabellennamen waren bereits englisch und
sind unverändert.

Grundlage: `docs/spec.md`, `.claude/team/decisions.md` (E-001 bis E-023), `.claude/team/risks.md`.
Jede Tabelle und jede Regel führt unten die Anforderungs-ID mit, aus der sie folgt.

Das Schema liegt ausführbar in `packages/storage/migrations/`. Die Angaben in diesem Dokument
sind gegen diese Dateien geprüft, nicht daneben geschrieben.

---

## 1. Entitäten im Überblick

```
                    ┌──────────────┐
                    │ todo_status  │  Status des Todos, konfigurierbar (A-5.4)
                    └──────┬───────┘
                           │ status_id
                    ┌──────┴───────┐         ┌──────────────┐
                    │     todo     │────1:1──│  todo_note   │ Vermerk, intern
                    │  call_number │         │   (A-7.1)    │        (A-7.2)
                    │  due_date    │         └──────────────┘  Frist (A-19.1),
                    └──┬────────┬──┘                           ein Tag, keine Uhrzeit
                       │        │
                  n:m  │        │  1:n
              ┌────────┴──┐  ┌──┴─────────────┐
              │ todo_tag  │  │  time_entry    │ Zeitbuchung (A-6.4)
              └────┬──────┘  │  export_status │ zweiwertig (A-6.9)
                   │         └──┬─────────────┘
              ┌────┴─────┐      │
              │   tag    │      ├── export_run_entry ── export_run_group ── export_run
              └────┬─────┘      │                          (A-8.8)
                   │ folder_id  │
              ┌────┴───────┐    └─── export_audit  Protokoll, anhängend (R-10)
              │ tag_folder │◄─┐
              │ parent_id  │──┘  beliebig tief, zyklusfrei (A-4.3, A-4.6)
              └────────────┘

    pool ──── pool_rule ────► tag / tag_folder      Regel gespeichert,
    (A-3.*)   placement: pool | board | both          Mitgliedschaft abgeleitet (A-3.4)
              Pool **und** Kanban-Spalte (E-054)

    default_tag ────► tag        Standard-Tags (A-9)
    export_template              Vorlagen, Standardvorlage unlöschbar (A-8.7)
    app_setting                  eine Zeile, u. a. Exportordner (E-011)
                                 und die übersprungene Fassung (A-18.10)
```

Migration 0001 legt 16 Tabellen, eine Sicht, 32 Indizes und 12 Trigger an. Migration 0003
(T-009) fügt `timer_heartbeat` und zwei Trigger hinzu; 0006 (T-029, E-047) einen weiteren auf
`time_entry`; 0008 (T-058) zwei Indizes und zwei Trigger auf `tag`; 0009 (T-066, E-054) eine
Spalte auf `pool` und **keinen** Index — die Begründung steht in der Migrationsdatei und in 8.4d.
0010 (T-070, E-054) nimmt `todo.board_rank` und `ux_todo_rank` weg und verkürzt `ix_todo_status`
auf eine Spalte; siehe 8.4e. 0011 (T-076) baut `pool_rule` um — zwei Spalten mehr an `pool`, eine
Rolle und eine Statuskennung an `pool_rule`, ein Index dazu; siehe 3.5 und 8.4f. 0012 (T-089,
R-1 Befund 1) baut dieselbe Tabelle ein zweites Mal um, ohne eine Spalte anzufassen: `tag_id` und
`folder_id` gehen von ON DELETE CASCADE auf **RESTRICT**; siehe 3.5 und 8.4g. Tabellen, Sichten,
Indizes und Trigger bleiben dabei in Zahl und Namen gleich. 0013 (T-138, A-18.10) hängt
`app_setting.skipped_version` an — eine Spalte, kein Index, kein Trigger; siehe 3.7 und 8.4h.
Der Stand nach 0013 sind damit 17 Tabellen, eine Sicht, 34 Indizes und 17 Trigger (nachgezählt:
`sqlite_master` nach `migrateToLatest`, Node 22.23.2). 0014 (T-146, A-19.1) hängt `todo.due_date`
an — eine Spalte und **ein** Teilindex, kein Trigger; siehe 3.2 und 8.4i. 0015 (T-146, A-19.8)
legt `todo_attachment` und die Wertetabelle `todo_attachment_kind` an, dazu zwei Indizes und
wieder keinen Trigger; siehe 3.8 und 8.4j. Der Stand nach 0015 sind damit **19 Tabellen, eine
Sicht, 37 Indizes und 17 Trigger** (nachgezählt: `sqlite_master` nach allen Vorwärtsdateien,
`PRAGMA integrity_check` = ok, Node 22.23.2, T-159). Hinzu kommt `schema_migration`, die der
Migrationsläufer selbst führt und die deshalb in keiner Migration steht.

```
    time_entry ──1:0..1── timer_heartbeat    Lebenszeichen des laufenden
                                             Timers (E-036), höchstens eine Zeile

    todo ──1:n── todo_attachment ──► todo_attachment_kind
                 (A-19.8 ff.)        Verweis | Datei | Bild — eine Wertetabelle,
                 position je Todo    kein CHECK (Begründung in 3.8)
```

### Was bewusst *keine* Tabelle ist

| Nicht vorhanden | Grund |
|---|---|
| `todo_pool` | A-3.4. Die Pool-Zugehörigkeit ergibt sich bei jeder Abfrage aus den Tags. Eine gespeicherte Zuordnung müsste beim Wiederaufnehmen eines erledigten Todos (A-2.5) nachgezogen werden und wäre die wahrscheinlichste Fehlerquelle des Ablaufs. |
| `todo.erfasste_zeit` | Die Summe der Buchungen wird berechnet. Ein mitgeführter Wert kann von den Buchungen abweichen, und dann ist unklar, welcher stimmt. |
| `tag_folder.depth` / Closure-Tabelle | Siehe Abschnitt 4. Ein mitgeführter Tiefen- oder Pfadwert müsste beim Verschieben für den gesamten Teilbaum fortgeschrieben werden. |
| `todo.note` als Spalte auf `todo` | A-7.2 und R-06. Der interne Vermerk steht in einer eigenen Tabelle, siehe Abschnitt 7. |
| `todo.status_id_before_done` | Erledigt und Kanban-Spalte sind getrennt (siehe 3.1 und 3.2). Das Erledigen verschiebt die Karte nicht, also gibt es beim Wiederaufnehmen nichts wiederherzustellen. |
| `app_setting.reopen_status_id` | Aus demselben Grund. Eine konfigurierbare Rückkehr-Spalte löst ein Problem, das es nicht gibt. |
| `todo_status.is_done` | Die Abschlussspalte ist nicht das Erledigt-Kennzeichen. Eine Markierung, die beides verknüpft, würde genau die Verwechslung festschreiben, die der Auftraggeber ausgeschlossen hat. |
| `todo.due_state` | A-19.5, E-070 Punkt 3. „Überfällig", „heute fällig" und „später fällig" werden **gerechnet**, nicht gespeichert. Eine solche Spalte wäre über Nacht falsch, ohne dass jemand etwas angefasst hat — und niemand hätte einen Anlass, sie neu zu schreiben. Die Regel liegt als `dueState` in `packages/domain/src/due-date.ts`, und dort allein. |
| `todo_attachment.blob` | E-071 Punkt 2. Die Bytes eines Bildanhangs liegen als Datei neben dem Bestand, nicht in ihm: Eine BLOB-Spalte wanderte in jede Sicherung, bliese die WAL bei jedem Schreibvorgang auf und machte aus `takt.db` eine Datei, deren Größe niemand mehr erklären kann. Siehe 3.8. |
| `todo_attachment.source_path` | A-A-17. Bei einem Bild wird der **erzeugte** Name der Kopie gespeichert und nie der Pfad, aus dem sie stammt. Ein Quellpfad ist fremder Text, er verriete etwas über den Kunden, und niemand liest ihn je wieder. |
| `board_column` / `board_column_rule` | E-054, T-066. Eine Kanban-Spalte ist eine Regel — seit E-055 über fünf Achsen und nicht allein über Tags — also dasselbe wie ein Pool: Name, Position, Regelterme, Auflösung über Ordner samt Unterordnern, Mitglieder als Abfrage, leere Regel trifft nichts. Eine zweite Tabelle hätte `pool` Wort für Wort abgeschrieben und die rekursive Ordnerauflösung gleich mit. Stattdessen sagt `pool.placement`, auf welcher Fläche eine Regel erscheint. |
| `todo_board_column` | Aus demselben Grund wie `todo_pool`: Die Zugehörigkeit zu einer Spalte ergibt sich bei jeder Abfrage aus den Tags. Seit E-054 kann eine Karte dabei in **mehreren** Spalten zugleich stehen — eine gespeicherte Zuordnung müsste dieselbe Karte mehrfach führen und bei jeder Tagänderung nachgezogen werden. |
| Token des Add-ins | E-009. Nur sein SHA-256-Abdruck liegt auf der Platte, in einer eigenen Datei außerhalb der Datenbank. Die Datenbankdatei wird kopiert — für eine Sicherung, zur Fehlersuche, in einen synchronisierten Ordner. Ein Token darin wanderte mit. Siehe `docs/architektur.md`, Abschnitt 6. |

---

## 2. Grundsatzentscheidungen der Speicherung

### 2.1 Kennungen: UUID Fassung 7

Textspalte, 36 Zeichen. UUIDv7 trägt die Erzeugungszeit im führenden Teil und sortiert damit
lexikographisch chronologisch. Das hält Einfügungen am Ende des B-Baums statt verstreut über
ihn, wie es bei UUIDv4 der Fall wäre.

Ein fortlaufender Zahlenschlüssel wäre schmaler, aber die Kennungen wandern über die HTTP-Fläche
zum Add-in. Eine ratbare Nummer erlaubt es einem lokalen Prozess mit gültigem Token, den Bestand
durchzuzählen; eine Zufallskennung nicht.

**Mit Zähler seit T-041 (RFC 9562, 6.2, Methode 1).** Bis dahin standen in den zwölf Bit hinter
der Version Zufallsbits. „Sortiert lexikographisch chronologisch" war damit nur zwischen
Millisekunden wahr; innerhalb einer Millisekunde entschied der Zufall. Auf diese Zusage war
gebaut worden — `trg_time_entry_exported_needs_provenance` (4.4) sucht die jüngste
Protokollzeile mit `ORDER BY occurred_at DESC, id DESC`, und `occurred_at` hat nur
Sekundenauflösung (2.2). Der Trigger las regelmäßig die falsche Zeile als jüngste und ließ
„nicht abrechnen" scheitern; die Folgen stehen in architektur.md 3.3a.

Die zwölf Bit tragen jetzt einen Zähler, der je Millisekunde bei einem zufälligen Wert im
unteren Viertel beginnt und aufwärts läuft. Läuft er über oder springt die Uhr zurück, wird die
**Zeit** um eine Millisekunde fortgeschrieben statt der Zähler zurückgesetzt: Eine Kennung, die
minimal in der Zukunft liegt, ist harmlos; eine, die kleiner ist als ihre Vorgängerin, bricht
genau die Eigenschaft, für die es den Zähler gibt. Die unteren 62 Bit bleiben vollständig
zufällig, die Unratbarkeit also unverändert. Nachgewiesen in `proof:export`, Abschnitt 11: 20.000
Kennungen in Folge, keine kleiner als ihre Vorgängerin.

**Der Trigger baut seit Migration 0007 nicht mehr darauf** (3.4). Der Zähler bleibt richtig und
nützlich — er ordnet die Anzeige des Protokolls und jeden künftigen Vergleich auf `id` —, aber
eine Prüfung der Datenbank soll nicht an einer Zusage der Anwendung hängen. Beides zusammen ist
die Bauart, die dieser Bestand überall benutzt: Die Regel prüft, und die Datenbank weist ab, was
die Regel übersieht.

### 2.2 Zeitstempel: Text, UTC, sekundengenau

Form `YYYY-MM-DDTHH:MM:SSZ`, per `GLOB`-Bedingung erzwungen. Lexikographische Sortierung ist
chronologische Sortierung, `unixepoch()` liest das Format, und in einem Datenbankbetrachter ist
der Wert ohne Umrechnung lesbar.

Sekundengenau und nicht feiner, weil die Dauer aus Start und Ende berechnet wird und
`unixepoch()` Bruchteile abschneidet. Millisekunden im Zeitstempel würden eine Dauer erzeugen,
die um bis zu einer Sekunde von der tatsächlichen abweicht — bei einer Abrechnung keine gute
Idee.

Ortszeit erscheint ausschließlich in der Oberfläche. In der Datenbank steht nur UTC; sonst
verschöbe sich der Bestand bei der Zeitumstellung.

**Der Kalendertag ist dagegen Ortszeit — und die Umrechnung steht an genau einer Stelle.**
`calendarDayBounds` in `packages/domain/src/kernel.ts` macht aus einem Ortstag die beiden
UTC-Grenzen `[startsAt, endsBefore)`; Adapter vergleichen damit lexikographisch auf
`started_at` und rechnen selbst nicht.

Bis T-042 rechnete der SQLite-Adapter für `fromDay`/`toDay` mit `date(started_at)` — und `date()`
schneidet den **UTC**-Anteil ab. `date('2026-08-31T22:30:00Z')` ist der 31. August; derselbe
Zeitpunkt ist in Europe/Berlin der 1. September, 00:30. Eine Buchung um halb eins nachts
erschien damit in der Liste unter einem anderen Tag, als der Export sie gruppiert (5.5), und weil
je Tagesgruppe aufgerundet wird (5.1), bekamen beide Tage eine falsche Summe. Der Fall trifft
rund ein Zwölftel aller Abende und war von keinem Test gedeckt — er steckte in SQL, wo keine
Typprüfung ihn findet. Nachgewiesen in `packages/storage/test/calendar-day-boundary.test.ts`, mit
fest eingesetzter Zone: Ein Test, der die Zone des ausführenden Rechners benutzt, misst den
Rechner.

`TimeEntryFilter.fromDay` und `.toDay` sind seit T-042 vom Typ `CalendarDay` und nicht mehr
`string`. Der Typ sagt, welcher Tagesbegriff gemeint ist.

### 2.3 Dauer: berechnete Spalte

```sql
duration_seconds INTEGER GENERATED ALWAYS AS (
  CASE WHEN ended_at IS NULL THEN NULL
       ELSE unixepoch(ended_at) - unixepoch(started_at) END
) STORED
```

A-6.4 verlangt Start, Ende und Dauer. Werden alle drei unabhängig geschrieben, können sie
auseinanderlaufen, und niemand merkt es, bis die Abrechnung nicht stimmt. Als berechnete Spalte
ist die Abweichung nicht darstellbar. Der Wert ist `STORED` und damit indizierbar.

Die Endzeit selbst entsteht beim Stoppen als *Startzeit plus monoton gemessene Dauer*, nicht als
zweite Ablesung der Wanduhr. Eine Zeitumstellung oder ein Zeitabgleich über das Netz während
eines laufenden Timers verändert die Abrechnung damit nicht. Siehe `UhrPort` in
`packages/storage/src/ports.ts`.

### 2.4 Verbindungseinstellungen

| Pragma | Wert | Grund |
|---|---|---|
| `journal_mode` | `WAL` | Lesende Abfragen blockieren den schreibenden Timerstopp nicht. |
| `foreign_keys` | `ON` | SQLite hat Fremdschlüssel voreingestellt aus. Muss je Verbindung gesetzt werden, die Datei merkt es sich nicht. |
| `synchronous` | `FULL` | Der eingebaute Standardwert unter WAL ist `NORMAL` und opfert etwas Haltbarkeit für Geschwindigkeit. Hier hängt eine Abrechnung dran; die Haltbarkeit ist mehr wert. |
| `busy_timeout` | 5000 ms | Oberfläche und Add-in greifen auf dieselbe Datei zu. |
| `defer_foreign_keys` | `OFF` | Sonst meldet SQLite Fremdschlüsselverstöße erst beim `COMMIT`. Mitten im Festschreiben eines Exportlaufs ist das der denkbar schlechteste Zeitpunkt für eine Überraschung. |
| `trusted_schema` | `OFF` | B-7.4 Punkt 4, nachgezogen in T-034. Nimmt einem Schema, das nicht von uns stammt, die Fähigkeit, beim bloßen Öffnen etwas auszuführen — über einen Ausdruck in einem Index, einer Sicht oder einem Trigger. Heute kaum ausnutzbar (Erweiterungen sind im Treiber aus, `ATTACH` kommt nirgends vor); die Datei wird trotzdem kopiert, gesichert und zurückgespielt. |

`PRAGMA foreign_keys` wirkt **nicht** innerhalb einer offenen Transaktion — geprüft, der Wert
bleibt dort unverändert. Der Migrationsläufer setzt es deshalb vor `BEGIN`.

### 2.5 Dateirechte des Bestands (B-7.2, T-034)

`takt.db`, `takt.db-wal`, `takt.db-shm` und jede Sicherungskopie des Migrationsläufers liegen mit
**`0600`** im Anwendungsdatenverzeichnis (`0700`, E-018).

Das ist eine Nacharbeit und keine Selbstverständlichkeit. T-023 hat gemessen: Verzeichnis `0700`,
Tokendatei `0600`, Zertifikat `0600` — und die drei Datenbankdateien mit `0644`. SQLite legt seine
Dateien mit `0644 & ~umask` an und fragt niemanden. Auf POSIX hält das Verzeichnis die Grenze,
solange die Datei darin liegt; aber **der Modus wandert mit der Datei**, und ausgerechnet diese
wird kopiert, gesichert und verschoben. In ihr steht mehr als im Export, nämlich auch der interne
Vermerk (Abschnitt 7).

Zwei Maßnahmen, weil eine nicht reicht:

| Maßnahme | Wo | Wogegen |
|---|---|---|
| `process.umask(0o077)` als erste Handlung des Sidecars | `apps/local-api/src/main.ts` | **künftige** Dateien. SQLite entfernt `-wal` und `-shm` im Betrieb und legt sie neu an; ein einmaliges `chmod` erwischt sie dann nicht mehr. Deckt auch jede Nachbardatei ab, an die heute niemand denkt. |
| `secureDatabaseFiles()` nach dem Öffnen und nach `VACUUM INTO` | `packages/storage/src/sqlite/database.ts` | **vorhandene** Dateien aus einer Fassung vor T-034, die schon mit `0644` daliegen. |

Fehlschläge sind still — ein Dateisystem ohne POSIX-Rechte lässt `chmod` scheitern, und das darf
den Start nicht verhindern. Sichtbar wird ein zu weiter Modus stattdessen: Der Dienst misst beim
Start nach und hinterlegt bei Bedarf die Meldung `file_permissions_wide` und eine Zeile im
Protokoll (B-7.2 Punkt 3).

Unter Windows sagt der POSIX-Modus nichts; dort trägt die geerbte ACL von `%LOCALAPPDATA%`. Das
ist im Bericht zu T-011 als benannte Lücke geführt und bleibt es — deshalb geschieht dort nichts,
statt eine Wirkung vorzutäuschen.

**Gemessen:** `pnpm --filter @takt/local-api proof:db-permissions`, einschließlich des echten
Startpfads mit absichtlich weit gesetzter `umask` (Bedrohungsmodell Abschnitt 7, Prüfung 26).

---

## 3. Die Tabellen

Vollständiges DDL: `packages/storage/migrations/0001_initial.up.sql`. Hier die tragenden
Entscheidungen.

### 3.1 `todo_status` — der Status eines Todos (A-5.3, A-5.4)

Frei konfigurierbar. Die vier Werte aus A-5.3 sind Startbestand, keine feste Menge.

#### Seit E-054 ist das **keine Kanban-Spalte** mehr

Bis E-054 war diese Tabelle zweierlei zugleich: die Eigenschaft am Todo **und** die Spalte auf
dem Board. Der Auftraggeber hat das getrennt — eine Kanban-Spalte ist seitdem eine **Regel**
(3.5, 4.4a), frei konfigurierbar in Anzahl, Bezeichnung und Regel. Seit E-055 fragt diese Regel
über fünf Achsen: erforderliche Tags, ausgeschlossene Tags, Status, Erledigt und Exportstatus —
der Status ist damit eine Achse der Spalte und nicht mehr ihr Gegenstück.

Was das für diese Tabelle bedeutet: **nichts.** `todo_status` bleibt, `todo.status_id` bleibt,
die vier Startwerte aus Migration 0002 bleiben, die Standardspalte für neue Todos bleibt. Nur ist
sie nicht mehr die Spalte, in der eine Karte liegt. Geändert wird der Status in der Detailansicht
und in der Liste, nicht durch Ziehen — A-5.2 ist mit E-054 entfallen.

Der Rest dieses Abschnitts gilt unverändert; wo darin „Spalte" steht, ist der Status gemeint.

#### Woher die Statuswerte kommen — die eine Antwort

**Aus der Datenbank, Tabelle `todo_status`. Sonst nirgendwoher.**

Sie stehen nicht im Quelltext der Oberfläche, nicht in einer Einstellungsdatei und nicht in
einer Aufzählung im Code. Angelegt werden die vier Startwerte von der Datenmigration
`packages/storage/migrations/0002_seed_defaults.up.sql` — **einmal**, beim ersten Start auf einer
leeren Datenbank:

| Position | Name | Farbe | Standardspalte |
|---|---|---|---|
| 1 | Backlog | `#64748b` | ja |
| 2 | In Progress | `#2563eb` | nein |
| 3 | Waiting | `#d97706` | nein |
| 4 | Done | `#16a34a` | nein |

Die englischen Namen sind der Wortlaut aus A-5.3 der Spezifikation. Sie sind **Daten**, keine
Oberflächentexte, und fallen deshalb nicht unter die Sprachregel aus `CLAUDE.md` — wer sie
deutsch haben will, benennt sie um, und das ist genau der Punkt: Es ist eine Handlung des
Benutzers und keine Änderung am Programm.

Migration 0002 läuft nur auf einem Bestand, der sie noch nicht hat. Eine umbenannte, gelöschte
oder ergänzte Spalte bleibt bei jedem weiteren Start, wie sie ist; ein Aktualisieren der
Anwendung stellt den Startbestand nicht wieder her.

#### Wie man sie ändert

Über den lokalen Dienst, fünf Operationen. Die Oberfläche ruft sie auf, mehr tut sie nicht.

| Vorgang | Aufruf | Anmerkung |
|---|---|---|
| lesen | `GET /api/v1/todo-statuses` | nach `position` sortiert |
| anlegen | `POST /api/v1/todo-statuses` | `{ name, color?, position? }`; ohne Position hinten |
| umbenennen, färben, zur Standardspalte machen | `PATCH /api/v1/todo-statuses/{id}` | `{ name?, color?, isDefault? }` |
| umsortieren | `PUT /api/v1/todo-statuses/order` | **vollständig**, nie in Teilstücken |
| löschen | `DELETE /api/v1/todo-statuses/{id}` | siehe unten |

Zwei Regeln erzwingt die Datenbank und nicht die Anwendung:

- `ux_todo_status_name` — Namen sind eindeutig, ohne Rücksicht auf Groß- und Kleinschreibung
  (`COLLATE NOCASE`). „Done" und „done" nebeneinander gibt es nicht.
- `ux_todo_status_position` — Positionen sind eindeutig. Deshalb nimmt `PUT .../order` die
  Reihenfolge vollständig entgegen: Eine Umsortierung, die Spalte für Spalte schriebe, ließe für
  die Dauer einer Anweisung zwei Spalten auf derselben Position stehen und bräche am Index.
  `repo-statuses.ts` schreibt aus demselben Grund in zwei Durchläufen, erst negativ, dann
  endgültig.

#### Was die Standardspalte bedeutet

`is_default` markiert die Spalte, in der ein neu angelegtes Todo landet, wenn der Aufrufer
**keine** nennt. Das ist der Normalfall: Weder der Anlegedialog noch das Outlook-Add-in fragen
nach einer Spalte.

Genau eine Spalte trägt die Markierung, erzwungen über
`CREATE UNIQUE INDEX ux_todo_status_default ON todo_status((1)) WHERE is_default = 1` — ein
partieller eindeutiger Index auf einer Konstanten lässt höchstens eine passende Zeile zu. Beim
Umsetzen räumt der Adapter deshalb erst alle Markierungen ab und setzt dann die neue; in der
umgekehrten Reihenfolge stünden kurzzeitig zwei da, und der Index bräche. Beide Anweisungen
liegen in einem Sicherungspunkt (T-047) — ohne ihn wäre der schlimmste Fall dieser Methode ein
Bestand **ohne** Standardspalte, und dann scheiterte jedes neue Todo.

Fehlt die Markierung trotzdem — etwa nach einem Eingriff von Hand in die Datei —, nimmt
`TodoStatusPort.defaultStatus()` den Status mit der kleinsten Position. Gibt es überhaupt keinen
Status, wirft er.

**Über die Routen ist der markierungslose Zustand seit T-074 nicht mehr erreichbar.** Der Index
sichert „höchstens **ein** Standard", nicht „mindestens einer" — und bis T-074 gab es genau zwei
Wege, null zu erzeugen:

| Aufruf | vorher | seit T-074 |
|---|---|---|
| `DELETE /todo-statuses/{id}` auf den Standard | gelöscht, stiller Rückfall | `409 default_status_locked` |
| `PATCH /todo-statuses/{id}` mit `isDefault: false` auf den Standard | Marke weg, stiller Rückfall | `409 default_status_locked` |

Beide Zusagen standen bis dahin **allein in `apps/web`**: Die Oberfläche sperrte den Knopf und
schrieb hin, dass sich der Standard nur weitergeben und nicht abwählen lässt. Wer die Route
unmittelbar aufrief, stellte trotzdem den Zustand her, den die Oberfläche für unmöglich hielt —
und erfuhr nichts davon, weil der Rückfall still war. Eine Regel, die nur in der Oberfläche
steht, ist keine Regel (T-073, T-074).

**Weitergeben statt umhängen.** Abgewiesen wird, statt den Standard beim Löschen selbst
weiterzureichen: Welcher Status danach der Standard sein soll, ist eine Entscheidung des
Benutzers und kein Rest, den eine Löschroutine nebenbei trifft. Der Weg heißt
`PATCH /todo-statuses/{id}` mit `isDefault: true` auf einem anderen, und er steht in der Meldung.
`proof:conflicts` Abschnitt 5 misst beide Abweisungen **und** die Gegenprobe, dass Weitergeben
weiterhin geht — eine Sperre ohne Ausweg wäre eine Sackgasse.

**Die Standardspalte hat nichts mit „Erledigt" zu tun** und die Abschlussspalte auch nicht —
siehe „Erledigt und Abschlussspalte sind zwei Dinge" weiter unten.

#### Was beim Löschen einer Spalte mit ihren Todos geschieht

**Nichts — die Spalte wird nicht gelöscht.** Der Dienst weist ab, und zwar in dieser Reihenfolge:

1. Den Status gibt es nicht → `404 not_found`.
2. Es ist der **letzte** → `409 last_status_column`, „Der letzte Status kann nicht gelöscht
   werden." Ohne einen einzigen Status gäbe es nichts, was ein neues Todo tragen könnte.
3. Es ist der **Standard** für neue Todos → `409 default_status_locked` (T-074, siehe oben).
4. Todos tragen ihn noch → `409 status_in_use`, „Diesen Status tragen noch Todos. Geben Sie
   ihnen zuerst einen anderen."
5. Die **Regel** eines Pools oder einer Kanban-Spalte nennt ihn → `409 status_in_use`, „Diesen
   Status benutzt noch die Regel eines Pools oder einer Kanban-Spalte. Nehmen Sie ihn dort zuerst
   heraus." Seit T-076, weil eine Spalte seitdem nach dem Status filtern kann; seit T-089 nennt
   die Antwort in `details` auch **welche** Regeln (`code: pool_rule`, Kennung in `field`, Name in
   `name`, derselbe Name im Satz `message`). Ohne sie ist die Sperre bei zwanzig Regeln eine Suche.
6. Sonst wird gelöscht.

Punkt 4 und 5 teilen sich einen Schlüssel, weil der Aufrufer dasselbe tun muss: den Status
irgendwo herausnehmen. **Wo**, sagt `details`.

Der Schlüssel `last_status_column` trägt aus der Zeit vor E-054 noch das Wort „column". Er
bleibt, wie er ist: Ein Fehlerschlüssel ist eine Zusage an seine Aufrufer, und `tests/e2e` und
die Schnittstellenbeschreibung nennen ihn beim Namen. Die **Meldungen** dieser Routen sprechen
seit T-074 dagegen vom Status und nicht mehr von der Spalte — fünf Sätze, und der erste davon
erschien im Einstellungsbereich *Status*, zwei Absätze unter der Erklärung, dass Status und
Kanban-Spalte zweierlei sind.

Es gibt bewusst **kein** automatisches Umhängen der Karten in eine andere Spalte. Die Alternative
wäre gewesen, sie in die Standardspalte zu schieben; sie ist schlechter, weil sie eine
Zustandsänderung an fremden Datensätzen hinter einer Löschung versteckt. Wer dreißig Karten
verschoben haben will, soll sie verschieben — dann sieht er, wohin.

Punkt 4 ist doppelt gesichert: Der Fremdschlüssel `todo.status_id` steht auf `ON DELETE RESTRICT`
und würde ohnehin abweisen. Die Prüfung davor liefert den fachlichen Grund statt einer
Datenbankmeldung; der Unterschied ist der zwischen „Diesen Status tragen noch Todos" und
„FOREIGN KEY constraint failed".

#### Der einzige Ort im Frontend mit eigenen Spalten

`apps/web/src/showcase/data.ts` — die Musterseite des Designsystems. Ihre Spalten sind
Beispieldaten für die Darstellung und haben mit dem Bestand nichts zu tun. Jede echte Ansicht
(S-03 Kanban, S-02 Liste, Anlegedialog, Add-in) holt die Spalten über
`GET /api/v1/todo-statuses`.

Wer die Frage „woher kommen die Spalten?" also im Frontend beantwortet sucht, findet dort eine
Antwort, die für die Musterseite stimmt und sonst für nichts. Deshalb steht sie hier.

#### Erledigt und Abschlussspalte sind zwei Dinge (E-023)

**Es gibt kein Merkmal, das eine Spalte als „Erledigt-Spalte" ausweist.** Erledigt (A-2.4) und
die Kanban-Abschlussspalte (A-5.3) sind zwei getrennte Dinge. Ein Todo kann in „Done" stehen und
nicht erledigt sein, und es kann erledigt sein und in „In Progress" stehen. Das
Erledigt-Kennzeichen ist `todo.completed_at` und hängt an keiner Spalte. Eine Markierung
`is_done` gäbe es nur, um beides zu koppeln — und genau diese Kopplung ist ausgeschlossen.

Ein Merkmal bleibt: `is_default`. Was es bedeutet, steht oben unter „Was die Standardspalte
bedeutet".

### 3.2 `todo` (A-2.1 bis A-2.5, E-006)

| Spalte | Zweck |
|---|---|
| `call_number` | E-006, A-2.6. Nullbar. Teilindex `WHERE call_number IS NOT NULL` für die Duplikatsuche des Add-ins (A-10.9). **Nicht eindeutig:** A-10.9 verlangt, dass der Benutzer entscheidet, ob er auf ein vorhandenes Todo bucht oder bewusst ein zweites anlegt. Eine erzwungene Eindeutigkeit nähme ihm diese Wahl. |
| `completed_at` | A-2.4. `NULL` bedeutet aktiv. Ein Zeitstempel statt eines Ja-Nein-Werts, weil das Dashboard „heute erledigt" zeigen soll. Unabhängig von `status_id`. |
| `status_id` | Die Kanban-Spalte. Wird vom Erledigen und vom Wiederaufnehmen **nicht** angefasst. |
| `due_date` | A-19.1, seit Migration 0014. Nullbar; `NULL` heißt „keine Frist", und ein Todo ohne Frist ist in jeder Hinsicht ein gültiges Todo. `YYYY-MM-DD` als Text, **ein Tag und keine Uhrzeit** (E-070 Punkt 1) — derselbe Tagesbegriff wie bei der Tagesgruppierung des Exports (E-025). Teilindex `WHERE due_date IS NOT NULL`. |

**Die Frist ist keine Achse.** Sie geht nicht in `pool_rule` und in keine Exportvorlage (A-19.7,
A-19.17, E-070 Punkt 4). `ExportSourcePath` bleibt bei zwölf Werten; `v_export_candidate` schreibt
seine Spalten aus und wird von `due_date` nicht berührt — genau die Eigenschaft, die A-19.17
strukturell hält statt durch Sorgfalt.

**Der CHECK auf `due_date` ist die zweite Wache, nicht die erste.** Er trägt die *Form* — vier
Ziffern, Bindestrich, zwei Ziffern, Bindestrich, zwei Ziffern, als GLOB, weil SQLite ohne
Erweiterung kein REGEXP kennt. Was er nicht leistet: `2026-02-30` besteht ihn, `0000-01-01` auch.
Die *Existenz* des Tages prüft `isCalendarDay` in `packages/domain/src/due-date.ts`, und beide
Türen — `routes/todos.ts` und die Add-in-Tür (A-19.21) — lesen dieselbe Bindung, keine Abschrift.
Der CHECK steht trotzdem da, weil der Wert Benutzereingabe ist (VG-6) und jeder Prozess im
Benutzerkonto mit `sqlite3` an der Tür vorbeischreiben kann (VG-3).

Kein Feld `board_rank` mehr. Er war der Sortierschlüssel für Drag & Drop (A-5.2, A-13.6); mit
E-054 ist das Ziehen entfallen. **Migration 0010** hat ihn zusammen mit `ux_todo_rank` entfernt und
`ix_todo_status` von `(status_id, board_rank)` auf `(status_id)` verkürzt. Kein Aufrufer hat ihn je
gesetzt, keine Ansicht hat je nach einer vom Benutzer gewählten Reihenfolge sortiert — der Wert
eines neuen Todos war seine eigene Kennung. Wer eine Reihenfolge innerhalb einer Spalte braucht,
führt sie neu und begründet ein.

Kein Feld `note`. Siehe Abschnitt 7.

Kein Feld `status_id_before_done`. Weil das Erledigen die Spalte nie verändert, gibt es beim
Wiederaufnehmen nichts wiederherzustellen. A-2.5 — „landet erneut in dem zuvor definierten
Todo-Pool" — läuft über die **Sichtbarkeit**, nicht über die Spalte: Erledigte Todos werden in
Pool-Ansichten ausgeblendet, aktive nicht. Die Pool-Zugehörigkeit selbst ist ohnehin aus den Tags
abgeleitet und nirgends gespeichert (A-3.4). Hebt ein Timerstart das Kennzeichen auf, erscheint
das Todo ohne einen einzigen zusätzlichen Schreibvorgang wieder in seinem Pool. Die Regel liegt
als `IsVisibleInPool` in `packages/domain/src/tag.ts`.

### 3.3 `tag_folder` und `tag` (A-4.*)

Adjazenzliste: `tag_folder.parent_id` zeigt auf den übergeordneten Ordner, `NULL` bedeutet
Wurzelebene. Begründung der Strukturwahl in Abschnitt 4.

Eindeutigkeit der Namen je Ebene ist etwas trickreich, weil SQLite `NULL`-Werte in einem
`UNIQUE`-Index als voneinander verschieden behandelt — zwei Wurzelordner gleichen Namens kämen
sonst durch. Gelöst über einen Ausdrucksindex mit Platzhalterwert:

```sql
CREATE UNIQUE INDEX ux_tag_folder_name
  ON tag_folder (COALESCE(parent_id, '~root'), name COLLATE NOCASE);
```

`COLLATE NOCASE` verhindert zusätzlich, dass „Intern" und „intern" nebeneinander stehen. Geprüft:
beide Fälle werden abgewiesen, gleiche Namen in verschiedenen Ordnern bleiben erlaubt.

#### `tag.name_key` — wann zwei Tagnamen derselbe sind (T-058)

`COLLATE NOCASE` reicht dafür nicht. SQLite faltet damit **A–Z und sonst nichts**, und es
vergleicht den Text so, wie er gespeichert ist:

| nebeneinander | mit `ux_tag_name` allein | gewollt |
|---|---|---|
| „Backend" / „backend" | abgewiesen | abgewiesen |
| „ backend" / „backend" | **beide angelegt** | abgewiesen |
| „Änderung" / „änderung" | **beide angelegt** | abgewiesen |
| „back  end" / „back end" | **beide angelegt** | abgewiesen |
| „Straße" / „Strasse" | beide angelegt | beide angelegt |

Seit Migration 0008 trägt jedes Tag deshalb einen zweiten Wert: `name_key`, den
**Vergleichsschlüssel**. Er entsteht aus dem Namen in vier Schritten — NFC, jeder Leerraum zu
einem Leerzeichen und Folgen davon zu einem, vorn und hinten nichts, dann Groß- auf
Kleinschreibung. Die Regel steht als `nameKey` in `packages/domain/src/tag-name.ts` und
nirgends sonst. `tagNameKey` ist derselbe Wert unter seinem tagbezogenen Namen — kein zweiter
Bezeichner für eine zweite Fassung, sondern zwei Bezeichner für **eine** Funktion.

**Seit T-074 gilt dieselbe Regel für Regelnamen** (Pools und Kanban-Spalten, 3.5). Nichts an ihr
ist tagspezifisch: Sie beantwortet „bezeichnen zwei getippte Namen dasselbe Ding?", und die Frage
stellt sich dort Wort für Wort genauso. Wie sie dort durchgesetzt wird — und warum es dafür
**keine** Spalte `pool.name_key` gibt — steht in 3.5.

```sql
CREATE UNIQUE INDEX ux_tag_name_key ON tag (COALESCE(folder_id, '~root'), name_key);
CREATE INDEX        ix_tag_name_key ON tag (name_key);
```

Der eindeutige Index ist der eigentliche Zweck: Er macht „kein doppeltes Tag" zu einer Zusage des
**Schemas** und nicht zu einer Hoffnung des Adapters. Genau das braucht das Anlegen eines Todos
mit einem neuen Tagnamen (`resolveTagNames` im Anwendungsfall, architektur.md 3.4) — zwei
gleichzeitige Anfragen mit demselben Namen dürfen nicht zwei Tags erzeugen. Der zweite, nicht eindeutige Index trägt die
**ordnerübergreifende** Frage „gibt es diesen Namen irgendwo?"; der eindeutige taugt dafür nicht,
weil er den Ordner an erster Stelle führt.

**Die Faltung ist aufgezählt und nicht `lower()` und nicht `toLowerCase()`.** SQLite kennt keine
Unicode-Faltung, JavaScript faltet jedes Schriftsystem. Beides nebeneinander ergäbe zwei Regeln,
und die Datenbank erzwänge die schwächere — dort entstünde das doppelte Tag, das der Index
verhindern soll. Aufgezählt sind: ASCII A–Z, der lateinische Ergänzungsblock U+00C0–U+00DE ohne
das Malzeichen, und das große ẞ auf ß. Migration 0008 bildet dieselbe Aufzählung mit einer
rekursiven Abfrage Zeichen für Zeichen nach; `pnpm --filter @takt/local-api proof:tags` hält beide
Fassungen über dreißig Namen gegeneinander.

Der Preis steht ausdrücklich da: Griechische, kyrillische und türkische Großbuchstaben werden
nicht gefaltet. „ΑΛΦΑ" und „αλφα" sind zwei Tags. Ebenso wird **nicht** umgeschrieben — „Straße"
bleibt von „Strasse" verschieden, und „Ä" von „AE". Eine Umschrift würde Namen zusammenwerfen,
die der Benutzer unterschieden hat.

Zwei Trigger weisen einen Schlüssel ab, der leer ist oder wie ein Name aussieht (Großbuchstaben,
Leerraum am Rand, doppelte Leerzeichen). Ein `CHECK` wäre der richtige Ort; SQLite kann keinen an
eine bestehende Tabelle anhängen, ohne sie neu zu bauen, und ein Neubau von `tag` risse drei
Fremdschlüssel mit.

`ux_tag_name` aus 0001 bleibt daneben stehen. Er ist schwächer, aber nicht falsch, und er trägt
die Meldung „In diesem Ordner gibt es bereits ein Tag mit diesem Namen", auf die `errors.ts`
bereits abbildet.

Der triviale Selbstzyklus wird schon von einer Bedingung erschlagen
(`parent_id IS NULL OR parent_id <> id`). Tiefere Zyklen sind in einer Bedingung nicht
ausdrückbar und werden beim Verschieben geprüft, siehe Abschnitt 4.3.

Beide Fremdschlüssel auf `tag_folder` stehen auf `ON DELETE RESTRICT`. Ein `CASCADE` würde beim
Löschen eines Ordners einen ganzen Tagbaum stillschweigend mitreißen, samt aller Zuordnungen an
Todos.

**Was beim Löschen eines Ordners geschieht.** Der Dienst weist in dieser Reihenfolge ab:

1. Den Ordner gibt es nicht → `404 not_found`.
2. Er enthält Unterordner oder Tags → `409 tag_folder_not_empty`, „Dieser Ordner ist nicht leer.
   Verschieben oder löschen Sie zuerst seinen Inhalt."
3. Die **Regel** eines Pools oder einer Kanban-Spalte nennt ihn → `409 tag_in_use`, „Dieser Ordner
   wird in der Regel eines Pools verwendet.", mit den betroffenen Regeln in `details`.
4. Sonst wird gelöscht.

Punkt 3 ist seit T-089 da und ist der Fall, der lange durchrutschte: Löschbar ist ohnehin nur ein
**leerer** Ordner — und der leere Ordner in einer erforderlichen Achse ist genau der Fall, um den
es in E-057 geht (siehe 3.5). Derselbe Schlüssel wie beim Tag in einer Regel, weil es derselbe
Sachverhalt ist; welches Ding gemeint ist, sagt die Route.

### 3.4 `time_entry` — Zeitbuchung (A-6.*, A-7.3)

Die Tabelle trägt die meisten Zusicherungen des Modells.

```sql
export_status TEXT NOT NULL DEFAULT 'open' CHECK (export_status IN ('open','exported'))
```

`NOT NULL` plus `CHECK` — zusammen ergibt das „zweiwertig, nie leer, nie mehrdeutig" aus A-6.9.
Geprüft: `''` scheitert am `CHECK`, `NULL` am `NOT NULL`. Es gibt keinen dritten Wert und keinen
Zustand „wird gerade exportiert"; der Exportlauf ist eine Transaktion, zwischen den beiden Werten
liegt nichts Beobachtbares. Die Werte sind englisch; „offen" und „exportiert"
sind Beschriftungen der Oberfläche und stehen nicht in der Datenbank.

Weitere Bedingungen:

| Bedingung | Trägt |
|---|---|
| `duration_seconds IS NULL OR duration_seconds >= 1` | E-008: eine Buchung mit Dauer 0 existiert nicht. |
| `ended_at IS NULL OR ended_at > started_at` | Keine Buchung endet vor ihrem Beginn. |
| `export_status = 'open' OR ended_at IS NOT NULL` | Ein laufender Timer kann nie als exportiert gelten. |
| `started_at GLOB '...'` | Zeitstempelform, siehe 2.2. |

`export_count` zählt, wie oft die Buchung in einem Exportlauf war. Der Zustand
`export_status = 'open' AND export_count > 0` ist genau das, was die Oberfläche nach R-10 als
„schon einmal exportiert" kennzeichnen muss. Ein Teilindex bedient diese Abfrage direkt.

**Kein Exportstatus ohne Herkunft** (Migration 0006, E-047). Bis dahin stand hier die Bedingung
`export_status = 'open' OR export_count >= 1` mit der Begründung, exportiert und nie in einem Lauf
gewesen sei widersprüchlich. Mit „nicht abrechnen" ist der Satz nicht mehr wahr: Eine ausgebuchte
Buchung ist genau das — im Status exportiert, nie in einem Lauf. `export_count` mitzuzählen wäre
der bequeme Ausweg und eine Falschaussage, denn nach einem späteren Zurücksetzen läse die
Oberfläche „schon einmal exportiert" und warnte vor einer zweiten Abrechnung, die nie eine erste
hatte.

An die Stelle der Bedingung tritt ein Trigger, der mehr verlangt als ein positiver Zähler, nämlich
eine **Herkunft**:

```sql
CREATE TRIGGER trg_time_entry_exported_needs_provenance
BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'open' AND NEW.export_status = 'exported'
 AND NEW.export_count = OLD.export_count
 AND (SELECT event FROM export_audit
       WHERE time_entry_id = NEW.id
       ORDER BY occurred_at DESC, rowid DESC
       LIMIT 1) IS NOT 'not_billed'
BEGIN
  SELECT RAISE(ABORT, 'export_status_not_settable');
END;
```

Zählt ein Exportlauf mit, greift die Bedingung nicht — das ist der eine erlaubte Weg. Bleibt der
Zähler stehen, ist es eine Ausbuchung, und dann muss die Protokollzeile bereits geschrieben sein.
Der Adapter schreibt sie deshalb **vor** dem Statuswechsel. Geprüft wird die jüngste Zeile: Eine
längst zurückgesetzte Ausbuchung rechtfertigt keine neue.

**`rowid` statt `id` seit Migration 0007 (T-047).** Der Zweitschlüssel war bis dahin die Kennung.
Sie ist eine UUIDv7 und innerhalb einer Millisekunde nur so weit sortierbar, wie der
Kennungsgenerator es zusagt — bis T-041 gar nicht, seither über einen Zähler (2.1). Damit hing
eine Integritätsprüfung der **Datenbank** an einer Eigenschaft der **Anwendung**: Wer `IdSource`
austauscht, hätte den Trigger aufgehoben, ohne davon zu erfahren. `export_audit` ist eine
gewöhnliche Rowid-Tabelle und anhängend (`trg_export_audit_no_update`,
`trg_export_audit_no_delete`), also ist `rowid` streng aufsteigend in der Einfügereihenfolge und
wird nie wiederverwendet. Er ist der einzige Wert in dieser Tabelle, der die Reihenfolge
**kennt**, statt sie aus einer Uhr oder einem Zufall zu schätzen. Nachgewiesen in `proof:export`
Abschnitt 12, und zwar am Generator vorbei: Die Protokollzeilen werden dort mit der Hand
geschrieben, mit Kennungen, deren Sortierung der Einfügereihenfolge widerspricht.

**Nur ein Timer gleichzeitig (A-6.8)** — strukturell, nicht per Prüfung im Code:

```sql
CREATE UNIQUE INDEX ux_time_entry_running ON time_entry ((1)) WHERE ended_at IS NULL;
```

Höchstens eine Zeile ohne Endzeit. Geprüft: der zweite Timerstart scheitert mit
`UNIQUE constraint failed`. Eine Prüfung im Adapter („läuft schon einer?") und ein anschließendes
Einfügen wären zwei Schritte und könnten bei zwei gleichzeitigen Anfragen beide durchgehen. Der
Index kann das nicht.

**Sperre der exportierten Buchung (A-6.9)** — über einen Trigger, der nur die inhaltlichen
Felder schützt:

```sql
CREATE TRIGGER trg_time_entry_locked BEFORE UPDATE ON time_entry
WHEN OLD.export_status = 'exported' AND NEW.export_status = 'exported'
 AND (NEW.todo_id <> OLD.todo_id OR NEW.started_at <> OLD.started_at
   OR NEW.ended_at IS NOT OLD.ended_at OR NEW.note <> OLD.note
   OR NEW.source <> OLD.source)
BEGIN SELECT RAISE(ABORT, 'time_entry_locked'); END;
```

Die Bedingung `NEW.export_status = 'exported'` lässt den Wechsel des Exportstatus selbst
durch — sonst ließe sich E-012 nicht umsetzen. Ein zweiter Trigger verhindert das Löschen einer
exportierten Buchung: abgerechnete Zeit wird zurückgesetzt, nicht entfernt. Beides geprüft.

### 3.4a `timer_heartbeat` — Lebenszeichen des laufenden Timers (E-036)

```sql
CREATE TABLE timer_heartbeat (
  time_entry_id TEXT NOT NULL PRIMARY KEY REFERENCES time_entry (id) ON DELETE CASCADE,
  seen_at       TEXT NOT NULL,
  CHECK (seen_at GLOB '...')
);
```

Eine Zeile, solange ein Timer läuft, und keine sonst. Der Primärschlüssel bindet sie an genau die
laufende Buchung; höchstens eine kann es geben, weil es höchstens einen laufenden Timer gibt
(`ux_time_entry_running`).

**Wozu.** A-6.4 verlangt für jede Buchung eine Endzeit. Stürzt die Anwendung ab, meldet sich der
Benutzer ab oder fällt der Strom aus, bleibt eine Buchung ohne Ende zurück. Die naheliegende
Lösung — beim nächsten Start das Ende auf „jetzt" setzen — bucht einen über Nacht vergessenen
Timer mit vierzehn Stunden, und nach der Aufrundung aus E-008 steht das auf einer Rechnung. Das
Lebenszeichen deckelt den Schaden auf ein Schreibintervall: gebucht wird höchstens bis zum
letzten Zeitpunkt, an dem die Anwendung nachweislich lief. Ob überhaupt gebucht wird, entscheidet
der Benutzer (E-036); bis dahin bleibt die Buchung unvollständig und erscheint in keinem Export,
weil `v_export_candidate` ausschließlich abgeschlossene Buchungen führt.

**Warum eine eigene Tabelle und keine Spalte auf `time_entry`.** Drei Gründe:

1. Es ist der einzige Schreibvorgang in Takt, der im Minutentakt läuft. Er darf nicht die Zeile
   berühren, die die Abrechnungsdaten trägt und die der Sperr-Trigger aus A-6.9 schützt.
2. Die Rückwärtsmigration müsste die Spalte wieder entfernen. SQLite verweigert `DROP COLUMN`,
   sobald die Spalte in einem `CHECK` vorkommt — der Rückweg wäre entweder ein vollständiger
   Tabellenumbau oder eine Spalte ohne Formatprüfung. Eine eigene Tabelle kostet ein `DROP TABLE`.
3. Der Wert ist flüchtig. Nach dem Ende des Timers hat er keine Bedeutung mehr und gehört nicht
   in die Buchung, die dauerhaft aufbewahrt wird.

Zwei Trigger weisen ein Lebenszeichen für eine bereits beendete Buchung mit `timer_not_running`
ab, beim Einfügen wie beim Fortschreiben. Geschrieben wird nur, solange der Timer läuft; alles
andere wäre ein Fehler im Adapter und soll auffallen, statt stillschweigend Daten zu erzeugen.

### 3.5 `pool` und `pool_rule` (A-3.*) — und die Kanban-Spalten (E-054)

Gespeichert wird die Regel, nie die Mitgliedschaft.

#### Die Regel ist eine Struktur mit benannten Feldern (T-076, Migration 0011)

Bis T-076 war eine Regel **eine Liste gleichartiger Terme**: `pool_rule` mit `tag_id` **oder**
`folder_id`, und `pool.match_mode` sagte, ob eines oder alle zutreffen müssen. Der Auftraggeber
wollte den Status als Regel aufnehmen und hat dazu ein Vorbild gezeigt — die Board-Konfiguration
von Super Productivity mit getrennten Feldern für erforderliche Tags, ausgeschlossene Tags und
drei Optionsgruppen mit „Alle" als Vorgabe. „Nimm dir ein Beispiel daran. Das regelt das."

Es regelt drei Dinge, die eine Liste gleichartiger Terme nicht kann:

1. **„nicht".** Eine Liste hat keinen Platz für ein ausgeschlossenes Tag. Man müsste das
   Vorzeichen an den Term hängen — und hätte danach zwei Sorten Term in einer Liste, deren
   Verknüpfung man erklären muss, statt sie zu lesen.
2. **Größen, die keine Tagmenge sind.** `tag` und `folder` lösen sich beide zu Tagkennungen an
   `todo_tag` auf. Der Status tut das nicht: Er steht als `todo.status_id` **an der Zeile**,
   genau einer je Todo. Ebenso „Erledigt" (`todo.completed_at`) und der Exportstatus, der an den
   **Buchungen** hängt und nicht am Todo.
3. **Einen Neutralwert je Bedingung.** In einer Liste ist „diese Bedingung ist nicht gesetzt"
   dasselbe wie „die Liste ist leer" — die leere Regel war deshalb ein Sonderfall, den jede
   Auswertung eigens abfangen musste.

Seitdem hat jede Bedingung ihr eigenes Feld:

| Achse | Wo sie steht | Verknüpfung | Neutralwert |
|---|---|---|---|
| erforderliche Tags | `pool_rule`, `role = 'required'` | `pool.match_mode`: alle oder mindestens eines | leere Liste |
| ausgeschlossene Tags | `pool_rule`, `role = 'excluded'` | keines davon | leere Liste |
| Status | `pool_rule`, `role = 'status'` | einer von diesen | leere Liste = „Alle" |
| Erledigt | `pool.completion` | `any` / `done` / `open` | `any` |
| Exportstatus | `pool.export_state` | `any` / `open` / `exported` | `any` |

**Die Achsen sind mit „und" verbunden**, jede engt weiter ein; keine kann das Ergebnis
vergrößern. Das ist keine Wahl, die man auch anders treffen könnte: Ein „oder" zwischen
erforderlichen und ausgeschlossenen Tags wäre sinnlos, und eine zusätzlich genannte Bedingung,
die **mehr** trifft, wäre in jeder Ansicht eine Überraschung.

**Innerhalb** einer Achse steht die Verknüpfung an der Achse. Für die Status ist sie keine
Entscheidung, sondern eine Tatsache: `todo.status_id` trägt genau einen Wert, ein „alle davon"
über zwei Status wäre nicht streng, sondern unerfüllbar — eine Spalte, die garantiert leer bleibt.

**Stehen alle Achsen neutral, trifft die Regel nichts** (A-3.4). Nicht „alle null Bedingungen sind
erfüllt": Eine Regel, die noch nicht eingerichtet ist, hätte sonst schlagartig jedes Todo als
Mitglied.

**Was das an E-054 nicht ändert.** Status und Kanban-Spalte bleiben getrennt. Eine Spalte wird
durch `role = 'status'` nicht wieder zum Status: Sie kann mehrere Status umfassen, keinen, oder
Status und Tags mischen, und dieselbe Karte kann weiterhin in mehreren Spalten stehen.

Das Schema erzwingt die Zuordnung Rolle → gefüllte Spalte erschöpfend:

```sql
CHECK (
     (role IN ('required', 'excluded')
      AND status_id IS NULL
      AND ((tag_id IS NULL) <> (folder_id IS NULL)))
  OR (role = 'status'
      AND status_id IS NOT NULL AND tag_id IS NULL AND folder_id IS NULL)
)
```

`ux_pool_rule` führt seitdem `role` und `status_id` mit. Beides ist notwendig: Ohne `status_id`
kollidierten zwei **verschiedene** Statusterme derselben Regel miteinander; ohne `role` ließe sich
dasselbe Tag nicht zugleich erfordern und ausschließen — eine unsinnige Regel, aber eine Eingabe
des Benutzers und kein Datenbankfehler.

**Alle drei Termspalten stehen auf ON DELETE RESTRICT** — `status_id` seit 0011, `tag_id` und
`folder_id` seit 0012 (T-089). Nur `pool_id` kaskadiert: Die Regel geht, ihre Terme gehen mit, und
ein Term ohne Regel wäre kein Datensatz, sondern Müll.

Die Begründung ist für alle drei dieselbe: Eine Regel, der ein Term stillschweigend entzogen wird,
träfe danach **mehr** Todos als vorher — oder, wenn es ihre einzige Achse war, gar keine. Beides
fiele erst auf, wenn jemand auf das Board sieht.

Bis T-089 galt das nur für den Status, und der Preis stand in R-1 Befund 1: Ein Ordner ist genau
dann löschbar, wenn er **leer** ist — und der leere Ordner in einer erforderlichen Achse ist der
Fall, um den es in E-057 geht. Aus „Tags aus Ordner Ost **und** Status offen" wurde beim Löschen
von Ost still „Status offen". Die Oberfläche führte den Benutzer sogar dorthin: Der Leerzustand
eines Ordners bietet „Ordner löschen" an.

Die Datenbank ist dabei die **zweite** Wache. `TagPort.remove`, `TagFolderPort.remove` und
`TodoStatusPort.remove` fragen vorher und antworten fachlich — `tag_in_use` beziehungsweise
`status_in_use`, 409, mit den betroffenen Regeln in `details` (`code: pool_rule`, Kennung in
`field`, Name in `name`, derselbe Name im Satz `message`). RESTRICT nimmt der Datenbank nur die
Möglichkeit, still zu gehorchen, falls eines Tages jemand an der Prüfung vorbeischreibt.

Das Feld `name` steht seit T-107 neben `message` und nicht statt seiner (W-11 aus R-2a). Eine
Oberfläche, die „die Regeln „Ost“, „Nord“ und „Abrechnung“" setzen will, braucht den bloßen
Namen; ihn aus dem Satz des Dienstes herauszuschneiden wäre eine ungeschriebene Abmachung über
dessen Wortlaut und bräche still, sobald der Satz sich ändert.

`TagPort.remove` nennt die Regeln seit T-101; bis dahin zählte er sie nur, und der Löschdialog der
Oberfläche blieb ausgerechnet beim Tag ohne den Satz „Betroffen ist Regel „…"." (R-1a Befund 1,
gemessen in T-099). Alle drei Abfragen tragen seitdem eine **Obergrenze**: Sie holen 21 Zeilen,
nennen höchstens 20 und sagen im Meldungstext, wenn es mehr sind (`RULE_REFERENCE_LIMIT` in
`sqlite/mappers.ts`, R-3a H-3). Ohne Grenze stünde bei 200 Zeichen je Name der ganze Bestand in
einem Satz; mit stiller Grenze nähme der Benutzer zwanzig Regeln heraus und fände die Sperre
unverändert vor.

**Einen ausgeschlossenen Status gibt es nicht.** Er wäre eine vierte Rolle für eine Bedingung, die
sich ohne sie ausdrücken lässt: Wer „alles außer Erledigt" meint, wählt die übrigen Status. Bei
Tags ist das anders — dort sind es Tausende, und „alle außer diesem einen" ließe sich nicht
aufzählen. Genau deshalb gibt es die Ausschlussliste für Tags und nicht für Status.

`include_subfolders` steuert die Tiefe und gilt für **beide** Taglisten; eine getrennte Tiefe je
Liste wäre eine zweite Wahrheit über denselben Baum. Das deckt „flexibel konfigurieren" aus A-3.3,
ohne eine Abfragesprache einzuführen, die man validieren und gegen Einschleusung absichern müsste.

#### `placement` — eine Entität, zwei Flächen (E-054, Migration 0009)

Seit E-054 ist eine **Kanban-Spalte dasselbe wie ein Pool**: ein Name und eine Regel — seit
E-055 über fünf Achsen und nicht allein über Tags. `placement` sagt, wo eine Regel erscheint:

| Wert | Bedeutung |
|---|---|
| `pool` | nur in der Pool-Liste. Vorgabe, und der Wert jeder Zeile aus der Zeit vor 0009 |
| `board` | nur als Spalte des Kanban-Boards |
| `both` | beides — dieselbe Regel, an zwei Stellen sichtbar |

Dreiwertig und nie leer, aus demselben Grund wie der Exportstatus (6.1). Zwei Wahrheitswerte
nebeneinander (`zeigt_im_pool`, `zeigt_auf_board`) hätten vier Zustände, und einer davon — beide
falsch — wäre eine Regel, die nirgends erscheint und die niemand wiederfindet.

**Warum keine Tabelle `board_column`.** Sie hätte `pool` Wort für Wort abgeschrieben: Name,
Position, Regelterme, „genau eine Quelle je Regel", die rekursive Ordnerauflösung, die
Mitgliederabfrage, die leere Regel, die nichts trifft. Das wäre die achte Doppelung dieses
Bestands gewesen und die teuerste, weil an ihr 4.4 doppelt gehangen hätte. Der Preis der
Entscheidung ist, dass das Wort „Pool" jetzt zwei Dinge bezeichnen kann; er wird an genau einer
Stelle bezahlt — `placement` —, und die steht in jeder Abfrage sichtbar da.

`position` gilt für **beide** Flächen: Die Pool-Liste sortiert die Regeln mit `pool`/`both`
danach, das Board die mit `board`/`both`. Eine zweite Positionsspalte je Fläche wäre eine zweite
Wahrheit über dieselbe Ordnung.

Die Mitgliederabfrage steht in Abschnitt 4.4, das Board in 4.4a.

#### `pool.name` — wann zwei Regelnamen derselbe sind (T-074)

**Dieselbe Regel wie bei Tagnamen** (3.3): Unicode-Zusammensetzung (NFC), jeder Leerraum ein
Leerzeichen und Folgen zu einem, Groß- und Kleinschreibung gefaltet über A–Z, den lateinischen
Ergänzungsblock U+00C0–U+00DE und ẞ. Also `Backend` = `backend` = `` ` Backend ` ``,
`Änderung` = `änderung`, aber `Straße` ≠ `Strasse`.

Entschieden wurde sie und nicht neu erfunden: Es ist **wörtlich dieselbe Funktion**
(`nameKey` in `packages/domain/src/tag-name.ts`), nicht eine zweite Fassung daneben. Die Frage
„bezeichnen zwei getippte Namen dasselbe Ding?" stellt sich bei einer Regel Wort für Wort wie
bei einem Tag; zwei Antworten darauf wären zwei Regeln, von denen die Oberfläche zufällig eine
zu sehen bekäme.

**Wo sie durchgesetzt wird — und wo nicht.** Anders als bei Tags gibt es **keine** Spalte
`pool.name_key`:

| Ebene | Was sie trägt |
|---|---|
| Anwendungsfall (`createPool`, `updatePool`) | die volle Regel. Er liest die Namen aller Regeln (`PoolPort.listNames`) und vergleicht die Schlüssel in der Domäne |
| `ux_pool_name` (`COLLATE NOCASE`, Migration 0001) | nur A–Z, aber strukturell. Er bleibt als zweite Ebene stehen |

Der Vergleich im Anwendungsfall steht in **derselben** Transaktion wie das anschließende
Schreiben, und `TransactionPort` reiht Transaktionen (architektur.md 3.4): Zwei laufen nie
ineinander, die zweite Anfrage sieht die Regel der ersten. Ein Wettlauf entsteht daraus also
nicht.

**Warum trotzdem kein `name_key` wie bei Tags.** Die Spalte wäre nur zu haben, indem die
aufgezählte Faltung ein zweites Mal in SQL steht — Migration 0008 baut sie über 40 Zeilen einer
rekursiven Abfrage nach, weil SQLite keine Unicode-Faltung kennt. Für Tags lohnt das: Sie sind
Tausende, entstehen nebenbei beim Anlegen eines Todos und brauchen einen Index für die Frage
„gibt es das schon?". Regeln sind ein paar Dutzend, ein Mensch legt sie einzeln an, und ein
vollständiger Durchlauf über die Tabelle kostet nichts (dieselbe Begründung wie bei „kein Index
auf `placement`" in Migration 0009). Eine zweite SQL-Fassung der Faltung wäre der teurere Teil
des Handels — sie müsste mit der ersten mitwandern, und die Stelle, an der beide auseinanderlaufen,
wäre genau die, an der wieder zwei gleiche Namen entstünden.

Der **Preis** dieser Entscheidung steht ausdrücklich da: Wer am Anwendungsfall vorbei in die
Datenbank schreibt, kann `Änderung` und `änderung` nebeneinander anlegen. Der Index verhindert
das nicht, weil `COLLATE NOCASE` kein `Ä` kennt. Für Takt — ein Prozess, ein Schreibweg — ist das
kein erreichbarer Zustand; `proof:conflicts` Abschnitt 4 misst ihn über die Routen.

**Gespeichert wird die Anzeigeform.** `„  Vertrieb   Süd  "` wird zu `„Vertrieb Süd"`, wie bei
Tags (3.3). Ohne diesen Schritt stünden zwei Regeln nebeneinander, die auf dem Bildschirm gleich
aussehen und es für die Datenbank nicht sind.

### 3.6 `export_template`, `export_run`, `export_run_group`, `export_run_entry`, `export_audit`

`export_template.definition` ist JSON mit `CHECK (json_valid(definition))`. Aufbau und Prüfung
der Feldliste gehören zu T-007 und `packages/export`; Schema und Domäne kennen nur die Hülle. So
kann der Vorlagen-Motor sein Format weiterentwickeln, ohne dass eine Migration nötig wird.

**Der Feldname ist Benutzereingabe und wird geprüft (B-3.2, T-034).** Die Datenbank kann das
nicht: Für sie ist `definition` gültiges JSON und sonst nichts. Geprüft wird deshalb in
`packages/export/src/template.ts`, beim **Speichern** und bei jedem Lauf:

* Zeichenvorrat und Länge: `^[A-Za-z0-9_-]{1,64}$`. `__proto__`, `constructor` und `prototype`
  stehen zusätzlich ausdrücklich auf einer Sperrliste.
* Keine zwei Felder gleichen Namens in derselben Vorlage.

Der Grund steht in der gemessenen Wirkung. T-023 hat den Zustand davor gegen den echten Motor
gefahren: Ein Feld namens `__proto__` **fehlte still** in der Exportdatei, im ungünstigen Fall
blieb die ganze Zeile leer; zwei Felder namens `Call` ergaben `{"Call":0.25}` — die Call-Nummer
war stillschweigend durch die Zeitangabe ersetzt. Beides erzeugt nirgends einen Fehler und fällt
erst beim Kunden auf. Zusätzlich baut der Renderer die Zeile über `Object.create(null)`, damit
auch eine an der Prüfung vorbei eingesetzte Vorlage — per `INSERT` in diese Tabelle — nichts mehr
verschlucken kann.

Die Standardvorlage ist über zwei Trigger weder löschbar noch änderbar (A-8.7). Kopieren bleibt
erlaubt. Geprüft: Löschen scheitert, Kopieren geht.

`export_run` hält je Lauf einen **Abzug der Vorlage** (`template_snapshot`). Ohne ihn würde eine
spätere Änderung an der Vorlage die Geschichte rückwirkend umschreiben, und man könnte nicht
mehr feststellen, welche Felder tatsächlich in die Abrechnung gegangen sind. Ebenfalls
mitgeschrieben: `rounding_mode`, damit später nachvollziehbar bleibt, nach welcher Regel gerundet
wurde, und `file_sha256`, weil der Exportordner Benutzereingabe ist (E-011) und von außen
verändert werden kann.

`export_run`, `export_run_group`, `export_run_entry` und `export_audit` sind **anhängend und
unveränderlich**: je ein
`BEFORE UPDATE`- und ein `BEFORE DELETE`-Trigger mit `RAISE(ABORT, 'append_only')`. Das ist eine
Eigenschaft des Schemas, keine Vereinbarung unter Entwicklern — es gibt keinen Anwendungsfall,
der diese Zeilen ändert, und auch keinen Weg dorthin. Geprüft.

### 3.7 `app_setting` — eine Zeile

`id INTEGER PRIMARY KEY CHECK (id = 1)`. Feste Spalten statt eines Schlüssel-Wert-Beutels: jede
Einstellung hat damit einen Typ, und eine neue Einstellung erzwingt eine Migration, statt
unbemerkt als Zeichenkette hereinzurutschen.

Das Add-in-Token steht **nicht** hier — und mit T-011 steht sein Klartext auch sonst nirgends:
Auf der Platte liegt ausschließlich der SHA-256-Abdruck, in einer eigenen Datei neben der
Datenbank, mit den Rechten `0600`. Begründung in `docs/architektur.md`, Abschnitt 6.

**`skipped_version` — die übersprungene Fassung (A-18.10, R-20, T-138).** Seit Migration 0013
trägt die Zeile eine weitere Spalte: die Fassung, für die der Benutzer „Überspringen" gewählt hat.
`NULL` heißt „nichts übersprungen".

Sie steht **hier** und nicht im Arbeitsspeicher des Dienstes und nicht im Browserspeicher der
Oberfläche, und der Grund ist R-20: Ein nur für die Sitzung gemerktes Überspringen bringt den
Hinweis beim nächsten Start wieder, und einen Hinweis, den man nicht loswird, klickt der Benutzer
ungelesen weg — danach auch den, der zählt. Der zugehörige Prüffall misst deshalb einen Neustart
und nicht das Schließen eines Dialogs.

Übersprungen wird **eine Fassung, nicht die Prüfung**: Verglichen wird auf Gleichheit, eine
später erschienene, höhere Fassung meldet sich wieder. Die Regel dazu steht als
`decideUpdateNotice` in `packages/domain` und an keiner Anzeigestelle.

Der Wert ist **Benutzereingabe** (T-136-4): Jeder Prozess mit dem Sitzungsgeheimnis kann ihn über
`PATCH /settings` setzen. Er wird deshalb an drei Stellen gehalten, und jede hat eine andere
Aufgabe:

| Stelle | Was sie tut |
|---|---|
| `settingsSchema` in `routes/export.ts` | Weist ab, was nicht die Form aus A-V-8 hat — mit **dem** Ausdruck aus `packages/domain`, nicht mit einer Abschrift. Ergibt 422. |
| `updateSettings` in `usecases/structure.ts` | Prüft noch einmal mit `checkVersion` und **normalisiert**: gespeichert wird ohne führendes `v`. Sonst stünde in derselben Spalte je nach Aufrufer `1.2.3` oder `v1.2.3`, und die Gleichheitsprüfung fände das eine nicht neben dem anderen. |
| `toAppSettings` in `sqlite/mappers.ts` | Prüft beim **Lesen**. Ein unbrauchbarer gespeicherter Wert heißt „nichts übersprungen" — kein Wurf, keine Fehlermeldung, kein Wert, der weitergereicht wird. Ein Bestand kann kopiert, gesichert und aus fremder Quelle mitgebracht sein. |

Der CHECK auf der Spalte ist die **zweite Wache**, nicht die erste: Länge zwischen 5 und 94,
Beginn mit einer Ziffer, zwei Punkte, und kein Zeichen außerhalb von `0-9`, `A-Z`, `a-z`, `.`
und `-`. Er kann die vollständige Form nicht ausdrücken — SQLite kennt ohne Erweiterung kein
REGEXP —, und das ist Absicht: Die vollständige Form hat einen Ort, und dieser Ort ist die Domäne.
Was der CHECK trägt, ist der Zeichenvorrat, und der ist der sicherheitsrelevante Teil (B-18.2).

Der Wert geht in **keine** Adresse. Die Adresse zur Release-Seite baut die Hülle aus der Fassung,
die sie selbst geprüft hat (A-V-16); die übersprungene Fassung entscheidet nur darüber, ob ein
Hinweis erscheint. Schaden im schlimmsten Fall: ein unterdrückter Hinweis.

### 3.8 `todo_attachment` und `todo_attachment_kind` (A-19.8 bis A-19.15, E-071)

Seit Migration 0015. Ein Todo kann beliebig viele Anhänge tragen; es gibt drei Arten — Verweis,
Datei, Bild. Sie hängen am **bestehenden** Todo und sind keine zweite Struktur daneben.

| Spalte | Zweck |
|---|---|
| `todo_id` | `ON DELETE CASCADE` wie `todo_note` und `todo_tag`. Ein gelöschtes Todo lässt keine Anhänge zurück. |
| `kind` | Fremdschlüssel auf `todo_attachment_kind`, `ON DELETE RESTRICT ON UPDATE RESTRICT`. |
| `title` | Frei gewählte Bezeichnung (A-19.10). `NULL` heißt „nicht gesetzt". |
| `target` | Der Wert. Was darin steht, hängt an der Art — siehe die Tabelle unten. |
| `position` | Reihenfolge des Hinzufügens, je Todo ab 0 (A-19.8). Bestimmt der Adapter, nicht der Aufrufer. |
| `created_at` | Zeitstempel wie überall: Text, UTC, sekundengenau (2.2). |

#### Warum die Art eine eigene Tabelle ist und kein CHECK

Die Auflage lautete: Eine **vierte Art** darf keine Migration mit Tabellenumbau verlangen. Drei
Entwürfe standen zur Wahl, und nur der dritte erfüllt sie.

| Entwurf | Was eine vierte Art kostet |
|---|---|
| Drei Spalten — `url`, `file_path`, `image_name` | Eine vierte Spalte. Drei von vier wären in jeder Zeile leer, und jede Abfrage müsste wissen, welche sie lesen darf. Verworfen. |
| Eine Wertspalte mit `CHECK (kind IN (…))` | Einen Tabellenumbau. SQLite kann einen CHECK nicht ändern; ihn zu erweitern heißt, die Tabelle neu zu bauen und die Zeilen zu kopieren. Genau das schließt die Auflage aus. Verworfen. |
| Eine Wertspalte und eine Nachschlagetabelle | Ein INSERT und einen Zweig in `packages/domain/src/attachment.ts`. **Gewählt.** |

Der Preis ist eine Tabelle mit drei Zeilen und eine Verknüpfung, die niemand liest. Der Gegenwert:
Die Menge der Arten ist **Daten** und keine Schemaklausel — und die Datenbank lässt eine unbekannte
Art trotzdem nicht still durch. `ON DELETE RESTRICT` und `ON UPDATE RESTRICT` machen daraus einen
Fehlschlag beim Schreiben statt eine Zeile, die niemand anzeigen kann. Dieselbe Rolle wie die
RESTRICT-Klauseln aus 0011 und 0012: die zweite Wache, nicht die erste.

Die erste Wache steht in der Leserichtung: `toAttachments` in
`packages/storage/src/sqlite/repo-attachments.ts` übergeht eine Zeile, deren Art die Domäne nicht
kennt, statt sie zu werfen — ein Bestand aus einer neueren Fassung ist damit lesbar, und die
Zeile bleibt dabei physisch stehen.

#### Was `target` je Art enthält (E-071 Punkt 1 und 2)

| Art | Inhalt von `target` |
|---|---|
| `link` | Die **Normalform** der Adresse (A-A-3). Was hier steht, ist genau das, was angezeigt und was geöffnet wird. Normalisiert wird einmal, beim Anlegen, in der Domäne — und nirgends sonst (A-A-13). |
| `file` | Der absolute Pfad, unverändert. Takt kopiert nichts und verwaltet nichts davon; verschwindet die Datei, sagt der Anhang das (A-19.15). |
| `image` | Der **erzeugte** Name der Kopie im Bildverzeichnis (A-A-17) — nie Name oder Pfad der Quelle. |

Der CHECK `length(target) <= 4096` zählt **Zeichen**, die Domäne zählt **Bytes**
(`MAX_ATTACHMENT_PATH_BYTES`). Er ist damit die weitere von beiden und genau das, was er sein
soll: ein Deckel gegen einen Roman im Feld, keine zweite Meinung über die Form.

#### Keine Bytes in der Datenbank

Ein Bild liegt als Datei im Anwendungsdatenverzeichnis neben dem Bestand, unter denselben Rechten
(`0700`/`0600`, E-018, A-A-17), und nicht als BLOB. Ein BLOB wanderte in jede Sicherung der
Datenbankdatei, bliese die WAL bei jedem Schreibvorgang auf und machte aus `takt.db` eine Datei,
deren Größe niemand mehr erklären kann.

Die Folge trägt der Anwendungsfall und nicht das Schema: `ON DELETE CASCADE` nimmt die **Zeilen**
mit, die **Dateien** nicht — SQL kennt kein Dateisystem. Wer ein Todo löscht, liest deshalb zuerst
`imageTargets(todoId)` und entfernt danach die Dateien; die Reihenfolge steht in
`usecases/todos.ts` und ist der Grund, warum das Löschen eines Todos den Bildport überhaupt
anfasst. Von den beiden möglichen Halbzuständen ist „Zeile weg, Datei liegt noch" der behebbare.

Seit T-159 ist dieser Fehlschlag außerdem nicht mehr stumm: `removeImage` meldet ihn als Wert
(`removed` | `unknown_name` | `failed`) und schreibt eine Protokollzeile mit dem **erzeugten**
Namen. Die Antwort an den Benutzer bleibt `ok` — der Anhang **ist** entfernt —, aber eine
Bildkopie ohne Eigentümer verschwindet nicht länger unbemerkt (A-A-18).

#### Keine Verbindung zum Export

Es gibt keine Sicht und keinen Trigger, der diese Tabelle mit `v_export_candidate` oder
`export_run_entry` verbindet, und es wird nie einen geben (A-19.17). Der Schutz ist derselbe wie
beim internen Vermerk und liegt aus demselben Grund im **Typ** und nicht in einer Filterliste:
`ExportSourcePath` bleibt bei zwölf Werten, `ExportCandidate` und `ExportGroup` tragen kein
Anhangsfeld (R-06, A-A-20). Siehe Abschnitt 7.

---

## 4. Der Tag-Ordnerbaum

A-4.3 verlangt beliebige Tiefe, A-4.6 Zyklusfreiheit, und die Definition of Done verlangt, dass
Abfragen über tiefe Bäume nicht die gesamte Tabelle in den Speicher laden.

### 4.1 Die drei Möglichkeiten, gemessen

Ich habe alle drei nicht abgeschätzt, sondern gebaut und gemessen — SQLite 3.51.3, Bäume mit
gleichmäßigem Verzweigungsgrad, Abfrage „alle Tags in diesem Ordner und allen Unterordnern",
gemittelt über 2000 Läufe mit vorbereiteter Anweisung.

| Baum | Ordner | Rekursive CTE | Closure-Tabelle | Closure-Zeilen |
|---|---|---|---|---|
| Tiefe 4, Grad 4 | 340 | 55,5 µs | 17,9 µs | 1 252 |
| Tiefe 5, Grad 4 | 1 364 | 248,4 µs | 76,9 µs | 6 372 |
| Tiefe 10, Grad 2 | 2 046 | 892,5 µs | 247,2 µs | 18 434 |
| Tiefe 6, Grad 5 | 19 530 | 3 985,7 µs | 1 118,1 µs | 112 305 |

Der Abfrageplan der rekursiven CTE, ebenfalls gemessen:

```
SEARCH tag USING COVERING INDEX ix_tag_folder (folder_id=?)
MATERIALIZE sub
  SETUP           SEARCH tag_folder USING COVERING INDEX sqlite_autoindex_tag_folder_1 (id=?)
  RECURSIVE STEP  SEARCH f USING INDEX ix_tag_folder_parent (parent_id=?)
```

Ausschließlich `SEARCH`, kein einziges `SCAN` über eine Basistabelle. Die Anforderung „kein
Volltabellenscan bei vier und mehr Ebenen" ist damit belegt, nicht behauptet.

### 4.2 Entscheidung: Adjazenzliste mit rekursiver CTE

**Gewählt.** Begründung:

1. **Die Anforderung ist erfüllt.** Beide Verfahren arbeiten mit Indexzugriffen. Die
   Anforderung lautet „kein Volltabellenscan", nicht „das schnellstmögliche Verfahren".

2. **Der Vorsprung der Closure-Tabelle ist real, aber gegenstandslos.** Faktor drei — von
   55 µs auf 18 µs. Eine Tagverwaltung, die auf eine Benutzeraktion hin antwortet, ist bei
   beiden Werten weit unterhalb der Wahrnehmungsschwelle. Der Faktor drei bezieht sich auf eine
   Größe, die nicht wehtut.

3. **Der Preis fällt an der gefährlichsten Stelle an.** Eine Closure-Tabelle muss bei jedem
   Verschieben gepflegt werden: alle Verbindungen des Teilbaums nach außen löschen und gegen die
   neuen ersetzen. Genau das Verschieben ist der Vorgang, an dem A-4.6 hängt. Ein Fehler dort
   erzeugt keinen sichtbaren Absturz, sondern einen stillschweigend falschen Baum. Bei 19 530
   Ordnern trägt die Closure-Tabelle 112 305 Zeilen — fünfeinhalb Mal so viele Zeilen wie
   Ordner, alle abgeleitet, alle jederzeit inkonsistent werdbar.

4. **Materialisierter Pfad scheidet aus.** Ein Umbenennen oder Verschieben schreibt die Pfade
   aller Nachfahren um, der Trenner muss in Ordnernamen maskiert werden, und Namen sind hier
   freie Benutzereingabe. Zwei Fehlerquellen für keinen Vorteil gegenüber der Closure-Tabelle.

5. **Der Rückweg steht offen.** Eine Closure-Tabelle ist vollständig aus der Adjazenzliste
   ableitbar. Sollte sich der Baum wider Erwarten als Engpass erweisen, lässt sie sich in einer
   späteren Migration als reiner Lesebeschleuniger ergänzen, ohne dass Domäne, Ports oder
   Anwendungsfälle sich ändern — sie ist dann ein Zwischenspeicher, nicht die Wahrheit. Die
   umgekehrte Richtung, eine eingebaute Closure-Tabelle wieder loszuwerden, wäre teurer.

**Schwelle für eine Neubewertung:** über 5 000 Ordner oder eine gemessene Baumabfrage über
50 ms. Beides ist bei der Verwendung aus A-4.5 — Projekte, Kunden, Aufgabenarten, Abteilungen,
Prioritäten — nicht in Sicht.

### 4.3 Zyklusprüfung beim Verschieben (A-4.6)

Ein Ordner darf weder sich selbst noch einen seiner Nachfahren als übergeordneten Ordner
bekommen. Beides ist dieselbe Bedingung: *der Zielordner darf nicht im Teilbaum des verschobenen
Ordners liegen und nicht der Ordner selbst sein.*

Statt den Teilbaum abwärts zu durchsuchen, wird die Vorfahrenkette des **Ziels** aufwärts
verfolgt. Die ist bei einem Baum der Tiefe *n* höchstens *n* Zeilen lang, unabhängig davon, wie
breit der Teilbaum ist:

```sql
WITH RECURSIVE vorfahr(id) AS (
  SELECT parent_id FROM tag_folder WHERE id = :ziel
  UNION ALL
  SELECT f.parent_id FROM tag_folder f JOIN vorfahr v ON f.id = v.id
   WHERE f.parent_id IS NOT NULL
)
SELECT EXISTS(SELECT 1 FROM vorfahr WHERE id = :zuVerschieben) AS zyklus;
```

Gemessener Plan: `SEARCH tag_folder USING INDEX sqlite_autoindex_tag_folder_1 (id=?)` je Schritt,
also ein Primärschlüsselzugriff je Ebene. Bei zehn Ebenen zehn Zugriffe.

Die Prüfung läuft in **derselben Transaktion** wie das Verschieben. Prüfen und danach schreiben
wären zwei Schritte; zwei gleichzeitige Verschiebungen könnten beide die Prüfung bestehen und
zusammen einen Zyklus erzeugen.

Die reine Entscheidungsregel liegt als `CheckFolderMove` in `packages/domain/src/tag.ts` und
bekommt die Kette als Eingabe. Sie ist damit ohne Datenbank prüfbar.

### 4.4 Pool-Mitgliedschaft als Abfrage (A-3.4)

```sql
WITH RECURSIVE ordner(id) AS (
  SELECT folder_id FROM pool_rule WHERE pool_id = :pool AND folder_id IS NOT NULL
  UNION ALL
  SELECT f.id FROM tag_folder f JOIN ordner o ON f.parent_id = o.id
),
regel_tags(tag_id) AS (
  SELECT tag_id FROM pool_rule WHERE pool_id = :pool AND tag_id IS NOT NULL
  UNION
  SELECT g.id FROM tag g JOIN ordner o ON g.folder_id = o.id
)
SELECT DISTINCT t.* FROM todo t
JOIN todo_tag tt ON tt.todo_id = t.id
JOIN regel_tags r ON r.tag_id = tt.tag_id;
```

Für `match_mode = 'all'` tritt eine `GROUP BY t.id HAVING count(DISTINCT r.tag_id) = :anzahl`
hinzu.

**Seit T-076 ist das die erste von fünf Achsen** (3.5). Die übrigen vier treten als weitere
Bedingungen **derselben** WHERE-Klausel hinzu, mit UND verbunden; jede fällt weg, wenn sie neutral
steht. `buildConditions` in `repo-todos.ts` setzt sie zusammen:

| Achse | Bedingung | Zugriffspfad |
|---|---|---|
| ausgeschlossene Tags | `NOT EXISTS (SELECT 1 FROM todo_tag tt WHERE tt.todo_id = t.id AND tt.tag_id IN (…))` | `ix_todo_tag_reverse` |
| Status | `t.status_id IN (…)` | Spalte an der Zeile, kein JOIN |
| Erledigt | `t.completed_at IS NULL` bzw. `IS NOT NULL` | Spalte an der Zeile |
| Exportstatus offen | `EXISTS (… te.export_status = 'open' AND te.ended_at IS NOT NULL)` | `ix_time_entry_queue` |
| Exportstatus exportiert | `EXISTS (… te.export_status = 'exported')` | `ix_time_entry_todo` |

Der Status ist der Grund, warum diese Übersetzung nicht durchweg über eine Verknüpfungstabelle
gehen kann: Tags stehen in `todo_tag`, der Status steht als Spalte an `todo`. Die Abfrage muss
beides in **einer** Bedingung können, und genau deshalb ist der Status ein eigenes Feld der Regel
und kein weiterer Termtyp.

Bleibt keine einzige Bedingung übrig, steht `0 = 1` — die leere Regel trifft nichts (A-3.4).
**Ob das so ist, entscheidet seit T-080 die Domäne und nicht diese Übersetzung:**
`buildConditions` ruft `poolRuleIsEmpty` mit den fünf Achsen auf, so wie sie hier vorliegen —
die beiden Taglisten bereits aufgelöst. Die Bedingung stand vorher hier ausgeschrieben, ein
zweites Mal in `matchesPool` und ein drittes Mal in der Oberfläche; ihre Übereinstimmung wird
weiterhin gemessen (4.4a, `proof:openapi` Abschnitt 13).

`axes.length === 0` steht daneben und nicht statt dessen. Es ist das Sicherheitsnetz für den
Tag, an dem eine sechste Achse in der Domäne steht und in dieser Übersetzung noch nicht: Dann
sagt die Domäne „schränkt ein", hier gäbe es keine einzige Bedingung, und `WHERE ()` wäre ein
Syntaxfehler. Der Ausgang ist eine leere Spalte — falsch, aber sichtbar leer statt still zu
weit.

Gemessener Plan: `SEARCH pool_rule USING INDEX ux_pool_rule (pool_id=?)`,
`SEARCH f USING INDEX ix_tag_folder_parent (parent_id=?)`,
`SEARCH tt USING PRIMARY KEY (todo_id=?)`. Kein Basistabellenscan.

Nachgewiesen im Migrationstest: ein Todo bleibt Mitglied seines Pools, während es erledigt ist,
und ist nach dem Timerstart nach A-2.5 sofort wieder in der Ergebnisliste — ohne dass irgendeine
Zuordnung geschrieben worden wäre.

### 4.4a Das Kanban-Board ist dieselbe Abfrage, mehrfach (E-054)

Eine Spalte ist eine Regel (3.5). „Wer steht in dieser Spalte?" ist deshalb wörtlich die Abfrage
aus 4.4, und `GET /api/v1/board` stellt sie je Spalte einmal — mit derselben Sortierung,
derselben Blätterung und denselben Indizes wie eine Pool-Ansicht. Es gibt keine zweite Abfrage
für Boards; eine wäre eine zweite Wahrheit über dieselbe Menge.

**Was daraus folgt und vorher nicht möglich war: dieselbe Karte steht in mehreren Spalten.**
Solange eine Spalte ein Status war, ließ `todo.status_id` nichts anderes zu als genau eine. Seit
eine Spalte eine Regel ist, treffen zwei zutreffende Regeln beide zu. Das ist kein Sonderfall,
den man abfangen muss, sondern der Normalfall.

Wer wo steht, entscheidet damit die Abfrage. **Wer mehrfach steht**, entscheidet
`boardAppearances` in `packages/domain/src/board.ts` — über `matchesPool`, dieselbe Funktion, die
das Add-in benutzt, um die Pools eines Todos zu benennen. Zwei Fassungen derselben Regel also:
eine in SQL, eine in TypeScript.

**Zugehörigkeit und Sichtbarkeit sind dabei zwei getrennte Fragen, in dieser Reihenfolge**
(T-076). Ob eine Karte in eine Spalte gehört, entscheidet die Regel; ob sie gezeigt wird,
entscheidet die Ansicht (`includeCompleted`, E-039). Die Sichtbarkeit als sechste Achse zu führen
wäre falsch, und zwar messbar: Eine Spalte **ohne** Regel bekäme dadurch die Bedingung „alle
unerledigten" und zeigte alles statt nichts. `boardAppearances` prüft deshalb erst `matchesPool`
und danach `isVisibleInPool` — mit derselben Ausblendung, unter der die Abfrage gelaufen ist.

**Sagt die Regel selbst etwas über „Erledigt", tritt die Ansichtseinstellung zurück.** Eine Spalte
`completion = 'done'` wäre unter der Vorgabe `includeCompleted = false` sonst immer leer, und die
zweite Bedingung hat der Benutzer nie für diese Spalte gesetzt, sondern für die Ansicht.

Das ist eine bewusste Wiederholung mit einem Grund. Die Mehrfachnennung aus den **geladenen
Seiten** zu zählen wäre falsch, sobald eine Spalte mehr Karten hat, als eine Seite fasst: Die
Karte stünde in Spalte A auf Seite 1 und in Spalte B auf Seite 2, und die Antwort behauptete, sie
stünde nur einmal da — derselbe Fehler wie beim Protokollknopf aus T-042, der gerade bei den
großen Läufen versagte. Über die Regel gerechnet, hängt die Antwort an keiner Seitengröße.

Damit die beiden Fassungen nicht auseinanderlaufen, wird ihre Übereinstimmung **gemessen**:
`pnpm proof:openapi`, Abschnitt 11, hält für jede Spalte die Menge, die die Abfrage geliefert hat,
gegen die Menge, die `matchesPool` auswählt, und wird rot, sobald sie sich unterscheiden.

Eine **leere Regel** trifft auch als Spalte nichts. Eine Spalte, die gerade eingerichtet wird,
zeigt nichts statt alles — dieselbe Antwort wie beim Pool, und in der Abfrage dieselbe Zeile
(`0 = 1` in `repo-todos.ts`).

### 4.4b Zwei Arten von Leere, und warum die zweite über die Leitung muss (T-080, E-057)

„Diese Spalte ist leer" hat zwei Ursachen, die sich für den Benutzer völlig verschieden anfühlen
und in den Daten fast gleich aussehen:

| | Woran man es erkennt | Wer es beheben kann |
|---|---|---|
| **Keine Bedingung genannt** | `poolRuleIsEmpty` über die fünf Achsen der Regel | nur der Benutzer, und zwar durch Ergänzen |
| **Bedingung zeigt ins Leere** | `resolved.unresolvedRequired`, benannt in `emptyRuleFolderIds` | nur der Benutzer, durch ein Tag im Ordner |
| **Regel trifft gerade nichts** | keines von beidem, `total = 0` | löst sich mit dem nächsten passenden Todo |

Die ersten beiden Zeilen sind zusammen `resolved.matchesNothing`: Die Abfrage liefert nichts, und
zwar unabhängig vom Bestand. Die dritte ist der Normalfall und geht vorbei.

Die erste Zeile beantwortet jeder selbst: `poolRuleIsEmpty` aus `packages/domain` liest genau die
Felder, die der Aufrufer ohnehin in der Hand hat. Sie ist deshalb **kein** Feld der Antwort — die
Oberfläche braucht sie auch für den Entwurf im Formular, den noch keine Route gesehen hat, und
ein Feld hätte nur den gespeicherten Stand beantwortet.

Die zweite kann nur der Dienst beantworten; die Auflösung steigt über den Ordnerbaum ab
(rekursive CTE, E-022). Sie steht deshalb als `resolved` an jeder ausgelieferten Regel:
`tagCount`, `excludedTagCount`, `isEmpty`, `unresolvedRequired`, `unresolvedExcluded`,
`emptyRuleFolderIds` und `matchesNothing`. Das Board zahlt dafür nichts — es löst jede Spalte für `boardAppearances`
ohnehin einmal auf —, `GET /pools` zwei Abfragen je Regel, und `pool` hält eine Handvoll Zeilen.

**Der Fall, der bis E-057 still war.** Ein Ordner ohne Tags löst sich zur leeren Tagmenge auf, und
eine leere Tagmenge war der **Neutralwert** dieser Achse — `matchesPool` übersprang sie, und die
Übersetzung nach SQL ließ sie aus dem `AND` heraus. Eine Regel „Tags aus diesem Ordner **und**
Status offen" war damit faktisch „Status offen": Sie traf **mehr** als beabsichtigt, nicht
weniger, und nichts an ihr sah danach aus.

Seit E-057 ist ein solcher Term eine **Einschränkung ohne Treffer**: Die Regel trifft nichts,
unabhängig vom Modus und von den übrigen Achsen. Entschieden wird das an genau einer Stelle
(`poolRuleMatchesNothing` in `packages/domain`); die Abfrage in SQL setzt für eine solche Regel
`0 = 1` und fragt dieselbe Funktion. `pnpm proof:openapi` Abschnitt 14 fährt beide Spalten an —
den leeren Ordner **neben** einer Statusachse und die Gegenprobe.

**Die Gegenrichtung gilt nicht.** Ausgeschlossene Tags über einen leeren Ordner schließen nichts
aus: „keiner davon" über nichts läßt in Ruhe, statt einzuengen. `unresolvedExcluded` steht
deshalb in der Antwort, wirkt aber auf keine Treffermenge.

**Gefragt wird termweise, nicht achsenweise.** Nennt eine Regel „Tag Support **oder** Ordner Ost"
und ist nur Ost leer, trifft sie trotzdem nichts — obwohl `tagCount` positiv ist. Achsenweise
gemessen bliebe der leere Ordner unsichtbar: Die Spalte zeigte die Support-Karten, niemandem fiele
auf, dass Ost leer ist, und sobald jemand einen Tag in Ost legt, änderte sich die Spalte ohne
ersichtlichen Grund — dieselbe Falle, nur verzögert. Das gilt **in beiden Modi**, auch bei
„mindestens eines davon".

Damit die Oberfläche **welcher** Ordner sagen kann und nicht nur **ein** Ordner, steht die Liste
der leeren erforderlichen Ordner in der Antwort: `resolved.emptyRuleFolderIds`. Die Auflösung
kennt nur der Dienst, und sie wird nirgends nachgebaut; die rekursive Abfrage trägt dafür die
Wurzel mit, von der sie ausgegangen ist — eine Abfrage, kein Aufruf je Ordner.

Ausgeschlossene Ordner stehen nicht in dieser Liste: Aus ihnen folgt keine Handlung.

---

## 5. Rundung auf Viertelstunden

Der wichtigste Einzelpunkt des Modells. A-8.3 nennt die Stufen, nicht die Regel dazwischen;
E-008 legt „aufwärts, Minimum 0,25" fest; R-03 hält fest, dass die beiden vom Auftraggeber
genannten Datenpunkte auch mit „kaufmännisch, nie unter 0,25" vereinbar sind, und verlangt eine
Gegenüberstellung vor Welle 3.

Die Regel lebt in `packages/domain/src/rounding.ts` und nirgends sonst. Weder `packages/export`
noch die Oberfläche noch das Add-in führen eine eigene Fassung.

**Eingabe der Rundung ist die Tagessumme je Todo, nicht die einzelne Buchung.** Siehe 5.5.

### 5.1 Die beiden Verfahren

```
Variante A — aufwärts (E-008, bestätigt am 2026-08-31)
    quarters = max(1, ceil(seconds / 900))

Variante B — kaufmännisch, nie unter 0,25 (Alternative aus R-03)
    quarters = max(1, floor(seconds / 900 + 0.5))

`seconds` ist die Summe der offenen Buchungen eines Todos an einem Kalendertag.
```

### 5.2 Beispieltabelle

Beide Spalten sind gerechnet, nicht abgeschrieben.

| Dauer | Sekunden | **A — aufwärts** | **B — kaufmännisch** | gleich? |
|---|---|---|---|---|
| 0:00 | 0 | nicht exportierbar | nicht exportierbar | ja |
| 1:00 | 60 | **0,25** | 0,25 | ja |
| 3:00 | 180 | **0,25** | 0,25 | ja |
| 7:30 | 450 | **0,25** | 0,25 | ja |
| 8:00 | 480 | **0,25** | 0,25 | ja |
| 15:00 | 900 | **0,25** | 0,25 | ja |
| 16:00 | 960 | **0,50** | 0,25 | **nein** |
| 22:00 | 1 320 | **0,50** | 0,25 | **nein** |
| 22:30 | 1 350 | **0,50** | 0,50 | ja |
| 23:00 | 1 380 | **0,50** | 0,50 | ja |
| 30:00 | 1 800 | **0,50** | 0,50 | ja |
| 45:00 | 2 700 | **0,75** | 0,75 | ja |
| 60:00 | 3 600 | **1,00** | 1,00 | ja |
| 61:00 | 3 660 | **1,25** | 1,00 | **nein** |
| 90:00 | 5 400 | **1,50** | 1,50 | ja |
| 458:00 | 27 480 | **7,75** | 7,75 | ja |
| **Summe** | | **16,00 h** | **15,25 h** | Differenz **0,75 h**, rund **4,9 %** |

Zwölf von sechzehn Werten stimmen überein. Der Unterschied entsteht im Bereich knapp oberhalb
einer Stufe: 16 Minuten und 61 Minuten. Über ein Arbeitsjahr mit vielen kurzen Buchungen summiert
sich das zu Geld — bei dieser Auswahl auf rund 5 Prozent des abgerechneten Volumens.

### 5.3 Entscheidung

**Variante A, aufwärts — vom Auftraggeber bestätigt am 2026-08-31. R-03 ist damit
geschlossen.** Sie ist die Vorgabe aus E-008, entspricht der branchenüblichen
Abrechnung von Dienstleistungen, deckt beide vom Auftraggeber genannten Datenpunkte, und ihre
Regel lässt sich in einem Satz erklären: *jede angefangene Viertelstunde zählt.* Variante B
braucht zwei Sätze und eine Erklärung des Kipppunkts bei 7:30, 22:30 und so fort.

Beide Verfahren sind umgesetzt und über `app_setting.rounding_mode` umschaltbar. Der beim Lauf
verwendete Modus wird in `export_run.rounding_mode` mitgeschrieben. Die Entscheidung ist damit
umkehrbar, ohne bereits erzeugte Abrechnungen unlesbar zu machen — bis der Auftraggeber
bestätigt hat, ist das der sicherere Zustand.

### 5.4 Die Randfälle, ausdrücklich

**Dauer 0.** Ergibt `null`, nicht 0,25. Eine Buchung ohne Dauer existiert fachlich nicht (E-008)
und wird von der Speicherung über `CHECK (duration_seconds >= 1)` abgewiesen. `null` ist der
Ausnahmezweig für Bestände, die auf anderem Weg entstanden sein könnten.

**Dauer unter 7 Minuten 30 Sekunden.** In beiden Verfahren 0,25, nie 0. Das ist die Untergrenze
aus E-008 und der Grund für die `max(1, …)`-Klammer. Ohne sie lieferte Variante B für drei
Minuten den Wert 0,00 und widerspräche der ausdrücklichen Aussage des Auftraggebers.

**Werte genau *auf* einer Stufe.** Bleiben auf dieser Stufe, sie werden nicht angehoben. 15
Minuten sind 0,25, nicht 0,50; 60 Minuten sind 1,00, nicht 1,25. `ceil` eines ganzzahligen
Vielfachen ist das Vielfache selbst. Die naheliegende Fehlimplementierung `floor(s/900) + 1`
verletzt das und ist in T-010 ausdrücklich zu prüfen. Gerechnete Nachbarwerte:

| Sekunden | 899 | **900** | 901 | 1 799 | **1 800** | 1 801 | 3 599 | **3 600** | 3 601 |
|---|---|---|---|---|---|---|---|---|---|
| A | 0,25 | **0,25** | 0,50 | 0,50 | **0,50** | 0,75 | 1,00 | **1,00** | 1,25 |
| B | 0,25 | **0,25** | 0,25 | 0,50 | **0,50** | 0,50 | 1,00 | **1,00** | 1,00 |

**Werte genau *zwischen* zwei Stufen.** Nur in Variante B überhaupt eine Frage; in Variante A
stellt sie sich nicht. In B wird zur größeren Stufe gerundet, also aufwärts: 7:30 → 0,25,
22:30 → 0,50, 37:30 → 0,75, 52:30 → 1,00. Damit ist der vom Auftraggeber genannte Datenpunkt
7:30 → 0,25 gedeckt.

### 5.5 Je Todo und Kalendertag, nicht je Buchung

Gerundet wird die **Tagessumme eines Todos**, nicht die einzelne Buchung. Erst addieren, dann
runden. Ergebnis ist genau eine Exportzeile je Todo und Kalendertag.

Vom Auftraggeber am 2026-08-31 entschieden; die Regel „je Buchung" aus T-001 ist damit abgelöst.

```
Todo „Kundenanruf", 2. März:  10 min + 20 min + 5 min = 35 min
                              ceil(2100 / 900) = 3 Viertel      ►  0,75
nicht:  0,25 + 0,50 + 0,25                                      ►  1,00
```

Vier Regeln gehören zwingend dazu:

1. **Nur offene Buchungen zählen.** Ist eine von drei Buchungen des Tages bereits exportiert,
   bleibt sie außen vor. Sonst ginge ihre Zeit ein zweites Mal in die Abrechnung (R-10). Die
   Sicht `v_export_candidate` filtert bereits auf `export_status = 'open'` und trägt das
   dadurch von selbst.
2. **Maßgeblich ist der Starttag.** Der Kalendertag folgt aus `started_at`. Eine Buchung von
   23:40 bis 00:20 zählt vollständig zum Starttag und wird nicht geteilt. `ended_at` geht nie in
   die Gruppierung ein.
3. **Die Leistungstexte werden nach Startzeit mit `'; '` verbunden**, leere Texte werden
   übersprungen. Das Trennzeichen steht als `ExportNoteSeparator` in
   `packages/domain/src/export.ts`, damit Vorschau und Datei es zwangsläufig teilen (R-17).
4. **Der Vermerk des Todos geht nicht ein.** Der zusammengeführte Text entsteht ausschließlich
   aus den Leistungen der Buchungen. Abschnitt 7 bindet das an den Übersetzer.

Die Gruppe ist der Typ `ExportGroup` in `packages/domain/src/export.ts`. Sie besteht aus
`todoId`, `day` und den zugehörigen `ExportCandidate`-Werten.

**Die Gruppierung läuft nicht in SQL.** Der frühere Entwurf sah so aus:

```sql
-- NICHT so. date() liefert den UTC-Tag, nicht den Ortstag (2.2).
SELECT todo_id, date(started_at) AS day, sum(duration_seconds) AS seconds
FROM v_export_candidate GROUP BY todo_id, date(started_at);
```

Das ist genau die Falle aus 2.2: SQLite kennt die Zeitzone des Arbeitsplatzes nicht, und
`date()` schneidet den UTC-Anteil ab. Eine Buchung um 00:30 Ortszeit landete in der Gruppe des
Vortags. Deshalb liest der Adapter die Kandidaten aus der Sicht und übergibt sie
`groupExportCandidates` in der Domäne, das über `toCalendarDay` in Ortszeit gruppiert. Für
Filter, die eine Tagesgrenze brauchen, gibt es `calendarDayBounds` — ebenfalls in der Domäne,
ebenfalls einmal.

Gemessener Plan: `SCAN te USING INDEX ix_time_entry_queue` — der partielle Index auf die offenen
Buchungen, kein Basistabellenscan. Gruppierung und Sortierung laufen über temporäre B-Bäume;
über die Größenordnung eines Exportlaufs ist das unerheblich. Ein zusätzlicher Index
`(todo_id, started_at) WHERE export_status = 'open'` ist inzwischen genau der Index
`ix_time_entry_queue`; die Gruppierung läuft darüber, ohne die Domäne anzufassen.

Die geschriebene Zeile wird als `export_run_group` festgehalten, die enthaltenen Buchungen als
`export_run_entry`. Der gerundete Wert hängt an der Gruppe und nirgends sonst — siehe 6.3.

### 5.6 Keine Gleitkommarechnung in der Domäne

Die Domäne rechnet ausschließlich in ganzen Sekunden und ganzen Viertelstunden. Der Exportwert
entsteht erst am Rand als `quarters / 4`.

Diese Division ist exakt: 1/4 hat eine Zweierpotenz im Nenner, also sind 0,25, 0,50, 0,75 und
jedes ganzzahlige Vielfache in IEEE-754 ohne Rundungsfehler darstellbar. Nachgerechnet für alle
Werte von 1 bis 2 000: kein einziger ungenau. Eine Summe über viele Buchungen driftet damit
nicht.

---

## 6. Exportstatus und sein Protokoll

### 6.1 Zwei Werte, zwei Übergänge

```
        ┌───────────────────────────────────────────┐
        │                                           │
        ▼          Exportlauf (A-8.8)               │
    ┌───────┐  ────────────────────────────►  ┌────────────┐
    │ offen │                                 │ exportiert │
    └───────┘  ◄────────────────────────────  └────────────┘
                  Zurücksetzen (E-012)
                  je Buchung, mit Begründung,
                  protokolliert
```

Nicht erreichbar:

- `exportiert` **von Hand** setzen. Nur ein Exportlauf löst diesen Übergang aus. Sonst gäbe es
  eine als abgerechnet markierte Buchung ohne Beleg, und A-6.6 — „jederzeit erkennbar, welche
  Zeiten übertragen wurden" — wäre nicht mehr wahr. Der Versuch endet mit `409` und
  `export_status_not_settable`.
- Ein Wechsel auf sich selbst. Endet mit `409` und `export_status_unchanged`.

Solange `exportiert` gilt, sind Start, Ende, Leistung, Todo-Zuordnung und das Löschen der
Buchung gesperrt (A-6.9). Nicht gesperrt ist der Exportstatus selbst — sonst wäre E-012 nicht umsetzbar.

### 6.2 Das Protokoll (R-10)

E-012 erlaubt, jede einzelne Buchung zurückzusetzen. Damit kann dieselbe Arbeitszeit ein zweites
Mal in die Abrechnung gelangen, versehentlich und ohne dass es jemandem auffällt. Das Protokoll
macht diesen Vorgang nachträglich auffindbar.

Tabelle `export_audit`, eine Zeile je Statuswechsel:

| Spalte | Inhalt |
|---|---|
| `time_entry_id` | Welche Buchung. `ON DELETE RESTRICT` — eine protokollierte Buchung ist nicht löschbar. |
| `event` | `exported`, `reset` oder `not_billed` (E-047). |
| `previous_status`, `new_status` | Beide Seiten des Wechsels. `CHECK (previous_status <> new_status)`. |
| `export_run_id` | Der auslösende Lauf. Gesetzt **genau dann**, wenn `event = 'exported'`, erzwungen über eine zusammengesetzte Bedingung. Beim Zurücksetzen bleibt sie leer, aber der zuvor eingetragene Lauf ist über die Vorgängerzeile derselben Buchung auffindbar. |
| `export_run_group_id` | Die Exportzeile, in der die Buchung stand. Gesetzt **genau dann**, wenn `event = 'exported'`. Über sie sind Tagessumme und gerundeter Wert der Zeile erreichbar. Es gibt bewusst kein `quarters` je Buchung — siehe 5.5 und 6.3. |
| `actor` | Windows-Benutzername (E-010). Keine freie Eingabe. |
| `reason` | Freitext aus dem Bestätigungsdialog. Beim Zurücksetzen erwartet, beim Ausbuchen freiwillig, sonst leer. |
| `occurred_at` | UTC. |

Zwei Trigger machen die Tabelle **anhängend und unveränderlich**: `BEFORE UPDATE` und
`BEFORE DELETE` brechen mit `RAISE(ABORT, 'append_only')` ab. Geprüft: beide Versuche scheitern.
Es gibt keine Route, die Protokollzeilen ändert oder löscht, und auch keinen Port dafür.

Statuswechsel und Protokollzeile entstehen in **derselben Transaktion**. Es gibt keinen
Statuswechsel ohne Protokollzeile — und seit T-041 auch keine Protokollzeile ohne Statuswechsel.

Die Gegenrichtung war nämlich offen, und sie ist die schlimmere Hälfte: Ein Protokoll, das etwas
bezeugt, das nicht geschehen ist, beantwortet die eine Frage falsch, für die man es führt.
Zurückgesetzt wird jetzt über einen **Sicherungspunkt** um beide Anweisungen (`repo-export.ts`);
scheitert die zweite oder trifft ihr `UPDATE` keine Zeile, wird die erste zurückgenommen, ohne
dass die äußere Transaktion endet. Der auslösende Fall — der Trigger aus 4.4 in Verbindung mit
nicht sortierbaren Kennungen — steht in 2.1 und in architektur.md 3.3a.

**Filtern.** `GET /export/audit` nimmt seit T-042 `timeEntryId` **und** `exportRunId` entgegen,
beide einzeln oder zusammen. Der zweite beantwortet „welche Buchungen waren in diesem Lauf?"
vollständig. Vorher gab es die Frage nur als Sieb über die gerade geladene Seite — und ein Lauf
mit mehr Buchungen, als eine Seite fasst, verdrängt jeden älteren daraus, sodass die Antwort
gerade bei den großen Läufen leer blieb.

**Der dritte Ereignistyp: `not_billed` (E-047).** „Nicht abrechnen" ist kein Export. Die Buchung
bekommt den Status `exported` — zweiwertig bleibt zweiwertig (E-032) —, aber im Protokoll steht,
was tatsächlich geschah. Der zusammengesetzte CHECK der Tabelle führt seit Migration 0006 drei
Zweige und erzwingt die Unterscheidung:

| `event` | `export_run_id`, `export_run_group_id` | `new_status` |
|---|---|---|
| `exported` | beide gesetzt | `exported` |
| `reset` | beide leer | `open` |
| `not_billed` | beide leer | `exported` |

Eine Ausbuchung ist damit an ihrer Belegfreiheit erkennbar und nicht nur am Namen. Die Auswertung,
für die man ein solches Protokoll führt, ist ein Filter auf einen Wert:

```sql
SELECT count(*) AS ausgebucht, sum(te.duration_seconds) AS sekunden
FROM export_audit a JOIN time_entry te ON te.id = a.time_entry_id
WHERE a.event = 'not_billed';
```

Hätte die Ausbuchung `event = 'exported'` benutzt, wäre genau diese Frage nicht mehr
beantwortbar — und das Protokoll führte einen Beleg, den es nie gab.

Die vollständige Geschichte einer Buchung:

```sql
SELECT a.event, a.previous_status, a.new_status, a.actor, a.reason, a.occurred_at,
       g.day, g.seconds AS gruppensekunden, g.quarters AS gruppenviertel
FROM export_audit a
LEFT JOIN export_run_group g ON g.id = a.export_run_group_id
WHERE a.time_entry_id = :id ORDER BY a.occurred_at;
```

Alle Buchungen, die zurückgesetzt und danach erneut exportiert wurden — also die tatsächlichen
Doppelabrechnungen:

```sql
SELECT time_entry_id, count(*) AS laeufe
FROM export_audit WHERE event = 'exported'
GROUP BY time_entry_id HAVING count(*) > 1;
```

Für die Oberfläche genügt der schnellere Weg: `export_count > 0 AND export_status = 'open'`
bedeutet „schon einmal exportiert, danach zurückgesetzt". Ein Teilindex bedient das direkt.

**Zurücksetzen verändert eine ganze Tagesgruppe.** Seit der Gruppierung aus 5.5 wirkt sich eine
zurückgesetzte Buchung nicht nur auf sich selbst aus: Sie kehrt beim nächsten Lauf in die
Tagesgruppe ihres Todos zurück und verschiebt deren gerundete Summe. Aus 0,50 können 0,75 werden,
und der Zuwachs ist größer oder kleiner als der Wert, mit dem die Buchung ursprünglich exportiert
wurde. Das Protokoll hält den ursprünglichen Wert in `quarters` fest und macht die Differenz damit
nachrechenbar; welchen Wert es nach der Gruppierung genau führen soll, ist Teil der offenen Frage
aus 5.5.

### 6.3 Der gerundete Wert gehört der Zeile, nicht der Buchung

Seit der Tagesrundung aus 5.5 entsteht der gerundete Wert je Gruppe. Ihn auf die enthaltenen
Buchungen zu verteilen wäre willkürlich: Bei 10, 20 und 5 Minuten in einer Gruppe von 0,75 gibt
es keine Aufteilung in drei ganze Viertelstunden, die sich zu 0,75 summiert — nur mehrere
falsche. Eine willkürliche Aufteilung würde genau das Protokoll verfälschen, das R-10
nachvollziehbar halten soll.

Deshalb drei Tabellen statt zwei:

```
export_run          eine Datei
   └── export_run_group    eine Zeile in der Datei: ein Todo an einem Kalendertag
          │                seconds  = ungerundete Tagessumme
          │                quarters = gerundeter Wert, der in die Abrechnung ging
          └── export_run_entry     welche Buchung in die Zeile einging
                                   duration_seconds = ungerundete Dauer der Buchung,
                                   nicht ihr Anteil an quarters
```

`export_audit` führt kein `quarters` mehr, sondern `export_run_group_id`. Beide Verweise —
`export_run_id` und `export_run_group_id` — sind gesetzt genau dann, wenn `event = 'exported'`,
erzwungen über eine zusammengesetzte Bedingung.

**Der Fall, an dem sich zeigt, ob die Kennung trägt:** Eine Buchung wird aus einer bereits
exportierten Gruppe zurückgesetzt und später in einer anderen Gruppe erneut exportiert.

Todo *T*, Kalendertag *D*, drei Buchungen `e1` (10 min), `e2` (20 min), `e3` (5 min).

| Schritt | Was entsteht |
|---|---|
| Lauf **R1** exportiert alle drei | `export_run_group` **G1** = (R1, T, D, seconds 2 100, quarters 3). Drei `export_run_entry` mit 600 / 1 200 / 300 Sekunden. Drei Protokollzeilen `exported` mit `export_run_group_id = G1`. |
| `e2` wird zurückgesetzt (E-012) | Eine Protokollzeile `reset` für `e2`, beide Verweise `NULL`, `new_status = 'open'`. G1 bleibt unverändert — die Tabelle ist anhängend. |
| Lauf **R2** exportiert `e2` erneut | `export_run_group` **G2** = (R2, T, D, seconds 1 200, quarters 2). Ein `export_run_entry` mit 1 200 Sekunden. Eine Protokollzeile `exported` für `e2` mit `export_run_group_id = G2`. |

Was danach beantwortbar ist, und das war der Punkt:

- **Mit welchem Wert ging die Zeile hinaus, in der `e2` stand?** Erst 0,75 (G1), dann 0,50 (G2).
  Über `export_audit.export_run_group_id` je Protokollzeile, ohne Rätselraten.
- **Welche Buchungen gehörten zu welcher Zeile?** `export_run_entry` je Gruppe. G1 hatte drei,
  G2 hatte eine.
- **Wieviel wurde für Todo *T* am Tag *D* insgesamt abgerechnet?** `sum(quarters)` über alle
  Gruppen mit `todo_id = T AND day = D` — hier 3 + 2 = 5 Viertel, also 1,25 Stunden.
- **Wieviel Arbeit steht tatsächlich dahinter?** 2 100 Sekunden, gerundet 3 Viertel, also 0,75
  Stunden. Die Differenz von 0,50 Stunden ist die Doppelabrechnung, und sie ist **gerechnet**,
  nicht geschätzt.

```sql
-- Was für ein Todo an einem Tag abgerechnet wurde, über alle Läufe
SELECT day, sum(quarters) AS abgerechnet, max(seconds) AS hoechste_tagessumme
FROM export_run_group WHERE todo_id = :todo AND day = :tag GROUP BY day;
```

Hätte `export_run_entry` weiterhin ein `quarters` je Buchung geführt, stünde dort für `e2` ein
erfundener Anteil, und die Summe über die Buchungen wäre weder die Summe der Zeilen noch die
geleistete Zeit. Der Verweis auf die Gruppe erfindet nichts.

`export_run.entry_count` zählt weiterhin die **Buchungen** eines Laufs, `total_quarters` ist die
Summe über die **Zeilen**. Die Zahl der Zeilen steht nicht eigens in `export_run`, weil sie sich
als `count(*)` über `export_run_group` ergibt.

---

## 7. Die Notiz-Trennung, strukturell

A-7.2 ist eine Datenschutzgrenze: Der interne Vermerk eines Todos darf in keinem Exportergebnis
auftauchen. R-06 hält fest, dass diese Grenze nur so stark ist wie ihre Prüfung, sobald der
Benutzer Feldquellen frei wählen kann.

Benennung nach E-016: Auf dem Bildschirm heißt das interne Feld **Vermerk**, das exportierte
**Leistung**. Im Code tragen beide den Namen ihrer Spalte — `todo_note.body` und
`time_entry.note`.

Vier voneinander unabhängige Schichten. Keine davon ist eine Vereinbarung.

**Erstens: eigene Tabelle.** Der Vermerk steht in `todo_note`, nicht als Spalte auf `todo`. Kein
`SELECT * FROM todo` nimmt ihn mit, kein Join über `todo` erreicht ihn beiläufig. Wer ihn will,
muss `todo_note` beim Namen nennen — und das ist im Quelltext auffindbar.

**Zweitens: eine Sicht ohne die Spalte.** Der Exportpfad liest ausschließlich
`v_export_candidate`:

```sql
CREATE VIEW v_export_candidate AS
SELECT te.id AS time_entry_id, te.todo_id, te.started_at, te.ended_at,
       te.duration_seconds, te.note AS booking_note, te.export_count,
       t.title AS todo_title, t.call_number AS todo_call_number
FROM time_entry te JOIN todo t ON t.id = te.todo_id
WHERE te.export_status = 'open' AND te.ended_at IS NOT NULL;
```

`todo_note` kommt darin nicht vor. Geprüft: `SELECT note FROM v_export_candidate` scheitert mit
`no such column`. Auch eine später von Hand ergänzte Abfrage im Exportpfad greift ins Leere.

**Seit T-021 ist das gemessen und nicht nur beschrieben.** Der Adapter liest für den Export
ausschließlich diese Sicht (`createExportReadPort`), und `proof-export.mjs` legt ein Todo mit dem
Vermerk „Interner Vermerk — darf nie in den Export" an, exportiert es und durchsucht danach die
**geschriebene Datei** — einschließlich des base64-kodierten Feldes `Notiz`, rückwärts dekodiert.
Der Text kommt dort nicht vor. `proof-addin-wiring.mjs` prüft dasselbe auf der Add-in-Fläche:
Der über das Add-in eingegebene Vermerk ist über `/todos/{id}/note` lesbar und steht weder in
`/addin/context` noch im Duplikatangebot.

Eine Ergänzung, die T-021 nötig gemacht hat: `TodoPort.create` **schreibt** den Vermerk mit, wenn
`TodoCreate.note` gesetzt ist. Vorher fiel er stillschweigend weg — der aus einer E-Mail
übernommene Text (B-12.3) verschwand, und es fiel erst auf, als der Prüfpfad danach suchte. Das
schwächt die Grenze nicht: Sie ist eine Grenze auf der **Leseseite**, und es gibt weiterhin genau
einen Weg, den Vermerk zu lesen.

**Drittens: kein Typ, der ihn tragen könnte.** `packages/export` importiert nur aus
`@takt/domain/export`, und dieser Einstiegspunkt gibt weder `Todo` noch `TodoNote` heraus. Die
einzigen Datentypen dort sind `ExportCandidate` — eine offene Buchung — und `ExportGroup`, die
Tagesgruppe darüber. Keiner von beiden hat ein Feld für den Vermerk und keinen Verweis, über den
man ihn nachladen könnte. Der Exportmotor bekommt auch keine Ports, sondern fertige Werte; er hat
gar keinen Zugang zur Datenbank.

**Viertens: eine abschließende Liste erlaubter Quellenpfade und sieben Zusicherungen, alle an den
Übersetzer gebunden.**

`booking.*` ist mit E-033 entfernt und nicht umgedeutet worden: Seit E-020 erzeugt die
Tagesgruppe die Exportzeile, und ein Pfad, der weiterhin `booking` hieße, meinte etwas anderes,
als sein Name sagt. Ein entfernter Name bricht sichtbar, ein umgedeuteter bricht still und erst
in der Abrechnung. Die Leistung heißt `group.bookingNotes` und nicht `group.note` — auf einer
Auswahlliste im Vorlageneditor wäre „Notiz" ohne Zusatz genau die Verwechslung aus R-08.

```typescript
export type ExportSourcePath =
  | 'todo.callNumber' | 'todo.title' | 'todo.tags'
  | 'group.day' | 'group.quarters' | 'group.durationSeconds'
  | 'group.bookingNotes' | 'group.startedAt' | 'group.endedAt' | 'group.entryCount'
  | 'system.windowsUser' | 'system.exportedAt';

type Assert<T extends true> = T;

export type NoteBoundaryIsSealed = Assert<
  Extract<ExportSourcePath, `todo.note${string}` | `todo.notiz${string}`> extends never
    ? true : false
>;

/** Kein Quellenpfad heißt schlicht „Notiz" — auf keiner Ebene. */
export type NoSourceIsCalledPlainNote = Assert<
  Extract<ExportSourcePath, `${string}.note` | `${string}.notiz` | `${string}.vermerk`>
    extends never ? true : false
>;

/** `booking.*` ist fort und bleibt fort (E-033). */
export type BookingSourcesAreGone = Assert<
  Extract<ExportSourcePath, `booking.${string}`> extends never ? true : false
>;

type ForbiddenNoteKey =
  | 'note' | 'notiz' | 'vermerk' | 'todoNote' | 'todoNotiz' | 'todoVermerk';

export type ExportCandidateHasNoTodoNote = Assert<
  Extract<keyof ExportCandidate, ForbiddenNoteKey> extends never ? true : false>;

export type ExportGroupHasNoTodoNote = Assert<
  Extract<keyof ExportGroup, ForbiddenNoteKey> extends never ? true : false>;
```

Nimmt jemand `'todo.note'` in die Liste auf, ist `Extract<…>` nicht mehr `never`, der bedingte
Typ liefert `false`, und `Assert<false>` verletzt seine Randbedingung. Dasselbe geschieht, sobald
jemand `ExportCandidate` oder `ExportGroup` um ein Feld mit einem der gesperrten Namen erweitert.

**In T-013 einzeln nachgeprüft**, mit versuchsweise eingefügten Feldern und anschließend
zurückgenommen:

| Probe | Ergebnis |
|---|---|
| `'todo.note'` in `ExportSourcePath` | `TS2344` in `NoteBoundaryIsSealed` **und** in `TodoSourcesAreCovered` |
| Feld `todoNote` an `ExportGroup` | `TS2344` in `ExportGroupHasNoTodoNote` |
| Feld `vermerk` an `ExportCandidate` | `TS2344` in `ExportCandidateHasNoTodoNote` |
| unverändert | Exitcode 0 |

`pnpm typecheck` schlägt damit fehl, bevor irgendein Test läuft. Die Gruppierung aus 5.5 macht
diese Schicht wichtiger als zuvor: `ExportGroup` ist die naheliegendste Stelle, an der jemand
„den Kontext des Todos" anreichern und dabei den Vermerk mitnehmen würde. Eine weitere
Zusicherung, `TodoSourcesAreCovered`, stellt sicher, dass jeder `todo.`-Pfad ein Feld von
`ExportCandidate` trifft — so kann die Liste nicht um einen Pfad wachsen, für den der Wert
anderswo nachgeladen werden müsste.

**Frist und Anhänge stehen unter derselben Sperre** (A-19.17, A-19.19, seit T-146). `due_date`,
`todo_attachment` und `todo_attachment_kind` haben keinen Pfad in `ExportSourcePath` — die Liste
ist bei zwölf Werten geblieben — und `ExportCandidate` und `ExportGroup` tragen kein Feld dafür.
Das ist derselbe Schutz und aus demselben Grund am selben Ort: Der **Typ** trägt die Grenze, nicht
eine Filterliste, die jemand beim nächsten Feld zu ergänzen vergisst. Ein Anhang ist außerdem
strukturell schwerer als ein Vermerk — ein Dateipfad in einer Abrechnungsdatei verriete, wo der
Benutzer seine Unterlagen hält.

---

## 8. Migrationsverfahren

### 8.1 Aufbau

Zwei SQL-Dateien je Migration, gleiche Nummer:

```
packages/storage/migrations/
  0001_initial.up.sql          Schema
  0001_initial.down.sql
  0002_seed_defaults.up.sql    Daten
  0002_seed_defaults.down.sql
  …
  0006_not_billed_audit_event.up.sql    Schema: „nicht abrechnen" (E-047)
  0006_not_billed_audit_event.down.sql
```

Schema- und Datenmigrationen sind getrennt. 0001 legt Tabellen an, 0002 die vier Beispielspalten
aus A-5.3, die Einstellungszeile und die Standard-Exportvorlage aus A-8.2 bis A-8.5. Eine
Vermischung wäre schwerer zurückzunehmen und schwerer zu prüfen.

Stand in `schema_migration (version, name, checksum, applied_at)`. `checksum` ist SHA-256 über
die Vorwärtsdatei und erkennt nachträglich veränderte, bereits gelaufene Migrationen. Eine
ausgelieferte Migration wird nicht mehr bearbeitet; Korrekturen bekommen eine neue Nummer.

### 8.2 Ablauf je Schritt

```
PRAGMA foreign_keys = ON      (bzw. OFF für Tabellenumbauten — vor BEGIN, wirkt sonst nicht)
BEGIN
  <Inhalt der .sql-Datei>
  PRAGMA foreign_key_check    -> nicht leer ⇒ Abbruch
  INSERT INTO schema_migration ...
COMMIT
```

Die Gegenprobe auf Fremdschlüssel führt seit T-029 der Läufer selbst aus, nach dem letzten Befehl
der Datei und vor dem Festschreiben — vorher war sie hier beschrieben, aber nirgends umgesetzt.
Sie prüft den ganzen Bestand; auf einer lokalen Datei kostet das nichts, und sie ist die einzige
Prüfung, die einen Umbau mit ruhender Fremdschlüsselprüfung noch abfangen kann.

**Der Schalter für einen Tabellenumbau.** SQLite kennt kein `ALTER TABLE` für einen CHECK. Eine
Tabelle mit Kindern lässt sich nur umbauen, wenn die Fremdschlüsselprüfung währenddessen ruht:
Sonst scheitert das `DROP` am `ON DELETE RESTRICT` der Kinder, und ein `RENAME` zieht deren
`REFERENCES`-Klauseln auf die weggeworfene Tabelle mit. Eine Migration, die das braucht, sagt es
in ihrer zweiten Zeile:

```sql
-- takt: foreign_keys=off
```

Der Läufer setzt dann `PRAGMA foreign_keys = OFF` **vor** `BEGIN` (innerhalb einer Transaktion ist
das Pragma wirkungslos) und schaltet danach wieder ein. Abgeschaltet wird damit nicht die Prüfung,
sondern ihr Zeitpunkt: Die Gegenprobe oben läuft trotzdem. Bisher nutzt das genau eine Migration,
0006. Dieselbe Datei setzt das Pragma zusätzlich in ihrem eigenen Text, weil sie auch außerhalb
des Läufers eingespielt wird — von den Prüfpfaden, die das Schema selbst untersuchen.

Bei einer Ausnahme: `ROLLBACK`. **SQLite führt auch DDL transaktional aus**, anders als etwa
MySQL — geprüft: ein `CREATE TABLE` innerhalb einer zurückgerollten Transaktion hinterlässt
nichts. Eine mittendrin abgebrochene Migration lässt also kein halb angelegtes Schema zurück.

**Pragmas rollt `ROLLBACK` allerdings nicht zurück.** Ein Pragma ist eine Einstellung der
Verbindung und nicht Teil der Transaktion. Der Läufer stellt deshalb seit T-101 **beide** Schalter
in einem `finally` wieder her: `foreign_keys` (schon vorher) und `legacy_alter_table` (R-3a H-4).
Den zweiten setzen sechs Migrationsdateien selbst — sie brauchen ihn, damit ein `RENAME` die
`REFERENCES`-Klauseln der Nachbartabellen **nicht** nachzieht — und schalten ihn in ihrer letzten
Zeile zurück. Wirft eine Migration davor, wird diese Zeile nie erreicht, und die Verbindung liefe
mit einer Einstellung weiter, die niemand mehr gesetzt hat. Heute folgenlos, weil ein Fehlschlag
den Start beendet; die Begründung für `foreign_keys` gilt trotzdem Wort für Wort.

### 8.3 Vorwärts

Beim Start ermittelt der Läufer den Stand und wendet fehlende Migrationen der Reihe nach an.
**Vorher legt er eine Kopie der Datenbankdatei an** (`takt.db.bak-<version>`, über die
Sicherungsfunktion der SQLite-Anbindung, nicht als Dateikopie im laufenden Betrieb). Das ist der
eigentliche Rückweg auf einem benutzten Bestand: Eine Rückwärtsmigration kann Spalten und damit
Daten verlieren, eine Kopie nicht.

**Schutz gegen Herabstufung:** Ist der Bestand neuer als die mitgelieferten Migrationen, startet
die Anwendung **nicht**. Das passiert, wenn eine ältere Fassung von Takt eine bereits migrierte
Datei öffnet. Auf einem lokal installierten Programm ist das kein Randfall, sondern der Normalweg
nach einer zurückgenommenen Aktualisierung — und ein stiller Betrieb auf einem unbekannten Schema
wäre die schlechteste aller Antworten.

Diese Prüfung läuft **vor** der Prüfsummenprüfung, und die Reihenfolge ist fachlich (T-029): Ein
zu neuer Bestand führt zwangsläufig Zeilen, zu denen die ältere Fassung keine Datei hat — die
Prüfsummenprüfung würde ihn also als „nachträglich verändert" melden. Das ist dieselbe
Beobachtung mit der falschen Erklärung: Die eine Meldung schickt den Benutzer zur Datensicherung,
die richtige zum Aktualisieren. Erst wenn der Bestand **nicht** neuer ist, ist eine unbekannte
oder abweichende Zeile tatsächlich eine geänderte Migrationsdatei.

### 8.2a Der Fehlschlag nennt seinen Grund — pfadfrei (T-132)

Am 2026-09-04 um 18:57 startete Takt nicht. Im Protokoll stand genau eine Zeile: „Der
Datenbestand konnte nicht auf den Stand dieser Fassung gebracht werden. Takt startet nicht."
Ein zweiter Anlauf lief durch, und der Grund war für immer weg — der Startpfad fing den Wurf mit
`catch {` ohne Bindung ab und sah den Fehlerwert nie an. Die Begründung dafür stand daneben: Der
Grund könne einen Dateipfad enthalten, und B-2.4 verbiete das.

Der Satz ist richtig, die Schlussfolgerung war es nicht. **B-2.4 verbietet den Pfad, nicht den
Grund.** Ein Grund lässt sich so bauen, dass er gar keinen Pfad tragen kann.

Der Läufer hängt deshalb an jeden Wurf einen **Wert** mit benannten Feldern
(`MigrationFailureReason` in `packages/storage/src/migration.ts`). Jeder Zweig trägt genau das,
was ihn vom Nachbarn unterscheidet:

| Grund | Trägt | Bedeutet |
|---|---|---|
| `checksum_mismatch` | Fassung | Eine bereits gelaufene Migrationsdatei sieht heute anders aus |
| `database_too_new` | Fassung des Bestands, höchste bekannte | Eine ältere Fassung von Takt öffnet einen migrierten Bestand |
| `database_busy` | Ergebniskennzeichen von SQLite | Ein zweiter Zugriff hält den Bestand (SQLITE_BUSY, SQLITE_LOCKED) |
| `state_unreadable` | Fehlerschlüssel, Ergebniskennzeichen | Der Stand ließ sich nicht lesen; geschrieben wurde nichts |
| `backup_failed` | Ausgangsfassung, Fehlerschlüssel | Die Sicherungskopie entstand nicht; **es wurde nicht migriert** |
| `migration_failed` | Fassung, Richtung, Fehlerschlüssel | Eine einzelne Migration ist gescheitert; ihre Transaktion ist zurückgenommen |
| `no_way_back` | Fassung | Rückwärts: zu einer gelaufenen Migration gibt es keine Datei mehr |
| `embedded_drift` | — | Die eingebetteten Migrationen weichen vom Verzeichnis ab (T-053) |
| `unknown` | Fehlerschlüssel, Ergebniskennzeichen | Etwas anderes |

**Drei Riegel halten den Pfad draußen**, und keiner davon ist Sorgfalt:

1. Der Grund ist ein Wert und keine Meldung. Seine Felder sind Zahlen und ein Fehlerschlüssel der
   Laufzeit (`ENOENT`, `ERR_SQLITE_ERROR`), den `errorCodeOf` auf Großbuchstaben, Ziffern und
   Unterstrich begrenzt.
2. Die Sätze, die der Benutzer liest, sind Konstanten (`apps/local-api/src/startup.ts`). In
   keinen wird etwas eingesetzt.
3. Der Protokollierer weist einen Grund ab, der nicht in seinen Zeichenvorrat passt, und schreibt
   `unclassified` — ein Pfad enthält zwangsläufig einen Trenner und kommt dort nicht durch.

Die **Meldung** des zugrunde liegenden Wurfs bleibt im Wurf. Sie ist im Debugger lesbar und geht
in keine Ausgabe. Deshalb konnten die Prüffälle, die auf `RAISE(ABORT, 'rollback_0006_…')`
messen, unverändert bleiben.

Gemessen wird beides: die Unterscheidung über den vollständigen Vorrat der Gründe in den
Einheitentests, und die ganze Kette — echter Bestand, echter Läufer, echter Sidecar, echtes
`stderr` — in `proof:access` Abschnitt 0g.

### 8.4 Rückwärts

Jede Migration hat ihre Gegenrichtung. 0001 löscht in umgekehrter Abhängigkeitsreihenfolge: erst
die Sicht, dann die Trigger, dann die Tabellen von den Blättern zur Wurzel.

Bei Datenmigrationen gibt es eine Einschränkung, die ausdrücklich benannt gehört: **Eine
Datenmigration ist nur so lange rücknehmbar, wie niemand auf die von ihr angelegten Zeilen
verweist.** Liegt ein Todo in einer der vier Beispielspalten oder hat ein Exportlauf die
Standardvorlage benutzt, wäre die Rücknahme verlustbehaftet.

Statt daran mit einem rohen Fremdschlüsselfehler zu scheitern oder — schlimmer — stillschweigend
nur teilweise zu wirken, bricht 0002 ausdrücklich ab. Der Wächter ist reines SQL:

```sql
CREATE TEMP TABLE _rollback_0002_guard (
  ok INTEGER NOT NULL
    CONSTRAINT rollback_0002_only_without_user_data CHECK (ok = 1)
);
INSERT INTO _rollback_0002_guard (ok)
SELECT CASE WHEN (SELECT count(*) FROM todo) = 0
             AND (SELECT count(*) FROM export_run) = 0 THEN 1 ELSE 0 END;
DROP TABLE _rollback_0002_guard;
```

Die benannte Bedingung erzeugt die sprechende Meldung
`CHECK constraint failed: rollback_0002_only_without_user_data`, und die umschließende
Transaktion rollt alles zurück.

### 8.4a Was **keine** Migration bekommt: alte Exportvorlagen (T-046)

Seit T-034 prüft `validateExportTemplateDefinition` auch die **Feldnamen** einer Exportvorlage.
Eine Vorlage, die vorher gespeichert wurde und einen heute unzulässigen Namen trägt, bricht den
Exportlauf ab. Keine Migration fasst `export_template.definition` an, und das bleibt so. Drei
Gründe, in der Reihenfolge ihres Gewichts:

1. **Eine Migration müsste die Regel ein siebtes Mal führen — in SQL.** Die Feldnamensregel
   steht in `packages/export/src/template.ts`. In einer Migration nachzubauen hieße, sie in einer
   Sprache zu wiederholen, in der keine Typprüfung sie mit dem Original abgleicht. Genau diese
   Bauart hat diesem Bestand sechs Doppelungen eingebracht — Rundung, Plausibilisierung,
   Zustandsform, Kalendertag in der Oberfläche, Quellenliste und zuletzt die Tagesgrenze in SQL
   (2.2). Die siebte freiwillig anzulegen, um ein Risiko ohne Betroffene zu schließen, wäre der
   schlechtere Tausch.
2. **Eine abbrechende Migration wäre eine Sackgasse.** Sie liefe vor dem Start des Dienstes.
   Wer eine unzulässige Vorlage hätte, käme nicht mehr in die Anwendung, um sie zu ändern — und
   eine Migration, die den Namen stillschweigend zurechtbiegt, änderte eine
   abrechnungsrelevante Vorlage ohne Zutun ihres Besitzers. Beides ist schlimmer als der
   jetzige Zustand.
3. **Der jetzige Zustand ist gemessen und sicher.** `proof:template-fields` schmuggelt eine
   Vorlage mit unzulässigem Feldnamen an jeder Prüfung vorbei in die Datenbank und weist nach:
   Vorschau und Lauf brechen ab, es entsteht **keine** Datei, **keine** Buchung wird markiert —
   und seit T-046 nennt der Lauf dieselbe Feldangabe wie die Vorschau. Der Benutzer sieht, welches
   Feld gemeint ist, und kann es im Vorlageneditor ändern. Genau so verhält sich eine vor T-034
   gespeicherte Vorlage.

Dazu die Tatsache, die den Fall heute klein macht und ihn morgen nicht kleiner machen darf:
**Takt ist nie ausgeliefert worden.** Es gibt keinen Bestand außerhalb dieses Arbeitsbereichs.
Die einzigen Definitionen, die eine Migration je geschrieben hat, sind die der Standardvorlage
(0002, 0004, 0005), und dass sie die verschärfte Prüfung besteht, ist in
`proof:template-fields` Abschnitt 1 nachgewiesen.

**Was daraus folgt, wenn das „nie ausgeliefert" fällt:** Vor der ersten Auslieferung ist dieser
Absatz erneut anzusehen. Dann gibt es Bestände, dann ist der Fall nicht mehr hypothetisch, und
dann ist die richtige Antwort vermutlich nicht eine Migration, sondern eine Prüfung **beim
Start**, die alle gespeicherten Definitionen durchgeht und das Ergebnis als Meldung anbietet —
ohne den Start zu verhindern. Das lässt sich beheben, eine abbrechende Migration nicht.

### 8.4b Migration 0007 — eine Prüfung der Datenbank hängt nicht an der Anwendung (T-047)

`0007_audit_order_by_rowid` tauscht in `trg_time_entry_exported_needs_provenance` eine einzige
Bedingung: `ORDER BY occurred_at DESC, id DESC` wird zu `ORDER BY occurred_at DESC, rowid DESC`.
Die Begründung steht in 3.4; hier steht, was das Verfahren angeht.

* **Verlustfrei in beide Richtungen.** Es wird keine Zeile angefasst und keine Tabelle umgebaut.
  Die Rückwärtsdatei stellt den Wortlaut aus 0006 wieder her; sie holt den Wettlauf zurück und
  sonst nichts. Gemessen: 0 → 7, 7 → 6, 6 → 7, 7 → 0, 0 → 7.
* **Sie zwingt niemanden zu einer zweiten Fassung einer Regel.** Das ist der Unterschied zu dem
  Fall in 8.4a, in dem eine Migration ausdrücklich unterbleibt: Dort müsste SQL eine
  TypeScript-Regel nachbauen, hier tauscht SQL eine SQL-Bedingung gegen eine bessere SQL-Bedingung.
* **Ein `VACUUM` darf `rowid` neu vergeben**, wenn eine Tabelle kein explizites
  `INTEGER PRIMARY KEY` hat — `export_audit` hat keines. Es vergibt sie in der bestehenden
  Ordnung, die Reihenfolge bleibt also erhalten; und der Läufer benutzt ohnehin nur
  `VACUUM INTO`, das eine Kopie schreibt und den laufenden Bestand nicht anfasst (8.3).

**Ein Nebenbefund des Einspielens, der nicht 0007 gehört, sondern dem Läufer.** `migrateDownTo`
fährt jede Migration in einer **eigenen** Transaktion. Scheitert der Abstieg unterwegs — und 0006
scheitert absichtlich, solange eine `not_billed`-Zeile existiert (8.4) —, dann bleibt der Bestand
auf der Fassung stehen, die zuletzt gelungen ist, und nicht auf der, von der er ausging. Ein
Abstieg von 7 nach 5 endet also auf 6. Das ist kein halber Zustand: 6 ist eine vollständige
Schemafassung, und jeder einzelne Schritt ist für sich atomar. Es ist aber ein anderer Zustand
als der erwartete, und es steht hier, weil es beim nächsten mehrstufigen Rückweg wieder auffällt.
Der Rückweg auf einem benutzten Bestand bleibt die Sicherungskopie (8.3).

### 8.4c Migration 0008 — eine Spalte, die die Anwendung füllt (T-058)

`0008_tag_name_key` hängt `tag.name_key` an, füllt es für den Bestand, legt zwei Indizes und zwei
Trigger an. Drei Punkte daran gehören ins Verfahren und nicht in die Tabellenbeschreibung.

**Sie rechnet, was sonst nur TypeScript rechnet.** Das ist genau der Fall, den 8.4a ausschließt —
eine Migration, die eine Regel aus der Domäne in SQL nachbaut. Hier ist er trotzdem richtig, und
der Unterschied ist beweisbar: In 8.4a müsste SQL eine Regel nachbauen, die sich weiterentwickelt
(Exportvorlagen, deren Feldliste sich mit jeder neuen Quelle ändert). Hier baut SQL eine
**geschlossene Aufzählung** nach, die genau deshalb geschlossen ist, damit beide Fassungen gleich
sein können — und `proof:tags` Abschnitt 1 misst die Gleichheit über dreißig Namen, statt sie
zuzusichern. Was die Migration nicht kann, steht in ihrem Kopf: Unicode-Zusammensetzung (NFC).

**Sie bricht bei bestehenden Doppelten nicht ab.** Ein Bestand von vor 0008 kann „ backend" und
„Backend" nebeneinander führen; unter dem neuen Schlüssel sind das zwei gleiche, und der
eindeutige Index ließe sich nicht anlegen. Statt abzubrechen bekommt jedes weitere Tag mit
demselben Schlüssel ein „ (2)", „ (3)" … an den Namen. Verlustfrei, sichtbar, vom Benutzer zu
bereinigen. Zusammenführen wäre die Alternative gewesen und ist die schlechtere: Sie verschöbe
Todos zwischen Tags und damit zwischen Pools, ohne dass jemand gefragt worden wäre.

**Sie schreibt die Namen in zwei Durchläufen.** `ux_tag_name` aus 0001 wird **je Zeile** geprüft,
nicht am Ende der Anweisung. Aus „back  end" wird „back end", und solange die Zeile daneben noch
„back end" heißt, stünden für die Dauer eines Schreibvorgangs zwei gleiche Namen da — die
Migration bräche mit einer UNIQUE-Verletzung ab, obwohl das Ergebnis eindeutig ist. Gemessen,
nicht befürchtet: Der erste Entwurf ist genau daran gescheitert. Deshalb erst auf einen
Zwischenwert, der nicht kollidieren kann, dann auf den endgültigen — dasselbe Muster wie beim
Umsortieren der Kanban-Spalten, aus demselben Grund.

**Der Rückweg ist nicht vollständig, und das steht in der Datei.** Trigger, Indizes und Spalte
verschwinden; die vereinheitlichten Leerzeichen und die „ (2)"-Zusätze bleiben. Der ursprüngliche
Text ist nach dem UPDATE nirgends mehr gespeichert. Eine Rückwärtsmigration, die ihn erriete,
wäre schlimmer als eine, die ihn stehen lässt. Der Rückweg auf einem benutzten Bestand ist die
Sicherungskopie aus 8.3.

### 8.4d Migration 0009 — eine Spalte, die den Bestand nicht anfasst (T-066, E-054)

`0009_pool_placement` hängt `pool.placement` an, mit `DEFAULT 'pool'` und einem CHECK auf die drei
zulässigen Werte. Sonst nichts: kein Index, kein Trigger, kein UPDATE, keine Datenwanderung.

**Sie rät nicht.** Nach E-054 ist eine Kanban-Spalte eine Regel; zum Zeitpunkt dieser Migration
kannte sie allein die Tagachse (die vier weiteren kommen mit E-055 und Migration 0011). Es lag
nahe, den Bestand zu übersetzen — die vier Statuswerte in vier Spalten, oder alle vorhandenen Pools auf
`both`. Beides wäre falsch gewesen:

* Eine Spalte war damals eine Regel über **Tags**; „In Progress" ist kein Tag. Eine Migration, die dafür
  Tags anlegte und an Todos hängte, täte genau das, was der Auftraggeber ausgeschlossen hat
  („du darfst keine Tags setzen").
* Alle vorhandenen Pools zu Spalten zu machen ergäbe ein Board, das eine Kopie der Pool-Liste ist
  und das niemand bestellt hat. Der Benutzer müsste aufräumen, was ihm eingerichtet wurde.

Also bekommt jede vorhandene Regel `pool`, und das **Board ist danach leer**, bis jemand eine
Spalte einrichtet. Ein leeres Board ist sichtbar leer; ein gefülltes sieht aus, als hätte es
jemand so gewollt. Die Antwort von `GET /board` unterscheidet die beiden Fälle ausdrücklich:
`columns: []` heißt „keine Spalte eingerichtet" und nicht „nichts zu tun".

**Der CHECK an einer angehängten Spalte ist zulässig und wirksam.** `ALTER TABLE ADD COLUMN` nimmt
weder PRIMARY KEY noch UNIQUE an, einen CHECK dagegen schon; gemessen: ein UPDATE mit einem
unbekannten Wert wird am Adapter vorbei abgewiesen.

**Der Rückweg verliert genau eine Auskunft, und die richtige.** Nach `9 → 8` ist jede Regel wieder
ein Pool; welche davon eine Kanban-Spalte war, steht nirgends mehr. Name, Regel, Position und alle
Todos bleiben unangetastet. Die Alternative — Regeln mit `placement = 'board'` beim Rückweg zu
löschen, weil es sie vorher nicht gab — nähme dem Benutzer eine von Hand eingerichtete Regel weg,
ohne zu fragen.

### 8.4e Migration 0010 — eine Spalte, die niemand mehr liest (T-070, E-054)

`0010_drop_board_rank` entfernt `todo.board_rank`, die Zusicherung `ux_todo_rank` und das zweite
Feld von `ix_todo_status`.

**Warum überhaupt, wenn die Spalte doch stillhielt.** Sie war seit E-054 tot und an vier Stellen
als tot beschriftet. Eine Beschriftung ist der schlechtere von zwei Zuständen: Sie kostet jeden
Leser dieselbe Aufmerksamkeit noch einmal und wird selbst zur Falschaussage, sobald jemand sie
überliest und den Rest wiederbelebt. T-066 hat den Befund gemessen — kein Aufrufer setzt ihn,
sortiert wurde nur im alten Ziehen-Board —, T-069 hat gemessen, dass es keine Reihenfolge gibt, in
der sich das auf zwei Aufgaben aufteilen ließe.

**Warum die Indizes zuerst fallen.** SQLite verweigert `DROP COLUMN`, solange ein Index die Spalte
nennt (`error in index ix_todo_status after drop column`). Erst `ux_todo_rank`, dann
`ix_todo_status`, dann die Spalte, dann `ix_todo_status` neu — einspaltig auf `status_id`, weil der
Filter über `TodoFilter.statusIds` und die ON-DELETE-RESTRICT-Prüfung von `todo_status` ihn
weiterhin brauchen.

**Der Rückweg ist verlustfrei, und das ist hier keine Höflichkeit.** Der einzige Wert, der je in
`board_rank` stand, war die Kennung des Todos selbst; `UPDATE todo SET board_rank = id` stellt
genau den Zustand vor 0010 wieder her und nicht bloß einen brauchbaren. Ein Unterschied bleibt:
Die zurückgelegte Spalte trägt `DEFAULT ''`, weil SQLite eine über `ADD COLUMN` entstehende
NOT-NULL-Spalte nur mit Vorgabewert annimmt. Folgenlos, weil `ux_todo_rank` danach wieder steht:
Ein INSERT ohne `board_rank` liefe beim zweiten Mal in derselben Statusspalte in die
Eindeutigkeitsbedingung. Die Wache überlebt, sie heißt nur anders.

### 8.4f Migration 0011 — ein Tabellenumbau, und die Frage, die er nicht stellen muss (T-076)

`0011_pool_rule_axes` hängt `completion` und `export_state` an `pool` und baut `pool_rule` um:
`role`, `status_id`, ein erschöpfender CHECK, ein erweiterter eindeutiger Index, ein neuer
Teilindex auf `status_id`. Die Gestalt der Regel steht in 3.5.

**Warum ein Umbau und kein ALTER.** SQLite kennt kein ALTER TABLE für einen CHECK, und der CHECK
aus 0001 — `(tag_id IS NULL) <> (folder_id IS NULL)` — ist genau die Bedingung, die eine Zeile mit
`status_id` verböte. Der Weg ist der vorgeschriebene und derselbe wie in 0006: neue Tabelle,
kopieren, alte weg, umbenennen, Indizes wieder anlegen, mit `-- takt: foreign_keys=off` und
`PRAGMA legacy_alter_table = ON`. `pool_rule` hat keine Kindtabelle und kein Trigger hängt daran;
der Umbau ist deshalb einfacher als der in 0006.

**Die Frage, die diese Migration nicht stellen muss.** Bei einer Umstellung von „Liste" auf
„erforderliche Tags" lautet die gefährliche Frage: Wird eine vorhandene Tagliste zu „alle davon"
oder zu „mindestens eines davon"? Sie wird hier **nicht geraten**, weil die Antwort schon dasteht.
`pool.match_mode` hält sie seit 0001, je Regel einzeln — `'any'` ist die Vorgabe der Spalte, der
Route und der Oberfläche (die dort wörtlich „Mindestens eines von" anzeigt), `'all'` steht nur, wo
jemand es ausdrücklich gewählt hat. Jede vorhandene Zeile wird zu `role = 'required'`, `match_mode`
bleibt unangetastet, `completion` und `export_state` stehen neutral. **Jede bestehende Regel
trifft nach der Migration genau dieselben Todos wie davor.**

Migration 0002 legt keine Pools an; es gibt also auch keinen mitgelieferten Bestand, der umgedeutet
werden könnte.

**Der Rückweg ist nicht verlustfrei, und er sagt es.** Zurück bleibt die Form von 0001: eine Liste
gleichartiger Tagterme und `match_mode`. Erforderliche Tags stehen unverändert da; ausgeschlossene
Tags, Statusterme und die beiden Spalten fallen weg, weil die alte Form kein Feld für sie hat.
Eine Regel, die **nur** aus solchen Bedingungen bestand, hat danach eine leere Regel und trifft
nichts — sichtbar leer. Die Alternative, solche Regeln zu löschen, weil es sie vorher nicht gab,
nähme dem Benutzer eine von Hand eingerichtete Regel samt Namen und Position weg, ohne zu fragen.
Dieselbe Abwägung wie in 8.4d.

### 8.4g Migration 0012 — dieselbe Tabelle, drei RESTRICT (T-089, R-1 Befund 1)

`0012_pool_rule_restrict` ändert **keine Spalte und keinen Index**. Sie setzt `pool_rule.tag_id`
und `pool_rule.folder_id` von ON DELETE CASCADE auf **RESTRICT** — der Stand, auf dem `status_id`
seit 0011 steht. Die Begründung steht in 3.5; kurz: Ein Term, der beim Löschen eines Tags oder
eines Ordners still mitgeht, ändert die Bedeutung einer Regel, ohne dass jemand sie angefasst hat,
und in die gefährliche Richtung — die Regel trifft danach **mehr**.

**Warum ein Umbau und kein ALTER.** SQLite kennt kein ALTER TABLE für eine REFERENCES-Klausel. Der
Weg ist Zeile für Zeile der aus 0011: neue Tabelle, kopieren, alte weg, umbenennen, Indizes wieder
anlegen, mit `-- takt: foreign_keys=off` und `PRAGMA legacy_alter_table = ON`.

**Kein Datenverlust in beiden Richtungen.** Der Inhalt wird eins zu eins kopiert, vorwärts wie
rückwärts; Spalten, CHECK, Indexnamen und Indexform bleiben gleich. Was der Rückweg zurücknimmt,
ist allein das Verhalten beim Löschen — und er sagt es in seinem Kopf: Danach nimmt ein gelöschter
Ordner seine Regelterme wieder still mit. Der Bestand ist dann nicht ungeschützt, sondern wieder
auf **eine** Wache statt zweier zurückgesetzt: `TagPort.remove` und `TagFolderPort.remove` prüfen
weiterhin vorher.

### 8.4h Migration 0013 — eine Spalte, die eine Anwendung still hält (T-138, A-18.10)

`0013_skipped_version` hängt `app_setting.skipped_version` an. Sie ist die kleinste Migration
dieses Bestands und die erste seit 0009, die weder eine Tabelle umbaut noch einen Index anfasst:
ein `ALTER TABLE … ADD COLUMN` vorwärts, ein `ALTER TABLE … DROP COLUMN` rückwärts.

**Warum kein Umbau.** Es ändert sich keine bestehende Spalte, keine REFERENCES-Klausel und kein
bestehender CHECK. `app_setting` trägt weder Trigger noch Sicht; die einzige
Fremdschlüsselbeziehung (`active_export_template_id`) bleibt unberührt. Ein Umbau nach dem Muster
von 0011 und 0012 wäre hier mehr Bewegung als Änderung, und jede kopierte Zeile ist eine
Gelegenheit, etwas zu verlieren.

**Warum DROP COLUMN hier zulässig ist.** SQLite verweigert es, wenn die Spalte in einem Index,
einer Sicht, einem Trigger, einem Fremdschlüssel oder einem **anderen** CHECK vorkommt. Sie kommt
in keinem davon vor; ihr eigener CHECK fällt mit ihr. Gemessen an SQLite 3.51.3: vorwärts auf 13,
rückwärts auf 12, rückwärts auf 0, wieder vorwärts auf 13 — der Bestand steht danach wie vorher.

**Ein Datenverlust, und er ist benannt.** Der Rückweg nimmt die übersprungene Fassung mit. Der
Hinweis auf genau diese Fassung erscheint danach wieder. Das ist die richtige Richtung — die
Anwendung meldet zu viel statt zu wenig, und der Benutzer kann erneut überspringen —, aber es ist
keine verlustfreie Rücknahme, und der Kopf der Rückwärtsdatei sagt es.

### 8.4i Migration 0014 — eine Spalte mit Index, und die Reihenfolge, die daraus folgt (T-146, A-19.1)

`0014_todo_due_date` hängt `todo.due_date` an und legt den Teilindex `ix_todo_due_date` darüber.
Vorwärts also zwei Anweisungen, rückwärts ebenfalls zwei — **und ihre Reihenfolge ist Inhalt.**

**Erst der Index, dann die Spalte.** SQLite lehnt `DROP COLUMN` ab, solange die Spalte in einem
Index vorkommt; die Meldung lautet dann „error in index ix_todo_due_date". Das ist kein Kunstgriff,
sondern die Bedingung, unter der `DROP COLUMN` überhaupt zulässig ist. Sie steht auch im Kopf der
Rückwärtsdatei, damit der Nächste, der eine Spalte mit Index anlegt, sie nicht neu herausfindet.

**Warum kein Tabellenumbau.** Es ändert sich keine bestehende Spalte, keine REFERENCES-Klausel und
kein bestehender CHECK. Auf `todo` stehen keine Trigger; `v_export_candidate` liest `todo`, wird
aber von einer neuen Spalte nicht berührt, weil die Sicht ihre Spalten ausschreibt — genau die
Eigenschaft, die A-19.17 hier strukturell hält. Der Vorgabewert ist `NULL`, also „keine Frist", und
das ist der Zustand, in dem jeder bestehende Bestand nach dieser Migration steht (A-19.16).

**Der Teilindex.** `WHERE due_date IS NOT NULL`, weil der überwiegende Teil der Todos keine Frist
trägt und ein Index über lauter `NULL`-Werte Platz kostet, ohne etwas zu treffen — dieselbe Bauart
wie `ix_todo_call_number` aus 0001. Die Kennung steht als zweite Spalte darin: Die Blätterung
sortiert `(due_date, id)` und bekommt beide Schlüssel aus einem Durchlauf.

**Ein Datenverlust, und er ist benannt.** Der Rückweg nimmt **jede gesetzte Frist** mit; es gibt
keinen Ort, an dem sie zwischenläge. Das ist die ehrlichere von zwei Möglichkeiten — die
Alternative wäre eine Nebentabelle, die das Schema der Vorgängerfassung nicht kennt, und dann
stünde Kundenmaterial in einer Tabelle, die niemand liest und niemand löscht. Nicht betroffen: das
Todo selbst, seine Tags, seine Buchungen, sein Vermerk und sein Exportstatus. Die Frist war nie
eine Achse (A-19.7), deshalb hängt an ihr nichts.

### 8.4j Migration 0015 — zwei Tabellen, und ein Rückweg, der Dateien liegen lässt (T-146, A-19.8)

`0015_todo_attachment` legt `todo_attachment_kind` (drei Zeilen), `todo_attachment` und zwei
Indizes an. Die Formwahl — Wertspalte plus Nachschlagetabelle statt CHECK — steht in 3.8; hier
steht, was das Verfahren angeht.

**Reihenfolge.** Vorwärts von der Wurzel zum Blatt: erst die Wertetabelle, dann die Tabelle, die
auf sie verweist. Rückwärts umgekehrt, wie in 0001.

**Der Rückweg lässt die Bildkopien liegen — und das ist die Stelle, die genannt gehört.** Die
Zeilen verschwinden, die Dateien im Bildverzeichnis nicht. SQL kennt kein Dateisystem, und ein
Rückweg, der Dateien löschte, täte etwas, das man ihm nicht ansieht. Nach diesem Rückweg bleibt
damit Kundenmaterial ohne Eigentümer liegen — genau der Zustand, den A-A-18 im laufenden Betrieb
ausschließt. **Wer diesen Rückweg fährt, räumt das Verzeichnis `attachments` neben `takt.db` von
Hand.** Der Satz steht im Kopf der Rückwärtsdatei, weil er sonst niemandem auffiele, bis jemand die
Datenmenge erklären soll.

Nicht betroffen: `todo` selbst, seine Tags, seine Buchungen, sein Vermerk, sein Exportstatus. Keine
Sicht, kein Trigger und kein CHECK außerhalb dieser beiden Tabellen nennt sie — insbesondere
`v_export_candidate` nicht, und das ist keine Fügung, sondern A-19.17.

### 8.5 Nachgewiesen

Alle Migrationen wurden gegen SQLite 3.51.3 ausgeführt und in T-013 gegen SQLite 3.53.4 sowie
gegen `node:sqlite` aus Node 22 wiederholt:

| Fall | Ergebnis |
|---|---|
| 0001 vorwärts | 15 Tabellen, 30 Indizes, 10 Trigger, 1 Sicht |
| 0002 vorwärts | 4 Spalten, Standardvorlage mit `Call`/`Zeit`/`Notiz`/`WindowsUser`, 1 Einstellungszeile |
| 0002 rückwärts, leerer Bestand | sauber zurückgenommen, Trigger wiederhergestellt |
| 0001 rückwärts, leerer Bestand | 0 verbleibende Objekte |
| erneut vorwärts | 56 Objekte, `integrity_check` = ok, `foreign_key_check` leer |
| 0002 rückwärts, **benutzter** Bestand | Abbruch mit sprechender Meldung; Todos, Spalten, Vorlage, Einstellungen und beide Trigger unversehrt |
| Migration bricht mittendrin ab | nichts angelegt, Objektzahl unverändert |
| Erledigtes Todo in Spalte „Backlog" | zulässig — Erledigt und Spalte sind entkoppelt (T-013) |
| Tagesgruppierung über gemischten Exportstatus | drei offene Buchungen von 10, 20 und 5 Minuten ergeben eine Gruppe mit 2 100 s ► 0,75; die vierte, bereits exportierte Buchung des Tages bleibt außen vor (T-013) |
| Buchung 23:40 → 00:20 | vollständig in der Gruppe des Starttags, nicht geteilt (T-013) |
| 0003 vorwärts (T-009) | `timer_heartbeat` samt zwei Triggern; Lebenszeichen geschrieben und fortgeschrieben |
| 0003, Lebenszeichen auf beendeter Buchung | mit `timer_not_running` abgewiesen |
| 0003, Buchung gelöscht | Lebenszeichen verschwindet mit (`ON DELETE CASCADE`) |
| Unvollständige Buchung im Export | `v_export_candidate` liefert sie nicht — eine verwaiste Buchung geht in keinen Export (E-036) |
| 0004 vorwärts (T-009) | Standardvorlage auf `group.quarters` und `group.bookingNotes` gezogen (E-033); kein `booking.*` mehr in der Datenbank |
| 0004 und 0003 rückwärts | Feldliste aus 0002 wortgleich wiederhergestellt, Trigger wiederhergestellt, Tabelle entfernt |
| 0004 → 0001 rückwärts, dann erneut vorwärts | 0 verbleibende Objekte, danach 64 Objekte, byteweise dieselbe Objektliste wie im ersten Lauf; `integrity_check` = ok, `foreign_key_check` leer (T-009, Node 22.23.2, `node:sqlite`) |
| 0006 vorwärts (T-029) | `export_audit` kennt `not_billed`; die Zeile mit Exportlauf **und** `not_billed` wird vom CHECK abgewiesen |
| 0006, Herkunfts-Trigger | `export_status` auf `exported` ohne Protokollzeile: `export_status_not_settable`; jüngste Zeile ist `reset`: ebenso; mit mitzählendem `export_count`: erlaubt |
| 0006 rückwärts mit einer `not_billed`-Zeile | bricht ab (`rollback_0006_only_without_not_billed`), der Bestand bleibt unverändert |
| 0006 rückwärts ohne solche Zeile, dann erneut vorwärts | Fassung 5, CHECK wieder ohne `not_billed`, danach wieder Fassung 6 |
| 0006 → 0000 rückwärts, dann erneut vorwärts | 0 verbleibende Objekte, danach byteweise dieselbe Objektliste wie im ersten Lauf; `integrity_check` = ok, `foreign_key_check` leer (T-029, Node 22.23.2, `node:sqlite`) |
| 0007 vorwärts (T-047) | Trigger ordnet nach `rowid`; 0 → 7, sieben Zeilen in `schema_migration` |
| 0007 rückwärts, dann erneut vorwärts | 7 → 6, Trigger wieder mit `id DESC`; 6 → 7, wieder mit `rowid DESC` |
| 0007 → 0000 rückwärts, dann erneut vorwärts | 7 → 0 → 7, keine Zeile angefasst (T-047, Node 22.23.2, `node:sqlite`) |
| 0007, Protokollzeilen am Kennungsgenerator vorbei | zuletzt eingefügte `not_billed`-Zeile mit **kleinerer** Kennung: Wechsel erlaubt; zuletzt eingefügte `reset`-Zeile mit **größerer** Kennung: `export_status_not_settable` (`proof:export` 12) |
| 0008 vorwärts (T-058) | `tag.name_key` gefüllt, zwei Indizes, zwei Trigger; 0 → 8 ergibt 69 Objekte, `integrity_check` = ok, `foreign_key_check` leer |
| 0008, Faltung gegen die Domäne | dreißig Namen — Umlaute, ẞ, Tabulator, geschütztes und ideographisches Leerzeichen, 200 Zeichen — ergeben in SQL denselben Schlüssel und dieselbe Anzeigeform wie `tagNameKey`/`normalizeTagName` (`proof:tags` 1) |
| 0008 auf einem Bestand mit Doppelten | „ backend"/„Backend", „back  end"/„back end", „Änderung"/„änderung": läuft durch, kein Tag verloren, das zuerst angelegte behält seinen Namen, das zweite bekommt „ (2)" (`proof:tags` 3) |
| 0008 rückwärts, dann erneut vorwärts | 8 → 7 entfernt Spalte, Indizes und Trigger; 7 → 8 legt sie wieder an |
| 0008 → 0000 rückwärts, dann erneut vorwärts | 8 → 0 → 8, 0 verbleibende Objekte, danach dieselbe Objektliste wie im ersten Lauf (T-058, Node 22.23.2, `node:sqlite`) |
| 0008, doppelter Schlüssel am Adapter vorbei | direktes INSERT mit vorhandenem `name_key`: `ux_tag_name_key`; ungefalteter Schlüssel: `tag_name_key_invalid` (`proof:tags` 2) |
| 0009 vorwärts (T-066) | 0 → 9 auf leerer Datei; `pool.placement` vorhanden, Vorgabe `pool` |
| 0009, Anzeigeort am Adapter vorbei | `UPDATE pool SET placement = 'quatsch'`: vom CHECK abgewiesen |
| 0009, die drei Werte durch den Adapter | ohne Angabe `pool`; `board` und `both` kommen zurück, wie sie geschrieben wurden; `list()` liefert Pool und Beides, `list('board')` Spalte und Beides, `list('all')` alle drei |
| 0009, Spalte als Abfrage | `pools.members` liefert die Karte einer Spalte über dieselbe Abfrage wie für einen Pool; eine Spalte mit leerer Regel liefert nichts (`total = 0`) |
| 0009 rückwärts **mit Daten** | 9 → 8: Spalte weg, alle drei Regeln samt Regeltermen, Todos und Vermerk unverändert |
| 0009 erneut vorwärts mit Daten | 8 → 9: alle drei Regeln da, jede wieder `pool`, das Board leer — genau das, was die Rückwärtsdatei ansagt (T-066, Node 22.23.2, `node:sqlite`, 20 Prüfungen) |
| 0010 vorwärts (T-070) | 0 → 10 auf leerer Datei; `todo.board_rank` weg, `ux_todo_rank` weg, `ix_todo_status` einspaltig auf `status_id`, die vier übrigen `todo`-Indizes unverändert |
| 0010, der Zugriffspfad bleibt | `EXPLAIN QUERY PLAN` für `WHERE status_id = ?` nimmt weiterhin `ix_todo_status` |
| 0010, zwei Todos in derselben Statusspalte | zulässig — die Rangeindeutigkeit, die es nicht mehr zu sichern gibt, sichert nichts mehr |
| 0010 rückwärts **mit Daten** | 10 → 9: `board_rank` wieder da und wieder gleich der Kennung, alle Todos und der interne Vermerk unverändert, beide Indizes wortgleich wie in 0001 |
| 0010, die zurückgelegte Wache | doppelter Rang in derselben Statusspalte: `UNIQUE`; ausgelassener Rang beim zweiten INSERT: ebenfalls `UNIQUE` (die Folge des `DEFAULT ''`, siehe 8.4e) |
| 0011 vorwärts (T-076) | 0 → 11 auf leerer Datei; `pool.completion`/`pool.export_state` da, `pool_rule` mit `role`/`status_id`, `ux_pool_rule` fünfspaltig, `ix_pool_rule_status` neu — Stand danach 17 Tabellen, 34 Indizes, 17 Trigger, 1 Sicht |
| 0011, die sechs Wachen | Tag und Status in **einer** Zeile: `CHECK`; Rolle `status` ohne `status_id`: `CHECK`; unbekannte Rolle: `CHECK`; derselbe Term zweimal: `UNIQUE ux_pool_rule`; `completion = 'vielleicht'`: `CHECK`; `export_state = 'vielleicht'`: `CHECK` |
| 0011, RESTRICT auf dem Status | Löschen eines Status, der in einer Regel steht: `FOREIGN KEY constraint failed` — und über die Route `409 status_in_use` mit dem fachlichen Satz |
| 0011, dasselbe Tag erforderlich **und** ausgeschlossen | zulässig. Eine unsinnige Regel, aber eine Eingabe des Benutzers; sie trifft nichts, und die Antwort darauf gehört in die Oberfläche, nicht in einen 409 |
| 0011 rückwärts **mit Daten** | 11 → 10 mit zwei Regeln, davon eine gemischte: die erforderlichen Tagterme unverändert da, ausgeschlossene und Statusterme weg, `completion`/`export_state` weg, `pool_rule` wortgleich wie in 0001 (drei Spalten, drei Indizes) |
| 0011 wieder vorwärts | 10 → 11: die überlebende Zeile trägt `role = 'required'`, `pragma_foreign_key_check` leer |
| 0012 vorwärts (T-089) | 0 → 12 auf leerer Datei: 17 Tabellen, 34 benannte Indizes, 17 Trigger, 1 Sicht — Zahl und Namen wie nach 0011; `pool_rule.tag_id` und `.folder_id` tragen `ON DELETE RESTRICT` |
| 0012, die drei RESTRICT | Regel mit einem Ordnerterm, einem ausgeschlossenen Tagterm und einem Statusterm: Löschen des Ordners, des Tags und des Status je `FOREIGN KEY constraint failed`, alle drei Terme unversehrt. Über die Routen `409 tag_in_use` beziehungsweise `409 status_in_use`, mit den betroffenen Regeln in `details` |
| 0012 rückwärts **mit Daten** | 12 → 11 mit drei Termen: alle drei unverändert da, `tag_id`/`folder_id` wieder auf CASCADE. Die Gegenprobe unmittelbar danach: Das Löschen des Ordners geht durch und nimmt seinen Term mit (3 → 2) — genau der Zustand, gegen den 0012 geschrieben ist |
| 0012 wieder vorwärts | 11 → 12, `integrity_check` = ok, `foreign_key_check` leer, 81 Objekte in `sqlite_master` (Node 22.23.2, `node:sqlite`) |
| 0010 erneut vorwärts mit Daten | 9 → 10: Spalte wieder weg, Todos und Vermerk unverändert, `integrity_check` = ok, `foreign_key_check` leer |
| 0010 → 0000 rückwärts, dann erneut vorwärts | 10 → 0 → 10, `todo` verschwindet und steht danach wieder ohne `board_rank` (T-070, Node 22.23.2, `node:sqlite`, 25 Prüfungen) |
| Der vollständige Stand, jeder eindeutige Index (T-074) | 0 → 10, dann jede der **14** `UNIQUE`-Verletzungen aus `sqlite_master` ausgelöst: jede ergibt einen eigenen Fehlerschlüssel und einen eigenen Satz, keine fällt auf „Dieser Wert ist bereits vergeben", keine Antwort nennt Index-, Tabellen- oder Spaltennamen (`proof:conflicts` 1) |
| Der Standard-Status, ohne die Oberfläche (T-074) | `DELETE` auf den Standard und `PATCH … isDefault:false` auf den Standard ergeben beide `409 default_status_locked`; der Standard steht danach unverändert da; Weitergeben und anschließendes Löschen gehen (`proof:conflicts` 5) |
| Der Bestand der Indizes gegen die Übersetzung | die Liste aus `sqlite_master` und `UNIQUE_INDEX_CATALOG` sind in **beide** Richtungen deckungsgleich, und jeder Indexname bringt genau seinen eigenen Satz zurück — ein neuer Index ohne Eintrag, ein Eintrag ohne Index und ein Name, der in einem anderen steckt, werden alle drei rot (`proof:conflicts` 1) |
| 0014 vorwärts (T-146) | 13 → 14: `todo.due_date` da, `ix_todo_due_date` als Teilindex; 35 benannte Indizes, Tabellen und Trigger unverändert |
| 0014, die Form am Adapter vorbei | `UPDATE todo SET due_date = '2026-9-3'`: `CHECK constraint failed`. `'2026-02-30'` besteht den CHECK — die **Existenz** des Tages prüft die Domäne, nicht der GLOB, siehe 3.2 |
| 0015 vorwärts (T-146) | 14 → 15: `todo_attachment` und `todo_attachment_kind` mit drei Zeilen, `ix_todo_attachment_todo` und `ix_todo_attachment_image`. Stand danach **19 Tabellen, 37 benannte Indizes, 17 Trigger, 1 Sicht**; `integrity_check` = ok |
| 0015, die zweite Wache auf der Art | `INSERT` mit `kind = 'video'`: `FOREIGN KEY constraint failed`. `DELETE FROM todo_attachment_kind` für eine **benutzte** Art: ebenso (RESTRICT); für eine unbenutzte: geht durch |
| 0015, `ON DELETE CASCADE` | Todo gelöscht: seine Anhangszeilen gehen mit. Die **Dateien** nicht — das leistet der Anwendungsfall, siehe 3.8 |
| 0014/0015, die Zugriffspfade (T-159) | `EXPLAIN QUERY PLAN`: die Fristsortierung nimmt `ix_todo_due_date` als **covering index**; `imageTargets` und die Anhangsliste eines Todos nehmen beide `ix_todo_attachment_todo`; die Suche nach einem Bildnamen nimmt `ix_todo_attachment_image`. Kein `SCAN` in den vier Abfragen |
| **0 → 15 → 13 → 15 auf einem Bestand mit Inhalt** (T-159, Node 22.23.2, `node:sqlite`) | vorher: ein Todo mit Frist `2026-09-30`, internem Vermerk, einer Buchung und drei Anhängen (Verweis, Datei, Bild). Nach 15 → 13: **kein** Rest von `todo_attachment*` in `sqlite_master`, keine Spalte `due_date`, Todo, Vermerk und Buchung unversehrt. Nach 13 → 15: beide Tabellen wieder da, `todo_attachment_kind` wieder mit drei Zeilen, Frist `NULL` und Anhänge 0 — genau der angesagte Verlust, nicht mehr; Vermerk und Todo unverändert. Danach 19/37/17/1, `integrity_check` = ok, `foreign_key_check` leer |

**Seit T-021 läuft das Verfahren nicht mehr von Hand, sondern über den Läufer**
(`packages/storage/src/sqlite/migration-runner.ts`). Er ist Teil von
`pnpm --filter @takt/local-api proof:export`, Abschnitt 8:

| Fall | Ergebnis |
|---|---|
| leerer Bestand | meldet `pending`, nicht `current` — ein leerer Bestand ist nicht auf Stand |
| vorwärts bis zur höchsten Fassung | Fassung 5, fünf Zeilen in `schema_migration`, Zustand danach `current` |
| rückwärts auf Fassung 1 | vier Migrationen zurückgenommen, eine bleibt verzeichnet |
| erneut vorwärts | Fassung 5, und die nicht löschbare Standardvorlage ist wieder da (A-8.7) |
| rückwärts auf Fassung 0 | keine Migration mehr verzeichnet |

Drei Eigenschaften des Läufers, die eine Erwähnung wert sind:

* **Die Prüfsumme ist die über die Vorwärtsdatei.** Wird eine bereits gelaufene Migration
  nachträglich geändert, weigert sich der Läufer zu arbeiten, statt zu raten — sonst liefe auf dem
  Rechner des Entwicklers ein anderes Schema als auf dem des Kunden. Dasselbe gilt für eine
  gelaufene Migration, deren Datei es nicht mehr gibt.
* **Eine Vorwärtsdatei ohne Rückwärtsdatei ist ein Fehler, kein Sonderfall.** Der Läufer bricht
  beim Einlesen ab. Eine Migration ohne Rückweg ist eine Einbahnstraße, die erst auffällt, wenn
  man sie braucht.
* **Die Sicherungskopie entsteht mit `VACUUM INTO`, nicht mit `copyFile`.** Eine Kopie einer
  geöffneten Datenbank im WAL-Modus enthält den Inhalt des Journals nicht — also eine Sicherung
  ohne die zuletzt geschriebenen Buchungen. Bei einem Bestand auf Fassung 0 unterbleibt sie: Eine
  Kopie einer leeren Datei sichert nichts.
* **Die Sicherungskopie bekommt `0600` wie das Original** (Abschnitt 2.5, T-034). Sie ist eine
  vollständige zweite Kundendatenbank, sie heißt `…-vor-migration-…` und sieht damit aus wie
  etwas, das man aufhebt und herauskopiert.

---

## 9. Indizes im Überblick

| Index | Bedient |
|---|---|
| `ux_time_entry_running` (partiell, Konstante) | A-6.8: höchstens ein laufender Timer |
| `ix_time_entry_queue` (partiell, `(todo_id, started_at) WHERE export_status = 'open'`) | Exportwarteschlange und Tagesgruppierung (5.5) |
| `ix_time_entry_reset` (partiell) | R-10: zurückgesetzte Buchungen finden |
| `ix_time_entry_todo` | Buchungen eines Todos, Summenbildung |
| `ix_time_entry_day` | Tages- und Zeitraumfilter (I-10) |
| `ix_tag_folder_parent` | Baumabstieg, siehe 4.1 |
| `ux_tag_folder_name`, `ux_tag_name` (Ausdruck, `NOCASE`) | Namenseindeutigkeit je Ebene, auch auf Wurzelebene |
| `ux_tag_name_key` (Ausdruck) | dieselbe Eindeutigkeit, aber über den Vergleichsschlüssel: Leerraum und Umlaut-Großschreibung zählen mit (3.3, T-058) |
| `ix_tag_name_key` | „gibt es diesen Tagnamen irgendwo?" — die ordnerübergreifende Suche beim Anlegen eines Todos mit neuem Tag |
| `ix_todo_status` | Filter über `TodoFilter.statusIds` und die ON-DELETE-RESTRICT-Prüfung von `todo_status`. Seit Migration 0010 einspaltig: Das zweite Feld war `board_rank`, und das gibt es nicht mehr |
| `ix_todo_call_number` (partiell) | A-10.9: Duplikaterkennung im Add-in |
| `ix_todo_due_date` (partiell, `(due_date, id) WHERE due_date IS NOT NULL`) | A-19.6: Sortieren und Filtern nach Frist. Beide Schlüssel der Blätterung aus einem Durchlauf |
| `ix_todo_attachment_todo` (`(todo_id, position, id)`) | A-19.8: die Anhänge eines Todos in stabiler Ordnung — und `listMany` für mehrere Todos in **einer** Abfrage, kein N+1 in der Liste |
| `ix_todo_attachment_image` (partiell, `(target) WHERE kind = 'image'`) | „Gibt es zu dieser Datei im Bildverzeichnis noch einen Eigentümer?" — die Gegenrichtung von A-A-18, für ein Aufräumen ohne Tabellendurchlauf. Er bedient **nicht** `imageTargets(todoId)`; das tut `ix_todo_attachment_todo` |
| `ix_todo_open`, `ix_todo_completed` (partiell) | Dashboard: offene und erledigte Todos |
| `ix_todo_tag_reverse` | „Welche Todos tragen dieses Tag" — Grundlage der Pool-Abfrage |
| `ux_todo_status_default` (partiell, Konstante) | genau eine Standardspalte für neu angelegte Todos |
| `ux_export_template_builtin` (partiell, Konstante) | genau eine eingebaute Vorlage (A-8.7) |
| `ix_export_audit_entry` | Geschichte einer Buchung (R-10) |
| `ux_export_run_group` (Lauf, Todo, Tag) | je Lauf höchstens eine Zeile für dasselbe Todo am selben Tag |
| `ix_export_run_group_todo` | alle Exportzeilen eines Todos an einem Tag, über Läufe hinweg (R-10) |

`timer_heartbeat` kommt ohne eigenen Index aus: Der Primärschlüssel ist die einzige Zugriffsachse,
und die Tabelle hält höchstens eine Zeile.

`pool.placement` bekommt aus demselben Grund keinen: Die beiden Abfragen lauten
`WHERE placement IN ('pool','both')` und `WHERE placement IN ('board','both')`, und `pool` hält
die Regeln, die ein Mensch von Hand eingerichtet hat — eine Handvoll Zeilen. Ein partieller Index
darauf behauptete einen Zugriffspfad, den kein Abfrageplan je wählen würde.

Partielle Indizes tragen hier viel Gewicht: Sie sind kleiner, weil sie nur die betroffenen Zeilen
enthalten, und in vier Fällen erzwingen sie eine fachliche Regel, die sonst in einer Prüfung im
Code stünde und dort verloren gehen könnte.
