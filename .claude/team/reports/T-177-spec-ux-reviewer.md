# T-177 — O-EF, O-EQ, O-EP, O-EL, O-ED, O-EG und die Form der Pflichtfeldmeldung

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md`, `docs/design/textbestand.md` (T-163), `docs/design/textabbau-gestalt.md`
(T-171), `.claude/team/decisions.md` (E-054, E-055, E-076, E-078, E-080, E-081, E-084),
`docs/bedrohungsmodell.md` (T-156-8), die Berichte T-165, T-167, T-168, T-169, T-171, T-172, und
der laufende Code.

---

## Kurzfassung

```
Aufgabe: T-177 — sechs Wortlautfragen und die Freigabe des Textdurchgangs
Status: braucht Review (Freigaben erteilt, ein blockierender Befund daneben)
```

**Freigegeben mit Auflagen: ST-05, UM-01, UM-03, O-EP (beide Abweichungen), O-EL, O-ED, O-EG.**
**Nacharbeit, blockierend: Z-16** — und sie hängt nicht am Textdurchgang, sondern an E-084.

---

## 0. Urteil in einer Tabelle

| Gegenstand | Urteil |
|---|---|
| **ST-05** Kanban-Aufklärung von elf auf zwei Stellen | **freigegeben mit fünf Auflagen** (Z-01 bis Z-05) |
| **UM-01** lange Feldhinweise zustandsgebunden | **freigegeben mit Auflage** — als **Regel**, nicht als Bauauftrag (Z-06) |
| **UM-03** Kanban-Abgrenzung nur am Board | **freigegeben mit drei Auflagen** (Z-07) |
| **UM-02** | **nicht Gegenstand.** E-081 Punkt 3 hat entschieden; ich hebe nichts auf |
| **UM-04** / O-EQ | **Auflage festgehalten** (Z-08). Kein Fehler im gebauten Zustand |
| **O-EP (a)** `http://` bleibt sichtbar | **trägt** (Z-09) |
| **O-EP (b)** Dateifall wird länger | **trägt** (Z-10) |
| **O-EL** „Diese Datei wird nicht geöffnet" | **trägt** (Z-11) |
| **O-ED** Arbeitsplatz | **„Arbeitsplatz" bleibt**, „Dieser Arbeitsplatz" fällt (Z-12) |
| **O-EG** Nachweis 18e am Quelltext | **trägt** mit einer Auflage (Z-13) |
| **E-084** Form der Pflichtfeldmeldung | **festgelegt** (P-1 bis P-7), dazu die gezählte Liste (Z-14 bis Z-16) |

---

## 1. O-EF — die drei Freigaben

### 1.0 Was ich zuerst gemessen habe, weil alles Weitere daran hängt

E-081 Punkt 4 sagt: Streichung und Ausgleich laufen in **einem** Auftrag. Eine Freigabe, die nur
die Streichung deckt, ist keine. Ich habe deshalb je Eintrag zuerst gefragt, ob der Ausgleich
**existiert**, und nicht, ob er versprochen ist.

**Für ST-05 existiert er, und er ist gemessen.** `RuleSummary` steht unter **jedem** Spaltenkopf,
nicht unter den meisten: `BoardScreen.tsx:677-683` reicht sie ohne Bedingung an
`KanbanColumn`, und `Kanban.tsx:390` zeichnet sie, sobald `rule` gesetzt ist. Sie hat sogar den
Fall ohne Bedingung mitgedacht (`emptyText="Ohne Bedingung — diese Spalte bleibt leer."`,
`BoardScreen.tsx:681`). Der Satz, den ST-05 streicht, wird also durch eine Fläche ersetzt, die es
gibt, nicht durch eine, die noch zu bauen wäre — die Bauaufträge aus T-171 (3.2 Trennlinie, 3.3
Farbe) machen sie lesbar, sie erzeugen sie nicht.

Das ist der Grund, aus dem ich ST-05 freigebe und nicht zurückweise.

---

### 1.1 ST-05 — **freigegeben mit fünf Auflagen**

**Was ich geprüft habe.** Die Aussage, die an elf Stellen steht, hängt an E-054, E-055, A-5.4,
S-2 (R-2) und W-14 (R-2a). Sie zerfällt in drei Fragen, und nur zwei davon stellt ein Benutzer:

| Frage | Wer sie stellt | Wo sie nach ST-05 beantwortet wird |
|---|---|---|
| „Warum lässt sich nichts ziehen, warum ist die Karte weg?" | wer vor dem Board sitzt | `BoardScreen.tsx:372`, `RULE_WHAT_MOVES_A_CARD` |
| „Was lege ich hier eigentlich an?" | wer eine Spalte einrichtet | `BoardScreen.tsx:1090`, `RULE_IS_A_RULE` |
| „Warum steht **diese** Karte **hier**?" | jeder, jeden Tag | `RuleSummary` je Spalte — spezifisch statt allgemein |

Die dritte Frage ist die häufigste, und der gestrichene Satz hat sie nie beantwortet. T-171
Abschnitt 3.1 hat damit recht: Elf allgemeine Sätze gegen eine spezifische Zeile je Spalte — die
spezifische gewinnt.

