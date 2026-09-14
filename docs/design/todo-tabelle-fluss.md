# Die Todo-Liste wird eine Tabelle — der Fluß

**Aufgabe:** T-361, nachgezogen in **T-374**.
**Verfasser:** ux-designer.
**Stand:** 2026-09-14, **zweite Fassung** — nach dem Abgleich beider Papiere (T-366), den
Entscheidungen des Orchestrators zu B-1 bis B-8 und den Messungen des Baus (T-365).
**Schwesterpapier:** `docs/design/todo-tabelle.md` (ui-designer, T-362), inzwischen gelesen und
gegen dieses Papier gemessen. Fünf der acht blockierenden Befunde gingen **gegen** dieses Papier;
sie sind hier eingearbeitet und nicht weginterpretiert.

**Auftrag des Auftraggebers, wörtlich:** *„baue hier bitte eine Tabelle hin. Wie auf den anderen
Seiten. Plus Man muss nicht alle Tags sehen, diese können auch ruhig angezeigt werden, wenn man
darüber hovert."*

**Deckung.** A-13.1 bis A-13.9 (Schnell erfassbar, wenig visuelle Unordnung, tiefe
Tag-Hierarchien verständlich, Exportstatus eindeutig), Abschnitt 15 (Tabellen ausdrücklich
genannt, Leer-, Lade-, Hover- und Fehlerzustände ausdrücklich verlangt), A-25.1 bis A-25.9 in der
Fassung vom 2026-09-14, E-112, E-113, E-115, E-116, E-117, E-023, E-027, E-039, A-2.5,
A-19.4/A-19.5/A-19.20.
**Die Deckungslücke aus der ersten Fassung ist geschlossen:** A-25.9 gibt es seit dem 2026-09-14,
und sie ist am selben Tag ein zweites Mal nachgeschärft worden. Was das für Abschnitt 12 heißt,
steht dort.

**Hoheit.** Dieses Papier und die Berichtigungen in `docs/design/fensterfeste-flaechen-fluss.md`.
Kein Produktivcode, kein CSS, keine Datei unter `apps/**` oder `packages/**`, keine Änderung an
`docs/spec.md`, nicht `docs/design/fensterfeste-flaechen.md` und nicht `docs/design/todo-tabelle.md`.

---

## 0. Was die zweite Fassung ändert — und auf welche Entscheidung jede Änderung zurückgeht

E-113 ist in dieser Reihe **zweimal** eingetreten: zwei getrennt vergebene Designaufträge haben
denselben Gegenstand entgegengesetzt entschieden, und es fiel erst auf, als ein Prüfer die Papiere
gegeneinander maß. Damit der nächste Abgleich billig wird, steht die Zuordnung hier vorn und nicht
verstreut im Text. Wer prüfen will, ob dieses Papier eine Entscheidung eingearbeitet hat, liest
diese Tabelle und springt.

| Entscheidung | Ausgang | Was hier geändert ist |
|---|---|---|
| **B-1** Langer Titel | **gegen dieses Papier** | §1.3 berichtigt (Haupt- gegen Nebenrolle), §3.1 Spalte 3 und 4, §4 neu geschrieben, **TT-07 und TT-08 gestrichen**, Ersatz TT-31/TT-32 |
| **B-2** Waagerechter Lauf unter 1280 | **gegen dieses Papier** | **TT-04 von 960 auf 1280**, 10.1 Schlußauflage berichtigt, 10.2 nachgezogen |
| **B-3** Spaltenbudget | in dieses Papier hinein aufgelöst | 15.1 trägt jetzt die **gemessene** Zahl (43,5 rem) statt einer zurückgereichten Frage; die Lehre steht dort |
| **B-4** Bauform der Tag-Fläche | **für dieses Papier** | P2, TT-12 und TT-19 gehalten; 5.3, 6.1 und 6.4 tragen die gebaute Form nach (nicht-modaler Popover) |
| **B-5** Bildlauf bei offener Fläche | **gegen dieses Papier** | 6.2 P1/P2, der Absatz „Warum …" neu, 6.3 Zeile „beständig" berichtigt, **TT-18 umgeschrieben**, TT-34 neu |
| **B-6** `.todo-row` überlebt | **für dieses Papier** | §13: Zählung berichtigt (**zwölf**, nicht neun), Meßergebnis aus T-365 eingetragen, TT-30 nachgezogen |
| **B-7/B-8** A-25.9 nachgeschärft | erledigt, betrifft §12 | §12 neu gezählt (dreizehn Einträge), OF-1 geschlossen, die **Lehre** zum falschen Vorgriff eingetragen |
| **N-1** Affordanz der Kopfzellen | Ergänzung | 7 und **TT-03** geschärft |
| **N-2** Erledigt-Kästchen liest sich wie Auswahl | offen bei visual-qa | 3.2 sagt, **welche** Antwort dieser Fluß verlangt, ohne sie vorwegzunehmen |
| **N-4** Randmarkierung | Ergänzung | 3.5 und 9.3, **TT-33** neu |
| **N-6** Hinweis im festen Teil | entschieden: zweiter Weg | §9 Z0/Z4 berichtigt, 8.1 ergänzt, R-11 neu |
| **N-8** Drei entfallende Zeichenketten | Ergänzung | §12 zählt sie jetzt mit |
| **N-10** Vier doppelte Wortlaute | Ergänzung | §12 Schlußabsatz und R-7 |
| **N-11** Genauigkeit | Berichtigung | §12 Nr. 10 (`BookingsScreen.tsx:473`), 5.2 (`:215`), §13 (zwölf), Abgrenzung (elf Fragen) |
| **TT-05, TT-06, 3.3** | nach der Messung erfüllbar | einzeln geprüft, nicht pauschal stehengelassen — 3.3 und 14 tragen die gemessenen Zahlen |
| **TT-24 / R-3** | gemessen: 73,5 %, kein Befund | 8.1 und R-3 |

**Was ausdrücklich nicht geändert ist:** 2, 3.2 (die drei Auflagen gegen eine Auswahl, die es nicht
gibt), 5.2 (die Zahl aus `todo.tagIds.length`), 5.3 (der Knopf ist der Weg, Hover die Zugabe), 7
(keine Zeilenfärbung für Überfälligkeit), 11 (die Pflichtflows). T-366 Abschnitt 5 nennt drei davon
ausdrücklich als das, was die Nacharbeit nicht mitreißen soll.

---

## Abgrenzung: welche Fragen dieses Papier ausdrücklich **nicht** beantwortet

T-339/T-340 hat einmal gezeigt, was passiert, wenn zwei Papiere einander bestätigen statt sich
zu messen. Damit T-362 dieses hier **messen** kann und nicht nur nicken, steht die Grenze vorn
und nicht im Anhang. Ich entscheide **was** in welcher Spalte steht, **wann** die Tag-Fläche
aufgeht und **was** ohne Maus geschieht. Ich entscheide **nichts** davon:

**Es sind zehn Fragen in der Tabelle und eine im Fließtext, zusammen elf** (N-11 Punkt 4). Der
Bericht zu T-361 sprach von zwölf und der Auftrag zu T-366 schrieb die Zahl ab; wer eine Liste
abhakt, muß wissen, wie lang sie ist. Die Zahl steht deshalb jetzt hier und nicht nur im Bericht.

| Frage | gehört |
|---|---|
| Spaltenbreiten in rem oder px, `table-layout`, `colgroup`, Mindestbreiten | T-362 |
| Wie der Kopf klebt, und wo `overflow` liegt (5.1/5.2 des Schwesterpapiers gilt, die Regeln dazu stehen dort) | T-362 |
| Womit die Tag-Fläche verankert und ausgerichtet wird — Baustein, Bibliothek, Versatz, Umklappstrategie, Pfeil, Schatten | T-362 |
| Die Zeitwerte: Absichtsverzögerung beim Zeigereintritt, Nachlauf beim Verlassen | T-362 |
| Die **Lautstärke** der überfälligen Zelle: Farbrampe, Schriftschnitt, ob die Füllung fällt | T-362, mit dem Boden aus Abschnitt 7 |
| Zeilenhöhe, Zeilendichte, Wechselfarbe, die Gestalt von `--running` und `--done` | T-362 |
| Die Gestalt des Ladeskeletts | T-362 |
| Ob neben der Zahl in der Tag-Zelle ein Symbol steht | T-362 |
| Umbruchschwellen und was in welcher Fensterbreite nachgibt (**was nicht nachgeben darf**, steht in Abschnitt 8) | T-362 |
| Klassennamen der neuen Bausteine (**welche alten Kennungen überleben müssen**, steht in Abschnitt 13) | T-362 und frontend-dev |

**Und eine Frage, die ich stelle statt sie zu beantworten:** ob T-361 überhaupt gebaut werden
darf. A-25.7 in ihrer damaligen Fassung verbot sie (Abschnitt 12). Das entschied der Orchestrator,
nicht dieses Papier — **und er hat entschieden:** A-25.9 steht seit dem 2026-09-14 in der
Spezifikation.

**Was der Abgleich über diese Grenze ergeben hat, und es ist die unangenehmere Hälfte:** Die
gefährliche Klasse war nicht die Übergriffigkeit, sondern die **Rückgabe**. Zwei Fragen — das
Spaltenbudget und der Ausgang beim Bildlauf — hat jedes Papier an das andere zurückgereicht, und
beide blieben unbeantwortet, bis ein Prüfer sie fand. Eine Frage, die man an ein Papier zurückgibt,
das man nicht liest, ist nicht abgegeben, sondern verloren. Die Grenze bleibt, wo sie ist; die
Lehre steht in 15.1 und gilt für jedes künftige Papierpaar dieser Art.

---

## 1. Der Befund am Bestand — gelesen, nicht gemessen

In dieser Umgebung stehen weder Node noch pnpm noch ein Browser zur Verfügung. Alles hier ist am
Quelltext gelesen (`apps/web/src/features/todos/TodoListScreen.tsx`, `TodoRow.tsx`,
`apps/web/src/features/bookings/BookingTable.tsx`, `apps/web/src/features/export/ExportGroups.tsx`,
`apps/web/src/features/export/ExportAudit.tsx`, `apps/web/src/styles/app.css`,
`theme-palettes.css`, `tests/e2e/**`). Wo eine Zahl steht, steht dabei, woher sie kommt.

### 1.1 Was eine Zeile heute trägt

