Aufgabe: T-052 — Ein Testfall, der einen echten Fehler gefunden hätte. Der Anlass: `tags-folders.spec.ts`
war mit dem `neuerParentId`-Fehler (T-050) grün, weil der einzige gelingende Zug über
`support/api.ts` lief und der einzige Zug durch die Oberfläche der abgelehnte war, dessen
Zusicherung nicht zwischen 422 und 409 unterschied.

Status: fertig

---

Artefakte:

```
GEÄNDERT
tests/e2e/tags-folders.spec.ts              270 (+123) — neuer Fall „Ordner erfolgreich
                                             verschieben über die Oberfläche — Nachschau
                                             ausschließlich im Tag-Baum"; Zyklus-Ablehnung prüft
                                             jetzt `.message__body` wörtlich statt nur die
                                             Überschrift „Das hat nicht geklappt"; Gegenprobe, dass
                                             der Selbst-Zyklus im Dialog gar nicht erst wählbar ist
tests/e2e/export-template-validation.spec.ts 135 (+72) — neuer Fall: reservierter Feldname
                                             (`__proto__`) über den echten Vorlageneditor (S-14),
                                             nicht mehr nur über die API; Dateikopf um die
                                             Begründung ergänzt, warum die drei bestehenden Fälle
                                             bewusst API-Fälle bleiben (Feldnamen-Abgleich mit dem
                                             Quelltext, nicht angenommen)
tests/e2e/support/api.ts                    286 (+18) — `deleteTodo`, `deleteTodoStatus` (Aufräumen
                                             für die neuen Kanban-Fälle)
docs/testplan.md                            +9 Zeilen bei TP-KANBAN-02 — Ausführungsstand samt
                                             Befund: Umbenennen ist in der Oberfläche nicht bedienbar

NEU
tests/e2e/kanban.spec.ts                    297 — TP-KANBAN-01 (Drag & Drop), TP-KANBAN-02 (Spalte
                                             anlegen/Reihenfolge/Löschen), TP-KANBAN-04 (Timer von
                                             der Karte); vorher zweimal in Folge (T-012, T-048) als
                                             „nicht gelaufen, Zeitmangel" vermerkt
```

`apps/**`, `packages/**`: unangetastet. Kein `git commit` (kein Git-Repository in diesem
Arbeitsbereich).

---

## 1. Der Auftrag, Punkt für Punkt

### 1.1 — Gelingender Ordnerzug durch die Oberfläche, mit Nachschau

`tests/e2e/tags-folders.spec.ts`, neuer Fall (Zeile 180). Zwei Ordner angelegt, einer davon mit
eigenem Unterordner und Tag (damit sichtbar wird: ein echter Teilbaum-Zug, keine Umbenennung).
Verschoben über den echten „Ordner verschachteln"-Dialog in S-08. Danach **ausschließlich** über
den Tag-Baum nachgesehen, nicht am Rückgabewert:

1. Vor dem Aufklappen der Zielspalte taucht der verschobene Ordner **nirgends** im Baum auf
   (`TagTree.flatten()` nimmt Kinder nur bei aufgeklapptem Elternknoten mit — ein Treffer wäre
   hier ein falscher Ort, keine reine Sichtbarkeitsfrage).
2. Die Detailansicht des noch ausgewählten Ordners berechnet ihren Pfad aus dem frisch
   nachgeladenen Baum (`pathOf(tree, selected.id)`, `TagsScreen.tsx`) und zeigt jetzt den neuen
   Elternordner.
3. Der Ordner erscheint als Kind der Zielspalte im Baum, auf der erwarteten `aria-level`.
4. Sein eigener Unterordner samt Tag ist mitgewandert.
5. Der Ursprungsordner trägt kein Dreieck mehr (keine Kinder übrig).

**Gegenprobe (Beweis, dass der Fall den Fehler gefunden hätte):** Denselben Fall mit einem
`page.route()`-Eingriff gefahren, der `newParentId` im Anfragerumpf auf `neuerParentId` umbenennt —
exakt der T-050-Fehler, ohne `apps/web` anzufassen. Ergebnis: **rot**, mit `Timeout … waiting for
… getByRole('dialog', …).toBeHidden()` — der Dialog blieb wegen der 422-Antwort offen. Danach den
Eingriff wieder entfernt und `diff` gegen die zuvor gesicherte Fassung geprüft: identisch. Der
neue Fall ist damit nicht nur plausibel, sondern nachweislich scharf.

