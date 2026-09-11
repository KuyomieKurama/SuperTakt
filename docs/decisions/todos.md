# Todos — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-251 als Rückblick **im Quelltext** von
`apps/web/src/features/todos/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert.
Dieselbe Trennlinie wie in `docs/decisions/tags.md` (T-250).

## Die Antwort auf „Erledigt setzen" trägt die Bewegung (O-U, E-060)

`api.ts`, `markTodoDone`

Bis E-060 stand an dieser Funktion: „Was diese Antwort **nicht** enthält, ist
die Bewegung dazu … für das Setzen und Aufheben von Hand gibt es sie nicht."
Das war die Lücke O-U. Seit E-055 entscheidet „Erledigt" über Spalten, und
damit schwieg der Toast nach dem Umlegen über genau die Bewegung, die derselbe
Übergang über einen Timerstart angesagt bekam — wer an einer Stelle Auskunft
gibt und an der anderen schweigt, sagt die halbe Wahrheit.

Mit E-060 steht `poolMovement` in der Antwort. Die Oberfläche rechnet weiterhin
nichts nach; sie liest nur mehr.

## „Verschiebt keine Karte" war der Satz aus der Zeit vor E-055 (T-094)

`api.ts`, `clearTodoDone`

Bis T-094 stand hier „Verschiebt keine Karte." Das war derselbe Irrtum wie
`CARD_STAYS`: Eine Spalte, die nach „Erledigt" fragt, verliert oder gewinnt das
Todo mit dieser Handlung. Die Regel steht weiter im Quelltext, nur ohne die
Vorgeschichte.

## Der Rückweg aus „Erledigt": eine Fassung statt dreier (T-116, T-118, E-059)

`undoDone.ts`

Bis T-118 bot **nur** die Todo-Liste (S-02) einen Rückweg aus „Erledigt" an,
und dieser eine war zugleich der einzige der Anwendung ohne `catch`: Ein
Fehlschlag war vollständig stumm — keine Meldung, kein Etikett, kein
Protokolleintrag. Einen globalen Auffänger für abgewiesene Zusagen gibt es im
Baum nicht.

Beides ist derselbe Befund in zwei Richtungen (B-6 und B-7 aus T-116). Seither
steht der Rückweg an allen drei Flächen und kommt aus einer Funktion.

## Ein Tag-Filter ohne Bedienelement (T-059)

`TodoListScreen.tsx`

Bis T-059 gab es den Tag-Filter der Todo-Liste zwar in der Abfrage, aber **kein
Bedienelement** dafür: Setzen ließ er sich nur über einen Klick auf ein Tag-Chip
in einer anderen Ansicht, wieder loswerden nur über das Chip in der
Filterleiste. Ein Filter, den man nicht einstellen kann, ist keiner.

Geblieben ist die Regel, die den heutigen Zustand erklärt: Die Adresse bringt
genau **ein** Tag mit, das Bedienelement führt eine Liste.

## Der stumme Fehlschlag der Exportvorschau (T-045, E-034)

`TodoDetailScreen.tsx`

Bis T-045 verschwand der Fehlschlag der Vorschau über die offenen Buchungen
stumm: Der gerundete Wert fehlte dann mit dem Satz „Noch nicht exportiert.",
und die Tagesgruppen ohne Leistungstext waren unmarkiert, als hätte jede eine.
Seither kommt der Grund mit (`previewProblem`).

## Zwei Beschriftungsfunktionen, die verschieden antworteten (T-156, T-157, O-CR)

`attachmentLabel.ts`

Bis T-156 stand `attachmentLabel` zweimal im Baum: einmal in der Oberfläche,
einmal in `packages/domain/src/attachment.ts` — und die beiden **antworteten
verschieden**. Ohne Titel lieferte die Domäne den Wirtsnamen
(`beispiel.example`), die Oberfläche alles hinter dem Schema
(`beispiel.example/Seite`); bei leerem Ziel sagte die eine
`Verweis`/`Datei`/`Bild`, die andere `Ohne Bezeichnung`. Die maßgebliche
Fassung war dabei die tote: Sie hatte keinen Aufrufer außer ihrem eigenen
Prüffall.

Seither ruft die Oberfläche die Domäne, und was in der Oberfläche bleibt, ist
der Übergang.

## Woher dieses Papier kommt

T-251, zweite Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie des Auftraggebers: Was erklärt, warum der heutige Code überrascht,
und was eine Wiederholung verhindert, bleibt im Quelltext; Vorgeschichte,
Aufgabennummern und Meßprotokolle stehen hier.
