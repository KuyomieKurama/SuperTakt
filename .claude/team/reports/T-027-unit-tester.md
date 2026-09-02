Aufgabe: T-027 — Die Abdeckungslücke schließen und den SQLite-Adapter prüfen.

Status: fertig, mit zwei absichtlich roten Tests (Befunde am Adapter, siehe unten)

---

## Artefakte

Geändert (Wurzeldatei, ausnahmsweise erlaubt):

```
vitest.config.ts    reporter: ['text', ...] -> [['text', { skipFull: false }], ...]
```

Neu unter `packages/storage/test/` (14 Dateien, 264 Testfälle, dazu eine Testhilfe):

```
support/setup.ts          Testhilfe: migrierte SqlConnection + UnitOfWork + TransactionPort
unit-of-work.test.ts        6 Fälle   Reihung, Rollback bei Wurf, Wurf verschachtelt (1 rot, Befund)
repo-export.test.ts        17 Fälle   openCandidates/openGroups, recordRun, resetStatus, A-8.8-Abbruch
repo-time.test.ts          21 Fälle   manuelle Buchung, Timer-Start/-Stopp, Lebenszeichen, A-2.5
mappers.test.ts            24 Fälle   jede Übersetzungsfunktion einzeln, jeder Fehlerfall
repo-tags.test.ts          30 Fälle   vier Ebenen, Zyklusprüfung, Pools any/all/Unterordner
repo-todos.test.ts         23 Fälle   Notiz-Trennung, welche tagIds create schreibt, Suche/Filter
repo-statuses.test.ts      11 Fälle   Platz schaffen, Neuordnung, letzte Spalte, in Benutzung
repo-settings.test.ts      14 Fälle   Standardvorlage unveränderlich, Einstellungen, Standard-Tags
errors.test.ts             26 Fälle   jeder RAISE-Text, jeder eindeutige Index, Weiterwurf
ids-clock-paging.test.ts   26 Fälle   UUIDv7-Aufbau, Uhr, Fortsetzungsmarke
database.test.ts           14 Fälle   text/integer/…, chunk/placeholders, Zwischenspeicher
migration-runner.test.ts   17 Fälle   Prüfsumme, database_too_new (1 rot, Befund), Sicherungskopie
file-port.test.ts          16 Fälle   .. im Namen, nicht beschreibbarer Ordner, .tmp-Aufräumung
open.test.ts                6 Fälle   das Zusammenspiel: migrieren, schreiben, lesen, schließen
repo-error-paths.test.ts   13 Fälle   Namenskonflikte, restliche Zweige von update()
```

Nicht angefasst: `packages/*/src/**`, `apps/**`, `docs/**`. Kein `git commit`.

---

## Zuerst: E-048 — die Abdeckungslücke

### Befund

Bestätigt, wörtlich wie gemeldet: `packages/domain/src` fehlte in der gedruckten Tabelle
vollständig — nicht nur die Summenzeile, sondern jede einzelne Datei darunter, auch die mit
0 Prozent. Reproduziert mit `pnpm vitest run --coverage`, mit `pnpm vitest run
packages/domain/test --coverage` und sogar mit `--coverage.include='packages/domain/src/**/*.ts'`
**allein** (keine andere Datei im Spiel) — dort verschwand die gesamte Tabelle einschließlich der
Summenzeile, obwohl der Text darunter korrekt „100 % (138/138)" auswies.

### Ursache

**Nicht** die vom Orchestrator vermutete `node_modules`-Auflösung. Die Domäne wird von ihren
eigenen Tests ausschließlich relativ importiert (`../src/*.js`), niemals über `@takt/domain` —
ein Symlink-Auflösungsproblem hätte hier gar keinen Angriffspunkt.

Die tatsächliche Ursache liegt in Vitest 4.1.11 selbst (`node_modules/.pnpm/vitest@4.1.11.../dist/chunks/coverage.DM_a_rWm.js`,
Funktion `resolveConfig`):