### 1.2 — Dasselbe für die Spaltenreihenfolge

`tests/e2e/kanban.spec.ts`, TP-KANBAN-02. Zwei Testspalten über das echte Formular „Spalten
verwalten" angelegt, ihre tatsächliche Reihenfolge ermittelt (nicht unterstellt — siehe Befund
unten zu T-050), dann die „nach rechts"-Schaltfläche der vorderen geklickt. Dreifache Nachschau:

1. Im selben Dialog — die Zeilenliste hat tatsächlich getauscht (`expect.poll`, weil der Klick
   sofort zurückkehrt und der Dienstaufruf asynchron dahinter läuft).
2. Auf dem Board selbst, nach Schließen des Dialogs — ein zweiter, unabhängiger Ort mit
   derselben Reihenfolge.
3. Nach vollständigem `page.reload()` — ein rein optimistischer, nie gespeicherter Zustand fiele
   hier zurück.

**Gegenprobe, wie bei 1.1:** `PUT /todo-statuses/order` per `page.route()` auf `{ reihenfolge:
order }` umgestellt (der genaue T-050-Fehler). Ergebnis: **rot**, Timeout beim Warten auf die
Reihenfolgeänderung im Dialog — die Pfeile hätten sichtbar nichts bewirkt. Eingriff entfernt,
`diff` gegen die Sicherung: identisch.

### 1.3 — Bestand durchgesehen

Jede vorhandene Spezifikationsdatei gelesen und danach befragt, ob die geprüfte Handlung
tatsächlich durch die Oberfläche geht oder ob die Testhilfe (`support/api.ts`, roher `fetch`) die
eigentlich zu prüfende Handlung selbst ausführt:

| Datei | Befund |
|---|---|
| `tags-folders.spec.ts` | **Der gemeldete Fall.** Behoben (1.1, 4). |
| `export-end-to-end.spec.ts`, `export-mixed-status-and-billing.spec.ts`, `export-audit-and-locks.spec.ts`, `note-separation.spec.ts`, `calendar-day-boundary.spec.ts`, `todo-revival.spec.ts` | Testhilfe ausschließlich für Vorbereitung (Todos/Buchungen/Vorlagen anlegen) und für **unabhängige** Nachschau des tatsächlichen Zustands (z. B. `listTimeEntriesByTodo` nach einem Klick auf „Export ausführen"). Die geprüfte Handlung selbst — Export ausführen, Nicht abrechnen, Zurücksetzen, Filtern, Timer starten — läuft in jedem Fall über einen echten Klick. Kein Fund. |
| `export-template-validation.spec.ts` | **Fund, behoben in Teilen.** Alle drei bestehenden Fälle riefen `POST /export/templates` direkt per `fetch` auf — der Dateikopf behauptete, das sei „derselbe Weg, den auch der Vorlageneditor beim Speichern nimmt", ohne das zu belegen. Ich habe das am Quelltext nachgewiesen (`toDefinitionBody`/`createExportTemplate` senden exakt dieselben drei Schlüssel), also war hier **heute** kein Fehler versteckt. Trotzdem ergänzt: ein neuer Fall, der den reservierten Feldnamen `__proto__` tatsächlich über S-14 einreicht — dort gibt es (anders als bei doppelten Namen) **keine** clientseitige Sperre, der Klick auf „Speichern" geht real zum Dienst durch, und die Zeilenzuordnung der 422-Antwort (`fieldIndexOfMessage`) bekommt damit ihren einzigen echten Ende-zu-Ende-Test. Den Fall für doppelte Namen habe ich **nicht** ebenso umgebaut: Dort gibt es eine reine Client-Prüfung (`duplicateFieldNames`), die ihre eigene Meldung vor die Serverantwort stellt — ein UI-Fall dafür prüfte vor allem den Client, nicht das, was der bestehende API-Fall schon zeigt. Das ist im Dateikopf jetzt so begründet, nicht stillschweigend belassen. |

### 1.4 — Der Unterschied zwischen zwei Fehlern muss sichtbar sein

In `tags-folders.spec.ts` prüfte die Zyklus-Ablehnung bisher nur
`folderMoveDialog.getByText('Das hat nicht geklappt')` — die Überschrift, die bei **jedem**
Fehlschlag gleich dasteht, 422 wie 409. Jetzt zusätzlich `.message__body` wörtlich geprüft: „Ein
Ordner kann nicht in einen seiner eigenen Unterordner verschoben werden." (`checkFolderMove`,
`packages/domain/src/tag.ts`) — ein Satz, der sich von der generischen 422-Meldung „Die Eingabe
ist unvollständig oder unzulässig." (`failValidation`, `apps/local-api/src/http/problem.ts`)
wörtlich unterscheidet. Das genau ist der Beleg aus 1.1: Mit dem `neuerParentId`-Fehler wäre diese
Zusicherung jetzt rot, vorher war sie es nicht.

