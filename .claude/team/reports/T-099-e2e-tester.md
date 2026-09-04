Aufgabe: T-099 — End-to-End: Bewegungssatz, Stopp-Anzeige, details, gotoBoard

Status: fertig

Artefakte:

```
tests/e2e/pool-movement-sentence.spec.ts   NEU — TP-EXPST-12 (Arbeitstitel, jetzt vergeben):
                                           Bewegungssatz Hauptanwendung gegen Aufgabenbereich,
                                           reine Board-Spalte (E-056/E-058, in T-096
                                           zurückgestellter Fall), plus `leaves`- und
                                           „kein Treffer"-Fall
tests/e2e/timer-stop-announcement.spec.ts  NEU — TP-TIMER-08/09/10: Stopp-Antwort trägt den
                                           Bewegungssatz (`recorded`), `discarded` trägt keinen,
                                           `POST /timer/orphaned/resolve` ebenso — E-036 ohne
                                           Prozessabschuss ausgelöst
tests/e2e/tag-folder-rule-lock.spec.ts     GEÄNDERT — TP-TAG-14 geschärft: Regelname wörtlich im
                                           Dialogtext für Ordner und Status; für Tag als echten
                                           Fund dokumentiert (Regelname fehlt); Dialog-Selektor
                                           auf Rolle statt Titeltext umgestellt; neue Fälle Tag
                                           und Status
tests/e2e/kanban.spec.ts                  GEÄNDERT — beide `page.reload()` (TP-KANBAN-04,
                                           TP-KANBAN-06) durch ein zweites `gotoBoard(page)`
                                           ersetzt, Kommentare berichtigt
tests/e2e/support/api.ts                  GEÄNDERT — `createPool` um `statusIds`/`exportState`
                                           erweitert; `startTimer`, `touchTimerHeartbeat` neu;
                                           `stopTimer`/`resolveOrphanedTimer` typisiert
                                           (`poolMovement`, vorher `unknown`); neuer Abschnitt für
                                           die Add-in-Routen (`addinTodoMatches`,
                                           `addinBookOnTodo`)
docs/testplan.md                          GEÄNDERT — Abschnitt 17 erweitert: TP-EXPST-12,
                                           TP-TIMER-08/09/10 neu, TP-TAG-14 geschärft (inklusive
                                           Tag-Fund), Vermerk zum `gotoBoard`-Tausch,
                                           Rückverfolgbarkeit um E-036/E-056/E-058 ergänzt
```

Nicht angefasst: `apps/**`, `packages/**` — beides fremde Hoheit. Alle Funde dort sind Messungen
in diesem Bericht, keine Änderungen.

Zusammenfassung:

Alle fünf Teilaufträge sind umgesetzt und gemessen grün, zusätzlich mit einem echten neuen Fund.
Der Bewegungssatz ist jetzt an zwei Flächen gegeneinander geprüft — Timerstart in der Oberfläche
gegen Buchung über die Add-in-Route —, mit der Erwartung aus `poolMovementSentence` selbst
gezogen (Import aus `@takt/domain`, relativer Pfad zu `packages/domain/src/pool-movement.ts`,
genau wie `proof-addin.mjs` es vormacht), dazu ein `leaves`-Fall und der Fall ohne jeden Treffer.
Die Stopp-Anzeige ist an drei Fällen geprüft: `recorded` mit angehängtem Satz, `discarded` ganz
ohne, und `POST /timer/orphaned/resolve` — Letzteres ausgelöst, ohne die Hülle abzuschießen, über
`loadOrphanedTimer`s Eigenschaft, jeden beim Laden unvollständigen Eintrag als verwaist zu
melden. `tag-folder-rule-lock.spec.ts` prüft den Regelnamen jetzt wörtlich, und zwar an allen
drei Löschdialogen — dabei kam ein echter, bisher unentdeckter Fund heraus: Der Tag-Dialog nennt
die Regel **nicht**, weil `TagPort.remove()` (`packages/storage/src/sqlite/repo-tags.ts`) beim
Grund „Regel" keine `details` liefert, anders als Ordner und Status. Der Test behauptet das
jetzt ausdrücklich (`not.toContainText('Betroffen ist Regel')`), statt es zu übersehen. In
`kanban.spec.ts` sind beide `page.reload()` durch ein zweites `gotoBoard(page)` ersetzt, wie von
T-097 vorgeschlagen — beide Fälle bleiben grün, kein Fund an `apps/web`.

