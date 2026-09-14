# T-362 — Der Mechanismus der Todo-Tabelle und der Tag-Fläche

**Aufgabe:** T-362 — Der Mechanismus der Todo-Tabelle und der Tag-Fläche
**Rolle:** ui-designer
**Status:** fertig — braucht Review (spec-ux-reviewer gegen T-361)
**Datum:** 2026-09-14

## Artefakte

- `docs/design/todo-tabelle.md` — **neu**. Der Mechanismus: Tabellenbauart, klebender Kopf,
  Spaltenbreiten, Kürzung, Tag-Fläche, Bildlauf, Dichten und Gestaltungen, Zustände, Meßsatz,
  Übergabe.
- `docs/design/fensterfeste-flaechen.md` — **geändert an sechs Stellen**: eine Berichtigung
  (A8-Kurzform), drei Ergänzungen (4, 6.3, 9.1 A6), ein Verweis auf A10–A15, ein Nachtrag im Kopf.
- Kein Produktivcode. `fensterfeste-flaechen-fluss.md` und `todo-tabelle-fluss.md` nicht angefaßt.

## Zusammenfassung

Die Todo-Liste bekommt **keine neue Tabellenbauart**, sondern die vorhandene: `.table-wrap` als
Laufbereich, `.table` darin, `table-layout: fixed` mit `<colgroup>` und `min-width: 60rem` wie
`.export-todo-table`. Der klebende Kopf greift nur unter der Bedingung aus T-334 — `.table-wrap`
muß selbst der senkrechte Laufbereich sein —, und daran hängt eine Regel, die bisher nirgends
stand: **die Bauform des Laufbereichs wechselt mit dem Zustand** (Tabellenform gefüllt, Stapelform
leer/ladend/fehlerhaft), weil `display: block` dem Leerzustand sein `margin-block: auto` nimmt.
Die Tag-Fläche benutzt `DialogSurface` **nicht** — sie ist keine Bestätigung —, sondern die
Portalform, die seit T-059 fünf Fundstellen im Baum hat (`Portal` + `.popover-layer` +
`--z-popover`); die E-116-Zusage wird damit strukturell gehalten und nicht über eine
Positionsangabe. Der lange Titel wird **nicht gekürzt, sondern umgebrochen**
(`overflow-wrap: anywhere`, die Bauform, die die Exporttabelle für denselben Wert in derselben
Rolle schon hat) — das spart `proof:clamp` einen neuen Deckel und verbirgt nichts.

Dabei ist eine Fehllesung im Auftrag selbst aufgefallen und am Quelltext widerlegt worden: A8
mißt ein Kind **gegen sich selbst**, nicht gegen den Laufbereich. Der zitierte Satz hätte jede
laufende Fläche im Bestand rot gemacht.

## Annahmen

1. **„Wie auf den anderen Seiten" meint die drei Tabellen, nicht das Exportprotokoll.** Das
   Protokoll ist im Bestand eine `<ul>` aus `.auditrow` (`ExportAudit.tsx:87`), keine Tabelle. Als
   OF-1 an den Auftraggeber gestellt statt geraten.
2. **Die Todo-Tabelle nimmt die einfachere der beiden Laufbereichsformen** (`ScreenBody` trägt
   `className="table-wrap"`, das Tabellenbauteil zeichnet nur `<table>`). `BookingTable` zeichnet
   sein `.table-wrap` selbst, weil es auch in der Musterseite ohne Laufbereich steht; eine
   Todo-Tabelle in der Musterseite gibt es heute nicht.
3. **`min-width: 60rem`** ist aus der Inhaltsbreite des Standardfensters gerechnet (982 px bei
   1280 × 820, `fensterfeste-flaechen.md` 7.4) und nicht aus der Exporttabelle abgeschrieben.
   `61 rem` ließe 6 px — dieselbe Enge, die 7.4 für die Kopfschwelle als nicht stabil bezeichnet.
4. **Die 68-rem-Regel `.todo-row__tags { display: none }` fällt mit der Listenzeile.** Heute sind
   die Tags unter 1088 px gar nicht sichtbar; eine Tabelle kann waagerecht laufen, also entfällt
   ein Weglassen und keine Funktion (A-25.7 gewahrt, E-087 nicht ausgelöst).
5. **Bewegung gibt es an genau einer Stelle:** `popover-in` beim Aufgehen der Tag-Fläche, der
   vorhandene Name, mit dem globalen `prefers-reduced-motion` aus `base.css:252`.

## Risiken

- **R-a — die einzige gerechnete, ungemessene Aussage dieses Papiers.** `todo-tabelle.md` 6.3: Ein
  Blockelement im waagerecht laufenden Kasten ist so breit wie dessen Inhaltsbreite, nicht wie die
  Laufbreite, und wandert beim Rollen aus dem Bild. Trifft die Rechnung nicht zu, ändert sich die
  Bauform von „Weitere laden" — und dann ist die Flußentscheidung F-7 teurer, als T-361 es beim
  Entscheiden wissen konnte. Als A13 in den Meßsatz gestellt.
