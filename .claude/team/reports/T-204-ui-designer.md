# T-204 — ui-designer (Welle AE)

**Vorlage:** O-HZ (Z-53a, blockierend, aus T-200), A-A-45 (T-189-7), dazu die Kenntnisnahme zu
T-202. **Kein Produktivcode angefaßt.** Zwei Artefakte fortgeschrieben, beide in eigener Hoheit.

---

## 1. O-HZ — der `MessageSlot`

**Entscheidung: ja, ein gemeinsamer dauerhafter Wirt.** Sie steht als Abschnitt 9 in
`docs/design/textabbau-gestalt.md` — dort, weil Abschnitt 4.1 desselben Papiers die Bauform **B2
(reserviertes Fach)** eingeführt und ihr die schwächste Begründung mitgegeben hat. Was fehlte, war
die Gestalt von B2. Das ist die Fortschreibung, kein neues Papier.

### 1.1 Die vier Antworten, die der Auftrag verlangt hat

| Frage | Antwort |
|---|---|
| **Wo sitzt der Wirt?** | **W-1: genau dort, wo die Meldung heute steht.** Er ist ein Rahmen um eine bestehende Stelle, kein neuer Ort. Drei Plätze: **P1** das Fach, in dem die Meldung heute schon steht; **P2** über der Verzweigung, nicht in einem ihrer Zweige; **P3** eine eigene Zeile der Hülle (nur die Sitzungsleiste) |
| **Höhe im leeren Zustand** | **Null. Immer null. Nie reservierter Platz.** Ein reserviertes Fach *ist* das Loch — es lehrt in zwei Tagen, daß dort nichts steht, und wird danach übersehen, wenn doch etwas darin steht. Die Klasse `.live-region` hat bis heute **keine einzige eigene CSS-Regel**, und das bleibt so: Sie ist ein Merkzeichen für den Wächter, kein Aussehen |
| **Was darf nicht springen?** | **W-4:** das gerade betätigte Bedienelement nicht unter dem Zeiger weg, und keine **andere** Schaltfläche an seine Stelle. **W-5:** nie oberhalb des bedienten Elements (U-2). **W-6:** keine Bewegung, keine Einblendung (U-3) |
| **Reihenfolge und Bündel** | sechs Bündel, **nach Fläche geschnitten, nie nach Anzahl** — Einzelheiten in 1.4 |

### 1.2 Das Loch entsteht nicht am Wirt, sondern am Abstand seines Behälters

Drei Mechanismen, drei Antworten — und die dritte ist neu und eine Falle:

| Behälter | Antwort im Leerzustand |
|---|---|
| Fluß oder Flex mit `gap` | negativer Rand am `:empty`-Wirt, wie `.attachment__main` und `.tag-picker` seit T-191 |
| Geschwisterregel `X + Y` (`.card__body`) | `.live-region` steht seit T-191 in der **linken** `:where`-Liste — **nichts zu tun** |
| **Raster mit `gap`** | **Der negative Rand wirkt hier nicht.** `gap` liegt zwischen den Spuren und nicht am Element; die leere Zeile wird null hoch, die Lücke bleibt. Antwort: Der Wirt steht **nicht im Raster** (bei `.tags-split` löst P2 es ohnehin mit), oder das Raster hat gar kein `gap` (so `.app`) |

Die dritte Zeile ist **gerechnet, nicht am Bildschirm gemessen** (B-10).

### 1.3 Der Formulardialog — mit T-202 gelesen

T-202 hat gemessen, was der Auftrag verlangt hat aufzunehmen: In einem Rumpf, der scrollt, kann eine
Fläche **vollständig außerhalb des Sichtbereichs** liegen, während der Benutzer auf den Knopf
drückt, der sie erzeugt (`Titelblock: -31.2..24.6 → GANZ OBERHALB des Ausschnitts`).

Daraus die zwei Sätze, die in die Übergabe gehören:

1. **Der Wirt macht die Meldung hörbar, nicht sichtbar.** `errorRef` und
   `scrollIntoView({ block: "nearest" })` **bleiben**. Zwei Zusagen an zwei verschiedene Benutzer,
   keine ersetzt die andere. Wer beim Umbau den Effekt für überflüssig hält, nimmt den Fund aus
   T-072 zurück. Der Ref hängt danach am dauerhaften Knoten und ist nie mehr `null` — der Effekt
   wird zuverlässiger, nicht überflüssig.
