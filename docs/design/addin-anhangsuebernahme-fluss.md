# Anhangsübernahme im Outlook-Aufgabenbereich — der Fluß

**Aufgabe:** T-298, **nachgezogen in T-303**. **Verfasser:** ux-designer.
**Stand:** 2026-09-11, zweite Fassung.
**Deckung:** `docs/spec.md` Abschnitt 19.5 (A-19.22, A-19.22a bis A-19.22c, A-19.23 bis
A-19.34), A-19.18, A-19.19 in der Fassung von E-108, A-10.9;
`.claude/team/decisions.md` **E-109**, E-108, E-100, E-099, E-078, E-080, E-081, E-087,
E-019; `.claude/team/risks.md` **R-28**, R-27; `CLAUDE.md` Abschnitt „Frist und Anhänge".

**Hoheit.** Dieses Papier gehört ux-designer. Es ändert `docs/spec.md` nicht, es ändert
`docs/design/textbestand-aufgabenbereich.md` nicht (dort steht die Sperrliste; die
Kandidaten aus Abschnitt 11 werden dem Halter jenes Papiers **vorgelegt**, nicht
eingetragen), und es fasst keinen Produktivcode an. Farb-, Abstands- und Dichtefragen
gehören ui-designer; dieses Papier nennt Struktur, Zustände, Wortlaut und Reihenfolge.

**Gebaut wird nach der Bewertung.** E-108 letzter Absatz nannte drei neue Wege. **Einer
davon ist mit E-109 entfallen** — das erweiterte Postfachrecht. Es bleiben zwei: die fremde
Datei im Datenverzeichnis und der Pfad aus fremder Hand am Öffnen-Befehl. Dazu ist mit dem
Nachbau ein **neuer** dazugekommen, der in E-108 noch nicht stand: ein Format, das dieser
Bestand aus fremdem Text **erzeugt** und ein anderes Programm öffnet (R-28).

---

## 0. Was E-109 an diesem Papier geändert hat — die Streichungen zuerst

`Office.context.mailbox.item.getAsFileAsync` liefert die Nachricht als EML/MIME mit dem
Mindestrecht **read item** (Mailbox 1.14). Damit fällt der ganze EWS-Weg und mit ihm der
Rechtszuwachs. `<Permissions>` bleibt `ReadItem`. A-19.32 lautet jetzt „kein weitergehendes
Recht als bisher". Die erste Fassung dieses Papiers kannte die Entscheidung nicht; sie fiel
wenige Stunden nach ihr. integration-dev ist ihr beim Bauen an vier Stellen **nicht**
gefolgt, und er hatte recht.

**Gestrichen, ersatzlos:**

| Was | Stand in Fassung 1 | Warum es fällt |
|---|---|---|
| **Z7** „Das Add-in darf jetzt mehr" | Abschnitt 8.1, eigener Zustand vor Z0 | Es gibt keinen Rechtszuwachs, den sie ankündigen könnte. Eine Fläche für eine Sache, die es nicht gibt, ist der Fehler vom 2026-09-10 in neuer Lage (E-100) |
| **Abschnitt 8.2** „Zugriff auf das Postfach (`ReadWriteMailbox`)" | dauerhafter Abschnitt in `SettingsView` | dasselbe; der Name steht seit T-300 nirgends mehr im Baum, und ein Nachweislauf hält das fest |
| **Abschnitt 4.6 (b)** „Kein EWS-Weg — `ewsUrl` fehlt" | Vorabhinweis in der Vorschau | Es gibt keinen EWS-Weg. Gibt Outlook die Nachricht nicht her, **fehlt sie nicht** — sie wird nachgebaut (A-19.22a) |
| Fehlgrund **`mailbox_closed`** | Abschnitt 6.2, Gründeliste | unerreichbar geworden. An seiner Stelle steht `rebuild_rejected` (6.2, 6.4) |
| **D-05** (kein Tokenabruf zur Vorschau) | Abschnitt 4.6 | Die Entscheidung betraf einen Abruf, den es nicht mehr gibt |
| Z4-Sonderfall **„Todo angelegt — ohne Anhänge"** | Abschnitt 6.4 | **Sachlich falsch geworden.** Die E-Mail steht immer im Plan (A-19.27); ohne Mailbox 1.8 fehlen die Dateien, die Nachricht kommt als Nachbau. Ein Todo ganz ohne Anhang entsteht auf diesem Weg nicht mehr |
| **SP-A-31** (Sperrlistenkandidat) | Abschnitt 11 | Er sicherte zu, was der Aufgabenbereich über EWS **nicht** tut. Ohne EWS sichert er nichts mehr zu |
| **AK-16** in seiner alten Fassung | „ausschließlich `GetItem` über EWS" | neu gefaßt (Abschnitt 12) |
| **R-c** in seiner alten Fassung | „`ReadWriteMailbox` trägt ein entwendetes Token weiter" | neu gefaßt (Abschnitt 13). R-26 in `risks.md` ist aus demselben Grund zurückgezogen |

**Neu hinzugekommen, und beides ist ein eigener Entwurfsgegenstand:**

1. **Der Nachbau ist ein dritter Zustand** — nicht „geklappt", nicht „etwas fehlt": da,
   vollständig im Sinne von A-19.22, und **nicht das Original**. Abschnitt 6.3a.
2. **`rebuild_rejected`** — der einzige Fall, in dem die E-Mail selbst noch fehlen kann, und
   der einzige, in dem der Benutzer nichts falsch gemacht hat und trotzdem etwas fehlt.
   Abschnitt 6.2 und 6.4.
3. **A-19.34 — die Datensicherung trägt die Dateien mit.** Sie berührt diesen Fluß nicht;
   der Aufgabenbereich sichert nichts und weiß von keiner Sicherung. **Geprüft wurde, ob
   irgendein Satz dieses Papiers etwas über die Dauerhaftigkeit der Anhänge behauptet** —
   in Fassung 1 tat es keiner. In Fassung 2 tut es **einer**, und er ist Absicht: „Die
   Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet" (6.3a). Er behauptet nicht,
   daß die Anhänge in der Sicherung liegen, sondern daß die **Kennzeichnung** hält — was
   A-19.22b verlangt und was A-19.34 möglich macht. Er hängt an AK-27, und bis dahin darf er
   nicht erscheinen.

**Unverändert geblieben** ist alles Übrige: die Zustände Z0 bis Z6, die Reihenfolge „erst
sammeln, dann anlegen", der Fortschritt je Datei, „Abbrechen", der Nachtragsweg in Z4 und
die Abwesenheitszusage darunter.

---

## 1. Nutzerziel und Erfolgskriterium

| | |
|---|---|
| **Nutzerziel** | Aus der geöffneten E-Mail ein Todo in SuperTakt anlegen, das die E-Mail und ihre Dateianhänge trägt, ohne Outlook zu verlassen und ohne hinterher raten zu müssen, was angekommen ist. |
| **Erfolgskriterium** | Nach dem Anlegen weiß der Benutzer **ohne Nachsehen in SuperTakt**, wie viele Anhänge am Todo hängen, welche es sind, ob die E-Mail darunter die ursprüngliche oder ein Nachbau ist, und — falls etwas fehlt — welche Datei fehlt und warum. Die Abnahme A-19.33 (zwei Dateianhänge → drei Anhänge) ist auf dem Bildschirm ablesbar, nicht nur in der Datenbank. |
| **Nicht-Ziel** | Anhänge an einem **vorhandenen** Todo. A-19.19 und E-108 halten diese Tür zu. Kein Zustand dieses Flusses bietet sie an, und der eine Zustand, in dem der Benutzer sie suchen wird (Z4, teilweise gelungen), sagt ausdrücklich, dass es sie nicht gibt. |

**Was der Fluß dem Benutzer kostet, und warum er es trotzdem tut.** Bis heute war „Neue
Aufgabe anlegen" ein Klick und eine Antwort in unter einer Sekunde. Künftig können
zwischen Klick und Ergebnis dreißig Sekunden liegen, und das Ergebnis kann dreiteilig
sein: Todo da, ein Anhang da, einer nicht. Der ganze Entwurf hängt an dieser einen
Änderung. Alles Weitere folgt daraus.

**Und seit E-109 gibt es eine vierte Möglichkeit, die keine der drei ist:** Alles ist da,
und eine der Dateien ist trotzdem nicht das, wofür man sie halten würde. Der Nachbau
(A-19.22a) ist kein Fehlschlag und keine halbe Sache — er ist eine Datei mit einer
Eigenschaft, die man ihr ansehen muß, weil man sie ihr sonst nicht ansieht. Wo dieser
Entwurf das sagt, steht in 4.2, 6.3a und 12 (AK-24 bis AK-27).

---

## 2. Was **vor** dem Klick feststeht — die Meßgrundlage des Entwurfs

Der teuerste Entwurfsfehler wäre, den Benutzer nach dem Klick über etwas zu belehren, was
vorher schon feststand. Office.js gibt ohne jede Netzanfrage her:

| Angabe | Quelle | vorher bekannt |
|---|---|---|
| Zahl, Name, Größe und Art jedes Anhangs | `Office.context.mailbox.item.attachments` (`AttachmentDetails`) | **ja, synchron** |
| ob ein Anhang eingebettet ist (A-19.24) | `isInline` | **ja, synchron** |
| ob ein Anhang ein Cloud-Verweis ist (A-19.25) | `attachmentType === 'cloud'` | **ja, synchron** |
| ob dieses Outlook **Dateianhänge** herausgibt | `isSetSupported('Mailbox', '1.8')` | **ja, synchron** |
| ob dieses Outlook **die Nachricht als Datei** herausgibt | `isSetSupported('Mailbox', '1.14')` | **ja, synchron** |
| ob es also ein Original oder ein Nachbau wird | dieselbe Prüfung, mit einem Vorbehalt (unten) | **ja, synchron — als Erwartung** |
| Größe der E-Mail selbst als Datei | erst die Antwort von `getAsFileAsync` | **nein** |
| ob eine einzelne Datei wirklich lesbar ist | erst `getAttachmentContentAsync` | **nein** |
| ob der **Nachbau** gelingt | erst seine eigene Formprüfung (A-19.22c) | **nein** |

Daraus die Leitlinie, die die Fragen 4 und 5 der Aufgabenstellung beantwortet:

> **Was ohne Kosten vorher feststeht, steht vorher da. Alles Übrige steht im Ergebnis —
> und zwar vollständig, auch wenn es vorher schon dastand.**

Die Wiederholung ist Absicht und kein D-Befund im Sinne von `textbestand.md`: Die
Vorschau sagt, was **geplant** ist, das Ergebnis sagt, was **geschehen** ist. Die beiden
Sätze stehen nie gleichzeitig auf dem Bildschirm, und A-19.29/A-19.30 verlangen die
Nennung im Ergebnis ausdrücklich — eine Vorschau, die der Benutzer weggescrollt hat,
erfüllt sie nicht. Dasselbe Argument wie E-031: Die Umformung darf zwischen Auswahl und
Ergebnis nicht verschwinden.