| Stelle | Inhalt | Klasse |
|---|---|---|
| 1 | Kontrollkästchen **Erledigt** (I-03, E-023) | `.todo-row__check` |
| 2 | Titel als Verweis auf die Detailansicht, **einzeilig, ungekürzt** | `.todo-row__title` |
| 3 | Metazeile: `Call <Nummer>` (nur wenn gesetzt), Statusname, `DoneFlag`, `DeadlineFlag` | `.todo-row__meta` |
| 4 | Bis zu **drei** Tag-Marken plus Überlaufzähler `+n` | `.todo-row__tags`, `.todo-row__more` |
| 5 | Exportstand der Buchungen dieses Todos | `.todo-row__export` (`ExportSummaryStrip`) |
| 6 | Timer starten/stoppen, Zeilenmenü | `.todo-row__actions` |

Dazu am Zeilenelement selbst: Doppelklick öffnet die Detailansicht (mit Ausschlußwahl für
Bedienelemente), `--done` streicht den Titel durch, `--running` färbt die Zeile.

### 1.2 Drei Stellen, an denen der Auftragstext vom Bestand abweicht

Keine davon ändert die Aufgabe. Alle drei ändern eine Begründung, und deshalb stehen sie hier.

1. **Das Exportprotokoll ist keine Tabelle.** `ExportAudit.tsx` ist eine `<ul>` aus `.auditrow`.
   Die zweite echte Tabelle des Erzeugnisses steht in der **Export-Ansicht**
   (`ExportGroups.tsx`, zwei geschachtelte `<table class="table">`). Als Vorbild „wie auf den
   anderen Seiten" gelten deshalb **`BookingTable` und `ExportGroups`**, und die beiden sind
   sich in der Spaltenordnung einig: Zustandsspalte, dann `Call`, dann der Gegenstand, dann
   Nebendaten, Aktionen zuletzt. Dieses Papier folgt ihnen.
2. **Die Todo-Liste hat heute keine Mehrfachauswahl.** In `TodoListScreen.tsx` gibt es keinen
   Auswahlzustand; `.bulkbar` kommt im ganzen Baum genau einmal vor, in `BookingsScreen.tsx`.
   Das Kontrollkästchen der Todo-Zeile ist das **Erledigt-Kennzeichen**, nicht eine Auswahl.
   Das ist die teuerste Falle dieses Umbaus und hat einen eigenen Absatz (3.2).
3. **Unterhalb von 68 rem sind die Tags heute ganz weg.** `app.css:4890` setzt
   `.todo-row__tags { display: none }`. Der Auftrag lautet, die Tags hinter eine Hover-Fläche zu
   legen; er wird damit an schmalen Fenstern nicht zu einem Verlust, sondern zum **ersten Mal**
   zu einer Auskunft. Das ist ein Gewinn, und er wird in 5.4 eingelöst.

### 1.3 Wie der Bestand den langen Text löst — **zweimal, und er trennt nach der Rolle**

Die erste Fassung dieses Papiers hat an dieser Stelle nur die halbe Ablage gelesen und daraus die
falsche Entscheidung gezogen (B-1). Vollständig ist sie so:

| Rolle des Textes | Behandlung | Fundstelle |
|---|---|---|
| **Nebenangabe** — die Buchungsnotiz, und der Todo-Titel unter dem Zeitraum | `.truncate` in einem Block fester Breite, voller Text im `title` | `BookingTable.tsx:274/286`, `components.css:894`, `base.css:331` |
| **Hauptangabe** — der Todo-Titel als Gegenstand der Zeile, Exporttabelle | `overflow-wrap: anywhere`, Umbruch, nichts verborgen | `app.css:5230` |

**Der Bestand kennt für denselben Wert beide Behandlungen und unterscheidet sie nach der Rolle,
nicht nach dem Datentyp.** In der Todo-Tabelle ist der Titel die Hauptangabe. Die Lösung „gibt es
schon" ist damit die **zweite** Zeile dieser Tabelle und nicht die erste — genau das hat die erste
Fassung verwechselt, und das ist die teuerste einzelne Berichtigung dieser Runde. Was daraus folgt,
steht in Abschnitt 4.

---

## 2. Nutzerziel und Erfolgskriterium

| | |
|---|---|
| **Nutzerziel** | In einer langen Todo-Liste **vergleichen**: Welche sind überfällig, welche haben offene Buchungen, welcher Call gehört wozu. Vergleichen heißt: dieselbe Angabe steht in jeder Zeile an derselben waagerechten Stelle. |
| **Erfolgskriterium** | Der Benutzer erkennt bei einem Blick über die Liste (a) welche Todos überfällig sind, (b) welche offene Buchungen tragen, (c) welchen Call ein Todo hat — ohne eine Zeile zu öffnen und ohne die Maus zu bewegen. Und: **auf dieselbe Bildschirmhöhe passen mehr Todos als heute**, weil eine Zeile eine Zeile ist und nicht drei. |
| **Gegenprobe** | Keine Angabe, die heute in der Zeile steht, wird unerreichbar. Die Tags sind ohne Maus vollständig lesbar. Kein Bedienweg verschwindet. Die Zeile behauptet keine Auswahl, die es nicht gibt. |
| **Nicht das Ziel** | Neue Funktion. Kein Sortieren am Spaltenkopf, kein Ziehen und Ablegen, kein Kontextmenü an der Zeile, kein Filtern durch Klick auf eine Tag-Marke. Jeder dieser vier Wege wäre eine Verbesserung und jeder ist ein eigener Auftrag (Abschnitt 17). |

---

## 3. Die Spalten

### 3.1 Die Entscheidung

**Acht Spalten**, in dieser Reihenfolge:

| Nr. | Kopf | Inhalt | kommt aus | Breitenverhalten |
|---|---|---|---|---|
| 1 | **Erledigt** | Kontrollkästchen (I-03) **und** `DoneFlag`, soweit er etwas sagt | `.todo-row__check` + `DoneFlag` aus `.todo-row__meta` | fest, inhaltsbestimmt |
| 2 | **Call** | Call-Nummer, dicktengleich; ohne Call **leere Zelle** | `.todo-row__call` | fest, sechs Ziffern, **nie gekürzt** |
| 3 | **Titel** | Verweis auf die Detailansicht, **umgebrochen, nie gekürzt** (B-1, §4) | `.todo-row__title` | **elastisch — diese Spalte gibt nach, und nur sie** |
| 4 | **Status** | Statusname (fremder Text) | `.todo-row__status` | fest, inhaltsbestimmt, **bricht um** (B-1 sinngemäß, siehe unten) |
| 5 | **Frist** | `DeadlineFlag`; ohne Frist leere Zelle (A-19.5) | `.todo-row__meta` | fest |
| 6 | **Tags** | Auslöser mit der **Zahl** der Tags; ohne Tags leere Zelle | `.todo-row__tags`, `.todo-row__more` | fest, **stabil** (siehe 5.2) |
| 7 | **Buchungen** | `ExportSummaryStrip` | `.todo-row__export` | fest |
| 8 | **Aktionen** (Kopftext für Hilfsmittel, wie in `BookingTable`) | Timerknopf, Zeilenmenü | `.todo-row__actions` | fest |

**Nichts entfällt.** Alle sechs Bestandteile der heutigen Zeile stehen in genau einer Spalte.
Verlegt — nicht gestrichen — werden zwei Dinge: die **Tag-Namen** aus der Zeile in die Fläche
(Abschnitt 5) und der **Metazeilen-Verbund** in vier getrennte Spalten. Was das für E-114 heißt,
steht in Abschnitt 13. **Drei sichtbare Zeichenketten fallen dabei trotzdem weg** — das Wort
„Call" vor der Nummer, der Überlaufzähler `+n` und die bis zu drei sichtbaren Tag-Namen. Die erste
Fassung hat das übersehen und „kein Text fällt weg" geschrieben; die Zählung steht berichtigt in
Abschnitt 12 (N-8).

