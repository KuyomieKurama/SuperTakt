# T-365 — Die Todo-Liste wird eine Tabelle, und die Tags erscheinen auf Anforderung

**Aufgabe:** T-365
**Rolle:** frontend-dev
**Datum:** 2026-09-14
**Status:** fertig — braucht Review (visual-qa und spec-ux-reviewer), zwei offene Fragen

---

## Artefakte

| Datei | Art |
|---|---|
| `apps/web/src/features/todos/TodoTable.tsx` | **neu** — acht Spalten, Kopf, Rumpf, Fuß, Zeile |
| `apps/web/src/features/todos/TodoTagsCell.tsx` | **neu** — Auslöser und Tag-Fläche |
| `apps/web/src/features/todos/TodoRow.tsx` | **entfernt** |
| `apps/web/src/features/todos/TodoListScreen.tsx` | Zustandsform des Laufbereichs, fester Hinweis, Tabellenfuß, Tag-Auflösung |
| `apps/web/src/styles/app.css` | `.todo-list`/`.todo-row`-Block ersetzt durch `.todo-table`, `.todo-col--*`, `.todo-cell--*`; die 68-rem-Regel gestrichen |
| `apps/web/src/styles/components.css` | `.tagsurface` neben `.menu`; ein Kommentar berichtigt (Fundstelle der Umbruchregel) |
| `apps/web/src/styles/theme-palettes.css` | `.todo-row` aus den `:is()`-Listen von `lines` und `zen` gestrichen (B-03/B-6) |

Nichts außerhalb von `apps/web/**`. `tests/e2e/**` **nicht** angefaßt.

---

## Zusammenfassung

Die Todo-Liste ist eine Tabelle in der Bauart des Bestands — `.table-wrap` als Laufbereich,
`.table` darin, `table-layout: fixed` mit `<colgroup>`, `min-width: 60rem` —, und der Laufbereich
wechselt seine Bauform mit dem Zustand: Tabellenform gefüllt, Stapelform leer/ladend/fehlerhaft.
Damit klebt der Tabellenkopf zum ersten Mal (gemessen: `th.top` vor und nach dem Rollen gleich und
gleich der Oberkante des Laufbereichs), der Hinweis auf ausgeblendete erledigte Todos steht als
`.screen__bar` fest darüber und „Weitere laden" ist der `<tfoot>`. Der Titel wird **umgebrochen**
und nicht gekürzt (B-1), `proof:clamp` bekommt keinen neuen Deckel — die Zahl deckelnder Klassen
steht unverändert bei 37. Die Tag-Zelle zeigt `todo.tagIds.length` in einem `button` mit
`aria-expanded`/`aria-controls`; die Marken erscheinen mit vollem Ordnerpfad in einem **nicht-modalen
Popover** (B-4), der den Tastaturfokus annimmt, mit `Escape` abweisbar ist, überfahrbar bleibt und
von keinem Zeitgeber geschlossen wird.

**Alle Spaltenbreiten sind gemessen und nicht geschätzt** (Chromium, echte Stilblätter, acht
Fensterformen und drei Gestaltungen): sieben feste Spalten = **43,5 rem** gegen das Budget von
44 rem aus `todo-tabelle.md` 4.3, Titelspalte **17,8 rem** im Standardfenster und 16,4 rem an der
getragenen Untergrenze — beides über dem Boden von 16 rem. Bei 1280 × 820 läuft die Tabelle
**nicht** waagerecht (`scrollWidth === clientWidth`), bei 960 × 640 läuft sie (B-2). **Die
Zusammenlegung von „Erledigt" und „Status" (Anweisung B-3 Punkt 1) war deshalb nicht nötig und
ist nicht gebaut** — die Anweisung lautete „kürzen, bis es paßt", und es paßt mit acht Spalten.
Die Rechnung des Prüfers (≈ 56,5 rem) stammt aus den Breiten der Buchungstabelle, die für
`table-layout: auto` und für „— ohne Call —" bemessen sind; an den tatsächlichen Zellinhalten
gemessen ist die Summe kleiner.

---

## Die vier Punkte aus `todo-tabelle.md` 10.3

### 1. Ü-1 — welcher Ark-UI-Baustein trägt die Fläche

**Gemessen am installierten Paket** (`node_modules/.pnpm/@ark-ui+react@5.39.0`):

