# T-218 — ui-designer (Welle AG)

**Aufgabe:** T-218 — O-IH: ein Knopf, der beim Gelingen durch einen anderen ersetzt wird, und der
Fokusrückweg des Dialogs zielt danach ins Leere.
**Status:** fertig
**Artefakte:**

* `docs/design/traeger-und-zusage.md` — neuer Abschnitt **11** (11.1 bis 11.11): die Entscheidung,
  der genaue Ablauf des Fehlers, die zugänglichen Namen, der Zustand dazwischen, die Regeln R-0 bis
  R-6, Zustände und Dichte, Übergabe an frontend-dev, e2e-tester und unit-tester, Vertrag, Befunde.
* `docs/design/textabbau-gestalt.md` — neuer Abschnitt **10**: Regel **U-5** („ein Bedienelement ist
  auch ein Fach") als Fortschreibung von B1 und U-1 aus Abschnitt 4.1, dazu ein Satz an U-3.
* dieser Bericht.

Kein Produktivcode angefasst.

---

## Die Entscheidung

**Ein Baustein, zwei Beschriftungen.** An `ExportGroups.tsx:303-319` steht künftig ein `Button` mit
`iconStart="pencil"`, dessen Beschriftung zwischen „Leistung nachtragen" und „Leistung bearbeiten"
wechselt und dessen Ausprägung von `secondary` (Leistung fehlt) auf `ghost` (Leistung ist da)
geht. Sinnbild und Größe bleiben in beiden Zuständen gleich. Der zugängliche Name trägt in
**beiden** Zuständen den Zeilenbezug, und zwar als verborgener Zusatz **im** Knopf
(`<span className="visually-hidden">, Buchung {entry.period}</span>`), nicht als `aria-label`.

Drei Gründe, in dieser Rangfolge: (1) `TemplatePreview.tsx:590-597` baut für dieselbe Aufgabe
bereits genau diese Form — zwei Bauformen für eine Aufgabe sind der eigentliche Befund; (2) nur so
ist das Rückkehrziel eine **Eigenschaft des Knotens** und keine Zusage über ihn — zwei Bausteine
verlangten zusätzlich einen Wirt, der nie bedingt sein und nie einen wechselnden `key` bekommen
darf, also eine Bedingung, die nur in einem Kommentar steht (E-087); (3) es ist Regel U-1 aus
T-171, eine Stufe allgemeiner — ein Bedienelement ist auch ein Fach.

---

## Was ich beim Lesen gefunden habe und was auf dem Board noch nicht so steht

**Der Fehler ist eine Sekunde später, als er aussieht.** In `BookingDialogs.tsx:161-165` steht
`await update` → Meldung → `bump()` → `onClose()`. `bump()` startet eine **neue Anfrage**
(`ExportScreen.tsx:289`), die in der Übergabe von `onClose()` nicht zurück sein kann. In dem Bild,
in dem der Dialog verschwindet, trägt die Zeile also noch die alte Leistung, der alte Knopf steht
noch, und `finalFocusEl` findet ihn: **der Fokus kommt an.** Erst wenn die Auffrischung eintrifft,
tauscht React `Button` gegen `IconButton`, und der Browser nimmt dem entfernten Knoten den Fokus.
Er fällt auf `<body>`.

Folge, die in jede Prüfung gehört: **Eine Messung bei t+0 besteht.** Der Fall ist nur mit einer
zweiten Messung nach dem Eintreffen der Auffrischung zu sehen. Genau diese Doppelmessung beschreibt
`tests/e2e/focus-return-after-dialog.spec.ts:32-37` bereits aus einem anderen Grund — die Reihe kann
den Fall, sie deckt diese Fläche nur nicht ab.

**SC 2.5.3 ist die Falle in der Verschärfung von spec-ux-reviewer.** Der Zeilenbezug lässt sich
nicht als `aria-label` an einen beschrifteten Knopf hängen: „Leistung der Buchung 09:00–10:20
bearbeiten" enthält „Leistung bearbeiten" nicht am Stück. Wer die alte Namensform behält und den
Knopf beschriftet, tauscht einen AA-Befund gegen einen A-Befund. Daher der verborgene Zusatz.

**Die Klasse hat genau einen lebenden Fall.** Gesucht wurde nach „zwei verschiedene Bausteine an
einer Stelle": `ExportGroups.tsx:303` (der Fall), `Timer.tsx:123` (Bedingung aus einer festen
Eigenschaft der Aufrufstelle abgeleitet, ändert sich zur Laufzeit nicht) und
`BookingsScreen.tsx:396` (beide Zweige sind `Button`, also derselbe Knoten). Daraus die prüfbare
Form in Regel R-6 — sie verbietet keine Bedingung, sondern die Verbindung dreier Merkmale.

