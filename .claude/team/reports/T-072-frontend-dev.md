Aufgabe: T-072 — Die Board-Ansicht auf Regelspalten umstellen (E-054, letzter Teil)

Status: fertig

Artefakte:

Geändert:

```
apps/web/src/api/types.ts             `PoolPlacement` (aus `lib/labels` bezogen, eine Quelle),
                                      `Pool.placement`, `Pool.position`, `PoolWrite.placement`,
                                      `PoolPatch` (Teiländerung), `PoolSurfaceQuery`,
                                      `BoardColumnView`, `BoardAppearance`, `BoardView`;
                                      `Todo.statusId` mit dem Vermerk, dass der Status seit
                                      E-054 keine Spalte mehr ist
apps/web/src/api/endpoints.ts         `getBoard()` (GET /board), `listPools(surface)` mit
                                      `?placement`, `updatePool` nimmt `PoolPatch`
apps/web/src/app/StructureContext.tsx `rules` (alle Regeln, `?placement=all`) neben `pools`
                                      (nur Pool-Fläche), `ruleName(id)`; „Unbekannte Spalte"
                                      → „Unbekannter Status"
apps/web/src/components/Kanban.tsx    Ziehen entfernt (`draggable`, `DataTransfer`, Griff,
                                      Strg+Pfeil); `KanbanAppearance`, `statusName`,
                                      `highlighted`/`onHighlight`; Spalte trägt `rule`,
                                      `total`, `addLabel` (298 → 345 Zeilen)
apps/web/src/screens/BoardScreen.tsx  vollständig neu gegen `GET /board`: Regelspalten,
                                      Mehrfachnennung, Leerzustand, Spaltenverwaltung
                                      (529 → 820 Zeilen)
apps/web/src/screens/TagsScreen.tsx   S-11 zeigt **alle** Regeln mit Anzeigeort-Etikett und
                                      einem Griff „Auf das Board"/„Vom Board nehmen"; das
                                      eigene Regelformular ist dem gemeinsamen gewichen
                                      (799 → 696 Zeilen)
apps/web/src/screens/TodoListScreen.tsx  Statuswechsel unmittelbar im Zeilenmenü; Filter
                                      heißt „Status"; die Regel eines `?pool=`-Filters wird
                                      über `ruleName` benannt, auch wenn sie nur auf dem
                                      Board steht
apps/web/src/screens/TodoDetailScreen.tsx  „Statusspalte" → „Status", ohne Verweis aufs
                                      Board, mit Knopf „Ändern"
apps/web/src/screens/TodoFormDialog.tsx  `presetTagIds`; Feldbeschriftung „Status"
apps/web/src/components/FormDialog.tsx   zwei Befunde behoben, siehe Abschnitt 6
apps/web/src/lib/labels.ts            `POOL_PLACEMENT_LABEL`, `POOL_PLACEMENT_SHORT`
apps/web/src/components/Timer.tsx,
apps/web/src/app/TimerContext.tsx     nur Erläuterungen an E-054 angeglichen; `CARD_STAYS`
                                      **unangetastet** (zeichengleich mit dem Add-in)
apps/web/src/app/Navigation.tsx       Kurzhinweis des Reiters
apps/web/src/showcase/BoardSection.tsx,
apps/web/src/showcase/data.ts         Musterseite auf Regelspalten, mit Umschalter auf den
                                      Leerzustand
apps/web/src/styles/{app,components,showcase}.css  Ziehen-Stile entfernt; Regelzeile,
                                      Mehrfach-Etikett, Statuszeile, Leerzustand, Regelliste
apps/web/scripts/contrast-check.mjs   neun Paare für die neuen Flächen (376 → 394)
```

Neu:

```
apps/web/src/screens/PoolFormDialog.tsx  ein Formular für Pool **und** Spalte, mit
                                      Anzeigeort als eigenem Feld (236 Zeilen)
apps/web/src/lib/folderPaths.ts       `flatFolders`, vorher zweimal in `TagsScreen`
.claude/team/reports/T-072-frontend-dev.md  dieser Bericht
```

