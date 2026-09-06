# Benutzerhandbuch — Takt

Takt ist eine lokale Anwendung zum Verwalten von Todos, zum Erfassen von Arbeitszeit und zum
Export dieser Zeit an ein externes Abrechnungstool. Sie läuft vollständig auf dem eigenen Rechner:
keine Cloud, kein Login, keine Übertragung, außer der einen, die man selbst auslöst, wenn man
exportiert.

Begriffe in diesem Handbuch folgen `docs/glossar.md`. Zwei davon sind von Anfang an wichtig, weil
sie sich leicht verwechseln lassen:

- **Vermerk** — die persönliche Notiz an einem Todo. Sie verlässt Takt nie.
- **Leistung** — die Notiz an einer einzelnen Zeitbuchung. Sie geht beim Export an den Kunden.

Wer diese beiden vertauscht, merkt es meistens erst auf der Rechnung. Der Abschnitt „Die Leistung
einer Zeitbuchung eintragen" weiter unten erklärt, warum die Trennung so ernst genommen wird.

---

## Erste Schritte

Nach dem Start zeigt Takt zuerst das Dashboard. Links steht die Navigation, jederzeit sichtbar und
immer in derselben Reihenfolge: Dashboard, Todos, Kanban, Zeiterfassung, Buchungen, Export, Tags,
Einstellungen. Ein Klick auf einen Punkt wechselt die Ansicht, der aktuelle Punkt ist hervorgehoben.

An zwei Stellen zählt die Navigation mit: Neben „Todos" steht die Zahl offener Todos, neben
„Export" die Zahl noch nicht exportierter Buchungen. Beide Zahlen verschwinden, sobald nichts mehr
offen ist, statt eine Null anzuzeigen.

Über die Tastenkombination `Strg + K` (oder `/`, solange man gerade in keinem Eingabefeld steht)
öffnet sich die globale Suche von jeder Ansicht aus. `Escape` schließt sie wieder. Was sie findet,
steht weiter unten unter „Suchen und filtern".

## Das Dashboard

Das Dashboard gibt einen schnellen Überblick, ohne dass man dafür eine andere Ansicht öffnen muss:
den gerade laufenden Timer, die heute erfasste Arbeitszeit, noch nicht exportierte Zeiten, offene
und erledigte Todos sowie die zuletzt bearbeiteten Todos. Die wichtigsten Handgriffe, allen voran
Timer starten und stoppen, lassen sich direkt von hier aus ausführen, ohne zuerst ein Todo zu
öffnen.

Hat mindestens ein Todo eine Frist, die bereits in der Vergangenheit liegt, zeigt das Dashboard
zusätzlich eine Kachel „Überfällig" mit deren Anzahl. Ohne ein solches Todo bleibt die Kachel weg,
statt eine Null anzuzeigen. Ein Klick auf „In der Todo-Liste zeigen" öffnet die Todo-Liste bereits
auf genau diese Todos gefiltert.

