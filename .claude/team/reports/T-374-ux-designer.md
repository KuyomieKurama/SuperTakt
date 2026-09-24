# T-374 — `todo-tabelle-fluss.md` nach T-366, T-365 und den Entscheidungen nachgezogen

**Aufgabe:** T-374
**Rolle:** ux-designer
**Datum:** 2026-09-14
**Status:** fertig — braucht Review (spec-ux-reviewer), ein Abgleich mit T-373 offen

---

## Artefakte

| Datei | Art |
|---|---|
| `docs/design/todo-tabelle-fluss.md` | **zweite Fassung** — §0 Zuordnungstabelle, §2, 3.2, 3.3, 3.5, §4 neu geschrieben, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, §7, 8.1, §9, §10, 10.1, 10.2, §12 (neu gegliedert in 12.1–12.3), §13, §14 (TT-Liste), §15 (neu gegliedert in 15.1–15.4), §16, §17 |
| `.claude/team/reports/T-374-ux-designer.md` | dieser Bericht |

**Nicht angefaßt:** `docs/design/todo-tabelle.md` (gehört T-373 in derselben Welle), `docs/spec.md`,
Produktivcode, Prüfcode. Gelesen wurden `T-366-spec-ux-reviewer.md`, `T-365-frontend-dev.md`,
`docs/spec.md` Abschnitt 25, `docs/design/todo-tabelle.md`, und am Bestand nachgeschlagen:
`TodoTable.tsx`, `TodoListScreen.tsx`, `BookingsScreen.tsx`, `ExportGroups.tsx`.

---

## Zusammenfassung

Alle acht blockierenden Befunde aus T-366 sind eingearbeitet, jeder mit der Entscheidung, die er
umsetzt, an der Stelle benannt und vorn in einer Zuordnungstabelle verzeichnet. Die fünf, die
**gegen** dieses Papier gingen, sind umgeschrieben und nicht weginterpretiert: Der Titel bricht um
(§4 vollständig neu, TT-07 und TT-08 gestrichen, Ersatz TT-31/TT-32), der waagerechte Lauf unter
1280 ist erlaubt (TT-04 verschoben, 10.1/10.2 berichtigt), die Tag-Fläche schließt beim Bildlauf
in **beiden** Modalitäten (6.2/6.3 neu, TT-18 umgeschrieben, TT-34 neu), die Zählung in §13 steht
auf zwölf Fundstellen, und §12 zählt dreizehn Einträge statt zehn. Die drei, die **für** dieses
Papier gingen, tragen jetzt die gebauten und gemessenen Zahlen: der nicht-modale Popover als
Träger von P2 (6.1, eingetragen — nicht entschieden, die Bauformwahl bleibt T-362), 43,5 rem gegen
44 rem Budget (15.1), 73,5 % Höhenbudget mit stehendem Hinweis (8.1, R-3 widerlegt). Drei Lehren
stehen ausgeschrieben im Papier, nicht im Bericht: die zurückgereichte Zahl (15.1), der falsche
Vorgriff, der an drei Stellen gleichzeitig stand (12.2), und die Deckung, die aus dem Gedächtnis
aufgezählt wird (12.1).

---

## Die acht Entscheidungen, einzeln — was geändert ist und wo

### B-1 Langer Titel — **gegen dieses Papier**

