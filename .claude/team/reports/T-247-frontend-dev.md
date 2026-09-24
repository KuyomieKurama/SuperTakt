# T-247-7 — `proof:foreign` sieht unter Windows null Quelldateien statt 129

Aufgabe: T-247-7 — Pfadvergleich in `apps/web/scripts/proof-foreign.mjs`
Status: fertig

## Artefakte

- `apps/web/scripts/proof-foreign.mjs` (einzige geänderte Datei, +126/−14)

## Zusammenfassung

Der Befund von domain-dev ist bestätigt und behoben. `ts.SourceFile.fileName` trägt immer
Schrägstriche, `srcRoot + path.sep` unter Windows einen Rückstrich; beide Vergleiche (Zeile 246
und 850) trafen nie. Der Lauf urteilte über **0 statt 129** Quelldateien und stand bei 13/7.
Neu gibt es in Abschnitt 0a eine einzige Schreibweise für Pfade — `slashed` (absolut, Schrägstriche),
`comparable` (zusätzlich Groß-/Kleinschreibung nach `ts.sys.useCaseSensitiveFileNames`),
`insideSrc`, `sameFile` und `displayPath`. `path.sep` kommt in keinem Vergleich der Datei mehr vor.
Zusätzlich zu den zwei genannten Zeilen sind die Vergleiche der Überlagerung im `CompilerHost`
(vormals `path.resolve(name) === target`, dreimal) auf `sameFile` umgestellt, die Nachschlagewege
in den Übersetzer (`program.getSourceFile(...)`, dreimal) auf `slashed`, und die Ausgabe der
Fundstellen (`where`, `compilerFindings`) auf `displayPath` — damit heißt ein Fund unter Windows
zeichengleich so wie unter Linux. `new URL(...).pathname` kommt in der Datei nicht vor; der
Einstieg läuft korrekt über `fileURLToPath`.

Die Zählwächter aus Abschnitt 2, 3, 5, 6 und 8 sind unverändert. Sie sind der Grund, warum der
Fehler überhaupt sichtbar war, und keiner ist abgeschwächt. Verschärft wurde eine Stelle: In
Abschnitt 2 steht neben `sourceFiles.length > 60` jetzt die Prüfung „und jede Datei unter `src`
liegt tatsächlich im Programm". Sie liest das Verzeichnis mit `node:fs` — **nicht** aus
`parsedConfig.fileNames`, denn Konfigurationsliste und geladene Dateien stammen aus derselben
Quelle und wären bei einem Pfadfehler gemeinsam auf null gegangen (`0 === 0` wäre grün gewesen) —
und vergleicht die Menge, nicht nur die Zahl. Eine Untergrenze sagt „nicht null", diese Prüfung
sagt „alle" und nennt die fehlenden Dateien beim Namen.

## Zahlen

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm run proof:foreign` | 13 bestanden, **7 fehlgeschlagen**; 0 Quelldateien, 0 behandelte Übergaben, 0 Eingabefelder, 0 Reihen, 0 Übergangsstellen | **21 bestanden, 0 fehlgeschlagen**; **129 Quelldateien**, 174 behandelte Übergaben, 29 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 6 Aufrufen |
| `pnpm run proof:all` | hing an `proof:foreign` | **Exit 0**, alle Läufe grün (u. a. 45, 114, 56, 154, 45, 109, 98, 72, 29, **21**, 27, 32, 44, 31, 30, 238 bestanden — 0 fehlgeschlagen in jedem) |
| `pnpm run typecheck` | — | grün, alle Pakete |
| `pnpm run boundaries` | — | grün |

Die 129 ist gegengemessen: `git ls-files apps/web/src` zählt 129 `.ts`/`.tsx`, das Verzeichnis auf
der Platte ebenfalls 129, davon keine `.d.ts`. Der Lauf lädt genau diese 129 — die neue Prüfung
vergleicht die Mengen und nicht nur die Zahl.

Gegenprobe zur Verschärfung: Eine Kopie des Skripts, in der `insideSrc` genau eine Datei
(`app/TimerBar.tsx`) ausschließt, macht die neue Prüfung rot („1 von 129 Dateien unter `src` sind
nicht im Programm … app/TimerBar.tsx"), während `sourceFiles.length > 60` grün bleibt. Die Kopie
ist nach der Messung gelöscht; der Arbeitsbaum enthält nur die eine geänderte Datei.

## Annahmen

1. `comparable` faltet die Groß-/Kleinschreibung nach `ts.sys.useCaseSensitiveFileNames`, also
   genau nach der Regel, nach der der Übersetzer selbst zwei Pfade für denselben hält. Unter Linux
   ändert das nichts, unter Windows deckt es `C:\Src` gegen `c:\src` ab.
2. Die neue Prüfung setzt voraus, dass **alles** unter `apps/web/src` in das Programm gehört. Das
   ist die Zusage, die der Kopf der Datei ohnehin macht („Alles außerhalb von `apps/web/src`" ist
   die einzige genannte Grenze). Ein `exclude` in `tsconfig.json`, das einen Teil von `src`
   herausnimmt, macht sie rot — richtigerweise, denn dann urteilte der Lauf über ungelesene
   Dateien.
3. Die Ausgabe der Fundstellen ist auf Schrägstriche vereinheitlicht. Das ändert nur Text, keine
   Prüfung; der Filter der Gegenproben (`finding.includes("eingesetzt.ts")`) trägt weiterhin.

## Risiken

- **Klasse statt Tippfehler.** Dies ist der fünfte Fund derselben Familie. Die übrigen Nachweise
  außerhalb meiner Hoheit sind nicht geprüft: Wer `ts.SourceFile.fileName`, `ts.sys`-Pfade oder
  `new URL(...).pathname` gegen `node:path` hält, hat denselben Fehler. Ein Vorschlag dazu steht
  unter „Nächster Schritt".
- Kein Sicherheitsbezug: Die Änderung betrifft ausschließlich ein Prüfskript, keinen
  Laufzeitcode und keine Oberfläche.

## Offene Fragen

Keine an dieser Stelle. Der Auftrag war eng und ist gemessen abgeschlossen.

## Nächster Schritt

Ein eigener Auftrag, der **alle** Nachweisskripte gegen dieselbe Klasse absucht (Muster:
`path.sep`, `path.join`/`path.resolve` gegen einen Wert aus dem Übersetzer oder aus `ts.sys`,
`new URL(...).pathname`) — und, weil eine Suche nur den heutigen Stand trifft, ein kleiner
Wächter, der einen solchen Vergleich in `apps/*/scripts/**` überhaupt verbietet. Die Zählwächter
haben diesen Fund gerettet; nicht jeder Nachweis hat einen.
