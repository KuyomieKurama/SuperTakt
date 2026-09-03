# R-3 — Sicherheitsprüfung des Branches `status-als-regelterm`

Aufgabe: R-3 — Sicherheitsprüfung `status-als-regelterm` (E-055 bis E-057)
Prüfumfang: `git diff 7c71186..HEAD`, vier Commits (`48c982a`, `a2d74ef`, `08162fd`, `3240dcc`),
99 geänderte Dateien, davon 64 übersetzbare Quelldateien und zwei Migrationsdateien.
Datum: 2026-09-03. Verantwortlich: security-checker.
Urteil: **freigegeben mit Auflagen** — eine Auflage, und sie betrifft nicht den Code.

---

## 0. Was tatsächlich gelaufen ist

Damit niemand ein Prüfergebnis annimmt, das es nicht gibt.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 64 geänderten Quelldateien | **ja** | 129 Regeln, 64 Ziele, **0 Befunde**, 100 % geparst. Aus `p/secrets` null Treffer. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | Alle drei Aufrufe: `Not logged into Semgrep Guardian.` Unverändert seit T-003, T-023, T-067. Es liegt kein Plattformbefund vor, weder positiv noch negativ. |
| 42Crunch-Audit | **nein** | `42c-ast` nicht installiert, `~/.42crunch` existiert nicht. Unverändert. Die OpenAPI-Beschreibung liegt vor (210 KB) — das Hindernis ist ausschließlich das Werkzeug. Offene Frage 8 bleibt offen. |
| 42Crunch-Scan | **nein** | Setzt den Audit voraus. |
| `pnpm run boundaries` | **ja** | grün. 298 Quelldateien auf Tiefenzugriffe, 8 in `packages/export`, „Notiz-Trennung: alle Schichten unverletzt". |
| `pnpm run proof:route-policy` | **ja** | 40 bestanden, 0 fehlgeschlagen. |
| `pnpm run proof:access` | **ja** | 75 bestanden, 0 fehlgeschlagen. |
| `pnpm run proof:db-permissions` | **ja** | 17 bestanden, 0 fehlgeschlagen — einschließlich Migration 0011 vorwärts, rückwärts, wieder vorwärts, Sicherungskopie mit 0600. |
| `pnpm run proof:openapi` | **ja** | 81 bestanden, 0 fehlgeschlagen. |
| `pnpm run proof:addin` | **ja** | 123 bestanden, 0 fehlgeschlagen. |
| `pnpm run proof:conflicts` | **ja** | 149 bestanden, 0 fehlgeschlagen. |
| Eigene Messungen gegen den zusammengesetzten Dienst (`compose`, `:memory:`) | **ja** | Drei Proben zu Eingabeprüfung, Injektion und Kosten — Abschnitte 2 und 6. |

Die Definition of Done ist damit an einem Punkt erfüllt („Semgrep ohne offene Befunde hoher
Schwere") und an einem unverändert **nicht erfüllbar** („42Crunch über der Schwelle"). Das ist
eine Beschaffungsentscheidung und keine technische; sie steht seit T-023 offen und ist kein
Befund dieses Branches.

---

## 1. Zusammenfassung

Der fachliche Kern dieses Branches — die Regel wird von einer Liste gleichartiger Terme zu einer
Struktur mit fünf benannten Achsen — ist sicherheitstechnisch sauber gebaut. Die Aufzählungen
werden an der Routengrenze mit Zod geprüft und nicht erst in SQL; die Datenbank hält dieselbe
Bedingung ein zweites Mal als `CHECK`. Alle drei neuen Listen sind auf 200 Einträge begrenzt, und
die Begrenzung steht sowohl im Zod-Schema als auch in der OpenAPI-Beschreibung. In der neu
zusammengesetzten Abfrage stehen ausschließlich Platzhalter; ich habe das nicht nur gelesen,
sondern mit `'`, `a' OR '1'='1` und `%` als Poolkennung gemessen — alle drei ergeben 200 mit
leerem Ergebnis. Die Notiz-Trennung hält: `Todo` trägt weiterhin kein Notizfeld, `boundaries` ist
grün, und `proof:openapi` misst über **jede** aufgezeichnete Antwort des Durchlaufs, dass der
interne Vermerk nur aus seiner eigenen Route herauskommt.

Der Befund, der diesen Bericht trägt, liegt nicht im Code: Mit `48c982a` sind **186 MB
Bauergebnisse** in die Historie geraten — eine 138,7 MB große `.AppImage` und ein 47,5 MB großes
`.deb`. Der Branch ist noch nicht gepusht; genau deshalb ist das jetzt eine Zeile Arbeit und nach
dem Push eine Historienumschreibung.

Drei weitere Punkte sind Sorgfalt und keine Löcher: Der Wächter über die Notiz-Trennung kann über
null Dateien laufen und trotzdem grün melden; der Fragezeichenparameter `poolId` wird weder
geprüft noch gezählt und kostet in der Spitze messbar acht Sekunden Rechenzeit in einer einzigen
Anfrage; und die neue Ordnerauflösung ist je Term statt je Teilbaum, was ihre Kosten in einer
gebauten Pathologie um den Faktor 70 hebt.

---

## 2. Eingabevalidierung der neuen Regelfelder

