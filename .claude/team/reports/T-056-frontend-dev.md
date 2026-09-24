Aufgabe: T-056 — Die Bedienelemente zu Ende gestalten, und Tags per Ziehen verschieben.

Status: fertig

---

Artefakte:

Neu:

```
(keine neue Datei — alles fällt in bestehende Bausteine)
```

Geändert:

```
apps/web/src/components/Primitives.tsx           410  neu `Select`: die gemeinsame Hülle für jedes
                                                      Auswahlfeld. Feld und Pfeil in **einer**
                                                      Rasterzelle statt Feld plus absolut
                                                      gesetztem Pfeil.
apps/web/src/components/FilterBar.tsx            267  `SelectField` sitzt jetzt auf `Select` auf;
                                                      neu `size` und `hint`
apps/web/src/components/Timer.tsx                231  neu `trailing`, `actionStyle`, `actionTitle`;
                                                      der Knopf steht am Ende der Zeile und kann
                                                      sein Wort tragen
apps/web/src/components/TagTree.tsx              523  Ziehen und Ablegen: Griff, Ablegestelle,
                                                      Wurzelstreifen, Zyklussperre vor dem Ablegen,
                                                      Aufklappen beim Verweilen
apps/web/src/app/TimerBar.tsx                     80  Kopfleiste neu zusammengesetzt: Puls, Zeit,
                                                      Todo, dann „Stoppen"
apps/web/src/app/App.tsx                         318  Themenschalter ist jetzt dasselbe Feld wie
                                                      überall sonst; `.theme-select` ist weg
apps/web/src/screens/TagsScreen.tsx              804  `onMove` verdrahtet (`newParentId`),
                                                      Erfolgsmeldung mit vollem Pfad, Fehlerband
                                                      über beiden Spalten
apps/web/src/screens/TemplateFields.tsx          630  vier rohe `<select>` auf `Select` umgestellt
apps/web/src/styles/components.css              3370  `.select` neu, `.card__body`-Rhythmus,
                                                      Timer-Innenleben, `.tree__*`-Ziehzustände,
                                                      Höhenabgleich in der Filterleiste
apps/web/src/styles/app.css                     2951  `.timerbar` (Radius, Höhe, flaches
                                                      Innenleben), `.field__input` an `.select`
                                                      angeglichen, `.theme-select` entfernt
apps/web/src/styles/showcase.css                 410  `.demo-note`, Abstand vor Zwischenüberschriften
apps/web/src/showcase/ControlsSection.tsx        300  neue Karte „Formularfelder" — drei Höhen,
                                                      volle Breite, gesperrt, Eingabefeld in allen
                                                      Zuständen aus Abschnitt 15
apps/web/src/showcase/TimeSection.tsx            151  die Kopfleiste steht jetzt so in der
                                                      Musterseite, wie sie im Fenster aussieht
apps/web/scripts/contrast-check.mjs              490  26 neue Paare (332 → 358)
```

`packages/ui-tokens/tokens.css`: **unangetastet.** Es war kein Token falsch — falsch war, was die
Oberfläche daraus gebaut hat. `apps/local-api/**`, `packages/**`, `apps/outlook-addin/**`,
`tests/e2e/**`, `docs/**`, `apps/web/test/**`, `apps/desktop/**`: unangetastet.

---

Zusammenfassung:

**1 — Der Fehler auf Bild 1 war konstruktiv, nicht kosmetisch.**

`.select` war `position: relative; display: inline-flex`, der Pfeil `position: absolute;
inset-inline-end`. Sobald die Hülle gedehnt wurde — und in einem `.field` wird sie das, denn eine
Flex-Spalte streckt ihre Kinder —, blieb das `<select>` auf seiner Inhaltsbreite stehen, während
der Pfeil an den rechten Rand der Hülle wanderte. Der Fokusring lag nur um das Feld und machte den
Bruch noch deutlicher. Das war kein Abstandsfehler, den man mit einem `margin` heilt: Feld und
Pfeil hatten schlicht keine gemeinsame Geometrie.

Jetzt ist `.select` ein Raster mit **einer** Zelle. Feld und Pfeil belegen dieselbe Fläche, der
Pfeil wird darin nach hinten ausgerichtet. Was mit der Hülle geschieht, geschieht mit beiden
zugleich; ein Auseinanderlaufen ist nicht mehr möglich. Gemessen über alle neun Ansichten, hell und
dunkel: 15 Auswahlfelder, Abstand zwischen rechter Feldkante und rechter Pfeilkante überall
12 Pixel, kein waagerechter Überlauf.