```js
if (isAgent) {
  const text = resolved.coverage.reporter.find(([name]) => name === "text");
  if (text) {
    text[1] = { skipFull: true, ...text[1] };
    if (!textSummary) resolved.coverage.reporter.push(["text-summary", {}]);
  }
}
```

`isAgent` kommt aus `std-env` und ist wahr, weil die Umgebungsvariable `CLAUDECODE`/`CLAUDE_CODE`
gesetzt ist — **also in jeder Sitzung dieses Team**. Vitest erkennt automatisiertes Arbeiten und
erzwingt `skipFull: true` auf dem `text`-Reporter: „Do not show files with 100% statement, branch,
and function coverage" (istanbul-reports). `packages/domain/src` erreichte zum
Prüfzeitpunkt genau 100 % auf allen drei Achsen (die beiden Dateien ohne ausführbaren Code,
`settings.ts` und `todo.ts`, verschieben die Quote nicht) — und `skipFull` blendet dabei nicht nur
die einzelne Datei, sondern den **ganzen Verzeichnisknoten samt aller Kinder** aus, auch die
0-Prozent-Dateien darunter. `coverage-final.json` und die Schwellenprüfung selbst sahen die Domäne
die ganze Zeit korrekt — nur die gedruckte Tabelle nicht.

Nachgewiesen mit einem Vorher/Nachher-Experiment ohne jede andere Änderung:

```
# vorher (skipFull erzwungen durch isAgent)
 % Coverage report from v8
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   23.68 |    26.17 |   17.39 |   24.27 |
 export/src        |   98.72 |     93.2 |     100 |   98.63 |
 ...age/src/sqlite |       0 |        0 |       0 |       0 |
-------------------|---------|----------|---------|---------|
# domain/src fehlt vollständig. storage/src (migration.ts, ports.ts — 0 Anweisungen,
# damit "voll" im Sinn von skipFull) fehlt ebenfalls.

# nachher (reporter: [['text', { skipFull: false }], 'html', 'lcov'])
 % Coverage report from v8
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   23.68 |    26.17 |   17.39 |   24.27 |
 domain/src        |     100 |      100 |     100 |     100 |
  call-number.ts   |     100 |      100 |     100 |     100 |
  export.ts        |     100 |      100 |     100 |     100 |
  kernel.ts        |     100 |      100 |     100 |     100 |
  rounding.ts      |     100 |      100 |     100 |     100 |
  settings.ts      |       0 |        0 |       0 |       0 |
  tag.ts           |     100 |      100 |     100 |     100 |
  time-entry.ts    |     100 |      100 |     100 |     100 |
  todo.ts          |       0 |        0 |       0 |       0 |
 export/src        |   98.72 |     93.2 |     100 |   98.63 |
 storage/src       |       0 |        0 |       0 |       0 |
  migration.ts     |       0 |        0 |       0 |       0 |
  ports.ts         |       0 |        0 |       0 |       0 |
 ...age/src/sqlite |       0 |        0 |       0 |       0 |
-------------------|---------|----------|---------|---------|
```

Die Zahl in „All files" ändert sich zwischen beiden Läufen **nicht** (23,68 % in beiden) — der
Beweis, dass an der Messung selbst nie etwas fehlte, nur an der Anzeige.

### Fix

`vitest.config.ts`, `coverage.reporter`: `['text', 'html', 'lcov']` ->
`[['text', { skipFull: false }], 'html', 'lcov']`. Der Objekt-Spread in Vitests Zusammenführung
wertet zuletzt genannte Schlüssel aus (`{ skipFull: true, ...text[1] }`); ein bereits gesetztes
`skipFull: false` gewinnt deshalb gegen das erzwungene `true`. Ausführlich begründet im Kommentar
über der Zeile in `vitest.config.ts`.

### Gegenprobe (Mutationstest): greift die Schwelle wirklich?

