# T-256 — `shared/ui` schließen, `screens/` auflösen, `releasePage.ts` umziehen

Aufgabe: T-256
Status: **braucht Review**

> ## ⚠️ Der neue Pfad, den domain-dev braucht
>
> ```
> apps/web/src/lib/releasePage.ts   →   apps/web/src/features/settings/releasePage.ts
> ```
>
> Nachzuziehen: **eine** Zeile, `apps/local-api/scripts/proof-release-safety.mjs:302`
> in `RELEASE_PREFIX_FILES`. Der Dateiinhalt ist **zeichengleich** (sha256 gemessen,
> Abschnitt 9); es hat sich nur der Ort geändert. `proof:release-safety` ist deshalb
> heute rot — **erwartet, angekündigt, nicht von mir zu beheben**: 29 bestanden,
> 3 fehlgeschlagen, und alle drei nennen den neuen Pfad beim Namen (Abschnitt 14).
>
> Drei weitere Stellen nennen den alten Pfad und sind **nicht** in meiner Hoheit —
> zwei Kommentare und **eine Zusage im Bedrohungsmodell** (Abschnitt 12).

`screens/` gibt es nicht mehr. `shared/ui` hält **neunzehn** Dateien; von deinen zehn
Kandidaten sind **acht ganz** hineingegangen, einer **geteilt**, einer **nicht**. Dazu
kam ein **elfter**, den du nicht genannt hast und den die Abhängigkeit erzwingt.

---

## 1  Artefakte

### Verschoben, Inhalt außer Importzeilen unverändert (`git mv`, 11 Dateien)

```
components/Primitives.tsx      → shared/ui/Primitives.tsx         2 Importzeilen
components/Menu.tsx            → shared/ui/Menu.tsx               4
components/FormDialog.tsx      → shared/ui/FormDialog.tsx         6
components/FilterBar.tsx       → shared/ui/FilterBar.tsx          5
components/ConfirmDialog.tsx   → shared/ui/ConfirmDialog.tsx      3
components/Select.tsx          → shared/ui/Select.tsx             4
components/ExportStatus.tsx    → shared/ui/ExportStatus.tsx       2
components/RadioRow.tsx        → shared/ui/RadioRow.tsx           2
components/DialogSurface.tsx   → shared/ui/DialogSurface.tsx      1     ← der elfte
lib/releasePage.ts             → features/settings/releasePage.ts 0     ← sha256-gleich
screens/DashboardScreen.tsx    → app/DashboardScreen.tsx         10
```

Bei allen zehn `.tsx` ist **jede** abweichende Zeile eine Importzeile — zeilenweise
gemessen, nicht behauptet (Abschnitt 9).

### Neu — vier Dateien, alle aus der Teilung von `screens/parts.tsx`

| Datei | Zeilen | Inhalt |
|---|---|---|
| `shared/ui/ScreenHeader.tsx` | 76 | `ScreenHeaderProps`, `ScreenHeader`, `RefreshHint` |
| `shared/ui/AsyncBoundary.tsx` | 51 | `AsyncBoundaryProps`, `AsyncBoundary` |
| `shared/ui/StatTile.tsx` | 37 | `StatTile` |
| `features/export/ExportTabs.tsx` | 59 | `ExportTabs` — **nicht** in `shared` |

Jeder der fünf verschobenen Rümpfe ist **zeichengleich** aus `parts.tsx` übernommen;
gemessen mit `String.includes` gegen den Stand vor der Änderung (Abschnitt 9).

### Gelöscht

```
screens/parts.tsx      207 Zeilen, restlos in die vier Dateien oben aufgegangen
screens/               der Ordner selbst — leer, entfernt
```

### Gestrichen — die drei toten Ausfuhren (Abschnitt 7)

```
features/settings/theme.ts           usePrefersReducedMotion   −14 Zeilen
features/settings/api.ts             IssuedToken               −10 Zeilen (9 + eine Typeinfuhr)
features/export/TemplatePreview.tsx  TemplatePreviewCard       −17 Zeilen (+1 Importzeile)
```

### Sonst angefaßt

- `features/structure/PoolFormDialog.tsx` — `FormSection` ausgeführt, mit neun Zeilen
  Begründung, **warum sie trotzdem nicht in `shared` gehört** (Abschnitt 4).
- `showcase/RuleSection.tsx` — benutzt `FormSection`, statt das Markup nachzubauen.
- 81 Dateien mit **ausschließlich** geänderten Importzeilen.
- Vier Pfadangaben in Kommentaren: `styles/app.css` (2), `styles/base.css` (1),
  `styles/components.css` (1), `design/DESIGNSYSTEM.md` (2) — drei davon waren schon vor
  diesem Auftrag falsch (Abschnitt 11).
- `shared/ui/ExportSummaryStrip.tsx` — Einfuhrpfad `../../shared/ui/ExportStatus` auf
  `./ExportStatus` normalisiert und ein Kommentarpfad aus Welle 4 berichtigt.

### `apps/web/test/**` — **zwei** Dateien, nur Pfade, wie erlaubt

| Datei | Was |
|---|---|
| `test/components/dismissLabel.test.ts:2,54` | Kopfkommentar und Einfuhrpfad auf `src/shared/ui/Primitives.tsx` |
| `test/components/touchedCallSiteNeutrality.test.ts:78,88` | zwei `path.resolve`-Pfade auf `src/shared/ui/FormDialog.tsx` und `…/ConfirmDialog.tsx` |

Der zweite ist **kein Kommentar**: Der Prüffall liest die Datei vom Dateisystem und wäre
ohne die Änderung rot. Keine Zusicherung, kein Wortlaut, kein Fall dazu oder weg.

---

## 2  Die zehn Kandidaten, **einzeln** geprüft

Kriterium wörtlich: *ein Baustein gehört in `shared`, wenn ihn **mehr als ein Merkmal**
wirklich braucht.* Gezählt sind **Merkmale** (`features/<name>/`), nicht Dateien;
`showcase/`, `app/` und `api/` zähle ich **nicht** als Merkmal mit — die Musterseite
zeigt, was es gibt, sie braucht nichts.

