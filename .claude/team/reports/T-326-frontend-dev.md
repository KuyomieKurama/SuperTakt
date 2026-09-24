# T-326 — Fensterfeste Flächen bauen

**Rolle:** frontend-dev. **Stand:** 2026-09-13. **Vorlagen:** T-323
(`docs/design/fensterfeste-flaechen.md`), T-322 (`docs/design/fensterfeste-flaechen-fluss.md`),
E-112.

**Status:** braucht Review — gebaut und im Browser gemessen; **drei Stellen** weichen mit
gemessener Begründung von den Vorlagen ab und gehören dem Orchestrator (Abschnitt 3).

---

## 1. Was gebaut ist

`.app__main` ist vom einzigen Laufbereich zum **Rahmen** geworden: Rasterfach `minmax(0, 1fr)`,
kein Innenabstand, keine Rinne. Jede der elf Ansichten hat jetzt `.screen__header` (fest),
0..n `.screen__bar` (fest) und **genau einen** `.screen__body` (läuft). Die Zeiterfassung trägt
`.screen__body--frame` mit zwei `.runarea`, die Einstellungen eine feste Schiene neben einer
`.runarea`, das Board den waagerechten Rahmen wie bisher.

Die vier `:has()`-Regeln für das Kanban (`viewport-layout.css` Z. 54–67) sind **gefallen**; das
allgemeine Muster nimmt sie auf. Die Formulardialoge sind unberührt.

`id="inhalt"` und der Fokusring sind an den Laufbereich gewandert. `ROUTE_NAMES` steht in
`router.ts`, vollständig gegen `RouteName` getypt (`{ [Name in RouteName]: Name }` + `Object.values`,
ohne Typzusicherung — ein fehlender **und** ein überzähliger Eintrag sind ein Typfehler).

Die Buchungstabelle ist selbst der Laufbereich (`class="screen__body table-wrap"`), und der
klebende Tabellenkopf greift damit zum ersten Mal — **gemessen**, nicht behauptet (Abschnitt 4).

### Geänderte Dateien

| Datei | Was |
|---|---|
| `apps/web/src/styles/viewport-layout.css` | Neu geschrieben: das Muster, die drei Rahmenansichten, `:has()` weg |
| `apps/web/src/styles/app.css` | `--screen-inset`, `.app__main` als Rahmen, `.boot--inline`, Fokusring an den Laufbereich, `.settings-rail` ohne Klebung, `.screen--dashboard > .screen__body > .card` |
| `apps/web/src/app/App.tsx` | Marke weg von `.app__main`, Ladeersatz `.boot--inline`, `UnknownScreen` und Nachlademeldung in `.screen` + `.screen__body` |
| `apps/web/src/app/router.ts` | `ROUTE_NAMES` |
| `apps/web/src/shared/ui/ScreenBody.tsx` | **neu** — `ScreenBody`, `ScreenFrame`, `RunArea`, `runAreaSurface`, `CONTENT_ANCHOR_ID` |
| `apps/web/src/shared/ui/AsyncBoundary.tsx` | `fallbackFrame` — Skelett und Fehlerfläche bekommen einen Laufbereich, wo er erst im Erfolgsfall entsteht |
| `apps/web/src/shared/ui/Primitives.tsx` | `Card.runArea` — der Kartenrumpf als `.runarea` |
| `apps/web/src/features/bookings/BookingTable.tsx` | `surface` — die Tabellenfläche **ist** der Laufbereich |
| die elf Ansichten | `.screen__body` / `.screen__bar` / `.screen__body--frame` eingezogen |

---

## 2. Wie gemessen wurde

Kein Prüffall geschrieben (Auflage). Gemessen mit einem **Wegwerfaufbau** außerhalb des
Bestands: eine Attrappe des lokalen Dienstes mit erfundenen Daten auf 127.0.0.1:18901 und der
Entwicklungsserver auf 5299, Chromium über Playwright. **Die Anwendung des Benutzers auf 17843
und 17844 wurde nicht angefasst** — beide Ports waren während der ganzen Aufgabe unbelegt, und
der Aufbau band auf eigene. Beide Prozesse sind beendet, die Ports sind frei.

