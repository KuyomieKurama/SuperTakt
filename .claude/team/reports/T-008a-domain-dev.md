Aufgabe: T-008a — Projektgerüst für Takt aufsetzen, ohne Tauri

Status: fertig

Artefakte:

Neu an der Wurzel:

```
package.json                Arbeitsbereich, Skripte, Node >= 22.5 (E-035)
pnpm-workspace.yaml         apps/*, packages/*, Lieferkettenschalter, allowBuilds
tsconfig.base.json          die strengen Schalter, genau einmal
tsconfig.json               nur für vitest.config.ts und playwright.config.ts
vitest.config.ts            Testpfade nach Hoheitstabelle, 80 % auf drei Pakete
playwright.config.ts        tests/e2e, de-DE, Europe/Berlin
pnpm-lock.yaml              erzeugt, 51 kB — gehört ins Repository
```

Geändert an der Wurzel:

```
.gitignore                  um Sicherungskopien, Exportdateien, Protokolle ergänzt
```

Neu unter `packages/`:

```
packages/domain/package.json                     zwei Einstiegspunkte, . und ./export
packages/domain/tsconfig.json                    types: [] — die Domäne sieht keine Umgebung
packages/domain/scripts/check-export-boundary.mjs  Wächter über die Notiz-Trennung
packages/storage/package.json                    hängt an @takt/domain
packages/storage/tsconfig.json                   types: ["node"]
packages/ui-tokens/package.json                  neues Paket
packages/ui-tokens/tokens.css                    verschoben, Inhalt unverändert
packages/ui-tokens/README.md                     Hoheit und Benutzung
```

Geändert unter `apps/web/` — nur Paket- und Arbeitsbereichsdateien:

```
apps/web/package.json        @takt/ui-tokens und @types/node ergänzt, build auf -p umgestellt
apps/web/tsconfig.json       erbt jetzt von tsconfig.base.json statt zu verdoppeln
apps/web/vite.config.ts      Zuordnung auf die verschobene tokens.css
apps/web/pnpm-workspace.yaml GELÖSCHT — Inhalt ist an der Wurzel
apps/web/pnpm-lock.yaml      GELÖSCHT — Sperrdatei ist an der Wurzel
apps/web/src/styles/tokens.css  VERSCHOBEN nach packages/ui-tokens/tokens.css
```

Nicht angefasst: `apps/web/src/**` (außer dem Verschieben der einen Tokendatei),
`apps/web/design/`, `apps/web/scripts/`, `apps/web/README.md`, `docs/**`, `CLAUDE.md`,
alles unter `.claude/` außer dieser Datei. Kein `git commit`.

---

## Die beiden geforderten Ausgaben, wörtlich

### `pnpm install`