- **`@ark-ui/react/hover-card` liegt vor.** Der Einstiegspunkt löst über den Platzhalter-Export
  `"./*"` auf `dist/components/hover-card/index.js` auf; darunter `@zag-js/hover-card@1.43.3`.
  T-362 R-c ist damit beantwortet: Der Baustein fehlt **nicht**.
- **Benutzt wird er trotzdem nicht** — B-4 hat das entschieden, und die Messung stützt es. Zwei
  Stellen im Bestand des Pakets machen P2 mit `HoverCard` unerreichbar:
  `hover-card.connect.js` setzt am Inhalt `tabIndex: -1` und bietet keinen Weg hinein, und
  `hover-card.machine.js` schließt bei `TRIGGER_BLUR`, solange nicht der Zeiger geöffnet hat
  (`guard: not("isPointer")`). Ein Fokus **in** der Fläche ist damit genau der Zustand, den die
  Maschine als „verlassen" liest.
- **Gebaut ist `@ark-ui/react/popover`** (`@zag-js/popover@1.43.3`), nicht modal. Er bringt von
  sich aus mit, was A-25.9 verlangt: `aria-haspopup="dialog"`, `aria-expanded` und `aria-controls`
  am Auslöser (letzteres nur, solange der Inhalt im Baum steht), `Escape` und Klick nach draußen
  über `trackDismissableElement`, den Tabulatorausgang über `proxyTabFocus`, und — weil der Inhalt
  keine fokussierbaren Kinder hat — `getInitialFocus` mit dem Rückfall auf den Inhalt selbst.
- **Zwei Dinge muß er nicht und tut deshalb diese Datei:** das Aufgehen beim Überfahren (zwei
  Zeitgeber, 220 ms hinein, 220 ms hinaus) und das Setzen des Fokus, weil der Baustein den Weg
  nicht kennt, über den aufgegangen wurde.
- **Eine Abweichung, die im Bericht stehen muß:** Der Inhalt trägt `role="dialog"`. `todo-tabelle.md`
  5.1 führt das als einen der vier Gründe gegen `DialogSurface` auf. Mit `modal={false}` ist es das
  APG-Muster für einen nicht-modalen Popover und kein Anspruch auf eine Entscheidung; ein
  zugänglicher Name ist gesetzt (`plural(n, "Tag", "Tags")`, kein neues Wort). Ohne `role="dialog"`
  gäbe es den Baustein nicht, und ohne den Baustein gäbe es P2 nicht.
- **Zwei Angaben, die erst die Messung erzwungen hat:** `lazyMount` und `unmountOnExit`. Ohne sie
  zeichnet Ark UI den Inhalt **von Anfang an** und versteckt ihn nur — bei hundert Zeilen hundert
  verborgene Flächen samt aller Marken, und `.tagsurface` wäre als Meßgröße wertlos, weil sie immer
  im Baum steht. Gemessen an der ersten Fassung der Sondierung: `toHaveCount(0)` war rot, bevor
  irgendetwas geöffnet war.

### 2. Welcher Ausgang aus 6.2 — die Fläche **schließt**

Gemessen am gerenderten Bild: Öffnen, dann den Laufbereich rollen ⇒ die Fläche ist weg
(`count() === 0`). Das ist der von B-5 vorgeschriebene Ausgang; kam sie über die Tastatur, steht der
Fokus danach auf dem Auslöser (Ark UI, `restoreFocus`, mit `preventScroll`). Der **innere** Lauf der
Fläche zählt nicht — gemessen: `scrollTop = 40` in der Fläche schließt sie nicht.

**Ein gemessener Nebenbefund, der eine Zeile Code gekostet hat und sonst ein Fehlerbericht geworden
wäre:** Ein Klick auf einen Auslöser, der nur halb im Bild steht, rollt ihn zuerst hinein — und
dieses Bildlaufereignis trifft erst im **nächsten Bild** ein, also nachdem die Fläche aufgegangen
ist. Ein Wächter, der auf das bloße Ereignis hört, schlösse sie in dem Augenblick, in dem sie
aufgeht (in der Sondierung reproduzierbar rot). Gemessen wird deshalb die **Bewegung des Ankers**
gegen seinen Stand beim Aufgehen, nicht das Eintreffen eines Ereignisses.

