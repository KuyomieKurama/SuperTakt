# T-194 — ui-designer: zwei Zusagen, ein Doppelweg, eine erloschene Sperre

**Welle AC.** Vorlage: O-GU, O-HA, O-GB. Artefakt: `docs/design/traeger-und-zusage.md`.
Kein Produktivcode geändert.

---

## 1. O-GU — die zwei Sätze

### Stelle 1: `components.css:401` — der Satz wird zurückgenommen, der Wert bleibt

**Warum nicht der Wert berichtigt wird, ist nicht Geschmack, sondern Arithmetik.** Über der
Schraffur steht die Beschriftung des Etiketts. Soll sie ihre 4,5:1 halten (SC 1.4.3), ist die
Schraffur gegen ihre eigene Füllung nach oben gedeckelt — **1,80:1 hell, 1,58:1 dunkel** (von mir
mit der WCAG-Formel gerechnet, Rechenweg im Artefakt 1.2). Der heutige Wert ist 1,24 / 1,45; im
dunklen Thema sind damit bereits 92 Prozent des überhaupt Möglichen ausgeschöpft. **Es gibt auf
dieser Fläche keinen Wert, der den Satz wahr macht.** Die Alternative „Wert berichtigen" existiert
hier nicht.

Neuer Wortlaut des Kommentars steht im Artefakt 1.3; er nennt die Zahl, den Deckel und die
wirklichen Träger — Symbol (`rotate-ccw` gegen `circle`, `check-circle`, `slash-circle`), Wort und
Rautenform des Zeilenpunktes.

**Paare, die `contrast-check.mjs` danach führen muß:**

| Paar | Mindestwert | Begründung |
|---|---|---|
| `--status-reopened-hatch` / `--status-reopened-bg` | **exempt**, mit 1,24 / 1,45 in der Notiz | Verstärkung, kein Träger. Die Zahl steht da, damit niemand sie ein zweites Mal sucht |
| `--status-reopened-fg` / `--status-reopened-hatch` | **4,5** | die **Obergrenze** der Verstärkung: wer die Schraffur später kräftiger macht, fällt hier durch. Das ist der eigentliche Schutz |

**Wer Farben nicht unterscheidet, sieht** bei „Offen" und „Erneut offen" zwei nahezu gleich helle
Pillen (die Tönungen liegen bei 1,03:1). Auseinander hält sie der Pfeil im Kreis gegen den leeren
Kreis und das Wort daneben; in der Kurzform ohne Beschriftung das Symbol plus der zugängliche Name.
R-10 hängt an dieser Unterscheidung und ist gedeckt — nur eben nicht von der Schraffur.

### Stelle 2: `components.css:1329-1331` — der Wert wird berichtigt, und zwar als Form

**Der Befund ist schärfer als die Zahl.** Unser eigenes Designsystem schreibt bei
`DESIGNSYSTEM.md:704-707`: „Zwei 4px-Schienen, die sich nur im Farbton unterscheiden, sind in
Graustufen und bei Deuteranopie nahezu gleich." Der Streifen, der das beheben sollte, unterscheidet
sich von seiner Schiene wieder **nur im Farbton** (1,76:1). Dieselbe Falle, eine Ebene tiefer.

**Warum keine Farbe das löst — gerechnet für das dunkle Thema:** Beide Schienen müssen 3:1 gegen
die Karte halten, also mindestens 0,133 relative Leuchtdichte erreichen. Die Leistungsschiene liegt
bei 0,295. Eine zweite Schiene mit 3:1 Abstand müßte darüber 0,985 (praktisch Weiß) oder unter
0,065 liegen — **und das untere Fenster ist durch die eigene 3:1-Zusage geschlossen.** Es bliebe
Weiß, am harmlosen Feld, als lautestes Objekt des dunklen Themas. Die Rangfolge stünde auf dem
Kopf.

