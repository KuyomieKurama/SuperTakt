# T-341 — Fokusring, Filterleisten und die Zusage über die Verankerung

**Rolle:** frontend-dev. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-336-code-reviewer.md`, `T-337-security-checker.md`,
`T-338-visual-qa.md`, `T-339-ui-designer.md`; `.claude/team/decisions.md` E-113, **E-115**,
**E-116**; `.claude/team/risks.md` **R-32**.

**Geänderte Dateien — drei, alle in eigener Hoheit:**

| Datei | Was |
|---|---|
| `apps/web/src/styles/viewport-layout.css` | Reserve für den Fokusring am festen Teil; E-113-Kommentar nachgezogen (Nachtrag des Orchestrators) |
| `apps/web/src/styles/app.css` | Spaltenschwelle der Todo-Filterleiste, gerechnet statt gerundet |
| `apps/web/scripts/proof-surface.mjs` | **Regel G** — jede gezeichnete Abdunklung hängt am Dokumentkörper (A-A-109) |

`tests/**`, `docs/design/**`, `apps/local-api/**`, `packages/**` sind **nicht** angefaßt.
`apps/web/src/shared/ui/ScreenBody.tsx` ist **nicht** angefaßt (Warnung des Orchestrators; eine
Messung dazu steht in Abschnitt 6).

**Ports.** Vorher mit `ss -ltn` geprüft: `17843`, `17844`, `5173`, `5341`, `18941` **frei**.
Gebunden habe ich ausschließlich `5341` (eigener Entwicklungsserver) und `18941` (eigene Attrappe),
beide am Ende über ihre PID beendet; `ss -ltn` danach ohne Treffer auf alle fünf. **Kein fremder
Prozeß beendet.** `verify:bundle` habe ich **nicht** gefahren (es bindet 17844, und T-342 läuft
parallel).

**Meßaufbau.** Eigenes Wegwerfverzeichnis `…/scratchpad/t341-frontend/`. Die Attrappe des Dienstes
ist die von T-334/T-338 (dieselbe erfundene Datenmenge: 60 Todos, 80 Buchungen, 12 Board-Spalten,
30 Exportgruppen, 40 Protokollzeilen), mit eigenem Port und eigenem Token. Eigener
Playwright-Treiber, eigener PNG-Leser für den Bildvergleich (kein `pixelmatch` im Baum).

---

## 1 Der Fokusring — behoben, und die Menge war größer als gemeldet

### 1.1 Vorher, gemessen an der Klippkante

`overflow: hidden` klippt am **Polsterkasten**. Gemessen wurde deshalb der Abstand zwischen dieser
Kante und dem Randkasten jedes fokussierbaren Elements im festen Teil — **elf Ansichten, beide
Kontrasteinstellungen**, 1280 × 820:

| | fokussierbare Elemente im Kopf | Luft oben | fehlt |
|---|---|---|---|
| dashboard, todos, todo, board, bookings, export, templates, exportAudit | 2 bis 9 | **0,0 px** je | 4 px (5 px unter `prefers-contrast: more`) |
| board `.screen__bar` | 1 | **0,0 px** | 4 px / 5 px |
| time, tags, settings | 0 | — | — |

Nach unten: dashboard **0,0 px**, export und templates je **1,0 px**, der Rest hat Luft.

**Das ist mehr als T-336 gemeldet hat** (dort: „der erste Knopf" und „die letzte Kopfzeile"). Es
sind **acht** Ansichten plus die Werkzeugzeile des Kanban, und zwar in **jeder** von ihnen.

### 1.2 Vorher, im Bild — mit gesetztem Fokus

Echter Tastaturfokus (`Shift+Tab`, `Tab`, `:focus-visible` im Browser bestätigt), dann Bildpunkte in
`--focus-ring-color` in den vier Bändern um den Randkasten des fokussierten Knopfes:

| | oben | unten | links | rechts |
|---|---|---|---|---|
| acht Ansichten, `no-preference` | **0** je | 0 bis 1 196 | 50 bis 64 | 50 bis 64 |
| acht Ansichten, `more` | **0** je | 0 bis 1 806 | 84 bis 105 | 84 bis 105 |

Die drei übrigen Bänder sind die Gegenprobe: Der Zähler zählt wirklich den Ring, und **oben fehlt er
ganz**. (Beim Dashboard ist auch „unten" 0 — dort klippt beide Kanten.)

### 1.3 Die Behebung

`overflow: clip` mit `overflow-clip-margin` wäre die Eigenschaft, die genau das sagt. Sie fällt aus:
`scrollbar-gutter` wirkt **nur** an einem Bildlaufkasten, und `clip` ist keiner — damit käme der
10-px-Versatz zurück, den `overflow: hidden` hier gerade beseitigt hat.

Statt dessen ein Polster in Ringhöhe **und** ein negativer Rand desselben Betrages:

```
.screen__header, .screen__bar {
  --screen-focus-reserve: calc(var(--focus-ring-width) + var(--focus-ring-offset));
  padding-block: var(--screen-focus-reserve);
  margin-block: calc(-1 * var(--screen-focus-reserve));
}
```

Der Wert wird **gerechnet, nicht beziffert**: Unter `prefers-contrast: more` wächst
`--focus-ring-width` auf 3 px, und eine gesetzte 4 wäre dort wieder falsch.

### 1.4 Nachher — beide Messungen wiederholt, beide mit Fokus

- **Klippkante:** Luft oben und unten in allen acht Ansichten **genau 4,0 px** (`no-preference`)
  beziehungsweise **genau 5,0 px** (`more`). `fehlt = 0/0` in **allen 22 Fällen**.
- **Im Bild:** Ringpunkte oben jetzt 244 / 268 / 318 / 334 / 1 198 (`no-preference`) und
  375 / 411 / 486 / 510 / 1 806 (`more`) — je innerhalb von 2 Punkten der Zahl unten; die Differenz
  sind die abgerundeten Ecken.

### 1.5 Die Gegenrichtung: bleibt die Inhaltsspalte zeichengleich?

Ohne Fokus, dieselbe Ansicht zweimal — einmal mit den zwei neuen Zeilen, einmal mit
`padding-block: 0; margin-block: 0` (dem Stand davor), eingeschossen als Stilblatt:

| | |
|---|---|
| **9 von 11 Ansichten, beide Kontraste** | **0** abweichende Bildpunkte von 1 049 600 |
| dashboard | 48 Punkte, größter Unterschied **2/255** (Kantenglättung in der Kopfzeile) |
| todos | 9 Punkte, größter Unterschied 27 bzw. 31/255, in einem 5 × 10 großen Kasten — das Lupensymbol des Suchfeldes (`svg` in `.search__icon`, Oberkante bei y = 169,296875, also auf einer gebrochenen Zeile) |

Die Kastenzahlen von `.screen__headline` und `.screen__body` sind in **allen 22** Fällen identisch,
`.app__main` läuft in allen 22 Fällen **nicht** (0/0).

### 1.6 Und der Zweck von `overflow: hidden` hält

Abstand von der Klippkante des festen Teils zum nächsten Geschwister **im Fluß**, 1280 × 820:

| | `no-preference` | `more` |
|---|---|---|
| zehn Köpfe und zwei Werkzeugzeilen | **16 px** (bookings 12) | **15 px** (bookings 10) |

Der Zwischenraum ist `--space-5` = 20 px, die Reserve 4 bzw. 5 px. **Der feste Teil überlagert den
Laufbereich also weiterhin nicht** — es bleiben 15 bis 16 px frei. (Beim Kanban steht zwischen Kopf
und Werkzeugzeile ein `p.visually-hidden` mit `position: absolute`; es ist kein Flex-Element und
liegt an seiner statischen Stelle. Das ist der Fall, um den es in E-113 geht, und kein Überlager.)

---

## 2 Der Wächter — Regel G, an der Anforderung aufgespannt

### 2.1 Was gebaut ist

Neuer Abschnitt 7 in `apps/web/scripts/proof-surface.mjs`, Überschrift
**`G  Jede gezeichnete Abdunklung hängt am Dokumentkörper (A-A-109, R-32, E-116)`**. Die Überschrift
der Gegenproben heißt jetzt `H` statt `G`.

**Das Kriterium steht an der Anforderung:** Jedes JSX-Element, dessen **Klassenliste** den Namen
`scrim` enthält, steht **lexikalisch im gezeichneten Argument** eines
`createPortal(…, document.body)`. Nicht „es gibt Portale", nicht „der Baustein wird benutzt".

Zwei Zusagen:

1. **Die Ernte vor dem Urteil** — findet der Lauf keine einzige Fläche mit der Klasse, ist er rot.
   Die Untergrenze zählt **die eigene Menge** und leiht sich nicht die von Regel F (T-339: „Jede
   Zusicherung zählt ihre eigene Menge").
2. **Die Verankerung jeder gefundenen Fläche.**

Die alte Zeile `portale > 0` **bleibt stehen**, heißt aber jetzt, was sie mißt: „der Portalzweig von
Regel F wird wirklich begangen". Sie war nie eine Zusage über die Abdunklungen, und das steht jetzt
im Quelltext daneben.

### 2.2 Die vier Mutationen, beidseitig gemessen

Jede in den echten Baum gesetzt, gemessen, aus einer Sicherungskopie zeichengleich zurückgeschrieben.
Der Wächter **ohne Regel G** entsteht aus derselben Datei, damit die beiden Seiten sich in nichts
sonst unterscheiden.

| | `tsc` | ohne Regel G | mit Regel G | gemeldet an |
|---|---|---|---|---|
| Nullpunkt | Exit 0 | **32/0** | **34/0** | — |
| **M-A1** `<Scrim>` → rohes `<div className="scrim">` in `AttachmentOpenDialog` | Exit 0 | **32/0 grün** | **33/1 rot** | `features/todos/AttachmentOpenDialog.tsx:347` |
| **M-A2** dasselbe in `ShellStatus` (mit `cx("scrim", "scrim--blocking")`) | Exit 0 | **32/0 grün** | **33/1 rot** | `app/ShellStatus.tsx:762` |
| **M-A3** dasselbe in `DialogSurface` — trägt fünf Dialoge | Exit 0 | **32/0 grün** | **33/1 rot** | `shared/ui/DialogSurface.tsx:371` |
| **K-8** rohes `<div className="scrim">` im Rumpf von `Attachments` | Exit 0 | **32/0 grün** | **33/1 rot** | `features/todos/Attachments.tsx:261` |
| Nullpunkt nach allen vier | Exit 0 | — | **34/0** | — |

Die Meldung nennt den Ort und den Grund und endet mit dem Satz aus E-116.

### 2.3 Die Gegenproben — in beide Richtungen

Vier neue Prüfungen, 15 Gestalten, alle durch **dieselbe** Funktion wie der Bestand (E-094 Punkt 1):

- **rot sein muß** (7): das rohe `<div>`; dasselbe mit `cx`; im Rumpf einer `.card`; hinter einer
  Bedingung; Portal an ein anderes Ziel; Portal ohne Ziel; die Fläche im **Ziel** statt im
  gezeichneten Baum.
- **nicht gemeldet werden darf** (4): der heutige Baustein zeichengleich; `ReactDOM.createPortal`;
  die Abdunklung tief im gezeichneten Baum; in Klammern gesetzt.
- **kein Treffer sein darf** (3): `scrim--blocking`, `scrimmage`, `unterscrim` — die Regel mißt den
  **Wortlaut** des Klassennamens, nicht ein Vorkommen.
- **leere Ernte** (1): eine Quelle ohne Abdunklung meldet nichts, und der Zähler trägt das Urteil.

### 2.4 Was der Lauf ausdrücklich nicht kann — im Quelltext, nicht in diesem Bericht

- **Er folgt keiner Zwischenstufe.** `createPortal(<Innen />, document.body)` mit der Abdunklung in
  `Innen` wird **gemeldet**, obwohl sie am Körper hinge. Sichere Richtung: Der Lauf sagt „das sehe
  ich nicht", statt es zu behaupten.
- **Er kennt nur den Namen `scrim`.** Eine Abdunklung unter einem anderen Klassennamen fiele nicht
  darunter. Heute ist die Menge geschlossen, und die Zahl steht in der Schlußzeile:
  `Flächen mit der Klasse scrim: 1, davon 1 in einem createPortal(…, document.body)
  (shared/ui/DialogSurface.tsx:454)`.

`proof:surface` geht damit von **28/0 auf 34/0** (+2 Zusagen, +4 Gegenproben).

---

## 3 Die Filterleisten und das Budget aus E-115

### 3.1 Zuerst: die Budgetrechnung ist gegen die Messung geprüft

Budget = Rahmenhöhe (`.app__main.clientHeight`) − `--screen-inset` (24) − 4 rem Boden des
Laufbereichs (64). Gemessen an 6 Fenstergrößen × 11 Ansichten; in **jedem** Fall mit A2-Verstoß gilt

> Überschuß über das Budget = A2-Überlauf + 0,3 px

— 274,3/274, 221,3/221, 108,3/108, 87,3/87, 5,3/5. **Die Rechnung aus E-115 ist damit nicht
plausibel, sondern gemessen.** Die Zahlen decken sich zeichengleich mit T-330 und T-338 bei anderem
Datenvorrat.

### 3.2 Die Klippe sitzt an der getragenen Untergrenze — und sie ist zwei Pixel breit

Inhaltsbreite des Behälters (`.todo-list__filters`, `container-type: inline-size`) über die
Fensterbreite, und was daraus folgt:

| Fenster | Behälterinhalt | Spalten | `.screen__header` |
|---|---|---|---|
| 1024 | 43,88 rem | 4 zu 166 px | 328,3 |
| 992 | 41,88 rem | 4 zu 158 px | 328,3 |
| 970 | 40,50 rem | 4 zu 152,5 px | 367,3 |
| **960** | **39,88 rem** | **2 zu 312 px** | **437,3** |

`@container (max-width: 40rem)` ist eine **runde Zahl**, und sie lag **2 px** auf der falschen Seite
der getragenen Untergrenze aus `tauri.conf.json`. Der feste Teil sprang dort um **70 px** — auf
449,3 px gegen ein Budget von 500 px, also **89,9 %**. Ein Kopf, der an der Untergrenze 90 % seines
Budgets braucht, ist eine Textzeile davon entfernt, den Rahmen zum Laufen zu bringen. Genau die
Fehlerfamilie aus E-115.

### 3.3 Die Behebung, gerechnet statt gerundet

Schwelle **40 rem → 38,25 rem**, und dieselbe Zahl als Spaltenmindestmaß:
`repeat(4, minmax(9rem, 1fr))`. Herleitung: 4 × 9 rem + 3 × `--space-3` = 4 × 144 + 3 × 12 =
**612 px = 38,25 rem**. Schwelle und Maß sind derselbe Wert, zweimal geschrieben — `minmax(9rem, …)`
kann deshalb nie überlaufen. Die 9 rem stammen aus dem, was heute schon ausgeliefert wird: vier
Spalten zu 166 px bei 1024 px Fenster; 10 rem je Spalte bräuchte 676 px und paßte an 960 nicht mehr.

**Nachher, 960 × 640:** vier Spalten zu **150 px**, Kopf **367,3**, fester Teil **379,3 statt 449,3**
— 75,9 % des Budgets statt 89,9 %. Dieselbe Gestalt wie bei 1024, eine Stufe enger; im Bild
(`shots/nach-todos-960x640.png` gegen `nach-todos-1024x640.png`) ist der einzige Unterschied, daß der
Platzhalter „Nach Tag filtern …" eine Silbe früher endet — das tut er bei 1024 heute schon.
Unverändert bei 1280, 1024, 831 und 640; zusätzlich gewinnt die Bandgestalt bei 700 × 640 (437,3 →
367,3).

### 3.4 Buchungen und Protokoll haben **keine** Klippe

Ihre `.filterbar__controls` ist eine umbrechende Flex-Zeile und packt stufenlos: 1280 → 106,
960 → 128, 640 → 176. An der getragenen Untergrenze stehen sie bei **348,3** und **283,3** gegen 500
— 70 % und 57 % des Budgets. Dort ist nichts zu ziehen; die Behandlung, die der Kanban-Kopf bekommen
hat, ist bei ihnen bereits die eingebaute.

### 3.5 Was bei 831 × 640 und 640 × 480 bleibt — und warum es nicht die Filterleisten sind

| Fenster | Rest an die Hülle | Bandnavigation | Rahmen | Budget |
|---|---|---|---|---|
| ab 832 px Breite | 52 px | — (Spalte, 240 px breit) | 588 | 500 |
| **darunter** | **225 px** | **173 px** | 415 (bei 640 Höhe: 255) | 335 / **175** |

Bei 640 × 480 nimmt die Hülle **47 % der Fensterhöhe**, bevor eine Ansicht beginnt. Dagegen steht der
kleinstmögliche Kopf einer Ansicht mit Erklärsatz und einzeiliger Filterleiste:
74,8 (Kopfzeile) + 113,5 (Leiste mit einer Reihe, Statuszeile, Polster) + Zwischenräume ≈ **188 px**
— gegen ein Budget von **175 px**. Das Protokoll trägt zusätzlich 29 px Unterreiter.

**Der Boden liegt also über dem Budget, unabhängig von jeder Filterleiste.** Dieselbe Rechnung
erklärt die 5,3 px der Todos bei 831 × 640. Der Hebel dort ist die **Bandnavigation**, nicht die
Filterleiste; das ist eine Gestaltungsfrage und keine, die ich still entscheide — sie steht als
offene Frage (1).

Die A2-Verstöße bei 640 × 480 (todos 274, bookings 221, exportAudit 108, board 87) und bei 831 × 640
(todos 5) bestehen deshalb unverändert fort. Beide Größen liegen nach E-115 unterhalb der getragenen
Untergrenze, wo „eine eigene, schwächere Zusage" gilt.

### 3.6 Die Bereichsschiene der Einstellungen — gemessen, **nicht** behoben, begründet

Reproduziert, zahlengleich mit T-338:

| Fenster | `.screen__body--frame` | Schiene | letzter Eintrag sichtbar | A2 |
|---|---|---|---|---|
| 1280 × 820 | 695/695 | 576,7 | ja | **0** |
| **1024 × 640** | **577/515 (62 über)** | **576,7** | **nein** („Arbeitsplatz") | **0** |
| 960 × 640 | 515/515 | **145** (Band) | ja | **0** |
| 1024 × 900 | 775/775 | 576,7 | ja | **0** |

Betroffen ist genau der Streifen **über 60 rem Breite und unter etwa 700 px Höhe**; bei 960 greift die
bestehende Stufe `@media (max-width: 60rem)` und macht aus der Schiene ein Band.

**Nicht behoben, und das ist eine Entscheidung, keine Auslassung.** Die zwei Wege, die es gäbe:

- eine **Höhenbedingung** an der bestehenden 60-rem-Stufe. Das führt eine zweite Maßrichtung in eine
  Layoutstufe ein — eine Gestaltungsentscheidung, und sie widerspräche
  `docs/design/fensterfeste-flaechen.md` 9.2/9.6, wo genau 1024 × 640 als die Größe steht, an der die
  A8-**Ausnahme** gemessen wird.
- ein **eigener Bildlaufkasten** für die Schiene. Der bräuchte nach T-322 R-4 einen eigenen
  Tabulatorhalt — und damit läge ich mitten in der Frage, die der Orchestrator ausdrücklich für zwei
  Designer reserviert hat.

Beides ist „Umbau". Gemeldet statt geraten.

---

## 4 Die falsche Zahl aus meinem T-334-Bericht — berichtigt, und diesmal gemessen

**Die Umbruchschwelle des Kanban-Kopfes ist ≈ 1259 px und nicht ~1067 px.** Ich habe sie nicht
nachgerechnet, sondern **abgefahren**: Fensterbreite in Einzelschritten von 1290 auf 1240.

| Fenster | Inhaltsbreite | `.grow` | `.screen__actions` | umgebrochen | Kopfhöhe |
|---|---|---|---|---|---|
| 1262 | 964 | 162,66 | 785,34 | nein | 187,8 |
| 1261 | 963 | 161,66 | 785,34 | nein | 187,8 |
| **1260** | **962** | **160,66** | 785,34 | **nein** | **187,8** |
| **1259** | **961** | **961** | 785,34 | **ja** | **137,8** |
| 1258 | 960 | 960 | 785,34 | ja | 137,8 |

Die Kante liegt bei **1259 px**, zeichengleich mit der Rechnung von T-336 und T-339:
160 (`flex-basis: 10rem`) + 16 (`gap`) + 785,34 = **961,34** gegen 982 px Inhaltsbreite bei 1280 —
**20,7 px Luft**, also **1,6 %** über der Kante. Meine „~1067" stammt, wie T-339 vermutet hat, vom
**alten** Zusammenbruch bei ≈ 1089 px; sie steht in `.claude/team/reports/T-334-frontend-dev.md`
Abschnitt „Risiken" und in der dortigen offenen Frage (2) und ist hiermit ausdrücklich **falsch
gemeldet und berichtigt**.

**Fachlich ist das kein Detail, und T-339 hat recht:** Über die getragene Breite von 960 bis 1259 px
ist der **umbrochene** Kopf die Regelgestalt, der einzeilige die Ausnahme oben.

**Ein Zusatz, den die Kurve zeigt und den bisher niemand beziffert hat:** Der umbrochene Kopf ist an
der Kante auch **niedriger** — 137,8 px bei 1259 gegen **187,8 px** bei 1260. Direkt oberhalb der
Kante ist `.grow` nur noch 160,66 px breit und der Erklärsatz läuft über viele Zeilen; unterhalb
bekommt er die volle Breite. Der Umbruch ist also nicht bloß „kein Rückschritt", sondern an seiner
eigenen Kante ein Gewinn von **50 px** fester Höhe.

---

## 5 Nachtrag des Orchestrators — E-113 im Kommentar

`viewport-layout.css` trug den Block „**GEMESSENE ABWEICHUNG … bitte entscheiden**". Er steht jetzt
als **entschiedene Regel** da, mit dem Grund und nicht nur mit dem Verweis:

> Ein Bildlaufkasten muß der umschließende Block seiner eigenen absoluten Nachfahren sein. Wandert
> der Bildlauf, wandert `position: relative` mit ihm.

Dazu drei Sätze, die im alten Block fehlten: daß „genau ein umschließender Block" nie das Ziel war
(das Ziel war, daß kein absoluter Nachfahre aus seinem Kasten fällt); daß es **dieselbe Klasse wie
T-057** ist, eine Ebene höher, und nicht ihr Gegenteil; und daß die Zeile deshalb auch an
`.kcolumn__body` steht, obwohl dort heute kein absoluter Nachfahre ist.

**Eine Zeile im selben Block war inzwischen überholt** und ist mitberichtigt: Sie begründete, daß
`.scrim` und `.toast-layer` „am Fenster bleiben", weil `position: relative` ohne `z-index` kein
umschließender Block für feste Positionierung ist. Das stimmt weiter, trägt aber nicht mehr die
Zusage — seit T-334 hängen sie an einem **Portal** (E-116), und Regel G mißt es. Der Kommentar zeigt
jetzt dorthin.

---

## 6 Ein Nebenfund zu `ScreenBody` — nicht angefaßt, nur gemessen

Der spec-ux-reviewer meldet, `ScreenFrame` trage `tabIndex={0}` und die Sprungmarke auf einem Kasten,
der im getragenen Fenster nicht läuft. **Meine Messung gibt dem recht — mit einer Ausnahme, die dem
Befund nicht widerspricht, aber zu ihm gehört:**

| Ansicht, Größe | `.screen__body--frame` scroll/klient | läuft der Rahmenkasten? |
|---|---|---|
| Einstellungen 1280 × 820 | 695/695 | nein |
| Einstellungen 1024 × 900 | 775/775 | nein |
| Einstellungen 960 × 640 | 515/515 | nein |
| **Einstellungen 1024 × 640** | **577/515** | **ja, 62 px** |

Also: Bild-ab nach der Sprungmarke tut in den Rahmenansichten fast überall nichts — **außer** in
genau dem Streifen, in dem die Bereichsschiene aus Abschnitt 3.6 überläuft. Wer die Sprungmarke
verlegt, verliert dort die einzige Größe, in der sie heute etwas bewirkt. Kein Vorschlag von mir;
die Zahl gehört in die Entscheidung.

---

## 7 Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0**, acht Pakete plus Prüf- und E2E-Konfigurationen |
| `pnpm boundaries` | grün, 528 Dateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | grün, 0 von 522 Paaren durchgefallen, 261 Paare, 11/11 Gegenproben |
| `pnpm proof:surface` | **34 bestanden, 0 fehlgeschlagen** (vorher 28/0) |
| `pnpm proof:clamp` | 21/0 |
| `pnpm proof:locked` | 9/0 |
| `pnpm proof:foreign` | 21/0 |
| `pnpm build` | grün, alle Pakete, `apps/web` in 2,37 s |
| **nicht gefahren** | `verify:bundle` (bindet 17844, T-342 läuft parallel), `test:coverage`, `test:rust`, `audit`, `proof:engines`, `test:e2e`, `proof:all` als Ganzes |

Eigene Meßläufe: 4 Mutationen × (`tsc` + Wächter mit und ohne Regel G) = 12 Läufe; Browsermessungen
22 Fokusfälle, 22 Bildvergleiche, 66 Fenstergrößen-Ansicht-Paare, 15 Breitenstufen der
Filterleiste, 51 Breitenschritte an der Umbruchkante.

---

## 8 Artefakte im Wegwerfverzeichnis

`…/scratchpad/t341-frontend/` — nicht Teil des Bestands, nicht committet:
`stub-api.mjs`, `lib.mjs`, `png.mjs` (eigener PNG-Leser), `mess-fokus.mjs`, `mess-ring.mjs`,
`mess-zeichengleich.mjs`, `mess-ueberlagerung.mjs`, `mess-fest.mjs`, `mess-aufbau.mjs`,
`mess-grid.mjs`, `mess-huelle.mjs`, `mess-schiene.mjs`, `mess-schwelle.mjs`, `mutieren.mjs`,
`fokus.json`, `ring-vorher.json`, `ring-nachher.json`, `ring-vergleich.json`, `zeichengleich.json`,
`fest-vorher.json`, `fest-nachher.json`, `aufbau.json`, `shots/*.png` (rund 40 Aufnahmen).

---

```
Aufgabe: T-341 — Fokusring, Filterleisten und die Zusage über die Verankerung
Status: braucht Review
Artefakte: apps/web/src/styles/viewport-layout.css, apps/web/src/styles/app.css,
  apps/web/scripts/proof-surface.mjs, .claude/team/reports/T-341-frontend-dev.md
Zusammenfassung: Der abgeschnittene Fokusring ist behoben, und die Menge war größer als gemeldet —
  nicht ein Knopf, sondern **acht** Ansichten plus die Werkzeugzeile des Kanban, jede mit 0,0 px
  Luft nach oben, in beiden Kontrasteinstellungen; im Bild mit gesetztem Fokus null Ringpunkte
  oben gegen 50 bis 1 806 an den drei anderen Kanten. Die Behebung holt den Ring mit einem
  Polster in Ringhöhe plus negativem Rand herein, statt `overflow: hidden` zu tauschen
  (`overflow: clip` fiele aus, weil `scrollbar-gutter` nur an einem Bildlaufkasten wirkt): danach
  4,0 px Luft, 5,0 px unter `prefers-contrast: more`, und ohne Fokus sind 9 von 11 Ansichten Pixel
  für Pixel gleich (Dashboard 48 Punkte bei Δ2, Todos 9 Punkte am Lupensymbol). Der Zweck der
  Zeile hält: 15 bis 16 px bleiben zwischen Klippkante und Laufbereich frei. `proof:surface`
  bekommt **Regel G**, an der Anforderung aufgespannt statt an den Portalen — jede Fläche mit der
  Klasse `scrim` muß lexikalisch im gezeichneten Argument eines `createPortal(…, document.body)`
  stehen; alle vier Mutationen aus R-32 sind beidseitig gemessen (`tsc` Exit 0, ohne Regel G
  32/0 grün, mit Regel G 33/1 rot, je mit Ort und Grund), dazu 15 Gegenprobengestalten in beide
  Richtungen; 28/0 → 34/0. Bei den Filterleisten ist die Ursache gefunden und sie ist zwei Pixel
  breit: die Spaltenschwelle der Todo-Filterleiste stand auf der runden Zahl 40 rem, und die
  getragene Untergrenze 960 px liefert 39,88 rem — der feste Teil sprang dort um 70 px auf 89,9 %
  seines Budgets. Schwelle jetzt gerechnet (4 × 9rem + 3 × 12 px = 38,25 rem): 449,3 → 379,3 px,
  also 75,9 %. Die Budgetrechnung aus E-115 ist dabei gegen die Messung geprüft — der Überschuß
  über das Budget ist in jedem Verstoßfall gleich dem A2-Überlauf plus 0,3 px.
Annahmen: (1) Buchungen und Protokoll haben **keine** Spaltenklippe — ihre Filterleiste packt
  stufenlos und steht an der getragenen Untergrenze bei 70 % und 57 % des Budgets; ich habe dort
  deshalb nichts geändert, statt eine Zahl zu verschieben, die nichts kostet. (2) Die A2-Verstöße
  bei 831 × 640 und 640 × 480 habe ich **nicht** behoben und halte sie in den Filterleisten für
  nicht behebbar: Die Hülle nimmt unterhalb von 52 rem 225 statt 52 px Fensterhöhe (Bandnavigation
  allein 173 px), und der kleinstmögliche Kopf einer Ansicht mit Erklärsatz und einzeiliger
  Filterleiste ist ≈ 188 px gegen ein Budget von 175 px. (3) Die Bereichsschiene der Einstellungen
  ist gemessen und **nicht** behoben — beide möglichen Wege sind Umbau (neue Maßrichtung in einer
  Layoutstufe, oder ein zweiter Bildlaufkasten mit eigenem Tabulatorhalt). (4) Die Reserve für den
  Fokusring steht als Eigenwert an ihrer Regel und nicht als Token — zwei Leser, beide in denselben
  zwei Zeilen, nach derselben Regel, mit der T-339 `flex-basis: 10rem` entschieden hat.
Risiken: Die neue Reserve macht aus einer stillen Grenze eine benannte: Jede künftige Fläche, die
  weiter als Ring + Versatz über die Kopfkante ragen soll, wird weiterhin abgeschnitten — aber
  jetzt steht im Quelltext, wieviel Platz da ist und warum. Sicherheitsseitig nichts Neues: keine
  Adresse, keine Route, kein Datenweg; Regel G ist ein statischer Leser und schreibt nichts. Die
  Regel meldet eine Abdunklung, die über einen zweiten Baustein ins Portal käme, als Befund —
  falsch-positiv in der sicheren Richtung, und der Satz dazu steht im Lauf.
Offene Fragen: (1) An ui-designer: Die Bandnavigation nimmt unterhalb von 52 rem 173 px
  Fensterhöhe. Sie ist der einzige verbleibende Hebel für 831 × 640 und 640 × 480; soll sie dort
  gedrängter werden, oder bleibt es bei der schwächeren Zusage nach E-115? (2) An ui-designer: Soll
  die Bereichsschiene bei über 60 rem Breite und unter etwa 700 px Höhe zur Bandgestalt wechseln
  (Zahlen in Abschnitt 3.6)? Das widerspräche 9.2/9.6 des Papiers, wo 1024 × 640 als Größe der
  A8-Ausnahme geführt wird. (3) An code-reviewer/security-checker: Soll Regel G die Frage gleich
  für `.toast-layer`, `.idle-reminder` und `.skip-link` mitstellen? Sie sind heute unauffällig und
  ungemessen (T-336 offene Frage 2). (4) Gehört Regel G auf Dauer in `proof:surface` oder in einen
  eigenen Lauf? Sie beantwortet eine andere Frage als Regel F; ich habe sie hier gelassen, weil sie
  denselben Sammler und dieselben Quellen braucht.
Nächster Schritt: visual-qa über die drei geänderten Flächen — Fokusring im festen Teil an allen elf
  Ansichten und in beiden Kontrasteinstellungen, Todo-Filterleiste bei 960 × 640 und 970 × 640 (die
  beiden Seiten der alten Klippe), und die Rückfrage vor dem Öffnen in `glass`/`liquid-glass` als
  Gegenprobe zu Regel G. Danach ui-designer für die beiden offenen Fragen (1) und (2), und der
  Orchestrator für die Berichtigung der Zahl „~1067 px" im Stand von T-334.
```
