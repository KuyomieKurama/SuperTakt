# T-163 — Bestandsaufnahme des Oberflächentextes nach E-078

Aufgabe: T-163 — Bestandsaufnahme des Oberflächentextes von Takt nach E-078 (Welle X)
Status: fertig
Rolle: ux-designer

---

## Artefakte

- `docs/design/textbestand.md` — neu. Das Artefakt. Der Dateiname war frei; `docs/design/`
  existierte noch nicht und ist mit dieser Aufgabe angelegt.
- `.claude/team/reports/T-163-ux-designer.md` — dieser Bericht.

**Kein Oberflächentext geändert.** `apps/web/**` nur gelesen (frontend-dev arbeitet dort
gleichzeitig). Keine Datei des ui-designer angefasst.

---

## Zusammenfassung

Ich habe jeden Text in `apps/web/src` außerhalb von `showcase/**` aufgenommen — 436
textführende Eigenschaften in 35 Dateien, davon rund 240 Zeichenketten ab 55 Zeichen — und nach
**Sorte** geordnet statt nach Datei: neunzehn Sorten von der Navigationsbeschriftung bis zum
Titelattribut, je Sorte eine Regel mit harter Obergrenze und ein Urteil je Stelle nach dem Raster
aus E-078 Punkt 1. Die **Sperrliste** führt 21 Sätze oder Satzgruppen, die nicht ohne Zustimmung
ihres Prüfers fallen, jeweils mit Prüfpunkt (R-21, R-22, B-5, V-03/V-04, E-012, E-016, E-034,
E-074, A-18.9 bis A-18.11, A-19.5, A-19.8, S-1/S-7/S-8 aus R-2, W-7/W-11 aus R-2a, F-15, O-AF,
O-AJ, SC 4.1.2/4.1.3). Die **Streichliste** hat zehn Einträge mit ausformuliertem neuen Wortlaut
und spart zusammen rund **60 Sätze**, dreizehn native Tooltips und drei ganze Erklärkästen — der
größte Einzelposten ist die Kanban-Aufklärung, die heute an **elf** Stellen steht und auf zwei
zusammengeführt wird. Die **Umbauliste** verlegt sieben Auskünfte in den Zustand, in dem sie
gelten, statt sie zu löschen; sie nennt je Eintrag den Träger und wodurch die Information
erreichbar bleibt. Die Umsetzungsreihenfolge gliedert das in drei Wellen nach Fläche und benennt
zehn Stellen, die vorher durch spec-ux-reviewer müssen.

---

## Die drei geforderten Listen — Kurzfassung

**Sperrliste (21 Einträge).** SP-01/SP-02 die Rückfrage vor dem Dateiöffnen samt vollem Pfad
(R-21, A-A-6); SP-03 bis SP-05 die drei Fristsätze, die eine Abwesenheit aussprechen (E-074
Punkt 2 und 4, A-19.5, A-19.8, V-03); SP-06 die Bauart von `refusal` samt dauerhaft leerer
Live-Region (B-5, SC 4.1.3); SP-07 und SP-10 die Folgesätze mit Doppelabrechnungs- und
Base64-Warnung (E-012, R-10, B-5.2); SP-11 die fünf Sperrmeldungen der Hülle; SP-12 die
Nichtherunterlade-Zusage des Versionsdialogs; SP-13 die neun Absagegründe der Anhänge (R-22);
SP-14 die Beratungstexte zu Ablageorten; SP-15 der Exportachsen-Widerspruch; SP-16 die Meldung
zum aufgehobenen Erledigt-Kennzeichen (A-2.5); SP-17 die Export-Folge; SP-19 die
`disabledReason`-Sätze; SP-21 der Satz zur Suchreichweite, der nur so lange gilt, bis C-22
wiedervorgelegt und die Suche gebaut ist.

**Streichliste (nach Wirkung).** ST-05 Kanban-Aufklärung elf Stellen auf zwei (14 Sätze) ·
ST-04 dreifache Bereichsauskunft der Einstellungen (6 Sätze ersatzlos, 7 halbiert) · ST-06
Hinweise, die das Bedienelement erklären (10 Sätze) · ST-08 überflüssige Überschriften und
Einleitungen (9 Sätze, ein Erklärkasten) · ST-07 Sätze, die ihren Titel wiederholen (8 Sätze) ·
ST-01/ST-02 elf Tooltips, die die Beschriftung wiederholen · ST-03 fünf interne Kennungen
(E-054, E-055, E-047, R-10) im Oberflächentext · ST-09 Anrede, Rechtschreibung, doppelte Marken ·
ST-10 zwei Ansichtsköpfe zur Entscheidung an ui-designer.

**Umbauliste (7 Einträge, je mit Träger).** UM-01 lange Feldhinweise zustandsgebunden · UM-02
Exportachsen-Satz erscheint bei der Wahl statt davor · UM-03 Kanban-Abgrenzung nur im
Board-Leerzustand · UM-04 Statusregeln nur am gesperrten Bedienelement und im Löschdialog ·
UM-05 Entwurfshinweis nur bei vorhandenem Entwurf · UM-06 Anhangssatz nur im Leerzustand ·
UM-07 Bewegungssatz verdrängt unsere pauschale Auskunft im Toast.

