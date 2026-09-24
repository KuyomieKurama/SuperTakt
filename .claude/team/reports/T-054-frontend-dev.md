Aufgabe: T-054 — Drei Auflagen aus T-053: den Nachweis in eine Kette legen, die jemand ausführt;
die esbuild-Warnung zum Fehler machen; das Bündel des Aufgabenbereichs ausliefern. Dazu die zweite
offene Frage aus T-053 beantworten (gilt das auch für `tauri dev`?).

Status: fertig

---

Artefakte:

Neu:

```
apps/desktop/scripts/build-taskpane.mjs          226  baut das Add-in und legt sein Bündel dorthin,
                                                      wo der Dienst es sucht — `--dev` neben die
                                                      Binärdatei von `tauri dev`, ohne Schalter in
                                                      den Bereitstellungsordner für `tauri build`.
                                                      Prüft danach, dass die `index.html` da ist
                                                      und jede örtliche Datei, die sie nachlädt.
```

Geändert:

```
apps/desktop/package.json                         33  `app:dev` fährt jetzt den Nachweis und den
                                                      Aufgabenbereich mit; neu `taskpane` und
                                                      `taskpane:dev`
package.json (Wurzel)                             38  neu `sidecar:verify` und `verify:bundle` —
                                                      ausdrücklich **neben** `check`, nicht darin
apps/desktop/scripts/build-sidecar.mjs           360  `define: {'import.meta.url': '""'}` und
                                                      `logOverride: {'empty-import-meta': 'error'}`;
                                                      der Bau bricht mit einer Meldung ab, die den
                                                      Weg nennt, statt mit einem esbuild-Stapel
apps/desktop/scripts/build-app.mjs                88  bricht ab, wenn der Aufgabenbereich nicht
                                                      bereitliegt, statt ein Paket zu erzeugen, in
                                                      dem das Add-in tot ist
apps/desktop/src-tauri/tauri.conf.json           143  `bundle.resources` (Windows) und
                                                      `bundle.linux.deb.files` +
                                                      `bundle.linux.appimage.files` (Linux) für das
                                                      `taskpane`-Bündel
apps/desktop/.gitignore                           25  `src-tauri/taskpane/` — Bauergebnis, 1,3 MiB
apps/desktop/README.md                           215  Befehlstabelle, die Ketten als Bild, der
                                                      Abschnitt zum Aufgabenbereich; „zwölf
                                                      Prüfungen" → zwanzig
README.md (Wurzel)                               136  `verify:bundle` benannt, mit der Begründung,
                                                      warum sie nicht in `check` steht
```

