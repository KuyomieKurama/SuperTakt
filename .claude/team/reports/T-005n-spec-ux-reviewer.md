# T-005n — Screen- und Zustandsmatrix, nachgezogene Fassung

Aufgabe: T-005n — Nachtrag zu T-005: Entkopplung von Erledigt und Kanban-Spalte
Status: fertig
Artefakte: `.claude/team/reports/T-005n-spec-ux-reviewer.md` (neu). `T-005-spec-ux-reviewer.md`
bleibt unverändert stehen; diese Fassung löst die unten genannten Stellen ab, alles Übrige aus
T-005 gilt weiter.
Zusammenfassung: E-023 trennt das Erledigt-Kennzeichen von der Kanban-Spalte. Damit war meine
Beschreibung von I-05 nicht nur überholt, sondern schädlich: Sie führte das richtige Verhalten —
die Karte bleibt stehen — als Bruch. Abschnitt 3.1 ist neu geschrieben, der Fehlerfall
umgedreht, S-02 als sechster Startpunkt aufgenommen (E-027). Neu in der Matrix ist die
Kanban-Karte als Träger zweier unabhängiger Zustände in allen Kombinationen. Beim Durchgehen sind
drei weitere Stellen aufgefallen, die nach T-005 durch Entscheidungen überholt wurden und die
niemand gemeldet hat, weil sie nicht im Kanban-Bereich liegen: E-016 hat meine Feldnamen abgelöst
(Vermerk und Leistung statt meiner Vorschläge), E-020 verschiebt die Rundung von der Einzelbuchung
auf die Tagesgruppe je Todo, und E-024 hat meinen Befund B-07 gegen mich entschieden. Alle drei
sind mitgezogen. Vier neue Befunde B-19 bis B-22, davon B-22 der gewichtigste.
Annahmen: Der Begriff „Abschlussspalte" verschwindet ersatzlos, auch aus den Stellen, die T-005
noch neutral verwendet hat. „Erledigt aufgehoben" bleibt sichtbar, bis der Benutzer das
Kennzeichen selbst setzt oder zurücknimmt (übernommen aus T-015, Annahme 3).
Risiken: E-020 ist in meiner Zustandsmatrix an mehreren Stellen noch nach der alten Regel
beschrieben; die Korrektur steht in Abschnitt 4.2, aber die Tagesgruppe verlangt in S-07 eine
Darstellungsebene, die es bisher nirgends gibt (B-22). Wird sie nicht gebaut, wählt der Benutzer
Buchungen aus und bekommt eine andere Anzahl Zeilen in der Datei, ohne dass ihm jemand sagt,
warum.
Offene Fragen: O-01, O-02, O-03 und O-06 sind geschlossen. O-04, O-05, O-07 und O-08 bleiben,
O-05 nur noch als Restfall. Neu: O-09 zur Sichtbarkeit ausgeblendeter erledigter Todos.
Nächster Schritt: B-22 vor T-007 entscheiden, weil es die Gliederung der Export-Ansicht bestimmt;
B-19 und B-20 gehen als Bauvorgabe an die Umsetzung.

---

## 0. Was diese Fassung an T-005 ablöst

| Stelle in T-005 | Ablösung | Grund |
|---|---|---|
| 3.1 Schritt 6 und 7 | Abschnitt 2 dieser Fassung | E-023 |
| 3.1 Startpunkt-Tabelle, Zeile S-04 | Abschnitt 2 | E-023 |
| 3.1 Startpunkte, fehlende Zeile S-02 | Abschnitt 2 | E-027 |
| 3.5 I-03, Auslöser „Ziehen in die Abschlussspalte" | Abschnitt 3 | E-023 |
| 3.5 I-14, Satz „Ablegen in der Abschlussspalte folgt I-03" | Abschnitt 3 | E-023 |
| S-09, Bereich Statusstruktur mit Markierung der Abschlussspalte | Abschnitt 3 | E-023 |
| S-04 Zustandsmatrix, Zeile Bestätigung | Abschnitt 3 | E-023 |
| S-09 Zustandsmatrix, Zeile Bestätigung, zweiter Satz | Abschnitt 3 | E-023 |
| Abschnitt 5 vollständig, Feldnamen | Abschnitt 4.1 | E-016 |
| Abschnitt 6, zwei Zeilen der Begriffsliste | Abschnitt 4.1, 6 | E-016 |
| B-15 und alle Stellen mit „00:03 → 0,25" | Abschnitt 4.2 | E-020, E-025 |
| B-07 | Abschnitt 5 | E-024 |
| Urteil | Abschnitt 8 | O-01 bis O-03 geschlossen |

