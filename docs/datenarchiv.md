# Takt-Datenarchiv und Fremdimport

Dieses Dokument beschreibt das öffentliche Sicherungsformat aus A-20 und die
Zuordnung der beiden Fremdformate. Der Abrechnungsexport aus A-8 ist davon
unabhängig.

## Format `de.supertakt.data-archive`

Die maßgeblichen Angaben stehen in
[`data-transfer.ts`](../apps/local-api/src/features/data-transfer/data-transfer.ts):
`DATA_ARCHIVE_VERSION` bestimmt die Schreibfassung, `READABLE_VERSIONS` die lesbaren
Fassungen und `parseArchive` deren Prüfung und Ergänzungen. Aktuell wird Fassung 10
geschrieben; Fassungen 1 bis 10 werden gelesen. Unbekannte Fassungen werden abgewiesen.
Die Erzeugerkennung bleibt aus Kompatibilitätsgründen `Takt`.

### Historischer Umschlag der Fassung 1

Das folgende gekürzte Beispiel dokumentiert die ursprüngliche Form, **kein heute
vollständig importierbares Archiv**. Es fehlen die vorgeschriebenen Tabellen.
Eine Sicherung ist UTF-8-kodiertes JSON:

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

### Aktueller Inhalt und Kompatibilität

`data.tables` ist ein normalisiertes relationales Abbild mit stabilen Kennungen.
Die vollständige Tabellenmenge steht in
[`DATA_ARCHIVE_TABLES`](../packages/storage/src/ports.ts), die Prüfung der
Tabellen und Spalten in
[`repo-data-archive.ts`](../packages/storage/src/sqlite/repo-data-archive.ts).
Eine zweite Tabellenliste wird hier nicht gepflegt. Token, Migrationsbuch,
abgeleitete Sichten und temporäre Dateien gehören nicht zum Archiv.

Bildkopien werden unter `data.images` mit `name`, `mediaType` und `base64`
transportiert. Seit Fassung 6 enthält `data.files` zusätzlich die Bytes aus E-Mails
übernommener Dateien als `{ name, base64 }`. Diese Liste ist für die aktuelle
Schreibfassung erforderlich, auch wenn sie leer ist. Gewöhnliche Dateiverweise
und Webverweise bleiben Ziele in `todo_attachment`; ihre externen Inhalte werden
nicht eingebettet. Base64 ist keine Verschlüsselung.

Die Fassungen markieren historische Erweiterungen: Darstellung in Fassung 2,
Leistungsfrage in 3, offene Inaktivitätsphasen (`timer_idle`) in 4 und die
Vorgängerform ohne eingebettete E-Mail-Dateien in 5. Fassung 9 ergänzt die
bereits abgeschlossenen, noch nicht zugeordneten Inaktivitätsphasen in
`timer_idle.previous_periods`; ältere Archive erhalten eine leere Liste. Die genaue Ergänzung älterer
Archive steht bei `parseArchive`. Die früheren Fassungen bleiben als solche
lesbar; die Anwendung rät keine unbekannte Bedeutung.

Beim Einspielen werden die Pfade übernommener Dateien auf den Zielrechner
umgesetzt. Fehlen deren Bytes sowohl in einer älteren Sicherung als auch auf
dem Rechner, nennt das Ergebnis die Anzahl fehlender Dateien. Auch nicht lesbare
Bildkopien und übernommene Dateien werden beim Sichern als Warnungen ausgewiesen.

### Round-Trip und Erweiterung

Vor dem ersten Schreiben werden Umschlag, alle Tabellen, Spalten und skalaren
Werte geprüft. Der Tabellenbestand wird in einer Transaktion ersetzt und die
Datenbank-Trigger werden anschließend in ihrer ursprünglichen Definition
wieder eingesetzt. Fremdschlüssel werden spätestens beim Festschreiben
geprüft. Bildkopien und übernommene Dateien werden unter ihren erzeugten Namen restauriert.
Der Dateischritt ist keine gemeinsame Transaktion mit SQLite; Fehler und Warnungen
werden deshalb vom Import ausdrücklich zurückgemeldet.

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

Fassung 10 enthält `todo_priority` (Name und Gewichtung) und `todo.priority_id`. Ältere Archive erhalten eine leere Prioritätsliste und keine Zuordnung.
