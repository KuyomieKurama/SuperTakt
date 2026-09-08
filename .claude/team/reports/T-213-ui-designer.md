# T-213 — ui-designer: der Fokusring, die Kachel, und ein Wächter über Sätze statt über Token

**Rolle:** ui-designer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Aufgabe:** T-213, Welle AF (nachgestartet) — O-JA und O-JC entscheiden, dazu die Frage nach dem
Wächter und die Kenntnisnahme zu O-IR.

---

## Kurzfassung

```
Aufgabe: T-213 — O-JA (Fokusring an gefuellten Knoepfen), O-JC (Kachel „Ueberfaellig"),
         die Frage nach einer Pruefung ueber Nachbarschaften, F-7 aus T-212
Status: fertig — beide Entscheidungen stehen, ohne einen einzigen neuen Farbwert
```

| Gegenstand | Entscheidung |
|---|---|
| **O-JA** Fokusring | **Die beiden Ringbänder tauschen den Platz.** Kein neuer Wert, kein neues Token, eine Zeile in `base.css`. Der Gegenton geht nach **innen** an die Füllung, der Rington nach **außen** an die Fläche |
| **O-JA** braucht eine Knopfart einen eigenen Wert? | **Nein, keine.** Sieben Arten je einzeln geprüft; der Gegenton trägt gegen Rot (6,75 / 7,98) sogar besser als gegen Blau (5,99 / 6,27) |
| **O-JA** Nebenbefund | **Der Gefahrenknopf im hellen Thema ist nicht „unbetroffen"**, sondern trägt seinen Ring heute allein über den **Farbton**: 1,13:1 in Graustufen. Die Behebung nimmt ihn mit |
| **O-JC** Kachel | **Randschiene**, 4 px `--danger-bg` an der Startkante, an **genau einer** der vier Kacheln. Bauform zeichengleich mit `.shellnote--startup`. Gemessen 6,07/6,79 nach innen, 6,34/7,84 nach außen |
| **O-JC** die Zusage im Quelltext | **Berichtigt, nicht zurückgenommen** — anders als bei der Schraffur in T-194 gibt es hier etwas, das trägt; es ist nur nicht das, was dasteht. Wortlaut liegt vor, **zwei** Stellen statt einer |
| **Wächter über Nachbarschaften** | **Nein.** Statt dessen **W-2 „Zusage ohne Zahl"** — ein Lauf über den **Wortlaut**, nicht über Token. 47 Fundstellen in 17 Dateien gezählt, 0 davon in `tokens.css` |
| **F-7 / O-IR** | **Meine Voraussetzung war falsch, berichtigt.** Eine Fläche ist betroffen, sie trägt eine zweite Rolle in einem Kind, und daraus folgt eine verbindliche Ergänzung zu 9.1 |

---

## 1. O-JA — was entschieden ist und warum es kein Farbwert ist

**Der Befund ist größer als der Auftrag ihn stellt.** `.on-solid:focus-visible` zeichnet zwei Bänder
und hat damit **drei** Nahtstellen: Füllung|innen, innen|außen, außen|Fläche. An diesem Maßstab
(neue **Regel T-4**) trägt heute **keine** der vier Kombinationen — nicht der Gefahrenknopf, nicht
das dunkle Thema:

| Fall | Füllung \| innen | innen \| außen | außen \| Fläche |
|---|---:|---:|---:|
| Primär, hell | 1,00 | 5,99 | 1,00 |
| Gefahr, hell | **1,13** | 5,99 | 1,00 |
| Primär, dunkel | **1,47** | ~9,2 | 1,11 |
| Gefahr, dunkel | **1,16** | ~9,2 | 1,11 |

Was die vier unterscheidet, ist nicht, ob eine starke Naht existiert — die mittlere ist überall
stark —, sondern **wo sie sitzt**. Nur beim Primärknopf im hellen Thema fällt sie genau auf die
erwartete Knopfkante, und deshalb liest man dort „der Knopf wächst". Die anderen drei sind nicht
heil, sondern glücklich. Das widerspricht T-210 nicht: visual-qa hat unter dem Maßstab *ist etwas zu
sehen* gemessen, und unter dem trägt der Gefahrenknopf. Unter 3:1 trägt er nicht — Blau gegen Rot
ist ein Farbton, kein Verhältnis.

