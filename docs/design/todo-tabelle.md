# Die Todo-Tabelle und die Tag-Fläche — der Mechanismus

Anlass: Auftrag des Auftraggebers vom 2026-09-14, umgesetzt als T-362.

> „baue hier bitte eine Tabelle hin. Wie auf den anderen Seiten. Plus Man muss nicht alle Tags
> sehen, diese können auch ruhig angezeigt werden, wenn man darüber hovert."

**Deckung:** `docs/spec.md` Abschnitt 25 (A-25.1 bis A-25.8), A-21.3 und A-21.4;
`.claude/team/decisions.md` E-112 bis E-117, dazu E-052 (Portale), E-081, E-087, E-099, E-114.
**Bestand:** [fensterfeste-flaechen.md](fensterfeste-flaechen.md) — dasselbe Papier, eine Ebene
höher —, [supertakt-layout.md](supertakt-layout.md), [theme-palettes.md](theme-palettes.md),
[traeger-und-zusage.md](traeger-und-zusage.md), [textabbau-gestalt.md](textabbau-gestalt.md).

**Stand: 2026-09-14, nach T-366 und T-365 berichtigt (T-373).** Die erste Fassung dieses Papiers
entstand **vor dem Bau**; keine ihrer Zahlen war an dieser Tabelle gemessen. Inzwischen hat T-366
beide Papiere gegeneinander gehalten und acht blockierende Widersprüche gefunden, der Orchestrator
hat alle acht entschieden, und T-365 hat gebaut und dabei vier offene Punkte dieses Papiers
**gemessen**. Jede Zahl trägt deshalb ab hier eine Herkunft: **gemessen** (T-365, am gerenderten
Bild), **gerechnet** (aus zwei Token), **gelesen** (Datei mit Zeile daneben) oder aus einem früheren
Auftrag übernommen. Die widerlegten Stellen bleiben sichtbar stehen — so, wie es
`fensterfeste-flaechen.md` an inzwischen sechzehn Stellen tut.

### Die Berichtigungsliste — welche Änderung welche Entscheidung umsetzt

E-113 ist in dieser Reihe **zweimal** eingetreten: getrennt vergebene Designaufträge haben denselben
Gegenstand entgegengesetzt entschieden, und niemand hat es gemerkt, bis ein Prüfer die Papiere
gegeneinander gemessen hat. Diese Tabelle ist die Gegenmaßnahme: Sie macht den nächsten Abgleich
billig, weil er nicht mehr lesen muß, sondern nachschlagen kann.

| Abschnitt | Was sich geändert hat | Entscheidung |
|---|---|---|
| 2.2, 8.1 | `.table__select` und `.table__row--selected` fallen aus den Listen; Spalte 1 heißt `.todo-col--done` | **N-3** |
| 4.3 | gerechnete Spaltensumme durch die gemessene ersetzt (43,5 rem); dazu, warum die Gegenrechnung von 56,5 rem danebenlag | **B-3**, T-365 Punkt 3 |
| 4.4 | Umbruch bestätigt, TT-07/TT-08 fallen; die vier umbrechenden Zellen mit Maß | **B-1** |
| 5.1 | dritte Zeile berichtigt: `aria-modal="true"` trägt den Einwand, nicht `role="dialog"` | **B-4** |
| 5.3 | Ü-1 ist **aufgelöst**: nicht-modaler `Popover`, kein `HoverCard`, kein `Tooltip`; dazu die Rollenfrage entschieden | **B-4** |
| 5.4 | `max-width` 20 rem → 24 rem, wie gebaut | T-365 |
| **5.5 (neu)** | der **Mechanismus** hinter SC 1.4.13: Zeitwerte, Versatz, Eigentum an `Escape` | **N-5a**, T-366 Abschnitt 3 |
| 6.2 | der Ausgang ist entschieden und gemessen: die Fläche **schließt**; gemessen wird die Bewegung des Ankers | **B-5** |
| 6.3 | R-a ist keine offene Aussage mehr: 662 px gegen 958,5 px, gemessen; F-7 geht **nicht** zurück | T-365 Punkt 4 |
| 7.2 | `.todo-row` wird **nicht** gestrichen; der Paletteneintrag wird trotzdem angefaßt, mit Begründung | **B-6**, **N-9** |
| 8.1 | Zustände der Tag-Fläche und der Zeile gegen den Bau nachgezogen | **N-3**, **N-4** |
| 9.3 | A12 mit den gemessenen Paaren belegt; **A14 nach Modalität getrennt** und um zwei Gegenproben ergänzt | **B-2**, **B-5** |
| 9.4 | der Vorrat mißt nicht mehr gegen „mehr Tags, als die Zelle zeigt" | **B-8** |
| 10.4 (neu) | `TableShell` zieht nach `shared/ui/` — eigener Auftrag; der Ankerwächter bleibt vorerst örtlich | T-365 offene Frage 1 |
| 11 | OF-2, OF-3 und OF-4 beantwortet; OF-1 bleibt offen, OF-5 kommt dazu | **N-9**, T-365 |

**Nicht geändert, und das ist Absicht:** die Liste F-1 bis F-10 in Abschnitt 0. Sie ist die Grenze
zum Schwesterpapier und gilt unverändert. Dieses Papier beantwortet auch in dieser Fassung keine
Frage, die dort steht — auch dann nicht, wenn ein Bericht sie an den ui-designer richtet. Wo eine
Antwort nötig scheint, steht sie im Bericht zu T-373 und nicht hier.

---

## 0. Was dieses Papier ist, und die Fragen, die es ausdrücklich **nicht** beantwortet

Es legt fest, **wie** die Todo-Liste als Tabelle gebaut wird und **wie** die Tag-Fläche gebaut
wird, damit beides in denselben Formen liegt wie die Buchungsübersicht und die Exporttabellen.

**Es entscheidet nicht, was in der Tabelle steht.** Das ist T-361 (`todo-tabelle-fluss.md`), und
die folgende Liste ist die Grenze, an der dieses Papier aufhört. Sie steht hier vollständig, weil
T-339 und T-340 am selben gemessenen Fall zum Gegenteil gekommen sind und dabei beide sauber
gearbeitet haben — getrennte Hoheit trennt Dateien, nicht Widersprüche. Wer in diesem Papier eine
Antwort auf eine dieser Fragen zu finden glaubt, hat eine Bauform für eine Entscheidung gehalten:

| # | Frage | Wer |
|---|---|---|
| F-1 | Welche Spalten es gibt, in welcher Reihenfolge, und was in jeder steht | T-361 |
| F-2 | Ob es eine Auswahlspalte (Kontrollkästchen) gibt und was eine Mehrfachauswahl tut | T-361 |
| F-3 | Ob und wonach sortiert wird, und welche Spalten sortierbar sind | T-361 |
| F-4 | Wann die Tag-Fläche aufgeht — Zeiger, Fokus, Klick, Verzögerung | T-361 |
| F-5 | Was ohne Maus geschieht, und ob die Fläche mehr als eine Anzeige ist | T-361 |
| F-6 | Wie viele Tags in der Zelle sichtbar bleiben, bevor die Fläche den Rest trägt | T-361 |
| F-7 | Ob der Hinweis „n erledigte Todos sind ausgeblendet" und „Weitere laden" im Laufbereich bleiben | T-361 |
| F-8 | Ob die Zeile eine Randmarkierung nach Exportstatus, Frist oder Timerlauf trägt | T-361 |
| F-9 | Ob der Doppelklick weiterhin die Detailansicht öffnet | T-361 |
| F-10 | Ob „Erledigt" ein Kontrollkästchen in einer Spalte bleibt (E-023, I-03) | T-361 |

Zu **jeder** dieser Fragen steht unten trotzdem etwas — aber ausschließlich in der Form „wenn T-361
so entscheidet, wird es so gebaut, und das kostet dies". Eine Bauform ist kein Vorschlag zur Sache.

**Es ändert keine Optik.** Keine neue Farbe, kein neuer Radius, keine neue Erhebung, kein neues
Token in `packages/ui-tokens/tokens.css`, keine Fremdbibliothek über die hinaus, die seit T-059
ohnehin jede aufgeklappte Fläche trägt. Was an Klassen dazukommt, steht in Abschnitt 2.3 und ist
in jedem Fall die **zweite Fundstelle einer vorhandenen Bauform**, nie eine zweite Bauform.

---

## 1. Die Entscheidung in einem Satz

> Die Todo-Liste bekommt **dieselbe** Tabellenbauart wie die Buchungsübersicht und die
> Exporttabellen — `.table-wrap` als Laufbereich, `.table` darin, klebender Kopf, feste
> Spaltenbreiten über `<colgroup>` —, und die Tag-Fläche bekommt **dieselbe** Überlagerungsbauart
> wie jede aufgeklappte Liste seit T-059: Portal am Dokumentkörper auf `.popover-layer`.

Eine zweite Tabellenbauart wäre der Fehler. Eine zweite Überlagerungsbauart wäre derselbe Fehler
an der anderen Achse — und er hat in diesem Bestand schon einmal 958 × 666 Pixel bei
(297, −36333) gekostet (R-31, E-116).

---

## 2. Das Tabellenmuster des Bestands — gelesen, nicht erfunden

### 2.1 Die drei Tabellen, die es heute gibt