2. **Der Wirt kostet dort keinen Knoten.** `FormDialog.tsx:255-261` hat den Behälter bereits:
   `{error === null ? null : (<div ref={errorRef}> … )}`. Die Bedingung wandert nach innen, aus dem
   namenlosen `div` wird der Wirt. Ein Wirt, sechzehn Formulardialoge, vier Pflichtklickpfade,
   **null zusätzliche Knoten** — das ist zugleich die Antwort auf R-2 aus T-191 an der Stelle, an
   der sie am meisten wiegt.

Sprungverhalten, nach U-4 gelesen: Scrollt der Rumpf bereits, verschwindet der Zuwachs im Bildlauf
und **nichts** außerhalb bewegt sich. Scrollt er noch nicht, wächst der Dialog und die senkrechte
Zentrierung verschiebt alles um die **halbe** Zuwachshöhe. Gemessen an W-4 ist das zulässig — unter
der Fußzeile liegt der Dialogrand und keine zweite Schaltfläche. **Vertretbar, benannt, nicht
schön;** ein besseres Höhenmodell ist ein eigener Auftrag mit eigener Messung und ausdrücklich
nicht Teil dieser Sortierung.

### 1.4 Die halb umgesetzte Sortierung — zwei bauliche Vorkehrungen statt Disziplin

**Erstens: die Sortierung wird eine Liste im Lauf, kein Absatz in einem Papier.** Zur ersten Welle
gehört **Regel E** in `proof:surface`: Ein bedingt gerenderter `InlineMessage` mit `tone="danger"`
oder `"warning"`, dessen nächster umschließender Baustein kein `MessageSlot` ist, ist rot — es sei
denn, seine Datei steht in einer benannten **Liste der Sorte 2**, je Eintrag mit einem Satz Grund.
Zwanzig zu zweiundzwanzig kann es dann nicht mehr geben, weil der Rest nicht mehr schweigt.

**Zweitens: ein Bündel ist eine Fläche, nie eine Anzahl.** Eine halb umgebaute *Datei* ist der
Zustand, in dem niemand mehr weiß, was gilt.

| # | Bündel |
|---|---|
| **0** | **Bau + erste Stelle + Regel E, ein Auftrag.** `MessageSlot`, `MessageHostContext`, Rücknahme der Rolle in `InlineMessage`, die `:empty`-Zeile für `.dialog__body--form`, `FormDialog`, Regel E mit zwei Gegenproben. Ein Wirt ohne ersten Benutzer ist ungeprüft; ein erster Benutzer ohne Wirt ist die zweite Fassung. **Damit ist Z-53a erledigt** |
| 1 | `TagsScreen` — die Absage des Ziehens (bringt P2 als Muster mit) |
| 2 | `SettingsScreen` — die drei Stellen, eine Datei, ein Agent |
| 3 | `TodoDetailScreen` — „Der Vermerk wurde nicht gespeichert"; **O-AX nicht mitnehmen** |
| 4 | `UpdateNotice` — die Sitzungsleiste; berührt `.app` und trägt B-9 |
| 5 | `ExportScreen` — die zwei Vorschaufehler |

Nachrangig **mit Grund**, damit es nicht als Lücke gelesen wird: die vier `LoadingBlock` und der
Ladezweig von `AsyncBoundary`, die 30 Vorkommen der Musterseite, alles, was der Toast bereits ansagt.

### 1.5 Wie `InlineMessage` erfährt, daß es schweigen soll

Über einen **Zusammenhang, nicht über eine Eigenschaft am Aufruf**: `MessageSlot` legt
`MessageHostContext` über seinen Teilbaum, `InlineMessage` liest ihn und läßt `role` und `aria-live`
weg. Damit bleiben **alle 76 Aufrufstellen zeichengleich**, und die Live-Region in der Live-Region
ist baulich ausgeschlossen statt eine Frage der Sorgfalt. Die Bauart steht bereits im Bestand:
`FieldMessageQuietContext` (T-202) macht dasselbe für die Feldflächen eines Formulars.

**Die Dringlichkeit gehört dem Platz, nicht der Meldung:** `MessageSlot` bekommt
`urgency: "polite" | "assertive"`. Eine Rolle, die mit dem Inhalt wechselt, wäre wieder eine Rolle,
die kommt und geht — der Fehler, den T-162 behoben hat.

---

## 2. A-A-45 — die Farben ohne Paar, Token für Token

Steht als Abschnitt 9 in `docs/design/traeger-und-zusage.md`, in Fortschreibung und **an einer
Stelle in Berichtigung** von dessen Abschnitt 3.