Domain-Testdateien komplett entfernt (`packages/domain/test/*.test.ts` in ein Scratch-Verzeichnis
verschoben, Lauf durchgeführt, zurückgestellt):

```
domain/src        |   12.31 |     2.56 |     6.25 |   13.79 |
...
ERROR: Coverage for lines (13.79%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for functions (6.25%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for statements (12.31%) does not meet "packages/domain/src/**" threshold (80%)
ERROR: Coverage for branches (2.56%) does not meet "packages/domain/src/**" threshold (80%)
```

Die Zahl fällt sichtbar, und die Schwelle schlägt mit vier `ERROR`-Zeilen aus — genau das
Verhalten, das vorher unsichtbar, aber laut `coverage-final.json` tatsächlich schon vorhanden war.
Alle Domain-Tests danach vollständig wiederhergestellt (`git status` vor dem Bericht enthält keine
Löschung in `packages/domain/test/`).

### Zur Nachricht des Koordinators (T-028-Hinweis: `.js`- gegen `.ts`-Importendungen)

Geprüft und **nicht** die Ursache — `packages/domain/src` bleibt unangetastet:

1. Der Effekt reproduziert sich, wenn `packages/domain/src/**` das **einzige** Include-Muster ist
   (keine zweite Datei, kein zweites Paket im Spiel) — eine Verwechslung der Modulidentität
   zwischen zwei unterschiedlich referenzierten Fassungen derselben Datei setzt aber zwei
   Referenzstellen voraus. Bei einem isolierten Lauf gibt es nur eine.
2. `coverage-final.json`, produziert innerhalb desselben fehlschlagenden Laufs, enthielt die
   vollständigen, korrekten 100-Prozent-Einträge für jede Domain-Datei — dieselbe Datenquelle, die
   auch der `html`- und der `lcov`-Reporter benutzen und die beide korrekt anzeigten. Eine
   Identitätsverwechslung bei der Instrumentierung hätte die Datei aus dieser Quelle
   ausgeschlossen, nicht nur aus einer von drei Ansichten darauf.
3. Die Gegenprobe: `skipFull: false` gesetzt, an den Importendungen in `packages/domain/src`
   **nichts** geändert — die Domäne blieb während der gesamten Untersuchung unangetastet. Die
   Tabelle zeigt seither `domain/src` vollständig.
4. `export/src` erscheint nicht, *weil* es auf `.ts` umgestellt ist, sondern weil keine seiner
   Dateien zum Prüfzeitpunkt auf **allen drei** Achsen (Anweisungen, Zweige, Funktionen)
   gleichzeitig 100 % erreicht (`base64.ts` 100/94,33/100, `template.ts` 94,64/90,74/100 usw.) —
   `skipFull` hätte keine einzige seiner Dateien je ausgeblendet, unabhängig von der Importendung.

Die beobachtete Korrelation (Domäne `.js`, Export nach T-028 `.ts`) ist damit Zufall: Das
tatsächlich unterscheidende Merkmal ist „100 % auf allen drei Achsen", nicht die Dateiendung der
Importe. Weder `packages/domain/src/**` noch `apps/local-api/src/index.ts` wurden angefasst.

### Bewertung des dritten Vorfalls in dieser Reihe

Anders als bei den ersten beiden Fällen (0-von-0-Messung, sich selbst überspringender
Base64-Test) war die **Messung** hier durchgehend korrekt — auch die Schwellenprüfung selbst hat
nie etwas übersehen (siehe Gegenprobe). Der Schaden lag ausschließlich in der **Anzeige**, auf die
sich Menschen und Agenten beim Einschätzen von „ist das gemessen?" verlassen. Für die Praxis macht
das keinen Unterschied: Eine Fläche, die aussieht wie 0 von 0, wird nicht angefasst, egal ob die
Schwelle im Hintergrund tatsächlich greift.

---

