# T-366 — Die beiden Todo-Tabellen-Papiere gegeneinander gemessen

**Rolle:** spec-ux-reviewer.
**Datum:** 2026-09-14.
**Gegenstand:** `docs/design/todo-tabelle-fluss.md` (T-361, ux-designer) und
`docs/design/todo-tabelle.md` (T-362, ui-designer), gemessen gegen `docs/spec.md` Abschnitt 25
(besonders A-25.7 und A-25.9), gegen `.claude/team/decisions.md` (E-081, E-087, E-099, E-111,
E-113 bis E-117) und gegen den Bestand.

**Urteil: Nacharbeit.** Blockierend: **B-1 bis B-8**. Elf weitere Befunde stehen als N-1 bis N-11.

**Methode und ihre Grenze.** In dieser Umgebung stehen weder Node noch pnpm noch ein Browser zur
Verfügung. Jeder Befund ist am **Quelltext** und an den **Papieren** gelesen; wo eine Zahl steht,
steht die Fundstelle daneben. Eine Zahl, die ich selbst gerechnet habe, ist als „gerechnet"
gekennzeichnet — E-117 gilt für diesen Bericht wie für die Papiere: ein Quelltextlauf sichert die
Bauart zu, nicht die Wirkung. Gemessen wurden die **Papiere**, nicht der entstehende Quelltext von
T-365 (T-315/T-316-Lehre).

---

## 0. Der Prüfweg, wie er vorgegeben war

### 0.1 F-1 bis F-10 — hat T-362 eine Frage von T-361 beantwortet?

