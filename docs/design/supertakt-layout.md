# SuperTakt — Name und Arbeitsfläche

Anlass: Auftrag vom 2026-09-08, Spezifikation A-21.1 bis A-21.5.

## Befund aus dem bestehenden Projekt

Die Anwendung besitzt bereits ein gemeinsames Designsystem, getrennte Fachlogik,
eine lokale SQLite-Ablage und umfangreiche Prüfungen. `CLAUDE.md`,
`.claude/team/decisions.md`, die Berichte und `docs/design/` erklären insbesondere
die Statuskennzeichnungen, Sicherheitsmeldungen und die feste Fensterstruktur.
Diese Schutzmechanismen sind bei einem visuellen Umbau weiterhin relevant.

Die gleichförmigen Karten, flächigen Kennzahlen und eng beieinanderstehenden
Navigationspunkte geben bislang fast jedem Inhalt dasselbe Gewicht. Viele
Kommentare dokumentieren frühere Zwischenstände. Der Abschnitt „Befehle“ in
`CLAUDE.md` war noch auf dem Stand vor Einrichtung des Arbeitsbereichs.

## Umsetzung

Unter Einstellungen → Darstellung stehen „Klassisch“ und „Klar“ zur Wahl.
Klassisch behält das bisherige Layout. Klar ist der Standard für neue und
aktualisierte Installationen ohne bisherige Theme-Auswahl; eine bereits gespeicherte
Auswahl bleibt erhalten. Die folgenden Layoutänderungen gelten ausschließlich für Klar;
die neue Wortmarke gilt für beide Themes. Hell/Dunkel/System und Zeilendichte
sind unabhängig vom Theme wählbar. Alle drei Einstellungen werden in der lokalen
Datenbank gespeichert. Ein fehlgeschlagener Wechsel wird sichtbar gemeldet und
auf den vorherigen Zustand zurückgesetzt.

- Die Marke heißt sichtbar SuperTakt: Webtitel, Wortmarke mit ST-Kürzel,
  Desktop-Fenster und Menü, Installer-Metadaten, Outlook-Manifest und Meldungen.
- Die Seitenleiste ist 216 statt 240 Pixel breit. Abstände und Trennlinien
  gruppieren Aufgaben, Zeiterfassung/Abrechnung und Verwaltung. Einstellungen
  stehen am unteren Ende. Der aktuelle Eintrag besitzt zusätzlich eine Schiene.
- Das Dashboard zeigt Kennzahlen als gemeinsame Reihe mit ruhigen Trennlinien.
  Überfälligkeit behält ihre rote Schiene und Beschriftung. Die Aktionsknöpfe
  dürfen in schmalen Spalten umbrechen.
- Der Dashboard-Timer wird als kompakte Zeile dargestellt. Zuletzt bearbeitete
  Todos bekommen mehr Breite als die begleitende Buchungsliste.
- Karten und Kanban-Karten haben dezente Grenzen ohne dauerhafte Schatten.
  Eingabegrenzen, Fokus, Statusformen und Interaktionen bleiben erhalten.
- Kennzahlenbeschriftungen sind normale, gut lesbare Schrift statt kleiner
  Versalien; die kleinste gemeinsame Metadatenschrift steigt von 11 auf 12 Pixel.
- Bei schmaleren Fenstern wechseln Kennzahlen und Arbeitslisten in weniger
  Spalten. Die Navigation bleibt im bestehenden horizontalen Ersatzlayout.

Es kommen keine Webfonts, Netzwerkdienste oder zusätzlichen Abhängigkeiten dazu.
Heller und dunkler Modus verwenden weiterhin dieselben geprüften semantischen
Farbtokens. Die Fachlogik und die Notiz-/Exporttrennung werden nicht verändert.

## Kompatibilität

Der Produktname ist von technischen Identitäten getrennt. Insbesondere bleiben
`de.takt.desktop`, `@takt/*`, `X-Takt-Token`, `TAKT_*`, interne Menü-IDs,
Sidecar-Namen und die bestehenden Datenpfade erhalten. Unter Windows verwenden
Rust-Hülle und lokaler Dienst weiterhin `%LOCALAPPDATA%\Takt`.
Die Format- und Erzeugerkennungen bestehender Datenarchive ändern sich nicht.
Migration 0016 ergänzt Gestaltung und Dichte mit den Standardwerten `clear`
und `comfortable`. Neue Datenarchive tragen Schemafassung 3. Der Import von
Fassung 1 ergänzt diese Standardwerte; Fassung 2 bewahrt die gespeicherte Auswahl.
Migration 0017 ergänzt die abschaltbare Leistungsabfrage beim Timerstopp.
Archive der Fassungen 1 und 2 erhalten dafür den bisherigen Standard (eingeschaltet).
Fassung 3 bewahrt die gewählte Einstellung. Ältere App-Versionen können diese
neue Archivfassung nicht einlesen.
Historische Berichte und Quelltextkommentare werden nicht rückwirkend umgeschrieben.

## Prüfung und verbleibende Abnahme

Vor der Textänderung wurde „Takt“ sowohl in versionierten Tests (`git grep`)
als auch in den Quellverzeichnissen (`rg`) gesucht. Betroffene Erwartungen für
zugängliche Namen und Meldungen wurden gemeinsam mit der Oberfläche angepasst.
Die konkreten Laufresultate und Umgebungsgrenzen stehen im Pull Request.
Die visuelle Abnahme am echten Desktop-Fenster sowie ein Installer-Upgrade über
eine vorhandene Installation gehören vor die nächste Veröffentlichung.
