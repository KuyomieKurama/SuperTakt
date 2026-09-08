# T-214 — Eine Fläche in der falschen Rasterzelle, ein vierter Wächter, drei berichtigte Kommentare

**Aufgabe:** T-214, Welle AF (nachgestartet). **Rolle:** frontend-dev.
**Grundlage:** `docs/design/textabbau-gestalt.md` 9.6 und B-9, `.claude/team/reports/T-210-visual-qa.md`
Abschnitt 2, `.claude/team/reports/T-209-frontend-dev.md` offene Frage 1, E-076 Punkt 3, E-087
(berichtigte Fassung), E-083 Punkt 3.

**Status:** fertig.

---

## 1. O-JB — die Rasterzeile `update`

### 1.1 Was gebaut wurde

Die Vorgabe von ui-designer (`textabbau-gestalt.md` 9.6) ist eine **benannte Rasterzeile**, und
genau die steht jetzt im Bestand — nicht mehr und nicht weniger. Keine Farbe, keine neue Fläche,
kein neues Token, kein neuer Text.

| Stelle | Änderung |
|---|---|
| `.app` (`app.css:91-99`) | `grid-template-rows: auto auto auto minmax(0, 1fr)`, Flächen `"notice notice" / "update update" / "side head" / "side main"` |
| `.app` in `@media (max-width: 52rem)` (`app.css:4321-4331`) | dieselbe Zeile mitgeschrieben: fünf Zeilen, `"notice" / "update" / "side" / "head" / "main"` |
| neu `.app > .updatebar` (`app.css:150-163`) | `grid-area: update` — dieselbe Teilung wie bei `.app > .shellnotes`: Wo eine Fläche im Hüllenraster sitzt, steht bei `.app`; wie sie aussieht, bei ihrer eigenen Klasse |

**Warum das schmale Fenster mitmuß und nicht mitläuft:** Die Medienabfrage **schreibt das Raster
um** (`grid-template-areas` neu, nicht ergänzt). Ohne die Zeile `update` dort wäre der Fehler unter
52 rem unverändert geblieben — und genau das ist der Fall, den die Rechnung in T-204 nicht nannte
und den ich vor der Änderung gemessen habe (siehe 1.3, Spalte „800 px vorher": `.updatebar` bei
y=777,5, **unter** dem Inhalt).

### 1.2 Wie gemessen wurde

**Eigener Port, eigenes Verzeichnis, und ausdrücklich dasselbe Instrument wie visual-qa.** Ich habe
die Vorrichtung aus `/tmp/t210-qa/` benutzt: `b9-fixture.html` ist Zeile für Zeile aus `App.tsx`
übernommen und lädt die **echten vier Stilblätter** aus dem Bestand. Übernommen nach `/tmp/t214-qa/`
und eine Sache geändert: Statt `file://` liefert ein Wegwerf-Server auf **`127.0.0.1:17914`**
(`/tmp/t214-qa/server.mjs`) die Fixtur und die Stilblätter unter derselben Herkunft. Damit mißt
dieser Lauf zeichengleich dasselbe wie T-210 — die Zahlen der Spalte „vorher" unten sind mit
visual-qas Zahlen identisch, und das ist die Probe darauf, daß wir dasselbe messen.

Alles unter `/tmp/`, nichts davon im Bestand. Server nach der Messung beendet.
`pnpm run proof:all` und `pnpm test:e2e` sind **nicht** gelaufen (E-083 Punkt 3).

### 1.3 Die Zahlen

**1280 × 820, mit Hüllenmeldung**

| | vorher | nachher |
|---|---|---|
| `.shellnotes` | x=0 y=0 **1280×72** | unverändert |
| `.updatebar` | x=0 **y=666,5 240×153,5**, `grid-area: auto` | x=0 **y=72 1280×42,5**, `grid-area: update` |
| `.app__sidebar` | y=72, 240×594,5 | y=114,5, 240×705,5 |
| `.app__main` | 1040×**542,5** | 1040×**653,5** |
| Zeilen von `.app` | `72px 52px 542.5px 153.5px` (vier — die letzte implizit) | `72px 42.5px 52px 653.5px` |

