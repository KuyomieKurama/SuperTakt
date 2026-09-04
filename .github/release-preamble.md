Takt verwaltet Todos, erfasst Zeiten und erzeugt Exportdateien für die Abrechnung.
Alle Daten bleiben auf dem Rechner, auf dem es läuft.

## Welche Datei für welches System

| Datei | System | Anmerkung |
|---|---|---|
| `Takt_<fassung>_x64-setup.exe` | Windows 10/11, 64 Bit | Installiert in das Benutzerprofil, kein Administratorkonto nötig |
| `Takt_<fassung>_aarch64.dmg` | macOS auf Apple Silicon (M1 und neuer) | **Nicht** für Macs mit Intel-Prozessor |
| `Takt_<fassung>_amd64.deb` | Debian, Ubuntu und Verwandte, 64 Bit | Gebaut auf Ubuntu 24.04, verlangt glibc 2.39 oder neuer |
| `Takt_<fassung>_amd64.AppImage` | Linux ohne Paketverwaltung, 64 Bit | Ausführbar machen und starten, keine Installation; dieselbe glibc-Grenze |

Für Macs mit Intel-Prozessor gibt es in dieser Fassung **keine** Datei. Das ist
keine Auslassung, sondern eine offene Stelle: Sie wurde nie gebaut und nie
geprüft.

## Diese Dateien sind nicht signiert

Das ist der wichtigste Satz dieser Beschreibung, deshalb steht er weit oben.

Ein Signaturzertifikat kostet Geld und einen Antrag. Solange darüber nicht
entschieden ist, gehen die Dateien unsigniert heraus. Beide Betriebssysteme
halten sie deshalb beim ersten Start an — nicht, weil an ihnen etwas
auffällig wäre, sondern weil sie **keine** Herkunftsangabe tragen, die das
System prüfen könnte.

**Windows.** Beim Start der `.exe` erscheint „Der Computer wurde durch
Windows geschützt". Der Weg führt über „Weitere Informationen" zu „Trotzdem
ausführen". Ohne diesen Klick startet der Installer nicht.

**macOS.** Beim ersten Öffnen meldet das System, die Anwendung stamme von einem
nicht verifizierten Entwickler, und bietet nur „In den Papierkorb legen" an.
Der Weg führt über *Systemeinstellungen → Datenschutz & Sicherheit*; dort steht
nach dem gescheiterten Versuch ein Knopf „Dennoch öffnen". Ein Rechtsklick auf
das Programmsymbol genügt seit macOS 15 nicht mehr.

Wer lieber die Befehlszeile benutzt:

```
xattr -dr com.apple.quarantine /Applications/Takt.app
```

**Linux.** Keine Warnung. Die `.AppImage` muss ausführbar gemacht werden:

```
chmod +x Takt_<fassung>_amd64.AppImage
```

## Die heruntergeladene Datei prüfen

Die SHA-256-Prüfsummen aller Dateien stehen weiter unten in dieser Beschreibung.
Sie sind während des Baus entstanden, nicht danach von Hand eingetragen.

```
# Linux und macOS
sha256sum Takt_<fassung>_amd64.deb
shasum -a 256 Takt_<fassung>_aarch64.dmg

# Windows (PowerShell)
Get-FileHash .\Takt_<fassung>_x64-setup.exe -Algorithm SHA256
```

Weicht ein Wert ab, ist die Datei unvollständig heruntergeladen oder verändert
worden. In beiden Fällen: nicht ausführen.

## Lizenzen

Takt selbst steht unter der MIT-Lizenz.

In jedem Paket liegt `THIRD-PARTY-LICENSES.txt` — die Lizenztexte aller
mitgelieferten Fremdbestandteile, darunter die eingebettete Node-Laufzeit, die
Fensterschicht unter Apache-2.0 und ein Bestandteil unter MPL-2.0 mit dem
zugehörigen Hinweis auf die Quelltextverfügbarkeit. Dieselbe Datei hängt
zusätzlich an dieser Fassung, je Plattform eine: Der Abhängigkeitsbaum
unterscheidet sich zwischen Windows, macOS und Linux, und damit die Liste.

## Was noch offen ist

- **Keine Signatur**, siehe oben.
- **Kein Intel-Mac.**
- **Kein Linux mit älterer glibc.** Die Linux-Dateien entstehen auf Ubuntu 24.04
  und verlangen glibc 2.39. Auf Ubuntu 22.04 oder Debian 12 starten sie nicht.
- **Das Outlook-Add-in** wird mitgeliefert, ist aber auf keinem echten
  Windows-Rechner mit Outlook geprüft worden.
- **Automatische Aktualisierung** gibt es nicht. Eine neue Fassung wird von Hand
  heruntergeladen und installiert.
