# T-343 — Spezifikations- und UX-Abgleich über den fensterfesten Umbau

**Rolle:** spec-ux-reviewer. **Stand:** 2026-09-13.

**Gegen welchen Stand gelesen.** Verbindlich sind `docs/spec.md`,
`docs/design/fensterfeste-flaechen.md` (T-323, berichtigt in T-339),
`docs/design/fensterfeste-flaechen-fluss.md` (T-322, berichtigt in T-340) und E-112 bis E-116.
Wo ich den Bestand gelesen habe, ist es der **Arbeitsbaum auf
`feature/outlook-anhaenge-und-versionspruefung` nach `311b26e`, unversioniert**, und zwar am
Quelltext, nicht im Browser gemessen — in dieser Umgebung steht kein Node zur Verfügung. Jede
Zeilennummer unten ist aus diesem Stand; `apps/web/**` bewegt sich unter mir (T-341).

**Nicht geprüft, weil bekannt und parallel in Arbeit:** abgeschnittener Fokusring (T-336),
`proof:surface` an Portalen statt an der Verankerung (T-337), Lückenliste des Versionswächters.

---

## Urteil

**Nicht freigegeben.** Nacharbeit, blockierend: **B-01, B-02, B-03, B-04, B-07**.

**Die Einzelfreigabe, um die T-339 ausdrücklich bittet — der umbrochene Bildschirmkopf —, ist
erteilt** (B-05), mit einer Einschränkung des Geltungsbereichs, die in das Papier gehört.

Sieben weitere Befunde (B-06, B-08 bis B-13) sind nicht blockierend, aber vor dem
Dokumentierer zu erledigen.

---

## 1. Deckung — trägt sie?

### B-01 · blockierend · alle elf Ansichten · A-13.8, A-13.9, A-21.2, A-21.3, Abschnitt 14, Abschnitt 15

**Abweichung.** Der Auftrag des Auftraggebers vom 2026-09-12 hat **keine Anforderungs-ID in
`docs/spec.md`**. Die Papiere berufen sich auf geliehene IDs, und keine davon trägt den Satz,
um den es geht:

| Zitiert | Was dort wirklich steht | Trägt es? |
|---|---|---|
| A-13.8 „Responsiv aufgebaut" | Anpassung an die Fenster**breite**; die Umbruchstufen bei 68/60/52/40/32 rem sind ihre Umsetzung | **Nein.** Sagt nichts über Bildlaufkästen, nichts über die Höhe und nichts darüber, welcher Kasten läuft |
| A-13.9 „Auf Desktop-Nutzung optimiert" | Eine Zielaussage | **Nein.** Deckt jede und damit keine Bauform |
| Abschnitt 14 „Navigation jederzeit sichtbar" | Die **globale** Navigation (Seitenleiste) | **Nein.** Sie lag schon vor T-326 außerhalb von `.app__main` und war von diesem Umbau nie betroffen. Was der Umbau festmacht, ist der Bildschirmkopf und die Filterleiste — beides keine globale Navigation. Abschnitt 14 trägt außerdem **überhaupt keine ID** |
| Abschnitt 15 „Designrichtung" | Prosa plus die Aufzählung der verlangten Zustände | **Teilweise** — für die Zustände (B-05, B-09), nicht für den Mechanismus. Und auch Abschnitt 15 hat **keine ID** |
| A-21.2 | „klarere Gewichtung, weniger gleichförmige Kartenflächen" | **Nein.** Eine Aussage über Optik |
| A-21.3 | „Bedienabläufe bleiben kompatibel" | **Nein** — das ist die *Auflage an* den Umbau, nicht seine Deckung. Sie gilt gegen ihn, nicht für ihn |

`CLAUDE.md`: „Keine Umsetzung ohne Deckung durch eine Anforderungs-ID daraus." Gebaut sind
elf Ansichten, zwei Designpapiere, fünf Entscheidungen (E-112 bis E-116), neun Berichtigungen
und ein Meßsatz. Deckung: null IDs.

**Der Hausbrauch steht in derselben Datei, vom selben Tag.** `docs/spec.md:421` und `:429`
tragen A-19.23c und A-19.30a mit dem Vermerk *„Nachgetragen am 2026-09-12 — die Abweisung
entstand beim Bauen und war bis dahin ungedeckt."* Genau dieser Weg ist hier nicht gegangen
worden. Ein Papier, das seine Begründung selbst mitbringt, ist keine Anforderung: T-323 sagt in
seinem eigenen Kopf, daß zwei Papiere, die einander bestätigen, keine Messung sind (E-113) —
dasselbe gilt für zwei Papiere, die einander decken.

**Vorschlag.** Ein Abschnitt 25 in `docs/spec.md`, sechs Sätze, geschrieben vom Orchestrator
aus dem Auftrag und den Entscheidungen — nicht aus den Papieren:

- **A-25.1** Jede Ansicht richtet sich nach dem verfügbaren Inhaltsbereich. Weder Dokument noch
  Fenster werden durch Inhalt höher oder breiter.