**Entscheidung.** In `base.css` entfällt die `outline-color`-Zeile, der Schatten bekommt
`var(--focus-ring-contrast)`. Danach:

```
0 .. 2px   --focus-ring-contrast   (Gegenband, beruehrt die Fuellung)
2 .. 4px   --focus-ring-color      (Kontur, beruehrt die Flaeche)
```

Das ist keine Kosmetik, sondern die Auflösung des Fehlers: `--focus-ring-color` ist der Ton, der in
Takt **gegen die Flächen** trägt — dafür laufen vier Paare seit T-022 —, und er gehört nach außen.
`--focus-ring-contrast` gibt es nur für `.on-solid`, seine Aufgabe steht seit T-013 im Kommentar
darüber, und er kann sie nur erfüllen, wenn er die Füllung **berührt**.

**Der Beweis, dass kein Wert es sonst löst, ist arithmetisch und für das dunkle Thema abschließend.**
Bleibt die Anordnung, muss `--focus-ring-color` zugleich Gegenband und allgemeiner Ring sein. Hell
bleibt genau ein Fenster: **L ≤ 0,0018**, also ein schwarzer Fokusring für die ganze Anwendung, plus
ein zweiter neuer Wert für das Außenband. Dunkel verlangen die Füllungen L ≤ 0,065 und die Flächen
L ≥ 0,133 — **der Schnitt ist leer, es existiert kein Wert.** Dieselbe Art Beweis wie beim
geschlossenen Fenster der Vermerkschiene in T-194 Abschnitt 2.2.

**Nach dem Tausch** ist der kleinste Wert aller drei Nahtstellen in beiden Themen und an beiden
Knopfarten **5,33** — knapp das Doppelte der Forderung.

---

## 2. O-JC — die Kachel, und warum die Form und nicht die Fläche

Ein besserer Flächenwert scheitert nicht an der Arithmetik, sondern an drei Folgen:
`--danger-bg-subtle` müsste von L 0,894 auf **L ≤ 0,279** fallen; der Token trägt aber auch
Startmeldung, Sperrdialog und Fehlerchips, die Kachelreihe kippte von vier getönten Kacheln auf drei
plus ein gefülltes Meldeband, und die Zusage hinge wieder an einer einzigen Zahl.

**Also die Form, wie bei den Schienen:** 4 px `--danger-bg` an der Startkante, `border-inline-start`,
dazu `padding-inline-start: calc(var(--space-4) - 3px)`, damit die Inhaltsspalte im einspaltigen
Umbruch nicht um 3 px springt. Kein neues Mittel — `.shellnote--startup` baut seit T-097 dieselben
drei Zeilen.

**An genau einer Kachel, und das ist die Entscheidung.** Die drei anderen bleiben unverändert: Ihre
Tönung ist eine Verstärkung, über die niemand etwas zusichert, und jede ist durch Beschriftung und
Zahl vollständig bestimmt. „Überfällig" trägt eine **Rangaussage** (A-19.4: die lauteste der Reihe),
und eine Rangaussage braucht ein Merkmal, das die anderen **nicht** haben. Bekämen alle vier eine
Schiene, wäre die Rangaussage wieder weg. Verworfen und begründet: Symbol (Vertragspunkt, trägt
nicht besser), Fettung der Zahl (macht das Datum lauter, nicht den Zustand), Muster in der Fläche
(SC 1.4.3 deckelt es, wie schon 1.2), Position in der Reihe (unstet).

**Die Zusage wird berichtigt, nicht zurückgenommen** — und an **zwei** Stellen: `app.css:943-946`
**und** `screens/parts.tsx:185-190` sagen denselben widerlegten Satz. Beide Wortlaute liegen vor.
Der berichtigte Satz nennt die Schiene mit ihren vier Zahlen, stuft Fläche und Rahmen als
Verstärkungen ein, nennt den dritten Träger, den keiner der beiden alten Sätze hatte (die Kachel
erscheint bei null gar nicht), und schreibt den Rechenweg dazu, damit der bessere Flächenwert nicht
in zwei Jahren neu erfunden wird.

