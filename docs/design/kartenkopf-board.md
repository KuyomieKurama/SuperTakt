# Der Kartenkopf auf dem Board — trägt die zweizeilige Kopfzeile, und in welcher Rangfolge

**Aufgabe:** T-283, Welle nach T-281. **Verfasser:** ui-designer.
**Grundlage:** `.claude/team/reports/T-281-frontend-dev.md` (Messung und Behebung), T-144
Abschnitt 8.1 und 8.2 (die dritte Markenfamilie und ihre vier Auflagen), A-19.2 bis A-19.6,
A-5.5, A-13.2, E-025, `apps/web/src/features/board/Kanban.tsx`,
`apps/web/src/features/todos/TodoRow.tsx`, `apps/web/src/shared/ui/DeadlineFlag.tsx`,
`apps/web/src/styles/components.css` (`.kcard*`), `apps/web/src/styles/app.css`
(`.deadline*`, `.todo-row__meta`, `.board`), `apps/web/src/styles/viewport-layout.css`,
`packages/ui-tokens/tokens.css`, `apps/web/design/DESIGNSYSTEM.md` (fremde Hoheit, hier nur
gelesen), WCAG 2.2 SC 1.3.2, 1.4.4, 1.4.10, 1.4.12.

**Was dieses Papier ist.** Das Urteil über eine Gestaltentscheidung, die frontend-dev in T-281
ausdrücklich nicht getroffen, sondern zurückgegeben hat: Die Kopfzeile der Kanban-Karte bricht
seither um und kann zweizeilig werden. Hier steht, ob das trägt, in welcher **Rangfolge** die drei
Marken stehen müssen, wenn eine von ihnen umbricht, und was an dieser Fläche ab jetzt verbindlich
ist. Dazu die Zustände, das responsive Verhalten und die Übergabe.

**Was dieses Papier nicht ist.** Kein Umbau, kein neues Token, keine neue Farbe, kein neuer und
kein geänderter Oberflächentext. Ich ändere keinen Produktivcode. Alles, was unten als Vorgabe
steht, ist entweder bereits gebaut (T-281) oder ein Kommentarsatz.

**Ein Befund vorweg, weil er die Aufgabenstellung berichtigt.** Der Auftrag sagt, `docs/design/**`
beschreibe die Kopfzeile heute einzeilig. **Das ist am Baum nicht so.** Gesucht über den Wortlaut
in allen sechs Dateien dieses Ordners und zusätzlich in `apps/web/design/DESIGNSYSTEM.md`: Es gibt
dort **keinen** Satz über die Kopfzeile der Karte, weder einzeilig noch sonstwie. Die einzige
Erwähnung der Kanban-Karte in `docs/design/**` ist eine Zeile über Rahmen und Schatten
(`supertakt-layout.md:43`). Die Einzeiligkeit stand also nirgends als Entscheidung — sie stand als
**stillschweigende Annahme in einer CSS-Regel**, und genau deshalb ist sie ohne Widerspruch
gebrochen worden. Dieses Papier schließt die Lücke: Die meistgelesene Fläche des Boards hatte bis
heute kein Gestaltpapier. Siehe Befund B-1.

---

## 0. Das Urteil

**Die zweizeilige Kopfzeile trägt. Die Frist zieht nicht um. Die Rangfolge bleibt, wie sie ist —
Call-Nummer, Erledigt-Kennzeichen, Frist —, aber sie ist ab jetzt eine Entscheidung und kein
Zufall.**

Drei Sätze dazu, die den Rest dieses Papiers zusammenfassen:

1. Der Umbruch ist **keine zweite Gestaltungsrichtung**, sondern das Nachholen der Hausregel. Die
   Todo-Zeile in S-02 trägt dieselben drei Marken in derselben Reihenfolge und bricht seit jeher um
   (`.todo-row__meta`). Die Karte war die einzige Fläche ohne diesen Umbruch — und damit die
   Abweichung, nicht die Regel.
2. Der Umbruch war **nicht nur die bessere Wahl, sondern die einzige zulässige**. Eine Kopfzeile,
   die nicht umbrechen darf, verletzt bei vergrößerter Schrift drei Erfolgskriterien der WCAG 2.2
   (Abschnitt 2.2). Das ist kein Geschmacksurteil, und deshalb gibt es hier auch keine Abwägung
   gegen „ruhiger sieht einzeilig aus".