Unverändert gültig: die Screens S-01 bis S-14 in Zweck, Deckung, Daten und Ausgängen, die
Zustandsmatrix außer den genannten Zeilen, die Klickpfade außer 3.1, die 19 Orte mit Exportstatus
in Abschnitt 4 von T-005, und die Befunde B-01 bis B-06, B-08 bis B-14, B-16 bis B-18.

---

## 1. Neu in der Matrix: die Kanban-Karte trägt zwei unabhängige Zustände

E-023 stellt fest, dass A-2.4 und A-5.3 verschiedene Dinge sind. Damit entsteht ein Zustandsraum,
der vorher nicht darstellbar war, weil beide Achsen als eine gedacht waren.

**Achse 1 — Statusspalte.** Frei definierbar (A-5.4), beliebig viele Werte, keiner davon
ausgezeichnet. Geändert durch Ziehen (A-5.2, I-14) oder aus dem Kartenmenü.

**Achse 2 — Erledigt-Kennzeichen.** Zweiwertig (A-2.4), mit einer dritten Anzeigeform nach A-2.5.
Geändert durch I-03, aufgehoben durch I-05.

Die Achsen sind vollständig unabhängig. **Keine Kombination ist ungültig, und die Oberfläche
leitet aus keiner Achse etwas für die andere ab.**

| # | Spalte | Kennzeichen | Bedeutung | Darstellung |
|---|---|---|---|---|
| 1 | nicht letzte, z. B. „In Arbeit" | Offen | Regelfall | Kennzeichen leise: schmale Kontur, gedämpft, Ring |
| 2 | letzte, z. B. „Erledigt" | Offen | Der Arbeitsfluss ist durch, das Todo ist es nicht — etwa weil eine Rückmeldung aussteht | Kennzeichen leise, Karte normal; **darf nicht wie ein Fehler aussehen** |
| 3 | nicht letzte, z. B. „In Arbeit" | Erledigt | Fachlich fertig, das Board wurde nicht nachgeführt | Kennzeichen laut: gefüllt, Haken, Titel durchgestrichen |
| 4 | letzte, z. B. „Erledigt" | Erledigt | Beide Achsen stimmen überein | Kennzeichen laut |
| 1a | nicht letzte | Erledigt aufgehoben | War erledigt, A-2.5 hat es aufgehoben | Gestrichelte Kontur, Rücklaufpfeil, Karte gestrichelt umrandet |
| 2a | letzte | Erledigt aufgehoben | Dasselbe, in der letzten Spalte | Ebenso; die Karte bleibt, wo sie ist |

**Vier Regeln, die daraus folgen und in der Matrix gelten:**

1. **Das Kennzeichen steht auf jeder Karte, auch wenn es „Offen" lautet.** Ein nur im Fall
   „erledigt" sichtbares Etikett zwingt den Betrachter, den Normalfall aus dem Spaltennamen zu
   erschließen — genau die Kopplung, die E-023 auflöst. Übernommen aus T-015, Annahme 1.
2. **Kombination 4 ist kein Grund für eine Regel.** Dass Spalte und Kennzeichen häufig
   übereinstimmen, verleitet dazu, das eine aus dem anderen abzuleiten. Genau das ist untersagt
   (E-023, T-015 offene Frage 2). Eine spätere Automatik wäre eine Einstellung und eine neue
   Entscheidung.
