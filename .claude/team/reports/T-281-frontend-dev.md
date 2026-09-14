# T-281 — Die Kanban-Karte bricht, sobald sie drei Marken trägt

**Aufgabe:** T-281 — Kopfzeile der Kanban-Karte mit drei Marken in schmaler Spalte
**Status:** braucht Review
**Rolle:** frontend-dev
**Datum:** 2026-09-11
**Baum:** `main`, Stand `f6f4d6d` (PR #17)

## Artefakte

| Datei | Was |
|---|---|
| `apps/web/src/styles/components.css` | `.kcard__top` bricht um: `flex-wrap: wrap`, getrennte Spalten- und Zeilenlücke |
| `apps/web/src/styles/app.css` | `.kcard__deadline` ist auf der Karte schrumpf- und faltfähig: `flex: 0 1 auto`, `flex-wrap: wrap` |
| `apps/web/test/features/board/kanbanCardHeader.test.ts` | **neu** — 9 Prüfsätze, davon 4 Gegenproben; hält die Regeln, aus denen die Messung folgt |

Kein TSX geändert, kein Oberflächentext geändert, nichts verschoben. Die Frist bleibt die dritte
Marke der Kopfzeile.

## Der Befund — nachgemessen, nicht geglaubt

Die Vermutung des Auftrags stimmt in der Sache und war in einem Punkt zu eng: **`.kcard__deadline`
hat sehr wohl eine Regel**, sie steht nur nicht in `components.css`, sondern in
`app.css:2152`. Sie lautete `max-width: 100%` — und war wirkungslos, weil
`.deadline` (app.css:2065) auf `flex: none` steht. Ein Flex-Element mit Schrumpffaktor 0 schrumpft
auch unter einer Maximalbreite nicht; sein Inhalt läuft heraus. Zusammen mit dem fehlenden
`flex-wrap` an `.kcard__top` ergibt das genau den gemeldeten Schaden. Die Ursache ist also
**zweiteilig**, und eine der beiden Hälften allein hätte den Fall nicht behoben.

Gemessen in Chromium (Playwright, echtes Vite, `designsystem.html` — dieselben Bausteine
`KanbanCard`/`.board`/`.kcolumn` und dieselben Stilblätter wie S-04):

| Fall | vorher | nachher |
|---|---|---|
| Spalte 272 px (schmalste, die `.board` zuläßt: `minmax(17rem, 21rem)`) | Frist ragt aus `.kcard__main` **und** liegt über `.kcard__actions` | sauber |
| Spalte 330 px (Breite aus dem Bildschirmfoto) | dieselbe Überlappung, sobald die Marken breit genug sind | sauber |
| **Schwelle**, Gestaltung „classic" | Überlauf ab **308 px** Spaltenbreite abwärts | **nie**, bis hinunter zu 240 px |
| **Schwelle**, Gestaltung mit größeren Marken (`--text-2xs: 0.75rem`) | Überlauf ab **324 px** abwärts | **nie**, bis 240 px |
| 20 Gestaltungen × hell/dunkel × zwei Dichten, Spalte 272 px | **80 von 80 Kombinationen mit Befund** | **0 von 80** |
| Belastungsprobe: Spalte 240 px (unter der Vorgabe) + Call-Nummer `CALL-2026-0388-NACHTRAG-SAMMELRECHNUNG` | — | sauber, dreizeilige Kopfzeile, nichts abgeschnitten |

Der zulässige Bereich der Spalte ist 272 bis 336 px. Der Fehler lag also **im Regelbereich** und
bei der Mindestbreite **immer** vor — nicht in einem Randfall.

**Zwei Nebenbefunde, die im Bild mitlaufen und mit derselben Regel fallen:**

1. Auf dem echten Board-Bildschirm hat die Spalte zusätzlich `overflow: hidden`
   (`viewport-layout.css:77`). Der Überlauf wurde dort am Spaltenrand **abgeschnitten** — im
   Bildschirmfoto des Auftraggebers endet die Marke deshalb als „⚠ Überfällig 22.07": Der Rest
   des Datums liegt unter der Abspieltaste. Ich habe diese Geometrie nachgestellt und vorher wie
   nachher gemessen (vorher: Überlappung bei 272 px; nachher: sauber bei 272 **und** 336 px).
2. Ohne Umbruch mußte die Call-Nummer schrumpfen und brach an ihren Bindestrichen in **drei
   Zeilen** („CALL−/2026−/0388"). Die Kopfzeile war dadurch 49,5 px hoch. Mit Umbruch steht die
   Nummer wieder in einer Zeile, die Kopfzeile ist 41 px hoch — die Karte wird durch die Behebung
   **kürzer**, nicht länger.

## Die Lösung und warum diese

`.kcard__top` bricht um; die Frist rutscht in eine zweite Zeile derselben Kopfzeile, wenn sie
neben Call-Nummer und Erledigt-Kennzeichen nicht mehr paßt.

Drei Gründe, die die Wahl binden:

- **Die Auflagen aus T-144 Abschnitt 8.2 bleiben unberührt.** Ein Element, nicht drei; immer das
  absolute Datum; abwesend ohne Frist; nur zwei der drei Zustände laut. Der Umbruch ändert an
  keiner dieser vier Zusagen etwas — er ändert die Zeilenzahl, nicht die Marke.
- **Kürzen war ausgeschlossen** (Auflage 1 des Auftrags) und ist es auch sachlich: Eine Frist, die
  als „Überfäl…" endet, sieht richtig aus und ist es nicht. Deshalb keine `text-overflow`, kein
  Zeilendeckel — und ein Prüfsatz, der genau das für alle Regeln an den drei Marken verbietet.
- **Es ist keine neue Gestaltungsentscheidung, sondern die Hausregel.** Die Todo-Zeile in S-02
  trägt dieselben drei Marken und hat den Umbruch seit jeher (`.todo-row__meta`,
  `app.css:1541`). Die Kanban-Karte war die **einzige** Fläche ohne ihn.

Was ich **nicht** getan habe: die Frist an eine andere Stelle der Karte gelegt. Das wäre nach
Auflage 2 des Auftrags eine Sache des `ui-designer`. Sie war auch nicht nötig — der Umbruch trägt
bis 240 px, also unterhalb jeder Breite, die das Board zuläßt.

## Zustände

| Zustand | Stand |
|---|---|
| Empty | unberührt — ohne Frist steht keine dritte Marke da (A-19.5); Kopfzeile einzeilig, 18,5 px, wie vorher |
| Loading | unberührt (`AsyncBoundary`, Spaltenleerzustände) |
| Hover | unberührt, nachgesehen |
| Focus | nachgesehen: Der Fokusring auf Titelknopf, Timerknopf und Menü liegt vollständig frei, die umgebrochene Kopfzeile schneidet ihn nicht an. Fokusreihenfolge unverändert: `kcard__open` → `icon-btn` (Timer) → `menu__trigger` |
| Active | unberührt (kein Bedienelement geändert) |
| Error / Confirmation | unberührt — die Karte hat keine eigene Melde- oder Rückfragefläche |

Die Frist ist kein Bedienelement (`role="img"`, `aria-label` „Heute fällig — Frist: 05.09.2026",
nicht fokussierbar); es kam kein fokussierbares Element hinzu und keines fiel weg. Der zugängliche
Name der Marke ist unverändert.

## Läufe

Alle auf diesem Rechner, heute, nacheinander, Ergebnis in derselben Runde gelesen.

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **fehlerfrei**, alle acht Projekte plus `typecheck:test` und `typecheck:e2e` |
| `pnpm contrast` | **0 von 522 Paaren durchgefallen**, 11/11 Gegenproben — unverändert. Es kam keine Farbe hinzu; die rote Marke behält ihre gemessene Rampe und liegt nach wie vor auf `--bg-surface` |
| `proof:foreign` | 21 bestanden, 0 fehlgeschlagen; 169 Quelldateien — zeichengleich zu vorher |
| `proof:surface` | 27 bestanden, 0 fehlgeschlagen; 169 Quelldateien, 7 Stilblätter — zeichengleich |
| `proof:locked` | 9 bestanden, 0 fehlgeschlagen; 22 Einträge, 19 am Wortlaut gemessen — kein Oberflächentext berührt |
| `pnpm test:coverage` | **90 Dateien, 1641 Prüfsätze grün, 3 übersprungen** (vorher 89/1632/3 — genau die neue Datei mit 9 Sätzen) |
| `pnpm --filter @takt/web build` | gebaut, 3,1 s |

Nicht gefahren: `proof:engines` (braucht WebKitGTK, hier nicht vorhanden), `pnpm test:e2e`
(fremde Hoheit, siehe unten), `test:rust`, `audit`, `verify:bundle` (von dieser Änderung nicht
berührt).

## Der Prüffall

`apps/web/test/features/board/kanbanCardHeader.test.ts`, 9 Sätze. Ohne Layoutmaschine gibt es im
Einheitentest keine Kastengröße — die Datei hält deshalb nicht die Geometrie, sondern die
**Regeln**, aus denen die gemessene Geometrie folgt, und sagt das in ihrem Kopf ausdrücklich:

- `.kcard__top` ist ein Flex-Kasten **mit** `flex-wrap: wrap`;
- die Zeilenlücke ist kleiner als die Spaltenlücke (die zweite Zeile gehört zum selben Block);
- `.deadline` steht auf `flex: none`, `.kcard__deadline` hebt das auf und faltet notfalls Wort und
  Datum (`flex-wrap: wrap`, `max-width: 100%`);
- `.kcard__deadline` steht in derselben Datei **hinter** `.deadline` — gleiche Spezifität, die
  spätere gewinnt; kehrt jemand die Reihenfolge um, wird der Satz rot;
- **keine** Regel an den drei Marken kürzt Text (`text-overflow`, `line-clamp`,
  `overflow: hidden`).

Dazu vier Gegenproben, jede an genau einer Regel und ohne die Nachbarn zu treffen. **Die Probe
aufs Exempel:** Ich habe die beiden Stilblätter kurz auf den Stand vor der Behebung
zurückgesetzt und den Lauf gefahren — 6 von 9 Sätzen rot, darunter beide tragenden Zusagen.
Danach zurückgesetzt.

## Was in `tests/e2e/**` gehört — für e2e-tester, ich habe dort nichts abgelegt

Der Zustand „Karte mit drei Marken in schmaler Spalte" ist bis heute nie am Bildschirm gemessen
worden. Vorschlag für einen Fall, der ihn festhält (TP-Nummer vergibt e2e-tester):

1. Ein Todo mit **Call-Nummer**, **Frist in der Vergangenheit** und **nicht erledigt** anlegen, so
   daß es in einer Board-Spalte steht. Damit trägt die Karte drei Marken.
2. Fensterbreite so wählen, daß die Spalte auf ihrer **Mindestbreite** steht (`minmax(17rem, …)`,
   also 272 px — bei 1024 px Fensterbreite und mehreren Spalten ist das der Fall).
3. Messen, nicht ansehen: Für jedes Kind von `.kcard__top` gilt
   `boundingBox().x + width <= .kcard__main.x + width` **und** keine Überschneidung mit
   `.kcard__actions`. Zusätzlich `scrollWidth <= ceil(clientWidth)` an der Marke — das fängt ein
   späteres Kürzen ab, das den ersten Test grün ließe.
4. Gegenprobe im selben Fall: ein Todo **ohne** Frist trägt zwei Marken, einzeilige Kopfzeile.

Das ist der Teil, den mein Einheitentest ausdrücklich nicht kann.

## `visual-qa`

**Der Abnahmeblick dieser Rolle fehlt.** `visual-qa` steht als Werkzeug in dieser Umgebung nicht
zur Verfügung (mehrfach gemeldet, zuletzt T-267). Ersetzt habe ich ihn durch:

- **eine gerechnete Prüfung statt eines Blicks** — 80 Kombinationen aus Gestaltung, Farbmodus und
  Dichte, je Karte jede Marke gegen `.kcard__main`, `.kcard__actions` und den Kartenrand gemessen,
  vorher **und** nachher, mit naturgetreu zurückgebauter Regel als Vergleichsstand;
- **eigene Sichtprüfung** an Bildschirmfotos, vorher/nachher, bei drei Fensterbreiten (1440, 1100,
  900) und drei Spaltenbreiten (240, 272, 330, 336 px), dazu Fokus- und Zeigerzustand.

Die Bildschirmfotos liegen im Arbeitsverzeichnis dieser Sitzung unter `scratchpad/shots/`
(`vorher/`, `nachher/`, `echt-vorher/`, `echt-nachher/`, `stress-nachher/`, `zustaende/`). Eine
unabhängige Abnahme steht aus.

## Annahmen

1. **Gemessen wurde auf der Musterseite** (`designsystem.html`), nicht im laufenden Produkt mit
   lokalem Dienst. Begründung: Es sind derselbe Baustein (`KanbanCard`), dieselbe Spaltenregel
   (`.board`, `.kcolumn`) und dieselben Stilblätter; die einzige Abweichung des echten
   Board-Bildschirms — `overflow: hidden` an der Spalte und stehender Rollbalkenplatz aus
   `viewport-layout.css` — habe ich ausdrücklich nachgestellt und mitgemessen. Sie macht den
   Fehler **schlimmer**, nicht anders.
2. **Die Zeilenlücke ist `--space-1`**, nicht `--space-2`. Eine umgebrochene Kopfzeile mit der
   vollen Lücke liest sich wie zwei Absätze; mit der halben bleibt sie ein Block. Das ist eine
   Feinheit der Gestaltung, die ich getroffen habe, ohne zu fragen — sie ist mit einer Zeile
   umzustellen, wenn `ui-designer` es anders will.
3. **Der Prüffall liegt in `apps/web/test/**`**, das nach der Hoheitstabelle unit-tester gehört.
   Der Auftrag hat das ausdrücklich freigegeben („Was in `apps/web/test/**` ohne Browser meßbar
   ist, darfst du selbst bauen"). Eine Datei, kein fremder Prüffall angefaßt.

## Risiken

- **Die Karte wird an einer Stelle höher, an einer anderen niedriger.** Trägt sie drei Marken und
  ist die Call-Nummer kurz, kommt eine Zeile hinzu (18,5 → 41 px Kopfzeile). Ist die Call-Nummer
  lang, fällt eine weg (49,5 → 41 px). Gemessen an den Beispieldaten der Musterseite wird die
  Karte per Saldo kürzer. Fälle mit fester Kartenhöhe gibt es nicht.
- **Ein Prüffall am Quelltext mißt Regeln, nicht Pixel.** Schreibt jemand später eine Regel mit
  höherer Spezifität an anderer Stelle, die `flex-wrap` wieder ausschaltet, bleibt mein Lauf grün.
  Genau dagegen hilft nur der E2E-Fall oben — deshalb steht er da.
- **`kcard__flag` und `kcard__call` sind weiterhin nicht gegen unsinnig lange fremde Werte
  gedeckelt.** Sie schrumpfen im Notfall bis auf ihre Mindestgröße und brechen dann innerhalb der
  Karte um — gemessen mit einer 38 Zeichen langen Call-Nummer bei 240 px Spalte, kein Überlauf.
  Wer sie kürzen will, fällt über den neuen Prüfsatz „schneidet keine der drei Marken ab".

## Offene Fragen

1. **Gefällt dem `ui-designer` die zweizeilige Kopfzeile?** Sie ist die konservative Lösung
   (Marke bleibt, wo sie war), aber sie ist sichtbar. Die Alternative — Frist unter den Titel oder
   in den Fuß der Karte — wäre eine Gestaltungsentscheidung und gehört nicht mir (Auflage 2).
2. **Soll `docs/design/**` nachgezogen werden?** Das Designsystem beschreibt die Kopfzeile der
   Karte als einzeilig; ich habe dort nichts angefaßt (fremde Hoheit).
3. **Gehört der neue Prüffall langfristig zu unit-tester?** Die Datei liegt in dessen Hoheit; ich
   habe sie auf ausdrückliche Freigabe des Auftrags gebaut.

## Nächster Schritt

1. `e2e-tester`: den oben beschriebenen Fall in `tests/e2e/**` anlegen — er ist der einzige, der
   die Pixel mißt statt der Regeln.
2. `ui-designer`: einen Blick auf die zweizeilige Kopfzeile, Frage 1.
3. Review durch Code-Reviewer und Spezifikations-/UX-Reviewer; `visual-qa` bleibt offen, solange
   das Werkzeug fehlt.