**2 — Bild 2 war ein Feld, das als einziges im Fenster nicht wie die Anwendung aussah.**

Der Themenschalter war ein blankes `<select>` mit eigener Klasse `.theme-select` und dem Pfeil des
Betriebssystems. Er benutzt jetzt `SelectField` wie jedes andere Feld. Er steht außerdem auf
`--control-height-lg`, also genau so hoch wie die Suche und die Timerleiste daneben. Die Kopfzeile
hat damit eine Oberkante.

**3 — Bild 3: der Knopf wirkte hineingefallen, weil er es war.**

Drei Ursachen, eine Wirkung. (a) Die Leiste trug `--radius-pill` — die einzige Kapsel im ganzen
Fenster, wo alles andere 6 oder 8 Pixel hat; sie trägt jetzt `--radius-md`. (b) Innen saß
`TimerDisplay` mit **eigener** Hülle: Rahmen, Fläche, Innenabstand — eine zweite Kiste in der
ersten. Die wird abgeräumt, die Leiste ist die Hülle. (c) Der Stoppknopf stand zwischen Zeit und
Titel, mitten im Satz, als nacktes Quadrat. Er steht jetzt am Ende der Zeile, wo eine Aktion
hingehört, und trägt sein Wort: „Stoppen". Dafür hat `TimerDisplay` zwei Zusagen bekommen —
`trailing` (was zwischen Zeit und Knopf steht) und `actionStyle` (Symbol oder Symbol mit Wort). Die
Kanban-Karte und die Tabellenzeile behalten das reine Symbol; dort ist der Platz wirklich knapp.

Die Reihenfolge in der Leiste ist jetzt die Lesereihenfolge: Puls, Zeit, seit wann, worauf, dann
die Aktion.

**4 — Was Chakra gut macht und hier gefehlt hat, im Einzelnen.**

* **Ruhige Radien.** `--radius-pill` ist aus der Kopfleiste verschwunden. Übrig bleiben `md` für
  jedes Bedienelement und `lg` für Karten.
* **Abgestimmte Höhen über eine Zeile hinweg.** Die Filterleiste hatte ein 36-Pixel-Suchfeld neben
  32-Pixel-Auswahlfeldern und -Schaltern: unten bündig, oben zackig. Alles in
  `.filterbar__controls` steht jetzt auf `--control-height-lg`. Dasselbe in der Kopfzeile.
* **Genug Innenabstand.** `.select__input` hatte links 8 Pixel, `.field__input` ebenfalls; beide
  haben jetzt 12. Der mehrzeilige Notizkasten war bei 8 und ist jetzt bei 12 — ein mehrzeiliges
  Feld darf nicht enger wirken als ein einzeiliges daneben.
* **Zustände, die sich sanft unterscheiden.** Das Auswahlfeld hatte gar keine Übergänge und keinen
  eigenen Fokuszustand. Jetzt: Fläche und Kontur wechseln über `--motion-fast`, unter dem Zeiger
  `--border-strong` und `--bg-hover`, bei Fokus `--border-accent` zusätzlich zum Ring, gesperrt
  `--bg-disabled` mit passendem Pfeil.
* **Gleiche Schriftgröße.** Das Auswahlfeld stand auf `--text-sm`, das Textfeld daneben auf
  `--text-base`. Zwei Felder in einer Zeile mit zwei Schriftgrößen — jetzt beide `--text-base`.
* **Senkrechter Rhythmus im Formular.** In den Einstellungen stand die Beschriftung des nächsten
  Feldes unmittelbar unter dem Hilfetext des vorigen. `.card__body` bekommt jetzt einen
  Geschwisterabstand für Felder, Hinweise und Meldungen — mit `:where()`, damit ein Baustein mit
  eigenem Abstand ihn behält, und ohne den Kartenrumpf zu einem Stapel zu machen (in ihm steht
  ebenso oft eine Tabelle, die keinen braucht).

**5 — Ziehen im Tag-Baum, mit den drei Bedingungen aus der Aufgabe.**

Jede Zeile ist beweglich, ein Ordner nimmt eine Ablage an, ein Streifen unter dem Baum hebt auf die
Wurzelebene. Der Streifen ist nur während eines Ziehvorgangs da — und nur dann, wenn eine Ablage
dort überhaupt etwas ändern würde.