**Es sind vierzehn, nicht dreizehn.** Ich habe die Liste aus dem heutigen Bestand neu erhoben statt
aus T-189 abgeschrieben. Alle fünfzehn Token werden weiterhin gezeichnet; versorgt ist seit T-202
genau **ein** Token, `--status-reopened-hatch`, und das hat dabei **zwei** Zeilen bekommen
(Deckelpaar mit `over` und benannte Ausnahme). Wer Zeilen zählt, kommt auf zwei; wer Token zählt,
auf eins. Die Liste zählt Token. (`--note-billing-rail-stripe` stand nie auf dieser Liste — es
*hatte* ein Paar, und beide sind mit T-202 zusammen gefallen.)

| Ausgang | Token |
|---|---|
| **echtes Paar mit Mindestwert (4)** | `--danger-bg-hover` und `--danger-bg-active` gegen `--text-on-solid`, min 4,5; `--note-billing-bg` gegen `--text-primary`, min 4,5; `--focus-ring-contrast` gegen `--focus-ring-color`, min 3 |
| **benannte Ausnahme mit Zahl und Grund (6 Token, 7 Zeilen)** | `--status-exported-border`, `--success-border`, `--danger-border`, `--note-internal-border`, `--note-billing-border`, `--timer-idle-border` (zweimal: `--bg-surface` und `--bg-subtle`) |
| **kein Paar, und zwar baulich unmöglich (4)** | `--shadow-xs`, `--shadow-sm`, `--shadow-lg`, `--bg-scrim` |

Die fertigen Zeilen für `contrast-check.mjs` stehen im Artefakt, Abschnitt 9.6.

**Drei Punkte, die mehr sind als eine Einordnung:**

1. **Berichtigung meiner eigenen Zeile aus Abschnitt 3.** `--status-exported-border` stand dort als
   „Träger, min 3", begründet mit der Symmetrie zu „Offen" und „Erneut offen". Die Symmetrie trägt
   nicht: Jene zwei sind **Konturetiketten ohne Füllung** — dort *ist* die Kontur die Grenze.
   „Exportiert" ist voll gefüllt, und seine Fläche hält die Grenze bereits mit min 3. Also
   **Ausnahme**, nicht Paar. Ein Paar hätte behauptet, der Zustand hinge an der Kante.
2. **`--focus-ring-contrast` mißt nicht, was der Kommentar sagt.** `.on-solid:focus-visible`
   zeichnet **beide** Ringbänder außerhalb des Randkastens: 0–2 px `--focus-ring-color` (Schatten),
   2–4 px `--focus-ring-contrast` (Kontur über dem Schatten). Der Gegenring berührt die **Füllung
   des Knopfes gar nicht**. T-189 hat ihn gegen `--accent-bg` gemessen — die Fläche, die der
   Kommentar meint, nicht die, an der er gezeichnet wird. Gerechnet: gegen `--focus-ring-color`
   5,99 / 9,14; gegen `--bg-surface` **1,00 / 1,11**; gegen `--bg-canvas` 1,06 / 1,02. Gegenprobe:
   Im hellen Thema sind `--focus-ring-color` und `--accent-bg` zeichengleich `#2159da`, und meine
   5,99 fällt auf T-189s 5,98 — die Rechnung stimmt, die Fläche war verschieden.
3. **Die vier ohne Paar sind nicht „ausgenommen", sondern unmöglich.** Ein Paar auf einen
   Schattentoken **stoppt den Lauf** (`parseColor` liest `0 1px 2px rgba(…)` nicht). `--bg-scrim`
   ist teildurchsichtig, und seit T-197 ist `over` dann Pflicht — was darunter liegt, ist die ganze
   Anwendung, und eine geratene Fläche ist genau der Fehler, gegen den `over` gebaut wurde. Diese
   Begründung ist beim nächsten Durchgang nicht verhandelbar; „braucht keins" wäre es.

---

## 3. Zur Kenntnis genommen (T-202)

Sieben Stellen statt der fünf, die mein Artefakt nannte — gefunden über den **Wortlaut** statt über
meine Aufzählung. Das ist die bessere Suchweise, und ich habe sie in diesem Durchgang übernommen:
Die Liste in 9.4 des Trägerpapiers nennt je Token **alle** Fundstellen aus der Kaskade, nicht die,
die ich in T-189 zitiert fand. 19 Balken zu 19 Lücken mit der Kartenfarbe in der Lücke: Damit mißt
das vorhandene Paar wirklich Balken gegen Lücke, und die Form hat ihren Zahlenwert bekommen, ohne
daß ein Paar dazukam. `.note--billing::before` wurde nie gezeichnet — B-6 bestätigt.