---

## 3. Die Paare, und was der Lauf danach misst

**Neu, mit Mindestwert (4):**

| Paar | min | hell | dunkel |
|---|---:|---:|---:|
| `--focus-ring-contrast` / `--accent-bg` | 3 | 5,99 | 6,27 |
| `--focus-ring-contrast` / `--danger-bg` | 3 | 6,75 | 7,98 |
| `--danger-bg` / `--danger-bg-subtle` | 3 | 6,07 | 6,79 |
| `--danger-bg` / `--bg-canvas` | 3 | 6,34 | 7,84 |

**Neu, benannte Ausnahme mit Zahl und Grund (2):** `--focus-ring-contrast` / `--bg-disabled`
(1,12 / 1,21 — der weich gesperrte Knopf verliert die Füllung, dort trägt die äußere Kontur);
`--danger-bg-subtle` / `--bg-canvas` (1,04 / 1,11 — Verstärkung, die Obergrenze steht in den drei
vorhandenen Textpaaren auf demselben Token).

**Unverändert und schon grün:** das Paar aus T-209 (mittlere Naht, nur die Notiz wird berichtigt)
und die vier Paare `--focus-ring-color` gegen `--bg-surface`, `--bg-canvas`, `--bg-subtle`,
`--bg-surface-alt`. **Das ist der eigentliche Vorzug der Lösung:** Die äußere Naht des Doppelrings
ist nach dem Tausch von Paaren gemessen, die es seit T-022 gibt — sie messen zum ersten Mal die
Naht, die sie behaupten.

**Zum Feld `over`: bei keiner der sechs Zeilen.** `over` ist seit T-197 Pflicht, wenn `bg`
teildurchsichtig ist; `--accent-bg`, `--danger-bg`, `--bg-disabled`, `--danger-bg-subtle`,
`--bg-canvas` und `--focus-ring-color` sind sämtlich deckende Hexwerte in beiden Themen. Geflächt
wird über nichts, weil nichts durchscheint. Der Satz steht im Papier, damit es niemand „aus
Konsistenz" nachträgt.

**Zum Vollständigkeitswächter:** Er bleibt bei 83/0. Alle beteiligten Token haben schon Paare; keine
Zeile dieser Aufgabe entsteht aus seiner Forderung.

**Empfohlen, nicht bindend:** vier weitere Paare `--focus-ring-color` gegen die getönten Flächen
(`--danger-bg-subtle`, `--warning-bg`, `--info-bg`, `--success-bg`), auf denen nachweislich
fokussierbare Bedienelemente stehen. Alle acht Werte gerechnet, alle grün (5,39 bis 7,85).

---

## 4. Der Wächter — nein über Nachbarschaften, ja über Sätze

Der Wächter aus T-209 findet B-12 nicht, weil beide Token Paare haben, nur nicht gegeneinander. Eine
Prüfung über **Nachbarschaften** löst das nicht: 83 Token ergeben 3403 Paare, und welche davon
einander berühren, steht erst in der aufgelösten Kaskade über dem gezeichneten Kastenbaum — also in
einem Browser. Das ist genau die Grenze, die als B-13 schon im Kopf des Laufes steht.

**Die vier Funde dieser Bauart** (T-189-5, T-189-6, B-12, der Kommentar über `.on-solid`) haben
etwas anderes gemeinsam: dieselbe **Textsorte**. Ein Kommentar sichert Erkennbarkeit ohne Farbe zu,
und keine Zahl steht dahinter. Diese Textsorte ist endlich und greifbar. Gezählt (Verzeichnisdurchlauf,
nicht `git grep` — E-087): **47 Fundstellen in 17 Dateien** unter `apps/web/src/`, **null** in
`packages/ui-tokens/tokens.css`. Das ist der Grund, aus dem ein Wächter über Token sie strukturell
nicht sehen kann: Die Zusagen stehen nicht dort, wo die Farben stehen, sondern dort, wo gezeichnet
wird.

