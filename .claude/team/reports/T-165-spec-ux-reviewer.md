# T-165 — Wiedervorlage V-03/V-04, die drei Wortlautfragen, erste Stellungnahme zu E-078

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-05
**Gegenstand:** Wiedervorlage von V-03 und V-04 (T-158); O-DH Frage 1 und 2 (T-157); O-CQ
(Berichtigung in T-144); erste Stellungnahme zu E-078 Punkt 3.
**Verbindlich:** `docs/spec.md` Abschnitt 19 (A-19.1, A-19.2, A-19.6, A-19.12, A-19.19, A-19.21),
Abschnitt 15; `.claude/team/decisions.md` E-070 bis E-078; `.claude/team/risks.md` R-21, R-22;
`docs/bedrohungsmodell.md` A-A-5, A-A-5′, A-A-6; WCAG 2.2 SC 1.3.1, 2.4.6, 3.3.1, 3.3.2, 4.1.2,
4.1.3.

**`docs/design/**` liegt weiterhin nicht vor** (T-163 läuft in dieser Welle). Visuelle Referenz
ist damit unverändert das Designsystem aus T-006 und die Musterseite. Kein Widerspruch zwischen
Design und Spezifikation gefunden — es gibt noch kein Design, das widersprechen könnte. Sobald
`docs/design/**` steht, ist diese Prüfung zu wiederholen; das ist keine Formsache, weil T-163 mit
der Sperrliste genau die Sätze anfasst, über die ich hier urteile.

---

## Urteil

| Gegenstand | Urteil |
|---|---|
| **V-03** (kein `aria-describedby` im Aufgabenbereich) | **freigegeben** — behoben, gemessen, an allen zwölf Feldern nachgezählt |
| **V-04** (Wortlaut am Fristfeld) | **freigegeben, unverändert.** Der Satz bleibt in dieser Länge. Begründung in 1.4, samt der kürzeren Fassung, die ich **nicht** freigebe, und der Bedingung, unter der ich sie freigäbe |
| **O-DH Frage 1** (Wirtsname als Ersatzbezeichnung) | **Nein.** **X-04, blockierend** für die Freigabe von A-19.12. Die Änderung gehört in `packages/domain`, **an domain-dev**, nicht in die Oberfläche |
| **O-DH Frage 2** (Rückfrage nennt die Namensauflösung) | **Ja, aber anders als vorgeschlagen.** **X-05, Auflage.** Wortlaut und Bauart in 2.2 |
| **O-CQ** | **erledigt.** `T-144-spec-ux-reviewer.md` trägt jetzt Abschnitt 0.0 und drei Markierungen an Ort und Stelle |
| **E-078 Punkt 3** | Stellungnahme in Abschnitt 4. **Zehn Sätze gesperrt, sechs freigegeben**, jeder einzeln mit Grund |

Neue Befunde: **X-01 bis X-07.** Blockierend: **X-04.** Alles Übrige sind Auflagen und Hinweise.

---

## 1. Wiedervorlage V-03 und V-04

### 1.1 V-03 — tragen wirklich alle zwölf Felder?

**Ja. Nachgezählt, nicht übernommen.** T-158 nennt zwölf; ich habe die zwölf Blöcke einzeln
gegen ihr Bedienelement gelesen.

| Fläche | Feld (`htmlFor`) | Wie die Attribute ankommen | Zeile |
|---|---|---|---|
| S-12 | Call-Nummer (`call`) | `{...aria}` am `input` | `TaskPane.tsx:436` |
| S-12 | Titel (`title`) | `{...aria}` am `input` | `:467` |
| S-12 | **Frist (`due`)** | `{...aria}` am `input type="date"` | `:520` |
| S-12 | Tags (`tags`) | `aria={aria}` an `TagPicker`, dort `withDescription(aria, countId)` am Suchfeld | `:570` → `TagPicker.tsx:175` |
| S-12 | Vermerk (`note`) | `{...aria}` am `textarea` | `:590` |
| S-12 | Dauer (`minutes`) | `{...aria}` am `input type="number"`, **nicht** an der Knopfreihe davor | `:689` |
| S-12 | Leistung (`service`) | `{...aria}` am `textarea` | `:711` |
| S-13 | Adresse des lokalen Dienstes (`baseurl`) | `{...aria}` am `input` | `SettingsView.tsx:187` |
| S-13 | Zugangstoken (`token`) | `{...aria}` am `input`, **nicht** an der Zeile mit dem Knopf | `:212` |
| S-13 | Erprobte Muster (`catalog`) | `{...aria}` am `select` | `:300` |
| S-13 | Regulärer Ausdruck (`pattern`) | `{...aria}` am `input` | `:330` |
| S-13 | Beispieltext (`sample`) | `{...aria}` am `textarea` | `:373` |

Drei Dinge daran halte ich ausdrücklich fest, weil sie über das Verlangte hinausgehen:

1. **Die Behebung liegt dort, wo ich sie verlangt habe** — einmal in `Field`, nicht am Fristfeld.
   `fieldParts` ist die ganze Entscheidung, `Field` zeichnet sie nur (`Primitives.tsx:145-168`).
2. **Der Wächter misst die Aufrufstellen und nicht den Baustein.** `proof-addin.mjs:5191` sammelt
   jeden `<Field …>…</Field>`-Block und beanstandet ihn **namentlich**, wenn er die Attribute
   liegen lässt. Genau das war meine Sorge: ein Baustein, der sie anbietet, und zwölf Stellen, die
   sie vergessen dürfen. Der Wächter hat außerdem einen Boden (`felder.length >= 12`), greift also
   nicht ins Leere, wenn jemand die Felder umbaut.
3. **`id` kommt aus `fieldParts` und nicht von der Aufrufstelle** (`field.ts:98`), und
   `proof-addin.mjs:5217` verbietet eine zweite `id` daneben. Damit ist die Klasse „`label for`
   zeigt auf nichts" strukturell zu, nicht nur an der einen gefundenen Stelle. Das Tag-Suchfeld,
   das diese Klasse trug, ist mit behoben.

### 1.2 Stehen Hinweis **und** Fehler gleichzeitig?

**Ja, und beide sind auch beide erreichbar.** Das war der eigentliche Befund, und er ist an drei
Stellen zugleich gelöst:

| Der alte Fehler | Wo er behoben ist |
|---|---|
| `hint !== undefined && error === undefined` — der Hinweis fiel weg, sobald ein Fehler danebenstand | `field.ts:89` — `showHint` hängt nur noch am Hinweis selbst |
| `aria-describedby` fehlte ganz | `field.ts:92-99` — Hinweis **und** Fehler, in der Reihenfolge der Anzeige |
| Die Meldefläche entstand mit ihrem Inhalt (SC 4.1.3) | `Primitives.tsx:159` — `role="alert"` steht dauerhaft im Baum; `addin.css:426` nimmt ihr den Abstand über `:empty`, **nicht** über `display: none` |

Der maßgebliche Fall, in Zeichen (aus dem Nachweis von T-158, von mir gegen `field.ts`
nachgerechnet):

```
beides   <input id="due" aria-describedby="due-hint due-error" aria-invalid="true" type="date"/>
         <p class="field__hint" id="due-hint">…</p>
         <div class="field__live" role="alert"><p class="field__error" id="due-error">…</p></div>
```

Vier der zwölf Felder können diesen Zustand überhaupt erreichen — Call-Nummer, **Frist**,
Adresse des Dienstes, Regulärer Ausdruck. Am Fristfeld war es der Befund, an den anderen dreien
war es dieselbe Lücke ohne Nummer.

**Ein leerer Text ist kein Text** (`field.ts:89-90`). Das ist keine Kleinigkeit: `error=""` hätte
`aria-invalid` an einem Feld gesetzt, zu dem niemand sagen kann, was falsch ist — eine
Beanstandung ohne Grund ist für eine Vorlesehilfe schlimmer als keine.

**SC 1.3.1, SC 3.3.1, SC 3.3.2 und SC 4.1.3 sind an dieser Fläche damit erfüllt.** V-03 ist
geschlossen.

### 1.3 Zwei Reste, beide klein, beide nicht blockierend

