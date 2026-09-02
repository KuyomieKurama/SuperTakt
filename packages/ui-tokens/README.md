# @takt/ui-tokens

Die Design-Token von Takt als CSS-Variablen — Farben, Schrift, Abstände, Radien, Schatten,
Bewegung. Zwei Ebenen: Primitive (`--takt-<rampe>-<stufe>`) und semantische Token
(`--bg-*`, `--text-*`, `--border-*`, `--status-*`). In Bausteinen wird ausschließlich die
semantische Ebene benutzt.

## Warum ein eigenes Paket

Das Outlook-Add-in braucht dieselben Werte wie die Oberfläche (A-10.6). Vor T-008a lag
`tokens.css` unter `apps/web/src/styles/`; das Add-in hätte sich eine Kopie ziehen müssen,
und zwei Kopien von 606 Zeilen Farbwerten laufen auseinander. Der frontend-dev hat das in
T-006 als offene Frage 1 gemeldet, T-008a hat das Paket daraufhin angelegt.

## Hoheit

Der **Inhalt** von `tokens.css` gehört dem frontend-dev. T-008a hat die Datei unverändert
verschoben und nur die Paketdateien darum herum angelegt. Änderungen an Token laufen über
das Designsystem (`apps/web/design/DESIGNSYSTEM.md`) und, seit E-024, über eine
Entscheidung — nicht nebenbei in einer Aufgabe.

## Benutzung

```ts
import '@takt/ui-tokens/tokens.css';
```

Die Kontrastwerte werden mit `apps/web/scripts/contrast-check.mjs` nachgemessen. Das Skript
liest die Datei direkt vom Dateisystem und muss nach dem Umzug auf den neuen Pfad zeigen —
siehe Bericht T-008a, offene Fragen.