**§4 ist vollständig neu geschrieben**, nicht nur umetikettiert. Die alte Begründung
(vier Gründe für Kürzung, „die Lösung gibt es schon") steht nicht mehr da; an ihrer Stelle stehen
die drei Gründe für den Umbruch: Haupt- gegen Nebenrolle im Bestand (`app.css:5230` gegen
`BookingTable.tsx:274`), die selbst eingeräumte `title`-Lücke bei Tastaturfokus als
Widerlegungsgrund statt als Nebensatz, und `proof:clamp` als das, was es ist — ein Wächter, der
eine Kürzung hier **nicht** rot gemacht hätte (Menge A an `UncappedText`, ein Todo-Titel ist
`ForeignText`), also kein Maßstab für die Entscheidung.

- **TT-07 und TT-08 gestrichen.** TT-08 ist mit Umbruch bei jedem denkbaren Bau rot; eine Meßlatte,
  die eine gestrichene Entscheidung mißt, ist schlimmer als keine.
- **TT-31 neu:** keine Zelle kürzt, kein `title`-Attribut, gemessen an ≥ 200 Zeichen.
- **TT-32 neu:** keine neue deckelnde Klasse (`proof:clamp` zählt dieselbe Zahl), **und die
  Gegenprobe ist der Prüfpunkt** — die sieben übrigen Spalten halten ihre 40 px, obwohl vier von
  ihnen umbrechen.
- **R-10 neu:** 76,6 px statt 40 px bei 110 Zeichen. Der Preis steht im Papier, nicht in einer
  Fußnote.
- **Eine Lehre eingetragen:** „Die Lösung gibt es schon" war das stärkste Argument der ersten
  Fassung und zeigte auf die falsche der beiden vorhandenen Lösungen. Wer sich auf den Bestand
  beruft, zählt die Fundstellen, bevor er sich auf die erste beruft.

### B-2 Waagerechter Lauf — **gegen dieses Papier**

**TT-04 steht auf 1280.** 10.1 trägt die berichtigte Auflage samt den drei Sachgründen (A-25.2
verbietet den Lauf nicht; `.table-wrap` ist einer von zwei erlaubten Kästen; SC 1.4.10 nimmt
zweidimensionalen Inhalt aus) und den gemessenen Paaren aus T-365. 10.2 ist nachgezogen: Der Satz
„ein Bildlauf ist sichtbar, eine verschwundene Spalte nicht" ist von der Nebenbemerkung zur
tragenden Begründung geworden. **Eine Bedingung habe ich dabei stehengelassen und ausdrücklich
benannt:** Der Lauf ist erlaubt, **weil** er bedienbar ist (Kästchen links und Menü rechts sind
beide fokussierbar, der Fokus holt sie zurück) — fiele die Bedienbarkeit, fiele die Erlaubnis mit
ihr.

### B-3 Spaltenbudget — in dieses Papier hinein aufgelöst, **und die Lehre ist die Ausbeute**

**15.1** trägt die gemessene Zahl: 696 px = **43,5 rem** gegen ein Budget von 44 rem, Titelspalte
17,8 rem bei 1280 und 16,4 rem bei 960/1024. Die angeordnete Zusammenlegung war nicht nötig und ist
nicht gebaut. Der Weg der Zahl steht in fünf Schritten im Papier (zurückgereicht → als Auflage
gesetzt → von niemandem gerechnet → aus fremden Breiten auf 56,5 rem gerechnet → gemessen 43,5 rem),
und daraus die zwei Sätze, die ich für den wichtigsten Ertrag dieser Runde halte:

> **Eine zurückgereichte Zahl ist keine geklärte Zahl.**
> **Eine aus fremden Breiten gerechnete Zahl ist ein Verdacht, kein Maß.**

Dazu ein Satz zugunsten des Prüfers, der im Papier steht und hier wiederholt sei: Die Rechnung war
**als Verdacht richtig und wertvoll** — ohne sie hätte niemand gemessen. Falsch war nicht das
Rechnen, sondern daraus eine Anordnung zu machen, bevor jemand nachgesehen hat.

### B-4 Bauform der Tag-Fläche — **für dieses Papier**

P2, TT-12 und TT-19 bleiben unverändert stehen. **6.1 trägt die gebaute Form nach — ausdrücklich
als Befund, nicht als Beschluß:** nicht-modaler Popover, weil `hover-card` an seinem Inhalt
`tabIndex: -1` ohne Weg hinein setzt und einen Fokus in der Fläche als „verlassen" liest. 5.3
verweist auf A-25.9, die den Tastaturfokus der Fläche inzwischen **ausdrücklich** verlangt — damit
ist P2 keine Zusage dieses Papiers mehr, die man gegen eine Bauform abwägen kann. 6.4 trägt die
Messung zu TT-19 (vierzig Marken, `Bild ab` bewegt) und den neuen Satz, daß der **innere** Lauf die
Fläche nicht schließt.

**Zwei Dinge habe ich bewußt nicht an mich gezogen** und im Papier so gekennzeichnet: `role="dialog"`
am Inhalt (das ist die Rollenfrage aus `todo-tabelle.md` 5.1 und gehört dorthin) sowie die
Zeitwerte 220/220 ms und der Versatz (`gutter: 4`, `overflowPadding: 8`, `bottom-end`) — das ist
N-5a und Gestalt.

### B-5 Bildlauf bei offener Fläche — **gegen dieses Papier**

**TT-18 lautet jetzt:** „Zeiger: schließt. Tastatur: schließt, und der Fokus steht danach auf dem
Auslöser", mit der Auflage, **beide** Richtungen einzeln zu messen — eine Abfrage, die
„geschlossen **oder** mitgewandert" zuläßt, mißt die Entscheidung nicht. 6.2 nennt die Überdehnung
beim Namen: SC 1.4.13 „beständig" verlangt, daß kein **Zeitgeber** schließt; ein Bildlauf ist kein
Zeitgeber, sondern eine Handlung des Benutzers, und die erste Fassung hat den Unterschied
verwischt. Was die Norm hier statt dessen fordert, ist eingelöst und im Papier zur Zusage gemacht:
Der Ausgang darf nichts kosten — **schließt die Fläche, steht der Fokus auf dem Auslöser**.

**TT-34 ist neu** und trägt die Messung, die eine Zeile Code gekostet hat: Gemessen wird die
**Bewegung des Ankers** gegen seinen Stand beim Aufgehen, nicht das Eintreffen eines
Bildlaufereignisses — sonst schließt die Fläche in dem Augenblick, in dem ein halb sichtbarer
Auslöser beim Anklicken ins Bild gerollt wird. Ohne diesen Satz im Papier baut der nächste den
Wächter wieder am Ereignis.

### B-6 `.todo-row` — **für dieses Papier, und die Zählung berichtigt**

**§13 steht auf zwölf lebenden Fundstellen in acht Dateien**, mit der vollständigen Liste
(deadline-lifecycle 87/167/194; midnight-redraw 78/90; tag-input 212/213; todo-revival 190 plus
Kommentar 192; focus-return-after-dialog 118; attachment-open-commands 238; foreign-title-display
53; kanban 103) und dem Meßergebnis aus T-365 je Datei. Der Satz, der falsch war, steht als Lehre
berichtigt: **Wer eine Menge nennt und sie zugleich auflistet, zählt die Liste, bevor er die Zahl
schreibt** — die Prosa war falsch, die Tabelle richtig, und ein Leser liest die Prosa.

Eingetragen ist außerdem die **zweite Hälfte** von B-6: Die Klasse bleibt, der Paletteneintrag
fällt trotzdem, mit der am Bestand gelesenen Begründung (`lines`: `box-shadow: none` löschte am
`<tr>` die Zugriffsmarkierung; `zen`: `--bg-canvas` nähme nur dieser Tabelle das Zebra). Das ist
Gestaltung und gehört T-362 — ich habe es vermerkt, damit meine Auflage nicht als „faß die Palette
nicht an" gelesen wird, und daraus eine Frage an visual-qa gemacht (Wirkung in `zen` und `lines`
am Bild, nicht am Quelltext — N-9).

