# T-323 — Fensterfeste Flächen: der Mechanismus

Aufgabe: T-323 — Fensterfeste Flächen: der Mechanismus
Status: fertig

## Artefakte

- `docs/design/fensterfeste-flaechen.md` (neu, 12 Abschnitte)
- `.claude/team/reports/T-323-ui-designer.md` (dieser Bericht)

Kein Produktivcode angefasst. `docs/design/fensterfeste-flaechen-fluss.md` (T-322) nicht berührt.

## Zusammenfassung

Das Papier legt **ein** Bauverfahren fest, mit dem jede der elf Ansichten fensterfest wird:
`.app__main` wird vom einzigen Laufbereich zum **Rahmen** (ein Rasterfach, `minmax(0, 1fr)`, kein
Innenabstand), und jede Ansicht bringt einen festen Kopf (`.screen__header`, vorhanden), null bis
n feste Leisten (`.screen__bar`) und **genau einen** Laufbereich (`.screen__body`) mit; für zwei
Laufspalten gibt es `.screen__body--frame` plus `.runarea`. Die Höhenkette steht als elfstufige
Liste von `html` bis zum Laufbereich, jede Stufe mit ihrer Begründung und der Angabe, ob die Zeile
heute schon da ist. Der Innenabstand wandert von `.app__main` in die drei benannten Teile; gerechnet
ergibt das eine **pixelgleiche Inhaltsspalte**, verschoben wird genau ein Rand (der rechte Rand des
Kopfes, um die Rinnenbreite), und das ist begründet hingenommen, weil Dialog und Seitenleiste
dieselbe Eigenschaft seit je haben. Waagerecht bleibt `.app__main` bei `overflow-x: hidden` — nicht
aus Bequemlichkeit, sondern weil `.table-wrap` und `.board` eigene Bildlaufkästen sind und die
Durchlässigkeit der Kette **gemessen** wird statt gehofft. Der Meßsatz ist als Playwright-Vorschrift
beschrieben (sieben Zusicherungen, fünf Fenstergrößen), und seine Ansichtsmenge wird nach E-099
Punkt 3 an `RouteName` in `router.ts` aufgespannt, nicht an einer Liste bekannter Adressen.

## Annahmen

1. **Die Mindestgröße ist keine erfundene Zahl.** 960 × 640 kommt aus `tauri.conf.json`
   (`minWidth`/`minHeight`); das Standardfenster 1280 × 820 ebenfalls. Für den Browserbetrieb habe
   ich 640 × 480 als getragene Untergrenze gesetzt und 320 × 256 (WCAG 2.2 SC 1.4.10 bei 400 %) als
   Bereich, in dem nur noch „nichts abgeschnitten" zugesichert wird.
2. **Kein Medienquery für den Rückfall.** Statt einer Schwellenzahl behält `.app__main`
   `overflow-y: auto` und der Laufbereich bekommt `min-block-size: 4rem`. Dadurch übernimmt der
   Rahmen den Bildlauf **selbsttätig**, sobald Kopf plus feste Leisten mehr als die Rahmenhöhe
   minus eine Zeile brauchen. Die 4rem sind aus `--row-height` (40) plus `--space-6` (24) gerechnet,
   nicht gemessen — siehe offene Frage 3.
3. **Der Mechanismus gehört nach `viewport-layout.css`**, nicht nach `app.css`: `designsystem.tsx`
   importiert `app.css`, aber nicht `viewport-layout.css`, und die Musterseite bleibt so ohne
   Zutun von der Höhenkette unberührt. Nur die Änderungen an `.app__main` und `--screen-inset`
   bleiben in `app.css`, weil beide dort stehen.
4. **`--screen-inset` ist kein neues Token.** Es ist ein lokaler Eigenwert an `.app`, gefüllt aus
   `--space-6` bzw. `--space-4`, in derselben Bauform wie `--app-header-height`. In
   `packages/ui-tokens/tokens.css` ändert sich nichts.
5. **Die Sprungmarke wandert.** `id="inhalt"` und `tabIndex={-1}` gehen von `.app__main` an den
   Laufbereich, sonst rollt nach dem Sprung die Bild-ab-Taste nichts mehr (SC 2.1.1). Der sichtbare
   Text „Zum Inhalt springen" bleibt wörtlich; es fällt kein Oberflächentext.
6. **Das Outlook-Add-in ist nicht eingeschlossen** — eigener Aufgabenbereich, eigenes Gerüst,
   fremdbestimmte Fensterhöhe. Nicht mitentworfen (offene Frage 4).

## Risiken

- **R-323-1 — Portale und der neue Bildlaufkasten.** Aufgeklappte Listen und Menüs liegen seit
  T-059 am Dokumentkörper. Ihr Anker liegt künftig in einem **anderen** Bildlaufkasten als bisher;
  ob die Nachführung dessen Bildlaufereignisse hört, ist eine Eigenschaft der Bibliothek und in
  diesem Papier **nicht gemessen**. Verbindlicher Prüffall im selben Auftrag: Auswahlfeld im
  Laufbereich öffnen, Laufbereich rollen — die Liste folgt oder schließt, sie bleibt nicht stehen.