3. **Der Spaltenkopf zählt mit, wie viele seiner Todos erledigt sind.** Sonst wird die Mischung
   erst beim Lesen der einzelnen Karten sichtbar (A-13.1). Übernommen aus T-015.
4. **„Erledigt aufgehoben" hat keine eigene Statusfarbe.** Bernstein, Grün und Rosé gehören dem
   Exportstatus, Violett dem Timer; eine fünfte Farbe in derselben Zeile käme dem Exportstatus ins
   Gehege (A-6.7). Unterschieden wird über Kontur, Symbol und Kartenrand.

**Zustandsmatrix S-04, nachgezogene Zellen.**

| Zustand | Was zu sehen ist |
|---|---|
| Hover/Fokus | Zusätzlich zu T-005: Über dem Kennzeichen steht seine Bedeutung im Klartext, bei „Erledigt aufgehoben" mit Zeitpunkt und Anlass — „Am 01.09.2026 durch Start des Timers aufgehoben" (A-2.5). |
| Aktiv | Zusätzlich: Beim Ziehen bleibt das Kennzeichen der Karte unverändert sichtbar; es wandert mit und ändert sich nicht. |
| Bestätigung | **Ersetzt die Zeile aus T-005.** Ziehen in eine beliebige Spalte löst keinen Bestätigungsdialog aus und berührt weder Erledigt noch einen laufenden Timer (E-023). Ein Dialog entsteht nur bei „Als erledigt markieren" aus dem Kartenmenü und nur, wenn für dieses Todo ein Timer läuft (I-03, siehe Abschnitt 3). Löschen einer Spalte mit Karten: unverändert wie in T-005. |

---

## 2. Abschnitt 3.1 neu — I-05, Timer auf einem erledigten Todo

**Anforderung.** A-2.5 nennt drei Wirkungen. Nach E-023 lauten sie:

1. Das Erledigt-Kennzeichen wird aufgehoben.
2. Das Todo erscheint wieder in jedem Pool, dessen Tagregel seine Tags erfüllen (A-3.4).
3. Der Timer läuft.

**Was sich gegenüber T-005 geändert hat.** Die Kanban-Spalte ist keine der Wirkungen. Sie ändert
sich nicht. Wörtlich sagt A-2.5 „landet erneut in dem zuvor definierten Todo-Pool" — Pool, nicht
Spalte. Die Rückkehr in den Pool ist eine Sichtbarkeitsfrage: Pool-Ansichten blenden erledigte
Todos aus; fällt das Kennzeichen, ist das Todo wieder da (E-023).

**Startpunkte, an denen die Folge identisch sein muss — jetzt sechs.**

| Startpunkt | Beleg |
|---|---|
| S-03 Todo-Detailansicht | A-6.1, A-6.2 |
| S-04 Kanban-Karte | A-5.6 |
| S-05 Zeiterfassung | A-6.2 |
| S-01 Dashboard | §12 |
| **S-02 Todo-Liste, Zeilenaktion** | **E-027** — neu, in T-005 noch als O-03 offen |
| S-12 Add-in, beim Buchen auf ein vorhandenes Todo | A-10.9 |

**Zustandsfolge.**

1. **Ausgangszustand.** Todo T ist erledigt (A-2.4). Das Kennzeichen ist gesetzt, die Karte steht
   in irgendeiner Spalte — welcher, ist gleichgültig und wird nicht gelesen. In Pool-Ansichten
   ist T ausgeblendet.
2. **Klick auf „Timer starten".** Wartezustand an Ort und Stelle.
3. **Prüfung A-6.8.** Läuft ein anderer Timer, erscheint der kombinierte Dialog aus T-005, 3.5.
   Abbruch führt vollständig zurück zu Schritt 1.
4. **Kein Bestätigungsdialog für die Reaktivierung** (A-2.5 sagt „automatisch", unverändert
   gegenüber T-005, B-02).
