# apps/web — Oberfläche und Designsystem von Takt

Reines Vite + React + TypeScript. **Tauri wird hier nicht gebraucht**, es ist keine
Rust-Toolchain nötig (E-014, R-04). Die Tauri-Hülle kommt in T-008 als eigenes Paket
`apps/desktop` dazu.

## Musterseite ansehen

```bash
pnpm install      # an der Wurzel des Arbeitsbereichs, nicht in apps/web
pnpm dev          # kurz fuer: pnpm --filter @takt/web dev
```

Danach im Browser `http://127.0.0.1:5173` öffnen. Der Entwicklungsserver bindet bewusst nur an
die Loopback-Adresse; Takt läuft lokal (E-001).

Alternativ ohne laufenden Entwicklungsserver:

```bash
pnpm build && pnpm preview     # http://127.0.0.1:4173
```

Die Seite beginnt mit einer Einleitung, die kein Vorwissen voraussetzt: was man sieht, worauf
man achten soll und wie man die Seite bedient. Oben rechts stehen zwei Schalter:

* **Hell / Dunkel / System** — beide Farbmodi und die Systemeinstellung.
* **Normal / Kompakt** — die zwei Zeilendichten für Tabellen und Listen.

Fünf Stellen tragen die Substanz:

* **Abschnitt 2 — Exportstatus.** Mit **Graustufenprobe**: ein Klick zeigt, dass die drei
  Darstellungen auch ohne Farbe unterscheidbar bleiben. Darunter steht die dokumentierte
  Entscheidung zur Darstellung einer zurückgesetzten Buchung — und der Satz, dass „Erneut offen“
  kein dritter Wert des Exportstatus ist (E-032).
* **Abschnitt 4 — Exportvorschau nach Tagesgruppen.** Eine Exportzeile ist ein Todo an einem
  Kalendertag (E-020). Die erste Gruppe aufklappen und die mittlere Buchung herausnehmen: Die
  gerundete Zeit fällt sofort von 0,75 auf 0,25 (E-031).
* **Abschnitt 5 — Kanban-Board.** Statusspalte und Erledigt-Kennzeichen sind zwei unabhängige
  Dinge. Alle vier Kombinationen stehen auf dem Board, auch die zwei überraschenden. Der
  Abspielknopf auf der erledigten Karte führt den Klickpfad I-05 vor. Darunter zeigen zwei
  Pool-Ansichten, dass erledigte Todos dort ausgeblendet sind und ein reaktiviertes wieder
  erscheint (E-039).
* **Abschnitt 7 — Vermerk und Leistung.** Die zwei Textfeldarten (E-016), ebenfalls mit
  Graustufenprobe.
* **Abschnitt 10 — Wenn Takt nicht vollständig startet.** Die drei Zustände, die die
  Anwendungshülle beim Start meldet: unvollständiger Start, beendeter lokaler Dienst und ein
  Datenordner, der mitkopiert wird (R-13). Jeder einzeln und in Kombination einschaltbar. Der
  dritte Schalter legt eine Sperrmeldung über die Seite — sie hat genau einen Ausgang, und der
  steht im Dialog. Jede der drei Meldungen trennt Klartext und technischen Zusatz: oben, was
  ist; darunter unter „Für die Systembetreuung“ das, was man weitergibt.

Alles ist mit der Tastatur bedienbar. Zum Prüfen: `Tab` von oben durchgehen. Der erste
Tabulator-Halt ist die Sprungmarke „Zum Inhalt springen“.

## Befehle

| Befehl | Zweck |
|---|---|
| `pnpm dev` | Entwicklungsserver auf `127.0.0.1:5173` |
| `pnpm build` | Typprüfung und Produktionsbau nach `dist/` |
| `pnpm preview` | gebaute Fassung auf `127.0.0.1:4173` |
| `pnpm typecheck` | `tsc --noEmit`, keine `any`-Typen zugelassen |
| `pnpm contrast` | misst alle Farbpaare gegen WCAG 2.2 AA, Fehlercode bei Unterschreitung |
| `pnpm contrast:md` | dasselbe als Markdown-Tabelle |