- **R-323-2 — `.boot` als Ladeersatz bricht ohne Begleitänderung.** `min-height: 100dvh` in einem
  Rahmen von etwa 76 % Fensterhöhe schiebt den Ladekreis unter die sichtbare Fläche. Heute fällt
  das nicht auf, weil `.app__main` rollt. Gegenmittel steht im Papier (`.boot--inline`), muss aber
  im selben Auftrag mit. Dasselbe für `UnknownScreen` und die Nachlademeldung, die ohne den
  Innenabstand von `.app__main` bündig an der Rahmenkante lägen.
- **R-323-3 — zwei Regelmengen auf einer Fläche.** Wird der Mechanismus gebaut, ohne die vier
  `:has()`-Zeilen aus `viewport-layout.css` (Z. 54–67) im selben Auftrag zu streichen, tragen zwei
  Regelwerke das Kanban. Streichung und Ersatz gehören in einen Auftrag (E-081 Punkt 4).
- **R-323-4 — `contain`/`will-change` am Laufbereich.** Wer „für die Bildlaufleistung"
  `contain: paint` oder `will-change: scroll-position` an `.app`, `.app__main`, `.screen` oder
  `.screen__body` schreibt, macht den Kasten zum umschließenden Block für feste Positionierung —
  danach zentriert sich der Dialog im Inhaltsbereich statt im Fenster und `.toast-layer` klebt an
  dessen Ecke. Im Papier als Verbot benannt; der statische Lauf aus 9.5 würde es messen.
- **Sicherheit:** keine neue Fläche nach außen, keine neue Netzverbindung, kein neues
  Datenfeld, keine Änderung an Grenzen des lokalen Dienstes. Der Mechanismus ist reines
  Oberflächenlayout. Ein Punkt mit Sicherheitsbezug bleibt gewahrt und ist ausdrücklich begründet:
  `.screen__body` bekommt **kein** `position: relative`, damit es bei genau einem umschließenden
  Block für absolut positionierte Nachfahren bleibt (`.app__main`, T-057 Ursache 2) — und
  `.foreign-name` bleibt unangetastet, `proof:clamp` misst weiter dieselbe Regel.

## Offene Fragen

1. **An T-322:** Bleibt `.list-more` fester Fuß (so liest sich `viewport-layout.css` Z. 65 für das
   Board), oder wandert der Nachladefuß in den Laufbereich? Der Mechanismus trägt beides.
2. **An den Orchestrator:** Soll der Rinnenversatz am rechten Rand des Kopfes ausgeglichen werden?
   Der einzige Weg (`overflow: hidden` plus `scrollbar-gutter: stable` am Kopf) hat zwei ungemessene
   Kanten in drei Engines. Ohne Messung habe ich ihn nicht vorgeschrieben. Vorschlag: bei der
   nächsten `proof:engines`-Gelegenheit mitmessen.
3. **An den frontend-dev:** Die 4rem der Untergrenze sind gerechnet, nicht gemessen. Beim Umbau
   einmal nachsehen, wie hoch Kopf plus feste Leisten bei 640px Fensterhöhe stehen, und den
   Kommentar mit der gemessenen Zahl berichtigen.
4. **An den Auftraggeber, über den Orchestrator:** Gilt „fensterfest" auch für den Aufgabenbereich
   des Outlook-Add-ins? Ich habe es als nicht eingeschlossen behandelt.

## Vorschläge an den Orchestrator (keine Änderung durch mich)

- `viewport-layout.css` Z. 54–67 entfallen mit dem Mechanismus — im selben Auftrag.
- `.board-order` (Z. 96–103) ist eine Knopfgruppe, kein Viewport-Layout, und gehört nach
  `components.css` — eigener, kleiner Auftrag.
- Ein statischer `proof:`-Lauf nach dem Muster von `proof:clamp`, der die Zusage in der CSS-Datei
  misst (kein Innenabstand und keine Rinne zurück an `.app__main`, kein `position: relative` und
  kein `padding-block-start` am Laufbereich, keine der fünf Eigenschaften aus R-323-4). Abschnitt
  9.5 des Papiers beschreibt ihn.

## Nächster Schritt

Nach Vorliegen von T-322 eine Welle mit **drei** Aufgaben, in dieser Reihenfolge gedacht:

1. **frontend-dev** baut den Mechanismus und die Rollenverteilung in einem Auftrag: `app.css`,
   `viewport-layout.css` (einschließlich der Streichung aus R-323-3), `App.tsx`, `router.ts`
   (`ROUTE_NAMES`), die elf Ansichten, dazu R-323-1 und R-323-2. Die Übergabeliste steht als
   Abschnitt 11 des Papiers.
2. **e2e-tester** baut `tests/e2e/viewport-fit.spec.ts` nach Abschnitt 9 — **in der Welle danach**,
   nicht parallel: Wer die Schnittstelle umbaut und wer sie misst, gehören in aufeinanderfolgende
   Wellen, und `ROUTE_NAMES` entsteht erst in Schritt 1.
3. **ux-reviewer und security-checker** danach; für den Security-Checker ist die einzige neue
   Fläche das Verbot aus R-323-4 und die unveränderte Lage der festen Positionierung.