**X-02 — das Tag-Feld beschriftet in zwei Zuständen weiterhin niemanden.** In `load.kind ===
'loading'` und `'failed'` zeichnet `Field` seine Beschriftung mit `htmlFor="tags"` und seinen
Hinweis mit `id="tags-hint"`, aber es gibt kein Bedienelement, das `id="tags"` trüge oder auf den
Hinweis verwiese (`TaskPane.tsx:544-580`). T-158 benennt das in Annahme 5 und nennt es „dort ist
das Feld eine Ladefläche, kein Feld" — das ist richtig beschrieben und trotzdem der Zustand, den
ein Prüfwerkzeug als verwaiste Beschriftung meldet. Es ist **kein** Verstoß gegen ein
Erfolgskriterium (es gibt kein Bedienelement, das einen Namen bräuchte), aber es ist die
Bauart, aus der der ursprüngliche Befund entstanden ist.
**Vorschlag, integration-dev, mit V-08/V-09/V-11 in der Add-in-Nachlese:** In diesen zwei
Zuständen steht kein `Field`, sondern eine Überschrift plus Ladefläche beziehungsweise Meldung.
Ein Feld ohne Feld ist kein Feld.

**X-03 — der Kopfkommentar zeigt auf einen Abschnitt, den es nicht gibt.** `field.ts:16` sagt
„der Nachweispfad (`proof:addin`, Abschnitt 20)"; die Prüfungen stehen in **Abschnitt 19**
(`proof-addin.mjs:4999-5294`, 19a bis 19d). Der Bericht von T-158 sagt ebenfalls 19. Wer die
Zusage nachschlagen will, sucht an der falschen Stelle — und das ist der eine Kommentar, dessen
Zweck das Nachschlagen ist. **Eine Zahl.**

### 1.4 V-04 — der Wortlaut, und ob er in dieser Länge bleiben muss

Der Satz lautet heute (`TaskPane.tsx:515`):

> „Takt sucht in der E-Mail nicht nach einer Frist — du trägst sie selbst ein. Ein Tag, keine
> Uhrzeit; leer lassen heißt: keine Frist."

**Zu den drei Abweichungen von meinem Vorschlag:**

1. **„Takt sucht … nicht" statt „wird nicht aus der E-Mail übernommen" — ich trage sie mit, und
   sie ist besser als mein eigener Vorschlag.** Die Begründung von T-158 ist die richtige und
   nennt einen Umstand, den ich übersehen hatte: Über dem Feld steht im selben Bereich der
   Warnkasten **„Gefunden, aber nicht übernommen"** (`describeDetection`, Fall `implausible`). In
   dieser Nachbarschaft liest sich „wird nicht übernommen" als *gefunden und verworfen* — also
   als genau das „nichts gefunden", das ich in T-154 Abschnitt 3.1 als die falsche Deutung
   benannt habe. Mein Wortlaut hätte den Befund fast wiederhergestellt, den er beheben sollte.
   **Angenommen.**
2. **„Optional" gestrichen.** Richtig, und aus dem genannten Grund: „leer lassen heißt: keine
   Frist" nennt die **Folge** statt einer Eigenschaft. A-19.1 bleibt ausgesprochen und ist
   gemessen (`proof-addin.mjs:5288`). **Angenommen.**
3. **„du" statt „Sie".** Innerhalb des Aufgabenbereichs ist die Wahl folgerichtig — er duzt an
   vier weiteren Stellen. **Für das Produkt ist sie es nicht**, und das ist ein eigener Befund;
   siehe **X-01** unten. Für diesen Satz ändere ich nichts: Eine Anrede an einer Stelle zu drehen,
   während die vier Nachbarn stehenbleiben, macht es schlimmer, nicht besser.

**Muss er in dieser Länge bleiben? Ja.** 129 Zeichen, drei Aussagen, und jede trägt:

| Aussage | Warum sie steht | Freigabe zur Kürzung |
|---|---|---|
| „Takt sucht in der E-Mail nicht nach einer Frist — du trägst sie selbst ein." | Die **Abwesenheit** (E-074 Punkt 4). E-078 Punkt 1 schützt sie ausdrücklich. Sie ist zugleich die einzige Stelle im ganzen Erzeugnis, an der dieser Riegel ausgesprochen wird | **nein** |
| „Ein Tag, keine Uhrzeit" | **Nicht**, weil das Bedienelement es zeigt — das tut es —, sondern **weil die Fläche in Outlook liegt.** Der Benutzer kommt aus einer Anwendung, in der jeder Termin eine Uhrzeit hat, und er legt das Todo gerade aus einer E-Mail über eine Besprechung um 14:00 an. Die Erwartung „hier gehört eine Uhrzeit hin" bringt er mit; sie entsteht nicht aus dem Feld | **nein**, mit einer Bedingung (unten) |
| „leer lassen heißt: keine Frist" | A-19.1, und praktisch: Der Knopf „Todo anlegen" hat **vier** Sperrgründe und nennt keinen (V-11, offen). Ein Benutzer, der vor einem gesperrten Knopf steht, verdächtigt das einzige leere Feld. Dieser Halbsatz nimmt den Verdacht weg | **nein**, solange V-11 offen ist |

**Die kürzere Fassung, die dieselbe Abwesenheit ausspricht** — damit sie dokumentiert ist und
nicht in der nächsten Runde neu erfunden wird:

> „Takt sucht in der E-Mail nicht nach einer Frist — du trägst sie selbst ein. Leer lassen heißt:
> keine Frist." (107 Zeichen)

**Ich gebe sie nicht frei.** Die Bedingung, unter der ich sie freigäbe, ist genau eine: wenn
ui-designer die Aussage „ein Tag, keine Uhrzeit" in die **Darstellung** des Feldes zieht, also
sichtbar an das Bedienelement statt in einen Satz darunter. Dann ist der Halbsatz eine
Verdopplung und fällt nach E-078 Punkt 1. Solange er der einzige Träger ist, fällt er nicht.

Ein zweiter Weg wäre E-078 Punkt 2 — progressive Enthüllung —, und ich halte ihn hier für
**falsch**: Der Satz muss stehen, **bevor** der Benutzer das Feld anfasst, denn seine Aussage ist,
warum das Feld leer ist. Eine Auskunft, die erst beim Hineinklicken erscheint, kommt für diese
Aussage zu spät.

**Wo auf dieser Fläche wirklich Zeichen zu holen sind:** nicht hier, sondern an V-11. Vier
ungenannte Sperrgründe kosten den Benutzer mehr Zeit als jeder Hinweissatz — und ihre Behebung
**fügt** Text hinzu, der eine Sackgasse auflöst. Das ist der Fall, an dem E-078 gegen sich selbst
gemessen wird.

### 1.5 X-01 — das Produkt spricht zwei Anreden

Kein Befund gegen T-158 und kein Befund gegen den Fristsatz, aber ein Befund gegen das Produkt,
und er fällt genau in den Textdurchgang aus E-078.

| Fläche | Anrede | Gemessen |
|---|---|---|
| `apps/web` (Hauptanwendung) | **„Sie"**, durchgehend | über 20 Fundstellen: „Wählen Sie", „Legen Sie", „Prüfen Sie", „Tragen Sie es in den Add-in-Einstellungen ein", „Ihre Todos sind vollzählig da", „läuft mit Ihren Rechten" |
| `apps/outlook-addin` (Aufgabenbereich, Einstellungen) | **„du"** | 5 Fundstellen: `callnumber/labels.ts:33`, `SettingsView.tsx:207`, `TagPicker.tsx:235`, `TaskPane.tsx:288`, `TaskPane.tsx:515` (der neue Fristsatz) |
| `apps/web`, eine Ausnahme | **„dich"** | `NoteField.tsx:59` — „Nur für dich. Gedanken, Zwischenstände, Ansprechpartner …" |

Das ist **ein** Produkt mit zwei Registern, und die Grenze verläuft nicht entlang einer
Überlegung, sondern entlang zweier Dateihoheiten. Der Benutzer wechselt zwischen beiden Flächen
mehrmals täglich; das Add-in verweist sogar wörtlich auf die Hauptanwendung („Das Token findest
du in Takt unter …" gegen „Tragen Sie es in den Add-in-Einstellungen in Outlook ein" — dieselbe
Handlung, von beiden Seiten, in zwei Anreden).