---

## Artefakte

- `docs/design/textabbau-gestalt.md` — **Abschnitt 9 neu** (O-HZ: der `MessageSlot`, 9.1 bis 9.10)
- `docs/design/traeger-und-zusage.md` — **Abschnitt 9 neu** (A-A-45: Token für Token, 9.1 bis 9.7)
- `.claude/team/reports/T-204-ui-designer.md` — dieser Bericht

Nicht angefaßt: `apps/**`, `packages/**`, `docs/design/textbestand.md` (ux-designer, läuft
parallel), `docs/design/textbestand-aufgabenbereich.md` (integration-dev).

---

## Kurzfassung

```
Aufgabe: T-204 — O-HZ (Bauform des MessageSlot, Z-53a blockierend) und A-A-45
         (die Farben ohne Paar, Token fuer Token)
Status: fertig
```

**Artefakte:** `docs/design/textabbau-gestalt.md` Abschnitt 9 (neu),
`docs/design/traeger-und-zusage.md` Abschnitt 9 (neu), dieser Bericht. Kein Produktivcode.

**Zusammenfassung:** Der `MessageSlot` ist entschieden: ein gemeinsamer dauerhafter Wirt, der die
Rolle trägt und `InlineMessage` über einen Zusammenhang (`MessageHostContext`, Bauart wie
`FieldMessageQuietContext` aus T-202) rollenlos zeichnen läßt — damit bleiben alle 76 Aufrufstellen
zeichengleich und die Live-Region in der Live-Region ist baulich ausgeschlossen. Er sitzt, wo die
Meldung heute steht, ist leer **null** hoch und bekommt nie reservierten Platz; das Loch entsteht
nicht am Wirt, sondern am Abstandsmechanismus seines Behälters, und dafür stehen drei Antworten
bereit — darunter die neue Feststellung, daß der negative Rand aus T-191 in einem **Raster** nicht
wirkt. Am Formulardialog kostet der Wirt **keinen Knoten**, weil `FormDialog.tsx:255-261` den
Behälter bereits hat; `scrollIntoView` bleibt daneben stehen, weil der Wirt hörbar macht und nicht
sichtbar (T-202s Messung: eine Fläche kann vollständig außerhalb des Sichtbereichs liegen). Gegen
die halb umgesetzte Sortierung stehen zwei bauliche Vorkehrungen statt Disziplin: eine **Regel E**
in `proof:surface` mit benannter Sorte-2-Liste und sechs Bündel, die nach **Fläche** und nie nach
Anzahl geschnitten sind. Für A-A-45 liegt die Einordnung je Token vor — vier echte Paare, sechs
benannte Ausnahmen, vier Token, bei denen ein Paar nicht überflüssig, sondern **baulich unmöglich**
ist.

**Annahmen:**
1. **Es sind vierzehn ausstehende Token, nicht dreizehn.** Neu erhoben aus dem Bestand statt aus
   T-189 abgeschrieben; versorgt ist ein **Token** mit zwei **Zeilen**. Die Liste zählt Token und
   ist vollständig, gleich welche Zahl im Auftrag stand.
2. **`urgency` gehört dem Platz, nicht der Meldung.** Damit sagt eine Fläche mit
   `urgency="assertive"` auch eine `tone="warning"`-Meldung dringlich an. Betroffen ist heute keine
   Stelle (Bündel 0 bis 5 tragen ausschließlich `danger`) — als F-7 vorgelegt.
3. **Regel E ist Bedingung, nicht Kür.** Ohne sie ist die Reihenfolge in 9.7 ein Vorsatz und die
   Warnung aus Z-53 unbeantwortet.
4. **Die Bauart der Regel E ist frontend-devs Handwerk.** Daß es sie geben muß, ist meine
   Entscheidung; wie sie im AST aussieht, nicht.
5. **Alle neuen Zahlen sind von Hand gerechnet, nicht vom Lauf gemessen** (E-087), mit einer
   ausgewiesenen Gegenprobe gegen einen bekannten Wert aus T-189.