**Der Vorbehalt beim Nachbau, und er ist die Grenze derselben Leitlinie.** Fehlt Mailbox
1.14, steht vor dem Klick fest, daß es ein Nachbau wird — die Vorschau sagt es. Ist 1.14 da,
kann der Abruf trotzdem fehlschlagen und in den Nachbau fallen; dann sagt es **nur** das
Ergebnis. Die Vorschau nennt in diesem Fall „Die E-Mail selbst" ohne Zusatz und irrt sich
gegebenenfalls. Das ist zulässig und der Unterschied, der diesen Entwurf trägt: **Eine
Vorschau, die irrt, ist etwas anderes als eine, die lügt.** Sie darf sich in die sichere
Richtung irren — sie darf nie ein Original ankündigen und stillschweigend einen Nachbau
liefern, und genau deshalb steht der Nachbau im Ergebnis **immer** dabei.

---

## 3. Informationsarchitektur — wohin die neue Fläche kommt

Der Aufgabenbereich ist 320 bis 450 Pixel breit und hat heute diese Reihenfolge
(`TaskPane.tsx`):

```
Aus dieser E-Mail        Betreff, Von
Call-Nummer              Erkennung, Feld, Hinweis
[Duplikathinweis]        A-10.9 — nur Hinweis, keine Handlung
[Fehlerfläche]
Neues Todo               Titel, Frist, Tags, Vermerk, „Inhalt der E-Mail übernehmen"
────────────────────────
[Sperrgrund]             create-gate
Neue Aufgabe anlegen
```

**Neu ist genau ein Abschnitt, und er steht unmittelbar über der Aktionszeile:**

```
Neues Todo               … unverändert …
Anhänge aus dieser E-Mail   ← NEU (Abschnitt 4)
────────────────────────
[Sperrgrund]
Neue Aufgabe anlegen
```

Drei Gründe für genau diese Stelle:

1. **Er beschreibt, was der Knopf darunter tut.** Ein Benutzer, der auf den Knopf blickt,
   hat ihn im selben Blickfeld (AB-1 aus `textbestand-aufgabenbereich.md`: In dieser
   Breite sind Überschrift und Fläche darunter nie zwei Bildschirmseiten auseinander).
2. **Er ist kein Eingabefeld.** Er gehört nicht in „Neues Todo", wo jede Zeile etwas
   ist, das der Benutzer setzt. Hier setzt er nichts — die Übernahme ist automatisch
   (E-108, Auftraggeber). Ein eigener Abschnitt sagt das durch seine Form.
3. **Er verdrängt „Aus dieser E-Mail" nicht.** Oben steht, woher das Todo kommt; unten
   steht, was mitkommt. Zwei verschiedene Aussagen, zwei Orte.

**Was ausdrücklich nicht geändert wird:** die Knopfbeschriftung **„Neue Aufgabe anlegen"**.
Sie ist in E-100 Punkt 6 vom Auftraggeber selbst gesetzt; ein „Neue Aufgabe mit 3 Anhängen
anlegen" wäre eine Textänderung, die nach E-087 eine Suche über den Wortlaut und nach
E-078 Punkt 3 die Zustimmung ihres Setzers braucht. Die Zahl steht eine Zeile darüber und
kostet den Knopf nichts.

---

## 4. Der Abschnitt „Anhänge aus dieser E-Mail" (Zustand Z0)

### 4.1 Aufbau

```
Anhänge aus dieser E-Mail
Daraus entstehen 3 Anhänge am neuen Todo.
  • Die E-Mail selbst
  • Angebot.pdf · 1,2 MB
  • Skizze.png · 340 KB
```

- **Zeile 1** ist die Bereichsüberschrift, sie benennt den Bereich und behauptet nichts
  (Regel A-01 aus `textbestand-aufgabenbereich.md`).
- **Zeile 2** ist die berechnete Bereichszeile. Sie trägt die Zahl, die hinterher im
  Ergebnis wiederkommt und die A-19.33 mißt.
- **Die Liste** ist Daten, keine Prosa. Sie zählt in der Reihenfolge, in der übernommen
  wird: die E-Mail zuerst, dann die Dateianhänge in der Reihenfolge von Outlook.

**Die E-Mail steht ohne Größe da.** Ihre Größe als Datei kennt der Aufgabenbereich vor dem
Abruf nicht, und eine geschätzte Zahl an dieser Stelle wäre eine Behauptung über eine
Datei, die es noch nicht gibt.

### 4.2 Die Zeile je Anhang

| Fall | Zeile | Entscheidung |
|---|---|---|
| die E-Mail, Original erwartet | `Die E-Mail selbst` | ohne Zusatz und ohne Größe (4.1) |
| die E-Mail, Nachbau steht fest | `Die E-Mail selbst · wird aus den Angaben der Nachricht nachgebaut` | siehe unten |
| gewöhnliche Datei | `Angebot.pdf · 1,2 MB` | Name **ungekürzt**, Endung immer sichtbar (Abschnitt 9.3) |
| Cloud-Anhang (A-19.25) | `Vertrag.docx · Verweis auf den Ablageort` | Keine Größe — es wandert kein Byte, sondern eine Adresse |
| über der Grenze je Datei (A-19.30) | `Video.mp4 · 31,4 MB — zu groß (31,4 MB). Die Grenze liegt bei 25,0 MB je Datei.` | **vorher**, siehe 4.3 |
| über der Gesamtgrenze | `Anlage7.zip · 12,0 MB — über der Gesamtgrenze. Zusammen dürfen die Dateien einer E-Mail 48,0 MB nicht überschreiten.` | **vorher**, siehe 4.3 |
| über der Anzahlgrenze | `Anlage31.pdf · 90 KB — über der Anzahlgrenze. Je E-Mail werden höchstens 25 Dateien übernommen.` | **vorher**, siehe 4.3 |
| eingebettetes Bild (A-19.24) | *erscheint nicht* | Kein Eintrag, keine Fußnote, keine Zahl. Ein Signaturbild ist kein Anhang, und eine Zeile darüber wäre eine Erklärung für ein Nichtereignis |

Größen mit einer Nachkommastelle und Komma: `340 KB`, `1,2 MB`, `31,4 MB`. Unter 1 KB:
`< 1 KB`.

**Warum der Nachbau in der Vorschau nur diesen halben Satz bekommt.** „wird aus den Angaben
der Nachricht nachgebaut" sagt drei Dinge auf einmal: daß etwas gebaut wird, woraus, und
daß es nicht das Original ist. Es sagt sie in der Form einer Angabe, nicht in der Form
einer Warnung — vor dem Klick ist nichts geschehen und nichts schiefgegangen. Der ganze
Satz, mit dem, was drin steht und was nicht, gehört ins **Ergebnis** (6.3a): Dort ist die
Datei entstanden, dort hat die Auskunft einen Träger, und dort steht sie noch, wenn der
Benutzer sie drei Wochen später sucht. Eine Vorschau, die den langen Satz trüge, träfe
den Benutzer mit alter Outlook-Fassung bei **jeder** E-Mail, auch bei jeder, aus der er
nie ein Todo macht.

### 4.3 Zu groß — die Antwort auf Frage 4: **vorher**, und hinterher noch einmal

Die Größe steht in `AttachmentDetails.size`, synchron, ohne Abruf. Die Prüfung kostet
nichts, also gibt es keinen Grund, den Benutzer erst dreißig Sekunden warten zu lassen und
ihm danach zu sagen, was schon vor dem Klick feststand. Die Zeile steht **immer**
ausgeschrieben mit Größe und Grenze; sie ist der einzige Eintrag, der die Bereichszeile
ergänzt:

```
Anhänge aus dieser E-Mail
Daraus entstehen 3 Anhänge am neuen Todo. 1 Datei wird übersprungen.
  • Die E-Mail selbst
  • Angebot.pdf · 1,2 MB
  • Skizze.png · 340 KB
  • Video.mp4 · 31,4 MB — zu groß (31,4 MB). Die Grenze liegt bei 25,0 MB je Datei.
```

Die übersprungene Datei erscheint **zusätzlich** im Ergebnis (Z4), namentlich und mit
Grund — A-19.30 verlangt das und nennt A-19.29 als Ort. Die Vorschau entbindet davon
nicht.

Ein Häkchen „trotzdem übernehmen" gibt es nicht. Die Grenze ist eine Systemgrenze
(E-108 Punkt 3, dritte Ausnahme von B-1.7) und keine Vorliebe.

**Drei Grenzen, nicht eine** (nachgetragen in T-303, gemessen an `packages/domain`): je
Datei **25 MB**, in der Summe **48 MB**, höchstens **25 Dateien** je E-Mail. Alle drei sind
vor dem Klick prüfbar, alle drei stehen deshalb hier und nicht erst im Ergebnis, und alle
drei tragen einen **eigenen** Satz. Die Zahlen stehen in keiner Oberflächendatei: Sie kommen
aus der Antwort des Dienstes, weil eine ausgeschriebene 25 im Add-in die zweite Wahrheit
über eine Grenze wäre, die ein anderer durchsetzt. Damit sind **F-01 und F-03 beantwortet**
(Abschnitt 13).

### 4.4 Lange Listen

Bis **sechs** Einträge steht die Liste ganz da. Ab sieben stehen die ersten fünf plus ein
Knopf:

```
  • …
  Alle 17 Anhänge anzeigen
```

**Ausnahme, die die Regel trägt:** Einträge mit einer Abweichung — zu groß, Cloud-Verweis —
stehen **immer** sichtbar, nie hinter dem Knopf. Verborgen wird nur das Erwartbare. Sonst
wäre die Vorschau genau in dem Fall stumm, für den sie gebaut ist.

Der Knopf ist ein `<button>` mit Tastaturfokus, kein `title`, kein Hover-Aufklapper
(Regel S-16, siehe ST-A-03 drüben).

### 4.5 Keine E-Mail-Anhänge (A-19.27)

```
Anhänge aus dieser E-Mail
Daraus entsteht 1 Anhang am neuen Todo.
  • Die E-Mail selbst
```

**Dieser Abschnitt hat keinen Leerzustand.** A-19.27 garantiert mindestens einen Eintrag.
Das ist keine Nachlässigkeit des Entwurfs, sondern eine Folgerung aus der Anforderung, und
sie steht hier, damit niemand später einen Leerzustand nachrüstet, der nie erreichbar ist.

### 4.6 Die alte Outlook-Fassung — die Antwort auf Frage 5, in der Fassung nach E-109

**Neu gefaßt in T-303. Fall (b) ist ersatzlos gestrichen** — es gibt keinen EWS-Weg mehr,
also auch kein Postfach, das ihn verweigern könnte. Es bleibt **ein** Fall, und er ist
synchron erkennbar, steht deshalb **vor** dem Klick da:

**Outlook zu alt für die Dateianhänge** — `isSetSupported('Mailbox','1.8')` ist falsch:

```
Anhänge aus dieser E-Mail
Daraus entsteht 1 Anhang am neuen Todo. 2 Dateien werden übersprungen.
  • Die E-Mail selbst · wird aus den Angaben der Nachricht nachgebaut
  • Angebot.pdf · 1,2 MB — dieses Outlook gibt Anhänge nicht heraus.
  • Skizze.png · 340 KB — dieses Outlook gibt Anhänge nicht heraus.
Nötig ist Outlook mit Mailbox-Anforderungssatz 1.8.
```

**Drei Änderungen gegenüber Fassung 1, und jede ist eine Berichtigung, keine Verfeinerung:**

1. **Die E-Mail fehlt hier nicht.** Der alte Satz „aber ohne die E-Mail und ohne ihre
   Dateien" ist seit E-109 **falsch**: Fehlt 1.8, fehlt auch 1.14, also wird die Nachricht
   nachgebaut — und der Nachbau braucht nur Office.js-Felder, die es seit 1.1 gibt. Das
   Todo bekommt genau einen Anhang, und das ist nach A-19.27 ein vollständiges Ergebnis,
   kein halbes.