**In dieser Tabelle wird nichts gekürzt — auch der Status nicht.** Die erste Fassung erlaubte
Spalte 4 die Kürzung („darf kürzen"); die Erlaubnis ist zurückgenommen, und zwar aus demselben
Grund, aus dem B-1 gegen die Kürzung des Titels entschieden hat: Ein Deckel ist eine neue
Deckelklasse für `proof:clamp`, und er verbirgt **fremden Text** ohne jede Anzeige. Der Statusname
kommt aus den Einstellungen des Benutzers und kann beliebig lang sein. Eine Tabelle, in der eine
Spalte kürzt und sieben umbrechen, muß ihre Ausnahme an jeder Stelle mitschleppen; eine, in der
nichts kürzt, muß es nirgends. Gemessen (T-365): „In Bearbeitung" ist mit 91,7 px der breiteste
Statusname des Vorrats und paßt in 112 px, ohne umzubrechen — der Umbruch ist der Auffangfall,
nicht der Regelfall.

### 3.2 Warum Spalte 1 einen **Wortkopf** bekommt und kein Kontrollkästchen

In `BookingTable` und in `ExportGroups` trägt die Kopfzelle der ersten Spalte ein
Kontrollkästchen: „Alle sichtbaren Buchungen auswählen", „Alle exportierbaren Tagesgruppen
auswählen". Dort **ist** die Spalte eine Auswahl, und darunter hängt die `.bulkbar` mit
Sammelaktionen.

In der Todo-Liste gibt es keine Sammelaktion und keinen Auswahlzustand (1.2 Punkt 2). Ein
Kontrollkästchen in der Kopfzelle wäre damit ein Bedienelement, das eine Auswahl anbietet, die
niemand verwerten kann — und der nächste Entwickler, der `BookingTable` als Vorlage nimmt, baut
es aus Gewohnheit ein. Deshalb drei Auflagen, und sie sind die schärfsten dieses Papiers:

> **Die Kopfzelle von Spalte 1 trägt das Wort „Erledigt" und kein Kontrollkästchen.**
> **Die Zeile trägt kein `aria-selected`.**
> **Es gibt keine Sammelleiste über der Tabelle.**

`BookingTable.tsx:232` setzt `aria-selected={selected}` am `<tr>`; wer die Datei kopiert, kopiert
den Satz mit und läßt eine Vorlesehilfe eine Auswahl ansagen, die es nicht gibt. Das ist die
gleiche Klasse wie ein Satz, der eine Handlung nennt, die es nicht gibt (E-100).

**E-023 wird dadurch nicht verletzt, sondern zum ersten Mal sichtbar.** „Erledigt ist ein
Kennzeichen, keine Spalte" spricht von der **Kanban-Spalte**, also vom Statuswert (A-5.4) — nicht
von einer Tabellenspalte. Die Tabelle trennt beides räumlich: Spalte 1 trägt das Kennzeichen,
Spalte 4 den Status, und sie tragen zwei verschiedene Köpfe. Heute stehen beide in derselben
Metazeile nebeneinander und sehen gleich aus.

### 3.3 Warum `DoneFlag` in Spalte 1 gehört und nicht in eine eigene

`DoneFlag` zeigt nichts, solange das Todo offen ist (`DoneFlag.tsx:50`, `state === "open"` gibt
`null` zurück). Er sagt nur in zwei von drei Zuständen etwas: „Erledigt" und „Erledigt
aufgehoben". Eine eigene Spalte für eine Angabe, die in der Regelansicht leer ist, ist eine
Spalte zu viel (A-13.2). Zusammen mit dem Kontrollkästchen ergibt sich dagegen ein Paar aus
**Stellglied und Zustand** unter einem Kopf, der beide benennt.

Der dritte Zustand ist der teuerste und der Grund, warum das Zusammenlegen keine Verkleinerung
sein darf: „Erledigt aufgehoben" ist die sichtbare Folge von A-2.5 und I-05 und hat den Befund
C-23 gekostet. Er bleibt in voller Beschriftung, mit Symbol und Kontur (T-045). Reicht die
Spaltenbreite dafür nicht, gibt **Spalte 3** nach, nicht dieser Text.

### 3.4 Warum „— ohne Call —" nicht übernommen wird

`BookingTable.tsx:267` schreibt in die leere Call-Zelle `— ohne Call —`. In der Todo-Zeile steht
heute in diesem Fall **nichts** (`TodoRow.tsx:73`). Den Satz zu übernehmen wäre ein **neuer**
Oberflächentext in dieser Ansicht (A-25.7). Die Zelle bleibt leer; in einer Tabelle ist das keine
Lücke, sondern eine Aussage, weil der Spaltenkopf die Frage schon gestellt hat und eine
Vorlesehilfe ihn zu jeder Zelle mitliest. Dasselbe gilt für die Frist-Zelle ohne Frist (A-19.5
verlangt dort ausdrücklich nichts) und für die Tag-Zelle ohne Tags.

### 3.5 Was die Zeile als Ganzes behält

- **Doppelklick öffnet die Detailansicht.** Unverändert, einschließlich der Ausschlußwahl für
  Bedienelemente (`TodoRow.tsx:56-58`). `ExportGroups.tsx:184` hat für Tabellenzeilen bereits
  dieselbe Bauform; sie wird übernommen, nicht neu erfunden. Der Auslöser der Tag-Fläche ist ein
  `button` und fällt damit von selbst unter den Ausschluß.
- **Einfacher Klick auf den Titel öffnet die Detailansicht.** Der Titel bleibt ein `a` mit
  `href`, also mit Mittelklick, Kontextmenü des Browsers und Statusleiste.
- **`--running` bleibt die einzige Zeilenfärbung.** Der laufende Timer ist der einzige Zustand,
  der die ganze Zeile einfärbt. Überfälligkeit tut es **nicht** (Abschnitt 7); zwei konkurrierende
  Zeilenfärbungen machen beide unlesbar.
- **`--done` bleibt der durchgestrichene Titel.**

---

## 4. Der lange Titel

**Entschieden: eine Zeile, Auslassungspunkte am Ende, voller Text im Titelattribut — dieselbe
Lösung wie in der Buchungstabelle.** Nicht zwei Zeilen, nicht Umbruch, nicht Zeilenklammer.

Vier Gründe, und der erste ist der Auftrag:

1. **Die Lösung gibt es schon** (1.3). Eine zweite zu erfinden hieße, denselben Fall im selben
   Erzeugnis zweimal verschieden zu beantworten.
2. **Der Zweck der Tabelle ist die gleiche Zeilenhöhe.** Eine Klammer über zwei Zeilen macht die
   Zeilenhöhe wieder von den Daten abhängig — genau das, was heute drei Zeilen hoch ist.
3. **Der volle Titel geht nicht verloren, auch nicht für Hilfsmittel.** Eine Kürzung über
   `text-overflow` schneidet Pixel, keine Zeichen: Der zugängliche Name des Verweises ist
   weiterhin der **vollständige** Titel. Eine Vorlesehilfe hört ihn immer ganz.
4. **Die Spalte ist die elastische.** Der Titel bekommt den ganzen Rest der Breite; er wird als
   Einziger gekürzt, und er wird als Letztes gekürzt.

**Die Lücke, und sie wird benannt statt geschlossen:** Ein Titelattribut erscheint bei Zeigerhalt,
nicht bei Tastaturfokus. Wer sehend mit der Tastatur arbeitet und einen gekürzten Titel vor sich
hat, liest ihn nicht im Tabellenblatt. Für ihn ist der volle Titel **eine Eingabetaste entfernt**
— der Verweis führt in die Detailansicht, wo der Titel die Überschrift ist. Das ist der bestehende
Weg und kein Verlust gegenüber heute; erfunden wird dafür nichts. (Hätte der Titel eine
Hover-Fläche wie die Tags, stünden auf jeder Zeile zwei davon, und die zweite verdeckte beim
Überfahren die erste.)

**Auflage:** Das Titelattribut hängt am **Verweis** und nicht an einem `span` darin. Ein `title`
auf einem nicht fokussierbaren `span` ist die Bauart, die T-181/ST-09 am Tag-Chip ausdrücklich
ausgebaut hat; am `a` ist das Element wenigstens fokussierbar, und der zugängliche Name bleibt der
Titel selbst, weil `title` gegen Inhalt zurücktritt.

---

## 5. Die Tags

### 5.1 Was heute verlorengeht, wenn man „Hover" wörtlich nimmt

Der Wunsch des Auftraggebers ist die Maus. Drei Gruppen haben keine:

- **Tastatur.** Kein `:hover`, und ein `:focus` entsteht nur an Elementen, die Fokus annehmen.
  Eine Fläche, die allein an `:hover` hängt, ist für sie nicht vorhanden (SC 2.1.1).
- **Berührungsbildschirm.** Es gibt kein Überfahren; ein Tippen ist ein Klick. Eine
  Hover-only-Fläche ist dort entweder unerreichbar oder sie geht beim ersten Tippen auf und beim
  zweiten wird der Verweis darunter ausgelöst.
- **Vorlesehilfe.** Sie liest den Baum, nicht den Zeiger. Inhalt, der erst bei `:hover` in den
  Baum kommt, wird nie gelesen.

Ein Todo, dessen elf Tags nur mit der Maus lesbar sind, hat eine Angabe verloren, die heute
dasteht — an schmalen Fenstern sogar eine, die heute **auch mit der Maus** nicht dasteht (1.2
Punkt 3).

### 5.2 Was dauerhaft sichtbar bleibt: **die Zahl**

Drei Möglichkeiten standen zur Wahl. Entschieden ist die dritte.

| | | Warum nicht / warum doch |
|---|---|---|
| **nichts** | verworfen | Ein Todo mit elf Tags sähe aus wie ein Todo ohne Tags. Das ist der stille Verlust einer Angabe, und die Liste wird dadurch nicht ruhiger, sondern unwahr. |
| **die erste Marke** | verworfen | Zwei Fehler auf einmal. Erstens: Die Reihenfolge von `todo.tagIds` ist die Speicherreihenfolge — die erste ist nicht die wichtigste, und eine von elf zu zeigen behauptet eine Rangfolge, die es nicht gibt. Zweitens: Eine Marke ist so breit wie ihr Name, also springt die Spaltenbreite von Zeile zu Zeile. Eine Tabellenspalte, deren Breite an den Daten hängt, ist keine Spalte. |
| **die Zahl** | **entschieden** | Sie beantwortet „hat dieses Todo Tags, und wie viele" in jeder Zeile, sie ist an derselben waagerechten Stelle vergleichbar, und sie ist **stabil breit** (zwei Ziffern reichen für den Bestand; drei sind der Deckel). |

**Die Zahl ist die Gesamtzahl, nicht der Überlauf.** Heute steht dort `+7` und meint „sieben
weitere neben den drei sichtbaren". Künftig steht dort `10` und meint „zehn". Das ist keine neue
Beschriftung, sondern dieselbe Stelle mit einer Bedeutung, die ohne Vergleichsstück überhaupt
erst lesbar ist.

**Die Zahl kommt aus `todo.tagIds.length`, nicht aus den aufgelösten Marken.** Das ist kein
Detail, sondern die Behebung eines stillen Falls im Bestand: `TodoListScreen.tsx:514-516` löst die
Tag-Kennungen über `structure.tagInfo(id)` auf und **wirft weg**, was sich nicht auflösen läßt.
Steht die Struktur auf `loading` oder `error`, zeigt eine Zeile mit elf Tags heute null Marken und
kein `+n` — sie sieht aus wie ein Todo ohne Tags, und niemand erfährt es. Mit der Zahl aus dem
Todo selbst stimmt der Zähler immer; in der Fläche steht für eine nicht auflösbare Kennung
**„Unbekannt"** — derselbe Ersatz, den `TodoListScreen.tsx:206` für den Filterchip schon
benutzt, also kein neuer Text.

**Bei null Tags bleibt die Zelle leer.** Kein „0", kein Strich. Eine Null ist eine Behauptung, wo
nichts zu sagen ist (3.4).

### 5.3 Der Auslöser ist ein Knopf, und Hover ist die Zugabe

> **Die Zahl steht in einem `button`. Der Knopf ist der Weg; Überfahren ist eine zweite Tür zu
> demselben Weg, nie die einzige.**

- Er liegt in der Tabulatorreihenfolge, genau einmal je Zeile.
- Er trägt `aria-expanded` und `aria-controls` auf die Fläche.
- Sein zugänglicher Name ist **die Zahl mit dem Wort**, gebildet aus dem vorhandenen Helfer
  `plural(n, "Tag", "Tags")` aus `apps/web/src/lib/format.ts`: also „11 Tags", „1 Tag". Damit
  tritt für diesen Knopf **kein neues Wort** in das Erzeugnis ein — „Tag" und „Tags" stehen
  bereits in der Filterleiste, in der Tag-Verwaltung und in der Detailansicht.
- Sichtbar ist die Ziffer; ob daneben ein Symbol steht, entscheidet T-362.
- Er ist mindestens **24 × 24 CSS-Pixel** groß (SC 2.5.8) und erfüllt damit zugleich die
  Berührungsanforderung.

### 5.4 Was in der Fläche steht

**Alle** Tags des Todos, jeder als `TagChip` **mit vollem Ordnerpfad** — also `size="md"`, nicht
`size="sm"`. Begründung: `Tag.tsx:81-85` zeigt in der dichten Größe nur den **letzten** Ordner,
weil der Pfad in der Zeile den Platz frißt. In der Fläche ist der Platz da, und A-13.3 und A-4.4
verlangen genau das: „Nord" aus „Kunden / Nord" ist von „Nord" aus „Standorte / Nord" zu
unterscheiden. **Die Tabelle macht die tiefen Tag-Ordner damit besser lesbar als die heutige
Zeile, nicht schlechter** — das ist der Gewinn, der den Umbau an dieser Stelle rechtfertigt.

Die Marken in der Fläche sind **Anzeige, nicht Bedienelement** — genau wie heute in der Zeile
(`TodoRow.tsx:99-105`, `TagChip` ohne `onToggle`). Kein Klick filtert, kein Klick entfernt. Das
wäre neue Funktion (Abschnitt 17, Offene Frage 4).

Die Fläche zeigt **keinen** Standard-Tag-Merker. `TagChip` kann ihn (`isDefault`, Abzeichen „S"),
die Zeile ruft ihn heute nicht auf, und ihn jetzt einzuführen wäre neue Information in dieser
Ansicht. Vermerkt als Offene Frage 5.

### 5.5 Die Reihenfolge in der Fläche

Wie heute: die Reihenfolge aus `todo.tagIds`. Sie neu zu sortieren wäre eine Entscheidung über
Wichtigkeit, die niemand getroffen hat, und sie widerspräche der Detailansicht, die dieselbe
Reihenfolge zeigt.

---

## 6. Die Tag-Fläche: wann sie aufgeht, wann zu, und woran sie hängt

### 6.1 Woran sie hängt — E-116 sinngemäß, und hier schärfer als dort

E-116 ist für Bestätigungsflächen geschrieben. Ihr **Mechanismus** gilt für jede Fläche, die über
anderem liegt, und R-6 Punkt 1 des Schwesterpapiers zählt „die aufgeklappten Menüs und
Auswahllisten" bereits dazu. Die Tag-Fläche tritt in diese Aufzählung ein.

> **Die Tag-Fläche ist kein Nachfahre der Zeile, der Zelle oder der Tabellenfläche. Sie hängt im
> Portal am Dokumentkörper und wird gegen den Auslöser ausgerichtet.**

Drei Gründe, und der dritte ist in dieser Ansicht schwerer als in jeder anderen:

1. **`position: fixed` sichert nichts zu** (E-113, E-116). Jede Mal-Eigenschaft eines Vorfahren
   verschiebt den umschließenden Block. In diesem Erzeugnis ist das kein Gedankenspiel: In zwei
   Paletten trug eine Karte `backdrop-filter`, und die Rückfrage vor dem Öffnen einer Datei hing
   an ihr statt am Fenster (R-31). `theme-palettes.css:464` und `:469` sprechen `.todo-row`
   ausdrücklich **im selben Atemzug wie `.card`** an — die Zeile ist in zwei Paletten ein
   kartenartiger Kasten und damit derselbe Kandidat.
2. **Die Zusage muß strukturell sein, nicht als Positionsangabe.** Ein Portal am Dokumentkörper
   ist nachweisbar; eine Wette auf die nächste Palette ist es nicht (E-117 Punkt 1).
3. **Die Tabellenfläche schneidet.** Nach 5.1 des Schwesterpapiers trägt `.table-wrap` **beide**
   Achsen. Eine Fläche darin wird nicht bloß falsch positioniert, sie wird **abgeschnitten** —
   und zwar genau dann, wenn sie über den Zeilenrand hinausragt, also immer. Das ist derselbe
   Grund, aus dem die Zeilenmenüs seit T-059 im Portal liegen (Schwesterpapier Abschnitt 9 Nr. 9:
   „Nicht in den Laufbereich zurückholen").

**Und eine Auflage aus SC 2.4.11 (Focus Not Obscured):** Die Fläche verdeckt **nie** ihren eigenen
Auslöser. Reicht der Platz darunter nicht, klappt sie darüber. Reicht er in keiner Richtung, wird
sie in der Höhe gedeckelt und läuft in sich selbst (6.4).

### 6.2 Die Zustandsmaschine

Genau **eine** Tag-Fläche ist in der Ansicht offen. Ein zweiter Auslöser schließt die erste.

| Zustand | Was gilt | Wodurch hinein | Wodurch hinaus |
|---|---|---|---|
| **P0 — zu** | Die Zelle zeigt die Zahl, `aria-expanded="false"`. | Ausgangszustand. | — |
| **P1 — offen durch Zeiger** | Fläche sichtbar, Fokus bleibt, wo er war. `aria-expanded="true"`. | Zeiger ruht auf dem Auslöser (Absichtsverzögerung: T-362). | Zeiger verläßt Auslöser **und** Fläche; `Escape`; Bildlauf des Laufbereichs; ein anderer Auslöser geht auf; Ansichtswechsel. |
| **P2 — offen durch Absicht** | Wie P1, zusätzlich: die Fläche ist fokussierbar und hat den Fokus. | `Eingabe`/`Leertaste` auf dem Auslöser; Tippen auf dem Berührungsbildschirm; ein Zeiger-Aufgang, in dem der Benutzer danach die Tastatur benutzt (**P1 → P2**). | `Escape` (Fokus kehrt auf den Auslöser zurück); zweites Auslösen; Auslösen außerhalb; Tabulator aus der Fläche heraus; Ansichtswechsel. **Nicht** durch Bildlauf, **nicht** durch Wegziehen des Zeigers. |
| **P3 — offen und selbst laufend** | Mehr Marken als Höhe. Die Fläche läuft in sich. | Aus P1 oder P2, wenn der Deckel greift. | Wie der Zustand, aus dem sie kam. |

**Warum P1 beim Bildlauf schließt und P2 nicht.** Beim Zeiger ist der Bildlauf das Ende der
Absicht: Der Auslöser wandert unter dem Zeiger weg, und eine Fläche, die einem verschwundenen
Anker hinterherrechnet, landet über dem festen Kopf oder über einer fremden Zeile. Beim
Tastatur- und Berührungsweg ist das anders: Dort hat der Benutzer die Fläche **verlangt**, und
SC 1.4.13 („persistent") sagt, daß sie bleibt, bis der Benutzer sie wegnimmt. Läuft der Laufbereich
in P2 so weit, daß der Auslöser das Sichtfeld verläßt, bleibt die Fläche stehen; `Escape` gibt den
Fokus auf den Auslöser zurück, und der Laufbereich holt ihn von selbst ins Bild (Schwesterpapier
R-4, AK-16).

**Kein Zeitgeber schließt die Fläche.** Weder in P1 noch in P2. Das ist SC 1.4.13 wörtlich, und es
ist auch ohne die Norm richtig: Wer elf Pfade liest, braucht unterschiedlich lange.

### 6.3 SC 1.4.13 im Einzelnen — drei Zusagen, drei Sätze

| Teilsatz | Zusage hier |
|---|---|
| **abweisbar** (dismissible) | `Escape` schließt die Fläche, ohne den Zeiger zu bewegen und ohne die Bildlaufstelle zu ändern. In P2 kehrt der Fokus auf den Auslöser zurück; in P1 bewegt sich der Fokus nicht. `Escape` gehört dabei der Fläche und nicht einem Dialog dahinter — dieselbe Bremse, die `Menu.tsx:76` (`stopClosingKeys`) schon fährt. |
| **überfahrbar** (hoverable) | Der Zeiger kommt vom Auslöser in die Fläche, **ohne** daß sie zwischendurch schließt. Ob das über eine lückenlose Anlage oder über einen Nachlauf gelöst wird, entscheidet T-362; **daß** es gelöst ist, ist hier entschieden. |
| **beständig** (persistent) | Kein Zeitgeber. Sie bleibt, bis Zeiger **und** Fokus sie verlassen haben, bis sie abgewiesen wird oder bis ihre Auskunft ungültig wird — Letzteres tritt ein, wenn die Liste neu geladen wird und die Zeile verschwindet; dann schließt sie und der Fokus geht nicht ins Leere. |

### 6.4 Am unteren Fensterrand

- **Erste Wahl:** Sie klappt nach oben, über den Auslöser hinweg nach oben versetzt — nie über
  ihn (6.1, SC 2.4.11).
- **Zweite Wahl:** Reicht es oben auch nicht, wird die Höhe gedeckelt und die Fläche läuft in
  sich (P3).
- **Der innere Lauf ist die Laufstrecke eines Bausteins.** Nach R-4 und A-25.5 braucht sie
  **keinen** eigenen zugänglichen Namen und keinen eigenen Tabulatorhalt. Bedienbar ist sie
  trotzdem, und zwar weil die Fläche in P2 selbst den Fokus trägt: `Bild ab`, `Bild auf`,
  `Pos1`, `Ende` und die Pfeiltasten laufen dann in ihr. **Das ist die Bedingung, unter der P3
  zulässig ist** — käme man in die Fläche nur mit dem Zeiger hinein, wäre der innere Lauf eine
  Mausfläche, und das ist die Regression, die R-c benennt. In P1 läuft das Mausrad über der
  Fläche in der Fläche und nicht im Laufbereich.
- **Die Fläche darf den festen Teil überdecken.** Sie liegt über dem Fenster, nicht im
  Inhaltsbereich. Sie verdeckt dabei nie den fokussierten Auslöser.

### 6.5 Der Fehlerpfad

Es gibt keinen Ladefehler in dieser Fläche: Die Tag-Kennungen kommen mit dem Todo, die Namen aus
`StructureContext`, und beide sind da, bevor die Zeile gezeichnet wird. Der einzige unvollständige
Fall ist die nicht auflösbare Kennung, und der ist in 5.2 entschieden: Die Marke steht mit
„Unbekannt" da, statt zu fehlen. **Eine Fläche, die aufgeht und leer ist, gibt es nicht** — bei
null Tags gibt es keinen Auslöser.

---

## 7. Die Fristmarke

**Heute:** rot, gefüllt, halbfett, mit Symbol, Wort und Datum — mitten in einer Metazeile, in der
sie um Aufmerksamkeit kämpfen muß. **Morgen:** in einer Spalte, die nur Fristen enthält, unter
einem Kopf, der „Frist" heißt, an derselben waagerechten Stelle in jeder Zeile.

**Die Entscheidung, und sie ist die Trennung von Ort und Lautstärke:**

> **Überfälligkeit bleibt eine Aussage der Zelle und wird keine Aussage der Zeile.** Die Spalte
> trägt sie; die Zeile bleibt der Zeile des laufenden Timers vorbehalten.

Begründung: `--running` ist heute die einzige Zeilenfärbung. Eine zweite, konkurrierende macht
beide unlesbar — und die häufigere (überfällig) verdrängte die dringendere (hier läuft gerade
Zeit). Wer alle überfälligen sehen will, hat dafür **den Filter**: `deadlineFilter = "overdue"`
steht in der festen Filterleiste, und die Kachel „In der Todo-Liste zeigen" auf dem Dashboard
springt genau dorthin (`#/todos?frist=overdue`). Die Spalte macht sie vergleichbar, der Filter
macht sie ausschließlich — die Zeilenfärbung bräuchte niemand.

**Was T-362 an Lautstärke wegnehmen darf und was nicht.** `DeadlineFlag` trägt sechs
Unterscheidungsmerkmale, fünf davon ohne Farbe: Wortlaut, absolutes Datum, Symbol, Füllung,
Schriftschnitt, Farbe. Die Spalte liefert den Zusammenhang „das ist eine Frist" von sich aus und
macht damit ein Merkmal entbehrlich — die **Füllung**. Der Boden:

- **Es bleiben mindestens drei Merkmale ohne Farbe:** der Wortlaut („Überfällig", „Heute
  fällig"), das Symbol und der Schriftschnitt. Die Graustufenprobe der Musterseite ist der
  Schalter, an dem sich das in einem Klick prüfen läßt (SC 1.4.1).
- **Kein Wort fällt weg.** „Überfällig" und „Heute fällig" bleiben zeichengleich stehen; „später
  fällig" bleibt eine ruhige Datumsangabe ohne Zustandswort (A-19.5, T-144 8.5).
- **Der zugängliche Name bleibt zeichengleich:** `Frist: <Datum>` beziehungsweise
  `<Wort> — Frist: <Datum>` (`DeadlineFlag.tsx:117`).
- **Die Daten stehen dicktengleich und rechtsbündig**, damit eine Spalte aus Daten als Spalte
  liest — wie `.table__primary` es für Dauer und Zeitraum schon tut.

**Der Kopf „Frist" ist nicht sortierbar.** Die Ordnung nach Frist gibt es bereits, in der
Filterleiste (`TODO_SORT_LABEL`, A-19.20), samt Filterchip „Ordnung: …" zum Zurücksetzen. Ein
zweites Stellglied für denselben Zustand ist ein Fehler, kein Komfort. Auch die
Exportgruppentabellen haben keine sortierbaren Köpfe; nur `BookingTable` hat sie, und dort gibt es
kein zweites. Damit trägt **keine** Kopfzelle dieser Tabelle `aria-sort`, und keine ist ein
Knopf. (Wenn der Auftraggeber Sortieren am Kopf will, ist das Offene Frage 3 — und dann muß das
Stellglied in der Filterleiste weichen, in **einem** Auftrag, E-081 Punkt 4.)

---

## 8. Was sich nicht ändern darf — und was davon eine Spalte braucht

| Stelle | Braucht eine Spalte? | Auflage |
|---|---|---|
| **Auswahl mehrerer Zeilen** | **Nein — es gibt sie nicht.** | Sie darf auch nicht entstehen: kein Kontrollkästchen in der Kopfzelle, kein `aria-selected`, keine Sammelleiste (3.2). |
| **Timerstart aus der Liste** (E-027, A-6.1) | **Ja — Spalte 8**, geteilt mit dem Menü, wie heute `.todo-row__actions`. | Beschriftung zeichengleich: „Timer für „X" starten" / „… stoppen". Zustand `running` wechselt das Symbol und die Knopfart, wie heute. |
| **Das Zeilenmenü** | **Ja — Spalte 8.** | Alle Einträge bleiben: Öffnen, Bearbeiten, je Status ein Eintrag, Als erledigt markieren / Erledigt zurücknehmen, Löschen. Das Menü bleibt im Portal (Schwesterpapier Abschnitt 9 Nr. 9). |
| **Die Filterleiste** samt Suche, Status, Regel, Tags, Frist, Ordnung, „Erledigte einblenden" | **Nein** — sie steht im festen Teil und bleibt dort unverändert. | Unberührt. Auch die Spaltenschwelle bei 39,88 rem bleibt, wie T-344 sie gesetzt hat. |
| **Die Zählzeile** („42 Todos", `role="status"`) | **Nein** — fester Teil, unverändert. | Sie zählt weiterhin Todos und nicht Tabellenzeilen; die Zahl ändert sich durch den Umbau nicht. |
| **Der Hinweis auf ausgeblendete erledigte Todos** (B-19, E-039) | **Nein — aber er wandert in den festen Teil.** | Eigener Absatz: 8.1. |
| **„Weitere laden (n übrig)"** | **Nein — er wird der Tabellenfuß.** | Eigener Absatz: 8.2. |
| **„In der Todo-Liste zeigen" vom Dashboard** | **Nein.** | Unverändert: `#/todos?frist=overdue`, Bildlaufstelle 0, Filterchip „Frist: Überfällig" sichtbar im festen Teil. Die Frist-**Spalte** macht den Sprung jetzt zusätzlich lesbar — jede Zeile zeigt, warum sie in dieser Liste steht. |
| **Der Call als Wiedererkennung für den Add-in-Fall** (A-10.9) | **Ja — Spalte 2.** | Die Call-Nummer wird **nie** gekürzt. Wer aus dem Add-in den Hinweis „diesen Call gibt es schon" bekommt, sucht ihn hier; eine gekürzte Call-Nummer wäre die eine Angabe, die gekürzt wertlos ist. |

### 8.1 Der Hinweis auf ausgeblendete erledigte Todos wird fest

**Erzwungen, nicht gewählt.** Der Tabellenkopf klebt nur, weil `.table-wrap` **selbst** der
senkrechte Laufbereich ist (Schwesterpapier 5.1/5.2; in `BookingsScreen.tsx:469-471` trägt die
Tabellenfläche `className="screen__body"` und die Merkmale des Laufbereichs). Damit gibt es
**innerhalb** des Laufbereichs kein Geschwister mehr, in dem der Hinweis stehen könnte. Er hat
drei mögliche Orte, und zwei sind verbaut:

- *Über der Tabelle, im Laufbereich* — geht nicht, siehe oben; es sei denn, der klebende Kopf
  fällt, und das war der Auftrag.
- *In der Tabelle*, als `<caption>` oder als Sonderzeile — geht nicht: Die `caption` ist der
  zugängliche Name der Tabelle, und eine Zeile, die kein Todo ist, verdirbt Zeilenzählung und
  Spaltenzuordnung für jede Vorlesehilfe.
- *Im festen Teil, unmittelbar über der Tabelle* — **entschieden.**

Das ist mit R-1 vereinbar und nicht gegen sie: R-1 Punkt 4 macht genau das fest, was „die Auswahl
im Laufbereich beantwortet und heute unmittelbar über ihm steht" — und nennt als Beispiel die
`.bulkbar` in S-06, die im selben Kasten `.screen__bar` sitzt. Der Hinweis erklärt, **warum diese
Liste kurz ist**; er ist derselbe Fall. **Seine sichtbare Stelle auf dem Bildschirm ändert sich
nicht** (AK-05): Er steht weiter zwischen Zählzeile und Liste. Was sich ändert, ist, daß er beim
Scrollen stehenbleibt — und das ist ein Gewinn, denn er erklärt eine Liste, die man gerade
durchsieht.

**Der Preis steht dabei, und er ist gemessen.** Der feste Teil der Todo-Liste ist der engste des
Erzeugnisses: T-341 mißt ihn an der getragenen Untergrenze bei **75,9 %** seines Budgets (vor der
Berichtigung der Spaltenschwelle waren es 89,9 %). Der Hinweis ist eine Textzeile und wird an
schmalen Fenstern zwei. **Auflage (AK-23 des Schwesterpapiers):** Das Höhenbudget wird bei
960 × 640 **mit stehendem Hinweis** neu gemessen, nicht ohne ihn. Reißt es, fällt der Hinweis
nicht weg — dann gibt eine andere Zeile des festen Teils nach, nach der Regel „es weicht zuerst,
was schon einmal weicht" (T-323 7.5).

### 8.2 „Weitere laden" wird der Tabellenfuß

Aus demselben Grund kann der Knopf kein Geschwister der Tabellenfläche mehr sein. Er wird eine
Fußzeile **innerhalb** der Tabelle — eine Zeile über alle Spalten, am Ende des Rumpfes. Damit
bleibt alles, was 4.2 des Schwesterpapiers über ihn sagt, wahr: „Das Ende der Liste ist der Ort,
an dem man weiterlädt", er läuft mit, und fest wäre er eine Leiste, die es heute nicht gibt.
Beschriftung und Zähler bleiben zeichengleich („Weitere laden (n übrig)").

---

## 9. Zustände

Die Maschine des Schwesterpapiers (Z0 bis Z7) gilt unverändert; hier steht, was sie in dieser
Ansicht bedeutet. W0 bis W4 sind die Tabellenzustände aus 5.4 desselben Papiers.

| Zustand | Fester Teil | Laufbereich | Kopfzeile der Tabelle |
|---|---|---|---|
| **Z0 Ladend** | Kopf, Filterleiste, Zählzeile („wird geladen …"), Hinweis (falls Zahl bekannt) — **bedienbar** | Skelett (`AsyncBoundary`, `rows={6}`), oben | **keine** — siehe 9.1 |
| **Z1 Gefüllt, kurz (W0)** | steht | Tabelle, kein Lauf, Rinne reserviert | steht ohnehin |
| **Z2 Gefüllt, lang (W1)** | steht | Tabelle läuft senkrecht | **klebt oben** |
| **Z3 Leer (W4)** | steht — der Filter, der die Leere verursacht hat, ist erreichbar | `TableShell` + `EmptyState`, in der Mitte des Laufbereichs | keine — es gibt keine Tabelle |
| **Z4 Fehler** | steht und bleibt bedienbar | `InlineMessage` mit „Erneut versuchen", oben | keine |
| **Z5 Nachladen** | zusätzlich `RefreshHint` im Kopf | wie Z1/Z2, Bildlaufstelle und Fokus bleiben | wie Z1/Z2 |
| **Z6 Rückfall** | läuft mit dem Rahmen hinaus | läuft innerhalb seines Bodens von 4 rem weiter | klebt am Laufbereich, nicht am Rahmen |
| **Z7 Größenänderung** | — | — | — |

### 9.1 Die Kopfzeile erscheint mit den Zeilen, nicht vorher

Entschieden gegen die naheliegende Alternative („der Kopf steht ab dem ersten Bild, weil die
Spalten von vornherein feststehen"). Grund: In Z3 und Z4 gibt es keine Tabelle (5.4 W4 des
Schwesterpapiers sagt das ausdrücklich). Ein Kopf, der in Z0 steht und in Z3 wieder verschwindet,
verspricht Spalten, die der nächste Zustand zurücknimmt — ein stiller Wechsel in beide Richtungen.
Der Sprung von Z0 nach Z1 um eine Zeilenhöhe ist der kleinere Preis und von Z7 gedeckt („die
Bildlaufstelle darf dabei springen").

### 9.2 Die beiden Leerzustände bleiben, wie sie sind

„Noch kein Todo" mit „Neues Todo" und „Kein Todo passt zu diesen Filtern" mit „Filter
zurücksetzen" — zeichengleich, mit ihren Symbolen und ihren Auswegen. Beide sind
**Bildschirmleerzustände** nach R-5 (direktes Kind des Laufbereichs, neben ihnen läuft nichts
mehr) und zentrieren sich im Laufbereich. Der Hinweis auf ausgeblendete erledigte Todos steht
auch hier — jetzt im festen Teil, also über dem Leerzustand statt darin, an derselben Stelle des
Bildschirms wie heute.

### 9.3 Zeilenzustände

| Zustand | Woran erkennbar | Auflage |
|---|---|---|
| **offen** | Kontrollkästchen leer, kein `DoneFlag` | — |
| **erledigt** (nur bei eingeblendeten Erledigten) | Kästchen gesetzt, `DoneFlag` „Erledigt", Titel durchgestrichen | Drei Merkmale, keines davon Farbe allein. |
| **Erledigt aufgehoben** (A-2.5, I-05, C-23) | `DoneFlag` „Erledigt aufgehoben" mit Symbol und Kontur | Steht in Spalte 1 in voller Beschriftung. **Darf nicht gekürzt werden** (3.3). |
| **Timer läuft** | Zeilenfärbung `--running`, Knopf zeigt „pause" | Die einzige Zeilenfärbung (3.5, 7). |
| **überfällig** | Spalte 5, Wort + Symbol + Schnitt + Farbe | Keine Zeilenfärbung (7). |
| **hat offene Buchungen** | Spalte 7, `ExportSummaryStrip` | Form und Zahl tragen, Farbe verstärkt (A-13.5). |

**Ausgewählte Zeilen gibt es nicht** (3.2). Das ist die Antwort auf diesen Punkt des Auftrags:
Der Zustand darf nicht entstehen.

---

## 10. Tastatur- und Fokusfluß

| Frage | Antwort |
|---|---|
| Reihenfolge in einer Zeile | Kontrollkästchen (Sp. 1) → Titelverweis (Sp. 3) → Tag-Auslöser (Sp. 6, nur wenn es Tags gibt) → Timerknopf (Sp. 8) → Menü-Auslöser (Sp. 8). **Fünf Halte je Zeile, höchstens einer mehr als heute** — der Tag-Auslöser. Heute sind es vier. |
| Ist ein Halt mehr je Zeile vertretbar? | Ja, und es ist derselbe Handel wie R-i im Schwesterpapier: Ein Halt mehr gegen eine Angabe, die ohne Maus sonst gar nicht erreichbar wäre. Er entsteht **nur** an Zeilen mit Tags. |
| Wie erreicht die Tastatur die Tabellenfläche? | Über den Laufbereich, der sie **ist** — ein Halt, benannt „Todos", unmittelbar vor seinem Inhalt, mit sichtbarem Fokusring (R-4, AK-15). Der Name bleibt „Todos", zeichengleich zu heute (`ScreenBody label="Todos"`, gemessen in `tests/e2e/viewport-fit.spec.ts:873`). |
| Und die Sprungmarke? | „Zum Inhalt springen" führt auf denselben Kasten: `.table-wrap`, der zugleich `.screen__body` ist. Danach bewegt `Bild ab` messbar etwas (AK-14 (a)–(c)), weil dieser Kasten in Z2 selbst läuft. Der zweite Zweig von AK-14 (c) wird hier **nicht** in Anspruch genommen. |
| Waagerechter Lauf und die rechte Spalte | 5.3 des Schwesterpapiers gilt — **mit einer Berichtigung**, siehe 10.1. |
| Die Fläche und der Fokus | Siehe 6.2. In P2 trägt die Fläche den Fokus; `Escape` gibt ihn auf den Auslöser zurück, und der Laufbereich holt ihn ins Bild (AK-16). |
| Ein Menü schließt, während die Fläche offen ist | Die Fläche und das Zeilenmenü schließen einander aus: Öffnet das Menü, schließt die Fläche. Zwei überlagernde Flächen an derselben Zeile sind ein Schichtstreit ohne Gewinn. |
| Ein fokussierter Eintrag außerhalb des Sichtfelds | Der Laufbereich zieht nach (AK-16). Bedingung: In keiner Achse, in der Inhalt liegt, ist der Lauf abgeschaltet (R-d). |

### 10.1 Berichtigung an 5.3 des Schwesterpapiers: das zweite Argument trägt hier nicht

5.3 begründet den Verzicht auf eine waagerecht klebende Spalte mit drei Gründen. Der zweite
lautet: „Das Menü braucht die Spalte nicht — jede Zeile öffnet ihr Menü zusätzlich über die rechte
Maustaste und über `Kontextmenü` beziehungsweise `Umschalt`+`F10`."

**Für die Todo-Tabelle stimmt das nicht.** `BookingTable.tsx:237-249` legt `onContextMenu` und
`onKeyDown` auf das `<tr>`; `TodoRow.tsx` tut das nicht und bekommt es in T-361 auch nicht (das
wäre neue Funktion, Offene Frage 2). Der zweite Grund entfällt hier also, und der dritte muß
allein tragen — er tut es:

> Kontrollkästchen (Sp. 1) und Menü-Auslöser (Sp. 8) sind **beide fokussierbar**. Nach einem
> waagerechten Lauf sind sie nicht weg, sondern eine Bildlaufstelle entfernt, und der Fokus holt
> sie von selbst zurück ins Bild.

Damit ist der Tastaturweg zu, und AK-15 („in der rechtesten Spalte steht ein fokussierbares
Element") ist erfüllt. Für die Maus bleibt der Bildlauf.

**Und eine Auflage an T-362, die daraus folgt:** Die acht Spalten sind mit Ausnahme des Titels
alle schmal, und der Titel ist elastisch. **Bei 960 px Fensterbreite darf die Tabelle nicht
waagerecht laufen** — der Titel gibt nach, bis er das Budget hält. Unterhalb der getragenen
Untergrenze ist waagerechter Lauf zulässig (5.3), oberhalb ist er ein Befund.

### 10.2 Keine Spalte fällt bei schmalem Fenster weg

Heute verschwindet `.todo-row__tags` unter 68 rem ersatzlos. Diese Regel fällt mit dem Umbau —
ersatzlos wegzublenden ist ein stiller Verlust, und die neue Tag-Zelle kostet zwei Ziffern statt
18 rem. **Keine der acht Spalten wird in einer getragenen Fenstergröße ausgeblendet.** Ist es zu
eng, gibt der Titel nach; wird es noch enger (unterhalb der getragenen Größe), läuft die Tabelle
waagerecht. Ein Bildlauf ist sichtbar, eine verschwundene Spalte nicht.

---

## 11. Die Pflichtflows

| Flow | Start | Aktion | Rückmeldung | Erfolg | Fehler |
|---|---|---|---|---|---|
| **Timer auf erledigtem Todo** (A-2.5, I-05, E-027) | Zeile mit gesetztem Kästchen, Erledigte eingeblendet | Timerknopf in Sp. 8 | Toast nennt beides: Timer läuft **und** „Erledigt" ist aufgehoben, samt Bewegungssatz | Kästchen leer, `DoneFlag` auf „Erledigt aufgehoben", Durchstreichung weg, Zeile `--running`. **Die Zeile bleibt an ihrer Stelle und verschwindet nicht** — auch dann nicht, wenn Erledigte ausgeblendet sind, denn das Todo ist jetzt offen | Toast „Der Timer ließ sich nicht starten"; die Zeile bleibt unverändert, keine halbe Änderung |
| **Kanban Drag & Drop** | — | — | — | — | Betrifft diese Ansicht nicht. **Die Todo-Tabelle bekommt kein Ziehen und Ablegen**; A-13.6 und I-14 sind im Board eingelöst und bleiben dort. Eine Tabellenzeile, die sich ziehen läßt, ohne daß es ein Ziel gibt, ist eine Zusage ohne Einlösung |
| **Export samt Statuswechsel** | Spalte 7 zeigt offene Buchungen | Wechsel in die Export-Ansicht, Lauf, Rückkehr | — | Spalte 7 zeigt den neuen Stand, ohne daß der Benutzer neu lädt (`useRefresh`, `loadExportSummaries`) | Schlägt das Laden der Zusammenfassungen fehl, fällt die **ganze** Liste in Z4 — das ist der Bestand (`Promise.all` in `TodoListScreen.tsx:152`) und wird von T-361 nicht geändert. Vermerkt als Risiko R-6 |
| **Tiefe Tag-Ordner** (A-4.3, A-4.4, A-13.3) | Zeile mit Tags | Fläche öffnen | — | Jede Marke mit **vollem** Pfad, nicht nur dem letzten Ordner (5.4). Bei mehr als vier Ebenen kürzt `TagPath` die Mitte und behält den vollen Pfad für Hilfsmittel | — |
| **Standard-Tags** (A-9.1, I-12) | Neues Todo entsteht, auch aus dem Add-in | — | — | Die Standard-Tags sind Tags wie andere: Sie zählen in der Zahl mit und stehen in der Fläche. **Ohne eigenes Abzeichen** (5.4), wie heute in der Zeile | — |
| **Exportvorlagen** | — | — | — | — | Betrifft diese Ansicht nicht |
| **Add-in mit vorhandenem Call** (A-10.9 i. d. F. v. E-100) | Das Add-in **weist hin** und handelt nicht | Der Benutzer wechselt nach SuperTakt und sucht den Call | — | Spalte 2 macht den Call in jeder Zeile an derselben Stelle lesbar, ungekürzt; die Suche in der festen Filterleiste findet ihn. Das ist besser als heute, wo der Call in einer Metazeile unter dem Titel steht | — |

---

## 12. Neue Oberflächentexte — die ehrliche Zählung, und der Konflikt mit A-25.7

**Es entsteht neuer Oberflächentext, und zwar unvermeidlich.** Eine Tabelle hat eine Kopfzeile,
und eine Kopfzeile besteht aus Wörtern. Wer behauptet, dieser Auftrag käme ohne neuen Text aus,
hat die Kopfzeile nicht gezählt.

**Die vollständige Liste — zehn Zeichenketten:**

| Nr. | Text | Art | Steht das Wort heute schon im Erzeugnis? |
|---|---|---|---|
| 1 | **Erledigt** | Spaltenkopf, sichtbar | ja — `DONE_FLAG_LABEL`, Zeilenmenü („Erledigt zurücknehmen"), Filterchip |
| 2 | **Call** | Spaltenkopf, sichtbar | ja — `BookingTable`, `ExportGroups` |
| 3 | **Titel** | Spaltenkopf, sichtbar | ja — Feldbeschriftung in `TodoFormDialog.tsx:196` |
| 4 | **Status** | Spaltenkopf, sichtbar | ja — `BookingTable`, `ExportGroups`, Filterleiste |
| 5 | **Frist** | Spaltenkopf, sichtbar | ja — Filterleiste, Detailansicht; A-19 verlangt genau dieses Wort |
| 6 | **Tags** | Spaltenkopf, sichtbar | ja — Filterleiste (`combobox` „Tags"), Tag-Verwaltung |
| 7 | **Buchungen** | Spaltenkopf, sichtbar | ja — `ExportGroups`-Kopf, Navigation, Detailansicht |
| 8 | **Aktionen** | Spaltenkopf, nur für Hilfsmittel | ja — `BookingTable.tsx:123` |
| 9 | **„11 Tags" / „1 Tag"** | zugänglicher Name des Tag-Auslösers | ja, zusammengesetzt — `plural(n, "Tag", "Tags")`, vorhandener Helfer |
| 10 | **Die Tabellenunterschrift** (`caption`, nur für Hilfsmittel) | Satz | **nein** — ein neuer Satz, nach dem Muster von `BookingTable.tsx:473` |

**Kein einziges neues Wort tritt in das Erzeugnis ein; neun der zehn Zeichenketten sind
Wiederverwendungen, und die zehnte ist eine Unterschrift für Hilfsmittel.** Kein Text fällt weg:
Die Tag-Namen werden **verlegt** (Zeile → Fläche), nicht gestrichen — E-114 dazu in Abschnitt 13.

**Trotzdem, und das ist der Punkt: A-25.7 in ihrer heutigen Fassung deckt das nicht.** Sie lautet:
*„Bestehende Funktion bleibt erhalten, und es entsteht kein neuer Oberflächentext und fällt keiner
weg. Die sichtbare Gestalt ändert sich nur dort, wo eine Freigabe es ausdrücklich erlaubt — der
umbrochene Kopf, der Wegfall des Zusatzes an der Bereichsschiene bei knapper Höhe, und die
zugänglichen Namen und Halte, die A-25.5 verlangt."* Die Aufzählung ist abschließend, und die
Todo-Tabelle steht nicht darin. Der Auftragstext von T-361 zitiert nur die **Text**hälfte des
Satzes; die **Gestalt**hälfte ist die schärfere.

> **Offene Frage 1 an den Orchestrator:** A-25.7 braucht einen vierten Aufzählungspunkt — die
> Umstellung der Todo-Liste auf eine Tabelle samt ihrer Kopfzeile —, oder T-361 ist ungedeckt.
> Vorschlag für den Wortlaut: *„… und die Kopfzeile der Todo-Tabelle (T-361), deren Beschriftungen
> ausnahmslos aus bereits verwendeten Wörtern bestehen."* `docs/spec.md` gehört nicht mir.

**Und die Auflage aus E-087/R-g, die davon unberührt gilt:** Vor dem Bauen ist jeder der zehn
Wortlaute in `tests/**` und `apps/*/test/**` zu suchen — über `git grep` **und** über einen Lauf
durch `apps/*/src`, `packages/*/src`, `tests/` mit ausgeschlossenen Bauergebnissen. Zwei
Verdachtsfälle sind schon jetzt zu nennen: „Status" und „Tags" stehen in derselben Ansicht künftig
als Filterbeschriftung **und** als Spaltenkopf; Abfragen, die die Rolle nicht einschränken, werden
im strikten Modus vieldeutig. Das ist genau der Fall, den R-g vorhersagt, und er ist diesmal
vorher benannt.

---

## 13. E-114: die Benutzungen, die an der Zeile hängen

E-114 sagt: Wer eine Kennung verlegt, sucht ihre **Benutzung**, nicht ihren Wortlaut. Die Zeile
wechselt von `<li class="todo-row">` zu `<tr>`. Gesucht wurde über den ganzen Baum, versionierte
und unversionierte Dateien, Bauergebnisse ausgenommen. Gefunden:

**Prüffälle, die `.todo-row` als Geltungsbereich benutzen** — neun Stellen in acht Dateien:

| Datei | Zeilen |
|---|---|
| `tests/e2e/kanban.spec.ts` | 103 |
| `tests/e2e/attachment-open-commands.spec.ts` | 238 |
| `tests/e2e/tag-input.spec.ts` | 212, 213 |
| `tests/e2e/midnight-redraw.spec.ts` | 78, 90 |
| `tests/e2e/todo-revival.spec.ts` | 190 |
| `tests/e2e/deadline-lifecycle.spec.ts` | 87, 167, 194 |
| `tests/e2e/focus-return-after-dialog.spec.ts` | 118 |
| `tests/e2e/foreign-title-display.spec.ts` | 53 (`.todo-row__title bdi`) |

Keine davon nennt die Kennung ein zweites Mal; jede trägt die Prüfschritte **darin**. Das ist
dieselbe Klasse, die in T-326 sieben Dateien gekostet hat.

**Daraus die Auflage — und sie ist billig:**

> **Die Klassen `todo-row` und `todo-row__title` überleben den Umbau als Haken am `<tr>`
> beziehungsweise am Titelverweis.** Welche Klassen sonst entstehen, entscheidet T-362.

Damit fallen alle neun Stellen von selbst weiter grün aus — sie fragen nach einem Kasten mit einem
Text darin, und den gibt es weiterhin, nur als Tabellenzeile. Wird die Auflage **nicht**
übernommen, gehört die Berichtigung aller neun Stellen in **denselben** Auftrag (E-081 Punkt 4)
und nicht in einen späteren.

**Zwei weitere Benutzungen, die keine Prüffälle sind und trotzdem brechen können:**

- `theme-palettes.css:464` und `:469` — `:is(.card, .todo-row, .filterbar)` in den Paletten
  `lines` und `zen`. Eine Kartenregel auf einem `<tr>` ist nicht dieselbe Regel: Rahmen,
  Hintergrund und Radius verhalten sich an Tabellenzeilen anders. **Gehört T-362**, wird hier nur
  benannt.
- `app.css:4890` — `.todo-row__tags { display: none }` unter 68 rem. Diese Regel **fällt** (10.2).
  Sie ist kein Text, also kein E-087-Fall; sie ist ein Verhalten, und sein Wegfall ist in diesem
  Papier entschieden und begründet.

---

## 14. Akzeptanzkriterien für frontend-dev

Gemessen wird im Standardfenster 1280 × 820, an der getragenen Untergrenze 960 × 640, zusätzlich
bei 1024 × 640 und 1440 × 900, und im Rückfallgebiet bei 831 × 640 und 640 × 480. Die Zusagen des
Schwesterpapiers (AK-01 bis AK-25) gelten unverändert weiter; hier stehen nur die zusätzlichen.

**Struktur und Spalten**

- **TT-01** Die Tabelle hat acht Spalten in der Reihenfolge aus 3.1, mit den Köpfen „Erledigt",
  „Call", „Titel", „Status", „Frist", „Tags", „Buchungen" und „Aktionen" (letzterer nur für
  Hilfsmittel).
- **TT-02** Die Kopfzelle von Spalte 1 enthält **kein** Bedienelement. Im ganzen Baum der Ansicht
  gibt es kein Element mit `aria-selected` und keine Sammelleiste.
- **TT-03** Keine Kopfzelle trägt `aria-sort`, keine ist ein Knopf.
- **TT-04** Bei **960 px** Fensterbreite läuft die Tabellenfläche **nicht** waagerecht. Unterhalb
  der getragenen Untergrenze darf sie es.
- **TT-05** In **keiner** getragenen Fenstergröße ist eine der acht Spalten ausgeblendet.
  `.todo-row__tags { display: none }` existiert nicht mehr.
- **TT-06** Die Call-Zelle kürzt nie: Der volle Wert von `todo.callNumber` steht im Bild, in jeder
  getragenen Größe.
- **TT-07** Nur die Titelzelle kürzt. Sie kürzt einzeilig mit Auslassungspunkten, trägt den vollen
  Titel im `title`-Attribut **am Verweis**, und der zugängliche Name des Verweises ist der
  vollständige Titel — gemessen an einem Titel von mindestens 200 Zeichen.
- **TT-08** Die Zeilenhöhe ist bei einem 20-Zeichen-Titel und bei einem 200-Zeichen-Titel dieselbe
  (± 1 px).

**Die Tag-Fläche**

- **TT-09** Die Tag-Zelle enthält einen `button` mit `aria-expanded`, `aria-controls` und dem
  zugänglichen Namen aus `plural(n, "Tag", "Tags")`. Sein Trefferfeld ist mindestens 24 × 24 px.
- **TT-10** Die sichtbare Zahl ist `todo.tagIds.length`. **Gegenprobe:** Steht
  `StructureContext` auf `error`, zeigt eine Zeile mit drei Tag-Kennungen weiterhin die Zahl 3,
  und die Fläche zeigt drei Marken mit dem Text „Unbekannt". Heute zeigt dieselbe Zeile nichts.
- **TT-11** Bei null Tags gibt es keinen Knopf und keinen Text in der Zelle.
- **TT-12** Der Knopf öffnet die Fläche mit `Eingabe` **und** mit `Leertaste`; `Escape` schließt
  sie und der Fokus steht danach auf dem Knopf. Gemessen ohne jede Zeigerbewegung.
- **TT-13** Der Zeiger kommt vom Knopf in die Fläche, ohne daß sie zwischendurch schließt
  (SC 1.4.13 „überfahrbar"). Gemessen als Bewegung entlang der kürzesten Strecke.
- **TT-14** Die Fläche schließt **nicht** von selbst. Nach 30 Sekunden ohne jede Eingabe steht sie
  noch (SC 1.4.13 „beständig").
- **TT-15** Der Elternknoten der Fläche ist der Dokumentkörper. Kein Vorfahr trägt `transform`,
  `filter`, `backdrop-filter`, `perspective`, `will-change` oder `contain`. **In allen sieben
  Paletten und beiden Farbmodi** — `lines` und `zen` ausdrücklich, weil sie `.todo-row` wie eine
  Karte behandeln.
- **TT-16** Die Fläche wird nicht abgeschnitten: Bei einer Zeile am rechten und am unteren Rand des
  Laufbereichs ist ihr gerechneter Kasten vollständig innerhalb des Fensters.
- **TT-17** Die Fläche verdeckt ihren eigenen Auslöser nie (SC 2.4.11). Gemessen an der letzten
  sichtbaren Zeile.
- **TT-18** Öffnen durch Zeiger und anschließender Bildlauf des Laufbereichs: die Fläche schließt.
  Öffnen durch Tastatur und anschließender Bildlauf: die Fläche bleibt.
- **TT-19** Reicht die Höhe nicht, läuft die Fläche in sich, und dieser Lauf ist mit `Bild ab`
  bedienbar, nachdem die Fläche über die Tastatur geöffnet wurde.
- **TT-20** Höchstens eine Tag-Fläche ist gleichzeitig offen. Öffnet ein Zeilenmenü, ist keine
  offen.
- **TT-21** Jede Marke in der Fläche zeigt ihren **vollen** Ordnerpfad. Gegenprobe: zwei Tags
  gleichen Namens in verschiedenen Ordnern sind in der Fläche unterscheidbar (A-4.4).

**Zustände und Wege**

- **TT-22** Die Kopfzeile der Tabelle erscheint mit der ersten Zeile und steht in Z0, Z3 und Z4
  nicht.
- **TT-23** Der Hinweis auf ausgeblendete erledigte Todos steht im festen Teil, unmittelbar über
  der Tabelle, an derselben Bildschirmstelle wie heute (± 4 px bei Bildlaufstelle 0), und er bleibt
  beim Scrollen stehen. Sein Wortlaut und der Knopf „Einblenden" sind zeichengleich.
- **TT-24** **AK-23 des Schwesterpapiers wird bei 960 × 640 mit stehendem Hinweis neu gemessen.**
  Ergibt sich ein Überlauf, ist das ein Befund an dieser Aufgabe und nicht der Rückfall (R-3a,
  E-115).
- **TT-25** „Weitere laden (n übrig)" steht als Fußzeile innerhalb der Tabelle, läuft mit und
  trägt den zeichengleichen Text.
- **TT-26** Ein Timerstart auf einer erledigten Zeile: Kästchen leer, `DoneFlag` auf „Erledigt
  aufgehoben", Durchstreichung weg, Zeile `--running`, Toast nennt beides — **und die Zeile steht
  danach an derselben Stelle der Tabelle wie vorher**.
- **TT-27** Überfälligkeit färbt die Zeile nicht. Bei ausgeschalteter Farbe (Graustufenprobe der
  Musterseite) bleibt eine überfällige Zeile an mindestens drei Merkmalen erkennbar.
- **TT-28** Doppelklick auf die Zeile öffnet die Detailansicht; Doppelklick auf Kästchen, Verweis,
  Tag-Auslöser, Timerknopf oder Menü tut es nicht.
- **TT-29** Der Laufbereich heißt weiterhin „Todos" und ist derselbe Kasten wie `.table-wrap`.
  `tests/e2e/viewport-fit.spec.ts:873` bleibt grün, ohne angefaßt zu werden.
- **TT-30** Die neun Stellen aus Abschnitt 13 bleiben grün, ohne angefaßt zu werden — oder sie
  stehen im selben Auftrag berichtigt im Bericht (E-081 Punkt 4).

---

## 15. Übergabe an ui-designer (T-362)

Offen, ausdrücklich nicht hier entschieden — die Liste aus der Abgrenzung, dazu vier Fragen, die
ich **stelle** statt sie zu beantworten:

1. **Wie breit darf der Titel mindestens werden, bevor die Tabelle waagerecht laufen darf?**
   TT-04 sagt, daß sie es bei 960 px nicht darf; die Zahl dafür fehlt und ist zu messen.
2. **Was tut `theme-palettes.css:464/469` mit einem `<tr>`?** Zwei Paletten behandeln `.todo-row`
   wie eine Karte. Ob die Regel bleibt, umzieht oder fällt, ist Gestaltung.
3. **Wie greift der klebende Kopf, wenn die Tabelle eine Fußzeile hat?** `.table thead th` klebt
   nach 5.2 zum ersten Mal; eine Fußzeile im selben Laufkasten ist eine Lage, die es in
   `BookingTable` nicht gibt.
4. **Wie sieht ein Ladeskelett aus, das keine Kopfzeile hat (9.1) und trotzdem nach Tabelle
   aussieht?**

---

## 16. Risiken

| | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **R-1** | `BookingTable` wird als Vorlage kopiert, samt Auswahlkästchen in der Kopfzelle und `aria-selected` | Die Ansicht behauptet eine Mehrfachauswahl, die keine Aktion verwerten kann. Eine Vorlesehilfe sagt sie an. Dieselbe Klasse wie ein Satz, der eine Handlung nennt, die es nicht gibt (E-100) | 3.2, TT-02 — die schärfste Auflage dieses Papiers |
| **R-2** | Die Tag-Fläche entsteht innerhalb der Zeile | Sie wird von `.table-wrap` **abgeschnitten**, nicht nur falsch positioniert — und in `lines` und `zen` fällt es zusätzlich anders aus als in klassisch | 6.1, TT-15, TT-16; strukturell über das Portal, nicht über `position: fixed` (E-113, E-116, E-117) |
| **R-3** | Der Hinweis auf ausgeblendete Erledigte reißt das Höhenbudget | Der Rückfall greift im getragenen Fenster, und weil er selbsttätig ist, sagt es niemand (R-h) | 8.1, TT-24 — **mit** stehendem Hinweis messen, nicht ohne |
| **R-4** | „Hover" wird wörtlich gebaut | Tastatur, Berührung und Vorlesehilfe verlieren eine Angabe, die heute dasteht (SC 2.1.1) | 5.3, TT-09, TT-12; der Knopf ist der Weg, Hover die Zugabe |
| **R-5** | Die Zahl wird aus den **aufgelösten** Marken gebildet | Ein Fehler im `StructureContext` macht aus elf Tags eine leere Zelle, still | 5.2, TT-10 — die Zahl kommt aus `todo.tagIds` |
| **R-6** | Der Exportstand hängt in derselben `Promise.all` wie die Liste | Fällt `loadExportSummaries` aus, fällt die ganze Todo-Liste in Z4 — obwohl nur Spalte 7 betroffen wäre | **Bestand, von T-361 nicht geändert.** Benannt, damit es nicht als Nebenwirkung dieses Umbaus gelesen wird. Eine Behebung wäre ein eigener Auftrag |
| **R-7** | „Status" und „Tags" stehen künftig zweimal in derselben Ansicht — als Filter und als Spaltenkopf | Vorbestehende Prüffälle werden im strikten Modus vieldeutig und fallen um, ohne daß sie jemand angefaßt hat (R-g, T-315/T-316) | Abschnitt 12, Suche vor dem Bauen; Abfragen schränken die Rolle ein |
| **R-8** | Die Kopfzeile wird als „kein neuer Text" durchgewinkt | A-25.7 ist abschließend aufgezählt; ein ungedeckter Bau ist derselbe Fehler wie ein ungedeckter Satz | Abschnitt 12, Offene Frage 1 — vor dem Bau zu entscheiden, nicht danach |
| **R-9** | Ein Halt mehr je Zeile bei 100 Zeilen | Der Tabulatorweg durch die Liste wird um bis zu 100 Schritte länger | Bewußt in Kauf genommen (10), und der Halt entsteht nur an Zeilen mit Tags. Der Gewinn ist eine Angabe, die ohne Maus sonst gar nicht erreichbar wäre. Wer die Liste überspringen will, benutzt weiterhin die Sprungmarke und die Filterleiste |

**Sicherheit.** Diese Aufgabe öffnet keine Vertrauensgrenze: keine neue Adresse, kein Datenweg,
keine Route, keine Datei auf der Platte. **Ein Hinweis bleibt, und er ist neu:** Die Tag-Fläche
zeigt fremden Text (Tag-Namen und Ordnerpfade können aus dem Add-in oder aus einem Fremdimport
stammen) auf einer Fläche, die es bisher nicht gab. `TagChip` führt Name und Pfad bereits über
`Foreign` beziehungsweise `foreignText` (E-063, T-124) — **die Fläche muß denselben Baustein
benutzen und darf den Pfad nicht selbst zusammensetzen.** Ein `path.join(" / ")` außerhalb von
`TagChip` wäre fremder Text ohne Behandlung.

---

## 17. Offene Fragen

- **OF-1 — A-25.7 deckt die Kopfzeile nicht.** Abschnitt 12. An den Orchestrator, mit einem
  Wortlautvorschlag. **Vor dem Bau zu entscheiden.**
- **OF-2 — Bekommt die Todo-Zeile das Kontextmenü der Buchungszeile?** `BookingTable` öffnet ihr
  Zeilenmenü zusätzlich über die rechte Maustaste und über `Umschalt`+`F10`, an jeder Stelle der
  Zeile. Die Todo-Zeile kann das nicht. Dieses Papier fügt es **nicht** hinzu (neue Funktion), und
  10.1 zeigt, daß der Tastaturweg auch ohne es zu ist. Es wäre trotzdem eine Angleichung, die zwei
  Tabellen einander ähnlicher macht — ein eigener Auftrag.
- **OF-3 — Sortieren am Spaltenkopf?** Entschieden: nein (Abschnitt 7), weil es ein zweites
  Stellglied für einen vorhandenen Zustand wäre. Will der Auftraggeber es, muß das Stellglied in
  der Filterleiste im **selben** Auftrag weichen, und der Filterchip „Ordnung: …" mit ihm.
- **OF-4 — Filtern durch Klick auf eine Marke in der Fläche?** Naheliegend und heute nicht
  vorhanden. Dieses Papier sagt nein (5.4). Es wäre der kürzeste Weg von „dieses Todo hat Tag X"
  zu „zeig mir alle mit Tag X", und der Zustand dafür existiert bereits (`tagIds` in
  `TodoListScreen`). Ein eigener Auftrag, und ein guter.
- **OF-5 — Standard-Tags in der Fläche kennzeichnen?** `TagChip` kann es (`isDefault`, Abzeichen
  „S" mit dem verborgenen Text „Standard-Tag"). Die Zeile ruft es heute nicht auf. In der Fläche
  wäre Platz dafür. Neue Information in dieser Ansicht, also nicht in T-361.
- **OF-6 — Soll die Zahl in der Tag-Zelle bei sehr vielen Tags gedeckelt werden?** Drei Ziffern
  sind der Deckel für die Spaltenbreite (5.2). Ob es Todos mit mehr als 999 Tags geben kann, ist
  eine Frage an die Fachlogik und nicht an dieses Papier; bis dahin ist die Spalte auf drei Ziffern
  ausgelegt.