### B-7/B-8 A-25.9 — erledigt, §12 neu gezählt

**§12 ist in drei Unterabschnitte gegliedert und zählt dreizehn Einträge:** zehn neue Zeichenketten
(darunter die Unterschrift, jetzt eindeutig als „ein neuer Satz" **und** im Fazit entsprechend
gezählt) und **drei entfallende** (N-8: das Wort „Call" vor der Nummer, `+n`, bis zu drei sichtbare
Tag-Namen), jede mit der Angabe, was an ihre Stelle tritt.

- **12.1** schließt OF-1 und stellt die sechs Gestaltänderungen gegen A-25.9 in der Fassung vom
  2026-09-14. **Die Lehre steht dort ausgeschrieben:** A-25.9 wurde geschrieben, um genau diese
  Lücke zu schließen, und schloß sie beim ersten Versuch zur Hälfte, weil sie drei Änderungen
  aufzählte, wo die Umstellung sechs verlangt. Wer eine Deckung schreibt, spannt seine Menge an der
  Änderung auf, nicht an den drei Änderungen, die ihm einfallen — E-099 Punkt 3, angewandt auf
  einen Anforderungssatz statt auf einen Wächter.
- **12.2** behandelt „die übrigen" → „sie" **als Lehre, nicht als Berichtigung**, wie beauftragt:
  Derselbe falsche Vorgriff stand an drei Stellen (Spezifikation, Schwesterpapier 9.4, und dieses
  Papier hat ihn nicht bemerkt, obwohl 5.2 ihn widerlegt). Drei Quellen, dieselbe Vorstellung,
  keine hat die andere geprüft. **Das ist E-113 in seiner leiseren Form: nicht zwei Papiere, die
  sich widersprechen, sondern drei, die einander bestätigen und gemeinsam danebenliegen. Der
  Widerspruch wird gefunden; die Einigkeit nicht.**