**Geprüft wird an der Routengrenze, nicht in SQL.** Die fünf Achsen kommen als Zod-Schemata an:
`apps/local-api/src/routes/structure.ts:92` (`completion` als `z.enum(['any','done','open'])`),
`:93` (`exportState` als `z.enum(['any','open','exported'])`), `:102` (`statusIds` als
`z.array(idSchema).max(200)`), `:78` (beide Taglisten als markierte Vereinigung `tag`/`folder`,
ebenfalls `.max(200)`), `matchMode` und `placement` als Aufzählungen bei `:116` und `:112`.
`idSchema` (`apps/local-api/src/http/input.ts:33`) begrenzt Länge auf 64 und den Zeichenvorrat auf
`[A-Za-z0-9._:-]` — es gibt damit keine Kennung, die ein Anführungszeichen, ein Prozentzeichen
oder einen Unterstrich in eine Abfrage tragen könnte. Die Migration hält dieselben Aufzählungen
ein zweites Mal als `CHECK` (`packages/storage/migrations/0011_pool_rule_axes.up.sql:100`, `:107`,
`:124`). Zwei Schichten, dieselbe Aussage, in der richtigen Reihenfolge.

**Unbekannte `status_id`, fremde `folderId`.** Beide laufen in den Fremdschlüssel und werden über
`packages/storage/src/sqlite/errors.ts:357` zu `validation_error` — HTTP 422 mit dem konstanten
Satz „Ein verwiesener Datensatz existiert nicht oder wird noch benutzt." Die SQLite-Meldung
verlässt den Prozess nie; `apps/local-api/src/app.ts:253` ist das letzte Netz und gibt bei allem,
was keine Regel der Speicherung ist, `internal_error` ohne Innenleben zurück. Das ist B-2.4
Punkt 4, und es hält.

**Doppelte Terme.** `ux_pool_rule` trägt seit dieser Migration zusätzlich `role` und `status_id`
(`0011_pool_rule_axes.up.sql:156`). Ein doppelter Regelteil ergibt 422 mit „Derselbe Regelteil
steht zweimal in dieser Regel." — gemessen in `proof:conflicts`. Bemerkenswert und richtig: dasselbe
Tag darf zugleich erforderlich und ausgeschlossen sein, weil das eine unsinnige Benutzereingabe ist
und kein Datenbankfehler. Die Regel trifft dann nichts, und das ist die Antwort der Oberfläche.

**Sehr viele Terme.** 200 je Liste, drei Listen, hart begrenzt. Der Rumpf steht zusätzlich unter
der 1-MB-Grenze aus B-1.7 (in `proof:access` gemessen: 413).

**Sehr tiefe Ordnerbäume, Zyklen.** Die rekursive Auflösung
(`packages/storage/src/sqlite/repo-tags.ts:907`) hält die Schranke `down.depth < 1000` (`:912`).
Sie ist das, was einen Zyklus im Ordnerbaum enden lässt: Das `UNION` entdoppelt über das Tripel
`(root, id, depth)`, und weil `depth` mitläuft, würde ein Zyklus ohne diese Schranke unbegrenzt
weiterlaufen. Mit ihr ist der Aufwand nach oben beschränkt. Zyklen entstehen ohnehin nicht —
`checkFolderMove` weist sie ab (A-4.6) —, aber die Schranke trägt auch dann, wenn diese Prüfung
einmal umgangen würde. Das ist die richtige Bauart.

---

## 3. SQL-Zusammensetzung

**Nur Platzhalter.** In `buildConditions` (`packages/storage/src/sqlite/repo-todos.ts:79-243`)
geht kein einziger Wert aus einer Benutzereingabe in den Abfragetext. Was dort steht, ist
entweder ein Literal des Programms (`'open'`, `'exported'`, `t.completed_at IS NULL`) oder
`placeholders(n)`. Dasselbe in `resolvePoolAxis` (`repo-tags.ts:874-940`) und in der neuen
`exportPresence` (`repo-time.ts:271-296`), die ihre `IN`-Liste zusätzlich über `chunk` in Blöcke
unter der Variablengrenze von SQLite teilt.

Gemessen statt geglaubt: Mit `poolId='` , `poolId=a' OR '1'='1` und `poolId=%` antwortet der
Dienst je 200 mit leerer Trefferliste. Es gibt keinen Weg, über die Poolkennung eine Bedingung zu
verändern.

**Die Parameterreihenfolge nach der T-082-Korrektur ist der wichtigste Fund dieses Branches — und
er ist behoben.** Bis T-082 wanderten die Werte einer Regel unmittelbar in die gemeinsame
`params`-Liste, bevor feststand, ob ihre Bedingungen überhaupt im Abfragetext landen. Seit E-057
kann eine Regel **mit** Achsen nichts treffen; ihre Statuskennungen hätten dann in `params`
gelegen, während ihr Fragezeichen mit `0 = 1` verschwindet — und **alle** folgenden Werte der
Abfrage wären um eine Stelle verrutscht, auch die der Suche und der Blätterung. Das ist kein
Anzeigefehler, sondern eine Abfrage, die andere Todos liefert als die, nach denen gefragt wurde,
also ein Integritätsproblem an W-04 über den Umweg der Anzeige. Die Werte werden jetzt je Regel
in `poolParams` gesammelt (`repo-todos.ts:146`) und erst übernommen, wenn ihre Bedingungen im
Text stehen (`:239`). Der Prüfpfad `proof:openapi` Abschnitt 12 misst die Übereinstimmung von
Abfrage und Domänenregel über alle fünf Achsen.

**`IN (…)`-Listen.** Alle drei sind auf 200 begrenzt, `exportPresence` zusätzlich geblockt. Die
einzige unbegrenzte Liste in diesem Umfeld ist `poolIds` aus dem Fragezeichenparameter — siehe
Befund S-2.

---

## 4. Vertrauensgrenze Add-in (VG-2)

