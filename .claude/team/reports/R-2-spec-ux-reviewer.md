Aufgabe: R-2 — Spezifikations- und UX-Review des Branches `status-als-regelterm` (E-055 bis E-057)

Status: **nicht freigegeben** — Nacharbeit. Blockierend: A-2.5 / I-05 (vier Flächen), E-056
(Reichweite), Abschnitt 15 (Zustandsabdeckung im Regelformular).

Artefakte: diese Datei. Sonst nichts angefaßt.

---

## Zusammenfassung

Das Regelmodell aus E-055 ist sauber gebaut und an der Oberfläche gut erklärt: fünf Achsen mit je
einem Neutralwert, die Verknüpfung folgt aus dem Feldnamen statt aus einem Und/Oder-Schalter, die
Zusammenfassung unterscheidet einschränkende von neutralen Achsen, und der Leerzustand einer
Spalte zerfällt in drei unterscheidbare, wahrheitsgemäße Fälle mit je eigener Handlung. E-057 ist
in Dienst, Oberfläche und Add-in durchgezogen und gemessen; das ist die beste Arbeit in diesem
Branch.

Der Branch hat aber eine Klammer nicht mitgezogen. Bis E-054 hing die Kanban-Spalte allein an den
Tags, und **darauf beruht der gesamte Erklärtext von I-05**: „Die Karte bleibt, wo sie ist — die
Spalte ändert sich dadurch nicht." Seit E-055 entscheidet eine Spalte auch über das
Erledigt-Kennzeichen und über den Exportstatus, und beides ändert ein Timerstart. Der Satz steht
zeichengleich an vier Flächen, ist in genau der Lage falsch, für die E-056 geschrieben wurde, und
das Add-in stellt ihn in **derselben** Hinweisfläche neben den Satz, der das Gegenteil sagt.
Danebengestellt: E-056 greift für Pools, aber nicht für reine Board-Spalten — also nicht für den
Fall, den die Entscheidung wörtlich als den entscheidenden benennt.

Dazu kommen zwei kleinere, aber harte Sachen: Das Regelformular hat für Ordner und Status weder
Lade- noch Fehlerzustand und behauptet stattdessen „Es gibt noch keinen Ordner" — direkt neben
einem `TagInput`, das genau diese drei Zustände vorbildlich trennt. Und der Hilfssatz jeder
Optionszeile hängt im `<label>` und wird dadurch Teil des Namens **und** der Beschreibung: eine
Vorlesehilfe liest ihn zweimal.

Gemessen habe ich nichts nachgebaut — die Prüfläufe der Agenten (`proof:addin` 123, `contrast` 0
von 424, `test:e2e` 34/34) nehme ich als gegeben. Was hier steht, ist gelesen: Quelltext der
genannten Flächen, `docs/spec.md`, E-054 bis E-057 einschließlich des Korrekturabsatzes,
`docs/architektur.md`, `docs/datenmodell.md`, `docs/benutzerhandbuch.md` und die vier Berichte.

---

## 1. Deckung je Anforderungs-ID

### 1.1 Gedeckt