**Entscheidung:** `.note--internal { border-inline-start: 4px dashed var(--note-internal-rail); }`,
`.note--billing::before` entfällt, Token `--note-billing-rail-stripe` entfällt. Durchgezogen gegen
unterbrochen. Die Leistung — das Feld, dessen Verwechslung Geld kostet — behält das festere
Zeichen; der Vermerk bekommt das leisere, und „unterbrochen" heißt in Takt bereits *hier ist etwas
nicht den vollen Weg gegangen* (`components.css:786`, Zeile „Nicht abgerechnet", seit T-018).

**Paare danach:**

| Paar | Mindestwert | Begründung |
|---|---|---|
| `--note-billing-rail` / `--bg-surface` | 3 (**steht bereits**, `:232`) | durchgezogene Schiene gegen Karte: 5,99 / 5,66 |
| `--note-internal-rail` / `--bg-surface` | 3 (**steht bereits**, `:235`) | **zugleich Balken gegen Lücke** — in der Lücke sieht man die Karte: 3,49 / 4,31. Die Form hat damit einen Zahlenwert, ohne daß ein Paar dazukommt |
| `--note-billing-rail-stripe` / `--bg-surface` | **entfällt** mit dem Token | sonst nennt der Lauf einen Token, den keine Klasse zeichnet |
| `--note-billing-rail` / `--note-internal-rail` | **exempt**, mit 1,71 / 1,31 und dem Fensterbeweis | die Unterscheidung ruht nicht mehr darauf |

**Wer Farben nicht unterscheidet, sieht** heute zwei gleich lange, gleich helle, durchgezogene
graue Balken; danach einen durchgezogenen und einen unterbrochenen. Nach der Änderung tragen
**zwei** der sechs Merkmale ohne Farbe (Schienenform und Marke) statt einem.

**Fünf Stellen sagen denselben Satz** (`components.css`, `NoteField.tsx` zweimal,
`showcase/NotesSection.tsx`, `DESIGNSYSTEM.md`). Alle fünf gehören in eine Aufgabe, sonst steht die
berichtigte Zusage an drei Stellen und die widerlegte an zwei.

### Die fünfzehn Farben ohne Paar

Im Artefakt Abschnitt 3 Zeile für Zeile eingeordnet: **fünf werden echte Paare** (`--danger-bg-hover`
und `--danger-bg-active` gegen `--text-on-solid` mit 4,5; `--focus-ring-contrast` gegen `--accent-bg`
**und** `--danger-bg` mit 3, weil `.on-solid` auf genau diesen zwei Füllungen sitzt;
`--note-billing-bg` gegen `--text-primary` mit 4,5; `--status-exported-border` gegen `--bg-surface`
mit 3), **fünf werden benannte Ausnahmen** mit Zahl und Grund (`--success-border`, `--danger-border`,
`--note-internal-border`, `--note-billing-border`, `--timer-idle-border`), **vier gehören gar nicht
in ein Paar** (drei Schatten und `--bg-scrim`: ein Schatten hat keinen Vordergrund, und die
Abdunklung hat die Aufgabe, Kontrast zu nehmen).

## 2. O-HA — es sind drei Wege, nicht zwei

Gemessen: „Spalten verwalten" im Ansichtskopf (`BoardScreen.tsx:395`, sekundär, steht in **jedem**
Zustand), „Erste Spalte einrichten" im Leerzustand (`:1015`, primär) — **und ein drittes Mal
dieselbe Beschriftung, dieselbe Ausprägung, dasselbe Ziel** in der Karte „Was sich geändert hat"
(`:1047`). Daß der Prüffall `board-empty-state-rule-chain.spec.ts:44` ein `.first()` braucht, ist
der Abdruck davon.

**Urteil: der Doppelweg Kopf/Leerzustand bleibt, der dritte fällt.** Kopf und Leerzustand tragen
verschiedene Absichten — der stehende Eingang gegen die eine Handlung des leeren Bildschirms, und
„verwalten" kann man nichts, wovon es noch nichts gibt. Ein Knopf, der je nach Bestand erscheint
oder sich umbenennt, wäre teurer als der doppelte Weg (und die Umbenennung bräche einen zugänglichen
Namen). Zwei **identische** Primärknöpfe 200px auseinander heben dagegen die Regel „eine
Primäraktion je Bildschirm" auf; die Karte behält ihre eigene, verschiedene Aktion „Zur Todo-Liste".
Es fällt eine Wiederholung derselben Handlung, kein Satz — **kein Streichen um des Streichens
willen** (E-078). Kein Klassenname, kein zugänglicher Name ändert sich.

## 3. O-GB — was `poolRule.ts` trägt, und welcher Schutz dazu paßt

**Vier Lasten:** die Achsenbeschriftungen der `RuleSummary` (nach T-171 der Ersatz für elf
gestrichene Sätze — die Definition der Spalte, nicht ihr Hilfetext); der gesprochene Satz aus
`ruleSpoken`, der aus **derselben** Beschreibung entsteht und E-078 Nachtrag Punkt 8 baulich statt
zugesichert erfüllt; der Befund „kein Tag darin" für vier Flächen aus einer Funktion; die Trennung
einschränkend gegen neutral.

