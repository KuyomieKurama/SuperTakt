# Takt-Datenarchiv und Fremdimport

Dieses Dokument beschreibt das öffentliche Sicherungsformat aus A-20 und die
Zuordnung der beiden Fremdformate. Der Abrechnungsexport aus A-8 ist davon
unabhängig.

## Format `de.supertakt.data-archive`, Schemafassung 1

Eine Sicherung ist UTF-8-kodiertes JSON mit diesem Umschlag:

```json
{
  "format": "de.supertakt.data-archive",
  "schemaVersion": 1,
  "createdAt": "2026-09-08T10:00:00Z",
  "generator": "Takt",
  "data": {
    "tables": {},
    "images": []
  },
  "warnings": []
}
```

`format` trennt das Archiv von beliebigen JSON-Dateien. `schemaVersion` ist
eine ganze Zahl und entscheidet, welcher Leser zuständig ist. Fassung 1 wird
nicht stillschweigend auf eine unbekannte spätere Fassung angewendet.

`data.tables` ist ein normalisiertes relationales Abbild. Jede Beziehung wird
über dieselbe stabile Kennung ausgedrückt, die Takt intern verwendet. Die
Spaltenlisten sind Teil der Fassung 1; zusätzliche oder fehlende Spalten werden
beim Wiederherstellen abgewiesen.

| Tabelle | Inhalt |
|---|---|
| `todo_status` | Statusspalten, Reihenfolge und Standardstatus |
| `tag_folder`, `tag`, `todo_tag` | Ordnerbaum, Tags und Zuordnungen |
| `todo`, `todo_note` | Aufgaben einschließlich Frist, Erledigt-Zeitpunkt und Vermerk |
| `time_entry`, `timer_heartbeat` | Zeitbuchungen, Exportzustand und laufender Timer |
| `todo_attachment_kind`, `todo_attachment` | Anhangsarten und Anhänge |
| `pool`, `pool_rule` | Pools/Kanban-Spalten und ihre vollständigen Regeln |
| `default_tag` | Standard-Tags samt Reihenfolge |
| `export_template` | eingebaute und eigene Exportvorlagen |
| `export_run`, `export_run_group`, `export_run_entry`, `export_audit` | Exportläufe, Tagesgruppen, beteiligte Buchungen und unveränderliches Protokoll |
| `app_setting` | Anwendungseinstellungen |

Bildanhänge stehen zusätzlich unter `data.images` als Objekte mit `name`,
`mediaType` und Base64-kodierten Bytes. Der Tabellenverweis bleibt dadurch
unverändert, während die Datei selbst transportierbar wird. Verweis- und
Dateianhänge brauchen keine eingebetteten Bytes; ihr Ziel steht in
`todo_attachment`.

Nicht enthalten sind das Sitzungs- und Add-in-Token, das Datenbank-
Migrationsbuch, abgeleitete Sichten und temporäre Dateien. Eine Warnung im
obersten `warnings`-Feld nennt Bildkopien, die beim Sichern nicht lesbar waren.

### Round-Trip und Erweiterung

Vor dem ersten Schreiben werden Umschlag, alle Tabellen, Spalten und skalaren
Werte geprüft. Der Tabellenbestand wird in einer Transaktion ersetzt und die
Datenbank-Trigger werden anschließend in ihrer ursprünglichen Definition
wieder eingesetzt. Fremdschlüssel werden spätestens beim Festschreiben
geprüft. Bilddateien werden atomar unter ihrem erzeugten Namen restauriert.

Eine inkompatible Änderung erhält eine neue `schemaVersion`. Der bisherige
Leser bleibt geschlossen; Migrationen zwischen Archivfassungen werden als
eigener Schritt ergänzt. Dadurch wird eine neue Bedeutung nicht unter der
alten Fassung geraten.

## Todoist-CSV

Mehrere CSV-Dateien können gemeinsam eingelesen werden. Der Dateiname ist der
Projektname. Das Trennzeichen wird zwischen Semikolon und Komma erkannt;
maskierte Trennzeichen, Anführungszeichen und mehrzeilige Felder bleiben
erhalten.

| Todoist | Takt |
|---|---|
| Projektdatei | Projekt-Tag und Pool |
| `section` | Bereichs-Tag unter dem jeweiligen Projekt |
| `task`/`CONTENT` | Aufgabe; `@label` wird als Label-Tag abgetrennt |
| `DESCRIPTION` und folgende `note`-Zeilen | Vermerk |
| `PRIORITY` 1–4 | Tag `P1` bis `P4` |
| `DEADLINE`, ersatzweise `DATE` | Fristtag |
| `INDENT` | Elternbeziehung als „Unteraufgabe von“ im Vermerk |
| Dauer und Verantwortlicher | beschriftete Metadaten im Vermerk |

Todoist stellt Sicherungen als ZIP mit je einer CSV-Datei pro Projekt bereit;
die Oberfläche nimmt die entpackten CSV-Dateien gemeinsam entgegen. Das
offizielle CSV-Format enthält keine erledigten Aufgaben, daher kann dieser Weg
sie nicht rekonstruieren.

## Super Productivity

Takt liest den normalisierten Zustand aus der Wurzel oder aus den bekannten
Hüllen `data`, `appData` und `state`; ein darin enthaltener JSON-Text wird
ebenfalls gelesen.

| Super Productivity | Takt |
|---|---|
| Projekt | Projekt-Tag und Pool |
| Bereich/Section | Bereichs-Tag unter dem Projekt |
| Tag samt Farbe | Label-Tag samt gültiger Hex-Farbe |
| Task und Task-Archiv | Aufgabe |
| `notes` | Vermerk |
| Deadline/Due day | Fristtag |
| `isDone` und `doneOn` | Erledigt-Zustand und Zeitpunkt |
| `timeSpentOnDay` | abgeschlossene Zeitbuchung je Tag |
| Parent, Schätzung, Wiederholung, Vorgangskennung und Anhangsmetadaten | beschriftete Metadaten im Vermerk |

Fremdimporte sind additiv. Jeder Lauf erhält einen eigenen Importordner und
kollisionsfreie Poolnamen; vorhandene Takt-Daten werden dabei nicht ersetzt.