| Tabelle | Datei | Bauart | Laufbereich |
|---|---|---|---|
| Buchungsübersicht | `features/bookings/BookingTable.tsx:175-316` | `.table-wrap` > `.table`, Spaltenbreiten an den Zellklassen (`table-layout: auto`) | **die Tabellenfläche selbst** (`className="screen__body"` + `surface={runAreaSurface("Buchungen", true)}`, `BookingsScreen.tsx:469-471`) |
| Export nach Todo | `features/export/ExportGroups.tsx:202-223` | `.table-wrap` > `.table.export-todo-table`, `table-layout: fixed` + `<colgroup>`, `min-width: 60rem` | ein Baustein **im** Laufbereich, mit eigenem Halt (`tableSurface`, `:180`) |
| Tagesgruppen | `features/export/ExportGroups.tsx:278-…` | dieselbe wie darüber, eigene Spaltenbreiten in Prozent | dito, geschachtelt ohne Halt |
| *Exportprotokoll* | `features/export/ExportAudit.tsx:87` | **keine Tabelle** — `<ul>` aus `.auditrow` | `.screen__body`, Stapel |

**Die letzte Zeile ist eine Berichtigung am Auftrag.** Der Auftrag nennt als Vorbild „die
Buchungsübersicht … und das Exportprotokoll". Das Exportprotokoll ist im Bestand **keine** Tabelle;
es ist eine Liste aus `<li class="auditrow">` mit einem zweizeiligen Kopf je Eintrag. Wer „wie auf
den anderen Seiten" an ihm ausrichtet, baut die Liste nach, die gerade ersetzt werden soll. Die
Vorbilder sind die **drei Tabellen** darüber; das Protokoll ist ein eigener Fall und in diesem
Auftrag nicht berührt. (Gelesen an `ExportAudit.tsx` und an `app.css:2950-3110`; falls der
Auftraggeber das Protokoll mitgemeint hat, ist das ein eigener Auftrag — offene Frage OF-1.)

### 2.2 Was die Todo-Tabelle unverändert trägt

Aus `apps/web/src/styles/components.css:744-945`, ohne eine Zeile Änderung:

| Bezeichner | Zeile | Was es leistet |
|---|---|---|
| `.table-wrap` | `:744` | `width: 100%`, `overflow-x: auto` — der waagerechte Lauf, einer der genau zwei erlaubten Kästen (fensterfeste-flaechen 4) |
| `.table` | `:749` | Breite, `--text-sm`, `--leading-snug` |
| `.table thead th` | `:755` | **der klebende Kopf**, samt `--z-sticky`, `--bg-subtle`, Unterkante, Versalien, `nowrap` |
| `.table__sort`, `.table__sort-icon` | `:771-795` | Sortierknopf mit `--hit-target-min`, Pfeil, `aria-sort` am `th` |
| `.table tbody td` | `:797` | `height: var(--row-height)`, `padding: 0 var(--row-padding-x)` — **beide Dichten ohne eine weitere Zeile** |
| `.table__row` und seine Zustände | `:805-853` | Grundfläche, Zebra, `:hover`, `--selected`, `--active`, die Randmarkierung an `td:first-child` |
| ~~`.table__select`~~ | ~~`:855`~~ | **Gestrichen (N-3).** Die Todo-Tabelle hat **keine Auswahl**; Spalte 1 trägt das Erledigt-Kästchen, und das ist eine Zustandsänderung, keine Markierung. Ein Bezeichner, der „select" heißt und nichts auswählt, ist genau die Sorte Rest, gegen die 7.2 selbst argumentiert. Gebaut ist `.todo-col--done`. |
| `.table__primary` / `.table__secondary` | `:899-907` | zwei Zeilen in einer Zelle, Tabellenziffern |
| `.table__cell--end` / `--center` | `:909-917` | Ausrichtung, am `th` mitgeführt |
| `.table__row-menu` | `:919` | der Menüauslöser in der Aktionsspalte |
| `.table-shell` | `:940` | der Rahmen für Leer-, Lade- und Fehlerzustand an Tabellenstelle |
| `.screen > .screen__body.table-wrap` | `viewport-layout.css:478` | `display: block` — die eine Zeile, die aus dem Flex-Stapel den Tabellenkasten macht |

Dazu drei **Bausteine**, unverändert: `runAreaSurface`/`RunAreaSurface` (`shared/ui/ScreenBody.tsx:102-126`),
`Menu` mit `align="end"` (Zeilenmenü und Kontextmenü), `TableShell` (`BookingTable.tsx:325`).

### 2.3 Was ergänzt werden muss — vier Zeilen, keine fünfte

Alles davon hat im Bestand bereits **eine** Fundstelle. Es kommt jeweils eine zweite dazu, mit
eigenen Konstanten, nicht eine zweite Bauart.

1. **`table-layout: fixed` und ein `<colgroup>`.** Vorbild `app.css:5220-5229`
   (`.export-todo-table, .export-day-table { table-layout: fixed }` plus `.export-col--*`). Für die
   Todos: `.todo-table` und `.todo-col--*`, im selben Stilblatt, neben den übrigen `.todo-*`-Regeln
   (`app.css:1635 ff.`). Begründung in Abschnitt 4.
2. **`min-width` an der Tabelle.** Vorbild `app.css:5164` (`.export-todo-table { min-width: 60rem }`).
   Für die Todos dieselbe Zahl, und sie ist gerechnet, nicht abgeschrieben — Abschnitt 4.3.
3. **`overflow-wrap: anywhere` an der Titelzelle.** Vorbild `app.css:5230`
   (`.export-todo__head > td:nth-child(5)`), dort für denselben Datentyp: den Titel eines Todos in
   einer Tabelle mit festem Layout. Abschnitt 4.4.
4. **Die Tag-Zelle und ihre Fläche.** Das ist der einzige wirklich neue Teil, und auch er benutzt
   ausschließlich vorhandene Bauformen — Abschnitt 5.

**Was ausdrücklich nicht dazukommt:** keine zweite `.table`-Variante, kein `.table--todos`-Zweig mit
eigenen Zeilenhöhen, keine eigene Kopfzeile, kein eigener Sortiermechanismus, keine eigene
Zebra-Regel, kein eigener Hover-Ton. Wo die Todo-Tabelle anders aussehen soll als die
Buchungstabelle, ist das eine Entscheidung von T-361 und steht dann dort — nicht als stille
Abweichung in einer zweiten Klassenfamilie.

---

## 3. Der klebende Kopf, und er hat eine Bedingung

### 3.1 Die Bedingung, wörtlich aus dem Bestand

`.table thead th { position: sticky; top: 0 }` steht seit `components.css:755` im Baum und war
jahrelang **wirkungslos**. Der Grund ist keine Vermutung, er folgt aus der Regel: `.table-wrap`
trägt `overflow-x: auto` und `overflow-y: visible`; die Kaskade rechnet die zweite Achse dann auf
`auto` auf, und damit ist `.table-wrap` Bildlaufkasten auf **beiden** Achsen. Ein `sticky thead`
klebt an dem Bildlaufkasten, der ihm am nächsten ist — und das ist bei einer Tabelle immer das
`.table-wrap`. Es klebte also an einem Kasten, der genau so hoch war wie die Tabelle darin, und
das heißt: gar nicht.

> **Der Kopf klebt genau dann, wenn `.table-wrap` selbst der senkrechte Laufbereich der Ansicht ist.**

Gebaut ist das seit T-334 an einer Stelle, und es ist derselbe Kasten unter zwei Namen:

```html
<div class="screen__body table-wrap" id="inhalt" tabindex="0" role="region" aria-label="Todos">
  <table class="table todo-table"> … </table>
</div>
```

`.screen__body` bringt `overflow-y: auto`, die Größenrechnung, den Boden von 4 rem,
`scrollbar-gutter: stable`, `overscroll-behavior: contain` und `position: relative` (E-113).
`.table-wrap` bringt `overflow-x: auto`. Zusammen ein Kasten, der auf beiden Achsen läuft — und der
Kopf steht beim senkrechten Lauf still **und** wandert beim waagerechten mit seiner Spalte. Das
zweite ist kein Beiwerk: Ein Kopf, der senkrecht klebt und sich waagerecht nicht mitbewegt, steht
über den falschen Spalten.

### 3.2 Die Bauform hängt am Zustand — und das ist der Teil, den man übersieht

`.screen > .screen__body.table-wrap` setzt `display: block` (`viewport-layout.css:478`). Damit ist
der Laufbereich in diesem Zustand **kein Flex-Stapel mehr**, und drei Zeilen des Mechanismus greifen
nicht:

- `gap: var(--space-5)` zwischen Bausteinen — es gibt nur einen Baustein.
- `.screen__body > .empty`, `> .table-shell`, `> .board-setup { margin-block: auto }`
  (`viewport-layout.css:462-466`) — die senkrechte Mitte eines Bildschirmleerzustands hängt an
  `auto`-Rändern eines **Flex**-Elements. Im Blockfluß tut `margin-block: auto` nichts.
- `.screen > .screen__body:not(--frame) > * { flex: none }` (fensterfeste-flaechen 3.2 Punkt 3) —
  im Blockfluß gibt es kein Schrumpfen, das zu verhindern wäre.

**Daraus die Regel, und sie ist im Bestand schon so gebaut** (`BookingsScreen.tsx:391`, `:406`, `:469`):

> **Der gefüllte Zustand nimmt die Tabellenform des Laufbereichs. Leer-, Lade- und Fehlerzustand
> nehmen die Stapelform.** Es ist derselbe Laufbereich mit demselben Namen und demselben Halt; er
> wechselt seine Bauform mit dem Zustand, nicht seine Rolle.

Konkret für die Todos:

```tsx
<AsyncBoundary … fallbackFrame={(content) => <ScreenBody label="Todos">{content}</ScreenBody>}>
  {(value) => {
    if (todos.length === 0) return (
      <ScreenBody label="Todos"><TableShell><EmptyState …/></TableShell></ScreenBody>
    );
    return <ScreenBody label="Todos" className="table-wrap"><TodoTable …/></ScreenBody>;
  }}
</AsyncBoundary>
```