Vorrat nach T-323 9.4: 60 Todos (einer mit einem 110 Zeichen langen Titel ohne Wortgrenzen),
80 Buchungen mit langen Leistungstexten, 12 Board-Spalten mit je 14 Karten, ein sechs Ebenen
tiefer Tag-Baum, 40 Protokollzeilen, 30 Exportgruppen.

- **88 Paare** (11 Ansichten × 8 Fenstergrößen: 1280×820, 1024×640, 1440×900, 960×640, 831×640,
  1280×480, 640×480, 320×256).
- **400 Kombinationen** Gestaltung × Dichte × Farbmodus (20 × 2 × 2) über fünf Ansichten.
- Gezielte Messungen: klebender Tabellenkopf, Portalfall, Rinne, Tastatur, Umbruch bei 68 rem,
  Rückfall im sehr niedrigen Fenster.

---

## 3. Drei Abweichungen von den Vorlagen — sie gehören dem Orchestrator

### 3.1 `position: relative` an `.screen__body` und `.runarea` — gegen T-323 8.4 und E-112

T-323 8.4 und E-112 verbieten die Zeile ausdrücklich; der Auftrag nennt sie als erste der drei
Fallen. **Die Annahme dahinter ist im Browser gemessen falsch.**

Ein absolut positionierter Nachfahre im Laufbereich hat als umschließenden Block `.app__main`.
Er wird an seiner **statischen** Stelle plaziert — also am unteren Ende der Liste — und läuft mit
dem Bildlauf des Laufbereichs **nicht mit**. Damit trägt er zum Bildlaufbereich des Rahmens bei,
und der Rahmen bekommt **seine eigene Bildlaufleiste neben der des Laufbereichs**: zwei
senkrechte Leisten nebeneinander, genau das Symptom, das dieser Auftrag beheben soll.

Gemessen ohne die Zeile (Chromium, 1280 × 820, `.app__main.scrollHeight / clientHeight`):

| Ansicht | Rahmen | Verstöße | Umschläge |
|---|---|---|---|
| Todos | 4242 / 768 | 128 | `.todo-row__check`, `.summary-strip__item`, `.chip` |
| Todo-Detail | 5338 / 768 | 81 | Zellen, `.chip` |
| Buchungen | 3564 / 768 | 140 | `.table__secondary`, Zellen |
| Zeiterfassung | 5723 / 768 | 76 | `.badge` |
| Exportprotokoll | 3573 / 768 | 55 | `.auditrow__actor`, `.auditrow__transition` |
| Tags | 1224 / 768 | 4 | `.chip` |
| Dashboard | 905 / 768 | 4 | `.badge` |

Jeder Verstoß ist ein `span.visually-hidden` — **dieselbe Hilfsklasse, die in T-057 die
Fensterbildlaufleiste erzeugte**, eine Ebene höher. Mit der Zeile: alle elf Ansichten
`768 / 768`, null Verstöße.

Die Folge, die T-323 vermeiden wollte, tritt ein und ist harmlos: Es gibt zwei umschließende
Blöcke — `.app__main` für alles außerhalb des Laufbereichs (Kopf, Leisten, Ladeersatz) und den
Laufbereich für alles darin. `position: relative` ohne `z-index` bildet **keinen**
Stapelzusammenhang und ist **kein** umschließender Block für feste Positionierung; `.scrim` und
`.toast-layer` bleiben am Fenster (nachgemessen: Dialoge zentrieren weiter im Fenster).

Die Alternative wäre, jeden Umschlag eines `.visually-hidden` einzeln positioniert zu machen —
sieben Klassen heute, und die achte bricht die Zusage still.

**Frage an den Orchestrator:** E-112 und T-323 8.4 anpassen, oder die Zeile herausnehmen und die
zweite Bildlaufleiste in Kauf nehmen? Ohne sie ist die Anforderung des Auftraggebers nicht
erfüllt.

### 3.2 `.screen__body--frame` läuft `overflow-y: auto` statt `overflow: hidden` — gegen T-323 3.2

