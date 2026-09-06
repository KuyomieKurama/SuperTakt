# T-180 — Drei Nachträge zur Bestandsaufnahme (O-EQ, O-EI, O-EC)

**Aufgabe:** T-180, Welle Z. **Verfasser:** ux-designer.
**Grundlage:** `.claude/team/reports/T-172-visual-qa.md` (Punkt 2), `.claude/team/reports/T-171-ui-designer.md`
(B-1, B-3), E-078 (samt Nachtrag Punkt 6 bis 8), E-080, **E-081**, E-076, E-054, `docs/spec.md`,
`packages/storage/migrations/0010_drop_board_rank.up.sql`.
**Geändert:** ausschließlich `docs/design/textbestand.md` und diese Berichtsdatei. Kein Produktivcode.

---

## 1. O-EQ — UM-04 hat eine andere Bauart, und der Begleittext ist der Träger

### Was die Messung widerlegt hat

T-172 hat gegen die laufende Oberfläche gemessen, was T-163 als Offene Frage 3 stehenlassen musste:

1. Der Löschknopf in `StatusSettings` trägt **echtes, natives `disabled`** (`Primitives.tsx:51`),
   kein `aria-disabled`.
2. Chromium hält Name und Beschreibung im Bedienungshilfen-Baum vor; der Knoten ist nicht entfernt.
3. **Über den Tabulator ist der Knopf nachweislich unerreichbar.** Gemessen: von „Umbenennen"
   springt ein Tab auf „Diese 3 Todos anzeigen" (den Knopf **in** der Begründungsfläche), der
   zweite bereits in die nächste Zeile. Der gesperrte Knopf kommt in der Reihenfolge nicht vor.
4. Die Fläche `status-admin__blocked` (`:568-596`) ist gewöhnlicher, sichtbarer Fließtext, steht im
   DOM **vor** dem Knopf und enthält selbst ein per Tab erreichbares Element.

### Was ich daraufhin geändert habe

**Eine Berichtigung, die ich als solche benenne, statt sie zu glätten.** Der Begleittext stand
**nicht** auf der Streichliste — er stand bereits auf der Sperrliste, aber unter falschem Namen und
mit falscher Begründung: SP-19 hieß „die drei `disabledReason`-Sätze" und begründete die Sperre mit
„Absage mit Begründung **an einem gesperrten Bedienelement**". Beides legt nahe, der Träger sei der
Knopf und der sichtbare Text daneben seine Verdopplung — also ein Kandidat für die nächste
Streichrunde. Genau umgekehrt ist es. Eine falsch begründete Sperre hält nur so lange, bis jemand
die Begründung prüft.

- **SP-19 neu gefaßt** (`docs/design/textbestand.md`, Abschnitt 5): Ort ist jetzt `:519-531` **und**
  `:568-596`, Träger ist ausdrücklich die sichtbare Fläche, Prüfpunkt um SC 1.3.1 und T-172 ergänzt.
- **Neuer Abschnitt 5.1 „Berichtigung zu SP-19"**: die vier Messpunkte, die **benannte Grenze**
  (kein Vorleseprogramm verfügbar — gemessen ist der Bedienungshilfen-Baum und die Erreichbarkeit
  über die Tastatur, **nicht die Aussprache**), und was dauerhaft folgt.
- **UM-04 neu gefaßt** (Abschnitt 8): neuer Titel „Die Regeln zum Status stehen an der Zeile, die
  sie sperren", Erreichbarkeitstabelle mit drei Wegen, **fünf Akzeptanzkriterien für frontend-dev**.
- **Abschnitt 10 Punkt 3** ist von „nicht beantwortet" auf „beantwortet, mit einer Restfrage"
  umgeschrieben.

### Der Kern, in einem Satz

