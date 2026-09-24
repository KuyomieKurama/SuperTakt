# T-181 — Der Textdurchgang: Streichung und Ausgleich in einem Zug

**Rolle:** frontend-dev **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/design/textbestand.md` (T-163 samt Nachtrag T-180),
`docs/design/textabbau-gestalt.md` (T-171), `.claude/team/reports/T-177-spec-ux-reviewer.md`
(Auflagen Z-01 bis Z-05, Z-07, Z-08), E-076, E-078 samt Nachtrag, E-080, E-081 in
`.claude/team/decisions.md`.

---

## Kurzfassung

```
Aufgabe: T-181 — Textdurchgang: ST-01 bis ST-05, ST-07, ST-09, ST-10, UM-03
Status: braucht Review
```

Umgesetzt sind **ST-01, ST-02, ST-03, ST-04, ST-05, ST-07, ST-09, ST-10 und UM-03**, jeweils
zusammen mit ihrem Ausgleich. Nicht angefaßt sind **ST-06, ST-08, UM-01, UM-02, UM-04, UM-05,
UM-06, UM-07, UM-08, die SP-09-Kürzung und Z-12** — sie sind von T-177 nicht freigegeben oder
gehören nicht in diesen Auftrag.

**Ein Nachweis ist rot, und er ist nicht meiner:** `apps/web/test/app/undoDone.test.ts` nagelt
`UNDONE_BODY` (ST-07) mit zwei Textvergleichen fest. Die Messung aus T-163 Abschnitt 1 („keiner
der Streichvorschläge ist durch einen Textvergleich festgenagelt") trifft für diesen einen Satz
**nicht** zu. Die Datei gehört unit-tester; ich habe sie nicht angefaßt (Einzelheiten in
Abschnitt 5).

---

## 1. Was gefallen ist — die Liste, Satz für Satz

### ST-01 — Acht Tooltips der Hauptnavigation (`app/Navigation.tsx`)

Das Feld `hint` in `NavItem` und das Attribut `title` in Zeile 80 sind entfallen. Acht Werte:

| Punkt | Gefallener Zusatz |
|---|---|
| Dashboard | „Überblick und schnelle Aktionen" |
| Todos | „Liste aller Todos mit Filtern" |
| Kanban | „Board aus frei definierbaren Regeln" |
| Zeiterfassung | „Timer, heutige Buchungen, Zeit von Hand erfassen" |
| Buchungen | „Alle Zeitbuchungen, filterbar" |
| Export | „Vorschau, Lauf und Protokoll" |
| Tags | „Tags, Ordner und Pools" |
| Einstellungen | „Export, Darstellung, Add-in" |

**Ausgleich:** keiner nötig, und das ist der Befund. Die acht Beschriftungen bleiben
zeichengleich; der zugängliche Name eines `<a>` mit Textinhalt **ist** der Textinhalt.
`getByRole("link", { name: "Todos" })` bleibt grün. Der Zusatz war zudem nach SC 1.4.13 kein
Träger: nicht mit der Tastatur erreichbar, nicht abweisbar, nicht überfahrbar.

### ST-02 — Drei Tooltips an den Bereichen des Exports (`screens/parts.tsx`)

Gefallen: „Auswahl, Vorschau und Lauf" · „Welche Felder in die Datei gehen" · „Wann welche
Buchung exportiert, zurückgesetzt oder nicht abgerechnet wurde". Das Feld `hint` und das
Attribut `title` in `ExportTabs` sind weg; `aria-current="page"` und die drei Beschriftungen
bleiben zeichengleich.

**Ausgleich:** keiner nötig. Der dritte Zusatz war die längste Fassung eines Satzes, der als
`lead` des Protokolls unverändert stehen bleibt.

### ST-03 — Fünf interne Kennungen im Oberflächentext

| Ort | Vorher | Nachher |
|---|---|---|
| `TagsScreen.tsx` `lead` | „… oder beides (E-054)." | „… oder beides." |
| `TagsScreen.tsx` Kartenbeschreibung | „… an beiden Stellen (E-054)." | gefallen mit ST-05 |
| `TodoDetailScreen.tsx` Kartenbeschreibung | „… und Exportstatus (E-055)." | „… und Exportstatus." |
| `lib/labels.ts` `POOL_EXPORT_NOT_BILLED_HINT` | „… „Nicht abgerechnet" (E-047) trägt …" | „… „Nicht abgerechnet" trägt …" |
| `ExportAuditScreen.tsx` | Karte „Wozu dieses Protokoll da ist" mit Beschreibung „Es ist die Maßnahme gegen R-10 — …" | Überschrift und Beschreibung entfallen; die Karte bleibt als **Fläche**, die Legende steht damit unmittelbar in der Ansicht |

**Ausgleich:** Bei `labels.ts` fällt die **Klammer**, nicht der Satz — SP-15 bleibt wörtlich
erhalten. Bei `ExportAuditScreen` ist die Legende (`.auditlegend`, drei Begriffe mit
Erläuterung) plus der Unveränderlichkeitsabsatz unverändert geblieben; nur die Karte trägt
keinen Titel und keine Beschreibung mehr. `<Card>` ohne `title` zeichnet weder `<header>` noch
`<h3>` (`Primitives.tsx:149`) — die Überschrift verschwindet aus dem
Zugänglichkeitsbaum, statt leer stehenzubleiben.

### ST-04 — Die dreifache Bereichsauskunft der Einstellungen

**1. `AREA_LEAD` ist vollständig entfallen** — sechs Sätze:

> „Wie Takt aussieht. Änderungen wirken sofort, ohne Speichern." ·
> „Wohin die Exportdatei geht, welche Vorlage sie füllt und wie gerundet wird." ·
> „Welche Tags jedes neu angelegte Todo mitbekommt — auf jedem Weg." ·
> „Welche Statuswerte es gibt, in welcher Reihenfolge und welcher an ein neues Todo kommt." ·
> „Das Token, mit dem sich das Outlook-Add-in beim lokalen Dienst ausweist." ·
> „Was der Dienst über diesen Arbeitsplatz meldet. Hier nicht änderbar."

Der Ansichtskopf trägt nur noch „Einstellungen". Der `SettingsArea`-Typ und `AREA_LIST` bleiben.

**2. Die sechs Schienenzusätze auf höchstens fünf Wörter:**

| Bereich | Vorher | Nachher |
|---|---|---|
| darstellung | „Farbmodus und Zeilendichte der Oberfläche" | „Farbmodus und Zeilendichte" |
| export | „Zielordner, aktive Vorlage und Rundung" | „Zielordner, Vorlage, Rundung" |
| standardtags | „Tags, die an jedes neue Todo kommen" | „Tags für jedes neue Todo" |
| status | „Die Statuswerte eines Todos — nicht die Spalten des Boards" | „Statuswerte eines Todos" |
| addin | „Der Zugang, mit dem sich das Add-in ausweist" | „Zugang des Add-ins" |
| arbeitsplatz | „Abrechnungsname, Ablageort und Sicherheitsmeldungen" | „Abrechnungsname, Ablageort, Meldungen" |

**3. Sieben Kartenbeschreibungen halbiert:**

| Karte | Nachher |
|---|---|
| Darstellung | „Wirkt sofort. Nichts zu speichern." |
| Export | „Vor jedem Lauf erneut geprüft." |
| Dieser Arbeitsplatz | „Meldet der Dienst. Hier nicht änderbar." |
| Standard-Tags | „Auch aus dem Add-in." |
| Outlook-Add-in | „Getrennt vom Zugang dieser Oberfläche." |
| Sicherheitsmeldungen | „Zählwerte und Zeitpunkte, keine Inhalte." |
| Status (`StatusSettings`) | **„Nicht die Spalten des Boards."** — siehe Z-01 unten |

**Ausgleich, und er ist strukturell:** Nach der Streichung ist der **Kartentitel** die
Überschrift des Bereichs, und die Schiene ist die einzige Fläche, die den gewählten Bereich
zeigt, bevor man ihn liest. Beides trägt bereits (`aria-current="page"`, Fläche, Kontur,
Textfarbe, dazu `?bereich=…` in der Adresse). Die Trennlinie in `.card__header` bleibt
ausdrücklich stehen — sie ist das Mittel, das die gestrichene Beschreibung ersetzt
(Gruppierung statt Satz, T-171 1.4).

**Nicht umgesetzt:** die Kontur-Vorgabe aus T-171 1.2 (`--accent-border-subtle` →
`--border-accent` am aktuellen Schieneneintrag). Sie steht in T-177 **nicht** unter den fünf
Auflagen und ist in meinem Auftrag nicht genannt. Als offene Frage geführt.

### ST-05 — Die Kanban-Aufklärung von elf Stellen auf zwei

Der größte Posten. Gefallen sind **vierzehn Sätze** an **neun** Stellen; **zwei** Stellen
bleiben, mit zwei verschiedenen Aufgaben.

**Was bleibt — genau zwei Stellen:**

| Stelle | Konstante | Aufgabe |
|---|---|---|
| `BoardScreen.tsx` `lead` des Boards | `RULE_WHAT_MOVES_A_CARD` | **Verhalten** — warum läßt sich nichts ziehen, warum ist die Karte weg |
| `BoardScreen.tsx` Einrichtungsdialog `description` | `RULE_IS_A_RULE` | **Definition** — was lege ich hier an |

Beide **ungekürzt**. `RULE_WHAT_MOVES_A_CARD` ist der einzige Ort, an dem Takt erklärt, warum
A-5.2 seit E-054 nicht mehr gilt (Bedingung aus T-177 Abschnitt 1.1).

**Was gefallen ist:**

| # | Ort | Gefallen |
|---|---|---|
| 1 | `BoardScreen.tsx` `lead` | `RULE_IS_A_RULE` als Vorspann vor `RULE_WHAT_MOVES_A_CARD` — 1 Satz |
| 2 | `BoardScreen.tsx` Einrichtungsdialog | „Dieselbe Entität wie ein Pool — was hier steht, ist eine Regel mit dem Anzeigeort „Board"." — 1 Satz |
| 3 | `BoardScreen.tsx` Board-Leerzustand | „Seit der Umstellung ist eine Spalte eine Regel — dieselbe Art Regel wie ein Pool, über Tags, Status, „Erledigt" und den Exportstatus." — 1 Satz. Was bleibt: „Sie richten die Spalten selbst ein. Takt erfindet keine." |
| 4 | `StatusSettings.tsx` Erklärkasten „Der Status ist nicht die Kanban-Spalte" | **vollständig** — 2 Absätze, 6 Sätze, dazu die zwei Navigationsknöpfe „Zum Kanban-Board" und „Zur Todo-Liste" |
| 5 | `TodoFormDialog.tsx` Statushinweis | „Der Status ist keine Kanban-Spalte — eine Spalte ist eine Regel, und der Status ist eine von fünf Bedingungen, die sie abfragen kann. Welche Statuswerte es gibt, legen Sie in den Einstellungen unter „Status" fest." — 2 Sätze, ersetzt durch den Wegweiser aus Z-02 |
| 6 | `TagsScreen.tsx` Kartenbeschreibung „Regeln" | „… über Tags, Status, „Erledigt" und den Exportstatus. Wo sie erscheint, sagt der Anzeigeort: im Pool-Bereich, als Spalte des Kanban-Boards oder an beiden Stellen (E-054)." → „Eine Regel bündelt Todos. Der Anzeigeort sagt, wo sie erscheint." — 2 Sätze auf 2 Halbsätze |
| 7 | `TagsScreen.tsx` Leerzustand „Noch keine Regel" | „Dieselbe Regel kann als Pool und als Kanban-Spalte dienen." plus die Definition; das **Beispiel** bleibt: „Etwa alles unter dem Ordner „Kunden" — oder alles Erledigte, das noch offen ist." |
| 8 | `PoolFormDialog.tsx` Erklärkasten „Nichts wird gespeichert außer der Regel" | **vollständig** — 4 Sätze |
| 9 | `lib/labels.ts` `RULE_NOT_A_PLACE` | Konstante **ersatzlos entfallen** samt ihrer Zeile im Kopfkommentar (Z-04, gemessen: kein Aufrufer im ganzen Baum) |

**Der Ausgleich, ohne den die Freigabe nicht gilt (Z-03, E-081 Punkt 4) — vier Stücke, alle in
diesem Auftrag:**

1. **`.kcolumn__head { border-bottom }` entfällt** (`components.css`). Der Spaltenkopf war in
   drei Bänder zerlegt — Name/Zahl, Regel, Karten. Name, Zahl und Regel bilden jetzt **einen**
   Block: die Identität der Spalte. Die verbleibende Linie unter `.kcolumn__rule` trennt
   Identität von Inhalt. Kein Abstand wurde vergrößert.
2. **`.rule-summary { color: var(--text-secondary); }`** statt `--text-muted`. Die Regelzeile
   ist die Definition der Spalte, nicht ihr Hilfetext. Größe (`--text-2xs`), Versalien der
   Achsenbeschriftung und die Chips bleiben unverändert.
3. **`StatusSettings` Kartenbeschreibung → „Nicht die Spalten des Boards."** (Z-01, wörtlich
   vorgelegt und angenommen). 30 Zeichen. In der **Karte** und nicht in der Schiene, weil
   `.settings-rail__hint` unter 60 rem ausgeblendet ist.
4. **Der Wegweiser (Z-02):** `hint="Die Werte stehen in den Einstellungen unter „Status"."` —
   52 Zeichen, eine Zeile bei 34 rem Dialogbreite, **kein `›`**, kein anklickbarer Verweis aus
   einem Dialog mit ungesicherten Eingaben heraus. Die Form ist die, die das Produkt an vier
   Stellen bereits schreibt.

