# SuperTakt

SuperTakt ist eine lokale Anwendung zum Verwalten von Todos, zum Erfassen von Arbeitszeit und zum
Export dieser Zeit an ein externes Abrechnungstool. Dazu kommen ein Kanban-Board, frei
verschachtelbare Tags und Ordner, konfigurierbare Todo-Pools und ein Outlook-Add-in, mit dem sich
Todos direkt aus einer E-Mail heraus anlegen lassen.

SuperTakt läuft vollständig auf dem eigenen Rechner. Es gibt keine Cloud-Anbindung, keinen
Datenbankserver und keine Telemetrie; gespeichert wird in einer eingebetteten SQLite-Datei im
Anwendungsdatenverzeichnis. Diese Entscheidung ist architektonisch verankert: Die Fachlogik in
`packages/domain` kennt weder HTTP noch SQL, sodass sich der Speicherweg austauschen ließe, ohne
die Fachlogik anzufassen, falls sich die Vorgabe „lokal, zumindest derzeit" einmal ändert.

Wer die Anwendung benutzt, statt an ihr zu arbeiten, findet das vollständige Benutzerhandbuch unter
`docs/benutzerhandbuch.md`. Wer daran weiterarbeitet, findet den Aufbau des Projekts und die
wichtigsten Lehren aus seiner Entstehung im `docs/entwicklerhandbuch.md`. Begriffe, die auf dem
Bildschirm und im Code unterschiedlich heißen könnten, aber es nicht tun sollen, stehen in
`docs/glossar.md`.

## Name und bestehende Installationen

Der sichtbare Produktname lautet SuperTakt. Bestehende Datenpfade (`Takt` unter Windows,
`takt` unter Linux), die Anwendungskennung `de.takt.desktop`, interne `@takt/*`-Pakete
und Schnittstellenkennungen bleiben kompatibel. Die Erzeugerkennung `Takt` im
versionierten Datenarchiv bleibt erhalten. SuperTakt liest Archivfassungen 1, 2 und 3;
neue Sicherungen verwenden Fassung 3 und benötigen diese oder eine neuere App-Version.

Unter **Einstellungen → Darstellung** lässt sich zwischen **Klassisch** (bisheriges
Layout) und **Klar** (ruhigere Navigation und Arbeitsfläche) wählen. Farbmodus und
Zeilendichte sind separat einstellbar und werden ebenfalls dauerhaft gespeichert.
Klar ist der Standard für neue und aktualisierte Installationen ohne bisherige Theme-Auswahl. Eine gespeicherte Auswahl bleibt erhalten. Die Gestaltung ist in
`docs/design/supertakt-layout.md` beschrieben.

## Timer und Leistung

Unter **Einstellungen → Timer** lässt sich **Leistung beim Stoppen abfragen**
ausschalten. Der Timer bucht dann direkt; vorhandener Leistungstext bleibt erhalten.
Fehlende Leistung lässt sich später in der Buchungsübersicht ergänzen. Die Auswahl
wird dauerhaft gespeichert und ist zunächst eingeschaltet.

## Outlook lokal einrichten

In der Windows-Desktop-App führt **Einstellungen → Outlook-Add-in** durch die
Zertifikatsprüfung. Prüfen Sie Inhaber, Gültigkeit und SHA-256-Fingerabdruck und
bestätigen Sie **Zertifikat prüfen und vertrauen**. Erst diese Bestätigung
hinterlegt das konkrete lokale Serverzertifikat für Ihr Windows-Benutzerkonto.
Bestätigen Sie auch die Windows-Sicherheitsabfrage; der Assistent wartet dafür
bis zu drei Minuten. Bei Abbruch wird kein erfolgreicher Abschluss behauptet.
Danach prüft SuperTakt die Add-in-Seite über HTTPS. Fehlende Zertifikate, ein
nicht erreichbarer Server oder Windows-Richtlinien werden als Fehler angezeigt.

Anschließend importieren Sie `apps/outlook-addin/manifest.xml` in Outlook und
verbinden das Add-in mit dem Zugangstoken aus demselben Einstellungsbereich.
SuperTakt muss dafür laufen. Eine Domain ist für diese lokale Einrichtung nicht nötig.
Im Browser und auf anderen Betriebssystemen ist die Windows-Zertifikatseinrichtung
nicht verfügbar. Nach einer Zertifikatserneuerung muss das neue Zertifikat erneut
bestätigt werden. Alte Einträge werden nicht automatisch aus dem Windows-Speicher entfernt.

## Aufbau

Ein pnpm-Arbeitsbereich mit acht Paketen:

```
packages/domain        Fachlogik: Rundung, Timer-Regeln, Exportstatus, Tag-Baum. Ohne HTTP, ohne SQL.
packages/storage        Ausgehende Ports und der SQLite-Adapter.
packages/export         Der Exportvorlagen-Motor.
packages/ui-tokens      Geteilte Farb-, Schrift- und Abstands-Token für Oberfläche und Add-in.
apps/local-api          Der lokale Dienst: HTTP, Token-Prüfung, Anwendungsfälle.
apps/web                Die Oberfläche, React und Vite.
apps/desktop            Die Tauri-Hülle um den lokalen Dienst und die Oberfläche.
apps/outlook-addin      Das Outlook-Add-in, Office.js.
```