**A-5.2 („Todos lassen sich per Drag & Drop zwischen Status-Spalten verschieben") ist der einzige
Punkt, an dem die Streichung fachlich schaden könnte.** Die Anforderung ist durch E-054 überholt;
der einzige Ort, an dem die Anwendung dem Benutzer erklärt, warum sie sie nicht mehr erfüllt, ist
`RULE_WHAT_MOVES_A_CARD` am Board. **Deshalb bleibt dieser Satz genau dort und wird nicht gekürzt**
— er ist nach dem Raster von T-163 eine **Abwesenheit**, keine Erklärung des Sichtbaren. ST-05
lässt ihn stehen; das ist die Bedingung, unter der ich freigebe.

**Die fünf Auflagen:**

**Z-01 (blockierend für die Umsetzung von ST-05, von mir hier aufgelöst) — T-163 und T-171
widersprechen sich, und der Widerspruch fällt genau auf den Ausgleich.**
`docs/design/textbestand.md` ST-04 sagt: `StatusSettings.tsx:276` **entfällt**.
`docs/design/textabbau-gestalt.md` 3.6 sagt: sie entfällt **nicht** ersatzlos, sondern schrumpft
auf `description="Nicht die Spalten des Boards."`

**Entschieden: die geschrumpfte Fassung gilt.** Begründung, und sie ist nicht die von T-171:
„Status" ist das einzige Wort dieser Anwendung, das mit einem Begriff kollidiert, den derselbe
Benutzer im selben Kopf trägt. Wer nach den Statusspalten des Boards sucht, sucht sie in den
Einstellungen — und **eine Abwesenheit sieht man nicht**. Nach dem Raster von T-163 (Buchstabe
**A**) fällt ein solcher Satz nicht. Ohne diese dreißig Zeichen wäre ST-05 in den Einstellungen
eine Streichung ohne Ausgleich, also nach E-081 Punkt 4 nicht freigebbar. **Der Wortlaut ist
vorgelegt und angenommen: „Nicht die Spalten des Boards."** — sechs Wörter, Aussage, keine
Aufzählung. Er ist `Card.description` und damit nicht vertraglich (T-163 Abschnitt 6.1).

**Z-02 — der Wegweiser in `TodoFormDialog.tsx:235` bekommt keinen neuen Zeichensatz.**
T-163 schlägt „Einstellungen › Status" vor; T-171 F-2 hält dagegen, dass `›` in keinem
Oberflächentext von `apps/web` vorkommt. Beide haben die Frage offengelassen; sie liegt in meiner
Fläche, also entscheide ich sie. **Das Produkt hat die Form längst**, und zwar an zwei Stellen mit
demselben Gegenstand:

```
apps/web/src/screens/BoardScreen.tsx:985   „… richten Sie in den Einstellungen unter „Status“ ein."
apps/web/src/screens/BoardScreen.tsx:1232  „… in den Einstellungen unter …"
```

**Vorgegebener Wortlaut:** `hint="Die Werte stehen in den Einstellungen unter „Status“."`
52 Zeichen, eine Zeile bei 34 rem Dialogbreite (T-171 Punkt 3.7 Bedingung 2 erfüllt), kein neues
Zeichen, kein anklickbarer Verweis aus einem Dialog mit ungesicherten Eingaben heraus (T-171 3.7
Bedingung 1). Dass derselbe Halbsatz dann dreimal im Produkt steht, ist keine Verdopplung im Sinn
von E-078: Es sind drei verschiedene Flächen, die auf **denselben** Ort zeigen, und für einen
Wegweiser ist Gleichlaut der Zweck.

**Z-03 — Streichung und Ausgleich in einem Auftrag (E-081 Punkt 4).** Der Auftrag, der die vierzehn
Sätze streicht, trägt in demselben Zug:
- `.kcolumn__head { border-bottom: none; }` (T-171 3.2),
- `.rule-summary { color: var(--text-secondary); }` (T-171 3.3),
- `StatusSettings.tsx:276` → `„Nicht die Spalten des Boards."` (Z-01),
- den Wegweiser aus Z-02.

Eine Welle, in der zuerst gestrichen und danach ausgeglichen wird, gibt es nicht. Wird der Auftrag
geteilt, ist die Freigabe erloschen.

**Z-04 — `RULE_NOT_A_PLACE` fällt, und das ist gemessen.** Gesucht über den ganzen Baum
(`**/*.{ts,tsx}`): Aufrufer außerhalb der eigenen Definition und des `@link`-Kommentars: **keiner**
(`apps/web/src/lib/labels.ts:493`). Die Konstante fällt ersatzlos, mit ihr die Zeile `:486` im
Kopfkommentar. **Es gibt danach keine Kurzfassung des Satzes, und das muss so bleiben** — eine
Kurzfassung ist die Einladung, ihn wieder überall hinzuschreiben, wo der Platz für die lange fehlt.

**Z-05 — die Musterseite zieht nach, sie wird nicht gekürzt.** `showcase/BoardSection.tsx:291` und
`:295` benutzen `RULE_IS_A_RULE` und `RULE_WHAT_MOVES_A_CARD` als **Prüfdokumentation**; E-078 gilt
dort nicht (T-163 Geltungsbereich). Die Importe bleiben gültig, weil beide Konstanten bleiben —
aber die Zeile, die den Spaltenkopf zeigt, muss die neue Gestalt aus 3.2 und 3.3 mitzeigen, sonst
zeigt die Musterseite ein Produkt, das es nicht mehr gibt.

**Was ich an ST-05 ausdrücklich nicht freigebe:** die vier Dinge aus T-171 Abschnitt 3.10 (keine
Beschneidung der Regelzeile, der leere Ordner bleibt am Chip, die Regel kommt **nicht** in den
`aria-label` der Spalte, kein Griffsymbol). Sie sind Teil der Auflage, nicht Beiwerk.

---

### 1.2 UM-01 — **freigegeben mit Auflage, als Regel und nicht als Bauauftrag**

**Der Eintrag hat keinen Gegenstand mehr. Gemessen, nicht vermutet.** T-163 nennt drei betroffene
Stellen. Alle drei sind heute schon zustandsgebunden:

| Genannte Stelle | Stand | Beleg |
|---|---|---|
| `labels.ts:348-351` `POOL_MATCH_MODE_HINT` | bereits gebaut, und die Bauart ist entschieden | E-081 Punkt 3, `RadioRow.tsx:145-154` |
| `SettingsScreen.tsx:627-631` Standard-Tags | **wechselt bereits mit dem Zustand** — zwei Zweige über `value.length === 0` | `apps/web/src/screens/SettingsScreen.tsx:627-631` |
| `PoolFormDialog.tsx:646-649` `StatusPicker` | **wechselt bereits mit dem Zustand** — zwei Zweige über `statusIds.length === 0` | `apps/web/src/screens/PoolFormDialog.tsx:646-650` |

Und die Gegenprobe: Ich habe alle dauerhaft sichtbaren Feldhinweise ab 60 Zeichen in
`apps/web/src` (ohne `showcase`) durchgesehen. Elf Stück. Jeder einzelne ist entweder eine
**Form- oder Grenzangabe** und bleibt nach UM-01s **eigener** Regel dauerhaft
(`ExportDirectoryField.tsx:407`, `TodoFormDialog.tsx:206`, `Attachments.tsx:469`, `:511`,
`PoolFormDialog.tsx:596`, `BoardScreen.tsx:379`), oder er steht auf der Sperrliste
(`TodoListScreen.tsx:504` SP-03, `TodoFormDialog.tsx:227` SP-04), oder er ist bereits in einer
anderen Streichliste (`SettingsScreen.tsx:320` ST-06, `TodoFormDialog.tsx:235` ST-05), oder er ist
eine Abwesenheit, die T-163 selbst stehen lässt (`SettingsScreen.tsx:331`).

**Z-06 — die Auflage.** UM-01 ist freigegeben als **Regel für neue und für künftig geänderte
Hinweise**, mit vier Sätzen, die ich hier verbindlich mache:

1. **Form- und Grenzangaben stehen dauerhaft.** Sie werden beim Ausfüllen gebraucht (SC 3.3.2).
2. **Folge-, Abwesenheits- und Widerspruchsangaben stehen in ihrem Zustand.**
3. **Verschwindet ein Hinweis aus dem Blickfeld, verschwindet er auch aus `aria-describedby`** —
   über `hint={undefined}`, **nie** über `display:none`, `visibility:hidden` oder `opacity:0`
   (E-078 Nachtrag 8; die Bauart trägt das bereits, `FormDialog.tsx:246` und `:271` hängen am
   selben Ausdruck).
4. **`RadioRow` wird nicht angeglichen** — weder durch Entfernen der verborgenen Sätze noch durch
   Sichtbarmachen aller. Das ist E-081 Punkte 1 und 2, und es gilt auch für ein neues
   Bedienelement, das dieselbe Bauart haben will: das braucht dieselbe Prüfung.

**Als Bauauftrag ist UM-01 leer, und das ist ein zulässiger Abschluss.** Findet frontend-dev keine
Stelle, wird UM-01 als „nichts zu tun" geschlossen — kein Fehlschlag, sondern das Ergebnis der
Messung. **Wer doch eine Stelle umbaut, nennt sie im Auftrag beim Namen und misst vorher U-4**
(T-171 4.1: bei 1280x720 und 1024x640 messen, ob der Formularkörper schon scrollt; tut er es
nicht, ist B1 die einzige zulässige Bauform). Ein Umbau an einer ungenannten Stelle ist von dieser
Freigabe nicht gedeckt.

---

### 1.3 UM-03 — **freigegeben mit drei Auflagen**

**Die Prämisse des Eintrags stimmt nach ST-05 nicht mehr, und das gehört gesagt, bevor jemand
danach baut.** UM-03 sagt: Was an die Stelle des Kastens tritt, ist „der bereits vorhandene
Leerzustand am Board (`BoardScreen.tsx:967`): Solange keine Spalte eingerichtet ist, steht die
Erklärung dort." **ST-05 nimmt genau diese Erklärung aus `:967` heraus** — übrig bleibt „Sie
richten die Spalten selbst ein. Takt erfindet keine.", also die Abwesenheit, nicht die Definition.
Wörtlich gelesen wäre UM-03 damit eine Streichung, deren Ausgleich mit demselben Federstrich
weggekürzt wird. Das ist E-081 Punkt 4 in Reinform, und es wäre ein Ablehnungsgrund.

**Es ist aber keiner, weil der Träger woanders steht und ich ihn nachgemessen habe.** Der
Board-Leerzustand trägt als **Primäraktion** „Erste Spalte einrichten"
(`BoardScreen.tsx:968-972`), und dieser Knopf öffnet den Einrichtungsdialog, in dem nach ST-05
`RULE_IS_A_RULE` steht (`BoardScreen.tsx:1090`). **Die Definition ist vom leeren Board einen Klick
entfernt, an der Stelle, an der sie gebraucht wird — beim Erzeugen.** Das ist die bessere Lösung
als ein Absatz im Leerzustand, und sie ist gebaut.

**Z-07 — die drei Auflagen:**

1. **Diese Kette ist Teil der Freigabe.** Fällt der Knopf „Erste Spalte einrichten" aus dem
   Leerzustand, oder verliert der Einrichtungsdialog `RULE_IS_A_RULE`, ist UM-03 zurückgenommen.
   Wer eines von beiden ändert, legt es erneut vor.
2. **Die Einstellungen bekommen keinen Ersatzkasten** (T-171 4.8) — aber sie schweigen auch nicht
   ganz: Die dreißig Zeichen aus Z-01 sind der Rest, und sie sind der einzige. Ein zweiter
   Erklärkasten, kleiner oder anders getönt, ist von dieser Freigabe ausdrücklich **nicht** gedeckt.
3. **Der dritte Träger (T3) existiert und ist gemessen.** `docs/benutzerhandbuch.md:221` sagt
   bereits: „Eine Spalte des Kanban-Boards ist dieselbe Sache wie ein Pool: eine Regel mit
   denselben fünf …". UM-03 nennt das Handbuch als Träger; ein Träger, den es nicht gäbe, wäre
   keiner. Er ist da. **documenter zieht nach**, wo der Wortlaut der Oberfläche zitiert wird.

**Die beiden Navigationsknöpfe im Kasten fallen mit** (`StatusSettings.tsx:297-304`, „Zum
Kanban-Board", „Zur Todo-Liste"). Das ist gedeckt: T-163 Regel S-11 („Ein Erklärkasten enthält
keine Navigationsknöpfe in andere Ansichten"), und das Board ist ein Punkt der Hauptnavigation und
jederzeit sichtbar (A-14, `docs/spec.md:270`). Ein zweiter Weg dorthin, versteckt in einer
Erklärung, ist kein Weg.

---

### 1.4 Was diese Freigabe **nicht** deckt

Damit niemand sie als Blankett liest. T-163 Abschnitt 9 (Welle X+3) listet zehn Einträge, die
meine Zustimmung brauchen. **Vorgelegt und entschieden sind heute drei.** Offen und ausdrücklich
**nicht** freigegeben bleiben:

`ST-06` (Zeilen `TodoFormDialog.tsx:247/248` und `TodoListScreen.tsx:653-654` — die zweite berührt
den Pflichtflow „Timer auf erledigtem Todo", A-2.5/I-05), `ST-08` (Zeilen `PoolFormDialog.tsx:437,
555, 578, 619`), `UM-05`, `UM-07`, die Kürzung von `SP-09`, und `ST-03` Zeile `labels.ts:438` (die
habe ich zur Kenntnis genommen: die Klammer fällt, der Satz bleibt — SP-15, keine erneute Vorlage
nötig).

---

## 2. O-EQ — der Träger hat sich geändert, und UM-04 ist anders zu bauen

**Z-08.** T-172 hat gemessen, was T-163 als offene Frage 3 formuliert hatte, und die Antwort ist
schärfer als die Frage: Der gesperrte Löschen-Knopf steht **nicht** in der Tabulatorreihenfolge
(gemessen: Fokus springt von der Begründungsfläche direkt in die nächste Zeile,
`.claude/team/reports/T-172-visual-qa.md:189-202`). Sein `aria-describedby`-Inhalt erreicht damit
niemanden, der über die Tabulatortaste navigiert.

**Ich halte als Auflage fest, und sie steht über UM-04:**

> Der sichtbare Begründungstext `apps/web/src/screens/StatusSettings.tsx:568-596`
> (`className="status-admin__blocked"`, `id={reasonId}`) ist der **Träger** der Sperrbegründung,
> nicht der Knopf. Er ist im Textdurchgang **kein Vorratskasten** und fällt unter keine der drei
> Streichfragen (D, S, V): Er erscheint ausschließlich, wenn `blockers.length > 0`
> (`StatusSettings.tsx:533, 568`), ist also bereits Träger T1, und er spricht eine **Absage mit
> Begründung** aus (Buchstabe B, SP-19). Er wird nicht gekürzt, nicht zusammengefasst, nicht in
> eine `aria-describedby`-Beschreibung am Knopf überführt und nicht in ein Titelattribut verlegt.

**UM-04 ist damit nicht falsch, aber seine Begründung war es.** Der Eintrag sagt, die Regeln
„stehen bereits am richtigen Ort … als `disabledReason` an dem Knopf, den sie sperren". Sie stehen
am richtigen Ort — aber als **sichtbarer Fließtext neben** dem Knopf, nicht am Knopf. Der Umbau
besteht deshalb allein darin, dass der Vorratskasten `StatusSettings.tsx:372-385` fällt und nichts
an seine Stelle tritt (T-171 4.4). **So gebaut trägt UM-04. Anders gebaut nimmt er die einzige
nachweislich erreichbare Quelle weg.**

**Ein Restbefund, der aus derselben Messung folgt und den T-172 nicht nennen konnte, weil er den
gemessenen Fall verlässt.** Die Begründungsfläche enthält nur dann ein per Tabulator erreichbares
Element, wenn Todos in dem Status stehen: der Knopf „Diese N Todos anzeigen" hängt an
`typeof count === "number" && count > 0` (`StatusSettings.tsx:583`). **Ein Status, der nur wegen
„letzter Status" oder wegen „Standard für neue Todos" gesperrt ist, hat in dieser Zone kein
fokussierbares Element** — dann ist der Grund nur im linearen Lesefluss erreichbar, nicht über den
Tabulator. Das ist kein Neubau, den ich verlange, und nichts, was UM-04 aufhält; es ist der
nächste Schritt, wenn jemand ihn tun will, und der Bestand kennt das Mittel bereits:
`Menu.tsx` benutzt für denselben Zweck `aria-disabled` statt `disabled` (T-172 Messung 5). **An
den Orchestrator als eigene Aufgabe, nicht an diese Welle.**

---

## 3. O-EP — die zwei Abweichungen von X-04

Beide tragen. Beide waren gut begründet, und in einem Punkt ist die Abweichung **besser** als meine
eigene Auflage.

### 3.1 (a) `http://` bleibt sichtbar — **trägt, Z-09**

**Meine Auflage 1 zu X-04 war zu grob, und der Grund steht im Bedrohungsmodell, nicht im
Textbestand.** Ich hatte geschrieben: „Das Schema fällt weg … es gibt ohnehin nur `http` und
`https`". Der zweite Halbsatz ist genau der Fehler: Weil es zwei gibt, unterscheidet das Schema —
und zwar an der einzigen Stelle, an der die Unterscheidung etwas kostet.

Zwei Gründe, beide nachgeprüft:

1. **Umkehrbarkeit.** Fiele auch `http://`, bekämen `http://a/b` und `https://a/b` dieselbe
   Beschriftung. Das ist derselbe Befund, den X-04 schließen sollte, eine Ebene tiefer — und er
   hinge wieder am zugänglichen Namen des **Entfernen**-Knopfes (`Attachments.tsx:284`).
2. **`docs/bedrohungsmodell.md:5236` (T-156-8) beschreibt genau die Verkürzung als Hinweis:**
   „… die Verkürzung nimmt genau das Stück weg, an dem man eine Herabstufung sähe." Bei einem
   Verweis fragt Takt nicht zurück (A-A-7, richtig so), die Liste ist die ganze Anzeige vor dem
   Klick. Meine Auflage hätte einen Hinweis des Bedrohungsmodells verfestigt.

**Der Preis ist gemessen und klein:** sieben Zeichen, und nur am selteneren Schema. `https://`
fällt weiter weg, weil es an jedem zweiten Anhang gleich lautet.

**Auflage:** `docs/bedrohungsmodell.md` T-156-8 beschreibt einen Zustand, den es nicht mehr gibt.
**An security-checker: den Hinweis schließen oder auf den verbleibenden Rest umschreiben** (die
zweite Zeile der Anhangkarte trägt weiterhin den vollen Wert; das Schema steht jetzt auch in der
ersten). Ein Hinweis, der einen behobenen Zustand beschreibt, wird beim nächsten Lesen für offen
gehalten.

### 3.2 (b) Der Dateifall wird länger — **trägt, Z-10**

**Die Abweichung ist richtig, und meine ursprüngliche Aussage war es nur für den Einzelfall.** Ich
hatte geschrieben, bei der Datei sei die Wahl des letzten Stücks richtig, „das letzte Stück ist
das unterscheidende". Das gilt für **eine** Datei. Der Befund X-04 handelte aber von einer
**Liste**, und zwei Kundenordner mit je einer `rechnung.pdf` ergeben denselben Befund wie drei
Ticketverweise auf denselben Wirt: zwei Knöpfe „Datei entfernen: „rechnung.pdf"", von denen einer
den falschen Anhang löscht (SC 2.4.6). Ein Auftrag, dessen Bedingung „zwei verschiedene Anhänge nie
dieselbe Beschriftung" lautet, kann diesen Fall nicht auslassen.

**Die Bauform ist die richtige, und zwar aus einem Grund, der geprüft gehört:** Der Name steht
**vorn**, der Ordner in Klammern dahinter (`packages/domain/src/attachment.ts:737, 759-765`).
`truncate` schneidet hinten ab, eine Vorlesehilfe liest vorn zuerst — das Unterscheidende bleibt
in beiden Kanälen zuerst. Hätte domain-dev den vollen Pfad vorangestellt, wäre es genau die Falle
gewesen, die ich der Verweiszeile vorgeworfen habe.

**Drei Auflagen:**

1. **Der Ordner steht jetzt auch in Meldung und Rückfrage.** `Attachments.tsx:607` (Toast-Rumpf)
   und `:700` (`ConfirmDialog.consequence`) bauen ihren Text aus `attachmentLabel`. Beide bleiben
   innerhalb ihrer Regel (S-13: ein Satz; `consequence` hat keine Längengrenze) — **zu prüfen ist
   nur, dass der Toast-Rumpf ein Satz bleibt**, wenn der Pfad lang ist. Kein Neubau, eine Messung.
2. **Das Auge bekommt den Zuwachs nicht.** `.attachment__label` trägt `truncate`; für den Verweis
   bleibt der Befund fürs Auge offen (domain-dev Risiko 1, richtig gemeldet). Das ist eine Frage
   der Darstellung und liegt bei ui-designer/frontend-dev — **kein Bauauftrag aus dieser Freigabe**,
   aber es gehört auf die Liste, nicht in einen Bericht.
3. **Die zwei roten Prüffälle sind das Ergebnis, nicht der Schaden.**
   `packages/domain/test/attachment.test.ts:528` und `:540` messen die alte Antwort. **An
   unit-tester:** umschreiben, und der Fall, der wirklich zählt, ist der über die
   **Unterscheidbarkeit** (drei Verweise auf denselben Wirt und zwei gleichnamige Dateien in zwei
   Ordnern ergeben fünf verschiedene Beschriftungen), nicht der über die Zeichenkette. Wer die
   alte Erwartung wiederherstellt, nimmt X-04 zurück.

**Kein neues Sicherheitsthema.** Der Wert ist die Normalform (A-A-3), unsichtbare Zeichen sind an
der Tür abgewiesen, die Anzeige führt ihn durch `<Foreign>`/`visibleText` (E-063), und der volle
Pfad stand ohnehin in der zweiten Zeile und in der Rückfrage (A-A-6). Ich habe zusätzlich
nachgesehen, wohin `attachmentLabel` sonst fließt: Zeile, Vorschau-`alt`, Toast,
Bestätigungsdialog. **Kein Export, kein Protokoll** — A-19.17 bleibt unberührt.

---

## 4. O-EL — trägt „Diese Datei wird nicht geöffnet"?

**Ja, Z-11.** Gemessen an Regel S-12 (Dialogtitel) und an dem, was der Zustand ist.

| Prüfpunkt | Befund |
|---|---|
| Aussage statt Frage, höchstens sechs Wörter (S-12) | fünf Wörter, Aussage |
| Kein „Fehler", kein Code (S-10) | erfüllt |
| Wechselt der Dialog die Rolle, wechselt der Titel mit (S-12, Vorbild `StatusSettings.tsx:407`) | genau das geschieht |
| Reihe statt Einzelfall | „Diese Datei wird geöffnet" / „… wird ausgeführt" / „… wird **nicht** geöffnet" — dieselbe Satzform, ein Wort Unterschied. Der Benutzer vergleicht Kopfzeilen; das ist die billigste Auskunft, die es gibt |
| Spricht eine **Abwesenheit** aus (Buchstabe A) | ja, und sie ist der Inhalt des Zustands |

**Die eine Sorge, die ich geprüft habe und die sich auflöst:** „wird nicht geöffnet" könnte als
Störungsmeldung gelesen werden („hat gerade nicht geklappt") statt als Regel („Takt öffnet solche
Dateien nicht"). Der Rumpf beseitigt das im nächsten Atemzug, weil er **die Regel** nennt und nicht
den Fehlschlag: „Diese Datei ist eine Verknüpfung. Ihr Ziel steht woanders — die Rückfrage könnte
darüber nicht die Wahrheit sagen, deshalb öffnet Takt sie nicht."
(`Attachments.tsx:127-128`), beziehungsweise „… Takt öffnet ihn deshalb nicht." (`:125-126`). Dazu
kommt, dass **kein Öffnen-Knopf** dasteht (`AttachmentOpenDialog.tsx:364-367`) — eine Störung ließe
einen Wiederversuch da.

**Drei Auflagen:**

1. **Der Titel bleibt in der Reihe.** Wird eine vierte Ausprägung nötig, trägt sie dieselbe
   Satzform. Ein Titel wie „Öffnen nicht möglich" oder „Das hat nicht geklappt" ist ausdrücklich
   **verboten**: Er meldet einen Fehlschlag, wo eine Regel gilt.
2. **„Schließen" statt „Abbrechen" bleibt** (`:365`). Es gibt nichts abzubrechen; die Begründung
   von frontend-dev (Annahme 3) ist die richtige.
3. **Der Wirkungssatz entfällt in diesem Zustand und in keinem anderen.** Er steht in beiden
   übrigen Zuständen wortgleich (`:292-296`). Das ist keine Streichung im Sinn von E-078 Punkt 3 —
   der Satz wäre hier schlicht falsch, weil Takt nichts übergibt. **SP-01 bleibt damit
   unangetastet**, und ich bestätige das ausdrücklich, damit es nicht als Präzedenzfall für eine
   Kürzung von SP-01 gelesen wird.

**Ein Hinweis ohne Auflage, an ui-designer:** Im gesperrten Zustand trägt das Symbol
`dialog__icon--danger`, der Dialog aber nicht `dialog--danger` (`:262, 265`). Das ist stimmig —
gefährlich ist der Anhang, nicht der Ausgang —, aber es ist die einzige Stelle, an der Symbol und
Rahmen auseinandergehen. Wenn jemand das „aufräumt", soll er die Richtung kennen: **Der Rahmen
bleibt ruhig, das Symbol warnt.**

---

## 5. O-ED — „Arbeitsplatz" oder „Dieser Arbeitsplatz"

**Z-12. Entschieden: „Arbeitsplatz" bleibt. Der Kartentitel `„Dieser Arbeitsplatz"` wird zu
`„Arbeitsplatz"`.**

**Der Bestand, gemessen:**

```
apps/web/src/screens/SettingsScreen.tsx:167   label: "Arbeitsplatz"          (Schiene, aria-current)
apps/web/src/screens/SettingsScreen.tsx:558   title="Dieser Arbeitsplatz"    (Card.title)
```

**Vier Gründe, und der zweite trägt allein:**

1. **Die Schiene darf nicht weichen.** Regel S-01: ein Substantiv, höchstens zwei Wörter, **ohne
   Artikel**. „Dieser Arbeitsplatz" verstieße gegen die eigene Regel des Textbestands, und die
   Schiene trägt zugleich `aria-current="page"` — sie ist die Fläche, die nach ST-04 als einzige
   den gewählten Bereich zeigt, bevor man den Kartentitel liest (T-171 1.2).
2. **Nach ST-04 ist der Kartentitel die Bereichsüberschrift.** Ein Deiktikum in einer Überschrift
   ist im Kopf des Lesers ein zweiter Gegenstand. Solange darüber ein `AREA_LEAD` stand, der von
   etwas anderem sprach, hatte „Dieser" eine Aufgabe; nach ST-04 hat es keine mehr.
3. **Die Verdopplung ist schon aus der Oberfläche in die Dokumentation gelaufen**, und das ist der
   Beleg dafür, dass die zwei Namen verwirren und nicht nur doppeln:
   `docs/benutzerhandbuch.md:558` schreibt **„Bereich „Dieser Arbeitsplatz""** — der *Bereich*
   heißt „Arbeitsplatz", die *Karte* heißt „Dieser Arbeitsplatz". Das Handbuch hat beide zu einem
   Ding verschmolzen, weil es zwei Namen für eines gab.
4. **Was „Dieser" trug, geht nicht verloren.** Dass es um **diesen** Rechner geht und nicht um
   Arbeitsplätze überhaupt, sagen nach ST-04 die Kartenbeschreibung („Meldet der Dienst. Hier nicht
   änderbar.") und die zwei Werte selbst (Windows-Benutzername, Ablageort).

**Auflagen:**

- **Es ist ein zugänglicher Name** (`Card.title` wird als Überschrift gezeichnet). E-076 Punkt 3
  gilt: **zusammen mit unit-tester und e2e-tester**. Gemessen habe ich, dass es heute leichtfällt:
  Weder „Arbeitsplatz" noch „Dieser Arbeitsplatz" kommt in `tests/**` oder in `apps/*/test/**`
  vor — **kein einziger Treffer**. Das entbindet nicht von der Regel, es senkt nur den Preis.
- **Zwei Stellen ziehen nach:** `apps/web/src/showcase/WorkstationSection.tsx:135`
  (`title="Dieser Arbeitsplatz (S-09)"`, Musterseite, frontend-dev) und
  `docs/benutzerhandbuch.md:558` (documenter, und dabei ist der Satz zugleich zu berichtigen:
  es ist der **Bereich** „Arbeitsplatz").
- **Der Schienenzusatz bleibt** und wird nach ST-04 auf „Abrechnungsname, Ablageort, Meldungen"
  gebracht. Er ist unter 60 rem ausgeblendet (T-171 1.3) und trägt deshalb keine Aussage, die nur
  dort steht — trifft hier zu, alle drei Wörter stehen auch in der Karte.

---

## 6. O-EG — die Form des Nachweises 18e

**Z-13. Fachlich trägt der Quelltext, und für A-19.2 ist er sogar die schärfere Messung. Ein
Vite-Lauf in `proof:addin` ist fachlich nicht nötig.** Drei Gründe, in dieser Reihenfolge:

1. **Was gemessen werden soll, ist eine Abwesenheit.** A-19.2 verbietet drei Wörter „in der
   Oberfläche". Bei einer Abwesenheit ist die **größere** Menge die schärfere: Der Quelltext
   enthält auch, was ein Bündel wegoptimiert. Ein Wort, das in einem toten Zweig steht, wird vom
   Quelltextlauf gefunden und vom Bündellauf nicht — und es ist genau das Wort, das beim nächsten
   Aktivieren des Zweigs auf dem Bildschirm steht. **Für eine Abwesenheitsprüfung ist der falsche
   Alarm die richtige Richtung.**
2. **Ein Nachweis, der still überspringt, ist der Fehler, den dieses Vorhaben zweimal benannt hat.**
   `proof:all` läuft vor `build`. Ein Abschnitt, der `dist` liest und es nicht findet, wird grün,
   ohne etwas gesehen zu haben — dieselbe Klasse wie O-BU und O-CI. Ein vorhandenes `dist` von
   gestern ist die zweite Variante desselben Fehlers, und sie ist schlimmer, weil sie nicht einmal
   auffällt.
3. **Die Gegenprobe ist da, und sie ist die Hälfte, an der es sonst scheitert.**
   `proof-addin.mjs:5074` misst mit **demselben Sucher über dieselbe Menge**, dass „Frist"
   **vorkommt** und dass `label="Frist"` steht. Ohne sie wäre der Abschnitt am grünsten, wenn es
   das Feld gar nicht gäbe. Dazu die Mutationsprobe aus T-169 (`label="Frist"` → `label="Deadline"`
   macht beide Hälften rot). Das ist mehr Beweis, als ein `dist`-Lauf ohne Gegenprobe hätte.

**Das Manifest ist richtig danebengelegt** (`proof-addin.mjs:5036-5040`): `DisplayName` steht in
Outlook auf dem Bildschirm, ohne je durch ein Bündel zu laufen. Ein reiner `dist`-Lauf hätte diese
Fläche gar nicht gesehen.

**Die eine Auflage, und sie ist der Preis der gewählten Form.** Die gemessene Menge ist
`apps/outlook-addin/src/**/*.{ts,tsx,css,html}` plus `index.html` plus `manifest.xml`
(`proof-addin.mjs:263-275, 5030-5043`). **Ein Text, der aus `@takt/domain` oder `packages/export`
stammt und im Aufgabenbereich auf dem Bildschirm landet, liegt außerhalb dieser Menge** — im
Bündel läge er drin. Das ist die einzige Richtung, in der der Quelltextlauf **weniger** sieht als
der Bündellauf, und der Aufgabenbereich liest die Domäne tatsächlich (`office/mail.ts` holt
`MAX_TITLE_CHARACTERS`, `poolMovementSentence` kommt von dort).

Gemessen: In `packages/**` kommt heute keines der drei Wörter vor (Suche ohne Rücksicht auf Groß-
und Kleinschreibung: **kein Treffer**). Der Zustand ist also richtig — und **nicht gemessen**, was
in diesem Vorhaben derselbe Satz ist wie in T-156-4.

> **Auflage an integration-dev (klein, eine Zeile):** Der Kopfkommentar von 18e nennt die Grenze
> ausdrücklich — „gemessen wird der Aufgabenbereich; Text, der über `@takt/domain` hereinkommt,
> liegt außerhalb". Wer die Grenze aufheben will, nimmt die Dateien der Domäne in `sichtbareTexte()`
> auf; das ist billiger als ein Vite-Lauf und trifft dieselbe Lücke.

**An den Orchestrator:** Die Frage nach der Laufzeit des Tors stellt sich damit nicht. Ich verlange
keinen Bau in `proof:addin`.

---

## 7. E-084 — die Form einer Pflichtfeldmeldung in Takt

E-084 Punkt 2 sagt: Jedes `required`-Feld braucht seine eigene Prüfung, **bevor** ihm die des
Browsers genommen wird, und die Liste wird **gezählt**, nicht geschätzt. Ich habe sie gezählt; sie
steht in 7.2. Zuerst die Form, damit frontend-dev sie beim Bauen zur Hand hat.

### 7.1 Die Form — P-1 bis P-7, verbindlich

**P-1 — Ein Satz. Höchstens 60 Zeichen. Mit Punkt.**
Kürzer als der dauerhafte Feldhinweis (S-05: 80 Zeichen), weil eine Meldung unter Druck gelesen
wird. Kein Ausrufezeichen, kein „Bitte", kein „Sie müssen".

**P-2 — Das erste Wort ist die Beschriftung des Feldes, wörtlich.**
Nicht Kosmetik, sondern die Bedingung dafür, dass die Meldung trägt: Sie landet in einer
`role="alert"`-Region (`FormDialog.tsx:280-286`) und wird **angesagt**, während der Dialog schon
steht (B-5, SC 4.1.3). Wer sie hört und nicht sieht, hat ohne den Feldnamen keinen Bezug — und bei
zwei gleichzeitig ungültigen Feldern hat ihn auch niemand, der sieht. Beispiel: „Titel …",
„Name …", „Ende …".

**P-3 — Sie nennt, was fehlt, nicht, was schiefging.**
Das ist der Unterschied, um den es geht: „Das Anlegen ist fehlgeschlagen" nennt den Vorgang,
„Titel fehlt." nennt das Fehlende — und weil es genau eine Reparatur gibt und das Feld danebensteht,
**ist das Fehlende zugleich die Handlung**. Grundform:

> **`„<Feldbeschriftung> fehlt."`**

Ohne Anrede (E-080 Punkt 4: „Die beste Anrede ist keine"), ohne Befehl, ohne „erforderlich",
ohne „Pflichtfeld" im Satz (das steht bereits am Etikett, `ConfirmDialog.tsx:165-167`).

**P-4 — Ein zweiter Halbsatz nur, wenn die Pflicht selbst nicht selbsterklärend ist — und er nennt
die Folge, nie den Fehler.**
Höchstens **einmal je Formular**. Muster:

> **`„Titel fehlt — ohne ihn lässt sich das Todo nicht wiederfinden."`** (58 Zeichen)

Damit bleibt der Inhalt der heutigen Sätze erhalten und wandert nur hinter den Feldnamen.

**P-5 — Bei einem Wert, der da ist, aber nicht stimmt, nennt der Satz die **eine** verletzte Regel.**
Muster: `„<Feldbeschriftung>: <Regel>."` — nie eine Aufzählung, nie zwei Regeln in einem Satz. Das
Vorbild steht bereits im Bestand (`StatusSettings.tsx:764`, Doppelname) und im Aufgabenbereich
(`apps/outlook-addin/src/ui/create-gate.ts:73-79`, fünf Gründe, je ein Satz).

**P-6 — Sie erscheint nach dem Verlassen des Feldes oder nach dem Absenden, nie beim ersten
Zeichen** (SC 3.3.1). `TextField` trägt seit T-167 ein `onBlur` genau dafür
(`FormDialog.tsx:195`, `Attachments.tsx`). Sie verschwindet, sobald der Wert steht — **sichtbar und
im Baum zugleich** (E-078 Nachtrag 8): über `error={undefined}`, nie über CSS.

**P-7 — Der Absendeknopf ist nie gleichzeitig gesperrt und stumm.**
Ein `submitDisabled` ohne sichtbaren Grund ist eine stumme Tür — dieselbe Klasse wie SP-19 und
genau der Defekt, den T-167 an den Anhängen behoben hat (O-DZ). Wer `submitDisabled` setzt, setzt
im selben Ausdruck die Begründung; das Add-in hat dafür seit T-169 die Bauform
(`create-gate.ts`: „`blocked` ist genau dann wahr, wenn `reason` dasteht").

**Und die Regel über der Regel, aus E-081 Punkt 4 sinngemäß:** `noValidate` und die eigene Meldung
gehen in **einem** Auftrag. Ein Auftrag, der nur `noValidate` setzt, entfernt eine Meldung, statt
eine zu verbessern.

### 7.2 Die gezählte Liste (E-084 Punkt 2)

Gemessen über `apps/web/src/**` ohne `showcase`. **Fünfzehn `required`-Vorkommen im Produktcode,
davon neun ohne eigene Meldung für den leeren Fall.**

| # | Ort | Sperrt der Knopf? | Eigene Meldung bei leer? |
|---|---|---|---|
| 1 | `screens/TodoFormDialog.tsx:195` Titel | nein | **ja** — `:91-92` |
| 2 | `screens/BookingDialogs.tsx:172` Anfang | nein | **ja** — `:103` |
| 3 | `screens/BookingDialogs.tsx:180` Ende | nein | **ja, aber am falschen Feld** — Z-14 |
| 4 | `components/Attachments.tsx:466`/`:479` Wert | `:433` | **ja** — seit T-167 (`onBlur`, `touched`) |
| 5 | `screens/PoolRenameDialog.tsx:242` Name | `:229` | **ja** — `fieldError` |
| 6 | `screens/TemplatesScreen.tsx:575` Name | — | **ja** — `:579` |
| 7 | `screens/TagsScreen.tsx:351` Name (neuer Tag) | `:338` | **nein** |
| 8 | `screens/TagsScreen.tsx:373` Name (neuer Ordner) | `:360` | **nein** |
| 9 | `screens/TagsScreen.tsx:398` Name (umbenennen) | `:381` | **nein** |
| 10 | `screens/PoolFormDialog.tsx:520` Name | `:439` | **nein** |
| 11 | `screens/TemplatesScreen.tsx:721` Name der Kopie | `:710` | **nein** |
| 12 | `screens/StatusSettings.tsx:760` Name | `:731` | **nein** — nur der Doppelname hat einen Satz (`:764`) |
| 13 | `components/ConfirmDialog.tsx:175` Begründung | `:102-104` | **nein — und es gibt keine Fläche dafür.** Z-16 |

**Z-14 — die Meldung an der falschen Stelle.** `BookingDialogs.tsx:103` setzt
„Anfang und Ende müssen beide gesetzt sein." und hängt sie über `fieldError` **nur** an das Feld
„Anfang" (`:173`). Ist „Anfang" gefüllt und „Ende" leer, steht der Tadel unter dem richtigen Wert.
Das ist SC 3.3.1 („the item that is in error is identified") nicht erfüllt, und es ist das einzige
Formular dieser Liste, das ohne `submitDisabled` absendet — also das einzige, an dem `noValidate`
heute wirklich etwas wegnähme.
**Vorschlag, nach P-2 und P-3:** je Feld ein eigener Satz, „Anfang fehlt." beziehungsweise
„Ende fehlt.", und der gemeinsame Satz entfällt.

**Z-15 — sechs stumme Türen.** Die Zeilen 7 bis 12 sperren den Absendeknopf bei leerem Pflichtfeld
und sagen nicht, warum. `noValidate` nimmt ihnen nichts weg (abgesendet wird ohnehin nicht), aber
P-7 ist dort heute verletzt, und die Liste aus E-084 Punkt 2 ist genau diese.
**Vorschlag:** Grundform aus P-3, ein Satz je Feld, im selben Auftrag wie `noValidate`. Fünf davon
heißen „Name" — dann heißt die Meldung fünfmal „Name fehlt.", und das ist richtig so: derselbe
Fall, dasselbe Wort.

**Z-16 — blockierend. `ConfirmDialog`s Pflicht-Begründung hat keine Meldefläche, und sie steht im
Fluss, der die Doppelabrechnung bewacht.**
`components/ConfirmDialog.tsx:170-178` zeichnet ein `<textarea required={reasonRequired}>` **ohne
`<form>` darum** — die Prüfung des Browsers greift dort also nie, `noValidate` ändert nichts, und
eine eigene Meldung gibt es nicht. Sichtbar ist allein ein gesperrter Bestätigungsknopf
(`:200`, `blocked` aus `:102-104`). Der Baustein hat für die **Absage des Dienstes** eine
vorbildliche, dauerhaft im Baum stehende Live-Region (SP-06, G-10) — für die **eigene** Absage
hat er keine.

Das ist der Fluss aus E-012 und R-10: Wer einen Exportstatus zurücksetzt, muss eine Begründung
schreiben (`reasonLabel`, „`ZuruecksetzenAntrag.grund`"). Ein Benutzer, der die Begründung
vergisst, sieht einen toten Knopf und keinen Satz — in dem einen Dialog des Produkts, hinter dem
Geld liegt.
**Vorschlag:** dieselbe Bauform wie `TextField` — eine `role="alert"`-Fläche unter dem Feld, die
**immer** im Baum steht, und der Satz nach P-2/P-3, gesetzt bei `blur` oder beim Klick auf den
gesperrten Knopf. Alternativ die Fassung aus `create-gate.ts`: Begründung sichtbar unter dem Knopf,
`blocked` und `reason` aus einem Ausdruck.
**Warum blockierend:** E-084 Punkt 2 verlangt die eigene Prüfung, bevor die des Browsers genommen
wird. Hier ist die des Browsers nie da gewesen, die eigene fehlt, und der Fluss ist der teuerste
des Produkts. Der Befund hält den Textdurchgang nicht auf — er hält die Freigabe von E-084 auf.

---

## 8. Befunde in Kurzform

```
Z-01  Einstellungen > Status         Abweichung: T-163 ST-04 streicht StatusSettings.tsx:276 ganz,
      A-5.4, E-054                   T-171 3.6 lässt eine Verneinung stehen — zwei Designpapiere,
                                     ein Gegenstand, und der Gegenstand ist der Ausgleich.
                                     Vorschlag: die Verneinung gilt. description="Nicht die
                                     Spalten des Boards." E-081 Punkt 4.

Z-02  TodoFormDialog                 Abweichung: T-163 schlägt „Einstellungen › Status" vor; das
      A-5.4, E-078                   Zeichen › steht in keinem Oberflächentext von apps/web.
                                     Vorschlag: hint="Die Werte stehen in den Einstellungen unter
                                     „Status“." — die Form, die BoardScreen.tsx:985 schon benutzt.

Z-03  Board, Einstellungen           Abweichung: keine — Auflage. Streichung und Ausgleich
      E-081 Punkt 4                  (Trennlinie, Farbe der Regelzeile, Verneinung, Wegweiser)
                                     laufen in einem Auftrag. Geteilt erlischt die Freigabe.

Z-04  labels.ts                      Abweichung: RULE_NOT_A_PLACE hat keinen Aufrufer mehr
      E-076 Punkt 5                  (gemessen über **/*.{ts,tsx}).
                                     Vorschlag: Konstante und Kommentarzeile :486 fallen. Keine
                                     Kurzfassung tritt an ihre Stelle.

Z-05  Musterseite                    Abweichung: showcase/BoardSection.tsx zeigt den Spaltenkopf
      T-163 Geltungsbereich          in der alten Gestalt.
                                     Vorschlag: nachziehen, nicht kürzen — dort ist der Text
                                     Prüfdokumentation.

Z-06  Formulare, alle                Abweichung: alle drei von UM-01 genannten Stellen sind
      SC 3.3.2, E-078 Nachtrag 8     bereits zustandsgebunden; der Eintrag hat keinen Gegenstand.
                                     Vorschlag: UM-01 gilt als Regel (vier Sätze, Abschnitt 1.2).
                                     Ein Umbau an einer ungenannten Stelle ist nicht gedeckt.

Z-07  Board-Leerzustand              Abweichung: UM-03 verweist auf eine Erklärung in
      A-5.4, E-054, E-081 Punkt 4    BoardScreen.tsx:967, die ST-05 dort gerade entfernt.
                                     Vorschlag: Träger ist der Einrichtungsdialog, einen Klick
                                     entfernt. Die Kette Leerzustand → „Erste Spalte einrichten"
                                     → RULE_IS_A_RULE ist Teil der Freigabe.

Z-08  Einstellungen > Status         Abweichung: UM-04 begründet sich mit dem disabledReason am
      SC 4.1.2, A-5.4, SP-19         Knopf; gemessen erreicht ihn kein Tabulatornutzer (T-172).
                                     Vorschlag: der sichtbare Block status-admin__blocked
                                     (StatusSettings.tsx:568-596) ist der Träger und ist im
                                     Textdurchgang kein Vorratskasten. Nicht anfassen.

Z-09  Anhangliste                    Abweichung: http:// bleibt sichtbar, entgegen X-04 Auflage 1.
      A-19.12, SC 2.4.6, T-156-8     Vorschlag: trägt. Auflage: security-checker schließt oder
                                     berichtigt den Hinweis T-156-8 im Bedrohungsmodell — er
                                     beschreibt einen Zustand, den es nicht mehr gibt.

Z-10  Anhangliste                    Abweichung: der Dateifall wird länger, das hat niemand
      A-19.12, SC 2.4.6, E-078       verlangt.
                                     Vorschlag: trägt — die Liste ist der maßgebliche Fall, und
                                     der Name steht vorn. Auflagen: Toast-Rumpf bleibt ein Satz;
                                     truncate-Befund an ui-designer; unit-tester schreibt die zwei
                                     Fälle um und ergänzt den über die Unterscheidbarkeit.

Z-11  Rückfrage vor dem Öffnen       Abweichung: keine — Zustimmung. „Diese Datei wird nicht
      A-19.18, R-21, SC 4.1.3        geöffnet" trägt: fünf Wörter, Aussage, dritte Ausprägung
                                     derselben Satzform.
                                     Vorschlag: Auflage — der Titel bleibt in der Reihe. „Öffnen
                                     nicht möglich" oder „Das hat nicht geklappt" sind verboten:
                                     Sie melden einen Fehlschlag, wo eine Regel gilt.

Z-12  Einstellungen > Arbeitsplatz   Abweichung: Schiene „Arbeitsplatz", Karte „Dieser
      S-09, E-076 Punkt 3            Arbeitsplatz" — zwei Namen für eine Sache, und das Handbuch
                                     hat sie bereits verschmolzen (benutzerhandbuch.md:558).
                                     Vorschlag: „Arbeitsplatz" bleibt. Card.title ändern, mit
                                     unit-tester und e2e-tester; showcase und Handbuch ziehen nach.

Z-13  proof:addin, Abschnitt 18e     Abweichung: gemessen wird der Quelltext, nicht das Bündel.
      A-19.2                         Vorschlag: trägt, und für eine Abwesenheit ist die größere
                                     Menge die schärfere. Auflage: der Kommentar nennt die Grenze
                                     — Text aus @takt/domain liegt außerhalb der Menge. Kein
                                     Vite-Lauf in proof:addin.

Z-14  Buchung von Hand               Abweichung: „Anfang und Ende müssen beide gesetzt sein."
      SC 3.3.1, E-084                hängt nur am Feld „Anfang" (BookingDialogs.tsx:103, :173).
                                     Vorschlag: je Feld ein Satz nach P-2/P-3.

Z-15  sechs Formulare                Abweichung: sperren den Absendeknopf bei leerem Pflichtfeld
      SC 3.3.1, E-084 Punkt 2, P-7   und nennen keinen Grund (TagsScreen :338/:360/:381,
                                     PoolFormDialog :439, TemplatesScreen :710,
                                     StatusSettings :731).
                                     Vorschlag: Grundform „<Feld> fehlt.", im selben Auftrag wie
                                     noValidate.

Z-16  Exportstatus zurücksetzen      Abweichung: ConfirmDialog.tsx:170-178 trägt ein
      BLOCKIEREND                    required-Textfeld ohne <form>, ohne Browserprüfung und ohne
      SC 3.3.1, E-012, R-10, SP-19   eigene Meldefläche. Sichtbar ist nur ein toter Knopf — im
                                     einen Dialog, hinter dem Geld liegt.
                                     Vorschlag: role="alert"-Fläche wie in TextField, dauerhaft im
                                     Baum, Satz nach P-2/P-3. Oder die Bauform aus create-gate.ts.
```

---

## 9. Was ich geprüft und **nicht** beanstandet habe

Die Pflichtklickpfade, soweit die heutigen Entscheidungen sie berühren:

| Pfad | Stand |
|---|---|
| Timer auf erledigtem Todo | unberührt. `reactivationTitle` (SP-16) und `TodoDetailScreen.tsx:401` fallen unter keine der drei Freigaben. **Achtung:** ST-06 Zeile `TodoListScreen.tsx:653-654` berührt ihn — sie ist **nicht** freigegeben |
| Exportstatus überall sichtbar | unberührt. Keiner der drei Einträge fasst `ExportStatus` an |
| Todo-Notiz nie im Export | unberührt. SP-09 steht; die Anrede ist nach E-080 gezogen (`NoteField.tsx`, „Nur für Sie.") |
| Ordnerbaum vier Ebenen, Selbstverschiebung | unberührt. Die Absage `TagsScreen.tsx:408` („Ein Ordner kann nicht unter einen seiner eigenen Unterordner …") steht und wird von ST-05 nicht angefasst |
| Standard-Tags auf jedem Erstellungsweg | unberührt von ST-05. Die Aussage steht nach ST-04 in `SettingsScreen.tsx:589` („Auch aus dem Add-in.") und nach ST-06 im Dialog — **ST-06 ist nicht freigegeben** |
| Vorlageneditor mit Vorschau auf offene Buchungen | unberührt. `TemplatePreview` fällt unter ST-07, nicht unter die drei heutigen Einträge |

---

## Annahmen

1. **Ich löse den Widerspruch zwischen zwei Designpapieren selbst** (Z-01), statt ihn zu melden.
   Begründung: Es ist ein Wortlaut, der an A-5.4 und E-054 hängt, und beide Papiere haben ihn
   ausdrücklich mir vorgelegt. Ihn zurückzugeben hieße, ST-05 eine Welle länger liegen zu lassen.
2. **UM-01 gebe ich als Regel frei und nicht als Bauauftrag.** Die Alternative wäre eine Ablehnung
   gewesen; sie hätte die vier Sätze mit weggenommen, die künftig gelten sollen.
3. **Z-16 ist blockierend für E-084, nicht für den Textdurchgang.** Ich trenne das ausdrücklich,
   damit frontend-dev ST-05, UM-01 und UM-03 nicht auf einen Befund wartet, der eine andere Fläche
   betrifft.
4. **„Titel fehlt." statt „Tragen Sie einen Titel ein."** — E-080 Punkt 4 zieht die Fassung ohne
   Anrede vor, und bei genau einer möglichen Reparatur ist das Fehlende zugleich die Handlung.
   Das ist meine Auslegung von „nennt, was zu tun ist"; wer eine Verbform will, bekommt eine
   Anrede oder einen Befehl, und beides hat Takt bisher vermieden.
5. **Zeilenangaben stammen aus dem Baum vom 2026-09-05**, nach den Wellen X und Y. Verschieben
   sich Zeilen, gelten die genannten Bezeichner.

## Risiken

1. **ST-05 ist die größte Textstreichung dieses Vorhabens, und sie ist nicht umkehrbar, ohne dass
   jemand die vierzehn Sätze wieder erfindet.** Die Absicherung ist die Kompensation, und die ist
   gemessen (`RuleSummary` unter jedem Spaltenkopf). Fällt sie im Bau weg, ist der Schaden
   dauerhaft.
2. **Z-01 hängt an einem einzigen Satz von dreißig Zeichen.** Wer ihn beim Aufräumen mitnimmt —
   er sieht wie ein Rest aus —, nimmt den Ausgleich mit, und die Einstellungen schweigen dort, wo
   der Benutzer die Statusspalten sucht.
3. **Z-12 ändert einen zugänglichen Namen ohne heutigen Prüffall.** Genau deshalb ist das Risiko
   nicht kleiner: Wo kein Prüffall hängt, merkt niemand die Rücknahme.
4. **Z-16 liegt in einer Datei, die zugleich SP-06 trägt.** Wer dort die Live-Region für die eigene
   Meldung baut, darf die für die Absage des Dienstes nicht anfassen — zwei Regionen, zwei Zwecke,
   und die zweite ist seit T-116 geprüft.
5. **Der `truncate`-Befund an `.attachment__label`** (Z-10 Auflage 2) bleibt für das Auge offen.
   Er ist kein Grund, X-04 zurückzunehmen, aber er ist auch nicht behoben.

## Offene Fragen

1. **An den Orchestrator:** Z-16 — geht die eigene Meldung in `ConfirmDialog` in dieselbe Welle wie
   `noValidate`, oder wird E-084 um eine Welle geschoben? Beides ist vertretbar; **nicht**
   vertretbar ist `noValidate` ohne sie.
2. **An den Orchestrator:** der Restbefund aus Abschnitt 2 (gesperrte Knöpfe ohne tabulierbares
   Element in der Begründungszone). Eigene Aufgabe oder Wiedervorlage? Der Bestand hat mit
   `Menu.tsx` das Mittel schon.
3. **An ui-designer, ohne Frist:** Z-10 Auflage 2 — bricht `.attachment__label` künftig um statt
   abzuschneiden, ist der Verweisfall auch fürs Auge zu.
4. **An mich selbst, Wiedervorlage:** die sieben noch nicht vorgelegten Einträge aus T-163
   Abschnitt 9 (Abschnitt 1.4). Sie kommen einzeln, nicht als Paket.

## Nächster Schritt

1. **frontend-dev:** ST-05 als **ein** Auftrag mit den Auflagen Z-01 bis Z-05. UM-03 fährt darin
   mit; UM-01 wird als „nichts zu tun" geschlossen, sofern keine Stelle benannt wird.
2. **frontend-dev, getrennt davon:** `noValidate` nach P-1 bis P-7, zusammen mit Z-14, Z-15 und
   Z-16. Der letzte ist die Bedingung, nicht die Zugabe.
3. **unit-tester und e2e-tester:** Z-12 (Kartentitel) und Z-10 Auflage 3. Dazu der Hinweis, dass
   `tests/e2e/field-live-region-announcement.spec.ts:96` den Wortlaut
   „Ohne Titel lässt sich ein Todo nicht wiederfinden." zeichengleich festhält — er ändert sich
   nach P-2 zu „Titel fehlt — ohne ihn lässt sich das Todo nicht wiederfinden."
4. **security-checker:** Z-09 — T-156-8 im Bedrohungsmodell schließen oder berichtigen.
5. **integration-dev:** Z-13 — eine Kommentarzeile über die Grenze der gemessenen Menge.
6. **documenter, zuletzt:** `docs/benutzerhandbuch.md:558` (Bereich „Arbeitsplatz") und der
   Abschnitt zum Board, sobald ST-05 steht.
