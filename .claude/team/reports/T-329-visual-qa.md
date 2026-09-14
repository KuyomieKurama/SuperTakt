# T-329 — Augenschein über die elf fensterfesten Ansichten

**Rolle:** visual-qa. **Bezug:** T-322 (`docs/design/fensterfeste-flaechen-fluss.md`), T-323
(`docs/design/fensterfeste-flaechen.md`), T-326 (`.claude/team/reports/T-326-frontend-dev.md`),
E-112, E-113.

**Status:** Nacharbeit.

---

## 0. Aufbau, unabhängig von T-326

Eigener Wegwerfaufbau, **nicht** T-326s Messaufbau übernommen als Quelle der Wahrheit — nur
seine Attrappe (`stub-api.mjs`, im selben Scratch-Verzeichnis wie sein eigener Bericht liegend,
mit denselben erfundenen Zahlen: 60 Todos, 80 Buchungen, 12 Board-Spalten, 30 Exportgruppen, 40
Protokollzeilen) als **Datenquelle** wiederverwendet, um Zeit zu sparen — geprüft und geurteilt
wurde selbst, mit eigenem Playwright-Treiber, eigenen Screenshots, eigenen Messungen im Browser.

- Attrappe des lokalen Dienstes: `127.0.0.1:18901` (kein Nachweis über Herkunft, nur Token,
  `Access-Control-Allow-Origin: *`).
- Entwicklungsserver `apps/web`: `127.0.0.1:5299` (`VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`, wie in
  `apps/web/src/app/connection.ts` für den Entwicklungsbetrieb vorgesehen).
- **`127.0.0.1:17843` und `:17844` wurden zu keinem Zeitpunkt gebunden, abgefragt oder beendet.**
  Vor und nach dem Lauf mit `ss -ltn` geprüft: frei. Beide eigenen Ports (5299, 18901) am Ende
  des Laufs sauber beendet (Prozesse abgeschossen, `ss -ltn` danach ohne Treffer).
- Gestaltung/Dichte über `document.documentElement.setAttribute('data-design-theme'|'data-theme'|'data-density', …)`
  gesetzt (Musterattribute aus `packages/ui-tokens/tokens.css` und `theme-palettes.css`), weil die
  Attrappe `PATCH /settings` nicht persistiert.
- Rund 60 Screenshots und mehrere gezielte Messläufe (Node + `playwright-core`, keine
  Testdatei unter `tests/**`, alles im Scratch-Verzeichnis). Keine echten Call-Nummern, keine
  Kundendaten — Vorrat ist derselbe erfundene wie bei T-326.

**Wichtig für die Einordnung:** Weil die Attrappe keine echte Fachlogik hat, sind Buchungsrundung,
Exportregeln usw. **nicht** Gegenstand dieses Berichts. Geprüft ist ausschließlich das, was T-329
verlangt: Struktur, Bildlauf, Zustände, Tastatur, Gestaltung/Dichte.

---

## 1. Zwei neue, schwere Befunde — von einer Zahl verdeckt

### Befund V1 — Kanban-Kopf zerfällt bei 960–1087 px Breite vollständig (hoch)

**Nicht nur „fester Teil wird groß" (T-326 Befund 6), sondern der Kopf ist unlesbar**, und zwar
**innerhalb** der laut T-323 7.1 „getragenen, abstrichslosen" Breite (960 px ist die
dokumentierte Untergrenze, nicht der Rückfallbereich).

Gemessen (`apps/web/src/styles/app.css:939-967`, `.screen__headline` / `.grow` / `.screen__actions`):

| Fensterbreite | `.screen__lead`-Breite | Folge |
|---|---|---|
| 1280 px | 190,7 px | in Ordnung |
| 1100 px | 10,7 px | Text bricht praktisch auf jedes Zeichen |
| 1040 px, 1024 px, 1000 px, 992 px, 960 px, 900 px, 831 px | **0 px** | Text zerfällt in **ein Wort je Zeile** |