5. **Wirkung 1.** Das Kennzeichen wechselt von „Erledigt" auf **„Erledigt aufgehoben"** — nicht
   auf „Offen". Die dritte Ausprägung trägt die Information, dass hier etwas zurückgenommen wurde,
   und bleibt sichtbar, bis der Benutzer das Kennzeichen selbst setzt oder zurücknimmt (T-015,
   Annahme 3). Ohne sie sähe die Karte hinterher aus, als wäre sie nie erledigt gewesen.
6. **Wirkung 2.** T erscheint wieder in jedem zutreffenden Pool. Steht der Benutzer gerade in
   einer Pool-Ansicht, erscheint es dort ohne Neuladen. Trifft es mehrere Pools, werden alle
   genannt (B-12, in T-015 umgesetzt); trifft es keinen, wird auch das gesagt.
7. **Wirkung 3.** Der Timer läuft, die globale Timerleiste zeigt Titel und Dauer (§14, A-13.4).
8. **Die Spalte ändert sich nicht — und das wird ausgesprochen.** Die Rückmeldung sagt
   ausdrücklich „Die Karte bleibt, wo sie ist." Das ist kein Beiwerk: Der Benutzer hat gerade
   gesehen, wie sich ein Kennzeichen ändert, und sucht die Karte sonst an einer anderen Stelle.
9. **Rückmeldung.** Toast und `aria-live`: „Timer gestartet. »Rechnungslauf hängt« ist wieder
   offen und zurück in den Pools »Kunde Nord« und »Prio hoch«. Die Karte bleibt, wo sie ist."
   mit „Rückgängig" (SC 4.1.3).
10. **Rückgängig.** Unverändert gegenüber T-005: solange der Toast steht, Timer stoppen, die eben
    entstandene Buchung verwerfen, Kennzeichen wieder auf „Erledigt". Das Verwerfen ist richtig,
    weil Sekunden nach E-008 als 0,25 Stunden abgerechnet würden; der Toast sagt das.

**Prüfung je Startpunkt — mit umgedrehtem Fehlerfall.**

| Startpunkt | Was sichtbar werden muss | Der Bruch |
|---|---|---|
| S-03 Detail | Kennzeichen wechselt auf „Erledigt aufgehoben"; neue offene Buchungszeile; Statusfeld **unverändert** | Ansicht arbeitet mit dem beim Öffnen geladenen Todo und zeigt weiter „Erledigt" |
| **S-04 Karte** | **Kennzeichen wechselt, Karte bleibt in ihrer Spalte, Zähler „davon erledigt" im Spaltenkopf sinkt um eins, Timerzeichen erscheint** | **Eine Umsetzung, die die Karte verschiebt — gleich wohin —, ist der Bruch. Das Stehenbleiben ist das richtige Verhalten (E-023).** |
| S-05 Zeiterfassung | Das Todo war womöglich nicht sichtbar; es muss erscheinen und in den Blick gerückt werden | Timer läuft für ein Todo, das nirgends auf dem Bildschirm steht |
| S-01 Dashboard | „erledigte Todos" minus eins, „offene Todos" plus eins, Timerkachel gefüllt | Kacheln nur beim Betreten geladen |
| **S-02 Liste** | **Zeile bleibt in der Liste; ist die Liste nach Pool gefiltert, erscheint sie jetzt darin; Kennzeichen wechselt in der Zeile** | **Zeile verschwindet oder springt, weil die Liste erledigte Todos anders einsortiert** |
| S-12 Add-in | Antwort der API enthält die Reaktivierung; dieselbe Meldung wie in der Anwendung, einschließlich des Satzes zur Spalte | Add-in meldet nur „gebucht" (B-04) |

---

## 3. Entkoppelte Stellen

**S-09, Bereich Statusstruktur.** Ersetzt den Text aus T-005: Die Spalten werden angelegt,
umbenannt, sortiert und gelöscht (A-5.4). Es gibt **keine** Markierung einer Spalte als Abschluss,
keine Spaltenrolle und keine Rückkehr-Spalte (E-023). Der Bestätigungsdialog beim Spaltenwechsel
entfällt ersatzlos; es bleibt der Dialog beim Löschen einer Spalte, in der Karten liegen.