Mit `hidden` gilt für den Rahmen dieselbe Rechnung wie für den Laufbereich: Er fällt auf den
Boden von 4 rem, und was darin **feststeht**, wird abgeschnitten — die Bereichsschiene der
Einstellungen (gemessen etwa 420 px), die 12 rem Mindesthöhe einer Kanban-Spalte, die Karte
„Timer". Das ist T-322 R-d: Inhalt wird unerreichbar. Mit `auto` ist der Rückfall derselbe wie
eine Ebene höher und genauso selbsttätig; im getragenen Bereich kostet die Zeile nichts, weil
die Kinder des Rahmens genau seine Höhe annehmen (gemessen: Einstellungen 1280 × 820, keine
laufende Fläche; Einstellungen 1280 × 300, Rahmen läuft 577 / 175, Schiene erreichbar).

Dazu zwei Zeilen, die T-323 nicht nennt und die aus derselben Messung folgen:

- `.screen__body--frame > .board { min-block-size: calc(12rem + var(--space-3)) }` — der Boden
  einer Kanban-Spalte plus der untere Innenabstand des Boards. Aus vorhandenen Werten gerechnet,
  nicht geraten.
- `.time-layout__main > .card, .time-layout__side > .card { flex: none }` — `.card` trägt
  `overflow: hidden`; eine Karte, die schrumpfen darf, schneidet ihren eigenen Inhalt ab. Im
  ersten Bau stand von der Karte „Timer" nur Titel und Beschreibung da, von der Karte „Heute"
  nur der Titel. **Gefunden im Bild, nicht im Quelltext.**

### 3.3 `tabIndex={0}` statt `{-1}` am Laufbereich — der Auftrag nennt `{-1}`

T-322 R-4 verlangt ausdrücklich: **jeder** Laufbereich liegt genau einmal in der
Tabulatorreihenfolge und trägt einen zugänglichen Namen (AK-14, AK-15); bei zwei Laufbereichen
trägt die Sprungmarke ohnehin nur einer. `{-1}` erfüllt die Sprungmarke, aber nicht AK-14/AK-15.
Gebaut ist deshalb: `role="region"` + `aria-label` aus einem **vorhandenen** Text + `tabIndex={0}`,
und `id="inhalt"` an genau einem davon je Ansicht. Ausnahme: der Lade- und Fehlerzustand der
Todo-Detailansicht hat keinen vorhandenen Namen (die Überschrift **ist** das Todo) — dort steht
`tabIndex={-1}` ohne Rolle und ohne Namen.

Gemessen: `.screen__body` fokussiert, `outline-offset: -4px`, **Bild-ab rollt 353 px**.

---

## 4. Die 22 Akzeptanzkriterien aus T-322

