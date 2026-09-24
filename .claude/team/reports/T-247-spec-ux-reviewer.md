# T-247 — Spezifikations- und UX-Review des Rückbaus der Anhäng-Fläche

Aufgabe: T-247 — Spezifikations- und UX-Review des Rückbaus der Anhäng-Fläche (F-21/E-100)
Status: braucht Review — **Nacharbeit**, fünf blockierende Befunde

Artefakte: `.claude/team/reports/T-247-spec-ux-reviewer.md` (nur diese Datei; kein Produktivcode)

**Kennungsschema.** Die Befunde tragen **Y-01 bis Y-13**. Der Buchstabe ist neu gewählt, weil
V-, X-, Z- und B- in dieser Fläche schon vergeben sind (T-154, T-165, T-184, T-196).

**Womit gemessen wurde.** Ausschließlich am Quelltext im Arbeitsbaum, gelesen über `Grep` und
`Read`. Dieser Agent hat in dieser Sitzung **kein** Ausführungswerkzeug — weder `pnpm check` noch
`proof:addin` noch Playwright sind gelaufen. Die Laufzahlen aus den Berichten von integration-dev
und domain-dev sind übernommen, nicht nachgefahren. Was hier „geprüft" heißt, heißt am Text
gelesen.

---

## 1. Deckung — ist A-10.9 genau getroffen?

**A-10.9 neue Fassung** (`docs/spec.md:204-213`) verlangt dreierlei:

| Teil der Anforderung | Gebaut? | Wo |
|---|---|---|
| „weist das Add-in darauf hin, bevor ein zweites entsteht" | ja, aber **zu dünn** (Y-03) | `DuplicateOffer.tsx:24-35`, gerendert `TaskPane.tsx:262`, also **vor** dem Abschnitt „Neues Todo" und **vor** dem Hauptknopf |
| „bietet am gefundenen Todo keine Handlung an — weder eine Zeitbuchung noch einen Anhang" | ja, **genau getroffen** | `DuplicateOffer.tsx` enthält kein `<Button>`, kein `onClick`, keinen Aufruf; `TaskPane.tsx` hat keinen `submitAttachment`, kein `busyTodoId` mehr |
| „das Add-in legt nicht stillschweigend an oder zusammen" | ja | `describeOffers` sortiert und wählt nicht vor (`rule.ts:136-144`); der Hauptknopf legt immer ein **neues** Todo an (`TaskPane.tsx:191-199`) |

**Nicht weiter als verlangt:** bestätigt. Es gibt in `apps/outlook-addin/src/` keinen Aufrufer
mehr, der am gefundenen Todo etwas ändert.

