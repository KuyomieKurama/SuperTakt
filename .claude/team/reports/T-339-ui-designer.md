# T-339 — `fensterfeste-flaechen.md` auf das nachziehen, was gemessen wurde

**Rolle:** ui-designer. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e`.
**Vorlagen:** `.claude/team/reports/T-326-frontend-dev.md`, `T-334-frontend-dev.md`,
`.claude/team/decisions.md` (E-112, **E-113**, E-114), der stehende Stand in
`apps/web/src/styles/viewport-layout.css` und `app.css` (nur gelesen).

**Status:** fertig. Neun Berichtigungen, davon **fünf beauftragt** und **vier beim Nachziehen
gefunden**. Zwei Fragen aus dem Auftrag sind beantwortet, eine davon **gegen** die Zahl, die im
Auftrag steht (Punkt 3). Kein Produktivcode, keine fremde Datei.

---

## 0 Geänderte Dateien

| Datei | Was |
|---|---|
| `docs/design/fensterfeste-flaechen.md` | neun Berichtigungen, zwei Ergänzungen (7.4 neu, 9.6 neu), Berichtigungstabelle im Kopf |
| `.claude/team/reports/T-339-ui-designer.md` | dieser Bericht |

`apps/**`, `packages/**`, `tests/**` und `fensterfeste-flaechen-fluss.md` sind **nicht** angefaßt.
Der `.css`-Stand ist gelesen, um den beschriebenen Stand am gebauten zu prüfen — nicht geändert.

**Die Form jeder Berichtigung ist dieselbe:** Die widerlegte Fassung bleibt als Zitatblock stehen,
darunter steht, woran der Irrtum hing, darunter die Zahl, die ihn widerlegt hat. Ein stillschweigend
korrigiertes Papier lehrt nichts.

---

## 1 Abschnitt 8.4 — widerlegt, E-113 aufgenommen

Der alte 8.4 steht wörtlich im Papier, als Zitat, mitsamt seiner Überschrift. Daneben:

- **Woran der Irrtum hing.** Aus T-057 Ursache 2 wurde „es soll bei genau **einem** umschließenden
  Block bleiben". Das war nie das Ziel — das Ziel war, daß kein absoluter Nachfahre aus dem Kasten
  fällt, in dem er steht. Solange `.app__main` selbst der Laufbereich war, fielen beide Sätze
  zusammen. Sobald der Bildlauf tiefer zieht, trennen sie sich, und das Papier hat den falschen
  mitgenommen. **Dieselbe Fehlerklasse wie T-057, eine Ebene höher — nicht ihr Gegenteil.**
- **Die Meßtabelle vollständig**, alle sieben Zeilen aus T-326 samt der Umschlagklassen (128, 140,
  76, 81, 55, 4, 4 Verstöße), mit der Zeile 768/768 auf allen elf. Die 488 Spannen stehen dabei.
- **Die Regel**, wörtlich wie in E-113: *Ein Bildlaufkasten muß der umschließende Block seiner
  eigenen absoluten Nachfahren sein; wandert der Bildlauf, wandert `position: relative` mit ihm.*
- Ausdrücklich auch an `.kcolumn__body`, **obwohl im Board heute kein absoluter Nachfahre steht**.
  Das ist der Punkt der Regel: Der erste, der dazukommt, soll die Leiste nicht zurückbringen.
- Was von der alten Auflage bleibt: eigener Umschlag positioniert — jetzt eine Frage der
  Genauigkeit, nicht mehr der Sicherheit.

**Mitgezogen, sonst hätte das Papier sich selbst widersprochen:** die Pflichtentabelle 3.3
(`position: relative` ist jetzt **Pflicht**, nicht Verbot) und der Vorschlag für den statischen
`proof:`-Lauf in 9.5, der bisher die **Abwesenheit** der Zeile zusichern wollte und jetzt ihre
**Anwesenheit** zusichert.

## 2 `scrollbar-gutter` am Rahmen — **bestätigt**, und die Regel neu aufgespannt

**Bestätigt.** T-334 hat recht, und die alte Fassung hatte einen Konstruktionsfehler, nicht nur
einen falschen Wert: Sie spannte die Menge an der Frage auf, **wer läuft**. Das trägt acht von elf
Ansichten. Die Regel, die beide Fälle trägt, spannt sie an der Frage auf, **wer die Kante
bestimmt**:

> **Eine Kante, elf Ansichten.** `scrollbar-gutter: stable` steht an jedem Kasten, dessen
> Inline-Endkante die rechte Kante der Inhaltsspalte festlegt — am laufenden, weil er die Rinne
> braucht, **und am stehenden, weil er sich an ihr ausrichten muß.** Die Rinne ist keine Zugabe zum
> Bildlauf, sie ist die Kante.

Damit trägt sie `.screen__body`/`.runarea`/`.kcolumn__body` (laufen), `.screen__body--frame` (läuft
im getragenen Bereich nicht) und `.screen__header`/`.screen__bar` (laufen nie) in **einer** Regel
statt in drei Ausnahmen.

Aufgenommen dazu:

- **Der allgemeine Satz dahinter:** *Der Umzug einer Zeile ist nicht ihre Streichung.* Vor T-326
  reservierte `.app__main` die Rinne für alles darin; als der Bildlauf nach innen zog, zerfiel eine
  Kante in drei. Derselbe Satz wie in 8.4, andere Eigenschaft.
- **Die Gegenprobe, die die halbe Behebung entlarvt hat:** Nach der ersten Hälfte endete der Kopf
  der drei Rahmenansichten bei 1246 und ihr Inhalt weiter bei 1256 — der Versatz war gewandert,
  nicht weg. Wer eine Kante ausrichtet, zählt die Kästen, die sie bestimmen, nicht die, die er
  gerade in der Hand hat.
- **5.2 bleibt gültig und wird geschärft:** Die Trennlinie ist die **Achse**. `stable` reserviert
  für einen Blockachsenlauf rechts, für einen Inline-Achsenlauf unten. `.board` ist auf beiden
  Achsen Bildlaufkasten und bekäme ein leeres Band — `.screen__body--frame` nicht, weil es
  `overflow-x: hidden` trägt. Der Unterschied steckt in genau einer Deklaration, und er steht jetzt
  da.
- **Der Preis steht dabei:** eine leere Rinne im Regelfall an drei Rahmenansichten und an jedem
  festen Kopf. 10 px, die vor T-326 ebenfalls leer waren. Bewußter Wechselkurs: eine gemeinsame
  Kante über elf Ansichten ist mehr wert als 10 px in dreien.

**Was ich dabei nicht bestätigen kann** — und es ist die alte offene Frage 2, mit vertauschten
Rollen: `.screen__header` trägt `overflow: hidden` auf **beiden** Achsen; nach derselben Rechnung
müßte `stable` dort auch eine Rinne an der **Blockendkante** reservieren. In Chromium ist keine zu
sehen (Kopfhöhen gleich, Bildvergleich höchstens 32 Bildpunkte, größter Unterschied 2 von 255), eine
getrennte Messung dieser Kante über WebKitGTK und WebView2 liegt **nicht** vor. Die Frage bleibt
offen; was bei einem Fund zu tun wäre, steht jetzt im Papier (nicht die Rinne zurücknehmen — dann
kommt der 10-px-Versatz wieder —, sondern die Blockendkante ausgleichen).

## 3 `flex-basis: 10rem` — Token? **Nein.** Schwelle ~1067? **Nein, ≈ 1259.**

### 3.1 Örtliche Konstante, kein Token

Maßstab ist in diesem Bestand nicht Geschmack, sondern die Zahl der Leser:

| | Leser | Form |
|---|---|---|
| `--screen-inset` | **vier** | benannter Eigenwert an `.app` |
| `--app-header-height` | drei | benannter Eigenwert an `.app` |
| `flex-basis: 10rem` | **einer** (`.screen__headline > .grow`) | Zahl an Ort und Stelle |

Dazu zwei Gründe, die schwerer wiegen als die Zahl: **Es ist kein Gestaltungswert, sondern eine
Meßgröße** — ein Token behauptet Wählbarkeit, und diese Zahl ist nicht wählbar; sie kodiert „die
engste vorhandene Titelspalte ist 180,7 px" und wird falsch, sobald sich `.screen__actions` ändert.
Und Abschnitt 0 dieses Papiers verbietet ein neues Token in `packages/ui-tokens` ausdrücklich. Wann
sie doch einen Namen bekommt, steht jetzt da: sobald ein **zweiter** Leser entsteht, dann
`--screen-headline-min` an `.app` und nicht in `packages/ui-tokens`.

### 3.2 Die Schwelle ist ≈ 1259 px, nicht ~1067

**Das ist der Befund dieses Auftrags, der mir am meisten wert scheint, und er steht gegen die Zahl
im Auftrag.** 1067 steht in keiner der zwölf Meßzeilen von T-334. In der Tabelle stehen zwei andere:

- **≈ 1089 px** — dort fiel `.grow` **vor** T-334 auf null (10,7 px bei 1100, 0 bei 1087). Das ist
  der alte **Zusammenbruch**. Vermutlich ist 1067 von dieser Zeile abgelesen.
- **≈ 1259 px** — dort bricht der Kopf **seit** T-334 um: `160 + 16 + 785,3 = 961,3 px`
  Inhaltsbreite gegen 982 px bei einem 1280 px breiten Fenster. Die Differenz ist **20,7 px** —
  dieselbe „Luft", die T-334 selbst gemessen und beziffert hat. `1280 − 20,7 = 1259,3`.

Gerechnet aus drei gemessenen Werten, nicht selbst gemessen; im Papier als solches gekennzeichnet.

**Fachlich ist das mehr als eine Zahlenkorrektur.** Der einzeilige Kopf ist nicht der Normalfall mit
einer Ausnahme unten, sondern die **Ausnahme oben**: Über die ganze getragene Breite von 960 bis
≈ 1259 px steht die Aktionsgruppe unter dem Titel; erst darüber daneben. Gegenüber dem alten Zustand
in jedem Punkt besser (129,8 statt 536,8 px Kopf, kein abgeschnittener Knopf an 960) — aber es ist
die **verbreitete** Gestalt und nicht die seltene, und visual-qa muß sie entsprechend bei 1024 und
960 prüfen, nicht nur an der Kante.

**Und die Kante ist eng:** Das Standardfenster liegt 20,7 px über der Schwelle, **1,6 %**. Ein Wort
mehr in der Beschriftung des Umschalters, eine Gestaltung mit größerer Kopfschrift, ein weiterer
Knopf — jedes kippt 1280 in den umbrochenen Kopf. **Bestätigt ist `10rem` deshalb als beste
verfügbare Zahl unter der Auflage „bei 1280 zeichengleich", nicht als stabile Grenze.**

**Die eigentliche Zahl steht woanders** und ist als **offene Frage 5** aufgenommen: 785,3 px
Aktionsgruppe ist der Ausreißer, nicht die Titelspalte. Solange der Ansichtsumschalter des Kanban
seinen Erklärsatz im Bildschirmkopf trägt, behandelt jede Zeile hier ein Symptom.

## 4 Der Meßsatz — A8 und Abschnitt 9.6 neu

A8 steht in der Zusicherungstabelle, die Vorschrift in **9.6**, vollständig nach T-334: Menge
(`.screen__body:not(--frame)`, `.runarea`, `.kcolumn__body`, unter 68 rem zusätzlich
`.screen__body--split`), die Ausnahme `--frame` mit ihrer Zahl (86 px bei 1024 × 640, Rückfall R-3),
nur Kinder im Fluß, `scrollHeight ≤ clientHeight + 1`, plus die Gegenprobe (`flex-shrink: 1` an
`.screen__body > .card` **muß** rot machen).

**Warum die Untergrenzen dastehen — der Teil, den der Auftrag verlangt hat.** Die leere Menge
erfüllt jede Allaussage; ein umbenannter Bezeichner, ein stehender Ladezustand oder ein zu kleiner
Vorrat macht den Lauf grün, ohne ihn wahr zu machen. Das ist hier kein hypothetischer Fehler, und
das Papier nennt jetzt drei Fälle mit Namen:

| Fall | Wie die leere oder falsche Menge grün war |
|---|---|
| `proof:addin` Abschnitt 18 (E-099, E-100) | zählte Zeilen nach einem Aufruf der **Anlegetür** — es maß die Tür, die zu war |
| Aufräumlauf für herrenlose Dateien (E-111) | „null Waisen" war von „null gelesene Dateien" nicht unterscheidbar, bis `{ read, owned, removed, refused }` beides trennte |
| **AK-01 in T-326** | 88/88 grün — und die sieben abgeschnittenen Kinder standen daneben, **weil das Abschneiden die gemessene Zahl verbessert** |

Der dritte ist der schärfste und steht deshalb auch am Anfang von 9.6: **Ein Meßsatz, dessen Zahl
sich beim Auftreten des Fehlers verbessert, ist nicht lückenhaft — er zeigt in die falsche
Richtung.** A1 fragt das Dokument, A2 den Rahmen; beide werden durch einen Schnitt *besser*.

**Eine Auflage, die über T-334 hinausgeht:** Die zweite Untergrenze gehört **A8 selbst** und darf
nicht aus A3 oder A5 geborgt werden — die spannen ihre Menge über andere Selektoren auf. Eine
Untergrenze, die über eine andere Menge zählt als die Zusicherung, die sie sichern soll, vergleicht
zwei Mengen. Das ist derselbe Fehler, der aus dem Aufräumlauf in E-111 beinahe einen Löschlauf
gemacht hätte (`listEmailFiles()` liefert Namen, `target` trägt Pfade). **Jede Zusicherung zählt
ihre eigene Menge.**

**Dazu zwei Fenstergrößen in 9.2**, beide mit gemessenem Grund:

- **1200 × 820** — die einzige Kombination „Kopf umgebrochen (≈ 1259) **und** Zeiterfassung noch
  zweispaltig (68 rem = 1088)". Keine der fünf alten Größen trifft sie.
- **1024 × 640** — die Größe, an der die A8-Ausnahme gemessen ist (86 px Überstand). Eine Ausnahme,
  die an keiner geprüften Größe auftritt, ist toter Text.

Und 9.4 („der Vorrat entscheidet") war eine **Anleitung**; sie ist jetzt zusätzlich zugesichert —
die zweite Untergrenze meldet einen geschrumpften Vorrat, statt ihn still hinzunehmen.

## 5 Die Lehre über das Papier selbst

Im Kopf, direkt unter dem Stand, als eigener Abschnitt:

> **Zwei Papiere, die einander bestätigen, sind keine Messung.**

Mit der Begründung, warum die Deckungsgleichheit den Irrtum **bestätigt** statt ihn aufzudecken
(gemeinsame Vorlage, gemeinsame Falle, gemeinsamer Fehlschluß), und der Arbeitsregel daraus: Ein
Satz, der eine Zahl behauptet, ist bis zur ersten Messung eine Annahme — der Prüfweg ist der Bau,
nicht die zweite Lesung.

---

## 6 Vier Berichtigungen, die nicht im Auftrag standen

Sie sind aufgenommen, weil die fünf beauftragten sie sonst in einen Widerspruch gestellt hätten oder
weil das Papier sonst einen gemessenen Stand falsch beschriebe. Jede mit ihrer Zahl, jede im selben
Zitatverfahren:

1. **3.4 — der Rinnenversatz.** Das Papier führte ihn als „hingenommen und nicht ausgeglichen, aus
   drei Gründen". Er **ist** ausgeglichen, auf genau dem Weg, den die alte offene Frage 2
   vorschlug. Grund 2 („der Ausgleich bräuchte die Rinnenbreite als Zahl") war der tragende und ist
   **eingelöst, nicht widerlegt**: `scrollbar-gutter: stable` kennt die Breite selbst. Grund 1 und 3
   bleiben als Beobachtung wahr und sind keine Rechtfertigung mehr — die Zusage war „pixelgleich",
   und 10 px sind nicht pixelgleich.
2. **3.2 — `overflow: hidden` und `padding-block-end: 0` am Rahmen.** Mit `hidden` fällt der Rahmen
   auf seinen 4-rem-Boden und schneidet die Bereichsschiene der Einstellungen ab (≈ 420 px, T-322
   R-d: Inhalt wird unerreichbar). `padding-block-end: 0` hätte 24 px unter Board und Karten
   verschoben. Dazu die zweite Sammelregel für `flex: none` **im** Laufbereich samt Meßtabelle
   (Karte „Timer" 2/168/0).
3. **8.5 — `tabIndex` und der Wortlautabgleich.** `{-1}` legt den Laufbereich nicht in die
   Tabulatorreihenfolge; gebaut ist `{0}` + `role="region"` + vorhandener Name (T-322 R-4). Und der
   E-087-Abgleich, der hier als gesichert stand, ist **E-114** geworden: elf Dateien statt einer,
   sieben rot, einschließlich der einen, die als gültig eingeschätzt war. Der Satz dazu steht jetzt
   im Papier: *Wer eine Kennung verlegt, sucht nicht ihren Wortlaut, sondern ihre Benutzung.*
4. **10, Zustand „Leer".** `justify-content: center` hätte die Karte „Vorlage und Rundung" der
   Export-Ansicht mitzentriert (AK-05); gebaut ist `margin-block: auto` an den drei Bauformen.

Dazu **zwei geschlossene offene Fragen** (1: `.list-more` — verschieden je Ansicht; 3: die 4 rem —
richtig, aber die Frage war falsch gestellt: der Rückfall hängt am **festen Teil**, und der ist auf
dem Board 537 von 588 px = **91 %** an der getragenen Untergrenze) und **eine neue** (5, oben).

---

## Kurzfassung

```
Aufgabe: T-339 — `fensterfeste-flaechen.md` auf das nachziehen, was gemessen wurde
Status: fertig
Artefakte: docs/design/fensterfeste-flaechen.md, .claude/team/reports/T-339-ui-designer.md
Zusammenfassung: Neun Stellen berichtigt, fünf beauftragt und vier beim Nachziehen gefunden, jede
  im selben Verfahren: die widerlegte Fassung bleibt als Zitat stehen, daneben steht, woran der
  Irrtum hing, und darunter die Zahl. 8.4 ist umgedreht und trägt E-113 samt der vollständigen
  Meßtabelle (4242/768 auf den Todos mit 128 Verstößen, mit der Zeile 768/768 auf allen elf) und der
  allgemeinen Regel, daß ein Bildlaufkasten der umschließende Block seiner eigenen absoluten
  Nachfahren sein muß. `scrollbar-gutter: stable` am Rahmen ist bestätigt, und die Regel dahinter
  ist neu aufgespannt: nicht „wer läuft", sondern „wer die Kante bestimmt" — damit trägt eine Regel
  den laufenden Laufbereich, den nicht laufenden Rahmen und den nie laufenden Kopf, statt drei
  Ausnahmen. `flex-basis: 10rem` bleibt örtliche Konstante ohne Token (ein Leser gegen vier bei
  `--screen-inset`; und es ist eine Meßgröße, kein Gestaltungswert). Die Umbruchschwelle ist
  **nicht** ~1067, sondern ≈ 1259 px, nachgerechnet aus T-334s eigenen Zahlen; ~1067 ist vermutlich
  vom alten Zusammenbruch bei ≈ 1089 abgelesen. Abschnitt 9 hat A8 und ein neues 9.6 mit Menge,
  Ausnahme, Flußbedingung und beiden Untergrenzen — samt drei benannten Fällen, in denen ein
  Meßsatz über eine leere oder falsche Menge in diesem Bestand grün und blind war.
Annahmen: (a) Ich habe über die fünf beauftragten Punkte hinaus vier weitere Stellen berichtigt,
  weil sie nach den fünf im Widerspruch gestanden hätten oder einen gemessenen Stand falsch
  beschrieben (3.4, 3.2, 8.5, 10) — sie stehen einzeln in Abschnitt 6 dieses Berichts, keine davon
  ändert eine Entscheidung, alle beschreiben nur den stehenden Bau. (b) Ich habe 9.2 um zwei
  Fenstergrößen erweitert (1200 × 820 und 1024 × 640); das ist eine Verschärfung der Vorschrift und
  keine Beschreibung — sie ist begründet damit, daß die neue A8-Ausnahme und der neue Kopfumbruch an
  keiner der fünf bisherigen Größen auftreten. (c) Die Schwelle ≈ 1259 px ist aus drei gemessenen
  Werten gerechnet, nicht selbst gemessen, und im Papier so gekennzeichnet — in dieser Umgebung
  steht kein Browser zur Verfügung.
Risiken: Die Zahl ~1067 steht heute in `T-334-frontend-dev.md` (Risiken und offene Frage 2) und
  geht von dort in jede Nacharbeit ein, die sie liest. Wer den Kanban-Kopf zwischen 1100 und 1259 px
  prüft und ihn dort einzeilig erwartet, findet ihn umgebrochen und meldet einen Fehler, den es
  nicht gibt — oder er prüft zwischen 960 und 1067 und hält die verbreitete Gestalt für den
  Randfall. Zweitens: `overflow: hidden` an `.screen__header`/`.screen__bar` ist eine Zusage über
  die Zukunft — wer künftig etwas in den Kopf legt, das über dessen Kante ragen soll, wird
  abgeschnitten statt gewarnt; das steht jetzt in 3.4, aber es fängt niemand automatisch.
  Drittens: Das Standardfenster 1280 hat 20,7 px Luft zur Umbruchschwelle; jede Beschriftungs- oder
  Schriftgrößenänderung im Kopf kippt es. Sicherheitsseitig nichts: Dokumentation, keine Adresse,
  kein Datenweg, kein Oberflächentext neu, geändert oder gestrichen.
Offene Fragen: (1) Die Blockendkante des festen Kopfes — reserviert `scrollbar-gutter: stable` an
  einem beidachsig `hidden`-Kasten dort zusätzlich eine Rinne, und in allen drei Engines gleich? In
  Chromium ist keine zu sehen; WebKitGTK und WebView2 sind nicht gemessen. Vorschlag unverändert:
  bei der nächsten `proof:engines`-Gelegenheit mitmessen. (2) Soll T-334s Bericht um die berichtigte
  Schwelle ergänzt werden, oder genügt die Berichtigung in meinem Papier? Die Datei gehört nicht
  mir. (3) Neue offene Frage 5 im Papier: Der Ansichtsumschalter des Kanban trägt seinen Erklärsatz
  im Bildschirmkopf (785,3 px Aktionsgruppe). Daran hängen drei unangenehme Zahlen zugleich — der
  Umbruch bei ≈ 1259, die 20,7 px Luft und die 537 von 588 px fester Teil an 960 × 640. Das ist eine
  Gestaltungsfrage, sie ändert Optik und gehörte deshalb nicht in diesen Auftrag; sie ist die
  einzige, deren Beantwortung mehrere Zahlen zugleich entspannt. Eigener Auftrag?
  (4) `fensterfeste-flaechen-fluss.md` zieht T-340 parallel nach; Abschnitt 4 dort nennt noch die
  alte Zuordnung der zugänglichen Namen (T-334 offene Frage 3). Ich habe es nicht angefaßt.
Nächster Schritt: spec-ux-reviewer über die berichtigte Fassung, mit besonderem Blick auf die
  Umbruchschwelle ≈ 1259 gegen die getragene Mindestbreite 960 — die Frage, ob der umbrochene Kopf
  als **Regelgestalt** über die halbe getragene Breite abgenommen ist, ist eine Freigabe und keine
  Feststellung. Parallel der Meßsatz an den e2e-tester: A8 und 9.6 stehen vollständig, die
  Gegenprobe ist beziffert, die zwei neuen Fenstergrößen sind begründet. Danach, als eigener
  Auftrag, offene Frage 5.
```
