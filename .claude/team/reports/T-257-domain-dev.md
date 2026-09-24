# T-257 — `apps/local-api` featureweise ordnen

Aufgabe: T-257 — Routen und Anwendungsfälle des lokalen Dienstes je Merkmal zusammenlegen
Status: **braucht Review** — **fertig**. Vier Wellen, **acht** Merkmale, `src/usecases/` gibt es
nicht mehr und unter `src/routes/` steht nur noch `addin/`. Alle Läufe grün, `proof:all`
Ausgangskode 0, `test:coverage` zeichengleich zum Ausgangsstand.

---

## 0  Die Kurzfassung in fünf Zeilen

**Vier Wellen, acht Merkmale, fertig.** `board`, `data-transfer`, `export`, `settings`,
`structure`, `timer`, `todos`, `version` — jedes mit `routes.ts` und einer nach ihm benannten
Datei. `src/usecases/` ist verschwunden, `src/routes/` führt nur noch `addin/`; an der Wurzel von
`src/` liegen die drei Module, die kein Merkmal sind (`context.ts`, `pool-movement.ts`,
`tag-names.ts`).

**Zweimal habe ich meinen eigenen Vorschlag umgeworfen, beide Male nach Messung:** kein
`features/bookings/` (10.1) und zwei statt vier Dateien für `data-transfer` (12.1).

Die Abschnitte 1 bis 9 sind Welle 1, 10 ist Welle 2, 12 bis 14 sind Welle 3 und 4, 15 der
Endstand.

Welle 1 im Einzelnen: Vier Merkmale liegen zusammen — `board`, `structure`, `export`,
`settings`. Zwei Dateien,
die je drei Merkmale trugen, sind aufgeteilt — `usecases/structure.ts` (868 Zeilen: Tags **und**
Exportstatus **und** Einstellungen) und `routes/export.ts` (Export **und** Einstellungen).
Anweisungszeilen 2038 → 2029; der Mengenvergleich zeigt, daß **keine einzige** Zeile außerhalb
von Importen, zwei `REQUEST_SCHEMAS`-Klammern und einer Umbenennung `issues` → `toFieldErrors`
verschieden ist (Abschnitt 5). Alle Läufe stehen auf ihren Ausgangszahlen; die drei roten sind
fremd und waren vor mir rot (Abschnitt 6).

---

## 1  Was gemessen wurde, bevor entschieden wurde

**Deine Vermutung war an drei Stellen anders als der Bestand.** Alle drei ändern den Zuschnitt.

| Deine Ansage | Gemessen |
|---|---|
| `src/usecases/structure.ts` 868 — ein Merkmal | **Drei** Merkmale in einer Datei: Tags/Ordner/Pools/Status (Z. 65–484), Exportstatus und Exportvorlagen (Z. 486–647), Einstellungen (Z. 649–868) |
| `src/routes/export.ts` 363 — ein Merkmal | **Zwei**: `createExportRoutes` (Z. 116–299) und `createSettingsRoutes` (Z. 301–355) |
| — nicht genannt | Die Standard-Tags (`/settings/default-tags`) lagen in `usecases/todos.ts`, nicht bei den Einstellungen |

Dazu zwei Funde, die nicht im Auftrag standen:

**A. `toFieldErrors` gab es schon — und niemand rief sie.** In `http/input.ts` steht seit T-021
`toFieldErrors(error: z.ZodError): readonly TaktFieldError[]`. Vier Routendateien führten
daneben eine eigene `issues()`; drei davon (`routes/export.ts`, `routes/structure.ts`,
`routes/time.ts`) sind **zeichengleich** mit ihr. Vier Fassungen derselben sieben Zeilen, eine
davon ungenutzt. Die drei sind gefallen, `toFieldErrors` hat jetzt 27 Aufrufer.

Die vierte (`routes/data-transfer.ts`) ist **nicht** gefallen und darf es nicht ohne Auftrag: Sie
schreibt `issue.path.join('.') || 'body'` statt `'(rumpf)'`. Das ist ein sichtbarer Wert im
`details[].field` einer 422-Antwort. Streichen hieße einen Text ändern — E-087, eigener Auftrag.
Offene Frage F-T257-1.

