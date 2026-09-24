# T-265 — Spezifikations- und UX-Review der Umstrukturierung (T-249 bis T-263)

Aufgabe: T-265 — Gegenprobe zu Spezifikation und Bedienung nach vierzehn Umbauaufträgen
Status: **Nacharbeit** — die Struktur gebe ich frei, zwei Befunde blockieren.
Verbindlich gelesen: `docs/spec.md`, `docs/design/textbestand.md`,
`docs/design/traeger-und-zusage.md`, `docs/design/textabbau-gestalt.md`,
`docs/design/textbestand-aufgabenbereich.md`, `.claude/team/decisions.md` (E-047, E-050,
E-078, E-081, E-087, E-100), Berichte T-249 bis T-263.

**Messumgebung:** In dieser Sitzung stand mir keine Kommandozeile zur Verfügung. Alles unten
ist **am Quelltext gelesen**, nicht gefahren. Wo ich einen Lauf oder `git` gebraucht hätte, um
eine Aussage abzuschließen, steht das ausdrücklich dabei. Ich habe keine Zahl aus einem
fremden Bericht als eigene Messung ausgegeben.

---

## 0 Kurzfassung

Die Umstrukturierung trifft die Spezifikation. Alle dreizehn Pflicht-Screens S-01 bis S-13
sind vorhanden und erreichbar, A-19.2 hält, die Notiz-Trennung ist unversehrt, Standard-Tags
greifen auf beiden Anlegewegen, der Exportstatus steht an sieben Flächen. Von den 21 Sätzen
der Sperrliste habe ich alle 21 am Gegenstand gesucht.

**Zwei Befunde blockieren, und sie sind verschiedener Art:**

- **B-01** ist ein Widerspruch in der Regel, die entscheidet, ob eine Buchung abgerechnet
  ist. Ich entscheide ihn unten, Punkt 4.
- **B-02** ist der Befund, vor dem der Auftrag gewarnt hat, und er ist eingetreten: **Drei
  Einträge der Sperrliste stehen nicht mehr so im Bestand, wie das Papier sie festhält** —
  und **kein einziger Nachweislauf mißt diese Sperrliste.** Die zeichengleichen Zahlen aus
  `proof:foreign` und `proof:surface` können die Zusage „kein Oberflächentext hat sich
  geändert" nicht tragen, weil sie Dateien, Übergaben und Live-Regionen zählen — keine Sätze.

Die Kommentar-Trennlinie (Punkt 3) urteile ich Fall für Fall: **24 bleiben, keiner wandert,
keiner fällt.** Die zwei nachgezogenen Prüffalltitel sind richtig nachgezogen; ich habe sie
am Gegenstand gegengeprüft.

---

## 1 Deckung — Anforderung für Anforderung

### 1.1 Pflicht-Screens S-01 bis S-13 (Spezifikation Abschnitt 11)

| ID | Screen | Heutiger Ort | Urteil |
|---|---|---|---|
| S-01 | Dashboard | `app/DashboardScreen.tsx` | getroffen |
| S-02 | Todo-Liste | `features/todos/TodoListScreen.tsx` + `TodoListFilters`, `TodoRow` | getroffen |
| S-03 | Todo-Detail | `features/todos/TodoDetailScreen.tsx` + `TodoDetailAside`, `TodoDoneSwitch`, `TodoNoteCard` | getroffen, **aber** siehe B-02 |
| S-04 | Kanban-Board | `features/board/BoardScreen.tsx` + `Kanban`, `BoardColumn`, `BoardEmptyState`, `BoardSetupDialog` | getroffen |
| S-05 | Zeiterfassung | `features/timer/TimeScreen.tsx` | getroffen |
| S-06 | Buchungsübersicht | `features/bookings/BookingsScreen.tsx` + `BookingTable`, `BookingDialogs` | getroffen |
| S-07 | Export | `features/export/ExportScreen.tsx` + acht Nachbarn | getroffen |
| S-08 | Tags und Ordner | `features/tags/TagsScreen.tsx` + `TagAdministration`, `PoolAdministration`, `TagTree` | getroffen |
| S-09 | Einstellungen | `features/settings/SettingsScreen.tsx` + sieben Teilflächen | getroffen |
| S-10 | Standard-Tags | `features/settings/DefaultTagSettings.tsx` | getroffen |
| S-11 | Pool-Konfiguration | `features/structure/PoolFormDialog.tsx`, `PoolRenameDialog`, `RulePickers`, `RuleSummary` | getroffen |
| S-12 | Aufgabenbereich | `apps/outlook-addin/src/ui/**` — vom Umbau **nicht** berührt | getroffen |
| S-13 | Add-in-Einstellungen | `apps/outlook-addin/src/ui/SettingsView.tsx` | getroffen |

**Kein Screen ist durch das Aufteilen zu einem Sammelordner geworden.** Der Zuschnitt folgt
durchweg der Anforderung und nicht der Dateigröße: `features/tags` trägt A-4/A-9,
`features/board` A-5, `features/export` A-8, `features/timer` A-6, `features/todos` A-2/A-7/A-19.
Das ist die für einen Prüfer wichtigere Eigenschaft als jede Zeilenzahl — ich finde eine
Anforderung heute schneller als vorher.

### 1.2 A-19.2 — „Frist" heißt in der Oberfläche ausschließlich so

Gemessen über `apps/web/src`: **null** sichtbare Vorkommen von „Fälligkeitsdatum", „fällig am",
„Deadline" oder „Termin". Der einzige Treffer ist ein Kommentar in
`features/todos/TodoFormDialog.tsx:215`, der die Regel selbst zitiert. Das Feld heißt „Frist"
(`TodoFormDialog.tsx`, `TodoDetailAside.tsx:54`, `TodoListFilters.tsx:69`), die Knöpfe heißen
„Frist setzen" / „Frist ändern", der Filter „Jede Frist" / „Ohne Frist", die Sortierung „Frist,
früheste zuerst" / „Frist, späteste zuerst".

**Der Dateiname `shared/ui/DeadlineFlag.tsx` ist kein Verstoß** — A-19.2 gilt der Oberfläche,
Bezeichner sind nach `CLAUDE.md` englisch. Ich nenne es, damit es nicht in der nächsten Runde
als Befund wiederkommt.

Ein Restbefund gehört nicht zu diesem Umbau, steht aber weiterhin offen und trifft A-19.2:
`apps/outlook-addin/src/ui/TaskPane.tsx` kennt in `FIELD_LABEL` kein `dueDate`; ein 422 des
Dienstes erscheint dort als „dueDate: …". Von T-247 gemeldet, nicht behoben.

### 1.3 Notiz-Trennung (A-7.2, A-7.4, R-06)

Unversehrt, und zwar auf allen vier Schichten:

- **Domäne.** `packages/domain/src/export.ts` trägt weiterhin `NoteBoundaryIsSealed`,
  `TodoSourcesAreCovered` und `ExportCandidateHasNoTodoNote`. T-261 hat `export.ts`
  ausdrücklich **nicht** geschnitten, mit der richtigen Begründung: Die sieben
  Typbehauptungen müssen neben den Typen stehen, die sie versiegeln, und
  `allowedExportSurfaceImports` ist absichtlich abschließend.
- **Der Schnitt, der nicht gemacht wurde.** `export-status.ts` liegt bewußt **nicht** in
  `export.ts`. Hätte domain-dev es dort abgelegt, sähe `packages/export` über
  `@takt/domain/export` die Statusregel. Das ist die richtige Entscheidung und die
  spürbarste Sicherheitsleistung dieser Welle.
- **Oberfläche.** `shared/ui/NoteField.tsx:55/63/67` trägt beide Kopfbänder unverändert:
  „Verlässt SuperTakt · steht in der Abrechnung" gegen „Bleibt in SuperTakt. Wird nie
  exportiert — auch nicht über eine eigene Exportvorlage."
