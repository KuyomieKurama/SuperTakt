# Fensterfeste Flächen — der Mechanismus

Anlass: Auftrag des Auftraggebers vom 2026-09-12, umgesetzt als T-323.

**Deckung: `docs/spec.md` Abschnitt 25, A-25.1 bis A-25.8** — seit dem 2026-09-13, nachgetragen
auf den Befund T-343 B-01 und am selben Tag nach T-351 berichtigt: **A-25.5** trägt jetzt die beiden
entschiedenen Ausnahmen (B-17), **A-25.7** bindet sich an die Sache statt an den Zustand (B-18), und
**A-25.8** ist neu und nennt die drei ausgenommenen Flächen (B-16, 8.6 und 8.7).
Bis dahin berief sich dieses Papier auf geliehene IDs (A-13.8, A-13.9,
Abschnitt 15, A-21.2 bis A-21.4), und **keine davon trug den Satz, um den es geht**: A-13.8 spricht
von der Fenster*breite*, A-13.9 ist eine Zielaussage, A-21.2 eine über Optik. Wo unten eine Regel
ihre Deckung nennt, nennt sie jetzt A-25.x; die alten IDs stehen nur noch dort, wo sie wirklich
tragen. Ein Papier, das seine Begründung selbst mitbringt, ist keine Anforderung.
Bestand: [supertakt-layout.md](supertakt-layout.md), [theme-palettes.md](theme-palettes.md),
[kartenkopf-board.md](kartenkopf-board.md).

**Stand: 2026-09-13, nach dem Bau und nach dem zweiten Abgleich.** Der Mechanismus ist gebaut
(T-326), dreimal geprüft (T-331, T-329, T-332), nachgebessert (T-334), an **neun** Stellen
berichtigt (T-339) und hier an **sechs weiteren** (T-344) — diesmal nicht gegen den Bau, sondern
gegen das **andere Papier**. **Dazu eine sechzehnte am selben Tag (T-354)**, und sie ist die erste,
die dieses Papier gegen **sich selbst** berichtigt: Zusicherung A9 verlangte etwas, das Abschnitt 8.5
drei Absätze weiter oben ausdrücklich anders regelt (T-351 B-20).
Berichtigt heißt in diesem Papier: Die widerlegte Fassung bleibt sichtbar stehen, und daneben
steht die Zahl, die sie widerlegt hat. Ein stillschweigend korrigiertes Papier lehrt nichts — es
sieht nur so aus, als hätte es von Anfang an recht gehabt.

**Nachtrag 2026-09-14 (T-362).** Eine **siebzehnte** Stelle, und sie ist von einer neuen Art: nicht
gegen den Bau, nicht gegen das andere Papier, nicht gegen sich selbst, sondern gegen eine
**Zusammenfassung dieses Papiers in einem Auftrag**. Einzelheiten unten. Dazu drei Ergänzungen —
Abschnitt 4, 6.3 und 9.1 —, die aus der zweiten Fundstelle der Tabellenbauform entstehen
(`todo-tabelle.md`).

### Die Lehre über dieses Papier selbst

> **Zwei Papiere, die einander bestätigen, sind keine Messung.**

T-322 (`fensterfeste-flaechen-fluss.md`) und T-323 (dieses Papier) sind vor dem Bau gegeneinander
gelesen worden und lagen deckungsgleich. An Abschnitt 8.4 waren sie deckungsgleich **falsch**, und
die Deckungsgleichheit hat den Irrtum nicht aufgedeckt, sondern bestätigt: Beide haben dieselbe
richtige Falle (T-057 Ursache 2) auf denselben falschen Kasten gezogen, weil beide aus derselben
Vorlage gelesen haben. Widerlegt hat sie erst der erste Bau am laufenden Fenster — 128 Verstöße
auf den Todos, 140 auf den Buchungen, ein Rahmen von 4242 px in einem 768 px hohen Fach (E-113).

Daraus die Arbeitsregel für jedes weitere Papier dieser Art: **Ein Satz, der eine Zahl behauptet,
ist bis zur ersten Messung eine Annahme** — auch wenn zwei Papiere ihn tragen und auch wenn beide
eine echte, teuer bezahlte Falle als Begründung nennen. Übereinstimmung zweier Entwürfe ist ein
Hinweis auf gemeinsame Vorlagen, nicht auf Wahrheit. Der Prüfweg für so einen Satz ist der Bau,
nicht die zweite Lesung.

**Der zweite Satz, nachgetragen am 2026-09-13 (T-344), weil der erste diesmal nicht gereicht hat:**

> **Zwei Papiere, die einander nicht lesen, widersprechen einander nicht seltener — nur später.**

T-339 und T-340 waren die Berichtigung desselben Bestandes, vergeben an zwei Agenten, die einander
nicht lesen konnten. Beide haben sauber gearbeitet, und **am selben gemessenen Fall** — dem
86-px-Überlauf der Einstellungen bei 1024 × 640 — kam das Gegenteil heraus: hier eine benannte
Ausnahme, dort ein Fehler (B-02). Der erste Satz schützt vor zwei Papieren, die einander
bestätigen; dieser hier vor der Antwort darauf, sie zu trennen. Die Arbeitsregel daraus ist eine
über Aufträge und nicht über Papiere: **Wer denselben gemessenen Fall berichtigt, berichtigt ihn
in einem Auftrag** — auch wenn die Dateihoheit zwei Namen nennt. Getrennte Hoheit trennt Dateien,
nicht Widersprüche.

### Berichtigung (T-362, 2026-09-14) — gegen eine Zusammenfassung dieses Papiers

Die vierte Art von Widerspruch, nach „gegen den Bau" (T-339), „gegen das andere Papier" (T-344) und
„gegen sich selbst" (T-354): **gegen ein Zitat.** Der Auftrag zu T-362 faßte A8 so zusammen —

> kein direktes Kind eines Laufbereichs darf über ihn hinausragen

— und zog daraus den Schluß, eine Tabelle mit klebendem Kopf sei „genau so ein Kind" und damit ein
Fall für A8. **Beides ist falsch, und das Papier trägt Mitschuld daran**: Die Kurzform in der
Tabelle von 9.1 lautet „*Im Laufbereich wird nichts abgeschnitten*" und läßt offen, **wogegen**
gemessen wird. Gemessen wird, gelesen an `tests/e2e/viewport-fit.spec.ts:405`:

```js
if (child.scrollHeight > child.clientHeight + 1) { … }
```

— das Kind gegen **sich selbst**. Ein Kind **darf** höher sein als der Laufbereich; genau das ist
der Bildlauf. Wäre die zitierte Fassung wahr, wäre **jede** laufende Liste in diesem Bestand rot,
und alle 44 grünen Fälle aus 9.6 wären unerklärlich. Der Prüfweg dafür war zwei Minuten Quelltext,
und der Schaden wäre eine Zusicherung gewesen, die eine Tabelle für ihren eigenen Zweck rot meldet.

**Die Regel, die daraus wird:** Eine Zusicherung, die aus dem Gedächtnis zitiert wird, wird beim
nächsten Bau gegen die falsche Zahl gemessen. Die Kurzform in 9.1 sagt ab jetzt, wogegen gemessen
wird. Und die allgemeine Fassung, weil sie über diesen Fall hinausgeht: **Ein Papier, dessen
Kurzform eine andere Aussage zuläßt als seine Vorschrift, hat zwei Fassungen** — dieselbe Klasse
wie das doppeldeutige „getragen" aus 7.1, nur eine Ebene kleiner.

### Berichtigung (T-354, 2026-09-13) — gegen den eigenen Abschnitt 8.5

Die dritte Art von Widerspruch, nach „gegen den Bau" (T-339) und „gegen das andere Papier" (T-344):
**ein Papier gegen sich selbst**, drei Absätze auseinander.

| Abschnitt | Was falsch war | Was es widerlegt hat |
|---|---|---|
| **9.1 A9** (a) und (c), gleichlautend **AK-14** im Flußpapier | die Sprungmarke lande auf einem Kasten, der eine eigene Laufstrecke hat, und `Bild ab` bewege danach „die Bildlaufstelle **genau dieses Kastens**" — beides ohne Einschränkung | **8.5 Punkt 1 desselben Papiers:** Unter 68 rem hört Laufbereich A der Zeiterfassung auf zu laufen (`overflow-y: visible`), und Bild-ab rollt von dort den **Rahmen**. 68 rem sind 1088 px; **zwei der vier getragenen Meßgrößen liegen darunter** — 960 × 640 und 1024 × 640, dazu zwei Rückfallgrößen. A9 wörtlich gebaut wäre an **vier von sieben** Größen rot, für ein Verhalten, das dieses Papier ausdrücklich für richtig erklärt (T-351 B-20) |

**Der Irrtum, benannt.** A9 hat eine **Identität** gemessen, wo eine **Wirkung** gemeint war —
dieselbe Fehlerklasse wie in 8.4 und in 8.5 selbst, nur eine Drehung weiter: Dort war „läuft" an
einem Bezeichner festgemacht, hier „bewegt sich" an einem Kasten. Die Aussage, aus der A9 überhaupt
entstanden ist, bleibt und steht ab hier als Satz:

> **Nach der Sprungmarke muß `Bild ab` meßbar etwas bewegen. *Was* sich bewegt, darf vom Fenster
> abhängen; *daß* sich etwas bewegt, nicht.**

**Die Zahl daneben** (T-348, 1024 × 640, Fokus auf `#inhalt`, Bildlaufstand vorher → nachher):
Einstellungen mit der Marke am Rahmen **0 → 0**, mit der Marke am Bereich **0 → 392 px**; Kanban mit
der Marke am Rahmen **0 → 0**, mit der Marke am Board **0 → 36 px** (`Pfeil rechts`). A9 mißt diese
Zahlen und nicht den Namen des Kastens, an dem sie entstehen.

**Warum der Rückfallzweig aufgezählt und nicht offen formuliert ist** — die eigentliche Entscheidung
dieser Berichtigung: „oder ein laufender Vorfahr" ohne Grenze macht A9 (c) fast unwiderlegbar. Säße
die Marke weiter am Rahmen der Einstellungen, wäre sie bei 1024 × 640 **grün**, denn dort läuft der
Rahmen um 62 px — und genau das ist der E-115-Verstoß aus 7.5 (8.5 Punkt 2). Eine Zusicherung, die
den Befund grün macht, aus dem sie entstanden ist, ist seine Beerdigung; das ist derselbe Satz wie in
9.6 Punkt 2, dort über eine Ausnahme, hier über einen Rückfall. Die Vorschrift steht in **9.7**.

### Berichtigungen (T-344, 2026-09-13) — gegen das andere Papier und gegen den Meßstand

| Abschnitt | Was falsch war | Was es widerlegt hat |
|---|---|---|
| **9.6** Punkt 2, 9.2 | der 86-px-Überlauf bei 1024 × 640 sei „richtig" und die benannte Ausnahme von A8 | **E-115**, entschieden am selben Tag: 1024 × 640 ist ein **getragenes** Fenster ohne Meldung, also ein Fehler. Nach 9.6 gebaut wäre der einzige bekannte E-115-Verstoß auf Dauer grün (T-343 B-02) |
| **7.1**, 9.1 A2 | **zwei** getragene Bereiche, der zweite „bis 640 × 480 im Browserbetrieb" | Ein Wort, zwei Bedeutungen; `viewport-fit.spec.ts:34-45` zitiert die weitere Fassung und hängt zehn gemessene Verstöße daran. Die Rechnung dagegen: unterhalb 52 rem nimmt die Hülle **225 statt 52 px**, der kleinstmögliche Kopf ist ≈ **188 px** gegen **175 px** Budget (T-341 3.5) |
| **8.5** | die Sprungmarke sitze richtig, wo `role="region"` und `tabIndex` sitzen | `ScreenBody.tsx:159-168` setzt beides auf `.screen__body--frame` — den Kasten, der im getragenen Fenster ausdrücklich **nicht** läuft. Bild-ab tut danach in drei Ansichten nichts; in den Einstellungen sind es **neun** Tabulatorschritte statt eines (T-343 B-07). **A-25.5** sagt es seit heute wörtlich |
| **5.2** | „`.app__main` ist nicht mehr der Läufer" als Grund gegen die Rinne dort | 7.2 desselben Papiers: im Rückfall **ist** er es, und R-3a Punkt 2 läßt ihn im getragenen Fenster zu. Dann springt die Inhaltsbreite um die Rinnenbreite — AK-10 ohne Geltungsgrenze (T-343 B-09) |
| **3.2** | `min-block-size: 0` auch an `.screen > .screen__body` | Die Zeile überschriebe den 4-rem-Boden (Spezifität 0,2,0 gegen 0,1,0) und baute den Rückfall aus. `viewport-layout.css:413-419` begründet es ausführlich, das Papier tat es nicht (T-343 B-10) — die **zehnte** Stelle, die T-339 nicht gefunden hat |
| **10** „Leer" | „Noch kein Tag" (S-08) sei ein Bildschirmleerzustand | Er liegt in einer Karte, neben der eine zweite Karte weiterläuft; `margin-block: auto` greift dort nicht (T-343 B-11). Das Kennzeichen ist nicht das Gefühl, sondern die Stelle im Baum — siehe 10 |

Dazu **zwei Einschränkungen, keine Berichtigungen**: **7.4** gilt für das Kanban und nicht für alle
elf (die Einzelfreigabe ist erteilt, aber enger — T-343 B-05), und **9.2** behält 1024 × 640 als
Meßgröße, nur mit umgekehrtem Vorzeichen. Und **eine Ergänzung**: **7.5** ist neu und beantwortet,
wie ein fester Teil nachgibt, der nicht paßt (OF-6 aus dem Flußpapier, T-341 offene Frage 2).

### Berichtigungen (T-339, 2026-09-13)

Jede Zeile nennt die Zahl, die sie erzwungen hat. Die ausführliche Fassung steht am jeweiligen
Abschnitt, samt dem alten Wortlaut.

| Abschnitt | Was falsch war | Was es widerlegt hat |
|---|---|---|
| **8.4**, 3.3, 9.5 | `position: relative` an `.screen__body` **verboten** | Rahmen 4242/768 auf den Todos, 128 Verstöße; 3564/768 auf den Buchungen, 140 Verstöße. Mit der Zeile alle elf auf 768/768 (T-326, **E-113**) |
| **5.1**, 5.2, 3.2 | `scrollbar-gutter: auto` am Rahmen einer Ansicht | Kopfkante 1246 gegen Inhaltskante **1256** auf den drei Rahmenansichten. Mit `stable` ist die Differenz über **44** Fälle 0 und damit die Kante von vor T-326 (T-334) |
| **3.4**, offene Frage 2 | der Rinnenversatz am Kopf sei „hingenommen und nicht ausgeglichen" | Er ist ausgeglichen, und zwar auf dem Weg, den die offene Frage vorschlug: 1256 → 1246, 44 von 44 Fällen auf 0 (T-334) |
| **3.2**, 3.3 | `overflow: hidden` und `padding-block-end: 0` am Rahmen | Mit `hidden` fällt der Rahmen auf seinen 4-rem-Boden und schneidet die Bereichsschiene der Einstellungen ab — gemessen etwa **420 px**, T-322 R-d (T-326 3.2) |
| **3.2** | `.screen > *` allein trage Regel 2 | Die Karte „Timer" stand 2 px hoch bei 168 px Inhalt; dem Base64-Satz der Export-Ansicht fehlten 285 px (T-334) |
| **9**, neu 9.6 | der Meßsatz fragt Dokument und Rahmen, nicht die Kinder | Sieben abgeschnittene Kinder, 27 bis 1030 px — alle bei grünem A1 bis A7 (T-334) |
| **8.5** | `tabIndex={-1}` am Laufbereich | `{-1}` legt ihn nicht in die Tabulatorreihenfolge; eine Ansicht mit zwei Laufbereichen hätte genau einen erreichbaren (T-322 R-4, AK-14/15) |
| **8.5** | „diese eine Fundstelle bleibt gültig" | **Elf** Dateien, **sieben** werden rot — einschließlich der einen, die als gültig galt (T-326, **E-114**) |
| **10**, Zustand „Leer" | `justify-content: center` am Laufbereich | Hätte die Karte „Vorlage und Rundung" der Export-Ansicht mitgenommen; gebaut ist `margin-block: auto` (T-326, AK-05) |

Dazu zwei **Ergänzungen, keine Berichtigungen**: Abschnitt **7.4** ist neu und nimmt die
Layoutkonstante auf, die T-334 im Bildschirmkopf gesetzt hat; **9.2** bekommt zwei Fenstergrößen,
weil zwei gemessene Zustände an keiner der bisherigen fünf auftreten.

**Zwei Zahlen in diesem Papier waren gerechnet und nicht gemessen**, und beide waren als solche
gekennzeichnet: die Umbruchschwelle ≈ 1259 px (7.4) und die 4 rem (7.2). **Die erste ist inzwischen
gemessen** (T-341 4): die Fensterbreite in Einzelschritten von 1290 auf 1240 abgefahren, 1260 nicht
umgebrochen, **1259 umgebrochen** — die Rechnung aus drei Werten trifft die Kante zeichengleich. Sie
steht ab hier als Meßwert und nicht mehr als Rechnung. Die 4 rem bleiben gerechnet, aus zwei Token.
Wer sie nachmißt und abweichend findet, berichtigt hier — das ist der Zweck dieser Tabelle.

## 0. Was dieses Papier ist und was es nicht ist

Es legt **ein** Bauverfahren fest, mit dem eine Ansicht fensterfest wird, und begründet jede
Zeile davon. Es nennt Ansichten nur als Beispiel für das Verfahren.

**Es verteilt keine Rollen je Ansicht.** Welcher Teil einer Ansicht stehenbleibt und welcher
läuft — Kopf, Filterleiste, Tagesgruppen, Nachladefuß, Seitenspalte —, entscheidet T-322
(`fensterfeste-flaechen-fluss.md`). Dieses Papier sagt, wie das Stehenbleiben und das Laufen
gebaut werden, damit beide Entscheidungen in allen elf Ansichten dieselbe Form haben.

Es ändert keine Optik: keine neue Farbe, kein neuer Radius, keine neue Erhebung, kein neues
Abstandstoken in `packages/ui-tokens/tokens.css`, keine Fremdbibliothek, keine Animation. Die
gemessene Folge für die Inhaltsspalte steht in Abschnitt 3.4: sie bleibt **pixelgleich**.

## 1. Die Entscheidung in einem Satz

> Das Fenster ist der Rahmen, `.app__main` ist der Rahmenkasten, und in jeder Ansicht gibt es
> genau einen benannten **Laufbereich**. Alles vor ihm steht still, alles in ihm läuft, und
> nichts von beidem macht die Seite größer.

Drei Regeln tragen das. Sie gelten für jede Ansicht, ohne Ausnahme und ohne `:has()`-Sonderfall:

1. **Die Null an jeder Fuge.** Flex- und Rasterkinder haben `min-height: auto`, und `auto` heißt
   „mindestens so hoch wie der Inhalt". Ohne die Null läuft nicht der Inhalt, sondern die Seite.