| Baustein | Merkmale, die ihn lesen | Zweiter Benutzer, namentlich | Urteil |
|---|---|---|---|
| `Primitives.tsx` | **8** — board, bookings, export, settings, structure, tags, timer, todos | `features/bookings/BookingsScreen.tsx` (nach `features/board/BoardColumn.tsx`) | **shared** |
| `FormDialog.tsx` | **8** — board, bookings, export, settings, structure, tags, timer, todos | `features/bookings/BookingDialogs.tsx` (nach `features/board/BoardSetupDialog.tsx`) | **shared** |
| `Select.tsx` | **6** — bookings, export, settings, structure, tags, todos | `features/export/TemplateFieldRow.tsx` (nach `features/bookings/BookingsScreen.tsx`) | **shared** |
| `ConfirmDialog.tsx` | **5** — bookings, export, settings, tags, todos | `features/export/ExportScreen.tsx` (nach `features/bookings/BookingDialogs.tsx`) | **shared** |
| `FilterBar.tsx` | **5** — board, bookings, export, timer, todos | `features/bookings/BookingsScreen.tsx` (nach `features/board/BoardScreen.tsx`) | **shared** |
| `ExportStatus.tsx` | **5** — board, bookings, export, timer, todos (dazu `api/types.ts`, `app/`) | `features/bookings/BookingTable.tsx` (nach `features/board/Kanban.tsx`) | **shared** |
| `Menu.tsx` | **3** — board, bookings, todos | `features/bookings/BookingTable.tsx` (nach `features/board/BoardColumn.tsx`) | **shared** |
| `RadioRow.tsx` | **3** — settings, structure, todos | `features/structure/PoolFormDialog.tsx` (nach `features/settings/SettingsScreen.tsx`) | **shared** |
| `screens/parts.tsx` | — | **geteilt**, Abschnitt 3 | **3 von 4 nach shared** |
| `FormSection` | **1** — nur `features/structure` | **es gibt keinen zweiten** | **bleibt bei structure** |

Und der elfte, den ich hinzugenommen habe:

| Baustein | Merkmale | Zweiter Benutzer | Urteil |
|---|---|---|---|
| `DialogSurface.tsx` | **2** — export, settings | `features/settings/UpdateDialog.tsx` (nach `features/export/TemplatesScreen.tsx`) | **shared** |

**Warum ich ihn hinzugenommen habe, obwohl er nicht auf der Liste stand.**
`FormDialog` und `ConfirmDialog` führen ihn ein. Läge er weiter in `components/`, hätte
`shared/ui` zwei Pfeile **hinauf** in den Restehaufen, den die nächste Welle auflöst — und
„vorübergehend" ist die übliche Lebensdauerangabe für so einen Pfeil. Er erfüllt das
Kriterium außerdem **aus eigener Kraft**: zwei Merkmale, beide oben namentlich.
Wenn du das anders siehst, sind es fünf Importzeilen zurück.

Nach der Verschiebung führt `shared/ui` **keinen** Pfeil mehr nach `components/` und
**keinen** nach `features/` — gemessen, nicht angenommen (Abschnitt 8).

---

## 3  `screens/parts.tsx` — die Datei, die als Ganzes nicht paßte

Sie hieß „Bausteine, die jede Ansicht braucht" und hielt **vier** Dinge, von denen eines
gar nicht jede Ansicht braucht. Eine Sammeldatei nach `shared` zu schieben wäre genau die
Bauart gewesen, vor der die Regel warnt — nur eine Ebene kleiner.

| Ausfuhr | Merkmale, die sie lesen | Zweiter Benutzer | Ziel |
|---|---|---|---|
| `AsyncBoundary` | **7** — board, bookings, export, settings, tags, timer, todos | `features/bookings/BookingsScreen.tsx` | `shared/ui/AsyncBoundary.tsx` |
| `ScreenHeader` | **7** — board, bookings, export, settings, tags, timer, todos | `features/bookings/BookingsScreen.tsx` | `shared/ui/ScreenHeader.tsx` |
| `RefreshHint` | **3** — board, bookings, export | `features/bookings/BookingsScreen.tsx` | dieselbe Datei wie `ScreenHeader` |
| `StatTile` | **3** — export, timer, todos | `features/timer/TimeScreen.tsx` | `shared/ui/StatTile.tsx` |
| `ExportTabs` | **1** — nur export (`ExportScreen`, `TemplatesScreen`, `ExportAuditScreen`) | **es gibt keinen zweiten** | `features/export/ExportTabs.tsx` |

**`ExportTabs` ist die Ausfuhr, die deine Erwartung bestätigt.** Sie sieht so allgemein
aus wie irgendetwas — eine Unterreiterleiste —, und sie hat genau einen Kunden. Ihre drei
Adressen *sind* die drei Ansichten von `features/export`. In `shared` hätte sie eine
Allgemeinheit behauptet, die nirgends eingelöst wird. Ein vierter Treffer stand in der
Textsuche und war ein **Kommentar** (`features/settings/SettingsScreen.tsx:48` nennt sie,
führt sie nicht ein) — genau die Falle, gegen die „gesucht wird über den Wortlaut, und
dann wird gelesen" gebaut ist.

**`RefreshHint` bleibt bei `ScreenHeader`.** Sechs Zeilen, und `ScreenHeader` zeigt ihn
selbst — eine eigene Datei dafür stellte die Fünfzig-Zeilen-Regel aus Welle 5 auf den
Kopf. Auch hier war ein Treffer ein Kommentar (`app/useAsync.ts:36`).

---

## 4  `FormSection` — die Dublette ist weg, `shared` hat sie trotzdem nicht bekommen

Der Befund stimmte: `showcase/RuleSection.tsx:395` baute dasselbe Markup von Hand nach.

```
vorher (Musterseite)   <div className="form-section">
                         <h3 className="form-section__title">Diese Regel trifft</h3>
nachher                <FormSection title="Diese Regel trifft">
```

**Aufgelöst — ohne erfundene Grenze, und ohne `shared`.** `FormSection` ist jetzt aus
`features/structure/PoolFormDialog.tsx` ausgeführt; die Musterseite führt sie von dort
ein. Das ist **keine** neue Bauart: `showcase/RuleSection.tsx` holt sich schon heute
`FolderPicker`, `StatusPicker` und `RuleSummary` aus `features/structure/`.