## Danach: der SQLite-Adapter

Zuschnitt nach Schaden, wie im Auftrag und in T-021 offene Frage 3 vorgeschlagen: zuerst
`repo-export.ts`/`unit-of-work.ts` (A-8.8), dann `repo-time.ts`, `mappers.ts`, `repo-tags.ts`,
dann der Rest. Am Ende sind alle 16 Dateien unter `packages/storage/src/sqlite/**` sowie die
beiden reinen Typdateien `migration.ts`/`ports.ts` (0 ausführbare Anweisungen, tragen nichts zur
Quote bei) getestet.

### A-8.8 auf Speicherebene — die Kerngegenprobe

`repo-export.test.ts` bildet exakt den vom domain-dev in T-021 beschriebenen Haken nach, ohne
`apps/local-api` zu benötigen — die Zusage gilt bereits auf der Speicherebene:

> `recordRun` markiert erfolgreich (Buchung exportiert, `export_count` erhöht, Protokollzeile
> geschrieben) — dann wirft der Aufrufer **innerhalb derselben Transaktion**, vor dem
> Festschreiben. Danach: Buchung wieder `open`, `export_count` wieder 0, keine Protokollzeile,
> kein Exportlauf, wieder ein gültiger Exportkandidat.

Dazu die Kehrseite (Abbruch **vor** jedem Schreibvorgang) und die Fälle aus T-021 offene Frage 3:
`recordRun` weist eine im Auftrag bereits exportierte Buchung ab, statt sie zu überspringen
(`time_entry_locked`, `export_count` bleibt unverändert bei 1, nicht bei 2); `resetStatus` schreibt
Statuswechsel und Protokollzeile in derselben Anweisungsfolge.

`unit-of-work.test.ts` prüft die Reihung selbst: zwei gleichzeitig gestartete Transaktionen laufen
nachweislich nacheinander (Beobachtungsliste, keine Überlappung), eine dritte/vierte/fünfte reiht
sich in Aufruf- statt Fertigstellungsreihenfolge ein, ein Wurf gibt die Warteschlange für den
nächsten Aufrufer frei (sonst bliebe sie nach dem ersten Fehlschlag für immer abgelehnt).

### Rest, nach Zuschnitt

- `repo-time.ts` — Start hebt „Erledigt" auf und bringt das Todo zurück in den Pool (A-2.5); ein
  zweiter Start ohne Zustimmung wird abgewiesen; Stopp unter der Mindestdauer löscht die Zeile
  statt Dauer 0 zu schreiben; Lebenszeichen und verwaiste Buchung (E-036).
- `mappers.ts` — jede der 14 Übersetzungsfunktionen einzeln, mit von Hand gebauten `SqlRow`-Werten
  für jeden Fehlerfall (`toTimeEntry` wirft auf `ended_at: null`, jede feste Vereinigung fällt bei
  unbekanntem Wert auf ihren Standard zurück).
- `repo-tags.ts` — vier Ebenen tief angelegt, `ancestors`/`subtree` geprüft, ein Ordner in sich
  selbst verschieben wird abgelehnt (`tag_folder_cycle`), ebenso in einen eigenen Unterordner;
  `loadTree` mit 500 verschachtelten Ebenen ohne Stapelüberlauf (belegt den iterativen Aufbau);
  Pools: `any` gegen `all`, Ordner-Regel mit/ohne Unterordner, Vereinigung mehrerer Pools.
- `repo-todos.ts` — die Notiz-Trennung: ein neu angelegtes Todo mit Vermerk erscheint nirgends in
  `JSON.stringify(loaded)`; das **zweite** Argument von `create` wird geschrieben, nicht
  `input.tagIds` (Beleg: eine Liste übergeben, die sich von der wirksamen unterscheidet, und
  nachweisen, dass die wirksame gewinnt).
