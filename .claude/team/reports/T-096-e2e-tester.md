Aufgabe: T-096 — End-to-End Ordnersperre und leerer Ordner

Status: fertig

Artefakte:

```
tests/e2e/kanban.spec.ts                 TP-KANBAN-06 (neu): leerer Ordner + Status in einer
                                         Regel trifft nichts, sagt es, füllt sich nach Tag im
                                         Ordner
tests/e2e/tag-folder-rule-lock.spec.ts   NEU — R-1 Befund 1 / T-089: Ordner in einer Regel ist
                                         nicht löschbar (409 tag_in_use, details[]), API direkt
                                         und über die Oberfläche; Gegenprobe mit einem Ordner
                                         ohne Regelbezug
tests/e2e/support/actions.ts             `createBoardColumn` um `requiredFolderPaths` und
                                         `statusNames` erweitert (`pickFolder`/`pickStatus`);
                                         veralteter Kommentar zur `RadioRow`-Bauform (T-091)
                                         berichtigt
tests/e2e/support/api.ts                 `deleteTagFolder`, `attemptDeleteTagFolder` (roh, für
                                         409/`details`-Prüfung), `setTodoTags`;
                                         `createPool` um `requiredFolderIds` erweitert
docs/testplan.md                         neuer Abschnitt 17: TP-KANBAN-06, TP-TAG-14, berichtigter
                                         Kommentar-Verweis, Rückverfolgbarkeitszeile A-5.1/A-5.3–
                                         A-5.6 auf „bis TP-KANBAN-06" nachgezogen, zwei für
                                         Welle C zurückgestellte Fälle ausdrücklich benannt
```

Nicht angefasst: `apps/**`, `packages/**` — beides fremde Hoheit, wie beauftragt.

Zusammenfassung:

Beide verlangten Abläufe sind als End-to-End-Fälle geschrieben und gemessen grün. TP-KANBAN-06
prüft E-057 mit einer Regel, die einen leeren Ordner **und** eine für sich erfüllbare
Statusachse kombiniert — der Fall, den E-057 eigentlich meint (nicht nur „leere Regel trifft
nichts", das ein anderer Fall bereits abdeckt): Der leere Ordner sperrt trotz erfüllter
Statusachse, die Regelvorschau nennt den Grund unter dem Spaltenkopf und im Leerzustand, und nach
Anlegen eines Tags im Ordner erscheint die Karte. `tag-folder-rule-lock.spec.ts` prüft R-1 Befund
1 / T-089 zweifach: direkt über die API (409 `tag_in_use`, `details` mit Kennung und Name der
Regel, Gegenprobe mit ungebundenem Ordner) und über die echte Oberfläche (Löschen-Dialog bleibt
offen, nennt den Dienstgrund, Ordner bleibt im Baum). Der veraltete Kommentar in `actions.ts` ist
berichtigt. `docs/testplan.md` trägt beide Fälle nach und benennt die beiden für Welle C
zurückgestellten Fälle (Bewegungssatz Hauptanwendung/Add-in, Stopp-Antwort) ausdrücklich als
geplant, nicht als Lücke.

**Zwei echte Befunde während der Umsetzung, beide behoben, keiner in fremder Hoheit repariert:**

1. **`tests/e2e/support/actions.ts`, `pickFolder` — eigener Testcode-Fehler.** Ein erster
   Entwurf suchte das Suchfeld der Ordnerauswahl über `dialog.locator('.field').filter({has:
   dialog.getByRole('group', {...})})`. Das hing den ganzen Testlauf über 60 Sekunden auf einem
   einzigen Klick auf — der `has`-Filter kombinierte, weil die übergebene Gruppen-Locator schon
   an `dialog` gebunden war, das Dialogpräfix ein zweites Mal und traf dadurch nichts. Behoben:
   Klick direkt auf `dialog.getByRole('group', {name, exact:true})`, das Suchfeld wird über die
   XPath-Achse `ancestor::div[...field...]` gefunden statt über einen zweiten Filter. Nachgemessen
   mit einer echten Fehlerausgabe (DOM-Schnappschuss zeigte die gesuchte Schaltfläche eindeutig
   vorhanden, nur der Zugriff darauf war falsch konstruiert).
2. **Der eigentliche Befund, nicht in `apps/web`-Hoheit repariert, sondern in der Testvorbereitung
   umgangen.** Nachdem 1. behoben war, blieb TP-KANBAN-06 an einer ganz anderen Stelle rot: Nach
   dem Zuweisen des neu angelegten Tags **über die API** (`setTodoTags`, bewusst gewählt, weil das
   Zuweisen über den Bearbeiten-Dialog bereits von TP-KANBAN-01 geprüft wird) zeigte ein zweiter
   `gotoBoard(page)` auf die **bereits offene** Route `#/kanban` weiterhin den alten Stand. Sechs
   unabhängige Nachweise vor der Behebung: Der Dienst selbst liefert bei direktem Abfragen
   (`GET /pools`, `GET /board`, mehrfach über eine reine API-Nachbildung ganz ohne Browser, mit
   Erstellung von Regel und Todo in beiden Reihenfolgen) durchgehend das richtige Ergebnis — die
   Regel löst sich korrekt auf, sobald der Tag im Ordner liegt, unabhängig davon, ob Regel oder
   Todo zuerst angelegt wurde und unabhängig davon, ob die Regel in einem oder in zwei Aufrufen
   entsteht. Erst `page.waitForResponse` zeigte: Der zweite `gotoBoard()`-Aufruf auf dieselbe,
   schon offene Route löst in der Oberfläche **keine neue Anfrage** aus. Das ist dasselbe Muster,
   das TP-KANBAN-04 bereits dokumentiert (`markTodoDone` über die API läuft am `bump()`-
   Mechanismus der Oberfläche vorbei) — nur diesmal zusätzlich verschärft dadurch, dass die Seite
   die Route gar nicht verlassen hatte. Der Testfall benutzt jetzt `page.reload()` statt eines
   zweiten `gotoBoard()`, exakt wie TP-KANBAN-04 es an der Stelle vormacht. Das ist eine
   Eigenschaft der **Testvorbereitung außerhalb der Oberfläche**, keine Reparatur an `apps/web` —
   mit dem echten Bearbeiten-Dialog (der über `#/todos` navigiert und danach `bump()` auslöst)
   bräuchte es das nicht, siehe TP-KANBAN-01.

Gemessen: `pnpm run test:e2e` — **37 von 37 bestanden, Exitcode 0** (zwei vollständige Läufe
hintereinander, TP-KANBAN-06 zusätzlich fünffach isoliert über `--grep`). Zwischenzeitlich lief
mindestens ein fremder Prozess auf denselben Ports (17843/5173/17844, PID mit „timeout 900
pnpm run test:e2e" — nicht meiner); abgewartet, nichts beendet, danach neu gemessen.

Annahmen:

1. **Fall 1 kombiniert zwei Achsen (Ordner + Status), nicht nur den Ordner allein.** Eine Regel,
   die ausschließlich aus einem leeren Ordner besteht, ist bereits durch A-3.4 („leere Regel
   trifft nichts") abgedeckt und würde den Unterschied zu E-057 nicht zeigen — dort verschwindet
   der leere Ordnerterm gerade **neben** einer erfüllbaren zweiten Achse als Neutralwert, wenn
   E-057 nicht griffe. Der Auftragstext „ein Todo mit passendem Status landet trotzdem nicht in
   der Spalte" verlangt das ohnehin.
2. **Fall 2, Erwartung „Regelname in der Oberfläche" — abweichend gemessen, dokumentiert statt
   stillschweigend gelockert.** Nachgesehen im Quelltext: `TaktApiError.details`
   (`apps/web/src/api/client.ts`) wird im gesamten `apps/web`-Baum an keiner einzigen Stelle
   gelesen — weder für `tag_in_use` (`TagsScreen.tsx`) noch für das genannte Vorbild
   `status_in_use` (`StatusSettings.tsx`). Beide Flächen zeigen heute nur die allgemeine
   Dienstmeldung ihres Fehlerschlüssels, nicht den konkreten Regelnamen aus `details` — obwohl
   die Auskunft seit T-089 vollständig vorliegt. Ein Testfall, der die wörtliche Erwartung
   erzwingt, wäre hier zwangsläufig rot und stünde gegen den Auftrag „nur die stabilen Fälle".
   Geprüft wird deshalb der tatsächliche, stabile Stand (Sperre greift sichtbar, Grund wird
   genannt, Ordner bleibt erhalten), die Lücke steht als offene Frage unten und im neuen
   Testplan-Abschnitt.
3. **`setTodoTags` (neue Hilfsfunktion in `support/api.ts`) statt des Bearbeiten-Dialogs für die
   Tag-Zuweisung in TP-KANBAN-06.** Reine Vorbereitung im Sinn von `support/api.ts`s eigenem
   Kopfkommentar — das Zuweisen über die Oberfläche selbst prüft bereits TP-KANBAN-01 mit einer
   direkten Tag-Regel; TP-KANBAN-06 hätte an derselben Stelle nichts Neues gemessen, aber die
   Laufzeit spürbar erhöht (25 s gegenüber jetzt unter 2 s).
4. **Zwei neue Testfälle in getrennten Dateien.** TP-KANBAN-06 in `kanban.spec.ts` (gleiche
   Familie wie 01–04, gleiche Hilfsfunktionen). Der Ordnersperre-Fall in einer neuen Datei
   `tag-folder-rule-lock.spec.ts`, weil er weder reine Tag/Ordner-CRUD (`tags-folders.spec.ts`)
   noch reine Kanban-Zugehörigkeit ist, sondern die referenzielle Integrität zwischen Ordner und
   Regel prüft — ein eigenständiges Thema mit eigenem API- und UI-Teil, nach demselben Muster wie
   `export-template-validation.spec.ts` (API direkt plus echter Weg durch die Oberfläche in
   derselben Datei).
5. **Erfundene Testdaten**, durchgehend mit `E2E-`-Präfix und Zeitstempel: „E2E-Kanban-
   LeererOrdner-…", „E2E-Ordnersperre-…". Keine echte Call-Nummer, kein Kundenname, kein
   Benutzername.

Risiken:

1. **Der zweite Befund (Punkt 2 oben) ist ein echter, bisher unentdeckter Fund über
   `apps/web`-Verhalten, nicht behoben, weil außerhalb meiner Hoheit.** Ein zweiter
   `page.goto()` auf eine bereits offene Route löst keine neue Anfrage aus; jede Änderung, die am
   Board-Zustand über die API vorbei geschieht (Timer-Webhooks, ein künftiges Add-in-Ereignis,
   ein zweiter Browser-Tab) und danach ohne Verlassen der Route erneut betrachtet wird, zeigt
   veraltete Daten, bis jemand die Seite neu lädt oder eine andere Route ansteuert. TP-KANBAN-04
   hat das Symptom für den API-Weg bereits dokumentiert; T-096 zeigt zusätzlich, dass selbst
   ein `page.goto()` auf die **identische** Route nicht hilft. Das ist ein Befund für
   frontend-dev/den Orchestrator, keine Reparatur, die in meine Dateihoheit gehört.
2. **Fall 2s Erwartungslücke (Annahme 2) ist eine offene Frage, kein bestandener Beweis für die
   ursprüngliche Formulierung.** Der Testfall belegt die Sperre und die Fehlermeldung, nicht die
   wörtliche Anzeige des Regelnamens.
3. **Sicherheit:** keine neue Angriffsfläche. Alle Zugriffe laufen über dieselben Fixtures und
   dasselbe Sitzungsgeheimnis wie die übrigen `tests/e2e/**`-Dateien; `attemptDeleteTagFolder`
   ist ein roher Lesezugriff auf eine bestehende Route, kein neuer Endpunkt.
4. **Kein Konflikt mit T-094 (frontend-dev, parallel in `apps/web/**`).** Die während dieser
   Aufgabe beobachteten Änderungen dort (`labels.ts`, `poolRule.ts`, `api/types.ts`) betrafen
   E-059-Wortlaute und `PoolMovement`-Typen, nicht die hier benutzten Selektoren
   (`RulePickers.tsx`-Gruppen, `.kcolumn__rule`, `BoardColumnEmpty`-Text). Kein Selektor musste
   deswegen angepasst werden.

Offene Fragen: an den Orchestrator

1. **Der Befund zu wiederholtem `page.goto()` auf dieselbe Route (Risiko 1)** — an frontend-dev
   weiterzugeben. Kein konkreter Selektor betroffen; es ist eine Eigenschaft des
   Board-Datenladens (`BoardScreen.tsx`/`RefreshContext`), nicht eines einzelnen Elements.
2. **Soll die Erwartung „Regelname in der Oberfläche" (Fall 2, Annahme 2) tatsächlich umgesetzt
   werden?** Falls ja: `TagsScreen.tsx`s `deleteError`/`StatusSettings.tsx`s `removeError`
   müssten `cause.details` lesen und den Namen aus dem `pool_rule`-Eintrag anhängen — eine
   Aufgabe in `apps/web`-Hoheit, nicht meine.

Nächster Schritt:

Welle C wie im Board vorgesehen: frontend-dev bindet die Stopp-Antwort an (T-094-Fortsetzung),
danach schreibe ich den Vergleich des Bewegungssatzes Hauptanwendung gegen Add-in (TP-EXPST-12,
Arbeitstitel) und TP-TIMER-08 für die Stopp-Antwort — beide bereits in `docs/testplan.md`
Abschnitt 17 als geplant vermerkt. Der Befund aus Risiko 1 sollte vorher an frontend-dev
adressiert werden, da er jeden künftigen „API-Änderung, dann zurück zur selben Route"-Testfall
betrifft.

Befehle, die ich benutzt habe:

```
pnpm run test:e2e
pnpm exec playwright test -c tests/e2e/playwright.config.ts <datei> --grep "<muster>" --retries=0
```