**Verboten ist der Rückbau, nicht der Bau:** den sichtbaren Text zu entfernen und die Auskunft
allein über `aria-describedby` an einem weiterhin nativ gesperrten Knopf zu führen. Das wäre formal
ein Name-Rolle-Wert nach SC 4.1.2 und praktisch eine stumme Tür. Der `aria-describedby` **bleibt**
— als Zugabe für den linearen Durchgang, gedeckt durch E-081 Punkt 2 („Nachtrag 8 gilt gegen
Verluste, nicht gegen Zugaben"). Er wird nur nicht mehr als **der** Weg gezählt.

### Akzeptanzkriterien für frontend-dev (Kurzfassung, vollständig im Papier)

1. `StatusSettings.tsx:372-385` entfernt. Kein Ersatzkasten, keine kürzere Fassung, kein Aufklapper.
2. `status-admin__blocked` **unverändert**: sichtbar, alle zutreffenden Gründe (nicht nur der
   erste), Schloßsymbol, „Diese N Todos anzeigen" innerhalb der Fläche, im DOM vor dem Löschknopf.
3. Löschknopf behält `disabled` **und** `aria-describedby` **und** den Namen „…löschen — derzeit
   nicht möglich". Kein Wechsel auf `aria-disabled` in dieser Aufgabe.
4. **Gegenprobe, gemessen:** Fokus auf „Umbenennen" einer gesperrten Zeile, zweimal Tab — erster
   Tab auf „Diese N Todos anzeigen", zweiter in die nächste Zeile.
5. Der Sperrgrund erscheint nur an gesperrten Zeilen; freie Zeilen tragen keinen leeren Kasten.

---

## 2. O-EI — die Methode, Text ohne JSX zu finden, und das Raster für den Aufgabenbereich

### Der Befund

`apps/outlook-addin/src/ui/create-gate.ts` (T-169) trägt fünf Sätze Oberflächentext und kein JSX.
Die Bauart ist gewollt und war zweimal die Behebung eines Befunds: E-045 (Regel und Text trennen,
`callnumber/labels.ts`) und V-11 aus T-154 (Sperre und Grund aus **einem** Aufruf, damit kein
gesperrter Knopf ohne Grund entstehen kann). `ui/field.ts` hat die Bauart begründet.

### Die entscheidende Messung: der naheliegende Filter hätte die Datei nicht gefunden

Der erste Griff wäre ein Filter auf deutsche Zeichen (`ä`, `ö`, `ü`, `ß`, `„`). Die fünf Sätze
lauten: „Die Call-Nummer stimmt noch nicht." · „Der Titel fehlt." · „Die Frist stimmt noch nicht." ·
„Die Tags werden noch geladen." · „Keine Verbindung zu Takt." **Kein Umlaut, kein Eszett, keine
deutsche Anführung.** Nachgemessen: Der Zeichenfilter nennt 13 `.ts`-Dateien des Aufgabenbereichs
und **`create-gate.ts` ist keine davon**; der Satzfilter nennt 7 und findet sie mit genau fünf
Treffern. Ein Filter, der die kürzesten und ruhigsten Sätze übersieht, übersieht ausgerechnet die,
die E-078 selbst erzeugt hat.

### Neuer Abschnitt 1.1: der Durchgang hat drei Läufe

- **Lauf 1 — die Dateimenge. Die Endung ist kein Filter.** `apps/outlook-addin/src` hat **32**
  Quelldateien, davon **7** mit `.tsx`. Wer über `.tsx` geht, liest 7 von 32 und hält das Ergebnis
  für vollständig.
- **Lauf 2 — der Satzfilter.** Ein Literal, das mit einem Großbuchstaben beginnt, einen
  Kleinbuchstaben enthält und auf `.`, `?`, `!` oder `…` endet. Der genaue Ausdruck steht im Papier,
  Abschnitt 1.1.
- **Lauf 3 — die Form des Exports**, für Beschriftungen ohne Satzzeichen: jedes Modul mit
  `Record<…, string>`, `Object.freeze` aus Zeichenketten oder Rückgabetyp `string`. Im
  Aufgabenbereich 19 von 25 `.ts`-Dateien — eine Liste zum Lesen, kein Urteil.
- **Regel M-01:** Ein Textdurchgang nennt im Bericht die Zahl der gelesenen Dateien **gegen** die
  Zahl der Dateien des Bereichs. Steht dort kein Bruch, ist die Aufnahme gegriffen, nicht gemessen.
- **Regel M-02:** Wandert Text aus JSX in eine reine Funktion, nennt der Kopfkommentar Grund und
  Fläche. Die drei vorhandenen Dateien tun das bereits — deshalb ist dieser Nachtrag eine
  Berichtigung und keine Rüge.

### Neuer Abschnitt 1.2: dieselbe Methode auf das eigene Haus angewandt

Fünf Träger in `apps/web` sind der Aufnahme aus T-163 entgangen, weil sie über Eigenschaftsnamen
lief: `app/connection.ts` (sechs **A**-Sätze über das, was ohne Anwendungshülle nicht geht),
`app/useUpdateNotice.ts` (Meldungen der Versionsprüfung, A-18.9 bis A-18.11), `lib/exportTemplateModel.ts`,
`lib/poolRule.ts` (trägt die **Kompensation für ST-05**), `lib/attachmentLabel.ts` (R-22).

**Keiner der fünf ist ein Streichvorschlag.** Sie sind aufgenommen, **vorläufig gesperrt** und noch
nicht beurteilt — die Sperre ist die vorsichtige Richtung. Die Streichliste bleibt bei zehn.

### Neuer Abschnitt 11: das Raster für integration-dev

So geschrieben, daß es ohne Rückfrage anwendbar ist. Das Urteilsraster (D/S/V gegen F/A/B) gilt
unverändert; vier Gewichte kommen hinzu:

- **AB-1 — Es gibt keine zweite Fläche.** Der Aufgabenbereich lebt in einem Outlook-Fenster an
  einer Nachricht. **B wiegt schwerer** (wer vor einer Absage steht, kann nirgends nachsehen),
  **D bleibt gleich streng** (in einer schmalen Spalte steht fast alles im selben Blickfeld).
- **AB-2 — Von den drei Trägern stehen nur zwei zur Verfügung.** T1 und T2 gelten; **T3 Handbuch
  gilt nicht** für Auskunft, die zur Vollendung der laufenden Handlung gebraucht wird — der
  Benutzer ist in Outlook, nicht in Takt.
- **AB-3 — Der Text kommt aus einer fremden E-Mail.** Die Sätze nennen den abgelehnten Wert nicht
  (B-12.1). Keine Kürzungsfrage; von keinem Textdurchgang berührt.
- **AB-4 — Die Anrede ist entschieden, und die beste ist keine** (E-080 Punkt 1 und 4).

Dazu eine **Warnliste** von fünf Stellen, die dort mit hoher Wahrscheinlichkeit auf die Sperrliste
gehören (Fristhinweis V-03/V-04, die fünf Sperrgründe aus `create-gate.ts`, die zehn Absagegründe
aus `callnumber/labels.ts`, das Duplikatsangebot, die Standard-Tag-Sätze) — ausdrücklich als
Warnung, nicht als Urteil: Das Urteil fällt integration-dev in seiner eigenen Aufnahme.

---

## 3. O-EC — Bedingung, und sie hängt am Bestand

Neuer Eintrag **UM-08** (Umbau, **kein** elfter Streichvorschlag).

### Bedingung, nicht Ablaufdatum

- **Ablaufdatum** scheidet aus: Takt lädt und installiert nichts (A-18.9), wer bei der alten Fassung
  bleibt sieht die Karte weiter — und schwerer: Das Datum beantwortet die falsche Frage. Ob die
  Karte etwas zu sagen hat, hängt daran, **was dieser Bestand erlebt hat**.
- **Fassung** scheidet aus, gleicher Fehler. **Einstellung** scheidet aus: S-12 verbietet ein
  „Nicht mehr fragen", und die Begründung trägt hier genauso.
- **Die Bedingung lautet: Hat dieser Bestand vor der Umstellung existiert?**

### Die Bedingung ist beantwortbar, und die Antwort ist immer „nein"

1. **E-054 fiel während der Entwicklung**, lange vor jeder Veröffentlichung. Erste Auslieferung ist
   **v0.1.0 vom 2026-09-04**; sie hat das regelbasierte Board von Anfang an.
2. Die Umstellung liegt als Migration **`0010_drop_board_rank`** im Bestand — Teil der Kette 0001
   bis 0015, die eine frische Einrichtung in **einem Zug** durchläuft. „0010 ist angewandt" gilt für
   jeden Bestand und unterscheidet nichts.
3. Ihr Kopfkommentar hält fest, daß `board_rank` **nie von einem Aufrufer gesetzt** wurde (T-066).
   Die Karte spricht von einer verlorenen Reihenfolge, die auch vorher keine Benutzerreihenfolge war.

**Es gibt keinen Bestand, für den die Bedingung wahr ist, und es kann keinen mehr geben.**

### Was mit dem Text geschieht: ins Handbuch, nicht spurlos — und zwei Punkte fallen gar nicht

| Punkt der Karte | Gilt frisch? | Wohin |
|---|---|---|
| „Nichts wird mehr gezogen." | ja | steht als `RULE_WHAT_MOVES_A_CARD` im `lead` des Boards (`:372`, bleibt nach ST-05). Die Kartenfassung ist die **vierte** desselben Satzes — **D** |
| „Keine automatische Übersetzung." | ja (**A**) | steht kurz im Leerzustand: „Takt erfindet keine." (`:967`, bleibt nach ST-05) |
| „Ihre Todos sind vollzählig da." | nein | **T3 Handbuch** (documenter) |
| „Der Status bleibt." | halb | Verweisteil nach ST-05 in `TodoFormDialog.tsx:235`; der Rest **T3 Handbuch** |

Die zwei Knöpfe fallen mit: „Erste Spalte einrichten" steht wortgleich drei Zeilen darüber (**D**),
„Zur Todo-Liste" ist ein Navigationsknopf in einem Erklärkasten, den **Regel S-11 verbietet**.

**Reihenfolge ist bindend (E-081 Punkt 4):** Der Handbuchabsatz steht, **bevor** die Karte fällt.

**Der Präzedenzfall steht drei Zeilen über der Karte:** `poolsKnown` (`BoardScreen.tsx:942-951`)
löst dieselbe Klasse Problem und begründet sich selbst — „Fehlt die Angabe, wird der Satz
weggelassen statt geraten." Für UM-08 fehlt die Angabe nicht nur, sie ist unbeschaffbar.

Dazu im Papier: der vollständige **Fluß „Board zum ersten Mal geöffnet"** mit Start, Zuständen A/B/C
(einschließlich des unbekannten Bestands), Aktion, Erfolg, Fehlerpfad und der ausdrücklichen
Feststellung, daß keine Sackgasse entsteht.

---

## 4. Die drei Pflichtaufräumungen

- **UM-02 ist aus der Umbauliste genommen** (E-081 Punkt 3). Der Eintrag steht als „gestrichen"
  mit voller Begründung im Papier, statt spurlos zu verschwinden — sonst legt in drei Wellen jemand
  denselben Vorschlag erneut vor. Ergänzt um die Folge für **UM-01**: An `POOL_MATCH_MODE_HINT` und
  `Attachments.tsx:420-422` fährt UM-01 **ohne Bauartänderung**, weil dort sichtbar ohnehin nur
  einer der Hinweise steht.
- **286 `getByRole`-Zugriffe** sind als bestätigt vermerkt, mit dem Zusatz, daß **E-076 Punkt 3
  berichtigt** ist. Betrifft Abschnitt 1, 6.1, S-04 und S-15.
- **Keine neuen Streichvorschläge.** Die Liste steht unverändert bei ST-01 bis ST-10; der
  Kopfnachtrag sagt das ausdrücklich.

Zusätzlich in Abschnitt 9 als Regel über der ganzen Reihenfolge aufgenommen: **Streichung und
Ausgleich gehören in einen Auftrag** (E-081 Punkt 4), namentlich für ST-05, ST-04, UM-04 und UM-08.

---

## Annahmen

1. **SP-19 war nicht falsch, sondern falsch begründet.** Ich habe den Eintrag berichtigt statt ihn
   neu anzulegen, und die Berichtigung ausdrücklich als solche benannt. Der Auftrag ging davon aus,
   der Begleittext stünde als Vorratskasten in der Aufnahme; er stand bereits gesperrt, aber unter
   dem Namen des Knopfes. Der Vorratskasten der Streichliste ist `:372-385`, und der fällt weiter.
2. **UM-08 ist ein Umbau, keine Streichung.** Damit bleibt die Streichliste bei zehn, und der
   Eintrag trägt einen Träger (T3 für zwei Punkte, T1 für die bereits vorhandenen zwei) — die
   Bedingung aus Abschnitt 3 des Papiers ist damit erfüllt.
3. **Die fünf neu gefundenen `apps/web`-Träger habe ich nicht beurteilt**, nur aufgenommen und
   vorläufig gesperrt. Ein Urteil wäre ein Streichvorschlag gewesen oder eine Sperre ohne Prüfung;
   beides gehört in den Durchgang, nicht in den Nachtrag.
4. **Zur Grenze der Messung** habe ich die Formulierung von visual-qa übernommen und nicht
   verschärft: gemessen ist der Bedienungshilfen-Baum und die Erreichbarkeit über die Tastatur,
   nicht die Aussprache. Wo das Papier „unerreichbar" sagt, meint es „über den Tabulator", und es
   sagt das auch.
5. **Zu O-EC habe ich die Bedingung bis zu ihrer Antwort verfolgt**, statt sie als offene Bedingung
   zu formulieren. Eine Bedingung, deren Wert man messen kann und nicht mißt, verschiebt die
   Entscheidung nur an frontend-dev.

## Risiken

1. **UM-04 ist jetzt eine Aufgabe mit einer Meßauflage** (Kriterium 4). Wird sie ohne die
   Tabulator-Gegenprobe abgenommen, ist der Umbau formal fertig und die Auskunft möglicherweise
   verschwunden. T-172 Risiko 2 sagt dasselbe aus der anderen Richtung.
2. **Die Aussprache durch ein echtes Vorleseprogramm bleibt ungemessen** (NVDA/JAWS unter Windows).
   Der Umbau ist so gebaut, daß die Antwort ihn nicht umwirft — aber er ist nicht dagegen
   abgesichert, daß eine spätere Umgestaltung die sichtbare Fläche wieder in eine reine
   Knopfbeschreibung verwandelt. Deshalb steht die Sperre in SP-19 und nicht nur in UM-04.
3. **Abschnitt 11 ist eine Vorgabe an fremde Hoheit.** Wenn integration-dev die Aufnahme ohne diesen
   Abschnitt fährt, entstehen zwei Raster für eine Produktregel — genau das, was E-078 Nachtrag
   Punkt 7 verhindern soll. Er braucht eine Zuweisung, nicht nur ein Papier.
4. **Der Fristhinweis in zwei Fassungen** ist weiterhin offen (Abschnitt 11.5). Wer von beiden
   Seiten zuerst kürzt, erzeugt die Abweichung, die E-078 Punkt 7 verhindern soll.
5. Kein Sicherheitsbezug. Keine neue Netzadresse, keine Änderung an CSP, Exportformat oder
   Fachlogik. Kein Text mit Anforderungs-ID wird durch diesen Nachtrag gekürzt; UM-08 berührt
   gemessen keinen Prüffall mit Textvergleich und keinen zugänglichen Namen.

## Offene Fragen

1. **An den Orchestrator:** Abschnitt 11 braucht eine Aufgabe für integration-dev. Vorschlag: die
   Aufnahme des Aufgabenbereichs als eigenes Artefakt (`docs/design/…`, fremde Datei), mit
   Abschnitt 11 als Vorgabe und der Warnliste 11.4 als Startpunkt.
2. **An den Orchestrator:** UM-08 braucht **zwei** Beteiligte in **einer** Aufgabe — documenter für
   den Handbuchabsatz, frontend-dev für die Karte, in dieser Reihenfolge. Als zwei Aufträge wäre es
   genau der Fall, den E-081 Punkt 4 verbietet.
3. **An spec-ux-reviewer:** Ist die Beweisführung zu UM-08 tragfähig — E-054 vor v0.1.0, Migration
   0010 in der Kette jeder frischen Einrichtung, `board_rank` nie gesetzt? Wenn ja, ist die Karte
   ohne Adressat. Wenn nein, fehlt mir ein Bestand, den ich nicht kenne.
4. **An den Orchestrator, unverändert aus T-172:** Ein Durchlauf mit echtem Vorleseprogramm unter
   Windows. Er schließt die Restfrage zu UM-04 und zu Abschnitt 10 Punkt 3.
5. **An ui-designer, zur Kenntnis:** UM-04 hat eine Meßauflage bekommen und UM-08 einen Träger. Die
   Gestaltvorgaben aus `textabbau-gestalt.md` Abschnitt 4.4 und 3.9 bleiben davon unberührt — ich
   habe deine Datei gelesen und nicht geändert.

## Nächster Schritt

Welle X+1 kann unverändert laufen (ST-01, ST-02, ST-03, ST-07, ST-09) — dieser Nachtrag berührt sie
nicht. Für Welle X+2 ist UM-04 jetzt vollständig beschrieben und geht **als ein Auftrag** mit ST-04
und ST-08 (Teil `StatusSettings`) an frontend-dev, mit den fünf Akzeptanzkriterien und der
Tabulator-Gegenprobe als Abnahmebedingung. UM-08 und die Aufnahme des Aufgabenbereichs sind zwei
neue Aufträge; beide brauchen eine Zuweisung, keiner braucht eine weitere Vorarbeit von mir.