2. **Kein Warnzeichen und kein eigener Warnblock mehr.** Die alte Fläche stand als
   Achtungsfläche über der Liste. Sie kann jetzt in die Liste, weil sie dasselbe ist wie
   „zu groß": eine Datei, die nicht mitkommt, mit Grund dahinter. Zwei Darstellungsformen
   für dieselbe Sache wären eine Erklärung dafür, daß es sich um zwei Sachen handelt.
3. **Die Fassungsangabe steht eine Zeile tiefer, nicht im selben Satz.** Sie gehört zu
   allen betroffenen Zeilen und zu keiner einzelnen; im Satz stünde sie so oft da, wie die
   E-Mail Anhänge hat.

**Was vor dem Klick nicht feststeht, bleibt draußen:** ob `getAsFileAsync` bei vorhandener
Fassung 1.14 wirklich liefert, und ob der Nachbau seine eigene Formprüfung besteht
(A-19.22c). Beides steht im Ergebnis (6.3a, 6.4) und nirgends sonst.

**Kein stiller Ausfall** (A-19.31). Auch dieser Fall landet **zusätzlich** im Ergebnis — die
Vorschau ersetzt die Nennung nicht.

### 4.7 Die Grenze zum Manifest — ein Satz, der den ganzen Fall trägt

Der Anforderungssatz im Manifest bleibt bei `MinVersion="1.1"`. Er wird **weder auf 1.8
noch auf 1.14** angehoben. Würde er es, verweigerte Outlook älterer Fassung die
Installation ganz — und dann gäbe es keinen Aufgabenbereich, kein Todo und keinen Satz, der
sagt, was fehlt. A-19.31 verlangt das Gegenteil: „entsteht das Todo trotzdem". **Beide
Fähigkeiten werden zur Laufzeit geprüft, nicht im Manifest gefordert.** Die Bridge macht es
ebenso (`email-attachments.ts`, Kommentarkopf) — nur degradiert sie danach **still**, und
genau das ist nach A-19.31 verboten.

**Und `<Permissions>` bleibt `ReadItem`** (A-19.32 in der Fassung von E-109). Das ist keine
Nebenbemerkung des Manifests, sondern der Grund, warum Abschnitt 8 dieses Papiers heute
leer ist: Kein Recht wächst, also gibt es nichts anzukündigen.

---

## 5. Die Zustandsmaschine

### 5.1 Zustände

| # | Zustand | Was der Benutzer sieht | abbrechbar |
|---|---|---|---|
| **Z0** | **Formular** | Die Fläche aus Abschnitt 3 und 4 | — |
| **Z1** | **Übernahme läuft** | Fortschrittsfläche (5.3), Knopf „Abbrechen" | **ja** |
| **Z2** | **Todo wird angelegt** | Dieselbe Fläche, Statuszeile wechselt, **kein** Abbrechen | nein |
| **Z3** | **Fertig, vollständig** | Erfolgsfläche mit Liste (6.3) | — |
| **Z3a** | **Fertig, vollständig, E-Mail nachgebaut** | Erfolgsfläche im **Erfolgston**, mit Kennzeichnung an der Zeile und einem Absatz darunter (6.3a) | — |
| **Z4** | **Fertig, unvollständig** | Ergebnisfläche im Warnton (6.4) | — |
| **Z5** | **Fehlgeschlagen** | Fehlerfläche, Formular steht wieder da (6.5) | — |
| **Z6** | **Abgebrochen** | Formular mit Abbruchhinweis (6.6) | — |
| ~~Z7~~ | ~~Erstbenennung des Rechts~~ | **gestrichen in T-303** — es gibt keinen Rechtszuwachs (E-109, Abschnitt 0 und 8) | — |

Die Vorzustände des Bereichs — „Wird geladen", „Kein Outlook", „Keine E-Mail geöffnet",
„Noch nicht verbunden" — bleiben unverändert und liegen vor Z0.

**Z3a ist kein eigener Zweig der Maschine, sondern eine Ausprägung von Z3.** Das ist eine
Entscheidung und keine Sparsamkeit: Ein eigener Zustand hieße, der Nachbau sei ein anderer
Ausgang als der Erfolg. Er ist es nicht — nichts ist fehlgeschlagen, nichts fehlt, die
Zahl aus A-19.33 stimmt. Was ihn von Z3 unterscheidet, ist eine **Eigenschaft der Datei**,
und die trägt die Datei, nicht der Zustand. Wo Z3a trotzdem eigens genannt wird, geht es
um den Wortlaut und nicht um den Übergang.

### 5.2 Übergänge

| Von | Auslöser | Nach | Rückmeldung |
|---|---|---|---|
| Z0 | Klick „Neue Aufgabe anlegen" (Sperre offen) | **Z1** | binnen 100 ms: die Aktionszeile wird zur Fortschrittsfläche, Statuszeile spricht |
| Z1 | jeder Anhang ist versucht | **Z2** | Statuszeile: „Das Todo wird angelegt …" |
| Z1 | Klick „Abbrechen" | **Z6** | sofort; spätere Rückläufer ändern nichts mehr |
| Z1 | Outlook wechselt die geöffnete Nachricht | **Z6** | wie Abbruch, mit eigenem Satz (6.6) |
| Z2 | Dienst antwortet mit Erfolg, **kein** Anhang fehlt | **Z3** bzw. **Z3a** | Erfolgsfläche; ist die E-Mail ein Nachbau, trägt die Fläche die Kennzeichnung (6.3a) |
| Z2 | Dienst antwortet mit Erfolg, mindestens ein Anhang fehlt | **Z4** | Ergebnisfläche im Warnton |
| Z2 | Dienst antwortet mit Fehler | **Z5** | Fehlerfläche, **kein** Todo |
| Z3/Z4 | Klick „Noch etwas aus dieser E-Mail" | **Z0** | Formular zurückgesetzt, Vorschau neu berechnet |
| Z5/Z6 | Klick „Neue Aufgabe anlegen" | **Z1** | neuer Versuch |

**Es gibt keinen Übergang von Z3 oder Z4 zu einer Nachübernahme.** Das ist die Tür aus
A-19.19, und ihr Fehlen wird in Z4 ausgesprochen statt verschwiegen (6.4).

### 5.3 Die Reihenfolge — erst sammeln, dann anlegen

**Entschieden, ohne zu fragen (D-01):** Der Aufgabenbereich sammelt **zuerst** alle
Anhänge ein und legt das Todo **zuletzt** an, in einem Zug.

Drei Gründe, und der erste ist der tragende:

1. **Nur so ist „Abbrechen" harmlos.** Wer erst anlegt und dann anhängt, erzeugt mit dem
   Abbruch genau den Zustand, den dieser Entwurf möglichst selten sehen will: ein Todo mit
   halben Anhängen. Erst sammeln heißt: bis zum letzten Schritt existiert nichts, und der
   Abbruch hinterlässt nichts.
2. **Es gibt keinen Zwischenzustand, der aus der Anwendung heraus sichtbar wäre.** Ein
   Benutzer, der währenddessen in SuperTakt schaut, sieht kein halbfertiges Todo
   auftauchen und wieder wachsen.
3. **A-19.29 bleibt erfüllbar.** Ein einzelner gescheiterter Anhang bricht die übrigen
   nicht ab; die Liste der Fehlgründe ist vollständig, **bevor** der Anlegeruf hinausgeht,
   und kann mit ihm zusammen ins Ergebnis wandern.

**Der Preis, benannt:** Scheitert der Anlegeruf am Ende (Z5), war das Sammeln umsonst. Der
Aufgabenbereich hält die eingesammelten Dateien deshalb bis zum nächsten Versuch bereit
und lädt sie nicht noch einmal herunter (AK-14). Ausgesprochen wird das **nicht** — ein
Satz über eine Bequemlichkeit, die der Benutzer ohnehin nur als kürzere Wartezeit
bemerkt, ist Text ohne Träger.

**Was dieser Entwurf offenlässt und nicht offenlassen darf:** wo die Bytes zwischen
Abruf und Anlegen liegen. Zwei Bauarten erfüllen den Fluß, und die Wahl gehört nicht mir
(F-02 in Abschnitt 12).

---

## 6. Wortlaut je Zustand

Jeder Satz hier ist Entwurf, nicht Beschreibung. Platzhalter in `«»`.

### 6.1 Z1 — während der Übernahme (Antwort auf Frage 1)

```
Anhänge werden übernommen
Anhang 2 von 4 wird übernommen.                      ← role="status"
  ✓ Die E-Mail selbst
  … Angebot.pdf · 1,2 MB
  · Skizze.png · 340 KB
  ⊘ Video.mp4 — zu groß, übersprungen

  [ Abbrechen ]
Das Todo entsteht erst, wenn alle Anhänge übernommen sind. Abbrechen legt nichts an.
```

**Ein Fortschritt je Datei, kein Kreisel** (D-02). Er ist hier **nicht** teuer: Namen,
Größen und die Reihenfolge stehen schon vor dem Klick fest (Abschnitt 2). Es gibt nichts
zu ermitteln, nur einen Zustand je Zeile zu wechseln — die Liste aus Z0 bleibt stehen und
bekommt je Zeile ein Zeichen. Ein Kreisel wäre dieselbe Fläche mit weniger Wahrheit.

**Keine Prozentanzeige.** `getAttachmentContentAsync` liefert eine Datei in einem Stück;
eine Prozentzahl innerhalb einer Datei wäre erfunden. Gezählt werden ganze Anhänge.

**Vier Zeilenzustände, jeder mit einem Wort und nicht nur einem Zeichen** (WCAG 1.4.1):

| Zeichen | Zugänglicher Text der Zeile | Bedeutung |
|---|---|---|
| `·` | „steht an" | noch nicht begonnen |
| `…` | „wird übernommen" | läuft |
| `✓` | „übernommen" | fertig |
| `⊘` | „übersprungen" / „nicht übernommen" | mit Grund dahinter |

**Abbrechbar: ja, bis zum Anlegeruf** (D-03). Der Knopf heißt **„Abbrechen"**, steht
unter der Liste an der Stelle des Hauptknopfs und ist die einzige Aktion in Z1. Ab Z2
verschwindet er; die Statuszeile lautet dann „Das Todo wird angelegt …". Dieser Ruf ist
kurz — ein Abbruch dort hätte kein Ziel mehr, und ein Knopf, der nichts mehr aufhalten
kann, ist eine Lüge über einen Zustand.

**Wie lange ohne Rückmeldung** (D-04):

- **100 ms** bis die Fläche steht. Zwischen Klick und Fortschrittsfläche darf kein
  leerer Moment liegen.
- **Je Anhang ein Wechsel.** Zwischen zwei Wechseln kann bei einer 25-MB-Datei eine halbe
  Minute liegen — sichtbar bleibt dabei, welche Datei gerade läuft und wie groß sie ist.
  Das ist die ehrliche Auskunft: nicht „es tut sich was", sondern „an dieser Datei liegt
  es".
- **60 Sekunden je Anhang als Deckel.** Danach gilt der Anhang als gescheitert, Grund
  „Zeitüberschreitung", und der Lauf geht weiter. Ohne diesen Deckel ist ein hängender
  Abruf eine Sackgasse, aus der nur „Abbrechen" führt — und den findet nicht jeder.

### 6.2 Die geschlossene Liste der Gründe