| | Kriterium | Befund |
|---|---|---|
| **AK-01** | Dokument scrollt nicht | **erfüllt** — 88/88 Paare `scrollHeight ≤ clientHeight+1` und `scrollWidth ≤ clientWidth+1`, einschließlich 320×256; dazu 400 Kombinationen aus 20 Gestaltungen × 2 Dichten × 2 Farbmodi über fünf Ansichten, null Abweichungen |
| **AK-02** | Zahl der laufenden Flächen = die aus Abschnitt 4 | **teilweise** — im getragenen Bereich genau eine je Ansicht, Zeiterfassung breit genau zwei (`1469/278` und `5159/204`). **In Z6 nicht null:** Der Rückfall aus T-323 7.2 lässt den inneren Laufbereich auf seinem 4-rem-Boden stehen, während `.app__main` läuft (Todos 1280×300: `.app__main` läuft **und** `.screen__body` 3932/64). Siehe Abschnitt 5, Befund 1 |
| **AK-03** | keine zwei laufenden Flächen übereinander | **erfüllt im getragenen Bereich** — Zeiterfassung bei 1000 px Breite: genau **eine** laufende Fläche (der Rahmen, 3632/695), die beiden `.runarea` laufen dort nicht. In Z6 nicht erfüllt, siehe AK-02 |
| **AK-04** | fester Teil hat keine eigene Bildlaufleiste | **erfüllt** — `.screen__header` und `.screen__bar` tragen `flex: none` und kein `overflow`; in keiner der 88 Messungen eine laufende Fläche im festen Teil |
| **AK-05** | Reihenfolge zeichengleich | **erfüllt** — kein Element wandert über ein anderes. Die Zusammenfassungszeile des Exports bleibt unter der Karte „Vorlage und Rundung" (OF-2 unberührt), `.list-more` bleibt am Ende der Liste, der Nachladefuß des Boards bleibt unter dem Board |
| **AK-06** | bei größtem Bildlauf weiter sichtbar: Titel, Primäraktion, Filterleiste, Reiter | **erfüllt** — `.screen__header.getBoundingClientRect().top` vor und nach dem Rollen ans Ende identisch (76 → 76) auf allen 88 Paaren |
| **AK-07** | Bildschirmleerzustände zentriert, Kartenleerzustände unverändert hoch | **erfüllt, mit einer Bauformabweichung** — umgesetzt als `margin-block: auto` an `.screen__body > .empty`, `> .table-shell`, `> .board-setup` statt `justify-content: center` am Laufbereich. Grund: Auf der Export-Ansicht steht die Karte „Vorlage und Rundung" **über** dem Leerzustand; ein zentrierter Stapel hätte sie mitgenommen, und das wäre AK-05 verletzt. Kartenleerzustände liegen in `.card__body` und sind nicht betroffen |
| **AK-08** | in Z0/Z3/Z4 bleibt der feste Teil bedienbar | **erfüllt für Z0/Z3/Z4 der neun Ansichten mit Kopf außerhalb der Ladehülle** (gemessen an Todos und Buchungen: Filterleiste steht während Skelett und Fehlerfläche). Todo-Detail hat konstruktionsbedingt keinen festen Teil in Z0/Z4 (T-322 4.3) |
| **AK-09** | Bildlaufstelle nach Nachladen (Z5) | **nicht gemessen** — der Wegwerfaufbau löst kein Nachladen aus. Der Laufbereich wird beim Nachladen nicht neu aufgebaut (React behält den Knoten), die Stelle sollte stehen; das ist gelesen, nicht gemessen |
| **AK-10** | Inhaltsbreite ändert sich nicht mit der Bildlaufleiste | **erfüllt** — Todos, lange Liste gegen gefilterte kurze Liste: `screen__body.clientWidth` beide Male **1030 px**. `scrollbar-gutter: stable` an jedem Laufbereich |
| **AK-11** | Tabellenkopf bleibt beim senkrechten Lauf stehen, wandert waagerecht mit | **erfüllt und gemessen** — Buchungen 1280×820: Laufbereich auf 2848 px gerollt, `thead th`-Oberkante **402,30 vorher und 402,30 nachher**. Die Zusage aus `components.css` greift damit zum ersten Mal. Waagerecht wandert er mit, weil beide Achsen in derselben Fläche laufen |
| **AK-12** | Seite wird durch die Tabelle nicht breiter | **erfüllt** — Buchungen 960×640: `.screen__body.scrollWidth` 1567 gegen `clientWidth` 710 (die Tabelle **kann** laufen) bei `.app__main.scrollWidth === clientWidth` |
| **AK-13** | Zeilenmenüs bei vollem Waagerechtlauf erreichbar, Tabulator holt das Kästchen zurück | **erfüllt** — nach `scrollLeft = scrollWidth` (847) holt der Fokus auf ein Auswahlkästchen die Spalte zurück (`scrollLeft` 0, Kästchen sichtbar). Die Wege über rechte Maustaste und `Umschalt`+`F10` liegen unverändert am `<tr>` |
| **AK-14** | Sprungmarke wie bisher, danach jeder Laufbereich ein Tabulatorschritt entfernt, Bild-ab läuft | **teilweise — und ein Befund über die Sprungmarke selbst, siehe Abschnitt 5 Befund 2.** Der Laufbereich ist fokussierbar, liegt in der Tabulatorreihenfolge und Bild-ab rollt ihn (353 px gemessen). Die Sprungmarke selbst tut das jedoch **schon heute nicht**, was sie verspricht |
| **AK-15** | jeder Laufbereich hat Namen und sichtbaren Fokusring | **erfüllt bis auf eine benannte Ausnahme** — Namen: „Dashboard", „Todos", Titel des Todos, „Kanban", „Zeiterfassung" + „Todo wählen" + „Buchungen von heute", „Buchungen", „Export", „Exportvorlagen", „Exportprotokoll", „Tags", „Einstellungen" + Bereichsüberschrift. Alle aus vorhandenen Texten. Ausnahme: Lade- und Fehlerzustand der Detailansicht (kein vorhandener Name). Ring: `outline-offset: calc(var(--focus-ring-offset) * -2)`, gemessen −4 px |
| **AK-16** | ein mit dem Tabulator erreichter Eintrag ist sichtbar | **erfüllt, soweit gemessen** — waagerecht an der Buchungstabelle gemessen (AK-13). Keine Achse mit Inhalt steht auf `hidden`: `.app__main` ist waagerecht `hidden`, trägt aber keinen waagerecht laufenden Inhalt mehr — der liegt in `.board` und `.table-wrap` |
| **AK-17** | kein `.visually-hidden` erzeugt Dokumentbildlauf | **erfüllt — und es war der teuerste Befund dieser Aufgabe.** Siehe 3.1: ohne `position: relative` am Laufbereich erzeugten 488 solcher Spannen über sieben Ansichten den **Rahmen**bildlauf. Mit der Zeile: null |
| **AK-18** | unter der Grenze läuft `.app__main` wieder, alles bleibt bedienbar | **erfüllt für „bedienbar", nicht für „als Einziges"** — bei 1280×300 läuft `.app__main` auf Todos und Kanban, nichts wird abgeschnitten, alles ist erreichbar. Der innere Laufbereich läuft dabei weiter (4 rem). Gilt auch fürs Kanban (R-3 aus 4.4 umgesetzt) |
| **AK-19** | der Wechsel über die Grenze verliert den Fokus nicht | **erfüllt** — entschieden ist ausschließlich in CSS. Es gibt keinen `resize`-Zuhörer und keinen Neuaufbau; die einzige Medienstufe ist die bestehende bei 68 rem für die Zeiterfassung |
| **AK-20** | der Rückfall richtet sich nach der Höhe des Inhaltsbereichs | **erfüllt** — der Rückfall hängt an `.screen` gegen die Rasterzeile `main`, nicht am Fenster. Eine stehende Hüllenmeldung oder der Fassungshinweis nehmen dieser Zeile Höhe und schalten ihn entsprechend früher, ohne dass eine Zahl das kennen muss |
| **AK-21** | Kanban und Formulardialoge wie vorher | **erfüllt** — Dialoge unberührt (`viewport-layout.css` Z. 53–92 zeichengleich). Kanban: Kopf, Werkzeugzeile, Board, Nachladefuß und Spaltenläufe wie bisher, nur ohne `:has()`; dazu R-3 |
| **AK-22** | kein Oberflächentext neu, geändert oder gestrichen | **erfüllt** — `proof:locked` grün (9/9), `proof:surface` grün (27/27). Die zugänglichen Namen sind ausnahmslos vorhandene Texte |

