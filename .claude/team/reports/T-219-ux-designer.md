# T-219 — Der Fehlertext des Musterblocks, und eine Wiedervorlage, die einen Auslöser bekommt

**Aufgabe:** T-219, Welle AG. **Rolle:** ux-designer. **Dateihoheit in diesem Auftrag:**
`docs/design/textbestand.md` und diese Berichtsdatei. **Kein Produktivcode angefaßt.**

---

## 1. Was beauftragt war, und was daraus geworden ist

| # | Auftrag | Ergebnis |
|---|---|---|
| 1 | **O-IY** — der Fehlertext für den Musterblock von `NoteField` | **Abschnitt 14** in `textbestand.md`, neu. Wortlaut, sieben verworfene Fassungen, drei Angaben am Block, acht Akzeptanzkriterien |
| 2 | **O-IV** — die Wiedervorlage aus 12.9, die niemand auslöst | **12.9 berichtigt.** Neuer Anker: **O-II**. Die Bedingung ist in einem Blick prüfbar. Dazu zwei Sätze für das Board in **14.9** |
| 3 | zur Kenntnis (Freigabe des Nachtragswegs, E-091, Falldatum, die Suchregel) | zur Kenntnis genommen; SP-22 trägt das Datum bereits und ist in T-211 gegengemessen. **Nichts nachzuziehen** |

Zusätzlich, nicht beauftragt, aber aus derselben Messung entstanden: **eine Berichtigung an 12.10**,
also an einem Abschnitt, den spec-ux-reviewer mit Z-57 Auflage 2 **freigegeben** hat. Begründung in
Abschnitt 4 dieses Berichts.

---

## 2. O-IY — der Satz

> **Leistung: länger, als der Dienst annimmt.**

39 Zeichen. Ein Satz, mit Punkt. Form aus **P-5** (`„<Feldbeschriftung>: <Regel>."`), erstes Wort
ist die Feldbeschriftung (**P-2**), Länge unter der Grenze aus **P-1** (60 Zeichen für die
Grundform).

**Warum dieser und kein anderer — die drei Bedingungen des Auftrags, je in einem Satz:**

1. **Er zeigt, was der Baustein wirklich kann.** Er ist eine Absage **des Dienstes** an **diesem**
   Text: Er nennt den Absagenden und die eine verletzte Regel. Die Regel ist gemessen und nicht
   erfunden — `textSchema` ist `z.string().max(20_000)` und ist die **einzige** Regel, die die Tür
   auf Leistung und Vermerk anwendet (anders als `titleSchema`/`nameSchema` trägt sie **keine**
   Zeichenprüfung).
2. **Er klingt nicht nach Pflichtfeld — und zwar strukturell.** Er spricht von **zuviel**, nicht von
   zuwenig. „fehlt", „erforderlich", „Pflichtfeld" kommen nicht vor, und keine Umformulierung führt
   dorthin zurück. Das war mein Auswahlkriterium: An dieser Verwechslung ist in dieser Sitzung schon
   ein Wortlaut gescheitert, also habe ich eine Regel gesucht, bei der sie nicht vermieden, sondern
   **ausgeschlossen** ist.
3. **Er ist gefahrlos abzuschreiben.** Er trägt **keine Zahl**. „Leistung: mehr als 20 000 Zeichen."
   wäre die Abschrift einer Konstanten der Tür auf der Seite, von der abgeschrieben wird — genau die
   Doppelung, die T-128 beseitigt hat und die E-063 Punkt 4 verbietet.

**Der Musterblock ändert sich an drei weiteren Stellen mit** (Abschnitt 14.5), sonst ist er nach dem
Schnitt wieder widersprüchlich — ein Satz über einen zu langen Wert an einem **leeren** Feld mit
einem Zähler auf „0 / 500":