- **12.3** trägt N-10 (vier Wortlaute, nicht zwei) und das gemessene Ergebnis: null Abfragen werden
  vieldeutig, 45 Prüffälle aus elf Dateien grün. R-7 ist damit gemessen und nicht eingetreten —
  mit dem Zusatz, daß es gutging, weil der Bestand `columnheader` nirgends abfragt, und das ist
  Glück in der Sache, kein Verdienst des Papiers.

---

## Die übrigen Punkte des Auftrags

### TT-05, TT-06 und 3.3 — **einzeln geprüft, nicht pauschal stehengelassen**

3.3 trägt eine Tabelle mit je einer Zeile pro Auflage. Alle drei sind gehalten. **Eine Nuance
gehört in den Bericht, weil sie leicht übersehen wird:** „Erledigt aufgehoben" wird **nicht
gekürzt**, aber es **bricht um** — 133,7 px Etikett in einer 144-px-Spalte, zwei Zeilen, Zeilenhöhe
bleibt 40 px. Die Zusicherung von 3.3 sagt also weiterhin „nicht gekürzt" und sagt **nicht mehr**
„einzeilig". Wer sie als „einzeilig" liest, mißt gegen etwas, das dieses Papier nicht verspricht.

### TT-24 / R-3 — widerlegt, Zahl eingetragen

8.1 trägt 432,3 px von 588 px = **73,5 %**, Laufbereich 108 px gegen einen Boden von 64 px,
`.app__main` 588/588, Dokument 640/640. **R-3 ist widerlegt und steht als widerlegt im Papier,
nicht gestrichen** — eine Sorge, die sich als unbegründet erweist, war nicht umsonst; sie war die
Auflage, die zur Messung geführt hat.

### N-6 — trägt der Befund nach dem gebauten Stand noch? **Nein, und er war richtig**

**Antwort: Der Befund ist eingelöst, nicht mehr offen.** N-6 sagte, der Hinweis könne „so" nicht in
den festen Teil, weil `totalWithDone − page.total` dort im Lade- und Fehlerzustand nicht zur
Verfügung steht, und verlangte, den Auftrag müsse einen der beiden Wege ausdrücklich benennen.
T-365 hat den **zweiten** gewählt: Die Zusage für Z0 fällt, der Hinweis steht im Erfolgszweig als
`.screen__bar`. Das halte ich für richtig, und zwar nicht nur als Hinnahme:

- Der andere Weg (Zahl in den Bildschirmzustand heben) zeigte im Ladezustand die Zahl des
  **vorigen** Laufs. Eine still veraltete Zahl ist schlechter als keine — dieselbe Klasse wie die
  Tag-Zelle, die bei `StructureContext`-Fehler heute leer aussieht (5.2, TT-10).
- Die Richtung stimmt: Der Hinweis **erscheint** verzögert, er **verschwindet** nicht. Von den
  beiden möglichen stillen Wechseln ist das der harmlosere.

§9 (Z0 und Z4) ist entsprechend berichtigt — dort stand „Hinweis (falls Zahl bekannt)", und diese
Zusage ist zurückgenommen —, 8.1 trägt beide Wege samt Begründung, und die Folge steht als **R-11**.
**Offen bleibt an dieser Stelle nichts mehr; was bleibt, ist ein benanntes Risiko.**

### N-2 — welche Antwort verlangt dieser Fluß? (**ohne visual-qa vorwegzunehmen**)

3.2 nennt jetzt die Nutzerseite des Risikos und sagt, was **jede** zulässige Antwort erfüllen muß.
Ich habe bewußt keine Gestalt vorgeschlagen — das wäre der Übergriff, den die Abgrenzung verbietet,
und T-365 hat richtig darauf verzichtet, eine vierte sichtbare Unterscheidung zu erfinden. Vier
Bedingungen:

1. **Kein neuer sichtbarer Text** — A-25.9 deckt keinen Zusatz in der Zelle.
2. **Nicht Farbe allein** (SC 1.4.1).
3. **Im *leeren* Zustand wirksam** — eine Unterscheidung, die erst nach dem Klick sichtbar wird,
   kommt zu spät; der Fehlklick **ist** der Schaden. Das schließt jede Lösung aus, die nur am
   gesetzten Kästchen hängt, und es ist die Bedingung, die die meisten naheliegenden Vorschläge
   fallen läßt.
4. **Verträglich mit kompakter Dichte und 24 × 24 px.**

**Und die Antwort, die mein Fluß verlangt, wenn keine Gestalt alle vier erfüllt:** dann ist „keine
sichtbare Unterscheidung" richtig — und dann trägt die **Rücknahme** das Risiko. Bedingung, und sie
ist die eigentliche Zusage an dieser Stelle: Das Markieren aus der Tabelle heraus führt denselben
Weg wie heute aus der Liste (`undoDone.ts`, Toast mit Rücknahme), zeichengleich und ohne
Zwischenschritt. Eine Spalte, die einen Zustand mit einem Klick ändert, **und** eine Rücknahme, die
dabei wegfällt, wären zusammen eine Sackgasse; einzeln ist keines von beiden eine.

### N-1 und N-4 — die beiden Ergänzungen, die schlicht fehlten

- **N-1 (Affordanz):** §7 trägt jetzt die Auflage, daß die Kopfzellen weder `.table__sort` noch ein
  Pfeilsymbol noch `--hit-target-min` tragen; **TT-03 mißt das mit**, samt Gegenprobe gegen
  `BookingTable`. Vorher maß TT-03 nur die Abwesenheit von `aria-sort` — und ein Kopf kann
  knopfförmig aussehen, ohne `aria-sort` zu tragen.
- **N-4 (Randmarkierung):** F-8 war die einzige Frage, die **beide** Papiere unbeantwortet gelassen
  haben. Antwort in 3.5 und 9.3: `.table__row > td:first-child` bleibt durchsichtig, in jedem
  Zeilenzustand, mit zwei Gründen (Konkurrenz zu `--running`; die Schiene wäre nach einem
  waagerechten Lauf als Erstes aus dem Bild). **TT-33 neu.**

### N-11 — Genauigkeit

`BookingsScreen.tsx:473` statt `BookingTable.tsx:473` (§12 Nr. 10). „Unbekannt" steht nach dem
Umbau in `TodoListScreen.tsx:215`; die erste Fassung schrieb `:206`, T-366 berichtigte auf `:207`,
und beide sind inzwischen überholt — ich habe die Nummer eingetragen **und** dazugeschrieben, daß
eine Zeilennummer ein Stand ist und kein Beleg. Die Abgrenzung steht seit dieser Fassung auf **elf**
Fragen (zehn in der Tabelle, eine im Fließtext).

### 15.2 bis 15.4 — die Übergabe an T-362

Drei der vier Fragen sind beantwortet und stehen mit ihrer Antwort im Papier (Palettenregel →
Abschnitt 13; klebender Kopf mit Fußzeile → gemessen, samt der bestätigten `tfoot`-Rechnung 662 px
gegen 958,5 px). **Die vierte bleibt offen und ist die einzige: das Ladeskelett** (N-5e). Das ist
kein Befund an T-365 — es ist eine unbeantwortete Gestaltfrage.

---

## Annahmen

1. **„Die Bauform eintragen" heißt eintragen, nicht entscheiden.** Auftragspunkt 4 verlangt, die
   gebaute Form dort einzutragen, wo mein Papier sie offenläßt. Ich habe sie in 6.1 als **Befund**
   eingetragen und ausdrücklich dazugeschrieben, daß die Wahl des Bausteins nach der Abgrenzung
   T-362 gehört. Die Alternative — die Wahl an mich zu ziehen — wäre genau der Übergriff, vor dem
   die Warnung zu E-113 steht.
2. **Widerlegte Risiken werden nicht gestrichen, sondern als widerlegt geführt.** R-3 und R-7
   stehen mit ihrem Meßergebnis in der Tabelle. Ein gestrichenes Risiko sieht aus, als hätte es
   niemand gehabt, und die Auflage, die daraus entstand, verliert ihre Herkunft.