`ScreenBody` trägt `className="table-wrap"` — dieser Wert ist in `ScreenBody.tsx:137-140`
ausdrücklich als einer von zweien vorgesehen und braucht keine neue Eigenschaft. Die zweite
Bauform, die `BookingTable` benutzt (`className="screen__body"` + `surface`), ist die Antwort auf
ein Problem, das die Todos **nicht** haben: `BookingTable` steht auch in der Musterseite
(`showcase/DataSection.tsx:306`), also ohne Laufbereich, und zeichnet deshalb sein `.table-wrap`
selbst. Eine Todo-Tabelle in der Musterseite gibt es heute nicht; entsteht sie, wechselt die
Todo-Tabelle auf dieselbe Form wie `BookingTable` und nicht auf eine dritte.

### 3.3 Die fünf Auflagen an den klebenden Kopf — alle schon erfüllt

Aus `fensterfeste-flaechen.md` 6.2, hier je mit der Zeile, die sie heute schon einlöst:

| Auflage | Erfüllt durch |
|---|---|
| deckender Hintergrund aus einem Token | `background-color: var(--bg-subtle)` (`components.css:761`) |
| nicht auf `.card`, nicht auf `.filterbar` | Der Kopf liegt im `.table-wrap`, nicht in einer Karte. In `glass`/`liquid-glass` tragen nur `.card`, `.filterbar`, `.app__sidebar`, `.app__header` ein `backdrop-filter` (`theme-palettes.css:453`) — die Tabelle nicht. |
| eine Kante, kein Schatten | `border-bottom: 1px solid var(--border-default)` (`:760`) |
| `z-index: var(--z-sticky)` | `:758` — 10, über dem Zeileninhalt, unter `--z-dropdown` (100) und `--z-popover` (320). **Das ist zugleich die Zusage, daß die Tag-Fläche nie unter dem Tabellenkopf verschwindet.** |
| Höhe aus Token | `padding: var(--space-2) var(--row-padding-x)` (`:759`), und `--row-padding-x` wechselt mit der Dichte (`tokens.css:333`, `:430`) |

Dazu die sechste aus 3.4 desselben Papiers: **`top: 0` bezieht sich auf die obere Polsterkante des
Laufbereichs**, und der Laufbereich hat ausdrücklich kein `padding-block-start`. Hätte er eines,
liefe unter dem klebenden Kopf ein Streifen Inhalt durch. Wer der Todo-Tabelle oben Luft geben
will, gibt sie dem `thead`, nicht dem Laufbereich.

**Höchstens ein klebendes Band je Laufbereich.** Ein zweites — etwa eine klebende Zwischenzeile je
Pool oder je Fristgruppe — bräuchte am unteren `top: calc(Höhe des oberen)`, und diese Höhe ist über
zwei Dichten und neunzehn Gestaltungen keine Konstante. Wer zwei will, baut zwei Laufbereiche, und
das ist eine Entscheidung von T-361 und nicht eine Zeile CSS.

---

## 4. Spaltenbreiten und Kürzung

### 4.1 Warum `table-layout: fixed` und nicht das Verfahren der Buchungstabelle

Die Buchungstabelle regelt ihre Breiten über Zellklassen bei `table-layout: auto`
(`.table__state { width: 10.5rem }`, `.table__call { width: 9.5rem }`, `.table__note { width: 12rem;
max-width: 12rem }`). Das funktioniert dort, weil **jede** Spalte kurzen, formatierten Inhalt trägt:
Datum, Dauer, Status, Call, Herkunft. Der einzige lange Text ist die Leistung, und sie steht in
einer Zelle mit fester Breite und einem inneren Block mit fester Breite (`components.css:894-897`,
samt dem Kommentar, warum es den inneren Block braucht).

Die Todo-Tabelle hat einen anderen Fall: **der Titel ist der Inhalt**, er ist beliebig lang, er
kommt von außen (Add-in, Fremdimport), und er kann ein einziges Wort ohne Wortgrenze sein. Bei
`table-layout: auto` mißt der Browser die Spaltenbreiten am Inhalt — ein Titel von 300 Zeichen
drückt die Titelspalte auf, und alle übrigen Spalten schrumpfen mit. Die Tabelle wird dann so breit
wie ihre längste Zeile, und die Breite hängt daran, welche 100 Todos gerade geladen sind. Das ist
dieselbe Klasse wie T-057 Ursache 2 (die Inhaltsbreite hängt an der Menge des Inhalts), nur eine
Ebene tiefer.

`table-layout: fixed` beendet das: Die Breiten stehen im `<colgroup>`, der Browser liest den Inhalt
für die Breitenrechnung gar nicht, und die Tabelle ist in jeder Füllung gleich breit. Das ist
zugleich der Grund, aus dem die Exporttabellen es schon tun.

### 4.2 Die Spaltenbreiten selbst

Die **Menge** der Spalten entscheidet T-361 (F-1). Die **Regel**, nach der ihre Breiten entstehen,
ist Bauform und steht hier:

1. Jede Spalte mit formatiertem Inhalt bekommt eine feste `rem`-Breite in `.todo-col--<name>`,
   wie `.export-col--*`. Keine Prozente in der Haupttabelle — Prozente hängen an der Tabellenbreite
   und damit am Fenster, und dann ist genau das zurück, was `fixed` beseitigen sollte.
   (Die *geschachtelte* Tagestabelle des Exports benutzt Prozente, `app.css:5233-5236` — sie liegt
   in einer Zelle und hat deshalb keine eigene Mindestbreite. Der Fall kommt hier nicht vor.)
2. **Genau eine Spalte hat keine `<col>`-Breite**: die Titelspalte. Sie nimmt, was übrig bleibt.
   Zwei flexible Spalten in einer Tabelle mit festem Layout teilen den Rest nach einem Verfahren,
   das niemand mehr nachrechnet.
3. Die Untergrenze der Titelspalte ist die **Differenz**: `min-width` der Tabelle minus Summe der
   festen Spalten. Sie wird nicht eigens gesetzt.
4. Die Tag-Spalte ist eine feste Spalte wie jede andere. Sie ist **keine** flexible Spalte, auch
   wenn ihr Inhalt in der Länge schwankt — genau dafür gibt es die Fläche aus Abschnitt 5.

### 4.3 `min-width: 60rem` — gerechnet, nicht abgeschrieben

Die Zahl muß zwei Bedingungen zugleich erfüllen, und beide sind Zahlen aus dem Bestand:

**Obergrenze — im Standardfenster darf die Tabelle nicht laufen.** `fensterfeste-flaechen.md` 7.4
rechnet die Inhaltsbreite vor: Fensterbreite − `--sidebar-width` − zweimal `--screen-inset` − 10 px
Rinne. Damit:

| Fenster | Gestaltung | Inhaltsbreite | Quelle |
|---|---|---|---|
| 1280 × 820 (Standard) | klassisch, `--sidebar-width: 15rem` | **982 px** | gerechnet: 1280 − 240 − 48 − 10 |
| 1280 × 820 | `clear`, `--sidebar-width: 13.5rem` (`tokens.css:657`) | 1006 px | gerechnet |
| 1200 × 820 (Meßgröße 9.2) | klassisch | 902 px | gerechnet |
| 1024 × 640 (Meßgröße 9.2) | klassisch | 726 px | gerechnet |
| 960 × 640 (Untergrenze der Hülle) | klassisch | **662 px** | `fensterfeste-flaechen.md` 7.4, dort gemessen |

`60 rem` sind 960 px und liegen 22 px unter 982. Die nächste Stufe, `61 rem` = 976 px, ließe 6 px —
das ist dieselbe Enge, die 7.4 für die Kopfschwelle als „nicht stabil" bezeichnet hat. `60 rem` ist
damit **die beste verfügbare Zahl unter der Auflage „im Standardfenster kein waagerechter Lauf"**,
und nicht eine runde Zahl.

**Untergrenze — die Summe der Spalten muß hineinpassen.** Sobald T-361 die Spaltenmenge festlegt,
gilt: `Summe der festen Spalten + Boden der Titelspalte ≤ 60 rem`. Als Boden der Titelspalte gelten
**16 rem** — dieselbe Größenordnung, die der Bestand für Titelspalten zweimal festhält
(`.table__period { min-width: 14rem }`, `components.css:880`; `minmax(14rem, 2fr)` für die
Suchspalte der Filterleiste, `app.css:1526`). Bleiben **44 rem für alle übrigen Spalten zusammen.**
Reicht das nicht, fällt eine Spalte weg oder rückt in die zweite Zeile einer Zelle
(`.table__primary`/`.table__secondary`) — nicht `min-width` hinauf. Eine Tabelle, die im
Standardfenster waagerecht läuft, ist der Zustand, den der Auftraggeber beanstandet hat.

**Was unterhalb von 1280 geschieht, ist der bewußte Preis:** Bei 1200 läuft die Tabelle um 58 px,
bei 1024 um 234 px, bei 960 um 298 px. Das ist zulässig und ausdrücklich vorgesehen —
`fensterfeste-flaechen.md` 4 nennt `.table-wrap` als einen von genau zwei Kästen mit waagerechtem
Lauf, mit der Begründung aus WCAG 2.2 SC 1.4.10, die zweidimensionalen Inhalt ausnimmt. Es ist
außerdem zeichengleich das Verhalten, das die Exporttabelle heute zeigt.