3. Die vier Zusagen aus T-144 Abschnitt 8.2 bleiben unberührt: ein Element, immer das absolute
   Datum, abwesend ohne Frist, nur zwei der drei Zustände laut. Der Umbruch ändert die Zeilenzahl,
   nicht die Marke. Geprüft, nicht geglaubt — Abschnitt 6.

---

## 1. Wozu die Kopfzeile da ist — Hierarchie vor Mittel

Die Karte ist nach A-5.5 die Arbeitsfläche des Boards. Sie beantwortet in dieser Rangfolge:

| Rang | Frage | Träger auf der Karte |
|---|---|---|
| 1 | **Was ist das?** | der Titel (`.kcard__title`, `--text-sm`, halbfett, der einzige Knopf, der das Todo öffnet) |
| 2 | **Woran erkenne ich es wieder?** | die Call-Nummer — Identität, nicht Zustand |
| 3 | **In welchem Zustand ist es?** | das Erledigt-Kennzeichen; dazu der Exportstand im Fuß |
| 4 | **Wann muss es fertig sein?** | die Frist, wenn eine gesetzt ist |
| 5 | **Wieviel steckt schon drin?** | erfasste Zeit und Status im Fuß |

Die Kopfzeile trägt Rang 2 bis 4. Sie steht **über** dem Titel, weil sie ihn qualifiziert und nicht
ersetzt; sie ist deshalb durchgängig eine Stufe leiser als er (`--text-2xs` gegen `--text-sm`,
gedämpfte Farbe bei Call-Nummer und offenem Kennzeichen).

**Daraus folgt die Leitfrage dieses Papiers, und sie ist nicht „wie bringe ich drei Marken in eine
Zeile":** Welche der drei darf die Zeile verlassen, ohne dass die Rangfolge kippt?

---

## 2. Warum die einzeilige Kopfzeile nie zur Wahl stand

### 2.1 Sie war im erlaubten Bereich kaputt, nicht am Rand

Gemessen von frontend-dev in Chromium, am selben Baustein und denselben Stilblättern wie S-04:

| | Wert |
|---|---|
| zulässige Spaltenbreite (`.board`, `grid-auto-columns: minmax(17rem, 21rem)`) | **272 bis 336 px** |
| Überlauf vorher, Gestaltung „classic" | ab **308 px** abwärts |
| Überlauf vorher, Gestaltung mit größerer Metadatenschrift | ab **324 px** abwärts |
| 20 Gestaltungen × hell/dunkel × zwei Dichten bei 272 px | **80 von 80 mit Befund → 0 von 80** |
| Kopfzeilenhöhe mit drei Marken, lange Call-Nummer | **49,5 → 41 px** |

Bei der Mindestbreite lag der Fehler **immer** vor. Eine Gestaltung, die bei der kleinsten
zulässigen Ausprägung ihrer eigenen Regel nie funktioniert, ist keine Gestaltung, sondern ein
Versehen mit einem Kommentar daneben.

**Was der Benutzer sah, ist schlimmer als „eng".** Die Spalte hat auf dem Board zusätzlich
`overflow: hidden` (`viewport-layout.css:77`). Der Überlauf wurde dort **abgeschnitten** — aus
„Überfällig 22.07.2026" wurde „⚠ Überfällig 22.07", und der Rest lag unter der Abspieltaste. Ein
abgeschnittenes Datum sieht nicht kaputt aus. Es sieht aus wie ein Datum. Das ist der teure Teil:
Der Fehler war für den Leser **unsichtbar**, und er saß ausgerechnet an dem Wert, dessen ganzer
Zweck die Planung ist.

### 2.2 Drei Erfolgskriterien, die eine nicht umbrechende Kopfzeile bricht

Der eigentliche Grund, aus dem hier nichts abzuwägen war:

* **SC 1.4.4 (Textgröße ändern, AA).** Alle Schriftgrößen stehen in `rem`. Erhöht der Benutzer die
  Grundschrift, wächst die Kopfzeile, die Spalte nicht — sie ist in `rem` gedeckelt. Ohne Umbruch
  ist die Folge Inhaltsverlust, und Inhaltsverlust ist genau das, was das Kriterium verbietet.
* **SC 1.4.10 (Reflow, AA).** Inhalt muss sich bei 320 px Breite beziehungsweise 400 % Vergrößerung
  ohne zweidimensionales Rollen umformen. Eine Zeile, die nicht umbrechen darf, kann das nicht.
* **SC 1.4.12 (Textabstand, AA).** Erhöhte Buchstaben- und Wortabstände dürfen keinen Inhalt
  kosten. `.kcard__call` trägt bereits `letter-spacing: var(--tracking-wide)`; die Fläche reagiert
  also nachweislich auf Abstandsänderungen.