- **A-25.2** Läuft etwas über, läuft ausschließlich der betroffene Inhaltsbereich. Die Steuerung
  einer Ansicht — Titel, Primäraktion, Bereichsreiter, Filterleiste samt Zählzeile — bleibt an
  jeder Bildlaufstelle sichtbar und bedienbar (E-112 Satz 1).
- **A-25.3** Eine Fläche bekommt nie zwei Bildlaufleisten auf derselben Achse; zwei Laufbereiche
  nur nebeneinander (E-112 Satz 2).
- **A-25.4** Der feste Teil einer Ansicht paßt in das kleinste getragene Fenster. Tut er es
  nicht, ist er kein fester Teil (E-115).
- **A-25.5** Eine Bestätigungsfläche hängt am Fenster, nie an dem, was sie bestätigt (E-116).
- **A-25.6** Ausgenommen: Startbilder, Musterseite und der Outlook-Aufgabenbereich (E-112).

Danach heißt jeder Befund unten A-25.x statt „A-13.8 sinngemäß", und die offene Frage 4 aus
T-323 (gilt es für den Aufgabenbereich?) ist beantwortet, statt zweimal gestellt.

---

## 2. Die Freigabe, um die T-339 bittet — der umbrochene Kopf

### B-05 · **freigegeben, mit Einschränkung** · S-04 Kanban · A-13.1, A-13.2, Abschnitt 15

**Die Sache selbst: freigegeben.** Ein Kopf, der Titel und Aktionsgruppe in zwei Zeilen legt,
ist keine visuelle Unordnung im Sinne von A-13.2 und kein Verlust an Erfaßbarkeit nach A-13.1.
Die Lesereihenfolge bleibt (Titel, dann Aktionen), kein Element wandert über ein anderes
(AK-05), und die Kopfhöhe ist nach der Meßtabelle in T-323 7.4 in **beiden** Gestalten 129,8 px
— die Gestaltänderung kostet also keine Höhe. Verglichen mit dem Zustand davor ist sie in jedem
Punkt besser: 536,8 px Kopf, vom Titel „Kanban" blieb das „K", ein Wort je Zeile über zwanzig
Zeilen, und „Spalten verwalten" war an der **getragenen Mindestbreite** abgeschnitten. Der alte
Zustand verletzte A-13.1, A-13.2 und Abschnitt 15 zugleich; der neue verletzt keines davon.

**Geprüft und unbedenklich, weil es die naheliegende Gegenfrage ist:** Die Zahl `10rem` und die
20,7 px Luft sind in **einer** Gestaltung und **einer** Zeilendichte gemessen — das trägt hier
trotzdem, weil weder die Paletten noch die Dichte die Maße des Kopfes ändern.
`packages/ui-tokens/tokens.css:428-431` setzt in „kompakt" ausschließlich `--row-height` und
`--row-padding-x`; `theme-palettes.css` setzt Farben. `--control-height-lg` und die Schriftskala
sind in allen neunzehn Gestaltungen und beiden Dichten dieselben. A-21.4 ist damit nicht
berührt.

**Die Einschränkung, und sie ist der eigentliche Befund.** Der Satz in T-323 7.4 — *„Über die
ganze getragene Breite von 960 bis ≈ 1259 px steht die Aktionsgruppe unter dem Titel"* — ist aus
**einer** Ansicht gerechnet und liest sich als Aussage über alle elf. Der Quelltext sagt es
selbst, `apps/web/src/styles/app.css:959-963`:

> „Damit bleibt **jede** Ansicht bei 1280px und darüber auf einer Zeile und zeichengleich —
> nachgemessen an allen elf Ansichten; das Kanban hat dabei 20,7px Luft, jede andere Ansicht
> mehr."

Nachgerechnet aus den Zahlen im Bestand (`--sidebar-width: 15rem`, `tokens.css:415`;
`--screen-inset: var(--space-6)`; Rinne 10 px): bei 960 px Fenster bleiben 662 px Inhaltsbreite
im Kopf. Umbrochen wird ab `160 + 16 + Aktionsgruppe > 662`, also ab einer Aktionsgruppe von
**mehr als ≈ 486 px**. Das Kanban hat 785,3 px. Jede andere Ansicht hat zwei bis drei Knöpfe und
liegt deutlich darunter. **Der umbrochene Kopf ist die Regelgestalt einer von elf Ansichten im
getragenen Bereich, nicht die halbe getragene Breite aller.**

Das ändert die Freigabe nicht, aber es ändert, wofür sie gilt — und ein Papier, das eine
Gestaltänderung allgemeiner beschreibt, als sie ist, erteilt beim nächsten Lesen eine Freigabe,
die niemand gegeben hat.

**Und der Befund, der dahinter offenbleibt — A-13.2, wörtlich.** Die Aktionsgruppe ist 785,3 px
breit, weil der Ansichtsumschalter seinen Erklärsatz **im Bildschirmkopf** trägt. Erklärender
Fließtext in der Steuerzeile ist „visuelle Unordnung" im Wortsinn von A-13.2, und daran hängen
alle drei unangenehmen Zahlen zugleich: die Schwelle ≈ 1259 px, die 1,6 % Luft am
Standardfenster und die 537 px fester Teil an der getragenen Untergrenze (E-115). T-323 nennt
das als offene Frage 5, T-322 als R-h, E-115 als „dieselbe Fehlerfamilie".