- **Vorschau.** `features/export/TemplatesScreen.tsx:544` hält den Satz „Der interne Vermerk
  eines Todos geht in keinen Export (A-7.2)."

### 1.4 Export von Anfang bis Ende (A-8.1 bis A-8.9)

Der Pflichtablauf ist über den Umbau vollständig geblieben. Die Bestätigung vor dem Lauf
(`features/export/ExportScreen.tsx:950`) hält SP-17 wörtlich; die zweite Zusage
(„Die Datei landet in … und enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine
Verschlüsselung.", `:954`) steht ebenfalls. Der Vorlageneditor mit Vorschau auf **offene**
Buchungen (A-8.7) liegt geschlossen in `features/export/` — `TemplatesScreen`,
`TemplatePreview`, `TemplateFields`, `TemplateFieldRow`, `TemplateList`,
`exportTemplateModel.ts` —, was er vorher nicht war.

### 1.5 Exportstatus überall sichtbar (A-6.5 bis A-6.7, A-8.6)

`shared/ui/ExportStatus.tsx` wird von sieben Flächen gelesen: Dashboard, Todo-Detail,
Zeiterfassung, Buchungsübersicht, Exportgruppen, Exportprotokoll und — über
`shared/ui/ExportSummaryStrip.tsx` — der Kanban-Karte; dazu die globale Suche über
`ExportStatusMarker`. Das ist mehr, nicht weniger als vorher: Der Umbau hat den Baustein aus
`components/` nach `shared/ui/` gehoben und dabei keinen Aufrufer verloren.

### 1.6 Timer auf erledigtem Todo (A-2.5, I-05)

Fachlich unversehrt. `determineReopen` ist in `time-entry.ts` geblieben (nicht mit dem
Exportstatus mitgewandert — richtig, es ist Timer-Regel). Die Oberfläche kündigt die Wirkung
an fünf Stellen an: `TimeScreen.tsx:207/231`, `TodoListScreen.tsx:567`, `BoardScreen.tsx:45`,
`PoolFormDialog.tsx:639`, `DashboardScreen.tsx:312`. Der Toast nach der Tat
(`lib/labels.ts:279` `reactivationTitle`, SP-16 erste Hälfte) steht zeichengleich.

**Was fehlt, steht unter B-02:** die zweite Hälfte von SP-16 — der Satz in S-03, der sagt,
daß **SuperTakt** das Kennzeichen aufgehoben hat und nicht der Benutzer.

### 1.7 Ordnerbaum vier Ebenen tief, Selbstverschiebung verhindert (A-4.6, E-022)

`checkFolderMove` ist bei der Teilung von `tag.ts` **in `tag.ts` geblieben** — die
Zyklusprüfung gehört zum Baum, nicht zum Pool. `tests/e2e/tags-folders.spec.ts:41` und `:190`
zeigen weiterhin richtig dorthin; das ist einer der wenigen Anker, die den Umbau überlebt
haben, und domain-dev hat es ausdrücklich gegengeprüft. `features/tags/TagTree.tsx` ist
verschoben, nicht geändert.

### 1.8 Standard-Tags auf jedem Erstellungsweg (A-9.5)

Beide Wege gemessen:

- Hauptanwendung: `apps/local-api/src/features/todos/todos.ts:156` ruft `applyDefaultTags`.
- Add-in: `apps/local-api/src/routes/addin/service.ts:459` ruft **dieselbe** Funktion aus
  `@takt/domain`. `service.ts:398` sagt das auch so.

`applyDefaultTags` ist bei der Teilung in `tag.ts` geblieben. Ich halte das für richtig —
„welche Tags bekommt ein neues Todo" ist eine Aussage über Tags — und stimme domain-devs
Annahme 2 ausdrücklich zu.

---

## 2 B-02 — die Sperrliste steht nicht mehr so im Bestand

**Das ist der Befund, den der Auftrag beschrieben hat: eine zeichengleiche Zahl über einer
anderen Menge.** Er ist nicht theoretisch.

### 2.1 Kein Lauf mißt die Sperrliste der Hauptanwendung

Gemessen am Quelltext der Nachweisläufe:

- `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 20 mißt eine Sperrliste — **die des
  Aufgabenbereichs**, `docs/design/textbestand-aufgabenbereich.md` Abschnitt 5.1, Einträge
  SP-A-01 bis SP-A-27. Und selbst dort steht im Kopf: „Was hier **nicht** gemessen wird: die
  ganze Sperrliste."
- Für `docs/design/textbestand.md`, also SP-01 bis SP-22 der **Hauptanwendung**, gibt es
  keinen Lauf. T-200 hat das seinerzeit selbst notiert.
- `proof:foreign` und `proof:surface` gehen mit `readdirSync` rekursiv über `apps/web/src` und
  zählen **Quelldateien, behandelte Übergaben, Eingabefelder, Live-Regionen, Stilblätter**.
  Keine dieser Größen ändert sich, wenn man einem `<p>` einen Satz herausnimmt. Die vier
  Berichte, die „174 Übergaben und 29 Live-Regionen zeichengleich" als Nachweis dafür
  anführen, „daß über dieselbe Oberfläche geurteilt wurde", belegen genau das nicht.

### 2.2 Drei Einträge weichen ab

Alle 21 Sperrlisteneinträge am Gegenstand gesucht. Achtzehn stehen — SP-01, SP-02, SP-04,
SP-06, SP-07, SP-08, SP-09, SP-10, SP-11, SP-12, SP-13, SP-14, SP-15, SP-17, SP-18, SP-19
(einschließlich der sichtbaren Fläche `status-admin__blocked`, die T-180 ausdrücklich zum
Träger erklärt hat), SP-20, SP-21. Drei nicht:

| Eintrag | Papier verlangt | Bestand heute | Fundort heute |
|---|---|---|---|
| **SP-03** | „Ein Todo ohne Frist steht **in beiden Richtungen** am Ende. Es hat keinen Wert, keinen frühesten und keinen spätesten." | „Bei Fristsortierung stehen Todos ohne Frist am Ende." | `features/todos/TodoListFilters.tsx:88` |
| **SP-05** | „… sie steht in keinem Export." **und** „Keine Frist gesetzt. Dieses Todo ist deshalb weder überfällig noch heute fällig — es hat schlicht keinen dieser Zustände." | nur „Keine Frist gesetzt." Die Fristkarte hat **keine** `description` mehr | `features/todos/TodoDetailAside.tsx:54-72` |
| **SP-16**, zweite Hälfte | „Der Timerstart hat das Kennzeichen aufgehoben — Takt hat das getan, nicht Sie." | nirgends im Bestand | — (erste Hälfte steht: `lib/labels.ts:279`) |

Gegenprobe über den ganzen Baum einschließlich `tests/**`: „weder überfällig", „schlicht
keinen dieser Zustände", „Timerstart hat das Kennzeichen", „nicht Sie", „in beiden
Richtungen" — **kein Treffer in einer Quell- oder Prüfdatei.** Sie stehen nur noch in
`docs/design/textbestand.md` und in drei alten Prüferberichten.

Der tragende Halbsatz von SP-05 ist derselbe, den T-165 (G-6) namentlich als tragend
festgehalten hat: Er unterscheidet **„kein Zustand"** von **„Zustand unbekannt"**. A-19.5
sagt ihn wörtlich. Er ist nicht Beiwerk.

### 2.3 Wer es getan hat, kann ich nicht sagen — und das ist Teil des Befunds

Ohne `git log -S` kann ich den Zeitpunkt nicht bestimmen. Was ich sagen kann:

- **Für die Wellen spricht:** T-251 hat `TodoDetailScreen.tsx` geteilt und `TodoDetailAside.tsx`
  angelegt; genau dort stehen SP-05 und SP-16. T-251 behauptet einen **Mengenvergleich** gegen
  `git show HEAD:…` mit „kein Ausdruck geändert" — ein Mengenvergleich fände eine gelöschte
  Zeile. Wenn diese Messung stimmt, war der Satz vorher schon weg.
- **Gegen die Wellen spricht** die Formatierung: `<p className="muted">` / Zeilenumbruch /
  „Keine Frist gesetzt." / Zeilenumbruch / `</p>` für einen 20-Zeichen-Satz. So schreibt
  niemand eine Zeile hin; so sieht eine Zeile aus, aus der etwas herausgenommen wurde.
- **Zuletzt nachweislich vorhanden** waren beide Sätze in T-195 und T-203 (beide sagen
  „unangetastet"). Dazwischen liegen T-209 und die Pull Requests #5 bis #16, die
  **außerhalb des Wellenmodells** entstanden sind und 208 Dateien angefaßt haben — darunter
  jede Marke „Takt" → „SuperTakt", also jede dieser Zeichenketten.

Meine Einschätzung: **wahrscheinlich vor T-249, wahrscheinlich in den ungetorten Pull
Requests.** Aber das ändert nichts an der Blockade. Die Welle hat als ihre Hauptzusage
ausgegeben, kein Oberflächentext habe sich geändert; diese Zusage ist gegen die einzige
Instanz, die Oberflächentexte festhält, **nicht geprüft worden**, und diese Instanz weicht ab.

### 2.4 Was ich verlange

1. `git log -S "schlicht keinen dieser Zustände"` und `git log -S "nicht Sie"` über
   `apps/web/src` — drei Minuten, und die Frage ist entschieden. Ergebnis ins Board.
2. Fiel es in T-249 bis T-263: zurücknehmen, **Streichung und Ausgleich in einem Auftrag**
   (E-081 Punkt 4).
3. Fiel es vorher ohne Entscheidung: wiederherstellen — die drei Sätze sind gesperrt, und
   ein Sperrlisteneintrag fällt nur mit Zustimmung des Prüfers, der ihn verlangt hat
   (E-078 Punkt 3). **Ich gebe sie nicht frei.**
4. Unabhängig vom Ausgang: `docs/design/textbestand.md` bekommt Anker über den **Wortlaut**
   statt über `Datei:Zeile` (die Spalte „Wortlaut (Anfang)" gibt es schon, T-203 hat sie
   genau dafür eingeführt) — und die Hauptanwendung bekommt, was der Aufgabenbereich seit
   T-196 hat: einen Lauf, der die Sperrliste mißt. Ohne ihn wiederholt sich dieser Befund,
   und zwar unbemerkt.

---

## 3 Die Kommentar-Trennlinie — Urteil Fall für Fall

Maßstab, wie vom Auftraggeber gesetzt: **bleibt**, was eine Wiederholung verhindert oder
erklärt, warum der heutige Code überrascht; **wandert** nach `docs/decisions/` die
Vorgeschichte; **fällt**, was der Code selbst sagt. Und: ein Satz, den ein Prüfer verlangt
hat, fällt nur mit dessen Zustimmung (E-078 Punkt 3).

**Vorbemerkung zur Prüfregel selbst.** Die Agenten haben durchweg mechanisch nach dem
Anfang „Bis T-…" / „Vor …" sortiert. Das ist ein brauchbarer **Sucher** und ein untauglicher
**Maßstab**. Der Maßstab ist eine Frage über die Zukunft: *Wenn dieser Absatz weg ist, baut
dann jemand den Fehler wieder ein?* Ein Absatz, der mit „Bis dahin" beginnt und mit einer
Plattformtatsache endet, bleibt; ein Absatz, der mit einer Regel beginnt und dann nur noch
erzählt, wandert. Nach diesem Maßstab urteile ich unten — und komme deshalb an zwei Stellen
zu einem anderen Ergebnis als die mechanische Sortierung erwarten ließe.

### 3.1 Die zwei aus Welle 1 — `features/tags/TagAdministration.tsx`

**Fall 1 — `:462-475`, der Block über `description` und `consequence` des Löschdialogs.
Urteil: BLEIBT, ungekürzt und ungeteilt.**

Er beginnt mit „Vorwarnung und Absage sind seit T-118 zwei Eigenschaften (B-5 aus T-116,
SC 4.1.3)" — das ist keine Vorgeschichte, das ist die Regel samt Deckung. Der Absatz mit
„Bis dahin trugen beide dieselbe: `deleteError ?? Vorwarnung`" ist der einzige Ort im
Bestand, an dem steht, **warum** man sie nicht wieder zusammenlegen darf: *„eine Beschreibung
wird nicht erneut vorgelesen, wenn sie sich ändert."* Das ist eine Plattformtatsache, keine
Erinnerung. Und der Meßteil, den frontend-dev verschieben wollte („Gehört hat sie nur den
neuen Knopfnamen ‚Erneut versuchen' und kein Wort davon, **warum**"), ist der **Beleg** für
diese Tatsache. Nimmt man ihn heraus, bleibt eine nackte Behauptung über eine Vorlesehilfe
stehen, und der nächste Leser glaubt sie nicht — mit Recht, denn nichts stützt sie mehr.

Zwei Zeilen zusammenzulegen ist eine Aufräumung, die jeder Codeprüfer vorschlägt. Genau
deshalb steht der Absatz da. **Zerlegen zerstört ihn**; Zusammenhang ist hier die Funktion.
Die Deckung (B-5 aus T-116, SC 4.1.3) macht ihn zusätzlich zu einer Prüferauflage — E-078
Punkt 3 greift, und ich stimme der Kürzung nicht zu.

**Fall 2 — `:58-67`, `nameTouched`, „(Befund O-DZ, T-167.)". Urteil: BLEIBT, ganz,
einschließlich des Befundkürzels.**

frontend-dev hat richtig gehandelt, indem er beides stehenließ, und die Begründung ist
ebenfalls richtig: Ein Befundkürzel ist kein Absatz Vorgeschichte. Es steht in derselben
Klasse wie `A-4.3`, `E-055`, `SC 3.3.1` — es ist **Deckung**, nicht Erzählung. Der Rumpf
(„Drei Dialoge teilen sich `name`, und in allen dreien ist die Schaltfläche bei leerem Feld
gesperrt — `onSubmit` läuft also nie, und eine Meldung, die dort entstünde, sähe niemand")
ist der Musterfall von „erklärt, warum der heutige Code überrascht": Ohne ihn ist die
Prüfung beim Verlassen des Feldes eine Merkwürdigkeit, die jemand bei nächster Gelegenheit
nach `onSubmit` zurückschiebt — und dann prüft nichts mehr.

Damit sind beide offenen Fragen aus T-250 (und die Wiedervorlage in T-253) **beantwortet:
nichts ändern.** Sie brauchen nicht in die nächste Welle.

### 3.2 Die sechs aus Welle 4 — `features/board/**`

Alle sechs am Gegenstand gelesen. **Urteil: alle sechs bleiben.** Vier davon ohnehin,
weil ein Prüfer sie verlangt hat; die anderen zwei bestehen den Maßstab aus eigener Kraft.

| # | Stelle | Urteil | Grund |
|---|---|---|---|
| 1 | `BoardScreen.tsx:77-83` „## Was hier nicht mehr steht" | **bleibt** | Eine Grabinschrift über `DRAG_MIME`, `draggable`, `dropColumn`, `moveByOffset`. Sie sagt nicht, was war, sondern **wohin es gegangen ist** („Der Status wird in S-02 und S-03 geändert; das Kartenmenü führt dorthin"). Ohne sie baut jemand aus bester Absicht das Ziehen neu — und A-5.2 ist mit E-054 aufgehoben. Reine Wiederholungsverhinderung. |
| 2 | `Kanban.tsx:18-28` „## Warum hier nichts mehr gezogen wird" | **bleibt, unantastbar** | Trägt die **Zusage zu SC 2.5.7**: „Was es nicht gibt, braucht keine Ersatzbedienung." Ein Satz, der eine Barrierefreiheitsanforderung als *erfüllt durch Abwesenheit* erklärt, ist selbst der Nachweis. Fällt er, steht eine unbelegte Lücke im Bestand. Zusätzlich erklärt der Absatz die Sachlage: Eine Regel über fünf Bedingungen läßt sich nicht durch Verschieben umkehren, ohne Tags zu setzen, und das hat der Auftraggeber ausgeschlossen. |
| 3 | `BoardScreen.tsx:358-371`, am `lead` | **bleibt** (Prüferauflage, T-177 Abschnitt 1.1: „Der Satz bleibt ungekuerzt") | E-078 Punkt 3. Der Kommentar sagt zusätzlich selbst, warum: einzige Stelle, an der erklärt wird, warum A-5.2 seit E-054 nicht mehr gilt. |
| 4 | `BoardEmptyState.tsx:89-…`, der Ausgleichsnachweis zu UM-08 | **bleibt** (Prüferauflage, E-081 Punkt 4) | Er nennt für jeden der vier gestrichenen Punkte den heutigen Träger, darunter **SP-22** auf der Sperrliste. Das ist der Nachweis, unter dem die Streichung überhaupt zulässig war. Ihn zu entfernen hübe die Streichung nachträglich auf. **Und angesichts von B-02 ist er das Muster, nach dem es überall aussehen müßte.** |
| 5 | `BoardEmptyState.tsx:65-79`, am `description` | **bleibt** (Prüferauflage Z-07 Punkt 1) | Er nennt die Stelle, an der die Auflage gemessen wird (`tests/e2e/board-empty-state-rule-chain.spec.ts`, TP-KANBAN-08), und begründet das selbst: „Ein Kommentar, der die Erfuellung einer Auflage behauptet, nennt entweder die Stelle, an der sie gemessen wird, oder er behauptet sie nicht." Dem ist nichts hinzuzufügen. |
| 6 | `BoardSetupDialog.tsx:25-40`, am `description={RULE_IS_A_RULE}` | **bleibt** (dieselbe Auflage, zweite Stelle) | Beide Stellen der Kette müssen sie tragen, sonst zerfällt sie beim nächsten Schnitt an einer der beiden Dateien. |

**Nichts wandert.** Ein Ausgleichsnachweis nach `docs/decisions/` zu verschieben ist genau
der Griff, gegen den E-081 Punkt 4 geschrieben wurde: Der Nachweis gehört an die Stelle, an
der die Streichung stattfand, sonst findet ihn niemand, der die Lücke bemerkt.

**Nichts fällt.** Von den sechs sagt keiner etwas, was der Code selbst sagt — vier sprechen
über **Abwesenheiten**, und eine Abwesenheit kann der Code grundsätzlich nicht selbst sagen.

### 3.3 Die vierzehn „Bis T-…"-Stellen in `packages/domain`

**Urteil: alle vierzehn bleiben.** Ich habe die Tabelle in `docs/decisions/domain.md`
Abschnitt 3 gegen den Maßstab gehalten, und sie hält ihn — nicht weil domain-dev es
behauptet, sondern weil die Spalte, die er geführt hat, die **richtige** Frage beantwortet:
Sie nennt für jede Stelle nicht „was war", sondern **was ohne sie wiederkäme**. Das ist
genau der Maßstab, und er ist vierzehnmal erfüllt. Drei zur Probe:

- `kernel.ts` — „Bis T-042 rechnete der SQLite-Adapter selbst: `date(started_at) >= date(?)`."
  Ohne diesen Satz erfindet der nächste Adapter den Tagesbegriff neu, und die **Tagessumme
  wird auf der falschen Seite gerundet**. Das trifft E-020, E-025 und A-8.3 zugleich — Geld.
  Wäre er nach `docs/decisions/` gewandert, stünde er nicht mehr dort, wo der nächste Adapter
  entsteht.
- `attachment.ts` — „Bis T-159 stand hier ein `if (host !== '')`, das diese Zusage ein
  zweites Mal prüfte — ein Kommentar in Codeform, den kein Prüffall erreichen kann." Der
  Satz **ist** der Grund, warum an dieser Stelle heute kein Code steht. Ein Kommentar, der
  eine Abwesenheit begründet, ist die einzige mögliche Form dieser Auskunft.
- `pool-movement.ts` — „Bis T-107 stand hier als Begründung, zwei Pools dürften denselben
  Namen tragen. Das ist falsch." Eine widerlegte Begründung, die dokumentiert widerlegt sein
  muß, sonst kommt sie zurück.

Das Papier `docs/decisions/domain.md` hat damit die richtige Aufgabe bekommen: Es hält die
**Entscheidung** und die gezählten Gründe fest, nicht die Sätze. Eine spätere Runde muß die
Prüfung nicht wiederholen. Das ist genau das Ergebnis, das der Auftraggeber wollte.

Ein Nachtrag, der nicht in die Trennlinie fällt, aber hierher gehört: T-261 hat einen
**Selbstverweis** behoben (`pool-movement.ts` zeigte an zwei Stellen auf sich selbst, weil
T-257 `usecases/` im Domänenkommentar wegkürzte) und die Lehre daraus in das Papier
geschrieben — ein Pfad über eine Paketgrenze wird voll geschrieben. Richtig, und genau die
Sorte Regel, die aus einem Umbau folgen soll.

### 3.4 Die zwei nachgezogenen Prüffalltitel

**Urteil: beide bleiben in der neuen Fassung. Die Nachziehung war richtig und ist am
Gegenstand belegt.**

Gegengeprüft, nicht geglaubt:

| Titel | Behauptet | Am Gegenstand |
|---|---|---|
| `liveRegionsAlwaysRendered.test.ts:118` „ExportSettings.tsx — die Meldefläche des Exportordners" | `role="status"` mit `field__error` liegt in `features/settings/ExportSettings.tsx` | **trifft** — `ExportSettings.tsx:147` `<p className="field__error" role="status">`; der Prüffall parst genau diese Datei |
| `:142` „TemplateFieldRow.tsx — derselbe Griff, ohne eigene Klasse am Behälter" | `role="alert"` liegt in `features/export/TemplateFieldRow.tsx` | **trifft** — `TemplateFieldRow.tsx:234` `<div role="alert">` |

Gegenprobe gegen die naheliegende Falle: `features/settings/SettingsScreen.tsx:264` trägt
zwar ebenfalls ein `role="status"`, aber **ohne** `field__error` — der Titel greift also
nicht am falschen der beiden.

**E-087 greift hier nicht.** Ein Prüffalltitel ist weder Oberflächentext noch zugänglicher
Name; er erscheint im Bericht des Läufers, nicht auf dem Bildschirm. Die Zahl 1570 steht
zeichengleich, es ist also kein Fall dazugekommen und keiner weggefallen — nur umbenannt.
Ein Titel, der eine Datei nennt, die es nicht gibt, ist schlimmer als kein Titel: Er schickt
den Prüfer an einen Ort, an dem nichts ist. Die Nachziehung war Pflicht, nicht Kür.

---

## 4 B-01 — der Widerspruch in `packages/domain/src/export-status.ts`

### 4.1 Der Befund, nachgemessen

| Stelle | Wortlaut | Bild |
|---|---|---|
| `:56-58` am Typ `ExportStatusTransition` | „Erlaubte Übergänge. **Es gibt genau drei**, und jeder hat einen Auslöser, der protokolliert wird." | drei Pfeile: `export_run`, `not_billed`, `reset` |
| `:208-211` an `checkExportStatusTransition` | „**Es gibt genau zwei** erlaubte Übergänge, und jeder hat genau einen Auslöser" | zwei Pfeile — `not_billed` fehlt |

Die Union `:83-86` hat **drei** Glieder. Die Umsetzung `:226-254` hat **drei** Zweige.

### 4.2 Welches Bild stimmt — und warum die Frage überhaupt entschieden werden kann

**Das erste Bild stimmt. Es sind drei.** Drei unabhängige Belege:

1. **E-047 ist entschieden und umgesetzt.** „Nicht abrechnen" ersetzt E-037; der Exportstatus
   geht auf `exported`, weil zweiwertig zweiwertig bleibt (E-032). Der Auslöser `not_billed`
   ist ein eigener und wandert bis in `export_audit.event` (`ExportAuditEvent` `:121` nennt
   ihn). E-050 baut darauf einen vierten **Anzeige**zustand auf. Fällt der dritte Zweig,
   fallen E-047 und E-050 mit.
2. **Der falsche Block widerlegt sich selbst.** Vier Zeilen unter „genau zwei" steht:
   „‚Nicht abrechnen' (E-047) führt deshalb nicht am Wächter vorbei, sondern **durch ihn
   hindurch** — mit eigenem Auslöser und eigenem Ereignistyp im Protokoll." Und im selben
   Absatz: „`open -> exported` ohne einen **der beiden** vorgesehenen Auslöser" — zwei
   Auslöser auf **einen** Zielwert, das sind mit `reset` genau drei Übergänge. Der Rumpf des
   Blocks ist bei E-047 nachgezogen worden; **nur der Eröffnungssatz und das ASCII-Bild sind
   stehengeblieben.**
3. **Herkunft.** domain-dev hat angenommen, der Satz stamme aus einer Prüferrunde
   (E-047-Nachtrag), und ihn deshalb nach E-078 Punkt 3 nicht angefaßt. **Die Annahme ist
   falsch, und ich habe es nachgesehen.** Der Wortlaut steht erstmals in
   `.claude/team/reports/T-009-domain-dev.md:129` — „`checkExportStatusTransition` kennt
   genau zwei erlaubte Übergänge" —, also im **eigenen** Bericht des domain-dev aus dem
   Erstentwurf, lange vor E-047 (T-029). Kein Prüferbericht verlangt diesen Wortlaut; über
   alle Berichte gesucht, kein einziger Treffer.

**E-078 Punkt 3 greift hier also nicht.** Die Vorsicht war trotzdem richtig — sie zu üben
kostete einen Bericht, sie zu unterlassen hätte einen Prüfersatz gekostet. Genau so soll es
laufen.

### 4.3 Entscheidung und Auflage

**Der Eröffnungssatz und das zweizeilige Bild in `checkExportStatusTransition` fallen und
werden durch die richtige Darstellung ersetzt.** Ich gebe das hiermit frei — als der Prüfer,
dessen Zustimmung im Zweifel nötig gewesen wäre.

Auflagen, damit daraus nicht der nächste stille Widerspruch wird:

1. **Nicht doppeln, sondern zeigen.** Der Umsetzungsblock soll die Übergänge nicht ein
   zweites Mal aufzählen, sondern auf `ExportStatusTransition` verweisen — „die drei
   erlaubten Übergänge stehen am Typ" — und sich auf das beschränken, was nur hier steht:
   warum der Auslöser Teil der Bedingung ist, und E-032 als Abwesenheit. **Eine Regel, die
   zweimal beschrieben ist, läuft ein zweites Mal auseinander.** Das ist der eigentliche
   Befund, und domain-dev hat ihn richtig benannt: Es sind **acht** solche Doppelungen im
   Paket (`checkFolderMove`, `matchesPool`, `isVisibleInPool`, `applyDefaultTags`,
   `determineReopen`, `isLocked`, `checkExportStatusTransition`, `roundToQuarterHours`). Bei
   `isLocked` steht sie jetzt sogar zweimal in **derselben** Datei (`:97-106` und `:195-203`),
   nahezu wortgleich. Sieben sind heute noch deckungsgleich; das ist kein Verdienst, sondern
   Glück.
2. **Ein Prüffall über die Zahl.** `packages/domain/test/export-status.test.ts` soll die
   Menge der erlaubten Übergänge als Menge messen (drei, paarweise verschieden, jeder mit
   seinem Auslöser) — dann wird ein vierter Zweig oder ein weggefallener dritter rot, statt
   nur einen Kommentar zu widerlegen. `packages/domain/test/attachment.test.ts` hat mit
   „genau drei Arten" das Muster schon.
3. **Ein Auftrag**, Streichung und Ausgleich zusammen (E-081 Punkt 4).

**Warum das nicht warten kann.** Hier wird entschieden, ob eine Buchung als abgerechnet
gilt. Ein Kommentar, der zwei Zweige zeichnet, während drei dastehen, ist die Bauart, an der
jemand den dritten für überflüssig hält. Der dritte ist E-047. Fällt er, wird eine bewußt
nicht abgerechnete Zeit wieder exportierbar — und das trifft A-6.5, A-6.9, E-032, E-047,
E-050 und R-10 auf einmal.

---

## 5 Zeilenanker in Dokumenten — die vollständige Liste

Gezählt: **78 Stellen in acht Dokumenten** plus **58 Stellen in 34 Quell-, Prüf- und
Skriptdateien**. Ich trenne, wie verlangt, nach **Zusage** (die Aussage wird durch den Umzug
inhaltlich falsch) und **Fundort** (der Zeiger geht ins Leere, die Aussage bleibt wahr).

### 5.1 Anker, die eine Zusage tragen — inhaltlich falsch

| # | Stelle | Zusage | Heute | Hoheit |
|---|---|---|---|---|
| Z-01 | `docs/architektur.md:35` (Schaubild) | „Anwendungsfälle · `apps/local-api/src/anwendung/`" — der Ort der Transaktionsgrenze | Verzeichnis existiert nicht. Richtig: `src/features/<merkmal>/<merkmal>.ts` (steht 250 Zeilen tiefer, `:290-292`, korrekt) | domain-dev |
| Z-02 | `docs/bedrohungsmodell.md:3206` | zwei Anker in **einem** Satz: `packages/domain/src/time-entry.ts:607` (Aufzählungswert `orphan_discarded`) und `usecases/timer.ts:547` (Durchreichen des Grundes statt Neusetzen) | erster Anker durch den T-261-Schnitt verschoben; zweite Datei existiert seit T-257 nicht | security-checker |
| Z-03 | `docs/bedrohungsmodell.md:5093` | „genau **zwei** Aufrufer: den Anwendungsfall beim Anlegen (`usecases/attachments.ts:179`) und …" — eine **gezählte** Zusage | → `features/todos/attachments.ts` | security-checker |
| Z-04 | `docs/bedrohungsmodell.md:5126-5127` | Reihenfolgezusage „erst lesen, dann …" über `usecases/attachments.ts:212/263` und `usecases/todos.ts:362` | → `features/todos/attachments.ts`, `features/todos/todos.ts` | security-checker |
| Z-05 | `docs/bedrohungsmodell.md:6054` | „`usecases/image-sweep.ts` … Es ist die **einzige** …" | → `features/todos/image-sweep.ts` | security-checker |
| Z-06 | `docs/bedrohungsmodell.md:6518` | „(`usecases/attachments.ts`): Sie hält den Wert aus dem Bestand heraus, **solange** …" | → `features/todos/attachments.ts` | security-checker |
| Z-07 | `docs/bedrohungsmodell.md:7290` | „Zweiter Typwächter am Katalog. `apps/local-api/src/usecases/export-catalog.ts` führt …" | Datei **umgezogen und umbenannt**: `features/export/catalog.ts`. Auch eine Wortsuche findet sie nicht mehr | security-checker |
| Z-08 | `docs/bedrohungsmodell.md:9642-9643` | „`usecases/data-transfer.ts:546`, `usecases/attachments.ts:220`. **Kein Diff, keine Verschiebung**, kein zweiter Aufrufer." | Die Zusage sagt wörtlich „keine Verschiebung" — und beide Dateien sind verschoben. **Selbstwiderlegend** | security-checker |
| Z-09 | `docs/bedrohungsmodell.md:9607` | „`apps/web/src/components/Attachments.tsx:82` sagen weiterhin **richtig**, daß über das Add-in keine Anhänge entstehen" | Datei → `features/todos/Attachments.tsx`; **und der Sachverhalt selbst hat sich mit E-100 geändert** (A-10.9 neu gefaßt, die Route ist gefallen) | security-checker |
| Z-10 | `docs/bedrohungsmodell.md:3712` | `apps/web/src/components/Foreign.tsx` setzt fremden Text in `<bdi>` (E-063) | → `shared/ui/Foreign.tsx` | security-checker |
| Z-11 | `docs/bedrohungsmodell.md:5050` | `apps/web/src/components/AttachmentOpenDialog.tsx` — A-A-6, R-21, „jede an einer benennbaren Stelle: voller Pfad …" (trägt SP-01/SP-02) | → `features/todos/AttachmentOpenDialog.tsx` | security-checker |
| Z-12 | `docs/bedrohungsmodell.md:7264` | „**Sechs** Texte in `apps/web/src/components/NoteField.tsx`, **drei je Feldart**" — gezählte Zusage, SP-09 | → `shared/ui/NoteField.tsx` | security-checker |
| Z-13 | `docs/bedrohungsmodell.md:2716, 2875, 2957, 3163, 3184, 3192, 3246, 3578` | acht Stellen über `usecases/pool-movement.ts:152/379/381`, `usecases/timer.ts:670`, `usecases/todos.ts:325`; darunter „**acht** Aufrufstellen, **ein** `resolveAxes` je Regel" (T-112-H1) und „rechnet die Bewegung in **derselben** Transaktion" | → `apps/local-api/src/pool-movement.ts`, `features/timer/{timer,bookings}.ts`, `features/todos/todos.ts` | security-checker |
| Z-14 | `docs/design/textbestand.md:948-969` | **die ganze Sperrliste SP-01 bis SP-21** — Anker durchweg `components/`/`screens/` mit Zeilennummer | jede Datei umgezogen; drei Einträge zusätzlich **inhaltlich** falsch (B-02) | ux-designer |
| Z-15 | `docs/design/textbestand.md:2468-2469` | gezähltes Verzeichnis der „Bitte"-Stellen: **4** im Produkt (`app/TimerContext.tsx`, `components/Select.tsx`, `screens/TemplatesScreen.tsx`, `api/client.ts`), **11** im Dienst (`usecases/export.ts`, `usecases/tag-names.ts`, …) | fünf der acht genannten Pfade existieren nicht mehr; die **Zahlen** sind die Zusage | ux-designer |
| Z-16 | `docs/design/textbestand.md:2301-2302` | „`previewExport` (`apps/local-api/src/usecases/export.ts`) … `export_directory_missing` entsteht in `runExport` und in `usecases/structure.ts`, **nicht in der Vorschau**" | → `features/export/export.ts`, `features/structure/structure.ts` | ux-designer |
| Z-17 | `docs/design/traeger-und-zusage.md` (23 Stellen) | Das Papier ist der Nachweis, **welcher sichtbare Träger** eine Unterscheidung trägt — jede Zeile ist eine Zusage. Schwerste: `components/ExportStatus.tsx:44-49/48/185-187` (vier Anzeigezustände, sechs Merkmale), `components/NoteField.tsx:22, 29-30` (SP-09-Merkmal), `screens/parts.tsx:185-190` (`tone="danger"`), `components/ExportGroups.tsx:303-319/255-260` (ein Knopf statt zwei, R-6), `components/Primitives.tsx:70, 73, 132` (Fokusring auf genau zwei Füllungen), `components/DialogSurface.tsx:339-342/341` (`finalFocusEl`), `screens/ExportScreen.tsx:672-681/1236-1243`, `screens/TemplatePreview.tsx:590-597`, `screens/BoardScreen.tsx:395/1046-1053` | sämtlich → `shared/ui/**`, `features/**` | ux-designer / ui-designer |
| Z-18 | `apps/web/src/lib/labels.ts:36` und `:325` | „`PoolMatchMode` in `tag.ts`" | Typ steht seit T-261 in `pool.ts`. **Von T-261 an frontend-dev gemeldet, nicht behoben.** `:77` (`time-entry.ts` für den Exportstatus-Wertebereich) bleibt richtig | frontend-dev |
| Z-19 | `packages/export/src/template.ts:80` | „Dienstes (`apps/local-api/src/usecases/export-catalog.ts`) beschriftet" — die Zusage, **wer** die Feldbeschriftung führt | → `features/export/catalog.ts` | integration-dev |
| Z-20 | `apps/local-api/src/routes/addin/service.ts` (**zehn** Stellen: `:210, 225, 286, 354, 413, 414, 451, 478, 582, 654`) | durchweg Zusagen über **Gleichheit**: „dieselbe Funktion, die auch `createTodo` in `usecases/todos.ts` benutzt", „dieselbe Reihenfolge wie in `usecases/todos.ts`", „Es gibt **keine zweite** Schreibstelle" — das ist der Nachweis für A-9.5 und A-10.9 | alle → `features/todos/todos.ts`, `tag-names.ts`, `pool-movement.ts`. **Die Aussagen stimmen, die Zeiger nicht.** Der Prüfer, der „keine zweite Schreibstelle" nachrechnen will, findet die erste nicht | integration-dev |

### 5.2 Anker, die nur einen Fundort nennen — falsch, aber ohne Behauptung

- `docs/testplan.md:2114, 2435, 2683, 2745, 4080, 4162, 4337, 4405` (8) — e2e-tester
- `docs/design/textbestand.md:462, 925-927, 3017, 3067-3069` (7) — ux-designer
- `docs/design/textabbau-gestalt.md:836` sowie die von T-250 gemeldeten `:340-342`, `:1167` (3) — ux-designer
- `docs/entwicklerhandbuch.md` (1), `docs/decisions/board.md` (1) — documenter bzw. frontend-dev
- `docs/glossar.md` (1) — documenter
- `tests/e2e/**`: `pool-movement-sentence.spec.ts:7, 121`, `done-movement-announcement.spec.ts:9, 11`, `manual-booking-movement.spec.ts:15, 34, 163`, `timer-stop-announcement.spec.ts:143, 219`, `focus-return-after-dialog.spec.ts:18, 19`, `field-live-region-announcement.spec.ts:4`, `attachment-persistence-live.spec.ts:103, 133, 147`, `tag-input.spec.ts:2`, `shell-quit-failure.spec.ts:7`, `support/db.ts:14`, `support/bidi.ts:8` (20) — e2e-tester
- `apps/outlook-addin/scripts/proof-addin.mjs` (7), `fixtures.mjs` (1), `apps/outlook-addin/src/duplicate/{rule,reopen}.ts` (2) — integration-dev
- `apps/web/src/api/types.ts:772`, `features/timer/TimerContext.tsx:262`, `features/timer/api.ts:90`, `features/board/BoardScreen.tsx:200`, `packages/domain/src/{tag-name,enumeration}.ts`, `apps/desktop/src/shell.ts:179` (7)

**Ausdrücklich richtig und nicht anzufassen** (Vergangenheitsform über einen vergangenen
Zustand): `apps/local-api/src/context.ts:28` („Bis T-257 stand hier …"),
`apps/local-api/scripts/proof-layers.mjs:14`, `docs/architektur.md:305-306`,
`apps/local-api/test/usecases/{pool-movement,image-sweep,attachment-input-validation}.test.ts`
(„entstand in T-089 und hatte …"), `apps/web/test/features/export/templatesScreenBeginCopy.test.ts:44`
(`git show HEAD:…`). T-260 hat diese Unterscheidung — Gegenwartsaussage gegen Geschichte —
sauber gezogen; ich bestätige sie.

### 5.3 Der strukturelle Rest, den niemand gemeldet hat

**`apps/local-api/test/` trägt weiterhin einen Ordner `usecases/`** — den Namen eines
Verzeichnisses, das T-257 aufgelöst hat. T-260 hat `apps/web/test/` an
`apps/web/src/features/**` angeglichen und `apps/local-api/test/` **nicht**. Damit spiegelt
die eine Hälfte des Prüfbaums die neue Struktur und die andere eine, die es nicht mehr gibt.
Das ist keine Zusage und kein roter Lauf, aber es macht die Hälfte der Arbeit von T-260
wieder zunichte: Wer heute den Prüffall zu `features/timer/bookings.ts` sucht, findet ihn
unter `test/usecases/time-entry-movement.test.ts`. Gehört unit-tester.

### 5.4 Die Lehre, und sie ist nicht neu

T-261 hat sie gemessen und ich bestätige sie: **Zwei von drei geprüften Zeilenankern waren
schon vor dem Umbau falsch** (`tag.ts:946` stand auf 979, `tag.ts:1003` auf 1036 — je 33
Zeilen daneben). Ein Anker auf eine Zeilennummer ist ein Anker auf einen Stand, nicht auf
eine Sache. Vorschlag für alle vier Hoheitsinhaber, in **einem** Auftrag je Papier: **den
Bezeichner nennen, nicht die Zeile** — `decideOrphanedTimer` in
`packages/domain/src/time-entry.ts`, nicht `time-entry.ts:607`. Ein Bezeichner überlebt jeden
Schnitt und ist außerdem suchbar; eine Zeilennummer ist beides nicht. Für
`docs/design/textbestand.md` heißt dasselbe: über den **Wortlaut** ankern, wie E-087 es für
Streichungen ohnehin verlangt.

---

## 6 Befunde in Berichtsform

```
A-ID          Screen/Flow              Abweichung / Vorschlag
```

**Blockierend**

```
B-01  A-6.9, E-012, E-032, E-047, E-050, R-10
      Fachlogik Exportstatus (packages/domain/src/export-status.ts:208-211)
      Abweichung: Der Kommentar an `checkExportStatusTransition` sagt „genau zwei
        erlaubte Übergänge" und zeichnet zwei Pfeile; Typ, Union und Code haben drei.
        Der fehlende ist `not_billed` (E-047). Derselbe Block beschreibt E-047 vier
        Zeilen tiefer korrekt — nur Eröffnungssatz und Bild sind stehengeblieben.
        Der Wortlaut stammt aus T-009 (Erstentwurf, vor E-047) und nicht aus einer
        Prüferrunde; E-078 Punkt 3 greift nicht.
      Vorschlag: Eröffnungssatz und ASCII-Bild fallen — hiermit freigegeben. Ersatz
        ist ein Verweis auf `ExportStatusTransition` statt einer zweiten Aufzählung.
        Dazu ein Prüffall, der die Übergangsmenge als Menge mißt (drei, paarweise
        verschieden, je eigener Auslöser). Ein Auftrag, E-081 Punkt 4.
```

```
B-02  A-19.5, A-19.20, A-2.5, E-070 Punkt 4, E-074 Punkt 2, I-05, E-081 Punkt 4
      S-02 Todo-Liste (Sortierhinweis) · S-03 Todo-Detail (Fristkarte, Erledigt-Fläche)
      Abweichung: Drei Sperrlisteneinträge stehen nicht mehr so im Bestand, wie
        docs/design/textbestand.md sie festhält — SP-03 gekürzt („in beiden
        Richtungen" und der zweite Satz fehlen), SP-05 halbiert (die Fristkarte hat
        keine `description` mehr; der tragende Halbsatz „es hat schlicht keinen
        dieser Zustände", wörtlich aus A-19.5, fehlt), SP-16 halbiert (der Satz in
        S-03 fehlt ganz; nur der Toast in labels.ts:279 steht). Kein Nachweislauf
        mißt diese Sperrliste — proof:foreign und proof:surface zählen Dateien,
        Übergaben und Live-Regionen, nicht Sätze. Die zeichengleichen Zahlen der
        vier Wellenberichte können die Zusage „kein Oberflächentext geändert"
        deshalb nicht tragen. Zeitpunkt ohne git nicht bestimmbar; die
        Mengenvergleiche in T-251/T-253 sprechen für „vor dieser Welle", die
        Formatierung von TodoDetailAside.tsx:65-68 dagegen.
      Vorschlag: (1) `git log -S` über die drei Wortlaute, Ergebnis ins Board.
        (2) Fiel es in dieser Welle: zurücknehmen. Fiel es vorher ohne Entscheidung:
        wiederherstellen — ich gebe keinen der drei frei (E-078 Punkt 3).
        (3) Sperrliste über den Wortlaut ankern statt über Datei:Zeile.
        (4) Ein Nachweislauf für docs/design/textbestand.md, nach dem Muster von
        proof:addin Abschnitt 20. Ohne ihn wiederholt sich der Befund unbemerkt.
```

**Nicht blockierend**

```
V-01  A-9.5, A-10.9   S-12 Add-in, Anlegeweg
      Abweichung: apps/local-api/src/routes/addin/service.ts nennt an zehn Stellen
        `usecases/…` — genau dort, wo die Gleichheit beider Anlegewege zugesagt wird
        („dieselbe Funktion", „dieselbe Reihenfolge", „keine zweite Schreibstelle").
        Die Aussagen stimmen, die Zeiger gehen ins Leere. Der Nachweis für A-9.5 ist
        damit nicht mehr nachvollziehbar, nur noch richtig.
      Vorschlag: integration-dev zieht die zehn Pfade nach, in einem Auftrag mit Z-19
        (packages/export/src/template.ts:80).

V-02  R-21, R-22, A-19.16 bis A-19.18, A-A-6, A-A-13, A-A-18, A-A-21
      Bedrohungsmodell
      Abweichung: Dreizehn Anker mit Zusage zeigen ins Leere (Z-02 bis Z-13). Zwei
        Sonderfälle: `usecases/export-catalog.ts` ist umgezogen **und** umbenannt
        (heute features/export/catalog.ts) — auch eine Wortsuche findet es nicht.
        Und der Satz an :9642 sagt wörtlich „keine Verschiebung" über eine Datei,
        die verschoben wurde; er widerlegt sich selbst. Dazu :9607, wo mit E-100
        auch der Sachverhalt gewechselt hat.
      Vorschlag: security-checker in einem Auftrag; Anker über Bezeichner statt
        Zeilennummer.

V-03  E-078, E-081, SC-Belege   Designpapiere
      Abweichung: docs/design/traeger-und-zusage.md (23), textbestand.md (18 plus
        die Sperrliste), textabbau-gestalt.md (3) nennen `components/`- und
        `screens/`-Pfade mit Zeilennummern. Das Papier heißt „Träger und Zusage" —
        jede seiner Zeilen ist eine Zusage darüber, welcher sichtbare Träger eine
        Unterscheidung trägt. Zwei gezählte Zusagen sind besonders betroffen: die
        vier Anzeigezustände in ExportStatus.tsx:44-49 und die „sechs Texte, drei je
        Feldart" in NoteField.tsx.
      Vorschlag: ux-designer und ui-designer, je eigenes Artefakt. Über Bezeichner
        und Wortlaut ankern.

V-04  —   Prüfbaum
      Abweichung: apps/web/test/ ist von T-260 an features/** angeglichen,
        apps/local-api/test/usecases/ nicht — der Ordner trägt den Namen eines
        Verzeichnisses, das T-257 aufgelöst hat.
      Vorschlag: unit-tester, gleiche Bewegung wie T-260 für apps/web/test/.

V-05  —   apps/web/src/lib/labels.ts:36, :325
      Abweichung: nennt `tag.ts` als Ort von `PoolMatchMode`; steht seit T-261 in
        pool.ts. Von T-261 an frontend-dev gemeldet, offen.
      Vorschlag: zwei Zeilen, frontend-dev.

V-06  A-6.9, E-012   packages/domain, Bauart
      Abweichung: Acht Regeln tragen zwei Beschreibungen (am Funktionstyp und an der
        Umsetzung), die einander paraphrasieren. Bei `isLocked` stehen sie nach dem
        Schnitt nahezu wortgleich in derselben Datei, hundert Zeilen auseinander.
        Bei `checkExportStatusTransition` sind sie auseinandergelaufen — das ist B-01.
        Sieben sind heute noch deckungsgleich; das ist Glück, keine Bauart.
      Vorschlag: Die Umsetzungsbeschreibung sagt, was nur an der Umsetzung gilt, und
        verweist im übrigen auf den Typ. Eigener Auftrag, nicht in dieser Welle.

V-07  A-19.2   S-12 Aufgabenbereich
      Abweichung: FIELD_LABEL in apps/outlook-addin/src/ui/TaskPane.tsx kennt
        `dueDate` nicht; ein 422 mit details[].field="dueDate" erscheint deutsch als
        „dueDate: …". Vorbestehend, von T-247 gemeldet.
      Vorschlag: `dueDate: 'Frist'` — A-19.2 nennt genau dieses Wort.
```

---

## 7 Was diese Welle ausdrücklich gut gemacht hat

Ich schreibe das nicht als Höflichkeit, sondern weil zwei Entscheidungen später als
Präzedenz gebraucht werden:

1. **`export.ts` und `kernel.ts` sind nicht geschnitten worden, obwohl beides naheliegt.**
   In beiden Fällen hätte der Schnitt eine Sicherheitsschranke geöffnet — bei `export.ts` die
   absichtlich abschließende `allowedExportSurfaceImports`, bei `kernel.ts` dieselbe Liste um
   einen dritten Eintrag. domain-dev hat den Schnitt an `kernel.ts` bereits entschieden gehabt
   und **nach der Messung umgeworfen**. Eine Liste zu öffnen, deren Kommentar sagt, sie sei
   abschließend, für eine Umsortierung — das ist der Griff, an dem eine Umstrukturierung
   üblicherweise Schaden anrichtet. Er ist unterblieben.
2. **`attachment.rs` ist nicht geschnitten worden, und Δ = 0 ist als Ergebnis geliefert
   worden.** Die größte Datei des Rust-Baums hat den fünftkleinsten Produktivteil; ein Schnitt
   hätte `OPEN_CALL_SITES` in `proof-shell-surface.mjs` verlangt — also die Prüfung der
   Prüfung. Die Messung als Lieferung zu behandeln statt einen Umbau zu erfinden, ist die
   richtige Antwort auf „nur aufteilen, wo mehrere Verantwortlichkeiten liegen".
3. **Vier Agenten haben gesammelt statt entschieden**, wo eine Prüferauflage im Spiel war.
   Bei B-01 hat sich diese Vorsicht als überflüssig herausgestellt — die Annahme über die
   Herkunft war falsch. Sie war trotzdem richtig: Sie kostete einen Absatz im Bericht, das
   Gegenteil hätte einen Prüfersatz gekostet.

---

## Urteil

**Nacharbeit.** Blockierend: **B-01** und **B-02**.

Die Umstrukturierung selbst — der Zuschnitt in Merkmale, die acht Ordner je Anwendung, die
zwei Schnitte in `packages/domain`, die Nichtschnitte in Rust und an der Exportfläche, die
Angleichung von `apps/web/test/` — **gebe ich frei**. Sie trifft die Spezifikation an jeder
Stelle, an der ich sie gemessen habe, sie macht die Anforderungen leichter auffindbar als
vorher, und sie hat keine Sicherheitsschranke geöffnet.

Was ich **nicht** freigebe, ist die Zusage, mit der sie geliefert wurde. „Kein
Oberflächentext hat sich geändert" ist über 21 gesperrte Sätze **nicht gemessen worden**,
und drei davon stimmen heute nicht mit dem Papier überein. Ob diese Welle sie genommen hat
oder eine frühere, ist mit einem `git log -S` in drei Minuten entschieden — solange das
nicht dasteht, steht die Zusage ohne Träger. Ein zeichengleicher Zähler über Dateien,
Übergaben und Live-Regionen ist kein Nachweis über Sätze; das ist derselbe Fehler, den der
Auftrag heute schon viermal gefunden hat, nur eine Ebene höher.

B-01 ist entschieden und braucht nur noch Ausführung: **Es sind drei Übergänge**, der
zweite Kommentar ist falsch, er fällt mit meiner Zustimmung, und er fällt zusammen mit
seinem Ersatz und einem Prüffall in **einem** Auftrag.

Beide zusammen sind eine kleine Welle. Danach gebe ich vollständig frei.

## Annahmen

1. **Ich habe nichts gefahren.** Alle Aussagen sind am Quelltext gelesen. Wo ein Lauf oder
   `git` nötig gewesen wäre, steht das dabei (B-02 Punkt 2.3, V-02 Sonderfälle).
2. **Ich habe die Zahlen der Wellenberichte nicht nachgemessen** und benutze sie nirgends
   als Beleg — im Gegenteil, B-02 ist die Feststellung, daß sie das Behauptete nicht messen.
3. **SP-22** habe ich nicht am Gegenstand geprüft: Er ist ein Handbuchabsatz
   (`docs/benutzerhandbuch.md`), kein Oberflächentext, und liegt außerhalb des Umbaus. Sein
   Ausgleichsnachweis in `BoardEmptyState.tsx` steht (Punkt 3.2 Fall 4).
4. **A-10.9 und E-100** habe ich als geltenden Stand gelesen: `docs/spec.md:204-213` ist am
   2026-09-10 neu gefaßt, die Route `routes/addin/attachments.ts` existiert nicht mehr.
   `CLAUDE.md` beschreibt F-21 noch als offen — das gehört dem Orchestrator, ich melde es nur.
5. **Der Dateiname `DeadlineFlag.tsx`** ist kein A-19.2-Verstoß (Bezeichner sind englisch).

## Offene Fragen

1. **An den Orchestrator, zu B-02:** Wer fährt `git log -S`? Ohne das Ergebnis kann ich die
   Welle nicht abschließen, und ich kann es selbst nicht.
2. **An den Orchestrator:** Bekommt `docs/design/textbestand.md` einen Nachweislauf? Das ist
   eine Grundsatzfrage, keine Aufräumung — der Aufgabenbereich hat seit T-196 einen, die
   Hauptanwendung nie. Der Umfang wäre `proof:addin` Abschnitt 20, übertragen.
3. **An den Orchestrator:** Die 136 toten Anker aus Punkt 5 verteilen sich auf fünf
   Hoheitsinhaber. Ein Auftrag je Papier oder eine gemeinsame Welle? Ich rate zu je einem —
   sie gehören verschiedenen Agenten, und die Papiere sind Einzeldateien.
4. **An `CLAUDE.md`, also den Orchestrator:** Der Abschnitt „Ungedeckt gebaut — der offene
   Widerspruch an A-19.19" ist mit E-100 überholt. Solange er dasteht, arbeitet der nächste
   Agent nach einer aufgehobenen Sperre.

## Nächster Schritt

Eine kleine Welle mit drei Aufträgen, parallel:

1. **domain-dev, B-01** — `export-status.ts:205-225` berichtigen, Verweis auf den Typ statt
   zweiter Aufzählung; **unit-tester** im selben Auftrag: Mengenprüffall über die drei
   Übergänge in `packages/domain/test/export-status.test.ts`.
2. **Orchestrator, B-02** — `git log -S` über die drei Wortlaute; je nach Ergebnis Auftrag an
   frontend-dev (Wiederherstellung) oder Eintrag ins Board, dazu die Grundsatzfrage aus
   Offener Frage 2.
3. **integration-dev, V-01 + Z-19** — die elf Anker in `routes/addin/service.ts` und
   `packages/export/src/template.ts`.

`V-02` bis `V-07` in die Welle danach; keiner davon hält etwas auf.