**Aber enger als verlangt:** siehe Y-03. Die Warnung nennt die Call-Nummer und die Anzahl —
sonst nichts. Kein Titel, kein Erledigt-Kennzeichen. `describeOffer` **rechnet** Titel,
Erledigt-Kennzeichen, offene und exportierte Zeit weiterhin aus (`rule.ts:110-134`), und nichts
davon erreicht den Bildschirm. Das ist integration-devs Annahme 1 („die Angebotsliste fällt mit
den Knöpfen"), und sie geht über E-100 hinaus: E-100 Punkt 7 sagt ausdrücklich, die
Duplikaterkennung selbst falle **nicht**, und A-10.9 verbietet eine **Handlung**, nicht eine
Angabe. Einen Titel anzuzeigen ist keine Handlung.

**Ist A-19.19 jetzt wahr statt behauptet?** **Ja.** Fünf voneinander unabhängige Stellen
gelesen:

1. `apps/local-api/src/routes/addin/attachments.ts` existiert nicht mehr (Glob über
   `routes/addin/` liefert sie nicht).
2. `AddinUnit` führt keinen `AttachmentPort` mehr (`routes/addin/ports.ts:23-29`) — die
   **Fähigkeit** fehlt, nicht bloß die Leitung. Das ist die stärkere der beiden Bauarten.
3. Kein Bezeichner `addAddinTodoAttachment` oder `addLinkAttachment` mehr im ganzen Bestand
   (Grep über das Repository: nur noch Berichte und `decisions.md`).
4. `apps/outlook-addin/src/api/client.ts` hat keine Anhangsmethode mehr (`:197-223`).
5. Der Nachweis mißt seit 18f die **Abwesenheit** und nicht die Zusage
   (`proof-addin.mjs:5412-5540`): 404 mit **gültigem** Add-in-Token, Gegenprobe an
   `…/time-entries` im selben Lauf, und kein Pfad unter `/addin` mit `attachment` im Namen.
   Das ist der Punkt, an dem der alte Abschnitt 18 versagt hat, und er ist getroffen: 18d mißt
   die Tür, 18f den Teilbaum.

Die sechs Sätze, die die Abwesenheit behaupten, sind gedeckt und benennen zusätzlich ihre
eigene Vorgeschichte (`routes/addin/index.ts:278-295`, `schema.ts:297-315`, `ports.ts:23-29`).
Das ist mehr als verlangt und richtig so.

**Bleibt der Zweck aus R-15 erhalten?** Für den sehenden Benutzer: ja, aber knapp (Y-03). Für
den Benutzer mit Vorlesehilfe: **nein** (Y-04). Dazu unten.

---

## 2. Zustimmung nach E-078 Punkt 3 — der Satz aus V-08

**Ich stimme der Streichung zu.**

Der Satz „Die eingetragene Frist gilt nur für ein neues Todo. Das vorhandene Todo behält seine
eigene Frist." beschrieb einen Übergang: das Umschalten von der Anlagefläche auf eine Handlung
am gefundenen Todo. Diesen Übergang gibt es seit E-100 nicht mehr. Ein Satz, der eine Eingabe
gegen einen Verlust absichert, den es nicht geben kann, ist keine Vorsicht, sondern die nächste
Zusage ohne Deckung — und der Aufgabenbereich hat gerade an einer solchen Zusage einen
Widerspruch getragen. Er fällt zu Recht, und er fällt aus dem richtigen Grund: nicht weil seine
Fläche weg ist, sondern weil sein Anlaß weg ist. Die Begründung steht nachlesbar an der Stelle,
an der 19e stand (`proof-addin.mjs:5906-5921`); das ist die Form, die E-078 Punkt 3 verlangt.
Die drei zugehörigen Prüfungen fallen mit — eine Messung ohne Meßgegenstand ist keine
Absicherung.

**Meine Zustimmung hat eine Auflage, und sie ist keine Formsache:** Es gibt weiterhin einen Weg,
auf dem eine eingetragene Frist unbemerkt verfällt, und nach dieser Streichung ist es der
letzte. Er heißt Y-12 und steht unten. Ich habe ihn selbst nachgeprüft, wie beauftragt. Die
Auflage lautet: **Y-12 kommt als eigener Eintrag ins Board**, bevor T-247 geschlossen wird. Er
ist nicht durch T-247 entstanden und blockiert T-247 deshalb nicht — aber er darf nicht mit dem
Satz verschwinden, der ihn zufällig nicht betraf.

Die vier weiteren Wege habe ich durchgesehen und für unbedenklich befunden:

- Warnung erscheint → kein Zustand wird zurückgesetzt, `dueDate` bleibt stehen (`TaskPane.tsx:73`,
  kein `setDueDate` außer am Feld selbst).
- Absenden mit unbrauchbarer Frist → gesperrt, mit Grund (`create-gate.ts:100-111`,
  `entry.ts:89-104`). Kein stilles `null`.
- Absenden schlägt fehl → „Die Eingaben bleiben stehen." und sie bleiben tatsächlich stehen
  (`TaskPane.tsx:201-205`).
- Erfolg → `DoneView`; „Noch etwas aus dieser E-Mail" bringt das Formular mit **allen** Werten
  zurück, einschließlich der Frist. Das ist ein Übertrag und kein Verlust; ich halte ihn bei
  einer zweiten Aufgabe aus derselben E-Mail für vertretbar und mache daraus keinen Befund.

---

## 3. Der Meldungstext des Auftraggebers

Der Rumpf lautet (`DuplicateOffer.tsx:32-34`):

> Bearbeiten Sie das vorhandene Todo in SuperTakt oder legen Sie darunter bewusst ein neues an.
> Dabei wird auf dem vorhandenen Todo keine Zeit erfasst. Ein erledigtes Todo bleibt erledigt.

**Satz 1 führt den Benutzer irgendwohin, wo er ankommt — aber ohne Wegzehrung.** Die
Hauptanwendung kann, was der Satz verlangt: S-02 hat ein Suchfeld, und die Suche läuft
ausdrücklich **auch über die Call-Nummer** (`packages/storage/src/sqlite/repo-todos.ts:139`,
`t.call_number LIKE ?`). Ist das gefundene Todo erledigt, ist es in der Liste zunächst
ausgeblendet (E-039, `TodoListScreen.tsx:98`), aber der Leerzustand sagt dann selbst, was zu tun
ist („Setzen Sie einen Filter zurück oder blenden Sie erledigte Todos ein.",
`TodoListScreen.tsx:461`). Der Weg endet also nicht im Nichts. Ich halte den Verweis für
tragfähig; er ist zudem dieselbe Bauart wie der bereits freigegebene Satz „Das Token finden Sie
in SuperTakt unter Einstellungen" (`TaskPane.tsx:176`).

**Was fehlt, ist die Kennung, mit der der Benutzer dort ankommt** — er muß die Call-Nummer im
Kopf oder in der Zwischenablage über die Anwendungsgrenze tragen, und bei mehreren Treffern weiß
er nicht einmal, wie viele Titel ihn erwarten. Das ist Y-03.

**Satz 2 und 3 sind unter dem neuen Satz 1 falsch geworden.** Das ist der schwerste Befund
dieses Abschnitts und er ist leicht zu übersehen, weil beide Sätze **zeichengleich** stehen
geblieben sind (integration-dev Annahme 4) und `proof:addin` Abschnitt 20 sie zeichengleich
mißt (`proof-addin.mjs:6331-6344`). Zeichengleich, aber nicht bedeutungsgleich: „Dabei" hatte
bis PR #16 einen Antezedens im **Anhängen**. Jetzt ist der nächste vorangehende Vorgang „Bearbeiten
Sie das vorhandene Todo in SuperTakt". Und dort ist beides unwahr — wer das vorhandene Todo in
SuperTakt bearbeitet, **kann** Zeit darauf erfassen, und startet er dabei den Timer, **hebt
SuperTakt „Erledigt" auf** (A-2.5, I-05, `TodoListScreen.tsx:51-53`). Der Aufgabenbereich
verspricht damit im selben Absatz das Gegenteil dessen, was die Hauptanwendung auf dem
angewiesenen Weg tut. Das ist Y-02.

---

## 4. Die Doppelbenennung — vollständig vermessen (E-100 Punkt 6)

Nicht rückgängig zu machen, sondern zu benennen. Hier ist die vollständige Liste. **„Aufgabe"
steht an genau einer Stelle im ganzen Erzeugnis; „Todo" an allen übrigen.**

### 4.1 Wo die beiden Wörter für dieselbe Handlung nebeneinanderstehen

| Ort | Wortlaut | Abstand zur Gegenstelle |
|---|---|---|
| `apps/outlook-addin/manifest.xml:130` | Menübandknopf **„Todo anlegen"** | **ein Klick.** Der Knopf öffnet den Aufgabenbereich, dessen Hauptknopf „Neue Aufgabe anlegen" heißt |
| `TaskPane.tsx:266` | Abschnittsüberschrift **„Neues Todo"** | **dieselbe Bildschirmfläche.** Der Abschnitt beginnt mit „Neues Todo" und schließt mit „Neue Aufgabe anlegen" (`:371`) |
| `TaskPane.tsx:435`, `:437` | Erfolgsansicht **„Todo angelegt"**, „Das Todo ist in SuperTakt angelegt." | **unmittelbar danach.** Die Bestätigung nennt ein anderes Ding als der gedrückte Knopf |
| `DuplicateOffer.tsx:26`, `:32` | „gibt es bereits **ein Todo**" / „legen Sie darunter bewusst **ein neues** an" | **eine Bildschirmhöhe.** „ein neues" bezieht sich rückwärts auf „Todo", vorwärts auf einen Knopf, der „Aufgabe" sagt |
| `App.tsx:203` | „Öffnen Sie eine E-Mail, um daraus ein **Todo** anzulegen." | Vorzustand desselben Bildschirms |
| `App.tsx:100` | Kopfzeile **„Todo aus E-Mail"** | dauerhaft sichtbar über dem Knopf |
| `TaskPane.tsx:333` | „Ein **Todo** entsteht so nicht." | im Fehlerfall an der Stelle der Tagauswahl, drei Zeilen über dem Knopf |
| `manifest.xml:45`, `:133` | Beschreibung und Kurzhilfe: „ein **Todo** in SuperTakt anlegen …" | Kurzhilfe erscheint beim Überfahren desselben Menübandknopfes |
| `docs/glossar.md:185` | **„Todo"** ist der Begriff | die Begriffsquelle sagt das eine, die Hauptfläche das andere |

### 4.2 Wo es eine Klickstrecke oder eine Vorlesereihenfolge bricht

1. **Menüband → Aufgabenbereich (WCAG 3.2.4, Consistent Identification, Stufe AA).** Dieselbe
   Funktion — „aus dieser E-Mail etwas anlegen" — trägt im selben Erzeugnis zwei Namen. Wer im
   Menüband „Todo anlegen" gelesen hat und im Bereich danach sucht, findet ihn nicht unter
   diesem Wort. Das ist der einzige Fall in dieser Liste, der ein normatives Kriterium reißt,
   und er ist **nicht auflösbar**, solange beide Beschriftungen stehen: Der Auftraggeber
   bestimmt die eine, das Menüband trägt die andere.
2. **Sprachsteuerung.** Windows-Sprachzugriff und vergleichbare Hilfen bedienen über den
   **sichtbaren** Namen. „Klicke Todo anlegen" trifft im Menüband, im Aufgabenbereich nicht;
   „Klicke Neue Aufgabe anlegen" umgekehrt. Der Benutzer muß beide Namen führen, für einen
   Vorgang.
3. **Vorlesereihenfolge im Aufgabenbereich.** Ein linearer Durchgang hört: Überschrift „Neues
   Todo" → Titel → Frist → Tags → Vermerk → Schaltfläche „Neue Aufgabe anlegen". Die
   Schaltfläche schließt einen Abschnitt ab, den sie nicht beim Namen nennt. Wer über die
   Überschriftenliste navigiert (H-Taste), landet auf „Neues Todo" und sucht darunter einen
   Knopf mit diesem Wort.
4. **Der Erfolgspfad kehrt die Benennung um.** Gedrückt wurde „Neue Aufgabe anlegen", angesagt
   wird „Todo angelegt". Für eine Vorlesehilfe ist das ein Wechsel des Gegenstands mitten im
   Vorgang; für die Bestätigungslogik („habe ich das Richtige getroffen?") ist es eine
   Rückfrage, die niemand beantwortet.

### 4.3 Was der Auftraggeber damit trägt

Ein Kriterium der Stufe AA (3.2.4) zwischen Menüband und Bereich; zwei Namen in der
Sprachsteuerung; einen Abschnitt, dessen Überschrift und Abschlußknopf verschiedene Dinge
nennen; eine Bestätigung, die den gedrückten Knopf nicht wiederholt; und eine Begriffsquelle
(`docs/glossar.md`), die den zweiten Begriff nicht kennt. **Der Preis ist bezifferbar und
tragbar** — er kostet keinen Zustand und keine Handlung, nur Wiedererkennung. Er wächst
allerdings mit jedem weiteren Text: Ohne einen Eintrag im Glossar entscheidet ihn künftig jeder
Autor neu. Mein Vorschlag, ohne die Entscheidung anzutasten: **einen Glossareintrag „Aufgabe →
siehe Todo"** mit dem Vermerk, daß der Hauptknopf des Aufgabenbereichs auf Wunsch des
Auftraggebers so heißt und **kein weiterer** Text nachzieht. Das macht aus einer Ausnahme eine
benannte Ausnahme.

---

## 5. Zustandsabdeckung S-12

| Zustand | Erreichbar | Angekündigt | Anmerkung |
|---|---|---|---|
| Wird geladen (Wirt) | ja, `App.tsx:162` | Überschrift + Skelett | Skelett ist `aria-hidden`; die Überschrift „Wird geladen" trägt |
| Office.js fehlt | ja, `:170` | Warnung + „Erneut prüfen" | ✓ |
| Outlook nicht bereit | ja, `:185` | Warnung + „Erneut prüfen" | ✓ |
| **Keine E-Mail geöffnet** | ja, `:200` | Info-Callout | ✓ (Wortwahl siehe Y-13) |
| Token fehlt | ja, `TaskPane.tsx:164` | Info-Callout + „Zu den Einstellungen" | ✓ |
| Tags werden geladen | ja, `:316` | „Tags werden geladen …" + Skelett | ✓ |
| Dienst nicht erreichbar | ja, `:322` | Danger-Callout (`role="alert"`) + Ausweg | ✓ |
| Call-Nummer nicht erkannt / unplausibel / Ausdruck kaputt / Zeitüberschreitung / kein Faden | ja, `:467-523` | je eigener Callout bzw. Hilfezeile | ✓, fünf getrennte Fälle — vorbildlich |
| Wert sieht nicht wie eine Call-Nummer aus (keine Suche) | ja, `:110-116` | Info-Callout | ✓ |
| **Kein Treffer** | ja | **nein, und das ist beabsichtigt** | siehe Y-04: für eine Vorlesehilfe ist „geprüft, nichts gefunden" von „noch nicht geprüft" nicht zu unterscheiden |
| **Ein Treffer** | ja | Warnung mit Call-Nummer | **Y-03** (nennt das Todo nicht), **Y-04** (Ansage) |
| **Mehrere Treffer** | ja, `DuplicateOffer.tsx:27` | „… bereits 3 Todos." | **Y-03 verschärft**: bei mehreren Treffern nennt die Fläche keinen einzigen davon |
| Suche läuft | ja | **nein** | kein Zwischenzustand zwischen Tastendruck und Antwort; klein, benannt als Y-13 Zusatz |
| Absenden läuft | ja | `aria-busy` am Knopf (`Primitives.tsx:93`) | ✓ |
| Absenden schlägt fehl | ja, `:264` | `role="alert"` mit Feldliste | ✓ |
| Erfolg | ja, `:183` | Success-Callout | ✓ (Benennung Y-13) |

**Ist die Meldung als Statusmeldung ausgezeichnet?** Formal ja: `Callout` setzt bei `warning`
`role="status"` (`Primitives.tsx:204`). **Wirksam nein** — und der Bestand weiß das bereits an
anderer Stelle besser. Siehe Y-04.

---

## Befunde

```
Y-01  A-10.9, A-19.19  Menüband / Kurzhilfe des Add-ins
      Abweichung: `manifest.xml:45` (Beschreibung) und `:133` (Kurzhilfe des
      Menübandknopfes) sagen beide „… anlegen **oder Zeit auf ein vorhandenes Todo
      buchen**". Diese Handlung gibt es im Aufgabenbereich seit PR #15 nicht mehr und
      seit E-100 endgültig nicht. Der Benutzer liest die Zusage beim Überfahren des
      Knopfes, klickt, tippt eine Call-Nummer und liest zwei Zeilen später den
      wörtlichen Widerspruch: „Dabei wird auf dem vorhandenen Todo keine Zeit
      erfasst." Zwei Klicks Abstand zwischen Versprechen und Dementi. Dies ist die
      **einzige verbliebene benutzersichtbare** Stelle, die die alte Fassung von
      A-10.9 behauptet.
      Vorschlag: integration-dev. Beide Zeichenketten auf die tatsächliche Fähigkeit
      kürzen, z. B. „Aus dieser E-Mail ein Todo in SuperTakt anlegen." Kein zweiter
      Satz — der Duplikathinweis ist kein Merkmal, mit dem man wirbt. Achtung E-087:
      der heutige Wortlaut steht auch in `docs/design/textbestand-aufgabenbereich.md:356`.

Y-02  A-10.9, A-2.5, A-6.6  S-12 / Duplikatwarnung
      Abweichung: SP-A-27 („Dabei wird auf dem vorhandenen Todo keine Zeit erfasst.")
      und SP-A-28 („Ein erledigtes Todo bleibt erledigt.") sind zeichengleich stehen
      geblieben, ihr Bezugswort aber nicht. „Dabei" verwies auf das Anhängen; jetzt
      steht davor „Bearbeiten Sie das vorhandene Todo in SuperTakt". Auf **diesem**
      Weg sind beide Sätze falsch: In SuperTakt läßt sich Zeit auf dem vorhandenen
      Todo erfassen, und ein Timerstart hebt „Erledigt" auf (A-2.5, I-05). Der
      Aufgabenbereich sagt damit über die Hauptanwendung das Gegenteil dessen, was sie
      tut — und zwar in dem Satz, der den Benutzer dorthin schickt. Für den zweiten
      Zweig („legen Sie ein neues an") bleiben beide Sätze richtig und nötig.
      Vorschlag: integration-dev, mit meiner Zustimmung als Prüfer zur Änderung der
      gesperrten Texte SP-A-27/SP-A-28. Beide an den Zweig binden, auf den sie
      zutreffen, und **vor** den Verweis nach SuperTakt ziehen. Etwa: „Ein neues Todo
      erfasst keine Zeit auf dem vorhandenen und lässt dessen Erledigt-Kennzeichen
      unberührt. Zum Weiterarbeiten am vorhandenen Todo öffnen Sie es in SuperTakt."
      Die Aussage von SP-A-27/28 bleibt dabei erhalten; nur ihr Bezug wird eindeutig.
      `proof:addin` Abschnitt 20 und `textbestand-aufgabenbereich.md` Zeilen 21-22
      ziehen im selben Auftrag nach (E-081 Punkt 4).

Y-03  A-10.9, R-15, E-100 Punkt 7  S-12 / Duplikatwarnung
      Abweichung: Die Warnung nennt das gefundene Todo nicht. Sie sagt „Zu Call 4711
      gibt es bereits ein Todo." bzw. „… bereits 3 Todos." — kein Titel, kein
      Erledigt-Kennzeichen, nichts. Der Benutzer soll laut Satz 1 „das vorhandene Todo
      in SuperTakt bearbeiten", weiß aber nicht, welches. Bei mehreren Treffern weiß
      er nicht einmal, wie verschieden sie sind. `describeOffer` (`rule.ts:110-134`)
      rechnet Titel, `isDone`, offene und exportierte Zeit weiterhin aus; nichts davon
      erreicht den Bildschirm. Die Streichung geht damit über E-100 hinaus: A-10.9
      verbietet eine **Handlung** am gefundenen Todo, keine **Angabe** darüber, und
      E-100 Punkt 7 sagt ausdrücklich, die Duplikaterkennung selbst falle nicht. Der
      Dateikopf von `rule.ts:23-27` nennt den Grund, aus dem die Angaben je entstanden
      sind: „Eine anonyme Ja/Nein-Frage beantwortet jeder mit Ja." Eine anonyme
      Warnung überliest jeder — und dann entsteht das Duplikat unbemerkt, was R-15 und
      A-10.9 gerade verhindern sollen.
      Vorschlag: integration-dev. Unter der Warnung eine **Aufzählung ohne
      Bedienelemente** — je Treffer Titel (durch `<Foreign>`, siehe Y-11) und, falls
      erledigt, die Wortmarke „Erledigt". Kein Knopf, kein Link, keine Vorauswahl;
      damit bleibt „keine Handlung" aus A-10.9 unangetastet. Die CSS-Regeln
      `.offer__list/__item/__title` sind in T-247 gefallen und müssten in derselben
      Aufgabe zurückkehren — das ist kein Argument dagegen, sondern der Hinweis, sie
      in **einem** Auftrag zu führen.
      Damit beantwortet sich integration-devs offene Frage 4: `describeOffers` soll die
      Angaben weiter erzeugen, weil sie wieder angezeigt gehören.

Y-04  A-10.9, R-15  S-12 / Duplikatwarnung, Zugänglichkeit
      Abweichung: Die Warnung trägt `role="status"`, kommt aber **zusammen mit ihrem
      Inhalt** in den Baum: `DuplicateOffer` liefert `null`, solange kein Treffer
      vorliegt (`DuplicateOffer.tsx:21`). Genau diese Bauart ist im Bestand bereits als
      unwirksam beschrieben — `Primitives.tsx:135-140`: „Ein `role="alert"`, das erst
      zusammen mit seinem Inhalt in den Baum kommt, wird von vielen Vorlesehilfen nicht
      angesagt: Sie melden Änderungen an einer Region, die sie kennen, und diese kennen
      sie in dem Augenblick noch nicht." Deshalb steht die Meldefläche von `Field`
      **immer** da, auch leer. Die Duplikatwarnung tut das nicht.
      Vorher trug diesen Fall der Zufall mit: Mit der Warnung erschienen Schaltflächen,
      und die fand ein Tastaturbenutzer beim Weitergehen. Seit T-247 erscheint **nur
      Text**. Wer nicht hinsieht, erfährt vom Duplikat gar nichts, drückt „Neue Aufgabe
      anlegen" und legt es an — der Fall, den A-10.9 ausschließt.
      Vorschlag: integration-dev. `DuplicateOffer` gibt den `role="status"`-Container
      **immer** aus und füllt ihn nur wechselnd — dieselbe Bauart und derselbe Grund wie
      bei `Field`. Zusätzlich erwägen, den Fall „geprüft, kein Treffer" nicht stumm zu
      lassen, sondern in derselben Region einmal zu bestätigen (etwa „Zu Call 4711 gibt
      es noch kein Todo."). Ohne ihn ist „geprüft und nichts gefunden" von „noch nicht
      geprüft" akustisch nicht zu unterscheiden. Ein neuer Nachweis in `proof:addin`,
      der die dauerhafte Region mißt, gehört in denselben Auftrag.

Y-05  A-10.9  CLAUDE.md, Abschnitt „Fachliche Punkte, die in Review und Test immer
      geprüft werden"
      Abweichung: Dort steht unverändert: „… und bietet bei bereits vorhandenem Call
      an, auf das existierende Todo zu buchen statt ein Duplikat anzulegen." Das ist
      die **alte** Fassung von A-10.9, und sie steht in der Datei, die jedem künftigen
      Prüfer sagt, was er zu messen hat. Ein Reviewer, der sie befolgt, meldet den
      korrekten Bau als Verstoß. Ebenfalls dort: der ganze Abschnitt „Ungedeckt gebaut
      — der offene Widerspruch an A-19.19" beschreibt die Route als bestehend und die
      Bausperre als geltend, und unter „Befehle" steht `proof:followup`, dessen Datei
      gelöscht ist.
      Vorschlag: Orchestrator (Hoheit). Drei Stellen in einem Zug: den fachlichen Punkt
      auf „weist bei bereits vorhandenem Call auf das vorhandene Todo hin und bietet
      daran keine Handlung an" ziehen; den Widerspruchsabschnitt durch die Entscheidung
      ersetzen (nicht löschen — die Vorgeschichte ist der Grund für 18f); `proof:followup`
      aus der Befehlsliste nehmen.

Y-06  A-10.9  docs/glossar.md:185, docs/datenmodell.md:412
      Abweichung: Beide begründen eine Eigenschaft mit der alten A-10.9 — „weil der
      Benutzer selbst entscheiden soll, ob er auf ein vorhandenes Todo bucht oder ein
      zweites anlegt". Bei `datenmodell.md` hängt daran die Begründung, warum
      `call_number` **nicht** eindeutig ist. Die Begründung trägt weiterhin, aber sie
      nennt eine Wahl, die es nicht mehr gibt.
      Vorschlag: documenter (Glossar) und domain-dev (`datenmodell.md`, eigene Hoheit).
      Wortlaut: „… ob er das vorhandene Todo weiterbearbeitet oder bewußt ein zweites
      anlegt (A-10.9)". Die Nichteindeutigkeit bleibt damit begründet.

Y-07  A-10.9, S-12  docs/testplan.md:1396, :1402, :1538 (TP-ADDIN-02, TP-STATE-12)
      Abweichung: Der Prüfplan fährt weiterhin den Schritt „Anbieten ‚auf vorhandenes
      Todo buchen' bestätigen" und erwartet „die neue Zeitbuchung landet am vorhandenen
      Todo". TP-STATE-12 führt als Sonderzustand „auf vorhandenes Todo buchen vs. neu
      anlegen". Beides ist nicht mehr baubar. Ein Prüfplan, der einen Schritt verlangt,
      den es nicht gibt, wird beim nächsten Durchgang entweder rot oder übersprungen —
      beides schlecht.
      Vorschlag: e2e-tester (eigene Hoheit). TP-ADDIN-02 auf den neuen Ablauf drehen:
      Call-Nummer eintragen, Warnung erscheint, **keine** Handlung am gefundenen Todo
      verfügbar, „Neue Aufgabe anlegen" erzeugt ein zweites Todo, das vorhandene bleibt
      unverändert (Zeit **und** Erledigt-Kennzeichen). Das ist zugleich der Prüffall,
      der Y-02 gegenmisst.

Y-08  A-19.19, A-A-21  docs/bedrohungsmodell.md:908, :925, :927
      Abweichung: Das Bedrohungsmodell beschreibt R-15 über den Buchungsvorschlag
      („bietet an, darauf zu buchen … Beim Vorschlag ‚auf vorhandenes Todo buchen'
      zeigt das Add-in Titel und Kunden-Tag"). Der Angriffsweg besteht fort, sein
      Endpunkt aber nicht: Der Schaden ist nicht mehr „Zeit landet auf dem falschen
      Vorgang", sondern „der Benutzer wird auf ein falsches vorhandenes Todo
      hingewiesen und legt kein Duplikat an, wo eines nötig wäre". Der Gegenwert der
      Maßnahme sinkt, das Risiko verschwindet nicht. Anzumerken ist außerdem: Zeile 927
      verlangt ausdrücklich, daß das Add-in **Titel** zeigt — das ist eine zweite,
      unabhängige Begründung für Y-03.
      Vorschlag: security-checker (eigene Hoheit), im selben Durchgang, in dem er den
      Wegfall der Route bewertet. A-A-21 ist inhaltlich unverändert richtig und braucht
      nur den Zusatz, daß sie seit T-247 an 18f gemessen wird statt an 18d.

Y-09  A-10.9  docs/design/textbestand-aufgabenbereich.md:3-28, :212, :278, :356, :404
      Abweichung: Das freigegebene Textpapier — nach meinem Auftrag die visuelle
      Referenz — beschreibt durchgehend den Anhängeablauf: „Bei einem vorhandenen Todo
      wird die E-Mail als Outlook-Verweis angehängt" (:5), SP-A-27/28 mit der Bedeutung
      „Anhängen erzeugt keine Zeitbuchung" (:21-22), „V-08 gilt weiter" (:27),
      „`proof:addin` Abschnitt 21 prüft die Wirkung" (:25, Abschnitt 21 ist gefallen),
      SP-A-24 an Zeilen, die es nicht mehr gibt (:404), und `TaskPane.tsx:697` „Auf
      vorhandenes Todo buchen" (:212). **Das ist ein Widerspruch zwischen freigegebenem
      Design und Spezifikation**, und er ist nach meiner Vorgabe als Befund zu melden,
      nicht stillschweigend zugunsten des Codes aufzulösen.
      Vorschlag: ux-designer (Hoheit über `docs/design/**`). Einen zweiten Nachtrag
      „2026-09-10 — F-21 entschieden" davorsetzen, der den Nachtrag von PR #15
      **historisiert** statt löscht, SP-A-24 endgültig streicht, SP-A-27/28 auf ihre
      neue Bedeutung stellt (siehe Y-02) und den V-08-Absatz mit dem Verweis auf meine
      Zustimmung schließt. Der Nachtrag von PR #15 darf nicht verschwinden — er ist der
      Beleg, wie ein Papier und ein Bau auseinanderlaufen.

Y-10  A-10.9, E-078  apps/outlook-addin/src/duplicate/reopen.ts, rule.ts:29-32
      Abweichung: `reopen.ts` steht vollständig im Baum, mit sechs
      benutzersichtbaren Sätzen (`REOPEN_HINT`, `reopenPreview`, `reopenOutcome`) über
      eine Buchung, die der Aufgabenbereich nicht mehr auslöst. Kein Modul unter `src/`
      importiert die Datei; ihr einziger Leser ist `proof-addin.mjs:48-52`, das sie in
      mindestens neun Prüfungen weiterhin mißt. Der Nachweis hält damit Text am Leben,
      den kein Benutzer je sieht. Dazu behauptet `rule.ts:29-32`: „Ist das gefundene
      Todo erledigt, wird es durch die Buchung automatisch wieder offen (A-2.5). Das
      steht im Angebot" — es steht in keinem Angebot, weil es kein Angebot gibt, und
      der Dateikopf `rule.ts:5-10` beschreibt das Angriffsbild noch über „bietet an,
      darauf zu buchen". Nach der Regel dieses Hauses ist ein Satz im Quelltext, der
      eine Zusage gibt, die der Nachbar bricht, schlimmer als kein Satz.
      Vorschlag: integration-dev, **als eigener Auftrag nach Y-03** — nicht davor. Ob
      `reopen.ts` fällt oder bleibt, hängt daran, ob mit Y-03 wieder ein
      Erledigt-Kennzeichen angezeigt wird. Fällt sie, fallen die neun Prüfungen mit;
      bleibt sie, wird ihr Kopf auf „reine Auskunft, keine Handlung" gestellt. Die
      Kopfkommentare von `rule.ts` gehören in beiden Fällen berichtigt.

Y-11  B-2.4, T-119  apps/outlook-addin/src/api/client.ts:211-222
      Abweichung: `book()` ruft `POST /addin/todos/{id}/time-entries`. Kein Modul unter
      `src/` ruft `book()` auf. Die Route besteht im Dienst weiter (18f benutzt sie als
      Gegenprobe), aber der Aufgabenbereich hat keine Fläche dafür. Damit trägt der
      Zugang eine Fähigkeit, die die Oberfläche nicht anbietet — dieselbe Klasse wie die
      Anhangsmethode, nur mit umgekehrtem Vorzeichen: hier ist die Tür offen und der
      Griff fehlt. Kein Sicherheitsbefund (die Route war immer für das Add-in-Token
      gedacht und ist in A-10.5/A-10.9 gedeckt), aber toter Zugang samt sieben
      gesperrter Fehlersätze (SP-A-23).
      Vorschlag: security-checker bewertet, ob die Buchungsroute im Add-in-Token
      verbleiben soll, wenn keine Fläche sie benutzt (RR-1, „Angriffsfläche des Tokens
      klein halten"). Erst danach integration-dev. **Nicht** nebenbei entfernen: Die
      Route steht in `route-policy.ts`, in der OpenAPI-Beschreibung und als Gegenprobe
      in 18f — sie fällt oder bleibt in einem Auftrag.
      Nebenbei, zu integration-devs offener Frage 5: Die rohe Einsetzung der
      Call-Nummer in `DuplicateOffer.tsx:26` ist **gedeckt**. `describeOffer` läßt nur
      durch, was `checkCallNumber` bestanden hat, und dessen Zeichenvorrat schließt
      Steuer- und Richtungszeichen aus (`packages/domain/src/call-number.ts:50-59`).
      Kommt mit Y-03 der **Titel** in die Fläche zurück, gilt das für ihn **nicht** — er
      muß durch `<Foreign>`.

Y-12  A-19.21, V-08 (Klasse)  S-12 / Wechsel in die Einstellungen
      Abweichung: **Der Weg, auf dem eine eingetragene Frist unbemerkt verfällt,
      existiert weiterhin.** `App.tsx:116-139` rendert `SettingsView` **anstelle** von
      `Body`; `TaskPane` wird dabei ausgehängt und verliert seinen gesamten Zustand —
      Titel, Call-Nummer, Tags, Vermerk und **Frist**. Beim Zurückkehren steht ein
      leeres Formular. Erreichbar über das Zahnrad in der Kopfzeile (`:102-112`) und,
      schwerwiegender, über den Ausweg im Fehlerfall: Der Fehler-Callout sagt „Die
      Eingaben bleiben stehen. Ein neuer Versuch ist möglich." (`TaskPane.tsx:427`) und
      stellt unmittelbar daneben die Schaltfläche „Einstellungen öffnen"
      (`:411-415`), die genau diese Zusage bricht. Bei `unauthorized` ist das der
      **empfohlene** nächste Schritt: Token nachtragen, zurückkommen, alles weg.
      Dies ist derselbe Schadenstyp wie V-08, an einer anderen Fläche, und nach der
      Streichung des V-08-Satzes der letzte seiner Art. Er ist **nicht** durch T-247
      entstanden und blockiert T-247 nicht — er ist die Auflage meiner Zustimmung aus
      Abschnitt 2.
      Vorschlag: integration-dev, eigener Auftrag. Der Aufgabenbereich bleibt beim
      Öffnen der Einstellungen **montiert** (Einstellungen darüberlegen statt
      danebenstellen), oder der Formularzustand wandert eine Ebene höher nach `App`.
      Erst dann stimmt der Satz „Die Eingaben bleiben stehen." an allen Ausgängen.
      Prüffall: Frist eintragen → Einstellungen öffnen → schließen → Frist steht noch.

Y-13  A-21, E-100 Punkt 6  S-12 durchgehend, Benennung
      Abweichung: Kein Fehler, sondern die Vermessung aus Abschnitt 4 als Eintrag:
      „Aufgabe" steht an genau einer Stelle (`TaskPane.tsx:371`), „Todo" an neun
      weiteren derselben Fläche, im Menüband und im Glossar. Gerissen wird WCAG 3.2.4
      zwischen Menüband und Aufgabenbereich; belastet werden Sprachsteuerung,
      Überschriftennavigation und die Erfolgsbestätigung.
      Vorschlag: **nicht rückgängig machen** — der Auftraggeber hat entschieden. Statt
      dessen documenter: ein Glossareintrag „Aufgabe" mit Verweis auf „Todo", dem
      Vermerk „nur die Hauptschaltfläche des Aufgabenbereichs, auf Wunsch des
      Auftraggebers (E-100 Punkt 6); kein weiterer Text zieht nach". Damit ist die
      Ausnahme benannt statt vererbt. Zusatz ohne eigene Kennung: Zwischen Tastendruck
      in der Call-Nummer und der Antwort gibt es keinen sichtbaren Zwischenzustand —
      klein, aber im Zusammenhang mit Y-04 mitzudenken.
```

---

## Was ausdrücklich gut ist

Damit es nicht untergeht, denn es ist der Kern des Auftrags:

- **Die Route ist nicht verriegelt, sondern nicht vorhanden.** `AddinUnit` führt keinen
  `AttachmentPort` — das Add-in-Token kann einen Anhang nicht anlegen, weil die Fähigkeit in
  dieser Vertrauensstufe fehlt, nicht weil eine Prüfung sie abweist. Das ist die stärkere der
  beiden Bauarten und die richtige.
- **18f mißt die Abwesenheit, nicht die Zusage**, und zwar mit gültigem Token, mit Gegenprobe an
  der Nachbarroute im selben Lauf und mit einer Aussage über den ganzen Teilbaum. Das ist genau
  die Lehre aus dem Befund und nicht nur seine Behebung.
- **Die Sätze, die die Abwesenheit behaupten, tragen jetzt ihre eigene Vorgeschichte** — sie
  sagen, daß sie zwischenzeitlich nur die Tür beschrieben, an der sie standen
  (`routes/addin/index.ts:288-295`). Ein Bestand, der seinen eigenen Fehlschluß aufbewahrt,
  wiederholt ihn seltener.
- **Die OpenAPI-Beschreibung verschweigt den Wegfall nicht**, sondern benennt ihn und verweist
  für den Pfad auf `401` statt `404` (domain-dev, Annahme 1). Spiegelbildlich richtig.

---

## Urteil

**Nacharbeit.** Blockierend: **Y-01, Y-02, Y-03, Y-04, Y-05.**

Vier davon sind kleine Textänderungen an je einer Stelle; Y-03 und Y-04 gehören in **einen**
Auftrag bei integration-dev, weil beide dieselbe Fläche betreffen und Y-04 ohne Y-03 die falsche
Sache ansagen würde. Y-05 liegt beim Orchestrator und ist eine Zeile.

**Nicht blockierend, aber vor dem Schließen von T-247 ins Board:** Y-12 (Auflage meiner
Zustimmung nach E-078 Punkt 3). Danach in eigenen Aufträgen: Y-06 bis Y-11, Y-13.

---

Aufgabe: T-247 — Spezifikations- und UX-Review des Rückbaus der Anhäng-Fläche
Status: braucht Review — Nacharbeit, blockierend Y-01 bis Y-05

Artefakte: `.claude/team/reports/T-247-spec-ux-reviewer.md`

Zusammenfassung: A-19.19 ist wieder wahr statt behauptet — die Route fehlt als Fähigkeit, nicht
nur als Leitung, und 18f mißt ihre Abwesenheit am zusammengesetzten Dienst mit Gegenprobe. Die
neue Fassung von A-10.9 ist im Verbot genau getroffen (keine Handlung am gefundenen Todo), im
Gebot aber zu eng gebaut: Die Warnung nennt das gefundene Todo nicht mehr, und sie wird für eine
Vorlesehilfe nicht angesagt, weil ihre `role="status"`-Region zusammen mit ihrem Inhalt in den
Baum kommt — zusammen ist das der Weg, auf dem ein Duplikat unbemerkt entsteht, also genau der
Schaden aus R-15. Die beiden gesperrten Sätze SP-A-27/28 sind zeichengleich stehen geblieben,
ihr Bezugswort aber nicht: Unter dem neuen ersten Satz behaupten sie über die Hauptanwendung das
Gegenteil dessen, was A-2.5 dort tut. Und die Kurzhilfe des Menübandknopfes verspricht weiterhin
eine Zeitbuchung auf ein vorhandenes Todo.

Annahmen: Ich lese `docs/spec.md` in der vom Orchestrator geänderten Fassung als verbindlich und
E-100 als ihre Begründung; wo E-100 und der Bau auseinandergehen (Angebotsliste), folge ich
E-100. Die Laufergebnisse der Bauenden habe ich übernommen — dieser Agent hat kein
Ausführungswerkzeug und hat nichts nachgemessen.

Risiken: Y-04 ist der einzige Befund mit Schadenswirkung statt Textwirkung — ein Benutzer mit
Vorlesehilfe erfährt vom Duplikat gar nichts. Y-12 ist ein bestehender, nicht durch T-247
verursachter Zustandsverlust, der mit der Streichung des V-08-Satzes sonst aus dem Blick geriete.
Y-11 ist eine Frage an den security-checker, keine Feststellung.

Offene Fragen: 1. Soll die Buchungsroute des Add-ins bleiben, obwohl keine Fläche sie ruft
(Y-11)? 2. Wer historisiert `docs/design/textbestand-aufgabenbereich.md` — ux-designer, obwohl
der Nachtrag von integration-dev stammt (Y-09)? 3. Bleibt `duplicate/reopen.ts` samt neun
Prüfungen, oder fällt sie — entscheidbar erst nach Y-03 (Y-10)?

Nächster Schritt: Eine Nacharbeitswelle mit zwei Aufträgen — integration-dev für Y-01 bis Y-04
(Y-03 und Y-04 zwingend zusammen, mit dem neuen Nachweis für die dauerhafte Statusregion), und
der Orchestrator für Y-05. Y-12 zeitgleich als Board-Eintrag anlegen. Danach Wiedervorlage bei
mir; Y-06 bis Y-11 und Y-13 in spätere Wellen.

**Zustimmung zu Punkt 2 (E-078 Punkt 3):** Ich stimme der Streichung des Satzes „Die eingetragene
Frist gilt nur für ein neues Todo. Das vorhandene Todo behält seine eigene Frist." und der drei
zugehörigen Prüfungen **zu**. Der Satz sicherte einen Übergang ab, den es seit E-100 nicht mehr
gibt; er wäre nach dem Rückbau selbst eine Zusage ohne Deckung. Die Zustimmung steht unter der
Auflage, daß **Y-12** als eigener Board-Eintrag geführt wird: Über den Wechsel in die
Einstellungen verfällt eine eingetragene Frist weiterhin unbemerkt, und der Fehler-Callout
verspricht daneben ausdrücklich das Gegenteil.

---
---

# Zweite Runde — Wiedervorlage nach der Nacharbeit (2026-09-10)

Aufgabe: T-247 — Wiedervorlage nach der Nacharbeit an Y-01 bis Y-05
Status: **fertig — freigegeben**

**Womit gemessen wurde, und was sich gegenüber der ersten Runde geändert hat.** Wieder
ausschließlich am Quelltext im Arbeitsbaum, gelesen über `Grep` und `Read`; dieser Agent hat
weiterhin kein Ausführungswerkzeug. **Neu ist, daß es diesmal einen Lauf gibt, auf den ich mich
stützen kann:** `pnpm check` ist auf diesem Rechner erstmals vollständig und mit Exit 0
durchgelaufen (`proof:addin` 238/0, `test:coverage` 1570/0, `test:rust` 68/0). Das ist eine
andere Beweislage als in der ersten Runde, in der jede Zahl zitiert war. Ich habe die Zahlen
nicht nachgefahren, aber die Prüfungen, auf die es ankommt, **einzeln gelesen** — was sie
behaupten und ob sie es messen können.

---

## 0. Ein Fehler von mir zuerst: Y-05 war bereits erledigt

**Y-05 ist zurückgezogen, nicht behoben — er war zum Zeitpunkt meines Berichts schon erfüllt.**
Ich habe eine ältere Fassung von `CLAUDE.md` gelesen, vermutlich den Stand beim Start meiner
Sitzung, und daraus einen Befund gemacht. Nachgesehen, wie verlangt, und zwar an der Datei und
nicht am Wort des Orchestrators:

| Stelle | Heutiger Stand | Y-05 verlangte |
|---|---|---|
| `CLAUDE.md:140-143` | „… und **weist auf einen bereits vorhandenen Call hin**, bevor ein Duplikat entsteht. Gehandelt wird am gefundenen Todo nicht — weder gebucht noch angehängt (A-10.9 in der Fassung von E-100)." | genau das |
| `CLAUDE.md:206-231` | Überschrift „**Entschieden — der Widerspruch an A-19.19 ist aufgelöst**", mit der Vorgeschichte als Lehrsatz statt als Sperre | ersetzen, nicht löschen — erfüllt, und besser als vorgeschlagen: die drei Absätze „Der Wächter wird schärfer", „A-10.9 ist mitgeändert", „Ein Satz, der eine Handlung nennt, die es nicht gibt" tragen die Lehre über den Fall hinaus |
| `CLAUDE.md:347-350` | „**Einer** steht ausdrücklich nicht darin … `proof:followup` gibt es seit T-247 nicht mehr — es prüfte ausschließlich die Anhangsroute des Add-ins und ist mit ihr gefallen (E-100)." | aus der Befehlsliste nehmen — erfüllt, und auch die Zahl „zwei stehen nicht darin" ist auf „einer" korrigiert |

Die dritte Zeile ist der Beleg dafür, daß hier gerechnet und nicht gestrichen wurde: Nicht nur
der Name ist weg, sondern auch die Zahl, die ihn mitzählte. Das ist genau die Sorgfalt, deren
Fehlen den Ausgangsbefund erzeugt hat.

**Die Lehre gehört nicht dem Orchestrator, sondern mir:** Ein Prüfer, der eine Datei aus dem
Sitzungsanfang zitiert, mißt den Stand seines Kontexts und nicht den des Bestands — dieselbe
Klasse wie „ein Lauf auf dem falschen Betriebssystem ist eine Aussage über den Läufer". Ich habe
in der ersten Runde für `spec.md` frisch gelesen und für `CLAUDE.md` nicht. Für Befunde an
`CLAUDE.md`, `board.md` und `decisions.md` — den drei Dateien, die zwischen zwei Aufträgen am
häufigsten wandern — lese ich künftig unmittelbar vor dem Schreiben des Befunds nach.

---

## 1. Y-01 — Beschreibung und Kurzhilfe des Menübandknopfes

**Erledigt.**

`manifest.xml:45` (`<Description>`) und `:133` (`paneButtonTip`) lauten beide zeichengleich:
„Aus dieser E-Mail ein Todo in SuperTakt anlegen." Kein zweiter Satz, keine Erwähnung der
Duplikatprüfung — genau wie vorgeschlagen. Damit ist die letzte benutzersichtbare Stelle weg,
die die alte Fassung von A-10.9 behauptete.

Gegengeprüft über den ganzen Arbeitsbaum: „oder Zeit auf ein vorhandenes Todo buchen" steht nur
noch in `docs/design/textbestand-aufgabenbereich.md:356` (das ist Y-09, fremde Hoheit) und in
den Berichten. **In `tests/**` und `apps/*/test/**` steht der alte Wortlaut nicht** — die Suche
nach E-087 ist damit auch im Nachhinein sauber; es gab keinen Prüffall, der ihn festnagelte.

Der Menübandknopf selbst heißt weiterhin „Todo anlegen" (`:130`), der Hauptknopf im Bereich
„Neue Aufgabe anlegen". Das ist Y-13 und die Entscheidung des Auftraggebers; ich taste sie nicht
an.

---

## 2. Y-02 — die beiden gesperrten Sätze

**Erledigt, und die gebaute Fassung leistet, was ich gemeint habe.**

Gebaut (`DuplicateOffer.tsx:76-80`):

> Bearbeiten Sie das vorhandene Todo in SuperTakt oder legen Sie darunter bewusst ein neues an.
> **Ein neues Todo** erfasst dabei keine Zeit auf dem vorhandenen und lässt dessen
> Erledigt-Kennzeichen unberührt.

Mein Vorschlag hatte den zweiten Satz vor den Verweis gezogen; der Auftraggeber hat statt dessen
das **Subjekt** ausgeschrieben und die Reihenfolge gelassen. Das ist die kürzere Lösung
desselben Problems, und sie ist mir lieber als meine eigene:

- Der Bezug hängt jetzt an einem Substantiv im selben Satz („Ein neues Todo"), nicht mehr an
  einem Vorgang im vorigen. „Dabei" ist damit eindeutig, ohne daß es fällt.
- Über den **ersten** Zweig — das vorhandene Todo in SuperTakt bearbeiten — behauptet der Text
  jetzt **gar nichts**. Das war der Kern des Befunds: Nicht daß die Sätze zu wenig sagten,
  sondern daß sie über den falschen Weg das Gegenteil sagten. Schweigen über einen Weg, auf dem
  A-2.5 gilt, ist richtig; A-2.5 gilt dort nämlich in voller Härte, und der Aufgabenbereich ist
  nicht der Ort, das zu erklären.
- Die Aussage von SP-A-27 und SP-A-28 ist inhaltlich erhalten — keine Zeit, kein Anfassen des
  Kennzeichens —, nur ihr Träger ist ausgetauscht.

**Der Ausgleich am Nachweis ist mitgezogen und ist schärfer als vorher** (`proof-addin.mjs:1261-1298`,
`:6886-6904`): Die beiden Sätze stehen im Lauf **einmal** als Konstanten `SP_A_27`/`SP_A_28`,
werden zum Rumpf zusammengesetzt und von Abschnitt 20 von dort gelesen — statt zweimal
abgeschrieben. Und die Prüfung mißt **beides**: daß der neue Wortlaut dasteht **und** daß der
alte weg ist („die alte Fassung von SP-A-27 steht noch da — dann sagt die Fläche beides").
Genau die Gegenprobe, die bei einem Textaustausch fehlt, wenn man nur das Neue sucht. Die
Begründungen in der Sperrliste nennen die Änderung, ihren Anlaß und meine Zustimmung.

Für das Protokoll, weil es die Ausnahme ist: **Die Änderung zweier gesperrter Sätze ist mit
meiner Zustimmung nach E-078 Punkt 3 erfolgt**, erteilt in der ersten Runde unter Y-02, und die
gebaute Fassung deckt sich mit dem, wofür ich sie erteilt habe.

---

## 3. Y-03 — die Treffer werden wieder genannt

**Erledigt, und an der richtigen Grenze.**

`DuplicateOffer.tsx:81-90` gibt je Treffer eine `<li>` mit dem Titel durch `<Foreign>` und, bei
`isDone`, der Wortmarke „Erledigt". Kein Knopf, kein Verweis, kein `onClick`, keine Vorauswahl.
Die Überschrift nennt bei **einem** Treffer die Call-Nummer, bei mehreren die Anzahl
(`notice.ts:71-90`) — sinnvoll, denn bei mehreren Treffern ist die Nummer für alle dieselbe und
stünde sonst in jeder Zeile noch einmal.

**Warum ich die Messung für tragfähig halte, und nicht nur das Ergebnis.** Sie sitzt an zwei
Stellen, und die beiden fangen verschiedene Rückfälle:

1. **An der Auskunft** (`proof-addin.mjs:1229-1241`): `Object.keys(notiz.items[0]).sort()` ist
   **genau** `['isDone', 'title', 'todoId']`. Das ist eine Obergrenze und nicht eine
   Untergrenze — käme wieder eine Dauer oder ein Kunden-Tag mit, wird die Prüfung rot. Der
   Kommentar nennt den Grund präzise: „Steht dort wieder eine Dauer oder eine Kennung zum
   Buchen, ist der nächste Knopf einen Handgriff entfernt." Das ist die richtige Angst.
2. **An der Fläche** (`:1243-1250`): kein `<Button`, kein `onClick`, kein `<a `, kein `href=`,
   kein `api.` im Quelltext der Datei. Grobe Textsuche, aber an einer Datei von hundert Zeilen
   mit einer einzigen Aufgabe ist sie wirksam, und sie fängt den wahrscheinlichsten Rückfall:
   daß jemand „nur schnell" einen Link auf das gefundene Todo dazusetzt.

Die Trennung ist der Punkt: A-10.9 verbietet die Handlung, und die kann sowohl über die
**Daten** (was die Fläche über einen Treffer weiß) als auch über das **Markup** zurückkommen.
Beide Wege sind zu.

**`describeOffers` bleibt damit begründet** — meine Antwort auf integration-devs offene Frage 4
aus der ersten Runde ist eingelöst: Die Angaben entstehen wieder für einen Zweck. Was `rule.ts`
darüber hinaus rechnet (offene und exportierte Zeit, `poolMovement`, `summary`), erreicht die
Fläche weiterhin nicht — das ist Y-10, siehe unten.

**Der Foreign-Wächter ist bei dieser Gelegenheit repariert worden, und das ist der wertvollste
Nebenfund der Nacharbeit** (`proof-addin.mjs:4742-4780`, `:4823-4841`). Er rechnete aus
`FREMDE_WERTE` aus, welche Flächen den Baustein brauchen — und nahm `DuplicateOffer.tsx`
deshalb **aus der Prüfung heraus**, als nach dem Rückbau mit `first.callNumber` ein Wert
dastand, der in der Liste nicht stand. Ein Wächter, der still von vier Flächen auf drei fällt,
mißt weniger und sagt es nicht. Jetzt steht eine Untergrenze von vier daneben, `item.title` und
`notice.callNumber` sind in der Liste, und `offer.title` bleibt als Verbotsname stehen, obwohl
es ihn nicht mehr gibt. Das ist dieselbe Bauart wie 18f, eine Ebene höher: **die Menge an der
Anforderung aufspannen, nicht an dem, was man gerade kennt.** Die Entscheidung des Orchestrators
zu Frage 3 (Untergrenze bleibt bei vier) trage ich ausdrücklich mit.

---

## 4. Y-04 — die dauerhafte Statusregion, und ob der statische Nachweis reicht

**Erledigt. Der statische Nachweis reicht für die Freigabe; der Playwright-Fall ist Auflage,
nicht Bedingung.** Das ist die Entscheidung, um die ich gebeten wurde, und hier ist die
Begründung, damit sie nachprüfbar ist statt geglaubt.

**Was gebaut ist.** `DuplicateOffer` gibt kein `null` mehr zurück; `<div className="offer"
role="status">` steht außerhalb jeder Bedingung, die Fallunterscheidung liegt darin
(`:59-98`). Der Fall „geprüft, kein Treffer" bekommt **einen** Satz — „Zu Call 4711 gibt es
noch kein Todo." —, keine Hinweisfläche. Genau das richtige Maß: hörbar, nicht laut.

**Die Unterscheidung, an der es hing, ist zu einem Zustand geworden.** `checkedCallNumber` in
`TaskPane.tsx:83` ist die Nummer, mit der **tatsächlich** gesucht wurde, und sie wird an allen
vier Abbruchstellen des `lookup` sauber auf `null` zurückgesetzt: nicht plausibel, Dienst
antwortet nicht, Dienst hat die Suche abgelehnt, leeres Feld (`:115-148`). Damit ist „gesucht
und nichts gefunden" von „gar nicht gesucht" nicht nur in der Anzeige, sondern **im Zustand**
verschieden — und `notice.ts` rechnet daraus drei Fälle statt zwei. Das ist mehr, als ich
verlangt hatte: Ich hatte eine Anzeige gefordert, gebaut ist eine Unterscheidung.

**Warum der statische Nachweis trägt.** Er ist nicht das, was ich befürchtet hatte — eine
Textsuche, die grün ist, weil sie nichts findet. Er hat vier Beine:

1. `regionStehtImmer` (`:1309-1314`) prüft **drei** Dinge zusammen: kein `return null`, die
   Region samt Rolle vorhanden, und die erste Fallunterscheidung **hinter** der Region. Jedes
   einzelne wäre zu umgehen; alle drei zusammen beschreiben die Bauart.
2. **Zwei echte Gegenproben** (`:1343-1365`): Der frühere Bau wird in den Quelltext
   **eingesetzt** und die Prüfung muß daran rot werden — einmal mit `return null`, einmal mit
   der Rolle am Inhalt statt an der Hülle. Und vor jeder steht ein `assert.notEqual(…, quelle)`,
   damit ein danebengreifender Ersetzer nicht als bestandene Gegenprobe durchgeht. Das ist die
   Form, in der eine Textsuche etwas wert ist.
3. Die **CSS-Gegenprobe** (`:1367-1384`): `.offer:empty` darf kein `display: none` und kein
   `visibility: hidden` tragen. Das ist der Weg, auf dem eine dauerhafte Region am
   wahrscheinlichsten wieder verschwindet — nicht im JSX, sondern im Stylesheet, beim Aufräumen
   eines leeren Kastens. Daß jemand daran gedacht hat, ist der Grund, aus dem ich dem Nachweis
   glaube.
4. Die **Fallunterscheidung selbst läuft** (`:1186-1227`): `duplicateNotice` ist eine reine
   Funktion und wird mit `[], null`, `[], ''`, `[], 'TCK-000042'`, einem und zwei Treffern
   ausgeführt. Der Teil, der gelesen statt ausgeführt wird, ist nur noch die **Anordnung** im
   JSX.

**Was er nicht kann, und warum es die Freigabe nicht aufhält.** Er sieht die Datei, nicht den
Baum. Bricht die Region, weil ein **Elternteil** sie aushängt, merkt er nichts — und dieser Weg
ist nicht theoretisch: `App.tsx` tauscht beim Wechsel in die Einstellungen den ganzen Körper aus
(das ist Y-12), und `TaskPane` steigt vor `DuplicateOffer` an zwei Stellen früh aus (`hasToken`
falsch, `done` gesetzt). Die beiden Aussteige habe ich nachgesehen: Sie liegen in Zuständen, in
denen es kein Formular und keine Suche gibt — dort ist die Abwesenheit der Region richtig. Im
Zustand, auf den es ankommt (Formular offen, Benutzer tippt eine Call-Nummer), ist die Region
seit dem Aufbau des Bereichs im Baum, also **vor** der Änderung, die angesagt werden soll. Das
ist genau die Bedingung, an der es vorher fehlte.

Damit ist der Restzweifel nicht am Bau, sondern an der Meßart, und er ist klein. Ich mache
daraus eine **Auflage im Board statt einer Bedingung an die Freigabe**: Ein Playwright-Fall, der
den Bereich lädt, ohne Call-Nummer die leere Region im Baum findet, dann eine Nummer tippt und
den Inhaltswechsel **in derselben Region** feststellt (nicht: findet eine Region), gehört zu
e2e-tester und schließt die Lücke. Er ist der einzige Fall, der auch Y-12 mitfängt. Eine
Freigabe daran zu hängen hieße, einen gebauten und mit Gegenproben gemessenen Fortschritt gegen
einen Prüffall aufzurechnen, den es für **keine** der übrigen Live-Regionen dieses
Aufgabenbereichs gibt — das wäre ein Maßstab, den ich nur an dieser einen Stelle anlegte.

**Ein Detail, das mir gefällt, weil es die Falle daneben vermeidet:** `Callout` nimmt seit dieser
Nacharbeit `role="none"` (`Primitives.tsx:186-222`), und die Duplikatfläche benutzt es. Zwei
ineinandergeschachtelte Live-Regionen sind keine doppelte Sicherheit, sondern eine doppelte
Ansage; der Kommentar sagt das und warnt zugleich davor, `'none'` ohne eine Region darüber zu
setzen. Die Prüfung mißt beides: das `role="none"` an der Fläche und die Fähigkeit von
`Callout`, die Rolle überhaupt wegzulassen.

---

## 5. Y-12 — die Auflage meiner Zustimmung ist erfüllt

**Bestätigt.** `board.md:33-39` führt Y-12 als eigenen Eintrag, mit Fundstelle
(`App.tsx:116-139`), mit dem widersprechenden Satz daneben („Die Eingaben bleiben stehen.") und
mit dem Vermerk, daß er nicht durch T-247 verursacht ist und trotzdem dort steht, damit er nicht
mit dem V-08-Satz aus dem Blick gerät. Das ist genau die Auflage aus Abschnitt 2 meines ersten
Berichts, und sie ist wörtlich erfüllt.

**Meine Zustimmung nach E-078 Punkt 3 zur Streichung des V-08-Satzes steht damit
uneingeschränkt.**

---

## 6. Y-10 — meine Entscheidung: `reopen.ts` fällt, aber nicht in T-247

Ich war um eine Entscheidung gebeten und treffe sie. Vorher nachgesehen, was heute dasteht:

- `reopen.ts` ist unverändert vollständig: `REOPEN_HINT` („Dieses Todo ist erledigt. **Eine
  Buchung darauf** hebt das Kennzeichen automatisch auf."), `reopenPreview` („15 Minuten
  **werden gebucht**", „Das Erledigt-Kennzeichen **wird** automatisch aufgehoben"),
  `reopenOutcome` („Gebucht. „X" ist wieder offen."), dazu `bookingOutcome`. Kein Modul unter
  `src/` importiert die Datei.
- `rule.ts:29-32` behauptet weiterhin: „Ist das gefundene Todo erledigt, wird es durch die
  Buchung automatisch wieder offen (A-2.5). **Das steht im Angebot**, nicht in einer Fußnote
  danach — die Sätze dafür liegen in `reopen.ts`." Es gibt kein Angebot. Und `rule.ts:5-10`
  beschreibt das Angriffsbild von R-15 noch über „bietet an, darauf zu buchen".

**Entscheidung: `reopen.ts` fällt, samt der neun Prüfungen, die sie messen.** Begründung, und
sie ist die Umkehrung derselben Regel, mit der ich in der ersten Runde gegen die Streichung der
Angebotsliste argumentiert habe:

1. **Die Bedingung, unter der sie hätte bleiben können, ist nicht eingetreten.** Ich hatte die
   Entscheidung an Y-03 gehängt: Kommt ein Erledigt-Kennzeichen zurück, könnte sie als Auskunft
   weiterleben. Zurückgekommen ist die **Wortmarke „Erledigt"** — ein Zustand des vorhandenen
   Todos, ohne jede Aussage über eine Wirkung. `reopen.ts` sagt ausschließlich Wirkungen einer
   Buchung an, und zwar in Zukunft und Vergangenheit. Keine ihrer sechs Zeichenketten paßt auf
   eine Fläche, die nichts tut.
2. **Sie ist genau die Bauart, gegen die dieser ganze Auftrag gerichtet ist.** Der Bestand hat
   einen Widerspruch getragen, weil ein Satz eine Zusage gab, die der Nachbar brach. `REOPEN_HINT`
   verspricht dem Leser des Quelltextes, der Aufgabenbereich sage einem Benutzer diese Wirkung
   an. Er sagt sie niemandem an.
3. **Die neun Prüfungen sind kein Gegenargument, sondern der zweite Teil des Schadens.** Ein
   Nachweislauf, der Text mißt, den kein Benutzer sehen kann, meldet Deckung, wo keine Fläche
   ist — dasselbe Muster wie der alte Abschnitt 18, der die geschlossene Tür maß. Eine Messung
   ohne Meßgegenstand ist keine Absicherung, sondern eine Zahl.
4. **Es geht kein Wissen verloren.** Die Wirkung selbst ist in A-2.5, I-05 und in der
   Hauptanwendung gedeckt und dort geprüft; `poolMovementSentence` lebt in `packages/domain`
   und hat dort Leser.

**Aber nicht in T-247, und nicht allein.** Sie gehört in **einen** Auftrag mit Y-11 (`ApiClient.book`
ohne Aufrufer) und `DURATION_PRESETS_MINUTES`, weil alle drei dieselbe Frage beantworten: Behält
das Add-in eine schlafende Buchungsfähigkeit oder nicht? Und diese Frage hat einen Vorentscheid
beim security-checker (bleibt `POST /addin/todos/{id}/time-entries` im Add-in-Token, wenn keine
Fläche sie ruft — RR-1). Reihenfolge: security-checker entscheidet über die Route, dann
integration-dev räumt Client, Sätze und Prüfungen **in einem Zug**.

**Zwei Auflagen für diesen künftigen Auftrag**, damit die Streichung nicht selbst wieder eine
stille wird:

- Die Kopfkommentare von `rule.ts` (Zeilen 5-10 und 29-32) werden **im selben Auftrag**
  berichtigt. Sie sind der eigentliche Befund an dieser Stelle: Sie behaupten heute schon ein
  Angebot, das es nicht gibt, und zwar in der Datei, die den Schaden aus R-15 trägt.
- Der Wegfall der neun Prüfungen wird an der Stelle vermerkt, an der sie standen, mit Grund und
  Datum — dieselbe Form, die integration-dev für die drei V-08-Prüfungen gewählt hat und die
  E-078 Punkt 3 verlangt. Und die Zahl im Lauf fällt sichtbar, nicht nebenbei.

---

## 7. Zwei neue Befunde aus dieser Runde

Beide klein, beide **nicht** blockierend, beide gehören trotzdem benannt.

```
Y-14  A-10.9, S-12  S-12 / Duplikatfläche, Wettlauf zweier Suchen
      Abweichung: `lookup` in `TaskPane.tsx:115-148` läuft ohne Abbruchkennung; der
      Effekt `:150-153` ruft es bei jedem Zeichen und räumt nichts auf. Tippt der
      Benutzer schnell zwei suchfähige Nummern hintereinander, kann die **ältere**
      Antwort die jüngere überschreiben — dann stehen `offers` und
      `checkedCallNumber` auf der vorigen Nummer, während im Feld schon die neue
      steht. Der Fehler ist alt und nicht durch die Nacharbeit entstanden.
      **Er ist durch Y-04 zugleich kleiner geworden**, und das ist der Grund, aus dem
      ich ihn nicht höher hänge: Seit die Fläche die geprüfte Nummer **nennt** („Zu
      Call 4711 gibt es noch kein Todo."), ist eine veraltete Aussage sichtbar
      veraltet statt falsch. Sie behauptet nichts über den Wert im Feld. Vor der
      Nacharbeit wäre derselbe Wettlauf eine anonyme Warnung über die falsche Nummer
      gewesen — der Schaden aus R-15.
      Vorschlag: integration-dev, zusammen mit Y-12 (dieselbe Datei, dieselbe Klasse
      „Zustand des Aufgabenbereichs"). Eine Laufnummer oder ein `cancelled`-Merker im
      Effekt, wie ihn `TaskPane.tsx:93-108` für `loadContext` bereits führt — das
      Muster steht zwölf Zeilen darüber und ist nur nicht angewandt.

Y-15  —  .claude/team/board.md:41-75, Koordinationsartefakt
      Abweichung: `board.md` enthält eine **Abschrift seiner selbst**. Mitten im
      Nebenbefund zu `proof-openapi.mjs` bricht Zeile 43 ab („… trifft das
      `# Aufgabenboard — SuperTakt"), darauf folgen Kopfzeile, Stand und der ganze
      T-247-Abschnitt ein zweites Mal (`:45-74`), und erst `:75` setzt den
      abgeschnittenen Satz fort („ nie: „gelesen 88, gezählt 0""). Ein Leser, der von
      oben liest, bekommt den T-247-Abschnitt doppelt und den Nebenbefund
      unvollständig; ein Agent, der `board.md` als Auftragslage liest, liest den Stand
      zweimal und den einen Satz nie zu Ende. Kein Produktfehler — aber `board.md` ist
      nach CLAUDE.md die Stelle, über die Agenten miteinander sprechen, und genau
      deshalb blockiert dieser Schaden zwar nichts, verdient aber eine Zeile.
      Vorschlag: Orchestrator (alleinige Hoheit). Die Zeilen 44-74 entfernen und den
      Satz in Zeile 43 mit Zeile 75 zusammenführen. Beim Prüfen mitlesen, ob der
      Abschnitt „Zwei Punkte, die die Welle 2 ausdrücklich zu prüfen hat" (:82-88)
      vollständig ist — er steht hinter der Bruchstelle.
```

Ferner, ohne eigene Kennung, weil bereits als Y-09 geführt und nur schärfer geworden:
`docs/design/textbestand-aufgabenbereich.md:21-22` führt SP-A-27 und SP-A-28 weiterhin im
**alten** Wortlaut mit der Begründung „Anhängen erzeugt keine Zeitbuchung". Das Textpapier
widerspricht damit jetzt nicht nur dem Code, sondern der **Sperrliste des Nachweislaufs** — zwei
Papiere über dieselben zwei gesperrten Sätze, mit verschiedenem Wortlaut. Solange beide stehen,
entscheidet der nächste Autor, welches gilt. Y-09 bleibt beim ux-designer und rückt in der
Dringlichkeit nach oben.

---

## Befundstand nach der zweiten Runde

| Kennung | Stand |
|---|---|
| Y-01 | **erledigt** — `manifest.xml:45`, `:133` |
| Y-02 | **erledigt** — neuer Wortlaut, Sperrliste und Gegenprobe auf die alte Fassung |
| Y-03 | **erledigt** — Treffer werden genannt, an zwei Stellen gemessen |
| Y-04 | **erledigt** — dauerhafte Region, dritter Fall „kein Treffer", vier Prüfbeine; Playwright-Fall als Auflage |
| Y-05 | **zurückgezogen** — war vor meinem Bericht erfüllt, mein Lesefehler |
| Y-12 | **Auflage erfüllt** — eigener Board-Eintrag, `board.md:33-39` |
| Y-10 | **entschieden** — `reopen.ts` fällt, in einem Auftrag mit Y-11, nach dem Vorentscheid des security-checkers |
| Y-06, Y-07, Y-08, Y-09, Y-11, Y-13 | offen, eigene Aufträge, fremde Hoheit |
| Y-14, Y-15 | neu, nicht blockierend |

---

## Urteil der zweiten Runde

**Freigegeben. Keine blockierenden Befunde.**

**Y-01 bis Y-05 sind erledigt** — vier gebaut und am Quelltext nachgeprüft, einer (Y-05) von mir
zurückgezogen, weil er zum Zeitpunkt seiner Erhebung bereits erfüllt war.

**T-247 gebe ich frei**, mit vier Auflagen, von denen keine den Abschluß aufhält und die alle
als eigene Aufträge geführt werden:

1. **Playwright-Fall für die dauerhafte Statusregion** (e2e-tester) — die einzige Meßlücke, die
   nach dieser Nacharbeit noch besteht, und zugleich der Fall, der Y-12 mitfängt.
2. **`reopen.ts` samt neun Prüfungen und die Kopfkommentare von `rule.ts`** (security-checker
   entscheidet über die Route, dann integration-dev) — Y-10 und Y-11 in einem Auftrag.
3. **`docs/design/textbestand-aufgabenbereich.md`** (ux-designer) — Y-09, jetzt mit dem Zusatz,
   daß das Papier den gesperrten Sätzen des Nachweislaufs widerspricht.
4. **`board.md` entdoppeln** (Orchestrator) — Y-15.

Was diese Aufgabe über sich hinaus hinterläßt, und weshalb ich sie nicht bloß als behoben,
sondern als **gut** abschließe: An drei Stellen ist aus einem Befund eine allgemeinere Regel
geworden statt einer Ausbesserung. 18f spannt seine Menge an der Anforderung auf statt an der
bekannten Route. Der Foreign-Wächter kann nicht mehr still von vier Flächen auf drei fallen. Und
die Prüfung eines ausgetauschten Textes mißt seit Y-02 **beides**, das Neue und die Abwesenheit
des Alten. Alle drei sind Lehren aus dem Fehlschluß, der zu F-21 geführt hat: Ein Wächter, der
mißt, was er kennt, ist grün und trotzdem zu milde.

---

Aufgabe: T-247 — Wiedervorlage nach der Nacharbeit an Y-01 bis Y-05
Status: fertig — **freigegeben**

Artefakte: `.claude/team/reports/T-247-spec-ux-reviewer.md` (nur diese Datei; kein Produktivcode)

Zusammenfassung: Y-01 bis Y-04 sind gebaut und am Quelltext nachgeprüft; Y-05 ziehe ich zurück,
weil er zum Zeitpunkt seiner Erhebung bereits erfüllt war — ich hatte eine ältere Fassung von
`CLAUDE.md` gelesen, und alle drei genannten Stellen stehen seit der Änderung des Orchestrators
richtig. Der Meldungstext des Auftraggebers löst Y-02 kürzer als mein eigener Vorschlag: Das
ausgeschriebene Subjekt „Ein neues Todo" bindet beide gesperrten Sätze an den Zweig, auf den sie
zutreffen, und über den Weg nach SuperTakt behauptet der Text nun gar nichts — was richtig ist,
denn dort gilt A-2.5. Die Duplikatfläche nennt ihre Treffer wieder, ohne ein einziges
Bedienelement, und ihre Live-Region steht dauerhaft im Baum samt einem eigenen Fall für
„geprüft, kein Treffer". Den statischen Nachweis dafür halte ich für ausreichend: Er hat zwei
eingesetzte Gegenproben, eine CSS-Gegenprobe gegen das wahrscheinlichste Wiederverschwinden und
eine ausgeführte Fallunterscheidung — der Playwright-Fall ist Auflage, nicht Bedingung.

Annahmen: Ich stütze mich auf den Lauf des Orchestrators (`pnpm check` Exit 0, `proof:addin`
238/0), habe ihn nicht nachgefahren, aber die einschlägigen Prüfungen einzeln gelesen und
beurteilt, was sie messen können. Für Y-10 entscheide ich zugunsten des Wegfalls, weil die
Bedingung, unter der `reopen.ts` hätte bleiben können — ein angesagtes Wiederöffnen —, mit
Y-03 nicht eingetreten ist: zurückgekommen ist ein Zustand, keine Wirkung.

Risiken: Die Region ist statisch gemessen, nicht im Browser; bricht sie künftig durch einen
**Elternteil**, merkt kein Nachweis es — und dieser Weg existiert nachweislich (Y-12). Y-14 ist
ein alter Wettlauf zweier Suchen, den die Nacharbeit unbeabsichtigt entschärft hat, weil die
Fläche die geprüfte Nummer jetzt nennt. Y-15 ist ein Schaden am Koordinationsartefakt, nicht am
Erzeugnis.

Offene Fragen: 1. An den security-checker, unverändert aus der ersten Runde: bleibt
`POST /addin/todos/{id}/time-entries` im Add-in-Token, wenn keine Fläche sie ruft (RR-1)? Von
dieser Antwort hängt der Zuschnitt des Aufräumauftrags für Y-10/Y-11 ab. 2. An den
Orchestrator: Läuft der Playwright-Fall aus Auflage 1 als eigener Auftrag oder im Zuge von
Y-12, das dieselbe Fläche und denselben Prüfweg betrifft?

Nächster Schritt: T-247 schließen, sobald Code-Reviewer und security-checker ihre zweite Runde
abgeschlossen haben; danach der Dokumentierer. Die vier Auflagen als Board-Einträge anlegen,
Y-10 und Y-11 dabei als **einen** Auftrag hinter dem Vorentscheid des security-checkers.
