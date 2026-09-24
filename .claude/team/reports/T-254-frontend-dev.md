# T-254 — Welle 5 der Umstrukturierung: `features/export`

Aufgabe: T-254 — `features/export` bauen
Status: **braucht Review** — das Merkmal steht, **alle Läufe grün**: `typecheck`,
`boundaries`, `contrast`, `proof:foreign`, `proof:surface`, `proof:callers`, `proof:export`,
`proof:export-api`, `proof:template-fields`, `proof:all` (248/0, Ausgangskode 0),
`verify:bundle` (19/0), `test:coverage` (88 Dateien, 1570 bestanden, 3 übersprungen — **zeichengleich**
zu Welle 4), `build`.

**Die beiden Pflichtabläufe sind gefahren und grün** — Abschnitt 10. Ebenso die vier übrigen
Export-E2E-Dateien: **20 von 20 bestanden, kein roter Fall.** Der Stand bleibt **106/5**.

**Deine Liste war an fünf Stellen falsch, und eine davon ändert den Zuschnitt der Welle**:
`app/exportSummary.ts` hat **keinen einzigen Leser im Export** und bleibt, wo es ist
(Abschnitt 3). Drei Zeilenzahlen waren zu niedrig. Und ein Umzug wäre auf diesem Dateisystem
**gar nicht gegangen** — Abschnitt 4.

---

## 1  Artefakte

### Neu — **acht** Quelldateien, **eine** Umbenennung, **null** Löschungen

| Datei | Zeilen | Was |
|---|---|---|
| `features/export/api.ts` | 304 | neun Routen und zwölf merkmalseigene Typen |
| `features/export/ExportScreen.tsx` | (bleibt) | siehe unten |
| `features/export/GroupRowDetail.tsx` | 104 | die Zeile, wie sie in die Datei geht, samt `TemplateFieldsResult` |
| `features/export/RunResult.tsx` | 109 | Ergebnis eines Laufs, einschließlich `SkippedRow` |
| `features/export/ExportRunList.tsx` | 93 | „Letzte Exportläufe" |
| `features/export/exportGroupLayout.ts` | 111 | die Gliederung der offenen Buchungen |
| `features/export/TemplateList.tsx` | 95 | die Vorlagenliste des Editors |
| `features/export/PreviewGroupRow.tsx` | 207 | eine Tagesgruppe der Vorschau |
| `features/export/TemplateFieldRow.tsx` | 416 | Feldzeile, Quellenauswahl, Bedingung |
| `docs/decisions/export.md` | 168 | Vorgeschichte aus `features/export/**` |

**Acht** neue Quelldateien, keine gelöschte. Netto **+8** — die Zahl steht unten in drei
unabhängigen Zählern (Abschnitt 11).

### Verschoben (`git mv`, Inhalt außer Importzeilen unverändert)

```
screens/ExportScreen.tsx            → features/export/ExportScreen.tsx
screens/TemplatesScreen.tsx         → features/export/TemplatesScreen.tsx
screens/TemplatePreview.tsx         → features/export/TemplatePreview.tsx
screens/TemplateFields.tsx          → features/export/TemplateFields.tsx
screens/ExportAuditScreen.tsx       → features/export/ExportAuditScreen.tsx
components/ExportGroups.tsx         → features/export/ExportGroups.tsx
components/ExportDirectoryField.tsx → features/export/ExportDirectoryField.tsx
components/ExportRowPanes.tsx       → features/export/ExportRowPanes.tsx
components/ExportAudit.tsx          → features/export/ExportAudit.tsx
lib/exportTemplateModel.ts          → features/export/exportTemplateModel.ts
lib/exportDirectoryAdvice.ts        → features/export/exportDirectoryAdvice.ts
app/exportAudit.ts                  → features/export/exportAuditRows.ts   ← umbenannt, Abschnitt 4
```

`screens/` hält jetzt noch sechs Dateien: `DashboardScreen`, `SettingsScreen`, `StatusSettings`,
`PoolFormDialog`, `PoolRenameDialog`, `parts`.

### Angefaßt, aber nur die Importzeile (bzw. eine Pfadangabe im Kommentar)

`app/App.tsx`, `screens/SettingsScreen.tsx`, `features/bookings/BookingDialogs.tsx`,
`showcase/data.ts`, `showcase/ExportDirectorySection.tsx`, `showcase/ExportPreviewSection.tsx`,
`lib/foreign.ts` — und `api/endpoints.ts` / `api/types.ts`, aus denen der Exportabschnitt
teilweise herausgeschnitten ist.

### `apps/web/test/**` — fünf Pfadangaben in drei Dateien, **keine Zusicherung**, wie erlaubt

| Datei | vorher | nachher |
|---|---|---|
| `test/lib/exportTemplateModel.test.ts:20,22` | `../../src/lib/exportTemplateModel` | `../../src/features/export/exportTemplateModel` |
| `test/lib/exportTemplateModel.test.ts:21` | `../../src/api/types` | `../../src/features/export/api` |
| `test/screens/templatesScreenBeginCopy.test.ts:60` | `../../src/screens/TemplatesScreen.tsx` | `../../src/features/export/TemplatesScreen.tsx` |
| `test/components/liveRegionsAlwaysRendered.test.ts:135` | `../../src/components/ExportDirectoryField.tsx` | `../../src/features/export/ExportDirectoryField.tsx` |
| `test/components/liveRegionsAlwaysRendered.test.ts:143` | `../../src/screens/TemplateFields.tsx` | **`../../src/features/export/TemplateFieldRow.tsx`** |