**Welche Daten das Add-in jetzt bekommt.** `GET /addin/context`
(`apps/local-api/src/routes/addin/service.ts:66-83`) liefert unverändert Tagbaum, Status,
Standard-Tags — und `pools.list()`. Der `Pool` trägt seit T-076 vier Felder mehr: `excludedTags`,
`statusIds`, `completion`, `exportState`. Die Buchungs- und die Trefferantwort tragen zwei
Namenslisten mehr: `enteringPoolNames` und `leavingPoolNames`
(`apps/local-api/src/routes/addin/index.ts:373`, `:379`).

**Ist das eine neue Datenklasse? Nein.** Die Begründung im einzelnen, weil die Frage genau richtig
gestellt ist:

- **Ordnerkennungen** verließen den Dienst schon vorher an dieser Route — als `folderId` in den
  Regeltermen und ohnehin vollständig über `folders.loadTree()`. `resolveAxes` liefert
  `emptyFolderIds` zusätzlich, aber diese Kennungen bleiben **im Dienst**: Sie werden in
  `poolNamer` ausschließlich zu `unresolvedRequired` verrechnet
  (`routes/addin/service.ts:328`) und stehen in keiner Antwort. Ich habe den Teilbaum darauf
  abgesucht — `emptyFolderIds` kommt in `routes/addin/**` an genau zwei Stellen vor, beide in der
  Berechnung.
- **Poolnamen** gingen seit T-038 hinaus. `appears`/`enters`/`leaves` sind drei Sichten auf
  dieselbe Menge, nicht drei Mengen; `enters` ist eine Teilmenge von `appears`, und `leaves`
  entsteht aus demselben Regeldurchgang. Kein Bestand, keine fremden Todos, keine Buchungen
  fremder Todos.
- **Die vier zusätzlichen Regelfelder** sind Konfiguration, die der Benutzer selbst angelegt hat.
  Sie sagen, wonach eine Spalte filtert, nicht was in ihr steht. Für ein entwendetes Add-in-Token
  ist das ein Zuwachs an Kenntnis über die Einrichtung, nicht über die Kundendaten.
- **Ausdrücklich nicht ausgeliefert** wird `PoolWithResolution`: Die OpenAPI-Beschreibung hängt
  sie an `/pools` und an das Board, und die Begründung steht am Schema. Das ist eine bewusst
  gezogene Linie und keine Auslassung.

**Der Ausschnitt ist enger geworden, nicht weiter.** `AddinUnit.pools` steht jetzt auf
`Pick<PoolPort, 'list' | 'resolveAxes'>` (`routes/addin/ports.ts:146`) statt auf
`'list' | 'resolveRule'`. Zwei Methoden sind weg, eine ist dazugekommen, und die neue liest
dieselben Zeilen derselben Tabelle. Der Port-Ausschnitt ist die Stelle, an der eine Ausweitung
sichtbar wird; sie wurde in dieser Aufgabe angefasst und dabei verkleinert.

**Das Token-Modell steht unverändert.** `requiredCredentialForPath`
(`apps/local-api/src/access/route-policy.ts`) verlangt `session` für jeden Pfad; abgesenkt sind
nur der Teilbaum `/api/v1/addin` und `GET /health`. Keine der beiden Listen ist in diesem Branch
angefasst worden.

**Was `proof:route-policy` deckt — und was nicht.** Es deckt mehr, als ich erwartet hatte:
`proof-route-policy.mjs:396` misst, dass die Add-in-Fläche **genau vier Routen** sind, `:402`,
dass daneben genau `GET /health` abgesenkt ist, und `:408-421`, dass alle übrigen 60 Routen mit
dem Add-in-Token 401 ergeben — einschließlich der Vermerksroute, des Exports und der
Einstellungen. Eine fünfte Add-in-Route würde den Lauf rot machen. Was es **nicht** deckt, ist der
**Inhalt** dieser vier Antworten: Ein neues Feld an einer bestehenden Add-in-Antwort — also genau
das, was T-084 und T-086 getan haben — passiert diesen Nachweis lautlos. Die Wache dagegen ist
zweiteilig und liegt anderswo: der Port-Ausschnitt in `ports.ts` (ein Entwickler muss ihn
anfassen, um an neue Daten zu kommen) und `proof:openapi`, das die Gestalt jeder Antwort gegen die
Beschreibung hält. Beide haben in dieser Welle funktioniert. Ich halte das für tragfähig und
schlage keine dritte Wache vor.

`proof:access` deckt die andere Hälfte und ist unverändert grün: Token nur in der Kopfzeile, 400
bei Token im Pfad, keine Wiederholung des Wertes, zeitkonstanter Vergleich, 0600/0700 an Datei und
Verzeichnis, kein Geheimnis in 52 Antwortkörpern.

---

## 5. Notiz-Trennung

`pnpm run boundaries` ist grün. Was der Nachweis tatsächlich abdeckt, in seiner eigenen Reihenfolge:

1. `packages/domain/src/export.ts` importiert nur `kernel` und `rounding` — der Exportmotor hat
   keinen Typ, mit dem er den Vermerk benennen könnte; sieben Typbehauptungen sind vorhanden.
2. Die `exports`-Tabelle von `@takt/domain` hat keinen Platzhalter; ein Tiefenzugriff scheitert an
   der Auflösung.
3. `packages/export` importiert ausschließlich `@takt/domain/export` — 8 Quelldateien geprüft.
4. 298 Quelldateien außerhalb der Domäne auf `@takt/domain/src`-Zugriffe geprüft.

