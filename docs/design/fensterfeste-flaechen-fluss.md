# Fensterfeste Flächen — der Fluß je Ansicht

**Aufgabe:** T-322, nachgezogen in **T-340**, gegen das Schwesterpapier berichtigt in **T-344**,
gegen den Widerspruch in AK-14 berichtigt in **T-354**, um die Todo-Tabelle ergänzt in **T-361**.
**Verfasser:** ux-designer; T-344 und T-354 ausnahmsweise ui-designer (siehe **Hoheit**).
**Stand:** 2026-09-14, fünfte Fassung.

**Was T-361 an diesem Papier ändert — vier Stellen, und drei davon sind erzwungen.** Die
Todo-Liste wird auf Wunsch des Auftraggebers eine Tabelle (`docs/design/todo-tabelle-fluss.md`).
Weil ein Tabellenkopf nur klebt, wenn `.table-wrap` **selbst** der senkrechte Laufbereich ist
(5.1, 5.2), hat der Laufbereich der Todos danach **kein Geschwister mehr** — und genau zwei
Flächen standen dort bisher neben der Liste.

| Nr. | Stelle | Berichtigung | Grund |
|---|---|---|---|
| 1 | **4.2**, Zeile „Hinweis ‚n erledigte Todos sind ausgeblendet'" | **läuft → steht.** Er zieht in den festen Teil, unmittelbar über die Tabelle | Er kann kein Geschwister der Tabellenfläche mehr sein, ohne den klebenden Kopf zu verlieren. R-1 Punkt 4 trägt ihn: Er steht heute unmittelbar über dem Laufbereich und erklärt, warum die Liste kurz ist — derselbe Fall wie `.bulkbar` in S-06. Seine Bildschirmstelle ändert sich nicht (AK-05). **Der Preis ist gemessen:** Der feste Teil der Todos steht an der getragenen Untergrenze bei 75,9 % seines Budgets (T-341 3.3); AK-23 ist dort **mit** stehendem Hinweis neu zu messen |
| 2 | **4.2**, Zeilen „Liste" und „Weitere laden" | Aus der Liste wird die Tabellenfläche, die zugleich der Laufbereich ist. „Weitere laden" wird **Fußzeile innerhalb** der Tabelle | Gleicher Grund. Die Aussage von 4.2 bleibt wahr: Das Ende der Liste ist der Ort, an dem man weiterlädt, und er läuft mit |
| 3 | **5.**, Kopf, und **5.3** Punkt 2 | Abschnitt 5 gilt für **drei** Tabellen, nicht mehr für eine; und 5.3 Punkt 2 trägt für die Todo-Tabelle **nicht** | Die Todo-Zeile hat kein Kontextmenü (`TodoRow.tsx` legt kein `onContextMenu`), anders als `BookingTable.tsx:237-249`. Der Verzicht auf eine klebende Spalte steht dort trotzdem — Punkt 3 trägt ihn allein, weil Kästchen und Menü-Auslöser beide fokussierbar sind (T-361 10.1) |
| 4 | **R-6** Punkt 1 | Die Tag-Fläche der Todo-Tabelle tritt in die Aufzählung der überlagernden Flächen ein | E-116 ist für Bestätigungsflächen geschrieben, ihr **Mechanismus** gilt für jede Fläche über anderem. Bei dieser kommt ein Grund dazu, den es bei den Menüs nicht gab: `.table-wrap` trägt beide Achsen und **schneidet** (5.1) |

**Eine Deckungslücke, die T-361 gefunden und nicht überspielt hat:** Eine Tabelle hat eine
Kopfzeile, und eine Kopfzeile ist neuer Oberflächentext. **A-25.7** zählt die erlaubten
Gestaltänderungen **abschließend** auf, und die Todo-Tabelle steht nicht darin. Das ist Offene
Frage 1 in T-361 und gehört dem Orchestrator; dieses Papier ändert `docs/spec.md` nicht.

**Was T-354 tut.** Eine Stelle, und sie ist der Widerspruch, den T-344 nicht gesehen hat, weil er
nicht zwischen den Papieren lag, sondern **in** ihnen: **AK-14 (c)** verlangte die Bildlaufstelle
„genau dieses Kastens", und 4.5 desselben Papiers sagt für die Zeiterfassung unterhalb von 68 rem
ausdrücklich, daß dort der **Rahmen** rollt. 68 rem sind 1088 px; zwei der vier getragenen Meßgrößen
liegen darunter (T-351 B-20). Wörtlich gebaut wäre AK-14 (c) an vier von sieben Größen rot — und
nach dem ersten falschen Rot wird eine Zusage gelockert, nicht berichtigt (R-k).

| Nr. | Stelle | Berichtigung | Grund |
|---|---|---|---|
| 1 | **AK-14** (a) und (c), gleichlautend **A9** im Schwesterpapier | (a) wird **über die getragenen Größen hinweg** ausgewertet; (c) bekommt einen **zweiten, abschließend aufgezählten Zweig**: der nächste laufende Vorfahr, allein für die Zeiterfassung unterhalb von 68 rem | 4.5 und T-323 8.5 Punkt 1 sagen seit T-344 dasselbe Gegenteil. Die tragende Aussage bleibt: **Nach der Sprungmarke muß `Bild ab` meßbar etwas bewegen** — gemessen 0 → **392 px** (Einstellungen) und 0 → **36 px** (Kanban, `Pfeil rechts`) gegen zweimal 0 vorher (T-348) |
| 2 | **R-4**, Abschnitt 7 | Worauf die Marke zeigt, **wenn der Inhaltshalt in diesem Zustand nicht existiert** (Z0, Z3, Z4) | Die Zuordnung aus T-344 gilt je Ansicht, nicht je Zustand; `.board` und Laufbereich A entstehen erst mit den Daten (T-351 B-08). Ohne den Satz rät der nächste Bau |
| 3 | **AK-25** | Ein **Meßstand** dazu: welche Teilsätze von A-25.6 ein Lauf trägt und welche nicht | T-348 sichert von fünf Teilsätzen **zwei** zu, einen mittelbar. AK-25 verlangte sieben Paletten und zwei Farbmodi, und kein stehender Lauf sieht sie — dieselbe Klasse wie B-04 |

**Was T-344 tut, und warum es ein einziger Auftrag war.** T-339 und T-340 haben dieselbe
Berichtigung an zwei Agenten verteilt, die einander nicht lesen konnten. Ergebnis: Die beiden
Papiere sagen über **denselben gemessenen Fall** das Gegenteil — der 86-px-Überlauf der
Einstellungen bei 1024 × 640 ist hier ein Fehler (R-3a, E-115) und dort eine benannte Ausnahme
(T-323 9.6). Der Satz, der im Kopf des Schwesterpapiers steht — *„Zwei Papiere, die einander
bestätigen, sind keine Messung"* — hat diesmal nicht geholfen, weil sie einander gar nicht gelesen
haben. Der zweite Satz dazu steht dort und gilt hier genauso:

> **Zwei Papiere, die einander nicht lesen, widersprechen einander nicht seltener — nur später.**

**Was T-344 an diesem Papier ändert** — vier Stellen, keine davon neu erfunden:

| Nr. | Stelle | Berichtigung | Grund |
|---|---|---|---|
| 1 | R-4, Abschnitt 7, AK-14 | Die Sprungmarke zeigt auf den **Inhaltshalt** — den Kasten, der wirklich läuft. Die Zusage „genau ein weiterer Tabulatorschritt" ist **zurückgenommen** | `ScreenBody.tsx:159-168` setzt Marke und Halt auf `.screen__body--frame`, der im getragenen Fenster nicht läuft: Bild-ab tut in drei Ansichten nichts, in den Einstellungen liegen neun Schritte dazwischen (T-343 B-07). **A-25.5** sagt es seit heute wörtlich |
| 2 | R-5 | „Noch kein Tag" (S-08) und „Noch kein Vorgang protokolliert" sind **Kartenleerzustände** | Sie liegen in einer Karte, neben der eine zweite weiterläuft; `margin-block: auto` greift dort nicht (T-343 B-11). Das Kennzeichen ist die Stelle im Baum, nicht das Gefühl (T-323 Abschnitt 10) |
| 3 | AK-10, AK-15 | Beide bekommen ihren Geltungsbereich: AK-10 gilt **ohne den Rückfall**, AK-15 für **senkrechte Laufbereiche aus Abschnitt 4** und mit der Ausnahme aus T-323 8.5 | AK-10 war im Rückfall bei stehender Hüllenmeldung verletzt (T-343 B-09); AK-15 gab auf den Lade- und Fehlerzustand der Todo-Detailansicht eine andere Antwort als das Schwesterpapier (B-12) |
| 4 | 4.11, OF-6 | **Beantwortet:** Die Bereichsschiene gibt bei knapper Höhe ihren **Zusatz** auf — dieselbe Gestaltung, die sie bei knapper Breite schon aufgibt | Entschieden in T-323 7.5, wohin die Frage von hier abgegeben war. Damit wird der einzige bekannte E-115-Verstoß behoben statt ausgenommen |

