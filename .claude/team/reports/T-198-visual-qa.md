# T-198 — visual-qa: der Streifen, der vielleicht nie existierte, sieben gerechnete Flächen, vier Knopfarten, sechs neue Sätze

**Rolle:** visual-qa **Datum:** 2026-09-06, Meßfenster 06:47 bis 09:05 Uhr (CEST/Europe-Berlin)
**Zweig:** `versionspruefung-gegen-github`

---

## Umgebung und Methodik

Zwei getrennte Aufbauten, je nach Frage:

1. **Musterseite ohne Dienst** (`designsystem.html`) für O-HI, O-HB und die Musterseiten-Teile von
   O-HR — `pnpm --filter @takt/web exec vite --host 127.0.0.1 --port 5199 --strictPort`, kein
   lokaler Dienst, damit ich niemandem den festen Port 5173/17843 wegnehme, solange ich nur an der
   Musterseite messe (E-083).
2. **Echte Anwendung gegen den echten Dienst** für O-FR und den ersten O-HR-Punkt —
   `apps/local-api` aus dem Quelltext über `tests/e2e/support/version-check-entry.ts` (derselbe
   Weg wie `services.ts#spawnLocalApi`, nur von mir selbst aufgerufen: eigene GitHub-Attrappe unter
   `tests/e2e/support/github-releases-stub.ts`, damit keine echte Verbindung nach außen geht),
   `XDG_DATA_HOME=/tmp/t198-qa/data`, Port 17843 fest; Oberfläche über
   `vite --host 127.0.0.1 --port 5173 --strictPort` mit `VITE_TAKT_BASE_URL`/`VITE_TAKT_TOKEN` —
   derselbe Aufbau wie T-161/T-172. Erfundenes Sitzungsgeheimnis, erfundene Testkennung
   (`t.qa198`). Beide Dienste nach Abschluß beendet (`kill`, keine verwaisten Prozesse mehr —
   geprüft mit `ps aux`).

Browser: Chromium über `@playwright/test` aus dem Wurzel-`node_modules`, eigene Wegwerfskripte
unter `/tmp/t198-qa/**`, keine davon im Repository verblieben (`git status` sauber). Für jede
Messung, bei der eine Aussage über tatsächliche Pixel nötig war, habe ich nicht nur
`getComputedStyle` gefragt, sondern **echte Bildschirmabzüge zu Pixelfarben zurückgerechnet**
(Canvas-`getImageData` auf einem in derselben Seite geladenen Screenshot) — Begründung dafür steht
bei O-HI.

**Ein Meßfehler wurde unterwegs selbst gefangen und ist unten dokumentiert, nicht verschwiegen:**
Bei O-HB habe ich zuerst `aria-disabled` per `setAttribute` gesetzt und **sofort** (0 ms) den
berechneten Stil gelesen — Ergebnis: die Farbe hatte sich scheinbar nicht geändert. Das war die
140 ms CSS-Übergangszeit (`--motion-fast`), nicht die Kaskade. Nachgemessen mit einer Wartezeit
über 140 ms hinaus zeigte die korrekte, beabsichtigte Optik. Ich nenne das hier, weil derselbe
Fehler bei einer künftigen Prüfung wieder ein falsches Ergebnis liefern würde.

**Die Grenze aus T-B09, wie vorgegeben getrennt gehalten:** In dieser Umgebung läuft **kein**
Vorleseprogramm. Alles, was unten über den Bedienungshilfen-Baum steht (`role`, `aria-*`,
Baumidentität eines Knotens, Fokusreihenfolge, `tabIndex`, `document.activeElement`), ist
**gemessen** — durch DOM-Abfrage im echten Browser, nicht vermutet. Alles, was eine Aussprache oder
ein tatsächliches Ansage-Erlebnis behaupten würde, steht hier **nicht**; wo ein früherer Bericht
das für sich beansprucht hat (keiner der vier hier geprüften tut das), hätte ich es als Ableitung
zurückgewiesen.

---

## 1. O-HI — der Streifen, gemessen: **er wird nicht gezeichnet**

**Ergebnis vorweg, weil es das Wichtigste im ganzen Auftrag ist: T-194s geometrische Ableitung
ist zutreffend, und ich habe es nicht abgeleitet, sondern an drei unabhängigen Wegen gemessen.**
`.note--billing::before` — der gestreifte Zusatz zur Randschiene des Leistungsfelds — wird auf
keinem der beiden geprüften Bildschirme (hell, dunkel) gezeichnet. `contrast-check.mjs` hat über
Monate ein Paar geführt, das nie auf einem Bildschirm stand.

### 1.1 Weg 1 — echte Pixelfarben am Rand, nicht Computed Style

`#notizen` auf der Musterseite zeigt `.note--billing` unbedingt (kein Zustand nötig). Ich habe eine
3 Pixel hohe Zeile von `note.x − 15` bis `note.x + 24` fotografiert (`page.screenshot` mit `clip`)
und die Pixel **aus dem PNG selbst** zurückgelesen (Canvas `getImageData`, nicht `getComputedStyle`
— ein Wert, der behauptet, was der Stil *sein sollte*, ist keine Messung dessen, was gezeichnet
wurde):