**Das ist mit B-2 entschieden und nicht mehr strittig.** Das Schwesterpapier hatte in TT-04 das
Gegenteil zugesagt („bei 960 px läuft die Tabellenfläche **nicht** waagerecht"); TT-04 rückt auf
1280. Die Zusicherung A12 mißt das Paar und bleibt, wie sie steht.

### 4.3a Die Messung — 43,5 rem, und warum die Gegenrechnung 56,5 rem ergab

**Gemessen von T-365** im Browser mit den Stilblättern des Erzeugnisses, acht Fensterformen, dazu
`clear`, `zen` und `kompakt`. Kein Zellinhalt läuft in irgendeiner Messung über seine Zelle hinaus.

| Spalte | `<col>` | gemessen breitester Inhalt | Verhalten |
|---|---|---|---|
| Erledigt | 9 rem / 144 px | Kästchen 24 + 8 + `DoneFlag` „Erledigt aufgehoben" 133,7 | Etikett bricht um, Zeilenhöhe bleibt 40 px |
| Call | 4,5 rem / 72 px | 46,8 (dicktengleich, sechs Ziffern) | nie gekürzt |
| **Titel** | **keine** | — | Umbruch, 4.4 |
| Status | 7 rem / 112 px | „In Bearbeitung" 91,7 | Umbruch, kein Deckel |
| Frist | 7,5 rem / 120 px | „Heute fällig 31.12.2026" 141,7 | bricht um |
| Tags | 3,5 rem / 56 px | Kopf „TAGS" 53,3 | Auslöser ≥ 24 × 24 |
| Buchungen | 6,5 rem / 104 px | Streifen mit vier Zuständen 140,1 | bricht um, nie gekürzt |
| Aktionen | 5,5 rem / 88 px | 2 × 28 + 4 + 24 = 84 | — |

> **Summe der sieben festen Spalten: 696 px = 43,5 rem** gegen das Budget von 44 rem aus 4.3.
> **Titelspalte 17,8 rem** (284,5 px) bei 1280 × 820 und **16,4 rem** (262,5 px) bei 960 und 1024 —
> der Boden von 16 rem hält überall. Bei 1280 × 820 ist `scrollWidth === clientWidth`.

Damit ist die vom Orchestrator angeordnete **Zusammenlegung von „Erledigt" und „Status" nicht nötig
und nicht gebaut**. Die Anweisung lautete „kürzen, bis es paßt"; es paßt mit acht Spalten.

**Warum die Gegenrechnung danebenlag — und das ist für das nächste Papier mehr wert als die Zahl.**
T-366 hat in B-3 ≈ 56,5 rem gerechnet und daraus einen Blocker abgeleitet, der keiner war. Die
Rechnung war sorgfältig und trotzdem falsch, aus drei Gründen, die sich alle wiederholen lassen:

1. **Sie nahm die Breiten einer anderen Tabelle.** Die zitierten Werte (`components.css:856, 867,
   876, 889`) sind die Zellklassen der **Buchungstabelle**. Die sind für `table-layout: auto` und
   für deren Inhalte bemessen — `.table__state` trägt dort unter anderem „— ohne Call —". Eine
   Breite, die für fremden Inhalt gewählt wurde, mißt fremden Inhalt.
2. **Sie setzte Spaltenbreite gleich Breite des breitesten Inhalts.** Unter `table-layout: fixed`
   ist eine Spaltenbreite eine **Wahl**, keine Folge. Die Auflage lautet nicht „so breit wie der
   breiteste Inhalt", sondern „nichts wird abgeschnitten **und** die Zeilenhöhe hält". Vier Zellen
   sind in ihrer breitesten Ausprägung schmaler als ihr Inhalt und brechen um — gemessen alle vier
   innerhalb der 40 px Zeilenhöhe.
3. **Sie rechnete das Wort „Call" mit**, das in der Zelle gar nicht mehr steht; es steht nur noch im
   Spaltenkopf. 9,5 rem gegen gebaute 4,5 rem — fünf Rem aus einem Wortlaut, den die Zeile verloren
   hat (das ist zugleich N-8).

**Die Lehre in einem Satz, und sie verbindet B-1 mit B-3:** Eine Zusage „wird nie gekürzt" verbietet
die **Kürzung**, nicht den **Umbruch** — und erst weil B-1 den Umbruch gewählt hat, ist das
Spaltenbudget überhaupt aufgegangen. Wer beide Entscheidungen getrennt betrachtet, hält die eine für
Geschmack und die andere für unerfüllbar. Sie waren dieselbe Entscheidung.

**Eine Fußnote zu den Zahlenpaaren, damit der nächste Leser nicht zweimal rechnet.** Die Rechnung in
4.3 nennt **Inhaltsbreiten** (982, 1006, 902, 726, 662 px), die Messung nennt
`clientWidth`/`scrollWidth` (1030, 1008, 774, 710). Beide sind richtig und meinen nicht dasselbe:
`clientWidth` **schließt die Polsterung ein**, und `.screen > .screen__body` trägt
`padding-inline: var(--screen-inset)` (`viewport-layout.css:439`), also zweimal 24 px. Jedes
gemessene Paar geht damit auf: 1280 → 1280 − 240 − 10 = **1030**; `scrollWidth` = 960 (die
`min-width`) + 48 = **1008**; der Vorsprung im Standardfenster ist 1030 − 1008 = **22 px**,
zeichengleich die 22 px, die 4.3 aus der Inhaltsbreite gerechnet hat. Unter 52 rem fällt
`--screen-inset` auf 16 px (`app.css:5031`) — deshalb mißt der Lauf bei 831 px nicht 1008, sondern
**992**. Wer nur eine der beiden Reihen kennt, hält die andere für einen Fehler.

### 4.4 Wie der Titel gekürzt wird — er wird **nicht** gekürzt, er bricht um

Der Bestand kennt für denselben Datentyp beide Behandlungen, und er trennt sie nach der **Rolle**:

| Stelle | Behandlung | Zeile |
|---|---|---|
| Todo-Titel als **Nebenangabe** unter dem Zeitraum (Buchungstabelle) | `.truncate` in einem Block fester Breite, voller Text im `title` | `BookingTable.tsx:274`, `components.css:894` |
| Todo-Titel als **Hauptangabe** der Zeile (Exporttabelle) | `overflow-wrap: anywhere`, Umbruch, nichts verborgen | `app.css:5230` |

In der Todo-Tabelle ist der Titel die Hauptangabe. Also **Umbruch**, und zwar mit
`overflow-wrap: anywhere` und nicht mit `break-word`: `break-word` bricht ein langes Wort erst, wenn
es allein in einer Zeile steht, und läßt die Zeile vorher überlaufen — das steht seit T-302 im
Bestand begründet (`base.css:348-352`).

Vier Gründe, und der dritte ist der, der die Entscheidung trägt:

1. **Es ist die Bauform, die der Bestand für genau diesen Wert in genau dieser Rolle schon hat.**
2. **Es fügt `proof:clamp` keinen neuen Deckel hinzu.** Der Lauf rechnet seine Menge D aus den
   Stilblättern: jede Regel mit `text-overflow`, `-webkit-line-clamp`, `white-space: nowrap` oder
   `overflow: hidden` ist ein Deckel (`apps/web/scripts/proof-clamp.mjs:41-46`). Ein neuer
   Kürzungsname wäre eine neue Deckelklasse — heute folgenlos, weil ein Todo-Titel `ForeignText`
   ist und nicht `UncappedText`; morgen ein Risiko, sobald in dieser Spalte etwas steht, an dessen
   **Ende** eine Entscheidung hängt. Ein Deckel, den es nicht gibt, muß nie bewacht werden.
3. **A-25.2 und A8.** Ein Deckel verbirgt Inhalt, ohne daß ein Lauf es merkt — A1 und A2 werden
   davon sogar **besser**, das ist der Befund hinter Abschnitt 9.6 des Mechanismuspapiers. Ein
   Umbruch verbirgt nichts.
4. **Die Zeilenhöhe bleibt im Regelfall unverändert.** `.table tbody td { height: var(--row-height) }`
   wirkt an einer Tabellenzelle als **Mindesthöhe**: einzeilige Titel stehen weiter auf exakt 40 px
   (bzw. 32 px in „kompakt"), nur die seltene lange Zeile wächst. Es gibt also keine zweite
   Zeilenhöhe und keine neue Konstante.

**Der Preis steht dabei:** Eine Tabelle mit umbrechenden Zeilen ist schlechter überfliegbar als
eine mit gleich hohen. Eine Deckelung auf zwei Zeilen (`-webkit-line-clamp: 2`) wäre der Ausgleich,
und sie ist **abgelehnt**, nicht übersehen: Sie ist ein neuer Deckel (Grund 2), sie verbirgt Text
ohne Anzeige (Grund 3), und sie bräuchte in beiden Dichten eine Höhenrechnung, die kein Token
hergibt. Wer sie trotzdem will, braucht eine Entscheidung, nicht eine Zeile.

### 4.5 Die Durchlässigkeit nach außen — sie ist schon da, und sie wird gemessen

Damit die Tabelle **in sich** läuft und nicht die Seite breiter macht (A-25.2), muß die Kette vom
Fenster bis zum `.table-wrap` durchlässig sein. Sie ist es, an jeder Fuge, und jede Fuge steht
heute schon so im Baum (`fensterfeste-flaechen.md` 4):

```
.app  Spalte main   minmax(0, 1fr)                    app.css:110
.app__main          min-width: 0 + grid-template-columns: minmax(0, 1fr)
.screen             min-width: 0
.screen__body       = .table-wrap, eigener Bildlaufkasten — hier endet die Kette
```

`.app__main` behält `overflow-x: hidden`. Das schneidet den waagerechten Lauf des Enkels **nicht**
ab — `.table-wrap` ist ein eigener Bildlaufkasten und wird an der Rahmenbreite gemessen. Es
schneidet dann und nur dann, wenn eine Fuge verstopft ist, und genau das mißt A2a
(`viewport-fit.spec.ts`, ohne Untergrenze bis 320 × 256). **Für die Todo-Tabelle ist nichts zu
bauen; es ist etwas zu messen** — Abschnitt 9.

---

## 5. Die Tag-Fläche

### 5.1 Sie benutzt `DialogSurface` **nicht**. Begründung

Der Auftrag fragt, ob die Tag-Fläche den Baustein aus T-348 benutzt. Antwort: **nein**, und die
Lehre aus E-116 gilt trotzdem — nur ist sie im Bestand schon an zwei Stellen eingelöst, und
`DialogSurface` ist die falsche davon.

`DialogSurface`/`Scrim` ist die Zustandsmaschine unter **modalen** Dialogen. Sie bringt vier Dinge
mit, die eine Tag-Fläche nicht haben darf:

| Was `DialogSurface` mitbringt | Warum es hier falsch ist |
|---|---|
| eine deckende Abdunklung `.scrim` über der ganzen Anwendung | Die Fläche soll neben ihrer Zeile stehen, nicht die Anwendung stillegen. |
| `trapFocus` | Eine Fokusfalle für eine Anzeige von drei Tags ist eine Sackgasse. |
| `aria-modal="true"` und `role="dialog"` | Die Fläche behauptete, eine Entscheidung zu verlangen. Sie verlangt keine. |
| Rückgabe des Fokus an den Auslöser beim Schließen, Fokusrückholung, `MutationObserver` | Maschinerie für einen Fall, den es hier nicht gibt. |

Und sie bringt **nicht** mit, was die Fläche braucht: eine **Verankerung am Auslöser**. `.scrim` ist
`position: fixed; inset: 0` — eine Fläche über dem ganzen Fenster, kein Kasten neben einer Zeile.

### 5.2 Sie benutzt die Bauform, die seit T-059 jede angeheftete Fläche trägt

```tsx
<Portal>
  <X.Positioner className="popover-layer">
    <X.Content className="tagsurface"> … </X.Content>
  </X.Positioner>
</Portal>
```

Das ist zeichengleich die Bauform von `Select` (`shared/ui/Select.tsx:210-231`), `Menu`
(`shared/ui/Menu.tsx:308-318`), `TagInput` (`features/tags/TagInput.tsx:350-431`), `IdleTaskSelect`
(`features/timer/IdleTaskSelect.tsx:54-65`) und `InfoHint` (`features/export/InfoHint.tsx:11-13`).
Fünf Fundstellen, eine Form.

**Warum sie die Zusage aus E-116 hält, und zwar strukturell und nicht durch eine Positionsangabe:**

- **Portal am Dokumentkörper.** `Portal` aus `@ark-ui/react/portal` hängt den Inhalt an
  `document.body`. Damit kann kein Vorfahr mehr den umschließenden Block verschieben — weder das
  `backdrop-filter` einer Karte in `glass`/`liquid-glass` (`theme-palettes.css:453`) noch ein
  `transform`, `filter` oder `contain`, das jemand nächstes Jahr irgendwo dazwischenschreibt. Das
  ist dieselbe Antwort wie in `Scrim` (`DialogSurface.tsx:438-442`), auf demselben Knoten
  (`document.body`, nicht `#root`), aus demselben Grund.
- **Die Position rechnet der Positionierer, nicht CSS.** `.popover-layer` trägt **ausschließlich**
  die Ebene (`components.css:1798-1812`); Ort und Verschiebung setzt Ark UI als Inline-Stil, samt
  Umklappen am Bildschirmrand. Es gibt also keine Zeile `position: fixed`, die etwas zusichert, was
  sie nicht halten kann — **das war der Fehler in R-31, nicht die Zahl dahinter.**
- **Die Ebene ist `--z-popover` (320)** und steht an **zwei** Stellen: an der Hülle und am Inhalt.
  Das ist kein Versehen, sondern Vorschrift — Ark UI liest `--z-index` vom gemessenen `z-index` des
  Inhalts ab, und steht dort nichts, liegt die Fläche in einem Dialog wieder dahinter
  (`components.css:1799-1811`). Wer `.tagsurface` ohne `z-index: var(--z-popover)` baut, baut den
  Fehler nach. 320 liegt über `--z-sticky` (10) — **damit ist zugesichert, daß die Tag-Fläche nie
  unter dem klebenden Tabellenkopf verschwindet.**

### 5.3 Welcher Baustein von Ark UI — und was zu prüfen ist, statt es zu raten

Die Fläche muß sechs Dinge können. Fünf davon sind Bauform, das sechste ist WCAG 2.2 SC 1.4.13
(„Inhalt bei Zeigerkontakt oder Fokus"), und das ist keine Geschmacksfrage:

| # | Anforderung | Warum |
|---|---|---|
| B-1 | Portal am Dokumentkörper, angeheftet an den Auslöser | 5.2 |
| B-2 | geht bei Zeigerkontakt auf | der Auftrag |
| B-3 | geht auch bei **Fokus** auf | SC 2.1.1 — sonst ist der Inhalt ohne Maus unerreichbar |
| B-4 | **überfahrbar** (`hoverable`/`interactive`): der Zeiger darf vom Auslöser auf die Fläche wandern, ohne daß sie zugeht | SC 1.4.13 |
| B-5 | **abweisbar**: `Escape` schließt, ohne die Seite zu verlassen | SC 1.4.13 |
| B-6 | **beständig**: schließt nicht von selbst nach einer Frist | SC 1.4.13 |

`HoverCard` ist der Baustein, der genau dafür gedacht ist (nicht modal, Zeiger **und** Fokus, eigene
Öffnungs- und Schließverzögerung). **Ob er in der installierten Fassung `@ark-ui/react@^5.39.0`
enthalten ist, ist in dieser Umgebung nicht nachprüfbar** — es steht kein `node_modules` zur
Verfügung. Deshalb steht hier keine Behauptung, sondern ein Bauschritt:

> **Übergabepunkt Ü-1:** Der frontend-dev prüft am installierten Paket, ob
> `@ark-ui/react/hover-card` vorhanden ist. Ist es das, wird es benutzt. Ist es das nicht, wird
> `Tooltip` mit `interactive` genommen — dieselbe Familie, im Baum bewährt (`InfoHint.tsx`), mit
> derselben Portalform; die Abweichung ist dann `role="tooltip"` statt eines nicht-modalen Kastens,
> und sie gehört in den Bericht. **Eine dritte Bibliothek kommt nicht in Frage**, und ein
> handgeschriebener Positionierer erst recht nicht: Genau den hat T-059 abgeschafft, samt der
> Klassen `.menu-anchor`, `.menu--popover`, `.menu--start`, `.menu--end` und `.menu-layer`
> (`components.css:2336-2341`).

**Was ausdrücklich nicht in Frage kommt: das `title`-Attribut.** `TagChip` setzt heute eines am
nicht-interaktiven `<span>` (`shared/ui/Tag.tsx:149-153`). In der Tabellenzelle wäre das der falsche
Bau, und der Bestand hat dazu schon eine Entscheidung: T-181 (ST-09) hat genau deshalb zwei `title`
an den Chip-Marken gestrichen — „auf einem `<span>` ist ein Titelattribut ohnehin nicht zugänglich:
nicht mit der Tastatur erreichbar, nicht abweisbar, nicht überfahrbar (SC 1.4.13)"
(`Tag.tsx:108-116`). Eine Fläche, die genau die Tags zeigt, die man sonst nicht sieht, darf nicht
über den einen Weg laufen, den dieses Papier für diesen Zweck schon verworfen hat.

### 5.4 Wie die Fläche aussieht — vier Zeilen, alle vom Nachbarn

Kein neues Token, keine neue Erhebung. `.tagsurface` nimmt, was `.menu` und `.select__content`
tragen (`components.css:1814-1834`, `:2342-2356`):

```css
.tagsurface {
  z-index: var(--z-popover);          /* Pflicht — siehe 5.2, Ark UI liest ihn hier ab */
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);                /* derselbe Abstand wie .todo-row__tags, app.css:1724 */
  max-width: 20rem;
  max-height: min(16rem, var(--available-height, 16rem));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background-color: var(--bg-surface);   /* deckend, aus einem Token — nie transparent */
  box-shadow: var(--shadow-lg);
}
.tagsurface[data-state="open"] {
  animation: popover-in var(--motion-base) var(--ease-out);
}
```

Zu drei Zeilen je ein Satz, weil sie sonst beim nächsten Aufräumen fallen:

- **`background-color: var(--bg-surface)`, deckend.** In `glass` und `liquid-glass` sind `.card` und
  `.filterbar` absichtlich zu 92 % deckend — die Fläche ist keines von beiden und bleibt deckend,
  sonst liest man den Tabelleninhalt durch die Tags hindurch. Dieselbe Auflage wie beim klebenden
  Kopf (6.2 Punkt 1 des Mechanismuspapiers).
- **`overscroll-behavior: contain`.** Eine Fläche mit mehr Tags als 16 rem läuft; ohne diese Zeile
  greift das Rad am Ende auf die Tabelle darunter durch und rollt die Zeile weg, an der die Fläche
  hängt.
- **`animation: popover-in`.** Der vorhandene Name (`components.css:1836-1842`), und deshalb ohne
  eigene Vorkehrung für `prefers-reduced-motion`: `base.css:252-258` setzt jede Dauer auf null.
  **Das ist die einzige Bewegung in diesem ganzen Papier.** Sie hat einen Zweck — sie sagt, daß die
  Fläche *aufgegangen* ist und nicht schon da war —, und sie ist die, die der Bestand für genau
  diesen Zweck führt.

---

## 6. Der Bildlauf unter der Fläche

### 6.1 Was gemessen ist und was nicht

`fensterfeste-flaechen.md` 8.2 hält den Fall seit T-323 offen und verbindlich: Die Position eines
Portalinhalts hängt am Anker, und der Anker liegt seit T-326 in einem **anderen** Bildlaufkasten als
vorher. Ob die Nachführung die Bildlaufereignisse dieses Kastens hört, ist eine Eigenschaft der
Bibliothek. T-326 hat **eine** Messung dazu gemacht: eine aufgeklappte Liste folgt ihrem Anker,
Abstand 36 → 36.

**Diese Messung trägt den Tabellenfall nicht**, und zwar aus drei benennbaren Gründen. Sie ist
deshalb nicht falsch — sie ist eine Messung an einem anderen Kasten:

1. **Der Anker liegt in einem Kasten, der auf *beiden* Achsen läuft.** Bei der gemessenen Liste war
   der Bildlaufkasten ein Flex-Stapel mit `overflow-y: auto`. Hier ist es ein `.table-wrap` mit
   `overflow-x: auto` **und** `overflow-y: auto`. Eine Nachführung, die Bildlauf auf der einen Achse
   hört und auf der anderen nicht, fällt bei jener Messung nicht auf.
2. **Über dem Anker liegt ein klebender Kasten.** Die Zeile kann unter den Tabellenkopf wandern,
   während die Fläche an ihr hängt. Dann steht eine Fläche über einem Kopf und zeigt die Tags einer
   Zeile, die nicht mehr im Bild ist. Die aufgeklappte Liste eines Auswahlfeldes hatte über sich
   nie etwas Klebendes.
3. **Der Anker ist eine Zelle in einer Tabelle**, kein Blockelement in einem Stapel. Die Kette der
   Bildlaufvorfahren führt zusätzlich über `<td>`, `<tr>`, `<tbody>` und `<table>`.

### 6.2 Die drei Ausgänge, und zwei davon sind richtig

> **Die Fläche folgt ihrem Anker, oder sie schließt sich. Sie bleibt nicht stehen, und sie bleibt
> nicht offen, wenn ihr Anker nicht mehr sichtbar ist.**

Das ist die Erweiterung des verbindlichen Prüffalls aus 8.2 um den dritten Fall, den es dort noch
nicht gab. Ausgeschrieben, je Achse:

| Vorgang | richtig | falsch |
|---|---|---|
| Laufbereich senkrecht rollen | Fläche wandert mit der Zeile, **oder** schließt | Fläche bleibt an ihrem Bildschirmort stehen |
| Zeile rollt unter den klebenden Kopf | Fläche schließt, **oder** verschwindet mit ihrer Zeile | Fläche steht sichtbar über dem Kopf, ihr Anker ist weg |
| Laufbereich waagerecht rollen | Fläche wandert mit der Zelle, **oder** schließt | Fläche bleibt stehen, während ihre Spalte wegläuft |
| Fenstergröße ändern | Fläche klappt am Rand um oder schließt | Fläche liegt teilweise außerhalb des Fensters |

**Welcher der beiden richtigen Ausgänge es wird, entscheidet dieses Papier nicht** — er hängt
daran, ob Ark UI in der installierten Fassung `hide`/`referenceHidden` durchreicht oder ob die
Fläche beim Bildlauf schließt. Beides ist zulässig, beides ist zu messen (A14 in Abschnitt 9), und
**der dritte Ausgang ist rot.** Der frontend-dev berichtet, welcher der beiden eingetreten ist,
statt einen zu behaupten.

### 6.3 Die Regel der waagerechten Laufkiste — und warum „Weitere laden" davon betroffen ist

Eine Folge des `.table-wrap`-Baus, die keiner der drei Vorbilder heute zeigt, weil keines von ihnen
einen Fuß hat. Sie ist **gerechnet aus der Kastenrechnung und nicht gemessen**, und sie steht
deshalb zugleich als Meßauftrag A13:

> Ein **Blockelement** im waagerecht laufenden Kasten ist so breit wie dessen **Inhaltsbreite**
> (662 px bei 960), nicht so breit wie dessen **Laufbreite** (960 px). Es wandert beim Rollen nach
> rechts aus dem Bild. Ein **Tabellenteil** dagegen (`tfoot`, `caption`, `td[colspan]`) ist so breit
> wie die Tabelle und bleibt über ihrer ganzen Breite stehen.

Betroffen sind heute zwei Elemente der Todo-Liste, und **ob** sie im Laufbereich bleiben, ist F-7
und damit T-361:

| Element | heute | Bauform im Laufbereich | Bauform außerhalb |
|---|---|---|---|
| `.list-more` („Weitere laden (n übrig)", `TodoListScreen.tsx:521-531`) | letztes Kind des Laufbereichs | `<tfoot><tr><td colSpan={n}>` mit dem vorhandenen `.list-more` darin | **gibt es nicht** — siehe unten |
| `.hidden-notice` („n erledigte Todos sind ausgeblendet", `:579-589`) | erstes Kind des Laufbereichs | `.screen__bar` **über** dem Laufbereich (fest), oder `<caption>` der Tabelle | `.screen__bar` |

**Eine feste Leiste *unter* dem Laufbereich gibt es in diesem Mechanismus nicht.**
`fensterfeste-flaechen.md` 3.3 legt `.screen` auf „sein letztes Kind ist `.screen__body`" fest. Wer
„Weitere laden" außerhalb des Laufs haben will, muß es über ihn setzen — und ein Nachladefuß über
der Liste ist keine Bauform, sondern ein Widerspruch. Also: entweder `tfoot`, oder er läuft mit.

`td[colSpan]` ist in dieser Tabellenfamilie bereits belegt (`ExportGroups.tsx:260`,
`<td colSpan={8}>`), `tfoot` ist neu — aber es ist ein Element des HTML-Tabellenmodells und keine
neue Bauart. Der `<caption>`-Weg für `.hidden-notice` hat eine harte Grenze: Eine Tabelle hat
**genau eine** `<caption>`, und die trägt heute den zugänglichen Namen
(`<caption class="visually-hidden">`, `BookingTable.tsx:177`). Beides in einer Caption wäre zwei
Wahrheiten über dieselbe Tabelle; der Bestand hat dazu schon einen Satz
(`ExportGroups.tsx:160-167`).

---

## 7. Beide Dichten, neunzehn Gestaltungen, kein fester Farbwert

### 7.1 Die Dichten kosten null Zeilen

Die Tabelle liest ihre Dichte aus zwei Token, die sie ohnehin liest:

| Token | Vorgabe | „kompakt" | gelesen von |
|---|---|---|---|
| `--row-height` | 2,5 rem (40 px) | 2 rem (32 px) | `.table tbody td { height: … }` (`components.css:799`) |
| `--row-padding-x` | `--space-3` (12 px) | `--space-2` (8 px) | `.table tbody td`, `.table thead th` (`:759`, `:798`) |

Beide stehen in `tokens.css:332-333` und `:428-431`, umgeschaltet über `[data-density]` am
Wurzelelement. **Die heutige Listenzeile liest dieselben zwei Token** (`app.css:1646-1647`) — die
Umstellung auf die Tabelle ändert an der Dichte also nichts, weder in der einen noch in der anderen
Richtung. Die Spaltenbreiten aus 4.2 sind absichtlich **nicht** dichteabhängig: Eine Tabelle, deren
Spalten mit der Dichte springen, hätte zwei `min-width` und damit zwei Kanten, an denen der
waagerechte Lauf beginnt.

### 7.2 Neunzehn Gestaltungen — und zwei Regeln, die mit der Listenzeile fallen

Die Tabelle benutzt ausschließlich Token; es steht in diesem Papier kein einziger Farbwert. Die
Buchungstabelle ist der Beleg, daß das trägt: Sie liegt seit T-337 in allen neunzehn Gestaltungen
und beiden Modi im Bild und ist dort gemessen.

**Zwei Stellen sind dabei anzufassen, und sie gehören in denselben Auftrag** (E-081 Punkt 4:
Streichung und Ausgleich laufen zusammen):

```
theme-palettes.css:464   :root[data-design-theme="lines"] :is(.card, .todo-row, .filterbar) { … }
theme-palettes.css:469   :root[data-design-theme="zen"]   :is(.card, .todo-row, .filterbar) { … }
```

Verschwindet `.todo-row`, zeigen beide `:is()`-Listen auf einen Bezeichner, den niemand mehr
zeichnet. Das ist kein optischer Fehler — es ist genau die Sorte Rest, die beim nächsten Lesen wie
eine Zusage aussieht. `.todo-row` wird aus beiden Listen gestrichen; `.card` und `.filterbar`
bleiben.

**Was dabei zu messen und nicht zu behaupten ist** (Übergabepunkt an visual-qa): In `zen` steht
`.card`/`.todo-row` auf `--bg-canvas` statt auf `--bg-surface`. Die Tabelle bringt statt dessen ihr
Zebra mit (`.table__row` auf `--bg-surface`, `:nth-child(even)` auf `--bg-surface-alt`,
`components.css:806-811`). Ob das in `zen`, `lines` und `plainspace` als Gestaltwechsel auffällt,
ist eine Frage an das Bild und nicht an dieses Papier. Die Antwort liegt aber schon vor: Die
Buchungstabelle zeigt in diesen drei Gestaltungen heute dasselbe Zebra, und niemand hat es
beanstandet. **Neue Optik entsteht hier also nicht — es wird eine vorhandene Optik an eine zweite
Stelle gezogen.** Das ist die Bedingung, unter der A-25.7 und A-21.3 gewahrt bleiben.

---

## 8. Zustände und responsives Verhalten

### 8.1 Die Zustände, je mit der Zeile, die sie heute schon trägt

Kein Zustand ist neu. Was hier steht, ist die Zuordnung — welcher vorhandene Bezeichner welchen
Zustand in der Tabellenform trägt:

| Zustand | Bauform | Zeile |
|---|---|---|
| **Laden** | `AsyncBoundary` mit `rows={6}`, `.loading-block` im `ScreenBody` in Stapelform | `TodoListScreen.tsx:446-451` |
| **Leer, ohne Filter** | `ScreenBody` (Stapelform) > `TableShell` > `EmptyState` mit Primäraktion „Neues Todo" | `BookingsScreen.tsx:406-433` als Vorbild |
| **Leer, mit Filter** | dasselbe, `EmptyState` mit „Filter zurücksetzen" | dito |
| **Fehler** | `AsyncBoundary` `onRetry`, `fallbackFrame` | `TodoListScreen.tsx:450` |
| **Zeile: normal / Zebra** | `.table__row`, `:nth-child(even)` | `components.css:805-811` |
| **Zeile: Zeiger darüber** | `.table__row:hover` → `--bg-hover` | `:812` |
| **Zeile: ausgewählt** | `.table__row--selected` → `--bg-selected` | `:815` |
| **Zeile: aktiv/im Zugriff** | `.table__row--active` → `inset 0 0 0 1px var(--border-accent)` | `:819` |
| **Zelle/Bedienelement: Fokus** | der globale Fokusring aus `base.css`, unverändert | — |
| **Randmarkierung am Zeilenanfang** | `.table__row > td:first-child { border-inline-start: 3px solid … }` | `:825-843` — **wonach** sie sich richtet, ist F-8 |
| **Bestätigung (Löschen)** | `ConfirmDialog` über `DialogSurface`, Portal, Fokusfalle | `TodoListScreen.tsx:544` — unverändert, A-25.6 |
| **Tag-Fläche: offen** | `.tagsurface[data-state="open"]`, `popover-in` | 5.4 |
| **Tag-Fläche: leer** | **gibt es nicht.** Ohne Tags erscheint kein Auslöser. Eine Fläche, die „keine Tags" sagt, ist eine Fläche, für die man vorher eine Handlung tun mußte, um nichts zu erfahren. | — |

**Die Primäraktion der Ansicht bleibt „Neues Todo"** im Bildschirmkopf (`TodoListScreen.tsx:406-416`),
in jedem Zustand genau eine, und sie wandert nicht in die Tabelle. Der Leerzustand wiederholt sie —
das ist der einzige Ort, an dem sie zweimal steht, und er ist bewährt.

### 8.2 Responsiv

| Stufe | Was geschieht | Quelle |
|---|---|---|
| über 1280 px | Tabelle füllt die Breite, kein waagerechter Lauf | 4.3 |
| 1280 bis 960 px Tabellenbreite | Tabelle läuft in sich waagerecht, Kopf wandert mit den Spalten | 3.1, 4.3 |
| ≤ 68 rem | **hier ist eine Streichung fällig** — siehe unten | `app.css:4883-4893` |
| ≤ 52 rem | Navigation legt sich als Band über den Kopf; die Tabelle ändert sich nicht, sie läuft weiter | `app.css:4903` |
| unter 960 × 640 | Rückfall nach 7.2 des Mechanismuspapiers: der **Rahmen** läuft; die Tabelle behält ihren Boden von 4 rem | `fensterfeste-flaechen.md` 7.2 |

**Die Streichung bei 68 rem, und sie ist eine Verbesserung, keine Nebenwirkung.** Heute gilt:

```css
@media (max-width: 68rem) { .todo-row__tags { display: none; } }   /* app.css:4890-4892 */
```

Unterhalb von 1088 px sind die Tags einer Todo-Zeile **gar nicht sichtbar** — und über keinen
anderen Weg erreichbar als die Detailansicht. Das war unter einer Flex-Zeile die einzige Antwort:
Eine Zeile, die nicht waagerecht laufen kann, muß etwas weglassen. Eine **Tabelle kann waagerecht
laufen**, und damit ist die Regel gegenstandslos: Die Tag-Spalte bleibt in jeder Fensterbreite in
der Tabelle stehen und wandert nur aus dem Bild, wo man sie durch Rollen wiederholt.

Die Regel fällt also **mit** `.todo-row__tags`, zusammen mit dem Rest der Klassenfamilie. Sie fällt
nicht ersatzlos — der Ersatz ist der waagerechte Lauf, und er ist besser als das, was sie tat.
**Das ist ein Fall für E-087 und A-25.7**, und beide sind gewahrt: Es entfällt kein Oberflächentext,
und es entfällt keine Funktion — es entfällt ein Weglassen.

---

## 9. Der Meßsatz

### 9.1 Die Grenze zuerst — E-117, beide Hälften, im Kopf und nicht im Bericht

> **Ein Quelltextlauf sichert die Bauart dieser Tabelle zu, nicht ihre Wirkung.** Daß im Bestand
> `table-layout: fixed`, `min-width: 60rem` und `overflow-wrap: anywhere` stehen, ist lesbar. Daß
> der Kopf klebt, daß die Tabelle im Standardfenster nicht läuft und daß die Tag-Fläche über dem
> Kopf liegt, ist es **nicht** — zwischen dem Text und dem gerechneten Kasten liegt die Kaskade, und
> ein Quelltextleser ist keine Kaskade. Die Wirkung sichert eine Messung am gerenderten Bild zu.

Danach die Aufteilung, und sie folgt der Hausform:

- **Bauart, statisch.** Ein `proof:`-Lauf, billig und schnell, der die Zusagen aus Abschnitt 2.3
  gegen die Platte hält. **Vorschlag an den Orchestrator, nicht Teil dieser Vorschrift** — dieselbe
  Einstufung, die `fensterfeste-flaechen.md` 9.5 für den entsprechenden Lauf hat.
- **Wirkung, gerendert.** Sechs neue Zusicherungen in `tests/e2e/viewport-fit.spec.ts`, im
  Vorgabelauf von `pnpm test:e2e`, an denselben sieben Fenstergrößen und mit demselben Vorrat.
  **Gebaut wird sie vom e2e-tester**; hier steht die Vorschrift.

### 9.2 Was A8 **nicht** mißt — die Berichtigung, die dieser Auftrag selbst ausgelöst hat

Der Auftrag zu T-362 faßt A8 so zusammen: *„kein direktes Kind eines Laufbereichs darf über ihn
hinausragen — eine Tabelle mit klebendem Kopf ist genau so ein Kind."*

**Das ist eine Fehllesung, und sie hätte eine falschrote Zusicherung ergeben.** A8 mißt, gelesen
an `tests/e2e/viewport-fit.spec.ts:405`:

```js
if (child.scrollHeight > child.clientHeight + 1) { … }   // das Kind gegen SICH SELBST
```

Also: **ein Kind darf seinen eigenen Inhalt nicht abschneiden.** Es darf sehr wohl höher sein als
der Laufbereich — genau das ist der Bildlauf, und wäre es anders, wäre jede laufende Liste im
Bestand rot. Die Tabelle als Kind des `.table-wrap` ist genau so hoch wie ihre Zeilen, hat kein
`overflow` und damit `scrollHeight === clientHeight`; sie ist grün, und die Buchungstabelle beweist
es seit T-345 an sieben Fenstergrößen.

Was A8 an dieser Tabelle **wirklich** leistet: Es fängt den Tag, an dem jemand der Tabelle oder
einem Geschwister im Laufbereich ein `max-height` oder ein `overflow: hidden` gibt. Das ist ein
echter und plausibler Fehler, und dafür ist die Zusicherung da. Sie ist hier also nicht die
Hauptsache, sondern der Nebenwächter — die Hauptsache steht in A10 bis A15.

Die Lehre, in einem Satz: **Eine Zusicherung, die man aus dem Gedächtnis zitiert, wird beim
nächsten Bau gegen die falsche Zahl gemessen.** Der Satz aus dem Auftrag ist am Quelltext gelesen
und dort widerlegt worden; er ist in `fensterfeste-flaechen.md` 9.1 nachgetragen, damit die nächste
Lesung ihn nicht noch einmal macht.

### 9.3 Die sechs neuen Zusicherungen

Menge der Ansichten wie bisher über `ROUTE_NAMES` (9.3 des Mechanismuspapiers); die hier genannten
gelten je auf der Todo-Ansicht, A10 zusätzlich auf der Buchungsübersicht.

| | Zusicherung | Messung | Was sie **nicht** sagt |
|---|---|---|---|
| **A10** | *Der Tabellenkopf klebt wirklich.* | Laufbereich ans Ende rollen; `thead th` `getBoundingClientRect().top` vor und nach dem Rollen gleich (± 1) **und** gleich `screen__body.getBoundingClientRect().top` (± 1). Vorbedingung: `screen__body.scrollHeight > clientHeight` — sonst mißt der Lauf ein Kleben, das nichts zu tun hatte, und ist grün ohne Aussage. | Nicht, daß der Kopf lesbar ist. Ein deckender Hintergrund ist eine Farbfrage und gehört ins Bild. |
| **A11** | *Der Kopf wandert waagerecht mit seiner Spalte.* | Laufbereich waagerecht ans Ende rollen; `left` einer benannten `th`-Zelle und `left` der ersten `td`-Zelle derselben Spalte gleich (± 1). Vorbedingung: `scrollWidth > clientWidth` an dieser Fenstergröße. | Nicht, welche Spalte wo steht. |
| **A12** | *Im Standardfenster läuft die Tabelle nicht waagerecht, darunter kann sie.* | Bei 1280 × 820: `table-wrap.scrollWidth ≤ clientWidth + 1`. Bei 960 × 640: `scrollWidth > clientWidth` — **beides**, und das Paar ist der Punkt: Das erste allein wäre auch grün, wenn die Tabelle auf 20 rem zusammengefallen wäre. | Nicht, daß die Spaltenbreiten sinnvoll sind. |
| **A13** | *Was unter oder über der Tabelle steht, steht über ihrer ganzen Breite.* | Nach dem waagerechten Rollen ans Ende: jedes Element, das im Laufbereich neben der Tabelle liegt, hat `getBoundingClientRect().right ≥` der rechten Kante der letzten sichtbaren Spalte. Gilt nur, wenn es ein solches Element gibt — **und wenn nicht, sagt der Lauf, daß er keines gesehen hat** (die Hausform gegen die leere Menge, E-111, 9.6). | Nicht, ob es dieses Element geben soll — das ist F-7. |
| **A14** | *Die Tag-Fläche bleibt nicht stehen.* | Fläche öffnen, Bildlaufstelle des Laufbereichs merken, senkrecht um 200 px rollen. Danach gilt **genau eines**: die Fläche ist geschlossen (`count() === 0`), oder ihr `top` hat sich um denselben Betrag verschoben wie das `top` ihrer Zeile (± 2). Dasselbe waagerecht. **Unverändertes `top` bei offener Fläche ist rot.** | Nicht, welcher der beiden Ausgänge der richtige ist — 6.2. |
| **A15** | *Die Tag-Fläche liegt über dem klebenden Kopf.* | Fläche an einer Zeile nahe dem oberen Rand öffnen; `elementFromPoint` in der Mitte der Fläche liefert einen Knoten **innerhalb** der Fläche. Gegenprobe im selben Lauf: `--z-popover` am Inhalt entfernt ⇒ rot. | Nicht, daß sie im Bild lesbar ist. |

**Die zwei Untergrenzen gelten auch hier, und sie zählen ihre eigene Menge** (9.6 des
Mechanismuspapiers, E-111): Der Lauf meldet, **wie viele** Tabellen er gefunden hat und **wie
viele** davon tatsächlich liefen. Null gefundene Tabellen ist rot, nicht grün. Dieser Bestand hat
den Fehler dreimal gemacht; er wird ihn nicht ein viertes Mal machen, weil niemand daran gedacht
hat.

**Die Gegenprobe, verbindlich** (E-117 Punkt „Nachweis über den Wächter"): Jede der sechs
Zusicherungen wird einmal mit dem Zustand **vor** dem Bau gefahren und muß rot werden —
`position: sticky` am `thead` entfernt ⇒ A10 rot; `table-layout: fixed` entfernt ⇒ A12 rot;
`.tagsurface` ohne Portal ⇒ A14 oder A15 rot. Sechs von sechs. Ohne diese Probe ist „alles grün"
wieder nur eine Behauptung über einen Wächter, und genau diese Behauptung ist in diesem Bestand
dreimal grün gewesen und blind.

### 9.4 Der Vorrat

Ergänzt zu `fensterfeste-flaechen.md` 9.4, Punkt „Todo-Liste". Zusätzlich nötig:

- ein Todo mit **mehr Tags, als die Zelle zeigt** — sonst gibt es keinen Auslöser, und A14/A15
  messen an einer Fläche, die es nicht gibt (und sind grün);
- ein Todo mit **einem** sehr langen Titel ohne Wortgrenzen (steht schon dort — die
  `.foreign-name`-Fehlerklasse trifft die Breite);
- mehr Todos, als in eine Fensterhöhe passen (steht schon dort — Vorbedingung von A10).

Erfundene Daten, `tests/fixtures/`, keine echten Call-Nummern.

---

## 10. Übergabe an den frontend-dev

### 10.1 Der E-087-Abgleich — gemessen, beide Wege

Gesucht wurde über den **Bezeichner**, nicht über die Zeile, und über beides: die versionierten
Dateien und den Arbeitsbaum (`apps/*/src`, `packages/*/src`, `tests/`). `.todo-row` und `.todo-list`
sind **Geltungsbereiche** und keine Texte — E-114 gilt: Wer eine Kennung verlegt, sucht ihre
Benutzung, nicht ihren Wortlaut.

**In `tests/e2e/**`: 8 Dateien, 12 lebende Fundstellen.** Sie brechen alle, sobald `.todo-row`
verschwindet:

| Datei | Zeilen |
|---|---|
| `deadline-lifecycle.spec.ts` | 87, 167, 194 |
| `midnight-redraw.spec.ts` | 78, 90 |
| `tag-input.spec.ts` | 212, 213 |
| `kanban.spec.ts` | 103 |
| `todo-revival.spec.ts` | 190 (dazu ein Kommentar in 192) |
| `focus-return-after-dialog.spec.ts` | 118 |
| `attachment-open-commands.spec.ts` | 238 |
| `foreign-title-display.spec.ts` | 53 (`.todo-row__title bdi`) |

**Nicht betroffen:** `todo-filter-layout.spec.ts` (9, 26) — es benutzt `.todo-list__ordering` und
`.todo-list__sort-hint`, und die gehören der **Filterleiste** (`TodoListFilters.tsx:55-96`), nicht
der Liste. Der Bezeichner sieht gleich aus und ist ein anderer. Das ist die Fehlerklasse aus E-114,
hier einmal in die andere Richtung: ein Treffer, der keiner ist.

> **Auflage:** Der frontend-dev repariert diese Prüffälle **nicht** nebenbei. Sie stehen mit Datei,
> Zeile und Behebungsvorschlag im Bericht, und die Reparatur ist ein Auftrag an den e2e-tester in
> der **nächsten** Welle — die Lehre aus T-315/T-316: Wer eine Schnittstelle umbaut und wer sie
> mißt, gehören in aufeinanderfolgende Wellen.

**In `apps/web/src`:** `TodoRow.tsx` (ganz), `TodoListScreen.tsx:498` (`<ul class="todo-list">`),
`app.css:1635-1742` (`.todo-list`, `.todo-row` und zwölf Unterklassen), `app.css:4890-4892` (die
68-rem-Regel, siehe 8.2), `theme-palettes.css:464` und `:469` (siehe 7.2). `app.css:2124` und
`components.css:1115` und `viewport-layout.css:340` nennen `.todo-row*` nur in **Kommentaren**; sie
bleiben, wo sie stehen — ein Kommentar, der die Vorgeschichte erklärt, ist kein Rest.

### 10.2 Reihenfolge

1. `TodoTable.tsx` neben `TodoRow.tsx` anlegen; `.todo-table`, `.todo-col--*` in `app.css`.
2. `TodoListScreen.tsx` auf die Zustandsform aus 3.2 umstellen (`ScreenBody` mit und ohne
   `table-wrap`, `TableShell` im Leerzustand).
3. Ü-1 prüfen (5.3), Tag-Fläche bauen, `.tagsurface` in `components.css` neben `.menu`.
4. `.todo-row`/`.todo-list` samt der 68-rem-Regel und den zwei `theme-palettes`-Einträgen
   streichen — **in diesem Schritt und nicht früher**, damit zwischen Bau und Streichung kein
   Zwischenstand steht, gegen den jemand mißt.
5. Messen: `pnpm check`, dazu `viewport-fit.spec.ts` im vorhandenen Stand (er muß grün bleiben) und
   die sechs neuen Zusicherungen aus 9.3 als Auftrag an den e2e-tester.

### 10.3 Was der frontend-dev berichten muß, statt es zu entscheiden

- welcher Baustein aus Ü-1 genommen wurde, und warum;
- welcher der beiden richtigen Ausgänge aus 6.2 eingetreten ist;
- die **gemessene** Summe der Spaltenbreiten gegen die 44 rem aus 4.3;
- ob A13 (die waagerechte Laufkiste, 6.3) sich so verhält wie gerechnet — es ist die einzige
  Aussage in diesem Papier, die aus der Kastenrechnung stammt und an keiner Stelle gemessen ist.

---

## 11. Offene Fragen

| # | Frage | An wen |
|---|---|---|
| **OF-1** | Der Auftrag nennt das Exportprotokoll als Tabellenvorbild; es ist keine Tabelle (2.1). War es mitgemeint — soll also auch `.auditrow` zur Tabelle werden? | Auftraggeber über den Orchestrator |
| **OF-2** | Fällt mit `.todo-row` die letzte Fläche, die in `lines` und `zen` eine **Zeile** wie eine Karte behandelt (7.2)? Dann verlieren beide Gestaltungen einen ihrer wenigen Griffe, und das ist eine Gestaltungsfrage, keine Layoutfrage. | visual-qa, danach Orchestrator |
| **OF-3** | Die Tag-Fläche ist die erste angeheftete Fläche im Bestand, deren Anker in einem **zweiachsigen** Laufkasten liegt (6.1). Tragen `Select`, `Menu` und `TagInput` denselben Fall schon irgendwo, ohne daß es gemessen wurde? | e2e-tester im Zuge von A14 |
| **OF-4** | 6.3 ist gerechnet und nicht gemessen. Trifft die Rechnung nicht zu, ändert sich die Bauform von „Weitere laden" — und dann ist F-7 teurer, als T-361 es beim Entscheiden wissen konnte. | e2e-tester (A13), zurück an T-361 |
