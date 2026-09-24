Aufgabe: T-097 — Stopp-Antwort anbinden, `details` anzeigen, `page.goto()`-Fund

Status: fertig

Artefakte:

```
apps/web/src/api/types.ts               StopTimerResult trägt poolMovement in beiden Zweigen
                                        (recorded: PoolMovement | null, discarded: null);
                                        überholter Kommentar an StartTimerResult.poolMovement
                                        („Nur an dieser Antwort … erst mit T-093") berichtigt
apps/web/src/app/TimerContext.tsx       performStop und confirmOrphan bilden den Satz mit
                                        poolMovementSentence(movement, 'past', 'booking');
                                        reportStopped bildet den Rumpf einmal und hängt den Satz
                                        an genau einer Stelle an; zwei Modulfunktionen
                                        (bookingSentence, withMovement); Entscheidung zum
                                        Doppel-Toast bei confirmSwitch dokumentiert
apps/web/src/lib/errorText.ts           NEU — enumerateGerman, ruleReferences,
                                        errorMessageWithRules: die Dienstmeldung um die Regeln
                                        aus details[] ergänzt, an einer Stelle
apps/web/src/screens/TagsScreen.tsx     Löschdialog für Tag und Ordner nennt die Regeln beim
                                        Namen; die Vorwarnung nennt seit T-089 beide Gründe
apps/web/src/screens/StatusSettings.tsx Löschdialog nennt die Regeln beim Namen und läßt den
                                        falschen Zusatz „ein Todo dazugekommen" im Regelfall weg
apps/web/src/app/useRoute.ts            Rückgabe { route, revisit }; popstate erkennt das
                                        erneute Ansteuern derselben Adresse (gemessene
                                        Ereignistabelle im Dateikopf)
apps/web/src/app/useDataFreshness.ts    NEU — reload() + bump() bei revisit und bei
                                        visibilitychange; kein Zeitgeber, kein focus
apps/web/src/app/router.ts              navigate() über location.assign statt location.hash =
apps/web/src/app/App.tsx                revisit von App über ConnectedApp bis Workspace;
                                        useDataFreshness(revisit) genau einmal
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `tests/**`, `docs/**`, `package.json`,
`tsconfig*.json`. Alle Nachweise für fremde Hoheit sind Messungen, keine Änderungen.

Zusammenfassung:

Die Stopp-Antwort ist angebunden. `POST /timer/stop` und `POST /timer/orphaned/resolve` liefern
seit T-093 `poolMovement` in beiden Zweigen; die Oberfläche bildet daraus den Satz mit
`poolMovementSentence(movement, 'past', 'booking')` aus `@takt/domain` — kein eigener Wortlaut,
keine Umformulierung, `null` heißt keine Fläche. Gemessen an der laufenden Anwendung liest der
Toast nach dem Stopp: „Zeit gebucht. — Gebucht: 2 s. An diesem Tag sind für dieses Todo 2 s offen
— das ergibt beim Export 0,25. **Es steht jetzt in „E2E-StoppSatz-…“.**" Zweitens liest die
Oberfläche `TaktApiError.details`: Die Löschdialoge für Ordner, Tag und Status nennen die Regeln
beim Namen („… Betroffen ist Regel „Ost“."), und zwar über **eine** Funktion in
`apps/web/src/lib/errorText.ts`, nicht dreimal. Drittens ist der `page.goto()`-Fund behoben und
die Ursache belegt: `hashchange` feuert bei gleichem Anker nicht, `popstate` schon — ein zweites
Ansteuern derselben Route holt die Daten jetzt frisch, und `page.reload()` ist im Test dafür nicht
mehr nötig. Alle drei Teile sind gegen die echte Anwendung gemessen, der dritte zusätzlich mit
einer Gegenprobe ohne die Behebung.

## 1. Stopp-Antwort (E-058 Punkt 6)

Gelesen wurden zuerst `apps/local-api/openapi/takt-local-api.yaml` (`/timer/stop` ab Zeile 1767,
`/timer/orphaned/resolve` ab 1974, `PoolMovement` ab 3953) und `apps/local-api/src/usecases/
timer.ts`. Der Dienstcode bestätigt, was die Beschreibung sagt, und beantwortet die Frage aus dem
Auftrag: Im **verworfenen** Zweig steht `poolMovement` nicht „in aller Regel", sondern
**ausnahmslos** fest auf `null` — an allen drei Stellen, an denen `kind: 'discarded'` entsteht
(`stopTimer`, und zweimal in `resolveOrphanedTimer`), ohne daß eine einzige Regel aufgelöst wird.
`movementOfBooking` rechnet überhaupt nur, wenn das Todo vorher keine offene Buchung hatte. Der
Typ in `api/types.ts` bildet das ab: `poolMovement: null` im verworfenen Zweig, `PoolMovement |
null` im gebuchten. Damit kann keine Aufrufstelle im verworfenen Zweig nach einer Bewegung fragen,
die es dort nicht gibt.

Der Satz hängt am bestehenden Toast „Zeit gebucht." — an **allen fünf** Rümpfen, die
`reportStopped` je nach Antwort der Exportvorschau bildet. Dafür ist die Funktion umgebaut: Sie
bildet den Rumpf jetzt in einem Ausdruck und zeigt den Toast an genau einer Stelle, statt an fünf
Stellen `toasts.show` zu rufen. Fünf Anhängestellen wären fünf Gelegenheiten, eine zu vergessen —
und ausgerechnet die beiden Warnfälle („Exportwert ließ sich nicht abfragen", „noch nicht
abrechenbar") wären die vergessenen gewesen, obwohl die Karte auch dort gewandert ist.

„Nichts gebucht." und „Buchung verworfen." bekommen **keinen** Satz und keine leere Fläche. Das
ist keine Auslassung, sondern die Folge des Typs: Ohne Buchung bewegt sich nichts.

`undoReactivation` liest `poolMovement` bewußt nicht: Die Buchung, die dieser Stopp erzeugt, wird
in der nächsten Zeile gelöscht und „Erledigt" gleich darauf wieder gesetzt. Der Satz wäre schon
falsch, während er vorgelesen wird.

## 2. `details` in den Löschdialogen

`apps/web/src/lib/errorText.ts` ist die eine Stelle. `errorMessageWithRules(cause)` ist ohne
`details` Wort für Wort `errorMessage(cause)` — die heutige Auskunft bleibt, wo der Dienst nichts
mitgibt. Mit `details` kommt genau ein Satz dazu: „Betroffen ist Regel „Ost“." bzw. „Betroffen
sind Regel „Ost“, Regel „Nord“ und Regel „Abrechnung“." Die Aufzählungsform ist die aus
`poolMovementSentence` (`listPools`), weil derselbe Benutzer beide am selben Tag liest;
`listPools` ist nicht exportiert, deshalb steht die **Form** hier ein zweites Mal und nicht die
Funktion. Die Anführungszeichen setzt die Hilfsfunktion im Unterschied zu `listPools` nicht selbst
— sie stehen im Text des Dienstes bereits.

Der Name kommt **unzerlegt** aus `details[].message`. Der Vertrag steht in
`packages/storage/src/sqlite/mappers.ts` (`poolReference`) und lautet: `code` ist `pool_rule`,
`field` ist die Kennung des Pools, `message` nennt ihn beim Namen (wörtlich `Regel „Ost“`). Ein
Ausdruck, der daraus „Ost" herausschneidet, um „Der Ordner wird von der Regel „Ost“ verwendet." zu
bauen, schneidet beim nächsten Wortlaut die Hälfte des Namens ab, und niemand wird dabei rot.
Deshalb der etwas andere Satzbau als im Auftragstext — dieselbe Auskunft, ohne Zerlegung fremden
Textes. Das ist Annahme 1.

Nebenbefund und mitbehoben: Der Statusdialog hängte an **jede** Absage den Satz „Zwischen dem
Zählen und dem Löschen ist offenbar ein Todo dazugekommen. Schließen Sie diesen Dialog: Die Zeile
nennt jetzt, wie viele es sind, und führt zu ihnen." Für den vierten Grund von `status_in_use`
(seit T-076: der Status steht in einer Regel) ist das falsch — es ist kein Todo dazugekommen, die
Zeile nennt weiterhin null, und der Weg hinaus führt in die Regel. Der Zusatz entfällt jetzt genau
dann, wenn der Dienst Regeln genannt hat. Gemessen an der laufenden Anwendung:

> Der Status wurde nicht gelöscht — „E2E-Details-Status-…“ steht weiterhin zur Auswahl. Der
> Dienst hat das Löschen abgelehnt und dabei nichts verändert. **Diesen Status benutzt noch die
> Regel eines Pools oder einer Kanban-Spalte. Nehmen Sie ihn dort zuerst heraus. Betroffen ist
> Regel „E2E-Details-Regel-…“.**

Und für den Ordner:

> Dieser Ordner wird in der Regel eines Pools verwendet. **Betroffen ist Regel
> „E2E-OrdnerDetails-Regel-…“.**

## 3. `page.goto()` auf eine offene Route

**Ursache, gemessen statt vermutet.** Der Anker-Router hört ausschließlich auf `hashchange`, und
`hashchange` feuert nur, wenn sich der Anker **ändert**. Ein `bump()` im `hashchange`-Behandler
hätte den Fall also gar nicht erreicht — die Vermutung aus dem Auftrag trägt nicht. Gemessen wurde
stattdessen mit einer eigenen Seite, die Ereignisse und Dokumentladevorgänge mitschreibt
(Chromium über Playwright 1.62, dieselbe Fassung wie `tests/e2e`):

| Handlung | Ereignisse | Dokument neu geladen |
|---|---|---|
| `page.goto()` auf **denselben** Anker | `popstate` | nein (keine einzige Anfrage) |
| `page.goto()` auf einen **anderen** Anker | `popstate`, dann `hashchange` | nein |
| Klick auf einen Verweis zum **eigenen** Anker | `popstate` | nein |
| `location.assign` auf denselben Anker | `popstate` | nein |
| `location.hash = <derselbe Wert>` | **nichts** | nein |
| `history.back()` | `popstate`, dann `hashchange` | nein |
| `page.reload()` | — | ja |

Daraus der Zuschnitt: `hashchange` bringt die neue Adresse, **`popstate` bringt das erneute
Ansteuern derselben**. Weil `popstate` bei einem echten Wechsel ebenfalls feuert und zwar
**zuerst**, prüft der `popstate`-Behandler, ob der Anker derselbe ist, und tut sonst nichts —
sonst zählte jeder Wechsel doppelt. `useRoute` liefert deshalb `{ route, revisit }`; `revisit`
steigt ausschließlich beim erneuten Ansteuern.

`useDataFreshness(revisit)` (einmal, in `Workspace`) ruft daraufhin `structure.reload()` **und**
`bump()`. Beides ist nötig: `bump()` erneuert die Ansichten, aber nicht die Struktur — und eine
Kanban-Spalte ist seit E-054 eine Regel aus eben dieser Struktur. Dazu kommt `visibilitychange`
als zweiter Anlaß, für den Fall, um den es eigentlich geht: Wer aus Outlook zurückkommt, wo er
über den Aufgabenbereich gebucht hat, hat gar nicht navigiert. Kein Zeitgeber, kein Polling, kein
`focus` (das feuert auch beim Zurückspringen aus einem Dialog derselben Anwendung).

`navigate()` geht seit T-097 über `location.assign` statt `location.hash =`, weil letzteres bei
gleicher Zieladresse **gar nichts** auslöst (Zeile 5 der Tabelle). Verlauf und „Zurück" verhalten
sich gleich; beide legen einen Eintrag an.

**Gemessen, mit Gegenprobe.** Eine Probe außerhalb des Bestands (Konfiguration und Fall im
Kratzverzeichnis, `globalSetup` des echten E2E-Rahmens; `tests/e2e/**` blieb unberührt) legt eine
Board-Spalte über ein Tag an, weist das Tag **über die API** zu und ruft danach ein zweites Mal
`page.goto('/#/kanban')`:

- mit der Behebung: eine neue `/board`-Anfrage, die Karte erscheint — **bestanden**;
- ohne die Behebung (nur der `popstate`-Zuhörer entfernt, danach wiederhergestellt und
  typgeprüft): `page.waitForResponse` läuft in die Zeitüberschreitung, **keine einzige Anfrage** —
  genau der Fund aus T-096.

Messungen:

```
pnpm --filter @takt/web typecheck   Exitcode 0
pnpm --filter @takt/web build       Exitcode 0
pnpm run typecheck:test             Exitcode 0 (fünf Konfigurationen)
pnpm test                           Exitcode 0 — 648 Tests in 43 Dateien
pnpm check                          Exitcode 0 — 13 Nachweispfade 848/0, Kontrast 0 von 432
                                    Paaren durchgefallen, Zweigabdeckung gesamt 84,34 %
pnpm run test:e2e                   Exitcode 0 — 37 von 37, mit den Änderungen aus dieser Aufgabe
```

Ein `lint`-Skript gibt es weder in der Wurzel noch in `apps/web/package.json`; nichts erfunden.

Annahmen:

1. **Der Regelname wird unzerlegt aus `details[].message` übernommen**, statt „Regel „ " davor
   abzuschneiden. Daraus folgt der Satzbau „… Betroffen ist Regel „Ost“." statt des im Auftrag
   genannten „Der Ordner wird von der Regel „Ost“ verwendet." Begründung oben: Der Vertrag sagt
   zu, daß `message` den Namen nennt, nicht daß der Name allein darin steht — und eine Zerlegung
   fremden Textes bricht still.
2. **Beide Toasts bleiben stehen, wenn `confirmSwitch` erst stoppt und dann startet.** Nachgesehen
   in `ToastContext`: Meldungen stapeln sich (höchstens vier), jede ohne Rückweg verschwindet nach
   acht Sekunden, die Titel unterscheiden sie („Zeit gebucht." gegen „Timer gestartet. …"). Beide
   Sätze sind wahr und handeln von **verschiedenen** Todos. Einen zu unterdrücken hieße, die
   Auskunft über das Todo zu verschweigen, das der Benutzer gerade verläßt — und genau dort ist
   eine unerklärte Bewegung am teuersten (E-056). Offen bleibt, daß beide Sätze mit „Es" beginnen
   und das Todo nicht beim Namen nennen; der Wortlaut kommt aus `@takt/domain` und wird in Welle D
   zeichengleich gegen das Add-in gemessen — er ist hier nicht zu ändern.
3. **Die Vorwarnung im Löschdialog für Ordner und Tag nennt jetzt beide Gründe**, nicht nur den
   Inhalt: „Ein Ordner, in dem noch etwas liegt, wird nicht gelöscht — und ein Ordner, den eine
   Regel nennt, ebenso wenig." Seit T-089/Migration 0012 ist die Regel ein Sperrgrund; der Dialog
   nannte ihn vorher nicht, obwohl der Dienst ihn einen Klick später nennt. Beim Tag ist der alte
   Satz „Poolregeln, die ihn nennen, verlören sonst still ihre Bedeutung" aus derselben Zeit — er
   beschrieb das Kaskadieren, das es seit 0012 nicht mehr gibt.
4. **`visibilitychange` als zweiter Anlaß** ist nicht ausdrücklich beauftragt, aber im Auftragstext
   ausdrücklich erlaubt („Sichtbar-werden"-Signal). Ohne ihn bliebe genau der Fall unbeantwortet,
   der den Fund erst wichtig macht: die Buchung aus dem Add-in, ohne jede Navigation.
5. **`navigate()` über `location.assign`.** Ohne diese Zeile bliebe ein dritter Weg auf die eigene
   Adresse stumm. Verhaltensgleich im Verlauf, gemessen in der Tabelle oben.

Risiken:

1. **Ereignisverhalten ist an Chromium gemessen, nicht an WebKitGTK/WKWebView.** Die Auslieferung
   fährt Tauri: unter Windows WebView2 (Chromium, dieselbe Zeile der Tabelle), unter Linux und
   macOS WebKit. Für WebKit gilt spezifikationsseitig dasselbe — eine Navigation, deren Adresse
   sich nur im Anker unterscheidet, ist eine Anker-Navigation und lädt das Dokument **nicht** neu
   —, aber ob dort `popstate` feuert, ist hier nicht gemessen worden. Im schlechteren Fall
   verhält sich die Anwendung dort wie bisher (kein Nachladen beim erneuten Ansteuern); der
   `visibilitychange`-Weg bleibt davon unberührt. Zu prüfen wäre es in T-B05/T-B08, wo ohnehin eine
   echte Hülle gefahren wird.
2. **Zwei zusätzliche Ladevorgänge je erneutem Ansteuern** (`GET /settings`, `/tags`, `/pools`
   zweimal, `/todo-statuses` für die Struktur, dazu die Ansicht selbst). Auf der Loopback-Adresse
   ist das billig, und `useAsync` behält den Inhalt stehen — es blinkt nichts. Wer die
   Navigationsleiste als Klickstrecke benutzt, erzeugt trotzdem Anfragen; ein Entprellen wäre
   möglich, ist aber nicht eingebaut, weil es einen Zeitgeber bräuchte.
3. **Sicherheit: keine neue Angriffsfläche.** Keine neue Route, kein neuer Aufruf, kein neues
   Feld, das nach außen geht. `details[]` kommt aus dem eigenen Bestand des Dienstes und nennt
   Regelnamen, die dieselbe Oberfläche in `GET /pools` ohnehin listet (B-2.4). Der Bewegungssatz
   nennt Pool- und Spaltennamen, die derselbe Benutzer auf demselben Bildschirm sieht. Keine
   Kundendaten, keine Call-Nummern, keine Zugangsdaten in dieser Aufgabe.
4. **`errorText.ts` ist ungeprüft.** `apps/web/src` steht nicht in der Abdeckungsmessung
   (`vitest.config.ts`, `coverage.include` nennt nur die drei Pakete), die 80-%-Schwelle ist davon
   also unberührt — aber ungeprüft ist ungeprüft. Siehe „Nächster Schritt".

Offene Fragen: an den Orchestrator

1. **Der Ordner-Löschdialog wechselt nach einer Absage seinen Titel nicht.** Er fragt weiter
   „Ordner löschen?" und beschriftet den Knopf weiter mit „Löschen", während darunter steht, daß
   es nicht ging — `StatusSettings` macht es an derselben Stelle anders („Der Status wurde nicht
   gelöscht", „Erneut versuchen", „Schließen"). Zwei Muster für denselben Vorgang. Ich habe es
   **nicht** angeglichen: `tests/e2e/tag-folder-rule-lock.spec.ts` greift den Dialog über
   `getByRole('alertdialog', { name: 'Ordner löschen?' })` **nach** dem gescheiterten Versuch ab —
   eine Titeländerung machte den Fall rot, und `tests/e2e/**` ist fremde Hoheit. Gehört als
   Aufgabe in eine Welle, in der beide Hoheiten zugleich angefaßt werden.
2. **O-U bleibt offen und ist jetzt der einzige Buchungsanlaß ohne Auskunft.** `PUT`/`DELETE
   /todos/{id}/done` liefern kein `poolMovement`; der Toast nach „Erledigt" schweigt weiterhin über
   Spalten, obwohl das Kennzeichen die Achse „Erledigt" umlegt und damit dieselbe Sorte Bewegung
   auslöst wie eine erste Buchung. Nach T-097 ist Start, Stopp und verwaiste Buchung versorgt —
   das Erledigt-Kennzeichen ist die verbleibende Lücke.
3. **Soll `revisit` auch ein Signal für den Bildschirmleser sein?** Heute lädt die Ansicht still
   nach; wer denselben Navigationseintrag ein zweites Mal betätigt, hört nichts. Eine Ansage
   („Ansicht aktualisiert") wäre möglich, ist aber ohne Not zusätzliche Geräuschkulisse — S-16
   verlangt sichtbare Rückmeldung für Interaktionen, und ob ein Nachladen ohne Änderung eine ist,
   ist eine Produktfrage.

Nächster Schritt:

1. **e2e-tester (Welle D), Testanpassung — von mir nicht angefaßt.** In `tests/e2e/kanban.spec.ts`
   sind beide `page.reload()` jetzt entbehrlich: Zeile 312 (TP-KANBAN-04, nach `markTodoDone` über
   die API) und Zeile 414 (TP-KANBAN-06, nach `setTodoTags` über die API) können durch ein zweites
   `await gotoBoard(page)` ersetzt werden. Die beiden Kommentare darüber („`gotoBoard` allein auf
   einer bereits offenen Seite löst keine neue Anfrage aus", „am `bump()`-Mechanismus vorbei")
   stimmen dann nicht mehr. Der Ersatz ist der **bessere** Test: Er prüft den Weg, den ein Benutzer
   geht, statt eines Neuladens, das niemand auslöst. Ob umgestellt wird oder nicht — ein
   `page.reload()` ist kein offener Fund mehr.
2. **e2e-tester, neue Fälle:** TP-TIMER-08 (Stopp-Antwort) kann den Satz jetzt zeichengleich gegen
   `poolMovementSentence(movement, 'past', 'booking')` prüfen; der Aufbau steht oben im Abschnitt
   „Stopp-Antwort" (Board-Spalte mit `exportState: 'open'`, Todo ohne Buchung, Timer starten,
   stoppen). Für `details[]` liegen zwei gemessene Wortlaute vor (Status und Ordner), beide oben
   zitiert — die Erwartungslücke aus T-096 Annahme 2 ist damit geschlossen und prüfbar.
3. **unit-tester (Welle D):** `apps/web/src/lib/errorText.ts` — `enumerateGerman` (leer, eins,
   zwei, drei Namen), `ruleReferences` (kein `TaktApiError`, `details` leer, gemischte `code`,
   nur `pool_rule`), `errorMessageWithRules` (ohne `details` unverändert; Singular „Betroffen ist";
   Plural „Betroffen sind"; Transport- und unbekannter Fehler). Muster liegt vor:
   `apps/web/test/lib/poolRule.test.ts`.
4. **Danach die Wiedervorlagen** R-1a, R-2a, R-3a wie im Board vorgesehen.