Warum nicht `shared/ui/FormSection.tsx`: Sie hat **ein** Merkmal als Leser. Die
Musterseite ist der zweite Benutzer, aber sie ist kein Merkmal — sie zeigt, was es gibt.
Wäre sie ein zulässiger Zweitbenutzer, käme über kurz oder lang jeder Baustein nach
`shared`, denn die Musterseite zeigt fast alles. Das ist der Sammelordner.

Warum nicht `features/structure/FormSection.tsx` als eigene Datei: 30 Zeilen, ein
Merkmal. Die Fünfzig-Zeilen-Regel aus Welle 5 spricht dagegen, und die Regel wird nicht
pro Datei neu gezogen.

**Der eine Unterschied im gezeichneten Baum, und er ist auf der Musterseite:**
`<div className="form-section">` wird zu `<section className="form-section">`. Die
Klassenfamilie ist elementfrei geschrieben (`app.css:1167,1175,1182`,
`components.css:364,366` — alle über die Klasse), und ein `<section>` **ohne**
zugänglichen Namen bildet auf `generic` ab, genau wie ein `div`. Rolle, Baum der
Vorlesehilfe und Aussehen bleiben. In der Anwendung selbst ändert sich **nichts** —
`PoolFormDialog` zeichnete schon vorher `<section>`.

---

## 5  `screens/` aufgelöst — die zweite Datei

`DashboardScreen.tsx` → **`app/DashboardScreen.tsx`**, nicht `features/dashboard/`.

Gemessen, warum:

1. **Sie ist die einzige Ansicht, die `App.tsx` nicht faul lädt** (`App.tsx:14` gegen
   `:31-40`, wo zehn Ansichten über `lazy(...)` hängen). Sie gehört in das Bündel der
   Hülle, nicht in ein nachgeladenes Merkmal.
2. **Sie ist die Zusammensetzung, nicht ein Gegenstand.** Sie liest aus `features/todos`,
   `features/timer` und der geteilten `api/endpoints.ts`; sie hat **keine** eigene Route
   im Dienst und deshalb keine `api.ts`. Mehrere Merkmale zusammenzusetzen ist die
   Aufgabe von `app/`.
3. **Der Präzedenzfall steht daneben.** `app/GlobalSearch.tsx` (251 Zeilen) ist dieselbe
   Bauart: eine Fläche, die über alle Merkmale hinweg sucht, und sie liegt seit Welle 1
   in `app/`. Dazu `app/Navigation.tsx`, `app/exportSummary.ts`, `app/dayGroup.ts`.

**Abgelehnt: `features/dashboard/`.** Ein Merkmalsordner für **eine** Datei ohne `api.ts`
ist keine kleinere Struktur als eine Datei in `app/`; er ist dieselbe Datei plus ein
Ordner. Und er behauptete, das Dashboard sei ein Gegenstand neben Todos und Timer — es
ist ihr Aufriß.

**Keine Datei blieb ohne Heimat.** Der Ordner ist weg.

---

## 6  `lib/releasePage.ts` → `features/settings/releasePage.ts`

Wie beauftragt. Die Datei ist **sha256-gleich** verschoben — nicht „bis auf die
Importzeilen", sondern Byte für Byte: sie hat keine Einfuhr (Abschnitt 9, Zeile
„verschoben, Inhalt zeichengleich").

Zwei Leser, beide nachgezogen:

- `features/settings/useUpdateNotice.ts:7` → `./releasePage`
- `showcase/UpdateNoticeSection.tsx:4` → `../features/settings/releasePage`

`RELEASE_TAG_PREFIX` und `releasePageUrl` sind **unverändert**; die Zeichenkette
`https://github.com/KuyomieKurama/SuperTakt/releases/tag/v` ist zeichengleich.
`proof:shell-surface` ist **grün** — der Lauf nennt den Ort seit T-249-2 nicht mehr fest,
sondern zählt ihn (`proof-shell-surface.mjs:1167-1179`). Nur `proof:release-safety` führt
den Pfad fest, und der ist rot, wie angekündigt.

---

## 7  Die drei toten Ausfuhren — E-087, beide Wege

Gesucht über den **Wortlaut** in `tests/**` und `apps/*/test/**`, über `git grep` **und**
über den Arbeitsbaum (`apps/*/src`, `packages/*/src`, `tests/`), Bauergebnisse
(`apps/desktop/src-tauri/taskpane/`, `dist/`, `node_modules/`) ausgeschlossen. Danach
noch einmal über den **ganzen** Bestand, alle Endungen.

| Name | `git grep` in `tests/**`, `apps/*/test/**` | Arbeitsbaum `apps/*/src`, `packages/*/src`, `tests/` | ganzer Bestand |
|---|---|---|---|
| `usePrefersReducedMotion` | **0** | **0** — nur die Fundstelle selbst | **1**, ihre eigene Zeile |
| `IssuedToken` | **0** | **0** — nur die Fundstelle selbst | **1**, ihre eigene Zeile |
| `TemplatePreviewCard` | **0** | **0** — nur die Fundstelle selbst | **1**, ihre eigene Zeile |

Kein Prüffall, kein Nachweislauf, kein Papier, kein Kommentar nennt eine von ihnen. Keine
ist ein Oberflächentext und keine ein zugänglicher Name — E-087 greift hier über den
**Bezeichner**, und die Suche ist trotzdem gefahren, weil du sie verlangt hast.

Drei Nebenwirkungen, jede eine Zeile:

- `features/settings/api.ts` — die Typeinfuhr `SecretText` wurde unbenutzt, gestrichen.
- `features/export/TemplatePreview.tsx` — `Card` wurde unbenutzt, aus der Einfuhrliste
  gestrichen.
- `features/settings/theme.ts` — `useState`/`useEffect` bleiben; sie tragen `useDensity`
  und `useDesignTheme`.

**Kein Ausgleich nötig** (E-081 Punkt 4): Gestrichen ist Quelltext ohne Leser, kein Satz
auf dem Bildschirm. Es gibt nichts, was ein Benutzer nicht mehr läse.

---

