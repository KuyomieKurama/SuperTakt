# Buchungen — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-252 als Rückblick **im Quelltext** von
`apps/web/src/features/bookings/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Dieselbe Trennlinie wie in `docs/decisions/tags.md`, `docs/decisions/todos.md`
und `docs/decisions/timer.md`.

## Die falsche Rechnung für die Buchung von Hand (T-107, T-118, O-V)

`api.ts`, `CreateTimeEntryResult`

Der Nachtrag zu E-061 nannte in seiner ersten Fassung `bookingMovementStates`
für die Buchung von Hand. T-107 hat das gemeldet und richtiggestellt, und der
Kommentar an diesem Typ zog bis T-118 nach.

Geblieben ist die Regel und ihre Begründung: Es ist `closedEntryMovementStates`
und nicht `BOOKING_EFFECT` — die Buchung von Hand hebt „Erledigt" nicht auf, und
ein gemeldetes Verlassen der Erledigt-Spalte wäre eine Bewegung, die nicht
stattfindet.

## Eine Meldung für zwei Pflichtfelder (T-175, T-177, E-084)

`BookingDialogs.tsx`, `BookingFormDialog`

Bis T-175 stand im Dialog **eine** Meldung für **zwei** Pflichtfelder, und sie
hing am Feld „Anfang": Wer das Ende leer ließ, las den Tadel unter dem Feld, das
er ausgefüllt hatte.

Geblieben ist die Regel: Seit E-084 dem Formular `noValidate` gibt, ist die
Bauart zugleich die einzige Prüfung, die diese beiden Felder noch haben — also
trägt jedes Feld seine eigene Meldung, und beide stehen in der Live-Region ihres
Feldes (T-162).

## Dieselbe Handlung, zwei Formen (T-108, W-5 aus R-2a)

`BookingDialogs.tsx`, `BookingFormDialog`

Bis T-108 stand nach der Buchung von Hand „Zeit gebucht." mit dem Todo im Rumpf,
während der Stopp das Todo im Titel führte — dieselbe Handlung, zwei Formen.

Geblieben ist der Rahmen: Der Titel nennt das Todo, der Rumpf sagt, was mit ihm
geschehen ist. Der Bewegungssatz beginnt mit „Es" und nennt das Todo nicht; ohne
einen Bezug darüber stünde das „Es" allein.

## Zwei Gründe für einen fehlenden gerundeten Wert (T-045)

`BookingDialogs.tsx`, `ResetExportDialog`

Bis T-045 sahen beide Fälle gleich aus: „die Domäne sagt, die Gruppe hat keinen
gerundeten Wert" und „die Vorschau hat nicht geantwortet". Die Vorgeschichte
dazu steht an `app/dayGroup.ts`.

Geblieben ist der Satz, der den Unterschied vor die folgenreichste Bestätigung
des Produkts stellt.

## Das Protokoll war gebaut und hatte keinen Aufrufer (T-040, Befund C-01)

`BookingDialogs.tsx`, `BookingHistoryDialog`

Bis T-040 gab es diese Auskunft nirgends: `GET /export/audit` war gebaut,
geprüft und ohne einen einzigen Aufrufer in der Oberfläche. Damit war der ganze
Aufwand für den eigenen Ereignistyp (E-047), für die Herkunft ohne Exportlauf
und für den Trigger, der keinen Exportstatus ohne Herkunft zuläßt, für den
Benutzer unsichtbar.

Geblieben ist, was der Dialog heute ist: Er schreibt nichts, hat deshalb keinen
Bestätigungsknopf, sondern nur einen Weg hinaus und einen Weg weiter ins
Gesamtprotokoll.

## Woher dieses Papier kommt

T-252, dritte Welle der featureweisen Umstrukturierung von `apps/web/src`. Die
Trennlinie ist dieselbe wie in den drei Schwesterpapieren.