1. **gefüllter Vorführwert** statt `emptyBilling` (Vorschlagstext steht in 14.5),
2. **kein `maxLength`** in diesem Block — jede Zahl im Zähler widerspricht entweder dem Satz oder
   erzeugt einen ungezeichneten Überlaufzustand. Der Block „gesperrt" daneben führt den Zähler
   ebenfalls nicht; die Bauart ist also die vorhandene,
3. **Zustandsname „Absage des Dienstes an diesem Text"** statt „Fehlerzustand".
   Kein neues Vokabular: `showcase/InventorySection.tsx` führt „nach Absage des Dienstes" bereits.

**Ausdrücklich nicht mit zu ändern:** der Zustandsname „fehlerhaft" in der Bausteinliste. Er benennt
den sichtbaren Zustand (`note--invalid`, `aria-invalid`), nicht den Kanal — ihn zu verengen machte
den Baustein enger, als 14.6 ihn beschreibt.

**Der Satz an `error` selbst (Auflage aus Z-48)** steht als Inhalt in 14.6, in zwei Aussagen:
`error` trägt die Absage an *diesem Text*; `error` trägt **nicht** die Bedingung der Tagesgruppe
(E-034) — die gilt der Gruppe, steht als Hinweis daneben (`BILLING_NOTE_MAY_BE_EMPTY`, SP-08) und
kann von einem Feld gar nicht wahrheitsgemäß getragen werden.

---

## 3. O-IV — die Wiedervorlage hängt neu

**Der Fehler war meiner.** Die Wiedervorlage in 12.9 hing an **T-200 Offene Frage 5** — einer Frage
an den Orchestrator, die nicht beantwortet ist und nicht auf dem Board steht. Ich habe in 12.10 das
Wort „später" gerügt und eine Zeile weiter selbst ein „später mit Fußnote" gebaut.

**Neuer Anker: O-II** (`dayGroup.ts` liefert im Fehlerfall keinen Grund — frontend-dev, auf dem
Board). Kein Behelf, sondern der Ort selbst: L3 wird an `previewProblem` erkannt, und
`previewProblem` entsteht in dieser Datei. **Wer den Nachtragsweg baut, öffnet `dayGroup.ts`.**

**Die Bedingung, in einem Blick prüfbar:**

> Die Wiedervorlage fällt an, **sobald `previewProblem` mehr trägt als eine Zeichenkette**. Solange
> dort `errorMessage(cause)` steht und sonst nichts, kann keine Fläche die zwei Lagen unterscheiden,
> und die angeglichene Fassung bleibt richtig.

**Und sie ist kleiner, als 12.10 sie aussehen ließ.** `apps/web/src/api/client.ts` führt neben
`errorMessage` bereits `errorCode` und nennt ihn im Kommentar *„die einzige Größe zum Verzweigen"*;
`dayGroup.ts` ruft im `catch` `errorMessage(cause)` und wirft den Schlüssel weg. Die kleinere Hälfte
der Unterscheidung ist also **schon da** und wird in der Oberfläche verworfen.

---

## 4. Die Berichtigung an 12.10 — nicht beauftragt, und trotzdem hier

