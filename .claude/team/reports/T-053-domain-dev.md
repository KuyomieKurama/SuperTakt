Aufgabe: T-053 — Takt startet nicht. Den Startfehler beheben, einen Nachweis bauen, der die
**gebündelte** Binärdatei startet statt sie nur zu bauen, und nach weiteren Stellen derselben Art
suchen.

Status: fertig

---

Artefakte:

Neu:

```
packages/storage/scripts/embed-migrations.mjs        NEU (110) — schreibt die 14 SQL-Dateien
                                                     wörtlich in ein TypeScript-Modul; `--check`
                                                     prüft ohne zu schreiben
packages/storage/src/sqlite/migrations.embedded.ts   NEU (erzeugt, 67 KiB) — die eingebetteten
                                                     Migrationen. Zeichen für Zeichen, wegen der
                                                     Prüfsumme
```

Geändert:

```
packages/storage/src/sqlite/open.ts             180  `import.meta.url` ist im Bündel leer und
                                                     bekommt deshalb einen Rückgabewert „gibt es
                                                     nicht"; die mitgelieferten Migrationen sind
                                                     eingebettet und werden im Quelltextbetrieb
                                                     gegen das Verzeichnis gehalten
packages/storage/src/sqlite/migration-runner.ts      `loadMigrations` liest nur noch Dateien; der
                                                     Aufbau steht in `migrationsFromFiles` und ist
                                                     für beide Wege derselbe. Zeilenenden werden
                                                     vor der Prüfsumme vereinheitlicht
packages/storage/src/index.ts                        `migrationsFromFiles` neben `loadMigrations`
packages/storage/package.json                        `migrations:embed`, `migrations:embed:check`
apps/local-api/src/taskpane/server.ts                die Wegsuche wirft nicht mehr; der
                                                     Entwicklungspfad entsteht nur, wenn es einen
                                                     Quelltextort gibt
apps/local-api/src/main.ts                           der Start des Aufgabenbereichs steht in einer
                                                     Klammer: kein Fehler von dort nimmt den
                                                     Dienst mit
apps/desktop/scripts/verify-sidecar.mjs         560  zwölf → zwanzig Prüfungen; startet die
                                                     Binärdatei aus einem nachgebauten
                                                     Installationsbild, prüft beide Ports
                                                     (Ausnahme für diese Aufgabe erteilt)
docs/architektur.md                            1075  Abschnitt 5.5 „Was der Dienst zur Laufzeit
                                                     über sich wissen darf"
```

`apps/web/**`, `apps/outlook-addin/**`, `tests/**`, `packages/*/test/**`, `packages/export/**`,
`packages/domain/**`, `apps/local-api/src/routes/addin/**`, `docs/spec.md` und alles Übrige unter
`apps/desktop/` (auch `build-sidecar.mjs`, `build-app.mjs`, `tauri.conf.json`): **unangetastet**.
Wurzel-`package.json` und `pnpm-lock.yaml` unverändert — die gewünschten Einträge stehen unter
„Auflagen". Kein neues Paket.

---

Zusammenfassung:

**1 — Die Spur war richtig, die Stelle war die zweite von zweien.**

Die Meldung `Invalid URL` kam **nicht** aus `taskpane/server.ts:93`, sondern aus
`packages/storage/src/sqlite/open.ts:44`:

```
### URL FAIL input=../../migrations/ base=undefined
    at defaultMigrationsDirectory (sidecar.cjs:4174)
    at openDatabase          (sidecar.cjs:4181)
    at compose2              (sidecar.cjs:23789)
    at main                  (sidecar.cjs:24419)
Der lokale Dienst konnte nicht starten: Invalid URL
```

Gemessen, nicht geschlossen: Ich habe den globalen `URL`-Konstruktor im Bündel abgefangen und den
ersten Fehlschlag mit Aufrufstapel ausgegeben. Er fällt in `compose()` — also **vor** dem
Lauschen; der Dienst kam nie so weit, den Aufgabenbereich überhaupt zu starten.