| # | Frage (T-362 Abschnitt 0) | Antwort in T-361? | Hat T-362 sie trotzdem beantwortet? |
|---|---|---|---|
| F-1 | Spalten, Reihenfolge, Inhalt | ja, 3.1 | nein — 4.2 gibt nur die Breitenregel |
| F-2 | Auswahlspalte, Mehrfachauswahl | ja, 3.2 | **ja, mittelbar** — 2.2 führt `.table__select` als getragen auf, 8.1 führt `.table__row--selected` als Zustand der Todo-Tabelle auf → **N-2, N-3** |
| F-3 | Sortierung | ja, 7 | nein (2.3 „kein eigener Sortiermechanismus") |
| F-4 | Wann die Fläche aufgeht | ja, 6.2 | nein |
| F-5 | Was ohne Maus geschieht | ja, 5.3/6.2/10 | **ja, mittelbar** — die Bauformwahl in 5.3 entscheidet es mit → **B-4** |
| F-6 | Wie viele Tags in der Zelle bleiben | ja, 5.2 (**keine**, nur die Zahl) | **ja, mittelbar** — 9.4 setzt sichtbare Marken voraus → **B-8** |
| F-7 | Hinweis und „Weitere laden" | ja, 8.1/8.2 | nein (6.3 legt beide Bauformen vor) |
| F-8 | Randmarkierung der Zeile | **nein — unbeantwortet** | nein → **N-4** |
| F-9 | Doppelklick | ja, 3.5 | nein |
| F-10 | „Erledigt" als Kästchen | ja, 3.2 | nein |

### 0.2 Die Abgrenzung von T-361 — hat T-362 geliefert?

Die Abgrenzung nennt **zehn** Fragen in der Tabelle plus eine im Fließtext, nicht zwölf (N-11).

| Frage | T-362 |
|---|---|
| Spaltenbreiten, `table-layout`, `colgroup`, Mindestbreiten | Regel ja (4.1/4.2), **Zahlen nein** → **B-3** |
| Klebender Kopf, Ort des `overflow` | ja, 3.1–3.3 |
| Verankerung der Tag-Fläche: Baustein, Bibliothek, **Versatz**, Umklappstrategie, Pfeil, Schatten | Portalform ja (5.2), Gestalt ja (5.4); **Baustein an den frontend-dev delegiert** (Ü-1) → **B-4**; **Versatz, Umklappmaß, Pfeil: nicht genannt** → **N-5** |
| Zeitwerte: Absichtsverzögerung, Nachlauf | **nicht geliefert** → **N-5**, trägt SC 1.4.13 „überfahrbar" |
| Lautstärke der überfälligen Zelle | **nicht geliefert** — `DeadlineFlag` kommt in `todo-tabelle.md` nicht **einmal** vor (gemessen) → **N-5** |
| Zeilenhöhe, Dichte, Wechselfarbe, Gestalt von `--running` und `--done` | Höhe/Dichte/Zebra ja (7.1, 8.1); **`--running` und `--done` nicht genannt** → **N-5** |
| Ladeskelett | halb (8.1: `rows={6}`); „sieht trotzdem nach Tabelle aus" nicht beantwortet → **N-5** |
| Symbol neben der Zahl in der Tag-Zelle | **nicht geliefert** → **N-5** |
| Umbruchschwellen, was nachgibt | ja, 8.2 — und darin steckt **B-2** |
| Klassennamen | ja, 2.3/5.4 — und darin steckt **B-6** |

**Befund über den Prüfweg selbst:** Die Papiere haben sich an ihre Hoheit gehalten und an sechs
Stellen **eine Frage zu wenig** beantwortet, nicht eine zu viel. Die gefährliche Klasse ist hier
nicht die Übergriffigkeit, sondern die **Rückgabe**: zwei Fragen (Spaltenbudget, Ausgang beim
Bildlauf) reicht jedes Papier an das andere zurück, und beide bleiben unbeantwortet.

---

## 1. Blockierende Befunde

### B-1 Der lange Titel — beide Papiere entscheiden ihn, entgegengesetzt

`A-25.2 / A-13.1` **Screen S-02, Titelspalte**
**Abweichung:** `todo-tabelle-fluss.md` §4 (Z. 200–228) und TT-07/TT-08 (Z. 726–729) entscheiden:
**einzeilig gekürzt**, Auslassungspunkte, voller Titel im `title` am Verweis, und „die Zeilenhöhe
ist bei einem 20-Zeichen-Titel und bei einem 200-Zeichen-Titel dieselbe (± 1 px)".
`todo-tabelle.md` §4.4 (Z. 306–341) entscheidet das Gegenteil: **nicht gekürzt**, sondern
`overflow-wrap: anywhere`, „nur die seltene lange Zeile wächst", und eine Deckelung auf zwei
Zeilen ist dort **ausdrücklich abgelehnt**. TT-08 und `todo-tabelle.md` 4.4 Grund 4 schließen
einander aus; es gibt keine Bauform, die beide erfüllt.
Keine der beiden Abgrenzungslisten weist diese Frage zu — **beide** haben sie beantwortet.
**Vorschlag:** Der Orchestrator entscheidet. Sachlich trägt T-362: der Bestand behandelt den
Todo-Titel **in der Hauptrolle** schon einmal mit Umbruch (`app.css:5230`, Exporttabelle) und nur
in der **Nebenrolle** mit `.truncate` (`BookingTable.tsx:274`), und T-361 §4 räumt die Lücke des
`title`-Attributs bei Tastaturfokus selbst ein. Fällt die Entscheidung so, fallen TT-07, TT-08 und
die Begründung in §4 **im selben Auftrag** (E-081 Punkt 4). Nebenbefund zur Sachlage: `proof:clamp`
würde eine Kürzung heute **nicht** rot machen — Menge A ist an `UncappedText` aufgespannt, ein
Todo-Titel ist `ForeignText` (`apps/web/scripts/proof-clamp.mjs:41–59`). T-362 sagt das selbst; die
Entscheidung ist also nach Sache zu fällen, nicht nach dem Tor.

### B-2 Bei 960 px: TT-04 und A12 schließen einander aus

`A-25.4 / A-25.2` **Screen S-02, Tabellenfläche, getragene Untergrenze**
**Abweichung:** `todo-tabelle-fluss.md` TT-04 (Z. 719) und 10.1 (Z. 584–587): „Bei **960 px**
Fensterbreite läuft die Tabellenfläche **nicht** waagerecht … oberhalb ist er ein Befund."
`todo-tabelle.md` 4.3 (Z. 300–304) rechnet das Gegenteil aus und nennt es den bewußten Preis: „bei
960 um 298 px", und die Zusicherung **A12** (Z. 737) macht diesen Lauf zur **Bedingung für Grün**:
„Bei 960 × 640: `scrollWidth > clientWidth` — **beides**, und das Paar ist der Punkt."
Eine der beiden Zusicherungen ist bei jedem denkbaren Bau rot.
**Vorschlag:** T-362 folgen. A-25.2 verbietet den waagerechten Lauf nicht — `fensterfeste-flaechen.md`
4 nennt `.table-wrap` als einen von genau zwei erlaubten Kästen, und SC 1.4.10 nimmt
zweidimensionalen Inhalt aus. TT-04 ist dann auf 1280 zu verschieben und 10.1 zu berichtigen. Die
Gegenrichtung (TT-04 halten) ist nur um den Preis von B-3 zu haben und zieht dort sofort einen
Spaltenverlust nach sich, den TT-05 verbietet.

### B-3 Das Spaltenbudget trägt keines der beiden Papiere — und es geht nicht auf

`A-25.2 / A-13.5` **Screen S-02, alle acht Spalten**
**Abweichung:** `todo-tabelle.md` 4.3 (Z. 291–298) setzt die Auflage: „Summe der festen Spalten +
Boden der Titelspalte (**16 rem**) ≤ 60 rem", also **44 rem für die sieben übrigen Spalten
zusammen**, und verlangt für den Fall, daß es nicht reicht: „fällt eine Spalte weg oder rückt in
die zweite Zeile einer Zelle". `todo-tabelle-fluss.md` 15.1 (Z. 793–794) reicht die Zahl zurück:
„die Zahl dafür fehlt und ist zu messen". **Niemand hat sie gerechnet.**
Gerechnet aus den Breiten, die der Bestand für dieselben Inhalte führt
(`components.css:856, 867, 876, 889`): Erledigt (Kästchen 2,25 rem + `DoneFlag` „Erledigt
aufgehoben" in voller Beschriftung, die nach T-361 3.3 **nicht gekürzt werden darf**) ≈ 10,5 rem;
Call 9,5 rem (nach TT-06 **nie** gekürzt); Status ≈ 8 rem; Frist (`DeadlineFlag` = Symbol + Wort +
Datum) ≈ 10,5 rem; Tags ≈ 3,5 rem; Buchungen (`ExportSummaryStrip`) ≈ 9 rem; Aktionen (zwei
Treffer­felder) ≈ 5,5 rem. **Summe ≈ 56,5 rem gegen ein Budget von 44 rem**, mit dem Titelboden
≈ 72,5 rem gegen `min-width: 60rem`. Damit liefe die Tabelle **auch im Standardfenster**
waagerecht — und das ist genau der Zustand, den der Auftraggeber beanstandet hat.
Die drei Auflagen von T-361 sind dann gemeinsam unerfüllbar: TT-05 („keine Spalte ausgeblendet"),
TT-06 („Call nie gekürzt") und 3.3 („Erledigt aufgehoben darf nicht gekürzt werden").
**Zwei Spalten tragen dabei eine Zusage, die Kürzung verbietet, und für keine nennt ein Papier eine
Breite:** die Frist-Zelle (A-19.4/A-19.5: sichtbar, ohne das Todo zu öffnen) und die
Buchungen-Zelle (der Exportstand ist **überall** eindeutig sichtbar — die Hausregel, nicht nur
A-13.5). Eine gekürzte `ExportSummaryStrip` ist ein Verstoß gegen eine Regel, die in `CLAUDE.md`
steht, nicht bloß eine schmale Spalte.
**Vorschlag:** Die Summe **vor** T-365 rechnen, im Papier festhalten und eine der Auflagen
ausdrücklich lösen. Drei Wege stehen zur Wahl und keiner ist frei: (a) Spalte 1 und 4 zusammenlegen
(Kennzeichen und Status in `.table__primary`/`.table__secondary`, die Bauform gibt es —
`components.css:899–907`); (b) die Frist-Zelle auf das Datum ohne Zustandswort setzen, was T-361 §7
ausdrücklich verbietet; (c) TT-04 fallen lassen (siehe B-2) und den waagerechten Lauf unterhalb
1280 annehmen. Ich empfehle (c) plus (a).

### B-4 Die gewählte Bauform der Tag-Fläche trägt den Tastaturzustand P2 nicht

`A-25.5 / A-13.3 / SC 2.1.1` **Screen S-02, Tag-Fläche, Tastaturweg**
**Abweichung:** `todo-tabelle-fluss.md` 6.2 (Z. 356), 6.4 (Z. 385–391) und TT-12/TT-19 (Z. 739,
755) verlangen: die Fläche ist **fokussierbar und hat den Fokus** (P2), sie verläßt man mit
`Tabulator aus der Fläche heraus`, ihr innerer Lauf ist mit `Bild ab`, `Pos1` und `Ende`
bedienbar, und der Auslöser trägt `aria-expanded` und `aria-controls`. T-361 6.4 nennt das
ausdrücklich „die Bedingung, unter der P3 zulässig ist".
`todo-tabelle.md` 5.3 (Z. 433–445) wählt `HoverCard`, ersatzweise `Tooltip` mit `interactive`, und
delegiert die Wahl als **Ü-1** an den frontend-dev. Beide Bausteine sind nicht-fokussierbare
Anzeigen: Der Fokus bleibt am Auslöser, der Inhalt nimmt ihn nicht an; bei `role="tooltip"` ist
`aria-expanded` am Auslöser zudem das falsche Muster (ein Tooltip wird über `aria-describedby`
angebunden, nicht über `aria-controls`). Mit keinem der beiden sind TT-19, der P2-Ausgang
„Tabulator aus der Fläche heraus" und der Hineinweg in die laufende Fläche erreichbar.
**Damit ist Ü-1 keine Bauentscheidung, sondern die Entscheidung, ob eine zugesagte Fläche
einlösbar ist.** Sie gehört nicht in den Bau.
**Vorschlag:** Die Wahl im Papier treffen, nicht an Ü-1 hängen. Wer T-361s P2 halten will, braucht
einen nicht-modalen **Popover** (fokussierbarer Inhalt, `aria-expanded`/`aria-controls` am
Auslöser) mit zusätzlicher Zeigeröffnung — dieselbe Familie, dieselbe Portalform, dieselbe
`.popover-layer`. Wer bei `HoverCard` bleibt, nimmt P2, TT-19 und den inneren Lauf (P3) zurück und
deckelt die Fläche statt dessen in der Höhe nicht, oder er beschränkt sie auf so wenige Marken,
daß kein Lauf entsteht. Beides ist vertretbar; das Papier muß eines sagen.

### B-5 Bildlauf bei offener Fläche: T-361 verlangt den Ausgang, den T-362 rot nennt

`A-25.3 / SC 1.4.13` **Screen S-02, Tag-Fläche im Laufbereich**
**Abweichung:** `todo-tabelle-fluss.md` 6.2 (Z. 363–366): „Läuft der Laufbereich in P2 so weit, daß
der Auslöser das Sichtfeld verläßt, **bleibt die Fläche stehen**", und TT-18 (Z. 753–754): Zeiger →
schließt, Tastatur → bleibt. `todo-tabelle.md` 6.2 (Z. 524–535) sagt: „Sie bleibt nicht offen, wenn
ihr Anker nicht mehr sichtbar ist", und führt genau diesen Zustand als **falsch** auf: „Fläche steht
sichtbar über dem Kopf, ihr Anker ist weg."
Dazu ein zweiter Befund an derselben Stelle: Die Zusicherung **A14** (Z. 739) ist
modalitätsblind — „geschlossen **oder** mitgewandert" ist unter TT-18 in beide Richtungen grün.
**A14 mißt TT-18 nicht**, in keiner der beiden Richtungen. Eine Zusage ohne Wächter ist in diesem
Bestand dreimal grün und blind gewesen (T-362 9.3 sagt es selbst).
**Vorschlag:** T-362 folgen. SC 1.4.13 „beständig" verlangt, daß **kein Zeitgeber** schließt — nicht,
daß eine Fläche einen weggerollten Anker überlebt; T-361 überdehnt die Norm an dieser einen Stelle.
TT-18 ist zu ändern auf „Zeiger: schließt. Tastatur: schließt, und der Fokus steht danach auf dem
Auslöser", und A14 ist um die Modalität zu erweitern, sonst mißt sie die Entscheidung nicht.

### B-6 `.todo-row`: überlebt als Haken oder wird gestrichen — zwei Aufträge an denselben Entwickler

`A-25.7 / E-114 / E-081 Punkt 4` **Screen S-02, Zeilenbezeichner**
**Abweichung:** `todo-tabelle-fluss.md` §13 (Z. 685–686) macht es zur **Auflage**: „Die Klassen
`todo-row` und `todo-row__title` überleben den Umbau als Haken am `<tr>` beziehungsweise am
Titelverweis", und TT-30 (Z. 783) verlangt, daß die Prüffälle grün bleiben, **ohne angefaßt zu
werden**. `todo-tabelle.md` 7.2 (Z. 611–613) und 10.2 Punkt 4 (Z. 814–816) ordnen das Gegenteil an:
`.todo-row` wird gestrichen, samt den beiden `theme-palettes`-Einträgen — und 10.1 (Z. 797–800)
legt fest, daß die Fundstellen **nicht** nebenbei repariert werden, sondern in der nächsten Welle
an den e2e-tester gehen. Das entscheidet, ob `pnpm test:e2e` nach T-365 grün ist.
**Nebenbefund zur Zählung, gemessen:** In `tests/e2e/**` stehen **12 lebende Fundstellen in 8
Dateien** (kanban 103; foreign-title-display 53; midnight-redraw 78, 90; todo-revival 190 sowie ein
Kommentar in 192; focus-return-after-dialog 118; tag-input 212, 213; attachment-open-commands 238;
deadline-lifecycle 87, 167, 194). **T-362 §10.1 zählt richtig; T-361 §13 schreibt „neun Stellen in
acht Dateien" und listet in derselben Tabelle zwölf Zeilennummern.** Die Prosa ist falsch, die
Tabelle richtig — und der Bericht T-361 trägt die falsche Zahl in den „Nächsten Schritt" weiter.
**Vorschlag:** T-361s Auflage übernehmen. Sie ist billig und E-114-konform: die Prüffälle fragen
nach einem Kasten mit einem Text darin, und den gibt es weiterhin, nur als `<tr>`. Dann sind
`todo-tabelle.md` 7.2 und 10.2 Punkt 4 zu berichtigen — **und die Frage aus 13 zweiter Spiegelstrich
wird dadurch scharf statt gegenstandslos:** bleibt `.todo-row` am `<tr>`, greifen
`theme-palettes.css:464/469` weiter, und eine Kartenregel (Rahmenfarbe, Hintergrund) auf einer
Tabellenzeile verhält sich anders als auf einer Karte. Wer die Klasse behält, muß den
Paletteneintrag trotzdem anfassen — im selben Auftrag.

### B-7 A-25.9 zählt drei Gestaltänderungen auf; die Umstellung verlangt sechs

`A-25.9 / A-25.7` **Spezifikation, Abschnitt 25**
**Abweichung:** A-25.9 (`docs/spec.md:542`) deckt „Ihre Kopfzeile, ihre Spaltenüberschriften und
der zugängliche Name des Tag-Auslösers". A-25.7 (`:541`) steht unverändert daneben und ist
abschließend. Die beiden Papiere verlangen **sechs** Gestaltänderungen; drei davon sind ungedeckt:

1. **Die Tabellenunterschrift** (`<caption>`). T-361 §12 Nr. 10 (Z. 632) kennzeichnet sie selbst als
   die einzige der zehn Zeichenketten, die **neu** ist („**nein** — ein neuer Satz"). Sie ist weder
   Kopfzeile noch Spaltenüberschrift noch der Name des Tag-Auslösers. **Ungedeckt.**
2. **Der Hinweis auf ausgeblendete erledigte Todos wandert in den festen Teil** und rollt nicht mehr
   mit (T-361 8.1, Z. 462–491). Das ist eine sichtbare Gestaltänderung außerhalb der Tabelle.
   **Ungedeckt.**
3. **„Weitere laden" wird der Tabellenfuß** (T-361 8.2, Z. 493–499). Dasselbe. **Ungedeckt.**
4. Die Tabellenform selbst — gedeckt.
5. Die Spaltenköpfe — gedeckt.
6. Der Name des Tag-Auslösers — gedeckt.

Dazu zwei mittelbare Gestaltänderungen, die keines der Papiere als solche führt: der Wegfall von
`.todo-row__tags { display: none }` unter 68 rem (`app.css:4890`, ein **Gewinn**, aber eine
Änderung) und das Zebra in `zen` und `lines` (N-9).
**Vorschlag:** A-25.9 um einen Halbsatz ergänzen, etwa: *„… sowie die Tabellenunterschrift, die
ihren zugänglichen Namen trägt; der Hinweis auf ausgeblendete erledigte Todos steht dabei im festen
Teil und der Nachladeknopf als Fuß der Tabelle."* Ein Satz, und die drei Lücken sind zu. Ohne ihn
baut T-365 an denselben drei Stellen ungedeckt, die OF-1 gerade geschlossen hat — und das ist die
Fehlerklasse, nicht die Ausnahme davon.

### B-8 A-25.9 „die übrigen" setzt sichtbare Marken voraus; T-361 zeigt keine

`A-25.9` **Spezifikation, Abschnitt 25, und `todo-tabelle.md` 9.4**
**Abweichung:** A-25.9 schließt: *„Nicht alle Tags eines Todos müssen dauerhaft sichtbar sein — **die
übrigen** erscheinen auf Anforderung."* „Die übrigen" setzt eine nichtleere sichtbare Teilmenge
voraus. `todo-tabelle-fluss.md` 5.2 (Z. 250–276) entscheidet das Gegenteil und begründet es
sorgfältig: sichtbar bleibt **die Zahl**, keine einzige Marke — „die erste Marke" ist ausdrücklich
verworfen, weil die Reihenfolge von `todo.tagIds` die Speicherreihenfolge ist und die Spaltenbreite
sonst an den Daten hängt. Unter dieser Entscheidung erscheinen **alle** Tags auf Anforderung, nicht
„die übrigen".
**Derselbe Irrtum steckt ein zweites Mal im Meßsatz:** `todo-tabelle.md` 9.4 (Z. 759–760) verlangt
für den Vorrat „ein Todo mit **mehr Tags, als die Zelle zeigt** — sonst gibt es keinen Auslöser".
Nach T-361 gibt es den Auslöser an **jeder** Zeile mit mindestens einem Tag; der Vorrat mißt sonst
gegen eine Voraussetzung, die die Entscheidung aufgehoben hat. Die Hausregel gegen die leere Menge
(E-111) fängt das nur, wenn sie auch auf den Auslöser angewandt wird.
**Vorschlag:** In A-25.9 „die übrigen" durch „sie" ersetzen. In `todo-tabelle.md` 9.4 die
Vorratszeile auf „ein Todo mit mindestens einem und ein Todo mit mehr Tags, als die Fläche ohne
eigenen Lauf faßt" ändern. Beides ist billig — der Punkt ist, daß **zwei unabhängige Papiere
denselben falschen Vorgriff enthalten**, und genau davor warnt der Auftrag: Übereinstimmung ist kein
Nachweis.

---

## 2. Weitere Befunde

### N-1 Zwei Tabellen derselben Familie, entgegengesetztes Verhalten am Spaltenkopf

`A-25.9 / A-13.1` **Screen S-02 gegen S-06.** A-25.9 verlangt die Tabelle „nach demselben Muster wie
die Buchungsübersicht". Dort **sind** drei Kopfzellen Knöpfe mit `aria-sort` und Pfeilsymbol
(`BookingTable.tsx:117–122, 198–212`), darunter ausgerechnet **„Status"** — ein Wort, das die
Todo-Tabelle als **nicht** sortierbaren Kopf führt (T-361 §7, TT-03). Gleiches Aussehen, gleiche
Wörter, verschiedene Bedienbarkeit. T-361 begründet die Entscheidung gut (ein zweites Stellglied für
einen vorhandenen Zustand ist ein Fehler), behandelt aber die **Affordanz** nicht.
**Vorschlag:** Einen Satz ins Papier: die Kopfzellen der Todo-Tabelle tragen weder `.table__sort`
noch Pfeil noch `--hit-target-min`, damit der Unterschied sichtbar ist, bevor jemand klickt. TT-03
mißt heute nur die Abwesenheit von `aria-sort`.

### N-2 Das Erledigt-Kästchen in Spalte 1 liest sich wie eine Auswahl

`A-13.1 / I-03` **Screen S-02, Spalte 1.** T-361 3.2 behandelt das Risiko vollständig — aber nur
seine **Entwicklerseite** (R-1: wer `BookingTable` kopiert, kopiert `aria-selected` mit). Die
Nutzerseite bleibt: In `BookingTable` und `ExportGroups` ist die erste Spalte mit Kästchen **die
Auswahl**; in der Todo-Tabelle ist dasselbe Bild eine Zustandsänderung, und ein Fehlklick markiert
ein Todo als erledigt. Gemildert durch das Zurücknehmen (`undoDone.ts`), nicht aufgehoben.
**Vorschlag:** In 3.2 einen Satz zur sichtbaren Unterscheidbarkeit ergänzen (der Wortkopf allein
trägt ihn nicht, wenn die Spalte sonst gleich aussieht).

### N-3 T-362 führt einen Zustand, den T-361 verbietet

`A-25.7` **`todo-tabelle.md` 8.1, Z. 640 und 2.2, Z. 101.** Die Zustandsliste führt „**Zeile:
ausgewählt** — `.table__row--selected`" als Zustand der Todo-Tabelle auf, und die Bestandsliste
führt `.table__select` („Auswahlspalte, 2,25 rem") als das, was die Todo-Tabelle „unverändert
trägt". TT-02 verbietet jede Auswahl im ganzen Baum der Ansicht.
**Vorschlag:** Beide Zeilen berichtigen. Für Spalte 1 eine eigene Klasse (`.todo-col--done`), nicht
`.table__select` — ein Bezeichner, der „select" heißt und nichts auswählt, ist genau die Sorte Rest,
gegen die `todo-tabelle.md` 7.2 selbst argumentiert.

### N-4 F-8 ist unbeantwortet geblieben

`A-13.5` **Screen S-02, Randmarkierung.** `todo-tabelle.md` 8.1 (Z. 643) reicht die vorhandene Regel
`.table__row > td:first-child { border-inline-start: 3px solid … }` (`components.css:825–843`) an
T-361 weiter: „**wonach** sie sich richtet, ist F-8". T-361 beantwortet in 3.5 und 9.3 nur die
**Zeilenfärbung** und nennt die Randmarkierung mit keinem Wort. Eine im Bestand vorhandene Regel
steht damit ohne Anweisung — der frontend-dev muß raten.
**Vorschlag:** T-361 ergänzt einen Satz. Aus 3.5 folgt zwanglos: keine Randmarkierung, `--running`
bleibt das einzige Zeilenmerkmal.

### N-5 Fünf Fragen der Abgrenzung hat T-362 nicht beantwortet

`A-25.7` **`todo-tabelle.md`, Abschnitt 5 und 8.** Gemessen an der Abgrenzung von T-361 fehlen:
(a) die **Zeitwerte** der Tag-Fläche (Absichtsverzögerung, Nachlauf) **und der Versatz** — ohne sie
hat SC 1.4.13 „überfahrbar" keinen Mechanismus, und TT-13 mißt etwas, das niemand gebaut hat;
(b) die **Lautstärke der überfälligen Zelle** — `DeadlineFlag` kommt in `todo-tabelle.md` kein
einziges Mal vor, obwohl T-361 §7 den Boden gesetzt und ausdrücklich auf T-362 gewartet hat;
(c) die **Gestalt von `--running` und `--done`** am `<tr>` — nicht trivial, weil `.table__row` sein
Zebra über `:nth-child(even)` trägt und eine Zeilenfärbung dagegen gewinnen muß, eine Farbe am `<tr>`
aber von jeder Zellfarbe verdeckt wird;
(d) das **Symbol** neben der Zahl in der Tag-Zelle;
(e) das **Ladeskelett**, das „keine Kopfzeile hat und trotzdem nach Tabelle aussieht" (T-361 15.4) —
8.1 nennt nur `rows={6}`.
Dazu: T-362 5.4 setzt keine Auflage „**verdeckt nie den eigenen Auslöser**" und keinen Versatz;
TT-17 (SC 2.4.11) ist damit ebenfalls ohne Mechanismus.
**Vorschlag:** Die fünf Punkte in `todo-tabelle.md` nachtragen, bevor T-365 sie beim Bauen
stillschweigend entscheidet.

### N-6 Der Hinweis kann so nicht in den festen Teil

`A-25.3` **Screen S-02, Z0 und fester Teil.** `HiddenDoneNotice` wird heute **innerhalb** der Kinder
der `AsyncBoundary` gezeichnet und liest `value.totalWithDone - value.page.total`
(`TodoListScreen.tsx:453, 496`). Im festen Teil steht dieser Wert nicht zur Verfügung. T-361 9
verspricht ihn dort aber für **Z0** („Hinweis (falls Zahl bekannt)"). Entweder wird die Zahl in den
Bildschirmzustand gehoben — eine Datenflußänderung, die in den Auftrag gehört — oder die Zusage in
Z0 fällt. Keines der beiden Papiere nennt es.
**Vorschlag:** Im Auftrag an T-365 ausdrücklich benennen, welcher der beiden Wege gilt.

### N-7 Ein vorhandener Kommentar wird durch den Umbau unwahr

`E-081 Punkt 4` **`TodoListScreen.tsx:440–443`.** Der Kommentar begründet ausdrücklich, warum der
Hinweis **und** „Weitere laden" mitlaufen: „Er erklärt die **Liste** und steht unmittelbar über ihr
… fest wäre es eine Leiste, die es heute nicht gibt" (T-322 4.2). T-361 8.1 und 8.2 kehren beides
um. Nach der Hausregel gehören die Sätze über eine Fläche in denselben Auftrag wie ihre Änderung.
`todo-tabelle.md` 10.1 zählt die Kommentare in `app.css:2124`, `components.css:1115` und
`viewport-layout.css:340` auf — **diesen** nicht.
**Vorschlag:** In die Übergabe an T-365 aufnehmen.

### N-8 Drei sichtbare Zeichenketten fallen weg, und die Zählung in §12 nennt sie nicht

`A-25.7 / E-087` **Screen S-02, Zeile.** T-361 §12 (Z. 635) schreibt: „Kein Text fällt weg." Weg
fallen aus dieser Ansicht: das Wort **„Call"** vor der Nummer (`TodoRow.tsx:75`), der Überlaufzähler
**`+n`** (`:106`) und bis zu **drei sichtbare Tag-Namen** (`:98–105`). Die Liste hat zehn Zeilen;
richtig wären dreizehn Einträge — zehn neue und drei entfallende.
**Gemessen, und der Schaden ist klein:** Kein Prüffall hängt an „Call <Nummer>" in der Zeile oder an
`+n` (`git grep` plus Lauf über `apps/*/src`, `packages/*/src`, `tests/`); das Wort „Call" bleibt im
Erzeugnis (`GlobalSearch.tsx:71`, `TodoDetailScreen.tsx:276`, künftig der Spaltenkopf). Der Befund
ist die **Zählung**, nicht der Verlust — und A-25.9 schweigt zur Wegnahme, während A-25.7 zweite
Hälfte („und fällt keiner weg") unverändert gilt.
**Vorschlag:** §12 berichtigen und den Halbsatz aus B-7 so fassen, daß er die Verlegung mitdeckt.

### N-9 OF-2 ist gemessen beantwortbar: ja

`A-21.3 / A-13.2` **Paletten `lines` und `zen`.** Gemessen an `theme-palettes.css`: `.todo-row` ist
im **ganzen** Palettenblatt der einzige Zeilenbezeichner — es gibt sonst keine Regel auf `*-row`,
`*-list` oder `*-item`; die Zeilen 464 und 469 sind die einzigen Strukturregeln beider Paletten,
alles übrige sind Tokenblöcke (`:130–168`, `:306–344`). Nach der Streichung haben `lines` und `zen`
**keine** Regel mehr auf Zeilenebene. Wirkung in `zen`: die Liste steht heute flach auf
`--bg-canvas` ohne Schatten; die Tabelle bringt `--bg-surface` plus Zebra `--bg-surface-alt`
(`components.css:806–811`) — ein sichtbarer Gestaltwechsel ausgerechnet in der Palette, deren Zweck
die Ruhe ist (A-13.2). `todo-tabelle.md` 7.2 hält das für gedeckt, weil die Buchungstabelle dieselbe
Optik schon zeigt; das trägt für die **Bauart**, nicht für die **Wirkung** — dieselbe Grenze, die
T-362 9.1 selbst zieht (E-117).
**Vorschlag:** visual-qa mißt `zen` und `lines` an der Todo-Ansicht **vor** der Freigabe, nicht
danach.

### N-10 R-7 ist richtig eingeordnet, aber unterzählt

`E-087 / A-13.1` **Screen S-02, Filterleiste und Kopfzeile.** T-361 R-7 behandelt „Status" und
„Tags" als Prüffallproblem, nicht als UX-Fehler. **Das ist richtig:** Filterbeschriftung und
Spaltenkopf stehen in verschiedenen Bereichen, tragen verschiedene Rollen (`combobox` gegen
`columnheader`) und werden von Hilfsmitteln unterschieden. Zwei Berichtigungen dazu:
1. **Es sind vier Wortlaute, nicht zwei.** „Frist" steht künftig als Filterbeschriftung **und** als
   Spaltenkopf, „Erledigt" als Filterchip, als Menüeintrag, als Spaltenkopf **und** als `DoneFlag`
   in derselben Spalte. Die E-087-Suche vor dem Bau muß alle vier umfassen.
2. **Eine echte, wenn auch kleine UX-Kosten steht in Spalte 1:** Kopf „Erledigt" über einer Zelle,
   die „Erledigt" sagt. Eine Vorlesehilfe liest im Tabellenmodus „Erledigt, Erledigt"; in Spalte 6
   entsprechend „Tags, 11 Tags". Den Namen des Tag-Auslösers auf die Zahl allein zu kürzen wäre
   **schlechter** — im Fokusmodus wird die Kopfzelle nicht zuverlässig mitgelesen. Also: Doppelung
   annehmen, aber den Satz dazu ins Papier schreiben, statt sie zu übersehen.

### N-11 Genauigkeit — vier Stellen, an denen die Papiere ihren eigenen Maßstab verfehlen

1. T-361 §12 Nr. 10 zitiert `BookingTable.tsx:473` für die Unterschrift; sie steht in
   `BookingsScreen.tsx:473` (`BookingTable.tsx:177` nimmt sie entgegen).
2. T-361 5.2 zitiert `TodoListScreen.tsx:206` für „Unbekannt"; es ist `:207`.
3. T-361 §13 „neun Stellen" gegen zwölf gelistete und zwölf gemessene (B-6).
4. Die Abgrenzung nennt **zehn** Fragen in der Tabelle und eine im Fließtext; der Bericht T-361 und
   der Auftrag T-366 sprechen von **zwölf**. Wer die Liste abhakt, hakt eine Menge ab, die es nicht
   gibt.

---

## 3. Barrierefreiheit — die drei Zusagen aus SC 1.4.13, einzeln geprüft

| Teilsatz | T-361 Abschnitt 6 | Trägt der Mechanismus aus T-362 Abschnitt 5? |
|---|---|---|
| **abweisbar** | 6.3: `Escape` schließt, ohne Bildlaufstelle und Zeiger zu ändern; `Escape` gehört der Fläche und nicht einem Dialog dahinter (Bremse wie `Menu.tsx:76`) | **teilweise.** 5.3 B-5 nennt die Anforderung, 5.4 schweigt zum Eigentum an `Escape`. Beide Kandidaten schließen bei `Escape`; die Bremse gegen den Dialog dahinter ist nicht zugesagt |
| **überfahrbar** | 6.3: der Zeiger kommt vom Auslöser in die Fläche, ohne daß sie schließt; **wie**, entscheidet T-362 | **nein.** T-362 liefert weder Nachlauf noch Versatz noch die Aussage „lückenlos" (N-5a). Die eine Zahl, die diese Zusage trägt, fehlt auf beiden Seiten |
| **beständig** | 6.3: kein Zeitgeber, weder in P1 noch in P2 | **ja** — mit der Einschränkung aus B-5: T-361 legt „beständig" zusätzlich so aus, daß die Fläche einen weggerollten Anker überlebt. Das verlangt die Norm nicht, und T-362 nennt es rot |

**Deckt der Tastatur- und Fokusfluß aus T-361 Abschnitt 10 die Bauform aus T-362?** **Nein** —
siehe **B-4**. Die fünf Halte je Zeile (10, Z. 557) und der Weg über den Laufbereich (Z. 559–560)
tragen; der Halt am Tag-Auslöser trägt ebenfalls. Was **nicht** trägt, ist der Weg **in** die Fläche
(P2) und der innere Lauf (P3/TT-19) mit einem `HoverCard` oder `Tooltip`.

**Was zusätzlich geprüft und in Ordnung ist:** SC 2.1.1 (der Knopf ist der Weg, Hover die Zugabe —
T-361 5.3, der stärkste Satz beider Papiere); SC 2.5.8 (24 × 24, TT-09 — paßt auch in die
kompakte Dichte mit `--row-height: 2rem`); SC 1.4.1 (TT-27, Graustufenprobe — **abhängig von N-5b**,
weil die Lautstärke der Zelle nicht entschieden ist); SC 2.4.11 (TT-17 — **ohne Mechanismus**, N-5);
A-25.5 (der Laufbereich heißt weiter „Todos", `viewport-fit.spec.ts:873` bleibt unangetastet,
TT-29).

---

## 4. Die kritischen Klickpfade

| Pfad | Befund |
|---|---|
| **Timer auf erledigtem Todo** (A-2.5, I-05, E-027) | **getragen.** T-361 §11 und TT-26: Kästchen leer, `DoneFlag` „Erledigt aufgehoben" in voller Beschriftung, Durchstreichung weg, Zeile `--running`, Toast nennt beides, und die Zeile bleibt an ihrer Stelle. Geprüft gegen die Ordnung: sortiert wird nach `dueDate` oder `recent` (`TodoListScreen.tsx:119, 146`), nicht nach dem Erledigt-Kennzeichen — die Zusage „an derselben Stelle" ist haltbar. Der Wortlaut des Hinweises, der genau diesen Pfad erklärt (`:582–584`), bleibt zeichengleich (TT-23) |
| **Exportstatus überall sichtbar** | **gefährdet durch B-3.** Spalte 7 trägt `ExportSummaryStrip`, aber keine Seite nennt ihre Breite, und T-362 4.3 sieht für den Engpaß ausdrücklich vor, daß eine Spalte wegfällt oder in eine zweite Zellzeile rückt. Die Spalte trägt eine Zusage, die Kürzung nicht verträgt |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | **unberührt.** Die Tabelle bekommt keine Notizspalte; A-3 und A-14 bleiben unangetastet. Ausdrücklich vermerkt, weil eine achtspaltige Tabelle die naheliegende Stelle wäre, an der eine interne Notiz sichtbar würde |
| **Vier Ebenen tiefer Ordnerbaum** (A-4.3, A-4.4, A-13.3) | **verbessert.** T-361 5.4 und TT-21: jede Marke in der Fläche mit **vollem** Pfad (`size="md"` statt `sm`), also ist „Nord" aus „Kunden / Nord" von „Nord" aus „Standorte / Nord" unterscheidbar — heute in der Zeile nicht. Selbstverschiebung ist in dieser Ansicht kein Thema |
| **Standard-Tags auf jedem Erstellungsweg** (A-9.1, I-12) | **getragen**, ohne Abzeichen (T-361 5.4, OF-5 offen). Sie zählen in der Zahl mit — das ist die richtige Wahl, weil die Zahl aus `todo.tagIds.length` kommt (TT-10) |
| **Vorlageneditor mit Vorschau** | **unberührt** |

---

## 5. Was gut ist und im Zweifel nicht angefaßt werden sollte

Damit die Nacharbeit nicht die stärksten Stellen mitreißt:

- **T-361 5.2/5.3** — die Zahl aus `todo.tagIds.length` statt aus den aufgelösten Marken behebt
  einen stillen Fall des Bestands (`TodoListScreen.tsx:514–516` wirft nicht auflösbare Kennungen
  weg; eine Zeile mit elf Tags sieht bei `StructureContext` auf `error` heute aus wie eine ohne).
  TT-10 mißt genau das. Gemessen und bestätigt.
- **T-361 3.2** — die drei Auflagen gegen eine Auswahl, die es nicht gibt. Die schärfste Stelle
  beider Papiere und sachlich richtig.
- **T-362 3.1** — die Bedingung, unter der der klebende Kopf überhaupt klebt, samt der Erklärung,
  warum `components.css:755` jahrelang wirkungslos war. Das ist der Satz, der den Unterschied
  zwischen „steht im Stilblatt" und „wirkt" trägt.
- **T-362 9.2** — die Berichtigung der A8-Fehllesung aus dem eigenen Auftrag, am Quelltext belegt
  (`viewport-fit.spec.ts:405`). Ein Papier, das seinen Auftrag widerlegt, statt ihn abzuschreiben.
- **T-362 9.3 Gegenprobe** — sechs Zusicherungen, jede einmal rot gefahren. Ohne sie wäre „alles
  grün" wieder eine Behauptung über einen Wächter.

---

## 6. Urteil

**Nacharbeit.** Blockierend und vor dem Weiterbau an T-365 zu entscheiden:

| ID | Kürzestfassung | Entscheidet |
|---|---|---|
| **B-1** | Titel: kürzen (T-361) oder umbrechen (T-362) | Orchestrator |
| **B-2** | Waagerechter Lauf bei 960 px: TT-04 gegen A12 | Orchestrator |
| **B-3** | Spaltenbudget ≈ 56,5 rem gegen 44 rem — niemand hat gerechnet | Orchestrator, danach beide Papiere |
| **B-4** | `HoverCard`/`Tooltip` trägt P2, TT-12 und TT-19 nicht; Ü-1 delegiert eine Zusage | ui-designer, vor dem Bau |
| **B-5** | Bildlauf: TT-18 verlangt den Ausgang, den T-362 rot nennt; A14 mißt ihn nicht | Orchestrator |
| **B-6** | `.todo-row` überlebt oder fällt — zwei Aufträge an denselben Entwickler | Orchestrator |
| **B-7** | A-25.9 deckt Unterschrift, festen Hinweis und Tabellenfuß nicht | Orchestrator, `docs/spec.md` |
| **B-8** | A-25.9 „die übrigen" setzt sichtbare Marken voraus; derselbe Irrtum in T-362 9.4 | Orchestrator, `docs/spec.md` |

**B-1, B-2, B-3, B-5 und B-6 sind Widersprüche zwischen den Papieren** — der frontend-dev kann sie
nicht auflösen, er kann nur eines von beiden bauen und das andere brechen. **B-4 ist eine Zusage
ohne Bauform. B-7 und B-8 sind Deckungslücken** und dieselbe Fehlerklasse, die OF-1 gerade
geschlossen hat.

**Zur Lage:** T-365 läuft parallel. Von den acht blockierenden Befunden trifft die Mehrzahl den
Bau unmittelbar — B-1 (Titelzelle), B-3 (`<colgroup>`), B-4 (Bausteinwahl), B-6 (Klassennamen) sind
Entscheidungen, die T-365 in dem Moment fällt, in dem er sie baut. Je später sie entschieden werden,
desto mehr wird zweimal gebaut.
