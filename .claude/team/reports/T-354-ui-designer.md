# T-354 — B-20: A9 gegen den eigenen Abschnitt 8.5

**Rolle:** ui-designer. **Stand:** 2026-09-13, Welle 8. **Dateien:** beide Papiere, wie in T-344 —
`docs/design/fensterfeste-flaechen.md` (T-323) und `docs/design/fensterfeste-flaechen-fluss.md`
(T-322). Kein Produktivcode, keine Prüfdatei, kein `docs/spec.md`.

---

## 1. Die Entscheidung

A9 (c) und AK-14 (c) verlangten die Bildlaufstelle „**genau dieses Kastens**". T-323 8.5 Punkt 1 und
T-322 4.5 erklären für die Zeiterfassung unterhalb von 68 rem ausdrücklich, daß dort der **Rahmen**
rollt. 68 rem sind 1088 px — betroffen sind **vier der sieben Meßgrößen** aus 9.2: 960 × 640 und
1024 × 640 (getragen) sowie 831 × 640 und 640 × 480 (Rückfall).

**Nicht nur (c) war betroffen, auch (a).** (a) verlangte „der Kasten mit `id=\"inhalt\"` hat eine
Laufstrecke" — Laufbereich A hat unterhalb von 68 rem keine (`overflow-y: visible`). Wer nur (c)
berichtigt, bekommt dasselbe falsche Rot eine Zeile höher.

Die neue Fassung, **zeichengleich in beiden Papieren**:

- **(a)** mißt die **Identität, über die getragenen Größen hinweg** statt in jeder einzelnen: Der
  Inhaltshalt muß in **mindestens einer** getragenen Fensterform eine **eigene** Laufstrecke haben.
  Das ist die Bestimmung aus 8.5, Wort für Wort. **Kein Kasten kann sie über einen Vorfahren
  erfüllen** — hier bleibt der Satz hart. Dazu der Riegel: Eine Laufstrecke, die **nur in einem als
  Fehler benannten Zustand** entsteht, zählt nicht (der Rahmen der Einstellungen läuft bei
  1024 × 640 um 62 px, und das ist der E-115-Verstoß aus 7.5).
- **(c)** mißt die **Wirkung, je Größe, in zwei Zweigen**. Welcher gilt, wird am Kasten gemessen
  (`scrollHeight > clientHeight + 1` **und** `overflow-y != 'visible'`; im Kanban die andere Achse),
  nicht angenommen. Zweig 1: die Bildlaufstelle des Kastens selbst. Zweig 2: die seines **nächsten
  laufenden Vorfahren**. **Null Bewegung in beiden ist rot.**
- **Zweig 2 ist abschließend aufgezählt:** Zeiterfassung unterhalb von 68 rem, Vorfahr ist der
  `--split`-Rahmen — an 960 × 640, 1024 × 640, 831 × 640 und 640 × 480. **Nimmt ein anderes Paar aus
  Ansicht und Fenstergröße diesen Zweig, ist der Lauf rot**, auch wenn sich dort etwas bewegt hat.

Die tragende Aussage steht jetzt als Satz in beiden Papieren:

> **Nach der Sprungmarke muß `Bild ab` meßbar etwas bewegen. *Was* sich bewegt, darf vom Fenster
> abhängen; *daß* sich etwas bewegt, nicht.**

