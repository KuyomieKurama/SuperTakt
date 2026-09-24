# T-258 — `components/` auflösen: die letzte Welle in `apps/web`

Aufgabe: T-258
Status: **braucht Review**

> ## Das Ergebnis in zwei Zahlen
>
> ```
> apps/web/src, .ts + .tsx     42 721  →  42 721      Δ = 0
> Dateien                         169  →     169      Δ = 0
> ```
>
> **Es gibt diesmal keinen Größenbeleg mit Posten, weil es nichts zu verrechnen gibt.**
> Drei Dateien haben den Ort gewechselt, sechs Zeilen haben sich geändert — fünf
> Einfuhrpfade und ein Kommentarpfad. Kein Rumpf, kein Satz, kein Zustand.
>
> **`components/` gibt es nicht mehr.** Unter `apps/web/src` steht genau, was
> beauftragt war: `api/`, `app/`, `features/`, `lib/`, `shared/`, `showcase/`,
> `styles/` und die zwei Wurzeldateien `designsystem.tsx` und `main.tsx`.
>
> **E2E ist diese Runde nicht meßbar** — nicht flaky, nicht rot, sondern gar nicht
> gestartet. **Eine** Zeile in fremder Hoheit blockiert **jede** der fünf
> Playwright-Konfigurationen (Abschnitt 8). Ich berichte keine Zahl, die ich nicht
> gemessen habe.

---

## 1  Deine Liste, nachgemessen — sie stimmt diesmal

Du hast sie selbst als geraten angekündigt. Sie war richtig, und zwar vollständig:

```
apps/web/src/components/   InfoDialog.tsx     78 Zeilen
                           InfoHint.tsx       15
                           ShellStatus.tsx   845
                           ————————————————— 938, und sonst nichts
```

Drei Dateien, keine vierte, kein Unterordner. Auch die Zuordnung hält der Messung stand.

### Die Leser, namentlich — Kriterium wie in T-256

Gezählt sind **Merkmale** (`features/<name>/`). `app/`, `api/` und `showcase/` zähle ich
**nicht** als Merkmal mit — dieselbe Regel, mit der `FormSection` in Welle 7 **nicht** nach
`shared` gekommen ist. Sonst wäre sie eine Regel für einen Fall.

| Datei | Merkmale | Leser, jeder einzeln | Ziel |
|---|---|---|---|
| `InfoDialog.tsx` | **1** — bookings | `features/bookings/BookingDialogs.tsx:14` | `features/bookings/` |
| `InfoHint.tsx` | **1** — export | `features/export/ExportScreen.tsx:36` | `features/export/` |
| `ShellStatus.tsx` | **0** | `app/App.tsx:12`, `app/connection.ts:63`, `showcase/ShellStateSection.tsx:10` | `app/` |

**Zwei Textfunde sind keine Einfuhr**, und das ist derselbe Fallstrick, an dem in T-256 der
vierte `ExportTabs`-Treffer hing:

- `shared/ui/DialogSurface.tsx:19` nennt `InfoDialog` in einem Satz über die Vorgeschichte
  („Bis T-152 führten `FormDialog`, `ConfirmDialog`, `InfoDialog` und …"). Kein Import.
- `showcase/InventorySection.tsx:278` trägt `file: "InfoDialog.tsx"` — ein **Oberflächentext**
  im Komponenteninventar, ein blanker Dateiname ohne Verzeichnis. Er wandert nicht mit, weil
  er keinen Ort behauptet. Ich habe ihn ausdrücklich **nicht** angefaßt: Es ist ein Satz auf
  dem Bildschirm, und E-087 gilt auch für einen, der nur nach einem Pfad aussieht.

### `ShellStatus.tsx` nach `app/`, nicht nach `features/shell/`

Es hat **null** Merkmale als Leser — die Zuordnung entsteht also nicht durch Zählen, sondern
durch dieselben drei Messungen, mit denen `DashboardScreen` in T-256 nach `app/` ging:

1. **`app/connection.ts` liest zwei Typen daraus** (`ShellStateSnapshot`, `UserNameFinding`).
   Läge die Datei in einem Merkmal, zeigte eine Kante von `app/` **hinunter** in ein Merkmal,
   nur um einen Zustand zu beschreiben, den die Hülle liefert.
2. **`app/App.tsx` lädt sie nicht faul.** Sie steht in der obersten Zeile der Anwendung, vor
   Navigation und Inhalt (`App.tsx:303`) — im Bündel der Hülle, nicht in einem nachgeladenen
   Merkmal.
3. **Sie hat keine `api.ts`** und keine Route im Dienst. Ihre Quelle ist
   `@takt/desktop/shell`, als reiner Typimport.

**Abgelehnt: `features/shell/`.** Ein Merkmalsordner für eine Datei, die kein Gegenstand
neben Todos und Timer ist, sondern der Zustand der Hülle selbst.

---

## 2  Artefakte

### Verschoben (`git mv`, 3 Dateien)

```
components/ShellStatus.tsx  →  app/ShellStatus.tsx                0 Zeilen geändert
components/InfoDialog.tsx   →  features/bookings/InfoDialog.tsx   3 Einfuhrzeilen
components/InfoHint.tsx     →  features/export/InfoHint.tsx       1 Einfuhrzeile
```

**`ShellStatus.tsx` ist sha256-gleich** verschoben, Byte für Byte:

```
c11d8896…f4f0923   vorher   components/ShellStatus.tsx
c11d8896…f4f0923   nachher  app/ShellStatus.tsx
```

Das ist kein Zufall, sondern die Folge der gewählten Zielschicht: `components/` und `app/`
liegen beide unmittelbar unter `src/`, also bleiben `../lib/cx`, `../lib/focus`,
`../shared/ui/Icon` und `../shared/ui/Primitives` zeichengleich richtig.

**Gegenprobe gegen `git show HEAD:`** — sie trägt hier, weil alle drei Dateien an HEAD stehen.
Der Unterschied von `ShellStatus.tsx` zu HEAD ist **vor und nach diesem Auftrag derselbe**,
Zeile für Zeile:

```
13,14  import { Icon } from "./Icon";        →  "../shared/ui/Icon"        aus Welle 1–6
       import { Button } from "./Primitives" →  "../shared/ui/Primitives"  aus Welle 1–6
251    `app/undoDone.ts` → `features/todos/undoDone.ts`                    aus Welle 1–6
```

Drei Abweichungen von HEAD, alle drei aus früheren Wellen, **null** aus dieser. Damit ist
belegt, daß ich an dieser 845-Zeilen-Datei nichts geändert habe — nicht behauptet, gerechnet.

### Gelöscht

```
apps/web/src/components/     der Ordner selbst — leer, entfernt
```

### Geändert — **fünf** Dateien, **sechs** Zeilen, restlos

| Datei | Zeile | Was |
|---|---|---|
| `app/App.tsx` | 12 | `"../components/ShellStatus"` → `"./ShellStatus"` |
| `app/connection.ts` | 63 | dieselbe Einfuhr, Typimport |
| `app/connection.ts` | 270 | **Kommentarpfad** `` `components/ShellStatus.tsx` `` → `` `app/ShellStatus.tsx` `` |
| `features/bookings/BookingDialogs.tsx` | 14 | `"../../components/InfoDialog"` → `"./InfoDialog"` |
| `features/export/ExportScreen.tsx` | 36 | `"../../components/InfoHint"` → `"./InfoHint"` |
| `showcase/ShellStateSection.tsx` | 10 | `"../components/ShellStatus"` → `"../app/ShellStatus"` |

Der Kommentar in `connection.ts:270` ist der einzige, der **nicht** eine Einfuhr ist. Er sagt
im Präsens, wo der Baustein liegt; nach dem Umzug hätte er den nächsten Leser an einen leeren
Ort geschickt. Berichtigt, nicht umformuliert.

### `apps/web/README.md` — die einzige Stelle, an der ich mehr als einen Pfad geändert habe

Der Baum unter „`src/`" behauptete im Präsens eine Gliederung, die es nicht mehr gibt:

```
vorher     lib/          cx(), Theme- und Dichte-Haken, Wert-zu-Beschriftung.
           components/   Die Bausteine. Keine Fachlogik.
           showcase/     …
```

Drei Fehler auf drei Zeilen: `components/` gibt es nicht mehr; `api/`, `app/`, `features/`
und `shared/` fehlten ganz; und die Theme-Haken liegen seit einer früheren Welle in
`features/settings/theme.ts`, nicht in `lib/`. Ersetzt durch die sieben Ordner, die
tatsächlich da sind, mit je einem Satz.

**Das ist eine Ermessensentscheidung, und sie ist billig rückgängig zu machen.**
`apps/web/README.md` liegt in `apps/web/**` und damit in meiner Hoheit; der Präzedenzfall ist
T-256, das `apps/web/design/DESIGNSYSTEM.md` aus demselben Grund berichtigt hat. Wenn du
`README.md` in der Hoheitstabelle als **jede** README liest und nicht nur die im Wurzelverzeichnis,
ist es ein Block von zehn Zeilen zurück und ein Auftrag an den documenter.

### `apps/web/test/**` — **keine** Änderung nötig

Ich hatte die Erlaubnis, Einfuhrpfade nachzuziehen. **Es gab nichts nachzuziehen.** Keine
Datei unter `apps/web/test/` nennt `InfoDialog`, `InfoHint` oder `ShellStatus` — weder als
Einfuhr noch im Text, weder als Pfad noch als Bezeichner. Gemessen über beide Wege aus E-087,
`git grep` und ein roher Lauf über den Arbeitsbaum.

---

## 3  Abgelehnte Schritte, mit Grund

**1. `InfoHint` (15 Zeilen) in `ExportScreen.tsx` einrücken statt umziehen.**
Die Fünfzig-Zeilen-Regel aus Welle 5 lautet: *ein Baustein unter 50 Zeilen mit einem
einzigen Aufrufer bleibt stehen.* Sie regelt einen **Schnitt** — sie sagt, wann aus einer
Datei keine zweite herausgeschnitten wird. Sie sagt nicht, daß eine Datei, die es seit Jahren
gibt, aufgelöst gehört. Rückwärts angewandt wäre sie eine **Entdopplung**, keine Verschiebung,
und der Mengenvergleich in Abschnitt 5 wäre danach nicht mehr die Aussage, die er ist.
Dieselbe Begründung, mit der Welle 6 die doppelte `describeRule`-Tabelle hat stehen lassen.

**2. `ShellStatus.tsx` (845 Zeilen) aufteilen.** Sie führt neun Bausteine und einen
Zustandsrechner (`startupProblems`) in einer Datei. Der Schnitt liegt sichtbar da —
`StartupProblemNotice`, `SyncFolderNotice`, `ServiceStoppedPanel`/`-Overlay`,
`UserNameBlockedPanel`/`-Overlay`. **Kein Umbau auf Verdacht, und dieser Auftrag ist ein
Umzug.** Hätte ich geschnitten, wäre der sha256-Beleg aus Abschnitt 2 verloren gewesen —
also genau der Nachweis, der belegt, daß der Umzug nichts verändert. Gemeldet als Befund 3.

**3. Die drei `components/`-Nennungen in `apps/web/scripts/*.mjs`.**
Sie stehen alle drei im **Präteritum** und sind als historische Sätze richtig:

| Stelle | Wortlaut |
|---|---|
| `contrast-check.mjs:939` | „`apps/web/src` bekommt `features/board`, … **statt** `screens/` und `components/`" — beschreibt die Umstrukturierung selbst |
| `proof-foreign.mjs:522` | „**Bis T-249** nannte dieser Nachweis vier Pfade beim Namen: … `components/Foreign.tsx` …" |
| `proof-foreign.mjs:1093` | „… und `components/ExportAudit.tsx` **zeigte** ihn roh an" — Bericht über einen behobenen Defekt |

T-256 hat Kommentarpfade berichtigt, die im **Präsens** einen Ort behaupten. Diese drei tun
das nicht. Einen richtigen Satz über die Vergangenheit umzuschreiben, weil die Vergangenheit
vorbei ist, fälscht ihn.

---

## 4  `lib/` — der Befund. **Es trägt, und deine Liste ist genau umgekehrt**

Vorweg der unangenehme Teil, weil er den Rest bestimmt.

> Deine Annahme: `lib/` „trägt heute noch die Dateien, die in den Wellen 1 bis 6 **mangels
> zweitem Benutzer** liegengeblieben sind — `poolRule.ts`, `folderPaths.ts`, `movement.ts`,
> `labels.ts`, `format.ts`, `errorText.ts` und andere."

**Gemessen ist das Gegenteil. Diese sechs sind die tragendsten Dateien des Ordners.** Jede
einzelne hat mindestens zwei Merkmale als Leser, vier von ihnen mehr als jeder Baustein in
`shared/ui`:

| deine sechs | Zeilen | Merkmale | Leser gesamt |
|---|---|---|---|
| `labels.ts` | 527 | **8** | **30** |
| `format.ts` | 320 | **7** | **35** |
| `poolRule.ts` | 615 | **3** | **10** |
| `movement.ts` | 104 | **4** | **8** |
| `folderPaths.ts` | 31 | **2** | **3** |
| `errorText.ts` | 179 | **2** | **2** |

Keine von ihnen ist mangels zweitem Benutzer liegengeblieben. Sie sind liegengeblieben, weil
sie hingehören.

### Die ganze Messung, fünfzehn Dateien

Gezählt sind Einfuhren, nicht Textfunde. `features/<name>/` = Merkmal.

| Datei | Zeilen | Merkmale | Leser | andere Schichten |
|---|---|---|---|---|
| `foreign.ts` | 101 | 8 | **50** | app, shared, showcase |
| `cx.ts` | 9 | 8 | **46** | app, shared, showcase |
| `format.ts` | 320 | 7 | 35 | app, shared |
| `labels.ts` | 527 | 8 | 30 | api, app, shared, showcase |
| `poolRule.ts` | 615 | 3 | 10 | app, showcase |
| `movement.ts` | 104 | 4 | 8 | — |
| `focus.ts` | 134 | 1 | 4 | app, shared |
| `folderPaths.ts` | 31 | 2 | 3 | app |
| `errorText.ts` | 179 | 2 | 2 | — |
| `pathInspection.ts` | 194 | 2 | 2 | — |
| `deadline.ts` | 121 | 0 | 2 | app, shared |
| `fieldMessages.ts` | 42 | 0 | 2 | shared |
| `touched.ts` | 175 | 0 | 2 | shared |
| `submitAttempt.ts` | 62 | 0 | **1** | shared |
| `textEditing.ts` | 79 | 0 | **1** | (Wurzel: `main.tsx`) |

### Warum das keine zweite `shared`-Halde ist — drei Messungen, nicht drei Meinungen

**1. `lib/` ist ein echtes Blatt. Null Kanten nach oben.**
Gemessen über alle fünfzehn Dateien: die einzigen Ziele außerhalb von `lib/` selbst sind
`../api/types` (8×), `../api/client` (1×), `@takt/domain` (6×) und `react` (3×). **Keine
einzige** Einfuhr aus `features/`, `app/`, `shared/` oder `showcase/`. Durch `lib/` kann kein
Kreis laufen.

Das ist der Unterschied zu einer Halde, und er ist prüfbar: `shared/ui` hat **eine** Kante
bergauf (`AsyncBoundary.tsx → app/useAsync`, Befund 2 aus T-256). `lib/` hat **null**.

**2. Die Zugehörigkeitsregel ist mechanisch prüfbar und gilt ausnahmslos.**

```
lib/        15 Dateien, 15× .ts,  0× .tsx,  0 Zeilen JSX,  0 Komponenten
shared/ui   19 Dateien,  0× .ts, 19× .tsx
```

Die drei `react`-Einfuhren in `lib/` sind zwei Kontexte (`createContext`/`useContext`) und
ein reiner Typ (`KeyboardEvent`) — keine davon zeichnet. Eine Halde hat kein Kriterium; hier
kann ein Skript in einer Zeile prüfen, ob eine Datei hineingehört.

**3. Die Leserverteilung ist nicht die einer Halde.**
Eine Halde erkennt man daran, daß viele Dateien genau einen Leser haben. Gemessen: **neun von
fünfzehn** haben drei oder mehr Leser, **vier** haben dreißig oder mehr, der Median liegt bei
vier. Genau **zwei** Dateien haben einen einzigen Leser.

### Die fünf, die man sich beim nächsten Mal ansehen sollte — und warum ich sie nicht angefaßt habe

Du hast „kein Umbau auf Verdacht" geschrieben, also ist das eine Liste, keine Änderung.

| Datei | Lage | Mein Urteil |
|---|---|---|
| `submitAttempt.ts` (62) | **Ein** Leser, und Anbieter **und** Verbraucher stehen in derselben Datei: `shared/ui/FormDialog.tsx` stellt `SubmitAttemptContext.Provider` (`:393`) und ruft `useSubmitAttempt()` (`:636`) | **Der stärkste Kandidat für `shared/ui/`.** Er erfüllt das Kriterium, mit dem `ExportTabs` bei `features/export` geblieben ist, in Reinform |
| `fieldMessages.ts` (42) | Zwei Leser, beide `shared/ui`; Anbieter wieder `FormDialog.tsx:392` | Zweitstärkster. Dieselbe Bauart, ein Leser mehr |
| `touched.ts` (175) | Zwei Leser, beide `shared/ui` (`FormDialog`, `ConfirmDialog`) | Kandidat, **aber teurer**: zwei Prüffälle nageln den Pfad fest (unten) |
| `deadline.ts` (121) | Null Merkmale, aber **zwei verschiedene Schichten**: `app/useToday.ts` und `shared/ui/DeadlineFlag.tsx` | **Bleibt.** Es gibt keinen Ort, der beide Leser enthält — außer `lib/`. Genau dafür ist die Schicht da |
| `textEditing.ts` (79) | Ein Leser: `main.tsx` | **Bleibt.** Null Projekteinfuhren, reine DOM-Hilfe, einmal beim Start installiert. Die blatt-artigste Datei im Ordner |

**Der Preis, den ein solcher Umzug hätte, und er steht nirgends sonst:** Sechs Prüfdateien
nennen `src/lib/…`-Pfade **fest**, teils als Modulauflösung, nicht als Kommentar —
`test/lib/errorText.test.ts:36`, `labels.test.ts:42`, `movement.test.ts:38`,
`poolRule.test.ts:33-34`, `touched.test.ts:70`, `test/components/touchedCallSiteNeutrality.test.ts:76`,
dazu `test/app/undoDone.test.ts:48`. Ein Umzug aus `lib/` heraus ist deshalb **nicht**
dieselbe billige Bewegung wie die aus `components/` heraus. Das gehört in den Auftrag, nicht
in die Überraschung.

### Verdikt

**`lib/` ist ein sinnvoller Ort und bleibt.** Es hat eine prüfbare Aufnahmeregel (kein JSX),
eine gemessene Schichtstellung (null Kanten nach oben) und eine Leserverteilung, die das
Gegenteil einer Halde ist. Die zwei bis drei Grenzfälle sind benannt, kosten zusammen
etwa 280 Zeilen und sind ein eigener kleiner Auftrag — nicht dieser.

---

## 5  Der Mengenvergleich

Verglichen ist der **ganze Baum** `apps/web/src` (`.ts`, `.tsx`, `.css`) gegen einen
sha256-Abzug **vor** der ersten Änderung. Zusätzlich, weil alle drei Dateien an HEAD stehen,
die Gegenprobe gegen `git show HEAD:` (Abschnitt 2).

```
Dateien vorher   176      (169 .ts/.tsx + 7 .css)
Dateien nachher  176      (169 .ts/.tsx + 7 .css)

nur vorher    3    components/{InfoDialog,InfoHint,ShellStatus}.tsx
nur nachher   3    app/ShellStatus.tsx
                   features/bookings/InfoDialog.tsx
                   features/export/InfoHint.tsx

an beiden Orten 173   davon zeichengleich 168, geändert 5
verschoben mit zeichengleichem Inhalt: 1   (ShellStatus.tsx)
```

Die **fünf** geänderten sind die fünf aus Abschnitt 2, und jede abweichende Zeile ist einzeln
aufgeführt — sechs insgesamt. Es gibt keine sechste Datei und keine siebte Zeile.

`git status` bestätigt alle drei als Umbenennung (`R`), nicht als Löschung plus Neuanlage.

---

## 6  Die Kanten — was neu ist und was verschwindet

```
neu    app/          →  app/ShellStatus                  (innerhalb, vorher app → components)
neu    showcase      →  app/ShellStatus                  (showcase liest app — schon vorher üblich)
neu    features/bookings → features/bookings/InfoDialog  (innerhalb)
neu    features/export  → features/export/InfoHint       (innerhalb)

weg    app/          →  components/    2 Kanten
weg    features/     →  components/    2 Kanten
weg    showcase/     →  components/    1 Kante
```

**Drei Kanten sind von schichtübergreifend zu schichtintern geworden**, zwei bleiben
gerichtet. `showcase → app/` ist keine neue Bauart: die Musterseite liest bereits aus
`features/structure/`, `features/settings/` und `app/`.

Kein Kreis entstanden, keiner aufgelöst. `app/ShellStatus.tsx` führt nach wie vor
`../lib/cx`, `../lib/focus`, `../shared/ui/Icon`, `../shared/ui/Primitives` und
`@takt/desktop/shell` — alle fünf abwärts oder seitwärts, alle fünf zeichengleich.

---

## 7  Die Läufe

| Lauf | Stand |
|---|---|
| `typecheck` (`@takt/web`) | **grün** |
| `boundaries` | **grün**, 463 Quelldateien |
| `contrast` | **grün**, 0 von 522 Paaren, 11/11 Gegenproben — **zeichengleich zu T-256** |
| `proof:foreign` | **grün**, 21/0, **169 Quelldateien** — zeichengleich |
| `proof:surface` | **grün**, 27/0, **169 Quelldateien** — zeichengleich |
| `proof:codepoints` | **grün** |
| `proof:migrations` | **grün** |
| `proof:conflicts` `proof:tags` `proof:access` `proof:export` `proof:export-api` | **grün** |
| `proof:taskpane` `proof:addin-wiring` `proof:route-policy` `proof:db-permissions` `proof:addin` | **grün** |
| **`proof:release-safety`** | **grün** — domain-dev hat die Zeile aus T-256 nachgezogen |
| `proof:shell-surface` | **grün** |
| `verify:bundle` | **grün**, 19/0 |
| `build` (`@takt/web`) | **grün** |
| `build:designsystem` | **grün** |
| `test:coverage`, nur `apps/web/test` | **grün**, 14 Dateien, **149 bestanden** |
| `proof:openapi` `proof:callers` `proof:layers` | **ROT, fremde Ursache** |
| `typecheck` (ganzer Baum) | **ROT, fremde Ursache** |
| `test:coverage` (ganzer Baum) | **ROT, fremde Ursache** — 13 Dateien |
| E2E | **nicht meßbar, fremde Ursache** — Abschnitt 8 |

**Die roten Läufe sind ein Zeitpunktfehler, und das ist gemessen, nicht vermutet.**
Alle brechen mit `ERR_MODULE_NOT_FOUND` ab, bevor eine einzige Prüfung fährt:

```
Cannot find module …\apps\local-api\src\routes\data-transfer.ts
Cannot find module …\apps\local-api\src\version\source.ts
Cannot find module …\apps\local-api\src\usecases\context.ts
```

`git status` zeigt die laufende Umstrukturierung im Arbeitsbaum:
`src/usecases/context.ts → src/context.ts`,
`src/routes/data-transfer.ts → src/features/data-transfer/routes.ts`,
`src/version/source.ts → src/features/version/source.ts` und weitere. Ich habe unter
`apps/local-api/**` nichts angefaßt. **domain-dev, Wellen 3 und 4, in derselben Welle.**

`test:coverage` über den ganzen Baum: **1434 bestanden, 3 übersprungen, 13 Dateien rot.**
T-256 maß 1570 bestanden. Die Differenz von 136 liegt **restlos** in den 13 Dateien, die gar
nicht luden — alle dreizehn unter `apps/local-api/test/`. Kein Rückgang aus meiner Änderung.

---

## 8  E2E — **nicht gemessen**, und warum ich keine Zahl erfinde

Der Lauf über `tests/e2e/playwright.config.ts` bricht in `globalSetup` ab, **vor dem ersten
Fall**:

```
Der lokale Dienst kam nach 8 Versuchen nicht hoch. Letzte Ausgabe:
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  'C:\…\apps\local-api\src\version\source.ts'
  imported from C:\…\tests\e2e\support\version-check-entry.ts
    at spawnLocalApi (tests\e2e\support\services.ts:227)
    at globalSetup (tests\e2e\support\global-setup.ts:14)
```

**Die Ursache ist eine einzige Zeile:** `tests/e2e/support/version-check-entry.ts:67` führt
`'../../../apps/local-api/src/version/source.ts'` fest. Die Datei liegt seit domain-devs
laufender Welle unter `apps/local-api/src/features/version/source.ts`.

**Es hilft keine andere Konfiguration.** Ich habe auch
`tests/e2e/playwright.web-build.config.ts` versucht — die gegen `vite build` + `vite preview`
läuft und die Anwendung selbst gar nicht braucht. Sie bricht an **derselben** Zeile ab, weil
ihr `global-setup-web-build.ts:19` denselben `spawnLocalApi` ruft. Alle fünf Konfigurationen
hängen an diesem einen Faden.

**Ich berichte darum keine E2E-Zahl.** Nicht „104/110 wie vorher", nicht „unverändert" — es
gibt keinen Meßwert. Das ist dieselbe Regel wie bei den zwei verfälschten Läufen in T-256:
eine Zahl, die aus einem Lauf stammt, der nicht gelaufen ist, ist schlimmer als keine.

**Die Umgebungsfallen habe ich vorher geprüft**, wie du sie mir zurückgegeben hast: `netstat`
zeigte **keinen** Lauscher auf `5173` (nur `WARTEND`-Sockel aus `verify:bundle` auf 17843/17844),
`test-results-e2e` war entfernt. Es war kein `0xC0000142` und kein Port-Konflikt. Es war die
eine Zeile.

**Nachzuziehen:** `tests/e2e/support/version-check-entry.ts:67`. **Eine** Zeile, wie die
`releasePage.ts`-Zeile aus T-256. **e2e-tester oder domain-dev**, je nachdem, wer die Welle
abschließt. Bis dahin ist auf dieser Maschine **kein** E2E-Fall meßbar — nicht meiner, nicht
irgendeiner.

---

## 9  Statt E2E: die Fläche gerendert gemessen

Weil der Weg über Playwright zu war, habe ich die einzige Fläche, die mein Umzug berührt und
die **ohne** lokalen Dienst läuft, direkt gebaut und im Browser gemessen: die Musterseite.
Sie zeigt `ShellStatus` über `showcase/ShellStateSection.tsx` — also genau die 845 Zeilen,
die den Ort gewechselt haben.

```
build:designsystem  →  grün
vite preview :4319  →  /designsystem.html  HTTP 200
Chromium, de-DE, 1440 / 900 / 390 px
```

| Was | Ergebnis |
|---|---|
| Seite lädt, alle Abschnitte | **97 `<section>`**, Abschnitt 10 „Wenn SuperTakt nicht vollständig startet" vorhanden |
| Konsolenfehler / `pageerror` | **keine**, an allen drei Breiten |
| `ShellStatus` zeichnet | **ja** — vier Schalter, Auswahlfeld „Grund des Ausfalls", Vorschau |
| **Leerzustand** | **ja** — „SuperTakt ist vollständig gestartet · Der Normalfall zeigt nichts" |
| **Fokus sichtbar** | **ja** — erste Tab-Station ist ein `BUTTON`, `outline: solid 2px rgb(33, 89, 218)` |
| **Responsiv** | **ja** — bei 390 px stapelt die Abschnittsleiste über den Inhalt, kein Überlauf |
| `form-section`-Knoten | **1** — die Karte aus T-256 Abschnitt 4, unverändert vorhanden |

**Was das nicht ist:** ein Ersatz für `visual-qa` und kein Ersatz für die 110 E2E-Fälle.
`InfoDialog` (in `features/bookings`) und `InfoHint` (in `features/export`) stehen **nicht**
auf der Musterseite; für sie habe ich nur `typecheck`, `build` und `verify:bundle` als Zeugen.
Es ist der belastbarste Teil der Oberfläche, den ich diese Runde erreichen konnte, und er
sagt: die verschobene Datei zeichnet, in allen Zuständen, mit sichtbarem Fokus.

**Aufgeräumt:** Preview beendet, `4319` und `5173` ohne Lauscher, `apps/web/dist` auf das
Auslieferungsbündel zurückgebaut (`designsystem.html` **nicht** darin — wie es die
Bündelregel verlangt).

---

## 10  Oberfläche, Zustände, Tastatur

**Es ist keine neue Fläche entstanden.** Kein Bildschirm, kein Dialog, kein Feld, kein Text,
kein Zustand. Die Pflichtzustände sind zeichengleich mitgezogen — bei `ShellStatus.tsx`
beweisbar über den sha256, bei den anderen zwei über die zeilenweise Diff aus Abschnitt 2.

Für `visual-qa` bleibt aus **diesem** Auftrag nichts Neues zu begutachten. Wer trotzdem
stichprobenartig hinsehen will, sind die drei Flächen, die die verschobenen Dateien zeichnen:

1. **Startmeldungen der Hülle** — Musterseite Abschnitt 10, oben schon gemessen; in der
   Anwendung die Zeile über Navigation und Inhalt.
2. **Buchungsverlauf im Exportprotokoll** (`InfoDialog`) — der Dialog, der nichts fragt,
   erreichbar über S-07.
3. **Die vier Hinweisknöpfe in den Exporteinstellungen** (`InfoHint`) — Exportvorlage,
   Rundung, Exportordner, „Abgerechnet unter" (`ExportScreen.tsx:631, 653, 662, 680`).

---

## 11  In fremder Hoheit nachzuziehen — nichts davon angefaßt

**Blockierend:**

1. **`tests/e2e/support/version-check-entry.ts:67`** — führt
   `apps/local-api/src/version/source.ts` fest. **Eine** Zeile, und sie sperrt **jede**
   E2E-Konfiguration (Abschnitt 8). **e2e-tester / domain-dev.**

**Wegen meines Umzugs:**

2. **`apps/desktop/src/shell.ts:179`** — „**Wer das anzeigt:** `ShellStatus` aus
   `apps/web/src/components/ShellStatus.tsx`". Nur ein Kommentar, aber er benennt den
   Gegenspieler einer Schnittstelle. Neu: `apps/web/src/app/ShellStatus.tsx`. **desktop.**
3. **`tests/e2e/shell-quit-failure.spec.ts:7`** — nennt
   `apps/web/src/components/ShellStatus.tsx` im Kopfkommentar für `useQuitAttempt`. Keine
   Zusicherung. **e2e-tester.**

**Rückstand aus früheren Wellen, den ich beim Suchen mitgefunden habe:**

4. **`docs/bedrohungsmodell.md`** nennt vier Pfade unter `apps/web/src/components/`, die es
   seit den Wellen 1 bis 7 nicht mehr gibt: `Foreign.tsx` (`:3712`),
   `AttachmentOpenDialog.tsx` (`:5050`), `NoteField.tsx` (`:7264`), `Attachments.tsx`
   (`:9607`). Der letzte ist **keine Randnotiz** — er trägt einen Satz zu A-19.19, dem
   offenen Widerspruch. **security-checker**, zusammen mit `:4194/:4361` aus T-256.
5. **`docs/design/traeger-und-zusage.md`** — `:749` (`components/ExportStatus.tsx:40-49`),
   `:782` (`NoteField.tsx:22, 29-30`), `:1103` (`Primitives.tsx`), `:1833` und `:2278/:2279`
   (`ExportGroups.tsx`, mit Zeilennummern), `:2609` (`Select.tsx:117`).
   **ui-designer / ux-designer.**
6. **`docs/testplan.md`** — `:2085` (`TagInput.tsx`), `:4119` (`ExportAudit.tsx:170`),
   `:4362` (`ExportGroups.tsx:303-319`); `:4294` nennt `git show HEAD:apps/web/src/components/`
   und ist als **historischer** Verweis richtig. **e2e-tester.**
7. **`packages/domain/src/tag-name.ts:24`** — `apps/web/src/components/TagInput.tsx`.
   **domain-dev.**
8. **`tests/e2e/`** — `field-live-region-announcement.spec.ts:4,151`,
   `focus-return-after-dialog.spec.ts:18-19`, `support/bidi.ts:8`, `tag-input.spec.ts:2`.
   Kommentare; `:151` ist ein `git show HEAD:`-Verweis und bleibt richtig. **e2e-tester.**
9. **`.claude/team/decisions.md`** `:1852` („die eigene Abstraktionsschicht existiert:
   `apps/web/src/components/`" — sie existiert weiter, sie heißt `shared/ui/`), `:2054`
   (`NoteField.tsx:59`), `:2077` (`RadioRow.tsx`). **`.claude/team/board.md`** `:168`, `:1367`,
   `:1393`, `:1415`, `:1443`, `:1505`. **Orchestrator.**

---

## 12  Befunde, die nicht meine sind

1. **`apps/web/test/` spiegelt eine Quellgliederung, die es nicht mehr gibt.** Es hat
   `test/components/` und `test/screens/` — beide Ordner sind in `src/` seit Welle 6 und 7
   verschwunden. Schlimmer als der Name ist der Inhalt: `test/components/` prüft heute drei
   verschiedene Schichten (`shared/ui/Primitives`, `features/export/*`, `src/lib/touched`),
   und **`test/lib/exportTemplateModel.test.ts`** sowie **`test/lib/startupAppearance.test.ts`**
   prüfen Dateien, die gar nicht in `lib/` liegen, sondern in `features/export/` und
   `features/settings/`. Der Kopfkommentar der ersten nennt sogar noch
   `src/lib/exportTemplateModel.ts`. **unit-tester** — und es ist eine eigene Welle, keine
   Nebenbei-Umbenennung.
2. **`ShellStatus.tsx` ist mit 845 Zeilen die größte Datei unter `apps/web/src`** und führt
   neun Bausteine plus einen Zustandsrechner. Der Schnitt liegt an den vorhandenen
   Trennbalken sichtbar da (Abschnitt 3, Punkt 2). Nach der Regel aus Welle 5 wären
   mindestens `ServiceStoppedPanel`/`-Overlay` und `UserNameBlockedPanel`/`-Overlay` je über
   der Fünfzig-Zeilen-Marke. **Ein eigener Auftrag**, und er ist der letzte große in
   `apps/web/src`.
3. **`submitAttempt.ts` und `fieldMessages.ts` gehören wahrscheinlich nach `shared/ui/`**
   (Abschnitt 4). Anbieter und Verbraucher stehen beide in `FormDialog.tsx`. Zusammen 104
   Zeilen, zwei Dateien, und **kein** Prüffall nagelt ihre Pfade fest — anders als bei
   `touched.ts`. Das ist der billigste offene Schnitt, den ich gefunden habe.
4. **`api/types.ts → shared/ui/ExportStatus`** und **`shared/ui/AsyncBoundary → app/useAsync`**
   stehen unverändert (T-256, Befunde 1 und 2). Du hast beide vorgemerkt bzw. entschieden.
5. **Die doppelte `describeRule`-Nachschlagetabelle in `PoolFormDialog.tsx`** steht weiterhin
   zweimal (Welle 6, Befund 3; Welle 7, Befund 4). Unverändert offen.
6. **Der Titel des Prüffalls in `apps/web/test/components/liveRegionsAlwaysRendered.test.ts:118`**
   steht weiter aus (Welle 6, Punkt 1). Unverändert offen.

---

## 13  Annahmen

1. **`ShellStatus.tsx` liegt in `app/`, nicht in `features/shell/`.** Drei Messungen in
   Abschnitt 1; der abgelehnte Weg ist benannt. Es ist die einzige der drei Zuordnungen, die
   nicht durch Merkmalszählen entsteht.
2. **`InfoHint.tsx` ist mit 15 Zeilen umgezogen statt eingerückt worden.** Begründung in
   Abschnitt 3, Punkt 1.
3. **`showcase/InventorySection.tsx:278` (`file: "InfoDialog.tsx"`) bleibt unverändert** — es
   ist ein Oberflächentext, kein Pfad.
4. **`apps/web/README.md` ist berichtigt worden** (Abschnitt 2). Wenn du die Hoheit anders
   liest, sind es zehn Zeilen zurück.
5. **Die drei `components/`-Nennungen in `apps/web/scripts/*.mjs` bleiben**, weil sie im
   Präteritum stehen und als historische Sätze richtig sind (Abschnitt 3, Punkt 3).
6. **`lib/` ist unangetastet.** Kein Umbau auf Verdacht, wie beauftragt. Der Befund steht in
   Abschnitt 4, die drei Kandidaten mit Preisschild.
7. **Kein `docs/decisions/`-Papier.** Wie in T-256: hier wurde keine Vorgeschichte aus
   Quelltext herausgezogen, drei Dateien sind (nahezu) zeichengleich umgezogen.

---

## 14  Risiken

1. **E2E ist auf dieser Maschine vollständig blind, bis eine Zeile nachgezogen ist**
   (Abschnitt 8). Das ist das größere Risiko dieser Runde, und es betrifft nicht meine
   Änderung, sondern **jede** Änderung, die jetzt jemand macht. Solange
   `version-check-entry.ts:67` steht, gibt es keinen laufenden Zeugen für 110 Fälle — auch
   nicht für die sechs, die als bekannt rot gelten, und auch nicht für die 104 grünen. Wer in
   dieser Lage „E2E unverändert" berichtet, berichtet eine Vermutung.
2. **`ShellStatus.tsx` trägt die Sperrmeldungen und ist gerade umgezogen.** Sie sind die
   einzige Fläche, die dem Benutzer sagt, warum SuperTakt nicht arbeitet — und zwei davon
   sind bewußt **nicht wegklickbar** (kein Escape, kein Kreuz). Die Datei ist sha256-gleich,
   und die Musterseite zeichnet alle vier Zustände samt Leerzustand (Abschnitt 9). Trotzdem
   ist es die Fläche, die ich am liebsten in E2E gesehen hätte:
   `shell-quit-failure.spec.ts` und `shell-username-lock.spec.ts` prüfen genau sie.
3. **Kein Sicherheitshinweis aus der Sache selbst.** Keine Route, kein Rumpf, keine
   Kodierung, keine Rundung, keine Prüfung ist berührt. Ausdrücklich nachgemessen:
   `proof:release-safety` **grün**, `proof:shell-surface` **grün**, `verify:bundle` 19/0,
   `boundaries` grün über 463 Dateien. Der Öffnen-Befehl aus Abschnitt 19, die
   Versionsprüfung aus Abschnitt 18 und die Notiztrennung sind nicht angefaßt —
   `AttachmentOpenDialog.tsx` und `releasePage.ts` habe ich nicht geöffnet.
4. **Die Regel, nach der `shared/ui` und `lib/` befüllt werden, lebt nur, solange jemand sie
   beim nächsten Zuwachs anwendet.** Sie steht heute in vier Berichten (T-255 bis T-258) und
   in keiner Entscheidung. Für `lib/` ist sie jetzt sogar mechanisch prüfbar formuliert
   („kein JSX, keine Kante nach oben") — das wäre ein `proof:layers` für `apps/web`, den es
   noch nicht gibt. Der Satz gehört in `CLAUDE.md` oder eine Entscheidung, nicht in einen
   Bericht.

---

## 15  Offene Fragen

1. **`apps/web/README.md` — durfte ich das?** Der Baum darin war an drei Stellen falsch, eine
   davon durch mich. Präzedenzfall ist `design/DESIGNSYSTEM.md` in T-256. Wenn `README.md` in
   der Hoheitstabelle **jede** README meint, nehme ich es zurück und es wird ein Auftrag an
   den documenter.
2. **Wer zieht `tests/e2e/support/version-check-entry.ts:67` nach?** Es ist die
   `releasePage.ts`-Lage aus T-256 noch einmal, nur teurer: diesmal sperrt die eine Zeile
   nicht einen Nachweis, sondern alle 110 E2E-Fälle. Ich schlage vor, das nicht auf die
   nächste Welle zu vertagen.
3. **Wird `apps/web/test/` nachgezogen?** (Befund 1.) `test/components/` und `test/screens/`
   spiegeln eine Gliederung, die es in `src/` nicht mehr gibt, und zwei Dateien in `test/lib/`
   prüfen gar nichts aus `lib/`. Das ist unit-testers Hoheit und mehr als eine Umbenennung —
   `touchedCallSiteNeutrality.test.ts` liest Dateien vom Dateisystem.
4. **Wird `ShellStatus.tsx` geschnitten?** (Befund 2.) 845 Zeilen, neun Bausteine, sichtbare
   Trennbalken. Nach der Regel aus Welle 5 ja; nach „kein Umbau auf Verdacht" nicht in diesem
   Auftrag. Es ist der letzte große Schnitt in `apps/web/src`.
5. **`submitAttempt.ts` und `fieldMessages.ts` nach `shared/ui/`?** (Befund 3.) 104 Zeilen,
   zwei Dateien, kein Prüffall im Weg. Wenn ja, dann zusammen mit der Frage, ob `touched.ts`
   mitgeht — dort kostet es zwei Prüfdateien.
