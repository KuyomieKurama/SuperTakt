# T-361 — Die Todo-Liste wird eine Tabelle, und die Tags müssen nicht alle sichtbar sein

**Aufgabe:** T-361 — Todo-Tabelle: Informationsarchitektur, Fluß und Zustände
**Rolle:** ux-designer
**Stand:** 2026-09-14
**Status:** fertig — **mit einer Deckungslücke, die vor dem Bau zu entscheiden ist** (OF-1)

---

## Artefakte

| Datei | Art |
|---|---|
| `docs/design/todo-tabelle-fluss.md` | **neu**, 17 Abschnitte |
| `docs/design/fensterfeste-flaechen-fluss.md` | berichtigt an sechs Stellen (Kopf, 4.2, 5. Kopf, 5.3 Punkt 2, R-6 Punkt 1, AK-15, OF-8) |

Kein Produktivcode, kein CSS, keine Änderung an `docs/spec.md`,
`docs/design/fensterfeste-flaechen.md` oder `docs/design/todo-tabelle.md`.

---

## Zusammenfassung

Die Todo-Liste bekommt **acht Spalten** — Erledigt, Call, Titel, Status, Frist, Tags, Buchungen,
Aktionen. Nichts von der heutigen Zeile entfällt; die vierteilige Metazeile zerfällt in vier
Spalten, und der Titel wird **einzeilig gekürzt mit vollem Text im `title`-Attribut**, also mit
der Lösung, die die Buchungstabelle schon trägt, statt mit einer zweiten. Die Tags verlieren ihre
Marken aus der Zeile und behalten dort **die Zahl** in einem `button`; die Marken stehen mit
**vollem Ordnerpfad** in einer Fläche, die der Knopf öffnet — mit `Eingabe`, mit Tippen und mit
Überfahren, in dieser Reihenfolge der Verbindlichkeit. Die Fläche hängt im Portal am
Dokumentkörper, weil `.table-wrap` beide Achsen trägt und eine Fläche darin nicht bloß falsch
verankert, sondern **abgeschnitten** wäre; SC 1.4.13 ist in drei Zusagen ausbuchstabiert
(abweisbar, überfahrbar, beständig — kein Zeitgeber). Überfälligkeit bleibt eine Aussage der
**Zelle** und wird keine Aussage der Zeile: Die Zeilenfärbung bleibt dem laufenden Timer
vorbehalten, und die Spalte macht Fristen vergleichbar, was der Filter allein nie konnte.

Drei Befunde am Bestand haben den Entwurf stärker geprägt als der Auftragstext. **Erstens:** Die
Todo-Liste hat heute **keine** Mehrfachauswahl — das führende Kontrollkästchen ist das
Erledigt-Kennzeichen. Wer `BookingTable` als Vorlage kopiert, erbt das Auswahlkästchen in der
Kopfzelle und `aria-selected` an der Zeile und erfindet damit still eine Auswahl, die keine Aktion
verwerten kann; dagegen stehen drei der schärfsten Auflagen des Papiers. **Zweitens:** Ein
klebender Tabellenkopf verlangt, daß `.table-wrap` selbst der Laufbereich ist — damit hat der
Laufbereich der Todos kein Geschwister mehr, und der Hinweis auf ausgeblendete erledigte Todos
muß in den festen Teil, „Weitere laden" in den Tabellenfuß. Das ist die erzwungene Berichtigung an
4.2 des Schwesterpapiers, und sie kostet Höhenbudget an der engsten Stelle des Erzeugnisses.
**Drittens:** Eine Tabelle hat eine Kopfzeile, und A-25.7 zählt die erlaubten Gestaltänderungen
abschließend auf.

---

## Annahmen

1. **„Wie auf den anderen Seiten" heißt `BookingTable` und `ExportGroups`, nicht das
   Exportprotokoll.** `ExportAudit.tsx` ist eine `<ul>` aus `.auditrow` und keine Tabelle; der
   Auftragstext nennt es als zweites Vorbild. Ich habe die Spaltenordnung deshalb an den beiden
   echten Tabellen ausgerichtet, die sich einig sind: Zustandsspalte, `Call`, Gegenstand,
   Nebendaten, Aktionen zuletzt.
2. **Keine neue Funktion.** Kein Sortieren am Spaltenkopf (die Ordnung steht bereits in der
   Filterleiste — ein zweites Stellglied für einen Zustand ist ein Fehler, kein Komfort), kein
   Kontextmenü an der Zeile, kein Ziehen und Ablegen, kein Filtern durch Klick auf eine Marke.
   Alle vier wären Verbesserungen; alle vier sind eigene Aufträge (OF-2 bis OF-5 im Papier).
3. **Die Zahl in der Tag-Zelle ist die Gesamtzahl aus `todo.tagIds.length`**, nicht der Überlauf
   und nicht die Zahl der aufgelösten Marken. Das behebt nebenbei einen stillen Fall: Steht
   `StructureContext` auf `error`, zeigt eine Zeile mit elf Tags heute nichts und sieht aus wie
   ein Todo ohne Tags.
4. **`.todo-row` und `.todo-row__title` überleben als Haken am `<tr>`.** Das ist eine
   Kompatibilitätsauflage aus E-114, keine Gestaltungsvorgabe — neun Prüfstellen in acht
   e2e-Dateien benutzen `.todo-row` als Geltungsbereich.