**1280 × 820, ohne Hüllenmeldung**

| | vorher | nachher |
|---|---|---|
| `.updatebar` | x=0 **y=0 240×153,5** (Zeile 1, Spalte 1) | x=0 **y=0 1280×42,5** |
| `.app__main` | 1040×**614,5** | 1040×**725,5** |
| Zeilen von `.app` | `153.5px 52px 614.5px` | `0px 42.5px 52px 725.5px` |

**800 × 820 (einspaltig)**

| | vorher | nachher |
|---|---|---|
| mit Hüllenmeldung | `.updatebar` **y=777,5**, 800×42,5 — unter dem Inhalt | y=72, 800×42,5 — über Seitenleiste, Kopf und Inhalt |
| ohne Hüllenmeldung | y=0, 800×42,5 (zufällig richtig, weil es nur eine Spalte gibt) | y=0, 800×42,5 |

**Drei Befunde, die die Messung bestätigt und die die reine Rechnung nicht hatte:**

1. **Die Breite.** 240 px statt 1280 in beiden Fällen — die Selbstplatzierung nimmt eine Spalte,
   nicht die Zeile. Jetzt 1280.
2. **Die Höhe der Leiste selbst.** In der 240-px-Spur umbricht der Satz auf **153,5 px**; über die
   volle Breite sind es **42,5 px**. Der Schaden war also nicht nur die falsche Stelle, sondern
   auch die dreifache Höhe.
3. **Der Inhaltsbereich.** `.app__main` gewinnt **111 px** in beiden Fällen zurück (542,5 → 653,5
   und 614,5 → 725,5) — genau die 153,5 der falsch umbrochenen Leiste minus die 42,5, die sie
   richtig braucht.

### 1.4 Die Gegenprobe: der Regelfall kostet nichts

Der Fall, der in 999 von 1000 Sitzungen gilt — **keine** Hüllenmeldung und **keine**
Sitzungsleiste — ist unverändert. Gemessen bei 1280 × 820 nach der Änderung:

```
grid-template-rows: 0px 0px 52px 768px
.app__sidebar  x=0 y=0 240×820      (volle Fensterhöhe)
.app__header   x=240 y=0 1040×52
.app__main     x=240 y=52 1040×768
```

Beide `auto`-Zeilen sind **0 px** hoch. `.app` trägt kein `gap`; die leere Zeile kostet nichts —
die Zusage aus 9.6 ist gemessen, nicht geglaubt.

### 1.5 Zustände

Die Änderung ist reine Platzierung; Aussehen, Rolle (`role="status"`), zugänglicher Name und
Klassennamen bleiben zeichengleich (E-076 Punkt 3). Was ich trotzdem an der neu platzierten Fläche
nachgemessen habe:

| Zustand | Messung |
|---|---|
| **Leer** | kein Knoten, Zeile 0 px — 1.4 |
| **Zeiger** | „Ansehen" unter dem Zeiger, Bildbeleg `zustand-1280-hover.png` |
| **Fokus** | Tab-Weg Sprungmarke → „Ansehen": Ring `2px solid`, Abstand `2px`, Knopf bei y=80…105,5 **vollständig im Fenster** (SC 2.4.11). Bei 400 px Breite ebenso: y=107,75…133,25 |
| **Aktiv, Fehler, Rückfrage** | unverändert; sie gehören dem Dialog, nicht der Leiste |
| **Responsiv** | 1280 / 800 / 400 gemessen. Bei 400 px umbricht der Satz auf zwei Zeilen (56 px), die Leiste bleibt über die volle Breite, `.app__main` behält 409 px |

