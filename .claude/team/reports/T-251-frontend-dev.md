# T-251 — Welle 2 der Umstrukturierung: `features/todos`, `features/tags/api.ts`

Aufgabe: T-251 — `features/tags/api.ts` nachholen und `features/todos` bauen
Status: **braucht Review** — beide Teile stehen, alle Läufe grün **bis auf einen fest
verdrahteten Stichprobennamen in `proof:callers`**, der in `apps/local-api/**` liegt und damit
außerhalb meiner Hoheit (Abschnitt „Der eine rote Lauf")

---

## 1  Artefakte

### Neu

| Datei | Zeilen | Was |
|---|---|---|
| `apps/web/src/features/tags/api.ts` | 89 | die neun Tag-/Ordner-Routen |
| `apps/web/src/features/todos/api.ts` | 464 | dreizehn Routen **und** dreizehn feature-eigene Typen |
| `apps/web/src/features/todos/TodoDoneSwitch.tsx` | 118 | „Erledigt" setzen/aufheben samt Rückweg |
| `apps/web/src/features/todos/TodoNoteCard.tsx` | 89 | der interne Vermerk |
| `apps/web/src/features/todos/TodoDetailAside.tsx` | 164 | die Nebenspalte von S-03 |
| `apps/web/src/features/todos/todoDayGroups.ts` | 48 | `DayGroup` + `groupByDay`, ohne React |
| `apps/web/src/features/todos/AttachmentRow.tsx` | 178 | Flächen C, D, E der Anhänge |
| `apps/web/src/features/todos/AttachmentFormDialog.tsx` | 226 | Fläche B der Anhänge |
| `docs/decisions/todos.md` | 90 | die Vorgeschichte, die aus dem Quelltext wanderte |

**Genau acht neue Quelldateien** — die Zahl taucht unten in drei voneinander unabhängigen
Zählern wieder auf.

### Verschoben (`git mv`, Inhalt unverändert außer Importzeilen)

Nach `features/todos/`: `screens/TodoListScreen.tsx`, `screens/TodoDetailScreen.tsx`,
`screens/TodoFormDialog.tsx`, `components/TodoRow.tsx`, `components/TodoListFilters.tsx`,
`components/Attachments.tsx`, `components/AttachmentOpenDialog.tsx`, `lib/attachmentLabel.ts`,
`app/undoDone.ts`.

Nach `shared/ui/`: `components/Icon.tsx`, `components/Foreign.tsx`, `components/NoteField.tsx`,
`components/DoneFlag.tsx`, `components/DeadlineFlag.tsx`.

### Angefaßt, aber nur die Importzeile

54 weitere Dateien unter `apps/web/src/**`. Dazu **eine Datei außerhalb der üblichen Hoheit**:
`apps/web/test/app/undoDone.test.ts` — siehe Abschnitt 7.

---

## 2  Die Zuordnungen, selbst gemessen — und drei Korrekturen an der Auftragsliste

Die Liste im Auftrag war „nach Dateinamen geraten". Gemessen wurde über die tatsächlichen
Importe. Drei Einträge stimmen nicht:

1. **`lib/pathInspection.ts` gehört nicht zu `todos`.** Seine einzigen zwei Benutzer sind
   `lib/databaseLocationAdvice.ts` und `lib/exportDirectoryAdvice.ts` — Datenbankpfad und
   Exportordner. Kein Todo, kein Anhang. **Bleibt in `lib/`.**
2. **`lib/deadline.ts` gehört nicht zu `todos`.** Zwei Benutzer: `app/useToday.ts`
   (`todayForDueDates`, `nextMidnightMs`) und `DeadlineFlag` (`deadlineState`). Der erste ist
   app-weite Infrastruktur — der eine Zeitgeber auf die nächste Mitternacht (E-073 Punkt 2).
   **Bleibt in `lib/`.**
3. **Die Status-Routen eines Todos gehören nicht in diese Welle.** `listTodoStatuses`,
   `createTodoStatus`, `updateTodoStatus`, `deleteTodoStatus`, `reorderTodoStatuses` haben
   genau einen Bedienort: `screens/StatusSettings.tsx`. Der zieht in dieser Welle nicht um,
   also ziehen seine Routen nicht mit. Sie stehen weiter in `api/endpoints.ts`.

---

## 3  Wo `shared/ui/` aufhört — die Schnittregel, an der ich beides entschieden habe

Der Auftrag sagt: „`shared` darf kein Sammelordner werden … nimm nur hinein, was ein zweiter
Benutzer wirklich braucht, und nenn ihn". Ein zweiter Benutzer allein reicht mir dafür nicht —
`features/tags/TagInput.tsx` hat vier und blieb in Welle 1 trotzdem im Merkmal. Die Regel, die
**beide** Wellen deckt und die ich hiermit ausschreibe:

> **Ein Baustein in `shared/ui/` nimmt Werte entgegen. Ein Baustein eines Merkmals nimmt die
> Sache des Merkmals entgegen.**

- `TagChip({ label, path })` — ein Name und ein Pfad. Kennt kein Tag. → `shared/ui` (Welle 1) ✓
- `DoneFlag({ state })` — ein Wert aus drei. Kennt kein Todo. → `shared/ui`
- `DeadlineFlag({ dueDate, today })` — zwei Kalendertage. → `shared/ui`
- `NoteField({ scope, value, onChange, … })` — ein Textfeld. → `shared/ui`
- `Icon`, `Foreign` — die zwei Grundbausteine schlechthin. → `shared/ui`
- `TodoRow({ todo, … })` — nimmt ein `Todo`. → `features/todos`
- `TagInput` — liest den Tag-Baum aus `StructureContext`. → `features/tags` (Welle 1) ✓

**Die zweiten Benutzer, namentlich** (der Auftrag verlangt sie):

| Baustein | zweiter Benutzer außerhalb `todos` |
|---|---|
| `NoteField` | `app/TimerContext.tsx` (Leistungsabfrage beim Stopp), `screens/BookingDialogs.tsx` |
| `DoneFlag` | `screens/TimeScreen.tsx`, `screens/DashboardScreen.tsx`, `showcase/TimeSection.tsx` |
| `DeadlineFlag` | `components/Kanban.tsx` (die Karte), `showcase/DeadlineSection.tsx` |
| `Icon` | 47 Dateien |
| `Foreign` | 30 Dateien |

`shared/ui/` hat damit **sechs** Dateien. Es ist kein Sammelordner, sondern die Grundmenge:
zwei Grundbausteine, drei Marken, ein Feld.

**Die beiden Übergangswarzen aus Welle 1 sind weg.** `shared/ui/Tag.tsx` importiert jetzt
`./Foreign` und `./Icon` als Geschwister; `TodoListFilters.tsx` liegt in `features/todos/` und
importiert `../tags/TagInput` — Merkmal zu Merkmal statt `components → features`.

---

## 4  Die Schnitte in den beiden großen Dateien — und die, gegen die ich mich entschieden habe

### `TodoDetailScreen.tsx`: 722 → 457, vier Verantwortlichkeiten heraus

Vollständig gelesen, dann benannt, dann geschnitten:

1. **„Erledigt" umlegen** → `TodoDoneSwitch.tsx` (118). Der Schalter, `toggleDone`, `flagState`,
   der Bewegungssatz und der Rückweg. Niemand sonst in der Ansicht liest `flagState`; niemand
   sonst ruft `markTodoDone`/`clearTodoDone`. **Eine Eigenschaft: das Todo.** `bump()` holt der
   Baustein aus demselben `RefreshContext` wie der Screen — eine Eigenschaft, die eine
   Kontextfunktion durchreicht, wäre ein zweiter Weg zu derselben Sache.
2. **Der Vermerk** → `TodoNoteCard.tsx` (89). Eigener Entwurf (`noteDraft`), eigene Mutation,
   eigener Aufruf (`putTodoNote`). Drei Eigenschaften. Der gespeicherte Stand kommt herein und
   geht über `onSaved` zurück, damit die Ansicht weiterhin **eine** Fassung der Antwort hält.
3. **Die Nebenspalte** → `TodoDetailAside.tsx` (164). Vier Karten — Frist, erfaßte Zeit, Tags,
   Herkunft —, die alle nur **zeigen**. Kein Zustand, kein Aufruf an den Dienst.
4. **Die Tagesgruppen** → `todoDayGroups.ts` (48). `DayGroup` und `groupByDay`, reine Funktion
   ohne React. Dieselbe Bauart wie `treeData.ts` aus Welle 1.

**Gegen diese Trennung habe ich mich entschieden, und das ist die eigentliche Information:**

- **Die Buchungskarte samt Zeilenmenü und den fünf Buchungsdialogen** — der größte verbliebene
  Block (~180 Zeilen). Sie hängt an sechs Zuständen (`bookingOpen`, `editingEntry`, `resetEntry`,
  `historyEntry`, `notBilledEntry`, `pendingDelete`), und **einer davon wird von der Kopfzeile
  aus geöffnet**: „Zeit von Hand" setzt `editingEntry`/`bookingOpen`. Ein eigener Baustein
  hieße entweder fünf bis sechs Rückrufe durchreichen oder den Zustand über zwei Dateien
  verteilen — oder eine `ref`-Handhabe für einen Knopf. Alle drei sind teurer als die 180
  Zeilen. Eine ehrliche 457er ist besser als drei künstliche à 150.
- **Die Anhangskarte.** Sie ist bereits ein Aufruf: `<Attachments todoId … />`. Ein Baustein
  drumherum wäre eine Hülle um eine Hülle.

Was übrigbleibt, ist genau das, was ein Screen sein soll: Daten laden, Kopfzeile, Layout,
Buchungsliste, Dialoge.

### `Attachments.tsx`: 721 → 353, zwei Verantwortlichkeiten heraus

Die Datei war intern längst nach „Fläche A bis E" geordnet; der Schnitt folgt ihren eigenen
Bannern:

- **Fläche B** (Hinzufügen, 199 Zeilen) → `AttachmentFormDialog.tsx`. Geschlossener Vorgang:
  eigener Zustand, eigene Prüfung, ein Aufruf, eine Rückmeldung.
- **Flächen C, D, E** (Zeile, Vorschaubild, Absagegrund, 155 Zeilen) → `AttachmentRow.tsx`. Sie
  sind **dieselbe Zeile** und lassen sich nicht sinnvoll voneinander trennen.

**Gegen diese Trennung entschieden:** `REFUSAL_TEXT`, `foreseenRefusalText` und `refusalText`
(~70 Zeilen) bleiben in `Attachments.tsx`. Sie haben genau einen Leser. Eine eigene Datei aus
einer Tabelle und zwei Funktionen ohne zweiten Leser ist die Sorte Abstraktion, die der Auftrag
ausschließt — und `attachmentLabel.ts`, der naheliegende Nachbar, dürfte dafür `app/connection`
importieren, was er heute bewußt nicht tut.

---

## 5  Die feature-eigenen Typen: gemessen, nicht geraten

**`features/tags/api.ts` bekommt keinen Typ.** Nachgemessen: `Tag`, `TagFolder`, `TagFolderNode`
und `TagTree` werden von `app/StructureContext.tsx`, `lib/folderPaths.ts` und untereinander
innerhalb von `api/types.ts` gebraucht (`TagFolderNode.folder: TagFolder`). Was mehrere Merkmale
teilen, bleibt in `api/`. Die Messung aus Welle 1 hält.

**`features/todos/api.ts` bekommt dreizehn.** Jeder hat außerhalb des Merkmals (und außerhalb
von `api/endpoints.ts`) keinen Leser: `TodoDoneResult`, `TodoDetail`, `TodoNote`, `TodoCreate`,
`TodoUpdate`, `TodoFilter`, `TodoCreated`, `DueSortDirection`, `DueState`, `AttachmentKind`,
`Attachment`, `AttachmentCreate`, `AttachmentImage`.

**`Todo` selbst bleibt in `api/types.ts`** — Suche, Board, Export, Timer und Zeiterfassung lesen
es. Es ist der klarste Fall von „geteilt".

---

## 6  Der eine rote Lauf — und warum er nichts über den Bestand sagt

```
apps/local-api/scripts/proof-callers.mjs:726
  typeIndex.size > 30 && typeIndex.has('TodoCreate') && typeIndex.has('PoolWrite'),
```

`typeIndex` wird aus **`api/types.ts` allein** gebaut. `TodoCreate` steht seit dieser Aufgabe in
`features/todos/api.ts`. Der Stichprobenname zeigt ins Leere, und `proof:callers` steht bei
**58 bestanden, 1 fehlgeschlagen**.

**Der Lauf mißt trotzdem richtig, und das ist nachweisbar:**

```
ok  die Aufrufdateien der Oberfläche sind gesucht und gefunden (3):
    api/endpoints.ts, features/tags/api.ts, features/todos/api.ts
ok  Platte und Sammler sehen dieselben Aufrufdateien der Merkmalsordner (2 zu 2)
ok  so viele Aufrufe gelesen wie im Rohtext stehen (75)
ok  `request` steht nur in api/client.ts, wo es entsteht, und in den 3 gemessenen Aufrufdateien
ok  eine erfundene `features/erfunden/api.ts` — der Name allein erlaubt nichts wird gefunden
```

Der von domain-dev gebaute Leser vereinigt `types.ts` mit den Typen der jeweiligen Aufrufdatei
(`webCallerOf`), deshalb sind die Abschnitte 2 bis 5 grün: 75 Aufrufe gelesen, jede Operation hat
ihren Aufrufer, kein unbekannter Schlüssel, keine blinde Stelle. **Nur diese eine Zeile weiß
noch nichts vom Umbau.**

**Was ich nicht getan habe.** `apps/local-api/**` steht ausdrücklich auf der Nicht-anfassen-Liste
des Auftrags. Ich habe auch **nicht** `TodoCreate` in `api/types.ts` zurückgelassen, um am
Wächter vorbeizukommen — das wäre genau das Ausweichen, das F-22 verworfen hat, nur mit einem
Typ statt mit einem Namen.

**Vorschlag an den Orchestrator (Auftrag an domain-dev, eine Zeile):** Die Zusage lautet „die
Typaufstellung ist gelesen". Sie sollte gegen die Aufstellung geprüft werden, die der Leser
tatsächlich benutzt — die Vereinigung aus `webCallerOf` —, nicht gegen `types.ts` allein. Der
billige Ersatz wäre ein Name, der dauerhaft in `api/types.ts` bleibt (`PoolWrite` steht schon
da; `TimeEntryFilter` oder `AppSettingsUpdate` wären ein zweiter). Der richtige ist der erste:
sonst kommt derselbe Befund in Welle 3 mit `PoolWrite` zurück.

---

## 7  Die Grenzüberschreitung, die ich melde: eine Prüfdatei

`apps/web/test/app/undoDone.test.ts` verlangt drei Dinge, die diese Aufgabe verschiebt:
`vi.mock("../../src/api/endpoints.ts")` auf `clearTodoDone`, den Pfad `src/app/undoDone.ts` und
`TodoDoneResult` aus `src/api/types.ts`. Ohne Nachziehen wäre `test:coverage` rot.

Ich habe **ausschließlich die vier Importangaben und die Pfadangabe im Dateikopf** geändert.
Keine Zusicherung, kein Testfall, keine Zeile Logik. Der Auftrag gibt mir `apps/web/**` und
nimmt `tests/e2e/**` ausdrücklich davon aus, `apps/web/test/**` aber nicht — nach der Tabelle in
`CLAUDE.md` gehört sie trotzdem dem unit-tester. **Ich melde es und bitte um seine Bestätigung.**

---

## 8  Zahlen — vorher gemessen, nicht zitiert

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | grün |
| `pnpm boundaries` | 417 Quelldateien außerhalb der Domäne | **425** (+8) |
| `pnpm contrast` | 261 Paare, 0 von 522 durchgefallen, 83/83 Farbtoken, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **132** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen, 1 Übergangsstelle mit 6 Aufrufen | 21/0 — **140**, sonst zeichengleich |
| `pnpm run proof:surface` | 27/0 — **132** Quelldateien, 2 Einstiegsseiten, 7 Stilblätter, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **140**, sonst zeichengleich |
| `pnpm run proof:callers` | 59/0 | **58/1** (Abschnitt 6) |
| `pnpm test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `apps/web` `pnpm build` | grün | grün, `TodoDetailScreen` 27,02 kB als **ein** Stück |

**Die einzige Zahl, die sich bewegt hat, ist dieselbe in drei unabhängigen Zählern: +8.** Genau
die acht neuen Quelldateien aus Abschnitt 1. `boundaries` zählt sie über den Modulgraphen,
`proof:foreign` über den TypeScript-Übersetzer, `proof:surface` über den eigenen Sammler — drei
Wege, dieselbe Acht. **Jede andere gemessene Zahl ist zeichengleich**, insbesondere 174 behandelte
Übergaben und 29 Eingabefelder in `proof:foreign` sowie 29 benannte Live-Regionen in
`proof:surface`: der Nachweis, daß über dieselbe Oberfläche geurteilt wurde.

**Die übrigen Nachweise, einzeln gefahren** (`proof:all` bricht bei `proof:callers` ab):
`codepoints` 46/0, `openapi` 115/0, `conflicts` 154/0, `tags` 45/0, `access` 109/0, `export`
98/0, `export-api` 72/0, `taskpane` 29/0, `addin-wiring` 32/0, `route-policy` 44/0,
`release-safety` 32/0, `shell-surface` 7 Prüfungen + 54 Gegenproben, `template-fields` 30/0,
`db-permissions` übersprungen (Windows, POSIX-Modus sagt dort nichts), `addin` 248/0.

### Gegenprobe, daß nichts verlorenging

Wie in Welle 1 **zeilenweise gegen `git show HEAD:…`**, über alle fünf aufgeteilten Dateien:

- **`features/tags/api.ts`** gegen `endpoints.ts:318–377`: `diff` sagt **IDENTISCH**. Null
  Unterschied.
- **`features/todos/api.ts`** gegen `types.ts:272–491`, `types.ts:1461–1480` und
  `endpoints.ts:102–267`: die einzigen Unterschiede sind zwei Leerzeilen und ein von mir
  eingefügtes Abschnittsbanner. **Keine Inhaltszeile geändert.**
- **`TodoDetailScreen.tsx` + die vier Teile** gegen den Stand von HEAD, Zeilenmengen verglichen:
  Verschwunden sind ausschließlich Einfuhrnamen, `interface DayGroup` → `export interface`,
  `function groupByDay` → `export function` und **acht Bindungsnamen**, deren Wert unverändert
  hereingereicht wird: `value.todo.totalSeconds` → `totalSeconds`, `value.previewProblem` →
  `previewProblem`, `value.totalQuarters` → `totalQuarters`, `value.note.text` → `note.text`,
  `value.note.updatedAt` → `note.updatedAt`, `setEditOpen(true)` → `onEdit()`,
  `detail.replace(…)` → `onSaved(…)`. **Kein Ausdruck geändert.**
- **`Attachments.tsx` + die zwei Teile**: verschwunden sind Einfuhrnamen, ein Abschnittsbanner
  („Fläche B", drei Zeilen, ersetzt durch den Kopfkommentar der neuen Datei) und zwei
  `function` → `export function`. **Keine Inhaltszeile verloren.**

### E2E — einzeln über `tests/e2e/playwright.config.ts`

| Dateien | Ergebnis |
|---|---|
| `attachment-crud`, `attachment-dangerous-input`, `attachment-open-commands`, `attachment-legacy-todo-regression` | **17 bestanden** |
| `todo-filter-layout`, `todo-revival`, `deadline-computed-state`, `deadline-lifecycle`, `done-movement-announcement`, `midnight-redraw`, `note-separation` | **21 bestanden** |
| `form-dialog-submit-guard`, `focus-return-after-dialog`, `field-live-region-announcement`, `foreign-title-display`, `attachment-export-and-addin-exclusion`, `kanban` | 19 bestanden, **1 rot: `kanban.spec.ts:288` TP-KANBAN-04** |
| `tags-folders`, `tag-folder-rule-lock`, `web-build-smoke`, `timer-stop-announcement`, `pool-movement-sentence`, `manual-booking-movement` | 17 bestanden, **3 rot: die drei orphan-Fälle in `timer-stop-announcement.spec.ts`** |
| `idle-recovery`, `export-end-to-end`, `export-audit-and-locks`, `export-mixed-status-and-billing`, `calendar-day-boundary` | **12 bestanden** |
| `playwright.attachment-persistence.config.ts` (ganz) | **2 bestanden** |

**Die vier roten sind genau die vier benannten offenen aus T-249** (dortiger Abschnitt 4:
TP-KANBAN-04 und die drei orphan-Fälle). **TP-KANBAN-04 habe ich gemessen statt behauptet:** mit
`git stash` auf den Stand **vor** meiner Änderung fällt er mit derselben Zusicherung
(`not.toHaveClass(/kcard--running/)`, erhalten `"kcard kcard--running kcard--reactivated"`) und
derselben Zeile. Danach `git stash pop`, Typecheck grün, alle Dateien zurück.

Ein Einzelflattern: `deadline-lifecycle.spec.ts:156` fiel in **einem** Lauf in Kombination mit
zwei anderen Dateien um und lief in **zwei** anschließenden Läufen — allein und in derselben
Kombination — durch. Ich melde es als Beobachtung, nicht als Befund; es riecht nach derselben
Isolierungsfrage, die T-249 unter „orphan-Isolierung" führt.

---

## 9  Kommentare — was wanderte, was blieb, was ich stehengelassen habe

Nach demselben mechanischen Kriterium wie in Welle 1: Rückblick, der mit „Bis …" oder „Vor …"
beginnt und heute nichts mehr anweist, geht nach `docs/decisions/todos.md`. **Sechs Blöcke:**

| Woher | Was |
|---|---|
| `api.ts`, `markTodoDone` | „Bis dahin stand hier: ‚Was diese Antwort **nicht** enthält …' … Lücke O-U" |
| `api.ts`, `clearTodoDone` | „Bis T-094 stand hier ‚Verschiebt keine Karte.'" |
| `undoDone.ts` | „Bis T-118 bot **nur** die Liste einen Rückweg an …" |
| `TodoListScreen.tsx` | „Bis dahin gab es diesen Filter zwar in der Abfrage, aber **kein Bedienelement** …" |
| `TodoDetailScreen.tsx` | „Bis T-045 verschwand ihr Fehlschlag stumm …" |
| `attachmentLabel.ts` | „Bis T-156 stand `attachmentLabel` zweimal im Baum …" |

Die **Regel** aus jedem Block steht weiter im Quelltext, nur ohne die Vorgeschichte: „die
Oberfläche rechnet nichts nach, sie liest", „eine Spalte, die nach ‚Erledigt' fragt, verliert
oder gewinnt das Todo mit dieser Handlung", „ein stummer Fehlschlag hätte weder Meldung noch
Etikett noch Protokolleintrag", „die Adresse bringt genau **ein** Tag mit", „ihr Fehlschlag darf
nicht stumm sein", „wer die Beschriftung ändern will, ändert sie **dort**". Jede betroffene
Datei trägt „Vorgeschichte: `docs/decisions/todos.md`."

**Stehengelassen, mit Begründung** — jeder dieser vier beginnt zwar mit „Bis T-167" bzw. „stand
hier", **ist aber der Grund, warum der heutige Code überrascht**, und fiele sonst als Zusage ohne
Begründung an:

1. `attachmentLabel.ts`, `foreseeableRefusalOf`: „Bis T-167 zeigte die Rückfrage für eine
   `rechnung.lnk` die milde Fassung …" — ohne ihn steht „**Das ist keine Grenze**, sondern die
   Reihenfolge der Auskunft" ohne Grund da.
2. `AttachmentOpenDialog.tsx`, zwei Blöcke (X-05 und V-07): sie erklären, warum es ein drittes
   Beschriftungspaar und einen dritten Dialogzustand gibt.
3. `AttachmentFormDialog.tsx`: „`touched` entstand bis T-167 an genau **einer** Stelle" —
   erklärt eine Überraschung im heutigen Code.
4. `TodoFormDialog.tsx`: „Der Unterschied zwischen Status und Kanban-Spalte stand hier bei
   **jedem** Öffnen des Dialogs" — der Block ist sonst durchgehend Regel; zwei Sätze
   herauszuschneiden kostet mehr, als es bringt.

**Und die zwei Fragen aus Welle 1 sind weiterhin offen** (E-078 Punkt 3): der `consequence`-Block
in `TagAdministration.tsx` und „(Befund O-DZ, T-167.)". Ich habe sie erneut nicht angefaßt.

### Zwei Dokumentationsverweise, die ich reparieren mußte

Zwei `{@link}` zeigten nach dem Umzug ins Leere und wurden zu einem Verweis mit Dateinamen
umgeschrieben — Wortlaut sonst unverändert:

- `api/types.ts`, `CreateTimeEntryResult`: „Flach wie {@link TodoDoneResult}" →
  „Flach wie `TodoDoneResult` (`features/todos/api.ts`)".
- `features/todos/Attachments.tsx`, Fläche D: „({@link AttachmentPreview})" →
  „(`AttachmentPreview` in `AttachmentRow.tsx`)".

Sieben weitere Pfadangaben in Kommentaren unter `apps/web/src/**` sind mitgezogen
(`components/Foreign.tsx` → `shared/ui/Foreign.tsx` usw.).

---

## 10  Annahmen

1. **`screens/parts.tsx` und `screens/BookingDialogs.tsx` bleiben, wo sie sind.**
   `features/todos/` greift mit `../../screens/…` darauf zurück — dieselbe Übergangsform wie in
   Welle 1 und dieselbe offene Frage (unten).
2. **Die Showcase-Seite darf in Merkmale greifen.** `showcase/DeadlineSection.tsx` importiert
   jetzt aus `features/todos/`. Sie ist eine Musterseite, kein Merkmal; Präzedenz ist
   `showcase/data.ts` → `features/tags/` aus Welle 1.
3. **`Pagination` bleibt in `api/endpoints.ts`** und wird von `features/todos/api.ts` als Typ
   importiert. Es ist die Seitenform aller Listenrouten, nicht die von `todos`.
4. **Die Screens behalten ihre Namen** (`TodoListScreen.tsx`, nicht `List.tsx`) — wie
   `features/tags/TagsScreen.tsx` in Welle 1.
5. `todoDayGroups.ts` heißt nicht `dayGroups.ts`: `app/dayGroup.ts` gibt es bereits und macht
   etwas anderes (`previewOpenEntries`, mit Aufruf an den Dienst).

---

## 11  Risiken

- **`proof:callers` ist rot** (Abschnitt 6). Solange er es ist, ist `pnpm check` rot, und
  `proof:all` bricht an vierter Stelle ab — die fünfzehn Nachweise dahinter laufen im Tor nicht
  mit. Ich habe sie deshalb **einzeln** gefahren und oben aufgeführt; das ersetzt das Tor nicht.
- **Zeilennummern in Papieren zeigen ins Leere** — dieselbe Klasse wie in Welle 1, jetzt
  breiter. Gemessen, nicht angefaßt (fremde Hoheit):
  - `docs/bedrohungsmodell.md` — `apps/web/src/components/Foreign.tsx` (`:3712`),
    `components/AttachmentOpenDialog.tsx` (`:5050`), `lib/attachmentLabel.ts`
    (`:5246`, `:5428`, `:5501`, `:6021` mit Zeilenangabe `:270-274`),
    `components/NoteField.tsx` (`:7264`), `components/Attachments.tsx:82` (`:9607`)
  - `docs/design/textbestand.md` — `app/undoDone.ts` (`:303`, `:1266`),
    `lib/attachmentLabel.ts` (`:313`), `components/NoteField.tsx` (`:3017`),
    `components/Icon.tsx` (`:3068`)
  - `docs/design/traeger-und-zusage.md` — `components/NoteField.tsx` (`:8`, `:315`, `:316`, `:782`)
  - `tests/e2e/done-movement-announcement.spec.ts:11` — `screens/TodoDetailScreen.tsx`
  - `tests/e2e/support/bidi.ts:8` — `components/Foreign.tsx`
  - `.claude/team/board.md:139` und `CLAUDE.md` — `apps/web/src/components/Attachments.tsx:82`
    (im Abschnitt zum offenen A-19.19-Widerspruch; **die Datei liegt jetzt in
    `features/todos/`, die Zeilennummer ist eine andere, die Aussage steht unverändert dort**)
- **Keine Sicherheitsfläche berührt.** Kein neues `fetch`, kein neuer `request`-Ort außer der
  gemessenen `features/todos/api.ts`, keine Adresse, kein Öffnen-Befehl, keine CSP.
  `proof:release-safety`, `proof:route-policy` und `proof:shell-surface` unverändert grün. Die
  Anhangsfläche ist **verschoben und aufgeteilt, nicht verändert**: die Absagetexte, die
  Vorabprüfung `foreseeableRefusalOf` und die Rückfrage vor dem Öffnen stehen zeichengleich.
- **Der A-19.19-Widerspruch ist nicht berührt.** Ich habe an der Add-in-Fläche nichts gebaut,
  weder aus- noch zurück. Der Satz in `Attachments.tsx`, der die Abwesenheit behauptet, steht
  unverändert — jetzt unter neuem Pfad.

---

## 12  Offene Fragen

1. **Die eine Zeile in `proof:callers`** (Abschnitt 6) — Auftrag an domain-dev, **vor** Welle 3.
   Ohne sie ist das Tor rot.
2. **`apps/web/test/app/undoDone.test.ts`** (Abschnitt 7) — Bestätigung des unit-testers, daß
   das Nachziehen von vier Importpfaden in Ordnung war. Für Welle 3 wäre eine Regel gut: Zieht
   ein Modul um, zieht der unit-tester im selben Auftrag die Prüfdatei nach, oder darf
   frontend-dev die Importzeile fassen?
3. **`screens/parts.tsx`** (`AsyncBoundary`, `ScreenHeader`, `StatTile`) — dieselbe Frage wie in
   Welle 1, jetzt mit zwei Merkmalsordnern, die zurückgreifen. Nach der Schnittregel aus
   Abschnitt 3 gehört es nach `shared/ui/`: `ScreenHeader({ title, lead, actions })` nimmt Werte.
   Soll Welle 3 es mitnehmen?
4. **Wohin `screens/BookingDialogs.tsx`?** Es wird von `features/todos/TodoDetailScreen.tsx`,
   `screens/BookingsScreen.tsx` und `screens/TimeScreen.tsx` benutzt. Nach dem Muster wäre es
   `features/time/` — das ist die nächste natürliche Welle und würde `TimeScreen`,
   `BookingsScreen`, `BookingTable`, `Timer`, `IdleRecovery`, `IdleTaskSelect` mitnehmen.
5. **`visual-qa` habe ich nicht gefahren** — die Rolle steht mir in dieser Sitzung nicht als
   Werkzeug zur Verfügung. Ersatzweise gemessen: der Bau ist grün, `proof:surface` zählt
   dieselben 29 Live-Regionen und dasselbe Raster, `contrast` ist zeichengleich, und die
   gerenderten Todo- und Anhangsflächen werden von **88 bestandenen E2E-Zusicherungen** bedient.
   Es gibt keine Änderung an CSS, an Klassennamen oder an JSX-Text. Ein Abnahmeblick bleibt
   offen.

---

## 13  Nächster Schritt

`proof:callers` Zeile 726 an domain-dev geben (eine Zeile), dann Welle 3. Für Welle 3 schlage ich
**`features/time`** vor und nicht `export`: `TimeScreen` (?), `BookingsScreen`, `BookingDialogs`,
`BookingTable`, `Timer`, `IdleRecovery`, `IdleTaskSelect`, `app/dayGroup.ts` und die
Zeit-/Timer-Routen hängen eng zusammen, und der Umzug löst den letzten Rückgriff von
`features/todos/` in `screens/` (`BookingDialogs`) auf. `ExportScreen` (1338 Zeilen) bleibt der
schwerste Fall und sollte laufen, wenn das Muster dreimal getragen hat — dann ist auch
`api/endpoints.ts` klein genug, daß der Rest in einem Zug gehen kann.
