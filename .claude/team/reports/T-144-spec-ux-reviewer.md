# T-144 — Spezifikations- und UX-Abgleich über Welle O bis R, dazu die Zustandsmatrix für Abschnitt 19

```
Aufgabe: T-144 — Spezifikations- und UX-Abgleich, dazu die Zustandsmatrix für Abschnitt 19
Status: nicht freigegeben (Nacharbeit, drei blockierende Befunde)
Rolle: spec-ux-reviewer
```

Gelesen: `CLAUDE.md` (Abschnitte „Versionsprüfung" und „Frist und Anhänge"); `docs/spec.md`
Abschnitte 11 bis 19; `.claude/team/decisions.md` E-064 bis E-072 samt der Berichtigung zu E-064
Punkt 2, dazu E-013, E-023, E-025, E-030, E-038, E-039, E-054/E-055, E-059, E-063, E-065 bis
E-069; `.claude/team/risks.md` R-19 bis R-22; `docs/glossar.md`; `apps/web/design/DESIGNSYSTEM.md`
Abschnitte 3, 5, 8, 9, 10, 11, 12; die Berichte T-025, T-116, T-132, T-133, T-134, T-138, T-139,
T-140; `board.md` Welle O bis R und die Restpunktliste.

Gemessen wurde gegen den Quelltext, nicht gegen die laufende Anwendung — siehe Annahme AN-01.

---

## 0.0 Nachtrag T-165 (2026-09-05) — vier Stellen dieses Berichts sind überholt

Teil 2 dieses Berichts ist eine Ableitung **vor** dem Bau. Wo der Bau anders entschieden hat und
die Abweichung geprüft und bestätigt ist, gilt der Bau und nicht dieser Bericht. Betroffen sind
genau vier Stellen. Jede ist unten zusätzlich an Ort und Stelle markiert; keine ist gelöscht,
damit der Verlauf lesbar bleibt.

| Stelle | Hier stand | Es gilt | Belegt in |
|---|---|---|---|
| 8.2 Merkmalstafel, Zeile „Wortlaut" | „Überfällig seit 3 Tagen" | **„Überfällig"** als Zustandswort, das absolute Datum daneben | T-147 AN-02, T-154 Abschnitt 4.1 |
| 8.2 Absatz „Ein Punkt, der leicht übersehen wird" | relative Angabe plus Datum | der zugängliche Name lautet **„Überfällig — Frist: 03.09.2026"** | `apps/web/src/components/DeadlineFlag.tsx` |
| 8.4 Tafel, Zeile „Fokus beim Öffnen" | auf „Abbrechen" bei ausführbaren Endungen | Fokus auf dem **Dialog** (`tabIndex={-1}`); **kein** Knopf trägt den Anfangsfokus | `AttachmentOpenDialog.tsx`, A-A-6 Punkt 4, T-154 Abschnitt 4.3 |
| 8.5 Begriffstafel, Zustand 1 | „im Satz ‚Überfällig seit N Tagen'" | **„Überfällig"**, dahinter das Datum; **kein** Satz mit „seit N Tagen" | dieselben |

**Der Grund für die erste, zweite und vierte Zeile ist derselbe, und er steht in diesem Bericht
selbst:** „Wer die Karte hört, kann mit ‚überfällig' nicht planen." Eine relative Angabe („seit
zwei Tagen") verlangt vom Benutzer genau die Rückrechnung, die dieses Argument vermeiden wollte —
er erfährt nicht, ob er den Termin am Montag oder am Freitag verpasst hat. Das absolute Datum gibt
ihn her. Das Argument spricht damit **gegen** die relative Angabe und nicht für sie. Dazu kommt
die dritte Auflage, unter der dieser Bericht die dritte Markenfamilie überhaupt zugelassen hat:
Sie darf nicht laut sein. „Überfällig 03.09.2026" ist kürzer und leiser als „Überfällig seit
3 Tagen".

**Für den Dokumentierer:** Aus 8.5 wird der Wortlaut **„Überfällig"** übernommen. Der Satz
„Überfällig seit N Tagen" ist in keiner Fassung von Takt gebaut worden. Er darf in kein Handbuch,
kein Glossar und keine Freigabe.

---

## 0. Die drei Sätze vorweg

1. **Abschnitt 18 ist inhaltlich erfüllt.** Alle zwölf Anforderungen sind gedeckt; die zwei
   Anforderungen, gegen die man am leichtesten verstößt — A-18.5 und A-18.11 —, sind an der
   richtigen Stelle gelöst, nämlich durch die Abwesenheit einer Fläche und nicht durch eine
   stillgelegte. **Ein** Befund gegen die Fläche selbst: Der Dialog erscheint mitten in der Arbeit
   und nimmt den Fokus.
2. **A-18.7 hält.** Beide Antworten tragen dieselbe Gestalt, der Fokus liegt auf dem Dialog, und
   Escape beantwortet nichts. Das ist die sorgfältigste Umsetzung einer Einzelanforderung, die ich
   in diesem Vorhaben gesehen habe. Die eine Stelle, an der sie brechen kann, benenne ich in 2.3.
3. **Abschnitt 19 ist ungebaut, und zwei Entscheidungen fehlen, bevor jemand anfängt** — die
   Neuberechnung der drei Fristzustände über Mitternacht und die Frage, ob nach der Frist sortiert
   und gefiltert werden darf. Beides gehört vor die erste Zeile Code, nicht danach; Teil 2
   Abschnitt 8.6.

---

# Teil 1 — Das Tor über das Gebaute

## 1. Deckung A-18.1 bis A-18.12

| ID | Urteil | Beleg |
|---|---|---|
| A-18.1 | **erfüllt** | `apps/desktop/src-tauri/src/release.rs:158` — ein Aufruf `app.package_info().version`. Keine Datei, keine Umgebungsvariable, kein Argument zur Laufzeit. Die Oberfläche fragt über `app/connection.ts:237` und legt den Wert nirgends ab. **Anmerkung zur Dokumentation:** Befund U-06 |
| A-18.2 | **erfüllt** | Dienst: `version/checker.ts` — einmal beim Start (10 s versetzt), danach 24 h, harter Boden 60 min. Oberfläche: `useUpdateNotice.ts:62,138` sieht alle 6 h beim Dienst nach, ohne eine ausgehende Anfrage auslösen zu können (E-069, A-V-10) |
| A-18.3 | **erfüllt** | `release.rs:55` `RELEASE_TAG_PREFIX` und `version/source.ts`; gemessen von `proof:release-safety` und `proof:shell-surface` Prüfung 3/4. Beide stehen in `proof:all` (`package.json:26`) — die Zusage wird also gefahren und nicht nur behauptet |
| A-18.4 | **erfüllt** | `packages/domain/src/version.ts:369` `decideUpdateNotice` mit `comparePrecedence`, kein Zeichenkettenvergleich. Die Oberfläche vergleicht nichts selbst (`useUpdateNotice.ts:146`) |
| A-18.5 | **erfüllt** | `app/UpdateNotice.tsx:21` `return null`. Kein leerer Behälter, kein Abzeichen, keine Kopfzeile, die auf Inhalt wartet. Sechs verschiedene Lagen führen zu genau demselben Bild — Designsystem 12.1 zählt sie auf |
| A-18.6 | **erfüllt** | `components/UpdateDialog.tsx:187-194` — installierte Fassung, verfügbare Fassung, Release-Seite als lesbarer Text in Festbreitenschrift. Dass der Verweis ein Knopf und kein `<a href>` ist, ist die richtige Wahl und keine Auslassung: Ein Anker führte den Webview selbst nach github.com, und die Hülle hat keinen Navigationswächter |
| A-18.7 | **erfüllt** | Abschnitt 2 dieses Berichts |
| A-18.8 | **erfüllt** | `useUpdateNotice.ts:181` ruft ausschließlich `openReleasePage(version)`; die Hülle nimmt keine Adresse entgegen |
| A-18.9 | **erfüllt** | Kein `fetch` auf eine Datei, kein `download`-Attribut. Der Dialog sagt es außerdem im Vorspann: „Takt lädt nichts herunter und installiert nichts" (`UpdateDialog.tsx:173`). Das ist nicht Bescheidenheit, sondern das Gegengewicht zu der Erwartung, die der Knopf „Installieren" sonst weckt |
| A-18.10 | **erfüllt** | `useUpdateNotice.ts:216` `PATCH /settings { skippedVersion }` — im Bestand, nicht im Browserspeicher (R-20). Die Regel „gleich, nicht kleiner-gleich" liegt in der Domäne (`version.ts:379`), also meldet sich eine spätere, höhere Fassung wieder |
| A-18.11 | **erfüllt** | Zwei Ebenen, beide still. Dienst: `checker.ts:187-192` stellt den Zeitgeber nach einem Fehlschlag **nicht** neu — „kein zweiter Versuch im selben Lauf" ist wörtlich umgesetzt und nicht sinngemäß. Oberfläche: `useUpdateNotice.ts:130` fängt den Fehlschlag **im Ladevorgang** ab, damit `useAsync` gar keinen Fehlerzustand bekommt. Das ist der Punkt: Ein Fehlerzustand, den niemand zeigen darf, wäre ein Zustand, den irgendwann jemand zeigt |
| A-18.12 | **erfüllt** | Die Oberfläche stellt keine Anfrage nach außen (die CSP ließe sie nicht); die Route gibt zwei Felder heraus und nimmt keine entgegen (`routes/version.ts:67`) |