**Urteil zur Textart:** Das sind **Werte**, keine Prosa über die Oberfläche — dieselbe Art wie
`EXPORT_STATUS_LABEL`. Das Streichraster aus E-078 ist auf sie nicht anwendbar. Ausgenommen die drei
Satzhülsen in `ruleSpoken`, die Prosa sind.

**Kein dauerhafter Schutz auf dem Papier.** Die Sperre war an eine Frist gehängt, die genau in dem
Augenblick ablief, in dem die Datei tragend wurde (ST-05 gebaut = Kompensation lebendig). Eine Frist
schützt einen Zustand; hier ist eine **Rolle** zu schützen, und Rollen haben kein Enddatum. Statt
dessen zwei Regeln (P-1: gesprochener Satz und sichtbare Zusammenfassung ändern sich nur zusammen;
P-2: die Gefahr ist eine **fünfte** Fläche mit eigenem Wortlaut, nicht das Kürzen) und eine Messung:
**`describeRule` und `ruleSpoken` haben heute keinen Prüffall** — `poolRule.test.ts` deckt nur
`describeRuleReach` und `emptyFolderNames`. Der dauerhafte Schutz ist ein Fall, der mißt, daß der
gesprochene Satz jede Achse nennt, die die sichtbare Zusammenfassung zeigt.

**Das Papier gehört ux-designer.** Meine Feststellung zum Verwerten: die Zeile darf von „vorläufig
gesperrt, solange ST-05 offen" auf „Werte, kein Prosabestand; für die Satzhülsen gilt P-1" wechseln.

---

## Kurzfassung

**Aufgabe:** T-194 — O-GU (zwei widerlegte Zusagen), O-HA (Doppelweg im Board-Leerzustand), O-GB
(erloschene Sperre auf `poolRule.ts`)

**Status:** fertig

**Artefakte:**
- `docs/design/traeger-und-zusage.md` (neu)
- `.claude/team/reports/T-194-ui-designer.md` (dieser Bericht)

**Zusammenfassung:** Für `components.css:401` ist der **Satz zurückgenommen**, und zwar mit Beweis:
weil die Beschriftung über der Schraffur liegt, ist diese durch SC 1.4.3 bei 1,80:1 hell und 1,58:1
dunkel gedeckelt — der heutige Wert 1,24 / 1,45 schöpft im dunklen Thema bereits 92 Prozent des
Möglichen aus, es gibt also keinen besseren Wert, nur einen ehrlicheren Satz; gesichert wird das
durch eine benannte Ausnahme **plus** ein Deckelpaar `--status-reopened-fg` über der Schraffur mit
4,5:1. Für `components.css:1329-1331` ist der **Wert berichtigt**, aber als Form: die Vermerkschiene
wird unterbrochen (`4px dashed`), die Leistungsschiene bleibt durchgezogen, `--note-billing-rail-stripe`
entfällt — denn im dunklen Thema ist das Fenster für eine zweite Schiene mit 3:1 Abstand
arithmetisch geschlossen, es bliebe nur Weiß am harmlosen Feld. Balken gegen Lücke ist dabei
dasselbe Verhältnis wie Schiene gegen Karte, also **von dem Paar gemessen, das ohnehin dasteht**
(3,49 / 4,31). Bei O-HA sind es gemessen **drei** Wege, zwei davon zeichengleich; der stehende
Eingang und die Leerzustandsaktion bleiben (verschiedene Absichten), der dritte, identische
Primärknopf in der Karte „Was sich geändert hat" fällt. `poolRule.ts` trägt die ST-05-Kompensation
für Sicht **und** Gehör aus einer Quelle; sie braucht keine Papiersperre, sondern zwei Regeln und
einen Prüffall — den es heute nicht gibt.

**Annahmen:**
1. **3:1 zwischen zwei Trägern ist eine Hausentscheidung, keine WCAG-Zahl.** SC 1.4.1 nennt keine;
   Takt braucht eine, weil nur eine Zahl in den Lauf paßt. Ich nehme dieselbe 3:1, die das Haus für
   Zustandsgrenzen benutzt.
2. **Text über einem Muster wird gegen die ungünstigste Stelle des Musters gemessen.** Das ist die
   konservative Lesart von SC 1.4.3 und die Grundlage des Deckels in Stelle 1.
3. Die Schraffur **bleibt** (statt zu fallen), weil sie gedeckelt nichts kostet und ihr Wegfall drei
   weitere Dateien für null Gewinn anfaßte. Wer sie später streicht, braucht dafür kein
   Gestaltungspapier mehr — drei Zeilen, ein Token, zwei Paare. Die Tür ist im Artefakt benannt.
