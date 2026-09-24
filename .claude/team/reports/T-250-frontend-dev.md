# T-250 — Welle 1 der Umstrukturierung: `features/tags`

Aufgabe: T-250 — `apps/web/src` featureweise organisieren, beginnend mit dem kleinsten Feature
Status: teilweise — der Umzug der Oberfläche steht, **die API-Aufrufe sind nicht mitgezogen**
(gemessener Grund unten, F-22)

## Artefakte

Neu:

- `apps/web/src/features/tags/TagsScreen.tsx` (43)
- `apps/web/src/features/tags/TagAdministration.tsx` (519)
- `apps/web/src/features/tags/PoolAdministration.tsx` (266)
- `apps/web/src/features/tags/TagTree.tsx` (534, verschoben)
- `apps/web/src/features/tags/TagInput.tsx` (495, verschoben)
- `apps/web/src/features/tags/treeData.ts` (101)
- `apps/web/src/shared/ui/Tag.tsx` (204, verschoben)
- `docs/decisions/tags.md`

Gelöscht (verschoben): `apps/web/src/screens/TagsScreen.tsx`, `apps/web/src/components/Tag.tsx`,
`apps/web/src/components/TagTree.tsx`, `apps/web/src/components/TagInput.tsx`.

Importe nachgezogen in: `app/App.tsx`, `components/Kanban.tsx`, `components/RuleSummary.tsx`,
`components/TodoRow.tsx`, `components/TodoListFilters.tsx`, `screens/DashboardScreen.tsx`,
`screens/PoolFormDialog.tsx`, `screens/SettingsScreen.tsx`, `screens/TodoDetailScreen.tsx`,
`screens/TodoFormDialog.tsx`, `showcase/TagsSection.tsx`, `showcase/data.ts`.

## Die erkannten Verantwortlichkeiten in `TagsScreen.tsx` (910 Zeilen)

Vollständig gelesen, dann benannt, dann geschnitten:

1. **Rahmen** — Kopfzeile, Ladehülle, Zweispalter (30 Zeilen). → `TagsScreen.tsx`, 43 Zeilen,
   ausschließlich UI-Komposition. Das ist der Einstiegspunkt, den `App.tsx` faul lädt.
2. **Tags und Ordner** — Baum, Auswahl, vier Namensdialoge, Löschbestätigung, Ziehen (477).
   → `TagAdministration.tsx`.
3. **Regeln/Pools** — Liste, Anzeigeort, Umbenennen, Löschen (232). → `PoolAdministration.tsx`.
4. **Baumumwandlung** — `toTreeNodes`, `countTags`, `findSelection`, `folderName`, `pathOf`
   und der Typ `Selection` (70). Reine Funktionen, kein React. → `treeData.ts`.

**Gegen deren Trennung ich mich entschieden habe:**

- **Die vier Dialoge in `TagAdministration`.** Sie teilen sich `name`, `nameTouched`,
  `mutation`, `currentFolderId`, `after()` und `beginNaming()`. Eine eigene Datei je Dialog
  hieße zehn Eigenschaften durchreichen und den Grund, warum `nameError` beim **Verlassen**
  entsteht, in vier Dateien verteilen. 519 Zeilen mit einem Thema sind ehrlicher als vier
  Dateien mit einem geteilten Zustand.
- **`TagTree.tsx` (534) und `TagInput.tsx` (495).** Beide sind je **ein** Baustein mit **einem**
  Verhalten; die Länge kommt aus Tastaturbedienung und Ziehen beziehungsweise aus der
  Vorschlagslogik. Ein Schnitt hier zerteilte einen Zustandsautomaten.
- **`PoolAdministration` nach `features/structure`.** Wäre fachlich richtig — es ist nicht
  „tags" —, aber `PoolFormDialog.tsx` (820) und `PoolRenameDialog.tsx` (339) liegen noch in
  `screens/` und gehören in dieselbe Bewegung. Als eigene Datei in `features/tags/` liegt es
  jetzt so, daß die Pool-Welle es in einem Zug mitnehmen kann.

