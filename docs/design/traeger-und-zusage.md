# Träger und Zusage — was ohne Farbe trägt, zwei Wege zu einer Fläche, und was `poolRule.ts` hält

**Aufgabe:** T-194, Welle AC. **Verfasser:** ui-designer.
**Grundlage:** `.claude/team/reports/T-189-security-checker.md` Punkt 2 (Befunde T-189-5 bis
T-189-7, Auflagen A-A-44 und A-A-45), Board O-GU, O-HA, O-GB, E-016, E-076 Punkt 3, E-078 samt
Nachtrag Punkt 8, E-087, R-08, R-10, WCAG 2.2 SC 1.4.1, 1.4.3 und 1.4.11,
`packages/ui-tokens/tokens.css`, `apps/web/scripts/contrast-check.mjs`,
`apps/web/src/styles/components.css`, `components/ExportStatus.tsx`, `components/NoteField.tsx`,
`lib/poolRule.ts`, `apps/web/design/DESIGNSYSTEM.md`, `docs/design/textbestand.md` 1.2 (fremde
Hoheit, hier nur gelesen).

**Was dieses Papier ist.** Zwei Sätze im Quelltext machen eine Barrierefreiheitszusage, die die
Messung widerlegt. security-checker hat gemessen und die Entscheidung ausdrücklich nicht getroffen;
sie steht hier. Je Stelle steht: neuer Wert **oder** neuer Satz, die Paare, die
`contrast-check.mjs` danach prüfen muß, und was ein Benutzer sieht, der Farben nicht unterscheiden
kann. Dazu die Einordnung der übrigen ungemessenen Farben, das Urteil über den doppelten Weg im
Board-Leerzustand und die Feststellung, was `lib/poolRule.ts` gestalterisch trägt.

**Was dieses Papier nicht ist.** Kein Neuentwurf, kein neues Token, keine neue Farbe — im
Gegenteil, ein Token fällt weg. Kein Produktivcode wird von mir geändert. Alle Werte unten stehen
bereits in `packages/ui-tokens/tokens.css`.

**Rechenweg und seine Herkunft (E-087).** Die Verhältnisse aus T-189 sind von security-checker
gerechnet. Die Zahlen, die in diesem Papier **neu** dazukommen — die zwei Deckelwerte in 1.2, die
zwei Fenster in 2.2 und die Schienenwerte in 2.5 —, habe ich mit derselben WCAG-Formel von Hand
gerechnet und gegen zwei bekannte Werte gegengeprüft (`--status-reopened-hatch` gegen
`--status-reopened-bg` ergibt 1,24; `--note-billing-rail` gegen `--note-internal-rail` ergibt 1,71
— beide zeichengleich mit T-189). Sie sind damit **gerechnet, nicht vom Lauf gemessen**. Was der
Lauf sagt, sagt der Lauf, sobald die Paare aus Abschnitt 6 darin stehen.

---

## 0. Der Maßstab: wann darf ein Merkmal Träger heißen

Drei Stufen. Sie sind der Grund, aus dem beide Entscheidungen unten verschieden ausfallen, obwohl
der Befund derselbe ist.

| Stufe | Was sie bedeutet | Was sie verlangt |
|---|---|---|
| **Träger** | Ohne dieses Merkmal ist der Zustand nicht erkennbar | ein Paar in `contrast-check.mjs` mit Mindestwert — oder, wenn das Merkmal **Form** ist, **zwei** Angaben: das gemessene Verhältnis zwischen Form und Grund (Balken gegen Lücke) **und** der Nachweis, daß die Form überhaupt entsteht (**T-8**, hergeleitet in 2.8). Das zweite ist seit T-236 **keine Rechnung, sondern eine Messung an dieser Rahmenbreite** — eine Faustformel dafür gab es, sie war an einem zurückgerechneten Punkt bestätigt und für die zweite Engine falsch |
| **Verstärkung** | Der Zustand ist ohne dieses Merkmal erkennbar; es hilft dem, der es sieht | ein Paar mit **Obergrenze** statt Untergrenze: die Verstärkung darf nichts kaputtmachen, was trägt |
| **Zierde** | Sagt nichts | eine benannte Ausnahme mit der gemessenen Zahl und dem Grund |

**Die zweite Angabe in der ersten Zeile ist in T-233 dazugekommen, und sie berichtigt einen
Fehlschluß dieser Tabelle.** Bis dahin galt: ein Formmerkmal ist gemessen, sobald das Verhältnis
Balken gegen Lücke dasteht. Das Verhältnis sagt aber nur, **wie deutlich** die Form ist, wo sie
entsteht — nicht, **ob** sie entsteht. Eine gestrichelte Schiene, die die Engine als **einen**
Strich zeichnet, hat ein tadelloses Verhältnis und keine einzige Lücke. Die Herleitung mit den
gemessenen Zahlen steht in 2.8.

**Regel T-1.** Ein Merkmal darf in einem Kommentar, im Designsystem oder auf der Musterseite nur
dann als Träger gezählt werden, wenn ein Paar es mißt. Ein Satz, der SC 1.4.1 zitiert, ist eine
Zusage; eine Zusage ohne Messung ist genau der Fehler, den E-087 benennt.

**Regel T-2 — der Deckel über jedem Muster unter Text.** Liegt Text auf einer Musterung, ist die
Stärke der Musterung durch die Lesbarkeit des Textes **nach oben** begrenzt. Der Text muß 4,5:1
gegen die dunkelste (im dunklen Thema: hellste) Stelle des Musters halten (SC 1.4.3, konservativ
gelesen). Daraus folgt für jede Fläche ein rechenbarer Höchstwert des Musters. Abschnitt 1.2
rechnet ihn.

**Regel T-3 — zwei Schienen desselben Bauteils.** Müssen zwei Flächen desselben Bauteils **beide**
3:1 gegen denselben Untergrund halten (SC 1.4.11), so ist der Raum, in dem ihre Helligkeiten liegen
dürfen, in einem der beiden Themen so eng, daß sie sich voneinander nur noch trennen lassen, wenn
eine von beiden lauter wird als alles andere in diesem Thema. Abschnitt 2.2 rechnet das für die
Feldarten aus und zeigt, daß dort das untere Fenster **arithmetisch geschlossen** ist. Wo T-3
greift, trägt die **Form** und nicht die Farbe.

**Die 3:1 zwischen zwei Trägern ist eine Hausentscheidung, kein WCAG-Wert.** SC 1.4.1 nennt keine
Zahl; es verlangt nur, daß Farbe nicht das einzige Mittel ist. Takt braucht aber eine Zahl, weil
nur eine Zahl in den Lauf paßt. Ich setze dafür dieselbe 3:1 an, die das Haus schon für
Zustandsgrenzen benutzt. Wer eine andere Zahl will, ändert sie an einer Stelle, hier.

### 0.1 Die übrigen Regeln dieses Papiers, und wo sie stehen

**T-4** (die drei Nahtstellen eines Doppelrings) steht in 10.1, **T-5** (eine Graustufenzusage ist
eine Kontrastzusage) in 10.8, **T-8** (eine Form hat ein Mindestmaß, und unterhalb davon sagt sie
nicht nichts, sondern das Gegenteil) in 2.8 — alle drei dort, wo sie hergeleitet sind. Die zwei folgenden hängen an
keinem einzelnen Befund, sondern an **jeder** Messung und an **jedem** Papier dieses Ordners.
Deshalb stehen sie hier vorn und nicht am Ende eines Nachtrags.

> **Regel T-6 — nach einem Themenwechsel wird gewartet, sonst mißt man den Übergang.**
> `components.css` legt Übergänge auf die Farben. Wer `data-theme` umsetzt und sofort abzieht oder
> ausliest, mißt eine **Zwischenfarbe**. Das ist keine Vermutung: T-216 hat im ersten Lauf
> `--accent-bg` dunkel als `#5b8cf6` statt `#6091f8` gemessen. **600 ms Wartezeit lösen es**, und
> sie gehören in die Fixtur jeder künftigen Pixel- oder Farbmessung, nicht in die Sorgfalt des
> Messenden. Eine so entstandene Zahl ist nicht falsch abgeschrieben, sondern falsch **entstanden**
> — sie ist von einer richtigen nicht zu unterscheiden und überlebt jede Gegenprobe, die dieselbe
> Fixtur benutzt. Wo eine ältere Messung die Wartezeit nicht hatte, gilt ihr **dunkler** Teil als
> ungeprüft; der helle ist unberührt, weil beim Laden im hellen Thema kein Übergang läuft.
> **Nicht betroffen sind Maße:** Breiten, Höhen und Abstände hängen an keinem Themenblock — dort
> genügt ein Thema (11.7).