Dazu kommt eine Prüfung, die stärker ist als alle vier, weil sie dynamisch ist:
`proof-openapi.mjs:606-613` sammelt **jede** Antwort des Szenariodurchlaufs ein und misst, dass die
Markierung `VERMERK-INTERN-A72-nicht-exportierbar` in keiner Antwort außer `getTodoNote` und
`putTodoNote` vorkommt. Der Durchlauf fährt jede beschriebene Operation an, also auch die neuen
Antworten dieses Branches.

Im Diff habe ich nach neuen Antworten gesucht, die daran vorbeigehen könnten, und keine gefunden.
`Todo` trägt weiterhin kein Notizfeld (`packages/domain/src/todo.ts:80-99`); der Vermerk ist ein
eigener Typ mit eigener Tabelle. Die neuen Felder sind Namenslisten und Wahrheitswerte. Der
Exportmotor ist in diesem Branch nicht angefasst worden.

---

## 6. Migration 0011 und `RESTRICT`

**Die Frage:** Kann ein Angreifer mit Zugriff auf den Dienst über eine Regel einen Status
unlöschbar machen?

**Die Antwort: technisch ja, im Rahmen des Bedrohungsmodells bedeutungslos.** Wer eine Regel mit
`statusIds: [X]` anlegt, macht `X` unlöschbar, bis die Regel geändert oder gelöscht wird
(`0011_pool_rule_axes.up.sql:134`, vorgelagert `repo-statuses.ts:290-299`). Drei Gründe, warum das
keine Bedrohung ist:

1. **Der Hebel liegt hinter dem Sitzungsgeheimnis, nicht hinter dem Add-in-Token.** `POST /pools`
   ist eine der 60 Routen, die mit dem Add-in-Token 401 ergeben. Ein entwendetes Dauertoken (der
   Fall, um den sich Abschnitt 5.2 des Modells dreht) erreicht diesen Hebel nicht.
2. **Wer das Sitzungsgeheimnis hat, hat mehr.** Er kann Todos löschen, Buchungen ändern und den
   Exportstatus zurücksetzen. Einen Status unlöschbar zu machen, ist demgegenüber kein Zugewinn.
3. **Es ist reversibel und sichtbar.** Die Regel steht in `GET /pools`, die Antwort ist 409 mit
   `status_in_use` und einem deutschen Satz, und `proof:conflicts` misst die Gegenprobe: nachdem
   der Statusterm heraus ist, lässt sich der Status löschen.

Die Entscheidung `RESTRICT` statt `CASCADE` ist überdies die sicherheitlich richtige: Ein
kaskadierendes Löschen entkernte eine Regel stillschweigend, und eine Spalte, die danach **mehr**
Todos trifft als vorher, ist der Fehler in die gefährliche Richtung. Die Begründung steht an der
Migration und ist richtig.

Ein Verbesserungsvorschlag ohne Sicherheitsgewicht steht als Hinweis H-2.

Die Migration selbst ist in `proof:db-permissions` vorwärts, rückwärts und wieder vorwärts
gefahren worden; die Sicherungskopie des Läufers liegt mit 0600. Die Rückwärtsrichtung existiert
und ist vollständig (`0011_pool_rule_axes.down.sql`).

---

## 7. Befunde

### Auflage A-1 — 186 MB Bauergebnisse liegen in der Historie des Branches