**Keine Anforderung aus Abschnitt 18 ist offen.** Der einzige Befund gegen diese Fläche steht in
2.3 und betrifft nicht, *was* gezeigt wird, sondern *wann*.

---

## 2. A-18.7 — ohne Vorauswahl

### 2.1 Was gebaut ist, und warum es die Anforderung wörtlich nimmt

| Merkmal | Umsetzung | Warum es zählt |
|---|---|---|
| Gestalt der Knöpfe | beide `variant="secondary"` (`UpdateDialog.tsx:223,226`) | Der Bestätigungsdialog dieser Oberfläche hebt seinen rechten Knopf hervor (Designsystem 8). Hier wäre genau das die Vorauswahl — und zwar für die Antwort, die den Benutzer aus der Anwendung heraus zu einer unsignierten Datei führt |
| Fokus beim Öffnen | auf dem **Dialog**, `tabIndex={-1}` (`:102`) | Fokus auf „Installieren" machte ein bloßes Enter zur Antwort; Fokus auf „Überspringen" machte es zur anderen. Beides wäre eine Vorauswahl mit der Tastatur |
| Tabulatorreihenfolge | erste Station ist „Später entscheiden" (Schließknopf, DOM-Reihenfolge), dann „Installieren", dann „Überspringen" | Die erste Station ist die folgenloseste. Kein Reflex trifft eine Entscheidung |
| Escape und Schließknopf | stellen zurück, beantworten nichts (`:127-130`) | „Überspringen" ist eine Entscheidung und soll keine sein, die jemand mit Escape trifft. Der Hinweis kommt beim nächsten Start wieder — das ist der vorsichtige Ausgang, und der Dialog sagt es auch (`:212`) |
| Nach „Installieren" | die Fassung wird **nicht** übersprungen (`:188` setzt nur `postponed`) | Wer die Seite ansieht und sich anders entscheidet, findet den Hinweis wieder. Ein „Installieren", das still überspringt, wäre eine zweite, unausgesprochene Antwort |

### 2.2 Zwei Stellen, die ich geprüft und für tragbar befunden habe

**Das Symbol an „Installieren".** `iconEnd="arrow-up-right"` steht an einem Knopf und nicht am
anderen. Das ist Ungleichheit, aber keine Hervorhebung: Der Pfeil sagt „das verlässt die
Anwendung", er sagt nicht „nimm mich". Er ist an dieser Oberfläche durchgehend das Zeichen für
einen Ausgang nach draußen. **Tragbar** — mit einer Auflage: Das Designsystem soll in 12.2
ausdrücklich festhalten, dass dieses Symbol keine Hervorhebung ist und dass „Überspringen"
deshalb auch **keines** bekommt, um es auszugleichen. Sonst führt der nächste Gleichmacher zwei
Symbole ein, und dann sind es zwei Knöpfe mit visueller Last statt keinem.

**Die Reihenfolge links vor rechts.** „Installieren" steht vorn. Position ist keine Auswahl,
solange weder Fokus noch Gestalt sie verstärken — und beides tut sie hier nicht. **Tragbar.**

### 2.3 Die eine Stelle, an der A-18.7 in der Praxis bricht

`useUpdateNotice.ts:138-141` sieht alle sechs Stunden beim Dienst nach. Meldet der Dienst dabei
eine neue Fassung, entsteht `UpdateDialog` mitten in der Sitzung — modal, über allem, und
`UpdateDialog.tsx:102` zieht den Fokus auf den Dialog. Der Benutzer, der gerade einen Vermerk
tippt, verliert den Fokus aus dem Textfeld, ohne etwas getan zu haben.

Drei Folgen, und die dritte ist die schlimme:

1. Die Eingabe bricht ab, ohne dass es dafür einen Anlass des Benutzers gab (SC 2.4.3 — der
   Fokus wandert an eine Stelle, die die Bedienbarkeit nicht erhält; Änderung des Kontextes ohne
   Anforderung).
2. Der Vermerk in S-03 wird von Hand gespeichert und hat **keine** Rückfrage beim Verlassen
   (Befund C-15, unten U-09). Was halb getippt war, steht danach noch da — aber der Benutzer
   weiß es in dem Moment nicht.
3. **Ein Dialog, der einen bei der Arbeit überfällt, wird weggeklickt.** Genau das ist R-20, nur
   aus der anderen Richtung: Nicht die Wiederkehr macht ihn zur Formsache, sondern der falsche
   Zeitpunkt. Und ein Dialog, der zur Formsache geworden ist, hat faktisch eine Vorauswahl —
   nämlich die, die am schnellsten geht.

A-18.2 verlangt, dass Takt **prüft**, nicht dass es **unterbricht**. A-18.6 verlangt, dass Takt
die Fassung **anzeigt** — nicht, dass es dafür den Fokus nimmt.

---

## 3. Zustandsabdeckung der neuen Flächen (Abschnitt 15)

### 3.1 Dialog der Versionsprüfung

| Zustand | Vorhanden | Beleg |
|---|---|---|
| Leer | ja — und er ist der Normalfall | `UpdateNotice.tsx:21`; Designsystem 12.1 zählt die sechs Lagen auf, die zu demselben Nichts führen |
| Lädt | ja, und bewusst unsichtbar | Während der Prüfung erscheint nichts. Sichtbar ist nur der Ladezustand von „Überspringen" (`Button loading`). Ein Ladeanzeiger für eine Prüfung, die unsichtbar bleiben soll, wäre der Fehler |
| Zeiger / Aktiv / Fokus | ja | aus `Button`/`IconButton`; kein neues CSS, keine neue Farbe, `contrast` unverändert 0 von 432 |
| Fehler | ja, **im** Dialog | `UpdateDialog.tsx:202` `role="status"`, von Beginn an im Baum, auch leer — dieselbe Regel wie bei `refusal` in `ConfirmDialog`. Vier Fälle: Bezeichnung abgewiesen, kein Browser, keine Hülle, Überspringen gescheitert |
| Bestätigung | ja | Meldung nach dem Öffnen der Seite und nach dem Überspringen, letztere mit der Fassungsnummer |

**Vollständig.** Einzige Anmerkung: Die Fehlerfläche ist `role="status"` (höflich) statt
`role="alert"`. Das ist hier richtig, weil der Fokus nach dem Sperren der Knöpfe ohnehin auf dem
Dialog liegt und die Ansage damit ankommt; und es ist gleich gebaut wie an jeder anderen Stelle
dieser Oberfläche. Kein Befund.

### 3.2 Umbenennen-Dialog (`PoolRenameDialog`, O-A)

| Zustand | Vorhanden | Beleg |
|---|---|---|
| Leer | ja, zweifach | Feld leer → „Speichern" gesperrt, **Grund am Feld** und nicht erst nach dem Klick (`:157`); dazu der Leerzustand „Noch keine Spalte" im Verwaltungsdialog |
| Lädt | ja, zweifach | „Speichern" trägt den Anzeiger und **behält seine Farbe**; und solange die Regelliste nicht geladen ist, sagt eine Warnmeldung, dass die Vorabprüfung gerade nicht möglich ist (`:270-276`), statt Freiheit zu behaupten |
| Zeiger / Aktiv / Fokus | ja | aus `Button`, `TextField`, `Menu`, `FormDialog`; Fokusfalle, Escape und Fokusrückgabe bringt `FormDialog` mit |
| Fehler | ja, zweifach | Vorabprüfung gegen alle Regeln mit `COLLATE NOCASE`-Gleichsetzung (`:141-146`); dazu der `409 name_conflict` im Fehlerbereich des Dialogs |
| Bestätigung | ja, mit Rückweg | Meldung nennt beide Namen und trägt „Rückgängig". Der Rückweg läuft außerhalb von `mutation.run`, und **sein** Fehlschlag bekommt eine eigene Meldung (`:209-214`) — die O-AF-Regel, angewandt auf die eigene neue Fläche |

**Vollständig, und der beste Zustandssatz dieser Welle.** Der Zustand „unverändert" ist der, den
die meisten Umbenennen-Dialoge auslassen; hier ist er benannt, gesperrt und begründet.

### 3.3 Die zwei nachgebesserten Ausgänge im Exportordnerfeld