**Risiken:**
1. **B-11, und es ist das größere Risiko dieser Aufgabe.** Nach meiner Rechnung trägt der innere
   Fokusring am **Primärknopf im hellen Thema** dieselbe Farbe wie die Füllung
   (`--focus-ring-color` = `--accent-bg` = `#2159da`) und der Gegenring dieselbe wie die Karte
   (`#ffffff`, 1,00:1). Sichtbar bliebe ein Knopf, der um 2 px wächst. Gefahrenknopf und dunkles
   Thema sind nicht betroffen. **Gerechnet, nicht gemessen — hier läuft kein Browser.** Wenn es
   stimmt, ist es ein Befund zu SC 2.4.7 und 1.4.11 mit eigenem Auftrag und **kein** Nebenprodukt
   von A-A-45: Das Paar gegen `--bg-surface` zu setzen, bevor die Behebung entschieden ist, machte
   den Lauf in genau der Welle rot, die den Vollständigkeitswächter einführt — und ein roter Lauf
   wird dort als kaputter Wächter gelesen, nicht als gefundener Fehler.
2. **B-9: die Sitzungsleiste steht möglicherweise in der falschen Rasterzelle.** `.updatebar` ist
   das einzige selbstplatzierte Kind von `.app` (kein `grid-area`, kein `grid-column`;
   `.skip-link` ist `position: fixed` und nimmt nicht teil). Ohne Hüllenmeldung landete sie in
   Zeile 1 **Spalte 1**, also in der Breite der Seitenleiste; mit Hüllenmeldung in einer impliziten
   vierten Zeile unter dem Inhalt. Derselbe Verdachtstyp wie B-6, und aus demselben Grund nie
   aufgefallen: Die Leiste erscheint erst, wenn eine **zweite** Antwort der Versionsprüfung während
   der Arbeit eine neuere Fassung meldet. Meine Vorgabe (benannte Rasterzeile `update`) behebt es
   mit, unabhängig vom Ausgang der Messung.
3. **B-12: noch eine Graustufenzusage ohne Paar.** `app.css:932-935` behauptet für die Kachel
   „Überfällig", Rahmen **und** Fläche trügen sie in Graustufen. Der Rahmen kann es bei 1,66 / 1,79
   nicht; ob die Fläche es tut, ist ungemessen (`--danger-bg-subtle` gegen `--warning-bg` hat kein
   Paar). Dieselbe Bauart wie T-189-5 und T-189-6, eine Ansicht weiter. Kein Auftrag aus dieser
   Aufgabe.
4. **B-10, klein:** Der negative Rand, mit dem T-191 den leeren Wirt in Flex-Behältern unsichtbar
   macht, wirkt in einem **Raster** nicht. Betroffen ist ein Behälter, und dort löst P2 es mit —
   der Satz steht trotzdem da, damit die nächste Meldefläche in einem Raster nicht mit 16 px endet,
   die niemand erklären kann.
5. **Ein Wirt ist keine Ansage.** Er sorgt dafür, daß eine Meldung angesagt wird, **wenn sie
   erscheint** — nicht dafür, daß eine unveränderte Meldung nach einer neuen Handlung erneut
   gehört wird. Das ist Z-49 und bleibt eine eigene Entscheidung.

**Offene Fragen:**
1. **An den Orchestrator (F-6):** Wird **Regel E** in `proof:surface` in derselben Welle gebaut wie
   der Wirt? Ohne sie überlebt die Sortierung keinen Zwischenstand.
2. **An spec-ux-reviewer (F-7):** `urgency` am Wirt statt `tone` am Baustein — heute erzeugt allein
   `tone="danger"` ein `alert`. Betroffen ist keine Stelle; die Änderung gehört trotzdem vorgelegt.
3. **An visual-qa:** B-11 (Fokusring am Primärknopf, hell) und B-9 (Rasterzelle der
   Sitzungsleiste). Beides gerechnet, beides nicht meßbar ohne Browser.
4. **An den Orchestrator, klein:** `.tags-split__error` wird mit dem Umzug des Wirts
   gegenstandslos (ihre einzige Zeile ist `grid-column: 1 / -1`). Das ist ein Klassenname, der
   fällt — E-076 Punkt 3, im Vertrag des Artefakts benannt.

**Nächster Schritt:** **Bündel 0 als ein Auftrag an frontend-dev** — `MessageSlot` +
`MessageHostContext` + rollenloses `InlineMessage` im Wirt + `.dialog__body--form > .live-region:empty`
+ `FormDialog` als erste Stelle + Regel E mit zwei Gegenproben. Parallel und unabhängig davon
**A-A-45 an frontend-dev** mit den fertigen Zeilen aus `traeger-und-zusage.md` 9.6 — **ohne** den
Fokusring-Befund, der als eigene Messung an visual-qa geht.