**„Getragen" heißt ab jetzt in beiden Papieren dasselbe:** mindestens 960 × 640 **und**
ungeschmälerter Inhaltsbereich. Die zweite, weitere Fassung im Schwesterpapier („getragen im
Browserbetrieb bis 640 × 480") heißt dort jetzt **„bedienbar im Browserbetrieb"** und sichert AK-24
zu, nicht AK-02 (T-343 B-03).

**Was T-340 berichtigt — und warum jede Berichtigung erzwungen war.** Die erste Fassung ist
gebaut (T-326), geprüft (T-331, T-329, T-332) und nachgebessert (T-334) worden. An vier Stellen
sagte sie etwas anderes als der **gemessene** Bestand. Berichtigt wurde nur das; alles Übrige
steht unverändert.

| Nr. | Stelle | Berichtigung | Der Grund, der sie erzwungen hat |
|---|---|---|---|
| 1 | AK-02, R-3, Z6, AK-18 | „Im Rückfall null innere Laufbereiche" ist **zurückgenommen** | Der Mechanismus aus T-323 7.2 hat für den Rückfall bewußt keine Medienstufe: `.app__main` behält `overflow-y: auto`, `.screen__body` hat einen Boden von 4 rem. Wird das Fenster niedriger, läuft der Rahmen — und der Laufbereich läuft **innerhalb seines Bodens** weiter. Eine Höhenabfrage könnte das nicht heilen: `@media (max-height: …)` mißt das Fenster, R-3 spricht vom Inhaltsbereich. Entschieden zugunsten von T-323; E-112 Punkt 3 ist entsprechend berichtigt. |
| 2 | 4.11 | Der Name des Einstellungs-Laufbereichs kommt aus `AREA_LIST` | T-334 hat `PANEL_LABEL` gestrichen — zwei Listen für denselben Namen laufen auseinander, eine kann es nicht. In zwei Bereichen heißt der Laufbereich dadurch „Outlook-Add-in" bzw. „Arbeitsplatz" statt „Einstellungen". |
| 3 | R-6 | Bestätigungsflächen sind **keine** Geschwister des Laufbereichs | In `glass` und `liquid-glass` hing die Rückfrage vor dem Öffnen einer Datei an der Karte statt am Fenster: „Öffnen" außerhalb des sichtbaren Bereichs, die Fläche rollte mit (R-31). Behoben über einen Portalbaustein (T-334). |
| 4 | R-3a, AK-02a, AK-23, AK-24 | Der Rückfall bekommt einen **Geltungsbereich** | Der e2e-Lauf (T-330) fand zehn Verstöße gegen A2 an sechs Ansichten bei 960 × 640, 831 × 640 und 640 × 480; T-334 hält den Überlauf der Einstellungen bei 1024 × 640 für den Rückfall. Ohne Geltungsbereich ist beides gleichzeitig richtig und falsch. Die Entscheidung steht in R-3a. |

**Deckung: `docs/spec.md` Abschnitt 25, A-25.1 bis A-25.8** — nachgetragen am 2026-09-13 auf den
Befund T-343 B-01 und am selben Tag nach T-351 berichtigt: **A-25.5** trägt die beiden entschiedenen
Ausnahmen (B-17), **A-25.7** bindet sich an die Sache statt an den Zustand (B-18), **A-25.8** ist neu
und nennt die drei ausgenommenen Flächen (B-16). Hier standen bis dahin geliehene IDs (A-13.1, A-13.2, A-13.8, A-13.9,
Abschnitt 14, Abschnitt 15, A-13.4, A-13.5, A-21.2, A-21.3), und **keine davon trug den Satz, um
den es geht**: A-13.8 spricht von der Fenster*breite*, Abschnitt 14 von der **globalen**
Navigation, die von diesem Umbau nie betroffen war, A-21.3 ist die Auflage **an** ihn und nicht
seine Deckung. Die Zuordnung Regel → ID:

| Regel | Deckung |
|---|---|
| Modell, R-1, R-2 | **A-25.3** (ein fester Teil, ein Laufbereich; zwei nur nebeneinander) |
| R-3, R-3a, AK-23 | **A-25.4** (getragene Größe, Höhenbudget, Rückfall darunter) |
| Abschnitt 0, AK-01, AK-02a | **A-25.1**, **A-25.2** (nichts wächst über das Fenster; es läuft nur der betroffene Bereich) |
| R-4, Abschnitt 7, AK-14, AK-15 | **A-25.5** (Laufbereich mit Tastatur erreichbar und benannt; die Marke führt auf eine Fläche, die **läuft**) |
| R-6, AK-25 | **A-25.6** (Bestätigungsfläche am Fenster) |
| Abschnitt 10, AK-05, AK-22 | **A-25.7** (kein neues Aussehen, kein neuer und kein gestrichener Text) |
| OF-4 (Aufgabenbereich des Add-ins) | **A-25.8** (ausgenommene Flächen) — *nachgetragen T-354:* Die Frage aus OF-4 ist in der Spezifikation angekommen und dort **verneint**; sie bleibt als Frage an den Auftraggeber stehen (E-112, T-351 B-16) |
| Zustände Z0 bis Z7, R-5 | Abschnitt 15 — **trägt weiter**, er verlangt die Zustände ausdrücklich |

Bestand, nicht geändert: `docs/design/supertakt-layout.md`, `docs/design/kartenkopf-board.md`,
`docs/design/textabbau-gestalt.md`.

**Hoheit.** Dieses Papier gehört ux-designer. Es ändert `docs/spec.md` nicht, es faßt keinen
Produktivcode an, kein CSS und keine Datei unter `apps/**` oder `packages/**`.

**Eine benannte Ausnahme, und sie hat einen Grund:** In **T-344** hat der Orchestrator beide
Papiere **einem** Agenten gegeben — dem ui-designer. Die Hoheitsregel („je eigenes Artefakt, nie
dieselbe Datei") trennt Dateien; sie trennt keine Widersprüche. Zwei Berichtigungen desselben
gemessenen Falls, an zwei Agenten vergeben, die einander nicht lesen können, haben den Widerspruch
erzeugt, den sie beseitigen sollten. Die Ausnahme gilt für diesen Auftrag und endet mit ihm; danach
gehört dieses Papier wieder ux-designer.

**Abgrenzung zu T-323, hart.** Hier steht, **was** je Ansicht stehenbleibt und **was** läuft,
in welcher Reihenfolge, unter welchem Namen und mit welchem Verhalten in Leer-, Lade- und
Fehlerzustand. Klassen, Höhenkette, Mindestgrößen, Bildlaufleisten, Rinnen und Zahlen nennt
T-323. In diesem Papier steht **keine** CSS-Regel.

**Kein neues Aussehen.** Reihenfolge, Wortlaut, Farben, Abstände, Karten und Aktionen bleiben,
wie sie sind. Wo eine Entscheidung das Aussehen verändert hätte, ist sie **gegen** die
Veränderung gefallen und der Grund steht dabei (4.7 Zusammenfassungszeile, 5.3 klebende
Spalte).

---

## 0. Der Befund in einem Satz

Das Fenster scrollt heute schon nicht (`.app`, `height: 100%`, `overflow: hidden`) — aber
`.app__main` ist der **einzige** Laufbereich der Anwendung, und deshalb läuft alles darin mit:
Bildschirmkopf, Filterleiste, Zählzeile, Registerreiter. Der Auftraggeber sieht nicht eine
wachsende Seite, sondern eine **Steuerung, die wegläuft**. Genau das ist zu beheben, und nur
das.

Zwei Flächen sind bereits fensterfest gelöst und sind der Präzedenzfall, von dem dieses Papier
nur mit Grund abweicht: die **Formulardialoge** und das **Kanban**
(`apps/web/src/styles/viewport-layout.css`). Das Kanban trägt dabei genau das Muster, das hier
verallgemeinert wird: die Fläche hat einen Kopf, der steht (`.kcolumn__head`), und einen Rumpf,
der läuft (`.kcolumn__body`).

---

## 1. Nutzerziel und Erfolgskriterium

| | |
|---|---|
| **Nutzerziel** | In einer langen Liste, Tabelle oder Gruppierung arbeiten, ohne die Steuerung der Ansicht aus den Augen zu verlieren. |
| **Erfolgskriterium** | Der Benutzer kann an jeder Stelle des Inhalts (a) sehen, welcher Filter greift und wie viele Treffer es gibt, (b) die Primäraktion der Ansicht auslösen, (c) die Navigation erreichen — ohne zu scrollen. **Im getragenen Fenster gilt das ohne Vorbehalt** (R-3a). |
| **Gegenprobe** | Kein Inhalt wird unerreichbar, **eine** Fläche bekommt nie zwei Bildlaufleisten auf derselben Achse, kein Bedienweg verschwindet still, und in einem niedrigen Fenster bleibt jede Ansicht vollständig bedienbar. Unterhalb der getragenen Größe darf der Rahmen zusätzlich laufen — das ist der Rückfall und keine zweite Leiste an derselben Fläche (R-2, R-3). |
| **Nicht das Ziel** | Mehr Inhalt auf den Bildschirm bringen. Eine Ansicht wird nicht dichter und nicht kürzer. |

---

## 2. Das Modell

Jede Ansicht zerfällt in **einen festen Teil** und **einen oder zwei Laufbereiche**.

```
┌ Inhaltsbereich (.app__main) — läuft nicht mehr ────────────┐
│ ┌ fester Teil ───────────────────────────────────────────┐ │
│ │ Bildschirmkopf: Titel · Untertitel · Aktionen          │ │
│ │ Registerreiter / Filterleiste / Zählzeile / Chips      │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌ Laufbereich ──────────────────────────────────┐ ┌──────┐ │
│ │ Liste, Tabelle, Gruppen, Karten               │ │ (2.) │ │
│ │                                     ↕ läuft   │ │  ↕   │ │
│ └───────────────────────────────────────────────┘ └──────┘ │
└────────────────────────────────────────────────────────────┘
```

Drei Sätze, die das Modell tragen:

1. **Der feste Teil ist die Steuerung, nicht der Inhalt.** Was sagt, *wo man ist* und *welche
   Teilmenge man sieht*, steht. Was *die Teilmenge ist*, läuft.
2. **Der Laufbereich hat immer eine Höhe.** Auch leer, auch beim Laden, auch im Fehlerfall. Er
   schrumpft nicht auf seinen Inhalt zusammen, sonst wanderte der feste Teil bei jeder
   Antwort.
3. **Der feste Teil bekommt nie eine eigene Bildlaufleiste.** Reicht der Platz für ihn nicht,
   greift R-3 — und wo er dafür reichen **muß**, sagt R-3a. Ein vierter Satz, den T-340
   nachträgt, weil er teuer gelernt wurde: **Der feste Teil hat eine Obergrenze.** Er ist nicht
   fest, weil jemand ihn so genannt hat, sondern weil er in das kleinste getragene Fenster paßt
   (AK-23).

---

## 3. Sechs Regeln für alle elf Ansichten — und eine Geltungsgrenze (R-3a)

### R-1 — Die Naht liegt unter dem, was die Auswahl steuert

Im festen Teil steht, in dieser Reihenfolge und nur, soweit die Ansicht sie heute hat:

1. der Bildschirmkopf (`.screen__header` → `.screen__headline`: Titel, Untertitel,
   Nachladehinweis, Aktionen),
2. die Bereichsreiter (`ExportTabs`),
3. die Filterleiste samt Zählzeile und Chipzeile (`.filterbar`, `.filterbar__result`,
   `.filterbar__chips`) — sie sind heute schon Kinder von `ScreenHeader`,
4. eine Leiste, die die **Auswahl im Laufbereich** beantwortet und heute unmittelbar über ihm
   steht (`.bulkbar` in S-06).

Alles Übrige läuft.

**Die Naht darf die Reihenfolge nicht ändern.** Ein Element wird nur dann fest, wenn es heute
ohnehin über allem Laufenden steht. Deshalb bleibt die Zusammenfassungszeile des Exports im
Laufbereich (4.7) — sie festzumachen hieße, sie über die Karte „Vorlage und Rundung" zu heben,
und das wäre eine Designänderung.

### R-2 — Ein Laufbereich je Fläche und Achse; zwei nur nebeneinander

- **Zwei Laufbereiche sind erlaubt, wenn sie nebeneinander stehen und fachlich getrennt sind.**
  Getroffen wird das genau einmal: Zeiterfassung (4.5).
- **Zwei Laufbereiche übereinander sind verboten.** Zwei senkrechte Bildlaufflächen
  untereinander teilen die Höhe und machen beide unbrauchbar.
- **„Übereinander" heißt nebeneinanderliegend in derselben Blickachse, nicht ineinander**
  (berichtigt T-340). Ein Laufbereich **in** einem laufenden Rahmen teilt die Höhe nicht mit
  ihm — er sitzt darin. Genau das ist der Rückfall (R-3): Der Rahmen läuft und trägt den
  festen Teil mit hinaus, der Laufbereich läuft innerhalb seines Bodens weiter. Das ist
  verschachtelt und erlaubt; zwei Geschwister mit eigener senkrechter Laufstrecke bleiben
  verboten.
- Daraus folgt für die bestehende Umbruchregel bei ≤ 68 rem (`app.css`, „Schmalere Fenster
  (A-13.8)"): **Fallen zwei Spalten untereinander, werden ihre Laufbereiche zu einem.** Das
  betrifft nur die Zeiterfassung; `.detail` und `.tags-split` haben ohnehin nur einen.
- **Geschachtelt nur bei getrennten Achsen.** Das Kanban tut das heute: waagerecht außen
  (`.board`), senkrecht innen (`.kcolumn__body`). Die Buchungstabelle löst beide Achsen in
  **einer** Fläche (5.1).
- **Eine Spalte mit fester Zahl von Einträgen steht; eine Spalte, deren Länge an den Daten
  hängt, läuft** — oder liegt im Laufbereich. Deshalb steht die Bereichsschiene der
  Einstellungen (acht Einträge, im Quelltext festgelegt) und läuft die Vorlagenliste mit.

### R-3 — Niedriges Fenster: der Rückfall ist der heutige Zustand

Eine Regel, keine elf Einzelfälle. **Neu gefaßt in T-340** gegen den gebauten Mechanismus
(T-323 7.2); der Grund steht im Kopf dieses Papiers, Nr. 1.

> Maßstab ist die Höhe des **Inhaltsbereichs**, nicht die des Fensters. Reicht sie für den
> festen Teil **und** einen brauchbaren Laufbereich nicht mehr, gibt zuerst der Laufbereich
> nach — bis auf seinen Boden von 4 rem. Danach gibt der feste Teil nach: Der Rahmen läuft und
> trägt ihn mit hinaus. Abgeschnitten wird zu keinem Zeitpunkt, und unerreichbar wird nichts.

Fünf Punkte dazu:

- **Der Rückfall hat keine Schwellenzahl und keine Medienstufe, und das ist die bessere
  Bauform.** `.app__main` behält `overflow-y: auto`, `.screen__body` bekommt `min-block-size:
  4rem` — mehr braucht es nicht. Die erste Fassung verlangte eine gemessene Grenze und gab die
  Zahl an T-323 ab. T-323 hat statt der Zahl den Mechanismus geliefert, und er erfüllt die
  Forderung dieser Regel **genauer** als eine Zahl es könnte: Der Rahmen **ist** der
  Inhaltsbereich. Nimmt eine Hüllenmeldung 144 px, ist er 144 px niedriger und der Rückfall
  greift entsprechend früher — ohne daß irgend jemand eine Zahl nachzieht. Eine
  `@media (max-height: …)`-Abfrage hätte das nicht gekonnt: sie mißt das Fenster.
- **Was im Rückfall gilt und was nicht.** Es gilt: das Dokument läuft nie (AK-01), keine Fläche
  wird unerreichbar, nichts wird abgeschnitten, der Laufbereich behält mindestens 4 rem. Es gilt
  **nicht**: „genau eine Bildlaufleiste ist sichtbar". Der Rahmen läuft, und der Laufbereich
  läuft innerhalb seines Bodens weiter — verschachtelt, nicht übereinander (R-2). Die
  ursprüngliche Zusage war an dieser Stelle zu weit und ist zurückgenommen (AK-02).
- **Die Reihenfolge des Nachgebens ist die Aussage.** Zuerst schrumpft der Inhalt auf eine noch
  brauchbare Höhe, dann erst weicht die Steuerung. Ein fester Teil, der als Erster nachgäbe,
  wäre kein fester Teil; ein Laufbereich, der unter eine Zeile fiele, wäre keine Fläche mehr.
  Die 4 rem sind genau das: eine Tabellenzeile plus ihr Fußabstand (T-323 7.2).
- **Der Rückfall ist kein Freibrief.** Wo er greifen **darf**, sagt R-3a. Im getragenen Fenster
  greift er nicht, und tut er es doch, ist das ein Befund und nicht das Verhalten.
- **Entschieden wird in CSS, nicht in JavaScript.** Ein gemessener Umschalter baute Elemente
  neu auf; dabei geht der Fokus verloren, und zwar mitten in einer Eingabe. Eine
  Zustandsänderung, die nur Gestaltungsregeln umlegt, läßt den Fokus stehen. Der gebaute
  Mechanismus geht darüber hinaus: Er legt nicht einmal Regeln um, er rechnet nur — es gibt
  keinen Umschaltpunkt, an dem etwas springen könnte.

### R-3a — Wo der Rückfall greifen darf: die Entscheidung aus T-340

Die Frage, die T-340 zu entscheiden hatte: **Ist ein Rahmen, der bei 960 × 640 überläuft, der
geordnete Rückfall oder ein kaputtes Layout?** Sie ist meine, weil R-3 meine Regel ist. Die
Antwort in einem Satz:

> **Der Rückfall ist ein Verhalten unterhalb der getragenen Größe, kein Verhalten im normalen
> Betrieb.** Bei 960 × 640 und darüber, ohne Hüllenmeldung und ohne Fassungshinweis, läuft der
> Rahmen auf **keiner** Ansicht. Tut er es doch, ist der feste Teil zu hoch — und das ist ein
> Befund mit einem Ort und einem Zuständigen, nicht der Rückfall.

Von den drei zur Wahl gestellten Möglichkeiten gilt die **zweite**: der feste Teil ist zu hoch.
Die Untergrenze ist nicht falsch — sie steht in `apps/desktop/src-tauri/tauri.conf.json`
(`minWidth: 960`, `minHeight: 640`), ist die tatsächliche Untergrenze des Erzeugnisses und nicht
meine, sie zu verschieben. Und AK-01 nimmt den Rückfall **nicht** aus; dazu gleich.

**Vier Sätze, aus denen die Regel besteht:**

1. **Im getragenen Fenster läuft der Rahmen nicht — senkrecht nicht und waagerecht erst recht
   nicht.** Getragen heißt: Fenster mindestens 960 × 640 **und** Inhaltsbereich ungeschmälert.
   Das ist der Zustand, in dem der Benutzer arbeitet. **Dieser Satz ist seit T-344 der einzige
   Begriff von „getragen" in beiden Papieren** — die weitere Fassung im Schwesterpapier (T-323 7.1,
   „getragen im Browserbetrieb bis 640 × 480") heißt dort jetzt „bedienbar im Browserbetrieb" und
   sichert AK-24 zu, nicht AK-02. Der Unterschied hat wie eine Zahlenfrage ausgesehen und war eine
   Wortfrage: Eine falsche Zahl widerlegt der Bau, ein doppeldeutiges Wort nicht (T-343 B-03).
2. **Nimmt eine Hüllenmeldung oder der Fassungshinweis Höhe, darf der Rückfall auch im
   getragenen Fenster greifen, und das ist richtig so.** Maßstab war immer der Inhaltsbereich,
   nicht das Fenster. Ein Meßsatz, der das nicht trennt, mißt bei stehender Hüllenmeldung einen
   Fehler, wo keiner ist — deshalb wird das Höhenbudget (AK-23) **ohne** die beiden Zeilen
   gemessen.
3. **Unterhalb von 960 × 640 ist der laufende Rahmen das erwartete Verhalten.** Dort wird nicht
   mehr zugesichert, daß der Rahmen nichts zu laufen hat — das stand schon in T-323 7.1
   („nur die zweite Zusage gilt im getragenen Bereich") und ist keine Lockerung nach Rot,
   sondern der Geltungsbereich, den der Meßsatz überdehnt hat. Zugesichert bleibt dort AK-01
   und AK-24.

   **Nachgetragen T-344 — daß es dort eine Grenze ist und keine Nachlässigkeit, ist inzwischen
   gerechnet** (T-341 3.5, gemessen): Unterhalb von 52 rem legt sich die Navigation als **Band über**
   den Kopf. Die Hülle nimmt dann **225 statt 52 px** Fensterhöhe, das Band allein 173 px; bei
   640 × 480 sind das **47 %** der Fensterhöhe, bevor eine Ansicht beginnt. Der Rahmen ist dort
   255 px hoch, das Budget für den festen Teil **175 px** — und der **kleinstmögliche** Kopf einer
   Ansicht mit Erklärsatz und einzeiliger Filterleiste mißt 74,8 + 113,5 px plus Zwischenräume
   ≈ **188 px**. Der Boden liegt also über dem Budget, **unabhängig von jeder Filterleiste**;
   dieselbe Rechnung erklärt die fünf Pixel der Todos bei 831 × 640. Der einzige verbleibende Hebel
   ist die Bandnavigation selbst, und der ist eine Gestaltungsfrage: T-323 offene Frage 6.
4. **Waagerecht gibt es keinen Rückfall, in keiner Größe.** `.app__main` trägt
   `overflow-x: hidden`; eine Überbreite am Rahmen ist deshalb **kein Lauf, sondern ein
   Schnitt** — R-d, der schwerste denkbare Fehler dieses Umbaus. Sie ist bis hinunter zu
   320 × 256 ein Befund.

**Die zehn gemessenen Verstöße (T-330), nach dieser Regel einsortiert.** Damit niemand raten
muß, welcher Fall welcher ist:

| Ansicht | Größe | Gemessen | Einordnung |
|---|---|---|---|
| board | 960 × 640 | 701/588 Höhe **und** 825/720 Breite | **Fehler, beides.** Getragenes Fenster. Ursache benannt: der Bildschirmkopf war dort 536,8 statt 129,8 px hoch, und die Aktionsgruppe ragte um genau 105 px hinaus — 825 − 720 = 105. Behoben in T-334. |
| board | 831 × 640 | 693/415 Höhe | Dieselbe Ursache, unterhalb der Untergrenze. Nach T-334 nachzumessen; bleibt es rot, ist es ein Befund. |
| board | 640 × 480 | 693/255 Höhe, 817/640 Breite | Höhe: **Rückfall**. Breite: **Schnitt**, also Fehler — dieselbe Ursache. |
| todos | 831 × 640 | 420/415 Höhe | **Rückfall**, und zwar ein lehrreicher: fünf Pixel. Der feste Teil paßt dort um fünf Pixel nicht mehr. Genau dafür ist die Regel da. |
| todos, todo, bookings, exportAudit | 640 × 480 | 529/255, 282/255, 476/255, 363/255 | **Rückfall.** Bei 255 px Inhaltshöhe ist kein fester Teil dieser Anwendung unterzubringen. |

**Und die elfte Stelle, die T-334 unabhängig gemessen hat — sie ist die eigentliche.**
`div.settings-layout` ragt bei **1024 × 640** um 86 px über den Rahmen. T-334 hält das für
meinen Rückfall R-3. Nach R-3a ist es ein **Fehler**: 1024 × 640 ist ein getragenes Fenster,
und niemand hat dort eine Meldung stehen.

**Nachgetragen T-344 — hier lag der Widerspruch zwischen den beiden Papieren, und hier ist er
aufgelöst.** T-323 9.6 Punkt 2 hat denselben gemessenen Fall zur **benannten Ausnahme** von A8
gemacht und in 9.2 eigens die Fenstergröße dazugestellt, damit die Ausnahme nicht toter Text bleibt.
Nach diesem Papier ist er ein Fehler, nach jenem richtig — an derselben Zahl. **Entschieden gilt
E-115**, und T-323 ist berichtigt: A8 nimmt den Rahmen nur **unterhalb** von 960 × 640 aus, bei
1024 × 640 bleibt der Fall **rot**, und grün wird er durch die Behebung. Zwei Zusätze, die aus dem
Fall über ihn hinaus folgen: Die Zahl selbst ist nicht stabil — T-341 mißt denselben Zustand als
**62 px** am Rahmen, wo T-334 86 px an `div.settings-layout` gemessen hat; beide stimmen, sie messen
aus verschiedener Höhe. Und **eine Messung trägt eine Zahl, keine Einordnung** — ob 86 px richtig
oder falsch sind, entscheidet die Regel, und die stand am selben Tag im anderen Papier.

Die Ursache ist benannt und liegt nicht im Bereichsinhalt: Die Bereichsschiene ist bei
1280 × 820 gemessene **577 px** hoch (T-329) — acht Einträge mit je zwei Zeilen, Beschriftung
und Zusatz. In den Rahmen eines 640 px hohen Fensters passen nach der Höhenkette rund 535 px
(AK-23). Oberhalb von 60 rem Breite ist der Zusatz sichtbar, unterhalb verschwindet er; der
Fehlbereich ist deshalb das Band **über 960 px Breite bei Fensterhöhen unterhalb von rund
680 px** — gerechnet aus 577 px Schiene plus 29 px Kopf gegen 588 px Rahmen bei 640. Die
getragene Untergrenze 640 liegt mitten darin, und 1024 × 640 ist genau der Fall, den T-334
gemessen hat. Bei 960 selbst tritt er nicht auf, weil dort der Zusatz schon fällt — der
Ausgleich existiert also, er hängt nur an der falschen Achse.

Daraus die Regel, die über den Fall hinausgeht:

> **Ein fester Teil, der bei 960 × 640 nicht paßt, ist nicht fest.** Er muß bei knapper Höhe
> nachgeben, so wie er bei knapper Breite schon nachgibt. Welche seiner Zeilen dabei weicht,
> ist Gestaltung und gehört T-339 (ui-designer); **daß** er weichen muß, ist hier entschieden.

**Beantwortet in T-323 7.5 (T-344):** Es weicht **der Zusatz** je Schieneneintrag — dieselbe Zeile,
die unter 60 rem Breite schon weicht, jetzt auch unter 44 rem Höhe. Nicht die Bandgestalt (sie
verschiebt die Schiene über den Bereich und dreht die Leserichtung) und kein eigener Laufbereich für
die Schiene (ein zusätzlicher Halt und eine zweite Bildlaufleiste für acht im Quelltext festgelegte
Einträge). Die Schwelle ist gerechnet und nicht gerundet; eine Zahl fehlt und ist vor dem Bau zu
messen. Alle drei Wege waren mit diesem Papier verträglich — gewählt ist der, der **keine** neue
Gestalt einführt.

Der Ausgleich existiert für die Breite bereits und ist ausdrücklich begründet: Der Zusatz der
Schiene ist unter 60 rem ausgeblendet, weil er „nirgends die einzige Fassung sein darf"
(`SettingsScreen.tsx`). Für die Höhe fehlt er. Das ist keine neue Gestaltung, sondern eine
vorhandene, an der zweiten Achse nicht angeschlossen — und deshalb auch kein neuer
Oberflächentext und keine Streichung (Abschnitt 10 bleibt unberührt).

**Was das für den e2e-Meßsatz heißt** — die Antwort auf die Frage, ob er angepaßt wird oder ob
etwas zu beheben ist: **beides, und zwar getrennt.** Angepaßt wird der Geltungsbereich von A2
(getragene Größen statt aller fünf); zu beheben ist der feste Teil an zwei Stellen (Kanban-Kopf
— erledigt in T-334; Bereichsschiene — **entschieden in T-323 7.5**, zu bauen). Wer nur das eine
täte, hätte entweder einen Meßsatz, der Richtiges rot meldet, oder einen, der einen echten Fehler
durchläßt. **Nachtrag T-344:** Eine dritte Stelle ist inzwischen gefunden und behoben, ohne daß sie
je rot war — die Spaltenschwelle der Todo-Filterleiste stand auf der runden Zahl 40 rem, und die
getragene Untergrenze liefert 39,88 rem; der feste Teil sprang dort um 70 px auf **89,9 %** seines
Budgets (T-341 3.2/3.3, jetzt 75,9 %). Ein Kopf, der an der Untergrenze 90 % braucht, ist eine
Textzeile davon entfernt, den Rahmen zum Laufen zu bringen — R-h, gemessen statt befürchtet.

### R-4 — Jeder Laufbereich ist mit der Tastatur erreichbar und benannt

Heute ist `.app__main` der Laufbereich, trägt `id="inhalt"`, `tabIndex={-1}` und einen eigenen
Fokusring (`.app__main:focus-visible`). Die Sprungmarke „Zum Inhalt springen" setzt den Fokus
dorthin, und **erst dadurch** ist der Bildlauf mit Bild-ab und den Pfeiltasten bedienbar. Zieht
der Lauf nach innen, ohne daß der innere Bereich fokussierbar ist, wird er zur Mausfläche. Das
ist eine Regression, kein Detail.

Deshalb:

- **Jeder Laufbereich ist fokussierbar und liegt genau einmal in der Tabulatorreihenfolge** —
  unmittelbar vor seinem Inhalt. **Ein Laufbereich ist eine Fläche, die Abschnitt 4 dieses Papiers
  als solche nennt** (ergänzt T-344): Die Menge wird an der Anforderung aufgespannt und nicht am
  Selektor (E-099 Punkt 3). Ein Rahmen, der nicht läuft, gehört nicht dazu; die Laufstrecke eines
  **Bausteins** — eine Kanban-Spalte, eine Tabelle innerhalb des Laufbereichs — auch nicht, für sie
  gilt die schwächere Zusage aus 5.3.
- **Jeder Laufbereich trägt einen zugänglichen Namen, und der Name ist ein bereits
  vorhandener Text.** Entweder die Überschrift der Ansicht (`.screen__title`) oder die
  Überschrift der Karte, in der er liegt (`.card__title`). Kein neuer Oberflächentext
  (Abschnitt 10). **Eine benannte Ausnahme** (ergänzt T-344, deckungsgleich mit T-323 8.5): der
  Lade- und Fehlerzustand der Todo-Detailansicht. Dort ist die Überschrift das Todo und steht noch
  nicht fest; die Fläche ist Ziel der Marke, läuft, trägt aber **keinen** Namen und keine Rolle. Der
  greifbare Text „Todo wird geladen" wäre im **Fehler**zustand derselben Fläche unwahr, und ein
  Name, der in einem von zwei Zuständen stimmt, ist schlechter als keiner.
- **Die Sprungmarke zeigt auf den Kasten, der wirklich läuft** — *berichtigt T-344; hier stand
  „`#inhalt` bleibt auf `.app__main`", und das ist seit T-326 zweifach überholt.* Sie liegt seit
  T-326 am Laufbereich, und sie lag dabei in drei Ansichten am **Rahmen**, der im getragenen Fenster
  nicht läuft — Bild-ab tat danach nichts (T-343 B-07). Die Regel ist jetzt:

  > **Die Marke zeigt auf den *Inhaltshalt*: den innersten Kasten, der den Inhalt der Ansicht trägt
  > und in mindestens einer getragenen Fensterform eine eigene Laufstrecke hat.**

  Je Ansicht: die acht Regelansichten der Laufbereich selbst; **Einstellungen** der Bereich
  (`.settings-panel`), **Zeiterfassung** Laufbereich A, **Kanban** `.board`. Der Rahmen trägt sie
  nie. Fällt die Zeiterfassung unter 68 rem untereinander, läuft A nicht mehr, und Bild-ab rollt von
  A aus den Rahmen — das tut der Browser von selbst, und deshalb braucht die Marke keine zweite
  Kennung und keine Breitenschwelle. Die Bauform steht in T-323 8.5, die Deckung in **A-25.5**.

  **Ergänzt T-354, und es ist die Einlösung desselben Satzes im Meßsatz:** Genau dieser Halbsatz —
  „Bild-ab rollt von A aus den Rahmen" — widersprach der Zusicherung **AK-14 (c)**, die die
  Bildlaufstelle „genau dieses Kastens" verlangte. AK-14 trägt den Fall jetzt selbst, mit einem
  zweiten, abschließend aufgezählten Zweig (T-351 B-20, Vorschrift in T-323 9.7).
- **Existiert der Inhaltshalt in einem Zustand nicht, trägt die Marke der Laufbereich, der den
  Zustand zeigt** *(neu, T-354, T-351 B-08; gleichlautend in T-323 8.5)*. Die Zuordnung oben gilt je
  **Ansicht**, nicht je **Zustand**: `.board` und Laufbereich A liegen innerhalb der Ladehülle und
  gibt es in Z0 (Laden), Z3 (leer) und Z4 (Fehler) nicht. Dort hat die Ansicht ohnehin genau **einen**
  Laufbereich (R-5), also ist er die Marke — so ist es auch gebaut (`ScreenBody` trägt die Marke als
  Vorgabe, `ScreenFrame` nie). Der Satz steht hier, damit der nächste Bau ihn liest statt ihn zu
  wählen. **Er ist eine Bauregel und keine Zusicherung:** Der Meßsatz fährt jede Ansicht erst nach
  dem Laden und sieht Z0, Z3 und Z4 nicht. Der bessere, teurere Weg — den Laufbereich über die
  Zustände hinweg als dasselbe Element halten — bleibt offen und ist nicht gewählt (T-323 8.5).
- **Der Laufbereich braucht einen sichtbaren Fokusring**, so deutlich wie der heutige von
  `.app__main`. Gestaltung: T-323.

### R-5 — Zustände füllen den Laufbereich, nicht das Fenster

- **Bildschirmleerzustand** — der eine Leerzustand, der den ganzen laufenden Inhalt ersetzt:
  „Nichts zu exportieren" (S-07), „Noch kein Todo" / „Kein Todo passt zu diesen Filtern"
  (S-02), „Noch keine Zeitbuchung" (S-06), `BoardEmptyState` (S-04). Er füllt den **Laufbereich**
  und zentriert sich in ihm. Nicht im Fenster: der feste Teil steht darüber und ist sichtbar, eine
  Mitte des Fensters läge unter ihm.
- **Kartenleerzustand** — ein Leerzustand innerhalb einer Karte: „Heute noch nichts erfasst",
  „Noch keine Zeit erfasst", „Kein Treffer" in der Todo-Auswahl, **„Noch kein Tag" (S-08)** und
  **„Noch kein Vorgang protokolliert" (S-07 Protokoll)**. Er bleibt so groß wie heute
  und wird **nicht** gedehnt. Eine Karte, die plötzlich die halbe Höhe einnimmt, weil sie leer
  ist, ist eine Designänderung.

  **Die letzten beiden sind am 2026-09-13 aus der ersten Liste hierher gewandert (T-344, T-343
  B-11).** Sie standen dort als Bildschirmleerzustände, und gebaut ist die Zentrierung über
  `margin-block: auto` an **direkten** Kindern des Laufbereichs. „Noch kein Tag" entsteht in
  `TagAdministration`, also in einer Karte, unter der `PoolAdministration` weiterläuft; beim
  Protokoll laufen Legendenkarte, Kennzahlkacheln und Umfangssatz weiter. `margin-block: auto`
  greift dort nicht — entweder war die Einordnung falsch oder AK-07 unerfüllbar. **Falsch war die
  Einordnung**, und das Kennzeichen ist ab hier nachprüfbar statt gefühlt:

  > **Ein Leerzustand ist ein Bildschirmleerzustand genau dann, wenn er direktes Kind des
  > Laufbereichs ist** — also dann, wenn neben ihm nichts anderes mehr läuft.

  Ihn trotzdem auf Laufbereichshöhe zu dehnen hieße, die zweite Karte nach unten zu schieben: eine
  Änderung der Reihenfolge und damit des Designs (AK-05, A-25.7). Am Bau ändert sich durch die
  Berichtigung nichts; die vier verbliebenen Zeilen decken sich mit den drei gebauten Selektoren.
- **Ladezustand** (`LoadingBlock`) und **Fehlerfläche** (`InlineMessage` mit „Erneut
  versuchen") stehen oben im Laufbereich, wie heute oben im Inhalt.
- **Im Lade- und Fehlerzustand hat eine Ansicht genau einen Laufbereich.** Der Zweispalter der
  Zeiterfassung entsteht erst mit den Daten — er liegt im Quelltext innerhalb der Ladehülle.
  Das ist keine Lücke, sondern die einfachere Wahrheit: ein Skelett braucht keine zwei
  Bildlaufflächen.
- **Der feste Teil bleibt in jedem Zustand stehen und bedienbar.** Das ist ein Gewinn und
  keine Nebenwirkung: Schlägt die Todo-Liste fehl, bleibt die Filterleiste erreichbar, und man
  kann den Filter ändern, statt zuerst zu scrollen.

### R-6 — Eine Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt

**Neu gefaßt in T-340.** Die erste Fassung behandelte Dialoge als Geschwister des Laufbereichs
und hielt sie damit für „unberührt". Das war falsch, und der Beleg ist gemessen: In `glass` und
`liquid-glass` hing die Rückfrage vor dem Öffnen einer Datei (A-19.14) an der **Karte** statt am
Fenster — 644 × 298 an (265, 364) statt 1280 × 820 an (0, 0), der Knopf „Öffnen" außerhalb des
sichtbaren Bereichs, und nach 600 px Bildlauf wanderte die Fläche mit (R-31, behoben in T-334).

Deshalb als Regel, und sie gilt über diese Aufgabe hinaus:

> **Eine Fläche, die eine Handlung bestätigt, hängt am Fenster. Sie hängt nie an dem Kasten, in
> dem die Handlung ausgelöst wurde.** Was der Benutzer bestätigen soll, muß er sehen können,
> ohne vorher zu suchen — und es darf nicht wegrollen, während er liest.

Drei Sätze, die die Regel tragen:

1. **Der Auslöser ist nicht der Ort.** Eine Rückfrage gehört nicht in die Karte, die Zeile oder
   den Laufbereich, aus dem sie kommt, auch wenn sie sich dort „natürlich" anfühlt. Sie
   unterbricht den ganzen Bildschirm, also ist der ganze Bildschirm ihr Rahmen. Das gilt für
   jede Bestätigung, jede Abdunklung, jede Rückmeldung und jede Erinnerung nach Inaktivität —
   `.scrim`, `.toast-layer`, `.idle-reminder`, die aufgeklappten Menüs und Auswahllisten und
   **seit T-361 die Tag-Fläche der Todo-Tabelle**. Bei ihr kommt ein Grund hinzu, den es bei
   den Menüs nicht gab: Ihr Auslöser sitzt in einer Fläche, die **beide** Achsen trägt (5.1) —
   eine Fläche darin wäre nicht bloß falsch verankert, sie wäre **abgeschnitten**. Und der
   Auslöser sitzt in `.todo-row`, die in den Paletten `lines` und `zen` ausdrücklich wie eine
   Karte behandelt wird (`theme-palettes.css`); genau eine Karte hat R-31 ausgelöst.
2. **„Fest positioniert" allein sichert das nicht zu.** `position: fixed` bezieht sich auf das
   Fenster nur so lange, wie **kein** Vorfahr eine Mal-Eigenschaft trägt — `transform`,
   `filter`, `backdrop-filter`, `perspective`, `will-change`, `contain`. Genau eine solche
   Eigenschaft hat den Fall ausgelöst: die Karte trug `backdrop-filter: blur(16px)` und wurde
   damit zum umschließenden Block. Eine Zusage, die eine ganze Vorfahrenkette voraussetzt, ist
   keine Zusage, sondern eine Wette auf die nächste Palette.
3. **Zugesichert wird sie strukturell, nicht durch Verabredung.** Die Fläche entsteht über ein
   Portal am **Dokumentkörper** und liegt damit außerhalb von `.app` — dort kann keine Kette
   mehr dazwischentreten. Dieselbe Bauart tragen die Menüs und Auswahllisten seit T-059, und
   dieselbe Lehre steht hinter E-108: Was strukturell nicht entstehen kann, muß man nicht je
   Gestaltung nachprüfen. Nicht `#root` und nicht `.app` — beide hängen in der Höhenkette.

**Unverändert gilt:** Diese Aufgabe führt keine Handlung ein und nimmt keine weg. Es gibt nichts
neu zu bestätigen und nichts neu rückgängig zu machen; was heute bestätigt wird, wird weiter
bestätigt, und was heute einen Rückweg im Toast hat, behält ihn. Von der Höhenkette ist keine
dieser Flächen betroffen, und ein neuer `overflow` kann sie nicht abschneiden — jetzt, weil sie
außerhalb liegen, und nicht nur, weil sie fest positioniert sind.

---

## 4. Je Ansicht: steht / läuft

Gelesen am Quelltext (`apps/web/src/app/router.ts`, `App.tsx`, `features/**`), nicht im
Browser gemessen.

### 4.0 Der Inhaltsbereich ohne Ansicht

| Fläche | | Grund |
|---|---|---|
| „Ansicht wird geladen …" (`Suspense`-Rückfall) | **läuft** (ein Laufbereich, füllt ihn) | Es gibt noch keinen festen Teil, den man stehenlassen könnte. |
| „Diese Ansicht gibt es nicht" (`UnknownScreen`) | **läuft**, zentriert | Bildschirmleerzustand nach R-5. |
| „Die Ansicht konnte nicht geladen werden" (`ScreenLoadBoundary`) | **läuft**, oben | Fehlerfläche nach R-5. |

### 4.1 Dashboard (`dashboard`, S-01)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Dashboard", „Neues Todo", „Zeiterfassung" | **steht** | Die beiden Aktionen sind der Zweck der Ansicht (§12: „Wichtige Aktionen möglichst direkt vom Dashboard aus"). |
| Karte „Timer" | **läuft** | Der Timer ist über die Kopfleiste der Anwendung (`.app__header-timer`, `TimerBar`) **immer** sichtbar. Eine zweite dauerhafte Timerfläche wäre die Doppelung, die T-065 gerade beseitigt hat. |
| Kennzahlkarten (`.stat-grid`, vier bis fünf Kacheln) | **läuft** | Sie sind der Inhalt des Dashboards, nicht seine Steuerung. Fest wären sie zusammen mit Kopf und Timerkarte über die Hälfte des Inhaltsbereichs im Standardfenster (1280 × 820). |
| Warnmeldungen (Vorschau nicht abrufbar, Tagesgruppen ohne Leistung) | **läuft** | Sie stehen heute zwischen Kacheln und Spalten; sie festzumachen verschöbe die Reihenfolge. |
| Zweispalter „Zuletzt bearbeitet" / „Buchungen von heute" (`.dash-columns`) | **läuft**, gemeinsam | Beide Listen sind gedeckelt (acht Einträge). Zwei eigene Laufbereiche für zweimal acht Zeilen wären Aufwand ohne Gewinn. |

**Ein Laufbereich.** Name: die Überschrift „Dashboard".

### 4.2 Todos (`todos`, S-02)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Todos", Untertitel, „Neues Todo" | **steht** | Primäraktion, jederzeit erreichbar. |
| Filterleiste (`TodoListFilters`): Suche, Status, Regel, Tags, Frist, Ordnung, „Erledigte einblenden" | **steht** | Das Kernziel: Wer 300 Todos durchscrollt, sieht weiter, wonach gefiltert wird. |
| Zählzeile „42 Todos" und „Kein Filter aktiv" bzw. die Chipzeile | **steht** | Sie ist die **Antwort** auf den Filter, nicht auf die Liste — und sie ist eine Live-Region (`role="status"`). Eine Ansage, deren sichtbare Fassung weggescrollt ist, ist eine halbe Ansage. |
| Hinweis „n erledigte Todos sind ausgeblendet" samt „Einblenden" | **steht** *(berichtigt T-361; hier stand „läuft, oben im Laufbereich")* | Er erklärt, warum diese Liste kurz ist, und steht unmittelbar über ihr — R-1 Punkt 4, derselbe Fall wie `.bulkbar` in S-06. **Erzwungen wurde die Berichtigung durch die Tabelle:** Ist `.table-wrap` selbst der Laufbereich (5.1, 5.2), gibt es darin kein Geschwister mehr. Seine Bildschirmstelle ändert sich nicht; er bleibt beim Bildlauf stehen, statt wegzulaufen. Gegenprobe: AK-23 wird bei 960 × 640 **mit** ihm gemessen (T-361 TT-24). |
| Tabelle (`.table-wrap`, **zugleich der Laufbereich**) *(berichtigt T-361; hier stand „Liste (`.todo-list`)")* | **läuft** | Acht Spalten, Kopfzeile klebt. Die Spaltenwahl steht in `docs/design/todo-tabelle-fluss.md` Abschnitt 3, die Bauform in `docs/design/todo-tabelle.md`. |
| „Weitere laden (n übrig)" (`.list-more`) | **läuft**, am Ende — als **Fußzeile innerhalb** der Tabelle *(berichtigt T-361)* | Das Ende der Liste ist der Ort, an dem man weiterlädt. Fest wäre es eine Leiste, die es heute nicht gibt. Daß er dafür in die Tabelle zieht, ist Folge derselben Naht wie oben und ändert weder Wortlaut noch Stelle. |

**Ein Laufbereich.** Name: „Todos" — zeichengleich, auch nach T-361; die Marke `#inhalt` zeigt
auf `.table-wrap`, und dort läuft in Z2 tatsächlich etwas (AK-14).

**Die Tag-Fläche der Tabelle ist kein Laufbereich dieser Ansicht** *(T-361)*. Sie hängt im Portal
am Dokumentkörper, nicht im Inhaltsbereich — dieselbe Bauart und derselbe Grund wie bei den
Zeilenmenüs (Abschnitt 9 Nr. 9) und bei den Bestätigungsflächen (R-6). Ihre innere Laufstrecke ist
die eines **Bausteins** und bekommt nach R-4 keinen Namen und keinen Halt; bedienbar ist sie, weil
die Fläche beim Tastaturweg selbst den Fokus trägt (T-361 6.4).

### 4.3 Todo-Detailansicht (`todo`, S-03)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: Titel des Todos, „Call … · Status …", „Timer starten/stoppen", „Bearbeiten", „Zeit von Hand" | **steht**, sobald die Daten da sind | Drei Aktionen auf **dieses** Todo. Bei langer Buchungshistorie sind sie heute weggescrollt. |
| `TodoDoneSwitch`, Vermerk, Anhänge, Karte „Buchungen" (`.detail__main`) | **läuft** | |
| Nebenspalte: Frist, Erfasste Zeit, Tags, Herkunft (`.detail__side`) | **läuft**, im selben Bereich | Sie ist keine Steuerung, sondern Inhalt desselben Gegenstands. Ein eigener Laufbereich brächte zwei Bildlaufstellen für ein Todo — und bei ≤ 68 rem fallen die Spalten ohnehin untereinander, die Regel kippte am Umbruch. |

**Ein Laufbereich.** Name: der Titel des Todos (`.screen__title`).

**Eine Besonderheit, ausgesprochen:** Diese Ansicht baut ihren Kopf **innerhalb** der Ladehülle
— der Titel ist das Todo. Im Lade- und Fehlerzustand gibt es hier also keinen festen Teil,
sondern nur den einen Laufbereich (R-5, letzter Punkt). Das ist Folge des Aufbaus, nicht ein
Mangel dieses Entwurfs.

### 4.4 Kanban (`board`, S-04) — Bestand

Bereits fensterfest (`viewport-layout.css`). **Unverändert.** Kopf, Werkzeugzeile
(`.board__bar`) und „Mehr Karten je Spalte laden" stehen; `.board` läuft waagerecht, jede
`.kcolumn__body` senkrecht.

**Der Laufbereich dieser Ansicht ist `.board`, und er läuft waagerecht** (benannt in T-344). Er
bekommt Halt, Fokusring und den Namen **„Kanban"** — die Überschrift der Ansicht, kein neuer Text —
und er trägt die Sprungmarke (R-4). Der Rahmen darum trägt sie nicht und ist kein Bereich: Er läuft
in keiner getragenen Form, und ein Halt ohne Laufstrecke ist eine Station, die nichts tut. Nach der
Marke bewegen **Pfeil links/rechts** und `Pos1`/`Ende` das Board; Bild-ab tut dort nichts, weil
senkrecht die **Spalte** läuft und nicht das Board — das ist die Aufteilung der Achsen und keine
Lücke. Die `.kcolumn__body` bleiben ohne Halt und ohne Namen: Sie sind die Laufstrecke eines
**Bausteins**, über den Fokus der Karten erreichbar (5.3), und zwölf Spalten wären zwölf zusätzliche
Halte für eine Zusage, die der Fokus schon einlöst.

Genau **eine** Ergänzung: **R-3 gilt auch hier.** Reicht die Höhe nicht mehr, läuft der Rahmen
wie bei jeder anderen Ansicht. Grund: Der Auftrag verlangt eine Regel für alle Ansichten, und
bei einem Inhaltsbereich von 200 px sind Spalten mit 12 rem Mindesthöhe und einem Rumpf von
wenigen Pixeln keine Bedienung. Der Rückfall ist dort die bessere Bedienung und keine
Regression — er ist eine Rückkehr.

**Nachgetragen in T-340, weil hier gemessen wurde und das Ergebnis der Regel widerspricht:** Das
Board war die einzige Ansicht, deren Rahmen schon bei **960 × 640** lief — der getragenen
Untergrenze. Das war nicht der Rückfall, sondern ein zerfallener Bildschirmkopf (536,8 statt
129,8 px hoch, Aktionsgruppe 105 px über der Kante und damit abgeschnitten). Behoben in T-334.
Einsortierung und Nachmessung: R-3a.

### 4.5 Zeiterfassung (`time`, S-05) — die Ansicht mit zwei Laufbereichen

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf „Zeiterfassung" (kein Untertitel, keine Aktion) | **steht** | |
| Karte „Timer" mit Anzeige, Stoppknopf und Hinweis | **steht** (Kopf der linken Spalte) | A-13.4: prominent. Sie ist die kürzeste Fläche der Ansicht und die, deren Wegscrollen am teuersten ist. |
| Kartenkopf „Todo wählen": Suche, „Erledigte einblenden" | **steht** | Derselbe Satz wie bei den Todos: Filter steht, Ergebnis läuft. |
| Auswahlliste der Todos (`.pick-list`, bis 30 Einträge) samt Hinweis „n erledigte Todos sind ausgeblendet" und Leerzustand | **läuft** — **Laufbereich A** | |
| Karte „Heute" mit den zwei Kacheln und den Warnzeilen | **steht** (Kopf der rechten Spalte) | Zwei Zahlen, fester Umfang. Sie sind die Tagesbilanz; sie gehört nicht in eine Liste, die läuft. |
| Kartenkopf „Buchungen von heute" | **steht** | |
| Buchungsliste des Tages (`.entry-list`, bis 200 Einträge) samt Leerzustand „Heute noch nichts erfasst" | **läuft** — **Laufbereich B** | |

**Zwei Laufbereiche, nebeneinander, fachlich getrennt:** links „woran arbeite ich als
nächstes", rechts „was habe ich heute schon erfaßt". Wer in der Tagesliste nach unten sieht,
soll den Timer und die Todo-Suche nicht verlieren — und umgekehrt. Das ist **dasselbe Muster
wie beim Kanban**: Kartenkopf steht, Kartenrumpf läuft.

Namen: die vorhandenen Kartenüberschriften **„Todo wählen"** und **„Buchungen von heute"**.
Kein neuer Text.

**Bei ≤ 68 rem** fallen die Spalten untereinander (bestehende Regel). Dann gilt R-2: **ein**
Laufbereich über beide, die Kartenrümpfe laufen nicht mehr selbst. Name dann: „Zeiterfassung".

**Die Sprungmarke liegt auf Laufbereich A** (T-344, R-4) — dem ersten Kasten mit eigener
Laufstrecke in Dokumentreihenfolge, nicht auf dem Rahmen. Unterhalb von 68 rem läuft A nicht mehr;
Bild-ab rollt von dort den Rahmen, weil der Browser den nächsten laufenden Vorfahren nimmt.
**Das ist der Fall, den AK-14 (c) seit T-354 selbst trägt** — und es ist der einzige: 68 rem sind
1088 px, also betrifft er 960 × 640, 1024 × 640, 831 × 640 und 640 × 480 der sieben Meßgrößen, und
außerhalb dieser vier Paare ist der zweite Zweig von AK-14 (c) **rot** (T-351 B-20, T-323 9.7).
Gemessen bleibt in jedem Fall dasselbe: **Bild-ab bewegt etwas.** **Der
Rahmen behält Halt, Rolle und Namen**, weil er unterhalb von 68 rem der einzige senkrechte Läufer
der Ansicht ist — und **der Preis steht dabei**: Oberhalb von 68 rem ist das ein Halt ohne
Laufstrecke. Die Alternative wäre ein JavaScript, das `tabIndex` an einer Breitenschwelle umlegt;
das wäre eine zweite Wahrheit über die 68 rem und genau die Bauform, die R-3 ablehnt. Diese Ansicht
ist damit die einzige mit drei Halten — siehe R-i.

Die Leerzustände bleiben Kartenleerzustände (R-5): „Heute noch nichts erfasst" zentriert sich
in seiner **Karte**, nicht im Laufbereich und nicht im Fenster — sonst wäre eine leere rechte
Spalte plötzlich bildschirmhoch.

### 4.6 Buchungen (`bookings`, S-06)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Buchungen", Untertitel, „Zur Export-Ansicht" | **steht** | |
| Filterleiste: Exportstatus, „Nur schon einmal exportierte", Ab/Bis Tag, „Letzte 7 Tage", „Todo einschränken" | **steht** | |
| Zählzeile „318 Buchungen" und Chipzeile | **steht** | |
| Trefferliste der Todo-Einschränkung (`.pick-list--inline`, bis sechs Einträge, nur während der Eingabe) | **steht** | Sie ist Teil der Filtereingabe und steht heute unmittelbar darunter. Sie ist vorübergehend und gedeckelt. |
| Auswahlleiste (`.bulkbar`): „n Buchungen ausgewählt · 3:20 h", „Exportstatus zurücksetzen (n)", „Auswahl aufheben" | **steht** | Sie beantwortet die Auswahl **in** der Tabelle, während man in ihr ankreuzt — und sie ist eine Live-Region. Sie steht heute als letztes Element vor der Tabelle: festmachen ändert die Reihenfolge nicht. |
| Tabelle (`.table-wrap` / `.table`) | **läuft**, senkrecht **und** waagerecht — siehe Abschnitt 5 | |
| Leerzustand in `TableShell` | **läuft**, zentriert (Bildschirmleerzustand) | |

**Ein Laufbereich.** Name: „Buchungen".

### 4.7 Export (`export`, S-07)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Export", Untertitel, **„Export ausführen"** | **steht** | Die teuerste Aktion der Anwendung. Sie ist heute nach dem Scrollen durch dreißig Tagesgruppen nicht mehr zu sehen. |
| Bereichsreiter „Export / Vorlagen / Protokoll" (`ExportTabs`) | **steht** | Sie sind Navigation mit eigenen Adressen und heute schon Kind des Kopfes. |
| Warnung zum Exportordner (`DIRECTORY_PROBLEM`) | **steht**, solange sie da ist | **Sie ist der Grund, warum „Export ausführen" gesperrt ist.** „Eine gesperrte Schaltfläche ohne Grund daneben ist eine Sackgasse" — der Satz steht im Quelltext dieser Ansicht. Knopf und Begründung dürfen nicht auf zwei Bildlaufstellen fallen. Sie ist eine Zeile mit einem Knopf und erscheint nur im Fehlerfall. |
| Ergebnis des letzten Laufs (`RunResult`) | **läuft** | Es ist die Auskunft über etwas Abgeschlossenes und hat einen eigenen Schließweg. |
| Karte „Vorlage und Rundung" samt Base64-Satz, Ordnerbefunden, „Abgerechnet unter" | **läuft** | Vier Angaben, die man vor dem Lauf **einmal** prüft. Fest wären sie ein Drittel des Fensters. |
| Fehlermeldung „Die Gliederung ließ sich nicht abrufen" / „Die Gesamtvorschau ließ sich nicht abrufen" | **läuft** | Siehe unten. |
| Zusammenfassungszeile (`.export-summary`: Buchungen, Exportzeilen, Stunden, Warnungen) | **läuft** | **Hier wurde gegen das Festmachen entschieden.** Sie steht heute **unter** der Karte „Vorlage und Rundung"; sie fest zu machen hieße, sie über diese Karte zu heben — eine Änderung der Reihenfolge und damit des Designs, und das ist in dieser Aufgabe verboten. Sie bleibt, wo sie ist. Offene Frage OF-2. |
| Legende (`<details>`), Gruppenliste (`ExportGroupList`), Liste der letzten Läufe (`ExportRunList`) | **läuft** | |
| Leerzustand „Nichts zu exportieren" | **läuft**, zentriert im Laufbereich | Antwort auf die Frage des Auftrags: **in der Mitte des Laufbereichs**, mit Kopf, Reitern und „Export ausführen" sichtbar darüber. Der Knopf ist in diesem Zustand gesperrt (keine Auswahl) — das ist der bestehende Zustand und richtig: Es gibt nichts zu exportieren. |

**Ein Laufbereich.** Name: „Export".

**Der Widerspruch, der hier gelöst werden mußte:** Die beiden Fehlermeldungen über Gliederung
und Gesamtvorschau erklären ebenfalls, warum „Export ausführen" gesperrt ist — nach derselben
Logik gehörten sie in den festen Teil. Sie bleiben trotzdem im Laufbereich, und zwar weil beide
im Zustand `failed` **die Stelle des Inhalts einnehmen** (Gliederung) beziehungsweise
unmittelbar über der Zusammenfassung stehen (Gesamtvorschau): Bei Bildlaufstelle 0 sind sie
sichtbar, und der gesperrte Knopf trägt zusätzlich seinen `title` mit dem Grund. Nur die
Ordnerwarnung steht **oberhalb** von allem Laufenden und kann deshalb ohne Reihenfolgeänderung
fest werden.

### 4.8 Exportvorlagen (`templates`, S-14)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Exportvorlagen", Untertitel, „Neue Vorlage" | **steht** | |
| Bereichsreiter | **steht** | |
| Vorlagenliste (`TemplateList`, `.tpl-list`) | **läuft** mit, bleibt klebend wie heute | Ihre Länge hängt an den Daten (R-2). Sie ist heute `position: sticky` und bleibt dadurch im Blick; als feste Spalte bräuchte sie einen eigenen Laufbereich samt Namen für eine Liste, die meist drei Einträge hat. |
| Editorspalte: Hinweis zu Feldquellen, Karte „Vorlage", Abgleich, „Diese Vorlage benutzen" | **läuft** | |
| „Vorschau öffnen" und der Vorschaudialog | unberührt | Dialog, R-6. |

**Ein Laufbereich** (`.tpl-layout`). Name: „Exportvorlagen".

**Eine Auflage an T-323:** Die klebende Vorlagenliste muß nach dem Umbau weiter kleben — jetzt
am neuen Laufbereich statt an `.app__main`. Bleibt die Regel unverändert stehen, ohne daß der
neue Bereich der Bezug ist, ist sie wirkungslos und der Bedienweg „Vorlage wechseln, ohne nach
oben zu scrollen" fällt still weg (Abschnitt 9, Nr. 2).

### 4.9 Exportprotokoll (`exportAudit`, S-07 Bereich Protokoll)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Exportprotokoll", Untertitel, „Zur Export-Ansicht" | **steht** | |
| Bereichsreiter | **steht** | |
| Filterleiste: „Vorgang", „Exportlauf", Zählzeile „120 Vorgänge geladen von 3 400", Chipzeile | **steht** | Hier zählt es doppelt: Der Filter wirkt nur über die **geladenen** Zeilen, und die Zählzeile sagt genau das. Beim Protokoll ist der Irrtum „kurze Liste = vollständige Antwort" der teuerste. |
| Karte mit der Legende der drei Vorgänge samt Unveränderlichkeitssatz | **läuft** | Einmal gelesen. |
| Die drei Kennzahlkacheln | **läuft** | Inhalt, nicht Steuerung — und sie tragen den Umfangssatz, der zu ihnen gehört. |
| Umfangshinweis „Die Kacheln zählen über alle geladenen Vorgänge …" | **läuft**, unmittelbar unter den Kacheln | Er erklärt die Kacheln; er muß bei ihnen bleiben. |
| Liste (`ExportAuditList`), „Weitere laden", „Das ist der Anfang des Protokolls" | **läuft** | |

**Ein Laufbereich.** Name: „Exportprotokoll".

### 4.10 Tags (`tags`, S-08 und S-11)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Tags", Untertitel | **steht** | |
| Karte „Tags und Ordner" mit Baum (`.tags-split` links) und Detailspalte (rechts) | **läuft** | |
| Karte mit den Regeln / Pools (`PoolAdministration`) | **läuft**, im selben Bereich | |

**Ein Laufbereich.** Name: „Tags".

**Warum nicht zwei, obwohl der Auftrag danach fragt:** Baum und Regeln stehen **nicht**
nebeneinander, sondern untereinander (`.tags-layout` ist eine Spalte; der Zweispalter
`.tags-split` liegt **innerhalb** der ersten Karte). Zwei Laufbereiche wären hier zwei
übereinanderliegende Bildlaufflächen — genau das, was R-2 ausschließt. Sie nebeneinander zu
stellen wäre ein neues Layout, und das ist in dieser Aufgabe verboten.

**Eine bestehende Grenze, die diese Aufgabe nicht behebt und nicht verschlimmert:** Bei einem
tiefen Baum liegt die Detailspalte mit „Umbenennen / Verschieben / Todos mit diesem Tag /
Löschen" weit über dem gewählten Eintrag. Das ist heute so und bleibt so. Es wäre mit einem
eigenen Laufbereich für den Baum zu lösen — das ist eine Layoutentscheidung und gehört in einen
eigenen Auftrag (OF-3).

### 4.11 Einstellungen (`settings`, S-09, S-10, S-13)

| Fläche | | Grund |
|---|---|---|
| Bildschirmkopf: „Einstellungen" | **steht** | |
| Bereichsschiene (`.settings-rail`, `<nav aria-label="Bereiche der Einstellungen">`, acht Einträge) | **steht** — als feste Spalte neben dem Laufbereich | Feste Zahl von Einträgen, im Quelltext festgelegt (R-2). Sie ist heute `position: sticky` und **soll** immer sichtbar sein; fest ist sie es auch dann, wenn die Regel einmal nicht greift. **Auflage aus T-340:** „Feste Zahl von Einträgen" war an der Zahl gemessen, nicht an der Höhe. Gemessen ist die Schiene 577 px hoch und paßt damit nicht in ein 640 px hohes Fenster (R-3a, AK-23). Sie muß bei knapper Höhe nachgeben — **wie, ist in T-323 7.5 entschieden (T-344): der Zusatz je Eintrag weicht unter 44 rem Höhe, so wie er unter 60 rem Breite schon weicht.** Keine neue Gestalt, keine neue Reihenfolge, kein neuer Halt, kein neuer und kein gestrichener Text. |
| Bereichsinhalt (`.settings-panel`) | **läuft** | „Daten", „Outlook-Add-in" und „Darstellung" sind die längsten Flächen der Anwendung. |

**Ein Laufbereich.** Name: **der Eintrag der Bereichsschiene, aus dem der Benutzer hierher
gekommen ist** — „Darstellung", „Timer", „Export", „Daten", „Standard-Tags", „Status",
„Outlook-Add-in", „Arbeitsplatz". Kein neuer Text; jedes dieser Wörter steht sichtbar in der
Schiene.

**Nachgezogen in T-340, und der Grund ist eine Streichung.** Die erste Fassung nahm den Namen
aus der Karte, die den Bereich trägt, und ließ die zwei Bereiche mit **zwei** Karten
(„Outlook-Add-in": `OutlookSetup` und `AddinSettings`; „Arbeitsplatz": `WorkstationFacts` und
die Sicherheitsmeldungen) auf die Ansichtsüberschrift „Einstellungen" zurückfallen. Umgesetzt
war das als zweite Liste neben `AREA_LIST`. T-334 hat sie gestrichen: Zwei Listen, die dasselbe
bezeichnen, laufen auseinander; eine kann es nicht. Der Name kommt jetzt aus derselben Liste,
die die Schiene beschriftet — und damit heißen die zwei Bereiche „Outlook-Add-in" und
„Arbeitsplatz" statt „Einstellungen".

**Taugen die neuen Namen als zugängliche Namen? Ja — sie sind besser als die alten.** Geprüft
gegen den Bestand, nicht behauptet:

- **Der Name ist der Text, den der Benutzer angeklickt hat.** Er kommt aus der Schiene, die den
  Bereich auch optisch als gewählt zeigt (`aria-current="page"`). Wer mit der Tastatur in den
  Laufbereich springt, hört die Bestätigung seiner eigenen Auswahl. Der alte Name konnte das
  nicht: Er sagte in zwei von acht Bereichen „Einstellungen" und damit nichts über den Ort.
- **Die Doppelung ist weg, die vorher da war.** Der Rahmen heißt „Einstellungen"
  (`ScreenFrame label="Einstellungen"`). Vorher lag darin ein Gebiet, das ebenfalls
  „Einstellungen" hieß — zwei Landmarken desselben Typs mit demselben Namen, ineinander.
  Eine Vorlesehilfe sagt dann zweimal dasselbe an, und der Benutzer kann nicht hören, ob er sich
  bewegt hat. Unterscheidbare Namen gleichartiger Landmarken sind gängige ARIA-Praxis; jetzt
  sind sie es.
- **Die Karten darin tragen keinen konkurrierenden Namen.** `Card` setzt `aria-labelledby` nur,
  wenn eine `id` übergeben wird; in den Einstellungen wird keine übergeben. Die Karte
  „Outlook-Add-in" **im** Gebiet „Outlook-Add-in" ist deshalb kein zweites Gebiet, sondern eine
  Überschrift — keine verschachtelten gleichnamigen Landmarken.
- **Der Name wechselt mit dem Bereich, und das ist kein stiller Zustandswechsel.** Er wechselt
  als Folge einer Navigation, die der Benutzer ausgelöst hat und die sichtbar, im
  Adreßteil (`?bereich=…`) und in der Schiene angezeigt wird.
- **Eine Auflage, und sie ist dieselbe wie in Abschnitt 10:** In derselben Ansicht steht jedes
  dieser Wörter **dreimal** — als Verweis in der Schiene, als Name des Gebiets und als
  Kartenüberschrift. Für die Vorlesehilfe ist das eindeutig, weil die Rollen verschieden sind
  (`link`, `region`, `heading`). Für eine Abfrage ohne Rolle ist es vieldeutig. **Jede Abfrage
  auf diese Namen schränkt die Rolle ein** — `getByRole("region", { name: "Timer" })`, nie
  `getByText("Timer")`. T-334 hat nach E-087 gesucht und keinen Prüffall gefunden, der einen
  dieser Namen als Gebietsnamen festnagelt; die Auflage gilt für den nächsten, der einen
  schreibt.

Der feste Teil ist hier ein Kopf **und** eine Spalte: unter dem Bildschirmkopf liegt eine Reihe
aus fester Schiene und laufendem Bereich. Das ist keine Ausnahme von R-1, sondern R-1 auf zwei
Achsen: Die Schiene steuert die Auswahl, der Bereich ist die Auswahl.

**Die Sprungmarke liegt auf dem Bereich, nicht auf dem Rahmen** (T-344, R-4). Der Rahmen gibt Halt,
Rolle und Namen ab: Er läuft in keiner getragenen Form, und zwischen ihm und dem Bereich lagen die
**acht** Verweise der Bereichsschiene — neun Tabulatorschritte bis zu dem Kasten, den die Marke
erreichen sollte, und Bild-ab tat unterwegs nichts (T-343 B-07). Danach sind es **null**. Daß die
Marke dabei an der Schiene vorbeiführt, ist kein Verlust, sondern ihr Zweck: Die Schiene ist eine
`<nav>`, und eine Sprungmarke überspringt Navigation. Wer sie braucht, erreicht sie mit
`Umschalt`+`Tab` — und der Fokus holt jeden Eintrag ins Bild.

---

## 5. Die Tabellenflächen, beide Richtungen

**Geltungsbereich, erweitert in T-361.** Dieser Abschnitt ist an der Buchungstabelle geschrieben
(S-06, `BookingTable`) und galt zunächst nur für sie. Er gilt für **drei** Tabellenflächen:

| Fläche | Ist sie selbst der Laufbereich? |
|---|---|
| `BookingTable` in S-06 | **ja** — `className="screen__body"`, `runAreaSurface("Buchungen")` |
| `ExportGroups` in S-07 | die äußere ja, die geschachtelte nicht (`nested`) — die innere ist die Laufstrecke eines **Bausteins** (AK-15) |
| Die Todo-Tabelle in S-02 *(neu, T-361)* | **ja** — und daraus folgen die Berichtigungen an 4.2 |

5.1, 5.2 und 5.4 gelten für alle drei unverändert. **5.3 gilt mit einer benannten Ausnahme**, und
sie steht dort.

### 5.1 Eine Fläche, zwei Achsen

Die Tabelle ist breiter als das Fenster (Spalten: Auswahl, Status, Call, Zeitraum, Herkunft,
Dauer, Leistung, Aktionen). Sie ist heute **schon** in einer eigenen waagerechten Lauffläche
(`.table-wrap`), und die Seite wird durch sie **nicht** breiter. Das bleibt so.

**Entschieden: Die Tabellenfläche (`.table-wrap`) trägt beide Achsen.** Nicht: senkrecht außen,
waagerecht innen. Grund: Ein Tabellenkopf, der senkrecht klebt, aber sich waagerecht nicht mit
dem Rumpf bewegt, ist über den falschen Spalten. Nur wenn beide Achsen in **derselben** Fläche
laufen, steht der Kopf immer über seiner Spalte.

### 5.2 Der Tabellenkopf bleibt stehen — und das ist die Einlösung einer schon geschriebenen Zusage

`.table thead th` trägt heute `position: sticky; top: 0`. Am Quelltext gelesen greift diese
Zusage heute nicht: Die klebende Zelle bezieht sich auf die nächste Lauffläche, und das ist
`.table-wrap` — eine Fläche ohne Höhenbindung läuft senkrecht nie, also klebt nichts. Der Kopf
scrollt heute mit der Seite weg.

Mit der Höhenbindung greift sie zum ersten Mal. **Das ist kein neues Design, sondern die
Einlösung einer Zusage, die seit ihrer Niederschrift im Bestand steht.** Sie gehört in den
Bericht von T-323 mit einer Messung im Browser — hier ist sie gelesen, nicht gemessen.

### 5.3 Auswahlkästchen links, Kontextmenü rechts

**Entschieden: keine waagerecht klebende Spalte.** Weder das Auswahlkästchen links noch das
Menü rechts wird angeheftet.

Drei Gründe:

1. **Es wäre neues Aussehen.** Eine klebende Spalte braucht eine deckende Fläche und eine
   Kante, sonst läuft Text unter ihr durch. Fläche und Kante sind Gestaltung, die es heute nicht
   gibt — und diese Aufgabe fügt keine hinzu.
2. **Das Menü braucht die Spalte nicht.** Jede Zeile öffnet ihr Menü zusätzlich über die rechte
   Maustaste und über `Kontextmenü` beziehungsweise `Umschalt`+`F10` — an **jeder** Stelle der
   Zeile, nicht nur am rechten Rand (`onContextMenu` und `onKeyDown` auf `<tr>`). Der Weg ist
   also auch dann offen, wenn die Spalte außerhalb des Sichtfelds liegt, und die Tastatur
   erreicht ihn ohne Waagerechtlauf.

   **Benannte Ausnahme, T-361: Für die Todo-Tabelle trägt dieser Punkt nicht.** `TodoRow.tsx`
   legt kein `onContextMenu` und kein `onKeyDown` auf die Zeile, anders als
   `BookingTable.tsx:237-249`, und T-361 fügt es nicht hinzu (das wäre neue Funktion). Dort trägt
   **Punkt 3 allein** — und er trägt, weil in der Todo-Zeile sowohl das Kontrollkästchen der
   ersten Spalte als auch der Menü-Auslöser der letzten fokussierbar sind: Der Tabulator holt
   beide Spalten ins Bild. Zusätzlich verlangt T-361 (TT-04), daß die Todo-Tabelle bei 960 px
   Fensterbreite **gar nicht** waagerecht läuft; der Fall tritt dort also erst unterhalb der
   getragenen Untergrenze ein. Wer einer künftigen Tabelle die klebende Spalte erneut versagt,
   prüft vorher, **welcher** der drei Gründe in ihr überhaupt gilt — das ist die Lehre und nicht
   die Ausnahme.
3. **Keine Sackgasse.** Das Auswahlkästchen hat keinen zweiten Weg; es ist nach einem
   Waagerechtlauf aber nicht **weg**, sondern eine Bildlaufstelle entfernt, und der Fokus zieht
   es von selbst ins Bild: Wer mit dem Tabulator zum Kästchen wandert, holt die Spalte zurück
   (R-4). Kein Inhalt wird unerreichbar.

**Auflage:** Der waagerechte Lauf muß mit der Tastatur bedienbar bleiben. Er ist es über R-4
(die Fläche ist fokussierbar, Pfeil links/rechts laufen) **und** über den Fokus der Zellen. Was
nicht passieren darf: eine Achse auf `hidden` setzen, in der Inhalt liegt.

### 5.4 Zustände der Tabellenfläche

| | Senkrecht | Waagerecht | Kopf |
|---|---|---|---|
| **W0** paßt in beide Richtungen | kein Lauf | kein Lauf | steht ohnehin |
| **W1** mehr Zeilen als Platz | läuft | kein Lauf | klebt oben |
| **W2** breiter als der Platz | kein Lauf | läuft | wandert waagerecht mit |
| **W3** beides | läuft | läuft | klebt oben und wandert waagerecht mit |
| **W4** keine Zeile | kein Lauf; `TableShell` mit Leerzustand, zentriert im Laufbereich | kein Lauf | keiner — es gibt keine Tabelle |

Der Platz für die Bildlaufleisten ist in W0 und W1 **schon reserviert**, sonst springt die
Spaltenbreite, sobald die erste Zeile dazukommt. Wie: T-323.

---

## 6. Zustandsmaschine des Inhaltsbereichs

Eine Maschine, gültig für alle elf Ansichten. `A` = fester Teil, `L` = Laufbereich.

| Zustand | Was gilt | Übergang |
|---|---|---|
| **Z0 Aufbau** | Ein `L` über die ganze Fläche, Skelett (`LoadingBlock`) oben. `A` steht und ist bedienbar (Ausnahme: Todo-Detail, 4.3). | Antwort → Z1/Z2/Z3; Absage → Z4 |
| **Z1 Gefüllt, kurz** | `L` läuft nicht. Keine Bildlaufleiste, Platz dafür reserviert. Nichts springt. | Inhalt wächst → Z2; Filter → Z0/Z3 |
| **Z2 Gefüllt, lang** | `L` läuft. `A` steht. Bildlaufstelle bleibt beim Nachladen erhalten. | Inhalt schrumpft → Z1 |
| **Z3 Leer** | `L` trägt den Bildschirmleerzustand, zentriert **in `L`**, mit seinem Ausweg (Knopf). `A` steht — der Filter, der die Leere verursacht hat, ist erreichbar. | Filter zurücksetzen → Z0 |
| **Z4 Fehler** | `L` trägt die Fehlerfläche mit „Erneut versuchen". `A` steht und bleibt bedienbar. Keine Sackgasse. | „Erneut versuchen" → Z0 |
| **Z5 Nachladen** | Wie Z1/Z2, zusätzlich `RefreshHint` im festen Kopf („Wird aktualisiert …"). Bildlaufstelle und Fokus bleiben. | Antwort → Z1/Z2/Z3; Absage → Z4 |
| **Z6 Rückfall** | R-3, **berichtigt in T-340**: `.app__main` läuft und trägt `A` mit hinaus. `L` bleibt und läuft **innerhalb seines Bodens von 4 rem** weiter — verschachtelt, nicht übereinander (R-2). Alle übrigen Zusagen gelten weiter: nichts unerreichbar, nichts abgeschnitten, Dialoge am Fenster. **Nicht** zugesichert: genau eine sichtbare Bildlaufleiste. Wo dieser Zustand auftreten darf, sagt R-3a. | Fenster wächst → zurück in Z1/Z2 |
| **Z7 Größenänderung** | Übergang zwischen Z1 und Z2 und in Z6 hinein und heraus. **Der Fokus bleibt** (R-3: CSS, kein Neuaufbau). Es gibt keinen Umschaltpunkt — der Übergang ist stetig, weil er nur eine Höhenrechnung ist. Die Bildlaufstelle darf dabei springen. | — |

**Kein stiller Zustandswechsel.** Jeder Übergang hat ein sichtbares Zeichen: Z0 das Skelett,
Z3 den Leerzustand mit Ausweg, Z4 die Meldung mit Wiederholung, Z5 „Wird aktualisiert …",
Z6 die zurückkehrende Bildlaufleiste am Rahmen. Z1↔Z2 ist das Erscheinen der Bildlaufleiste — und weil ihr
Platz reserviert bleibt, verschiebt sich dabei nichts.

---

## 7. Tastatur und Fokus im Einzelnen

| Frage | Antwort |
|---|---|
| Wer bekommt den Fokus über „Zum Inhalt springen"? | **Berichtigt T-344:** der **Inhaltshalt** der Ansicht — der innerste Kasten, der ihren Inhalt trägt und selbst läuft (R-4, T-323 8.5, A-25.5). Hier stand „Unverändert `.app__main` (`#inhalt`)"; das ist seit T-326 überholt, und die Nachfolgefassung zeigte in drei Ansichten auf einen Rahmen, der nicht läuft. **Ergänzt T-354:** Gibt es ihn im gerade gezeigten Zustand nicht (Z0, Z3, Z4 in Kanban und Zeiterfassung), bekommt ihn der Laufbereich, der den Zustand zeigt — dort der einzige (R-4, R-5). |
| Wie erreicht die Tastatur den Laufbereich? | Er liegt genau einmal in der Tabulatorreihenfolge, unmittelbar vor seinem Inhalt. Danach laufen Bild-ab/Bild-auf, `Pos1`/`Ende` und die Pfeiltasten in ihm. Im Kanban ist es die **waagerechte** Achse: Pfeil links/rechts bewegen `.board`. |
| Und wenn der Kasten unter der Marke in **dieser** Fenstergröße nicht läuft? | Dann rollt die Taste den nächsten laufenden Vorfahren — das tut der Browser von selbst. Der Fall tritt an genau einer Stelle auf: Zeiterfassung unterhalb von 68 rem, Vorfahr ist der `--split`-Rahmen (4.5). **Er ist zugesichert und nicht bloß hingenommen:** AK-14 (c) mißt beide Zweige und verlangt in beiden Bewegung; an jeder anderen Stelle ist der zweite Zweig ein Fehler *(neu, T-354)*. |
| Welcher zugängliche Name? | Ein **vorhandener** Text: Überschrift der Ansicht oder Überschrift der Karte, in der er liegt. Liste in Abschnitt 4. Die eine Fläche ohne vorhandenen Namen — Lade- und Fehlerzustand der Todo-Detailansicht — trägt keinen (R-4). |
| Reihenfolge der Tabulatorschritte | Sprungmarke → **Inhaltshalt** (kein Schritt dazwischen) → Inhalt. Ohne Sprungmarke: (Hüllenmeldung, Fassungshinweis) → Seitenleiste → Suche → Timer → Bildschirmkopf → Filterleiste → **Laufbereich** → Inhalt des Laufbereichs. Bei zwei Laufbereichen (4.5): A mit Inhalt, dann B mit Inhalt — Dokumentreihenfolge, links vor rechts; der `--split`-Rahmen liegt davor. In den Einstellungen liegt die Bereichsschiene zwischen Bildschirmkopf und Bereich — die Marke führt daran vorbei, der Tabulator nicht. |
| Ein Eintrag außerhalb des Sichtfelds bekommt den Fokus | Der Laufbereich zieht nach; das tut der Browser von selbst. **Bedingung:** In keiner Achse, in der Inhalt liegen kann, darf der Lauf abgeschaltet sein — sonst ist der fokussierte Eintrag fokussiert und unsichtbar. Das ist die schwerste Falle dieses Umbaus. |
| Zeilenmenü in einer langen Liste | Das Menü liegt im Portal am Dokumentkörper (T-059) und wird von keinem neuen `overflow` beschnitten. Beim Schließen kehrt der Fokus auf den Auslöser zurück; der Laufbereich holt ihn ins Bild, wenn nötig. |
| Globale Suche (`Strg`+`K`, `/`) | Sie liegt in der Kopfleiste der Anwendung, außerhalb des Inhaltsbereichs — unberührt. `Eingabe` wechselt die Ansicht; die neue Ansicht beginnt oben. |
| „In der Todo-Liste zeigen" vom Dashboard | Wechselt auf `#/todos?frist=overdue`. Neue Ansicht, neuer Laufbereich, Bildlaufstelle 0, Filterchip „Frist: Überfällig" sichtbar im **festen** Teil. Das ist der Gewinn: Wer springt, sieht sofort, **warum** die Liste kurz ist, ohne zu scrollen. |
| Sprung innerhalb derselben Ansicht | Gibt es nicht; `#inhalt` ist die einzige Marke im Dokument — und sie liegt genau **einmal**, am Inhaltshalt. |
| Fenstergrößenänderung während einer Eingabe | Der Fokus bleibt (R-3: CSS statt JavaScript). |
| Eine Bestätigung öffnet sich *(nachgetragen T-340)* | Die Fläche liegt außerhalb von `.app` (R-6). Der Fokus geht **in** den Dialog, der Tabulator bleibt darin, `Escape` schließt, und der Fokus kehrt auf den auslösenden Knopf zurück — auch wenn dieser inzwischen außerhalb des Sichtfelds liegt: Der Laufbereich holt ihn zurück ins Bild. Daß der Dialog nicht mehr im Inhaltsbereich hängt, ändert daran nichts; gemessen in klassisch und in `glass` (T-334). |

---

## 8. Leer, Laden, Fehler, Erfolg, Nachladen — die Antworten des Auftrags

- **„Nichts zu exportieren" — in der Mitte wovon?** Des **Laufbereichs**. Kopf, Reiter und
  „Export ausführen" stehen sichtbar darüber; eine Mitte des Fensters läge teilweise hinter
  ihnen und wäre nicht die Mitte der Fläche, die leer ist.
- **„Heute noch nichts erfasst" in der rechten Spalte der Zeiterfassung?** In der Mitte
  **seiner Karte**, so groß wie heute. Es ist ein Kartenleerzustand (R-5) und wird nicht auf
  Bildschirmhöhe gedehnt.
- **Ladezustand.** Skelett oben im Laufbereich, fester Teil steht. Der `RefreshHint` im Kopf
  („Wird aktualisiert …") ist ausdrücklich **keine** Live-Region und bleibt sichtbar, wo er
  heute steht.
- **Fehlerfläche.** Oben im Laufbereich, immer mit „Erneut versuchen". Der feste Teil bleibt
  bedienbar — ein Filterwechsel ist der zweite Ausweg neben der Wiederholung.
- **Erfolg.** Rückmeldungen (`toast-layer`) und Bestätigungen (`.scrim`) hängen am Fenster —
  seit T-334 über ein Portal am Dokumentkörper und nicht mehr nur über `position: fixed`
  (R-6). Das Ergebnis eines Exportlaufs (`RunResult`) bleibt im Laufbereich, wo es heute steht,
  mit seinem Schließweg.
- **Bestätigung.** Sie deckt immer das ganze Fenster ab, nie nur die Karte oder die Zeile, aus
  der sie kommt. Die Rückfrage vor dem Öffnen einer Datei (A-19.14) nennt den vollen Pfad und
  hat zwei Knöpfe; beide müssen ohne Bildlauf sichtbar sein. Das war in zwei Paletten nicht so
  und ist behoben (R-6, AK-25).
- **Live-Regionen.** Die sichtbaren Zähl- und Auswahlzeilen (`.filterbar__result`, `.bulkbar`)
  werden **fest** und sind damit immer sichtbar, wenn sie ansagen. Die Zusammenfassungszeile des
  Exports (`.export-summary`) bleibt im Laufbereich (4.7) und kann wie heute ansagen, während
  sie außerhalb des Sichtfelds liegt. Das ist der Bestand, nicht eine neue Schwäche — und
  OF-2 nennt den Weg, ihn zu beheben.

---

## 9. Was sich nicht ändern darf — zwölf Stellen, die heute vom Seitenlauf leben

Ein Weg, der still verschwindet, ist der teurere Fehler. Diese Liste ist gelesen, nicht
gemessen, und geht als Auflage an T-323 und frontend-dev.

| Nr. | Stelle | Was heute daran hängt | Auflage |
|---|---|---|---|
| 1 | `.settings-rail` klebt (`position: sticky; top: 0`) | Die Bereichsschiene bleibt beim Scrollen langer Bereiche im Blick | Sie wird **fest** (4.11). Die klebende Regel wird dadurch wirkungslos — sie darf nicht als tote Zusage stehenbleiben. |
| 2 | `.tpl-list` klebt (`top: var(--space-4)`) | Vorlage wechseln, ohne nach oben zu scrollen | Bezug der Klebung ist künftig der neue Laufbereich. Bleibt sie unverändert ohne neuen Bezug, fällt der Bedienweg still weg. |
| 3 | `.table thead th` klebt | Gelesen: greift heute nicht (5.2) | Greift künftig. Im Browser messen, nicht behaupten. |
| 4 | Sprungmarke `#inhalt` setzt den Fokus auf `.app__main` und macht **damit** den Bildlauf tastaturbedienbar | Der einzige Tastaturweg zum Bildlauf heute | **Berichtigt T-344:** Die Auflage „bleibt" war falsch und ist es zweimal geworden — die Marke ist mit dem Lauf gewandert (richtig, T-323 8.5) und dabei auf einem Kasten gelandet, der nicht läuft (falsch, T-343 B-07). Sie zeigt jetzt auf den **Inhaltshalt** (R-4). Der Tastaturweg bleibt damit erhalten. **Berichtigt T-354:** Hier stand „und **gemessen wird er**: AK-14 (c) und die Zusicherung A9 des Meßsatzes" — im Präsens, und A9 gab es im Baum nicht (T-351 B-19 c). Er wird gemessen, **sobald A9 gebaut ist**; der Auftrag läuft (T-352), die Vorschrift steht in T-323 9.7. Bis dahin ist der Weg gebaut und belegt (T-348: 0 → 392 px, 0 → 36 px), aber nicht gegen Rückfall gesichert. |
| 5 | `.app__main:focus-visible` mit eigenem Ringabstand | Sichtbarkeit des Fokus auf der Laufffläche | Jeder neue Laufbereich braucht einen gleichwertigen sichtbaren Ring. |
| 6 | `scrollbar-gutter: stable` auf `.app__main` | Die Behebung von Ursache 2 aus T-057: gemessen 1190 px gegen 1200 px, bevor die Rinne reserviert war | Die Rinne zieht mit dem Lauf nach innen. Wird sie vergessen, kehrt der Breitensprung zurück — diesmal je Ansicht. |
| 7 | `position: relative` auf `.app__main` | Absolut positionierte Nachfahren — darunter **jedes** `.visually-hidden` — bekommen einen umschließenden Block **innerhalb** der Hülle. Ohne das entstand der Dokumentbildlauf (gemessen: `scrollHeight` 2876 bei Fensterhöhe 820) | **Jeder** neue Laufbereich, in dem ein `.visually-hidden` liegen kann, muß ebenfalls umschließender Block sein. Das ist die teuerste Falle dieses Umbaus. |
| 8 | `overscroll-behavior: contain` auf `.app__main` | Ein Lauf am Ende schlägt nicht auf das Fenster durch | Gilt für jeden neuen Laufbereich. |
| 9 | Menüs und Auswahllisten im Portal (T-059) | Sie werden von `overflow: hidden` nicht abgeschnitten | Unberührt — und der Grund, warum die Zeilenmenüs in Tabelle und Liste den Umbau überleben. Nicht in den Laufbereich zurückholen. **Nachtrag T-340:** Die Abdunklung (`.scrim`) gehört seit T-334 in dieselbe Bauart. Sie lebte **nicht** vom Seitenlauf, sondern von einer Annahme über die Vorfahrenkette, und die trug in zwei Paletten nicht (R-6). |
| 10 | `.shellnotes` mit eigenem Lauf und 45-dvh-Deckel; `.updatebar` in eigener Rasterzeile | Sie nehmen dem Inhaltsbereich Höhe, zur Laufzeit | Der Maßstab von R-3 ist der Inhaltsbereich, nicht das Fenster. |
| 11 | Umbruch bei ≤ 68 rem (`.detail`, `.time-layout`, `.tags-split` auf eine Spalte) und bei ≤ 52 rem (Seitenleiste als Band) | Bedienbarkeit im schmalen Fenster | Bleibt. Bei ≤ 68 rem wird aus zwei Laufbereichen einer (R-2). |
| 12 | Kanban und Formulardialoge (`viewport-layout.css`) | Bereits fensterfest | Unberührt, außer R-3 (4.4). Nicht neu erfinden — das Muster wird übernommen, nicht ersetzt. |

---

## 10. Neue Oberflächentexte: keiner

**Kein neuer sichtbarer Text und kein neuer zugänglicher Name.** Die Namen der Laufbereiche
kommen ausnahmslos aus vorhandenen Überschriften (Abschnitt 4, R-4). **Kein bestehender Text
wird gestrichen** und keine Formulierung geändert; E-087 wird von dieser Aufgabe nicht
berührt.

**Eine Auflage, die dennoch aus E-087 folgt** und die an unit-tester und e2e-tester geht: Wer
einen zugänglichen Namen **hinzufügt**, sucht ihn ebenso, wie wer einen streicht. Ein Gebiet
namens „Todos" neben der Überschrift „Todos" und der Liste mit `aria-label="Todos"` macht eine
Abfrage, die die Rolle nicht einschränkt, **vieldeutig** — in Playwright ein Fehlschlag im
strikten Modus, und zwar in einem Prüffall, den niemand angefaßt hat. Vor dem Bauen ist der
Wortlaut jeder gewählten Überschrift in `tests/**` und `apps/*/test/**` zu suchen, über
`git grep` **und** über einen Lauf durch `apps/*/src`, `packages/*/src`, `tests/` mit
ausgeschlossenen Bauergebnissen.

---

## 11. Akzeptanzkriterien für frontend-dev

Gemessen wird im Standardfenster 1280 × 820 (`tauri.conf.json`), an der getragenen Untergrenze
960 × 640, zusätzlich bei 1024 × 640 und 1440 × 900 — und im Rückfallgebiet unterhalb der
getragenen Untergrenze (831 × 640, 640 × 480). **Welche Zusage wo gilt, sagt R-3a**; das ist der
Unterschied zwischen einem Meßsatz und einer Meinung.

**Struktur**

- **AK-01** `.app` scrollt nicht, und das Dokument scrollt nicht. `document.scrollingElement.scrollHeight` ist gleich der Fensterhöhe — auf **jeder** der elf Ansichten, in jedem Zustand Z0 bis Z6, in **jeder** Fenstergröße bis hinunter zu 320 × 256. **AK-01 nimmt den Rückfall ausdrücklich nicht aus** und braucht es nicht: In allen 55 gemessenen Paaren (T-330) war AK-01 grün. Rot war die Zusage über den **Rahmen**, und die ist AK-02.
- **AK-02** *(neu gefaßt in T-340; die alte Fassung „… im Zustand Z6 null" ist zurückgenommen)* **Im getragenen Fenster** — mindestens 960 × 640, ohne Hüllenmeldung und ohne Fassungshinweis — läuft `.app__main` senkrecht **nicht**, und die Zahl der senkrecht laufenden Flächen darin ist genau die aus Abschnitt 4: eins, bei Zeiterfassung im breiten Fenster zwei. **Im Rückfall** (Z6, R-3a) läuft der Rahmen, und der Laufbereich darf innerhalb seines Bodens von 4 rem weiterlaufen — verschachtelt, nicht übereinander. Nicht zugesichert ist dort „genau eine Bildlaufleiste sichtbar"; zugesichert bleiben AK-01 und AK-24.
- **AK-02a** *(neu, T-340)* **Waagerecht gilt ohne Untergrenze.** `.app__main.scrollWidth` ist gleich `clientWidth` — auf jeder Ansicht, in jeder Fenstergröße bis 320 × 256. Der Rahmen trägt `overflow-x: hidden`; eine Überbreite ist dort kein Lauf, sondern ein **Schnitt** (R-d). Die gemessenen 825/720 bei 960 × 640 und 817/640 bei 640 × 480 waren Fehler und nicht der Rückfall.
- **AK-03** Keine zwei senkrecht laufenden Flächen liegen übereinander — in keiner Fensterbreite, insbesondere nicht bei ≤ 68 rem.
- **AK-04** Der feste Teil jeder Ansicht hat **keine** eigene Bildlaufleiste, in keinem Fenster.
- **AK-05** Die Reihenfolge der Flächen auf dem Bildschirm ist zeichengleich die von heute. Kein Element wandert über ein anderes.

**Inhalt und Zustände**

- **AK-06** Auf jeder Ansicht ist bei größtmöglicher Bildlaufstelle des Laufbereichs weiterhin sichtbar: Titel, Primäraktion (soweit vorhanden), Filterleiste mit Zählzeile (soweit vorhanden), Bereichsreiter (soweit vorhanden).
- **AK-07** Die Bildschirmleerzustände aus R-5 sind in der Mitte des Laufbereichs; die Kartenleerzustände sind so hoch wie vor dem Umbau (± 2 px).
- **AK-08** In Z0, Z3 und Z4 bleibt der feste Teil sichtbar und bedienbar: Ein Filter läßt sich ändern, während das Skelett oder die Fehlerfläche steht.
- **AK-09** Nach einem Nachladen (Z5) steht die Bildlaufstelle des Laufbereichs, wo sie vorher stand.
- **AK-10** *(Geltungsbereich ergänzt, T-344)* Die Breite des Inhalts ändert sich **nicht**, wenn eine Bildlaufleiste erscheint oder verschwindet — je Ansicht eine einzige gemessene Breite, kurz und lang. **Gemessen wird ohne den Rückfall.** Beginnt der Rahmen zu laufen, weil eine Hüllenmeldung oder der Fassungshinweis Höhe nimmt, springt die Inhaltsbreite um die Rinnenbreite: `.app__main` reserviert keine Rinne mehr, seit der Lauf nach innen gezogen ist. Das ist **entschieden und benannt** (T-323 5.2), nicht übersehen — die Gegenrechnung wären 10 px weniger Inhaltsbreite in jedem Fenster und für immer, gegen einen Sprung in dem einen Fall, in dem eine Meldung steht. Der häufige Sprung — kurze gegen lange Liste — bleibt verhindert.

**Buchungstabelle**

- **AK-11** Der Tabellenkopf bleibt beim senkrechten Lauf stehen und wandert beim waagerechten Lauf mit den Spalten.
- **AK-12** Die Seite wird durch die Tabelle nicht breiter: `.app__main` läuft waagerecht nicht, die Tabellenfläche tut es.
- **AK-13** Bei waagerechtem Lauf bis zum rechten Anschlag sind die Zeilenmenüs weiterhin über rechte Maustaste und über `Umschalt`+`F10` erreichbar; der Tabulator holt das Auswahlkästchen zurück ins Bild.

**Tastatur und Vorlesehilfe**

- **AK-14** *(neu gefaßt, T-344; (a) und (c) berichtigt T-354. Die alte Fassung „danach ist jeder Laufbereich mit genau einem weiteren Tabulatorschritt erreichbar" ist **zurückgenommen**, und ebenso „die Bildlaufstelle **genau dieses Kastens**" ohne Einschränkung)* „Zum Inhalt springen" setzt den Fokus auf den **Inhaltshalt** der Ansicht (R-4, Abschnitt 4). Drei Teile, alle gemessen: **(a)** der Kasten mit `id="inhalt"` hat mit dem Prüfvorrat in mindestens einer Achse eine **eigene** Laufstrecke — gemessen **über die getragenen Größen hinweg** und nicht in jeder einzelnen; eine Laufstrecke, die nur in einem als Fehler benannten Zustand entsteht, zählt nicht; **(b)** zwischen der Sprungmarke und ihm liegt **kein** weiterer Tabulatorhalt — **null** Schritte; **(c)** von dort bewegt `Bild ab` (im Kanban `Pfeil rechts`) die Bildlaufstelle **dieses Kastens** — und dort, wo er in dieser Fenstergröße keine eigene Laufstrecke hat, die seines **nächsten laufenden Vorfahren**. **Null Bewegung in beiden Zweigen ist rot.** Der zweite Zweig ist **abschließend aufgezählt**: die **Zeiterfassung unterhalb von 68 rem** (4.5, dort läuft der `--split`-Rahmen) und sonst nichts; nimmt ihn ein anderes Paar aus Ansicht und Fenstergröße, ist der Lauf rot, auch wenn sich dort etwas bewegt hat. Die Vorschrift dazu steht in T-323 9.7. — *Warum die Einschränkung nötig war:* AK-14 (c) und 4.5 sagten über denselben Fall das Gegenteil (T-351 B-20), und ein offenes „oder ein laufender Vorfahr" wäre bei 1024 × 640 auch dann grün, wenn die Marke wieder am Rahmen säße — dort läuft er um 62 px, und das ist der E-115-Verstoß. **Was zählt, ist:** nach der Sprungmarke bewegt `Bild ab` meßbar etwas; *was* sich bewegt, darf vom Fenster abhängen, *daß* sich etwas bewegt, nicht. — *Warum die alte Zahl fiel:* Sie war an einer Ansicht mit einem Laufbereich gemessen und in den Einstellungen **neun**; und sie mißt die falsche Größe. Was zählt, ist **was** dazwischenliegt, nicht wie oft man drückt. Ein zweiter Laufbereich derselben Ansicht (4.5 B) liegt in Dokumentreihenfolge hinter dem Inhalt des ersten — das ist der bewußt in Kauf genommene Weg aus R-i und keine Zusage über eine Schrittzahl.
- **AK-15** *(Geltungsbereich ergänzt, T-344)* Jeder **senkrechte** Laufbereich **aus Abschnitt 4** hat einen zugänglichen Namen und einen sichtbaren Fokusring; der waagerechte Laufbereich des Kanban (`.board`) ebenfalls. **Zwei Abgrenzungen, damit der Satz wahr ist und nicht nur gut klingt:** Die Laufstrecke eines **Bausteins** — `.kcolumn__body`, die Tabellen der Exportgruppen, **seit T-361 die innere Laufstrecke der Tag-Fläche** — bekommt keinen Namen und keinen Halt; für sie gilt die Auflage aus 5.3 (erreichbar über den Fokus der Kinder, keine Achse mit Inhalt auf `hidden`), und in ihrer **rechtesten** Spalte muß ein fokussierbares Element stehen, sonst bekommt sie doch einen Halt. **Die Tag-Fläche erfüllt die Auflage auf dem zweiten Weg:** Ihre Marken sind nicht fokussierbar (Anzeige, kein Bedienelement) — statt dessen trägt die **Fläche selbst** den Fokus, sobald sie über die Tastatur geöffnet wurde, und die Bildlauftasten laufen dann in ihr (T-361 6.4). Ohne diesen Satz wäre ihr innerer Lauf eine reine Mausfläche, also R-c. Und der Lade- und Fehlerzustand der Todo-Detailansicht trägt **keinen** Namen (R-4, T-323 8.5) — dort gibt es keinen vorhandenen, der in beiden Zuständen wahr wäre.
- **AK-16** Ein mit dem Tabulator erreichter Eintrag ist sichtbar — in keiner Ansicht bleibt ein fokussierter Eintrag außerhalb des Sichtfelds.
- **AK-17** Kein `.visually-hidden` erzeugt einen Dokumentbildlauf: In jedem Laufbereich ist die Summe aus `scrollWidth` und `scrollHeight` durch den Inhalt erklärt, und `document.scrollingElement.scrollHeight` bleibt bei AK-01.

**Rückfall**

- **AK-18** *(neu gefaßt in T-340)* Unterhalb der getragenen Untergrenze läuft `.app__main` und trägt den festen Teil mit hinaus, auf **allen** elf Ansichten einschließlich Kanban. „Als Einziges" wird **nicht** gemessen: Der Laufbereich darf innerhalb seines Bodens weiterlaufen. Gemessen wird, daß jede Ansicht vollständig bedienbar bleibt (AK-24).
- **AK-19** Der Wechsel in den Rückfall und heraus verliert den Fokus nicht. Entschieden wird in CSS; kein `resize`-Zuhörer, der Struktur umbaut, und — seit T-323 7.2 — überhaupt kein Umschaltpunkt.
- **AK-20** Der Rückfall richtet sich nach der Höhe des **Inhaltsbereichs**: Bei stehender Hüllenmeldung und stehendem Fassungshinweis greift er entsprechend früher. Das ist zu messen, nicht zu glauben — die Gegenprobe ist ein getragenes Fenster **mit** stehender Hüllenmeldung: Dort darf der Rahmen laufen, und AK-02 wird dort nicht gemessen.
- **AK-23** *(neu, T-340 — das Höhenbudget)* Bei **960 × 640 ohne Hüllenmeldung** paßt der feste Teil jeder Ansicht in den Inhaltsbereich, und für den Laufbereich bleiben mindestens 4 rem. Gerechnet aus der Kette, nicht geschätzt: Inhaltsbereich 640 − 52 px Kopfleiste (`--control-height-lg` 36 + 2 × `--space-2`) = **588 px**; davon 24 px oberer Anschlag von `.screen` = 564 px; abzüglich der 4 rem Boden bleibt für Bildschirmkopf **und alle Leisten zusammen höchstens 500 px**. Bei den drei Rahmenansichten tritt an die Stelle des Bodens die feste Spalte: Kopf plus höchste feste Spalte höchstens 564 px. Die Zahlen sind gerechnet und von frontend-dev am Browser zu bestätigen; **gemessen verletzt ist heute genau eine Stelle** — die Bereichsschiene der Einstellungen mit 577 px (R-3a).
- **AK-24** *(neu, T-340 — was im Rückfall gemessen wird, damit dort nicht nichts gemessen wird)* Unterhalb der getragenen Untergrenze gilt: (a) AK-01 unverändert; (b) AK-02a unverändert — nichts wird waagerecht abgeschnitten; (c) jeder Teil des festen Teils ist durch Bildlauf am Rahmen erreichbar, keiner ist abgeschnitten; (d) der Laufbereich ist nie niedriger als 4 rem; (e) jedes Bedienelement ist mit der Tastatur erreichbar und wird beim Fokussieren ins Bild geholt (AK-16).

**Bestätigungsflächen**

- **AK-25** *(neu, T-340)* Jede Abdunklung deckt das Fenster: `.scrim` ist so groß wie das Fenster und beginnt bei (0, 0) — in **jeder** der sieben Paletten und in beiden Farbmodi, und nach beliebigem Bildlauf unverändert. Ihr Elternteil ist der Dokumentkörper; kein Vorfahr trägt `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change` oder `contain`. Beide Knöpfe der Rückfrage vor dem Öffnen einer Datei sind ohne Bildlauf sichtbar.

  **Meßstand, nachgetragen T-354 — was davon ein Lauf trägt und was nicht.** A-25.6 hat fünf
  Teilsätze; T-348 hat sie einzeln gegen `proof:surface` gestellt und **zwei** zugesichert. Diese
  Aufstellung steht hier, weil AK-25 sonst mehr behauptet, als irgendwo gemessen wird — dieselbe
  Klasse wie B-04, nur an einer anderen Zusage:

  | Teilsatz von A-25.6 | getragen von | Grenze |
  |---|---|---|
  | hängt am Fenster, nie an dem, was sie bestätigt, **in jeder Gestaltung** | **Regel G** (`proof:surface`, T-348): Menge aus dem Stilblatt, echtes Portal, `scrim` muß in der Menge stehen | liest nur JSX und `createElement` im Baum; ein Klassenname, der erst zur Laufzeit entsteht, bleibt ungelesen |
  | ist **vollständig sichtbar** | **kein Lauf** | Größe und Lage einer Bestätigungsfläche mißt kein Quelltextlauf. Gemessen wurde sie **einmal**, in T-334 nach R-31 — als Befund, nicht als stehende Gegenprobe |
  | **rollt nicht weg** | mittelbar | folgt aus `position: fixed` am Dokumentkörper; beide Hälften werden gemessen, ihr **Zusammenhang** nicht |
  | **fängt den Tastaturfokus** | e2e (`trapFocus`, `keepTabInside`), nicht `proof:surface` | — |
  | **Abbrechen ist nie Zustimmung** | **Regel H** (T-348): 91 Absagewege, keiner erreicht einen Zustimmungsrückruf | ein Rückruf über eine fremde Datei, eine Abbildung oder einen Zustandshaken bleibt ungelesen |

  **Die Folge für den Wortlaut oben, benannt und nicht stillschweigend behoben:** „in **jeder** der
  sieben Paletten und in beiden Farbmodi, und nach beliebigem Bildlauf unverändert" ist eine
  **Auflage an die Abnahme** und keine stehende Zusicherung — es gibt keinen Lauf, der sie nach jeder
  Änderung wiederholt. Gemessen wurde sie in zwei Paletten (`glass`, `liquid-glass`, T-334). Was
  strukturell zugesichert ist, ist das Portal am Dokumentkörper; das ist weniger, aber es ist wahr.
  **Ob daraus ein eigener Lauf werden soll, gehört dem Orchestrator** und nicht diesem Papier
  (Teilsatz 2 und 4 sind die Kandidaten; T-348 stellt dieselbe Frage).

**Unberührt**

- **AK-21** Kanban und Formulardialoge verhalten sich wie vor dieser Aufgabe (außer AK-18).
- **AK-22** Kein Oberflächentext ist neu, geändert oder gestrichen. Das gilt auch für die Berichtigungen aus T-340: „Outlook-Add-in" und „Arbeitsplatz" stehen sichtbar in der Bereichsschiene (4.11).

---

## 12. Übergabe an ui-designer (T-323)

Offen und ausdrücklich **nicht** hier entschieden:

1. ~~**Die Grenze aus R-3** — die Zahl, und ob sie über eine Höhenabfrage auf das Fenster oder
   über eine Behälterabfrage auf `.app__main` gestellt wird.~~ **Beantwortet von T-323 7.2, und
   zwar besser als gefragt:** Es gibt keine Zahl und keine Abfrage. Der Rahmen ist der
   Inhaltsbereich, der Boden von 4 rem ist die ganze Regel, und AK-20 ist damit durch die
   Bauform erfüllt statt durch eine Einstellung. An die Stelle der Grenze tritt das umgekehrte
   Maß: das Höhenbudget des festen Teils (AK-23) und der Geltungsbereich des Rückfalls (R-3a).
2. **Die Höhenkette** von `.app__main` über `.screen` bis zum Laufbereich, samt der
   Untergrenzen, ohne die eine Rasterspur oder ein Flex-Element nicht schrumpft.
3. **Wo die Rinne für die Bildlaufleiste liegt** (Nr. 6 in Abschnitt 9) und wie der
   Innenabstand von `.app__main` (`var(--space-6)`) zwischen festem Teil und Laufbereich
   aufgeteilt wird, ohne daß sich Abstände ändern.
4. **Der Fokusring des Laufbereichs** — gleichwertig zu `.app__main:focus-visible`.
5. ~~**Mindesthöhen**, damit ein Laufbereich nicht auf wenige Pixel gedrückt wird, bevor R-3
   greift.~~ **Beantwortet:** `min-block-size: 4rem` an `.screen__body` und `.runarea` — eine
   Tabellenzeile plus ihr Fußabstand. Offen blieb die Gegenrichtung: Was tut ein **fester** Teil,
   der nicht mehr paßt (R-3a, AK-23)? **Beantwortet in T-323 7.5 (T-344), für den einen bekannten
   Fall:** Der Zusatz der Bereichsschiene weicht bei knapper Höhe, wie er bei knapper Breite schon
   weicht. Die Regel dahinter — **es weicht zuerst, was schon einmal weicht, und erst dann eine
   neue Gestalt** — gilt über den Fall hinaus und ist der Maßstab für den nächsten festen Teil, der
   sein Budget reißt.
6. **Die zwei toten Klebungen** (`.settings-rail`, `.tpl-list`) und die eine, die zum ersten
   Mal greift (`.table thead th`).
7. **Der umschließende Block** je Laufbereich (Nr. 7 in Abschnitt 9).
8. **`overscroll-behavior`** je Laufbereich.
9. Ob das Muster aus `viewport-layout.css` erweitert oder eine zweite Datei angelegt wird. Das
   ist eine Frage der Dateihoheit und gehört T-323 und dem Orchestrator, nicht diesem Papier.

---

## 13. Risiken

| | Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **R-a** | Die Rinne der Bildlaufleiste bleibt außen, der Lauf zieht nach innen | Ursache 2 aus T-057 kehrt zurück: Der Inhalt wird um zehn Pixel schmaler, sobald eine Liste läuft — jetzt je Ansicht statt einmal | AK-10, Abschnitt 9 Nr. 6 |
| **R-b** | Ein Laufbereich ist kein umschließender Block, ein `.visually-hidden` liegt darin | Der Dokumentbildlauf kehrt zurück, und zwar still: Das Fenster bekommt eine Bildlaufleiste, die alles verschiebt | AK-01, AK-17, Abschnitt 9 Nr. 7 |
| **R-c** | Ein Laufbereich ist nur mit der Maus erreichbar | Regression gegenüber heute: Der Bildlauf ist ohne Maus nicht bedienbar (SC 2.1.1) | R-4, AK-14, AK-15 |
| **R-d** | Eine Achse wird auf `hidden` gesetzt, in der Inhalt liegt | Inhalt wird unerreichbar — der schwerste denkbare Fehler dieses Umbaus | AK-16, 5.3 Auflage |
| **R-e** | Zwei Laufbereiche geraten im schmalen Fenster untereinander | Zwei halbhohe Bildlaufflächen, beide unbrauchbar | R-2, AK-03 |
| **R-f** | ~~Die Grenze aus R-3 mißt am Fenster~~ **Entfallen** (T-340): Es gibt keine Grenze. An ihre Stelle tritt das umgekehrte Risiko — ein **Meßsatz**, der am Fenster mißt statt am Inhaltsbereich | Er meldet bei stehender Hüllenmeldung einen Fehler, wo der Rückfall richtig arbeitet, und wird nach dem ersten Rot gelockert statt berichtigt | AK-20, AK-23 („ohne Hüllenmeldung" steht in der Meßvorschrift, nicht im Kleingedruckten) |
| **R-g** | Neue zugängliche Namen kollidieren mit vorhandenen | Vorbestehende Prüffälle werden im strikten Modus vieldeutig und fallen um, ohne daß sie jemand angefaßt hat (dieselbe Klasse wie T-315/T-316) | Abschnitt 10, Suche vor dem Bauen; seit T-334 zusätzlich 4.11: „Timer", „Export", „Daten", „Status" stehen in derselben Ansicht als Verweis, als Gebiet und als Überschrift — Abfragen schränken die Rolle ein |
| **R-h** | Der feste Teil wächst über die Jahre (ein Filter mehr, eine Zeile mehr) | Der Rückfall greift immer früher, bis er der Normalfall ist — und weil er selbsttätig ist, **sagt es niemand** | R-1 ist eine Liste und keine Einladung. Seit T-340 gibt es dafür eine Zahl statt eines Gefühls: Wer den festen Teil erweitert, mißt AK-23 neu. Die Bereichsschiene ist der Beleg, daß das Risiko eingetreten ist und nicht theoretisch war |
| **R-j** | *(neu, T-340)* Eine Bestätigungsfläche entsteht im Inhalt statt am Dokumentkörper | Sie hängt am Kasten, der sie ausgelöst hat: Knöpfe außerhalb des Sichtfelds, Fläche rollt mit — gemessen in `glass` und `liquid-glass` (R-31). Und sie fällt nur in **manchen** Paletten auf, weil `backdrop-filter` sie auslöst | R-6, AK-25. Strukturell über das Portal, nicht über eine Verabredung; `proof:surface` kennt den Fall seit T-334 |
| **R-k** | *(neu, T-340)* Der Geltungsbereich aus R-3a wird als Freibrief gelesen | „Unter der Untergrenze darf der Rahmen laufen" wird zu „ein laufender Rahmen ist nie ein Fehler", und ein echter Befund verschwindet im Rückfall | R-3a nennt beide Richtungen mit Zahlen und ordnet **jeden** der zehn gemessenen Verstöße einzeln ein; AK-23 ist die Gegenprobe im getragenen Fenster. **Nachtrag T-354:** Derselbe Freibrief drohte an einer zweiten Stelle — der Rückfallzweig von AK-14 (c). „Oder ein laufender Vorfahr" ohne Grenze macht die Marke am Rahmen bei 1024 × 640 grün, also genau den Befund, gegen den AK-14 geschrieben ist. Gegenmaßnahme ist dieselbe: **der Zweig ist aufgezählt, und wer ihn anderswo nimmt, ist rot** |
| **R-i** | Zusätzliche Tabulatorschritte je Laufbereich | Der Tastaturweg wird länger; bei zwei Bereichen zwei Schritte mehr | Bewußt in Kauf genommen: Es ist die übliche Behebung, und der Gewinn (Bildlauf ohne Maus) ist größer. Die Reihenfolge steht in Abschnitt 7. **Berichtigt T-344:** Die Zeiterfassung hat **drei** Halte, nicht zwei — Rahmen, A und B —, und der Rahmen ruht oberhalb von 68 rem. Das ist der Preis dafür, daß derselbe Kasten unterhalb von 68 rem der einzige Läufer ist (4.5). Dagegen **fallen** zwei Halte weg, die nie etwas taten: die Rahmen in den Einstellungen und im Kanban. Der Kanban-Halt zieht dabei auf `.board` um, wo er die Ansicht bewegt statt nichts |

**Sicherheit.** Diese Aufgabe berührt keine Vertrauensgrenze: keine neue Adresse, kein
Datenweg, keine Route, keine Datei auf der Platte, kein fremder Text auf einem neuen Weg. Sie
ändert, welcher Kasten läuft. Ein Hinweis bleibt: Der Ordnerbefund und die Base64-Zusage in der
Export-Ansicht (B-6.1 Punkt 1) sind **verlangte** Sätze in der Ansicht und dürfen nicht
unerreichbar werden — die Ordnerwarnung wird deshalb fest (4.7), der Base64-Satz bleibt an
seinem Platz in der laufenden Karte, wo er heute steht, und ist bei Bildlaufstelle 0 sichtbar.

---

## 14. Offene Fragen

- **OF-1 — Gilt R-3 auch für das Kanban?** Dieses Papier entscheidet **ja** (4.4), weil der
  Auftrag eine Regel für alle Ansichten verlangt und weil der Rückfall dort eine Rückkehr zum
  bedienbaren Zustand ist. Es ist aber eine Änderung an einer Fläche, die T-323 als
  Präzedenzfall hält. Der Orchestrator bestätigt oder nimmt sie heraus; ein Herausnehmen kostet
  einen Sonderfall in AK-18 und sonst nichts.
  **Nachtrag T-340:** Mit dem selbsttätigen Mechanismus ist die Frage kleiner geworden — es gibt
  keine Stufe, die man für das Board weglassen könnte, sondern nur einen Rahmen, der irgendwann
  läuft. Und die Messung hat sie einmal beantwortet: Was beim Board bei 960 × 640 aussah wie
  der Rückfall, war ein 536,8 px hoher Bildschirmkopf (R-3a).
- **OF-2 — Die Zusammenfassungszeile des Exports.** Sie gehört sachlich in den festen Teil
  (sie ist die Antwort auf die Auswahl unter ihr, wie die Zählzeile und die Auswahlleiste), und
  sie bleibt hier im Laufbereich, weil das Festmachen sie über die Karte „Vorlage und Rundung"
  heben und damit das Design ändern würde. Der Weg wäre ein eigener Auftrag, der die
  Reihenfolge in S-07 **absichtlich** ändert. Dieses Papier streicht dafür keinen Satz und
  verschiebt nichts.
- **OF-3 — Baum und Detailspalte in S-08.** Bei einem tiefen Baum liegt die Aktionsspalte weit
  über dem gewählten Eintrag. Das ist heute so, bleibt so, und wäre mit einem eigenen
  Laufbereich für den Baum zu lösen — eine Layoutentscheidung, die diese Aufgabe nicht treffen
  darf.
- **OF-4 — Die Bildlaufstelle beim Ansichtswechsel.** Heute beginnt jede Ansicht oben, weil der
  Inhaltsbereich neu entsteht. Das bleibt. Ob „Zurück" die Bildlaufstelle wiederherstellen
  soll, ist eine eigene Frage und hier nicht gestellt.
- **OF-5 — Eine Entscheidung für `decisions.md`?** Die Regel „der feste Teil ist die Steuerung,
  der Laufbereich ist der Inhalt; der Rückfall im niedrigen Fenster ist der Seitenlauf" gilt
  über diese Aufgabe hinaus für jede künftige Ansicht. Sie gehört als Entscheidung in
  `.claude/team/decisions.md`, und die schreibt der Orchestrator.
  **Erledigt als E-112**, dort am 2026-09-13 in Punkt 3 berichtigt. **Zwei Sätze aus T-340
  gehören noch dazu**, und beide sind hier entschieden, aber nicht von mir einzutragen:
  (a) der Geltungsbereich des Rückfalls samt Höhenbudget (R-3a, AK-23) — „ein fester Teil, der
  bei 960 × 640 nicht paßt, ist nicht fest"; (b) die Regel über Bestätigungsflächen (R-6) —
  „eine Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt", strukturell über
  ein Portal und nicht über `position: fixed`.
  **Eingetragen am 2026-09-13 als E-115 und E-116**, und beide sind seither in der Spezifikation
  gedeckt: A-25.4 und A-25.6. Damit ist OF-5 geschlossen — und der ganze Abschnitt 25 ist die
  Antwort auf einen Befund, der hier nie stand: **Beide Papiere haben ihre Deckung behauptet, statt
  sie zu haben** (T-343 B-01).
- ~~**OF-6 *(neu, T-340)* — Wie gibt die Bereichsschiene bei knapper Höhe nach?**~~ **Beantwortet
  in T-323 7.5 (T-344).** Von den drei genannten Wegen ist der **erste** gewählt: Der Zusatz je
  Eintrag fällt bei knapper Höhe, wie er bei knapper Breite schon fällt — unter `max-height: 44rem`,
  einer gerechneten und nicht gerundeten Schwelle (576,7 px Schiene + 125 px Kette ⇒ Kante bei
  ≈ 702 px). Nicht gewählt: die Bandgestalt, weil sie die Schiene über den Bereich verschiebt und
  die Leserichtung dreht (AK-05); und ein eigener Laufbereich für die Schiene, weil er einen Halt,
  einen Namen und eine zweite Bildlaufleiste für acht im Quelltext festgelegte Einträge kostete.
  **Eine Zahl fehlt und ist vor dem Bau zu messen:** die Höhe der Schiene ohne Zusatz gegen 579 px
  Rahmen. Kein neuer und kein gestrichener Oberflächentext — der Zusatz verschwindet in einer
  Fenstergröße, wie heute schon, und die Beschriftung bleibt in jeder (Abschnitt 10, A-25.7).

- **OF-8 *(neu, T-361)* — A-25.7 zählt abschließend auf, und die Todo-Tabelle steht nicht darin.**
  Der Satz erlaubt Gestaltänderungen nur an drei benannten Stellen (umbrochener Kopf, Wegfall des
  Zusatzes an der Bereichsschiene, die Namen und Halte aus A-25.5) und verbietet neuen
  Oberflächentext. Eine Tabelle hat eine Kopfzeile; T-361 zählt **zehn** neue Zeichenketten, von
  denen neun aus bereits verwendeten Wörtern bestehen und die zehnte eine Tabellenunterschrift für
  Hilfsmittel ist. **Kein neues Wort tritt in das Erzeugnis ein, aber die Deckung fehlt trotzdem.**
  Der Vorschlag steht in `docs/design/todo-tabelle-fluss.md` Abschnitt 12; entscheiden und in
  `docs/spec.md` eintragen muß es der Orchestrator, **vor** dem Bau. Eine Freigabe nach dem Bau
  wäre dieselbe Reihenfolge, die die Pull Requests #5 bis #16 gekostet hat.
- **OF-7 *(neu, T-344)* — Die Bandnavigation unterhalb von 52 rem.** Sie nimmt **173 px**
  Fensterhöhe; mit der Kopfleiste zusammen **225 statt 52 px**, bei 640 × 480 also 47 % des
  Fensters, bevor eine Ansicht beginnt (T-341 3.5). Dagegen steht ein kleinstmöglicher Kopf von
  ≈ 188 px gegen 175 px Budget: **Der Boden liegt über dem Budget**, und die A2-Verstöße bei
  831 × 640 und 640 × 480 sind dort nicht durch eine Filterleiste zu beheben. Die Frage ist eine
  Abwägung und keine technische: gedrängtere Bandgestalt in Fenstern, die die Hülle gar nicht
  zuläßt — oder es bleibt bei der schwächeren Zusage aus R-3a und AK-24. Sie steht gleichlautend
  als offene Frage 6 im Schwesterpapier, mit dem Vorschlag, es bei der schwächeren Zusage zu
  belassen.