3. **§2 Erfolgskriterium nachgezogen.** Der Satz „auf dieselbe Bildschirmhöhe passen mehr Todos"
   gilt nach B-1 für den Regelfall, nicht für jede Zeile. Ich habe das ergänzt statt es
   stehenzulassen — sonst hätte das Papier eine Zusage geführt, die der umbrechende Titel bricht.
4. **Die Zeitwerte 220/220 ms stehen in 6.1 als Angabe des Baus**, nicht als Entscheidung dieses
   Papiers. Sie sind N-5a und gehören dem Schwesterpapier; sie hier zu beschließen, hieße eine
   Frage zu beantworten, die dort steht.

---

## Risiken

| | Risiko | Stand |
|---|---|---|
| **RB-1** | **Der Abgleich mit T-373 hat nicht stattgefunden.** Wir haben getrennt am selben Befundsatz gearbeitet — genau die Lage, aus der E-113 zweimal entstanden ist | Gemildert, nicht aufgehoben: Beide Papiere tragen vorn eine Zuordnungstabelle (Entscheidung → Abschnitt). **Der nächste Abgleich ist dadurch billig, aber er muß stattfinden.** Siehe „Nächster Schritt" |
| **RB-2** | Ich habe `docs/design/todo-tabelle.md` in einem Zwischenstand gelesen | Sein Kopf und seine Berichtigungsliste waren zur Lesezeit geschrieben, Teile des Rumpfes (5.3, 6.2) standen noch in der ersten Fassung. **Ich verweise deshalb ausschließlich über Abschnittsnummern, nie über Zeilennummern** — und die drei Stellen unten sind gegen die **Berichtigungsliste** von T-373 geprüft, nicht gegen ihren Rumpf |
| **RB-3** | §14 nennt an mehreren Stellen Zahlen aus T-365 | Sie sind als **Messung im Bau** gekennzeichnet, und §14 sagt ausdrücklich, daß das den e2e-tester nicht entbindet (E-117; die Sondierung ist gelöscht und war kein Prüfbestand) |
| **RB-4** | R-10: Die Zeilenhöhe hängt jetzt wieder an den Daten | Folge von B-1, gemessen (76,6 px bei 110 Zeichen), im Papier als Preis benannt. **Eine Frage an visual-qa**, wie eine Liste mit mehreren langen Titeln aussieht — die Messung sagt über den Eindruck nichts |
| **RB-5** | Zwei Wortlaute von T-366 habe ich **nicht** übernommen | T-366 N-10 Punkt 2 schlägt vor, die Doppelung „Erledigt, Erledigt" im Tabellenmodus einer Vorlesehilfe „anzunehmen und den Satz dazu ins Papier zu schreiben". Ich habe sie angenommen, aber **keinen eigenen Absatz** dafür angelegt — sie steht in 3.2 als Teil der Begründung für den Wortkopf. Wer den Satz ausdrücklich sehen will, findet ihn dort nicht wörtlich |

**Sicherheit.** Unverändert gegenüber der ersten Fassung: keine neue Vertrauensgrenze, keine
Adresse, kein Datenweg, keine Route. Der Hinweis in §16 bleibt scharf — die Tag-Fläche zeigt
fremden Text (Tag-Namen und Ordnerpfade aus dem Add-in oder einem Fremdimport) auf einer Fläche,
die es bisher nicht gab, und sie muß `TagChip` benutzen statt den Pfad selbst zusammenzusetzen.
T-365 meldet `proof:foreign` grün (21/0, 185 behandelte Übergaben) und kein `path.join` außerhalb
des Bausteins.

---

## Was ich am Schwesterpapier für nötig halte — mit Abschnitt, ohne es anzufassen

`docs/design/todo-tabelle.md` gehört T-373. Drei Stellen, die ich aus meiner Sicht nennen muß; die
Berichtigungsliste von T-373 kündigt alle drei an, **eine davon aber mit einer Formulierung, die
den Befund nicht ganz trifft**:

1. **9.4 (Vorrat) — angekündigt als „mißt nicht mehr gegen ‚mehr Tags, als die Zelle zeigt'".**
   Das ist richtig und reicht nicht: Nach 5.2 meines Papiers gibt es den Auslöser an **jeder** Zeile
   mit mindestens einem Tag. Der Vorrat braucht deshalb **zwei** Fälle — ein Todo mit *genau einem*
   Tag (dort muß der Auslöser da sein) und eines mit mehr Marken, als die Fläche ohne eigenen Lauf
   faßt (für P3/TT-19). Ein Vorrat, der nur die Voraussetzung streicht, ohne den Einzelfall
   aufzunehmen, mißt E-111 nicht.
