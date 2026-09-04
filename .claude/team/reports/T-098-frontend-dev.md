Aufgabe: T-098 — Windows-Build: Arbeitsbereichszählung in `build-sidecar.mjs`

Status: fertig

Artefakte:
- `apps/desktop/scripts/paths.mjs` — neu. Enthält `isInside(folder, file, path = nodePath)`: die
  Frage „liegt diese Datei in diesem Ordner" einmal, über `path.relative`, mit dem Pfadmodul als
  Parameter. Im Kopf steht der Befund und die Messung, warum `relative` und nicht `folder + sep`.
- `apps/desktop/scripts/build-sidecar.mjs` — die Ursache behoben. Die Zählung der
  Arbeitsbereichsdateien benutzt `isInside` statt eines `startsWith` gegen `ordner + '/'`. Der Kommentar über
  der Stelle nennt den Windows-Fall in zwei Sätzen; der Blockkommentar darüber trug außerdem eine
  Aussage über `@takt/storage`, die die Messung widerlegt, und ist berichtigt.
- `apps/desktop/scripts/verify-node-checksums.mjs` — zweiter Fund derselben Sorte:
  `runtimeFile.slice(repoRoot.length + 1)` ist Rechnen auf einem Pfad und jetzt
  `relative(repoRoot, runtimeFile)`.
- `apps/desktop/scripts/sidecar-runtime.mjs` — nur ein Kommentar: warum `archive.member.split('/')`
  hier richtig ist und `sep` falsch wäre.
- `apps/desktop/scripts/collect-licenses.mjs` — derselbe Kommentar an der entsprechenden Stelle.
- `apps/desktop/README.md` — Punkt 1 unter „Wie der Sidecar entsteht" nennt die Zählung, `isInside`
  und den Grund.
- `.claude/team/reports/T-098-frontend-dev.md` — dieser Bericht.

Nichts außerhalb von `apps/desktop/**` geändert. `apps/web/**` war nicht nötig, `.github/**`,
`packages/**` und die Wurzel-`package.json` habe ich nur gelesen. Der Prüflauf liegt im
Scratchpad und nicht im Repository.

Zusammenfassung:
Die vom Orchestrator gelesene Ursache stimmt: In `build-sidecar.mjs` stand die Zählung der
Arbeitsbereichsdateien als `input.startsWith(ordner + '/')`, und der Ordner kommt aus `join(...)`,
trägt unter Windows also Rückstriche. Der Vergleich `D:\…\apps\local-api\src\entry.ts` gegen
`D:\…\apps\local-api/` konnte nie zutreffen, deshalb meldete der Windows-Läufer für alle drei
Pakete null Dateien und brach unmittelbar danach mit „Der lokale Dienst selbst ist nicht im
Bündel" ab — an einem Bündel, das in Ordnung war. Die Vergleichsfrage steckt jetzt in
`isInside(folder, file, path)` in `scripts/paths.mjs` und wird über `path.relative` beantwortet:
Ein Weg, der weder leer noch absolut ist und nicht mit `..` beginnt, führt nach innen. Beim
vollständigen Lesen aller acht Skripte kam ein zweiter Fund derselben Art dazu
(`slice(repoRoot.length + 1)` in `verify-node-checksums.mjs`); die drei übrigen Verdachtsstellen
sind Archivmitglieder und URLs und bleiben mit Begründung im Kommentar stehen.

**Warum `relative` und nicht `folder + sep`.** Die Aufgabe nannte beide Formen und die Annahme,
`resolve` vereinheitliche unter Windows die Schreibweise des Laufwerksbuchstabens. Das habe ich
nicht geglaubt, sondern gemessen — mit Node 22.23.2 auf diesem Rechner, über `path.win32`:

```
path.win32.resolve('d:\\a\\B\\x.ts')                    → 'd:\\a\\B\\x.ts'
path.win32.relative('D:\\a\\x', 'd:\\a\\x\\y.ts')       → 'y.ts'
path.win32.relative('D:\\a\\APPS\\l', 'D:\\a\\apps\\l\\x') → 'x'
```