---

## 5. Befunde, die nicht meine Änderung sind — aber jetzt sichtbar werden

**Befund 1 — Z6 lässt zwei Läufer stehen. Die Papiere widersprechen sich hier.**
T-322 AK-02 verlangt im Zustand Z6 **null** innere Laufbereiche, T-323 7.2 baut den Rückfall
ausdrücklich **ohne** `@media (max-height: …)`. Beides zusammen geht nicht: Der 4-rem-Boden, der
den Rückfall auslöst, ist zugleich ein 4 rem hoher Bildlaufkasten. Gemessen bei 1280×300:
Todos `.app__main` läuft **und** `.screen__body` 3932/64; Kanban zusätzlich zwölf
`.kcolumn__body` mit je 50 px. Unerreichbar wird dabei nichts. Wer AK-02 wörtlich will, braucht
die Höhenabfrage, die T-323 ablehnt — das ist eine Entscheidung, keine Zeile Code.

**Befund 2 — die Sprungmarke „Zum Inhalt springen" führt heute auf das Dashboard.**
Gemessen: Tabulator auf `.skip-link`, Eingabe. Danach steht `location.hash` auf `#inhalt`,
`parseRoute("#inhalt")` erkennt die Adresse nicht und fällt auf `dashboard` zurück, `useRoute`
tauscht die ganze Ansicht aus, und der Fokus landet auf `<body>`. **Das ist unabhängig von
T-326** — Marke, Verweis und Router sind an dieser Stelle unverändert; vor dem Umbau geschah
dasselbe, nur dass die Marke an `.app__main` hing. Vorschlag: `parseRoute` gibt für einen Anker,
der nicht mit `#/` beginnt, die **angezeigte** Route zurück statt der Vorgabe; dann wirkt die
Marke, wie sie soll. Eigener Auftrag — er ändert Routerverhalten.