**W-2 „Zusage ohne Zahl":** acht Suchwörter, vier Verzeichnisse, eine Bedingung (im selben
Kommentarblock steht eine Verhältniszahl `n,nn` oder das Wort `contrast-check`). Was er **nicht**
kann, gehört in seinen Kopf: Er prüft, ob eine Zahl dasteht — nicht, ob sie stimmt, und nicht, ob
sie die richtige Fläche meint. **Erster Lauf wird rot**, deshalb **nicht** in derselben Welle wie
eine Behebung. Wortschatz und Bedingungen stehen ausgeschrieben in `traeger-und-zusage.md` 10.9.

---

## 5. Zur Kenntnis genommen, mit Folge

**F-7 ist beantwortet, und meine Voraussetzung war falsch.** Z-65: die Sache trägt, aber „Betroffen
ist im Bestand keine Stelle" hält nicht — die Tokenmeldung in `SettingsScreen` ist `tone="warning"`,
Sorte 1, Bündel 2. Ich habe über eine fremde Bündelliste gezählt statt über den Bestand; eine
Zählung über eine Liste ist keine Messung. Berichtigt in `textabbau-gestalt.md` 9.11, mit drei
verbindlichen Folgesätzen:

1. **9.1 Punkt 2 wird ergänzt:** Der Wirt reicht nicht bis in die **Kinder**. Kein zweiter
   Meldebaustein — und **keine zweite Rolle in einem Kind**. Das dort von Hand geschriebene
   `role="status"` an der Kopier-Rückmeldung ist heute schon eine Live-Region in einer Live-Region.
2. **Bündel 2** bekommt diese Stelle als benannten Bestandteil: Wirt setzen und innere Rolle
   entfernen sind **eine** Änderung. Wer nur den Wirt setzt, verschärft die Verschachtelung.
3. **Die Dringlichkeit dieser Fläche ist `polite`.** Das Token muss gelesen werden; eine dringliche
   Ansage unterbräche genau den Vorgang, um den es geht.

Der Vollständigkeitswächter mit 83/0 ist zur Kenntnis genommen und in der Einordnung oben
berücksichtigt.

---

## Artefakte

| Datei | Was |
|---|---|
| `docs/design/traeger-und-zusage.md` | **Abschnitt 10 neu** (T-213): O-JA, O-JC, Regeln T-4 und T-5, W-2, Übergabe, Vertrag, Befunde B-14 bis B-16, Fragen F-8 und F-9 |
| `docs/design/textabbau-gestalt.md` | **Abschnitt 9.11 neu**, F-7 durchgestrichen und berichtigt |
| `.claude/team/reports/T-213-ui-designer.md` | dieser Bericht |

**Kein Produktivcode angefasst.** `apps/web/**`, `apps/desktop/**` und `packages/**` sind unberührt.

---

## Annahmen