Bei 0 px Breite trägt der Absatz „Welche Karte wo steht, entscheidet die Regel — nicht die Maus.
Eine Karte wandert, wenn sich am Todo etwas ändert, das die Regel abfragt." **20 Zeilen**, eine
je Wort, und macht `.screen__header` **536,8 px hoch** (gemessen bei 1024×640 — praktisch
identisch mit den „537 px" aus T-326 Befund 6). Der Titel „Kanban" wird dabei so weit
eingequetscht, dass nur noch der Buchstabe **„K"** sichtbar ist (Screenshot
`shots/board-1024x640-header.png`, im Bericht unten referenziert).

**Ursache, nicht nur Symptom:** `.screen__actions` steht auf `flex: none` (`app.css:964-968`) —
es darf nicht schrumpfen. Passen der Umschalter „Erledigte einblenden" und der Knopf „Spalten
verwalten" nicht nebeneinander in den Rest der Kopfbreite, behält `.screen__actions` trotzdem
seine volle Eigenbreite, und die einzige Fläche, die noch nachgeben kann — `.grow` mit Titel und
Erklärsatz — wird auf 0 gedrückt. `.screen__lead` hat `max-width: var(--measure-prose)`, aber
keine Mindestbreite und keinen `overflow`-Deckel; bei Breite 0 zerlegt der Browser jedes Wort in
eine eigene Zeile.

**Das ist T-326s eigene Befunde 5 und 6, aber als eine Ursache und mit dem sichtbaren Ausmaß, das
ihre Zahlen nicht zeigen:**

- Befund 5 maß `.app__main.scrollWidth > clientWidth` (825/784 bei 1024 px, **identisch** mit
  meiner Messung) und nannte die Quelle korrekt (`.screen__actions` passt nicht). Aber: Die Folge
  wurde nur als „wird abgeschnitten" beschrieben, nicht als das, was sie zusätzlich auslöst.
