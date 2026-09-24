# T-229 (Welle AI) — ui-designer

**Aufgabe:** T-229 — O-JZ: der Nachtrag erreicht die berichtigte Stelle; und der Rechenweg der
Dichteforderung in 11.7 wird nachgezogen.

**Vorlage:** Board O-JZ und O-JX; `.claude/team/reports/T-221-spec-ux-reviewer.md`;
`.claude/team/reports/T-222-ux-designer.md` mit `docs/design/textbestand.md` 15.6 (fremde Hoheit,
hier nur gelesen); `.claude/team/reports/T-216-frontend-dev.md` Abschnitte 2 bis 4 und Annahme 4;
E-078, E-087.

**Dateien in meiner Hoheit, beide geändert:** `docs/design/traeger-und-zusage.md`,
`docs/design/textabbau-gestalt.md`. **Kein Produktivcode.** Gelesen, nicht geändert:
`apps/web/src/styles/components.css`, `app.css`, `components/ExportGroups.tsx`,
`components/Primitives.tsx`, `lib/labels.ts`, `docs/design/textbestand.md`.

---

## 1. O-JZ — die drei verbindlichen Sätze stehen jetzt dort, wo sie gelesen werden

Der Befund von spec-ux-reviewer ist richtig und war es vollständig: Mein Nachtrag T-213 in
`textabbau-gestalt.md` 9.11 hat drei verbindliche Folgesätze gezogen und die zwei Abschnitte, die
sie berichtigen, unberührt gelassen. Dort stand weiter „baulich ausgeschlossen" (9.1) und „drei
Grenzen" (9.8) — beides zum Zeitpunkt des Lesens widerlegt.

**Was ich gezogen habe, Stelle für Stelle:**

