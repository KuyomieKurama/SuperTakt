Aufgabe: T-100 — Einheitentests errorText.ts, isInside, useRoute

Status: fertig

Artefakte:

```
apps/web/test/lib/errorText.test.ts      NEU — 22 Fälle: enumerateGerman (leer, ein Name, zwei
                                          Namen, drei Namen, vier Namen, Anführungszeichen bringen
                                          die Einträge selbst mit), ruleReferences (kein
                                          TaktApiError, details fehlt/leer, ein/mehrere
                                          Regelverweise, fremder code, gemischte details),
                                          errorMessageWithRules (ohne details, details: [],
                                          Singular/Plural, fremder Fehlercode, drei Sorten
                                          Nicht-TaktApiError-Ursache)
apps/desktop/test/paths.test.ts          NEU — 14 Fälle: die 12 aus reports/T-098-frontend-dev.md
                                          gegen path.win32/path.posix (Auslieferungslauf-Fall,
                                          Laufwerksbuchstabe klein/groß, Nachbarordner
                                          local-api/local-api-alt, anderes Paket, anderes
                                          Laufwerk, Schlusstrenner, der Ordner selbst — je einmal
                                          win32 und, soweit sinnvoll, posix), dazu zwei
                                          Gegenproben mit der alten `startsWith`-Form
```

Nichts in `src/` geändert. Zwei Funde beim Bau der roten Nachweise sind unten unter „Annahmen"
dokumentiert — beide Male wurde `src/` nur für die Dauer der Messung mit `git status --porcelain`
bestätigt sauber verändert und danach mit `git checkout --` exakt auf den committeten Stand
zurückgesetzt; `git status --porcelain` zeigt jetzt außer den beiden neuen Testdateien keine
Änderung (bis auf `.claude/team/board.md`, das bereits vor dieser Aufgabe geändert war und nicht
von mir stammt).

Zusammenfassung:

`errorText.ts` (T-097) und `isInside` aus `paths.mjs` (T-098) waren beide bereits umgesetzt und
ungetestet gemeldet; für beide ist jetzt ein Testbestand da, und für beide ist rot-vor-grün belegt,
indem die jeweilige Funktion kurzzeitig kaputt geschrieben, der Fehlschlag der Tests gemessen und
der Originalzustand danach über `git checkout --` wiederhergestellt wurde (Ergebnisse unten). Für
`useRoute.ts`/`useDataFreshness.ts` habe ich bewusst **keinen** Test geschrieben: Beide Dateien
haben keine exportierte reine Entscheidungsfunktion, die eigene Logik steckt in
Ereignis-Behandlern innerhalb von `useEffect`, und ein Test dagegen bräuchte entweder jsdom (dessen
`hashchange`/`popstate`-Verhalten bei gleichem Anker T-097 nachweislich nicht gemessen hat — nur
Chromium wurde gemessen) oder eine Hook-Testbibliothek, die in `apps/web` nicht installiert ist
(`package.json` ist zudem eine gemeinsame Datei). Ein jsdom-Test hier hätte über weite Strecken nur
jsdom selbst bezeugt, nicht die Anwendung — genau der Fall, den der Auftrag ausdrücklich zum
Weglassen freigibt. Alle Messungen (`pnpm test`, `pnpm run typecheck:test`, `pnpm run
test:coverage`) laufen mit Exitcode 0.

## 1. `errorText.ts`

