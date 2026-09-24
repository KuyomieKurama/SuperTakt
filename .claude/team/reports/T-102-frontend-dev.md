Aufgabe: T-102 — Oberfläche und Hülle, Befunde aus Welle D

Status: fertig

Artefakte:

```
apps/web/src/lib/movement.ts            NEU — die Zuordnung Handlung → Anlass an einer
                                        Stelle: movementSentence, doneMovementSentence,
                                        bookingSentence, withMovement. Kein Wortlaut darin.
apps/web/src/api/types.ts               TodoDoneResult (flach: Todo + poolMovement);
                                        StopTimerResult und ResolveOrphanedTimerResult
                                        getrennt, gemeinsamer RecordedStop
apps/web/src/api/endpoints.ts           markTodoDone/clearTodoDone liefern TodoDoneResult,
                                        resolveOrphanedTimer den eigenen Typ; der überholte
                                        Kommentar („für das Setzen und Aufheben von Hand
                                        gibt es sie nicht") ist berichtigt
apps/web/src/app/TimerContext.tsx       W-5: Todo-Name im Titel von Stopp-, Orphan- und
                                        „Nichts gebucht"-Meldung; O-R: zwei Texte je Grund;
                                        undoReactivation liest poolMovement aus markTodoDone
apps/web/src/screens/BoardScreen.tsx    E-060: Bewegungssatz im Toast; W-6: beide Knöpfe
                                        schließen den Dialog vor der Meldung
apps/web/src/screens/TodoListScreen.tsx E-060: Bewegungssatz, pauschale Poolauskunft ersetzt
apps/web/src/screens/TodoDetailScreen.tsx E-060: Bewegungssatz; RefreshHint im Kopf
apps/web/src/screens/TagsScreen.tsx     T-097 Frage 1: Titel, Beschreibung und beide Knöpfe
                                        wechseln nach einer Absage; RefreshHint
apps/web/src/lib/labels.ts              R-1a (4): Theme und PoolMatchMode aus @takt/domain;
                                        W-7: POOL_EXPORT_EXPORTED_NOTE
apps/web/src/lib/poolRule.ts            RuleAxis.note, gesetzt bei exportState 'exported'
apps/web/src/components/RuleSummary.tsx W-7: Hilfssatz als eigene Zeile, showAxisNotes
apps/web/src/screens/PoolFormDialog.tsx showAxisNotes={false} — im Formular steht der Satz
                                        bereits am Optionsknopf
apps/web/src/app/router.ts              H-5: decodeSegment mit try/catch; R-1a (6):
                                        subscribeRevisit, navigate meldet gleiches Ziel
                                        selbst, handleRouteLinkClick
apps/web/src/app/useRoute.ts            zweite Quelle für den Wiederbesuch
apps/web/src/app/Navigation.tsx         Klick auf den eigenen Eintrag über den Router
apps/web/src/screens/parts.tsx          dasselbe für die Export-Reiter; ScreenHeader trägt
                                        `refreshing` (W-12)
apps/web/src/app/useAsync.ts            R-1a (7): zweite Abhängigkeitsliste `refreshDeps`
apps/web/src/app/useDataFreshness.ts    H-6: Mindestabstand 1 s am Fensterwechsel
apps/web/src/app/RefreshContext.tsx     Kommentar auf die neue Liste gezogen
App.tsx, BookingsScreen, DashboardScreen, ExportAuditScreen, ExportScreen, StatusSettings,
TemplatePreview, TemplatesScreen, TimeScreen  version aus deps in refreshDeps (13 Stellen);
                                        RefreshHint auf den übrigen Ansichten
apps/web/src/styles/app.css             .screen__headline > .refresh-hint
apps/web/src/styles/components.css      .rule-summary__note
apps/desktop/scripts/verify-node-checksums.mjs  R-1a (5): MIN_ARCHIVES = 6 und Abgleich
                                        gegen ARCHIVES (fehlend, überzählig, abweichend)
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `tests/**`, `docs/**`, `package.json`,
`tsconfig*.json`. Die Messproben liegen im Kratzverzeichnis, nicht im Bestand.

Zusammenfassung:

Alle acht Punkte des Auftrags sind umgesetzt und gegen die laufende Anwendung gemessen. Der
Bewegungssatz steht jetzt auch nach „Erledigt" und „Wieder offen" an allen drei Flächen
(E-060 Punkt 4); der Vertrag aus T-101 — das Todo flach, `poolMovement` als Feld daneben —
ist gegen die echte Route gemessen und nicht angenommen. Stopp- und Orphan-Meldungen tragen
den Todo-Namen im Titel (W-5), und `POST /timer/orphaned/resolve` bekommt je Grund einen
eigenen Text (O-R), gestützt auf einen eigenen Typ. Dazu die Befunde aus R-1a (doppelte
Aufzählungen, Untergrenze im Prüflauf, Wiederbesuch ohne Engine-Abhängigkeit, Nachladen ohne
Platzhalter), aus R-3a (`decodeURIComponent` mit Netz, Mindestabstand am Fensterwechsel) und
die beiden offenen Fragen aus T-097 (Löschdialog, `RefreshHint` überall). Fünf
End-zu-End-Fälle in fremder Hoheit werden durch die geänderten Wortlaute rot; sie stehen
unten mit Datei und Zeile und sind **nicht** angepasst.

## 1. E-060 Punkt 4 — der Bewegungssatz nach „Erledigt" und „Wieder offen"

`apps/web/src/lib/movement.ts` ist neu und hält genau eine Sache: welche Handlung welchen
Anlass hat. Die Zuordnung stand vorher an zwei Stellen in `TimerContext` und wäre mit E-060
auf fünf gewachsen — fünf Gelegenheiten, `'reopen'` und `'booking'` zu verwechseln, und die
Verwechslung ist still, weil der falsche Anlass einen wohlgeformten falschen Satz liefert.
Kein Wortlaut liegt in der Datei; sie ruft `poolMovementSentence` aus `@takt/domain`.

**Der Satz ersetzt, was geraten war.** Die Toasts trugen bisher pauschale Auskünfte über
Pools und Board („Es verschwindet damit aus dieser Liste, aus seinen Pools und vom Board",
„Sie verschwindet vom Board, bis erledigte Karten eingeblendet werden"). Wo der Dienst jetzt
eine Bewegung meldet, entfällt die geratene Zeile; wo er `null` meldet, bleibt sie stehen.
Für das Board ist das nicht Geschmack, sondern nachrechenbar: Eine Spalte kann durch diese
Handlung nur gewonnen oder verloren werden, wenn ihre Regel eine Erledigt-Achse hat — und
genau dann tritt die Ansichtseinstellung „Erledigte einblenden" zurück
(`usecases/board.ts`, `showsCompleted`), die Karte bleibt also sichtbar. Der pauschale Satz
wäre in genau dem Fall falsch, in dem der Bewegungssatz dasteht.

`undoReactivation` liest die Bewegung aus `markTodoDone` **und zeigt sie** — anders als die
des Stopps zwei Zeilen darüber, die verworfen wird. Der Unterschied steht im Code: Das
Setzen des Kennzeichens ist der letzte Schritt dieser Rücknahme, danach ändert sich nichts
mehr; die Buchung des Stopps wird eine Zeile später gelöscht.

**Gemessen gegen die echte Route** (Probe im Kratzverzeichnis, echter Dienst, Chromium):

```
PUT  /todos/{id}/done -> 200
  Felder: callNumber, completedAt, createdAt, id, poolMovement, statusId, tagIds, title, updatedAt
  poolMovement: {"appears":["…-Erledigt"],"enters":["…-Erledigt"],"leaves":[]}
DELETE /todos/{id}/done -> 200
  Felder: callNumber, completedAt, createdAt, id, poolMovement, statusId, tagIds, title, updatedAt
  poolMovement: {"appears":[],"enters":[],"leaves":["…-Erledigt"]}
```

Das ist die flache Gestalt aus T-101, und `TodoDoneResult extends Todo` bildet sie ab.

## 2. Gemessene Wortlaute

Alle aus der laufenden Anwendung gelesen, je eine offene Meldung im Stapel. Zwei Regeln auf
demselben Tag: `…-Offen` (nur unerledigte) und `…-Erledigt` (nur erledigte), beide `both`.

**Erledigt/Wieder offen (E-060):**

```
Todo-Liste, Erledigt setzen
  Titel: „E2E-T102-Todo-…“ ist erledigt.
  Rumpf: Es verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind. Der
         Status bleibt unverändert. Es steht jetzt in „E2E-T102-Erledigt-…“ und ist aus
         „E2E-T102-Offen-…“ verschwunden.

Detailansicht, Wieder offen
  Titel: „E2E-T102-Todo-…“ ist wieder offen.
  Rumpf: Der Status bleibt unverändert — Erledigt und Status sind zwei getrennte Größen. Es
         ist zurück in „E2E-T102-Offen-…“ und aus „E2E-T102-Erledigt-…“ verschwunden.

Board, Erledigt setzen
  Titel: „E2E-T102-Todo-…“ ist erledigt.
  Rumpf: Tags und Status ändern sich dadurch nicht. Es steht jetzt in „E2E-T102-Erledigt-…“
         und ist aus „E2E-T102-Offen-…“ verschwunden.

Board, Wieder offen
  Titel: „E2E-T102-Todo-…“ ist wieder offen.
  Rumpf: Tags und Status ändern sich dadurch nicht. Es ist zurück in „E2E-T102-Offen-…“ und
         aus „E2E-T102-Erledigt-…“ verschwunden.
```

**Stopp und verwaiste Buchung (W-5, O-R):**

```
POST /timer/stop, recorded            (aus der Ablaufspur des E2E-Laufs)
  Titel: Zeit gebucht auf „E2E-STOPP-BUCHUNG-…“.
  Rumpf: Gebucht: 2 s. An diesem Tag sind für dieses Todo 2 s offen — das ergibt beim Export
         0,25. Es steht jetzt in „E2E-Stopp-NochOffen-…“.

POST /timer/stop, discarded
  Titel: Nichts gebucht.
  Rumpf: Der Timer auf „E2E-STOPP-ZUKURZ-…“ lief weniger als eine Sekunde. Das ist ein
         Doppelklick auf „Start“, keine geleistete Arbeit.

POST /timer/orphaned/resolve, recorded
  Titel: Buchung auf „E2E-STOPP-VERWAIST-…“ abgeschlossen.
  Rumpf: Gebucht bis zum letzten Lebenszeichen: 1 s. Es steht jetzt in
         „E2E-Stopp-Verwaist-…“.

POST /timer/orphaned/resolve, discarded / orphan_discarded
  Antwort: {"kind":"discarded","reason":"orphan_discarded","poolMovement":null}
  Titel: Buchung verworfen.
  Rumpf: Sie haben die unvollständige Buchung auf „E2E-T102-VERWORFEN-…“ verworfen. Es ist
         keine Zeit gebucht worden.

POST /timer/orphaned/resolve, discarded / timer_too_short
  Antwort: {"kind":"discarded","reason":"timer_too_short","poolMovement":null}
  Titel: Nichts zu buchen.
  Rumpf: Zwischen dem Start und dem letzten Lebenszeichen liegt auf „E2E-T102-ZUKURZ-…“
         weniger als eine Sekunde. Die unvollständige Buchung ist damit weg, gebucht wurde
         nichts.
```

**W-7, Hilfssatz am Spaltenkopf** (gemessen an einer Spalte mit `exportState: 'exported'`):

```
„Abgerechnet“ meint den Exportstatus der Buchungen: Auch eine ausgebuchte Buchung, an der
„Nicht abgerechnet“ steht, trägt ihn und zählt hier mit.
```

Er steht an der **Lese**fläche (Spaltenkopf, Regelliste) und nicht im Formular — dort steht
die ausführliche Fassung am Optionsknopf, und zwei Wortlaute für dieselbe Aussage auf einem
Dialog sind der Fehler, den E-059 abgeschafft hat.

## 3. W-6 — der Dialog „Spalten des Boards"

Beide Knöpfe schließen den Dialog, bevor die Meldung kommt. Die Reihenfolge ergibt sich von
selbst: `setPlacement` zeigt den Toast erst, wenn der `PATCH` geantwortet hat. Damit liegt
der Rückweg nicht mehr außerhalb eines `aria-modal="true"` mit Tabulatorschleife, und die
zwei Verhalten zweier Nachbarknöpfe sind eines geworden.

## 4. Befunde aus R-1a

**(4) Doppelte Aufzählungen.** `Theme as ThemeSetting` und `PoolMatchMode` kommen jetzt aus
`@takt/domain`; die beiden lokalen Typzeilen sind weg, der Kopf der Datei sagt „acht in der
Domäne, eine hier" und nennt den Grund für die eine (`DoneFlagState` ist ein Anzeigezustand
ohne Entsprechung im Datenmodell). Die Begründung, deren eigene Bedingung eingetreten war,
ist ersetzt statt gestrichen — sie steht jetzt als Notiz, warum der Import kam.

**(5) Untergrenze im Prüflauf.** `MIN_ARCHIVES = 6`, dazu ein Abgleich der aus dem Quelltext
gelesenen Einträge gegen die ausgeführte `ARCHIVES`-Tabelle in drei Richtungen (fehlend,
überzählig, abweichende Prüfsumme). Beides zusammen ist nötig: Die Zahl fängt die
geschrumpfte Tabelle, der Abgleich den regulären Ausdruck, der nach einer Umformatierung
danebengreift. Eine siebte Plattform bremst nichts.

Gegenprobe, im Kratzverzeichnis an einer Kopie:

```
unverändert                                       Exitcode 0, „6 von 6 Einträgen stimmen überein"
eine Zeile umformatiert (Ausdruck greift nicht)   Exitcode 1, „stehen 5 Archiveinträge, erwartet
                                                  sind mindestens 6"
dazu ein siebter Eintrag (also wieder 6 Treffer)  Exitcode 1, „hat 1 Eintrag/Einträge aus
                                                  ARCHIVES nicht gefunden: node-…-win-x64.zip"
```

**(6) Der Wiederbesuch hängt nicht mehr an `popstate`.** `navigate()` vergleicht das Ziel mit
der angezeigten Adresse und meldet bei Gleichheit selbst — ohne zu navigieren, es gibt ja
nichts zu navigieren. Doppelt gezählt wird nichts, weil dort kein Ereignis entsteht.
`popstate` bleibt als zweite Quelle für die Wege, die nicht durch `navigate` gehen
(`page.goto()`, ein Verweis, „Zurück").

Das allein hätte den Fall aus R-1a aber nicht getroffen: Die Hauptnavigation und die
Export-Reiter sind gewöhnliche `<a href>`, ein Klick darauf geht am Router vorbei. Deshalb
`handleRouteLinkClick` — ein Griff, der **nur** den Klick auf die eigene Adresse übernimmt
und alles andere beim Browser läßt (anderes Ziel, Zusatztaste, andere Maustaste). Die
Verweise bleiben Verweise; Tastatur, Vorlesehilfe und „In neuem Fenster öffnen" ändern sich
nicht.

**(7) `bump()` verwirft den Wert nicht mehr.** `useAsync` hat eine zweite
Abhängigkeitsliste: `deps` heißt „die Frage ändert sich" (Ladezustand, Wert weg),
`refreshDeps` heißt „dieselbe Frage, neue Antwort" (Wert bleibt, `refreshing` wird wahr).
`version` steht an allen 13 Stellen jetzt dort. Der Vergleich der Werte von Hand ist nötig,
weil React im strengen Modus jeden Effekt zweimal anlegt — ohne ihn liefe im
Entwicklungsbetrieb je Aufbau eine zweite Runde Anfragen. Der Kommentar in
`useDataFreshness`, der das Blinken ausschloß, stimmt damit.

## 5. Befunde aus R-3a

**H-5.** `decodeSegment` fängt den `URIError`; Rückfall ist der Rohtext. `#/todos/%` legt die
Oberfläche nicht mehr lahm, sondern führt auf eine Kennung, die der Dienst mit `not_found`
beantwortet — ein Zustand, den jede Ansicht kennt.

**H-6.** Mindestabstand von **einer Sekunde** am `visibilitychange`, gemessen gegen jede
Auffrischung dieses Hakens. Begründung im Code: Wer in derselben Sekunde zweimal ins Fenster
kommt, hat dazwischen nichts gebucht — weder im Aufgabenbereich noch in einem zweiten
Fenster. Länger wäre falsch, weil der Fall, um den es geht (Rückkehr aus Outlook nach einer
Buchung), nach zwei Sekunden eintritt. Das erneute Ansteuern (`revisit`) wird **nicht**
gebremst: Das ist die ausdrückliche Bitte „zeig mir das noch einmal".

## 6. T-097, Fragen 1 und 3

**Frage 1.** Der Lösch-Dialog für Ordner und Tag wechselt nach einer Absage Titel
(„Der Ordner wurde nicht gelöscht" / „Das Tag wurde nicht gelöscht"), Beschreibung („… gibt
es weiterhin. Der Dienst hat das Löschen abgelehnt und dabei nichts verändert.") und beide
Knöpfe („Erneut versuchen" / „Schließen") — wie `StatusSettings`. „Erneut versuchen" setzt
die alte Meldung zurück, sonst zeigte ein zweiter Fehlschlag nicht, daß etwas geschehen ist.
Für Vorlesehilfen ist der Knopfwechsel der einzige Weg, von der Absage zu erfahren (SC
4.1.3): Der Hinweistext liegt in `aria-describedby` und ist keine Statusmeldung.

Gemessen im End-zu-End-Lauf:

```
Das Tag wurde nicht gelöscht
„E2E-TagSperre-UI-…“ gibt es weiterhin. Der Dienst hat das Löschen abgelehnt und dabei nichts
verändert.
Dieses Tag wird in der Regel eines Pools verwendet. Betroffen ist Regel
„E2E-TagSperre-UI-Regel-…“.
[Schließen] [Erneut versuchen]
```

**Frage 3 (W-12).** Kein neuer Kanal für Bildschirmleser, sondern der sichtbare Zustand
überall: `ScreenHeader` trägt `refreshing` und zeichnet den vorhandenen `RefreshHint`. Alle
elf Ansichten haben ihn jetzt — die vier mit eigener Leiste behalten ihre, die übrigen sieben
bekommen ihn im Kopf. Keine Live-Region: Abschnitt 15 verlangt eine sichtbare Rückmeldung.
Erst mit Punkt (7) oben ist der Hinweis überhaupt wahr — vorher verschwand die Ansicht beim
Nachladen, statt stehenzubleiben.

Messungen:

```
pnpm run typecheck                Exitcode 0 (8 Projekte + 6 Testkonfigurationen)
pnpm run test                     Exitcode 0 — 684 Tests in 45 Dateien
pnpm run contrast                 Exitcode 0 — 0 von 432 Paaren durchgefallen
pnpm --filter @takt/web build     Exitcode 0
node apps/desktop/scripts/verify-node-checksums.mjs   Exitcode 0 — 6 von 6, gegen nodejs.org
pnpm run test:e2e                 Exitcode 1 — 40 bestanden, 5 rot (alle fünf durch geänderte
                                  Wortlaute, siehe „Risiken"; Port 17843 war frei)
```

Annahmen:

1. **Der Bewegungssatz verdrängt die geratene Auskunft, er tritt nicht daneben.** Wo der
   Dienst eine Bewegung meldet, entfällt „Sie verschwindet vom Board, bis erledigte Karten
   eingeblendet werden" bzw. „aus seinen Pools und vom Board". Andernfalls stünden zwei
   Sätze übereinander, die sich widersprechen können — der zweite pauschal, der erste
   gerechnet. Was von der Ansichtseinstellung abhängt und nicht von einer Regel („Es
   verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind"), bleibt.
2. **Zwei Wortlaute statt einem für W-7.** Die ausführliche Fassung am Optionsknopf bleibt
   unverändert; an der Lesefläche steht ein kürzerer Satz. Begründung: verschiedene Fragen
   („was wähle ich" gegen „warum steht das hier") und verschiedener Platz. Beide sagen
   dasselbe, keiner ist eine Abschrift des anderen.
3. **`handleRouteLinkClick` an zwei Stellen** (Hauptnavigation, Export-Reiter), nicht an
   jedem Verweis der Anwendung. Der Befund betrifft den Klick auf den Eintrag, auf dem man
   schon steht, und das sind diese beiden Leisten.
4. **Der Mindestabstand ist eine Sekunde** und gilt nur am Fensterwechsel. Zahl und Ort sind
   im Code begründet.
5. **`markTodoDone` in `undoReactivation` zeigt seine Bewegung**, obwohl derselbe Ablauf die
   Bewegung des Stopps verwirft. Grund im Code: Es ist der letzte Schritt, der Satz
   beschreibt den Zustand, in dem der Benutzer die Meldung liest.
6. **`TodoDoneResult` erweitert `Todo`**, statt ein Umschlag zu sein — gegen die Route
   gemessen, siehe Abschnitt 1.

Risiken:

1. **Fünf End-zu-End-Fälle in fremder Hoheit sind rot, ausschließlich durch geänderte
   Wortlaute. Nicht angepaßt (`tests/e2e/**` gehört dem e2e-tester):**

   ```
   tests/e2e/timer-stop-announcement.spec.ts:103-104   filtert auf „Zeit gebucht." und
       erwartet den Titel; er lautet jetzt „Zeit gebucht auf „X“." (W-5)
   tests/e2e/timer-stop-announcement.spec.ts:173-176   Titel „Nichts gebucht." trifft weiter,
       der Rumpf nennt jetzt das Todo („Der Timer auf „X“ lief weniger als eine Sekunde. …")
   tests/e2e/timer-stop-announcement.spec.ts:256       erwartet „Buchung abgeschlossen.";
       jetzt „Buchung auf „X“ abgeschlossen."
   tests/e2e/tag-folder-rule-lock.spec.ts:152          klickt nach der Absage „Abbrechen";
       der Knopf heißt dort jetzt „Schließen" (T-097 Frage 1)
   tests/e2e/tag-folder-rule-lock.spec.ts:213          dasselbe im Tag-Fall
   ```

   Der Dialog-Selektor selbst hält: T-099 hat ihn auf die **Rolle** ohne Namen umgestellt,
   der Titelwechsel bricht ihn also nicht. Nur die Knopfbeschriftung ist offen.
   `pool-movement-sentence.spec.ts` bleibt grün — es mißt den Start-Toast, und der ist
   unverändert.

2. **Der Satz nach „Erledigt" ist noch von keinem Test gedeckt.** T-103 bereitet die Fälle
   vor; bis dahin steht die Auskunft nur in diesem Bericht.

3. **`useAsync` mit zwei Listen ist eine Änderung an 13 Aufrufstellen ohne Typprüfung** —
   Abhängigkeitslisten prüft niemand. Falsch einsortiert hieße: Ein echter Wechsel (Filter,
   Kennung) behielte den alten Wert stehen. Ich habe jede Stelle einzeln umgestellt und den
   Zeileninhalt vor der Änderung verglichen; geprüft ist es damit nicht, gemessen ist der
   Bestand über `pnpm run test:e2e` (40 bestanden, darunter Filter- und Blätterfälle).

4. **Der Klickgriff an den Verweisen** ist ein Eingriff in Browserverhalten. Er greift nur
   bei einfachem Linksklick ohne Zusatztaste und nur auf die eigene Adresse; alles andere
   fällt durch. Gemessen unter Chromium, nicht unter WebKitGTK — aber genau dafür ist er
   gebaut: Er braucht kein Ereignis des Browsers.

5. **Sicherheit: keine neue Fläche.** Keine neue Route, kein neues Feld nach außen. Der
   Bewegungssatz nennt Pool- und Spaltennamen, die derselbe Benutzer auf demselben Bildschirm
   sieht; `poolMovement` an den Erledigt-Routen ist dieselbe Auskunft, die die Timer-Routen
   seit T-089/T-093 geben. `decodeSegment` macht die Adreßauswertung robuster, nicht
   nachgiebiger — was nicht zu entschlüsseln ist, geht roh an den Dienst und wird dort
   abgewiesen. Keine Kundendaten, keine Call-Nummern, keine Zugangsdaten.

Offene Fragen: an den Orchestrator

1. **„Zeit gebucht." von Hand.** `BookingDialogs.tsx:107` meldet nach einer von Hand
   angelegten Buchung „Zeit gebucht." mit dem Todo im Rumpf, während der Stopp jetzt „Zeit
   gebucht auf „X“." im Titel führt. Beide nennen das Todo, aber verschieden. Angleichen?
   Die Handlung liefert kein `poolMovement` (`POST /time-entries`), obwohl auch sie die erste
   Buchung sein kann — dieselbe Lücke, die E-058 Punkt 6 für den Stopp geschlossen hat.
2. **Der Anlaß `'booking'` beim Setzen von „Erledigt"** liest sich im Aufrufcode weiter
   seltsam (E-060 Punkt 3 hat ihn ausdrücklich stehen lassen). Die Zuordnung steht jetzt als
   Tabelle in `lib/movement.ts`; falls sie später umbenannt wird, ist das die einzige Stelle
   in `apps/web`.
3. **W-13, Restvorkommen „Regel über Tags":** `Kanban.tsx:144` und
   `apps/web/design/DESIGNSYSTEM.md:623` gehören mir, standen aber nicht im Auftrag. Soll ich
   sie in einer Nachzieh-Aufgabe mitnehmen?

Nächster Schritt:

1. **e2e-tester (T-103 oder Nachzieher):** die fünf Zeilen oben nachziehen — vier Wortlaute
   und ein Knopfname. Die gemessenen Wortlaute stehen in Abschnitt 2 dieses Berichts und sind
   direkt als Erwartung verwendbar; für den Bewegungssatz gilt weiter, ihn aus
   `poolMovementSentence` zu ziehen statt ihn zu tippen.
2. **unit-tester:** `apps/web/src/lib/movement.ts` ist rein und ungeprüft — vier Fälle je
   Funktion (Bewegung/`null`, `'reopen'`/`'booking'`), dazu `withMovement`. Muster liegt in
   `apps/web/test/lib/errorText.test.ts` vor. Ebenso `useAsync` mit zwei Listen, falls ein
   Rahmen für Haken eingerichtet wird.
3. **Reviewer-Wiedervorlage** für W-5 bis W-7 und die beiden T-097-Fragen; der
   spec-ux-reviewer hat den Wortlaut des W-7-Satzes noch nicht gesehen.
