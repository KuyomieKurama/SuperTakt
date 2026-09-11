# Board — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-253 als Rückblick **im Quelltext** von
`apps/web/src/features/board/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert. Dieselbe
Trennlinie wie in `docs/decisions/tags.md` (T-250), `docs/decisions/todos.md`
(T-251), `docs/decisions/timer.md` und `docs/decisions/bookings.md` (T-252).

## „Welche Karte wo steht, entscheiden die Tags" stand an elf Stellen (T-091, E-055)

`BoardScreen.tsx`, Kopfkommentar

Der Satz war die Kurzfassung eines Zustands, den es seit E-055 nicht mehr gibt:
Eine Spalte ist eine Regel über **fünf** Bedingungen — erforderliche Tags,
ausgeschlossene Tags, Status, „Erledigt" und Exportstatus. Drei davon ändern
sich, ohne daß jemand ein Tag anfaßt.

Bis T-091 stand er trotzdem an elf Stellen und schickte den Benutzer im
wichtigsten Fall an die falsche Stelle suchen: Wer nach einem Timerstart eine
Karte vermißte, las „es liegt an den Tags" und sah die Tags unverändert.

Geblieben ist die Regel: Der Satz wird in dieser Ansicht nirgends getippt. Seine
beiden Fassungen stehen in `lib/labels.ts` (`RULE_IS_A_RULE`,
`RULE_WHAT_MOVES_A_CARD`).

## Der Erledigt-Toast behauptete zweimal das Gegenteil (T-091, T-094, E-058, E-060)

`BoardScreen.tsx`, `toggleDone`

Bis T-091 stand im Toast „Die Regeln ihrer Spalten treffen unverändert zu"
beziehungsweise „Sie bleibt in ihren Spalten stehen". Beide Sätze stammen aus der
Zeit, in der eine Spalte nur an Tags hing. Seit E-055 kann eine Spalte
ausdrücklich nach „Erledigt" fragen — dann wechselt die Karte mit genau dieser
Handlung die Spalte, und der Toast sagte das Gegenteil.

Bis T-094 schwieg er deshalb über die Spalten: Die beiden Erledigt-Routen
antworteten mit dem Todo und sonst nichts. Selbst zu rechnen wäre die zweite
Fassung einer Auskunft gewesen, die E-058 gerade auf eine zusammengeführt hatte.

Seit E-060 liefern beide Routen `poolMovement`, gerechnet aus dem Zustandspaar
vor und nach der Handlung. Geblieben ist die Regel: Die Ansicht rechnet die
Bewegung nicht selbst, `null` heißt „keine Fläche bewegt sich", und die pauschale
Zeile „Sie verschwindet vom Board" entfällt, wo der genauere Bewegungssatz steht.

## Der Rückweg gab es nur an einer von drei Flächen (T-118, B-7 aus T-116, E-059)

`BoardScreen.tsx`, `toggleDone`, `action`

Bis T-118 bot „Rückgängig" nach dem Erledigt-Kennzeichen nur die Todo-Liste an —
dieselbe Handlung mit zwei Schutzniveaus, buchstäblich der Befund, aus dem E-059
entstanden ist.

Geblieben ist die Regel: der Rückweg an allen drei Flächen, und keiner in der
Gegenrichtung, weil „wieder offen" selbst schon die Rücknahme ist.

## „Vom Board nehmen" war einmal geschützt und einmal nicht (T-091, T-108, W-14 aus R-2a)

`BoardScreen.tsx`, `setPlacement`

Bis T-091 war „Vom Board nehmen" auf dieser Fläche durch einen
Bestätigungsdialog geschützt, während dieselbe Handlung in der Regelliste (S-08)
eine Sofortaktion mit Toast war, ohne Rückweg.

Aufgelöst zugunsten der schwächeren, ehrlicheren Fassung. Der Grund dafür steht
weiter im Quelltext, weil er erklärt, warum an einer gefährlich klingenden
Handlung kein Dialog steht.

Der **Wortlaut** der Meldung stand bis T-108 ebenfalls hier: Jede Aufrufstelle
gab ihren Titel selbst mit (`spoken`) — vier Stellen auf dieser Fläche, eine
weitere in der Regelliste mit anderem Wortlaut. Geblieben ist
`poolPlacementMessage` in `lib/labels.ts`, die Titel und Zeile in einem Aufruf
bildet, und die Regel, daß diese Stelle keinen Titel mitgibt.

## Eine Spalte umbenennen hieß, ihre Regel neu zu schreiben (T-133, O-A)

`BoardScreen.tsx`, `columnMenu` — und `BoardSetupDialog.tsx`

Bis T-133 gab es den Eintrag „Umbenennen" nicht. Wer eine Spalte umbenennen
wollte, mußte erraten, daß der Name im Regelformular steht — und schrieb beim
Speichern alle fünf Achsen neu, um ein Wort zu ändern.

Geblieben sind zwei getrennte Wege mit zwei Beschriftungen und die Regel dahinter:
Die Reihenfolge folgt der Häufigkeit, das Symbol der Bedeutung. Der Stift ist an
jeder anderen Fläche das Umbenennen (S-08, S-09); das Regelformular bekommt dafür
den Trichter, weil eine Regel ein Filter **ist** (E-055).

## Ein Knopf ließ den Dialog offen und legte seinen Rückweg nach draußen (T-102, W-6 aus R-2a)

`BoardScreen.tsx`, `onAdopt` und `onRemove` am Einrichtungsdialog

Bis T-102 schloß nur „Vom Board nehmen" den Dialog. „Als Spalte aufnehmen" ließ
ihn offen — und legte seinen Rückweg in einen Toast, der außerhalb des
`aria-modal="true"` mit Tabulatorschleife liegt (`FormDialog`). Für Tastatur und
Vorlesehilfe war „Rückgängig" damit nicht vorhanden, und seit E-059 ist der
Rückweg der einzige Schutz vor dieser Handlung.

Geblieben ist die Regel: **beide** Knöpfe schließen den Dialog, und zwar vor der
Meldung. Der Grund — Toast außerhalb der Schleife — steht weiter im Quelltext,
weil er sonst wie eine Geschmacksfrage aussieht. `components/DialogSurface.tsx`
verweist auf diese Stelle.

## Der Leerzustand sprang am Einrichtungsdialog vorbei (T-186, TP-KANBAN-08)

`BoardEmptyState.tsx`, `onOpenSetup`

Bis T-186 hieß diese Eigenschaft `onCreate` und sprang unmittelbar in
`PoolFormDialog`. Der Sprung war bequem und kostete die **Definition**:
`RULE_IS_A_RULE` steht im Einrichtungsdialog, und seit ST-05 ist er eine von nur
noch zwei Stellen, an denen SuperTakt überhaupt sagt, daß eine Spalte eine Regel
ist und kein Ablageort. Auf dem Weg des Leerzustands war sie damit nicht
erreichbar — die Streichung war gebaut, der Ausgleich nicht (E-081 Punkt 4).

Geblieben ist der Name, der sagt, wohin es geht, und die Messung in
`tests/e2e/board-empty-state-rule-chain.spec.ts`.

## Die Karte „Was sich geändert hat" ist gefallen (T-209, UM-08, B-3 aus T-171)

`BoardEmptyState.tsx`

Sie sprach zu jemandem, der vor E-054 ein Statusboard hatte, und ihre Bedingung
ist gemessen nie wahr: E-054 fiel vor der ersten Auslieferung, und
`0010_drop_board_rank` läuft in jeder frischen Einrichtung mit der Kette 0001 bis
0015 durch.

**Der Ausgleichsnachweis steht weiter im Quelltext**, an der Stelle, an der die
Karte stand, und er bleibt dort: Er nennt für jeden der vier Punkte den heutigen
Träger, darunter den Handbuchabsatz, der seit diesem Fall Alleinträger ist und als
SP-22 auf der Sperrliste steht. Ein Ausgleich, den man nicht nachlesen kann, ist
keiner.

## Die Spaltennamen auf der Karte waren einmal gewöhnlicher Text (T-133, O-AT)

`Kanban.tsx`, `KanbanAppearance.otherColumns`

Bis T-133 hieß das Feld `readonly string[]`. Die Behandlung an der Anzeigestelle
war damit freiwillig, und `apps/web/scripts/proof-foreign.mjs` konnte sie nicht
einfordern.

Geblieben ist die Regel: Die Marke sitzt am Element und nicht an der Reihe, und
der Nachweis liest sie dort (`declaresForeign`).

## Woher dieses Papier kommt

T-253, vierte Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie des Auftraggebers: Was erklärt, warum der heutige Code überrascht, und
was eine Wiederholung verhindert, bleibt im Quelltext; Vorgeschichte,
Aufgabennummern und Meßprotokolle stehen hier.

**Sechs Blöcke sind ausdrücklich nicht hierher gewandert**, weil ein Prüfer sie
verlangt hat oder weil sie eine Wiederholung verhindern:

1. `BoardScreen.tsx`, „## Was hier nicht mehr steht" — die Grabinschrift des
   Ziehens (`DRAG_MIME`, `draggable`, `dropColumn`, `moveByOffset`).
2. `Kanban.tsx`, „## Warum hier nichts mehr gezogen wird" — dieselbe Inschrift
   samt der Zusage zu SC 2.5.7: Was es nicht gibt, braucht keine Ersatzbedienung.
3. `BoardScreen.tsx`, der Kommentar am `lead` des Bildschirms — Auflage aus T-177
   Abschnitt 1.1: „Der Satz bleibt ungekürzt."
4. `BoardEmptyState.tsx`, der Ausgleichsnachweis zu UM-08 (E-081 Punkt 4, SP-22).
5. `BoardEmptyState.tsx`, der Kommentar an `description` mit dem Verweis auf
   `tests/e2e/board-empty-state-rule-chain.spec.ts` — Auflage Z-07 Punkt 1.
6. `BoardSetupDialog.tsx`, der Kommentar an `description={RULE_IS_A_RULE}` —
   dieselbe Auflage, zweite Stelle.