| Satz aus 9.11 | steht jetzt in | was dort verschwunden ist |
|---|---|---|
| Der Wirt reicht nicht bis in die Kinder | **9.1** als Kasten unmittelbar am Satz, den er einschränkt, **und 9.1 Punkt 2** („Kein zweiter Meldebaustein — **und keine zweite Rolle in einem Kind**") | „baulich ausgeschlossen" ohne Reichweite; steht jetzt „die Verschachtelung **Wirt über Meldebaustein** ist baulich ausgeschlossen" — und weiter reicht sie nicht |
| dieselbe Grenze als **Grenze** | **9.8 Punkt 2**, Überschrift „**vier** Grenzen" statt drei, die übrigen Punkte durchnummeriert | die alte Zahl |
| Innere Rolle und Wirt sind **eine** Änderung; diese eine Fläche ist `polite`, nicht `assertive` | **9.7, Bündelzeile 2** — dort, wo der Auftrag zugeschnitten wird | nichts; die Zeile war an dieser Stelle stumm, und ein Erbauer hätte nur den Wirt gesetzt |

**9.11 bleibt stehen, aber als Herleitung.** Es trägt jetzt oben einen Kasten, der sagt, wohin jeder
der drei Sätze gezogen ist und daß der Abschnitt selbst kein Ort mehr ist. Die Begründung dazu
(Z-65/Z-66, wie der Fehler entstanden ist) gehört dorthin und nirgends sonst hin — sie zweimal zu
erzählen wäre der nächste Fehler.

**Daraus eine Hausregel, und sie steht vorn, nicht hinten.** `traeger-und-zusage.md` Abschnitt
**0.1** (neu) trägt **Regel T-7**: *Eine Berichtigung steht an der Stelle, die sie berichtigt; ein
Nachtrag ist die Herleitung, nicht der Ort.* Begründet mit dem gemessenen Fall: drei Wellen lang
haben beide Stellen das Widerlegte gesagt. Der Satz dahinter ist derselbe wie in 2.6 desselben
Papiers („Fünf Stellen sagen denselben Satz. Alle fünf müssen mit") — nur auf das Papier selbst
angewandt statt auf den Quelltext. **Ein Papier wird abschnittsweise gelesen, nie von vorn.**

Ich habe T-7 in derselben Aufgabe auf mich selbst angewandt: Jede Berichtigung dieser Welle steht in
ihrem Abschnitt; der Nachtrag 12 ist ein Verzeichnis von sechs Zeilen und trägt keine Entscheidung.

---

## 2. Der Rechenweg der Dichte — nachgezogen, und er kehrt meine Aussage um

**Nachgemessen und bestätigt.** ux-designers Befund stimmt, ich habe die Kaskade selbst gelesen:

```css
.eentries      { display: flex; flex-direction: column; … }   /* components.css:3116-3125 */
.eentry        { display: grid; grid-template-columns: auto auto auto auto auto minmax(0,1fr) auto; }
.tpsegment-list{ display: flex; flex-direction: column; … }   /* app.css:3589-3596 */
.tpsegment     { display: grid; grid-template-columns: auto auto minmax(0,1fr) auto; }
```

Kein `subgrid`, keine gemeinsame Achse. **Beide betroffenen Listen sind Flex-Stapel aus je eigenen
Rastern.**

**Die Folge ist nicht „ungenauer", sondern umgekehrt.** Mein Satz lautete: In einer Gruppe, in der
schon eine Buchung ohne Leistung steht, sei der Preis bereits bezahlt. Zeilenlokal gerechnet gilt:

* Zeile **ohne** Leistung: trug schon einen beschrifteten Knopf → Preis **null**.
* Zeile **mit** Leistung: trug 28 px Sinnbildknopf, trägt jetzt einen beschrifteten → **die volle
  Differenz**, rund 120 px weniger Lesefläche.

Die Zeilen, von denen ich sagte, sie hätten bezahlt, sind die einzigen, die **nichts** zahlen. Die
Zusammensetzung einer Gruppe ist für die Breite einer Zeile **belanglos**.

**Was das für den Meßauftrag an visual-qa bedeutet — er ist in 11.7.1 neu geschrieben:**

1. **Gemessen wird eine Zeile, keine Gruppe.** Der teure Fall ist die **gefüllte** Zeile in ihrer
   breitesten Ausprägung. Genauer als ux-designers Fassung („eine Gruppe, in der jede Buchung ihre
   Leistung trägt"): Auch das ist noch eine Gruppenaussage; zeilenlokal zählt allein die schmalste
   Zeile.
2. **Die schmalste Lesefläche der Liste ist die `reopened`-Zeile mit `source = "Von Hand"`.** Bei
   `reopened` steht in Spalte 5 das Etikett statt `.eentry__spacer`, und der ist `width: 0`
   (`components.css:3169-3172`); „Von Hand" ist 9 Zeichen gegen 5 bei „Timer". Beides wäre unter
   einer gemeinsamen Achse in der ganzen Liste aufgegangen — zeilenlokal trifft es genau eine Zeile,
   und die ist der Meßgegenstand.
3. **Ein Thema genügt.** Breiten hängen an keinem Themenblock. 1280×720 und 1024×640 bleiben.
4. **Festzuhalten:** Pixelbreite von `.eentry__note` und Zeichen vor dem `truncate`. Schwelle
   unverändert etwa zwanzig Zeichen — aber **am schlechtesten Fall gelesen**, nicht am Mittel; bei
   zeilenlokalen Rastern bedeutet ein Mittel nichts.
5. **`.tpsegment` mitmessen.** Dort ist die Rechnung kleiner (Beschriftung wächst von 10 auf 19
   Zeichen, der Knopf war schon beschriftet), aber dieselbe Bauart.

**Wird der Rückfall wahrscheinlicher? Ja — und ich sage es vor der Messung.**

* Betroffen sind statt seltener Gruppen **fast alle Zeilen**: Die Buchung ohne Leistung ist der
  Ausnahmefall (E-034), die gefüllte ist die Regel, und genau sie zahlt.
* Der Rückfall kostet **weniger**, als 11.3 befürchten ließ. Er nimmt den sichtbaren Text auch dem
  Mangelzweig — aber der Mangel steht in derselben Zeile schon in Worten („— keine Leistung
  erfasst —", `ExportGroups.tsx:328-329`), und `secondary` gegen `ghost` bleibt. Es fällt ein
  drittes Zeichen für einen Zustand, der zwei behält, und es fällt in der einzigen Zeilenart, deren
  Spalte 6 nichts Lesenswertes enthält.
* ux-designers Wortlaute überleben ihn unverändert (als `label`), die Entscheidung „ein Baustein"
  ebenfalls. Entschieden wird er trotzdem von der Zahl, nicht von meiner Erwartung.

**Eine Falle, die die Berichtigung selbst aufmacht, ist benannt worden.** Wer liest, daß der Preis je
Zeile anfällt, kommt auf: *dann `IconButton` in den gefüllten und `Button` in den leeren Zeilen.* Das
ist O-JR wörtlich — zwei Bausteine, ausgetauschter Knoten, zerstörte Fokusrückkehr. Zulässig wäre
allein **ein** `Button` mit im gefüllten Zweig verborgener Beschriftung; das steht in 11.7.1 als
**nicht gewählt**, nicht als dritter Weg.

**Mitgenommen, weil dieselbe Messung es aufdeckte (O-JX):** 11.8 nannte **drei** Flächen desselben
Satzes, es sind **vier** — die Sperrmeldung der Gruppe in `TemplatePreview` fehlte. Nachgetragen in
der Tabelle **und** in der Reihenfolge-Zeile, nicht am Ende.

---

## 3. Zur Kenntnis genommen — und in die Abschnitte eingetragen, nicht angehängt

Der Fokusring-Tausch ist gebaut und gemessen (T-216). Ich habe die gemessenen Zahlen dort eingesetzt,
wo meine gerechneten standen:

* **10.4** trägt jetzt vier Spalten: hell/dunkel je **Lauf** und **Pixel**. Aus „~9,2" wurde 9,23
  (Lauf) und 9,24 (Pixel); aus meinen 5,99 / 6,27 wurden 5,98 / 6,26 als **Laufwerte**, während die
  Pixelwerte 5,99 / 6,27 bleiben. Der Unterschied ist keine Pedanterie, sondern die Trennung zweier
  Meßarten — und **welche Zahl in welchen Kommentar gehört, hängt davon ab, was der Kommentar
  behauptet**: Steht dort eine Zusage über die gezeichnete Naht, ist es die Pixelzahl; steht dort ein
  Paar, ist es die Zahl des Laufs. Dieser Satz steht in 10.4.
* **Der Erfolg steht bei den Zahlen, nicht in einem Bericht:** alle vier Kombinationen zeigen drei
  Zonen mit zwei deutlichen Übergängen, kleinste Naht **5,33**, und der Gefahrenknopf im hellen
  Thema geht von **1,13 auf 6,76**. Die Tabelle in 10.1 ist als „**vor** dem Tausch" gekennzeichnet,
  damit sie nicht als Beschreibung des Erzeugnisses gelesen wird.
* **Die dritte berichtigte Zahl war ein Fehler von mir, nicht eine Meßdifferenz.** In 10.11.2 stand
  als dunkler Wert **1,11**; das ist der **helle** Wert gegen **`--bg-surface`**, meine eigene
  Gegenprobe, im Themenslot verrutscht. Gemessen dunkel gegen die Leinwand: **1,15**. Eingetragen,
  mit der Lehre daneben: **Wer eine Zahl in einen Kommentar schreibt, schreibt Thema und
  Bezugsfläche dazu** — dann ist ein Rutsch lesbar statt unsichtbar. Eine Zahl, die in einer
  Vier-Felder-Tabelle eine Zelle wandert, bleibt plausibel und wird von keiner Rechnung gefangen.
* **Die methodische Falle ist eine Hausregel geworden: Regel T-6** in Abschnitt 0.1. Nach einem
  Themenwechsel **600 ms warten**, sonst mißt man eine Zwischenfarbe des Übergangs (T-216 las
  `--accent-bg` dunkel als `#5b8cf6` statt `#6091f8`). Zwei Zusätze von mir: Eine so entstandene
  Zahl ist **falsch entstanden, nicht falsch abgeschrieben** — sie überlebt jede Gegenprobe mit
  derselben Fixtur; und wo eine ältere Messung die Wartezeit nicht hatte, gilt ihr **dunkler** Teil
  als ungeprüft, der helle nicht (im hellen Thema läuft beim Laden kein Übergang). **Breiten sind
  nicht betroffen** — das ist der Grund, aus dem der Dichteauftrag in 11.7.1 mit einem Thema
  auskommt.

---

## 4. Was ich nicht getan habe

* **Kein Produktivcode.** Die Zahlen aus T-216 stehen im Quelltext bereits richtig; ich habe das
  **Papier** nachgezogen, das sie vorgegeben hatte.
* **`textbestand.md` nicht angefaßt** (ux-designers Feder, gleichzeitig in Arbeit). 15.6 ist gelesen
  und in 11.7 als Quelle genannt.
* **Keine Gestaltentscheidung aus der Dichteberichtigung gemacht.** Der Rückfall war vorab
  entschieden und bleibt es; die Messung entscheidet, nicht dieser Bericht.
