Aufgabe: T-073 — A-5.4 bekommt sein Bedienelement zurück (Abschnitt „Status“ in S-09)

Status: fertig

Artefakte:

Neu:

```
apps/web/src/screens/StatusSettings.tsx   der Bereich „Status" der Einstellungen: anlegen,
                                          umbenennen, Reihenfolge ändern, löschen; Standardwahl
                                          als Optionsgruppe; Zählung je Status; Sperrgründe
                                          sichtbar, bevor jemand sie auslöst (735 Zeilen)
.claude/team/reports/T-073-frontend-dev.md  dieser Bericht
```

Geändert:

```
apps/web/src/screens/SettingsScreen.tsx   sechster Bereich `status` — Adresse
                                          `#/einstellungen?bereich=status`, Leiteintrag, Symbol
                                          „inbox", Kurzhinweis „Die Statuswerte eines Todos —
                                          nicht die Spalten des Boards" (+22/−6)
apps/web/src/components/Primitives.tsx    `IconButton` nimmt `ref` (React 19: eine gewöhnliche
                                          Eigenschaft). Gebraucht für die Fokusrückgabe, wenn ein
                                          Knopf durch seine eigene Wirkung gesperrt wird (+11/−1)
apps/web/src/screens/BoardScreen.tsx      zwei Wegweiser: eine Meldung „Sie suchen die
                                          Statuswerte?" im Dialog „Spalten des Boards" mit Knopf
                                          in die Einstellungen, und ein Satz im Leerzustand
apps/web/src/screens/TodoFormDialog.tsx   Hilfetext am Feld „Status": keine Kanban-Spalte, und
                                          wo die Werte herkommen
