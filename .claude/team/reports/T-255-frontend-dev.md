# T-255 — Welle 6 der Umstrukturierung: `features/settings` und `features/structure`

Aufgabe: T-255 — die letzten beiden Merkmale bauen
Status: **braucht Review** — beide Merkmale stehen, **alle Läufe grün**: `typecheck` (samt
`typecheck:test` und `typecheck:e2e`), `boundaries`, `contrast`, `proof:foreign`, `proof:surface`,
`proof:callers`, `proof:release-safety`, `proof:shell-surface`, `proof:all` (248/0, Ausgangskode 0),
`verify:bundle` (19/0), `test:coverage` (88 Dateien, 1570 bestanden, 3 übersprungen — **zeichengleich**
zu Welle 5), `build`.

E2E: **36 von 37** in den beauftragten und angrenzenden Dateien. Der eine rote Fall ist
`kanban.spec.ts:288` TP-KANBAN-04, **dieselbe Zeile 350 und dieselbe Zeichenkette** wie in T-251,
T-252 und T-253 — einer der fünf benannten. Dazu die fünf Fälle der Versionsprüfung über die
eigene Konfiguration: **5 von 5**, darunter TP-VER-13 („Installieren" öffnet die Release-Seite und
lädt nichts herunter"). Der Stand bleibt **106/5**.

**Deine Liste war an fünf Stellen falsch, und vier davon ändern den Zuschnitt der Welle.**
`app/StructureContext.tsx`, `lib/poolRule.ts`, `lib/folderPaths.ts` und `lib/movement.ts` ziehen
**nicht** um. Abschnitt 3 — mit der Messung, nicht mit einer Meinung.

`lib/releasePage.ts` liegt unverändert; wohin sie gehören würde, steht in Abschnitt 13.

---

## 1  Artefakte

### Neu — **neun** Quelldateien, **null** Umbenennungen, **null** Löschungen

| Datei | Zeilen | Was |
|---|---|---|
| `features/settings/api.ts` | 243 | vierzehn Routen und sechs merkmalseigene Typen |
| `features/settings/DataTransferSettings.tsx` | 170 | Bereich `daten` — Sicherung, Wiederherstellung, Fremdimport |
| `features/settings/ExportSettings.tsx` | 234 | Bereich `export` — Ordner, Vorlage, Rundung |
| `features/settings/DefaultTagSettings.tsx` | 80 | Bereich `standardtags` |
| `features/settings/AddinSettings.tsx` | 142 | Bereich `addin` — Tokenzustand und Ausstellung |
| `features/settings/StatusRow.tsx` | 226 | eine Zeile der Statusverwaltung, samt `StatusRowProps` |
| `features/settings/StatusFormDialog.tsx` | 131 | Status anlegen und umbenennen |
| `features/structure/api.ts` | 33 | **eine** Route (`createPool`) |
| `features/structure/ruleTerms.ts` | 57 | Tags und Ordner in **einer** Termliste |
| `docs/decisions/settings.md` | 100 | Vorgeschichte aus `features/settings/**` |
| `docs/decisions/structure.md` | 82 | Vorgeschichte aus `features/structure/**` |

**Neun** neue Quelldateien, keine gelöschte, keine umbenannte. Netto **+9** — dieselbe Zahl in
drei unabhängigen Zählern (Abschnitt 11).

### Verschoben (`git mv`, Inhalt außer Importzeilen unverändert)

```
screens/SettingsScreen.tsx          → features/settings/SettingsScreen.tsx
screens/StatusSettings.tsx          → features/settings/StatusSettings.tsx
components/WorkstationFacts.tsx     → features/settings/WorkstationFacts.tsx
components/OutlookSetup.tsx         → features/settings/OutlookSetup.tsx
components/UpdateDialog.tsx         → features/settings/UpdateDialog.tsx
app/PreferencesContext.tsx          → features/settings/PreferencesContext.tsx
app/UpdateNotice.tsx                → features/settings/UpdateNotice.tsx
app/useUpdateNotice.ts              → features/settings/useUpdateNotice.ts
lib/theme.ts                        → features/settings/theme.ts
lib/themePresets.ts                 → features/settings/themePresets.ts
lib/databaseLocationAdvice.ts       → features/settings/databaseLocationAdvice.ts
lib/startupAppearance.ts            → features/settings/startupAppearance.ts

screens/PoolFormDialog.tsx          → features/structure/PoolFormDialog.tsx
screens/PoolRenameDialog.tsx        → features/structure/PoolRenameDialog.tsx
components/RulePickers.tsx          → features/structure/RulePickers.tsx
components/RuleSummary.tsx          → features/structure/RuleSummary.tsx
```

**`screens/` hält jetzt noch zwei Dateien**: `DashboardScreen.tsx` und `parts.tsx`.
`components/` hält zwölf, davon acht die von dir für den `shared/ui`-Auftrag benannten.

### Angefaßt, aber nur die Importzeile (bzw. eine Pfadangabe im Kommentar)

`app/App.tsx`, `features/board/BoardColumn.tsx`, `features/board/BoardScreen.tsx`,
`features/tags/PoolAdministration.tsx`, `features/timer/TimerContext.tsx`,
`showcase/BoardSection.tsx`, `showcase/RuleSection.tsx`, `showcase/Showcase.tsx`,
`showcase/UpdateNoticeSection.tsx`, `showcase/WorkstationSection.tsx` — und
`api/endpoints.ts` / `api/types.ts`, aus denen der Einstellungsabschnitt herausgeschnitten ist,
sowie `features/export/api.ts` (ein Pfad im Kopfkommentar) und
`apps/web/design/DESIGNSYSTEM.md:1125` (ein Pfad im Fließtext, Datei in meiner Hoheit).

### `apps/web/test/**` — **eine** Pfadangabe, **keine** Zusicherung, wie erlaubt

| Datei | vorher | nachher |
|---|---|---|
| `test/components/liveRegionsAlwaysRendered.test.ts:119` | `../../src/screens/SettingsScreen.tsx` | **`../../src/features/settings/ExportSettings.tsx`** |

> **Derselbe Fall wie in Welle 5, und er gehört wieder gemeldet.** Die Meldefläche, die dieser
> Prüffall mißt (`role="status"` mit `field__error`, unbedingt im Baum, O-GQ/T-191), ist mit
> `ExportSettings` in die neue Datei gewandert. Die Zusicherung ist unverändert und mißt denselben
> Bau; **der Titel des Prüffalls sagt aber weiter „SettingsScreen.tsx"**. Den Titel habe ich
> **nicht** angefaßt — er ist Text im Prüfbestand und gehört unit-tester. Vorschlag in Abschnitt 14.

Sonst nichts in `apps/web/test/**`. `test/lib/movement.test.ts`, `test/lib/poolRule.test.ts`,
`test/app/undoDone.test.ts` und `test/lib/startupAppearance.test.ts` sind unberührt geblieben —
die ersten drei, weil ihre Ziele **nicht** umgezogen sind (Abschnitt 3).

---

## 2  Deine Liste, geprüft — **fünf** Korrekturen

| Deine Angabe | Gemessen | Folge |
|---|---|---|
| `screens/StatusSettings.tsx` 797 | **799** | — |
| **`app/StructureContext.tsx` → structure** | **23 Leser, drei davon unter `app/`** | **bleibt in `app/`**, Abschnitt 3 |
| **`lib/poolRule.ts` → structure** | **Leser unter `app/`** (`type RuleLookup`) | **bleibt in `lib/`**, Abschnitt 3 |
| **`lib/folderPaths.ts` → structure** | **Leser unter `app/`** (`flatFolders`) | **bleibt in `lib/`**, Abschnitt 3 |
| **`lib/movement.ts` → structure** | **null** Leser in `structure`, acht in vier anderen Merkmalen | **bleibt in `lib/`**, Abschnitt 3 |

Deine Liste nannte 6 119 Zeilen (die vier Dateien ohne Zahlenangabe mitgerechnet); gemessen
sind es **6 121**, davon ziehen **5 109** tatsächlich um. Die vier zurückbehaltenen Dateien sind
zusammen **1 012** Zeilen — und
`features/structure` ist damit deutlich kleiner, als sein Name vermuten läßt. Das ist kein
Mangel, sondern der Befund: Der **Aufbau** gehört keinem Merkmal, die **Flächen**, mit denen man
ihn bearbeitet, schon.

---

## 3  Die vier Dateien, die **nicht** umziehen — gemessen, nicht geraten

### `app/StructureContext.tsx` (265) — **23** Leser, und drei liegen unter `app/`

```
app/PreferencesContext.tsx*  app/useDataFreshness.ts   app/useUpdateNotice.ts*  app/App.tsx
features/board/{BoardColumn,BoardScreen,BoardSetupDialog}
features/export/{ExportScreen,TemplatesScreen}
features/tags/{PoolAdministration,TagAdministration,TagInput,TagsScreen}
features/todos/{TodoDetailAside,TodoDetailScreen,TodoFormDialog,TodoListScreen}
features/settings/{SettingsScreen,StatusSettings,StatusFormDialog,DataTransferSettings,
                   ExportSettings,DefaultTagSettings,PreferencesContext}
features/structure/{PoolFormDialog,PoolRenameDialog}
screens/DashboardScreen.tsx  showcase/TagsSection.tsx
```

Der eigene Kopfkommentar sagt, was die Messung bestätigt: „der Aufbau, den **fast jede** Ansicht
braucht". Ihn nach `features/structure/` zu ziehen hieße, Board, Tags, Todos, Export und
Einstellungen aus einem sechsten Merkmal zu bedienen — und, entscheidend, **`app/useDataFreshness.ts`
läse dann aus `features/`**. `app/` liegt unter den Merkmalen; das ist genau die Richtung, die
Welle 5 bei `previewExport` / `app/dayGroup.ts` nicht umgedreht hat.

Die mit `*` bezeichneten zwei sind in dieser Welle selbst nach `features/settings/` gewandert.
**Damit bleibt genau eine Datei unter `app/`, die keine Wurzel ist: `app/useDataFreshness.ts:3`
(`useStructure`)** — und die eine genügt. `app/App.tsx:21` montiert nur den `StructureProvider`
und ist als Wurzel unverdächtig. Die Liste oben ist der Stand **vor** dem Schnitt; danach ist der
Zähler höher, weil `SettingsScreen` und `StatusSettings` sich auf sechs Dateien verteilt haben.

`useRuleLookup` liegt in derselben Datei und wird von `features/board/BoardScreen` und
`features/tags/PoolAdministration` gelesen — sie ist die Brücke zwischen Aufbau und Regelmodell
und kann `useStructure` nicht verlassen.

### `lib/poolRule.ts` (614) — ein Leser unter `app/`, und der zwingt

```
app/StructureContext.tsx:21   import type { RuleLookup } from "../lib/poolRule";
features/board/{BoardColumn,BoardEmptyState,BoardSetupDialog}
features/tags/PoolAdministration.tsx
features/structure/{PoolFormDialog,RuleSummary}
showcase/{BoardSection,data,RuleSection}
```

Selbe Regel, selber Zwang: `StructureContext` bleibt in `app/` (oben), also bleibt `poolRule`
in `lib/`. Es ist außerdem eine Datei der Sorte `lib/labels.ts`, `lib/format.ts`,
`lib/deadline.ts` — ein Modell ohne Route und ohne JSX, das drei Merkmale und die Musterseite
lesen. **Es wäre eine reine Typeinfuhr**, und ich hätte sie rechtfertigen können; ich habe es
nicht getan, weil eine Ausnahme von „`app/` liegt unter den Merkmalen" beim nächsten Merkmal zur
Regel wird.

### `lib/folderPaths.ts` (30) — dasselbe, ohne Umschweife

Drei Leser: `app/StructureContext.tsx` (`flatFolders`), `features/tags/TagAdministration.tsx`,
`features/structure/PoolFormDialog.tsx`. Einer davon unter `app/`.

### `lib/movement.ts` (103) — **null** Leser in `structure`

```
features/board/BoardScreen.tsx        features/bookings/BookingDialogs.tsx
features/timer/{stopMessage,TimerContext,useReactivation}
features/todos/{TodoDoneSwitch,TodoListScreen,undoDone}
```

Acht Leser in **vier** Merkmalen, keiner in `features/structure`. Der Name täuscht — die Datei
heißt nach der *Pool*bewegung, aber sie ist der **Bewegungssatz nach einer Handlung** (E-058,
E-060) und gehört fachlich zum Timer und zu „Erledigt". Genau der Fall aus Welle 5, in dem
`app/exportSummary.ts` liegenblieb: **Der Name täuscht; die Leser täuschen nicht.**

---

## 4  `features/settings/api.ts` — **vierzehn** Routen, und **sechs**, die ausdrücklich draußen bleiben

Gewandert: `listSecurityNotices`, `getTokenStatus`, `rotateToken`, `createTodoStatus`,
`updateTodoStatus`, `deleteTodoStatus`, `reorderTodoStatuses`, `listDefaultTags`,
`setDefaultTags`, `exportDataArchive`, `importDataArchive`, `importTodoistFiles`,
`importSuperProductivity`, `getVersionCheck`.

**Sechs sind geblieben**, nach der Regel aus Welle 3 („Was mehrere Merkmale lesen, gehört keinem"):

| Route | Der Leser außerhalb | Warum das zwingt |
|---|---|---|
| `getSettings` | `app/StructureContext.tsx` | **`app/` liegt unter den Merkmalen** |
| `listTodoStatuses` | `app/StructureContext.tsx` | dito |
| `listPools` | `app/StructureContext.tsx` | dito |
| `updateSettings` | `features/export/TemplatesScreen.tsx` | schreibt die aktive Vorlage |
| `listExportTemplates` | `features/export` (zwei Stellen) | eine Route des **Exports** |
| `updatePool` | `features/board` (3 Dateien), `features/tags` | drei Merkmale schreiben darüber |

### Die Typen: **sechs** wandern, der Rest bleibt — und der Grund ist wieder ein Zwang

Gewandert: `SecurityNoticeKind`, `SecurityNotice`, `TokenStatus`, `IssuedToken`,
`DataImportSummary`, `VersionCheckView`.

Geblieben in `api/types.ts`: `AppSettings`, `AppSettingsUpdate`, `SettingsView`, `TodoStatus`,
`DefaultTag`, `Pool`, `PoolWrite`, `PoolPatch`, `PoolRuleTerm`, `PoolResolution`,
`PoolSurfaceQuery`. Alle hängen an einer Route, die in `api/endpoints.ts` geblieben ist, und
**`api/types.ts` darf aus `features/` nichts einführen**. Beide Begründungen stehen als
Kopfkommentar in den neuen Dateien.

**Kein `features/settings/types.ts` und kein `features/structure/types.ts`**, wie im Auftrag
entschieden.

### `features/structure/api.ts` hat **eine** Route, und ich sage es statt es zu verstecken

`createPool` ist die einzige Pool-Route mit genau einem Leser in diesem Merkmal. `updatePool`
teilen sich drei Merkmale, `deletePool` liest allein `features/tags/PoolAdministration.tsx`,
`listPools` liegt unter den Merkmalen. Eine `api.ts` mit einer Funktion ist wenig — aber E-102
verlangt sie eine Ebene tief, `proof:callers` findet sie über die Platte (nicht über den Namen),
und der Kopfkommentar schreibt aus, **warum** die anderen drei fehlen. Ein leerer Ordner ohne
`api.ts` hätte dieselbe Frage offen gelassen.

---

## 5  Die Schnitte — und die **acht**, gegen die ich mich entschieden habe

Kriterium wie in Welle 4 und 5: **Der Schnitt darf keine Eigenschaftsfläche erfinden**, und ein
Baustein unter 50 Zeilen mit einem einzigen Aufrufer bleibt stehen.

### Angenommen

| Aus | Heraus | Zeilen | Eigenschaften | vorher ausgeschrieben? |
|---|---|---|---|---|
| `SettingsScreen` 1023 → **411** | `DataTransferSettings.tsx` | 154 | **null** | — |
| | `ExportSettings.tsx` | 214 | **null** | — |
| | `DefaultTagSettings.tsx` | 70 | **null** | — |
| | `AddinSettings.tsx` | 119 | **null** | — |
| `StatusSettings` 799 → **452** | `StatusRow.tsx` | 218 | `StatusRowProps` — 11 | **ja** |
| | `StatusFormDialog.tsx` | 120 | `StatusFormDialogProps` — 4 | **ja** |
| `PoolFormDialog` 820 → **766** | `ruleTerms.ts` | 55 | kein JSX, kein Prop | — |

**Die vier Schnitte an `SettingsScreen` sind der stärkste Fall, den diese Umstrukturierung
bisher hatte: die Bausteine haben *null* Eigenschaften.** Es ist also nicht bloß so, daß nichts
erfunden werden mußte — es gibt gar keine Fläche, die man hätte erfinden können. Jeder holt
seinen Zustand selbst aus `useStructure`, `usePreferences`, `useToasts` und `useAsync`.

**Und die Schnittlinie ist nicht meine.** Sie ist `AREAS` — die acht Bereiche, die als Liste
dastehen, je eine eigene Adresse haben (`?bereich=export`), in `AREA_LIST` beschriftet sind und
über die `SettingsAreaPanel` bereits schaltet. Die Regel, die ich angewandt habe, in einem Satz:
**geschnitten wird an einem vorhandenen Trennbalken, wenn dieser Balken genau einen Bereich hält
und mehr als fünfzig Zeilen umfaßt.**

`ruleTerms.ts` ist der Fall `exportGroupLayout.ts` aus Welle 5: sechs reine Funktionen über
`readonly PoolRuleTerm[]`, unter einem eigenen Trennbalken, kein JSX. `hasFolder` bleibt
modulprivat — es hat genau einen Aufrufer im selben Modul, und eine tote Ausfuhr wäre der
Preis fürs Exportieren gewesen.

### Abgelehnt — der wichtigere Teil

1. **Der Trennbalken „Darstellung" bleibt ganz** (99 Zeilen, `DENSITY_LABEL` + `TimerSettings` 35
   + `DisplaySettings` 58). Er hält **zwei** Bereiche. Als **eine** Datei erfände er eine
   Gruppierung, die `AREAS` nicht kennt; als **zwei** Dateien käme `TimerSettings` mit 35 Zeilen
   und einem Aufrufer in eine eigene Datei — dieselbe Abwägung wie `BuiltinNotice`/`DeviationPanel`
   in Welle 5. Ich habe die Regel lieber konsequent angewandt als das Ergebnis schön gemacht.
2. **`WorkstationFacts` (45, lokale Karte) und `SecurityNotices` (42 + 7 `NOTICE_LABEL`) bleiben.**
   Beide unter 50, ein Aufrufer. Bei `WorkstationFacts` käme dazu, daß der Dateiname
   `WorkstationFacts.tsx` im selben Ordner **bereits belegt** ist — und auf diesem Dateisystem
   ist eine Unterscheidung allein über Groß-/Kleinschreibung kein Ausweg (der `TS1149` aus
   Welle 5).
3. **Die fünf großen JSX-Blöcke von `PoolFormDialog` bleiben im Dialog.** Gezählt, was sie
   kosteten: „Erforderliche Tags" **9** erfundene Eigenschaften, „Ausgeschlossene Tags" **6**,
   „Weitere Bedingungen" **8**, die Vorschau **4**, der `onSubmit`-Rumpf **9**. Alle über der
   Schwelle, die Welle 5 gezogen hat.
4. **Die zwei Warnbänder von `PoolFormDialog` bleiben.** 35 Zeilen, **zwei** erfundene
   Eigenschaften. Ich war hier am nächsten dran, weil der Quelltext die Gruppierung sogar beim
   Namen nennt („Die Warnbänder stehen **vor** der Vorschau") — und habe es an der 50-Zeilen-Marke
   gelassen. Wer die Marke anders zieht, bekommt hier einen sauberen Schnitt; ich ziehe sie nicht
   pro Datei neu.
5. **Die doppelte `describeRule`-Nachschlagetabelle in `PoolFormDialog` bleibt doppelt.** Sie
   steht zweimal — in `description` und im `onSubmit`. Sie zusammenzufassen wäre eine
   **Entdopplung**, nicht eine Verschiebung: Der Mengenvergleich in Abschnitt 8 wäre danach nicht
   mehr die Aussage, die er ist. Gemeldet, nicht erledigt (Abschnitt 15).
6. **`RulePickers.tsx` (362) wird nicht aufgeteilt.** `FolderPicker` und `StatusPicker` teilen
   `PickerField` (92 Zeilen), `PickerSource<T>` und die CSS-Familie `.tag-picker`. Derselbe Grund
   wie `ExportDirectoryField` in Welle 5 und `KanbanCard`/`KanbanColumn` in Welle 4.
7. **`PoolRenameDialog.tsx` (339) wird nicht aufgeteilt.** Eine Ausfuhr, ein Zweck, ein
   Hilfssatzbauer (`describeSurfaces`, 10 Zeilen) am Fuß.
8. **`FormSection` (30 Zeilen) bleibt in `PoolFormDialog`** — Abschnitt 12: sie ist ein
   `shared/ui`-Kandidat und gehört in **jenen** Auftrag, nicht in diesen.

---

## 6  Der Kreis, den es diesmal **nicht** gibt

```
settings  → export    : 2 Kanten  (ExportSettings → ../export/ExportDirectoryField,
                                                    ../export/exportDirectoryAdvice)
settings  → tags      : 1 Kante   (DefaultTagSettings → ../tags/TagInput)
settings  → todos     : 1 Kante   (StatusSettings → ../todos/api, zählt Todos je Status)
export    → settings  : 0
tags      → settings  : 0
todos     → settings  : 0
timer     → settings  : 1 Kante   (TimerContext → ../settings/PreferencesContext)
settings  → timer     : 0

structure → jedes Merkmal : 1 Kante  (PoolFormDialog → ../tags/TagInput)
board     → structure     : 3 Kanten (BoardColumn, BoardScreen ×2)
tags      → structure     : 3 Kanten (PoolAdministration)
structure → board / tags  : sonst 0
```

**Kein neuer Kreis.** `features/structure` hat genau **eine** ausgehende Merkmalskante und wird
von zwei Merkmalen gelesen — es ist die reine Unterschicht, die der Zuschnitt versprochen hat.
`features/settings` liest von drei Merkmalen und wird von keinem gelesen außer `features/timer`,
und diese eine Kante ist gerichtet und gegenrichtungsfrei.

**Die Kante `timer → settings` gehört benannt**, weil sie neu ist: `TimerContext.tsx:128` liest
`promptOnTimerStop`, `idleDetectionEnabled`, `idleKeepTimerRunning` und `idleThresholdMinutes`
aus `usePreferences()`. Sie ist der Grund, warum `PreferencesContext` überhaupt eine Frage war
(Abschnitt 7).

Der Rückgriff `features/settings/ → screens/parts` steht an zwei Stellen (`SettingsScreen`,
`AddinSettings`) — dieselbe Übergangsform wie in Welle 1 bis 5. `features/structure/` greift
**gar nicht** nach `screens/`.

`app/App.tsx → features/settings` (vier Einfuhren: `PreferencesProvider`, `UpdateNotice`,
`useUpdateNotice`, `SettingsScreen`) geht in die richtige Richtung — App ist die Wurzel, die
Merkmale zusammensetzt, genau wie bei `TimerProvider` aus `features/timer`.

---

## 7  `PreferencesContext` — die eine Entscheidung, die ich getroffen habe

`app/PreferencesContext.tsx` ist ein **anwendungsweiter** Zusammenhang wie `ToastContext` und
`RefreshContext`, und ich habe ihn trotzdem verschoben. Der Grund ist ein Präzedenzfall aus
Welle 3: **`features/timer/TimerContext.tsx` (706 Zeilen) liegt bereits in seinem Merkmal und
wird von `App.tsx` montiert.** Ein Zusammenhang darf in seinem Merkmal wohnen; die Wurzel montiert
ihn.

Drei Leser, und alle drei tragen:

- `app/App.tsx` montiert `PreferencesProvider` — die Wurzel, wie bei `TimerProvider`.
- `features/settings/SettingsScreen.tsx` und die Bereiche `darstellung` / `timer` **ändern** die
  Werte — das ist die Fläche S-09, und sie ist jetzt im selben Ordner.
- `features/timer/TimerContext.tsx` **liest** vier Werte — die neue Kante aus Abschnitt 6.

Was mich fast umgestimmt hätte, steht in `App.tsx:84` und blieb dort unangetastet: „Was hier
bleiben **muss**: `PreferencesProvider`. Er war nie das Zubehör des entfernten Feldes, sondern die
Stelle, an der die gespeicherte Wahl beim Start an das Wurzelelement geschrieben wird." Das ist
eine Aussage über die **Montage**, nicht über den **Ort der Datei** — und die Montage in `App.tsx`
ist unverändert.

Wenn du es anders willst, sind es vier Importzeilen zurück.

---

## 8  Der Mengenvergleich — der schärfste Nachweis

Verglichen wie in Welle 1 bis 5: Blockkommentare, Zeilenkommentare, JSX-Kommentare und
Einfuhrzeilen entfernt, verbleibende **Anweisungszeilen** gegen Leerraum normalisiert und als
**Mengen** verglichen. Gemessen gegen einen Abzug des Arbeitsbaums von **vor** dem ersten
Schnitt (nicht gegen `git show HEAD:…` — HEAD kennt Welle 1 bis 5 nicht; der Arbeitsbaum steht
227 Einträge vor HEAD).

| Vergleich | vorher | nachher | Ergebnis |
|---|---|---|---|
| die **13** ganz verschobenen Dateien | 1303 | 1303 | **CODE IDENTISCH** |
| `api/types` + `api/endpoints` → dieselben + `features/settings/api.ts` + `features/structure/api.ts` | 416 | 416 | **CODE IDENTISCH** |
| `SettingsScreen` → 5 Dateien | 717 | 716 | 4 `export`-Schwünge, **1** Streichung (unten) |
| `StatusSettings` → 3 Dateien | 475 | 475 | **5** Unterschiede |
| `PoolFormDialog` → 2 Dateien | 448 | 448 | **5** Unterschiede |

### Die **14** Unterschiede aus dem Aufteilen, einzeln

```
function DataTransferSettings() {          → export function DataTransferSettings() {
function ExportSettings() {                → export function ExportSettings() {
function DefaultTagSettings() {            → export function DefaultTagSettings() {
function AddinSettings() {                 → export function AddinSettings() {
type MoveHandleKey = `${Id}:up` | …        → export type MoveHandleKey = `${Id}:up` | …
interface StatusRowProps {                 → export interface StatusRowProps {
function StatusRow({                       → export function StatusRow({
interface StatusFormDialogProps {          → export interface StatusFormDialogProps {
function StatusFormDialog({ open, … })     → export function StatusFormDialog({ open, … })
function tagIdsOf(terms: …)                → export function tagIdsOf(terms: …)
function withTagIds(terms: …)              → export function withTagIds(terms: …)
function folderIdsOf(terms: …)             → export function folderIdsOf(terms: …)
function toggleFolder(terms: …)            → export function toggleFolder(terms: …)
function sameTerms(draft: …)               → export function sameTerms(draft: …)
```

Vierzehn `export`-Schlüsselwörter an Deklarationszeilen. **Kein Ausdruck geändert, keine Zeile
hinzugefügt, kein Argument erfunden.** Anders als in Welle 5 gibt es diesmal **keinen** Schnitt
mit selbstgeschriebener Eigenschaftsfläche.

### Die eine Streichung — und sie ist keine Codezeile

```
- {}
```

Der Rest eines JSX-Kommentars. Der Zähler zählt `{}` als Anweisungszeile, sobald der Kommentar
darin entfernt ist; ich habe **einen** JSX-Kommentar samt seiner Klammern ins Papier verschoben
(den Farbmodus-Rückblick in `ExportSettings.tsx`, Abschnitt 9). Nachgemessen: `SettingsScreen`
trug vorher **6** solcher `{}`-Reste, die fünf Dateien tragen nachher **5**. Es ist die
Verschiebung eines Kommentars, kein Codeeingriff.

**Keine Zahl hat sich bewegt.** Rundung, Base64, Exportstatus und Notiz-Trennung sind an keiner
Stelle berührt; die Mengengleichheit der beiden Abschnitte „api" und „ganz verschoben" ist der
Beleg, `proof:all` mit 248/0 und `test:coverage` mit 1570 zeichengleichen Prüffällen der zweite.

---

## 9  Kommentare — was wanderte, was blieb

Nach demselben mechanischen Kriterium wie in Welle 1 bis 5: Rückblick, der nichts mehr anweist,
geht ins Papier. **Sechs Blöcke**, vier nach `settings.md`, zwei nach `structure.md`:

| Woher | Was | Wohin |
|---|---|---|
| `SettingsScreen.tsx`, Kopf | „Bis T-036 stand hier ein Freitextfeld mit dem Platzhalter `C:\Takt\Export` …" | settings.md |
| `SettingsScreen.tsx`, Kopf | „Bis T-057 standen hier fünf Karten untereinander … 2379 Pixel in einem 820 Pixel hohen Fenster" | settings.md |
| `ExportSettings.tsx` | „Der Farbmodus stand bis T-057 auf dieser Karte …" (der ganze JSX-Kommentar) | settings.md |
| `StatusSettings.tsx`, Kopf | „Mit dem Board-Dialog ist in T-072 das letzte Bedienelement … A-5.4 war unbedient." | settings.md |
| `RuleSummary.tsx`, Kopf | „Bis T-079 war sie an zwei dieser Stellen getippt und an der dritten gar nicht …" | structure.md |
| `RuleSummary.tsx`, Kopf | „Bis T-094 borgte sich diese Achse `ExportStatusBadge` … zwei Wörter." | structure.md |

Die **Regel** jedes Blocks steht weiter im Quelltext: „Die Beurteilung des Pfades ist die
Erklärung, nicht die Grenze", „Jeder Bereich hat eine eigene Adresse, deshalb ist die Leiste eine
`<nav>`", „Der Farbmodus liegt im Bereich Darstellung, dort ohne Speichern-Knopf", „Der Status ist
eine Stammgröße wie die Standard-Tags", „Die Zusammenfassung wird **einmal** gebaut", „Eine Regel
ist keine Buchung — das Buchungsetikett bleibt, wo Buchungen stehen". Drei Dateien tragen
„Vorgeschichte: `docs/decisions/settings.md`", eine „… `structure.md`".

### Zwei Regelblöcke sind **mit ihrem Gegenstand** umgezogen, nicht ins Papier

Der Kopf von `SettingsScreen.tsx` beschrieb zwei Flächen, die jetzt in eigenen Dateien liegen.
Ein Kommentar, der eine Fläche erklärt, die drei Dateien weiter steht, ist ein Kommentar am
falschen Ort — deshalb:

- **„Das Add-in-Token steht genau einmal auf dem Bildschirm" (E-009)** → Kopf von
  `AddinSettings.tsx`, wortgleich.
- **„Der Exportordner wird gewählt, nicht getippt" (Befund S-04)**, Regelteil → Kopf von
  `ExportSettings.tsx`.

### Stehengelassen, mit Begründung — **fünfzehn**, und **elf** hat ein Prüfer verlangt

Von einem Prüfer verlangt — **kein Satz davon ist gefallen** (E-078 Punkt 3):

1. `ExportSettings.tsx`, der Kommentar am leeren Meldebehälter — **B-5, T-162, T-186, O-GQ, T-191**.
2. `RulePickers.tsx`, derselbe Kommentar am Ladehinweis — **B-5, T-191, O-GQ-7**.
3. `RulePickers.tsx`, der ganze Kopf („Drei Zustände statt einem") — **B-5 aus R-2, Abschnitt 15**.
4. `PoolFormDialog.tsx`, `folderSource`/`statusSource` — **B-5 aus R-2, Abschnitt 15**.
5. `PoolFormDialog.tsx`, „Vier Bedienelemente, vier Namen" — **S-7 aus R-2, SC 1.3.1**.
6. `PoolFormDialog.tsx`, der Toast nach dem Speichern — **S-9 aus R-2**.
7. `PoolFormDialog.tsx`, „Die Warnbänder stehen **vor** der Vorschau" — **R-2, Abschnitt 9**.
8. `PoolFormDialog.tsx`, der ST-05-Kommentar zum entfallenen Kasten — **T-181**. Ich war hier nah
   dran, ihn zu verschieben, und habe es gelassen: **Ein Satz aus dem Textabbau fällt nicht beim
   Aufräumen** — dieselbe Zurückhaltung wie bei den ST-07-Sätzen in Welle 5.
9. `SettingsScreen.tsx`, die drei ST-04-Kommentare (`AREA_LIST`-Zusatz, „Kein `lead` mehr",
   „Arbeitsplatz" statt „Dieser Arbeitsplatz") — **T-181, Auflage Z-12 aus T-177**.
10. `StatusSettings.tsx`, die zwei ST-04/ST-05-Kommentare zur Bereichsbeschreibung — **T-181**.
11. `PoolRenameDialog.tsx`, `UNCHANGED_HINT` — **T-220, T-221 Z-74**.

Weil sie eine Wiederholung verhindern: der ganze T-144-U-01/T-147-Block in `useUpdateNotice.ts`
(warum der Hinweis mitten in der Sitzung eine Leiste und kein Dialog ist), der ganze Kopf von
`UpdateDialog.tsx` (A-18.7 keine Vorauswahl, A-18.9 es wird nichts heruntergeladen), die
„Vier Dinge, die dieses Formular nicht stillschweigend tun darf" in `PoolFormDialog.tsx`, der
T-042-Satz in `WorkstationFacts.tsx` (er begründet, warum die Karte existiert) und der
`reihenfolge`-Kommentar an `reorderTodoStatuses` — **`proof:callers` setzt genau diesen Namen als
Probe ein**, der Kommentar steht neben der Stelle, die der Wächter mißt.

**Kein Oberflächentext gestrichen und kein zugänglicher Name geändert** (E-087). Gegenprobe:
`contrast` (261 Paare, 0 von 522, 83/83 Farbtoken, 11/11), `proof:surface` (29 Live-Regionen,
2 geduldete Sätze), `proof:codepoints` und `proof:addin` Abschnitt 20 (die Sperrliste) in
`proof:all`, und die 1570 Prüffälle — alle **zeichengleich**. Die Musterseite
(`showcase/InventorySection.tsx`) nennt `WorkstationFacts.tsx` und `StatusSettings.tsx`
**ohne Ordner**; dort ändert sich nichts.

---

## 10  Die E2E-Läufe — einzeln über `tests/e2e/playwright.config.ts`

```
✓ startup-appearance.spec.ts:3        gecachte Darstellung bleibt sichtbar,
                                      bis die maßgeblichen Einstellungen kommen  (0.9 s)
✓ timer-prompt-setting.spec.ts:5      A-22.1 — Leistungsabfrage aus, direkt buchen,
                                      wieder ein                                 (4.9 s)
✓ timer-prompt-setting.spec.ts:50 ×2  Timerwechsel berücksichtigt die Abfrage     (6.5 s)
✓ board-empty-state-rule-chain:40     TP-KANBAN-08 — „Erste Spalte einrichten"
                                      öffnet die Regel-Definition                (2.1 s)
✓ pool-movement-sentence.spec.ts ×4   Bewegungssatz gegen den Aufgabenbereich     (3.0 s)
✓ tag-folder-rule-lock.spec.ts ×5     Regelsperre: Tag, Ordner, Status           (7.2 s)
                                      ────
                                  14 von 14 bestanden (27.3 s)
```

Zusätzlich gegengemessen, weil sie an dieselben Flächen greifen — `kanban`,
`field-live-region-announcement`, `focus-return-after-dialog`, `form-dialog-submit-guard`,
`tags-folders`: **17 bestanden, 1 rot**. Der rote ist

```
✘ kanban.spec.ts:288  TP-KANBAN-04
  Error: expect(locator).not.toHaveClass(expected) failed
    Expected pattern: not /kcard--running/
    Received string: "kcard kcard--running kcard--reactivated"
    at tests\e2e\kanban.spec.ts:350:36
```

— **zeichengleich zu dem, was T-253 gemessen hat**: dieselbe Datei, dieselbe Zeile 350, dieselbe
Zusicherung, dieselbe empfangene Zeichenkette. Einer der fünf benannten, nicht meiner. Ich habe
ihn einzeln nachgemessen (zwei Läufe, beide rot) statt es zu behaupten.

Und die eigene Konfiguration der Versionsprüfung, weil `useUpdateNotice`, `UpdateNotice`,
`UpdateDialog` und `releasePage` in dieser Welle liegen:

```
✓ TP-VER-10  Dialog nennt beide Fassungen und den Verweis, ohne Vorauswahl   (0.7 s)
✓ TP-VER-11  „Überspringen" überlebt geleerten Browserspeicher und Neustart  (12.6 s)
✓ TP-VER-12  eine höhere Fassung meldet sich trotz Überspringens             (11.3 s)
✓ TP-VER-13  „Installieren" öffnet die Release-Seite und lädt nichts herunter (0.9 s)
✓ E-077      ohne installedVersion bleibt der Dialog aus                     (0.5 s)
                                      ────
                                   5 von 5 bestanden
```

---

## 11  Zahlen — vorher gemessen, nicht zitiert

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | grün | **grün** (samt `typecheck:test`, `typecheck:e2e`) |
| `pnpm boundaries` | **442** Quelldateien außerhalb der Domäne | **451** (+9), „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | 261 Paare, 0 von 522, 83/83 Farbtoken, 11/11 Gegenproben | **zeichengleich** |
| `pnpm run proof:foreign` | 21/0 — **157** Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen | 21/0 — **166**, sonst zeichengleich |
| `pnpm run proof:surface` | 27/0 — **157** Quelldateien, 29 Live-Regionen, 2 geduldete Sätze | 27/0 — **166**, sonst zeichengleich |
| `pnpm run proof:callers` | 74/0, **7** Aufrufdateien, 6 zu 6, 92 Typen aus 8 | 74/0, **9** Aufrufdateien, **8 zu 8**, 92 Typen aus **10** |
| `pnpm run proof:release-safety` | 32/0 | **32/0** — „die Adresse der Release-Seite steht an den zwei gemessenen Orten (2)" |
| `pnpm run proof:shell-surface` | 7 Prüfungen, 54 Gegenproben | **zeichengleich** |
| `pnpm run proof:all` | 248 bestanden, 0 fehlgeschlagen | **248 / 0**, Ausgangskode 0 |
| `pnpm run verify:bundle` | 19/0 | **19/0** |
| `pnpm test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `apps/web` `pnpm build` | grün | grün |

**Die einzige Zahl, die sich bewegt hat, ist dieselbe in drei unabhängigen Zählern: +9.**
`boundaries` zählt über den Modulgraphen, `proof:foreign` über den TypeScript-Übersetzer,
`proof:surface` über den eigenen Sammler. Neun neue Quelldateien, keine gelöschte, keine
umbenannte.

`proof:callers` nennt jetzt neun Aufrufdateien: `api/endpoints.ts`, `features/board/api.ts`,
`features/bookings/api.ts`, `features/export/api.ts`, **`features/settings/api.ts`**,
**`features/structure/api.ts`**, `features/tags/api.ts`, `features/timer/api.ts`,
`features/todos/api.ts`. Die `reihenfolge`-Probe trägt jetzt `features/settings/api.ts` statt
`api/endpoints.ts` — der Wächter hat den Umzug **selbst gefunden**, ohne daß ich ihm etwas gesagt
hätte.

### Zeilen

| Datei | vorher | nachher |
|---|---|---|
| `SettingsScreen.tsx` | 1023 | **411** |
| `StatusSettings.tsx` | 799 | **452** |
| `PoolFormDialog.tsx` | 820 | **766** |
| `api/types.ts` | 917 | **838** (−79) |
| `api/endpoints.ts` | 309 | **186** (−123) |

Größte Datei im Baum bleibt `features/export/ExportScreen.tsx` mit 979. Größte in dieser Welle:
`features/structure/PoolFormDialog.tsx` mit 766 — und dazu, was ich statt eines schönen Ergebnisses
gemessen habe, steht in Abschnitt 5.

### Bündel

`SettingsScreen` 43,45 kB / gzip 14,87 kB als eigenes, träge geladenes Stück; die vier neuen
Bereichsdateien und `StatusRow`/`StatusFormDialog` liegen darin und nicht im Eingangsstück.
`PoolRenameDialog` 22,59 kB trägt das Regelformular samt Auswahlen und Zusammenfassung.
`index` 487,00 kB.

**Einen Vorher-Wert für diese beiden Stücke habe ich nicht genommen**, und das sage ich, statt
eine Zahl zu erfinden. Was ich statt dessen **gemessen** habe, ist die Frage, auf die es bei einer
`api.ts`-Verschiebung ankommt — ob sich verschiebt, was **eifrig** geladen wird:

```
/data-transfer/archive    index: ja   SettingsScreen-Stück: nein
/security/notices         index: ja   SettingsScreen-Stück: nein
/version-check            index: ja   SettingsScreen-Stück: nein
/todo-statuses/order      index: ja   SettingsScreen-Stück: nein
/settings/default-tags    index: ja   SettingsScreen-Stück: nein
/pools                    index: ja   SettingsScreen-Stück: nein   (Vergleichswert, blieb in endpoints)
```

Alle vierzehn Routen liegen im Eingangsstück — **genau dort, wo sie vorher als Teil von
`api/endpoints.ts` auch lagen**. Der Grund ist `features/settings/useUpdateNotice.ts`: `App.tsx`
führt es eifrig ein, damit hängt `features/settings/api.ts` am Eingangsstück. **Keine Änderung,
und sie ist gemessen statt vermutet.**

---

## 12  Bausteine für den `shared/ui`-Auftrag — **nicht** mitgenommen, benannt

Wie beauftragt.

1. **`FormSection`** (`features/structure/PoolFormDialog.tsx:196`, 30 Zeilen). Sie nimmt
   `title`, `lead`, `children` und kennt keine Route — das Kriterium aus Welle 2, wörtlich.
   **Und sie ist bereits zweimal da**: `showcase/RuleSection.tsx:395` baut dasselbe Markup
   (`<div className="form-section">`, `<h3 className="form-section__title">`) von Hand nach.
   `styles/app.css:1167-1186` und `styles/components.css:364-366` tragen die Klassenfamilie.
   Das ist derselbe Fall wie `ExportSummaryStrip` in Welle 4, nur eine Runde früher entdeckt.
2. **`components/RadioRow.tsx`** (160 Zeilen, **vier** Leser: `features/settings/SettingsScreen`,
   `features/structure/PoolFormDialog`, `features/todos/AttachmentFormDialog`,
   `showcase/RuleSection`). Nimmt Werte, kennt keine Route, wird von **drei** Merkmalen gelesen.
   Er stand nicht auf deiner Liste für jenen Auftrag; er gehört dazu.

Beide **nicht angefaßt**. Ein Schnitt, der nicht zur Aufgabe gehört, wird nicht nebenbei gemacht.

---

## 13  `lib/releasePage.ts` — wohin sie gehören würde

Wie beauftragt gemessen und **nicht** bewegt.

**Sie gehörte nach `features/settings/releasePage.ts`.** Zwei Leser, beide dort oder daneben:
`features/settings/useUpdateNotice.ts:7` und `showcase/UpdateNoticeSection.tsx:4`, beide
`releasePageUrl`. **Kein** Leser unter `app/`, kein
Leser in einem anderen Merkmal — sie ist die einzige der Welle-6-Kandidatinnen, deren Umzug
fachlich wie technisch völlig unstrittig wäre.

Genau deshalb ist die Begründung dafür, sie liegen zu lassen, eine gute: Sie steht als **fester
Pfad** in `apps/local-api/scripts/proof-release-safety.mjs:302` in
`RELEASE_PREFIX_FILES`, und `apps/desktop/scripts/proof-shell-surface.mjs:38` nennt sie im
Kopfkommentar. Der Umzug ist damit **ein Auftrag über drei Hoheiten**: `apps/web` (die Datei),
`apps/local-api` (der Wächter) und `apps/desktop` (der Kommentar). Er ist eine Zeile Code und drei
Zeilen Absprache, und er muß in **einem** Auftrag laufen — sonst ist der einzige Zeuge dafür, daß
keine zweite Adresse im Baum steht, für die Dauer der Welle rot.

`proof:release-safety` ist nach dieser Welle grün (32/0, „die Adresse der Release-Seite steht an
den zwei gemessenen Orten (2)").

---

## 14  Was in fremder Hoheit nachzuziehen ist

Ich habe nichts davon angefaßt.

1. **`apps/web/test/components/liveRegionsAlwaysRendered.test.ts:118`** — der Titel des Prüffalls
   sagt „SettingsScreen.tsx", gemessen wird jetzt `ExportSettings.tsx`. Der Pfad ist nachgezogen,
   der Titel nicht. **unit-tester.** (Dieselbe Sorte wie der `TemplateFields.tsx`-Titel aus
   Welle 5 — der steht noch aus; beide zusammen wären ein Auftrag.)
2. **`docs/design/textbestand.md:303, 310, 462, 894, 961, 1674`** und
   **`textabbau-gestalt.md:789, 1419-1420`** — nennen `lib/databaseLocationAdvice.ts`,
   `app/useUpdateNotice.ts`, `screens/SettingsScreen.tsx:134-171`,
   `screens/PoolFormDialog.tsx:664`, `components/RulePickers.tsx:308`, teils **mit
   Zeilennummern**, die durch die Schnitte verrutscht sind. **ui-designer / ux-designer.**
3. **`tests/e2e/web-build-smoke.spec.ts:171`** — ein Kommentar nennt
   `components/WorkstationFacts.tsx`. Keine Zusicherung; der Fall läuft. **e2e-tester.**
4. **`.claude/team/board.md:1327, 1426, 1446`** — die offenen Punkte O-BH, O-FG und O-GA nennen
   `apps/web/src/app/useUpdateNotice.ts` und `lib/poolRule.ts`. Der zweite Pfad stimmt weiterhin,
   der erste heißt jetzt `apps/web/src/features/settings/useUpdateNotice.ts`. **Orchestrator.**
5. **Berichte in `.claude/team/reports/**`** nennen die alten Pfade an rund achtzig Stellen. Sie
   sind Protokoll eines Standes und werden nach meiner Lesart **nicht** nachgezogen — gemeldet,
   damit die Entscheidung ausdrücklich ist und nicht durch mein Schweigen fällt.

---

## 15  Zwei Befunde, die nicht meine sind

1. **`usePrefersReducedMotion` (`features/settings/theme.ts:84`) ist exportiert und hat keinen
   Leser** — gemessen über den ganzen Baum einschließlich `apps/web/test/**` und `tests/**`.
   Sie stammt aus T-006, dem Designsystem-Auftrag. **Ich habe sie nicht angefaßt**: Eine tote
   Ausfuhr zu streichen ist eine Streichung, keine Verschiebung, und sie fällt unter E-081 Punkt 4.
   Derselbe Fall wie `TemplatePreviewCard` aus Welle 5, der noch offen ist.
2. **`IssuedToken` hat ebenfalls keinen Leser.** `rotateToken` gibt einen inline geschriebenen Typ
   zurück, der Feld für Feld derselbe ist. Ich habe den Typ **mitgenommen** statt ihn
   zurückzulassen — er beschreibt, was eine Route zurückgibt, die umgezogen ist, und ein Typ ohne
   seine Route ist schlechter aufgehoben als ein toter Typ neben ihr. Er steht jetzt mit einem
   Satz dazu in `features/settings/api.ts:74`. **Streichen oder `rotateToken` darauf umstellen ist
   eine eigene, kleine Aufgabe** — beides ändert eine Zusage über eine Antwort und gehört nicht
   in eine Verschiebewelle.
3. **Die `describeRule`-Nachschlagetabelle steht in `PoolFormDialog.tsx` zweimal** (Abschnitt 5,
   abgelehnter Schnitt 5). Neun Zeilen, zeichengleich, einmal in `description` und einmal im
   `onSubmit`. Eine Entdopplung wäre richtig und ist **kein** Umbau nach Merkmalen.

---

## 16  Annahmen

1. **`PreferencesContext` liegt jetzt in `features/settings/`.** Begründet in Abschnitt 7, mit
   dem Präzedenzfall `TimerContext`. Vier Importzeilen zurück, wenn du es anders willst.
2. **`StructureContext`, `poolRule`, `folderPaths` und `movement` bleiben liegen.** Begründet in
   Abschnitt 3, jede einzeln gemessen. Das macht `features/structure` klein — bewußt.
3. **Die Schnittlinie in `SettingsScreen` ist `AREAS`**, mit der Fünfzig-Zeilen-Schwelle aus
   Welle 5. Deshalb bleiben `TimerSettings`, `DisplaySettings`, die lokale
   `WorkstationFacts`-Karte und `SecurityNotices` im Bildschirm.
4. **`features/structure/api.ts` hat eine einzige Route.** Ich halte E-102 wörtlich, statt den
   Ordner ohne `api.ts` zu lassen.
5. **Zwei Regelblöcke sind mit ihrem Gegenstand umgezogen** statt ins Papier zu gehen
   (Abschnitt 9). Ihr Wortlaut ist erhalten.
6. **Zwei Einfuhrpfade sind normalisiert**: `../../features/todos/api` → `../todos/api` und
   `../../features/tags/TagInput` → `../tags/TagInput`. Reine Schreibweise, angeglichen an die
   Form, die `features/export`, `features/board` und `features/bookings` bereits benutzen.

## 17  Risiken

1. **Die Kante `timer → settings`** (Abschnitt 6). Sie ist heute harmlos und gerichtet, aber sie
   ist neu, und `TimerContext` ist der schwerste Zustandsträger des Bestandes. Wer dort etwas
   ergänzt, das aus `features/settings` liest, schafft leicht den Kreis, den es heute nicht gibt.
2. **`features/structure` ist der einzige Merkmalsordner ohne sein Modell.** `lib/poolRule.ts`
   (614 Zeilen) ist fachlich seine Mitte und liegt aus einem technischen Grund daneben
   (Abschnitt 3). Fällt der Grund weg — etwa weil `useRuleLookup` einmal aus `StructureContext`
   herausgelöst wird —, gehört die Datei nachgeholt. Bis dahin ist der Kopfkommentar von
   `docs/decisions/structure.md` die einzige Stelle, an der das steht.
3. **Kein Sicherheitshinweis.** Weder eine Route noch ein Rumpf, weder eine Kodierung noch eine
   Rundung, weder ein Pfad noch eine Prüfung ist berührt. Ausdrücklich nachgemessen an den drei
   Stellen, die der Auftrag benannt hat: `OutlookSetup.tsx` ist **zeichengleich** verschoben
   (Abschnitt 8, „die 13 ganz verschobenen Dateien: CODE IDENTISCH") — die Bestätigungsfläche für
   `Cert:\CurrentUser\Root`, der Fingerabdruck-Dialog und der Satz zur Windows-Sicherheitsabfrage
   sind unverändert; `useUpdateNotice.ts` und `UpdateDialog.tsx` ebenso, und TP-VER-13 („lädt
   nichts herunter") ist gefahren und grün; `proof:release-safety` 32/0 und `proof:shell-surface`
   zeichengleich.

## 18  Offene Fragen

1. **`usePrefersReducedMotion` und `IssuedToken` sind tot** (Abschnitt 15). Zusammen mit
   `TemplatePreviewCard` aus Welle 5 sind das drei tote Ausfuhren — ein gemeinsamer, kleiner
   Streichauftrag wäre billiger als drei einzelne, und E-081 Punkt 4 verlangt ihn ohnehin
   zusammen mit dem Ausgleich.
2. **Soll `lib/releasePage.ts` umziehen?** Abschnitt 13 nennt Ziel und Preis: drei Hoheiten, ein
   Auftrag. Ich habe sie nicht angefaßt.
3. **Werden Pfadangaben in `.claude/team/reports/**` nachgezogen?** (Abschnitt 14 Punkt 5.) Ich
   halte sie für Protokoll und lasse sie stehen; die Entscheidung gehört ausdrücklich getroffen,
   weil es rund achtzig Stellen sind.
4. **`deletePool` hat nach dieser Welle genau einen Leser: `features/tags/PoolAdministration.tsx`.**
   Nach der Regel gehörte er in `features/tags/api.ts`. Ich habe `features/tags` nicht angefaßt —
   dieses Merkmal ist seit T-250 abgenommen, und eine Route hineinzuschieben ist kein Nebenbei.

## 19  Nächster Schritt

**`shared/ui` schließen** — der Auftrag aus Welle 4/5, jetzt um zwei Bausteine reicher:
`Primitives.tsx`, `Menu.tsx`, `FormDialog.tsx`, `FilterBar.tsx`, `ConfirmDialog.tsx`,
`Select.tsx`, `ExportStatus.tsx`, `screens/parts.tsx` **plus `RadioRow.tsx` und `FormSection`**
(Abschnitt 12), einschließlich der Umkehr `api/types.ts → components/ExportStatus`.

Danach hält `screens/` nur noch `DashboardScreen.tsx`, und `components/` nur noch, was kein
Merkmal hat: `DialogSurface.tsx`, `InfoDialog.tsx`, `InfoHint.tsx`, `ShellStatus.tsx`. Das wären
zwei kleine Wellen und der Umbau wäre fertig.