**I-03, Todo als erledigt markieren.** Auslöser sind: Kontrollkästchen in S-02, Schalter in S-03,
Eintrag „Als erledigt markieren" im Kartenmenü von S-04. **Nicht** das Ziehen in eine Spalte.
Läuft für dieses Todo ein Timer, erscheint unverändert der kombinierte Dialog, der stoppt, die
Leistung abfragt und das Kennzeichen setzt. Verschwindet das Todo dadurch aus einer Pool-Ansicht,
sagt der Toast das und bietet Rückgängig — nach E-023 ist dieses Ausblenden der Mechanismus, über
den A-2.5 überhaupt funktioniert, und es muss deshalb sichtbar sein (siehe B-19).

**I-14, Drag & Drop.** Ersetzt den letzten Satz aus T-005: Das Ablegen ändert die Spalte und
sonst nichts. Weder Erledigt-Kennzeichen noch laufender Timer werden berührt. Die Live-Ansage
quittiert das ausdrücklich: „… Das Erledigt-Kennzeichen bleibt unverändert: offen." (T-015,
Annahme 6). Alles Übrige — Aufnehmen, Platzhalter, ungültige Ziele, Bedienung ohne Ziehen nach
SC 2.5.7 — gilt unverändert.

**Begriff.** „Abschlussspalte" wird nicht mehr verwendet, auch nicht beschreibend. Er benennt die
Sache falsch, weil er eine Auszeichnung suggeriert, die es nicht gibt. Wo eine Spalte gemeint ist,
heißt sie **Statusspalte**; wo das Kennzeichen gemeint ist, heißt es **Erledigt**. Die letzte
Spalte einer Statusstruktur ist die letzte Spalte, mehr nicht.

---

## 4. Weitere Stellen, die durch spätere Entscheidungen überholt sind

Diese drei hat niemand gemeldet, weil sie außerhalb des Kanban-Bereichs liegen. Sie sind ebenso
falsch wie die gemeldete Stelle.

### 4.1 Die beiden Notizfelder heißen jetzt Vermerk und Leistung (E-016)

Mein Vorschlag aus T-005 — „Persönliche Notiz" und „Leistungsnotiz" — ist abgelöst und war
unterlegen: Beide Namen teilen sich den Wortstamm „Notiz" und verwechseln sich unter Zeitdruck
genauso leicht wie vorher. Verbindlich sind **Vermerk** (bleibt in der Anwendung, A-7.2) und
**Leistung** (geht in den Export, A-7.4). Der JSON-Schlüssel bleibt `Notiz` (A-8.2).

Abschnitt 5 aus T-005 gilt sinngemäß weiter, mit diesen Änderungen:

- Regel 1 lautet jetzt: Kein Feld heißt „Notiz", und die beiden Namen teilen keinen Wortstamm.
- Regel 2, die dauerhaften Folgesätze, bleibt: unter dem Vermerk „Bleibt in Takt. Wird nie
  exportiert.", unter der Leistung „Verlässt Takt · steht in der Abrechnung" (Wortlaut aus T-015).
- Regel 3 wird verstärkt, weil „Leistung" allein zwar sagt, *was* im Feld steht, aber nicht,
  *wohin* es geht: gestreifte Randschiene gegen einfarbige, dazu eine gefüllte Marke unmittelbar
  vor der Beschriftung, die auch trägt, wenn das Kopfband außerhalb des Blickfelds liegt — im
  schmalen Dialog, in der gescrollten Liste, im Add-in (T-015). Damit hängt die Unterscheidung an
  sechs Merkmalen, von denen nur eines Farbe ist (SC 1.4.1).
- O-06 ist damit geschlossen.

### 4.2 Gerundet wird über die Tagesgruppe, nicht über die Einzelbuchung (E-020, E-025)