A-19.29 verlangt einen **Grund** je nicht übernommenem Anhang. Freitext aus fremden
Fehlermeldungen ist hier verboten (AB-3: kein Satz dieser Fläche gibt fremden Text
ungeprüft wieder). Es gibt genau diese Gründe:

| Kennung | Satzteil hinter dem Namen | Wann |
|---|---|---|
| `too_large` | `zu groß («Größe»). Die Grenze liegt bei «X» je Datei.` | A-19.30 |
| `total_too_large` | `über der Gesamtgrenze. Zusammen dürfen die Dateien einer E-Mail «X» nicht überschreiten.` | Summengrenze, vor dem Klick erkennbar |
| `too_many` | `über der Anzahlgrenze. Je E-Mail werden höchstens «N» Dateien übernommen.` | Anzahlgrenze, vor dem Klick erkennbar |
| `not_released` | `Outlook hat die Datei nicht herausgegeben.` | Office-Fehler beim Abruf |
| `timeout` | `Zeitüberschreitung beim Laden.` | Deckel aus 6.1 |
| `rejected` | `SuperTakt hat die Datei nicht angenommen.` | Dienst lehnt ab |
| `connection` | `Die Verbindung zu SuperTakt ist abgerissen.` | Abbruch der Übertragung |
| `not_a_web_address` | `Der Ablageort ist keine Webadresse.` | Cloud-Verweis, dessen zerlegtes Schema nicht `http`/`https` ist (Abschnitt 9.2) |
| `rebuild_rejected` | *(nur für die E-Mail)* `sie ließ sich nicht als Datei nachbauen.` | A-19.22c, R-28 — **neu in T-303**, siehe 6.4 |
| `outlook_too_old` | *(nur für Dateien)* `dieses Outlook gibt Anhänge nicht heraus.` | A-19.31 |
| ~~`mailbox_closed`~~ | ~~`Das Postfach gibt die Nachricht nicht heraus.`~~ | **gestrichen in T-303** — unerreichbar seit E-109 |

**Drei Entscheidungen zu dieser Liste, gefällt in T-303:**

1. **`mailbox_closed` fällt ersatzlos.** Der Fall, den er beschrieb, existiert nicht mehr:
   Gibt Outlook die Nachricht nicht her, fehlt sie nicht, sondern wird nachgebaut. Ein
   Grund, den nichts mehr erzeugt, ist ein Satz über einen Bestand, den es nicht gibt.
2. **`outlook_too_old` gilt nur noch für Dateien**, nicht mehr für die E-Mail. Derselbe
   Grund, halb so groß — und der Satz beginnt jetzt klein, weil er wie alle anderen hinter
   einen Gedankenstrich tritt.