Testdaten sind nicht erfunden, sondern aus dem tatsächlichen Vertrag gebaut: `TaktApiError` wird
über den echten Konstruktor aus `apps/web/src/api/client.ts` erzeugt (nicht als literales Objekt),
damit die Normalisierung `details === undefined ? [] : [...]` mitgeprüft wird. Die Gestalt der
Einträge in `details[]` ist wörtlich die aus `packages/storage/src/sqlite/mappers.ts`
(`poolReference`: `{ code: 'pool_rule', field: <Pool-Kennung>, message: 'Regel „Name“' }`),
nachgesehen an ihren beiden Aufrufern `repo-tags.ts` (`TagFolderPort.remove`, Fehler `tag_in_use`,
Basissatz „Dieser Ordner wird in der Regel eines Pools verwendet.") und `repo-statuses.ts`
(`remove`, Fehler `status_in_use`, Basissatz „Diesen Status benutzt noch die Regel eines Pools
oder einer Kanban-Spalte. Nehmen Sie ihn dort zuerst heraus."). Der „fremde" Detaileintrag
(`tag_name_ambiguous`) ist aus `apps/local-api/src/usecases/tag-names.ts` übernommen — ein
Detaileintrag, der keine Regel, sondern eine mehrdeutige Tag-Benennung meldet, und deshalb
**nicht** mitgezählt werden darf. `enumerateGerman` ist direkt an E-058 Punkt 4 gemessen: ein
Name ohne Verknüpfung, zwei Namen mit „und" ohne Komma, drei und vier Namen mit Komma zwischen den
ersten und „und" vor dem letzten. Alle Testnamen sind erfunden (Ost, Nord, Abrechnung, A/B/C/D) —
keine echten Kundennamen, Call-Nummern oder Zugangsdaten.

Rotnachweis: Die drei Funktionsrümpfe wurden nacheinander durch triviale, falsche Fassungen
ersetzt (`enumerateGerman` → `items.join(", ")`, `ruleReferences` → ohne den
`code === 'pool_rule'`-Filter, `errorMessageWithRules` → `return errorMessage(cause)` ohne
Anhang). Ergebnis: 9 von 22 Fällen schlagen fehl, mit den erwarteten Differenzen (z. B. „Regel
„Ost“, Regel „Nord“" statt gefiltert, oder Basissatz ohne den Anhang „Betroffen ist/sind …"). Nach
`git checkout -- apps/web/src/lib/errorText.ts`: 22 von 22 grün.

## 2. `isInside` (`apps/desktop/scripts/paths.mjs`)

`apps/desktop` hatte kein `test/`-Verzeichnis; `apps/desktop/test/paths.test.ts` ist neu und wird
von der Wurzel-`vitest.config.ts` automatisch erfasst (`apps/*/test/**/*.{test,spec}.{ts,tsx,mts}`
— ohne Änderung an der Konfiguration). Die zwölf Fälle sind wörtlich aus dem Nachweislauf im
T-098-Bericht übernommen (`reports/T-098-frontend-dev.md`, Abschnitt „Nachweis ohne
Windows-Rechner", identisch mit dem seinerzeit im Kratzverzeichnis abgelegten
`proof-isinside.mjs`): der Fall aus dem Auslieferungslauf, Laufwerksbuchstabe klein/groß,
Nachbarordner mit gleichem Anfang (`local-api` gegen `local-api-alt`), anderes Paket, anderes
Laufwerk, Ordner mit Schlusstrenner, der Ordner selbst — je einmal gegen `path.win32` und (wo eine
Laufwerksbuchstaben- oder Groß-/Kleinschreibungsfrage keinen Sinn ergibt) auch gegen `path.posix`.
Dazu zwei Gegenproben, die die alte, fehlerhafte Form (`file.startsWith(folder + '/')`) direkt
neben `isInside` stellen und zeigen, dass sie in den Windows-Fällen 1 und 2 fälschlich `false`
liefert — das ist der eigentliche Befund aus T-098, jetzt als stehender Test statt als
Einmal-Skript im Kratzverzeichnis.

Zur Typprüfung, wie im Auftrag verlangt: `apps/desktop/tsconfig.json` schließt `scripts/`
ausdrücklich aus (Kommentar dort: „.mjs-Bauskripte ohne Typen") und hat kein `include: ["test"]`;
eine `tsconfig.test.json` für `apps/desktop` habe ich **nicht** angelegt, weil `tsconfig*.json`
der Pakete laut CLAUDE.md ausdrücklich Hoheit des Orchestrators ist. `pnpm run typecheck:test`
deckt `apps/desktop` deshalb nicht ab (die Kette ruft nur `domain`, `storage`, `export`,
`local-api`, `web` auf), und `pnpm run typecheck` (das paketweise `typecheck`-Skript) prüft dort
nur `sidecar` und `src`, nicht `test`. Der `.mjs`-Import mit `// @ts-expect-error` im Testkopf
läuft unter Vitest beanstandungsfrei (Vite/esbuild transpiliert nur, prüft keine Typen); das
`@ts-expect-error` ist reine Dokumentation für den Fall, dass die Datei doch einmal typgeprüft
würde, und hat auf den Testlauf keinen Einfluss. Gemessen: `node scripts/paths.mjs` wird durch den
Test nicht ausgeführt (nur `isInside` wird importiert), `build-sidecar.mjs` (das beim Import den
ganzen Bau anstößt) bleibt unberührt.

Rotnachweis: `isInside` wurde kurzzeitig auf `return file.startsWith(\`${folder}/\`)` (die alte,
fehlerhafte Form) zurückgesetzt. Ergebnis: 6 von 14 Fällen schlagen fehl — genau die drei
win32-Fälle mit Rückstrichen/Laufwerksbuchstaben/Schlusstrenner (Fälle 1, 2, 6), der entsprechende
posix-Fall mit Schlusstrenner (Fall 11) und beide Gegenproben. Nach `git checkout --
apps/desktop/scripts/paths.mjs`: 14 von 14 grün.

## 3. `useRoute.ts` / `useDataFreshness.ts` — bewusst kein Test

Beide Dateien exportieren ausschließlich den Hook selbst (`useRoute(): RouteVisit`,
`useDataFreshness(revisit: number): void`); die Entscheidungslogik, um die es hier ginge —
`window.location.hash !== shown` in `onPopState`, `seen.current === revisit` in
`useDataFreshness` — liegt in Closures innerhalb von `useEffect` und ist nicht separat
exportiert. Um sie zu prüfen, bräuchte es entweder:

1. Einen jsdom-Test, der `window.location.hash`, `popstate` und `hashchange` simuliert. T-097 hat
   das Ereignisverhalten bei gleichem Anker ausdrücklich **gegen Chromium über Playwright**
   gemessen (Tabelle im Dateikopf von `useRoute.ts`), nicht gegen jsdom — und im Bericht selbst
   als Risiko benannt, dass WebKit (die tatsächliche Laufzeitumgebung unter Linux/macOS) noch
   ungemessen ist. Ein jsdom-Test wäre eine **dritte**, ungemessene Umgebung und würde vor allem
   bezeugen, wie jsdom Anker-Navigation nachbildet — nicht, was die Anwendung in Tauri tut. Genau
   dieser Fall ist im Auftrag ausdrücklich zum Weglassen freigegeben.
2. Eine Hook-Testbibliothek (`@testing-library/react` oder vergleichbar) für `renderHook`. Keine
   ist in `apps/web/package.json` als Abhängigkeit vorhanden, und `package.json` ist laut CLAUDE.md
   eine gemeinsame Datei (Hoheit Orchestrator) — sie neu einzuführen ist keine Entscheidung, die in
   meine Hoheit fällt.

Ich habe deshalb **keinen** Test für diese beiden Dateien geschrieben, statt einen zu schreiben,
der nur jsdom bezeugt. `router.ts` (`parseRoute`, `href`) wäre pur und ungetestet — das lag aber
außerhalb des Auftrags (der ausdrücklich `useRoute.ts`/`useDataFreshness.ts` nennt) und ist als
Vorschlag unten aufgeführt.

## 4. Zweigabdeckung

`apps/web/src` und `apps/desktop/scripts` stehen nicht in `coverage.include` der
Wurzel-`vitest.config.ts` — nicht geändert, wie vorgegeben. Zur Frage, ob eine Aufnahme sinnvoll
wäre: Für `errorText.ts` und `paths.mjs` allein: ja, beide sind jetzt vollständig geprüft (22 bzw.
14 Fälle, beide Male mit Rotnachweis) und würden die Schwelle für sich genommen tragen. Für ganz
`apps/web/src` oder ganz `apps/desktop/scripts` bliebe die Begründung, die schon im Kommentar der
Konfiguration steht, unverändert richtig: `apps/web/src` besteht überwiegend aus Ansichten und
React-Komponenten, die Playwright auf Verhalten prüft — eine erzwungene Zahl dort würde Bausteine
rendernde Tests erzeugen, ohne Verhalten zu prüfen. `apps/desktop/scripts` besteht überwiegend aus
Bauskripten, deren Import selbst einen Seiteneffekt hat (`build-sidecar.mjs` löst beim Laden den
ganzen Bau aus, siehe T-098) — ein Zwang zur Abdeckung würde entweder unsinnige Attrappen oder
echte Bauläufe im Testlauf erzwingen. Eine engere Aufnahme nur der reinen Module
(`paths.mjs`) wäre technisch möglich (ein Glob-Eintrag in `coverage.include`), ist aber eine
Entscheidung an der gemeinsamen `vitest.config.ts` und damit Sache des Orchestrators.

Messungen (alle mit Exitcode, keine Pipe):

```
pnpm test                 Exitcode 0 — 45 Testdateien, 684 Tests (vorher 648; +22 errorText,
                           +14 paths)
pnpm run typecheck:test   Exitcode 0 (fünf Konfigurationen: domain, storage, export, local-api,
                           web — apps/desktop deckt sie wie oben begründet nicht ab)
pnpm run typecheck        Exitcode 0 (Wurzel + alle Pakete inklusive apps/desktop, das seine
                           test/-Datei dabei nicht sieht)
pnpm run test:coverage    Exitcode 0 — Zweigabdeckung gesamt 84,34 % (unverändert gegenüber der
                           letzten Messung nach Welle C, weil apps/web und apps/desktop nicht in
                           coverage.include stehen); domain 87,5 %, storage 81,84 %,
                           export 92,26 %, alle über der 80-%-Schwelle
```

`pnpm check` (mit den Nachweispfaden und dem Bau) habe ich nicht laufen lassen — die Aufgabe nennt
ihn nicht unter den geforderten Messbefehlen, und er bindet laut Auftrag Ports, die ich nicht
brauche.

Annahmen:

1. **Rotnachweis über kurzzeitige, git-rückgängig gemachte Mutation statt eines eigenen
   Vorher-Zustands.** Beide geprüften Funktionen existierten bereits (T-097, T-098); echtes
   „Test zuerst, Implementierung danach" ging deshalb nicht. Um trotzdem zu belegen, dass die
   Tests etwas Reales prüfen und nicht tautologisch grün sind, habe ich `src/lib/errorText.ts` und
   `scripts/paths.mjs` je für die Dauer einer Messung auf eine falsche Fassung gesetzt, den
   Fehlschlag protokolliert und danach exakt mit `git checkout --` auf den committeten Stand
   zurückgesetzt (`git status --porcelain` vorher und nachher leer). Beide Dateien blieben damit
   am Ende meiner Aufgabe unverändert — meine Hoheit sind ausschließlich Testordner.
2. **`@ts-expect-error` beim `.mjs`-Import** in `paths.test.ts`, nicht `@ts-ignore`: falls
   `apps/desktop` künftig doch eine Typprüfung für `test/` bekäme, die den `.mjs`-Import ohne
   Fehler durchließe, soll das auffallen statt lautlos zu bleiben.
3. **Keine `tsconfig.test.json` für `apps/desktop`**, wie im Auftrag ausdrücklich verlangt — der
   Test läuft unter Vitest ohne sie, wie oben gemessen.
4. **Keine Tests für `useRoute.ts`/`useDataFreshness.ts`**, mit Begründung oben — das ist der vom
   Auftrag selbst vorgesehene dritte Ausgang, kein Blocker.
5. Testnamen (Poolnamen, Todo-/Fehlertexte) sind erfunden oder wörtlich aus bereits im Repository
   stehenden Kommentaren/Berichten übernommen (Ost, Nord, Abrechnung) — keine echten
   Call-Nummern, Kundennamen oder Zugangsdaten.

Risiken:

1. **Sicherheit: keine neue Angriffsfläche.** Es wurde ausschließlich unter `test/` geschrieben,
   keine Route, kein Aufruf, kein neues Feld. Die Testdaten enthalten keine echten Call-Nummern,
   Kundennamen oder Zugangsdaten.
2. **`useRoute`/`useDataFreshness` bleiben ungetestet in `apps/web/test`.** Das ist im Auftrag
   ausdrücklich vorgesehen, wenn ein DOM-Test nur jsdom bezeugt — bleibt aber ein Punkt, den
   R-1a/R-2a kennen sollten, falls sie eine andere Einschätzung zur Testbarkeit haben.
3. **Der Rotnachweis war eine temporäre Änderung an fremder Hoheit (`src/`).** Sie wurde
   ausschließlich zur Messung vorgenommen, nie committet, und ist über `git checkout --` exakt
   zurückgesetzt — belegt durch `git status --porcelain` vor und nach jeder der beiden Proben.
   Trotzdem: Läuft künftig ein anderer Agent parallel gegen dieselben Dateien, wäre ein solcher
   Zwischenzustand eine Kollision. In dieser Welle liefen laut Auftrag nur lesende Reviewer
   parallel zu mir, keine schreibenden Agenten auf `apps/web/src` oder `apps/desktop/scripts`.

Offene Fragen: an den Orchestrator

1. Soll `apps/desktop` eine eigene `tsconfig.test.json` bekommen (Hoheit Orchestrator), damit
   `paths.test.ts` künftig unter `typecheck:test` mitläuft? Der Test läuft heute korrekt unter
   Vitest, aber ein Typfehler im Testcode selbst (z. B. falscher Rückgabetyp einer künftigen
   `isInside`-Fassung) bliebe unbemerkt, bis jemand die Testdatei liest.
2. Soll `coverage.include` in der Wurzel-`vitest.config.ts` um `apps/desktop/scripts/paths.mjs`
   erweitert werden, jetzt wo die Datei vollständig und ohne Seiteneffekt beim Import geprüft ist?
   Eine engere Aufnahme nur dieser einen Datei wäre möglich, ohne die Begründung für den Rest von
   `apps/web/src`/`apps/desktop/scripts` zu berühren.
3. Router (`apps/web/src/app/router.ts`, `parseRoute`/`href`) ist pur, exportiert und bisher
   ungetestet — außerhalb dieses Auftrags, aber eine naheliegende Ergänzung für eine künftige
   Welle.

Nächster Schritt:

1. R-1a/R-2a/R-3a wie im Board vorgesehen; für R-1a insbesondere `errorText.ts` und `isInside` als
   jetzt geprüfte Punkte aus der Liste nehmen.
2. Falls der Orchestrator eine `tsconfig.test.json` für `apps/desktop` anlegt: keine Änderung an
   `paths.test.ts` nötig, der Test sollte unverändert durchlaufen (reiner `.mjs`-Import ohne
   Deklaration bräuchte dann `allowJs`/`checkJs` oder eine `.d.ts`-Datei — das wäre bei diesem
   Anlass zu klären).