**Was ich bei ST-05 ausdrücklich nicht angefaßt habe** (T-171 3.10, Teil der Auflage): kein
`line-clamp` und kein `text-overflow` an der Regelzeile; `.rule-summary__folder--empty` mit
Warndreieck, Kontur, Fläche und dem Wort „kein Tag darin" unverändert; der `aria-label` der
Spalte bekommt die Regel **nicht** dazu (er bleibt „Spalte X, N Karten, davon M erledigt");
kein Greifzeiger, kein Griffsymbol, kein Ziehschatten.

### ST-07 — Sätze, die ihren eigenen Titel wiederholen

| Ort | Vorher | Nachher |
|---|---|---|
| `app/undoDone.ts` `UNDONE_BODY` | „Das Abhaken ist zurückgenommen. Tags und Status ändern sich dadurch nicht." | „Tags und Status ändern sich dadurch nicht." |
| `components/Attachments.tsx` Toast-Rumpf | „Entfernen lässt er sich jederzeit über das Papierkorbsymbol in der Zeile." | „Entfernen über das Papierkorbsymbol in der Zeile." |
| `TodoListScreen.tsx` Toast-Rumpf | „Es verschwindet damit aus dieser Liste, solange erledigte ausgeblendet sind. Der Status bleibt unverändert." | „Aus dieser Liste ausgeblendet. Der Status bleibt unverändert." |
| `TemplatePreview.tsx` (4 Fassungen) | drei Fassungen im Banner plus die Kartenbeschreibung | **eine** Fassung als `PREVIEW_SOURCE`: „Vom selben Renderer wie die Exportdatei, an Ihren offenen Buchungen." Die Kartenbeschreibung `TemplatePreviewCard` entfällt |
| `ExportScreen.tsx` „Export abgeschlossen" | „Datei geschrieben und jede enthaltene Buchung markiert — in einer Transaktion." | „In einer Transaktion geschrieben." |
| `ExportScreen.tsx` „Letzte Exportläufe" | „Was wann geschrieben wurde. Welche Buchungen darin waren, steht im Protokoll — dort wirkt der Lauffilter über die geladenen Zeilen, ältere Läufe brauchen deshalb ein „Weitere laden"." | „Was wann geschrieben wurde." |

**Ausgleich, je Stelle:**

- `undoDone`: „Das Abhaken ist zurückgenommen." steht im **Titel** derselben Meldung.
- `TemplatePreview`: Der Zustandszusatz ist geblieben und ist die **Abwesenheit**: „Noch nicht
  gespeicherter Entwurf." / „Geänderter Stand, noch nicht gespeichert — die Vorschau speichert
  nichts." Ich habe „Gespeichert wird dabei nichts" **nicht** fallenlassen: Sie ist nach dem
  Raster **A**, und T-163 nennt sie nicht.
- `ExportScreen` „Export abgeschlossen": Die vollständige Fassung steht als **Folge** im
  Bestätigungsdialog davor (SP-17, unverändert geprüft: `ExportScreen.tsx:1050`).
- `ExportScreen` „Letzte Exportläufe": Wie der Lauffilter wirkt, steht unverändert am Knopf
  „Buchungen dieses Laufs" (Titelattribut, **nicht** angefaßt) und im Leerzustand des
  Protokolls (`ExportAuditScreen`, **nicht** angefaßt — das ist ST-06 und nicht freigegeben).

### ST-09 — Anrede, Rechtschreibung, doppelte Marken

| Ort | Vorher | Nachher |
|---|---|---|
| `NoteField.tsx` `defaultPlaceholder` (internal) | „Nur für Sie. Gedanken, Zwischenstände, Ansprechpartner …" | „Gedanken, Zwischenstände, Ansprechpartner …" |
| `TodoDetailScreen.tsx` Platzhalterüberschreibung | „Notiz für Sie selbst — Zugangsdaten, Ansprechpartner, Zwischenstand." | entfällt; das Feld nimmt den Vorgabewert aus `NoteField` |
| `TodoFormDialog.tsx` Platzhalterüberschreibung | derselbe Satz, **zweite** Fundstelle | entfällt, gleiche Begründung |
| `Primitives.tsx` `IconButton` | `label="Meldung schliessen"` | `label="Meldung schließen"` |
| `Tag.tsx` Marke „neu" | `title="Dieses Tag wird beim Speichern angelegt"` **und** `visually-hidden` „wird neu angelegt" | `title` entfällt, der `visually-hidden`-Text bleibt zeichengleich |
| `Tag.tsx` Marke „S" | `title="Standard-Tag"` **und** `visually-hidden` „Standard-Tag" | `title` entfällt |

**Ausgleich:** Die Grenze der internen Notiz steht unverändert im Banner „Bleibt in Takt", in
der Marke „Wird nicht exportiert" und im `help` — alle drei sind **SP-09** und wurden nicht
angefaßt. An den Tag-Marken bleibt der zugängliche Text zeichengleich; auf einem `<span>` war
`title` ohnehin kein zugänglicher Träger.

**Abweichung, ausdrücklich gemeldet:** Die Platzhalterüberschreibung stand an **zwei** Stellen,
nicht an einer. T-163 zählte nur `TodoDetailScreen`. Ich habe beide entfernt, weil die
Begründung („zwei Anreden und zwei Wortlaute für dasselbe Feld") an beiden identisch ist und
eine stehengelassene zweite Fassung genau den Zustand wiederherstellt, den ST-09 beseitigt.

**Vertragsberührung:** `Primitives.tsx` `label="Meldung schließen"` ist ein **zugänglicher
Name** (E-076 Punkt 3). Gemessen kommt der Wert weder in `tests/e2e` noch in `apps/web/test`
vor; unit-tester und e2e-tester ziehen in der nächsten Welle nach.

### ST-10 — Zwei Ansichtsköpfe ohne `lead`

| Ansicht | Gefallener Satz |
|---|---|
| `DashboardScreen.tsx` | „Was läuft, was heute erfasst wurde, was noch nicht abgerechnet ist." |
| `TimeScreen.tsx` | „Timer starten und stoppen, heutige Buchungen ansehen, Zeit von Hand nachtragen." |

**Ausgleich — die eine Vorgabe aus T-171 2.1, umgesetzt:** `ScreenHeader` setzt jetzt
`.screen__headline--bare`, wenn kein `lead` übergeben wird; die Klasse zentriert die Kopfzeile
senkrecht (`app.css`). Ohne sie stünde die 36-px-Primäraktion des Dashboards an der Oberkante
einer 29-px-Titelzeile und säße sichtbar zu hoch. Mit `lead` bleibt es bei `flex-start`.

- **Neue Klasse, keine bestehende geändert.** Sie trägt keine Farbe, also kein neues
  Kontrastpaar.
- **Keine Rolle und kein zugänglicher Name berührt:** `ScreenHeader` zeichnet weiterhin
  `<header class="screen__header">` mit `<h1 class="screen__title">`.
- Die Klasse greift zugleich in **`SettingsScreen`**, das seinen `lead` mit ST-04 verloren hat.

Was bei `TimeScreen` bleibt: `Card title="Timer" description="Es läuft höchstens einer."` — eine
Abwesenheit von 22 Zeichen, ausdrücklich nicht angefaßt.

### UM-03 — Die Kanban-Abgrenzung erscheint nur noch am Board

Umgesetzt als **Streichung plus Kette**, nicht als Neubau. Die drei Auflagen aus Z-07:

1. **Die Kette ist gebaut und geprüft.** Der Board-Leerzustand trägt als Primäraktion „Erste
   Spalte einrichten" (`BoardScreen.tsx:992`), und dieser Knopf öffnet den Einrichtungsdialog,
   dessen `description` `RULE_IS_A_RULE` ist. Die Definition ist vom leeren Board **einen
   Klick** entfernt, an der Stelle, an der sie gebraucht wird.
2. **Die Einstellungen bekommen keinen Ersatzkasten** — weder kleiner noch anders getönt. Was
   dort bleibt, sind die 30 Zeichen aus Z-01, und sie sind der einzige Rest. Die CSS-Regel
   `.status-admin__links`, die nur die zwei Navigationsknöpfe des gefallenen Kastens trug, ist
   mitentfallen.
3. **Der dritte Träger (T3) existiert:** `docs/benutzerhandbuch.md:221`. Er gehört documenter;
   ich habe ihn nicht angefaßt.

---

## 2. Was ausdrücklich **nicht** gefallen ist

**Die 21 Sätze der Sperrliste — alle geprüft und unverändert.** Namentlich nachgesehen und
unberührt: SP-01/SP-02 (`AttachmentOpenDialog`), SP-03 (`TodoListScreen` Fristhinweis), SP-04
(`TodoFormDialog` Fristhinweis — steht unmittelbar über dem geänderten Statushinweis und ist
zeichengleich geblieben), SP-05, SP-06, SP-07, SP-08, SP-09 (Banner, Marke und `help` beider
Feldarten in `NoteField` — nur der **Platzhalter** ist gekürzt, kein Wort des `help`), SP-10,
SP-11, SP-12, SP-13, SP-14, SP-15 (nur die Klammer „(E-047)" gefallen), SP-16, SP-17
(`ExportScreen.tsx:1050`, wörtlich geprüft), SP-18, SP-19, SP-20, SP-21.

**Der sichtbare Begleittext an gesperrten Status.** `status-admin__blocked` (`:565-596`) steht
unverändert: sichtbarer Text, alle zutreffenden Gründe, Schloßsymbol, der Knopf „Diese N Todos
anzeigen" **innerhalb** der Fläche, im DOM **vor** dem Löschknopf. Der Löschknopf behält
`disabled`, `aria-describedby={reasonId}` und den Namen „…löschen — derzeit nicht möglich"
(`:669-671`). Mein Eingriff in dieser Datei lag über 250 Zeilen darüber und hat die
Reihenfolge nicht verschoben.

**Die acht Pflichtfeldmeldungen aus T-175** — nicht angefaßt.

**Nicht freigegeben und deshalb unberührt:** ST-06 (alle acht Zeilen, darunter
`TodoListScreen` `HiddenDoneNotice`, das den Pflichtfluß „Timer auf erledigtem Todo" berührt),
ST-08 (auch der Kasten „Zwei Dinge, bevor Sie etwas ändern", `StatusSettings.tsx:368` — er
steht unverändert), UM-01, UM-02, UM-04, UM-05, UM-06, UM-07, UM-08 (die Karte „Was sich
geändert hat" steht unverändert), die SP-09-Kürzung, Z-12 (Kartentitel „Dieser Arbeitsplatz").

---

## 3. Die Musterseite (Z-05)

`showcase/BoardSection.tsx` benutzt `KanbanColumn` und `RuleSummary` aus dem Produktbestand und
`components.css`; `showcase.css` überschreibt weder `.kcolumn__head` noch `.rule-summary`. Die
neue Gestalt aus T-171 3.2 und 3.3 zeigt sich damit **von selbst** — gemessen an einem
gebauten Musterseiten-Bündel (siehe Abschnitt 4). Die Importe von `RULE_IS_A_RULE` und
`RULE_WHAT_MOVES_A_CARD` bleiben gültig, weil beide Konstanten bleiben; die
Prüfdokumentation daneben ist **nicht** gekürzt (E-078 gilt dort nicht).

Gegenprobe über den ganzen Musterseitenbaum: Keiner der von mir gestrichenen Produktsätze wird
dort wörtlich zitiert.

---

## 4. Nachweise

| Lauf | Ergebnis |
|---|---|
| `tsc -p tsconfig.json --noEmit` | **0** |
| `tsc -p apps/web/tsconfig.json --noEmit` | **0** |
| `tsc -p apps/web/tsconfig.test.json --noEmit` | **0** |
| `tsc -p tests/e2e/tsconfig.json --noEmit` | **0** |
| `pnpm --filter @takt/web build` | grün, 418 Module |
| `pnpm run contrast` | **0 von 480 Paaren durchgefallen** (vorher 476; vier neu, siehe unten) |
| `pnpm run proof:foreign` | 14 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |
| `pnpm run boundaries` | grün |
| `pnpm run proof:conflicts` | 149 bestanden, 0 fehlgeschlagen |
| `pnpm test` | **1435 bestanden, 2 fehlgeschlagen** — beide in `apps/web/test/app/undoDone.test.ts`, siehe Abschnitt 5 |

`pnpm run proof:all` und `pnpm test:e2e` sind nach E-083 Punkt 3 nicht gefahren.

**`pnpm typecheck` als Ganzes ist rot, aber nicht an meiner Fläche:**
`apps/outlook-addin/src/ui/TaskPane.tsx(43,3): error TS6133: 'CALL_NUMBER_BY_HAND' is declared
but its value is never read.` Das ist integration-dev, der in derselben Welle in dieser Datei
arbeitet. Alle sieben Teilprojekte einzeln geprüft; nur dieses eine meldet.

**Die vier neuen Kontrastpaare** (zwei Werte × zwei Themen), eingetragen unter eigenem Namen,
weil eine Zusage aus der Gleichheit zweier Tokenwerte nur so lange hält wie die Gleichheit:

```
--text-secondary auf --bg-subtle   min 4.5  Regelzeile im Spaltenkopf
--text-secondary auf --bg-surface  min 4.5  Regelzeile in der Regelliste und in der Formularvorschau
```

Das alte Paar `--text-muted auf --bg-subtle` bleibt eingetragen — es trägt jetzt den Zusatz
„kein Tag darin" (`.rule-summary__folder-note`) statt der Regelzeile; die Notiz sagt das.

**Sichtprüfung.** Ich habe die Musterseite gegen ein eigenes Bündel gebaut und den Spaltenkopf
bei dreifacher Auflösung aufgenommen: Name, Zahl, `+`, Menü und die Regelzeile
(„MINDESTENS EINES VON · Kunden / Nord mit Unterordnern") stehen jetzt in **einem** Block, die
Linie darunter trennt sie von den Karten, und die Regelzeile liest sich als Inhalt statt als
Fußnote. Das Bündel und das Skript sind wieder entfernt. **Das ersetzt `visual-qa` nicht** —
die Ansichten des Produkts (Einstellungen ohne `lead`, Dashboard mit `.screen__headline--bare`,
`StatusSettings` ohne Erklärkasten, `PoolFormDialog` ohne Schlußkasten) brauchen den laufenden
Dienst und damit den festen Port.

---

## 5. Der eine rote Prüffall — und warum ich ihn nicht angefaßt habe

```
FAIL apps/web/test/app/undoDone.test.ts
  expected 'Tags und Status ändern sich dadurch nicht.'
        to be 'Das Abhaken ist zurückgenommen. Tags und Status ändern sich dadurch nicht.'
  (Zeile 136 und Zeile 155)
```

`UNDONE_BODY` aus ST-07 **ist** durch einen Textvergleich festgenagelt. T-163 Abschnitt 1 sagt
das Gegenteil („Von den Sätzen, die in Abschnitt 7 zum Streichen vorgeschlagen sind, ist
**keiner** in `tests/e2e` oder `apps/web/test` durch einen Textvergleich festgenagelt"). Für
diesen einen Satz trifft die Messung nicht zu.

`apps/*/test/**` gehört unit-tester. Ich melde den Bruch, statt den Prüffall anzupassen.

**Gegenprobe über jede von mir geänderte oder gestrichene Zeichenkette** — die acht aus ST-01,
die drei aus ST-02, die fünf aus ST-03, die neunzehn aus ST-04, die neun Stellen aus ST-05, die
sechs aus ST-07, die sechs aus ST-09 und die zwei aus ST-10, dazu die beiden neuen Wortlaute aus
Z-01 und Z-02: Das oben ist der **einzige** Bruch. Namentlich geprüft und **nicht** betroffen:
`tests/e2e/tag-input.spec.ts` (greift `getByRole('combobox', { name: 'Standard-Tags' })` — eine
Feldbeschriftung, nicht die Chip-Marke) und
`tests/e2e/export-mixed-status-and-billing.spec.ts:128` („Ohne Begründung ausgebucht. Das Feld
ist freiwillig (E-047)" steht in `components/ExportAudit.tsx` und gehört **nicht** zu den fünf
Kennungen aus ST-03 — die Datei ist unverändert). In `tests/e2e` gibt es keinen einzigen
Zugriff über `getByTitle` oder einen `[title=…]`-Wähler; die vier entfernten Titelattribute
(ST-01, ST-02, ST-09) brechen dort nichts.

---

## Artefakte

```
apps/web/scripts/contrast-check.mjs
apps/web/src/app/Navigation.tsx
apps/web/src/app/undoDone.ts
apps/web/src/components/Attachments.tsx
apps/web/src/components/NoteField.tsx
apps/web/src/components/Primitives.tsx
apps/web/src/components/Tag.tsx
apps/web/src/lib/labels.ts
apps/web/src/screens/BoardScreen.tsx
apps/web/src/screens/DashboardScreen.tsx
apps/web/src/screens/ExportAuditScreen.tsx
apps/web/src/screens/ExportScreen.tsx
apps/web/src/screens/PoolFormDialog.tsx
apps/web/src/screens/SettingsScreen.tsx
apps/web/src/screens/StatusSettings.tsx
apps/web/src/screens/TagsScreen.tsx
apps/web/src/screens/TemplatePreview.tsx
apps/web/src/screens/TimeScreen.tsx
apps/web/src/screens/TodoDetailScreen.tsx
apps/web/src/screens/TodoFormDialog.tsx
apps/web/src/screens/TodoListScreen.tsx
apps/web/src/screens/parts.tsx
apps/web/src/styles/app.css
apps/web/src/styles/components.css
```

## Annahmen

1. **Die Platzhalterüberschreibung stand zweimal, und ich habe beide entfernt.** T-163 nennt
   nur `TodoDetailScreen`. Eine stehengelassene zweite Fassung stellte den Zustand wieder her,
   den ST-09 beseitigt.
2. **„Gespeichert wird dabei nichts" bleibt in `TemplatePreview`.** ST-07 verlangt eine Fassung
   des Renderer-Satzes und läßt die Unterscheidung „gespeichert / Entwurf" als eigenen kurzen
   Zusatz stehen. Die Aussage, daß die Vorschau nichts speichert, ist nach dem Raster **A** und
   wird von T-163 nicht als Streichkandidat genannt.
3. **`<Card>` ohne `title` statt gar keiner Karte** in `ExportAuditScreen`. „Die Legende bleibt
   und wird direkt in die Ansicht gesetzt" habe ich als „ohne Überschrift und ohne
   Beschreibung" gelesen, nicht als „ohne Fläche" — sonst stünde die Definitionsliste ohne
   Untergrund im Seitenfluß, und der Zugänglichkeitsbaum bekäme eine Region ohne Namen.
4. **Der Titeltooltip an „Buchungen dieses Laufs" bleibt.** ST-07 begründet die Kürzung von
   „Letzte Exportläufe" mit einer Verdopplung **zu** diesem Tooltip. Ihn in derselben Welle
   mitzunehmen machte aus der Kürzung eine Streichung ohne Ersatz — er steht auf keiner
   freigegebenen Liste.
5. **Die Kontur-Vorgabe aus T-171 1.2 habe ich nicht umgesetzt** (siehe offene Frage 1).

## Risiken

1. **Zwei rote Prüffälle bis zur nächsten Welle.** `apps/web/test/app/undoDone.test.ts` ist rot,
   bis unit-tester nachzieht. Das Tor ist damit rot; das ist die vorhersehbare Folge davon, daß
   Text und Erwartung in derselben Welle nicht dieselbe Hand haben dürfen.
2. **Ein zugänglicher Name hat sich geändert** (`Meldung schliessen` → `Meldung schließen`).
   Gemessen ohne Prüffall, aber E-076 Punkt 3 ist berührt. Wer künftig einen Prüffall dazu
   schreibt, schreibt ihn gegen die neue Fassung.
3. **`.screen__headline--bare` ist eine neue Klasse.** Sie trägt keine Farbe und kein neues
   Token, aber sie ist ein neuer Zustand einer Fläche, die elf Ansichten benutzen. Getroffen
   sind heute drei: Dashboard, Zeiterfassung, Einstellungen. Bei den übrigen acht ändert sich
   nichts, weil sie einen `lead` tragen.
4. **Die Aufklärung steht jetzt an zwei Stellen statt an elf.** Fällt eine davon — der Knopf
   „Erste Spalte einrichten" aus dem Board-Leerzustand oder `RULE_IS_A_RULE` aus dem
   Einrichtungsdialog —, ist UM-03 zurückgenommen (Z-07 Punkt 1). Das ist eine Bedingung, die
   heute erfüllt ist und in Zukunft leicht unbemerkt bricht. Ein Prüffall darauf wäre die
   billigste Absicherung dieses ganzen Durchgangs.
5. **Sicherheitlich unauffällig.** Kein Satz aus SP-01, SP-02, SP-10, SP-13, SP-14 oder SP-17
   ist berührt; keine Absage, keine Rückfrage und keine Pfadangabe ist gekürzt worden.

## Offene Fragen

> **Beide Fragen sind vom Orchestrator entschieden und in diesem Auftrag gebaut. Siehe
> Abschnitt 6.** Antwort auf 1: ja, umsetzen — der Ausgleich gehört zu ST-04, nicht zu ST-05,
> und deshalb steht er nicht unter den fünf Auflagen von T-177. Antwort auf 2: ja, ich; der
> Prüffall läuft getrennt als O-EY. Die beiden Absätze bleiben hier stehen, damit die Frage
> nachlesbar ist, die zur Entscheidung geführt hat.

1. **An den Orchestrator: die Kontur des aktuellen Schieneneintrags.** T-171 1.2 gibt als
   Vorgabe `.settings-rail__item--current { border-color: var(--border-accent); }` statt
   `--accent-border-subtle` — mit der Begründung, daß die Schiene nach ST-04 die einzige Fläche
   ist, die den gewählten Bereich zeigt. T-177 nennt diese Vorgabe unter den fünf Auflagen zu
   ST-05 **nicht**, und mein Auftrag nennt sie nicht. Ich habe sie deshalb **nicht** umgesetzt.
   Sie gehört sachlich zu ST-04 und braucht ein Wort: umsetzen oder ausdrücklich fallenlassen.
2. **An den Orchestrator: Z-12.** Der Kartentitel „Dieser Arbeitsplatz" → „Arbeitsplatz" ist von
   T-177 entschieden, steht aber weder in meiner Aufgabenliste noch unter den ST-Einträgen; der
   Bericht weist ihn unit-tester und e2e-tester zu. Er ist ein `Card.title` und damit
   vertraglich — jemand muß ihn ändern, und es ist nicht klar, wer.
3. **An unit-tester:** `apps/web/test/app/undoDone.test.ts:136` und `:155`. Neue Erwartung:
   `"Tags und Status ändern sich dadurch nicht."` beziehungsweise
   `` `Tags und Status ändern sich dadurch nicht. ${reopenSentence}` ``.
4. **An visual-qa:** Die vier Flächen, die ich statisch nicht prüfen konnte, sind Einstellungen
   (Kopf ohne `lead`, Schiene mit gekürzten Zusätzen), Dashboard und Zeiterfassung
   (`.screen__headline--bare` — sitzt die Primäraktion des Dashboards jetzt richtig?),
   `StatusSettings` (Karte ohne Erklärkasten: reicht die Verneinung von 30 Zeichen?) und
   `PoolFormDialog` (die Vorschau „Diese Regel trifft" ist jetzt das letzte Element vor der
   Fußzeile).

## Nächster Schritt

1. **unit-tester** zieht `undoDone.test.ts` nach (offene Frage 3) — das ist die einzige rote
   Stelle des Tors.
2. **e2e-tester** prüft die vier entfernten Titelattribute und `Meldung schließen` gegen seine
   286 `getByRole`-Zugriffe und legt einen Prüffall auf die Kette aus Z-07 Punkt 1 an
   (Board-Leerzustand → „Erste Spalte einrichten" → Dialog mit `RULE_IS_A_RULE`).
3. **visual-qa** prüft die vier Flächen aus offener Frage 4 gegen die laufende Oberfläche.
4. **Orchestrator** entscheidet offene Frage 1 und 2.

---

## 6. Nachtrag — die beiden entschiedenen offenen Fragen, nachgebaut

Der Orchestrator hat beide offenen Fragen aus Abschnitt „Offene Fragen" noch in diesen Auftrag
zurückgegeben, mit der Begründung aus E-081 Punkt 4: Beide sind **Ausgleich** zu etwas, das in
diesem Zug gestrichen wurde, und ein Ausgleich in der nächsten Welle ist keiner.

### 6.1 Frage 1 — die Kontur des aktuellen Schieneneintrags (Ausgleich für ST-04)

`apps/web/src/styles/app.css`:

```
.settings-rail__item--current { border-color: var(--border-accent); }   /* statt --accent-border-subtle */
```

Ein Wert, eine Zeile, keine neue Klasse, kein neues Token. Fläche
(`--accent-bg-subtle`), Textfarbe (`--accent-text`) und `aria-current="page"` bleiben
unverändert.

**Warum es der Ausgleich für ST-04 ist und nicht Kosmetik:** Mit dem Wegfall von `AREA_LEAD` ist
die Schiene die einzige Fläche, die den gewählten Bereich zeigt, **bevor** man den Kartentitel
liest. Der aktuelle Eintrag unterschied sich an drei Merkmalen, und alle drei sind Farbe; die
Kontur trug dabei den schwächsten Akzentwert der Palette.

**Kein Balken an der Startkante, keine Verschiebung, kein Symbolwechsel** — bei 60 rem und
schmaler kippt die Schiene in eine umbrechende Zeile; ein Balken wäre dort falsch orientiert,
eine Kontur trägt in beiden Ausrichtungen.

**Kontrast, gemessen statt zugesichert.** Das Paar stand seit T-175 unter eigenem Namen in
`contrast-check.mjs` (`Einstellungsschiene`, `--border-accent` auf `--accent-bg-subtle`,
Mindestwert 3:1 nach SC 1.4.11). Es mißt jetzt **5,42:1 hell** und **4,76:1 dunkel** — vorher
war die Zusage dort für einen Wert eingetragen, den die Klasse gar nicht mehr benutzte. Nach
diesem Zug prüft der Lauf dasselbe, was die Klasse tut.

**Die Zahl bleibt bei 480 Paaren, 0 durchgefallen.** Kein Paar kam hinzu und keines fiel weg —
die Kontur wechselt den Wert innerhalb eines bereits gemessenen Paares.

### 6.2 Frage 2 — Z-12, der Kartentitel

| Ort | Vorher | Nachher |
|---|---|---|
| `SettingsScreen.tsx` `WorkstationFacts` | `Card title="Dieser Arbeitsplatz"` | `Card title="Arbeitsplatz"` |
| `showcase/WorkstationSection.tsx` | `Card title="Dieser Arbeitsplatz (S-09)"` | `Card title="Arbeitsplatz (S-09)"` |

Die Musterseite ist mitgezogen — sie sagt über dieser Karte ausdrücklich „So steht die Karte in
den Einstellungen"; bliebe sie stehen, zeigte sie ein Produkt, das es nicht mehr gibt (dieselbe
Begründung wie Z-05).

**Das ist ein zugänglicher Name** (`Card.title`, E-076 Punkt 3). Gegenprobe über `tests/e2e` und
`apps/web/test`: **keine** Fundstelle für „Dieser Arbeitsplatz". Genau deshalb hat der Prüfer
ihn benannt — eine stille Rücknahme fiele niemandem auf. Der Prüffall dazu läuft getrennt
(O-EY). Nach dem Zug gibt es im ganzen Baum keine Fundstelle mehr außer meinem
Begründungskommentar in `SettingsScreen.tsx`.

Was „Dieser" trug — daß es um **diesen** Rechner geht —, sagen nach ST-04 die
Kartenbeschreibung „Meldet der Dienst. Hier nicht änderbar." und die zwei Werte selbst
(Windows-Benutzername, Ablageort). Die Schiene heißt unverändert „Arbeitsplatz" und trägt
`aria-current="page"`; damit ist der Bereich ab jetzt an beiden Stellen gleich benannt.

### 6.3 Nachweise nach dem Nachtrag

| Lauf | Ergebnis |
|---|---|
| `tsc -p tsconfig.json --noEmit` | **0** |
| `tsc -p apps/web/tsconfig.json --noEmit` | **0** |
| `tsc -p apps/web/tsconfig.test.json --noEmit` | **0** |
| `tsc -p tests/e2e/tsconfig.json --noEmit` | **0** |
| `pnpm --filter @takt/web build` | grün |
| `pnpm run contrast` | **0 von 480 Paaren durchgefallen** — unverändert; `Einstellungsschiene` mißt 5,42:1 hell und 4,76:1 dunkel gegen 3:1 |
| `pnpm run proof:foreign` | 14 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |
| `pnpm test` | **1435 bestanden, 2 fehlgeschlagen** — unverändert dieselben zwei aus `undoDone.test.ts`; der Nachtrag hat keinen weiteren Prüffall gebrochen |

`proof:all` und `test:e2e` weiterhin nicht gefahren (E-083 Punkt 3).

**Sichtprüfung der Schiene.** Ich habe die sechs Einträge mit der gebauten Produkt-CSS und der
Markup-Struktur aus `SettingsScreen.tsx` gerendert und in hell, dunkel und **mit Tastaturfokus**
aufgenommen. Drei Befunde:

1. Der aktuelle Eintrag ist jetzt ohne Vergleichseintrag daneben als „hier bin ich" lesbar; die
   Kontur trägt die Aussage auch dort, wo die Tönung im dunklen Modus fast verschwindet.
2. **Der Fokusring bleibt unterscheidbar.** Das war das eigentliche Risiko dieser Änderung: eine
   kräftigere Zustandskontur kann einen Fokusring schlucken. Gemessen tut sie es nicht — der
   Ring liegt als zweite, dickere Umrandung sichtbar außerhalb der Kontur.
3. Fünf der sechs gekürzten Schienenzusätze stehen bei der Mindestbreite der Schiene (13 rem)
   auf **einer** Zeile; „Abrechnungsname, Ablageort, Meldungen" bricht auf zwei. Vorher brach er
   auf drei. Das ist eine Verbesserung, keine Regression, und keine Auskunft geht verloren — der
   Zusatz ist ohnehin unter 60 rem ganz ausgeblendet und deshalb kein Auskunftsträger.

Die Sichtprüfung ist an einer nachgebauten Markup-Probe entstanden, nicht an der laufenden
React-Anwendung. Sie belegt die **CSS-Änderung**, nicht das Zusammenspiel der Ansicht; letzteres
bleibt bei visual-qa (offene Frage 4). Probe und Bündel sind wieder entfernt.