`CLAUDE.md` regelt die Sprache, nicht die Anrede. `docs/spec.md` sagt dazu nichts. Damit ist es
kein Verstoß, sondern eine **fehlende Entscheidung** — und der teuerste Zeitpunkt, sie zu treffen,
ist nach dem Textdurchgang.

**Meine Empfehlung: „Sie", einheitlich.** Drei Gründe, absteigend nach Gewicht:
1. **Die Kosten sind asymmetrisch.** Sechs Sätze wandern, nicht fünfundzwanzig.
2. **Die Sätze mit dem größten Gewicht siezen bereits** — die Rückfrage vor einem Programmstart
   („läuft mit Ihren Rechten") und die Auskunft über die Exportdatei. Diese Sätze sind gesperrt
   (Abschnitt 4); sie umzuschreiben hieße, gesperrte Sätze anzufassen.
3. Es ist ein Werkzeug, mit dem der Benutzer gegenüber einem Kunden abrechnet.

**Es ist aber eine Produktentscheidung und keine Reviewfeststellung.** Ich lege sie vor, ich
entscheide sie nicht. Was ich entscheide: **Nicht je Agent und nicht je Datei.** Solange keine
Entscheidung in `decisions.md` steht, bleibt jede Fläche bei ihrer heutigen Anrede — auch der
neue Fristsatz.

---

## 2. O-DH — die zwei Fragen aus T-157

### 2.1 Ist der bloße Wirtsname die richtige Beschriftung? — **Nein. X-04, blockierend.**

Gemessen an A-19.12: *„Bei Verweis und Datei steht der Titel als Bezeichnung; fehlt er, steht
dort etwas Lesbares aus Adresse beziehungsweise Pfad und nie eine leere Zeile."*

Der Wirtsname ist „etwas Lesbares aus der Adresse" und erfüllt den Buchstaben. Er verfehlt den
Zweck, und zwar aus vier Gründen, von denen der zweite allein trägt.

**Erstens: Die Regel widerspricht sich selbst.** `attachmentLabel` nimmt bei einer **Datei** das
**letzte** Stück des Wertes — den Dateinamen, „nie den vollen Pfad"
(`packages/domain/src/attachment.ts:744-748`). Bei einem **Verweis** nimmt sie seit T-157 das
**erste** — den Wirt, nie den Pfad (`:740`). Zwei Ausprägungen derselben Anforderung, an
entgegengesetzten Enden derselben Zeichenkette. Bei der Datei ist die Wahl richtig: Das letzte
Stück ist das unterscheidende. Beim Verweis ist sie es aus demselben Grund nicht.

**Zweitens, und das ist der tragende Grund: Der zugängliche Name wird mehrdeutig, und er hängt an
einem zerstörenden Knopf.**

```
apps/web/src/components/Attachments.tsx:249
  aria-label={`${kind} öffnen: ${quotedName(label)}`}
apps/web/src/components/Attachments.tsx:284
  label={`${kind} entfernen: ${quotedName(label)}`}
```

Drei Ticketverweise ohne Titel auf demselben Wirt — der Regelfall, den T-157 selbst benennt —
ergeben in derselben Liste **drei Knöpfe mit demselben zugänglichen Namen**: „Verweis öffnen:
„beispiel.example"", dreimal. Und daneben dreimal „Verweis entfernen: „beispiel.example"". Wer
diese Liste mit einer Vorlesehilfe durchgeht oder sie über die Knopfliste ansteuert, kann die drei
nicht unterscheiden — und der zweite Knopf **entfernt einen Anhang**. Das ist kein
Bedienkomfort, das ist ein Weg zum falschen Löschen ohne Rückfrage.

Zur Genauigkeit: **SC 4.1.2** verlangt einen Namen, nicht einen eindeutigen — es ist also
buchstäblich nicht verletzt. Verletzt ist der Zweck von **SC 2.4.6** („Labels describe topic or
purpose"): Eine Beschriftung, die drei verschiedene Ziele gleich benennt, beschreibt keinen Zweck.
Vor T-157 war dieser Fall zu; die Änderung hat ihn geöffnet.

**Drittens: Die zweite Zeile fängt es nicht auf.** Der volle Wert steht in
`.attachment__value muted truncate` (`Attachments.tsx:266`) — und beide Zeilen tragen
`truncate`. In der Anhangkarte einer Detailansicht schneidet die CSS zwei lange Ticketadressen
desselben Wirts an derselben Stelle ab. Der `title` daneben hilft nur der Maus, nicht der Tastatur
und nicht der Vorlesehilfe.

**Viertens: Es ist eine Verschlechterung ohne Gegenleistung.** Die alte Fassung der Oberfläche
lieferte `beispiel.example/ordner/erste-seite`. Der Grund der Zusammenführung (O-CR) war, **dass es
zwei Fassungen gab**, nicht **welche** die bessere war — und die maßgebliche Fassung war, wie
T-157 selbst schreibt, „die tote": Sie hatte keinen Aufrufer außer ihrem Prüffall. Die Aufräumung
war richtig; sie hat nur die falsche der beiden Antworten gewonnen.

**Wo geändert wird: `packages/domain/src/attachment.ts#attachmentLabel`, Fall `link`. An
domain-dev, ausdrücklich nicht in `apps/web`.** Die Oberfläche ruft die Domäne und soll das
weiter tun; eine zweite Fassung in `lib/attachmentLabel.ts` wäre O-CR ein zweites Mal.

**Vorschlag im Wortlaut der Regel** — Wirt **plus** Rest, und der Wirt allein genau dann, wenn es
keinen Rest gibt:

```
Verweis ohne Titel  →  Wirtsname + Pfad + Abfrage + Fragment
                       Ist der Pfad nur "/" und Abfrage und Fragment leer:
                       der Wirtsname allein.
```

Damit:

| Adresse (Normalform) | heute | vorgeschlagen |
|---|---|---|
| `https://beispiel.example/` | `beispiel.example` | `beispiel.example` (unverändert richtig) |
| `https://beispiel.example/tickets/4711` | `beispiel.example` | `beispiel.example/tickets/4711` |
| `https://beispiel.example/s?call=4711` | `beispiel.example` | `beispiel.example/s?call=4711` |

**Vier Auflagen an die Umsetzung:**

1. **Das Schema fällt weg, der Rest nicht.** `https://` sagt dem Benutzer nichts, was er hier
   entscheiden müsste — es gibt ohnehin nur `http` und `https` (A-A-2). Alles danach unterscheidet.
2. **Kein neues Sicherheitsthema, und das ist belegbar:** Der Wert ist die **Normalform**
   (A-A-3, `normalizeAttachmentLink`), unsichtbare Zeichen sind an der Tür abgewiesen
   (`hasInvisibleAddressCharacter`), und der `!ok`-Zweig derselben Funktion gibt **heute schon**
   den vollen rohen Wert als Beschriftung zurück (`attachment.ts:742`). Ein voller Pfad in der
   Beschriftung ist also keine neue Klasse Text. Die Anzeige führt ihn unverändert durch
   `<Foreign>` (E-063).
3. **Der Rückgabewert bleibt niemals leer** (A-19.12). Die vorgeschlagene Regel kann nicht leer
   werden: Der Wirt eines `ok`-Ergebnisses ist nicht leer, und das ist an derselben Stelle
   zugesichert, auf die sich `attachmentLabel` schon heute beruft (`attachment.ts:470-473`).
4. **Die neun gemessenen Fälle aus T-157 Abschnitt 3 und die Prüffälle in
   `packages/domain/test/**` ziehen mit** (unit-tester). Die E2E-Fälle bleiben grün, ohne
   angefasst zu werden — sie messen mit `toContainText` über die ganze Zeile, und der volle Wert
   steht weiterhin in der zweiten (T-157 hat das nachgesehen).

**Interimsstand, falls die Welle nicht reicht:** Es ist ein Ausdruck. Solange er nicht steht, ist
A-19.12 formal erfüllt und praktisch nicht; ich führe X-04 deshalb als blockierend für die
**Freigabe von A-19.12**, nicht für die Welle.

**X-07, Hinweis am Rande, damit er nicht verlorengeht.** Der Kopfkommentar von `attachmentLabel`
begründet den Ort der Funktion so: „Der Aufgabenbereich des Add-ins zeigt Todos, die
Hauptanwendung zeigt sie, und eine zweite Fassung wäre eine zweite Gelegenheit, den leeren Fall zu
vergessen" (`attachment.ts:698-701`). **Der Aufgabenbereich zeigt keine Anhänge** — in
`apps/outlook-addin/src/**` kommt das Wort `attachment` kein einziges Mal vor, und A-19.19
schließt sie strukturell aus. Der **Ort** der Funktion ist trotzdem richtig, aber aus dem anderen
Grund, den dieselbe Datei nennt: Es gab zwei Fassungen, und sie antworteten verschieden. Der Satz
gehört berichtigt, bevor jemand auf ihn hin eine Anhangfläche im Add-in für vorgesehen hält.
**An domain-dev, zusammen mit X-04, eine Zeile.**

### 2.2 Soll die Rückfrage sagen, dass Windows den Namen anders auflöst? — **Ja. X-05, Auflage.**

**Die Frage ist richtig gestellt, und die Antwort ist ja.** Was heute passiert (`rechnung.exe.`):

| Was der Benutzer liest | Woher es kommt |
|---|---|
| Überschrift „Diese Datei wird ausgeführt" | `runsWhenOpened` über den **aufgelösten** Namen |
| „Eine Datei mit der Endung „exe" ist ein Programm …" | `extensionOf` über den **aufgelösten** Namen |
| Dateiname: **`rechnung.exe.`** | der **rohe** Wert aus dem Bestand |
| Vollständiger Pfad: `…\rechnung.exe.` | der **rohe** Wert aus dem Bestand |

Vier Zeilen, zwei Namensbegriffe, und nichts sagt, dass es zwei sind. Der Benutzer sieht einen
Namen, der auf einen Punkt endet, und daneben eine Behauptung über eine Endung „exe", die er dort
nicht wiederfindet. Er hat dann zwei Möglichkeiten: Takt für ungenau zu halten (dann klickt er
weiter) oder die Regel selbst zu kennen (dann brauchte er den Dialog nicht).

**Das ist genau die Klasse, die R-21 und E-072 Punkt 3 schließen sollen.** Die Rückfrage lebt
davon, dass sie „die Wahrheit über die Datei sagt und über die Wirkung nicht lügt". Sie lügt hier
nicht — sie **schweigt** an der Stelle, an der die Anzeige und die Wirkung auseinandergehen. Der
Nachtrag zu R-21 vom 2026-09-05 beschreibt genau diese Divergenz; sie ist im Urteil behoben und
in der Auskunft nicht.

**Ich nehme den Vorschlag aus T-157 nicht, sondern seine Substanz.** Der Vorschlag lautete:

> „Der Name endet auf einen Punkt; Windows lässt ihn beim Öffnen weg und startet `rechnung.exe`."

Vier Einwände, alle klein, aber zusammen tragen sie:

1. **Er nennt nur den Punkt.** Nachgestellte **Leerzeichen** fallen genauso weg, ebenso Mischungen
   (`rechnung.lnk. . `). Ein Satz, der die Bedingung wörtlich nennt, wird in dem Fall, den er nicht
   nennt, falsch gelesen.
2. **„startet" gilt nur für den ausführenden Fall.** Bei `bericht.txt.` wird nichts gestartet, und
   die Divergenz besteht trotzdem. Ein Wortlaut, der beide Fälle trägt, ist besser als zwei.
3. **Er versteckt den aufgelösten Namen in einem Fließsatz.** Der Benutzer soll zwei Namen
   **vergleichen**; ein Vergleich gehört untereinander in dieselbe Spalte, nicht in einen Satz
   neben einen Kasten.
4. **Er erklärt Windows, wo er die Datei erklären soll.** Die Auskunft, die zählt, ist „**dieser**
   Name wird geöffnet", nicht „so funktioniert das Betriebssystem".

**Meine Fassung — eine dritte Zeile im vorhandenen `openfile`-Block, und sie erscheint nur, wenn
die beiden Namen auseinandergehen:**

```
Dateiname
rechnung.exe.

Name beim Öffnen
rechnung.exe
Punkte und Leerzeichen am Ende lässt Windows beim Öffnen weg.

Vollständiger Pfad
C:\…\rechnung.exe.
```

Ein zusätzliches Beschriftungspaar und **ein** Satz von 60 Zeichen. Warum diese Form:

- **Sie stellt die beiden Namen untereinander.** Der Unterschied ist dann zu sehen und nicht zu
  erschließen — das ist der ganze Zweck.
- **Ein Wortlaut für beide Fälle.** „Name beim Öffnen" gilt für `bericht.txt.` genauso wie für
  `rechnung.exe.`; die Überschrift des Dialogs sagt bereits, ob geöffnet oder ausgeführt wird.
- **Sie erscheint nur im Fall der Divergenz** — E-078 Punkt 2 in Reinform, und sie ist damit
  keine Zeile, die man nach dem dritten Mal überliest.
- **Sie steht vor dem vollen Pfad, nicht statt seiner.** A-A-6 Punkt 1 und R-21 bleiben
  unangetastet: Der volle Pfad steht ungekürzt und umbrechend, und er behält den **rohen** Wert.

**Vier Auflagen, und die erste ist die wichtigste:**

1. **Die Bedingung kommt aus derselben Rechnung wie die Wirkung.** Der Dialog darf sie **nicht**
   selbst ermitteln. `apps/web/src/lib/attachmentLabel.ts` bekommt eine exportierte
   `effectiveFileNameOf(path): ForeignText`; `extensionOf` ruft sie (es schneidet heute selbst,
   `:165`), und der Dialog zeigt die Zeile genau dann, wenn
   `effectiveFileNameOf(path) !== fileNameOf(path)`. Eine zweite Abschneideregel im Dialog wäre
   eine **dritte** Wahrheit über den Namen, und O-CU war der Beweis, wie teuer die zweite schon
   war.
2. **Der angezeigte `Dateiname` bleibt roh und ungekürzt.** Die neue Zeile ist eine Ergänzung, nie
   ein Ersatz. T-157 hat das für den Dateinamen richtig entschieden, und diese Auflage schreibt es
   fest.
3. **Beide neuen Teile gehen durch `foreignText`** (A-A-6 Punkt 2). Der aufgelöste Name ist
   derselbe fremde Text, nur kürzer.
4. **Ein Kommentar sagt, was diese Zeile nicht ist.** Sie ist **keine** Kontrolle. Die Kontrolle
   ist `has_indirect_extension`/`effective_file_name` in `apps/desktop/src-tauri/src/attachment.rs`,
   bei jedem Aufruf. Derselbe Absatz, den `runsWhenOpened` schon trägt (O-CA), und aus demselben
   Grund: Wer die Anzeige für die Grenze hält, baut die Grenze aus.

**Zwei Anschlüsse, die ich dabei ausdrücklich nicht schließe:**

- **V-07 bleibt offen und wird durch X-05 nicht ersetzt.** Bei einem `.lnk` aus dem Altbestand
  zeigt der Dialog weiterhin die milde Fassung („Diese Datei wird geöffnet"), obwohl die Hülle
  danach abweist. Mit X-05 sähe der Benutzer immerhin `rechnung.lnk` als aufgelösten Namen — die
  Reihenfolge der Auskunft bliebe trotzdem verkehrt herum. V-07 ist die richtige Behebung dafür.
- **Die zwei Windows-Namensfragen aus T-157 Risiko 1** (alternative Datenströme, 8.3-Kurznamen)
  gehören security-checker und sind mit X-05 nicht berührt. Wenn dort etwas dazukommt, kommt es
  in dieselbe Zeile — die Form trägt beliebige Divergenzen, weil sie den aufgelösten Namen zeigt
  und nicht den Grund.

---

## 3. O-CQ — erledigt

`.claude/team/reports/T-144-spec-ux-reviewer.md` ist berichtigt. Der Satz ist **nicht gelöscht**
(der Verlauf einer Prüfung ist selbst ein Beleg), sondern an vier Stellen unmissverständlich als
überholt markiert:

| Stelle | Was jetzt dort steht |
|---|---|
| **Neuer Abschnitt 0.0** am Kopf, vor Abschnitt 0 | Tafel mit allen vier überholten Stellen, dem geltenden Wortlaut und dem Beleg; dazu ein Absatz **„Für den Dokumentierer"**: übernommen wird **„Überfällig"**, und „Überfällig seit N Tagen" darf in kein Handbuch, kein Glossar und keine Freigabe |
| Vorspann zu Teil 2 | Lesehinweis: Abschnitt 19 ist gebaut, vier Stellen dieses Teils sind überholt, alles Übrige gilt |
| 8.2 Merkmalstafel, Zeile „Wortlaut" | `~~„Überfällig seit 3 Tagen"~~ **ÜBERHOLT (T-165)**` |
| 8.2 Absatz „Ein Punkt, der leicht übersehen wird" | Blockzitat darunter: **in der Fassung überholt, in der Sache gültig** — das absolute Datum im zugänglichen Namen steht und ist bestätigt |
| 8.5 Begriffstafel, Zustand 1 | `~~im Satz „Überfällig seit N Tagen"~~ **ÜBERHOLT**`, und „Überfällig seit N Tagen" steht jetzt in der Spalte **„Nicht"** |

**Eine vierte Stelle habe ich mitgenommen, die im Auftrag nicht stand, aber dieselbe Klasse ist:**
8.4, Zeile „Fokus beim Öffnen". T-144 verlangte dort den Fokus **auf „Abbrechen"** bei
ausführbaren Endungen. Gebaut und in T-154 Abschnitt 4.3 bestätigt ist der Fokus auf dem
**Dialog** (`tabIndex={-1}`), in jedem Fall und nicht nur bei ausführbaren Endungen — die
strengere Lösung (A-A-6 Punkt 4). Ohne Markierung hätte der Dokumentierer eine Fokusregel
beschrieben, die dem Bau widerspricht, und zwar an der einen Fläche, an der Fokus eine
Sicherheitsfrage ist.

`DeadlineFlag.tsx:77` beruft sich im Quelltext auf „T-144 Abschnitt 8.5" für Zustand 3. Diese
Zeile ist **nicht** angefasst und bleibt gültig; die Berufung stimmt weiterhin.

**Anmerkung zur Machart:** In dieser Sitzung stand kein Werkzeug für eine Änderung an Ort und
Stelle zur Verfügung, nur Lesen und vollständiges Schreiben. Die Datei ist deshalb vollständig neu
geschrieben worden. Inhaltlich geändert sind ausschließlich die oben aufgeführten Stellen; alles
Übrige ist unverändert übernommen. Wer es genau wissen will, liest den Unterschied im
Versionsverwaltungssystem — das ist billiger als mein Wort dafür.

---

## 4. Erste Stellungnahme zu E-078 Punkt 3

E-078 Punkt 3: *„Kein Satz fällt, den ein Prüfer verlangt hat, ohne dass derselbe Prüfer
zustimmt."* Hier ist die Zustimmung, satzweise. Was nicht in dieser Liste steht, habe ich nicht
verlangt und sperre ich nicht — ux-designer und ui-designer sind dort frei.

### 4.0 Zwei Regeln vorweg, die für alles darunter gelten

**Regel 1 — der Prüfstein ist nicht die Zeichenzahl.** Die Frage lautet: *Was weiß der Benutzer
nach der Streichung nicht mehr, und wo könnte er es sonst sehen?*

* Antwort „es steht ohnehin auf dem Bildschirm" → **streichen.** Das ist E-078 Punkt 1, und es
  trifft mehr Sätze in diesem Erzeugnis, als mir lieb ist.
* Antwort „es steht im Handbuch" → **nicht streichen.** Eine Rückfrage vor einem Programmstart
  wird nicht im Handbuch gelesen. Dokumentation ist kein Ersatz für eine Auskunft am Ort der
  Handlung.
* Antwort „nirgends" → **gesperrt**, unabhängig von der Länge.

**Regel 2 — gekürzt wird der sichtbare Text, nie der zugängliche Name.** E-078 Punkt 5 sagt, ein
Sinnbild ohne zugänglichen Namen sei ein Verstoß gegen SC 4.1.2. Die Kehrseite gehört dazu: Ein
zugänglicher Name, der auf die Länge des sichtbaren Textes gekürzt wird, ist derselbe Verstoß von
der anderen Seite. Konkret und namentlich: `DeadlineFlag`s `aria-label`
(`"Überfällig — Frist: 03.09.2026"`) ist **länger** als sein sichtbarer Text und muss es bleiben
(`DeadlineFlag.tsx:117`). Dasselbe gilt für `Attachments` (`"Verweis öffnen: …"`) und `Chip`
(`"… entfernen"`).

**Regel 3 — eine rot gewordene Prüfung ist das Ergebnis, nicht das Problem.** Vier der gesperrten
Sätze werden von Prüfpfaden gemessen (`proof:addin` 19d, `proof:foreign`, `contrast`,
`web-build-smoke`). Wer einen davon kürzt und danach die Prüfung anpasst, hat eine Freigabe still
zurückgenommen. Die Prüfung wird angepasst, **nachdem** ich zugestimmt habe, nicht damit ich es
nicht merke.

### 4.1 Gesperrt — zehn Sätze, jeder mit seinem Anker

| # | Satz / Text | Fläche | Anker | Warum er nicht fällt |
|---|---|---|---|---|
| G-1 | **Der volle Pfad, ungekürzt, umbrechend, nie in der Mitte gekürzt** | `AttachmentOpenDialog` | R-21, A-A-6 Punkt 1, T-144 8.4 | Kein Satz, aber die größte Textmenge dieses Dialogs — und deshalb das erste, was ein Textdurchgang anfasst. Ein Pfad mit Auslassungszeichen verbirgt genau das Stück, an dem man sieht, wo die Datei herkommt |
| G-2 | „Takt übergibt diese Datei an die Standardanwendung des Systems — dasselbe wie ein Doppelklick **im Dateimanager**. **Was danach geschieht, entscheidet die Anwendung, die Ihr System dafür eingestellt hat.**" | dito | A-A-6 Punkt 3, E-072 Punkt 3 | Der zweite Satz ist die einzige Stelle, an der Takt sagt, dass es die Kontrolle abgibt. Er nennt eine **Folge** (E-078 Punkt 1). Freigegeben ist daraus genau **ein** Wort, siehe F-5 |
| G-3 | „**Diese Datei wird dabei ausgeführt.** Eine Datei mit der Endung „exe" ist ein Programm oder eine Befehlsfolge und **läuft mit Ihren Rechten**." | dito | R-21, A-A-6 Punkt 3 | Warnung vor einer nicht umkehrbaren Handlung — E-078 Punkt 1 nennt sie wörtlich als geschützt. „läuft mit Ihren Rechten" ist der Halbsatz, der aus „ein Programm" eine Folge macht |
| G-4 | Knopf **„Ausführen"** statt „Öffnen", „OK", „Ja" | dito | T-144 8.4 | E-078 will kurze Schaltflächentexte und bekommt hier den kürzestmöglichen. Er darf nur nicht **gleichgemacht** werden: Der Wortwechsel ist die halbe Auskunft |
| G-5 | „Takt sucht in der E-Mail nicht nach einer Frist — du trägst sie selbst ein. Ein Tag, keine Uhrzeit; leer lassen heißt: keine Frist." | S-12 Fristfeld | V-03, V-04, E-074 Punkt 4, A-19.1, A-19.21 | Abschnitt 1.4. Alle drei Aussagen tragen; die kürzere Fassung ist dort dokumentiert und **nicht** freigegeben |
| G-6 | „Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute fällig — **es hat schlicht keinen dieser Zustände.**" | S-03 Fristkarte | A-19.5, T-144 8.2 Auflage 2 | Der dritte Halbsatz ist der tragende: Er unterscheidet **„kein Zustand"** von **„Zustand unbekannt"**. Er steht bereits nur im Leerzustand — also schon in der Form, die E-078 Punkt 2 verlangt |
| G-7 | „Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört. **Takt kopiert nur Bilder; Verweise und Dateien merkt es sich als Adresse beziehungsweise Pfad.**" | S-03 Anhänge, Leerzustand | A-19.15, T-144 8.3 Fläche A | Der zweite Satz setzt die Erwartung, an der A-19.15 sonst scheitert: Wer glaubt, Takt hebe die Datei auf, hält ihr Verschwinden für einen Fehler von Takt. Steht schon nur im Leerzustand |
| G-8 | „Bleibt in Takt. Wird nie exportiert — **auch nicht über eine eigene Exportvorlage.**" | S-03 Vermerkfeld | A-7.2, R-06 | Der Nachsatz beantwortet den einzigen echten Zweifel: Die Vorlagen **sind** konfigurierbar. Ohne ihn ist die Zusage eine Behauptung über den heutigen Stand |
| G-9 | Der Grund, den die Hülle nennt, **im stehenbleibenden Dialog** statt im Meldungsstapel | S-03 Anhang öffnen | A-19.15, T-144 8.3 Fläche E, T-154 4.3 | Kein einzelner Satz, sondern ein Ort. „Der Dialog schließt sich nicht, als wäre etwas geschehen" ist die Aussage, und sie besteht aus der Abwesenheit einer Bewegung |
| G-10 | Die **leere Meldefläche im Baum** (`role="alert"` / `role="status"`, auch ohne Inhalt) | überall | B-5 (T-116), SC 4.1.3 | Kein Text — aber E-078 Punkt 5 („keine unnötigen Hinweisfelder") liest sich wie eine Einladung, sie zu entfernen. Sie ist leer und muss leer dastehen; ohne sie wird die Meldung nicht angesagt |

### 4.2 Freigegeben — sechs Stellen, mit Bedingung

| # | Was fällt | Fläche | Grund | Bedingung |
|---|---|---|---|---|
| F-1 | „**Optional — **" | `TodoFormDialog.tsx:227` | Genau die Begründung, die T-158 im Add-in schon benutzt hat und die ich dort angenommen habe: „leer lassen heißt: keine Frist" sagt dasselbe und nennt die **Folge** statt einer Eigenschaft | Der Rest des Satzes bleibt (siehe X-06) |
| F-2 | „**Interner Vermerk des Todos.**" | S-12 Vermerkfeld, `TaskPane.tsx:586` | Reine Verdopplung der Beschriftung darüber: „**Vermerk (bleibt in Takt)**". E-078 Punkt 1, „was doppelt dasteht" | „Er geht nicht in die Abrechnung." **bleibt** — das ist die Folge, nicht die Wiederholung |
| F-3 | „**Dieser Text wird exportiert.**" | S-12 Leistungsfeld, `TaskPane.tsx:707` | Verdoppelt die Beschriftung „**Leistung (geht in die Abrechnung)**" | „Text aus der E-Mail gehört in den Vermerk, nicht hierher." **bleibt** — dieser Satz verhindert, dass Kundentext in eine Rechnung wandert |
| F-4 | „**Alle Beispiele sind erfunden.**" | S-13, `SettingsView.tsx:297` | Eine Aussage über das Vorhaben, nicht über die Bedienung. Sie gehört in den Quelltext (dort steht sie ohnehin) und nicht auf den Bildschirm des Benutzers | keine |
| F-5 | „**im Dateimanager**" | `AttachmentOpenDialog`, G-2 | Der Vergleich „dasselbe wie ein Doppelklick" trägt ohne die Ortsangabe. Zwei Wörter — ich nenne sie, damit sichtbar ist, dass ich diesen Dialog nicht pauschal sperre, sondern satzweise gelesen habe | Der Rest von G-2 bleibt unangetastet |
| F-6 | „**Der Grund steht in Worten, nicht als Wert.** Takt nennt bewusst nicht, ob das Token fehlte, falsch war oder inzwischen ersetzt wurde." | S-13, `SettingsView.tsx:278` | Der erste Satz erklärt dem Benutzer die **Bauart der Meldung** und nicht seine Lage. Das ist ein Kommentar, der in die Oberfläche gerutscht ist | Der zweite Satz **bleibt**: Er verhindert, dass der Benutzer den Fehler an der falschen Stelle sucht |

### 4.3 Nicht anfassen — aber nicht wegen E-078

| Stelle | Warum sie ausgenommen ist |
|---|---|
| `GlobalSearch.tsx:244` — „Kein Treffer für „…". Gesucht wird in Titeln, Call-Nummern und Leistungstexten — nicht im Vermerk." | Dieser Satz **stirbt mit C-22**: Sobald die Suche den Vermerk trifft (E-075 Punkt 2, T-154 Abschnitt 2.4 Punkt 4), wird er falsch. Ihn im Textdurchgang zu kürzen heißt, ihn zweimal anzufassen und beim zweiten Mal zu vergessen. Er gehört in die C-22-Änderung |
| Alle Texte in `apps/web/src/showcase/**` | Musterseite, kein Benutzertext. Sie darf länger sein als das Produkt — sie erklärt es |
| Anrede in allen genannten Sätzen | X-01. Solange keine Entscheidung steht, wird keine Anrede gedreht, auch nicht „nebenbei beim Kürzen" |

### 4.4 X-06 — eine Doppelung, die ich melde und nicht auflöse

`TodoFormDialog.tsx:227` (Hinweis am Feld) und `TodoDetailScreen.tsx:421` (Beschreibung der
Fristkarte) tragen **dieselbe Aussage**:

> „Sie ändert nichts an Pools, Spalten, Buchungen oder Export."

Öffnet der Benutzer den Bearbeiten-Dialog **aus S-03**, steht der Satz zweimal gleichzeitig auf
dem Bildschirm — der Dialog über der Karte, die ihn ebenfalls trägt. Das ist E-078 Punkt 1,
„was doppelt dasteht", wörtlich.

**Ich löse es nicht, und zwar aus einem Grund, der bei der naheliegenden Lösung übersehen wird:**
Derselbe Dialog ist auch aus **S-02** und **S-04** erreichbar, und dort steht die Karte nicht
dahinter. Wer den Satz im Dialog streicht, streicht ihn auf zwei von drei Wegen ganz.

**Meine Auflage an die Auflösung, gleich welche gewählt wird:** Die Aussage muss auf **jedem** Weg
zum Feld vorhanden sein. Das lässt genau zwei Wege zu — den Satz in der Karte zu streichen (sie
trägt zusätzlich „und sie steht in keinem Export", A-19.17, und **das** bleibt), oder ihn im
Dialog zu behalten und die Karte auf die Exportaussage zu kürzen. Der zweite ist der ruhigere. Die
Wahl gehört ux-designer; die Bedingung gehört mir.

---

## 5. Befunde

```
X-01  Abschnitt 15, E-078 Punkt 4   Produktweit — Anrede
      Abweichung: `apps/web` siezt durchgehend (über 20 Fundstellen), das Add-in duzt
      (5 Fundstellen: callnumber/labels.ts:33, SettingsView.tsx:207, TagPicker.tsx:235,
      TaskPane.tsx:288, TaskPane.tsx:515), und `apps/web/src/components/NoteField.tsx:59`
      duzt als einzige Stelle der Hauptanwendung. Ein Produkt, zwei Register, und die
      Grenze verläuft entlang zweier Dateihoheiten statt entlang einer Überlegung. Das
      Add-in verweist sogar wörtlich auf die Hauptanwendung, in der anderen Anrede.
      Weder `CLAUDE.md` noch `docs/spec.md` regeln es — es ist keine Verletzung, sondern
      eine fehlende Entscheidung.
      Vorschlag: Entscheidung in `decisions.md`, nicht je Agent. Ich empfehle „Sie":
      sechs Sätze wandern statt fünfundzwanzig, und die Sätze mit dem größten Gewicht
      (Rückfrage vor einem Programmstart, Auskunft über die Exportdatei) siezen bereits und
      sind gesperrt. Bis dahin bleibt jede Fläche bei ihrer Anrede, auch der neue
      Fristsatz. Der Textdurchgang aus E-078 ist der richtige Anlass und der letzte
      billige.

X-02  SC 1.3.1 (Klasse V-03)   S-12 Aufgabenbereich, TaskPane.tsx:531-581
      Abweichung: In den Zuständen „lädt" und „nicht verbunden" zeichnet `Field` die
      Beschriftung „Tags" mit `htmlFor="tags"` und den Hinweis mit `id="tags-hint"`,
      aber es gibt kein Bedienelement, das `id="tags"` trüge oder auf den Hinweis
      verwiese. T-158 benennt es (Annahme 5) und begründet es richtig — es bleibt die
      Bauart, aus der V-03 entstanden ist. Kein Verstoß gegen ein Erfolgskriterium: Es
      gibt kein Bedienelement, das einen Namen bräuchte.
      Vorschlag: integration-dev, in der Add-in-Nachlese mit V-08, V-09 und V-11. In
      diesen zwei Zuständen steht kein `Field`, sondern eine Überschrift plus Ladefläche
      beziehungsweise Meldung. Ein Feld ohne Feld ist kein Feld.

X-03  —   apps/outlook-addin/src/ui/field.ts:16
      Abweichung: Der Kopfkommentar nennt „der Nachweispfad (`proof:addin`, Abschnitt 20)".
      Die 17 Prüfungen stehen in **Abschnitt 19** (proof-addin.mjs:4999-5294, 19a bis 19d);
      der Bericht von T-158 sagt ebenfalls 19. Das ist der eine Kommentar, dessen Zweck das
      Nachschlagen ist, und er verweist ins Leere.
      Vorschlag: integration-dev, eine Zahl.

X-04  A-19.12, SC 2.4.6   S-03 Anhangliste, packages/domain/src/attachment.ts:726-743
      BLOCKIEREND für die Freigabe von A-19.12
      Abweichung: Seit T-157 (O-CR) ist die Ersatzbezeichnung eines Verweises ohne Titel
      der **Wirtsname allein**. Drei Ticketverweise auf demselben Wirt — der Regelfall —
      ergeben in derselben Liste drei Knöpfe mit identischem zugänglichem Namen
      („Verweis öffnen: „beispiel.example""), und daneben drei mit identischem Namen zum
      **Entfernen** (Attachments.tsx:249 und :284). Wer die Liste mit einer Vorlesehilfe
      oder über die Knopfliste durchgeht, kann sie nicht unterscheiden, und der zweite
      Knopf entfernt einen Anhang. Die zweite Zeile fängt es nicht auf: `.attachment__label`
      und `.attachment__value` tragen beide `truncate`. Zusätzlich widerspricht die Regel
      sich selbst — bei einer **Datei** nimmt dieselbe Funktion das **letzte** Stück des
      Wertes (den Dateinamen, das unterscheidende), bei einem **Verweis** das **erste**.
      Es ist eine Verschlechterung ohne Gegenleistung: Die Zusammenführung war richtig, sie
      hat nur die falsche der beiden Antworten gewonnen.
      Vorschlag: **domain-dev**, in `packages/domain/src/attachment.ts#attachmentLabel`,
      Fall `link` — ausdrücklich nicht in der Oberfläche: Wirtsname + Pfad + Abfrage +
      Fragment; ist der Pfad nur „/" und Abfrage und Fragment leer, der Wirtsname allein.
      Das Schema fällt weiter weg. Kein neues Sicherheitsthema: Der Wert ist die Normalform
      (A-A-3), unsichtbare Zeichen sind an der Tür abgewiesen, und der `!ok`-Zweig derselben
      Funktion gibt heute schon den vollen rohen Wert zurück. Prüffälle in
      `packages/domain/test/**` ziehen mit (unit-tester); die E2E-Fälle bleiben grün.

X-05  R-21, E-072 Punkt 3, A-A-5′, A-A-6 Punkt 1/2   S-03 Anhang öffnen, AttachmentOpenDialog
      Auflage, nicht blockierend
      Abweichung: Überschrift, Folgesatz und Endung rechnen seit T-157 mit dem **aufgelösten**
      Namen; Dateiname und Pfad zeigen den **rohen**. Bei `rechnung.exe.` liest der Benutzer
      einen Namen, der auf einen Punkt endet, und daneben eine Aussage über die Endung „exe",
      die er dort nicht wiederfindet. Der Dialog lügt nicht — er schweigt an genau der Stelle,
      an der Anzeige und Wirkung auseinandergehen, und das ist die Klasse, die R-21 schließen
      soll. Der Nachtrag zu R-21 vom 2026-09-05 beschreibt die Divergenz; im Urteil ist sie
      behoben, in der Auskunft nicht.
      Vorschlag: frontend-dev. Ein drittes Beschriftungspaar im vorhandenen `openfile`-Block,
      **nur bei Divergenz**: „Name beim Öffnen" / der aufgelöste Name (mono, `bdi`), darunter
      der Satz „Punkte und Leerzeichen am Ende lässt Windows beim Öffnen weg." Vier Auflagen:
      (1) Die Bedingung kommt aus derselben Rechnung wie die Wirkung — `effectiveFileNameOf`
      wird aus `lib/attachmentLabel.ts` exportiert, `extensionOf` ruft sie, der Dialog
      vergleicht damit; eine zweite Abschneideregel im Dialog wäre eine dritte Wahrheit über
      den Namen. (2) Der angezeigte `Dateiname` bleibt roh, die Zeile ist Ergänzung und nie
      Ersatz. (3) Der volle Pfad bleibt ungekürzt und umbrechend (A-A-6 Punkt 1). (4) Beide
      neuen Teile durch `foreignText`, und ein Kommentar sagt, dass diese Zeile keine Kontrolle
      ist — die steht in `attachment.rs`, bei jedem Aufruf. Ersetzt V-07 nicht.

X-06  E-078 Punkt 1   S-02/S-03/S-04, TodoFormDialog.tsx:227 und TodoDetailScreen.tsx:421
      Abweichung: „Sie ändert nichts an Pools, Spalten, Buchungen oder Export." steht zweimal
      und ist aus S-03 heraus **gleichzeitig** sichtbar — der Dialog über der Karte, die ihn
      ebenfalls trägt. Die naheliegende Lösung (im Dialog streichen) ist falsch: Derselbe
      Dialog ist aus S-02 und S-04 erreichbar, wo die Karte nicht dahintersteht; der Satz
      fiele auf zwei von drei Wegen ganz weg.
      Vorschlag: ux-designer im Textdurchgang. **Auflage:** Die Aussage muss auf jedem Weg
      zum Feld vorhanden sein. Damit bleiben zwei Wege — den Satz in der Karte streichen (sie
      trägt zusätzlich „und sie steht in keinem Export", A-19.17, und das bleibt), oder ihn im
      Dialog behalten und die Karte auf die Exportaussage kürzen. Der zweite ist der ruhigere.

X-07  A-19.19   packages/domain/src/attachment.ts:698-701
      Abweichung: Der Kopfkommentar von `attachmentLabel` begründet den Ort der Funktion mit
      „Der Aufgabenbereich des Add-ins zeigt Todos, die Hauptanwendung zeigt sie". Der
      Aufgabenbereich zeigt **keine Anhänge** — in `apps/outlook-addin/src/**` kommt das Wort
      `attachment` kein einziges Mal vor, und A-19.19 schließt sie strukturell aus. Der Ort ist
      trotzdem richtig, aber aus dem anderen Grund, den dieselbe Datei nennt: Es gab zwei
      Fassungen, und sie antworteten verschieden.
      Vorschlag: domain-dev, zusammen mit X-04, eine Zeile. Sonst hält der nächste Agent eine
      Anhangfläche im Add-in für vorgesehen — und das ist die eine Fläche, die es nach A-19.19
      und E-072 Punkt 1 nie geben darf.
```

---

## 6. Annahmen

1. **Die Nummernreihe X-01 bis X-07** setzt C-xx (T-025), B-x (T-116), U-xx (T-144), V-xx (T-154)
   und W-xx fort, ohne mit ihnen zu kollidieren. Gemessen: `X-0[0-9]` kommt in
   `.claude/team/**` bisher nicht vor.
2. **Ich habe keinen Prüflauf gestartet.** Alle Zahlen sind aus dem Quelltext gelesen oder aus
   T-157 und T-158 übernommen und dort als übernommen gekennzeichnet. Selbst gemessen habe ich:
   die zwölf `<Field>`-Blöcke mit ihrem Bedienelement, `fieldParts` gegen alle vier Fälle, die
   Anredefundstellen in beiden Anwendungen, die Abwesenheit von `attachment` in
   `apps/outlook-addin/src/**`, `truncate` an beiden Zeilen der Anhangzeile, und die
   `aria-label`-Bildung an Öffnen- und Entfernen-Knopf.
3. **X-04 habe ich am Code abgeleitet, nicht mit einer Vorlesehilfe gehört.** Die
   Namensbildung ist eindeutig (eine Zeichenkettenverkettung aus `label`), und `label` ist bei
   zwei Verweisen ohne Titel auf demselben Wirt derselbe Wert. Der Fall braucht keinen Läufer,
   er braucht zwei Anhänge.
4. **Ich habe die Grenze zwischen „blockierend" und „Auflage" wie in T-154 gezogen:** ob die
   Fläche dem Benutzer etwas Falsches sagt oder etwas Richtiges nicht sagt. X-04 ist blockierend,
   weil ein zugänglicher Name drei verschiedene Ziele gleich benennt und einer der beiden Knöpfe
   löscht — das ist nicht „sagt zu wenig", das ist „sagt etwas Falsches über die Wirkung".
5. **Bei E-078 habe ich nur gesperrt, was auf eine Prüferforderung mit Nummer zurückgeht.** Wo
   ich mir über die Herkunft nicht sicher war (F-2, F-3, F-4, F-6 sind Sätze der Add-in-Fläche,
   die ich nicht namentlich verlangt habe), habe ich **freigegeben** statt gesperrt. E-078
   Punkt 3 schützt Prüferforderungen, nicht Prüfergeschmack.
6. **`docs/design/**` existiert nicht.** Ich habe gegen das Designsystem aus T-006 und die
   Musterseite gemessen. Sobald T-163 liegt, ist Abschnitt 4 dieses Berichts gegen die dortige
   Sperrliste zu legen — sie und dieser Abschnitt sind zwei Hälften derselben Freigabe.

---

## 7. Risiken

1. **Sicherheit, und es ist das ernsteste dieser Runde: X-04.** Zwei gleich benannte Knöpfe, von
   denen einer entfernt, sind kein Barrierefreiheitsmangel am Rand — sie sind ein Weg zum
   Datenverlust, und er trifft ausgerechnet die Benutzer, die sich am wenigsten dagegen wehren
   können. Der Anhang ist nach dem Entfernen weg; eine Rückfrage steht dort nicht (Entfernen läuft
   nach A-19.11 mit `ConfirmDialog`, aber die Rückfrage nennt denselben mehrdeutigen Namen).
2. **Sicherheit, zweiter Rang: X-05.** Kein Loch — die Hülle prüft, und sie prüft seit T-157
   richtig. Aber die Rückfrage lebt davon, dass ihr Wortlaut mit der Wirkung mitgeht. Ein
   Benutzer, der einmal gelernt hat, dass die Anzeige und die Aussage des Dialogs nicht
   zusammenpassen, liest den Dialog beim dritten Mal nicht mehr. Das ist R-20 in einer anderen
   Fläche.
3. **Prozessrisiko: der Textdurchgang aus E-078 läuft parallel zu offenen Befunden.** T-163 nimmt
   den Text von `apps/web` auf, während X-04, X-05, X-06, V-07 und V-11 noch Text **ändern** oder
   **hinzufügen** werden. Eine Sperrliste, die vor diesen Änderungen entsteht, ist beim Erscheinen
   unvollständig. Ich schlage vor, sie ausdrücklich als Stand und nicht als Abschluss zu führen.
4. **X-01 ist billig, solange nichts entschieden ist, und teuer danach.** Jede Welle, die neue
   Oberflächentexte schreibt, verdoppelt die Zahl der Sätze, die eine spätere Vereinheitlichung
   anfassen muss. Der Fristsatz aus T-158 ist bereits der fünfte.
5. **Keine echten Call-Nummern, keine Kundendaten, keine Zugangsdaten** in diesem Bericht. Alle
   Beispielwerte sind erfunden (`beispiel.example`, `rechnung.exe.`, `4711`) oder stammen aus
   vorhandenen Berichten.
6. **Unsichtbare Zeichen:** Dieser Bericht und die Neufassung von `T-144-spec-ux-reviewer.md`
   enthalten ausschließlich gewöhnliche Leerzeichen, deutsche Anführungszeichen, Gedankenstriche
   und Auslassungszeichen. `proof:codepoints` gehört trotzdem über beide gelaufen, bevor die
   Welle geschlossen wird — ich konnte ihn nicht starten.

---

## 8. Offene Fragen an den Orchestrator

1. **X-01, Anrede: „Sie" oder „du"?** Es ist die einzige Frage in diesem Bericht, die ich nicht
   entscheiden kann und auch nicht entscheiden sollte. Sie gehört nach `decisions.md`, und sie
   gehört **vor** den Textdurchgang aus E-078 Punkt 4 — sonst wird derselbe Text zweimal
   angefasst.
2. **Geht X-04 in diese Welle oder in die nächste?** Es ist ein Ausdruck in `packages/domain`,
   aber domain-dev läuft in dieser Welle nicht mit. Ich führe es als blockierend für die Freigabe
   von A-19.12, nicht für die Welle — wenn A-19.12 vorher freigegeben werden soll, braucht das
   eine Entscheidung und keine Auslassung.
3. **`TimeScreen.tsx:66` (offene Frage 3 aus T-157):** Ich habe sie **nicht** geprüft; sie stand
   nicht in meinem Auftrag und ich wollte sie nicht nebenbei beantworten. Meine erste Neigung
   deckt sich mit der von T-157 — ein Filtervorschlag, der sich um Mitternacht unter dem Blick des
   Benutzers verschiebt, wäre eine Verschlechterung —, aber das ist eine Neigung und keine
   Prüfung. Sie gehört in einen eigenen kleinen Auftrag, zusammen mit der Frage, was die Ansicht
   nach dem Tageswechsel dem Benutzer **sagt**.
4. **Wer räumt die Reste der Add-in-Fläche ab?** V-08, V-09, V-11 und jetzt X-02 und X-03 sind
   fünf kleine Punkte in einer Hoheit. Derselbe Rat wie in T-154 und T-116: eine Aufgabe, nicht
   fünf Zeilen in fünf Aufgaben. V-11 ist davon der einzige, der einen Benutzer heute
   stehenbleiben lässt.
5. **Wird `T-144-spec-ux-reviewer.md` Abschnitt 0.0 an den Dokumentierer weitergereicht?** Die
   Berichtigung nützt nur, wenn sie gelesen wird. Ich schlage vor, sie im Board an der Zeile zu
   O-CQ zu vermerken, statt sich darauf zu verlassen, dass jemand den Bericht von vorn liest.

---

## 9. Nächster Schritt

1. **Sofort und ohne Welle: X-01 entscheiden.** Es ist eine Zeile in `decisions.md` und die
   Voraussetzung dafür, dass der Textdurchgang aus E-078 einmal statt zweimal läuft.
2. **Nächste Welle, domain-dev:** X-04 (der Ausdruck) und X-07 (die Zeile im Kommentar) —
   dieselbe Datei, ein Griff. Danach unit-tester über die Prüffälle in `packages/domain/test/**`.
3. **Nächste Welle, frontend-dev:** X-05, zusammen mit **V-07** — beide sitzen in
   `AttachmentOpenDialog` und beide betreffen die Ehrlichkeit derselben Rückfrage. Sie einzeln zu
   bauen heißt, den Dialog zweimal zu lesen.
4. **Nächste Welle, integration-dev:** die Add-in-Nachlese als **eine** Aufgabe — V-08, V-09,
   V-11, X-02, X-03. V-11 zuerst; er ist der einzige, der heute jemanden aufhält.
5. **Danach, ux-designer:** Abschnitt 4 dieses Berichts gegen die Sperrliste aus T-163 legen. Die
   zehn gesperrten Sätze und die sechs freigegebenen sind meine Zustimmung im Sinn von E-078
   Punkt 3; was dort nicht steht, ist nicht gesperrt und braucht meine Zustimmung auch nicht.
6. **Zuletzt, documenter:** `T-144-spec-ux-reviewer.md` Abschnitt 0.0 ist die Vorlage für
   „Überfällig", nicht Abschnitt 8.5 allein.
