# T-373 — `todo-tabelle.md` nach T-366, T-365 und den acht Entscheidungen nachgezogen

**Aufgabe:** T-373
**Rolle:** ui-designer
**Datum:** 2026-09-14
**Status:** fertig — braucht Review (spec-ux-reviewer gegen das Schwesterpapier aus T-374)

---

## Artefakte

| Datei | Art |
|---|---|
| `docs/design/todo-tabelle.md` | überarbeitet — 5.1, 5.3, 5.4, **5.5 neu**, 6.2, 6.3, 7.2, 8.1, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, **10.4 neu**, 11, Berichtigungsliste im Kopf |
| `.claude/team/reports/T-373-ui-designer.md` | dieser Bericht |

Kein Produktivcode. `docs/design/todo-tabelle-fluss.md` **nicht** angefaßt (T-374).

---

## Zusammenfassung

Das Papier trägt ab jetzt an jeder geänderten Stelle die Entscheidung, die sie umsetzt — die
Berichtigungsliste im Kopf ordnet siebzehn Abschnitte den Kennungen B-1 bis B-8 und N-2 bis N-10
zu, damit der nächste Abgleich nachschlagen kann statt lesen zu müssen (E-113, zweimal eingetreten).
Vier offene Punkte sind durch die Messungen von T-365 geschlossen: die Spaltensumme steht jetzt
gemessen bei **43,5 rem** gegen das Budget von 44 rem, der Ausgang des Bildlaufs ist entschieden
(die Fläche **schließt**), A13 ist mit 662 px gegen 958,5 px bestätigt, und `proof:clamp` steht
unverändert bei 37 Deckelklassen. Zwei Entscheidungen liefen gegen das Papier und sind eingearbeitet:
Ü-1 ist **aufgelöst** — gebaut ist ein nicht-modaler `Popover`, und die Rollenfrage `role="dialog"`
ist mit Begründung und einer Auflage (`aria-modal` nie) entschieden —, und `.todo-row` überlebt am
`<tr>`, während der Paletteneintrag in `lines` und `zen` **trotzdem** fällt. Neu hinzugekommen ist
Abschnitt 5.5: SC 1.4.13 hatte auf beiden Seiten keinen Mechanismus, jetzt stehen Zeitwerte, Versatz
und das Eigentum an `Escape` da — samt der Regel, daß Versatz und Nachlauf ein **Paar** sind.

---

## Die sieben Aufträge, je mit dem, was daraus wurde

### 1. B-4 aufgelöst (5.1, 5.3)

**Ü-1 fällt weg.** `@ark-ui/react/hover-card` liegt vor (5.39.0, `@zag-js/hover-card@1.43.3`) und
ist trotzdem unbrauchbar — `tabIndex: -1` am Inhalt ohne Weg hinein, `TRIGGER_BLUR` schließt beim
Fokus. Gebaut und im Papier festgeschrieben ist `@ark-ui/react/popover` mit `modal={false}`. Der
Baustein bringt zwei Dinge nicht mit, und beide stehen deshalb in der Datei: das Aufgehen beim
Überfahren und das Setzen des Fokus.

**Die Rollenfrage ist entschieden: `role="dialog"` bleibt.** Vier Gründe stehen im Papier, der
wichtigste ist die Trennung, die 5.1 vorher nicht machte: **Was ein Dialog behauptet, behauptet er
über `aria-modal`, nicht über seinen Namen.** Ohne `aria-modal`, ohne Abdunklung und ohne Fokusfalle
ist „Dialog, 11 Tags" eine Beschreibung, keine Aufforderung. `region` wäre die einzige ernsthafte
Gegenkandidatin und ist schlechter: Eine Tabelle mit hundert Zeilen bekäme hundert benannte
Landmarken ins Verzeichnis. **Der Preis steht dabei** (eine Vorlesehilfe sagt „Dialog" über eine
Fläche, die nichts entscheidet), und daraus folgt eine **Auflage**: `aria-modal` wird hier nie
gesetzt, es kommt nie ein `.scrim` dazu, und der e2e-tester mißt das als **A16**.

**Nebenprodukt, das ich für nötig halte:** Die sechs Anforderungen an die Fläche hießen in der
ersten Fassung `B-1` bis `B-6` — dieselbe Namensform wie die acht blockierenden Befunde von T-366,
die das Papier jetzt an zwei Dutzend Stellen zitiert. Sie heißen ab jetzt **TF-1 bis TF-6**.

### 2. B-6 aufgelöst (7.2, 10.1, 10.2)