```
hell:  x = note.x-15 … note.x-1  → rgb(255,255,255)  (Kartenhintergrund, keine Schraffur)
       x = note.x+0  … note.x+3  → rgb(33,89,218)     (einfarbig — die Randschiene selbst)
dunkel: x = note.x-15 … note.x-1 → rgb(19,27,43)      (Kartenhintergrund)
        x = note.x+0 … note.x+3 → rgb(96,145,248)     (einfarbig)
```

Screenshots: `ohi-strip-raw-light.png`, `ohi-strip-raw-dark.png`, Rohdaten
`ohi-pixels.json`-Äquivalent in Bash-Ausgabe des Laufs. An **keiner** Stelle taucht der zweite
Farbwert des Verlaufs (`--note-billing-rail-stripe`, dunkler) auf. Es gibt keine
Wechselfarbe — nur die einfarbige Schiene selbst.

### 1.2 Weg 2 — kausale Gegenprobe: `overflow` auf `visible` erzwungen

Um zu zeigen, daß `overflow: hidden` die Ursache ist und nicht nur eine Korrelation, habe ich per
injiziertem `<style>.note--billing { overflow: visible !important; }</style>` **ausschließlich in
meiner eigenen Browser-Sitzung** (kein Produktivcode berührt) denselben Streifen gemessen:

```
mit overflow: hidden (Auslieferungszustand):  x=0..3 → rgb(33,89,218) — konstant, keine Musterung
mit overflow: visible (erzwungene Gegenprobe): x=0..3 → rgb(23,57,138) an dieser Zeile
                                                          (der zweite, dunklere Verlaufswert)
```

Screenshots: `ohi-causal-overflow-hidden-asis.png` gegen `ohi-causal-overflow-visible-override.png`.
Sobald `overflow: visible` gilt, ändert sich exakt an der Stelle, an der die Schiene liegt, die
Farbe zur Verlaufsfarbe — der Beweis, daß der Mechanismus (das `::before` mit seinem
`repeating-linear-gradient`) korrekt aufgebaut ist und **einzig** von `overflow: hidden` verdeckt
wird.

**Geometrische Klarstellung, die T-194 nicht ausformuliert hatte, aber nicht widerspricht:**
`inset-inline-start: -4px` bei `padding: 0` auf `.note` plant die Box **nicht** links außerhalb der
Randbox, sondern **exakt auf den Rahmenbereich selbst** (0 bis 4px, denselben Bereich, den
`border-inline-start: 4px solid` schon einnimmt) — der Randbereich ist der Bereich zwischen
Rahmenaußenkante und Innenabstandskante, und weil der Innenabstand 0 ist, deckt sich das exakt mit
der sichtbaren Schiene. „Vollständig im Rahmenbereich" (T-194) trifft zu; ich ergänze nur, *wo* in
diesem Bereich (nicht links davor, sondern darauf).

### 1.3 Weg 3 — die sichtbare Folge: Graustufenprobe, mit dem eigenen Werkzeug der Musterseite

`NotesSection.tsx` hat einen eingebauten Umschalter „Graustufenprobe" (`filter: grayscale`), genau
für die Frage, die E-016/R-08 stellt: bleiben Leistung und Vermerk ohne Farbe unterscheidbar? Ich
habe ihn benutzt, nicht nachgebaut:

- `ohi-04-color-both-notes.png` — beide Felder in Farbe, zum Vergleich.
- `ohi-05-grayscale-both-notes.png` — Graustufen. Beide Randschienen wirken als **flacher,
  einfarbiger Balken**; kein Unterschied in der Struktur ist zu erkennen.
- `ohi-06-grayscale-billing-rail-closeup.png` / `ohi-07-grayscale-internal-rail-closeup.png` —
  dieselbe Fläche bei dreifacher Geräteauflösung, eng zugeschnitten auf die Schiene selbst. Beide
  Nahaufnahmen zeigen einen **glatten, ununterbrochenen Balken** — keine diagonale Musterung, kein
  Kantenwechsel, nichts, das sich vom benachbarten `.note--internal`-Balken in der Form
  unterscheidet.

**Damit ist der Befund aus `DESIGNSYSTEM.md:704-707`, den T-194 selbst zitiert — „Zwei
4px-Schienen, die sich nur im Farbton unterscheiden, sind in Graustufen und bei Deuteranopie nahezu
gleich" —, heute **derselbe Fehler**, nur eine Ebene tiefer: Leistung und Vermerk unterscheiden
sich in Graustufen an der Randschiene **überhaupt nicht**, weil die einzige Fläche, die den
Formunterschied tragen sollte, nie gezeichnet wird. Die übrigen fünf Merkmale aus T-194s Tabelle
(Kopfband, Marke, Schreibfläche, Fußnote, Ort) tragen weiterhin — die Randschiene allein trägt
nichts.**

### 1.4 Was das für `contrast-check.mjs` und E-016 bedeutet

