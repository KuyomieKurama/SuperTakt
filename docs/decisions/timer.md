# Timer — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-252 als Rückblick **im Quelltext** von
`apps/web/src/features/timer/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert.
Dieselbe Trennlinie wie in `docs/decisions/tags.md` (T-250) und
`docs/decisions/todos.md` (T-251).

## Die Oberfläche setzte den Bewegungssatz einmal selbst zusammen (T-094, E-058)

`useReactivation.ts`, `announceStart` — und `api.ts`, `StartTimerResult.poolMovement`

Bis T-094 stand in `announceStart` ein zweiter Weg zur selben Auskunft:
`poolsContaining` rief je Pool `/pools/{id}/todos` ab und setzte den Satz in der
Oberfläche zusammen. Er hatte drei Fehler, und alle drei sind mit E-058 weg.

1. Er kannte nur, was **hinzukommt**. Eine Regel „nur Erledigte" verliert das
   Todo mit genau diesem Start; davon stand nichts im Satz.
2. Er lief erst **nach** der Handlung und sah damit nur den Zustand danach —
   „erscheint" und „erscheint schon vorher" waren nicht zu unterscheiden.
3. Er war die zweite Fassung eines Satzes, den der Aufgabenbereich des Add-ins
   ebenfalls sagt. Zwei Fassungen einer Auskunft laufen auseinander; sie haben
   es getan (Befund C-24, B-2).

Derselbe Rückblick stand ein zweites Mal am Feld `poolMovement` in
`StartTimerResult`: Die Oberfläche fragte dort je Pool `/pools/{id}/todos` ab und
setzte den Satz selbst zusammen — eine zweite Auskunft über dieselbe Handlung,
die `leaves` nicht kannte und deshalb nur die halbe Bewegung berichtete.

Geblieben ist an beiden Stellen die Regel: Die Oberfläche zählt die Namen
**nicht** selbst auf; den Satz bildet `poolMovementSentence` aus `@takt/domain`,
dieselbe Funktion, die das Add-in aufruft.

## Die erste abgeschlossene Buchung war gerechnet, aber unsichtbar (T-094, O-G)

`useReactivation.ts`, `announceStart`

`doneCleared` entscheidet, welche Frage an dieselben drei Listen gestellt wird.
Der zweite Fall — die erste abgeschlossene Buchung, die eine Spalte „noch nicht
abgerechnet" füllt — war bis T-094 gar nicht sichtbar: Der Dienst rechnete ihn,
niemand zeigte ihn.

## Zwei Gründe, eine Meldung (T-101, O-R)

`api.ts`, `ResolveOrphanedTimerResult` — und `TimerContext.tsx`, `confirmOrphan`

Bis T-101 gab der Dienst in beiden verworfenen Fällen `timer_too_short` aus und
überschrieb damit die Entscheidung der Domäne (`decideOrphanedTimer` liefert
`orphan_discarded`). Die Oberfläche sagte deshalb an beiden Ausgängen dasselbe
und behauptete im zweiten Fall stillschweigend eine Entscheidung, die niemand
getroffen hatte.

Geblieben ist die Unterscheidung selbst: „Sie haben verworfen" gegen „es gab
nichts zu buchen", zwei Texte an zwei Ausgängen.

## Der Stoppknopf in der Kopfleiste stand mitten im Satz (T-056)

`TimerBar.tsx`

Bis T-056 stand der Stoppknopf zwischen Zeit und Titel — ein nacktes
lachsfarbenes Quadrat mitten im Satz, das aussah, als sei es hineingefallen. Er
steht jetzt am Ende der Zeile, wo eine Aktion hingehört, und trägt sein Wort:
„Stoppen".

Geblieben ist die Regel: Die Reihenfolge in der Leiste ist die Lesereihenfolge —
erst der Puls, dann die Zeit, dann worauf sie läuft, und ganz am Ende die
Aktion.

## Ein Versprechen, das die Zeiterfassung nicht einlösen konnte (T-040, Befund C-04)

`TimeScreen.tsx`

Bis T-040 lud S-05 seine Auswahlliste mit `onlyOpen: true`. Ein erledigtes Todo
erschien dort also nie — und daneben stand trotzdem der Satz „Startet der Timer
auf einem erledigten Todo, ist es danach wieder offen." Ein Versprechen, das der
Screen nicht einlösen konnte, ist schlimmer als kein Satz.

Geblieben ist der Schalter, der es einlöst (E-039), und die Beschreibung dessen,
was ein Start auf einem erledigten Todo bewirkt.

## Der stumme Fehlschlag der Exportvorschau, dritte Stelle (T-045, E-034)

`TimeScreen.tsx`

Bis T-045 wurde der Fehlschlag der Vorschau auch hier verschluckt, und die
Kachel „Noch offen" sagte danach „Noch nicht exportiert." — richtig geraten,
aber nicht gewußt. Dieselbe Lücke wie in `features/todos/TodoDetailScreen.tsx`
(siehe `docs/decisions/todos.md`) und in `app/dayGroup.ts`.

Geblieben ist: Der Grund kommt mit, und die erfaßte Zeit daneben stimmt
unabhängig davon.

## Woher dieses Papier kommt

T-252, dritte Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie des Auftraggebers: Was erklärt, warum der heutige Code überrascht,
und was eine Wiederholung verhindert, bleibt im Quelltext; Vorgeschichte,
Aufgabennummern und Meßprotokolle stehen hier.