**Vorschlag.** (a) 7.4 auf das Kanban einschränken, mit der Rechnung „Umbruch ab ≈ 486 px
Aktionsgruppe" statt der Fensterbreite — dann steht dort eine Regel statt einer Ansicht.
(b) Offene Frage 5 als eigener Auftrag in die nächste Welle, **vor** der nächsten Erweiterung
irgendeines Bildschirmkopfs. `flex-basis: 10rem` behandelt ein Symptom gut; die 1,6 % sind keine
Grenze, auf die man einen Bestand stellt.

---

## 3. Die Papiere gegeneinander

### B-02 · blockierend · S-09 Einstellungen · A-13.8/A-13.9 (ersatzweise A-25.1), E-115

**Abweichung.** Die beiden berichtigten Papiere sagen über **denselben gemessenen Fall** das
Gegenteil:

- **T-323 9.6 Punkt 2:** „Gemessen bei 1024 × 640: `div.settings-layout` ragt **86 px** über den
  Rahmen, und **das ist richtig**." Der Fall wird zur *benannten Ausnahme* von A8 gemacht, und
  9.2 nimmt 1024 × 640 eigens als Meßgröße auf, „damit die Ausnahme nicht toter Text ist".
- **T-340 R-3a** und **E-115:** 1024 × 640 ist ein **getragenes** Fenster, dort steht keine
  Meldung, also ist der Überlauf ein **Fehler** — die Bereichsschiene ist mit 577 px zu hoch
  gegen ~535 erlaubte.

Wird A8 nach T-323 gebaut, ist der **einzige heute bekannte Verstoß gegen E-115** auf Dauer
grün, und zwar an genau der Größe, an der er auftritt. Das ist der Fehlermodus, vor dem T-323
9.6 in seinem eigenen Absatz warnt: „eine gelockerte Zusicherung ist schlechter als eine, die
von Anfang an ihre Ausnahme benennt." Hier ist die Ausnahme **vor** der Behebung geschrieben und
deckt sie zu.

**Vorschlag.** A8 nimmt `.screen__body--frame` nur **unterhalb** von 960 × 640 aus. Bei
1024 × 640 bleibt der Fall rot und trägt die Kennung des Befundes (Bereichsschiene, OF-6), bis
T-339 entschieden hat, wie sie bei knapper Höhe nachgibt. Eine Ausnahme, die einen offenen
Befund verdeckt, ist keine Ausnahme, sondern seine Beerdigung.

### B-03 · blockierend · alle elf · A-13.8/A-13.9 (ersatzweise A-25.1), E-115

**Abweichung — „getragen" heißt in den beiden Papieren Verschiedenes, und der gebaute Meßsatz
folgt der weiteren Fassung.** T-323 7.1 führt **zwei** getragene Bereiche: „Getragen, ohne
Abstriche: ab 960 × 640" **und** „Getragen im Browserbetrieb: bis 640 × 480 … Der Mechanismus
gilt hier unverändert." T-323 9.1 A2 sagt „Gilt nur im getragenen Bereich (7.1)" — ohne zu
sagen, welche der beiden Zeilen gemeint ist.

`tests/e2e/viewport-fit.spec.ts:34-45` liest genau das und zieht den Schluß wörtlich:

> „…liegen im ‚getragenen Bereich' (Abschnitt 7.1 — ‚Getragen, ohne Abstriche' ab 960×640,
> ‚Getragen im Browserbetrieb' bis 640×480); A2 gilt deshalb bei allen fünf [Größen]."

T-340 AK-02 und E-115 definieren getragen **ausschließlich** als ≥ 960 × 640 ohne Hüllenmeldung.
An dieser einen Wortwahl hängen die zehn gemessenen Verstöße aus T-330: nach T-323 sind alle
zehn rot, nach T-340 sind sieben davon der erwartete Rückfall. Zwei Papiere, ein Meßsatz, zwei
Wahrheiten — und der Meßsatz im Baum trägt die Fassung, die E-115 verworfen hat.

**Vorschlag.** Die zweite Zeile in T-323 7.1 umbenennen: **„bedienbar im Browserbetrieb"**, nicht
„getragen". A2 in 9.1 zeichengleich an AK-02 festnageln („mindestens 960 × 640, ohne
Hüllenmeldung und ohne Fassungshinweis"). Ein Wort, das in zwei Papieren zwei Bedeutungen hat,
ist teurer als eine falsche Zahl — eine Zahl widerlegt der Bau, ein Wort nicht.

### B-04 · blockierend · Meßsatz · E-099 Punkt 3, E-111

**Abweichung.** Die zentralen Zusicherungen, auf die sich **beide** berichtigten Papiere
berufen, stehen in keiner Datei unter `tests/e2e/`:

