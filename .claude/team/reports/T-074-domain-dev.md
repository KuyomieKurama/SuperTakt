Aufgabe: T-074 — Ein doppelter Poolname ergibt einen Serverfehler.

Status: fertig

**Zustand des Baums in einem Satz:** `pnpm check` endet mit **Exitcode 0**, und alle dreizehn
Nachweispfade sind grün — die zwölf bestehenden und der neue `proof:conflicts` (142 Prüfungen).
Die Ursache des gemeldeten 500 ist gefunden, behoben und gemessen; es waren **sechs** Stellen
derselben Bauart, dazu ein zweiter, tiefer liegender Befund, der sieben Fehlermeldungen
unerreichbar gemacht hat, und die beiden Nachträge des Orchestrators (fünf Meldungen sagten
„Spalte", wo „Status" gemeint ist; der Standard-Status war nur in der Oberfläche geschützt) sind
mit erledigt — Abschnitt 9.

---

Artefakte:

Neu:

```
apps/local-api/scripts/proof-conflicts.mjs   NEU — der Nachweis, 142 Prüfungen in fünf
                                     Abschnitten: jeder eindeutige Index des Schemas
                                     ausgelöst und übersetzt; jede Verletzung über die
                                     echten Routen; nichts bleibt halb angelegt; die
                                     Namensregel; und die Zusicherungen, die bis T-073 nur
                                     in der Oberfläche standen
```

Geändert:

```
packages/domain/src/tag-name.ts        die Regel ist nicht mehr tagspezifisch benannt:
                                       `normalizeName`, `nameKey`, `checkName(raw, subject)`,
                                       `MAX_NAME_LENGTH`, `NameCandidate`, `NAME_SUBJECT`.
                                       `normalizeTagName`/`tagNameKey`/`checkTagName` bleiben
                                       als **dieselben** Werte unter ihrem alten Namen.
                                       Neu: `checkPoolName` (215 → 301)
packages/domain/src/kernel.ts          neuer Fehlerschlüssel `default_status_locked`
packages/storage/src/ports.ts          `PoolNameEntry`, `PoolPort.listNames()`;
                                       `TodoStatusPort.remove`/`update` mit dem neuen Schlüssel
packages/storage/src/sqlite/repo-statuses.ts  fünf Meldungen sagen „Status" statt „Spalte";
                                       der Standard-Status ist gegen Löschen **und** gegen
                                       Abwählen geschützt; `defaultStatus()` erklärt seinen
                                       Rückfall als das, was er ist
apps/local-api/src/http/problem.ts     `default_status_locked` → 409
packages/storage/src/sqlite/repo-tags.ts  `listNames`; `create` und `update` schreiben den
                                       Namen **normalisiert**, wie `TagPort` es seit T-058 tut
packages/storage/src/sqlite/errors.ts  je Eintrag Indexname **und** Spaltenliste statt eines
                                       Suchbegriffs; `mentions` statt blankem `includes`;
                                       zwei fehlende Einträge ergänzt (`ux_tag_name_key`,
                                       `ux_pool_rule`); drei Sätze berichtigt;
                                       `asStorageFailure`, `UNIQUE_INDEX_CATALOG` (229 → 395)
packages/storage/src/index.ts          `asStorageFailure`, `UNIQUE_INDEX_CATALOG` exportiert
apps/local-api/src/usecases/structure.ts  `createPool` liefert `UseCaseResult<Pool>` und prüft
                                       den Namen; `updatePool` ebenso, mit „die eigene Regel
                                       steht sich nicht im Weg" und „404 vor 409"
apps/local-api/src/routes/structure.ts `POST /pools` hat einen Fehlerzweig
apps/local-api/src/app.ts              `asStorageFailure` in `onError` — das Netz
apps/local-api/openapi/takt-local-api.yaml  `createPool` beschreibt die Namensregel;
                                       `updatePool` bekommt `409` (der Dienst lieferte ihn
                                       schon, die Beschreibung führte ihn nicht);
                                       `deleteTodoStatus` nennt jetzt drei Gründe statt zwei
                                       und heißt „Status löschen" statt „Statusspalte löschen"
apps/local-api/scripts/service-scenario.mjs  löst beide 409 aus — bis hierher hat der
                                       Durchlauf den Fehlerfall nie angefasst
apps/local-api/scripts/caller-scan.mjs `Partial`/`Required`/`Readonly` und Aliasse auf etwas
                                       anderes als ein Typliteral werden aufgelöst
apps/local-api/scripts/proof-callers.mjs  vier `NEVER_SENT`-Zusätze entfernt, weil eingelöst
apps/local-api/package.json            `proof:conflicts`
docs/datenmodell.md                    3.3 (die Regel gilt auch für Regelnamen), 3.5 neuer
                                       Abschnitt `pool.name`, 3.1 „Was die Standardspalte
                                       bedeutet" und „Was beim Löschen … geschieht" neu
                                       geschrieben, 8.5 drei Nachweiszeilen
docs/architektur.md                    5.4 drei neue Unterabschnitte: wie SQLite seine Indizes
                                       benennt, das Netz am Rand, und „eine Regel, die nur in
                                       der Oberfläche steht, ist keine Regel"
```