**Der modale Zweig braucht keine Zelle.** `UpdateNotice` liefert im Fall `arrival === "start"` bzw.
nach „Ansehen" den `UpdateDialog`, und dessen Wurzel im Baum ist `.scrim` mit `position: fixed`
(`components.css:2397-2399`). Feste Positionierung nimmt an der Rasterplatzierung nicht teil — der
Fehler, den O-JB behebt, hat dort keinen zweiten Ort. Geprüft im Quelltext, nicht angenommen.

### 1.6 Was diese Änderung für Bündel 4 offenläßt

9.6 schreibt die Zeile für `.app > .live-region` — den `MessageSlot`-Wirt aus Bündel 4, den es noch
nicht gibt. Die Zeile heißt jetzt so, wie sie dort heißt, und ist frei. Wenn Bündel 4 kommt, ist zu
entscheiden, ob der Wirt die Leiste **umschließt** (dann bleibt es bei einem Kind in der Fläche)
oder **neben** ihr steht (dann lägen zwei Kinder übereinander — dieselbe Falle, aus der 9.6
`update` von `notice` getrennt hat). Ich habe dafür nichts vorbereitet und nichts verbaut.

---

## 2. O-IT — die vierte Richtung, und die zwei Token fallen

### 2.1 Die Antwort auf meine eigene Frage aus T-209

**Sie fallen.** `--shadow-md` und `--shadow-drag` sind aus `packages/ui-tokens/tokens.css` entfernt
— sechs Deklarationen, je drei Blöcke (`:root`, `@media (prefers-color-scheme: dark)`,
`[data-theme="dark"]`).

Begründung je Token, weil sie verschieden ist:

* **`--shadow-drag`** war seit E-054 ausdrücklich unbelegt, und `DESIGNSYSTEM.md:546` sagte das mit
  einem Grund dazu: „Er bleibt als Stufe stehen, damit die nächste Ziehfläche nicht ihren eigenen
  Schatten erfindet." Dieser Grund hält einen Wert gegen einen Fall, den es nicht gibt. Wer eine
  Ziehfläche baut, mißt ihren Schatten **dann** — eine Zeile, mit einem gemessenen Wert. Bis dahin
  ist der Vorrat kein Vorrat, sondern eine Zusage über eine Gestalt, die niemand geprüft hat.
* **`--shadow-md`** war unbemerkt unbelegt, und die Musterseite log darüber: `FoundationsSection.tsx`
  schrieb ihm die „Auswahlliste" zu. Gemessen: `.combobox__content`, `.menu`, `.dialog`,
  `.gsearch__panel` und `.toast` tragen alle **`--shadow-lg`**. Es gab keine Fläche und es gab nie
  eine.

