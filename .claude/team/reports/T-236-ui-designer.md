# T-236 — ui-designer

```
Aufgabe: T-236 (Welle AL) — O-KM (die 2-px-Fläche ohne Messung und ohne Ausschluß; die
         Faustformel für die Strichzahl), O-KF (76 gegen 42 Aufrufstellen), O-KI erste
         Hälfte (der Höflichkeitsvorsatz in der Auswahl). Nachtrag: T-232 Fragen 2 und 3.
Status: fertig
```

| Gegenstand | Ergebnis |
|---|---|
| **O-KM**, Faustformel | **zurückgenommen.** An allen drei Chromium-Punkten um genau einen Strich zu niedrig, an einem Punkt **zirkulär** bestätigt, für WebKitGTK **widerlegt** |
| **O-KM**, Planungsschranke | ersetzt durch ein **gemessenes Band**: 41 px … ≈ 217 px bei 4 px Rahmen. Darunter und darüber: ungemessen, nicht durchgefallen |
| **O-KM**, die 2-px-Fläche | **ausdrücklich ausgenommen**, mit Grund — und dabei ist die Fläche aufgefallen, an der es wirklich fehlt: die **1-px-Kontur** (F-17) |
| **T-232 Frage 2 (P-4)** | **Auslegung bestätigt**, Begründung ersetzt: das Verhältnis „3 zu 4" ist widerlegt (bei 73/56 px steht es **3 zu 7**) |
| **T-232 Frage 3** | **ja** — sechs Meßzeilen in 2.8, mit Engine, Fassung und Datum, keine als Zusage |
| **O-KF** | aufgelöst statt beantwortet: **zwei Mengen, nicht zwei Antworten**. Gemessen heute: **77** |
| **O-KI** | **ein** Ersatz für alle: **„Nichts gewählt"**, dazu **Regel G-1** und eine Fläche, die keinen Text braucht, sondern eine fehlende Option |

**Artefakte:** `docs/design/traeger-und-zusage.md` (Abschnitte 0, 1.4, 2.8, 12, 13.2, 13.3 und der
neue Abschnitt 14), `docs/design/textabbau-gestalt.md` (9 Vorlage, 9.1, 9.2 und der neue Abschnitt
11), dieser Bericht. **Kein Produktivcode.** Gelesen, nicht geändert: `apps/web/src/components/Select.tsx`,
`styles/components.css`, `styles/app.css`, `components/ExportAudit.tsx`, sechs Ansichten mit
Auswahlflächen, `packages/ui-tokens/tokens.css`, `docs/design/textbestand.md` (fremde Hoheit).

---

## 1. O-KM und T-232 Frage 2 — dieselbe Frage in zwei Gestalten

Die Rechnung, die alles entscheidet, steht in 2.8. Hier die Kurzform.

**Alle Meßpunkte, Rahmenbreite 4 px:**

| Engine | Pfad | Striche | Herkunft |
|---|---:|---:|---|
| Chromium | 41 px | 4 | T-233 |
| Chromium 151 | 73 px | 7 | T-232 |
| Chromium | ≈ 217 px | 19 | T-202 2.4 |
| WebKitGTK 4.1 | 41 px | **3** | T-233 |
| WebKitGTK 2.52.6 | 56 px | **3** | T-232 |

**Drei Befunde gegen die eigene Formel, und jeder allein würde reichen.**

1. **Sie lag an jedem Chromium-Punkt um genau einen Strich zu niedrig** — kein Rundungspech,
   sondern die Bauart: Chromium beschneidet den ersten **und** den letzten Strich, also kommt ein
   angeschnittener obendrauf. Mit **Aufrunden** stimmt sie an allen drei Punkten aufs Stück:
   ⌈41 ÷ 12⌉ = 4, ⌈73 ÷ 12⌉ = 7, ⌈217 ÷ 12⌉ = 19.