### 3. Die gemessene Spaltensumme

Gemessen im Browser mit den Stilblättern des Erzeugnisses, acht Fensterformen, dazu `clear`, `zen`
und `kompakt`. **Kein einziger Zellinhalt läuft über seine Zelle hinaus, in keiner der Messungen.**

| Spalte | `<col>`-Breite | breitester gemessener Inhalt | Verhalten |
|---|---|---|---|
| Erledigt | 9 rem / 144 px | Kästchen 24 + 8 + `DoneFlag` „Erledigt aufgehoben" 133,7 | Etikett bricht um, Zeilenhöhe unverändert 40 px |
| Call | 4,5 rem / 72 px | 46,8 (dicktengleich, sechs Ziffern) | nie gekürzt (TT-06) |
| **Titel** | **keine** | — | Umbruch, `overflow-wrap: anywhere` |
| Status | 7 rem / 112 px | „In Bearbeitung" 91,7 | Umbruch, kein Deckel |
| Frist | 7,5 rem / 120 px | „Heute fällig 31.12.2026" 141,7 | Wort/Datum umbrechen, Zeilenhöhe unverändert |
| Tags | 3,5 rem / 56 px | Kopf „TAGS" 53,3 | Auslöser ≥ 24 × 24 px |
| Buchungen | 6,5 rem / 104 px | Kopf „BUCHUNGEN" 100,5; Streifen mit vier Zuständen 140,1 | Streifen bricht um, **nie gekürzt** |
| Aktionen | 5,5 rem / 88 px | 2 × 28 + 4 + 24 = 84 | — |

**Summe der sieben festen Spalten: 696 px = 43,5 rem** (Budget 44 rem, `todo-tabelle.md` 4.3).
**Titelspalte: 284,5 px = 17,8 rem** bei 1280 × 820, **262,5 px = 16,4 rem** bei 960 und 1024,
444,5 px bei 1440, 308,5 px in `clear`. Der Boden von 16 rem ist überall gehalten.

Waagerechter Lauf, gemessen (`.table-wrap`, `scrollWidth/clientWidth`):
1280 × 820 **1030/1030** (kein Lauf), 1440 × 900 1190/1190, 1024 × 640 1008/774,
960 × 640 1008/710, 831 × 640 992/821. Das ist zeichengleich das Paar, das A12 verlangt.