| Zustand | Vorhanden | Beleg |
|---|---|---|
| Leer | ja | „Noch nicht gewählt" als Pfadtext (`ExportDirectoryField.tsx:383`), dazu der Hinweistext des Dienstes |
| Lädt (Auswahldialog läuft) | ja | `loading={picking}` am Knopf |
| **Lädt (Hüllenfrage läuft)** | **nein** | Befund **U-02** |
| Zeiger / Aktiv / Fokus | ja | unverändert aus `Button`/`TextField` |
| Fehler | ja, jetzt an beiden Stellen | `:298-300` (unbeantwortete Hüllenfrage) und `:339` (geworfener Auswahldialog) setzen `pickerFailure`; das Textfeld tritt an die Stelle des Dialogs und der Grund steht darunter. **Beide Behebungen sind richtig** und schließen die Lücke, die T-133 beschreibt |
| Bestätigung | ja | `role="status"`-Ansage: „Ordner gewählt: … Zum Übernehmen speichern." und „Auswahl abgebrochen." |

Die beiden nachgebesserten Ausgänge sind fachlich richtig und vollständig. Was fehlt, ist der
Zustand **davor** — siehe U-02.

---

## 4. Deutsche Begriffe

### 4.1 Was T-133 geändert hat, gegen den Bestand geprüft

| Prüfung | Ergebnis |
|---|---|
| „Umbenennen" an allen drei Flächen (Spaltenkopf, „Spalten des Boards", Regelliste S-11) | **einheitlich.** `BoardScreen.tsx:307`, `:1131`, `TagsScreen.tsx` — dieselbe Handlung heißt überall gleich, und sie heißt so wie in S-08 (Tags, Ordner) und S-09 (Status) |
| „Bearbeiten" → „Regel bearbeiten" | **einheitlich.** Fünf Fundstellen, kein Rest von „Bearbeiten" allein an einer Regel |
| „Als Spalte aufnehmen" gegen „Auf das Board" (Befund aus T-116) | **behoben.** Nur noch „Als Spalte aufnehmen" / „Vom Board nehmen" (`TagsScreen.tsx:687`, `BoardScreen.tsx:1010`, `:1172`) |
| „Poolregel" auf der Musterseite (Befund aus T-116) | **behoben.** Keine Fundstelle mehr |
| „Zeiterfassung starten" gegen „Timer starten" (C-17) | **behoben** und im Quelltext mit dem Befund belegt (`Timer.tsx:83`, `Kanban.tsx:228`) |
| „Zielordner" für zwei Sachen (C-18) | **behoben** (`TagsScreen.tsx:428`) |
| Acht Längengrenzen, Titel 512 → 500 | **richtig.** Die 512 war ein vorbereitetes `422`: Der Benutzer durfte 512 Zeichen tippen, die Tür nahm 500. Dieselbe Sackgasse, die T-114 im Add-in beseitigt hat, nur an der anderen Tür. Keine sichtbare Beschriftung ändert sich dadurch |

**Kein neuer abweichender Begriff aus Welle O bis R.** Das ist das erste Mal in diesem Vorhaben,
dass ich diese Zeile schreiben kann.

### 4.2 O-BG — das Glossar, bestätigt und erweitert