Von der Wurzel des Arbeitsbereichs aus laufen dieselben Skripte über den Paketfilter, zum
Beispiel `pnpm --filter @takt/web contrast`. An der Wurzel selbst gibt es kein `contrast`-Skript.

## Aufbau

```
packages/ui-tokens/tokens.css  Farb-, Schrift-, Abstands-, Radien-, Schatten-Token.
                               Liegen seit T-008a auszerhalb von apps/web, weil das
                               Outlook-Add-in dieselben Werte braucht (A-10.6, E-040).
apps/web/
  design/DESIGNSYSTEM.md     Das Designsystem in Worten. Verbindlich.
  scripts/contrast-check.mjs Kontrastmessung gegen packages/ui-tokens/tokens.css.
  src/
    styles/
      base.css               Zuruecksetzen, Fokus, Bewegungsvorbehalt, Hilfsklassen.
                             Bleibt hier: Grundlayout einer eigenstaendigen Anwendung,
                             das ein Outlook-Fenster nicht wollen wuerde (E-040).
      components.css         Alle Bausteine. Enthaelt keinen einzigen rohen Farbwert.
      showcase.css           Nur das Geruest der Musterseite.
    lib/                     cx(), Theme- und Dichte-Haken, Wert-zu-Beschriftung.
    components/              Die Bausteine. Keine Fachlogik.
    showcase/                Die Musterseite und ihre erfundenen Beispieldaten.
```

## Regeln für Änderungen

1. Keine rohen Farbwerte in `components.css`. Erst ein semantisches Token anlegen.
2. Keine Fachlogik. Dauer, Exportwert, Datum und Base64 kommen fertig formatiert von außen.
   Fehlt eine Funktion, wird sie gemeldet statt nachgebaut. Die Beispielwerte in
   `src/showcase/data.ts` folgen der Rundungsregel aus E-008 — aufwärts auf die nächste
   Viertelstunde, mindestens 0,25 — sind aber feste Zeichenketten, keine Rechnung.
3. Kein `any`. `tsconfig.json` läuft mit `strict`, `noUncheckedIndexedAccess` und
   `exactOptionalPropertyTypes`.
4. Wer ein Farbtoken ändert, ergänzt das Paar in `scripts/contrast-check.mjs` und lässt
   `pnpm contrast` laufen. Das Skript liest `packages/ui-tokens/tokens.css` ohne Vite direkt vom
   Dateisystem — eine Zuordnung im Bündler hilft ihm nicht.
5. Jede neue Ziehbewegung braucht eine Alternative ohne Ziehen (WCAG 2.2 SC 2.5.7).
6. Jeder neue Zustand braucht ein zweites Merkmal neben der Farbe.
7. Der **Exportstatus bleibt zweiwertig** (A-6.9, E-032). Filter, Abfragen und Exportauswahl
   greifen auf `ExportStatus` zu, nie auf `ExportDisplayState`. „Erneut offen“ ist eine
   Darstellung und nie ein Filterkriterium.
8. Deutsche Beschriftungen zu Datenwerten stehen in `src/lib/labels.ts`, nicht in der Ansicht
   (E-041).
9. Begriffe: das Feld am Todo heißt **Vermerk**, das an der Buchung **Leistung** (E-016). Der
   Exportschlüssel bleibt `Notiz` (A-8.2). „Erledigt“ ist ein Kennzeichen am Todo und nicht die
   letzte Kanban-Spalte — die Oberfläche darf aus einem Spaltennamen nie auf „erledigt“
   schließen. Der Bereich heißt **Zeiterfassung**, das Bedienelement **Timer**; „Time-Tracking“
   und „Ticket“ kommen nicht vor (E-029, E-030).

## Erledigt seit T-008a

`pnpm-workspace.yaml` und `pnpm-lock.yaml` liegen nicht mehr hier, sondern an der Projektwurzel.
`tokens.css` liegt in `packages/ui-tokens`, und `src/main.tsx` sowie `scripts/contrast-check.mjs`
verweisen seit T-018 unmittelbar dorthin. Die Zuordnung unter `resolve.alias` in
`vite.config.ts`, die das übergangsweise überbrückt hat, ist ersatzlos entfallen.
