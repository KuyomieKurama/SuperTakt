# Einstellungen — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-255 als Rückblick **im Quelltext** von
`apps/web/src/features/settings/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert.
Dieselbe Trennlinie wie in `docs/decisions/tags.md` (T-250),
`docs/decisions/todos.md` (T-251), `docs/decisions/timer.md` und
`docs/decisions/bookings.md` (T-252), `docs/decisions/board.md` (T-253) und
`docs/decisions/export.md` (T-254).

## Der Exportordner war ein Freitextfeld (T-036, Befund S-04, A-8.9, R-05)

`SettingsScreen.tsx`, Kopfkommentar — heute `ExportSettings.tsx`

Bis T-036 stand im Bereich „Export" ein Freitextfeld mit dem Platzhalter
`C:\Takt\Export`. Der Traversierungsschutz im Dienst hielt und hält — es ging
nie um einen Angriff, sondern darum, daß ein Eingabefeld dazu einlädt, die
Exportdateien an eine ungeeignete Stelle zu legen. Diese Dateien enthalten
Kundennotizen in einer Kodierung, die wie Schutz aussieht und keiner ist.

Geblieben ist die Regel, und sie steht jetzt an der Karte, die sie betrifft:
Das Feld liegt in `features/export/ExportDirectoryField.tsx` und wählt über den
Systemdialog. Die Beurteilung des Pfades in
`features/export/exportDirectoryAdvice.ts` ist **die Erklärung, nicht die
Grenze** — die zieht der Dienst, und er zieht sie noch einmal.

## Fünf Karten untereinander, 2379 Pixel in einem 820 Pixel hohen Fenster (T-057, Punkt 2)

`SettingsScreen.tsx`, Kopfkommentar

Bis T-057 standen in S-09 fünf Karten untereinander — Export (mit Ordner,
Vorlage, Rundung und Farbmodus in **einem**), Arbeitsplatz, Standard-Tags,
Add-in und Sicherheitsmeldungen. Gemessen 2379 Pixel in einem 820 Pixel hohen
Fenster: Wer den Farbmodus suchte, scrollte an allem vorbei, was er nicht
suchte.

Geblieben ist die Regel: Jeder Bereich hat **eine eigene Adresse**
(`#/einstellungen?bereich=darstellung`), und deshalb ist die Leiste eine `<nav>`
mit Verweisen und keine ARIA-Registerkarte.

Seit T-255 ist die Bereichsliste außerdem die **Dateigliederung** des Merkmals:
`DataTransferSettings.tsx`, `ExportSettings.tsx`, `DefaultTagSettings.tsx`,
`AddinSettings.tsx` und `StatusSettings.tsx` sind je ein Bereich aus `AREAS`.

## Der Farbmodus lag auf der Exportkarte (T-057)

`SettingsScreen.tsx`, Karte „Export" — heute `ExportSettings.tsx`

Der Farbmodus stand bis T-057 auf der Exportkarte und wurde mit demselben Knopf
gespeichert wie Exportordner, Vorlage und Rundung. Er hat mit keinem der drei
etwas zu tun und liegt seither im Bereich „Darstellung" — dort ohne
Speichern-Knopf, weil man sein Ergebnis sofort sieht.

## A-5.4 war unbedient, nachdem der Board-Dialog fiel (T-072, T-073, E-054)

`StatusSettings.tsx`, Kopfkommentar

Mit dem Board-Dialog ist in T-072 das letzte Bedienelement für
`POST/PATCH/DELETE /todo-statuses` und `PUT /todo-statuses/order` verschwunden.
Die Routen blieben, der Weg dorthin nicht: A-5.4 war unbedient. Der Bereich
„Status" in S-09 ist der Ersatz; er kam mit T-073 als sechster Bereich dazu.

Geblieben ist die Begründung, warum er dort und nicht auf dem Board steht: Seit
E-054 ist eine Spalte eine **Regel** und seit E-055 hat eine Regel fünf
Bedingungen — der Status ist eine davon und keine Spalte mehr. Er ist damit eine
Stammgröße wie die Standard-Tags, und Stammgrößen stehen in den Einstellungen.

## Stehengelassen, mit Absicht

Kein Satz ist gefallen, den ein Prüfer verlangt hat (E-078 Punkt 3). Im
Quelltext geblieben sind unter anderem:

- `ExportSettings.tsx`, der Kommentar am leeren Meldebehälter — **B-5, T-162,
  T-186, Befund O-GQ, T-191**. Die Fläche, die er erklärt, mißt
  `apps/web/test/liveRegionsAlwaysRendered.test.ts`.
- `SettingsScreen.tsx`, `AREA_LIST` und der Kartentitel „Arbeitsplatz" —
  **T-181, ST-04, Auflage Z-12 aus T-177**. Ein Satz aus dem Textabbau fällt
  nicht beim Aufräumen.
- `StatusSettings.tsx`, die drei ST-04/ST-05-Kommentare zur Beschreibung des
  Bereichs.
- `useUpdateNotice.ts`, der ganze Block zu **T-144 U-01 / T-147** — er erklärt,
  warum der Hinweis mitten in der Sitzung eine Leiste und kein Dialog ist
  (SC 2.4.3, SC 3.2.5), und verhindert damit eine Wiederholung.
- `UpdateDialog.tsx`, der ganze Kopf — er ist Regel, nicht Rückblick (A-18.7:
  keine Vorauswahl; A-18.9: es wird nichts heruntergeladen und nichts
  installiert).
- `WorkstationFacts.tsx`, „Bis T-042 war der Name nur in `ExportRun.windowsUser`
  zu sehen" — der Satz begründet, warum die Karte überhaupt existiert.
- `api.ts`, `reorderTodoStatuses`: „Er hieß hier bis T-050 `reihenfolge`".
  `proof:callers` setzt genau diesen Namen als Probe ein; der Kommentar steht
  neben der Stelle, die der Wächter mißt.