Details, Begründungen und Paketgrenzen: `docs/architektur.md` und `docs/entwicklerhandbuch.md`.

## Starten

Voraussetzung ist Node ab Fassung 22.5 und pnpm; die genauen Mindestfassungen stehen im
Wurzel-`package.json`. Für die Tauri-Hülle wird zusätzlich eine Rust-Toolchain gebraucht.

```bash
pnpm install
```

Nur die Oberfläche, im Browser, ohne die Tauri-Hülle und ohne Rust-Toolchain:

```bash
pnpm dev
# http://127.0.0.1:5173
```

SuperTakt als Anwendung, mit Fenster und lokalem Dienst als Sidecar:

```bash
pnpm desktop
```

Der erste Aufruf von `pnpm desktop` baut den Sidecar mit und lädt dabei einmalig die benötigte
Node-Laufzeit; das braucht Netzzugang und etwas Zeit. Danach nicht mehr. Eine auslieferbare Fassung
mit Installationspaket entsteht mit:

```bash
pnpm desktop:build
```

Beide Befehle bauen den Sidecar, **führen den Nachweis gegen die gebaute Binärdatei aus** und
stellen das Bündel des Outlook-Aufgabenbereichs neben der Binärdatei bereit. Der Nachweis kostet
gemessen fünf Sekunden und ist der Grund, warum es ihn gibt: Er stand vorher nur in einer Kette, die
niemand aufrief, und deshalb ist eine Fassung ausgeliefert worden, die nicht startete (T-053).

## Prüfen

```bash
pnpm check
```

Das ist die vollständige Kette: Typprüfung über alle acht Pakete, erlaubte Importe zwischen den
Paketen, Kontrastmessung der Oberfläche gegen WCAG 2.2 AA, Abgleich der OpenAPI-Beschreibung des
lokalen Dienstes gegen sein tatsächliches Verhalten, die vollständige Testsuite mit
Abdeckungsschwelle, und der Bau aller Pakete.

Einzeln aufrufbar, unter anderem:

```bash
pnpm typecheck      # tsc --noEmit über alle Pakete
pnpm test           # Vitest, Einheiten- und Integrationstests
pnpm test:coverage  # dieselben Fälle mit Abdeckungsbericht
pnpm boundaries     # erlaubte Importe zwischen den Paketen
pnpm contrast       # Farbpaare der Oberfläche gegen WCAG 2.2 AA
```

Daneben bestehen in `apps/local-api` und `apps/outlook-addin` neun weitere Nachweispfade
(`proof:access`, `proof:export`, `proof:export-api`, `proof:taskpane`, `proof:addin-wiring`,
`proof:route-policy`, `proof:template-fields`, `proof:db-permissions`, `proof:addin`), die
zusammen mit `pnpm proof:openapi` die zehn Nachweispfade des Projekts bilden. Sie stehen nicht alle
in `pnpm check`, weil ein Teil von ihnen den lokalen Dienst auf seinem festen Port startet und
deshalb nicht neben einem bereits laufenden SuperTakt bestehen kann. Details dazu im
Entwicklerhandbuch.

Ende-zu-Ende-Tests laufen mit Playwright:

```bash
pnpm test:e2e
```

### Der Nachweis gegen das Erzeugnis

`pnpm check` prüft den **Quelltext**. Es gibt eine zweite Kette, die die **gebaute
Sidecar-Binärdatei** startet und ihr zwanzig Fragen stellt — von „kommt sie ohne Startgeheimnis
gar nicht erst hoch" bis „findet sie ihr Bündel des Aufgabenbereichs neben sich":

```bash
pnpm verify:bundle   # baut den Sidecar und führt den Nachweis aus
pnpm sidecar:verify  # nur den Nachweis, gegen die zuletzt gebaute Datei
```

Sie steht bewusst **nicht** in `pnpm check`: Sie braucht die Rust-Toolchain, baut rund 120 MiB und
belegt dabei die Ports 17843 und 17844, kann also nicht neben einem laufenden SuperTakt bestehen.
`pnpm check` soll schnell und oft laufen.

Sie gehört trotzdem vor jede Auslieferung und in jeden Durchlauf, der die Hülle, den lokalen Dienst
oder den Speicherweg anfasst. Der Grund steht in T-053: Elf Nachweispfade, 556 Testfälle und 28
Ende-zu-Ende-Fälle liefen an einer Anwendung vorbei, die nicht startete, weil sie alle aus dem
Quelltext laufen und keiner das Erzeugnis ausführte. `pnpm desktop` und `pnpm desktop:build` führen
den Nachweis seither selbst mit.

## Wo es weitergeht

- Was SuperTakt tut und wie man damit arbeitet: `docs/benutzerhandbuch.md`
- Aufbau, Paketgrenzen, Sicherheitsmodell und die Lehren aus der Entwicklung: `docs/entwicklerhandbuch.md`
- Begriffe mit ihrer Entsprechung im Code: `docs/glossar.md`
- Datenmodell und Migrationsverfahren: `docs/datenmodell.md`
- Architekturentscheidungen im Detail: `docs/architektur.md`
- Bedrohungsmodell: `docs/bedrohungsmodell.md`
- Testplan: `docs/testplan.md`