**Eine Ausnahmeliste für tote Token habe ich bewußt nicht gebaut.** Ein Eintrag „wir behalten das
für später" ist genau der Zustand, den diese Richtung beenden soll — und die Warnung aus T-204 9.5
(„Ablage für alles, was rot war") träfe sie beim ersten Eintrag.

### 2.2 Der Wächter

`apps/web/scripts/contrast-check.mjs`, vierte Richtung in `completenessComplaints`:

> Ein in `tokens.css` deklariertes, **farbtragendes** Token der **semantischen** Ebene, das
> **nirgends** gezeichnet wird, macht den Lauf rot.

Drei Entscheidungen darin, jede mit Grund:

1. **Die primitive Ebene ist ausgenommen.** Der Kopf von `tokens.css` sagt über `--takt-*`: „Nie
   direkt in Komponenten verwenden." Daß keine Fläche sie zeichnet, ist ihr Zweck. **Das Loch, das
   diese Ausnahme aufreißen könnte, ist bereits zu:** Zeichnet eine Klasse doch einmal
   `--takt-rose-500` unmittelbar, fällt sie der **ersten** Richtung zur Last — die kennt den Präfix
   nicht und fragt jedes gezeichneten Farbtoken nach seinem Nachweis. Gemessen: 65 primitive
   Farbtoken, **0** davon in `apps/web/src` gezeichnet.
2. **„Nirgends" heißt nirgends, nicht „nicht in der Oberfläche".** `tokens.css` hat zwei Bezieher —
   `apps/web/src/main.tsx` und `apps/outlook-addin/src/main.tsx`. Eine Richtung, die die Streichung
   eines Tokens fordert, muß **alle** Bezieher sehen, sonst verlangt sie die Streichung eines
   Tokens, das im Add-in eine Fläche hat. Die vierte Richtung liest deshalb zusätzlich
   `apps/outlook-addin/src` (33 Dateien) — **gelesen, nicht geschrieben**; die Dateihoheit bleibt,
   wo sie ist. Die Richtungen 1 bis 3 bleiben ausdrücklich auf `apps/web/src`: Sie fragen nach der
   **Paarliste dieses Laufs**, und die beschreibt die Flächen der Oberfläche. Gemessen: heute macht
   die Erweiterung **keinen** Unterschied (kein semantisches Token wird allein vom Add-in
   gezeichnet) — sie ist gegen morgen gebaut, und das steht so im Kommentar.
3. **Gelesen wird vom Dateisystem, beide Bäume** (E-087, berichtigte Fassung). Fehlt ein fremder
   Baum, fällt er still weg: Die Frage wird dadurch strenger, nie milder, und ein fehlendes
   Verzeichnis darf den Kontrastlauf der Oberfläche nicht abbrechen.

### 2.3 Gegenproben — zwei neue, beide gemessen

`completenessComplaints` nimmt jetzt die Liste der deklarierten Farbtoken als drittes Argument,
damit die Gegenproben **mit eingesetzter Verletzung** dieselbe Logik fahren statt einer zweiten
Fassung — dieselbe Bauart wie die drei Gegenproben aus T-209.

| Gegenprobe | Was sie zeigt |
|---|---|
| „ein deklariertes, nirgends gezeichnetes Farbtoken macht den Lauf rot" | `--erfundener-toter-farbwert` in die Liste gesetzt → **genau ein** Befund, und zwar dieser. Vorgeschaltet die Prüfung, daß der Bestand selbst sauber ist — sonst mißt die Gegenprobe nicht mehr, wofür sie da ist |
| „die Ausnahme der primitiven Ebene stellt die vierte Richtung nicht stumm" | `--takt-neutral-500` (deklariert, ungezeichnet) schweigt; **derselbe Wert ohne Rampenpräfix** meldet sich. Das ist die Probe darauf, daß die Ausnahme am Präfix hängt und nicht die Richtung insgesamt abschaltet |

**Dazu die Probe am echten Bestand, nicht nur an der eingesetzten Liste:** Ich habe `--shadow-md`
in `tokens.css` **wieder eingesetzt** und den Lauf gefahren — **Exitcode 1**, Befund wortgenau
(`--shadow-md ist in tokens.css deklariert und trägt eine Farbe, aber keine Fläche zeichnet es …`);
nach dem Zurücklegen wieder Exitcode 0.

### 2.4 Mitgezogen

* `apps/web/src/showcase/FoundationsSection.tsx` — die Schattentabelle hat statt fünf jetzt drei
  Einträge, und `--shadow-lg` heißt „Auswahlliste, Menü, Dialog" statt „Dialog, Kontextmenü". Der
  Grund steht als Kommentar darüber.
* `apps/web/design/DESIGNSYSTEM.md` 4.3 — von „fünf Stufen" auf drei, mit der gefallenen Begründung
  im Klartext und der neuen Regel („macht `pnpm contrast` rot").
* `packages/ui-tokens/tokens.css:370` — der Kommentar an `--z-drag` verwies auf `--shadow-drag`. Ein
  Verweis auf ein Token, das es nicht mehr gibt, ist schlimmer als keiner; er ist gefallen.

---

## 3. O-IW — welche Kommentare berichtigt wurden

Beim Bauen sind mir **vier** Stellen begegnet, die etwas anderes begründeten, als danebenstand.
Alle vier berichtigt:

1. **`app.css:57-90`, der Kopf von `.app`:** „Ein Raster mit zwei Spalten und **drei** Zeilen",
   samt Strichzeichnung mit drei Zeilen. Daneben standen vier Kinder, von denen eines keine Zeile
   hatte, und eine Medienabfrage mit vier Zeilen. → Vier Zeilen, Zeichnung ergänzt, dazu der Satz
   **„Jedes Kind steht in einer benannten Fläche"** mit dem gemessenen Grund.
2. **`app.css:1826-1842`, der Kopf von `.updatebar`:** „Sie steht im Fluss über dem Inhalt und
   schiebt ihn nach unten, statt ihn zu verdecken." Das war eine **Absicht**, keine Beschreibung:
   Die Fläche war 240 px breit, und mit Hüllenmeldung stand sie **unter** dem Inhalt, den sie
   schieben sollte. → Der Satz bleibt (er ist jetzt wahr), darunter steht, seit wann und warum, und
   ein Verweis auf `.app > .updatebar`.
3. **`FoundationsSection.tsx:121`,** die Beschriftung `--shadow-md` → „Auswahlliste". Die
   Auswahlliste trägt `--shadow-lg`. → Zeile gefallen, `--shadow-lg` heißt jetzt so, wie es ist.
   (Kein Kommentar, sondern eine Beschriftung — aber dieselbe Fehlerklasse, und die Musterseite ist
   die Referenz, die andere lesen.)
4. **`contrast-check.mjs`, die Schlußzeile:** „N von 83 gezeichneten Farbtoken ohne Nachweis". Seit
   der vierten Richtung kann ein Befund ein Token betreffen, das gerade **nicht** gezeichnet wird —
   die Zeile hätte einen toten Token als „gezeichnet ohne Nachweis" gezählt. → „N Befunde zur
   Vollständigkeit bei 83 gezeichneten und 83 semantisch deklarierten Farbtoken."

In `BoardScreen.tsx` bin ich in dieser Aufgabe nicht gewesen; die Kommentare dort habe ich
überflogen und nichts gefunden, was ich ohne eine Änderung daneben hätte berichtigen sollen.

---

## 4. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0** — acht Projekte, dazu `typecheck:test` und `typecheck:e2e` |
| `pnpm test` | **77 Dateien, 1464 Tests grün** |
| `pnpm --filter @takt/web build` | grün, 2,04 s |
| `pnpm --filter @takt/web build:designsystem` | grün, 2,11 s (die Musterseite ist mitgeändert) |
| `pnpm run contrast` | **253 Paare / 506 Messungen / 0 durchgefallen**, **11 Gegenproben** (vorher 9), **83 gezeichnete Farbtoken, 0 ohne Nachweis**, neu: **83 semantische Farbtoken deklariert, 0 ungezeichnet** (65 primitive ausgenommen; 33 Dateien des Add-ins mitgelesen). Vorher: 85 semantische, davon 2 ungezeichnet |
| `pnpm run proof:surface` | **20 / 0**, 12 Gegenproben |
| `pnpm run proof:foreign` | **20 / 0**, 3 Gegenproben |
| `pnpm run proof:codepoints` | **45 / 0** |
| `pnpm run proof:all`, `pnpm test:e2e` | **nicht gefahren** (E-083 Punkt 3) |

**Warum die Zahl der Paare gleich bleibt:** Die zwei gefallenen Token standen in keinem Paar — sie
standen in `noContrastQuestion` auch nicht (dort stehen `--shadow-xs`, `--shadow-sm`, `--shadow-lg`,
`--bg-scrim`, alle vier gezeichnet). Sie waren genau der Fall, den bis heute keine Richtung
abdeckte.

**E-087, berichtigte Fassung, angewandt:** Nach den entfernten Namen habe ich über den **Wortlaut**
gesucht, und über **beides** — `git ls-files` **und** den Dateibaum unter `apps/`, `packages/`,
`docs/`. Übrig sind drei Fundstellen, alle absichtlich (die Aufzeichnung des Falls in
`DESIGNSYSTEM.md`, im Kommentar der Musterseite und im Kopf des Kontrastlaufs) sowie zwei
Verlaufsdateien in fremder Hoheit (`board.md`, `T-118-frontend-dev.md`).

## Artefakte

* `apps/web/src/styles/app.css` — Rasterzeile `update` in beiden Rasterfassungen, neue Regel
  `.app > .updatebar`, zwei berichtigte Kommentare
* `apps/web/scripts/contrast-check.mjs` — vierte Richtung, zweiter Lesebaum für sie allein, zwei
  Gegenproben, berichtigte Schlußzeile, Grenze im Kopf des Laufs
* `packages/ui-tokens/tokens.css` — `--shadow-md` und `--shadow-drag` gefallen (6 Deklarationen),
  Verweis an `--z-drag` berichtigt
* `apps/web/src/showcase/FoundationsSection.tsx` — Schattentabelle auf drei Stufen, Beschriftung
  von `--shadow-lg` berichtigt
* `apps/web/design/DESIGNSYSTEM.md` — Abschnitt 4.3 neu
* `.claude/team/reports/T-214-frontend-dev.md`

Wegwerfvorrichtung unter `/tmp/t214-qa/` (Server, Fixtur, drei Meßskripte, Bildbelege) — außerhalb
des Bestands, Server beendet.

## Annahmen

1. **Der Wirt der Zeile `update` ist heute `.updatebar`, nicht `.live-region`.** 9.6 schreibt
   `.app > .live-region { grid-area: update; }` und meint den `MessageSlot` aus Bündel 4, den es
   noch nicht gibt. Die **Zeile** ist die Entscheidung; welches Kind heute darin steht, ist die
   Umsetzung. Ich habe die Zeile gebaut und das vorhandene Kind hineingesetzt.
2. **Die zwei Token fallen, statt einen Grund zu bekommen.** Die Entscheidung war mir ausdrücklich
   überlassen; die Begründung steht in 2.1. Sie hebt eine bestehende Aussage in `DESIGNSYSTEM.md`
   auf, und das steht dort im Klartext statt still ersetzt.
3. **Die primitive Ebene wird am Präfix `--takt-` erkannt.** Das ist die im Kopf von `tokens.css`
   dokumentierte Konvention und keine Erfindung dieses Laufs.
4. **Die vierte Richtung darf `apps/outlook-addin/src` lesen.** Hoheit regelt das Schreiben. Ein
   Wächter, der die Streichung eines Tokens fordert, muß alle Bezieher der Tokendatei sehen; täte
   er es nicht, wäre er falsch, nicht bloß eng.
5. **Die Beschriftung von `--shadow-lg` durfte berichtigt werden.** Sie ist Text der Musterseite
   (nicht ausgeliefert), kein Produkttext und kein zugänglicher Name — E-078 verbietet Hinzufügen,
   nicht Richtigstellen.

## Risiken

* **`.app` hat weiterhin keinen Wächter gegen das nächste selbstplatzierte Kind.** Der Fehler ist
  behoben, die Fehlerklasse nicht. Ein Kind ohne `grid-area` landet still in der Spur der
  Seitenleiste — sichtbar erst, wenn jemand hinsieht, und die Sitzungsleiste erscheint praktisch
  nie. Ein Kommentar ist dagegen schwächer als ein Lauf. Vorschlag in „Nächster Schritt".
* **Die Sitzungsleiste hat keine Fläche auf der Musterseite.** `UpdateNoticeSection.tsx` zeigt den
  Dialog, nicht die Leiste. Das ist der zweite Grund, aus dem die falsche Zelle zwei Wellen lang
  unbemerkt blieb — im Entwicklungsbau erscheint sie erst nach einer zweiten Antwort der
  Versionsprüfung.
* **Zwei gebaute Add-in-Stilblätter tragen die gefallenen Token noch** —
  `apps/desktop/src-tauri/taskpane/assets/index-*.css` und dasselbe unter `target/debug/`. Beides
  sind unversionierte Bauerzeugnisse (`git ls-files` kennt sie nicht) und erneuern sich beim
  nächsten Add-in-Bau. Ich habe sie nicht angefaßt: Der Bau des Add-ins gehört integration-dev.
* **`--z-drag` ist derselbe Fall und fällt durch das Netz.** Deklariert, nirgends gezeichnet, aber
  **ohne Farbwert** — die vierte Richtung fragt nach Farbe. Das steht als Grenze im Kopf des Laufs,
  damit die Zahl „0 ungezeichnet" nicht für mehr gehalten wird, als sie ist. Ich habe das Token
  stehen lassen: Eine Ebenenskala mit einer Lücke ist schwerer zu lesen als eine mit einer
  unbelegten Stufe, und das ist eine Gestaltfrage, keine Kontrastfrage.
* **Der modale Zweig ist aus dem Quelltext geschlossen, nicht gemessen.** `.scrim` ist
  `position: fixed` und nimmt an der Rasterplatzierung nicht teil. Eine Messung bräuchte die volle
  Kette (Dienst, Hüllenattrappe, GitHub-Attrappe) — das ist visual-qas Werkzeug, nicht meins, und
  E-083 Punkt 3 hält mich ohnehin von `test:e2e` fern.

## Offene Fragen

1. **An ui-designer, klein und terminlich:** Wenn Bündel 4 den `MessageSlot`-Wirt bringt — umschließt
   `.live-region` die Leiste, oder steht sie daneben? Im zweiten Fall lägen zwei Kinder in der
   Fläche `update` übereinander, und es bräuchte eine sechste Zeile. Die Antwort kostet einen Satz
   und verhindert genau den Fehler, den O-JB gerade behoben hat.
2. **An den Orchestrator:** Soll `proof:surface` eine Regel bekommen, die jedes im Baum
   geschriebene direkte Kind von `.app` auf eine `grid-area` prüft? Die Bauart ist unangenehm (sie
   müßte JSX lesen, nicht nur CSS), der Nutzen ist der, den T-210 gemessen hat: Der Fehler ist auf
   dem Bildschirm unsichtbar, bis jemand die Zellen abliest. Ich habe sie nicht gebaut — das wäre
   ein eigener Auftrag, kein Nebenprodukt.
3. **An visual-qa:** Ich habe eure Vorrichtung benutzt und dieselben Zahlen bekommen wie ihr. Wenn
   ihr nachmeßt, genügt `/tmp/t214-qa/measure.mjs` bei laufendem `/tmp/t214-qa/server.mjs`. Offen
   bleibt allein, was ich nicht messen konnte: die Leiste in **beiden Themen** — geändert hat sich
   keine Farbe, aber gesehen habe ich nur das helle.

## Nächster Schritt

1. **visual-qa** nimmt die Leiste in beiden Themen mit; Geometrie ist gemessen, Farbe nicht.
2. **Orchestrator** entscheidet offene Frage 2 (Regel in `proof:surface`) und nimmt für Bündel 4 den
   Satz aus offener Frage 1 von ui-designer mit — die Zeile `update` steht, ihr zweites Kind ist
   noch nicht entschieden.
3. **documenter** prüft, ob außerhalb von `DESIGNSYSTEM.md` noch von fünf Schattenstufen die Rede
   ist; in `apps/web/**` und `packages/ui-tokens/**` ist es nicht mehr der Fall.