2. **Einer der drei „Anpassungspunkte" war zirkulär.** In 2.8 stand „228 px Pfad" als Länge des
   `rows={3}`-Feldes. Diese Zahl war **aus der zu prüfenden Formel zurückgerechnet** (19 × 12).
   Gemessen hat T-202 2.4 etwas anderes: 19 Balken à 7,7 css und 19 Lücken à 3,7 css, also
   **≈ 217 px**. Ein Modell, das an einem aus ihm selbst gewonnenen Punkt bestätigt wird, ist dort
   nicht geprüft. **Mein Fehler aus T-233, und genau die Sorte, gegen die dort meine Annahme 4
   geschrieben war.**
3. **Für WebKitGTK gilt sie überhaupt nicht.** 41 px → 3, 56 px → 3. Die Periode wächst mit (≈ 16
   px bei 41, ≈ 24 px bei 56). **Länge kauft in WebKitGTK keine Striche.** Damit ist auch das
   Verhältnis „3 zu 4" aus T-233 hinfällig: an derselben Vorrichtung steht es bei 73/56 px als
   **3 zu 7**. Es ist keine Konstante, sondern öffnet sich mit der Länge.

**Was an ihre Stelle tritt** (2.8, wörtlich dort): (a) ein **Chromium-Modell** `n ≈ ⌈L ÷ 3w⌉`, Stand
2026-09-06, drei Punkte, alle bei 4 px, ausdrücklich zum Planen und nicht zum Prüfen; (b) für
WebKitGTK **kein Modell, sondern zwei Punkte**; (c) statt der Planungsschranke ein **gemessenes
Band** 41 px … ≈ 217 px bei 4 px Rahmen. Außerhalb: **ungemessen** — was ein anderer Zustand ist als
durchgefallen, mit einer anderen Folge.

**Warum die alte Schranke trotz „sicherer Seite" ein echter Fehler war (B-23).** Sie hätte 41 px als
zu kurz verworfen, obwohl dort **beide** Engines tragen. Eine zu strenge Schranke gilt leicht als die
vorsichtige Wahl; sie ist es nicht. Sie liefert den Grund, eine Gestalt zu ändern, die in Ordnung
ist. Der Schaden hängt nicht an der Richtung, sondern daran, daß jemand nach ihr handelt.