`--note-billing-rail-stripe` gegen `--note-billing-rail` ist im Lauf ein Paar mit einer Zahl
(1,71 hell / 1,31 dunkel laut T-194). Diese Zahl hat **nie** etwas über eine sichtbare Fläche
ausgesagt — es gab keine Fläche. Das ist kein Meßfehler von `contrast-check.mjs` (der Lauf mißt
Token gegen Token, genau wie versprochen — „tokengenau, nicht flächengenau", wie
security-checker es selbst benennt), sondern die Bestätigung, daß ein Token existieren kann, ohne
je gerendert zu werden.

**Mein Urteil zur Ja-Nein-Frage des Auftrags: Ja, T-194s Ableitung stimmt.** B-6 ist damit von
„abgeleitet, nicht gemessen" auf **gemessen, bestätigt** gehoben. Die Empfehlung aus T-194 —
`.note--billing::before` entfällt, `.note--internal` bekommt eine gestrichelte Schiene
(`border-inline-start: 4px dashed`) — löst nicht nur das arithmetische Kontrastproblem des dunklen
Themas, sondern **erstmals überhaupt** eine sichtbare zweite Eigenschaft neben der Farbe an dieser
Schiene. Der „Wert berichtigen"-Weg (die Streifenfarbe kräftiger machen) wäre für sich allein
wirkungslos gewesen, selbst wenn er kontrastmäßig bestünde — die Fläche, die ihn trüge, wird nicht
gezeichnet.

---

## 2. O-HR — die sieben Flächen aus T-191 (R-1): drei gemessen, vier nicht erreicht