---

## Vier Befunde, die über die Aufgabe hinausgehen

1. **Progressive Offenlegung hat in Takt genau drei Träger, und ein Aufklapper ist keiner
   davon.** E-076 Punkt 2 sagt wörtlich: „Es gibt in Takt keine Reiter und keine
   Aufklappabschnitte; für diese beiden Ark-Bausteine wird keine Fläche erfunden." Wer E-078
   Punkt 2 umsetzen will, arbeitet mit Zustandsbindung, Handlungsbindung oder Handbuch. Diese
   Begrenzung steht als Abschnitt 3 im Artefakt, weil sonst die halbe Umbauliste eine neue
   Entscheidung gebraucht hätte, die niemand getroffen hat.

2. **Die Prosa ist frei, die Namen sind vertraglich — gemessen.** Kein einziger Satz aus der
   Streichliste kommt in `tests/e2e` oder `apps/web/test` vor. Festgenagelt sind
   Knopfbeschriftungen, Überschriften, Dialogtitel und `aria-label` über **286** `getByRole`-
   Zugriffe (E-076 Punkt 3 nannte 222; die Zahl ist gewachsen und sollte in der Entscheidung
   nachgezogen werden). Genau **ein** Streichvorschlag berührt einen zugänglichen Namen und ist
   eigens gekennzeichnet: `Primitives.tsx:322` „Meldung schliessen" → „Meldung schließen".

3. **Fünf Stellen zeigen dem Benutzer interne Kennungen.** `TagsScreen.tsx:79` und `:612`
   („(E-054)"), `TodoDetailScreen.tsx:580` („(E-055)"), `ExportAuditScreen.tsx:174` („Maßnahme
   gegen R-10"), `labels.ts:438` („(E-047)"). Das ist die billigste Kürzung des ganzen Papiers
   und die einzige, bei der überhaupt nichts abgewogen werden muss.

4. **Eine Duz-Stelle im ganzen Produkt.** `NoteField.tsx:59` sagt „Nur für dich", während
   `TodoDetailScreen.tsx:613` denselben Platzhalter mit „Notiz für Sie selbst" überschreibt.
   Zwei Anreden für dasselbe Feld, an zwei Flächen. Beide fallen (ST-09).

---

## Annahmen

1. **Die Musterseite ist nicht Gegenstand von E-078.** `apps/web/src/showcase/**` ist seit T-057
   nicht mehr aus dem Produkt erreichbar und ist Prüfdokumentation. Ihre langen `lead`-Texte
   habe ich aufgenommen, aber nicht beurteilt — mit der Auflage, dass sie nachgezogen werden,
   wo ein Produkttext fällt (`showcase/BoardSection.tsx` ist betroffen).
2. **Zeichengrenzen sind Obergrenzen der Aussage, nicht der Darstellung.** 80 Zeichen für einen
   `lead`, 24 für einen Knopf, 100 für einen Leerzustand. Ob das in der Fläche eine oder zwei
   Zeilen ergibt, entscheidet ui-designer; ich habe nichts über Umbruch, Dichte oder Schriftgrad
   gesagt.
3. **Kein Symbol ersetzt in dieser Runde einen Text.** Ich habe die sechs Symbole benannt, die in
   Takt eine gelernte Bedeutung haben, und für sie die Bedingung festgehalten (zugänglicher Name,
   28×28). Ein siebtes einzuführen wäre Gestaltung und gehört zum ui-designer.
4. **Die Klammer aus `labels.ts:438` fällt, der Satz nicht.** Ich habe die Entfernung einer
   internen Kennung nicht als Kürzung der Aussage gewertet — sie geht trotzdem zur Kenntnis an
   spec-ux-reviewer, weil der Satz auf der Sperrliste steht.
5. **`ecc:accessibility` habe ich nicht als Fertigkeit aufgerufen**, sondern die einschlägigen
   Erfolgskriterien unmittelbar angewandt: SC 1.4.13 (Titelattribute als Erklärungsträger),
   SC 2.5.3 (Label in Name), SC 3.3.2 (Beschriftungen und Anweisungen), SC 4.1.2 und SC 4.1.3,
   SC 2.5.8, SC 1.4.1. Grund: laufende Kostenwarnung und der Zuschnitt der Aufgabe als
   Textaufnahme, nicht als Zugänglichkeitsprüfung. Wo eine Messung fehlt, steht sie als offene
   Frage unten.

---

## Risiken

1. **ST-05 ist der größte Eingriff und trifft eine Stelle, an der Takt teuer gelernt hat.** Der
   Satz „Eine Spalte ist eine Regel" steht heute an elf Stellen, weil er in R-2 (S-2) und R-2a
   (W-14) mehrfach nachgeschärft wurde. Mein Vorschlag lässt die Aussage vollständig, verlegt sie
   aber auf zwei Flächen. Wenn spec-ux-reviewer den Fall anders sieht, fällt der größte Posten
   der Streichliste weg — und die Menge, die E-078 verlangt, muss anderswo herkommen. Das ist
   der Grund, aus dem ST-05 in Welle X+3 steht und nicht in X+1.