> **Der letzte gehört gemeldet, nicht versteckt.** Die Meldefläche, die dieser Prüffall mißt
> (`role="alert"` am unbedingten Behälter, O-GQ/T-191), ist mit `TemplateFieldRow` in die neue
> Datei gewandert. Die Zusicherung ist unverändert und sie mißt denselben Bau; **der Titel des
> Prüffalls sagt aber weiter „TemplateFields.tsx"**. Den Titel habe ich **nicht** angefaßt — er
> ist Text im Prüfbestand und gehört unit-tester. Vorschlag steht in Abschnitt 14.

---

## 2  Deine Liste, geprüft — **fünf** Korrekturen

| Deine Angabe | Gemessen | Folge |
|---|---|---|
| `ExportScreen.tsx` 1338 | **1340** | — |
| `TemplatePreview.tsx` 651 | **657** | — |
| `app/exportAudit.ts` 273 | **280** | — |
| `components/ExportStatus.tsx` — „Kandidat für `shared/ui`" | **stimmt, und es bleibt liegen** | Abschnitt 3 |
| `app/exportSummary.ts` — als Export-Datei gelistet | **kein Leser im Export** | **bleibt in `app/`**, Abschnitt 3 |

Summe deiner Liste rund 6 700; gemessen **6 777**. Die Welle ist also etwas größer als
angesagt, aber `exportSummary.ts` (123) und `ExportStatus.tsx` (229) fallen heraus — netto
**6 425** Zeilen umgezogen.

---

## 3  Die beiden Dateien, die **nicht** umziehen — gemessen, nicht geraten

### `app/exportSummary.ts` — **null** Leser im Export

```
features/board/BoardColumn.tsx      EMPTY_SUMMARY
features/board/BoardScreen.tsx      loadExportSummaries
features/todos/TodoListScreen.tsx   EMPTY_SUMMARY, loadExportSummaries
features/todos/TodoRow.tsx          (Typ, siehe unten)
```

Vier Leser, alle in `features/board` und `features/todos`, **keiner** in einer Exportfläche. Sie
nach `features/export/` zu ziehen hieße, Board und Todo-Liste aus dem Export bedienen zu lassen —
genau der Fehler, den Welle 4 mit `ExportSummaryStrip` vermieden hat, nur in der Gegenrichtung.
Der Name täuscht; die Leser täuschen nicht.

### `components/ExportStatus.tsx` — 14 Leser in sieben Bereichen, und es gehört nach `shared/ui`

```
api/types.ts, app/exportSummary.ts, app/GlobalSearch.tsx,
features/bookings/{BookingDialogs,bookingRows,BookingsScreen,BookingTable},
features/timer/TimeScreen.tsx, features/todos/TodoDetailScreen.tsx,
features/export/{ExportGroups,exportAuditRows,…}, screens/DashboardScreen.tsx,
shared/ui/ExportSummaryStrip.tsx, showcase/{DataSection,ExportStatusSection}
```

Es erfüllt das Kriterium für `shared/ui/` aus Welle 2 (nimmt Werte, kennt keine Route) und gehört
in denselben Auftrag wie `Menu.tsx`, `Primitives.tsx`, `FormDialog.tsx` und `FilterBar.tsx` —
den ich in Welle 4 unter Abschnitt 12 vorgeschlagen habe. **Ein Schnitt, der nicht zur Aufgabe
gehört, wird nicht nebenbei gemacht.**

> Bemerkenswert und für den späteren Auftrag zu merken: `api/types.ts` führt `ExportStatus` aus
> `components/ExportStatus.tsx` ein und reicht es weiter. Die Vertragsdatei hängt an einem
> Baustein — die Richtung wird beim Schließen von `shared/ui` mit umgedreht werden müssen.

---

## 4  Der Umzug, der auf diesem Dateisystem nicht ging

`app/exportAudit.ts` und `components/ExportAudit.tsx` in **einen** Ordner zu legen bricht den
Übersetzer:

```
error TS1149: File name '…/features/export/ExportAudit.ts' differs from already included
file name '…/features/export/exportAudit.ts' only in casing.
```

Windows und macOS unterscheiden die beiden Namen nicht. **Gelöst durch Umbenennung des
Datenmoduls, nicht des Bausteins**: `exportAudit.ts` → **`exportAuditRows.ts`**. Das folgt der
Form, die schon dasteht — `features/bookings/bookingRows.ts`, `features/todos/todoDayGroups.ts`,
`features/tags/treeData.ts`: das Datenmodul heißt nach dem, was es baut, der Baustein nach dem,
was er zeigt. `exportAuditRows.ts` baut `ExportAuditRowModel[]`.

Kein Bezeichner wurde umbenannt, nur der Dateiname. Der Prüffall
`test/screens/templatesScreenBeginCopy.test.ts` ist davon nicht betroffen.

---

## 5  `features/export/api.ts` — und die **zwei** Routen, die ausdrücklich draußen bleiben

**Neun Routen** sind umgezogen: `createExportTemplate`, `updateExportTemplate`,
`deleteExportTemplate`, `getExportSources`, `previewExportDraft`, `listExportRuns`, `runExport`,
`getExportRun`, `listExportAudit`.