## 8  Die Kanten — was sich geändert hat und was nicht

```
shared/ui  →  lib/            33 Kanten   (cx, foreign, labels, focus, format, touched, …)
shared/ui  →  api/types        4 Kanten   (ForeignText, DeadlineView — reine Typen)
shared/ui  →  app/useAsync     1 Kante    (AsyncState<T>, reiner Typ)  ← siehe unten
shared/ui  →  shared/ui                   innerhalb
shared/ui  →  components/      0
shared/ui  →  features/        0
shared/ui  →  showcase/        0
```

**Kein Kreis, und keiner ist neu.** Die einzige Kante, die bergauf zeigt, ist
`shared/ui/AsyncBoundary.tsx → app/useAsync` — ein **reiner Typ** (`AsyncState<T>`), und
sie ist **nicht** von mir: `screens/parts.tsx:5` hatte sie zeichengleich. Durch den Umzug
ist sie nur sichtbarer geworden. Gemeldet, nicht entschieden (Abschnitt 13, Befund 2).

Neu und gerichtet:

```
showcase          →  features/structure/PoolFormDialog   (FormSection) — 4. Kante dorthin
features/export   →  features/export/ExportTabs          (innerhalb)
app/              →  app/DashboardScreen                 (innerhalb)
```

Der Kreis `export ↔ bookings` bleibt, wie in Welle 5 begründet. `timer → settings` bleibt
gerichtet und gegenrichtungsfrei; `PreferencesContext` habe ich nicht angefaßt.

---

## 9  Der Mengenvergleich

Verglichen ist der **ganze Baum** `apps/web/src` gegen einen sha256-Abzug **vor** der
ersten Änderung. `git show HEAD:…` allein trägt hier nicht: 22 der Dateien sind in den
Wellen 4 bis 6 entstanden und stehen noch unversioniert im Arbeitsbaum — sie hätten in
einem reinen HEAD-Vergleich als „neu" dagestanden und den Vergleich wertlos gemacht.

```
Dateien vorher   173      (166 .ts/.tsx + 7 .css)
Dateien nachher  176      (169 .ts/.tsx + 7 .css)

nur vorher   12    9 Bausteine in components/, lib/releasePage.ts,
                   screens/DashboardScreen.tsx, screens/parts.tsx
nur nachher  15    9 Bausteine in shared/ui/, features/settings/releasePage.ts,
                   app/DashboardScreen.tsx, und die 4 aus der Teilung

an beiden Orten 161   davon zeichengleich 71, geändert 90
verschoben mit zeichengleichem Inhalt: 1   (lib/releasePage.ts → features/settings/)
```

**Die 90 geänderten, klassifiziert.** **81** davon haben **ausschließlich** geänderte
Importzeilen — zeilenweise geprüft, jede abweichende Zeile beginnt mit `import`, mit
`} from "` oder enthält `from "`. **Neun** haben mehr, und es sind genau die neun
beabsichtigten:

| Datei | was außer Importzeilen | Zeilen |
|---|---|---|
| `features/settings/theme.ts` | `usePrefersReducedMotion` gestrichen | −14 |
| `features/settings/api.ts` | `IssuedToken` gestrichen | −10 |
| `features/export/TemplatePreview.tsx` | `TemplatePreviewCard` gestrichen | −17 |
| `features/structure/PoolFormDialog.tsx` | Begründung, `export` vor `function FormSection` | +9 |
| `showcase/RuleSection.tsx` | 2 Zeilen Markup → 1, Schlußmarke umbenannt | ±0 |
| `shared/ui/ExportSummaryStrip.tsx` | ein Kommentarpfad aus Welle 4 berichtigt | ±0 |
| `styles/app.css` | zwei Kommentarpfade berichtigt | ±0 |
| `styles/base.css` | ein Kommentarpfad berichtigt | ±0 |
| `styles/components.css` | ein Kommentarpfad berichtigt | ±0 |

Dazu `design/DESIGNSYSTEM.md` (außerhalb von `src/`, zwei Pfadangaben).

**Die fünf verschobenen Rümpfe aus `parts.tsx`, zeichengleich gemessen:**

```
IDENTISCH  ScreenHeaderProps + ScreenHeader   (16-71)   → shared/ui/ScreenHeader.tsx
IDENTISCH  RefreshHint                      (165-172)   → shared/ui/ScreenHeader.tsx
IDENTISCH  AsyncBoundary                    (125-163)   → shared/ui/AsyncBoundary.tsx
IDENTISCH  StatTile                         (174-207)   → shared/ui/StatTile.tsx
IDENTISCH  ExportTabs, Rumpf                 (87-123)   → features/export/ExportTabs.tsx
IDENTISCH  ExportTabs, Kopfkommentar          (73-85)   → features/export/ExportTabs.tsx
```

Der einzige Zusatz ist ein Absatz **unter** dem übernommenen Kopfkommentar von
`ExportTabs`, der sagt, warum sie beim Merkmal liegt (Abschnitt 11).

---

## 10  Zahlen — einzeln vorgerechnet

```
apps/web/src, .ts + .tsx      42 719  →  42 721      Δ = +2
Dateien                          166  →     169      Δ = +3
```

**+2, in sechs Posten, und sie gehen auf:**

```
+16   Teilung von parts.tsx      −207 (parts.tsx)
                                  +76 ScreenHeader   (Rumpf 64 + 2 Einfuhren + 7 Doku + 3 Leerzeilen)
                                  +51 AsyncBoundary  (Rumpf 39 + 3 Einfuhren + 7 Doku + 2 Leerzeilen)
                                  +37 StatTile       (Rumpf 34 + 2 Einfuhren + 1 Leerzeile)
                                  +59 ExportTabs     (Rumpf 37 + 14 Doku + 5 neue Doku + 2 Einfuhren + 1 Leerzeile)
+18   Einfuhrzeilen, die sich auffächern — `{A, B, C} from parts` wird zu zwei bis vier Zeilen:
        BoardScreen +1   BookingsScreen +1   ExportAuditScreen +3   ExportScreen +2
        TemplatePreview +1   TemplatesScreen +2   AddinSettings 0    SettingsScreen +1
        TagsScreen +1    TimeScreen +2       TodoDetailAside 0      TodoDetailScreen +1
        TodoListScreen +1                    DashboardScreen +2
 +9   Begründung an FormSection
−14   usePrefersReducedMotion
−10   IssuedToken (9 + 1 Typeinfuhr)
−17   TemplatePreviewCard
────
 +2
```