| ID | Wo | Anmerkung |
|---|---|---|
| A-3.1, A-3.3, A-3.4 | S-11 `PoolFormDialog`, `RuleSummary` | A-3.4 ist an drei Flächen ausgesprochen: Warnband, Zusammenfassung, Leerzustand. Der Korrekturabsatz aus E-055 („die leere Regel trifft nichts") ist eingehalten — `poolRuleIsEmpty` entscheidet, nicht die Oberfläche |
| A-5.1, A-5.3, A-5.5, A-5.6 | S-04 `BoardScreen` | A-5.3 ist Beispiel, nicht Vorgabe; der Leerzustand nach der Umstellung erklärt das ausführlich und führt zur Einrichtung |
| A-5.4 | S-09 „Status" | `BoardSetupDialog` nennt den neuen Ort ausdrücklich (`BoardScreen.tsx:934-952`) — vorbildlich, weil „Statusspalten" bis E-054 genau hier verwaltet wurden |
| A-6.7 | `RuleSummary.tsx:183-185` | Die Exportachse borgt sich `ExportStatusBadge` statt eines eigenen Aussehens. Genau richtig |
| A-4.6 | unverändert | Von diesem Branch nicht berührt |
| I-13 | S-11 | Deckt seit E-054 zugleich das Einrichten einer Spalte — Pool und Spalte sind dieselbe Entität, ein Formular |
| E-057 | Domäne, Dienst, Add-in, vier Flächen der Oberfläche | Termweise statt achsenweise, an jeder Fläche, mit Namen. Der Ordner im Satz kann kein anderer sein als der markierte Chip darüber (`poolRule.ts:462-488`) |

### 1.2 Berührt, aber nicht gedeckt

```
A-3.2  S-11 Regelformular  Abweichung: „Ein Pool kann über ein bestimmtes Tag definiert
       werden" kennt weder Ausschluß noch Status, Erledigt oder Exportstatus. Vier der fünf
       Achsen aus E-055 haben in docs/spec.md keine ID. (Vom domain-dev in T-076, offene
       Frage 6, ausdrücklich an diese Prüfung gegeben.)
       Vorschlag: Nachtrag A-3.5 in Abschnitt 3, Wortlaut aus der Tabelle in E-055, mit dem
       Satz aus dem Korrekturabsatz: „Stehen alle Achsen neutral, trifft die Regel nichts."

A-4.4  S-11 Regelformular, Ordnerauswahl  Abweichung: `FolderPicker` zeigt **alle** Ordner
       als flache Chipwolke mit vollem Pfad, ohne Suche, ohne Hierarchie, ohne Begrenzung
       (PoolFormDialog.tsx:206-224). A-4.3 verlangt beliebige Tiefe, A-4.4 verlangt, daß
       Navigation und Verwaltung trotzdem übersichtlich bleiben. E-022 hat die Größenordnung
       gemessen, gegen die das gebaut sein muß: Tiefe 4 bis 10, bis 19 530 Ordner. Bei
       dreißig Ordnern ist die Wolke schon länger als der Dialog.
       Vorschlag: dieselbe Bauform wie `TagInput` — Kombobox mit Suche über den Pfad, Chips
       für das Gewählte. Ark UI ist seit E-052 dafür da und im Baum. Eigene Aufgabe,
       frontend-dev.

A-5.2  S-04 Kanban  Abweichung: aufgehoben durch E-054, aber die Spezifikation führt A-5.2
       unverändert als Vorgabe (docs/spec.md:84). Siehe Abschnitt 2.

A-13.6 alle Ansichten  Abweichung: „Drag & Drop unterstützt" steht unverändert in
       docs/spec.md:257. E-054 hebt A-5.2 und I-14 ausdrücklich auf, A-13.6 **nicht** —
       docs/datenmodell.md:388 behandelt sie trotzdem als aufgehoben. Zwei Dokumente, zwei
       Lesarten. Sachlich ist A-13.6 weiterhin erfüllt (Tag-Baum in S-08, Feldzeilen in
       S-14); nur sagt das niemand.
       Vorschlag: E-054 um einen Absatz ergänzen — A-13.6 bleibt und meint ab jetzt
       ausdrücklich S-08 und S-14, nicht das Board. Orchestrator, eine Zeile.

I-14   S-04 Kanban  Abweichung: aufgehoben durch E-054, in docs/spec.md:306 unverändert.
```

### 1.3 Umsetzung ohne Anforderungs-ID

`CLAUDE.md` verbietet Umsetzung ohne Deckung durch eine ID aus `docs/spec.md`. Vier Dinge in
diesem Branch haben nur eine Entscheidungs-ID. Das ist zulässig — `docs/spec.md` nennt
`decisions.md` selbst als den Weg für Änderungen —, aber es fehlt der Rückweg: Die nächste
Prüfung findet die Anforderung nicht mehr, wenn sie in der Spezifikation nachschlägt.

| Umgesetzt | Heute gedeckt durch | Nachzutragen |
|---|---|---|
| Statusachse, Erledigt-Achse, Exportstatus-Achse einer Regel | E-055 | **A-3.5** |
| `placement` — dieselbe Regel als Pool, als Spalte oder beides | E-054 | **A-3.6** |
| Spalte = Regel, kein Ziehen, Karte in mehreren Spalten | E-054 | **A-5.7**, dazu Streichung von A-5.2 und I-14 mit Verweis |
| Ein Ordnerterm ohne Tag ist eine Einschränkung ohne Treffer | E-057 | Absatz an A-3.4 |

Kein Nachtrag nötig für I-13: „Todo-Pools konfigurieren" deckt das Einrichten einer Spalte mit,
seit beides dieselbe Entität ist. Das gehört aber in denselben Nachtrag geschrieben, sonst sucht
jemand eine eigene Interaktions-ID.

---

## 2. Wo die Spezifikation noch vom Ziehen spricht

Vollständig, gegen `docs/`:

| Stelle | Wortlaut | Bewertung |
|---|---|---|
| `docs/spec.md:84` (A-5.2) | „Todos lassen sich per Drag & Drop zwischen Status-Spalten verschieben." | Aufgehoben durch E-054, in der Spezifikation nicht vermerkt |
| `docs/spec.md:306` (I-14) | „Todos per Drag & Drop verschieben" | ebenso |
| `docs/spec.md:257` (A-13.6) | „Drag & Drop unterstützt." | Von E-054 **nicht** genannt, siehe 1.2 |
| `docs/benutzerhandbuch.md:121-128` | „Das Kanban-Board zeigt Todos in frei definierbaren Spalten, zwischen denen sie sich per Drag & Drop verschieben lassen. Die Spalten selbst … sind in den Einstellungen konfigurierbar" | **Blockierend**, siehe D-1 |
| `docs/benutzerhandbuch.md:162-172` | „Die Kanban-Spalte ändert sich dabei nicht. Ein Todo, das in „Done" lag, bleibt … in „Done" liegen" | **Blockierend**, siehe D-2 |
| `docs/architektur.md:304-306` | „Die Karte steht danach in denselben Spalten wie zuvor, ohne daß etwas geschrieben worden wäre." | Nach E-055 falsch, siehe D-3 |
| `docs/testplan.md`, `docs/datenmodell.md` | jeweils als aufgehoben geführt | in Ordnung |

`docs/testplan.md:1528` und `:1532` nennen Ziehen nur noch als Abwesenheit beziehungsweise für den
Tag-Baum. Richtig.

---

## 3. Blockierende Befunde

```
B-1  A-2.5, I-05, E-055  S-03/S-04/S-05/S-02 und S-12
     lib/labels.ts:153 · components/Timer.tsx:213 · app/TimerContext.tsx:276 ·
     outlook-addin/src/duplicate/reopen.ts:101, 324, 339
     Abweichung: „Die Karte bleibt, wo sie ist — die Spalte ändert sich dadurch nicht" ist
     seit E-055 falsch, sobald eine Spalte eine Erledigt- oder eine Exportstatus-Achse
     führt. Der Timerstart ändert beide.
```

Nutzerbild. Jemand richtet die Spalte ein, für die E-055 den Exportstatus überhaupt aufgenommen
hat und die E-056 wörtlich als den entscheidenden Fall benennt: `completion: 'done'` mit
`exportState: 'open'`, Name „Erledigt, noch nicht abgerechnet", Anzeigeort „Pool und Board". Er
benutzt sie als Abrechnungsliste. Auf einer Karte darin startet er den Timer. Die Karte
verschwindet vor seinen Augen aus der Spalte — richtig, denn die Regel trifft nicht mehr — und
Takt sagt ihm dazu: *die Spalte ändert sich dadurch nicht*.

Der Satz steht dabei sogar zeichengleich an vier Flächen; die Zeichengleichheit wird von
`proof:addin` geprüft. Das ist die richtige Vorsichtsmaßnahme gegen zwei Fassungen — sie hat hier
nur dafür gesorgt, daß **eine** Aussage an vier Stellen zugleich falsch wurde. Der Befund ist seit
T-072 (offene Frage 4) und T-073 (offene Frage 5) gemeldet und über drei Wellen nicht behoben
worden. Mit E-055 ist er von „nicht ganz richtig" zu „im Regelfall falsch" geworden.

Schärfste Ausprägung, weil beides in **einer** Hinweisfläche steht: `reopenPreview`
(`reopen.ts:317-325`) setzt `effects[2] = poolSentence(movement, 'future')` — das kann lauten „Es
verschwindet dann aus dem Pool „Erledigt, noch nicht abgerechnet“ und erscheint in keinem
anderen." — und unmittelbar darunter `aside: CARD_STAYS`. `ReopenAnnouncement`
(`TaskPane.tsx:738-755`) zeichnet beides in denselben Callout. Ein Absatz, der sich selbst
widerspricht. `proof-addin.mjs:2330` hält den Widerspruch fest, statt ihn zu finden.

Vorschlag. `CARD_STAYS` nicht reparieren, sondern auflösen. Die Aussage war eine Antwort auf E-023
(Erledigt ≠ Statusspalte); diese Frage stellt seit E-054 niemand mehr, weil es keine Statusspalte
gibt. Was heute gesagt werden muß, sagt der Dienst bereits: `enters` und `leaves`. Konkret:

1. Den Halbsatz zur Spalte streichen. Was bleibt, ist die wahre Nicht-Wirkung, und die betrifft
   nicht mehr die Spalte, sondern die Tags: **„Die Tags und der Status des Todos ändern sich
   dadurch nicht."** Das ist an jeder Konstellation richtig, weil ein Timerstart nur
   `completed_at` anfaßt.
2. Die Bewegung selbst kommt aus `poolSentence`/`bookingPoolSentence` — sie steht schon da und
   sagt die Wahrheit.
3. Zeichengleichheit bleibt: eine Konstante, `apps/web/src/lib/labels.ts` und
   `apps/outlook-addin/src/duplicate/reopen.ts`, `proof:addin` prüft weiter.

Zwei Hoheiten (frontend-dev, integration-dev), deshalb eine gemeinsame Auflage des Orchestrators
und keine zwei Aufgaben in einer Welle.

```
B-2  A-2.5, I-05, E-056  S-03/S-04/S-05/S-02 gegen S-12
     app/TimerContext.tsx:281-295 gegen outlook-addin/src/duplicate/reopen.ts:163-191
     Abweichung: Dieselbe Handlung, zwei verschiedene Auskünfte. Das Add-in nennt seit E-056
     auch, woraus ein Todo verschwindet. Die Hauptanwendung nennt beim Timerstart
     ausschließlich, wo es erscheint — sie fragt `poolsContaining` **nach** der Aufhebung
     und kann das Verlassene deshalb nicht kennen.
```

Nutzerbild. Derselbe Vorgang, einmal aus Outlook („Es verschwindet dann aus dem Pool …"), einmal
aus Takt („Es ist zurück in … Die Karte bleibt, wo sie ist"). Wer beide Wege benutzt, zieht daraus
den Schluß, daß sie verschieden wirken. Genau das war Befund C-03 aus T-025, und der Kopf von
`reopen.ts:26-36` führt die Lehre daraus ausdrücklich mit: „vorher" und „nachher" müssen dieselbe
Auskunft geben. E-056 hat die Auskunft im Add-in vervollständigt und die Hauptanwendung
zurückgelassen. T-084 meldet das selbst als offene Frage 2 und hat die fremde Datei zu Recht nicht
angefaßt.

Vorschlag. `poolsContaining` beantwortet die falsche Frage — es liefert einen Zustand, gebraucht
wird eine Bewegung. Der Dienst rechnet die Bewegung für das Add-in bereits (`poolNamer`,
`service.ts:300-388`). Zwei Wege:

- **klein:** `POST /timer/start` gibt bei `doneCleared` dieselben drei Listen zurück, die
  `AddinPoolMovement` trägt; die Oberfläche baut den Satz aus derselben Funktion wie das Add-in.
  Kostet eine Route-Erweiterung (domain-dev) und ersetzt zwölf HTTP-Aufrufe durch keinen.
- **sofort:** `poolsContaining` einmal **vor** dem Start rufen und die Differenz bilden. Rate ich
  ab — das ist ein Vergleich über Namen, und zwei Regeln dürfen denselben Namen tragen. Genau
  diese Falle begründet in `reopen.ts:64-68`, warum `enters` nicht gediffft wird.

```
B-3  A-2.5, E-055  S-03/S-04/S-05/S-02
     app/TimerContext.tsx:285 · components/Timer.tsx:211
     Abweichung: „Auf seine Tags paßt derzeit keine Poolregel, es erscheint also in keinem
     Pool." Die Begründung ist seit E-055 falsch: Über die Zugehörigkeit entscheiden fünf
     Achsen, und in genau dem Fall, in dem dieser Satz nach einem Timerstart erscheint, war
     es meistens **nicht** die Tagachse, sondern die Erledigt-Achse.
     Vorschlag: „Derzeit paßt keine Regel auf dieses Todo — es erscheint in keinem Pool."
     Ohne Ursachenbehauptung. Wer die Ursache wissen will, findet sie im Regelformular; dort
     steht sie seit T-087 sogar mit Ordnernamen.

B-3b app/StructureContext.tsx:211
     Abweichung: `pools.slice(0, 12)` schneidet die Aufzählung stumm ab. Seit E-054 ist jede
     Board-Spalte mit Anzeigeort „beide" zugleich ein Pool; zwölf sind schnell erreicht. Der
     Satz „Es ist zurück in den Pools A, B und C" behauptet Vollständigkeit, die er nicht
     hat.  Vorschlag: entweder mit B-2 zusammen erledigen (dann fällt die Schleife weg) oder
     bis dahin die Grenze aussprechen („… und weiteren").
```

```
B-4  E-056  S-12 Aufgabenbereich
     apps/local-api/src/routes/addin/service.ts:303, gegen packages/storage/src/ports.ts:328-335
     Abweichung: `poolNamer` ruft `unit.pools.list()` ohne Argument. Der Port setzt ohne
     Argument `'pool'` ein, liefert also nur `placement` `pool` oder `both`. Eine Regel mit
     Anzeigeort **„Nur auf dem Board"** wird im Aufgabenbereich nie genannt — weder beim
     Erscheinen noch beim Verschwinden.
```

Nutzerbild. E-056 begründet sich wörtlich mit diesem Fall: „Entscheidend ist der Fall, für den man
so eine **Spalte** überhaupt anlegt: erledigt und noch nicht abgerechnet. Wer dort arbeitet,
benutzt die **Spalte** als Abrechnungsliste. Bucht er per Add-in auf eine Karte, verschwindet sie
aus genau der Liste, in der er sie sucht." Wer diese Spalte als reine Board-Spalte einrichtet —
die naheliegende Wahl, denn sie ist eine Board-Spalte —, bekommt kein Wort. Wer sie versehentlich
als „Pool und Board" einrichtet, bekommt die Auskunft. Dieselbe Regel, dieselbe Wirkung, zwei
Verhalten, unterschieden durch eine Einstellung, die mit der Frage nichts zu tun hat.

Die Vorgabe `'pool'` am Port ist gut begründet (`ports.ts:328-333`: die Aufrufer vor E-054 meinten
„die Pools") — nur ist `poolNamer` seit E-056 nicht mehr einer von ihnen. Er beantwortet nicht
mehr „in welchen Pools steht das Todo", sondern „was ändert diese Buchung".

Vorschlag. `unit.pools.list('all')` und die Wortwahl des Satzes an den Anzeigeort binden.
`inPools` (`reopen.ts:129-130`) setzt heute unbedingt „dem Pool"/„den Pools"; `POOL_PLACEMENT_SHORT`
führt bereits die drei Wörter. Da der Satz ohnehin nur Namen bekommt, ist der billigste ehrliche
Weg, das Wort neutral zu machen: **„Es erscheint dann in „Erledigt, noch nicht abgerechnet“."** —
ohne Gattungswort. Das ist zugleich die Antwort auf S-7 unten. Hoheit integration-dev; die
Portsignatur bleibt unberührt.

```
B-5  Abschnitt 15  S-11 Regelformular
     screens/PoolFormDialog.tsx:319-322, 206-208, 260-262
     Abweichung: Kein Lade- und kein Fehlerzustand für Ordner und Status. `ready` ist `null`,
     solange `StructureContext` lädt **und** wenn es fehlgeschlagen ist; `folders` und
     `statuses` sind dann leer, und das Formular schreibt hin: „Es gibt noch keinen Ordner."
     und „Es gibt noch keinen Statuswert." Beides sind Behauptungen über den Bestand, und
     beide sind in diesem Moment unbelegt.
```

Nutzerbild. Der Dienst ist gerade weg. Jemand öffnet „Spalten verwalten → Neue Spalte" (die
Schaltfläche steht im Kopf und außerhalb jeder `AsyncBoundary`, `BoardScreen.tsx:233-236`) und
liest, er habe keine Ordner und keine Status. Er hat beides. Er legt eine Regel ohne beides an.

Das ist besonders deutlich, weil im **selben Dialog** ein `TagInput` steht, das es richtig macht,
und der Kopf dieser Komponente den Maßstab ausspricht (`TagInput.tsx:442-454`): „Die drei Zustände
dieser Quelle bekommen hier jeweils eine Antwort und nicht bloß der eine gute … eine Fehlermeldung
ohne Wiederholungsknopf ist eine Sackgasse." Drei Felder in einem Dialog, dieselbe Quelle, ein
Feld hält den Maßstab, zwei nicht.

Vorschlag. `FolderPicker` und `StatusPicker` bekommen `state` statt einer fertigen Liste, mit
denselben drei Ausgängen wie `TagInput`: lädt (Feld steht, gesperrt, sagt worauf es wartet),
Fehler (`InlineMessage` mit `structure.reload`), bereit. Der heutige Satz „Es gibt noch keinen
Ordner." bleibt und stimmt dann.

---

## 4. Sollte

```
S-1  A-6.5, A-6.9, E-047, E-050  S-11 Regelformular, Achse Exportstatus
     lib/labels.ts:206-221 · screens/PoolFormDialog.tsx:645-651
     Abweichung: „Exportiert — Todos mit mindestens einer exportierten Buchung." Eine nach
     E-047 ausgebuchte Buchung trägt den Statuswert `exported` (E-032, zweiwertig) und
     erfüllt die Achse deshalb mit; exportiert wurde sie nie. Genau diesen Wortgebrauch hat
     E-047 abgeschafft („Es gibt keinen Vorgang „von Hand als exportiert markieren"") und
     E-050 mit einem eigenen Anzeigezustand „Nicht abgerechnet" abgesichert. Die Regelachse
     zieht als einzige Fläche nicht nach.
     Nutzerbild: Eine Spalte „schon abgerechnet" enthält Todos, deren Zeit ausdrücklich
     **nicht** abgerechnet wurde — die einzige Auswertung, für die E-047 überhaupt
     eingeführt wurde.
     Vorschlag: Hilfssatz um einen Satz ergänzen: „Ausgebuchte Buchungen („nicht
     abgerechnet", E-047) zählen mit — sie tragen denselben Exportstatus." Eine vierte
     Option wäre falsch: E-032 verbietet einen dritten Wert.

S-2  E-055  elf Oberflächenstellen
     screens/BoardScreen.tsx:224, 741, 843 · components/Kanban.tsx:16 ·
     screens/StatusSettings.tsx:262-263 · screens/TodoFormDialog.tsx:209 ·
     app/Navigation.tsx:38 · screens/TagsScreen.tsx:478, 491 ·
     showcase/BoardSection.tsx:222, 226, 437 · showcase/InventorySection.tsx:307
     Abweichung: „Eine Spalte ist eine Regel über Tags" / „Welche Karte wo steht,
     entscheiden die Tags des Todos". Seit E-055 entscheiden fünf Achsen; drei davon ändern
     sich ohne jede Tagänderung. Der Satz war die richtige Erklärung für E-054 und ist mit
     E-055 zur halben geworden.
     Nutzerbild: Ein Benutzer, der das gelesen hat, sucht nach dem Timerstart die
     verschwundene Karte bei den Tags. Dort ist sie nicht.
     Vorschlag: eine Fassung, an allen elf Stellen: „Eine Spalte ist eine Regel — über Tags,
     Status, „Erledigt" und den Exportstatus." Kürzer, wo der Platz fehlt: „Eine Spalte ist
     eine Regel, kein Ablageort."

S-3  E-055  S-04 Kanban, Toast nach „Erledigt"
     screens/BoardScreen.tsx:138-142
     Abweichung: Beim Zurücknehmen steht „Die Regeln ihrer Spalten treffen unverändert zu —
     sie erscheint wieder auf dem Board.", beim Setzen „Sie bleibt in ihren Spalten stehen"
     bzw. „Ihre Tags ändern sich dadurch nicht." Alle drei setzen voraus, daß keine Spalte
     eine Erledigt-Achse führt. Führt eine, wechselt die Karte die Spalte, und der Toast
     behauptet das Gegenteil.
     Vorschlag: dieselbe Quelle wie B-2. Bis die steht: den behauptenden Halbsatz streichen
     und beim Faktum bleiben („„X“ ist erledigt.").

S-4  E-054  S-12 Add-in, Fehlermeldung
     outlook-addin/src/ui/TaskPane.tsx:633
     Abweichung: `FIELD_LABEL` bildet `statusId` auf **„Spalte"** ab. Seit E-054 ist der
     Status keine Spalte; „Spalte" heißt jetzt etwas anderes. Weist der Dienst einen
     Statuswert ab, liest der Benutzer „Spalte: …" und sucht auf dem Board.
     Vorschlag: `statusId: 'Status'`.

S-5  Abschnitt 15  S-08 gegen S-04, „Vom Board nehmen"
     screens/TagsScreen.tsx:548-555 gegen screens/BoardScreen.tsx:359-376
     Abweichung: Dieselbe Handlung, zwei Schutzniveaus. Auf dem Board mit
     Bestätigungsdialog samt Folgensatz, in der Regelliste als Sofortaktion mit Toast, ohne
     Rückweg. Zwei Schutzniveaus für dieselbe Handlung lehren, daß eines davon
     bedeutungslos ist.
     Vorschlag: Auf S-08 denselben `ConfirmDialog`. Alternativ auf beiden Flächen ohne
     Dialog, dafür mit „Rückgängig" im Toast — die Handlung ist ohnehin umkehrbar (ein
     `PATCH`). Ich rate zur zweiten Fassung: der Dialog auf dem Board erklärt vor allem,
     daß nichts verlorengeht, und das sagt ein Toast mit Rückweg überzeugender.

S-6  Barrierefreiheit, SC 4.1.2  S-11 Regelformular
     components/RadioRow.tsx:106-116
     Abweichung: Der Hilfssatz steht als `visually-hidden`-Span **innerhalb** des `<label>`.
     Damit fließt er in den zugänglichen Namen des Optionsknopfes ein — und wird über
     `aria-describedby` zusätzlich als Beschreibung ausgegeben. Eine Vorlesehilfe liest ihn
     zweimal, und der Name der Option „Alle" lautet 28 Wörter lang. Genau das wollte die
     Komponente vermeiden: der **sichtbare** Satz darunter trägt `aria-hidden`, damit er
     nicht zweimal kommt (RadioRow.tsx:121-130).
     Vorschlag: Die versteckten Spans aus dem `<label>` heraus und als Geschwister in
     `.radio-row` rendern; die Kennungen und `aria-describedby` bleiben, wie sie sind. Vier
     Zeilen.

S-7  Barrierefreiheit, SC 1.3.1  S-11 Regelformular
     screens/PoolFormDialog.tsx:203-208 und 511-518 gegen 551-558 und 560-566
     Abweichung: Vier Bedienelemente, zwei Namen. Zweimal ein Feld namens „Tags", zweimal
     eine Ordnerauswahl namens „Ordner" — im selben Dialog, unterschieden allein durch die
     Abschnittsüberschrift darüber. `FolderPicker` hat anders als `StatusPicker`
     (PoolFormDialog.tsx:254-259) weder `role="group"` noch `aria-labelledby`; wer sich mit
     dem Tabulator durch die Chips bewegt, hört nur die Ordnerpfade und erfährt nie, ob er
     gerade erfordert oder ausschließt.
     Nutzerbild: Ein ausgeschlossener Ordner statt eines erforderlichen kehrt die Regel um.
     Vorschlag: `FolderPicker` bekommt `role="group"` mit `aria-labelledby` wie
     `StatusPicker`, und die vier Beschriftungen werden eindeutig: „Erforderliche Tags" /
     „Erforderliche Ordner" / „Ausgeschlossene Tags" / „Ausgeschlossene Ordner". Die
     Abschnittsüberschrift bleibt, sie ist die Gliederung für Sehende.

S-8  Barrierefreiheit  S-11 Regelformular, Vorschau
     screens/PoolFormDialog.tsx:656-664
     Abweichung: „Diese Regel trifft" ändert sich bei jeder Wahl und ist keine Live-Region.
     Für eine Vorlesehilfe ist die Vorschau damit unsichtbar — sie ist aber die einzige
     Fläche, an der die fünf Achsen zu **einer** Aussage zusammenkommen.
     Vorschlag: Den Kasten in eine Region mit `role="status" aria-live="polite"` setzen und
     ausschließlich den Ergebnissatz vorlesen lassen, nicht die Chips. Vorbild:
     BoardScreen.tsx:240-242, dort ist die Bauform bereits da.

S-9  Abschnitt 15  S-11, Rückmeldung nach dem Speichern
     screens/PoolFormDialog.tsx:467-479
     Abweichung: Der Toast unterscheidet nur „0 Bedingungen" von „n Bedingungen". Eine Regel
     mit zwei Bedingungen, von denen eine auf einen leeren Ordner zeigt, trifft nichts — und
     wird mit „„X“ — 2 Bedingungen, Anzeigeort: …" als Erfolg gemeldet. Die Antwort von
     `POST`/`PATCH` trägt seit T-082 `resolved` samt `emptyRuleFolderIds`; die Auskunft liegt
     also vor und wird weggeworfen.
     Nutzerbild: Der Dialog schließt zufrieden, die Spalte bleibt für immer leer, und der
     Grund steht nur noch dort, wohin der Benutzer gerade nicht mehr schaut.
     (Von T-083 offene Frage 2 und T-087 offene Frage 4 als Produktfrage gestellt. Aus
     UX-Sicht ist es keine: Eine Warnung, die im Formular steht und beim Speichern
     verschwindet, liest sich wie eine behobene Warnung.)
     Vorschlag: Toast aus `saved.resolved` färben — `tone: "warning"` und der Satz aus
     `emptyFolderNames`. Die Funktion ist genau dafür gebaut (poolRule.ts:503-513).

S-10 E-055  Musterseite
     showcase/BoardSection.tsx:436-457
     Abweichung: Die Tabelle „Drei Dinge, die nichts voneinander wissen" führt für „Spalte"
     als Änderer „Die Tags des Todos — oder die Regel selbst" und darunter den Satz
     „Erledigt entscheidet über die *Sichtbarkeit*, nicht über die Zugehörigkeit". Seit
     E-055 tut es beides, je nach Achse — `lib/labels.ts:190-197` sagt das ausdrücklich und
     ist die Gegenrede zu genau diesem Satz.
     Nutzerbild: Die Musterseite ist die abgenommene visuelle Referenz (E-013, E-024). Was
     dort steht, gilt.
     Vorschlag: Zeile „Spalte" auf „Die fünf Achsen der Regel — Tags, Status, „Erledigt",
     Exportstatus" ändern und den Absatz darunter zweiteilen: Steht die Erledigt-Achse
     neutral, entscheidet das Kennzeichen die Sichtbarkeit; sagt sie etwas, entscheidet sie
     die Zugehörigkeit.
```

### Dokumentation

```
D-1  A-5.2, E-054  docs/benutzerhandbuch.md:121-128
     Abweichung: Der ganze Abschnitt „Mit dem Kanban-Board arbeiten" beschreibt das Board
     von vor E-054: Verschieben per Drag & Drop, Spalten in den Einstellungen
     konfigurierbar, „Backlog/In Progress/Waiting/Done". Nichts davon trifft zu.
     Vorschlag: neu schreiben — Spalte = Regel, kein Ziehen, Tags/Status/Erledigt/Export
     entscheiden, Board nach der Umstellung leer und warum. Der Text existiert bereits fast
     wörtlich in `BoardScreen.tsx:749-771`. documenter.

D-2  A-2.5, E-055  docs/benutzerhandbuch.md:162-172
     Abweichung: „Die Kanban-Spalte ändert sich dabei nicht. Ein Todo, das in „Done" lag,
     bleibt … in „Done" liegen" — zwei Fehler: „Done" als Spalte gibt es seit E-054 nicht,
     und die Spalte kann sich seit E-055 sehr wohl ändern. Derselbe Befund wie B-1, nur im
     Handbuch. Muß mit B-1 zusammen erledigt werden, sonst laufen sie erneut auseinander.

D-3  A-2.5, E-055  docs/architektur.md:304-314
     Abweichung: „Die Karte steht danach in denselben Spalten wie zuvor" und „es erscheint
     ohne weiteren Schritt wieder in seinen Pools, weil es sie nie verlassen hat." Nach
     E-055 gilt beides nur, solange keine Regel über Erledigt oder Exportstatus urteilt.
     Die Datei gehört nicht dem documenter — Zuweisung durch den Orchestrator.
```

---

## 5. Hinweise

```
H-1  E-055  S-04, Filterschalter
     screens/BoardScreen.tsx:227-232
     „Erledigte einblenden — Voreingestellt ausgeblendet". Seit E-055 gibt es eine Ausnahme:
     Sagt die Regel etwas über „Erledigt", tritt die Ansichtseinstellung zurück
     (docs/datenmodell.md:1004-1006). Im Regelformular steht das (PoolFormDialog.tsx:618);
     am Schalter, wo es auffällt, nicht. Vorschlag: Zusatz „Spalten, die ausdrücklich nach
     „Erledigt" fragen, zeigen ihre Karten trotzdem."

H-2  Kontrast  RadioRow, gewählte Option
     styles/app.css:1037-1049 gegen scripts/contrast-check.mjs
     Die neuen Flächen sind mit einer Ausnahme über bereits gemessene Farbpaare abgedeckt —
     `--text-primary`/`--text-muted` auf `--bg-hover` (Zeilen 154, 285), `--text-muted` auf
     `--accent-bg-subtle` (356), `--accent-text` auf `--accent-bg-subtle` (171),
     `--border-accent` auf `--bg-surface` (370), `--text-disabled` auf `--bg-disabled` (160).
     Ungemessen ist ein Paar: der Optionsknopf selbst (`accent-color: --accent-bg`) auf der
     Fläche der gewählten Option (`--accent-bg-subtle`). Das ist die Grenze eines
     Bedienelements nach SC 1.4.11 und in beiden Farbmodi verschieden.
     Vorschlag: eine Zeile, Gruppe „Regelformular", `min: 3`. Der Fall ist harmlos, aber
     „gemessen statt behauptet" ist in diesem Projekt der Maßstab.

H-3  Begriffsbindung  screens/PoolFormDialog.tsx:286
     Der Hilfssatz der **Status**achse holt sein Wort aus `POOL_COMPLETION_LABEL.any`, also
     aus der Erledigt-Achse. Heute steht in beiden „Alle" und der Text stimmt. Ändert jemand
     die Erledigt-Achse, ändert sich stillschweigend die Statusachse mit.
     Vorschlag: eigene Konstante, etwa `POOL_STATUS_LABEL.any`.

H-4  Board-Hygiene  .claude/team/board.md:120-136
     O-D, O-E, O-F und O-G sind je zweimal vergeben. Der Auftrag zu R-2 nennt „O-E", und es
     gibt zwei davon. Ich habe die Zeile 126 beantwortet (Ziehen für Status-Spalten).
```

---

## 6. Zustandsabdeckung je Fläche (Abschnitt 15)

Legende: ✓ vorhanden · ✗ fehlt · — nicht anwendbar

| Fläche | Empty | Loading | Hover | Aktiv | Fehler | Bestätigung |
|---|---|---|---|---|---|---|
| S-04 Board, ganze Seite | ✓ eigener Bildschirm mit Erklärung, `BoardScreen.tsx:735-809` | ✓ `AsyncBoundary rows={4}` | ✓ | ✓ Hervorhebung mit Ansage | ✓ `onRetry` | ✓ „Vom Board nehmen" |
| S-04 Spalte | ✓ **drei** unterscheidbare, siehe 6.1 | ✓ über die Seite | ✓ Spaltenmenü | ✓ | ✓ Toast | — |
| S-04 Karte | — | ✓ | ✓ | ✓ Timer, Erledigt, Mehrfachvorkommen | ✓ Toast | ✓ nur beim Erledigt-Wechsel als Toast |
| S-11 Regelformular | ✓ „Diese Spalte bleibt leer" | ✗ **B-5** | ✓ | ✓ Optionszeilen dreifach markiert | ✓ Formularfehler, ✗ Ladefehler der Quelle | ✓ über `FormDialog` |
| S-11 Spaltendialog | ✓ „Noch keine Spalte" | ✗ leere Liste ohne Ladezustand | ✓ | ✓ | ✗ | ✓ über den Aufrufer |
| S-08 Regelliste | ✓ „Noch keine Regel" | ✓ über die Seite | ✓ | ✓ Anzeigeort-Etikett | ✓ Toast | ✓ Löschen, ✗ „Vom Board nehmen" (**S-5**) |
| S-12 Aufgabenbereich | ✓ | ✓ Skeleton | ✓ | ✓ | ✓ mit Weg zu den Einstellungen | — (Buchen ist die Bestätigung) |
| Musterseite | ✓ vier Leerzustände nebeneinander | ✗ kein Lade-Beispiel für eine Spalte | ✓ | ✓ inkl. gesperrter Optionszeile | ✗ kein Fehlerbeispiel des Regelformulars | ✗ |

### 6.1 Die drei Leerzustände einer Spalte

Unterscheidbar: **ja**, und zwar richtig gebaut. `no-condition` / `empty-folder` / `reachable`
unterscheiden sich in Symbol (`alert-triangle` / `folder-open` / `inbox`), Überschrift, Erklärung
**und** angebotener Handlung — nie nur in der Farbe (SC 1.4.1). `BoardScreen.tsx:565-635`.

Wahrheitsgemäß: **ja**, seit T-087 auch im gemischten Fall. Die Reihenfolge in
`describeRuleReach` (`poolRule.ts:447-456`) ist die richtige: der leere Ordner vor der leeren
Regel, sonst stünde „richten Sie die Regel ein" an einer eingerichteten Regel. Und die
Beschreibung wird hereingereicht statt zweimal erzeugt — der genannte Ordner kann kein anderer
sein als der markierte Chip. Das ist die Sorgfalt, die ich sonst vermisse.

Dieselben Worte wie im Formular: **ja**, über `emptyFolderNames` an allen vier Flächen. Die
Überschriften sind sogar zeichengleich („Der geforderte Ordner enthält kein Tag" in
`BoardScreen.tsx:601` und `PoolFormDialog.tsx:670`). Eine Abweichung, die mir aufgefallen ist und
die ich für richtig halte: Der Spaltenkopf sagt „diese **Bedingung** kann kein Todo erfüllen"
(`RuleSummary.tsx:209`), der Spaltendialog „diese **Spalte** kann nichts treffen"
(`BoardScreen.tsx:882`). Verschiedene Worte, weil verschiedene Bezugsgrößen — die
Zusammenfassung spricht über eine Achse, der Dialog über eine Zeile. Kein Befund.

**Gelöschter Ordner.** T-087 hat „einem unbekannten Ordner" gewählt, nicht „einem gelöschten
Ordner". Ich stimme zu, und die Begründung trägt: Die Oberfläche kann „gelöscht" nicht belegen —
von hier aus sieht ein gelöschter Ordner genauso aus wie ein Baum, der älter ist als die Antwort
des Dienstes. Dazu kommt der ausschlaggebende Punkt: Der Chip daneben trägt bereits das Wort
„Unbekannter Ordner" (`poolRule.ts:226-233`), und zwei Wörter für denselben Zustand wären zwei
Zustände. Auch die Grammatik ist sauber gelöst — Namen in Anführungszeichen, die Umschreibung
nicht, Mehrere zusammengezogen zu „zwei unbekannten Ordnern" (`poolRule.ts:503-513`). Kein Befund.

Ein Rest bleibt: Wird der Ordner gelöscht, während die Regel ihn nennt, greift laut
`docs/datenmodell.md` `ON DELETE CASCADE` auf `pool_rule.folder_id` — der Term verschwindet dann,
und die Spalte trifft schlagartig etwas anderes, ohne daß jemand etwas sagt. Das ist außerhalb
dieses Branches und außerhalb meiner Belege für diesen Bericht; ich nenne es als **Prüfauftrag an
den e2e-tester**, nicht als Befund: Ordner löschen, der in einer Regel steht — was sagt die
Löschbestätigung, und was steht danach an der Spalte?

---

## 7. Sprache

Oberflächentexte sind durchgehend deutsch; ein englischer Bezeichner steht an keiner Fläche.
Positiv hervorzuheben: `lib/labels.ts` ist die eine Stelle, an der aus einem Datenwert ein
Oberflächentext wird, und die Regel dort („Der Schlüssel ist der Wert aus dem Datenmodell, niemals
ein hier erfundener") ist eingehalten.

Abweichende Begriffe, gesammelt:

| Nr | Wort | Wo es was anderes heißt | Bewertung |
|---|---|---|---|
| 1 | **„Regel über Tags"** | elf Stellen, siehe S-2. Nach E-055 unvollständig | sollte |
| 2 | **„Alle"** | Neutralwert der Erledigt- und der Exportachse („schränkt nicht ein"), drei Zeilen darüber im selben Formular „**Alle davon**" als **strengster** Modus (`PoolFormDialog.tsx:526` gegen 611, 637). Dasselbe Wort für „engt nicht ein" und „engt am meisten ein" | sollte — gemildert durch den dauerhaften Zusatz „schränkt nicht ein" am Neutralwert, aber die Kollision bleibt. Vorschlag: Modus auf „Jedes der genannten" / „Mindestens eines" umstellen; damit verschwindet „Alle" als Modus ganz |
| 3 | **„Offen"** | Exportstatus-Achse (`POOL_EXPORT_LABEL.open`) und Erledigt-Kennzeichen auf der Karte (`DONE_FLAG_LABEL.open`). Im Formular stehen beide Achsen untereinander | sollte — Vorschlag: Exportachse auf „Noch offen" oder „Nicht exportiert"; die Zusammenfassung sagt bereits „Mit offener Buchung" und ist damit eindeutiger als das Formular |
| 4 | **„Erledigt"** | drei Dinge: Kennzeichen am Todo (A-2.4), Achse einer Regel (E-055), Sichtbarkeitsschalter „Erledigte einblenden" (E-039). In `lib/labels.ts:190-197` erkannt und kommentiert, an der Fläche nicht auseinandergehalten | Hinweis — die Achse trägt im Formular bereits Hilfssätze, die den Unterschied aussprechen. Ich rate von einer Umbenennung ab: „Erledigt" ist das Wort des Auftraggebers |
| 5 | **„Achse"** | Modellwort, steht an zwei Oberflächenstellen: `PoolFormDialog.tsx:599` „Drei Achsen, die keine Tags brauchen" und `RuleSummary.tsx:217-218` „Diese Achsen lassen alles durch". Der übrige Dialog spricht durchgehend von **Bedingungen** | sollte — Vorschlag: „Drei Bedingungen, die keine Tags brauchen" und „Diese Bedingungen lassen alles durch". „Achse" bleibt in Code, Berichten und `docs/datenmodell.md`, wo es hingehört |
| 6 | **„Spalte"** | `TaskPane.tsx:633` bildet `statusId` darauf ab — seit E-054 falsch, siehe S-4 | sollte |
| 7 | **„Pool"** | Der Aufgabenbereich kennt nur dieses Wort (`reopen.ts:129-130`), die Hauptanwendung führt drei (`POOL_PLACEMENT_SHORT`: Pool / Board-Spalte / Pool und Board). Heute unschädlich, weil `poolNamer` nur Pools liefert — mit der Behebung von B-4 wird es schädlich | mit B-4 zusammen entscheiden |
| 8 | **„Term"** | kommt an keiner Fläche vor | richtig so, kein Befund |

---

## 8. Add-in (E-056, E-057)

**Ist der Poolsatz ohne Regelbegriff verständlich?** Ja. „Es erscheint dann in dem Pool „Wartung,
noch nicht abgerechnet“." ist ein deutscher Satz ohne Fachwort; er nennt Namen statt Zahlen
(`listPools`, `reopen.ts:114-118`), unterscheidet Einzahl und Mehrzahl am Artikel, und die
Überschrift „Was sich dadurch ändert" ist Rahmen und keine zweite Behauptung. Daß `null` und nicht
der leere String zurückkommt und beide Aufrufstellen darauf prüfen, ist die richtige Bauart — eine
leere Zeile hätte niemand bemerkt. Die Auflage aus E-056 („ein Satz, nur wenn Pools betroffen
sind, keine zweite Liste") ist eingehalten, und zwar im Rückgabetyp und nicht in der Oberfläche.

**Zwei Einschränkungen**, beide oben belegt: Der Satz erreicht reine Board-Spalten nicht (**B-4**)
— also nicht den Fall, mit dem E-056 sich begründet. Und im Wiederöffnen-Fall steht unter ihm der
Satz, der ihm widerspricht (**B-1**).

**Wird eine Spalte über einen leeren Ordner richtig nicht genannt?** Ja. `poolNamer` gibt seit
T-086 `unresolvedRequired` an `matchesPool` mit, termweise aus `axes.required.emptyFolderIds`
abgeleitet und über `tagAxisIsUnresolved` aus der Domäne — nicht nachgebaut
(`service.ts:313-334`). Die ausgeschlossene Achse steht absichtlich nicht daneben, und genau das
ist gemessen: Die dritte Mutation in T-086 („zu grob behoben") macht die Ausschlußprüfung rot.
Drei Mutationen, dreimal die passende Farbe. Das ist der sauberste Nachweis in diesem Branch.

Eine Anmerkung zur Reichweite, kein Befund: `AddinUnit.pools` ist mit T-086 auf
`Pick<PoolPort, 'list' | 'resolveAxes'>` **verengt** worden. Der Auftrag lautete „erweitern", die
Abweichung ist gemeldet und begründet, und die Begründung überzeugt mich: Der Ausschnitt ist die
Wache, und eine unbenutzte Fähigkeit darin ist die Einladung, mit der der Fehler aus T-078 zweimal
entstanden ist. Behält der Orchestrator B-4 im Blick, ändert sich daran nichts — `list('all')`
braucht keine zusätzliche Methode.

---

## 9. Barrierefreiheit (WCAG 2.2 AA)

**Gut gelöst.** `RadioRow` benutzt native `<input type="radio">` in einem `<fieldset>` mit
`<legend>` — Pfeiltasten, Tabulatorverhalten und anklickbare Beschriftung kommen dadurch geschenkt
statt nachgebaut. Der Fokusring liegt an der Hülle und nicht am 13 px breiten Knopf
(`app.css:1051-1063`) — richtig begründet. Der gewählte Zustand hängt an drei Merkmalen, keines
davon allein die Farbe (SC 1.4.1). Der leere Ordnerchip trägt ein anderes Symbol **und** das Wort
„kein Tag darin" (`RuleSummary.tsx:130-136`), nicht bloß eine Warnfarbe. Die Mehrfachnennung auf
dem Board wird über eine Live-Region angesagt und nennt dabei die Zahl der Spalten und ihre Namen
(`BoardScreen.tsx:296-304`). `--warning-border` ist gemessen durchgefallen und durch
`--warning-fg` ersetzt worden, mit einem Merkposten im Prüfskript gegen den Rückfall „aus
Konsistenz" — genau die richtige Reaktion.

**Befunde.** S-6 (Hilfssatz im `<label>`, doppelt vorgelesen), S-7 (vier Bedienelemente, zwei
Namen; `FolderPicker` ohne Gruppe), S-8 (Vorschau ohne Live-Region), H-2 (ein ungemessenes
Farbpaar).

**Fokusreihenfolge** im Regelformular geprüft, in Lesereihenfolge und ohne `tabindex`: Name →
Anzeigeort → erforderliche Tags → Modus → Ordner → ausgeschlossene Tags → Ordner → Ordnertiefe →
Status → Erledigt → Exportstatus → Vorschau → Warnbänder → Schaltflächen. Die Reihenfolge folgt
E-055 und dem Vorbild. Kein Befund — außer daß die Warnbänder **hinter** der Vorschau kommen und
damit hinter der Stelle, auf die sie sich beziehen; für eine Vorlesehilfe ist das die falsche
Richtung. Mit S-8 zusammen zu lösen: Warnband vor die Vorschau, dann steht die Diagnose vor dem
Ergebnis.

**Kontrast.** `pnpm run contrast` läuft grün (0 von 424, zweimal unabhängig gemessen). Die neuen
Flächen sind **erfaßt**, wenn auch nicht alle unter einem eigenen Gruppennamen: Die Gruppe „Leerer
Ordner" deckt vier Paare des E-057-Befundes ab, die übrigen Flächen des Regelformulars benutzen
ausschließlich Farbpaare, die unter anderen Gruppennamen bereits gemessen sind (Nachweis in H-2).
Die eine Lücke steht dort.

---

## 10. Empfehlung zu den offenen Produktfragen

Ich entscheide nichts davon. Beides gehört dem Auftraggeber; hier steht, was ich ihm raten würde
und warum.

### O-E — „Soll das Ziehen für reine Status-Spalten zurückkommen?"

**Empfehlung: nein, und stattdessen die Ersatzfrage stellen.**

Vier Gründe, in der Reihenfolge ihres Gewichts:

1. **Zwei Sorten Spalte, die gleich aussehen.** Ein Board, auf dem die eine Hälfte der Spalten
   eine Karte annimmt und die andere sie stumm zurückweist, ist schlechter als eines, auf dem
   keine sie annimmt. Beim abgelehnten Ablegen gibt es keinen Ort für die Erklärung — die Geste
   ist vorbei, bevor man etwas lesen kann. Ein verweigertes Ablegen liest sich als Fehler.
2. **„Rein über den Status" ist kein Zustand, sondern ein Augenblick.** Seit E-055 hat jede Regel
   fünf Achsen. Wer einer Status-Spalte einen Tagterm hinzufügt, verliert das Ziehen mitten im
   Betrieb — eine Fähigkeit, die beim Bearbeiten einer Regel verschwindet, ist die unangenehmste
   Sorte.
3. **Der Auftraggeber hat den Preis ausdrücklich bezahlt.** „Verschieben fliegt dann ebenfalls
   raus" war die zweite Hälfte seiner Antwort und die konsequentere; E-054 hält das fest. Ihm die
   Hälfte zurückzugeben, ohne daß er darum gebeten hat, kehrt eine Entscheidung um, deren
   Begründung unverändert gilt.
4. **Die Kosten sind nicht klein.** `board_rank` und `ux_todo_rank` sind mit Migration 0010
   entfernt (`docs/datenmodell.md:388-389`). Zurück heißt: Migration, Sortierschlüssel,
   Ablageziel, `PUT`-Route und eine Tastaturalternative nach SC 2.5.7 — die es bis T-072 gab und
   die mit dem Ziehen verschwunden ist.

**Was ich ihm stattdessen vorlegen würde.** Sein eigentliches Bedürfnis ist vermutlich nicht die
Geste, sondern die **Geschwindigkeit**: Status ändern, ohne die Karte zu verlassen. Heute führt
„Status ändern" im Kartenmenü (`BoardScreen.tsx:662`) in den vollen `TodoFormDialog` — ein Dialog
für eine Auswahl aus fünf Werten. Ein Untermenü mit den Statuswerten unmittelbar im Kartenmenü ist
schneller als jedes Ziehen, funktioniert mit der Tastatur, braucht keine Migration und erzeugt
keine zweite Sorte Spalte. Das würde ich ihm als Gegenfrage stellen, statt ihn mit Ja/Nein über
das Ziehen entscheiden zu lassen.

### O-K — „Soll das Add-in sagen können, *warum* ein Pool fehlt?"

**Empfehlung: nein für den Grund, ja für eine viel kleinere Auskunft.**

1. **Der Aufgabenbereich beantwortet eine andere Frage.** Er sagt, was mit *diesem Todo* geschieht,
   nicht, in welcher Verfassung die Regeln sind. Eine Regeldiagnose („Kein Tag in „Kunden / Ost“")
   ist Pflegearbeit, und pflegen läßt sich in Outlook nichts: Es gibt dort weder Tag- noch
   Regelbearbeitung. Eine Meldung ohne Handlung ist eine Sackgasse — der Maßstab steht im Projekt
   selbst (`TagInput.tsx:472-482`). Der integration-dev hat in T-086 offene Frage 2 dieselbe
   Einschätzung, und ich teile sie.
2. **Der Preis steht in keinem Verhältnis.** Den Grund mitzugeben hieße, dem dauerhaften
   Add-in-Token die Auflösung jeder Regel zu öffnen. T-086 hat diese Fläche gerade um eine Methode
   **verkleinert**; sie für einen Hinweis wieder zu öffnen, der zu nichts führt, ist die falsche
   Richtung.
3. **Aber es gibt eine echte Hälfte.** Was der Benutzer bemerkt, ist nicht „ein Pool fehlt",
   sondern „der Pool, den ich erwartet habe, wird nicht genannt". T-086 Risiko 2 benennt es
   genau: Wer heute eine Spalte über einen noch leeren Ordner hat, sieht sie ab sofort nicht mehr
   — ohne Migration, ohne Ankündigung. Dafür genügt **ein Wahrheitswert über den ganzen Satz**,
   kein Grund je Pool und keine Kennung: Meldet der Dienst, daß mindestens eine Regel unvollständig
   eingerichtet ist, steht im Aufgabenbereich ein Satz — „Mindestens eine Regel ist unvollständig
   eingerichtet und wird hier nicht genannt. Welche, steht in Takt." Keine neue Datenklasse, keine
   Namen, und er zeigt auf den Ort, an dem sich etwas tun läßt.

Meine Empfehlung an den Orchestrator: dem Auftraggeber Punkt 3 als Frage vorlegen und Punkt 1 und
2 als Begründung, warum der volle Grund nicht empfohlen wird. Wenn er den vollen Grund will, ist
es eine Entscheidung mit Sicherheitsanteil und gehört vor den security-checker.

---

## Urteil

**Nacharbeit.**

Blockierend: **B-1** (A-2.5/I-05, `CARD_STAYS` an vier Flächen, im Add-in als Widerspruch in einem
Absatz), **B-2** (E-056: Hauptanwendung und Add-in geben bei derselben Handlung verschiedene
Auskünfte), **B-3/B-3b** (falsche Begründung und stille Kürzung im I-05-Text), **B-4** (E-056
erreicht reine Board-Spalten nicht, also nicht den Fall, mit dem die Entscheidung sich begründet),
**B-5** (Abschnitt 15: kein Lade- und kein Fehlerzustand im Regelformular), **D-1/D-2**
(`docs/benutzerhandbuch.md` beschreibt das Board von vor E-054).

B-1, B-2 und D-2 sind **eine** Sache und gehören in **eine** Aufgabe über zwei Hoheiten, nicht in
zwei parallele: Der Satz liegt zeichengleich in `apps/web` und im Add-in, und `proof:addin` prüft
die Zeichengleichheit. Zwei Agenten in derselben Welle daran erzeugen genau die zweite Fassung,
gegen die die Prüfung gebaut ist.

Was gut ist, soll auch dastehen: E-057 ist über vier Schichten durchgezogen, termweise statt
achsenweise, mit Namen an jeder Fläche, mit einer belegten Reihenfolge der Leerzustände und mit
drei Mutationen als Gegenprobe. Die drei — inzwischen vier — Leerzustände einer Spalte sind das
beste Stück Zustandsarbeit in diesem Projekt. Der Befund oben betrifft nicht sie, sondern das,
was E-054 einmal richtig erklärt hat und was E-055 unter der Erklärung weggezogen hat.