Nicht im Baum, sondern im Wegwerfordner der Sitzung (`…/scratchpad/`): `boot.mjs` (startet
denselben Dienst und dieselbe Oberfläche wie `tests/e2e/support/services.ts`, aber mit eigenem
Datenverzeichnis), `seed.mjs` (echte Daten über dieselben Routen wie die Oberfläche) und sechs
Bedienskripte samt 20 Bildschirmaufnahmen. Ausdrücklich **außerhalb** des Projekts, weil
`tests/e2e/**` und `apps/web/test/**` nicht meine Hoheit sind.

Nicht angefasst: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`,
`docs/**`. `apps/desktop/src/**` enthält kein Wort zum Board (nachgesehen). Kein `git commit` —
die Änderungen liegen im Arbeitsbaum auf `kanban-regelspalten`.

---

Zusammenfassung:

`pnpm typecheck`, `pnpm contrast` (**394 Paare, 0 durchgefallen**) und `pnpm build` sind grün.
Im Browser nachgesehen, hell und dunkel, gegen den echten Dienst mit echten Daten: eine Karte in
zwei Spalten (und später in drei), eine Spalte ohne Treffer, das leere Board, das Anlegen und
Wegnehmen einer Spalte, der Statuswechsel aus der Liste — kein `pageerror`, keine Konsolenmeldung
außer einer, die der **Dienst** verursacht (Abschnitt 7, offene Frage 1).

Die drei schweren Punkte sind wie folgt gelöst:

**Mehrfachnennung sichtbar statt versteckt.** Jedes Vorkommen einer mehrfach stehenden Karte trägt
ein Etikett, das die **anderen Spalten beim Namen nennt** („Steht auch in „Support"", bei dreien
„Steht auch in 2 Spalten: „A", „B""). Das Etikett ist ein Knopf mit `aria-pressed`: Ein Druck
umrandet **alle** Vorkommen und sagt sie an, ein zweiter nimmt es zurück. Gemessen: zwei Karten
mit `.kcard--linked`, beide Etiketten `aria-pressed="true"`, Ansage „steht in 2 Spalten: Kunden
Nord, Support".

**Der Leerzustand ist ein eigener Bildschirm.** Er sagt, was geschehen ist (vier Punkte: die Todos
sind vollzählig da; der Status bleibt; es gab keine ehrliche Übersetzung; nichts wird mehr
gezogen), und bietet zwei Wege an: eine Spalte einrichten oder eine **vorhandene** Pool-Regel als
Spalte aufnehmen. Der zweite Weg ist der wichtigere: Wer schon Pools hat, ist mit einem Klick auf
einem gefüllten Board.

**Der Weg zum Status ist mehrfach ausgeschildert.** Der Status steht sichtbar auf jeder Karte
(er käme auf dem Board sonst nirgends mehr vor), das Kartenmenü führt mit zwei getrennten
Einträgen dorthin — „Tags ändern — sie entscheiden die Spalte" und „Status ändern" —, und in der
Liste setzt ihn ein Zeilenmenü **ohne Dialog** („Status: Backlog"), mit dem laufenden Status als
gesperrtem Eintrag samt Grund.

---

## 1 — Was aus der Ansicht verschwunden ist, und was an seine Stelle tritt

Ersatzlos gestrichen, weil E-054 A-5.2 und I-14 aufhebt:

```
BoardScreen:  DRAG_MIME, dragging, dropColumn, move(), moveByOffset(),
              updateTodo({ statusId }) aus dem Ziehen, StatusColumnsDialog
              (createTodoStatus/updateTodoStatus/deleteTodoStatus/reorderTodoStatuses)
Kanban.tsx:   draggable, onDragStart/onDragEnd, kcard__grip, onMoveByKeyboard,
              Strg+Pfeil links/rechts, KanbanColumn.dropTarget/onDragOver/onDragLeave/onDrop
CSS:          .kcard--dragging, .kcard__grip, .kcolumn--drop, cursor: grab/grabbing
```

Die Tastaturalternative nach SC 2.5.7 fällt **mit** der Ziehgeste weg, nicht vor ihr: Was es nicht
gibt, braucht keinen zweiten Weg. Was bleibt, ist A-5.6 — der Timer startet weiterhin von der
Karte aus, gemessen in der Bedienprüfung.

`.kboard` gab es bis hierher als zweite Fassung derselben Fläche für die Musterseite, mit anderer
Spaltenbreite. Sie ist weg; Ansicht und Musterseite benutzen `.board`, und `.board` hat jetzt
gleich breite, gedeckelte Spalten (`minmax(17rem, 21rem)`). Vorher richtete sich jede Spalte nach
ihrem Inhalt — bei einer Karte, die in zwei Spalten steht, sah sie dadurch zweimal verschieden
aus.

Die **Statusspalten-Verwaltung** ist aus dem Board verschwunden, weil sie dort nichts mehr
verwaltet. `POST/PATCH/DELETE /todo-statuses` und `PUT /todo-statuses/order` hat damit **kein
Bedienelement mehr in der ganzen Oberfläche** — siehe offene Frage 3; das ist bewusst gemeldet und
nicht nebenbei nachgebaut.

## 2 — Eine Karte in mehreren Spalten

`GET /board` liefert `appearances` — nur Karten in mehr als einer Spalte, `columnIds` in
Spaltenreihenfolge. Die Ansicht rechnet daran **nichts** nach: Sie schlägt die Kennung nach,
zieht die eigene Spalte ab und schreibt die Namen der übrigen hin.

Das ist auch der Grund, warum diese Ansicht **nicht je Spalte weiterblättert**, obwohl
`nextCursor` bereitliegt. `appearances` berechnet der Dienst an der Regel über alle Mitglieder;
nachgeladene Karten kämen ohne diese Auskunft an, und eine Karte, die dann unerklärt zweimal
dasteht, sieht aus wie ein Fehler. Stattdessen erhöht „Mehr Karten je Spalte laden" die Zahl **je
Spalte** und lädt das Board neu — ein Aufruf mehr, aber die Auskunft bleibt für jede Karte
vollständig. Der Knopf sagt das mit („Das Board wird dabei neu berechnet — nur so bleibt die
Auskunft ‚steht auch in …' für jede Karte vollständig") und erscheint nur, wenn eine Spalte
tatsächlich mehr Mitglieder hat als geladen sind.

Die Hervorhebung ist ein **Ring** (`box-shadow: inset 0 0 0 2px`), keine getönte Fläche: Auf einer
eingefärbten Karte hätten Exportmarker, Etiketten und Zeitangabe andere Untergründe als die
gemessenen. So behält jede Karte ihre geprüften Kontraste, und die Verbindung hängt an zwei
Merkmalen (Ring **und** gedrücktes Etikett), nicht an der Farbe allein.

## 3 — Der Leerzustand, und die Spalte ohne Treffer

Zwei verschiedene Zustände, zwei verschiedene Texte — der Unterschied, den `loadBoard` im Dienst
ausdrücklich vorsieht:

- **`columns` leer** — „Das Board hat noch keine Spalte", mit der Erklärung der Umstellung und
  zwei Wegen (neu anlegen, vorhandene Regel aufnehmen). Gibt es noch gar keine Regel, steht dort
  stattdessen ein Hinweis, womit man anfängt.
- **Spalte ohne Mitglieder** — „Keine Karte trifft diese Regel", mit „Regel bearbeiten". Ist die
  Regel leer, sagt der Text zusätzlich den Satz, der sonst niemandem einfällt: „Eine leere Regel
  trifft nichts — nicht alles."

## 4 — Die Einrichtung (S-11 und die Spaltenverwaltung)

Ein Formular für beide Flächen (`PoolFormDialog`), weil eine Spalte dieselbe Entität ist wie ein
Pool. Der **Anzeigeort** ist ein eigenes Auswahlfeld mit drei Werten und einem erklärenden Satz je
Wert — nicht eine stille Voreinstellung: Wer eine Spalte für das Board anlegt, will sie oft nicht
zusätzlich in seinen Pools sehen, und umgekehrt. Beim Anlegen vom Board aus steht „Nur auf dem
Board" vor, von S-11 aus „Nur in den Pools".

Drei Griffe, die aus derselben `PATCH /pools/{id}`-Teiländerung entstehen:

```
Board → „Vom Board nehmen"      placement: 'pool'   Bestätigungsdialog: „Die Regel bleibt als
                                                    Pool erhalten … Gelöscht wird nichts."
Board → „Als Spalte aufnehmen"  placement: 'both'
S-11  → „Auf das Board"         placement: 'both'   „Nur auf dem Board" bleibt dem Dialog
                                                    vorbehalten: Wer eine Regel aus seinen
                                                    Pools nimmt, soll dabei lesen, was das heißt.
```

Ein vierter Zustand „nirgends" ist nicht erreichbar: „Vom Board nehmen" setzt `pool`, nicht
etwas Leeres.

**Geschnitten (bewusst, nach Ihrer Erlaubnis zu schneiden):** die Reihenfolge der Spalten.
`pool.position` trägt einen `UNIQUE`-Index (`ux_pool_position`, Migration 0001); ein Tausch
zweier Positionen braucht deshalb einen dritten Schritt über einen freien Wert und kann in der
Mitte scheitern. Das gehört nicht in einen Nachmittag am Rand dieser Aufgabe. Der Dialog sagt es
ausdrücklich statt es zu verschweigen: „Die Spalten stehen in der Reihenfolge ihrer Position, die
sie mit der Pool-Liste teilen. Sie lässt sich hier noch nicht ändern."

Das Pluszeichen einer Spalte legt ein Todo mit den **ausdrücklich genannten** Tags der Regel an.
Ordnerterme lässt die Ansicht aus — welche Tags in einem Ordner samt Unterordnern liegen, löst der
Dienst auf (`resolveRule`), und eine zweite Fassung dieser Rechnung in der Oberfläche wäre genau
die Doppelung, die dieses Projekt an anderer Stelle rot werden lässt. Besteht eine Regel nur aus
Ordnern, fehlt das Pluszeichen deshalb — und im Spaltenmenü steht der Eintrag trotzdem, gesperrt,
mit dem Grund daneben. Eine Spalte, die als einzige kein Pluszeichen trägt, wirkt sonst kaputt.

## 5 — Wo der Status jetzt geändert wird

| Ort | Weg | Rückmeldung |
|---|---|---|
| Liste (S-02) | Zeilenmenü „Status: …", ohne Dialog | Meldung „Status geändert: Backlog." mit „Tags und Kanban-Spalten bleiben unberührt." |
| Liste, Detail | Bearbeiten-Dialog, Feld „Status" | „Todo geändert." |
| Detail (S-03) | Karte „Herkunft": Status mit Knopf „Ändern" | öffnet denselben Dialog |
| Board (S-04) | **kein** Wechsel; der Status steht auf der Karte, das Menü führt zum Dialog | — |

Der Verweis „Statusspalte → Board" in der Detailansicht ist weg: Er zeigte auf eine Ansicht, in
der es diesen Wert nicht mehr gibt. Die Wörter sind mitgezogen — „Statusspalte" heißt überall
„Status", der Filter der Liste ebenso („Jeder Status" statt „Alle Spalten").

Ein Fund am Rande, der ohne diese Umstellung ein stiller Fehler geworden wäre: Die Liste zeichnete
den Filter `?pool=` nur dann als Chip, wenn die Regel in `structure.pools` stand. Für eine Regel
mit Anzeigeort „Board" — genau der Sprung „Alle Todos dieser Regel in der Liste" aus dem
Spaltenmenü — hätte der Filter **gewirkt, ohne angezeigt zu werden**. Deshalb führt
`StructureContext` jetzt `rules` (alle Regeln) neben `pools` (nur die Pool-Fläche), und der Chip
nennt die Regel beim Namen. Zwei Abrufe statt eines mit Filter: Welche Regel auf welcher Fläche
steht, entscheidet der Dienst (`WHERE placement IN (?, 'both')`), nicht eine zweite Fassung
desselben Prädikats in der Oberfläche.

## 6 — Zwei Befunde am gemeinsamen Dialog, beide behoben

Beide sind mir im echten Browser begegnet, nicht beim Lesen:

1. **Escape schloss den Dialog nicht mehr, sobald ein Knopf darin verschwand.** Im Dialog „Spalten
   des Boards" nimmt „Als Spalte aufnehmen" eine Regel auf — und verschwindet dabei, weil die
   Regel danach oben unter den Spalten steht. Der Fokus fiel auf `body`, also außerhalb der
   Fläche, an der `onKeyDown` hängt: Escape wirkte nicht mehr, die Tabulatorschleife auch nicht,
   der Dialog war nur noch mit der Maus zu verlassen (SC 2.1.1, SC 2.4.3). `FormDialog` holt den
   Fokus jetzt zurück, wenn er ins Nichts fällt (`relatedTarget === null`), und lässt ihn in Ruhe,
   wenn nur das Fenster den Fokus verloren hat (`document.hasFocus()`).
2. **Die Fehlermeldung stand unter dem Sichtfeld.** Der Rumpf eines Formulardialogs scrollt; die
   Meldung steht unter den Feldern. Beim abgewiesenen doppelten Namen lag der Text zwei
   Bildschirmhöhen tiefer, während der Blick auf dem Absendeknopf stand und dort nichts geschah.
   Die Meldung wird jetzt in den sichtbaren Bereich gerollt, sobald sie erscheint.

Beides gilt für **jeden** Formulardialog der Anwendung, nicht nur für die neuen.

## 7 — Was ich im Browser gesehen habe

Aufbau: echter Dienst aus dem Quelltext (eigenes `XDG_DATA_HOME`), echter Vite-Server, echte
Routen — kein gestubbtes `fetch`. Bestand: fünf Tags, ein Ordnerbaum „Kunden / Nord", vier Todos
(eines erledigt), drei Zeitbuchungen, eine Pool-Regel „Interne Arbeit".

| Was | Hell | Dunkel | Beobachtung |
|---|---|---|---|
| Leeres Board | ✓ | ✓ | Erklärung, zwei Knöpfe, die vorhandene Pool-Regel mit „Als Spalte aufnehmen" |
| Board mit 4–6 Spalten | ✓ | ✓ | gleich breite Spalten, waagerechter Bildlauf ab der fünften |
| Karte in zwei Spalten | ✓ | ✓ | beide Vorkommen mit Etikett; Druck → beide umrandet, Ansage nennt beide Spalten |
| Karte in drei Spalten | ✓ | ✓ | „Steht auch in 2 Spalten: „Wartet auf Rückmeldung", „Priorität hoch"" |
| Spalte ohne Treffer | ✓ | ✓ | „Keine Karte trifft diese Regel" mit „Regel bearbeiten" |
| Erledigte einblenden | ✓ | ✓ | erledigte Karte erscheint in ihrer Regelspalte, Kopf zählt „1 erledigt" |
| Spalte anlegen | ✓ | — | Absenden gesperrt ohne Regel, mit Begründung am Feld |
| Doppelter Name | ✓ | — | Dialog bleibt offen, Meldung sichtbar (Text des Dienstes, offene Frage 1) |
| Vom Board nehmen | ✓ | — | Bestätigung nennt die Folge, danach fünf statt sechs Spalten, Meldung |
| Statuswechsel aus der Liste | — | ✓ | laufender Status gesperrt („Aktueller Status"), Meldung nennt die Wirkung |
| S-11 mit Anzeigeort | ✓ | ✓ | drei Etiketten: „Pool", „Board-Spalte", „Pool und Board" |
| Musterseite (Board + Leerzustand) | ✓ | — | ohne Konsolenfehler |

Tastatur: 34 Tabulatorschritte über das ganze Board abgelaufen — jeder Halt hat einen sichtbaren
Fokusring (2px), jedes Bedienelement ist erreichbar, jedes hat einen sprechenden Namen („Timer für
„…" starten", „Spalte Kunden Nord verwalten", „Todo in „Support" anlegen — mit den Tags dieser
Regel"). Die Eingabetaste auf dem Mehrfach-Etikett hebt beide Vorkommen hervor. Die Modalität ist
gemessen, nicht angenommen: `elementFromPoint` trifft bei offenem Dialog an jeder Stelle die
Abdunklung.

## 8 — Was gemessen grün ist

```
pnpm typecheck   alle acht Projekte, keine Meldung          ✓
pnpm contrast    394 Paare, 0 durchgefallen (vorher 376)    ✓
pnpm build       alle Projekte, apps/web in 1,87 s          ✓
pnpm --filter @takt/web build:designsystem                  ✓
```

Die neun neuen Kontrastpaare (Gruppe „Board (E-054)") decken die neuen Flächen ab: Regelzeile im
Spaltenkopf, Ordner darin, Mehrfach-Etikett in beiden Zuständen (auch mit vertauschten Farben),
Status auf der Karte, Ring um ein hervorgehobenes Vorkommen gegen Karte **und** gegen Spalte.
Kein `any`, keine `@ts-ignore`; alle Texte deutsch, alle Bezeichner englisch.

---

Risiken:

1. **Der Leerzustand erklärt eine Umstellung, die der Benutzer nie gesehen hat.** Wer Takt neu
   installiert, liest „Seit der Umstellung …" und „Ihre Todos sind vollzählig da" über einen
   Bestand, den es nie anders gab. Das ist der billigere Fehler: Ein neuer Benutzer liest einen
   Satz zu viel, ein bestehender bekommt die Erklärung, die er braucht. Wer das trennen will,
   braucht ein Merkmal „hat schon einmal Todos gehabt" — das gibt es nicht, und ich habe keines
   erfunden.
2. **„Mehr Karten je Spalte laden" lädt das ganze Board neu.** Bei zwölf Spalten mit je 200
   Karten sind das zwölf Mitgliederabfragen. Begründet in Abschnitt 2; wenn es je stört, ist der
   richtige Weg eine Auskunft des Dienstes zur Mehrfachnennung **je Seite**, nicht ein Nachladen
   ohne diese Auskunft.
3. **`appearances` und die Spaltenmitgliedschaft sind zwei Fassungen derselben Regel** (SQL und
   `matchesPool`). Der Dienst misst ihre Übereinstimmung in `proof:openapi`; die Oberfläche
   verlässt sich darauf. Laufen sie auseinander, zeigt das Board eine Karte in einer Spalte und
   behauptet daneben, sie stünde dort nicht.
4. Der Anzeigeort „Nur auf dem Board" nimmt eine Regel aus den Pool-Filtern. Wer eine bestehende
   Pool-Regel dorthin stellt, verliert sie in der Filterauswahl von S-02 — gewollt, aber ein
   Nutzer, der es versehentlich tut, sucht sie dort. S-11 zeigt jede Regel mit ihrem Anzeigeort;
   das ist der Ort, an dem er sie wiederfindet.

---

Offene Fragen:

1. **`POST /pools` mit einem vorhandenen Namen antwortet mit 500** —
   `{"error":{"code":"internal_error","message":"Ein unerwarteter Fehler ist aufgetreten."}}`,
   nachgemessen gegen den laufenden Dienst. Der eindeutige Index auf `pool.name` schlägt als
   Ausnahme durch, statt als Konflikt beantwortet zu werden. Die Oberfläche verhält sich richtig
   (Dialog bleibt offen, Text des Dienstes wird unverändert gezeigt) — aber „Ein unerwarteter
   Fehler" sagt dem Benutzer nicht, dass er nur einen anderen Namen braucht. **Für den api-dev:**
   409/422 mit einer Meldung, die den Namen nennt. Ich habe die Meldung in der Oberfläche
   ausdrücklich **nicht** ersetzt; das hieße, aus einem Code zu raten.
2. **`tests/e2e/kanban.spec.ts` prüft Drag & Drop und die Statusspalten-Verwaltung — beides gibt
   es nicht mehr.** `dragCardIntoColumn` löst Ereignisse aus, die keine Ansicht mehr abonniert;
   `StatusColumnsDialog` existiert nicht mehr (auch der dort vermerkte Befund „Umbenennen fehlt"
   ist damit gegenstandslos). **Für den e2e-tester:** Der Fall gehört ersetzt durch: Spalte über
   `POST /pools` mit `placement: 'board'` einrichten, Karte über ihre Tags in zwei Spalten
   bringen, Mehrfach-Etikett und Hervorhebung prüfen, Timer von der Karte starten (A-5.6),
   Leerzustand ohne Spalte. Ich habe die Datei nicht angefasst.
3. **`PUT /todo-statuses/order`, `POST/PATCH/DELETE /todo-statuses` haben in der ganzen
   Oberfläche kein Bedienelement mehr.** Sie hingen am Board-Dialog, der mit E-054 entfallen ist.
   Der Status ist weiterhin sichtbar und änderbar, seine **Struktur** aber nicht mehr: Man kann
   keinen Statuswert mehr anlegen, umbenennen, umsortieren oder löschen. A-5.4 („Die
   Statusstruktur ist konfigurierbar") ist damit unbedient. Mein Vorschlag: ein Abschnitt
   „Status" in S-09 (Einstellungen) — dort steht schon die Verwaltung der Standard-Tags, und der
   Status ist seit E-054 eine Stammgröße und keine Ansicht. Ich habe das nicht nebenbei gebaut,
   weil es eine eigene Ansicht ist und den Schnitt dieser Aufgabe gesprengt hätte.
4. **`CARD_STAYS` stimmt nach E-054 nicht mehr ganz.** Der Satz „Die Karte bleibt, wo sie ist —
   die Spalte ändert sich dadurch nicht" steht zeichengleich in `apps/web/src/lib/labels.ts` und
   in `apps/outlook-addin/src/duplicate/reopen.ts` (von `proof:addin` geprüft). Die Aussage ist
   halb richtig: Die Spalte ändert sich tatsächlich nicht, weil die Tags sich nicht ändern — aber
   die Karte **erscheint wieder auf dem Board**, weil erledigte Karten ausgeblendet sind. Genauer
   wäre: „Die Tags bleiben, also bleiben auch die Spalten — die Karte erscheint dort wieder."
   Ändern kann ich das nicht allein: Die zweite Fassung liegt im Add-in, das nicht meine Hoheit
   ist. **Für den integration-dev und mich gemeinsam**, in einem Zug.
5. Die Reihenfolge der Spalten (Abschnitt 4) braucht einen Weg über den `UNIQUE`-Index auf
   `pool.position` — am ehesten eine Route, die eine vollständige Reihenfolge annimmt, wie es
   `PUT /todo-statuses/order` für den Status tut. **Für den api-dev**, falls der Auftraggeber die
   Reihenfolge braucht.
6. Die Ansicht ruft `GET /board` ohne Fortsetzungsmarke und `GET /pools/{id}/todos` gar nicht
   mehr. `listPoolTodos` bleibt in `endpoints.ts`, weil `StructureContext.poolsContaining` es
   benutzt — das ist kein toter Eintrag, nur ein anderer Leser.

---

Nächster Schritt: e2e-tester zieht `tests/e2e/kanban.spec.ts` auf Regelspalten nach (offene
Frage 2); api-dev entscheidet über 409 statt 500 beim doppelten Regelnamen (offene Frage 1).
Danach steht die Frage, wo die **Statusstruktur** verwaltet wird (offene Frage 3) — ohne sie
bleibt A-5.4 unbedient, und das ist die einzige Anforderung, die diese Umstellung offen
zurücklässt.