- **R-b — die Tag-Fläche ist die erste angeheftete Fläche, deren Anker in einem zweiachsigen
  Laufkasten liegt und unter einem klebenden Kasten sitzt.** Die Messung aus T-326 (Liste folgt
  ihrem Anker, 36 → 36) trägt diesen Fall nicht; drei Gründe stehen in 6.1. Zwei Ausgänge sind
  richtig (folgt / schließt), der dritte ist rot (bleibt stehen). A14.
- **R-c — Ü-1 ist nicht nachprüfbar gewesen.** Ob `@ark-ui/react/hover-card` in der installierten
  Fassung 5.39 liegt, ließ sich ohne `node_modules` nicht feststellen. Statt einer Behauptung steht
  ein Bauschritt mit benannter Rückfallform (`Tooltip` mit `interactive`, im Baum bewährt).
- **R-d — 12 Prüffälle in 8 e2e-Dateien hängen an `.todo-row`** (Liste mit Zeilen in 10.1). Sie
  sind **Geltungsbereiche**, nicht Texte (E-114). Auflage im Papier: der frontend-dev repariert sie
  nicht nebenbei, sie gehen als eigener Auftrag in die **nächste** Welle (Lehre aus T-315/T-316).
- **Sicherheit:** keine neue Fläche nach außen, kein neuer Öffnen-Weg, kein neuer Text aus fremder
  Hand. Der Todo-Titel bleibt `ForeignText` und läuft weiter über `Foreign`; die Tag-Namen über
  `TagChip`, der `Foreign` schon trägt. `proof:clamp` bekommt **keinen** neuen Deckel — ausdrücklich
  begründet, weil ein Deckel an einem `UncappedText` der schwerste Fehler dieser Oberfläche wäre.

## Befunde am Bestand

- **B-01 (Berichtigung am Auftrag, behoben).** A8 mißt `child.scrollHeight > child.clientHeight + 1`
  (`viewport-fit.spec.ts:405`) — das Kind gegen sich selbst. Die Zusammenfassung im Auftrag („kein
  direktes Kind darf über den Laufbereich hinausragen") hätte jede laufende Liste rot gemacht.
  Ursache liegt zur Hälfte im Papier: Die Kurzform in 9.1 sagte nicht, wogegen gemessen wird. Beides
  berichtigt.
- **B-02.** Das Exportprotokoll ist keine Tabelle (siehe Annahme 1).
- **B-03.** `theme-palettes.css:464` und `:469` nennen `.todo-row` in einer `:is()`-Liste. Fällt die
  Klasse, zeigen beide Gestaltungen auf einen Bezeichner, den niemand zeichnet. Streichung gehört in
  denselben Auftrag (E-081 Punkt 4).
- **B-04.** `todo-filter-layout.spec.ts` benutzt `.todo-list__ordering`/`.todo-list__sort-hint` —
  das ist die **Filterleiste**, nicht die Liste. Ein Treffer, der keiner ist; E-114 in die andere
  Richtung.

## Offene Fragen

| # | Frage | An wen |
|---|---|---|
| OF-1 | War das Exportprotokoll als Tabellenvorbild mitgemeint, soll also `.auditrow` ebenfalls zur Tabelle werden? | Auftraggeber über den Orchestrator |
| OF-2 | Fällt mit `.todo-row` die letzte Fläche, die `lines` und `zen` eine Zeile wie eine Karte behandeln lassen? Gestaltungsfrage, keine Layoutfrage. | visual-qa, dann Orchestrator |
| OF-3 | Tragen `Select`, `Menu` oder `TagInput` den zweiachsigen Ankerfall schon irgendwo ungemessen? | e2e-tester im Zuge von A14 |
| OF-4 | Bestätigt A13 die Rechnung aus 6.3? Falls nein, geht F-7 an T-361 zurück. | e2e-tester, dann T-361 |

**Was dieses Papier ausdrücklich nicht beantwortet, steht als F-1 bis F-10 in `todo-tabelle.md` 0**
— Spaltenmenge und -reihenfolge, Auswahlspalte, Sortierung, Öffnungsbedingung der Tag-Fläche, das
Verhalten ohne Maus, die Zahl sichtbarer Tags, der Verbleib von Nachladefuß und Ausblendhinweis,
die Randmarkierung, der Doppelklick, das Erledigt-Kästchen. Alles davon ist T-361.

## Nächster Schritt

1. **T-361 und dieses Papier gegeneinander messen, nicht bestätigen** (spec-ux-reviewer). Der
   Prüfweg ist die Liste F-1 bis F-10: Beantwortet eines der beiden Papiere eine Frage der anderen
   Seite, ist das der Befund — nicht die Übereinstimmung.
2. OF-1 an den Auftraggeber, bevor gebaut wird. Er entscheidet über eine zweite Ansicht.
3. Danach frontend-dev in der Reihenfolge aus `todo-tabelle.md` 10.2, mit den vier Punkten aus 10.3
   als Berichtspflicht (Ü-1, Ausgang aus 6.2, gemessene Spaltensumme, A13).
4. Erst in der **Welle danach** der e2e-tester: A10 bis A15 samt der sechs Gegenproben, und die
   Reparatur der 12 Fundstellen aus 10.1.