2. **UM-01 kann Sicht und Gehör auseinanderlaufen lassen.** Ein Hinweis, der aus dem Blickfeld
   verschwindet, aber in `aria-describedby` bleibt, wäre eine zweite Anwendung — genau das, was
   R-2a in der Antwort auf T-097 Frage 3 abgelehnt hat. Ich habe die Symmetrie als nicht
   verhandelbare Bedingung ins Artefakt geschrieben; sie muss in der Umsetzung gemessen werden,
   nicht zugesichert.

3. **UM-04 hängt an einer ungeprüften Annahme.** Ein `disabled`-Knopf ist nicht fokussierbar;
   ob eine Vorlesehilfe seinen `disabledReason` überhaupt erreicht, habe ich nicht gemessen.
   Trägt er nicht, ist der gestrichene Kasten aus `StatusSettings.tsx:372-385` die einzige
   Stelle gewesen, an der die Regel für eine Vorlesehilfe stand — dann fällt UM-04 und der
   Kasten bleibt in kürzerer Form.

4. **Kein Textdurchgang ohne Gegenüber.** E-078 Punkt 4 legt die Reihenfolge fest: ux-designer,
   ui-designer, dann frontend-dev. Wenn Welle X+1 startet, bevor ui-designer für die betroffenen
   Flächen gesprochen hat, entsteht genau der Durchgang, den die Entscheidung ausschließt. ST-01
   bis ST-03, ST-07 und ST-09 halte ich für unbedenklich vorzuziehen (sie ändern keine
   Hierarchie), alles andere nicht.

5. **Sicherheitsrelevante Kürzung durch Gewöhnung.** Die Streichliste nimmt viel Text weg. Je
   ruhiger die Fläche wird, desto mehr fällt ein langer Satz auf — das ist gewollt und der
   eigentliche Gewinn. Die Gefahr liegt in der zweiten Runde: Wer nach dieser Aufgabe „auch noch
   die letzten langen Sätze" kürzen will, greift zwangsläufig die Sperrliste an. Deshalb steht
   sie mit Prüfpunkten im Artefakt und nicht als Stilnotiz.

---

## Offene Fragen an den Orchestrator

1. **Die Zahl in E-076 Punkt 3 ist veraltet.** Dort stehen 222 `getByRole`-Zugriffe; gemessen
   sind heute **286** in 27 Dateien. Soll die Entscheidung nachgezogen werden, oder gilt die Zahl
   als Zeitangabe des Befundstands?

2. **Braucht E-078 einen Nachtrag zur progressiven Offenlegung?** E-078 Punkt 2 nennt sie als
   bevorzugten Weg, E-076 Punkt 2 verbietet den naheliegendsten Träger (Aufklappabschnitt). Ich
   habe die Lücke mit den drei vorhandenen Trägern geschlossen. Wenn ein vierter gewollt ist,
   ist das eine Entscheidung und keine Umsetzungsfrage.

3. **Gilt E-078 für den Aufgabenbereich des Add-ins?** Der Fristhinweis in
   `TodoFormDialog.tsx:227` und sein Gegenstück in `apps/outlook-addin/src/ui/TaskPane.tsx` sind
   derselbe Satz in zwei Fassungen; V-03/V-04 liegen in T-165 zur Wiedervorlage. Eine gemeinsame
   Fassung wäre der richtige Zeitpunkt — sie berührt aber fremde Hoheit (integration-dev).

4. **`RULE_NOT_A_PLACE` (`labels.ts:493`) hat möglicherweise keinen Aufrufer mehr.** Ich habe die
   Konstante gefunden, aber ihre Aufrufstellen nicht abschließend gezählt. Nach E-076 Punkt 5
   fällt sie erst, wenn nachweislich keiner mehr da ist — die Messung gehört zu frontend-dev.

---

## Nächster Schritt

**Welle X+1, zwei Aufgaben parallel:**

1. **ui-designer** liest `docs/design/textbestand.md` und sagt für die Flächen der Wellen X+2
   und X+3, was der Textabbau für Hierarchie, Dichte und Sinnbilder bedeutet — insbesondere:
   Trägt eine Karte ohne Beschreibung? Trägt ein Ansichtskopf ohne `lead` (ST-10)? Bekommt der
   Zusatz in der Einstellungsschiene eine eigene Stufe, wenn `AREA_LEAD` fällt (ST-04)?
   Eigenes Artefakt unter `docs/design/`, nie dieselbe Datei.

2. **spec-ux-reviewer** nimmt in T-165 die erste Stellungnahme zu E-078 auf und beurteilt dabei
   die zehn Einträge aus Abschnitt 9, Welle X+3 — vorrangig **ST-05** (S-2 aus R-2, W-14 aus
   R-2a) und **UM-02** (S-1 aus R-2, W-7 aus R-2a), weil an ihnen die größte Menge hängt.

**Erst danach** ändert frontend-dev Text, und dann in der Reihenfolge aus Abschnitt 9 —
beginnend mit ST-01 bis ST-03, ST-07 und ST-09, die ohne Vorlage bei einem Prüfer gehen.