4. Alle **neuen** Zahlen dieses Papiers habe ich von Hand nach der WCAG-Formel gerechnet und gegen
   zwei Werte aus T-189 gegengeprüft (1,24 und 1,71 zeichengleich). Sie sind **gerechnet, nicht vom
   Lauf gemessen** (E-087) — der Lauf entscheidet, sobald die Paare darin stehen.
5. Die Unterbrechung sitzt am **Vermerk** und nicht an der Leistung, weil der teure Bedienfehler in
   die Leistung schreibt (R-08): das Feld, dessen Verwechslung Geld kostet, behält das festere
   Zeichen.

**Risiken:**
1. **B-6, und es ist das größte:** `.note` setzt `position: relative` und `overflow: hidden`;
   `.note--billing::before` liegt mit `inset-inline-start: -4px` vollständig im Rahmenbereich, also
   außerhalb des Innenrandkastens, an dem beschnitten wird. Wenn das zutrifft, war das zweite
   Merkmal von E-016 nicht schwach, sondern **abwesend**, und `contrast-check.mjs:233` maß eine
   Farbe, die nie auf einem Bildschirm stand. Zugleich ein lebendes Beispiel für die von
   security-checker selbst benannte Grenze („tokengenau, nicht flächengenau"). **Abgeleitet, nicht
   gemessen — hier läuft kein Browser.** Meine Entscheidung hängt nicht davon ab und vermeidet die
   Bauform.
2. Die Länge der Unterbrechungen legt die Engine fest, und Takt läuft in zweien (WebView2,
   WebKitGTK). Anforderung: mindestens drei sichtbare Unterbrechungen auf dem kleinsten Feld
   (`rows={3}`), dazu die Eckverbindung 4px zu 1px bei `--radius-lg`. Fällt eine Prüfung, steht der
   Rückfall im Artefakt 2.8 — die Gestaltentscheidung ist geschlossen, offen ist nur die Bauform.
3. Das Deckelpaar in Stelle 1 wird vom Lauf um bis zu 0,7 zu **günstig** ausgewiesen, weil `flatten`
   teildurchsichtige Farben über `--bg-canvas` legt statt über die wirkliche Fläche (gerechnet: 6,75
   statt 6,50 hell, 5,63 statt 4,89 dunkel — beide bestehen). Entweder ein Feld `over` am Paar oder
   die Grenze im Klartext daneben.
4. Werden die fünf Stellen aus Artefakt 2.6 nicht in **einer** Aufgabe berichtigt, steht die
   widerlegte Zusage weiter im Produkt, nur woanders. Das ist genau die Bauart, aus der O-GU
   entstanden ist.
5. Zum Hören sage ich nichts Gemessenes: **in dieser Umgebung gibt es kein Vorleseprogramm**
   (T-B09). Alles über zugängliche Namen und die Live-Region ist aus dem Quelltext abgeleitet.

**Offene Fragen:**
1. **F-4, an den Orchestrator:** Soll `contrast-check.mjs` ein Feld `over` bekommen, mit dem eine
   teildurchsichtige Farbe über die Fläche geflächt wird, auf der sie wirklich liegt? Richtig, aber
   nicht dringend; ohne es steht die Grenze im Klartext.
2. **F-5, an ux-designer:** ob und wie `textbestand.md` 1.2 die Feststellung aus Artefakt 5.3
   übernimmt. Die Zeile gehört ihm, die Feststellung steht bei mir.
3. **Wer mißt B-6?** visual-qa im Rahmen einer Sichtprüfung, oder frontend-dev beim Umbau nach 6.2 —
   beides genügt, aber es soll nicht zwischen den beiden hindurchfallen.

**Nächster Schritt:**
1. **6.1 und 6.4 in einer Welle an frontend-dev** — Kommentar am Etikett samt zwei Paaren, und der
   dritte Knopf im Board-Leerzustand. Beide unabhängig, beide klein.
2. **6.2 als eigene Aufgabe, ein Agent, fünf Dateien plus der Lauf** — `components.css`,
   `tokens.css`, `NoteField.tsx`, `NotesSection.tsx`, `DESIGNSYSTEM.md`, dazu die drei
   Paarberichtigungen im Lauf. Anschließend visual-qa für die zwei Prüfungen aus 2.8 und für B-6.
3. **6.3 an frontend-dev zusammen mit A-A-45** — die Einordnung je Token liegt vor, es fehlt nur die
   Mechanik.
4. **unit-tester:** ein Fall, der mißt, daß `ruleSpoken` jede Achse nennt, die `describeRule` als
   einschränkend ausweist. Damit hat die ST-05-Kompensation zum ersten Mal einen Prüffall.