| Eintrag | Stand | Was fehlt |
|---|---|---|
| „Status, Statusspalte" (`glossar.md:93`) | **vor E-054** | Sagt „Die Spalte des Kanban-Boards, in der ein Todo gerade steht". Seit E-054 ist eine Board-Spalte eine **Regel** über fünf Achsen; `todo_status` ist nur noch eine davon. Wer das Glossar als Quelle nimmt, baut das alte Modell nach |
| „Pool, Todo-Pool" (`:106`) | **vor E-055** | „definiert über eine Tag-Regel" — die fünf Achsen aus E-055 (erforderliche Tags, ausgeschlossene Tags, Status, Erledigt, Exportstatus) kommen nicht vor |
| **„Regel"** | **fehlt ganz** | Der Leitbegriff der heutigen Oberfläche hat keinen Eintrag. „Regel", „Board-Spalte", „Anzeigeort", „Spaltenkopf" stehen in fünf Dateien im Quelltext und in keiner Zeile des Glossars |
| „Suche und Filter" (`:116`) | **widerspricht dem Code** | Befund U-04 |
| Abschnitt 18 (Fassung, Versionsprüfung, Release-Seite, „übersprungen") | **fehlt ganz** | Vier neue Oberflächenwörter ohne Eintrag |

O-BG ist damit nicht nur bestätigt, sondern **größer als vermerkt**: Es sind nicht zwei veraltete
Einträge, sondern zwei veraltete, ein fehlender Leitbegriff, ein widersprüchlicher und eine ganze
fehlende Wortfamilie.

---

## 5. Barrierefreiheit an den neuen Flächen (WCAG 2.2 AA)

| Prüfung | Versionsdialog | Umbenennen-Dialog | Exportordnerfeld |
|---|---|---|---|
| Fokus beim Öffnen | auf dem Dialog, mit `aria-labelledby`/`aria-describedby` daran — nach ARIA APG die richtige Wahl, wenn kein Element angemessen ist | erstes Feld, über `FormDialog` | — |
| Tabulatorschleife geschlossen | **ja, und das war Arbeit.** `keepTabInside` kennt den Behälter nicht; der erste Shift+Tab wäre herausgelaufen. `UpdateDialog.tsx:139-148` schließt sie ausdrücklich, **auch dann, wenn gerade kein Knopf bedienbar ist** | ja, über `FormDialog` | entfällt (kein Dialog) |
| Fokus beim Sperren | `:116-122` — sperren sich alle Knöpfe während „Überspringen", geht der Fokus auf den Dialog statt an den Dokumentkörper. Ohne das stünde der Benutzer außerhalb eines modalen Dialogs, ohne ihn verlassen zu haben (SC 2.4.3) | `FormDialog` | — |
| Rückweg mit der Tastatur | Escape stellt zurück, Fokus kehrt zum Auslöser | Escape schließt, Fokus kehrt zurück | — |
| Bezeichnung für Vorlesehilfen | `IconButton label="Später entscheiden"`; die drei Angaben stehen in einer `<dl>`, also als Paare aus Begriff und Wert | `label="Name"`, Fehler und Hinweis am Feld | `role="group"` mit `aria-labelledby`, `aria-describedby` am Knopf auf Pfad **und** Hinweis |
| Meldebereich im Baum, auch leer | ja (`:202`) | ja (`FormDialog`) | ja (`dirfield__announce`) |
| Aussage nicht allein über Farbe | ja — Text, Symbol, Gestalt | ja | ja |

**Eine Lücke, ein Hinweis.**

* **Lücke:** der Fokusdiebstahl mitten in der Sitzung — U-01.
* **Hinweis, kein Befund:** Beim Sperren des Auswahlknopfes während der Hüllenfrage gibt es keine
  Ansage; für eine Vorlesehilfe ist der Knopf einfach „nicht verfügbar", ohne Grund. Das ist die
  Tastaturseite von U-02 und wird mit ihm zusammen behoben.

---

## 6. O-Q — die Liste, auf das gekürzt, was wirklich offen ist

T-116 hatte O-Q bereits auf vier Punkte geschrumpft; das Board trägt (Zeile 559) weiterhin
„14 Befunde aus T-025 unverändert offen". **Das Board ist an dieser Stelle seit Welle I falsch.**
Ich habe alle vierzehn gegen den heutigen Baum nachgemessen — nicht gegen T-116 — und komme auf
dieselben vier plus einen halben, mit einer Berichtigung.

| Nr | Stand nach T-133 | Beleg, heute gemessen |
|---|---|---|
| C-10, C-11 | **erledigt bis auf die Tag-Suche** | die Suche in S-08 ist der halbe Rest, siehe unten |
| C-12 Dashboard ohne Exportsummen | **erledigt** | `DashboardScreen.tsx:161-167` — Kachel „Noch nicht exportiert" nennt offene Buchungen, Exportzeilen und den gerundeten Wert. Die Zeilen unter „Zuletzt bearbeitet" tragen weiterhin keine Summe; das ist richtig so, denn diese Liste ist eine Chronik und keine Pool-Ansicht, und A-6.6 ist über die Kachel und über „Buchungen von heute" (`:298`) erfüllt |
| C-13 gerundeter Wert am Gruppenkopf | **erledigt** | `app/dayGroup.ts:10,21-30` mit ausdrücklichem Bezug auf B-20; `TimeScreen.tsx:285-287` |
| C-14 vier der acht I-10-Filter fehlen | **offen** | `BookingsScreen.tsx:295-346` führt Exportstatus, „nur schon einmal exportierte", Ab-/Bis-Tag und Todo. **Kein Tag-, kein Pool-, kein Call-Filter, kein „hat Notiz"** |
| C-15 Vermerk ohne Rückfrage beim Verlassen | **halb, und seit U-01 schwerer** | `TodoDetailScreen.tsx:579-580` zeigt „Nicht gespeicherte Änderung"; kein `beforeunload`, kein Abfangen des Routenwechsels |
| C-16 Buchungszeilen in S-05 ohne Aktionen | **offen** | `TimeScreen.tsx:355-375` `TodayRow`: Exportstatus, Zeitraum, Dauer, Leistung, Herkunft — kein Bearbeiten, kein Löschen, kein Weg zum Todo. Damit hat S-05 keinen Zeigerzustand im Sinn von Abschnitt 15 |
| C-17, C-18, C-19, C-20, C-23 | **erledigt** | je im Quelltext mit dem Befund belegt (`Timer.tsx:83`, `TagsScreen.tsx:428`, `ExportScreen.tsx:684`, `components/WorkstationFacts.tsx:14`, `lib/labels.ts:247`) |
| C-21 keine Warnung vor einem nicht füllbaren Feld | **offen, entschärft** | `ExportGroups.tsx:211` zeigt „ohne Call"; eine ausgesprochene Warnung, dass die **aktive Vorlage** dieses Feld verlangt, gibt es nicht |
| C-22 globale Suche ohne Gruppierung | **schließen — aber nicht aus dem Grund, den T-116 nennt** | siehe U-04 |

**Ergebnis: O-Q sind vier Punkte und ein halber — C-14, C-16, C-21, die Tag-Suche in S-08 (A-4.4),
und C-15 halb.** Die Zeile im Board gehört auf diesen Stand gebracht; eine Liste, die vierzehn
sagt und vier meint, wird nicht gelesen, und das ist genau der Zustand, in dem sie seit Welle I
ist.

---

## 7. Befunde Teil 1

```
A-18.6, A-18.7, R-20, SC 2.4.3   S-alle, Dialog der Versionsprüfung          BLOCKIEREND
U-01  Abweichung: Meldet der Dienst beim Nachsehen alle sechs Stunden eine neue Fassung,
      entsteht der modale Dialog mitten in der Sitzung und nimmt den Fokus
      (`useUpdateNotice.ts:138-141` zusammen mit `UpdateDialog.tsx:102`). Die Eingabe des
      Benutzers bricht ohne seinen Anlass ab; im Vermerk von S-03 gibt es dafür bis heute
      keine Rückfrage (C-15). Ein Dialog, der bei der Arbeit überfällt, wird weggeklickt —
      und ein weggeklickter Dialog hat faktisch die Vorauswahl, die A-18.7 verbietet.
      A-18.2 verlangt, dass Takt prüft, nicht dass es unterbricht.
      Vorschlag: Den modalen Dialog nur beim Start öffnen. Findet das Nachsehen mitten in
      der Sitzung etwas, wird es gemerkt und beim nächsten Start gezeigt. Wer ihn sofort
      zeigen will, zeigt ihn ohne Fokusübernahme — dann ist er sichtbar und nimmt nichts.
      Zwei Zeilen: der Fokusaufruf in `UpdateDialog.tsx:102` bekommt eine Bedingung, und
      `useUpdateNotice` merkt sich, ob die Sitzung schon lief, als der Wert kam.

§15 (Loading State), Designsystem Regel 13   S-09 Exportordnerfeld
U-02  Abweichung: Solange `isShellPresent()` unbeantwortet ist, steht der Auswahlknopf
      gesperrt da (`ExportDirectoryField.tsx:389` `disabled={… || shell === null}`) — ohne
      Anzeiger, ohne Text, ohne Frist. Für das Auge ist das ein toter Knopf, für eine
      Vorlesehilfe ein „nicht verfügbar" ohne Grund. T-133 hat für „Takt beenden" genau
      diese Klasse mit einer 5-Sekunden-Frist gelöst, weil „es geschieht nichts" kein
      Ereignis ist; an der eigenen neuen Fläche ist dieselbe Einsicht nicht angewandt.
      Vorschlag: `loading={picking || shell === null}` am Knopf, damit „arbeitet gerade"
      nicht wie „geht nicht" aussieht; dazu eine Frist wie `QUIT_GRACE_MS`, nach deren
      Ablauf `pickerFailure` gesetzt wird und das Textfeld als Rückfallweg erscheint. Der
      Mechanismus dafür steht seit T-133 bereits in dieser Datei.

E-054, E-055, A-5.4   docs/glossar.md (O-BG)
U-03  Abweichung: Größer als im Board vermerkt. „Status, Statusspalte" (:93) und „Pool"
      (:106) stehen vor E-054/E-055; der heutige Leitbegriff **Regel** hat gar keinen
      Eintrag, ebenso wenig „Board-Spalte" und „Anzeigeort"; die ganze Wortfamilie aus
      Abschnitt 18 (Fassung, Versionsprüfung, Release-Seite, übersprungen) fehlt.
      Vorschlag: Ein Eintrag „Regel" als Leitbegriff mit den fünf Achsen aus E-055; „Pool"
      und „Board-Spalte" werden darunter als die zwei Anzeigeorte derselben Regel geführt;
      „Status" wird auf das reduziert, was es seit E-054 ist — eine von fünf Achsen.
      Die Wörter stehen fertig im Code (`lib/labels.ts` `POOL_PLACEMENT_SHORT`,
      `RULE_IS_A_RULE`); es ist keins zu erfinden. Documenter.

E-038, A-13.7   Globale Suche, docs/glossar.md:116, docs/benutzerhandbuch.md:378
U-04  Abweichung: Drei Quellen, zwei Antworten. E-038 sagt, die Suche trifft „Todo-Titel,
      Call-Nummer, Vermerk und Leistungstexte"; das Glossar und das Benutzerhandbuch sagen
      dasselbe; die Oberfläche sagt dem Benutzer wörtlich das Gegenteil: „Gesucht wird in
      Titeln, Call-Nummern und Leistungstexten — nicht im Vermerk" (`GlobalSearch.tsx:225`).
      Das Handbuch verspricht damit eine Funktion, die es nicht gibt. Nebenbei fällt damit
      die Begründung weg, mit der T-116 C-22 geschlossen hat — sie stützte sich darauf,
      dass kein Treffer aus dem Vermerk stammen kann.
      Vorschlag: Der Orchestrator entscheidet in eine Richtung, nicht die drei Agenten
      einzeln. Trifft die Suche den Vermerk (E-038 unverändert), braucht sie die
      Gruppierung nach Trefferart aus E-038, weil dann sichtbar sein muss, ob ein Treffer
      aus einem internen Vermerk oder aus einem Text stammt, der beim Kunden gelandet ist —
      C-22 lebt wieder auf. Trifft sie ihn nicht, bekommt E-038 einen Nachfolger, und
      Glossar und Handbuch ziehen nach. Der jetzige Zustand ist der einzige, der nicht
      vertretbar ist.

I-10, A-13.7   S-06 Buchungen (C-14)
U-05  Abweichung: Vier der acht Filter aus I-10 fehlen — Tag, Pool, Call-Nummer und
      „hat Notiz" (`BookingsScreen.tsx:295-346`). Die beiden ersten sind genau die, mit
      denen A-3.3 und A-4.5 arbeiten.
      Vorschlag: Tag und Pool zuerst; „hat Notiz" ist der Filter, mit dem man vor einem
      Export die Gruppen findet, die nach E-034 stehenbleiben würden. Unverändert offen
      seit T-025.

A-18.1, E-065   CLAUDE.md „Versionsprüfung", decisions.md E-065
U-06  Abweichung: Beide sagen, die installierte Fassung komme aus `version` in
      `tauri.conf.json`. Im Auslieferungsbau kommt sie aus `TAKT_RELEASE_VERSION`, also aus
      dem Git-Etikett, über eine Überlagerungsdatei (`apps/desktop/scripts/build-app.mjs:153-172`,
      `.github/workflows/release.yml:261`); `tauri.conf.json` trägt weiterhin `0.0.0` und
      ist der Entwicklungswert. A-18.1 ist trotzdem erfüllt — zur Laufzeit ist es eine
      Quelle —, aber der Satz, an dem sich der nächste Agent orientiert, stimmt nicht.
      Genau derselbe Punkt steht als T-136-3 offen und ist seither nicht beantwortet.
      Vorschlag: E-065 bekommt einen Satz über die Überlagerung, CLAUDE.md übernimmt ihn.
      Zwei Zeilen, und sie verhindern, dass jemand die 0.0.0 für einen Fehler hält und sie
      „repariert" — oder dass jemand sie für die ausgelieferte Fassung hält.

§15, A-6.9   S-05 Zeiterfassung (C-16)
U-07  Abweichung: Die Buchungszeilen unter „Buchungen von heute" tragen keine Aktionen
      (`TimeScreen.tsx:355-375`). Damit hat S-05 keinen Zeigerzustand im Sinn von Abschnitt
      15, und wer die Leistung einer eben gestoppten Buchung nachtragen will, muss über das
      Todo gehen — obwohl der Baustein `BookingFormDialog` in derselben Datei bereits
      eingebunden ist (`:27`, `:340`).
      Vorschlag: Dasselbe Zeilenmenü wie in S-06. Unverändert offen seit T-025.

A-8.7, A-2.6   S-07 Export-Ansicht (C-21)
U-08  Abweichung: Kann die aktive Vorlage für eine Gruppe ein verlangtes Feld nicht füllen —
      `Call` bei einem Todo ohne Call-Nummer —, sagt das vor dem Klick niemand. Gewarnt wird
      nur bei fehlender Leistung (E-034). Die Gruppenzeile trägt „ohne Call" bereits
      (`ExportGroups.tsx:211`); sie muss nur wissen, ob die aktive Vorlage ein Feld mit
      dieser Quelle führt.
      Vorschlag: Diese Verbindung herstellen. Die Vorlage liegt in derselben Ansicht.
      Unverändert offen seit T-025.

§15   S-03 Todo-Detailansicht (C-15)
U-09  Abweichung: Der Vermerk wird von Hand gespeichert und zeigt „Nicht gespeicherte
      Änderung" (`TodoDetailScreen.tsx:579`), aber beim Verlassen der Ansicht fragt nichts
      nach. Abschnitt 15 verlangt Bestätigungsdialoge; T-005 nennt diesen Fall ausdrücklich
      für S-03. Seit U-01 wiegt er schwerer, weil der Versionsdialog dem Benutzer den Fokus
      aus genau diesem Feld nehmen kann.
      Vorschlag: `beforeunload` plus Abfangen des Routenwechsels, solange `noteDirty` gilt.
```

**Nicht als Befund geführt** (Abweichung, aber die Umsetzung ist besser als die Vorlage): dass
der Verweis im Versionsdialog ein Knopf und kein Anker ist; dass die Fehlermeldungen im Dialog
und nicht im Meldungsstapel stehen; dass „Installieren" die Fassung nicht mit überspringt.

---

# Teil 2 — Screen- und Zustandsmatrix für Abschnitt 19

Gebaut ist nichts: Weder „Frist" noch „Anhang" kommen als Feld, Route, Spalte oder Beschriftung
im Baum vor. Was folgt, ist die Ableitung vor dem Bau.

> **Lesehinweis (Nachtrag T-165):** Abschnitt 19 ist inzwischen gebaut (T-146 bis T-150, T-157,
> T-158). Vier Stellen dieses Teils sind damit überholt; sie stehen am Kopf des Berichts in
> Abschnitt 0.0 und sind unten je an Ort und Stelle markiert. Alles Übrige gilt unverändert.

## 8.1 A-19.4 — welche Screens die Frist tragen, und welche nicht

A-19.4 sagt „in der Todo-Ansicht sichtbar, ohne dass man das Todo öffnen muss". Der Zweck ist
nicht Vollständigkeit, sondern dass man sie sieht, **wo man plant**. Vier Stellen mehr Anzeige
sind vier Stellen, die auseinanderlaufen können; ich schlage **zwei** vor.

| Screen | Frist? | Begründung |
|---|---|---|
| **S-02 Todo-Liste** | **ja — hier ist sie Pflicht** | Das ist wörtlich „die Todo-Ansicht" aus A-19.4. Die Zeile trägt heute Titel, `DoneFlag`, `ExportSummaryStrip` und Tags (`TodoListScreen.tsx:602-621`); die Frist kommt zwischen `DoneFlag` und die Tags |
| **S-04 Kanban-Karte** | **ja** | Eine Karte ist das Todo, ohne es zu öffnen — der Fall, den A-19.4 meint. A-5.5 macht die Karte zur Arbeitsfläche; eine Frist, die man auf dem Board nicht sieht, wird auf dem Board nicht eingehalten. Der Baustein ist derselbe wie in S-02 (`Kanban.tsx`) |
| **S-03 Todo-Detailansicht** | **ja, aber als Feld** | Das ist der Ort aus A-19.3 (setzen, ändern, entfernen), nicht aus A-19.4. Er zählt nicht als dritte Anzeigestelle, weil dort das Eingabefeld selbst steht |
| **S-01 Dashboard** | **nein, bis auf eine Zahl** | Die Liste „Zuletzt bearbeitet" ist ausdrücklich eine **Chronik der letzten Arbeit**, keine Pool-Ansicht (`DashboardScreen.tsx:52-54`) — sie beantwortet „woran war ich zuletzt", nicht „was ist dran". Eine Frist an dieser Zeile ist die dritte Kopie desselben Bausteins ohne neue Aussage. **Eine** Ausnahme ist vertretbar und nützlich: eine Kachel „**Überfällig**" mit einer Zahl, neben „Heute erfasst" und „Noch nicht exportiert". §12 zählt ausdrücklich beispielhaft auf, was aufs Dashboard gehört, und „was ist überfällig" ist die Frage, für die ein Dashboard da ist. Eine Zahl ist keine vierte Etikettenstelle |
| **S-05 Zeiterfassung** | **nein** | Die Todo-Auswahl in S-05 beantwortet „worauf buche ich **jetzt**". Die Zeile trägt dort schon Timerknopf, Titel, `DoneFlag` und die Exportauskunft (`TimeScreen.tsx:232-287`); eine vierte Marke ist der Verstoß gegen A-13.2, den man am leichtesten nicht bemerkt. Die Liste teilt sich **keinen** Zeilenbaustein mit S-02, die Frist käme also nicht von selbst mit — sie müsste eingebaut werden, und das ist der Grund, sie nicht einzubauen |
| **S-06 Buchungen** | **nein** | Die Einheit dort ist die Buchung, nicht das Todo. A-19.7 sagt ausdrücklich, dass die Frist an Zeitbuchungen nichts ändert |
| **S-07 Export-Ansicht und Vorschau** | **nein, und zwar hart** | A-19.17. Die Frist in der Exportvorschau zu zeigen legte nahe, sie gehöre zum Lauf. Dieselbe Grenze wie beim Vermerk, aus demselben Grund |
| **S-12 Add-in** | **nein, ohne Anforderungs-ID** | A-19.19 schließt nur Anhänge aus, nicht die Frist. Aber es gibt keine A-ID, die eine Frist im Add-in verlangt, und ohne ID wird nichts gebaut. Offene Frage F-T144-3 |

**Ergebnis: zwei Anzeigestellen (S-02, S-04), ein Eingabeort (S-03 und das Todo-Formular, A-19.3),
eine Zahl auf S-01.** Drei Bausteine, nicht sieben — und die zwei Anzeigestellen teilen sich einen
Baustein.

## 8.2 Die drei Zustände — die dritte Sorte Marke am Todo

### Trägt es?

Am Todo hängen heute zwei Markenfamilien: **`DoneFlag`** (erledigt / Erledigt aufgehoben / offen)
und der **Exportstatus** (`ExportStatusBadge`, `ExportStatusMarker`, `ExportSummaryStrip`). Eine
dritte trägt **nur unter drei Auflagen**, und ohne sie wird die Karte eine Wand aus Etiketten:

1. **Sie ist genau ein Element**, nicht drei Varianten eines Bausteins mit eigenen Farben. Ein
   `Deadline`-Element, das immer das **Datum** zeigt und dessen Zustand die Lautstärke bestimmt.
2. **Sie ist abwesend, wenn keine Frist gesetzt ist.** Das ist der Unterschied zu `DoneFlag`, das
   nach Designsystem 3.4 *immer* dasteht, auch als „Offen". A-19.5 sagt es selbst: „Ein Todo ohne
   Frist hat keinen dieser Zustände." Es gibt also keine Marke „ohne Frist", und damit trägt die
   Mehrzahl der Karten weiterhin zwei und nicht drei.
3. **Nur zwei der drei Zustände sind laut.** „Später fällig" ist eine ruhige Datumsangabe ohne
   Zustandswort — sonst wäre die dritte Marke auf jedem Todo mit Frist voll sichtbar, und das ist
   der Punkt, an dem A-13.2 kippt. Dasselbe Mittel benutzt das Designsystem schon bei `DoneFlag`
   („Die beiden Ausprägungen sind unterschiedlich laut").

Unter diesen drei Auflagen: **ja, es trägt.** Ohne sie nicht.

### Die Darstellung — sechs Merkmale, nur eines davon Farbe

Das Muster ist vorhanden und muss nicht erfunden werden: Designsystem 3.2 unterscheidet den
Exportstatus über sieben Merkmale. Dasselbe Verfahren, auf drei Zustände angewandt:

| Merkmal | überfällig | heute fällig | später fällig |
|---|---|---|---|
| Wortlaut | ~~„Überfällig seit 3 Tagen"~~ **ÜBERHOLT (T-165) — es gilt: „Überfällig", das absolute Datum daneben** | „Heute fällig" | „Frist: 12. September" |
| Absolutes Datum | immer dabei, hinter dem Zustandswort | immer dabei | ist der ganze Text |
| Symbol | `alert-triangle` | `calendar-clock` (neu) | `calendar` (neu) |
| Füllung | voll gefüllt | Kontur, kräftiger Rahmen | keine Fläche, nur Text mit Symbol |
| Schriftschnitt | halbfett | halbfett | normal |
| Farbe | Rot-Rampe | Bernstein-Rampe | Text-Sekundärfarbe |

Fünf der sechs Merkmale tragen ohne Farbe. Die Graustufenprobe der Musterseite muss den Fall
mitbekommen — sie ist der Schalter, mit dem sich das in einem Klick prüfen lässt.

**Ein Punkt, der leicht übersehen wird:** „Überfällig seit 3 Tagen" allein ist für eine Vorlesehilfe
zu wenig. Wer die Karte hört, kann mit „überfällig" nicht planen. Deshalb steht das **absolute
Datum immer** im zugänglichen Namen, nicht nur im `title`.

> **ÜBERHOLT in der Fassung, gültig in der Sache (Nachtrag T-165).** Die Folgerung — das absolute
> Datum steht immer im zugänglichen Namen — ist gebaut und bestätigt. Die relative Angabe ist es
> nicht und soll es nicht werden: Gebaut ist `"Überfällig — Frist: 03.09.2026"`
> (`DeadlineFlag.tsx`). Das eigene Argument dieses Absatzes spricht gegen „seit N Tagen", weil der
> Benutzer damit zurückrechnen müsste, um den verpassten Tag zu erfahren. Bestätigt in T-147 AN-02
> und T-154 Abschnitt 4.1.

### Fünf neue Symbole

Der Symbolvorrat ist eine geschlossene Liste (`components/Icon.tsx:11-47`, 36 Namen). Abschnitt 19
braucht **fünf** neue: `calendar`, `calendar-clock`, `paperclip`, `link` und `image`. Das ist eine
Änderung am Designsystem und keine Zugabe in einer Aufgabe; sie gehört benannt, bevor drei Agenten
drei Kalendersymbole zeichnen.

## 8.3 Anhänge — fünf Flächen, je fünf Zustände

### Fläche A — der Anhangbereich am Todo (S-03, A-19.11)

| Zustand | Was dasteht |
|---|---|
| **Leer** | `EmptyState` (kompakt, Symbol `paperclip`): „Keine Anhänge" — „Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört. Takt kopiert nur Bilder; Verweise und Dateien merkt es sich als Adresse beziehungsweise Pfad." Der zweite Satz gehört genau hierhin: Er ist die Erwartung, an der sonst A-19.15 scheitert |
| **Lädt** | Skelettzeilen in der Zahl der zuletzt bekannten Anhänge, sonst drei. Kein Ladeanzeiger über der ganzen Karte |
| **Zeiger** | Zeile hebt sich ab, Entfernen erscheint; das Öffnen ist die Zeile selbst |
| **Aktiv / Fokus** | Fokusring am ganzen Zeilenelement; Reihenfolge Zeile, dann Entfernen |
| **Fehler** | Die Liste ließ sich nicht laden: `InlineMessage` im Bereich mit „Erneut versuchen". **Nicht** die Karte ausblenden — sonst sähe „keine Anhänge" genauso aus wie „nicht geladen", und das ist der Fehler, den A-19.15 für den einzelnen Anhang ausdrücklich verbietet |

### Fläche B — Hinzufügen, mit artabhängigem Eingabefeld (A-19.10)

Die Art wird **zuerst** gewählt, und das Feld darunter wechselt. Drei Segmente
(`role="radiogroup"`, nicht drei Knöpfe), Voreinstellung **Verweis** — die harmloseste der drei,
und die einzige, die kein Öffnen auf dem Rechner auslöst.

| Zustand | Was dasteht |
|---|---|
| **Leer** | Pflichtfeld leer → „Hinzufügen" gesperrt, **Grund am Feld** und nicht erst nach dem Klick. Derselbe Griff wie in `PoolRenameDialog` |
| **Lädt** | Nur beim Bild: Es wird ins Anwendungsdatenverzeichnis kopiert (E-071 Punkt 2), und das dauert sichtbar. Knopf mit Anzeiger, **Farbe behalten** (Designsystem 5) |
| **Zeiger / Aktiv / Fokus** | aus `FormDialog`, `TextField`, `Segmented`; Fokusfalle und Escape bringt der Dialog mit. Beim Wechsel der Art geht der Fokus in das neue Pflichtfeld, sonst steht er auf einem Feld, das es nicht mehr gibt |
| **Fehler** | Vier, und sie sind verschieden: (1) Adresse ohne `http`/`https` oder ein UNC-Pfad → am Feld, mit dem Grund, **bevor** gespeichert wird (R-22); (2) Dateipfad nicht absolut oder nicht vorhanden → am Feld; (3) Bild zu groß → am Feld, mit der Obergrenze im Klartext (E-071 Punkt 3); (4) Speichern gescheitert → Fehlerbereich des Dialogs |
| **Bestätigung** | Meldung „Anhang hinzugefügt." mit „Rückgängig" — das Hinzufügen ist umkehrbar, also ein Rückweg und keine Rückfrage (E-059) |

**Wichtig, und leicht falsch zu bauen:** Die Prüfung im Feld ist Bedienkomfort, **nicht** die
Sicherung. E-072 Punkt 2 verlangt die Prüfung im Öffnen-Befehl der Hülle, bei jedem Aufruf. Ein
Feld, das gut prüft, verführt dazu, die zweite Prüfung für Verdopplung zu halten. Zwischen Eingabe
und Öffnen liegen der Bestand, eine Migration und jeder künftige zweite Schreibpfad.

### Fläche C — die Liste mit Titel oder Ersatzbezeichnung (A-19.12)

| Zustand | Was dasteht |
|---|---|
| **Leer** | Kein eigener Zustand — der leere Fall ist Fläche A. **Was es hier nie gibt, ist eine leere Zeile**: Fehlt der Titel, steht bei einem Verweis der Wirt samt letztem Pfadstück, bei einer Datei der Dateiname ohne Verzeichnis. Fehlt auch das, steht der volle Wert. A-19.12 sagt „nie eine leere Zeile", und das ist wörtlich zu nehmen |
| **Lädt** | siehe Fläche A |
| **Zeiger** | Zeile hebt sich ab; der **volle** Wert erscheint als `title` und in einer zweiten, kleineren Zeile — bei einer Datei ist der Pfad die einzige Auskunft darüber, was gleich startet |
| **Aktiv / Fokus** | Fokusring; die Art steht als Symbol **und** als Wort im zugänglichen Namen („Verweis: Kundenportal"). Ein Symbol allein ist für eine Vorlesehilfe keine Art |
| **Fehler** | Fläche E |

Titel und Ersatzbezeichnung sind **fremder Text** im Sinn von E-063: Beide kommen aus einer
Benutzereingabe und ein Pfad zusätzlich aus dem Dateisystem. Sie gehen durch `<Foreign>`
beziehungsweise `quotedName`, sonst dreht ein `U+202E` im Dateinamen die Anzeige um — und das ist
an einer Zeile, deren Klick ein Programm startet, kein Schönheitsfehler. `proof:foreign` findet
das von selbst, sobald die Träger `ForeignText` heißen.

### Fläche D — das Vorschaubild (A-19.13)

| Zustand | Was dasteht |
|---|---|
| **Leer** | entfällt — ein Bildanhang ohne Bild existiert nicht (E-071 Punkt 2: die Kopie liegt im Anwendungsdatenverzeichnis) |
| **Lädt** | Fläche in der bekannten Größe mit Skelettfüllung. **Kein Umspringen des Layouts**, wenn das Bild kommt: Die Fläche steht vorher da |
| **Zeiger** | leichte Anhebung; **kein** Vergrößern beim Überfahren — A-19.18 verlangt, dass nichts als Nebenwirkung geschieht, und eine Lupe beim Überfahren ist genau das |
| **Aktiv / Fokus** | Fokusring. Ein Klick öffnet die größere Ansicht **innerhalb** von Takt. **Ein Bild öffnet nichts nach draußen** (E-072 Punkt 2) — der Öffnen-Befehl der Hülle wird für ein Bild gar nicht erst gerufen |
| **Fehler** | Die Kopie ist nicht mehr lesbar: an der Stelle des Bildes ein Feld mit dem Satz und dem Titel, **nicht** ein kaputtes Bildsymbol. Der Anhang verschwindet nicht (A-19.15) |

Das Bild kommt als `data:`-Adresse, die die Oberfläche selbst baut (E-071 Punkt 3). Die CSP bleibt
unverändert. Es gibt genau **eine** Obergrenze für die Bildgröße, und sie steht an einer Stelle —
nach T-128 und T-134 ist die Regel dafür in diesem Vorhaben ausgearbeitet.

### Fläche E — der Anhang, der sich nicht öffnen lässt (A-19.15)

Der Anhang **verschwindet nicht** und **wirft nicht**. Er sagt es an Ort und Stelle, in seiner
eigenen Zeile.

| Fall | Was dasteht |
|---|---|
| Datei nicht mehr da | „Diese Datei ist an diesem Pfad nicht mehr vorhanden." mit dem vollen Pfad darunter. Kein „Erneut versuchen" — es gibt nichts zu wiederholen. Zwei Wege: Anhang entfernen, oder Pfad bearbeiten |
| Adresse unbrauchbar | „Diese Adresse lässt sich nicht öffnen: Takt öffnet nur `http` und `https`." Der Grund ausgeschrieben, weil er sonst wie eine Störung aussieht statt wie eine Regel (R-22) |
| Bild nicht mehr lesbar | Fläche D, Zeile „Fehler" |
| Öffnen abgewiesen (Hülle) | Derselbe Ort. Der abgewiesene **Wert** erscheint nicht in der Meldung — dieselbe Regel wie bei `version_rejected` in T-139 |
| Keine Hülle (Browserbetrieb) | „Anhänge öffnet die Takt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung." Wortgleich zur bestehenden Auskunft am Ordnerauswahldialog und an der Release-Seite — dieselbe Lage, derselbe Satz |

Der Fehlerzustand steht **in der Zeile**, nicht im Meldungsstapel: Der Stapel liegt seit T-110
hinter der Abdunklung, solange ein Dialog steht, und die Anhangliste kann in einem Dialog liegen.
Das ist dieselbe Lehre wie bei „Takt beenden" (T-133) und beim Versionsdialog (T-139).

## 8.4 Die Rückfrage vor dem Öffnen einer Datei (E-072 Punkt 3, R-21)

### Sie ist mit E-059 verträglich, und zwar aus einem Satz

E-059 nimmt „Vom Board nehmen" den Bestätigungsdialog, weil die Handlung **umkehrbar** ist: Was
sich rückgängig machen lässt, bekommt einen Rückweg und keine Frage. Das Öffnen einer `.bat` ist
**nicht** umkehrbar — es gibt kein „Rückgängig" für ein gestartetes Programm. Die zwei
Entscheidungen widersprechen sich also nicht; sie wenden dasselbe Kriterium an und kommen bei
verschiedenen Handlungen zu verschiedenen Ergebnissen. Das ist genau der Beleg, den die Rückfrage
braucht, und er gehört in die Entscheidung, damit sie nicht beim nächsten Aufräumen als
Inkonsequenz gestrichen wird.

### Wie sie sich von den bestehenden Bestätigungsdialogen unterscheiden muss

| Merkmal | Bestehender `ConfirmDialog` (Designsystem 8) | Die Rückfrage vor dem Öffnen |
|---|---|---|
| Folgesatz | fest, je Handlung einer | **wechselt mit der Dateiendung.** Bei `.txt`: „wird mit der eingestellten Anwendung geöffnet". Bei `.bat`, `.cmd`, `.exe`, `.com`, `.scr`, `.lnk`, `.ps1`, `.vbs`, `.msi`, `.reg`: „**Diese Datei wird dabei ausgeführt.**" Ein fester Satz ist der, den man nach dem dritten Mal nicht mehr liest; ein wechselnder wird gelesen, weil er sich ändert |
| Der Pfad | keiner | **voll, in Festbreitenschrift, umbrechend, nie gekürzt.** Ein Pfad mit Auslassungszeichen ist genau der, den ein Angreifer sich wünscht. Dateiname und Endung zusätzlich hervorgehoben — dort steht, was zählt |
| Knopfbeschriftung | „Löschen", „Zurücksetzen" | **„Öffnen"** bei harmlosen Endungen, **„Ausführen"** bei den obigen. Nie „OK", nie „Ja". Das Wort ist die Hälfte der Auskunft |
| Farbe des Bestätigungsknopfes | Farbe der Handlung | `danger` bei ausführbaren Endungen, sonst normal |
| Fokus beim Öffnen | im Bestätigungsknopf | ~~**auf „Abbrechen"** bei ausführbaren Endungen~~ **ÜBERHOLT (T-165) — es gilt: auf dem Dialog selbst (`tabIndex={-1}`), kein Knopf trägt den Anfangsfokus, in jedem Fall und nicht nur bei ausführbaren Endungen (A-A-6 Punkt 4).** Der Grund bleibt derselbe: Sonst beantwortet ein Enter aus dem Doppelklick heraus die Frage, bevor sie gelesen ist — dieselbe Überlegung wie A-18.7, nur mit größerer Folge |
| Kontrollkästchen | nur beim Zurücksetzen des Exportstatus | **keins.** Designsystem 8 sagt ausdrücklich, dass dieses Mittel sparsam eingesetzt wird; es an einer zweiten Stelle zu benutzen entwertet es dort, wo es Geld schützt. Die Wirkung entsteht hier über Wortlaut, Pfad und Fokus |
| „Nicht mehr fragen" | gibt es nirgends | **gibt es hier auch nicht**, und das ist keine Auslassung. E-072 Punkt 2 verlangt die Prüfung bei **jedem** Aufruf; eine gemerkte Antwort wäre genau das, was die Rückfrage zur Formsache macht. Passt zu E-068: kein Schalter, den niemand verlangt hat |
| Bei einem **Verweis** | — | **keine Rückfrage.** E-072 Punkt 3 sagt es: Ein Browser ist der erwartete Ausgang. Eine Frage vor jedem Verweis wäre die Gewöhnung, an der die Frage vor der Datei stirbt |

Zustände der Rückfrage: **Leer** entfällt (sie entsteht nur mit einem Anhang). **Lädt** — der
Bestätigungsknopf trägt den Anzeiger, solange die Hülle antwortet. **Zeiger/Aktiv/Fokus** aus
`ConfirmDialog`. **Fehler** — weist die Hülle ab (Pfad nicht mehr da, UNC, nicht absolut), bleibt
der Dialog stehen und nennt den Grund; er schließt sich nicht, als wäre etwas geschehen.

## 8.5 Begriffe — die Wörter, bevor drei Agenten drei Fassungen bauen

| Sache | Wort auf dem Bildschirm | Nicht |
|---|---|---|
| Der Tag am Todo | **Frist** (A-19.2) | „Fälligkeitsdatum", „fällig am", „Deadline", „Termin", „Due Date" |
| Zustand 1 | **Überfällig** (Etikett), dahinter das absolute Datum. ~~im Satz „Überfällig seit N Tagen"~~ **ÜBERHOLT (T-165), siehe Abschnitt 0.0** | „in Verzug", „abgelaufen", „versäumt", „rot", **und seit T-165 ausdrücklich auch „Überfällig seit N Tagen"** |
| Zustand 2 | **Heute fällig** | „heute", „fällig", „jetzt" |
| Zustand 3 | **Später fällig** als Begriff; **auf dem Bildschirm steht nur das Datum**, weil A-19.5 den Zustand benennt und nicht verlangt, ihn hinzuschreiben | „offen" (das ist der Exportstatus), „geplant", „künftig" |
| Kein Zustand | — es steht **nichts** da (A-19.5) | „Ohne Frist", „unbefristet" |
| Die Sammelsache | **Anhang**, Mehrzahl **Anhänge** (A-19.8) | „Anlage", „Attachment", „Datei-Anhang", „Beilage" |
| Art 1 | **Verweis** (A-19.9) | „Link", „URL", „Web-Adresse" |
| Art 2 | **Bild** (A-19.9) | „Grafik", „Screenshot", „Foto" |
| Art 3 | **Datei** (A-19.9) | „Dokument", „Lokale Datei", „Dateianhang" |
| Feld bei Verweis | **Adresse** (A-19.10) | „URL", „Link", „Ziel" |
| Feld bei Datei | **Dateipfad** (A-19.10) | „Pfad", „Ort", „Speicherort" |
| Feld bei Bild | **Bild** (A-19.10) | „Datei", „Bilddatei" |
| Beschriftung eines Anhangs | **Titel** (A-19.10), im Anhangdialog und nur dort | „Name", „Bezeichnung", „Beschriftung" |
| Was steht, wenn der Titel fehlt | in der Dokumentation **Ersatzbezeichnung**; auf dem Bildschirm kein eigenes Wort, dort steht einfach der lesbare Rest | — |

**Drei Wortkollisionen, die vor dem Bau ins Glossar gehören:**

1. **„Frist" heißt in diesem Bestand heute Zeitüberschreitung.** Dreizehn Fundstellen in
   `apps/web/src` (`ToastContext.tsx:123`, `ShellStatus.tsx:114`, `connection.ts:210`,
   `app.css:620`), dazu `docs/architektur.md:1465,1484` und `docs/bedrohungsmodell.md` an sechs
   Stellen. **Alle sind Kommentare und Fließtext, keine Oberflächentexte** — A-19.2 ist also nicht
   verletzt. Aber ab jetzt ist das Wort belegt. Regel: In Oberflächentexten heißt „Frist"
   ausschließlich der Tag am Todo; in Kommentaren und Dokumentation heißt eine Zeitüberschreitung
   **Wartefrist** oder **Zeitüberschreitung**. Sonst liest der nächste Agent „die Frist läuft ab"
   und meint das Falsche.
2. **„Verweis" ist schon vergeben** — der Versionsdialog nennt die Release-Seite so
   (`UpdateDialog.tsx:45`, Designsystem 12.2). Das ist **kein Konflikt, sondern eine Bestätigung**:
   beide Male ein Verweis auf eine Adresse. Der Glossareintrag führt beide Verwendungen auf, damit
   niemand eine davon in „Link" umbenennt.
3. **„Anhang" heißt in `docs/spec.md` auch „Anhang A — Was nicht vorliegt"**, also eine
   Dokumentgliederung. Nur Dokumentation, kein Oberflächentext. Der Glossareintrag nennt es, damit
   es beim Suchen nicht verwirrt.

## 8.6 Was vor der ersten Zeile Code entschieden gehört

**F-T144-1 — Wann rechnet „heute fällig" neu?** E-070 Punkt 3 sagt, der Zustand wird gerechnet und
nicht gespeichert. Es sagt nicht, **wann**. Wird er beim Zeichnen gerechnet, zeigt ein über Nacht
offenes Takt am Morgen weiterhin die Antwort von gestern — „heute fällig" für ein Todo, das seit
Mitternacht überfällig ist. Das ist genau die Klasse Fehler, die E-070 Punkt 3 verhindern wollte,
nur eine Ebene höher. **Vorschlag:** ein Zeitgeber, der auf den nächsten Tageswechsel in der
Zeitzone aus E-025 stellt und dann eine Neuberechnung auslöst — eine Stelle, nicht je Ansicht. Der
Dienst kennt die Zeitzone bereits (E-025).

**F-T144-2 — Darf nach der Frist sortiert und gefiltert werden?** E-070 Punkt 4 verbietet sie als
Achse in **Pools, Spalten und Export**. Von Sortierung und Listenfilter sagt es nichts. Eine Frist,
nach der man nicht sortieren kann, ist eine Verzierung: Bei achtzig Todos findet man das überfällige
nur, wenn man scrollt. Andererseits ist ein Filter „nur überfällige" eine Anzeigeachse mehr, und
C-14 zeigt, dass die vorhandenen Filter noch nicht einmal vollständig sind. **Ich entscheide das
nicht** — es gehört dem Auftraggeber beziehungsweise dem Orchestrator, weil es der Unterschied
zwischen einer Notiz und einem Planungsmittel ist.

**F-T144-3 — Legt das Add-in eine Frist an?** A-19.19 schließt nur Anhänge aus. Eine Frist aus einer
E-Mail ist harmlos (sie öffnet nichts), aber sie hat keine Anforderungs-ID — und ohne ID wird nichts
gebaut. Entweder eine A-10.x kommt dazu, oder es wird ausdrücklich ausgeschlossen. Der jetzige
Zustand, „steht nirgends", ist der, aus dem in Welle S jemand rät.

**F-T144-4 — Wieviel Fläche darf ein Bildanhang haben, und wo endet die Obergrenze?** E-071 Punkt 3
verlangt „eine Obergrenze für die Bildgröße, und sie steht an einer Stelle". Die Zahl gehört nach
`packages/domain` wie `MAX_TITLE_CHARACTERS` (T-128, T-134), nicht in die Oberfläche und nicht in den
Dienst. Sonst ist es die vierte handgeschriebene Zahl derselben Klasse.

---

## 9. Annahmen

* **AN-01.** Keine Shell, kein Browser in dieser Sitzung. Geprüft ist der Quelltext, nicht die
  laufende Anwendung. Nicht geprüft: die Bildschirmwirkung von Zeiger und Fokus an den neuen
  Flächen, das tatsächliche Verhalten des Versionsdialogs über der Sperrmeldung, und ob der
  Umbruch von `.rule-row` im schmalen Fenster hält (T-133 R5, e2e-tester).
* **AN-02.** Die Messungen aus T-133, T-138, T-139 und T-140 (`typecheck` 0, `test` 1028,
  `proof:foreign` 14, `proof:shell-surface` 4 Prüfungen mit 10 Gegenproben, `cargo test` 26,
  `contrast` 0 von 432) habe ich als gemessen übernommen und nicht nachgerechnet. Sie belegen, was
  sie prüfen. Die neun nicht gelaufenen e2e-Fälle aus O-P belegen nichts.
* **AN-03.** Für Teil 2 ist `docs/prototype/takt-ui-konzept.html` weiterhin nicht vorhanden;
  verbindlich sind Spezifikation und das Designsystem aus T-006 (E-013). Alle Vorschläge in Teil 2
  benutzen vorhandene Bausteine und Regeln; wo etwas Neues nötig ist — fünf Symbole, ein
  `Deadline`-Element —, ist es benannt und als Änderung am Designsystem ausgewiesen, nicht nebenbei
  eingeführt.
* **AN-04.** Ich führe U-01 als blockierend, obwohl A-18.6 wörtlich erfüllt ist. Begründung: Die
  Anforderung, die dabei bricht, ist A-18.7 — nicht in der Gestalt des Dialogs, sondern in seiner
  Wirkung. Ein Dialog, den man im Reflex schließt, hat eine Vorauswahl.
* **AN-05.** Wo eine Umsetzung von T-005/T-025 abweicht und die Abweichung besser ist, führe ich
  sie nicht als Befund. Betrifft: der Verweis als Knopf statt als Anker; die Frist **nicht** auf
  S-01 und S-05; „Überspringen" ohne „nie wieder fragen".

---

## 10. Offene Fragen an den Orchestrator

* **F-T144-1 bis F-T144-4** — siehe 8.6. Alle vier gehören vor den Bau von Abschnitt 19.
* **F-T144-5, hängt an U-04.** Trifft die globale Suche den Vermerk oder nicht? Danach richtet sich,
  ob C-22 wieder auflebt und ob das Benutzerhandbuch berichtigt werden muss.
* **F-T144-6, hängt an U-01.** Soll der Versionsdialog mitten in der Sitzung überhaupt erscheinen,
  oder erst beim nächsten Start? Ich empfehle den nächsten Start. A-18.2 verlangt Prüfen, nicht
  Unterbrechen — und der Dienst behält das Ergebnis ohnehin im Arbeitsspeicher.
* **F-T144-7.** Die installierte Fassung steht nirgends in der Anwendung — nur im Versionsdialog,
  und der erscheint nur, wenn es etwas Neueres gibt. Der Abschnitt „Diese Installation" in S-09
  (C-20) wäre der fertige Ort dafür; die Zahl liegt bereits vor (`connection.ts:237`). Keine
  Anforderung verlangt es, deshalb frage ich statt zu befinden.
* **F-T144-8.** Die Board-Zeile zu O-Q („14 Befunde … unverändert offen") stimmt seit Welle I nicht.
  Sie gehört auf vier plus einen halben gebracht — Abschnitt 6.

---

## 11. Urteil

**Nacharbeit.**

Blockierend: **U-01**, **U-03**, **U-04**.

* **U-01** ist der einzige Befund gegen Abschnitt 18 und der einzige, der einen Benutzer bei der
  Arbeit trifft. Der Rest dieser Fläche ist mit einer Sorgfalt gebaut, die ich ausdrücklich
  festhalte: A-18.5 und A-18.11 sind durch die **Abwesenheit** einer Fläche gelöst und nicht durch
  eine stillgelegte, und A-18.7 ist an vier Merkmalen gleichzeitig umgesetzt statt an einem.
  Die Behebung ist klein — der Fokusaufruf bekommt eine Bedingung.
* **U-03** blockiert, weil Abschnitt 19 unmittelbar bevorsteht. Ein Glossar, das den Leitbegriff
  der heutigen Oberfläche nicht kennt, ist die Quelle, aus der die nächsten drei Agenten drei
  Fassungen bauen — und Teil 2 dieses Berichts legt zwölf neue Wörter dazu. Es vorher zu richten
  kostet eine Stunde, danach eine Umbenennung über acht Dateien.
* **U-04** blockiert, weil das Benutzerhandbuch dem Benutzer eine Funktion verspricht, die es nicht
  gibt, und weil die Begründung, mit der T-116 einen Befund geschlossen hat, an derselben Stelle
  hängt. Es ist eine Entscheidung, keine Umsetzung.

Nicht blockierend, aber vor der Abnahme zu schließen: **U-02** (billig, der Mechanismus liegt in
derselben Datei), **U-06** (zwei Zeilen), und die vier plus ein halber aus O-Q — **U-05**, **U-07**,
**U-08**, **U-09** und die Tag-Suche in S-08. Mein Rat aus T-116 bleibt und wird durch diese
Zählung gestützt: Die vier gehören in **eine** Aufgabe, nicht in die Restspalte der nächsten
Reviewrunde. Sie sind jetzt so wenige, dass eine Aufgabe sie fasst.

Abschnitt 19 ist **nicht baubereit**, bis F-T144-1 und F-T144-2 beantwortet sind. Die Screen- und
Zustandsmatrix aus Teil 2 steht bereit und braucht keine weitere Vorarbeit.