| Zusicherung | Im Papier | Im Baum |
|---|---|---|
| **A8** samt 9.6 (je direktem Kind eines Laufbereichs) | T-323 9.1, ausführlich in 9.6, „44 von 44" | **fehlt vollständig** |
| Die **zwei Untergrenzen** aus 9.6 (mindestens ein Laufbereich gefunden, mindestens einer läuft) | T-323 9.6 | **fehlt** |
| **A7 zweite Hälfte** — Kopfkante gleich Inhaltskante, „die Zahl, die 44 von 44 Fällen auf 0 gebracht hat" | T-323 9.1 A7, „seit T-334" | `viewport-fit.spec.ts:542` mißt nur die Breitenhälfte; `.screen__header` kommt allein in A4 vor (`:484`) |
| **1200 × 820** und **1024 × 640** | T-323 9.2, „Neu, T-339" | `viewport-fit.spec.ts:249 ff.` kennt fünf Größen |
| **AK-23**, das Höhenbudget des festen Teils | T-322, E-115 | kein Meßsatz, keine Zusicherung |

T-323 9.4 behauptet dazu im **Präsens**: „Dieser Abschnitt stand als *Anleitung*. Er ist jetzt
zusätzlich **zugesichert** — die zweite Untergrenze aus 9.6 macht den Lauf rot, wenn in einer
Ansicht kein Laufbereich wirklich läuft." Gegen den Arbeitsbaum ist das falsch. Damit ruhen die
sieben abgeschnittenen Kinder aus 9.6 (27 bis 1030 px, darunter der Base64-Satz aus B-6.1) und
die 44 Kantenfälle auf **einer einmaligen Handmessung von T-334** — und E-115 nennt die
Filterleisten von Todos, Buchungen und Protokoll ausdrücklich als dieselbe Fehlerfamilie, „nur
noch nicht dorthin gezogen". Das ist E-099 Punkt 3 in eigener Sache: Wer eine Abwesenheit
zusichert, spannt seine Menge an der Anforderung auf — hier ist die Menge noch gar nicht
aufgespannt.

**Vorschlag.** Zwei Wege, und nur einer reicht nicht. (a) Das Präsens in 9.4 zurück in eine
Vorschrift, bis es wahr ist. (b) Ein Auftrag an den e2e-tester in der nächsten Welle: A7b, A8
samt beiden Untergrenzen, die zwei neuen Größen und der Geltungsbereich aus B-03. Ohne (b) ist
der Umbau nicht meßbar freigegeben, sondern papiergeprüft — und genau das hat E-113 einmal 128
Verstöße gekostet.

### B-09 · S-09/S-05/S-04 · A-13.1, AK-10 · nicht blockierend

**Abweichung — T-323 widerspricht sich zwischen 5.2 und 7.2, und die Folge ist sichtbar.** 5.2
nimmt `.app__main` von `scrollbar-gutter: stable` aus mit der Begründung: „Es ist **nicht mehr
der Läufer**; seine Rinne wäre leerer Rand." 7.2 desselben Papiers sagt das Gegenteil:
`overflow-y: auto` bleibt, und **im Rückfall ist `.app__main` der Läufer** (so auch gebaut,
`app.css:377`).