**Der Preis steht dabei:** Vier Zellen bekommen in ihrer breitesten Ausprägung zwei Zeilen statt
einer — „Erledigt aufgehoben", „Überfällig"/„Heute fällig" mit Datum, „keine Buchung" und ein
Exportstreifen mit vier Zuständen. Alle vier bleiben innerhalb der Zeilenhöhe von 40 px (gemessen:
kurze Zeile 40, „Erledigt aufgehoben" 40); die Zeilenhöhe wächst nur beim langen **Titel**, und das
ist die Entscheidung aus B-1.

### 4. A13 — die Rechnung aus 6.3 trifft zu

**Gemessen und bestätigt.** Bei 960 × 640, nach dem Rollen um 288 px ans rechte Ende:

| | Breite | rechter Rand vorher → nachher |
|---|---|---|
| Blockelement im Laufbereich | **662 px** (= Inhaltsbreite) | 926 → **638** — es wandert aus dem Bild |
| `<tfoot><td colspan="8">` | **958,5 px** (= Tabellenbreite) | 1224 → 936 — es steht über der ganzen Tabelle |

Dasselbe bei 1024 (726 gegen 958,5) und bei 831 (789 gegen 958,5); bei 1280 und 1440 gibt es keinen
Lauf und beide sind gleich breit. **T-362 R-a ist damit bestätigt, nicht widerlegt — F-7 geht nicht
an T-361 zurück**, und „Weitere laden" gehört in den `<tfoot>`.

---

## Wie ich mit den Vorgaben aus dem Nachtrag umgegangen bin

| | Entscheidung | Umsetzung |
|---|---|---|
| **B-1** | Titel bricht um | `.todo-cell--title { overflow-wrap: anywhere }`; kein `title`-Attribut, kein Deckel. TT-07/TT-08 nicht als Meßlatte genommen. `proof:clamp` unverändert bei 37 Deckelklassen. |
| **B-2** | Lauf unterhalb 1280 erlaubt | `min-width: 60rem`; gemessen oben. |
| **B-3** | Budget | **Gemessen 43,5 rem ≤ 44 rem.** Remedy 1 (Erledigt + Status zusammenlegen) **nicht** angewandt — siehe „Annahmen" 1. Remedy 2 (Call-Zelle trägt nur die Nummer) **ist** gebaut; das Wort „Call" steht nur noch im Spaltenkopf. |
| **B-4** | Popover | `@ark-ui/react/popover`, `modal={false}`. Siehe Ü-1 oben. |
| **B-5** | Bildlauf schließt | gemessen; Fokus kehrt bei Tastaturöffnung auf den Auslöser zurück. Kein Zeitgeber schließt eine offene Fläche (30 s gemessen). |
| **B-6** | `.todo-row` bleibt, Palette wird angefaßt | Klasse am `<tr>`; `.todo-row` aus beiden `:is()`-Listen gestrichen — **mit gemessener Begründung**, siehe unten. |
| **B-7/B-8** | A-25.9 nachgeschärft | Gelesen. Die Unterschrift, der feste Hinweis, der Nachladefuß und der Tastaturfokus der Fläche sind gebaut, wie A-25.9 sie jetzt nennt; sichtbar bleibt die **Zahl**, keine Marke. |
| **N-1** | Kopfzellen sind keine Knöpfe | kein `.table__sort`, kein Pfeil, kein `aria-sort` — gemessen: `[aria-sort]` und `thead .table__sort` je `count() === 0`. |
| **N-2** | Kästchen liest sich wie Auswahl | Kopfzelle trägt das **Wort** „Erledigt"; Spalte heißt `.todo-col--done` und **nicht** `.table__select` (N-3); kein `aria-selected`, keine Sammelleiste; das Kästchen trägt je Zeile seinen eigenen Namen („…" als erledigt markieren), den eine Vorlesehilfe statt „auswählen" liest. Eine vierte, **sichtbare** Unterscheidung habe ich nicht erfunden — das wäre neue Gestalt ohne Deckung. Bleibt als offene Frage 2. |
| **N-4** | keine Randmarkierung | `.table__row > td:first-child` bleibt durchsichtig; `--running` ist das einzige Zeilenmerkmal. |
| **N-5** | fehlende Zeitwerte | 220 ms / 220 ms, an `InfoHint` (150/100) ausgerichtet und etwas ruhiger, weil hier eine ganze Spalte voller Auslöser steht. Versatz `gutter: 4`, `overflowPadding: 8`, `placement: "bottom-end"` mit Umklappen. Als Annahme geführt. |
| **N-6** | Hinweis im festen Teil | Der **zweite** Weg: die Zusage für Z0 fällt. Die Zahl steht erst mit der Antwort fest (`totalWithDone − page.total`); sie in den Bildschirmzustand zu heben hieße, im Ladezustand die Zahl des vorigen Laufs zu zeigen. Der Hinweis steht deshalb im Erfolgszweig als `.screen__bar` — dieselbe Bauform wie die Auswahlleiste der Buchungen. |
| **N-7** | unwahr gewordener Kommentar | `TodoListScreen.tsx:440–443` neu geschrieben; dazu `components.css:1115`, der auf `.todo-row__meta` als Fundstelle der Umbruchregel zeigte. |
| **N-8** | drei entfallende Zeichenketten | Nachgesucht, beide Wege: kein Prüffall hängt an „Call <Nummer>" in der Zeile, an `+n` oder an einem sichtbaren Tag-Namen in der Zeile. |
| **N-10** | vier doppelte Wortlaute | Gemessen: **keine** vorbestehende Abfrage wird vieldeutig — siehe unten. |

### B-6 zweite Hälfte: warum der Paletteneintrag trotzdem fällt

`.todo-row` überlebt als Haken am `<tr>`. **Die Kartenregel gilt ihm trotzdem nicht mehr**, und der
Grund ist am Bestand gelesen und nicht Geschmack:

- `lines` setzt `box-shadow: none`. Am `<tr>` löschte das `.table__row--active
  { box-shadow: inset 0 0 0 1px var(--border-accent) }` — die Markierung der Zeile im Zugriff.
  `border-color` täte dort ohnehin nichts: Die Kanten einer Tabelle sitzen an den Zellen.