Die Ursache ist dieselbe, die der Auftraggeber benannt hat, nur an einer zweiten Stelle. esbuild
übersetzt nach CommonJS und ersetzt `import.meta` durch ein leeres Objekt (`var import_meta = {}`);
`import.meta.url` ist dort `undefined` und `new URL('…', undefined)` wirft. Beide Stellen sind
behoben. Ohne die Behebung in `server.ts` wäre der Fehler nur eine Zeile weitergewandert — das ist
in Punkt 6 gemessen.

**Die Zeitrechnung stimmt nicht ganz.** Der Aufgabenbereich kam mit T-021 dazu, das Migrationsleck
ist älter: `open.ts` schreibt `new URL('../../migrations/', import.meta.url)` seit es die Datei
gibt. T-008b hat den gebündelten Sidecar geprüft, bevor `compose()` überhaupt eine Datenbank
öffnete — der Zusammenbau ohne `databaseLocation` öffnet keine, und genau so lief der Nachweis.

**2 — Ein Bündel hat kein Verzeichnis mit SQL-Dateien. Auch kein richtig aufgelöstes.**

Der naheliegende Weg wäre gewesen, die URL zu reparieren. Das hätte nichts geholfen: In der
Binärdatei gibt es `packages/storage/migrations/` nicht, egal auf welchen Pfad man zeigt. Der
Bündler nimmt JavaScript mit, kein SQL.

Deshalb liegen die 14 Dateien jetzt in `migrations.embedded.ts` und gehen so durch den Bündler.
**Wörtlich, Zeichen für Zeichen** (`JSON.stringify`, nicht Rückwärtsanführungszeichen):
`schema_migration.checksum` ist der SHA-256 über den Inhalt der Vorwärtsdatei. Eine geglättete
Kopie hätte andere Prüfsummen ergeben, und jeder Bestand, der je aus dem Quelltext migriert wurde,
wäre von der gebündelten Fassung als „nachträglich verändert" abgewiesen worden — ein Fehler, der
teurer gewesen wäre als der, den ich behebe.

**3 — Eine Kopie ohne Abgleich ist die nächste Ausgabe desselben Fehlers.**

Wer `0015_….sql` anlegt und den Erzeuger vergisst, baute sonst eine Binärdatei mit vierzehn
Migrationen und eine Oberfläche, die fünfzehn erwartet. Deshalb liest `openDatabase`, **solange
das Verzeichnis vorhanden ist** — Entwicklung, jeder Test, jeder Nachweispfad —, beides und hält
es gegeneinander. In der Binärdatei fehlt das Verzeichnis; dort gibt es nichts abzugleichen.

