# T-216 — Der Fokusring, der sichtbar wird, ohne dass eine Farbe sich ändert

**Aufgabe:** T-216, Welle AG. **Rolle:** frontend-dev.
**Vorlage:** `docs/design/traeger-und-zusage.md` Abschnitt 10 (T-213), namentlich 10.2, 10.3, 10.7
und die Übergabe 10.11; Messung `.claude/team/reports/T-210-visual-qa.md` (B-11, B-12); Board
O-JA, O-JC, O-JD, O-JG; E-076 Punkt 3, E-087, E-083 Punkt 3; WCAG 2.2 SC 1.4.1, SC 1.4.11,
SC 2.4.7.

**Status: fertig.**

---

## 1. Was gebaut wurde

Zwei hoch eingestufte Barrierefreiheitsbefunde sind behoben, und beide ohne einen einzigen neuen
Farbwert. Der Vertrag nach E-076 Punkt 3 ist unberührt: keine Rolle, kein zugänglicher Name, kein
Klassenname, kein Token geändert.

### 1.1 O-JA und O-JD — die beiden Ringbänder tauschen den Platz

`apps/web/src/styles/base.css`. `.on-solid:focus-visible` verliert seine `outline-color`-Zeile;
den Gegenton trägt jetzt der Schatten. Danach zeichnet dieselbe Regel von der Knopfkante nach
außen:

```
0 .. 2px   --focus-ring-contrast   Schatten, beruehrt die Fuellung
2 .. 4px   --focus-ring-color      Kontur aus :focus-visible, beruehrt die Flaeche
ab 4px     die Flaeche
```

Der Kommentar darüber ist neu geschrieben. Er nennt die Geometrie, die drei Nahtstellen, den
Befund von T-210 mit seinen 1,00:1, den Beweis aus 10.3 (für die alte Anordnung existiert im
dunklen Thema **kein** gültiger Wert — L ≤ 0,065 gegen die Füllungen, L ≥ 0,133 gegen die Flächen,
Schnitt leer) und die Grenze zur Malreihenfolge (Abschnitt 4 unten).