**Das macht meinen Befund B-15 in seiner Begründung richtig und in seinem Beispiel falsch.**
T-005 verlangt, überall neben einer Dauer den gerundeten Exportwert zu zeigen, und nennt als
Beispiel „00:03 → 0,25". Nach E-020 gibt es diesen Wert für eine einzelne Buchung nicht mehr:
Alle noch offenen Buchungen desselben Todos am selben Kalendertag werden addiert, dann wird die
Summe aufgerundet. Zehn, zwanzig und fünf Minuten ergeben 0,75 — nicht dreimal 0,25.

**B-15 in der nachgezogenen Fassung.** Wo eine einzelne Buchung steht (S-03, S-05, S-06), steht
ihre Dauer und **kein** eigener Exportwert, weil sie keinen hat. Der gerundete Wert erscheint an
der Tagesgruppe. Im Stoppdialog steht deshalb nicht der Wert der eben beendeten Buchung, sondern:

> Gebucht: 0:05 h. Heute für dieses Todo bisher 0:35 h offen — das ergibt beim Export **0,75**.

Drei Punkte, die dabei zu beachten sind und die alle aus E-020 folgen:

- Summiert wird nur über die **noch offenen** Buchungen der Gruppe. Ist eine von dreien bereits
  exportiert, zählt sie nicht mit. Eine Umsetzung, die das übersieht, rechnet doppelt ab.
- Der Kalendertag ist der Tag des **Timerstarts** (E-025). Eine Buchung von 23:40 bis 00:20 zählt
  vollständig zum Starttag. Zwei Buchungen um 23:50 und 00:10 liegen zwanzig Minuten auseinander
  und ergeben trotzdem zwei Gruppen und zwei Exportzeilen.
- Ein zurückgesetzter Exportstatus (E-012) bringt die Buchung in ihre Tagesgruppe zurück und
  ändert deren gerundete Summe. Der Bestätigungsdialog aus T-005, 3.2 bekommt dafür einen Satz:
  „Die Tagesgruppe dieses Todos steigt damit von 0,75 auf 1,00."

**Leistungstexte in der Vorschau (E-026, E-028).** Die Texte einer Gruppe werden nach Startzeit
sortiert und mit `"; "` verbunden; leere Segmente entfallen. Weil Takt die Grenzen kennt, das
Abrechnungstool aber nicht, **stellt die Vorschau in S-07 und S-14 die Segmente sichtbar getrennt
dar** — der Benutzer sieht vor dem Export, wie sich sein Text zusammensetzt, und kann eine
einzelne Buchung nachbessern, bevor sie zum Kunden geht (E-028). Das ist zugleich die Stelle, an
der ein Text auffällt, der selbst ein Semikolon enthält.

### 4.3 Mein Befund B-07 ist entschieden — gegen meinen Vorschlag (E-024)

T-005 B-07 verlangte, das Kennzeichen „schon einmal exportiert" strikt neben dem zweiwertigen
Badge zu führen, damit A-6.9 auch optisch zweiwertig bleibt. Der Auftraggeber hat Variante A
gesetzt: ein eigenes Etikett **„Erneut offen"**, mit Schraffur, Rücklaufpfeil und Rautenpunkt.

Das ist vertretbar, und der Einwand aus T-006 wiegt schwerer als meiner: In einer Liste mit
dreißig Zeilen muss der Fall aus R-10 auffallen, und zwei Elemente nebeneinander überliest man
eher als eines. A-6.9 bleibt gewahrt, weil das Wort „offen" im Etikett steht und der Exportmotor
„Erneut offen" wie „Offen" behandelt.

**Was als Auflage bleibt, damit das trägt:** Kein Filter, kein Zähler und keine Summe darf „Erneut
offen" als dritte Klasse führen. Der Filter „offen" in S-06 und S-07 muss beide Ausprägungen
einschließen, sonst entsteht genau die Mehrdeutigkeit, die A-6.9 ausschließt — und eine erneut
offene Buchung fiele aus dem Export heraus, was R-10 vom Kopf auf die Füße stellte. `B-07` gilt
damit als geschlossen, die Auflage läuft als **B-21** weiter.