3. **`too_many` und `total_too_large` bleiben** (integration-dev hatte in T-300 angeboten,
   sie zugunsten von domain-devs gröberer Liste fallen zu lassen). Sie bleiben aus zwei
   Gründen: Beide Fälle stehen **vor** dem Klick fest, und in der Vorschau ist noch nichts
   gesendet — ein `rejected` („SuperTakt hat die Datei nicht angenommen") wäre dort schlicht
   unwahr. Und A-19.29 verlangt einen **Grund**; drei verschiedene Grenzen in einem Wort
   zusammenzufassen nimmt dem Benutzer genau die Auskunft, die ihn handeln ließe. **Die
   Liste über die Leitung darf gröber sein als die Liste auf dem Bildschirm** — verlangt ist
   nur, daß jede Kennung der Leitung auf genau einen Satz hier fällt und keine auf zwei.

**Die Kurzform für die laufende Liste in Z1** — dort steht `⊘ Video.mp4 — zu groß,
übersprungen`, kein ganzer Satz, keine Zahl, keine Grenze. Die vollständige Auskunft steht
im Ergebnis, und sie steht dort **noch einmal**; die laufende Liste ist weg, sobald sie
fertig ist.

| Kennung | Kurzform |
|---|---|
| `too_large` | `zu groß, übersprungen` |
| `total_too_large` | `Gesamtgrenze, übersprungen` |
| `too_many` | `Anzahlgrenze, übersprungen` |
| `not_released` | `nicht herausgegeben` |
| `timeout` | `Zeitüberschreitung` |
| `rejected` | `nicht angenommen` |
| `connection` | `Verbindung abgerissen` |
| `not_a_web_address` | `keine Webadresse` |
| `rebuild_rejected` | `nicht nachgebaut` |
| `outlook_too_old` | `nicht übernommen` |

`total_too_large` und `too_many` tragen die Grenze auch in der Kurzform beim Namen. Ein
bloßes „übersprungen" stünde dreimal untereinander für drei verschiedene Ursachen — und wer
die laufende Liste liest, liest sie gerade deshalb, weil er wissen will, **welche**.

### 6.3 Z3 — alles gelungen (Antwort auf Frage 2)

**Der Benutzer sieht, *was* angekommen ist, nicht nur *daß*.** Begründung: A-19.33 ist eine
Zählabnahme, und die Zahl allein („3 Anhänge") beantwortet die Frage nicht, die der
Benutzer wirklich hat — ob *seine* Datei dabei ist. Bei einer E-Mail mit sieben Anhängen
ist „7 Anhänge" eine Quittung, die Liste ist ein Beleg.

```
Todo angelegt
✓ «Titel des Todos»
  Das Todo ist in SuperTakt angelegt. 3 Anhänge hängen daran:
   – die E-Mail
   – Angebot.pdf
   – Skizze.png
  «2 Standard-Tags wurden automatisch gesetzt.»          ← unverändert, bestehender Satz
  «Neues Tag: „Kunde Meier" — ab jetzt auch in SuperTakt auswählbar.»   ← unverändert

  [ Noch etwas aus dieser E-Mail ]
```

Bei genau einem Anhang (A-19.27) steht statt Zahl und Liste **ein** Satz:

```
  Das Todo ist in SuperTakt angelegt. Die E-Mail hängt als Datei daran.
```

Ab **sieben** Anhängen gilt dieselbe Regel wie in 4.4: fünf Namen, dann
„Alle 17 Anhänge anzeigen".

Ein Cloud-Verweis trägt seinen Zusatz auch hier: `– Vertrag.docx (als Verweis)`. Er ist
in SuperTakt ein Anhang anderer Art (A-19.25), und wer ihn später sucht, findet ihn dort
unter „Verweis" und nicht unter „Datei".

### 6.3a Z3a — alles gelungen, und die E-Mail ist ein Nachbau (neu in T-303)

**Der dritte Zustand.** Er ist weder „geklappt" noch „etwas fehlt", und genau darin liegt
die Entwurfsaufgabe: Er darf **nicht wie ein Fehlschlag aussehen** — es ist keiner, es
fehlt nichts, die Zahl aus A-19.33 stimmt — und er darf **nicht verharmlost** werden, denn
die Datei ist nicht die ursprüngliche Nachricht, und das bleibt sie auch in drei Wochen
nicht.

```
Todo angelegt
✓ «Titel des Todos»
  Das Todo ist in SuperTakt angelegt. 3 Anhänge hängen daran:
   – die E-Mail (nachgebaut)
   – Angebot.pdf
   – Skizze.png

  Die E-Mail ist ein Nachbau: Outlook hat die ursprüngliche Nachricht nicht als Datei
  hergegeben. Absender, Empfänger, Betreff, Versanddatum und Text stehen in der Datei.
  Die technischen Kopfzeilen der ursprünglichen Nachricht stehen nicht darin — und mit
  ihnen nicht der Nachweis, welchen Weg sie genommen hat.
  Die Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet.

  [ Noch etwas aus dieser E-Mail ]
```

**Sechs Entscheidungen, jede gegen eine naheliegende Alternative:**

1. **Die Überschrift bleibt „Todo angelegt", der Ton bleibt Erfolg.** Keine Warnfarbe, kein
   Warnzeichen, kein Zusatz in der Überschrift. Eine Überschrift „Todo angelegt — E-Mail
   nachgebaut" wäre der Bauplan von Z4, und Z4 heißt in diesem Entwurf: **etwas fehlt**.
   Hier fehlt nichts. Wer den Warnton hier ausleiht, hat ihn in Z4 verbraucht, wenn er
   gebraucht wird — und der Benutzer mit einer alten Outlook-Fassung sähe ihn bei **jedem**
   Todo, bis er ihn nicht mehr sieht.
2. **Die Kennzeichnung hängt an der Zeile, nicht am Absatz.** `– die E-Mail (nachgebaut)`
   steht in derselben Form wie `– Vertrag.docx (als Verweis)`: eine Art des Anhangs, in
   Klammern hinter dem Namen. Das ist die Form, in der dieser Aufgabenbereich schon heute
   sagt, **was für ein Ding** ein Anhang ist — und der Benutzer muß den Absatz darunter nie
   wieder lesen, um die Zeile zu verstehen.
3. **Der Absatz sagt, was drin ist, bevor er sagt, was fehlt.** „Absender, Empfänger,
   Betreff, Versanddatum und Text stehen in der Datei" ist der ganze Inhalt nach A-19.22 —
   der Nachbau erfüllt die Anforderung, und das gehört gesagt, sonst liest sich die Auskunft
   wie ein Mangel. Erst danach steht, was nicht darin ist.
4. **„Die technischen Kopfzeilen … und mit ihnen nicht der Nachweis, welchen Weg sie
   genommen hat."** Das ist die Stelle, an der dieser Entwurf sich gegen die Verharmlosung
   entscheidet. „Ohne die übrigen Kopfzeilen" (A-19.22a) ist für den Benutzer kein Satz —
   es ist ein Fachwort ohne Folge. Der Satz muß die **Folge** nennen, und sie ist genau
   diese: In einem Vorgang, aus dem eine Rechnung wird, ist eine E-Mail manchmal ein
   Beweisstück, und ein Nachbau ist als Beweisstück weniger wert. Er ist deshalb nicht
   wertlos, und der Satz behauptet das auch nicht.
5. **Kein Ratschlag, was der Benutzer statt dessen tun soll.** Nicht „Speichern Sie die
   Nachricht in Outlook und hängen Sie sie in SuperTakt an." Der Weg gäbe es (er steht in
   6.4 und ist dort geprüft), aber hier wäre er falsch: Das Ergebnis ist vollständig. Ein
   Satz, der zu Handarbeit auffordert, wo nichts fehlt, macht aus einem erfüllten Ergebnis
   ein unerfülltes — und er stünde bei jeder E-Mail, bis er nicht mehr gelesen wird. Dann
   steht er in 6.4 auch nicht mehr, wo er trägt. **Die Entscheidung, ob ihm der Nachbau
   genügt, fällt der Benutzer später**, an der Datei, an der die Kennzeichnung hängt — nicht
   in dieser Sekunde, in der er noch gar nicht weiß, wofür er die E-Mail brauchen wird.
6. **„Outlook hat … nicht hergegeben" und nicht „Dieses Outlook gibt … nicht heraus."**
   Der Nachbau hat **zwei** Ursachen: die fehlende Fassung — dann steht er schon in der
   Vorschau — und ein fehlgeschlagener Abruf bei vorhandener Fassung. Ein Satz über „dieses
   Outlook" wäre im zweiten Fall eine Aussage über die Fassung, an der es nicht lag. Die
   gewählte Form spricht über den einen Vorgang, der gerade stattgefunden hat, und ist in
   beiden Fällen wahr. **Und sie nennt keine Fassungsnummer** — anders als in 4.6, wo sie
   steht: Dort fehlen Dateien, und die Nummer ist die Bedingung dafür, daß sie kämen. Hier
   fehlt nichts; eine Nummer machte aus einer Auskunft eine Aufforderung, den Rechner
   aufzurüsten, an einer Stelle, an der alles gutgegangen ist.

**Bei genau einem Anhang** (A-19.27, E-Mail ohne Dateianhänge) tritt an die Stelle von Zahl
und Liste derselbe eine Satz wie in 6.3, um ein Wort ergänzt:

```
  Das Todo ist in SuperTakt angelegt. Die E-Mail hängt als Nachbau daran.
```

Der Absatz darunter steht unverändert. Er ist hier sogar wichtiger als im Fall mit drei
Anhängen: Die nachgebaute Datei ist dann das **einzige**, was vom Postfach am Todo hängt.

**Der letzte Satz ist der, der den Fall über diese Sekunde hinausträgt.** „Die Datei ist in
SuperTakt dauerhaft als Nachbau gekennzeichnet" ist keine Beruhigung, sondern eine
**Wegbeschreibung**: Er sagt dem Benutzer, daß er sich diese Meldung nicht merken muß, und
er sagt es, weil A-19.22b genau das verlangt — die Kennzeichnung hängt an der Datei, ist am
Anhang sichtbar, steht in der Rückfrage vor dem Öffnen und übersteht die Datensicherung.
**Der Satz ist damit eine Zusage über fremde Flächen** (`AttachmentList`, die Rückfrage der
Hülle, das Datenarchiv) und gilt erst, wenn sie gebaut sind: AK-25 bis AK-27. Wird er
gesprochen, bevor die Kennzeichnung im Bestand liegt, ist er die Lüge, gegen die dieser
ganze Abschnitt gerichtet ist.

**Und das Wort.** Es heißt an allen vier Stellen — Vorschau, Ergebniszeile, Absatz,
SuperTakt — **„Nachbau"** bzw. **„nachgebaut"**, nie „Kopie", nie „Ersatz", nie
„rekonstruiert", nie „vereinfachte Fassung". „Kopie" behauptet Gleichheit, „Ersatz"
behauptet Gleichwertigkeit, „vereinfacht" klingt nach einer Wahl, die niemand getroffen
hat. „Nachbau" sagt: nach dem Vorbild gebaut, nicht das Vorbild. Das ist der Wortlaut aus
E-109 und A-19.22b, und er wandert nicht.

### 6.4 Z4 — teilweise gelungen (Antwort auf Frage 3)

**Der wichtigste Zustand.** Er darf nicht wie Erfolg aussehen und nicht wie ein
Fehlschlag. Das leisten drei Mittel zusammen, und keines allein:

1. Die **Überschrift** trägt beides: „Todo angelegt — 1 Anhang fehlt."
2. Der **Ton** ist Warnung, nicht Erfolg und nicht Gefahr. `Callout tone="warning"`, mit
   Zeichen, nicht nur mit Farbe.
3. Der **Aufbau** zeigt erst, was da ist, dann, was fehlt. In dieser Reihenfolge, weil das
   Todo die Hauptsache ist und der fehlende Anhang die Ausnahme.

```
Todo angelegt — 1 Anhang fehlt
⚠ «Titel des Todos»
  Das Todo ist in SuperTakt angelegt. 2 von 3 Anhängen hängen daran:
   – die E-Mail
   – Angebot.pdf

  Nicht übernommen:
   – Video.mp4 — zu groß (31,4 MB). Die Grenze liegt bei 25 MB je Datei.

  Nachtragen lässt sich das nur in SuperTakt: die Datei in Outlook speichern und
  am Todo unter „Anhänge" mit ihrem vollständigen Pfad hinzufügen.
  Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang.

  [ Noch etwas aus dieser E-Mail ]
```

**Zum Nachholen — und zu dem, was hier absichtlich fehlt.** Der Aufgabenbereich bietet
**keinen** Knopf „Erneut versuchen". Er dürfte ihn nicht bieten: Das Todo existiert in der
Sekunde, in der der Anlegeruf zurückkam, und jeder Anhang daran wäre ein Anhang an einem
**vorhandenen** Todo — genau die Tür, die A-19.19 und E-108 zuhalten. Ein Knopf, der das
täte, wäre nicht eine Bequemlichkeit zuviel, sondern die Aufhebung einer Entscheidung
durch eine Schaltfläche.

Der genannte Weg ist der **einzige**, den es wirklich gibt, und er ist zweimal geprüft:
Outlook kann Anhänge über „Speichern unter" ablegen, und SuperTakt hat am Todo den Bereich
**„Anhänge"** mit „Anhang hinzufügen", Art **„Datei"**, Feld **„Vollständiger Pfad zur
Datei"** (`AttachmentFormDialog.tsx`). Jedes Hauptwort in dem Satz steht drüben so auf dem
Bildschirm. **Das ist die Lehre vom 2026-09-10** (E-100, „Hängen Sie diese E-Mail an das
passende Todo"): Ein Satz, der eine Handlung nennt, die es nicht gibt, ist derselbe
Fehler wie ein fehlender Satz.

Der letzte Satz — „Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein
Anhang." — ist kein Beiwerk. Er ist die Antwort auf die Frage, die der Benutzer in genau
dieser Sekunde stellt („warum kann ich das nicht einfach nochmal drücken?"), und er ist
eine Abwesenheitszusage im Sinne des Rasters drüben (Buchstabe **A**). Er gehört auf die
Sperrliste (Abschnitt 11).

**Die Sonderfälle von Z4, im selben Aufbau — beide in T-303 neu gefaßt:**

*(1) Die Dateien fehlen, die E-Mail ist da (A-19.31, Outlook ohne Mailbox 1.8):*
```
Todo angelegt — 2 Anhänge fehlen
⚠ «Titel»
  Das Todo ist in SuperTakt angelegt. 1 von 3 Anhängen hängt daran:
   – die E-Mail (nachgebaut)

  Nicht übernommen:
   – Angebot.pdf — dieses Outlook gibt Anhänge nicht heraus.
   – Skizze.png — dieses Outlook gibt Anhänge nicht heraus.
  Nötig ist Outlook mit Mailbox-Anforderungssatz 1.8.

  Nachtragen lässt sich das nur in SuperTakt: die Datei in Outlook speichern und
  am Todo unter „Anhänge" mit ihrem vollständigen Pfad hinzufügen.
  Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang.
```

Der alte Fall „Todo angelegt — ohne Anhänge" ist damit **gestrichen**: Er kann nicht mehr
eintreten. Die E-Mail steht immer im Plan, und fehlt die Fassung für die Dateien, fehlt sie
auch für die Nachricht — dann kommt die Nachricht als Nachbau. Ein Todo ganz ohne Anhang
entsteht auf diesem Weg nicht mehr. Der Satz „Titel, Frist, Tags, Vermerk und Call-Nummer
sind übernommen" fällt mit ihm; er stand dort nur, damit nicht der Eindruck entstünde, es
sei **gar nichts** angekommen, und dieser Eindruck ist nicht mehr möglich.

*(2) Die E-Mail fehlt, weil der Nachbau abgelehnt wurde (`rebuild_rejected`, A-19.22c):*
```
Todo angelegt — die E-Mail fehlt
⚠ «Titel»
  Das Todo ist in SuperTakt angelegt. 2 von 3 Anhängen hängen daran:
   – Angebot.pdf
   – Skizze.png

  Nicht übernommen:
   – die E-Mail — sie ließ sich nicht als Datei nachbauen.

  Die ursprüngliche Nachricht war nicht zu bekommen, und der Nachbau ist an einer
  Angabe dieser Nachricht gescheitert: Sie würde in der Datei nicht als Text stehen,
  sondern deren Aufbau verändern. SuperTakt bricht dann ab, statt eine Datei zu
  erzeugen, die mehr enthält als die Nachricht.
  Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch
  ändert daran nichts.

  Nachtragen lässt sich das nur in SuperTakt: die Nachricht in Outlook speichern und
  am Todo unter „Anhänge" mit ihrem vollständigen Pfad hinzufügen.
  Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang.
```

**Warum dieser Wortlaut, Satz für Satz.** Er ist der heikelste des ganzen Entwurfs, weil
der Benutzer nichts falsch gemacht hat und trotzdem etwas fehlt — und weil er der einzige
ist, in dem SuperTakt aus eigenem Entschluß etwas **nicht** tut, was es könnte.

- **„sie ließ sich nicht als Datei nachbauen"** in der Gründeliste, nicht „wurde abgelehnt"
  und nicht „ist fehlgeschlagen". „Abgelehnt" liest sich wie eine Entscheidung über den
  Benutzer; „fehlgeschlagen" wie ein Fehler, den ein zweiter Versuch heilt. Beides trifft
  nicht zu.
- **„an einer Angabe dieser Nachricht"** — nicht „an einem ungültigen Zeichen", nicht „an
  einem Angriffsversuch". Der Benutzer kann die Angabe nicht sehen und nicht ändern, und
  ihn zu verdächtigen, wer ihm geschrieben hat, wäre eine Behauptung, für die dieses
  Programm keine Grundlage hat. Es kann sagen, **was** passiert wäre, und das reicht.
- **„Sie würde in der Datei nicht als Text stehen, sondern deren Aufbau verändern."** Das
  ist R-28 in einem Satz und ohne Fachwort. Wer wissen will, was daran schlimm ist, liest
  den nächsten Satz.
- **„statt eine Datei zu erzeugen, die mehr enthält als die Nachricht."** Der Satz nennt
  die Gefahr in der einen Form, in der sie den Benutzer betrifft: In der Datei stünde etwas,
  das nicht in der E-Mail war — ein zusätzlicher Anhang etwa, den Outlook ihm später zum
  Doppelklick anbietet und der keine der Regeln aus A-19.23 durchlaufen hat.
- **„Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert
  daran nichts."** Zwei Auskünfte in einem Satz, und die zweite ist die wichtigere. Sie ist
  **keine Beruhigung, sondern eine Ersparnis**: Ohne sie löscht der Benutzer das Todo und
  legt es noch einmal an — mit demselben Ergebnis, denn die Ablehnung ist deterministisch.
  Die erste Hälfte steht davor, weil ein Mensch, dem etwas fehlt, zuerst bei sich sucht.
- **Der Nachtragsweg steht dabei, hier im Gegensatz zu 6.3a.** Hier fehlt wirklich etwas,
  hier gibt es wirklich etwas zu tun, und der Weg ist derselbe geprüfte wie oben — nur heißt
  es „die Nachricht", nicht „die Datei", weil der Benutzer in Outlook die Nachricht
  speichert.

**Was hier ausdrücklich nicht steht:** kein Knopf „Erneut versuchen" (das Todo existiert,
siehe oben), keine Fehlernummer, kein Auszug aus der Formprüfung und kein Name der Angabe,
an der es lag. Der Grund für das Letzte ist AB-3: Der Name einer Kopfzeile aus einer fremden
Nachricht wäre fremder Text in einer Fläche, die sonst nur eigene Sätze zeigt — und die
Fläche, die vor fremdem Text warnt, wäre die erste, die ihn zeigt.

### 6.5 Z5 — fehlgeschlagen, nichts entstanden

Die bestehende Fehlerfläche (`Failure`) bleibt, wie sie ist, und bekommt in diesem Fluß
**einen** zusätzlichen Satz an den Anfang des Rumpfs:

```
⚠ «Meldung des Dienstes»
  Es ist kein Todo entstanden.
  Die Eingaben bleiben stehen. Ein neuer Versuch ist möglich.
```

Der erste Satz ist neu und trägt den Unterschied zu Z4: Dort steht ein Todo, hier nicht.
Ohne ihn muß der Benutzer in SuperTakt nachsehen, ob eine halbe Sache entstanden ist —
und das ist eine Sackgasse mit Umweg.

### 6.6 Z6 — abgebrochen

```
Abgebrochen. Es ist kein Todo entstanden. Die Eingaben bleiben stehen.
```

Der Satz steht an der Stelle des Sperrgrunds über dem Hauptknopf, im ruhigen Ton, und
verschwindet, sobald der Benutzer irgendein Feld ändert oder erneut anlegt. Kein Dialog,
keine Bestätigungsfrage vor dem Abbrechen — es gibt nichts zu verlieren außer der
Wartezeit, und eine Rückfrage vor einer Handlung ohne Schaden ist eine Handlung zuviel.

**Wechselt Outlook währenddessen die Nachricht**, lautet er:

```
Die geöffnete E-Mail hat gewechselt. Die Übernahme wurde abgebrochen,
es ist kein Todo entstanden.
```

**Warum das kein Randfall ist** (D-06): Ohne diese Regel liefe die Übernahme auf der alten
Nachricht weiter, während das Formular schon die neue zeigt — und es entstünde ein Todo,
dessen Titel aus der einen und dessen Anhänge aus der anderen E-Mail stammen. Das ist ein
stiller Zustandswechsel der schlimmsten Sorte: Er ist erst in SuperTakt sichtbar und dort
nicht mehr erklärbar.

Läuft bereits Z2 (Anlegen), wird nicht mehr abgebrochen. Die Ergebnisfläche bleibt dann
stehen; ihr Knopf heißt in diesem Fall **„Schließen"** statt „Noch etwas aus dieser
E-Mail", weil „diese E-Mail" nicht mehr die offene ist.

---

## 7. Der Duplikatfall bleibt, wie er ist

Findet die Call-Nummer ein vorhandenes Todo, **weist der Aufgabenbereich weiterhin nur
hin** (A-10.9 in der Fassung von E-100, unverändert durch E-108). Daraus folgt für diesen
Entwurf:

- In der Hinweisfläche `DuplicateOffer` entsteht **keine** neue Handlung, kein
  „Anhänge an das gefundene Todo", kein Knopf, kein Satz darüber.
- Legt der Benutzer trotz Hinweis ein neues Todo an, läuft der Fluß dieses Papiers
  vollständig — das neue Todo bekommt seine Anhänge, weil es ein **neues** ist.
- Der Abschnitt „Anhänge aus dieser E-Mail" steht unverändert an seiner Stelle und sagt
  nichts über das gefundene Todo.

---

## 8. Kein Rechtszuwachs (A-19.32 in der Fassung von E-109) — und was an seine Stelle tritt

**Dieser Abschnitt trug in Fassung 1 zwei Flächen. Beide sind gestrichen, und an ihre
Stelle tritt nichts.** Das ist eine Entscheidung und keine Auslassung; sie steht hier
ausgeschrieben, damit sie später nicht als vergessener Rest zurückkommt.

### 8.1 Was gestrichen ist

| Gestrichen | Was sie sagte | Warum sie fällt |
|---|---|---|
| **Z7 „Das Add-in darf jetzt mehr"** | einmalige Fläche vor dem Formular, mit Knopf „Weiter", die den Wechsel von `ReadItem` auf `ReadWriteMailbox` ankündigte | Der Wechsel findet nicht statt. `<Permissions>` bleibt `ReadItem`, gemessen in `proof:addin` 22 |
| **8.2 „Zugriff auf das Postfach"** | dauerhafter Abschnitt in `SettingsView`, mit der Bezeichnung `ReadWriteMailbox` ausgeschrieben | dasselbe. Der Name steht nirgends mehr im Baum, und eine Einstellungsseite, die eine Bezeichnung erklärt, die es nicht gibt, erklärt nichts |

Mit ihnen fallen: der Satz „Outlook kennt für diesen Zugriff keine engere Stufe" (er ist
falsch geworden — die engere Stufe ist genau das, was `getAsFileAsync` benutzt), der Satz
„Zurücknehmen lässt sich das Recht nur, indem Sie das Add-in in Outlook entfernen" (es gibt
nichts zurückzunehmen), und die Zusage „SuperTakt liest ausschließlich die Nachricht, die
gerade offen ist. Es durchsucht das Postfach nicht …" samt ihrem Sperrlistenkandidaten
SP-A-31.