`resolve` normalisiert die Groß-/Kleinschreibung also **nicht** — es setzt nur so lange Segmente
davor, bis der Pfad absolut ist, und ein bereits absoluter Pfad bleibt Zeichen für Zeichen, wie er
ist (so auch die Beschreibung von `path.resolve` in der Node-Dokumentation zu v22). `relative`
dagegen vergleicht unter `win32` ohne Rücksicht auf Groß- und Kleinschreibung, so wie das
Dateisystem darunter, und verträgt einen abschließenden Trenner. Damit ist `startsWith(folder + sep)`
die Form, die bei `d:` gegen `D:` bricht, und `relative` die, die es nicht tut. Das ist die
Entscheidung, und sie steht so auch im Kopf von `paths.mjs`.

**Nachweis ohne Windows-Rechner.** `isInside` nimmt das Pfadmodul als dritten Parameter, Vorgabe ist
das der Plattform. Der Lauf liegt unter
`/tmp/claude-1000/-home-kerem-Projects-SuperTakt/4f131c0f-ab80-4924-8b6b-4af64055e5b4/scratchpad/proof-isinside.mjs`
und hält jeden Fall zusätzlich gegen die alte Form (Spalte `alt`):

```
  ok   win32  isInside=true  (alt: false)  der Fall aus dem Auslieferungslauf
  ok   win32  isInside=true  (alt: false)  Laufwerksbuchstabe klein statt gross
  ok   win32  isInside=false (alt: false)  Nachbarordner mit gleichem Anfang
  ok   win32  isInside=false (alt: false)  anderes Paket
  ok   win32  isInside=false (alt: false)  anderes Laufwerk
  ok   win32  isInside=true  (alt: false)  Ordner mit Schlusstrenner
  ok   win32  isInside=false (alt: false)  der Ordner selbst
  ok   posix  isInside=true  (alt: true )  derselbe Fall unter POSIX
  ok   posix  isInside=false (alt: false)  Nachbarordner mit gleichem Anfang
  ok   posix  isInside=false (alt: false)  anderes Paket
  ok   posix  isInside=true  (alt: false)  Ordner mit Schlusstrenner
  ok   posix  isInside=false (alt: false)  der Ordner selbst

12 von 12 Fällen wie erwartet.
Exitcode: 0
```

Die drei von der Aufgabe verlangten Fälle sind Zeile 1, 3 und 4 (`…\apps\local-api` gegen
`…\apps\local-api\src\entry.ts` wahr, gegen `…\apps\local-api-alt\x.ts` falsch, gegen
`…\packages\domain\src\x.ts` falsch) und ihre POSIX-Entsprechungen in Zeile 8 bis 10. Die
`alt`-Spalte ist der eigentliche Befund: Unter `win32` liefert die alte Form in **jeder** Zeile
`false`, auch dort, wo `true` richtig wäre — genau das Bild aus dem Auslieferungsprotokoll.

**Alle acht Skripte gelesen.** Was ich gefunden und was ich bewusst stehen gelassen habe:

| Stelle | Bewertung |
|---|---|
| `build-sidecar.mjs:259` | Der Befund. Behoben. |
| `verify-node-checksums.mjs:170` — `runtimeFile.slice(repoRoot.length + 1)` | Behoben. Die Längenrechnung geht heute auf, weil beide Pfade aus derselben `join`/`resolve`-Kette stammen; sie schneidet aber ein Zeichen zu viel ab, sobald `repoRoot` auf einen Trenner endet. Gemessen mit `path.win32`: `relative('D:\\', 'D:\\scripts\\x.mjs')` → `scripts\x.mjs`, die alte Form → `cripts\x.mjs`. Das steht nur in einer Fehlermeldung, ist also kein Blocker, aber es ist dieselbe Sorte Annahme. |
| `sidecar-runtime.mjs:205` und `collect-licenses.mjs:318` — `archive.member.split('/')[0]` | Bleibt. `member` ist ein **Archivmitglied**, kein Pfad des Betriebssystems: tar und ZIP trennen mit dem Schrägstrich, auch im Windows-Archiv, und der Wert wird an `tar` übergeben. Ein `sep` wäre hier der Fehler. Steht jetzt als Kommentar an beiden Stellen. |
| `collect-licenses.mjs:333` — `join(scratch, licenseMember)` | Bleibt. `join` normalisiert die Schrägstriche des Archivmitglieds selbst zu Trennern der Plattform (`path.win32.join('D:\\a', 'b/c')` → `D:\a\b\c`, gemessen). |
| `build-taskpane.mjs:144/146` — `value.startsWith('./')`, `value.replace(/^\.?\//, '')` | Bleibt. Das sind **URLs** aus `src`/`href` der `index.html`, nicht Pfade; sie tragen auf jeder Plattform Schrägstriche. `join` macht daraus einen Pfad und normalisiert dabei. |
| `build-app.mjs`, `collect-release.mjs`, `verify-sidecar.mjs`, `make-icon.mjs` | Ohne Fund. Alle Pfade entstehen über `join`/`resolve` und werden über `relative` ausgegeben; die `split('\n')`-Stellen zerlegen die Ausgabe von `rustc`, keine Pfade. |

Zusätzlich den Rust-Anteil überflogen: `appdata.rs:291` prüft mit `starts_with("\\\\")` auf einen
UNC-Pfad — das ist die richtige Prüfung für genau diese Frage und bleibt; `identity.rs:163` ist
`to_string_lossy` auf einer C-Zeichenkette und hat mit Pfaden nichts zu tun.

Läufe:
- `node scripts/build-sidecar.mjs` aus `apps/desktop` (so ruft `app:build` es auf) —
  **Exitcode 0**. `rustc 1.89.0` liegt vor, das Node-Archiv lag im Zwischenspeicher, es war also
  kein Netz nötig. Ausgabe von Schritt 2:
  ```
  [2/5] Prüfen, dass nichts extern geblieben ist
        @takt/local-api: 40 Datei(en) — im Bündel
        @takt/domain: 9 Datei(en) — im Bündel
        @takt/storage: 19 Datei(en) — im Bündel
  ```
  Vorher standen dort unter Windows drei Nullen. Unter Linux zählte die alte Form richtig, die
  Zahlen ändern sich hier also nicht — was zugleich zeigt, dass die Behebung nichts verschiebt.
- `pnpm check` an der Wurzel — **Exitcode 0** (Typen, Grenzen, Kontraste, vier Nachweisläufe,
  Tests mit Abdeckung 90,88 % Anweisungen / 83,06 % Zweige, Bau aller Pakete).
- `node --check` über alle neun Skripte in `apps/desktop/scripts/` — Exitcode 0.
- `verify-sidecar.mjs` und `pnpm desktop:build` **nicht** gelaufen, wie in der Aufgabe vorgegeben:
  beide belegen 17843 und 17844.

Annahmen:
- Ich habe `isInside` in eine **eigene** Datei gelegt statt in `build-sidecar.mjs`. Grund: Dieses
  Skript führt beim Import den ganzen Bau aus — eine Funktion daraus zu importieren hieße, esbuild
  laufen zu lassen und 31 MiB zu laden. Als eigenes Modul ist sie ohne Nebenwirkung importierbar
  und damit überhaupt erst prüfbar.
- Der Ordner selbst gilt **nicht** als „innerhalb" (`isInside(x, x) === false`). Für die Zählung
  ist das folgenlos, weil dort nur Dateien anstehen; für die nächste Verwendung ist es die
  Festlegung, die ich getroffen habe, und sie steht im Kopf der Funktion.
- Die Aussage im Blockkommentar von `build-sidecar.mjs`, `@takt/storage` liefere „heute nur Typen",
  habe ich durch die gemessenen Zahlen ersetzt. Sie war schlicht falsch — das Paket steckt mit 19
  Dateien im Bündel — und stand direkt über der Stelle, an der der Zähler wieder zählt.