**Befund 3 — zwei zugängliche Namen sind jetzt doppelt vergeben.**
Der E-087-Abgleich nach T-322 Abschnitt 10 ist gemacht (`git grep` **und** ein roher Lauf über
`tests/`, `apps/*/src`, `packages/*/src`): **kein** vorhandener Prüffall fragt nach einem der
dreizehn Namen, es fällt heute keiner um. Zwei Namen kommen aber ab jetzt zweimal vor:

- `aria-label="Todos"` an `.screen__body` **und** an `<ul class="todo-list">` (`TodoListScreen.tsx`).
- `aria-label="Exportvorlagen"` an `.screen__body` **und** an `<nav class="tpl-list">` (`TemplateList.tsx`).

Eine Abfrage ohne Rolle (`getByLabel('Todos')`) ist damit im strikten Modus vieldeutig. Das ist
genau R-g aus T-322. Auflage an unit-tester und e2e-tester: Rolle mitgeben
(`getByRole('list', { name: 'Todos' })`).

**Befund 4 — `#inhalt` im Prüfbestand: elf Dateien, nicht eine.**
Der Auftrag nennt eine Fundstelle (`attachment-legacy-todo-regression.spec.ts:51`). Gemessen
sind es **elf Dateien**, und **sieben davon werden durch die Verlegung der Marke rot**, weil sie
`#inhalt` als Geltungsbereich für Knöpfe benutzen, die im **Kopf** der Todo-Detailansicht stehen
— „Timer starten", „Timer stoppen", „Zeit von Hand". Der Kopf liegt künftig **außerhalb** des
Laufbereichs, der Geltungsbereich findet die Knöpfe also nicht mehr. Nach der Auflage nicht
repariert, hier gemeldet:

| Datei | Zeilen | Warum rot |
|---|---|---|
| `tests/e2e/pool-movement-sentence.spec.ts` | 90, 95, 186, 191 | „Timer starten" im Kopf von S-03 |
| `tests/e2e/todo-revival.spec.ts` | 74–75, 106–108 | „Timer starten"/„Timer stoppen" im Kopf |
| `tests/e2e/manual-booking-movement.spec.ts` | 102–103, 175–176, 228–229 | „Zeit von Hand" im Kopf |
| `tests/e2e/timer-prompt-setting.spec.ts` | 21–26, 58–63 | „Timer starten"/„stoppen" im Kopf |
| `tests/e2e/timer-stop-announcement.spec.ts` | 66–72, 151–158, 470–474 | dieselbe Klasse |
| `tests/e2e/web-build-smoke.spec.ts` | 405–417 | dieselbe Klasse |
| `tests/e2e/attachment-legacy-todo-regression.spec.ts` | 51–53 | **ebenfalls rot** — „Timer starten"/„Timer stoppen" im Kopf, nicht im Laufbereich. Die Einschätzung „bleibt gültig" aus T-323 8.5 ist am laufenden Bild widerlegt |
| `tests/e2e/version-check-live.spec.ts` | 78, 158, 174, 299 | **bleibt grün** — nur `toBeVisible()` auf `#inhalt` |

Die Behebung ist in jedem Fall dieselbe und klein: `page.locator('.screen')` statt
`page.locator('#inhalt')`, wo der Geltungsbereich „die Ansicht" meint. Das gehört in die nächste
Welle (T-315/T-316).

**Befund 5 — zwei waagerechte Überläufe im festen Kopf, vorbestehend.**
`.app__main.scrollWidth > clientWidth` auf dem Board ab 1024 px abwärts (825/784) und auf dem
Dashboard bei 320 px (327/320). Quelle ist beide Male `.screen__actions` im Bildschirmkopf: Die
Knöpfe passen nicht in die Kopfbreite. `.app__main` schneidet das ab wie bisher; die Bauart ist
unverändert. Dazu die Todo-Detailansicht mit dem 110 Zeichen langen Titel ohne Wortgrenzen:
`.screen__title` deckelt ihn nicht (1454/1040). Mit einem gewöhnlichen Titel ist dieselbe Ansicht
grün. Drei Fälle für einen eigenen Auftrag, keiner davon von T-326 verursacht.