- `migration-runner.ts` — echte Sicherungskopien mit echten Dateien in einem temporären
  Verzeichnis (nicht nur `:memory:`), Namenskollision mit Zählersuffix, `checksum_mismatch`,
  Rückwärtsmigration bis Fassung 0 und auf eine Zwischenversion.
- `file-port.ts` — `..` im Dateinamen wird abgelehnt (Ziel bleibt außerhalb, nichts geschrieben),
  ein absoluter Dateiname ebenso, ein nicht beschreibbarer Ordner, SHA-256 gegen `node:crypto`
  nachgerechnet, `.tmp`-Aufräumung zählt korrekt.
- `errors.ts`, `database.ts`, `ids.ts`, `clock.ts`, `paging.ts`, `open.ts` — vollständig, siehe
  Tabelle unten.

---

## Befunde am Adapter (nicht behoben — außerhalb meiner Dateihoheit)

Zwei Tests bleiben **absichtlich rot**. Beide sind Zusicherungen aus den Kopfkommentaren des
Adapters selbst, die das heutige Verhalten nicht einlöst:

### 1. Verschachtelte Transaktionen blockieren dauerhaft, statt zu werfen (`unit-of-work.ts`)

Der Kopfkommentar sagt zu: „ein verschachtelter Aufruf ist deshalb ein Programmierfehler und
wirft." Das gilt für einen verschachtelten Aufruf von `run()` selbst — aber `TransactionPort`, die
einzige nach außen sichtbare Fläche, reicht jeden Aufruf zuerst durch die Warteschlange
`queue.then(...)`. Ruft eine Arbeitsfunktion von *innerhalb* einer laufenden Transaktion
`inTransaction` auf **derselben Instanz** erneut auf, entsteht ein Ring: Die äußere Transaktion
wartet auf die innere (weil sie deren Ergebnis zurückgibt), die innere wartet auf `queue` — und
`queue` wurde beim äußeren Aufruf bereits auf ein Versprechen umgebogen, das erst nach dem Ende
der äußeren Transaktion erfüllt wird. Die `depth`-Prüfung in `run()`, die genau diesen Fall
abfangen soll, wird dabei **nie erreicht**.

Auswirkung: In einem echten Dienst wäre das eine Anfrage, die nie antwortet, statt eines sauberen
Fehlers — für eine Zusicherung, die A-8.8 tragen soll, das ungünstigere der beiden Verhalten.
Test: `packages/storage/test/unit-of-work.test.ts`, mit 1 s Zeitgrenze statt der vollen 5 s.

### 2. `database_too_new` ist unerreichbar (`migration-runner.ts`)