Der Eröffnungssatz aus T-013 („einen **hellen** Gegenring") ist dabei mitberichtigt. Er war schon
vor dieser Aufgabe unwahr: Im dunklen Thema ist `--focus-ring-contrast` `#06101f`, das dunkelste
Blau der Palette. Das ist genau die Textsorte, auf die W-2 aus 10.9 zielt, und sie lag mir unter
den Fingern.

`packages/ui-tokens/tokens.css`: **nur Kommentare.** `--focus-ring-color` „der Ring; liegt aussen
und traegt gegen die Flaeche", `--focus-ring-contrast` „Gegenband; liegt innen an der Fuellung
eines gefuellten Bedienelements". Die alte Zeile *„aeusserer Ring auf dunklen Flaechen"* war nach
dem Tausch doppelt falsch und ist weg.

### 1.2 O-JC — die Randschiene der Kachel „Überfällig"

`apps/web/src/styles/app.css`, `.stat--danger` bekommt die Bauform von `.shellnote--startup`:
4 px `border-inline-start` in `--danger-bg`, dazu `padding-inline-start: calc(var(--space-4) - 3px)`,
damit die Inhaltsspalte stillsteht. Die drei anderen Kacheln bleiben unverändert — die Rangaussage
lebt davon, dass nur eine eine Schiene hat.

Der Kommentar ist auf den Wortlaut aus 10.7.4 berichtigt: Die Schiene trägt, Fläche und Rahmen
verstärken. Die Zahlen stehen dabei.

### 1.3 O-JG, zweiter Teil — die Zusage stand an zwei Stellen

`apps/web/src/screens/parts.tsx`, `StatTile`-Vertragskommentar zu `tone="danger"`. Dort stand
derselbe widerlegte Satz („Rahmen **und** Fläche wechseln") wie in `app.css` — die Stelle, an der
ein Entwickler ihn zuerst liest. Er ist auf die Schiene berichtigt und verweist auf den Lauf.

Ich habe nach einer dritten Kopie gesucht (`A-19.4`, „Graustufen", „auffälligste" über
`apps/web/src` und `apps/web/design`): es gibt keine. `DashboardScreen.tsx` behauptet nichts über
Farbe.

### 1.4 O-JG, erster Teil — der Kommentarblock im Lauf

`apps/web/scripts/contrast-check.mjs`:

* Der Block über dem Gegenring-Paar (alt: *„beide liegen ausserhalb … Ein Paar gegen `--accent-bg`
  waere gruen und wuerde eine Nachbarschaft messen, die es nicht gibt"*) ist vollständig ersetzt.
  Er begründete die Paarwahl mit der alten Anordnung und wäre nach dem Tausch die nächste
  unwahre Zusage gewesen.
* Die Grenzbeschreibung im Dateikopf behält ihr Beispiel und bekommt den Zusatz „seit T-216
  behoben: die Grenze bleibt, der Fall ist keiner mehr".
* Die Notiz des T-209-Paares nennt jetzt die **mittlere** der drei Nahtstellen. Das Paar selbst
  ist zeichengleich geblieben.

### 1.5 Die Musterseite

`apps/web/design/DESIGNSYSTEM.md`, Abschnitt 5. Der Satz *„auf gefüllten Flächen kommt über die
Klasse `on-solid` ein heller Gegenring dazu"* sagte nicht, **wo** das Band liegt, und trug keine
Zahl. Er ist durch zwei Absätze ersetzt: Lage, alle vier Zahlen, der kleinste Wert der Reihe und
warum nicht zurückgedreht wird.

---

## 2. Die sechs Zeilen im Lauf

Abgeschrieben aus 10.11, nicht neu gerechnet. **Kein `over` an einer der sechs Zeilen** — keiner
der fünf beteiligten Hintergründe ist teildurchsichtig, und der Lauf weist ein wirkungsloses
`over` seit T-197 ohnehin ab.

| Zeile | Gruppe | Art | hell | dunkel |
|---|---|---|---:|---:|
| `--focus-ring-contrast` / `--accent-bg` | Anwendung | min 3 | **5,98** | **6,26** |
| `--focus-ring-contrast` / `--danger-bg` | Anwendung | min 3 | **6,75** | **7,98** |
| `--focus-ring-contrast` / `--bg-disabled` | Anwendung | Ausnahme | 1,12 | 1,21 |
| `--danger-bg` / `--danger-bg-subtle` | Anwendung | min 3 | **6,07** | **6,78** |
| `--danger-bg` / `--bg-canvas` | Anwendung | min 3 | **6,34** | **7,84** |
| `--danger-bg-subtle` / `--bg-canvas` | Anwendung | Ausnahme | 1,04 | 1,15 |

**Eine Zahl der Vorgabe stimmte nicht, und der Lauf hat es gesagt.** Die Ausnahme für die
Kachelfläche sollte nach 10.11.2 den Vermerk „1,04 hell, **1,11** dunkel" tragen. 1,11 ist der
Wert von `--danger-bg-subtle` gegen `--bg-surface` im **hellen** Thema — die Gegenprobe aus
Abschnitt 10 des Papiers, im dunklen Slot verrutscht. Gegen die Leinwand misst der Lauf dunkel
**1,15**. Die Einordnung ändert sich nicht (beide weit unter 3, die Fläche bleibt Verstärkung),
die Zahl schon. Ich habe die gemessene eingetragen und den Grund als Kommentar danebengestellt,
damit die 1,11 nicht als Berichtigung zurückkommt. Dieselbe Berichtigung steht in `app.css`.

Aus demselben Grund stehen im Quelltext **5,98** statt der von Hand gerechneten 5,99 und **9,23**
statt „~9,2": Was der Lauf sagt, sagt der Lauf (E-087). Die kleinste Zahl der ganzen Reihe bleibt
**5,33** (`--focus-ring-color` gegen `--bg-subtle`, hell) — knapp das Doppelte dessen, was
SC 1.4.11 fordert.

---

## 3. Im Browser gemessen

Eigene Fixtur unter `/tmp/t216-fe/`, eigener Port für den Entwicklungsserver (**5199**, nicht
5173), damit nichts mit den nebenher laufenden Aufgaben kollidiert. Die Fixtur bindet die
**Produktions-Stilblätter** über `file://` ein und benutzt die Klassen, die `Primitives.tsx`
tatsächlich vergibt. Gemessen wird an **gezeichneten Pixeln** aus einem Bildschirmabzug, nicht an
`getComputedStyle` — dieselbe Methode wie T-198 und T-210.

**Prüfziel aus 10.11.5: drei Zonen, zwei deutliche Übergänge, an allen vier Kombinationen.**
Erfüllt. Die Pixelreihe läuft waagerecht durch die Knopfmitte; negative Werte sind Abstände nach
außen:

| Kombination | Zonen (Knopfkante nach außen) | Naht Füllung\|Gegenband | Naht Gegenband\|Kontur | Naht Kontur\|Fläche |
|---|---|---:|---:|---:|
| Primär, hell | `#2159da` → `#ffffff` (2px) → `#2159da` (2px) → `#ffffff` | **5,99** | **5,99** | **5,99** |
| Gefahr, hell | `#ac2a22` → `#ffffff` (2px) → `#2159da` (2px) → `#ffffff` | **6,76** | **5,99** | **5,99** |
| Primär, dunkel | `#6091f8` → `#06101f` (2px) → `#93b4fc` (2px) → `#131b2b` | **6,27** | **9,24** | **8,34** |
| Gefahr, dunkel | `#ee8d87` → `#06101f` (2px) → `#93b4fc` (2px) → `#131b2b` | **7,98** | **9,24** | **8,34** |

Die Pixelwerte sind mit den Tokenwerten **zeichengleich**; die Verhältnisse decken sich mit dem
Lauf auf zwei Stellen. Vor der Änderung stand hier für *Primär, hell* eine einzige Kante und
1,00 an beiden anderen (T-210).

**O-JD ist damit belegt.** Der Gefahrenknopf im hellen Thema, den T-210 als „unbetroffen" führte,
hatte seine Füllungsnaht bei 1,13 in Graustufen — der Ring hing allein am Farbton Blau gegen Rot.
Jetzt sind es **6,76**, gemessen an Pixeln. Das ist der messbare Unterschied, den F-9 des Papiers
erwartet hat.

**Weitere Zustände, gemessen statt behauptet:**

* **Hoher Kontrast** (`--focus-ring-width: 3px`). Die Geometrie wird 0–2 px Gegenband, 2–5 px
  Kontur: Breiter wird das Band, das gegen die Fläche trägt. Alle Nahtstellen unverändert
  (5,99 / 5,99 / 6,76 hell, 8,34 / 9,24 / 7,98 dunkel). Nichts zu tun, wie 10.6 vorhergesagt hat.
* **Weich gesperrt** (`aria-disabled="true"`). Der Ring bleibt. Getragen wird er von der äußeren
  Kontur — 5,99 hell, 8,34 dunkel gegen die Karte. Das Gegenband trägt dort nicht (an Pixeln
  1,46 hell und 1,74 dunkel gegen die Kante des gesperrten Knopfes; als Tokenpaar 1,12 / 1,21
  gegen `--bg-disabled`). Genau ein Band ist begrenzt, wie vor dem Tausch — nur auf der anderen
  Seite. Das ist die benannte Ausnahme.
* **Sekundär und Geist.** Unverändert, ein Band, beide Nachbarn sind die Fläche: 5,99 hell,
  8,34 dunkel.
* **Tastatur.** Sechsmal Tabulator über die Musterseite in beiden Themen: jedes Ziel ist ein
  Bedienelement, jedes zeigt den Ring. Die Bildschirmabzüge der lebenden Anwendung
  (`/tmp/t216-fe/screens/live-*.png`) zeigen den Doppelring an echten Knöpfen.

**Die Kachel:**

| | hell | dunkel |
|---|---|---|
| Zonen quer durch die Startkante | Leinwand → `#ac2a22` (**4px**) → `#fdf0ef` | Leinwand → `#ee8d87` (**4px**) → `#3a1512` |
| Schiene gegen die Leinwand | **6,35** | **7,84** |
| Schiene gegen die eigene Fläche | **6,08** | **6,79** |

Die drei anderen Kacheln haben 1 px in ihrer jeweiligen Rahmenfarbe; die Schiene ist damit das
einzige Merkmal ihrer Art in der Reihe. **Responsiv geprüft:** Bei einer Spalte stehen alle vier
Kacheln an einer gemeinsamen Startkante, und der Abstand Kante → Beschriftung ist bei allen vier
**17 px** — die Beschriftungen stehen in einer Flucht, das `padding-inline-start` tut, wozu es
dasteht. Ohne die Zeile stünde die vierte um 3 px versetzt.

---

## 4. Die Grenze, und sie steht im Quelltext

Der Tausch hängt daran, dass die **Umrandung über dem äußeren Schatten** gemalt wird. Das ist in
**Chromium gemessen** (die Reihenfolge der Zonen oben ist der Beleg) und für die beiden übrigen
ausgelieferten Engines **ungemessen**. Der Satz steht als Kommentar in `base.css` **und** in
`contrast-check.mjs`, nicht nur hier.

Was passierte, wenn eine Engine umgekehrt malte: Statt der drei Zonen läge ein einziges 4-px-Band
in `--focus-ring-contrast` an der Knopfkante — gegen die Füllung 5,98 bis 7,98, gegen die Fläche
1,00. Das liest sich als **Ring am Knopf**. Vor dem Tausch wäre es dort ein 4-px-Band in
`--focus-ring-color` gewesen: gegen die Füllung 1,00, gegen die Fläche 5,98 — also ein Knopf, der
um 4 px wächst, dieselbe Fehlerart wie der gemeldete Befund, nur breiter. **Auf beiden möglichen
Malreihenfolgen ist der Zustand nach dem Tausch besser als davor.**

---

## 5. Nachweise

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0 Fehler** |
| `pnpm test` | **77 Dateien, 1464 Prüffälle grün** |
| `pnpm --filter @takt/web build` | grün |
| `pnpm run contrast` | **0 von 518 Paaren durchgefallen — 259 Paare, 11 von 11 Gegenproben, 83 gezeichnete und 83 deklarierte Farbtoken, 0 ohne Nachweis** (vorher 253 Paare / 506 Messungen) |
| `pnpm run proof:surface` | **20 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:foreign` | **20 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |

`pnpm run proof:all` und `pnpm test:e2e` **nicht gefahren** (E-083 Punkt 3, wie beauftragt).

---

## 6. Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/styles/base.css` | `.on-solid:focus-visible` — `outline-color` entfällt, Schatten bekommt `--focus-ring-contrast`; Kommentar neu, samt Malreihenfolge |
| `packages/ui-tokens/tokens.css` | nur Kommentare an `--focus-ring-color` und `--focus-ring-contrast` |
| `apps/web/scripts/contrast-check.mjs` | Kommentarblock ersetzt, Zusatz im Dateikopf, vier Paare, zwei Ausnahmen, Notiz des T-209-Paares |
| `apps/web/src/styles/app.css` | `.stat--danger` bekommt die Randschiene; Kommentar berichtigt |
| `apps/web/src/screens/parts.tsx` | zweite Kopie der widerlegten Zusage berichtigt |
| `apps/web/design/DESIGNSYSTEM.md` | Abschnitt 5, Fokus: Lage der Bänder und die vier Zahlen |
| `/tmp/t216-fe/` | Messfixtur, `measure.mjs`, `hc.mjs`, `live.mjs`, Bildschirmabzüge — für die Nachmessung durch visual-qa |

---

## 7. Annahmen

1. **10.11.4 habe ich nicht gebaut.** Die vier empfohlenen Paare `--focus-ring-color` gegen die
   getönten Flächen (`--danger-bg-subtle`, `--warning-bg`, `--info-bg`, `--success-bg`) sind im
   Papier ausdrücklich *„empfohlen, nicht bindend"*, und der Auftrag hat sechs Zeilen benannt und
   drei Zusatzpunkte aufgezählt — 10.11.4 war keiner davon. Ich habe die Zählung nicht eigenmächtig
   verändert. Es sind vier Zeilen, alle acht Werte sind gerechnet und grün (5,39 bis 7,85);
   Vorschlag steht unter „Nächster Schritt".
2. **Zahlen aus dem Lauf schlagen Zahlen aus der Vorgabe.** Wo die Handrechnung des Papiers und
   der Lauf auseinandergehen (5,99 → 5,98; ~9,2 → 9,23; 1,11 → 1,15), steht die gemessene Zahl im
   Quelltext und der Grund als Kommentar daneben. E-087, und der Fall ist klein genug, dass eine
   Rückfrage teurer gewesen wäre als die Notiz.
3. **Den Eröffnungssatz aus T-013 habe ich mitberichtigt** („heller Gegenring" → „Gegenband", mit
   dem Hinweis, dass er im dunklen Thema das dunkelste Blau ist). Er stand nicht im Auftrag, aber
   in derselben Zeile, die ich ohnehin neu geschrieben habe, und er ist genau die Textsorte, gegen
   die W-2 gedacht ist.
4. **Die Messung des Themenwechsels braucht eine Wartezeit.** `components.css` legt Übergänge auf
   die Farben; wer `data-theme` umsetzt und sofort abzieht, misst eine Zwischenfarbe. Mir ist das
   im ersten Lauf passiert (`--accent-bg` dunkel wurde als `#5b8cf6` statt `#6091f8` gemessen).
   600 ms Wartezeit lösen es. Das gehört in die Fixtur jeder künftigen Pixelmessung — siehe
   Risiken.

---

## 8. Risiken

* **R-T216-1, mittel: die Malreihenfolge außerhalb von Chromium.** Siehe Abschnitt 4. Belegt ist
  Chromium; Takt liefert die Oberfläche über den Webview der Hülle aus, und der ist je nach
  Betriebssystem ein anderer. Der Fall ist bewertet und in beide Richtungen besser als der
  Zustand davor, aber er ist nicht gemessen. Wer die Anwendung auf WebKitGTK oder WebView2 vor
  sich hat, kann ihn in zwei Minuten schließen — die Fixtur liegt bereit.
* **R-T216-2, niedrig: die Zwischenfarbe beim Themenwechsel.** Nicht der Code ist betroffen,
  sondern jede Messung, die den Übergang nicht abwartet. Ich weiß nicht, ob die dunklen Zahlen aus
  T-210 davon berührt sind; ihre hellen sind es nicht (im hellen Thema läuft kein Übergang, weil
  nichts umgeschaltet wird). Für diese Aufgabe ändert es nichts — alle vier Fälle sind nach dem
  Warten zeichengleich mit den Token.
* **B-15 aus 10.13 bleibt offen und ist nicht meine Aufgabe.** Der Ring liegt 4 px außerhalb des
  Randkastens; ein Vorfahr mit `overflow: hidden` schneidet ihn ab, und `.app` sowie `.note`
  tragen genau das. Nach dem Tausch liegt das Band, das gegen die **Fläche** trägt, außen — also
  in der Zone, die beschnitten würde. Der Tausch verschiebt damit die Empfindlichkeit dieses
  ungemessenen Falls, er erzeugt ihn aber nicht: Vorher wäre dasselbe Band abgeschnitten worden,
  nur mit der anderen Farbe. **Zu messen, nicht zu raten.**
* **B-14 aus 10.13 unverändert**: `:focus-visible` setzt `border-radius` am Element selbst. Ich
  habe die Regel unmittelbar daneben angefasst und sie nicht angerührt.

---

## 9. Offene Fragen an den Orchestrator

1. **Sollen die vier Zeilen aus 10.11.4 nachgezogen werden?** Ich habe sie bewusst gelassen
   (Annahme 1). Es sind vier Zeilen in einer Datei, die dann noch einmal geöffnet werden muss.
   Der Fall mit dem stärksten Anspruch darauf ist der Knopf **in** der Kachel „Überfällig", die
   ich gerade gebaut habe: Sein Ring steht auf `--danger-bg-subtle`, und dafür misst der Lauf
   heute nur den *Rahmen* des Knopfes, nicht den Ring.
2. **Wer misst die Malreihenfolge auf den beiden anderen Engines?** Das ist keine Frontend-Frage
   mehr, sondern eine an die Hülle. Ein Bildschirmabzug eines fokussierten Primärknopfes aus einem
   Auslieferungsbau genügt.
3. **W-2 (F-8 des Papiers)** — der Wächter „Zusage ohne Zahl" — bleibt unerledigt. Diese Aufgabe
   hat drei weitere Belege dafür geliefert: die zweite Kopie in `parts.tsx`, den Kommentarblock im
   Lauf und den Eröffnungssatz aus T-013. Alle drei hätte er gefunden; keinen davon hat der
   Vollständigkeitswächter über Token gesehen.

---

## 10. Nächster Schritt

**visual-qa fährt die Nachmessung nach 10.11.5.** Die Fixturen liegen unter `/tmp/t216-fe/`,
`node measure.mjs` genügt (ein `node_modules`-Verweis auf die Wurzel ist gesetzt). Die
Bildschirmabzüge der vier Kombinationen und der Kachelreihe liegen unter
`/tmp/t216-fe/screens/`. Die Zahlen dieses Berichts sind das, was dabei herauskommen muss;
weicht etwas ab, ist der Grund mit hoher Wahrscheinlichkeit die Wartezeit aus Annahme 4.

Danach: Entscheidung zu Frage 1, und W-2 als eigener Auftrag in einer Welle **ohne** Behebung.