## 1. Bewegungssatz Hauptanwendung gegen Add-in (`pool-movement-sentence.spec.ts`)

Drei Testfälle, alle mit der Erwartung **aus der Domänenfunktion gezogen**:

1. **Hauptfall (`appears`, reine Board-Spalte).** Eine Spalte mit `placement: 'board'` und einer
   Tag-Regel (`completion: 'any'`, also der T-096-zurückgestellte Fall: `GET /addin/context`
   würde sie nie nennen, `poolMovementSentence` schon). Die Hauptanwendung startet den Timer auf
   der Detailansicht eines erledigten Todos; der Toast-Rumpf (`.toast__body`) ist **exakt**
   `poolMovementSentence(movement, 'past', 'reopen')`, mit `movement` aus der abgefangenen
   `POST /timer/start`-Antwort. Der Aufgabenbereich fragt für ein zweites, gleich aufgebautes
   Todo `GET /addin/todo-matches` (Ankündigung, Zukunft) und danach
   `POST /addin/todos/{id}/time-entries` (Bestätigung, Vergangenheit) — beide Antworten liefern
   `poolNames`/`enteringPoolNames`/`leavingPoolNames`, daraus wird `{appears, enters, leaves}`
   gebildet, genau wie `reopenPreview`/`reopenOutcome` in `apps/outlook-addin/src/duplicate/
   reopen.ts` es tun (gelesen, nicht importiert — fremde Hoheit). Der aus der Add-in-Antwort
   **nach** der Buchung gebildete Satz ist zeichengleich mit dem der Hauptanwendung; der Satz
   **vor** der Buchung unterscheidet sich ausschließlich in der Zeitform.
2. **`leaves`-Fall.** Eine reine „Nur erledigt"-Spalte (`completion: 'done'`); der Timerstart hebt
   „Erledigt" auf, die Karte verlässt die Spalte, erscheint sonst nirgends. Über die
   Hauptanwendung, mit exaktem Toast-Text.
3. **Kein Treffer.** Ein Todo ganz ohne Tags/Regelbezug, über den Aufgabenbereich, in beiden
   Zeitformen — der unangenehme, aber vollständige Satz „Auf dieses Todo passt derzeit keine
   Regel …".