Alle drei fallen mit derselben Regel, und **kein** Wert an Schriftgröße, Polsterung oder
Spaltenbreite repariert sie: Solange die Zeile nicht umbrechen darf, verschiebt jede Zahl nur die
Schwelle, an der abgeschnitten wird.

### 2.3 Die Auswege, die nicht gangbar sind — damit sie nicht als Fund zurückkommen

| Ausweg | Warum nicht |
|---|---|
| **Kürzen** (`text-overflow`, `line-clamp`) | Eine Frist, die als „Überfäl…" endet, sieht richtig aus und ist es nicht. Ein gekürztes Datum ist der einzige Anzeigefehler, den der Leser nicht bemerken kann. Verboten als Regel K-3 |
| **Die Marke verkleinern** | `--text-2xs` ist bereits die kleinste Schrift des Hauses. Kleiner heißt unlesbar, und die Gestaltung „clear" geht ausdrücklich in die **andere** Richtung (11 → 12 px, `supertakt-layout.md`) |
| **Nur das Symbol, Wort weg** | Nimmt fünf der sechs Merkmale aus T-144 auf zwei herunter und wirft die Unterscheidung auf Farbe und Symbolform zurück. Verstößt gegen die erste Auflage („immer das absolute Datum") |
| **Die Spalte breiter machen** | Verschiebt die Schwelle und hebt sie nicht auf; kostet bei vier Spalten eine ganze Spalte Bildschirm; und 2.2 fällt trotzdem |
| **Feste Kartenhöhe** | Es gibt keine, es darf keine geben. Eine Karte mit Deckel schneidet bei der nächsten Schriftvergrößerung Tags oder Fuß ab |

---

## 3. Urteil zur Fläche: die zweizeilige Kopfzeile trägt

Sechs Gründe, in absteigender Tragkraft:

1. **Sie ist die Hausregel und keine neue Richtung.** Dieselben drei Marken, dieselbe Reihenfolge,
   derselbe Umbruch wie in S-02. Wer die Karte anders löste als die Zeile, hätte für dieselbe
   Information zwei Leseregeln gebaut — der teuerste Fehler in einem Produkt, in dem der Benutzer
   zwischen S-02 und S-04 hin und her springt.
2. **Die zweite Zeile steht am richtigen Ort.** Bricht die Frist um, landet sie **unmittelbar über
   dem Titel**. Die dringlichste Angabe rückt damit näher an das Ding, das sie betrifft, nicht
   weiter weg. Das ist nicht die Notlösung, sondern eine Verbesserung, die uns die Not geschenkt
   hat.
3. **Die Karte wird kürzer, nicht länger.** Ohne Umbruch musste die Call-Nummer schrumpfen und brach
   an ihren Bindestrichen dreizeilig um (49,5 px). Mit Umbruch steht sie wieder in einer Zeile und
   die Kopfzeile misst 41 px. Der Einwand „zwei Zeilen kosten Platz" ist am Beispielbestand
   **gemessen falsch**.
4. **Sie kostet nichts an Ruhe, weil sie selten auftritt.** Die dritte Marke ist die einzige, die
   fehlen darf (A-19.5). Karten ohne Frist — die Mehrzahl — behalten die einzeilige Kopfzeile von
   18,5 px, unverändert. Zweizeilig wird nur, was drei Marken **und** eine schmale Spalte hat.
5. **Kein Vertragspunkt wird berührt.** Kein zugänglicher Name, keine Beschriftung, kein
   Fokusziel, keine Reihenfolge im Baum, kein Farbwert. `contrast` unverändert 0 von 522.
6. **Die vier Zusagen aus T-144 Abschnitt 8.2 halten.** Einzeln nachgesehen in Abschnitt 6.

**Die Frist zieht deshalb nicht um** — weder unter den Titel noch in den Fuß der Karte. Beides wäre
teurer als das Problem: Unter dem Titel stünde sie **nach** dem Ding, dessen Dringlichkeit sie
angibt, und zerschnitte den Block aus Titel, „Steht auch in" und Tags. Im Fuß stünde sie neben
Exportstand und erfasster Zeit, also in der Zeile, die **Vergangenheit** berichtet — die Frist ist
die einzige Angabe der Karte, die in die Zukunft zeigt. Und beides ergäbe eine dritte Leseregel
gegenüber S-02, siehe Grund 1.

---

## 4. Die Rangfolge — die eigentliche Frage, und die einzige, die nur hier beantwortet werden kann

Sobald eine Zeile umbrechen darf, ist ihre Reihenfolge keine Schreibweise mehr, sondern eine
Gestaltentscheidung: **die letzte Marke ist die, die umbricht.** Heute lautet die Folge
Call-Nummer → Erledigt-Kennzeichen → Frist. Sie ist so entstanden, wie Reihenfolgen entstehen —
durch Anbauen. Ab jetzt ist sie begründet.

### 4.1 Regel K-1 — die Rangfolge der Kopfzeile

> **Regel K-1.** In der Kopfzeile der Kanban-Karte stehen die Marken in dieser Folge:
> **Call-Nummer, Erledigt-Kennzeichen, Frist.** Vier Kriterien tragen sie, und sie zeigen alle in
> dieselbe Richtung:
>
> 1. **Identität vor Zustand vor Termin.** Was es ist, dann wie es steht, dann wann es fällig ist.
> 2. **Konstant vor optional.** Die Marke, die fehlen darf, steht hinten — sonst wandert der
>    Zeilenanfang von Karte zu Karte.
> 3. **Schmal vor breit.** Die breiteste Marke zuletzt: In einem umbrechenden Kasten erzeugt sie
>    dort die wenigsten Zeilen und füllt die zweite Zeile aus, statt die erste allein zu belegen.
> 4. **Unveränderlich vor täglich wechselnd.** Die Frist ist die einzige Marke, die sich **ohne
>    Zutun des Benutzers** ändert (um Mitternacht, E-025). Steht das Bewegliche hinten, bewegt es
>    nur sich selbst; steht es vorn, verschiebt es jede Nacht die beiden anderen.

Gerechnet am Kastenmodell, nicht gemessen (E-087): Bei 272 px Spalte bleiben der Kopfzeile rund
190 px — Spalte abzüglich Spaltenpolsterung (2 × 8), stehendem Rollbalkenplatz
(`scrollbar-gutter: stable`), Kartenrahmen und -polsterung (2 × 1 + 2 × 8), Lücke und Aktionsspalte.
Die drei Marken brauchen zusammen rund 300 px, die Frist allein rund 140. Zwei Zeilen sind also
nicht knapp, sondern deutlich — und die Frist füllt die zweite Zeile fast aus. Genau so soll es
sein: Eine zweite Zeile, die zu einem Drittel gefüllt ist, sieht nach Versehen aus.

### 4.2 Die geprüfte Gegenvariante: die Frist zuerst

Der Einwand ist ernst zu nehmen und lautet: *Auf einem Board wird nach Dringlichkeit gescannt, also
gehört die Frist an die erste Stelle.* Vier Gründe dagegen:

* **Dringlichkeit trägt hier die Lautstärke, nicht der Platz.** T-144 hat die drei Fristzustände
  ausdrücklich über sechs Merkmale gebaut — Wortlaut, Datum, Symbol, Füllung, Schriftschnitt,
  Farbe. Eine voll gefüllte rote Marke mit Warndreieck wird in einer 190 px breiten Kopfzeile
  gefunden, ob sie an erster oder dritter Stelle steht. Position wäre ein **siebtes** Merkmal für
  einen Zustand, der schon sechs hat — und zugleich das einzige, das die beiden anderen Marken
  verschiebt.
* **Die erste Stelle gehört nicht der lautesten Angabe, sondern der stetigsten.** Eine Spalte
  Karten wird senkrecht überflogen. Was am Zeilenanfang steht, bildet die Scanspalte. Steht dort
  eine Marke, die auf der Mehrzahl der Karten **fehlt**, ist die Scanspalte keine.
* **Die dritte Auflage aus T-144 kippt.** „Nur zwei der drei Zustände sind laut" war die Bedingung,
  unter der die dritte Markenfamilie überhaupt zugelassen wurde — damit das Board keine Wand aus
  Etiketten wird. Eine rote Fläche in der oberen linken Ecke **jeder** überfälligen Karte,
  unmittelbar über dem Titel und vor allem anderen, ist diese Wand. Der Buchstabe der Auflage wäre
  gehalten, ihr Zweck verfehlt.
* **Sie verschlechtert den Umbruch mechanisch.** Steht die breiteste Marke vorn, belegt sie die
  erste Zeile fast allein und schiebt zwei schmale Marken in die zweite: dieselben zwei Zeilen,
  beide schlechter gefüllt, und der Zeilenanfang springt zusätzlich zwischen Datum und Nummer.

### 4.3 Die zweite geprüfte Gegenvariante: das Erledigt-Kennzeichen zuerst

Es ist die einzige Marke, die auf **jeder** Karte steht — nach Kriterium 2 also ein Anwärter auf
den Zeilenanfang. Trotzdem nein:

* Die Call-Nummer ist die **Identität** des Vorgangs, und Identität steht vor Zustand. In einem
  Dienstleistungsbestand ist die Call-Nummer häufig der Wiedererkennungswert, nicht der Titel.
* Der Regelfall des Kennzeichens flüstert („Offen", gedämpfte Kontur). Eine geränderte Pille an den
  Zeilenanfang zu setzen und die Identität dahinter, hieße: erst der Zustand, dann wovon.
* S-02 macht es seit T-045 genauso (Call, Status, Erledigt, Frist). Grund 1 aus Abschnitt 3 gilt
  unverändert.

**Ein Nebenbefund, der dagegen zu sprechen scheint und es nicht tut:** Die Call-Nummer darf
ebenfalls fehlen (Todos ohne Call). Dann beginnt die Kopfzeile mit dem Kennzeichen. Das ist
hinnehmbar, weil die Folge **stabil** bleibt: Es fällt etwas weg, nichts tauscht den Platz. Genau
diese Eigenschaft — eine feste Folge mit Lücken statt einer Folge nach Wichtigkeit — ist der Grund,
warum die Scanspalte trotzdem trägt.

### 4.4 Regel K-2 — die Innenlücke eines umbrechenden Markenblocks

frontend-dev hat die Zeilenlücke auf `--space-1` (4 px) gesetzt, gegen `--space-2` (8 px) in der
Spalte, und die Entscheidung als Annahme markiert. **Ich bestätige sie, und sie ist nicht Feinheit,
sondern rechenbar:**

`.kcard__main` stapelt seine Blöcke — Kopfzeile, Titel, „Steht auch in", Tags, Fuß, Status — mit
`gap: var(--space-2)`, also 8 px. Wäre die Zeilenlücke **innerhalb** der Kopfzeile ebenfalls 8 px,
stünde die zweite Kopfzeile genau so weit von der ersten wie vom Titel: Der Block löste sich auf,
und die Frist läse sich als eigene Angabe über dem Titel statt als Teil des Kopfes.

> **Regel K-2.** Die Zeilenlücke eines umbrechenden Markenblocks ist **strikt kleiner** als die
> Lücke des Stapels, in dem er steht. Heute: `row-gap: var(--space-1)` gegen
> `column-gap: var(--space-2)` innen und `gap: var(--space-2)` außen. Wer den äußeren Wert ändert,
> prüft den inneren mit.

### 4.5 Regel K-3 und K-4 — nie kürzen, und was die Faltung der Marke selbst ist

> **Regel K-3.** Keine der drei Marken wird gekürzt. Kein `text-overflow`, kein `line-clamp`, kein
> `overflow: hidden` an ihnen oder an der Kopfzeile. Eine Marke, die nicht passt, bricht um; eine
> Marke, die auch dann nicht passt, faltet sich (K-4). Abgeschnitten wird nichts, weil ein
> abgeschnittenes Datum und ein richtiges Datum gleich aussehen.

> **Regel K-4.** Die Faltung der Fristmarke selbst — Zustandswort über Datum, `.kcard__deadline`
> mit `flex-wrap: wrap` — ist ein **Rückfall unterhalb des zulässigen Bereichs**, kein
> Entwurfszustand. Bei 272 px tritt sie nicht ein; gemessen tritt sie erst unterhalb der
> Mindestbreite der Spalte auf. Sie darf deshalb weder als Argument für schmalere Spalten dienen
> noch gestalterisch ausgebaut werden. Sie ist die Zusicherung, dass auch der unvorhergesehene
> Fall lesbar bleibt — mehr nicht.

### 4.6 Was die Rangfolge **nicht** sein darf

`flex-wrap` sortiert nicht um; die sichtbare Folge ist die Folge im Baum. **Das muss so bleiben:**
`order`, `row-reverse` oder eine andere visuelle Umsortierung träfe SC 1.3.2 (Bedeutungstragende
Reihenfolge) — eine Vorlesehilfe läse dann eine andere Folge, als das Auge sieht. Regel K-1 gilt
deshalb für den Baum, und die Darstellung folgt ihm. Wer die Rangfolge ändern will, ändert die
Reihenfolge in `Kanban.tsx`, nicht eine CSS-Eigenschaft.

---

## 5. Zustände

| Zustand | Was gilt |
|---|---|
| **Ruhe, ohne Frist** | Zwei Marken, eine Zeile, 18,5 px. Der Regelfall, unverändert. Es gibt keine Marke „ohne Frist" (A-19.5) |
| **Ruhe, mit Frist, breite Spalte** | Drei Marken, eine Zeile |
| **Ruhe, mit Frist, schmale Spalte** | Drei Marken, zwei Zeilen, 41 px. Die Frist steht links in der zweiten Zeile, bündig unter der Call-Nummer |
| **Leer** | Die Karte hat keinen Leerzustand. Leer ist die Spalte, und dafür steht der Spaltenleerzustand |
| **Laden** | `AsyncBoundary` mit Spaltenskelett, unberührt. Die Kopfzeile hat kein eigenes Ladebild |
| **Zeiger** | `.kcard:hover` (Rahmen, Schatten) und der Titelknopf unterstreicht. Die Kopfzeile selbst reagiert nicht — sie enthält kein Bedienelement |
| **Fokus** | Drei Ziele in unveränderter Folge: Titelknopf → Timerknopf → Kartenmenü. Die Kopfzeile liegt außerhalb; der Ring wird von der umgebrochenen Zeile nicht angeschnitten (nachgesehen in T-281) |
| **Aktiv** | unberührt |
| **Laufender Timer** (`.kcard--running`) | Randschiene 3 px, Polsterung links um 2 px vermindert. Die Kopfzeile verliert dadurch 1 px Breite — ohne Wirkung, die zweite Zeile hat rund 50 px Luft |
| **Erledigt / Erledigt aufgehoben** | Titel durchgestrichen beziehungsweise Kartenrahmen gestrichelt; das Kennzeichen wechselt Wort, Symbol und Ausprägung. Die Kopfzeile kann dabei die Zeilenzahl wechseln, weil „Erledigt aufgehoben" das längste der drei Wörter ist. Zulässig: Der Wechsel ist eine Benutzerhandlung mit sichtbarer Ursache |
| **Mitternachtswechsel** | „Heute fällig" → „Überfällig" ändert Breite und unter Umständen die Zeilenzahl. Alle Karten wechseln im selben Augenblick (`useToday`), also springt das Board einmal und nicht kartenweise. **Keine Animation** — siehe Abschnitt 7 |
| **Fehler / Bestätigung** | Die Karte hat keine eigene Melde- oder Rückfragefläche, und sie bekommt keine |

---

## 6. Die vier Zusagen aus T-144 Abschnitt 8.2, einzeln nachgesehen

| Zusage | Stand nach dem Umbruch |
|---|---|
| **Ein Element, nicht drei** | unberührt. `DeadlineFlag` bleibt ein Baustein; der Umbruch liegt am Elternkasten |
| **Immer das absolute Datum** | unberührt und **jetzt erst wahr**: Bis T-281 wurde das Datum am Spaltenrand abgeschnitten. Die Zusage stand im Quelltext und war auf dem Board nicht eingelöst |
| **Abwesend ohne Frist** | unberührt. `DeadlineFlag` gibt `null` zurück; ohne Frist entsteht kein Knoten und damit auch kein Umbruch |
| **Nur zwei der drei Zustände laut** | unberührt. „Später fällig" bleibt ohne Fläche, ohne Rahmen, in normaler Schrift — und es ist zugleich die schmalste Ausprägung, bricht also am seltensten um. Die laute Ausprägung ist die breite: Genau die Zusatzzeile entsteht dort, wo etwas dran ist |

Der zugängliche Name ist unverändert (`role="img"`, „Überfällig — Frist: 05.09.2026"); er liegt am
Hüllelement und ist von Umbruch und Faltung unabhängig.

---

## 7. Bewegung

**Keine.** Weder beim Umbruch noch beim Mitternachtswechsel noch beim Wechsel des
Erledigt-Kennzeichens wird eine Höhe übergeblendet. Begründung in einem Satz: Eine Höhenblende an
einer Karte bewegt alle Karten unter ihr, und eine Bewegung, die `prefers-reduced-motion` ohnehin
wegnimmt, hat nie getragen (U-3 aus T-171). `.kcard` behält seine beiden bestehenden Übergänge auf
Schatten und Rahmenfarbe; **kein** `transition` auf Höhe, Breite oder Abstände.

---

## 8. Responsives Verhalten

| Breite / Einstellung | Was gilt |
|---|---|
| Spalte **336 px** (Höchstwert) | Drei Marken in einer Zeile, in der Regel |
| Spalte **308 bis 336 px** | Übergangsbereich: Bei langen Call-Nummern oder der Gestaltung mit größerer Metadatenschrift bricht die Frist um |
| Spalte **272 bis 308 px** | Zweizeilige Kopfzeile, sobald drei Marken da sind. **Der Regelfall bei vier und mehr Spalten** |
| unter **272 px** | Kommt aus `.board` nicht vor. Gemessen trägt der Umbruch bis 240 px; darunter greift K-4 |
| **Dichte** (`comfortable` / `compact`) | Die Dichte ändert Zeilenhöhen, nicht die Metadatenschrift. Die Kopfzeile verhält sich in beiden gleich; in beiden gemessen |
| **Gestaltung** | Die Farbthemen ändern ausschließlich Farben. Genau **eine** Gestaltung ändert eine Schriftgröße (`clear`: `--text-2xs: 0.75rem`), und sie verschiebt die Umbruchschwelle von 308 auf 324 px. Deshalb war das Messen aller Gestaltungen richtig, siehe Befund B-2 |
| **Hoher Kontrast** | `prefers-contrast: more` verbreitert nur den Fokusring und verschiebt drei Farben. Keine Wirkung auf die Kopfzeile |
| **Vergrößerte Schrift / Reflow** | Der Grund für den Umbruch, Abschnitt 2.2. Die Kopfzeile darf beliebig viele Zeilen bekommen; die Karte hat keine feste Höhe und bekommt keine |

---

## 9. Übergabe an frontend-dev

**Es ist nichts zu bauen.** Der Stand aus T-281 ist die Umsetzung dieser Entscheidung; ich bestätige
ihn einschließlich der Zeilenlücke. Was übergeben wird, ist ein Kommentarsatz und eine Sperre.

### 9.1 Der eine Satz, um den der Kommentar an `.kcard__top` wächst

Der Kommentar dort erklärt heute vollständig, **warum** umgebrochen wird. Er sagt nicht, **warum in
dieser Reihenfolge** — und das ist die Stelle, an der der nächste Durchgang „aus Dringlichkeit" die
Frist nach vorn zieht und damit Auflage 3 aus T-144 aushebelt. Vorschlag im Wortlaut
(Umlautschreibung wie in der Datei üblich), anzufügen an den bestehenden Block:

```
/* Die Reihenfolge ist entschieden und nicht gewachsen (T-283 Regel K-1):
   Call-Nummer, Erledigt-Kennzeichen, Frist — Identitaet vor Zustand vor
   Termin, konstant vor optional, schmal vor breit, unveraenderlich vor
   taeglich wechselnd. Die letzte Marke ist die, die umbricht; die Frist
   landet dadurch unmittelbar ueber dem Titel. Sie **nicht** nach vorn
   ziehen: Eine volle rote Flaeche in der oberen linken Ecke jeder
   ueberfaelligen Karte ist die Wand aus Etiketten, gegen die T-144
   Abschnitt 8.2 Auflage 3 geschrieben ist. Umsortiert wird, wenn ueberhaupt,
   im Baum (`Kanban.tsx`) — nie ueber `order`, das trennt Lese- von
   Sehreihenfolge (SC 1.3.2). */
```

### 9.2 Gesperrt an dieser Fläche

1. **Kein Kürzen** an `.kcard__call`, `.kcard__flag`, `.kcard__deadline` oder `.kcard__top`
   (K-3). Der Prüfsatz dazu steht bereits in `kanbanCardHeader.test.ts` und bleibt.
2. **Keine feste Höhe** an `.kcard`, `.kcard__main` oder `.kcard__top`; `min-height: 1rem` an der
   Kopfzeile ist ein Boden und bleibt einer.
3. **Keine visuelle Umsortierung** (`order`, `row-reverse`), siehe 4.6.
4. **Die Zeilenlücke bleibt kleiner als die Lücke von `.kcard__main`** (K-2).
5. **Die Faltung der Fristmarke wird nicht ausgebaut** und nicht als Argument für schmalere Spalten
   benutzt (K-4).

### 9.3 Was ausdrücklich **nicht** verlangt wird

Keine neue Klasse, kein Token, keine Umbruchmarke, kein `@container`. Insbesondere **kein**
Zustand „Kopfzeile zweizeilig" als Klasse: Der Umbruch ist eine Folge der Breite und keine
Eigenschaft der Karte; eine Klasse dafür wäre ein zweiter Ort, an dem dieselbe Wahrheit steht.

---

## 10. Übergabe an e2e-tester und unit-tester

* **Der Fall, den frontend-dev vorgeschlagen hat, ist aus meiner Sicht der richtige** und sollte
  angelegt werden: drei Marken, Spalte auf Mindestbreite, gemessen statt angesehen — jedes Kind von
  `.kcard__top` innerhalb von `.kcard__main`, keine Überschneidung mit `.kcard__actions`, dazu
  `scrollWidth <= ceil(clientWidth)` an der Marke. Der zweite Teil ist der wichtigere: Er fängt ein
  späteres Kürzen ab, das die erste Bedingung grün ließe.
* **Ein Satz fehlt darin, und er kommt aus diesem Papier:** die **Reihenfolge**. Regel K-1 ist eine
  Entscheidung, die ohne Prüfsatz nur ein Kommentar ist. Meßbar ohne Browser: Die Kinder von
  `.kcard__top` stehen im Baum in der Folge `.kcard__call`, `.kcard__flag`, `.deadline`. Das ist
  ein Einheitentest, kein E2E-Fall — Hoheit unit-tester.
* **Kein Prüfsatz auf Pixelhöhen** (41 px, 18,5 px). Diese Zahlen sind Stand, nicht Zusage; sie
  hängen an Schriftmetrik und Engine. Dieselbe Trennung wie P-3 in `traeger-und-zusage.md`.

---

## 11. Befunde

**B-1 — Die meistgelesene Fläche des Boards hatte kein Gestaltpapier.** Weder `docs/design/**` noch
`apps/web/design/DESIGNSYSTEM.md` beschreibt den Aufbau der Kanban-Karte; das Designsystem nennt
sie nur in der Bausteintabelle. Die Folge war sichtbar: Eine Annahme über die Zeilenzahl konnte
zwei Jahre lang in einer CSS-Regel wohnen, ohne je als Entscheidung geprüft worden zu sein. Dieses
Papier deckt die Kopfzeile ab, **nicht** die übrige Karte (Titel, „Steht auch in", Tags, Fuß,
Status). Wer dort etwas ändert, hat weiterhin kein Papier.

**B-2 — Die Gestaltung `clear` ist nicht mehr wählbar, ihre Token-Überschreibung wirkt trotzdem.**
`themePresets.ts` bildet `clear` beim Setzen auf `classic` ab; das Attribut
`data-design-theme="clear"` entsteht aus der Anwendung nicht mehr. Der frühe Startskript
(`apps/web/public/startup-appearance.js`) übernimmt den Wert dagegen **ungeprüft gegen die Liste**
aus dem Zwischenspeicher (`/^[a-z-]{1,40}$/`) — ein alter Eintrag setzt `clear` also für die Zeit
bis zum Hochlauf der Anwendung. Damit ist `--text-2xs: 0.75rem` aus `tokens.css:656-659` kurzzeitig
wirksam, und die Messung bei 324 px war **kein** Messen einer toten Fläche. Für die Gestaltung
ändert sich dadurch nichts; für die Aufräumfrage „ist der `clear`-Block tot?" lautet die Antwort
**nein, nicht ganz** — und das gehört benannt, bevor jemand ihn streicht. Kein Auftrag von mir.

**B-3 — Der unabhängige Abnahmeblick fehlt weiter.** `visual-qa` steht in dieser Sitzung nicht zur
Verfügung. Meine Beurteilung stützt sich auf die gerechnete 80er-Prüfung von T-281, auf das
Kastenmodell in 4.1 und auf den Quelltext. **Ich habe nicht auf den Bildschirm gesehen.** Was hier
über Höhen und Breiten steht, ist übernommene Messung beziehungsweise eigene Rechnung, nicht eigene
Anschauung — und das ist bei einer Gestaltentscheidung eine echte Grenze, auch wenn das Urteil
selbst an Regeln hängt und nicht an einem Eindruck.

---

## 12. Offene Fragen an den Orchestrator

1. **Gehört die übrige Karte in dieses Papier?** B-1 betrifft mehr als die Kopfzeile. Ich habe den
   Auftrag nicht überdehnt; ein Papier über die ganze Karte wäre eine eigene Aufgabe.
2. **Soll K-1 bis K-4 in `apps/web/design/DESIGNSYSTEM.md` gespiegelt werden?** Die Datei gehört
   frontend-dev. Ich halte einen Zeiger für richtig und die Verdopplung des Wortlauts für falsch —
   entschieden wird es nicht von mir.
3. **B-2, der `clear`-Block:** aufräumen, härten (Liste statt Formprüfung im Startskript) oder
   stehen lassen? Keine dieser drei Antworten ist Gestaltung.
