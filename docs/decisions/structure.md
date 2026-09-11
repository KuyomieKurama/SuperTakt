# Pools und Regeln — Vorgeschichte der Entscheidungen

Dieses Papier nimmt auf, was bis T-255 als Rückblick **im Quelltext** von
`apps/web/src/features/structure/**` stand: Vorgeschichte, Aufgabennummern und
Meßprotokolle. Es ist kein Ersatz für die Spezifikation und keine
Anforderungsquelle — die verbindlichen Sätze stehen in `docs/spec.md`.

Was der Code selbst braucht, blieb im Code: jeder Satz, der erklärt, warum die
heutige Lösung überrascht, und jeder, der eine Wiederholung verhindert. Dieselbe
Trennlinie wie in `docs/decisions/board.md` (T-253) und
`docs/decisions/export.md` (T-254).

**Dieses Merkmal ist kleiner, als sein Name vermuten läßt.** `features/structure`
hält die vier Flächen, mit denen eine Regel angelegt, umbenannt und gelesen wird
— das Formular, der Umbenennungsdialog, die beiden Chip-Auswahlen und die
Zusammenfassung. Das Regelmodell (`lib/poolRule.ts`), der Ordnerpfad
(`lib/folderPaths.ts`) und der Aufbau selbst (`app/StructureContext.tsx`) liegen
**nicht** hier: Sie haben Leser unterhalb der Merkmale, und `app/` liegt unter
`features/`. Die Messung dazu steht im Bericht zu T-255.

## Die Zusammenfassung war an zwei Stellen getippt und an der dritten gar nicht (T-079)

`RuleSummary.tsx`, Kopfkommentar

Bis T-079 stand die Regel eines Pools an zwei Flächen als getippter Text und an
der dritten überhaupt nicht — und die beiden Fassungen kannten nur die Tagliste.
Seit E-055 hat eine Regel fünf Achsen; zwei Fassungen wären damit nicht mehr
bloß uneinheitlich, sondern **falsch**.

Geblieben ist die Regel: Die Zusammenfassung wird **einmal** gebaut und steht
unter jedem Spaltenkopf, in jeder Zeile der Regelverwaltung und als Vorschau im
Formular. Eine Spalte, die ausgeschlossene Tags nennt und davon nichts zeigt,
behauptet eine Regel, die sie nicht hat.

## Die Exportachse borgte sich das Buchungsetikett (T-094, E-059)

`RuleSummary.tsx`, Kopfkommentar

Bis T-094 trug die Exportachse `ExportStatusBadge` — dasselbe Etikett, das an
jeder Buchung steht. Die Absicht war richtig: Der Exportstatus ist die
Unterscheidung, um die sich Takt dreht, und zwei Aussehen dafür wären zwei
Sprachen.

Das Etikett brachte aber sein **Wort** mit, und das Wort gehört der Buchung:
„Offen". Im Regelformular stand damit drei Zeilen unter dem Optionsknopf „Noch
nicht abgerechnet" eine Vorschau, die „Offen" sagte — dieselbe Wahl, zwei
Wörter. E-059 hat das zugunsten des Formularworts abgeschafft.

Geblieben ist die Begründung, die weiter trägt: Eine Regel ist keine Buchung,
sie **fragt** nach dem Exportstatus ihrer Buchungen. Das Buchungsetikett bleibt,
wo Buchungen stehen.

## Stehengelassen, mit Absicht

Kein Satz ist gefallen, den ein Prüfer verlangt hat (E-078 Punkt 3). Im
Quelltext geblieben sind unter anderem:

- `PoolFormDialog.tsx`, „Vier Dinge, die dieses Formular nicht stillschweigend
  tun darf" — vier Regeln (E-055, A-3.4, E-032, T-076), kein Rückblick.
- `PoolFormDialog.tsx`, `folderSource`/`statusSource`: „bis T-091 wurde beides
  als ‚es gibt keinen Ordner‘ ausgegeben" — **B-5 aus R-2, Abschnitt 15**.
- `PoolFormDialog.tsx`, „Vier Bedienelemente, vier Namen" — **S-7 aus R-2,
  SC 1.3.1**.
- `PoolFormDialog.tsx`, der Toast nach dem Speichern — **S-9 aus R-2**.
- `PoolFormDialog.tsx`, „Die Warnbänder stehen **vor** der Vorschau" — **R-2,
  Abschnitt 9**.
- `PoolFormDialog.tsx`, der Kasten „Nichts wird gespeichert außer der Regel" —
  **T-181, ST-05**. Ein Satz aus dem Textabbau fällt nicht beim Aufräumen.
- `PoolRenameDialog.tsx`, `UNCHANGED_HINT` — **T-220, T-221 Z-74**: zwei
  Abschriften desselben Satzes laufen beim nächsten Sprachdurchgang
  auseinander.
- `RulePickers.tsx`, der Kopf und der leere Meldebehälter — **B-5 aus R-2,
  Abschnitt 15; B-5, T-191**.
- `RuleSummary.tsx`, „Am betroffenen Chip, nicht an der Achse" — **T-087**: bei
  „Ordner Nord **oder** Ordner Ost" zeigte die Oberfläche auf beide und damit
  auf den falschen.
- `RuleSummary.tsx`, der Hilfssatz an der Exportachse — **W-7 aus R-2a, T-102**.
