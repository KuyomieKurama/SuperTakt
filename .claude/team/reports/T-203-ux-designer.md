# T-203 — Ein Ausgang, der schweigt; ein Träger, der allein steht; zwei Zahlen, die gealtert sind

**Rolle:** ux-designer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md` (Abschnitte 7, 8, 13), `.claude/team/decisions.md` (E-025, E-034,
E-078, E-081, E-087), `docs/design/textbestand.md`, `docs/benutzerhandbuch.md`, Berichte
**T-200** (Z-47 bis Z-55), T-184 (8.2), und der laufende Baum.

**Zur Form dieses Berichts (E-087 Punkt 4).** Für mich ist jede Datei außer `textbestand.md` eine
fremde Datei. Dieser Bericht nennt deshalb **keine Zeilennummer** und belegt mit Datei und Zitat.
Wo eine Zahl steht, steht das Datum ihrer Messung daneben, und wo ich sie nicht selbst gemessen
habe, steht das auch.

---

## Kurzfassung

```
Aufgabe: T-203 — O-HX (der Wortlaut am Ausgang von „Leistung nachtragen"),
         O-IA (Sperrlisteneintrag für den Handbuchabsatz, und die Sorte dahinter),
         Zusatz (die Zahlen und Zeilen des eigenen Papiers, E-087 Punkt 4)
Status: braucht Review — O-HX ist neuer Oberflächentext und geht nach E-078 Punkt 3
        zur Genehmigung an spec-ux-reviewer. O-IA und der Zusatz sind fertig.
```

| Gegenstand | Ergebnis |
|---|---|
| **O-HX** Wortlaut | **verfaßt** — Abschnitt 12 von `textbestand.md`. **Nicht ein Satz, sondern vier Lagen und drei Fassungen** |
| **O-HX** woran die Anwendung die Lage erkennt | an der **Tagesgruppe** (`loadDayGroupInsight`), **nicht am Feldwert** — das ist die eine Abweichung von T-200 Z-49, und sie kommt aus Z-48 |
| **O-HX** Nebenbefund, neu | **der Weg zerstört sein eigenes Rückkehrziel** — der auslösende Knopf wird beim Erfolg ersetzt, nicht umbeschriftet. Nicht gemessen, Meßauftrag benannt |
| **O-IA** Sperrlisteneintrag | **SP-22 eingetragen**, mit Grund und Datum |
| **O-IA** braucht es eine Sorte? | **Ja** — **T3-A „Alleinträger nach Fall"**, mit drei Pflichtangaben. Abschnitt 5.2, neu |
| **Zusatz** Zahlen | zwei nachgemessen, **beide veraltet**: 286 → **315**; „fünf Kennungen" → es waren sechs und sind heute **null**. Abschnitt 1.3, neu |

---

## 1. O-HX — der Wortlaut, und warum er nicht einer ist

### 1.1 Die Frage, die gestellt war

Ein Satz oder zwei? **Drei**, verteilt auf vier Lagen — und die schwierige ist nicht die dritte,
sondern die, in der Takt es **nicht weiß**.

| Lage | Erkannt an | Ton | Titel | Rumpf |
|---|---|---|---|---|
| **L1** Gruppe trägt Text | `blockedReason === null` **und** `previewProblem === null` | `success` | „Buchung geändert." | „Die Tagesgruppe dieses Todos ändert sich mit." — **wie heute** |
| **L2** Gruppe ohne Leistung | `blockedReason !== null` | `warning` | „Buchung geändert — noch nicht abrechenbar." | „Für diesen Tag steht auf diesem Todo noch keine Leistung. Ohne sie bleibt die Tagesgruppe (1 h 20 min) beim Export stehen." |
| **L3** Takt weiß es nicht | `previewProblem !== null` | `warning` | „Buchung geändert — Exportwert unbekannt." | „Was diese Tagesgruppe beim Export ergibt, konnte Takt gerade nicht ermitteln: 〈Satz des Dienstes〉" |
| **L4** nichts zu sagen | `insight === null` oder die Abfrage scheitert | `success` | „Buchung geändert." | kein Rumpf |

**Woran die Anwendung die Lage erkennt.** An `loadDayGroupInsight(todoId, calendarDayOf(<neuer
Anfang>))` aus `apps/web/src/app/dayGroup.ts` — der Vorschau, also demselben Plan, mit dem der
Lauf rechnet (R-17). **Der Aufruf ist gebaut, wird für genau diese Frage nach dem Timerstopp schon
benutzt (`TimerContext.tsx`, `reportStopped`) und ist in `BookingDialogs.tsx` bereits importiert.**
Es entsteht kein Mechanismus, keine Fläche, kein Baustein.

### 1.2 Warum jede Fassung in ihrer Lage wahr ist

- **L1** behauptet nichts über den Export. Sie nennt eine **Folge** (F): Die Rundung hängt an der
  Gruppe, also ändert eine geänderte Buchung die Gruppe mit. Wahr auch dann, wenn nie eine Sperre
  im Spiel war — der Regelfall an vier der fünf Aufrufstellen des Dialogs.
- **L2** spricht eine **Abwesenheit** aus (A) und nennt ihre Folge. Beides kommt aus der Vorschau,
  nicht aus einer Ableitung.
- **L3** sagt, was Takt weiß, und hört auf, wo es aufhört; der Grund des Dienstes steht wörtlich
  (S-10).
- **L4** sagt nur, was geschehen ist.

**Und der Fall, um den es E-034 geht, landet in L1.** Eine leere Buchung in einer Gruppe, die eine
andere Buchung mit Text trägt, wird nicht gemahnt und nicht gewarnt. Das ist die Probe.

### 1.3 Der eine Punkt, in dem ich von T-200 Z-49 abweiche

Sein Vorschlag bindet den Rumpf **an den Wert**: *„Bleibt die Leistung leer, sagt er es — „Die
Leistung ist weiterhin leer. Die Tagesgruppe geht damit nicht in den Export.""*

Diagnose, Richtung, Ton, Sorte (**A**) und die Absage an ein `error` am Feld übernehme ich
vollständig. **Die Bindung übernehme ich nicht.** An `note.trim() === ""` gebunden, sagt der zweite
Satz *„geht damit nicht in den Export"* auch dann, wenn eine andere Buchung derselben Gruppe Text
trägt — dann ist er **falsch**, und zwar genau in dem Fall, den E-034 schützt. Es wäre der heutige
Fehler im Spiegel: heute eine Erfolgsmeldung für eine mißlungene Handlung, dann eine Warnung für
eine gelungene.

**Die Begründung dafür ist seine eigene, aus Z-48:** *„Gesperrt ist die Tagesgruppe, nicht die
Buchung … Ein `NoteField.error` an einer einzelnen Buchung könnte diese Aussage gar nicht
wahrheitsgemäß tragen."* Das gilt für den Toast wie für das Feld. Der Kanal liegt eine Ebene
höher; die **Bindung** muß es auch.

### 1.4 Drei Wortlautentscheidungen, die eine Begründung brauchen

1. **„noch nicht abrechenbar", nicht „gesperrt".** „Gesperrt" ist vergeben: Nach einem Export sind
   die enthaltenen Buchungen gesperrt (SP-17). Dasselbe Wort für zwei Zustände wäre die
   Verwechslung, die SP-15 an „abgerechnet"/„nicht abgerechnet" mühsam auseinanderhält.
2. **„noch nicht abrechenbar", nicht „Speichern nicht möglich".** Gespeichert **wurde**. Ton
   `warning`, nie `danger`; `toasts.failure` bleibt der nicht erfolgten Speicherung vorbehalten.
   Damit ist der Pflichtcharakter draußen, vor dem T-200 warnt.
3. **Der Rumpf von L2 ist zeichengleich der des Stoppdialogs.** `TimerContext.tsx` sagt heute nach
   dem Stopp denselben Satz. **Nicht** „weiterhin leer" statt „noch keine Leistung" — zwei
   Abschriften laufen auseinander, sobald eine gepflegt wird (C-24, Designsystem Regel 8). Auflage:
   Der Satz wandert nach `lib/labels.ts` als Baustein mit der Sekundenzahl als Parameter, **beide**
   Stellen holen ihn dort, der Kopfkommentar nennt Grund und Flächen (Regel M-02). Der Titel des
   Stoppdialogs wird dabei **nicht** angefaßt.

### 1.5 Was ich ausdrücklich **nicht** verlange

- **Kein `error` und kein `required` am Feld** (E-034, P-6, Z-47).
- **Kein Rückweg am Toast.** S-13 erlaubt einen; hier ist er falsch, weil der Benutzer auf der
  Fläche steht, die ihn trägt.
- **Keine Erklärung der Regel im Toast.** Sie steht bereits zweimal auf demselben Weg
  (`BILLING_NOTE_MAY_BE_EMPTY` unter dem Feld, die Dialogbeschreibung darüber).
- **Kein zusätzlicher Satz im Dialog.** spec-ux-reviewer merkt an, der Dialog nenne seinen Anlaß
  nicht. Richtig — und er soll es nicht: An vier der fünf Aufrufstellen wäre das ein Satz **auf
  Vorrat** (V). Wollte man ihn dennoch, ginge das nur zustandsgebunden (T1) mit einem Anlaßvermerk
  durch alle fünf Stellen; eigene Aufgabe, eigene Vorlage, **nicht** Bedingung für Z-49.

### 1.6 Der Befund, der beim Nachzeichnen des Flusses aufgetaucht ist

**Der Weg zerstört sein eigenes Rückkehrziel.** In `apps/web/src/components/ExportGroups.tsx`
steht an der Buchungszeile

> `entry.note === "" ? <Button …>Leistung nachtragen</Button> : <IconButton … />`

— zwei verschiedene Bausteine an derselben Stelle, umgeschaltet durch genau den Wert, den der
Benutzer soeben eingetragen hat. **Gelingt das Nachtragen, wird der auslösende Knopf ersetzt, nicht
umbeschriftet**; der Knoten, auf den `FormDialog` den Fokus zurückgibt, ist dann nicht mehr da. In
`TemplatePreview.tsx` liegt derselbe Vorgang milder: dort bleibt der Baustein, und nur seine
Beschriftung wechselt von „Leistung nachtragen" auf „Bearbeiten" — der Fokus überlebt, landet aber
auf einem Bedienelement, das jetzt anders heißt, ohne daß es gesagt würde.

**Nicht gemessen** — aus der Bauart geschlossen. Meßauftrag an e2e-tester, und er ist billig: nach
dem Speichern `document.activeElement` prüfen. Steht er auf `body`, ist der Tastaturbenutzer an
den Anfang der Seite geworfen, im Pflichtklickpfad „Exportstatus an jeder Stelle sichtbar".
**Die Anforderung gilt unabhängig vom Ausgang der Messung** (Abschnitt 12.5 des Papiers); welche
der zwei Bauarten sie erfüllt, entscheidet **ui-designer** (Dichte, E-078 Punkt 4).

### 1.7 Drei Nachbarbefunde, benannt und nicht beauftragt

- **(a)** „Leistung nachtragen" steht an **vier** Stellen (gemessen 2026-09-06). Drei öffnen den
  Dialog an der Buchung; der vierte — die Liste der ausgelassenen Gruppen **nach** einem Lauf in
  `ExportScreen.tsx` — springt statt dessen auf das Todo, wo die Buchung erst gesucht werden muß.
  Derselbe Name, zwei Entfernungen. Fluß-, kein Wortlautbefund.
- **(b)** Der **Anlegen**-Zweig desselben Dialogs („Zeit von Hand erfassen") kann dieselbe Lage
  erzeugen und schweigt dazu. Er sagt nichts **Falsches** — deshalb nicht blockierend —, aber es
  bleibt dieselbe Handlung mit zwei Antworten.
- **(c)** Der Rumpf „Die Tagesgruppe dieses Todos ändert sich mit." steht **zweimal** im Produkt:
  in `BookingDialogs.tsx` (ändern) und in `TodoDetailScreen.tsx` (**löschen**). Wer die einzige
  Buchung mit Leistung löscht, hinterläßt eine gesperrte Gruppe und liest denselben Satz. Nicht
  angefaßt, benannt.

---

## 2. O-IA — der Träger, und die Sorte, die er begründet

**Eingetragen: SP-22**, `docs/benutzerhandbuch.md` › „Mit dem Kanban-Board arbeiten" ›
**„Herkunft der Spalten"**, fremde Hoheit **documenter**. Anker ist der Wortlaut („Vor der ersten
Veröffentlichung wies eine interne Reihenfolge …"), Prüfpunkte sind UM-08, T-200 Z-54, E-054,
A-5.4, E-081 Punkt 4. **Aufgenommen 2026-09-06.**

**Ja, es braucht eine Sorte.** SP-01 bis SP-21 stehen auf der Liste, weil **ein Prüfer den Satz
verlangt hat**; ihr Grund steht im Satz oder daneben. SP-22 steht dort aus dem umgekehrten Grund:
Der Absatz war **streichbar, weil er doppelt stand** — und ist es nicht mehr, sobald die zweite
Fassung fällt. **Es ist die Umkehrung von D**, und genau diese Bewegung hat T-195 als eigene
Fehlerart beschrieben: eine Welle halbiert eine Freigabe, danach sehen beide Listen vollständig
aus.

> **T3-A — Alleinträger nach Fall.** Wird eine Aussage von zwei Trägern auf einen zurückgeführt,
> kommt der verbliebene Träger auf die Sperrliste. Der Eintrag entsteht **mit der Freigabe der
> Streichung**, nicht mit ihrem Bau.

**Drei Pflichtangaben, die kein bisheriger Eintrag führt:**

1. **Die Hoheit der Datei.** Alle übrigen Einträge zeigen in `apps/web/src`; ein Handbuchdurchgang
   liest diese Liste heute nicht. Eine neue Fassung geht an **zwei**: den Prüfer, der den Fall
   freigegeben hat (spec-ux-reviewer, T-200), **und** den Hoheitsinhaber (documenter, T-201).
2. **Die gefallene Fläche und das Datum ihres Falls.** Ohne sie sieht der Absatz aus wie
   Geschichtserzählung — und wäre als solche zu Recht gestrichen worden, **wäre die Karte noch
   da**. Fehlt die Angabe, ist der Eintrag eine Behauptung.
3. **Die Aussage, nicht der Wortlaut.** Gesperrt ist, **was** dort steht, nicht **wie**: *kein Todo
   ging verloren oder wurde verschoben*, und *der Status ist eine eigene Eigenschaft, unabhängig
   von der Spalte*. Das ist der Unterschied zu SP-02, wo der volle Pfad zeichengleich bleibt.

**Wann so ein Eintrag fällt:** genau dann, wenn die Aussage wieder an einer zweiten Stelle steht.

**Der nächste Fall ist absehbar und vorgemerkt, nicht eingetragen.** **UM-06** führt den
Anhangssatz auf den Leerzustand zusammen; mein eigenes Papier sagt bereits, er werde „nach ST-08
die einzige Fassung". Derselbe Vorgang. Der Eintrag entsteht mit der **Freigabe** von UM-06/ST-08
und in demselben Auftrag — nicht heute auf Verdacht, denn ein Sperreintrag für eine noch nicht
genehmigte Streichung sperrt einen Zustand, den es nicht gibt.

---

## 3. Zusatz — das eigene Papier gegen den Baum

**Zwei Zahlen nachgemessen, beide veraltet.** Gemessen am **2026-09-06** mit ripgrep über den
Arbeitsbaum (`.gitignore` geachtet, Bauergebnisse damit außen vor). **Kein `git grep`** — dieser
Durchgang hatte keine Schale; der Unterschied zum Nachtrag von E-087 ist genannt, nicht
verschwiegen.

| Zahl | Stand laut Papier | Heute | Urteil |
|---|---|---|---|
| `getByRole` in `tests/e2e` | **286 in 27 Dateien** (T-180, 2026-09-05) | **315 in 32 Dateien** | **nach einem Tag veraltet.** Dieselbe Alterung wie 222 → 286. Der Satz, den sie trägt, trägt weiter; die Zahl ist ab jetzt Stand vom 2026-09-06 |
| Kennungen im Oberflächentext (**S-19**, „fünf Stellen") | **fünf** | **null** im Produkt | **war falsch und ist erledigt.** Es waren sechs (T-184 8.2, Anlaß von E-087); die sechste — `ExportAudit.tsx`, „… Das Feld ist freiwillig (E-047)" — ist inzwischen ebenfalls gefallen, und der Prüffall in `tests/e2e/export-mixed-status-and-billing.spec.ts` endet heute **vor** der Kennung. **S-19 bleibt als Regel** |

**Was nicht nachgemessen ist und ab jetzt als Größenordnung gilt:** 436 textführende Eigenschaften,
rund 240 lange Zeichenketten, 7 dauerhafte Erklärkästen, 26 Titelattribute, 247 Textvergleiche, 21
Leerzustände, die Dateimengen 32/7 und 19/25. Alles Stände vom 2026-09-05, seither zwei Wellen mit
Streichungen. **Als Nachweis nicht mehr zu benutzen.**

**Die Zeilenangaben sind gekennzeichnet, nicht nachgezogen.** Das Papier führt über die Abschnitte
4 bis 8 mehrere hundert davon. T-196 hat gemessen, was sie wert sind. Abschnitt 1.3 hält deshalb
fest: gesucht wird über den **Wortlaut**; die Spalte „Wortlaut (Anfang)" der Sperrliste **ist**
bereits der Anker, die Zeilen in der Spalte „Ort" sind Hinweis und werden nicht nachgeführt — eine
stille Aktualisierung erzeugt genau die Zusicherung, gegen die E-087 gerichtet ist.

**Ein Nebenbefund, damit ihn niemand als Restposten mißversteht.** Die **Musterseite** trägt
weiterhin über ein Dutzend Kennungen in sichtbarem Text. Das ist **kein** Verstoß gegen S-19: Dort
sind die Texte Prüfdokumentation, und die Kennung ist die Auskunft, um die es geht. Wer sie in
einem späteren Durchgang „aufräumt", nimmt der Musterseite ihren Zweck.

---

## 4. Die Pflichtflüsse, soweit dieser Bericht sie berührt

| Fluß | Stand |
|---|---|
| **Timer auf erledigtem Todo** | unberührt. `reactivationTitle` (SP-16) bleibt zeichengleich; der Rumpf des Stoppdialogs wird **Vorlage**, nicht Gegenstand |
| **Export einschließlich Statuswechsel** | **Kern dieses Berichts.** Abschnitt 12 schließt den Ausgang, an dem heute eine Erfolgsmeldung für eine mißlungene Handlung steht. Berührt zusätzlich über 1.6 den Fokusrückweg |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | unberührt. Am Feld ändert sich nichts, `BILLING_NOTE_MAY_BE_EMPTY` bleibt zeichengleich (SP-08), SP-09 ist nicht Gegenstand |
| **Kanban Drag & Drop** | unberührt |
| **Tiefe Tag-Ordner, Standard-Tags** | unberührt |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | berührt: `TemplatePreview.tsx` führt denselben Knopf und denselben Dialog. Der Ausgang wirkt dort mit, ohne eigene Fassung |
| **Outlook-Add-in mit vorhandenem Call** | unberührt. Fremde Hoheit; Abschnitt 11 bleibt unverändert |

---

## 5. Definition of Done, gegengeprüft

- **Start, Aktion, Feedback, Erfolg, Fehlerpfad** — Tabelle in 12.2, je Zeile mit Fehlerpfad.
- **Keine Sackgassen, keine stillen Zustandswechsel** — die stille Stelle war der Ausgang; sie ist
  geschlossen. Eine **zweite** stille Stelle ist neu gefunden (der Fokus, 1.6) und mit Anforderung
  und Meßauftrag versehen.
- **Begriffe nach Spezifikation** — „Tagesgruppe", „Leistung", „Frist", „exportierbar"; „gesperrt"
  ausdrücklich vermieden, weil es in SP-17 etwas anderes meint.
- **Übergabe eindeutig** — zehn Akzeptanzkriterien in 12.8, dazu die eine Entscheidung, die
  ausdrücklich ui-designer gehört (Bauart des Rückkehrziels).

---

## 6. Annahmen

1. **Der Fokusbefund (1.6) ist aus der Bauart geschlossen, nicht gemessen.** Zwei verschiedene
   Bausteine an derselben Stelle werden bei einem Wechsel ersetzt, nicht umbeschriftet; daß
   `FormDialog` den Fokus auf den dann fehlenden Knoten zurückgibt, folgt daraus und ist nicht am
   laufenden Fenster geprüft.
2. **Daß die Sperrmeldung nach dem Speichern nicht erneut angesagt wird**, ist aus der Bauart
   geschlossen (unveränderte Zeichenkette in bestehender Live-Region) und deckt sich mit T-200; mit
   Vorlesehilfe gemessen ist es nicht.
3. **Daß `<output key={quarters}>` den Erfolg ansagen könnte**, ist eine Vermutung aus der Rolle
   `status` und dem erzwungenen Neuaufbau. Deshalb trägt der Toast die Auskunft und nicht die
   Fläche.
4. **Die vier Vorkommen von „Leistung nachtragen" und die fünf Aufrufstellen von
   `BookingFormDialog`** sind heute gemessen (ripgrep, Arbeitsbaum). Bei der Auftragserteilung neu
   zu messen (E-087 Punkt 1).
5. **Ich habe die Migrationsgeschichte hinter SP-22 nicht nachgemessen** — die Beweisführung, daß
   die Bedingung der Karte nie zutraf, ist Stand aus T-201/T-200. Trüge sie nicht, änderte das am
   Sperreintrag nichts: Der Absatz bliebe Alleinträger, nur sein Konjunktiv wäre zu berichtigen.

## 7. Risiken

- **Der L3-Zweig ist der, den jemand wegoptimieren wird.** Er sieht aus wie ein seltener Sonderfall
  und ist die Stelle, an der derselbe Fehler eine Ebene tiefer entsteht: `dayGroup.ts` liefert im
  Fehlerfall `blockedReason: null`. Wer nur `blockedReason !== null` fragt, hält eine nicht
  beantwortete Frage für ein „alles gut". Der Grund gehört in den Quelltext neben die Prüfung,
  nicht nur in dieses Papier.
- **Zwei Fassungen eines Satzes.** Wird der Rumpf von L2 in `BookingDialogs.tsx` getippt statt aus
  `lib/labels.ts` geholt, stehen zwei Abschriften da, und die nächste Pflege trifft eine davon.
  Das ist die Klasse, die in diesen Wellen mehrfach danebengegangen ist.
- **Halbe Umsetzung.** Wer L2 baut und L1 unverändert läßt, ist fertig; wer L2 baut und L4
  vergißt, macht aus einer gescheiterten **Auskunft** eine gescheiterte **Speicherung**. Kriterium
  5 in 12.8 ist deshalb keine Feinheit.
- **SP-22 ohne den Fall der Karte.** Der Eintrag steht jetzt, die Karte fällt später. Fiele sie
  **nicht**, sperrte SP-22 einen Absatz, dessen Aussage doppelt steht — kein Schaden, aber der
  Eintrag wäre dann fällig zurückzunehmen. Er nennt seinen Anlaß, damit das auffällt.

## 8. Offene Fragen

1. **An spec-ux-reviewer (O-HX):** Abschnitt 12 ist die Fassung zu Z-49, verfaßt und nicht
   genehmigt. Trägt „noch nicht abrechenbar" gegen A-8.6 und A-13.5, und ist die Bindung an die
   **Gruppe** statt an den **Wert** in Ihrem Sinne? Sie ist Ihre eigene Begründung aus Z-48, eine
   Ebene weiter geführt — ich lege sie deshalb ausdrücklich zur Bestätigung vor und nicht zur
   Kenntnisnahme.
2. **An ui-designer (1.6):** Ein Baustein mit zwei Beschriftungen, oder zwei Bausteine mit einem
   stabilen Rückkehrziel? Die Anforderung steht fest, die Bauart ist Ihre Entscheidung (Dichte der
   Buchungszeile, E-078 Punkt 4).
3. **An e2e-tester (1.6):** Ein Prüffall über `document.activeElement` nach dem Nachtragen. Er
   mißt eine Klasse, nicht einen Fall — überall dort, wo ein Bedienelement durch die eigene
   Handlung des Benutzers verschwindet.
4. **An den Orchestrator (1.7):** Die drei Nachbarbefunde (vierter Knopf mit anderem Ziel,
   Anlegen-Zweig, Löschweg) gehören zusammen entschieden. Sie sind keine Vorbedingung für Z-49 —
   aber (c) trägt denselben Satz und wird beim Bauen von O-HX unweigerlich gelesen.
5. **An documenter (O-IA):** SP-22 ist ein Eintrag über Ihre Datei. Nach 5.2 Pflichtangabe 1 geht
   eine neue Fassung des Absatzes an spec-ux-reviewer **und** an Sie; Sie sollten wissen, daß der
   Eintrag existiert, sonst wirkt er beim nächsten Handbuchdurchgang wie eine fremde Hand.

## 9. Nächster Schritt

**In dieser Reihenfolge, und der erste Schritt ist eine Vorlage, kein Bau:**

1. Abschnitt 12 geht an **spec-ux-reviewer** (E-078 Punkt 3). Ohne seine Zustimmung wird kein
   Zeichen geändert.
2. Danach **ein** Auftrag an frontend-dev: die Zustandsmaschine im Änderungszweig von
   `BookingFormDialog`, der Textbaustein nach `lib/labels.ts`, die zehn Kriterien aus 12.8 — mit
   der Messung des heutigen Wortlauts **im Auftrag**, nicht aus diesem Papier (E-087 Punkt 1).
3. **Getrennt und gleichzeitig möglich:** der Fall der Karte aus UM-08 samt SP-22 im selben
   Auftrag (E-081 Punkt 4), und der Meßauftrag zum Fokus an e2e-tester.