**Warum Zweig 2 aufgezählt und nicht offen formuliert ist — das ist die eigentliche Entscheidung.**
Der Vorschlag aus T-351 B-20 („oder die seines nächsten laufenden Vorfahren") ist richtig und
gefährlich zugleich: Ohne Grenze wäre die Marke am Rahmen der Einstellungen bei 1024 × 640 **grün**,
weil der Rahmen dort um 62 px läuft — also genau der Befund B-07, aus dem A9 entstanden ist, und
genau der Fehlerzustand, den 7.5 behebt. Eine Zusicherung, die den Befund grün macht, aus dem sie
entstand, ist seine Beerdigung. Dieselbe Bauform wie die zwei Untergrenzen in 9.6: **eine Ausnahme,
die niemand zählt, ist ein Freibrief.**

Die Zahlen daneben, aus T-348 (1024 × 640, Fokus auf `#inhalt`, vorher → nachher): Einstellungen
Marke am Rahmen **0 → 0**, am Bereich **0 → 392 px**; Kanban Marke am Rahmen **0 → 0**, am Board
**0 → 36 px** (`Pfeil rechts`). Beide Nullen sind B-07, beide Zahlen daneben seine Behebung.

**Ein vierter Punkt, den niemand beauftragt hat und der ein zweites falsches Rot verhindert:**
(b) braucht **keine** Ausnahme. Der laufende Vorfahr ist ein Vorfahr, kein Tabulatorziel — die Taste
steigt auf, sie wandert nicht. Gemessen wird bei (b) weiterhin, **worauf die Marke führt**, nicht wie
oft jemand `Tab` drückt. Das steht jetzt dabei, weil T-352 die Zusicherung heute baut.

---

## 2. Die Mitnahmen

### B-08 — der Inhaltshalt, den es im Zustand nicht gibt: **beantwortet**

Gleichlautend in T-323 8.5 und T-322 R-4:

> **Existiert der Inhaltshalt in einem Zustand nicht, trägt die Marke der Laufbereich, der den
> Zustand zeigt.** Er ist dort der einzige — eine Ansicht hat im Lade- und Fehlerzustand genau einen
> (R-5).

Das ist die **gebaute** Wahrheit und kostet keine Zeile: `ScreenBody` trägt `anchor = true` als
Vorgabe, `ScreenFrame` setzt die Marke nie — in Z0/Z3/Z4 landet sie auf `<ScreenBody label="Kanban">`
bzw. `<ScreenBody label="Zeiterfassung">` (`BoardScreen.tsx:410`, `:421`; `TimeScreen.tsx:160`,
`ScreenBody.tsx:152`, `:199`). Am Quelltext nachgelesen, nicht angenommen.

**Und die Grenze steht dabei:** Der Meßsatz fährt jede Ansicht erst nach dem Laden (9.1, erster
Satz) und sieht Z0, Z3 und Z4 **nicht**. Der Satz ist eine **Bauregel, keine Zusicherung**. Der
bessere, teurere Weg — den Laufbereich über die Zustände hinweg als dasselbe Element halten — bleibt
als Vorschlag an den Orchestrator stehen und ist nicht gewählt: Er ändert Bedienwege in einem
Auftrag, der keine ändern darf (A-25.7).

### B-13 — **nicht berührt**, geprüft und nicht geraten

A9 arbeitet mit `#inhalt` (eine Kennung), Tastendrücken und Bildlaufständen; (b) zählt Halte. **Kein
Teil von A9 fragt auf einen zugänglichen Namen ab**, und keine meiner Änderungen fügt einen Namen
hinzu oder ändert einen. B-13 (T-322 4.11 letzter Punkt: die Rolle einzuschränken genügt für `link`
nicht, weil „Export" in der Einstellungsansicht zweimal ein Verweis ist) steht **unverändert offen**
und in derselben Datei, die mir in diesem Auftrag gehört.

Ich habe ihn **nicht** mitberichtigt, und der Grund ist Absicht statt Bequemlichkeit: Er ist ein
anderer gemessener Fall, er berührt A9 an keiner Stelle, und T-352 und T-355 schreiben gerade
Abfragen. Der fertige Satz für den nächsten Auftrag, einzusetzen in 4.11: *„Für `region` und
`heading` genügt die Rolle. Für `link` genügt sie nicht — „Export", „Daten" und „Status" stehen in
der Einstellungsansicht **zweimal** als Verweis (Hauptnavigation und Bereichsschiene). Eine Abfrage
auf einen Verweis schränkt zusätzlich die **Landmarke** ein."*

### A-25.6 — behauptet mein Papier mehr, als ein Lauf mißt? **Ja, an einer Stelle. Benannt.**

**AK-25** verlangte „in **jeder** der sieben Paletten und in beiden Farbmodi, und nach beliebigem
Bildlauf unverändert". T-348 stellt fest: Von den fünf Teilsätzen von A-25.6 trägt sein Lauf
**zwei** (Regel G und Regel H), einen mittelbar, zwei gar nicht — „vollständig sichtbar" und „fängt
den Tastaturfokus". Gemessen wurde die Größe und Lage einer Bestätigungsfläche **einmal**, in T-334
nach R-31, in **zwei** Paletten.

AK-25 trägt jetzt einen **Meßstand** als Tabelle: je Teilsatz, wer ihn trägt und wo die Grenze liegt.
Und den Satz, der die Zusage auf das Gemessene zurückschneidet, ohne sie stillschweigend zu kürzen:
Die sieben Paletten sind eine **Auflage an die Abnahme**, keine stehende Zusicherung; strukturell
zugesichert ist das Portal am Dokumentkörper — weniger, aber wahr. Ob daraus ein eigener Lauf wird,
gehört dem Orchestrator (Teilsatz 2 und 4 sind die Kandidaten; T-348 stellt dieselbe Frage).

### Zwei Sätze im Präsens, die kein Lauf trägt — einer davon behoben

T-322 Abschnitt 9 Nr. 4 sagte: *„Der Tastaturweg bleibt damit erhalten, und **gemessen wird er**:
AK-14 (c) und die Zusicherung A9 des Meßsatzes."* A9 gibt es im Baum nicht (T-351 B-19 c). Der Satz
ist **berichtigt** statt gestrichen: Er wird gemessen, **sobald A9 gebaut ist** (T-352); bis dahin
ist der Weg gebaut und belegt (T-348), aber nicht gegen Rückfall gesichert.

---

## 3. Deckung nachgezogen (A-25.8, A-25.5, A-25.7)

Beide Kopfzeilen sagten „A-25.1 bis A-25.7". Jetzt **A-25.1 bis A-25.8**, mit dem Vermerk, was
T-351 erzwungen hat: A-25.5 trägt die zwei entschiedenen Ausnahmen (B-17), A-25.7 bindet sich an die
Sache statt an den Zustand (B-18), A-25.8 ist neu (B-16).

Dazu **eine Stelle, die dadurch von „geduldet" auf „gedeckt" wechselt**: T-323 8.7 (Musterseite und
Startbilder rollen weiter das Dokument) stand nach dem Wortlaut von A-25.2 im Widerspruch zur
Spezifikation. A-25.8 nennt die drei Flächen; der Abschnitt trägt den Verweis. Im Flußpapier bekommt
die Deckungstabelle dieselbe Zeile, angehängt an **OF-4** — die Frage an den Auftraggeber bleibt
davon unberührt.

---

## 4. Was wo steht

| Papier | Abschnitt | Was |
|---|---|---|
| T-323 | Kopf | Deckung A-25.1 bis **A-25.8**; neue Berichtigungstabelle **T-354** samt Irrtum, Satz und Zahlen |
| T-323 | **9.1 A9** | (a) und (c) neu gefaßt, Verweis auf 9.7 |
| T-323 | **9.7 (neu)** | Vorschrift: zwei Zweige, Meßregel für den Zweigwahl, abschließende Aufzählung, (b) ohne Ausnahme, die vier Zahlen aus T-348, und was A9 **nicht** mißt |
| T-323 | **8.5** | B-08 beantwortet; Punkt 1 nennt den Widerspruch und seine Auflösung |
| T-323 | **8.7** | Deckung durch A-25.8 |
| T-323 | **11** | **Übergabe T-354** an den e2e-tester: drei Dinge, die nicht passieren dürfen |
| T-322 | Kopf | vierte Fassung, Berichtigungstabelle T-354 (drei Zeilen), Deckung bis A-25.8, OF-4-Zeile |
| T-322 | **AK-14** | (a) und (c) **zeichengleich** mit A9 |
| T-322 | **R-4** | Widerspruch benannt; B-08 als eigener Punkt |
| T-322 | **4.5**, Abschnitt 7 | der Fall unter 68 rem als zugesichert statt hingenommen; neue Zeile in der Tastaturtabelle |
| T-322 | **AK-25** | Meßstand zu den fünf Teilsätzen von A-25.6 |
| T-322 | **R-k**, Abschnitt 9 Nr. 4 | Nachtrag zum Freibrief; der Präsenssatz berichtigt |

---

## Annahmen

1. **Zweig 2 wird aufgezählt statt offen formuliert.** T-351 B-20 schlug „oder die seines nächsten
   laufenden Vorfahren" vor. Ich habe den Vorschlag übernommen **und eingezäunt**, weil er sonst den
   Befund deckt, aus dem A9 entstand. Das ist strenger als der Vorschlag, nicht lockerer.
2. **(a) ist mitberichtigt**, obwohl der Auftrag nur (c) nennt. Ohne (a) bleibt dasselbe falsche Rot
   eine Zeile höher stehen.
3. **B-08 wird als Bauregel beantwortet, nicht als Zusicherung.** Der teurere Weg (ein Element über
   alle Zustände) ändert Bedienwege und gehört nicht in diesen Auftrag.
4. **B-13 bleibt unberührt.** Der fertige Satz steht oben; der Auftrag dafür gehört dem Orchestrator.
5. **Die Pixelzahlen 392 und 36 sind Belege, keine Sollwerte.** Steht in der Übergabe.

## Risiken

- **R-1 (neu, benannt in R-k):** Zweig 2 wird beim Bauen als „irgendein Vorfahr" gelesen. Dann ist
  A9 (c) fast unwiderlegbar und deckt B-07. Gegenmaßnahme steht im Papier: das andere Paar ist rot.
- **R-2:** T-352 baut gegen einen Stand, der sich heute zweimal bewegt hat. Fährt der Lauf die alte
  Fassung, bekommt er die Zeiterfassung an vier von sieben Größen rot. Die Kette „falsches Rot →
  Lockerung" ist in 9.6 und R-k beschrieben; dieser Auftrag existiert, um sie zu unterbrechen.
- **R-3:** A9 mißt Z0/Z3/Z4 nicht. Die Regel dafür ist gebaut und dokumentiert, aber unbewacht — ein
  Umbau der Ladehülle kann sie still brechen.
- **Sicherheit:** keine. Kein Datenweg, keine Adresse, keine Datei, kein Oberflächentext. Es fällt
  kein Text, es entsteht keiner; E-087 ist nicht ausgelöst.

## Offene Fragen

1. **An den Orchestrator:** Sollen die Teilsätze 2 und 4 von A-25.6 („vollständig sichtbar", „fängt
   den Tastaturfokus") einen eigenen Lauf bekommen? T-348 stellt dieselbe Frage; AK-25 verlangt
   sieben Paletten, gemessen sind zwei.
2. **An den Orchestrator:** B-13 (T-322 4.11) — eigener Auftrag oder in die nächste
   Papierberichtigung? Der Satz ist fertig formuliert.
3. **An den Orchestrator:** B-22 aus T-351 (die 537 px in den offenen Fragen 3 und 5, widerlegt durch
   129,8 px in 7.4) ist **nicht** Gegenstand dieses Auftrags und steht weiter ohne
   Widerlegungsvermerk — die einzige Stelle in T-323, an der die Methode dieses Papiers heute nicht
   durchgehalten ist.
4. **An den Orchestrator, aus B-08:** Soll der Laufbereich über die Zustände hinweg dasselbe Element
   werden? Der Gewinn ist der Fokus, der beim Datenanfang nicht an `<body>` fällt; der Preis ist ein
   Umbau der Ladehülle in vier Ansichten.

## Nächster Schritt

T-352 liest **T-323 9.7** und die Übergabe T-354 in Abschnitt 11, bevor er A9 fertigbaut — beides
ist seit heute da und war es beim Auftragsbeginn nicht. Danach: der spec-ux-reviewer prüft B-20 und
B-08 gegen diese Fassung, und B-13 sowie B-22 gehen als eigener, kleiner Papierauftrag in die
nächste Welle.
