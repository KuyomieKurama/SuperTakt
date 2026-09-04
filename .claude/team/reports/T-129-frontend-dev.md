# T-129 — Ein Nachweis, der sieht, was am Baustein unsichtbar wird

Aufgabe: T-129 — Ein Nachweis, der sieht, was am Baustein unsichtbar wird
Status: fertig
Rolle: frontend-dev
Stand: Branch `status-als-regelterm`, Basis `3f45d51`

Gelesen: `CLAUDE.md`, `.claude/team/decisions.md` (**E-063**, alle fünf Punkte), der eigene
Bericht T-124 (Risiko R3 und offene Frage 3), T-123 (Abschnitte 2 und 4 — das Vorbild
`proof-addin.mjs` 16/17 und die Gegenprobe mit `sha256sum -c`). Dazu die Quellen, gegen die
gearbeitet wurde: `apps/web/src/api/types.ts`, `components/Foreign.tsx`, `lib/foreign.ts`,
`apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 17.

---

## 1. Der Befund, um den es geht

T-124 hat 175 Behandlungen gesetzt und im selben Bericht gesagt, warum das nicht reicht (R3):
Sitzt die Behandlung im Anzeigebaustein, ist sie an der Aufrufstelle unsichtbar. Es kommt etwas
dazu, das schwerer wiegt: **Für gewöhnliche Namen ist jede dieser Behandlungen die Identität.**
`visibleText("Ost")` ist `"Ost"`, `quoteName` setzt dieselben Anführungszeichen wie die Hand. Eine
vergessene Stelle verhält sich in jedem Test genau wie eine behandelte — sie fällt erst auf, wenn
jemand einen Titel mit `U+202E` anlegt, und dann fällt sie dem Benutzer auf.

Das ist E-063 Punkt 5 in seiner Reinform: Ein Ergebnisvergleich wird erst rot, wenn der Schaden
schon da ist. Gefragt ist nicht „liefern zwei Wege dasselbe?", sondern „gibt es den zweiten Weg?"

**Der Nachweis hat den Befund bestätigt.** Er fand elf rohe Anzeigestellen, die T-124 an 175
behandelten Stellen vorbei übersehen hatte — darunter die Begründung und der Auslöser jeder
Exportzurücksetzung, der Titel und die Call-Nummer in derselben Zeile, drei Regelnamen auf dem
Board und der Wert jeder Zelle in der Exportvorschau. Die Liste steht in Abschnitt 4.

---

## 2. Wie „fremd" bestimmt wird — und warum nicht über eine Liste

Der nächstliegende Weg wäre eine Liste von Feldnamen im Nachweis: `title`, `note`, `name`,
`callNumber`. Genau diese Bauart ist zwischen T-117 und T-119 fünf Wellen lang schiefgegangen
(E-063 Punkt 4). Eine abgeschriebene Aufzählung kann nur hinterherhinken, und sie hinkt still.

**Die Herkunft steht deshalb im Typ.** `apps/web/src/api/types.ts` — die eine Datei, in der die
Antworten des Dienstes beschrieben sind — führt seit dieser Aufgabe ein Vokabular:

| Name | Was er sagt | Behandlung |
|---|---|---|
| `ForeignText` | jemand anderes hat den Text geschrieben, der Dienst liefert ihn nur | **Pflicht** vor der Anzeige |
| `DraftText` | der Benutzer dieser Oberfläche schreibt ihn gerade | **verboten** (E-063 Punkt 1) |
| `ServiceText` | deutscher Anzeigetext unseres eigenen Dienstes | keine |
| `TechnicalKey` | englischer technischer Schlüssel | keine |
| `FileSystemPath` | Pfad aus dem Dateisystem | eigene Regeln (`lib/pathInspection.ts`) |
| `ColorValue`, `PageCursor`, `SecretText` | Farbe, Fortsetzungsmarke, Geheimnis | keine |

`ForeignText` ist `string & { readonly __foreignText?: undefined }` — eine **leere, freiwillige**
Marke: nichts zur Laufzeit, nichts an der Zuweisbarkeit, kein Übersetzungsfehler irgendwo. Sie ist
ausschließlich dafür da, dass der Nachweis den Übersetzer nach der Herkunft fragen kann. Und der
Übersetzer führt sie mit: durch Bindungen, Zerlegungen, Reihen, Felder, Parameter und Rückgaben.

**Kein Feld dieser Datei heißt mehr bloß `string`** — 55 Felder tragen jetzt einen Namen aus dem
Vokabular, und der Nachweis wird rot, sobald wieder ein nacktes `string` dasteht. Das ist die
zweite Hälfte und die wichtigere: Ein neues Feld `readonly subject: string` wäre für jede Prüfung
darunter unsichtbar. Jetzt zwingt es zu einer Entscheidung.

**Auch die Menge der Behandlungen ist keine Liste.** Der Nachweis kennt keinen einzigen
Funktionsnamen; er liest Signaturen. Eine Behandlung ist alles, was `ForeignText` annimmt und
`string` zurückgibt — `quotedName`, `foreignText` und die Eigenschaft `value` von `<Foreign>`. Wer
eine vierte baut und sie so deklariert, wird ohne Änderung am Nachweis anerkannt. Wer `quotedName`
auf `string` verbreitert, macht ihn **rot** und nicht grün: Ihre 103 Aufrufstellen gelten dann
wieder als roh.

---

## 3. Was der Nachweis prüft — zehn Zeilen in fünf Abschnitten

`apps/web/scripts/proof-foreign.mjs`, 789 Zeilen, Laufzeit **3,1 s**. Er baut das Programm aus
**der** `tsconfig.json` der Oberfläche und nicht aus einer eigenen Schalterliste — ein Nachweis mit
eigenen Übersetzerschaltern wäre eine zweite Fassung der Übersetzung, dieselbe Sackgasse eine
Ebene höher.

| Abschnitt | Prüfungen |
|---|---|
| **1 Die Herkunft steht an einem Ort** | kein nacktes `string` in `api/types.ts`; `ForeignText`/`DraftText` tragen ihre Marke, `ServiceText` und die übrigen nicht; die Klasse ist nicht leer und nicht alles; die drei Behandlungen nehmen fremden Text an und geben gewöhnlichen zurück |
| **2 Kein fremder Wert steht roh in der Anzeige** | Inhalt eines JSX-Elements, Textattribute eines HTML-Elements, jede Eigenschaft eines Bausteins; dazu die Zeile „und der Durchlauf ist nicht leer gelaufen" |
| **3 Kein fremder Wert wird roh in einen Satz eingebaut** | `${…}` und `+`, auch in `.ts`-Dateien ohne ein einziges JSX-Element |
| **4 Die Herkunft geht unterwegs nicht verloren** | Argumente an eigene Funktionen; Felder von Objektliteralen und getypte Bindungen |
| **5 Eingabefelder bleiben unbehandelt** | die Gegenrichtung, E-063 Punkt 1 |

**Abschnitt 2 ist die Antwort auf T-124 R3, und sie ist eine Zeile:** Nimmt ein Baustein fremden
Text an, sagt er es in seiner Signatur (`readonly label: ForeignText`). Dann ist die Übergabe an
der Aufrufstelle **sichtbar** — und der Nachweis prüft das Innere des Bausteins, weil der Wert
dort weiterhin fremd ist. Führt die Eigenschaft `string`, ist an der Aufrufstelle nicht zu sehen,
was mit dem Wert geschieht; genau das soll nicht mehr vorkommen.

**Abschnitt 4 ist der, ohne den die anderen hohl wären.** `app/exportAudit.ts` baute aus der
Antwort des Dienstes ein Zeilenmodell mit `readonly reason: string`. Von dort an war der Wert für
jede denkbare Prüfung gewöhnlicher Text — und `components/ExportAudit.tsx` zeigte ihn roh an, samt
Titel, Call-Nummer und dem Namen dessen, der die Buchung zurückgesetzt hat. **Vier Anzeigestellen,
unsichtbar hinter einer einzigen Zuweisung.** Sie wurden erst sichtbar, als Abschnitt 4 stand.

Zwei Ziele sind dabei erlaubt, und beide sagen etwas: `ForeignText` (die Herkunft bleibt) und
`DraftText` (sie geht **absichtlich** verloren, weil der Wert ab hier im Eingabefeld des Benutzers
steht). Der zweite ist der einzige zulässige Ausstieg, und er steht sichtbar im Typ.

### Die schwierige Hälfte: die Abgrenzung

Ein Nachweis, der zu viel findet, wird abgeschaltet. Vier Regeln halten ihn ruhig, und jede hat
einen Grund:

| Nicht verfolgt | Warum |
|---|---|
| **Funktionen als Eigenschaftswert** (`onClick={() => start(todo.title)}`) | Was ein Baustein später aufruft, ist keine Anzeige. Das JSX in ihrem Rumpf wird trotzdem geprüft — der Durchlauf besucht jedes JSX-Element, gleich wie tief. |
| **Die Bedingung** einer Fallunterscheidung, die linke Seite von `&&` | Sie entscheiden, was gezeigt wird, und werden nicht selbst gezeigt. |
| **Ketten, die keinen Text mehr ergeben** (`note.length === 0`, `title.toLowerCase().includes(…)`) | Von einem fremden Wert wird nach oben gestiegen, solange er Objekt eines Zugriffs oder Empfänger eines Aufrufs ist. Ist am Ende keine Zeichenkette mehr, wird er benutzt und nicht gezeigt. `title.trim()` bleibt dagegen ein Fund. |
| **`key` und `ref`** | React verbraucht sie selbst; sie erscheinen nie auf dem Bildschirm. |

Ohne diese vier zeigte der erste Lauf 59 Funde, von denen 36 keine waren. Mit ihnen sind es 23,
von denen jeder einer war.

Die Liste der **Textattribute** (`title`, `alt`, `placeholder`, `aria-label`, `aria-placeholder`,
`aria-description`, `aria-roledescription`, `aria-valuetext`) ist die einzige von Hand geführte
Aufzählung im Nachweis. Sie ist keine Aussage über fremde Werte, sondern darüber, was ein Browser
vorliest — `aria-labelledby` steht nicht darin, weil es Kennungen trägt und keinen Text.

---

## 4. Was er gefunden hat

Elf rohe Anzeigestellen und sieben Sätze, alle behoben. **Keine davon hätte ein Test gemeldet.**

| Stelle | Was roh dastand |
|---|---|
| `components/ExportAudit.tsx` ×4 | Begründung und Auslöser einer Zurücksetzung, Titel und Call-Nummer der Buchung |
| `screens/BoardScreen.tsx` ×3 | drei Regelnamen in den Listen „Vorhandene Regeln" und „Vorhandene Pool-Regeln" |
| `screens/TimeScreen.tsx`, `screens/TodoListScreen.tsx` | `Call {todo.callNumber}` |
| `screens/StatusSettings.tsx` | der Statusname im verdeckten Text „für neue Todos — „…"" |
| `screens/TagsScreen.tsx` | der Name des gewählten Tags oder Ordners in der Überschrift |
| `components/ExportGroups.tsx`, `components/Kanban.tsx` | die Call-Nummer auf der Gruppe und auf der Karte |
| `components/ExportRowPanes.tsx` | **der Wert jeder Zelle der Exportvorschau** — hier steht der Titel, wenn die Vorlage ihn abbildet |
| `showcase/BoardSection.tsx` ×7, `showcase/ExportPreviewSection.tsx` | Kartentitel in Ansagen der `role="status"`-Region |
| `app/GlobalSearch.tsx` | die Call-Nummer in der Detailzeile eines Treffers |
| `screens/TodoDetailScreen.tsx` | `Call ${todo.callNumber}` im Untertitel |

Die **Call-Nummer** war in T-124 mit Begründung ausgenommen: `checkCallNumber` lässt nur
`A-Z a-z 0-9 . _ / -` durch (E-045). Der Auftrag zählt sie zu den fremden Werten, und ich halte
das für richtig — aus zwei Gründen, deren zweiter schwerer wiegt. Der Vorrat ist an der
**heutigen** Tür geschlossen, nicht im Bestand (T-124 R4). Und eine Ausnahme wäre eine Stelle, an
der die Regel nicht gilt: Sie müsste im Nachweis stehen, gepflegt werden und könnte veralten. Eine
Identität kostet nichts. Der Kommentar an `TodoDetailScreen` sagt das jetzt so.

Damit die Prüfung überhaupt bis dorthin sehen konnte, mussten **21 Träger** ihre Herkunft behalten
(Abschnitt 4 des Nachweises): das Zeilenmodell der Exportprüfliste, `RuleLookup` und `RuleChip`,
`TagTreeNode`, `KanbanCardData`, `ExportGroupData`, `ActiveFilter`, `Suggestion`, die Auswahl im
Tag-Baum, `StructureApi.statusName`/`ruleName`, die drei `Map<Id, ForeignText>` in
`StructureContext`, die acht `todoTitle`-Parameter in `TimerContext`, `TagPath.segments`,
`BillingUserFact.user` und die vier `todoTitle` der Buchungsdialoge.

---

## 5. Gegenprobe — sieben Fälle, jeder einzeln gemessen

Ohne sie ist ein Wächter eine Behauptung. Jede Datei vorher gesichert, danach über
`sha256sum -c` **bytegleich** wiederhergestellt.

| Fall | Eingriff | Ergebnis |
|---|---|---|
| **A** | `<Foreign value={todo.title} />` → `{todo.title}` | Endstatus 1, „kein fremder Wert steht roh im JSX" |
| **B** | `TagChip.label: ForeignText` → `string` | Endstatus 1, dieselbe Zeile — die Übergabe an den Baustein ist wieder roh |
| **C** | `<Foreign value={model.actor} />` → `` {`Ausgelöst von ${model.actor}`} `` | Endstatus 1, **zwei** Zeilen (Abschnitt 2 und 3) |
| **D** | `ExportAuditRowModel.reason: ForeignText` → `string` | Endstatus 1, „kein fremder Wert wird in ein Feld ohne Herkunft geschrieben" |
| **E** | **die Marke aus `ForeignText` entfernt** | Endstatus 1, **vier** Zeilen: die Marke fehlt, der Titel gilt als eigen, `quotedName` nimmt keinen fremden Text mehr an, und „nur **0** behandelte Übergaben gesehen" |
| **F** | ein neues Feld `readonly subject: string` in `Todo` | Endstatus 1, „nacktes `string` in api/types.ts: api/types.ts:219" |
| **G** | `reactivationTitle(todoTitle: ForeignText)` → `string` | Endstatus 1, „keine eigene Funktion nimmt fremden Text an, ohne es zu sagen", mit beiden Aufrufstellen |

**Fall E ist der wichtigste.** Er ist die Antwort auf die Frage, die T-123 in seiner Gegenprobe A
gestellt hat: Was passiert, wenn jemand dem Wächter das Werkzeug wegnimmt? Ohne die Zeile „und der
Durchlauf ist nicht leer gelaufen" wären in diesem Fall alle Prüfungen **grün** geworden — und
zwar lautlos. Sie zählt die tatsächlich behandelten Übergaben (heute 138) und die geladenen
Quelldateien (100) und wird rot, wenn eines von beidem einbricht.

```
sha256sum -c: alle 6 Dateien OK, Endstatus 0
```

---

## 6. Nachweis

Jeder Befehl einzeln, Ausgabe in eine Datei umgeleitet, Endstatus unmittelbar danach gelesen —
keine Pipe. Alle Läufe **nach** der letzten Änderung.

| Befehl | Endstatus | Ergebnis |
|---|---|---|
| `pnpm typecheck` | **0** | 8 Pakete, 7 Testkonfigurationen, `tests/e2e` |
| `npx vitest run apps/web/test` | **0** | 5 Dateien, **71/71** |
| `pnpm --filter @takt/web build` | **0** | 128,60 kB CSS, 680,27 kB JS (+0,20 kB) |
| `pnpm --filter @takt/web build:designsystem` | **0** | Musterseite übersetzt |
| `pnpm --filter @takt/web contrast` | **0** | **0 von 432** Paaren durchgefallen |
| `node apps/web/scripts/proof-foreign.mjs` | **0** | **10 bestanden, 0 fehlgeschlagen**, 3,1 s |
| Gegenproben A–G | **je 1** | siehe Abschnitt 5 |

**Hygiene:** eigene Messung über alle 32 berührten Dateien — kein rohes Steuer-, Richtungs- oder
unsichtbares Zeichen (T-112-H2). Keine echte Call-Nummer, kein Kundenname, keine Zugangsdaten.

**Zur Umgebung:** Auf 17843/17844 lief während dieser Aufgabe ein fremder Node-Prozess (PID
673220) — der lokale Dienst eines parallel arbeitenden Agenten. Er ist **nicht** von mir und
**nicht** beendet worden. Zwischenzeitlich standen in `packages/domain` Übersetzungsfehler aus
einem laufenden fremden Schreibvorgang; sie sind ohne mein Zutun verschwunden, und der
abschließende `pnpm typecheck` ist grün. Kein `git commit`, kein `stash`, kein `checkout`.

---

## 7. Artefakte

| Datei | Was |
|---|---|
| `apps/web/scripts/proof-foreign.mjs` | **neu.** Der Nachweis, 789 Zeilen, 10 Prüfungen in 5 Abschnitten |
| `apps/web/src/api/types.ts` | das Herkunftsvokabular; 55 Felder klassifiziert, kein nacktes `string` mehr |
| `apps/web/src/components/Foreign.tsx` | `value: ForeignText`; ruft `foreignText` statt unmittelbar `visibleText` — eine Stelle, an der die Domäne betreten wird, statt zwei |
| `apps/web/src/lib/foreign.ts` | `quotedName`/`foreignText` nehmen `ForeignText`; der Vertrag, an dem der Nachweis sie erkennt, steht im Kopf |
| `components/ExportAudit.tsx`, `ExportGroups.tsx`, `ExportRowPanes.tsx`, `Kanban.tsx` | vier rohe Anzeigestellen behoben, dazu die Zelle der Exportvorschau |
| `screens/BoardScreen.tsx`, `StatusSettings.tsx`, `TagsScreen.tsx`, `TimeScreen.tsx`, `TodoListScreen.tsx`, `TodoDetailScreen.tsx` | sieben rohe Anzeigestellen behoben |
| `app/GlobalSearch.tsx`, `showcase/BoardSection.tsx`, `showcase/ExportPreviewSection.tsx` | acht rohe Sätze behoben |
| `app/StructureContext.tsx`, `app/TimerContext.tsx`, `app/exportAudit.ts`, `components/FilterBar.tsx`, `Tag.tsx`, `TagInput.tsx`, `TagTree.tsx`, `Timer.tsx`, `WorkstationFacts.tsx`, `lib/labels.ts`, `lib/poolRule.ts`, `app/undoDone.ts`, `screens/BookingDialogs.tsx`, `BookingsScreen.tsx`, `TemplatesScreen.tsx` | 21 Träger behalten ihre Herkunft |
| `.claude/team/reports/T-129-frontend-dev.md` | dieser Bericht |

31 Dateien, +350/−159. **Nicht angefasst:** `apps/web/test/**`, `tests/e2e/**`, `packages/**`,
`apps/local-api/**`, `apps/outlook-addin/**`, `apps/desktop/**`, `docs/**` und jede gemeinsame
Datei — einschließlich **`apps/web/package.json`** (siehe „Offene Fragen" 1).

---

## 8. Annahmen

1. **Die Herkunft steht im Typ und nicht in einer Liste im Nachweis.** Das ist die zentrale
   Entscheidung dieser Aufgabe. Sie kostet 55 geänderte Feldtypen in einer Datei und ändert
   nichts zur Laufzeit (die Marke ist freiwillig und leer, `pnpm typecheck` war nach dem ersten
   Schritt ohne eine einzige Anpassung grün). Der Gegenentwurf — eine gepflegte Namensliste —
   ist genau die Bauart, die E-063 Punkt 4 verbietet.
2. **Call-Nummern gelten als fremd**, entgegen der Ausnahme aus T-124. Begründung in Abschnitt 4.
3. **`DraftText` ist der einzige zulässige Ausstieg aus der Herkunft.** Wo fremder Text
   absichtlich zum Entwurf des Benutzers wird (der Vorlagenname im Formular), steht das im Typ
   und nicht in einem Kommentar.
4. **Der Umfang ist größer als „ein Skript".** Ich habe die 18 gefundenen Stellen **behoben** und
   die 21 Träger nachgezogen, statt sie nur zu melden. Ein Wächter, der beim ersten Lauf rot ist,
   wird abgeschaltet; und die Funde sind ohnehin genau die Arbeit, für die es ihn gibt.
5. **`showcase/**` wird mitgeprüft.** Die Musterseite zeigt echte Bausteine mit erfundenen Daten;
   eine rohe Stelle dort ist keine Sicherheitslücke, aber sie ist die Vorlage, von der abgeschrieben
   wird. Sieben Ansagen sind deshalb behandelt.
6. **Abschnitt 5 (Eingabefelder) misst nur HTML-Elemente**, nicht `NoteField`/`TextField`. Deren
   Inneres endet in einem `input`/`textarea` und wird dort erfasst; 20 Felder gefunden, und die
   Prüfung wird rot, wenn es weniger als sechs werden.

---

## 9. Risiken

**R1 — Was der Nachweis nicht sieht, und das gehört vollständig genannt.**

| Blinder Fleck | Warum, und was ihn abdeckt |
|---|---|
| **Fertige Sätze unseres Dienstes.** `ApiError.message` ist `ServiceText`; steht darin ein Regelname vom Dienst eingesetzt, ist er hier nicht mehr als fremd erkennbar. | Die Behandlung gehört an die Quelle. Für `poolMovementSentence` aus `@takt/domain` ist das seit T-124 offene Frage 2 und **unverändert offen**. |
| **Die `unknown`-Grenze.** `ExportTemplate.definition` ist `unknown`; was `lib/exportTemplateModel.ts` daraus auspackt — Feldnamen einer Vorlage — hat keine Herkunft mehr und wird angezeigt. | Der einzige echte Rest an Anzeigefläche, den der Nachweis nicht erreicht. Vorschlag unter „Offene Fragen" 3. |
| **Absichtliche Umgehungen:** `String(x)`, `JSON.stringify`, `as string`, `let x: string = …`. | Die letzte findet Abschnitt 4; die ersten drei stehen sichtbar im Quelltext und sind eine Handlung, kein Versehen. |
| **Fremde Funktionen.** Ein `foo(todo.title)` in einer Bibliothek, deren Parameter `string` heißt, verliert die Marke. | Abschnitt 4 prüft nur Funktionen **dieser** Oberfläche — nur was wir selbst schreiben, können wir selbst deklarieren. |
| **Der Bildschirm.** Dass ein `<bdi>` im ausgelieferten Bündel isoliert und ein `U+202E` die Leserichtung nicht mehr dreht, prüft dieser Nachweis nicht. | Gemessen in T-124 Abschnitt 5 (E-062) und beim e2e-tester (`tests/e2e/foreign-title-display.spec.ts`). |

**R2 — Die Marke ist freiwillig, also auch verzichtbar.** `string` ist nach `ForeignText`
zuweisbar. Wer ein Feld von Hand mit einer gewöhnlichen Zeichenkette füllt, bekommt keinen
Einspruch — das ist gewollt (die Musterseite und die Tests leben davon), heißt aber: Die Marke
sagt „hier **kann** fremder Text stehen", nicht „hier steht garantiert fremder". Für einen
Wächter ist das die richtige Richtung; für eine Garantie wäre es zu wenig.

**R3 — Ein Nachweis, der 3,1 s braucht, wird ungern lokal gestartet.** Er baut ein vollständiges
TypeScript-Programm; billiger geht es nicht, wenn Typen die Frage beantworten sollen. Er gehört
deshalb in `proof:all` und nicht in eine Schleife.

**R4 — Sicherheit, behoben:** Elf Stellen, an denen ein `U+202E` in einem Titel, einer
Leistung, einer Begründung, einem Regel- oder Tagnamen oder einer Call-Nummer die Anzeige der
Hauptanwendung umdrehen konnte, tun das nicht mehr. Die schwerste war
`components/ExportRowPanes.tsx`: **die Vorschau der Exportzeile** — jene Ansicht, an der ein
Benutzer prüft, was er gleich abrechnet.

**R5 — Sicherheit, offen und unverändert:** Das **Vermerkfeld** und alle Eingabefelder zeigen
fremden Text weiterhin, wie er ist (E-063 Punkt 1, gewollt). Abschnitt 5 des Nachweises hält das
jetzt **fest** — vorher war es eine Absprache, jetzt ist es gemessen.

**R6 — Der Diff ist groß** (31 Dateien), aber er zerfällt in drei Sorten, und nur die erste ist
Inhalt: 18 behobene Anzeigestellen, 21 nachgezogene Trägertypen, 55 klassifizierte Feldtypen. Die
lohnendste Stichprobe für den Code-Reviewer: `apps/web/scripts/proof-foreign.mjs` Abschnitte 0
und 4, `api/types.ts` Kopf, `components/ExportAudit.tsx`, `components/ExportRowPanes.tsx`.

---

## 10. Offene Fragen

1. **Der Eintrag in `package.json` fehlt und gehört dem Orchestrator.** Vorschlag, zwei Zeilen:
   - `apps/web/package.json`: `"proof:foreign": "node scripts/proof-foreign.mjs"`
   - Wurzel-`package.json`: `"proof:foreign": "pnpm --filter @takt/web proof:foreign"`, dazu
     `pnpm run proof:foreign` **vor** `proof:addin` in die Kette `proof:all`.

   Ich habe `apps/web/package.json` nicht angefasst, weil T-124 `apps/desktop/package.json`
   ebenso als gemeinsame Datei behandelt hat und der Auftrag den Eintrag ausdrücklich dem
   Orchestrator zuweist. Bis dahin läuft der Nachweis über
   `node apps/web/scripts/proof-foreign.mjs`.
2. **Verträgt E-063 einen sechsten Punkt?** Diese Aufgabe liefert die Begründung in einer Zahl:
   **175 behandelte Stellen und 71 grüne Tests haben elf rohe Anzeigestellen nicht bemerkt** —
   weil die Behandlung für gewöhnliche Namen die Identität ist. Wortlautvorschlag: „Wo eine
   Behandlung für den Normalfall die Identität ist, kann kein Verhaltenstest sie vermissen. Dann
   muss die **Pflicht** im Typ stehen und ein Wächter sie lesen." `decisions.md` gehört dem
   Orchestrator.
3. **Die `unknown`-Grenze an der Exportvorlage** (R1). `ExportTemplate.definition` ist `unknown`;
   `lib/exportTemplateModel.ts` packt daraus Feldnamen aus, die ein Benutzer geschrieben hat und
   die angezeigt werden. Sie sauber zu machen hieße, das Ergebnis des Auspackens mit
   `ForeignText` zu typen — meine Hoheit und eine überschaubare Arbeit, aber ein eigener Auftrag
   und nicht mehr diese Aufgabe.
4. **Soll `poolMovementSentence` die Behandlung mitnehmen?** Unverändert T-124 offene Frage 2 und
   der einzige Weg, auf dem ein fremder Name aus der **Domäne** ungeschützt in einen Satz
   kommt. Es ist domain-dev und ändert vierzehn zeichengenau geprüfte Sätze.
5. **Der Nachweis prüft `apps/web`, das Add-in prüft sich selbst.** Beide fragen inzwischen nach
   der Herkunft statt nach dem Ergebnis, aber mit verschiedenen Mitteln (Typmarke hier,
   Objektgleichheit dort). Das ist angemessen — die Fragen sind verschieden —, sollte aber
   jemandem auffallen, bevor er die eine für die Abschrift der anderen hält.

---

## 11. Nächster Schritt

1. **Orchestrator:** Frage 1 (zwei Zeilen `package.json`) und Frage 2 (E-063 Punkt 6).
2. **Code-Reviewer und security-checker:** Für den security-checker ist Abschnitt 5 dieses
   Berichts der Punkt — insbesondere Gegenprobe E, und die ehrliche Liste der blinden Flecken in
   R1. Für den Code-Reviewer die Stichprobe aus R6.
3. **e2e-tester:** `tests/e2e/foreign-title-display.spec.ts` deckt den Titel ab. Die zweite
   lohnende Fläche ist jetzt eine andere: **die Vorschau der Exportzeile** in
   `components/ExportRowPanes.tsx` und die **Prüfliste** in `components/ExportAudit.tsx`. Beide
   zeigten fremden Text bis heute roh, und beide sind Ansichten, an denen abgerechnet wird.
4. **unit-tester:** `lib/foreign.ts` ist unverändert im Verhalten, aber die Reihenfolge in
   `quotedName` (erst sichtbar machen, dann klammern) lohnt weiterhin eine reine Prüfung — der
   Vorschlag aus T-124 steht noch.