2. **Was stehenbleibt, schrumpft nicht** (`flex: none`). Ein Kopf, der schrumpfen darf, schneidet
   seinen eigenen Text ab, bevor der Inhalt zu laufen beginnt. **Das gilt eine Ebene tiefer
   genauso** — und dort ist es teurer, weil jede `.card` als Erste nachgibt (berichtigt in 3.2:
   die Karte „Timer" stand 2 px hoch bei 168 px Inhalt).
3. **Genau ein Laufbereich je Ebene und Achse.** Zwei Bildlaufpositionen für denselben Inhalt sind
   ein Fehler, kein Komfort. Wo eine Ansicht zwei braucht (Zeiterfassung), stehen sie
   **nebeneinander**, nie übereinander, und die Ebene darüber rahmt und läuft nicht (E-112).

Das ist keine Erfindung dieses Papiers. `apps/web/src/styles/viewport-layout.css` baut genau das
seit T-2xx für die Formulardialoge und für das Kanban — mit `min-block-size: 0`, eigenem
Laufbereich je Spalte und `dvh`-Rückfall. Dieses Papier hebt den Präzedenzfall von zwei Flächen
auf alle elf und nimmt ihm dabei das `:has()`.

## 2. Die Höhenkette

Von der Wurzel bis zum Laufbereich. Jede Stufe mit ihrer Begründung; **vorhanden** heißt, die
Zeile steht heute schon da und bleibt.

| # | Kasten | Zeile | Warum |
|---|---|---|---|
| 1 | `html, body, #root` | `height: 100%` — **vorhanden** (`base.css:49`) | Eine feste Größe, keine Untergrenze. `min-height: 100dvh` durfte wachsen und tat es (T-057, Ursache 1: `main.clientHeight == main.scrollHeight`, auf dem Kanban 5857px in einem 820px hohen Fenster). |
| 2 | `.app` | `height: 100%`, `overflow: hidden` — **vorhanden** (`app.css:91`) | Die Hülle misst sich am Fenster. `overflow: hidden` nimmt dem Dokument den Bildlauf und damit die Fensterbildlaufleiste, die alles um ihre Breite verschob (Ursache 2, gemessen 1190 gegen 1200 px). |
| 3 | `.app` Rasterzeile `main` | `grid-template-rows: … minmax(0, 1fr)` — **vorhanden** | Die **erste Null**. Eine Rasterspur ist von Haus aus `auto`, und `auto` heißt „mindestens so hoch wie der Inhalt". Ohne die Null drückt eine lange Liste die Spur auf, und `.app` schneidet ab, statt das Kind laufen zu lassen. |
| 4 | `.app__main` | `min-height: 0`, `min-width: 0` — **vorhanden** | Doppelt gesichert und absichtlich: die Null in Stufe 3 genügt dem Buchstaben nach (CSS Sizing §4.1 — bei `minmax(0, …)` greift die inhaltsabhängige Mindestgröße nicht), aber die Zusicherung soll überleben, dass jemand die Spurliste umschreibt. |
| 5 | `.app__main` | `display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr)` — **neu** | Macht den Rahmenkasten zu einer Fläche mit **genau einem** Fach von genau Fensterrestgröße. Das Kind wird dadurch ohne `height: 100%` auf die Rahmenhöhe gestreckt; `minmax(0, …)` ist die **zweite Null** und verhindert, dass das Kind das Fach aufdrückt. Ein `height: 100%` am Kind wäre der Ersatz — es hängt aber daran, dass der Elternteil eine bestimmte Höhe hat, und das ist eine Zusage mehr als nötig. |
| 6 | `.screen` | `min-block-size: 0` — **neu**; `min-inline-size: 0` (heute `min-width: 0`) — **vorhanden** | Dieselbe Überlegung eine Ebene tiefer. `.screen` ist ein gestrecktes Rasterkind; ohne die Null ist seine Mindesthöhe die seines Inhalts, der Kasten wächst über den Rahmen, und der Rahmen schneidet ab. |
| 7 | `.screen > *` | `flex: none` — **neu** | Regel 2. Der Standard eines Flex-Kindes ist `flex: 0 1 auto` — es darf schrumpfen. Ein Kopf, der schrumpft, schneidet seinen Text ab. Eine **Sammelregel** und keine Markierungsklasse je Leiste: Damit kann kein Kind die Laufstrecke an sich nehmen, auch keines, das nächstes Jahr dazukommt. |
| 8 | `.screen > .screen__body` | `flex: 1 1 auto` — **neu** | Der Laufbereich ist das einzige Kind, das den Rest nimmt. Höhere Spezifität (0,2,0) als die Sammelregel (0,1,0), also unabhängig von der Quellreihenfolge. |
| 9 | `.screen__body` | `min-block-size: 4rem` — **neu** | **Die Zeile, an der alles hängt** — nur nicht als Null, sondern als Boden; die Begründung dafür steht in Abschnitt 7.2. Der Sinn ist derselbe: Die Mindesthöhe eines Flex-Kindes ist auf der Hauptachse inhaltsabhängig (`auto`). Bliebe sie das, wäre der Laufbereich mindestens so hoch wie seine Liste, die Spalte wüchse, `.screen` überliefe den Rahmen — und es liefe die Seite statt des Inhalts. |
| 10 | `.screen__body` | `overflow-y: auto` — **neu** | Hier und nur hier entsteht die Laufstrecke. |
| 11 | tiefer: `.screen__body--frame` → Layoutraster → `.runarea` | dieselben drei Regeln noch einmal | Eine Ansicht mit zwei unabhängigen Laufspalten wiederholt Stufe 6 bis 10 eine Ebene tiefer: Null, `flex: none` für das Feste, `.runarea` für das Laufende. Mehr als eine zusätzliche Ebene braucht keine der elf Ansichten. |

Was in dieser Kette **nicht** vorkommt und nicht vorkommen darf: `vh`, `dvh` oder `calc(100vh - …)`
an irgendeiner Stufe innerhalb von `.app`. Die Hülle kennt ihre Höhe aus Stufe 1 und 2; eine
zweite, unabhängig gerechnete Höhe wäre eine zweite Wahrheit und würde bei jeder Änderung an
Kopf, Meldungsband oder Fassungshinweis falsch. `dvh` bleibt dort, wo es hingehört: an Kästen,
deren umschließender Block wirklich das Fenster ist — `.scrim`, `.toast-layer`, `.shellnotes`.

## 3. Die Klassen

### 3.1 Der Vertrag

```
.app__main                      Rahmen. Ein Fach, Fensterrestgröße, kein Innenabstand.
└── .screen                     genau ein Kind, immer. Flex-Spalte, auf Rahmengröße gestreckt.
    ├── .screen__header         fest. Steht heute schon (ScreenHeader.tsx).
    ├── .screen__bar            fest, 0..n. Filterleiste, Werkzeugzeile, Meldeband.
    └── .screen__body           läuft. Genau einer.
```

Zwei zusätzliche Bezeichner für den Ausnahmefall:

```
.screen__body--frame            läuft nicht, rahmt. Für Ansichten mit zwei Laufspalten
                                und für das Board (dessen Lauf waagerecht ist).
.runarea                        „dieser Kasten nimmt den Rest und läuft" — dieselbe
                                Regelmenge wie .screen__body, an beliebiger Tiefe.
```

**Der Regelfall ist `.screen__body` allein.** `--frame` und `.runarea` sind für die Ansichten
gedacht, denen T-322 zwei Laufbereiche zuspricht; wer sie ohne diese Entscheidung benutzt, baut
eine zweite Bildlaufposition ohne Auftrag.

### 3.2 Die Regeln

```css
/* app.css — bei .app, neben --app-header-height */
.app {
  /* Der Innenabstand der Arbeitsfläche. Ein lokaler Eigenwert und **kein neues
     Token**: der Wert kommt aus --space-6, der Name spart die Wiederholung an
     drei Stellen und macht den schmalen Fall zu einer Zeile statt zu drei.
     Dieselbe Bauform wie --app-header-height und --app-header-timer-width. */
  --screen-inset: var(--space-6);
}

@media (max-width: 52rem) {
  /* Ersetzt zeichengleich das heutige `.app__main { padding: var(--space-4) }`. */
  .app { --screen-inset: var(--space-4); }
}

/* app.css — .app__main */
.app__main {
  grid-area: main;
  position: relative;               /* unverändert. Begründung: der Kommentar dort. */
  display: grid;                    /* neu  — Stufe 5 */
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  padding: 0;                       /* war var(--space-6) — siehe 3.3 */
  overflow-y: auto;                 /* unverändert — der Notausgang, siehe 7.2 */
  overflow-x: hidden;               /* unverändert — Begründung in Abschnitt 4 */
  overscroll-behavior: contain;
  /* scrollbar-gutter: stable **entfällt hier** — die Rinne sitzt am Laufbereich (5.1) */
}

/* viewport-layout.css — der Mechanismus. Reihenfolge der Blöcke ist verbindlich:
   die Sammelregel zuerst, die benannten Teile danach. */
.screen {
  min-block-size: 0;
  padding-block-start: var(--screen-inset, var(--space-6));
}

.screen > * { flex: none; }

.screen__header,
.screen__bar {
  padding-inline: var(--screen-inset, var(--space-6));
  overflow: hidden;                 /* berichtigt T-334 — nur der Rinne wegen, 5.1 */
  scrollbar-gutter: stable;         /* auf BEIDEN Achsen: overflow-y allein rechnet
                                       die andere auf auto, und eine Leiste im festen
                                       Teil ist genau das, was AK-04 verbietet */
}

.screen__body,
.runarea {
  min-block-size: 4rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  position: relative;               /* berichtigt T-326 — Pflicht, nicht Wahl. 8.4 */
}

/* Berichtigt T-344: **die Null gehört nur an die Kinder des Rahmens.**
   Hier stand bis zum 2026-09-13 ein gemeinsamer Block für beide Selektoren:

       .screen > .screen__body,
       .screen__body--frame > * { flex: 1 1 auto; min-block-size: 0; }

   Gebaut ist die Null nur für `--frame > *`, und das ist richtig — die
   Begründung steht seit T-326 in `viewport-layout.css:413-419`, nur nicht
   hier: `min-block-size: 0` an `.screen > .screen__body` hat die Spezifität
   (0,2,0) und überschreibt damit den Boden von 4 rem aus (0,1,0). Der
   Laufbereich fiele im niedrigen Fenster auf **null**, der Kopf bliebe stehen,
   und der Inhalt läge in einem nullhohen Bildlaufkasten — praktisch
   unerreichbar. Weg wäre damit genau der Rückfall aus 7.2, T-322 R-3, AK-18
   und E-112 Punkt 3. Wer das Muster nach dem alten Wortlaut auf eine zwölfte
   Ansicht zieht, baut den Rückfall aus (T-343 B-10). */
.screen__body--frame > * {
  flex: 1 1 auto;
  min-block-size: 0;
}

.screen > .screen__body {
  flex: 1 1 auto;                   /* ohne min-block-size — siehe darüber */
  display: flex;
  flex-direction: column;
  gap: var(--space-5);              /* das bisherige gap von .screen, jetzt für den
                                       laufenden Teil — siehe 3.4 */
  padding-inline: var(--screen-inset, var(--space-6));
  padding-block-end: var(--screen-inset, var(--space-6));
}

.screen__body--frame {
  overflow-x: hidden;               /* berichtigt T-326 — war `overflow: hidden` */
  overflow-y: auto;                 /*   Begründung unmittelbar darunter */
  overscroll-behavior: auto;
  scrollbar-gutter: stable;         /* berichtigt T-334 — war `auto`. 5.1 */
  /* `padding-block-end: 0` ist **gestrichen**, berichtigt T-326: Die 24px unter
     Board, Karten und Bereich sind bisher der untere Innenabstand von `.app__main`
     und bleiben damit zeichengleich, wo sie sind. Die `.runarea`n liegen in Karten,
     die ihren Innenabstand selbst tragen. */
}
```

`.screen` behält aus `app.css` unverändert `display: flex`, `flex-direction: column`,
`gap: var(--space-5)`, `width: 100%`, `min-width: 0`.

**Vier Berichtigungen an diesem Block, jede mit ihrer Zahl.** Die vierte steht als Kommentar im
Block selbst (T-344, T-343 B-10): `min-block-size: 0` gehört **nur** an die Kinder des Rahmens; an
`.screen > .screen__body` überschriebe es den 4-rem-Boden und baute den Rückfall aus. Sie ist die
**zehnte** Stelle dieses Papiers, die vom Bau widerlegt wurde — gefunden nicht an der Anwendung,
sondern an einem Kommentar in `viewport-layout.css`, der seit T-326 die Begründung trug, die hier
fehlte.

1. **`overflow-y: auto` statt `overflow: hidden` am Rahmen** (T-326). Mit `hidden` gilt für den
   Rahmen dieselbe Rechnung wie für den Laufbereich: Er fällt auf den Boden von 4 rem, und was
   darin **feststeht**, wird abgeschnitten — die Bereichsschiene der Einstellungen (acht Einträge,
   gemessen etwa **420 px**), die 12 rem Mindesthöhe einer Kanban-Spalte, die Karte „Timer". Das
   ist T-322 R-d wörtlich: Inhalt wird unerreichbar, der schwerste denkbare Fehler dieses Umbaus.
   Mit `auto` ist der Rückfall derselbe wie eine Ebene höher und genauso selbsttätig; im getragenen
   Bereich kostet die Zeile nichts, weil die Kinder des Rahmens genau seine Höhe annehmen (gemessen
   Einstellungen 1280 × 820: keine laufende Fläche; 1280 × 300: Rahmen läuft 577/175, Schiene
   erreichbar).
2. **`padding-block-end` bleibt** (T-326). Der Satz „der Fuß gehört den Spalten darin" stimmt für
   die Zeiterfassung und ist für Board und Einstellungen falsch — dort hätten sich 24 px verschoben,
   und „keine neue Optik" war die Bedingung dieser Aufgabe.
3. **Zwei Sammelregeln statt einer** (T-334). `.screen > * { flex: none }` trägt Regel 2 nur für
   die **Kinder von `.screen`**. Im Laufbereich fehlte sie, und dort ist sie teurer: Jede `.card`
   trägt `overflow: hidden` (`components.css`), hat damit nach CSS-Flexbox §4.5 die automatische
   Mindesthöhe **0** und gibt als Erste nach. Gemessen bei 1280 × 820, `Höhe / scrollHeight /
   clientHeight`:

   | Fall | vorher | nachher |
   |---|---|---|
   | Dashboard, Karte „Timer" | **2 / 168 / 0** — unsichtbar | 170 / 168 / 168 |
   | Export, „Vorlage und Rundung" | **67 / 350 / 65** — 285 px weg | 352 / 350 / 350 |
   | Export, Karte des Laufergebnisses | **84 / 437 / 82** — 355 px weg | 439 / 437 / 437 |
   | Protokoll, Legendenkarte | **2 / 178 / 0** — unsichtbar | 180 / 178 / 178 |
   | Einstellungen „Daten", drei Karten | 27, 27 und 61 px weg | vollständig |

   Also **zusätzlich**, und `:not(--frame)`, weil ein Rahmen seinen Kindern das Gegenteil sagt:

   ```css
   .screen > .screen__body:not(.screen__body--frame) > *,
   .runarea > *,
   .screen__body--frame .kcolumn__body > * {
     flex: none;
   }
   ```

   **Der Befund ist der Grund für Abschnitt 9.6.** Keiner dieser sieben Fälle ist von einer der
   Zusicherungen A1 bis A7 gefangen worden — und das ist kein Zufall: A1 und A2 fragen Dokument und
   **Rahmen**, und deren Zahlen werden durch das Abschneiden **besser**.

### 3.3 Die Pflichten

| Bezeichner | Pflicht |
|---|---|
| `.app__main` | Genau **ein** Elementkind, und es trägt `.screen`. Kein Innenabstand, kein Hintergrund, keine Rinne. Nie `transform`, `filter`, `backdrop-filter`, `will-change` oder `contain` — Begründung in 8.3. |
| `.screen` | Trägt nie eine eigene Höhe und nie `overflow`. Sein letztes Kind ist `.screen__body`. Genau einer. |
| `.screen__header` | Bleibt das erste Kind. Kein Hintergrund, kein `position: sticky` — es steht ohnehin still, weil es außerhalb des Laufbereichs liegt. **Ergänzt T-334:** Es reserviert dieselbe Rinne wie der Laufbereich (`overflow: hidden` auf **beiden** Achsen plus `scrollbar-gutter: stable`, 5.1) und hat deshalb nichts abzuschneiden — sein Inhalt bricht um (7.4), und aufgeklappte Listen liegen seit T-059 im Portal. |
| `.screen__bar` | Nur für eine Leiste, die T-322 ausdrücklich stehenlässt. Sie trägt den Innenabstand selbst, nicht ihr Inhalt, und ist immer ein **Umschlag** — nie eine Zusatzklasse an einer vorhandenen Leiste, sonst trifft `padding-inline` auf deren eigene Polsterung. Dieselbe Rinne wie der Kopf. |
| `.screen__body` | Trägt keinen Hintergrund (8.3) und kein `padding-block-start` (6.2). Trägt **`position: relative`** — Pflicht, nicht Wahl, siehe 8.4. Trägt `id="inhalt"`, **wenn er der Inhaltshalt der Ansicht ist** — in den acht Regelansichten ist er das (berichtigt T-344, 8.5). |
| `.runarea` | Nur innerhalb von `.screen__body--frame`. Jede `.runarea` trägt ihren eigenen `padding-block-end` und dieselbe `position: relative` (8.4). In den Einstellungen und in der Zeiterfassung trägt sie **`id="inhalt"`**, weil sie dort der erste Kasten mit eigener Laufstrecke ist (8.5). |

| `.screen__body--frame` | Läuft im getragenen Bereich nicht und reserviert trotzdem die Rinne (5.1). Behält seinen `padding-block-end`. Seine Kinder nehmen seine Höhe an, sie drücken sie nicht auf. **Trägt nie `id="inhalt"`** und — außer als `--split` — weder Halt noch Rolle noch Namen (berichtigt T-344, 8.5): Ein Kasten, der nicht läuft, ist kein Ziel für eine Marke, die den Lauf bedienbar machen soll. |

### 3.4 Was mit `.app__main` geschieht — und was der Innenabstand kostet

`.app__main` trägt heute beides: `padding: var(--space-6)` **und** `overflow-y: auto`. Das geht
nicht zusammen, sobald der Kopf stehenbleiben soll — ein nicht laufendes Kind eines laufenden
Kastens gibt es nicht. Also wandert eines von beiden. Es wandert **der Innenabstand**, und der
Bildlauf bleibt formal dort, wo er ist (7.2 sagt, warum er nicht ganz verschwindet).

Der Abstand teilt sich so auf:

- `padding-block-start` an `.screen` — der Kopf beginnt 24px unter der Kopfleiste, wie heute.
- `padding-inline` an `.screen__header`, `.screen__bar` und `.screen__body` — 24px links und
  rechts, wie heute.
- `padding-block-end` an `.screen__body` — 24px unter dem letzten Baustein. Er liegt **im**
  Laufbereich und läuft mit, genau wie der untere Innenabstand von `.app__main` heute.
- `padding-block-start` am Laufbereich: **keiner.** Zwei unabhängige Gründe, und beide zählen.
  Erstens macht ihn die `gap`-Regel von `.screen` unnötig: zwischen Kopf und Laufbereich stehen
  ohnehin 20px (`--space-5`), und das ist zeichengleich der Abstand, den `.screen` heute zwischen
  Kopf und erstem Baustein setzt. Zweitens hätte ein `padding-block-start` einen klebenden
  Tabellenkopf (`top: 0`) unter sich einen Streifen laufenden Inhalts sehen lassen — Abschnitt 6.2.

**Was das für den optischen Abstand zwischen Kopf und laufendem Inhalt heißt.** Nichts, im
Zustand „ganz oben": 20px, wie heute. Und im gelaufenen Zustand braucht es **keine Kante und
keinen Schatten unter dem Kopf**, weil nichts unter ihm durchläuft: Der Laufbereich ist ein
Geschwister des Kopfes, nicht seine Unterlage. Sein Inhalt verschwindet an seiner **eigenen**
oberen Kante, die genau an der Unterkante des Kopfes liegt. Das ist zeichengleich das Verhalten,
das `.dialog__body--form` seit `viewport-layout.css` zeigt und das dort abgenommen wurde. Eine
neue Trennlinie über jeder Ansicht wäre neue Optik ohne Anlass.

**Die eine sichtbare Folge — berichtigt am 2026-09-13: es gibt keine.** Die Inhaltsspalte bleibt
pixelgleich: heute liegt ihr rechter Rand bei `Rahmen − Rinne − 24`, weil `.app__main` erst die
Rinne und dann den Innenabstand abzieht; morgen liegt er bei `Rahmen − Rinne − 24`, weil der
Laufbereich dasselbe in derselben Reihenfolge tut. Der linke Rand liegt in beiden Fällen bei
`Rahmen + 24`. **Und der rechte Rand des Kopfes liegt dort ebenfalls.**

**Was hier bis zum 2026-09-13 stand, und es ist überholt:**

> Verschoben wird genau ein Rand: der **rechte Rand des Kopfes** wandert um die Rinnenbreite
> (schmale Leiste, engine-abhängig etwa 12px) nach außen, weil der Kopf kein Laufbereich ist und
> keine Rinne reserviert. Das ist hingenommen und nicht ausgeglichen, aus drei Gründen:
>
> 1. Der Bestand hat es zweimal und es ist nie aufgefallen: `.dialog__head--form` gegen
>    `.dialog__body--form`, und `.app__header` gegen `.app__sidebar`.
> 2. Der Ausgleich bräuchte die Rinnenbreite als Zahl in CSS. Die gibt es nicht — sie ist
>    engine-abhängig, und eine geratene Konstante ist in diesem Bestand kein Ausgleich.
> 3. Ein Rinnenkanal zwischen Kopfkante und Inhaltskante ist die Form, in der jede Arbeitsfläche
>    mit laufendem Rumpf aussieht. Der Kanal *ist* die Erklärung für den Versatz.
>
> Eine geprüfte Verfeinerung, die den Versatz auf null brächte, steht als **offene Frage 2** — sie
> verlangt eine Messung in allen drei ausgelieferten Engines und wird ohne diese Messung nicht
> gebaut.

Grund 2 ist der tragende, und er ist **eingelöst, nicht widerlegt**: Der Ausgleich braucht die
Rinnenbreite tatsächlich nicht als Zahl, weil `scrollbar-gutter: stable` sie selbst kennt. Genau
die Verfeinerung aus der alten offenen Frage 2 ist gebaut (T-334) und in Chromium gemessen:

| Rechte Inhaltskante bei 1280 × 820 | vor T-326 | nach T-326 | nach T-334 |
|---|---|---|---|
| Todos, Buchungen, Dashboard — `Kopf / Laufbereich` | 1246 / 1246 | **1256** / 1246 | 1246 / 1246 |
| Einstellungen (Rahmenansicht) | 1246 / 1246 | 1256 / **1256** | 1246 / 1246 |

Über **alle 44** gemessenen Fälle (elf Ansichten × vier Fenstergrößen) ist die Differenz zwischen
Kopfkante und Inhaltskante **0**. Das ist zugleich die Kante von vor T-326, denn damals reservierte
`.app__main` die Rinne für alle elf.

Grund 1 und 3 bleiben als Beobachtung wahr und sind trotzdem keine Rechtfertigung mehr: Daß ein
Versatz erklärbar ist und daß es ihn anderswo gibt, heißt nicht, daß er hier entstehen mußte. Die
**Zusage** dieser Aufgabe war „pixelgleich", und 10 px sind nicht pixelgleich. Die Regel, die
daraus wird, steht in 5.1.

**Die Kosten der Berichtigung, benannt:** Der Kopf bekommt dafür `overflow: hidden` auf beiden
Achsen (`scrollbar-gutter` wirkt nur an einem Bildlaufkasten). Daß dabei nichts abgeschnitten wird,
ist **im Bild** gemessen und nicht aus der Kastenrechnung geschlossen — derselbe Kopf zweimal
aufgenommen, mit und ohne die Zeile, bei gleicher Inhaltsbreite, Bildpunkt gegen Bildpunkt:

| Kopf | Größe | verschiedene Bildpunkte | größter Unterschied |
|---|---|---|---|
| Zeiterfassung, Einstellungen | 1040 × 29 | **0** | 0 |
| Todo-Detail | 1040 × 83 | 17 | 2 von 255 |
| Buchungen | 1040 × 255 | 23 | 2 von 255 |
| Kanban | 1040 × 159 | 32 | 2 von 255 |

Kantenglättung in der obersten Zeile, kein Buchstabe. **Die Zusage reicht aber weiter als die
Messung**, und das gehört dazu: `overflow: hidden` am festen Teil ist eine Zusage über die
**Zukunft**. Wer künftig etwas in den Kopf legt, das über dessen Kante ragen soll, wird
abgeschnitten statt gewarnt. Heute trägt das der Umbruch aus 7.4 und das Portal aus 8.2; wer eine
dritte Bauform in den Kopf bringt, prüft sie dort.

## 4. Waagerecht

**Der Inhalt darf die Seite nicht breiter machen.** Der waagerechte Lauf gehört genau zwei
Kästen, und beide haben ihn heute schon:

| Fläche | Zeile | Fachlicher Grund |
|---|---|---|
| `.table-wrap` (`components.css:744`) | `overflow-x: auto` | **Der harte Fall.** Die Buchungstabelle hat Spalten, die man nicht stapeln kann: Datum, Dauer, Status, Call, Leistung, Todo. Eine Tabelle ist zweidimensionaler Inhalt, und WCAG 2.2 SC 1.4.10 nimmt genau den aus. Drei Fundstellen: `BookingTable.tsx:160`, `ExportGroups.tsx:168` und `:243`. |
| `.board` (`app.css:3973`) | `overflow-x: auto` | Zwölf Statusspalten sind nebeneinander eine Aussage und untereinander keine. |

Ein dritter kommt nicht dazu. Alles andere bricht um, statt zu laufen — die Umbrüche dafür stehen
schon (`.stat-grid` mit `auto-fit`, die fünf Rasterlayouts auf `minmax(0, 1fr)`, die Medienstufen
bei 68rem, 60rem, 52rem, 40rem, 32rem).

**Ergänzt am 2026-09-14 (T-362): eine vierte Fundstelle von `.table-wrap` ist kein dritter Kasten.**
Die Todo-Liste wird eine Tabelle (`todo-tabelle.md`) und bekommt damit ihren waagerechten Lauf —
nicht als neue Ausnahme, sondern weil sie in die Zeile `.table-wrap` einzieht, die es seit
`components.css:744` gibt. Die Zahl in dieser Tabelle wächst von drei auf vier Fundstellen; die
Menge der Kästen mit waagerechtem Lauf bleibt **zwei**. Das ist der Unterschied, auf den es hier
ankommt: Wer einen vorhandenen Kasten ein viertes Mal benutzt, erweitert die Ausnahme nicht — wer
einen fünften Kasten mit `overflow-x` versieht, tut es.

Eine Folge davon, die keiner der drei bisherigen Fundstellen auffiel und die in `todo-tabelle.md`
6.3 als **gerechnet und noch nicht gemessen** steht: Ein **Blockelement** in einem waagerecht
laufenden Kasten ist so breit wie dessen Inhaltsbreite, nicht wie dessen Laufbreite, und wandert
beim Rollen aus dem Bild. Ein **Tabellenteil** (`tfoot`, `caption`, `td[colspan]`) ist so breit wie
die Tabelle. Wer einen Nachladefuß oder einen Hinweis in eine laufende Tabellenfläche legt, wählt
damit zwischen zwei Verhalten und nicht zwischen zwei Schreibweisen.

**Wie die Kette durchlässig wird.** An jeder Fuge `min-inline-size: 0` beziehungsweise
`minmax(0, 1fr)`, damit die Mindestbreite eines Kastens nicht die seines breitesten unteilbaren
Inhalts ist:

1. `.app` Spalte `main`: `minmax(0, 1fr)` — **vorhanden**, mit genau dieser Begründung im
   Kommentar („eine breite Tabelle drückt das Raster auseinander, und die Sidebar wandert").
2. `.app__main`: `min-width: 0` — **vorhanden**; dazu `grid-template-columns: minmax(0, 1fr)` neu.
3. `.screen`: `min-width: 0` — **vorhanden**.
4. `.screen__body`: als Flex-Kind auf der Querachse ohnehin auf Elternbreite gestreckt; als
   Flex-Container gibt es die Breite an seine Kinder weiter, die dafür `min-width: 0` brauchen —
   `.detail`, `.time-layout`, `.settings-layout`, `.tpl-layout`, `.tags-split` haben es
   (`minmax(0, 1fr)`), `.grow` aus `base.css` trägt es für den Rest.
5. `.table-wrap` selbst: eigener Bildlaufkasten, also an der Elternbreite gemessen und nicht am
   Inhalt. Hier endet die Kette.

**`.app__main` bleibt bei `overflow-x: hidden`.** Mit Grund, und der Grund ist nicht Bequemlichkeit:

- Es schneidet **nicht** den waagerechten Lauf seines Enkels ab. `.table-wrap` ist ein eigener
  Bildlaufkasten; er wird auf die Breite des Rahmens gemessen und läuft **in sich**. Der stille
  Abschneider, den der Auftrag zu Recht nennt, entsteht in einem anderen Fall: wenn der Kasten,
  der laufen soll, **kein** Bildlaufkasten ist, oder wenn die Kette darüber nicht durchlässig ist.
  Dann ist er so breit wie sein Inhalt, und der Rahmen schneidet weg, was der Benutzer nie
  erreicht.
- Der Schutz dagegen ist also nicht, `hidden` wegzunehmen, sondern die Durchlässigkeit zu
  **messen**. Das tut der Meßsatz: `main.scrollWidth === main.clientWidth`, auf jeder Ansicht, an
  jeder Fenstergröße (Abschnitt 9, Zusicherung A2). Wäre die Kette irgendwo verstopft, wird der
  Lauf rot — und zwar dort, wo der Fehler ist, statt beim Benutzer.
- `overflow-x: auto` an dieser Stelle wäre die Alternative: ein Fehler würde dann sichtbar statt
  schneidend. Er wäre aber als **waagerechte Bildlaufleiste über die ganze Arbeitsfläche**
  sichtbar — genau das Symptom, das der Auftraggeber beanstandet hat. Ein Fehler, der wie der
  beanstandete Zustand aussieht, ist die schlechtere Anzeige. Der Lauf ist die bessere.

**`scrollbar-gutter` an einer waagerechten Fläche: nein.** Begründung in 5.2.

## 5. Bildlaufleisten

### 5.1 Wo `scrollbar-gutter: stable` — **berichtigt am 2026-09-13**

Die alte Fassung spannte die Menge an der Frage auf, **wer läuft**. Das trägt nur acht der elf
Ansichten. Die Regel, die beide Fälle trägt, spannt sie an der Frage auf, **wer die Kante
bestimmt**:

> **Eine Kante, elf Ansichten.** `scrollbar-gutter: stable` steht an jedem Kasten, dessen
> Inline-Endkante die rechte Kante der Inhaltsspalte festlegt — am laufenden, weil er die Rinne
> braucht, **und am stehenden, weil er sich an ihr ausrichten muß.** Die Rinne ist keine Zugabe
> zum Bildlauf, sie ist die Kante.

Daraus, und jeder Punkt mit dem Grund, aus dem er dazugehört:

| Kasten | Warum |
|---|---|
| `.screen__body`, `.runarea`, `.kcolumn__body`, `.app__sidebar`, `.dialog__body--form` | Sie laufen. Die Rinne verhindert, daß die Inhaltsbreite an der Länge der Liste hängt. |
| **`.screen__body--frame`** | Er läuft im getragenen Bereich **nicht** — und trägt die Rinne trotzdem. Ohne sie endete die Inhaltsspalte der drei Rahmenansichten 10 px weiter rechts als die der acht übrigen. |
| **`.screen__header`, `.screen__bar`** | Sie laufen **nie** — und tragen die Rinne trotzdem, samt `overflow: hidden` auf beiden Achsen, ohne das `scrollbar-gutter` wirkungslos wäre. Sonst endete der feste Teil weiter außen als der laufende darunter. |

**Der alte Grund gilt unverändert, er reicht nur nicht weit genug.** Ursache 2 aus T-057, eine
Ebene tiefer: Der Platz für die Leiste ist immer reserviert, ob sie erscheint oder nicht; sonst
hängt die Inhaltsbreite daran, wie lang die Liste gerade ist. Gemessen damals 1190 gegen 1200 px
zwischen Ansichten mit langem und mit kurzem Inhalt. Derselbe Sprung entsteht **innerhalb** einer
Ansicht, sobald ein Filter eine Liste von kurz auf lang bringt — und dort ist er schlimmer, weil
der Benutzer ihn auslöst und dabei hinsieht.

**Was der alte Grund nicht sah:** Ein Sprung entsteht auch **zwischen** zwei Kästen, die
nebeneinander oder übereinander dieselbe Spalte begrenzen sollen, und er ist dort dauerhaft statt
ereignisabhängig. Vor T-326 gab es ihn nicht, weil `.app__main` die Rinne für alles reservierte,
was darin lag. Als der Bildlauf nach innen zog, zerfiel die eine Kante in drei: Laufbereich mit
Rinne, Rahmen ohne, fester Kopf ohne. Gemessen 1246 gegen 1256 (3.4). **Der Umzug einer Zeile ist
nicht ihre Streichung** — das ist der allgemeine Satz hinter diesem Fall und derselbe wie in 8.4.

**Die Gegenprobe, die die halbe Behebung entlarvt hat:** T-334 hat zuerst nur `.screen__header`
und `.screen__bar` nachgezogen. Danach endete der Kopf der drei Rahmenansichten bei 1246 und ihr
Inhalt weiter bei 1256 — der Versatz war nicht weg, er war gewandert. Erst `stable` **auch** am
Rahmen macht die Differenz über alle 44 Fälle zu 0. Wer eine Kante ausrichtet, zählt die Kästen,
die sie bestimmen, und nicht die, die er gerade in der Hand hat.

Keine Ausnahme für schmale Laufbereiche. Die Seitenspalte der Detailansicht ist 20rem breit, die
Rinne kostet dort etwa 4 % — weniger als der Sprung, den sie verhindert, und Einheitlichkeit über
elf Ansichten ist hier mehr wert als 12 Pixel in einer.

**Der Preis, benannt:** eine leere Rinne im Regelfall an drei Rahmenansichten und an jedem festen
Kopf — 10 px, die vor T-326 ebenfalls leer waren. Der Rahmen kann laufen (3.2, Rückfall), der Kopf
nie; an ihm ist die Rinne reiner Ausrichtungsplatz. Das ist der Wechselkurs dieser Entscheidung und
er ist bewußt so gewählt: **eine gemeinsame Kante über elf Ansichten ist mehr wert als 10 px in
dreien.**

### 5.2 Wo nicht

**Die Trennlinie ist die Achse, nicht der Bildlauf.** `stable` reserviert an der Kante, an der eine
Leiste erscheinen könnte: für einen Lauf auf der **Blockachse** an der Inline-Endkante (rechts),
für einen Lauf auf der **Inline-Achse** an der Blockendkante (unten). Ein Kasten, der auf beiden
Achsen Bildlaufkasten ist, bekommt also **beide** Rinnen. Daraus folgt die Ausnahmeliste, und sie
widerspricht 5.1 nicht:

- **`.app__main`.** Seine Rinne wäre im Regelfall leerer Rand neben der Rinne des Laufbereichs,
  und eine Kante bestimmt es nicht mehr — die bestimmen seine Kinder. Die Zeile entfällt dort.

  **Berichtigt am 2026-09-13 (T-344): der Grund, der hier stand, war falsch.** Er lautete:

  > Es ist **nicht mehr der Läufer**; seine Rinne wäre leerer Rand neben der Rinne des
  > Laufbereichs.

  Der erste Halbsatz widerspricht 7.2 desselben Papiers. `.app__main` behält `overflow-y: auto`,
  und im **Rückfall ist es der Läufer** — so gebaut (`app.css:377`), so gewollt, und nach T-322
  R-3a Punkt 2 darf der Rückfall **im getragenen Fenster** greifen, sobald eine Hüllenmeldung oder
  der Fassungshinweis Höhe nimmt. In diesem Augenblick erscheint am Rahmen eine Bildlaufleiste ohne
  reservierte Rinne, und die Inhaltsspalte wird um deren Breite schmaler — Ursache 2 aus T-057,
  ausgelöst durch ein Ereignis, das der Benutzer sieht, und über alle elf Ansichten zugleich
  (T-343 B-09).

  **Entschieden wird gegen die Rinne und für die benannte Grenze**, und die Rechnung steht dabei:
  Eine Rinne an `.app__main` kostet **10 px in jedem Fenster und für immer** — die Inhaltsspalte
  endete dann bei 1236 statt bei 1246, also 10 px innerhalb der Kante von vor T-326, und die Zusage
  „pixelgleich" aus 3.4 wäre in **allen 44** Fällen gebrochen, um einen Sprung in dem einen Fall zu
  verhindern, in dem eine Meldung steht. Das ist derselbe Wechselkurs wie in 5.1, nur andersherum
  gerechnet, und er fällt hier anders aus.

  **Der Preis, benannt:** Beim Erscheinen und beim Verschwinden einer Hüllenmeldung oder des
  Fassungshinweises springt die Inhaltsbreite um die Rinnenbreite, wenn der Rahmen dadurch zu laufen
  beginnt. **AK-10 gilt deshalb ohne den Rückfall** — die Geltungsgrenze gehört in den Satz und nicht
  ins Kleingedruckte, sonst mißt ein Prüflauf bei stehender Meldung einen Fehler, wo eine
  Entscheidung ist. Was der Sprung **nicht** ist: der Sprung aus Ursache 2 zwischen kurzer und
  langer Liste. Den verhindert die Rinne am Laufbereich weiterhin, und er ist der häufige.
- **`.board`.** Es ist waagerechter Läufer und durch `overflow-y: hidden` zugleich Bildlaufkasten
  auf beiden Achsen — `stable` würde dort **auch** eine Rinne an der Blockendkante reservieren,
  also ein dauerhaft leeres Band unter dem Board, auf jedem Fenster. Die Spalten reservieren ihre
  Rinne selbst; ein Band darunter nähme jeder Spalte Höhe, ohne etwas zu verhindern.
- **Ein `.table-wrap`, das nur waagerecht läuft.** Gleiche Überlegung: ein leeres Band unter jeder
  Tabelle, auch unter den schmalen. Wird das `.table-wrap` dagegen selbst zum Laufbereich der
  Ansicht (6.3), reserviert es beide Rinnen — und dann ist das Band an der Unterkante gewollt,
  weil es den senkrechten Sprung verhindert, der entsteht, wenn eine zusätzliche Spalte die
  waagerechte Leiste erscheinen lässt.

**Warum der Rahmen kein Band an der Unterkante bekommt** — die Frage, die nach 5.1 sofort kommt:
`.screen__body--frame` trägt `overflow-x: hidden` **und** `overflow-y: auto`, ist also
Bildlaufkasten nur auf der Blockachse und bekommt nur die Rinne rechts. Der waagerechte Lauf gehört
dort ohnehin `.board` und `.table-wrap` und keinem dritten Kasten (Abschnitt 4). Das ist der
Unterschied zu `.board`, und er steckt in genau einer Deklaration.

**Der feste Kopf ist der eine Fall, der nicht zu Ende gemessen ist.** `.screen__header` und
`.screen__bar` tragen `overflow: hidden` auf **beiden** Achsen — nach derselben Rechnung müßten sie
damit auch eine Rinne an der Blockendkante bekommen, also ein leeres Band unter jedem Kopf. In
Chromium ist keins zu sehen: Die Kopfhöhen sind vor und nach der Zeile gleich, und der Bildvergleich
findet höchstens 32 unterschiedliche Bildpunkte mit einem größten Unterschied von 2 von 255. Eine
**getrennte** Messung der Blockendkante über die drei ausgelieferten Engines liegt jedoch nicht vor,
und die alte offene Frage 2 hat genau diese Kante als ungemessen benannt. Sie bleibt es und steht
als **offene Frage 2** weiter, nur mit vertauschten Rollen: nicht mehr „soll es gebaut werden",
sondern „es ist gebaut, und eine Engine fehlt der Messung".

### 5.3 `overscroll-behavior`

`contain` an jedem Laufbereich — so, wie es `.app__main`, `.dialog__body--form`, `.board` und
`.kcolumn__body` heute schon tragen. Ein Bildlauf, der am Ende angekommen ist, soll nicht die
Fläche darüber in Bewegung setzen.

**Der Preis, benannt:** unterhalb der getragenen Mindesthöhe (7.2) übernimmt der Rahmen den
Bildlauf, und `contain` hindert das Rad dann daran, vom Laufbereich aus dorthin durchzugreifen.
Erreichbar bleibt der Rahmen über die Tastatur und über seine eigene Bildlaufleiste. Das ist ein
Nachteil in einem Fensterbereich, den die Hülle gar nicht zulässt (7.1) — hingenommen, nicht
übersehen.

`overscroll-behavior: auto` ausdrücklich an `.screen__body--frame`: dieser Kasten läuft nicht,
also hat er nichts zu enthalten, und die Spalten darin regeln es selbst.

## 6. Klebende Köpfe

### 6.1 Erlaubt, und wo

`position: sticky` ist **nur innerhalb eines Laufbereichs** erlaubt — also in einem Kasten mit
`overflow-y: auto`. Außerhalb ist es entweder wirkungslos oder es klebt am falschen Kasten.

Erlaubt ist es an genau zwei Stellen im Bestand, und an beiden steht es heute schon:

- **`.table thead th`** (`components.css:755`) — und dort ist es heute **wirkungslos**, weil der
  nächste Bildlaufkasten über ihm `.table-wrap` ist und der so hoch ist wie seine Tabelle. Das
  ist keine Vermutung, sondern folgt aus der Regel: `overflow-x: auto` mit `overflow-y: visible`
  rechnet zu `overflow-y: auto`, also ist `.table-wrap` Bildlaufkasten auf beiden Achsen und
  fängt das `sticky` ab. Der Mechanismus macht die Zeile zum ersten Mal wahr — unter der
  Bedingung in 6.3.
- **`.tpl-list`** (`position: sticky; top: var(--space-4)`) und **`.settings-rail`**
  (`top: 0`). Beide kleben heute an `.app__main` und morgen am Laufbereich der Ansicht. Sie
  funktionieren unverändert weiter, solange T-322 diesen Ansichten **einen** Laufbereich gibt.
  Spricht T-322 der Schiene einen eigenen Laufbereich zu, wird das `sticky` überflüssig und
  gehört weg — eine Entscheidung dort, keine hier.

**Ein neues klebendes Band ist neue Optik** und damit nicht Teil dieser Aufgabe. Wer eines will
(Tagesgruppen in der Buchungsübersicht, Ordnerzeilen im Tag-Baum), braucht T-322 und eine
Entscheidung, nicht eine Zeile CSS.

### 6.2 Mit welchem Hintergrund und welcher Kante

Damit unter dem Kopf kein Text durchscheint, gelten fünf Auflagen. Sie müssen in allen neunzehn
Gestaltungen und in beiden Zeilendichten tragen, deshalb ausschließlich über Token:

1. **Deckender Hintergrund aus einem Token.** `var(--bg-subtle)` (so heute der Tabellenkopf) oder
   `var(--bg-surface)`. Nie `transparent`, nie ein Farbwert, nie ein geerbter Hintergrund.
2. **Nicht auf `.card` und nicht auf `.filterbar`.** Beide sind in `glass` und `liquid-glass`
   absichtlich zu 92% deckend und tragen `backdrop-filter`
   (`theme-palettes.css:453`). Ein klebendes Band auf einer dieser Flächen ließe 8% des
   durchlaufenden Textes sehen. Ein klebendes Band **in** einer Karte ist dagegen in Ordnung,
   wenn es seine eigene deckende Fläche mitbringt — genau das tut `.table thead th`.
3. **Eine Kante, kein Schatten.** `border-bottom: 1px solid var(--border-default)` am
   Tabellenkopf, wie heute. Ein Schatten wäre eine neue Erhebung in neunzehn Gestaltungen.
4. **`z-index: var(--z-sticky)`** — das vorhandene Token (10). Über dem Zeileninhalt, unter
   `--z-dropdown` (100) und `--z-popover` (320), damit eine aufgeklappte Liste nie unter einem
   Tabellenkopf verschwindet.
5. **Höhe aus Token, nicht aus Pixeln.** Der Tabellenkopf steht auf
   `padding: var(--space-2) var(--row-padding-x)`, und `--row-padding-x` wechselt mit der Dichte
   (`tokens.css:428`). Eine feste Pixelhöhe würde in „kompakt" falsch sitzen.

Dazu die Regel aus 3.4, hier als Auflage formuliert: **`top: 0` bezieht sich auf die obere
Polsterkante des Laufbereichs.** Hätte der Laufbereich ein `padding-block-start`, stünde über dem
klebenden Kopf ein Streifen durchlaufenden Inhalts. Deshalb hat er keines.

**Höchstens ein klebendes Band je Laufbereich.** Zwei gestapelte Bänder brauchen am unteren
`top: calc(Höhe des oberen)`, und diese Höhe ist in zwei Dichten und neunzehn Gestaltungen keine
Konstante. Wer zwei braucht, baut zwei Laufbereiche.

### 6.3 Die Bedingung, unter der ein Tabellenkopf wirklich klebt

Ein `sticky thead` klebt an dem Bildlaufkasten, der ihm am nächsten ist. Bei einer Tabelle ist das
immer das `.table-wrap`. Also gilt:

> **Ein klebender Tabellenkopf funktioniert nur, wenn das `.table-wrap` der Tabelle selbst der
> senkrechte Laufbereich der Ansicht ist.**

Dafür braucht es keine neue Klasse: der Laufbereich und der Tabellenrahmen sind derselbe Kasten.

```html
<div class="screen__body table-wrap"> <table class="table"> … </table> </div>
```

`.screen__body` bringt `overflow-y: auto` und die Größenrechnung, `.table-wrap` bringt
`overflow-x: auto` — zusammen ein Kasten, der auf beiden Achsen läuft, und das `sticky` des
Tabellenkopfes greift zum ersten Mal. Liegt die Tabelle dagegen als ein Baustein unter anderen im
Laufbereich (Filterleiste, Tagesgruppen, Nachladefuß), klebt ihr Kopf **nicht** — dann läuft die
ganze Liste, und der Kopf wandert mit hinaus. Beides ist zulässig; **welches von beidem eine
Ansicht bekommt, entscheidet T-322.** Hier steht nur: es sind zwei verschiedene Bauformen, und
man bekommt den klebenden Kopf nicht als Beigabe zur anderen.

**Ergänzt am 2026-09-14 (T-362): die Bauform hängt am Zustand, nicht an der Ansicht.**
`.screen > .screen__body.table-wrap` setzt `display: block` (`viewport-layout.css:478`). Damit ist
der Laufbereich in diesem Zustand **kein Flex-Stapel** mehr, und drei Zeilen dieses Mechanismus
greifen nicht: das `gap` aus 3.2, die Sammelregel `flex: none` aus 3.2 Punkt 3 — und, das ist die
teure — `margin-block: auto` an `.screen__body > .empty`, `> .table-shell`, `> .board-setup`
(`viewport-layout.css:462-466`). Ein Bildschirmleerzustand zentriert sich über `auto`-Ränder eines
**Flex**-Elements; im Blockfluß tut die Zeile nichts, und der Leerzustand klebte oben.

Der Bestand baut es deshalb seit T-334 richtig, ohne daß es hier stand (`BookingsScreen.tsx:391`,
`:406`, `:469`):

> **Der gefüllte Zustand nimmt die Tabellenform des Laufbereichs, Leer-, Lade- und Fehlerzustand
> die Stapelform.** Derselbe Laufbereich, derselbe Name, derselbe Halt — eine andere Bauform, weil
> in diesen drei Zuständen keine Tabelle da ist, an der ein Kopf kleben könnte. Genau dafür trägt
> `AsyncBoundary` seinen `fallbackFrame`.

Wer die Tabellenform in allen Zuständen nimmt, bekommt einen Leerzustand am oberen Rand und merkt
es erst im Bild. Wer die Stapelform in allen Zuständen nimmt, bekommt einen Kopf, der nicht klebt,
und merkt es nie — die Ansicht sieht dann nur so aus wie vorher.

Der Todo-Liste wird das die **zweite** Fundstelle der Tabellenform geben (`todo-tabelle.md`); der
dortige Abschnitt 3 ist diese Regel eine Ebene konkreter.

## 7. Mindestgröße

### 7.1 Die Zahlen

**Berichtigt am 2026-09-13 (T-344). „Getragen" hieß in diesem Papier zweierlei, und das ist die
teuerste Art von Fehler: eine falsche Zahl widerlegt der Bau, ein doppeldeutiges Wort nicht.**
Hier stand:

> | **Getragen, ohne Abstriche** | ab **960 × 640** CSS-Pixel | … |
> | **Getragen im Browserbetrieb** | bis **640 × 480** | Der Webbau läuft ohne Hülle, dort gibt es
> keine Untergrenze. … **Der Mechanismus gilt hier unverändert.** |

Daraus hat `tests/e2e/viewport-fit.spec.ts:34-45` den Schluß wörtlich gezogen — „alle fünf liegen
im getragenen Bereich; A2 gilt deshalb bei allen fünf" — und damit sind **zehn gemessene Verstöße**
(T-330) rot, von denen sieben nach E-115 der erwartete Rückfall sind. Zwei Papiere, ein Meßsatz,
zwei Wahrheiten; der Meßsatz im Baum trägt die Fassung, die E-115 verworfen hat (T-343 B-03).

**Es gibt ab hier genau einen Begriff von „getragen", und er ist der aus E-115 und AK-02:**

> **Getragen heißt: Fenster mindestens 960 × 640 **und** Inhaltsbereich ungeschmälert** — also
> ohne stehende Hüllenmeldung und ohne Fassungshinweis. Nur dort gilt A2. Alles darunter ist
> **bedienbar**, nicht getragen, und dort mißt eine eigene, schwächere Zusage.

| Bereich | Maß | Herkunft der Zahl |
|---|---|---|
| **Getragen** | ab **960 × 640** CSS-Pixel, Inhaltsbereich ungeschmälert | `apps/desktop/src-tauri/tauri.conf.json`: `minWidth: 960`, `minHeight: 640`. Kleiner lässt sich das Fenster der Hülle nicht ziehen — das ist die tatsächliche Untergrenze des Erzeugnisses und keine erfundene Zahl. Das Standardfenster ist 1280 × 820. Zugesichert: A1 bis A8, AK-01 bis AK-23. |
| **Bedienbar im Browserbetrieb** | bis **640 × 480** | Der Webbau läuft ohne Hülle, dort gibt es keine Untergrenze. 640 × 480 ist das kleinste Fenster, das ein Schreibtischsystem sinnvoll anbietet; die Umbrüche darunter liegen schon (52rem = 832, 40rem = 640, 32rem = 512). **Der Mechanismus gilt unverändert — die Zusage nicht.** Zugesichert ist hier AK-24: nichts wird abgeschnitten, nichts unerreichbar, der Laufbereich behält seinen Boden, jedes Bedienelement bleibt mit der Tastatur erreichbar und wird beim Fokussieren ins Bild geholt. **Waagerecht gilt A2 weiter** (AK-02a) — dort gibt es keinen Rückfall, eine Überbreite ist ein Schnitt. |
| **Darunter** | bis **320 × 256** | WCAG 2.2 SC 1.4.10: 400% Vergrößerung eines 1280 × 1024-Bildschirms. Hier wird nichts zugesichert außer: **nichts wird abgeschnitten und nichts unerreichbar.** |

**Warum das keine Lockerung nach Rot ist, sondern eine Grenze — gerechnet aus dem, was die Hülle
nimmt** (T-341 3.5, gemessen):

| Fenster | Rest an die Hülle | Bandnavigation | Rahmen | Budget für den festen Teil |
|---|---|---|---|---|
| ab 832 px Breite | 52 px | — (Spalte, 240 px breit) | 588 | **500** |
| darunter | **225 px** | **173 px** | 415 (bei 640 Höhe: 255) | 335 / **175** |

Unterhalb von 52 rem legt sich die Navigation als **Band über** den Kopf und kostet allein 173 px;
bei 640 × 480 nimmt die Hülle damit **47 % der Fensterhöhe**, bevor eine Ansicht überhaupt beginnt.
Dagegen steht der **kleinstmögliche** Kopf einer Ansicht mit Erklärsatz und einzeiliger Filterleiste:
74,8 px Kopfzeile + 113,5 px Leiste + Zwischenräume ≈ **188 px** — gegen ein Budget von **175 px**.
Das Protokoll trägt zusätzlich 29 px Unterreiter.

**Der Boden liegt also über dem Budget, unabhängig von jeder Filterleiste.** Dieselbe Rechnung
erklärt die fünf Pixel, um die die Todos bei 831 × 640 überlaufen. Die Verstöße dort sind keine
Nachlässigkeit und mit einer Gestaltung des Kopfes nicht zu beheben; der einzige verbleibende Hebel
ist die **Bandnavigation** selbst, und der steht als offene Frage 6. Bis dahin ist es ehrlicher, die
Zusage an der Grenze zu beenden, als sie zu behaupten und jede Welle zu lockern.

### 7.2 Das Verhalten unterhalb der getragenen Größe

**Nicht abschneiden. Nicht umbrechen. Laufen lassen — und zwar den Rahmen.**

Der Mechanismus hat dafür keinen Sonderfall und keine Medienstufe. Er hat zwei Zeilen, die
zusammenspielen:

- `.app__main` behält `overflow-y: auto`. Im getragenen Bereich hat dieser Kasten **nichts** zu
  laufen, weil `.screen` genau die Rahmenhöhe hat — es erscheint also keine Leiste, und die
  Zusage „nur der Inhaltsbereich läuft" gilt sichtbar.
- `.screen__body` hat `min-block-size: 4rem`. Wird das Fenster so niedrig, dass Kopf und feste
  Leisten zusammen mehr als die Rahmenhöhe minus 4rem brauchen, wird der Inhalt von `.screen`
  echt höher als der Rahmen — und **dann**, und nur dann, läuft der Rahmen und trägt den Kopf mit
  hinaus.

Damit ist der Rückfall selbsttätig: kein `@media (max-height: …)`, keine Schwellenzahl, die bei
der nächsten Änderung am Kopf falsch wird. Und er ist die richtige Reihenfolge des Nachgebens —
zuerst schrumpft der Laufbereich auf eine noch brauchbare Höhe, dann gibt der Kopf nach, und
abgeschnitten wird zu keinem Zeitpunkt.

**Woher die 4rem.** Aus Token gerechnet: eine Tabellenzeile `--row-height` (40px in der
Vorgabedichte, 32px in „kompakt") plus der untere Innenabstand des Laufbereichs `--space-6`
(24px) sind 64px, also 4rem. Die Aussage dahinter: **mindestens eine Zeile plus ihr Fußabstand
bleibt sichtbar, sonst übernimmt der Rahmen.** Kein gemessener Wert, sondern eine gerechnete
Untergrenze aus zwei Token — und einer, den zu prüfen sich lohnt (offene Frage 3).

Das Dokument selbst wird in **keinem** dieser Bereiche höher oder breiter als das Fenster:
`.app` ist auf `height: 100%` und `overflow: hidden` festgenagelt, und das gilt bei 320 × 256
genauso wie bei 1280 × 820. Die Zusage aus Abschnitt 9 (A1) hat also **keine** Untergrenze, und
**A2a** — waagerecht wird nichts abgeschnitten — ebenfalls keine. Nur **A2** („der Rahmen hat
senkrecht nichts zu laufen") gilt im getragenen Bereich, und zwar in dem einen Sinn aus 7.1:
mindestens 960 × 640 und ungeschmälerter Inhaltsbereich.

### 7.3 Waagerecht unter der getragenen Breite

Kein Rückfall nötig: der Laufbereich wird schmaler, die Rasterlayouts brechen an den vorhandenen
Stufen in eine Spalte, und was sich nicht stapeln lässt — Tabelle und Board — läuft in seinem
eigenen Kasten waagerecht. SC 1.4.10 nimmt genau diese beiden ausdrücklich aus.

**Für den festen Kopf gilt das nicht**, und das war eine Lücke dieses Papiers: Der Kopf ist kein
Rasterlayout mit Umbruchstufe und kein eigener Bildlaufkasten. Er hat bis T-334 weder umgebrochen
noch gelaufen — er ist zerfallen. Siehe 7.4.

### 7.4 Der Bildschirmkopf bricht um — die eine neue Layoutkonstante

**Neu am 2026-09-13.** Sie steht hier, weil sie eine Antwort auf dieselbe Frage ist wie 7.2 und
7.3: Was gibt zuerst nach, wenn der Platz nicht reicht?

**Der Befund.** `.screen__actions` stand auf `flex: none` und ist im Kanban **785,3 px** breit —
der Ansichtsumschalter trägt seinen Erklärsatz bei sich. Reichte die Zeile nicht, gab als Einziges
`.grow` nach, und zwar bis auf **null**. Gemessen (Kanban, `Breite von .grow / Höhe von
.screen__header / Überbreite von .app__main`):

| Fenster | vor T-334 | nach T-334 |
|---|---|---|
| 1440 | 340,7 / 129,8 / 0 | 340,7 / 129,8 / 0 |
| 1280 | 190,7 / 158,8 / 0 | 180,7 / 158,8 / 0 |
| 1200 | 110,7 / 242,8 / 0 | 902 / 129,8 / 0 |
| 1100 | 10,7 / **536,8** / 0 | 802 / 129,8 / 0 |
| 1087 | **0** / 536,8 / 0 | 789 / 129,8 / 0 |
| 1024 | **0** / 536,8 / **41** | 726 / 129,8 / 0 |
| 960 | **0** / 536,8 / **105** | 662 / 129,8 / 0 |
| 831 | **0** / 536,8 / 0 | 789 / 129,8 / 0 |

Zwei Fehler in einer Zeile, und beide sind älter als T-326: Bei 1087 px und darunter blieb vom
Titel „Kanban" das „K", ein Wort je Zeile über zwanzig Zeilen, und der Kopf war **536,8 px** hoch
— vier Fünftel eines 640 px hohen Fensters für eine Überschrift. Und ab 1024 px abwärts ragte die
Aktionsgruppe über den Rahmen; „Spalten verwalten" war an der **getragenen Mindestbreite** nicht zu
sehen, weil `.app__main` waagerecht abschneidet. Ein Knopf, der an 960 px nicht existiert, ist kein
Layoutmangel, sondern eine fehlende Funktion.

**Die Behebung, drei Zeilen, alle im Kopf und keine am Umschalter:**

```css
.screen__headline                    { flex-wrap: wrap; }
.screen__headline > .grow            { flex-basis: 10rem; }
.screen__headline > .screen__actions { flex-shrink: 1; min-width: 0; }
```

Die dritte Zeile ist die zweite Hälfte desselben Befundes: Steht die Aktionsgruppe nach dem Umbruch
allein auf ihrer Zeile und ist trotzdem breiter als diese, muß sie **in sich** umbrechen dürfen.
`flex: none` verbot ihr das, und das Ergebnis war kein Bildlauf, sondern ein Schnitt.

#### Braucht das ein Token? **Nein — örtliche Konstante, wie `--app-header-height`.**

Und der Maßstab dafür ist in diesem Bestand nicht Geschmack, sondern die Zahl der Leser:

| | Leser | Form |
|---|---|---|
| `--screen-inset` | **vier** (`.screen` oben, `.screen__header`/`.screen__bar` seitlich, `.screen__body` seitlich und unten) | benannter Eigenwert an `.app` |
| `--app-header-height` | drei (`.app__header`, `.brand`, die Gestaltung „Klassisch") | benannter Eigenwert an `.app` |
| `flex-basis: 10rem` | **einer** (`.screen__headline > .grow`) | Zahl an der Stelle, mit der Messung im Kommentar daneben |

Dazu zwei Gründe, die schwerer wiegen als die Zahl:

1. **Es ist kein Gestaltungswert, sondern eine Meßgröße.** Ein Token in `packages/ui-tokens`
   behauptet Wählbarkeit — jemand darf die Skala neu setzen. Diese Zahl ist nicht wählbar: Sie
   kodiert „die engste vorhandene Titelspalte ist 180,7 px breit" und wird falsch, sobald sich
   `.screen__actions` ändert. Ein Token würde die Messung hinter einem Namen verstecken; die Zahl
   an Ort und Stelle trägt sie im Kommentar mit.
2. **Abschnitt 0 dieses Papiers verbietet es ausdrücklich:** kein neues Abstandstoken in
   `packages/ui-tokens/tokens.css`. Die Zeile ändert keine Optik im getragenen Standardfenster; ein
   Token wäre die größere Änderung als der Umbruch selbst.

**Wann sie doch einen Namen bekommt:** sobald ein **zweiter** Leser entsteht — etwa wenn eine
zweite Kopfbauform dieselbe Untergrenze braucht. Dann `--screen-headline-min` an `.app`, dieselbe
Bauform wie `--screen-inset`, und nicht in `packages/ui-tokens`.

#### Ist ~1067 px die richtige Schwelle? **Nein — die Schwelle liegt bei ≈ 1259 px.**

Die Zahl 1067 steht in keiner der zwölf Meßzeilen. In der Tabelle stehen zwei andere, und sie
lassen sich aus ihr zurückrechnen:

- **≈ 1089 px** — dort fiel `.grow` **vor** T-334 auf null (gemessen 10,7 px bei 1100, 0 bei 1087).
  Das ist der alte **Zusammenbruch**, nicht der neue Umbruch. Vermutlich ist 1067 von dieser Zeile
  abgelesen.
- **≈ 1259 px** — dort bricht der Kopf **seit** T-334 um. Gerechnet aus drei gemessenen Werten:
  Umbrochen wird, wenn die Wunschbreiten die Zeile überschreiten, also bei
  `160 (flex-basis) + 16 (--space-4) + 785,3 (Aktionsgruppe) = 961,3 px` Inhaltsbreite. Bei
  1280 px Fenster sind es 982 px. Die Differenz ist **20,7 px** — und genau diese 20,7 px hat
  T-334 selbst als „Luft" gemessen und beziffert. `1280 − 20,7 = 1259,3`.

  **Nachgemessen und bestätigt (T-341 4, nachgetragen T-344).** Die Fensterbreite ist in
  Einzelschritten von 1290 auf 1240 abgefahren worden; die Kante liegt bei **1259 px**:

  | Fenster | Inhaltsbreite | `.grow` | `.screen__actions` | umgebrochen | Kopfhöhe |
  |---|---|---|---|---|---|
  | **1260** | 962 | 160,66 | 785,34 | **nein** | **187,8** |
  | **1259** | 961 | 961 | 785,34 | **ja** | **137,8** |

  Zwei Dinge stehen jetzt fest, die vorher Rechnung waren. Erstens die Kante selbst. Zweitens ein
  Zusatz, den die Kurve zeigt und den vorher niemand beziffert hat: **der umbrochene Kopf ist an
  seiner eigenen Kante 50 px niedriger** — 137,8 gegen 187,8 px. Direkt oberhalb der Kante ist
  `.grow` nur noch 160,66 px breit, und der Erklärsatz läuft über viele Zeilen; unterhalb bekommt
  er die volle Breite. Der Umbruch ist also nicht bloß „kein Rückschritt", sondern dort ein Gewinn
  an fester Höhe.

**Was das fachlich heißt — und wofür es gilt. Eingeschränkt am 2026-09-13 (T-344).** Hier stand:

> Über die ganze getragene Breite von 960 bis ≈ 1259 px steht die Aktionsgruppe unter dem Titel.

Das ist aus **einer** Ansicht gerechnet und liest sich als Aussage über alle elf (T-343 B-05). Die
Regel, die wirklich dahintersteht, spannt nicht an der Fensterbreite auf, sondern an der Breite der
Aktionsgruppe: Bei 960 px Fenster bleiben — `--sidebar-width: 15rem`, zweimal `--screen-inset`,
10 px Rinne — **662 px Kopfbreite**. Umgebrochen wird ab `160 + 16 + Aktionsgruppe > 662`, also ab
einer Aktionsgruppe von **mehr als ≈ 486 px**.

> **Der umbrochene Kopf ist die Regelgestalt genau der Ansichten, deren Aktionsgruppe ≈ 486 px
> überschreitet. Heute ist das eine von elf: das Kanban mit 785,3 px.** Jede andere Ansicht hat zwei
> bis drei Knöpfe und bleibt im ganzen getragenen Bereich einzeilig.

Der Quelltext sagt dasselbe (`app.css:959-963`): „…bleibt **jede** Ansicht bei 1280px und darüber
auf einer Zeile und zeichengleich — nachgemessen an allen elf Ansichten; das Kanban hat dabei
20,7px Luft, jede andere Ansicht mehr."

Die Einzelfreigabe des umbrochenen Kopfes ist erteilt (T-343 B-05): Die Lesereihenfolge bleibt,
kein Element wandert über ein anderes (AK-05), die Kopfhöhe ist in beiden Gestalten 129,8 px, und
gegenüber dem alten Zustand ist sie in jedem Punkt besser — 536,8 px Kopf, vom Titel „Kanban" blieb
das „K", und „Spalten verwalten" war an der getragenen Mindestbreite abgeschnitten. **Sie gilt für
das Kanban.** Ein Papier, das eine Gestaltänderung allgemeiner beschreibt, als sie ist, erteilt beim
nächsten Lesen eine Freigabe, die niemand gegeben hat. Der visual-qa prüft die umbrochene Gestalt
entsprechend am Kanban bei 1024 und 960, nicht nur an der Kante.

**Und die Kante ist eng.** Das Standardfenster der Hülle ist 1280 px breit und liegt 20,7 px über
der Schwelle — **1,6 %**. Ein Wort mehr in der Beschriftung des Umschalters, eine Gestaltung mit
größerer Schriftgröße im Kopf, ein weiterer Knopf: Jedes davon kippt das Standardfenster in den
umbrochenen Kopf. Bestätigt ist `10rem` deshalb als **beste verfügbare Zahl unter der Auflage
„bei 1280 zeichengleich"** — 11 rem hätte dieselben Zahlen ergeben, aber nur 4,7 px Abstand — und
nicht als stabile Grenze.

**Die eigentliche Zahl steht woanders, und das ist offene Frage 5:** Eine Aktionsgruppe von
785,3 px ist der Ausreißer, nicht die Titelspalte. Solange der Ansichtsumschalter des Kanban seinen
Erklärsatz **im Bildschirmkopf** trägt, behandelt jede Zeile hier ein Symptom. Der Kopf ist die
Steuerzeile einer Ansicht, kein Ort für erklärenden Fließtext (T-322: „Die Naht liegt unter dem,
was die Auswahl steuert"). Das ist eine Gestaltungsfrage und keine Layoutfrage, sie gehört nicht in
diesen Auftrag, und sie ist die einzige, deren Beantwortung die 10 rem wieder unnötig machen würde.

### 7.5 Wie ein fester Teil nachgibt, der nicht paßt — die Bereichsschiene

**Neu am 2026-09-13 (T-344).** Sie beantwortet OF-6 aus dem Flußpapier und die offene Frage 2 aus
T-341. E-115 hat entschieden, **daß** ein fester Teil nachgeben muß, der bei 960 × 640 nicht in sein
Budget paßt; **wie** er nachgibt, ist Gestaltung und gehört hierher.

**Der Fall, gemessen zweimal.** Die Bereichsschiene der Einstellungen ist 576,7 px hoch — acht
Einträge mit je zwei Zeilen, Beschriftung und Zusatz. Betroffen ist der Streifen **über 60 rem
Breite und unter etwa 700 px Fensterhöhe**:

| Fenster | Rahmen (`scroll/klient`) | Schiene | letzter Eintrag sichtbar |
|---|---|---|---|
| 1280 × 820 | 695 / 695 | 576,7 | ja |
| **1024 × 640** | **577 / 515** | **576,7** | **nein** („Arbeitsplatz") |
| 960 × 640 | 515 / 515 | **145** (Band) | ja |
| 1024 × 900 | 775 / 775 | 576,7 | ja |

T-334 hat denselben Fall als 86 px Überlauf von `div.settings-layout` gemessen, T-341 als 62 px am
Rahmen. Beide Zahlen beschreiben dasselbe, aus verschiedener Höhe gelesen — und **daß die Zahl
wandert, ist der Grund, aus dem eine Ausnahme nie an ihr festgemacht werden durfte** (9.6, B-02).
Bei 960 tritt der Fall nicht auf, weil dort die vorhandene Stufe `@media (max-width: 60rem)` aus der
Schiene ein Band macht. **Der Ausgleich existiert also — er hängt nur an der falschen Achse.**

**Entschieden: der Zusatz weicht, und zwar nach Höhe so, wie er nach Breite schon weicht.** Von den
drei in OF-6 genannten Wegen ist das der erste, und die beiden anderen sind aus benennbaren Gründen
nicht gewählt:

| Weg | Warum nicht |
|---|---|
| Schiene kippt bei knapper Höhe in die **Bandgestalt** | Die Gestalt existiert, aber sie **verschiebt** die Schiene von neben den Bereich über ihn. Eine Höhenänderung, die die Leserichtung dreht, ist die größere Änderung als eine, die eine Zeile ausblendet — und sie trifft AK-05. |
| Schiene bekommt einen **eigenen Laufbereich** | Erlaubt (R-2: nebeneinander), aber teuer: ein zusätzlicher Tabulatorhalt, ein zusätzlicher Name und eine zweite Bildlaufleiste für **acht im Quelltext festgelegte** Einträge. Ein Laufbereich für eine Liste, die nie wächst, ist Aufwand ohne Gewinn. |
| **Der Zusatz weicht** (gewählt) | Keine neue Gestalt, keine neue Reihenfolge, kein neuer Halt, kein neuer Text. Genau die Gestaltung, die unter 60 rem Breite schon ausgeliefert wird, an der zweiten Achse angeschlossen. |

**Das ist keine Streichung nach E-087.** Der Zusatz fällt nicht aus dem Bestand, er ist in einer
Fenstergröße nicht sichtbar — dieselbe Bedingung, unter der er heute schon verschwindet, und mit
derselben Begründung, die im Quelltext steht: er darf **nirgends die einzige Fassung sein**. Die
Beschriftung bleibt in jeder Größe. A-25.7 ist damit nicht berührt, E-087 nicht ausgelöst.

**Die Schwelle wird gerechnet, nicht gerundet** — die Lehre aus T-341 3.3, wo eine runde 40 rem
zwei Pixel auf der falschen Seite der getragenen Untergrenze lag:

- Die Rahmenhöhe ist gemessen `Fensterhöhe − 125` (515 bei 640; 52 px Kopfleiste, 24 px Anschlag,
  Bildschirmkopf und Zwischenraum).
- Die Schiene **mit** Zusatz braucht 576,7 px, paßt also erst ab `576,7 + 125 ≈ 702 px` Fensterhöhe.
- Die Regel greift deshalb bei **`max-height: 44rem`** (704 px) — die nächste Stufe über der Kante,
  mit 2,3 px Luft nach oben und der vollen Wirkung nach unten.

**Eine Zahl fehlt und ist vor dem Bau zu messen:** die Höhe der Schiene **ohne** Zusatz. Sie muß bei
704 px Fenster in 579 px Rahmen passen, mit Luft für mindestens eine Zeile. Nach der Bauform (acht
Einträge, eine Zeile statt zwei) liegt sie bei rund 430 px; liegt sie gemessen über 579 px, greift
die Regel eine Stufe höher. **Das ist eine Messung und keine Wahl** — wer sie überspringt, setzt
eine zweite runde Zahl an dieselbe Klippe.

**Warum eine Fensterhöhenabfrage hier zulässig ist, obwohl R-3 am Inhaltsbereich mißt.** Sie ist
keine Zusage, sondern eine Vorsorge: AK-23 beziffert das Budget ausdrücklich **ohne** Hüllenmeldung
und ohne Fassungshinweis, und genau diesen Zustand trifft eine Fensterabfrage. Steht eine Meldung,
greift die Regel zu spät — dann ist der Inhaltsbereich kleiner als das Fenster, die Schiene paßt
trotzdem nicht, und es greift der Rückfall: Der Rahmen läuft, nichts wird abgeschnitten, nichts
unerreichbar (R-3a Punkt 2). Die Abfrage kann also **zu wenig** tun, nie zu viel. Eine
Behälterabfrage wäre genauer und ist trotzdem ausgeschlossen: Sie bräuchte `container-type: size`
am Rahmen, und Größenbehalt macht den Kasten zum umschließenden Block für feste Positionierung —
8.3 verbietet das an genau diesen vier Kästen.

## 8. Verträglichkeit mit dem Bestand

### 8.1 `viewport-layout.css` — sagt das Muster dasselbe?

**Zum Teil, und die Überschneidung ist genau benennbar.** Gegenüberstellung Zeile für Zeile:

| Heute in `viewport-layout.css` | Im Muster | Folge |
|---|---|---|
| Z. 13–34, 39–48 — Formulardialoge und die Randabsenkung des `.scrim` | nicht berührt | **Bleibt.** Ein Dialog hängt in `.scrim`, sein umschließender Block ist das Fenster, nicht `.app__main`. Er ist der Präzedenzfall, nicht ein Anwendungsfall. |
| Z. 54–56 — `.app__main:has(> .screen > .board) { overflow-y: hidden }` | `.app__main` ist immer Rahmen | **Geht im Muster auf; kann entfallen.** |
| Z. 58–61 — `.app__main > .screen:has(> .board) { height: 100%; min-height: 0 }` | Stufe 5 und 6 der Kette, für jede Ansicht | **Geht im Muster auf; kann entfallen.** |
| Z. 63–67 — `flex: none` für `.screen__header`, `.board__bar`, `.list-more` | `.screen > * { flex: none }` | **Geht im Muster auf; kann entfallen.** Anmerkung: `.list-more` steht dort als **letztes** Kind und damit als fester Fuß. Ob der Nachladefuß fester Fuß bleibt oder in den Laufbereich wandert, ist eine Frage an T-322. |
| Z. 69–75 — `.board` als Laufbereich (`flex`, Null, `align-items: stretch`, `overflow-y: hidden`) | `.screen__body--frame > *` liefert `flex` und Null | **Halb.** `align-items: stretch` (es überschreibt `.board { align-items: start }`) und `overflow-y: hidden` sind boardeigen und bleiben. |
| Z. 77–94 — `.kcolumn`, `.kcolumn__head`, `.kcolumn__rule`, `.kcolumn__body` | das ist `.runarea` eine Ebene tiefer | **Bleibt**, kann später auf `.runarea` umgestellt werden. Keine Eile: die Regeln sind zeichengleich mit dem Muster. |
| Z. 96–103 — `.board-order` | nichts | **Fremd in dieser Datei.** Eine Knopfgruppe der Spaltenverwaltung, kein Viewport-Layout. |

**Vorschlag an den Orchestrator** — drei Punkte, keiner davon von mir geändert:

1. Die vier Regeln aus Z. 54–67 entfallen, wenn der Mechanismus steht. Sie sind der Sonderfall,
   den er ersetzt, und ein `:has()`-Sonderfall neben einer allgemeinen Regel ist die schlechtere
   von zwei Wahrheiten. **In demselben Auftrag** streichen, in dem der Mechanismus gebaut wird —
   nicht später; sonst tragen zwei Regelmengen dieselbe Fläche.
2. Der Mechanismus gehört **in `viewport-layout.css`** und nicht in `app.css`. Zwei Gründe: Die
   Datei sagt in ihrem Kopf genau diesen Zweck, und `designsystem.tsx` importiert `app.css`, aber
   **nicht** `viewport-layout.css` (`main.tsx:8` gegen `designsystem.tsx:4–8`). Die Musterseite
   bleibt damit von der Höhenkette unberührt, ohne dass man daran denken muss. Nur die Änderungen
   an `.app__main` und `--screen-inset` gehören nach `app.css`, weil beide dort stehen — auch die
   Medienstufe bei 52rem.
3. `.board-order` nach `components.css`, bei Gelegenheit und in einem eigenen Auftrag.

### 8.2 Die Portale (T-059)

Aufgeklappte Listen, Tag-Vervollständigung und Menüs hängen seit T-059 über ein Portal am
Dokumentkörper, auf `--z-popover` (320). Zwei Folgen:

- **Gut:** Sie werden vom Laufbereich nicht beschnitten. Der Grund, aus dem sie ausgelagert
  wurden, gilt eine Ebene tiefer genauso.
- **Zu prüfen, nicht zu behaupten:** Die Position eines Portalinhalts hängt am Anker, und der
  Anker liegt jetzt in einem **anderen** Bildlaufkasten als bisher. Ob die Nachführung die
  Bildlaufereignisse dieses Kastens hört, ist eine Eigenschaft der Bibliothek und in diesem
  Papier nicht gemessen. **Prüffall, verbindlich:** Auswahlfeld in einem Laufbereich öffnen, den
  Laufbereich rollen — die Liste folgt dem Feld oder schließt sich, sie bleibt nicht stehen.
  Gehört in denselben Auftrag wie der Umbau, nicht in die Nachlese. Aufgenommen als Risiko R-323-1.

### 8.3 `.scrim` und `.toast-layer`

Beide `position: fixed`, umschließender Block ist das Fenster. Der Mechanismus berührt sie nicht —
**solange niemand** `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change` oder
`contain` an `.app`, `.app__main`, `.screen` oder `.screen__body` schreibt. Jede dieser
Eigenschaften macht den Kasten zum umschließenden Block für feste Positionierung, und dann
zentriert sich der Dialog im Inhaltsbereich statt im Fenster und der Meldungsstapel klebt an
dessen Ecke.

Die Versuchung ist konkret und hat einen Namen: `contain: paint` oder
`will-change: scroll-position` an einem Laufbereich, „für die Bildlaufleistung". **Verboten**, und
zwar an allen vier Kästen. Wer Leistung braucht, misst zuerst.

Nebenbei: `.app` trägt in `glass`, `liquid-glass`, `velvet` und `rainbow` ein
`background-image` (`theme-palettes.css:449`, `:474`). Deshalb bekommen `.screen`,
`.screen__header` und `.screen__body` **keinen** Hintergrund — sie bleiben durchsichtig, wie
`.app__main` und `.screen` es heute sind. Eine deckende Fläche über die ganze Arbeitsfläche würde
den Verlauf in vier Gestaltungen zudecken, und das wäre neue Optik.

### 8.4 Der umschließende Block wandert mit dem Bildlauf — **berichtigt am 2026-09-13 (E-113)**

**Was hier bis zum 2026-09-13 stand, und es war falsch:**

> ### 8.4 `position: relative` bleibt, wo es ist
>
> `.app__main` behält `position: relative`, und der Kommentar dort behält seinen Grund: Ein absolut
> positionierter Nachfahre ohne positionierten Vorfahren bezieht sich auf den Anfangsblock, liegt
> außerhalb jedes `overflow: hidden` auf dem Weg und trägt zum Bildlaufbereich des **Dokuments**
> bei. Gemessen war das ein `span.visually-hidden`, das die Fensterbildlaufleiste erzeugte
> (Todo-Liste `scrollHeight` 2876 bei 820 Fensterhöhe).
>
> **`.screen__body` bekommt deshalb ausdrücklich kein `position: relative`.** Sonst gäbe es zwei
> umschließende Blöcke für absolute Nachfahren, und `.visually-hidden` landete je nach Ansicht in
> einem anderen. Wer im Inhalt etwas absolut positionieren muss, das mitlaufen soll, setzt
> `position: relative` an den **eigenen** Umschlag — nicht an den Laufbereich.

Der erste Absatz ist wahr und bleibt. Der zweite ist widerlegt, und der Irrtum darin ist der
lehrreiche Teil dieses Papiers.

**Woran er hing.** Aus T-057 Ursache 2 hat das Papier die Regel gezogen: *es soll bei genau einem
umschließenden Block bleiben.* Das war nie das Ziel. Das Ziel war: **kein absoluter Nachfahre soll
aus dem Kasten fallen, in dem er steht.** Solange `.app__main` selbst der Laufbereich war, fielen
beide Sätze zusammen — ein Block, und es war der laufende. Sobald der Bildlauf eine Ebene tiefer
zieht, trennen sie sich, und das Papier hat den falschen von beiden mitgenommen. Es ist **dieselbe
Fehlerklasse wie T-057, eine Ebene höher** — nicht ihr Gegenteil.

**Was ohne die Zeile geschieht.** Ein `span.visually-hidden` **im** Laufbereich bezieht sich
weiterhin auf `.app__main`. Es wird an seiner statischen Stelle plaziert — am Ende der Liste —,
läuft mit dem Bildlauf des Laufbereichs **nicht mit** und trägt statt dessen zum Bildlaufbereich
des **Rahmens** bei. Ergebnis: zwei senkrechte Bildlaufleisten nebeneinander, genau das Symptom,
das dieser Umbau beheben sollte.

**Gemessen von T-326** (Chromium, 1280 × 820, erfundener Vorrat, `.app__main.scrollHeight` gegen
`clientHeight` von 768), **ohne** die Zeile:

| Ansicht | Rahmen | Verstöße | Die Umschläge |
|---|---|---|---|
| Todos | 4242/768 | 128 | `.todo-row__check`, `.summary-strip__item`, `.chip` |
| Buchungen | 3564/768 | 140 | `.table__secondary`, Zellen |
| Zeiterfassung | 5723/768 | 76 | `.badge` |
| Todo-Detail | 5338/768 | 81 | Zellen, `.chip` |
| Protokoll | 3573/768 | 55 | `.auditrow__actor`, `.auditrow__transition` |
| Tags | 1224/768 | 4 | `.chip` |
| Dashboard | 905/768 | 4 | `.badge` |

**Mit** der Zeile: alle elf Ansichten 768/768, null Verstöße. 488 solcher Spannen über sieben
Ansichten, und jede einzelne ist dieselbe Hilfsklasse, die in T-057 die Fensterbildlaufleiste
erzeugt hat.

**Die Regel, die daraus wird — sie gilt über diesen Fall hinaus:**

> **Ein Bildlaufkasten muß der umschließende Block seiner eigenen absoluten Nachfahren sein.
> Wandert der Bildlauf, wandert `position: relative` mit ihm.**

Also: `position: relative` an `.screen__body`, an `.runarea` und an `.kcolumn__body` — an **jedem**
Kasten, der laufen kann. Im Board steht heute kein einziger absoluter Nachfahre (gemessen, null
Fundstellen), und genau deshalb steht die Zeile auch dort: Der erste, der nächstes Jahr dazukommt,
soll nicht die Bildlaufleiste des Rahmens zurückbringen. `.app__main` behält seine eigene Zeile für
alles, was **nicht** im Laufbereich liegt — Kopf, Leisten, Ladeersatz.

**Die Folge, die das alte 8.4 vermeiden wollte, tritt ein und ist harmlos.** Es gibt jetzt zwei
umschließende Blöcke. `position: relative` ohne `z-index` bildet **keinen** Stapelzusammenhang und
ist **kein** umschließender Block für feste Positionierung; `.scrim` und `.toast-layer` bleiben am
Fenster, nachgemessen an zentrierten Dialogen. Der Preis wäre sonst gewesen, jeden Umschlag eines
`.visually-hidden` einzeln positioniert zu machen — sieben Klassen heute, und die achte bricht die
Zusage still.

**Was von der alten Auflage bleibt:** Wer im Inhalt etwas absolut positionieren will, das an einem
bestimmten Element hängt, setzt `position: relative` an den **eigenen** Umschlag. Das ist jetzt
eine Frage der Genauigkeit und nicht mehr eine der Sicherheit — der Laufbereich fängt den Fall
ohnehin ab.

### 8.5 Sprungmarke und Tastatur — der eine Punkt, der Handarbeit braucht

Heute trägt `.app__main` `id="inhalt"` und `tabIndex={-1}` (`App.tsx:366`), und die Sprungmarke
springt dorthin (`App.tsx:298`). Weil `.app__main` heute der Läufer ist, rollt danach
Bild-ab/Leertaste den Inhalt.

Morgen läuft das Kind. Bliebe die Marke am Rahmen, hätte der Benutzer nach dem Sprung den Fokus
auf einem Kasten, der nichts zu rollen hat: **Bild-ab täte nichts.** Das ist eine Verschlechterung
gegenüber heute und nicht hinnehmbar (SC 2.1.1).

**Also wandert die Marke mit dem Lauf:** `id="inhalt"` an `.screen__body`, und
`.app__main:focus-visible { outline-offset: calc(var(--focus-ring-offset) * -2) }`
(`app.css:310`) wandert mit — der negative Versatz ist dort, weil ein Ring **außerhalb** des
Kastens an der Rahmenkante vom `overflow: hidden` der Hülle abgeschnitten würde, und dieser Grund
gilt am Laufbereich genauso. `<main class="app__main">` bleibt als Landmarke stehen; die
Sprungmarke landet darin statt darauf, was SC 2.4.1 genügt.

**Berichtigt am 2026-09-13:** Hier stand `tabIndex={-1}`. Gebaut ist `tabIndex={0}` plus
`role="region"` und ein `aria-label` aus einem **vorhandenen** Text. Der Grund steht in T-322 R-4
(AK-14, AK-15) und nicht in diesem Papier: `{-1}` bedient die Sprungmarke, aber es legt den
Laufbereich nicht in die Tabulatorreihenfolge — und eine Ansicht mit **zwei** Laufbereichen hat
dann genau einen erreichbaren. Gemessen am gebauten Stand: Fokusring `outline-offset` −4 px,
Bild-ab rollt 353 px.

#### Zweite Berichtigung am 2026-09-13 (T-344): die Marke sitzt am falschen Kasten

**Was hier stand und bis heute galt, war eine halbe Regel.** Sie sagte, die Marke wandert **mit dem
Lauf** — und wurde dann an einem Kasten festgemacht, der den Namen `.screen__body` trägt, aber nicht
läuft:

> **Also wandert die Marke mit dem Lauf:** `id="inhalt"` an `.screen__body` …

`ScreenBody.tsx:159-168` setzt `id`, `tabIndex={0}` und `role="region"` in `ScreenFrame` über
`runAreaSurface(label, true)` — also auf **`.screen__body--frame`**. Dieser Kasten läuft im
getragenen Fenster ausdrücklich **nicht**; das ist sein ganzer Zweck (3.1, 3.3, und
`viewport-layout.css:484-486`: „Er **rahmt** und läuft im getragenen Fensterbereich nicht").

**Die Folge, gemessen** (T-341 6, Einstellungen, `.screen__body--frame` `scroll/klient`):

| Fenster | Rahmen | läuft er? |
|---|---|---|
| 1280 × 820 | 695 / 695 | nein |
| 1024 × 900 | 775 / 775 | nein |
| 960 × 640 | 515 / 515 | nein |
| 1024 × 640 | 577 / 515 | **ja — und genau das ist der E-115-Fehler aus 7.5** |

Nach „Zum Inhalt springen" liegt der Fokus in den drei Rahmenansichten also auf einem Kasten, der
nichts zu rollen hat, und der nächste Bildlaufvorfahr (`.app__main`) hat ebenfalls nichts zu rollen:
**Bild-ab tut nichts.** Vor T-326 lief `.app__main`, und es tat etwas. Das ist eine **Regression**,
und zwar genau die, die dieser Abschnitt verhindern wollte — eine Ebene tiefer (T-343 B-07). Dazu
zwei weitere Messungen des Prüfers: In den Einstellungen liegen zwischen dem Rahmenhalt und dem
wirklichen Laufbereich die **acht** Verweise der Bereichsschiene — **neun** Tabulatorschritte statt
des einen aus AK-14; und die Zeiterfassung hat **drei** Halte statt der zwei aus R-i.

**Der Irrtum, benannt:** Das Papier hat „läuft" an einem **Bezeichner** festgemacht statt an einer
Eigenschaft. `.screen__body--frame` heißt so, weil er die Regelmenge von `.screen__body` erbt — die
Größenrechnung, die Rinne, den umschließenden Block. Er erbt sie **bis auf die eine**, die ihn zum
Ziel der Marke machen würde. Dieselbe Fehlerklasse wie in 8.4: aus einer richtigen Regel den
falschen von zwei zusammenfallenden Sätzen mitnehmen.

**Die Entscheidung, und sie steht seit heute auch in der Spezifikation** — A-25.5: *„Die Sprungmarke
‚Zum Inhalt springen' führt auf eine Fläche, die auch tatsächlich läuft."*

> **Die Marke zeigt auf den *Inhaltshalt* einer Ansicht: den innersten Kasten, der den Inhalt trägt
> und in mindestens einer getragenen Fensterform eine **eigene Laufstrecke** hat. Nicht auf den
> Kasten, der so heißt.**

| Ansicht | Inhaltshalt — `id="inhalt"` | Laufstrecke |
|---|---|---|
| die acht Regelansichten | `.screen__body` | senkrecht — **unverändert** |
| Einstellungen | die `RunArea` des Bereichs (`.settings-panel`) | senkrecht; der Rahmen daneben trägt die feste Schiene |
| Zeiterfassung | **Laufbereich A** („Todo wählen") | senkrecht; B folgt in Dokumentreihenfolge |
| Kanban | **`.board`** | **waagerecht** — die Laufstrecke der Ansicht; senkrecht läuft die Spalte |

**Und wenn der Inhaltshalt in einem Zustand gar nicht da ist — nachgetragen T-354 (T-351 B-08).**
Die Tabelle oben ordnet je **Ansicht** zu, nicht je **Zustand**. In Kanban und Zeiterfassung entsteht
der Inhaltshalt erst mit den Daten: `.board` und Laufbereich A liegen innerhalb der Ladehülle und
existieren in Z0 (Laden), Z3 (leer) und Z4 (Fehler) nicht. Die Regel dafür, gleichlautend in
T-322 R-4:

> **Existiert der Inhaltshalt in einem Zustand nicht, trägt die Marke der Laufbereich, der den
> Zustand zeigt.** Er ist dort der einzige — eine Ansicht hat im Lade- und Fehlerzustand genau einen
> (T-322 R-5).

Das ist zugleich die **gebaute** Wahrheit und kostet keine Zeile: `ScreenBody` trägt `anchor = true`
als Vorgabe und `ScreenFrame` setzt die Marke nie, also landet sie in diesen Zuständen auf
`<ScreenBody label="Kanban">` beziehungsweise `<ScreenBody label="Zeiterfassung">`
(`BoardScreen.tsx:410`, `:421`; `TimeScreen.tsx:160`). Die Regel steht hier, damit der nächste Bau
sie **liest** statt sie noch einmal zu wählen. **Gemessen wird sie nicht** — der Meßsatz fährt jede
Ansicht erst nach dem Laden (9.1, 9.7 letzter Absatz); sie ist eine Bauregel und keine Zusicherung.

Der teurere Weg bleibt offen und ist nicht gewählt: den Laufbereich über die Zustände hinweg als
**dasselbe** Element halten, wie die acht Regelansichten es tun. Er wäre besser — wer während des
Ladens springt, verliert den Fokus an `<body>`, sobald die Daten ankommen —, kostet aber einen Umbau
der Ladehülle in vier Ansichten und ändert Bedienwege in einem Auftrag, der keine ändern darf
(A-25.7). **Vorschlag an den Orchestrator, nicht Entscheidung dieses Papiers.**

**Drei Punkte, an denen diese Zuordnung geprüft ist und nicht geraten:**

1. **Der Ansatz „nächster laufender Vorfahr" trägt den Rest.** Fällt die Zeiterfassung unter 68 rem
   untereinander, hört Laufbereich A auf zu laufen (`viewport-layout.css:628-633`:
   `overflow-y: visible`), und der Rahmen wird der Läufer. Bild-ab auf A rollt dann **den Rahmen** —
   das tut der Browser von selbst, und deshalb braucht die Marke keine zweite Kennung und keine
   Medienstufe. Eine Kennung, die mit einer Breitenschwelle wandern müßte, wäre eine zweite Wahrheit
   über die 68 rem.

   **Ergänzt T-354 (T-351 B-20):** Dieser Punkt und die Zusicherung **A9 (c)** widersprachen einander
   — A9 verlangte die Bildlaufstelle „genau dieses Kastens", und das ist an vier der sieben Größen
   aus 9.2 gerade **nicht** der Fall. A9 (a) und (c) tragen den Fall seit heute selbst; die
   Vorschrift, welcher Zweig wo gilt und warum der zweite abschließend aufgezählt ist, steht in
   **9.7**. Der Satz, der dabei nicht verlorengehen darf: **Nach der Sprungmarke muß `Bild ab`
   meßbar etwas bewegen** — was sich bewegt, darf vom Fenster abhängen, daß sich etwas bewegt,
   nicht.
2. **Der eine Fall, in dem die alte Bauform etwas konnte, ist der Fehlerfall.** T-341 hält fest, daß
   die Marke am Rahmen genau bei 1024 × 640 etwas bewirkt — dort läuft er um 62 px. Das ist der
   E-115-Verstoß aus 7.5 und der Zustand, den 7.5 behebt. **Einen Tastaturweg auf einen Fehlerzustand
   zu stellen, heißt, ihn zu brauchen.**
3. **Im Kanban ist die Laufstrecke der Ansicht die waagerechte, und das wird nicht verschwiegen.**
   Nach der Marke bewegen Pfeil links/rechts und `Pos1`/`Ende` das Board; Bild-ab tut dort nichts,
   weil senkrecht die **Spalte** läuft und nicht das Board (`.board` trägt `overflow-y: hidden`,
   5.2). Das ist keine Lücke, sondern die Aufteilung der Achsen aus Abschnitt 4 — und es ist mehr,
   als der heutige Stand kann, wo keine der beiden Achsen nach der Marke bedienbar ist.

#### Wer einen Tabulatorhalt bekommt — und wer keinen

Die Menge wird **an der Anforderung aufgespannt und nicht am Selektor** (E-099 Punkt 3): Ein
Laufbereich ist eine Fläche, die **Abschnitt 4 des Flußpapiers** als solche nennt. Daraus:

| Kasten | Halt, Rolle, Name, Fokusring | Grund |
|---|---|---|
| `.screen__body` (ohne `--frame`) | **ja** — wie gebaut | Laufbereich der Ansicht |
| `.runarea` | **ja** — wie gebaut | Laufbereich der Ansicht |
| **`.board`** | **ja — neu.** Name „Kanban" (die Überschrift der Ansicht, kein neuer Text) | Waagerechte Laufstrecke der Ansicht; ohne Halt ist sie mit der Tastatur nur über den Fokus der Karten zu bewegen |
| `.screen__body--frame` in **Einstellungen** und **Kanban** | **nein — gestrichen.** Kein `tabIndex`, keine Rolle, kein Name, keine Marke | Er läuft in keiner getragenen Form. Ein Gerüst ist kein Bereich, und ein Halt ohne Laufstrecke ist eine Station, die nichts tut — in den Einstellungen mit acht Verweisen dahinter |
| `.screen__body--frame--split` (**Zeiterfassung**) | **ja, behält alles außer der Marke** | Er **ist** unterhalb von 68 rem der einzige senkrechte Läufer der Ansicht und trägt dort den Namen „Zeiterfassung" (Flußpapier 4.5) |
| `.kcolumn__body`, die `.table-wrap` der Exportgruppen | **nein** | Sie sind Laufstrecken eines **Bausteins**, nicht der Ansicht. Für sie gilt die schwächere Zusage — siehe unten |

**Der Preis, benannt:** Oberhalb von 68 rem ist der Halt am `--split`-Rahmen ein Halt ohne
Laufstrecke. Er bleibt trotzdem, weil derselbe Kasten unterhalb von 68 rem der einzige Läufer ist
und dann einen Namen tragen muß. Die Alternative wäre ein JavaScript, das `tabIndex` an einer
Breitenschwelle umlegt — eine zweite Wahrheit über die 68 rem und genau die Bauform, die R-3 aus
gutem Grund ablehnt. **Bilanz gegen heute:** Einstellungen von neun Schritten auf **null**, Kanban
von einem toten Halt auf einen, der das Board bewegt, Zeiterfassung von drei Halten (einer tot in
jeder Größe) auf drei, von denen oberhalb von 68 rem einer ruht und unterhalb keiner.

**Die schwächere Zusage für die Laufstrecke eines Bausteins** (sie beantwortet T-343 B-06): Eine
waagerechte Laufstrecke, die zu einem Baustein **innerhalb** eines Laufbereichs gehört, bekommt
keinen eigenen Halt. Sie ist über den Fokus ihrer Kinder erreichbar, und in keiner Achse, in der
Inhalt liegt, ist der Lauf abgeschaltet (T-322 5.3). **Dazu eine Auflage, die gemessen und nicht
geglaubt wird:** In einer solchen Fläche muß in der Spalte, die am weitesten **rechts** liegt, ein
fokussierbares Element stehen — sonst holt kein Tabulatorschritt sie ins Bild, und die Fläche
bekommt doch einen Halt. Für die beiden Tabellen der Exportgruppen ist das zu messen
(`ExportGroups.tsx:168`, `:243`; die fokussierbaren Elemente liegen dort heute **links** —
Aufklappknopf und Auswahlkästchen).

**Die eine benannte Ausnahme bleibt** der Lade- und Fehlerzustand der Todo-Detailansicht: `tabIndex
={-1}`, keine Rolle, kein Name. Sie ist Ziel der Marke und läuft, aber sie behauptet keinen Namen,
weil die Überschrift das Todo **ist** und im Ladezustand noch nicht feststeht. **Entschieden gegen
den naheliegenden Ausweg** (T-343 B-12): Der vorhandene Text „Todo wird geladen"
(`TodoDetailScreen.tsx:245`) wäre als Name greifbar und ist trotzdem falsch — dieselbe Fläche trägt
im **Fehlerzustand** die Meldung samt „Erneut versuchen", und ein Gebiet, das dort „Todo wird
geladen" heißt, sagt etwas Unwahres an. Ein Name, der in einem von zwei Zuständen stimmt, ist
schlechter als keiner; ein erfundener ist nach A-25.7 ohnehin verboten. **AK-15 bekommt deshalb
denselben Satz**, statt daß zwei Papiere zwei Antworten auf dieselbe Fläche geben.

**Der Wortlautabgleich nach E-087 — und was er nicht gefunden hat.** Das Ergebnis stand hier als
gesichert. Es war es nicht, und daraus ist **E-114** geworden:

> **Wer eine Kennung verlegt, sucht nicht ihren Wortlaut, sondern ihre Benutzung.**

Gesucht wurde nach `#inhalt` (`git grep` plus ein Lauf über `apps/*/src`, `packages/*/src`,
`tests/`, Bauergebnisse ausgenommen), und gefunden wurde **eine** Fundstelle in `tests/**` mit dem
Zusatz, sie bleibe gültig. Gemessen sind es **elf Dateien**, und **sieben** davon werden durch die
Verlegung rot — einschließlich genau der einen, die als gültig eingeschätzt worden war. Sie
benutzen `#inhalt` nicht als Text, sondern als **Geltungsbereich** für Knöpfe, die im Kopf der
Todo-Detailansicht stehen („Timer starten", „Timer stoppen", „Zeit von Hand") und damit künftig
**außerhalb** des Laufbereichs liegen. Ein Geltungsbereich nennt seine Kennung genau einmal und
trägt jeden Prüffall darin mit; sechs der sieben hätte auch ein fehlerfreier Wortlautabgleich nicht
gefunden. Behebung in jedem Fall dieselbe und klein: `page.locator('.screen')` statt
`page.locator('#inhalt')`, wo der Geltungsbereich „die Ansicht" meint.

- `tests/e2e/attachment-legacy-todo-regression.spec.ts:51` — die Fundstelle, die hier als
  „**Keine Anpassung nötig**" stand. **Am laufenden Bild widerlegt:** Die beiden Knöpfe stehen im
  Kopf, nicht im Laufbereich.
- `apps/web/src/app/App.tsx:298` — `href="#inhalt"`, die Sprungmarke selbst. Bleibt wörtlich.
- `apps/web/src/showcase/Showcase.tsx:96` — dieselbe Sprungmarke der **Musterseite**, mit eigenem
  Ziel in ihrem eigenen Gerüst. Nicht berührt.
- `apps/web/src/features/export/TemplatesScreen.tsx:886` — ein Kommentar, der `#inhalt` als
  Nicht-Route ausnimmt. Der Code prüft auf `#/` und ist von der Verlegung unberührt.
- Der sichtbare Text „Zum Inhalt springen" ändert sich **nicht**. Es fällt kein Oberflächentext.

### 8.6 `.boot`, `EmptyState`, `InlineMessage` — die drei Kinder, die keine `.screen` sind

`.app__main` hat heute vier mögliche Elementkinder: eine `.screen`, den Ladeersatz
(`<div class="boot">`, `App.tsx:368`), den Leerzustand einer unbekannten Adresse (`EmptyState`,
`App.tsx:408`) und die Meldung eines gescheiterten Nachladens (`InlineMessage`, `App.tsx:425`).
Drei von vier sind keine `.screen`, und alle drei brechen im Muster:

- `.boot` trägt `min-height: 100dvh` (`app.css:30`). Als gestrecktes Rasterkind eines Rahmens von
  etwa 76% der Fensterhöhe wäre es höher als der Rahmen, und der Ladekreis stünde in seiner Mitte
  — also **unterhalb der sichtbaren Fläche.** Heute fällt das nicht auf, weil `.app__main` läuft.
- `EmptyState` und `InlineMessage` hätten ohne den Innenabstand von `.app__main` keinen mehr und
  lägen bündig an der Rahmenkante.

**Auflage, im selben Auftrag zu erledigen:** `.app__main` hat immer genau ein Kind, und es trägt
immer `.screen`. Also:

- Der Ladeersatz bekommt `.boot--inline` mit `min-block-size: 0` — eine Zeile, kein neues
  Aussehen: der Kasten ist als Rasterkind ohnehin rahmenhoch, `.boot` zentriert weiterhin. Die
  freistehenden Startbilder außerhalb von `.app` behalten `min-height: 100dvh` und dürfen
  weiterhin das Dokument rollen (`base.css:44` nennt sie ausdrücklich).
- `UnknownScreen` und die Nachlademeldung kommen in
  `<section class="screen"><div class="screen__body">…</div></section>`.

Das ist zugleich eine Zusicherung, die der Meßsatz prüfen kann (A4).

### 8.7 Musterseite und Startbilder

`designsystem.html` hängt nicht in dieser Hülle, benutzt weder `.app` noch `.screen`
(`showcase.css` kennt beide nicht) und importiert `viewport-layout.css` nicht. Sie rollt weiter
das Dokument, und `base.css` verzichtet genau deswegen auf `overflow: hidden` an `body` — der Satz
im Kommentar dort bleibt wahr. Dasselbe für die Startbilder.

**Deckung nachgetragen T-354:** Bis zum 2026-09-13 stand dieser Abschnitt im Widerspruch zur
Spezifikation — A-25.2 galt nach ihrem Wortlaut ohne Ausnahme, und dieses Papier ließ drei Flächen
das Dokument rollen (T-351 B-16). Seit **A-25.8** sind sie dort benannt: Startbilder, Musterseite und
der Outlook-Aufgabenbereich. Der Satz oben ist damit gedeckt und nicht mehr geduldet. Die offene
Frage 4 — ob der Aufgabenbereich eingeschlossen werden **soll** — bleibt davon unberührt; sie gehört
dem Auftraggeber (E-112).

### 8.8 Fünf Deklarationen, die erst bei einer T-322-Entscheidung anzufassen sind

`.detail`, `.time-layout`, `.settings-layout`, `.tpl-layout`, `.tags-split` und `.dash-columns`
stehen auf `align-items: start`. Solange die Ansicht **einen** Laufbereich hat, ist das richtig und
bleibt. Spricht T-322 einer dieser Ansichten zwei Laufspalten zu, muss die betroffene Zeile auf
`stretch` — sonst sind die Spalten inhaltshoch und die `.runarea` darin hat keine Höhe zu teilen.
**Kein Vorgriff hier:** die Liste steht, damit sie niemand suchen muss.

## 9. Der Meßsatz

„Keine Ansicht macht das Dokument höher oder breiter als das Fenster" ist messbar. Gebaut wird der
Lauf vom e2e-tester; hier steht die Vorschrift.

**Ort und Name.** Der Satz braucht Layout, also einen echten Browser: eine Playwright-Datei,
`tests/e2e/viewport-fit.spec.ts`, im Vorgabelauf von `pnpm test:e2e`. Kein `proof:`-Skript — die
zweiundzwanzig lesen Dateien, dieser hier muss rechnen lassen.

### 9.1 Was gemessen wird

Je Ansicht und je Fenstergröße, nachdem die Ansicht fertig geladen ist (kein Ladekreis mehr im
Bild — sonst misst der Lauf den Ersatz und nicht die Ansicht):

| | Zusicherung | Messung |
|---|---|---|
| **A1** | *Das Dokument wächst nicht.* | `document.scrollingElement`: `scrollHeight ≤ clientHeight + 1` **und** `scrollWidth ≤ clientWidth + 1`. Das ist der Satz selbst. Er gilt an **jeder** Fenstergröße, auch unter der getragenen. |
| **A2** | *Der Rahmen hat nichts zu laufen — also hat der Laufbereich den Überschuss genommen.* | `.app__main`: `scrollHeight ≤ clientHeight + 1`. **Geltungsbereich zeichengleich wie AK-02, berichtigt T-344:** nur bei **mindestens 960 × 640, ohne Hüllenmeldung und ohne Fassungshinweis** (7.1). Hier stand „Gilt nur im getragenen Bereich (7.1)" — und weil 7.1 zwei getragene Bereiche führte, hat `viewport-fit.spec.ts:34-45` daraus „gilt bei allen fünf Größen" gelesen. **Die Breitenhälfte wandert in A2a und gilt ohne Untergrenze.** |
| **A2a** | *Waagerecht wird nichts abgeschnitten.* | `.app__main`: `scrollWidth ≤ clientWidth + 1`, auf **jeder** Ansicht und in **jeder** Fenstergröße bis 320 × 256 (AK-02a). `.app__main` trägt `overflow-x: hidden`; eine Überbreite ist dort kein Lauf, sondern ein **Schnitt** (R-d). Zugleich der Nachweis, dass die waagerechte Kette durchlässig ist (Abschnitt 4). |
| **A3** | *Es gibt genau einen Laufbereich, und er ist da.* | `.app__main` hat genau **ein** Elementkind; es trägt `.screen`; darin gibt es genau **ein** `> .screen__body`. Null ist rot: eine Ansicht ohne Laufbereich geht gut, bis die Daten wachsen. |
| **A4** | *Der Kopf bleibt, wo er ist.* | Auf Ansichten, deren Vorrat den Laufbereich überschreitet: `.screen__header` merken, Laufbereich ans Ende rollen, `getBoundingClientRect().top` unverändert (± 1). |
| **A5** | *Der Laufbereich läuft wirklich.* | Auf denselben Ansichten: `screen__body.scrollHeight > clientHeight`. Ohne diese Messung ist ein grünes A1/A2 nichts wert — es wäre auch grün, wenn nichts überläuft. |
| **A6** | *Der waagerechte Lauf erreicht seinen Kasten.* | Auf der Buchungsübersicht bei 960px Breite: `.table-wrap.scrollWidth > clientWidth` (die Tabelle **kann** laufen) bei gleichzeitig grünem A2 (der Rahmen ist trotzdem nicht breiter). Das Paar unterscheidet „läuft" von „abgeschnitten". **Ergänzt T-362:** Sobald die Todo-Liste eine Tabelle ist, gilt dieselbe Messung dort — und dazu ihre Umkehrung bei 1280px, die es hier noch nicht gibt (A12 in `todo-tabelle.md` 9.3): Im Standardfenster darf sie **nicht** laufen. Ein `scrollWidth > clientWidth` allein ist auch grün, wenn die Tabelle zu breit gebaut wurde. |
| **A7** | *Die Rinne verhindert den Sprung.* | Breite von `.screen__body.clientWidth` bei kurzer und bei langer Liste derselben Ansicht: gleich. Das ist Ursache 2, an der Stelle gemessen, an der sie jetzt wohnt. **Dazu seit T-334:** `.screen__header.getBoundingClientRect().right` gleich `.screen__body.getBoundingClientRect().right` (± 1) auf **jeder** Ansicht, auch auf den drei Rahmenansichten. Das ist die Kante aus 3.4 und 5.1, und sie ist die Zahl, die 44 von 44 Fällen auf 0 gebracht hat. |
| **A8** | *Kein Kind eines Laufbereichs schneidet **seinen eigenen** Inhalt ab.* **Kurzform geschärft T-362** — sie lautete „Im Laufbereich wird nichts abgeschnitten" und ließ offen, wogegen gemessen wird; der Auftrag zu T-362 hat daraus „kein Kind darf über den Laufbereich hinausragen" gelesen, und das ist das Gegenteil des Bildlaufs. | Je direktem Kind eines Laufbereichs: `kind.scrollHeight ≤ kind.clientHeight + 1` — **das Kind gegen sich selbst, nie gegen den Laufbereich.** Ein Kind **darf** höher sein als er; genau das ist der Lauf. **Die Menge, die Ausnahme und die zwei Untergrenzen stehen in 9.6** — ohne sie ist diese Zusicherung falschrot oder blind, und beides ist gemessen. |
| **A9** | *Die Sprungmarke landet auf einer Fläche, die läuft — und `Bild ab` bewegt danach meßbar etwas.* | **Neu, T-344; (a) und (c) berichtigt T-354.** Aus A-25.5 und AK-14. Drei Teile, je Ansicht: **(a)** der Kasten mit `id="inhalt"` hat mit dem Prüfvorrat in mindestens einer Achse eine **eigene** Laufstrecke — gemessen **über die getragenen Größen hinweg** und nicht in jeder einzelnen; **(b)** zwischen der Sprungmarke und ihm liegt **kein** weiterer Tabulatorhalt — null Schritte; **(c)** nach dem Sprung bewegt `Bild ab` (im Kanban `Pfeil rechts`) die Bildlaufstelle **dieses Kastens** — und dort, wo er in dieser Fenstergröße keine eigene Laufstrecke hat, die seines **nächsten laufenden Vorfahren**. **Null Bewegung in beiden Zweigen ist rot**, und der zweite Zweig ist **abschließend aufgezählt** (Zeiterfassung unter 68 rem, sonst nirgends). Einzelheiten und die Zahlen in **9.7**. Ohne (c) mißt der Lauf einen Bezeichner statt eines Verhaltens — das war der Fehler, der B-07 möglich gemacht hat. |

**Rot heißt:** eine dieser Zusicherungen ist auf einem Paar (Ansicht × Fenstergröße) verletzt,
oder der Lauf konnte eine Ansicht der aufgespannten Menge **nicht erreichen** (9.3). Die Meldung
nennt Ansicht, Fenstergröße, Zusicherung und die beiden Zahlen. Toleranz genau 1px, und der Grund
steht dazu: Geräteverhältnisse ungleich 1 erzeugen Teilpixel; mehr als 1px Toleranz verdeckt
echte Fehler.

**A10 bis A15 stehen in `todo-tabelle.md` 9.3** (T-362) und gehören in dieselbe Datei: der klebende
Kopf steht wirklich still, er wandert waagerecht mit seiner Spalte, die Tabelle läuft im
Standardfenster nicht und darunter schon, was neben der Tabelle liegt liegt über ihrer ganzen
Breite, die angeheftete Fläche bleibt nicht stehen, und sie liegt über dem klebenden Kopf. Sie
messen die Bauform aus 6.3 und nicht die Ansicht, in der sie zuerst vorkommt — wer sie auf eine
dritte Tabellenansicht zieht, zieht sie mit.

### 9.2 An welchen Fenstergrößen

| Größe | Warum genau diese |
|---|---|
| 1280 × 820 | Das Standardfenster der Hülle (`tauri.conf.json`). |
| 960 × 640 | Die Untergrenze der Hülle. Der Boden der Zusage. |
| 831 × 640 | Ein Pixel unter 52rem: das schmale Layout, bei dem die Navigation als Band **über** dem Kopf liegt und eine fünfte Rasterzeile entsteht. Die Stufe, an der die Kette am ehesten reißt. |
| 1280 × 480 | Breit und **niedrig**. Hier fressen die festen Köpfe den Anteil, der im hohen Fenster nicht auffällt. |
| 640 × 480 | Der Boden des Browserbetriebs (7.1). |
| **1200 × 820** | **Neu, T-339.** Zwei Zustände treffen sich nur hier: der Bildschirmkopf ist **umgebrochen** (7.4, Schwelle ≈ 1259), die Zeiterfassung steht aber noch **zweispaltig** (68 rem = 1088). Keine der fünf alten Größen trifft diese Kombination — 1280 hat den einzeiligen Kopf, alles darunter die einspaltige Zeiterfassung. |
| **1024 × 640** | **Neu, T-339 — Begründung umgekehrt am 2026-09-13 (T-344).** Hier stand: *„Die Größe, an der der Rückfall des Rahmens gemessen ist … und genau das ist die benannte Ausnahme von A8."* Sie bleibt in der Liste, und zwar mit dem **gegenteiligen** Vorzeichen: Es ist die Größe, an der der **einzige heute bekannte E-115-Verstoß** sichtbar wird — die Bereichsschiene der Einstellungen, gemessen 86 px Überlauf (T-334) beziehungsweise 62 px am Rahmen (T-341). Sie ist geprüft, weil dort etwas **rot** sein muß, bis 7.5 gebaut ist, nicht weil dort eine Ausnahme lebt. |

Sieben Größen. Bei 320 × 256 wird **nur A1 und A2a** geprüft — die Zusage dort ist „nichts
abgeschnitten", nicht „fensterfest" (7.1, 7.2).

### 9.3 Woran die Menge der geprüften Ansichten aufgespannt wird

Hausregel E-099 Punkt 3: Wer eine Abwesenheit zusichert, spannt seine Menge an der **Anforderung**
auf, nicht an den Stellen, die er kennt. Die Anforderung sagt „alle Seiten". Eine Liste von elf
Adressen in der Prüfdatei wäre die Menge der Stellen, die der Schreiber kannte — und die zwölfte
Ansicht käme lautlos daran vorbei.

Aufgespannt wird deshalb an **`RouteName` in `apps/web/src/app/router.ts`**. Das ist die Menge
„Ansicht der Anwendung", geführt an einer Stelle, und `SEGMENT` ist vollständig gegen sie
getypt — eine neue Ansicht ohne Eintrag dort gibt es nicht.

Konkret, und das ist ein Übergabepunkt an den frontend-dev:

1. `router.ts` exportiert `ROUTE_NAMES: readonly RouteName[]`, vollständig gegen `RouteName`
   getypt, sodass ein fehlender Eintrag ein Typfehler ist.
2. Der Lauf liest `ROUTE_NAMES`, bildet jede Route über das vorhandene `href()` auf eine Adresse
   ab und prüft jede.
3. Zwei Routen brauchen eine Kennung (`todo`, `templates`). Der Vorrat des Laufs stellt je eine
   bereit. **Eine Route, für die der Lauf keine erreichbare Adresse hat, ist rot — nicht
   übersprungen.** Das ist der Punkt der ganzen Konstruktion: die zwölfte Ansicht macht den Lauf
   rot, bis jemand sie abdeckt.
4. Dazu die drei Zustände, die **keine** Route sind und trotzdem Kinder von `.app__main`
   (8.6): Ladeersatz, unbekannte Adresse, gescheitertes Nachladen. Sie werden namentlich geprüft,
   weil sie in keiner Routenmenge stehen — und weil zwei von ihnen ohne den Umbau brechen.

### 9.4 Der Vorrat entscheidet, ob der Lauf etwas wert ist

Ein Lauf über leere Ansichten ist grün und sagt nichts, weil nichts überläuft. Der Vorrat muss
daher in **beiden** Achsen über den Rahmen hinausgehen:

- Buchungsübersicht: genug Buchungen für mehr als eine Fensterhöhe, dazu lange Leistungstexte und
  eine gesetzte Call-Nummer, damit die Tabelle bei 960px Breite über die Breite geht (A6).
- Board: mehr Spalten, als bei 960px nebeneinander passen, und in einer Spalte mehr Karten als in
  eine Fensterhöhe.
- Tag-Verwaltung: ein Baum, der tiefer und länger ist als der Rahmen.
- Todo-Liste: mehr Todos als eine Fensterhöhe, mindestens einer mit einem sehr langen Titel ohne
  Wortgrenzen (die `.foreign-name`-Fehlerklasse trifft die Breite).

Erfundene Daten, `tests/fixtures/`, keine echten Call-Nummern.

**Ergänzt am 2026-09-13:** Dieser Abschnitt stand als *Anleitung*. Er ist jetzt zusätzlich
**zugesichert** — die zweite Untergrenze aus 9.6 macht den Lauf rot, wenn in einer Ansicht kein
Laufbereich wirklich läuft. Damit kann ein geschrumpfter Vorrat den Meßsatz nicht mehr still
entwerten; er meldet sich. Eine Anleitung, deren Einhaltung niemand mißt, ist in diesem Bestand
dreimal grün gewesen (9.6).

### 9.5 Ein zweiter, statischer Lauf — als Vorschlag

Der Meßsatz oben prüft das Ergebnis. Ein kleiner `proof:`-Lauf könnte zusätzlich die **Zusage**
prüfen, so wie `proof:clamp` es für `.foreign-name` tut: dass `.app__main` in keiner Datei unter
`apps/web/src/styles/**` wieder einen Innenabstand oder eine Rinne bekommt, dass jeder Laufbereich
`position: relative` **trägt** (8.4 — berichtigt, hier stand das Gegenteil) und kein
`padding-block-start`, dass `.screen__header` und `.screen__bar` ihre Rinne behalten (5.1), und
dass an `.app`, `.app__main`, `.screen`, `.screen__body` kein `transform`, `filter`,
`backdrop-filter`, `will-change` oder `contain` steht (8.3). Billig, schnell, und er fängt die
Rückfälle, die ein Bild nicht zeigt. **Vorschlag an den Orchestrator, nicht Teil dieser
Vorschrift.**

### 9.6 A8 im einzelnen — und warum zwei Untergrenzen dazugehören

**Neu am 2026-09-13, nach T-334.** A1 bis A7 sind zu grob. Sieben abgeschnittene Kinder, zwischen
27 und 1030 px, standen bei **grünem** A1 bis A7 in der Anwendung — gemessen, nicht vermutet:

```
Dashboard        section.card              168 px über clientHeight
Export           section.card              285 px   (darin der Base64-Satz)
Export           div.table-wrap          1 030 px
Export           section.card              355 px
Exportprotokoll  section.card              178 px
Einstellungen    section.card × 2           27 px
Einstellungen    section.card               61 px
```

**Und sie waren nicht bloß ungefangen, sie waren unfangbar.** A1 fragt das Dokument, A2 den Rahmen.
Ein Kind, das seinen Inhalt abschneidet, macht diese beiden Zahlen **besser**. Ein Meßsatz, dessen
Zahl sich beim Auftreten des Fehlers verbessert, ist nicht lückenhaft — er zeigt in die falsche
Richtung. Das ist der Grund für A8 und nicht der Einzelfall.

#### Die Vorschrift

Je direktem Kind: `kind.scrollHeight <= kind.clientHeight + 1` (ein Pixel Rundung, derselbe Grund
wie bei A1). Drei Einschränkungen, jede gemessen:

1. **Die Menge der Laufbereiche** ist `.screen__body:not(.screen__body--frame)`, `.runarea` und
   `.kcolumn__body` — unterhalb von 68 rem zusätzlich `.screen__body--split`, das dort selbst zum
   Laufbereich wird (5.1, und die Medienstufe steht in `viewport-layout.css`).
2. **`.screen__body--frame` gehört nicht dazu — aber nur unterhalb von 960 × 640. Berichtigt am
   2026-09-13 (T-344).** Hier stand:

   > **`.screen__body--frame` gehört nicht dazu.** Ein Rahmen läuft im getragenen Bereich nicht, und
   > im Rückfall (7.2, T-322 R-3) **soll** sein Kind höher sein als er — das ist der Rückfall, nicht
   > sein Gegenteil. Gemessen bei 1024 × 640: `div.settings-layout` ragt **86 px** über den Rahmen,
   > und **das ist richtig**. Ein Meßsatz ohne diese Ausnahme wäre dort rot und binnen einer Welle
   > gelockert — und eine gelockerte Zusicherung ist schlechter als eine, die von Anfang an ihre
   > Ausnahme benennt.

   **Der erste Satz stimmt, der Fall darunter nicht.** 1024 × 640 ist ein **getragenes** Fenster,
   und dort steht keine Meldung; nach **E-115** und T-322 R-3a ist der Überlauf deshalb ein
   **Fehler** und nicht der Rückfall. Nach dem alten Wortlaut gebaut wäre der **einzige heute
   bekannte E-115-Verstoß** auf Dauer grün, und zwar an genau der Größe, an der er auftritt
   (T-343 B-02). Das ist der Fehlermodus, vor dem dieser Absatz selbst warnt, nur von der anderen
   Seite: Die Ausnahme stand **vor** der Behebung geschrieben und hätte sie zugedeckt. Eine Ausnahme,
   die einen offenen Befund verdeckt, ist keine Ausnahme, sondern seine Beerdigung.

   **Woran der Irrtum hing — und das ist der Teil, der über den Fall hinausgeht.** Die Ausnahme war
   aus einer **Messung** abgeleitet, die niemand als Fehler gelesen hatte: T-334 hat die 86 px
   gemessen und als Rückfall eingeordnet; T-339 hat die Zahl übernommen, die Ausnahme darauf gebaut
   und in 9.2 eigens eine Fenstergröße dazugestellt, damit sie nicht toter Text bleibt. Keiner der
   beiden Schritte war nachlässig. Der Fehler liegt eine Ebene höher: **Eine Messung trägt eine Zahl
   und keine Einordnung.** Ob 86 px richtig oder falsch sind, entscheidet die Regel, und die Regel
   war am selben Tag als E-115 entschieden — in dem anderen Papier, das dieses hier nicht lesen
   konnte. Zum Beweis, daß die Zahl allein nichts trägt: T-341 hat denselben Zustand als **62 px**
   gemessen. Beide Zahlen sind richtig; sie messen den Überlauf aus verschiedener Höhe. **Wer eine
   Ausnahme an einer Zahl festmacht, macht sie an der Meßstelle fest.**

   **Die Vorschrift ab hier:** A8 nimmt `.screen__body--frame` **unterhalb von 960 × 640** aus —
   dort ist der laufende Rahmen das erwartete Verhalten (7.1, AK-24). Im getragenen Bereich wird er
   **mitgemessen**; bei 1024 × 640 bleibt der Fall **rot** und trägt den Namen des Befundes
   (Bereichsschiene der Einstellungen, behoben nach 7.5), bis 7.5 gebaut ist. Grün wird er durch die
   Behebung, nicht durch die Ausnahme.
3. **Nur Kinder im Fluß.** `getComputedStyle(kind).position` ist weder `fixed` noch `absolute`.
   `.scrim` eines Dialogs und `span.visually-hidden` sind keine Flex-Elemente; sie an dieser Stelle
   mitzumessen hieße, die Regel an Kästen zu prüfen, für die sie nie galt.

#### Die zwei Untergrenzen — und warum sie nicht verzichtbar sind

```
mindestens ein Laufbereich je Ansicht wurde gefunden
mindestens einer davon läuft wirklich   (scrollHeight > clientHeight)
```

Ohne sie mißt A8 **nichts**, und zwar auf eine Weise, die grün aussieht: Findet der Selektor keinen
Kasten, ist die Menge der Verletzer leer, und die leere Menge erfüllt jede Allaussage. Ein
umbenannter Bezeichner, ein Ladezustand, der noch steht, eine Ansicht, deren Vorrat nicht reicht —
jedes davon macht den Lauf grün, und keines davon macht ihn wahr.

**Das ist in diesem Bestand kein hypothetischer Fehler. Er ist dreimal gemacht worden:**

| Fall | Wie die leere oder falsche Menge grün war |
|---|---|
| `proof:addin` Abschnitt 18 (E-099, E-100) | Zählte Zeilen in `todo_attachment` nach einem Aufruf der **Anlegetür**. Es maß die Tür, die zu war, nicht die, die aufging. |
| Der Aufräumlauf für herrenlose Dateien (E-111) | „Null Waisen" war von „null gelesene Dateien" nicht unterscheidbar, bis der Rückgabewert `{ read, owned, removed, refused }` beides trennte. |
| AK-01 in T-326 | 88 von 88 Paaren grün — und die sieben abgeschnittenen Kinder oben standen die ganze Zeit daneben, weil das Abschneiden die gemessene Zahl verbessert. |

Die Bauform der Abhilfe ist dieselbe wie in E-094 Punkt 3 und E-111: **Der Lauf sagt nicht nur, daß
er nichts gefunden hat, sondern auch, wie viel er angesehen hat.** T-334 hat denselben Riegel im
selben Zug an `proof:surface` eingezogen — findet der Lauf **kein** Portal mehr, ist er rot. Das ist
inzwischen die Hausform und keine Erfindung dieses Papiers.

**Die zweite Untergrenze gehört zu A8 selbst und nicht zu A3 oder A5.** A3 zählt `.screen__body`,
A5 mißt „der Laufbereich läuft" auf den Ansichten mit großem Vorrat — beide spannen ihre Menge über
**andere** Selektoren auf als A8 (das `.runarea` und `.kcolumn__body` mitnimmt und `--frame`
ausnimmt). Eine Untergrenze, die über eine andere Menge zählt als die Zusicherung, die sie sichern
soll, vergleicht zwei verschiedene Mengen — derselbe Fehler, der aus dem Aufräumlauf in E-111
beinahe einen Löschlauf gemacht hätte (`listEmailFiles()` liefert Namen, `target` trägt Pfade).
**Jede Zusicherung zählt ihre eigene Menge.**

#### Die Gegenprobe

`flex-shrink: 1` an `.screen__body > .card` eingesetzt **muß** A8 rot machen. Das ist der Zustand,
den die Anwendung nach dem ersten Bau hatte; ein Meßsatz, der ihn nicht zurückweist, prüft die
falsche Sache. Nach der Behebung ist die Menge der Verletzer über alle elf Ansichten und vier
Fenstergrößen leer — **44 von 44**. **Nachgetragen T-344:** Die vier Größen von damals liegen alle
im getragenen Bereich; die Ausnahme aus Punkt 2 kam in diesen 44 Fällen gar nicht vor. Sie ist erst
bei den beiden neuen Größen aus 9.2 zu prüfen, und dort ist ein Fall **rot** und kein Beleg.

### 9.7 A9 im einzelnen — die zwei Zweige von (c), und warum der zweite aufgezählt ist

**Neu am 2026-09-13 (T-354), nach T-351 B-20.** A9 stand seit T-344 in der Fassung „die
Bildlaufstelle **genau dieses Kastens**". Der Satz ist in zehn Ansichten richtig und in einer falsch,
und die eine steht in diesem Papier selbst — 8.5 Punkt 1:

> Fällt die Zeiterfassung unter 68 rem untereinander, hört Laufbereich A auf zu laufen
> (`viewport-layout.css:628-633`: `overflow-y: visible`), und der Rahmen wird der Läufer. Bild-ab auf
> A rollt dann **den Rahmen** — das tut der Browser von selbst.

68 rem sind 1088 px. Von den sieben Größen aus 9.2 liegen **vier darunter**: 960 × 640 und
1024 × 640 im getragenen Bereich, 831 × 640 und 640 × 480 im Rückfall. Wer A9 wörtlich baut, bekommt
die Zeiterfassung dort rot — für das Verhalten, das dieses Papier für richtig erklärt. Was dann
folgt, steht in 9.6 und in R-k des Flußpapiers: **Ein falsches Rot wird gelockert, nicht
berichtigt.** Die Lockerung träfe dann alle elf Ansichten, nicht die eine.

#### Die Vorschrift

**(a) mißt die Identität — über die Größen hinweg, nicht in jeder.** Der Kasten mit `id="inhalt"`
muß in **mindestens einer getragenen Fensterform** eine eigene Laufstrecke haben. Das ist die
Bestimmung des Inhaltshalts aus 8.5, Wort für Wort, und **kein Kasten kann sie durch einen Vorfahren
erfüllen** — hier bleibt der Satz hart. Für die Zeiterfassung ist sie an 1280 × 820 und 1200 × 820
erfüllt und an 960 × 640 und 1024 × 640 nicht; das genügt. **Eine Laufstrecke, die nur in einem als
Fehler benannten Zustand entsteht, zählt nicht:** Der Rahmen der Einstellungen läuft bei 1024 × 640
um 62 px, und das ist der E-115-Verstoß aus 7.5, nicht seine Erfüllung (8.5 Punkt 2).

**(c) mißt die Wirkung — je Größe, in zwei Zweigen.** Welcher Zweig gilt, wird **gemessen und nicht
angenommen**:

```
eigene Laufstrecke  :=  scrollHeight > clientHeight + 1  und  overflow-y != 'visible'
                        (im Kanban: scrollWidth > clientWidth + 1  und  overflow-x != 'visible')

hat sie        →  gemessen wird die Bildlaufstelle des Kastens selbst
hat sie nicht  →  gemessen wird die seines nächsten laufenden Vorfahren
beide Zweige   →  Bewegung > 0, sonst rot
```

**(b) braucht keine Ausnahme**, und das ist kein Versehen: Der laufende Vorfahr ist ein **Vorfahr**,
kein Tabulatorziel. Die Taste steigt auf, sie wandert nicht — zwischen der Marke und dem Kasten, der
rollt, liegt auch im Rückfallzweig kein Halt. Gemessen wird bei (b) weiterhin, **worauf die Marke
führt**, nicht wie oft jemand `Tab` drückt (AK-14, letzter Absatz).

**Der zweite Zweig ist abschließend aufgezählt**, und das ist die Entscheidung dieser Berichtigung:
Er gilt für die **Zeiterfassung unterhalb von 68 rem** und für nichts sonst — an 960 × 640,
1024 × 640, 831 × 640 und 640 × 480. Der laufende Vorfahr ist dort der `--split`-Rahmen, der nach
8.5 Halt, Rolle und Namen behält, weil er unterhalb von 68 rem der einzige senkrechte Läufer ist.
**Nimmt ein anderes Paar aus Ansicht und Fenstergröße den zweiten Zweig, ist der Lauf rot** — auch
dann, wenn sich dort etwas bewegt hat. Das ist dieselbe Bauform wie die zwei Untergrenzen in 9.6:
Eine Ausnahme, die niemand zählt, ist ein Freibrief.

Der Grund in einem Satz: Ein offenes „oder irgendein laufender Vorfahr" macht die Marke am Rahmen
der Einstellungen bei 1024 × 640 **grün**, weil der Rahmen dort läuft. Das ist der Zustand, gegen den
A9 geschrieben wurde (T-343 B-07), und zugleich der Fehlerzustand, den 7.5 behebt. **Einen
Tastaturweg auf einen Fehlerzustand zu stellen, heißt, ihn zu brauchen** (8.5 Punkt 2) — und eine
Zusicherung, die ihn deckt, begräbt ihn.

#### Die Zahl, an der A9 hängt

T-348, bei 1024 × 640, Fokus auf `#inhalt`, Bildlaufstand vorher → nachher:

| Fall | Taste | vorher → nachher | bewegt |
|---|---|---|---|
| Einstellungen, Marke am **Rahmen** (Stand vor T-348) | `Bild ab` | 0 → 0 | **nein** |
| Einstellungen, Marke am **Bereich** (`.settings-panel`) | `Bild ab` | 0 → **392** | ja |
| Kanban, Marke am **Rahmen** (Stand vor T-348) | `Pfeil rechts` | 0 → 0 | **nein** |
| Kanban, Marke am **Board** | `Pfeil rechts` | 0 → **36** | ja |

Beide Nullen sind der gemessene Befund B-07; die beiden Zahlen daneben sind seine Behebung. **A9
mißt die rechte Spalte dieser Tabelle.**

#### Was A9 nicht mißt — und das steht hier, damit es niemand für gemessen hält

Der Meßsatz fährt jede Ansicht erst, **wenn sie fertig geladen ist** (9.1, erster Satz). Die Zustände
Z0 (Laden), Z3 (leer) und Z4 (Fehler) sieht er nicht. Die Regel, welcher Kasten dort die Marke trägt,
steht in 8.5 und ist eine **Bauregel, keine Zusicherung**. Wer sie zusichern will, braucht einen
eigenen Lauf über die drei Zustände; solange es ihn nicht gibt, sagt dieses Papier über sie nichts
im Präsens. Dasselbe gilt für A9 (b) in diesen Zuständen.

## 10. Zustände im fensterfesten Rahmen

Der Mechanismus ändert keinen Zustand, aber er gibt jedem einen Ort. Was sich ändert, steht hier;
alles andere bleibt, wie es ist.

| Zustand | Ort und Regel |
|---|---|
| **Leer** | Im Laufbereich, nicht daneben. Der Leerzustand füllt ihn und zentriert darin — er springt nicht an die obere Kante und lässt darunter eine leere Fläche. Der Kopf bleibt stehen, samt seiner Primäraktion: der Ausweg aus einem Leerzustand ist im Kopf immer sichtbar. **Bauform berichtigt (T-326):** `margin-block: auto` an den drei Bauformen des Bildschirmleerzustands (`> .empty`, `> .table-shell`, `> .board-setup`) statt `justify-content: center` am Laufbereich. Der Grund ist gemessen: In der Export-Ansicht steht die Karte „Vorlage und Rundung" **über** dem Leerzustand, und ein zentrierter Stapel hätte sie mitgenommen — das wäre eine Änderung der Reihenfolge (T-322 AK-05). `auto`-Ränder nehmen den freien Platz über und unter **dem Leerzustand**; bleibt keiner, sind sie null und nichts verschiebt sich. Nur **direkte** Kinder: Ein Kartenleerzustand liegt in `.card__body` und wird nicht gedehnt. **Welcher Leerzustand welcher ist, sagt seit T-344 die Stelle im Baum und nicht das Gefühl — siehe unten.** |
| **Lädt** | Der Ladeersatz füllt den Laufbereich und ist **genauso hoch wie er** — er darf ihn nicht höher machen (8.6). Skelettzeilen tragen `--row-height`, damit der Wechsel von Skelett auf Daten keinen Sprung erzeugt. |
| **Fehler** | Eine Meldung, die die **ganze Ansicht** betrifft, gehört als `.screen__bar` in den festen Teil — sie darf nicht wegrollen, während der Benutzer im Inhalt sucht, was sie meint. Eine Meldung zu **einer Zeile** bleibt bei der Zeile im Laufbereich. Das ist der einzige Zustand, für den das Muster eine Einordnung vorgibt, und er ist es wert. |
| **Hover, Aktiv, Fokus** | Unverändert. Eine Anmerkung: Ein Fokusring am **Rand** des Laufbereichs wird von dessen `overflow` abgeschnitten. Weil der Ring 2px außerhalb mit 2px Breite liegt, betrifft das ein Element, das bündig an der Kante klebt; der Innenabstand von 24px hält ihn davon weg. Am Laufbereich selbst gilt der negative Versatz aus 8.5. |
| **Bestätigung** | Unberührt. Dialoge hängen in `.scrim`, ihr Rahmen ist das Fenster, und `viewport-layout.css` hat sie längst fensterfest (8.1). |

### Bildschirmleerzustand oder Kartenleerzustand — das Kennzeichen ist die Stelle im Baum

**Neu am 2026-09-13 (T-344), aus T-343 B-11.** T-322 R-5 führt „Noch kein Tag" (S-08) als
**Bildschirm**leerzustand, „der den ganzen laufenden Inhalt ersetzt", und AK-07 verlangt für diese
Klasse die Mitte des Laufbereichs. Gebaut ist die Zentrierung über `margin-block: auto` an
**direkten** Kindern des Laufbereichs (`> .empty`, `> .table-shell`, `> .board-setup`). In
`TagsScreen` liegt unter dem Laufbereich immer `.tags-layout` mit **zwei** Karten; der Leerzustand
entsteht innerhalb von `TagAdministration`, also in einer Karte. `margin-block: auto` greift dort
nicht — eine der beiden Zusagen ist falsch.

**Falsch ist die Einordnung in R-5, nicht AK-07**, und der Grund ist nicht Geschmack:

> **Ein Leerzustand ist ein Bildschirmleerzustand genau dann, wenn er **direktes Kind** des
> Laufbereichs ist — also dann, wenn neben ihm nichts anderes mehr läuft.** Läuft eine zweite Karte
> weiter, ersetzt er nicht den Inhalt, sondern ist einer.

Das ist dieselbe Frage wie bei `margin-block: auto` gegen `justify-content: center` (Zustand „Leer"
oben): In der Export-Ansicht steht die Karte „Vorlage und Rundung" über dem Leerzustand, und deshalb
zentriert dort **nur** der Leerzustand und nicht der Stapel. In S-08 steht die Karte mit den Regeln
**unter** ihm und läuft weiter — er ist die leere Hälfte einer Ansicht und nicht ihre leere Fläche.
Ihn auf Laufbereichshöhe zu dehnen hieße, die zweite Karte nach unten zu schieben: eine Änderung der
Gestaltung, und die ist verboten (AK-05, A-25.7).

**Zwei Zeilen wandern damit in R-5 von der ersten Liste in die zweite**, und beide sind am Quelltext
geprüft:

| Leerzustand | war | ist | Grund |
|---|---|---|---|
| „Noch kein Tag" (S-08) | Bildschirmleerzustand | **Kartenleerzustand** | liegt in `TagAdministration`; darunter läuft `PoolAdministration` weiter |
| „Noch kein Vorgang protokolliert" (S-07 Protokoll) | Bildschirmleerzustand | **Kartenleerzustand** | darüber laufen Legendenkarte, drei Kennzahlkacheln und der Umfangssatz weiter |

Die übrigen vier bleiben, wo sie sind, und sie sind genau die drei gebauten Selektoren: „Nichts zu
exportieren" und „Noch kein Todo" / „Kein Todo passt zu diesen Filtern" (`> .empty`), „Noch keine
Zeitbuchung" (`> .table-shell`), `BoardEmptyState` (`> .board-setup`). **Daß die Selektorenmenge und
die berichtigte Liste sich decken, ist die Gegenprobe** — sie stimmten schon überein, nur das Papier
nicht mit ihnen. Am Bau ändert sich dadurch nichts; AK-07 wird wahr, statt für zwei Ansichten
unerfüllbar zu sein.

**Bewegung: keine.** Der Mechanismus führt keine Animation und keinen Übergang ein, und
ausdrücklich **kein `scroll-behavior: smooth`** — die einzige Bewegung in einem Laufbereich ist
die, die der Benutzer selbst macht, und die braucht keine Beigabe. (`base.css:243` setzt
`scroll-behavior: auto` unter Bewegungsvorbehalt ohnehin durch; eine Zeile, die eine andere Zeile
nur unter einer Bedingung überlebt, ist keine Gestaltung.)

## 11. Übergabe an den frontend-dev — **erledigt in T-326 und T-334**

**Stand 2026-09-13:** Diese Liste ist abgearbeitet. Sie bleibt als Aufbauplan stehen, weil sie die
**Reihenfolge** begründet, in der eine solche Umstellung sicher ist; wer das Muster auf eine zwölfte
Ansicht zieht, liest sie von hier. Was beim Bauen **anders** entschieden wurde, steht jeweils an
der Stelle, an der es entschieden wurde — die Übersicht dazu ist die Berichtigungstabelle im Kopf
dieses Papiers.

Vier Punkte, an denen die Liste unten heute nicht mehr wörtlich gilt: `tabIndex` (8.5),
`scrollbar-gutter` am Rahmen (5.1), `position: relative` am Laufbereich (8.4) und die zweite
Sammelregel für `flex: none` (3.2).

### Übergabe T-344 — was aus diesem Abgleich zu bauen ist

Sechs Punkte, jeder mit seinem Abschnitt und seinem Empfänger. **Keiner davon ist in diesem Auftrag
gebaut worden**; dieses Papier ändert keine Zeile unter `apps/**`.

| # | Was | Wo | An wen |
|---|---|---|---|
| 1 | Die Sprungmarke wandert vom Rahmen auf den **Inhaltshalt**: `ScreenFrame` gibt `id`, `tabIndex`, `role` und `aria-label` ab — Einstellungen an die `RunArea` des Bereichs, Zeiterfassung an Laufbereich A, Kanban an `.board`. `runAreaSurface(label, true)` in `ScreenBody.tsx:159-168` verliert damit sein `true` und in zwei von drei Fällen auch seinen `label` | 8.5 | frontend-dev |
| 2 | `.board` bekommt Halt, `role="region"`, `aria-label="Kanban"` und den Fokusring des Laufbereichs. **Der `--split`-Rahmen behält alles außer der Marke** | 8.5 | frontend-dev |
| 3 | Die Bereichsschiene verliert ihren **Zusatz** unter `max-height: 44rem` — dieselbe Gestaltung wie unter `max-width: 60rem`, zweite Achse. **Vorher zu messen:** die Höhe der Schiene ohne Zusatz gegen 579 px | 7.5 | frontend-dev |
| 4 | `min-block-size: 0` bleibt an `.screen__body--frame > *` und darf **nicht** an `.screen > .screen__body` — der Kommentar in `viewport-layout.css:413-419` ist die Begründung und bleibt, wie er ist | 3.2 | frontend-dev, code-reviewer |
| 5 | **A2** bekommt den Geltungsbereich aus AK-02, **A2a** gilt ohne Untergrenze, **A8** nimmt den Rahmen nur unterhalb von 960 × 640 aus, **A9** ist neu, und die zwei Größen aus 9.2 kommen dazu. Der Kopfkommentar von `viewport-fit.spec.ts:34-45` zitiert die widerlegte Fassung von 7.1 und ist mitzuziehen | 7.1, 9.1, 9.2, 9.6 | e2e-tester |
| 6 | In den beiden Tabellen der Exportgruppen ist zu messen, ob in der **rechtesten** Spalte ein fokussierbares Element steht. Steht keines, bekommt die Fläche einen Halt | 8.5 | frontend-dev, e2e-tester |

**Die Reihenfolge zählt bei Punkt 3 und 5.** Solange 7.5 nicht gebaut ist, ist A8 bei 1024 × 640
**rot**, und das ist beabsichtigt (9.6). Wer den Meßsatz zuerst baut, bekommt ein Rot mit einem
Namen; wer die Ausnahme zuerst schriebe, bekäme ein Grün ohne einen.

### Übergabe T-354 — an den e2e-tester, der A9 gerade baut

Ein Punkt, und er ist eine Berichtigung an Punkt 5 der Tabelle darüber. **A9 ist nicht das, was am
2026-09-13 morgens in diesem Papier stand.**

| # | Was | Wo | An wen |
|---|---|---|---|
| 7 | **A9 (a)** wird über die getragenen Größen hinweg ausgewertet und nicht je Größe; **A9 (c)** hat zwei Zweige, und welcher gilt, wird am Kasten gemessen (`scrollHeight`/`clientHeight` plus `overflow-y`). Der zweite Zweig — Bildlaufstelle des **nächsten laufenden Vorfahren** — ist **abschließend** auf die Zeiterfassung unterhalb von 68 rem beschränkt; nimmt ihn ein anderes Paar, ist der Lauf **rot**. Der Vergleichswert ist in beiden Zweigen „Bewegung > 0", nicht eine feste Pixelzahl | **9.7** | e2e-tester |

**Drei Dinge, die dabei nicht passieren dürfen**, jedes mit seinem Grund:

1. **A9 (c) nicht ohne die Aufzählung bauen.** Ein offenes „oder ein laufender Vorfahr" ist bei
   1024 × 640 auch dann grün, wenn die Marke wieder am Rahmen säße — also genau bei dem Befund, aus
   dem A9 entstanden ist (9.7).
2. **Die Zeiterfassung nicht aus A9 ausnehmen.** Sie ist die einzige Ansicht mit zwei Laufbereichen
   und damit die, für die A9 am meisten wert ist. Ausgenommen wird ein Verhalten nie, es wird
   **benannt**.
3. **Kein festes Pixelmaß als Erwartung.** Die 392 px und 36 px aus 9.7 sind der **Beleg**, daß sich
   etwas bewegt, und hängen an Vorrat, Schriftgröße und Fenstergröße. Wer sie als Sollwert einbaut,
   baut einen Lauf, der beim nächsten Vorrat rot wird, ohne daß ein Fehler vorliegt.

Reihenfolge ist Absicht: erst der Rahmen, dann die drei Sonderkinder, dann die Ansichten nach
T-322, dann das Aufräumen.

1. **`apps/web/src/styles/app.css`**
   `--screen-inset` an `.app` (neben `--app-header-height`). `.app__main`: `display: grid` mit
   zwei `minmax(0, 1fr)`, `padding: 0`, `scrollbar-gutter` weg; `position: relative`,
   `overflow-y: auto`, `overflow-x: hidden`, `overscroll-behavior`, die beiden Nullen bleiben, und
   **der Kommentar dort bleibt wahr** — wer ihn kürzt, streicht die Begründung für Ursache 2. In
   der Stufe `max-width: 52rem`: `.app__main { padding: var(--space-4) }` wird
   `.app { --screen-inset: var(--space-4) }`. `.boot--inline { min-block-size: 0 }`.
   `.app__main:focus-visible` → `.screen__body:focus-visible`.
2. **`apps/web/src/styles/viewport-layout.css`**
   Den Block aus 3.2 aufnehmen, in der dort angegebenen Reihenfolge. Den Kopfkommentar der Datei
   nachziehen: sie trägt jetzt das allgemeine Muster und nicht zwei Sonderfälle. Die vier Zeilen
   aus 8.1 (Z. 54–67) im **selben** Auftrag streichen.
3. **`apps/web/src/app/App.tsx`**
   `id="inhalt"` von `.app__main` an den Laufbereich (8.5; gebaut mit `tabIndex={0}` und
   `role="region"`, nicht mit `{-1}` — die Begründung steht dort). Ladeersatz auf
   `.boot .boot--inline`. `UnknownScreen` und die Nachlademeldung in `.screen` + `.screen__body`
   fassen (8.6). Danach: `.app__main` hat genau ein Kind und es ist eine `.screen`.
4. **`apps/web/src/app/router.ts`**
   `ROUTE_NAMES` exportieren, vollständig gegen `RouteName` getypt (9.3). Eine Zeile, und sie ist
   die Bedingung dafür, dass der Meßsatz seine Menge an der Anforderung aufspannt.
5. **`apps/web/src/shared/ui/ScreenHeader.tsx`**
   Unverändert im Aufbau. Es liefert `.screen__header`, und das ist im Muster der feste Kopf.
6. **Die elf Ansichten** — `.screen__body` einziehen, nach der Rollenverteilung aus T-322. Wo eine
   Tabelle den klebenden Kopf bekommen soll: `class="screen__body table-wrap"` (6.3). Wo zwei
   Laufspalten: `.screen__body--frame` plus `.runarea`, und dann die betroffene Zeile aus 8.8 von
   `start` auf `stretch`.
7. **Prüfen, nicht annehmen:** der Portalfall aus 8.2. Er gehört in denselben Auftrag.
8. **Nicht anfassen:** `base.css` (die Höhen der Wurzel und der Kommentar dort sind die Grundlage,
   nicht der Gegenstand), `theme-palettes.css`, `showcase.css`, `components.css` außer der
   `.table-wrap`-Anmerkung in 6.3 — und sie braucht dort keine Änderung.

## 12. Offene Fragen

### Geschlossen (Stand 2026-09-13)

1. ~~**An T-322:** Bleibt `.list-more` fester Fuß oder wandert der Nachladefuß in den
   Laufbereich?~~ **Beantwortet, und zwar verschieden je Ansicht** (T-326): In Todos und Protokoll
   läuft `.list-more` am Ende der Liste mit; **auf dem Board bleibt er fest**, weil T-322 4.4 das
   Board ausdrücklich unverändert lässt. Er liegt dort im Rahmen mit `flex: none`, damit
   `.screen__body` das letzte Kind von `.screen` bleibt. Der Mechanismus trug beides, wie
   angekündigt.
3. ~~**An den frontend-dev:** Sind die 4 rem in 7.2 am laufenden Fenster richtig?~~ **Ja, und die
   Frage war falsch gestellt** (T-326). Die 4 rem sind der **Boden**, nicht die Grenze; wann der
   Rückfall greift, hängt nicht an ihnen, sondern an der Höhe des **festen Teils**. Und die ist
   größer als gedacht: auf dem Board gemessen **537 px** (Titel, zweizeiliger Erklärsatz,
   Umschalter, „Spalten verwalten") plus 36 px Werkzeugzeile bei 588 px Inhaltshöhe — **91 % des
   Inhaltsbereichs für die Steuerung**, und zwar an der getragenen Untergrenze 960 × 640. Auf den
   Todos bei 831 × 640 sind es 320 von 415 px. Der Rückfall ist auf dem Board also nicht der
   Ausnahmefall, sondern der Regelfall am unteren Rand. Das ist T-322 R-h wörtlich („Der feste Teil
   wächst über die Jahre") und führt geradewegs zu **Frage 5**.

### Offen

2. **An den Orchestrator, mit vertauschten Rollen.** Die alte Fassung fragte, ob der Rinnenversatz
   ausgeglichen werden **soll**. Er ist ausgeglichen (3.4, 5.1), in Chromium über 44 Fälle auf 0
   gemessen, und der Bildvergleich zeigt keinen verlorenen Buchstaben. Zwei Kanten der alten Frage
   sind damit **eine** geblieben: Reserviert `scrollbar-gutter: stable` an einem Kasten mit
   `overflow: hidden` auf **beiden** Achsen zusätzlich eine Rinne an der Blockendkante, und tut es
   das in allen drei ausgelieferten Engines gleich? In Chromium ist kein Band zu sehen; WebKitGTK
   und WebView2 sind nicht gemessen. Vorschlag unverändert: bei der nächsten
   `proof:engines`-Gelegenheit mitmessen. **Was bei einem Fund zu tun wäre, steht schon fest** —
   nicht die Rinne am Kopf zurücknehmen (dann kommt der 10-px-Versatz wieder), sondern die
   Blockendkante des festen Teils ausgleichen.
4. **An den Auftraggeber, über den Orchestrator:** Gilt die Zusage „fensterfest" auch für den
   Aufgabenbereich des Outlook-Add-ins? Er hängt nicht in dieser Hülle, hat sein eigenes Gerüst
   und ein Fenster, dessen Höhe Outlook bestimmt. Der Auftrag spricht von „Seiten" der Anwendung;
   ich nehme das Add-in **nicht** als eingeschlossen an und habe es nicht mitentworfen. (E-112
   nennt es inzwischen ausdrücklich als ausgenommen; die Frage bleibt hier stehen, weil sie dem
   Auftraggeber gestellt war und nicht der Entscheidung.)
5. **Neu, T-339 — an den ui-designer selbst, in einem eigenen Auftrag.** Der Bildschirmkopf des
   Kanban trägt eine Aktionsgruppe von **785,3 px**, weil der Ansichtsumschalter seinen Erklärsatz
   im Kopf mitführt. Daran hängen drei Zahlen, die alle unangenehm sind: der Umbruch bei ≈ 1259 px
   (7.4), die 20,7 px Luft des Standardfensters, und die 537 px fester Teil an der getragenen
   Untergrenze (Frage 3). `flex-basis: 10rem` behandelt das Symptom und tut das gut; die Ursache
   ist eine Gestaltungsfrage. **Sie gehört nicht in diesen Auftrag** — er darf keine Optik ändern —,
   aber sie ist die einzige der fünf, deren Beantwortung mehrere Zahlen zugleich entspannt.
   Vorschlag: erklärenden Fließtext aus dem Bildschirmkopf nehmen, dorthin, wo T-322 ihn hinweist
   („Die Naht liegt unter dem, was die Auswahl steuert").
   **Nachtrag T-344:** Die Freigabe des umbrochenen Kopfes (T-343 B-05) ist erteilt und **ändert an
   dieser Frage nichts** — sie gilt für das Kanban, weil dessen Aktionsgruppe als einzige über
   ≈ 486 px liegt (7.4). Der Prüfer nennt denselben Satz aus der anderen Richtung: erklärender
   Fließtext in der Steuerzeile ist „visuelle Unordnung" im Wortsinn von A-13.2. Damit hat die
   Frage jetzt zwei Deckungen und keine Zuständigkeit; sie gehört als eigener Auftrag in die
   nächste Welle, **vor** die nächste Erweiterung irgendeines Bildschirmkopfs.
6. **Neu, T-344 — an den Auftraggeber, über den Orchestrator: die Bandnavigation.** Unterhalb von
   52 rem legt sich die Navigation als Band über den Kopf und nimmt **173 px** Fensterhöhe; die
   Hülle nimmt dort zusammen 225 statt 52 px (T-341 3.5). Bei 640 × 480 sind das **47 % der
   Fensterhöhe**, bevor eine Ansicht beginnt — gegen 175 px Budget steht ein kleinstmöglicher Kopf
   von ≈ 188 px. **Das ist der einzige verbleibende Hebel** für 831 × 640 und 640 × 480; an den
   Filterleisten ist dort nichts mehr zu holen (T-341 3.3 hat den einen echten Fund bereits
   behoben). Die Frage ist nicht technisch, sondern eine Abwägung: eine gedrängtere Bandgestalt in
   Fenstern, die die Hülle gar nicht zuläßt — oder es bleibt bei der schwächeren Zusage aus 7.1,
   die dort ausdrücklich **nicht** „fensterfest" verspricht, sondern „nichts abgeschnitten, nichts
   unerreichbar". **Mein Vorschlag ist das Zweite**, und der Grund steht in 7.1: Eine Zusage, die
   man an der Grenze beendet, ist mehr wert als eine, die man jede Welle lockert.