Die zuletzt bearbeiteten Todos sind eine Chronik, keine gefilterte Liste: Ein erledigtes Todo wird
hier nicht ausgeblendet, sondern mit seinem Erledigt-Kennzeichen angezeigt. Das unterscheidet das
Dashboard von den Pool-Ansichten, in denen erledigte Todos standardmäßig verschwinden (siehe
„Ein Todo als erledigt markieren").

## Todos anlegen und bearbeiten

### Ein neues Todo anlegen

Ein neues Todo braucht mindestens einen Titel. Dazu lassen sich Tags vergeben und, falls
vorhanden, eine Call-Nummer eintragen, über die das Add-in oder ein Export das Todo später
wiederfindet.

Standard-Tags, die in den Einstellungen festgelegt sind, tauchen im Anlageformular selbst nicht
auf: Sie stehen dort nicht zur Auswahl, damit dieselbe Regel nicht an zwei Stellen gepflegt werden
muss. Stattdessen ergänzt Takt sie automatisch, sobald das Todo gespeichert ist, und sagt in der
Bestätigung, welche dazugekommen sind, zum Beispiel „„Rechnung prüfen" ist gespeichert. Als
Standard-Tag kam „Intern" hinzu." Das gilt auf jedem Weg, auf dem ein Todo entsteht, auch beim
Anlegen aus dem Outlook-Add-in.

Im selben Formular lässt sich auch schon eine Frist setzen, muss aber nicht; siehe „Eine Frist
setzen" weiter unten.

### Ein Todo bearbeiten

In der Detailansicht eines Todos lassen sich Titel, Tags und weitere Angaben ändern. Dort liegt
auch der Vermerk: ein Freitextfeld, das automatisch gespeichert wird und ausschließlich für die
eigene Verwendung gedacht ist. Es steht bewusst neben der Leistung der einzelnen Zeitbuchungen,
damit der Unterschied zwischen beiden auf einen Blick sichtbar bleibt.

### Ein Todo als erledigt markieren

Ein Todo lässt sich jederzeit als erledigt markieren, unabhängig von seinem Status und unabhängig
davon, in welchen Board-Spalten es gerade steht. Erledigt, Status und Board-Spalte sind drei
voneinander unabhängige Eigenschaften: Ein Todo kann den Status „Done" tragen und trotzdem nicht
erledigt sein, und ein erledigtes Todo kann weiterhin in einer Spalte stehen, die mit „Erledigt"
gar nichts zu tun hat. Keine Spalte gilt automatisch als „die Erledigt-Spalte" — nur eine Spalte,
deren Regel ausdrücklich nach „Erledigt" fragt, sammelt erledigte Todos (siehe „Wie eine Karte auf
eine Spalte kommt" weiter unten).

Solange ein Todo erledigt ist, wird es in den Pool-Ansichten standardmäßig ausgeblendet — nicht
weil es aus dem Pool entfernt wurde, sondern weil erledigte Todos dort per Voreinstellung nicht
angezeigt werden. Ein Schalter in der Filterleiste blendet sie bei Bedarf wieder ein; diese Wahl
merkt sich Takt je Ansicht.

Setzt oder hebt man das Erledigt-Kennzeichen von Hand auf, meldet Takt zugleich, ob und wo sich
dadurch etwas ändert: in welchen Pools oder Board-Spalten das Todo jetzt zusätzlich erscheint oder
aus welchen es verschwindet. Passt keine Regel auf die Änderung, bleibt die Meldung entsprechend
kurz. Was beim erneuten Starten des Timers auf einem erledigten Todo geschieht, steht weiter unten
unter einem eigenen Abschnitt, weil es der Punkt ist, an dem sich die meisten Rückfragen sammeln.

### Eine Frist setzen

Jedes Todo kann eine Frist tragen, muss aber nicht. Eine Frist ist ein Tag, keine Uhrzeit; sie
lässt sich beim Anlegen oder in der Detailansicht setzen, ändern und wieder entfernen — Letzteres,
indem man das Feld leer lässt. In der Oberfläche heißt sie ausschließlich „Frist", nicht
„Fälligkeitsdatum" und nicht „Deadline".

Solange eine Frist gesetzt ist, zeigt Takt einen von drei Zuständen: **Überfällig**, wenn der Tag
in der Vergangenheit liegt, **Heute fällig**, wenn er auf den heutigen Tag fällt, oder, wenn er
noch in der Zukunft liegt, schlicht das Datum ohne ein vorangestelltes Wort — das ist „später
fällig", nur eben ohne eigenes Ausrufezeichen auf dem Bildschirm. Ein Todo ohne Frist hat keinen
dieser Zustände und trägt auch keine leere Marke dafür. Diese Zustände werden bei jedem Blick auf
den Bildschirm neu berechnet und nicht gespeichert: Ein Todo, das gestern noch „heute fällig" war,
zeigt heute von selbst „überfällig", ohne dass irgendjemand etwas angefasst hätte.

Man sieht die Frist an zwei Stellen, ohne das Todo öffnen zu müssen: in der Todo-Liste und auf der
Kanban-Karte. In der Todo-Liste lässt sich zusätzlich nach der Frist filtern (Überfällig, Heute
fällig, Später fällig, Ohne Frist) und danach sortieren, welche Frist zuerst oder zuletzt kommt.
Ein Todo ohne Frist steht dabei in beiden Sortierrichtungen ganz am Ende, statt mit einem
erfundenen Datum irgendwo mittendrin zu erscheinen.

**Eine Frist bewegt nichts.** Sie ändert nichts an Pools, an Board-Spalten und an Zeitbuchungen und
erscheint in keinem Export. Sie ist eine reine Anzeige- und Planungshilfe — dieselbe Datentrennung
wie beim Vermerk, nur aus einem anderen Grund: Eine Frist, die von sich aus eine Karte durchs Board
schöbe, wäre eine Überraschung, keine Hilfe.

### Anhänge an ein Todo hängen

Ein Todo kann beliebig viele Anhänge tragen, in drei Arten:

- **Verweis** — eine Adresse. Ein Klick öffnet sie im Browser.
- **Datei** — ein Pfad auf dem eigenen Rechner. Ein Klick öffnet sie mit der Standardanwendung des
  Systems, genau wie ein Doppelklick im Dateimanager.
- **Bild** — Takt legt eine Kopie der Datei neben den eigenen Daten ab und zeigt sie als
  Vorschaubild. Verschiebt man später die ursprüngliche Datei, bleibt das Vorschaubild trotzdem
  erhalten, weil Takt mit der Kopie arbeitet. Ein Klick öffnet nichts nach draußen; die größere
  Ansicht bleibt innerhalb von Takt.

Beim Hinzufügen wählt man zuerst die Art, dann füllt sich das passende Feld: eine Adresse, ein
Dateipfad oder eine Bilddatei, dazu wahlweise ein Titel. Ohne Titel zeigt die Liste stattdessen ein
lesbares Stück der Adresse oder des Pfades — nie eine leere Zeile.

**Vor dem Öffnen einer Datei fragt Takt bei jedem Klick nach**, und die Frage nennt den
vollständigen Pfad und den Dateinamen: Eine Datei mit der Standardanwendung zu öffnen ist dasselbe
wie sie im Dateimanager per Doppelklick zu starten. Trägt die Datei eine Endung, mit der
üblicherweise Programme oder Befehlsfolgen laufen, sagt der Dialog das ausdrücklich, und der
Bestätigungsknopf heißt dann „Ausführen" statt „Öffnen". Diese Rückfrage lässt sich nicht
abschalten — es gibt kein Kontrollkästchen „nicht mehr fragen", und das ist Absicht: Sie ist die
letzte Gelegenheit, eine unerwartete Datei zu erkennen, bevor sie startet. Bei einem Verweis gibt
es diese Frage nicht; ein Browser zu öffnen ist der erwartete, harmlose Fall. Ein **Bild** öffnet
ohnehin nichts nach draußen, also fragt hier auch nichts.

Ein Anhang, der sich nicht mehr öffnen lässt — weil die Datei verschoben oder gelöscht wurde, eine
Adresse ungültig geworden ist oder ein Bild sich nicht mehr lesen lässt —, verschwindet nicht
einfach aus der Liste. Er bleibt stehen und sagt an seiner Stelle, was los ist.

Nichts öffnet sich von selbst: kein Vorabladen, keine Vorschau, die im Hintergrund etwas startet.
Ein Anhang öffnet ausschließlich auf einen eigenen Klick. Und wie der Vermerk gelangt kein Anhang
in einen Export — er ist Arbeitsfläche, keine Rechnungsangabe.

**Über das Outlook-Add-in entstehen keine Anhänge.** Das ist keine vorübergehende Einschränkung,
sondern Absicht: Ein Anhang, der aus einer E-Mail heraus entstünde, wäre ein von außen
geschriebener Befehl, etwas auf dem eigenen Rechner zu öffnen.

## Tags und Ordner verwalten

### Tags anlegen und einem Todo zuweisen

Tags lassen sich in beliebiger Zahl anlegen und einem Todo frei zuweisen, unter anderem für
Projekte, Kunden, Aufgabenarten, Abteilungen oder Prioritäten. Ein Todo kann beliebig viele Tags
gleichzeitig tragen.

### Tags in Ordnern organisieren

Tags lassen sich in Ordnern ablegen, und Ordner lassen sich beliebig tief ineinander verschachteln.
Ein Ordner darf dabei nicht unter einem seiner eigenen Unterordner landen: Verschiebt man ihn
versehentlich dorthin, lehnt Takt das ab und erklärt, warum: „Ein Ordner kann nicht unter einen
seiner eigenen Unterordner. Takt lehnt das ab, statt einen Zyklus anzulegen." Die Auswahl im
Verschiebedialog schließt zum jetzigen Stand nur den Ordner selbst aus, nicht seine Unterordner;
den unzulässigen Zielordner erkennt man also am Hinweis nach der Auswahl, nicht schon daran, dass
er fehlen würde.

## Todo-Pools einrichten

Ein Pool bündelt Todos über eine Regel. Diese Regel ist dieselbe Struktur wie bei den
Kanban-Spalten im übernächsten Abschnitt — ein Pool und eine Board-Spalte sind sogar dieselbe
Sache an zwei verschiedenen Stellen, siehe „Wie eine Karte auf eine Spalte kommt" weiter unten.

Eine Regel prüft bis zu fünf Bedingungen zugleich, und jede zusätzlich genannte grenzt weiter ein:

- **Erforderliche Tags** — die genannten Tags müssen vorhanden sein. Eine Einstellung legt fest,
  ob eines davon reicht („Mindestens eines davon") oder ob das Todo alle genannten tragen muss
  („Jedes der genannten").
- **Ausgeschlossene Tags** — keiner der genannten Tags darf am Todo hängen.
- **Status** — das Todo muss einen der ausgewählten Status tragen.
- **Erledigt** — nur erledigte Todos, nur unerledigte, oder beides.
- **Exportstatus** — nur Todos mit mindestens einer noch nicht abgerechneten Buchung, nur mit
  mindestens einer abgerechneten, oder beides.

Ein genannter Tag-Ordner, zum Beispiel „Kunden", steht dabei auch für alles, was unmittelbar in
ihm liegt, und, falls gewünscht, auch für seine Unterordner, beliebig tief.

Jede der fünf Bedingungen lässt sich auch auf „Alle" stellen. Das heißt nicht „trifft alles",
sondern „schränkt nicht ein" — die übrigen Bedingungen entscheiden dann allein. Stehen alle fünf
auf „Alle", ist die Regel leer und trifft deshalb **nichts**, nicht etwa alles: Eine gerade erst
angelegte Regel enthält so lange kein Todo, bis mindestens eine Bedingung genannt ist.

Wichtig zu wissen: Die Mitgliedschaft in einer Regel wird nicht gespeichert, sondern bei jeder
Anzeige neu aus den aktuellen Tags und dem aktuellen Zustand des Todos berechnet. Das ist auch der
Grund, warum ein reaktiviertes Todo ohne weiteres Zutun wieder in seinem Pool erscheint, siehe
„Was passiert, wenn der Timer auf einem erledigten Todo startet".

## Standard-Tags festlegen

In den Einstellungen lässt sich festlegen, welche Tags jedes neu angelegte Todo automatisch
bekommt, ganz gleich auf welchem Weg es entsteht, auch aus dem Outlook-Add-in. Ist noch kein Tag
angelegt, weist die Einstellungsseite darauf hin, zuerst Tags anzulegen, bevor sich einer als
Standard setzen lässt. Ist kein Standard-Tag gesetzt, entstehen neue Todos ohne Tags, und damit
passt vorerst auch keine Poolregel auf sie.

## Mit dem Kanban-Board arbeiten

### Wie eine Karte auf eine Spalte kommt

Eine Spalte des Kanban-Boards ist dieselbe Sache wie ein Pool: eine Regel mit denselben fünf
Bedingungen, die im Abschnitt „Todo-Pools einrichten" beschrieben sind. Was eine Spalte von einem
Pool unterscheidet, ist ausschließlich, wo sie erscheint — nur im Bereich der Pools, nur auf dem
Board, oder an beiden Stellen zugleich.

**Karten lassen sich nicht mehr per Drag & Drop zwischen Spalten ziehen.** Weil eine Spalte eine
Regel ist, würde ein Ziehen bedeuten, im Hintergrund heimlich Tags zu setzen oder zu entfernen,
bis die Karte in die Zielspalte passt — und genau das tut Takt nicht. Eine Karte wechselt die
Spalte stattdessen von selbst, sobald sich am Todo etwas ändert, das eine Regel abfragt: ein Tag,
der Status, das Erledigt-Kennzeichen oder der Exportstatus einer seiner Buchungen. Aus demselben
Grund kann eine Karte auch in mehreren Spalten gleichzeitig stehen, wenn sie auf mehrere Regeln
zugleich passt — das ist kein Fehler, sondern die unmittelbare Folge davon, dass Spalten Regeln
sind und keine feste Schublade.

### Eine Spalte anlegen, umbenennen oder ändern

Über „Spalten des Boards" lässt sich eine neue Spalte anlegen. Ebenso lässt sich dort eine bereits
bestehende Regel aus den Pools zusätzlich als Spalte übernehmen („Als Spalte aufnehmen") — dieselbe
Regel erscheint dann zusätzlich auf dem Board, ohne kopiert zu werden. „Vom Board nehmen" macht das
wieder rückgängig; die Regel selbst bleibt dabei vollständig erhalten, nur ihr Anzeigeort ändert
sich, und die Meldung dazu bietet einen Rückgängig-Knopf an, statt vorher nachzufragen, weil sich
die Handlung jederzeit vollständig zurücknehmen lässt.

Am Kopf jeder Spalte lassen sich zwei unterschiedliche Dinge tun, und sie heißen deshalb auch
unterschiedlich: **„Umbenennen"** ändert nur den Namen der Regel, **„Regel bearbeiten"** öffnet das
vollständige Formular mit allen fünf Bedingungen.

### Ein Todo direkt aus dem Board öffnen

Jede Karte lässt sich direkt öffnen, um das dahinterliegende Todo zu bearbeiten, ohne den Umweg
über die Todo-Liste.

### Herkunft der Spalten

Vor der ersten Veröffentlichung wies eine interne Reihenfolge jeder Karte ihren Platz in einer
Spalte zu. Diese Reihenfolge wurde aber nie tatsächlich vom Benutzer gesetzt, und die Umstellung
auf regelbasierte Spalten hat sie ersatzlos abgelöst. Jede ausgelieferte Fassung von Takt kennt
bereits ausschließlich das heutige, regelbasierte Board: Kein bestehender Datenbestand ist von
dieser Umstellung betroffen. Falls sie es doch einmal gewesen wäre: Kein Todo wäre dabei verloren
gegangen oder verschoben worden. Es bliebe mit Status, Tags und allen erfassten Zeiten vollständig
in der Todo-Liste, und der Status bliebe weiterhin eine eigene Eigenschaft des Todos, unabhängig
von der Spalte, in der die zugehörige Karte gerade steht.

## Zeit erfassen

### Den Timer starten und stoppen

Der Timer ist das Bedienelement, mit dem Arbeitszeit erfasst wird. Er lässt sich aus einem Todo
heraus, von einer Kanban-Karte oder aus der Zeile in der Todo-Liste starten und stoppen. Jeder
Stopp erzeugt eine neue Zeitbuchung mit Startzeit, Endzeit und der daraus berechneten Dauer.

Läuft der Timer kürzer als eine Sekunde, entsteht keine Buchung. Das ist der versehentliche
Doppelklick auf „Start", nicht geleistete Arbeit, und Takt meldet das auch nicht als Fehler.

### Was passiert, wenn zwei Timer gestartet werden

Es läuft immer höchstens ein Timer gleichzeitig. Startet man einen zweiten, während bereits einer
läuft, fragt Takt zuerst nach, ob der laufende gestoppt werden soll. Ohne diese Bestätigung ändert
sich nichts; wird sie erteilt, stoppt der alte Timer und der neue beginnt in einem Zug, ohne dass
dazwischen ein Moment entsteht, in dem gar kein Timer oder aus Versehen zwei Timer laufen.

### Was passiert, wenn der Timer auf einem erledigten Todo startet

Das ist der Punkt im ganzen Produkt, an dem am häufigsten nachgefragt wird, deshalb ausführlich:

Startet man den Timer auf einem Todo, das als erledigt markiert ist, hebt Takt das
Erledigt-Kennzeichen automatisch auf. Das Todo gilt danach wieder als offen und erscheint erneut
in seinen Pool-Ansichten, weil es sie durch das Erledigt-Kennzeichen nie wirklich verlassen hatte,
sondern nur ausgeblendet war.

**Der Status ändert sich dabei nicht.** Ob sich dadurch aber auch etwas an den Board-Spalten
ändert, hängt von deren Regeln ab: Fragt eine Spalte nach „Erledigt", verlässt die Karte sie in dem
Moment, in dem das Todo wieder als offen gilt; fragt eine andere Spalte nach „unerledigt", erscheint
die Karte dort neu. Das ist keine Ausnahme, sondern dieselbe Regel, die für jede andere Änderung am
Todo ebenso gilt — nur der Status selbst bleibt von einem Timerstart unberührt.

Takt meldet den Vorgang ausdrücklich, statt ihn stillschweigend zu vollziehen. Eine Meldung wie
„Timer gestartet. „Rechnung prüfen" ist wieder offen." nennt den Titel des Todos, und ein zweiter
Satz sagt dazu, in welchem Pool oder welchen Spalten es jetzt erscheint und aus welchen es
verschwunden ist — oder dass derzeit keine Regel auf das Todo passt. Ein Rückgängig-Knopf an
derselben Meldung stoppt den gerade gestarteten Timer wieder, verwirft die eben entstandene
Buchung und setzt das Todo erneut auf erledigt, falls man den Timer aus Versehen gestartet hat.

### Zeitbuchungen ansehen und filtern

Alle Zeitbuchungen lassen sich unter „Buchungen" in einer eigenen Übersicht ansehen und filtern,
unabhängig vom Todo, zu dem sie gehören.

### Die Leistung einer Zeitbuchung eintragen

Jede Zeitbuchung trägt ihr eigenes Textfeld: die Leistung. Anders als der Vermerk am Todo geht
dieser Text beim Export an das Abrechnungstool und landet damit sinngemäß auf der Rechnung des
Kunden. Ein Beispiel für einen passenden Text: „Fehleranalyse im Backend durchgeführt und
API-Response angepasst."

Diese Trennung ist die wichtigste Datenschutzgrenze in Takt, und sie ist deshalb an mehreren
Stellen zugleich abgesichert: Der Vermerk lässt sich als Quelle für eine Exportvorlage gar nicht
erst auswählen (siehe „Welche Feldquellen sich auswählen lassen"), und er wird in keiner
Abfrage mitgeführt, die zum Export führt. Für die tägliche Arbeit reicht ein einfacher Merksatz:
Ein Vermerk bleibt in Takt. Eine Leistung geht zum Kunden.

## Zeiten exportieren

### Wie Buchungen zu Tagesgruppen zusammengefasst werden

Beim Export wird nicht jede einzelne Zeitbuchung für sich behandelt. Alle noch offenen Buchungen
desselben Todos am selben Kalendertag werden zusammengefasst und ergeben genau eine Zeile in der
Exportdatei, eine Tagesgruppe. Maßgeblich für den Tag ist der Zeitpunkt, an dem der Timer
**gestartet** wurde, nicht der Zeitpunkt, an dem er gestoppt wurde. Eine Buchung, die um 23:40
beginnt und um 00:20 endet, zählt deshalb vollständig zum Starttag und wird nicht auf zwei Tage
aufgeteilt.

Ein Beispiel: Drei Buchungen auf demselben Todo am selben Tag mit 10, 20 und 5 Minuten Dauer
ergeben zusammen 35 Minuten und damit eine einzige Exportzeile mit 0,75 Stunden, nicht drei Zeilen
mit je 0,25 Stunden.

**Rundung.** Die Summe einer Tagesgruppe wird für den Export auf die nächste Viertelstunde
aufgerundet: 1,00 = 60 Minuten, 0,75 = 45 Minuten, 0,50 = 30 Minuten, 0,25 = 15 Minuten. Der
kleinste exportierbare Wert ist 0,25. Das bedeutet: Eine Minute, drei Minuten, sieben Minuten
dreißig Sekunden und fünfzehn Minuten ergeben alle 0,25, während sechzehn Minuten bereits 0,50
ergeben. Aufgerundet wird die **Summe der Tagesgruppe**, nicht jede einzelne Buchung für sich.

### Wie die Leistung einer Tagesgruppe zustande kommt

Da eine Tagesgruppe mehrere Buchungen zu einer Zeile zusammenfasst, braucht auch die Leistung
einen Weg, aus mehreren Texten einen zu machen. Die Leistungstexte der enthaltenen Buchungen werden
nach ihrer Startzeit sortiert, an den Rändern getrimmt und mit einem Semikolon verbunden. Ein
Text „Analyse gemacht" und ein zweiter „Test" werden so zu „Analyse gemacht; Test". Die einzelnen
Texte selbst werden dabei nicht verändert, auch nicht, wenn einer von ihnen bereits ein Semikolon
enthält. Buchungen ohne eigenen Leistungstext tragen nichts zu diesem verbundenen Text bei, statt
eine leere Stelle zu hinterlassen.

### Exportstatus erkennen

Jede Zeitbuchung ist zu jedem Zeitpunkt eindeutig **offen** oder **exportiert**, nie beides und nie
keins von beiden. Diese Unterscheidung ist überall sichtbar, wo Buchungen erscheinen, mit klar
unterscheidbarer Kennzeichnung.

Auf dem Bildschirm zeigt Takt vier Anzeigen dazu, obwohl es dahinter nur zwei tatsächliche Werte
gibt:

- **Offen** — noch nicht exportiert.
- **Exportiert** — bereits in einer Exportdatei enthalten.
- **Erneut offen** — eine Buchung, die offen ist, aber schon einmal exportiert war, weil ihr
  Exportstatus zurückgesetzt wurde (siehe unten). Das ist keine dritte Möglichkeit neben offen
  und exportiert, sondern eine zusätzliche Eigenschaft einer offenen Buchung: Sie zählt in jedem
  Filter und in jedem künftigen Export ganz normal als offen.
- **Nicht abgerechnet** — eine Buchung, die als „exportiert" geführt wird, obwohl sie nie in einer
  Exportdatei stand, weil jemand ausdrücklich entschieden hat, diese Zeit nicht abzurechnen (siehe
  „Zeit ausbuchen, ohne sie abzurechnen"). Auch das ist kein dritter Wert, sondern eine besondere
  Erscheinungsform von „exportiert".

Diese Unterscheidung ist wichtig, weil sie sich unmittelbar auf die Abrechnung auswirkt: Kein
Filter, keine Abfrage und keine Exportauswahl in Takt kennt mehr als die zwei tatsächlichen Werte.
Eine Buchung, deren Exportstatus zurückgesetzt wurde, geht beim nächsten Export ganz normal wieder
mit, egal ob sie als „Erneut offen" gekennzeichnet ist.

### Die Export-Vorschau: Tagesgruppen ansehen und aufklappen

Die Export-Ansicht zeigt vor dem eigentlichen Lauf eine Vorschau, gegliedert nach Tagesgruppen und
nicht nach Einzelbuchungen, denn genau eine Tagesgruppe ergibt später eine Zeile in der
Exportdatei. Jede Gruppe zeigt das zugehörige Todo, den Kalendertag, die bereits gerundete Zeit und
die zusammengeführte Leistung.

Jede Gruppe lässt sich aufklappen. Darunter erscheinen die einzelnen Buchungen mit ihrer
tatsächlichen, ungerundeten Dauer und ihrem eigenen Leistungstext. Einzelne Buchungen lassen sich
dort auch abwählen; die gerundete Zeit der Gruppe wird dann sofort neu berechnet. Nimmt man aus
einer Gruppe mit 10, 20 und 5 Minuten die mittlere Buchung heraus, fällt die gerundete Zeit von
0,75 auf 0,50, sofort sichtbar, ohne dass man dafür rechnen müsste.

### Eine Tagesgruppe ohne Leistung

Eine Tagesgruppe, deren enthaltene Buchungen alle ohne Leistungstext sind, lässt sich nicht
exportieren, weil das Abrechnungstool keine leere Notiz annimmt. Die Vorschau kennzeichnet eine
solche Gruppe und bietet an, die fehlende Leistung direkt dort nachzutragen.

Wichtig: Dieser eine Umstand hält den restlichen Export nicht auf. Alle übrigen Gruppen werden
ganz normal exportiert; nur die betroffene Gruppe bleibt offen und erscheint beim nächsten Export
wieder, bis für sie eine Leistung eingetragen wurde.

### Einen Export durchführen

Ein Export schreibt eine JSON-Datei in den eingestellten Exportordner. Der Vorgang läuft entweder
vollständig durch oder gar nicht: Entweder wird die Datei geschrieben und alle enthaltenen
Buchungen werden gleichzeitig als exportiert markiert, oder es passiert überhaupt nichts. Es gibt
keinen Zwischenzustand, in dem eine Datei existiert, ohne dass die zugehörigen Buchungen als
exportiert gelten, oder umgekehrt.

Beim ersten Export in einen neu gewählten Ordner zeigt der Bestätigungsdialog zusätzlich den Pfad
sowie den Hinweis, dass die Exportdatei lesbare Kundennotizen enthält, und verlangt ein
ausdrückliches Häkchen dafür. Bei jedem Export nennt der Dialog außerdem die Zahl der Buchungen,
die Zahl der entstehenden Exportzeilen und die Gesamtstunden, damit man vor einem Vorgang, der sich
nicht rückgängig machen lässt, sieht, worauf man sich einlässt.

### Exportvorlagen anlegen und bearbeiten

Die Struktur der Exportdatei ist nicht fest vorgegeben, sondern über Exportvorlagen einstellbar.
Eine Exportvorlage ist eine geordnete Liste von Feldern; jedes Feld hat einen frei wählbaren Namen
im JSON, eine Quelle, aus der sein Wert stammt, eine Transformation, die auf den Wert angewendet
wird, sowie optional eine Bedingung, unter der das Feld überhaupt erscheint.

Die mitgelieferte Standardvorlage bildet genau das ab, was Abschnitt 8 der Spezifikation verlangt:
die Felder `Call`, `Zeit`, `Notiz` (als Base64) und `WindowsUser`. Sie lässt sich nicht löschen,
aber kopieren, um eine eigene Fassung daraus abzuleiten. Der Vorlageneditor zeigt eine
Live-Vorschau, die sich bei jeder Änderung an der Vorlage sofort aktualisiert und dabei
tatsächlich offene Buchungen verwendet, nicht erfundene Beispieldaten. Dieselbe Vorschau, die hier
erscheint, erzeugt später auch die tatsächliche Exportdatei; es gibt also keine zweite
Berechnungsweise, die zu einem abweichenden Ergebnis kommen könnte.

### Welche Feldquellen sich auswählen lassen

Für jedes Feld einer Exportvorlage lässt sich die Quelle nicht frei eintippen, sondern nur aus
einer festen, geschlossenen Liste wählen. Der Grund dafür ist derselbe wie bei der Notiz-Trennung:
Ein frei eingebbarer Pfad wäre ein Leseweg auf praktisch alles, und jedes künftig hinzugefügte
Feld wäre darüber automatisch exportierbar, auch solche, die niemand exportieren wollte.

Seit die Tagesgruppe und nicht die Einzelbuchung die Exportzeile bildet, beziehen sich die Quellen
konsequent auf die Tagesgruppe: Es gibt zum Beispiel eine Quelle für die gerundete Zeit der Gruppe
und eine für ihre zusammengeführte Leistung, aber keine Quelle mehr für die Dauer oder die
Leistung einer einzelnen Buchung. Der persönliche Vermerk eines Todos taucht in dieser Liste nicht
auf. Das ist keine Lücke, sondern Absicht: Er lässt sich als Exportfeld gar nicht erst auswählen,
egal welche Vorlage man anlegt.

### Den Exportordner festlegen

In den Einstellungen legt man fest, in welchen Ordner Takt seine Exportdateien schreibt. Vorgabe
ist ein Ordner unterhalb des Anwendungsdatenverzeichnisses (`%LOCALAPPDATA%\Takt\` unter Windows,
`~/.local/share/takt/` sonst), ausdrücklich nicht Desktop oder Dokumente, weil beide unter OneDrive
umgeleitet sein können. Diese Vorgabe lässt sich jederzeit ändern.

**Warum Takt vor manchen Orten warnt.** Vor jedem Export prüft Takt den eingestellten Ordner
erneut: ob er existiert, ob er tatsächlich ein Ordner ist und ob hineingeschrieben werden darf.
Antwortet der Ordner nicht innerhalb von drei Sekunden, meldet Takt das als „nicht erreichbar" und
nicht als „nicht vorhanden": Das ist kein Beleg dafür, dass es den Ordner nicht gibt, bei einem
Netzlaufwerk fehlt in diesem Fall meist nur gerade die Verbindung.

Dazu kommen Hinweise, die Takt aus der Art des Ordners selbst ableitet, unabhängig vom eingetippten
Pfad: ob es sich um eine Netzfreigabe handelt, ob der Ordner auf einem Netzdateisystem liegt, ob er
zu einem Synchronisierungsdienst wie OneDrive gehört, oder ob er ein Systemverzeichnis ist. Bei
einem Synchronisierungsordner ist der Hinweis ausdrücklich eine Warnung: Die Exportdatei enthält
lesbare Kundennotizen, und über einen solchen Ordner verlässt sie den eigenen Rechner in dem
Moment, in dem sie geschrieben wird. Ein zugeordnetes Netzlaufwerk erkennt Takt dabei grundsätzlich
nicht, weil das Betriebssystem diese Auskunft nicht hergibt; eine leere Liste von Hinweisen
bedeutet deshalb „nichts gefunden", nicht „unbedenklich".

### Warum Base64 keine Verschlüsselung ist

Das Feld `Notiz` wird vor dem Export als Base64 kodiert. Das ist ein reines Kodierverfahren, kein
Schutz: Jeder, der die Exportdatei öffnen kann, kann den Inhalt ohne Weiteres zurückgewinnen und
lesen. Die Exportdatei enthält damit lesbare Kundennotizen in einer Form, die auf den ersten Blick
verschlüsselt wirkt, es aber nicht ist. Wer das für Verschlüsselung hält, geht mit der Datei
womöglich sorgloser um, als es angemessen wäre, etwa indem er sie an einen Ort legt, den mehrere
Personen einsehen können, oder sie unbedacht per E-Mail weiterleitet.

### Den Exportstatus einer Buchung zurücksetzen

Der Exportstatus einer bereits exportierten Buchung lässt sich einzeln zurücksetzen, falls eine
Buchung versehentlich exportiert wurde oder erneut abgerechnet werden muss. Das ist eine bewusste
Handlung: Ein Bestätigungsdialog erklärt, was geschieht, und verlangt in der Regel eine kurze
Begründung, weil die Buchung danach erneut in einen Export gehen kann.

Genau darin liegt das Risiko: Wird dieselbe Zeit ein zweites Mal exportiert, ist das eine
Doppelabrechnung, und sie fällt nicht von selbst auf. Deshalb protokolliert Takt jeden
Statuswechsel einer Buchung, wer ihn vorgenommen hat, wann, und mit welcher Begründung. Über
„Verlauf dieser Buchung" an der einzelnen Zeitbuchung lässt sich diese Geschichte jederzeit
vollständig einsehen, auch für eine ältere Buchung. Ein Exportprotokoll unter „Export" zeigt
zusätzlich alle Vorgänge im Überblick; „Buchungen dieses Laufs" an einem einzelnen Exportlauf
filtert dieses Protokoll auf genau diesen Lauf, allerdings nur über das, was das Protokoll gerade
geladen hat. Bei einem sehr großen oder länger zurückliegenden Lauf ist deshalb der Weg über die
einzelne Buchung der verlässlichere: Er fragt gezielt nach dieser einen Buchung und übersieht
nichts, unabhängig davon, wie viel vom Gesamtprotokoll gerade angezeigt wird.

Eine zurückgesetzte Buchung gilt wieder als offen, nicht als eigener dritter Zustand. In Listen
und Filtern bleibt sie lediglich mit dem Hinweis „Erneut offen" gekennzeichnet, damit erkennbar
bleibt, dass sie schon einmal in einem Export war, siehe „Exportstatus erkennen" oben.

### Zeit ausbuchen, ohne sie abzurechnen

Manchmal soll eine erfasste Zeit gar nicht abgerechnet werden, ohne dass sie je in einem Export
war, etwa eine interne Aufgabe oder ein Kulanzfall. Dafür gibt es einen eigenen Vorgang, „nicht
abrechnen", der die Buchung sperrt wie ein Export, ohne dass dafür eine Datei entsteht. Eine
Begründung ist dabei freiwillig, aber jeder solche Vorgang wird protokolliert. In Listen erscheint
eine so ausgebuchte Zeit mit dem Hinweis „Nicht abgerechnet", damit sie sich von einer tatsächlich
exportierten Buchung unterscheiden lässt, siehe „Exportstatus erkennen".

## Suchen und filtern

Die globale Suche findet Treffer über Todo-Titel, Call-Nummern, den persönlichen Vermerk eines
Todos und die Leistungstexte einzelner Zeitbuchungen. Sie ist damit auch die Antwort auf die Frage
„Wann habe ich zuletzt etwas zu einem bestimmten Thema geschrieben", weil sie auch in dem Text
sucht, der später auf einer Rechnung gestanden hat oder stehen wird.

Von der Suche zu unterscheiden ist der Filter: Während die Suche nach einem eingegebenen Text
sucht, schränkt der Filter eine Liste nach Kriterien wie Pool, Tag oder Status ein, unabhängig von
einem Suchtext.

## Das Outlook-Add-in nutzen

Das Add-in läuft in Outlook und erlaubt es, aus einer geöffneten E-Mail heraus ein Todo anzulegen
oder Zeit auf ein vorhandenes zu buchen, ohne zu Takt zu wechseln. Es spricht dabei ausschließlich
mit dem lokalen Dienst auf demselben Rechner, auf dem auch Takt läuft.

### Das Add-in einrichten

Das Add-in braucht zwei Angaben, um sich mit Takt zu verbinden: die Adresse des lokalen Dienstes
(in der Regel die Vorgabe `127.0.0.1:17843`, denn der Port ist kein Geheimnis) und ein
Zugangstoken. Dieses Token erzeugt man in Takt selbst, unter Einstellungen, und trägt es
anschließend im Add-in ein. Ein Klick auf „Verbindung prüfen" bestätigt, ob es angenommen wurde.
Schlägt die Prüfung fehl, nennt Takt bewusst nicht, ob das Token fehlte, falsch war oder inzwischen
durch ein neues ersetzt wurde, damit diese Auskunft nicht missbraucht werden kann, um ein gültiges
Token zu erraten.

Das Token wird ausschließlich auf diesem Rechner, in diesem Browserprofil, gespeichert, nicht im
Postfach. Wer Outlook auf mehreren Rechnern nutzt, trägt das Token deshalb auf jedem einzeln ein.

### Das Add-in-Token neu erzeugen

Ein Token lässt sich in Takt jederzeit neu erzeugen, zum Beispiel wenn der Verdacht besteht, dass
es in falsche Hände geraten ist. Der neue Wert wird dabei genau einmal im Klartext angezeigt;
danach lässt er sich nicht erneut abrufen. Die Neuerzeugung macht das bisherige Token im selben
Moment ungültig, also muss das Add-in im Anschluss mit dem neuen Wert erneut verbunden werden,
sonst schlägt jede weitere Anfrage aus dem Add-in fehl.

Das Token gilt je Rechner und Browserprofil, nicht postfachweit. Wer Outlook an mehreren Orten
verwendet, muss das neue Token entsprechend an jedem einzelnen eintragen.

### Ein Todo aus einer E-Mail anlegen

Aus dem Aufgabenbereich des Add-ins heraus lässt sich ein neues Todo anlegen, dem sich Tags
zuweisen und in der bestehenden Ordnerstruktur einordnen lassen, ebenso wie sich Angaben aus der
geöffneten E-Mail übernehmen lassen. Die dazu nötige Tag- und Ordnerstruktur ruft das Add-in beim
Öffnen direkt von Takt ab, sodass sie immer dem aktuellen Stand entspricht.

Beim Anlegen eines neuen Todos lässt sich dort ebenfalls eine Frist setzen. Anders als die
Call-Nummer sucht Takt sie nicht automatisch in der E-Mail: Sie bleibt leer, bis man sie selbst
einträgt. Wie überall in Takt ist sie ein Tag, keine Uhrzeit, und ein leeres Feld bedeutet: keine
Frist.

### Die Call-Nummer und bereits bestehende Todos

Das Add-in erkennt eine Call-Nummer in der E-Mail über einen regulären Ausdruck, der in den
Add-in-Einstellungen hinterlegt ist, nicht fest im Programm. Existiert bereits ein Todo mit
derselben Call-Nummer, bietet das Add-in an, statt eines neuen Todos auf das vorhandene zu buchen.
Diese Trefferliste zeigt zu jedem Treffer den Titel und die Call-Nummer, damit sich ein falscher
Treffer sofort erkennen lässt, und weist eigens darauf hin, wenn auf dem betroffenen Todo bereits
Zeit abgerechnet wurde oder wenn eine Buchung darauf ein bestehendes Erledigt-Kennzeichen aufheben
würde. Kein Treffer ist vorausgewählt: Die Entscheidung, ob gebucht oder ein neues Todo angelegt
wird, trifft in jedem Fall der Mensch am Bildschirm.

## Einstellungen im Überblick

Unter „Einstellungen" liegen alle dauerhaften Konfigurationen an einer Stelle: Standard-Tags,
Pools, Exportvorlagen, der Exportordner und der Zugang für das Outlook-Add-in. Zusätzlich zeigt der
Bereich „Dieser Arbeitsplatz", unter welchem Windows-Benutzernamen künftige Exporte abgerechnet
werden und wo Takt seine Datenbank auf diesem Rechner ablegt. Beide Werte kommen unmittelbar vom
Dienst und lassen sich hier nur ansehen, nicht ändern.

## Nach neuen Fassungen von Takt suchen

Beim Start und danach in regelmäßigen Abständen prüft Takt, ob auf der offiziellen GitHub-Seite
eine neuere Fassung veröffentlicht wurde. Das ist die einzige Verbindung, die Takt von sich aus
nach außen aufbaut — abgesehen davon läuft alles ausschließlich auf dem eigenen Rechner. Die
Prüfung fragt lediglich, ob es etwas Neueres gibt, und liest die Antwort; sie überträgt nichts über
Sie, Ihren Datenbestand oder Ihre Nutzung von Takt.

Findet Takt eine neuere Fassung, öffnet sich ein Dialog mit der installierten und der verfügbaren
Fassung sowie einem Verweis auf die zugehörige Release-Seite. Zwei Antworten stehen gleichwertig
zur Wahl, keine ist vorausgewählt:

- **Installieren** öffnet die Release-Seite dieser Fassung im Browser. Mehr geschieht nicht:
  **Takt lädt zu keinem Zeitpunkt selbst etwas herunter und installiert zu keinem Zeitpunkt
  etwas.** Herunterladen und Installieren sind eigene Schritte, die man auf der Release-Seite
  selbst auslöst.
- **Überspringen** merkt sich genau diese eine Fassung. Für sie erscheint der Hinweis danach nicht
  mehr — eine spätere, noch neuere Fassung meldet sich aber wieder.

Ohne eine der beiden Antworten kehrt der Hinweis beim nächsten Start von Takt zurück. Meldet sich
eine neue Fassung, während Takt schon eine Weile läuft, erscheint zunächst nur eine schmale Leiste
am oberen Rand, die sich ansehen oder wegklicken lässt, ohne mitten in der Arbeit den Fokus aus
einem gerade benutzten Eingabefeld zu nehmen.

Ist GitHub nicht erreichbar oder liefert eine unerwartete Antwort, bleibt die Prüfung **still**:
kein Hinweis, keine Fehlermeldung, kein zweiter Versuch im selben Lauf. Der Grund dafür steht im
Protokoll des lokalen Dienstes, nicht auf dem Bildschirm — ein Problem bei dieser Prüfung soll
niemanden bei der eigentlichen Arbeit aufhalten.

## Was Takt (noch) nicht tut

Ein ehrliches Handbuch nennt auch die Stellen, an denen die Anwendung weniger tut, als man
erwarten könnte. Das gilt aktuell für:

- **Standard-Tags im Anlageformular.** Sie erscheinen dort nicht als vorbelegte Auswahl und lassen
  sich vor dem Speichern auch nicht abwählen. Sie kommen erst nach dem Speichern hinzu; die
  Bestätigung nennt, welche das waren.
- **Die Zielauswahl beim Verschieben eines Tag-Ordners.** Sie schließt nur den Ordner selbst aus,
  nicht seine Unterordner. Ein unzulässiger Zyklus wird zwar zuverlässig abgelehnt, aber erst nach
  der Auswahl, nicht schon in der angebotenen Liste.
- **„Buchungen dieses Laufs" im Exportprotokoll.** Der Knopf filtert das bereits geladene
  Protokoll, nicht den gesamten Datenbestand. Bei einem älteren oder sehr großen Lauf kann das
  bedeuten, dass nicht sofort alle zugehörigen Buchungen sichtbar sind. Der verlässliche Weg für
  eine einzelne Buchung bleibt „Verlauf dieser Buchung" an der Buchung selbst.
- **Die globale Suche.** Sie liefert Treffer aus Todos und aus Zeitbuchungen gemeinsam, ohne sie
  nach Trefferart sichtbar zu gruppieren.
- **Das Outlook-Add-in.** Vermerk und Leistung sind dort zwar inhaltlich sauber getrennt (der
  Vermerk geht auch von dort nie in den Export), aber optisch noch nicht so klar unterschieden wie
  in der Hauptanwendung. Anhänge entstehen über das Add-in absichtlich nicht und sollen es auch
  nicht, siehe „Anhänge an ein Todo hängen".

Keiner dieser Punkte gefährdet die Abrechnung. Sie sind hier aufgeführt, damit niemand ein
Verhalten erwartet, das die Anwendung heute nicht zeigt.

## Begriffe

Siehe `docs/glossar.md` für die vollständige Liste der Begriffe mit ihrer Herkunft und ihrer
technischen Entsprechung.