**Zwei sind geblieben**, nach der Regel aus Welle 3 (`features/bookings/api.ts`: „Was mehrere
Merkmale lesen, gehört keinem"):

| Route | Der Leser außerhalb | Warum das zwingt |
|---|---|---|
| `listExportTemplates` | `screens/SettingsScreen.tsx:570` | S-09 wählt die aktive Vorlage |
| `previewExport` | `app/dayGroup.ts` | **`app/` liegt unter den Merkmalen.** Eine Einfuhr aus `features/export/` an dieser Stelle drehte die Richtung um |

`app/dayGroup.ts` hat selbst sieben Leser in vier Merkmalen (bookings, timer, todos,
DashboardScreen). Der zweite Fall ist damit nicht Geschmack, sondern erzwungen.

### Die Typen: **zwölf** wandern, **sieben** bleiben — und der Grund ist ein Zwang

Gewandert: der ganze E-049-Block (`ExportSourcePath`, `ExportTransformation`,
`ExportConditionOperator`, `ExportSourceGroupInfo`, `ExportSourceInfo`,
`ExportTransformationInfo`, `ExportConditionOperatorInfo`, `ExportSourceCatalog`) sowie
`ExportRunGroup`, `ExportRun`, `ExportRunResult`, `ExportAuditEntry`.

Geblieben in `api/types.ts`: `ExportTemplate`, `ExportValue`, `ExportRow`, `ExportGroupSummary`,
`ExportNotExportableReason`, `SkippedExportGroup`, `ExportPreview`.

**Der Grund ist die transitive Hülle von `ExportPreview`.** `ExportPreview` hat mit
`app/dayGroup.ts` einen Leser unterhalb der Merkmale und muß deshalb in `api/types.ts` bleiben;
es verweist auf `ExportRow` → `ExportValue`, auf `ExportGroupSummary` und auf
`SkippedExportGroup` → `ExportNotExportableReason`. **`api/types.ts` darf aus `features/` nichts
einführen**, also können die fünf nicht mit. `ExportTemplate` bleibt, weil
`listExportTemplates` bleibt.

Das steht als Kopfkommentar in `features/export/api.ts` — nicht als Bequemlichkeit, sondern
damit der Nächste die Grenze nicht für willkürlich hält.

**Kein `features/export/types.ts`**, wie im Auftrag entschieden.

---

## 6  Die Schnitte — und die **zehn**, gegen die ich mich entschieden habe

Kriterium wie in Welle 4: **Der Schnitt darf keine Eigenschaftsfläche erfinden.**

### Angenommen

| Aus | Heraus | Zeilen | Eigenschaften | vorher ausgeschrieben? |
|---|---|---|---|---|
| `ExportScreen` 1340 → **979** | `GroupRowDetail.tsx` | 104 | `GroupRowDetailProps` — 5 | **ja** |
| | `RunResult.tsx` | 109 | 3, inline ausgeschrieben (+ `SkippedRow`, 1) | **ja** |
| | `exportGroupLayout.ts` | 111 | kein JSX; zwei Schnittstellen, beide vorher da | **ja** |
| | `ExportRunList.tsx` | 93 | **1 — und die habe ich geschrieben** | **nein**, siehe unten |
| `TemplatesScreen` 985 → **898** | `TemplateList.tsx` | 95 | `TemplateListProps` — 5 | **ja** |
| `TemplatePreview` 657 → **452** | `PreviewGroupRow.tsx` | 207 | `PreviewGroupRowProps` — 7 | **ja** |
| `TemplateFields` 649 → **246** | `TemplateFieldRow.tsx` | 416 | `TemplateFieldRowProps` — **18** | **ja** |

Alle sieben Schnitte liegen **an einem vorhandenen Trennbalken**. Sechs davon ziehen eine
fertig ausgeschriebene Eigenschaftsfläche heraus; die Kosten sind ein `export`-Schlüsselwort je
Deklaration (Abschnitt 8).

**`ExportRunList.tsx` ist der eine Schnitt, dessen Eigenschaftsfläche ich selbst geschrieben
habe, und ich sage es, statt es unter die anderen zu mischen.** Sie hat **eine** Eigenschaft
(`runs: readonly ExportRun[]`), und deren Typ und Wert standen als `value.runs` bereits da. Das
ist der Unterschied zu den abgelehnten Schnitten unten, die 9, 16, 23 und 28 Eigenschaften
erfunden hätten. Die Fläche ist der einzige Teil von S-07, der nicht vom **bevorstehenden** Lauf
handelt.

### Abgelehnt — der wichtigere Teil

1. **Die Karte „Vorlage und Rundung" bleibt im Bildschirm.** 110 Zeilen JSX, aber **neun**
   erfundene Eigenschaften (`templates.state`, `settings`, `directoryState`, `directoryProblem`,
   `directoryAdvice`, `directoryTraits`, `billingUser`, `activeTemplateId`, `setTemplateId`).
2. **Der Zusammenfassungsstreifen (`export-summary`) bleibt.** 60 Zeilen, fünf erfundene
   Eigenschaften, und vier davon sind Ableitungen aus `totalsState`. Ein Baustein, der den
   Zustand seines Wirts noch einmal auswertet, ist keine Trennung.
3. **Die `models`-Abbildung bleibt im Bildschirm.** Sie ist die einzige Stelle, an der ich in
   Versuchung war, weil sie reine Datenumformung ist — aber sie steht in der Rückruffunktion von
   `AsyncBoundary` und läse fünf Werte aus dem Abschluß. Als Funktion herausgezogen wären das
   fünf erfundene Argumente.
4. **Die drei Dialoge am Fuß von `TemplatesScreen` bleiben.** 64 Zeilen, **sechzehn** erfundene
   Eigenschaften — buchstäblich der `BookingDialogs`-Fall aus Welle 3.
5. **Der `tpl-editor`-Block bleibt.** 180 Zeilen, **achtundzwanzig** erfundene Eigenschaften.
6. **`BuiltinNotice` (27 Zeilen) und `DeviationPanel` (48) bleiben bei `TemplatesScreen`.**
   Jede hat genau einen Aufrufer, beide unter 50 Zeilen. Sie in **eine** Datei zu legen erfände
   eine Gruppierung, in zwei Dateien wären es zwei Bewegungen ohne Struktur. Dieselbe Abwägung
   wie `BoardColumnEmpty` in Welle 4 — und die war 110 Zeilen lang.
7. **`useLeaveGuard` (47 Zeilen) bleibt in `TemplatesScreen`.** Sie ist der einzige Baustein
   dieser Datei, der **nichts** mit Vorlagen zu tun hat, und wäre in `app/` neben `router.ts`
   richtig aufgehoben — aber sie hat genau einen Aufrufer. Ein geteiltes Modul mit einem
   Benutzer ist eine erfundene Grenze.
8. **Die sechs `setDraft`-Rückrufe von `TemplatesScreen` werden kein Haken.** Zusammen 90
   Zeilen, eine erkennbare Verantwortlichkeit („die Feldliste des Entwurfs bearbeiten") — aber
   `draft` wird außerdem vom Ladeeffekt, von `save` und von `discard` gesetzt. Ein Haken, der
   nur die sechs nähme, bekäme den Setzer hereingereicht; sie als reine Funktionen über
   `readonly DraftField[]` zu schreiben wäre Umschreiben und nicht Aufteilen.
9. **`ExportDirectoryField.tsx` (523) wird nicht aufgeteilt.** Vier Ausfuhren unter vier
   Trennbalken — aber drei davon sind 13, 35 und 60 Zeilen lang, und alle vier teilen
   `ExportDirectoryConcern`/`ExportDirectoryTrait` und die CSS-Familie. Derselbe Grund wie
   `KanbanCard`/`KanbanColumn` in Welle 4.
10. **`components/ExportStatus.tsx` und `app/exportSummary.ts` bleiben** — Abschnitt 3.

---

## 7  Die Dublette `ExportSummary` — aufgelöst, ohne eine Grenze zu erfinden

Der Befund aus Welle 4 war richtig: die Zeile

```ts
export type ExportSummary = Readonly<Record<ExportDisplayState, number>>;
```

stand **zeichengleich** in `app/exportSummary.ts:31` und in `shared/ui/ExportSummaryStrip.tsx`.

**Aufgelöst nach `components/ExportStatus.tsx`** — dorthin, wo `ExportDisplayState` selbst
steht, und **beide** Dateien führen von dort bereits ein. Es entsteht **keine neue Kante**:

```
vorher: exportSummary.ts   → components/ExportStatus   (exportDisplayState, ExportDisplayState)
        ExportSummaryStrip → components/ExportStatus   (ExportStatusMarker, EXPORT_STATE, ExportDisplayState)
nachher: dieselben zwei Kanten, je ein Typname mehr darin
```

Zwei Aufrufstellen ziehen mit: `features/todos/TodoRow.tsx` (führte den Typ aus
`app/exportSummary` ein) und `features/board/Kanban.tsx` (aus `shared/ui/ExportSummaryStrip`).
Der Erklärungsblock, der bei `ExportSummaryStrip` stand (R-10, E-050, E-032), ist **vollständig**
mitgewandert und um einen Satz ergänzt, der sagt, warum der Typ dort liegt.

Der Mengenvergleich über diese fünf Dateien: **511 Anweisungszeilen vorher, 510 nachher, und
der einzige Unterschied ist genau die gestrichene Dublette** (Abschnitt 8).

---

## 8  Der Mengenvergleich — der schärfste Nachweis

Verglichen wie in Welle 1 bis 4: Blockkommentare, Zeilenkommentare, JSX-Kommentare und
Einfuhrzeilen entfernt, verbleibende **Anweisungszeilen** gegen Leerraum normalisiert und als
**Mengen** verglichen. Gemessen gegen einen Abzug des Arbeitsbaums von **vor** dem ersten
Schnitt (nicht gegen `git show HEAD:…` — HEAD kennt Welle 1 bis 4 nicht).

| Vergleich | vorher | nachher | Ergebnis |
|---|---|---|---|
| `ExportScreen` → 5 Dateien | 885 | 893 | 12 `export`-Schwünge + **8** neue Zeilen, alle ausgeschrieben |
| `TemplatesScreen` → 2 Dateien | 706 | 706 | **1** Unterschied |
| `TemplatePreview` → 2 Dateien | 403 | 403 | **3** Unterschiede |
| `TemplateFields` → 2 Dateien | 453 | 453 | **1** Unterschied |
| `api/types` + `api/endpoints` → dieselben + `features/export/api.ts` | 547 | 547 | **CODE IDENTISCH** |
| die acht ganz verschobenen Dateien | 1583 | 1583 | **CODE IDENTISCH** |
| `ExportSummary`-Dublette (5 Dateien) | 511 | 510 | **1** Streichung, ausgeschrieben |

### Die **17** Unterschiede aus dem Aufteilen, einzeln

```
const PAGE_SIZE = 200;                     → export const PAGE_SIZE = 200;
interface GroupLayout {                    → export interface GroupLayout {
interface GroupInsight {                   → export interface GroupInsight {
type TemplateFieldsResult =                → export type TemplateFieldsResult =
function GroupRowDetail({ … })             → export function GroupRowDetail({ … })
function RunResult({                       → export function RunResult({
async function collectOpenEntries()        → export async function collectOpenEntries()
function previewNote(…)                    → export function previewNote(…)
function groupKeyOf(…)                     → export function groupKeyOf(…)
function toLayout(…)                       → export function toLayout(…)
const ALL_EXCLUDED: GroupInsight = {       → export const ALL_EXCLUDED: GroupInsight = {
function reasonText(…)                     → export function reasonText(…)
function TemplateList({                    → export function TemplateList({
interface PreviewGroup {                   → export interface PreviewGroup {
type GroupOutcome =                        → export type GroupOutcome =
function PreviewGroupRow({                 → export function PreviewGroupRow({
function TemplateFieldRow({                → export function TemplateFieldRow({
```

Siebzehn `export`-Schlüsselwörter an Deklarationszeilen. **Kein Ausdruck geändert.**

### Die **8** zusätzlichen Zeilen aus `ExportRunList`, einzeln

```
+ export interface ExportRunListProps {
+   readonly runs: readonly ExportRun[];
+ }                                        (Abschluß der Schnittstelle)
+ export function ExportRunList({ runs }: ExportRunListProps) {
+   return (
+   );
+ }                                        (Abschluß der Funktion)
+ <ExportRunList runs={value.runs} />       (die Aufrufstelle im Bildschirm)
```

Dazu **zwei** 1:1-Ersetzungen im verschobenen Rumpf, weil der Wert jetzt eine Eigenschaft ist:

```
{value.runs.length === 0 ? (   →   {runs.length === 0 ? (
{value.runs.map((run) => (     →   {runs.map((run) => (
```

Mehr nicht. **Keine Zahl hat sich bewegt.** Rundung, Base64, Exportstatus und Notiz-Trennung
sind an keiner Stelle berührt; die Mengengleichheit der Abschnitte „api" und „ganz verschoben"
ist der Beleg, und die beiden Pflichtabläufe sind der zweite (Abschnitt 10).

### Die eine Streichung

```
- export type ExportSummary = Readonly<Record<ExportDisplayState, number>>;
```

Eine der beiden zeichengleichen Zeilen aus Abschnitt 7. Die andere steht unverändert, nur an
einem dritten Ort.

---

## 9  Kommentare — was wanderte, was blieb

Nach demselben mechanischen Kriterium wie in Welle 1 bis 4: Rückblick, der nichts mehr anweist,
geht ins Papier. **Neun Blöcke** in `docs/decisions/export.md`:

| Woher | Was |
|---|---|
| `ExportScreen.tsx`, Kopf | „Bis T-040 zeigte diese Ansicht … `totals.rows` wurde geholt und nur gezählt" |
| `ExportScreen.tsx`, Kopf | „Bis T-045 verschluckte diese Ansicht den Fehlschlag der Gesamtvorschau …" |
| `ExportScreen.tsx`, `TotalsState` | „Bis T-045 war das ein `ExportPreview \| null` …" |
| `ExportScreen.tsx`, `billingUser` | „Bis T-042 war er erst **nach** dem Lauf zu sehen …" |
| `ExportScreen.tsx`, Vorlagenauswahl | „T-035, offene Frage 2 — beantwortet … Bis T-036 stand das nirgends" |
| `TemplatesScreen.tsx`, `beginCopy` | „Bis T-186 standen die drei Setzungen zweimal nebeneinander …" |
| `TemplatePreview.tsx`, Kopf | „Bis E-051 nahm `POST /export/preview` nur eine **Vorlagenkennung** entgegen …" |
| `ExportGroups.tsx`, `mergedNote` | „Bis T-133 hiess das Feld `string` — die Herkunft fiel im `join` ab …" |
| `ExportRowPanes.tsx`, Kopf | „Bis T-040 gab es die Gegenüberstellung nur in S-14 …" |

Die **Regel** jedes Blocks steht weiter im Quelltext: „S-14 prüft eine Vorlage, S-07 schreibt
die Datei", „Eine geratene Zahl ist schlimmer als keine", „Ein Name, den man erst hinterher
prüfen kann, prüft niemand", „Der Satz steht an der Auswahl, die er betrifft", „Zwei Abschriften
sind zwei Gelegenheiten, eine zu vergessen", „Die Vorschau schickt immer den Entwurf, nie eine
Kennung", „Die Marke sitzt am Feld und nicht erst an der Anzeigestelle". Fünf Dateien tragen
„Vorgeschichte: `docs/decisions/export.md`".

### Stehengelassen, mit Begründung — **zwölf**, und **sechs** hat ein Prüfer verlangt

Von einem Prüfer verlangt — **kein Satz davon ist gefallen** (E-078 Punkt 3):

1. `ExportAuditScreen.tsx`, der Kommentar an `counts` — **Befund C-25**.
2. `ExportAuditScreen.tsx`, der Kopfkommentar an `countByEvent` — derselbe Befund, zweite Stelle.
3. `ExportDirectoryField.tsx`, der Kommentar am leeren Meldebehälter — **O-GQ, T-191**.
4. `TemplateFieldRow.tsx`, derselbe Kommentar an der Feldzeile — **B-5, T-162, T-186, O-GQ, T-191**.
5. `TemplatePreview.tsx`, die beiden **ST-07 (T-181)**-Kommentare zum Herkunftssatz. Ich war
   hier nah dran, den Rückblick „Bis dahin standen vier Abschriften desselben Satzes" zu
   verschieben, und habe es gelassen: Ein Satz aus dem Textabbau fällt nicht beim Aufräumen.
6. `ExportScreen.tsx` (`SkippedRow`) und `PreviewGroupRow.tsx` — **T-222 Abschnitt 15.4/15.5,
   Befund O-JX**, der verborgene Zeilenbezug im Knopf statt eines `aria-label`.

Weil sie eine Wiederholung verhindern: der C-26-Kommentar und der Kommentar zu
`GET /export/runs/{id}` (beide jetzt in `ExportRunList.tsx`), die E-049-Blöcke in
`exportTemplateModel.ts`, `sourceOptions` (T-057/T-059), die zwei Kommentare in
`ExportDirectoryField.tsx` zu T-147 und T-133/O-AF, und der Absatz in `TemplatePreview.tsx`
über die Buchung um 23:50 (E-025).

**Kein Oberflächentext gestrichen und kein zugänglicher Name geändert** (E-087). Gegenprobe:
`contrast`, `proof:surface` (29 Live-Regionen, 2 geduldete Sätze), `proof:codepoints` (in
`proof:all`) und die Prüfsumme über 1570 Prüffälle sind **zeichengleich**. Die Musterseite
(`showcase/InventorySection.tsx`) nennt die betroffenen Dateien **ohne Ordner**
(`ExportGroups.tsx`, `ExportStatus.tsx`) — deshalb ändert sich dort nichts, im Unterschied zu
Welle 4.

### Sechs Pfadangaben in Kommentaren nachgezogen

`features/export/api.ts` (2×), `features/export/ExportAudit.tsx`, `lib/foreign.ts`,
`screens/SettingsScreen.tsx` (2×) — sie nannten `lib/exportTemplateModel.ts`,
`app/exportAudit.ts`, `components/ExportDirectoryField.tsx`, `lib/exportDirectoryAdvice.ts`.
Ein Kommentar, der auf eine Datei zeigt, die es dort nicht mehr gibt, ist schlimmer als keiner.

---

## 10  Die zwei Pflichtabläufe — ausdrücklich gefahren

Einzeln über `tests/e2e/playwright.config.ts`, wie beauftragt:

```
✓ export-end-to-end.spec.ts:29  TP-EXPORT-01/02/03 — Export von Anfang bis Ende
                                mehrere offene Buchungen, Export ausführen, JSON prüfen,
                                zweiter Lauf ist leer                          (2.8 s)
✓ note-separation.spec.ts:64    TP-NOTE-01 — Vermerk ist strukturell nicht als
                                Feldquelle wählbar                             (1.0 s)
✓ note-separation.spec.ts:98    TP-NOTE-02/03 — Standardvorlage (base64):
                                Vermerk erscheint nirgends, Leistung auffindbar (3.3 s)
✓ note-separation.spec.ts:154   TP-NOTE-02/03 — abweichende Vorlage (roh)      (2.3 s)
✓ note-separation.spec.ts:186   TP-NOTE-02/03 — Vorlage mit möglichst vielen
                                Quellenpfaden: Vermerk erscheint nirgends      (2.2 s)
```

**Fünf von fünf.** Und die vier übrigen Exportdateien im selben Lauf:

```
export-audit-and-locks           5 ✓   (TP-SEC-13, gesperrter Export, O-GZ)
export-mixed-status-and-billing  3 ✓   (gemischter Status, E-047, E-034)
export-template-validation       4 ✓   (422 an der Feldzeile, __proto__)
attachment-export-and-addin-…    3 ✓   (TP-ANH-12/13)
                                ────
                            20 passed (42.0 s)
```

Zusätzlich gegengemessen, weil sie an dieselben Flächen greifen:
`focus-return-after-dialog` (7 ✓, darunter **TP-FOCUS-07**, „Leistung nachtragen im Export") und
`form-dialog-submit-guard` (2 ✓).

Dazu die drei Dienstprüfungen, die die Geldregeln messen und **nicht** über die Oberfläche
laufen: `proof:export` 98/0, `proof:export-api` 72/0 (darunter „der Vermerk kommt in keiner
dieser fünfzig Antworten vor"), `proof:template-fields` 30/0.

---

## 11  Zahlen — vorher gemessen, nicht zitiert

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | **grün** |
| `pnpm boundaries` | **434** Quelldateien außerhalb der Domäne | **442** (+8), „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | 261 Paare, 0 von 522, 83/83 Farbtoken, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **149** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen | 21/0 — **157**, sonst zeichengleich |
| `pnpm run proof:surface` | 27/0 — **149** Quelldateien, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **157**, sonst zeichengleich |
| `pnpm run proof:callers` | 74/0, **6** Aufrufdateien, 5 zu 5 | 74/0, **7** Aufrufdateien, **6 zu 6** |
| `pnpm run proof:export` | 98/0 | **98/0** |
| `pnpm run proof:export-api` | 72/0 | **72/0** |
| `pnpm run proof:template-fields` | 30/0 | **30/0** |
| `pnpm run proof:all` | Ausgangskode 0 | **248 bestanden, 0 fehlgeschlagen, Ausgangskode 0** |
| `pnpm run verify:bundle` | 19/0 | **19/0** |
| `pnpm test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `apps/web` `pnpm build` | grün | grün |

**Die einzige Zahl, die sich bewegt hat, ist dieselbe in drei unabhängigen Zählern: +8.**
`boundaries` zählt über den Modulgraphen, `proof:foreign` über den TypeScript-Übersetzer,
`proof:surface` über den eigenen Sammler. Acht neue Quelldateien, keine gelöschte, eine
umbenannte.

`proof:callers` nennt jetzt sieben Aufrufdateien: `api/endpoints.ts`, `features/board/api.ts`,
`features/bookings/api.ts`, **`features/export/api.ts`**, `features/tags/api.ts`,
`features/timer/api.ts`, `features/todos/api.ts`. **Keiner der beiden von domain-dev benannten
Punkte ist rot geworden** — weder die `REGRESSIONS`-Selbstprobe noch `NOT_CALLED_BY_UI`.

### Zeilen

| Datei | vorher | nachher |
|---|---|---|
| `ExportScreen.tsx` | 1340 | **979** |
| `TemplatesScreen.tsx` | 985 | **898** |
| `TemplatePreview.tsx` | 657 | **452** |
| `TemplateFields.tsx` | 649 | **246** |
| `api/types.ts` | 1055 | **917** (−138) |
| `api/endpoints.ts` | 429 | **309** (−120) |
| `shared/ui/ExportSummaryStrip.tsx` | 67 | **60** |
| `components/ExportStatus.tsx` | 229 | **247** (+18, der Typ samt seinem Erklärblock) |

Die letzte vierstellige Datei des Bestandes ist damit weg. Größte Datei in
`features/export/`: `ExportScreen.tsx` mit 979.

### Bündel

`ExportScreen` 41,51 kB, `TemplatesScreen` 30,16 kB, `ExportAuditScreen` 5,34 kB — jeweils als
eigene, träge geladene Stücke wie vorher. `TemplatesScreen` **zeichengleich** zu vorher
(30,16 kB / gzip 10,23 kB), `ExportAuditScreen` ebenfalls (5,34 kB / 2,28 kB); `ExportScreen`
+0,04 kB, das sind die acht Zeilen aus `ExportRunList`.

---

## 12  Die Kantenfrage, gemessen — **und hier ist ein Kreis**

```
export   → todos    : 3 Kanten  (ExportScreen, TemplatePreview, exportAuditRows → ../todos/api)
export   → bookings : 2 Kanten  (ExportScreen, TemplatePreview → ../bookings/BookingDialogs)
bookings → export   : 2 Kanten  (BookingDialogs → ../export/ExportAudit, ../export/exportAuditRows)
todos    → export   : 0
board    → export   : 0
tags     → export   : 0
timer    → export   : 0
```

**`export` und `bookings` hängen wechselseitig aneinander.** Das ist der erste Kreis zwischen
zwei Merkmalen in dieser Umstrukturierung, und er ist nicht durch Nachlässigkeit entstanden:

- `export → bookings`: „Leistung nachtragen" öffnet in S-07 und in der Vorschau den
  Buchungsdialog. Ohne diesen Weg bleibt eine Tagesgruppe gesperrt und der Benutzer weiß nicht,
  wohin (E-034).
- `bookings → export`: Der Buchungsdialog zeigt den **Exportverlauf genau dieser Buchung** —
  die Auskunft, die jemand braucht, der einen Exportstatus zurücksetzen will (R-10, E-012).

Ich habe ihn **nicht** aufgelöst, weil jede Auflösung eine Grenze erfände: Das Protokoll aus
`features/export/` herauszunehmen hieße, einen dritten Ort für eine Sache zu schaffen, die
eindeutig zum Export gehört. **Offene Frage 2** unten.

Der Rückgriff `features/export/ → screens/` steht bei einer Stelle: `screens/parts` (viermal
eingeführt). Dieselbe Übergangsform wie in Welle 1 bis 4. Der Rückgriff
`screens/SettingsScreen → features/export/` ist neu und geht in die richtige Richtung: S-09
liest die Fläche des Exports, nicht umgekehrt.

**Ein Typ-Kreis besteht innerhalb des Merkmals:** `TemplateFields.tsx` führt
`TemplateFieldRow` ein, `TemplateFieldRow.tsx` führt `type DraftField` von dort zurück. Es ist
eine **reine Typeinfuhr** (`import type`), sie wird vom Übersetzer getilgt und steht im Bündel
nicht; `build` und `boundaries` sind grün. Die Alternative — `DraftField` in eine dritte Datei —
erfände ein Modul für sieben Zeilen, und `TemplatesScreen` führt den Typ heute aus
`./TemplateFields` ein.

---

## 13  Ein Befund, der nicht meiner ist

`TemplatePreviewCard` (`features/export/TemplatePreview.tsx:442`) ist **exportiert und hat
keinen Leser** — gemessen über den ganzen Baum einschließlich `apps/web/test/**` und `tests/**`.
Sie ist die Karte um die Vorschau; seit T-181 (ST-07) trägt sie keine Beschreibung mehr, und
`TemplatesScreen` zeigt die Vorschau seitdem in einem eigenen Dialog
(`DialogSurface`, `previewOpen`).

**Ich habe sie nicht angefaßt.** Eine tote Ausfuhr zu streichen ist eine Streichung, keine
Verschiebung, und sie fällt unter E-081 Punkt 4 (Streichung und Ausgleich in einem Auftrag) —
zumal `docs/design/textbestand.md:530` die Datei in der ST-07-Zeile führt. Gemeldet, nicht
erledigt.

---

## 14  Was in fremder Hoheit nachzuziehen ist

Ich habe nichts davon angefaßt.

1. **`apps/web/test/components/liveRegionsAlwaysRendered.test.ts:142`** — der Titel des
   Prüffalls sagt „TemplateFields.tsx", gemessen wird jetzt `TemplateFieldRow.tsx`. Der Pfad ist
   nachgezogen, der Titel nicht. **unit-tester.**
2. **`docs/architektur.md:502`** — führt `exportDirectoryAdvice.ts` unter `apps/web/src/lib/`.
   **domain-dev.**
3. **`docs/bedrohungsmodell.md:2038, 2396`** — nennen
   `apps/web/src/lib/exportTemplateModel.ts` und `apps/web/src/lib/exportDirectoryAdvice.ts`.
   **security-checker.**
4. **`docs/design/textbestand.md`, `textabbau-gestalt.md`, `textbestand-aufgabenbereich.md`** —
   nennen `ExportScreen.tsx`, `ExportAuditScreen.tsx`, `TemplateFields.tsx`,
   `TemplatePreview.tsx`, `TemplatesScreen.tsx`, `ExportGroups.tsx`,
   `components/ExportDirectoryField.tsx`, `lib/exportTemplateModel.ts`,
   `lib/exportDirectoryAdvice.ts` — teils **mit Zeilennummern**, die durch die Schnitte
   verrutscht sind. **ui-designer / ux-designer.**
5. **`apps/web/scripts/proof-foreign.mjs:1091–1093, 1283`** — Kommentare, die
   `app/exportAudit.ts`, `components/ExportAudit.tsx` und `lib/exportTemplateModel.ts` nennen.
   Die Datei ist zwar in meinem Pfad, aber sie steht im Arbeitsbaum als **von fremder Hand
   geändert** (`MM`); ich habe sie nicht angefaßt.
6. **`tests/e2e/**`** — acht Kommentare nennen die alten Pfade. **e2e-tester.** Keiner davon ist
   eine Zusicherung; alle 20 Fälle laufen.

---

## 15  Annahmen

1. **`exportAudit.ts` heißt jetzt `exportAuditRows.ts`.** Erzwungen (Abschnitt 4); der Name
   folgt `bookingRows.ts`. Kein Bezeichner umbenannt.
2. **`listExportTemplates` und `previewExport` bleiben in `api/endpoints.ts`.** Nach der Regel
   aus Welle 3, wörtlich angewandt.
3. **`ExportSummary` liegt jetzt in `components/ExportStatus.tsx`.** Die Dublette ist aufgelöst,
   ohne eine Kante zu erfinden — aber es ist eine Änderung an einer Datei, die dem späteren
   `shared/ui`-Auftrag gehört. Wenn du das anders willst, ist es eine Zeile zurück.
4. **`ExportRunList` ist der eine Schnitt mit selbstgeschriebener Eigenschaftsfläche** (eine
   Eigenschaft). Ich habe ihn gemacht, weil sonst die letzte vierstellige Datei stehen bliebe,
   und ich sage es, statt es zu verstecken.
5. **Die Trennbalken der herausgeschnittenen Blöcke** stehen jetzt als Dateikopf, wie in
   Welle 4. Ihr Wortlaut ist erhalten.

## 16  Risiken

1. **Der Kreis `export ↔ bookings`** (Abschnitt 12). Er ist heute harmlos — beide Seiten sind
   Bausteine, keine Zustandsträger —, aber er ist der erste, und er wird beim nächsten Merkmal
   zum Muster, wenn niemand ihn benennt.
2. **`api/types.ts` hängt weiter an `components/ExportStatus.tsx`.** Die Vertragsdatei führt
   `ExportStatus` aus einem Baustein ein. Beim Schließen von `shared/ui` muß diese Richtung
   umgedreht werden, sonst wandert der Vertrag mit.
3. **Kein Sicherheitshinweis.** Weder eine Route noch ein Rumpf, weder eine Kodierung noch eine
   Rundung, weder ein Pfad noch eine Prüfung ist berührt. Die Mengengleichheit der Abschnitte
   „api" und „ganz verschoben" (Abschnitt 8) und `proof:export-api` 72/0 sind der Beleg.

## 17  Offene Fragen

1. **`TemplatePreviewCard` ist tot** (Abschnitt 13). Streichen — mit Blick auf
   `docs/design/textbestand.md:530` — oder stehenlassen? Gehört in einen eigenen Auftrag.
2. **Soll der Kreis `export ↔ bookings` aufgelöst werden?** Wenn ja, gibt es genau zwei Wege,
   und beide erfinden eine Grenze: der Exportverlauf einer einzelnen Buchung nach `shared/`, oder
   `BookingFormDialog` dorthin. Ich habe keinen von beiden gewählt.
3. **`components/ExportStatus.tsx` und die vier anderen `shared/ui`-Kandidaten** — der Auftrag
   aus Welle 4, Abschnitt 12, steht weiter aus. Nach dieser Welle sind es fünf Bausteine
   derselben Sorte an zwei Orten.

## 18  Nächster Schritt

`shared/ui` schließen — **ein** Auftrag für `Primitives.tsx` (über dreißig Leser), `Menu.tsx`,
`FormDialog.tsx`, `FilterBar.tsx`, `ConfirmDialog.tsx`, `Select.tsx` und `ExportStatus.tsx`,
einschließlich der Umkehr von `api/types.ts → components/ExportStatus`. Danach ist `components/`
leer bis auf die Flächen, die noch kein Merkmal haben, und `screens/` hält noch sechs Dateien —
`DashboardScreen`, `SettingsScreen`, `StatusSettings`, `PoolFormDialog`, `PoolRenameDialog`,
`parts`. Das wäre Welle 6 und 7.