apps/web/src/showcase/InventorySection.tsx  neuer Eintrag „Statuszeile" mit ihren neun
                                          Zuständen; der Eintrag „Kanban-Spalte" auf E-054
                                          nachgezogen (er nannte noch „Statusspalte" und
                                          „Ablageziel")
apps/web/src/styles/app.css               `.status-admin*` — Zeile, Stelle, Sperrgrund,
                                          Standardwahl, Verweise, Regelliste
apps/web/scripts/contrast-check.mjs       Gruppe „Statusverwaltung", zehn Paare (394 → 416)
apps/web/src/api/types.ts,
apps/web/src/api/endpoints.ts,
apps/web/src/app/StructureContext.tsx,
apps/web/src/screens/TodoListScreen.tsx   nur Erläuterungen: Überschriften und Sätze, die den
                                          Status noch als „Statusspalte" führten, heißen jetzt,
                                          was er seit E-054 ist. Kein Verhalten geändert.
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`,
`apps/web/test/**`, `docs/**`. `apps/desktop/src/**` enthält nichts zum Status (nachgesehen: ein
einziger Treffer, das Fensterereignis `takt://einstellungen-oeffnen`, das den Bereich nicht
kennt). Kein `git commit` — die Änderungen liegen im Arbeitsbaum auf `kanban-regelspalten`, neben
denen aus T-072.

Bedienskripte und 30 Bildschirmaufnahmen liegen im Wegwerfordner der Sitzung, ausdrücklich
außerhalb des Projekts.

---

Zusammenfassung:

`pnpm typecheck`, `pnpm contrast` (**416 Paare, 0 durchgefallen**, vorher 394) und `pnpm build`
sind grün, ebenso `build:designsystem`. Im Browser gegen den echten Dienst mit echten Daten
geprüft, hell und dunkel: anlegen, umbenennen, fünfmal verschieben, Standard weitergeben, den
gesperrten Löschversuch, das Löschen eines leeren Status und den vom Dienst **abgewiesenen**
Löschversuch. Kein `pageerror`, keine Konsolenmeldung außer der, die der provozierte 409 selbst
auslöst.

A-5.4 hat wieder ein Bedienelement. Es liegt in S-09 zwischen „Standard-Tags" und
„Outlook-Add-in", weil beide Nachbarn dieselbe Frage beantworten: Was bekommt ein neu angelegtes
Todo mit?

## 1 — Der erste Absatz erklärt, warum der Benutzer hier steht

Wer „Statusspalten" sucht und sie auf dem Board nicht findet, muss hier landen **und verstehen**.
Deshalb ist das Erste im Bereich keine Liste, sondern zwei Sätze:

> **Der Status ist nicht die Kanban-Spalte**
> Sie suchen die Statusspalten des Boards? Die gibt es dort nicht mehr. Eine Spalte des
> Kanban-Boards ist seit der Umstellung eine **Regel über Tags** — welche Karte wo steht,
> entscheiden die Tags des Todos. Diese Spalten richten Sie auf dem Board selbst ein, unter
> „Spalten verwalten".
> Der **Status** ist etwas anderes geblieben: eine Eigenschaft des Todos. Er steht auf jeder
> Karte, wird in der Todo-Liste und in der Detailansicht geändert — und hier wird festgelegt,
> welche Werte es überhaupt gibt.

Darunter zwei Verweise: „Zum Kanban-Board" und „Zur Todo-Liste".

Der Weg von der anderen Seite ist genauso ausgeschildert. Im Dialog **„Spalten des Boards"** —
also genau dort, wo die Statusspalten bis E-054 verwaltet wurden — steht jetzt eine Meldung „Sie
suchen die Statuswerte?" mit einem Knopf „Zu den Einstellungen", der auf
`#/einstellungen?bereich=status` führt. Gemessen: Klick → Adresse `/einstellungen?bereich=status`,
Karte „Status". Dazu ein Satz im Leerzustand des Boards und ein Hilfetext am Statusfeld des
Todo-Formulars.

## 2 — Die beiden Zusagen des Dienstes stehen **vor** dem Versuch

**Genau ein Status ist der Standard.** Die Wahl ist eine **Optionsgruppe** (`<input type="radio"`,
ein Name für alle Zeilen) und keine Reihe einzelner Schalter. Das ist keine Zierde: Ein
Auswahlknopf lässt sich nicht abwählen, nur weitergeben — genau die Zusage, die
`ux_todo_status_default` in der Datenbank gibt. Die Gruppe wird mit den Pfeiltasten bedient und
hat einen Tabulatorhalt, nicht fünf. Gemessen: Fokus auf „Backlog", Pfeil-ab → `PATCH` 200,
Standard bei „In Progress", Fokus auf dem neuen Knopf, Meldung „Neue Todos bekommen ab sofort
‚In Progress'. Vorhandene Todos ändern sich dadurch nicht."

**Ein Status mit Todos wird nicht gelöscht.** Die Ansicht zählt je Status die Todos und sperrt
das Löschen mit dem Grund daneben, statt den Benutzer in den 409 laufen zu lassen:

| Zeile | Zahl | Löschen | Grund in der Zeile |
|---|---|---|---|
| Backlog | 2 Todos, Standard | gesperrt | **zwei** Gründe: erst die Rolle abgeben, dann die Todos umstellen |
| In Progress | 2 Todos | gesperrt | „Hier stehen noch 2 Todos. Takt hängt sie nicht von sich aus um …" |
| Waiting | 0 Todos | frei | — |
| letzter Status | — | gesperrt | „Es muss mindestens einen geben, sonst bekäme ein neues Todo keinen." |

Zu jedem Grund, der an Todos hängt, gehört der Ausweg: ein Knopf „Diese 2 Todos anzeigen", der in
die nach diesem Status gefilterte Liste führt (gemessen: `/todos?spalte=…`, Chip „Status: In
Progress", zwei Zeilen).

**Alle** Gründe, nicht der erste. Der Standard-Status mit Todos hat zwei davon; wer nur einen
liest, räumt ihn aus und steht vor der nächsten Wand.

## 3 — Der Sonderfall des Standard-Status, und wo ich strenger bin als der Dienst

Der Dienst ließe den Standard-Status löschen, sobald er leer ist. `defaultStatus()` fällt danach
still auf den ersten nach Position zurück (`repo-statuses.ts`) — es bricht also nichts, aber die
Rolle wechselt, ohne dass jemand sie vergeben hätte. Die Ansicht verlangt die Übergabe vorher und
sagt warum.

Das ist keine zweite Fachregel in der Oberfläche: Es wird nichts nachgerechnet und nichts
entschieden, was der Dienst anders entscheidet. Es ist die Weigerung, eine stille Übernahme
anzubieten. Ob der **Dienst** das ebenfalls abweisen soll, ist eine Frage an den domain-dev —
offene Frage 2.

## 4 — Die Reihenfolge, und warum sie hier geht

Geprüft, bevor ich mich darauf verlassen habe: `PUT /todo-statuses/order` nimmt die
**vollständige** Folge und schreibt sie in `takt_status_reorder` in zwei Durchläufen über negative
Zwischenwerte — der eindeutige Index auf die Position sieht dabei nie zwei gleiche Werte. Ein
Teilstück weist die Route mit `validation_error` ab („Die Reihenfolge muss alle Spalten genau
einmal nennen"). Die Ansicht schickt deshalb immer alle Kennungen, nie das getauschte Paar. Das
Problem, an dem in T-072 die **Spalten**reihenfolge gescheitert ist, stellt sich hier nicht.

Zwei Pfeile je Zeile, kein Ziehen. **Der Fokus bleibt, wo er war.** Ein Knopf, der durch seine
eigene Wirkung gesperrt wird — die Zeile ist oben angekommen —, nimmt den Fokus sonst mit in den
Dokumentkörper: Wer einen Status mit der Tastatur an die Spitze setzt, stünde danach am Anfang der
Seite (SC 2.4.3). Die Ansicht merkt sich den betätigten Knopf und holt den Fokus nach dem Neuladen
zurück; ist er inzwischen gesperrt, übernimmt der Knopf der Gegenrichtung. Dafür nimmt
`IconButton` seit dieser Aufgabe ein `ref` — die einzige Änderung an einem gemeinsamen Baustein.

Gemessen, fünf Schritte mit der Eingabetaste:

```
Start                 Fokus „Zurückgestellt (Kunde)" nach oben
Schritt 1  Stelle 4   Fokus unverändert   Ansage „… steht jetzt an 4. Stelle von 5."
Schritt 2  Stelle 3   Fokus unverändert
Schritt 3  Stelle 2   Fokus unverändert
Schritt 4  Stelle 1   Fokus wechselt auf „nach unten" (nach oben ist jetzt gesperrt)
Schritt 5  Stelle 2   Fokus auf „nach unten"
```

Jede Verschiebung sagt sich an (`aria-live="polite"`), ohne Toast — ein Toast je Pfeildruck wäre
Lärm.

## 5 — Woher die Zahl je Status kommt

`GET /todos?statusId=…&limit=1`, ein Aufruf je Status, und daraus `total`. Das ist **dieselbe**
Zählung, die der Dienst vor dem Löschen anstellt (`SELECT COUNT(*) FROM todo WHERE status_id = ?`),
einschließlich der erledigten Todos. Eine eigene Zählung in der Oberfläche wäre eine zweite
Wahrheit über dieselbe Frage — und sie fiele erst auf, wenn ein Löschversuch entgegen der Anzeige
abgewiesen wird. Eine Route, die das in einem Zug beantwortet, gibt es nicht (nachgesehen); bei
vier bis acht Statuswerten sind das vier bis acht Aufrufe gegen einen lokalen Dienst.

Drei Zustände, drei Texte, nicht zwei: „Todos werden gezählt …", „Anzahl unbekannt", „2 Todos".
Eine Zeile, die nach einem Fehlschlag weiter „wird gezählt" behauptet, lässt den Benutzer auf
etwas warten, das nicht mehr kommt.

## 6 — Der abgewiesene Löschversuch, wenn er doch passiert

Zwischen dem Zählen und dem Löschen kann ein Todo dazukommen — aus dem Add-in, aus einem anderen
Fenster. Dann antwortet der Dienst mit `409 status_in_use`, und der Dialog ist **kein
Bestätigungsdialog mehr, sondern eine Auskunft**. Titel, Beschreibung und Knöpfe wechseln mit:

```
vorher   „Status löschen?"                   … steht danach nicht mehr zur Auswahl …
                                             [Abbrechen] [Status löschen]
nachher  „Der Status wurde nicht gelöscht"   … steht weiterhin zur Auswahl. Der Dienst hat das
                                             Löschen abgelehnt und dabei nichts verändert.
                                             [Schließen] [Erneut versuchen]
```

Die Meldung des Dienstes steht unverändert darin; darunter der Satz, was zu tun ist. Beim
Schließen ist die Zeile bereits nachgezählt — sie sagt „1 Todo", trägt den Grund und den Ausweg.
Gemessen, hell und dunkel, mit einem Todo, das ich zwischen Öffnen und Bestätigen über die Route
angelegt habe.

## 7 — Eine Entscheidung, die ich unterwegs zurückgenommen habe

Der Sperrgrund stand zuerst auf **getönter Warnfläche**. Im Browser mit echten Daten war die Folge
sichtbar: In einem eingerichteten Takt trägt fast jede Zeile einen Grund — ein Status mit Todos
ist der Normalfall, kein Zwischenfall —, und der Bereich wurde eine Wand aus Gelb. Damit ginge
ausgerechnet die eine Meldung unter, die wirklich eine ist: die Absage des Dienstes im
Bestätigungsdialog.

Der Grund steht jetzt ruhig: eigene Fläche (`--bg-inset`), gemessener Text
(`--text-secondary`, 4,5:1 in beiden Modi), ein Schloss davor. Sichtbar durch Fläche und Symbol,
nicht durch Farbe (SC 1.4.1). Aus demselben Grund trägt der Löschknopf **kein** `variant="danger"`
— sechs gefüllte rote Flächen untereinander sind die lauteste Stelle einer Einstellungsseite, an
der nichts Lautes passiert. Die Warnfarbe trägt der Bestätigungsdialog, und dort trägt sie etwas.

Zweite Rücknahme aus derselben Bedienprüfung: Der Auswahlknopf für den Standard wird während der
Anfrage **nicht** gesperrt, anders als die Pfeile daneben. Eine Optionsgruppe wird mit den
Pfeiltasten bedient; ein Knopf, der im Augenblick seiner Betätigung gesperrt wird, nimmt den Fokus
mit. Ein zweiter Druck während der Anfrage läuft stattdessen ins Leere.

## 8 — Zustände (Abschnitt 15), jeder gemessen

| Zustand | Wie erreicht | Was zu sehen ist |
|---|---|---|
| Zählung läuft | Antwort von `/todos` verzögert | „Todos werden gezählt …" je Zeile |
| Zählung fehlgeschlagen | `/todos` abgewiesen | Warnband mit dem Text des Dienstes, Knopf „Erneut zählen"; Zeilen sagen „Anzahl unbekannt"; Löschen bleibt bedienbar — dann entscheidet der Dienst |
| kein einziger Status | `/todo-statuses` liefert `[]` | Leerzustand „Es gibt keinen einzigen Status" mit Knopf. **Über die Oberfläche nicht erreichbar** (der Dienst lässt den letzten nicht löschen); Schutzzustand, gemessen über eine abgefangene Antwort |
| Änderung fehlgeschlagen | `/todo-statuses/order` mit 409 beantwortet | Fehlerband „Die Änderung wurde nicht übernommen" mit dem Text des Dienstes |
| doppelter Name | „Backlog" im Anlegen-Dialog | Absenden gesperrt, Grund am Feld, bevor geklickt wird |
| leerer Name | Feld leeren | Absenden gesperrt |
| Löschen gesperrt | Standard / belegt / letzter | Grund in der Zeile, Knopfname sagt „derzeit nicht möglich", `aria-describedby` zeigt auf den Grund |
| Löschen abgewiesen | Todo zwischendurch angelegt | siehe Abschnitt 6 |
| Zeile unter dem Zeiger | Hover | `--bg-hover` statt durchsichtig, Rand kräftiger; gemessen |
| Erfolg | jede Änderung | Meldung, die die **Wirkung** nennt, nicht den Vorgang |

## 9 — Tastatur und Fokus

23 Tabulatorhalte über den Bereich, **kein einziger ohne sichtbaren Fokusring** (gemessen an
`outline-width`, hell und dunkel). Reihenfolge innerhalb einer Zeile: Ausweg → Standardwahl →
Pfeile → Umbenennen → Löschen; der Ausweg steht bei seinem Grund und nicht in der Knopfreihe,
sonst gehörte er auch zu den freien Zeilen und führte auf eine leere Liste.

Escape schließt die Formulardialoge und gibt den Fokus an den auslösenden Knopf zurück (gemessen:
„Status anlegen"). Die Optionsgruppe hat einen Halt, nicht fünf. Jeder Knopf trägt einen
sprechenden Namen: „„Zurückgestellt (Kunde)" nach oben", „„Backlog" löschen — derzeit nicht
möglich".

## 10 — Was gemessen grün ist

```
pnpm typecheck   alle acht Projekte, keine Meldung          ✓
pnpm contrast    416 Paare, 0 durchgefallen (vorher 394)    ✓
pnpm build       alle Projekte                              ✓
pnpm --filter @takt/web build:designsystem                  ✓
```

Die zehn neuen Paare (Gruppe „Statusverwaltung") decken die neuen Flächen ab: Stelle in der
Reihenfolge, Zählung unter dem Zeiger, Beschriftung des gewählten Standards in Ruhe und unter dem
Zeiger, der Auswahlknopf selbst nach SC 1.4.11 (beides gegen `--bg-surface` und `--bg-hover`),
Sperrgrund samt Schloss und die Fläche des Sperrgrundes gegen Karte und Hoverzeile (abgrenzend,
ausgenommen). Kein `any`, keine `@ts-ignore`; alle Texte deutsch, alle Bezeichner englisch.

---

Risiken:

1. **Ich sperre das Löschen des Standard-Status, der Dienst nicht.** Wer über die Route arbeitet
   — Add-in, Skript, ein späterer zweiter Bedienweg —, kann ihn löschen, und die Rolle fällt
   still auf den ersten nach Position. Die Oberfläche zeigt danach den richtigen Zustand, aber
   niemand hat ihn gewählt. Der saubere Schluss ist eine Regel im Dienst (offene Frage 2).
2. **Die Zählung ist ein Aufruf je Status.** Bei vier bis acht Werten unauffällig; wer dreißig
   Statuswerte anlegt, bekommt dreißig Abfragen beim Öffnen des Bereichs. Der richtige Weg wäre
   dann eine Auskunft des Dienstes „Zahl der Todos je Status", nicht eine Schätzung hier.
3. **Zwischen Zählen und Löschen liegt ein Zeitfenster.** Das ist unvermeidbar und behandelt
   (Abschnitt 6) — aber es heißt, dass die Zahl in der Zeile eine Momentaufnahme ist und der
   Dienst das letzte Wort hat. Genau so steht es im Warnband, wenn die Zählung fehlt.
4. **Der Leerzustand „kein einziger Status" ist über die Oberfläche nicht erreichbar.** Er ist
   Schutz gegen einen Bestand, den es nicht geben sollte, und ich habe ihn nur mit einer
   abgefangenen Antwort gesehen. Wer ihn streicht, spart zwölf Zeilen und riskiert eine leere
   Karte ohne Text, falls der Fall doch eintritt.

---

Offene Fragen:

1. **Die Meldung des Dienstes zum belegten Status spricht noch von einer Spalte.**
   `status_in_use` lautet wörtlich „In dieser **Spalte** stehen noch Todos. Verschieben Sie sie
   zuerst." (`packages/storage/src/sqlite/repo-statuses.ts`). Seit E-054 ist der Status keine
   Spalte; der Satz steht damit im Bestätigungsdialog eines Bereichs, der zwei Absätze weiter
   oben erklärt, dass Status und Spalte zwei verschiedene Dinge sind. Ich habe ihn **nicht**
   ersetzt — der Text kommt vom Dienst, und ihn in der Oberfläche umzuschreiben hieße, aus einem
   Fehlercode einen eigenen Satz zu raten. **Für den domain-dev:** „In diesem Status stehen noch
   Todos. Stellen Sie sie zuerst auf einen anderen." Dieselbe Datei trägt in `remove` und
   `update` weitere „Spalte"-Sätze („Diese Spalte gibt es nicht.", „Die letzte Spalte kann nicht
   gelöscht werden.") und in `reorder` („Die Reihenfolge muss alle Spalten genau einmal nennen").
   Das passt zu dem, was T-074 an `errors.ts` gerade ohnehin tut.
2. **Soll `DELETE /todo-statuses/{id}` den Standard-Status abweisen?** Heute darf er gelöscht
   werden, sobald er leer ist; `defaultStatus()` fällt danach auf den ersten nach Position
   zurück. Die Oberfläche verlangt vorher die ausdrückliche Übergabe (Abschnitt 3). Wenn das die
   richtige Regel ist, gehört sie in den Dienst — ein Fehlercode `default_status_required` neben
   `last_status_column` wäre der Ort. **Für den domain-dev und den Auftraggeber.**
3. **`POST /pools` mit einem vorhandenen Namen antwortet weiterhin mit 500** (offene Frage 1 aus
   T-072). Beim Einrichten der Prüfdaten außerdem gesehen: `POST /pools` antwortete auch mit
   einem **neuen** Namen zeitweise mit 500, während `packages/storage` gerade umgebaut wurde. Ob
   das ein zweiter Fehler ist oder nur der Zwischenstand von T-074, kann ich nicht sagen — der
   Dienst lief aus dem Quelltext, den der domain-dev in derselben Stunde geändert hat. **Für den
   domain-dev zum Nachmessen**, sobald T-074 steht. Für den Status ist es folgenlos: Die Zählung,
   das Anlegen, Umbenennen, Umsortieren und Löschen liefen währenddessen fehlerfrei.
4. **`tests/e2e/kanban.spec.ts` prüft weiterhin die Statusspalten-Verwaltung des Boards, die es
   nicht mehr gibt** (offene Frage 2 aus T-072, unverändert offen). Sie gehört jetzt zweigeteilt:
   die Regelspalten auf dem Board, die Statusstruktur in S-09. Für den zweiten Teil führen die
   Wege: `#/einstellungen?bereich=status`, `.status-admin__row`, `getByRole('radio')` für den
   Standard, `getByRole('button', { name: /nach oben/ })` für die Reihenfolge und
   `[role="alertdialog"]` — **nicht** `[role="dialog"]` — für die Löschbestätigung. Ich habe die
   Datei nicht angefasst.
5. **`CARD_STAYS` stimmt nach E-054 nicht ganz** (offene Frage 4 aus T-072, unverändert offen).
   Der Satz liegt zeichengleich in `apps/web/src/lib/labels.ts` und im Add-in; ändern lässt er
   sich nur gemeinsam mit dem integration-dev.
6. Der Bereich hat eine eigene Adresse, aber die **globale Suche** kennt sie nicht — sie findet
   Todos, keine Einstellungsbereiche. Wer „Status" in die Suche tippt, landet nicht hier.
   Erwähnenswert, weil A-13.7 die globale Suche verlangt und der Wegweiser über das Board der
   einzige Fund-Pfad ist. Ob Einstellungsbereiche in die Suche gehören, ist eine Entscheidung
   und keine Nachbesserung — deshalb gefragt und nicht gebaut.

---

Nächster Schritt: domain-dev entscheidet über den Wortlaut von `status_in_use` (offene Frage 1)
und über die Regel zum Standard-Status (offene Frage 2); e2e-tester zieht `kanban.spec.ts` nach
und deckt dabei den neuen Bereich mit ab (offene Frage 4). A-5.4 ist damit wieder bedient — die
Anforderung, die T-072 als einzige offen zurückgelassen hat.