**B. Die Zusage „kein Anwendungsfall bindet `hono` ein" war nie gemessen.** Sie steht seit T-021
in `architektur.md` 1.2 und im Kopf von `usecases/context.ts`, und sie hing am **Ordnernamen**
(„kein Modul unter `src/usecases/`"). Kein Lauf hat sie je geprüft. Genau der Umbau, den du
bestellt hast, nimmt ihr den Anker: `routes.ts` und `<merkmal>.ts` liegen jetzt nebeneinander.
Deshalb ist sie neu gefaßt **und** bekommt einen Wächter (Abschnitt 4).

---

## 2  Die Struktur, die entstanden ist

```
src/features/
  board/      routes.ts (20)    board.ts (91)
  structure/  routes.ts (278)   structure.ts (246)
  export/     routes.ts (134)   export.ts (271)   catalog.ts (186)
              status.ts (65)    templates.ts (40)
  settings/   routes.ts (66)    settings.ts (124)
```

Zahlen sind Anweisungszeilen (nicht leer, kein Kommentar). Keine Datei über 300. Kein Unterordner
unter einem Merkmal. Keine Barrel-Datei, kein `utils.ts`, keine neue Schicht.

**Warum `export/` fünf Dateien hat und die anderen zwei.** Es sind fünf Sachen mit fünf Antworten
auf „wo liegt das?": der Lauf (`export.ts`), die Auswahlliste der Feldquellen (`catalog.ts`), der
Status je Buchung samt Protokoll (`status.ts`), die Vorlagen (`templates.ts`), die Tür
(`routes.ts`). Zusammengelegt wären es 696 Anweisungszeilen in einer Datei.

**`export/catalog.ts` heißt nicht mehr `export-catalog.ts`.** In `features/export/` ist das
Präfix die Ordnerwiederholung, gegen die dein Auftrag ausdrücklich steht. Inhalt unverändert
(186 → 186 Anweisungszeilen, zeichengleich).

**Die eine Grenzüberschreitung, benannt.** `routes/time.ts` ruft `setExportStatus` und
`markNotBilled` aus `features/export/status.ts`. Die Routen dazu sind
`PUT /time-entries/{id}/export-status` und `POST /time-entries/{id}/not-billed` — sie hängen an
der Buchung, die Regel hängt am Export. Ich habe sie zum Export gelegt, weil dort auch
`listExportAudit` liegt und ein Leser „Buchung auf offen zurücksetzen" unter „Export" sucht, nicht
unter „Zeit". Wenn `features/bookings/` in Welle 2 entsteht, ziehen die **Routen** dorthin, die
beiden Anwendungsfälle bleiben, wo sie sind. Das ist eine Entscheidung, keine Nachlässigkeit —
widersprich, dann drehe ich sie in Welle 2.

---

## 3  `app.ts` — ich habe hineingeschrieben, und du sollst es wissen

**Das ist deine Datei.** Ich habe sie trotzdem angefaßt, und zwar an genau **fünf** Zeilen, weil
sonst der ganze Baum rot stünde und keine einzige Zahl dieses Berichts etwas wert wäre. Die
Einhängeblock-Reihenfolge, die Kette und jeder Kommentar außer einem Pfad sind unberührt.

Was ich geändert habe — vorher drei Zeilen, nachher vier:

```diff
-import { createBoardRoutes } from './routes/board.ts';
-import { createExportRoutes, createSettingsRoutes } from './routes/export.ts';
-import { createStructureRoutes } from './routes/structure.ts';
+import { createBoardRoutes } from './features/board/routes.ts';
+import { createExportRoutes } from './features/export/routes.ts';
+import { createSettingsRoutes } from './features/settings/routes.ts';
+import { createStructureRoutes } from './features/structure/routes.ts';
```

und in Zeile 241, im Kommentar am Board:

```diff
-     * die Begründung steht in `routes/board.ts`. Es gibt bewusst keine Route,
+     * die Begründung steht in `features/board/routes.ts`. Es gibt bewusst keine Route,
```

`git diff apps/local-api/src/app.ts` zeigt daneben nur die Add-in-Änderungen aus T-247, die vor
mir da waren. Wenn du das anders haben willst, ist es ein `git checkout` und vier neue Zeilen.

---

## 4  `proof:layers` — der Wächter, den der Umbau nötig gemacht hat

Neu: `apps/local-api/scripts/proof-layers.mjs`. **Eingetragen** — `proof:all` fährt seitdem
zwanzig Läufe. Der Eintrag lautete:

```jsonc
// apps/local-api/package.json, "scripts"
"proof:layers": "node scripts/proof-layers.mjs",

// package.json (Wurzel), "scripts"
"proof:layers": "pnpm --filter @takt/local-api proof:layers",
// und in "proof:all" einreihen, sinnvoll direkt vor "proof:route-policy"
```

Was er mißt, in beide Richtungen und mit Gegenprobe (E-103):

```
Gemessen: 60 Quelldatei(en), davon 9 Routendatei(en) und 21 Anwendungsfall/-fälle.

1  Kein Anwendungsfall kennt HTTP
  ok    keiner der 21 Anwendungsfälle bindet `hono` ein
  ok    keiner nennt `Response`, `Context` oder `c.json(`
2  Gegenrichtung: die Ausnahme trifft noch etwas (E-103 Punkt 2)
  ok    jede der 9 Routendateien bindet `hono` wirklich ein
3  Keine Route öffnet eine Transaktionsklammer
  ok    keine Routendatei ruft `inTransaction(`
  ok    keine Routendatei bindet `@takt/storage` ein
4  Jeder Merkmalsordner ist an seinen Dateinamen zu erkennen
  ok    features/board: `routes.ts` und `board.ts` liegen beide da      (4x, je Merkmal)
5  Gegenproben — jede eingesetzte Verletzung muß auffallen             (5x)

15 bestanden, 0 fehlgeschlagen.
```

**Er ist nicht nur zugesichert rot-fähig, er wurde rot gemacht.** Zwei echte Verletzungen
eingesetzt und wieder zurückgenommen:

```
  FEHL  keiner der 20 Anwendungsfälle bindet `hono` ein — src/features/board/board.ts
  FEHL  features/settings: `routes.ts` und `settings.ts` liegen beide da — routes.ts
13 bestanden, 2 fehlgeschlagen.      danach wieder 15/0
```

Zwei Dinge zur Bauart, weil sie der Grund sind, warum er etwas taugt:

1. **Die Menge der Routendateien kommt aus der Konvention, nicht aus dem Inhalt.** „Alles, was
   `hono` einbindet" hätte Abschnitt 1 tautologisch grün gemacht — dieselbe Falle wie T-247-7,
   wo beide Seiten aus derselben Quelle kamen und `0 === 0` grün war.
2. **Abschnitt 2 ist die Gegenrichtung.** Eine `routes.ts`, die kein `hono` einbindet, ist ein
   Name ohne Deckung, und eine Ausnahme, die nichts mehr trifft, ist keine Vorsorge (E-103
   Punkt 2).

Beim Bauen hat er zwei Dinge über `src/routes/addin/` gelernt, die im Lauf ausgeschrieben stehen:
`index.ts` ist die Tür, `service.ts` daneben ist ein **Anwendungsfall** und öffnet vier
Transaktionsklammern — richtig so. `src/routes/addin/` ist damit der Ordner, in dem Tür,
Schemata, Ports und Anwendungsfälle schon vor T-257 beieinanderlagen. Der Umbau, den du bestellt
hast, holt den Rest des Dienstes dorthin, wo die Add-in-Fläche längst ist.

---

## 5  Zahlen zeichengleich — und der einzige Unterschied, ausgerechnet

Mengenvergleich der **Anweisungszeilen** (nicht leer, kein Kommentar) gegen `git show HEAD:…`,
über alle 9 vorher beteiligten und 13 nachher beteiligten Dateien:

```
vorher   2038 Anweisungszeilen (9 Datei(en))
nachher  2029 Anweisungszeilen (13 Datei(en))
```

**−9.** Die Mengendifferenz enthält **null** fachliche Zeilen. Sie besteht aus genau drei Posten:

| Posten | Zeilen |
|---|---|
| drei zeichengleiche `issues()`-Fassungen gefallen (3 × 7) | **−21** |
| 27 Aufrufe `issues(parsed.error)` → `toFieldErrors(parsed.error)` | ±0 |
| Importzeilen und die zweite `REQUEST_SCHEMAS`-Klammer aus dem Aufteilen | **+12** |

Die +12 im einzelnen, weil du sie sonst nachrechnen müßtest: `import type { AppContext }` 3→4,
`import type { TaktEnv }` 3→4, `import { data, fail, failValidation }` 2→3,
`import { type AppContext, type UseCaseResult, now }` 2→5, dazu je einmal
`import { Hono } from 'hono'`, `import { z } from 'zod'`,
`export const REQUEST_SCHEMAS = Object.freeze({` und `});` für die zweite Aufstellung — abzüglich
der Ersparnis, daß eine elfzeilige `import { … } from '@takt/domain'`-Klammer zu drei einzeiligen
wurde (−8).

**Keine Zeichenkette, die ein Benutzer sieht, hat sich geändert.** Kein Fall für E-087.

Die Dateien einzeln, vorher → nachher:

| vorher | Anw. | nachher | Anw. |
|---|---:|---|---:|
| `routes/board.ts` | 20 | `features/board/routes.ts` | 20 |
| `usecases/board.ts` | 91 | `features/board/board.ts` | 91 |
| `routes/structure.ts` | 284 | `features/structure/routes.ts` | 278 |
| `usecases/structure.ts` | 459 | `features/structure/structure.ts` | 246 |
| ” | | `features/export/status.ts` | 65 |
| ” | | `features/export/templates.ts` | 40 |
| ” | | `features/settings/settings.ts` | 124 |
| `routes/export.ts` | 208 | `features/export/routes.ts` | 134 |
| ” | | `features/settings/routes.ts` | 66 |
| `usecases/export.ts` | 271 | `features/export/export.ts` | 271 |
| `usecases/export-catalog.ts` | 186 | `features/export/catalog.ts` | 186 |

`usecases/structure.ts` 459 → 246 + 65 + 40 + 124 = **475**; die +16 sind die drei zusätzlichen
Importklammern. `settings.ts` enthält zusätzlich die 12 Anweisungszeilen der Standard-Tags, die
aus `usecases/todos.ts` kommen (dort −12, plus die dadurch unbenutzt gewordene Typeinfuhr
`DefaultTag` −1).

---

## 6  Läufe — rot wie grün

Ausgangsstand **vor** meiner ersten Änderung gemessen, damit sich Fremdes von Meinem trennen
läßt.

| Lauf | vorher | nachher |
|---|---|---|
| `typecheck` (ganz) | **rot**, 3 Fehler in `apps/web` (fremd) | **grün** ¹ |
| `pnpm --filter @takt/local-api typecheck` | grün | grün |
| `tsc -p apps/local-api/tsconfig.test.json` | grün | grün |
| `boundaries` | grün | grün, **460** Quelldateien geprüft ² |
| `proof:codepoints` | 46/0 | 46/0 |
| `proof:migrations` | grün (42 Dateien) | grün (42 Dateien) |
| `proof:openapi` | 115/0 | **115/0** |
| `proof:callers` | 74/0 | **74/0** |
| `proof:conflicts` | 154/0 | 154/0 |
| `proof:tags` | 45/0 | 45/0 |
| `proof:access` | 109/0 | 109/0 |
| `proof:export` | 98/0 | **98/0** |
| `proof:export-api` | 72/0 | 72/0 |
| `proof:taskpane` | 29/0 | 29/0 |
| `proof:addin-wiring` | 32/0 | 32/0 |
| `proof:route-policy` | 44/0 | 44/0 |
| `proof:template-fields` | 30/0 | 30/0 |
| `proof:db-permissions` | übersprungen (Windows) | übersprungen (Windows) |
| `proof:release-safety` | **29/3** (fremd, siehe unten) | **29/3** nach Welle 1; **32/0** nach Welle 2 (10.5) |
| `proof:foreign` | rot (dieselben `apps/web`-Fehler) | 21/0 ¹ |
| `proof:surface` | (nach dem Abbruch nicht erreicht) | 27/0 |
| `proof:addin` | 248/0 | **248/0** |
| `verify:bundle` | (nicht gemessen) | 19/0 |
| `test:coverage` | 88 Dateien, 1570 bestanden, 3 übersprungen | **zeichengleich** |
| `proof:layers` (neu) | — | 15/0 |

¹ Die drei `apps/web`-Fehler (`InfoDialog.tsx` → `./DialogSurface`, `./Primitives`;
`ShellStatus.tsx` → `./Primitives`) und die zwei weiteren, die `proof:foreign` zusätzlich sah
(`features/settings/useUpdateNotice.ts` und `showcase/UpdateNoticeSection.tsx` → `lib/releasePage`),
sind **während meiner Arbeit von jemand anderem behoben worden**. Ich habe keine Datei in
`apps/web` angefaßt. Das heißt aber auch: **in `apps/web` lief parallel jemand**, und meine
Ausgangszahlen für dieses Paket sind deshalb nicht meine.

² `boundaries` prüfte vor mir 459 Quelldateien, jetzt 460 (+6 neue Dateien, −2 gelöschte, −3 aus
fremder Hand während des Laufs). Deine Auftragszahl 451 ist überholt.

**`proof:release-safety` 29/3 — fremd, und die Datei ist trotzdem meine.** Alle drei Fehlschläge
kommen daher, daß `apps/web/src/lib/releasePage.ts` nach
`apps/web/src/features/settings/releasePage.ts` gewandert ist, und daß mein Lauf sie in einer
**festen Pfadliste** führt: `RELEASE_PREFIX_FILES`, `apps/local-api/scripts/proof-release-safety.mjs:302`.

Ich habe sie **nicht** angepaßt, aus zwei Gründen. Erstens läuft in `apps/web` gerade jemand
(Fußnote 1) — eine Datei, die sich noch bewegt, mit einem neuen festen Pfad festzunageln wäre
derselbe Fehler eine Ebene später. Zweitens ist der Eintrag ein Lehrstück für E-103: eine
Zusage über **zwei erlaubte Orte**, an der Struktur aufgespannt statt an der Anforderung. Die
richtige Reparatur ist keine Pfadänderung, sondern `paketQuelle('@takt/web', { hinweis: …,
merkmal: RELEASE_PREFIX })`. Das ist ein eigener Auftrag; sag Bescheid, dann nehme ich ihn.

---

## 7  Schnitte, gegen die ich mich entschieden habe — mit gezählten Kosten

**7.1 `tags`, `pools` und `statuses` als drei Merkmale.** `apps/web` führt `tags` und `structure`
getrennt; im Dienst wäre das teuer.

- Der Anwendungsfallteil zerfiele in 80 / 110 / 32 Anweisungszeilen. Die gemeinsame Importklammer
  hat **24** Zeilen; dreimal davon sind rund **+40** reine Importzeilen für 222 Zeilen Logik.
- Die Routen zerfielen aus **37** Importzeilen in dreimal rund 25, also **+38**.
- **Drei Symbole kreuzten die neuen Grenzen.** `poolWithResolution` und `PoolWithResolution`
  benutzt `features/board/board.ts` bereits heute. `poolStatusListSchema` ist eine Pool-Achse
  über `StatusId` — Pools läsen aus Status. `createStructureRoutes` gibt **fünf** Router in
  **einem** Objekt zurück (`tagTree, tags, folders, pools, statuses`), und `app.ts` packt es aus:
  ein Schnitt hier ändert deinen Einhängeblock.
- Ertrag: drei Ordner statt einem. **Rund 78 Importzeilen und drei überkreuzte Grenzen für einen
  Ordnernamen.** Abgelehnt.

**7.2 `features/bookings/` in dieser Welle.** Nicht abgelehnt, sondern **versperrt**: gemessen
vier Importzeilen in Dateien fremder Hoheit — `apps/local-api/test/usecases/{idle,
time-entry-movement,timer-orphan-resolution}.test.ts` ziehen aus `src/usecases/timer.ts`, und
`apps/outlook-addin/scripts/proof-addin.mjs:175` zieht `REQUEST_SCHEMAS` aus `src/routes/time.ts`.
Ein Umzug dieser beiden Dateien macht `test:coverage` und `proof:addin` rot, und beide darf ich
nicht anfassen. Siehe Abschnitt 9.

**7.3 `src/usecases/context.ts` → `src/context.ts`.** Der richtige Ort (`AppContext` ist kein
Merkmal, er ist der gemeinsame Zusammenhang, wie `runtime.ts`). Gemessen **sechs** Importzeilen in
`apps/local-api/test/**` dagegen. Verschoben, nicht verworfen.

**7.4 `features/export/runs.ts` neben `features/export/status.ts`.** Wäre 2 × ~33 statt 1 × 65
Anweisungszeilen gewesen, mit einer zweiten Importklammer von 8 Zeilen. Für fünf Funktionen, die
alle drei Wörter „Export" und „Status" im Namen tragen, ist das ein Ordner zuviel. Abgelehnt.

**7.5 `features/<merkmal>/schema.ts`.** `src/routes/addin/` macht es so, und es wäre verlockend.
Es ist aber eine **Schicht**, und die hast du ausgeschlossen. Gemessene Kosten: 34 bzw. 35
Anweisungszeilen Schema in `export/routes.ts` und `settings/routes.ts` müßten in zwei neue
Dateien, dazu 2 × 8 Importzeilen — und `REQUEST_SCHEMAS`, das `proof:openapi` und `proof:callers`
lesen, läge dann nicht mehr neben den Routen, die es beschreibt. Abgelehnt.

**7.6 Eine gemeinsame Datei für `issues()`.** Nicht gebaut: `toFieldErrors` steht seit T-021 in
`http/input.ts` und hatte null Aufrufer. Eine neue gemeinsame Datei hätte die vierte Fassung
derselben sieben Zeilen erzeugt.

---

## 8  Kommentare — was blieb, was wanderte, was fiel

Getrennt nach Wirkung, wie beauftragt.

**Geblieben, weil es eine Wiederholung verhindert oder Überraschendes erklärt:** der Satz „Die
Regeln stehen hier nicht" (aufgeteilt — Zyklusfreiheit nach `structure/structure.ts`, der
Exportstatuswechsel nach `export/status.ts`, jeweils zu der Regel, die dort tatsächlich gerufen
wird); die Begründung, warum es genau **eine** Board-Route gibt; die Begründung, warum die Datei
**vor** der Markierung geschrieben wird (A-8.8); die ganze Herleitung von `PoolWithResolution`;
die Felder von `SettingsView`, die erklären, warum Windows-Benutzername und Bestandspfad
Auskunft und keine Einstellung sind.

**Gefallen, weil doppelt:** genau einer. Der Absatz an `createTemplate` („Die Feldliste wird
**vor** dem Schreiben geprüft…") war nach dem Aufteilen zeichengleich mit dem neuen Dateikopf von
`export/templates.ts` und gilt für `createTemplate` **und** `updateTemplate`. Er steht jetzt
einmal, im Kopf.

**Nach `docs/` gewandert:** nichts. Die Vorgeschichte in diesen Dateien ist überall an eine
konkrete Zeile gebunden (T-072s 500er, T-042s Protokollknopf, T-074s Namenskonflikt) — sie in ein
Merkmalspapier zu ziehen hieße, sie von ihrem Gegenstand zu trennen.

**Ein Satz, den ein Prüfer verlangt hat, ist nicht gefallen.** Ich habe keinen gestrichen und
melde auch keinen zur Streichung.

**Nachgezogene Pfadangaben in Kommentaren** (in Dateien meiner Hoheit): `app.ts:241`,
`composition.ts:88`, `usecases/context.ts:87`, `features/structure/structure.ts` (→
`features/board/board.ts`), `packages/domain/src/tag-name.ts:199`, `packages/storage/src/ports.ts`
(2 Stellen), `packages/storage/src/sqlite/unit-of-work.ts:175`, `docs/architektur.md` (2 Stellen),
`docs/datenmodell.md:930` und `:931`.

---

## 9  Welle 1 — was von Abschnitt 9 der ersten Fassung übrig ist

Der Schnitt, den ich hier ursprünglich vorgeschlagen habe, ist gefahren. Welle 2 steht in
Abschnitt 10, Welle 3 und 4 in Abschnitt 11.

---

## 10  Welle 2 — `todos` und `timer`, gebaut

Freigegeben durch deine Nachricht (Importpfade in fremden Dateien, nur der Pfad). Gebaut, alles
grün.

### 10.1 Die Struktur

```
src/features/
  todos/   routes.ts (261)   todos.ts (287)   attachments.ts (169)  image-sweep.ts (67)
  timer/   routes.ts (223)   timer.ts (200)   bookings.ts (67)      movement.ts (47)
           idle.ts (109)
```

**`features/bookings/` gibt es nicht — und das ist gemessen, nicht bequem.** Ich hatte es
vorgeschlagen, weil `apps/web` `bookings` und `timer` trennt und weil `/time-entries` und
`/timer` zwei Einhängepunkte sind. Der Bestand sagt etwas anderes:

- `presenceBeforeBooking` hat **vier** Aufrufstellen — `startTimer`, `stopTimer`,
  `resolveOrphanedTimer` **und** `createTimeEntry`.
- `movementOfBooking` hat **drei** — `stopTimer`, `resolveOrphanedTimer` **und**
  `createTimeEntry`.
- Der längste Kommentar der ganzen Datei steht an `CreatedTimeEntry` und begründet auf 40 Zeilen,
  warum die Buchung von Hand **dieselbe** Rechnung anstellen muß wie der Timerstopp: Mit
  `BOOKING_EFFECT` statt `ENTRY_CLOSED_EFFECT` meldete sie für ein erledigtes Todo ein Verlassen
  der Spalte „Erledigt", das nicht stattfindet. Das ist wörtlich der Fehler, gegen den T-101
  angetreten ist.

Ein Schnitt zwischen `timer` und `bookings` hätte also zwei private Helfer über eine
Merkmalsgrenze exportieren müssen, für sieben Aufrufstellen, **deren Gleichlauf die Anforderung
ist**. Statt dessen liegen sie jetzt in `features/timer/movement.ts` — eine eigene Datei
**innerhalb** des Merkmals, von `timer.ts` und `bookings.ts` mit je einer Zeile gelesen, ohne daß
ein einziges Symbol das Merkmal verläßt. Der Vorschlag steht damit auf dem Kopf: Nicht `timer`
und `bookings` sind zwei Merkmale, sondern `timer` ist eines mit drei Anwendungsfalldateien.

`/time-entries` und `/timer` hängen weiterhin an zwei Stellen in `app.ts` — **unverändert**, denn
`features/timer/routes.ts` exportiert wie zuvor `createTimeEntryRoutes` und `createTimerRoutes`.

`/search` hat kein eigenes Merkmal bekommen: eine Route, eine Funktion (`searchEverything`), und
sie sucht über Todos **und** Buchungen. Ein Ordner für anderthalb Dinge ist genau das, was du
ausgeschlossen hast.

### 10.2 Zahlen — und diesmal geht es auf null auf

**Die vier reinen Umzüge sind zeilengleich.** Gemessen, nicht behauptet: `git show HEAD:…` gegen
den Arbeitsstand, Importblöcke ausgenommen —

```
routes/todos.ts         -> features/todos/routes.ts        0 abweichende Zeilen
usecases/attachments.ts -> features/todos/attachments.ts   0 abweichende Zeilen
usecases/image-sweep.ts -> features/todos/image-sweep.ts   0 abweichende Zeilen
usecases/idle.ts        -> features/timer/idle.ts          0 abweichende Zeilen
```

**Die Aufteilung von `usecases/timer.ts` ergibt exakt dieselbe Zahl.**

```
usecases/timer.ts (HEAD)                         314 Anweisungszeilen
timer.ts 200 + bookings.ts 67 + movement.ts 47   314 Anweisungszeilen
```

Der Mengenvergleich: **15 Zeilen gefallen, 15 dazu**, und jede einzelne davon ist entweder eine
Importzeile oder eines von drei `async function X(` → `export async function X(`. Null fachliche
Zeilen. Die achtzeilige `import type { … } from '@takt/domain'`-Klammer und die achtzeilige aus
`pool-movement.ts` sind zu Einzeilern zusammengefallen; dafür stehen drei Importklammern statt
einer und zwei neue `./movement.ts`-Zeilen. Das hebt sich auf den Strich genau auf.

Eine Zeile, die es vorher nicht gab und die ich benenne, weil sie eine Grenze anfaßt:
`import { NO_ENTRIES } from '../../usecases/pool-movement.ts';` in `timer.ts`. `startTimer`
schreibt `presenceBefore ?? NO_ENTRIES` — der neutrale Wert, keine Regel. Ihn über `movement.ts`
weiterzureichen wäre ein Re-Export gewesen, also die Barrel-Datei, die du verboten hast; ihn in
`movementOfStart` hineinzuziehen wäre eine Verhaltensänderung an einer Stelle, an der ich keine
vornehmen wollte.

### 10.3 Fremde Dateien — jede Stelle einzeln, nur der Pfad

Zehn Importzeilen, keine Zusicherung, kein Prüfsatz, kein Wortlaut.

| Datei | Zeile | vorher → nachher |
|---|---|---|
| `apps/outlook-addin/scripts/proof-addin.mjs` | 165 | `src/routes/todos.ts` → `src/features/todos/routes.ts` |
| ” | 175 | `src/routes/time.ts` → `src/features/timer/routes.ts` |
| ” | 215 | `src/usecases/todos.ts` → `src/features/todos/todos.ts` |
| `test/usecases/attachment-input-validation.test.ts` | 39 | `usecases/attachments.ts` → `features/todos/attachments.ts` |
| `test/usecases/idle.test.ts` | 10 | `usecases/timer.ts` → `features/timer/timer.ts` |
| ” | 11 | `usecases/idle.ts` → `features/timer/idle.ts` |
| `test/usecases/image-sweep.test.ts` | 69 | `usecases/image-sweep.ts` → `features/todos/image-sweep.ts` |
| `test/usecases/time-entry-movement.test.ts` | 44 | `usecases/timer.ts` → **`features/timer/bookings.ts`** |
| `test/usecases/timer-orphan-resolution.test.ts` | 43 | `usecases/timer.ts` → `features/timer/timer.ts` |
| `test/usecases/todo-done-movement.test.ts` | 55 | `usecases/todos.ts` → `features/todos/todos.ts` |

Die fettgedruckte Zeile ist die einzige, die nicht bloß ein Ordnerwechsel ist: `createTimeEntry`
liegt jetzt in `bookings.ts` statt bei den Timerfunktionen. Der Prüffall heißt
`time-entry-movement` und mißt genau diese Funktion — der neue Pfad sagt jetzt, was er prüft.

**Kommentare in diesen Dateien, die alte Pfade nennen, habe ich stehengelassen** — das wäre
Wortlaut, und den darf ich nicht anfassen. Vier Stellen, unit-tester:
`timer-orphan-resolution.test.ts:10` und `:33`, `image-sweep.test.ts:9`,
`attachment-input-validation.test.ts:10`.

### 10.4 Läufe nach Welle 2

Alles grün, **`proof:all` Ausgangskode 0** über zwanzig Läufe.

| Lauf | Welle 1 | Welle 2 |
|---|---|---|
| `typecheck` (ganz, samt `typecheck:test` und `typecheck:e2e`) | grün | **grün** |
| `boundaries` | 460 Dateien | **462 Dateien**, „Notiz-Trennung: alle Schichten unverletzt" |
| `proof:codepoints` | 46/0 | 46/0 |
| `proof:openapi` | 115/0 | **115/0** |
| `proof:callers` | 74/0 | **74/0** |
| `proof:conflicts` | 154/0 | 154/0 |
| `proof:tags` | 45/0 | 45/0 |
| `proof:access` | 109/0 | 109/0 |
| `proof:export` | 98/0 | **98/0** |
| `proof:export-api` | 72/0 | 72/0 |
| `proof:taskpane` | 29/0 | 29/0 |
| `proof:foreign` | 21/0 | 21/0 |
| `proof:surface` | 27/0 | 27/0 |
| `proof:addin-wiring` | 32/0 | 32/0 |
| **`proof:layers`** | 15/0 | **17/0** (die zwei neuen Merkmalsprüfungen) |
| `proof:route-policy` | 44/0 | 44/0 |
| `proof:release-safety` | **29/3** | **32/0** — siehe 10.5 |
| `proof:template-fields` | 30/0 | 30/0 |
| `proof:db-permissions` | übersprungen (Windows) | übersprungen (Windows) |
| `proof:addin` | 248/0 | **248/0** |
| `verify:bundle` | 19/0 | 19/0 |
| `test:coverage` | 88 / 1570 / 3 | **zeichengleich** |

`proof:layers` mißt jetzt sechs Merkmale: 60 Quelldateien, davon 9 Routendateien und 21
Anwendungsfälle, und meldet zusätzlich `features/timer` und `features/todos`.

### 10.5 `proof:release-safety` — Zeile 302 nachgezogen, **29/3 → 32/0**

Der Pfad steht jetzt auf `apps/web/src/features/settings/releasePage.ts`. Ich habe die
Begründung **danebengeschrieben**, weil sie sonst beim nächsten Umzug wieder fehlt und jemand
versucht, was du ausgeschlossen hast:

> Anderswo im Bestand ist der feste Pfad seit T-249-1 der Fehler. **Hier ist es umgekehrt**:
> Diese Aufstellung sagt nicht „wo liegt die Datei mit der Adresse", sondern „an wie vielen und
> welchen Orten darf die Adresse überhaupt stehen". Das Merkmal, über das aufgelöst würde, wäre
> die Adresse selbst — die Menge käme dann aus dem Bestand, gegen den geurteilt werden soll, und
> jede dritte Fundstelle wäre über Nacht ein erlaubter Ort. Der Preis ist ein rotes Fenster nach
> jedem Umzug, und es ist **gewollt**: Ein Wächter über eine Obergrenze, der sich seine
> Obergrenze selbst nachzieht, bewacht nichts.

**Drei fremde Stellen nennen weiter den alten Pfad** — gemeldet, nicht angefaßt:

| Datei | Zeile | gehört |
|---|---|---|
| `apps/desktop/scripts/proof-shell-surface.mjs` | 38, 1170 | frontend-dev — Kommentare |
| **`docs/bedrohungsmodell.md`** | **4194, 4361** | **security-checker — dort ist es eine Zusage (A-V-1′), kein Kommentar** |

Die beiden im Bedrohungsmodell wiegen: Ein Papier, das zusichert, die Adresse stehe an einem Ort,
den es nicht gibt, sichert nichts zu. Das gehört in denselben Auftrag wie die nächste Freigabe
der Versionsprüfung.

---

## 11  Welle 3 und 4 — der Schnitt, den ich vorgeschlagen hatte

Er ist gefahren. Was daraus wurde, steht in Abschnitt 12 bis 14; der Endstand in 15.

---

## 12  Welle 3 — `data-transfer` und `version`, gebaut

### 12.1 F-T257-6 beantwortet: **zwei** Substanzdateien, nicht vier

Ich hatte vier vorgeschlagen (`archive.ts`, `csv.ts`, `todoist.ts`, `super-productivity.ts`).
**Die Messung sagt zwei.** Dein Kriterium — schneiden, wo eine Grenze schon ausgeschrieben ist —
läßt in dieser Datei genau **eine** finden, und sie liegt woanders, als ich vermutet hatte.

Was in `usecases/data-transfer.ts` an Grenzen wirklich dasteht:

| Ausgeschriebene Grenze | trennt | belastbar? |
|---|---|---|
| `DATA_ARCHIVE_FORMAT` + `DATA_ARCHIVE_VERSION` + `parseArchive` + `replaceAll` | eigenes Archiv gegen alles andere | **ja** — nur diese Hälfte ersetzt den Bestand, die andere ergänzt ihn |
| `ExternalTask` / `ExternalData` | Leser gegen Schreiber | benannt, aber **nicht** belastbar (siehe unten) |
| `parseCsv` | — | ein Aufrufer, kein Merkmal |

Und die gezählten Kosten der abgelehnten Schnitte:

**Abgelehnt A — vier Dateien (mein eigener Vorschlag).** Gemessen an den Helfern:
`cleanName` hätte **drei** Nutzer (Todoist 3 Stellen, Super Productivity 4, `importExternal` 8),
`cleanTitle` zwei, `dayFrom` zwei, `record` zwei, `text` zwei, `timestampFromMillis` zwei.
**Sechs Helfer ohne Heimat** — also eine erfundene siebte Datei, und die hätte keinen Namen außer
`utils.ts`. Dazu: `importExternal` (159 Anweisungszeilen, der einzige Schreiber) hätte in keiner
der vier ein Zuhause, eine **fünfte** wäre nötig gewesen. Ertrag wären 178 statt 528 Zeilen in der
größten Datei.

**Abgelehnt B — drei Dateien an `ExternalData` (Leser / Schreiber / Archiv).** Die Grenze steht
da, sie trägt nur nicht: `cleanName` hat **7 Lesestellen gegen 8 Schreibstellen**. Die eine
Funktion, die beide Seiten am dichtesten brauchen, hätte auf keiner Seite ein Zuhause. Ertrag
wären 280 + 160 statt 528.

**Gewählt — zwei.** `data-transfer.ts` (199) und `foreign.ts` (528), dazu die zwei Dateien, die es
schon gab, und die Tür:

```
src/features/data-transfer/
  routes.ts                    51   die vier Türen
  data-transfer.ts            199   das eigene Archiv (A-20) — Kennung, Fassung 5,
                                    parseArchive, Export, Import
  foreign.ts                  528   die Fremdimporte (A-20.7) — CSV, Todoist,
                                    Super Productivity, der Schreiber
  import-call-numbers.ts       31   der einstellbare Call-Regex, mit Frist
  super-productivity-time.ts   73   OutlookBridge-Tageszeiten
```

**Deinen Hinweis habe ich wörtlich befolgt: die Fassungsprüfung bleibt bei den Daten, über die
sie urteilt.** `parseArchive` liest 1 bis 5, weist alles andere ab und steht in derselben Datei
wie `importDataArchive`. Was getrennt ist, ist die **Anwendung** — `replaceAll` hier, Anlegen
nebenan. Und weil diese Datei den lesbarsten Bestand des Erzeugnisses trägt, steht der Satz jetzt
in ihrem Kopf, nicht nur in `CLAUDE.md`.

`foreign.ts` bleibt mit 528 Zeilen die größte Datei des Dienstes. Das ist keine Nachlässigkeit,
sondern das Ergebnis von A und B: Jeder Schnitt darin kostet mehr, als er einbringt, und der Kopf
der Datei schreibt hin, warum — damit der nächste nicht dieselbe Runde dreht.

### 12.2 Eine dritte Kopie desselben Prädikats, gefunden beim Schneiden

`const record = (value) => …` — die Prüfung „ein Objekt, das keine Liste ist" — stand **zweimal**
im Bestand: `usecases/data-transfer.ts:107` und `usecases/super-productivity-time.ts:10`,
zeichengleich, beide privat. Der Schnitt hätte eine **dritte** erzeugt.

Statt dessen steht sie jetzt einmal, ausgeführt in `data-transfer.ts`, und `foreign.ts` wie
`super-productivity-time.ts` lesen sie von dort. **Zwei Kopien werden eine, nicht drei.** Das ist
dieselbe Sorte Fund wie `toFieldErrors` in Welle 1 (Abschnitt 1A) und ebenso beim Schneiden
aufgefallen, nicht bei der Suche danach.

### 12.3 `version` — drei Dateien, alle unverändert

```
src/features/version/
  routes.ts    18   liest ab, fragt nicht
  version.ts  164   hält den Stand im Arbeitsspeicher (vorher version/checker.ts)
  source.ts   127   die eine Adresse und die ganze Prüfung der fremden Antwort
```

`checker.ts` heißt jetzt `version.ts`, weil der Merkmalsordner es verlangt; sonst ändert sich
nichts. **Alle drei sind außerhalb der Importblöcke zeilengleich** — 0 abweichende Zeilen, wie
gemessen.

`proof:release-safety` `API_URL_FILE` (Zeile 292) ist in derselben Welle nachgezogen, wie
angekündigt, und aus demselben Grund weiterhin ein fester Pfad wie Zeile 302. Der Lauf steht bei
**32/0**; er war zwischendurch rot, und das war eingeplant.

### 12.4 Zahlen

**Die fünf reinen Umzüge sind zeilengleich** (außerhalb der Importblöcke, gegen `git show HEAD:…`):

```
routes/data-transfer.ts        -> features/data-transfer/routes.ts               0
usecases/import-call-numbers.ts-> features/data-transfer/import-call-numbers.ts  0
routes/version.ts              -> features/version/routes.ts                     0
version/checker.ts             -> features/version/version.ts                    0
version/source.ts              -> features/version/source.ts                     0
```

**Die Aufteilung von `data-transfer.ts` samt Zusammenführung von `record`:**

```
usecases/data-transfer.ts 722 + usecases/super-productivity-time.ts  76   = 798
data-transfer.ts 199 + foreign.ts 528 + super-productivity-time.ts   73   = 800
```

**+2.** Mengenvergleich: 14 gefallen, 16 dazu, und **jede** Zeile ist entweder eine Importzeile
oder gehört zur `record`-Zusammenführung (eine ganze Kopie fällt, −4; der Kopf der übrigen wird
`export`, ±0; zwei neue Importzeilen, +2). Der Rest sind umsortierte Importklammern. Keine
fachliche Zeile.

---

## 13  Welle 4 — `src/routes/` und `src/usecases/` gibt es nicht mehr

```
src/
  context.ts          der gemeinsame Zusammenhang aller Anwendungsfälle
  pool-movement.ts    von todos, timer und der Add-in-Tür gebraucht
  tag-names.ts        von todos und der Add-in-Tür gebraucht
  features/…          acht Merkmale
  access/ http/ taskpane/   die Adapter — hier trägt der Ordnername die Grenze zu Recht
  routes/addin/       die Fläche des Add-ins, fremde Dateihoheit
  app.ts composition.ts config.ts errors.ts index.ts logger.ts main.ts runtime.ts startup.ts
```

Alle drei sind **zeilengleich** umgezogen: `pool-movement.ts` 0 abweichende Zeilen,
`tag-names.ts` 2 (beides Pfadangaben in Kommentaren aus Welle 2), `context.ts` 26 (der
neugefaßte Kopf aus Welle 1, Abschnitt 1B).

Der Endstand: acht Merkmale, drei gemeinsame Module an der Wurzel, drei Adapterordner. **Keine
Datei über 528 Anweisungszeilen**, keine Barrel, kein `utils.ts`, kein Unterordner unter einem
Merkmal, keine neue Schicht.

---

## 14  `proof:layers` — eine Prüfung wurde rot, und was daraus wurde

Beim Umzug von `version/source.ts` nach `features/version/` schlug Abschnitt 1 an:

```
  FEHL  keiner nennt `Response`, `Context` oder `c.json(` — src/features/version/source.ts
```

**Zu Recht gefunden, falsch benannt.** Jenes `Response` ist die **fetch**-Antwort von GitHub —
die eine ausgehende Verbindung des Erzeugnisses —, kein Antwortobjekt an einen Aufrufer. Mein
Prüfsatz konnte eingehendes von ausgehendem HTTP nicht unterscheiden.

Er fragt jetzt nach `c.json(`, `c.req` und `HTTPException`: drei Marken, die es ausschließlich
auf der eingehenden Seite gibt. **Das ist an einer Stelle eine Verengung, und sie steht im
Quelltext benannt** (E-101 — eine Lockerung, die aussieht wie Pflege, ist der Fehler, den ich
nicht machen will):

- `Context<` ist **nicht** verloren: Hono ist die einzige Quelle dieses Typs, und wer ihn nennt,
  muß ihn einführen — das fängt der Prüfsatz darüber vollständig ab.
- `Response` **ist** verloren, bewußt. Es ist global; darauf zu prüfen hieße, jede ausgehende
  Verbindung als eingehende zu zählen.
- Dazu kamen `c.req` und `HTTPException`, die vorher **gar nicht** geprüft waren.

**Was ich gebaut und wieder weggeworfen habe.** Aus dem Fehlalarm entstand ein Abschnitt 1b
„genau eine Datei ruft nach außen" (E-001, A-18.2). Er ging nicht: `source.ts` nennt `fetch` nie
beim Namen, sondern über `options.fetch ?? fetch`, und ein Wächter, der auf das Wort `fetch` im
Fließtext anschlägt, ist schlechter als keiner — vier Dateien nennen es in Bezeichnern wie
`fetch_context_not_allowed` und `sec-fetch-site`. Die Frage gehört ohnehin
`proof:release-safety`, und **dort hängt sie an der Adresse statt an einem Bezeichner**. Der
Abschnitt ist gefallen; warum, steht im Quelltext, damit ihn niemand ein zweites Mal baut.

Stand: **20/0**, 63 Quelldateien, 9 Routendateien, 23 Anwendungsfälle, acht Merkmale einzeln
geprüft.

---

## 15  Läufe nach Welle 4 — der Endstand

| Lauf | Ergebnis |
|---|---|
| `typecheck` (ganz, samt `typecheck:test` und `typecheck:e2e`) | **grün** |
| `boundaries` | grün, **463** Quelldateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `proof:all` | **Ausgangskode 0** über zwanzig Läufe |
| `proof:codepoints` | 46/0 |
| `proof:openapi` | 115/0 |
| `proof:callers` | 74/0 |
| `proof:conflicts` | 154/0 |
| `proof:tags` | 45/0 |
| `proof:access` | 109/0 |
| `proof:export` | 98/0 |
| `proof:export-api` | 72/0 |
| `proof:taskpane` | 29/0 |
| `proof:foreign` | 21/0 |
| `proof:surface` | 27/0 |
| `proof:addin-wiring` | 32/0 |
| `proof:layers` | **20/0** |
| `proof:route-policy` | 44/0 |
| `proof:release-safety` | **32/0** |
| `proof:template-fields` | 30/0 |
| `proof:db-permissions` | übersprungen (Windows) |
| `proof:addin` | **248/0** |
| `verify:bundle` | 19/0 |
| `test:coverage` | 88 Dateien, **1570 bestanden, 3 übersprungen** — zeichengleich zum Ausgangsstand vor Welle 1 (gemessen 19:20) |
| `vitest run apps/local-api packages` | **68 Dateien, 1379 bestanden, 3 übersprungen** — meine Fläche, gemessen 19:41 |

Über vier Wellen hat sich **keine** dieser Zahlen geändert außer denen, die sich ändern mußten:
`proof:layers` gab es nicht, `proof:release-safety` war fremdverursacht rot, `boundaries` zählt
mehr Dateien, weil es mehr gibt.

**Zwei Umgebungsbefunde, keine Funde.**

1. Ein Lauf von `test:coverage` fiel mit `EADDRINUSE 127.0.0.1:17844` aus — ein Prozeß eines
   früheren Nachweislaufs hielt den Port des Aufgabenbereichs. Zwei Prozesse beendet, danach
   grün. Dieselbe Klasse wie der stehende Vite-Prozeß auf 5173, den du genannt hast.
2. Der Lauf um 19:41 zeigte **vier** rote Fälle, alle unter `apps/web/test/`. Zwei der Dateien
   sind um **19:39 und 19:40** entstanden, also mitten in meinem Lauf: In `apps/web` arbeitet
   gerade jemand. Meine Fläche habe ich deshalb getrennt gemessen — 68 Dateien, 1379 bestanden,
   3 übersprungen, null rot.

---

## 16  Fremde Importpfade in Welle 3 und 4 — jede Stelle einzeln

Unter deiner benannten Ausnahme: **nur der Pfad**, keine Zusicherung, kein Prüfsatz, kein
Wortlaut.

| Datei | Zeile | vorher → nachher | gehört |
|---|---|---|---|
| `test/routes/version.test.ts` | 17 | `src/version/checker.ts` → `src/features/version/version.ts` | unit-tester |
| ” | 18 | `src/routes/version.ts` → `src/features/version/routes.ts` | unit-tester |
| `test/version/checker.test.ts` | 20, 21 | `src/version/{checker,source}.ts` → `src/features/version/{version,source}.ts` | unit-tester |
| `test/version/source.test.ts` | 25 | `src/version/source.ts` → `src/features/version/source.ts` | unit-tester |
| `test/usecases/import-call-numbers.test.ts` | 3 | `usecases/import-call-numbers.ts` → `features/data-transfer/…` | unit-tester |
| `test/usecases/data-transfer.test.ts` | 5 | `usecases/context.ts` → `src/context.ts` | unit-tester |
| ” | 6–12 | **eine Importzeile wird zwei** — siehe unten | unit-tester |
| `test/usecases/pool-movement.test.ts` | 52, 53 | `usecases/pool-movement.ts` → `src/pool-movement.ts` | unit-tester |
| `test/usecases/pool-movement-states.test.ts` | 37, 38 | dito | unit-tester |
| `test/usecases/{attachment-input-validation,idle,time-entry-movement,timer-orphan-resolution,todo-done-movement}.test.ts` | je 1–2 | `usecases/context.ts` → `src/context.ts`, `usecases/pool-movement.ts` → `src/pool-movement.ts` | unit-tester |

**Die eine Stelle, die mehr als ein Pfadwechsel ist**, und deshalb hier ausgeschrieben:
`test/usecases/data-transfer.test.ts` holte fünf Namen aus **einer** Datei, die es jetzt zweimal
gibt. Aus

```ts
import { exportDataArchive, importDataArchive, importSuperProductivity,
         importTodoist, parseCsv } from '../../src/usecases/data-transfer.ts';
```

wurden zwei Zeilen mit denselben fünf Namen — `exportDataArchive` und `importDataArchive` aus
`data-transfer.ts`, die drei anderen aus `foreign.ts`. Kein Name geändert, kein Prüfsatz
angefaßt.

**Und eine Stelle außerhalb deiner Ausnahmeliste, die ich trotzdem angefaßt habe:**
`tests/e2e/support/version-check-entry.ts:67` (e2e-tester) zieht `createGithubReleaseSource` aus
`src/version/source.ts`. Sie stand nicht auf der Liste, und sie hat `typecheck` — also das ganze
Tor — rot gemacht. Nach deiner Regel („blockiert das den Lauf, handle wie geschehen und mach es
kenntlich"): Pfad geändert, hier gemeldet, **eine** Zeile, sonst nichts.

---

## Annahmen

1. **`timer` ist ein Merkmal, `bookings` keines** — gegen meinen eigenen Vorschlag und gegen den
   Schnitt in `apps/web`. Gemessen in 10.1.
2. **`data-transfer` bekommt zwei Substanzdateien, nicht vier** — ebenfalls gegen meinen eigenen
   Vorschlag. Gemessen in 12.1; die abgelehnten Schnitte sind mit Zahlen begründet.
3. **`setExportStatus`/`markNotBilled` bleiben beim Export** (F-T257-5, von dir entschieden). Der
   Grund steht seit Welle 3 **an der Kante** in `features/timer/routes.ts`, ausgeschrieben, samt
   der drei Auswege, die schlechter wären.
4. **Drei Umbenennungen:** `export-catalog.ts` → `export/catalog.ts`, `version/checker.ts` →
   `version/version.ts`, `usecases/data-transfer.ts` → `data-transfer/data-transfer.ts` und
   `foreign.ts`. Alle drei, weil der Merkmalsordner den Namen sonst wiederholt oder fordert.
5. **Die Standard-Tags sind Einstellungen** (aus `usecases/todos.ts` nach `features/settings/`).
6. **`app.ts` habe ich in jeder Welle angefaßt** — ausschließlich Importzeilen, nie den
   Einhängeblock, nie die Reihenfolge. Welle 1 in Abschnitt 3 ausgeschrieben; Welle 2 zwei
   Zeilen, Welle 3 und 4 vier weitere. Alle nur Pfad.
7. **`record` steht jetzt einmal statt zweimal** (12.2). Das ist eine Zusammenführung im Zuge des
   Schnitts, keine Verhaltensänderung — beide Fassungen waren zeichengleich.
8. **`features/timer/movement.ts` und `features/data-transfer/foreign.ts` sind neue Dateinamen**,
   aber kein neuer Code: In beiden steht ausschließlich, was vorher in einer größeren Datei stand.
9. **Der Dateiname `<merkmal>.ts` ist eine Zusage**, die `proof:layers` Abschnitt 4 für alle acht
   Merkmale mißt.

## Risiken

1. **Die Schichtgrenze ist optisch schwächer.** Vorher trennten zwei Ordner, jetzt trennt ein
   Dateiname. `proof:layers` fängt das, ein Mensch beim Überfliegen womöglich nicht: Wer
   `features/export/routes.ts` liest, sieht `export.ts` daneben und könnte die
   Transaktionsklammer eine Datei zu weit oben aufmachen.
2. **`proof:layers` Abschnitt 1 mißt `Response` nicht mehr** (Abschnitt 14). Der Verlust ist
   benannt und im Quelltext begründet; die Deckung durch den `hono`-Prüfsatz darüber ist
   argumentiert, nicht gemessen. Wenn dir das zu wenig ist, ist die schärfere Fassung ein
   Prüfsatz über den **Import** von `hono/*`-Untermodulen — den kann ich nachreichen.
3. **Für die eine ausgehende Verbindung gibt es keinen zweiten Zeugen.** `proof:release-safety`
   mißt die Adresse; die **Stelle** mißt niemand, und mein Versuch dazu ist gefallen (14). Kein
   neues Risiko — es war vorher genauso —, aber jetzt ist es benannt.
4. **`features/data-transfer/foreign.ts` hat 528 Anweisungszeilen** und bleibt die größte Datei
   des Dienstes. Begründet in 12.1; der Kopf der Datei trägt die Begründung, damit der nächste
   nicht dieselbe Runde dreht.
5. **Drei vorher private Funktionen sind exportiert** (`movementOfStart`, `presenceBeforeBooking`,
   `movementOfBooking`) und eine vierte (`record`). Sie tragen keine Regel; die Regeln stehen in
   `pool-movement.ts` und in der Domäne. „Privat" war trotzdem eine Grenze, und sie ist weg. Was
   bleibt, ist der Ordner: Niemand außerhalb von `features/timer/` beziehungsweise
   `features/data-transfer/` ruft sie. Ein Wächter dafür gibt es nicht.
6. **`routes/data-transfer.ts` schreibt `'body'`, alle anderen `'(rumpf)'`** — F-T257-1, weiter
   offen. Ich habe es beim Umzug **nicht** angefaßt, obwohl das Merkmal ohnehin gewandert ist:
   Es ist eine Textänderung an einer Fehlerantwort und braucht die Suche nach E-087.
7. **Sicherheitlich verändert sich über alle vier Wellen nichts.** Kein Guard, keine Kette, keine
   Route, kein Statuscode, kein Schema. `proof:access` 109/0, `proof:route-policy` 44/0,
   `proof:export` 98/0, `proof:addin` 248/0, `proof:release-safety` 32/0, `boundaries`
   „Notiz-Trennung: alle Schichten unverletzt". Rundung, Base64 über UTF-8, Exportstatus je
   Buchung und die Trennung von Buchungsnotiz und Todo-Vermerk sind nicht berührt; die
   Mengendifferenzen in 5, 10.2 und 12.4 belegen es zeilenweise.
8. **In `apps/web` lief zweimal parallel jemand** — zu Beginn von Welle 1 (Abschnitt 6,
   Fußnote 1) und wieder am Ende (Abschnitt 15). Meine Zahlen für `typecheck`, `proof:foreign`
   und den letzten `test:coverage` sind deshalb nicht gegen einen ruhenden Baum gemessen. Für
   `apps/local-api` und `packages/` sind sie es, und dort ist alles grün.
9. **Die vollständige Datensicherung liegt jetzt in einer eigenen Datei mit eigenem Kopf.** Das
   ist eine Verbesserung für den Leser und eine Einladung für den nächsten, der etwas ergänzt —
   deshalb steht der Satz über die lesbaren Kundendaten dort ausgeschrieben und nicht nur in
   `CLAUDE.md`.

## Offene Fragen

- **F-T257-1** (weiter offen). Darf `features/data-transfer/routes.ts` sein `'body'` gegen
  `'(rumpf)'` tauschen? Textänderung an einer Fehlerantwort, braucht die Suche nach E-087 über
  `tests/**` **und** die Quellverzeichnisse, plus die Zustimmung dessen, der `'body'` verlangt
  hat, falls es einen gibt.
- **F-T257-2** (weiter offen). Soll ich `proof:route-policy`, `proof:openapi` und `proof:addin`
  auf ihre eigenen Ausnahmelisten hin ansehen? Das ist der Auftrag, den E-103 am Ende offenläßt.
  `proof:release-safety` hat in dieser Aufgabe zweimal gezeigt, wie eine solche Liste altert —
  einmal fremdverursacht (Zeile 302), einmal durch meinen eigenen Umzug (Zeile 292).
- **F-T257-7** (neu). Soll `proof:layers` Abschnitt 1 den Verlust von `Response` durch einen
  Prüfsatz über `hono/*`-Untermodule ersetzt bekommen (Risiko 2)? Fünf Zeilen, aber es ist eine
  Änderung an einem Wächter und gehört entschieden, nicht nebenbei gemacht.

## Nächster Schritt

**Die Umstrukturierung des Dienstes ist fertig.** Acht Merkmale, `src/routes/` bis auf `addin/`
leer, `src/usecases/` verschwunden, alle Läufe grün, `proof:all` Ausgangskode 0.

1. **Qualitätstor.** Code-Reviewer, Spezifikations- und UX-Reviewer, Tester und Security-Checker.
   Für den Security-Checker gibt es zwei benannte Gegenstände: `docs/bedrohungsmodell.md:4194`
   und `:4361` nennen einen Pfad, den es nicht mehr gibt (10.5), und der neue Kopf von
   `features/data-transfer/data-transfer.ts` behauptet etwas über die Datenmenge, das er
   gegenlesen sollte.
2. **F-T257-1 und F-T257-7** als eigene, kleine Aufträge.
3. **F-T257-2** als eigener Auftrag — der ist der größte der drei und der einzige, der wieder
   etwas finden dürfte.
4. **`docs/` nachziehen.** `docs/architektur.md` und `docs/datenmodell.md` habe ich in jeder Welle
   mitgeführt (meine Hoheit). `docs/bedrohungsmodell.md` und `docs/testplan.md` nicht — die Liste
   unten.

**Fremde Dateien, die auf alte Pfade zeigen** — nicht angefaßt, hier gemeldet. Es sind Kommentare
und, in den beiden hervorgehobenen Zeilen, eine Zusage.

| Datei | Zeile | zeigt auf | gehört |
|---|---|---|---|
| **`docs/bedrohungsmodell.md`** | **4194, 4361** | `apps/web/src/lib/releasePage.ts` — als **Zusage** A-V-1′ | **security-checker** |
| `docs/bedrohungsmodell.md` | 3049–3050 | `routes/structure.ts`, `routes/export.ts` | security-checker |
| `docs/bedrohungsmodell.md` | 7290 | `usecases/export-catalog.ts` | security-checker |
| `docs/bedrohungsmodell.md` | 7703 | `src/routes/export.ts` | security-checker |
| `docs/testplan.md` | 2654 | `usecases/board.ts` | e2e-tester |
| `apps/desktop/scripts/proof-shell-surface.mjs` | 38, 1170 | `apps/web/src/lib/releasePage.ts` | frontend-dev |
| `packages/export/src/template.ts` | 80 | `usecases/export-catalog.ts` | integration-dev |
| `packages/storage/test/repo-export.test.ts` | 238 | `usecases/export.ts` | unit-tester |
| `apps/web/src/api/types.ts` | 772 | `usecases/structure.ts` | frontend-dev |
| `apps/web/src/features/board/BoardScreen.tsx` | 200 | `usecases/board.ts` | frontend-dev |
| `apps/local-api/test/usecases/*.test.ts` | 4 Stellen | `usecases/{timer,image-sweep,attachments}.ts` in **Kommentaren** | unit-tester |
| `apps/local-api/src/routes/addin/{index,schema,service}.ts` | 8 Stellen | `routes/todos.ts`, `usecases/{todos,timer,pool-movement,tag-names}.ts` | integration-dev |
| `apps/outlook-addin/scripts/fixtures.mjs` | 430 | `usecases/pool-movement.ts` | integration-dev |
| `apps/outlook-addin/src/duplicate/{reopen,rule}.ts` | je 1 | `usecases/pool-movement.ts`, `routes/addin/service.ts` | integration-dev |

Keine davon bricht einen Lauf. Sie zeigen ins Leere, und das ist eine Ebene unterhalb dessen,
wogegen E-103 geschrieben ist: nicht ein Wächter, der eine tote Liste anwendet, sondern ein Satz,
der einen Ort nennt, den es nicht mehr gibt. Auch das altert, nur langsamer.