- `zen` setzt `background-color: var(--bg-canvas)`. Das schlägt `.table__row:nth-child(even)` und
  nähme der Todo-Tabelle — und nur ihr — das Zebra, das die Buchungstabelle daneben behält.

`.card` und `.filterbar` bleiben in beiden Listen. Begründung steht als Kommentar an der Stelle.

---

## Der E-087/E-114-Abgleich, selbst gefahren

Beide Wege, Bauergebnisse (`apps/desktop/src-tauri/taskpane/`) ausgeschlossen.

**Die zehn neuen Wortlaute.** `git grep` über `tests/**` und `apps/*/test/**` nach
`getByRole('columnheader' …)`, `getByText('<Wort>')` und `getByLabel('<Wort>')`, dazu ein roher Lauf
über `apps/*/src`, `packages/*/src`, `tests/`:

- `getByRole('columnheader', …)` kommt im ganzen Baum **nicht vor**. Kein Spaltenkopf kann eine
  vorhandene Abfrage treffen.
- „Titel" und „Frist" als `getByLabel` stehen an sieben Stellen — **alle auf einen Dialog
  eingegrenzt** (`deadline-lifecycle` 101/102/136/161, `field-live-region-announcement` 77/189,
  `tag-input` 150). Ein `<th>` ist kein Formularetikett; keine wird vieldeutig.
- „Status", „Tags", „Frist" als `getByRole('combobox', { name })` (Filterleiste, `midnight-redraw`
  88, `tag-input` 217/313/336, `kanban` 142): andere Rolle als `columnheader`, keine Vieldeutigkeit.
- „Erledigte einblenden" (`toast-eviction` 172/181, `toast-tab-order-scroll` 52, `todo-revival`
  148/188/245) ist ein Knopf der Filterleiste und ein anderer Wortlaut als der Spaltenkopf.

> **Zählung zu R-7/N-10: null vorbestehende Abfragen werden vieldeutig.** Das ist nicht behauptet,
> sondern gefahren: 45 Prüffälle aus elf e2e-Dateien laufen gegen den umgebauten Stand grün,
> **ohne daß eine Zeile davon angefaßt wurde**.

**Die zwölf `.todo-row`-Fundstellen (E-114).** Die Klassenauflage trägt. Gefahren und grün, ohne
Änderung an `tests/e2e/**`:

| Datei | Fundstellen | Lauf |
|---|---|---|
| `deadline-lifecycle.spec.ts` | 87, 167, 194 | 3 Fälle grün |
| `midnight-redraw.spec.ts` | 78, 90 | 3 Fälle grün |
| `tag-input.spec.ts` | 212, 213 | 5 Fälle grün |
| `todo-revival.spec.ts` | 190 (Kommentar 192) | 5 Fälle grün |
| `focus-return-after-dialog.spec.ts` | 118 | 7 Fälle grün |
| `attachment-open-commands.spec.ts` | 238 | 5 Fälle grün |
| `foreign-title-display.spec.ts` | 53 (`.todo-row__title bdi`) | 1 Fall grün |
| `kanban.spec.ts` | 103 | 5 Fälle grün |
| `todo-filter-layout.spec.ts` | — (`.todo-list__ordering`) | 1 Fall grün, B-04 bestätigt |

Weitere Bezeichner, deren Benutzung geprüft wurde: `.doneflag` und `.deadline` (aus `todo-revival`
und `deadline-lifecycle` **innerhalb** der Zeile abgefragt — beide stehen weiterhin in ihr),
`ScreenBody label="Todos"` (`viewport-fit.spec.ts:873` grün). Die entfallenen Bezeichner
`todo-row__meta`, `__call`, `__main`, `__tags`, `__export`, `__actions`, `__more` haben **null**
Fundstellen in `tests/**`.

---