1. **Der Maßstab „mindestens ein Band ist auf beiden Seiten von ≥ 3:1 begrenzt" (Regel T-4) ist
   meine Festlegung**, nicht ein WCAG-Wortlaut. SC 1.4.11 verlangt 3:1 gegen angrenzende Farben; wie
   das auf einen Ring aus zwei Bändern anzuwenden ist, steht dort nicht. Ich lege es so aus, weil
   die Vorgabe aus dem Auftrag („gegen die Füllung **und** gegen die Fläche") sonst den weich
   gesperrten Knopf für unbehebbar erklärte, obwohl sein Ring dort sichtbar ist. Nach dem Tausch
   erfüllen ohnehin **alle drei** Nahtstellen die 3:1 — außer der einen benannten Ausnahme.
2. **Alle Zahlen dieses Papiers außer den Pixelwerten aus T-210 und T-189 sind von Hand gerechnet**,
   mit derselben WCAG-Formel wie der Lauf, und mit drei Gegenproben belegt (10. Nachtrag, Kopf).
   Gerechnet ist nicht gemessen.
3. **Der Tausch ist an keiner Engine geprüft.** Er hängt daran, dass `outline` über dem äußeren
   `box-shadow` liegt — das hat T-210 in Chromium gemessen, für WebKitGTK und WKWebView ist es
   ungemessen (T-207s Grenze). Die Behebung macht die Lage dort aber in jedem Fall **nicht
   schlechter**: Bei umgekehrter Malreihenfolge wären beide Bänder heute wie nachher vertauscht, und
   die Werte sind nach dem Tausch auf **beiden** möglichen Anordnungen besser als heute.
4. **Die vier Kacheln des Dashboards habe ich als die aus `DashboardScreen.tsx` gelesen**, also
   „Heute erfasst", „Noch nicht exportiert", „Offene Todos", „Überfällig" (plus „Erledigte Todos",
   die im Bildbeleg nicht sichtbar war). `StatTile` wird auch anderswo benutzt; `tone="danger"`
   nach meiner Prüfung nur hier.

---

## Risiken

1. **Der Gefahrenknopf im hellen Thema ist heute ein SC-1.4.11-Fall und stand nicht im Auftrag.**
   Sein Fokusring trägt allein über den Farbton (1,13:1). Wird nur der Primärknopf „repariert" — was
   mit meiner Vorgabe nicht passieren kann, weil sie eine Regel für beide ist —, bliebe er stehen.
   Aufgenommen als F-9 an visual-qa: bei der Nachmessung mitnehmen.
2. **Zwei Kommentarblöcke in `contrast-check.mjs` beschreiben nach dem Bau die falsche Geometrie**,
   wenn nur die Paare eingetragen werden. Der Block bei `:568-587` **begründet** die heutige
   Paarwahl mit der alten Anordnung; er wird durch den Tausch unwahr. Deshalb: ein Agent für beide
   Teile der Übergabe.
3. **B-15, ungemessen:** Der Ring liegt 4 px außerhalb des Randkastens; `.app` und `.note` tragen
   `overflow: hidden`. Ein Bedienelement an der Kante eines beschneidenden Kastens könnte seinen
   Ring verlieren (SC 2.4.11). Ich kann es nicht messen, hier läuft kein Browser.
4. **B-16:** Die widerlegte Zusage der Kachel steht an **zwei** Stellen; T-210 hat nur die eine
   gemessen, weil nur sie im Auftrag stand. Das ist die Bauart des Befunds und das beste Argument
   für W-2.
5. **W-2 nicht zu bauen** heißt, diese Klasse von Befunden weiter einzeln zu finden — vier in drei
   Wellen, jeder mit einer eigenen Messaufgabe.

---

## Offene Fragen

1. **An den Orchestrator (F-8): Soll W-2 gebaut werden, und wann?** Meine Empfehlung: ja, als
   eigener Auftrag an frontend-dev, und **nicht** in derselben Welle wie diese Behebung — der erste
   Lauf wird rot, und ein roter Lauf neben einer Behebung wird als kaputter Wächter gelesen.
2. **An visual-qa (F-9):** Die Nachmessung sollte den Gefahrenknopf im hellen Thema mitnehmen,
   obwohl er in T-210 als unbetroffen geführt ist — 1,13 vorher, 6,75 nachher.
3. **An den Orchestrator:** Soll B-15 (beschnittene Fokusringe an Kanten beschneidender Kästen) als
   eigene Messfrage an visual-qa gehen? Dieselbe Fixtur wie B-11, wenige Minuten.
4. **An den Orchestrator:** Die vier empfohlenen Paare aus 10.11.4 sind keine Behebung, sondern eine
   Vervollständigung derselben Bauart wie A-A-45. Mitnehmen oder eigener Auftrag?

---

## Nächster Schritt

**frontend-dev, ein Auftrag mit zwei Teilen** (sie teilen sich `contrast-check.mjs`, deshalb ein
Agent): der Tausch der beiden Ringbänder in `base.css` samt Kommentaren in `tokens.css`,
`contrast-check.mjs` und `DESIGNSYSTEM.md`; die Randschiene an `.stat--danger` samt berichtigter
Zusage in `app.css` **und** `parts.tsx`. Alle Zeilen und Wortlaute stehen in
`docs/design/traeger-und-zusage.md` 10.11.

**Danach visual-qa:** dieselben zwei Fixturen aus `/tmp/t210-qa/` erneut fahren. Das Ziel ist
benannt und prüfbar — bei B-11 drei Zonen mit zwei deutlichen Übergängen an **allen vier**
Kombinationen, bei B-12 eine sichtbare Startkante an der einzigen Kachel, die eine hat.