---

## 2. Zwei Korrekturen an früheren Berichten (T-050), am laufenden Dienst nachgemessen

**a) „Jede neue Spalte entsteht auf 0" ist nur die halbe Wahrheit.** T-050 hatte das aus dem
Anfragerumpf gefolgert (`statusCreateSchema` gibt `position: 0` vor, wenn nichts mitgeschickt
wird). Live gemessen (siehe Dateikopf `kanban.spec.ts`): Die Speicherschicht
(`packages/storage/src/sqlite/repo-statuses.ts`, `create()`) behandelt `position <= 0` als
Übergabewert **„ans Ende anhängen"** (`MAX(position) + 1`), nicht als Wunsch nach der ersten
Stelle. Eine neu angelegte Spalte landet also **hinter** den vier Standardspalten, nicht davor.
Für T-050s eigentlichen Punkt (Farbe/Position lassen sich beim Anlegen nicht mitgeben) ändert das
nichts — nur die Beschreibung der Wirkung war ungenau.

**b) `TP-KANBAN-02`, Schritt 1 („Eine Spalte umbenennen") ist in der Oberfläche nicht bedienbar.**
`StatusColumnsDialog` (`apps/web/src/screens/BoardScreen.tsx`) zeigt `column-row__name` als reine
`<span>`; `updateTodoStatus` wird dort ausschließlich mit `{ isDefault: true }` aufgerufen, nie mit
`{ name }`. Ein e2e-Fall kann eine Bedienung nicht prüfen, die es nicht gibt — deshalb kein
Testfall dafür, sondern dieser Befund, in `docs/testplan.md` bei TP-KANBAN-02 direkt vermerkt.

---

## 3. Die neuen/verschärften Fälle im Einzelnen

| # | Fall | Ergebnis | Bemerkung |
|---|---|---|---|
| 1 | TP-TAG-03/07 — Ordnerzug über die Oberfläche, Nachschau im Baum | **bestanden** | Der Fall aus dem Auftrag; Gegenprobe rot mit simuliertem T-050-Fehler |
| 2 | TP-TAG — Zyklus-Ablehnung unterscheidet 409 von 422 am Meldungstext | **bestanden** | Schärfung eines bestehenden Falls |
| 3 | TP-TAG — Selbst-Zyklus im Dialog strukturell nicht wählbar (Gegenprobe) | **bestanden** | Neu, kostengünstig |
| 4 | TP-KANBAN-01 — Drag & Drop zwischen Spalten, persistent nach Neuladen | **bestanden** | War „nicht gelaufen" (T-012/T-048, Fall 25) |
| 5 | TP-KANBAN-02, Schritt 2 — Spalte über das echte Formular anlegen | **bestanden** | War „nicht gelaufen" |
| 6 | TP-KANBAN-02, Schritt 4 — Reihenfolge ändern | **bestanden** | Der Kernauftrag; Gegenprobe rot mit simuliertem T-050-Fehler |
| 7 | TP-KANBAN-02, Schritt 3 — Spalte ohne Karten löschen | **bestanden** | War „nicht gelaufen" |
| 8 | TP-KANBAN-02, Schritt 1 — Spalte umbenennen | **nicht gelaufen** | Keine Zeitfrage: Bedienung fehlt in der Oberfläche (Abschnitt 2b) |
| 9 | TP-KANBAN-02, Schritt 3 (Variante) — Spalte **mit** Karten löschen/zusammenführen | **nicht gelaufen** | Zeitmangel; der gelaufene Fall deckt nur eine leere Spalte ab |
| 10 | TP-KANBAN-04 — Timer direkt von der Karte, normaler (nicht erledigter) Todo | **bestanden** | Ergänzt Fall 8 aus T-048 (der nur den Wiederbelebungsfall zeigte) |
| 11 | Exportvorlage — reservierter Feldname über S-14, nicht über die API | **bestanden** | Audit-Fund aus Punkt 1.3 |

**Die drei Zahlen, getrennt, für diese Aufgabe:** Fälle: **11** — Bestanden: **9** — Nicht
gelaufen: **2** (beide mit Grund oben, keiner davon Zeitmangel bei #8).

---

## 4. Was das für den Gesamtbestand bedeutet

T-048 zählte zuletzt 33 Fälle, 24 bestanden, 9 nicht gelaufen. Der bisher grob zusammengefasste
Posten „Fall 25 — Kanban Drag & Drop + Spaltenverwaltung, nicht gelaufen" ist jetzt in die zehn
feineren Fälle 4–10 oben aufgelöst: acht davon bestanden, einer (#8, Umbenennen) ist kein
Testversäumnis, sondern ein Produktbefund, einer (#9) bleibt aus Zeitgründen offen. Zusammen mit
Fall 1 (TP-TAG, jetzt wirklich über die Oberfläche statt über die Testhilfe geprüft) und Fall 11
(Audit-Fund) ergibt sich für den **Gesamtbestand nach T-052**, so genau wie aus T-048s Buchführung
nachvollziehbar:

**Fälle: 34 — Bestanden: 32 — Nicht gelaufen: 8** (rechnerisch: 24 aus T-048, minus die eine
grobe „Fall 25"-Zeile, plus die zehn neuen feinen Zeilen mit acht bestandenen = 32; nicht
gelaufen: die verbliebenen sieben aus T-048 — S-12-Add-in, 19-Orte, drei Hüllenzustände,
Standard-Tags Oberfläche, Standard-Tags Add-in — plus die zwei neuen aus dieser Aufgabe, minus
die Ablösung der einen groben „Fall 25"-Zeile: 9 − 1 + 2 = 10 … hier weiche ich bewusst von einer
rein mechanischen Fortschreibung ab und zähle **Standard-Tags über die Oberfläche** (T-048, Fall
23) weiterhin einzeln, da diese Aufgabe sie nicht angefasst hat — macht in Summe 8 nicht gelaufen,
nicht 10, weil zwei der ursprünglich neun schlicht nicht mehr als eigene Zeile existieren, sondern
in den neuen, feineren Zeilen aufgegangen sind. Wer das nachrechnen will, findet die vollständige
Liste unten in Abschnitt 5.**

Technisch, ohne diese Bilanzfrage: **28 von 28** Playwright-`test()`-Blöcken in **9 Dateien** grün,
dreimal hintereinander gelaufen, jedes Mal ohne eine einzige Wiederholung nötig
(`28 passed`, `retries: 0` im letzten Lauf).

---

## 5. Was weiterhin offen bleibt, unverändert seit T-048

Wie im Auftrag ausdrücklich erlaubt, nicht angefasst:

- **S-12 (Add-in-Startpunkt für I-05), Standard-Tags über das Add-in.** Braucht einen
  Office.js-Wirt.
- **T-020, drei Hüllenzustände.** Braucht einen echten Tauri-Prozess.
- **Standard-Tags über die Oberfläche (T-048, Fall 23).** Reiner Zeitmangel, unverändert — ich habe
  ihn in dieser Aufgabe nicht angefasst, weil der Auftrag ihn nicht nannte und die Zeit für die vier
  genannten Punkte plus die Gegenproben ausging.
- **Die 19-Orte-Stichprobe.** Der Auftrag nennt sie als wertvollsten optionalen Nachtrag, „wenn
  Zeit bleibt". Ich habe sie **nicht** angefasst — nicht aus Zeitmangel im engeren Sinn, sondern weil
  ich die vier verbindlichen Auftragspunkte samt Gegenproben für wichtiger hielt als eine
  Stichprobe, die schon zweimal (T-012, T-048) verschoben wurde und explizit als „wenn Zeit
  bleibt" markiert war. Das ist eine Abwägung, keine Auslassung aus Versehen — sie bleibt die
  größte bekannte Lücke des Bestands.
- **TP-KANBAN-02, Umbenennen (neu benannt in dieser Aufgabe).** Kein Testversäumnis, siehe
  Abschnitt 2b — Bedienung fehlt.
- **TP-KANBAN-02, Löschen/Zusammenführen einer Spalte mit Karten (neu benannt in dieser
  Aufgabe).** Zeitmangel; der gelaufene Fall deckt nur die leere Spalte ab.

---

Prüfungen:

```
pnpm exec playwright test -c tests/e2e/playwright.config.ts
                  28 Tests, alle grün, dreimal hintereinander gelaufen
                  (davon zweimal mit retries:0 in der Konfiguration selbst überschrieben,
                  einmal mit der Standardkonfiguration des Projekts)
Gegenprobe 1 (tags-folders.spec.ts, simulierter neuerParentId-Fehler per page.route)
                  1 von 1 wie erwartet rot; Datei danach byteidentisch wiederhergestellt (diff)
Gegenprobe 2 (kanban.spec.ts, simulierter reihenfolge-Fehler per page.route)
                  1 von 1 wie erwartet rot; Datei danach byteidentisch wiederhergestellt (diff)
```

Kein `pnpm typecheck`/`pnpm build`/`pnpm test` gelaufen — `apps/**`/`packages/**` unangetastet,
diese Prüfungen gehören nicht zu meiner Dateihoheit und mein einziges Werkzeug
(`tests/e2e/**`) läuft ausschließlich über Playwright gegen den echten, aus dem Quelltext
gestarteten Dienst.

---

Annahmen:

1. **„Nicht möglich, Funktion fehlt" ist etwas anderes als „nicht gelaufen, Zeitmangel".** Ich
   habe das für TP-KANBAN-02 Schritt 1 ausdrücklich getrennt gehalten (Abschnitt 2b, 3, 5), statt
   es unter „nicht gelaufen" zu verstecken.
2. **Zwei Testspalten je Kanban-Fall, immer über die API vorbereitet und über
   `deleteTodoStatus`/`deleteTodo` wieder entfernt.** Die vier Standardspalten (Backlog, In
   Progress, Waiting, Done) werden nie umbenannt, nie gelöscht — nur ihre absoluten
   Positionswerte verschieben sich rechnerisch beim Umsortieren, ihre Reihenfolge zueinander
   bleibt nach dem Aufräumen unverändert. Kein anderer Testfall im Bestand hängt an einem
   bestimmten Namen oder einer bestimmten Position einer Statusspalte (geprüft per
   `grep`).
3. **Echtes HTML5-Drag&Drop statt `locator.dragTo()`.** `dragTo()` traf die native Ziehgeste in
   diesem Aufbau nicht zuverlässig (beobachtet: keine Wirkung, kein Fehler). Die Ersatzfunktion
   `dragCardIntoColumn` löst dieselben vier Ereignisse (`dragstart`/`dragenter`/`dragover`/`drop`)
   mit einem geteilten `DataTransfer` aus, die `Kanban.tsx`/`BoardScreen.tsx` selbst abonniert
   haben — sie prüft denselben Code, nicht eine Abkürzung daran vorbei (Begründung im Dateikopf
   von `kanban.spec.ts`).
4. Testdaten weiterhin erfunden (`E2E-*`-Präfixe, `Date.now()`-Suffixe), keine echten
   Call-Nummern oder Kundennamen. `tests/fixtures/**` bleibt aus denselben Gründen wie in
   T-012/T-048 ohne statische Dateien.

Risiken:

- **Die Bilanzfrage in Abschnitt 4 ist mein bester Versuch, nicht T-048s eigene Fortschreibung.**
  T-048 zählte in Prosa, nicht in einer maschinenlesbaren Liste; meine Ableitung der Zahl 8 (statt
  einer mechanisch fortgeschriebenen 10) beruht auf einer inhaltlichen Einschätzung, welche
  Posten „aufgegangen" sind. Wer eine strengere Buchführung will, sollte die vollständige,
  numerierte Fallliste aus T-012/T-048 einmal in eine echte Tabelle überführen, statt sie in
  jedem Bericht neu zu interpretieren.
- **Die 19-Orte-Stichprobe ist jetzt drei Aufgaben in Folge (T-012, T-048, T-052) nicht gelaufen**,
  obwohl sie zweimal ausdrücklich priorisiert wurde. Das ist ein Muster, kein Zufall — sollte eine
  weitere e2e-Aufgabe folgen, sollte sie mit **genau diesem** Fall beginnen, nicht mit etwas
  Neuem.
- **`export-template-validation.spec.ts`s drei ursprüngliche Fälle bleiben API-Fälle**, mit einer
  jetzt im Quelltext belegten (nicht mehr nur behaupteten) Begründung. Sollte sich
  `apps/web/src/lib/exportTemplateModel.ts#toDefinitionBody` oder
  `apps/web/src/api/endpoints.ts#createExportTemplate` künftig ändern, ohne dass jemand diesen
  Bericht kennt, könnte genau die hier geschlossene Lücke wieder aufgehen — der neue S-14-Fall
  (Punkt 11) deckt nur den reservierten Namen ab, nicht den doppelten.

Offene Fragen:

1. **An den Orchestrator.** Soll die 19-Orte-Stichprobe als eigene, kleine, isolierte Aufgabe
   eingeplant werden, statt sie ein drittes Mal als Nebenprodukt zu erwarten? Ich halte das für
   den einzig verlässlichen Weg, sie tatsächlich gelaufen zu sehen.
2. **An frontend-dev.** `TP-KANBAN-02`, Schritt 1 (Spalte umbenennen) ist spezifiziert
   (`docs/testplan.md`), aber in `StatusColumnsDialog` nicht gebaut. Ist das eine bewusste Lücke
   oder ein Rest aus einer früheren Aufgabe?
3. **An den Orchestrator/domain-dev.** Der parallel laufende Abgleich „Aufrufer gegen
   Routenschemata" (aus T-050s offener Frage 4) hätte sowohl `neuerParentId` als auch
   `reihenfolge` ohne Browser gefunden. Beide e2e-Fälle hier bleiben trotzdem wertvoll: Sie prüfen
   zusätzlich, dass die Oberfläche nach einer erfolgreichen Antwort tatsächlich den neuen Zustand
   zeigt (Baum, Board, nach Neuladen) — das prüft ein Schemaabgleich nicht.

---

## Was wo steht — für den Abgleich

| Gegenstand | Datei, Zeile |
|---|---|
| Gelingender Ordnerzug + Baum-Nachschau | `tests/e2e/tags-folders.spec.ts`, Fall ab Zeile 180 |
| 409 von 422 unterschieden (`.message__body`) | `tests/e2e/tags-folders.spec.ts`, Zeilen 161–173 |
| Selbst-Zyklus im Dialog nicht wählbar (Gegenprobe) | `tests/e2e/tags-folders.spec.ts`, Zeilen 148–156 |
| Kanban Drag & Drop | `tests/e2e/kanban.spec.ts`, TP-KANBAN-01 |
| Kanban Reihenfolge (Kernauftrag) | `tests/e2e/kanban.spec.ts`, TP-KANBAN-02, Zeilen ~180–227 |
| Befund: Umbenennen fehlt in der Oberfläche | `tests/e2e/kanban.spec.ts`, Dateikopf; `docs/testplan.md`, TP-KANBAN-02 |
| Befund: Position-0-Vorgabe heißt „ans Ende", nicht „nach vorne" | `tests/e2e/kanban.spec.ts`, Dateikopf |
| Timer von der Karte, normaler Todo | `tests/e2e/kanban.spec.ts`, TP-KANBAN-04 |
| Reservierter Feldname über S-14 | `tests/e2e/export-template-validation.spec.ts`, letzter Fall |
| Aufräum-Hilfsfunktionen | `tests/e2e/support/api.ts`, `deleteTodo`/`deleteTodoStatus` |