> **Regel T-7 — eine Berichtigung steht an der Stelle, die sie berichtigt.** Ein Nachtrag am Ende
> eines Papiers ist die **Herleitung**, nicht der **Ort**. Was verbindlich wird, wird in den
> berichtigten Abschnitt eingetragen; die alte Zahl und der alte Satz verschwinden **dort**. Der
> Nachtrag behält den Zeiger und die Begründung, damit niemand die Berichtigung ein zweites Mal
> herleiten muß. Der Grund ist gemessen und nicht vermutet: Der Nachtrag in
> `textabbau-gestalt.md` 9.11 hat drei verbindliche Sätze gezogen und die zwei Abschnitte, die sie
> berichtigen, drei Wellen lang unberührt gelassen — beide Stellen sagten weiter das Widerlegte
> (O-JZ). **Ein Papier wird abschnittsweise gelesen, nie von vorn.** Dieselbe Bauart wie 2.6 („Fünf
> Stellen sagen denselben Satz. Alle fünf müssen mit"), nur auf das Papier selbst angewandt statt
> auf den Quelltext.

---

## 1. O-GU, erste Stelle — die Schraffur am Etikett „Erneut offen"

### 1.1 Der Befund

`components.css:401-422` sagt über `.badge--reopened`:

> „Erneut offen: Kontur plus Schraffur. Die Schraffur traegt die Unterscheidung auch dann, wenn
> Farbe nicht wahrgenommen wird."

Gemessen (T-189): `--status-reopened-hatch` gegen `--status-reopened-bg` **1,24:1** hell,
**1,45:1** dunkel. Kein Paar prüft den Token. Bei 1,24 ist die Schraffur in Graustufen nicht
schwach, sondern nicht da — und weil das menschliche Auge Farbunterschiede bei feiner Rasterung
(2px Streifen, 3px Lücke) deutlich schlechter auflöst als Helligkeitsunterschiede, ist sie es auch
für den, der Farben sieht. Das Merkmal trägt für **niemanden**.

### 1.2 Entscheidung: der Satz wird zurückgenommen. Kein Wert kann ihn retten

**Der Grund ist nicht Nachlässigkeit, sondern Geometrie.** Auf dem Etikett steht Text
(`--status-reopened-fg`) unmittelbar über der Schraffur. Nach Regel T-2 gilt:

| | hell | dunkel |
|---|---:|---:|
| Beschriftung gegen Füllung, heute | 8,10:1 | 7,11:1 |
| Höchstwert der Schraffur gegen die Füllung, bei dem die Beschriftung noch 4,5:1 hält | **1,80:1** | **1,58:1** |
| Schraffur gegen Füllung, heute | 1,24:1 | 1,45:1 |

Der dunkle Wert ist der entscheidende: **1,45 von möglichen 1,58.** Die Schraffur ist dort bereits
zu 92 Prozent ausgereizt. Selbst der theoretische Höchstwert bliebe weit unter 3:1 und weit unter
allem, was man eine Unterscheidung in Graustufen nennen könnte. Es gibt auf dieser Fläche keinen
Wert, der den Satz wahr macht. Ihn zurückzunehmen ist deshalb die einzige Entscheidung, die
überhaupt zur Wahl steht — die Alternative „Wert berichtigen" existiert hier nicht, und dieser
Rechenweg gehört in den Kommentar, damit sie nicht in zwei Jahren wieder erfunden wird.

**Verworfene Auswege, damit sie nicht als Fund zurückkommen:**

* *Schraffur nur im linken Kappenbereich, wo kein Text liegt.* Bei 8px Breite ergäben sich zwei
  Streifen. Das ist kein Muster, das ist ein Fleck, und er säße unter dem Symbol.
* *Doppelte oder dickere Kontur statt Schraffur.* Die gestrichelte Kontur gehört bereits „Nicht
  abgerechnet" (`components.css:436-439`); eine dritte Konturform auf einer 22px-Pille ist bei
  1px Rahmenstärke nicht zeichenbar.
* *Schraffur weglassen.* Vertretbar — sie kostet ein Token, eine Verlaufszeile und zwei Paare, und
  sie bringt gemessen nichts. Ich behalte sie trotzdem: Sie ist die einzige Ausprägung der
  **Füllung**, die „Erneut offen" von „Offen" unterscheidet, sie schadet nachweislich nichts
  (Abschnitt 6, zweites Paar deckelt sie), und ihr Wegfall zöge drei weitere Dateien nach sich für
  einen Gewinn von null. **Wer sie später streicht, braucht dafür kein Gestaltungspapier mehr** —
  drei Zeilen CSS, ein Token, zwei Paare, fertig. Diese Tür bleibt offen und ist hier benannt.

### 1.3 Der neue Satz

An die Stelle von `components.css:421-422` (Wortlaut als Vorgabe, Umlautschreibung wie in der
Datei üblich):

```
/* Erneut offen: Kontur plus Schraffur. Die Schraffur ist eine **Verstaerkung**
   und kein Traeger: gemessen 1,24:1 hell und 1,45:1 dunkel gegen die eigene
   Fuellung (T-189). Sie kann auch keiner werden — ueber der Schraffur steht die
   Beschriftung, und damit deckelt SC 1.4.3 sie bei 1,80:1 hell und 1,58:1
   dunkel (T-194 Abschnitt 1.2). Ohne Farbe tragen das Symbol (Pfeil zurueck),
   das Wort und die Rautenform des Zeilenpunktes; siehe die Merkmalstabelle in
   `components/ExportStatus.tsx`. Gemessen wird beides in `contrast-check.mjs`:
   die Schraffur als benannte Ausnahme, die Beschriftung ueber ihrem dunkelsten
   Punkt mit 4,5:1. */
```

### 1.4 Was ohne Farbe trägt — und was ein Benutzer sieht, der Farben nicht unterscheidet

Die vier Anzeigezustände unterscheiden sich nach `ExportStatus.tsx:44-49` in sechs Merkmalen. Nach
dieser Entscheidung ist die Zuordnung:

| Merkmal | Träger ohne Farbe? | Warum |
|---|---|---|
| Symbol (`circle`, `check-circle`, `rotate-ccw`, `slash-circle`) | **ja** | vier verschiedene Formen, in `--status-*-fg` gezeichnet, das mit 4,5:1 gegen die Füllung gemessen ist |
| Beschriftung („Offen", „Exportiert", „Erneut offen", „Nicht abgerechnet") | **ja** | vier verschiedene Wörter; bei `iconOnly` als zugänglicher Name erhalten (`ExportStatus.tsx:185-187`) |
| Punktform in der Zeile (Ring, Scheibe, Raute, Balken) | **ja** | Form, kein Farbwert |
| Konturform (durchgezogen gegen gestrichelt) | **ja, aber neben Symbol, Wort und Balken — nicht allein** | trennt den vierten Zustand von den drei übrigen. Die Kontur ist ein **geschlossener** Pfad von rund 69 px Umfang bei 1 px Rahmen, auch in der kleinsten Ausprägung `.badge--icon-only`; **maßgeblich ist die Pfadlänge, nicht die Größe des Bauteils**. **Berichtigt in T-236:** Der Satz von T-233, das sei „das Zwölffache der Schranke aus T-8", ist zurückgenommen — die Schranke, auf die er sich berief, gibt es nicht mehr, und **bei 1 px ist in keiner Engine etwas gemessen** (2.8, Meßauftrag). Bis dahin trägt diese Zeile die Aufzählung **mit**, nie allein |
| Füllung (Kontur, voll, Kontur + Schraffur, gedämpft) | **teilweise** | „Exportiert" ist voll gefüllt und damit auch in Graustufen anders; „Offen" gegen „Erneut offen" ist über die Füllung **nicht** unterscheidbar (die beiden Tönungen liegen bei 1,03:1) |
| Zeilenrand (bernstein, grün, rose, neutral) | **nein** | reine Farbe. Steht ausdrücklich als Farbmerkmal in der Tabelle und darf dort auch stehen — solange die fünf übrigen Zeilen stimmen |

**Ein Benutzer mit Deuteranopie sieht** bei „Offen" und „Erneut offen" zwei nahezu gleich helle,
nahezu gleich getönte Pillen. Was sie ihm auseinanderhält, ist der **Pfeil im Kreis** gegen den
**leeren Kreis** und das Wort daneben — nicht die Farbe, nicht die Tönung, nicht die Schraffur. In
der Kurzform ohne Beschriftung (`badge--icon-only`, 22x22) bleibt das Symbol, und der Name „Erneut
offen" steht im Zugänglichkeitsbaum. Das ist der Fall, in dem R-10 hängt, und er ist gedeckt.

**Was das für die Merkmalstabelle bedeutet:** In `ExportStatus.tsx:48` steht heute in der Spalte
Füllung „Kontur + Schraffur". Der Zusatz bleibt als Beschreibung dessen, was gezeichnet wird, muß
aber im Kopf der Tabelle (`:40-42`: „damit die Unterscheidung nicht an der Farbe haengt und auch
bei Farbfehlsichtigkeit und in Graustufen traegt") entwertet werden: **die Schraffur zählt in
dieser Aufzählung nicht mit.** Ein Halbsatz, mehr nicht — aber wenn er fehlt, steht die widerlegte
Zusage weiter da, nur an einer zweiten Stelle.

---

## 2. O-GU, zweite Stelle — die Schienen von Leistung und Vermerk

### 2.1 Der Befund ist schärfer, als die Zahl aussieht

`components.css:1349-1351` sagt:

> „Zweites Merkmal neben der Farbe: Die Schiene des Leistungsfelds ist gestreift, die des Vermerks
> einfarbig. Der Unterschied bleibt in Graustufen und bei Farbfehlsichtigkeit bestehen (R-08,
> SC 1.4.1)."

Gemessen (T-189): Streifen gegen Schiene **1,76 / 1,98**, die beiden Schienen gegeneinander
**1,71 / 1,31**. Und was die Sache verschärft, steht in unserem eigenen Designsystem,
`apps/web/design/DESIGNSYSTEM.md:704-707`:

> „Zwei 4px-Schienen, die sich nur im Farbton unterscheiden, sind in Graustufen und bei
> Deuteranopie nahezu gleich. Gestreift gegen einfarbig ist es nicht."

**Die Diagnose war richtig, und das Gegenmittel ist demselben Fehler eine Ebene tiefer erlegen:**
Der Streifen unterscheidet sich von seiner Schiene wieder nur im Farbton (`--note-billing-rail`
gegen `--note-billing-rail-stripe`, 1,76:1). Es ist derselbe Fehler in klein. Das ist der Grund,
aus dem die Graustufenprobe auf der Musterseite (`showcase/NotesSection.tsx:42, 69`) ihn nicht
gefunden hat: Sie zeigt beide Felder als Ganzes, und die vier **übrigen** Merkmale — Kopfband,
Marke, Schreibfläche, Fußnote — halten den Vergleich. Eine Sichtprobe, die am Bauteil besteht, weil
andere Merkmale tragen, kann ein einzelnes Merkmal nicht freisprechen. Das ist die Lehre aus dieser
Stelle, und sie gilt über sie hinaus.

Und die Sache wiegt schwerer als die erste: Diese Schiene trennt **Leistung von Vermerk**, also
was beim Kunden auf der Rechnung landet von dem, was in Takt bleibt (E-016, R-08).

### 2.2 Warum kein Farbwert das löst — die Rechnung

Beide Schienen müssen 3:1 gegen die Karte halten, auf der das Feld liegt (SC 1.4.11; für
`--note-internal-rail` steht das seit T-015 als Kommentar am Token). Für das **dunkle** Thema
ergibt das:

* Karte `--bg-surface` hat die relative Leuchtdichte 0,011. Eine Schiene muß darauf mindestens
  0,133 erreichen, sonst hält sie ihre eigenen 3:1 nicht.
* Die Leistungsschiene `--note-billing-rail` (`#6091f8`) liegt bei 0,295. Damit eine zweite Schiene
  sich von ihr um 3:1 unterscheidet, muß sie entweder **über 0,985** liegen (praktisch Weiß) oder
  **unter 0,065**.
* Das untere Fenster ist durch die eigene 3:1-Zusage gegen die Karte **geschlossen** (0,065 liegt
  unter den geforderten 0,133).

Es bleibt Weiß. Eine weiße 4px-Schiene wäre im dunklen Thema das lauteste Objekt des Bildschirms —
und sie säße am **Vermerk**, also an dem Feld, dessen Verwechslung nichts kostet. Die
Rangfolge stünde auf dem Kopf: das harmlose Feld schriee, das teure flüsterte.

**Damit ist die Frage entschieden, nicht abgewogen.** Die Trennung muß die **Form** tragen.

### 2.3 Entscheidung: der Wert wird berichtigt — durchgezogen gegen unterbrochen

**Vorgabe.**

```
.note--internal { border-inline-start: 4px dashed var(--note-internal-rail); }   /* statt solid */
.note--billing::before { /* entfällt vollständig */ }
```

Dazu entfällt das Token `--note-billing-rail-stripe` in beiden Themenblöcken von
`packages/ui-tokens/tokens.css` und sein Paar in `contrast-check.mjs:233` — sonst nennt der Lauf
einen Token, den keine Klasse mehr zeichnet, und A-A-45 geht in der ersten Richtung rot.

**Warum die Unterbrechung als Rahmenstil und nicht als Verlauf.** Die heutige Streifung liegt in
einem Pseudoelement (`.note--billing::before`) im Bereich des Rahmens. Ein Rahmenstil wird von der
Rahmenmalerei gezeichnet, hängt an keiner Positionierung und kann von keiner Beschneidung des
Elternelements verschwinden. Siehe dazu den Verdacht in Abschnitt 8, Befund B-6 — er ist ein Grund
mehr für diese Bauform und kein Gegenargument.

**Es ist kein neues Mittel.** Genau dieselbe Vorrichtung steht seit T-018 in derselben Datei:

```
.table__row--notbilled > td:first-child { border-inline-start-style: dashed; }   /* components.css:786 */
```

Die unterbrochene Schiene heißt in Takt bereits: *hier ist etwas nicht den vollen Weg gegangen*.
Für den Vermerk ist das die wörtliche Wahrheit — er verläßt Takt nie.

### 2.4 Warum die Unterbrechung am Vermerk und nicht an der Leistung

Beide Zuordnungen wären messtechnisch gleich gut. Die Wahl folgt der Rangfolge des Risikos:

* Der teure Bedienfehler ist, in die **Leistung** zu schreiben, was intern bleiben sollte — es
  steht dann auf der Rechnung des Kunden (R-08). Das Feld, dessen Verwechslung Geld kostet, muß
  das **festere** Zeichen tragen: durchgezogen, Akzentfarbe, 5,99:1 gegen die Karte.
* Der Vermerk ist der harmlose Fall. Er bekommt das leisere Zeichen: unterbrochen, neutral,
  3,49:1.
* Die Metapher stimmt in beide Richtungen: durchgezogen heißt „geht als Ganzes hinaus",
  unterbrochen heißt „kommt hier nicht durch".

### 2.5 Was danach gemessen ist

| Verhältnis | hell | dunkel | wo es steht |
|---|---:|---:|---|
| Leistungsschiene gegen Karte (durchgezogen) | 5,99 | 5,66 | Paar vorhanden, `contrast-check.mjs:232`, min 3 |
| Vermerkschiene gegen Karte — zugleich **Balken gegen Lücke** | 3,49 | 4,31 | Paar vorhanden, `:235`, min 3 |
| die beiden Schienen gegeneinander | 1,71 | 1,31 | neu, **als benannte Ausnahme** — die Unterscheidung ruht nach dieser Entscheidung nicht mehr darauf |

Der mittlere Wert ist der Kern: Bei einer unterbrochenen Schiene ist das Verhältnis Schiene gegen
Karte **zugleich** das Verhältnis Balken gegen Lücke, denn in der Lücke sieht man die Karte. Das
Merkmal ist damit von dem Paar gemessen, das ohnehin schon dasteht — die Form hat einen Zahlenwert
bekommen, ohne daß ein Paar dazukommen mußte. Das ist der eigentliche Vorzug dieser Lösung
gegenüber jeder Farbvariante.

**Und die Grenze dieses Satzes, seit T-233 gemessen:** Das Paar mißt, **wie deutlich** der
Unterschied zwischen Balken und Lücke ist, nicht, **ob** es Lücken gibt. Die Zahl der Lücken legt
die Engine fest, und sie tut es verschieden (2.8). Für die Vermerkschiene ist das folgenlos — sie
liegt um ein Vielfaches über der Schranke —, aber der Satz „die Form ist damit gemessen" gilt nur
zusammen mit T-8. Ein Paar allein spricht ein Formmerkmal nicht frei.

### 2.6 Fünf Stellen sagen denselben Satz. Alle fünf müssen mit

Wer nur die CSS-Zeile ändert, läßt die widerlegte Zusage an vier weiteren Stellen stehen:

| Ort | Was heute dasteht | Was daraus wird |
|---|---|---|
| `styles/components.css:1349-1351` | „gestreift … bleibt in Graustufen bestehen" | „durchgezogen gegen unterbrochen; Balken gegen Lücke gemessen 3,49 / 4,31 (`contrast-check.mjs`)" |
| `components/NoteField.tsx:22` (Merkmal 1) | „gestreift (Leistung) gegen einfarbig (Vermerk)" | „durchgezogen (Leistung) gegen unterbrochen (Vermerk)" |
| `components/NoteField.tsx:29-30` | „bleiben in Graustufen unterscheidbar (Probe in Abschnitt 7 der Musterseite)" | Zusatz: **wo** die Zahl steht. Eine Sichtprobe belegt kein Einzelmerkmal (2.1) |
| `showcase/NotesSection.tsx:14` | „4px gestreift, Akzentfarbe / 4px einfarbig, Grau" | „4px durchgezogen, Akzentfarbe / 4px unterbrochen, Grau" |
| `apps/web/design/DESIGNSYSTEM.md:695` und `:704-707` | „Die gestreifte Randschiene trägt auch dann, wenn Farbe wegfällt" | dieselbe Aussage über die unterbrochene Schiene, **mit** den zwei Zahlen |

Kein neuer Text, fünfmal derselbe berichtigte. Das ist keine Streichung im Sinn von E-078, sondern
eine Berichtigung: Die Aussage bleibt, sie wird wahr.

### 2.7 Was ein Benutzer sieht, der Farben nicht unterscheiden kann

| | heute | danach |
|---|---|---|
| Zwei Felder nebeneinander, Graustufen | zwei gleich helle, gleich lange, durchgezogene graue Balken (1,71:1 auseinander; die Streifung ist ohnehin nicht aufzulösen) | ein durchgezogener und ein unterbrochener Balken — der Unterschied ist eine Form und keine Helligkeit |
| Nur ein Feld im Blick, Kopfband außerhalb | Marke vor der Beschriftung (gefüllt gegen gestrichelte Kontur) trägt allein | Marke **und** Schienenform tragen, zwei unabhängige Merkmale |
| Deuteranopie | Akzentblau und Neutralgrau liegen dicht beieinander | die Form ist von der Farbwahrnehmung unabhängig |

Merkmal 4 (die Marke) bleibt unverändert und bleibt gemessen (`contrast-check.mjs:237-239`). Nach
dieser Änderung tragen **zwei** der sechs Merkmale ohne Farbe statt einem — das ist der Zugewinn,
nicht bloß die Berichtigung eines Satzes.

### 2.8 Zustände, Responsives und die eine Prüfung, die dazugehört

* **Zustände.** `.note--invalid` färbt `.note__input` um, nicht `.note`; `readonly` zeigt sich am
  Kopfband („gesperrt"), `disabled` an der Schreibfläche. **Keiner** der drei greift auf
  `border-style` der Hülle zu — die Schienenform überlebt Fehler, Sperre und Deaktivierung
  unverändert. Das ist ein zusätzlicher Vorzug gegenüber jeder Farblösung, die von
  Zustandsfarben überschrieben werden könnte.
* **Zeiger, Fokus, aktiv.** Unverändert. Die Hülle des Feldes ist kein Bedienelement; der
  Fokusring liegt am `textarea`.
* **Responsiv.** Keine neue Umbruchmarke. Die Schiene ist 4px in jeder Breite; bei 40 rem und
  darunter, wo Felder einspaltig stehen, wird die Form **wichtiger**, weil dann kein zweites Feld
  zum Vergleich danebensteht — genau der Fall, für den Merkmal 1 und 4 gedacht sind.
* **Zu prüfen (visual-qa, beide Themen, 1280x720):** die Eckverbindung zwischen der 4px-Schiene und
  dem 1px-Rahmen bei `--radius-lg`. *(Die zweite Prüfung dieser Zeile — die Zahl der
  Unterbrechungen — ist seit T-233 gemessen und seit T-232 ein **wiederholbarer Lauf**:
  `pnpm proof:engines`, zwei Engines, vier Gegenproben, 23 bestanden / 0 fehlgeschlagen. Was hier
  stand, war eine Vermutung mit einem Rückfall daneben; jetzt ist es ein Nachweispfad. Der Lauf
  steht neben `test:e2e` und **nicht** in `proof:all` — er braucht `xvfb-run`, `python3-gi`,
  Pillow und ein eingerichtetes Chromium und kann sich überspringen, und eine Menge, deren ganzer
  Wert im Nie-Überspringen liegt, verträgt das nicht (E-095).)*

**Die Messung — Stand 2026-09-06, und keine dieser Zahlen ist eine Zusage** (E-087 Punkt 2). Sie
kommt aus zwei Läufen: der Handmessung des Orchestrators (T-233) und dem wiederholbaren Lauf
`proof:engines` (T-232, 23 bestanden / 0 fehlgeschlagen, beide Engines gegen **dieselbe**
ausgeschnittene Deklaration). Alle Zeilen: Rahmenbreite **4 px**.

| Engine | Schiene | Pfadlänge | Striche | Längen | Lücken | bemalt | Herkunft |
|---|---|---:|---:|---|---:|---:|---|
| WebKitGTK 4.1 | Vermerk | 41 px | **3** | {7, 9, 7} | 2 | 23 px | T-233 |
| Chromium (Fassung nicht festgehalten) | Vermerk | 41 px | **4** | {7, 7, 7, 7} | 3 | 28 px | T-233 |
| WebKitGTK 2.52.6 | Vermerk | 56 px | **3** | {7, 12, 12} | 2 {13, 12} | 31 px | T-232 |
| Chromium 151.0.7922.34 | Vermerk | 73 px | **7** | {7, 8, 8, 8, 8, 8, 2} | 6 {4×6} | 49 px | T-232 |
| WebKitGTK 2.52.6 | Leistung | 73 px | **1** | {73} | 0 | 73 px | T-232 |
| Chromium 151.0.7922.34 | Leistung | 73 px | **1** | {73} | 0 | 73 px | T-232 |
| Chromium (T-202) | Vermerk | ≈ 217 px | **19** | 7,7 (Mittel) | 19 à 3,7 | ≈ 146 px | T-202 2.4 |

> **Zwei Zeilen, die hier nicht stehen, und warum.** Die Auswertung der **durchgezogenen** Schiene
> aus T-233 ist unbrauchbar: `--focus-ring-color` und `--note-billing-rail` sind derselbe Wert
> (`#2159da`), Knopf und Schiene standen in derselben Bildspalte, und der Schnitt lief durch beide.
> Derselbe Fehler steckte in der ersten Fassung der Vorrichtung von T-232, dort **doppelt** — er ist
> dort baulich beseitigt (zwei Seiten, im Bild einmalige Farbe je Fläche, Zählung der Farbfelder).
> **Für die durchgezogene Schiene gelten deshalb ausschließlich die zwei `proof:engines`-Zeilen.**
> Die gestrichelte war in beiden Läufen sauber; ihre Farbe ist einmalig.

**Die Form trägt in beiden Engines. Engine-abhängig ist die Verteilung — und, wie sich jetzt zeigt,
auch die Pfadlänge selbst.** Die Gestaltentscheidung aus 2.3 (durchgezogen gegen unterbrochen) ist
damit gemessen und nicht mehr gerechnet. Zugleich ist gemessen, daß **keine** Zahl dieser Tabelle
eine Zusage tragen darf:

* nicht die **Strichzahl** — 3 gegen 7 an derselben Vorrichtung;
* nicht die **Strichlänge** und nicht die Gleichheit der Längen — Chromium beschneidet den ersten
  und letzten Strich ({7, 8, 8, 8, 8, 8, 2});
* nicht die **bemalte Länge** — 31 gegen 49 px;
* und **nicht einmal die Länge der Schiene**: dieselbe Fläche mißt in WebKitGTK **56 px** und in
  Chromium **73 px**, weil WebKitGTKs äußere Striche nicht in die Ecken reichen. Eine Prüfung, die
  die Schienenlänge festnagelt, mißt die Eckbehandlung der Engine.

Wer eine dieser Zahlen festnagelt, mißt die Engine und nicht Takt (P-3, unten).

**Der Rückfall aus dieser Zeile ist hinfällig — für den Grund, für den er hinterlegt war.** Er
sollte den Fall abfangen, daß eine WebKit-Engine die Schiene gar nicht als Strichmuster zeichnet.
Dieser Fall ist gemessen und tritt nicht ein. Was ein `repeating-linear-gradient` mit fester
Geometrie zusätzlich brächte, wäre eine feste **Verteilung** — und die Verteilung ist nach
derselben Messung genau das, was **nicht** trägt. Er kostete dafür ein zweites Zeichenverfahren
für dieselbe Linie und nähme die Schiene aus der Rahmenmalerei heraus, in der sie nach 2.3 gegen
Positionierung und Beschneidung unempfindlich ist. **Er bleibt für einen anderen Fall stehen**, und
nur für den: für eine Schiene, die unter die Schranke aus T-8 fällt und trotzdem tragen muß. Dort
ist die feste Geometrie das einzige Mittel, das die Engine nicht neu verhandeln kann. Aus einem
Rückfall gegen die Engine ist ein Werkzeug gegen die **Kürze** geworden.

**Und zwei Angaben dieser Zeile waren falsch, unabhängig von der Engine.**

1. **Nicht `rows={3}`, sondern `rows={2}`.** Drei ist der Vorgabewert von `NoteField`
   (`NoteField.tsx:104`), nicht die kleinste vorkommende Ausprägung. Die kleinste steht in
   `TodoFormDialog.tsx:272` — und sie ist `scope="internal"`, also ausgerechnet die **gestrichelte**.
   Der Rest des Feldes (Kopfband, Marke mit Beschriftung, Schreibfläche, Fußnote) trägt die Schiene
   trotzdem weit über jede Schranke; T-202 hat in Chromium am `rows={3}`-Feld **19 Striche**
   gemessen, und der heute gemessene Faktor ließe in WebKitGTK ungefähr vierzehn übrig. Der Fehler
   ändert das Urteil nicht, aber er hätte die Messung an das falsche Feld geschickt.
2. **„Drei sichtbare Unterbrechungen" ist zweideutig, und die zwei Lesarten fallen bei dieser
   Messung entgegengesetzt aus.** Eine Unterbrechung kann die Lücke sein oder der Strich. Als
   **Lücken** gelesen verlangt der Satz vier Striche — WebKitGTK zeichnet drei und wäre rot,
   während die Form unverkennbar dasteht. Das ist der falsche Alarm aus dem letzten Teil dieses
   Abschnitts, und meine eigene Anforderung war sein erster Fall. **Verbindlich ist ab jetzt: drei
   Striche und damit zwei Lücken.**

**Regel T-8 — eine Form hat ein Mindestmaß, und unterhalb davon sagt sie nicht nichts, sondern das
Gegenteil.** Ein Formmerkmal ist erst dann Träger, wenn die Engine es überhaupt zeichnen kann.
Die Schranke ist **drei Striche und zwei Lücken**. Der Grund ist nicht Geschmack:

* **Ein** Strich ist von einer kurzen durchgezogenen Schiene nicht zu unterscheiden.
* **Zwei** Striche mit einer Lücke sind keine Wiederholung, sondern eine Kerbe — und eine Kerbe an
  einer Schiene liest sich als Fehler des Bildes, nicht als Zustand. Wo die eine Lücke liegt,
  entscheidet dazu die Engine (siehe die verschobenen 9 px oben), und an einem Ende liegend bleibt
  von ihr eine verkürzte Schiene übrig.
* Erst **zwei** Lücken machen aus zwei Dingen ein Muster. Das ist dieselbe Hausentscheidung wie die
  3:1 in Abschnitt 0: WCAG nennt keine Zahl, Takt braucht eine, und sie steht an einer Stelle.

**Der teure Teil der Regel ist der zweite Halbsatz.** Eine Farbe, die zu schwach wird, sagt
„unklar". Eine **Form**, die zu kurz wird, sagt **den anderen Wert desselben Merkmals**: Die
gestrichelte Schiene mit einem Strich ist die durchgezogene. Am Vermerkfeld heißt das, daß es
aussieht wie das Leistungsfeld — genau der Verwechslungsweg, gegen den die Entscheidung aus 2.3
gebaut ist (R-08, E-016). Ein ausfallendes Formmerkmal ist deshalb schlechter als ein fehlendes.

**Die Mindesthöhe. Die Faustformel von T-233 ist zurückgenommen; an ihre Stelle tritt ein
gemessenes Band** (T-236, O-KM und T-232 Frage 2). Sie lautete *„Zahl der Striche ≈ Pfadlänge ÷
(3 × Rahmenbreite)"* mit der Planungsschranke *„Pfadlänge ≥ 12 × Rahmenbreite"*. Drei Dinge daran
sind inzwischen gemessen und alle drei fallen gegen sie aus:

1. **Sie war an jedem Punkt um genau einen Strich zu niedrig**, und der Grund ist kein Rundungspech,
   sondern die Bauart: Chromium beschneidet den ersten **und** den letzten Strich, es kommt also
   ein angeschnittener Strich obendrauf. Richtig ist ein **Aufrunden**, und damit stimmt das Modell
   an allen drei Chromium-Punkten aufs Stück: ⌈41 ÷ 12⌉ = 4 ✓, ⌈73 ÷ 12⌉ = 7 ✓, ⌈217 ÷ 12⌉ = 19 ✓.
2. **Die Gegenprobe von T-233 war zirkulär.** Dort standen „228 px Pfad" als Länge des
   `rows={3}`-Feldes. Diese Zahl war **nicht gemessen, sondern aus der zu prüfenden Formel
   zurückgerechnet** (19 × 12). Gemessen hat T-202 2.4 etwas anderes: 19 Balken à 7,7 css und 19
   Lücken à 3,7 css, also einen Pfad von **≈ 217 px**. Ein Modell, das an einem aus ihm selbst
   gewonnenen Punkt bestätigt wird, ist an diesem Punkt nicht geprüft. **Das ist mein Fehler aus
   T-233, und es ist genau die Sorte, gegen die dort Annahme 4 geschrieben war.**
3. **Für WebKitGTK gilt sie überhaupt nicht.** Zwei Messungen, 41 px und 56 px — **beide 3
   Striche**. Die Periode wächst mit: rund 16 px bei 41, rund 24 px bei 56. WebKitGTK zieht die
   Periode mit der Länge mit, statt Striche hinzuzufügen. Damit ist auch das Verhältnis „3 zu 4"
   aus T-233 widerlegt: an derselben Vorrichtung steht es bei 73/56 px als **3 zu 7**. Es ist keine
   Konstante, sondern öffnet sich mit der Länge.

> **Was an die Stelle tritt.**
>
> **(a) Chromium — ein Modell mit Stand.** `n ≈ ⌈Pfadlänge ÷ (3 × Rahmenbreite)⌉`. Stand
> 2026-09-06, drei Punkte, alle bei **4 px** Rahmen, alle exakt. Es taugt zum Planen, nicht zum
> Prüfen; CSS legt die Strichgeometrie nicht fest.
>
> **(b) WebKitGTK — kein Modell, sondern zwei Punkte.** 41 px → 3, 56 px → 3, beide bei 4 px
> Rahmen. **Länge kauft in WebKitGTK keine Striche.** Wer dort Luft über T-8 braucht, bekommt sie
> nicht aus der Geometrie.
>
> **(c) Die Planungsschranke ist keine Rechnung mehr, sondern ein gemessenes Band.** Getragen ist,
> was **innerhalb** von 41 px bis ≈ 217 px bei **4 px** Rahmen liegt. Darunter, darüber und bei
> jeder anderen Rahmenbreite ist **nichts gemessen** — und weil (b) gilt, darf von hier auch nicht
> extrapoliert werden, in keine Richtung. Eine Fläche außerhalb des Bandes ist damit nicht
> durchgefallen; sie ist **ungemessen**, und das ist ein anderer Zustand mit einer anderen Folge.

**Warum das Band besser ist als die alte Zahl, obwohl es weniger sagt.** Die alte Schranke war zur
sicheren Seite falsch — sie hätte 41 px als zu kurz verworfen, obwohl beide Engines dort tragen.
Eine Schranke, die eine tragende Fläche verwirft, ist nicht vorsichtig; sie ist ein Grund, eine
Gestalt zu ändern, die in Ordnung ist. Das Band macht keine Aussage, die es nicht gemessen hat, und
benennt die Lücke statt sie zu überrechnen.

Angewandt auf jede Fläche, an der in Takt durchgezogen gegen gestrichelt etwas **sagt**. Jede Zeile
sagt jetzt **entweder** „gemessen" **oder** „ausdrücklich ausgenommen, und warum" — eine leere
Spalte gibt es hier nicht mehr (T-236, O-KM):

| Fläche | Rahmen | kürzeste Ausprägung | Stand der Messung | Stufe |
|---|---:|---|---|---|
| `.note--internal`, Vermerkschiene (`components.css:1424-1427`) | 4 px | `rows={2}` in `TodoFormDialog`, mit Kopfband, Marke und Fußnote weit über 100 px | **gemessen**, und zwar diese Fläche selbst: 41 / 56 / 73 / ≈ 217 px in zwei Engines | **Träger** (2.3) |
| `.badge--not-billed`, Kontur „Nicht abgerechnet" (`:496-501`) | 1 px, **geschlossener Pfad** | Pille 22×22 (`.badge--icon-only`), Umfang ≈ 69 px | **ungemessen — und die einzige Fläche, an der das etwas kostet.** Keine der sechs Messungen liegt bei 1 px. Meßauftrag unten | **Träger in der Aufzählung von 1.4, aber nicht allein tragend** |
| `.table__row--not-billed > td:first-child` (`:840-843`) | 3 px | eine Zeile: `--row-height` **40 px**, unter `[data-density="compact"]` **32 px** (`tokens.css:332, 429`) | **ausdrücklich ausgenommen** — außerhalb des Bandes und bei fremder Rahmenbreite, und es hängt nichts daran | **Verstärkung** — Begründung unten |
| `.auditrow__reason--absent` (`app.css:2634-2639`) | 2 px | Rechnung am Kastenmodell: 2 × `--space-2` + eine Zeile `--text-xs` × `--leading-normal` = 8 + 18 + 8 = **34 px**; der gebaute Satz ist rund 150 Zeichen und bricht in der Regel auf zwei Zeilen | **ausdrücklich ausgenommen**, aus demselben Grund, mit demselben Ergebnis | **Verstärkung** — Begründung unten |

**Die zwei Ausnahmen, in einem Satz und mit demselben Grund.** Beide Flächen sind Verstärkung, nicht
Träger, und beide sagen dasselbe **ohne** die Schiene noch ein zweites und drittes Mal:

* **Zeile der Buchung:** Der Zeilenrand steht in der Merkmalstabelle von 1.4 ausdrücklich als reines
  **Farb**merkmal, und der Kommentar an der Regel sagt es auch so („zusaetzlich gestrichelt").
  „Nicht abgerechnet" trägt in derselben Zeile dreifach — **Balken** des Zustandspunktes (vierte
  Silhouette neben Ring, Scheibe und Raute, `components.css:532-547`), **Symbol** `slash-circle`,
  **Wort**. In der dichten Ansicht wird die Verstärkung leiser. Das ist hinnehmbar und gehört
  benannt, damit es niemand als Befund wiederfindet.
* **Fehlende Begründung im Protokoll:** Die Unterscheidung „Begründung steht da" gegen „keine
  Begründung" trägt der **Text selbst** — im einen Zweig die Marke „BEGRÜNDUNG" über dem fremden
  Text, im anderen der ausgeschriebene Satz „Ohne Begründung ausgebucht. …"
  (`ExportAudit.tsx:167-181`). Beide Zweige stehen zudem **nie nebeneinander**, sondern in
  verschiedenen Zeilen einer Liste; eine Form, die nur im Vergleich über Zeilen hinweg lesbar wäre,
  war nach Abschnitt 0 nie Träger. **Deshalb wird sie nicht gemessen:** Eine Messung, deren Ausgang
  nichts ändert, ist kein Nachweis, sondern Zierde am Verfahren.

**Was aus der Ausnahme trotzdem folgt — eine Zeile für frontend-dev.** `.table__row--not-billed`
trägt den Satz „zusaetzlich gestrichelt" bereits im Kommentar. `.auditrow__reason--absent`
(`app.css:2634-2639`) trägt **gar keinen** Kommentar. Dort fehlt derselbe Halbsatz, und ohne ihn
liest der nächste Leser die gestrichelte Schiene als Träger und sucht die Messung, die es
absichtlich nicht gibt. Übergabe in 14.2.

**Der Meßauftrag, der offenbleibt — und er betrifft nicht die 2-px-Fläche, sondern die 1-px-Kontur.**
`.badge--not-billed` ist die einzige Fläche, an der die Konturform in der Aufzählung von 1.4
**mitgezählt** wird, und Regel T-1 verlangt für ein mitgezähltes Merkmal eine Messung. Sechs
Messungen liegen vor, alle bei 4 px, keine bei 1 px — und nach (b) oben darf von der einen
Rahmenbreite nicht auf die andere geschlossen werden. Der Auftrag ist klein, weil die Vorrichtung
steht: `proof:engines` schneidet seine Deklarationen aus den echten Stilblättern; `.badge` und
`.badge--not-billed` sind ein weiterer Ausschnitt und ein weiteres Element, keine zweite
Vorrichtung. **Bis das gemessen ist, gilt die Kontur dort als Träger _neben_ Symbol, Wort und
Balken, nie als der Träger** — und genau so steht sie seit T-236 auch in 1.4.

**Was außerhalb des Bandes an die Stelle des Merkmals tritt — drei Wege, in dieser Rangfolge.**

1. **Nichts, weil nichts wegfällt.** War die Form eine Verstärkung, tragen die übrigen Merkmale
   weiter. Das ist der einzige Fall, den Takt heute hat, und er kostet keine Zeile.
2. **Ein anderes Merkmal derselben Fläche**, wenn die Form der Träger war: die Marke vor der
   Beschriftung, das Symbol, das Wort. **Nie eine zweite Farbe** — 2.2 rechnet vor, daß dieses
   Fenster im dunklen Thema arithmetisch geschlossen ist, und daran ändert eine kurze Schiene
   nichts.
3. **Die Geometrie festschreiben:** `repeating-linear-gradient` mit genannter Periode auf
   `background-origin: border-box` über `border-inline-start: Npx solid transparent`. Nur, wenn 1
   und 2 ausfallen — es ist ein zweites Zeichenverfahren für dieselbe Linie und nimmt sie aus der
   Rahmenmalerei.

**Ausdrücklich nicht: eine Fläche höher machen, damit die Striche hineinpassen.** Dagegen stehen
jetzt drei Gründe statt einem. *Erstens* bestimmte dann ein Zeichendetail das Layout, und die
nächste Engine verschöbe es wieder. *Zweitens* — und das ist neu gemessen — **hilft es nicht**:
WebKitGTK zeichnet bei 41 px drei Striche und bei 56 px immer noch drei. *Drittens*, an einer
**Vorrichtung** getan, wäre es das Messen der Vorrichtung: Ein Rumpf, den man so lange streckt, bis
die Zahl paßt, läßt genau den Fall durch, gegen den T-8 geschrieben ist. Der Erbauer von
`proof:engines` hat das von sich aus abgelehnt (T-232 Abschnitt 5), und die Ablehnung ist hiermit
bestätigt.

**Was ein Lauf über die Schienenform prüfen soll — die Form, nicht den Rhythmus.** P-1 bis P-6
sind seit T-232 gebaut und gefahren; die folgenden Zeilen sind der **Stand nach diesem Lauf**, nicht
mehr der Entwurf davor.

| | |
|---|---|
| **P-1** | Geprüft wird: die durchgezogene Schiene hat entlang ihrer Länge **genau einen** Strich und **keine** Lücke; die gestrichelte hat **mindestens drei** Striche und **mindestens zwei** Lücken. Dazu die Farbe des Striches gleich dem Token und die Farbe der Lücke gleich der Karte — das ist das Verhältnis aus 2.5, das die Form zur Zahl macht |
| **P-2** | **Jede Schranke ist ein `≥`, nie ein `=`.** Der Beleg steht in der Tabelle oben: dieselbe Vorrichtung, dasselbe Erzeugnis, 3 gegen 4 Striche. Eine Prüfung auf Gleichheit ist nicht die strengere Prüfung, sondern eine **andere** — sie mißt die Engine |
| **P-3** | Nicht geprüft wird: eine feste Strichzahl, eine feste Strichlänge, gleiche Strichlängen untereinander, die bemalte Länge oder ihr Anteil — **und seit T-232 ausdrücklich auch nicht die Länge der Schiene selbst** (56 gegen 73 px an derselben Fläche; WebKitGTKs äußere Striche reichen nicht in die Ecken). Kein Vergleich gegen ein hinterlegtes Bild. Alle diese Zahlen stehen in der **Ausgabe** — als Zahlen, nie als Schranke |
| **P-4** | **Zwei Schranken, je nachdem, ob die Engine gemessen oder geschätzt wird.** Fährt der Lauf **nur Chromium**, ist die Schranke dort **≥ 4 / ≥ 3**. Mißt er WebKitGTK **unmittelbar**, gilt dort die Grundschranke aus P-1 (**≥ 3 / ≥ 2**) und der Zuschlag bleibt trotzdem für Chromium stehen. **T-232 hat das so ausgelegt, und die Auslegung ist richtig** (T-236): Der Zuschlag war nie eine Aussage über WebKitGTK, sondern ein Aufschlag auf eine **ungemessene** Engine; wo gemessen wird, hat er keinen Adressaten. Seine ursprüngliche Begründung — das Verhältnis „3 zu 4" — ist dagegen **widerlegt** (bei 73/56 px steht es 3 zu 7). Was ihn heute trägt, ist enger und stimmt: In Chromium wächst die Zahl mit der Länge, also fängt eine 4 dort eine zu **kurze** Schiene ab — mehr ist ein reiner Chromium-Lauf nicht imstande zu sehen |
| **P-5** | Mitgeschrieben wird, was **keine** Schranke ist: Engine und Fassung, Datum, Schienenlänge, Strichzahl, Strichlängen, Lückenzahl, bemalte Länge — **und der Abstand zur Schranke**. Als Stand mit Datum (E-087 Punkt 2). Ohne diese Angaben ist die nächste Messung mit dieser nicht vergleichbar, und die Frage beginnt von vorn |
| **P-6** | Was der Lauf **nicht** kann: Gemessen ist die **Engine-Familie**, nicht die gebaute Binärdatei — der Wirt ist ein Python-Prozeß, nicht Takt; CSP, Webview-Einstellungen und Fenster der Hülle bleiben draußen. **macOS/WKWebView ist ungemessen** und bleibt es. Und keine eingesetzte Verletzung kann eine Engine erzeugen: Der Lauf zeigt, daß die **Messung** eine vertauschte Bandfolge sähe, nicht, daß eine dritte Engine sie erzeugte |
| **P-7** | **WebKitGTK liegt mit 3 Strichen genau _auf_ der Schranke, ohne Luft, und das steht in der Ausgabe.** Es ist kein Mangel der Vorrichtung: Länge kauft dort keine Striche (siehe (b) oben). Wird der Lauf eines Tages deshalb rot, ist die Antwort **weder** eine höhere Vorrichtung **noch** eine niedrigere Schranke — zwei Striche mit einer Lücke sind nach T-8 eine Kerbe und kein Muster. Die Antwort ist Weg **2** der Rangfolge oben: ein zweites Merkmal an der Fläche, die trägt. Entschieden wird das hier, nicht im Lauf |

---

## 3. Die fünfzehn Farben ohne Paar — Einordnung je Token

A-A-45 gehört frontend-dev. Was ihm fehlt, ist nicht die Mechanik, sondern das Urteil, welcher
Rahmen ein Träger ist und welcher nicht. Hier steht es, mit den Zahlen aus T-189.

| Token / Ort | Stufe | Paar | Begründung |
|---|---|---|---|
| `--danger-bg-hover` (`.btn--danger:hover`) | Träger | gegen `--text-on-solid`, **min 4,5** | Text auf gefüllter Fläche. Für `--accent-bg-hover` steht dasselbe Paar seit je (`:168`) — die Lücke ist eine Unsymmetrie, kein Sonderfall |
| `--danger-bg-active` | Träger | gegen `--text-on-solid`, **min 4,5** | dito, Vorbild `:169` |
| `--focus-ring-contrast` (`.on-solid:focus-visible`) | Träger | gegen `--accent-bg` **und** gegen `--danger-bg`, je **min 3** | `.on-solid` sitzt auf genau diesen zwei Füllungen (`Primitives.tsx:70, 132`). Ein Fokusring ist eine Zustandsgrenze; er wird auf jeder Fläche gemessen, auf der er vorkommt |
| `--note-billing-bg` | Träger | gegen `--text-primary`, **min 4,5** | Der Text im Vermerkfeld ist gemessen (`:236`), der im Leistungsfeld nicht. Dieselbe Unsymmetrie wie oben, und ausgerechnet am Feld, das exportiert wird |
| `--status-exported-border` | Träger | gegen `--bg-surface`, **min 3** | Die Konturen von „Offen" und „Erneut offen" sind gemessen (`:178`, `:185`), die von „Exportiert" nicht |
| `--success-border` (1,50 / 2,04) | Zierde | **exempt**, mit den zwei Zahlen | Rahmen eines Meldebandes. Fläche, Symbol und Text tragen. Wortgleich zur bestehenden Ausnahme für `--warning-border` (`:394`) |
| `--danger-border` (1,66 / 1,79) | Zierde | **exempt**, mit den zwei Zahlen und dem Zusatz | dieselbe Klasse — **und** der Merkposten dazu: die Kontur eines fehlerhaften Feldes ist `--danger-text` und nicht dieser Token (`:390`). Ohne den Zusatz holt ihn der nächste Durchgang „aus Konsistenz" zurück |
| `--note-internal-border` (1,46 / 1,57) | Zierde | **exempt** | der 1px-Rahmen des Feldes. Getragen wird von der Schiene, und die ist gemessen (`:235`) |
| `--note-billing-border` (1,53 / 1,98) | Zierde | **exempt** | dito, Schiene `:232` |
| `--timer-idle-border` (1,46 / 1,30 und 1,57 / 1,43) | Zierde | **exempt**, gegen `--bg-surface` und `--bg-subtle` | Der erkennbare Zustand ist **laufend**, und dessen Kontur ist mit min 3 gemessen (`:397`). Der Ruhezustand ist die Abwesenheit; sein Rahmen grenzt ab |
| `--status-reopened-hatch` (1,24 / 1,45) | Verstärkung | siehe Abschnitt 6 — **exempt plus Deckelpaar** | Abschnitt 1 |
| `--shadow-xs`, `--shadow-sm`, `--shadow-lg` | keine Kontrastfrage | **kein Paar** | Ein Schatten hat keinen Vorder- und keinen Hintergrund. Er gehört in eine eigene, benannte Liste des Laufes, nicht in ein `exempt`-Paar: ein Paar behauptet eine Beziehung, die es hier nicht gibt |
| `--bg-scrim` | keine Kontrastfrage | **kein Paar** | Die Abdunklung hat die Aufgabe, Kontrast zu **nehmen**. Ein Mindestwert wäre die Umkehrung ihres Zwecks |

**Zur Mechanik von A-A-45, als Bedingung aus der Gestaltung:** Die Liste „keine Kontrastfrage"
braucht je Eintrag einen Grund im Klartext, nicht bloß einen Namen. Eine Ausnahmeliste ohne Gründe
wird beim nächsten Durchgang zur Ablage für alles, was rot war.

---

## 4. O-HA — zwei Wege zu derselben Fläche. Gemessen sind es drei

### 4.1 Der Bestand

Im leeren Board führen zum selben `BoardSetupDialog`:

| # | Ort | Ausprägung | Beschriftung |
|---|---|---|---|
| 1 | Kopfzeile der Ansicht, `BoardScreen.tsx:395` | sekundär, Symbol `filter` | „Spalten verwalten" |
| 2 | Leerzustand, `:1015` | **primär**, Symbol `plus` | „Erste Spalte einrichten" |
| 3 | Karte „Was sich geändert hat", `:1047` | **primär**, Symbol `plus` | „Erste Spalte einrichten" |

O-HA fragt nach zwei Wegen. Es sind drei, und zwei davon sind **zeichengleich**: gleiche
Beschriftung, gleiche Ausprägung, gleiches Ziel, rund 200px auseinander auf demselben Bildschirm.
Daß der Prüffall `tests/e2e/board-empty-state-rule-chain.spec.ts:44` ein `.first()` braucht, ist
der Abdruck davon.

### 4.2 Urteil

**Der Doppelweg 1/2 bleibt. Der dritte fällt.**

*Warum 1 und 2 verschiedene Absichten tragen:*

* **1 ist der stehende Eingang.** Er steht in **jedem** Zustand des Boards, neben dem Filter, in
  der Werkzeugzeile. Ein Bedienweg, der je nach Bestand erscheint, verschwindet oder sich
  umbenennt, ist nicht erlernbar — und eine Umbenennung bräche zusätzlich einen zugänglichen Namen
  (E-076 Punkt 3).
* **2 ist die eine Handlung des Leerzustands.** Ein Leerzustand hat genau eine Aktion, und sie
  heißt nach dem **nächsten Schritt**, nicht nach der Fläche dahinter: „Erste Spalte einrichten"
  gegen „Spalten verwalten" — verwalten kann man nichts, wovon es noch nichts gibt. Das ist der
  Grund, aus dem der Leerzustand seinen eigenen Knopf braucht, obwohl die Tür dieselbe ist.
* **Zwei Türen in einen Raum sind kein Fehler**, wenn eine die stehende ist und die andere die,
  auf die der leere Raum zeigt. Beide führen bewußt in den **Dialog** und nicht am Dialog vorbei
  ins Regelformular — daran hängt seit T-186 die Kette zu `RULE_IS_A_RULE` (Z-07 Punkt 1), also
  eine der nur noch zwei Stellen, an denen Takt sagt, was eine Spalte ist.

*Warum 3 fällt:*

* Zwei primäre Knöpfe mit **identischer** Beschriftung auf einem Bildschirm heben die Regel
  „eine Primäraktion je Bildschirm" auf. Der Benutzer fragt sich, worin sie sich unterscheiden;
  die Antwort ist: in nichts.
* Die Karte behält ihre eigene, **verschiedene** Aktion: „Zur Todo-Liste" (`:1050`, `ghost`) führt
  woandershin und bleibt. Die Aktionszeile der Karte verliert damit ihren Widerspruch und behält
  ihren Zweck.
* **Es ist kein Streichen um des Streichens willen** (E-078): Nicht der Text ist zuviel, sondern
  die **Wiederholung derselben Handlung** im Abstand von 200px. Der Satzbestand der Karte bleibt
  unangetastet.

**Kein neuer Text.** Es fällt eine Wiederholung; es entsteht nichts.

### 4.3 Was das am Vertrag berührt (E-076 Punkt 3)

* **Keine Klasse geändert.** `.board-setup__actions` bleibt und behält einen Knopf.
* **Kein zugänglicher Name geändert.** „Erste Spalte einrichten" gibt es danach einmal statt
  zweimal; der Name selbst bleibt zeichengleich.
* **e2e:** `board-empty-state-rule-chain.spec.ts:44` bleibt grün — `.first()` auf einem einzigen
  Treffer ist gültig. Der **Grund** für `.first()` entfällt aber; e2e-tester soll es entfernen
  dürfen und wissen, warum es dastand. `support/actions.ts:153` betrifft Knopf 1 und ist nicht
  berührt.
* **Zustände.** Der Leerzustand des Boards kennt drei Ausprägungen (keine Spalte, keine Regel
  vorhanden, Regeln vorhanden zum Aufnehmen — `:1056-1084`). Die Änderung betrifft alle drei
  gleich, weil sie über der Fallunterscheidung liegt.
* **Responsiv.** `.board-setup__actions` bricht bei schmalem Fenster um; mit einem Knopf weniger
  bricht sie später. Keine Umbruchmarke wird berührt.

### 4.4 Der Zusammenhang mit einem älteren Befund

Die Karte „Was sich geändert hat" ist zugleich **B-3** aus `docs/design/textabbau-gestalt.md`
Abschnitt 8: die letzte zeitgebundene Erklärfläche des Produkts, die zu jemandem spricht, der vor
E-054 ein Statusboard hatte. Für eine frische Einrichtung ist sie gegenstandslos. Wird sie später
an eine Bedingung gehängt, verschwindet der doppelte Knopf ohnehin mit ihr — die Entscheidung hier
nimmt dem nichts vorweg und macht den Bildschirm in der Zwischenzeit richtig.

---

## 5. O-GB — was `lib/poolRule.ts` gestalterisch trägt, und welcher Schutz dazu paßt

Die Sperre in `docs/design/textbestand.md` 1.2 („nicht anfassen, solange ST-05 offen ist") gehört
ux-designer und wird von mir nicht angefaßt. Meine Aufgabe ist die **Feststellung**. Sie hat drei
Teile.

### 5.1 Vier Lasten, und keine davon ist Hilfetext

| Last | Wo | Warum sie gestalterisch zählt |
|---|---|---|
| **Die Achsenbeschriftungen** — „Mindestens eines von", „Ohne", „Status — einer von", „Nur erledigte" | `describeRule`, `:271-349` | Sie sind der sichtbare Inhalt der `RuleSummary` unter **jedem** Spaltenkopf. Nach T-171 Abschnitt 3.1 ist genau diese Zeile das, was an die Stelle von elf gestrichenen Sätzen getreten ist. Sie ist keine Fußnote über die Spalte, sie ist deren Definition |
| **Der gesprochene Satz** | `ruleSpoken`, `:592-614` | Die Hörfassung derselben Fläche, aus **derselben** Beschreibung erzeugt. E-078 Nachtrag Punkt 8 ist hier nicht zugesichert, sondern **baulich** erfüllt: eine Quelle, zwei Kanäle |
| **Der Befund „kein Tag darin"** | `describeRuleReach`, `emptyFolderNames`, `:474-540` | Erscheint an vier Flächen (Spaltenkopf, Spaltenleerzustand, Spaltendialog, Regelformular) aus **einer** Funktion. T-171 Abschnitt 3.10 Punkt 2 hat ihn ausdrücklich für unantastbar erklärt |
| **Die Trennung einschränkend / neutral** | `RuleDescription.axes` gegen `.neutral` | „Alle" heißt „schränkt nicht ein". Diese Unterscheidung entscheidet, was in der Zusammenfassung **überhaupt erscheint**. Sie ist die Grundlage der Dichte dieser Zeile |

**Urteil zur Textart:** Diese Sätze sind keine Prosa über die Oberfläche, sondern **Werte** — die
Beschriftungen einer Datenstruktur, derselben Art wie `EXPORT_STATUS_LABEL`. Das Urteilsraster aus
E-078 (doppelt / selbstverständlich / Abwesenheit) ist auf sie nicht anwendbar, weil sie nicht
über die Fläche sprechen, sondern die Fläche **sind**. Eine Ausnahme: die drei Satzhülsen in
`ruleSpoken` („Diese Regel trifft: …", „Ohne Einschränkung: …", „Kein Tag in … — diese Regel trifft
deshalb nichts.") sind Prosa. Für sie gilt Abschnitt 5.3.

### 5.2 Warum die Sperre das falsche Werkzeug war

Sie war an eine Bedingung gehängt, die sich beim Erfülltwerden aufhebt: „solange ST-05 offen ist".
ST-05 ist seit T-181 gebaut — **und genau in diesem Augenblick wurde die Datei tragend**, denn
seither ist die Regelzeile der Ersatz für die gestrichenen Sätze. Der Schutz endete an dem Tag, an
dem das Schutzgut entstand. Das ist keine Nachlässigkeit von ux-designer, sondern die Bauart:
**Eine Sperre auf Zeit schützt einen Zustand; hier ist aber eine Rolle zu schützen.** Rollen haben
kein Enddatum.

Dazu kommt, daß eine Papiersperre die falsche Klasse von Gegenmittel ist. Sie steht in einem
Dokument, das beim Ändern der Datei niemand aufschlägt. E-087 sagt, was statt dessen zu tun ist:
messen, nicht zusichern.

### 5.3 Urteil: kein dauerhafter Schutz auf dem Papier, sondern zwei Regeln und eine Messung

**Kein „nicht anfassen".** Die Datei wird weiter angefaßt werden, und sie soll es. Statt dessen:

1. **Regel P-1 — eine Quelle, zwei Kanäle.** Der gesprochene Satz aus `ruleSpoken` und die
   sichtbare `RuleSummary` werden nur **zusammen** geändert. Wer eine Achsenbeschriftung kürzt,
   kürzt sie in beiden Kanälen, weil beide aus derselben Beschreibung entstehen — und wer diese
   Bauart aufgibt (etwa durch eine zweite, „kürzere" Fassung für die Live-Region), hebt E-078
   Nachtrag Punkt 8 auf und braucht dafür eine Entscheidung.
2. **Regel P-2 — die Gefahr ist das Hinzufügen, nicht das Kürzen.** Der Befund „kein Tag darin"
   steht an vier Flächen aus einer Funktion, weil vier getrennt gepflegte Fassungen binnen einer
   Aufgabe auseinanderliefen (Kommentar bei `:526-528`). Eine **fünfte** Fläche, die ihren eigenen
   Satz schreibt, ist der Rückfall. Wer eine fünfte braucht, ruft die Funktion auf.
3. **Die Messung, die den Schutz trägt.** `apps/web/test/lib/poolRule.test.ts` prüft heute
   `describeRuleReach` und `emptyFolderNames` in acht Fällen. **`describeRule` und `ruleSpoken`
   sind darin nicht enthalten** — die ST-05-Kompensation und ihre Hörfassung hängen an keinem
   Prüffall; e2e berührt nur die Zeichenfolge „kein Tag darin" (`tests/e2e/kanban.spec.ts:402`).
   Der dauerhafte Schutz ist deshalb kein Satz in einem Papier, sondern **ein Fall, der mißt, daß
   der gesprochene Satz jede Achse nennt, die die sichtbare Zusammenfassung zeigt** — Sicht und
   Gehör aus einer Beschreibung, gemessen statt zugesichert. Auftrag an unit-tester, Vorschlag im
   Bericht.

**Was das für `textbestand.md` 1.2 bedeutet, ist ux-designers Feder.** Meine Feststellung, die er
verwerten kann: Die Zeile darf von „vorläufig gesperrt, solange ST-05 offen" auf „**Werte, kein
Prosabestand** — nicht Gegenstand des Streichrasters; für die drei Satzhülsen in `ruleSpoken` gilt
P-1" wechseln. Das ist keine Aufhebung des Schutzes, sondern seine Übersetzung aus einer Frist in
eine Eigenschaft.

### 5.4 Die Grenze meiner Aussage

Ich habe die Datei gelesen und die Prüfdatei gelesen. Ich habe **nicht** gemessen, was eine
Vorlesehilfe daraus macht — in dieser Umgebung gibt es kein Vorleseprogramm (T-B09). Alles, was
oben über das Hören steht, ist aus dem Quelltext **abgeleitet**: `ruleSpoken` erzeugt einen Satz,
`PoolFormDialog.tsx:436` legt ihn in eine Live-Region, die Musterseite zeigt ihn zusätzlich
sichtbar an (`showcase/RuleSection.tsx:414-417`) — was ein Sehender lesen kann, ist damit belegt;
was ein Hörender hört, ist eine Ableitung.

---

## 6. Übergabe an frontend-dev

Alles unten ist eine Zeile oder ein Satz. Nichts davon ist ein Umbau.

### 6.1 Stelle 1 — Etikett „Erneut offen"

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/components.css:421-422` | Kommentar durch den Wortlaut aus Abschnitt 1.3 ersetzen. **Regel unverändert** — kein Wert wird angefaßt |
| `apps/web/src/components/ExportStatus.tsx:40-49` | Im Kopf der Merkmalstabelle festhalten, daß die Schraffur in der Aufzählung der farbunabhängigen Träger **nicht** mitzählt |
| `apps/web/scripts/contrast-check.mjs` | zwei Paare, siehe unten |

```js
// Verstaerkung, kein Traeger: gemessen 1,24 hell / 1,45 dunkel (T-189). Ein
// besserer Wert ist nicht moeglich — ueber der Schraffur steht die Beschriftung,
// und SC 1.4.3 deckelt sie bei 1,80 / 1,58 (T-194 Abschnitt 1.2). Getragen wird
// der Zustand von Symbol, Wort und Punktform.
{ group: "Exportstatus", fg: "--status-reopened-hatch", bg: "--status-reopened-bg", min: 0, exempt: true, note: "Schraffur des Etiketts Erneut offen — Verstaerkung, kein Traeger" },
// Die Obergrenze derselben Verstaerkung: Beschriftung und Symbol liegen ueber
// der Schraffur und muessen ihre 4,5:1 auch dort halten. Wer die Schraffur
// spaeter kraeftiger macht, faellt hier durch — das ist der Zweck dieses Paares.
{ group: "Exportstatus", fg: "--status-reopened-fg", bg: "--status-reopened-hatch", min: 4.5, note: "Beschriftung und Symbol ueber dem dunkelsten Punkt der Schraffur" },
```

**Eine Grenze des Laufes gehört in die Notiz des zweiten Paares:** `flatten` legt eine
teildurchsichtige Farbe über `--bg-canvas`, tatsächlich liegt die Schraffur über
`--status-reopened-bg`. Der ausgewiesene Wert ist dadurch um bis zu 0,7 zu **günstig** (gerechnet:
6,75 statt 6,50 hell, 5,63 statt 4,89 dunkel — beide bestehen). Sauberer wäre ein Feld `over` am
Paar, mit dem der Lauf die Fläche nennt, über der geflächt wird; das ist eine kleine Erweiterung
und ausdrücklich **freigestellt**. Wird sie nicht gebaut, steht die Grenze im Klartext daneben,
wie schon bei „tokengenau, nicht flächengenau".

### 6.2 Stelle 2 — Schienen der Feldarten

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/components.css:1349-1364` | `.note--billing::before` samt Kommentar **entfällt** |
| `apps/web/src/styles/components.css:1366-1369` | `.note--internal` bekommt `border-inline-start: 4px dashed var(--note-internal-rail)` und den berichtigten Kommentar aus 2.6 |
| `packages/ui-tokens/tokens.css:241, 514, 619` | Token `--note-billing-rail-stripe` **entfällt** in allen drei Blöcken |
| `apps/web/scripts/contrast-check.mjs:233` | Paar **entfällt** mit dem Token |
| `apps/web/scripts/contrast-check.mjs:232, 235` | Notizen berichtigen: „durchgezogene Schiene Leistung" und „unterbrochene Schiene Vermerk — zugleich Balken gegen Luecke" |
| `apps/web/scripts/contrast-check.mjs` | ein Paar neu, siehe unten |
| `apps/web/src/components/NoteField.tsx:22, 29-30` | Merkmal 1 berichtigen, Zahlen nennen |
| `apps/web/src/showcase/NotesSection.tsx:14` | Zeile „Randschiene" berichtigen |
| `apps/web/design/DESIGNSYSTEM.md:695, 704-707` | dieselbe Berichtigung, mit den zwei Zahlen |

```js
// Die zwei Schienen gegeneinander: 1,71 hell / 1,31 dunkel (T-189). Sie tragen
// die Unterscheidung **nicht** und sollen es nicht — sie ist seit T-194 Form
// (durchgezogen gegen unterbrochen). Im dunklen Thema laesst sich das gar nicht
// anders loesen: eine zweite Schiene mit 3:1 Abstand muesste dort praktisch
// weiss sein, weil das dunkle Fenster durch die eigene 3:1-Zusage gegen die
// Karte geschlossen ist (T-194 Abschnitt 2.2). Die Zahl steht hier, damit
// niemand sie ein zweites Mal sucht.
{ group: "Feldart", fg: "--note-billing-rail", bg: "--note-internal-rail", min: 0, exempt: true, note: "die beiden Randschienen gegeneinander — die Form traegt, nicht die Helligkeit" },
```

### 6.3 Die dreizehn übrigen Farben

Abschnitt 3, Zeile für Zeile. Fünf werden echte Paare mit Mindestwert, fünf benannte Ausnahmen mit
Zahl und Grund, vier gehören in die Liste „keine Kontrastfrage" mit je einem Satz Begründung.

### 6.4 Board-Leerzustand

| Datei | Änderung |
|---|---|
| `apps/web/src/screens/BoardScreen.tsx:1046-1053` | Der zweite primäre Knopf „Erste Spalte einrichten" entfällt; „Zur Todo-Liste" bleibt unverändert |

Kein Text kommt hinzu. Kein Klassenname, kein zugänglicher Name ändert sich. e2e-tester wird
darüber unterrichtet (Abschnitt 4.3).

### 6.5 Reihenfolge

6.1 und 6.4 sind voneinander unabhängig und können in einer Welle laufen. 6.2 berührt
`tokens.css`, `components.css`, zwei `.tsx` und `DESIGNSYSTEM.md` — eine Aufgabe, ein Agent, sonst
steht die berichtigte Zusage an drei Stellen und die alte an zwei. 6.3 ist Teil von A-A-45 und
hängt an dessen Mechanik, nicht an diesem Papier.

---

## 7. Vertrag (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Token |
|---|---|---|---|---|
| 1.3 Kommentar am Etikett | — | — | — | — |
| 1.5 zwei neue Paare | — | — | — | — |
| 2.3 Schienenform | — | — | `.note--billing::before` entfällt; `.note--billing` und `.note--internal` bleiben | `--note-billing-rail-stripe` **entfällt** |
| 3. Paare und Ausnahmen | — | — | — | — |
| 4.2 dritter Knopf entfällt | — | „Erste Spalte einrichten" steht danach einmal statt zweimal; **der Name selbst ist unverändert** | — | — |

**Kein Eintrag ändert eine Rolle oder einen zugänglichen Namen.** Der einzige Vertragspunkt ist
der wegfallende Token; er ist in genau einer Regel und einem Paar genannt, und beide fallen mit
ihm.

---

## 8. Befunde und offene Fragen

**B-5 — die Graustufenprobe kann kein Einzelmerkmal freisprechen.** Die Probe auf der Musterseite
(`showcase/NotesSection.tsx:42, 69`) schaltet den ganzen Abschnitt in Graustufen und zeigt beide
Feldarten nebeneinander. Sie besteht, solange **irgendeines** der sechs Merkmale trägt — und die
vier übrigen tragen. Genau deshalb ist ein Merkmal, das nichts tut, jahrelang durchgekommen.
**Vorschlag:** Die Probe bleibt (sie ist gut für das Bauteil), aber die Zusage je Merkmal hängt am
Lauf und nicht an ihr. Regel T-1 in Abschnitt 0 ist die allgemeine Fassung.

**B-6 — Verdacht, geometrisch begründet, nicht gemessen: der gestreifte Streifen wurde
möglicherweise nie gezeichnet.** `.note` setzt `position: relative` und `overflow: hidden`
(`components.css:1337-1342`); `.note--billing::before` ist absolut positioniert mit
`inset-inline-start: -4px; width: 4px`, liegt also vollständig **im Rahmenbereich** und damit
außerhalb des Innenrandkastens, an dem `overflow: hidden` beschneidet. Wenn das zutrifft, war das
zweite Merkmal von E-016 nicht schwach, sondern abwesend, und `contrast-check.mjs:233` maß eine
Farbe, die auf keinem Bildschirm vorkam. **Das ist zugleich ein lebendes Beispiel für die Grenze,
die security-checker selbst benannt hat:** Die erste Richtung von A-A-45 ist tokengenau und nicht
flächengenau — ein Token, dessen Klasse existiert, dessen Malerei aber weggeschnitten wird, kann
sie strukturell nicht sehen. **Meine Entscheidung hängt nicht davon ab** (die Berichtigung in 2.3
ist so oder so richtig und vermeidet die Bauform), aber der Verdacht gehört gemessen: eine
Sichtprüfung von visual-qa, oder ein Blick von frontend-dev beim Umbau. **Ich kann es nicht
messen** — hier läuft kein Browser.

**B-7 — zwei Unsymmetrien im Lauf, die derselben Bauart entstammen.** `--accent-bg-hover` und
`--accent-bg-active` sind gemessen, ihre `danger`-Geschwister nicht; der Text im Vermerkfeld ist
gemessen, der im Leistungsfeld nicht. Beides sind keine vergessenen Einzelfälle, sondern die Folge
davon, daß Paare beim Bauen eines Bildschirms entstehen und nicht beim Bauen eines Bauteils. A-A-45
schließt das; die Einordnung dafür steht in Abschnitt 3.

**B-8 — `apps/web/design/DESIGNSYSTEM.md:180-183` trägt einen veralteten Stand** („124 Paare
geprüft", Stand 2026-09-01) gegen inzwischen rund 240 Paare je Lauf. Kein eigener Auftrag, aber
beim Griff in die Datei nach 6.2 mitzunehmen (O-GK).

**F-4 — offen an den Orchestrator: soll das Feld `over` in `contrast-check.mjs` gebaut werden?**
Es machte die Messung teildurchsichtiger Farben flächengenau statt leinwandgenau (Abschnitt 6.1).
Ich halte es für richtig und nicht für dringend; ohne es bleibt die Grenze im Klartext im Lauf.

**F-5 — offen an ux-designer, nicht von mir zu beantworten:** ob und wie `textbestand.md` 1.2 die
Feststellung aus 5.3 übernimmt. Die Zeile gehört ihm; die Feststellung steht hier.

---

# 9. Nachtrag T-204 (Welle AE) — A-A-45, Token für Token

**Vorlage:** A-A-45 aus `.claude/team/reports/T-189-security-checker.md` (Befund T-189-7), Abschnitt
3 dieses Papiers (die erste Einordnung), der Umbau aus `.claude/team/reports/T-202-frontend-dev.md`,
das Feld `over` aus T-197, E-087, WCAG 2.2 SC 1.4.1, 1.4.3 und 1.4.11.

**Was hier dazukommt.** Abschnitt 3 hat die fünfzehn Farben ohne Paar eingeordnet, aber in einer
Tabelle, die aus T-189 abgeschrieben war. Dieser Nachtrag stellt die Liste **aus dem heutigen
Bestand** neu auf, entscheidet je Token, nennt die Fläche, den Mindestwert und den Grund — und
berichtigt dabei **eine eigene Zeile aus Abschnitt 3**. Er nimmt außerdem die Lehre aus O-HI mit:
*Ein Paar für eine Farbe, die nie gezeichnet wird, ist schlimmer als kein Paar; es sieht wie eine
Zusage aus.* Die Umkehrung gilt genauso — ein Paar, das eine **andere** Fläche misst als die
gezeichnete, ist dieselbe Art Zusage.

## 9.1 Erst die Zahl: es sind **vierzehn**, nicht dreizehn

Ich habe nicht abgeschrieben, sondern gezählt: jedes der fünfzehn Token aus T-189 gegen
`apps/web/src/styles/*.css` und gegen die Paarliste in `apps/web/scripts/contrast-check.mjs`.

* **Alle fünfzehn werden weiterhin gezeichnet.** Kein Token ist im Zuge von T-197 oder T-202
  weggefallen. (Weggefallen ist `--note-billing-rail-stripe` — das stand aber nie auf dieser Liste,
  es **hatte** ein Paar, und Paar und Token sind zusammen gefallen.)
* **Versorgt ist seit T-202 genau ein Token:** `--status-reopened-hatch`. Es hat dabei **zwei**
  Zeilen bekommen (das Deckelpaar mit `over` und die benannte Ausnahme). Wer Zeilen zählt, kommt auf
  zwei; wer Token zählt, auf eins. **Diese Liste zählt Token.**

Damit stehen **vierzehn** aus. Der Unterschied ist keine Meinungsverschiedenheit, sondern die
Auflösung der Zählweise; die Liste unten ist vollständig und aus dem Bestand erhoben, gleich welche
Zahl im Auftrag stand.

**Rechenweg (E-087).** Die Verhältnisse mit dem Vermerk *T-189* sind von security-checker gerechnet.
Die vier Zahlen zu `--focus-ring-contrast` in 9.3 habe ich mit derselben WCAG-Formel von Hand
gerechnet; die Gegenprobe steht dort. Alles andere ist **gerechnet oder übernommen, nicht vom Lauf
gemessen** — der Lauf sagt es, sobald die Zeilen darin stehen.

## 9.2 Vier Token bekommen ein echtes Paar

| Token | Fläche | min | Begründung |
|---|---|---:|---|
| `--danger-bg-hover` (`components.css:100-102`, `:209-210`) | `--text-on-solid` | **4,5** | Text auf gefüllter Fläche. `.btn--danger` setzt `color: var(--text-on-solid)`; unter dem Zeiger wechselt die Füllung, der Text nicht. Die symmetrischen Paare der Akzentfarbe stehen seit je im Lauf (Gruppe „Aktion", *Primaerknopf unter dem Zeiger* und *gedrueckt*). T-189: 9,00 / 11,45 |
| `--danger-bg-active` (`:105-106`) | `--text-on-solid` | **4,5** | dito, gedrückter Zustand. T-189: 11,52 / 14,84 |
| `--note-billing-bg` (`:1464-1466`) | `--text-primary` | **4,5** | Die **Schreibfläche des Leistungsfeldes** — der Text, der in die Abrechnung des Kunden geht (E-016). Für den Vermerk steht das Paar seit je (`--text-primary` / `--note-internal-bg`); dass ausgerechnet die exportierte Hälfte fehlte, ist die Unsymmetrie aus B-7. T-189: 15,76 / 14,64. **Auch dann einzutragen, wenn `--note-billing-bg` im hellen Thema zeichengleich `#ffffff` ist wie `--bg-surface`** — eine Zusage, die aus der Gleichheit zweier Tokenwerte folgt, hält nur so lange wie die Gleichheit (dieselbe Begründung wie `textabbau-gestalt.md` 6.2) |
| `--focus-ring-contrast` (`base.css:185-189`) | `--focus-ring-color` | **3** | siehe 9.3 — der einzige Eintrag dieser Liste, der nicht in einem Satz erledigt ist |

## 9.3 `--focus-ring-contrast` — das Paar misst, was gezeichnet wird, und das ist nicht, was der Kommentar sagt

**Die Geometrie zuerst, weil die Wahl der Fläche daran hängt.** `.on-solid:focus-visible` zeichnet
zwei Bänder, und **beide liegen außerhalb** des Randkastens des Knopfes:

```
.on-solid:focus-visible {
  outline-color: var(--focus-ring-contrast);                              /* [offset .. offset+width] */
  box-shadow: 0 0 0 calc(var(--focus-ring-width) + var(--focus-ring-offset)) var(--focus-ring-color);
}                                                                          /* [0 .. offset+width]     */
```

Bei `--focus-ring-offset: 2px` und `--focus-ring-width: 2px` ergibt das von der Kante des Knopfes
nach außen: **0–2 px `--focus-ring-color`**, **2–4 px `--focus-ring-contrast`** (die Kontur wird
über den Schatten gemalt), danach die Fläche, auf der der Knopf steht.

Daraus folgt: Der Gegenring berührt die **Füllung des Knopfes nicht**. Seine beiden Nachbarn sind
der innere Ring und die Fläche darunter. T-189 hat ihn gegen `--accent-bg` gemessen (5,98 / 6,26) —
das ist die Fläche, die der Kommentar meint („innerhalb gefuellter Flaechen"), aber nicht die, an
der er gezeichnet wird. Ein Paar gegen `--accent-bg` wäre grün und würde eine Nachbarschaft messen,
die es nicht gibt: genau der Fehler aus O-HI, nur in der anderen Richtung.

**Von Hand gerechnet (Gegenprobe unten):**

| Verhältnis | hell | dunkel |
|---|---:|---:|
| `--focus-ring-contrast` gegen `--focus-ring-color` — die Nachbarschaft, die gezeichnet wird | **5,99** | **9,14** |
| `--focus-ring-contrast` gegen `--bg-surface` — die Fläche nach außen | **1,00** | **1,11** |
| `--focus-ring-contrast` gegen `--bg-canvas` | **1,06** | **1,02** |

*Gegenprobe:* Im hellen Thema sind `--focus-ring-color` und `--accent-bg` zeichengleich `#2159da`;
meine 5,99 fällt damit auf T-189s 5,98 für dieselbe Farbe. Die Rechnung stimmt, die **Fläche** war
verschieden.

**Entscheidung.**

1. **Das Paar, das eingetragen wird:** `--focus-ring-contrast` gegen `--focus-ring-color`,
   **min 3**. Es misst, dass der Doppelring ein Doppelring bleibt — die einzige Nachbarschaft, die
   an dieser Stelle sicher gezeichnet wird, und die einzige, die der Lauf heute grün und wahr
   ausweisen kann.
2. **Was es ausdrücklich nicht misst:** ob der Fokus auf der Fläche **sichtbar** ist, auf der der
   Knopf steht. Das gehört in die Notiz des Paares, sonst ist das Paar selbst wieder eine zu große
   Zusage.
3. **B-11, gerechnet und nicht gemessen, an visual-qa und danach an frontend-dev:** Am
   **Primärknopf im hellen Thema** trägt der innere Ring dieselbe Farbe wie die Füllung
   (`--focus-ring-color` = `--accent-bg` = `#2159da`) und der Gegenring dieselbe wie die Karte
   (`#ffffff`). Nach dieser Rechnung bliebe vom Fokusring dort sichtbar: ein Knopf, der um 2 px
   wächst. Am **Gefahrenknopf** tritt das nicht auf (Füllung `#ac2a22`, der innere Ring hebt sich
   ab), im **dunklen Thema** auch nicht (`#93b4fc` gegen `#131b2b`). **Ich kann es nicht messen** —
   hier läuft kein Browser, und eine gerechnete Kaskade ist kein Bildschirm (E-087). Wenn die
   Messung den Verdacht bestätigt, ist das ein Befund zu SC 2.4.7 und SC 1.4.11 und **kein
   Nebenprodukt von A-A-45**; er braucht einen eigenen Auftrag. Was er **nicht** rechtfertigt: das
   Paar aus Punkt 1 wegzulassen oder es gegen `--bg-surface` zu setzen und den Lauf rot zu machen,
   bevor die Behebung entschieden ist. Ein roter Lauf in der Welle, die den Wächter einführt, wird
   als kaputter Wächter gelesen und nicht als gefundener Fehler.

## 9.4 Sechs Token bekommen eine benannte Ausnahme — mit Zahl und Grund

Alle sechs sind **Rahmen**. Keiner trägt Text, keiner trägt eine Grenze, die nicht schon von einer
Fläche oder einer Schiene getragen und gemessen würde. Wortlaut und Bauart wie die bestehende
Ausnahme für `--warning-border` („Umrandung des Warnbands, rein abgrenzend").

| Token | gegen | Zahlen (hell / dunkel) | Grund |
|---|---|---|---|
| `--status-exported-border` (`components.css:463-467`) | `--bg-surface` | 8,93 / 11,41 | **Berichtigt gegenüber Abschnitt 3 dieses Papiers.** Dort stand „Träger, min 3", begründet mit der Symmetrie zu „Offen" und „Erneut offen". Die Symmetrie trägt nicht: Jene zwei Etiketten sind **Konturetiketten ohne Füllung** — dort *ist* die Kontur die Grenze. „Exportiert" ist **voll gefüllt**, und seine Fläche hält die Grenze bereits mit min 3 (Paar *Flaeche Exportiert gegen Karte*). Die Kante grenzt nur ab. Ein zweites Paar mit Mindestwert behauptete, der Zustand hinge an ihr |
| `--success-border` (`components.css:613-617`, `:2800-2805`; `app.css:2809-2813`, `:2943-2947`) | `--bg-surface` | 1,50 / 2,04 | Rahmen von Meldeband, Chip und Etikett. Fläche, Symbol und Text tragen; alle drei sind gemessen |
| `--danger-border` (`components.css:623-627`, `:2812-2817`, `:3291`, `:3549`; `app.css:936-939`, `:2085`) | `--bg-surface` | 1,66 / 1,79 | dieselbe Klasse — **und zwei Merkposten, ohne die er zurückkommt.** Erstens: Die Kontur eines fehlerhaften Feldes ist `--danger-text` und nicht dieser Token; der Grund steht seit je bei `.field__input--invalid` (`app.css:1017-1026`). Zweitens: `.quitfail` sagt es selbst (`components.css:3550-3557`) — dort trägt die 3 px-Randschiene aus `--danger-bg`, und der helle Rand „traegt nicht" |
| `--note-internal-border` (`components.css:1393-1398`, `:1425`; `app.css:3159`) | `--bg-surface` | 1,46 / 1,57 | Der 1 px-Rahmen des Feldes und des Grenzhinweises. Getragen wird von der **Schiene**, und die ist zweimal gemessen (gegen die Karte und, seit T-202, als Balken gegen Lücke) |
| `--note-billing-border` (`components.css:1400-1403`) | `--bg-surface` | 1,53 / 1,98 | dito; die durchgezogene Schiene trägt mit 5,99 / 5,66 |
| `--timer-idle-border` (`components.css:1272-1281`) | `--bg-surface` **und** `--bg-subtle` | 1,46 / 1,30 und 1,57 / 1,43 | **Zwei Zeilen, weil die Uhr auf zwei Flächen steht.** Der erkennbare Zustand ist **laufend**; der Ruhezustand ist dessen Abwesenheit, und sein Rahmen grenzt den Kasten ab. Er kennzeichnet weder ein Bedienelement noch einen Zustand — die Uhr ist an Ziffern und Knopfbeschriftung erkennbar, nicht an ihrer Kante |

## 9.5 Vier Token bekommen **kein** Paar — und zwar nicht aus Nachsicht, sondern weil keines existiert

Das ist die Liste „keine Kontrastfrage" aus A-A-45. Bei allen vier ist ein Paar nicht bloß
überflüssig, sondern **baulich unmöglich** — und das ist die bessere Begründung, weil sie beim
nächsten Durchgang nicht verhandelbar ist.

| Token | Warum kein Paar |
|---|---|
| `--shadow-xs`, `--shadow-sm`, `--shadow-lg` | Der Wert ist **keine Farbe**, sondern eine Schattenkurzschrift (`0 1px 2px rgba(…)`, bei `--shadow-sm` und `--shadow-lg` sogar zwei Schatten). `parseColor` in `contrast-check.mjs` bräche mit *„Farbe nicht lesbar"* ab — ein Paar auf einen Schattentoken **stoppt den Lauf**, es lockert ihn nicht. Sachlich dasselbe: Ein Schatten hat keinen Vordergrund und keinen Hintergrund, er hat eine Richtung und eine Weichzeichnung. Er trägt in Takt nirgends eine Grenze; wo eine Kante nötig ist, steht ein Rahmen daneben |
| `--bg-scrim` | Zwei Gründe, beide hart. **Erstens:** Die Farbe ist teildurchsichtig (`rgba(15,21,32,0.48)` hell, `rgba(3,6,12,0.68)` dunkel), und seit T-197 ist `over` bei teildurchsichtigem `bg` **Pflicht**. Was unter der Abdunklung liegt, ist die ganze Anwendung — jede Fläche, in jeder Ansicht. Es gibt keine Kette, die man wahrheitsgemäß hinschreiben könnte, und eine geratene Fläche ist genau der Fehler, gegen den `over` gebaut wurde. **Zweitens:** Ihre Aufgabe ist, Kontrast zu **nehmen**. Ein Mindestwert wäre die Umkehrung ihres Zwecks |

**Zur Mechanik von A-A-45, als Bedingung aus der Gestaltung** (unverändert aus Abschnitt 3, hier
verschärft): Die Liste braucht je Eintrag einen **Grund im Klartext**, und der Grund muss sagen,
*warum es kein Paar geben kann* — nicht bloß, dass es keines gibt. Eine Ausnahmeliste ohne Gründe
wird beim nächsten Durchgang zur Ablage für alles, was rot war.

## 9.6 Übergabe an frontend-dev — die Zeilen

Vier Paare, sieben Ausnahmezeilen (`--timer-idle-border` zweimal), vier Einträge in der Liste „keine
Kontrastfrage". Gruppen wie im Lauf.

```js
// Gruppe "Aktion" — die Gefahrenfarbe war die einzige der vier gefuellten
// Knopfarten ohne diese zwei Paare. Keine Ausnahme, eine Unsymmetrie
// (T-194 B-7): Paare entstehen beim Bauen eines Bildschirms, nicht beim
// Bauen eines Bauteils.
{ group: "Aktion", fg: "--text-on-solid", bg: "--danger-bg-hover", min: 4.5, note: "Gefahrenknopf unter dem Zeiger" },
{ group: "Aktion", fg: "--text-on-solid", bg: "--danger-bg-active", min: 4.5, note: "Gefahrenknopf gedrueckt" },

// Gruppe "Feldart" — die Schreibflaeche des Leistungsfeldes. Fuer den Vermerk
// steht dasselbe Paar seit je; die exportierte Haelfte fehlte.
{ group: "Feldart", fg: "--text-primary", bg: "--note-billing-bg", min: 4.5, note: "Text im Leistungsfeld — die Notiz, die in die Abrechnung geht" },

// Gruppe "Anwendung" — der Gegenring auf gefuellten Knoepfen.
// `.on-solid:focus-visible` zeichnet zwei Baender, beide **ausserhalb** des
// Randkastens: 0..2px `--focus-ring-color` (Schatten), 2..4px
// `--focus-ring-contrast` (Kontur ueber dem Schatten). Gemessen wird deshalb
// die Nachbarschaft der beiden Ringe und nicht die Fuellung des Knopfes — die
// beruehrt der Gegenring gar nicht. Was dieses Paar **nicht** sagt: ob der
// Fokus auf der Flaeche sichtbar ist, auf der der Knopf steht (T-204 9.3,
// Befund B-11 — gerechnet 1,00 hell gegen `--bg-surface`, zu messen).
{ group: "Anwendung", fg: "--focus-ring-contrast", bg: "--focus-ring-color", min: 3, note: "Gegenring gegen inneren Ring auf gefuellten Knoepfen, SC 1.4.11" },

// Sechs Raender, die keine Grenze tragen. Wortlaut wie die bestehende Ausnahme
// fuer `--warning-border`: die Zahl steht dabei, damit die Ausnahme eine
// Entscheidung bleibt und kein Versehen.
{ group: "Exportstatus", fg: "--status-exported-border", bg: "--bg-surface", min: 0, exempt: true, note: "Kante des gefuellten Etiketts Exportiert — 8,93 hell, 11,41 dunkel; die Flaeche traegt die Grenze und ist mit min 3 gemessen" },
{ group: "Anwendung", fg: "--success-border", bg: "--bg-surface", min: 0, exempt: true, note: "Umrandung von Erfolgsband, Chip und Etikett — 1,50 hell, 2,04 dunkel, rein abgrenzend" },
{ group: "Anwendung", fg: "--danger-border", bg: "--bg-surface", min: 0, exempt: true, note: "Umrandung von Fehlerband, Chip und Kachel — 1,66 hell, 1,79 dunkel, rein abgrenzend. Die Kontur eines fehlerhaften Feldes ist `--danger-text`, die Schiene von `.quitfail` ist `--danger-bg`" },
{ group: "Feldart", fg: "--note-internal-border", bg: "--bg-surface", min: 0, exempt: true, note: "1px-Rahmen des Vermerkfeldes — 1,46 hell, 1,57 dunkel; getragen wird von der Schiene" },
{ group: "Feldart", fg: "--note-billing-border", bg: "--bg-surface", min: 0, exempt: true, note: "1px-Rahmen des Leistungsfeldes — 1,53 hell, 1,98 dunkel; getragen wird von der Schiene" },
{ group: "Timer", fg: "--timer-idle-border", bg: "--bg-surface", min: 0, exempt: true, note: "Kante der ruhenden Uhr auf der Karte — 1,46 hell, 1,57 dunkel; der erkennbare Zustand ist laufend" },
{ group: "Timer", fg: "--timer-idle-border", bg: "--bg-subtle", min: 0, exempt: true, note: "dieselbe Kante auf getoenter Flaeche — 1,30 hell, 1,43 dunkel" },
```

**Und die vier Einträge, die *kein* Paar sind.** Sie gehören in eine eigene, benannte Liste des
Laufes und ausdrücklich **nicht** in ein `exempt`-Paar: Ein Paar behauptet eine Beziehung zwischen
zwei Farben, und die gibt es hier nicht. Bei den drei Schattentoken käme dazu, dass der Lauf an
ihnen **abbräche** (9.5).

```js
/**
 * Token, die gezeichnet werden und keine Kontrastfrage stellen. Die
 * Vollstaendigkeitspruefung (A-A-45) nimmt sie von der Forderung „Paar oder
 * benannte Ausnahme" aus — je Eintrag mit dem Grund, warum es ein Paar hier
 * nicht geben **kann**. Ohne diesen Zusatz wird die Liste beim naechsten
 * Durchgang zur Ablage fuer alles, was rot war.
 */
const noContrastQuestion = [
  ["--shadow-xs", "Schattenkurzschrift, keine Farbe — `parseColor` braeche ab. Ein Schatten hat keinen Vorder- und keinen Hintergrund"],
  ["--shadow-sm", "wie oben, zwei Schatten in einem Wert"],
  ["--shadow-lg", "wie oben, zwei Schatten in einem Wert"],
  ["--bg-scrim",  "teildurchsichtig, und was darunter liegt, ist die ganze Anwendung — `over` liesse sich nur raten. Ihre Aufgabe ist, Kontrast zu nehmen"],
];
```

## 9.7 Befunde aus 9

**B-11** — der Fokusring am Primärknopf im hellen Thema. Abschnitt 9.3, gerechnet, nicht gemessen.
An visual-qa; **nicht** in derselben Änderung wie A-A-45.

**B-12 — noch eine Graustufenzusage ohne Paar, gefunden beim Einordnen von `--danger-border`.**
`app.css:932-935` sagt über die Kachel „Überfällig": *„Beide Merkmale — Rahmen und Flaeche —
wechseln, damit die Kachel auch in Graustufen die auffaelligste bleibt (SC 1.4.1)."* Der Rahmen ist
`--danger-border` bei 1,66 / 1,79 und kann in Graustufen nichts auffällig machen; er ist nach
Abschnitt 0 dieses Papiers eine **Verstärkung**, kein Träger. Ob die **Fläche** es tut, ist die
offene Hälfte: `--danger-bg-subtle` gegen `--warning-bg` — also Kachel gegen Nachbarkachel — hat
**kein Paar**. Das ist dieselbe Bauart wie T-189-5 und T-189-6, nur eine Ansicht weiter.
**Kein Auftrag aus dieser Aufgabe**, und ausdrücklich keine Vermutung darüber, wie die Zahl ausfällt.
Zwei Wege stehen offen, und sie schließen sich nicht aus: die Zahl messen und hinschreiben, oder den
Satz auf das berichtigen, was dort wirklich trägt (die Beschriftung „Überfällig" und der Umstand,
dass die Kachel nur bei einer Zahl größer null überhaupt erscheint). Beim nächsten Griff in
`app.css` mitzunehmen — O-GK.

**B-13 — eine Grenze der Zählweise, die A-A-45 mitbringt und die im Kopf des Laufes stehen sollte.**
Die Prüfung ist **tokengenau, nicht flächengenau** (so schon T-189-8 für die erste Richtung). Sie
findet ein gezeichnetes Token ohne Paar. Sie findet **nicht**, dass ein vorhandenes Paar die falsche
Fläche misst — genau der Fall, den 9.3 an `--focus-ring-contrast` zeigt und den T-197 mit `over` für
die Teildurchsichtigkeit gelöst hat. Der Satz gehört neben die Grenze, die dort schon steht, sonst
wird A-A-45 für mehr gehalten, als sie ist.

---

# 10. Nachtrag T-213 (Welle AF) — der Ring, den niemand sieht, und die Kachel, die niemand findet

**Vorlage:** `.claude/team/reports/T-210-visual-qa.md` Abschnitte 1 und 3 (Befunde B-11 und B-12,
beide **hoch**), Board O-JA und O-JC, Abschnitt 9.3 und 9.7 dieses Papiers, Abschnitt 0 (Maßstab
und Regeln T-1 bis T-3), das Feld `over` aus T-197, der Vollständigkeitswächter aus T-209, E-087,
WCAG 2.2 SC 1.4.1, SC 1.4.11 und SC 2.4.7, `packages/ui-tokens/tokens.css`,
`apps/web/src/styles/base.css`, `app.css`, `components.css`,
`apps/web/scripts/contrast-check.mjs`, `apps/web/src/components/Primitives.tsx`,
`apps/web/src/screens/parts.tsx`.

**Was hier dazukommt.** Zwei meiner gerechneten Befunde sind in T-210 an echten Pixeln gemessen und
**nicht** widerlegt worden. Beide brauchen jetzt Werte. Dieser Nachtrag entscheidet sie, nennt die
Zahlen, die Paare und die Zeilen — und er berichtigt dabei **eine Einordnung aus Abschnitt 9.3
dieses Papiers**, die für die damalige Bauform richtig war und für die neue nicht mehr gilt.

**Rechenweg und seine Herkunft (E-087).** Die Pixel- und Graustufenwerte stammen aus T-210, die
Verhältnisse mit dem Vermerk *T-189* von security-checker. Alle übrigen Zahlen unten habe ich mit
derselben WCAG-Formel von Hand gerechnet, die `contrast-check.mjs` benutzt. Drei Gegenproben, damit
die Kette prüfbar ist:

* `--focus-ring-contrast` gegen `--accent-bg` ergibt bei mir 5,99 hell und 6,27 dunkel — T-189 hat
  für dasselbe Paar 5,98 und 6,26 gemessen.
* `--focus-ring-contrast` gegen `--danger-bg` ergibt hell 6,75 — zeichengleich mit dem seit T-020
  laufenden Paar `--text-on-solid` gegen `--danger-bg`, denn im hellen Thema sind beide Token
  `#ffffff`.
* `--danger-bg-subtle` gegen `--bg-surface` ergibt bei mir 1,11 hell — T-210 hat 1,111 aus den Token
  und 1,11 aus dem Bildschirmabzug.

Wo meine Rechnung von einer früheren abweicht, steht es dabei. **Gerechnet ist nicht gemessen**; der
Lauf sagt es, sobald die Zeilen aus 10.12 darin stehen.

---

## 10.1 O-JA — der Befund, und warum er nicht der Befund über einen Knopf ist

T-210 hat am Primärknopf im hellen Thema gemessen: **beide** Bänder des Doppelrings liegen bei
**1,00:1** gegen ihre jeweilige Nachbarfläche. Sichtbar bleibt ein einziger harter Übergang mitten
im Ring — ein Knopf, der beim Tabulieren um 2 px wächst. Das ist SC 2.4.7 (Fokus sichtbar) und
SC 1.4.11 (Nichttextkontrast) am meistgenutzten Knopftyp des Standardthemas.

**Die Geometrie ist dieselbe wie in 9.3, und sie ist der Kern.** `.on-solid:focus-visible` zeichnet
von der Kante des Knopfes nach außen:

```
0 .. 2px   --focus-ring-color      (box-shadow, Streuung width+offset)
2 .. 4px   --focus-ring-contrast   (outline, offset 2px, ueber dem Schatten)
ab 4px     die Flaeche, auf der der Knopf steht
```

Damit gibt es **drei Nahtstellen** und nicht zwei: Füllung|innen, innen|außen, außen|Fläche. Das ist
der Maßstab, der in Abschnitt 0 noch fehlte, und er wird hier nachgetragen.

> **Regel T-4 — die drei Nahtstellen eines Doppelrings.** Ein Fokusring aus zwei Bändern ist
> sichtbar, wenn **mindestens ein Band auf beiden Seiten von einer Nahtstelle ≥ 3:1 begrenzt** wird.
> Ein Band, das nur auf einer Seite hält, ist kein Band, sondern eine Kante — und eine Kante an der
> Stelle, an der ohnehin die Kante des Bedienelements erwartet wird, liest sich als Größenänderung
> und nicht als Zustand.

An diesem Maßstab sah der Bestand **vor dem Tausch** so aus (alle Zahlen von Hand gerechnet, die
1,00 und 1,00 des ersten Falls von T-210 an Pixeln bestätigt). Die Tabelle bleibt als Befund
stehen; sie beschreibt seit T-216 nicht mehr das Erzeugnis, sondern das, was behoben wurde — die
Zahlen danach stehen in 10.4, und die 1,13 der zweiten Zeile ist dort **6,76**:

| Fall | Füllung \| innen | innen \| außen | außen \| Fläche | begrenztes Band? |
|---|---:|---:|---:|---|
| Primär, hell | **1,00** | 5,99 | **1,00** | **keines** |
| Gefahr, hell | **1,13** | 5,99 | **1,00** | **keines** |
| Primär, dunkel | **1,47** | ~9,2 | **1,11** | **keines** |
| Gefahr, dunkel | **1,16** | ~9,2 | **1,11** | **keines** |

**Das ist der eigentliche Befund, und er ist größer als O-JA ihn stellt: In keiner der vier
Kombinationen ist ein Band auf beiden Seiten begrenzt.** Was die vier unterscheidet, ist nicht, *ob*
eine starke Nahtstelle existiert — die mittlere ist überall stark —, sondern **wo sie sitzt**:

* Bei *Gefahr, hell* fällt das äußere Band mit der Karte zusammen; die starke Naht sitzt 2 px
  außerhalb der Knopfkante, und innen liegt ein Farbtonwechsel Blau→Rot. Ein Mensch mit normalem
  Farbsehen sieht dort ein blaues Band. **In Graustufen sieht er dasselbe wie beim Primärknopf**:
  1,13 ist kein Helligkeitsunterschied. Der Ring dieses Knopfes hängt heute allein am Farbton.
* Bei beiden dunklen Fällen fällt das äußere Band mit der Fläche zusammen; sichtbar bleibt das helle
  Innenband, dessen äußere Naht mit ~9,2 sehr stark ist. Es liest sich als Ring, weil die starke
  Naht 2 px **außerhalb** der scheinbaren Kante sitzt und nicht auf ihr.
* Bei *Primär, hell* fallen **beide** Bänder mit ihrem Nachbarn zusammen. Die einzige starke Naht
  sitzt genau dort, wo das Auge die Knopfkante erwartet. Deshalb ist dieser eine Fall der, den man
  als kaputt sieht — und die anderen drei sind nicht heil, sondern **glücklich**.

**Folge für die Einstufung im Auftrag.** „Gefahrenknopf und dunkles Thema sind bestätigt **nicht**
betroffen" ist richtig unter dem Maßstab *ist überhaupt etwas zu sehen* — genau das hat T-210
gemessen, und die Messung steht. Unter dem Maßstab von SC 1.4.11 (3:1, ein Verhältnis, kein
Farbton) trägt keiner der vier Fälle. **Das ändert die Entscheidung unten nicht — es macht sie nur
zu einer für alle vier statt für einen.** Und es ist kein Widerspruch zu visual-qa: Er hat
gemessen, was er messen sollte, und die Zahl 1,13 steht in seinem eigenen Bild.

---

## 10.2 Entscheidung: die beiden Bänder tauschen den Platz. Kein Farbwert ändert sich

**Vorgabe.** In `apps/web/src/styles/base.css` verliert `.on-solid:focus-visible` seine
`outline-color`-Zeile, und der Schatten bekommt den Gegenton:

```css
.on-solid:focus-visible {
  box-shadow: 0 0 0 calc(var(--focus-ring-width) + var(--focus-ring-offset))
    var(--focus-ring-contrast);
}
```

Danach zeichnet dieselbe Regel:

```
0 .. 2px   --focus-ring-contrast   (Gegenband, beruehrt die Fuellung)
2 .. 4px   --focus-ring-color      (Kontur aus :focus-visible, beruehrt die Flaeche)
ab 4px     die Flaeche
```

**Kein neues Token. Kein neuer Farbwert. Keine geänderte Zeile in `tokens.css` außer einem
Kommentar.** Vier Werte bleiben, wie sie sind: `--focus-ring-color` `#2159da` / `#93b4fc`,
`--focus-ring-contrast` `#ffffff` / `#06101f`.

**Warum das nicht Kosmetik, sondern die Auflösung des Fehlers ist.** Die beiden Token haben
verschiedene Aufgaben, und die Bauform hat sie vertauscht:

* `--focus-ring-color` ist der Ring **jedes** Bedienelements der Anwendung. Sein Ton ist genau
  darauf ausgelegt, gegen die Flächen zu tragen — dafür laufen seit T-022 drei Paare (`--bg-surface`,
  `--bg-canvas`, `--bg-subtle`, je min 3) und seit T-091 ein viertes (`--bg-surface-alt`). Er gehört
  **nach außen**, an die Fläche.
* `--focus-ring-contrast` gibt es ausschließlich für `.on-solid`. Seine Aufgabe steht seit T-013 im
  Kommentar darüber: *„Innerhalb gefuellter Flaechen braucht der Ring einen hellen Gegenring, sonst
  verschwindet er auf der Fuellfarbe."* Genau das kann er nur, wenn er die Füllfarbe **berührt**. Er
  gehört **nach innen**.

Der Kommentar in `base.css` beschreibt seit T-013 die richtige Absicht und die falsche Zeichnung.
Nach dem Tausch stimmt er zum ersten Mal.

**Und der Gewinn ist mehr als die Behebung:** Danach hat **jeder** Fokusring in Takt dieselbe äußere
Kante — `--focus-ring-color` gegen die Fläche, gemessen von denselben vier Paaren, die es ohnehin
schon gibt. `.on-solid` **fügt** dann etwas hinzu (ein Gegenband innen), statt etwas zu **ersetzen**
(die Konturfarbe). Ein Sonderfall weniger, keine neue Zusage.

---

## 10.3 Warum kein besserer Farbwert — und im dunklen Thema gibt es gar keinen

Die Frage muss gestellt werden, weil sie sonst zurückkommt: Ließe sich die heutige Anordnung
behalten und nur der Wert ändern? Bleibt die Anordnung, so muss `--focus-ring-color` das Innenband
sein — und dann muss **derselbe Token** zugleich

1. ≥ 3:1 gegen `--accent-bg` und gegen `--danger-bg` halten (er berührt beide Füllungen) **und**
2. ≥ 3:1 gegen die Flächen halten, denn er ist zugleich der einzige Ring aller übrigen
   Bedienelemente.

**Helles Thema — ein Fenster bleibt, und es ist Schwarz.** Mit den Leuchtdichten
`--bg-surface` 1,000, `--accent-bg` 0,1253, `--danger-bg` 0,1055:

| Bedingung | erlaubter Bereich für L |
|---|---|
| ≥ 3 gegen `--bg-surface` | L ≤ 0,300 |
| ≥ 3 gegen `--accent-bg` | L ≥ 0,476 **oder** L ≤ 0,0084 |
| ≥ 3 gegen `--danger-bg` | L ≥ 0,416 **oder** L ≤ 0,0018 |

Die oberen Fenster sind durch die erste Zeile geschlossen. Es bleibt **L ≤ 0,0018**, also ein
Neutralton, der nicht heller sein darf als **`#060606`**. Das heißt: ein schwarzer Fokusring für die
gesamte Anwendung, der Akzent verschwindet aus dem Fokus, alle bestehenden Ringpaare werden neu
gerechnet — und `--focus-ring-contrast` bräuchte dazu einen zweiten neuen Wert im Fenster
[0,105 … 0,300], also ein Mittelgrau. **Zwei neue Werte, jeder Fokusring der Anwendung verändert.**

**Dunkles Thema — es bleibt gar nichts.** Mit `--bg-surface` 0,0110, `--accent-bg` 0,2952,
`--danger-bg` 0,3898:

| Bedingung | erlaubter Bereich für L |
|---|---|
| ≥ 3 gegen `--accent-bg` | L ≥ 0,986 **oder** L ≤ 0,0651 |
| ≥ 3 gegen `--danger-bg` | L ≥ 1,269 (unmöglich) **oder** L ≤ 0,0966 |
| ≥ 3 gegen `--bg-surface` | L ≥ 0,1329 **oder** L ≤ −0,030 (unmöglich) |

Die ersten beiden Zeilen verlangen L ≤ 0,0651, die dritte verlangt L ≥ 0,1329. **Der Schnitt ist
leer. Für die heutige Anordnung existiert im dunklen Thema kein gültiger Wert — keiner, nicht ein
schlechter.** Das ist dieselbe Art von Beweis wie in Abschnitt 2.2, wo das untere Fenster der
Vermerkschiene arithmetisch geschlossen war, und dieselbe Folge: **Die Frage ist entschieden, nicht
abgewogen. Die Anordnung ist der Fehler, nicht der Wert.**

**Der dritte Weg, der keiner ist.** Man könnte `.on-solid` ein *drittes* Token für das Innenband
geben und die Anordnung lassen. Der Wert, den dieses Token bräuchte, wäre in beiden Themen
zeichengleich mit `--focus-ring-contrast`. Ein Token, das die Kopie eines vorhandenen ist, hat Takt
zuletzt in T-194 losgeworden (`--note-billing-rail-stripe`). Kein Grund, sich ein neues zu bauen.

---

## 10.4 Was danach gemessen ist — alle drei Nahtstellen, beide Themen, beide Knopfarten

**Gebaut und gemessen in T-216. Die Spalten „Lauf" und „Pixel" ersetzen meine Handrechnung; wo sie
auseinandergingen, gilt der Lauf (E-087).**

| Nahtstelle | Paar | hell (Lauf) | hell (Pixel) | dunkel (Lauf) | dunkel (Pixel) |
|---|---|---:|---:|---:|---:|
| Füllung Primär \| Gegenband | `--focus-ring-contrast` / `--accent-bg` | **5,98** | 5,99 | **6,26** | 6,27 |
| Füllung Gefahr \| Gegenband | `--focus-ring-contrast` / `--danger-bg` | **6,75** | **6,76** | **7,98** | 7,98 |
| Gegenband \| Kontur | `--focus-ring-contrast` / `--focus-ring-color` | 5,99 | 5,99 | **9,23** | 9,24 |
| Kontur \| Karte | `--focus-ring-color` / `--bg-surface` | 5,99 | 5,99 | 8,34 | 8,34 |
| Kontur \| Hintergrund | `--focus-ring-color` / `--bg-canvas` | **5,63** | — | **9,07** | — |
| Kontur \| Werkzeugleiste, Spalte, Tabellenkopf | `--focus-ring-color` / `--bg-subtle` | **5,33** | — | **7,63** | — |
| Kontur \| Zebrazeile | `--focus-ring-color` / `--bg-surface-alt` | **5,83** | — | (Paar vorhanden) | — |

**Der kleinste Wert der ganzen Tabelle ist 5,33 — knapp das Doppelte der Forderung; T-216 bestätigt
ihn als kleinste Zahl der ganzen Reihe.** Alle vier Zeilen der unteren Hälfte sind **heute schon**
Paare im Lauf und heute schon grün; sie werden durch den Tausch nicht angefasst, sie werden nur zum
ersten Mal zu der Naht, die sie messen. Neu sind allein die beiden ersten Zeilen.

**Drei meiner Zahlen sind vom Erbauer berichtigt worden, und die Abweichungen sagen etwas.** Aus
„~9,2" wurde **9,23** im Lauf; aus meinen 5,99 / 6,27 wurden **5,98 / 6,26**. Das ist keine
Rundungspedanterie, sondern die Trennung zweier Meßarten: Der Lauf flächt Token, der Browser liest
Pixel, und beide dürfen um eine Hundertstelstelle auseinanderliegen — **welche Zahl in welchen
Kommentar gehört, hängt davon ab, was der Kommentar behauptet.** Steht dort eine Zusage über die
gezeichnete Naht, ist es die Pixelzahl; steht dort ein Paar, ist es die Zahl des Laufs. Die dritte
Berichtigung ist keine Abweichung, sondern ein Fehler von mir; sie steht in 10.11.2.

**Die Vorhersage aus 10.1 ist eingetroffen und ist die eigentliche Nachricht dieser Messung:** Alle
vier Kombinationen zeigen nach dem Tausch **drei Zonen mit zwei deutlichen Übergängen** — vorher
war in keiner ein Band beidseits begrenzt (T-4). Der Gefahrenknopf im hellen Thema, den T-210 als
unbetroffen führte, geht an seiner Füllungsnaht von **1,13 auf 6,76**. Das ist der Fall, dessen
Ring bis dahin allein am Farbton Blau gegen Rot hing, und er ist der Beleg dafür, daß die
Entscheidung für **alle vier** und nicht für den einen sichtbar kaputten Fall richtig war.

**Die Voraussetzung dieser ganzen Tabelle ist seit T-233 gemessen, und sie hält.** Die drei Zonen
entstehen nur, wenn die Umrandung **über** den Schatten gemalt wird (die Geometrie in 10.1). Das
war in Chromium belegt und in den beiden ausgelieferten WebKit-Engines eine Annahme — die Grenze,
die O-JV führt. Der Orchestrator hat den Gefahrenknopf im hellen Thema in **WebKitGTK 4.1** und in
Chromium gegen dieselbe Vorrichtung abgezogen; der Schnitt von der Fläche zur Füllung lautet in
**beiden** Engines zeichengleich:

```
#2159da  #2159da   --focus-ring-color     (Umrandung, 2..4 px, ueber dem Schatten)
#ffffff  #ffffff   --focus-ring-contrast  (Schatten,   0..2 px, an der Fuellung)
          Fuellung
```

**Die Malreihenfolge trägt also auch dort, und der Tausch aus 10.2 kommt in WebKitGTK genauso an
wie in Chromium.** Damit ist O-JV zur Hälfte erledigt. Es bleibt: **macOS/WKWebView ist
ungemessen**, und gemessen ist die **Engine-Familie**, nicht die gebaute Binärdatei — beides gehört
an jede Aussage, die sich auf diese Messung stützt. Die zweite Hälfte kostet nach wie vor genau
einen Abzug eines fokussierten Knopfes aus einem Auslieferungsbau.

---

## 10.5 Alle Knopfarten, je einzeln — und keine braucht einen eigenen Wert

Die Frage aus O-JA Punkt (c), Art für Art. `.on-solid` wird an genau zwei Stellen vergeben
(`Primitives.tsx` in `Button` und in `IconButton`, je `variant === "primary" || variant ===
"danger"`); außerhalb dieser beiden Zeilen schreibt niemand die Klasse hin.

| Art | Trägt `.on-solid`? | Nach dem Tausch | Eigener Wert nötig? |
|---|---|---|---|
| `primary` (Knopf und Symbolknopf) | ja | 5,99 / 5,99 / 5,99 hell, 6,27 / 9,24 / 8,34 dunkel (an Pixeln, T-216) | **nein** |
| `danger` (Knopf und Symbolknopf) | ja | **6,76** / 5,99 / 5,99 hell, 7,98 / 9,24 / 8,34 dunkel (an Pixeln, T-216) | **nein** — der Gegenton ist gegen Rot sogar **stärker** als gegen Blau |
| `secondary` | nein | unverändert: ein Ring, beide Nachbarn sind die Fläche, 5,33 bis 5,99 hell | **nein** |
| `ghost` | nein | dito, die Füllung ist durchsichtig | **nein** |
| `primary`/`danger` **weich gesperrt** (`aria-disabled`) | ja, die Klasse bleibt | Füllung wird `--bg-disabled`; Gegenband trägt dort **nicht** (Tokenpaar 1,12 / 1,21; an Pixeln gegen die Kante des gesperrten Knopfes 1,46 / 1,74 — T-216), die Kontur außen trägt mit 5,33 bis 5,99 | **nein**, aber eine benannte Ausnahme — siehe 10.12 |
| `primary`/`danger` unter dem Zeiger und gedrückt | ja | Füllung wird dunkler (hell) beziehungsweise heller (dunkel); der Grundzustand ist in beiden Themen der **schlechteste** Fall | **nein**, zwei Paare genügen |
| `.skip-link` | **nein**, und das bleibt so | gefüllt und fokussierbar, aber ohne Schatten: die 2 px Versatz zeigen die Seite, der Ring ist beidseits von ihr begrenzt | **nein** — und ausdrücklich **nicht** „aus Konsistenz" `.on-solid` nachrüsten |

**Zur vorletzten Zeile, weil sie sonst als Lücke gelesen wird:** Der Grundzustand ist in beiden
Themen der Extremfall. Hell wird die Füllung unter dem Zeiger dunkler (`--accent-bg-hover` 8,17
gegen Weiß statt 5,99), dunkel wird sie heller (`--accent-bg-hover` ~9,2 gegen `#06101f` statt
6,27). Wer die Zustände zusätzlich messen will, misst bessere Zahlen. **Zwei Paare, nicht sechs.**

---

## 10.6 Zustände, hoher Kontrast, Bewegung, Responsives

* **Zeiger, gedrückt, ladend.** Unverändert. Der ladende Knopf behält seine Füllung
  (`components.css:146-155`) und damit seine 5,99 beziehungsweise 6,75.
* **Weich gesperrt.** Der Ring bleibt, wie `components.css:121-125` es fordert. Er wird nach dem
  Tausch vom **äußeren** Band getragen statt vom inneren — vorher war es umgekehrt. In beiden Fällen
  ist genau ein Band begrenzt; es gibt hier keinen Rückschritt, nur einen Seitenwechsel. Die Zahl
  gehört trotzdem in den Lauf, sonst sucht sie jemand ein zweites Mal.
* **Hoher Kontrast** (`prefers-contrast: more`, `--focus-ring-width: 3px`). Die Geometrie wird
  0–2 px Gegenband, 2–5 px Kontur: das Gegenband behält die Breite des **Versatzes**, die Kontur
  wird breiter. Das ist die richtige Richtung — was breiter wird, ist das Band, das gegen die Fläche
  trägt. **Nichts zu tun.**
* **Bewegung.** Keine. Ein Fokusring wird nicht eingeblendet; `base.css:209-218` wäre ohnehin die
  Gegenprobe. Die heutige Erscheinung — ein Knopf, der zu wachsen scheint — ist genau das, was von
  einer Übergangsanimation nicht zu unterscheiden wäre (T-210). Nach dem Tausch ist der Ring eine
  Fläche und keine Größenänderung.
* **Responsiv.** Keine Umbruchmarke berührt. Der Ring liegt außerhalb des Randkastens und wird von
  keiner Breite beschnitten — außer von `overflow: hidden` eines Elternelements, und das ist der
  offene Punkt B-15 unten.

---

## 10.7 O-JC — die Kachel „Überfällig", und hier hilft wirklich kein Wert

T-210 hat die Fläche gemessen: **1,01 bis 1,13:1** in Graustufen gegen jede Nachbarfläche, in beiden
Themen — schlechter als der schon bekannte Rahmen (1,66 / 1,79). Im Bildbeleg
`b12-02-light-gray.png` sind alle vier sichtbaren Kacheln praktisch ununterscheidbar. Der Quelltext
(`app.css:943-946`) sagt dazu: *„Beide Merkmale — Rahmen und Flaeche — wechseln, damit die Kachel
auch in Graustufen die auffaelligste bleibt (SC 1.4.1)."* Der Satz ist für **beide** genannten
Merkmale falsch.

**Warum ein besserer Flächenwert der falsche Weg ist — mit der Rechnung.** Damit
`--danger-bg-subtle` im hellen Thema 3:1 gegen `--bg-canvas` erreicht, müsste seine Leuchtdichte auf
**L ≤ 0,279** fallen. Heute liegt sie bei 0,894. Das ist kein dunkleres Rosé, das ist ein
mitteltiefes Rot — die Kachel wäre keine getönte Kachel mehr, sondern ein gefülltes Meldeband. Drei
Folgen, jede für sich hinreichend:

1. **Der Token wird nicht nur hier gezeichnet.** `--danger-bg-subtle` trägt die Startmeldung, den
   Sperrdialog, Fehlerchips und Fehlerbänder (`contrast-check.mjs`, Gruppen *Startmeldung*,
   *Sperrmeldung*, *Aktion*). Eine Wertänderung färbt sie alle um. Ein Kacheln-Problem wird zu
   einem Produktumbau.
2. **Die Reihe kippt.** Vier Kacheln nebeneinander, drei davon zart getönt, eine gefüllt: Das ist
   nicht mehr „die lauteste der Reihe", das ist ein anderes Bauteil in der Reihe.
3. **Und es löste die Zusage trotzdem nur halb.** Der Satz behauptet, die Kachel bleibe *in
   Graustufen die auffälligste*. Ein Flächenwert allein wäre wieder genau ein Merkmal, das an einer
   Zahl hängt — und wer ihn später um zehn Prozent aufhellt, hat die Zusage still wieder gebrochen.

**Also dasselbe Urteil wie bei den Schienen in Abschnitt 2: Die Trennung muss die Form tragen.**

### 10.7.1 Entscheidung: eine Randschiene, an genau einer Kachel

**Vorgabe.**

```css
.stat--danger {
  border-color: var(--danger-border);
  border-inline-start-width: 4px;
  border-inline-start-color: var(--danger-bg);
  padding-inline-start: calc(var(--space-4) - 3px);
  background-color: var(--danger-bg-subtle);
}
```

**Es ist kein neues Mittel.** Dieselbe Vorrichtung, Zeile für Zeile, steht seit T-097 in
`components.css:3290-3294`:

```css
.shellnote--startup {
  border-color: var(--danger-border);
  border-inline-start-color: var(--danger-bg);   /* Breite kommt aus .shellnote: 4px */
  background-color: var(--danger-bg-subtle);
}
```

Die 4-px-Schiene in `--danger-bg` heißt in Takt bereits: *hier steht etwas, das nicht warten kann*.
Sie trägt die Startmeldung, sie trägt `.quitfail`, und `.toast--danger` trägt ihre 3-px-Schwester.
Die Kachel bekommt kein eigenes Zeichen, sie bekommt das Zeichen des Hauses.

**Und sie ist gemessen, ohne dass eine Zahl geraten wird:**

| Verhältnis | hell | dunkel |
|---|---:|---:|
| Schiene gegen die eigene Fläche (`--danger-bg` / `--danger-bg-subtle`) | **6,07** | **6,79** |
| Schiene gegen den Hintergrund (`--danger-bg` / `--bg-canvas`) | **6,34** | **7,84** |

Der erste Wert läuft **heute schon** im Lauf, unter der Notiz *„Randschiene der Startmeldung"*
(`contrast-check.mjs:510`, min 3). Der zweite kommt dazu. Beide Nahtstellen der Schiene sind damit
belegt: nach innen gegen die Kachel, nach außen gegen die Seite.

**Zur Zeile `padding-inline-start`.** Die Anwendung rechnet mit `box-sizing: border-box`
(`base.css:8-12`). Eine 4-px- statt 1-px-Kante schöbe den Inhalt der Kachel um 3 px nach innen.
Nebeneinander sieht das niemand — jede Kachel hat ihre eigene Startkante. **Untereinander sieht es
jeder:** Unter 14 rem Kachelbreite bricht `.stat-grid` in eine Spalte um
(`repeat(auto-fit, minmax(14rem, 1fr))`), und dann stünden vier Beschriftungen in einer Flucht und
eine 3 px daneben. Die Zeile hält die Inhaltsspalte still; die Schiene bleibt reine Zutat an der
Kante.

### 10.7.2 An welcher der vier Kacheln — und warum nur an dieser einen

An **„Überfällig"**. Die drei anderen bleiben unverändert, und das ist eine Entscheidung und kein
Auslassen:

| Kachel | Tönung | Zusage im Bestand | Was sie ohne Farbe trägt | Änderung |
|---|---|---|---|---|
| „Heute erfasst" | keine | keine | Beschriftung und Zahl | **keine** |
| „Noch nicht exportiert" | `warning` | keine | Beschriftung, Zahl, Knopf „Zur Export-Ansicht" | **keine** |
| „Offene Todos" | `accent` | keine | Beschriftung und Zahl | **keine** |
| „Überfällig" | `danger` | **ja**, `app.css:943-946` und `parts.tsx:185-190` | Beschriftung, Zahl, Knopf — und ab jetzt die Schiene | **Schiene** |

Der Grund ist der Maßstab aus Abschnitt 0: Eine Tönung ist eine **Verstärkung**, solange niemand
behauptet, sie trage. Bei den ersten drei behauptet es niemand — jede Kachel ist durch ihre
Beschriftung und ihre Zahl vollständig bestimmt, die Tönung ordnet nur ein. Bei „Überfällig" steht
eine Zusage, und zwar eine mit fachlichem Gewicht (A-19.4): Diese Kachel soll die **lauteste der
Reihe** sein. Eine Rangaussage braucht ein Merkmal, das die anderen nicht haben — und genau das ist
eine Schiene, die sonst keine Kachel trägt. **Bekämen alle vier eine Schiene, wäre die Rangaussage
wieder weg.** Das ist der Grund, aus dem hier nicht „das Bild in Graustufen aufgeräumt", sondern
eine einzelne Zusage eingelöst wird.

Dazu kommt das Merkmal, das schon da ist und in der berichtigten Zusage genannt gehört: **Die Kachel
erscheint überhaupt nur, wenn ihre Zahl größer als null ist** (`DashboardScreen.tsx:231`). Eine
Fläche, die nur bei einem Befund existiert, ist in jeder Darstellungsart auffällig — auch in
Graustufen, auch für den, der gar keine Farben sieht. Sie ist heute schon der stärkste Träger dieser
Kachel und steht in keinem der beiden Sätze.

### 10.7.3 Verworfene Merkmale, damit sie nicht als Fund zurückkommen

* **Symbol neben der Beschriftung.** `.stat__label` ist 11 px, Versalien, `--text-muted`. Ein
  Sinnbild daneben wäre 12 px groß, bräuchte eine neue Eigenschaft an `StatTile` (also einen
  Vertragspunkt nach E-076 Punkt 3) und einen zugänglichen Namen oder ein `aria-hidden`. Es kostet
  mehr als die Schiene und trägt nicht besser. **Nein.**
* **Fettung oder Vergrößerung von `.stat__value`** (Vorschlag aus T-210). Alle vier Zahlen sind
  bereits `--text-2xl` / `--weight-semibold`. Eine fünfte Stufe für eine von ihnen macht die **Zahl**
  lauter, nicht die **Kachel** — und die Zahl ist Datum, nicht Zustand. Wer 3 überfällige Todos hat,
  bekäme dann eine dickere 3. **Nein.**
* **Ein Muster in der Fläche** (Schraffur, Raster). Abschnitt 1.2 hat diesen Weg schon einmal zu
  Ende gerechnet: Über der Fläche steht Text, und SC 1.4.3 deckelt jedes Muster darunter. Auf einer
  Kachel mit drei Textebenen ist der Deckel noch enger als auf einer 22-px-Pille. **Nein.**
* **Die Kachel an eine andere Stelle der Reihe setzen** (Ordnung als Merkmal). Sie steht heute an
  vierter Stelle und erscheint nur manchmal; ihre Position ist damit ohnehin unstet. Eine Ordnung,
  die sich mit dem Bestand ändert, ist kein Merkmal. **Nein.**

### 10.7.4 Was mit der Zusage im Quelltext geschieht: **berichtigt, nicht zurückgenommen**

Anders als bei der Schraffur in Abschnitt 1 gibt es hier etwas, das trägt — es ist nur nicht das,
was dasteht. Deshalb der andere der beiden Wege. Der Satz bleibt eine Zusage, er wird wahr, und er
nennt die Stelle, an der die Zahl steht. **Wortlaut als Vorgabe** (Umlautschreibung wie in der Datei
üblich), an die Stelle von `app.css:943-946`:

```
/* Die Kachel "Ueberfaellig" (A-19.4). Lauteste Auspraegung dieser Reihe und
   bewusst die einzige in Rot.

   Ohne Farbe traegt die **Randschiene**: 4px an der Startkante, und keine
   andere Kachel dieser Reihe hat eine. Gemessen 6,07 hell / 6,79 dunkel
   gegen die eigene Flaeche und 6,34 / 7,84 gegen den Hintergrund
   (`contrast-check.mjs`, Gruppe "Anwendung"). Bauform zeichengleich mit
   `.shellnote--startup`. Dazu tragen die Beschriftung und der Umstand, dass
   die Kachel gar nicht erst erscheint, wenn ihre Zahl null ist
   (`DashboardScreen.tsx`).

   Flaeche und Rahmen sind **Verstaerkungen, keine Traeger**: die Flaeche
   liegt in Graustufen bei 1,01 bis 1,13 gegen jede Nachbarflaeche (T-210,
   an Pixeln gemessen), der Rahmen bei 1,66 / 1,79 (T-189). Der Satz, der
   hier bis T-213 stand, hat beides behauptet und traf auf keines von
   beidem zu. Ein besserer Flaechenwert loest es nicht: 3:1 gegen den
   Hintergrund verlangt L <= 0,279 statt heute 0,894 — das waere ein
   gefuelltes Meldeband und faerbte Startmeldung, Sperrdialog und
   Fehlerchips mit um (T-213 Abschnitt 10.7).

   Das `padding-inline-start` gleicht die 3px aus, die die breitere Kante
   dem Inhalt nimmt: nebeneinander sieht das niemand, untereinander — unter
   14rem bricht `.stat-grid` in eine Spalte — jeder. */
```

**Die zweite Stelle geht mit.** `screens/parts.tsx:185-190` sagt über `tone="danger"`: *„Sie
unterscheidet sich nicht nur durch Farbe: Rahmen **und** Fläche wechseln"*. Derselbe widerlegte Satz,
eine Datei weiter. Er wird auf die Schiene berichtigt. Wer nur `app.css` anfasst, lässt die falsche
Zusage an der Stelle stehen, an der ein Entwickler sie zuerst liest.

### 10.7.5 Zustände und Responsives der Kachel

* **Leer / null.** Die Kachel gibt es dann nicht. Unverändert, und ausdrücklich zu erhalten — siehe
  10.7.2.
* **Laden.** `AsyncBoundary rows={4}` zeichnet Skelettzeilen an der Stelle des ganzen Rasters. Die
  Kachel entsteht erst mit den Daten; die Schiene hat keinen Ladezustand.
* **Zeiger, Fokus, aktiv.** Die Kachel ist kein Bedienelement. Der Knopf darin
  (`variant="secondary"`) behält seinen Ring; er steht auf `--danger-bg-subtle`, und dort trägt
  `--focus-ring-color` mit 5,39 hell / 7,85 dunkel — siehe die Empfehlung in 10.12, Punkt 4.
* **Responsiv.** Keine neue Umbruchmarke. Bei einer Spalte (`< 14 rem` je Kachel) stehen die vier
  Kacheln untereinander an einer gemeinsamen Startkante — dort **wächst** die Wirkung der Schiene,
  weil die Kanten unmittelbar übereinander liegen. Genau dafür steht das `padding-inline-start` in
  der Vorgabe.
* **Hoher Kontrast.** `prefers-contrast: more` hebt `--border-subtle` und `--border-default` an,
  nicht `--danger-border`; die Schiene ist davon unberührt und bleibt das lauteste Merkmal.

---

## 10.8 Regel T-5 — eine Graustufenzusage **ist** eine Kontrastzusage

Beide Befunde dieses Nachtrags sind vom selben Bautyp wie T-189-5, T-189-6 und B-12: ein Satz im
Quelltext verspricht Erkennbarkeit ohne Farbe, und keine Zahl steht dahinter. Der Grund, aus dem das
immer wieder durchgeht, ist ein Missverständnis über den Lauf, und es gehört ausgeräumt:

> **Regel T-5.** Die WCAG-Formel rechnet nichts anderes als ein **Helligkeitsverhältnis**. Genau das
> zeigt ein Graustufenbild. Ein Kontrastpaar ist deshalb keine Annäherung an eine Graustufenzusage,
> es **ist** sie. Wer „bleibt in Graustufen unterscheidbar" schreibt und keine Zahl dazu hat, hat
> nichts gemessen — nicht ungefähr, sondern gar nicht.

T-210 hat das an dieser Kachel nachgerechnet: 1,111 aus den Token, 1,11 aus dem Bildschirmabzug der
graugeschalteten Fläche. Die zwei Wege ergeben dieselbe Zahl, und das ist der Beleg für die Regel.

**Die Umkehrung gilt nicht, und sie steht hier, damit T-5 nicht überdehnt wird:** Ein Paar über 3:1
sagt nichts über **Farbfehlsichtigkeit**. Blau gegen Rot bei 1,13 (10.1) ist der lebende Gegenbeweis
in die andere Richtung — für den Farbsehenden sichtbar, in Graustufen nicht. Für Deuteranopie bleibt
die Form das Mittel, und dafür gibt es keine Formel, sondern die Merkmalstabellen.

---

## 10.9 Der Wächter über Token findet keine Nachbarschaft — und der richtige Wächter ist ein anderer

Der Vollständigkeitswächter aus T-209 zählt **83 gezeichnete Farbtoken, 0 ohne Nachweis**, und er
findet B-12 nicht. Zu Recht: Beide beteiligten Token haben Paare, nur nicht **gegeneinander**. Die
Frage aus dem Auftrag lautet, ob das eine eigene Prüfung wert ist.

**Antwort: eine Prüfung über Nachbarschaften — nein. Eine Prüfung über Sätze — ja, und sie ist
billig.**

*Warum nicht über Nachbarschaften.* 83 Token ergeben 3403 ungeordnete Paare. Welche davon einander
**berühren**, steht nicht in `tokens.css` und nicht in den Stilblättern, sondern erst in der
aufgelösten Kaskade über dem gezeichneten Kastenbaum — also in einem Browser. Das ist genau die
Grenze, die im Kopf des Laufes schon steht (B-13, *tokengenau, nicht flächengenau*). Ein Wächter,
der alle 3403 verlangt, ist Lärm; einer, der eine von Hand gepflegte Liste der Nachbarschaften
verlangt, ist die Liste, die wir mit den Paaren ohnehin schon führen. Beides bringt nichts.

*Warum über Sätze.* Alle vier Funde dieser Bauart — T-189-5, T-189-6, B-12 und der Kommentar über
`.on-solid` — sind an **derselben Textsorte** gefunden worden: einem Kommentar, der eine
Erkennbarkeit ohne Farbe zusichert. Diese Textsorte liegt in versionierten Dateien, ist endlich und
ist greifbar. Ich habe sie gezählt: **47 Fundstellen in 17 Dateien** unter `apps/web/src/` — und
**null** in `packages/ui-tokens/tokens.css`. Das ist der Grund, aus dem ein Wächter über Token sie
strukturell nicht sehen kann: **Die Zusagen stehen nicht dort, wo die Farben stehen, sondern dort,
wo gezeichnet wird.**

**Vorschlag W-2 — „Zusage ohne Zahl".** Ein Lauf, der die Quellverzeichnisse **durchgeht** (nicht
`git grep`, E-087: an dieser Flächenart war er nachweislich blind) und für jede Fundstelle eines
festen Wortschatzes verlangt, dass im selben Kommentarblock entweder eine Verhältniszahl der Form
`n,nn` oder das Wort `contrast-check` steht.

* **Wortschatz, aus den vier Funden erhoben:** `Graustufen`, `SC 1.4.1`, `Farbfehlsichtig`,
  `ohne Farbe`, `ohne Farbwahrnehmung`, `nicht nur Farbe`, `nur die Farbe`, `allein an der Farbe`.
* **Verzeichnisse:** `apps/web/src/**`, `packages/ui-tokens/**`, `apps/outlook-addin/src/**`,
  `apps/web/design/DESIGNSYSTEM.md`.
* **Was er nicht kann, und das gehört in seinen Kopf:** Er prüft, ob eine Zahl **dasteht**, nicht ob
  sie **stimmt** und nicht ob sie die **richtige Fläche** meint. Das bleibt visual-qa. Er verwandelt
  eine unbelegte Zusage in eine belegte Behauptung — mehr verspricht er nicht, und mehr soll er
  nicht versprechen, sonst ist er selbst die nächste Zusage ohne Messung.
* **Erwarteter erster Lauf: rot.** Von den 47 Fundstellen tragen die wenigsten heute eine Zahl. Der
  Wächter ist deshalb **nicht** in derselben Welle einzuführen wie eine Behebung — dieselbe
  Begründung wie bei A-A-45 in 9.3 Punkt 3. Erst die Bestandsaufnahme, dann der Riegel.

**Die Mechanik gehört frontend-dev, die Entscheidung dem Orchestrator.** Ich halte W-2 für die
wirksamste einzelne Maßnahme, die aus diesen drei Wellen folgt, und für dringlicher als jede weitere
Farbfrage: Er findet die Klasse, statt den Einzelfall.

---

## 10.10 Was dieser Nachtrag an Abschnitt 9 berichtigt

**9.3 Punkt 2 fällt teilweise.** Dort steht, das Paar `--focus-ring-contrast` gegen
`--focus-ring-color` messe *„die einzige Nachbarschaft, die an dieser Stelle sicher gezeichnet
wird"*, und ein Paar gegen `--accent-bg` wäre *„gruen und wuerde eine Nachbarschaft messen, die es
nicht gibt"*. **Für die Bauform bis T-213 war beides richtig.** Nach dem Tausch gibt es die
Nachbarschaft, sie ist die wichtigste der drei, und das Paar gegen `--accent-bg` ist von einer
Scheinzusage zur Kernzusage geworden. Die Zahlen dafür standen seit T-189 auf dem Tisch (5,98 /
6,26) — sie waren nie falsch, nur am falschen Ort.

**9.7 B-11 ist geschlossen.** Gerechnet in T-204, gemessen in T-210, entschieden hier.

**Was stehen bleibt:** B-13 (tokengenau, nicht flächengenau) gilt unverändert und wird durch diesen
Fall belegt statt widerlegt — ein Lauf, der die Kaskade nicht auflöst, konnte nicht wissen, welches
Band welche Fläche berührt. Genau deshalb steht die Geometrie ab jetzt als Kommentar **im Lauf** und
nicht nur in diesem Papier.

---

## 10.11 Übergabe an frontend-dev

### 10.11.1 O-JA — der Fokusring

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/base.css:183-189` | `outline-color`-Zeile **entfällt**; der Schatten bekommt `var(--focus-ring-contrast)`. Kommentar nach 10.2, samt dem Satz, dass für die alte Anordnung im dunklen Thema **kein** Wert existiert |
| `packages/ui-tokens/tokens.css:263-264` | **nur der Kommentar**: `--focus-ring-color` „der Ring; liegt aussen und traegt gegen die Flaeche", `--focus-ring-contrast` „Gegenband; liegt innen an der Fuellung eines gefuellten Bedienelements". Die Zeile *„aeusserer Ring auf dunklen Flaechen"* war nach dem Tausch doppelt falsch |
| `apps/web/scripts/contrast-check.mjs:568-588` | Kommentarblock ersetzen (die alte Geometriebeschreibung ist danach unwahr), zwei Paare und eine Ausnahme dazu — siehe unten. Das Paar aus T-209 **bleibt zeichengleich**, nur seine Notiz nennt jetzt die mittlere Naht |
| `apps/web/scripts/contrast-check.mjs:30-36` | Die Grenze bleibt; das Beispiel *„T-204 9.3 an `--focus-ring-contrast`"* bekommt den Zusatz „seit T-213 behoben — die Grenze bleibt, der Fall ist keiner mehr" |
| `apps/web/design/DESIGNSYSTEM.md:561` | „auf gefüllten Flächen kommt über die Klasse `on-solid` ein heller Gegenring dazu" → wo das Band liegt (innen, an der Füllung) und die vier Zahlen |

```js
/*
 * Der Doppelring an gefuellten Bedienelementen, nach dem Tausch der beiden
 * Baender (T-213 Abschnitt 10.2; Messung T-210 B-11).
 *
 * `.on-solid:focus-visible` zeichnet von der Kante des Knopfes nach aussen:
 *   0..2px  `--focus-ring-contrast`  (Schatten, beruehrt die **Fuellung**)
 *   2..4px  `--focus-ring-color`     (Kontur aus `:focus-visible`, beruehrt
 *                                     die **Flaeche**)
 * Drei Nahtstellen, drei Zusagen, alle drei gemessen:
 *   1. Gegenband gegen die Fuellung  -> die zwei Paare hier
 *   2. Gegenband gegen die Kontur    -> das Paar aus T-209, unveraendert
 *   3. Kontur gegen die Flaeche      -> Gruppe "Struktur", seit T-022
 *
 * Bis T-213 lagen die Baender andersherum. Dann beruehrte das Gegenband die
 * Fuellung gar nicht, und im hellen Thema fielen **beide** Baender mit ihrem
 * Nachbarn zusammen: 1,00:1 an beiden Kanten, sichtbar blieb ein Knopf, der
 * beim Tabulieren um 2px waechst (SC 2.4.7, SC 1.4.11).
 *
 * Nicht zurueckdrehen. Fuer die alte Anordnung gibt es im **dunklen** Thema
 * keinen gueltigen Wert: Ein Innenband muesste dort L <= 0,065 haben, um
 * gegen die Fuellungen zu tragen, und L >= 0,133, um als allgemeiner Ring
 * gegen die Flaechen zu tragen. Der Schnitt ist leer (T-213 Abschnitt 10.3).
 */
{ group: "Anwendung", fg: "--focus-ring-contrast", bg: "--accent-bg", min: 3, note: "Gegenband gegen die Fuellung des Primaerknopfes, SC 1.4.11 und SC 2.4.7" },
{ group: "Anwendung", fg: "--focus-ring-contrast", bg: "--danger-bg", min: 3, note: "Gegenband gegen die Fuellung des Gefahrenknopfes, SC 1.4.11 und SC 2.4.7" },
// Der weich gesperrte Knopf (`[aria-disabled="true"]`) behaelt `.on-solid`,
// verliert aber seine Fuellung an `--bg-disabled`. Dort traegt das Gegenband
// nicht — und muss es nicht: Getragen wird der Ring an dieser Stelle von der
// aeusseren Kontur, die gegen dieselbe Flaeche mit min 3 gemessen ist
// (Gruppe "Struktur"). Ein Band, das auf beiden Seiten haelt, genuegt.
{ group: "Anwendung", fg: "--focus-ring-contrast", bg: "--bg-disabled", min: 0, exempt: true, note: "Gegenband auf dem weich gesperrten Knopf — 1,12 hell, 1,21 dunkel; dort traegt die aeussere Kontur" },
```

### 10.11.2 O-JC — die Kachel

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/app.css:943-950` | Regel nach 10.7.1, Kommentar nach 10.7.4 |
| `apps/web/src/screens/parts.tsx:185-190` | derselbe berichtigte Satz, kürzer: die Schiene trägt, Fläche und Rahmen verstärken, die Zahlen stehen im Lauf |
| `apps/web/scripts/contrast-check.mjs` | zwei Paare und eine Ausnahme — siehe unten |
| `apps/web/design/DESIGNSYSTEM.md` | falls die Kachelreihe dort abgebildet ist, dieselbe Berichtigung; sonst nichts |

```js
// Die Kachel "Ueberfaellig" auf dem Dashboard (A-19.4). Ohne Farbe traegt die
// Randschiene: 4px `--danger-bg` an der Startkante, und keine andere Kachel
// der Reihe hat eine. Zwei Nahtstellen, beide hier — nach innen gegen die
// eigene Flaeche, nach aussen gegen den Hintergrund, auf dem die Kacheln
// stehen. Bauform zeichengleich mit `.shellnote--startup`, deren Schiene
// dieselbe erste Zahl schon in der Gruppe "Startmeldung" traegt.
{ group: "Anwendung", fg: "--danger-bg", bg: "--danger-bg-subtle", min: 3, note: "Randschiene der Kachel Ueberfaellig gegen ihre eigene Flaeche, SC 1.4.11" },
{ group: "Anwendung", fg: "--danger-bg", bg: "--bg-canvas", min: 3, note: "dieselbe Schiene gegen den Hintergrund, auf dem die Kacheln stehen" },
// Die Flaeche der Kachel ist eine Verstaerkung und kein Traeger. T-210 hat sie
// in Graustufen an Pixeln gemessen: 1,01 bis 1,13 gegen jede Nachbarflaeche,
// in beiden Themen. Ein besserer Wert loest es nicht (T-213 Abschnitt 10.7).
// Ihre **Obergrenze** braucht kein eigenes Paar: Sie steht in den drei
// Textpaaren auf `--danger-bg-subtle` (Gruppen "Startmeldung" und
// "Anwendung") — wer die Flaeche dunkler macht, faellt dort durch.
{ group: "Anwendung", fg: "--danger-bg-subtle", bg: "--bg-canvas", min: 0, exempt: true, note: "Flaeche der Kachel Ueberfaellig gegen den Hintergrund — 1,04 hell, 1,15 dunkel; Verstaerkung, getragen wird von der Randschiene" },
```

> **Berichtigt in T-216, und der Fehler war meiner.** Hier stand als dunkler Wert **1,11**. Das ist
> der Wert von `--danger-bg-subtle` gegen **`--bg-surface`** im **hellen** Thema — meine eigene
> Gegenprobe aus 9.3, beim Abschreiben in den dunklen Slot gerutscht. Gegen die Leinwand mißt der
> Lauf dunkel **1,15**; oben steht seit T-216 die gemessene Zahl, im Quelltext ebenso, mit dem
> Grund daneben, damit die 1,11 nicht als „Berichtigung" zurückkommt. Die Einordnung ändert sich
> nicht — beide Zahlen liegen weit unter 3, die Fläche bleibt Verstärkung. **Die Lehre ist die
> Bauart des Fehlers, nicht seine Größe:** Eine Zahl, die in einer Tabelle mit vier Feldern (zwei
> Themen, zwei Bezugsflächen) eine Zelle nach rechts rutscht, bleibt plausibel und wird von keiner
> Rechnung gefangen. Wer eine Zahl in einen Kommentar schreibt, schreibt **Thema und Bezugsfläche
> daneben** — dann ist der Rutsch lesbar statt unsichtbar.

### 10.11.3 Zum Feld `over` — es bleibt bei allen sechs Zeilen draußen

`over` ist seit T-197 Pflicht, **wenn `bg` teildurchsichtig ist**. Keiner der hier genannten
Hintergründe ist es: `--accent-bg`, `--danger-bg`, `--bg-disabled`, `--danger-bg-subtle`,
`--bg-canvas` und `--focus-ring-color` sind sämtlich deckende Hexwerte in beiden Themen. **Kein
`over` an keiner der sechs Zeilen** — und dieser Satz steht hier, damit es niemand „aus Konsistenz"
nachträgt. Geflächt wird über nichts, weil nichts durchscheint.

Der einzige teildurchsichtige Token im Umfeld ist `--status-reopened-hatch`, und der hat sein `over`
seit T-202.

### 10.11.4 Empfohlen, nicht bindend: der Fokusring auf den vier getönten Flächen

Beim Rechnen zu 10.4 ist eine Lücke derselben Bauart aufgefallen wie B-7: Der Ring hat Paare gegen
die drei neutralen Flächen und gegen die Zebrazeile — **gegen keine der vier getönten Flächen, auf
denen nachweislich fokussierbare Bedienelemente stehen** (Startmeldung, Warnbänder, Versionsleiste,
Erfolgsbänder; für `--danger-bg-subtle` misst der Lauf bereits den *Rahmen* eines Knopfes, also
steht dort einer). Alle acht Werte sind gerechnet und grün:

| Paar | hell | dunkel |
|---|---:|---:|
| `--focus-ring-color` / `--danger-bg-subtle` | 5,39 | 7,85 |
| `--focus-ring-color` / `--warning-bg` | 5,53 | 7,60 |
| `--focus-ring-color` / `--info-bg` | 5,43 | 7,02 |
| `--focus-ring-color` / `--success-bg` | 5,43 | 7,41 |

Vier Zeilen, min 3, Gruppe „Struktur". Kein Befund, eine Vervollständigung — mitzunehmen, wenn die
Datei ohnehin offen ist.

### 10.11.5 Reihenfolge

10.11.1 und 10.11.2 sind voneinander unabhängig und können in einer Welle laufen; sie berühren
gemeinsam nur `contrast-check.mjs`, also **ein Agent für beide Teile**, sonst stehen zwei
Kommentarblöcke gegeneinander. Nach dem Bau: **visual-qa fährt dieselben zwei Fixturen erneut**
(`/tmp/t210-qa/measure-*.mjs`, in Minuten wiederholbar). Das Ziel ist benannt und prüfbar:

* **B-11 behoben heißt:** an allen vier Kombinationen (primär/gefahr × hell/dunkel) zeigt die
  Pixelreihe vom Knopfrand nach außen **drei** Zonen mit **zwei** deutlichen Übergängen, nicht einen.
* **B-12 behoben heißt:** im Graustufenbild `b12-02` ist die Kachel „Überfällig" die einzige mit
  einer sichtbaren Startkante, und deren Verhältnis gegen beide Nachbarn liegt über 3.

---

## 10.12 Vertrag (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Token |
|---|---|---|---|---|
| 10.2 Tausch der beiden Bänder | — | — | `.on-solid` bleibt, Bedeutung unverändert | **kein Wert geändert**, zwei Kommentare berichtigt |
| 10.7.1 Randschiene der Kachel | — | — | `.stat--danger` bleibt | — |
| 10.11 Paare und Ausnahmen | — | — | — | — |

**Kein Eintrag ändert eine Rolle, einen zugänglichen Namen, einen Klassennamen oder einen Farbwert.**
Das ist der ungewöhnliche Fall, in dem zwei hoch eingestufte Barrierefreiheitsbefunde ohne einen
einzigen neuen Wert und ohne einen einzigen Vertragspunkt fallen. Er ist nur deshalb möglich, weil
in beiden Fällen die **Anordnung** der Fehler war und nicht die Farbe.

**Eine Namensbeobachtung, ausdrücklich ohne Folge:** `.on-solid` heißt „auf gefülltem Grund",
gemeint ist „ist selbst gefüllt". Nach dem Tausch stimmt die zweite Lesart wieder mit der Zeichnung
überein. **Nicht umbenennen** — der Klassenname ist Vertrag, und der Kommentar darüber sagt es
künftig deutlich.

---

## 10.13 Befunde und offene Fragen

**B-14 — `:focus-visible` setzt `border-radius: var(--radius-sm)` am Element selbst**
(`base.css:177-181`). Für `.btn` ist das folgenlos, weil `components.css` später einen eigenen
Radius setzt. Für ein fokussierbares Element **ohne** eigenen Radius ändert der Fokus die Form des
Elements und nicht nur die des Rings. **Aus der Kaskade gelesen, nicht gemessen** (E-087), und
**nicht** Teil dieser Behebung — hier notiert, weil ich die Regel unmittelbar daneben ändere und der
nächste Leser sonst denkt, ich hätte es übersehen. Niedrig.

**B-15 — Verdacht, ungemessen: beschnittene Fokusringe.** Der Ring liegt 4 px außerhalb des
Randkastens. Ein Vorfahr mit `overflow: hidden` schneidet ihn ab — und `.app` trägt seit T-057 genau
das (`app.css:94-98`), ebenso `.note` (`components.css:1337-1342`, siehe B-6). Betroffen wäre ein
Bedienelement unmittelbar an der Kante eines beschneidenden Kastens. **Ich kann es nicht messen**,
hier läuft kein Browser; es ist eine Frage für dieselbe Fixtur, mit der T-210 B-11 gemessen hat, und
kein Auftrag aus dieser Aufgabe. Mittel, falls er zutrifft — es wäre SC 2.4.11.

**B-16 — die Zusage in `parts.tsx` war die zweite Kopie, und niemand hat sie gesucht.** Der Satz
über „Rahmen **und** Fläche" steht in `app.css` **und** in `screens/parts.tsx`. T-210 hat nur die
erste Stelle gemessen, weil nur sie im Auftrag stand. Das ist keine Nachlässigkeit, sondern die
Bauart des Befunds: Ein Auftrag nennt eine Zeile, eine Zusage steht an zwei. **W-2 aus 10.9 findet
beide** — das ist das beste Argument für ihn, das ich habe.

**F-8 — offen an den Orchestrator: soll W-2 gebaut werden, und wann?** Meine Empfehlung: ja, als
eigener Auftrag an frontend-dev, und **nicht** in derselben Welle wie diese Behebung. Erster Lauf
wird rot; ein roter Lauf neben einer Behebung wird als kaputter Wächter gelesen.

**F-9 — offen an visual-qa, klein:** Die Nachmessung nach 10.11.5 sollte den **Gefahrenknopf im
hellen Thema** mitnehmen, obwohl er in T-210 als „unbetroffen" geführt ist. Nach 10.1 trägt sein
Ring heute allein den Farbton (1,13 in Graustufen); nach dem Tausch trägt er 6,75. Das ist ein
messbarer Unterschied, und er belegt, dass die Behebung mehr repariert hat als den einen gemeldeten
Fall.

---

# 11. Nachtrag T-218 (Welle AG) — der Knopf, der sich beim Gelingen selbst wegwirft

**Vorlage:** Board O-IH, Fund von ux-designer in T-203, bestätigt und verschärft von
spec-ux-reviewer in T-200; O-CY-2 als Vorgeschichte derselben Klasse; E-076 Punkt 3, E-078 Nachtrag
Punkt 8, E-087; Abschnitt 4.1 und Regel U-1 bis U-4 aus `docs/design/textabbau-gestalt.md`
(eigene Feder, dort fortgeschrieben als Regel U-5); WCAG 2.2 SC 2.4.3, SC 2.4.6, SC 2.4.7,
SC 2.5.3 und SC 2.5.8. Gelesen: `apps/web/src/components/ExportGroups.tsx`,
`components/DialogSurface.tsx`, `components/Menu.tsx`, `components/Primitives.tsx`,
`components/Timer.tsx`, `screens/ExportScreen.tsx`, `screens/BookingDialogs.tsx`,
`screens/TemplatePreview.tsx`, `screens/BookingsScreen.tsx`, `screens/parts.tsx`,
`app/useAsync.ts`, `app/RefreshContext.tsx`, `styles/components.css`, `styles/base.css`,
`tests/e2e/focus-return-after-dialog.spec.ts`.

**Was hier entschieden wird.** Genau eine Frage: an der Stelle, an der heute zwei Bausteine
abwechselnd stehen, steht künftig **einer**. Dazu die zwei Punkte, die sonst der Bauende entscheiden
müsste — was in der Wartezeit an der Stelle steht, und wohin der Fokus gehört, wenn ein
Rückkehrziel wirklich fällt.

**Herkunft der Aussagen (E-087).** Alles unten ist **aus dem Quelltext gelesen**, nicht im Browser
gemessen: Hier läuft kein Browser. Wo ich eine Reihenfolge behaupte, nenne ich die Zeile, aus der
sie folgt. Der eine Punkt, der eine echte Messung braucht — die Breite der Spalte nach der
Änderung —, steht als Auftrag an visual-qa in 11.7 und hat einen vorab entschiedenen Rückfall,
damit er die Kernentscheidung nicht wieder aufmacht.

---

## 11.1 Der Befund ist schärfer, als er auf dem Board steht — der Fokus kommt an und wird danach weggenommen

`ExportGroups.tsx:303-319`, am Ende jeder Buchungszeile einer Tagesgruppe:

```tsx
{onEditEntry === undefined ? null : entry.note === "" ? (
  <Button variant="secondary" size="sm" iconStart="pencil" onClick={…}>Leistung nachtragen</Button>
) : (
  <IconButton label={`Leistung der Buchung ${entry.period} bearbeiten`} icon="pencil" size="sm" onClick={…} />
)}
```

Zwei **verschiedene Bausteine** an einer Stelle, umgeschaltet von `entry.note === ""` — also von
genau dem Wert, den der Dialog einträgt, den dieser Knopf öffnet. React setzt an einer Stelle mit
wechselndem Elementtyp keine Eigenschaften um, sondern hängt aus und baut neu auf. **Der Knoten, der
den Dialog geöffnet hat, existiert nach dem Gelingen nicht mehr.**

**Der genaue Ablauf, und er ist der Grund, aus dem der Fehler so lange stand.** In
`BookingDialogs.tsx:161-165` steht die Reihenfolge:

| # | Zeile | Was geschieht |
|---|---|---|
| 1 | `await updateTimeEntry(…)` | der Dienst antwortet |
| 2 | `toasts.success("Buchung geändert.", …)` | die Meldung steht |
| 3 | `bump()` | `version` steigt; `useAsync` startet **eine neue Anfrage** (`ExportScreen.tsx:289`) |
| 4 | `onClose()` | `editEntry` wird `null`, der Dialog geht |

Schritt 3 ist ein Netzweg und kann in der Übergabe von Schritt 4 nicht schon zurück sein. In dem
Bild, in dem der Dialog verschwindet, trägt die Zeile also noch die **alte** Leistung, der alte
Knopf steht noch, und `finalFocusEl` (`DialogSurface.tsx:339-342`) findet ihn: `isConnected` ist
wahr, der Fokus **kommt an**. Erst wenn die Antwort der Auffrischung eintrifft — einen Wimpernschlag
später —, wechselt `entry.note` von leer auf gefüllt, React tauscht `Button` gegen `IconButton`, und
der Browser nimmt dem entfernten Knoten den Fokus. Er fällt auf `<body>`.

**Daraus folgen zwei Dinge, die beide in die Übergabe gehören:**

1. **Eine Prüfung, die unmittelbar nach dem Schließen hinsieht, besteht.** Das ist genau der Fall,
   den `tests/e2e/focus-return-after-dialog.spec.ts:32-37` schon einmal beschrieben hat („nicht nur
   unmittelbar danach, sondern auch einige hundert Millisekunden später"). Die Reihe kann den Fall,
   sie deckt diese Fläche nur nicht ab. Siehe 11.9.
2. **Die Rückholung in `DialogSurface` kann hier nichts ausrichten**, und das ist kein Mangel:
   `recoverFocus` (`:280-297`) prüft den Fokus bei jeder Änderung **im Kasten** — und in diesem
   Augenblick gibt es keinen Kasten mehr. Was hier fällt, fällt außerhalb des Dialogs und nach
   seinem Ende. spec-ux-reviewer hat richtig gesehen: es ist ein **abgehängtes Rückkehrziel**, kein
   Fehler der Fokusfalle.

**Warum es dieselbe Klasse wie O-CY-2 ist.** Dort war der gemerkte Knoten der Menükasten, der mit
dem Menü verschwand („ein Fokus auf einen verschwundenen Knoten ist gar keiner", `Menu.tsx:188-190`).
Hier verschwindet der Auslöser durch die Wirkung seiner eigenen Handlung. Zweimal dieselbe Ursache:
**das Ziel der Rückkehr überlebt den Weg dorthin nicht.**

---

## 11.2 Entscheidung: **ein Baustein, zwei Beschriftungen**

Beide Wege sind baubar. Es wird der erste, aus drei Gründen, in dieser Rangfolge:

1. **Das Haus hat die Frage für dieselbe Aufgabe schon einmal beantwortet.**
   `TemplatePreview.tsx:590-597` zeichnet für dieselbe Handlung an derselben Art Zeile **einen**
   `Button` mit `iconStart="pencil"`, dessen Beschriftung an derselben Bedingung hängt
   (`entry.note.trim().length === 0 ? "Leistung nachtragen" : "Bearbeiten"`). Zwei Bauformen für
   eine Aufgabe sind der eigentliche Befund; die Entscheidung besteht darin, die vorhandene zu
   bestätigen und nicht eine dritte zu erfinden.
2. **Nur in dieser Form ist das Rückkehrziel eine Eigenschaft des Knotens und keine Zusage über
   ihn.** Zwei Bausteine verlangen zusätzlich einen Knoten, der beide überlebt — und damit eine
   Bedingung, die niemand sieht: dieser Wirt darf nie bedingt sein, nie einen wechselnden `key`
   bekommen, nie mit der Zeile verschwinden. Eine Zusage, die nur in einem Kommentar steht, ist der
   Fehler, den E-087 benennt. Nach dieser Entscheidung ist **nichts zuzusichern**: Der Knoten
   überlebt, weil es derselbe ist.
3. **Es ist Regel U-1 aus T-171, eine Stufe allgemeiner.** „B1 vor B2 vor B3" — ein festes Fach,
   nur sein Inhalt wechselt. Die Regel war für Text geschrieben; ein Bedienelement ist auch ein
   Fach. Die Fortschreibung steht in `docs/design/textabbau-gestalt.md` Abschnitt 10 als **Regel
   U-5** und gilt ab dort für jede Fläche, nicht nur für diese.

**Und die Bauart ist im Bestand belegt, an dem Knopf, der seinen Zustand am häufigsten wechselt:**
`Timer.tsx:124-131` behält einen Knoten und wechselt an ihm `icon` (`play` gegen `square`) **und**
`variant` (`secondary` gegen `danger`) mit dem laufenden Zustand. Eigenschaften wechseln, der
Knoten bleibt. Das ist die Form, die hier fehlt — nicht eine, die erst erfunden werden müsste.

**Was das für den zweiten Weg heißt.** Ich lasse ihn nicht offen: Zwei Bausteine mit einem stabilen
Rückkehrziel wären das `<li className="eentry">` der Zeile gewesen, als `tabindex="-1"` mit
zugänglichem Namen. Das ist gebaut worden — und es ist die schlechtere Lösung, weil der Fokus dann
nach dem Gelingen **nicht auf dem Knopf** landet, sondern auf einer Zeile, und der Benutzer den Weg
zum nächsten Bedienelement erneut suchen muss. Ein Rückkehrziel soll dorthin führen, wo man war,
nicht in dessen Nähe.

---

## 11.3 Was sich außer der Beschriftung ändert — vollständig, Zeile für Zeile

| Merkmal | Leistung fehlt | Leistung ist da | Ändert es den Knoten? |
|---|---|---|---|
| Baustein | `Button` | `Button` | — |
| Sinnbild | `pencil` | `pencil` | nein, **unverändert in beiden** |
| Größe | `sm` | `sm` | nein |
| Ausprägung | `secondary` | `ghost` | **nein** — nur die Klassenliste |
| sichtbare Beschriftung | „Leistung nachtragen" | „Leistung bearbeiten" | nein — Textinhalt |
| verborgener Zusatz im Namen | `, Buchung 09:00–10:20` | derselbe | nein |

**Zum Sinnbild: dasselbe in beiden, und ausdrücklich nicht `plus`.** Die Buchung besteht bereits;
leer ist nur ihr Text. Ein Feld mit leerem Inhalt zu füllen ist Bearbeiten. T-171 Abschnitt 5.1
beschränkt `plus` außerdem auf „den Behälter, der den Gegenstand nennt" — eine Zeile ist kein
Behälter. Beide Zweige zeichnen heute schon `pencil`; hier ändert sich nichts, und der Satz steht
nur da, damit es nicht später „vereinheitlicht" wird.

**Zur Ausprägung: sie wechselt, und das kostet keine Bewegung im Bild.** `.btn` gibt **jeder**
Ausprägung `border: 1px solid transparent` und dieselbe Polsterung (`components.css:21-46`);
`secondary` und `ghost` unterscheiden sich allein in `background-color`, `border-color` und `color`
(`:71-93`). Der Kasten ist in beiden Zuständen zeichengleich groß — der Wechsel verschiebt nichts,
er färbt um.

Warum er trotzdem sein soll:

* Die fehlende Leistung ist **der eine Grund, aus dem eine Tagesgruppe nicht exportiert wird**
  (E-034; die Kopfzeile sagt es bereits: „Gruppen bleiben stehen — ohne Leistung kein Export",
  `ExportScreen.tsx:901-907`). Ein Mangel auf dem Pflichtweg trägt das festere Zeichen.
* Es ist die Ausprägung, die das Haus für **genau diesen Satz** schon zweimal gewählt hat:
  `ExportScreen.tsx:1236-1243` (`SkippedRow`) und `ExportGroups.tsx:304-311` — beide
  `variant="secondary"`, `iconStart="pencil"`, „Leistung nachtragen".
* Und er ist die Rückmeldung selbst: Der Knopf, auf den der Fokusring zurückkehrt, ist im selben
  Augenblick **leiser** geworden. Das sagt „erledigt", ohne dass etwas blinkt. Eine
  Zustandsänderung, die man ohnehin zeichnet, ist die billigste Rückmeldung, die es gibt.

**Zur Größe und zur Klickfläche.** `.btn--sm` hat `min-height: var(--control-height-sm)` — dieselbe
Höhe, aus der `.icon-btn--sm` seine 28×28 bezieht (`components.css:165-185`). Der beschriftete
Knopf ist ebenso hoch und breiter; SC 2.5.8 ist danach **besser** erfüllt als vorher, nicht
schlechter.

---

## 11.4 Der zugängliche Name — beide Zweige tragen den Zeilenbezug, und **kein** `aria-label`

Die Verschärfung von spec-ux-reviewer ist berechtigt und hat eine Falle, die genannt werden muss.

**Heute:** Der Symbolzweig trägt „Leistung der Buchung 09:00–10:20 bearbeiten", der beschriftete
Zweig trägt nur „Leistung nachtragen" — in einer Liste von acht Buchungen achtmal derselbe Name.
Das ist die Lücke aus SC 2.4.6.

**Die Falle:** Sie lässt sich **nicht** dadurch schließen, dass man dem beschrifteten Knopf ein
`aria-label` mit dem Zeilenbezug gibt. Sobald ein Bedienelement sichtbaren Text trägt, verlangt
SC 2.5.3 (*Label in Name*, Stufe A), dass dieser Text im zugänglichen Namen **enthalten** ist.
„Leistung der Buchung 09:00–10:20 bearbeiten" enthält „Leistung bearbeiten" nicht am Stück. Wer die
alte Namensform behält und den Knopf beschriftet, tauscht einen AA-Befund gegen einen A-Befund.

**Vorgabe.** Der Zeilenbezug kommt als **verborgener Zusatz im Knopf**, nicht als Ersatzname:

```tsx
<Button
  variant={entry.note === "" ? "secondary" : "ghost"}
  size="sm"
  iconStart="pencil"
  onClick={() => onEditEntry(group.id, entry.id)}
>
  {entry.note === "" ? "Leistung nachtragen" : "Leistung bearbeiten"}
  <span className="visually-hidden">, Buchung {entry.period}</span>
</Button>
```

| | sichtbar | zugänglicher Name |
|---|---|---|
| Leistung fehlt | Leistung nachtragen | **Leistung nachtragen, Buchung 09:00–10:20** |
| Leistung ist da | Leistung bearbeiten | **Leistung bearbeiten, Buchung 09:00–10:20** |

* **SC 2.5.3** hält: Der sichtbare Text steht am Anfang des Namens, am Stück.
* **SC 2.4.6** hält in **beiden** Zweigen: Der Name unterscheidet die Zeile.
* **SC 2.4.3 / 2.4.7**: Der Name wechselt beim Gelingen von „nachtragen" auf „bearbeiten" — an
  demselben Knoten, auf dem der Fokusring steht. Wer hört, hört, was geschehen ist; wer sieht,
  sieht es. Dasselbe Ereignis, zwei Kanäle, eine Quelle.
* **Kein Layoutpreis**: `.visually-hidden` ist `position: absolute` mit 1 px Kantenlänge
  (`base.css:260-264`) und damit aus dem Fluss — der Knopf wird davon nicht breiter.
* **Kein Verstoß gegen E-078 Nachtrag Punkt 8** („Sicht und Gehör bekommen dieselbe Menge"). Der
  Zusatz ist keine zusätzliche **Auskunft**, sondern der Zeilenbezug, den das Auge aus der
  Nachbarschaft nimmt und das Ohr nicht: Die Uhrzeit steht 40 px weiter links sichtbar in derselben
  Zeile (`ExportGroups.tsx:280`). Er stellt die Gleichheit her, er bricht sie nicht. Dieselbe
  Bauart trägt der Kontrollkasten der Zeile bereits („In der Tagesgruppe berücksichtigen: ", `:279`).
* **Kein `title`.** Der Knopf hat sichtbaren Text; ein Zeigertext daneben wäre die Verdopplung, die
  E-078 Punkt 5 meint.

**Der Wortlaut gehört ux-designer, die Form gehört hierher.** Meine Bedingungen an jeden Wortlaut,
den er statt dessen setzt: (a) beide Fassungen beginnen mit demselben Wort, damit der Knopf als
derselbe Gegenstand gelesen wird; (b) beide sind gleich lang — „nachtragen" und „bearbeiten" haben
dieselbe Buchstabenzahl, die Spalte bewegt sich beim Wechsel also nicht; (c) der Zusatz beginnt mit
Komma und nennt die Buchung, nicht die Handlung. Bleibt ux-designer stumm, gelten die zwei Fassungen
oben.

---

## 11.5 Der Zustand dazwischen — **der alte Knopf, unverändert und bedienbar**

Zwischen dem Klick auf „Speichern" und der Antwort des Dienstes steht an dieser Stelle: **derselbe
Knopf, mit derselben Beschriftung, in derselben Ausprägung, nicht gesperrt.** Kein Wartezustand,
kein Skelett, kein Platzhalter, kein `loading`.

Drei Gründe, und der zweite ist der harte:

1. **Die Zeile zeigt den gespeicherten Wert.** Solange der Dienst nicht geantwortet hat, ist der
   gespeicherte Wert der alte. Ein Knopf, der das Ergebnis vorwegnimmt, behauptet etwas, das noch
   nicht wahr ist — und bei einem Fehlschlag müsste er es zurücknehmen.
2. **Ein gesperrter Knoten ist kein Fokusziel.** `Button` setzt bei `loading` das echte
   `disabled` (`Primitives.tsx:73`). `element.focus()` auf einem gesperrten Element tut nichts —
   der Fokus fiele auf `<body>`, **genau wie bei einem entfernten Knoten**, nur eine Sekunde früher
   und ohne dass irgendetwas ausgetauscht worden wäre. Daraus die allgemeine Regel R-1 unten:
   *ein Rückkehrziel wird nicht gesperrt, solange der Dialog steht, der zu ihm zurückkehren soll.*
3. **Die Arbeit wird an genau einem Ort gezeigt, und es ist der Ort des Fokus.** Der Dialog trägt
   sie an seinem eigenen Absendeknopf (`busy={mutation.busy}`, `BookingDialogs.tsx:179`). Der
   Benutzer sieht dorthin, sein Fokus ist dort, und dort steht die Antwort auf „passiert gerade
   etwas". Ein zweiter Wartezustand in der Zeile dahinter wäre eine Auskunft an eine Stelle, die
   niemand ansieht — und, siehe 2., eine, die den Rückweg zerstört.

**Und die Voraussetzung, an der das alles hängt und die heute stimmt, ohne dass es jemand
aufgeschrieben hat:** `ExportScreen.tsx:289` liest

```ts
const data = useAsync(async () => { … }, [], [version]);
```

`version` steht in `refreshDeps`, nicht in `deps`. Nach `bump()` bleibt der Inhalt deshalb stehen
und `refreshing` wird wahr (`app/useAsync.ts:35-36`) — die Liste wird **nicht** gegen einen
`LoadingBlock` getauscht. Stünde `version` in `deps`, verschwände beim Auffrischen die ganze Liste,
und mit ihr jedes Rückkehrziel darin — nicht nur dieses eine, sondern jedes auf dem Bildschirm.

> **Regel R-0.** Eine Fläche, aus der heraus Dialoge geöffnet werden, wird beim Auffrischen
> **nicht ausgetauscht**. Auffrischen heißt `refreshDeps` und `refreshing`, nicht `deps` und
> Skelett. Ein Skelett ist der richtige Zustand beim **ersten** Laden und der falsche nach jeder
> Handlung.

**Und die Zeile selbst überlebt**, weil `key={entry.id}` an der Kennung hängt
(`ExportGroups.tsx:270`) und nicht am Rang und nicht am Inhalt. Das bleibt so; ein `key`, der die
Leistung enthielte, brächte den Fehler auf einer Ebene höher zurück.

---

## 11.6 Wohin der Fokus gehört, wenn das Ziel wirklich fällt — sechs Regeln, nicht ein Knopf

Nach 11.2 fällt **dieses** Ziel nie: die Buchung bleibt, die Zeile bleibt, der Knoten bleibt. Die
Frage ist trotzdem zu beantworten, weil es Flächen gibt, an denen das Ziel zu Recht verschwindet —
der Kopfkommentar von `DialogSurface` nennt selbst „die Zeile, deren Todo gerade gelöscht wurde"
(`:182-184`).

**Regel R-1 — wann ein Rückkehrziel gültig ist.** Ein Ziel taugt nur, wenn es zum Zeitpunkt der
Rückkehr **alle drei** Bedingungen erfüllt: es hängt im Dokument (`isConnected`), es ist nicht
gesperrt (`disabled`, `inert`), und es ist nicht verborgen (`hidden`, `display: none`). Heute prüft
`finalFocusEl` allein die erste (`DialogSurface.tsx:341`). Die beiden anderen enden im selben
stillen Fall auf `<body>` — ein Ziel, das noch da ist, aber niemanden aufnimmt, ist kein Ziel.

**Regel R-2 — die Ersatzkette, erster Treffer gewinnt.** Fällt das Ziel nach R-1, wird der Fokus
**nicht dem Browser überlassen**:

| # | Ersatz | Warum in dieser Reihenfolge |
|---|---|---|
| 1 | **Der Nachfolger an derselben Stelle** — dasselbe Bedienelement der Zeile, die an die Stelle der entfernten getreten ist; war es die letzte, die davor | Der Benutzer arbeitet eine Liste ab. Die nachrückende Zeile ist der Ort, an dem er weitermacht |
| 2 | **Der Behälter**, aus dem die Zeile verschwand — Liste oder Gruppe, als `tabindex="-1"` | Die Handlung hat den Behälter verändert; er ist die kleinste Fläche, die sie noch beschreibt |
| 3 | **Die Überschrift des Bereichs**, ebenso `tabindex="-1"` | letzte Stufe innerhalb der Sache |
| 4 | **`.screen__title`**, der `<h1>` der Ansicht (`parts.tsx:50-64`), `tabindex="-1"` | die Untergrenze. Von hier ist jeder Weg wieder erreichbar |

Was **nie** gilt: `<body>`. `<body>` ist kein Ziel, sondern die Meldung, dass keines gewählt wurde.

**Regel R-3 — ein Ersatz ohne Namen wird übersprungen.** Eine Stufe der Kette gilt nur, wenn der
Knoten einen zugänglichen Namen trägt. Ein Sprung auf einen namenlosen Kasten ist für den, der
hört, ununterscheidbar von dem Fall auf `<body>`, den die Kette gerade vermeiden soll. Kein neues
Sprachgebiet dafür: Jede Stelle, an der ein Ziel legitim fällt, meldet die Folge ohnehin als
Meldung („Buchung gelöscht"), und die Meldung ist die Ansage. Die Kette braucht keine zweite.

**Regel R-4 — den Ersatz nennt der Aufrufer, nicht der Dialog.** `DialogSurface` weiß, **wer**
geöffnet hat; welche Zeile nachrückt, weiß allein die Liste. Der Ersatz gehört deshalb als Angabe
an den Dialog, gelesen **nur** dann, wenn das Ziel nach R-1 gefallen ist — Form etwa
`fallbackFocus?: () => HTMLElement | null` neben dem vorhandenen `initialFocus`. Ohne Angabe bleibt
es beim heutigen Verhalten; der Name der Angabe gehört frontend-dev, die Bedingung hierher.

**Regel R-5 — die Frage, die vor dem Bauen zu beantworten ist.** Wer einen Dialog von einem
Bedienelement aus öffnet, beantwortet vorher: *Überlebt dieses Bedienelement seinen eigenen
Erfolg?* Es gibt drei Antworten und je genau eine Bauform:

| Antwort | Bauform |
|---|---|
| Ja, unverändert | nichts zu tun |
| Ja, aber anders beschriftet | **ein Baustein, zwei Beschriftungen** (U-5) |
| Nein, es fällt | Ersatzkette nach R-2, am Aufrufer benannt (R-4) |

Eine vierte Antwort gibt es nicht, und „zwei Bausteine an einer Stelle" ist keine davon.

**Regel R-6 — woran ein Prüfer den Fall erkennt, ohne einen Browser.** Die verdächtige Form ist
**nicht** „zwei Bausteine in einer Bedingung" — die ist meist harmlos. Verdächtig ist die
Verbindung dreier Merkmale: (a) an einer Stelle stehen zwei **verschiedene** Bausteinarten,
(b) die Bedingung dazwischen kann sich ändern, **während die Fläche steht**, und (c) einer der
beiden öffnet einen Dialog oder ein Menü. Der Bestand kennt heute drei Stellen mit (a), und die
Unterscheidung trägt:

| Ort | (b) ändert sich zur Laufzeit? | Urteil |
|---|---|---|
| `ExportGroups.tsx:303` | **ja** — `entry.note`, geändert durch den Dialog dieses Knopfes | **der Fall.** Wird behoben |
| `Timer.tsx:123` | nein — abgeleitet aus `size`, einem festen Wert der Aufrufstelle (`:81`) | unbedenklich. Derselbe Baustein wechselt zur Laufzeit nur `icon` und `variant` — die richtige Form |
| `BookingsScreen.tsx:396` | ja, aber **beide Zweige sind `Button`** | unbedenklich. Gleicher Elementtyp heißt gleicher Knoten; React setzt Eigenschaften um |

---

## 11.7 Zustände, Dichte, Responsives, Bewegung

**Zustände des Knopfes.** Kein neuer, keiner fällt weg.

| Zustand | Was gilt |
|---|---|
| Ruhe | 11.3, je nach Leistung `secondary` oder `ghost` |
| Zeiger | `.btn--secondary:hover` bzw. `.btn--ghost:hover`, unverändert (`components.css:76-93`) |
| Gedrückt | `:active` derselben Regeln, unverändert |
| Fokus | der Ring aus Abschnitt 10. Die Zeilenliste `.eentries` liegt auf `--bg-surface-alt` (`components.css:3116-3124`) — das Paar `--focus-ring-color` / `--bg-surface-alt` läuft bereits (10.4, 5,83 hell). Weder `secondary` noch `ghost` trägt `.on-solid` (10.5). **Kein neues Farbpaar** |
| Wartend | gibt es nicht — 11.5 |
| Nach dem Gelingen | derselbe Knoten, neue Beschriftung, neue Ausprägung, der Fokusring bleibt stehen |
| Fehlgeschlagen | die Zeile bleibt unberührt; der Fehler steht im Dialog (`error={mutation.error}`). Richtig so: der gespeicherte Wert hat sich nicht geändert, also darf sich der Knopf nicht ändern |
| Zeile abgewählt (`.eentry--excluded`) | Beschriftung durchgestrichen, Knopf **bedienbar**. Eine Buchung, die aus *diesem* Lauf herausgenommen ist, braucht ihre Leistung trotzdem. Ausdrücklich nicht sperren |
| Laden der Fläche | `AsyncBoundary` mit Skelett gilt für das **erste** Laden. Danach R-0 |

**Bewegung: keine.** Der Wechsel der Beschriftung wird **nicht** übergeblendet. Ein Text, der
verblasst, ist unlesbar in genau dem Augenblick, in dem er gelesen wird; und `base.css:209-218`
nähme die Blende bei `prefers-reduced-motion` ohnehin weg — eine Bewegung, die dort verschwinden
darf, hat nie getragen (U-3 aus T-171). Auch kein Aufblitzen der Zeile: Die Rückmeldung sind
Meldung, Beschriftung und der Ring, der stehen bleibt. Drei sind genug.

**Dichte — der einzige Preis dieser Entscheidung. Mein erster Rechenweg dazu war falsch; hier steht
der berichtigte.** `.eentry` ist ein Raster mit sieben Spalten,
`auto auto auto auto auto minmax(0, 1fr) auto` (`components.css:3127-3135`). Spalte 7 ist der
Knopf, Spalte 6 die Leistung und die **einzige** bewegliche.

> **Was hier stand und widerlegt ist:** *„Rasterspalten gelten für alle Zeilen zugleich: Ein
> beschrifteter Knopf verbreitert Spalte 7 für die ganze Liste, nicht je Zeile. In einer Gruppe, in
> der schon heute eine Buchung ohne Leistung steht, ist dieser Preis bereits bezahlt."* Das setzt
> eine **gemeinsame Spaltenachse** voraus. Die gibt es nicht. ux-designer hat die Kaskade
> nachgemessen (T-222, `textbestand.md` 15.6), und ich habe es gegengelesen:
> `.eentries` ist `display: flex; flex-direction: column`, **jede** `.eentry` ist ihr **eigenes**
> Raster; kein `subgrid`, keine geteilte Achse. Dasselbe in der Vorschau: `.tpsegment-list` ist
> Flex, `.tpsegment` je Zeile ein Raster mit vier Spalten (`app.css:3589-3608`). Der Fehler ist
> derselben Art wie der in `textabbau-gestalt.md` 9.11: Ich habe eine **Eigenschaft angenommen**,
> statt sie zu lesen — und Rasterspalten teilen sich nur über eine gemeinsame Achse, die genau
> **eine** Zeile CSS herstellt und die hier nicht dasteht.

**Der berichtigte Rechenweg, und er kehrt die alte Aussage um.** Der Preis fällt **je Zeile** an,
und er fällt **ausschließlich in den gefüllten** Zeilen:

| Zeile | vorher (Spalte 7) | nachher | Preis in dieser Zeile |
|---|---|---|---|
| ohne Leistung | beschrifteter `Button` (~150 px) | derselbe | **null** — er war schon da |
| mit Leistung | `IconButton`, 28 px | beschrifteter `Button` | **die volle Differenz**, rund 120 px weniger für die Leistung |

Damit ist die alte Aussage nicht nur ungenau, sondern **umgekehrt**: Die Zeilen, von denen ich
sagte, sie hätten den Preis „bereits bezahlt", sind die einzigen, die **gar nichts** zahlen. Und
die Gruppen, die ich für den Normalfall hielt, gibt es als Rechengröße nicht — die
Zusammensetzung einer Gruppe ist für die Breite jeder einzelnen Zeile **belanglos**.

**Was dieselbe Messung zugunsten der Entscheidung ergibt, gehört daneben.** Die Zeilen sind schon
heute nicht bündig: eine Zeile mit `Button` neben einer mit `IconButton` hat eine andere letzte
Spalte. Die Vereinheitlichung auf **einen** Baustein macht die Liste an dieser Stelle also
ruhiger, nicht unruhiger — und der Wechsel der Beschriftung bewegt nach dem Speichern nur seine
**eigene** Zeile um wenige Pixel, nie die Liste. Bedingung (b) aus 11.4 (gleiche Länge) trägt
weiter, aber aus dem engeren Grund.

Vertretbar bleibt der Preis aus dem Grund, der in derselben Fläche steht: **Die vollständige
Leistung steht unmittelbar darüber.** `renderRowDetail` zeichnet vor der Buchungsliste die
Exportzeile, die geschrieben wird (`ExportGroups.tsx:255-260`) — „Erst was geschrieben wird, danach
woraus es entsteht". Die Spalte in der Buchungsliste ist die Herkunftsansicht, nicht die Lesefläche;
darum trägt sie heute schon `truncate` und einen Zeigertext. **Aber ob sie noch etwas zeigt, das
diesen Namen verdient, ist jetzt eine Messung an einer Zeile und nicht mehr eine Schätzung über
eine Liste.**

### 11.7.1 Der Meßauftrag an visual-qa — berichtigt, weil der teure Fall ein anderer ist

**Gemessen wird eine Zeile, keine Gruppe.** Spalte 6 einer `.eentry` ist
`Zeilenbreite − (Spalten 1–5 + Spalte 7) − 6 × var(--space-3) − Polsterung`. Alles darin ist
zeilenlokal. Der Auftrag lautet deshalb:

1. **Der teure Fall ist die *gefüllte* Zeile in ihrer breitesten Ausprägung**, nicht „eine Gruppe,
   in der jede Buchung ihre Leistung hat". Konkret: `source = "Von Hand"` (9 Zeichen statt 5 bei
   „Timer"), Status **`reopened`**, denn dann steht in Spalte 5 das Etikett statt des
   `.eentry__spacer`, und der ist `width: 0` (`components.css:3169-3172`) — die reopened-Zeile ist
   die schmalste Lesefläche der Liste, und sie ist es **nur** in ihrer eigenen Zeile. Dazu eine
   lange Leistung aus `tests/fixtures/`.
2. **Zu messen bei 1280×720 und 1024×640** — beides bleibt. **Ein Thema genügt:** Breiten hängen an
   keinem Themenblock (Regel T-6, letzter Satz). Wer beide misst, misst dieselbe Zahl zweimal; wer
   dabei umschaltet, wartet trotzdem 600 ms, sonst mißt er nebenbei eine Zwischenfarbe.
3. **Festzuhalten sind zwei Zahlen je Fenster:** die Pixelbreite von `.eentry__note` und die Zahl
   der Zeichen, die vor dem `truncate` stehen bleiben.
4. **Die Schwelle bleibt, ihr Ort ändert sich:** Bleiben in der Zeile aus Punkt 1 **weniger als
   etwa zwanzig Zeichen** der Leistung übrig, gilt der Rückfall. Gelesen wird sie am schlechtesten
   Fall, nicht am Mittel — bei zeilenlokalen Rastern gibt es kein Mittel, das etwas bedeutet.
5. **Dieselbe Messung für `.tpsegment`** (`TemplatePreview`, vier Spalten, eine bewegliche). Dort
   ist die Rechnung eine andere und kleiner: Der Knopf war schon beschriftet, die Beschriftung
   wächst von „Bearbeiten" (10 Zeichen) auf „Leistung bearbeiten" (19). Gemessen wird trotzdem,
   weil auch dort jede Zeile ihr eigenes Raster ist.

**Der vorab entschiedene Rückfall — unverändert, und ja: wahrscheinlicher.** `IconButton` in
**beiden** Zuständen, `label` gleich den zugänglichen Namen aus 11.4 (Wortlaut und Namensform
bleiben zeichengleich, damit die Prüffälle nicht zweimal wandern). Weiterhin **ein** Baustein,
weiterhin ein überlebender Knoten; die Kernentscheidung aus 11.2 wird davon nicht berührt, nur ihre
Erscheinung. Zur Wahrscheinlichkeit, mit Begründung statt Gefühl:

* **Betroffen sind statt seltener Gruppen fast alle Zeilen.** Eine Buchung ohne Leistung ist der
  Ausnahmefall — sie ist der eine Grund, aus dem eine Tagesgruppe nicht exportiert wird (E-034).
  Die Regel ist die gefüllte Zeile, und genau sie zahlt. Die Menge der betroffenen Flächen ist
  damit um ein Vielfaches größer als in meiner ersten Rechnung.
* **Der Rückfall kostet weniger, als 11.3 befürchten ließ.** Er nimmt den sichtbaren Text auch dem
  Mangelzweig. Der Mangel steht aber **in derselben Zeile schon in Worten**: Spalte 6 zeigt dort
  „— keine Leistung erfasst —" (`ExportGroups.tsx:328-329`), und die Ausprägung `secondary` gegen
  `ghost` bleibt. Es fällt also ein drittes Zeichen für einen Zustand weg, der zwei behält — und es
  fällt in der einzigen Zeilenart, deren Spalte 6 nichts Lesenswertes enthält.
* **Ich halte den Rückfall danach für den wahrscheinlicheren Ausgang** und sage das vor der
  Messung, damit es keine nachträgliche Erklärung wird. Entschieden wird er trotzdem erst von der
  Zahl aus Punkt 4.

**Was der Rückfall ausdrücklich nicht ist, und die Berichtigung lädt genau dazu ein.** Wer liest,
daß der Preis je Zeile anfällt, kommt auf den nächstliegenden Gedanken: *dann eben `IconButton` nur
in den gefüllten Zeilen und `Button` in den leeren.* **Das ist der Fehler aus O-JR, wörtlich.**
`Button` und `IconButton` sind zwei Bausteine; ein Zweig, der zwischen ihnen umschaltet, tauscht
beim Speichern den Knoten aus, auf den der Dialog den Fokus zurückgibt — der Befund, den dieser
ganze Abschnitt behebt. Zulässig wäre allein **ein** `Button`, dessen Beschriftung im gefüllten
Zweig verborgen wird; das braucht eine eigene Klasse für die Innenlücke und eine eigene
Entscheidung, und es steht hier als **nicht gewählt**, nicht als dritter Weg.

**Responsiv.** Keine Umbruchmarke wird berührt. `.eentry` bricht nicht um; die bewegliche Spalte
nimmt die Breitenänderung auf — je Zeile. Wird der Rückfall gezogen, ändert sich auch dort nichts.

---

## 11.8 Übergabe an frontend-dev

| Datei | Änderung |
|---|---|
| `apps/web/src/components/ExportGroups.tsx:303-319` | Die beiden Zweige werden **ein** `Button`. Quelltext in 11.4. Der äußere Zweig `onEditEntry === undefined ? null : …` **bleibt**: Er hängt an einer festen Eigenschaft der Aufrufstelle, nicht an einem Wert, der sich zur Laufzeit ändert (R-6) |
| `apps/web/src/components/ExportGroups.tsx`, Kopfkommentar | Vier Sätze, warum hier **ein** Baustein steht: der Knopf ist das Rückkehrziel des Dialogs, den er öffnet; er überlebt die eigene Wirkung nur als derselbe Knoten; die Ausprägung darf wechseln, der Baustein nicht; Verweis auf O-IH und diesen Abschnitt. Ohne diesen Kommentar ist die nächste „Aufräumung" die Wiederherstellung des Fehlers |
| `apps/web/src/screens/TemplatePreview.tsx:590-597` | **Zweite Stelle desselben Satzes.** Baustein und Bedingung stimmen bereits; zu berichtigen sind die Beschriftung („Bearbeiten" → „Leistung bearbeiten") und der fehlende Zeilenbezug im Namen — derselbe verborgene Zusatz, dieselbe Form. Die Ausprägung dort ist `ghost`; nach 11.3 wird sie `secondary`, solange die Leistung fehlt |
| `apps/web/src/screens/ExportScreen.tsx:1236-1243` (`SkippedRow`) | **Dritte Stelle desselben Satzes.** Sie führt aus der Ansicht heraus, hat also kein Rückkehrziel — aber denselben Namen ohne Unterscheidung, je ausgelassener Tagesgruppe einmal. Derselbe verborgene Zusatz mit dem Tag der Gruppe (`formatDayLabel(skipped.group.day)` steht sichtbar daneben, `:1231`). Ausprägung `secondary` bleibt |
| `apps/web/src/screens/TemplatePreview.tsx`, **Sperrmeldung der Gruppe** | **Vierte Stelle, in dieser Tabelle nachgetragen.** Sie fehlte hier; ux-designer hat sie in T-222 gemessen, der Orchestrator hat sie als O-JX zugeschlagen. Ohne sie stünde die Verwechslung, die der verborgene Zusatz beseitigt, eine Ebene höher unverändert da — **eine Behebung, die an drei von vier Flächen greift, sieht geschlossen aus und ist es nicht** (die Fehlerart aus T-195). Derselbe Zusatz, dieselbe Namensform, Bezug ist die Gruppe und nicht die Buchung |
| `apps/web/src/showcase/ExportPreviewSection.tsx` | Die Musterseite zeigt beide Zustände dieser Zeile. Nach der Änderung sind es zwei Beschriftungen eines Knopfes und nicht zwei Knöpfe; die Bildunterschrift dort ist entsprechend zu berichtigen |
| `apps/web/design/DESIGNSYSTEM.md` | **Regel U-5 und R-1 bis R-6** gehören in den Abschnitt über Knöpfe und Dialoge. Sie sind ab jetzt Hausregeln und nicht Befund einer Aufgabe |

**Was ausdrücklich *nicht* geändert wird:** `DialogSurface.tsx`. R-1 und R-4 beschreiben eine
Erweiterung, die diese Behebung **nicht braucht** — nach 11.2 fällt hier kein Ziel. Sie in derselben
Welle zu bauen hieße, den Kern der Fokusrückkehr anzufassen, ohne dass ein Befund es verlangt. Als
eigener Auftrag richtig, siehe F-11.

**Reihenfolge.** Die **vier** Stellen (`ExportGroups`, `TemplatePreview` — Zeile **und**
Sperrmeldung —, `SkippedRow`) tragen denselben Satz und gehören in **eine** Aufgabe und in eine
Hand — sonst heißt dieselbe Handlung im selben Produkt vier verschiedene Dinge, und der nächste
Durchgang findet die Abweichung als neuen Befund. *(Bis T-222 standen hier drei; die vierte ist
oben nachgetragen und nicht ans Ende gehängt — Regel T-7.)*

---

## 11.9 Übergabe an e2e-tester und unit-tester

**Der Prüffall, der diesen Fehler misst und den kein Baustein vortäuschen kann** — an
`tests/e2e/focus-return-after-dialog.spec.ts`, das den Zeitpunkt bereits richtig behandelt
(`:32-37`):

1. Exportbildschirm, eine Tagesgruppe aufklappen, in der eine Buchung ohne Leistung steht.
2. „Leistung nachtragen, Buchung …" anklicken. Der Formulardialog öffnet.
3. Leistung eintragen, speichern.
4. **Zwei Messungen, nicht eine.** Unmittelbar nach dem Schließen: der zugängliche Name des
   fokussierten Elements. Und **nach dem Eintreffen der Auffrischung** — erkennbar daran, dass die
   Zeile die neue Leistung zeigt — noch einmal.
5. Erwartet in beiden Messungen: **„Leistung bearbeiten, Buchung …"** (nach dem Auffrischen;
   davor die Fassung „nachtragen"). Nie `<body>`.

Schritt 4 ist der ganze Punkt: Die zweite Messung ist die einzige, die den heutigen Fehler sieht
(11.1), und die einzige, die eine Rückkehr in zwei Bausteinen nicht bestehen kann.

**An unit-tester, als billige zweite Naht:** ein Fall, der `ExportGroups` mit einer Buchung ohne
Leistung zeichnet, den Knoten des Knopfes festhält, neu zeichnet mit gefüllter Leistung und misst,
dass es **derselbe** Knoten ist und der zugängliche Name gewechselt hat. Das misst die Bauform
unmittelbar, ohne Browser und ohne Fokus — und es ist die Prüfung, die beim nächsten Umbau der Zeile
zuerst rot wird.

**Heute betroffene Prüffälle: keine.** Kein Fall im Bestand greift auf „Leistung nachtragen" oder
„Leistung der Buchung … bearbeiten" zu (gesucht in `tests/**` und `apps/*/test/**`). Die
Namensänderung aus 11.4 ist damit heute kostenlos — und genau deshalb der richtige Augenblick
für sie.

---

## 11.10 Vertrag (E-076 Punkt 3)

| Änderung | Rolle | Zugänglicher Name | Klassenname | Token |
|---|---|---|---|---|
| 11.2 ein Baustein statt zweier | unverändert `button` | siehe die zwei Zeilen darunter | an dieser Stelle entfällt `.icon-btn` / `.icon-btn--sm`; es steht `.btn .btn--sm` mit `.btn--secondary` oder `.btn--ghost` | — |
| Zweig „Leistung fehlt" | — | **Zusatz**: „Leistung nachtragen" → „Leistung nachtragen, Buchung 09:00–10:20". Sichtbarer Text **unverändert** | — | — |
| Zweig „Leistung ist da" | — | **geändert**: „Leistung der Buchung 09:00–10:20 bearbeiten" → „Leistung bearbeiten, Buchung 09:00–10:20" | — | — |
| 11.3 Ausprägung wechselt mit dem Zustand | — | — | `.btn--secondary` / `.btn--ghost`, beide vorhanden | — |
| 11.8 TemplatePreview, SkippedRow | — | Zusatz wie oben; „Bearbeiten" → „Leistung bearbeiten" | — | — |

**Ein einziger echter Vertragspunkt: der zugängliche Name des Symbolzweigs.** Er ist unvermeidlich —
sobald der Knopf sichtbaren Text trägt, schreibt SC 2.5.3 die Form des Namens vor (11.4). Er kostet
heute keinen Prüffall (11.9). Kein Token, keine Rolle, keine Farbe, kein Kontrastpaar.

---

## 11.11 Befunde und offene Fragen

**B-17 — `finalFocusEl` prüft eine von drei Bedingungen.** `DialogSurface.tsx:341` fragt nur
`isConnected`. Ein Auslöser, der beim Schließen **gesperrt** oder **verborgen** ist, besteht diese
Prüfung und nimmt den Fokus trotzdem nicht auf; das Ergebnis ist `<body>`, dasselbe wie beim
entfernten Knoten, nur ohne Spur. Aus der Kaskade und aus `Primitives.tsx:73` gelesen, **nicht im
Browser gemessen**. Nicht Teil dieser Behebung, weil hier kein Knoten gesperrt wird — R-1 hält es
fest, damit es nicht ein zweites Mal gefunden werden muss. Mittel.

**B-18 — der doppelte Wartezustand ist eine wartende Falle, keine Vorsicht.** Wer einem Auslöser
„zur Sicherheit" `loading` gibt, während sein Dialog arbeitet, zerstört die Fokusrückkehr — und es
sieht wie Sorgfalt aus. Das ist der Grund, aus dem 11.5 nicht nur sagt, was dort steht, sondern
warum. Der Satz gehört in `DESIGNSYSTEM.md` neben `loading`.

**B-19 — die Prüfung zum falschen Zeitpunkt.** Der Fall aus 11.1 besteht jede Messung bei t+0. Das
ist keine Eigenheit dieser Stelle, sondern die Bauart jeder Fläche, die nach einer Handlung
auffrischt: Zwischen Rückkehr und Austausch liegt ein Netzweg. **Jede** Fokusprüfung nach einer
ändernden Handlung misst zweimal — einmal sofort und einmal nach der Auffrischung. Vorschlag als
Zusatz zum Kopfkommentar von `focus-return-after-dialog.spec.ts`, der die Doppelmessung bereits aus
einem anderen Grund kennt.

**F-10 — offen an ux-designer:** die zwei Wortlaute aus 11.4 und der verborgene Zusatz. Meine
Bedingungen stehen dort; ohne Antwort gelten die Fassungen oben.

**F-11 — offen an den Orchestrator: soll `fallbackFocus` (R-4) gebaut werden, und wann?** Meine
Empfehlung: **ja, aber nicht in dieser Welle und nicht in dieser Aufgabe.** Erst wenn eine Fläche
sie braucht — die nächste Löschung aus einer Liste heraus ist der richtige Anlass —, und dann mit
einem Prüffall an derselben Reihe. Eine Ersatzkette ohne Fläche, die sie benutzt, ist ungemessener
Bau am Kern der Fokusrückkehr; das ist bei O-CY-2 zweimal schiefgegangen.

**F-12 — offen, klein:** `TemplatePreview` benutzt für dieselbe Zeile `ghost`, `ExportGroups` und
`SkippedRow` benutzen `secondary`. Ich habe in 11.8 die Angleichung an `secondary` vorgegeben, weil
zwei von drei Stellen sie schon tragen und weil der Mangel dort dieselbe Folge hat. Wer widerspricht,
widerspricht jetzt und nicht nach dem Bau.

---

# 12. Nachtrag T-229 (Welle AI) — nur das Verzeichnis, der Inhalt steht oben

**Vorlage:** Board O-JZ; `.claude/team/reports/T-221-spec-ux-reviewer.md`;
`.claude/team/reports/T-222-ux-designer.md` samt `docs/design/textbestand.md` 15.6;
`.claude/team/reports/T-216-frontend-dev.md` Abschnitte 2 bis 4 und Annahme 4; E-087.

**Dieser Abschnitt ist absichtlich kurz und trägt keine Entscheidung.** Regel T-7 (0.1) ist in
derselben Aufgabe entstanden, in der sie angewandt wurde: Jede Berichtigung dieser Welle steht
**in** dem Abschnitt, den sie berichtigt. Hier steht nur, wohin — damit ein Leser, der nach „was hat
T-229 gemacht" sucht, nicht zweimal sucht.

| Was | Wohin es gezogen wurde | Was dort verschwunden ist |
|---|---|---|
| Der Wirt reicht nicht bis in die Kinder (aus `textabbau-gestalt.md` 9.11) | dort 9.1 Punkt 2 **und** 9.8 als vierter Punkt | „baulich ausgeschlossen" ohne Grenze; „drei Grenzen" |
| Innere Rolle fällt **mit** dem Wirt; diese Fläche ist `polite` | dort 9.7, Bündelzeile 2 | — (der Auftrag war stumm) |
| Fokusring: Lauf- und Pixelzahlen aus T-216 | 10.4, 10.5 | „~9,2"; 5,99 / 6,27 als Laufwerte |
| Die Kachelzahl im dunklen Slot | 10.11.2 | **1,11** → **1,15**, mit dem Grund daneben |
| Der Dichterechenweg | 11.7 samt neuem 11.7.1 | die gemeinsame Spaltenachse und der „bereits bezahlte" Preis |
| Die vierte Fläche desselben Satzes | 11.8, Tabelle und Reihenfolge | „drei Stellen" |

**Zwei Regeln sind dabei entstanden und stehen vorn in 0.1, nicht hier:** **T-6** (nach einem
Themenwechsel 600 ms warten, sonst mißt man den Übergang — aus T-216 Annahme 4) und **T-7** (eine
Berichtigung steht an der Stelle, die sie berichtigt — aus O-JZ).

**B-20 — die Fehlerart hinter beiden Befunden dieser Welle ist dieselbe, und sie hat einen Namen.**
Beide Male habe ich eine **Eigenschaft angenommen, statt sie zu lesen**: einmal, daß ein Wirt in
seine Kinder reicht, einmal, daß Rasterspalten sich über Zeilen teilen. Beide Annahmen sind
plausibel, beide sind mit **einer** Zeile Beleg zu prüfen (`MessageHostContext` liest nur
`InlineMessage`; `.eentries` ist Flex), und beide haben eine Zusage getragen, die danach falsch war.
Das ist E-087 auf Bauformen statt auf Farben angewandt: **Wer eine Bauform behauptet, zitiert die
Zeile, die sie herstellt.** Für Farben tut das der Lauf; für Bauformen gibt es keinen Lauf, nur das
Zitat. Ich nehme das als Auflage an mich selbst und nicht als Vorschlag für einen Wächter — eine
Prüfung, die „behauptete Bauformen" fände, müßte Prosa verstehen.

**F-13 — nachgemessen und geschlossen in T-236 (O-KF).** Die Frage lautete, ob **76** oder **42**
die Zahl der `InlineMessage`-Aufrufstellen sei. **Beides und keines: es waren nie zwei Antworten auf
eine Frage, sondern zwei verschiedene Mengen in einem Abschnitt.** 76 zählte alle Aufrufstellen von
`InlineMessage`; 42 zählte die **bedingt gezeichneten Meldebausteine** aus T-191 2.5 — davon 37
`InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice`. Beide Sätze waren richtig, und beide standen
ohne Angabe, worüber sie zählen. Gemessen 2026-09-06: **77** Aufrufstellen in `apps/web/src`.
Berichtigt ist es dort, wo es steht — `textabbau-gestalt.md` 9.1 und 9.2 —, mit Stand und Datum an
jeder der beiden Zahlen. Die Messung und ihre Grenzen stehen in 14.1.

---

# 13. Nachtrag T-233 (Welle AK) — aus einer Möglichkeit wird eine Zahl

**Vorlage:** die Messung des Orchestrators in **WebKitGTK 4.1** und in Chromium gegen dieselbe
Vorrichtung; `.claude/team/reports/T-207-frontend-dev.md` Abschnitt 4 (die Grenze, die hier zur
Hälfte fällt); `.claude/team/reports/T-202-frontend-dev.md` Risiko 3 und die dortigen 19 Striche;
`.claude/team/reports/T-216-frontend-dev.md` Risiko R-T216-1; Board O-JV; E-087.

**Auch dieser Abschnitt trägt keine Entscheidung.** Nach Regel T-7 steht jede Berichtigung **in**
dem Abschnitt, den sie berichtigt. Hier steht, wohin — und der Teil der Herleitung, der an keinem
einzelnen Abschnitt hängt.

| Was | Wohin es gezogen wurde | Was dort verschwunden ist |
|---|---|---|
| Die Zahlen der zwei Engines, Striche und Längen | 2.8, Tabelle | „Die Länge der Unterbrechungen legt die Engine fest" als Vermutung |
| Das Urteil über den Rückfall | 2.8 | der Rückfall **gegen die Engine**; er steht jetzt als Werkzeug gegen die **Kürze** |
| `rows={3}` → `rows={2}` | 2.8, Punkt 1 | die falsche kleinste Ausprägung |
| „drei sichtbare Unterbrechungen" → drei Striche, zwei Lücken | 2.8, Punkt 2 | die zweideutige Anforderung |
| **Regel T-8** samt Mindesthöhe, Faustformel und Flächentabelle | 2.8 | — (neu). *T-8 gilt unverändert; die **Faustformel** und die aus ihr gezogene Planungsschranke sind in T-236 zurückgenommen* |
| Die zweite Bedingung für ein Formmerkmal | 0, erste Tabellenzeile, und 0.1 | „ein gemessenes Verhältnis" als **alleinige** Bedingung |
| Die Grenze des Paares „Balken gegen Lücke" | 2.5 | „die Form ist damit gemessen" ohne Vorbehalt |
| Die Pfadlänge als Maß am Etikett | 1.4, Zeile Konturform | — (die Zeile sagte kein Maß) |
| Die Malreihenfolge in WebKitGTK, Schnitt und Farben | 10.4 | die Annahme hinter allen vier Kombinationen |
| **P-1 bis P-6** — was ein Lauf über die Schienenform prüfen soll | 2.8, letzter Teil | — (neu) |

## 13.1 Was diese Messung beweist und was nicht — die Trennung, an der alles hängt

Die Messung sagt **zwei** Dinge, und sie werden leicht zu einem verschmolzen:

1. **Die Form entsteht in beiden Engines.** Durchgezogen bleibt durchgezogen, gestrichelt bleibt
   gestrichelt. Das ist die Aussage, auf der 2.3 und 1.4 stehen, und sie ist damit für die
   Engine-Familie des Linux-Erzeugnisses belegt statt angenommen.
2. **Die Verteilung ist verschieden.** 3 gegen 4 Striche, {7, 9, 7} gegen {7, 7, 7, 7}, 23 gegen
   28 px bemalte Länge. Keine dieser Zahlen ist eine Eigenschaft von Takt.

**Wer beides zusammenwirft, baut in eine von zwei Richtungen falsch.** Nach oben: Er hält die
Zahlen für die Zusage und nagelt eine Prüfung darauf fest — dann ist das Erzeugnis in einer der
beiden Engines rot, obwohl es in beiden richtig ist (P-2, P-3). Nach unten: Er hält die Form für
engine-unabhängig **ohne Maß** — dann übersteht sie die 40-px-Schiene und fällt bei 32 px aus, ohne
daß es jemand bemerkt, weil das Ergebnis nicht „kaputt" aussieht, sondern wie der **andere**
Zustand (T-8, zweiter Halbsatz).

## 13.2 Übergabe an frontend-dev

Alles hier ist ein Satz oder eine Zeile. Nichts davon ändert einen Wert, eine Klasse, ein Token
oder einen zugänglichen Namen — **kein Vertragspunkt nach E-076 Punkt 3.**

| Datei | Änderung |
|---|---|
> **Berichtigt in T-236.** Drei Zeilen dieser Tabelle nannten Zahlen, die inzwischen widerlegt oder
> zurückgenommen sind. Sie stehen unten in ihrer heutigen Fassung; die letzte Zeile ist **gebaut**
> (T-232). Wer nach dieser Tabelle arbeitet, arbeitet nach der heutigen Fassung.

| Datei | Änderung |
|---|---|
| `apps/web/src/styles/components.css:1405-1422` (Kommentar über `.note--internal`) | Der Satz „Der Unterschied ist eine **Form** und bleibt deshalb in Graustufen und bei Farbfehlsichtigkeit bestehen" ist richtig und **gemessen** — er darf das jetzt sagen: *gemessen in WebKitGTK 2.52.6 und Chromium 151, die Form trägt in beiden; engine-abhängig ist der Rhythmus (3 gegen 7 Striche an derselben Fläche) und sogar die gemessene Schienenlänge (56 gegen 73 px)*. Dazu ein Satz zu T-8: Das Paar mißt das Verhältnis, nicht die Zahl der Lücken. **Keine Strichzahl in den Kommentar als Zusage** |
| `apps/web/src/styles/components.css:837-839` (Kommentar über `.table__row--not-billed`) | Der Kommentar sagt „zusaetzlich gestrichelt" und meint es richtig. Ein Halbsatz gehört dazu: **Verstärkung, kein Träger.** Getragen wird der Zustand vom Balken des Zustandspunktes, vom Symbol und vom Wort. **Nicht mehr zu schreiben:** „liegt unter der Schranke aus T-8" — diese Schranke ist zurückgenommen; richtig ist „außerhalb des gemessenen Bandes, und ausdrücklich ausgenommen" (2.8) |
| `apps/web/scripts/contrast-check.mjs:388-391` (Notiz am Paar `--note-internal-rail`) | Die Notiz „zugleich Balken gegen Luecke" bleibt und bekommt die Grenze dazu: Das Paar mißt, **wie deutlich** der Unterschied ist, nicht, **ob** es Lücken gibt. Zwei Zeilen, Verweis auf T-8 und auf `proof:engines` |
| `apps/web/design/DESIGNSYSTEM.md:840-850` | Der Absatz nennt die zwei Zahlen und ist damit richtig. Es fehlt der Satz, den T-207 verlangt hat und der jetzt beantwortbar ist: **gemessen in zwei Engines, Stand 2026-09-06**, Form ja, Rhythmus nein. Und **T-8 gehört als Hausregel in den Abschnitt über Formmerkmale** — nicht als Befund einer Aufgabe |
| ~~eine Prüfung über die Schienenform, falls eine gebaut wird~~ | **Gebaut: `proof:engines` (T-232), 23 / 0, beide Engines.** P-1 bis P-7 stehen in 2.8 in der Fassung **nach** diesem Lauf. Die Schranke ist zweigeteilt (P-4), nicht die eine 4 aus T-233 |

**Reihenfolge.** Die vier Textstellen sind voneinander unabhängig und können in einer Aufgabe
laufen.

## 13.3 Befunde und offene Fragen

**B-21 — meine eigene Anforderung war der erste Fall des Fehlers, vor dem 2.8 jetzt warnt.**
„Mindestens drei sichtbare Unterbrechungen" ist zweideutig, und in der schärferen Lesart (drei
**Lücken**) wäre WebKitGTK an der gemessenen Vorrichtung rot, während die Form dort unverkennbar
steht. Der Fehler ist nicht die Zahl, sondern die **Einheit**: Ich habe eine Schranke in einer
Größe formuliert, die zwei Bedeutungen hat, und keine davon benannt. Dieselbe Sorte wie B-20 — eine
Angabe, die plausibel aussieht und beim ersten Nachmessen in zwei Aussagen zerfällt.

**F-14 — beantwortet: die gemessene Schiene war 41 px hoch.** Und die Antwort hat die Regel
umgeworfen, statt sie zu bestätigen. 41 px bei 4 px Rahmen liegt **unter** der damaligen
Planungsschranke von 48 px — und beide Engines tragen dort. Die Schranke war also nicht
vorsichtig, sondern **falsch, und zwar zur sicheren Seite**: Sie hätte eine tragende Fläche als zu
kurz verworfen. Zusammen mit den 56 px aus T-232 (WebKitGTK, wieder 3 Striche) folgt daraus, was in
2.8 an ihre Stelle getreten ist: kein gerechnetes Mindestmaß mehr, sondern ein **gemessenes Band**
von 41 px bis ≈ 217 px bei 4 px Rahmen. **Geschlossen in T-236.**

**F-15 — entschieden: `.auditrow__reason--absent` wird _nicht_ gemessen, sondern ausdrücklich
ausgenommen.** Sie ist Verstärkung; die Unterscheidung trägt der Text selbst, in beiden Zweigen, und
die zwei Zweige stehen nie nebeneinander. Eine Messung, deren Ausgang an der Gestalt nichts ändert,
ist kein Nachweis. Die Begründung steht in 2.8, wo die Tabelle steht; **die Ausnahme kostet eine
Zeile Kommentar im Stilblatt** (14.2), damit der nächste Leser nicht die Messung sucht, die es
absichtlich nicht gibt. **Geschlossen in T-236 — und dabei ist die Fläche aufgefallen, an der es
wirklich fehlt: F-17.**

**F-17 — neu und offen: `.badge--not-billed` ist ein mitgezählter Träger ohne Messung.** 1 px
Rahmen, geschlossener Pfad, ≈ 69 px Umfang. Alle sechs vorliegenden Messungen liegen bei **4 px**,
und nach der Messung an WebkitGTK darf von einer Rahmenbreite nicht auf eine andere geschlossen
werden. Es ist die einzige Fläche, an der die Konturform in der Aufzählung von 1.4 **mitgezählt**
wird — und Regel T-1 verlangt für ein mitgezähltes Merkmal eine Messung. Der Auftrag ist klein: ein
weiterer Ausschnitt und ein weiteres Element in der stehenden Vorrichtung von `proof:engines`. **Bis
dahin trägt die Kontur dort neben Symbol, Wort und Balken, nie allein** — so steht sie seit T-236
auch in 1.4, und damit ist die Lücke benannt statt überschrieben.

**F-16 — offen und nicht durch mich schließbar: macOS/WKWebView.** Die Grenze aus
T-207 ist zur Hälfte gefallen, nicht ganz — seit T-232 fällt diese Hälfte nicht mehr in einer
Handmessung, sondern in einem **wiederholbaren Lauf**, und das ist der Unterschied zwischen „einmal
gesehen" und „bei jeder Änderung gemessen". Zwei von drei ausgelieferten Erzeugnissen zeichnen mit
einer WebKit-Engine; gemessen ist eine von beiden. Und gemessen ist die **Engine-Familie**, nicht
die gebaute Binärdatei — dieselbe Einschränkung, die O-JV für den Fokusring führt. Beide Sätze
gehören an jede Aussage, die sich auf diese Messung stützt; sie stehen deshalb in 2.8 (P-6) und in
10.4 und nicht nur hier.

---

# 14. Nachtrag T-236 (Welle AL) — eine Faustformel weniger, ein Band mehr

**Vorlage:** Board O-KM und O-KF; `.claude/team/reports/T-232-frontend-dev.md` Abschnitte 4, 5 und
8 samt seinen Fragen 2 und 3; `.claude/team/reports/T-202-frontend-dev.md` 2.4;
`.claude/team/reports/T-191-frontend-dev.md` 2.5 und 10; die Handmessung des Orchestrators aus
T-233; E-078, E-087, E-094, E-095.

**Dieser Abschnitt trägt keine Entscheidung** (Regel T-7). Verbindlich ist, was in 0, 1.4, 2.8, 13.2
und 13.3 steht; hier steht nur, **wohin** es gezogen ist, **wie** gemessen wurde und **was die
Messung ausläßt**.

| Was | Wohin | Was dort verschwunden ist |
|---|---|---|
| Sechs Meßzeilen aus zwei Läufen, mit Engine, Fassung und Datum | 2.8, Tabelle | die Zwei-Spalten-Tabelle aus T-233 samt der unbrauchbaren Zeile über die durchgezogene Schiene |
| Rücknahme der Faustformel; Chromium-Modell mit Aufrunden; „kein Modell für WebKitGTK" | 2.8 | „Zahl der Striche ≈ Pfadlänge ÷ (3 × Rahmenbreite)" als **engineübergreifende** Größe |
| Das gemessene Band 41 px … ≈ 217 px bei 4 px Rahmen | 2.8 | „Planungsschranke: Pfadlänge ≥ 12 × Rahmenbreite" |
| Zwei ausdrückliche Ausnahmen mit Begründung; ein benannter Meßauftrag | 2.8, Flächentabelle | die leere Spalte an `.auditrow__reason--absent` und die Zahl „Zwölffaches" an der 1-px-Kontur |
| P-3 um die Schienenlänge; P-4 zweigeteilt; P-7 neu | 2.8, letzter Teil | „Die Schranke im Lauf ist 4, nicht 3" als **einzige** Fassung |
| Die zweite Bedingung ist eine Messung, keine Rechnung | 0, erste Tabellenzeile | „ein Mindestmaß" ohne Angabe, woher es kommt |
| Die Kontur trägt **mit**, nicht **allein** | 1.4, Zeile Konturform | „das Zwölffache der Schranke aus T-8" |
| 76 gegen 42: zwei Mengen, nicht zwei Antworten | `textabbau-gestalt.md` 9.1 und 9.2 | zwei Zahlen ohne Angabe, worüber sie zählen |
| Der Ersatz für „Bitte wählen" und die Regel dahinter | `textabbau-gestalt.md` 11 | — (neu) |

## 14.1 Wie gemessen wurde — und was die Messung ausläßt (E-094)

**Die Zahlen zur Schienenform** sind **nicht** von mir gemessen. Sie stammen aus `proof:engines`
(T-232), aus der Handmessung des Orchestrators (T-233) und aus T-202 2.4. Was ich getan habe, ist
das, was an dieser Stelle fehlte: die Punkte **zusammen** gerechnet und gegen das Modell gehalten,
das sie tragen sollten. Dabei ist aufgefallen, daß

* das Modell an allen drei Chromium-Punkten um **genau einen** Strich zu niedrig lag,
* einer der drei Punkte (die „228 px") **aus dem Modell selbst zurückgerechnet** war,
* und der vierte und fünfte Punkt (WebKitGTK bei 41 und 56 px) es **widerlegen**.

**Nicht gemessen und ausdrücklich offen:** jede Rahmenbreite außer 4 px, jede Länge außer den fünf
genannten, WKWebView, und die gebaute Binärdatei. Nichts davon ist überrechnet worden.

**Die Zählung der Aufrufstellen (O-KF)** habe ich gemessen, am 2026-09-06, über den **Wortlaut**
`<InlineMessage` im Arbeitsbaum, unter Beachtung von `.gitignore` — also über die versionierten
**und** die unversionierten Quelldateien, während die Bauergebnisse (`apps/desktop/src-tauri/taskpane/`)
draußen bleiben. Das ist genau die Vereinigung, die `CLAUDE.md` verlangt, in **einem** Durchgang
statt in zweien.

> **Was dieser Durchgang ausläßt, und ich sage es, statt es zu verschweigen:** In dieser Sitzung
> stand keine Schale zur Verfügung; ich konnte `git grep` und den Verzeichnisdurchlauf deshalb
> **nicht als zwei Zahlen** nebeneinanderstellen. Die Vereinigung ist gemessen, die **Differenz**
> zwischen beiden Wegen nicht. Für die Zahl unten ist das ohne Folge — sie ist die Vereinigung, und
> die Vereinigung ist die gesuchte Menge. Für die Regel aus `CLAUDE.md` ist es eine benannte Lücke.

**Ergebnis, Stand 2026-09-06:**

| Menge | Zahl | Wo |
|---|---:|---|
| `<InlineMessage` in `apps/web/src` | **77** | 46 in Ansichten und Bausteinen, **31** auf der Musterseite (`showcase/`) |
| davon **bedingt** gezeichnet (`{x === null ? null : <…/>}`) | **37**, Stand T-191 | von mir **nicht** nachgemessen — es braucht den AST-Durchgang, den T-191 gefahren hat |
| bedingte Meldebausteine **aller drei Arten** | **42**, Stand T-191 | 37 `InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice` |
| Aufrufstellen außerhalb von `apps/web/src` | **0** | die drei Treffer in `apps/web/scripts/proof-surface.mjs` sind Gegenproben des Wächters, keine Aufrufstellen; im Add-in und in der Hülle gibt es den Baustein nicht |

**Und damit ist die Frage aufgelöst, statt beantwortet.** 76 und 42 waren nie zwei Antworten auf
eine Frage. Der Fehler war nicht die Zahl, sondern daß **an keiner von beiden stand, worüber sie
zählt** — dieselbe Sorte wie B-21, wo eine Schranke in einer Einheit stand, die zwei Bedeutungen
hat. Die Berichtigung ist deshalb nicht „eine Zahl statt zweier", sondern **an jeder Zahl die
Menge**.

## 14.2 Übergabe an frontend-dev

Alles Neue aus dieser Welle. Die vier Zeilen aus 13.2 gelten unverändert weiter, in ihrer dort
berichtigten Fassung.

| Datei | Änderung | Warum |
|---|---|---|
| `apps/web/src/styles/app.css:2634-2639` (`.auditrow__reason--absent`) | **Ein Kommentar, wo heute keiner steht:** die gestrichelte Schiene ist hier **Verstärkung, kein Träger**; getragen wird der Unterschied vom Text selbst (Marke „Begründung" gegen den ausgeschriebenen Satz), und die zwei Zweige stehen nie nebeneinander. **Ausdrücklich nicht gemessen**, mit Verweis auf 2.8 | Ohne den Satz sucht der nächste Durchgang die Messung, die absichtlich fehlt. Genau so ist F-15 entstanden |
| `apps/web/scripts/engine-parity/**` (`proof:engines`) | **`.badge` und `.badge--not-billed` als zweiter Ausschnitt und zweites Element**, 1 px Rahmen, geschlossener Pfad. Gemessen: entsteht das Muster, wie viele Striche, wie lang — **keine Zahl als Schranke**, P-3 gilt unverändert | F-17. Die einzige Fläche, an der eine mitgezählte Formaussage ohne Messung dasteht. Die Vorrichtung steht bereits; es ist ein Ausschnitt, keine zweite Vorrichtung |
| `apps/web/src/components/Select.tsx:117` | Vorgabewert `placeholder` — Wortlaut und Regel in `textabbau-gestalt.md` **11** | O-KI |
| `apps/web/src/screens/ExportScreen.tsx:672-681` | Die fehlende Option für den leeren Wert — Begründung ebenfalls in `textabbau-gestalt.md` **11.3** | O-KI. Es ist **kein** Platzhalterproblem, sondern eine Lücke im Vorrat |

**Reihenfolge.** Die erste Zeile ist eine Zeile Kommentar und hängt an nichts. Die zweite gehört zu
`proof:engines` und läuft am besten mit der nächsten Änderung dort. Die dritte und vierte gehören
zusammen und in **eine** Aufgabe: Wer den Vorgabetext ändert, ohne die Option nachzutragen, ersetzt
an der Exportansicht eine falsche Aufforderung durch eine falsche Zustandsaussage.

## 14.3 Befunde

**B-22 — dieselbe Fehlerart wie B-20, diesmal in einer Zahl.** Bei B-20 habe ich eine **Bauform**
angenommen, statt sie zu lesen. Hier habe ich eine **Messung** angenommen, statt sie zu lesen: Die
„228 px" in 2.8 waren aus der Formel zurückgerechnet, die sie bestätigen sollten, während zwei
Zeilen weiter oben in T-202 2.4 die echten Zahlen standen (7,7 und 3,7 css). Der Unterschied
zwischen den beiden Fehlern ist gering, der zwischen ihren Folgen nicht: Eine zurückgerechnete Zahl
sieht wie eine Messung aus und **bestätigt jedes Modell, aus dem sie stammt**. Sie ist von einer
echten nicht zu unterscheiden — dieselbe Bauart wie die Zwischenfarbe in T-6.

**Die Auflage, die daraus folgt und die ich mir selbst gebe:** Neben jeder Zahl in diesem Papier
steht, **wer sie gemessen hat und woran**. Wo das nicht steht, ist sie gerechnet, und dann steht
die Rechnung dabei. Ein Papier, das beides gleich aussehen läßt, erzeugt B-22 wieder.

**B-23 — die Schranke war zur sicheren Seite falsch, und das ist kein kleiner Fehler.** Eine zu
strenge Schranke gilt leicht als die vorsichtige Wahl. Sie ist es nicht: Sie erklärt eine tragende
Fläche für zu kurz und liefert damit den Grund, eine Gestalt zu ändern, die in Ordnung ist. Der
Schaden einer falschen Schranke hängt nicht an ihrer Richtung, sondern daran, daß jemand nach ihr
handelt.