**Der letzte Fall ist der interessante, denn die Zusage war wahr und ist es geblieben.**
Sie fällt trotzdem, und der Grund ist derselbe wie am 2026-09-10: Eine Zusage, ein Recht
nicht auszunutzen, das man gar nicht hat, ist keine Zusage. Sie erzeugt beim Leser die
Vorstellung des Rechts, um sie gleich darauf zu entkräften — und läßt jemanden zurück, der
glaubt, das Add-in dürfe ins Postfach, aber verspreche, es zu lassen. **Der Bestand sagt
das Gegenteil, und zwar an der einzigen Stelle, an der es zählt: im Manifest.**

### 8.2 Warum an ihre Stelle nichts tritt — und wo die Auskunft trotzdem steht

Der naheliegende Einwand: Etwas Neues geschieht ja doch. Die **ganze** E-Mail samt allen
Dateianhängen verläßt Outlook und liegt danach als Datei im Datenverzeichnis von SuperTakt.
Das ist eine Änderung im Umgang mit den Daten des Benutzers, auch ohne Änderung am Recht.
Muß sie ihm nicht gesagt werden?

**Sie wird ihm gesagt — besser, als eine einmalige Fläche es könnte, und die Fläche wäre
sogar die schwächere Antwort.** Der Abschnitt „Anhänge aus dieser E-Mail" (4.1) steht

- **vor** dem Klick statt vor der ersten Nutzung,
- **jedesmal** statt einmal je Gerät,
- **namentlich** — er zählt die Dateien auf, um die es geht, statt sie allgemein zu nennen,
- **an der Stelle, an der die Handlung ausgelöst wird**, unmittelbar über dem Knopf.

Eine Einwilligungsfläche zu Beginn ist die Form, die man wählt, wenn man es nicht
jedesmal zeigen kann. Hier kann man. Eine Fläche, die dasselbe einmal und schwächer sagt,
ist dann nicht die Ergänzung der Vorschau, sondern ihr Ersatz durch etwas Schlechteres —
und sie ist die Art Fläche, die der Benutzer wegklickt, ohne sie zu lesen, weil sie ihn
vor seiner ersten Aufgabe aufhält.

**Für die Einstellungen gilt dasselbe in der Dauer.** Ein Abschnitt „Zugriff auf das
Postfach", der nur noch sagt „das Add-in fordert kein weitergehendes Recht als bisher", ist
die Antwort auf eine Frage, die niemand gestellt hat. Er wäre Ballast im Sinne von E-107 —
eine Gegenprobe, die nur noch bestätigt, daß nichts geschieht.