Nicht angefasst: `apps/web/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `packages/*/test/**`,
`packages/export/**`, `apps/desktop/**`, die Add-in-Abschnitte der OpenAPI-Beschreibung, die
Wurzel-`package.json` (siehe „Offene Fragen" 1).

---

Zusammenfassung:

`POST /pools` mit vergebenem Namen antwortet jetzt **409 `name_conflict`**, und die Meldung nennt
den Namen. Die Ursache war die, die der Auftrag vermutet hat — der eindeutige Index schlug durch
und niemand fing ihn —, aber sie war nicht die einzige und nicht die tiefste. Sechs Stellen
derselben Bauart und ein zweiter Befund, der die Fehlermeldungen betraf, die es schon gab.

**Der zweite Befund ist der interessantere.** In `packages/storage/src/sqlite/errors.ts` stand
seit T-021 eine Tabelle „Indexname → Fehlerschlüssel". Sie war zu **sieben Zwölfteln tot**, und
zwar seit dem Tag, an dem sie geschrieben wurde: SQLite nennt den Indexnamen in seiner Meldung
nur bei einem Index über einen **Ausdruck** oder mit **WHERE-Bedingung**. Ein Index über nackte
Spalten nennt die Spalten. Gemessen mit `node:sqlite`:

```
  CREATE UNIQUE INDEX ux_a ON t (pos);                   → "…failed: t.pos"
  CREATE UNIQUE INDEX ux_b ON t (name COLLATE NOCASE);   → "…failed: t.name"
  CREATE UNIQUE INDEX ux_c ON t (a, b, c);               → "…failed: t.a, t.b, t.c"
  CREATE UNIQUE INDEX ux_d ON t (COALESCE(x,'~'), name); → "…failed: index 'ux_d'"
  CREATE UNIQUE INDEX ux_e ON t ((1)) WHERE flag = 1;    → "…failed: index 'ux_e'"
```

`COLLATE NOCASE` ist keine Rechnung, sondern eine Vergleichsvorschrift, und ändert daran nichts.
Also fielen `ux_pool_name`, `ux_todo_status_name`, `ux_export_template_name` und vier weitere
still auf „Dieser Wert ist bereits vergeben" zurück, während daneben genauere Sätze standen, die
nie jemand zu lesen bekam. Nachweisbar am Bestand: `PATCH /pools/{id}` auf einen vergebenen Namen
antwortete **richtig** mit 409, aber mit dem allgemeinen Satz — nicht mit „Einen Pool mit diesem
Namen gibt es bereits", der genau dafür dastand.

---

## 1 — Die Ursache, und die sechs Stellen

Der Weg des Fehlers, gemessen gegen den laufenden Dienst:

```
POST /pools {"name":"Kunden Nord"}   (zum zweiten Mal)
  routes/structure.ts   const pool = await createPool(...)     kein Fehlerzweig
  usecases/structure.ts return unit.pools.create(...)          Promise<Pool>, kein Result
  repo-tags.ts          INSERT INTO pool …                     kein attempt()
  SQLite                UNIQUE constraint failed: pool.name    Wurf
  unit-of-work.ts       ROLLBACK, Wurf weiter                  richtig
  app.ts onError        500 internal_error                     falsch
```

`PoolPort.create` war einer von **zwei** Schreibwegen im ganzen Adapter, die ihren Fehlschlag
nicht als Wert melden (der andere ist `TodoPort.create`). Ein `grep` über die eindeutigen Indizes
und ihre Aufrufer, wie der Auftrag ihn vorschlägt, führt genau auf diese beiden — plus zwei
Verletzungen, die gar keinen eindeutigen Index betreffen:

| Stelle | Vorher | Jetzt |
|---|---|---|
| `POST /pools`, Name vergeben | **500** | 409 `name_conflict`, Meldung nennt den Namen |
| `POST /pools`, Position vergeben | **500** | 409 `conflict` |
| `POST /pools`, Regelteil doppelt (`ux_pool_rule`) | **500** | 422 `validation_error` |
| `POST /pools`, Regelteil auf unbekanntes Tag (FK) | **500** | 422 `validation_error` |
| `POST /todos`, unbekanntes `tagIds` (FK) | **500** | 422 `validation_error` |
| `POST /todos`, unbekanntes `statusId` (FK) | **500** | 422 `validation_error` |
| `PATCH /pools/{id}`, Name vergeben | 409, allgemeiner Satz | 409, Meldung nennt den Namen |
| `POST /todo-statuses`, Name vergeben | 409, allgemeiner Satz | 409 „Einen Status mit diesem Namen gibt es bereits." |
| `POST /tags`, Name vergeben | 409, eigener Satz | unverändert |
| `PUT /default-tags`, unbekanntes Tag | 404 (Vorprüfung) | unverändert |

Die letzten beiden Zeilen sind da, weil sie **nicht** kaputt waren: `TagPort.create` und der
Anwendungsfall der Standard-Tags prüfen vorher. Sie sind die Vorlage, nach der die anderen jetzt
gebaut sind.

## 2 — Drei Ebenen, und keine ersetzt die andere

```
   1. Anwendungsfall prüft vorher    → genaue Meldung, nennt den Namen, kennt die Domänenregel
   2. attempt / attemptAtomically    → Fehlschlag als Wert, Sicherungspunkt zurück
   3. app.onError + asStorageFailure → das Netz: richtiger Code, allgemeiner Satz
```

**Ebene 1** ist neu für Pools: `createPool` und `updatePool` fragen `checkPoolName` und
vergleichen die Schlüssel aller vorhandenen Regeln.

**Ebene 3** ist neu und allgemein: `app.onError` fragt zuerst `asStorageFailure(error)`. Eine
SQLite-Störung, die kein Adapter als Wert gemeldet hat, wird damit wie jeder fachliche Fehler
beantwortet; alles andere bleibt ein 500 ohne Innenleben.

Das Netz ist ausdrücklich **kein Ersatz** für Ebene 1. Es sagt „ein doppelter Wert", wo der
Anwendungsfall sagen könnte, welcher. Es ist da, weil eine Liste von Stellen, an die man denken
muss, genau die Bauart ist, die diesen Befund erzeugt hat: `attempt` je Schreibvorgang wird
irgendwann vergessen — dieselbe Begründung, die schon am Kopf von `errors.ts` steht, eine Ebene
höher gezogen.

`PoolPort.create` habe ich dabei **nicht** auf `Result` umgestellt, obwohl das die sauberere
Signatur wäre: `packages/storage/test/repo-tags.test.ts` ruft sie an neun Stellen auf und
benutzt das Ergebnis unmittelbar (`pool.id`, `pool.position`). Die Datei gehört nicht mir. Die
Umstellung steht unter „Offene Fragen" 2 — sie ist ohne die Tests nicht zu haben, und sie ist
nach Ebene 1 und 3 auch nicht mehr dringend.

## 3 — Die Antwort auf „was heißt derselbe Name bei Pools?"

**Dieselbe Regel wie bei Tags. Wörtlich dieselbe Funktion, nicht eine zweite Fassung.**

```
  „Backend"    = „backend"   = „ Backend "  = „bAcKeNd"      eine Regel
  „Änderung"   = „änderung"                                  eine Regel
  „back  end"  = „back end"                                  eine Regel
  „Künden"(NFD)= „Künden"(NFC)                               eine Regel
  „Straße"    ≠ „Strasse"                                    zwei Regeln
  „ΑΛΦΑ"      ≠ „αλφα"                                       zwei Regeln
```

Das war eine Entscheidung und keine Selbstverständlichkeit: Vorher galt für Pools
`ux_pool_name` mit `COLLATE NOCASE`, also A–Z und sonst nichts. Gemessen vor der Änderung: zwei
Regeln namens „Künden" nebeneinander, eine in NFD, eine in NFC, auf dem Bildschirm nicht
unterscheidbar. Seit E-054 ist das keine Kuriosität mehr, sondern zwei gleich benannte Spalten
auf demselben Board.

**Die Funktion ist geteilt, nicht kopiert.** `packages/domain/src/tag-name.ts` hieß so, weil die
Frage dort zuerst gestellt wurde; tagspezifisch ist an ihr nichts. Sie trägt jetzt die neutralen
Namen `normalizeName`, `nameKey`, `checkName(raw, subject)` — und `normalizeTagName`,
`tagNameKey`, `checkTagName` sind **dieselben Werte** unter ihrem alten Namen
(`normalizeTagName === normalizeName` ist wahr). Die Aliasse bleiben, weil
`apps/web/src/components/TagInput.tsx` und `apps/outlook-addin/src/tags/new-name.ts` sie so
aufrufen und beide nicht in meiner Hoheit liegen. Die Datei behält aus demselben Grund ihren
Namen: Kommentare im Add-in verweisen auf `packages/domain/src/tag-name.ts` als den Ort, an dem
die Regel steht, und das bleibt wahr.

`subject` ist der einzige Unterschied zwischen der Prüfung eines Tagnamens und der eines
Regelnamens — eine Nominalphrase aus einer Aufzählung in der Domäne, nicht ein Text vom Aufrufer.
Die Meldungen für Tags kommen dadurch **zeichengleich** heraus wie vorher.

**Was gespeichert wird, ist die Anzeigeform.** `„  Vertrieb   Süd  "` wird zu `„Vertrieb Süd"`,
wie bei Tags. Gemessen; es steht in `proof:conflicts` 4.

### Warum es **keine** Spalte `pool.name_key` gibt

Die naheliegende Fortsetzung von T-058 wäre eine Migration 0011 nach dem Vorbild von 0008. Ich
habe sie **nicht** gemacht, und das ist die zweite Entscheidung dieser Aufgabe:

- Die Spalte ist nur zu haben, indem die aufgezählte Faltung ein **zweites Mal in SQL** steht.
  0008 baut sie über rund 40 Zeilen einer rekursiven Abfrage nach, weil SQLite keine
  Unicode-Faltung kennt. Eine zweite SQL-Fassung müsste mit der ersten mitwandern, und die
  Stelle, an der beide auseinanderlaufen, wäre genau die, an der wieder zwei gleiche Namen
  entstünden. Das ist derselbe Handel, den `proof:tags` Abschnitt 1 für **eine** Fassung schon
  bewachen muss.
- Der Grund, aus dem 0008 die Spalte braucht, gilt hier nicht. Tags sind Tausende, entstehen
  nebenbei beim Anlegen eines Todos und brauchen `ix_tag_name_key` für die Frage „gibt es das
  schon?". Regeln sind ein paar Dutzend, ein Mensch legt sie einzeln an, und ein vollständiger
  Durchlauf kostet nichts — dieselbe Begründung, die Migration 0009 für „kein Index auf
  `placement`" gibt.
- Der Wettlauf, gegen den 0008 argumentiert, ist hier durch die Reihung der Transaktionen
  abgedeckt: Prüfung und Schreiben stehen in derselben Klammer, und `TransactionPort` lässt nie
  zwei Klammern ineinanderlaufen.

**Der Preis steht ausdrücklich da.** Wer am Anwendungsfall vorbei in die Datenbank schreibt, kann
„Änderung" und „änderung" nebeneinander anlegen; `COLLATE NOCASE` hält ihn nicht auf. Für Takt —
ein Prozess, ein fester Port, ein Schreibweg — ist das kein erreichbarer Zustand. Wenn diese
Annahme je fällt, ist Migration 0011 der Weg, und dieser Absatz ist ihre Begründung.

## 4 — Was `proof:conflicts` misst

`pnpm --filter @takt/local-api proof:conflicts`, vier Abschnitte.

**1 — Jeder eindeutige Index des Schemas hat einen eigenen Satz** (61 Prüfungen, grün). Die Liste
kommt aus `sqlite_master` einer **migrierten** Datenbank, nicht aus einer Aufzählung im Skript.
Für jeden der **14** Indizes wird die Verletzung ausgelöst und mit derselben Funktion übersetzt,
die der Dienst benutzt. Geprüft wird je Index viererlei: die Verletzung tritt überhaupt ein, sie
ergibt den erwarteten Schlüssel, sie ergibt **nicht** die allgemeine Auskunft, und die Meldung
enthält weder Index- noch Tabellennamen (B-2.4).

Dazu die Zange in beide Richtungen: ein Index ohne Eintrag wird rot, ein Eintrag ohne Index
ebenso. Und eine Falle, die ich beim Bauen gefunden habe — `ux_tag_name` ist eine
Teilzeichenkette von `ux_tag_name_key`. Ein Zuordner mit blankem `includes` ordnet die Meldung
des einen dem Eintrag des anderen zu. Heute folgenlos, weil beide denselben Satz tragen; morgen
nicht mehr. Deshalb `mentions` statt `includes`, und deshalb misst der Prüflauf **auch**, dass es
überhaupt einen solchen verschachtelten Namen gibt — ohne ihn sagte die Prüfung darüber nichts.

**2 — Der Dienst antwortet auf jede Verletzung mit 4xx.** Zwölf Fälle über die echten Routen,
je drei Zusicherungen: nicht 500, der erwartete Schlüssel, und der Schlüssel ist einer, gegen den
eine Oberfläche verzweigen kann.

**3 — Eine abgewiesene Anlage hinterlässt nichts.** Vier Abweisungen hintereinander, Zählung
vorher und nachher, und zusätzlich: keine Regel ohne ihre Regelterme. Das ist der Zustand aus
T-047 — „umbenannt und ganz ohne Regel" —, hier für den Anlegeweg.

**4 — Die Namensregel.** Dieselben Paare, die `proof:tags` für Tags misst, über `POST /pools`.
Darunter der Fall, den E-054 häufig gemacht hat: eine Board-Spalte mit dem Namen eines Pools.

## 5 — Der Nebenbefund am Prüfer der Aufrufer

`proof:callers` war beim Beginn dieser Aufgabe **rot**, mit drei Beanstandungen aus einer
Ursache: T-072 hat `PoolPatch = Partial<PoolWrite>` eingeführt, und der Leser in
`caller-scan.mjs` löste weder `Partial<T>` noch einen Alias auf, der nicht auf ein Typliteral
zeigt. Der Rumpf von `updatePool` war damit „unaufgelöst", vier Felder galten als „nie gesendet",
und der Selbsttest in Abschnitt 6 schlug an.

Behoben, weil die Datei mir gehört und `pnpm check` sonst nicht grün wird: Der Leser löst jetzt
Aliasse über denselben Weg auf wie jede andere Typangabe, und er kennt `Partial`, `Required` und
`Readonly` — die drei eingebauten Hilfstypen, die die **Feldnamen unverändert** lassen. `Omit`,
`Pick` und `Record` bleiben ausdrücklich draußen: Sie ändern die Menge, und ein Leser, der sie
raten würde, gäbe eine falsche Antwort statt „unaufgelöst". Er kennt dadurch 66 statt 48 Typen.

Bei der Gelegenheit sind vier `NEVER_SENT`-Zusätze gefallen — `createPool`/`updatePool` mit
`position` und `placement`. Beides waren benannte Übergaben an den frontend-dev, und beide hat
T-072 eingelöst. Ein Zusatz, der nicht mehr gilt, macht die Liste zum Rauschen.

## 6 — Was ich gemessen habe

Vor der Änderung, gegen den echten Sidecar mit eigenem Datenverzeichnis:

```
POST /pools  gleicher Name                    500  internal_error
POST /pools  andere Schreibweise              500  internal_error
POST /pools  Leerraum drumherum               500  internal_error
POST /pools  Position doppelt                 500  internal_error
POST /pools  Regel mit unbekanntem Tag        500  internal_error
POST /pools  Regel mit doppeltem Term         500  internal_error
POST /todos  unbekannter Tag                  500  internal_error
POST /todos  unbekannter Status               500  internal_error
PATCH /pools auf vergebenen Namen             409  name_conflict — „Dieser Wert ist bereits
                                                   vergeben." (der allgemeine Satz)
POST /pools  „Künden" NFD, dann NFC           201/201 — zwei Regeln, auf dem Bildschirm gleich
```

Danach, dieselben Aufrufe:

```
POST /pools  gleicher Name                    409  name_conflict — „Es gibt bereits eine Regel
                                                   mit dem Namen „Kunden Nord". …"
POST /pools  andere Schreibweise              409  name_conflict
POST /pools  Leerraum drumherum               409  name_conflict
POST /pools  Position doppelt                 409  conflict
POST /pools  Regel mit unbekanntem Tag        422  validation_error
POST /pools  Regel mit doppeltem Term         422  validation_error — „Derselbe Regelteil steht
                                                   zweimal in dieser Regel."
POST /todos  unbekannter Tag                  422  validation_error
POST /todos  unbekannter Status               422  validation_error
PATCH /pools auf vergebenen Namen             409  name_conflict, Meldung nennt den Namen
POST /pools  „Künden" NFD, dann NFC           201/409 — eine Regel
Bestand danach                                nur die angelegten, keine halbe Zeile
```

Dazu die Läufe:

```
pnpm typecheck            alle acht Projekte                        ✓
pnpm boundaries           Notiz-Trennung unverletzt, 287 Dateien    ✓
pnpm contrast             416 Paare, 0 durchgefallen                ✓
pnpm proof:openapi        53 Prüfungen, 99 Aufrufe, kein 5xx        ✓
pnpm proof:callers        18 Prüfungen (vorher 15 + 3 rot)          ✓
pnpm test:coverage        567 Prüffälle, 35 Dateien                 ✓
pnpm build                alle Projekte                             ✓
pnpm check                Exitcode 0                                ✓

pnpm --filter @takt/local-api proof:conflicts   142 Prüfungen        ✓
pnpm proof:tags                                  42                  ✓
pnpm --filter @takt/local-api proof:access       75                  ✓
                                     proof:export       97           ✓
                                     proof:export-api   69           ✓
                                     proof:taskpane     25           ✓
                                     proof:addin-wiring 32           ✓
                                     proof:route-policy 40           ✓
                                     proof:template-fields 30        ✓
                                     proof:db-permissions 17         ✓
pnpm --filter @takt/outlook-addin proof:addin   100                  ✓
```

Dreizehn Nachweispfade, 0 Fehlschläge.

## 7 — Was der Durchlauf jetzt zusätzlich anfährt

`service-scenario.mjs` löst seit T-074 **beide** 409 aus. Das ist keine Kosmetik: Die
Beschreibung versprach für `createPool` seit jeher einen 409, der Dienst antwortete mit 500, und
`proof:openapi` hat es nicht gemerkt — weil der Durchlauf den Fall nie ausgelöst hat. Der
Vorbehalt steht wörtlich im Kopf des Prüfskripts („ein Fehlerfall, den niemand herbeiführt,
bleibt unbeschrieben messbar falsch"). Jetzt ist er herbeigeführt.

Umgekehrt fehlte bei `updatePool` der `409` in der Beschreibung, obwohl der Dienst ihn seit
jeher liefert. Beides ist gerade.

## 8 — Der feste Port, und warum das eine halbe Stunde gekostet hat

`proof:tags` und `proof:conflicts` starten den echten Sidecar, und der bindet den **festen** Port
17843 (B-1.5: Takt weicht nicht aus). Während dieser Aufgabe lief in derselben Sitzung ein
zweiter Agent mit einem Dauerprozess auf diesem Port (`…/scratchpad/apiloop.mjs`, Elternprozess
eines `node apps/local-api/src/index.ts`, dazu ein Vite-Server auf 5173). Ich habe ihn zweimal
versehentlich beendet, bevor ich die Ursache gesehen hatte — er startet sich selbst neu —, und
danach gewartet statt eingegriffen.

Beide Läufe sind inzwischen **gefahren und grün** (`proof:tags` 42, `proof:conflicts` 142), und
`pnpm check` endet mit Exitcode 0. Der Vorfall bleibt trotzdem im Bericht, weil er eine
Eigenschaft des Prüfaufbaus ist und nicht ein Zufall: Zwei Prüfläufe können nie gleichzeitig
laufen, und wer parallel arbeitet, blockiert den anderen ohne Meldung. Siehe „Offene Fragen" 6.

## 9 — Die beiden Nachträge aus T-073

Beide lagen in meiner Hoheit und beide sind mitgezogen.

### 9.1 Fünf Meldungen sagten „Spalte", wo „Status" gemeint ist

Seit E-054 ist `todo_status` der **Status** eines Todos und keine Kanban-Spalte; eine Spalte ist
eine Regel über Tags und liegt in `pool`. Die Meldungen der Statusrouten hatten das nicht
mitbekommen — und die erste davon erscheint im Einstellungsbereich *Status*, zwei Absätze unter
der Erklärung, dass beides zweierlei ist.

| vorher | jetzt |
|---|---|
| „In dieser Spalte stehen noch Todos. Verschieben Sie sie zuerst." | „Diesen Status tragen noch Todos. Geben Sie ihnen zuerst einen anderen." |
| „Die letzte Spalte kann nicht gelöscht werden." | „Der letzte Status kann nicht gelöscht werden." |
| „Diese Spalte gibt es nicht." (zweimal) | „Diesen Status gibt es nicht." |
| „Die Reihenfolge muss alle Spalten genau einmal nennen. …" | „… alle Status genau einmal nennen. …" |

Dazu drei Sätze in `errors.ts`, die aus demselben Grund falsch waren und die nie jemand zu sehen
bekam (Abschnitt „Der zweite Befund"): „Eine Spalte mit diesem Namen gibt es bereits" →
„Einen Status mit diesem Namen gibt es bereits", „Diese Reihenfolge der Spalten …" →
„… der Status …", „Es kann nur eine Standardspalte geben" → „Es kann nur einen Standardstatus
geben". Und der Kopf von `repo-statuses.ts`, der die Datei bis dahin „Kanban-Spalten" nannte.

**Der Fehlerschlüssel `last_status_column` bleibt, wie er ist.** Er trägt das Wort „column" aus
der Zeit vor E-054, aber ein Schlüssel ist eine Zusage an seine Aufrufer: `tests/e2e/support/api.ts`
und die Schnittstellenbeschreibung nennen ihn beim Namen, und `tests/e2e` gehört nicht mir. Der
Widerspruch steht jetzt in der Beschreibung ausgeschrieben, statt zu wirken, als hätte ihn
niemand bemerkt. Wer ihn auflösen will, braucht eine eigene Aufgabe über drei Dateien.

### 9.2 Der Standard-Status war nur in der Oberfläche geschützt

Der Befund stimmt, und er hat **zwei** Ausprägungen, nicht eine. `ux_todo_status_default` ist ein
partieller eindeutiger Index und sichert „höchstens **ein** Standard" — nicht „mindestens einer".
Es gab damit genau zwei Wege, null zu erzeugen:

```
DELETE /todo-statuses/{id}                     auf den Standard  → gelöscht
PATCH  /todo-statuses/{id} {isDefault:false}   auf den Standard  → Marke weg
```

Danach fiel `defaultStatus()` **still** auf den ersten Status nach Position zurück. Ein neu
angelegtes Todo bekam einen anderen Status, und niemand erfuhr es — weder aus einer Antwort noch
aus dem Protokoll.

Der zweite Weg stand nicht im Auftrag; er ist beim Nachsehen aufgefallen, weil die Oberfläche ihn
ausdrücklich beschreibt: „abwählen lässt sich der Standard nicht, nur weitergeben"
(`StatusSettings.tsx`). Genau so ein Satz ist der Hinweis darauf, dass eine Zusage nur an einer
Stelle steht.

Beides antwortet jetzt mit **409 `default_status_locked`** — ein neuer Fehlerschlüssel in der
Domäne, damit die Oberfläche gegen ihn verzweigen kann, so wie gegen `status_in_use`.

**Abgewiesen, nicht umgehängt.** Der Dienst könnte beim Löschen den Standard selbst
weiterreichen. Er tut es nicht: Welcher Status danach der Standard sein soll, ist eine
Entscheidung des Benutzers und kein Rest, den eine Löschroutine nebenbei trifft — dieselbe
Begründung, aus der eine gelöschte Statusspalte ihre Todos nicht automatisch umhängt
(datenmodell.md 3.1). Der Weg steht in der Meldung: erst weitergeben, dann löschen.

`proof:conflicts` Abschnitt 5 misst beide Abweisungen, den unveränderten Bestand danach — **und
die Gegenprobe**: Weitergeben geht weiterhin, der frühere Standard lässt sich danach löschen, und
`isDefault: false` auf einem Status ohne Standardmarke bleibt zulässig. Eine Sperre ohne Ausweg
wäre eine Sackgasse, und eine Sperre, die mehr abweist als sie schützt, wäre ein zweiter Fehler.

### 9.3 Wo ich sonst nach derselben Lücke gesucht habe

Durchgesehen: jedes `disabled=` in `apps/web/src/screens` und `apps/web/src/components`, das
nicht bloß „gerade beschäftigt" heißt, und jede Zusage, die die Oberfläche in Worten macht.

| Zusage der Oberfläche | trägt der Dienst? |
|---|---|
| Standard-Status nicht löschbar | **nein** → behoben (9.2) |
| Standard nur weitergeben, nicht abwählen | **nein** → behoben (9.2) |
| letzter Status nicht löschbar | ja, `last_status_column` |
| Status mit Todos nicht löschbar | ja, `status_in_use` **und** `ON DELETE RESTRICT` |
| mitgelieferte Vorlage weder änder- noch löschbar | ja, zwei Trigger im Schema |
| exportierte Buchung gesperrt | ja, Trigger `trg_time_entry_locked` |
| nur ein Timer gleichzeitig | ja, `ux_time_entry_running` |
| Regelname eindeutig | seit dieser Aufgabe ja (Abschnitt 3) |
| Tagname eindeutig je Ordner | ja, seit T-058 |

Zwei Lücken, beide geschlossen. Das ist keine Zusage, dass es keine dritte gibt — die Frage
„welche Zusicherung steht nur in `apps/web`?" lässt sich nicht mit einem Prüflauf beantworten,
weil sie über Schichten geht. Sie steht deshalb als Frage in `docs/architektur.md` 5.4, dort, wo
jemand sie beim nächsten Fehlerschlüssel wiederfindet.

---

Annahmen:

1. **Ein Regelname ist über alle Flächen hinweg eindeutig**, nicht je Fläche. Die Alternative
   wäre „ein Pool und eine Spalte dürfen gleich heißen", und sie ist schlechter: `ux_pool_name`
   gilt über alle Flächen, ein Regelwechsel von `board` auf `both` (der Griff „Auf das Board" aus
   T-072) liefe sonst nachträglich in den Index, und der Benutzer bekäme die Abweisung an einer
   Stelle, an der er gar keinen Namen eingibt.
2. **Der eingegebene Name steht in der Fehlermeldung.** Es ist die Anzeigeform der Eingabe des
   Aufrufers, nicht ein Wert aus dem Bestand — er erfährt nichts, was er nicht selbst geschickt
   hat. Der Name geht **nicht** ins Protokoll; dort steht wie bisher nur der Schlüssel (B-2.4
   Punkt 2). Ohne den Namen ist die Meldung bei „Backend trifft backend" rätselhaft.
3. **Ein doppelter Regelteil ist 422 und nicht 409.** Wer denselben Term zweimal schickt, hat
   eine Regel geschickt, die es so nicht gibt; ein 409 lüde zum unveränderten Wiederholen ein.
4. **Der Satz zu `ux_todo_status_name` spricht jetzt vom „Status" und nicht von der „Spalte".**
   Seit E-054 ist `todo_status` keine Kanban-Spalte mehr. Die Änderung ist folgenlos für alles,
   was heute läuft — den Satz hat wegen des Suchbegriff-Befunds nie jemand zu sehen bekommen.
5. **Der Standard-Status wird beim Löschen abgewiesen und nicht weitergereicht** (9.2). Dieselbe
   Begründung, aus der ein gelöschter Status seine Todos nicht automatisch umhängt: Eine
   Zustandsänderung an etwas anderem, versteckt hinter einer Löschung, sieht niemand.
6. **`isDefault: false` bleibt auf einem Status ohne Standardmarke folgenlos.** Es wäre bequemer,
   jedes `isDefault: false` abzuweisen; es wäre aber falsch — die Oberfläche schickt bei einer
   Änderung womöglich den ganzen Datensatz, und eine Sperre, die mehr abweist als sie schützt,
   ist ein zweiter Fehler. Gemessen in `proof:conflicts` 5.

---

Risiken:

1. **Das Netz in `app.onError` kann eine Nachlässigkeit verdecken.** Wer künftig einen Adapter
   ohne `attempt` schreibt, bekommt einen brauchbaren Statuscode und merkt nicht, dass die
   Meldung allgemein bleibt. Dagegen steht `proof:conflicts` Abschnitt 2, der je Fall den
   **erwarteten** Schlüssel prüft und nicht nur „kein 500" — und die Protokollzeile, die das
   Netz mit `warn` schreibt.
2. **`PoolPort.listNames` liest die ganze Tabelle.** Begründet (ein paar Dutzend Zeilen, dieselbe
   Begründung wie „kein Index auf `placement`" in 0009), aber es ist eine Annahme über den
   Bestand. Wer Regeln je maschinell anlegen lässt, muss sie erneut prüfen.
3. **Die Domänenregel und `ux_pool_name` sind zwei verschieden starke Regeln nebeneinander.**
   Solange nur der Anwendungsfall schreibt, greift die stärkere. Ein Eingriff von Hand in die
   Datenbank kann zwei Regeln erzeugen, die die Anwendung für eine hält — dann liefert
   `listNames` zwei Treffer mit demselben Schlüssel und jede weitere Anlage wird abgewiesen, bis
   jemand aufräumt. Sichtbar, nicht still.
4. **`checkName(raw, subject)` setzt Text in eine Meldung ein.** Die Aufzählung `NAME_SUBJECT`
   verhindert, dass jemand dort eine Eingabe hineinreicht; sie steht in der Domäne und nicht am
   Aufrufer. Wer sie zu `checkName(raw, string)` öffnet, öffnet die Tür wieder.
5. **`default_status_locked` ist ein neuer Fehlerschlüssel, den die Oberfläche noch nicht
   kennt.** Sie bekommt ihn heute nur, wenn ein zweiter Aufrufer den Standard löscht, während
   sie offen ist — dann zeigt sie den Text des Dienstes, und der ist richtig und vollständig.
   Ein eigener Zweig wäre trotzdem besser; siehe „Offene Fragen" 4.
6. **Fünf geänderte Meldungstexte.** Sie sind Anzeigetext und keine Schlüssel, aber wer sie in
   einer Prüfung wörtlich erwartet, wird rot. Ich habe den Baum danach durchsucht und außer
   `errors.ts` und `repo-statuses.ts` keine Stelle gefunden, die einen davon führt —
   `tests/e2e` und `apps/web` verzweigen über `code`, nicht über `message`. `pnpm check` ist
   grün, und `tests/e2e` läuft dort nicht mit; der e2e-tester sollte es einmal fahren.

---

Offene Fragen:

1. **Für den Orchestrator: `proof:conflicts` gehört in die `check`-Kette der Wurzel.** Gewünschte
   Einträge in der Wurzel-`package.json` — ich habe sie **nicht** selbst gesetzt:

   ```json
   "proof:conflicts": "pnpm --filter @takt/local-api proof:conflicts",
   ```

   und in `check` hinter `proof:tags`:

   ```
   … && pnpm run proof:tags && pnpm run proof:conflicts && pnpm run test:coverage && …
   ```

   Damit werden es dreizehn Nachweispfade. Der Eintrag in
   `apps/local-api/package.json` steht bereits (meine Hoheit, wie `proof:tags` in T-058), und
   der Lauf ist grün — er hängt nur noch nicht in der Kette. Bis dahin muss er von Hand
   gefahren werden, und genau das ist der Zustand, aus dem eine Prüfung stillschweigend
   verschwindet.

2. **Für den unit-tester: `PoolPort.create` sollte `Result` liefern.** Die Signatur
   `Promise<Pool>` ist der Rest, aus dem dieser Befund entstanden ist; sie ist der letzte
   Schreibweg im Adapter neben `TodoPort.create`, der seinen Fehlschlag nicht als Wert meldet.
   Umstellen kann ich sie nicht: `packages/storage/test/repo-tags.test.ts` ruft sie an neun
   Stellen auf und benutzt das Ergebnis unmittelbar. Nötig wären dort neun `expect(x.ok)`-Zeilen,
   hier ein `attemptAtomically(conn, 'takt_pool_create', …)` — **atomically**, nicht `attempt`,
   weil `create` zwei Anweisungen schreibt (Zeile und Regelterme) und ein Fehlschlag als Wert
   sonst die halbe Anlage stehen ließe (T-047).

3. **Für den unit-tester: `packages/storage/test/errors.test.ts` misst Meldungen, die SQLite
   nicht erzeugt.** Er baut `UNIQUE constraint failed: some_table.ux_pool_position` — eine Form,
   die es nicht gibt (siehe die gemessene Tabelle in der Zusammenfassung). Der Test war grün,
   während die Zuordnung im Betrieb nicht griff; das ist genau die Sorte Grün, gegen die
   `proof:conflicts` geschrieben ist. Ich habe die Datei nicht angefasst und stattdessen **beide**
   Formen als Suchbegriff eingetragen — was auch für sich richtig ist, weil die Gestalt eines
   Index sich mit einer Migration ändern kann. Der Test sollte trotzdem auf echte Meldungen
   umgestellt werden, sonst bewacht er weiterhin eine Form, die nie auftritt.

4. **Für den frontend-dev: drei Antworten sind jetzt lesbar.**

   - `409 name_conflict` mit einer Meldung, die den Namen nennt, für `POST /pools` **und**
     `PATCH /pools/{id}`. Der Text muss nicht ersetzt werden; er sagt bereits, dass Pools und
     Spalten sich die Namen teilen. Zusätzlich möglich: das Namensfeld markieren
     (`aria-invalid`) — der Schlüssel sagt, welches Feld gemeint ist.
   - `409 default_status_locked` für `DELETE /todo-statuses/{id}` und für
     `PATCH … {isDefault:false}` auf dem Standard. Ihre Sperre in `StatusSettings.tsx` bleibt
     richtig und darf bleiben; sie ist jetzt keine Vermutung über den Dienst mehr, sondern eine
     Vorwegnahme dessen, was er ohnehin sagt. Der Fall, den Sie damit **zusätzlich** behandeln
     können: Ein zweiter Aufrufer nimmt Ihnen den Standard weg, während Ihre Ansicht offen ist.
   - Fünf Meldungen der Statusrouten sprechen jetzt vom **Status** statt von der Spalte —
     darunter die, die in Ihrem Einstellungsbereich zwei Absätze unter der Erklärung erschien,
     dass beides zweierlei ist (T-073).

5. **Für den e2e-tester: `POST /pools` kann jetzt abweisen — und `DELETE /todo-statuses/{id}`
   auf den Standard ebenfalls.** Wer in `tests/e2e/**` Regeln über
   die Route anlegt, muss mit 409 rechnen, wenn zwei Fälle denselben Namen benutzen —
   einschließlich der Groß- und Kleinschreibung und des Leerraums. Vorher war das ein 500 und
   damit ebenso ein Fehlschlag, nur ein unverständlicher.

6. **Der Port 17843 verträgt keine zwei Prüfläufe.** Das ist kein Fehler von Takt (B-1.5 will es
   so), aber es macht `proof:tags` und `proof:conflicts` von der Umgebung abhängig. Wenn das
   öfter vorkommt, wäre eine Umgebungsvariable für den Port im **Prüfbetrieb** der Weg — nicht
   ein Ausweichen zur Laufzeit. Ich habe `config.ts` dafür nicht angefasst, weil es eine
   Sicherheitsaussage berührt (`allowedHosts`, `ALLOWED_ORIGINS`) und der security-checker sie
   geprüft hat.

---

Nächster Schritt: Orchestrator trägt `proof:conflicts` in die Wurzel-`package.json` ein (offene
Frage 1) — ohne den Eintrag läuft der Nachweis, aber nicht von selbst. Danach der unit-tester mit
`PoolPort.create` auf `Result` (offene Frage 2) und den echten SQLite-Meldungen in
`errors.test.ts` (offene Frage 3): dieselbe Datei, dieselbe Ursache, ein Zug. Der frontend-dev
kann `default_status_locked` aufgreifen, wenn er ohnehin an der Statusverwaltung ist (offene
Frage 4); dringend ist es nicht, seine Sperre ist bereits richtig.
