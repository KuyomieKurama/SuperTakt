# T-171 — Was der Textabbau für Hierarchie, Dichte und Sinnbilder bedeutet

**Rolle:** ui-designer **Datum:** 2026-09-05 **Welle:** Y
**Artefakt:** `docs/design/textabbau-gestalt.md`
**Gelesen, nicht geändert:** `docs/design/textbestand.md` (T-163, ux-designer),
`.claude/team/decisions.md` (E-054, E-055, E-076, E-078 samt Nachtrag, E-080),
`.claude/team/reports/T-165-spec-ux-reviewer.md` Abschnitt 4,
`packages/ui-tokens/tokens.css`, `apps/web/scripts/contrast-check.mjs`,
`apps/web/src/**` (nur gelesen — kein Produktivcode angefaßt).

---

## 1. Die Leitentscheidung

**Weniger Text heißt nicht mehr Luft.** Wo eine Textebene fällt, wird kein Abstand vergrößert.
Was an ihre Stelle tritt, sind Rangfolge, Gruppierung, Abstand, Reihenfolge und Beschriftung —
fünf Mittel, die alle schon im Bestand stehen. Sie sind **kein vierter Träger** im Sinn von E-078
Nachtrag Punkt 6: Die drei Träger sagen, **wann** eine Auskunft erscheint; diese fünf sagen,
**wodurch** eine Fläche ohne Satz verständlich ist. Ein Abstand trägt keine Auskunft, er ordnet sie.

Prüffrage an jede Streichung: *Beantwortet die Fläche die Frage, die der Satz beantwortet hat, ohne
ihn?* Drei Antworten, drei Folgen — streichen ohne Ersatz, streichen mit einer benannten
Rangänderung, oder nicht streichen und melden. Für jede der 17 Stellen steht im Artefakt, welche
zutrifft.

---

## 2. ST-04 — Einstellungen

Der Befund ist schärfer als eine Verdopplung: Es ist ein **Rangfehler**. Der `lead` unter dem Titel
„Einstellungen" erläutert nicht diesen Titel, sondern den gewählten **Bereich**, der 20 px weiter
unten links in der Schiene steht (`SettingsScreen.tsx:203-207`, `:173-180`). Deshalb ist seine
Streichung eine Berichtigung.

**An die Stelle von `AREA_LEAD` tritt nichts.** Der Bereich ist danach dreimal benannt statt
viermal: Schieneneintrag (aktuell markiert), Kartentitel, Adresse. Der **Kartentitel wird zur
Bereichsüberschrift** — das ist die einzige strukturelle Folge.

**Eine Änderung ist nötig, und sie ist nicht optisch:** Die Schiene ist danach die einzige Fläche,
die den gewählten Bereich zeigt, bevor man den Kartentitel liest. Ihr aktueller Eintrag
unterscheidet sich heute an drei Merkmalen, alle drei Farbe, und die Kontur trägt den schwächsten
Akzentwert. Vorgabe: `.settings-rail__item--current { border-color: var(--border-accent) }` statt
`--accent-border-subtle`. Eine Zeile, bestehende Klasse, kein neues Token. Kontur statt Balken,
weil die Schiene unter 60 rem in eine umbrechende Zeile kippt.

**Die Trennlinie im Kartenkopf bleibt** (`components.css:285`) — sie ist genau das Mittel, das die
gestrichene Beschreibung ersetzt. Wer sie beim Aufräumen mitnimmt, nimmt die Ersatzleistung mit.

**Neue Regel für Schienenzusätze:** `.settings-rail__hint` ist unter 60 rem ausgeblendet
(`app.css:3963-3965`). Ein Zusatz dort unterscheidet sechs Geschwister und trägt **nie** eine
Aussage, die nur dort steht.

---

## 3. ST-10 — beide `lead` fallen ersatzlos

**Dashboard:** Die drei Glieder des Satzes sind drei beschriftete Elemente im selben Blickfeld
(`Card title="Timer"`, `StatTile label="Heute erfasst"`, `StatTile label="Noch nicht exportiert"`).
Reines **S**. Der Gewinn ist größer als Platz: Der Kopf trägt zwei Aktionen; ohne den `lead` steht
die Primäraktion „Neues Todo" neben dem Titel statt neben einem 68-Zeichen-Absatz. **Die
Primäraktion wird durch die Streichung eindeutig.**

