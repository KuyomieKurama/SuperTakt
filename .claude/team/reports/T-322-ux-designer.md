Aufgabe: T-322 — Fensterfeste Flächen: der Fluß je Ansicht
Status: fertig

Artefakte:
- `docs/design/fensterfeste-flaechen-fluss.md` (neu)
- `.claude/team/reports/T-322-ux-designer.md` (dieser Bericht)

Kein Produktivcode, kein CSS, keine Datei unter `apps/**` oder `packages/**`.
`docs/design/fensterfeste-flaechen.md` (T-323) nicht angefaßt.

Zusammenfassung:
Jede der elf Ansichten zerfällt künftig in einen festen Teil (Bildschirmkopf, Bereichsreiter,
Filterleiste mit Zählzeile und Chips, und die eine Leiste, die die Auswahl im Inhalt
beantwortet) und einen Laufbereich; die Naht liegt unter dem, was die Auswahl steuert, und
verschiebt kein Element über ein anderes. Zehn Ansichten bekommen **einen** Laufbereich, die
Zeiterfassung **zwei** nebeneinander (Kartenrumpf „Todo wählen" und Kartenrumpf „Buchungen von
heute", nach dem bestehenden Kanban-Muster Kopf steht / Rumpf läuft) — und bei ≤ 68 rem, wo die
Spalten untereinander fallen, wieder einen. Für das niedrige Fenster gilt eine Regel statt elf
Einzelfälle: Unterschreitet die Höhe des **Inhaltsbereichs** (nicht des Fensters) eine Grenze,
fällt die Ansicht auf den heutigen Zustand zurück — `.app__main` läuft wieder als Einziges —,
und zwar in CSS, damit der Fokus nicht verlorengeht. Die Buchungstabelle trägt beide Achsen in
einer Fläche, der Tabellenkopf klebt dadurch zum ersten Mal wirklich, und es wird **keine**
Spalte waagerecht angeheftet. Das Papier nennt zwölf Stellen, die heute vom Seitenlauf leben
(zwei tote Klebungen, die Rinne aus T-057, der umschließende Block für `.visually-hidden`, der
Tastaturweg über die Sprungmarke), 22 Akzeptanzkriterien, eine Zustandsmaschine Z0–Z7 und
neun Punkte, die ausdrücklich T-323 gehören.

Annahmen:
1. Zwei Laufbereiche nur nebeneinander, nie übereinander. Daraus folgt, daß der bestehende
   Umbruch bei ≤ 68 rem zwei Laufbereiche zu einem macht.
2. Tags bekommt **einen** Laufbereich, obwohl der Auftrag „Baum und Regeln" als Kandidaten
   nennt: Beide stehen untereinander (`.tags-layout` ist eine Spalte, `.tags-split` liegt in
   der ersten Karte). Zwei wären zwei übereinanderliegende Bildlaufflächen.
3. Die Kennzahlkarten des Dashboards und die Timerkarte **laufen** — die Timerkarte, weil der
   Timer über `.app__header-timer` ohnehin dauerhaft sichtbar ist und T-065 die Doppelung
   gerade beseitigt hat.
4. Die Ordnerwarnung der Export-Ansicht wird **fest**, weil sie der Grund für die gesperrte
   Primäraktion im festen Kopf ist. Die Zusammenfassungszeile bleibt dagegen im Laufbereich:
   Festmachen hätte sie über die Karte „Vorlage und Rundung" gehoben und damit das Design
   geändert (OF-2).
5. Namen der Laufbereiche kommen ausnahmslos aus vorhandenen Überschriften — kein neuer
   Oberflächentext, kein neuer zugänglicher Name im Wortlaut.
6. R-3 gilt auch für das Kanban (OF-1).
7. Daß `.table thead th` heute nicht klebt, ist am Quelltext **gelesen**, nicht im Browser
   gemessen — in dieser Umgebung stehen weder Node noch ein Webview zur Verfügung.

Risiken:
- Die Rinne der Bildlaufleiste bleibt außen, während der Lauf nach innen zieht: Ursache 2 aus
  T-057 kehrt zurück, jetzt je Ansicht statt einmal (AK-10).
- Ein Laufbereich ist kein umschließender Block und trägt ein `.visually-hidden`: der
  Dokumentbildlauf kehrt still zurück (AK-01, AK-17). Teuerste Falle des Umbaus.
- Eine Achse auf `hidden`, in der Inhalt liegt: Inhalt wird unerreichbar (AK-16).
- Neue zugängliche Namen kollidieren mit vorhandenen („Todos" dreimal): vorbestehende Prüffälle
  werden im strikten Modus vieldeutig und fallen um, ohne daß sie jemand angefaßt hat —
  dieselbe Klasse wie T-315/T-316. Deshalb steht im Papier die Auflage, den Wortlaut vor dem
  Bauen über `git grep` **und** einen Lauf durch die Quellverzeichnisse zu suchen.
- Sicherheitshinweis: keine neue Vertrauensgrenze, keine Adresse, kein Datenweg. Einziger
  Berührungspunkt: Die in B-6.1 Punkt 1 ausdrücklich in der Ansicht verlangten Sätze
  (Ordnerbefund, Base64) dürfen nicht unerreichbar werden — die Ordnerwarnung wird deshalb
  fest, der Base64-Satz bleibt an seinem Platz bei Bildlaufstelle 0.

Offene Fragen:
- OF-1: R-3 auch für das Kanban? Hier mit „ja" entschieden, weil der Auftrag eine Regel für
  alle Ansichten verlangt; es ist aber eine Änderung an der Fläche, die T-323 als Präzedenzfall
  hält. Bestätigen oder herausnehmen.
- OF-2: Die Zusammenfassungszeile des Exports gehört sachlich in den festen Teil. Der Weg dahin
  ändert die Reihenfolge in S-07 und braucht einen eigenen Auftrag.
- OF-3: Baum und Detailspalte in S-08 — bestehende Grenze, durch diese Aufgabe nicht
  verschlimmert, nicht behoben. Eigener Auftrag.
- OF-4: Bildlaufstelle bei „Zurück" — hier nicht gestellt.
- OF-5: Die Regel „fester Teil = Steuerung, Laufbereich = Inhalt, Rückfall = Seitenlauf" gilt
  über diese Aufgabe hinaus und gehört als Entscheidung in `decisions.md`. Die schreibt der
  Orchestrator.
- Kein Textkandidat zum Streichen. E-087 wird von dieser Aufgabe nicht ausgelöst.

Nächster Schritt:
T-323 (ui-designer) nimmt die neun Punkte aus Abschnitt 12 und nennt Höhenkette, Grenze,
Rinne, Fokusring, Mindesthöhen und die drei Klebungen. Erst in der Welle **danach**
frontend-dev gegen die 22 Akzeptanzkriterien — und in derselben Welle **nicht** unit-tester
oder e2e-tester auf denselben Flächen: Der Umbau ändert zugängliche Namen und Tabulatorwege,
und wer sie mißt, gehört in die nächste Welle (Lehre aus T-315/T-316). Vor dem Bauen die Suche
aus Abschnitt 10 durchführen und ihr Ergebnis in den Auftrag schreiben.