`.todo-row` und `.todo-row__title` überleben als Haken; die übrige Klassenfamilie fällt (null
Fundstellen). Die Fundstellenliste in 10.1 ist damit **keine Bruchliste mehr**, sondern die
Begründung der Auflage — sie bleibt stehen, weil sie der Grund ist, aus dem die Klasse überlebt.

**Die scharf gewordene Frage ist entschieden: `.todo-row` fällt trotzdem aus beiden
`:is()`-Listen.** Eine Kartenregel auf einer Tabellenzeile ist nicht dieselbe Regel; sie trifft
anderes Gerät. Zwei Gründe, beide am Bestand:

- `lines` setzt `box-shadow: none` und löschte damit am `<tr>` die Markierung der Zeile im Zugriff
  (`.table__row--active`). `border-color` täte daneben nichts — die Kanten einer Tabelle sitzen an
  den Zellen.
- `zen` setzt `background-color: var(--bg-canvas)` und nähme **nur der Todo-Tabelle** das Zebra,
  das die Buchungstabelle einen Klick weiter behält.

**Die Wirkungsfrage habe ich ausdrücklich nicht vorweggenommen.** Das Argument der ersten Fassung
(„die Buchungstabelle zeigt dasselbe Zebra, und niemand hat es beanstandet") trägt für die Bauart
und nicht für die Wirkung; T-366 hat das zu Recht als dieselbe Grenze benannt, die 9.1 selbst zieht
(E-117). Im Papier steht jetzt: visual-qa mißt `zen`, `lines` und `plainspace` **vor** der Freigabe.

### 3. 9.4 nach B-8 berichtigt

Der Vorrat verlangte „mehr Tags, als die **Zelle** zeigt" und maß gegen eine aufgehobene
Voraussetzung. Neu, in der Fassung von T-366 und um eine Zeile erweitert:

- ein Todo mit **mindestens einem** Tag und eines mit **mehr Tags, als die Fläche ohne eigenen Lauf
  faßt** — das zweite bleibt nötig, aber aus einem anderen Grund: Es ist der einzige Vorrat, an dem
  der **innere Lauf** entsteht (Vorbedingung von A14c und TT-19);
- **ein Todo ganz ohne Tags**, als Gegenprobe: dort darf kein Auslöser stehen. Ohne diese Zeile ist
  „ohne Tags kein Knopf" eine Zusage ohne Wächter (E-111 auf den Auslöser angewandt).

### 4. A14 nach Modalität getrennt (9.3)

„Geschlossen **oder** mitgewandert" war die richtige Form, solange 6.2 zwei Ausgänge zuließ — und
wurde in dem Augenblick blind, in dem B-5 einen davon strich. Aus A14 sind geworden:

| | mißt |
|---|---|
| **A14a** | Zeiger-Weg: rollen ⇒ `.tagsurface` `count() === 0`, senkrecht und waagerecht |
| **A14b** | Tastatur-Weg: dasselbe **und** `document.activeElement` ist danach der Auslöser |
| **A14c** | Gegenprobe: Lauf **in** der Fläche schließt sie **nicht** |
| **A14d** | Gegenprobe: Klick auf einen halb sichtbaren Auslöser ⇒ Fläche bleibt offen |

A14d ist kein erfundener Fall: Er war in der Sondierung von T-365 reproduzierbar rot. A12 bleibt
unverändert und trägt jetzt die gemessenen Paare (1030/1030 und 1008/710). Die Gegenprobe nach
E-117 heißt damit **acht von acht**, nicht sechs von sechs.

### 5. SC 1.4.13 hat einen Mechanismus (5.5 neu)

Zeitwerte 220/220 ms, `gutter: 4`, `overflowPadding: 8`, `placement: "bottom-end"`. Der Kern des
Abschnitts sind nicht die Zahlen, sondern zwei Sätze:

- **Der Mechanismus für „überfahrbar" ist ein Paar.** Der Nachlauf trägt nur, weil **die Fläche
  selbst** `pointerenter`/`pointerleave` hört — sonst wäre er eine Gnadenfrist, und die Fläche
  schlösse 220 ms *nachdem* der Zeiger sie erreicht hat. Der Versatz ist die Strecke, die in dieser
  Zeit zurückzulegen ist; null wäre trotzdem falsch (SC 2.4.11, TT-17). **Wer eine der beiden Zahlen
  ändert, ändert die andere mit und mißt TT-13 neu.**
- **`Escape` gehört der obersten abweisbaren Fläche.** Heute reicht `trackDismissableElement`, weil
  die Todo-Tabelle in keinem Dialog steht. Für den Tag, an dem sich das ändert, steht die Auflage im
  Papier: dieselbe Bremse wie `shared/ui/Menu.tsx:69-78`, für `Escape` **und** `Tabulator`.

### 6. Die gemessenen Zahlen (4.3a, 6.2, 6.3, 10.3)

Die Berichtigung von 4.3a lag beim Aufsetzen dieser Aufgabe bereits im Papier; ich habe sie geprüft
und stehen lassen — sie nennt 43,5 rem, 17,8/16,4 rem für den Titel und die drei Gründe, aus denen
die Gegenrechnung von 56,5 rem danebenlag (fremde Tabellenbreiten, Spaltenbreite gleich
Inhaltsbreite gesetzt, ein Wort mitgerechnet, das die Zelle verloren hat). Neu eingetragen:

- **6.2** — die Fläche schließt, und **gemessen wird die Bewegung des Ankers**, nicht das Eintreffen
  des Ereignisses. Mit der Lehre darüber hinaus: *Ein Ereignis ist kein Zustand.*
- **6.3** — 662 px gegen 958,5 px an drei Fensterbreiten. R-a ist keine offene Aussage mehr, F-7
  geht nicht an T-361 zurück. A13 bleibt als Wächter, bewacht aber ab jetzt keine Rechnung mehr,
  sondern den Tag, an dem jemand den Fuß wieder zu einem Blockelement macht.
- **10.3** — die vier Berichtspunkte stehen mit Ergebnis und Fundstelle in einer Tabelle, damit sie
  niemand ein zweites Mal stellt. Dazu: `proof:clamp` unverändert bei **37**.

### 7. `TableShell` nach `shared/ui/` — ja, als eigener Auftrag (10.4 neu)

Die Hausregel ist zahlenmäßig erfüllt: drei Leser außerhalb von `bookings` (Musterseite, Buchungen,
Todos), und der Baustein ist eine **Zustandsform**, keine Fachlogik — er weiß nichts über Buchungen.
Nicht in dieser Welle, aus drei Gründen: Der Umzug faßt `BookingTable.tsx`, `BookingsScreen.tsx` und
`DataSection.tsx` an; `bookings ↔ todos` ist eine benannte echte Kante und damit kein Grund zur
Eile; und ein Umzug mitten in einer Welle ist die Sorte Änderung, die einem parallelen Prüfauftrag
den Boden wegzieht (T-315/T-316).

**Der Ankerwächter aus 6.2 wandert ausdrücklich nicht mit.** Er hat einen Leser. Erst wenn es die
zweite Fläche in einem zweiachsigen Laufkasten gibt (OF-3), ist eine gemeinsame Form an der Sache
gemessen und nicht an der Ähnlichkeit zweier Dateien.

---

## Zusätzlich erledigt, weil es sonst in die nächste Runde gefallen wäre

T-366 N-5 zählt fünf Fragen der Abgrenzung auf, die das Papier unbeantwortet ließ. Drei davon standen
noch offen und sind jetzt in 8.1 beantwortet — alle drei sind nach der Abgrenzung von T-361
**meine** Fragen, keine des Schwesterpapiers:

| | Antwort |
|---|---|
| **N-5b** Lautstärke der überfälligen Zelle | `DeadlineFlag` bleibt, wie es ist. Symbol + Wort + Datum liegt schon über SC 1.4.1; **die Tabelle ändert nur den Ort**, und eine Spalte macht ein überfälliges Datum schon dadurch sichtbar, daß seine Nachbarn danebenstehen. Eine Zellfläche in Signalfarbe schlüge das Zebra und konkurrierte mit `--running`. |
| **N-5c** Gestalt von `--running` und `--done` | `--running` färbt die Zeile (Vorder- und Hintergrund aus dem `--timer-running-*`-Paar); `--done` färbt **nicht** — Durchstreichung und `DoneFlag` reichen, und zwei zeilenweite Farben sind in der Überlagerung nicht mehr zu trennen. |
| **N-5d** Symbol in der Tag-Zelle | keines. In einer 3,5-rem-Spalte kostet es die halbe Fläche und sagt nichts, was der Spaltenkopf nicht sagt. Kenntlich macht den Auslöser seine Kante. |
| **N-5e** Ladeskelett | `TableShell` + `.loading-block rows={6}`: **gleich hohe Balken sind das Tabellenmerkmal**; einen Kopf zu zeichnen, den es gleich darauf in echt gibt, wäre teurer und unehrlicher. |

**Ein Befund für den frontend-dev, gefunden beim Nachziehen von 8.1 (Ü-2 im Papier):** Die gebaute
Zeilenfärbung `.table__row.todo-row--running` ist gegenüber `.table__row:nth-child(even)` **gleich**
gewichtet — zwei Klassen gegen Klasse plus Pseudoklasse — und gewinnt heute nur über die Reihenfolge
der Stilblätter. Der Kommentar an der Stelle sagt das Gegenteil. Der Bestand hat die haltbare Form
zwei Bildschirme weiter oben (`.table__row--exported, .table__row--exported:nth-child(even)`,
`components.css:846-848`): den Zebra-Fall **mit aufzählen**, statt die Gewichtung hochzuschrauben.
Eine Zeile, kein Befund, solange die Reihenfolge steht.

---

## Annahmen

1. **`role="dialog"` bleibt.** Das war die Frage aus dem Auftrag, und ich habe sie entschieden
   statt sie weiterzureichen. Die Gegenrichtung kostet TF-3, und TF-3 steht seit dem 2026-09-14
   wörtlich in A-25.9.
2. **Die Umbenennung TF-1…TF-6** ist von mir, nicht aus einer Entscheidung. Sie ändert keine Sache,
   nur einen Namen, und sie verhindert genau den Nachschlagefehler, gegen den E-113 steht.
3. **A16 ist neu** und nicht von T-366 verlangt. Ohne sie ist die Auflage aus 5.3 („nie
   `aria-modal`") eine Zusage ohne Wächter — dieselbe Klasse, die das Papier in 9.3 dreimal
   aufzählt.
4. **A14c und A14d sind Gegenproben, keine Zusicherungen.** Sie messen zwei Fehler, die beim Bauen
   tatsächlich entstanden sind; ohne sie wären A14a/A14b grün, während die Fläche sich beim Lesen
   selbst schließt.
5. **Die Zeitwerte 220/220 ms und `gutter: 4` habe ich von T-365 übernommen**, nicht neu gewählt.
   Sie sind gemessen (TT-13, TT-16, TT-17); eine zweite Zahl ohne zweite Messung wäre schlechter als
   eine gemessene, die ich nicht selbst gesetzt habe.
6. **F-8 bleibt unbeantwortet.** Die Randmarkierung steht in 8.1 als Bauform mit Preis, nicht als
   Entscheidung — sie gehört T-361 (siehe unten).

---

## Risiken

| | Risiko | Stand |
|---|---|---|
| **R-1** | `role="dialog"` ist entschieden, aber eine Vorlesehilfe sagt weiterhin „Dialog" über eine Auskunftsfläche | Angenommen, mit Preis und Auflage im Papier. **Ein Prüfer kann anderer Meinung sein** — dann ist es eine Entscheidung des Orchestrators und keine Nacharbeit am Papier. |
| **R-2** | `.todo-row` bleibt als Klasse, die **keine** CSS-Regel mehr liest — nur Prüffälle | Bewußt (B-6, E-114). Die Gefahr ist, daß jemand sie beim nächsten Aufräumen für einen Rest hält. Die Begründung steht im Papier **und** als Kommentar im Palettenblatt. |
| **R-3** | Zwei Papiere, dieselbe Welle, derselbe Befundsatz | Gemindert über die Berichtigungsliste im Kopf: jede Änderung nennt ihre Entscheidung. Aufgehoben ist es damit nicht — der Abgleich muß trotzdem stattfinden. |
| **R-4** | Die Zusammenlegung von „Erledigt" und „Status" war angeordnet und ist nicht gebaut | Das Papier sagt jetzt, **warum** (43,5 rem gemessen) und **warum die Gegenrechnung danebenlag**. Wenn der Auftraggeber sie trotzdem will, ist es eine Entscheidung und kein Nachtrag. |
| **R-5** | Der Wächter aus 6.2 hängt an einer 1-px-Schwelle und an `document`-weitem `scroll` mit `capture` | Gemessen von T-365, nicht von mir. Er ist die einzige Stelle, an der die Fläche eine eigene Mechanik statt einer Bibliotheksangabe hat. A14c/A14d sind dafür da. |

**Sicherheit:** keine neue Vertrauensgrenze. Das Papier ändert keine Adresse, keine Route, keinen
Öffnen-Weg. Die Tag-Fläche zeigt fremden Text (Tag-Namen, Ordnerpfade aus Add-in oder Fremdimport)
ausschließlich über `TagChip` — das steht als Auflage im Papier und ist von `proof:foreign` gemessen.

---

## Änderungen, die ich am Schwesterpapier für nötig halte — mit Abschnitt und Zeile

**Ich habe `todo-tabelle-fluss.md` nicht angefaßt** (T-374). Beim Nachziehen sind mir vier Stellen
aufgefallen; drei davon hatte T-374 beim Lesen des Standes schon in seiner eigenen
Berichtigungsliste (Z. 40–44), die vierte nicht:

| Stelle | Was | Steht bei T-374 schon an? |
|---|---|---|
| **Z. 789, TT-04** | steht noch auf „bei **960 px** … nicht waagerecht"; nach B-2 gehört dort 1280 hin. Meine A12 mißt das Gegenteil, solange TT-04 so steht. | ja (Z. 41) |
| **Z. 795/798, TT-07/TT-08** | fallen mit B-1. Solange TT-08 „dieselbe Zeilenhöhe bei 20 und 200 Zeichen" verlangt, widerspricht es 4.4 dieses Papiers zeichengleich. | ja (Z. 40) |
| **Z. 823, TT-18** | ist bereits auf „schließt" umgeschrieben; **was fehlt, ist der Fokusteil** aus B-5 („bei Tastatur Fokus zurück auf den Auslöser"). Meine A14b mißt ihn; ohne den Satz in TT-18 mißt sie etwas, das das Flußpapier nicht zusagt. | teilweise |
| **§13 zweiter Spiegelstrich / N-4 (F-8)** | **F-8 ist weiterhin unbeantwortet.** Meine 8.1 führt die Randmarkierung als Bauform mit Preis und sagt ausdrücklich, daß die Entscheidung T-361 gehört. Gebaut ist heute **keine**. Bleibt die Frage offen, steht eine vorhandene Regel (`components.css:825-843`) ohne Anweisung im Bestand. | **nein, soweit erkennbar** |

---

## Offene Fragen an den Orchestrator

1. **`role="dialog"` — ist die Entscheidung tragbar?** Ich habe sie gefällt, weil der Auftrag es
   verlangt. Sie kostet ein Wort im Vorlesefluß und rettet den ganzen Tastaturweg. Wer sie
   umdrehen will, dreht A-25.9 mit um.
2. **OF-5 (neu im Papier): das Erledigt-Kästchen in Spalte 1.** Drei strukturelle Unterscheidungen
   gegen eine Auswahl sind gebaut; eine vierte, **sichtbare** habe ich nicht erfunden — sie wäre
   neue Gestalt, A-25.9 nennt sie nicht, A-25.7 verbietet sie damit. Die Frage bleibt echt: Ein
   Fehlklick markiert ein Todo als erledigt. **Vorschlag:** visual-qa mißt am Bild, ob der Wortkopf
   reicht, **bevor** jemand eine Form erfindet.
3. **OF-6 (neu im Papier): „Erledigt, Erledigt" und „Tags, 11 Tags" im Tabellenmodus.** Ich nehme
   die Doppelung an und schreibe sie hin; den Auslösernamen auf die Zahl zu kürzen wäre schlechter,
   weil im Fokusmodus die Kopfzelle nicht zuverlässig mitgelesen wird. Wenn der spec-ux-reviewer das
   für einen Befund hält, soll er es jetzt sagen und nicht nach dem Bau.
4. **OF-1 bleibt offen** und ist die einzige unverändert offene Frage der ersten Fassung: War das
   Exportprotokoll als Tabellenvorbild mitgemeint? Es ist im Bestand keine Tabelle.

---

## Nächster Schritt

1. **spec-ux-reviewer** mißt dieses Papier gegen `todo-tabelle-fluss.md` in der Fassung nach T-374 —
   **zuerst an den vier Stellen oben**, weil dort die letzten beiden wechselseitigen Zusagen sitzen
   (TT-04 gegen A12, TT-18 gegen A14b).
2. **visual-qa** beantwortet OF-2 (`zen`, `lines`, `plainspace` an der Todo-Ansicht) und OF-5 (das
   Kästchen in Spalte 1) am Bild. Beides nimmt dieses Papier ausdrücklich nicht vorweg.
3. **e2e-tester** in der nächsten Welle: A10 bis A16 samt A14c/A14d und den acht Gegenproben; der
   Vorrat aus 9.4 in der berichtigten Fassung (mindestens ein Tag / mehr als die Fläche faßt / gar
   keine Tags).
4. **Orchestrator:** `TableShell` nach `shared/ui/` als eigener Auftrag in einer Welle ohne Nachbarn
   in `features/bookings` (10.4). Der Ankerwächter bleibt dabei örtlich.