Das ist bewusst kein neuer Nachweispfad: Der Abgleich läuft in `openDatabase` und damit in den
Tests, die ohnehin in `pnpm check` stehen. Gemessen (Gegenprobe, siehe „Prüfungen"): eine
angehängte Kommentarzeile in `0007_…down.sql` macht vier Fälle in `packages/storage/test/open.test.ts`
rot, mit dem Befehl in der Meldung.

Nebenbefund, mitbehoben: Die Prüfsumme entsteht jetzt nach dem Vereinheitlichen der Zeilenenden.
Vorher hing sie an der Auscheckeinstellung des Rechners — unter Windows mit `core.autocrlf=true`
hätte derselbe Quelltext eine andere Prüfsumme ergeben als das Abbild.

**4 — Die Wegsuche des Aufgabenbereichs wirft nicht mehr, und ihr Fehler kostet nicht mehr den Start.**

Zwei getrennte Änderungen, weil es zwei getrennte Fehler sind:

* `candidateRoots()` baut den Entwicklungspfad nur noch, wenn es einen Quelltextort **gibt**.
  `process.execPath` — der erste Kandidat und der, der in der Auslieferung zählt — braucht kein
  Wissen über den Quelltext und gilt in beiden Gestalten.
* `main.ts` klammert den Start des Aufgabenbereichs ein. Der Kopf von `server.ts` sagt seit T-021,
  ein fehlender Aufgabenbereich sei „kein Abbruchgrund für den Dienst". Das galt für die Fälle, an
  die jemand gedacht hatte (kein Bündel, belegter Port), und nicht für den, an den niemand gedacht
  hatte. Jetzt gilt es für alle: Der Dienst meldet eine Warnung und läuft weiter.

**5 — Was `sidecar:verify` entging, und was er jetzt tut.**

Er hätte den Migrationsfehler gefunden — Prüfung „kommt hoch" wäre rot geworden. Er ist nur nie
gelaufen: `sidecar:verify` steht in `app:build` und in **keiner** Kette, die jemand ausführt.
`pnpm desktop` ruft `app:dev` und das ist `build-sidecar && tauri dev`, ohne Nachweis. `pnpm check`
kennt ihn nicht.

Drei inhaltliche Lücken hatte er zusätzlich:

| Lücke | Folge |
|---|---|
| startete die Binärdatei **im Bauordner** | neben ihr liegt kein `taskpane`; ob sie ihr Bündel findet, war nie geprüft |
| sah Port 17844 nicht an | der ganze zweite Port war blind |
| `/health` als einziger Fachnachweis | die Route hängt an keinem Port und antwortet auch ohne jeden Bestand |

Der Lauf baut jetzt ein **Installationsbild** in einem Wegwerfordner — Binärdatei (harte
Verknüpfung, sonst Kopie; keine symbolische, weil Node `execPath` auflöst), daneben ein
`taskpane`-Bündel mit einem Zufallskennzeichen — und startet den Dienst von dort, mit einem
**leeren Arbeitsverzeichnis**. Wer sich zur Laufzeit auf den Ort des Quelltextes oder auf
`process.cwd()` verlässt, fällt hier auf.

Acht neue Prüfungen (12 → 20):

```
 7  Die Ausgabe meldet keinen Startfehler          fängt „erst lauschen, dann sterben"
11  GET /todo-statuses ergibt 200                  eine Fachroute antwortet nur aus einem
                                                   migrierten Schema
12  die vorbelegten Spalten aus 0002 sind da       leere Liste = Datenmigration nicht gelaufen
13  takt.db liegt im Anwendungsdatenverzeichnis
14  der Aufgabenbereich meldet sich auf 17844
15  er liefert die index.html aus dem Bündel        Zufallskennzeichen, also *dieses* Bündel
16  eine Endung außerhalb der Positivliste → 403    die `.pem` liegt *im* Bündel
17  kodierte Aufwärtsschritte holen nichts Fremdes
```

Prüfung 7 ist die wichtigste der acht: `entry.ts` fängt jeden Wurf aus `main()` und schreibt „Der
lokale Dienst konnte nicht starten: …". Diese Zeile darf es nicht geben — auch dann nicht, wenn
der Dienst kurz zuvor noch gemeldet hat, dass er lauscht. Genau diese Reihenfolge wäre beim reinen
Aufgabenbereichsfehler aufgetreten.

Die HTTPS-Prüfungen schalten **nichts** ab. Statt `rejectUnauthorized: false` bekommt die Anfrage
das Zertifikat, das der Dienst gerade selbst in das Anwendungsdatenverzeichnis geschrieben hat, als
einzige Vertrauenswurzel. Die Prüfung läuft vollständig und schlägt fehl, wenn ein anderer Prozess
auf 17844 antwortet, wenn das Zertifikat nicht auf `localhost` lautet oder wenn es abgelaufen ist —
alles Fälle, die Outlook beim Benutzer genauso träfen.

**6 — Die Gegenprobe: beide Fehler einzeln wieder eingebaut, beide rot, beide zurückgenommen.**

```
open.ts wieder ungeschützt      →  6 bestanden, 2 fehlgeschlagen, Exitcode 1
                                   FEHL  Mit beiden Startzeilen über stdin kommt der Dienst hoch
                                         — Der lokale Dienst konnte nicht starten: Invalid URL
                                   FEHL  Die Ausgabe meldet keinen Startfehler

server.ts wieder ungeschützt    → 16 bestanden, 4 fehlgeschlagen, Exitcode 1
                                   FEHL  Der Aufgabenbereich meldet sich auf Port 17844
                                   + die drei Prüfungen am Aufgabenbereich entfallen

beide behoben                   → 20 bestanden, 0 fehlgeschlagen, Exitcode 0
```

Der zweite Lauf ist der aufschlussreiche: Mit dem alten Nachweis wäre er **grün** gewesen. Zwölf
Prüfungen, keine davon am zweiten Port; der Dienst lauscht ja, und mit der Klammer aus Punkt 4
stirbt er nicht einmal mehr. Die vier neuen Prüfungen sind der einzige Grund, dass dieser Fehler
jetzt gesehen wird.

**7 — Die Suche nach weiteren Stellen derselben Art.**

Über `packages/domain/src`, `packages/storage/src`, `packages/export/src`, `apps/local-api/src`,
`apps/desktop/src` und `apps/desktop/sidecar` nach `import.meta`, `__dirname`, `__filename` und
`process.cwd()`:

```
packages/storage/src/sqlite/open.ts:44       import.meta.url    ← der Startfehler, behoben
apps/local-api/src/taskpane/server.ts:93     import.meta.url    ← die zweite Stelle, behoben
```

Sonst **nichts**. Kein `__dirname`, kein `__filename`, kein `process.cwd()` in Laufzeitcode. Dazu
gegengeprüft, was sonst noch von der Festplatte liest: `certificate.ts` erzeugt Schlüssel und
Zertifikat vollständig mit `node:crypto` und liest nur, was es selbst geschrieben hat;
`token-store.ts` liest aus dem Anwendungsdatenverzeichnis. Beide Wege gehen über
`access/paths.ts`, und der kennt nur `%LOCALAPPDATA%` beziehungsweise `XDG_DATA_HOME` — keinen
Quelltextort. Der Lauf mit leerem Arbeitsverzeichnis (Punkt 5) ist die laufende Gegenprobe dazu.

---

Abweichungen:

**1 — `defaultMigrationsDirectory()` wirft jetzt, statt `string | null` zu liefern.** Die ehrliche
Signatur wäre `string | null`. `packages/storage/test/open.test.ts` reicht den Rückgabewert aber
direkt als `migrationsDirectory: string` weiter, und die Datei gehört mir nicht. Die Funktion ist
seit T-053 ohnehin nur noch der Weg der Tests; der Dienst benutzt sie nicht mehr. Der Wurf nennt
den Grund („liegt nur neben dem Quelltext") statt „Invalid URL".

**2 — Ich habe drei Dateien vorübergehend verändert, um die Prüfer zu prüfen** (Punkt 3 und 6):
`open.ts`, `taskpane/server.ts`, `0007_audit_order_by_rowid.down.sql`. Alle drei in meiner Hoheit,
alle drei zurückgenommen und nachgewiesen (`diff` gegen die Sicherung, `migrations:embed --check`).
Danach neu gebaut; die ausgelieferte Binärdatei entspricht dem jetzigen Quelltext.

**3 — `esbuild` warnt weiterhin zweimal `"import.meta" is not available with the "cjs" output
format`.** Die Warnung ist inhaltlich richtig und stand vorher genauso da — sie hat den Fehler
angesagt, und niemand hat sie gelesen. Ich kann sie nicht abstellen, ohne `build-sidecar.mjs`
anzufassen; der Vorschlag steht unter „Auflagen".

---

Prüfungen:

```
pnpm check          Exitcode 0
                    typecheck: 8 Projekte fehlerfrei
                    boundaries: fehlerfrei
                    contrast: 0 von 332 Paaren durchgefallen
                    proof:openapi: 46 bestanden, 0 fehlgeschlagen
                    proof:callers: 18 bestanden, 0 fehlgeschlagen
                    test:coverage: 34 Dateien, 556 Tests, alle grün
                                   Statements 92,04 % · Branches 83,98 % · Functions 96 %
                    build: alle Pakete
```

Alle elf Nachweispfade einzeln:

```
proof:access           75 bestanden, 0 fehlgeschlagen
proof:export           97 bestanden, 0 fehlgeschlagen
proof:export-api       69 bestanden, 0 fehlgeschlagen
proof:taskpane         25 bestanden, 0 fehlgeschlagen
proof:addin-wiring     32 bestanden, 0 fehlgeschlagen
proof:route-policy     40 bestanden, 0 fehlgeschlagen
proof:template-fields  30 bestanden, 0 fehlgeschlagen
proof:db-permissions   17 bestanden, 0 fehlgeschlagen
proof:openapi          46 bestanden, 0 fehlgeschlagen
proof:callers           0 fehlgeschlagen
proof:addin            86 bestanden, 0 fehlgeschlagen
```

Der Nachweis gegen die Binärdatei:

```
pnpm --filter @takt/desktop sidecar:verify    20 bestanden, 0 fehlgeschlagen  (vorher 12)
```

`pnpm desktop`, 150 Sekunden am Stück, Auszug aus dem Protokoll:

```
     Running `target/debug/takt-desktop`
[dienst] {"level":"info","message":"Der Bestand wird von Fassung 0 auf 7 gebracht."}
[dienst] {"level":"info","message":"Bestand auf Fassung 7 gebracht."}
[dienst] {"level":"info","message":"Takt lauscht auf 127.0.0.1:17843."}
[dienst] {"method":"GET","path":"/api/v1/tag-tree","status":200,…}
[dienst] {"method":"GET","path":"/api/v1/todo-statuses","status":200,…}
… 90 Sekunden lang weiter, bis zum Beenden von Hand
```

Der Dienst kommt hoch, migriert auf Fassung 7 und bleibt oben; die Oberfläche bekommt auf jeder
Route 200. Beim Beenden der Hülle ist der Sidecar mitgegangen (`pgrep` danach leer, B-1.6.3).

Gegenproben (jeweils zurückgenommen):

```
open.ts ohne Schutz          sidecar:verify  6 bestanden, 2 fehlgeschlagen, Exitcode 1
server.ts ohne Schutz        sidecar:verify 16 bestanden, 4 fehlgeschlagen, Exitcode 1
0007_….down.sql verändert    vitest open.test.ts  4 Fälle rot, Meldung nennt migrations:embed
```

---

Auflagen:

**1 — `sidecar:verify` gehört in eine Kette, die jemand ausführt. Das ist der eigentliche Befund.**
Nicht meine Dateien. Konkret gewünscht:

*Wurzel-`package.json` (Orchestrator):*

```json
"sidecar:verify": "pnpm --filter @takt/desktop sidecar:verify",
```

Ob er in `check` gehört, ist eine Abwägung, die nicht mir zusteht: Er braucht `rustc`, baut
120 MiB und belegt zwei Ports. Mein Vorschlag ist eine **zweite** Kette neben `check` — etwa
`verify:bundle` = `pnpm --filter @takt/desktop sidecar && pnpm --filter @takt/desktop sidecar:verify` —,
die vor jeder Auslieferung und in jedem Durchlauf läuft, der die Hülle anfasst. Ein Lauf, der nur
in `app:build` steht, ist genau die Lücke, die T-053 verursacht hat.

*`apps/desktop/package.json` (frontend-dev):*

```json
"app:dev": "node scripts/build-sidecar.mjs && node scripts/verify-sidecar.mjs && tauri dev",
```

Der Nachweis dauert rund zwanzig Sekunden. Er hätte diesen Blocker vor dem Auftraggeber gefunden.

**2 — `build-sidecar.mjs` soll die `import.meta`-Warnung nicht mehr durchwinken** (frontend-dev).
Zwei Zeilen, beide in `build()`:

```js
define: { …, 'import.meta.url': '""' },   // ausdrücklich leer statt zufällig leer
logOverride: { 'empty-import-meta': 'error' },   // oder: bei Warnungen abbrechen
```

Die erste macht aus einer stillen Annahme eine geschriebene: `import.meta.url` ist im Bündel die
leere Zeichenkette, und beide Fundstellen behandeln das bereits als „gibt es nicht". Die zweite
sorgt dafür, dass die nächste Stelle dieser Art den Bau anhält, statt eine Warnung zu schreiben,
die niemand liest.

**3 — `README.md` und `docs/` führen „zwölf Prüfungen" am Sidecar-Nachweis, es sind zwanzig.**
Beide gehören mir nicht (bis auf `architektur.md`, dort ist es nachgezogen).

---

Offene Fragen:

**1 — Das Bündel des Aufgabenbereichs wird nirgends neben die Binärdatei kopiert. Blocker für
E-046, nicht für den Start.** Gemessen: `apps/desktop/scripts/build-app.mjs` kennt das Wort
`taskpane` nicht, `src-tauri/tauri.conf.json` hat kein `resources`, und in `tauri dev` meldet der
Dienst folgerichtig:

```
[dienst] Der Aufgabenbereich des Add-ins wird nicht ausgeliefert: Es liegt kein Bündel vor.
```

Der Weg im Dienst ist jetzt richtig und geprüft — `sidecar:verify` weist nach, dass er ein Bündel
neben `process.execPath` findet und ausliefert. Es legt nur niemand eines dorthin. Nötig ist ein
Schritt, der `apps/outlook-addin/dist` nach `taskpane/` neben den Sidecar kopiert: in
`build-app.mjs` für die Auslieferung und nach `src-tauri/target/debug/` für `tauri dev`. Beide
Dateien gehören frontend-dev. **Ohne das ist das Outlook-Add-in in der ausgelieferten Anwendung
nicht benutzbar** — dieselbe Sorte Lücke wie T-053, nur eine Ebene höher: Der Quelltext stimmt, das
Erzeugnis ist unvollständig, und kein Lauf hat es je gemessen.

**2 — Soll der gebündelte Dienst im Entwicklungsbetrieb den Arbeitsbereich kennen?** Heute nicht:
Im Bündel gibt es nur den Kandidaten neben `process.execPath`, und das ist in `tauri dev` der
Ordner `src-tauri/target/debug/`. Ich halte das für richtig — der ausgelieferte Dienst soll nichts
über ein Repository wissen —, aber es bedeutet, dass Frage 1 auch für `tauri dev` beantwortet
werden muss und nicht nur für `app:build`.

**3 — Vier Fälle derselben Art in diesem Projekt. Der fünfte kommt aus demselben Loch.** Die
gemeinsame Ursache ist nicht „Pfade", sondern: **jeder Nachweis läuft aus dem Quelltext.** Elf
Nachweispfade, 556 Vitest-Fälle, 28 End-to-End-Fälle, und der einzige Lauf, der das Erzeugnis
ausführt, stand außerhalb jeder Kette. Punkt 1 der Auflagen behebt das für den Sidecar. Es gibt
zwei weitere Erzeugnisse, für die dasselbe gilt und für die ich es nicht geprüft habe: das
`vite build`-Ergebnis von `apps/web` (die End-to-End-Fälle laufen gegen `vite dev`) und das von
`apps/outlook-addin`. Ob dort dieselbe Lücke klafft, gehört gemessen und nicht vermutet — als
eigene Aufgabe für e2e-tester.