* **Zyklen sind gar nicht erst möglich (A-4.6).** Der Baum baut eine Elternkarte über den **ganzen**
  Bestand, nicht über die sichtbaren Zeilen — ein zugeklappter Unterordner bleibt ein Nachfahre,
  und wäre die Karte nur aus der flachen Liste gebaut, wäre jede eingeklappte Ebene eine erlaubte
  Ablegestelle gewesen. Über einer unzulässigen Stelle wird `dragover` nicht angenommen: Der
  Browser zeigt das Verbotszeichen, und der Zeile wird nichts angeheftet. `tag_folder_cycle` kommt
  auf diesem Weg nicht mehr vor. **Gemessen** (Ordner „Kunden" auf seinen Nachfahren „Nord AG"):
  `defaultPrevented: false`, 0 markierte Ablegestellen, Baum danach unverändert.
* **Der Weg über den Dialog bleibt (SC 2.5.7).** Nichts daran wurde angefasst. Gemessen: Tabulator
  erreicht den Baum, Pfeiltasten wandern, Eingabetaste wählt aus, „Verschieben" öffnet den Dialog
  („Ordner verschachteln"), das Feld darin ist fokussierbar.
* **`newParentId`.** `moveTagFolder(id, newParentId)` wird unverändert benutzt, für Tags läuft es
  über `updateTag(id, { folderId })` — zwei Routen, weil die Zyklusprüfung nur an der einen sitzt.

Der Klick auf den Namen wählt weiterhin aus, das Dreieck klappt auf (T-012/T-035). Ziehen ist ein
dritter, eigener Vorgang darüber gelegt; keine der beiden bestehenden Gesten wurde umgedeutet.

Ein zugeklappter Ordner, über dem der Zeiger 700 ms verweilt, klappt von selbst auf. Ohne das wäre
ein tiefer Baum beim Ziehen nicht erreichbar — man käme nur an die Ordner heran, die gerade offen
sind, und „tiefe Ordnerbäume bleiben navigierbar" gälte für das Ziehen nicht mehr.

Rückmeldung nach dem Ablegen: eine Meldung mit dem **vollen** Pfad („„Migration" liegt jetzt in
„Kunden / Nord AG / Wartung"."). „Wartung" allein sagt nicht, welche Wartung gemeint ist, wenn zwei
Kunden je eine haben. Misslingt es, steht der Grund als Band über beiden Spalten und bleibt stehen
— es gibt hier keinen Dialog, in dem er stehen könnte.

**6 — Eine Härtung, die beim Messen aufgefallen ist.**

Erst las der `dragover`-Prüfer den gezogenen Knoten aus `useState`. `dragstart` und das erste
`dragover` können im selben Arbeitsschritt liegen; der Zustand ist dann noch der alte, und die
erste Ablegestelle wird abgelehnt, obwohl sie zulässig ist. Gemessen: `defaultPrevented: false` auf
einem gültigen Ziel. Der Knoten liegt jetzt zusätzlich in einer Referenz — der Zustand trägt die
Darstellung, die Referenz die Entscheidung. Danach: `defaultPrevented: true`, Ablegestelle
markiert. Derselbe Zustand steckt im Kanban-Board (T-005, `BoardScreen`), fällt dort aber nicht
auf, weil eine Karte über eine Spalte gezogen wird und dabei viele `dragover` kommen. Nicht
angefasst — nicht meine Aufgabe hier, aber notiert.

---

Was ich tatsächlich im Browser gesehen habe:

Gefahren wurde die echte Anwendung gegen den echten Dienst — `apps/local-api/src/index.ts` mit
eigenem `XDG_DATA_HOME`, `vite` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN`, also derselbe Weg, den
`tests/e2e/support/services.ts` benutzt. Kein Attrappen-Server. Bestand: sieben Ordner in vier
Ebenen, acht Tags, drei Todos, ein laufender Timer.

*Hell und dunkel, alle neun Ansichten:*

```
dashboard      Auswahlfelder 1   Ueberlauf nein   Hoehen 36
todos          Auswahlfelder 3   Ueberlauf nein   Hoehen 36
kanban         Auswahlfelder 1   Ueberlauf nein   Hoehen 36
zeit           Auswahlfelder 1   Ueberlauf nein   Hoehen 36
buchungen      Auswahlfelder 2   Ueberlauf nein   Hoehen 36
export         Auswahlfelder 2   Ueberlauf nein   Hoehen 36/32
vorlagen       Auswahlfelder 1   Ueberlauf nein   Hoehen 36
tags           Auswahlfelder 1   Ueberlauf nein   Hoehen 36
einstellungen  Auswahlfelder 4   Ueberlauf nein   Hoehen 36/32
```

36 ist die Kopfzeile, 32 der Kartenrumpf. Kein Auswahlfeld mit schiefem Pfeil, keine Meldung auf
der Konsole, kein Fehler auf der Seite.

*Der Screen aus Bild 1 (Todos, Filter „Statusspalte"), hell und dunkel:* Suchfeld, „Statusspalte",
„Pool" und der Schalter „Erledigte einblenden" stehen auf einer Linie, oben wie unten. Der Pfeil
sitzt im Feld. Vorher war der Pfeil am Containerrand und die Oberkanten zackig.

*Der Themenschalter (Bild 2), hell und dunkel:* „Systemvorgabe" mit dem Pfeil aus dem eigenen
Symbolsatz, 36 Pixel hoch wie die Suche daneben.

*Die Timerleiste (Bild 3), hell und dunkel, mit laufendem Timer:*
`● 00:00:11 seit 01:25 Uhr │ Ollama auf Mac deinstallieren │ ■ Stoppen` — eine Zeile, ein Radius,
ein Rahmen, die Aktion am Ende. Der Ruhezustand daneben: `🕐 Kein Timer läuft. ▶ Zeit erfassen`,
gleiche Höhe, gleicher Radius, ruhige Fläche.

*Der Verschieben-Dialog:* das Auswahlfeld über die volle Dialogbreite, Pfeil innen, **ein**
Fokusring um beides. Das ist genau der Fall aus Bild 1, jetzt richtig.

*Ziehen im Tag-Baum, hell und dunkel, drei Fälle gefahren:*

```
1. Tag „Migration" auf Ordner „Wartung"
   angenommen: true    gezogene Zeile: 1    markierte Ablegestelle: 1    Wurzelstreifen: 1
   Meldung: „Migration" liegt jetzt in „Kunden / Nord AG / Wartung".
   Baum danach: … Projekte > Rollout | Wartung > Migration, Störung, Wartungsfenster …

2. Ordner „Kunden" auf seinen Nachfahren „Nord AG"   (Zyklus)
   angenommen: false   markierte Ablegestellen: 0
   Baum danach: unverändert

3. Ordner „Infrastruktur" auf den Wurzelstreifen
   angenommen: true    Wurzelstreifen: 1
   Meldung: „Infrastruktur" liegt jetzt auf der Wurzelebene.
   Baum danach: Infrastruktur (Wurzel) > Netzwerk, Server | Intern | Kunden …
```

Gesehen: Die gezogene Zeile tritt auf halbe Deckkraft zurück. Die zulässige Ablegestelle bekommt
getönte Fläche **und** gestrichelte Kontur — zwei Merkmale, nicht nur Farbe (SC 1.4.1), dieselbe
Sprache wie die Kanban-Spalte. Die Kontur liegt nach innen versetzt, damit die Liste beim
Überfahren nicht springt. Der Griff erscheint erst unter dem Zeiger, belegt seinen Platz aber
immer — sonst rückte in jeder Zeile der Zähler zur Seite.

*Musterseite, neue Karte „Formularfelder", hell und dunkel:* drei Höhen neben einem Knopf derselben
Höhe; ein Feld über die volle Breite mit Hinweis; ein gesperrtes; das Eingabefeld normal, mit
Hilfetext, fehlerhaft und gesperrt.

*Prüfungen:* `pnpm typecheck` fehlerfrei (7 Pakete), `pnpm build` fehlerfrei, `pnpm contrast`
**0 von 358 Paaren durchgefallen** (vorher 332).

Die 26 neuen Paare decken: den Stoppknopf auf der getönten Timerfläche (er sitzt seit dieser
Aufgabe nicht mehr auf der Karte, seine Füllung ist zugleich seine Grenze — SC 1.4.11), die drei
Konturzustände des Feldes gegen Karte und Filterleiste, den Aufklapp-Pfeil in Ruhe und unter dem
Zeiger, Text im Feld unter dem Zeiger, die gestrichelte Ablegestelle, den Ordnernamen darauf, den
Wurzelstreifen mit Beschriftung, den Hinweis unter dem Baum und die Timerleiste im Ruhezustand.

---

Abweichungen:

**1 — Ein Paar ist ausdrücklich ausgenommen, nicht bestanden.** Der senkrechte Strich zwischen Zeit
und Todo-Titel in der Timerleiste (`--timer-running-border` auf `--timer-running-bg`) erreicht
1,47:1 hell und 1,74:1 dunkel. Er gruppiert nur; er sagt nichts, was nicht auch ohne ihn dastünde.
Er steht mit `exempt: true` in der Liste und wird trotzdem gemessen — damit die Ausnahme eine
Entscheidung bleibt und kein Versehen. Wer den Strich zu einem Merkmal machen will, muss ihn auf
`--timer-running-fg` heben; dann ist er allerdings so laut wie der Text.

**2 — Ich habe mehr angefasst als die drei Bilder.** Auf den Bildern standen ein Auswahlfeld, ein
Themenschalter und eine Timerleiste. Der Auftrag lautete „geh alle Formularelemente durch", und die
Bilder waren Beispiele einer Ursache: Es gab keine gemeinsame Hülle. Deshalb sind auch die vier
rohen `<select>` im Vorlageneditor, das Textfeld, der Notizkasten und der Abstand im Kartenrumpf
mitgegangen. Was ich **nicht** angefasst habe: Farbsystem, Symbolsatz, Typografie-Skala, Layout der
Ansichten. Das Designsystem ist abgenommen (E-024) — es wurde fertig gemacht, nicht neu.

**3 — Die Musterseite ist nachgezogen, der Prototyp weiterhin nicht vorhanden.**
`docs/prototype/takt-ui-konzept.html` gibt es nach wie vor nicht; `docs/**` gehört mir außerdem
nicht. Die neue Karte „Formularfelder" und der korrigierte Kopfleisten-Timer in der
Zeit-Musterseite sind so abgelegt, dass ein späterer Abgleich gegen den Prototyp an einer Stelle
stattfinden kann.

**4 — `.select--md` existiert als Klasse ohne eigene Regeln.** Absicht: Die Größenklasse steht
immer im Markup, damit sie sich targetieren lässt; die mittlere Größe braucht nur keine Abweichung
von der Grundregel.

---

Offene Fragen:

**1 — Der Stoppknopf auf der Kanban-Karte bleibt ein nacktes Quadrat.** In der Kopfleiste ist das
behoben, auf der Karte nicht: Dort ist der Platz wirklich knapp (drei Zeilen Titel, Etiketten,
Fußzeile), und ein Wort würde die Karte umbrechen lassen. Er hat einen vollständigen Namen für
Hilfsmittel („Timer für „…" stoppen") und wechselt Form **und** Farbe zwischen Start und Stopp, ist
also nicht farbabhängig. Ob der Auftraggeber die Karte trotzdem beschriftet haben will, ist eine
Gestaltungsfrage, die ich nicht allein entscheiden sollte — sie kostet Kartenhöhe auf jedem Board.

**2 — Beim Ziehen gibt es keine Ansage für Bildschirmleser.** Das ist bewusst so: Ziehen ist eine
reine Zeigerbewegung, und für Hilfsmittel ist der vollständige, gleichwertige Weg der Dialog
(SC 2.5.7). Wollte man den Ziehvorgang **zusätzlich** mit der Tastatur bedienbar machen — „Knoten
aufnehmen, mit den Pfeiltasten ein Ziel suchen, ablegen" —, wäre das ein eigenes Muster mit
eigenem Zustand und eigener Ansage. Ich habe es nicht gebaut, weil es den bestehenden Dialog
verdoppelt und die Pfeiltasten im Baum schon belegt sind. Wenn es gewünscht ist, gehört es als
eigene Aufgabe formuliert.

**3 — Das Auswahlfeld ist weiterhin das native `<select>`.** Damit sieht die aufgeklappte Liste aus
wie das Betriebssystem und nicht wie Takt — in dem Punkt bleibt der Abstand zu Chakra bestehen,
denn Chakra klappt eine eigene Liste auf. Ich halte das für richtig: Tastatur, Bildschirmleser,
Tippsuche und Bildlauf bei langen Listen kommen ohne eine Zeile Code, und ein nachgebautes Menü ist
die häufigste Stelle, an der eine Oberfläche ihre Zugänglichkeit verliert. Sollte der Auftraggeber
auf einer durchgestalteten Liste bestehen, ist das eine eigene, größere Aufgabe (Muster
„Combobox"/„Listbox" der WAI-ARIA Authoring Practices) — und dann für **alle** 15 Felder, nicht für
eines.

**4 — Der Höhenabgleich der Filterleiste liegt in der Leiste, nicht im Baustein.** Dass alles in
`.filterbar__controls` auf 36 Pixel steht, ist eine Regel der Leiste. Sauberer wäre, jeder Aufrufer
gäbe seinen Feldern `size="lg"` mit. Ich habe es in der Leiste gelassen, weil es dort **eine**
Stelle ist statt zwölf und weil damit auch künftige Felder von selbst passen. Wer das umdreht, muss
alle Aufrufer anfassen und darf keinen vergessen — sonst ist die Zeile wieder zackig.