**Entschieden, ohne zu fragen (D-07, neu gefaßt): Es gibt keine eigene Fläche zum Recht,
weder einmalig noch dauerhaft. Die Vorschau vor dem Klick ist die Auskunft, und sie ist die
bessere.** D-07 in seiner alten Fassung („zwei Orte, einmal unübersehbar und einmal
dauerhaft auffindbar") ist damit aufgehoben.

**Was dadurch nicht entfällt:** die Sätze über die **Anhänge** selbst. Sie bleiben
sämtlich, und sie stehen dort, wo etwas geschieht — die Vorschau in 4, das Ergebnis in 6.3
bis 6.4, die Kennzeichnung des Nachbaus in 6.3a. Gestrichen ist ausschließlich die Rede vom
**Recht**.

---

## 9. Fremder Inhalt auf dieser Fläche

Die Anhangsübernahme bringt drei neue Sorten fremden Inhalts in den Aufgabenbereich. AB-3
aus `textbestand-aufgabenbereich.md` gilt für alle drei.

### 9.1 Dateinamen sind fremder Text

Jeder Dateiname geht durch `Foreign` (also `<bdi>` **und** `visibleText`). Das ist hier
nicht Kosmetik. Der Name

```
Rechnung<U+202E>fdp.exe
```

trägt an der markierten Stelle ein **U+202E (RIGHT-TO-LEFT OVERRIDE)** — ein Zeichen ohne
eigene Breite, das alles hinter sich umdreht. Auf dem Bildschirm steht danach
`Rechnung` gefolgt von `exe.pdf`: Der Benutzer liest eine PDF-Datei und öffnet in
SuperTakt eine ausführbare. Dieselbe Bauart gibt es mit **U+200B (ZERO WIDTH SPACE)**, das
eine Endung unsichtbar zerteilt. Die Rückfrage mit vollem Pfad aus Abschnitt 19 ist die
Sicherung; sie trägt nur, wenn der Name in ihr lesbar ist, was er ist.

**Das Zeichen steht hier als Bezeichner und nicht als Zeichen** — dieses Papier liegt im
Bestand, und `proof:codepoints` verbietet solche Zeichen dort, ohne unterscheiden zu
können, ob sie einen Angriff ausführen oder ihn erklären. Er soll es auch nicht können.
Wer den Fall nachbaut, schreibt das Zeichen in einen Prüffall, nicht in eine Erklärung.

### 9.2 Ein Cloud-Verweis ist eine Adresse aus fremder Hand

A-19.25 macht aus dem Cloud-Anhang einen **Verweis**. Für Verweise gilt Abschnitt 19
unverändert: nur `http` und `https`, kein UNC. Geprüft wird das **zerlegte** Schema und
nicht der Anfang der Zeichenkette — ein Präfixvergleich hielte `http:/` mit nur einem
Schrägstrich für keine Webadresse und verführte dazu, die Rohfassung zu speichern. Ein
Cloud-Anhang, der die Prüfung nicht besteht, wird **nicht** übernommen und erscheint mit dem
Grund `not_a_web_address` in der Ergebnisliste; gespeichert wird sonst die **Normalform**,
nicht die Rohfassung. Ohne diese Regel wäre der Cloud-Anhang der
kürzeste Weg, einen beliebigen Pfad aus einer fremden E-Mail bis an den Öffnen-Befehl der
Hülle zu schreiben. **Das ist ein Sicherheitsbefund und keine Darstellungsfrage** — er
gehört in die Bewertung, die E-108 vor den Bau setzt.

### 9.3 Namen werden nicht gekürzt

In einer 320 Pixel breiten Spalte ist die Versuchung groß, `Sehr_langer_Dateiname_aus_
dem_Angebot_2026.pdf` in der Mitte zu kürzen. In der Mitte kürzen ist erlaubt, **am Ende
kürzen ist verboten**: Die Endung ist die eine Stelle des Namens, an der etwas über die
Gefährlichkeit der Datei steht. Umbruch innerhalb des Namens ist der einfachere und
bessere Weg.

---

## 10. Tastatur, Fokus, Screenreader (WCAG 2.2 AA)

### 10.1 Fokusfluß

| Ereignis | Fokus wandert nach | Warum |
|---|---|---|
| Z0 → Z1 | auf die Überschrift „Anhänge werden übernommen" (`tabindex="-1"`) | Der Knopf, auf dem der Fokus stand, verschwindet. Ohne Zuweisung fällt der Fokus auf `<body>`, und ein Screenreader-Benutzer weiß nicht mehr, wo er ist |
| Z1 | erster Tabstopp nach der Überschrift ist **„Abbrechen"** | Die einzige Aktion muß die nächste sein |
| Z1 → Z2 | Fokus bleibt, wo er ist | Verschwindet „Abbrechen" unter dem Fokus, wird er auf die Überschrift zurückgesetzt |
| → Z3/Z4 | auf die Ergebnisüberschrift (`tabindex="-1"`) | Das Ergebnis ist die Nachricht; sie wird vorgelesen, wenn der Fokus dort ankommt |
| → Z5/Z6 | zurück auf „Neue Aufgabe anlegen" | Dorthin, wo der nächste Versuch beginnt — keine Suche durch das ganze Formular |
| Z3/Z4 → Z0 | auf das erste Feld des Formulars (Call-Nummer) | Der Fluß beginnt von vorn |

Kein Fokus wird ohne Ereignis bewegt (3.2.1, 3.2.2). Keine Fokusfalle (2.1.2). Alle neuen
Bedienelemente — es sind seit T-303 nur noch **zwei**, „Abbrechen" und „Alle N Anhänge
anzeigen" — sind `<button>`, tastaturerreichbar und mindestens 24 × 24 Pixel (2.5.8). Der
Knopf „Weiter" aus Z7 ist mit Z7 gestrichen; damit entfällt auch der einzige Zustand dieses
Entwurfs, der dem Benutzer vor seiner ersten Aufgabe einen Klick abverlangt hätte.

### 10.2 Was gesprochen wird — und was nicht

Die Statuszeile in Z1/Z2 ist ein `role="status"` (also `aria-live="polite"`), das
**immer** dasteht und nur seinen Inhalt wechselt (Y-04, dieselbe Regel wie bei
`DuplicateOffer`: ein Live-Bereich, der zusammen mit seinem Inhalt entsteht, wird nicht
zuverlässig vorgelesen).

**Die Liste selbst ist kein Live-Bereich** (D-08). Bei siebzehn Anhängen wären das
vierunddreißig Ansagen. Gesprochen wird stattdessen genau dreierlei:

1. der Beginn: „4 Anhänge werden übernommen.",
2. **jeder** nicht übernommene Anhang, sofort: „Video.mp4 — zu groß, übersprungen.",
3. das Ergebnis: „Todo angelegt. 2 von 3 Anhängen hängen daran." bzw. „Todo angelegt.
   3 Anhänge hängen daran."

Gelungene Zwischenschritte sind sichtbar, aber stumm. **Die Auswahl folgt der Regel, daß
angesagt wird, was man nicht verpassen darf** — und das ist genau das, was fehlt.

**Der Nachbau ist die eine Ausnahme von dieser Regel** (neu in T-303). Er ist kein
Fehlschlag und fehlt nicht, wird aber trotzdem angesagt: „Todo angelegt. 3 Anhänge hängen
daran. Die E-Mail ist ein Nachbau." Der Grund ist derselbe, aus dem die Regel besteht — man
darf ihn nicht verpassen. Für einen sehenden Benutzer steht „(nachgebaut)" in der Zeile;
wer die Liste nicht sieht, bekäme ohne diesen Zusatz die Auskunft „3 Anhänge hängen daran"
und damit **weniger** als der Sehende, und zwar genau an der Stelle, an der es auf den
Unterschied ankommt. Der erklärende Absatz darunter wird **nicht** mit angesagt; er steht
im Fokusziel und wird beim Weiterlesen erreicht.

### 10.3 Weitere Prüfpunkte

- **1.4.1 Use of Color:** Jeder Zeilenzustand trägt ein Wort, nicht nur Zeichen und Farbe
  (6.1). Z4 unterscheidet sich von Z3 durch Überschrift **und** Zeichen, nicht nur durch
  die Tönung.
- **2.2.1 Timing Adjustable:** Der 60-Sekunden-Deckel begrenzt eine Systemantwort, nicht
  eine Eingabe des Benutzers. Es gibt keine Frist, die der Benutzer einhalten muß.
- **3.3.1 Error Identification / 3.3.3 Error Suggestion:** Jeder fehlende Anhang steht mit
  Namen und Grund da (6.2), und Z4 nennt den Weg, ihn nachzutragen.
- **4.1.3 Status Messages:** Fortschritt und Ergebnis erreichen den Screenreader, ohne den
  Fokus zu stehlen.
- **1.3.1 Info and Relationships:** Die Anhangsliste ist eine `<ul>`, kein Absatzstapel.
  Der Grund steht **in** demselben `<li>` wie der Name, nicht in einer zweiten Liste
  daneben.
- **2.4.6 Headings and Labels:** Die Überschriften Z1 („Anhänge werden übernommen"), Z3
  („Todo angelegt") und Z4 („Todo angelegt — 1 Anhang fehlt") unterscheiden sich hörbar
  schon im ersten Drittel.

---

## 11. Was neu geschützt gehört (Vorlage an den Halter von `textbestand-aufgabenbereich.md`)

**Ich trage hier nichts ein — das Papier gehört einem anderen.** Vier Sätze dieses
Entwurfs tragen eine Aussage allein und wären ohne Eintrag beim nächsten Textdurchgang
Streichkandidaten:

| Vorschlag | Satz | Buchstabe | Trägt |
|---|---|---|---|
| SP-A-29 | „Über diesen Aufgabenbereich entsteht an einem vorhandenen Todo kein Anhang." | **A** | A-19.19, E-108, E-100 Punkt 4 |
| SP-A-30 | „Das Todo entsteht erst, wenn alle Anhänge übernommen sind. Abbrechen legt nichts an." | **F** | macht „Abbrechen" gefahrlos; ohne ihn bricht niemand ab |
| ~~SP-A-31~~ | ~~„SuperTakt liest damit ausschließlich die Nachricht, die gerade offen ist …"~~ | — | **Vorschlag zurückgezogen in T-303.** Der Satz ist mit Abschnitt 8 gestrichen; er sicherte die Abwesenheit eines Rechts zu, das nie gefordert wird. Die Nummer bleibt unbesetzt, damit kein zweiter Satz sie erbt und die Streichung unsichtbar wird |
| SP-A-32 | „Es ist kein Todo entstanden." (Z5, Z6) | **A** | unterscheidet Z5/Z6 von Z4 |
| **SP-A-33** *(neu)* | „Die technischen Kopfzeilen der ursprünglichen Nachricht stehen nicht darin — und mit ihnen nicht der Nachweis, welchen Weg sie genommen hat." (6.3a) | **A** | A-19.22a/b. Der einzige Satz, der sagt, **was am Nachbau fehlt**. Ohne ihn steht dort eine Kennzeichnung ohne Bedeutung |
| **SP-A-34** *(neu)* | „Die Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet." (6.3a) | **A + F** | A-19.22b. Er trägt die Auskunft über diese Sekunde hinaus; ohne ihn muß der Benutzer sie sich merken. **Erst sperren, wenn die Kennzeichnung im Bestand liegt** (AK-25 bis AK-27) — vorher ist er unwahr |
| **SP-A-35** *(neu)* | „Das liegt an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert daran nichts." (6.4, Fall 2) | **B** | A-19.22c. Er beendet die Schleife aus Löschen und Neuanlegen, die ohne ihn entsteht |

Dazu ein Hinweis zur Pflege: **ST-A-01** und **SP-A-15** betreffen Flächen, die dieser
Entwurf nicht anfasst; **SP-A-24** (`DuplicateOffer`) bleibt unverändert, weil Abschnitt 7
dort nichts ändert.

---

## 12. Akzeptanzkriterien für frontend-dev und integration-dev

Jedes Kriterium ist prüfbar, ohne dieses Papier zu lesen.

| # | Kriterium |
|---|---|
| **AK-01** | Bei einer E-Mail mit zwei Dateianhängen nennt der Abschnitt „Anhänge aus dieser E-Mail" **vor** dem Klick drei Einträge und die Zeile „Daraus entstehen 3 Anhänge am neuen Todo." |
| **AK-02** | Eine E-Mail ohne Dateianhänge zeigt genau einen Eintrag („Die E-Mail selbst") und „Daraus entsteht 1 Anhang am neuen Todo." Der Abschnitt ist nie leer. |
| **AK-03** | Ein eingebettetes Signaturbild erscheint in keiner Liste und in keiner Zahl. |
| **AK-04** | Eine Datei über 25 MB steht **vor** dem Klick mit Größe und Grenze da **und** erscheint nach dem Anlegen in „Nicht übernommen" mit demselben Grund. |
| **AK-05** | Zwischen Klick und sichtbarer Fortschrittsfläche liegen höchstens 100 ms; es gibt keinen Moment, in dem weder Formular noch Fortschritt zu sehen ist. |
| **AK-06** | Während der Übernahme ist je Anhang einer von vier Zeilenzuständen sichtbar, jeder mit einem Wort und nicht nur mit Farbe oder Zeichen. |
| **AK-07** | „Abbrechen" ist in Z1 vorhanden und wirkt: kein Todo, keine abgelegte Datei, keine Anhangszeile in SuperTakt. Die Eingaben des Formulars stehen danach unverändert da. |
| **AK-08** | Nach „Abbrechen" ändert kein später eintreffender Rückläufer die Ansicht mehr. |
| **AK-09** | Wechselt Outlook während Z1 die geöffnete Nachricht, bricht der Lauf ab und der Satz aus 6.6 steht da. Es entsteht kein Todo, dessen Felder und Anhänge aus zwei Nachrichten stammen. |
| **AK-10** | Ein Anhang, der nach 60 Sekunden nicht geliefert ist, gilt als gescheitert (Grund „Zeitüberschreitung beim Laden."); der Lauf geht mit dem nächsten weiter. |
| **AK-11** | Ein gescheiterter Anhang bricht die übrigen nicht ab (A-19.29). |
| **AK-12** | Fehlt nach dem Anlegen mindestens ein Anhang, erscheint Z4 — Überschrift mit beidem, Warnton, erst „hängen daran", dann „Nicht übernommen" mit Name und Grund je Eintrag. |
| **AK-13** | In keinem Zustand des Aufgabenbereichs gibt es eine Handlung, die an einem bereits angelegten Todo einen Anhang erzeugt — auch kein „Erneut versuchen". |
| **AK-14** | Scheitert der Anlegeruf (Z5), bleiben die eingesammelten Dateien für einen zweiten Versuch bereit; der zweite Versuch lädt sie nicht erneut aus Outlook. |
| **AK-15** | *(neu gefaßt in T-303)* Fehlt `Mailbox 1.8`, stehen die betroffenen Dateien **vor** dem Klick mit Grund in der Liste, die Zeile „Nötig ist Outlook mit Mailbox-Anforderungssatz 1.8." steht darunter, das Anlegen ist weiterhin möglich, das Todo bekommt die E-Mail **als Nachbau**, und das Ergebnis nennt das Fehlende erneut (A-19.31). |
| **AK-16** | *(neu gefaßt in T-303)* `<Permissions>` im Manifest lautet `ReadItem`. Die Zeichenfolge `ReadWriteMailbox` steht nirgends im Baum, es gibt keinen EWS-Aufruf und keinen Zugriff auf `ewsUrl`, und `getAsFileAsync` hat **genau eine** Aufrufstelle. **Gemessen**, nicht behauptet (`proof:addin`). |
| **AK-17** | Das Manifest hebt `MinVersion` **weder auf 1.8 noch auf 1.14** an; beide Fähigkeiten werden zur Laufzeit geprüft. |
| **AK-18** | *(neu gefaßt in T-303)* Es gibt **keine** Fläche im Aufgabenbereich und **keinen** Abschnitt in den Add-in-Einstellungen, die ein Postfachrecht ankündigen, erklären oder seine Abwesenheit zusichern — weder einmalig noch dauerhaft, und keine Quittung dafür in `localStorage` oder `roamingSettings`. |
| **AK-19** | Jeder Dateiname geht in jeder Ansicht durch `Foreign`; kein Name wird am Ende gekürzt. |
| **AK-20** | Ein Cloud-Anhang, dessen Adresse nicht mit `http`/`https` beginnt, wird nicht übernommen und erscheint mit dem Grund „Der Ablageort ist keine Webadresse." |
| **AK-21** | Fokus und Ansagen verhalten sich wie in Abschnitt 10; insbesondere wird jeder nicht übernommene Anhang sofort angesagt, jeder gelungene nicht. |
| **AK-22** | Die Knopfbeschriftung „Neue Aufgabe anlegen" ist unverändert. |
| **AK-23** | `DuplicateOffer` ist unverändert: kein neuer Satz, kein neuer Knopf, keine Handlung am gefundenen Todo. |

**Neu in T-303 — der Nachbau (A-19.22a bis A-19.22c, A-19.34):**

| # | Kriterium | Wer |
|---|---|---|
| **AK-24** | Fehlt `Mailbox 1.14`, steht in der Vorschau `Die E-Mail selbst · wird aus den Angaben der Nachricht nachgebaut`. Ist 1.14 vorhanden, steht dort **kein** Zusatz — auch dann nicht, wenn der Abruf später fehlschlägt und in den Nachbau fällt. | integration-dev |
| **AK-25** | Ein Nachbau erscheint im Ergebnis als `– die E-Mail (nachgebaut)`, im **Erfolgston**: keine Warnfarbe, kein Warnzeichen, kein Zusatz in der Überschrift. Darunter steht der Absatz aus 6.3a, vollständig und ungekürzt. | integration-dev |
| **AK-26** | Der Screenreader hört im Ergebnis „… 3 Anhänge hängen daran. Die E-Mail ist ein Nachbau." — der Zusatz fehlt in keiner Ansage, in der er sichtbar dasteht. | integration-dev |
| **AK-27** | **Die Kennzeichnung hängt an der Datei, nicht an dieser Meldung** (A-19.22b): Sie ist am Anhang in SuperTakt sichtbar, sie steht in der Rückfrage vor dem Öffnen, und sie übersteht Datensicherung und Wiedereinspielen (A-19.34, Round-Trip). **Solange das nicht gebaut ist, darf der Satz „Die Datei ist in SuperTakt dauerhaft als Nachbau gekennzeichnet." nicht auf dem Bildschirm stehen** — er wäre eine Auskunft über eine Fläche, die es nicht gibt. | domain-dev, frontend-dev |
| **AK-28** | Scheitert der Nachbau an seiner Formprüfung, erscheint Z4 mit dem Grund „sie ließ sich nicht als Datei nachbauen." und dem Absatz aus 6.4 Fall 2. **Kein** Knopf „Erneut versuchen", **keine** Fehlernummer, **kein** Auszug aus der Formprüfung und **kein** Name der Angabe, an der es lag. | integration-dev |
| **AK-29** | Die drei Grenzen (je Datei, Summe, Anzahl) tragen drei **verschiedene** Sätze, in der Vorschau wie im Ergebnis, und keine Zahl davon steht ausgeschrieben in einer Oberflächendatei. | integration-dev |

**Eine Bemerkung zur Übergabe von AK-27.** Es ist das einzige Kriterium dieses Papiers, das
nicht im Add-in zu erfüllen ist, und zugleich das, an dem A-19.22b hängt. Der Aufgabenbereich
liefert die Eigenschaft (`rebuilt: true` in der Nutzlast); ob sie den Bestand erreicht, in
der Anhangsliste erscheint, in der Rückfrage vor dem Öffnen steht und die Sicherung
übersteht, entscheidet sich in `packages/domain`, `apps/local-api` und `apps/web`. **Bis
dahin ist A-19.22b zur Hälfte erfüllt**, und die fehlende Hälfte ist die, auf die es in drei
Wochen ankommt.

---

## 13. Offene Fragen und Risiken

| # | Frage | An wen |
|---|---|---|
| ~~**F-01**~~ | ~~Bleibt es bei 25 MB je Datei?~~ **Beantwortet in T-300/T-303:** 25 MB je Datei, und die Zahl steht in `packages/domain`, nicht in einem Satz der Oberfläche. Die Sätze nennen sie aus der Antwort des Dienstes. | erledigt |
| **F-02** | **Wo liegen die Bytes zwischen Abruf und Anlegen?** (a) Alles im Aufgabenbereich, ein einziger Anlegeruf mit allen Dateien im Rumpf — dann liegen bei vier 25-MB-Dateien rund 130 MB Base64 im Outlook-Webview, und der Anlegeruf braucht eine eigene Rumpfgrenze. (b) Jede Datei einzeln zum Dienst, der Anlegeruf verweist darauf — dann hält der Webview nie mehr als eine Datei, aber es entsteht ein zweiter Weg unter `/addin`, und ein Abbruch muß dort aufräumen. **Der Fluß dieses Papiers trägt beide.** Die Wahl ist eine Sicherheits- und Speicherfrage, keine Entwurfsfrage. | domain-dev, integration-dev, security-checker |
| ~~**F-03**~~ | ~~Soll eine Gesamtgrenze über alle Anhänge gelten?~~ **Beantwortet in T-300/T-303:** ja — 48 MB in der Summe und 25 Dateien je E-Mail, beide in `packages/domain`. Beide haben einen eigenen Satz (6.2), weil sie einen eigenen Fall benennen. | erledigt |
| **F-04** | Soll die Vorschau bei ausführbaren Endungen (`.exe`, `.bat`, `.lnk`, `.cmd`, `.js`) einen eigenen Hinweis tragen? **Mein Vorschlag: nein** — ein Warnsatz auf jeder E-Mail mit einer ZIP-Datei stumpft ab, und die Sicherung liegt nach A-19.26 ohnehin bei der Rückfrage mit vollem Pfad in SuperTakt. Die Entscheidung gehört aber der Bewertung, die E-108 vor den Bau setzt. | security-checker |
| **F-05** | Dürfen die Sperrlistenkandidaten aus Abschnitt 11 in `textbestand-aufgabenbereich.md` eingetragen werden, und von wem? **Es sind jetzt sechs statt vier** — SP-A-31 ist zurückgezogen, SP-A-33 bis SP-A-35 sind neu, und SP-A-34 darf erst mit AK-27 eingetragen werden. | Orchestrator |
| **F-06** *(neu)* | **Wo steht „(nachgebaut)" in SuperTakt selbst?** Dieses Papier sichert in 6.3a zu, daß die Kennzeichnung dauerhaft am Anhang sichtbar ist und in der Rückfrage vor dem Öffnen steht. Den Wortlaut **dort** entwirft es nicht — die Flächen gehören dem Hauptfenster, und ein Papier über den Aufgabenbereich schreibt keine Sätze in ein fremdes. Verlangt ist nur die **Wortgleichheit**: dort muß „Nachbau" stehen und nicht „Kopie". | Orchestrator, ui-designer |
| **F-07** *(neu)* | Soll die Vorschau auch dann etwas sagen, wenn Mailbox 1.14 vorhanden ist — etwa „wird als Originalnachricht übernommen"? **Mein Vorschlag: nein.** Das ist der Normalfall, und ein Satz, der den Normalfall bestätigt, macht aus dem Ausbleiben des Satzes eine Aussage, die niemand liest. Der Nachbau ist die Abweichung, und nur die wird genannt. | Orchestrator |

| # | Risiko | Wirkung |
|---|---|---|
| **R-a** | `isInline` ist nicht bei jedem Absender und jedem Client gesetzt. Ein Signaturbild kann als Dateianhang durchgehen (A-19.24 verfehlt) und erscheint dann in der Vorschau und am Todo. | Der Benutzer sieht es **vor** dem Anlegen in der Liste — das ist die einzige Gegenmaßnahme, die dieser Entwurf hat, und ein weiterer Grund für die Vorschau. |
| **R-b** | Die Wartezeit macht aus einem Ein-Klick-Vorgang einen Vorgang mit Aufenthalt. Wer täglich zwanzig Todos aus E-Mails anlegt, zahlt das zwanzigmal. | Beobachten. Wird es zur Last, ist die nächste Frage an den Auftraggeber, ob die Übernahme abwählbar sein soll — er hat sie ausdrücklich automatisch bestellt, also wird sie hier nicht abwählbar entworfen. |
| ~~**R-c**~~ | ~~`ReadWriteMailbox` trägt ein entwendetes Add-in-Token weiter als bisher.~~ **Zurückgezogen in T-303**, aus demselben Grund wie R-26 in `risks.md`: Die Grenze ist nicht abgesichert worden, sie ist **nie entstanden**. Ein Risiko über eine Fläche, die es nicht gibt, ist derselbe Fehler wie ein Satz darüber. | — |
| **R-c′** *(an seiner Stelle, neu)* | **Die Verwechslung, gegen die nur ein Wort steht.** Der Nachbau trägt seine Kennzeichnung in der Nutzlast (`rebuilt`), in einer Kopfzeile der Datei und im lesbaren Vorspann — aber am Todo, in der Rückfrage vor dem Öffnen und nach einer Wiedereinspielung trägt sie sie heute **nicht** (AK-27, bei domain-dev und frontend-dev). Bis dahin gilt: Wer die Datei drei Wochen später öffnet, sieht eine E-Mail und hat keinen Grund, an ihr zu zweifeln. | Der Satz aus 6.3a darf **erst** erscheinen, wenn die Kennzeichnung im Bestand liegt. Bis dahin ist die Meldung beim Anlegen die einzige Stelle, an der es steht — und A-19.22b sagt ausdrücklich, daß das nicht genügt. |
| **R-d** *(neu)* | **Die Ablehnung des Nachbaus ist deterministisch und trifft immer dieselben Absender.** Wer eine Nachricht mit einer Angabe schickt, an der die Formprüfung hängenbleibt, schickt sie morgen wieder. Für den Benutzer heißt das: Von genau diesem Absender kommt die E-Mail nie als Datei ins Todo — und der Satz „ein zweiter Versuch ändert daran nichts" sagt ihm das für **diese** Nachricht, nicht für den Absender. | Beobachten. Häuft sich der Fall bei einem regelmäßigen Absender, ist er nicht mehr ein Einzelfall, sondern ein Befund über die Formprüfung, und dann gehört er zu R-28 und nicht in einen Satz der Oberfläche. |
| **R-e** *(neu)* | **Die Vorschau kann sich beim Nachbau irren** (Abschnitt 2, Vorbehalt): Mit Mailbox 1.14 kündigt sie das Original an, und wenn `getAsFileAsync` fehlschlägt, kommt ein Nachbau. Der Benutzer sieht dann im Ergebnis etwas anderes als in der Vorschau. | Hingenommen und benannt. Der Irrtum geht in die **sichere** Richtung: Angekündigt wird das Bessere, geliefert das Schlechtere, und das Ergebnis sagt es. Umgekehrt wäre es ein stiller Ausfall im Sinne von A-19.31. |