**T-232 Frage 2 — P-4 ist richtig ausgelegt, aus einem besseren Grund als dem angegebenen.** Der
Zuschlag von 4 war nie eine Aussage über WebKitGTK, sondern ein Aufschlag auf eine **ungemessene**
Engine; wo unmittelbar gemessen wird, hat er keinen Adressaten, und die Grundschranke aus P-1
(≥ 3 / ≥ 2) ist dort die richtige. Was den Zuschlag für Chromium heute trägt, ist enger als früher
behauptet und stimmt: In Chromium wächst die Zahl mit der Länge, eine 4 fängt dort also eine zu
**kurze** Schiene ab — mehr kann ein reiner Chromium-Lauf nicht sehen. P-4 steht jetzt zweigeteilt in
2.8, P-3 um die **Schienenlänge** erweitert (56 gegen 73 px an derselben Fläche), und **P-7** ist
neu: WebKitGTK liegt mit 3 Strichen ohne Luft auf der Schranke, und die Antwort darauf ist weder
eine höhere Vorrichtung noch eine niedrigere Schranke, sondern Weg 2 der Rangfolge — ein zweites
Merkmal an der Fläche. Die Ablehnung des Erbauers („die Vorrichtung höher zu machen hieße, die
Vorrichtung zu messen") ist bestätigt und steht jetzt als einer von **drei** Gründen in 2.8; der
zweite ist neu gemessen: **es hülfe gar nicht.**

**Die 2-px-Fläche `.auditrow__reason--absent`: ausgenommen, nicht gemessen.** Sie ist Verstärkung.
Die Unterscheidung „Begründung steht da" gegen „keine Begründung" trägt der **Text selbst** — im
einen Zweig die Marke „Begründung" über dem fremden Text, im anderen der ausgeschriebene Satz
(`ExportAudit.tsx:167-181`); die zwei Zweige stehen zudem nie nebeneinander, sondern in
verschiedenen Zeilen einer Liste. Eine Messung, deren Ausgang an der Gestalt nichts ändert, ist kein
Nachweis. **Die Ausnahme kostet trotzdem eine Zeile:** die Regel trägt heute **gar keinen**
Kommentar, während `.table__row--not-billed` seinen „zusaetzlich gestrichelt" hat. Ohne ihn sucht
der nächste Durchgang die Messung, die absichtlich fehlt — so ist F-15 überhaupt entstanden.

**Und dabei ist die Fläche aufgefallen, an der es wirklich fehlt (F-17, neu).**
`.badge--not-billed` — 1 px, geschlossener Pfad, ≈ 69 px Umfang — ist die einzige Fläche, an der die
Konturform in der Aufzählung von 1.4 **mitgezählt** wird, und Regel T-1 verlangt dafür eine Messung.
Alle sechs Meßpunkte liegen bei **4 px**; nach Befund 3 darf von einer Rahmenbreite nicht auf eine
andere geschlossen werden. Bis das gemessen ist, steht die Kontur in 1.4 als Träger **neben** Symbol,
Wort und Balken — nie als der Träger. Der Meßauftrag ist klein, weil `proof:engines` steht: ein
weiterer Ausschnitt und ein weiteres Element, keine zweite Vorrichtung.

**T-232 Frage 3 — ja.** Die sechs Meßzeilen stehen in 2.8 mit Engine, Fassung, Datum und Herkunft,
als **Stand**, keine als Zusage. Die Handmessung des Orchestrators steht dort **nur für die
gestrichelte** Schiene; die Auswertung der durchgezogenen ist mit ihrem Grund als unbrauchbar
vermerkt (gleiche Farbe wie der Primärknopf, Schnitt durch beide), und für die durchgezogene gelten
ausschließlich die zwei `proof:engines`-Zeilen.

## 2. O-KF — 76 gegen 42: es waren nie zwei Antworten auf eine Frage

**Gemessen 2026-09-06**, über den **Wortlaut** `<InlineMessage` im Arbeitsbaum mit beachteter
`.gitignore` — also über versionierte **und** unversionierte Quelldateien, Bauergebnisse
(`apps/desktop/src-tauri/taskpane/`) ausgeschlossen. Das ist genau die Vereinigung, die `CLAUDE.md`
verlangt, in **einem** Durchgang statt in zweien.

| Menge | Zahl |
|---|---:|
| `<InlineMessage` in `apps/web/src` | **77** (46 Ansichten und Bausteine, 31 Musterseite) |
| außerhalb `apps/web/src` | **0** (drei Treffer in `proof-surface.mjs` sind Gegenproben des Wächters) |
| bedingt gezeichnete Meldebausteine, **Stand T-191 2.5** | **42** — 37 `InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice` |

**Die 76 und die 42 zählen nicht dasselbe.** 76 waren **alle** Aufrufstellen von `InlineMessage`
(T-204, Stand jener Welle); 42 sind die **bedingt gezeichneten** Meldebausteine **dreier** Arten
(T-191). Beide Sätze waren richtig; keiner sagte, worüber er zählt. Der Fehler war also nicht die
Zahl, sondern die fehlende Menge daneben — dieselbe Sorte wie B-21, wo eine Schranke in einer
Einheit stand, die zwei Bedeutungen hat. Berichtigt ist es dort, wo es steht: `textabbau-gestalt.md`
9.1 (jetzt 77 mit Stand und Datum, dazu ein Kasten, der die zwei Mengen trennt), 9.2 (die 42
benannt) und die Vorlage von Abschnitt 9.

## 3. O-KI erste Hälfte — der Ersatz für „Bitte wählen"

**Zuerst gezählt** (2026-09-06, `<Select` im Arbeitsbaum, gleiche Regel wie oben):

* **31** Aufrufstellen in `apps/web/src` — 19 in Ansichten, 12 auf der Musterseite.
* **30** davon nehmen den Vorgabewert; **eine** setzt einen eigenen (`ControlsSection.tsx:206`,
  „Nichts zur Auswahl", leere Liste).
* Es gibt den Baustein **nur einmal**; im Add-in und in der Hülle keine Entsprechung.
* **Sichtbar** ist der Satz nur, wo der gesetzte Wert nicht in der Liste vorkommt. Alle 31 Stellen
  gelesen: **vier** erreichbar, davon **zwei dauerhaft** — `ExportScreen.tsx:670` (frisch
  installiert, die mitgelieferte Standardvorlage hat dort keine Option) und `TodoFormDialog.tsx:247`
  („kein Status" ist speicherbar, über die Auswahl aber nicht wiederherstellbar). Zwei weitere sind
  Ladezustände.

**Entscheidung: ein Ersatz für alle — „Nichts gewählt".** Und der tragende Gedanke davor: **es ist
gar kein Platzhalter.** Eine Auswahl hat nichts zu tippen; der Text steht im Auslöser und ist das
einzige Sichtbare einer Auswahl ohne Wert. Er ist eine **Zustandsanzeige**, die nur zufällig über
eine Eigenschaft namens `placeholder` hineinkommt — zu beurteilen nach der Regel für Leerzustände
(*den Zustand benennen*), nicht nach der Platzhalterregel (*Beispiel oder Form*).

Gründe, kurz: Es ist **kein neuer Text** — „Nichts gewählt" steht schon dreimal im Produkt für genau
diesen Zustand (`RuleSection.tsx:495, 510`, `PoolFormDialog.tsx:664`). Er behauptet keine Pflicht,
die an zwei der vier Stellen nicht besteht. Die **Gestalt trägt den Rest bereits**:
`.select__trigger[data-placeholder-shown]` setzt `--text-muted`, und der Kommentar dort sagt es
wörtlich — der Text muß also nicht signalisieren, daß er kein Wert ist, nur den Zustand benennen.
Angesagt ergibt er „Status, Nichts gewählt" statt einer Aufforderung. Und er hält S-06 ein, auch
wenn er nicht darunter fällt: keine Anweisung, keine Anrede, 14 von höchstens 40 Zeichen.

**Ein Ersatz — aber mit einer Regel, wann eine Fläche ihn nicht benutzen darf (G-1, neu in
`textabbau-gestalt.md` 11.3):** Hat der leere Wert an einer Fläche eine **Bedeutung**, bekommt er
dort keinen eigenen Text im Auslöser, sondern eine **eigene Option mit Namen**. Das ist der
Unterschied, der `ExportScreen` von `SettingsScreen` trennt: Dieselbe Wahl, dieselbe Bedeutung, eine
Ansicht weiter — `SettingsScreen.tsx:451` führt `{ value: "", label: "Mitgelieferte
Standardvorlage" }`, `ExportScreen.tsx:672-681` führt sie nicht. **Dort ist der Vorgabetext nicht das
Problem, sondern die Lücke im Vorrat.** Drittens, davon getrennt: steht überhaupt nichts zur Wahl,
ist das ein eigener Zustand mit eigenem Text — so wie es die Musterseite schon vormacht.

**E-087 für die Streichung:** „Bitte wählen" kommt in `tests/**` und `apps/*/test/**` **null** mal
als Platzhalter der Auswahl vor. Drei Treffer gibt es (`apps/web/test/lib/errorText.test.ts:137,
218, 330`), alle drei zu einem **anderen** Satz aus `apps/local-api/src/usecases/tag-names.ts:176`,
von dieser Entscheidung nicht berührt. Das gehört in den Auftrag, damit niemand sie mitändert.

## 4. Übergabe an frontend-dev

Vollständig in `traeger-und-zusage.md` **14.2** und `textabbau-gestalt.md` **11**. Vier Punkte:

1. `app.css:2634-2639` — **ein Kommentar, wo heute keiner steht:** Verstärkung, kein Träger,
   ausdrücklich nicht gemessen, Verweis auf 2.8.
2. `apps/web/scripts/engine-parity/**` — `.badge`/`.badge--not-billed` als zweiter Ausschnitt und
   zweites Element (1 px, geschlossener Pfad). **Keine Zahl als Schranke**, P-3 gilt unverändert.
3. `components/Select.tsx:117` — Vorgabewert auf **„Nichts gewählt"**.
4. `screens/ExportScreen.tsx:672-681` — die **fehlende Option** für den leeren Wert.

**3 und 4 gehören in _eine_ Aufgabe.** Wer den Vorgabetext ändert, ohne die Option nachzutragen,
ersetzt an der Exportansicht eine falsche Aufforderung durch eine falsche Zustandsaussage: Dort ist
etwas gewählt, es hat nur keinen Eintrag.

Die vier Textstellen aus 13.2 gelten weiter, aber **in ihrer dort berichtigten Fassung** — drei von
ihnen nannten Zahlen, die es nicht mehr gibt („liegt unter der Schranke aus T-8", „3 gegen 4", „die
Schranke im Lauf ist 4"). Wer nach der alten Fassung baut, schreibt widerlegte Zahlen in Kommentare.

## 5. Annahmen

1. **Die Rahmenbreite der gemessenen Schiene ist 4 px**, und damit ist die 41 px die Höhe des
   Vermerkfeldes der Vorrichtung. Ich habe das nicht mitgeteilt bekommen, sondern **aus der Angabe
   des Orchestrators erschlossen**, sie liege „unter der eigenen Planungsschranke": Bei 12 × w > 41
   ist w > 3,4, und die einzige Schiene dieser Art ist die 4-px-Vermerkschiene. T-232 nennt
   dieselben 41/43 px für dieselbe Herleitung, was den Schluß stützt.
2. **≈ 217 px als Pfad der T-202-Messung** ist von mir gerechnet: 19 × (7,7 + 3,7). Endet der Lauf
   auf einem Strich statt auf einer Lücke, sind es 212,9 px. Beides ändert am Modell nichts
   (⌈212,9 ÷ 12⌉ = 18 wäre allerdings einer zu wenig — ich habe deshalb die Lesart mit 19 Lücken
   genommen, die T-202 wörtlich nennt: „19 Balken … und 19 Luecken").
3. **Die Mindesthöhe von `.auditrow__reason--absent` (34 px) ist am Kastenmodell gerechnet**, nicht
   im Browser gemessen: 2 × `--space-2` (8) + `--text-xs` (12) × `--leading-normal` (1,5). Die Zahl
   trägt keine Entscheidung — die Fläche ist ohnehin ausgenommen —, sie steht als Größenordnung.
4. **Die zweite Select-Tabelle (wo der Satz sichtbar wird) ist am Quelltext gelesen**, nicht im
   Browser gemessen. Sie folgt aus dem Verhältnis `value` zu `options` an jeder der 31 Stellen.
5. **„Nichts gewählt" ist eine Hausentscheidung über den Wortlaut**, wie die 3:1 in Abschnitt 0. Sie
   steht an einer Stelle (`Select.tsx:117`) und ist dort zu ändern. Die **Regel** dahinter (G-1) ist
   das Tragende, nicht die vierzehn Zeichen.

## 6. Risiken

1. **Der Chromium-Zuschlag steht weiter auf schmalem Grund.** Er ist jetzt richtig begründet (er
   fängt eine zu kurze Schiene ab), aber die Zahl 4 selbst ist nach wie vor gesetzt und nicht
   hergeleitet. Solange der Lauf WebKitGTK unmittelbar mißt, kostet das nichts. Fällt WebKitGTK aus
   dem Lauf (fehlendes `python3-gi`, GTK-4-Umstieg), fällt die Prüfung auf die geschätzte Engine
   zurück, **und niemand merkt es an der Zahl**. **Mittel** — Gegenmittel steht in T-232: der Lauf
   sagt dann „übersprungen" statt „bestanden".
2. **R-a aus T-232 bleibt und ist jetzt schärfer benannt.** WebKitGTK liegt ohne Luft auf der
   Schranke, und Länge kauft dort keine Striche. Eine Engine-Fassung mit längerer Periode macht den
   Lauf rot, obwohl die Schiene unterbrochen aussieht. **Mittel.** Die Antwort steht als P-7 fest,
   damit sie nicht im Augenblick des roten Laufs erfunden wird.
3. **F-17 ist eine Zusage ohne Messung, und sie steht im ausgelieferten Erzeugnis.** Die dreifache
   Absicherung von „Nicht abgerechnet" (Symbol, Wort, Balken) macht sie ungefährlich; die
   Aufzählung in 1.4 nennt sie trotzdem mit. **Niedrig**, aber sie gehört gemessen, nicht
   weggeredet — deshalb steht sie als Auftrag, nicht als Vorbehalt.
4. **`ExportScreen` zeigt heute im Zustand „frisch installiert" eine Aufforderung, wo ein Name
   hingehört.** Das ist kein neuer Fehler, aber ich habe ihn erst durch diese Zählung gefunden. Wird
   nur Punkt 3 der Übergabe gebaut, steht dort danach „Nichts gewählt" — falsch in der Sache, weil
   etwas gewählt ist. **Mittel, und zeitkritisch für den Zuschnitt der nächsten Aufgabe.**
5. **Meine Messungen sind eine Vereinigung ohne Differenz.** Ohne Schale konnte ich `git grep` und
   den Verzeichnisdurchlauf nicht als zwei Zahlen nebeneinanderstellen. Für die Zahlen 77 und 31 ist
   das folgenlos — die Vereinigung ist die gesuchte Menge —, für die Regel aus `CLAUDE.md` ist es
   eine benannte Lücke. **Niedrig**, steht auch in 14.1.

## 7. Offene Fragen

1. **F-17 an den Orchestrator, für frontend-dev:** die 1-px-Kontur `.badge--not-billed` in
   `proof:engines` aufnehmen? Es ist ein Ausschnitt und ein Element. Solange es fehlt, steht in 1.4
   eine mitgezählte Formaussage ohne Messung — und Regel T-1 dieses Papiers verlangt sie.
2. **An spec-ux-reviewer, fachlich und nicht gestalterisch:** Soll `TodoFormDialog` den Zustand
   „kein Status" anbieten? Heute ist er speicherbar (`statusId: null`) und über die Auswahl **nicht
   wiederherstellbar** — wer einmal einen Status gesetzt hat, kommt nicht zurück. Der neue
   Vorgabetext macht das weder besser noch schlechter; er macht es nur sichtbar. Ich habe darüber
   **nicht** entschieden.
3. **An den Orchestrator, klein:** Die drei Fundstellen von „Bitte wählen" in
   `errorText.test.ts` gehören zu einem **anderen** Satz. Sie sind hier nur genannt, damit sie
   niemand mitändert; sie brauchen keine Entscheidung.
4. **F-16 unverändert offen:** macOS/WKWebView. Seit T-232 fällt die Linux-Hälfte in einem
   wiederholbaren Lauf statt in einer Handmessung — die andere Hälfte fällt weiterhin nicht.

## 8. Nächster Schritt

**Eine Aufgabe an frontend-dev, und sie hat zwei Teile, die nicht getrennt werden dürfen:**
`Select.tsx:117` auf „Nichts gewählt" **und** die fehlende Option in `ExportScreen.tsx:672-681`.
Dazu, unabhängig und billig, der eine Kommentar an `.auditrow__reason--absent`. Danach — oder
parallel, es berührt nichts davon — F-17 als Ausschnitt in `proof:engines`, womit die letzte
mitgezählte Formaussage dieses Papiers eine Messung bekommt.