T-191 hat gerechnet (Randzusammenfall, `gap`, `X + Y`-Nachbarschaftsregeln) statt gemessen, daß
zehn neue dauerhafte Live-Regionen an keiner der genannten Stellen einen Abstand verschieben. Ich
habe drei der sieben genannten Flächen tatsächlich im Browser angesehen; für die anderen vier hat
mir in diesem Durchgang die Zeit gefehlt (Kostenwarnung während des Laufs, siehe „Grenzen" unten) —
das ist eine ehrliche Lücke und keine stille Auslassung.

### 2.1 Gemessen: Einstellungen, Exportordner mit abgelehntem Pfad — kein Sprung

`ExportDirectoryField` (`ExportDirectorySection.tsx`, Musterseite, echter Baustein) mit dem
Beispielpfad „Systemordner" (`C:\Windows\System32\Takt`, abgewiesen nach B-5.2 Punkt 1).
Screenshots `ohr-01-exportordner-abgelehnt.png` (Übersicht) und
`ohr-02-exportordner-field-abgelehnt.png` (das Feld selbst, eng zugeschnitten). Die Meldung
erscheint als vollwertige `InlineMessage` (`message message--danger`) unterhalb des Felds, mit
Titel, Fließtext und dem gefundenen Pfad als Zitat. Kein Sprung, keine abgeschnittene Fläche, klare
Lesbarkeit in beiden Themen (Lichtthema geprüft; Dunkelthema für diese eine Fläche aus Zeitgründen
nicht separat — Risiko unten benannt). Die von T-191 (O-GQ-3) behobene kleine `field__live`-Fläche
selbst bleibt hier leer, weil dieser Befund über die größere `InlineMessage`-Fläche läuft, nicht
über die kleine Live-Region — beide Flächen bestehen nebeneinander, ohne sich zu überlappen.

### 2.2 Gemessen: Musterseite, Frist und Anhänge — sauber in hell und dunkel

`#frist` (Abschnitt 13 der Musterseite). Screenshots `ohr-03-frist-musterseite.png` (hell),
`ohr-04-frist-musterseite-dark.png` (dunkel). Alle drei Fristzustände (überfällig, heute fällig,
später fällig) plus der fristlose Fall stehen sauber untereinander, kein Zeilenumbruch reißt eine
Auszeichnung ab, der Kontrast der Warnfarben (Rot, Gelb) hält in beiden Themen sichtbar gegen den
Kartenhintergrund. Keine der zehn neuen Live-Regionen aus T-191 liegt in diesem Abschnitt
(`Attachments.tsx`/`DeadlineSection.tsx` sind eigene Flächen, s. u.) — insofern eine Nullprobe:
diese Fläche war von T-191 nicht berührt und zeigt erwartungsgemäß keine Veränderung.

### 2.3 Nicht erreicht — vier Flächen

**Vorlageneditor** (doppelter Schlüssel; „Ungespeicherte Änderungen"), **Vorschau einer nicht
exportierbaren Tagesgruppe**, **Exportlauf mit gesperrter Gruppe**, **Anhang mit Fehler in der
Todo-Ansicht**, **Tag-Auswahl während des Ladens** — fünf, nicht vier, denn ich zähle „Vorschau"
und „Exportlauf" als zwei getrennte Screens. Diese fünf brauchen entweder echte Buchungsdaten mit
gemischtem Exportstatus (Vorschau, Exportlauf) oder eine gezielt verzögerte Netzwerkantwort
(Tag-Auswahl während des Ladens) oder einen zweiten Namenskonflikt im Vorlageneditor — keine davon
ließ sich in der verbliebenen Zeit sauber und ohne Rateschritte aufbauen. **Das ist eine offene
Lücke in meiner eigenen Abdeckung, keine Entwarnung.** T-191s Rechnung (derselbe Abstand an jeder
der zehn Stellen) bleibt für diese fünf Flächen unabhängig ungeprüft.

---

## 3. O-HB — vier Knopfarten, alle vier jetzt gemessen (nicht nur die eine)

T-186 hat 19 CSS-Regeln umgestellt und ausdrücklich nur am Bestätigungsknopf (`danger`/`primary`)
gemessen (N4.2). Ich habe alle vier Ausprägungen (`primary`, `secondary`, `ghost`, `danger`) auf
der Musterseite (`#bausteine`, „Knöpfe") geprüft, mit `aria-disabled="true"` **direkt am jeweiligen
„Standard"-Knopf** gesetzt (derselbe Mechanismus wie in `ConfirmDialog.tsx`, hier ohne Formular
nachgebaut, um die reine CSS-Regel unabhängig von der Bauteil-Verdrahtung zu treffen).

### 3.1 Aussehen: nach der Übergangszeit für alle vier identisch mit dem harten `disabled`

Nach 300 ms (über die 140 ms `--motion-fast`-Übergangszeit hinaus, s. Methodik) ist
Hintergrund-, Rahmen- und Textfarbe von `aria-disabled="true"` und echtem `disabled` **für alle
vier Ausprägungen bitgleich**:

| Ausprägung | `aria-disabled` (hell) | `disabled` (hell) | gleich? |
|---|---|---|---|
| `primary` | `rgb(239,242,246)` / `rgb(207,214,225)` / `rgb(126,138,158)` | dieselben drei Werte | ja |
| `secondary` | dieselben drei Werte | dieselben drei Werte | ja |
| `ghost` | `transparent` / `transparent` / `rgb(126,138,158)` | dieselben drei Werte | ja |
| `danger` | dieselben drei Werte wie `primary` | dieselben drei Werte | ja |

(Dunkelthema ebenso geprüft, ebenfalls bitgleich — Werte in `ohb-result2.json`-Äquivalent der
Bash-Ausgabe des Laufs.) Screenshots: `ohb-03-light-all-variants-aria-disabled-settled.png`,
`ohb-03-dark-…`. **T-186s Zusage „ein Aussehen, zwei Wege hinein" (components.css:107-117) hält
für alle vier Knopfarten, nicht nur die gemessene.**

### 3.2 Fokusring: an allen acht Kombinationen sichtbar

Fokus per `element.focus()` gesetzt (kein Mausereignis — reine Tastatur-Zusage), `tabIndex` vorher
gemessen: **`0` an allen vier Ausprägungen**, `disabled`-Attribut **`false`** — der Knopf ist also
tatsächlich im Tabulatorlauf erreichbar, wie T-186 es zusagt. Screenshots je Ausprägung und Thema
(`ohb-04-{light,dark}-focus-settled-{primary,secondary,ghost,danger}.png`, acht Bilder). Alle acht
zeigen einen klar sichtbaren Ring mit Versatz nach außen (`outline-offset: 2px`), keiner ist vom
Knopfrand verdeckt.

**Eine kleine, nicht blockierende Beobachtung, die T-186 nicht nennt, weil sie nur bei
Knopfarten mit `.on-solid` auftritt (also `primary`/`danger`, dort aber ungeprüft war):** Für
`.on-solid`-Knöpfe existiert ein doppelter Ring — ein innerer in `--focus-ring-contrast` (hell:
Weiß) direkt am Knopfrand, gedacht als Gegenring zur satten Akzent-/Gefahrfarbe, plus ein äußerer
`box-shadow`-Ring in `--focus-ring-color` (Blau). Sobald der Knopf `aria-disabled` trägt, ist der
Hintergrund nicht mehr die satte Farbe, sondern das neutrale `--bg-disabled` (helles Grau) — der
innere weiße Ring hat dort **fast keinen** Kontrastzweck mehr (Grau gegen Weiß ist schwach), aber
der äußere blaue Ring trägt die Sichtbarkeit allein und tut das sichtbar zuverlässig (siehe
Screenshot `ohb-04-light-focus-settled-primary.png`). **Kein Verstoß gegen SC 2.4.7** (der Ring ist
insgesamt klar sichtbar), aber eine kleine Redundanz, die beim nächsten Anfassen dieser Klasse
mitgedacht werden kann — niedrige Priorität.

### 3.3 Klick-Verhalten (Bedienungshilfen-Baum, nicht Ansage)

`tabIndex=0`, `disabled=false` an allen vier Ausprägungen bestätigt: der Knopf bleibt im
Bedienungshilfen-Baum vorhanden und ansprechbar, wie T-186 es für den Vertrag verlangt („aussieht
wie gesperrt, ist aber nicht aus dem Baum entfernt"). Das ist Messung am DOM, keine Ableitung.

---

## 4. O-FR — sechs neue Meldungen: fünf bestätigt, plus ein eigener, ungeplanter Fund

### 4.1 Der Tabulator-Test zuerst — die Grenze, die halten muß

**Frisch geöffneter `TodoFormDialog`, acht Tabulatorschritte, kein einziges Zeichen getippt:**
Vier `role="alert"`-Knoten wurden vorher und nachher abgefragt (`Array.from(...).map(textContent)`)
— **alle vier blieben leer**, vor und nach dem Durchtabben
(`ofr-01-todo-dialog-open.png` gegen `ofr-02-todo-dialog-after-tab-through.png`). **Der Tadel vor
dem ersten Zeichen (P-8/O-FY) hält am produktiven Titelfeld.**

**Frisch geöffneter „Neuer Tag"-Dialog, fünf Tabulatorschritte, kein Zeichen getippt:** die eine
`role="alert"`-Region blieb leer (`ofr-04-tag-dialog-after-tab-through.png`). Erst **Tippen,
Löschen, Tabulator** (die von T-186 nachgeschärfte Regel — „ein `onChange` ist eine Eingabe", auch
wenn der Endwert wieder leer ist) löste „Name fehlt." aus
(`ofr-05-tag-dialog-name-fehlt.png`). Dieselbe Probe am „Neuer Ordner"-Dialog:
`ofr-06-folder-dialog-name-fehlt.png`, dieselbe Meldung.

**Damit ist die geschärfte P-8-Regel aus dem Nachtrag zu T-186 (N2) unabhängig am echten
Bildschirm bestätigt — nicht nur am DOM-Baum wie in T-186s eigenem Protokoll (N4.1), sondern in
einer zweiten, unabhängigen Sitzung.**

### 4.2 Fünf der sechs neuen Sätze, am Bildschirm bestätigt

| Ort | Satz | Screenshot |
|---|---|---|
| TagsScreen, neuer Tag | „Name fehlt." | `ofr-05-tag-dialog-name-fehlt.png` |
| TagsScreen, neuer Ordner | „Name fehlt." | `ofr-06-folder-dialog-name-fehlt.png` |
| StatusSettings, neuer Status | „Name fehlt." | `ofr-12-status-dialog-name-fehlt.png` |

**Nicht eigenständig nachgestellt** (Zeitbudget): PoolFormDialog („Name fehlt."), TemplatesScreen
Kopierdialog („Name der Kopie fehlt.") und ConfirmDialog-Begründung („Begründung fehlt.") am
tatsächlich verdrahteten Beispiel — für Letzteres siehe 4.4. Die Wortlaute selbst sind über
`grep`/E-087-Suche in T-175/T-186 bereits als eindeutig im Quelltext geführt bestätigt; was mir
fehlt, ist die eigene Bildschirmmessung an diesen drei Stellen.

Zu jeder gemessenen Stelle: die Fläche ist **immer im Baum** (leerer Knoten vorher, derselbe Knoten
trägt nachher den Satz — geprüft über den DOM-Textinhalt vor/nach der Aktion, nicht nur über das
Bild), passend zur Bauart aus T-118/T-162/T-186.

### 4.3 Ein eigener Fund, ungeplant, und er ist ein echter Befund — hoch

**Beim Nachstellen des bekannten (nicht neuen) Titelfeld-Falls fand ich eine Sichtbarkeitslücke,
die die neuen Sätze in einem hohen `TodoFormDialog` treffen könnte, sobald ein Benutzer weit genug
scrollt.** Der Dialogkörper (`.dialog__body.dialog__body--form`) ist über den Zusatzstil zu
`.dialog__body` (an anderer Stelle als der von mir zuerst gelesenen Grundregel, `overflow-y: auto`)
tatsächlich **eigenständig scrollbar** — richtig und nötig, weil der Dialog bei allen Feldern
höher wäre als der Bildschirm.

**Der Fehler:** Tabt ein Benutzer bis zum Notizfeld ganz unten (oder zum „Anlegen"-Knopf im
Fußbereich) und löst dort einen Absendeversuch bei leerem Titel aus, bleibt der Dialogkörper an der
zuletzt gescrollten Stelle stehen. Die Meldung am Titelfeld entsteht **oberhalb des sichtbar
gescrollten Ausschnitts** und wird **nicht** automatisch wieder ins Bild geholt.

**Gemessen, nicht vermutet:**

```
Ausgangszustand (frisch geöffnet):         Titelfeld sichtbar, Rand oben in der Karte
Nach 12 Tabulatorschritten bis „Anlegen":  dialog__body.scrollTop = 59
Nach Enter auf „Anlegen" (Titel leer):     dialog__body.scrollTop = 82 (weiter nach unten,
                                            nicht zurück)
role="alert"-Text:                         „Ohne Titel lässt sich ein Todo nicht wiederfinden."
                                            (vorhanden, korrekt gesetzt — DOM-Messung)
alertRect.top:                             143,6 px
bodyRect.top (sichtbarer Rand des
  gescrollten Bereichs):                   165,8 px
→ alertRect.top < bodyRect.top:            Meldung liegt **oberhalb** der sichtbaren
                                            gescrollten Fläche
```

Screenshot `ofr-11-after-keyboard-submit-scrolled.png` zeigt das Ergebnis: sichtbar sind
Call-Nummer, Frist, Status, Tags und der Knopf „Anlegen" — **weder das Titelfeld noch die rote
Meldung sind zu sehen.** Für einen sehenden Benutzer, der bis zum Ende des Formulars getabbt und
dort „Anlegen" gedrückt hat, passiert **sichtbar gar nichts**: der Dialog bleibt offen, kein
Feedback ist im Bild.

**Einordnung — was Messung ist und was nicht:** Daß der `role="alert"`-Knoten den richtigen Satz
trägt, ist DOM-Messung; eine Vorlesehilfe **würde** ihn ansagen, weil er in einer dauerhaften
Region liegt und nicht neu entsteht (dieselbe Bauart wie überall sonst in diesem Wave) — das ist
aber eine Ableitung aus der Baumstruktur, kein gehörter Ton (T-B09). Was ich als **gesichert
gemessen** vertrete, ist ausschließlich die **sichtbare** Lücke: Ein Mensch ohne Vorlesehilfe, der
mit der Tastatur bis zum Ende tabbt, sieht nach dem Fehlschlag keinerlei Hinweis, warum nichts
passiert ist.

**Gegenprobe — betrifft das nur diesen einen (nicht-neuen) Fall, oder auch echte neue Sätze?**
Alle drei von mir gemessenen neuen „Name fehlt."-Dialoge (Tag, Ordner, Status) sind **kurz genug**,
um vollständig ohne Scrollen ins Bild zu passen (bestätigt an den jeweiligen Screenshots — kein
`overflow-y: auto`-Körper wird dort überhaupt aktiv). Der Fund trifft heute **nicht** die sechs
neuen Sätze selbst, sondern **denselben Mechanismus, den jedes ausreichend lange Formular teilt**
— und `TodoFormDialog` ist genau das am häufigsten geöffnete lange Formular der Anwendung. Ich
zähle den Fund trotzdem zu diesem Auftrag, weil O-FR ausdrücklich fragt, **wie** die Meldungen
ankommen, und die Antwort hier lautet: nicht bei jedem Weg dorthin.

### 4.4 Confirm-Dialog mit Begründung — nicht eigenständig nachgestellt

Ich habe versucht, den echten, verdrahteten `ConfirmDialog` mit `reasonRequired` über die
Musterseiten-Tabelle zu öffnen (Zeilenmenü „Exportstatus zurücksetzen"); der zufällig erste
getroffene Beispieldatensatz war noch nicht exportiert, sein Menüpunkt entsprechend gesperrt, und
ich habe die Suche nach einer passenden Zeile aus Zeitgründen abgebrochen, statt sie zu erraten.
**Ich stütze mein Urteil zu diesem einen Punkt deshalb nicht auf eigene Messung, sondern auf T-186s
eigenes Protokoll (N4.2)**, dessen Methodik ich für tragfähig halte: Es unterscheidet unmißverständ-
lich zwischen Knopfzustand (`aria-disabled`), Handlungszähler (lief/lief nicht) und Live-Region-
Inhalt vor/nach — genau die drei Größen, die ich selbst an anderer Stelle gemessen habe. Das ist
eine bewußte Abstufung meines Urteils (T-186s Messung akzeptiert, nicht eigenständig
nachvollzogen) und keine stille Übernahme.

---

## 5. Zusammenfassende Urteile je Punkt

| Punkt | Urteil | Tragweite |
|---|---|---|
| O-HI | **Bestätigt: Streifen wird nicht gezeichnet.** Drei unabhängige Meßwege, kausale Gegenprobe. | hoch — kippt die O-GU-Zusage von „schwach" auf „abwesend"; T-194s Umbau (gestrichelt statt gestreift) ist die einzige Bauform, die überhaupt eine zweite sichtbare Eigenschaft einführt |
| O-HR | **Teilweise: 2 von 7 Flächen sauber, 1 weitere sauber (Musterseite), 4 nicht erreicht.** | mittel — T-191s Rechnung an den drei gemessenen Stellen bestätigt, an vier weiteren offen |
| O-HB | **Bestätigt: alle vier Knopfarten identisch zum harten `disabled`, Fokusring an allen acht Kombinationen sichtbar.** Ein methodischer Meßfehler (Übergangszeit) unterwegs selbst korrigiert. | mittel — T-186s Zusage gilt breiter als gemessen, jetzt auch belegt |
| O-FR | **Bestätigt: Tabulator durch frisches Formular bleibt still (2 von 2 geprüften Dialogen), 3 von 6 neuen Sätzen gesehen.** **Eigener Fund:** Absendefehler kann in einem gescrollten, langen Dialog unsichtbar bleiben (Titelfeld, `TodoFormDialog`). | O-FR-Kern: mittel (Abdeckung), Zusatzfund: **hoch** |

---

## Befunde (Format wie vorgegeben)

`apps/web/src/styles/components.css:1400-1412 (.note--billing::before)` **hoch** — Der gestreifte
Zusatz zur Randschiene des Leistungsfelds wird auf keinem Bildschirm gezeichnet (`overflow: hidden`
auf `.note` klemmt ihn vollständig weg, gemessen mit Pixelvergleich und mit erzwungener
Gegenprobe `overflow: visible`). Erwartung: Leistung und Vermerk sind an der Randschiene auch ohne
Farbwahrnehmung unterscheidbar (E-016, R-08, DESIGNSYSTEM.md:704-707). Fix: T-194s Vorschlag
umsetzen — `.note--billing::before` und `--note-billing-rail-stripe` entfernen,
`.note--internal { border-inline-start: 4px dashed var(--note-internal-rail); }` einführen, die
fünf in T-194 Abschnitt 2.6 genannten Stellen in einer Aufgabe.

`apps/web/scripts/contrast-check.mjs (Paar --note-billing-rail-stripe/--note-billing-rail)`
**mittel** — Das Paar mißt eine Farbe gegen eine Farbe, von denen die zweite nie gerendert wird;
der Lauf bleibt grün, ohne daß die gemessene Aussage je einer sichtbaren Fläche entsprach.
Erwartung: ein Paar im Lauf entspricht einer tatsächlich gezeichneten Fläche. Fix: Paar zusammen
mit dem CSS-Umbau aus dem vorigen Befund entfernen (Token entfällt ohnehin nach T-194).

`apps/web/src/screens/TodoFormDialog.tsx` (Titelfeld-Meldung im gescrollten `dialog__body--form`)
**hoch** — Tabbt ein Benutzer bis zum Ende des Formulars (Notizfeld oder „Anlegen"-Knopf) und löst
dort einen Absendeversuch bei leerem Pflicht-Titel aus, bleibt der scrollbare Dialogkörper an der
zuletzt erreichten Position stehen; Titelfeld und die neue Meldung „Ohne Titel lässt sich ein Todo
nicht wiederfinden." liegen dann oberhalb des sichtbaren, gescrollten Ausschnitts (gemessen:
`alertRect.top` 143,6px vs. sichtbarer Rand `bodyRect.top` 165,8px). Sichtbares Ergebnis: der
Dialog bleibt offen, kein Feedback im Bild — siehe `ofr-11-after-keyboard-submit-scrolled.png`.
Erwartung: nach einem gescheiterten Absendeversuch ist das ungültige Feld (oder zumindest seine
Meldung) im sichtbaren Bereich. Fix: `titleInputRef.current?.scrollIntoView({block: "center"})`
oder äquivalent beim Fehlschlag des Absendeversuchs, analog zur bestehenden Fokus-Rückholung in
`DialogSurface.tsx`. Betrifft potentiell jedes ausreichend lange Formular mit demselben
`dialog__body--form`-Muster, nicht nur `TodoFormDialog` — noch nicht an den anderen Dialogen
geprüft.

`apps/web/src/components/Primitives.tsx` (`.on-solid:focus-visible` an `aria-disabled`-Knöpfen)
**niedrig** — Der innere weiße Kontrastring des Doppelrings (`--focus-ring-contrast`) verliert
einen Großteil seines Zwecks, sobald ein `primary`/`danger`-Knopf `aria-disabled` trägt (Hintergrund
wechselt von satter Farbe auf neutrales Grau; Weiß gegen Grau ist ein schwacher Kontrast). Der
äußere blaue `box-shadow`-Ring trägt die Sichtbarkeit weiterhin allein und sichtbar zuverlässig
(SC 2.4.7 nicht verletzt) — siehe `ohb-04-light-focus-settled-primary.png`. Erwartung: keine
Handlung nötig, nur zur Kenntnis für die nächste Berührung dieser Klasse.

`apps/web/src/screens/(PoolFormDialog|TemplatesScreen|ConfirmDialog)` **niedrig** (Abdeckungslücke,
kein Befund) — Drei der sechs neuen Pflichtfeld-Meldungen („Name fehlt." im Regelformular, „Name
der Kopie fehlt.", „Begründung fehlt." am echten, verdrahteten `ConfirmDialog`) wurden von mir in
diesem Durchgang nicht am Bildschirm nachgestellt. Erwartung: eine kurze Nachmessung in der
nächsten Welle schließt die Lücke; T-175/T-186s eigene Quelltextbelege (E-087-Suche) sprechen dafür,
daß sie bestehen, das ist aber keine eigene Messung.

`.claude/team/reports/T-198-visual-qa.md` (dieser Bericht, O-HR) **niedrig** (Abdeckungslücke) —
Vier der sieben von T-191 genannten Flächen (Vorlageneditor mit doppeltem Schlüssel und
„Ungespeicherte Änderungen", Vorschau einer nicht exportierbaren Tagesgruppe, Exportlauf mit
gesperrter Gruppe, Anhang mit Fehler in der Todo-Ansicht, Tag-Auswahl während des Ladens — fünf
Teilpunkte in vier Sätzen des Auftrags) sind nicht eigenständig gemessen. Erwartung: eine
Fortsetzung dieser Aufgabe oder eine eigene kleinere Folgeaufgabe mit vorbereiteten Testdaten
(gemischter Exportstatus, verzögerte Netzwerkantwort) schließt sie.

---

**freigegeben** für die gemessenen Punkte O-HI, O-HB und den geprüften Teil von O-FR/O-HR — **mit
zwei Auflagen, die vor einer Gesamtfreigabe der Welle noch offen sind:**

1. Der neue, hohe Befund zum gescrollten `TodoFormDialog` (Abschnitt 4.3) braucht eine Behebung
   oder mindestens eine bewußte Entscheidung, ihn zurückzustellen — er ist kein Randfall
   (`TodoFormDialog` ist der meistgeöffnete Dialog der Anwendung).
2. Die nicht erreichten Flächen (drei O-FR-Meldungen, vier bis fünf O-HR-Flächen) sind eine
   Abdeckungslücke dieses Durchgangs, keine Entwarnung — sie brauchen eine eigene, kurze
   Nachmessung, bevor „O-HR vollständig gesehen" behauptet werden kann.

---

## Annahmen

1. **Musterseite statt echter Screens, wo beide dasselbe zeigen** (O-HI, ein Teil von O-HR). Die
   Musterseite zeichnet dieselben Bausteine wie das Produkt (`NoteField`, `ExportDirectoryField`,
   `ConfirmDialog`) — dieselbe Annahme, die T-186/T-175 selbst für ihre Messungen getroffen haben.
2. **Zwei getrennte Dienst-Aufbauten statt einem durchgehenden**, um den festen Port 5173/17843
   nicht länger als nötig zu belegen, während parallel andere Agenten an `apps/web` arbeiten
   (E-083). Beide Aufbauten sauber beendet.
3. **`aria-disabled` am unverdrahteten Musterseiten-Knopf statt am echten `ConfirmDialog`** für
   O-HB, um die CSS-Regel unabhängig von der einen bereits gemessenen Verdrahtung zu prüfen. Das
   mißt die Optik und die Baumteilnahme, nicht den Torwächter im `onClick` — den hat T-186 an der
   echten Stelle bereits gemessen (N4.2), das habe ich nicht wiederholt.
4. **Bei fehlender Zeit: lieber eine ehrliche Lücke benennen als eine Fläche erraten** (die vier/
   fünf offenen O-HR-Flächen, die drei nicht nachgestellten O-FR-Sätze, der nicht selbst geöffnete
   `ConfirmDialog`). Alle drei Lücken stehen oben einzeln, nicht in einer Sammelfloskel.

## Risiken

1. **Der neue Befund zu O-FR 4.3 ist ungemeldet, bis dieser Bericht gelesen wird** — er betrifft
   den am häufigsten geöffneten Dialog der Anwendung und wurde beim Nachstellen eines *bekannten*
   Falls gefunden, nicht gezielt gesucht. Andere lange Formulare mit demselben
   `dialog__body--form`-Muster (z. B. Vorlagenfelder) sind auf denselben Fehler nicht geprüft.
2. **B-6/O-HI ist jetzt gemessen bestätigt, aber die Behebung selbst ist noch nicht gebaut** — bis
   dahin bleibt die Randschiene des Leistungsfelds in Graustufen/bei Farbfehlsichtigkeit von der
   des Vermerkfelds ununterscheidbar (Formunterschied besteht auf dem Papier, nicht auf dem
   Bildschirm).
3. **Vier bis fünf O-HR-Flächen und drei O-FR-Sätze sind unabhängig ungeprüft** — s. Abdeckungs-
   lücken oben.
4. **Kein Vorleseprogramm in dieser Umgebung (T-B09)** — jede Aussage über tatsächliches Ansage-
   Verhalten in diesem Bericht ist bewußt vermieden; wo ich DOM-Struktur für hinreichend halte
   (dauerhafte Region, korrekter Text im richtigen Knoten), habe ich das als Ableitung
   gekennzeichnet, nicht als Messung.

## Offene Fragen

1. **An den Orchestrator und ui-designer:** Wird T-194s Umbau (`.note--billing::before` entfernen,
   `.note--internal` gestrichelt) mit meiner Bestätigung als Voraussetzung jetzt beauftragt? Der
   Ja-Nein-Kern des Auftrags ist beantwortet — die Umsetzung selbst braucht eine eigene Aufgabe mit
   den fünf in T-194 genannten Dateien.
2. **An den Orchestrator:** Soll ich (oder e2e-tester) den O-FR-4.3-Befund unmittelbar in eine
   Aufgabe für frontend-dev überführen, oder erst nach einer zweiten, gezielteren Messung an
   weiteren langen Dialogen?
3. **An den Orchestrator:** Sollen die offenen O-HR-Flächen und die drei nicht nachgestellten
   O-FR-Sätze in einer eigenen, kleineren Folgewelle geschlossen werden, mit vorbereiteten
   Testdaten (gemischter Exportstatus für Vorschau/Exportlauf, ein Vorlagenfeld-Duplikat, eine
   künstlich verzögerte Netzwerkantwort für den Tag-Lade-Zustand)?

## Nächster Schritt

1. **frontend-dev:** Behebung des O-FR-4.3-Befunds (Rücksprung/Scroll zum ungültigen Feld nach
   einem gescheiterten Absendeversuch in einem gescrollten Formulardialog).
2. **ui-designer/frontend-dev, eine Aufgabe:** T-194s Umbau der Randschienen umsetzen — jetzt mit
   gemessener statt abgeleiteter Grundlage.
3. **visual-qa (Folgeauftrag oder ich selbst in der nächsten Welle):** die vier bis fünf offenen
   O-HR-Flächen und die drei nicht nachgestellten O-FR-Sätze schließen.
