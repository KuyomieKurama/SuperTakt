# T-200 — Zwei unerreichbare Zweige, eine Regel mit fernem Aufrufer, 42 Stellen nach Sorte

**Rolle:** spec-ux-reviewer **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md` (Abschnitte 6, 7, 8, 13, 16), `docs/design/**` (`textbestand.md`
einschließlich der Nachträge aus **T-203**, `textbestand-aufgabenbereich.md`,
`textabbau-gestalt.md`, `traeger-und-zusage.md`), `docs/benutzerhandbuch.md`, `CLAUDE.md`,
`.claude/team/decisions.md` (E-016, E-034, E-054, E-063, E-078, E-080, E-081, E-087), Berichte
T-184, T-186, T-191, T-192, T-193, T-195, **T-201**, **T-203**, und der laufende Baum.

> **Abschnitt 9 ist ein Nachtrag vom selben Tag, abends**, auf die Vorlage von T-203. Er
> **erledigt Z-49** (dort war der Wortlaut die letzte offene Frage), **verwirft meinen eigenen
> Wortlautvorschlag** und nimmt einen neuen Befund im Pflichtklickpfad auf. Wer nur die Abschnitte
> 1 bis 8 liest, liest meinen Vorschlag ohne die Korrektur, die ihn aufgehoben hat.

**Zur Form dieses Berichts (E-087 Punkt 4, seit heute nacht).** Die Entscheidung sagt wörtlich:

> **Nachtrag vom 2026-09-06: gesucht wird über den Wortlaut, nicht über die Zeile.** […] **Die
> Substanz hielt jedes Mal, die Zahl nie.** Also: ein Zitat ist der Anker, die Zeile höchstens ein
> Hinweis, und eine fremde Datei wird **ohne** Zeilenangabe genannt.

Für mich ist **jede** Datei außer dieser hier eine fremde Datei. Dieser Bericht nennt deshalb
**keine einzige Zeilennummer** und belegt ausschließlich mit Datei und Zitat. Meine drei am Baum
gemessenen Fundstellen aus T-195 (`BoardScreen.tsx:1021-1054`, `TodoFormDialog.tsx:250`,
`ExportAudit.tsx:170`) sind damit ausdrücklich **als Zahlen zurückgezogen**; die Zitate daneben
gelten weiter. Wer sie braucht, sucht den Wortlaut. Abschnitt 4 nimmt dazu einen Satz aus T-195
ausdrücklich zurück.

---

## Kurzfassung

```
Aufgabe: T-200 — O-HL (zwei unerreichbare Zweige an NoteField), O-HH (P-8 und ihr ferner
         Aufrufer), O-HP (42 bedingte Meldebausteine, Sortenentscheidung),
         O-HS (Nachtrag: der Handbuchabsatz aus T-201 und der Fall der Karte),
         O-HX (Nachtrag: die Fassung des Nachtragswegs aus T-203, Abschnitt 9)
Status: braucht Review — Nacharbeit. Blockierend: die Auflage aus Z-51, Z-53a, Z-59
```

| Gegenstand | Urteil |
|---|---|
| **O-HL** `NoteField.required` | **fällt ersatzlos** — Z-47 |
| **O-HL** `NoteField.error` | **bleibt** — Z-48. Es fehlt **keine Feldprüfung**; die Bedingung aus E-034 ist eine Bedingung der **Tagesgruppe**, nicht des Feldes |
| **O-HL** die Lücke, die es wirklich gibt | Z-49 — der Weg „Leistung nachtragen" endet in einer Erfolgsmeldung, während die Sperre steht. **Mit Z-56 bis Z-58 erledigt**, die Fassung liegt vor |
| **O-HL** Nebenfund | **Z-50** — der dritte Ausgang derselben Buchung trägt den E-034-Hinweis nicht |
| **O-HH** P-8 | **die Regel bleibt, die Funktion wird berichtigt** — Z-51, mit blockierender Auflage |
| **O-HH** der Prüffall dazu | **Z-52** — der eine Fall, der die zweite Hälfte mißt, beschreibt etwas anderes, als er baut |
| **O-HP** Sortenregel und Reihenfolge | **Z-53**, mit **Z-53a blockierend**: die Bauart des Wirts wird **vor** der ersten Stelle entschieden |
| **O-HS** Handbuchabsatz „Herkunft der Spalten" | **freigegeben — die Karte darf fallen** — Z-54, mit zwei Auflagen |
| **O-HS** Fristabsatz beschreibend statt zitierend | **freigegeben, und es ist die richtige Bauart** — Z-55 |
| **O-HX** die Bindung an die Gruppe statt an den Wert | **er hat recht, mein Wortlaut fällt** — Z-56 |
| **O-HX** vier Lagen, drei Fassungen | **freigegeben mit zwei Auflagen** — Z-57 |
| **O-HX** „zeichengleich der Rumpf des Stoppdialogs" | **berichtigt** — Z-58, eine Genauigkeit vor dem Bau |
| **O-HX** der Fokusbefund in `ExportGroups.tsx` | **bestätigt, blockierend für denselben Auftrag** — Z-59 |
| **SP-22 / Sorte T3-A** | **zur Kenntnis und angenommen** — Z-60, mit einer Auflage zur zweiten Pflichtangabe |

---

## 1. O-HL — zwei Anzeichen, ein Urteil je Zweig

### 1.0 Was ich gemessen habe

`NoteField` hat im Produkt **fünf** Aufrufstellen: zwei in `apps/web/src/app/TimerContext.tsx`
(Stoppdialog und Wechseldialog, beide `scope="billing"`), eine in
`apps/web/src/screens/BookingDialogs.tsx` (`BookingFormDialog`, anlegen **und** ändern,
`scope="billing"`), eine in `apps/web/src/screens/TodoFormDialog.tsx` und eine in
`apps/web/src/screens/TodoDetailScreen.tsx` (beide `scope="internal"`).

**Keine dieser fünf reicht `error` oder `required` herein.** Gesetzt werden beide allein in
`apps/web/src/showcase/NotesSection.tsx`. Das bestätigt meinen eigenen Befund Z-19a und weitet
e2e-testers Messung aus T-192 (dort für `scope="billing"`) auf **beide** Feldarten aus.

### 1.1 Z-47 — `required` fällt ersatzlos

**Die Frage ist entschieden, und zwar gegen die Eigenschaft.** Für `scope="billing"` steht sie im
Widerspruch zu E-034, wörtlich:

> **Entscheidung.** Eine Tagesgruppe ohne Leistungstext ist nicht exportierbar. Sie wird in der
> Exportvorschau als solche gekennzeichnet, mit dem Grund, und der Benutzer kann den Text direkt
> dort nachtragen.

Und das Produkt sagt es dem Benutzer an zwei Ausgängen selbst — `apps/web/src/lib/labels.ts`
führt den Satz unter `BILLING_NOTE_MAY_BE_EMPTY`. Ein Pflichtfeld nähme genau die Wahl weg, die
E-034 gegeben hat. Für `scope="internal"` verlangt A-7.1, daß ein Todo eine Notiz **besitzt** —
nicht, daß sie ausgefüllt ist. Eine Anforderungs-ID für eine Pflicht gibt es an keinem der beiden
Felder.

**E-087, heute gemessen, bevor gestrichen wird:** Weder der vorgelesene Zusatz `(Pflichtfeld)` aus
`NoteField.tsx` noch der Fehlertext der Musterseite („Ohne Eintrag im Feld „Leistung“ lässt sich
diese Buchung nicht exportieren.") kommt in `tests/**` oder `apps/*/test/**` vor. Die zwei Treffer
auf das Wort „Pflichtfeld" stehen in `tests/e2e/attachment-crud.spec.ts` und
`tests/e2e/field-live-region-announcement.spec.ts`, beide in Fließtext über **andere** Felder, und
der gleichlautende Zusatz in `apps/web/src/components/FormDialog.tsx#TextField` bleibt unberührt.
**Es hängt kein Prüffall daran.**

**Damit ist mein Vorbehalt aus Z-19a — ein Entfernen streicht einen zugänglichen Namen — erledigt:**
gestrichen wird ein zugänglicher Name, den **kein Produktaufruf je erzeugt**. Die Streichung ist im
Produkt zeichenlos.

**Auflage:** Die Vorführung auf der Musterseite geht mit. Eine Musterseite, die einen Zustand
vorführt, den das Produkt nicht haben darf, ist kein Muster, sondern ein Vorschlag — und genau an
ihm ist T-192 hängengeblieben, als er den Bauplan für einen Prüffall nicht auslösen konnte.

### 1.2 Z-48 — `error` bleibt, und die gestellte Frage hat eine dritte Antwort

**Die Frage lautete: fällt der Fehlerpfad, oder fehlt die Prüfung, die ihn füllen müßte? Gemessen
ist beides nicht der Fall, und der Grund ist eine Ebenenverwechslung.**

Die einzige Bedingung, die es im Produkt für die Leistung gibt, ist die aus E-034 — und sie ist
**keine Bedingung eines Feldes**. `apps/web/src/components/ExportGroups.tsx` sagt es in der
Meldung selbst:

```
Nicht exportierbar. {blockedReason} Der übrige Export läuft trotzdem; diese Gruppe bleibt offen
und erscheint beim nächsten Mal wieder.
```

Gesperrt ist die **Tagesgruppe**, nicht die Buchung. Eine einzelne Buchung ohne Leistung ist
tadellos, solange eine andere Buchung derselben Gruppe Text trägt — `ExportGroups.tsx` zeigt
genau das nebeneinander („— keine Leistung erfasst —" an der Zeile, während die Gruppe läuft).
Ein `NoteField.error` an einer einzelnen Buchung könnte diese Aussage **gar nicht wahrheitsgemäß
tragen**: Er stünde an einem Feld, dessen Leere für sich genommen kein Fehler ist.

Also: **Es fehlt keine Feldprüfung.** Und der Fehlerpfad fällt trotzdem nicht, aus zwei Gründen,
die beide gemessen sind:

1. **Er ist der einzige Kanal des Feldes für eine Absage des Dienstes.** `textSchema` in
   `apps/local-api/src/http/input.ts` (`z.string().max(20_000)`, Kommentar: *„Leistung und Vermerk.
   1 MB Rumpfgrenze steht davor"*) ist enger als der Deckel, den die Oberfläche am Vermerk führt
   (`maxLength={65536}` in `TodoFormDialog.tsx` und `TodoDetailScreen.tsx`) — das ist **O-AX auf
   dem Board**, unverändert offen. Heute landet diese Absage als Dialogfehler beziehungsweise als
   `InlineMessage` neben der Karte, nicht am Feld. Das ist vertretbar (eine abgewiesene Anfrage ist
   keine Feldbedingung), aber es ist eine Entscheidung, die man treffen können muß — und dafür muß
   der Zweig existieren.
2. **E-087, gemessen: an der Meldefläche hängt ein Prüffall.**
   `tests/e2e/timer-stop-announcement.spec.ts` mißt

   > `.note__live[role="alert"]` steht von Anfang an im Baum, leer, bevor der Dialog etwas zu
   > melden hätte

   und `docs/testplan.md` schreibt denselben Fall aus. Fiele `error`, fiele `.note__live` mit ihm,
   und dieser Fall ginge rot — in einem Lauf, dessen Gegenstand der Timer-Stopp ist. Das ist
   dieselbe Falle wie bei ST-A-05 in Z-43, nur umgekehrt: nicht der Text, sondern die **Bauart**
   ist vertraglich.

**Auflage, klein:** Der Kommentar an `error` in `NoteFieldProps` sagt heute, was der Zweig tut
(*„Fehlertext. Wird unter dem Feld ausgegeben und per aria-describedby verknüpft."*). Er sagt
nicht, daß ihn niemand setzt. Nach dem Vorbild, das derselbe Baustein wenige Zeilen tiefer bereits
gibt — *„für dieses Feld steht die Messung aus (Bericht T-186)"* — gehört genau ein Satz dazu:
welche Sorte Meldung hier hingehört (eine Absage des Dienstes an **diesen** Text) und welche
nicht (die Sperre der Tagesgruppe, E-034, die eine Ebene höher steht). Das ist die Form, die
E-087 verlangt: eine Zusicherung, die ihre eigene Lücke benennt.

### 1.3 Z-49 — Die Lücke steht nicht am Feld, sondern am Ausgang des Nachtragswegs

> **Stand nach Abschnitt 9:** Der Befund steht unverändert; **mein Wortlautvorschlag in diesem
> Abschnitt ist zurückgezogen** (Z-56). Die geltende Fassung ist `textbestand.md` Abschnitt 12.

**Der Klickpfad, gemessen.** In `apps/web/src/components/ExportGroups.tsx` (und gleichlautend in
`apps/web/src/screens/TemplatePreview.tsx` und `apps/web/src/screens/ExportScreen.tsx`) steht an
jeder Buchung ohne Leistung ein Knopf:

```
Leistung nachtragen
```

Er ruft `onEditEntry`; `ExportScreen.tsx` setzt daraufhin `editEntry` und öffnet
`BookingFormDialog` im Änderungsfall. Der Dialog heißt dort **„Buchung bearbeiten"** und sagt
darunter: *„Für „X". Der gerundete Exportwert hängt an der Tagesgruppe, nicht an dieser Buchung."*
Kein Wort davon, daß die Gruppe gesperrt ist und daß der Benutzer genau deswegen hier steht.

**Und der Ausgang ist falsch.** Wer speichert, ohne die Leistung einzutragen, bekommt aus
`BookingDialogs.tsx`:

```
toasts.success("Buchung geändert.", "Die Tagesgruppe dieses Todos ändert sich mit.")
```

Eine **Erfolgsmeldung** — für eine Handlung, die ihren Zweck nicht erreicht hat, und mit einem
Rumpf, der etwas verspricht, das nicht eingetreten ist: Die Tagesgruppe ändert sich gerade
**nicht**, sie bleibt gesperrt. Zurück in der Vorschau steht die Sperrmeldung unverändert im
`role="status"`-Wirt; da sich ihr Text nicht ändert, wird sie auch nicht erneut angesagt. Der
Benutzer hört „Buchung geändert." und hat nichts geändert.

**Das ist die Lücke, nach der die Frage gesucht hat** — nur eine Ebene über dem Feld. Sie trifft
den Pflichtklickpfad **„Exportstatus an jeder Stelle sichtbar"** (A-8.6, A-13.5) und die
Ausgleichszusage aus E-034 (*„und der Benutzer kann den Text direkt dort nachtragen"*): Der Weg
existiert, aber er sagt nicht, ob er zum Ziel geführt hat.

**Mein Vorschlag von heute morgen** — *„Der Rumpf der Erfolgsmeldung wird an den Wert gebunden.
Bleibt die Leistung leer, sagt er es: „Die Leistung ist weiterhin leer. Die Tagesgruppe geht damit
nicht in den Export.""* — **ist mit Z-56 zurückgezogen.** Er war an zwei von vier Lagen falsch.

### 1.4 Z-50 — der dritte Ausgang trägt den E-034-Hinweis nicht

`BookingDialogs.tsx` begründet den Hinweis unter dem Leistungsfeld selbst, wörtlich:

> Auch beim Ändern: Wer die Leistung hier leert, erzeugt denselben Zustand. Ein Hinweis, der nur
> an einem der beiden Ausgänge stünde, wäre derselbe Fehler eine Ebene tiefer.

Gemessen sind es aber **drei** Ausgänge, an denen eine Buchung mit leerer Leistung entsteht:
der Stoppdialog (`TimerContext.tsx`, trägt den Hinweis), „Zeit von Hand erfassen" /
„Buchung bearbeiten" (`BookingDialogs.tsx`, trägt ihn) — und der Dialog **„Es läuft bereits ein
Timer"** (`TimerContext.tsx`, Absendeknopf „Stoppen und wechseln"), der die laufende Buchung
ebenso beendet und **keinen** Hinweis trägt. Er ist derselbe Vorgang wie der Stopp, nur mit einem
zweiten Timer dahinter, und er trifft I-04.

**Vorschlag:** derselbe `BILLING_NOTE_MAY_BE_EMPTY` unter das Feld. Kein neuer Text — der Satz
steht schon genau einmal in `apps/web/src/lib/labels.ts`, und das ist der Grund, aus dem er dort
steht.

---

## 2. O-HH — eine Regel, deren Schweigen an einer fernen Stelle hängt

### 2.1 Was heute gilt

`apps/web/src/lib/touched.ts` liefert `edited || value.length > 0` und sagt dazu:

> Die zweite Hälfte („oder nicht leer ist“) trägt den Fall, den `edited` nicht sieht: ein
> vorbelegtes Feld, das der Benutzer unverändert verläßt. Es gilt als berührt — und bleibt
> trotzdem stumm, weil die Meldung darüber einen leeren Wert verlangt.

Gemessen ist das für **alle neun** Aufrufstellen richtig: `TagsScreen.tsx` (dreimal, `nameError =
nameTouched && name.trim().length === 0 ? "Name fehlt." : undefined`), `PoolFormDialog.tsx`,
`StatusSettings.tsx`, `TemplatesScreen.tsx` (`copyNameTouched && copyName.trim().length === 0`),
`Attachments.tsx` (`touched && !picking && trimmed.length === 0`) und `ConfirmDialog.tsx`
(`reasonMissing = reasonRequired && reasonTouched && reason.trim() === ""`). Jede verlangt einen
**getrimmt leeren** Wert. P-8 ist damit heute wahr, und meine Beschreibung in P-8 war es auch.

**Und der Fall ist nicht theoretisch.** `TemplatesScreen.tsx` belegt das Feld beim Öffnen vor:

```
setCopyName(`Kopie von ${dropHiddenCharacters(template.name)}`);
```

Wer diesen Dialog öffnet und nur hindurchtabbt, gilt nach `touchedOnBlur` als **berührt** — ohne
eine Taste berührt zu haben. Still bleibt es allein, weil der Aufrufer zusätzlich fragt.

### 2.2 Z-51 — die Regel bleibt, die Funktion wird berichtigt

**Urteil: P-8 bleibt wörtlich, wie sie in Z-20 freigegeben wurde. Die Funktion bekommt den
`trim()` auf ihrer zweiten Hälfte:**

```ts
return edited || value.trim().length > 0;
```

**Erstens ändert das heute kein Verhalten.** Ein vorbelegter Wert, der nur aus Leerzeichen
besteht, kann im Bestand nicht entstehen: `nameSchema` in `apps/local-api/src/http/input.ts` ist
`z.string().trim().min(1)`, und `Kopie von …` ist nie leer.

**Zweitens nimmt es der Regel die Abhängigkeit.** Danach gilt: **Ein unberührtes Feld erzeugt
keine Meldung, gleichgültig wie der Aufrufer seine Bedingung schreibt.** Heute gilt das nur,
solange alle neun (und der zehnte, den noch niemand geschrieben hat) `trim()` fragen. Der zehnte
ist der ganze Punkt — es ist dieselbe Klasse, die in diesen Wellen viermal danebengegangen ist,
und sie geht nie beim ersten Schreiben daneben.

**Drittens ist der Einwand des Dateikopfes gegen `trim()` nach der Schärfung aus T-186 keiner
mehr.** Er lautet:

> Nicht `trim()`: Wer ein Leerzeichen tippt, hat eine Eingabe gemacht […]

Das ist richtig — und dieser Fall wird seit T-186 von der **ersten** Hälfte getragen: Wer tippt,
setzt `edited`, und `edited || …` ist schon wahr. Der Einwand galt der Fassung, die den Wert mit
dem Öffnungswert verglich, also einer Fassung ohne `edited`. Er ist mit ihr entfallen und steht
seither da, als gälte er noch. **Es gibt heute genau eine Konstellation, in der die zweite Hälfte
allein entscheidet: ein vorbelegtes Feld ohne Eingabe** — und für die ist `trim()` genau richtig.

**Ein sichtbarer Hinweis neben der Regel ist die schwächere Antwort und ich empfehle ihn nicht.**
Ein Kommentar, der eine ferne Bedingung zusichert, ist die Bauart, gegen die E-087 geschrieben
wurde. Die Wahl steht zwischen **beseitigen** und **messen**; „danebenschreiben" ist keine dritte
Möglichkeit. Wenn der Orchestrator die Abhängigkeit stehen lassen will, dann nur mit einer
Messung je Aufrufstelle — neun Prüffälle für etwas, das eine Zeile beseitigt.

**Auflage, blockierend:** `touched.ts` und `apps/web/test/lib/touched.test.ts` gehen in **einem**
Auftrag (E-081 Punkt 4, E-087). Der Grund steht in Z-52.

**Die Alternative, damit sie beurteilt ist und nicht später als Einfall wiederkommt:** Man könnte
die zweite Hälfte ganz streichen (`return edited`) — dann sagt die Funktion buchstäblich den
ersten Satz von P-8. Ich rate ab: Die zweite Hälfte ist die Tür für den Fall, den es geben wird —
eine Meldung an einem vorbelegten Feld über einen **nicht** leeren Wert (etwa ein vergebener
Name). Sie zu streichen hieße, P-8s Wortlaut zu ändern, und das ginge nur mit ux-designer und in
demselben Auftrag.

### 2.3 Z-52 — der eine Prüffall, der die zweite Hälfte mißt, baut etwas anderes, als er beschreibt

`apps/web/test/lib/touched.test.ts` führt den Fall

> „ein Leerzeichen ist eine Eingabe, kein leerer Wert — kein trim() in der Regel"

und setzt darin `edited = false`. **Der Name sagt „eine Eingabe", die Daten sagen „keine
Eingabe".** Gemessen wird damit nicht das, was der Titel behauptet (jemand tippt ein Leerzeichen —
das wäre `edited = true`), sondern der einzige Zustand, in dem ein Leerzeichen im Feld steht,
**ohne** daß jemand es getippt hat: ein vorbelegtes Feld. Und genau dort ist die heutige Fassung
angreifbar.

Das ist kein Vorwurf an unit-tester — T-193 hat die Regel geprüft und nicht meine Umschreibung,
und das war richtig. Es ist der Beleg für Z-51: Die einzige Messung der zweiten Hälfte trägt in
ihrem Namen einen Fall, den sie nicht baut.

**Vorschlag an unit-tester, im selben Auftrag wie Z-51:** aus einem Fall werden zwei —
`(" ", true) → true` („ein getipptes Leerzeichen ist eine Eingabe", der Fall, den der heutige Name
beschreibt) und `(" ", false) → false` („ein vorbelegtes Leerzeichen ist keine"). Danach mißt der
Lauf die Regel an ihrer schwächsten Stelle statt an ihrer stärksten.

---

## 3. O-HP — 42 Stellen, nach Sorte

### 3.0 Was ich selbst gemessen habe, und was ich übernehme

**Übernommen als Stand, nicht als eigener Nachweis** (E-087 Punkt 2): T-191 hat am 2026-09-05 über
115 Dateien **42 Aufrufstellen** bedingt gerenderter Meldebausteine gezählt — 37 `InlineMessage`,
4 `LoadingBlock`, 1 `UpdateNotice`. Ich zähle sie nicht nach; ein AST-Durchgang ist nicht mein
Werkzeug.

**Selbst gemessen, heute:** `<InlineMessage` kommt in `apps/web/src` **76mal in 34 Dateien** vor,
davon **30 in `apps/web/src/showcase/**`**. Diese Zahl widerspricht der 42 nicht (sie zählt auch
die unbedingten), aber sie trägt das erste Sortierargument: **fast die Hälfte aller Meldebausteine
steht auf der Musterseite.**

### 3.1 Z-53 — die Sortenregel, und sie ist nicht „Handlung ja/nein"

Ich übernehme T-191s Fassung mit einer Schärfung:

> **Ein Meldebaustein braucht einen dauerhaften Wirt, sobald er auf einer Fläche erscheinen kann,
> die dabei stehen bleibt.**

Die Schärfung: Entscheidend ist nicht die **Handlung**, sondern ob die Fläche **steht**. Beides
fällt meistens zusammen, aber nicht immer — der Hinweis der Versionsprüfung folgt keiner Handlung
und ist trotzdem der klarste Fall für einen Wirt (unten). Umgekehrt folgt der Ladezustand nach
einem Klick auf „Erneut versuchen" einer Handlung, und der Wirt gehört trotzdem nicht an ihn,
sondern an das **Ergebnis**.

**Die drei Bausteinarten:**

| Art | Sorte | Begründung |
|---|---|---|
| **`InlineMessage`, `tone="danger"` / `"warning"` als Folge einer Handlung** | **1 — Wirt** | Der Dialog beziehungsweise die Karte steht, der Benutzer hat gerade gedrückt, und die Meldung ist die einzige Antwort. Genau die Bauart aus O-DA/O-FX, eine Ebene höher |
| **`InlineMessage`, `tone="info"`, die beim ersten Aufbau dasteht und sich nie ändert** | **2 — kein Wirt** | Sie wird beim Aufbau der Fläche mitgelesen. Beispiele, wörtlich: „Gerundet wird die Tagesgruppe, nicht die einzelne Buchung" (`SettingsScreen.tsx`), „Reihenfolge" und „Sie suchen die Statuswerte?" (`BoardScreen.tsx`), „Es ändert sich nur der Name" (`PoolRenameDialog.tsx`) |
| **`LoadingBlock`** | **2 — kein Wirt** | Er trägt seine Rolle bereits selbst (`role="status" aria-live="polite"`) und erscheint beim **Aufbau** seiner Fläche. Die Ansage, auf die es ankommt, ist nicht „wird geladen", sondern das Ergebnis. Wo ein „Erneut versuchen" die Fläche stehen läßt, gehört der Wirt an den **Fehlerzweig** derselben Stelle, nicht an den Ladezweig |
| **`UpdateNotice`** | **geteilt** | `arrival === "start"` öffnet `UpdateDialog` — ein modaler Dialog nimmt den Fokus und wird dadurch angesagt: **kein Wirt nötig**. `arrival === "session"` erzeugt `<div className="updatebar" role="status">` **mitten in der Sitzung auf stehender Fläche**: **Sorte 1** |
| **alles in `apps/web/src/showcase/**`** | **2 — kein Wirt** | Die Musterseite ist ein Werkzeug der Entwicklung, kein Produktweg. 30 der 76 Vorkommen |

**Zum `UpdateNotice` gehört ein Widerspruch, den ich ausdrücklich melde**, weil er eine
Entscheidung gegen einen niedergeschriebenen Grund ist. Der Dateikopf von
`apps/web/src/app/UpdateNotice.tsx` sagt:

> **Ist nichts zu melden, entsteht kein Element.** Kein leerer Behälter, kein verstecktes `div`,
> kein Abzeichen in der Kopfleiste, das darauf wartet, gefüllt zu werden.

Das ist als Gestaltungssatz richtig und als Zugänglichkeitssatz falsch — für die Sitzungsleiste.
Sie ist der einzige Ort im Produkt, an dem eine Meldung **ohne jede Handlung des Benutzers** auf
einer stehenden Fläche erscheint (A-18.2: „beim Start **und danach regelmäßig**"). Wer nicht
hinsieht, erfährt nichts. Der leere Wirt kostet dort einen Knoten am Kopf der Anwendung, und die
Bauart dafür steht bereits: `.live-region` mit `:empty`-Rücknahme des Abstands, wie sie
`components.css` und `app.css` seit T-191 für `.attachment__main` und `.tag-picker` führen.

### 3.2 Z-53a — **blockierend.** Die Bauart des Wirts wird vor der ersten Stelle entschieden

`InlineMessage` **trägt seine Rolle selbst**:

```tsx
role={assertive ? "alert" : "status"}
aria-live={assertive ? "assertive" : "polite"}
```

Wer die naheliegende Behebung nimmt — den bedingten Aufruf in einen dauerhaften
`<div className="live-region" role="alert">` zu wickeln — erzeugt **eine Live-Region in einer
Live-Region**. Das ist kein Schönheitsfehler: Doppelte Ansage und undefiniertes Verhalten je nach
Vorlesehilfe, und zwar ausgerechnet an den Meldungen, die am meisten tragen.

Die zehn Stellen aus T-191 haben das Problem nicht, weil dort ein rollenloses `<p>` im Wirt hängt
(`ExportGroups.tsx`, `TemplatePreview.tsx`, `RulePickers.tsx`, `Attachments.tsx`). Für die 42 muß
die Bauart **einmal** festgelegt werden, bevor die erste Stelle angefaßt wird — sonst stehen am
Ende zwei Fassungen desselben Wirts nebeneinander, und das ist exakt die Klasse, die in diesen
Wellen viermal danebengegangen ist (zwei Fassungen einer Beschriftung, einer Pfadprüfung, einer
Textmenge, zweier Wächter).

**Vorschlag, zur Entscheidung durch Orchestrator und ui-designer, nicht durch mich:** ein
`MessageSlot`, der den dauerhaften Wirt **mit** der Rolle stellt und `InlineMessage` darin
rollenlos zeichnet (eine Eigenschaft am Baustein, kein zweiter Baustein). Dann gibt es die Zusage
weiterhin genau einmal, an dem Ort, an dem sie heute steht.

### 3.3 Welche Stellen zuerst — sechs, in dieser Reihenfolge

1. **`apps/web/src/components/FormDialog.tsx` — die Fehlerfläche des Dialogs.** Ein Knoten,
   `{error === null ? null : (<div ref={errorRef}><InlineMessage tone="danger" title="Das hat
   nicht geklappt">…)}`, und er bedient **jeden** Formulardialog des Produkts: Todo anlegen und
   ändern, Timer stoppen, Timer wechseln, Zeit von Hand erfassen, Buchung bearbeiten, Tag und
   Ordner anlegen und umbenennen, **Ordner verschachteln**, Pool und Spalte anlegen, Status,
   Vorlage kopieren. Er trägt damit vier der sechs Pflichtklickpfade. Und er ist heute **rein
   sichtbar** versorgt: `errorRef.current?.scrollIntoView({ block: "nearest" })` bewegt den Blick,
   nicht den Fokus und nicht die Ansage. Beste Wirkung je geänderter Zeile im ganzen Bestand.
2. **`apps/web/src/screens/TagsScreen.tsx` — „Das Verschieben hat nicht geklappt".** Der einzige
   Rückweg des Ziehens; der Kommentar daneben sagt selbst *„das Ziehen hat keinen Dialog, in dem
   er stehen könnte"*. Hier landet auch die Absage der **Selbstverschiebung** (Pflichtklickpfad;
   der Dialogzweig nennt sie wörtlich: *„Ein Ordner kann nicht unter einen seiner eigenen
   Unterordner."*). Eine Absage, die niemand hört, ist bei Drag & Drop eine Bewegung, die
   scheinbar nichts getan hat (A-13.6, I-07, I-08).
3. **`apps/web/src/screens/TodoDetailScreen.tsx` — „Der Vermerk wurde nicht gespeichert".** Die
   einzige Rückmeldung eines gescheiterten Speicherns am internen Vermerk (der Erfolg geht als
   Toast, der Fehlschlag nicht). Zugleich der Ort, an dem **O-AX** aufschlägt: `maxLength={65536}`
   an der Fläche gegen `textSchema` mit 20 000 an der Tür. Der Benutzer darf mehr tippen, als der
   Dienst nimmt — und erfährt die Absage stumm.
4. **`apps/web/src/screens/SettingsScreen.tsx` — drei Stellen.** „Die Einstellungen wurden nicht
   gespeichert", „Die Standard-Tags wurden nicht gespeichert" (beide Folge von „Speichern",
   Fläche steht) und die Tokenmeldung „Dieses Token steht genau jetzt hier — und nie wieder", die
   unmittelbar auf eine Handlung folgt und deren Inhalt **einmalig** ist. Die dritte ist die
   folgenreichste des Bereichs.
5. **`apps/web/src/app/UpdateNotice.tsx` — die Sitzungsleiste** (Z-53, Abschnitt 3.1).
6. **`apps/web/src/screens/ExportScreen.tsx` — „Die Gesamtvorschau ließ sich nicht abrufen"** und
   „Die Gliederung ließ sich nicht abrufen". Der Kommentar daneben sagt, warum: *„Sie ist zugleich
   die sichtbare Begründung dafür, dass „Export ausführen" gesperrt ist: Eine gesperrte
   Schaltfläche ohne Grund daneben ist eine Sackgasse."* Ein Grund, den man nicht hört, ist
   für einen Teil der Benutzer keiner (P-7).

**Ausdrücklich nachrangig, mit Begründung:**

- **Alles, was ein Toast bereits ansagt.** `ToastContext.tsx` hat den dauerhaften Wirt
  (`<div className="toast-layer" aria-live="polite">`, Kommentar: *„Genau **eine**
  Vorlesestelle"*). Der Export nennt seine ausgelassenen Gruppen dort bereits
  (`ExportScreen.tsx`: *„… stehen, weil die Leistung fehlt. Sie sind weiterhin offen und
  erscheinen beim nächsten Mal wieder."*); die gleichlautende `InlineMessage` im Ergebnisblock ist
  dann die zweite Fassung derselben Auskunft und braucht keinen eigenen Wirt.
- **Die vier `LoadingBlock`** und der Ladezweig von `AsyncBoundary` (`screens/parts.tsx`).
- **Die 30 Vorkommen der Musterseite.**

Damit sind es nicht 42 Knoten, sondern nach meiner Sortierung **deutlich unter der Hälfte** — und
R-2 aus T-191 („bei 42 wäre es eine Abwägung") verliert seinen Gegenstand. Die genaue Zahl liefert
der AST-Durchgang von frontend-dev, nicht dieser Bericht.

---

## 4. O-HS — Nachtrag: der Handbuchabsatz steht, und die Karte darf fallen

### 4.1 Z-54 — UM-08: **freigegeben**, nach dreimaliger Zurückstellung

**Die Vorbedingung, die ich in T-184, T-195 (Z-34) und davor genannt habe, ist erfüllt.** Sie
stammt nicht von mir, sondern aus `textbestand.md` selbst: *„Der Absatz steht im Handbuch,
**bevor** die Karte aus `BoardScreen.tsx` verschwindet."* T-201 hat ihn geschrieben —
`docs/benutzerhandbuch.md`, neuer Unterabschnitt **„Herkunft der Spalten"** am Ende von „Mit dem
Kanban-Board arbeiten".

**Deckung der vier Kartenpunkte, einzeln geprüft:**

| Kartenpunkt (Zitat aus `BoardScreen.tsx`) | Wo er nach dem Fall steht |
|---|---|
| „**Ihre Todos sind vollzählig da.** Sie stehen in der Todo-Liste, mit Status, Tags und allen erfassten Zeiten. Es wurde nichts gelöscht und nichts verschoben." | Handbuch: *„Kein Todo wäre dabei verloren gegangen oder verschoben worden. Es bliebe mit Status, Tags und allen erfassten Zeiten vollständig in der Todo-Liste"* — **gedeckt** |
| „**Der Status bleibt.** Er ist weiterhin eine Eigenschaft jedes Todos […] er ist nur nicht mehr die Spalte." | Handbuch: *„der Status bliebe weiterhin eine eigene Eigenschaft des Todos, unabhängig von der Spalte"* — **gedeckt** |
| „Welche Statuswerte es gibt, richten Sie in den Einstellungen unter „Status“ ein." (Verweisteil) | **bleibt im Produkt**: `TodoFormDialog.tsx` trägt *„Die Werte stehen in den Einstellungen unter „Status“."* — **gedeckt**, und richtig, daß documenter ihn nicht dupliziert hat |
| „**Keine automatische Übersetzung.** […]" | Leerzustand des Boards: *„Sie richten die Spalten selbst ein. Takt erfindet keine."*, gemessen in `tests/e2e/board-empty-state-rule-chain.spec.ts` — **gedeckt** |
| „**Nichts wird mehr gezogen.** […]" | `RULE_WHAT_MOVES_A_CARD` im `lead` des Boards **und** Handbuch: *„Karten lassen sich nicht mehr per Drag & Drop zwischen Spalten ziehen."* — **doppelt gedeckt** |

**Der Konjunktiv trägt, und er ist besser als die Alternative.** Documenters Begründung —
*„Eine Formulierung im Indikativ hätte eine Migration behauptet, die nie stattgefunden hat"* — ist
genau die Sorgfalt, die ich an anderer Stelle einfordere. Der Absatz beginnt indikativisch mit dem,
was belegt ist (*„Jede ausgelieferte Fassung von Takt kennt bereits ausschließlich das heutige,
regelbasierte Board: Kein bestehender Datenbestand ist von dieser Umstellung betroffen."*) und
wechselt erst für die Folgen in den Konjunktiv. Das ist die richtige Reihenfolge: erst die
Feststellung, dann der hypothetische Fall.

**Und damit ist die Karte selbst erst recht fällig.** Eine Fläche, die dauerhaft im Produkt steht
und einen Übergang erklärt, den **kein einziger Benutzer erlebt hat**, ist genau die visuelle
Unordnung, die A-13.2 verbietet — dieselbe Aussage kostet im Handbuch nichts und steht dort für
den einen Leser, der doch fragt.

**Zwei Auflagen.**

1. **Beide Knöpfe fallen mit.** `board-setup__actions` führt „Erste Spalte einrichten" (wörtlich
   und funktional derselbe Aufruf `onOpenSetup` wie die Aktion des Leerzustands drei Zeilen
   darüber — T-195 (b)) und „Zur Todo-Liste" (`navigate("todos")`, ein Weg, den die globale
   Navigation nach A-14 ohnehin jederzeit sichtbar führt). Keiner der beiden verliert etwas.
2. **E-087, und hier nehme ich einen eigenen Satz zurück.** T-195 hat geschrieben: *„Der Auftrag
   nennt deshalb die vier Punkte über ihre **Zeilen**, nicht über ihre Anfänge."* Das war vor dem
   Nachtrag zu E-087 vom selben Tag und ist damit überholt — **gesucht wird über den Wortlaut,
   nicht über die Zeile.** Der Auftrag nennt die vier Punkte deshalb über ihren **vollständigen
   Wortlaut**, so wie er in der Tabelle oben zitiert ist. Die Falle bleibt dieselbe und ist damit
   ebenso entschärft: `tests/e2e/done-movement-announcement.spec.ts` hält
   *„Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen."* — ein
   **anderer** Satz aus dem Toast der Todo-Liste, der mit der Karte nichts zu tun hat und
   unberührt bleibt. Wer über den Anfang „Der Status bleibt" streicht, faßt ihn an; wer über den
   vollen Punkt streicht, nicht.

**Restposten:** Nach dem Fall der Karte steht der Absatz „Herkunft der Spalten" im Handbuch als
einziger Träger einer Aussage, die im Produkt nirgends mehr steht. **Mit SP-22 ist das erledigt —
siehe Z-60.**

### 4.2 Z-55 — der Fristabsatz: beschreibend statt zitierend, **und das ist die richtige Bauart**

Documenter hat den Hinweistext des Fristfeldes im Add-in **nicht zitiert**, weil integration-dev
ihn in derselben Welle auf die Sie-Form umstellt, und statt dessen beschrieben, was das Feld tut.
**Freigegeben, und ausdrücklich als Vorbild.** Ein Handbuch, das einen Wortlaut abschreibt, den
ein anderer Agent gerade ändert, ist genau die Abschrift ohne die Möglichkeit, rot zu werden, vor
der E-063 Punkt 5 und E-087 warnen — nur in einer Datei, die kein Prüflauf je liest.

**Gegen die Anforderungen geprüft:** Der Absatz sagt, die Frist lasse sich beim Anlegen eines
neuen Todos setzen, Takt suche sie nicht in der E-Mail (*„Anders als die Call-Nummer sucht Takt sie
nicht automatisch in der E-Mail: Sie bleibt leer, bis man sie selbst einträgt."*), sie sei ein Tag
ohne Uhrzeit, und ein leeres Feld bedeute keine Frist. Das deckt sich mit A-19.1 ff. und mit
`CLAUDE.md` (*„Die Frist ist **ein Tag**, keine Uhrzeit"*, *„In der Oberfläche heißt sie
ausschließlich **„Frist"**"*) — der Absatz nennt sie durchgehend „Frist". Er behauptet nichts über
Anhänge; die Grenze *„Über das Add-in entstehen keine Anhänge"* bleibt unangetastet.

**Eine Auflage, an integration-dev, nicht an documenter:** Ändert die laufende Umstellung mehr als
die Anrede — Reihenfolge, Bedingungen oder Sichtbarkeit des Feldes —, ist dieser Absatz erneut
vorzulegen. Documenter hat dieses Risiko selbst benannt; ich hänge es hier an die Stelle, an der
es entsteht.

---

## 5. Die Pflichtklickpfade, soweit dieser Bericht sie berührt

| Pfad | Stand |
|---|---|
| **Timer auf erledigtem Todo** | Berührt von **Z-50**: Der Wechseldialog („Es läuft bereits ein Timer") ist derselbe Vorgang wie der Stopp und trägt den E-034-Hinweis nicht. Die Aufhebung von „Erledigt" selbst ist unberührt — auch von **Z-54**: `done-movement-announcement.spec.ts` bleibt zeichengleich |
| **Exportstatus an jeder Stelle sichtbar** | Berührt von **Z-49** und seiner Fassung (**Z-56 bis Z-58**) sowie von **Z-59** (Fokus). Berührt von **Z-53** Punkt 6: die Begründung der gesperrten Exportschaltfläche wird nicht angesagt |
| **Todo-Notiz nie im Export, Buchungsnotiz sichtbar** | Berührt von **Z-47** und **Z-48**, und die Trennung bleibt in beiden **unangetastet**: Gestrichen wird eine Pflicht, die kein Aufrufer setzt; die sechs Unterscheidungsmerkmale, das Banner, die Marke und `help` bleiben zeichengleich. SP-09 ist nicht Gegenstand dieser Aufgabe (Stand unverändert Z-35: security-checker steht aus) |
| **Vier Ebenen tiefer Ordnerbaum, Selbstverschiebung** | Berührt von **Z-53** Punkt 2: Die Absage der Selbstverschiebung beim Ziehen ist heute stumm. Die Absage selbst ist da und richtig |
| **Standard-Tags auf jedem Erstellungsweg** | Unberührt. Auch von **Z-54** nicht: Der Kartenfall nimmt keinen Erstellungsweg mit |
| **Vorlageneditor mit Vorschau auf offene Buchungen** | Berührt von **Z-53** Punkt 6 (`TemplateSaveError`), von **Z-57** (`TemplatePreview.tsx` führt denselben Knopf und dieselbe Absendefunktion) und von **Z-59** (dort in der milderen Fassung) |

---

## 6. Befunde in Kurzform

```
Z-47  Todo/Buchung, Notizfelder      Abweichung: `NoteField.required` hat keine Anforderungs-ID
      A-7.1, A-7.3, E-034, SP-08     und widerspricht für die Leistung E-034 („Eine Tagesgruppe
                                     ohne Leistungstext ist nicht exportierbar" — nicht: das Feld
                                     ist Pflicht). Kein Produktaufrufer setzt sie; nur
                                     showcase/NotesSection.tsx.
                                     Vorschlag: ersatzlos entfernen, samt der Vorführung auf der
                                     Musterseite. E-087 gemessen: weder „(Pflichtfeld)" aus
                                     NoteField noch der Fehlertext der Musterseite kommt in
                                     tests/** oder apps/*/test/** vor. frontend-dev geht allein.

Z-48  Todo/Buchung, Notizfelder      Abweichung: keine. `NoteField.error` ist weder toter Zweig
      A-7.3, A-7.4, E-034            noch Lücke: Die einzige Bedingung, die es für die Leistung
                                     gibt, ist die der TAGESGRUPPE (E-034), und die kann kein
                                     Feld wahrheitsgemäß tragen — eine leere Buchung ist kein
                                     Fehler, solange eine andere Buchung derselben Gruppe Text
                                     hat.
                                     Vorschlag: `error` bleibt (Kanal für eine Absage des
                                     Dienstes; textSchema=20000 gegen maxLength=65536, O-AX). Ein
                                     Satz an der Eigenschaft sagt, welche Sorte Meldung hierher
                                     gehört und welche nicht. E-087: `.note__live[role="alert"]`
                                     wird von timer-stop-announcement.spec.ts und docs/testplan.md
                                     gehalten — ein Entfernen ginge rot.

Z-49  Export > Leistung nachtragen   Abweichung: Der Weg, den E-034 als Ausgleich verspricht („der
      A-8.6, A-13.5, E-034, I-11     Benutzer kann den Text direkt dort nachtragen"), endet bei
                                     leer gelassener Leistung in toasts.success("Buchung
                                     geändert.", "Die Tagesgruppe dieses Todos ändert sich mit.")
                                     — einer Erfolgsmeldung für eine Handlung, die ihren Zweck
                                     nicht erreicht hat, während die Sperrmeldung unverändert
                                     (und damit ohne neue Ansage) steht.
                                     Vorschlag: ERLEDIGT durch die Fassung in textbestand.md
                                     Abschnitt 12; mein eigener Wortlautvorschlag ist mit Z-56
                                     zurückgezogen.

Z-50  Timer wechseln                 Abweichung: Der Dialog „Es läuft bereits ein Timer" beendet
      A-7.3, E-034, I-04             dieselbe Buchung wie der Stopp und trägt als einziger der
                                     drei Ausgänge BILLING_NOTE_MAY_BE_EMPTY nicht. Das Produkt
                                     verbietet sich das selbst: „Ein Hinweis, der nur an einem
                                     der beiden Ausgänge stünde, wäre derselbe Fehler eine Ebene
                                     tiefer" (BookingDialogs.tsx).
                                     Vorschlag: denselben Satz aus lib/labels.ts unter das Feld.
                                     Kein neuer Text.

Z-51  zehn Dialoge, Pflichtmeldungen Abweichung: `touchedOnBlur` liefert für ein vorbelegtes,
      P-8, SC 3.3.1, E-087           unberührtes Feld `true` und schweigt nur, weil neun ferne
                                     Aufrufstellen zusätzlich einen getrimmt leeren Wert
                                     verlangen. Der Fall ist real: TemplatesScreen belegt mit
                                     „Kopie von …" vor.
                                     Vorschlag: P-8 bleibt wörtlich; die Funktion bekommt den
                                     trim auf der zweiten Hälfte (`edited || value.trim().length
                                     > 0`). Ändert heute kein Verhalten, nimmt der Regel die
                                     ferne Abhängigkeit. Der Einwand des Dateikopfs gegen trim
                                     ist mit der Schärfung aus T-186 entfallen — wer tippt, setzt
                                     `edited`. Ein Kommentar daneben ist die schwächere Antwort
                                     und wird nicht empfohlen. AUFLAGE, blockierend: touched.ts
                                     und touched.test.ts in einem Auftrag.

Z-52  Prüffall zu P-8                Abweichung: apps/web/test/lib/touched.test.ts führt „ein
      P-8, E-087                     Leerzeichen ist eine Eingabe" und setzt darin `edited =
                                     false` — die Daten bauen das Gegenteil des Namens. Es ist
                                     der einzige Fall, der die zweite Hälfte der Regel mißt.
                                     Vorschlag: zwei Fälle statt einem — (" ", true) → true und
                                     (" ", false) → false. Mit Z-51 in einem Auftrag,
                                     unit-tester.

Z-53  42 Meldebausteine              Abweichung: dieselbe Bauart wie O-DA/O-FX eine Ebene höher.
      A-13.5, B-5, SC 4.1.3          Sortenurteil: InlineMessage danger/warning als Folge einer
                                     Handlung auf stehender Fläche = Wirt. InlineMessage info,
                                     die von Anfang an dasteht = kein Wirt. LoadingBlock = kein
                                     Wirt (Rolle trägt er selbst; der Wirt gehört an das
                                     Ergebnis, nicht an das Warten). UpdateNotice geteilt: der
                                     Startdialog nimmt den Fokus und ist angesagt, die
                                     Sitzungsleiste (`role="status"` entsteht mit ihrem Inhalt,
                                     ohne jede Handlung) braucht einen Wirt. Musterseite: kein
                                     Wirt — 30 der 76 Vorkommen stehen dort.
                                     Reihenfolge: (1) FormDialog-Fehlerfläche — ein Knoten, jeder
                                     Dialog, vier Pflichtklickpfade, heute nur scrollIntoView;
                                     (2) TagsScreen „Das Verschieben hat nicht geklappt" — das
                                     Ziehen hat keinen Dialog, hier landet die Absage der
                                     Selbstverschiebung; (3) TodoDetailScreen „Der Vermerk wurde
                                     nicht gespeichert" (dazu O-AX); (4) SettingsScreen, drei
                                     Stellen, darunter die einmalige Tokenmeldung; (5)
                                     UpdateNotice-Sitzungsleiste; (6) ExportScreen, die
                                     Begründung der gesperrten Exportschaltfläche.
                                     Nachrangig: was ein Toast schon ansagt (ToastContext hat den
                                     dauerhaften Wirt), die LoadingBlocks, die Musterseite.

Z-53a die Bauart des Wirts           Abweichung: BLOCKIEREND, vor der ersten der 42.
      B-5, SC 4.1.3, E-063 Punkt 5   `InlineMessage` trägt seine Rolle selbst (role=alert bei
                                     danger, sonst status). Ein dauerhafter Wirt MIT Rolle
                                     darüber ergibt eine Live-Region in einer Live-Region —
                                     doppelte Ansage. Die zehn Stellen aus T-191 haben das
                                     Problem nicht, weil dort rollenlose <p> im Wirt hängen.
                                     Vorschlag: einmal festlegen (Vorschlag: ein Slot, der den
                                     Wirt mit der Rolle stellt und InlineMessage darin rollenlos
                                     zeichnet), dann bauen. Sonst stehen am Ende zwei Fassungen
                                     desselben Wirts — die Klasse, die in diesen Wellen viermal
                                     danebengegangen ist.

Z-54  Board > Leerzustand (UM-08)    Abweichung: keine mehr. Die Vorbedingung aus textbestand.md
      A-5.4, A-13.2, E-054, E-081-4  („Der Absatz steht im Handbuch, BEVOR die Karte
                                     verschwindet") ist mit T-201 erfüllt; alle vier
                                     Kartenpunkte sind gedeckt — zwei im Handbuch („Herkunft der
                                     Spalten"), einer im Leerzustand, einer im Board-Lead, der
                                     Verweisteil in TodoFormDialog. Der Konjunktiv trägt.
                                     Vorschlag: FREIGEGEBEN — die Karte „Was sich geändert hat"
                                     fällt, mit beiden Knöpfen. Auflagen: (1) „Erste Spalte
                                     einrichten" ist derselbe Aufruf wie im Leerzustand, „Zur
                                     Todo-Liste" führt die globale Navigation ohnehin; (2)
                                     gestrichen wird über den VOLLEN Wortlaut der vier Punkte,
                                     nicht über Zeilen (E-087 Punkt 4 — mein eigener
                                     gegenteiliger Satz aus T-195 ist zurückgenommen) und nicht
                                     über den Anfang „Der Status bleibt", der in
                                     done-movement-announcement.spec.ts einen ANDEREN Satz trifft.

Z-55  Add-in > Frist (Handbuch)      Abweichung: keine. Der Absatz beschreibt das Feld, statt
      A-19.1 ff., E-063-5, E-080     einen Wortlaut zu zitieren, den integration-dev gerade
                                     umstellt. Geprüft gegen A-19: ein Tag ohne Uhrzeit, keine
                                     Erkennung aus der E-Mail, leeres Feld = keine Frist, Name
                                     durchgehend „Frist".
                                     Vorschlag: FREIGEGEBEN, und als Bauart empfohlen. Auflage an
                                     integration-dev: Ändert die Umstellung mehr als die Anrede,
                                     ist der Absatz erneut vorzulegen.

Z-56  Export > Leistung nachtragen   Abweichung: MEIN eigener Vorschlag aus Z-49. „An den Wert
      E-034, A-8.6, E-078 Punkt 3    gebunden" sagt „Die Tagesgruppe geht damit nicht in den
                                     Export" auch dann, wenn eine ANDERE Buchung der Gruppe Text
                                     trägt — dann ist der Satz falsch, und zwar im Fall, den
                                     E-034 gerade schützt. Er behauptet außerdem Wissen, das die
                                     Anwendung nicht immer hat (L3).
                                     Vorschlag: ANGENOMMEN, was ux-designer daraus gemacht hat.
                                     Die Bindung an die Tagesgruppe ist nicht seine Vorliebe,
                                     sondern meine eigene Begründung aus Z-48, eine Ebene weiter.
                                     Mein Wortlaut ist zurückgezogen.

Z-57  Vier Lagen, drei Fassungen     Abweichung: keine. „Buchung geändert — noch nicht
      A-8.6, A-13.5, E-034, S-13     abrechenbar." trägt L2: Es sagt, was geschehen ist, nennt
                                     die Abwesenheit ohne Pflicht, meidet „gesperrt" (in A-6.9/
                                     SP-17 für exportierte Buchungen vergeben — NoteField führt
                                     dafür „gesperrt" im Banner) und bleibt `warning`. Die
                                     Erkennung über loadDayGroupInsight ist am Baum geprüft: der
                                     catch-Zweig liefert `blockedReason: null` MIT
                                     `previewProblem` — die Prüfreihenfolge aus AK 2 ist damit
                                     tragend und nicht Geschmack.
                                     Vorschlag: FREIGEGEBEN mit zwei Auflagen — (a) L3 nimmt die
                                     Worte des Stoppdialogs oder das Papier sagt, warum nicht;
                                     (b) das Verhalten ohne eingerichteten Export ist zu
                                     bedenken: dort wirft die Vorschau, L3 wird zum Regelfall,
                                     jetzt an fünf statt an einer Fläche.

Z-58  Der Rumpf von L2               Abweichung: „zeichengleich der Rumpf des Stoppdialogs" ist
      C-24, M-02, E-063 Punkt 5      ungenau. Gemessen lautet der Rumpf des Stopps
                                     `${booked} Für diesen Tag steht …`, also mit dem Vorsatz
                                     „Gebucht: 1 h 20 min." davor. Zeichengleich sind die ZWEI
                                     SÄTZE danach, nicht der Rumpf.
                                     Vorschlag: Der Baustein in lib/labels.ts ist genau dieses
                                     Satzpaar mit den Sekunden als Parameter; „Gebucht: …" bleibt
                                     beim Stopp und wandert nicht mit. AK 7 sagt bereits das
                                     Richtige — diese Zeile verhindert, daß beim Bau die falsche
                                     Hälfte wandert.

Z-59  Export > Leistung nachtragen   Abweichung: BLOCKIEREND für denselben Auftrag.
      SC 2.4.3, SC 2.4.6, A-8.6      ExportGroups.tsx schaltet über `entry.note === ""` zwischen
                                     <Button>Leistung nachtragen</Button> und <IconButton/> um —
                                     zwei Bausteine an einer Stelle, umgeschaltet durch den Wert,
                                     den der Benutzer soeben einträgt. DialogSurface merkt sich
                                     `document.activeElement` beim Öffnen und reicht ihn als
                                     `finalFocusEl`; `recoverFocus` deckt Knoten INNERHALB des
                                     Dialogs ab, nicht den Auslöser außerhalb. Gelingt das
                                     Nachtragen, ist das Rückkehrziel abgehängt.
                                     Vorschlag: Messung durch e2e-tester an BEIDEN Flächen
                                     (ExportGroups: Austausch; TemplatePreview: Beschriftungs-
                                     wechsel). Zusätzliche Bedingung an beide Auswege des
                                     ui-designer: der zugängliche Name muß den Zeilenbezug
                                     behalten — heute trägt ihn nur der IconButton-Zweig
                                     („Leistung der Buchung 09:00–10:20 bearbeiten"), die
                                     Fassung aus TemplatePreview („Bearbeiten") trägt ihn nicht
                                     und ist deshalb nicht einfach übertragbar.

Z-60  SP-22 / Sorte T3-A             Abweichung: keine, und die Sorte ist besser als meine
      E-081 Punkt 4, T-195           Offene Frage 4. Angenommen.
                                     Vorschlag: eine Auflage zur zweiten Pflichtangabe — sie
                                     verlangt „das Datum ihres Falls", und die Karte ist noch
                                     nicht gefallen. Der Auftrag zu Z-54 trägt das Nachtragen
                                     dieses Datums in SP-22 mit (E-081 Punkt 4); bis dahin sagt
                                     der Eintrag, daß der Fall aussteht. Sonst liest ihn in drei
                                     Wochen jemand als erledigt und findet die Karte noch vor.
```

---

## 7. Urteil

**Nacharbeit.** Blockierend: die **Auflage aus Z-51** (eine Datei und ihr Prüffall in einem
Auftrag), **Z-53a** (die Bauart des Wirts vor der ersten der 42) und **Z-59** (der Fokus im
Nachtragsweg, blockierend für denselben Auftrag wie O-HX).

**Z-49 ist nicht mehr blockierend:** Die Fassung liegt vor und ist mit Z-56 bis Z-58 freigegeben.

Freigegeben und ohne Vorbedingung baubar: **Z-47** (frontend-dev allein, E-087 gemessen),
**Z-50** (frontend-dev allein, kein neuer Text), **Z-52** (unit-tester, zusammen mit Z-51),
**Z-54** (frontend-dev allein — die Karte fällt, mit zwei Auflagen), **Z-55** (steht bereits),
**Z-57/Z-58** (frontend-dev, `textbestand.md` Abschnitt 12 als Vorlage, zusammen mit Z-59).

**Z-48 ist eine Feststellung, kein Auftrag:** Der Fehlerpfad bleibt, wo er ist.

---

## 8. Annahmen, Risiken, offene Fragen

**Annahmen.**

1. Ich habe die 42 aus T-191 **nicht** nachgezählt und führe sie als Stand vom 2026-09-05. Meine
   eigene Zahl (76 Vorkommen von `<InlineMessage`, 34 Dateien, davon 30 in `showcase/**`) ist
   heute gemessen und zählt etwas anderes.
2. Daß der modale `UpdateDialog` beim Start durch den Fokuswechsel angesagt wird, ist aus der
   Bauart geschlossen (`DialogSurface`, Fokus hinein), nicht mit einer Vorlesehilfe gemessen.
3. „Deutlich unter der Hälfte" in 3.3 ist eine Folgerung aus der Sortierung, keine Zählung.
4. **Z-54:** Documenters Beweisführung, daß die Bedingung nie zutraf (E-054 fiel vor jeder
   Veröffentlichung, Migration `0010_drop_board_rank` läuft in jeder frischen Einrichtung mit,
   `board_rank` wurde nie von einem Aufrufer gesetzt), habe ich **nicht** gegen den
   Migrationsbestand nachgemessen — das ist domain-devs Fläche. Ich prüfe die Deckung der
   Kartenaussagen, nicht die Migrationsgeschichte.
5. **Z-59:** Der Fokusverlust ist aus der Bauart geschlossen (`DialogSurface` merkt den Auslöser,
   `ExportGroups.tsx` tauscht ihn aus), **nicht** am laufenden Fenster gemessen. Das teile ich mit
   ux-designer, der es ebenso kennzeichnet.

**Risiken.**

- **Z-51 klein, aber real:** `edited || value.trim().length > 0` ändert heute nichts Sichtbares —
  gerade deshalb kann jemand es später als überflüssig zurücknehmen. Der Grund gehört in den
  Dateikopf, und der bisherige Einwand gegen `trim()` gehört dabei berichtigt, nicht ergänzt.
- **Z-53 mittel:** Eine halb umgesetzte Sortierung ist schlechter als keine. Wer die sechs
  vorderen Stellen baut und die Regel nicht aufschreibt, hat sechs Einzelfälle behoben und die
  siebte Stelle wieder frei.
- **Z-57 mittel, und es ist das eine Risiko der neuen Fassung:** Ohne eingerichteten Exportordner
  oder ohne Vorlage wirft `previewExport`; `dayGroup.ts` nennt beide Ursachen im Kommentar
  (*„Ohne Vorlage oder ohne Exportordner gibt es keine Vorschau."*). Dann ist **L3 der Normalfall**
  — heute schon nach jedem Timerstopp, nach dieser Aufgabe zusätzlich nach jeder geänderten
  Buchung an fünf Flächen. Eine Warnung, die im frisch eingerichteten Takt bei jeder Buchung
  erscheint, wird zur Tapete. Die saubere Unterscheidung („nicht eingerichtet" gegen „Abfrage
  fehlgeschlagen") gibt es heute nicht: `previewProblem` ist eine Zeichenkette. Sie herzustellen
  wäre eine Aufgabe an domain-dev/local-api, kein Wortlautproblem.
- **Z-59 mittel:** Wird der Toast gebaut und das Fokusziel nicht, repariert derselbe Auftrag den
  Weg für das Auge und läßt ihn für die Tastatur kaputt.
- **Z-54/Z-60 klein:** Fehlt in SP-22 das Datum des Falls, ist der Eintrag nach seiner eigenen
  Regel unvollständig.

**Offene Fragen.**

1. ~~An den Orchestrator (Z-49): Wortlaut direkt oder über `textbestand.md`?~~ **Beantwortet:** über
   `textbestand.md`, und der zweistufige Weg hat sich in derselben Runde bezahlt gemacht — er hat
   meinen eigenen Vorschlag korrigiert (Z-56).
2. **An ui-designer (Z-53a):** Der Slot mit rollenlosem Innenleben ist ein Eingriff in einen
   Baustein, den 34 Dateien benutzen. Ist das seine Entscheidung oder die des Orchestrators?
3. **An security-checker (unverändert aus Z-35):** SP-09 an `NoteField` wartet weiterhin auf ihn.
4. ~~An ux-designer (Z-54): Sperrlisteneintrag für „Herkunft der Spalten".~~ **Erledigt mit SP-22
   und der Sorte T3-A** (T-203). Es bleibt die Auflage aus Z-60.
5. **An den Orchestrator (Z-57 Risiko):** Soll die Unterscheidung „Export nicht eingerichtet"
   gegen „Vorschau fehlgeschlagen" als eigene Aufgabe aufgenommen werden? Sie betrifft nicht nur
   den Nachtragsweg, sondern auch den Timerstopp, der sie heute schon hat.

---

## 9. Nachtrag vom 2026-09-06, abends — die Fassung des Nachtragswegs (O-HX, Vorlage T-203)

**Gegenstand:** `docs/design/textbestand.md` Abschnitt 12 („Der Ausgang des Nachtragswegs — Fluß
und Wortlaut"), dazu Abschnitt 5.2 und SP-22. Vorgelegt als **Fassung** zu meinem Befund Z-49.
Ich bin hier der **Genehmigende**, nicht der Verfasser (E-078 Punkt 3).

**Was ich am Baum nachgemessen habe, bevor ich urteile** (E-087; alles ohne Zeilenangaben):
`apps/web/src/app/dayGroup.ts` (Gestalt von `DayGroupInsight`, beide Rückgabezweige und der
`catch`), `apps/web/src/app/TimerContext.tsx` (`reportStopped` mit allen fünf Ausgängen),
`apps/web/src/components/ExportGroups.tsx` und `apps/web/src/screens/TemplatePreview.tsx` (die
zwei Bauarten des Nachtragsknopfes), `apps/web/src/components/DialogSurface.tsx` (die
Fokusrückgabe), `apps/web/src/components/NoteField.tsx` (die Belegung des Wortes „gesperrt").

### 9.1 Z-56 — **Er hat recht. Mein Wortlaut fällt.**

**Ja, das ist in meinem Sinn — und zwar nicht als Zugeständnis, sondern weil es meine eigene
Begründung ist.** Z-48 sagt: *„Gesperrt ist die **Tagesgruppe**, nicht die Buchung. Eine einzelne
Buchung ohne Leistung ist tadellos, solange eine andere Buchung derselben Gruppe Text trägt."*
Genau daraus folgt, was ich einen Absatz später selbst nicht gezogen habe: Wenn das Feld die
Aussage nicht tragen kann, dann trägt sie auch ein Toast nicht, der **an denselben Feldwert**
gebunden ist. Der Kanal war eine Ebene höher gewählt, die Bindung nicht.

**Und mein Satz war an zwei von vier Lagen falsch, nicht an einer:**

| Lage | Was mein Satz gesagt hätte | Wahr? |
|---|---|---|
| Gruppe trägt Text aus einer anderen Buchung (L1) | „Die Tagesgruppe geht damit nicht in den Export." | **nein** — sie geht mit |
| Gruppe bleibt ohne Leistung (L2) | dasselbe | ja |
| Takt hat keine Auskunft (L3) | dasselbe | **nein** — er behauptet Wissen, das die Anwendung nicht hat |
| nichts Offenes / Abfrage scheitert (L4) | dasselbe | **nein** |

Das ist derselbe Fehler, den ich beanstandet habe, nur mit umgekehrtem Vorzeichen: heute eine
Erfolgsmeldung für eine mißlungene Handlung, nach meinem Vorschlag eine Warnung für eine gelungene.
**Der zweistufige Weg hat hier genau das geleistet, wofür er da ist**, und ich halte das
ausdrücklich fest, weil es der erste Fall in diesem Projekt ist, in dem er einen Befund des
Prüfers korrigiert hat und nicht umgekehrt.

### 9.2 Z-57 — Die vier Lagen und die drei Fassungen: **freigegeben, mit zwei Auflagen**

**Trägt „Buchung geändert — noch nicht abrechenbar." für L2? Ja.** Vier Gründe, jeder gemessen:

1. **Er bestreitet nichts.** Gespeichert **wurde**; der Titel sagt es zuerst. Eine Fassung wie
   „Speichern nicht möglich" wäre falsch, und „Leistung fehlt" machte aus E-034 eine Pflicht —
   genau das, was Z-47 gerade ausgebaut hat.
2. **„gesperrt" ist belegt, und zwar folgenreich.** `NoteField.tsx` führt für eine bereits
   exportierte Buchung *„Gesperrt, weil die Buchung bereits exportiert ist (A-6.9)"* und zeigt am
   Banner das Wort „gesperrt". Dasselbe Wort für „noch nicht abrechenbar" hieße, zwei entgegen-
   gesetzte Zustände — abgerechnet und noch nicht abrechenbar — gleich zu benennen. Sein SP-17-
   Argument trägt.
3. **„abrechenbar" ist kein neues Wort, sondern das des Stoppdialogs.** `TimerContext.tsx` sagt in
   derselben Lage *„… — aber noch nicht abrechenbar."* Zwei Titel mit demselben tragenden Wort und
   verschiedenem Anlaß ist die richtige Aufteilung.
4. **Ton `warning`, nirgends `danger`.** `toasts.failure` bleibt der nicht erfolgten Speicherung.
   Das ist die Linie, die `ToastContext.tsx` ohnehin führt (`role="alert"` nur für Fehler).

**Trägt die Bindung an die Gruppe? Ja, und sie ist verpflichtend, nicht vorzugsweise.** Die
Erkennung läuft über `loadDayGroupInsight`, und der Aufruf fragt die **Vorschau**, also denselben
Plan wie der Lauf (R-17). Damit kommt die Auskunft aus derselben Rechnung, die den Export
tatsächlich sperrt — nicht aus einer Ableitung der Oberfläche. Der Aufruf ist gebaut, in
`BookingDialogs.tsx` bereits importiert und wird in `TimerContext.tsx#reportStopped` seit T-045
für **genau diese Frage** benutzt. Es entsteht keine neue Bauart.

**Trägt L3 — die Lage, in der Takt es nicht weiß? Ja, und sie ist der wichtigste der vier
Zweige.** Ich habe die tragende Behauptung nachgemessen: `dayGroup.ts` liefert im `catch`

```
{ …, quarters: null, blockedReason: null, previewProblem: errorMessage(cause) }
```

— also **`blockedReason: null` mit einer Meldung daneben**. Wer nur `blockedReason !== null` prüft,
hält eine unbeantwortete Frage für „alles gut". Die Prüfreihenfolge aus AK 2 (`previewProblem` vor
`blockedReason`) ist damit **kein Stilpunkt, sondern die Stelle, an der der heutige Fehler eine
Ebene tiefer neu entstünde**. Der Dateikopf von `dayGroup.ts` sagt es für den Vorgänger dieses
Fehlers selbst: *„Der Aufrufer konnte die beiden Faelle nicht unterscheiden und hat den zweiten
behauptet."* Ux-designers Vorhersage — dies sei der Zweig, den jemand wegoptimieren wird — teile
ich; sie ist der Grund, warum AK 2 und AK 5 als **Bedingungen** und nicht als Hinweise stehen.

**Auflage 1 — L3 nimmt die Worte des Stoppdialogs, oder das Papier sagt, warum nicht.** In
derselben Lage sagt der Stopp heute *„… — der Exportwert ließ sich nicht abfragen."*, die Vorlage
sagt *„Buchung geändert — Exportwert unbekannt."* Bei L2 wird der Wortlaut ausdrücklich
zusammengeführt, bei L3 nicht — ohne daß der Unterschied begründet wäre. **Ein Zustand, zwei
Formulierungen** ist die Klasse, die diese Wellen viermal gekostet hat. Ich schreibe den Wortlaut
nicht vor (das wäre Verfassen); ich verlange, daß die Vorlage entweder angleicht oder den
Unterschied begründet.

**Auflage 2 — die Lage ohne eingerichteten Export ist vor dem Bau zu bedenken.** `dayGroup.ts`
nennt die zwei Ursachen des Wurfs selbst: *„Ohne Vorlage oder ohne Exportordner gibt es keine
Vorschau."* In einem frisch eingerichteten Takt ist L3 damit nicht die Ausnahme, sondern der
Regelfall — bisher nach jedem Timerstopp, künftig zusätzlich nach jeder geänderten Buchung an
fünf Flächen. Das ist kein Einwand gegen die Fassung (sie sagt Wahres), aber es ist der Weg, auf
dem eine Warnung zur Tapete wird. Die saubere Trennung „nicht eingerichtet" gegen „Abfrage
fehlgeschlagen" gibt es heute nicht; sie wäre eine Aufgabe an domain-dev/local-api. **Bis dahin
wird gebaut wie vorgelegt** — Gleichlauf mit dem Stopp ist besser als eine zweite Sonderregel.

**Was ich ausdrücklich mittrage, ohne es verlangt zu haben:**

- **AK 1 — die Lage kommt vom neuen Anfangszeitpunkt.** Wer eine Buchung über Mitternacht
  verschiebt, wechselt die Gruppe; die Auskunft muß die Gruppe betreffen, in der die Buchung
  **jetzt** liegt. Das hätte ich übersehen.
- **AK 6 — der Dialog wartet nicht auf die Auskunft.** Erst schließen und den Fokus zurückgeben,
  dann fragen. Sonst steht ein Dialog offen, weil eine Meldung noch rechnet — und die Fokusfrage
  aus Z-59 würde dadurch nur verdeckt, nicht gelöst.
- **12.4, kein Rückweg im Toast, keine Regel im Toast.** Beides richtig: Der Rückweg steht an der
  Zeile, die Regel steht zweimal auf demselben Weg.
- **12.4, der Dialog bekommt keinen zusätzlichen Satz.** Meine Anmerkung, der Dialog nenne seinen
  Anlaß nicht, ist damit **beantwortet und nicht übergangen**: An vier der fünf Aufrufstellen wäre
  der Satz **V**. Ich nehme die Anmerkung zurück; sie war eine Beobachtung, keine Forderung.

### 9.3 Z-58 — eine Genauigkeit, bevor jemand baut

Die Vorlage sagt: *„Der Rumpf von L2 ist zeichengleich der Rumpf des Stoppdialogs."* **Gemessen
ist der Rumpf des Stopps mehr als das Satzpaar** — er lautet `${booked} Für diesen Tag steht auf
diesem Todo noch keine Leistung. …`, also mit *„Gebucht: 1 h 20 min."* davor. Zeichengleich sind
die **zwei Sätze danach**.

AK 7 sagt bereits das Richtige (der Satz wandert „als Textbaustein mit der Sekundenzahl als
Parameter"), und beide Seiten holen dieselbe Zahl aus derselben Quelle (`insight.seconds`, im
gesperrten Zweig aus `skipped.group.seconds`). **Auflage:** Der Baustein ist genau das Satzpaar;
`Gebucht: …` bleibt beim Stopp und wandert nicht mit, und der Stopptoast bleibt im übrigen
zeichengleich. Ohne diese Zeile wandert beim Bau die falsche Hälfte, und der Stopp verliert seine
Dauerangabe — eine Änderung, die niemand beauftragt hat und die niemandem auffiele.

### 9.4 Z-59 — der Fokusbefund: **bestätigt, und blockierend für denselben Auftrag**

**Der Befund stimmt, und die Bauart erklärt ihn vollständig.** `DialogSurface.tsx` beschreibt
seine eigene Lösung wörtlich: Im `useLayoutEffect` beim Öffnen wird *„`document.activeElement`
gemerkt und über `finalFocusEl` an die Fokusfalle gereicht"*. `recoverFocus` fängt Knoten ab, die
**innerhalb** des Dialogs verschwinden (der Dateikopf nennt beide gemessenen Fälle). Der Auslöser
liegt außerhalb. Wird er ausgetauscht, während der Dialog steht, zeigt `finalFocusEl` auf einen
abgehängten Knoten, und der Fokus fällt auf `<body>`.

Und ausgetauscht wird er: `ExportGroups.tsx` schaltet über `entry.note === ""` zwischen `Button`
und `IconButton` um — **zwei verschiedene Bausteine an derselben Stelle, umgeschaltet durch genau
den Wert, den der Benutzer soeben eingetragen hat.** Gelingt das Nachtragen, ist das Rückkehrziel
weg. Das ist die Klasse aus O-CY-2, und sie sitzt im Pflichtklickpfad „Exportstatus an jeder
Stelle sichtbar".

**Blockierend, aber eng:** blockierend **für denselben Auftrag** wie O-HX, nicht für die Welle.
Der Grund ist die Zusammensetzung: Ein Auftrag, der den Nachtragsweg für das Auge repariert und
ihn für die Tastatur kaputt läßt, hat den Pflichtklickpfad halb geschlossen und wird als
geschlossen gebucht.

**Zur Messung** (e2e-tester): einverstanden, und an **beiden** Flächen, weil sie sich
unterscheiden — `ExportGroups.tsx` tauscht den Baustein, `TemplatePreview.tsx` wechselt nur die
Beschriftung (`{entry.note.trim().length === 0 ? "Leistung nachtragen" : "Bearbeiten"}`). Gemessen
wird `document.activeElement` nach dem Speichern; steht er auf `body`, ist der Befund belegt.

**Eine zusätzliche Bedingung an beide Auswege, die ux-designer dem ui-designer offenläßt.** Der
zugängliche Name muß **den Zeilenbezug behalten**. Heute trägt ihn nur der IconButton-Zweig
(`Leistung der Buchung 09:00–10:20 bearbeiten`); der Button-Zweig heißt in beiden Dateien schlicht
„Leistung nachtragen", und in `TemplatePreview.tsx` heißt er danach schlicht „Bearbeiten" — in
einer Liste mehrerer Buchungen sind das mehrere Bedienelemente mit demselben Namen (SC 2.4.6,
X-04, Z-10). **Die Fassung aus `TemplatePreview.tsx` ist deshalb nicht einfach übertragbar**: Wer
Ausweg 1 wählt, muß den Zeilenbezug in **beide** Beschriftungen nehmen, nicht aus dem Vorbild
übernehmen, was dort ohnehin fehlt. Das ist kein neuer Auftrag, sondern eine Bedingung an den
bestehenden.

**Die zwei Nachbarbefunde aus 12.6 teile ich in der Einordnung:** (a) derselbe Knopfname mit zwei
Entfernungen zum Ziel ist ein Fluß-, kein Wortlautbefund und gehört mit dem Ergebnisblock
entschieden; (b) der Anlegen-Zweig sagt nichts **Falsches** und ist deshalb nicht blockierend —
er bleibt aber dieselbe Handlung mit zwei Antworten. Beide gehören auf das Board, nicht in diesen
Auftrag. Dasselbe gilt für (c) aus 12.8: `TodoDetailScreen.tsx` sagt beim **Löschen** der letzten
Buchung mit Leistung denselben Satz und hinterläßt eine gesperrte Gruppe.

### 9.5 Z-60 — SP-22 und die Sorte „Alleinträger nach Fall": **angenommen**, mit einer Auflage

**Die Sorte ist besser als meine Offene Frage 4.** Ich hatte einen Sperrlisteneintrag verlangt;
T-203 hat daraus eine **Regel** gemacht — *„Wird eine Aussage von zwei Trägern auf einen
zurückgeführt, kommt der verbliebene Träger auf die Sperrliste. Der Eintrag entsteht **mit der
Freigabe der Streichung**, nicht mit ihrem Bau."* Damit ist die Bewegung, die T-195 als Fehlerart
beschrieben hat (eine Welle halbiert eine Freigabe, und danach sehen beide Listen vollständig
aus), benannt statt vermieden.

Besonders trage ich mit: **Pflichtangabe 3 — gesperrt ist die Aussage, nicht der Wortlaut.** Ein
Handbuchabsatz, der zeichengleich einzufrieren wäre, wäre nach dem ersten Sprachdurchgang ein
Ärgernis; gesperrt gehören die zwei Auskünfte, und die stehen benannt da. Und **Pflichtangabe 1 —
zwei Vorlagen, Prüfer und Hoheitsinhaber**: richtig, denn ein Handbuchdurchgang liest die
Sperrliste in `docs/design/textbestand.md` heute nicht.

**Auflage, klein, aber sie folgt aus der Regel selbst.** Pflichtangabe 2 verlangt *„die gefallene
Fläche und das Datum ihres Falls"* — und ergänzt: *„Fehlt sie, ist der Eintrag eine Behauptung."*
Die Fläche steht, das Datum kann heute nicht stehen: Die Karte ist **noch nicht gefallen** (Z-54
ist die Freigabe, nicht der Bau). Der Eintrag ist damit nach seiner eigenen Regel bis auf weiteres
unvollständig. **Daraus:** Der Auftrag, der die Karte streicht, trägt das Nachtragen des Datums in
SP-22 mit — in **demselben** Auftrag (E-081 Punkt 4), und die Zeile sagt bis dahin ausdrücklich,
daß der Fall aussteht. Sonst liest sie in drei Wochen jemand als erledigt, findet die Karte noch
vor und hält die Liste für falsch.