- Die vier Kommentare (`sep` vs. `/`, Archivmitglieder) sind Ergänzungen ohne Verhaltensänderung.
  Ich habe sie geschrieben statt sie nur in diesen Bericht zu setzen, weil die nächste Person am
  Code steht und nicht am Bericht.

Risiken:
- **Keine Sicherheitsauswirkung.** Der Zähler entscheidet nichts über das Erzeugnis, er berichtet
  über das Metadatenblatt. Behoben ist ein falsch **negativer** Abbruch; die Prüfung wird dadurch
  nicht schwächer, sondern zum ersten Mal überhaupt unter Windows wirksam. Die Prüfung „nichts
  extern geblieben" (R-04) ist unberührt.
- **Diese Änderung ist unter Windows nicht ausgeführt worden.** Belegt ist sie über `path.win32`
  auf einem Linux-Rechner. Das ist eine Stufe schwächer als ein echter Lauf; der Beweis steht erst
  mit dem nächsten Probelauf des Auslieferungsablaufs auf `windows-2022`.
- **Möglicher zweiter Windows-Befund dahinter.** Der Lauf aus dem Protokoll ist an dieser Stelle
  gestorben, also hat unter Windows noch nie etwas nach Schritt 2 gelaufen — SEA-Blob, `postject`,
  `verify-sidecar.mjs`, `tauri build` mit NSIS. Es kann gut sein, dass der nächste Lauf ein Stück
  weiter kommt und dort erneut stehen bleibt. Ein grüner Probelauf ist deshalb Bedingung, kein
  Formalismus.
- Kein Fund im Ablauf selbst. `release.yml` habe ich gelesen und nicht angefasst; er ist nicht die
  Ursache.

Offene Fragen:
1. Ein Test unter `apps/desktop/test/` für `isInside` wäre sinnvoll und ist mit Absicht **nicht**
   von mir angelegt — das entscheidet der unit-tester. Der Zuschnitt läge fertig da: die zwölf
   Fälle aus dem Prüflauf, `import { isInside } from '../scripts/paths.mjs'`, je einmal mit
   `path.win32` und `path.posix`. Zu bedenken ist, dass `apps/desktop` bisher **kein**
   `test/`-Verzeichnis hat und `vitest.config.ts` mit `apps/*/test/**/*.{test,spec}.{ts,tsx,mts}`
   greifen würde; die Abdeckungsschwellen gelten nur für die drei Fachpakete, ein neuer Ordner
   verschiebt dort also nichts.
2. `tsconfig.json` von `apps/desktop` schließt `scripts/` bewusst aus („`.mjs`-Bauskripte ohne
   Typen"). `paths.mjs` trägt deshalb nur JSDoc-Anmerkungen und keine geprüften Typen. Falls das
   Team die Bauskripte später unter `checkJs` nehmen will, ist diese Datei der kleinste Anfang —
   das ist aber eine Entscheidung des Orchestrators und nicht Teil dieser Aufgabe.
3. Soll die Zählung über den Bericht hinaus etwas erzwingen? Heute bricht sie nur ab, wenn
   `@takt/local-api` bei null steht. Eine Untergrenze für `@takt/domain` wäre eine
   Produktentscheidung („der Dienst muss Fachlogik benutzen") und keine Bautechnik; ich habe sie
   nicht getroffen.

Nächster Schritt:
Einen Probelauf des Ablaufs „Auslieferung" über „Run workflow" mit einer Fassungsangabe starten
(er baut alles und veröffentlicht nichts). Das ist der einzige Weg, der den Windows-Zweig
tatsächlich ausführt, und er kostet keine Fassung. Im Protokoll des Windows-Läufers muss unter
`[2/5]` dreimal eine Zahl größer null stehen; bleibt der Lauf danach an einer anderen Stelle
hängen, ist das ein neuer Befund und keine Rückkehr zu diesem.