`apps/desktop/scripts/verify-sidecar.mjs`: **unangetastet** (Hoheit domain-dev seit T-053).
`apps/local-api/**`, `packages/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `docs/**`,
`pnpm-lock.yaml`: unangetastet. `apps/web/**`: unangetastet — an dieser Aufgabe war nichts zu tun.
`apps/desktop/sidecar/entry.ts` war für eine Gegenprobe zwei Zeilen lang verändert und ist
zurückgenommen (siehe „Abweichungen").

---

Zusammenfassung:

**1 — Der Nachweis steht jetzt in beiden Ketten, und in `pnpm desktop` fährt er mit.**

```json
"app:dev":   "node scripts/build-sidecar.mjs && node scripts/verify-sidecar.mjs && node scripts/build-taskpane.mjs --dev && tauri dev",
"app:build": "node scripts/build-sidecar.mjs && node scripts/verify-sidecar.mjs && node scripts/build-taskpane.mjs && node scripts/build-app.mjs",
```

Gemessen: Der Nachweis kostet **fünf Sekunden** — zwanzig Prüfungen gegen die gerade gebaute
Binärdatei. Dafür kann die Anwendung, die danach startet, nicht mehr die sein, die beim
Auftraggeber nicht startet.

An der Wurzel dazu zwei Einträge:

```json
"sidecar:verify": "pnpm --filter @takt/desktop sidecar:verify",
"verify:bundle":  "pnpm --filter @takt/desktop sidecar && pnpm --filter @takt/desktop sidecar:verify",
```

**Nicht in `check`** — die Entscheidung des Auftraggebers, und sie ist die richtige: Der Lauf
braucht `rustc`, baut 120 MiB und belegt 17843 und 17844 ausschließlich. Er kann neben einem
laufenden Takt nicht bestehen (dazu unten, Punkt 6). `check` soll schnell und oft laufen.

Damit `verify:bundle` nicht wird, was `sidecar:verify` war, steht sie im Wurzel-`README.md` unter
einer eigenen Überschrift „Der Nachweis gegen das Erzeugnis", mit dem Satz, der sie erklärt:
`pnpm check` prüft den Quelltext, diese Kette prüft das Erzeugnis. Beide Anwendungsbefehle nennen
sie in `apps/desktop/README.md`.

**2 — Die Warnung, die den Fehler angesagt hat, hält jetzt den Bau an.**

Beide Zeilen wie vorgeschlagen, dazu ein Auffangen des Wurfs, damit die Meldung lesbar ist. Der
Unterschied zwischen den beiden ist wichtig und steht auch so im Quelltext:

* `define: {'import.meta.url': '""'}` macht aus einer **stillen Annahme eine geschriebene**.
  Gemessen im Bündel — vorher `var import_meta = {}` und `const base = import_meta.url`, jetzt:

  ```
  sidecar.cjs:4398   function migrationsDirectoryBesideSource() { const base = ""; …
  sidecar.cjs:24543  function sourceDirectory() { const base = ""; …
  ```

  `var import_meta = {}` kommt im ganzen Bündel nicht mehr vor. Beide Fundstellen prüfen auf
  `base === ''` und liefern `null`; das Verhalten des Erzeugnisses hängt jetzt an einer Zeile im
  Bauskript und nicht daran, was esbuild einsetzt.

* `logOverride: {'empty-import-meta': 'error'}` fängt die **nächste** Stelle. Gemessen: Nach dem
  `define` bleibt die Warnung für `import.meta.url` aus — sie erscheint nur noch für andere
  Zugriffe. Genau das ist gewollt: Die bekannte Stelle ist geregelt, die unbekannte hält an.

Gegenprobe, zwei Zeilen in `sidecar/entry.ts`, danach zurückgenommen:

```
export const probe = import.meta.dirname;

  →  ✘ [ERROR] "import.meta" is not available with the "cjs" output format …  [empty-import-meta]
     FEHLER: esbuild hat den Bau abgebrochen:
       - sidecar/entry.ts:42:21
     … Der Weg ist, die Frage „wo liegt mein Quelltext" gar nicht erst zu stellen. Was zur
     Laufzeit gebraucht wird, gehört eingebettet … oder neben process.execPath.
     Exitcode 1, keine Binärdatei
```

Vorher entstand aus derselben Lage eine Binärdatei plus zwei Warnzeilen, die niemand las.

**3 — Der Aufgabenbereich liegt jetzt neben der Binärdatei. Nachgewiesen am gestarteten Paket.**

Der Dienst sucht an genau einem Ort, der in der Auslieferung gilt:
`resolve(process.execPath, '..', 'taskpane')`. Das ist **nicht** das Ressourcenverzeichnis von
Tauri. Der Unterschied ist der ganze Aufwand an dieser Stelle:

| | Hauptprogramm und Sidecar | Ressourcen (`bundle.resources`) |
|---|---|---|
| Windows, NSIS | `$INSTDIR` | `$INSTDIR` — **derselbe Ort** |
| Linux, deb/AppImage | `/usr/bin/` | `/usr/lib/Takt/` — **ein anderer Ort** |

Deshalb stehen in `tauri.conf.json` zwei Dinge: `resources` für Windows (den Auslieferungsfall)
und `deb.files` + `appimage.files` für Linux. Beides gemessen im gebauten Paket, nicht gelesen:

```
deb/…/data/usr/bin/taskpane/index.html            ← die Kopie, die der Dienst liest
deb/…/data/usr/lib/Takt/taskpane/index.html       ← die Kopie aus `resources`, tot
appimage/Takt.AppDir/usr/bin/taskpane/index.html  ← braucht seinen eigenen Eintrag
```

Zwei Dinge daran waren nicht vorhersehbar und mussten gemessen werden:

* **Das AppImage erbt `deb.files` nicht.** Der erste Bau hatte nur den `deb`-Eintrag; im AppImage
  fehlte `usr/bin/taskpane`. Erst der zweite Eintrag hat es hineingelegt.
* **Die `resources`-Kopie unter Linux ist wirklich tot.** Gegenprobe am entpackten AppImage:
  `usr/lib/Takt/taskpane` entfernt, Anwendung gestartet — der Aufgabenbereich liefert weiter aus.

**Der Nachweis nach Vorgabe: das gebaute Paket gestartet und den Dienst gefragt**, nicht die Datei
im Bauordner gesucht. Gestartet wurde `Takt_0.0.0_amd64.AppImage` (138 MiB) mit
`XDG_DATA_HOME` in einem Wegwerfordner; gefragt wurde über HTTPS mit dem Zertifikat, das dieser
Dienst gerade selbst geschrieben hat, als einziger Vertrauenswurzel — nichts abgeschaltet:

```
[dienst] Takt lauscht auf 127.0.0.1:17843.
[dienst] Ein Zertifikat für den Aufgabenbereich wurde erzeugt.
[dienst] Der Aufgabenbereich des Add-ins liegt unter https://localhost:17844.

GET /                              200   2412 Bytes   text/html
                                   Titel: „Takt — Todo aus E-Mail"
GET /assets/index-BYD4d-lP.js      200 232003 Bytes   text/javascript
GET /assets/index-DxPCeduV.css     200  23229 Bytes   text/css
GET /takt.db                       404
GET /%2e%2e%2f…%2fetc%2fpasswd     404
```

Gegenprobe am selben Paket, `usr/bin/taskpane` entfernt:

```
[dienst] Takt lauscht auf 127.0.0.1:17843.
[dienst] Der Aufgabenbereich des Add-ins wird nicht ausgeliefert: Es liegt kein Bündel vor.
         → 17844 kommt gar nicht erst hoch
```

Das ist der Zustand, in dem das Paket vor dieser Aufgabe war.

**4 — Antwort auf die zweite offene Frage: Ja, `tauri dev` braucht dasselbe.**

Die Frage des domain-dev war, ob der gebündelte Dienst im Entwicklungsbetrieb den Arbeitsbereich
kennen soll. **Nein — und deshalb muss ihm dort jemand das Bündel hinlegen.** Der Grund ist der,
den er selbst genannt hat: Der zweite Suchpfad in `taskpane/server.ts` entsteht aus
`import.meta.url`, und im Bündel gibt es den nicht. In `tauri dev` läuft dieselbe gebündelte
Binärdatei wie beim Kunden. Ein Dienst, der im Entwicklungsbetrieb ein Repository fände und beim
Kunden nicht, wäre genau die Sorte Unterschied, die T-053 verursacht hat.

`build-taskpane.mjs --dev` legt das Bündel deshalb nach `<cargo-target>/debug/taskpane`, also neben
die Binärdatei, die `tauri dev` aus `src-tauri/binaries/` dorthin kopiert. Gemessen in
`pnpm desktop`:

```
      apps/desktop/src-tauri/target/debug/taskpane: 6 Datei(en), 1329 KiB, 2 örtliche Verweise geprüft
…
[dienst] Der Aufgabenbereich des Add-ins liegt unter https://localhost:17844.

GET /                            200  2412 Bytes  text/html   (Titel „Takt — Todo aus E-Mail")
GET /assets/index-BYD4d-lP.js    200 232003 Bytes text/javascript
GET /gibt-es-nicht.html          404
```

Vor dieser Aufgabe stand dort „Es liegt kein Bündel vor." (so in T-053 gemessen).

`CARGO_TARGET_DIR` wird beachtet. Wer es setzt und hier nicht bedacht würde, bekäme ein Bündel an
einem Ort, an dem nichts läuft, und keinen Hinweis darauf.

**5 — Zwei Stellen, an denen dieselbe Lücke nicht wieder entstehen kann.**

Das Muster aus T-053 und T-054 ist beide Male dasselbe: Jeder Teil stimmt, und niemand führt den
Schritt aus, der sie verbindet. Dagegen zwei Riegel:

* **`build-app.mjs` bricht ab**, wenn `src-tauri/taskpane/index.html` fehlt. Ein Glob, der nichts
  findet, ist für Tauri kein Fehler — das Paket entstünde, sähe vollständig aus und wäre es nicht.
  Gegenprobe: Ordner beiseitegelegt, `node scripts/build-app.mjs` → Exitcode 1, Meldung nennt
  `pnpm --filter @takt/desktop taskpane` und `pnpm desktop:build`. Zurückgelegt, Bau wieder grün.
* **`build-taskpane.mjs` baut das Add-in selbst**, statt ein vorhandenes `dist/` vorauszusetzen.
  Ein Kopierschritt, der auf ein fremdes Bauergebnis wartet, liefert entweder den Stand von
  vorgestern aus oder bricht mit „nicht gefunden" ab — je nachdem, was zufällig im
  Arbeitsverzeichnis liegt.
* Danach prüft es das Ergebnis: `index.html` vorhanden **und** jede örtliche Datei, auf die sie
  verweist. Eine halb kopierte Fassung bliebe im Aufgabenbereich von Outlook sonst leer, mit einem
  Fehler in einer Konsole, die dort niemand sieht.

`@takt/outlook-addin` steht dafür bewusst **nicht** in den Abhängigkeiten von `@takt/desktop`: Die
Hülle benutzt keine seiner Ausfuhren, sie liefert nur sein Erzeugnis aus. Der Aufruf geht über den
Arbeitsbereichsfilter von pnpm, nicht über eine Abhängigkeitskante, die es fachlich nicht gibt —
und `pnpm-lock.yaml` bleibt unberührt.

**6 — Was der Nachweis in `app:dev` kostet, und es ist nicht nur Zeit.**

`verify-sidecar.mjs` belegt 17843 und 17844 ausschließlich und weigert sich zu laufen, wenn dort
schon etwas lauscht. Das heißt: **`pnpm desktop` startet nicht mehr, während Takt schon läuft.**

Mir ist das bei dieser Aufgabe zweimal passiert, beide Male mit einem Rest aus einem vorherigen
Lauf. Die Kette hat sich dabei richtig verhalten — sie ist mit Exitcode 1 stehengeblieben und hat
gesagt, woran es lag („Läuft Takt oder `proof:access` gerade?"), statt gegen einen fremden Dienst
zu prüfen und grün zu melden. Ein Nachweis, der bei belegtem Port irgendetwas anderes prüft, wäre
schlimmer als keiner.

Trotzdem ist es eine Verhaltensänderung, die jemand bemerken wird. Sie steht im
`apps/desktop/README.md`. Der Ausweg, wenn nur die Oberfläche gebraucht wird, ist `pnpm dev`; der
Ausweg für einen Start ohne Nachweis ist
`pnpm --filter @takt/desktop sidecar && pnpm --filter @takt/desktop taskpane:dev && pnpm --filter @takt/desktop tauri dev`.

---

Abweichungen:

**1 — Ich habe zwei Dateien vorübergehend verändert, um die Prüfer zu prüfen.** `sidecar/entry.ts`
(zwei Zeilen `import.meta.dirname`, Punkt 2) und den Bereitstellungsordner `src-tauri/taskpane`
(beiseitegelegt, Punkt 5). Beide in meiner Hoheit, beide zurückgenommen und nachgewiesen (`diff`
gegen die Sicherung ist leer; der Bau danach wieder grün, `sidecar:verify` 20 von 20). Die
ausgelieferte Binärdatei entspricht dem jetzigen Quelltext.

**2 — Ich habe `README.md` an der Wurzel angefasst.** Sie steht nicht in meiner Dateiliste, aber
die Auflage verlangt ausdrücklich, dass `verify:bundle` „im README steht", und `docs/**` ist für
mich gesperrt. Zwei Stellen: der Absatz unter „Starten" (beide Anwendungsbefehle fahren den
Nachweis mit) und der neue Abschnitt „Der Nachweis gegen das Erzeugnis" unter „Prüfen". Sonst
nichts. Der documenter zieht in `docs/` nach — dort steht weiterhin „zwölf Prüfungen".

**3 — `bundle.resources` erzeugt unter Linux eine zweite, tote Kopie von 1,3 MiB.** Sie liegt in
`/usr/lib/Takt/taskpane` und wird von nichts gelesen (in Punkt 3 gemessen). Vermeiden ließe sie
sich nur, indem der `resources`-Eintrag allein unter Windows gesetzt würde — über `--config` aus
`build-app.mjs`. Dann hinge die **Auslieferungsplattform** an einem Zweig, den auf diesem Rechner
nie jemand ausführt. Genau diese Sorte Lücke ist T-054, und ich habe sie nicht neu aufmachen
wollen: Ein Eintrag, der immer gilt, ist für Windows sicherer als 1,3 MiB Ersparnis in einem Paket,
das niemand ausliefert. Die Begründung steht ausgeschrieben an der Stelle in `tauri.conf.json`,
damit niemand den `deb.files`-Eintrag „aufräumt".

**4 — `apps/desktop/.gitignore` um eine Zeile ergänzt.** `src-tauri/taskpane/` ist Bauergebnis. Die
Wurzel-`.gitignore` gehört mir nicht; die Datei in `apps/desktop` schon, und der Eintrag gehört
ohnehin dorthin, wo der Ordner entsteht.

---

Prüfungen:

```
pnpm check                          Exitcode 0
                                    typecheck: 8 Projekte fehlerfrei
                                    boundaries: fehlerfrei
                                    contrast: 0 von 332 Paaren durchgefallen
                                    proof:openapi: 46 bestanden, 0 fehlgeschlagen
                                    proof:callers: 18 bestanden, 0 fehlgeschlagen
                                    test:coverage: 34 Dateien, 556 Tests, alle grün
                                                   Statements 92,04 % · Branches 83,98 %
                                                   Functions 96 % · Lines 94,99 %
                                    build: alle Pakete

pnpm typecheck                      Exitcode 0, keine `any`
pnpm verify:bundle                  Exitcode 0 — 20 bestanden, 0 fehlgeschlagen
pnpm sidecar:verify                 Exitcode 0 — 20 bestanden, 0 fehlgeschlagen
```

`pnpm desktop` — die Kette vollständig, in dieser Reihenfolge:

```
[1/5] … [5/5]  Binärdatei zusammensetzen              keine esbuild-Warnung mehr
20 bestanden, 0 fehlgeschlagen                        der Nachweis, fünf Sekunden
apps/desktop/src-tauri/target/debug/taskpane: 6 Datei(en), 1329 KiB, 2 Verweise geprüft
     Running BeforeDevCommand (`pnpm --filter @takt/web dev`)
[dienst] Bestand auf Fassung 7 gebracht.
[dienst] Takt lauscht auf 127.0.0.1:17843.
[dienst] Der Aufgabenbereich des Add-ins liegt unter https://localhost:17844.
[dienst] GET /api/v1/tag-tree 200 · /api/v1/todo-statuses 200 · …
```

Danach von Hand beendet; `ss` zeigt beide Ports frei, kein verwaister Sidecar (B-1.6.3).

`pnpm desktop:build` — Exitcode 0, zwei Pakete:

```
Takt_0.0.0_amd64.deb        47,2 MiB     data/usr/bin/taskpane/{index.html,assets/…}
Takt_0.0.0_amd64.AppImage  138,3 MiB     Takt.AppDir/usr/bin/taskpane/{index.html,assets/…}
```

Das gestartete Paket, gefragt statt durchsucht (Punkt 3): `/` 200, beide Ressourcen 200,
`/takt.db` 404, kodierte Aufwärtsschritte 404.

Gegenproben, jede einzeln, jede zurückgenommen:

```
import.meta.dirname in entry.ts        Bau bricht ab, Exitcode 1, keine Binärdatei
src-tauri/taskpane beiseite            build-app.mjs bricht ab, Exitcode 1, kein Paket
usr/bin/taskpane aus dem Paket         „Es liegt kein Bündel vor.", 17844 kommt nicht hoch
usr/lib/Takt/taskpane aus dem Paket    Aufgabenbereich läuft weiter — die Kopie ist tot
```

---

Auflagen:

**1 — `docs/` führt weiter „zwölf Prüfungen" am Sidecar-Nachweis, es sind zwanzig** (documenter).
Dazu gehört jetzt neu: `verify:bundle` und `sidecar:verify` an der Wurzel, die Bereitstellung des
Aufgabenbereichs in beiden Betriebsarten, und dass `pnpm desktop` beide Ports frei braucht.
`README.md` und `apps/desktop/README.md` sind nachgezogen, `docs/entwicklerhandbuch.md` und
`docs/architektur.md` nicht — sie gehören mir nicht.

**2 — Die Windows-Seite ist unbewiesen** (T-B05, kein Windows-Rechner). Gemessen ist, dass
`bundle.resources` die Ordnerstruktur erhält (`taskpane/index.html`, `taskpane/assets/…`).
Ungemessen ist die Annahme, auf der der Auslieferungsfall steht: dass NSIS Ressourcen nach
`$INSTDIR` legt, also neben `takt-local-api.exe`. Die Prüfung ist eine Zeile in der
Windows-Prüfliste: **nach der Installation muss `%LOCALAPPDATA%\Programs\Takt\taskpane\index.html`
existieren, und der Aufgabenbereich muss unter `https://localhost:17844` antworten.** Trifft das
nicht zu, ist der Weg derselbe wie unter Linux — ein `files`-Eintrag, den NSIS allerdings nicht
kennt; dann bliebe nur ein Kopierschritt im NSIS-Haken `NSIS_HOOK_POSTINSTALL`.

---

Offene Fragen:

**1 — Die Quellkarten des Add-ins gehen mit ins Paket: 1,1 MiB, und der Aufgabenbereich liefert sie
aus.** Gemessen am gebauten Paket: `GET /assets/index-BYD4d-lP.js.map` → 200, 1 099 197 Bytes.
Das ist kein Versehen des Kopierschritts — er nimmt `apps/outlook-addin/dist` unverändert, und die
Positivliste in `taskpane/server.ts` führt `.map` ausdrücklich. Beides gehört anderen: die
`sourcemap`-Einstellung dem Add-in, die Positivliste dem Dienst. Die Frage ist, ob der
Auftraggeber den Quelltext des Add-ins im Installationspaket haben will. Kein Geheimnis liegt darin
(die Datei enthält keinen Schlüssel), aber es ist Quelltext auf dem Rechner des Kunden. Ich habe
nichts gefiltert, weil ein Kopierschritt, der stillschweigend etwas weglässt, schlechter ist als
einer, der 1:1 überträgt und die Frage stellt.

**2 — `pnpm desktop` braucht jetzt beide Ports frei** (Punkt 6). Für mich ist der Tausch richtig —
Fünf Sekunden und eine klare Fehlermeldung gegen eine Anwendung, die beim Auftraggeber nicht
startet. Es ist aber eine Verhaltensänderung im Alltag jedes Entwicklers, und ich habe sie nicht
zu entscheiden, sondern nur gemessen und aufgeschrieben. Wer sie zurückdrehen will, hat den Befund
aus T-053 zurückgedreht.

**3 — Zwei Erzeugnisse sind weiterhin nur aus dem Quelltext geprüft** (Frage 3 aus T-053, unverändert
offen). Das `vite build`-Ergebnis von `apps/web` läuft in keinem Ende-zu-Ende-Fall — die laufen
gegen `vite dev`. Für `apps/outlook-addin` hat sich die Lage mit T-054 geändert: Sein Bündel wird
jetzt in beiden Betriebsarten ausgeliefert und **die Auslieferung** ist gemessen (Titel, Skript,
Stil, 404 für Unbekanntes). Ungemessen bleibt, ob das ausgelieferte Bündel im Wirt Outlook
**tut**, was es soll — dafür fehlt der Office.js-Wirt (T-B02, O-E). Für `apps/web` gehört das
gemessen und nicht vermutet, als eigene Aufgabe für e2e-tester.
