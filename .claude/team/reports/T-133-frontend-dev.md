# T-133 — O-A, O-AF, O-AT

Aufgabe: T-133 — O-A (Kanban-Spalten umbenennen), O-AF („Takt beenden" scheitert stumm),
O-AT (die `unknown`-Grenze an `ExportTemplate.definition`)
Status: fertig
Rolle: frontend-dev
Stand: Branch `status-als-regelterm`, Basis `d9555d0`

Gelesen: `CLAUDE.md`; `.claude/team/decisions.md` — **E-013** (das Designsystem ist die Referenz),
**E-054/E-055** (eine Spalte ist eine Regel über fünf Achsen), **E-057**, **E-058**, **E-059**,
**E-060/E-061**, **E-062**, **E-063** alle sechs Punkte; `docs/spec.md` Abschnitte 3, 5, 11 bis 16;
`docs/glossar.md` (Begriffe „Pool", „Regel", „Statusspalte"); `board.md` Abschnitt „Welle O" und die
Zeilen O-A, O-AF, O-AT; die Berichte **T-129** (Herkunft im Typ, Aufbau des Nachweises),
**T-124**, **T-052** (Ursprung von O-A), **T-130** (die e2e-Fälle zu O-AF).

---

## 0. Die drei Aufträge in je einem Satz

| Punkt | Befund vorher | Jetzt |
|---|---|---|
| **O-A** | Eine Board-Spalte ließ sich nur über das vollständige Regelformular umbenennen — acht Abschnitte, fünf Achsen, und beim Speichern wird die **ganze** Regel neu geschrieben. | Eigener Dialog `PoolRenameDialog`, erreichbar aus dem Spaltenmenü, aus „Spalten des Boards" und aus der Regelliste S-11. Er schickt `{ name }` und sonst nichts. |
| **O-AF** | War **bereits behoben** (T-124, e2e in T-130) — nachgemessen und bestätigt. Der Auftrag verlangte zusätzlich die Suche nach weiteren Stellen derselben Klasse. | **Zwei weitere gefunden und behoben**, beide im Exportordnerfeld: eine Zusage ohne `catch` und eine unbeantwortete Frage ohne Ausgang. |
| **O-AT** | `ExportTemplate.definition` ist `unknown`; die daraus ausgepackten **Feldnamen** waren gewöhnlicher Text und für `proof:foreign` unsichtbar. | Eine erklärte Übergangsstelle (`foreignTextFrom`), `ExportFieldDefinition.name: ForeignText`, und **Abschnitt 6** im Nachweis, der jeden zweiten Weg findet. Dabei fielen **sechs weitere rohe Anzeigestellen** an, die T-129 nicht erreichen konnte. |

Nachweis in einer Zeile: `typecheck` **0**, `test` **1028/1028**, `proof:foreign` **14 bestanden,
0 fehlgeschlagen** (vorher 10/0), `contrast` **0 von 432**, `proof:codepoints` **45/0**, Build 0.
Sieben Gegenproben, jede einzeln gemessen; eine davon fand einen Fehler **im Nachweis selbst**.

---

## 1. O-A — Kanban-Spalten umbenennen

### 1.1 Zuerst die Frage an die API, wie beauftragt

**Die API kann es. Keine Blockade.**

| Was | Wo | Ergebnis |
|---|---|---|
| OpenAPI-Beschreibung | `apps/local-api/openapi/takt-local-api.yaml:1024-1041`, Schema `PoolUpdate` `:4460-4480` | `PATCH /pools/{poolId}` ist eine **Teiländerung**; `name: { type: string, minLength: 1, maxLength: 200 }`. Die Beschreibung sagt ausdrücklich: „Die Regel darf ihren **eigenen** Namen behalten; sie steht sich nicht selbst im Weg", und `409 name_conflict` bei einem vergebenen Namen. |
| Route | `apps/local-api/src/routes/structure.ts:380` | `pools.patch('/:poolId')` → `poolUpdateSchema` → `updatePool`. `Partial<PoolInput>`: Was fehlt, bleibt. |
| Eindeutigkeit | `packages/storage/migrations/0001_initial.up.sql:181` | `CREATE UNIQUE INDEX ux_pool_name ON pool (name COLLATE NOCASE)` — **über die ganze Tabelle**, also kollidiert eine Spalte auch mit einem reinen Pool. |
| Oberflächenseite | `apps/web/src/api/endpoints.ts:328` | `updatePool(id, body: PoolPatch)` gibt es seit T-072; nur gerufen wurde sie nie mit `{ name }` allein. |

### 1.2 Warum der Umweg über „Regel bearbeiten" keine Bedienmöglichkeit war

Der Befund aus T-052 stammt aus der Zeit **vor E-054**, als eine Spalte ein Statuswert war
(`StatusColumnsDialog` zeigte den Namen als reines `<span>`). Seit E-054 steht der Name im
Regelformular — nur:

1. **Er ist nicht auffindbar.** Wer eine Spalte umbenennen will, sucht „Umbenennen". Dieselbe
   Handlung heißt in S-08 (Tags, Ordner) und S-09 (Status) seit jeher so; nur an der Spalte hieß
   sie anders.
2. **Er schreibt mehr, als er soll.** `PoolFormDialog` schickt beim Speichern **alle** Achsen mit
   (`name, matchMode, includeSubfolders, placement, rule, excludedTags, statusIds, completion,
   exportState`). Wer nur ein Wort ändern will, schreibt die ganze Regel neu.

### 1.3 Was gebaut ist

`apps/web/src/screens/PoolRenameDialog.tsx` — **ein** Dialog für beide Flächen, weil „Spalte" und
„Pool" seit E-054 zwei **Anzeigeorte derselben Regel** sind und nicht zwei Dinge. Das ist R-08
sinngemäß, wie beauftragt: zwei Wörter für eine Sache sind der Bedienfehler, nicht die Lösung.
**Kein neuer Begriff** — verwendet werden ausschließlich „Regel", „Pool", „Board-Spalte",
„Anzeigeort", „Spaltenkopf", „Pool-Liste", „Pool-Filter", „Pool-Auswahl", und die Kurzformen
kommen aus `POOL_PLACEMENT_SHORT` in `lib/labels.ts`, damit kein dritter Wortlaut entsteht.

**Drei Bedienstellen, alle dort, wo der Benutzer die Spalte sieht:**

| Ort | Was |
|---|---|
| Spaltenkopf des Boards (S-04) | Menüeintrag **„Umbenennen"** mit dem Stift, **vor** „Regel bearbeiten" |
| Dialog „Spalten des Boards" | Schaltfläche **„Umbenennen"** je Zeile; die alte Schaltfläche „Bearbeiten" heißt jetzt **„Regel bearbeiten"** — sie ließ offen, ob damit der Name gemeint ist, und genau daran scheiterte das Umbenennen bisher |
| Regelliste S-11 (`TagsScreen`) | dieselben zwei Schaltflächen. Eine Fläche mit „Umbenennen" und eine ohne wäre wieder das Paar aus E-059: zwei Bedienniveaus für eine Sache, und eines lehrt, dass das andere nicht ernst gemeint ist |

**Symbole umsortiert, nicht erfunden:** Der Stift ist an jeder anderen Fläche das Umbenennen, also
bekommt ihn „Umbenennen"; „Regel bearbeiten" trägt den Trichter (eine Regel **ist** ein Filter,
E-055), und „Alle Todos dieser Regel in der Liste" den Pfeil hinaus.

### 1.4 Die Zustände — Leer, Lädt, Hover, Aktiv, Fehler

| Zustand | Umsetzung |
|---|---|
| **Leer** | Feld leer → „Speichern" gesperrt, der Grund steht **am Feld** und nicht erst nach dem Klick. Dazu der schon vorhandene Leerzustand „Noch keine Spalte" im Verwaltungsdialog. |
| **Unverändert** | Derselbe Name → gesperrt, mit Grund. Ein `PATCH`, der nichts ändert, wäre eine Meldung ohne Ereignis. |
| **Vergeben** | Vorabprüfung gegen **alle** Regeln (`structure.rules`, nicht `pools`), groß/klein gleichgesetzt wie `COLLATE NOCASE`, die eigene Regel ausgenommen. Fehlertext am Feld. |
| **Lädt** | Zwei Ladezustände, beide sichtbar: „Speichern" trägt den Anzeiger und **behält seine Farbe** (Designsystem 5: „arbeitet gerade" sieht nicht aus wie „geht nicht"); und solange die Regelliste nicht geladen ist, sagt eine Warnmeldung, dass die Vorabprüfung gerade **nicht** möglich ist, statt Freiheit zu behaupten (`existingKnown`). |
| **Fehler** | `FormDialog`-Fehlerbereich mit der Meldung des Dienstes; das Feld behält den eingegebenen Text. Der `409 name_conflict` landet genau dort. |
| **Hover / Aktiv / Fokus** | unverändert aus `Button`, `TextField`, `Menu`, `FormDialog` — dieselben Bausteine, dieselben Zustände. Fokusfalle, Escape und Fokusrückgabe bringt `FormDialog` mit. |

**Rückweg statt Bestätigungsdialog.** Ein Umbenennen ist vollständig umkehrbar; der Toast trägt
„Rückgängig" und benennt beide Namen („Aus „Alt" wurde „Neu""). Das ist die Abwägung aus T-091,
die auch „Vom Board nehmen" trägt (E-059). Der Rückweg läuft **außerhalb** von `mutation.run`,
weil der Dialog dann zu ist — sein Fehlschlag geht deshalb in eine eigene Meldung und bleibt nicht
stumm (das ist die O-AF-Regel, angewandt auf die eigene neue Fläche).

### 1.5 Zwei Nebenwirkungen, beide beabsichtigt

* **`.rule-row` und `.pool-row` brechen jetzt um** (`flex-wrap: wrap`). Ohne den Umbruch schöbe die
  dritte beziehungsweise fünfte Schaltfläche in einem schmalen Fenster den **Namen** aus der Zeile
  — und der Name ist das, wonach man dort sucht (A-13.2, A-13.8).
* **Acht handgeschriebene Längengrenzen** sind durch die Konstanten aus `@takt/domain` ersetzt
  (`MAX_NAME_LENGTH`, `MAX_TITLE_CHARACTERS`). Begründung und der Fund darin stehen in Abschnitt 4.

---

## 2. O-AF — nachgemessen, und zwei weitere Stellen derselben Klasse

### 2.1 Der beauftragte Punkt ist bereits behoben

`App.tsx:250` gibt es in dieser Form nicht mehr; die Stelle liegt heute bei
`App.tsx:293` (`onQuit={quitApplication}`), und die Behandlung sitzt in
`components/ShellStatus.tsx`:

| Baustein | Was er leistet |
|---|---|
| `useQuitAttempt` (`:159`) | Frist von **5 s** (`QUIT_GRACE_MS`), weil der Erfolgsfall der **Tod des eigenen Prozesses** ist: `takt_quit` ruft `app.exit(0)`, die Zusage kommt nie zurück. Ein Fehlschlag ist deshalb „es geschieht nichts", und auf nichts kann man nicht warten — die Frist macht aus dem Ausbleiben ein Ereignis. `Promise.resolve().then(onQuit)` fängt auch den **synchronen** Wurf. |
| `QuitFailureNotice` (`:203`) | Zwei Schritte (Kreuz/Alt+F4, dann Task-Manager), **kein** Verweis auf die Systembetreuung, und der beruhigende Schlusssatz. |
| `QuitButton` (`:258`) | Die Live-Region `.quitfail__region` (`role="status"`) steht **immer** im Baum, auch leer — dieselbe Regel wie bei `refusal` in `ConfirmDialog`. |
| `quitApplication` (`app/connection.ts:211`) | Wirft ohne Hülle, statt wortlos zurückzukehren. |

Beide Sperrflächen (`ServiceStoppedOverlay` `:534`, `UserNameBlockedOverlay` `:701`) benutzen
denselben Knopf. **Die Auskunft steht im Feld selbst und nicht im Meldungsstapel** — richtig, weil
der Stapel seit T-110 hinter der Abdunklung liegt, solange ein Dialog steht (T-118 Frage 2). Der
e2e-Fall dazu ist TP-SHELL-01 aus T-130.

### 2.2 Die Suche nach weiteren Stellen derselben Klasse — wie gemessen

Nicht per Auge, sondern mit einem Durchlauf über den Übersetzerbaum von `apps/web`: jeder
`void <Zusage>`, dessen Kette **nicht** mit `.catch(…)` oder einem zweiten `then`-Argument endet.
25 Fundstellen, davon 18 `mutation.run`/`dragMove.run`/`noteMutation.run` (fangen selbst, siehe
`useAsync.ts:143`) und vier `void (async () => { try … catch … })()` (Rumpf vollständig umschlossen,
einzeln nachgesehen). Übrig blieben **drei**, davon eine harmlos (`App.tsx:154`, `readShellState`
fängt intern) und **zwei echte**:

| Stelle | Was passierte | Warum es die O-AF-Klasse ist |
|---|---|---|
| `ExportDirectoryField.tsx:292` — `chooseExportDirectory(...)` | `.then(…).finally(…)` **ohne `catch`**. Wirft der Aufruf, geht der Anzeiger aus, und sonst geschieht **nichts**. | Der Knopf ist der einzige Weg zum Exportordner, solange die Hülle da ist. Das Textfeld — der Rückfallweg — erscheint nur, wenn `pickerFailure` gesetzt ist, und das blieb es nie. Der Benutzer sitzt vor einem Knopf, der auf nichts reagiert. |
| `ExportDirectoryField.tsx:281` — `isShellPresent()` | Rückweisung unbehandelt; `shell` bliebe für immer `null`. | Bei `shell === null` zeigt das Feld **weder** den Knopf **noch** das Textfeld — eine Beschriftung ohne Bedienelement. Kein Ausgang überhaupt. |

**Behoben** über den Mechanismus, der schon da war: Beide setzen jetzt `pickerFailure`, damit das
Textfeld an die Stelle des Dialogs tritt und den Grund darunter nennt. Der Exportordner bleibt
damit in jedem Fall einstellbar.

**Weitere Sperrflächen geprüft und in Ordnung:** der Dialog zur verwaisten Buchung
(`TimerContext.confirmOrphan` → `.catch` → `dialogError` **im Dialog**), der Verbindungsfehler beim
Start (`App.attempt` → `.catch` → Zustand `failed` mit „Erneut versuchen"), `NoShellNotice`
(bewusst ohne Ausgang, weil es nichts zu tun gibt).

Als Regel 13 in `apps/web/design/DESIGNSYSTEM.md` Abschnitt 11 festgehalten, dazu Regel 5 in
Abschnitt 9 für „Takt beenden".

---

## 3. O-AT — die `unknown`-Grenze, nach dem Muster von T-129

### 3.1 Der Befund, und warum ein Test ihn nie gemeldet hätte

`ExportTemplate.definition` ist `unknown` — richtig so, das Vorlagenformat gehört
`packages/export`. Nur packte `lib/exportTemplateModel.ts` daraus **Feldnamen** aus, die ein
Benutzer geschrieben hat:

```ts
const name = candidate["name"];
if (typeof name !== "string" || name.trim().length === 0) …
```

Ab dieser Zeile war der Name gewöhnlicher Text. `ExportFieldDefinition.name` hieß `string`, und
damit war jede Anzeigestelle für die Abschnitte 2 bis 4 des Nachweises unsichtbar — sie können nur
finden, was als **fremd bekannt** ist. Das ist E-063 Punkt 5 in Reinform.

### 3.2 Die Grenze, gezogen wie T-129 sie gezogen hat: im Typ

Neu in `lib/foreign.ts`:

```ts
export function foreignTextFrom(value: unknown): ForeignText | null
```

Zur Laufzeit fast nichts; ihr ganzer Wert liegt im Typ. Der Nachweis erkennt sie an ihrer
**Signatur** und nicht an ihrem Namen — genau wie er `quotedName`, `foreignText` und `<Foreign>`
an ihrer Signatur erkennt. Wer eine zweite baut und sie so deklariert, wird ohne Änderung am
Nachweis anerkannt; wer diese auf `string` verbreitert, macht ihn rot.

Damit greift die vorhandene Maschinerie von selbst: `ExportFieldDefinition.name` **muss**
`ForeignText` heißen (sonst Abschnitt 4), und jede Anzeigestelle **muss** behandeln (Abschnitte 2
und 3). Die vier Aufrufe der Übergangsstelle sind der Feldname und die drei Wächter
`hasSource`/`hasTransformation`/`hasConditionOperator` — fachlich unverändert, sie weisen weiter
alles ab, was nicht auf der geholten Liste steht (E-049).

### 3.3 Abschnitt 6 des Nachweises

`apps/web/scripts/proof-foreign.mjs` hat jetzt **sechs** Abschnitte mit **14** Prüfungen (vorher
fünf mit zehn). Neu:

| Prüfung | Was sie sagt |
|---|---|
| **6.1** es gibt eine erklärte Übergangsstelle vom Wert ohne Typ zu fremdem Text | Der Wächter über den Wächter: Nähme jemand ihr den Rückgabetyp, ginge 6.2 lautlos grün. |
| **6.2** kein anderer Weg macht aus einem Wert ohne Typ Text | Jedes `typeof x === "string"` an einem `unknown` und jedes `x as string` aus einem `unknown`, außerhalb einer Übergangsstelle. |
| **6.3** und sie wird auch benutzt | Zählt die Aufrufe (heute 4). Sonst wäre 6.2 am billigsten dadurch zu befriedigen, dass niemand mehr auspackt. |
| **3.2** und die Prüfung hat auch Reihen fremden Textes gesehen | Gegenprobe zur Reihen-Erkennung, siehe 3.4. |

Und **drei Erweiterungen an bestehenden Abschnitten**, alle aus derselben Einsicht: Die Marke fällt
nicht nur an einer Naht ab, sondern auch an einer **Sammlung** und an einer **Signatur**.

### 3.4 Die Reihe — der Weg, den T-129 nicht sah

`[view.column.name, ...columns].join(", ")` ergibt eine gewöhnliche Zeichenkette. Jede Prüfung, die
nach dem Typ des eingesetzten Ausdrucks fragt, hält den Satz danach für unverdächtig — obwohl er
drei fremde Namen trägt. Statt einer eigenen, lauten Regel („kein `join`") gilt jetzt: **Trägt die
Elementart die Marke, ist das Zusammenfügen selbst ein fremder Wert** (`isForeignJoin`,
`yieldsForeign`). Damit läuft es durch dieselben Abschnitte 2, 3 und 4 wie jeder andere fremde Wert
— und `others.map(foreignText).join(", ")` bleibt still, weil die Behandlung sichtbar davor steht.

Der erste Entwurf war eine eigenständige Prüfung „kein rohes `join`" und meldete **sieben** Stellen,
von denen **fünf keine** waren (behandelt, verglichen, als Suchschlüssel benutzt). Das ist genau die
Bauart, die abgeschaltet wird; sie ist verworfen worden.

### 3.5 Zwei Löcher, die die Gegenproben aufgedeckt haben

**Die Kurzform.** Gegenprobe J (`ExportFieldDefinition.name` wieder auf `string`) blieb beim ersten
Lauf **grün** — `fields.push({ name, source, transformation })` ist eine
`ShorthandPropertyAssignment` und keine `PropertyAssignment`. Abschnitt 4 sah sie nicht. Behoben;
danach findet dieselbe Gegenprobe beide Stellen.

**Die Rückgabe.** Erst als die Reihe als fremder Wert galt, fiel `previewNote(entries): string` in
`ExportScreen.tsx` auf: Sie fügt die **Leistungstexte einer Tagesgruppe** zusammen und gab sie als
gewöhnlichen Text zurück. `ExportGroups.tsx` zeigte sie roh — im Absatz **und** im `title`. Das ist
die Zeile der Exportvorschau, an der ein Benutzer liest, was er gleich abrechnet. Abschnitt 4 prüft
jetzt auch `return`-Anweisungen.

### 3.6 Was der Nachweis dabei gefunden hat — sechs rohe Anzeigestellen

Keine davon hätte ein Test gemeldet; für gewöhnliche Texte ist jede Behandlung die Identität.

| Stelle | Was roh dastand |
|---|---|
| `components/ExportGroups.tsx` (2) | die **zusammengeführte Leistung** einer Tagesgruppe, im Absatz und im `title` |
| `components/ExportRowPanes.tsx` (3) | der **Schlüssel** jeder Zelle (= der Feldname der Vorlage), die Liste der Felder, die eine Zeile nicht erreicht haben, und der **JSON-Abzug** der Zeile |
| `screens/BoardScreen.tsx` | die Ansage „X steht in n Spalten: …" — drei Regelnamen, roh zusammengefügt |
| `lib/exportTemplateModel.ts` | der Satz zur abweichenden **Feldreihenfolge**; dazu der Rückfall der drei Beschriftungen (`sourceLabel` & Co.), der bei einer unbekannten Quelle den gespeicherten Pfad zeigt |

Dazu **sieben Träger**, die ihre Herkunft behalten mussten, damit die Prüfung überhaupt bis dorthin
sehen konnte: `ExportFieldDefinition.name`, `ExportGroupViewModel.mergedNote`,
`KanbanAppearance.otherColumns`, `KanbanCardData.statusName`, `BoardColumnProps.columnName`
(`ReadonlyMap<Id, ForeignText>`), `onHighlight`/`statusName` von `BoardColumn`,
`missingFieldNames`, und der Parameter `name` von `move` in `TemplateFields`.

**Der Schlüssel einer Exportzeile** bekam eine eigene Stelle: `ExportRow` ist ein
`Record<string, ExportValue>` — der Wert trägt seine Marke, der Schlüssel **kann** keine tragen.
`cellsOf(row)` in `ExportRowPanes.tsx` spricht deshalb aus, was er ist:
`readonly (readonly [ForeignText, ExportValue])[]`. Gegenprobe L blieb ohne diese Zeile grün.

### 3.7 Nebenbei: `TemplateDeviation.id` trug fremden Text

`id: \`missing-${expected.name}\`` — der Schlüssel wurde nie angezeigt (er ist der React-`key`),
aber er trug einen fremden Namen durch eine Zeichenkette, und damit war an dieser Stelle nicht mehr
zu sehen, ob er irgendwo landet, wo ihn jemand liest. Er trägt jetzt die **Stelle** in der
Standardvorlage; die leistet dasselbe und trägt nichts.

---

## 4. Acht handgeschriebene Zahlen ersetzt — und eine davon war falsch

Der Umbenennen-Dialog braucht eine Längengrenze. Eine neunte Zahl zu erfinden wäre der Fehler
gewesen, den E-063 Punkt 4 und T-128 benennen. Also lesen jetzt **alle** Felder, die an
`nameSchema` beziehungsweise `titleSchema` hängen, ihre Grenze aus `@takt/domain`:

| Datei | vorher | jetzt |
|---|---|---|
| `TodoFormDialog.tsx` (Titel) | `512` | `MAX_TITLE_CHARACTERS` (**500**) |
| `PoolFormDialog.tsx`, `StatusSettings.tsx`, `TagsScreen.tsx` ×3 | `128` | `MAX_NAME_LENGTH` (**200**) |
| `TemplatesScreen.tsx` ×2 | `120` | `MAX_NAME_LENGTH` (**200**) |

**Die `512` war ein Befund, kein Schönheitsfehler.** `titleSchema` im lokalen Dienst nimmt seit
T-114/T-128 **500** Zeichen (`MAX_TITLE_CHARACTERS`). Das Eingabefeld ließ 512 zu — also ein
vorbereitetes `422` für einen Text, den der Benutzer vollständig eintippen durfte. Das ist
dieselbe Sackgasse, die T-114 im Add-in beseitigt hat, nur an der anderen Tür. Verwandt mit
**O-AD** (die `512` steht in der OpenAPI noch am `Todo.title` des Hauptabschnitts, domain-dev).

Die `128` und die `120` waren **strenger** als die Tür: kein Fehler, aber sie verhinderten, dass
ein bereits getragener längerer Name vollständig eingetippt werden kann.

Nicht angefasst: `maxLength={64}` an der Call-Nummer (die Zahl steht in
`routes/todos.ts:52`, nicht in der Domäne — siehe offene Frage 3) und `maxLength={80}` am
Exportfeldnamen (er lebt in `definition`, geprüft vom Motor).

---

## 5. Nachweis

Jeder Befehl einzeln, Ausgabe umgeleitet, Endstatus unmittelbar danach gelesen. Alle Läufe **nach**
der letzten Änderung.

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Testkonfigurationen, `tests/e2e` |
| `pnpm test` | **0** | 60 Dateien, **1028/1028** |
| `npx vitest run apps/web/test` | **0** | 5 Dateien, **71/71** |
| `pnpm run proof:foreign` | **0** | **14 bestanden, 0 fehlgeschlagen** (vorher 10/0); 101 Quelldateien, **149** behandelte Übergaben (vorher 138), 20 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 4 Aufrufen |
| `pnpm --filter @takt/web contrast` | **0** | **0 von 432** Paaren durchgefallen |
| `pnpm --filter @takt/web build` | **0** | 128,63 kB CSS, 683,87 kB JS |
| `pnpm --filter @takt/web build:designsystem` | **0** | Musterseite übersetzt |
| `pnpm run proof:codepoints` | **0** | 45 bestanden — kein rohes Steuer- oder Richtungszeichen in den neuen Dateien |

**`pnpm desktop` und `pnpm test:e2e` sind nicht gelaufen** (Auftrag: 17843/17844 und 5173 belegt).

### Sieben Gegenproben, jede einzeln, danach `sha256sum` bytegleich zurück

| Fall | Eingriff | Ergebnis |
|---|---|---|
| **H** | `foreignTextFrom` gibt `string \| null` statt `ForeignText \| null` | Endstatus **1**, **drei** Zeilen: keine Übergangsstelle, kein Vergleich, keine Aufrufe |
| **I** | Feldname wieder mit `typeof name !== "string"` ausgepackt | Endstatus **1**, „Text ohne Herkunft aus einem Wert ohne Typ: `exportTemplateModel.ts:327`" |
| **J** (1. Lauf) | `ExportFieldDefinition.name` zurück auf `string` | **grün — der Fehler lag im Nachweis.** Die Kurzform `{ name }` lief an Abschnitt 4 vorbei. |
| **J** (2. Lauf, nach der Behebung) | derselbe Eingriff | Endstatus **1**, beide Stellen genannt |
| **K** | `.map(quotedName)` aus der Board-Ansage entfernt | Endstatus **1**, „roh in einem Satz: `BoardScreen.tsx:443`" |
| **L** (1. / 2. Lauf) | Zellenschlüssel wieder roh im `<dt>` | **grün** ohne `cellsOf`, **1** mit — „roh angezeigt: `ExportRowPanes.tsx:89`" |
| **M** | JSON-Abzug der Zeile wieder roh | **grün.** Dokumentierter blinder Fleck (`JSON.stringify`), siehe R2 |
| **N** | `previewNote` gibt wieder `string` | Endstatus **1**, „Herkunft verloren: `ExportScreen.tsx:1267`" |

Die Fälle **J** und **L** sind die wertvollsten: Beide waren beim ersten Lauf grün und haben je ein
Loch **im Nachweis** aufgedeckt, nicht im Code. Ein Wächter ohne Gegenprobe ist eine Behauptung.

---

## 6. Artefakte

19 Dateien, alle in `apps/web`. **`apps/desktop` ist nicht angefasst** (O-AJ ausdrücklich nicht in
dieser Welle), ebenso wenig `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`,
`apps/*/test/**`, `tests/e2e/**`, `docs/**` und jede gemeinsame Datei.

| Datei | Was |
|---|---|
| `src/screens/PoolRenameDialog.tsx` | **neu.** Der Umbenennen-Dialog (O-A) |
| `src/screens/BoardScreen.tsx` | Menüeintrag „Umbenennen", Symbole umsortiert, `onRename` im Verwaltungsdialog, Träger `columnName`/`onHighlight`/`statusName`, Ansage behandelt |
| `src/screens/TagsScreen.tsx` | „Umbenennen" und „Regel bearbeiten" in S-11, `MAX_NAME_LENGTH` ×3 |
| `src/components/Kanban.tsx` | `otherColumns` und `statusName` tragen ihre Herkunft |
| `src/styles/app.css` | `.rule-row`/`.pool-row` brechen um |
| `src/lib/foreign.ts` | **`foreignTextFrom`** — die erklärte Übergangsstelle (O-AT) |
| `src/lib/exportTemplateModel.ts` | `name: ForeignText`, Auspacken und die drei Wächter über die Übergangsstelle, behandelte Rückfälle, Abweichungssatz, positionsbasierte `id` |
| `src/components/ExportRowPanes.tsx` | `cellsOf`, Zellenschlüssel, fehlende Felder und JSON-Abzug behandelt |
| `src/components/ExportGroups.tsx` | `mergedNote: ForeignText`, Absatz und `title` behandelt |
| `src/screens/ExportScreen.tsx` | `previewNote` gibt fremden Text zurück |
| `src/screens/TemplateFields.tsx` | `move(name: ForeignText)`, Nachschlagewert vor das JSX |
| `src/components/ExportDirectoryField.tsx` | **O-AF-Klasse:** zwei stumme Fehlschläge bekommen einen Ausgang |
| `src/screens/PoolFormDialog.tsx`, `StatusSettings.tsx`, `TemplatesScreen.tsx`, `TodoFormDialog.tsx` | Längengrenzen aus `@takt/domain` |
| `scripts/proof-foreign.mjs` | Abschnitt 6, die Reihe, Kurzform und Rückgabe in Abschnitt 4; 10 → **14** Prüfungen |
| `scripts/contrast-check.mjs` | letztes Vorkommen „Regel über Tags" (W-13) |
| `design/DESIGNSYSTEM.md` | Tastaturtabelle (Spaltenmenü), Abschnitt 9 Regel 5, Abschnitt 10 (zwei Bausteine), Abschnitt 11 Regeln **13** und **14**, benannte Ausnahme zu Regel 12 |
| `.claude/team/reports/T-133-frontend-dev.md` | dieser Bericht |

**Keine Prüffälle angelegt.** Weder unter `apps/*/test/**` (unit-tester) noch unter `tests/e2e/**`
(e2e-tester). Vorschläge stehen in Abschnitt 9.

---

## 7. Annahmen

1. **O-A ist ein eigener Dialog und nicht ein Feld mehr im Regelformular.** Der Name bleibt
   trotzdem auch dort änderbar. Das ist ein zweiter Bedienweg und berührt Regel 12 des
   Designsystems — sie ist **eingehalten**, weil beide Wege **einen** Zustand teilen (`pool.name`
   aus der Struktur, `PATCH /pools/{poolId}`); es gibt keinen zwischengespeicherten zweiten Wert.
   Als benannte Ausnahme dokumentiert.
2. **Umbenennen gibt es an allen drei Flächen, auf denen eine Regel steht** — nicht nur auf dem
   Board. Eine Fläche mit „Umbenennen" und eine ohne wäre der Befund aus E-059 in neuer Gestalt.
3. **Die Vorabprüfung läuft gegen alle Regeln, nicht gegen die Spalten des Boards**, weil
   `ux_pool_name` über die ganze Tabelle eindeutig ist. Ohne geladene Regelliste wird **nichts**
   behauptet, und das steht sichtbar da.
4. **Die Längengrenzen kommen aus `@takt/domain`.** Das war nicht beauftragt, aber der Dialog
   brauchte eine Zahl, und die neunte handgeschriebene Fassung wäre der Fehler gewesen, den T-128
   gerade behoben hat. Die `512` am Titel ist dabei als Defekt aufgefallen.
5. **Abschnitt 6 misst `unknown`, nicht `any`.** `import.meta.env[...]` ist `any` (Deklaration von
   Vite) und liefert Grundadresse und Sitzungsnachweis — keine Anzeige. Im eigenen Quelltext kommt
   `any` nicht vor. `unknown` ist die Grenze, die **wir** ziehen.
6. **Der Umfang ist größer als „ein Skript".** Wie in T-129 sind die Funde **behoben** und nicht
   nur gemeldet: Ein Wächter, der beim ersten Lauf rot ist, wird abgeschaltet.
7. **Kein neuer Nachweispfad.** Die O-AF-Klasse ist mit einem Durchlauf gemessen worden, den ich
   **nicht** im Baum gelassen habe — Begründung in offener Frage 1.

---

## 8. Risiken

**R1 — Sicherheit, behoben.** Sechs Stellen, an denen ein `U+202E` in einem Feldnamen, einem
Leistungstext oder einem Regelnamen die Anzeige umdrehen konnte, tun das nicht mehr. Die beiden
schwersten liegen **in der Exportvorschau**: die zusammengeführte Leistung einer Tagesgruppe
(`ExportGroups.tsx`) und der Schlüssel jeder Zelle samt JSON-Abzug (`ExportRowPanes.tsx`) — also
genau die Ansichten, an denen ein Benutzer prüft, was er gleich abrechnet.

**R2 — Was Abschnitt 6 nicht sieht, vollständig genannt.**

| Blinder Fleck | Warum |
|---|---|
| `JSON.stringify(row, …)` | Gegenprobe M ist grün. Eine absichtliche Umgehung, die sichtbar im Quelltext steht (T-129 R1). Die Stelle selbst ist behandelt. |
| Formzusicherungen auf die eigene Dienstantwort (`parsed as Partial<ErrorEnvelope>`, `request<T>`) | Sie behaupten die Gestalt aus `api/types.ts` — der Vertrag mit dem lokalen Dienst, keine fremde Eingabe. Das ganze Modul `api/client.ts` steht darauf. |
| `any` aus fremden Deklarationen | siehe Annahme 5 |
| Fertige Sätze aus `@takt/domain` (`poolMovementSentence`) | **O-AN**, unverändert offen, domain-dev |
| Der Bildschirm | E-062, e2e-tester |

**R3 — Die Marke bleibt freiwillig.** `string` ist nach `ForeignText` zuweisbar; sie sagt „hier
**kann** fremder Text stehen", nicht „hier steht garantiert fremder". Für einen Wächter ist das die
richtige Richtung, für eine Garantie zu wenig (unverändert T-129 R2).

**R4 — Verhaltensänderungen, die ein Reviewer sehen soll.** (a) Namensfelder nehmen jetzt bis 200
statt 128/120 Zeichen an, der Titel nur noch 500 statt 512. (b) Die Schaltfläche „Bearbeiten" im
Dialog „Spalten des Boards" heißt „Regel bearbeiten"; daneben steht neu „Umbenennen". (c) Zwei
Zeilenlayouts brechen um. Zeichengenaue e2e-Erwartungen an diese Wortlaute können rot werden — mir
ist keine bekannt, aber `pnpm test:e2e` durfte nicht laufen.

**R5 — `.rule-row`/`.pool-row` sind nicht im Browser nachgemessen.** Der Umbruch ist eine
CSS-Eigenschaft ohne Zustand, aber E-062 verlangt für Flächen die Messung im Browser. Vorschlag an
den e2e-tester in Abschnitt 9.

**R6 — Der Diff ist groß** (19 Dateien), zerfällt aber in vier Sorten: der neue Dialog samt drei
Aufrufstellen (O-A), zwei `catch` (O-AF), sieben Trägertypen mit sechs behobenen Anzeigestellen
(O-AT) und acht ersetzte Zahlen. Lohnendste Stichprobe für den Code-Reviewer:
`scripts/proof-foreign.mjs` Abschnitt 6 und die drei neuen Zeilen in Abschnitt 4;
`screens/PoolRenameDialog.tsx`; `components/ExportGroups.tsx`.

**Hygiene:** eigene Messung über alle 19 berührten Dateien und diesen Bericht — kein rohes Steuer-,
Richtungs- oder unsichtbares Zeichen (`proof:codepoints` 45/0). Keine echte Call-Nummer, kein
Kundenname, keine Zugangsdaten.

---

## 9. Offene Fragen

1. **Soll die O-AF-Klasse einen dauerhaften Wächter bekommen?** Der Durchlauf, mit dem ich sie
   gemessen habe, ist 60 Zeilen und findet zuverlässig jedes `void <Zusage>` ohne Behandlung. Ich
   habe ihn **nicht** eingecheckt, weil er heute **18 von 25** Fundstellen falsch meldet: `void
   mutation.run(…)` und `void (async () => { try … })()` fangen selbst, und das sieht man einer
   Signatur nicht an. Ihn ruhig zu bekommen hieße, „diese Funktion weist nie zurück" statisch
   herzuleiten — rekursiv, über `useAsync.run` und `loadShell` hinweg. Das ist eine eigene Aufgabe
   von der Größe von T-129, keine Zugabe hier. **Ein Wächter, der beim ersten Lauf 18 falsche
   Treffer hat, wird abgeschaltet.** Entscheidung beim Orchestrator; ohne ihn bleibt Regel 13 des
   Designsystems eine Absprache statt einer Messung.
2. **`proof:foreign` hat vier Prüfungen mehr** (10 → 14) und einen sechsten Abschnitt. Der
   `package.json`-Eintrag besteht seit T-129 unverändert — **es ist nichts zu tun**; ich nenne die
   Zahl nur, damit ein Bericht, der „10 bestanden" erwartet, nicht als Regression gelesen wird.
3. **Die `maxLength={64}` an der Call-Nummer** kann die Oberfläche nicht aus der Domäne lesen: Die
   Zahl steht in `apps/local-api/src/routes/todos.ts:52,73` und nirgends sonst. Soll sie zu
   `MAX_TITLE_CHARACTERS` und `MAX_NAME_LENGTH` nach `packages/domain` wandern (domain-dev)? Das
   wäre die vierte Zahl derselben Klasse.
4. **`docs/glossar.md` ist an zwei Stellen vor-E-054.** Der Eintrag „Status, Statusspalte" sagt
   noch „Die Spalte des Kanban-Boards, in der ein Todo gerade steht", und „Pool" kennt die fünf
   Achsen aus E-055 nicht. Ich habe die Begriffe aus dem Code genommen (`POOL_PLACEMENT_SHORT`,
   `RULE_IS_A_RULE`) und keinen neuen erfunden — aber wer das Glossar als Quelle nimmt, findet dort
   den alten Stand. Gehört dem documenter.
5. **Soll der Umbenennen-Dialog auf die Musterseite?** Sie zeigt heute keinen der
   Formulardialoge (`PoolFormDialog`, `TodoFormDialog`); ich habe die Regel nicht einseitig
   geändert. Nach E-062 wäre die Musterseite der Ort, an dem seine fünf Zustände im Browser
   messbar wären.

---

## 10. Nächster Schritt

1. **e2e-tester (Welle P):** Vier Fälle, alle heute nicht gelaufen und alle billig.
   `TP-KANBAN-02 Schritt 1` ist seit T-052 als „nicht gelaufen — Bedienung fehlt" vermerkt und
   **jetzt lauffähig**: Spaltenmenü → „Umbenennen" → Name ändern → Spaltenkopf und Kartenetikett
   „Steht auch in …" tragen den neuen Namen → „Rückgängig" stellt ihn zurück. Dazu: der vergebene
   Name sperrt „Speichern" **vor** dem Klick; das Exportordnerfeld fällt bei einem geworfenen
   Auswahldialog auf das Textfeld zurück (die Hüllen-Nachbildung `shell-shim.ts` aus T-130 kann
   das); und ein Feldname mit `U+202E` in einer Exportvorlage erscheint in der **Vorschau der
   Exportzeile** als `U+FFFD` — die Vorlage muss dafür direkt in die Testdatenbank, weil der Motor
   sie sonst annimmt.
2. **unit-tester:** `foreignTextFrom` ist eine reine Funktion in `lib/**` und gehört damit nach
   E-062 zu Vitest — zwei Zeilen, aber sie sind die Grenze, an der O-AT hängt. Ebenso
   `duplicateFieldNames` und `describeDeviations` (die positionsbasierten `id`).
3. **Code-Reviewer:** Stichprobe aus R6. Die inhaltliche Frage, die ich nicht selbst beantworten
   kann: Ist die benannte Ausnahme zu Designsystem-Regel 12 (zwei Wege zum Namen einer Regel) so
   tragbar, oder soll das Regelformular den Namen beim **Ändern** abgeben und nur beim **Anlegen**
   führen?
4. **Orchestrator:** offene Frage 1 (Wächter für die O-AF-Klasse: ja, nein oder eigene Aufgabe) und
   offene Frage 3 (`callNumber`-Grenze nach `packages/domain`).
5. **spec-ux-reviewer (O-Q):** `apps/web` steht jetzt still; die 14 Befunde aus T-025 lassen sich
   dagegen messen.