**Schwere: blockierend für den Push, nicht für den Code.**
**Betrifft:** W-11, VG-7, B-11.4 („der erste Commit ist die Veröffentlichung"), Abschnitt 13 des
Bedrohungsmodells. **Anforderung:** CLAUDE.md, Abschnitt Sicherheit; E-021.

**Dateien.**

```
apps/desktop/release/x86_64-unknown-linux-gnu/Takt_0.1.0_amd64.AppImage   138 721 784 Bytes
apps/desktop/release/x86_64-unknown-linux-gnu/Takt_0.1.0_amd64.deb         47 511 598 Bytes
apps/desktop/release/x86_64-unknown-linux-gnu/SHA256SUMS                          179 Bytes
```

Hinzugekommen in `48c982a`. `git check-ignore` meldet für die `.AppImage` Exitcode 1: Sie ist von
**keiner** Ignorierregel gedeckt. Das ist eine Lücke und keine Entscheidung — `apps/desktop/.gitignore`
schließt `binaries/`, `src-tauri/binaries/`, `.sidecar-build/`, `src-tauri/target/`,
`src-tauri/taskpane/`, `src-tauri/WixTools*/` und seit `3240dcc` auch `src-tauri/licenses/` aus,
jedes mit einer ausgeschriebenen Begründung derselben Art („aus … jederzeit wieder herstellbar",
„plattformgebunden"). Der Ordner `apps/desktop/release/` ist neu und in keiner dieser Regeln
enthalten. Der letzte Commit des Branches nimmt die erzeugte Lizenzbeilage heraus — dieselbe
Sorgfalt, angewandt auf 15 704 Zeilen Text, während 186 MB Binärdateien liegen blieben.

**Angriffsbild.** Kein unmittelbarer Ausnutzungsweg, aber drei echte Wirkungen:

1. **Nicht prüfbar.** Ein Bündel dieser Größe kann in einem Review niemand ansehen. Ich habe es
   versucht: `strings` über die `.AppImage` findet keine Pfade aus dem Heimatverzeichnis des
   Entwicklers (die beiden Treffer stammen aus mitgelieferten Fremdbeständen), aber der Inhalt
   liegt in einem SquashFS, und weder `unsquashfs` noch `dpkg-deb` sind auf dieser Maschine
   vorhanden. **Was in diesen 186 MB steckt, ist in dieser Prüfung nicht festgestellt worden.**
   Das Bündel enthält bauartbedingt die Sidecar-Binärdatei und das Add-in-Bündel aus
   `src-tauri/taskpane/` — also alles, was zur Bauzeit in diesen Verzeichnissen lag.
2. **Lieferkette (VG-7).** Eine eingecheckte, vorgebaute Binärdatei mit einer daneben liegenden
   `SHA256SUMS` sieht aus wie eine beglaubigte Auslieferung und ist eine Selbstauskunft. Der
   nächste Schritt, der „nimm die Datei aus dem Repository" heißt, hat damit eine Grundlage, die
   niemand geprüft hat.
3. **Unumkehrbar nach dem Push.** `git branch -r` kennt `origin/main`, `origin/kanban-regelspalten`
   und `origin/release-workflow` — **nicht** `origin/status-als-regelterm`. Der Branch ist noch
   nicht veröffentlicht. Solange das so ist, kostet die Bereinigung einen Rebase; danach kostet
   sie eine Historienumschreibung auf einem geteilten Branch, und die 186 MB bleiben bis dahin in
   jedem Klon.

**Gegenmittel (Orchestrator, vor dem Push).**

1. `apps/desktop/.gitignore` um `release/` ergänzen, mit derselben Begründung wie bei
   `src-tauri/licenses/`: aus `pnpm --filter @takt/desktop app:build` jederzeit wieder herstellbar,
   plattformgebunden.
2. Die drei Dateien aus der Historie des Branches nehmen (Rebase über `48c982a`, oder — einfacher
   und ausreichend — die vier Commits zu einem neuen Stand ohne diese Pfade zusammenfassen).
   Ein bloßes `git rm` in einem fünften Commit genügt **nicht**: Die Blobs blieben in der
   Historie.
3. `.release-config.json` (`{"version":"0.1.0"}`) darf bleiben — sie enthält nichts.

---

### Befund S-1 — Der Wächter über die Notiz-Trennung kann über null Dateien laufen und grün melden

**Schwere: sollte.** **Betrifft:** W-02, VG-5, R-06. **Datei:**
`packages/domain/scripts/check-export-boundary.mjs:57-58`, `:262`, `:288`.

`collect(dir, …)` gibt eine leere Liste zurück, wenn das Verzeichnis nicht existiert (`:58`).
Die beiden Schichten, die über gesammelte Dateien laufen, melden anschließend ihre Zahl als
Fließtext — `packages/export: ${sources.length} Quelldatei(en) auf Importe geprüft` (`:262`) und
`${checked} Quelldatei(en) außerhalb der Domäne auf Tiefenzugriffe geprüft` (`:288`) —, **prüfen
diese Zahl aber nicht**. Eine Umbenennung von `packages/export/src`, ein Umzug der Pakete oder ein
Fehler in `collect` ergäbe „0 Quelldatei(en) geprüft", Exitcode 0 und die Schlusszeile
„Notiz-Trennung: alle Schichten unverletzt."

**Angriffsbild.** Kein Angreifer, ein Versehen — und genau die Sorte Versehen, gegen die dieses
Skript geschrieben wurde. Die Aussage „die Notiz-Trennung hält" ruht in `pnpm check` auf diesem
Exitcode. Ein Nachweis, der über nichts läuft und trotzdem grün meldet, ist schlimmer als keiner,
weil er das Nachsehen ersetzt.

**Gegenmittel (domain-dev).** Je Schicht eine Untergrenze, die `fail()` auslöst statt `note()`:
`packages/export` hat mindestens eine Quelldatei, der Tiefenzugriffslauf mindestens, sagen wir,
fünfzig. Zwei Zeilen. Dieselbe Bauart benutzt `proof:route-policy` bereits
(`routes.length >= 60`), und dort trägt sie.

Der Befund ist älter als dieser Branch. Er steht hier, weil dieser Branch neue Antworten baut,
deren Unbedenklichkeit an diesem Exitcode hängt.

---

### Befund S-2 — `poolId` wird weder geprüft noch gezählt; gemessen 8,4 Sekunden je Anfrage, ab 999 Kennungen HTTP 500

**Schwere: sollte (mild).** **Betrifft:** B-1.7, W-05 (Verfügbarkeit). **Akteure:** A-03.
**Datei:** `apps/local-api/src/routes/todos.ts:105`, `:114`.

`const poolIds = query['poolId']` und `poolIds.split(',') as never` — kein Zod-Schema, keine
Anzahlgrenze, keine Prüfung gegen `idSchema`. Dasselbe gilt für `statusId` und `tagId` daneben.
Injektion ist ausgeschlossen (Abschnitt 3, gemessen); die Wirkung ist Rechenzeit und ein
Statuscode.

**Gemessen** (`compose`, `:memory:`, Ordnerkette 200 tief, eine Regel mit 200 Ordnertermen):

| Anfrage | Antwort |
|---|---|
| `GET /todos?poolId=<Regel>` | 200 in 42 ms |
| dieselbe Regel 20-mal genannt | 200 in 822 ms |
| dieselbe Regel 200-mal genannt | 200 in **8 370 ms** |
| 999 unbekannte Kennungen | 200 |
| 1 000 unbekannte Kennungen | **500** `internal_error`, im Protokoll `storage_error` |

Die 500 ist die Ausdrucksbaumgrenze von SQLite (`SQLITE_MAX_EXPR_DEPTH`, 1000): Die
ODER-Verkettung der Regeln überschreitet sie. Die Antwort verrät nichts — der Text ist die
Konstante „Ein unerwarteter Fehler ist aufgetreten.", die Protokollzeile nennt nur den Schlüssel.
Es ist also **kein** Auskunftsproblem, sondern ein falscher Statuscode: 500 sagt „bei mir ist
etwas kaputt", wo 422 „das geht so nicht" sagen müsste. Diese Schwelle liegt am ODER-Aufbau und
gab es vor diesem Branch genauso; die 8,4 Sekunden sind neu in dieser Höhe, weil je Poolkennung
jetzt rund acht Abfragen statt zweier laufen.

**Angriffsbild.** Nicht A-02: Die Kette weist eine Anfrage aus einem fremden Browsertab vor dem
Router ab (eigene Kopfzeile, Herkunft, `Sec-Fetch-Site`), was `proof:route-policy` und
`proof:access` messen. Es bleibt A-03, ein lokaler Prozess mit dem Sitzungsgeheimnis — und der
hat größere Möglichkeiten. Der Sidecar ist allerdings einfädig: Acht Sekunden in einer Abfrage
heißen acht Sekunden stehende Oberfläche und ein Lebenszeichen des Timers, das nicht kommt. Das
trifft auch den ehrlichen Benutzer, der sich eine ungünstige Regel gebaut hat.

**Gegenmittel (domain-dev).** `poolId`, `statusId` und `tagId` nach dem `split` durch
`z.array(idSchema).max(50)` schicken. Das ergibt 422 statt 500, begrenzt die Kosten auf ein
Fünfzigstel des Gemessenen und kostet vier Zeilen an einer Stelle, an der ohnehin schon Zod steht.

---

### Hinweis H-1 — Die Ordnerauflösung ist seit E-057 je Term statt je Teilbaum: gemessen Faktor 70

**Schwere: Hinweis.** **Datei:** `packages/storage/src/sqlite/repo-tags.ts:907-916`.

Die rekursive Abfrage trägt jetzt `root` im Tripel: `down(root, id, depth)` statt `down(id, depth)`.
Das ist **notwendig** — ohne die Wurzelspalte ließe sich nicht sagen, welcher genannte Ordner
nichts beigetragen hat, und genau das verlangt E-057. Der Preis ist, dass das `UNION` nicht mehr
je Knoten entdoppelt, sondern je (Term, Knoten).

**Gemessen** (dieselbe Kette, 200 Ordner tief, ein Blatt-Tag):

| Regel | Kosten je Anfrage |
|---|---|
| ein Ordnerterm auf die Wurzel der Kette | 0,6 ms |
| 200 Ordnerterme auf dieselbe Kette | 41,6 ms |

Beide Regeln lösen dieselbe Tagmenge auf. Der Faktor ist rund 70 und wächst mit dem Produkt aus
Termzahl und Tiefe; nach oben begrenzt ihn `max(200)` je Liste und `depth < 1000`, also im
theoretischen Schlimmstfall 200 000 Zeilentripel je Achse und Regel.

**Bewertung.** Kein Loch, eine Kostenstelle. Sie wird erst zusammen mit S-2 unangenehm (dort
gemessen). Wer sie verkleinern will, hat zwei billige Hebel: die Zahl der **Ordner**terme je Liste
enger begrenzen als die der Tagterme (25 statt 200 reicht für jede denkbare Regel), oder die
Tiefenschranke auf ein Maß senken, das ein Mensch anlegt (64). Beides ist eine Entscheidung des
Orchestrators und keine Nacharbeit.

---

### Hinweis H-2 — Der 409 auf einen benutzten Status nennt die Regel nicht beim Namen

**Schwere: Hinweis.** **Datei:** `packages/storage/src/sqlite/repo-statuses.ts:290-299`.

Der Satz lautet „Diesen Status benutzt noch die Regel eines Pools oder einer Kanban-Spalte. Nehmen
Sie ihn dort zuerst heraus." Er sagt nicht, **welche**. Bei einer Handvoll Regeln ist das
gleichgültig; bei zwanzig ist es eine Suche. Die Abfrage, die den Befund erzeugt, hat die
`pool_id` bereits in der Hand — sie in `details` mitzugeben, kostet nichts und macht die Sperre
aus Abschnitt 6 vollends reversibel. Keine Sicherheitswirkung, ein Beitrag zur Erklärbarkeit
derselben Sperre.

---

### Hinweis H-3 — `unresolvedRequired` ist im Typsystem Pflicht und liest sich zur Laufzeit als „nein"

**Schwere: Hinweis.** **Dateien:** `packages/domain/src/tag.ts:1003`, `:1088`, `:1113`;
Board-Punkt O-L.

`poolRuleMatchesNothing` (`tag.ts:1003`) ist `poolRuleIsEmpty(axes) || axes.unresolvedRequired`.
Fehlt das Feld, ist der zweite Operand `undefined`, also falsch — und die Regel trifft wieder das,
was sie vor E-057 traf, nämlich **mehr**. Das Typsystem verhindert das für allen übersetzten Code,
und seit T-088 auch für die Prüffälle in domain, storage und export (`typecheck:test`). Nicht
erfasst bleiben `apps/*/test/**` und sämtliche `scripts/**/*.mjs` — das ist O-L auf dem Board.

Die Skripte dieses Branches halten sich daran, und zwar ausdrücklich:
`apps/outlook-addin/scripts/proof-addin.mjs:2672` misst das Pflichtfeld **in beide Richtungen** und
schlägt Alarm, wenn die Antwort von vor E-057 nicht mehr herstellbar ist — der Prüffall bewacht
also seine eigene Aussagekraft. Das ist die richtige Antwort auf O-L an dieser einen Stelle; sie
skaliert nur nicht auf die nächste.

**Vorschlag (Orchestrator, zu O-L).** Entweder `checkJs` mit JSDoc für `scripts/**` — oder,
billiger und wirksamer, in `matchesPool` bei `typeof unresolvedRequired !== 'boolean'` werfen statt
weiterzurechnen. Ein Aufrufer, der die Frage nicht beantwortet, bekäme dann einen lauten Fehler
statt einer zu weiten Antwort. Fail-closed ist hier möglich, weil kein legitimer Aufrufer das Feld
weglassen darf.

---

### Was ausdrücklich in Ordnung ist

Der Vollständigkeit halber, damit der nächste Leser nicht dasselbe zweimal prüft:

- **Repository-Hygiene im Quellcode.** Keine Zugangsdaten, keine Schlüssel, keine E-Mail-Adressen,
  keine echten Call-Nummern im Diff. Die Call-Nummern der Prüfdaten sind `TCK-000517` und
  `TCK-000518`; die Kennungen in `apps/outlook-addin/scripts/fixtures.mjs` sind durchnummerierte
  Kunstwerte (`01931f4e-0000-7000-8000-0000000042e1`), die Namen erfunden („Musterbetrieb",
  „Störung", „Wartung"). Das Sitzungsgeheimnis der End-zu-End-Hilfe heißt seit jeher
  `takt-e2e-erfundenes-sitzungsgeheimnis-2026-08` und ist als solches benannt; die Geheimnisse der
  Nachweisläufe entstehen zur Laufzeit.
- **Abhängigkeiten.** `pnpm-lock.yaml` ist im gesamten Diff **unverändert**. Kein neues Paket,
  keine neue Version, keine neue Lieferkettenfläche. Die drei geänderten `package.json` fügen je
  ein `test`-Skript hinzu.
- **XSS und ReDoS.** Kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein `eval`, keine `new
  Function`, kein `new RegExp` im gesamten Diff. Der konfigurierbare reguläre Ausdruck des Add-ins
  ist nicht angefasst worden; die Sätze in `duplicate/reopen.ts` sind Zeichenkettenverkettung und
  gehen als Text durch React.
- **Fehlerbehandlung.** Fremdschlüssel- und Eindeutigkeitsverletzungen werden 422 beziehungsweise
  409 mit konstanten Sätzen; kein Indexname, keine SQLite-Meldung, kein Aufrufstapel verlässt den
  Dienst (`errors.ts` Kopf, `app.ts:243-300`).
- **Board und Ansicht.** Dass eine Regel mit `completion !== 'any'` die Ansichtseinstellung
  `includeCompleted` verdrängt (`usecases/board.ts`, `usecases/structure.ts:428-434`), ist eine
  fachliche Entscheidung und keine Umgehung: Sie kann eine Spalte nur um **erledigte** Todos
  erweitern, die ohnehin Mitglied sind, und nie um fremde.

---

## 8. Was am Bedrohungsmodell geändert wurde

`docs/bedrohungsmodell.md` hat einen neuen **Abschnitt 14** bekommen: „Nachprüfung R-3
(2026-09-03) — die Regel als Struktur". Er hält fest:

1. den Werkzeugstand dieses Laufs (Abschnitt 0 dieses Berichts, in Kurzform),
2. die **Fortschreibung von VG-2**: was das Add-in seit T-076/T-084/T-086 zusätzlich bekommt und
   warum es dieselbe Datenklasse bleibt — mit der Feststellung, dass `proof:route-policy` die
   Routenzahl bewacht, aber nicht den Inhalt der vier Antworten,
3. eine **Fortschreibung von B-1.7** mit den beiden Messwerten (8,4 s je Anfrage; 500 ab 1 000
   Kennungen),
4. eine **Fortschreibung von B-11.4 und Abschnitt 13**: Der Baum, der veröffentlicht würde, trägt
   jetzt 186 MB Bauergebnisse — das ändert die Aussage aus T-067 („473 Dateien, geprüft") und ist
   der Grund für die Auflage,
5. die Einordnung von `RESTRICT` auf `pool_rule.status_id` als **kein** neuer Angriffsweg, mit der
   Begründung aus Abschnitt 6.

Am Katalog der Bedrohungen B-1.1 bis B-12.x ist **nichts** umnummeriert oder umgeschrieben worden;
die neuen Feststellungen stehen als Fortschreibungen unter ihren bestehenden Nummern. Das Urteil in
Abschnitt 11 ist unverändert geblieben — es bezieht sich auf den Stand vor der Veröffentlichung
und wird von diesem Branch nicht berührt, solange die Auflage A-1 vor dem Push erledigt wird.

---

## 9. Kurzfassung

```
Aufgabe: R-3 — Sicherheitsprüfung status-als-regelterm
Status: freigegeben mit Auflagen
Artefakte: .claude/team/reports/R-3-security-checker.md, docs/bedrohungsmodell.md (Abschnitt 14)

Zusammenfassung: Die fünf neuen Regelachsen werden an der Routengrenze mit Zod geprüft, sind auf
je 200 Einträge begrenzt und in der Datenbank ein zweites Mal per CHECK gesichert; die
zusammengesetzte Abfrage arbeitet ausschließlich mit Platzhaltern, was ich mit drei
Injektionsproben gegen den laufenden Dienst nachgemessen habe. Die T-082-Korrektur an der
Parameterreihenfolge ist der wichtigste Fund dieses Branches und behoben — ohne sie hätte eine
Regel nach E-057 alle folgenden Werte der Abfrage verschoben, auch die von Suche und Blätterung.
Die Add-in-Fläche ist enger geworden, nicht weiter: zwei Portmethoden weniger, eine mehr, dieselben
Zeilen derselben Tabelle, keine neue Datenklasse; das Token-Modell steht unverändert und
proof:route-policy misst, dass es genau vier Add-in-Routen sind. Die Notiz-Trennung hält in allen
vier Schichten und zusätzlich dynamisch über jede aufgezeichnete Antwort. Der eine blockierende
Punkt liegt außerhalb des Codes: 186 MB Bauergebnisse sind in die Historie geraten.

Befunde:
  Auflage (blockierend für den Push)
    A-1  apps/desktop/release/x86_64-unknown-linux-gnu/{Takt_0.1.0_amd64.AppImage,
         Takt_0.1.0_amd64.deb,SHA256SUMS} — 186 MB Bauergebnisse in 48c982a, von keiner
         .gitignore-Regel gedeckt, Inhalt in dieser Prüfung nicht feststellbar. Branch ist noch
         nicht gepusht; jetzt ein Rebase, danach eine Historienumschreibung.
  Sollte
    S-1  packages/domain/scripts/check-export-boundary.mjs:57,262,288 — der Wächter über die
         Notiz-Trennung meldet grün, auch wenn er über null Dateien gelaufen ist.
    S-2  apps/local-api/src/routes/todos.ts:105,114 — poolId/statusId/tagId ohne Prüfung und
         ohne Anzahlgrenze; gemessen 8 370 ms je Anfrage, ab 1 000 Kennungen HTTP 500 statt 422.
  Hinweis
    H-1  packages/storage/src/sqlite/repo-tags.ts:907 — Auflösung je Term statt je Teilbaum,
         gemessen Faktor 70; notwendig für E-057, aber eine Kostenstelle.
    H-2  packages/storage/src/sqlite/repo-statuses.ts:290 — der 409 nennt die blockierende Regel
         nicht beim Namen.
    H-3  packages/domain/src/tag.ts:1003 — unresolvedRequired liest sich zur Laufzeit als „nein";
         geschützt durch Typen überall außer in scripts/**/*.mjs und apps/*/test/** (O-L).

Annahmen:
  - „Freigegeben mit Auflagen" heißt: Der Code ist freigegeben, der Baum nicht. A-1 ist vor dem
    Push zu erledigen, nicht vor dem nächsten Commit.
  - Ich habe den Inhalt der beiden Bündel nicht feststellen können (weder unsquashfs noch
    dpkg-deb vorhanden) und behaupte deshalb nicht, dass etwas Schützenswertes darin liegt —
    ich behaupte, dass es niemand weiß.
  - S-2 und H-1 bewerte ich als Kostenstellen und nicht als Bedrohung, weil die Kette eine
    fremde Webseite (A-02) vor dem Router abweist und ein lokaler Prozess mit dem
    Sitzungsgeheimnis (A-03) ohnehin größere Möglichkeiten hat.
  - Die Prüfläufe habe ich als Aussage genommen, wo sie messen, und nicht, wo sie behaupten;
    deshalb steht in Abschnitt 4 ausdrücklich, was proof:route-policy nicht deckt.

Risiken:
  - Der Nachweis der Notiz-Trennung ruht auf einem Exitcode, der auch über nichts grün wird
    (S-1). Solange das so ist, ist „boundaries grün" eine schwächere Aussage, als sie klingt.
  - Die Add-in-Fläche wächst künftig nicht über neue Routen (die würden proof:route-policy rot
    machen), sondern über neue Felder an den vier bestehenden Antworten. Dagegen wachen nur der
    Port-Ausschnitt in ports.ts und die Gestaltprüfung — beide haben hier funktioniert, beide
    sind menschliche Aufmerksamkeit an einer Stelle, nicht ein Exitcode.
  - 42Crunch ist weiterhin nicht betriebsbereit. Für eine Beschreibung mit inzwischen über
    44 Pfaden gibt es keinen Auditwert, und das Tor aus Abschnitt 8 des Bedrohungsmodells bleibt
    uneinlösbar.
  - Semgrep Guardian ist zum vierten Mal nicht erreichbar. Der lokale CLI-Lauf ersetzt SAST,
    nicht die Lieferketten- und Geheimnisbefunde der Plattform.

Offene Fragen:
  1. Soll `apps/desktop/release/` künftig überhaupt entstehen, oder gehören die Bündel in einen
     Ordner außerhalb des Arbeitsbaums? Die Ignorierregel behebt das Symptom; ein Pfad außerhalb
     des Repositorys behebt die Ursache.
  2. Zu O-L: `checkJs` für scripts/** oder ein Wurf in matchesPool bei fehlendem
     unresolvedRequired? Ich empfehle das Zweite — es wirkt auch für Aufrufer, die es noch nicht
     gibt.
  3. Bleibt es bei 200 Ordnertermen je Liste? Eine engere Grenze für Ordner (25) wäre fachlich
     folgenlos und nähme H-1 und einen Teil von S-2 die Spitze.
  4. Wird der 42Crunch-Zugang beschafft oder das Tor gestrichen und ersetzt? Die Frage steht seit
     T-023 und altert schlecht.

Nächster Schritt:
  Orchestrator: A-1 vor dem Push erledigen — `release/` in apps/desktop/.gitignore, die drei
  Dateien aus der Historie des Branches nehmen. Danach ist der Branch aus meiner Sicht
  vollständig freigegeben. Parallel: S-1 an domain-dev (zwei Zeilen, Untergrenze im
  Grenzwächter), S-2 an domain-dev (vier Zeilen Zod an den drei Fragezeichenparametern). H-1 bis
  H-3 sind Entscheidungen, keine Aufträge.
```