---

## 5. Befundstand

**Geschlossen:** B-07 (durch E-024, siehe 4.3). B-12 ist in T-015 umgesetzt, bleibt aber als
Anforderung an alle übrigen Startpunkte bestehen.

**Unverändert offen aus T-005:** B-01, B-02, B-03, B-04, B-05, B-06, B-08, B-09, B-10, B-11,
B-13, B-14, B-16, B-17, B-18.

**Nachgezogen:** B-15, neue Fassung in 4.2.

**Neu:**

```
B-19  A-2.5, A-3.3, E-023  S-02, S-11, jede Pool-Ansicht
      Abweichung: Nach E-023 funktioniert A-2.5 dadurch, dass Pool-Ansichten erledigte Todos
      ausblenden. Ist dieses Ausblenden selbst unsichtbar, wird die zentrale Wirkung der
      Anforderung unerklärlich: Todos verschwinden und tauchen wieder auf, ohne dass ein Grund
      auf dem Bildschirm steht.
      Vorschlag: Jede Pool-Ansicht zeigt eine Zeile „3 erledigte Todos ausgeblendet" mit
      Schalter zum Einblenden. Beim Erledigtsetzen sagt der Toast, dass das Todo den Pool
      verlässt; beim Aufheben nach I-05, dass es zurück ist.

B-20  E-020, E-025, A-8.3  Stoppdialog, S-03, S-05, S-06, S-07
      Abweichung: Ein je Einzelbuchung angezeigter Exportwert ist nach E-020 schlicht falsch.
      Drei Buchungen von 10, 20 und 5 Minuten ergeben 0,75, nicht dreimal 0,25.
      Vorschlag: Exportwert nur an der Tagesgruppe, Wortlaut in 4.2. Wo eine Einzelbuchung
      steht, steht ihre Dauer ohne Exportwert.

B-21  A-6.9, E-012, E-024  S-06, S-07, alle Filter und Zähler
      Abweichung (Auflage aus 4.3): „Erneut offen" ist ein Anzeigezustand innerhalb von „offen".
      Wird er irgendwo als dritte Klasse geführt, fällt eine erneut offene Buchung aus dem
      Filter „offen" und damit aus dem Export.
      Vorschlag: Ein einziger fachlicher Zweiwert; die Anzeige unterscheidet, die Auswahl nicht.
      Ein Abnahmefall, der nach dem Zurücksetzen prüft, dass die Buchung in S-07 wieder in der
      Auswahl steht.

B-22  E-020, A-8.1, A-8.6  S-07
      Abweichung: Die Auswahlliste in S-07 ist nach Buchungen gegliedert, die Exportdatei nach
      Tagesgruppen. Der Benutzer wählt sieben Buchungen und bekommt drei Zeilen in der Datei.
      A-8.6 verlangt, dass die Oberfläche deutlich darstellt, was exportiert wird; eine
      Gliederung, die nicht der Ausgabe entspricht, erfüllt das nicht.
      Vorschlag: Die Auswahlliste gruppiert nach Todo und Kalendertag, mit Gruppenkopf aus
      Todo, Datum, Summe der offenen Buchungen und gerundetem Exportwert. Die Kopfzeile zählt
      beides: „7 Buchungen in 3 Exportzeilen · 2,25". Wird eine Buchung aus einer Gruppe
      abgewählt, ändert sich der Wert im Gruppenkopf sichtbar mit.
```

---

## 6. Begriffsliste, Nachtrag für T-004

Ersetzt die betroffenen Zeilen aus T-005, Abschnitt 6; alle übrigen bleiben.