2. **A14 (9.3) — angekündigt als „nach Modalität getrennt".** Genau richtig. Zur Sicherheit der
   Grund, damit er beim Schreiben nicht verlorengeht: A14 ließ „geschlossen **oder** mitgewandert"
   zu und war damit unter der **alten** TT-18 in beide Richtungen grün. Nach B-5 ist „mitgewandert"
   **rot** — die Zusicherung muß das Schließen fordern, nicht zulassen.
3. **5.1 (Gründe gegen `DialogSurface`) — angekündigt als „`aria-modal="true"` trägt den Einwand,
   nicht `role="dialog"`".** Genau das ist die Auflösung, die ich brauche: Mein 6.1 verweist für die
   Rollenfrage auf 5.1. Solange dort `role="dialog"` als Einwand steht, führt der gebaute Popover
   eine Abweichung, die mein Papier nicht auflösen darf.

**Keine dieser drei Stellen beantwortet eine Frage aus meiner Abgrenzung**, und ich habe keine
Frage beantwortet, die in F-1 bis F-10 des Schwesterpapiers steht.

---

## Offene Fragen an den Orchestrator

1. **Wer legt die beiden Papiere gegeneinander?** Der Abgleich, den T-366 gefahren hat, ist der
   Grund, warum acht Widersprüche gefunden wurden; ohne ihn wäre der Bau zweimal gelaufen. T-373
   und ich haben wieder getrennt gearbeitet. Beide Fassungen tragen jetzt eine Zuordnungstabelle,
   die den Abgleich billig macht — **billig ist nicht dasselbe wie erledigt.** Vorschlag: eine
   kurze Gegenlesung in der nächsten Welle, beschränkt auf die drei Stellen oben plus B-1 und B-5.
2. **N-2/OF-7 geht an visual-qa.** Ich habe die vier Bedingungen genannt und die Antwort nicht
   vorweggenommen. Wenn visual-qa „keine sichtbare Unterscheidung" antwortet, ist das nach meinem
   Fluß zulässig — **unter der Bedingung, daß die Rücknahme zeichengleich bleibt.** Diese Bedingung
   sollte im Auftrag an visual-qa stehen, sonst prüft er nur das Kästchen.
3. **Zur Kenntnis, keine Frage:** Die Zusammenlegung von „Erledigt" und „Status" ist nach der
   Messung nicht nötig, nicht gebaut, und mein 3.1/TT-01 hält weiterhin acht Spalten. Sollte die
   Anordnung doch gemeint gewesen sein, ändert sich §3.1, §12 (die Kopfzelle müßte zwei Dinge
   benennen und wäre ein neuer Wortlaut), TT-01 und E-023s sichtbare Trennung — das ist eine
   Papieränderung, kein Nachtrag.

---

## Nächster Schritt

1. **spec-ux-reviewer** liest diese Fassung gegen `todo-tabelle.md` in der Fassung von T-373 —
   beschränkt auf die fünf Stellen aus „Offene Fragen" 1. Die Zuordnungstabellen vorn in beiden
   Papieren sind dafür die Karte.
2. **visual-qa** beantwortet N-2/OF-7 am Bild, mit den vier Bedingungen aus 3.2 als Maßstab, und
   prüft zusätzlich R-10 (mehrere lange Titel untereinander) und N-9 (`zen` und `lines`, wo die
   Todo-Ansicht erstmals das Zebra einer Tabelle zeigt).
3. **e2e-tester** in der nächsten Welle: TT-01 bis TT-34 in **dieser** Fassung. **TT-07 und TT-08
   gibt es nicht mehr; TT-04 steht auf 1280; TT-18 verlangt in beiden Modalitäten das Schließen.**
   Neu sind TT-31, TT-32, TT-33 und TT-34 — TT-34 ist die Gegenprobe zu TT-18 und der Punkt, an dem
   ein am Bildlaufereignis gebauter Wächter auffällt.
4. **ui-designer (T-373)** trägt 9.4, A14 und 5.1 nach, falls seine Fassung sie noch nicht so
   führt.