`MigrationState` sagt für diesen Fall eine eigene, hilfreiche Meldung zu („Bitte die neuere
Fassung verwenden"). `currentState()` kann ihn aber nie liefern: Die Schleife davor prüft für jede
angewandte Zeile, ob `migrations.find(entry => entry.version === row.version)` etwas findet.
`known` ist per Definition das Maximum der Versionen in genau diesem `migrations`-Feld — jede
Zeile mit `row.version > known` (die einzige Art, wie `current > known` zustande kommen könnte)
findet also zwangsläufig `migration === undefined` und liefert bereits dort `checksum_mismatch`
zurück, bevor die Prüfung auf `current > known` je erreicht wird. Der Codepfad für
`database_too_new` ist toter Code.

Auswirkung: Ein Anwender, der eine neuere Installation von Takt auf einer älteren Fassung öffnet,
bekommt „Die bereits gelaufene Migration N unterscheidet sich von der mitgelieferten Datei" — eine
Meldung, die auf eine manipulierte Datei hindeutet — statt der zutreffenden, harmlosen Erklärung.
Test: `packages/storage/test/migration-runner.test.ts`.

Beide Tests sind so geschrieben, dass sie **automatisch grün** werden, sobald jemand den
jeweiligen Fund behebt — keine Nacharbeit am Test nötig.

(Randnotiz, kein eigener Befund: `unit-of-work.ts` Zeile 155, der `onRejected`-Zweig des ersten
`queue.then(...)`, ist ebenfalls unerreichbar — aber nur, weil `queue` durch die anschließende
Zuweisung `next.then(() => undefined, () => undefined)` nie in einen abgelehnten Zustand gerät.
Das ist beabsichtigte Verteidigung gegen eine Invariante, die ohnehin nie bricht, kein Fehler.)

---

## Abdeckungstabelle: vorher und nachher

**Vorher** (`pnpm vitest run --coverage`, vor T-027, mit dem seit T-021 unveränderten
`vitest.config.ts`):

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   23.68 |    26.17 |   17.39 |   24.27
 export/src        |   98.72 |     93.2 |     100 |   98.63
 ...age/src/sqlite  |       0 |        0 |       0 |       0
-------------------|---------|----------|---------|--------
Statements: 23.68% (370/1562)   Branches: 26.17% (229/875)
domain/src: FEHLT VOLLSTÄNDIG (aber intern 100 %, siehe E-048-Abschnitt)
storage/src/**: 4 ERROR-Zeilen (0 % gegen 80-Prozent-Schwelle)
```

**Nachher** (`pnpm vitest run --coverage`, nach T-027):

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   93.08 |    85.37 |   96.27 |   95.91
 domain/src        |     100 |      100 |     100 |     100
 export/src        |   98.72 |     93.2 |     100 |   98.63
 storage/src        |       0 |        0 |       0 |       0   (migration.ts/ports.ts: 0 Anweisungen)
 ...age/src/sqlite  |   91.16 |    81.57 |   95.48 |   94.88
-------------------|---------|----------|---------|--------
Statements: 93.08% (1454/1562)   Branches: 85.37% (747/875)
Functions: 96.27% (310/322)      Lines: 95.91% (1316/1372)

Keine einzige ERROR-Zeile zur Schwelle — alle drei Pakete
(domain/src, storage/src, export/src) erreichen 80 % auf allen
vier Achsen.
```

`pnpm test` / `pnpm test:coverage`: **527 von 529 Tests grün**, 2 rot — beide dokumentierte,
absichtliche Befunde am Adapter (siehe oben), keine Lücke in der Prüfung. `pnpm typecheck`,
`pnpm boundaries`: grün (auch für die neuen Testdateien selbst gegen eine ad-hoc-`tsconfig`
geprüft, da `packages/storage/tsconfig.json` `test/` nicht einschließt — wie bei den anderen
Paketen auch).

---

## Nicht angetastete Pflichtfälle, zur Kenntnis

Rundung (0/1/7/8/15/22/23/30/45/60/61/90 Minuten, 7 h 38 min), Base64 (Umlaute, scharfes S,
französische Akzente, Emoji, Zeilenumbruch, leere Notiz) und die Notiz-Trennung als
Eigenschaftstest über generierte Vorlagen lagen bereits vollständig und grün aus T-010/T-010b vor
(`packages/domain/test/rounding.test.ts`, `packages/export/test/base64.test.ts`,
`packages/export/test/note-boundary-property.test.ts`). Geprüft, dass sie noch feuern — nichts
daran geändert.

---

## Offene Fragen an den Orchestrator

1. **Die beiden Befunde am Adapter** (siehe oben) — Entscheidung nötig, ob/wann `unit-of-work.ts`
   und `migration-runner.ts` angefasst werden. Bis dahin ist `pnpm test` mit 2 von 529 Tests rot,
   aus gutem Grund.
2. **`vitest.config.ts`** trägt jetzt einen expliziten `skipFull: false` mit ausführlicher
   Begründung im Kommentar. Jeder künftige Paketzuwachs, der zufällig 100 % auf allen drei Achsen
   erreicht, profitiert automatisch davon — ohne die Zeile bliebe die Falle für das nächste Paket
   bestehen, das diese Schwelle erreicht.