| Sache | Vorschlag für die Oberfläche | Beleg |
|---|---|---|
| Internes Notizfeld am Todo | **Vermerk** | E-016 |
| Abrechnungsrelevantes Feld an der Buchung | **Leistung** | E-016 |
| Abgeschlossenes Todo | **Erledigt** — ein Kennzeichen am Todo, nie eine Spalte | A-2.4, E-023 |
| Spalte des Kanban-Boards | **Statusspalte** — nie „Abschlussspalte", nie „Done" als Fachbegriff | A-5.4, E-023 |
| Zustand nach A-2.5 | **Erledigt aufgehoben** | A-2.5, T-015 |
| Dritter Anzeigezustand des Exportstatus | **Erneut offen** — Anzeigeform von „offen", keine dritte Klasse | E-024, B-21 |
| Gruppe der Buchungen eines Todos an einem Kalendertag | **Tagesgruppe** | E-020 |
| Zeile der Exportdatei | **Exportzeile** — eine je Tagesgruppe, nicht je Buchung | E-020 |

Ausdrücklich zu streichen: **Abschlussspalte**, **Rückkehr-Spalte**, **Leistungsnotiz**,
**Persönliche Notiz**. Die ersten beiden benennen etwas, das es nicht gibt; die letzten beiden
sind durch E-016 abgelöst.

---

## 7. Offene Fragen, Stand

**Geschlossen:** O-01 und O-02 durch E-023, O-03 durch E-027, O-06 durch E-016.

**Weiterhin offen:** O-04 (laufender Timer beim Beenden der Anwendung — A-6.4 verlangt eine
Endzeit, ein offenes Ende ist kein zulässiger Zustand). O-07 (Begründung beim manuellen Markieren
als exportiert). O-08 (trifft die globale Suche auch Buchungen).

**Teilweise beantwortet:** O-05. Eine leere Leistung ist zulässig und wird beim Zusammenführen
übersprungen (E-026, E-028). Offen bleibt nur noch der Fall, dass **alle** Segmente einer
Tagesgruppe leer sind — derselbe Restfall, den T-016 als `TP-EXPORT-16c` ohne Erwartungswert
führt.

**Neu:** O-09. Sollen ausgeblendete erledigte Todos in Pool-Ansichten dauerhaft einblendbar sein,
oder nur über einen Filter erreichbar? B-19 schlägt den Schalter vor; die Entscheidung berührt
A-3.3 und ist eine Produktfrage, keine Umsetzungsfrage.

**Randnotiz zu einem gemeldeten Widerspruch.** T-016 weist darauf hin, dass E-023 in
`decisions.md` noch die abgelöste Lesart mit Rückkehr-Spalte enthalte. Im Stand vom 2026-09-01
trifft das nicht mehr zu: E-023 hält die beiden Fehlversuche fest und schließt mit der richtigen
Festlegung. Der Widerspruch ist aufgelöst, der Hinweis in `docs/testplan.md` kann entfallen.

---

## 8. Urteil

**Freigegeben.**

Die drei blockierenden Punkte aus T-005 sind geschlossen: O-01 und O-02 durch E-023, O-03 durch
E-027. Damit ist I-05 an allen sechs Startpunkten widerspruchsfrei beschreibbar, und I-03 hat
einen definierten Auslöser. Die Musterseite aus T-015 und der Testplan aus T-016 folgen bereits
der neuen Festlegung; mit dieser Fassung tut es die Zustandsmatrix auch, und die drei Artefakte
sagen wieder dasselbe.

Freigegeben mit vier Auflagen, keine davon blockierend, alle vor der jeweiligen Umsetzung zu
schließen:

- **B-22** vor T-007, weil die Tagesgruppe die Gliederung der Export-Ansicht bestimmt und sich
  später nur teuer nachrüsten lässt.
- **B-21** als Abnahmefall, weil ein falsch geführter Filter eine erneut offene Buchung
  unbemerkt aus der Abrechnung nimmt.
- **B-19** und **B-20** als Bauvorgabe an die Umsetzung der Todo-Liste und der Zeiterfassung.

Aus T-005 bleiben unverändert vor der Abnahme zu schließen: B-03, B-04, B-08, B-14, B-18.
B-07 ist entschieden und entfällt.