**Was ich beim Nachverfolgen gefunden habe.** 12.10 sagt „am Baum nachgelesen" und zitiert dann den
**Kommentar** in `dayGroup.ts`: *„Ohne Vorlage oder ohne Exportordner gibt es keine Vorschau."* Ein
Kommentar ist ein Beleg dafür, was jemand gedacht hat. Die Zeile darunter habe ich damals nicht
verfolgt — und der ganze Regelfall („L3 ist die Antwort auf jede Buchungsänderung", „sechsmal so oft
gelesen") steht auf ihr.

**Heute nachverfolgt** (2026-09-06, ripgrep über den Arbeitsbaum; **am Code gelesen, nicht laufen
gesehen**):

- `dayGroup.ts` → `previewExport(null, ids)` → `templateId: null`.
- `POST /export/preview` → `usecases/export.ts#previewExport`: löst die Vorlage auf, prüft die
  Definition, liest die Gruppen, rechnet den Plan. **Der Exportordner kommt auf diesem Weg nicht
  vor** — `export_directory_missing` entsteht in `runExport` und in `usecases/structure.ts`.
- `templateId === null` → `settings.activeExportTemplateId` → ohne Wahl die **mitgelieferte
  Standardvorlage**, und die ist nach A-8.7 nicht löschbar (`resolveTemplate` sagt es selbst).

**Was das ändert und was nicht.** Der Regelfall-Satz trägt so nicht, und die Zahl „sechsmal" ist
nicht belegt; **die drei Gründe darüber und die Bedingung darunter bleiben unverändert**, denn sie
hängen nicht an der Häufigkeit. Gebaut wird wie vorgelegt.

**Warum ich das schreibe, statt es stillschweigend nachzuziehen.** Der Abschnitt ist freigegeben.
Eine Freigabe wird nicht dadurch gerettet, daß man ihre Begründung unauffällig austauscht. E-087
Punkt 4 und die Lehre aus meiner eigenen Nachtragszeile sagen dasselbe: benennen, nicht
überschreiben.

---

## 5. Was gemessen wurde (E-087)

**Werkzeug und Grenze.** ripgrep über den **Arbeitsbaum** am 2026-09-06. **Kein `git grep`** —
dieser Lauf hatte keine Schale. Es ist damit wieder die eine Hälfte des seit heute vorgeschriebenen
Werkzeugs; die andere fehlt, und das steht hier statt im Kleingedruckten. Für den vorliegenden Fall
trägt sie: alle betroffenen Dateien liegen im Arbeitsbaum, und ripgrep sieht unversionierte Quellen
mit.

| Was | Ergebnis |
|---|---|
| `NoteField`-Aufrufe im Baum | **fünf im Produkt** (2× `TimerContext.tsx`, `BookingDialogs.tsx`, `TodoFormDialog.tsx`, `TodoDetailScreen.tsx`), **vier auf der Musterseite**. Kein Produktaufrufer reicht `error` oder `required` herein — T-200 und T-212 bestätigt |
| `maxLength` an den Notizfeldern | **Leistung: 8192** (dreimal) — **unter** der Tür. **Vermerk: 65536** (zweimal) — **über** der Tür. O-AX sitzt damit heute am **Vermerk**, nicht an der Leistung |
| Die Regel der Tür auf diesen Text | `textSchema = z.string().max(20_000)`, **ohne** Zeichenprüfung (anders als `titleSchema`/`nameSchema`) |
| Wo eine Absage des Dienstes an einem Feldwert heute aufläuft | am **Dialog** (`FormDialog.error` ← `mutation.error`). Die Feldmeldungen im Produkt (`nameError`, `startError`, `titleError`) sind **eigene** Sätze der Oberfläche |
| Der Weg von `POST /export/preview` | faßt den Exportordner **nicht** an; die Standardvorlage ist nicht löschbar (siehe Abschnitt 4) |
| „nach Absage des Dienstes" als Zustandsname | steht bereits in `showcase/InventorySection.tsx` |

**Zwei Aussagen sind gelesen und nicht laufen gesehen** und im Papier als solche gekennzeichnet:
14.2 Zeile 3 (die Erreichbarkeit der Längengrenze je Fläche) und die Berichtigung zu 12.10. Beide
sind so gefaßt, daß ein Lauf sie widerlegen kann.

---

## 6. Zwei Sätze für das Board (fremde Hoheit, in 14.9 ausgeschrieben)

1. **An domain-dev / local-api:** *Welche Absagen kann `POST /export/preview` überhaupt geben, wenn
   `templateId: null` geschickt wird — und ist „Export nicht eingerichtet" darunter?* Das ist
   T-200 Offene Frage 5 in beantwortbarer Form. Trifft mein Befund zu, ist die Trennung, auf die
   12.9 wartet, eine **andere** als angenommen, und beide L3-Titel bleiben, wie sie sind.
2. **An frontend-dev, angehängt an O-II** (keine neue Aufgabe): `dayGroup.ts` wirft im `catch` den
   Schlüssel der Absage weg. Wer O-II baut, entscheidet ohnehin, ob er mitkommt — und **das** ist
   der Auslöser der Wiedervorlage aus 12.9.

---

## 7. Definition of Done

| Kriterium | Erfüllt |
|---|---|
| Jeder Flow hat Start, Aktion, Feedback, Erfolg und Fehlerpfad | **ja** — 14.7, mit zwei Ausgängen und ausdrücklich benannter Nicht-Sackgasse |
| Keine Sackgassen oder stillen Zustandswechsel | **ja** — kürzen oder abbrechen; das Ausbleiben der zweiten Ansage ist benannt und der Dialog trägt sie |
| Begriffe entsprechen der Spezifikation | **ja** — „Leistung" (E-016), „Tagesgruppe" (E-034), „Dienst" (im Produkt sichtbar in `GlobalSearch` und `NoShellNotice`/SP-20) |
| Übergabe eindeutig | **ja** — acht Akzeptanzkriterien in 14.8, davon zwei ausdrücklich als „nicht anfassen" |
| Bericht im vorgegebenen Schema | **ja**, unten |

---

## Kurzfassung

**Aufgabe:** T-219 — Der Fehlertext des Musterblocks (O-IY) und die Wiedervorlage ohne Auslöser
(O-IV)

**Status:** fertig — Abschnitt 14 ist eine **Vorlage** und braucht die Genehmigung von
spec-ux-reviewer, bevor frontend-dev schneidet (E-078 Punkt 3)

**Artefakte:**
- `docs/design/textbestand.md` — Nachtragskopf T-219; **Abschnitt 14** (neu, mit 14.1 bis 14.9);
  Berichtigung in **12.9** (Wiedervorlage) und in **12.10** (die Annahme hinter dem Regelfall)
- `.claude/team/reports/T-219-ux-designer.md`

**Zusammenfassung:** Der Musterblock von `NoteField` bekommt den Satz **„Leistung: länger, als der
Dienst annimmt."** — die Form aus P-5, 39 Zeichen, ohne Zahl und damit gefahrlos abzuschreiben. Er
führt vor, wofür `error` da ist (die Absage des Dienstes an *diesem* Text) und kann strukturell
nicht als Pflichtfeldmeldung mißverstanden werden, weil er von zuviel spricht und nicht von zuwenig;
die Bedingung der Tagesgruppe bleibt bei ihrem Träger (SP-08, E-034). Damit der Block nach dem
Schnitt nicht auf anderer Ebene widersprüchlich wird, ändern sich drei Angaben mit: gefüllter Wert,
kein Zähler, neuer Zustandsname — und zwei Dinge ausdrücklich **nicht**. Die Wiedervorlage aus 12.9
hängt nicht mehr an einer Frage, die nicht auf dem Board steht, sondern an **O-II**, mit einer
Bedingung, die in einem Blick prüfbar ist. Beim Nachverfolgen hat sich gezeigt, daß die Vorschau,
an der L3 hängt, den Exportordner nirgends anfaßt — also ist eine Annahme in dem von Z-57
freigegebenen Abschnitt 12.10 berichtigt und nicht überschrieben.

**Annahmen:**
1. Die Musterseite dokumentiert den **Baustein**, nicht einen Weg durch das Produkt. Deshalb bleibt
   der Block bei `scope="billing"`, obwohl die Längengrenze der Tür heute nur am **Vermerk**
   erreichbar ist (8192 gegen 65536 gegen 20 000). Wäre das falsch, müßte der Block die Feldart
   wechseln — und die Überschrift „Weitere Zustände des Leistungsfelds" mit ihm.
2. Der Vorführwert im Block ist **nicht** 20 001 Zeichen lang, und das ist Absicht; die Seite zeigt
   Zustände, nicht ihre Ursachen (wie der Block daneben ein erfundenes Exportdatum führt).
3. P-1 bis P-7 aus T-177 gelten als verbindliche Form der Feldmeldung, obwohl P-2 bis P-7 nach
   E-092 Punkt 3 noch nicht in `decisions.md` stehen. Ich habe sie **zitiert und nicht abgeschrieben**
   — eine dritte Fassung wäre genau der Fehler, gegen den E-092 gerichtet ist.
4. „Dienst" ist im Oberflächentext ein zulässiges Wort. Beleg: `GlobalSearch.tsx` („Läuft der lokale
   Dienst noch?") und SP-20.
5. Der Zustandsname „fehlerhaft" in der Bausteinliste bleibt. Ihn anzugleichen wäre eine Verengung
   des Bausteins auf einen von zwei möglichen Absendern.

**Risiken:**
- **Mittel, und es ist das eine Risiko dieser Fassung:** Wird **O-AX** behoben, indem alle Deckel
  auf die Zahl der Tür gehen, ist die Längengrenze durch Tippen nicht mehr erreichbar. Der Satz
  bleibt richtig (ein zu langer Wert kann aus einem älteren Bestand kommen), aber er wird selten.
  **Eine Absage, die nicht angezeigt werden kann, ist schlimmer als eine, die selten ist** — der
  Block behauptet deshalb nichts über Häufigkeit. Wer die Fassung dafür zu klein findet, muß eine
  **andere Regel der Tür** benennen; heute gibt es keine zweite.
- **Klein:** Die Erreichbarkeit je Fläche und der Weg der Vorschau sind **gelesen, nicht laufen
  gesehen**. Beide Stellen sind gekennzeichnet. Ein Lauf kann sie widerlegen; der Wortlaut aus 14.3
  hängt an keiner der beiden.
- **Klein, aber es ist die wiederkehrende Sorte:** Abschnitt 14 nennt eine fremde Zeichenkette
  („Leistung: länger, als der Dienst annimmt.") als Anker. Wer den Auftrag daraus baut, mißt ihren
  heutigen Stand in `tests/**` und `apps/*/test/**` selbst (E-087 Punkt 1). Dieser Nachtrag hat
  gemessen, daß es sie **noch nicht gibt** — das ist keine Zusicherung für morgen.

**Offene Fragen:**
1. **An spec-ux-reviewer:** Genehmigung des Wortlauts aus 14.3 und der drei Blockangaben aus 14.5.
   Ohne sie kann Z-68/Z-69 nicht fahren — das ist die Vorbedingung, die O-IY benennt.
2. **An spec-ux-reviewer:** Trägt meine Berichtigung an **12.10** (Abschnitt 4 dieses Berichts)?
   Sie berührt eine Begründung, die er mit Z-57 Auflage 2 freigegeben hat. Ich habe nichts
   zurückgenommen, aber eine Zahl für nicht belegt erklärt.
3. **An den Orchestrator:** Sollen die zwei Sätze aus 14.9 auf das Board (domain-dev: was
   `POST /export/preview` überhaupt absagen kann; frontend-dev: der Schlüssel in `dayGroup.ts`,
   angehängt an O-II)? Der zweite ist keine neue Aufgabe, der erste beantwortet T-200 Offene
   Frage 5 in einer Form, die messbar ist.

**Nächster Schritt:** spec-ux-reviewer genehmigt 14.3 und 14.5 (kurz — es sind ein Satz und drei
Angaben). Danach fährt der Auftrag aus Z-68/Z-69 an frontend-dev **in einem Stück**:
`NoteField.tsx` (`required` ersatzlos, der Satz an `error` aus 14.6) und `showcase/NotesSection.tsx`
(die vier Punkte aus 14.8), mit dem Lauf aus `tests/e2e/timer-stop-announcement.spec.ts` als
Sicherung. Der Auftrag faßt `dayGroup.ts` **nicht** an — das ist O-II und eine eigene Reihenfolge.