Erster Lauf, nach zwei Abbrüchen wegen der Lieferkettenprüfung (siehe „Annahmen", Punkt 2):

```
Scope: all 5 workspace projects
Progress: resolved 1, reused 0, downloaded 0, added 0
Progress: resolved 93, reused 72, downloaded 0, added 0
Progress: resolved 142, reused 90, downloaded 0, added 0
Progress: resolved 158, reused 103, downloaded 5, added 0
Progress: resolved 161, reused 103, downloaded 7, added 0
Packages: +113
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 164, reused 105, downloaded 7, added 112
Progress: resolved 164, reused 105, downloaded 8, added 113, done
.../esbuild@0.28.2/node_modules/esbuild postinstall$ node install.js
.../esbuild@0.28.2/node_modules/esbuild postinstall: Done

devDependencies:
+ @playwright/test 1.62.1
+ @types/node 22.20.1 (26.4.0 is available)
+ @vitest/coverage-v8 4.1.11
+ typescript 5.9.3 (7.0.2 is available)
+ vitest 4.1.11

Done in 5.8s using pnpm v11.3.0
```

Erneuter Lauf, Exitcode 0:

```
Scope: all 5 workspace projects
Already up to date
Done in 274ms using pnpm v11.3.0
```

Die beiden Hinweise in Klammern sind gewollt und keine Nachlässigkeit. `@types/node` bleibt
auf der 22er-Linie, weil die Laufzeit Node 22 ist; die 26er-Typen würden Schnittstellen
zusagen, die auf dem Rechner des Benutzers nicht existieren. TypeScript bleibt auf 5.9.3,
weil T-013b damit übersetzt hat — 7.0.2 ist die neu geschriebene Fassung und gehört in eine
eigene Aufgabe, nicht in ein Gerüst.

### `pnpm typecheck`

Exitcode 0.

```
$ tsc -p tsconfig.json --noEmit && pnpm -r --if-present typecheck
Scope: 4 of 5 workspace projects
packages/domain typecheck$ tsc -p tsconfig.json --noEmit
packages/domain typecheck: Done
apps/web typecheck$ tsc -p tsconfig.json --noEmit
packages/storage typecheck$ tsc -p tsconfig.json --noEmit
packages/storage typecheck: Done
apps/web typecheck: Done
```

Keine Änderung an einer Datei aus T-013b war dafür nötig. Der Stand von T-013 übersetzt
unter dem Arbeitsbereich genau so, wie er gesondert übersetzt hatte.

### Die übrige Kette, ebenfalls gelaufen

| Befehl | Exitcode | Ergebnis |
|---|---|---|
| `pnpm boundaries` | 0 | vier Prüfungen bestanden, siehe unten |
| `pnpm test` | 0 | „No test files found" — Tests sind T-010 |
| `pnpm test:coverage` | 0 | leerer Bericht, Schwellen greifen ab T-010 |
| `pnpm test:e2e` | 0 | keine Testdateien — die sind T-012 |
| `pnpm build` | 0 | `dist/assets/index-C66uSOFa.css`, `index-DCor4JKU.js` |
| `pnpm check` | 0 | die ganze Kette hintereinander |

Die beiden Dateinamen im Bauergebnis sind derselbe Inhaltsabdruck wie vor dem Umzug der
Tokendatei. Das ist der Nachweis, dass `packages/ui-tokens/tokens.css` byteweise dieselbe
Datei ist und die Zuordnung in `vite.config.ts` greift — nicht bloß eine Behauptung.

---

## Befehle für den Auftraggeber

```bash
pnpm install          # einmalig und nach jedem Wechsel des Standes
pnpm dev              # Musterseite auf http://127.0.0.1:5173
pnpm typecheck        # Wurzelkonfigurationen, dann jedes Paket
pnpm test             # Vitest, einmalig
pnpm test:watch       # Vitest, mitlaufend
pnpm test:coverage    # mit Abdeckung und Schwellen
pnpm boundaries       # prüft die Notiz-Trennung an der Paketgrenze
pnpm build            # baut alles, was ein build-Skript hat
pnpm check            # typecheck, boundaries, coverage, build — die Kette
pnpm test:e2e         # Playwright, braucht einmalig `pnpm exec playwright install chromium`
```

`pnpm check` ist der eine Befehl vor jeder Übergabe. `pnpm test:e2e` ist bewusst nicht
darin: Es braucht heruntergeladene Browser und eine laufende Anwendung, und beides gehört
in T-012, nicht in eine Prüfung, die jeder Agent nebenbei laufen lässt.

---

Zusammenfassung:

Der Arbeitsbereich steht: fünf Pakete, eine Sperrdatei, eine Übersetzerkonfiguration.
Die strengen Schalter aus T-013b liegen jetzt genau einmal in `tsconfig.base.json`, und
`apps/web/tsconfig.json` erbt sie, statt sie zu verdoppeln — von 23 Optionen sind 5
geblieben, und die 18 gemeinsamen können nicht mehr auseinanderlaufen. `@takt/domain` hat
zwei Einstiegspunkte und keinen Platzhalter, wodurch Node selbst jeden Zugriff an der
`exports`-Tabelle vorbei mit `ERR_PACKAGE_PATH_NOT_EXPORTED` abweist; das habe ich
nachgemessen, nicht angenommen. Die Design-Token liegen in einem eigenen Paket, damit das
Outlook-Add-in dieselben Werte bekommt statt einer Kopie. `pnpm install` und
`pnpm typecheck` laufen beide mit Exitcode 0, und die ganze Kette aus `pnpm check` ebenso.

Die vierte Schicht der Notiz-Trennung, die ich in T-001 als bloße Vereinbarung gemeldet
hatte, ist jetzt eine Prüfung mit Exitcode. Sie liegt in `packages/domain`, weil die Domäne
ihre eigene Grenze bewachen soll und nicht ein Werkzeug am Rand.

---

## Was die Einstiegspunkte technisch tragen — und was nicht

Gemessen aus `packages/storage` heraus, mit dem Auflöser von Node selbst:

```
@takt/domain          -> packages/domain/src/index.ts
@takt/domain/export   -> packages/domain/src/export.ts
@takt/domain/todo     -> blockiert: ERR_PACKAGE_PATH_NOT_EXPORTED
@takt/domain/src/todo.js -> blockiert: ERR_PACKAGE_PATH_NOT_EXPORTED
```

Damit halten drei Dinge ohne Zutun eines Menschen:

1. **Kein Platzhalter in `exports`.** Es gibt genau `.`, `./export` und `./package.json`.
   Wer an der Tabelle vorbei in die Domäne greifen will, bekommt einen Auflösungsfehler,
   keine Warnung.
2. **`export.ts` importiert nur `kernel` und `rounding`.** Der Exportmotor hat über diesen
   Einstiegspunkt keinen Typ, mit dem er den internen Vermerk überhaupt benennen könnte.
3. **Die vier Typbehauptungen aus T-013b stehen weiterhin** und brechen mit TS2344, sobald
   jemand einen Notizpfad ergänzt.

**Was Node und pnpm nicht können, und wo deshalb der Wächter einspringt.** Ein
Paketmanager kennt Abhängigkeiten je Paket, nicht je Unterpfad. `packages/export` muss
`@takt/domain` in seiner `package.json` führen, sonst findet es `@takt/domain/export`
nicht — und sobald es das tut, könnte es auch `@takt/domain` als Ganzes importieren. Diese
eine Lücke schließt `packages/domain/scripts/check-export-boundary.mjs`, das in
`pnpm check` läuft.

Ich habe den Wächter gegen eine gebaute Verletzung geprüft, nicht nur gegen den grünen
Stand. Fünf Fälle, alle erkannt, Exitcode 1:

```
- packages/export/package.json führt @takt/storage als Abhängigkeit.
- packages/export/src/engine.ts importiert @takt/domain als Ganzes.
- packages/export/src/engine.ts importiert "@takt/domain/todo".
- packages/export/src/engine.ts importiert "@takt/storage".
- packages/export/src/engine.ts greift über einen relativen Pfad aus packages/export
  heraus ("../../domain/src/todo.js").
```

Der Fünfte ist der, der mir am wichtigsten war: Ohne ihn hätte ein `../../domain/src/todo.js`
die ganze Paketgrenze umgangen, und weder Node noch der Übersetzer hätten etwas gesagt.

**Für T-007, damit das Paket beim ersten Anlauf durchgeht.** `packages/export/package.json`
bekommt `"@takt/domain": "workspace:*"` und **nichts von `@takt/storage`**. Im Quelltext ist
ausschließlich `@takt/domain/export` erlaubt. Der Motor bekommt fertige `ExportGroup`-Werte
übergeben und holt sich nichts selbst.

---

Annahmen:

1. **Die Pakete zeigen auf den Quelltext, nicht auf ein `dist/`.** `@takt/domain` und
   `@takt/storage` verweisen in `exports` direkt auf ihre `.ts`-Dateien. Der Grund ist
   E-004: Der lokale Dienst wird ohnehin zu einer Sidecar-Binärdatei gebündelt, und die
   Oberfläche läuft über Vite — beide übersetzen TypeScript selbst. Ein Bauschritt je Paket
   würde eine Reihenfolge in den Arbeitsbereich einziehen, die niemand braucht, und
   `pnpm typecheck` von einem vorherigen `pnpm build` abhängig machen. Der Preis: `node`
   kann `@takt/domain` nicht ohne Bündler ausführen. Sobald T-011 den Dienst startet, ist
   das der Bündler; falls dort doch ein direkter Node-Start gewünscht ist, sagt mir das
   bitte jemand, dann wird daraus ein `tsdown`- oder `tsc`-Schritt.

2. **Zwei Ausnahmen von `trustPolicy: no-downgrade`, beide begründet.** Ich hatte vier
   Lieferkettenschalter gesetzt, weil Takt Kundendaten und das Add-in-Token hält (R-09).
   Zwei davon haben die Installation angehalten, und ich habe nicht den Schalter
   abgeschaltet, sondern die beiden Pakete einzeln freigegeben:
   `undici-types@6.21.0` (nur `.d.ts`-Dateien, von `@types/node` 22.x fest verlangt) und
   `semver@6.3.1` (Bauzeit-Abhängigkeit über `@babel/core`, kommt im Buendel nicht vor).
   Beide haben kein Lebenszyklus-Skript, können also weder beim Installieren noch später
   etwas ausführen. Die Begründung steht im Klartext in `pnpm-workspace.yaml`, damit die
   Liste nicht stillschweigend wächst.

3. **`minimumReleaseAge` steht auf sieben Tagen.** Frisch veröffentlichte Fassungen werden
   nicht installiert. Das hat hier nichts gekostet — vitest 4.1.11 und Playwright 1.62.1
   sind trotzdem in der neuesten Fassung installiert.

4. **Die Zuordnung der Tokendatei in `vite.config.ts` ist eine Brücke, kein Entwurf.**
   `apps/web/src/main.tsx` importiert weiterhin `./styles/tokens.css`, obwohl die Datei
   jetzt in `packages/ui-tokens` liegt. Ich durfte `apps/web/src/**` nicht anfassen, also
   löst Vite den Pfad um. Das funktioniert nachweislich (gleicher Inhaltsabdruck im
   Bauergebnis), ist aber Magie und gehört weg, sobald der frontend-dev die eine Zeile
   ändert. Der genaue Ersatz steht als Kommentar in `vite.config.ts`.

5. **`apps/web` hat `@types/node` bekommen.** `vite.config.ts` braucht `node:url`, um den
   absoluten Pfad zur Tokendatei zu bilden. Ohne die Typen scheitert `pnpm typecheck` in
   `apps/web`. Fällt die Brücke aus Punkt 4 weg, kann auch dieser Eintrag wieder weg.

6. **`apps/web/node_modules` habe ich beiseitegeschoben, nicht gelöscht.** Der alte Stand
   stammte aus dem verschachtelten Arbeitsbereich und hätte sich mit dem neuen gebissen. Er
   liegt im Ablagebereich dieser Sitzung; der Arbeitsbereich hat ihn beim Installieren neu
   aufgebaut.

7. **`apps/local-api` ist noch kein Paket im Arbeitsbereich.** Dort liegt bisher nur
   `openapi/takt-local-api.yaml` und kein Quelltext. Eine `package.json` ohne `src/` würde
   `tsc` mit „No inputs were found" abbrechen lassen und `pnpm typecheck` rot machen. Der
   Eintrag entsteht in T-011 zusammen mit der ersten Quelldatei; der Vorschlag steht unten
   unter „Offene Fragen".

8. **Playwright bekommt keinen `webServer`-Eintrag.** Ob T-012 gegen den Vite-Server, den
   Sidecar oder die Tauri-Hülle testet, steht nicht fest. Ein geratener Startbefehl wäre
   ein stiller Fehlstart, den man erst am dritten roten Testlauf bemerkt.

9. **Playwright läuft mit einem Arbeiter, nicht parallel.** Takt schreibt in eine einzige
   lokale SQLite-Datei (E-001, E-018). Zwei gleichzeitig laufende Testdateien teilen sich
   denselben Bestand und ziehen einander die Zeitbuchungen unter den Füßen weg. Steht als
   Begründung in der Konfiguration, damit es niemand aus Ungeduld umstellt.

10. **Vitest bekommt `TZ=Europe/Berlin` und `LANG=de_DE.UTF-8` mit.** Die Tagesgruppe im
    Export hängt am Kalendertag der Startzeit (E-025). Ein Test in einer anderen Zeitzone
    prüft ein anderes Produkt, und der Unterschied fällt erst bei einer Buchung um
    Mitternacht auf — also genau bei dem Fall, für den die Regel geschrieben wurde.

11. **`noPropertyAccessFromIndexSignature` habe ich bewusst weggelassen**, obwohl es zur
    Familie der strengen Schalter gehört. Es war nicht beauftragt, und es hätte bestehenden
    Quelltext brechen können, den ich nicht reparieren darf. Ein neuer Schalter, der fremde
    Dateien rot macht, ist keine Aufräumarbeit, sondern eine Zumutung.

---

Risiken:

1. **Eine leere Abdeckungsmenge erfüllt jede Schwelle.** `pnpm test:coverage` meldet
   gerade 100 Prozent auf 0 von 0 Zeilen und ist grün. Solange `packages/domain` und
   `packages/storage` nur Typen enthalten, ist das richtig; sobald T-009 Laufzeitcode
   liefert, muss der Bericht die Dateien auch auflisten. **Für unit-tester:** Der erste
   Abdeckungslauf nach T-009 sollte nicht nur auf die Prozentzahl schauen, sondern darauf,
   dass `rounding.ts`, `time-entry.ts` und `export.ts` überhaupt in der Tabelle stehen. Eine
   80-Prozent-Schwelle, die über eine leere Menge läuft, ist eine Schwelle über nichts.

2. **Der Wächter liest Zeichenketten, nicht den Abstraktbaum.** Wer einen Modulnamen zur
   Laufzeit zusammensetzt, kommt an ihm vorbei. Das ist Absicht und die Grenze des
   Verfahrens: Gegen Versehen schützt der Wächter, gegen Vorsatz schützt nur das Review.
   Die drei Schichten darunter — Auflösungsfehler, fehlender Typ, Typbehauptung — halten
   auch dann.

3. **Zwei Freigaben in `trustPolicyExclude` sind zwei mehr als null.** Beide sind erklärbar
   und harmlos, aber die Liste ist der Ort, an dem eine gute Regel weich wird.
   **Für security-checker:** Bitte die beiden Einträge gegenlesen und entscheiden, ob
   `trustPolicy: no-downgrade` bleibt. Meine Empfehlung ist ja — der Schalter hat beim
   ersten Lauf zwei Pakete gefunden, über die sonst niemand nachgedacht hätte, und genau
   das ist sein Zweck. Wächst die Liste in Welle 3 über eine Handvoll, ist das ein Befund
   und keine Formalie.

4. **Die Tokendatei hat jetzt zwei Leser, von denen einer nicht mehr weiß, wo sie liegt.**
   `apps/web/scripts/contrast-check.mjs` liest `../src/styles/tokens.css` direkt vom
   Dateisystem und läuft nach dem Umzug ins Leere. Eine Zuordnung in Vite hilft dort nicht,
   weil das Skript kein Vite benutzt. `pnpm contrast` ist damit kaputt, bis der
   frontend-dev eine Zeile ändert. Das Skript gehört ihm, nicht mir. **Der Kontrastnachweis
   ist die einzige automatische Prüfung des Designsystems** — er sollte nicht lange
   ausfallen.

5. **Die Sperrdatei gehört ins Repository.** Sie ist der einzige Nachweis darüber, welche
   Fassung einer Abhängigkeit tatsächlich installiert wurde, und ohne sie sind
   `minimumReleaseAge` und `trustPolicy` beim nächsten Rechner wirkungslos. Ich habe
   ausdrücklich keine Zeile in `.gitignore` aufgenommen, die sie ausschließt, und das dort
   auch hingeschrieben, damit es niemand „aufräumt".

6. **Kein Commit, wie beauftragt.** Der Stand ist vollständig unversioniert. `git add -A`
   im Trockenlauf ergibt 108 Dateien, darunter kein `node_modules`, kein `dist`, keine
   Datenbank und keine Tokendatei im Sinne eines Geheimnisses — geprüft. Die Reihenfolge
   aus E-021 ist damit eingehalten: `.gitignore` und `git init` standen vor der ersten
   Installation, und R-14 ist an dieser Stelle geschlossen.

7. **Sicherheitshinweis zu `.gitignore`.** Ergänzt habe ich vor allem Sicherungskopien der
   Datenbank (`*.db.bak`, `backups/`) — der Migrationsläufer legt vor jedem Lauf eine an,
   und sie trägt denselben Kundenbestand wie das Original. Das stand vorher nicht drin und
   war die größte verbliebene Lücke. Dazu Exportdateien nach Namensmuster, Protokolle und
   Zwischenspeicher.

---

Offene Fragen:

1. **An den frontend-dev, zwei Zeilen.** Beide Verweise auf die verschobene Tokendatei:
   - `apps/web/src/main.tsx`, Zeile 4: `import "./styles/tokens.css";` wird zu
     `import "@takt/ui-tokens/tokens.css";`
   - `apps/web/scripts/contrast-check.mjs`, Zeile 19: `resolve(here, "../src/styles/tokens.css")`
     wird zu `resolve(here, "../../../packages/ui-tokens/tokens.css")`

   Danach fällt der `resolve.alias`-Eintrag in `apps/web/vite.config.ts` ersatzlos weg und
   `@types/node` kann dort wieder verschwinden. Ich habe die Änderungen nicht selbst
   gemacht, weil `apps/web/src/` und `apps/web/scripts/` nicht meine Hoheit sind.

2. **An den Orchestrator: Gehört `base.css` auch nach `packages/ui-tokens`?** Der
   frontend-dev hatte in T-006 beide Dateien vorgeschlagen, der Auftrag nannte nur die
   Token. Ich habe genau das getan, was beauftragt war. Für das Add-in spricht einiges
   dafür, `base.css` nachzuziehen — Fokusdarstellung und Bewegungsvorbehalt sind dort
   dieselben Anforderungen. Das ist eine Entscheidung des frontend-dev, nicht meine.

3. **An den Orchestrator: Eintrag für `apps/local-api`, sobald T-011 anfängt.** Die
   `package.json` kann erst zusammen mit der ersten Quelldatei entstehen, sonst bricht
   `tsc` mit „No inputs were found" ab. Vorgesehen:

   ```json
   {
     "name": "@takt/local-api",
     "private": true,
     "type": "module",
     "scripts": { "typecheck": "tsc -p tsconfig.json --noEmit" },
     "dependencies": {
       "@takt/domain": "workspace:*",
       "@takt/storage": "workspace:*",
       "hono": "^4",
       "zod": "^4"
     },
     "devDependencies": { "@types/node": "^22.20.1", "typescript": "^5.9.3" }
   }
   ```

   Die Laufzeitabhängigkeiten habe ich **nicht** vorab installiert. Sie in einem Gerüst
   mitzuziehen, in dem noch keine Zeile davon benutzt wird, würde die Prüfung der
   Lieferkette auf Pakete anwenden, über die noch niemand entschieden hat.

4. **An den Orchestrator: `pnpm exec playwright install chromium` läuft über den
   Auftraggeber, nicht über mich.** Der Browserdownload ist mehrere hundert Megabyte und
   gehört nicht in eine Aufgabe, die ein Gerüst aufsetzt. Ohne ihn läuft `pnpm test:e2e`
   grün durch, weil es keine Testdateien gibt — das ändert sich mit T-012.

5. **An den unit-tester, zur Umgebung:** Die Vitest-Konfiguration setzt `environment: 'node'`
   als Vorgabe. Ein Test, der das DOM braucht, sagt das in der Datei selbst über
   `// @vitest-environment jsdom`. `jsdom` ist noch nicht installiert; sobald der erste
   solche Test entsteht, braucht die Wurzel den Eintrag. Meldet ihn bitte, statt ihn selbst
   zu setzen.

6. **Hinweis, kein Blocker:** TypeScript 7.0.2 ist erschienen. Der Arbeitsbereich bleibt auf
   5.9.3, weil T-013b damit übersetzt hat und ein Wechsel des Übersetzers in einem Gerüst
   nichts zu suchen hat. Als eigene Aufgabe vor Welle 3 wäre er sinnvoll — die strengen
   Schalter aus `tsconfig.base.json` sind genau die Stelle, an der sich ein solcher Wechsel
   zeigt.

---

Nächster Schritt:

1. **T-008b, die Tauri-Hülle, kann anfangen.** Der Arbeitsbereich steht, `apps/desktop`
   fügt sich als weiteres `apps/*`-Paket ohne Änderung an der Wurzel ein. Der Sidecar
   braucht aus meiner Sicht nur eines von mir: Sobald T-011 den Dienst gebündelt hat, muss
   `@takt/domain` und `@takt/storage` in diesem Bündel landen — sie zeigen auf Quelltext
   und nicht auf `dist/`, also muss der Bündler sie mitübersetzen und darf sie nicht als
   „external" behandeln. Das ist der Punkt, an dem R-04 zuschlägt, wenn es niemand
   aufschreibt.

2. **Der frontend-dev zieht die zwei Zeilen aus „Offene Fragen" Punkt 1 nach.** Danach ist
   `pnpm contrast` wieder grün und die Brücke in `vite.config.ts` verschwindet.

3. **T-009 kann unmittelbar anfangen.** `packages/storage` hat seine Paketdatei, `node`-Typen
   und die beiden Migrationen liegen bereit. `pnpm typecheck` läuft, also fällt jeder Fehler
   sofort auf und nicht erst beim Zusammenbau.

4. **T-010 sollte die Abdeckung als Erstes gegen Risiko 1 prüfen** — nicht die Prozentzahl,
   sondern ob die Dateien überhaupt im Bericht stehen.

5. **Der security-checker liest zwei Dinge gegen:** die beiden Einträge in
   `trustPolicyExclude` und die ergänzten Zeilen in `.gitignore`. Die
   OpenAPI-Beschreibung unter `apps/local-api/openapi/takt-local-api.yaml` liegt unverändert
   aus T-013b vor und ist prüfbar.