`+3` Dateien: `−1` (`parts.tsx`) `+4` (die vier aus der Teilung). Die elf `git mv`
verändern die Zahl nicht.

**Dieselbe Zahl in drei Zählern:** `wc -l` über den Baum, die Summe der Einzelposten
oben, und die Summe der Zeilendifferenzen je Datei (14 Dateien mit Differenz).

`test:coverage` bleibt **zeichengleich**: 88 Dateien, 1570 bestanden, 3 übersprungen —
dieselben Zahlen wie in Welle 5 und Welle 6.

---

## 11  Kommentare — nach Wirkung

**Mitgewandert, unverändert:** jeder Kopfkommentar der neun verschobenen Bausteine und
der vier Rümpfe aus `parts.tsx`. Kein Satz gestrichen, keiner umformuliert.

**Neu, und jeder beantwortet die Frage, die dieser Auftrag stellt:**

1. `features/export/ExportTabs.tsx` (5 Zeilen) — warum sie **nicht** in `shared` liegt.
2. `features/structure/PoolFormDialog.tsx` (9 Zeilen) — warum `FormSection` ausgeführt
   ist und trotzdem hier steht.
3. Die Kopfzeilen von `ScreenHeader.tsx` (7) und `AsyncBoundary.tsx` (7). Der eine
   Kopfkommentar von `parts.tsx` beschrieb vier Dinge und ließ sich nicht vierteln. Sein
   Kern („damit sie in neun Ansichten gleich aussehen … eine Fehlermeldung ohne
   Wiederholungsknopf ist eine Sackgasse") steht auf die beiden Dateien verteilt, an die
   er gehört. Die Zahl **neun** habe ich zu **elf** bzw. **zwölf** berichtigt, weil sie
   heute nachzählbar falsch war (Abschnitt 3).

**Berichtigt, nicht erfunden:** vier Pfadangaben in `styles/*.css` und `DESIGNSYSTEM.md`.
Drei davon (`components/DoneFlag.tsx`, `components/DeadlineFlag.tsx`,
`components/Foreign.tsx`) zeigten schon vor diesem Auftrag ins Leere — Rückstand aus den
Wellen 1 bis 3. Ich habe sie mitgenommen, weil ein Kommentar, der eine Datei nennt, die
es nicht gibt, den nächsten Leser an den falschen Ort schickt. Dasselbe gilt für
`shared/ui/ExportSummaryStrip.tsx:14` (`components/Kanban.tsx` → `features/board/`).

**Kein `docs/decisions/`-Papier.** Die sieben vorhandenen sind entstanden, weil aus
Quelltext Vorgeschichte **herausgezogen** wurde. Hier ist nichts herausgezogen worden —
die Bausteine sind zeichengleich umgezogen. Ein Papier ohne Inhalt wäre ein Ordner mehr.

---

## 12  In fremder Hoheit nachzuziehen — ich habe nichts davon angefaßt

**Wegen `releasePage.ts` (dringend, vier Stellen):**

1. **`apps/local-api/scripts/proof-release-safety.mjs:302`** — `RELEASE_PREFIX_FILES`
   führt `'apps/web/src/lib/releasePage.ts'`. **Eine Zeile.** Ohne sie bleibt
   `proof:release-safety` mit **drei** Befunden rot. **domain-dev.**
2. **`apps/desktop/scripts/proof-shell-surface.mjs:38`** — Kopfkommentar nennt
   `apps/web/src/lib/releasePage.ts`. Nur ein Kommentar, der Lauf ist grün. **desktop.**
3. **`apps/desktop/scripts/proof-shell-surface.mjs:1170`** — ein Kommentar, der erklärt,
   warum der Ort dort **nicht** mehr fest steht, und dabei den alten Pfad als Beispiel
   nennt. Sachlich weiter richtig, im Beispiel veraltet. **desktop.**
4. **`docs/bedrohungsmodell.md:4194` und `:4361`** — **das ist keine Randnotiz.** A-V-1′
   ist eine **Zusage**: „Die Adresse der Release-Seite steht **im Code** an genau zwei
   Stellen, `src-tauri/src/release.rs` und **`apps/web/src/lib/releasePage.ts`**". Die
   Zusage gilt weiter, ihr zweiter Ort heißt anders. **security-checker.**

**Wegen der übrigen Umzüge:**

5. **`docs/design/traeger-und-zusage.md`** — nennt `screens/parts.tsx` an **fünf** Stellen
   (`:1104, 1536, 1697, 1810, 1836`), teils **mit Zeilennummern** („`parts.tsx:185-190`",
   der `tone="danger"`-Satz von `StatTile`), dazu `components/DialogSurface.tsx`,
   `components/Menu.tsx`, `components/Primitives.tsx`, `components/Select.tsx:117`,
   `components/ExportStatus.tsx:40-49`. `parts.tsx` gibt es nicht mehr; der Satz aus
   `:1536/:1697` steht jetzt in `shared/ui/StatTile.tsx:16-25`.
   **ui-designer / ux-designer.**
6. **`docs/design/textbestand.md:462, 1135, 2468, 3067`** — `screens/parts.tsx:85-93` und
   `:86-92` meinen den `ExportTabs`-Block, der jetzt `features/export/ExportTabs.tsx:26-38`
   ist; dazu `components/Select.tsx`, `components/Primitives.tsx`,
   `components/ExportGroups.tsx`. **ui-designer / ux-designer.**
7. **`tests/e2e/field-live-region-announcement.spec.ts:4, 115, 151`** und
   **`focus-return-after-dialog.spec.ts:18-19`** — Kommentare nennen
   `apps/web/src/components/FormDialog.tsx`, `components/Menu.tsx`,
   `components/DialogSurface.tsx`. Keine Zusicherung, die Fälle laufen. **e2e-tester.**
8. **`packages/domain/src/enumeration.ts:15`** — nennt
   `apps/web/src/screens/TodoFormDialog.tsx` (seit Welle 3 `features/todos/`). Rückstand,
   nicht von mir. **domain-dev.**
9. **`.claude/team/decisions.md:2077`** — nennt `apps/web/src/components/RadioRow.tsx`.
   **Orchestrator.**
10. **`.claude/team/board.md:1340, 1365, 1367, 1373, 1396, 1415, 1454, 1455`** — offene
    Punkte nennen `src/screens/…` und `src/components/…`; **O-EV** und **O-DA** nennen
    `components/ConfirmDialog.tsx:170-178` und `components/FormDialog.tsx`, beide jetzt
    unter `shared/ui/`. **Orchestrator.**
11. **`apps/web/test/screens/templatesScreenBeginCopy.test.ts:44`** — nennt
    `git show HEAD:apps/web/src/screens/TemplatesScreen.tsx` in einem Kommentar. Das ist
    ein **historischer** Verweis auf einen HEAD-Stand und bleibt richtig; ich habe ihn
    ausdrücklich **nicht** angefaßt. **unit-tester**, zur Kenntnis.
12. Der Titel des Prüffalls in
    **`apps/web/test/components/liveRegionsAlwaysRendered.test.ts:118`** steht weiter aus
    (Welle 6, Punkt 1). Unverändert offen.

**Berichte unter `.claude/team/reports/**`** nennen die alten Pfade an vielen Stellen. Wie
in Welle 6: Protokoll eines Standes, von mir nicht nachgezogen.

---

## 13  Befunde, die nicht meine sind

1. **`api/types.ts:21` führt einen Typ aus der Oberfläche ein.**
   `import type { ExportStatus } from "../shared/ui/ExportStatus"` — die Datei, die die
   **Antworten des Dienstes** beschreibt, holt einen ihrer Grundtypen aus einem
   Anzeigebaustein und reicht ihn in `:44` weiter. Den Pfeil gab es vorher schon
   (`../components/ExportStatus`); durch den Umzug zeigt er jetzt sichtbar von `api/` nach
   `shared/ui/` und ist damit **schlechter zu übersehen**, nicht schlechter.
   **Ich habe ihn nicht umgedreht**, aus einem gemessenen Grund: Der Kopfkommentar von
   `ExportStatus.tsx:5-20` begründet über sechzehn Zeilen, warum `ExportStatus` und
   `ExportDisplayState` **nebeneinander** stehen müssen („Wer ‚erneut offen' für einen
   dritten Statuswert hält und einen Filter darauf baut, läßt eine zurückgesetzte Buchung
   aus dem nächsten Export herausfallen — und dann ist R-10 auf dem Kopf"). Den einen von
   beiden nach `api/types.ts` zu ziehen löst den Pfeil und zerreißt die Begründung. Die
   richtige Antwort ist wahrscheinlich eine dritte: die **Ableitung** (`ExportStatus`,
   `ExportDisplayState`, `exportDisplayState`, `exportStatusOf`, `EXPORT_STATUS_LABEL`,
   `ExportSummary`) von den **Abzeichen** trennen — drei `.ts`-Dateien lesen heute schon
   nur die Ableitung (`app/exportSummary.ts`, `features/bookings/bookingRows.ts`,
   `features/export/exportAuditRows.ts`). Das ist ein eigener, kleiner Auftrag und keine
   Verschiebewelle. **Gemeldet, nicht entschieden.**
2. **`shared/ui/AsyncBoundary.tsx → app/useAsync`** (Abschnitt 8). Reiner Typ, eine Kante,
   seit T-005 unverändert. Wenn `shared` unter `app` liegen soll, gehört `AsyncState<T>`
   nach `lib/`. Eine Zeile, aber es ist eine **Entscheidung** über die Schichtung und
   nicht meine.
3. **`components/` hält noch drei Dateien mit je genau einem Merkmal als Leser:**
   `InfoDialog.tsx` (78, nur `features/bookings`), `InfoHint.tsx` (15, nur
   `features/export`), `ShellStatus.tsx` (845, nur `app/`). Nach derselben Regel, die
   `ExportTabs` bei `export` gelassen hat, gehören die ersten beiden zu ihrem Merkmal und
   die dritte nach `app/`. Danach ist `components/` leer. Das ist die nächste — und
   letzte — Welle, nicht diese.
4. **Die doppelte `describeRule`-Nachschlagetabelle in `PoolFormDialog.tsx`** steht
   weiterhin zweimal (Welle 6, Befund 3). Unverändert offen.

---

## 14  Die Läufe

`proof:all` fährt seit der Eintragung von `proof:layers` **zwanzig** Läufe. Hier stehen
alle zwanzig einzeln, weil die Kette bei `proof:callers` abbricht — also **vor**
`proof:foreign` und `proof:surface`, den beiden, die diesen Auftrag messen.

| Lauf | Stand |
|---|---|
| `typecheck` (samt `typecheck:test`, `typecheck:e2e`) | **grün**, alle acht Pakete |
| `boundaries` | **grün**, 454 Quelldateien geprüft |
| `contrast` | **grün**, 0 von 522 Paaren durchgefallen, 11/11 Gegenproben |
| `proof:foreign` | **grün**, 21/0, 169 Quelldateien |
| `proof:surface` | **grün**, 27/0, 169 Quelldateien |
| `proof:codepoints` | **grün**, 46/0 |
| `proof:migrations` | **grün**, 42 Migrationen |
| `proof:export-api` | **grün** |
| `proof:taskpane` | **grün** |
| `proof:addin-wiring` | **grün** |
| `proof:layers` | **grün** (der neue Lauf) |
| `proof:route-policy` | **grün** |
| `proof:db-permissions` | **grün** |
| `proof:addin` | **grün** |
| `proof:shell-surface` | **grün**, 7 Prüfungen + 54 Gegenproben |
| **`proof:release-safety`** | **ROT, erwartet** — 29 bestanden, 3 fehlgeschlagen; alle drei nennen `apps/web/src/features/settings/releasePage.ts` |
| `proof:callers` | **ROT, fremde Ursache** |
| `proof:openapi` | **ROT, fremde Ursache** |
| `proof:conflicts` | **ROT, fremde Ursache** |
| `proof:tags` | **ROT, fremde Ursache** |
| `proof:access` | **ROT, fremde Ursache** |
| `proof:export` | **ROT, fremde Ursache** |
| `proof:template-fields` | **ROT, fremde Ursache** |
| `verify:bundle` | **grün**, 19/0 |
| `test:coverage` | **grün**, 88 Dateien, 1570 bestanden, 3 übersprungen — **zeichengleich** |
| `build` (`@takt/web`) | **grün** |
| E2E, ganze Konfiguration `tests/e2e/playwright.config.ts` | **104/110**, sechs rot und alle sechs vorher benannt (Abschnitt 15) |

**Die sieben roten Läufe fremder Ursache sind nicht meine, und das ist gemessen.** Alle
sieben brechen mit `ERR_MODULE_NOT_FOUND` ab, **bevor** sie eine einzige Prüfung fahren:

```
Cannot find module …\apps\local-api\src\routes\structure.ts
Cannot find module …\apps\local-api\src\routes\board.ts
Cannot find module …\apps\local-api\src\usecases\export.ts
```

Im Arbeitsbaum läuft die Umstrukturierung von `apps/local-api` (`git status`:
`src/routes/board.ts → src/features/board/routes.ts`,
`src/usecases/board.ts → src/features/board/board.ts`, …). Die Wächterskripte führen die
alten Pfade noch fest. `apps/local-api/scripts/proof-callers.mjs` trägt Änderungsstand
**16:45**, meine erste Datei **18:06** — ich habe unter `apps/local-api/**` nichts
angefaßt. **domain-dev**, in derselben Welle.

Zusammen: **zwölf grün, sieben rot aus `apps/local-api`, einer rot wie angekündigt.**

---

## 15  E2E — **104 von 110**, und alle sechs roten sind vorher benannt

Gefahren ist die **ganze** Konfiguration `tests/e2e/playwright.config.ts` in einem Zug,
nicht eine Auswahl: 110 Fälle in 37 Dateien, `workers: 1`, `retries: 1`, 8 Minuten.

```
bestanden 104 | rot 6 | flaky 0 | übersprungen 0
```

| Roter Fall | Wo er schon steht |
|---|---|
| `kanban.spec.ts:288` TP-KANBAN-04 | T-249-e2e-tester, dieselbe Zeile, dieselbe Zeichenkette (`kcard--running kcard--reactivated`); seither in T-251, T-252, T-253 und T-255 gemeldet |
| `timer-stop-announcement.spec.ts:209` | T-249-e2e-tester: „der Dialog ‚Eine Buchung ohne Ende' erscheint nicht" |
| `timer-stop-announcement.spec.ts:309` | dieselbe Stelle im selben Bericht |
| `timer-stop-announcement.spec.ts:361` | dieselbe Stelle im selben Bericht |
| `toast-eviction.spec.ts:123` | T-249-e2e-tester: „unzuverlässig … in allen drei vollständigen Läufen rot", Testzeitlimit 60 s, Kanban-Board hängt bei „Ansicht wird geladen …" |
| `note-separation.spec.ts:98` (STD) | T-249-e2e-tester hat den Fall berichtigt und „grün im sauberen Gesamtlauf" gemessen — er ist **unter Last** wieder rot |

**Der sechste ist der einzige, der eine Erklärung braucht, und er hat eine gemessene.**
`note-separation.spec.ts:98` liegt in `features/export/TemplatePreview.tsx`, und das ist
eine der drei Dateien, aus denen ich etwas gestrichen habe. Zwei Messungen:

1. **Einzeln gefahren ist er grün.** `npx playwright test … note-separation.spec.ts
   kanban.spec.ts` → **8 bestanden, 1 rot**, und der eine rote ist `kanban.spec.ts:288`.
   Alle vier `note-separation`-Fälle bestehen.
2. **Das Gestrichene hatte keinen Leser.** `TemplatePreviewCard` war repoweit ohne
   Aufrufer (Abschnitt 7). Was der Prüffall sucht — `.tpgroup__head` im Dialog
   „Vorschau" — zeichnet `TemplatesScreen.tsx` über `previewOpen` und `<TemplatePreview>`,
   nicht über die gestrichene Karte.

Der Fehlschlagstyp ist derselbe, den T-249 für diese ganze Familie beschreibt: ein Timeout
unter Last, nicht ein falsches Ergebnis.

**Zwei Läufe davor waren wertlos, und das gehört hingeschrieben**, damit niemand die
Zahlen aus dem Zwischenstand aufhebt: Der erste Gesamtlauf ließ einen Vite-Prozeß auf
`5173` stehen; der zweite lief dagegen und bekam wegen `strictPort` **keinen** eigenen
Entwicklungsserver — 84 von 110 rot mit `net::ERR_CONNECTION_REFUSED`. Erst nach
`rm -rf test-results-e2e` und leerem Port steht die Zahl oben. **Wer auf dieser Maschine
E2E mißt, prüft vorher `netstat` auf 5173** — zwei Läufe hintereinander sind sonst ein
Meßfehler und kein Befund.

---

## 15a  Oberfläche, Zustände, Tastatur — was hier zu prüfen ist und was nicht

**Es ist keine neue Fläche entstanden.** Kein Bildschirm, kein Dialog, kein Feld, kein
Zustand, kein Text. Damit gibt es auch keinen neuen Leer-, Lade-, Schwebe-, Fokus-,
Aktiv-, Fehler- oder Bestätigungszustand zu bauen; die vorhandenen sind zeichengleich
mitgezogen (Abschnitt 9).

Für `visual-qa` bleibt genau **eine** Stelle, und sie liegt auf der Musterseite:

- **`/designsystem.html`, Abschnitt „Regel einer Spalte", Karte „Diese Regel trifft".**
  Dort steht seit diesem Auftrag `<section class="form-section">` statt
  `<div class="form-section">` (Abschnitt 4). Nachzusehen ist, daß Abstand, Überschrift
  und der Satz „Vorgelesen: …" darunter aussehen wie vorher — die Klassenfamilie ist
  elementfrei geschrieben, es sollte kein Pixel wandern.

Alles andere ist **derselbe Baum aus denselben Bausteinen an einem anderen Dateipfad**.
Wer trotzdem stichprobenartig hinsehen will, sind die drei Flächen, die von einer
gestrichenen Ausfuhr am nächsten liegen: der Vorlageneditor mit „Vorschau öffnen"
(`TemplatePreviewCard` gestrichen), die Einstellungen unter „Darstellung"
(`usePrefersReducedMotion` gestrichen) und „Add-in" (`IssuedToken` gestrichen). Alle drei
laufen in E2E grün (Abschnitt 15), zwei davon in `verify:bundle`.

Tastaturbedienung und sichtbarer Fokus hängen an `DialogSurface`, `FormDialog`,
`ConfirmDialog`, `Menu` und `lib/focus.ts` — alle fünf sind bis auf Importzeilen
zeichengleich, und die sieben `focus-return-after-dialog`-Fälle sind grün.

---

## 16  Annahmen

1. **`DialogSurface.tsx` ist als elfter mitgegangen.** Begründung und Rückweg in
   Abschnitt 2.
2. **`ExportTabs` liegt bei `features/export`, nicht in `shared`.** Ein Merkmal als
   Leser, gemessen; der vierte Treffer war ein Kommentar.
3. **`FormSection` bleibt in `PoolFormDialog.tsx` und ist nur ausgeführt.** Die Dublette
   ist aufgelöst, `shared` hat sie nicht bekommen. Der eine Unterschied im gezeichneten
   Baum steht in Abschnitt 4.
4. **`DashboardScreen.tsx` liegt in `app/`, nicht in `features/dashboard/`.** Drei
   Messungen in Abschnitt 5; der abgelehnte Weg ist benannt.
5. **`ScreenHeader` und `RefreshHint` teilen sich eine Datei.** Sechs Zeilen, und der Kopf
   zeigt ihn selbst.
6. **Fünf veraltete Pfadangaben in Kommentaren sind berichtigt**, vier davon Rückstand aus
   früheren Wellen. Wenn du das als Fremdänderung wertest, sind es fünf Zeilen zurück.
7. **Kein `docs/decisions/`-Papier zu `shared/ui`.** Begründung in Abschnitt 11.

## 17  Risiken

1. **`proof:release-safety` ist bis zur Nachziehung rot.** Das ist genau die Lage, vor der
   Welle 6 gewarnt hat: Solange die Zeile nicht nachgezogen ist, gibt es **keinen**
   laufenden Zeugen dafür, daß die Release-Adresse an zwei und nur zwei Orten steht.
   `proof:shell-surface` mißt den **Gleichlauf** der beiden Zeichenketten und ist grün —
   er mißt nicht, ob eine dritte dazugekommen ist. Die Lücke ist eine Zeile breit und
   sollte nicht über eine Welle stehen bleiben.
2. **Das Bedrohungsmodell behauptet einen Pfad, den es nicht mehr gibt** (Abschnitt 12
   Punkt 4). Eine Zusage, die eine falsche Datei nennt, ist schlechter als eine, die keine
   nennt — sie führt den nächsten Prüfer an einen leeren Ort und läßt ihn dort „nichts
   gefunden" messen.
3. **`shared/ui` ist mit neunzehn Dateien der größte Ordner unterhalb von `features/`.** Er
   ist heute begründet — jede Datei hat mindestens zwei Merkmale als Leser, alle in
   Abschnitt 2 und 3 namentlich. Aber die Regel lebt nur, solange jemand sie beim nächsten
   Zuwachs anwendet. Der Satz gehört in `CLAUDE.md` oder eine Entscheidung, nicht in einen
   Bericht.
4. **Die Maschine verfälscht E2E-Messungen, wenn ein Lauf einen Vite-Prozeß stehen läßt.**
   Zwei Läufe hintereinander ergaben 84 rote Fälle mit `ERR_CONNECTION_REFUSED`, weil der
   zweite wegen `strictPort` keinen eigenen Server auf `5173` bekam (Abschnitt 15). Wer
   das nicht weiß, liest darin einen katastrophalen Befund. Der Satz gehört in den
   Testplan oder in den Kopf der Konfiguration, nicht in einen Bericht.
5. **Kein Sicherheitshinweis aus der Sache selbst.** Keine Route, kein Rumpf, keine
   Kodierung, keine Rundung, keine Prüfung ist berührt. Ausdrücklich nachgemessen:
   `releasePage.ts` ist **sha256-gleich**, `ConfirmDialog.tsx` und `FormDialog.tsx` sind
   bis auf drei bzw. sechs Importzeilen zeichengleich, `proof:shell-surface` grün,
   `verify:bundle` 19/0.

## 18  Offene Fragen

1. **`DialogSurface.tsx` — einverstanden?** Er stand nicht auf deiner Liste. Zwei Merkmale
   als Leser, und `FormDialog`/`ConfirmDialog` brauchen ihn. Fünf Importzeilen zurück,
   wenn du ihn in `components/` lassen willst.
2. **Wird der Pfeil `api/types.ts → shared/ui/ExportStatus` umgedreht?** Abschnitt 13
   Punkt 1 nennt den Weg und den Preis. Ein eigener kleiner Auftrag, kein Nebenbei.
3. **Wohin gehört `AsyncState<T>`?** (Abschnitt 13 Punkt 2.) Eine Zeile, aber eine
   Entscheidung über die Schichtung.
4. **Die drei Reste in `components/`** (Abschnitt 13 Punkt 3) haben je genau ein Merkmal.
   Die nächste Welle löst den Ordner auf — oder du entscheidest, daß `components/` als
   Name für „gehört der Hülle" bleibt.

## 19  Nächster Schritt

**`components/` auflösen** — die letzte Welle: `InfoDialog.tsx` → `features/bookings`,
`InfoHint.tsx` → `features/export`, `ShellStatus.tsx` → `app/`. Danach gibt es unter
`apps/web/src` genau `api/`, `app/`, `features/`, `lib/`, `shared/`, `showcase/`,
`styles/` — und der Umbau ist fertig.

Parallel und unabhängig: **eine Zeile in `proof-release-safety.mjs`** und **zwei Zeilen im
Bedrohungsmodell**.