**Zeiterfassung:** Zwei der drei Glieder sind Kartentitel, das dritte ein Knopf in jeder Zeile.
Ohne den `lead` rückt die Karte „Timer" nach oben — die einzige Aufgabe dieser Ansicht steht
unmittelbar unter ihrem Titel.

**Eine Anpassung dafür:** `.screen__headline` setzt `align-items: flex-start` — richtig bei
zweizeiligem `lead`, falsch ohne ihn (36-px-Aktion an der Oberkante einer 29-px-Titelzeile).
Vorgabe: `ScreenHeader` setzt `screen__headline--bare`, wenn kein `lead` übergeben wird;
`.screen__headline--bare { align-items: center }`. Neue Klasse, keine bestehende geändert, keine
Rolle, kein zugänglicher Name, keine Farbe.

**Leseregel für alle künftigen Ansichten:** Ein `lead` steht, wenn der Titel eine Frage offen läßt
(„Protokoll" wovon). Er fällt, wenn er die beschrifteten Flächen darunter aufzählt.

---

## 4. ST-05 — die Kernfrage

**Der Befund, der die Aufgabe trägt: Die Antwort steht bereits N-mal auf dem Board — nur nicht als
Satz.** Unter jedem Spaltenkopf zeichnet `RuleSummary` die Regel **dieser** Spalte in ihren fünf
Achsen, Symbol plus Versalienwort plus Chips (`BoardScreen.tsx:677-683`, `Kanban.tsx:390`,
`RuleSummary.tsx:213-275`). Der allgemeine Satz ist eine Bildunterschrift zu etwas, das die Fläche
bereits spezifisch zeichnet — und die spezifische Fassung gewinnt, weil sie die Frage beantwortet,
die der Benutzer wirklich hat: nicht „was ist eine Spalte", sondern „warum steht **diese** Karte
**hier**".

**Bedingung, damit das trägt — zwei Eingriffe, beide innerhalb bestehender Klassen:**

1. **Die Trennlinie zwischen Spaltenkopf und Regelzeile entfällt** (`.kcolumn__head`
   `border-bottom: none`; die Linie unter `.kcolumn__rule` bleibt). Heute stapeln sich zwei gleich
   starke Linien in 60 px und zerlegen den Kopf in drei Bänder — das lehrt, daß die Regel eine
   eigene, abtrennbare Sache ist. Danach bilden Name, Zahl und Regel **einen Block: die Identität
   der Spalte**, und die verbleibende Linie trennt Identität von Inhalt. **Das ist die wirksamste
   einzelne Maßnahme dieses Papiers** — Gruppierung statt Satz.
2. **`.rule-summary { color: var(--text-secondary) }`** statt `--text-muted`. Eine Zeile, die sagt,
   warum diese Karten hier stehen, ist kein Hilfetext. Größe bleibt bei 11 px (die Spalte ist
   17 rem breit), Versalien der Achsenbeschriftung bleiben — sie sagen bereits „Feldname, kein
   Kommentar". Beide Paare gemessen, kein neues.

**In Worten bleibt es an genau zwei Stellen, weil es zwei Aufgaben sind:** `RULE_WHAT_MOVES_A_CARD`
am Board-`lead` (**Verhalten**, am Ort der Beobachtung), `RULE_IS_A_RULE` im Einrichtungsdialog
(**Definition**, am Ort der Erzeugung). Eine dritte Stelle gäbe es nur bei einer dritten Aufgabe.
`RULE_NOT_A_PLACE` fällt (O-DM) — und danach gibt es **keine Kurzfassung** mehr, was so bleiben muß:
Eine Kurzfassung ist die Einladung, den Satz wieder überall hinzuschreiben.

**Eine Abweichung von T-163:** ST-04 will die Kartenbeschreibung von `StatusSettings` (`:276`)
ersatzlos streichen. Ich schlage vor, sie auf die **Verneinung** zu schrumpfen — 30 Zeichen statt
100 — und **nicht** in die Schiene zu legen: „Status" ist das einzige Wort des Produkts, das mit
einem anderen Begriff im Kopf desselben Benutzers kollidiert; eine **Abwesenheit** fällt nach T-163s
eigenem Raster nicht; und der Schienenzusatz verschwindet unter 60 rem. Arbeitsteilung: die Schiene
unterscheidet, die Karte verneint, genau einmal. Braucht spec-ux-reviewer.

**Vier Dinge, die eine Kürzung aus Versehen mitnimmt und die nicht mitgenommen werden:** kein
`line-clamp` auf der Regelzeile (eine gekürzte Regel ist eine falsche); der leere Ordner bleibt am
Chip mit vier Merkmalen; der `aria-label` der Spalte bekommt die Regel **nicht** dazu (sie steht als
sichtbarer Text im Bereich — Sicht und Gehör über denselben Text, E-078 Nachtrag 8 gemessen und
erfüllt, und 286 `getByRole`-Zugriffe bleiben grün); kein Greifzeiger.

---

## 5. Umbauliste — Gestalt und Sprungfreiheit

**Drei Bauformen, in dieser Rangfolge, alle im Bestand vorhanden:** B1 Ersetzen im festen Fach
(`RadioRow`, `ConfirmDialog.refusal`), B2 reserviertes Fach (`role="status"` dauerhaft im Baum),
B3 Anhängen unterhalb. Dazu vier Regeln: B1 vor B2 vor B3; nie oberhalb des bedienten Elements;
keine Höhenanimation (nur `opacity` über `--motion-fast`); und die **gemessene Grenze im Dialog**.

Die vierte ist der eigentliche Fund zur Sprungfrage: `.dialog__body--form` hat
`max-height: 60vh; overflow-y: auto`, und `.scrim` **zentriert den Dialog senkrecht**. Ist der
Formularkörper kürzer als 60 vh, verschiebt jeder Zuwachs den Dialog um die **halbe** Zuwachshöhe
nach oben — ein Ruck am fokussierten Feld. Ist er an 60 vh, schluckt der Bildlauf ihn. **Vor jedem
Umbau in einem Dialog wird das bei 1280x720 und 1024x640 gemessen, nicht geschätzt.**

Zur Symmetrie (E-078 Nachtrag 8): Bei `Select` und `TextField` ist sie **bauartbedingt erfüllt** —
sichtbarer Absatz und `aria-describedby` hängen am selben Ausdruck (`Select.tsx:201`, `:233`).
Daraus die Vorgabe: weglassen über `hint={undefined}`, **nie** über `display: none`.

---

## 6. Sinnbilder

Vorweg die Unterscheidung, ohne die die Frage nicht zu beantworten ist: Ein `aria-label` an einem
Symbolknopf ist **kein Erklärtext**, sondern der **Name** und nach SC 4.1.2 Pflicht. Verdopplung im
Sinn von E-078 Punkt 5 ist erst **sichtbarer** Text neben dem Symbol.

**Fünf der sechs ersetzen eine Beschriftung und tun es bereits:** `x`, `more-horizontal`, `pencil`,
`trash`, `play`/`pause` — jeweils in einer Zeile oder an einer Karte, wo der Gegenstand aus der
Umgebung folgt. **`plus` nur im Behälter, der den Gegenstand nennt** (das `+` im Spaltenkopf trägt
„Todo in „X" anlegen"): **nicht** als Primäraktion eines Bildschirms. Die Primäraktion ist die eine
Stelle, an der ein nacktes Symbol am teuersten ist.

**Kein siebtes Symbol in dieser Runde.** Keine Stelle der Listen kürzt eine Beschriftung; sie alle
kürzen Prosa. Ein Bild kann eine Handlung benennen, aber keine Folge, keine Abwesenheit und keine
Absage aussprechen — und genau das sind die Sätze, die stehen bleiben.

**Eine Stelle reißt ST-09 auf.** `Tag.tsx:114-119`: sichtbar „S", gehört „Standard-Tag", dazu ein
`title`, das ST-09 streicht. Danach hört eine Vorlesehilfe „Standard-Tag" und ein Sehender sieht ein
„S", das nirgends aufgelöst wird — E-078 Nachtrag Punkt 8 in der selten geprüften Richtung. Und
„S" ist **kein Sinnbild**, sondern eine erfundene Abkürzung ohne gelernte Bedeutung. Vorgabe: die
Marke trägt das **Wort** „Standard"; der `visually-hidden`-Text entfällt damit, das `title` fällt
wie vorgesehen. Bauform wie die vorhandene Wortmarke „neu", Farbpaar bereits gemessen. **Berührt
einen zugänglichen Namen** (der Markentext gehört zum Namen, wenn der Chip anklickbar ist) — nur mit
unit-tester und e2e-tester. Bricht die Chipwand dadurch um, bleibt das `title` an dieser einen Marke
und ST-09 Zeile 5 entfällt.

---

## 7. Vertrag und Kontrast

**Genau zwei Vorschläge berühren einen zugänglichen Namen**, beide ausdrücklich markiert: die
Wortmarke „Standard" (5.3) und — nur als Vorschlag — der Kartentitel „Dieser Arbeitsplatz". Alles
Übrige ist Farbe, Linie und Abstand. Eine Klasse kommt hinzu (`.screen__headline--bare`, farblos)
und ein Modifikator an der Chipmarke; keine bestehende Klasse wird umbenannt oder entfernt.

| Paar | Min | Anlaß | Stand |
|---|---|---|---|
| `--text-secondary` / `--bg-subtle` | 4,5 | Regelzeile im Spaltenkopf | gemessen, `contrast-check.mjs:254` |
| `--text-secondary` / `--bg-surface` | 4,5 | Regelzeile in Liste und Formular | gemessen, `:156` |
| `--accent-text` / `--accent-bg-subtle` | 4,5 | Wortmarke „Standard" | gemessen, `:434` |
| `--border-accent` / `--accent-bg-subtle` | **3** | Kontur des aktuellen Schieneneintrags | **nachzutragen**, `pnpm run contrast` muß es ausweisen |

Der letzte ist der einzige Zusatz. Er ist in beiden Themen zeichengleich mit einem geprüften Paar;
eingetragen wird er trotzdem, weil eine Zusage aus der Gleichheit zweier Tokenwerte nur so lange
hält wie die Gleichheit. **Kein Token geändert, keines hinzugefügt.** Keine neuen Umbruchpunkte —
92, 68, 60, 52, 40 rem bleiben.

---

## Kurzfassung

```
Aufgabe: T-171 — Was der Textabbau für Hierarchie, Dichte und Sinnbilder bedeutet
Status: fertig
```

**Artefakte**
`docs/design/textabbau-gestalt.md` (neu, eigener Dateiname, `docs/design/` enthielt zuvor nur
`textbestand.md`), `.claude/team/reports/T-171-ui-designer.md` (neu). Kein Produktivcode berührt.

**Zusammenfassung.** Für jede Stelle der Streich- und Umbauliste steht jetzt fest, was an ihre
Stelle tritt — und in den meisten Fällen ist die Antwort „nichts", mit Grund. ST-04 und ST-10 fallen
ersatzlos; die einzigen Kompensationen sind eine kräftigere Kontur am aktuellen Schieneneintrag
(bestehende Klasse, ein Wert) und eine senkrecht mittige Kopfzeile, wo kein `lead` mehr steht (eine
neue, farblose Klasse). Die Kernfrage ST-05 ist beantwortet, ohne den Satz elfmal zu behalten: Die
Regelzeile unter jedem Spaltenkopf zeichnet die Regel bereits spezifisch je Spalte; sie muß nur
aufhören, wie eine Fußnote auszusehen — die Trennlinie zwischen Kopf und Regel entfällt, so daß
Name, Zahl und Regel **einen** Block bilden, und die Zeile wechselt von `--text-muted` auf
`--text-secondary` (beide Paare bereits gemessen). In Worten bleibt der Satz an zwei Stellen mit
zwei verschiedenen Aufgaben: Verhalten am Board, Definition im Einrichtungsdialog. Für die
Umbauliste stehen drei Bauformen mit Rangfolge und vier Sprungregeln, darunter die gemessene
Grenze, ab der ein senkrecht zentrierter Dialog beim Einfügen ruckt.

**Annahmen**
1. Die Vorgabe „`docs/design/**` — je eigenes Artefakt, nie dieselbe Datei" gilt strikt:
   `textbestand.md` wurde gelesen und an drei Stellen **widersprochen**, aber nicht angefaßt.
2. `Card.description`, `ScreenHeader.lead` und Fließtext sind frei (T-163 Abschnitt 6.1, gemessen);
   ich habe darauf aufgebaut, ohne selbst nachzuzählen.
3. Wortlaute gehören ux-designer. Wo ich einen nenne („Nicht die Spalten des Boards."), ist er
   Vorschlag mit Begründung, nicht Vorgabe.
4. Neue Klassennamen sind Zusätze und keine Vertragsverletzung; geändert oder entfernt wird keine.
5. `.screen__headline--bare` ist einer Lösung über `:has()` vorgezogen — eine Zustandsklasse aus der
   Komponente ist prüfbar, ein Selektor mit Browserbedingung nicht.

**Risiken**
1. **ST-05 ist die riskanteste Stelle des ganzen Vorhabens** (S-2 aus R-2, W-14 aus R-2a). Meine
   Antwort verlagert die Last vom Satz auf die Regelzeile. Fällt eine der beiden Änderungen an ihr
   weg — die Trennlinie oder die Textfarbe —, bleibt sie eine Fußnote, und dann ist der Satz
   gestrichen **ohne** Ersatz. Die beiden Änderungen gehören zur Textänderung, nicht danach.
2. Fällt `AREA_LEAD` und die Kontur der Schiene bleibt schwach, verliert die Einstellungsansicht
   ihre Ortsangabe oberhalb des Kartentitels. Auch hier: zusammen, nicht nacheinander.
3. Die Wortmarke „Standard" ändert einen zugänglichen Namen und kann eine Chipwand umbrechen. Der
   Rückfall ist benannt (F-1).
4. Kein Sicherheitsbezug. Kein Text mit Anforderungs-ID wird durch dieses Papier gekürzt; die
   gesperrten Sätze aus T-163 Abschnitt 5 und T-165 Abschnitt 4.1 sind ausdrücklich ausgenommen,
   G-10 (die leere Meldefläche im Baum) namentlich.

**Offene Fragen**
* **B-1 — UM-02 ist bereits gebaut.** `RadioRow.tsx:145-154` zeigt nur den Hinweis der gewählten
  Option; sichtbar erscheint `POOL_EXPORT_NOT_BILLED_HINT` heute schon nur bei „Abgerechnet".
  Dauerhaft im Baum steht die verborgene Beschreibung **jeder** Option — Absicht nach S-6 aus R-2
  (`:44-56`, `:125-137`). Eine Umsetzung im Wortsinn änderte sichtbar nichts und nähme S-6 still
  zurück. **Vorschlag: UM-02 streichen, an dieser Stelle nur ST-03 fahren.** Dasselbe sinngemäß für
  `POOL_MATCH_MODE_HINT` und die drei Optionshinweise in `Attachments.tsx:420-422` — auch dort ist
  immer nur einer sichtbar.
* **B-2 — die eine geprüfte Asymmetrie braucht einen Eintrag.** `RadioRow` gibt dem Gehör mehr als
  dem Blick, mit Freigabe. Ohne Eintrag in `decisions.md` wird sie beim nächsten Durchgang in einer
  der beiden Richtungen „aufgeräumt".
* **B-3 — die letzte zeitgebundene Erklärfläche.** `BoardScreen.tsx:975-1008` („Was sich geändert
  hat") spricht zu jemandem, der vor E-054 ein Statusboard hatte, und ist für eine frische
  Einrichtung gegenstandslos. Sie liegt außerhalb der ST-Liste; sie braucht eine Bedingung oder ein
  Ablaufdatum.
* **B-4** Schiene „Arbeitsplatz" gegen Karte „Dieser Arbeitsplatz" — zwei Namen für eine Sache,
  sobald der Kartentitel die Bereichsüberschrift ist. Vertraglich.
* **F-2** Welches Trennzeichen für einen Pfad in einem Hinweis? `›` kommt in keinem
  Oberflächentext von `apps/web` vor.
* **F-3** X-06 aus T-165 gehört ux-designer. Meine Empfehlung, falls erbeten: Satz bleibt im
  Dialog, die Karte behält allein die Exportaussage — die Karte ist Lesefläche, der Dialog
  Schreibfläche.
* **O-DN** (erreicht eine Vorlesehilfe den `disabledReason`?) läuft parallel bei visual-qa. Für
  UM-04 ist die Antwort gestalterisch bereits entschärft: In `StatusSettings` steht der Sperrgrund
  **sichtbar in der Zeile** (`:568-596`), nicht am Knopf; UM-04 trägt auch bei negativem Ausgang.

**Nächster Schritt**
Welle X+1 kann sofort laufen (ST-01, ST-02, ST-03, ST-07, ST-09 ohne Zeile 5) — sie berührt keine
Gestaltentscheidung. Für Welle X+2 ist mit diesem Papier alles entschieden; ST-04 und ST-10 gehen
als **ein** Auftrag an frontend-dev, weil Streichung und Kompensation zusammengehören. ST-05, UM-01
und UM-03 gehen mit den Wortlauten aus T-163 und den Gestaltvorgaben aus Abschnitt 3 und 4 dieses
Papiers an spec-ux-reviewer; **UM-02 sollte vorher aus der Liste genommen werden** (B-1), sonst
legt jemand eine Änderung vor, die sichtbar nichts bewirkt.