Die Add-in-Routen wurden dafür direkt über HTTP angesprochen (`support/api.ts`, neuer Abschnitt),
nicht über eine simulierte Office.js-Oberfläche — das entspricht dem Auftragstext („sieh nach,
was `POST /addin/...` heute liefert") und dem einzigen heute vorhandenen Muster für
Add-in-Routenprüfung ohne echten Outlook-Prozess (`proof-addin.mjs` tut dasselbe, nur aus einem
Workspace-Paket heraus).

## 2. Stopp-Anzeige (`timer-stop-announcement.spec.ts`)

- **`recorded`.** Ein Pool mit `exportState: 'open'` über ein Tag (dafür `createPool` um
  `exportState` erweitert); die erste abgeschlossene Buchung setzt „hat offene Buchungen", die
  Spalte nimmt das Todo auf. Der Toast „Zeit gebucht." trägt am Ende seines Rumpfs genau
  `poolMovementSentence(movement, 'past', 'booking')`, aus der abgefangenen `POST
  /timer/stop`-Antwort gezogen. Gescoped auf den richtigen Toast (`.toast` mit `hasText`), weil
  der vorangegangene Start bereits einen eigenen Toast hinterlassen hat, der laut
  `ToastContext.tsx` bis zu acht Sekunden stehen bleibt — ein ungescopter Zugriff auf
  `.toast__title` träfe sonst zwei Elemente (erster Fund während der Umsetzung, siehe unten).
- **`discarded`.** Timer starten und ohne Wartezeit sofort über den Bestätigungsdialog stoppen
  (Leistung bleibt leer, das ist laut Dialoghinweis zulässig); Dauer bleibt unter einer Sekunde.
  `poolMovement` ist `null`, der Toast „Nichts gebucht." trägt keinen angehängten Satz — auch mit
  einer zutreffenden Regel im Hintergrund, damit es überhaupt etwas zu verschweigen gäbe.
- **`POST /timer/orphaned/resolve` (E-036).** Ohne die Hülle abzuschießen: Ein Timer wird über die
  rohe API gestartet (neue Funktion `startTimer` in `support/api.ts`), nach einer echten Wartezeit
  von 1,5 s ein Lebenszeichen gesetzt (`touchTimerHeartbeat`, neu), danach die Detailansicht zum
  **ersten Mal** in dieser (frischen) Seite aufgesucht. `loadOrphanedTimer`
  (`apps/local-api/src/usecases/timer.ts`) meldet **jeden** beim Laden unvollständigen Eintrag als
  verwaist, unabhängig vom Alter des Lebenszeichens — ein über die API gestarteter Timer ist für
  die gerade erst bootende Oberfläche ununterscheidbar von einem, der einen Absturz überlebt hat.
  Der Dialog „Eine Buchung ohne Ende" erscheint, „Entscheiden" (Vorgabe „Bis zum letzten
  Lebenszeichen buchen") löst `POST /timer/orphaned/resolve` aus; der Toast „Buchung
  abgeschlossen." trägt denselben Satz aus derselben Funktion.

**Drei echte Fehler in meinem eigenen Testcode, alle behoben, keiner in fremder Hoheit
repariert:**

1. Erster Entwurf füllte die Leistung, **bevor** der Stopp-Dialog überhaupt offen war —
   `page.getByLabel('Leistung')` traf dabei ein anderes Feld der Seite (nicht das
   Dialog-Textfeld), die Buchung blieb ohne Leistung, die Tagesgruppe zeigte „Ohne Leistung" statt
   des erwarteten Erfolgstitels. Nachgesehen über den Fehlerschnappschuss. Behoben: erst den
   Dialog öffnen, dann `dialog.getByLabel('Leistung')` gescoped füllen.
2. `.toast__title` ungescoped traf zwei Elemente (siehe oben) — behoben über `.toast`-Container
   mit `hasText`-Filter.
3. `orphanDialog.getByRole('button', { name: 'Entscheiden' })` traf ohne `exact: true` auch
   „Später entscheiden" (Playwright vergleicht Zeichenketten sonst als Teilzeichenkette,
   unabhängig von Groß-/Kleinschreibung) — behoben mit `exact: true`.

Zusätzlich fiel bei einer eigenen `tsc`-Gegenprobe (siehe „Annahmen") auf, dass `expected` aus
`poolMovementSentence(movement, 'past', 'booking')` laut Überladung `string | null` ist; zwei
Stellen benutzten `.endsWith(expected)`, ohne den `null`-Fall auszuschließen. Beide jetzt mit
`expect(expected).not.toBeNull()` plus einer Typverengung — kein `as string`, keine
Zusicherung, die etwas verdeckt.

## 3. `tag-folder-rule-lock.spec.ts` — Regelname im Dialogtext

Vier Fälle: der bestehende API-Fall (unverändert, prüfte den Regelnamen schon vorher über
`details[].message`), der bestehende Ordner-UI-Fall (jetzt zusätzlich mit
`Betroffen ist Regel „<Name>“.`), ein neuer Tag-UI-Fall, ein neuer Status-UI-Fall.

**Echter Fund, kein Testversehen: Das Tag zeigt den Regelnamen nicht.** Gemessen, nicht vermutet
— der erste Entwurf erwartete den Namen auch beim Tag und schlug rot fehl. Nachgesehen im
Quelltext (`packages/storage/src/sqlite/repo-tags.ts`): `createTagPort().remove()` zählt beim
Grund „Regel" nur `usage.rules > 0` und antwortet mit `taktError('tag_in_use', 'Dieses Tag wird
in der Regel eines Pools verwendet.')` — **ohne** `details`. Das Gegenstück
`createTagFolderPort().remove()` in derselben Datei fragt `pool_id`/`name` mit ab und liefert
`details: usedIn.map(poolReference)`; `TodoStatusPort.remove()` (an anderer Stelle) tut
dasselbe — bestätigt durch den neuen Status-Testfall, der den Namen zeigt. Der Kommentar über
der Folder-Funktion („Zwei Funktionen weiter oben, bei `TagPort.remove`, stand dieselbe
Überlegung längst ausgeschrieben; hier fehlte sie.") bezieht sich, so weit ich es nachvollziehen
kann, auf das allgemeine Muster „vorher fragen statt der Datenbank zu vertrauen", nicht auf
`details` — die Zählabfrage bei `TagPort.remove()` (`SELECT COUNT(*) …`) holt keine Namen, kann
also auch keine liefern.

Der Testfall behauptet jetzt genau das Gemessene: den allgemeinen Satz („… wird in der Regel
eines Pools verwendet.") und ausdrücklich **keinen** Regelnamen (`not.toContainText('Betroffen
ist Regel')`). Das ist eine Erwartung, die bei einer künftigen Behebung in `packages/storage/**`
bewusst rot werden soll, statt einer stillschweigend zurückgenommenen Zusicherung zum Opfer zu
fallen — dieselbe Haltung wie bei jedem anderen dokumentierten, nicht behobenen Fund in dieser
Datei.

**Selektor robust gemacht, wie beauftragt.** Alle vier Fälle greifen den Dialog jetzt über
`page.getByRole('alertdialog')` ohne Namensfilter statt über den Titeltext `'Ordner löschen?'`.
Grund: Ordner- und Tag-Dialog wechseln nach einer Absage weder Titel noch Knopfbeschriftung
(anders als der Status-Dialog, der zu „Der Status wurde nicht gelöscht"/„Erneut
versuchen"/„Schließen" wechselt) — der bisherige Selektor verdeckte diese Ungleichheit zufällig.
`ConfirmDialog` ist an jeder dieser Seiten zu jedem Zeitpunkt genau einmal offen, ein Zugriff über
die Rolle bleibt deshalb eindeutig, unabhängig davon, ob frontend-dev die Wortlaute künftig
angleicht. Die Ungleichheit selbst ist damit **nicht** behoben — das bleibt eine offene Frage an
frontend-dev (unten).

## 4. `kanban.spec.ts` — `page.reload()` ersetzt

Beide Stellen (TP-KANBAN-04 Zeile ~312, TP-KANBAN-06 Zeile ~414) benutzen jetzt ein zweites
`gotoBoard(page)` statt `page.reload()`; die Kommentare darüber sind berichtigt und verweisen auf
T-097s Ursachenklärung (`popstate`/`useDataFreshness`). Beide Fälle bleiben grün — kein Fund an
`apps/web`, T-097 hat die Ursache bereits richtig behoben.

## 5. `docs/testplan.md`

Abschnitt 17 trägt jetzt: TP-EXPST-12 (Bewegungssatz), TP-TIMER-08/09/10 (Stopp-Antwort,
`discarded`, `orphaned/resolve`), TP-TAG-14 geschärft samt dem Tag-Fund, einen eigenen Absatz zum
`gotoBoard`-Tausch, und eine berichtigte Fundbeschreibung an der Stelle, wo TP-KANBAN-06 bisher
noch `page.reload()` als Zwischenlösung beschrieb. Die Rückverfolgbarkeitstabelle trägt neu
E-036, E-056, E-058, außerdem TP-EXPST-12 bei A-10.9.

Gemessen: `pnpm run test:e2e` — **45 von 45 bestanden, Exitcode 0**, zwei vollständige Läufe
hintereinander (vor und nach der `tsc`-Nachbesserung), zusätzlich die zehn neuen/geschärften
Fälle isoliert über `--grep "Bewegungssatz|Stopp-Anzeige|Regelsperre"` (10/10) und jede neue Datei
einzeln mehrfach. Port 17843/5173 waren zu Beginn frei; kein fremder Prozess während des Laufs
angetroffen, nichts beendet.

Annahmen:

1. **Add-in-Routen werden direkt über HTTP angesprochen**, nicht über eine simulierte
   Office.js-Oberfläche. Der Auftragstext verlangt das ausdrücklich („sieh nach, was
   `POST /addin/...` heute liefert"), und es ist das einzige heute vorhandene Muster, Add-in-Logik
   ohne echten Outlook-Prozess zu prüfen (`proof-addin.mjs`, außerhalb meiner Hoheit).
2. **Reine Board-Spalten und Pools über `createPool` (API), nicht über `createBoardColumn`
   (Oberfläche).** `kanban.spec.ts`s eigene Regel „Spalten entstehen ausschließlich über die
   Oberfläche" gilt dort, wo die Kanban-**Regelauflösung selbst** geprüft wird
   (TP-KANBAN-01 bis -06) — das ist hier nicht der Fall. Geprüft wird der **Satz**, nicht die
   Regel-Bauform; eine Spalte über die API anzulegen ist reine Vorbereitung, wie
   `tag-folder-rule-lock.spec.ts` es an anderer Stelle schon tut.
3. **`fifteenMinutesUntilNow()`/feste Zeitspannen für Add-in-Buchungen** — beliebig gewählt, nur
   plausibel (> 0, keine Zukunft, Sekundengenauigkeit gemäß `bookSchema`).
4. **`createPool` um `statusIds`/`exportState` erweitert, `startTimer`/`touchTimerHeartbeat` neu,
   `stopTimer`/`resolveOrphanedTimer` typisiert** — alles in `tests/e2e/support/api.ts`, meiner
   Hoheit. Rückwärtskompatibel: bestehende Aufrufer geben die neuen Felder nicht an
   (Vorgabewerte), und `stopTimer`/`resolveOrphanedTimer` wurden bisher nirgends außerhalb dieser
   Datei importiert (`cleanupAnyTimer` verwirft den Rückgabewert ohnehin) — geprüft per `grep`
   vor der Änderung.
5. **Erfundene Testdaten**, durchgehend mit `E2E-`-Präfix und Zeitstempel. Keine echte
   Call-Nummer, kein Kundenname, kein Benutzername.
6. **`discarded`-Fall hängt von echter Klickzeit ab** — dokumentiert im Test selbst
   (`test.info().annotations.push(...)`) und in `docs/testplan.md`: Überschreitet der Klickpfad
   auf einer stark ausgelasteten Maschine eine Sekunde, wird das als Zeitmessungsbefund vermerkt
   und der Fall gilt nicht als roter Beweis gegen die Anwendung. In beiden vollständigen Läufen
   ist das nicht eingetreten.
7. **Zwei `tsc`-Gegenproben durchgeführt, obwohl `tests/e2e` nicht im Arbeitsbereich steht**
   (`pnpm-workspace.yaml` schließt `tests/**` ausdrücklich aus, also kein `pnpm run typecheck`
   dafür). Playwright übersetzt beim Ausführen nur mit `esbuild` (keine vollständige
   Typprüfung); eine eigens erstellte, nicht eingecheckte `tsconfig.e2e-check.json` (gelöscht,
   bevor dieser Bericht entstand) hat einen echten Typfehler gefunden (Annahme 6 oben, Punkt „Drei
   echte Fehler"). Kein Nachweispfad ist dafür eingerichtet — ich melde es als offene Frage unten.

Risiken:

1. **Der Tag-Fund (Abschnitt 3) ist ein echter, bisher unentdeckter Fund in
   `packages/storage/**`, nicht behoben.** Wer ein Tag löschen will, das in einer Regel steht,
   bekommt zwar die Sperre, aber keinen Hinweis, welche Regel gemeint ist — bei zwanzig Regeln ist
   das der Unterschied zwischen einer Auskunft und einer Suche, derselbe Grund, aus dem T-097 die
   Namen bei Ordner und Status ergänzt hat.
2. **Die Ungleichheit im Dialogverhalten (Ordner/Tag wechseln Titel/Knopf nicht, Status schon)
   ist nicht behoben**, nur nicht mehr Bedingung für das Bestehen dieses Tests. Ändert
   frontend-dev künftig eines der drei Dialoge, bleibt der Test unberührt — was aber auch heißt,
   dass ein Regression an dieser Stelle von diesem Test **nicht** erkannt würde.
3. **`discarded`-Fall ist zeitabhängig**, siehe Annahme 6. Zweifach gemessen ohne
   Zeitüberschreitung; auf einer noch stärker ausgelasteten Maschine ist ein gelegentlicher
   Zeitmessungsbefund statt eines echten Ergebnisses möglich — dokumentiert, nicht versteckt.
4. **`GET /addin/todo-matches`/`POST /addin/todos/{id}/time-entries` werden ohne
   Office.js-Aufgabenbereich geprüft.** Das misst die Dienstantwort und die Formel, mit der
   `reopen.ts` daraus einen Satz baute (nachgebaut, nicht importiert) — nicht, ob der echte
   Aufgabenbereich dieselbe Formel tatsächlich anwendet. Diese Lücke ist strukturell dieselbe wie
   bei jedem anderen Test, der eine Add-in-Route direkt aufruft, und außerhalb meiner Hoheit zu
   schließen (Office.js-Testrahmen gehört zu `apps/outlook-addin/**`).
5. **Sicherheit: keine neue Angriffsfläche.** Alle neuen Aufrufe laufen über dieselben Fixtures
   und dasselbe Sitzungsgeheimnis wie die übrigen `tests/e2e/**`-Dateien. Die Add-in-Routen sind
   bestehende, verdrahtete Routen; `credentialPolicy` senkt die Anforderung dort ausdrücklich auf
   „irgendein Nachweis" (B-2.10), das Sitzungsgeheimnis erfüllt sie ohne ein zweites,
   ausgestelltes Add-in-Token zu benötigen — kein neuer Weg, keine neue Berechtigung.
6. **Kein Konflikt mit parallel laufenden Agenten beobachtet.** `git status` zeigt Änderungen an
   `docs/bedrohungsmodell.md`, `.claude/team/board.md`, `package.json` und neue Dateien unter
   `apps/web/test/`, `apps/desktop/test/` sowie Berichte anderer Agenten (R-1a, R-2a, R-3a,
   T-100) — keine davon von mir angefasst, keine Überschneidung mit `tests/e2e/**` oder
   `docs/testplan.md` festgestellt.

Offene Fragen: an den Orchestrator

1. **Soll `TagPort.remove()` (`packages/storage/src/sqlite/repo-tags.ts`) `details` für den
   Regel-Grund liefern, analog zu `TagFolderPort.remove()` und `TodoStatusPort.remove()`?** Das
   ist die restliche Hälfte der mit T-096 aufgeworfenen und mit T-097 zu zwei Dritteln
   eingelösten Erwartung „Regelname in der Oberfläche". Gehört in `packages/storage/**`,
   domain-dev-Hoheit; ich habe es nicht angefasst.
2. **Soll die Ungleichheit im Dialogverhalten (Ordner/Tag ohne Titel-/Knopfwechsel nach Absage,
   Status mit) angeglichen werden?** T-097 hat das als offene Frage hinterlassen; mein Selektor
   macht den Test dagegen unempfindlich, behebt sie aber nicht. `apps/web`-Hoheit
   (`TagsScreen.tsx`, `ConfirmDialog`-Aufrufer).
3. **`tests/e2e` steht außerhalb des pnpm-Arbeitsbereichs und hat keinen eigenen
   Nachweispfad für `tsc`.** Eine echte Typlücke (Annahme 7) wäre ohne die eigens erstellte,
   nicht eingecheckte Prüfdatei unentdeckt geblieben. Falls gewünscht, könnte ein
   `tsconfig.json` unter `tests/e2e/` (meine Hoheit) und ein Skript dafür eingerichtet werden —
   das wäre eine eigene, kleine Aufgabe, kein Nebenprodukt dieser hier.

Nächster Schritt:

Aus Sicht des e2e-testers ist T-099 abgeschlossen. Für die nächste Welle böte sich an: (1) O-1
oben an domain-dev, damit der Tag-Löschdialog denselben Regelnamen zeigt wie Ordner und Status;
(2) ein `tsconfig.json` unter `tests/e2e/**` samt Nachweispfad, damit Typfehler wie der in diesem
Auftrag gefundene künftig ohne Handarbeit auffallen.

Befehle, die ich benutzt habe:

```
pnpm run test:e2e
pnpm exec playwright test -c tests/e2e/playwright.config.ts <datei> --reporter=list
pnpm exec playwright test -c tests/e2e/playwright.config.ts --grep "<muster>" --reporter=list
pnpm exec tsc -p <eigens erstellte, nicht eingecheckte tsconfig> (Gegenprobe, siehe Annahme 7)
```