R-3a Punkt 2 erlaubt den Rückfall ausdrücklich **im getragenen Fenster**, sobald eine
Hüllenmeldung oder der Fassungshinweis Höhe nimmt. In diesem Augenblick erscheint am Rahmen eine
Bildlaufleiste ohne reservierte Rinne, und die ganze Inhaltsspalte wird um ihre Breite schmaler
— Ursache 2 aus T-057, ausgelöst durch ein Ereignis, das der Benutzer sieht, und über alle elf
Ansichten zugleich. **AK-10** („Die Breite des Inhalts ändert sich **nicht**, wenn eine
Bildlaufleiste erscheint oder verschwindet") hat keine Geltungsgrenze und ist dort verletzt.

**Vorschlag.** Entweder AK-10 ausdrücklich auf „ohne Rückfall" einschränken und den Sprung in
5.2 als Preis benennen — so, wie 5.1 ihre 10 px benennt —, oder die Rinne am Rahmen wieder
reservieren und die dauerhaft leeren 10 px gegen den Sprung abwägen. Was nicht bleiben kann, ist
die Begründung in 5.2, die 7.2 widerlegt.

### B-10 · Mechanismus · nicht blockierend

**Abweichung — die zehnte Stelle, die T-339 nicht berichtigt hat.** T-323 3.2 führt

```css
.screen > .screen__body,
.screen__body--frame > * { flex: 1 1 auto; min-block-size: 0; }
```

Gebaut ist `min-block-size: 0` **nur** für `--frame > *`. `viewport-layout.css:343-349` begründet
ausführlich, warum die Zeile an `.screen > .screen__body` **fehlen muß**: `0` überschriebe wegen
der höheren Spezifität den Boden von 4 rem, der Laufbereich fiele im niedrigen Fenster auf null,
der Inhalt läge in einem nullhohen Bildlaufkasten — und der Rückfall aus R-3, AK-18 und E-112
Punkt 3 wäre weg. Die Berichtigungstabelle im Kopf von T-323 nennt neun Stellen; diese ist die
zehnte. Wer das Muster nach dem Papier auf eine zwölfte Ansicht zieht, baut den Rückfall aus.

**Vorschlag.** 3.2 berichtigen, in derselben Form wie die anderen neun, mit dem Grund aus der
gebauten Datei.

### B-12 · S-03 Todo-Detail · Abschnitt 15, AK-15 · nicht blockierend

**Abweichung.** T-323 8.5 nimmt den Lade- und Fehlerzustand der Todo-Detailansicht ausdrücklich
aus: „dort steht `tabIndex={-1}` ohne Rolle und ohne Namen". So ist es gebaut
(`TodoDetailScreen.tsx:248`, `ScreenBody.tsx:96-110`). T-322 **AK-15** sagt ohne Ausnahme: „Jeder
Laufbereich hat einen zugänglichen Namen aus Abschnitt 4 und einen sichtbaren Fokusring." T-322
4.3 nennt die Besonderheit, zieht aber die Ausnahme nicht. Zwei berichtigte Papiere, zwei
Antworten auf dieselbe Fläche.

Sachlich trägt die Ausnahme: Die Überschrift **ist** das Todo und steht im Ladezustand noch nicht
fest, die Sprungmarke bleibt am Bereich, Bild-ab bleibt bedienbar.

**Vorschlag.** AK-15 bekommt denselben Satz wie 8.5. Oder — der bessere Weg — der vorhandene
Text der Ladehülle wird der Name: `AsyncBoundary label="Todo wird geladen"`
(`TodoDetailScreen.tsx:245`) steht bereits in der Ansicht, ist kein neuer Oberflächentext und
macht die Ausnahme überflüssig. Entscheidung gehört ux-designer, nicht mir.

---

## 4. Zustandsabdeckung — Abschnitt 15

Abschnitt 15 verlangt ausdrücklich Leer-, Lade-, Hover-, aktive und Fehlerzustände sowie
Bestätigungsdialoge. Gelesen über alle elf Ansichten plus die drei Zustände ohne Ansicht (T-322
4.0). **Hover und aktive Zustände: unverändert, kein Befund** (der Fokusring ist ausgenommen,
T-341). **Bestätigungen: strukturell am Dokumentkörper, E-116, R-6, AK-25 — trägt.** Zwei
Befunde bleiben.

### B-08 · blockierend? **nein, aber knapp** · S-06, S-04, S-05, S-03 · Abschnitt 15, A-13.7, AK-09

**Abweichung.** In sieben Ansichten ist der Laufbereich **dasselbe Element** über alle Zustände
hinweg — der `ScreenBody` umschließt die Ladehülle (Dashboard `:183`, Todos `:445`, Export
`:626`, Vorlagen `:522`, Protokoll `:183`, Tags `:38`, Einstellungen `RunArea :222`). In **vier**
Ansichten wird er bei jedem Zustandswechsel **neu gebaut**:

| Ansicht | Z0/Z4 (Laden, Fehler) | Z1/Z2 (gefüllt) | Z3 (leer) |
|---|---|---|---|
| Buchungen | `<ScreenBody label="Buchungen">` (`:391`) | `<BookingTable className="screen__body">` (`:469`) | `<ScreenBody>` (`:406`) |
| Kanban | `<ScreenBody label="Kanban">` (`:410`) | `<ScreenFrame label="Kanban">` (`:452`) | `<ScreenBody>` (`:421`) |
| Zeiterfassung | `<ScreenBody label="Zeiterfassung">` (`:160`) | `<ScreenFrame …--split>` (`:171`) | — |
| Todo-Detail | `<ScreenBody>` ohne Namen (`:248`) | `<ScreenBody label={Titel}>` (`:305`) | — |

Weil `id="inhalt"` seit T-326 **am Laufbereich** hängt und nicht mehr an `.app__main`, wandert
die Sprungmarke bei jedem dieser Wechsel auf ein anderes DOM-Element. Folge, am Quelltext
gelesen und im Browser zu bestätigen: Wer während des Ladens „Zum Inhalt springen" benutzt,
verliert den Fokus an `<body>`, sobald die Daten ankommen. Dasselbe in den Buchungen beim
Wechsel Z2 → Z3 — und **den löst der Benutzer über den Filter aus**, also genau dann, wenn er
hinsieht (A-13.7). Vor T-326 konnte das nicht passieren: `.app__main` überlebte jeden
Zustandswechsel.

Gefangen wird es von nichts: AK-09 mißt die Bildlaufstelle, nicht den Fokus; AK-19 spricht nur
vom Rückfall; T-322 Abschnitt 7 führt den Fall nicht.

**Vorschlag.** Den Laufbereich über die Zustände hinweg als **dasselbe** Element halten — eine
`ScreenBody`/`ScreenFrame` außen, die Zustände darin —, so wie die sieben übrigen Ansichten es
bereits tun. Das macht die Mehrheit zur Regel statt zur Ausnahme und kostet in drei der vier
Fälle eine Verschachtelung. Ersatzweise: AK-09 um den Fokus erweitern und den Fall messen.

### B-11 · S-08 Tags (und zu prüfen: S-07 Protokoll) · Abschnitt 15, AK-07, R-5 · nicht blockierend

**Abweichung.** T-322 R-5 führt „Noch kein Tag" (S-08) als **Bildschirm**leerzustand, „der den
ganzen laufenden Inhalt ersetzt", und AK-07 verlangt für diese Klasse die Mitte des
Laufbereichs. Gebaut wird die Zentrierung über `margin-block: auto` an **direkten** Kindern
(`viewport-layout.css:392-396`: `> .empty`, `> .table-shell`, `> .board-setup`). In `TagsScreen`
(`:38-52`) liegt unter dem Laufbereich immer `.tags-layout` mit zwei Karten; der Leerzustand
entsteht innerhalb von `TagAdministration`, also in einer Karte, und ist damit ein
**Karten**leerzustand. `margin-block: auto` greift dort nicht.

Entweder ist die Einordnung in R-5 falsch — dann gehört „Noch kein Tag" in die zweite Liste —,
oder AK-07 ist für S-08 nicht erfüllt. Beides ist vertretbar; unentschieden ist es nicht.
Dieselbe Frage stellt sich für „Noch kein Vorgang protokolliert" (S-07 Protokoll) und ist im
selben Zug zu messen.

**Vorschlag.** Am Bild nachmessen (eine Ansicht, ein Zustand), dann **eine** der beiden Stellen
berichtigen. Das ist Gestaltung und gehört ui-designer beziehungsweise ux-designer, nicht
frontend-dev.

---

## 5. Zugängliche Namen und Tastaturwege

### B-07 · blockierend · S-09, S-05, S-04 · Abschnitt 14/15, AK-14, SC 2.1.1

**Abweichung.** `ScreenFrame` setzt `tabIndex={0}`, `role="region"` **und die Sprungmarke** auf
`.screen__body--frame` (`ScreenBody.tsx:159-168`, `runAreaSurface(label, true)`). Dieser Kasten
**läuft im getragenen Fenster ausdrücklich nicht** — das ist sein Zweck (T-323 3.1,
`viewport-layout.css:412-455`: „Er rahmt und läuft im getragenen Fensterbereich nicht").

Folge in den drei Rahmenansichten, am Quelltext gelesen: Nach „Zum Inhalt springen" liegt der
Fokus auf einem Kasten, der nichts zu rollen hat, und der nächste Bildlaufvorfahr (`.app__main`)
hat ebenfalls nichts zu rollen. **Bild-ab tut nichts** — genau der Zustand, den T-323 8.5
verhindern wollte („Das ist eine Verschlechterung gegenüber heute und nicht hinnehmbar, SC
2.1.1"), nur eine Ebene tiefer. Vor T-326 lief `.app__main` in den Einstellungen und in der
Zeiterfassung, und Bild-ab nach der Sprungmarke funktionierte. Das ist eine **Regression** und
nicht bloß eine Abweichung.

Dazu zwei Folgen an der Tabulatorreihenfolge:

- **AK-14** verlangt „mit genau einem weiteren Tabulatorschritt erreichbar". In den Einstellungen
  liegen zwischen dem Rahmenhalt und dem wirklichen Laufbereich die **acht** Verweise der
  Bereichsschiene (`SettingsScreen.tsx:197-231`). Neun Schritte, nicht einer.
- **R-i** nimmt „bei zwei Bereichen zwei Schritte mehr" in Kauf. Die Zeiterfassung hat **drei**
  Halte (`ScreenFrame "Zeiterfassung"` plus `RunArea "Todo wählen"` plus `RunArea "Buchungen von
  heute"`, `TimeScreen.tsx:171/203/372`), und einer davon rollt oberhalb von 68 rem nichts.

T-322 Abschnitt 7 führt den Rahmen überhaupt nicht als Tabulatorhalt — die Reihenfolge dort
endet bei „Laufbereich → Inhalt des Laufbereichs".

**Vorschlag.** Die Sprungmarke gehört in den Rahmenansichten auf den **ersten Kasten, der
wirklich läuft**: `.settings-panel`, Laufbereich A der Zeiterfassung, `.board`
beziehungsweise die erste `.kcolumn__body`. Der Rahmen behält Namen, Rolle und Halt nur dort, wo
er im Rückfall tatsächlich zum Läufer wird (`--split`, `viewport-layout.css:524-530`). Die
Entscheidung berührt beide Papiere (T-322 R-4/Abschnitt 7 und T-323 8.5) und gehört deshalb in
**einen** Auftrag an ux-designer und ui-designer, nicht in zwei.

### B-06 · S-04 Kanban, S-07 Export · AK-15, R-4, SC 2.1.1 · nicht blockierend

**Abweichung.** R-4 und AK-15 sagen „**jeder** Laufbereich ist fokussierbar, liegt genau einmal
in der Tabulatorreihenfolge und trägt einen zugänglichen Namen". Der **waagerechte** Laufbereich
des Kanban — `<div className="board">`, `BoardScreen.tsx:453` — trägt weder Namen noch Halt noch
Fokusring. Dasselbe für die waagerechten `.table-wrap` in `ExportGroups.tsx:168` und `:243`.
Genannt sind in T-322 Abschnitt 4 nur die senkrechten Bereiche.

Sachlich ist das vertretbar: Der Lauf des Boards ist über den Fokus der Spalten erreichbar
(`.kcolumn__body` bringt Namen und Halt mit, `viewport-layout.css:653-654`), und ein
Bildlaufkasten mit fokussierbaren Kindern gilt als tastaturbedienbar. Nur steht das so in keinem
der beiden Papiere, und kein Akzeptanzsatz mißt es — A3 zählt ausschließlich `.screen__body`.

**Vorschlag.** R-4 und AK-15 auf **senkrechte** Laufbereiche einschränken und für den
waagerechten die Auflage aus T-322 5.3 wörtlich übernehmen („erreichbar über den Fokus der
Kinder, und in keiner Achse, in der Inhalt liegt, ist der Lauf abgeschaltet"). Eines von beidem,
nicht keines — sonst ist AK-15 eine Zusage, die der Bestand seit T-326 nicht einlöst.

### B-13 · S-09 Einstellungen · A-14, A-13.1 · nicht blockierend

**Die Frage aus dem Auftrag: Wird aus den neuen Namen eine Vieldeutigkeit für Bildschirmleser?
Nein. Für die Prüfabfragen: ja, und die Auflage aus T-340 4.11 trägt nicht weit genug.**

Für die **Vorlesehilfe** ist die Lage sauber: „Export" steht in der Einstellungsansicht als
Verweis in der Hauptnavigation (`Navigation.tsx:45`, `<nav aria-label="Hauptnavigation">:63`),
als Verweis in der Bereichsschiene (`SettingsScreen.tsx:197`, `<nav aria-label="Bereiche der
Einstellungen">`), als Gebiet (`RunArea label={panelLabel(active)}`, `:222`) und als
Kartenüberschrift. Verschiedene Rollen, benannte Landmarken, `aria-current="page"` am gewählten
Eintrag — unterscheidbar. Die Doppelung „Einstellungen im Gebiet Einstellungen" ist mit der
Streichung von `PANEL_LABEL` tatsächlich weg; das ist eine Verbesserung und keine Regression.

**Die Auflage ist trotzdem zu schwach.** T-340 4.11 schreibt: „Jede Abfrage auf diese Namen
schränkt die Rolle ein — `getByRole("region", { name: "Timer" })`, nie `getByText("Timer")`."
Das genügt für `region` und `heading`. Für `link` genügt es **nicht**: „Export" ist in dieser
Ansicht **zweimal ein Verweis** — Hauptnavigation und Bereichsschiene. `getByRole("link", { name:
"Export" })` ist im strikten Modus zweideutig, und zwar in jeder Ansicht, nicht nur in den
Einstellungen. (Die Zweideutigkeit ist älter als dieser Umbau; neu ist die Auflage, die sie
nicht abdeckt.)

Geprüft und bestätigt: **kein** Prüffall in `tests/**` fragt heute ein Gebiet nach Namen ab
(Suche über `getByRole("region"` und die acht Namen — keine Fundstelle). Die Auflage gilt also
wirklich erst für den nächsten, der einen schreibt, und genau deshalb muß sie stimmen.

**Vorschlag.** Einen Satz in 4.11 ergänzen: **Rolle und Landmarke einschränken.**
`page.getByRole("navigation", { name: "Bereiche der Einstellungen" }).getByRole("link", { name:
"Export" })`. Und: R-g in T-322 13 nennt diese Klasse bereits („dieselbe Klasse wie T-315/T-316")
— der Satz gehört dorthin, nicht nur in eine Ansichtsbeschreibung.

---

## 6. Deutsche Begriffe und Oberflächentexte

**Geprüft, kein blockierender Befund.** Die neuen Bezeichner sind englisch und im Code —
`ScreenBody`, `ScreenFrame`, `RunArea`, `runAreaSurface`, `.screen__body`, `.runarea`,
`CONTENT_ANCHOR_ID`. Das ist die Hausregel und richtig so. Die zugänglichen Namen sind
ausnahmslos vorhandene deutsche Texte: die Ansichtsüberschriften, die Kartenüberschriften „Todo
wählen" und „Buchungen von heute", die acht Einträge der Bereichsschiene, „Diese Ansicht gibt es
nicht" und „Die Ansicht konnte nicht geladen werden" (`App.tsx:434`, `:462`). Kein erfundenes
Wort, keine englische Beschriftung, kein Denglisch.

Zwei Anmerkungen, beide klein:

- **B-14 · A-21.3, E-087 · nicht blockierend.** Mit der Streichung von `PANEL_LABEL` (T-334) hat
  sich der **zugängliche Name** zweier Laufbereiche geändert: von „Einstellungen" auf
  „Outlook-Add-in" und „Arbeitsplatz". E-087 verlangt, daß der heutige Wortlaut **vor** dem
  Auftrag gesucht wird und „das Ergebnis im Auftrag steht". Gesucht hat T-334 — also der bauende
  Auftrag, nach der Entscheidung. Das Ergebnis war null, der Schaden also keiner, aber die
  Reihenfolge stimmt nicht, und E-114 hat am selben Tag gezeigt, wie teuer die falsche
  Reihenfolge bei einer Kennung wird. AK-22 („Kein Oberflächentext ist neu, geändert oder
  gestrichen") ist dem Buchstaben nach für den **sichtbaren** Text wahr und für den
  **zugänglichen** Namen nicht; der Satz sollte das sagen, statt es offenzulassen.
- **T-337s Messung (233 entfernte Zeichenketten, 13 Reste als CSS-Prosa) habe ich nicht
  nachgemessen** — sie verlangt einen Lauf, und in dieser Umgebung steht keiner zur Verfügung.
  Ich habe statt dessen die Gegenrichtung geprüft: ob ein **neuer** Oberflächentext entstanden
  ist. Ergebnis: keiner.

### B-15 · `apps/web/src/styles/viewport-layout.css:259-262` · nicht blockierend

**Abweichung.** Der Quelltext trägt eine getroffene Entscheidung als offene Frage:

> `GEMESSENE ABWEICHUNG von T-323 Abschnitt 8.4 und E-112 — bitte entscheiden`

Entschieden ist sie seit dem 2026-09-13 als **E-113**, und beide Papiere sind nachgezogen. Ein
Kommentar, der um eine bereits getroffene Entscheidung bittet, lädt die nächste Welle ein, sie
ein zweites Mal zu treffen — und der Nächste hat die Messung nicht.

**Vorschlag.** Kopf des Blocks auf E-113 umschreiben, die Meßtabelle unverändert lassen: Sie ist
der Grund, aus dem die Entscheidung hält. Die Datei gehört frontend-dev und liegt gerade unter
T-341 — in dieselbe Welle hängen, nicht daneben.

---

## Zusammenfassung der Befunde

| ID | Blockierend | Ort | Anforderung |
|---|---|---|---|
| **B-01** | **ja** | alle elf / `docs/spec.md` | keine Deckung durch eine Anforderungs-ID |
| **B-02** | **ja** | S-09 / T-323 9.6, 9.2 gegen T-340 R-3a, E-115 | A-13.8/A-13.9 (ersatzweise A-25.1) |
| **B-03** | **ja** | alle elf / T-323 7.1, 9.1 gegen AK-02, E-115 | A-13.8/A-13.9 (ersatzweise A-25.1) |
| **B-04** | **ja** | `tests/e2e/viewport-fit.spec.ts` | E-099 Punkt 3, E-111 |
| **B-05** | freigegeben, Einschränkung | S-04 / T-323 7.4 | A-13.1, A-13.2, Abschnitt 15 |
| **B-06** | nein | S-04, S-07 | AK-15, R-4, SC 2.1.1 |
| **B-07** | **ja** | S-09, S-05, S-04 | AK-14, SC 2.1.1, Abschnitt 15 |
| **B-08** | nein (knapp) | S-06, S-04, S-05, S-03 | Abschnitt 15, A-13.7, AK-09 |
| **B-09** | nein | alle elf / T-323 5.2 gegen 7.2 | AK-10, A-13.1 |
| **B-10** | nein | T-323 3.2 | E-112 Punkt 3, AK-18 |
| **B-11** | nein | S-08, S-07 | Abschnitt 15, AK-07, R-5 |
| **B-12** | nein | S-03 / AK-15 gegen T-323 8.5 | Abschnitt 15 |
| **B-13** | nein | S-09 / T-340 4.11 | A-14, A-13.1 |
| **B-14** | nein | S-09 | E-087, A-21.3, AK-22 |
| **B-15** | nein | `viewport-layout.css:259` | E-113 |

## Was gut ist und ausdrücklich bleiben soll

Damit die Liste oben nicht das ganze Bild ist:

- **Die Berichtigungsform der beiden Papiere.** Die widerlegte Fassung bleibt stehen, daneben
  die Zahl, die sie widerlegt hat. Das ist die beste Dokumentationsform, die dieser Bestand
  hervorgebracht hat, und sie hat in diesem Abgleich mehr gefunden als jede Messung: B-02 und
  B-03 sind nur sichtbar, **weil** die alten Sätze noch dastehen.
- **Der selbsttätige Rückfall ohne Schwellenzahl** (T-323 7.2). Er erfüllt R-3 genauer, als eine
  gemessene Grenze es könnte, und er kommt ohne Umschaltpunkt aus — damit ist AK-19 durch die
  Bauform erfüllt statt durch Disziplin.
- **`margin-block: auto` statt `justify-content: center`** (T-326, AK-05). Der Unterschied ist
  fein und die Begründung — die Karte „Vorlage und Rundung" wäre mitgewandert — ist genau die Art
  Detail, an der man merkt, ob jemand hingesehen hat.
- **E-116 strukturell über ein Portal** statt über `position: fixed`. Eine Zusage, die man nicht
  je Gestaltung nachprüfen muß, ist neunzehnmal weniger wert an Prüfaufwand und einmal mehr wert
  an Wahrheit.