## Gefahrene Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | grün (alle acht Pakete, beide Prüf-`tsconfig` und `tests/e2e`) |
| `pnpm boundaries` | grün |
| `pnpm contrast` | 0 von 522 Paaren durchgefallen, 11/11 Gegenproben |
| `pnpm proof:all` (22 Läufe) | **0 fehlgeschlagen** |
| davon `proof:surface` | 54/0 — dieselbe Zahl wie vorher, 172 statt 171 Quelldateien |
| davon `proof:clamp` | 21/0, **37 deckelnde Klassen — unverändert**, also kein neuer Deckel |
| davon `proof:foreign` | 21/0, 185 behandelte Übergaben |
| davon `proof:callers`, `proof:locked`, `proof:layers` | 74/0, 9/0, 36/0 |
| `pnpm --filter @takt/web build` | grün |
| `vitest run apps/web` | 15 Dateien, 213 Fälle grün |
| `playwright … viewport-fit.spec.ts` | 10/10 grün (A1–A9 an sieben Fenstergrößen, A4/A5 „Todos") |
| `playwright …` acht Todo-Dateien | 3 + 27 + 5 = **35/35 grün**, ohne eine Zeile Prüfcode zu ändern |

**Ein Fehlschlag, der nicht meiner war:** `pnpm typecheck` war zwischenzeitlich rot mit
`apps/local-api/src/features/timer/head-t371-timer.ts(739,9): error TS6133`. Die Datei gehört einem
parallel laufenden Auftrag und existiert inzwischen nicht mehr; der Wiederholungslauf ist grün.

### Was ich am gerenderten Bild gemessen habe, statt es zu behaupten

Gefahren mit einer **Sondierung**, die den echten Dienst und die echte Oberfläche startet
(`tests/e2e/support/global-setup.ts`) und danach **restlos entfernt wurde** — sie lag unter
`apps/web/t365-probe/` und ist gelöscht. Die Prüffälle selbst gehören dem e2e-tester; was hier
steht, ist eine Messung, kein Prüfbestand.

| | gemessen |
|---|---|
| TT-09/TT-10 | Auslöser ist ein `button`, Text „11", Name „11 Tags", `aria-expanded="false"`, Trefferfeld ≥ 24 × 24 |
| TT-11 | ohne Tags: kein Knopf, Zelle leer |
| TT-12 | `Eingabe` öffnet, Fläche **hat den Fokus**, `Escape` schließt, Fokus danach auf dem Knopf, `Leertaste` öffnet ebenso — ohne jede Zeigerbewegung |
| TT-13 | Zeiger vom Knopf in die Fläche in zehn Schritten über die Lücke: bleibt offen |
| TT-14 | 6 s ohne Eingabe: steht noch (und 30 s im Entwurf ebenso) |
| TT-15 | Elternknoten der Fläche ist `document.body` |
| TT-16/TT-17 | Fläche vollständig im Fenster; ihr Kasten überschneidet den Auslöser **nicht** |
| TT-18/B-5 | Lauf des Laufbereichs schließt; Lauf **in** der Fläche schließt nicht |
| TT-19 | 40 Marken: Fläche läuft in sich, `Bild ab` bewegt sie nach Tastaturöffnung |
| TT-20 | zweiter Auslöser: weiterhin genau eine Fläche |
| TT-21 | elf Marken mit vollem Ordnerpfad; „Kunden / Nord" und „Standorte / Nord" unterscheidbar |
| TT-02/TT-03 | `[aria-selected]`, `.bulkbar`, `thead input`, `[aria-sort]`, `.table__sort` je **0** |
| TT-23 | Hinweis steht außerhalb von `.screen__body`, genau eine `.screen__bar`, bewegt sich beim Rollen um 0 px, Knopf „Einblenden" sichtbar |
| TT-25 | „Weitere laden (n übrig)" im `tfoot` |
| TT-28 | Doppelklick auf die Statuszelle öffnet die Detailansicht, auf dem Tag-Auslöser nicht |
| A10 | Kopf klebt: `top` vor = nach = Oberkante des Laufbereichs, bei echter Laufstrecke |
| A12 | 1280: kein waagerechter Lauf; 960: Lauf — beides |
| **TT-24 / AK-23** | **bei 960 × 640 mit stehendem Hinweis neu gemessen:** fester Teil 432,3 px von 588 px = **73,5 %**, Laufbereich behält 108 px (Boden 64 px), `.app__main` läuft nicht (588/588), das Dokument läuft nicht (640/640). **Kein Befund**; der Wert liegt unter den 75,9 %, die T-341 für die vorige Fassung gemessen hat — der Hinweis kostet netto nichts, weil die Tabelle an anderer Stelle Höhe freigibt. |

Bilder für visual-qa (1280 × 820, 960 × 640, Tag-Fläche offen, Leerzustand, `zen`, `lines`) sind
erzeugt und selbst angesehen; sie liegen außerhalb des Bestands und sind nicht versioniert.
**visual-qa hat noch nicht geprüft** — der Auftrag geht an ihn.

---

## Annahmen

1. **Acht Spalten, keine Zusammenlegung.** Die Anweisung B-3 nennt eine Reihenfolge, „in der du
   kürzt, **bis es paßt**", und die harte Grenze ist „bei 1280 × 820 kein waagerechter Lauf".
   Gemessen paßt es mit acht Spalten (43,5 rem, Titel 17,8 rem, `scrollWidth === clientWidth`).
   Ich habe Remedy 1 deshalb **nicht** angewandt: Sie widerspräche T-361 3.1/TT-01 und der Trennung
   aus E-023 (Kennzeichen gegen Status), und sie bräuchte eine Kopfzelle, die zwei Dinge benennt.
   Remedy 2 ist gebaut. **Wenn der Orchestrator die Zusammenlegung trotz der Messung will, ist das
   eine Entscheidung und kein Nachtrag — ich baue sie dann, sage aber vorher, was sie kostet.**
2. **Die Zeitwerte der Tag-Fläche** (220/220 ms) und ihr Versatz (`gutter: 4`, `overflowPadding: 8`,
   `bottom-end` mit Umklappen) sind von mir gewählt; N-5 stellt fest, daß T-362 sie nicht liefert.
3. **`--running` färbt die Zeile und trägt keine Randmarkierung** (N-4). Die alte Zeile hatte
   zusätzlich eine umlaufende Kante; in der Tabelle gibt es die nicht, und eine Schiene wäre die
   Randmarkierung, die N-4 gerade verneint.
4. **Der Timerknopf der Zeile ist `size="sm"`** und der Menüauslöser trägt `.table__row-menu` —
   dieselben Maße wie in der Buchungstabelle. Vorher war der Timerknopf `md` (32 px). Das ist eine
   sichtbare Änderung an einem Bedienelement, gedeckt durch „die Gestalt, die A-25.9 verlangt", und
   sie hält die Aktionsspalte bei 5,5 rem.
5. **Der Statusname bricht um statt zu kürzen** — dieselbe Entscheidung wie beim Titel, obwohl
   T-361 3.1 dort „darf kürzen" erlaubt. Ein Deckel wäre eine neue Deckelklasse für `proof:clamp`
   und verbürge fremden Text ohne Anzeige.
6. **`.todo-row__status` bleibt als Haken** an der Statuszelle, obwohl keine CSS-Regel ihn mehr
   liest — er ist der einzige Bezeichner, über den ein Prüffall die Statuszelle greifen kann.
7. **`TableShell` wird aus `features/bookings/BookingTable` gelesen.** `bookings ↔ todos` ist eine
   von `CLAUDE.md` benannte echte Kante. Der Baustein hat damit drei Leser außerhalb von `bookings`
   (Musterseite, Buchungen, Todos) und erfüllt das Kriterium für `shared/ui/` — ein Umzug wäre ein
   eigener Auftrag, siehe offene Frage 1.

---

## Risiken

| | Risiko | Stand |
|---|---|---|
| **R-1** | `role="dialog"` an der Tag-Fläche widerspricht `todo-tabelle.md` 5.1 | Bewußt, mit Begründung (Ü-1). Ein zugänglicher Name ist gesetzt; `aria-modal` fehlt, weil `modal={false}`. |
| **R-2** | Vier Zellen brechen in ihrer breitesten Ausprägung um | Gemessen, innerhalb der Zeilenhöhe. „keine Buchung" auf zwei Zeilen ist die häßlichste Stelle; sie zu vermeiden kostete 1 rem und risse das 44-rem-Budget. **Eine Frage an visual-qa.** |
| **R-3** | Der lange Titel macht die Zeile drei Zeilen hoch | Folge von B-1, gemessen: 76,6 px bei 110 Zeichen und 284 px Spaltenbreite. Die Tabelle ist dort schlechter überfliegbar — der Preis steht in `todo-tabelle.md` 4.4. |
| **R-4** | Der Zeiger öffnet, der Fokus **nicht** | Bewußt: Ein Tabulator durch hundert Zeilen soll nicht hundert Flächen aufgehen lassen. SC 2.1.1 ist über `Eingabe`/`Leertaste` erfüllt und gemessen. Ein Prüfer, der „öffnet bei Fokus" erwartet, findet es nicht. |
| **R-5** | `lazyMount`/`unmountOnExit` sind eine Verhaltensangabe, kein Aussehen | Ohne sie hundert verborgene Flächen im Baum. Wer sie beim Aufräumen streicht, merkt es nicht am Bild. Begründung steht an der Zeile. |
| **R-6** | Der Exportstand hängt weiter in derselben `Promise.all` wie die Liste | **Bestand, von T-365 nicht geändert** (T-361 R-6). Fällt `loadExportSummaries` aus, fällt die ganze Liste in den Fehlerzustand. |
| **R-7** | Der Hinweis fehlt jetzt im Lade- und Fehlerzustand | Folge von N-6, zweiter Weg. Sichtbar ist das nur im ersten Lauf; danach steht er. |

**Sicherheit.** Keine neue Vertrauensgrenze: keine Adresse, keine Route, keine Datei, kein
Öffnen-Weg. Die Tag-Fläche zeigt **fremden Text** auf einer Fläche, die es bisher nicht gab —
Tag-Namen und Ordnerpfade können aus dem Add-in oder einem Fremdimport stammen. Sie laufen
ausschließlich über `TagChip`, der `Foreign` beziehungsweise `foreignText` bereits trägt; ein
`path.join(" / ")` außerhalb des Bausteins gibt es nicht. Der Todo-Titel bleibt `ForeignText` und
läuft über `Foreign`; die Call-Nummer ebenso. `proof:foreign` ist grün (21/0, 185 behandelte
Übergaben). Kein Deckel kam hinzu, also kann kein `UncappedText` still beschnitten werden.

---

## Offene Fragen an den Orchestrator

1. **Soll `TableShell` nach `shared/ui/` wandern?** Er hat mit dieser Aufgabe drei Leser außerhalb
   von `features/bookings` (Musterseite, Buchungen, Todos) und erfüllt damit die Hausregel für
   `shared/ui/`. Der Umzug fasst `BookingTable.tsx`, `BookingsScreen.tsx` und `DataSection.tsx` an
   — sauber in einer Welle ohne Nachbarn, aber nicht in dieser.
2. **N-2, die Nutzerseite:** Soll das Erledigt-Kästchen in Spalte 1 sichtbar anders aussehen als ein
   Auswahlkästchen? Ich habe die drei strukturellen Auflagen gebaut, aber **keine vierte, sichtbare**
   Unterscheidung erfunden — das wäre neue Gestalt ohne Deckung, und A-25.9 nennt sie nicht.
   Entscheidung für ui-designer und visual-qa.
3. **Zur Kenntnis, keine Frage:** Die Zusammenlegung von „Erledigt" und „Status" ist nach der
   Messung nicht nötig und nicht gebaut (Annahme 1). Wenn die Anweisung unbedingt gemeint war,
   sagen Sie es — es sind zwei Stunden, nicht zwei Tage.

---

## Nächster Schritt

1. **visual-qa** prüft das gerenderte Bild — besonders `zen`, `lines` und `plainspace` (N-9: die
   Todo-Ansicht zeigt dort erstmals das Zebra der Tabelle), die vier umbrechenden Zellen (R-2) und
   die Tag-Fläche in allen sieben Paletten und beiden Farbmodi (TT-15).
2. **e2e-tester** in der nächsten Welle: A10 bis A15 samt der sechs Gegenproben in
   `viewport-fit.spec.ts`, dazu TT-01 bis TT-30 in der Fassung nach T-366 (TT-04, TT-07, TT-08 und
   TT-18 sind durch B-1/B-2/B-5 überholt). Die zwölf `.todo-row`-Fundstellen bleiben, wie sie sind —
   sie sind gefahren und grün.
3. **ux-designer und ui-designer** tragen die Entscheidungen aus T-366 in ihre Papiere nach; mein
   gemessenes Spaltenbudget (43,5 rem, Titel 17,8 rem) und der bestätigte A13-Fall gehören in
   `todo-tabelle.md` 4.3 und 6.3, wo heute noch die gerechneten Zahlen stehen.
