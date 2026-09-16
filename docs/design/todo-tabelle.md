# Die Todo-Tabelle und die Tag-Fläche — der Mechanismus

Anlass: Auftrag des Auftraggebers vom 2026-09-14, umgesetzt als T-362.

> „baue hier bitte eine Tabelle hin. Wie auf den anderen Seiten. Plus Man muss nicht alle Tags
> sehen, diese können auch ruhig angezeigt werden, wenn man darüber hovert."

**Deckung:** `docs/spec.md` Abschnitt 25 (A-25.1 bis A-25.8), A-21.3 und A-21.4;
`.claude/team/decisions.md` E-112 bis E-117, dazu E-052 (Portale), E-081, E-087, E-099, E-114.
**Bestand:** [fensterfeste-flaechen.md](fensterfeste-flaechen.md) — dasselbe Papier, eine Ebene
höher —, [supertakt-layout.md](supertakt-layout.md), [theme-palettes.md](theme-palettes.md),
[traeger-und-zusage.md](traeger-und-zusage.md), [textabbau-gestalt.md](textabbau-gestalt.md).

**Stand: 2026-09-14, nach T-366 und T-365 berichtigt (T-373), nach dem Gegenlesen aus T-376 und dem
Augenschein aus T-372 nachgezogen (T-379), um S-5, S-6 und S-7 ergänzt (T-383).** Die erste Fassung dieses Papiers
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
| 5.1 | dritte Zeile berichtigt: `aria-modal="true"` trägt den Einwand, nicht `role="dialog"`; die vierte Zeile trennt Halt von Falle | **B-4**, **B-5** |
| 5.3 | Ü-1 ist **aufgelöst**: nicht-modaler `Popover`, kein `HoverCard`, kein `Tooltip`; dazu die Rollenfrage entschieden. Die sechs Anforderungen heißen **TF-1 bis TF-6**, weil B-1 bis B-6 jetzt T-366 gehören | **B-4** |
| 5.4 | `max-width` 20 rem → `min(24rem, calc(100vw - 2rem))`, wie gebaut; dazu der Fokusring, den `.menu` abschaltet und diese Fläche behält | T-365 |
| **5.5 (neu)** | der **Mechanismus** hinter SC 1.4.13: Zeitwerte, Versatz als **Paar**, Eigentum an `Escape`, Beständigkeit | **N-5a**, T-366 Abschnitt 3 |
| 6.2 | der Ausgang ist entschieden und gemessen: die Fläche **schließt**; gemessen wird die Bewegung des Ankers, nicht das Eintreffen des Ereignisses | **B-5** |
| 6.3 | R-a ist keine offene Aussage mehr: 662 px gegen 958,5 px, gemessen; F-7 geht **nicht** zurück | T-365 Punkt 4 |
| 7.2 | `.todo-row` wird **nicht** gestrichen; der Paletteneintrag wird trotzdem angefaßt, mit Begründung; die Wirkungsfrage geht ungekürzt an visual-qa | **B-6**, **N-9** |
| 8.1 | Auswahlzustand gestrichen; Gestalt von `--running`/`--done`, Lautstärke der Frist-Zelle, kein Symbol am Tag-Auslöser, Ladeskelett; Randmarkierung bleibt **Frage an T-361** | **N-3**, **N-4**, **N-5b/c/d/e** |
| 9.3 | A12 mit den gemessenen Paaren belegt; **A14 nach Modalität in A14a/A14b getrennt**, zwei Gegenproben A14c/A14d, A16 neu (kein `aria-modal`) | **B-2**, **B-5**, 5.3 |
| 9.4 | der Vorrat mißt nicht mehr gegen „mehr Tags, als die Zelle zeigt"; dazu das Todo **ohne** Tags als Gegenprobe | **B-8** |
| 10.1–10.3 | die Fundstellenliste ist keine Bruchliste mehr; Ü-1 aus der Reihenfolge genommen; die vier Berichtspunkte mit Ergebnis | **B-6**, T-365 |
| 10.4 (neu) | `TableShell` zieht nach `shared/ui/` — eigener Auftrag; der Ankerwächter bleibt vorerst örtlich | T-365 offene Frage 1 |
| 11 | OF-2, OF-3 und OF-4 beantwortet; OF-1 bleibt offen; **OF-5** (sichtbare Unterscheidung des Erledigt-Kästchens) und **OF-6** (Doppelung im Vorlesefluß) kommen dazu | **N-9**, **N-2**, **N-10**, T-365 |

**Zweite Runde, nach dem Gegenlesen (T-379).** Dieselbe Form, damit der nächste Abgleich auch die
Berichtigungen der Berichtigung nachschlagen kann:

| Abschnitt | Was sich geändert hat | Entscheidung |
|---|---|---|
| 5.3 | **Zwei der vier Gründe für `role="dialog"` sind berichtigt.** Die Entscheidung bleibt; Grund 4 („die Gegenrichtung kostet TF-3") war falsch, Grund 3 schlug einen Strohmann, Grund 1 zählte den ernsthaften Gegenkandidaten nicht auf. Neu am installierten Paket gemessen | T-376, Rollenfrage |
| 8.1 | Der Ladezustand steht jetzt so da, **wie er gebaut ist** — Stapelform ohne `TableShell`; die drei Zustandszeilen tragen ihre wirklichen Fundstellen. Dazu die Entscheidung selbst, samt Verweis auf 9.1 des Schwesterpapiers | **S-2** aus T-376 |
| 8.1 | **N-2 ist entschieden:** keine vierte, erfundene Gestalt — die sichtbare Unterscheidung ist der **Wortkopf über der Spalte**, und sie ist gebaut, gedeckt und klebt | **N-2**, T-372 |
| 9.3 | **A17 neu** — die Rücknahme, an der die Antwort auf N-2 hängt, bekommt einen Wächter; sie ist dieselbe Zusage wie **TT-36** des Schwesterpapiers, an eine zweite Adresse gerichtet. Aus acht Zusicherungen werden neun | **N-2** |
| **10.5 (neu)** | Ü-2 steht als **Auftrag** da: Datei, Zeile, heutige Form, haltbare Form, und was geschieht, wenn jemand die Blattreihenfolge ändert | T-373 Ü-2 |
| 11 | **OF-5 beantwortet** (8.1). OF-1 und OF-6 bleiben, wie sie standen | **N-2** |

**Dritte Runde, der Nachtrag (T-383).** T-379 konnte **S-5, S-6 und S-7** nicht ausführen: Der
Bericht, der sie benennt, lag nicht auf der Platte — er ist beim Wechsel des Arbeitsbaums nach
`main` verlorengegangen, solange er unversioniert war. Gemeldet statt geraten war dort richtig; ein
Papier nach einer erfundenen Auflage zu ändern ist derselbe Fehler wie eine Auflage ohne Deckung zu
bauen. Der Bericht liegt wieder vor, seine Befunde stehen zeichengleich zur ersten Fassung, und hier
stehen ihre Umsetzungen:

| Abschnitt | Was sich geändert hat | Entscheidung |
|---|---|---|
| 4.3a | Die dritte Spalte heißt nicht mehr „gemessen breitester Inhalt", sondern **„Platzbedarf der Zelle (Inhalt + Polsterung)"**, und jede Zeile trägt die Einheit. Sie ließ sich vorher nur mit **zwei** Einheiten lesen: fünf Zeilen ohne Polsterung, zwei mit. Dazu die **engste Stelle** des Budgets, gerechnet statt vermutet | **S-7** |
| 4.3a | Die 43,5 rem stehen jetzt aus **zwei** Messungen — T-365 und der Augenschein, zeichengleich | T-372 |
| 5.3 | Der Abgleich mit dem Gegenleser steht am Kasten: **welche zwei Gründe er meint**, welchen dieses Papier selbst gefunden hat. Grund 4 nennt jetzt, **was die Gegenrichtung wirklich kostet**, und die Zuspitzung an den Orchestrator ist ausdrücklich zurückgezogen | **S-5** |
| 9.4 | „mindestens einem Tag" → **„genau einem Tag"**. Sonst hakt **ein** Datensatz beide Zeilen des Vorrats ab, und ungemessen bleibt genau der Regelfall, dessentwegen der Punkt berichtigt wurde | **S-6** |
| 7.2, 11 | Der Augenschein ist **freigegeben**, ohne blockierenden Bildbefund; OF-2 ist damit auch in seiner zweiten Hälfte beantwortet, und die Auflage aus N-9 ist eingelöst | T-372 |
| 10.5 | Der Ü-2-Auftrag steht ohne einen Bericht daneben lesbar: Abnahme dazu, und der Satz, daß dieser Abschnitt vollständig ist | T-373 Ü-2 |

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

> **Die Einheit der dritten Spalte ist der Platzbedarf der *ganzen Zelle*: Inhalt plus Polsterung.**
> Die Polsterung sind **2 × 12 px** in der Vorgabedichte — `.table tbody td { padding: 0 var(--row-padding-x) }`
> (`components.css:798`) mit `--row-padding-x: var(--space-3)` (`tokens.css:321`, `:333`); die
> Kopfzelle trägt dieselbe seitliche Polsterung (`components.css:759`). Wo T-365 den reinen Inhalt
> gemessen hat, steht die Polsterung als Summand daneben — **gerechnet, nicht nachgemessen**.

| Spalte | `<col>` | Platzbedarf der Zelle (Inhalt + Polsterung) | Verhalten |
|---|---|---|---|
| Erledigt | 9 rem / 144 px | Kästchen 24 + Abstand 8 + `DoneFlag` „Erledigt aufgehoben" 133,7 **+ 24 = 189,7** | Etikett bricht um, Zeilenhöhe bleibt 40 px |
| Call | 4,5 rem / 72 px | sechs dicktengleiche Ziffern 46,8 **+ 24 = 70,8** | paßt, **1,2 px Luft**; nie gekürzt |
| **Titel** | **keine** | — | Umbruch, 4.4 |
| Status | 7 rem / 112 px | „In Bearbeitung" 91,7 **+ 24 = 115,7** | Umbruch, kein Deckel |
| Frist | 7,5 rem / 120 px | „Heute fällig 31.12.2026" 141,7 **+ 24 = 165,7** | bricht um |
| Tags | 3,5 rem / 56 px | Kopfzelle „TAGS" **53,3 — hier schon einschließlich Polsterung gemessen** (Wort rund 29) | paßt, 2,7 px Luft; Auslöser ≥ 24 × 24 |
| Buchungen | 6,5 rem / 104 px | Streifen mit vier Zuständen 140,1 **+ 24 = 164,1** | bricht um, nie gekürzt |
| Aktionen | 5,5 rem / 88 px | 2 × 28 + Abstand 4 **+ 24 = 84** | paßt, 4 px Luft |

**Warum die Einheit jetzt dasteht, und was ohne sie geschah** (S-7 aus dem Gegenlesen): Die Spalte
hieß „gemessen breitester Inhalt" und ließ sich **nur mit zwei Einheiten** lesen — fünf Zeilen
nannten den reinen Inhalt, zwei nannten Inhalt **und** Polsterung. Welche Zeile welche ist, ist
nicht Auslegung, sondern Rechnung; beide Male geht die andere Lesart nicht auf:

- **Call, 46,8 px, ist reiner Inhalt.** 46,8 ÷ 6 Ziffern = 7,8 px, und das ist genau 0,6 × 13 px —
  die Dickte einer dicktengleichen Schrift in `--text-sm` (`tokens.css:291`; die Zelle trägt
  `.mono`). Läse man 46,8 als Inhalt + Polsterung, blieben 3,8 px je Ziffer, und die gibt es bei
  13 px nicht.
- **Tags, 53,3 px, ist Inhalt *plus* Polsterung.** „TAGS" steht in der Kopfzelle in Versalien bei
  `--text-2xs` = 11 px mit Sperrung, also rund 29 px. Wäre 53,3 der reine Inhalt, stünden
  53,3 + 24 = 77,3 px in einer 56-px-Spalte — und weil `.table thead th` `white-space: nowrap`
  trägt (`components.css:768`), liefe der Kopf **über**, statt umzubrechen. T-365 hat gemessen, daß
  nichts überläuft.
- **Aktionen, 84 px, ebenfalls** — 2 × 28 (`--control-height-sm`, `tokens.css:411`: Symbolknopf und
  `.table__row-menu`) plus 4 px Abstand sind 60; auf 84 kommt die Zeile nur mit der Polsterung.

**Die Summe bleibt davon unberührt:** Sie kommt aus den `<col>`-Breiten und nicht aus dieser Spalte.
Der Befund ist die Einheit — wer die Tabelle später gegen einen geänderten Kopf, eine geänderte
Schrift oder eine geänderte Dichte hält, rechnet sonst fünf Zeilen mit der falschen.

> **Summe der sieben festen Spalten: 696 px = 43,5 rem** gegen das Budget von 44 rem aus 4.3.
> **Titelspalte 17,8 rem** (284,5 px) bei 1280 × 820 und **16,4 rem** (262,5 px) bei 960 und 1024 —
> der Boden von 16 rem hält überall. Bei 1280 × 820 ist `scrollWidth === clientWidth`.

**Die Zahl steht aus zwei Messungen, nicht aus einer.** Der Augenschein (T-372) hat die
`<col>`-Breiten unabhängig im Browser gelesen — 144 + 72 + 112 + 120 + 56 + 104 + 88 = 696 px,
Titelspalte 284,5 px, 1030/1030 bei 1280 × 820 — und kommt zeichengleich auf 43,5 rem. Er ist
**freigegeben und meldet keinen blockierenden Bildbefund**; die Grenze aus 9.1 (ein Quelltextlauf
sichert die Bauart zu, nicht die Wirkung) ist damit an dieser Stelle von der richtigen Seite
eingelöst.

#### Die engste Stelle des Budgets — und sie ist nicht die, die man vermutet

Vier der sieben festen Spalten brechen um; bei den drei übrigen ist die Luft die ganze Reserve:

| Spalte | Platzbedarf | `<col>` | Luft |
|---|---|---|---|
| **Call** | 70,8 px | 72 px | **1,2 px** |
| Tags | 53,3 px | 56 px | 2,7 px |
| Aktionen | 84 px | 88 px | 4 px |

Der Gegenleser hat die **Tags**-Spalte als die engste benannt; gerechnet ist es in der Vorgabeform
die **Call**-Spalte, und der Unterschied ist nicht akademisch: Eine sechsstellige Call-Nummer in
dicktengleicher Schrift hat **keine Umbruchstelle**. Wird sie zu breit, läuft sie über ihre Zelle
hinaus, statt umzubrechen — und gekürzt wird sie nie (A-10.9, `TodoTable.tsx:235-237`).

Zwei Richtungen, in die sich diese Reserve bewegt, und sie sind verschieden:

- **Mit der Dichte wächst sie.** In „kompakt" fällt `--row-padding-x` auf `--space-2` = 8 px
  (`tokens.css:430`), die `<col>`-Breiten bleiben (4.2, 7.1). Jede Zelle bekommt also 8 px **mehr**
  Luft; die Dichte kann das Budget nicht sprengen.
- **Mit der Schrift schrumpft sie.** `clear` hebt `--text-2xs` von 11 auf 12 px (`tokens.css:658`).
  Das trifft die **Kopfzellen**: „TAGS" wächst um rund ein Elftel und verbraucht damit fast die
  ganzen 2,7 px der Tags-Spalte — dort ist der Gegenleser im Ergebnis näher dran als in der
  Vorgabeform. `--text-sm`, an dem die Call-Nummer hängt, rührt `clear` nicht an.

**Daraus die Auflage, und sie ist billig:** Wer `--text-sm`, `--text-2xs`, die dicktengleiche
Schrift oder einen Spaltenkopf anfaßt, mißt diese drei Spalten nach. Gemessen sind drei Gestaltungen
(`clear`, `zen`, `kompakt`), nicht neunzehn — und in genau diesen drei Spalten ist der Abstand
zwischen „paßt" und „läuft über" kleiner als ein Zeichen.

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
| `trapFocus` | Ein **Halt** ist etwas anderes als eine **Falle**. Die Tag-Fläche nimmt den Fokus an (A-25.9), aber ein Tabulator führt aus ihr heraus. Eine Fokusfalle für eine Anzeige von drei Tags ist eine Sackgasse. |
| `aria-modal="true"` | **Hier hängt der Einwand, und zwar an dieser Angabe allein** — nicht am Rollennamen. Siehe die Berichtigung darunter. |
| Fokusrückholung und `MutationObserver`, die den Fokus in der Fläche **halten** | Die Rückgabe des Fokus beim Schließen ist richtig und ist gebaut (B-5). Falsch ist das Festhalten davor: Maschinerie für einen Fall, den es hier nicht gibt. |

Und sie bringt **nicht** mit, was die Fläche braucht: eine **Verankerung am Auslöser**. `.scrim` ist
`position: fixed; inset: 0` — eine Fläche über dem ganzen Fenster, kein Kasten neben einer Zeile.

> **Berichtigung nach B-4 (2026-09-14).** Die dritte Zeile nannte bis dahin `aria-modal="true"`
> **und** `role="dialog"` in einem Atemzug und machte damit den Rollennamen zum Einwand. Das war zu
> grob, und es hätte die gebaute Fläche zu Unrecht rot gemacht: Sie trägt `role="dialog"` und trägt
> **kein** `aria-modal`. Die beiden Angaben sagen Verschiedenes. `role="dialog"` benennt einen
> Kasten, den man betreten und verlassen kann; `aria-modal="true"` sagt einer Vorlesehilfe, daß
> außerhalb dieses Kastens **nichts mehr zu lesen** ist — das ist die Behauptung, eine Entscheidung
> zu verlangen, und das ist die, die hier falsch wäre. Warum der Rollenname trotzdem bleibt und was
> das kostet, steht in 5.3.

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

### 5.3 Welcher Baustein von Ark UI — entschieden, nicht delegiert

Die Fläche muß sechs Dinge können. Drei davon sind Bauform, drei sind WCAG 2.2 SC 1.4.13
(„Inhalt bei Zeigerkontakt oder Fokus"), und das ist keine Geschmacksfrage:

> **Die sechs hießen bis zum 2026-09-14 B-1 bis B-6 und heißen jetzt TF-1 bis TF-6.** Der Grund ist
> kein Geschmack: T-366 hat seine acht blockierenden Befunde ebenfalls B-1 bis B-8 genannt, und
> dieses Papier zitiert sie ab jetzt an zwei Dutzend Stellen. Zwei Mengen mit demselben
> Namensschema im selben Satz sind die billigste Art, eine Entscheidung an der falschen Stelle
> nachzuschlagen.

| # | Anforderung | Warum |
|---|---|---|
| TF-1 | Portal am Dokumentkörper, angeheftet an den Auslöser | 5.2 |
| TF-2 | geht bei Zeigerkontakt auf | der Auftrag |
| TF-3 | ist **ohne Zeigegerät** erreichbar, und die Fläche **nimmt den Fokus an** | SC 2.1.1, und seit dem 2026-09-14 wörtlich A-25.9 |
| TF-4 | **überfahrbar**: der Zeiger darf vom Auslöser auf die Fläche wandern, ohne daß sie zugeht | SC 1.4.13 — Mechanismus in 5.5 |
| TF-5 | **abweisbar**: `Escape` schließt, ohne die Seite zu verlassen | SC 1.4.13 — Mechanismus in 5.5 |
| TF-6 | **beständig**: schließt nicht von selbst nach einer Frist | SC 1.4.13 — Mechanismus in 5.5 |

**Ü-1 ist aufgelöst (B-4).** Die erste Fassung dieses Papiers hat die Wahl an den frontend-dev
delegiert, weil in jener Umgebung kein `node_modules` stand. T-366 hat die Delegation zu Recht
zurückgewiesen — sie war keine Bauentscheidung, sondern die Entscheidung, ob TF-3 überhaupt
einlösbar ist —, und T-365 hat **gemessen**, was zu raten war:

| Kandidat | Befund | Quelle |
|---|---|---|
| `@ark-ui/react/hover-card` | **liegt vor** (5.39.0, darunter `@zag-js/hover-card@1.43.3`) und ist trotzdem **unbrauchbar**: `hover-card.connect.js` setzt am Inhalt `tabIndex: -1` und bietet keinen Weg hinein; `hover-card.machine.js` schließt bei `TRIGGER_BLUR` (`guard: not("isPointer")`). Ein Fokus **in** der Fläche ist damit genau der Zustand, den die Maschine als „verlassen" liest. | T-365, am installierten Paket gelesen |
| `Tooltip` mit `interactive` | derselbe Fall, zusätzlich das falsche Muster: ein Tooltip wird über `aria-describedby` angebunden, nicht über `aria-controls`, und `aria-expanded` am Auslöser ist dort ein Fremdkörper. | T-366 B-4 |
| **`@ark-ui/react/popover`, `modal={false}`** | **gewählt und gebaut.** Fokussierbarer Inhalt, `aria-expanded` und `aria-controls` am Auslöser, `Escape` und Klick nach draußen über `trackDismissableElement`, Tabulatorausgang über `proxyTabFocus`, Rückgabe des Fokus über `restoreFocus`. | `TodoTagsCell.tsx:218-302` |

Der Popover bringt **zwei** Dinge nicht mit, und beide stehen deshalb in der Datei selbst: das
Aufgehen beim Überfahren (TF-2, zwei Zeitgeber — 5.5) und das **Setzen** des Fokus, weil der
Baustein den Weg nicht kennt, über den aufgegangen wurde. Das ist kein Mangel, sondern die richtige
Arbeitsteilung: Wer mit dem Zeiger über eine Spalte fährt, hat keine Fläche verlangt und bekommt
deshalb auch nicht den Fokus hineingesetzt.

**Was ausdrücklich nicht in Frage kam und nicht in Frage kommt:** eine dritte Bibliothek, und ein
handgeschriebener Positionierer erst recht nicht. Genau den hat T-059 abgeschafft, samt der Klassen
`.menu-anchor`, `.menu--popover`, `.menu--start`, `.menu--end` und `.menu-layer`
(`components.css:2336-2341`).

#### `role="dialog"` an einer Auskunftsfläche — die Abweichung, die T-365 selbst benennt

T-365 führt sie als R-1: Der Inhalt des Popovers trägt `role="dialog"`, und 5.1 hatte den Rollennamen
als Einwand gegen `DialogSurface` aufgeführt. **Entschieden: die Rolle bleibt.**

> **Berichtigung nach T-376 (2026-09-14), Abgleich nachgetragen im Nachtrag T-383.** Die Entscheidung
> ist gegengelesen und **nicht** angegriffen worden — **zwei ihrer vier Gründe schon: Grund 3 und
> Grund 4.** Der Grund, warum das nicht bloß Kosmetik ist: Beim nächsten Umbau liest jemand die
> **Begründung**, nicht die Entscheidung. Eine richtige Entscheidung mit halbfalscher Begründung
> fällt beim ersten Gegenwind in die falsche Richtung um.
>
> | | stand da | Befund | gefunden von |
> |---|---|---|---|
> | Grund 4 | „Angenommen wird das, weil die Gegenrichtung **TF-3 kostet** — und TF-3 steht wörtlich in A-25.9." | **Falsch, und es war der Satz, der dem Orchestrator vorgelegt wurde.** TF-3 hängt am **Baustein**, nicht am Rollennamen — gemessen unten. Ein anderer Rollenname nähme der Fläche den Tastaturfokus nicht, und A-25.9 nennt keinen Rollennamen; sie würde also von einer Gegenentscheidung gar nicht berührt. **Was die Gegenrichtung statt dessen kostet, steht jetzt in Grund 4 selbst.** | Gegenleser **und** dieses Papier, unabhängig und gleichlautend |
> | Grund 3 | „Nähme man die Rolle weg, zeigte `aria-controls` auf ein `div` **ohne Rolle**." | **Strohmann.** Die Gegenrichtung war nie „keine Rolle", sondern „eine andere Rolle". Der Kern des Satzes stimmt — ein `div` ohne Rolle trägt keinen zugänglichen Namen —, er widerlegt nur den falschen Gegner. | Gegenleser **und** dieses Papier, unabhängig und gleichlautend |
> | Grund 1 | zählte `tooltip`, `menu`, `listbox` und `region` auf | **Unvollständig.** `group` fehlte, und `group` ist der ernsthafte Gegenkandidat: Er trägt einen zugänglichen Namen, er hat einen Anfang und ein Ende, und er ist keine Landmarke. Er muß an der Sache widerlegt werden, nicht durch Auslassung. | dieses Papier; der Gegenleser führt **denselben** Punkt unter Grund 3 mit („die naheliegendste Gegenkandidatin gar nicht zu nennen") |
>
> **Der Abgleich geht damit auf, und das ist nicht Formsache.** Hätten beide Seiten verschiedene
> Gründe gemeint, trügen **drei** der vier nicht, und die Entscheidung hinge an einem einzigen. Sie
> meinen dieselben zwei; der dritte Punkt ist derselbe Punkt an einer anderen Nummer, weil der
> Gegenkandidat `group` bei ihm unter „falscher Gegner" und hier unter „fehlender Gegner" steht.
> Getragen wird die Entscheidung weiterhin von Grund 2 allein, wenn alle anderen fielen.
>
> **Zurückgezogen ist mit Grund 4 auch die Zuspitzung, mit der er dem Orchestrator vorgelegt wurde:**
> „Wer sie umdrehen will, **dreht A-25.9 mit um**" (Bericht zu T-373, Annahme 1 und OF 1). Der Satz
> ist falsch. Wer die Rolle umdrehen will, braucht eine Entscheidung **dieses** Papiers und keine
> Änderung der Spezifikation — und er bekommt sie, wenn er Grund 1 bis 3 an der Sache widerlegt.

Vier Gründe also weiterhin, zwei davon neu, und der vierte ist eine Auflage, nicht eine Begründung:

1. **ARIA hat für diese Fläche keine eigene Rolle, und der ernsthafte Gegenkandidat heißt `group`.**
   Sie ist kein `tooltip` (der nimmt den Fokus nicht an — genau daran ist der Kandidat oben
   gescheitert), kein `menu` (nichts darin ist eine Handlung), kein `listbox` (nichts darin ist
   wählbar). `region` wäre ein **Orientierungspunkt**: Eine Tabelle mit hundert Zeilen bekäme
   hundert benannte Landmarken in ihr Verzeichnis. `group` bliebe übrig und wäre nicht falsch — er
   trägt einen Namen und eine Grenze. Er ist nur **schwächer**: Er sagt nichts darüber, daß hier
   eine Schicht **aufgegangen** ist, und genau das ist an einer Fläche, die auf Betätigung
   erscheint und auf `Escape` verschwindet, die Auskunft, auf die es ankommt. Der nicht-modale
   Dialog ist das APG-Muster für genau diesen Fall.
2. **Was ein Dialog behauptet, behauptet er über `aria-modal`, nicht über seinen Namen.** Ohne
   `aria-modal`, ohne Abdunklung und ohne Fokusfalle hört der Benutzer „Dialog, 11 Tags" und kann
   die Fläche mit `Tabulator` oder `Escape` jederzeit verlassen. Das ist eine Beschreibung dessen,
   was sie tut, keine Aufforderung. Die Berichtigung in 5.1 trennt beides. **Dieser Grund ist
   unverändert und trägt die Entscheidung allein, wenn alle anderen fielen.**
3. **Rollenname und `aria-haspopup` sind ein Paar, und das Paar setzt der Baustein.** Gemessen am
   installierten Stand (`@zag-js/popover@1.43.3`, `dist/popover.connect.js`):

   | Zeile | was gesetzt wird | an wem |
   |---|---|---|
   | `:107` | `aria-haspopup: "dialog"` | Auslöser |
   | `:110` | `aria-controls` auf die Kennung des Inhalts | Auslöser |
   | `:147` | `tabIndex: -1` | Inhalt |
   | `:148` | `role: "dialog"` | Inhalt |

   Wer nur `:148` überschreibt, hinterläßt einen Auslöser, der einen **Dialog** ankündigt, und
   einen Inhalt, der eine **Gruppe** ist — zwei Aussagen über dieselbe Fläche, und die falsche ist
   die, die zuerst vorgelesen wird. Wer beide überschreibt, schreibt am Baustein vorbei; genau das
   hat T-059 abgeschafft. Der zugängliche Name der Fläche (`plural(count, "Tag", "Tags")` — kein
   neues Wort, A-25.7) hängt daran mit: Ein `div` ohne Rolle trägt kein `aria-label`.
4. **Der Preis steht dabei, und daraus folgt die Auflage.** Eine Vorlesehilfe sagt „Dialog" über
   eine Fläche, die nichts entscheidet; wer das Wort hört, kann eine Modalität erwarten, die es
   nicht gibt. **Das ist der ganze Preis, und er wird angenommen** — nicht, weil die Gegenrichtung
   etwas kostete, das in der Spezifikation steht, sondern weil der Gegenkandidat schlechter ist
   (Grund 1) und der Umbau am Baustein vorbeiginge (Grund 3).

   **Und weil beide Seiten mit Preis dastehen sollen, hier der der Gegenrichtung — er ist ein
   anderer, als bis zum 2026-09-14 hier stand:**

   | Gegenrichtung | kostet |
   |---|---|
   | `role="group"` statt `dialog` | die hörbare Auskunft, daß hier eine Schicht **aufgegangen** ist — und die Übereinstimmung mit dem `aria-haspopup="dialog"`, das derselbe Baustein am Auslöser setzt (Grund 3) |
   | **gar keine** Rolle | die hörbare Grenze und mit ihr den zugänglichen Namen: Ein `div` ohne Rolle trägt kein `aria-label` |
   | beide | **TF-3 nicht.** Der Tastaturfokus hängt am `tabIndex: -1` des Bausteins und am Fokusruf der Zelle, nicht am Rollennamen — der Absatz unter dieser Liste. |

   **Die Auflage:** `aria-modal` wird an dieser Fläche **nie** gesetzt, und es kommt nie ein
   `.scrim` dazu. Beides zusammen macht den Einwand aus 5.1 wahr, und zwar still. Der e2e-tester
   mißt es als Gegenprobe zu A16 (9.3).

**Was TF-3 wirklich trägt, damit es niemand ein zweites Mal am Rollennamen sucht:** `tabIndex: -1`
am Inhalt (`popover.connect.js:147`) macht die Fläche programmatisch fokussierbar, und
`TodoTagsCell.tsx:167-176` setzt den Fokus — aber nur, wenn die Fläche **verlangt** wurde
(`mode === "intent"`). Beides ist unabhängig vom Rollennamen. A-25.9 verlangt, daß „die Fläche, die
sie zeigt, den Tastaturfokus annimmt"; eingelöst wird dieser Satz an diesen beiden Stellen und an
keiner dritten.

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
  max-width: min(24rem, calc(100vw - 2rem));
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

Zu fünf Zeilen je ein Satz, weil sie sonst beim nächsten Aufräumen fallen:

- **`max-width: min(24rem, calc(100vw - 2rem))`.** Die erste Fassung schrieb `20rem`; gebaut sind
  24 rem, und das ist die bessere Zahl. Eine Marke in der Fläche trägt den **vollen** Ordnerpfad
  (`size="md"`, A-4.4) — „Kunden / Nord / Werk Ost" ist breiter als ein Tag-Name, und bei 20 rem
  bräche eine einzelne Marke um, statt daß zwei nebeneinander stehen. Der zweite Teil des `min()`
  ist kein Schmuck: Er hält die Fläche auch dort im Fenster, wo der Positionierer allein nicht mehr
  umklappen kann, nämlich unter 26 rem Fensterbreite.
- **Kein `:focus-visible { outline: none }`.** `.menu` hat eine solche Zeile
  (`components.css:2402-2404`) — die Tag-Fläche bekommt sie **nicht**. Ein Menü zeigt den Fokus an
  seinem hervorgehobenen Eintrag; diese Fläche hat keine Einträge, und der Fokus steht auf ihr
  selbst. Ohne Ring wäre nach `Eingabe` nicht zu sehen, wo der Fokus hingegangen ist — und daß er
  hineingeht, ist seit dem 2026-09-14 wörtlich A-25.9.
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

### 5.5 SC 1.4.13 — der Mechanismus, nicht die Zusage

**Der Befund, der diesen Abschnitt ausgelöst hat** (T-366 Abschnitt 3, N-5a): „überfahrbar" stand in
beiden Papieren als Zusage und in **keinem** als Mechanismus — weder Nachlauf noch Versatz, auf
keiner der beiden Seiten. Eine Zusage ohne Mechanismus ist bei diesem Erfolgskriterium besonders
teuer, weil ihr Bruch **nichts** verändert, was man sieht: Die Fläche geht auf wie vorher, sie ist
nur nicht mehr erreichbar. Hier stehen deshalb die Zahlen, und darunter die Regel, die sie
zusammenhält.

#### Die vier Zahlen

| Größe | Wert | Herkunft |
|---|---|---|
| Absichtsverzögerung (Zeiger hinein) | **220 ms** | T-365, gewählt; ausgerichtet an `InfoHint` (`openDelay={150}`) und bewußt ruhiger |
| Nachlauf (Zeiger hinaus) | **220 ms** | dito, gegen `InfoHint` (`closeDelay={100}`) |
| Versatz Auslöser ↔ Fläche | **`gutter: 4`** | T-365; `InfoHint` steht bei 6 (`InfoHint.tsx:7`) |
| Abstand zum Fensterrand | **`overflowPadding: 8`**, `placement: "bottom-end"` mit Umklappen | T-365 |

Die Absichtsverzögerung ist nicht Bequemlichkeit, sondern Notwendigkeit dieser Ansicht: Hier steht
eine **ganze Spalte** voller Auslöser übereinander. Ein Zeiger, der die Spalte nur überquert, darf
keine Spur aus Flächen hinterlassen. Genau deshalb ist sie höher als bei `InfoHint`, wo ein
einzelnes Zeichen im Text steht.

#### „überfahrbar" — der Mechanismus ist ein **Paar**, nicht eine Zahl

Damit der Zeiger vom Auslöser in die Fläche kommt, müssen **beide** Hälften stimmen, und keine
trägt allein:

1. **Der Nachlauf schließt nicht sofort, und die Fläche selbst hört mit.** `pointerleave` am
   Auslöser startet einen Zeitgeber von 220 ms; `pointerenter` **an der Fläche** löscht ihn
   (`TodoTagsCell.tsx:272-284` — die beiden Ereignisse hängen an **Auslöser und Inhalt**). Ohne das
   zweite Paar wäre der Nachlauf bloß eine Gnadenfrist: Die Fläche ginge zu, kaum daß der Zeiger sie
   erreicht hat, und zwar 220 ms **nachdem** er angekommen ist. Das ist der Fehler, der sich nicht
   zeigt, solange man nur den Auslöser betrachtet.
2. **Der Versatz ist die Strecke, die in dieser Zeit zurückzulegen ist.** 4 px sind der Weg, den
   auch ein langsam geführter Zeiger weit vor Ablauf der 220 ms schafft. Null wäre trotzdem falsch:
   Eine Fläche, die ihren Auslöser berührt, verdeckt ihn an dieser Kante — das ist SC 2.4.11, und
   TT-17 im Schwesterpapier mißt es.

> **Die Regel, und sie ist der eigentliche Inhalt dieses Abschnitts:** Versatz und Nachlauf sind ein
> **Paar**. Wer den Versatz vergrößert, verlängert den Nachlauf; wer den Nachlauf kürzt, verkleinert
> den Versatz. Eine der beiden Zahlen allein zu ändern ist die Art Änderung, die SC 1.4.13 still
> bricht. Wer eine von beiden anfaßt, mißt TT-13 danach neu.

Gemessen ist das Paar bereits: T-365 hat den Zeiger in **zehn Schritten** über die Lücke geführt,
die Fläche blieb offen (TT-13), und ihr Kasten überschneidet den Auslöser nicht (TT-16/TT-17).

#### „abweisbar" — wem `Escape` gehört

`Escape` gehört der **obersten** abweisbaren Fläche. Im gebauten Stand trägt das
`trackDismissableElement` von Ark UI; es führt einen Stapel und läßt nur die oberste Schicht
antworten. **Heute reicht das**, denn die Todo-Tabelle steht in keinem Dialog — es gibt also keine
zweite Schicht, die mit abgeräumt werden könnte.

> **Auflage für den Tag, an dem sich das ändert** (Tag-Fläche in einem Dialog, etwa in einer
> künftigen Detail- oder Massenansicht): Dann gehört an den Inhalt dieselbe Bremse, die das Menü
> seit T-059 trägt — `event.stopPropagation()` für `Escape` **und** `Tabulator`
> (`shared/ui/Menu.tsx:69-78`, samt der Begründung dort: Der Inhalt hängt im Portal am
> Dokumentkörper, steht im React-Baum aber weiter unter seinem Auslöser und damit unter dem Dialog).
> Ohne sie schlösse ein `Escape` beides auf einmal, und der Benutzer verlöre den Dialog, weil er
> eine Tag-Liste wegklicken wollte.

#### „beständig" — kein Zeitgeber schließt eine **offene** Fläche

Die zwei Zeitgeber aus der Tabelle oben öffnen und schließen **auf Zeigerbewegung**; keiner von
beiden läuft, während die Fläche steht. Der zweite ist zusätzlich stillgelegt, sobald sie mit
Absicht geöffnet wurde (`mode === "intent"`, `TodoTagsCell.tsx:148-159`): Wer sie verlangt hat,
nimmt sie selbst wieder weg. Gemessen: 6 s und 30 s ohne Eingabe, die Fläche steht (TT-14).

**Die Unterscheidung Zeiger/Absicht ist damit nicht nur eine Fokusfrage, sondern die Bedingung von
TF-6.** Wer sie beim Aufräumen einebnet — „ein Weg hinein reicht doch" —, nimmt entweder dem Zeiger
das Aufgehen oder der Tastatur die Beständigkeit.

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

### 6.2 Der Ausgang ist entschieden: die Fläche **schließt**

> **Läuft der Bereich unter der Fläche, schließt sie. Sie bleibt nicht stehen, sie wandert nicht
> mit, und sie bleibt nicht offen, wenn ihr Anker nicht mehr dort ist, wo er beim Aufgehen war.
> Kam sie über die Tastatur, steht der Fokus danach auf dem Auslöser.**

Die erste Fassung dieses Papiers ließ **zwei** Ausgänge zu — mitwandern oder schließen — und reichte
die Wahl an die Messung weiter. **B-5 hat entschieden, und T-365 hat gebaut und gemessen** (der
Zusatz mit dem Fokus stammt aus derselben Entscheidung). Ausgeschrieben, je Achse:

| Vorgang | richtig | falsch |
|---|---|---|
| Laufbereich senkrecht rollen | Fläche schließt (`count() === 0`) | Fläche bleibt an ihrem Bildschirmort stehen — oder bleibt offen und wandert mit |
| Zeile rollt unter den klebenden Kopf | Fläche schließt | Fläche steht sichtbar über dem Kopf, ihr Anker ist weg |
| Laufbereich waagerecht rollen | Fläche schließt | Fläche bleibt stehen, während ihre Spalte wegläuft |
| **Lauf *in* der Fläche** (40 Marken, `Bild ab`) | Fläche bleibt offen | Fläche schließt sich beim Lesen selbst |
| Fenstergröße ändern | Fläche klappt am Rand um oder schließt | Fläche liegt teilweise außerhalb des Fensters |

**Warum nicht „mitwandern", obwohl es technisch ginge.** Das Schwesterpapier hatte in seiner ersten
Fassung den Gegensatz zugesagt und ihn aus SC 1.4.13 „beständig" abgeleitet. Die Norm trägt das
nicht: „beständig" verbietet den **Zeitgeber**, nicht das Verschwinden mit dem Bezugspunkt. Und
sachlich spricht die Zeile 2 der Tabelle gegen das Mitwandern — eine Fläche, die über dem klebenden
Kopf steht und die Tags einer Zeile zeigt, die nicht mehr im Bild ist, ist keine Auskunft, sondern
eine falsche.

#### Der Nebenbefund, der ins Papier gehört: **gemessen wird die Bewegung des Ankers**

T-365 hat beim Bauen eine Stelle gefunden, die das Papier nicht vorhergesehen hatte, und sie ist
allgemeiner als dieser eine Fall:

> **Ein Klick auf einen Auslöser, der nur halb im Bild steht, rollt ihn zuerst hinein** — und dieses
> Bildlaufereignis trifft erst im **nächsten Bild** ein, also *nachdem* die Fläche aufgegangen ist.
> Ein Wächter, der auf das bloße **Ereignis** hört, schließt die Fläche in demselben Augenblick, in
> dem sie aufgeht. In der Sondierung von T-365 war das reproduzierbar rot.

Die Abhilfe ist eine Zeile und eine Regel: Beim Aufgehen wird der Kasten des Ankers gemerkt; ein
Bildlaufereignis schließt die Fläche nur, wenn der Anker sich seither **tatsächlich bewegt hat**
(`TodoTagsCell.tsx:197-211`, Schwelle 1 px auf beiden Achsen). Ein Nachzüglerereignis bewegt ihn
nicht mehr und wird damit still verworfen. Die zweite Ausnahme daneben ist der innere Lauf: Ein
Ereignis, dessen Ziel **in** der Fläche liegt, zählt gar nicht erst.

**Die Lehre, über diesen Fall hinaus:** Ein Ereignis ist kein Zustand. Wer eine Fläche an ein
Ereignis hängt, hängt sie an die Reihenfolge zweier Bilder; wer sie an eine gemessene Größe hängt,
nicht. Dasselbe gilt für jede künftige angeheftete Fläche in einem Laufbereich.

### 6.3 Die Regel der waagerechten Laufkiste — und warum „Weitere laden" davon betroffen ist

Eine Folge des `.table-wrap`-Baus, die keiner der drei Vorbilder heute zeigt, weil keines von ihnen
einen Fuß hat. Sie war in der ersten Fassung **gerechnet und nicht gemessen** und stand deshalb
zugleich als Meßauftrag A13:

> Ein **Blockelement** im waagerecht laufenden Kasten ist so breit wie dessen **Inhaltsbreite**
> (662 px bei 960), nicht so breit wie dessen **Laufbreite** (960 px). Es wandert beim Rollen nach
> rechts aus dem Bild. Ein **Tabellenteil** dagegen (`tfoot`, `caption`, `td[colspan]`) ist so breit
> wie die Tabelle und bleibt über ihrer ganzen Breite stehen.

**Gemessen von T-365, und die Rechnung trifft zu.** Bei 960 × 640, nach dem Rollen um 288 px ans
rechte Ende:

| | Breite | rechter Rand vorher → nachher |
|---|---|---|
| Blockelement im Laufbereich | **662 px** (= Inhaltsbreite) | 926 → **638**, also aus dem Bild |
| `<tfoot><td colspan="8">` | **958,5 px** (= Tabellenbreite) | 1224 → 936, über der ganzen Tabelle |

Dasselbe bei 1024 (726 gegen 958,5) und bei 831 (789 gegen 958,5); bei 1280 und 1440 gibt es keinen
Lauf, und beide sind gleich breit. **Damit ist der Vorbehalt erledigt, den der Bericht zu T-362 als
R-a geführt hat: F-7 wird nicht teurer und geht nicht an T-361 zurück** — „Weitere laden" gehört in
den `<tfoot>`, und das ist gebaut. Die Meßvorschrift A13 in 9.3 bleibt trotzdem stehen; sie bewacht
ab jetzt nicht mehr eine Rechnung, sondern den Tag, an dem jemand den Fuß wieder zu einem
Blockelement macht.

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

### 7.2 Neunzehn Gestaltungen — und der Paletteneintrag, der **trotzdem** fällt

Die Tabelle benutzt ausschließlich Token; es steht in diesem Papier kein einziger Farbwert. Die
Buchungstabelle ist der Beleg, daß das trägt: Sie liegt seit T-337 in allen neunzehn Gestaltungen
und beiden Modi im Bild und ist dort gemessen.

**`.todo-row` wird nicht gestrichen (B-6).** Die erste Fassung dieses Papiers hat die Klasse samt
`.todo-list` abräumen wollen; das Schwesterpapier hat ihr Überleben zur Auflage gemacht, und der
Orchestrator hat so entschieden. Die Auflage ist billig und sachlich richtig: Zwölf Prüfstellen in
acht Dateien benutzen `.todo-row` als **Geltungsbereich** — sie fragen nach einem Kasten mit einem
Text darin, und den gibt es weiter, nur als `<tr>` (E-114). Die Klasse und
`.todo-row__title` hängen deshalb am `<tr>` beziehungsweise am Titel; die übrige Klassenfamilie
(`__meta`, `__call`, `__main`, `__tags`, `__export`, `__actions`, `__more`) fällt, weil sie **null**
Fundstellen hat.

**Und genau dadurch wird die Frage scharf, die vorher gegenstandslos schien.** Bleibt die Klasse,
greifen zwei Paletteneinträge weiter:

```
theme-palettes.css   :root[data-design-theme="lines"] :is(.card, .todo-row, .filterbar) { … }
theme-palettes.css   :root[data-design-theme="zen"]   :is(.card, .todo-row, .filterbar) { … }
```

T-366 hat dazu gemessen, und die Messung ist der Grund, aus dem hier überhaupt etwas zu entscheiden
ist: **`.todo-row` ist im ganzen Palettenblatt der einzige Zeilenbezeichner.** Es gibt sonst keine
Regel auf `*-row`, `*-list` oder `*-item`; diese beiden Zeilen sind die einzigen Strukturregeln
beider Paletten, alles übrige sind Tokenblöcke.

> **Entschieden: `.todo-row` fällt aus beiden `:is()`-Listen, obwohl die Klasse bleibt.** Eine
> Kartenregel auf einer Tabellenzeile ist nicht dieselbe Regel — sie trifft anderes Gerät. Beide
> Gestaltungen verlieren damit ihre einzige Regel auf Zeilenebene, und das ist die richtige Folge,
> nicht ein Verlust.

Zwei Gründe, beide am Bestand gelesen und von T-365 beim Bauen bestätigt:

- **`lines` setzt `box-shadow: none`.** Am `<tr>` löschte das `.table__row--active
  { box-shadow: inset 0 0 0 1px var(--border-accent) }` — also die Markierung der Zeile im Zugriff,
  in genau der Gestaltung, deren Zweck die Kante ist. `border-color` täte daneben ohnehin nichts:
  Die Kanten einer Tabelle sitzen an den **Zellen**, nicht an der Zeile.
- **`zen` setzt `background-color: var(--bg-canvas)`.** Das schlägt `.table__row:nth-child(even)`
  und nähme der Todo-Tabelle — und nur ihr — das Zebra, das die Buchungstabelle einen Klick weiter
  behält. Zwei Tabellen derselben Familie sähen in derselben Palette verschieden aus, und niemand
  fände den Grund, weil er in einem Palettenblatt steht und nicht im Tabellenblatt.

`.card` und `.filterbar` bleiben in beiden Listen; sie sind weiterhin Kästen. Die Begründung steht
als Kommentar an der Stelle — **Streichung und Begründung im selben Auftrag** (E-081 Punkt 4).

**Was dabei zu messen und nicht zu behaupten ist** (Übergabepunkt an visual-qa, und die Antwort
nimmt dieses Papier ausdrücklich **nicht** vorweg): In `zen` stand die Todo-Zeile bisher flach auf
`--bg-canvas` ohne Schatten; die Tabelle bringt `--bg-surface` plus Zebra `--bg-surface-alt`
(`components.css:806-811`). Ob das in `zen`, `lines` und `plainspace` als Gestaltwechsel auffällt,
ist eine Frage an das Bild. Das Argument aus der ersten Fassung — „die Buchungstabelle zeigt dasselbe
Zebra, und niemand hat es beanstandet" — trägt für die **Bauart** und nicht für die **Wirkung**;
T-366 hat es an dieser Stelle zu Recht als das benannt, was es ist: dieselbe Grenze, die 9.1 dieses
Papiers selbst zieht (E-117). **Die Bedingung, unter der A-25.7 und A-21.3 gewahrt bleiben, ist
deshalb nicht „es ist dieselbe Optik", sondern: es entsteht keine neue Optik, und ob die vorhandene
an dieser zweiten Stelle trägt, mißt visual-qa vor der Freigabe — nicht danach** (N-9).

**Gemessen, und die Bedingung ist eingelöst (T-372, freigegeben).** Der Augenschein hat `classic`,
`zen`, `lines`, `plainspace`, `dracula`, `glass` und `liquid-glass` je bei 1280 × 820 am Bild
angesehen: Zebra, Zeilenhöhe und Kontrast stehen geordnet, und auf einer Tabellenzeile ist **keine
Kartenkante und keine Erhebung** mehr zu sehen. **Kein blockierender Bildbefund.** Die zwölf übrigen
Gestaltungen sind nicht einzeln angesehen worden, und die Begründung dafür ist dieselbe Messung, die
diesen Abschnitt ausgelöst hat: Außerhalb von `lines` und `zen` trägt kein Palettenblatt eine Regel
auf `.todo-row`, und beide sind geprüft. Der Satz darüber bleibt trotzdem stehen — er ist die
**Regel** und nicht der Befund. Beim nächsten Paletteneintrag auf einer Zeile gilt er wieder.

---

## 8. Zustände und responsives Verhalten

### 8.1 Die Zustände, je mit der Zeile, die sie heute schon trägt

Kein Zustand ist neu. Was hier steht, ist die Zuordnung — welcher vorhandene Bezeichner welchen
Zustand in der Tabellenform trägt:

| Zustand | Bauform | Zeile |
|---|---|---|
| **Laden** | `AsyncBoundary` mit `rows={6}`; `LoadingBlock` im `ScreenBody` in **Stapelform**, **ohne** `TableShell` und ohne Kopfzeile | `TodoListScreen.tsx:474-480`, `AsyncBoundary.tsx:49-51` |
| **Leer, ohne Filter** | `ScreenBody` (Stapelform) > `TableShell` > `EmptyState` mit Primäraktion „Neues Todo" | `TodoListScreen.tsx:495-514` |
| **Leer, mit Filter** | dasselbe, `EmptyState` mit „Filter zurücksetzen" | `TodoListScreen.tsx:515-526` |
| **Fehler** | `AsyncBoundary` `onRetry` + `fallbackFrame`, `InlineMessage` in Stapelform | `TodoListScreen.tsx:478-479`, `AsyncBoundary.tsx:53-69` |
| **Zeile: normal / Zebra** | `.table__row`, `:nth-child(even)` | `components.css:805-811` |
| **Zeile: Zeiger darüber** | `.table__row:hover` → `--bg-hover` | `:812` |
| ~~**Zeile: ausgewählt**~~ | ~~`.table__row--selected`~~ — **gestrichen (N-3).** Die Todo-Tabelle hat keine Auswahl; das Kästchen in Spalte 1 ändert einen Zustand und markiert nichts. Ein Zustand, der in der Liste steht, wird beim nächsten Lesen gebaut. | ~~`:815`~~ |
| **Zeile: aktiv/im Zugriff** | `.table__row--active` → `inset 0 0 0 1px var(--border-accent)`; in `lines` bliebe er ohne 7.2 wirkungslos | `:819` |
| **Zeile: Timer läuft (`--running`)** | **Zeilenfärbung am `<tr>`**, Vorder- **und** Hintergrund aus dem Paar `--timer-running-*`. Sie muß das Zebra schlagen, und dafür hat der Bestand schon eine Form — siehe den Absatz unter der Tabelle. | N-5c, `app.css:1726-1730` |
| **Zeile: erledigt (`--done`)** | Durchstreichung am Titel und `DoneFlag` in Spalte 1 — **keine** eigene Zeilenfarbe. Zwei Zustände, die beide die ganze Zeile einfärben, sind in der Überlagerung nicht mehr auseinanderzuhalten; „erledigt" ist außerdem in Spalte 1 ohnehin benannt. | N-5c |
| **Zelle/Bedienelement: Fokus** | der globale Fokusring aus `base.css`, unverändert — **einschließlich der Tag-Fläche selbst** (5.4) | — |
| **Randmarkierung am Zeilenanfang** | `.table__row > td:first-child { border-inline-start: 3px solid … }` steht im Bestand. **Ob** die Todo-Zeile sie trägt, ist F-8 und gehört T-361 (N-4 hält fest, daß die Frage unbeantwortet blieb). Bauform, falls ja: eine Kante am `td:first-child`, ohne neues Token. Der Preis, falls ja: Sie und `--running` konkurrieren am selben Zeilenanfang um dieselbe Aufmerksamkeit, und **zwei** Ränder gibt es nicht. Gebaut ist heute keine. | `:825-843` |
| **Bestätigung (Löschen)** | `ConfirmDialog` über `DialogSurface`, Portal, Fokusfalle | `TodoListScreen.tsx:544` — unverändert, A-25.6 |
| **Tag-Auslöser: Zeiger darüber / offen** | `.todo-tags__trigger:hover` und `[data-state="open"]` → `--bg-hover`, `--border-control`, `--text-primary`; derselbe Ton in beiden Zuständen, weil die offene Fläche keine zweite Farbe braucht | `app.css:1835-1840` |
| **Tag-Fläche: offen** | `.tagsurface[data-state="open"]`, `popover-in` | 5.4 |
| **Tag-Fläche: leer** | **gibt es nicht.** Ohne Tags erscheint kein Auslöser. Eine Fläche, die „keine Tags" sagt, ist eine Fläche, für die man vorher eine Handlung tun mußte, um nichts zu erfahren. | — |
| **Tag-Fläche: eine Marke nicht auflösbar** | die Marke steht als „Unbekannt" in der Fläche, und die **Zahl stimmt trotzdem** — sie kommt aus `todo.tagIds.length` | Schwesterpapier 5.2 |

**Die Primäraktion der Ansicht bleibt „Neues Todo"** im Bildschirmkopf (`TodoListScreen.tsx:406-416`),
in jedem Zustand genau eine, und sie wandert nicht in die Tabelle. Der Leerzustand wiederholt sie —
das ist der einzige Ort, an dem sie zweimal steht, und er ist bewährt.

**Die Lautstärke der Frist-Zelle** (N-5b — `DeadlineFlag` kam in der ersten Fassung dieses Papiers
kein einziges Mal vor): Sie bleibt, wie sie ist, und das ist die Entscheidung, nicht das Versäumnis.
`DeadlineFlag` trägt Symbol, Wort und Datum und liegt damit schon heute über der Schwelle von
SC 1.4.1 — die Farbe ist die dritte Angabe, nicht die einzige. **Was die Tabelle daran ändert, ist
nur der Ort**, und genau deshalb wird nichts lauter gestellt: Eine Spalte richtet gleichartige
Werte untereinander aus, und ein überfälliges Datum sticht in einer Spalte aus Daten schon dadurch
hervor, daß seine Nachbarn danebenstehen. Eine Zellfläche in Signalfarbe wäre der Fehler, der
daraus entstünde — sie schlüge das Zebra, konkurrierte mit `--running` um dieselbe Zeile und machte
aus einer Angabe eine Warnung. Der Boden dafür steht im Schwesterpapier; dieses Papier setzt keinen
Deckel darauf.

**Kein Symbol neben der Zahl in der Tag-Zelle** (N-5d): Der Auslöser trägt die Zahl und sonst
nichts. Ein Symbol daneben kostet in einer 3,5-rem-Spalte die Hälfte der Fläche, es müßte in
neunzehn Gestaltungen mitfarbig sein, und es sagte nichts, was der Spaltenkopf „TAGS" nicht schon
über der ganzen Spalte sagt. Was den Auslöser als Auslöser kenntlich macht, ist seine Kante
(`--border-subtle`, `app.css:1819-1833`) — dieselbe Form wie bei jedem anderen schmalen Knopf im
Bestand. **Der Preis steht dabei:** Eine Zahl ohne Symbol ist als Schaltfläche etwas leiser als
eine mit; gemessen ist sie mit `--hit-target-min` in beiden Dichten erreichbar (TT-09), und die
Zeigerprobe (Kante und Ton wechseln, 8.1) macht sie beim Überfahren eindeutig.

**Wie eine Zeilenfärbung das Zebra schlägt, ohne sich auf die Reihenfolge der Stilblätter zu
verlassen** (N-5c, die eigentliche Schwierigkeit an dieser Frage): `.table__row:nth-child(even)`
hat die Gewichtung *eine Klasse plus eine Pseudoklasse*. Ein Wähler aus **zwei Klassen**
(`.table__row.todo-row--running`) ist damit **gleich** gewichtet, nicht stärker — er gewinnt heute
nur, weil `app.css` nach `components.css` geladen wird. Der Bestand hat für genau diesen Fall
bereits die haltbare Form, und zwar zwei Bildschirme weiter oben:

```css
.table__row--exported,
.table__row--exported:nth-child(even) { background-color: var(--status-exported-tint); }
```

**Die Form ist: den Zebra-Fall mit aufzählen, nicht die Gewichtung hochschrauben.** Sie gewinnt
unabhängig von der Reihenfolge der Blätter, und sie ist die zweite Fundstelle einer vorhandenen
Bauform statt einer zweiten Bauform — die Regel aus Abschnitt 2.3. **Als Auftrag mit Datei, Zeile
und Gegenprobe steht das in 10.5 (Ü-2)**; hier steht nur, warum es die richtige Form ist.

### 8.1a Das Ladeskelett — entschieden, und diesmal an dem gemessen, was gebaut ist

> **Berichtigung nach T-376 (S-2).** Die vorige Fassung schrieb hier: „`TableShell` zeichnet den
> Rahmen an Tabellenstelle, `.loading-block` mit `rows={6}` die gleich hohen Balken darin."
> **Gebaut ist das nicht.** `fallbackFrame` legt um Skelett und Fehlerfläche ausschließlich einen
> `ScreenBody` (`TodoListScreen.tsx:479`); `AsyncBoundary` setzt darin `LoadingBlock`
> (`AsyncBoundary.tsx:49-51`). Ein `TableShell` kommt im Ladezustand an keiner Stelle vor — es steht
> nur im **Leer**zustand (`:496`). Ein Papier, das eine Bauform zusichert, die es nicht gibt, ist
> schlechter als eines, das schweigt: Der nächste Leser hält die Abweichung für einen Baufehler und
> „behebt" sie.

**Die Frage, die dahinter steht** (T-366 N-5e, und das Schwesterpapier führt sie in 15.4 bis heute
als die einzige unbeantwortete): Wie sieht ein Ladeskelett aus, das **keine** Kopfzeile hat und
trotzdem nach Tabelle aussieht?

> **Entschieden: Der Ladezustand behält die Stapelform des Bestands. Es kommt kein `TableShell`
> dazu, und es kommt kein gezeichnetes Tabellengerüst dazu.**

Drei Gründe, und der zweite ist der, der die Entscheidung trägt:

1. **Es ist der heutige Zustand, und er ist damit von A-25.7 ohne Zutun gedeckt.** Die Umstellung
   auf die Tabelle ändert den Ladezustand nicht — dieselbe Lage wie bei den Dichten (7.1) und bei
   der Frist-Zelle (weiter oben): Was sich nicht ändert, braucht keine Deckung in A-25.9. Jede
   andere Antwort wäre **neue Gestalt** und müßte vor dem Bau in A-25.9 stehen.
2. **Ein Gerüst im Ladezustand verspricht Spalten, die der nächste Zustand zurücknimmt.** Das
   Schwesterpapier hat in 9.1 entschieden, daß die Kopfzeile **mit den Zeilen** erscheint und nicht
   vorher, weil es in Z3 (leer) und Z4 (Fehler) gar keine Tabelle gibt. Ein Rahmen an
   Tabellenstelle im Ladezustand machte dieselbe Zusage eine Ebene tiefer und nähme sie in Z3
   ebenso zurück. **Die beiden Papiere sagen damit dasselbe, und dieser Absatz ist die Stelle, an
   der sie sich treffen.**
3. **Gleich hohe Balken sind bereits das Tabellenmerkmal.** `LoadingBlock` mit `rows={6}` zeichnet
   sechs gleich hohe Balken; eine Liste hätte ungleiche. Mehr Tabelle als das kann ein Zustand
   nicht behaupten, in dem noch keine Spaltenbreite feststeht — sie hängen an den Daten (4.2).

**Der Preis steht dabei:** Der Sprung von Z0 nach Z1 kostet eine Zeilenhöhe, weil die Kopfzeile
dazukommt. Er ist von Z7 des Schwesterpapiers gedeckt („die Bildlaufstelle darf dabei springen")
und ist der kleinere Preis gegenüber einem Gerüst, das zweimal in beide Richtungen wechselt.

**Damit ist 15.4 des Schwesterpapiers beantwortet und gehört nicht mehr in dessen Liste der offenen
Fragen.** Die Frage war richtig an dieses Papier adressiert — sie ist eine Gestaltfrage —, und sie
ist hier beantwortet, nicht zurückgereicht.

### 8.1b Das Erledigt-Kästchen in Spalte 1 — N-2 ist entschieden

Die Lage, unverändert richtig beschrieben: In `BookingTable` und in `ExportGroups` **ist** die erste
Spalte mit Kästchen eine Auswahl; in der Todo-Tabelle ist dasselbe Bild eine Zustandsänderung, und
ein Fehlklick markiert ein Todo als erledigt. T-365 hat die drei **strukturellen** Auflagen gebaut
und keine vierte, **sichtbare** erfunden; T-373 hat sie ebenfalls nicht erfunden; visual-qa hat sie
am Bild angesehen und die Entscheidung ausdrücklich nicht an sich gezogen. Jedesmal richtig — und
jetzt ist der Punkt, an dem entschieden wird.

> **Entschieden: Es kommt keine neu erfundene Gestalt dazu. Die sichtbare Unterscheidung ist der
> Wortkopf über der Spalte — und sie ist bereits gebaut, bereits gedeckt und sie klebt.**

**Der Befund, der die Entscheidung möglich macht, ist, daß die vierte Unterscheidung nicht fehlt.**
Die **erste** der drei Auflagen aus 3.2 — „die Kopfzelle trägt das Wort ‚Erledigt' und kein
Kontrollkästchen" — ist nicht nur strukturell. Sie ist **sichtbar**, und sie ist dreimal
hintereinander unter „strukturell" abgelegt worden, weil sie in derselben Aufzählung stand wie
`aria-selected` und die Sammelleiste, die es beide wirklich nur im Baum gibt. Gelesen an den vier
Tabellen des Bestands:

| Tabelle | Kopfzelle der Spalte 1 | Was die Spalte ist | Zeile |
|---|---|---|---|
| Buchungsübersicht | **Kontrollkästchen**, „Alle sichtbaren Buchungen auswählen" | Auswahl | `BookingTable.tsx:180-183` |
| Export nach Todo | **Kontrollkästchen**, „Alle exportierbaren Tagesgruppen auswählen" | Auswahl | `ExportGroups.tsx:212` |
| Tagesgruppen (geschachtelt) | verborgenes Wort „Auswahl", **sichtbar leer** | Auswahl | `ExportGroups.tsx:288` |
| **Todo-Tabelle** | **das Wort „Erledigt"** | Zustand | `TodoTable.tsx:142` |

> **Die Regel, die daraus folgt, ist die Anwesenheit des Wortes und nicht die Abwesenheit des
> Kästchens:** Über einer Auswahlspalte steht in diesem Bestand **kein Wort**. Über Spalte 1 der
> Todo-Tabelle steht eines. Das ist die einzige Spalte im ganzen Bestand, bei der das so ist.

Sie erfüllt die vier Bedingungen, die das Schwesterpapier in 3.2 an jede zulässige Antwort stellt —
und das ist der Grund, aus dem sie zulässig ist, während eine erfundene Form es nicht wäre:

| Bedingung aus 3.2 | erfüllt, weil |
|---|---|
| **kein neuer sichtbarer Text** | A-25.9 deckt die Spaltenüberschriften ausdrücklich. „Erledigt" steht dort ohnehin; es wird nichts hinzugefügt. **Eine Ergänzung der Spezifikation ist für diese Antwort nicht nötig** — und das ist der Unterschied zu jedem anderen Ausgang. |
| **nicht Farbe allein** (SC 1.4.1) | Es ist ein Wort. Es trägt in der Graustufenprobe zeichengleich. |
| **im leeren Zustand wirksam** | Der Kopf steht, bevor irgendein Kästchen angefaßt wurde, und er steht unabhängig vom Zustand der Zeilen. Der Fehlklick ist der Schaden — und die Unterscheidung steht **vor** ihm da. |
| **verträglich mit kompakter Dichte und 24 × 24 px** | Der Kopf ist kein Ziel und kostet keine Trefferfläche. Spalte 1 ist in beiden Dichten 9 rem breit (4.3a), das Wort „ERLEDIGT" mißt weniger. |

**Und hier zahlt sich Abschnitt 3 aus:** Der Kopf **klebt** (3.1, gemessen von A10). Die
Unterscheidung steht damit nicht nur im ersten Bild, sondern in **jeder** Bildlaufstellung über
ihrer Spalte. Ohne den klebenden Kopf wäre dieselbe Antwort schwach — ab Zeile 20 wäre sie
weggerollt. **A10 mißt seit dieser Entscheidung nicht mehr nur ein Layout: Es mißt die sichtbare
Unterscheidung, mit der die Todo-Tabelle sagt, daß sie keine Auswahl ist.** Wer A10 künftig für
einen reinen Bildlauftest hält und ihn lockert, nimmt N-2 mit weg.

**Der Preis steht dabei, in vier Sätzen:**

1. **Wer nur auf eine Zeile sieht, sieht dasselbe Bild wie bei einer Auswahlspalte.** Die
   Unterscheidung verlangt einen Blick nach oben. Das wird angenommen.
2. **Ein Fehlklick setzt weiterhin mit einem Klick „Erledigt".** Das ist heute schon so
   (`TodoRow.tsx`), und die Tabelle ändert daran nichts. Getragen wird das Risiko deshalb über die
   **Rücknahme** und nicht über die Gestalt — das ist genau der Ausgang, den 3.2 des
   Schwesterpapiers für diesen Fall vorgesehen hat.
3. **Daraus folgt die Bedingung, und sie ist ab jetzt eine Zusage mit Wächter.** Das Markieren aus
   der Tabelle heraus führt denselben Weg wie heute aus der Liste — `undoDoneAction` im Toast,
   zeichengleich und ohne Zwischenschritt (`TodoListScreen.tsx:262-308`, der Rückweg an `:302`).
   Fällt er weg, ist N-2 neu zu entscheiden. Gemessen wird das als **A17** (9.3) und im
   Schwesterpapier als **TT-36** — eine Zusage an zwei Adressen, siehe den Kasten in 9.3. Ohne sie
   wäre die Bedingung genau das, was dieses Papier an drei anderen Stellen beklagt: ein Satz in
   einem Designpapier, den kein Lauf liest.
4. **Bekommt die Todo-Tabelle je eine Mehrfachauswahl** (F-2, heute „nein"), fällt die
   Unterscheidung in sich zusammen — dann stünde ein Wort über einer Spalte, die beides ist. N-2
   ist dann keine Gestaltfrage mehr, sondern wieder offen.

> **Eine Falle für den nächsten Leser, deshalb ausgeschrieben.** Das Schwesterpapier knüpft TT-36
> an die Antwort „**keine** sichtbare Unterscheidung" („Wer OF-7 mit ‚keine' beantwortet, hat damit
> TT-36 zugesagt"). Diese Antwort hier ist eine dritte: **keine neu erfundene** Gestalt, weil eine
> vorhandene trägt. Daraus folgt **nicht**, daß die Bedingung entfällt — im Gegenteil. Die
> vorhandene Unterscheidung steht über der Spalte und nicht in der Zeile; wer nur auf die Zeile
> sieht, ist genau in der Lage, für die TT-36 geschrieben wurde. **TT-36 und A17 gelten
> unverändert.**

**Was ausdrücklich nicht entschieden wurde:** eine andere Kästchenform, eine andere Tönung, ein
Symbol, ein Zusatz in der Zelle. Jedes davon wäre eine **Gestaltänderung**, A-25.7 zählt die
erlaubten abschließend auf, A-25.9 nennt sie nicht — sie müßte also **vor** dem Bau in die
Spezifikation, nicht danach. Diese Reihe hat den umgekehrten Weg zweimal bezahlt.

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
- **Wirkung, gerendert.** Neun neue Zusicherungen in `tests/e2e/viewport-fit.spec.ts` (sechs in der
  ersten Fassung; A14 ist nach B-5 in A14a/A14b geteilt, A16 kam mit der Rollenentscheidung aus 5.3
  dazu, A17 mit der Entscheidung zu N-2 aus 8.1b), im
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
Hauptsache, sondern der Nebenwächter — die Hauptsache steht in A10 bis A16.

Die Lehre, in einem Satz: **Eine Zusicherung, die man aus dem Gedächtnis zitiert, wird beim
nächsten Bau gegen die falsche Zahl gemessen.** Der Satz aus dem Auftrag ist am Quelltext gelesen
und dort widerlegt worden; er ist in `fensterfeste-flaechen.md` 9.1 nachgetragen, damit die nächste
Lesung ihn nicht noch einmal macht.

### 9.3 Die neun neuen Zusicherungen

Menge der Ansichten wie bisher über `ROUTE_NAMES` (9.3 des Mechanismuspapiers); die hier genannten
gelten je auf der Todo-Ansicht, A10 zusätzlich auf der Buchungsübersicht.

| | Zusicherung | Messung | Was sie **nicht** sagt |
|---|---|---|---|
| **A10** | *Der Tabellenkopf klebt wirklich.* | Laufbereich ans Ende rollen; `thead th` `getBoundingClientRect().top` vor und nach dem Rollen gleich (± 1) **und** gleich `screen__body.getBoundingClientRect().top` (± 1). Vorbedingung: `screen__body.scrollHeight > clientHeight` — sonst mißt der Lauf ein Kleben, das nichts zu tun hatte, und ist grün ohne Aussage. | Nicht, daß der Kopf lesbar ist. Ein deckender Hintergrund ist eine Farbfrage und gehört ins Bild. |
| **A11** | *Der Kopf wandert waagerecht mit seiner Spalte.* | Laufbereich waagerecht ans Ende rollen; `left` einer benannten `th`-Zelle und `left` der ersten `td`-Zelle derselben Spalte gleich (± 1). Vorbedingung: `scrollWidth > clientWidth` an dieser Fenstergröße. | Nicht, welche Spalte wo steht. |
| **A12** | *Im Standardfenster läuft die Tabelle nicht waagerecht, darunter kann sie.* | Bei 1280 × 820: `table-wrap.scrollWidth ≤ clientWidth + 1`. Bei 960 × 640: `scrollWidth > clientWidth` — **beides**, und das Paar ist der Punkt: Das erste allein wäre auch grün, wenn die Tabelle auf 20 rem zusammengefallen wäre. **Bleibt unverändert; B-2 hat sie bestätigt, T-365 hat die Paare gemessen: 1280 × 820 → 1030/1030, 960 × 640 → 1008/710.** | Nicht, daß die Spaltenbreiten sinnvoll sind. |
| **A13** | *Was unter oder über der Tabelle steht, steht über ihrer ganzen Breite.* | Nach dem waagerechten Rollen ans Ende: jedes Element, das im Laufbereich neben der Tabelle liegt, hat `getBoundingClientRect().right ≥` der rechten Kante der letzten sichtbaren Spalte. Gilt nur, wenn es ein solches Element gibt — **und wenn nicht, sagt der Lauf, daß er keines gesehen hat** (die Hausform gegen die leere Menge, E-111, 9.6). | Nicht, ob es dieses Element geben soll — das ist F-7. |
| **A14a** | *Zeiger-Weg: rollt der Bereich, schließt die Fläche.* | Fläche **mit dem Zeiger** öffnen, senkrecht um 200 px rollen ⇒ `.tagsurface` hat `count() === 0`. Dasselbe waagerecht. | Nicht, wohin der Fokus geht — er war nie in der Fläche. |
| **A14b** | *Tastatur-Weg: dasselbe, und der Fokus kommt zurück.* | Fläche mit `Eingabe` öffnen (Fokus ist danach **in** der Fläche), rollen ⇒ `count() === 0` **und** `document.activeElement` ist der Auslöser. | Nicht, daß der Auslöser sichtbar ist — das mißt der Bildlauf selbst. |
| **A15** | *Die Tag-Fläche liegt über dem klebenden Kopf.* | Fläche an einer Zeile nahe dem oberen Rand öffnen; `elementFromPoint` in der Mitte der Fläche liefert einen Knoten **innerhalb** der Fläche. Gegenprobe im selben Lauf: `--z-popover` am Inhalt entfernt ⇒ rot. | Nicht, daß sie im Bild lesbar ist. |
| **A16** | *Die Fläche ist ein Kasten, kein Anspruch.* | `.tagsurface` hat **kein** `aria-modal`, und im Dokument steht **kein** `.scrim`, während sie offen ist. | Nicht, daß `role="dialog"` die beste Rolle ist — das ist eine Entscheidung (5.3), keine Messung. |
| **A17** | *Die Rücknahme überlebt den Umzug in die Tabelle.* | Ein offenes Todo über das Kästchen in Spalte 1 als erledigt markieren ⇒ ein Toast mit der Schaltfläche **„Rückgängig"** steht da; Betätigen stellt den offenen Zustand wieder her, **in einem Schritt und ohne Rückfrage**. Gegenprobe im selben Lauf: Beim **Zurücknehmen** erscheint kein zweiter Rückweg (`TodoListScreen.tsx:288-304` — die Rücknahme einer Rücknahme braucht keine). | Nicht, daß der Fehlklick unwahrscheinlich ist. A17 mißt den Ausweg, nicht den Weg hinein. |

**Die zwei Untergrenzen gelten auch hier, und sie zählen ihre eigene Menge** (9.6 des
Mechanismuspapiers, E-111): Der Lauf meldet, **wie viele** Tabellen er gefunden hat und **wie
viele** davon tatsächlich liefen. Null gefundene Tabellen ist rot, nicht grün. Dieser Bestand hat
den Fehler dreimal gemacht; er wird ihn nicht ein viertes Mal machen, weil niemand daran gedacht
hat.

#### Warum aus A14 zwei Zusicherungen geworden sind (B-5)

Die erste Fassung schrieb: „geschlossen **oder** um denselben Betrag verschoben". Das war die
richtige Form, solange 6.2 zwei Ausgänge zuließ — und es wurde in dem Augenblick **blind**, in dem
B-5 einen davon gestrichen hat. Eine Zusicherung, die beide Ausgänge grün nennt, mißt eine
Entscheidung in **keiner** Richtung; sie hätte auch die Gegenrichtung durchgelassen. Dieses Papier
sagt in 9.3 selbst, daß eine Zusage ohne Wächter in diesem Bestand dreimal grün und blind war —
A14 wäre der vierte Fall gewesen, und zwar einer, den dasselbe Papier erzeugt hat.

Die Trennung nach **Modalität** ist dabei nicht Fleiß, sondern das, was B-5 entschieden hat: Der
Zeigerweg und der Tastaturweg enden verschieden — einmal ist nur die Fläche weg, einmal muß
zusätzlich der Fokus zurückstehen. Eine einzige Zusicherung für beides könnte den Fokusteil nur
weglassen.

**Dazu zwei Gegenproben, und beide messen Fehler, die T-365 beim Bauen tatsächlich erzeugt hat:**

| | Gegenprobe | Was sie fängt |
|---|---|---|
| **A14c** | Fläche mit 40 Marken öffnen, **in ihr** rollen (`scrollTop = 40`) ⇒ sie ist **noch offen**. | Den Wächter, der jedes Bildlaufereignis nimmt. Ohne diese Probe schließt sich die Fläche beim Lesen selbst, und A14a/A14b sind trotzdem grün. |
| **A14d** | Einen Auslöser anklicken, der nur **halb im Bild** steht (der Klick rollt ihn hinein) ⇒ die Fläche ist danach **offen**. | Den Wächter, der auf das **Ereignis** statt auf die **Bewegung des Ankers** hört — er schließt die Fläche im selben Augenblick, in dem sie aufgeht (6.2). In der Sondierung von T-365 reproduzierbar rot. |

#### Warum A17 in diesem Meßsatz steht und nicht in einem Prüffall zur Todo-Liste (N-2)

> **A17 und TT-36 des Schwesterpapiers sind *eine* Zusage, nicht zwei.** T-374 hat dieselbe
> Bedingung unabhängig als Meßlatte aufgeschrieben (`todo-tabelle-fluss.md` §14, TT-36) — dort als
> **Abnahmekriterium für den frontend-dev**, hier als **Zusicherung für den e2e-tester**, weil der
> seinen Auftrag aus 9.3 bekommt und nicht aus §14. Daß beide Papiere unabhängig auf denselben Satz
> gekommen sind, ist der seltene gute Fall von E-113; damit er einer bleibt, gilt: **Wer eine der
> beiden anfaßt, faßt die andere mit an.** Gemessen wird der Vorgang einmal, nicht zweimal.

A17 mißt nichts, was dieser Umbau **gebaut** hat — der Rückweg im Toast steht seit T-118. Es steht
trotzdem hier, und zwar aus einem Grund, der zum Meßsatz gehört: **Die Entscheidung zu N-2 hängt an
ihm.** 8.1b nimmt keine sichtbare Gestalt auf und trägt das Risiko des Fehlklicks stattdessen über
die Rücknahme. Eine Entscheidung, die an einer Eigenschaft hängt, die niemand mißt, ist eine
Entscheidung auf Widerruf — und diesen Widerruf würde niemand bemerken, weil das Verschwinden eines
Toasts nichts rot macht.

**Das ist die Hausform dieses Papiers, hier zum dritten Mal:** A16 bewacht die Auflage aus 5.3,
A14c/A14d bewachen die Mechanik aus 6.2, A17 bewacht die Bedingung aus 8.1b. Wer eine der drei für
Beiwerk hält, streicht jeweils die Zusage mit, die sie trägt.

**Die Gegenprobe, verbindlich** (E-117 Punkt „Nachweis über den Wächter"): Jede der neun
Zusicherungen wird einmal mit dem Zustand **vor** dem Bau gefahren und muß rot werden —
`position: sticky` am `thead` entfernt ⇒ A10 rot; `table-layout: fixed` entfernt ⇒ A12 rot;
`.tagsurface` ohne Portal ⇒ A14a oder A15 rot; `modal={true}` ⇒ A16 rot; `action: undoDoneAction(…)`
an `TodoListScreen.tsx:302` entfernt ⇒ A17 rot. Neun von neun. Ohne diese
Probe ist „alles grün" wieder nur eine Behauptung über einen Wächter, und genau diese Behauptung
ist in diesem Bestand dreimal grün gewesen und blind.

### 9.4 Der Vorrat

Ergänzt zu `fensterfeste-flaechen.md` 9.4, Punkt „Todo-Liste". Zusätzlich nötig:

- **ein Todo mit *genau einem* Tag und ein Todo mit mehr Tags, als die Fläche ohne eigenen Lauf
  faßt** (B-8; „genau einem" seit **S-6** aus dem Gegenlesen). Die erste Fassung verlangte „ein Todo
  mit mehr Tags, als die **Zelle** zeigt" — und maß damit gegen eine Voraussetzung, die es nicht
  mehr gibt: Die Zelle zeigt **keine einzige Marke**, nur die Zahl, und den Auslöser gibt es an
  jeder Zeile mit mindestens einem Tag. Der alte Satz hätte den Vorrat auf einen Sonderfall verengt
  und den Regelfall ungemessen gelassen. **„Mindestens einem" hätte denselben Fehler ein zweites Mal
  gemacht, nur leiser:** Das zweite Todo erfüllt die Bedingung mit, und wer den Vorrat nach dem
  Wortlaut anlegt, hakt beide Zeilen mit **einem** Datensatz ab — dann fehlt genau der Regelfall
  wieder, dessentwegen dieser Punkt berichtigt wurde. Das zweite Todo bleibt trotzdem nötig, aber aus
  einem anderen Grund: Es ist der einzige Vorrat, an dem der **innere Lauf** der Fläche entsteht —
  und damit die Vorbedingung von A14c und von TT-19;
- **ein Todo ganz ohne Tags** — die Gegenprobe zu beidem: Dort darf **kein** Auslöser stehen, und
  eine leere Fläche gibt es nicht (8.1). Ohne diese Zeile ist „ohne Tags kein Knopf" eine Zusage
  ohne Wächter;
- **ein offenes Todo** — Vorbedingung von A17 (N-2). Es muß offen sein, weil der Rückweg nur beim
  **Setzen** des Kennzeichens entsteht und nicht beim Zurücknehmen (`TodoListScreen.tsx:288-304`);
  ein Vorrat aus lauter erledigten Todos ließe A17 grün werden, ohne etwas gemessen zu haben;
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

**In `tests/e2e/**`: 8 Dateien, 12 lebende Fundstellen.** Sie hätten alle gebrochen, wäre
`.todo-row` verschwunden — **mit B-6 verschwindet sie nicht**, und deshalb ist diese Liste seit dem
2026-09-14 keine Bruchliste mehr, sondern die Begründung der Auflage aus 7.2. T-365 hat alle zwölf
gefahren: grün, **ohne eine Zeile in `tests/e2e/**` anzufassen**. Die Zählung selbst bleibt richtig
und bleibt hier stehen, weil sie der Grund ist, aus dem die Klasse überlebt:

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

> **Auflage, weiterhin gültig:** Der frontend-dev repariert Prüffälle **nicht** nebenbei. Sie
> stehen mit Datei, Zeile und Behebungsvorschlag im Bericht, und die Reparatur ist ein Auftrag an
> den e2e-tester in der **nächsten** Welle — die Lehre aus T-315/T-316: Wer eine Schnittstelle
> umbaut und wer sie mißt, gehören in aufeinanderfolgende Wellen. Daß diesmal nichts zu reparieren
> war, ist das Ergebnis von B-6 und nicht der Beweis, daß die Auflage entbehrlich wäre.

**In `apps/web/src`:** `TodoRow.tsx` (ganz), `TodoListScreen.tsx:498` (`<ul class="todo-list">`),
`app.css:1635-1742` (`.todo-list` und die Unterklassen von `.todo-row`), `app.css:4890-4892` (die
68-rem-Regel, siehe 8.2), die zwei Einträge in `theme-palettes.css` (siehe 7.2). **`.todo-row` und
`.todo-row__title` bleiben** (B-6); es fallen `__meta`, `__call`, `__main`, `__tags`, `__export`,
`__actions` und `__more`, die **null** Fundstellen in `tests/**` haben. `app.css:2124`,
`components.css:1115` und `viewport-layout.css:340` nennen `.todo-row*` nur in **Kommentaren**; sie
bleiben, wo sie stehen — ein Kommentar, der die Vorgeschichte erklärt, ist kein Rest. Eine Ausnahme
hat T-365 zu Recht gemacht: `components.css:1115` zeigte auf `.todo-row__meta` als Fundstelle der
Umbruchregel, und diese Klasse gibt es nicht mehr — ein Kommentar, der auf einen gestrichenen
Bezeichner zeigt, erklärt nichts mehr (N-7).

### 10.2 Reihenfolge

1. `TodoTable.tsx` neben `TodoRow.tsx` anlegen; `.todo-table`, `.todo-col--*` in `app.css`.
2. `TodoListScreen.tsx` auf die Zustandsform aus 3.2 umstellen (`ScreenBody` mit und ohne
   `table-wrap`, `TableShell` im Leerzustand).
3. Tag-Fläche bauen — `@ark-ui/react/popover`, `modal={false}` (5.3, **Ü-1 ist entschieden und
   nicht mehr zu prüfen**); `.tagsurface` in `components.css` neben `.menu`.
4. `.todo-list` und die Unterklassen von `.todo-row` samt der 68-rem-Regel streichen und die zwei
   `theme-palettes`-Einträge anfassen — **in diesem Schritt und nicht früher**, damit zwischen Bau
   und Streichung kein Zwischenstand steht, gegen den jemand mißt. **`.todo-row` und
   `.todo-row__title` bleiben** (B-6); der Paletteneintrag fällt trotzdem, und die Begründung steht
   als Kommentar an der Stelle (7.2).
5. Messen: `pnpm check`, dazu `viewport-fit.spec.ts` im vorhandenen Stand (er muß grün bleiben) und
   die neun neuen Zusicherungen aus 9.3 als Auftrag an den e2e-tester.

### 10.3 Was der frontend-dev berichten mußte, statt es zu entscheiden — und was er gemessen hat

Alle vier Punkte sind beantwortet. Sie stehen hier mit dem Ergebnis, damit niemand sie ein zweites
Mal stellt:

| | Auftrag | Ergebnis (T-365) | steht jetzt in |
|---|---|---|---|
| 1 | welcher Baustein aus Ü-1, und warum | `@ark-ui/react/popover`, `modal={false}`; `HoverCard` liegt vor und trägt TF-3 trotzdem nicht | 5.3 |
| 2 | welcher Ausgang aus 6.2 | die Fläche **schließt**; gemessen wird die **Bewegung des Ankers** | 6.2 |
| 3 | die gemessene Spaltensumme gegen 44 rem | **43,5 rem**, Titel 17,8 rem bei 1280 und 16,4 rem bei 960 | 4.3a |
| 4 | ob A13 sich verhält wie gerechnet | ja — 662 px gegen 958,5 px | 6.3 |

**Und eine Zusage, die dieses Papier gemacht hat, ist eingehalten:** `proof:clamp` steht
unverändert bei **37** Deckelklassen. Der Umbau hat keinen neuen Deckel eingeführt — das war Grund 2
in 4.4, und es ist die einzige Stelle dieses Papiers, an der ein `proof:`-Lauf eine Designaussage
unmittelbar mißt.

### 10.4 Ein eigener Auftrag, der aus diesem folgt: `TableShell` nach `shared/ui/`

T-365 fragt (offene Frage 1), ob `TableShell` aus `features/bookings/BookingTable.tsx` nach
`shared/ui/` wandern soll. **Antwort: ja, und als eigener Auftrag.**

Die Hausregel ist zahlenmäßig erfüllt und nicht nur dem Sinn nach: `shared/ui/` nimmt auf, was mehr
als ein Merkmal wirklich braucht, und **jede der neunzehn Dateien dort wird aus mindestens drei
Bereichen gelesen**. `TableShell` hat seit T-365 genau drei Leser außerhalb von `bookings` —
Musterseite, Buchungen, Todos. Der Baustein trägt außerdem, wofür `shared/ui/` da ist: Er ist der
**Rahmen an Tabellenstelle** für Leer-, Lade- und Fehlerzustand, also eine Zustandsform und keine
Fachlogik. Er weiß nichts über Buchungen.

Drei Gründe, warum es trotzdem **nicht** in diesem Auftrag geschieht:

1. Der Umzug faßt `BookingTable.tsx`, `BookingsScreen.tsx` und `DataSection.tsx` an — drei Dateien,
   die in dieser Welle niemandem gehören, an denen aber in der nächsten jemand arbeiten kann.
2. `bookings ↔ todos` ist eine von `CLAUDE.md` ausdrücklich benannte **echte** Kante. Sie ist
   erlaubt, sie ist kein Befund, und sie ist deshalb kein Grund zur Eile.
3. Ein Umzug mitten in einer Welle ist genau die Sorte Änderung, die einem parallel laufenden
   Prüfauftrag den Boden wegzieht (T-315/T-316).

**Der Ankerwächter aus 6.2 bleibt vorerst örtlich**, in `TodoTagsCell.tsx`, und wandert **nicht**
mit. Er hat heute einen Leser. Eine Fläche in einem zweiachsigen Laufkasten ist bisher einmalig
(OF-3); erst wenn es die zweite gibt, ist die gemeinsame Form an der Sache gemessen und nicht an
der Ähnlichkeit zweier Dateien.

### 10.5 Ü-2 — eine Zeile, die heute nur über die Blattreihenfolge gewinnt

**Auftrag an den frontend-dev. Eine Regel, drei Zeilen, keine neue Bauform.**

> **Dieser Abschnitt ist der ganze Auftrag.** Datei, Zeile, heutige Form, was daran nicht stimmt,
> haltbare Form, Abnahme und die Antwort darauf, was ihn heute fängt — alles steht hier. Es ist kein
> Bericht danebenzulegen und keiner nachzuschlagen; wer das tut, liest nur dieselben Zahlen ein
> zweites Mal.

| | |
|---|---|
| **Datei, Zeile** | `apps/web/src/styles/app.css:1726-1730` (der Kommentar dazu: `:1721-1725`) |
| **An wen** | frontend-dev, eigener kleiner Auftrag. **Regel und Kommentar in *einem* Auftrag** (E-081 Punkt 4) — ein Kommentar, der eine Begründung behauptet, die die Regel nicht mehr trägt, ist schlimmer als keiner. |
| **Gefunden in** | T-373, beim Nachziehen von 8.1 |
| **Dringlichkeit** | keine — es ist **kein Befund**, solange die Blattreihenfolge steht. Es ist eine Zeile, die beim nächsten Umbau still bricht. |
| **Abnahme** | Zwei Dinge, beide ohne Browser prüfbar: (1) Der Wähler `.table__row.todo-row--running:nth-child(even)` steht in der Regel; er wiegt 0-3-0 gegen 0-2-0 des Zebras und gewinnt damit in **jeder** Blattreihenfolge. (2) Der Kommentar darüber begründet die **Aufzählung** und nicht mehr die Zahl der Klassen. Wer doch einen Browser zur Hand hat: Timer auf einer Zeile mit **gerader** Ordnungszahl starten — sie trägt `--timer-running-bg`, nicht `--bg-surface-alt`. |

**Heutige Form:**

```css
/* … wer sich auf die Reihenfolge zweier Stilblätter verläßt, verliert beim nächsten Umbau. */
.table__row.todo-row--running,
.table__row.todo-row--running:hover {
  background-color: var(--timer-running-bg);
  color: var(--timer-running-fg);
}
```

**Was daran nicht stimmt.** Der Kommentar darüber sagt, zwei Klassen im Wähler sorgten dafür, daß
die Zeilenfärbung das Zebra schlägt — **und im selben Atemzug, daß beide gleich gewichtet sind.**
Das zweite ist richtig, das erste folgt daraus nicht. Gerechnet:

| Wähler | Gewicht |
|---|---|
| `.table__row:nth-child(even)` (`components.css:809-811`) | 0-2-0 — eine Klasse **plus eine Pseudoklasse** |
| `.table__row.todo-row--running` (`app.css:1726`) | 0-2-0 — zwei Klassen |

Bei gleichem Gewicht entscheidet die Reihenfolge im Blatt. Sie steht in `main.tsx:5-8`:
`base.css`, `components.css`, `app.css`, `viewport-layout.css` — `app.css` kommt **nach**
`components.css`, und nur deshalb gewinnt die laufende Zeile. (`designsystem.tsx:4-8` hat dieselbe
Reihenfolge; die Musterseite verhält sich also gleich.)

**Haltbare Form** — dieselbe, die der Bestand für genau diesen Fall zwei Bildschirme weiter oben
schon führt (`components.css:846-848`, exportierte Zeilen): den Zebra-Fall **mit aufzählen**, statt
die Gewichtung hochzuschrauben.

```css
.table__row.todo-row--running,
.table__row.todo-row--running:nth-child(even),
.table__row.todo-row--running:hover {
  background-color: var(--timer-running-bg);
  color: var(--timer-running-fg);
}
```

Die mittlere Zeile wiegt 0-3-0 und schlägt das Zebra **unabhängig von jeder Blattreihenfolge**. Der
Kommentar darüber gehört mitgeändert: Er begründet ab dann die Aufzählung und nicht mehr die
Klassenzahl. **Streichung und Begründung im selben Auftrag** (E-081 Punkt 4).

**Was rot wird, wenn jemand die Blattreihenfolge ändert — und das ist der eigentliche Grund für
diesen Eintrag: nichts.**

| Lauf | fängt es? |
|---|---|
| `typecheck`, `boundaries`, `build` | nein — es ist gültiges CSS in jeder Reihenfolge |
| `contrast` | nein — er mißt Tokenpaare, nicht die Kaskade |
| `proof:clamp`, die übrigen `proof:`-Läufe | nein — sie lesen Regeln, nicht das gerechnete Ergebnis |
| `viewport-fit.spec.ts`, A10 bis A17 | nein — keine dieser Zusicherungen liest eine Hintergrundfarbe |
| Augenschein | **nur mit Glück** — sichtbar wird es ausschließlich an einer laufenden Zeile mit **gerader** Ordnungszahl. Steht der Timer auf der ersten oder dritten Zeile, sieht das Bild richtig aus. |

Ein Fehler, der von jedem Lauf durchgelassen wird und im Bild nur jedes zweite Mal auftritt, sieht
hinterher nicht wie eine Regel aus, sondern wie ein Zeichenfehler — und danach sucht niemand in der
Kaskade. **Deshalb wird er strukturell behoben und nicht bewacht:** Die haltbare Form braucht keinen
Wächter, weil sie die Bedingung gar nicht erst hat. Das ist dieselbe Wahl wie beim Portal in 5.2 —
eine Zusage, die aus dem Bau folgt, statt einer, die gemessen werden muß.

---

## 11. Offene Fragen

| # | Frage | Stand | An wen |
|---|---|---|---|
| **OF-1** | Der Auftrag nennt das Exportprotokoll als Tabellenvorbild; es ist keine Tabelle (2.1). War es mitgemeint — soll also auch `.auditrow` zur Tabelle werden? | **offen** | Auftraggeber über den Orchestrator |
| ~~**OF-2**~~ | Fällt mit `.todo-row` die letzte Fläche, die in `lines` und `zen` eine **Zeile** wie eine Karte behandelt? | **beantwortet: ja** (N-9, an `theme-palettes.css` gemessen — `.todo-row` ist im ganzen Blatt der einzige Zeilenbezeichner). Die Folge steht in 7.2 und ist entschieden: Der Eintrag fällt, obwohl die Klasse bleibt. **Die zweite Hälfte — ob es im Bild auffällt — ist seit T-372 ebenfalls beantwortet: nein.** Sieben Gestaltungen am Bild, darunter beide betroffenen (`lines`, `zen`); Zebra, Zeilenhöhe und Kontrast geordnet, keine Kartenkante auf einer Zeile, **kein blockierender Bildbefund** (7.2). | erledigt |
| ~~**OF-3**~~ | Die Tag-Fläche ist die erste angeheftete Fläche im Bestand, deren Anker in einem **zweiachsigen** Laufkasten liegt (6.1). | **teilweise beantwortet.** Der Fall ist gebaut und gemessen (6.2), und der Ausgang ist „schließt" — damit hängt hier nichts mehr an der Nachführung der Bibliothek. Offen bleibt die **Bestandsfrage**: Tragen `Select`, `Menu` oder `TagInput` denselben Fall schon irgendwo, ohne daß es gemessen wurde? Das ist ab jetzt eine Frage an den Bestand, keine an diesen Auftrag. | e2e-tester im Zuge von A14a/A14b |
| ~~**OF-4**~~ | Trifft die Rechnung aus 6.3 zu? | **beantwortet: ja** — 662 px gegen 958,5 px, gemessen an drei Fensterbreiten. F-7 wird nicht teurer und geht nicht an T-361 zurück. | erledigt |
| ~~**OF-5**~~ | **Das Erledigt-Kästchen in Spalte 1 (N-2, T-365 offene Frage 2).** | **Beantwortet in 8.1b (T-379): keine erfundene Gestalt.** Die sichtbare Unterscheidung ist der **Wortkopf** über der Spalte — über einer Auswahlspalte steht in diesem Bestand kein Wort (vier Tabellen gelesen), über Spalte 1 der Todo-Tabelle eines, und der Kopf **klebt**. Sie erfüllt die vier Bedingungen aus 3.2 des Schwesterpapiers, sie ist gebaut und von A-25.9 gedeckt — **eine Ergänzung der Spezifikation ist dafür nicht nötig.** Der Preis: Wer nur eine Zeile ansieht, sieht dasselbe Bild wie bei einer Auswahl; getragen wird das über die **Rücknahme**, und die bekommt mit **A17** (hier) und **TT-36** (Schwesterpapier) ihren Wächter. Wieder offen ist die Frage genau dann, wenn die Todo-Tabelle je eine Mehrfachauswahl bekommt (F-2). | erledigt |
| **OF-6** | **Die Doppelung im Vorlesefluß** (N-10 Punkt 2): Eine Vorlesehilfe liest im Tabellenmodus „Erledigt, Erledigt" (Kopf und `DoneFlag`) und „Tags, 11 Tags" (Kopf und Auslösername). Den Namen des Auslösers auf die Zahl allein zu kürzen wäre **schlechter**: Im Fokusmodus wird die Kopfzelle nicht zuverlässig mitgelesen, und „11" allein ist keine Auskunft. **Dieses Papier nimmt die Doppelung an** und schreibt sie hin, statt sie zu übersehen. Offen ist nur, ob jemand sie für einen Befund hält. | **angenommen, benannt** | spec-ux-reviewer |