- Befund 6 maß den festen Teil mit „537 px (Titel, **zweizeiliger** Erklärsatz, Umschalter,
  ‚Spalten verwalten')" — das ist eine falsche Lesart der eigenen Zahl. Es sind keine zwei
  Zeilen, es ist ein vollständiger Zusammenbruch des Absatzes, und der Titel ist mit betroffen.
  **Ein `scrollHeight`/`clientHeight`-Paar sagt „wie hoch", nicht „warum" und nicht „wie es
  aussieht" — genau die Lücke, die dieser Auftrag schließen soll.**

Das ist **innerhalb** der getragenen Breite (960 px ist die Untergrenze „ohne Abstriche",
T-323 7.1), nicht im Rückfallbereich. Der Rückfall (R-3) fängt die Symptomatik zwar ab (das
Dokument wächst nicht, alles bleibt erreichbar), aber die **Ursache** — ein Kopf, der bei jeder
Breite zwischen etwa 831 und 1100 px unlesbar wird — bleibt bestehen und ist kein Rückfallproblem,
sondern ein eigenständiger Fehler im Kopf-Layout des Boards. Dieser Kopf wurde von T-326 nicht
verändert (Kanban ist laut eigenem Bericht „unverändert"), insofern ist die Ursache vermutlich
vorbestehend — aber sie wird durch R-3 (Rückfall gilt jetzt auch fürs Board, OF-1) zum ersten Mal
bei einer **normalen, unterstützten** Fensterbreite (960–1040 px) sichtbar und beeinflusst
unmittelbar, ob und wann der Rückfall greift.

**Datei/Stelle:** `apps/web/src/styles/app.css:964-968` (`.screen__actions { flex: none;
flex-wrap: wrap; }`) im Zusammenspiel mit `.screen__lead` (`app.css:958-962`) und dem `.grow`
umschließenden `<div>` in `apps/web/src/features/board/BoardScreen.tsx` (Kopfzeile). **Vorschlag
(keine Behebung):** `.screen__actions` bei fehlendem Platz zulassen zu schrumpfen (`flex: 0 1
auto`) oder in eine zweite Zeile umbrechen zu lassen, **bevor** `.grow` auf 0 fällt — oder
`.screen__lead` einen `min-width` geben, der vor dem Zerfall in Einzelwörter schützt.

### Befund V2 — Zeiterfassung bei ≤ 68 rem: Inhalte beider Spalten überlagern sich sichtbar (hoch)

Getestet bei 1000×700 (unter der Umbruchgrenze 68 rem = 1088 px, R-2 verlangt: „aus zwei
Laufbereichen wird einer").

Die **Container** `.time-layout__main` und `.time-layout__side` stapeln sich korrekt
untereinander, ohne sich zu überlappen (gemessen: `main` y 124,8–392,4 px, `side` y
408,4–676 px — sauber getrennt). **Aber:** `.time-layout__main` und `.time-layout__side` selbst
tragen `overflow: visible`, und ihre zweite Karte (bei `main`: „Todo wählen" mit der
60-Einträge-Liste) wächst auf ihre **natürliche Höhe** — gemessen **1599,6 px** — statt sich in
die zugeteilte, halbierte Höhe (267,6 px, offenbar unverändert aus dem breiten Zweispalten-Layout
übernommen) einzupassen. Der überschießende Karteninhalt malt sich **über** die Fläche, in der als
nächstes `.time-layout__side` mit der Karte „Heute" und der Buchungsliste steht.

**Sichtbar** entsteht daraus ein Bild, in dem Suchfeld, „Erfasst"-Kachel, „Noch offen"-Kachel, die
Warnung „3 Tagesgruppen haben noch keinen Leistungstext" und einzelne Todo-Zeilen **durcheinander
und übereinander** gerendert werden — Text liegt buchstäblich auf Text (Screenshot
`shots/time-1000x700-clear.png`). Das ist keine Frage von „eine Bildlaufleiste zu wenig", sondern
eine **unlesbare, unbenutzbare Fläche** bei einer Fensterbreite, die laut T-323 7.1 zum
**Browserbetrieb** gehört und ausdrücklich getragen wird (640–960 px „getragen im
Browserbetrieb").

Das exakt hier befürchtete Risiko steht bereits in `docs/design/fensterfeste-flaechen.md`
Abschnitt 8.8 als offener Punkt: „Spricht T-322 einer dieser Ansichten zwei Laufspalten zu, muss
die betroffene Zeile auf `stretch` [...]. Kein Vorgriff hier." Genau diese Anpassung fehlt für den
schmalen Fall der Zeiterfassung, oder die beiden Spalten brauchen bei ≤68 rem eine eigene Regel
(`flex: none` statt hälftiger Aufteilung, `overflow` statt `visible`), damit **eine** gemeinsame
Fläche natürlich läuft, statt zwei feste Hälften zu erzwingen, deren Inhalt nicht hineinpasst.

**Datei/Stelle:** die Medienabfrage/Umbruchregel für `.time-layout` bei ≤68 rem (vermutlich
`app.css`, in der Nähe der bestehenden 68-rem-Stufe) und `.time-layout__main`,
`.time-layout__side` (`overflow`, Höhenaufteilung). **Nicht gemessen:** ob dasselbe bei anderen
Breiten zwischen 640 und 1088 px gleich schwer ausfällt — bei 1000×700 ist es reproduzierbar und
eindeutig.

---

## 2. Bestätigte, bereits gemeldete Befunde — unabhängig nachgefahren

### Befund V3 — Sprungmarke tauscht die Ansicht aus, nicht nur die Bildlaufstelle (hoch, deckt sich mit T-326 Befund 2)

Selbst nachgestellt, mit Beweis über den sichtbaren Inhalt (nicht nur über `location.hash`):
Auf der Todos-Ansicht `Tab` (Sprungmarke fokussiert) → `Enter` → **die gesamte sichtbare Ansicht
wechselt lautlos auf das Dashboard** (Titel „Dashboard" statt „Todos", andere Karten, andere
Struktur), während `location.hash` auf `#inhalt` steht und die Seitenleiste weiterhin **„Todos"**
als aktiv markiert zeigt (Screenshots `shots/skiplink-before.png` / `shots/skiplink-after.png`).
Reproduziert auf Todos, Zeiterfassung, Kanban, Einstellungen — überall identisch: 3 weitere
Tab-Schritte bis `.screen__body` fokussiert ist, danach rollt `Bild-ab` korrekt (vor/nach:
0 → 288 px u. ä.).

**Über T-326s Befund hinaus, neu bemerkt:** Die Seitenleiste bleibt auf dem **alten** Eintrag
aktiv markiert, während der Inhalt bereits auf Dashboard steht — ein zusätzlicher,
Navigation/Inhalt-Widerspruch, der beim Beheben des Router-Problems (`parseRoute`) mitgeprüft
werden sollte, weil er sonst als zweiter, kleinerer Fehler übrig bleiben könnte.

Das ist keine kosmetische Verschlechterung der Bildlaufstelle, wie AK-14 nahelegt, sondern ein
**vollständiger, unangekündigter Ansichtswechsel** über die erste Standardhandlung der Tastatur
auf jeder Seite. Ich stufe das höher ein als „teilweise erfüllt" — für jeden Tastaturnutzer, der
die Sprungmarke benutzt (das ist ihr einziger Zweck), ist AK-14 auf **jeder** Ansicht verletzt.

### Befund V4 — doppelt vergebene zugängliche Namen, am Quelltext bestätigt

`git grep 'aria-label="Todos"'` zeigt: `apps/web/src/shared/ui/ScreenBody.tsx`-basiertes
`.screen__body` **und** `apps/web/src/features/todos/TodoListScreen.tsx:498`
(`<ul className="todo-list" aria-label="Todos">`) — deckt sich mit T-326 Befund 3. Nicht erneut
im Browser gemessen (Playwright-Vieldeutigkeit), aber die Quelle bestätigt die Kollision
unabhängig. Auflage an unit-tester/e2e-tester bleibt: Rolle mitgeben.

---

## 3. Die 22 Akzeptanzkriterien — eigener Befund

Kurzfassung; wo mein Befund von T-326 abweicht, ist es vermerkt. „Gemessen" heißt: im eigenen
Aufbau nachgefahren, nicht aus dem Bericht übernommen.

| | Kriterium | Eigener Befund |
|---|---|---|
| AK-01 | Dokument scrollt nicht | **erfüllt**, an allen elf Ansichten bei 1280×820 sowie an den gezielt geprüften Randbreiten (960×640, 1280×480, 640×480, 320×256, 831×640, 1000×700) |
| AK-02 | Zahl laufender Flächen wie in Abschnitt 4 | **erfüllt im getragenen Bereich, teilweise darüber hinaus fehlerhaft** — Zeiterfassung zeigt bei 1280 px zwei `.runarea` (1469/278 und 5159/204 — deckungsgleich mit T-326s eigenen Zahlen), Board zeigt zwölf laufende `.kcolumn__body`. Bei ≤68 rem wird zwar **eine** Fläche daraus (Container-Ebene korrekt), aber ihr Inhalt läuft nicht kontrolliert — siehe Befund V2 |
| AK-03 | keine zwei Laufflächen übereinander | **auf Container-Ebene erfüllt**, aber **in der Anschauung durch Befund V2 verletzt**: der überschießende Karteninhalt legt sich sichtbar über die zweite Fläche, auch wenn beide Boxen selbst nicht überlappen |
| AK-04 | fester Teil ohne eigene Bildlaufleiste | **erfüllt** — keine der gemessenen `.screen__bar`/`.screen__header`-Flächen hat eine eigene `scrollHeight > clientHeight` |
| AK-05 | Reihenfolge zeichengleich | **erfüllt**, soweit im Bild überprüft (elf Ansichten, klassisch/komfortabel) |
| AK-06 | Kopf bleibt bei größtem Bildlauf sichtbar | **erfüllt** — `headerTop` vor/nach Rollen ans Ende identisch auf allen elf Ansichten (z. B. 76 → 76) |
| AK-07 | Bildschirmleerzustand zentriert, Kartenleerzustand unverändert | **erfüllt** — erzwungener Leerzustand auf Buchungen (`state-bookings-empty.png`): Filterleiste bleibt oben sichtbar, „Noch keine Zeitbuchung" steht sauber zentriert im verbleibenden Laufbereich, klebt **nicht** oben |
| AK-08 | fester Teil bleibt in Z0/Z3/Z4 bedienbar | **erfüllt** für Board, Buchungen (erzwungener Lade- und Fehlerzustand: Filterleiste/Kopf bleiben stehen, Fehlerfläche mit „Erneut versuchen" erscheint korrekt innerhalb des `fallbackFrame`). Todo-Detail hat wie dokumentiert **keinen** festen Kopf in Z0/Z4 (kein Titel, keine Aktionen) — bestätigt, `tabIndex={-1}` ohne Name |
| AK-09 | Bildlaufstelle nach Nachladen (Z5) | **nicht gemessen** — die Attrappe löst kein Nachladen aus, wie schon bei T-326 |
| AK-10 | Inhaltsbreite ändert sich nicht mit Bildlaufleiste | **nicht eigens neu gemessen** (Rinne), aber keine Auffälligkeit in den Screenshots bemerkt |
| AK-11 | Tabellenkopf bleibt stehen (senkrecht), wandert mit (waagerecht) | **erfüllt und selbst gemessen** — `.table thead th` bleibt bei 900 px Bildlauf exakt auf derselben `top`-Position (402,3 px), in **allen** geprüften Gestaltung/Dichte-Kombinationen (klassisch/glas × komfortabel/kompakt). Deckender, undurchsichtiger Hintergrund bestätigt (`color(srgb …)`, kein Alpha, `z-index: 10`) — **kein Durchscheinen**, auch nicht im Glas-Thema |
| AK-12 | Tabelle macht Seite nicht breiter | **erfüllt** — `.app__main.scrollWidth === clientWidth` bei 960 px Breite, während `.table-wrap` selbst läuft |
| AK-13 | Zeilenmenüs/Kästchen nach Waagerechtlauf erreichbar | **erfüllt und selbst gemessen** — nach `scrollLeft = scrollWidth` (527/1567) holt `checkbox.focus()` die Spalte zurück (`scrollLeft` danach 0) |
| AK-14 | Sprungmarke + Tabulatorweg + Bild-ab | **verletzt, schwerer als „teilweise"** — siehe Befund V3. Die Bildlaufmechanik selbst (3 Tab-Schritte bis `.screen__body`, Bild-ab funktioniert danach) ist in Ordnung; die Sprungmarke davor ist es nicht |
| AK-15 | Laufbereich hat Namen + sichtbaren Fokusring | **erfüllt bis auf die bekannte Ausnahme** (Todo-Detail Lade/Fehler) — Fokusring gemessen: `outline: rgb(33,89,218) solid 2px`, `outline-offset: -4px`, deutlich sichtbar in Screenshots |
| AK-16 | fokussierter Eintrag sichtbar | **erfüllt**, soweit an der Buchungstabelle geprüft (AK-13) |
| AK-17 | kein `.visually-hidden` erzeugt Dokumentbildlauf | **erfüllt** — `document.scrollingElement.scrollHeight` blieb in allen Läufen innerhalb der Fensterhöhe |
| AK-18 | unter der Grenze läuft `.app__main`, alles bleibt bedienbar | **erfüllt für „bedienbar", mit Einschränkung durch Befund V1/V2**: Bei 960–1040 px ist das Board zwar vollständig **erreichbar**, aber sein Kopf ist praktisch **unlesbar** — „bedienbar" im engen Sinn (nichts blockiert), aber die Ansicht wirkt kaputt, nicht nur eng |
| AK-19 | Wechsel über die Grenze verliert Fokus nicht | **nicht eigens gemessen** (kein Resize-Verlauf mit gehaltenem Fokus gefahren); rein CSS-basiert wie dokumentiert, kein Hinweis auf Zuhörer im Quelltext |
| AK-20 | Rückfall richtet sich nach Inhaltsbereich, nicht Fenster | **nicht eigens gemessen** — glaubwürdig aus dem Quelltext (`.screen` gegen Rasterzeile, keine `vh`-Bindung), nicht im Browser mit Hüllenmeldung nachgestellt (Attrappe kennt keine Hüllenmeldung) |
| AK-21 | Kanban/Dialoge wie vorher | **erfüllt für Dialoge, mit Vorbehalt fürs Kanban**: `.scrim` bleibt Geschwister von `.screen__body`, zentriert sich im **ganzen Fenster** unabhängig vom Rollstand des Laufbereichs (selbst gemessen: Laufbereich auf 250 px gerollt, `.scrim` trotzdem 0/0 bis 1280/820). Kanban selbst zeigt Befund V1 |
| AK-22 | kein Oberflächentext neu/geändert/gestrichen | **nicht geprüft** (keine `proof:`-Läufe gefahren — außerhalb meiner Dateihoheit und meines Aufbaus) |

---

## 4. Die vom Bericht als Annahme markierten Stellen — in der Anschauung geprüft

- **Dialoge als Geschwister des Laufbereichs:** **trägt.** Selbst gemessen (`.scrim`-Elternelement
  ist `.screen`, nicht `.screen__body`); Zentrierung bleibt bei gerolltem Laufbereich im ganzen
  Fenster stehen.
- **`.list-more` läuft auf Todos/Protokoll mit, bleibt auf dem Board fest:** in den Screenshots
  konsistent mit dieser Beschreibung — auf dem Board erscheint „Mehr Karten je Spalte laden" als
  fester Fuß unter dem Board selbst, nicht im Laufbereich der einzelnen Spalte.
- **`.settings-rail` mit `align-self: start`:** die Schiene bleibt bei 1280×820 sichtbar
  577 px hoch neben einem 671 px hohen Bereichsinhalt, ohne selbst zu wachsen — **trägt** im
  getragenen Fenster. **Bei 831×640 (Bandnavigation) wirkt die Schiene jedoch unaufgeräumt**
  (Befund V5, unten) — eine andere Baustelle als `align-self`, aber an derselben Komponente.
- **Rahmen behält unteren Innenabstand:** nicht widerlegt; in keinem Screenshot fehlt der
  Abstand unter Board/Karten/Bereich sichtbar.

### Befund V5 — Einstellungen-Schiene wirkt bei 831×640 (Bandnavigation) zerrissen (mittel)

Bei 831×640 (unterhalb 52 rem, Seitenleiste wird zum Band) zeigt die zur Bandnavigation
umgebrochene `.settings-rail` mehrere **stehen gebliebene horizontale Trennlinien** zwischen
einzelnen Einträgen („Timer" und „Daten" etwa sind durch eine quer laufende Linie getrennt, die
mitten im umgebrochenen Band hängt, siehe `shots/settings-classic-comfortable-831x640.png`).
Funktional bleibt jeder Eintrag klickbar; visuell wirkt die Leiste jedoch beschädigt — vermutlich
ein `border-top`/`border-bottom`, das für eine **vertikale** Liste gedacht war und beim Umbruch in
eine **Band**-Darstellung nicht mitgezogen wurde. Nicht root-caused (Kostengrund), Fundstelle
`apps/web/src/styles/app.css` ab Zeile 4387 (`.settings-rail`, `.settings-rail__item`).

---

## 5. Zustände (Abschnitt 15 der Spezifikation)

Erzwungen über `page.route()`-Abfangen der jeweiligen `GET`-Route (Verzögerung ohne Auflösung für
„lädt", `500` für „Fehler", leere Seite für „leer"):

| Ansicht | Lädt | Fehler | Leer |
|---|---|---|---|
| Board | Skelett im Laufbereich, Kopf/Werkzeugzeile stehen — **erfüllt** | `InlineMessage` mit „Erneut versuchen" im `fallbackFrame`, Kopf steht — **erfüllt** | nicht erzwungen |
| Buchungen | Skelett, Filterleiste + „wird geladen …" im festen Teil sichtbar — **erfüllt** | Fehlerfläche unterhalb der Filterleiste, diese bleibt bedienbar — **erfüllt** | „Noch keine Zeitbuchung", zentriert im Laufbereich, Filterleiste sichtbar darüber — **erfüllt**, siehe AK-07 |
| Todo-Detail | **kein** fester Kopf, Skelett füllt die ganze Fläche unter der App-Kopfzeile — **wie dokumentiert, kein Mangel dieses Entwurfs** | dieselbe Bauart, Fehlermeldung ohne Titel/Aktionen — **wie dokumentiert** | — |
| Export | nicht erzwungen | Fehlerfläche für die Gliederung nimmt korrekt „die Stelle des Inhalts" ein, „Export ausführen" gesperrt, Ordnerhinweis bleibt sichtbar — **erfüllt**, deckt sich mit T-322 4.7 | nicht sauber erzwungen (Attrappe ignoriert Filterparameter); nicht gemessen |

**Nicht gemessen, ausdrücklich:** Leerzustand auf Todos, Tags, Dashboard, Zeiterfassung
(„Heute noch nichts erfasst"), Exportprotokoll. Der Mechanismus (`.screen__body > .empty` mit
`margin-block: auto`) ist an Buchungen bestätigt und dürfte sich auf die übrigen fünf gleich
auswirken, weil er laut T-326 dieselbe Klasse an derselben Stelle im Baum benutzt — aber das ist
eine Übertragung, keine Messung.

---

## 6. Gestaltung und Dichte

Klassisch/komfortabel gegen Glas/dunkel/kompakt an allen elf Ansichten, zusätzlich Klassisch↔Glas
über beide Dichten hinweg an Todos und Buchungen (vier weitere Aufnahmen). Kein Durchscheinen,
kein Kontrastproblem in den Screenshots aufgefallen. Der klebende Tabellenkopf bleibt in **jeder**
geprüften Kombination undurchsichtig und ortsfest (Abschnitt 3, AK-11).

**Einschränkung:** nur eine von zwanzig Gestaltungen zusätzlich zu Klassisch geprüft (Glas), wie
im Auftrag vorgesehen; „liquid-glass", „velvet", „rainbow" (die anderen mit Verlauf/`backdrop-filter`
laut T-323 8.3) **nicht** geprüft — nicht gemessen, nicht „in Ordnung".

---

## 7. Was nicht gemessen wurde

- **AK-09, AK-19, AK-20, AK-22** — siehe Tabelle, Gründe dort.
- **Exportordner-Warnung als `.screen__bar`** — versucht, über eine erzwungene
  `exportDirectoryState`-Antwort auszulösen; die Attrappe/das erwartete Feld haben nicht
  zusammengepasst (kein `.screen__bar` erschienen). Nicht weiterverfolgt (Kostengrund). **Nicht
  gemessen, nicht bestätigt, nicht widerlegt.**
- **Leerzustände** auf neun der elf Ansichten (nur Buchungen erzwungen).
- **Nachladen (Z5)** auf keiner Ansicht — die Attrappe kennt keine Revalidierung.
- **Tiefer Tag-Baum in der Anschauung** — die Attrappe liefert sechs Ebenen (bestätigt in den
  Rohdaten), aber ich habe die Bäume im Bild nicht bis in die Tiefe aufgeklappt; nur die oberste
  Ebene wurde eingesehen.
- **18 der 19 übrigen Gestaltungen** außer Glas.
- **Vergleich mit dem Stand vor T-326** — es gab keinen laufenden Vorher-Zustand zum
  Gegenprüfen (der Arbeitsbaum enthält bereits T-326s Änderungen als unversionierte Änderungen);
  ein Pixel-Vergleich „vorher/nachher" wurde nicht gefahren. Die in T-323 3.4 vorhergesagte
  Verschiebung des rechten Kopfrands um die Rinnenbreite wurde nicht eigens nachgemessen.

---

## 8. Status je Fläche, zusammengefasst

**Nacharbeit nötig, bevor freigegeben werden kann:**

- Befund V1 (Kanban-Kopf zerfällt, 960–1087 px) — **hoch**, betrifft die getragene
  Mindestbreite direkt.
- Befund V2 (Zeiterfassung überlagert sich bei ≤68 rem) — **hoch**, unbenutzbar in einer
  ausdrücklich getragenen Browserbreite.
- Befund V3 (Sprungmarke tauscht Ansicht) — **hoch**, AK-14 auf jeder Ansicht betroffen; deckt
  sich mit T-326 Befund 2, hier mit zusätzlichem Navigations-Widerspruch bestätigt.
- Befund V5 (Einstellungen-Schiene im Band zerrissen) — **mittel**.
- Befund V4 (doppelte `aria-label`) — **mittel**, deckt sich mit T-326 Befund 3, Auflage an
  unit-tester/e2e-tester steht bereits.

**Freigegeben, mit den genannten Lücken „nicht gemessen":** die grundlegende Mechanik (fester
Kopf, ein/zwei Laufbereiche, klebender Tabellenkopf, Fokusring, Tastaturweg innerhalb des
Laufbereichs, Zustände Lade/Fehler/Leer soweit erzwungen, Dialoge fensterfest) trägt in Klassisch
und Glas, in beiden Dichten, im Standardfenster und an den meisten Randbreiten.

---

**Gesamturteil: Nacharbeit.** Nicht wegen der Mechanik selbst — die trägt an den meisten Stellen
gut —, sondern wegen zweier neuer, hoch eingestufter Sichtbarkeitsfehler (V1, V2), die exakt in
den Bereich fallen, den eine reine `scrollHeight`/`clientHeight`-Messung nicht zeigt, plus der
bereits gemeldeten, hier unabhängig bestätigten Sprungmarke (V3).

---

## Artefakte

Alle unter `/tmp/claude-1000/-home-kerem-Projects-SuperTakt/e8adbe75-1e8b-4885-8205-a616c521a478/scratchpad/`
(Wegwerfverzeichnis, nicht Teil des Bestands, nicht committet):

- `stub-api.mjs` — wiederverwendete Attrappe (Ursprung T-326).
- `qa-drive.mjs`, `qa-nested.mjs`, `qa-interactive.mjs`, `qa-keyboard.mjs`, `qa-skipbug.mjs`,
  `qa-states.mjs`, `qa-stickycheck*.mjs`, `qa-board*.mjs`, `qa-time*.mjs`, `qa-dialog.mjs`,
  `qa-dirwarning.mjs` — eigene Playwright-Treiber.
- `shots/*.png` — rund 60 Aufnahmen, benannt nach Ansicht/Gestaltung/Dichte/Breite bzw. Zustand.
- `results.json` — Rohmessungen aus dem Hauptlauf (Satz A/B/D).

Keine Datei außerhalb dieses Wegwerfverzeichnisses und dieses Berichts wurde angefasst.
