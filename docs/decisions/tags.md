# Tags — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-250 als Rückblick **im Quelltext** von
`apps/web/src/features/tags/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert.

## Auswählen und Aufklappen im Ordnerbaum (T-012, T-035)

`TagTree.tsx`

Bis T-035 taten Klick, Eingabetaste und Leertaste auf einem Knoten **mit
Kindern** nur eines: auf- und zuklappen. Auswählen ließ sich so ein Knoten gar
nicht — und weil Umbenennen, Verschieben und Löschen an der Auswahl hängen, war
jeder nicht leere Ordner über den Baum nicht zu bearbeiten (A-4.2, A-4.4). Jede
einzelne Funktion arbeitete; die Kette brach trotzdem.

Seither trennt der Baum beides: das Dreieck klappt, Name und Zeile wählen aus,
Pfeil rechts und links klappen, Eingabetaste und Leertaste wählen aus. Die Regel
steht weiterhin als Tafel im Quelltext, weil sie dort eine Wiederholung
verhindert.

## Eine Tag-Eingabe statt vier (T-058, T-059)

`TagInput.tsx`

Vor T-059 gab es an vier Stellen vier Arten, ein Tag zu wählen: ein Suchfeld mit
einer Chip-Wand darunter im Todo-Dialog, eine ungefilterte Chip-Wand in den
Standard-Tags, eine auf vierzig Stück gekappte Chip-Wand in der Regel eines
Pools, und in der Todo-Liste **gar keine** — der Tag-Filter ließ sich nur über
einen Klick auf ein fremdes Chip setzen. Wer vierzig Tags hat, für den war jede
dieser Stellen eine andere Aufgabe.

Die Transaktion, in der ein neu getippter Tagname zusammen mit dem Todo entsteht,
heißt seit T-058 `tagNames`.

## Die Regel hat fünf Achsen, nicht eine (E-055, T-108, W-13)

`PoolAdministration.tsx`

Bis T-108 stand im Kopf der Tag-Ansicht „eine Regel über Tags und Ordner". Das
war die halbe Wahrheit und der Grund für W-13: Drei der fünf Achsen — Status,
„Erledigt" und Exportstatus — ändern sich, ohne daß jemand ein Tag anfaßt.

## Eine Zusammenfassung statt zweier Fassungen (T-079, E-057, T-083)

`PoolAdministration.tsx`

Bis T-079 stand in der Regelliste eine zweite Zusammenfassung, die nur die
Tagliste kannte. Seit die Regel fünf Achsen hat, hätte sie eine Regel behauptet,
die es nicht gibt. Sie kommt seither aus derselben `RuleSummary` wie der
Spaltenkopf des Boards.

## Anzeigeort ändern: ein Rückweg und ein Wortlaut (T-091, T-108, W-14, S-5)

`PoolAdministration.tsx`

Bis T-091 war „Vom Board nehmen" in der Regelliste eine Sofortaktion ohne
Rückweg und auf dem Board dieselbe Handlung hinter einem Bestätigungsdialog.
Zwei Schutzniveaus für dieselbe Handlung lehren, daß eines davon bedeutungslos
ist.

Bis T-108 meldete sich dieselbe Handlung außerdem mit zwei Wortlauten: hier als
„Anzeigeort geändert." mit der Langform darunter, auf dem Board als „Spalte vom
Board genommen." mit der Kurzform — und der Rückweg quittierte hier ein zweites
Mal mit dem Titel der Handlung selbst. Wer „Rückgängig" drückte, las denselben
Satz wie zuvor und konnte nicht erkennen, ob etwas geschehen war. Titel und Zeile
kommen seither aus `poolPlacementMessage` (`lib/labels.ts`), aus **einem**
Aufruf.

## Absage des Dienstes im Löschdialog (T-097, T-102, T-118, R-2a 5.2)

`TagAdministration.tsx`

Bis T-102 wechselte nach einer Absage des Dienstes allein der Hinweistext,
während der Titel weiter „Ordner löschen?" fragte und die Hauptaktion weiter
„Löschen" hieß: eine Frage, die schon beantwortet ist, und als Antwort darauf
genau die Handlung, die eben gescheitert ist. `StatusSettings` machte es an
derselben Stelle seit T-097 richtig; zwei Muster für denselben Vorgang lehren,
daß eines davon keine Bedeutung hat.

## Woher dieses Papier kommt

T-250, erste Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie des Auftraggebers: Was erklärt, warum der heutige Code überrascht,
und was eine Wiederholung verhindert, bleibt im Quelltext; Vorgeschichte,
Aufgabennummern und Meßprotokolle stehen hier.