**Befund 6 — der Rückfall greift auf dem Board schon bei 960 × 640, der getragenen Untergrenze.**
Der feste Teil des Boards ist dort **537 px** hoch (Titel, zweizeiliger Erklärsatz, Umschalter,
„Spalten verwalten") plus 36 px Werkzeugzeile, bei 588 px Inhaltshöhe. T-322 R-h benennt genau
das: „Der feste Teil wächst über die Jahre." Der Rückfall ist die richtige Antwort, aber die Zahl
gehört ins Board: 537 von 588 px sind 91 % des Inhaltsbereichs für die Steuerung. Auf den Todos
sind es bei 831 × 640 gemessen 320 von 415 px.

---

## 6. Was ausdrücklich gemessen wurde, weil der Auftrag es verlangt

- **Klebender Tabellenkopf** (Punkt 7 des Auftrags): greift. 402,30 px vor und nach 2848 px
  Bildlauf. Vorher wirkungslos, weil `.table-wrap` über `overflow-x: auto` auf beiden Achsen
  Bildlaufkasten war und das `sticky` abfing.
- **Portalfall R-323-1** (T-323 8.2): **gemessen, in Ordnung.** Zeilenmenü in der gelaufenen
  Buchungstabelle: Die Liste liegt im Portal am Dokumentkörper (`imPortal: true`); beim Rollen
  des Laufbereichs um 150 px wandert der Auslöser um −150 px **und die Liste um −150 px** — der
  Abstand bleibt 36 px, die Liste folgt ihrem Anker. Auswahlfelder benutzen dieselbe
  Positionierung derselben Bibliothek.
- **Die 4 rem aus T-323 7.2** (offene Frage 3): Sie bleiben als Zahl richtig — sie sind der
  Boden, nicht die Grenze. Was gemessen dazugehört, steht in Befund 6: Der feste Teil ist auf dem
  Board 537 px und auf den Todos 320 px hoch, und **daran** hängt, wann der Rückfall greift.
- **Alle neunzehn Gestaltungen und beide Dichten** (A-21.4): 400 Kombinationen, null
  Abweichungen bei AK-01, AK-02 und „genau ein `.screen__body`".

---

## 7. Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | grün (alle acht Pakete, Prüf- und E2E-Konfigurationen) |
| `pnpm boundaries` | grün |
| `pnpm contrast` | grün — 0 von 522 Paaren durchgefallen |
| `pnpm build` (`@takt/web`) | grün |
| `pnpm proof:surface` | grün, 27/27 |
| `pnpm proof:clamp` | grün, 21/21 |
| `pnpm proof:foreign` | grün, 21/21 |
| `pnpm proof:locked` | grün, 9/9 |
| `pnpm exec vitest run` | grün — 1887 bestanden, 2 übersprungen, **kein vorbestehender Prüffall rot** |
| `pnpm test:e2e` | **nicht gefahren** — der Lauf bindet den lokalen Dienst auf 17843, und auf dieser Maschine läuft der Bestand des Benutzers. Befund 4 nennt, was dort rot würde |

---

## 8. Annahmen, ohne zu fragen entschieden

1. **Dialoge bleiben Geschwister des Laufbereichs**, nicht Kinder. Sie sind `position: fixed` und
   damit keine Flex-Elemente; `.screen__body` bleibt das letzte **in-flow**-Kind von `.screen`.
2. **`.list-more` läuft mit**, am Ende der Liste (Todos, Protokoll) — wie im Auftrag verlangt.
   **Auf dem Board bleibt der Nachladefuß fest**, weil T-322 4.4 das Board ausdrücklich
   „unverändert" lässt und den Fuß dort als stehend führt. Er liegt **im** Rahmen mit
   `flex: none`, damit `.screen__body` das letzte Kind von `.screen` bleibt.
3. **`.screen__bar` ist immer ein Umschlag**, kein Zusatz an einer vorhandenen Leiste. Sonst
   kollidiert `padding-inline` mit der eigenen Polsterung (`.bulkbar` hätte 24 statt 32 px
   Einzug bekommen) oder liegt innerhalb eines Rahmens (`InlineMessage`).
4. **`Card.runArea` und `BookingTable.surface`** statt eines zusätzlichen Kastens: Der
   Kartenrumpf und die Tabellenfläche **sind** der Laufbereich; ein Umschlag wäre eine zweite
   Fläche mit demselben Zweck, und beim `.table-wrap` gäbe es dann keinen klebenden Kopf.
5. **`AsyncBoundary.fallbackFrame`** für die drei Ansichten, deren Laufbereich erst im
   Erfolgsfall entsteht (Buchungen, Board, Todo-Detail). Ohne ihn gäbe es dort in Z0 und Z4 gar
   keinen Laufbereich.
6. **`.settings-rail` bekommt `align-self: start`.** Mit `stretch` wuchs ihre Trennlinie aus der
   Gestaltung „Klassisch" von 420 auf gemessene 671 px — neue Optik, verboten.
7. **Der Rahmen behält seinen unteren Innenabstand** (T-323 3.2 setzt ihn auf 0). Die 24 px unter
   Board, Karten und Bereich sind bisher der untere Innenabstand von `.app__main`; so bleiben sie
   pixelgleich.
8. **Die Sprungmarke landet auf dem Rahmen, wo eine Ansicht einen hat** (Zeiterfassung,
   Einstellungen, Board). Bild-ab wirkt dort erst nach einem weiteren Tabulatorschritt; bei der
   Zeiterfassung im schmalen Fenster wirkt sie sofort, weil dann der Rahmen selbst läuft.

---

## 9. Risiken

| | Risiko | Wirkung |
|---|---|---|
| R-1 | 3.1 wird zurückgenommen | Zwei senkrechte Bildlaufleisten auf sieben Ansichten. Die Anforderung des Auftraggebers ist dann nicht erfüllt |
| R-2 | Befund 4 bleibt liegen | Sieben E2E-Dateien sind rot, sobald `pnpm test:e2e` läuft |
| R-3 | Befund 3 bleibt liegen | Eine künftige Abfrage ohne Rolle fällt im strikten Modus um, in einem Prüffall, den niemand angefasst hat |
| R-4 | Ein neuer absolut positionierter Nachfahre in einem Laufbereich **ohne** `position: relative` am Umschlag | Mit 3.1 gefahrlos; ohne 3.1 kommt die Leiste des Rahmens zurück. Ein `proof:`-Lauf nach T-323 9.5 fängt den Rückfall billig ab |
| R-5 | Der feste Teil wächst weiter (T-322 R-h) | Der Rückfall greift immer früher. Auf dem Board ist er bei 960 × 640 schon da (Befund 6) |

**Sicherheit:** keine neue Adresse, kein Datenweg, keine Route, keine Datei auf der Platte, kein
fremder Text auf einem neuen Weg. Der Wegwerfaufbau zur Messung lief auf eigenen Ports mit
erfundenen Daten und ist beendet; der Bestand des Benutzers wurde nicht angefasst. Die
verlangten Sätze der Export-Ansicht (Ordnerbefund fest, Base64-Satz an seinem Platz) bleiben
erreichbar.

---

## 10. Offene Fragen

1. **3.1 — `position: relative` am Laufbereich:** E-112 und T-323 8.4 anpassen oder die Zeile
   herausnehmen? Die Messung steht in Abschnitt 3.1.
2. **Befund 1 — Z6:** AK-02 wörtlich (Höhenabfrage, die T-323 ablehnt) oder AK-02 an T-323 7.2
   angleichen?
3. **Befund 2 — die Sprungmarke:** eigener Auftrag für `parseRoute`?
4. **Befund 4 — die sieben E2E-Dateien:** eigene Aufgabe für e2e-tester in der nächsten Welle.
5. **Der Meßsatz** (`tests/e2e/viewport-fit.spec.ts`, T-323 Abschnitt 9): `ROUTE_NAMES` steht
   bereit. Der Vorrat aus meiner Messung ist erfunden und liegt im Wegwerfverzeichnis, nicht in
   `tests/fixtures/`.
6. **Der Kommentar in `base.css`** („in der Anwendung tut das genau ein Kasten, `.app__main`")
   ist jetzt unvollständig. `base.css` war nicht anzufassen — gehört dem Orchestrator.

---

## 11. Nächster Schritt

Entscheidung zu 3.1 und Befund 1, danach `visual-qa` über die elf Ansichten in mindestens zwei
Gestaltungen und beiden Dichten, danach e2e-tester für Befund 4 und den Meßsatz aus T-323
Abschnitt 9.