**Derselbe Satz steht an drei Stellen.** „Leistung nachtragen" in `ExportGroups`, in
`TemplatePreview.tsx:596` (dort verkürzt zu „Bearbeiten") und in `ExportScreen.tsx:1242`
(`SkippedRow`). Zwei davon haben dieselbe Lücke im zugänglichen Namen. Sie gehören in **eine**
Aufgabe, sonst heißt dieselbe Handlung im Produkt drei verschiedene Dinge.

---

## Die zwei Punkte, die sonst der Bauende entschieden hätte

**1. Der Zustand dazwischen: der alte Knopf, unverändert und bedienbar.** Kein Wartezustand, kein
Skelett, kein `loading`. Der harte Grund: `Button` setzt bei `loading` das echte `disabled`
(`Primitives.tsx:73`), und `element.focus()` auf einem gesperrten Element tut nichts — der Fokus
fiele auf `<body>`, genau wie bei einem entfernten Knoten, nur eine Sekunde früher. Die Arbeit wird
an genau einem Ort gezeigt, und es ist der Ort des Fokus: am Absendeknopf des Dialogs
(`busy={mutation.busy}`, `BookingDialogs.tsx:179`).

Dazu **Regel R-0**, die heute unausgesprochen stimmt und deshalb aufgeschrieben gehört: Eine Fläche,
aus der heraus Dialoge geöffnet werden, wird beim Auffrischen **nicht ausgetauscht**.
`ExportScreen.tsx:289` hat `version` in `refreshDeps` und nicht in `deps` — der Inhalt bleibt
stehen, `refreshing` wird wahr. Stünde es in `deps`, verschwände beim Auffrischen die ganze Liste
und mit ihr **jedes** Rückkehrziel darin.

**2. Wenn das Ziel wirklich fällt: R-1 bis R-6.** Gültig ist ein Rückkehrziel nur, wenn es
verbunden, nicht gesperrt und nicht verborgen ist (heute prüft `finalFocusEl` allein das erste).
Fällt es, gilt die Kette: Nachfolger an derselben Stelle → Behälter (`tabindex="-1"`) →
Bereichsüberschrift → `.screen__title` als Untergrenze. Nie `<body>` — das ist kein Ziel, sondern
die Meldung, dass keines gewählt wurde. Eine Stufe ohne zugänglichen Namen wird übersprungen. Den
Ersatz nennt der **Aufrufer**, nicht der Dialog: `DialogSurface` weiß, wer geöffnet hat, aber nicht,
welche Zeile nachrückt.

---

## Annahmen

* Die Ausprägung darf mit dem Zustand wechseln, weil `.btn` jeder Ausprägung dieselbe Polsterung und
  einen 1 px durchsichtigen Rahmen gibt (`components.css:21-46`) — der Wechsel färbt um, er
  verschiebt nichts. Vorbild ist `Timer.tsx:124-131`, wo derselbe Knoten `icon` und `variant`
  wechselt.
* Der Wortlaut der zwei Beschriftungen gehört ux-designer; ich habe die **Bedingungen** gesetzt
  (gleicher Anfang, gleiche Länge, Zusatz mit Komma) und für den Fall des Schweigens zwei Fassungen
  hinterlegt.
* Die Dichte: Ein beschrifteter Knopf verbreitert im Raster `.eentry` die Spalte 7 für die ganze
  Liste und nimmt der Leistungsspalte Platz. Ich halte das für vertretbar, weil die vollständige
  Leistung unmittelbar darüber in der Exportzeile steht (`renderRowDetail`) und die Spalte in der
  Buchungsliste die Herkunftsansicht ist. **Das ist die einzige Annahme, die eine Messung braucht** —
  Auftrag an visual-qa, mit vorab entschiedenem Rückfall (siehe unten).
* `DialogSurface.tsx` wird in dieser Behebung **nicht** angefasst: Nach der Entscheidung fällt hier
  kein Ziel, und der Kern der Fokusrückkehr ohne Befund umzubauen ist bei O-CY-2 zweimal
  schiefgegangen.

---

## Risiken

* **R-a — die Dichte.** Bleibt in Spalte 6 bei 1024×640 zu wenig von der Leistung übrig, ist der
  Rückfall bereits entschieden und ändert die Kernentscheidung nicht: `IconButton` in **beiden**
  Zuständen, Namensform zeichengleich zu 11.4. Ein Baustein bleibt es so oder so.
* **R-b — die Wiederherstellung des Fehlers.** Die richtige Bauform sieht nach einer verpassten
  Gelegenheit zur Verkürzung aus („warum nicht ein Symbolknopf, wenn schon etwas dasteht?").
  Gegenmittel: der Kopfkommentar in `ExportGroups.tsx` (Auftrag in 11.8) und der Prüffall von
  unit-tester, der die Knotengleichheit unmittelbar misst.
* **R-c — B-17, ungemessen.** `finalFocusEl` prüft nur `isConnected`. Ein Auslöser, der beim
  Schließen gesperrt oder verborgen ist, besteht die Prüfung und nimmt den Fokus trotzdem nicht auf.
  Aus der Kaskade gelesen, **nicht im Browser gemessen** — hier läuft kein Browser.
* **R-d — Vertragspunkt.** Der zugängliche Name des Symbolzweigs ändert sich („Leistung der Buchung
  … bearbeiten" → „Leistung bearbeiten, Buchung …"). Er kostet **heute keinen Prüffall** (in
  `tests/**` und `apps/*/test/**` greift kein Fall auf diese Namen zu) — genau deshalb ist jetzt der
  richtige Augenblick.

---

## Offene Fragen

* **F-10 an ux-designer:** die zwei Wortlaute und der verborgene Zusatz aus 11.4.
* **F-11 an den Orchestrator:** soll `fallbackFocus` (R-4) gebaut werden? Empfehlung: ja, aber erst,
  wenn eine Fläche sie braucht — die nächste Löschung aus einer Liste heraus —, und dann mit einem
  Prüffall an derselben Reihe. Nicht in dieser Welle.
* **F-12, klein:** `TemplatePreview` benutzt `ghost`, `ExportGroups` und `SkippedRow` benutzen
  `secondary`. Ich habe die Angleichung an `secondary` vorgegeben; wer widerspricht, widerspricht
  jetzt.

---

## Nächster Schritt

Eine Aufgabe an frontend-dev über **alle drei Stellen** desselben Satzes (`ExportGroups`,
`TemplatePreview`, `SkippedRow`) samt Musterseite und Kopfkommentar — Einzelheiten in
`traeger-und-zusage.md` 11.8. Parallel dazu, weil unabhängig: e2e-tester ergänzt
`focus-return-after-dialog.spec.ts` um den Fall mit **zwei** Messungen (11.9), unit-tester um den
Fall, der die Knotengleichheit misst. Regel U-5 und R-0 bis R-6 gehören danach in
`apps/web/design/DESIGNSYSTEM.md`, damit sie Hausregeln sind und nicht Befund einer Aufgabe.