## Wo `Tag.tsx` gelandet ist — und wer der zweite Benutzer ist

`shared/ui/Tag.tsx`. Gemessen, nicht geschätzt: `TagChip`/`TagPath` werden von **sieben**
Dateien aus **fünf** Bereichen benutzt — `components/Kanban.tsx`, `components/RuleSummary.tsx`,
`components/TodoRow.tsx`, `screens/DashboardScreen.tsx`, `screens/TodoDetailScreen.tsx`,
`features/tags/TagAdministration.tsx`, `features/tags/TagInput.tsx` (dazu `showcase/`). Der
nächste Benutzer nach `tags` ist **`TodoRow`/`TodoDetailScreen`**, also `todos`; danach `board`
über `Kanban`.

Die Datei paßt auch nach Bauart hinein: sie hängt nur an `cx`, `foreign`, `Foreign` und `Icon` —
kein Kontext, keine Domäne, keine API. Sie ist eine Darstellung.

**`TagInput.tsx` habe ich bewußt *nicht* nach `shared/ui/` gelegt**, obwohl es ebenfalls breit
benutzt wird (`TodoFormDialog`, `SettingsScreen`, `PoolFormDialog`, `TodoListFilters`). Es hängt
an `StructureContext`, an `tagNameKey`/`normalizeTagName` aus `@takt/domain` und an
`href("tags")` — das ist Fachlogik des Merkmals „Tags", kein UI-Baustein. Andere Merkmale
benutzen das Merkmal `tags`; das ist etwas anderes, als es zu teilen. Sonst wäre `shared/ui/`
genau der Sammelordner, den der Auftraggeber ausgeschlossen hat.

## Die API-Aufrufe: **nicht** verschoben, und warum

`proof:callers` Abschnitt 1 mißt eine Zusage, die ich nicht brechen darf und nicht ändern kann —
der Lauf liegt in `apps/local-api/scripts/`, nicht in meiner Hoheit:

```
const WEB_REQUEST_HOME = [
  alsName(WEB_SOURCE_DIR, CALLER_PATH),      // die Datei mit `export function checkHealth(`
  alsName(WEB_SOURCE_DIR, WEB_CLIENT_PATH),  // api/client.ts
];
const strayRequest = strayRequestAccess(webFiles, WEB_REQUEST_HOME);
check('`request` steht nur in api/endpoints.ts und in api/client.ts, wo es entsteht', …)
```

`strayRequestAccess` sucht `request` als **Wort** über **alle** gebündelten Quelldateien von
`@takt/web` (`request-scan.mjs`, `REQUEST_WORD`). Eine Datei `features/tags/api.ts`, die
`import { request } from "../../api/client"` schreibt, ist damit ein Befund — und
`proof:callers` wird rot. Der Lauf leitet den erlaubten Ort seit T-249-1 zwar auf, aber über
**ein** Merkmal (`export function checkHealth(`), also über genau eine Datei.

Eine Datei `features/tags/api.ts`, die nur `export { createTag, … } from "../../api/endpoints"`
schreibt, wäre eine Barrel-Datei — vom Auftrag ausgeschlossen. Einen anderen Namen für
`request` zu wählen, um am Wächter vorbeizukommen, ist keine Umstrukturierung, sondern ein
Ausweichen; das habe ich nicht getan.

**Damit hängt Welle 1 bis 8 an derselben Entscheidung, nicht nur `tags`.** Konkreter Vorschlag
an den Orchestrator (Auftrag an domain-dev, **vor** Welle 2):

`WEB_REQUEST_HOME` wird von „eine aufgelöste Datei" auf „`api/client.ts` **plus** jede Datei
`features/*/api.ts`" erweitert — als **aufgelöste Menge mit Untergrenze**, nicht als Muster
ohne Zensus, damit der stumme Ausgang aus `source-resolve.mjs` nicht zurückkehrt. Dazu muß
Abschnitt 0 (`rawCalls`, `result.calls.length >= 45`) und Abschnitt 2 bis 5 über **alle** diese
Dateien laufen statt über eine; heute liest `inspect()` genau einen Text.

## Die feature-eigenen Typen: gemessen, und sie sind nicht feature-eigen

`Tag`, `TagFolder`, `TagFolderNode`, `TagTree` aus `api/types.ts` werden von `api/endpoints.ts`,
`app/StructureContext.tsx` und `lib/folderPaths.ts` gebraucht — der Tag-Baum liegt im
`StructureContext` für acht Ansichten. Nach der Regel des Auftrags („Was mehrere Features
teilen, bleibt in `api/`") bleiben sie, wo sie sind. Feature-eigen sind `TagTreeNode`
(bei `TagTree.tsx`), `Selection` (jetzt in `treeData.ts`) sowie `Suggestion`, `TagInputProps`
und `TagComboboxProps` (bei `TagInput.tsx`) — die liegen bereits direkt bei ihrem Baustein.

## Kommentare — was wanderte, was blieb, was ich stehengelassen habe

Nach `docs/decisions/tags.md` gewandert sind **sechs** Blöcke, alle nach demselben
mechanischen Kriterium: Rückblick, der mit „Bis …" oder „Vor …" beginnt und heute nichts mehr
anweist.

| Woher | Was |
|---|---|
| `TagTree.tsx` | „Bis T-035 taten Klick, Eingabetaste und Leertaste …" |
| `TagInput.tsx` | „Vor T-059 gab es an vier Stellen vier Arten …" |
| `TagsScreen`-Kopf | „Bis T-108 stand hier ‚eine Regel über Tags und Ordner‘ …" |
| `TagAdministration.tsx` | „Bis T-102 wechselte allein der Hinweistext …" |
| `PoolAdministration.tsx` | „Bis T-091 war ‚Vom Board nehmen‘ …" und „Bis dahin meldete sich dieselbe Handlung …" |
| `PoolAdministration.tsx` | „Bis dahin stand hier eine zweite Fassung, die nur die Tagliste kannte …" |

Die **Regel** aus jedem dieser Blöcke steht weiter im Quelltext, nur ohne die Vorgeschichte:
die Tastaturtafel im Baum, „es ist **eine** Eingabe", „Titel und Zeile kommen aus **einem**
Aufruf", „ein Titel, der weiter fragt, stellt eine Frage, die schon beantwortet ist". Jede
betroffene Datei trägt eine Zeile „Vorgeschichte: `docs/decisions/tags.md`."

**Stehengelassen und hiermit gefragt** (E-078 Punkt 3 — ich weiß nicht, welcher Prüfer sie
verlangt hat):

1. `TagAdministration.tsx`, `consequence` des Löschdialogs: der Block „Vorwarnung und Absage
   sind seit T-118 zwei Eigenschaften … Bis dahin trugen beide dieselbe: `deleteError ??
   Vorwarnung` …". Er beginnt mit „Bis dahin", **aber** der Satz „eine Beschreibung wird nicht
   erneut vorgelesen, wenn sie sich ändert" ist der einzige Grund, warum hier zwei
   Eigenschaften stehen. Herausgenommen bliebe die Zusage ohne Begründung. → Soll er ganz
   bleiben, oder darf ich ihn auf die Regel kürzen und den Meßteil („Gehört hat sie nur den
   neuen Knopfnamen …") verschieben?
2. `TagAdministration.tsx`, `nameTouched`: „(Befund O-DZ, T-167.)" — die Kennungen sind
   Aufgabennummern, der Rest („Drei Dialoge teilen sich `name` … `onSubmit` läuft also nie")
   erklärt, warum der heutige Code überrascht. Ich habe **beides** stehengelassen, weil ein
   Befundkürzel kein Absatz Vorgeschichte ist.
3. Anforderungs- und Entscheidungskennungen (A-4.3, E-055, E-063, SC 1.4.1 …) sind **überall**
   geblieben. Sie sind Deckung, nicht Vorgeschichte.

## Zahlen — gemessen, vorher und nachher

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | grün |
| `pnpm boundaries` | grün (Zahl nicht gemessen) | grün, 417 Quelldateien außerhalb der Domäne |
| `pnpm contrast` | 261 Paare, 0 von 522 durchgefallen, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **129** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen | 21/0 — **132** Quelldateien, 174 / 29 / 8 |
| `pnpm run proof:surface` | 27/0 — **129** Quelldateien, 2 Einstiegsseiten, 7 Stilblätter, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **132** Quelldateien, sonst zeichengleich |
| `pnpm run proof:all` | 248/0 (Zahl **aus dem Auftrag zitiert**, von mir nicht vorher gemessen) | 248/0, Rückgabewert 0, kein einziger Lauf mit einem Fehlschlag |
| `pnpm test:coverage` | 1570/0 (ebenfalls **zitiert**) | 1570 bestanden, 3 übersprungen, 88 Testdateien |
| `apps/web` `pnpm build` | grün | grün, `TagsScreen`-Bündel 17,23 kB als **ein** Stück |

**Die eine Zahl, die sich bewegt hat: 129 → 132 Quelldateien**, in `proof:foreign` und
`proof:surface` gleichermaßen. Das sind genau die drei Dateien, die beim Aufteilen von
`TagsScreen.tsx` (910 Zeilen) entstanden sind: `TagAdministration.tsx`,
`PoolAdministration.tsx`, `treeData.ts`. Sie steht so, weil Regel 4 des Auftrags das Aufteilen
großer Dateien ausdrücklich verlangt. **Jede andere gemessene Zahl in beiden Läufen ist
zeichengleich geblieben** — insbesondere 174 behandelte Übergaben und 29 Eingabefelder in
`proof:foreign` und 29 benannte Live-Regionen in `proof:surface`; das ist der Nachweis, daß
über dieselbe Oberfläche geurteilt wurde.

Gegenprobe, daß nichts verlorenging: der Rumpf der vier neuen Dateien ist gegen
`git show HEAD:…/TagsScreen.tsx` zeilenweise verglichen (Kommentare abgezogen). Einziger
Unterschied: `function` → `export function` an drei Stellen und der Wegfall des lokalen Alias
`TagTreeData` in `treeData.ts`. **Kein Ausdruck geändert.** `Tag.tsx` ist außerhalb seiner
Importzeilen byte-gleich.

## E2E — einzeln über `tests/e2e/playwright.config.ts`

| Datei | Ergebnis |
|---|---|
| `tags-folders.spec.ts` | 2 bestanden |
| `tag-folder-rule-lock.spec.ts` + `form-dialog-submit-guard.spec.ts` | 7 bestanden |
| `pool-movement-sentence`, `board-empty-state-rule-chain`, `kanban`, `todo-revival`, `focus-return-after-dialog` | 22 bestanden |
| `tag-input.spec.ts` | **flatternd**, siehe unten |

`tag-input.spec.ts` fällt auf dieser Maschine in jedem Lauf an einer **anderen** Stelle um und
läuft einzeln durch. Ich habe das gegen den Ausgangsstand gemessen statt behauptet: mit
`git stash` auf den Stand **vor** meiner Änderung fällt dieselbe Datei ebenfalls um, dort
TAGINPUT-01 statt TAGINPUT-02. Das Flattern ist also vorhanden, bevor ich etwas angefaßt habe,
und gehört als eigener Befund gemeldet — nicht in diesen Auftrag.

## Annahmen

1. **`shared/ui/Tag.tsx` importiert vorerst aus `components/`** (`Foreign`, `Icon`). Diese
   beiden sind ebenfalls Bausteine für alle und werden in einer späteren Welle nachkommen; bis
   dahin ist das ein Übergangszustand und keine Absicht.
2. **`components/TodoListFilters.tsx` importiert aus `features/tags/`.** Richtung
   `components → features` ist ungewohnt; sie verschwindet, sobald `TodoListFilters` in
   `features/todos/` liegt.
3. `PoolAdministration` liegt in `features/tags/`, obwohl es Regeln zeigt — Begründung oben.
4. `treeData.ts` heißt nicht `tagTree.ts`: auf einem Dateisystem ohne
   Groß-/Kleinschreibungsunterschied wären `./tagTree` und `./TagTree` im selben Ordner eine
   Falle.

## Risiken

- **`proof:callers` ist heute grün und mißt trotzdem eine Zusage, die die Umstrukturierung
  aufhebt.** Solange nur die Oberfläche zieht und `endpoints.ts` steht, hält sie. Wer in einer
  späteren Welle eine `features/*/api.ts` anlegt, wird ohne Vorwarnung rot — und die Versuchung,
  den Wächter zu lockern statt ihn zu erweitern, ist genau der Weg, den A-A-62 verbaut hat.
- **Zeilennummern in Papieren zeigen ins Leere.** `docs/design/textbestand.md` (`TagsScreen.tsx:79,
  612, 624, 1156, 1157, 1231, 1232`), `docs/design/textabbau-gestalt.md` (`:340–342`, `:1167`)
  und `docs/bedrohungsmodell.md` (`:2794` „`TagsScreen.tsx:425-434`", `:3015`) nennen Zeilen
  einer Datei, die es so nicht mehr gibt. Kein Lauf mißt sie; die Papiere gehören anderen
  Agenten. Gemeldet, nicht angefaßt.
- Keine Sicherheitsfläche berührt: kein `fetch`, kein `request`, keine Adresse, keine
  Öffnen-Befehle, kein neuer Weg nach außen. `proof:release-safety`, `proof:route-policy` und
  `proof:shell-surface` unverändert grün.

## Offene Fragen

1. **F-22 (neu): Wo darf `request` künftig stehen?** Ohne Antwort kann keine Welle die
   API-Aufrufe eines Merkmals mitnehmen, und das Zielbild `features/{…}/api.ts` bleibt leer.
   Vorschlag oben; die Änderung gehört domain-dev.
2. Die drei stehengelassenen Kommentare oben, Punkt 1 und 2 — Zustimmung des Prüfers nötig, der
   sie verlangt hat (E-078 Punkt 3).
3. Soll `screens/parts.tsx` (`AsyncBoundary`, `ScreenHeader`) in der nächsten Welle nach
   `shared/ui/` gehen? Es wird von **jedem** Screen benutzt; `features/tags/TagsScreen.tsx`
   greift heute mit `../../screens/parts` zurück.
4. **`visual-qa` habe ich nicht gefahren** — die Rolle steht mir in dieser Sitzung nicht als
   Werkzeug zur Verfügung. Ersatzweise gemessen: der gebaute Bündel ist grün, und die
   gerenderte Tag-Ansicht wird von 31 bestandenen E2E-Zusicherungen bedient (Baum vier Ebenen
   tief, Ziehen, Zyklusabweisung, vier Dialoge, Absage des Dienstes mit Regelnamen,
   Fokusrückkehr). Es gibt keine Änderung an CSS, Klassennamen oder JSX-Text. Ein Abnahmeblick
   bleibt trotzdem offen und gehört in die nächste Welle.

## Nächster Schritt

F-22 entscheiden und als **erste** Aufgabe der nächsten Welle an domain-dev geben
(`proof:callers` lernt die neuen Heimatorte). Erst danach Welle 2. Für Welle 2 schlage ich
`features/todos` vor und **nicht** `export`: `TodoRow`, `TodoListScreen`, `TodoDetailScreen`,
`TodoFormDialog`, `TodoListFilters` hängen bereits an `shared/ui/Tag.tsx` und
`features/tags/TagInput.tsx` und würden die beiden Übergangsimporte aus meinen Annahmen 1 und 2
gleich mit auflösen. `ExportScreen` (1338 Zeilen) ist der schwerste Fall und sollte laufen,
wenn das Muster zweimal getragen hat.