5. **Die 68-rem-Regel `.todo-row__tags { display: none }` fällt ersatzlos.** Eine verschwundene
   Spalte ist ein stiller Verlust, ein Bildlauf ist sichtbar. Kein Text, also kein E-087-Fall.

---

## Risiken

| | Risiko | Gegenmaßnahme im Papier |
|---|---|---|
| **R-1** | `BookingTable` wird kopiert samt Auswahlkästchen in der Kopfzelle und `aria-selected` — die Ansicht behauptet eine Auswahl, die es nicht gibt | 3.2, TT-02 |
| **R-2** | Die Tag-Fläche entsteht innerhalb der Zeile und wird von `.table-wrap` abgeschnitten; in `lines` und `zen` zusätzlich anders als in klassisch, weil `.todo-row` dort wie eine Karte behandelt wird | 6.1, TT-15, TT-16 |
| **R-3** | Der jetzt feste Hinweis reißt das Höhenbudget. Der feste Teil der Todos steht an der getragenen Untergrenze bei 75,9 % (T-341 3.3) — die engste Stelle des Erzeugnisses | 8.1, TT-24: AK-23 **mit** stehendem Hinweis neu messen |
| **R-4** | „Hover" wird wörtlich gebaut; Tastatur, Berührung und Vorlesehilfe verlieren eine Angabe, die heute dasteht | 5.3, TT-09, TT-12 |
| **R-7** | „Status" und „Tags" stehen künftig zweimal in derselben Ansicht (Filter und Spaltenkopf) — vorbestehende Prüffälle werden im strikten Modus vieldeutig (R-g, T-315/T-316) | Abschnitt 12, Suche vor dem Bauen |
| **R-8** | Die Kopfzeile wird als „kein neuer Text" durchgewinkt | Abschnitt 12, OF-1 |

**Sicherheit.** Keine neue Vertrauensgrenze: keine Adresse, keine Route, keine Datei. **Ein neuer
Hinweis:** Die Tag-Fläche zeigt fremden Text (Tag-Namen und Ordnerpfade können aus dem Add-in oder
einem Fremdimport stammen) auf einer Fläche, die es bisher nicht gab. Sie muß `TagChip` benutzen
und darf den Pfad nicht selbst zusammensetzen — ein `path.join(" / ")` außerhalb des Bausteins
wäre fremder Text ohne Behandlung (E-063, T-124).

---

## Offene Fragen

- **OF-1 — an den Orchestrator, vor dem Bau zu entscheiden: A-25.7 deckt T-361 nicht.** Der Satz
  zählt die erlaubten Gestaltänderungen **abschließend** auf (umbrochener Kopf, Wegfall des
  Zusatzes an der Bereichsschiene, die Namen und Halte aus A-25.5) und verbietet neuen
  Oberflächentext. Die Todo-Tabelle bringt **zehn** neue Zeichenketten: acht Spaltenköpfe, den
  zugänglichen Namen des Tag-Auslösers und die Tabellenunterschrift. Neun davon bestehen aus
  Wörtern, die das Erzeugnis bereits benutzt — „Erledigt", „Call", „Titel", „Status", „Frist",
  „Tags", „Buchungen", „Aktionen" —, **kein neues Wort tritt ein**, und kein Text fällt weg. Die
  Deckung fehlt trotzdem. Vorschlag für den vierten Aufzählungspunkt steht in Abschnitt 12 des
  Papiers. Der Auftragstext von T-361 zitiert nur die Texthälfte des Satzes; die Gestalthälfte ist
  die schärfere.
- **OF-2 — Bekommt die Todo-Zeile das Kontextmenü der Buchungszeile?** Hier verneint (neue
  Funktion). Die Folge steht in 5.3 des Schwesterpapiers: Punkt 2 der dortigen Begründung trägt
  für diese Tabelle nicht, Punkt 3 trägt allein — und er trägt.
- **OF-3 bis OF-6** im Papier: Sortieren am Kopf, Filtern über die Marken der Fläche,
  Standard-Tag-Abzeichen in der Fläche, Deckel für die Tag-Zahl.

---

## Nächster Schritt

1. **Orchestrator:** OF-1 entscheiden und A-25.7 ergänzen — **vor** T-362 und vor dem Bau. Eine
   Freigabe nach dem Bau wäre dieselbe Reihenfolge, die die Pull Requests #5 bis #16 gekostet hat.
2. **ui-designer (T-362):** `docs/design/todo-tabelle.md` **gegen** dieses Papier messen, nicht
   bestätigen. Die vier Fragen aus Abschnitt 15 sind ausdrücklich an ihn gestellt; die Abgrenzung
   vorn nennt zwölf Fragen, die ich nicht beantworte.
3. **frontend-dev, in derselben Welle wie T-362 und nicht früher:** den E-087/E-114-Abgleich für
   die zehn Wortlaute fahren — `git grep` **plus** ein Lauf über `apps/*/src`, `packages/*/src`,
   `tests/`, Bauergebnisse ausgeschlossen —, und die neun `.todo-row`-Stellen aus Abschnitt 13
   entweder durch die Klassenauflage grün halten oder im **selben** Auftrag berichtigen
   (E-081 Punkt 4).
4. **e2e-tester, danach:** TT-01 bis TT-30. Die teuersten sind TT-10 (Zahl bei defektem
   `StructureContext`), TT-15 (Portal in allen sieben Paletten) und TT-24 (Höhenbudget mit
   stehendem Hinweis).
