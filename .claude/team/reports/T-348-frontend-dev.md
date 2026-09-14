# T-348 — Die falsche Zusage, die Sprungmarke und die Bereichsschiene

**Rolle:** frontend-dev. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-346-code-reviewer.md`, `T-347-security-checker.md`,
`T-344-ui-designer.md`; `docs/spec.md` Abschnitt 25 (A-25.1 bis A-25.7);
`docs/design/fensterfeste-flaechen.md` 7.5 und 8.5; `docs/bedrohungsmodell.md` 44
(A-A-112 bis A-A-118); `decisions.md` E-087, E-094, E-099, E-114, E-115, E-116.

**Geänderte Dateien — acht, alle in eigener Hoheit:**

| Datei | Was |
|---|---|
| `apps/web/scripts/proof-surface.mjs` | A-A-112; Regel G neu aufgespannt; **Regel H** neu |
| `apps/web/src/shared/ui/ScreenBody.tsx` | `ScreenFrame` ohne Halt, `RunArea` mit `anchor` |
| `apps/web/src/shared/ui/Primitives.tsx` | `Card.anchor` |
| `apps/web/src/features/settings/SettingsScreen.tsx` | Rahmen ohne Halt, Bereich mit Marke |
| `apps/web/src/features/board/BoardScreen.tsx` | Rahmen ohne Halt, `.board` als Laufbereich |
| `apps/web/src/features/timer/TimeScreen.tsx` | Marke an Laufbereich A |
| `apps/web/src/features/export/ExportGroups.tsx` | B-06: die beiden Tabellenflächen |
| `apps/web/src/styles/app.css` | `.board:focus-visible`; 7.5 an der Höhenachse |

`tests/**`, `docs/**`, `apps/local-api/**`, `packages/**`, `board.md`, `decisions.md`,
`risks.md` sind **nicht** angefaßt.

**Ports.** `ss -ltn` vor Beginn und nach dem letzten Lauf: **17843, 17844 und 5173 waren und
sind frei**; kein eigener Dienst gebunden, kein fremder Prozeß beendet. Die beiden Messungen
unten laufen über `page.setContent` mit den Stilblättern als Text — **kein Port, kein Dienst**.

---

## 0 Was gemessen wurde, bevor irgendein Urteil fällt

**Nullpunkt** (`pnpm proof:surface`, Arbeitsbaum vor der ersten Änderung):

```
34 bestanden, 0 fehlgeschlagen.   20 Gegenproben
Unter .app: 6 direkte Kinder … 3 durch ein Portal am Dokumentkörper.
Flächen mit der Klasse `scrim`: 1, davon 1 in einem `createPortal(…, document.body)`.
```

**Nach T-348:**

```
45 bestanden, 0 fehlgeschlagen.   28 Gegenproben
Unter .app: 6 direkte Kinder … 3 durch ein Portal am Dokumentkörper.
Fensterfeste Klassen aus den Stilblättern: .scrim.
  Flächen darunter: 1, davon 1 in einem `createPortal(…, document.body)` aus `react-dom`.
Absagewege: 91, keiner erreicht einen Zustimmungsrückruf (onDismiss, onCancel, onClose, Escape).
```

T-346 erwartete 35/0. Es sind 45/0 geworden, weil die Menge **nicht** an den Gestalten
aufgespannt ist: elf Prüfungen mehr, acht Gegenproben mehr, und eine zweite Regel.

Die Zahl der benannten Live-Regionen steigt von 30 auf 32. Das ist kein Zufall, sondern
Folge derselben einen Änderung an `classTokensOf`: Der Lauf liest jetzt auch
`` className={`message--${tone}`} `` (`Primitives.tsx:359`) und zählt den gelesenen Teil mit.
Die Menge wird **größer**, nicht kleiner — die Richtung, in die ein Wächter irren darf.

---

## 1 A-A-112 — der Name `createPortal` wird gegen seine Einfuhr aufgelöst

**Der Befund war eine falsche Zusage, keine fehlende**, und deshalb stand er vor allem anderen.
Vier Zeilen mit einem eigenen `createPortal` brachten den Lauf dazu, in seiner **Schlußzeile**
`Flächen mit der Klasse scrim: 2, davon 2 in einem createPortal(…, document.body)` zu melden,
mit Datei und Zeile — während die Fläche an ihrer Karte hing. Dieselben vier Zeilen hoben den
Portalzähler von Regel F von 3 auf 4 und nahmen ein beliebiges Kind von `.app` aus der Regel.

Gebaut ist `portalRufOf` (`proof-surface.mjs`, Abschnitt 5a). Es löst auf:

- `createPortal(…)` gilt, wenn der Name in **derselben Datei** als benannte Einfuhr
  `createPortal` aus `react-dom` gebunden ist;
- `ReactDOM.createPortal(…)` gilt, wenn der Träger eine **Vorgabe-** oder **Namensraumeinfuhr**
  desselben Moduls ist.

**Und der örtliche Name geht vor.** `oertlicheNamenOf` sammelt Veränderliche, Funktionen,
Klassen und Übergaben einer Datei; steht `createPortal` darunter, ist es **nicht** das Portal,
auch wenn daneben eine Einfuhr desselben Namens stünde. Im Bestand wäre beides nebeneinander ein
Übersetzungsfehler — für die Gegenprobe ist dieser Vorrang der Unterschied zwischen einer
gemessenen und einer behaupteten Regel.

**Die eine bewußt teure Richtung steht im Quelltext:** `import { createPortal as portal }` und
danach `portal(…)` wird **nicht** als Portal gelesen und beide Regeln melden die Stelle. Das ist
eine Falschmeldung, die einen roten Lauf und eine Zeile kostet — die Gegenrichtung kostet eine
Zusage.

**Beide Regeln sind angeschlossen**, Regel F (`:1118` alt) und Regel G (`:1339` alt), und beide
haben eine eigene Gegenprobe in beide Richtungen. Bei Regel F wird zusätzlich **der Zähler**
gemessen: Ein fremder Name darf `ernte.portale` nicht erhöhen. Ohne diese zweite Hälfte bliebe
die Falschzählung in der Schlußzeile stehen, auch wenn der Lauf rot wäre.

---

## 2 Die Menge von Regel G kommt jetzt aus dem Stilblatt

**Bis T-348 stand dort ein fester Name.** Zwei Gestalten haben ihn ausgehebelt, ohne daß etwas
rot wurde: dieselbe Abdunklung unter dem zweiten Namen `rueckfrage-flaeche` samt
`position: fixed; inset: 0` (G-5), und `.scrim { position: static }` — das Portal blieb, die
Eigenschaft fiel, und der Lauf meldete weiter „1 von 1 verankert" (G-8).

Gebaut ist `fensterfesteKlassen`: **jede** Klasse, deren Regel im Stilblatt `position: fixed`
**und** eine Ausdehnung über die ganze Fläche erklärt (`inset: 0`, auch mehrwertig, oder alle
vier Kanten einzeln auf `0`). Das ist die Eigenschaft, die ein umschließender Block bricht —
nicht der Name.

Heute trifft das **genau eine** Klasse. Die drei anderen `position: fixed` des Bestandes sind
gemessen und stehen bewußt draußen, weil sie an einer Ecke hängen und keine Bestätigung tragen:
`.skip-link` (`base.css:299`), `.toast-layer` (`app.css:768`), `.idle-reminder` (`app.css:5038`).
Daß `.idle-reminder` heute trotzdem richtig liegt, ist eine Eigenschaft der Providerreihenfolge
und **keine zugesicherte** — der Satz steht so im Quelltext und nicht nur hier.

**G-5 und G-8 fallen mit derselben Zeile.** G-5 bringt eine zweite Klasse in die Menge, deren
JSX nicht verankert ist → Befund. G-8 nimmt `scrim` aus der Menge → die **Ernte** wird rot, denn
sie verlangt, daß `scrim` darin vorkommt. Ohne diese zweite Hälfte urteilte die Regel still über
eine kleinere Menge.

Dazu zwei kleinere Erweiterungen an derselben Stelle:

- **`classTokensOf` liest den Kopf einer Vorlagenzeichenkette** (T-346, blockierend) und den
  Bezeichner einer Zeichenkettenkonstanten derselben Datei (G-2). Die Gestalt stand bereits im
  Baum: `PoolAdministration.tsx:142`. Ein Wortteil, der an eine Einsetzung stößt, wird als
  eigener Name gezählt — der Lauf meldet dann zuviel, und das ist die Richtung, die zwölf Zeilen
  weiter oben schon für die Zwischenstufe eines Portals gewählt war.
- **Die Ernte liest `createElement("div", { className: … })`** (G-3) — die Schreibweise, in die
  jeder Übersetzer das JSX ohnehin überführt.

---

## 3 Regel H — Abbrechen ist nie Zustimmung

G-6 (`onDismiss` ruft `onConfirm`, Escape wird zur Zustimmung) ist **keine** Gestalt von Regel G.
Er gehört zum fünften Teilsatz von A-25.6, und der ist eine Frage des **Weges**, nicht der Fläche.
Deshalb steht er als eigene Regel daneben und nicht als neunte Ausnahme in Regel G.

Die Menge ist an der Anforderung aufgespannt: Ein **Absageweg** ist der Wert eines
JSX-Attributs `onDismiss`/`onCancel`/`onClose` oder der Zweig hinter `event.key === "Escape"`.
Ein **Zustimmungsrückruf** ist ein Name `on(Confirm|Accept|Apply)`. Erreichbar heißt: unmittelbar
genannt oder über eine örtliche Funktion derselben Datei; der Aufrufgraph nimmt aus einem Rumpf
**jeden** Bezeichner, nicht nur den gerufenen — er meldet zuviel und nie zuwenig.

Gemessen im Bestand: **91 Absagewege, keiner erreicht einen Zustimmungsrückruf.** Die Gegenprobe
in der teuren Richtung führt die vier Bauarten, die heute im Bestand stehen — der `ConfirmDialog`
mit `onDismiss={onCancel}` und `onConfirm` am Knopf, der Escape-Zweig von
`AttachmentOpenDialog`, ein `onClose`, das nur einen Zustand zurücksetzt.

---

## 4 Die acht Gestalten, beidseitig gemessen

Jede Gestalt wurde **im Arbeitsbaum** eingesetzt, gemessen und die Datei aus einer Sicherung
zurückgeschrieben. Die vier berührten Dateien sind nach dem Lauf **byteweise gleich** (`md5sum`
vorher und nachher identisch), und der Nullpunkt danach ist wieder 45/0.

| | Gestalt | vor T-348 | **nach T-348** |
|---|---|---|---|
| G-1 | Kopf einer Vorlagenzeichenkette | 34/0 grün | **44/1 rot** |
| G-2 | Klasse aus einem Bezeichner | 34/0 grün | **44/1 rot** |
| G-3 | `createElement` ohne JSX | 34/0 grün | **44/1 rot** |
| G-4 | eigener `createPortal` (Regel G) | 34/0 grün, Ernte „2, davon 2 verankert" | **44/1 rot** |
| G-5 | zweiter Klassenname, `position: fixed; inset: 0` | 34/0 grün | **44/1 rot** |
| G-6 | `Escape` als Zustimmung | 34/0 grün | **44/1 rot** |
| G-7 | eigener `createPortal` (Regel F) | 34/0 grün, Portalzähler 3 → 4 | **44/1 rot** |
| G-8 | `.scrim { position: static }` | 34/0 grün | **43/2 rot** |

G-8 ist doppelt rot, und beide Meldungen sind richtig: Die Menge verliert `scrim`, und damit
erntet die Regel null Flächen.

**Die zweite Richtung** steht in den Gegenproben derselben Datei: Die Bauart des Bestandes darf
nicht gemeldet werden. Neu darunter — der heutige `Scrim` mit echter Einfuhr, `ReactDOM.` mit
Vorgabeeinfuhr, ein Namensraum desselben Moduls, `createElement` **im** Portal, ein anderer Name
im Vorlagenkopf, eine Konstante mit anderem Wert, und die vier heutigen Absagewege.

### Welche Teilsätze von A-25.6 dieser Lauf danach trägt — und welche nicht

A-25.6 hat fünf Teilsätze. Die Zusage darf nicht weiter sein als das Gemessene:

| Teilsatz | getragen? | Wodurch, und wo die Grenze liegt |
|---|---|---|
| 1. hängt am Fenster, nie an dem, was sie bestätigt, **in jeder Gestaltung** | **ja** | Regel G, jetzt über drei Eigenschaften statt über einen Namen: Menge aus dem Stilblatt, echtes Portal (A-A-112), `scrim` muß in der Menge stehen. **Grenze:** nur JSX und `createElement` im gelesenen Baum; ein Klassenname, der erst zur Laufzeit entsteht, bleibt ungelesen. |
| 2. ist vollständig sichtbar | **nein** | Kein Lauf mißt Größe oder Lage einer Bestätigungsfläche. Das ist eine Frage an das gerenderte Bild und gehört zu `visual-qa`/e2e, nicht zu einem Quelltextlauf. |
| 3. rollt nicht weg | **mittelbar, nicht zugesichert** | Folgt aus `position: fixed` am Dokumentkörper — beide Hälften werden gemessen, ihr **Zusammenhang** nicht. Ein `transform` am Körper bräche ihn, und das mißt niemand. |
| 4. fängt den Tastaturfokus | **nein** | `trapFocus`, `keepTabInside` und `focusFirstWithin` sind gebaut und in e2e geprüft; dieser Lauf sagt darüber nichts. |
| 5. Abbrechen ist nie Zustimmung | **ja** | Regel H. **Grenze:** ein Rückruf, der über eine **fremde Datei**, über eine Abbildung oder über einen Zustandshaken zurückkommt, bleibt ungelesen. |

**Zwei von fünf zugesichert, einer mittelbar, zwei offen.** Beide Grenzen stehen als Prosa im
Kopf der jeweiligen Regel und nicht nur in diesem Bericht.

---

## 5 Die Sprungmarke und die Halte (T-344 8.5)

Umgesetzt, wie entschieden:

| Ansicht | `id="inhalt"` | Rahmen |
|---|---|---|
| die acht Regelansichten | `.screen__body` — **unverändert** | — |
| Einstellungen | `.settings-panel` (die `RunArea`) | **kein** Halt, keine Rolle, kein Name |
| Zeiterfassung | Laufbereich A („Todo wählen") | behält Halt, Rolle, Name; **gibt die Marke ab** |
| Kanban | **`.board`**, Name „Kanban" | **kein** Halt, keine Rolle, kein Name |

`ScreenFrameProps.label` ist dafür **freiwillig** geworden: Ein Rahmen ohne Namen bekommt weder
`tabIndex` noch `role` noch `id`. `RunArea` und `Card` haben eine `anchor`-Eigenschaft, Vorgabe
`false`. `.kcolumn__body` bekommt **keinen** Halt. `.board:focus-visible` ist an die vorhandene
Fokusringregel angeschlossen (`app.css`), damit der neue Halt sichtbar ist.

### A9 — Bild-ab bewegt nach der Sprungmarke meßbar etwas

Gemessen am **Verhalten** und nicht am Bezeichner: Fokus auf `#inhalt`, Taste, Bildlaufstand
vorher und nachher. Beide Stände der Marke laufen durch dieselbe Seite, mit den echten
Stilblättern, bei 1024 × 640 und dem gemessenen Rahmenbudget von 515 px.

| Fall | Laufweg der Fläche | Taste | Stand vorher → nachher | bewegt |
|---|---|---|---|---|
| Einstellungen, Marke am **Rahmen** (heute) | 0 px | Bild-ab | 0 → 0 | **nein** |
| Einstellungen, Marke am **Bereich** (T-348) | 1658 px senkrecht | Bild-ab | 0 → **392** | **ja** |
| Kanban, Marke am **Rahmen** (heute) | 0 px | Pfeil rechts | 0 → 0 | **nein** |
| Kanban, Marke am **Board** (T-348) | 1534 px waagerecht | Pfeil rechts | 0 → **36** | **ja** |

Das ist der Befund aus T-344 8.5, gemessen, und sein Abschluß. **AK-14 Punkt (b)** — null
Zwischenschritte — ist strukturell erfüllt: Die Marke setzt den Fokus unmittelbar auf den
laufenden Kasten; in den Einstellungen fallen damit die neun Schritte über die Bereichsschiene
weg.

### B-06 — die beiden Tabellenflächen im Export

**Gemessen und nicht geglaubt.** T-344 läßt die Laufstrecke eines Bausteins ohne eigenen Halt,
solange in ihrer **rechtesten** Spalte ein fokussierbares Element steht. Gemessen am Quelltext:

- `export-todo-table`, letzte Spalte „Ausgewählte Tage": `<td class="table__cell--center tabular">{selected}</td>` — **eine Zahl, nichts Fokussierbares** (`ExportGroups.tsx`).
- `export-day-table`, letzte Spalte „Exportzeit": `…{quarters} h` — **Text, nichts Fokussierbares**.
- Die fokussierbaren Elemente — Aufklappknopf und Auswahlkästchen — liegen in beiden Tabellen
  ganz **links**.

**Also bekommt die Fläche doch einen Halt.** Beide äußeren `.table-wrap` tragen jetzt Halt, Rolle
und Namen; der Name ist die vorhandene `<caption class="visually-hidden">`, je einmal getippt und
von Fläche und Beschriftung geteilt. **Kein neuer Oberflächentext.**

Die **geschachtelte** Tagesliste innerhalb einer aufgeklappten Todo-Gruppe bekommt ausdrücklich
keinen — sie erzeugte sonst einen Halt je aufgeklappter Zeile. Dafür trägt
`ExportGroupListProps` die Angabe `nested`.

### E-114 — die Benutzung von `#inhalt`, nicht ihr Wortlaut

Gesucht mit `git grep` **plus** einem Lauf über `apps/*/src`, `packages/*/src`, `tests/`,
Bauergebnisse ausgenommen (`apps/desktop/src-tauri/taskpane/`). Ergebnis:

- **Die sieben Geltungsbereiche sind bereits umgestellt.** T-330 hat `page.locator('#inhalt')`
  in `attachment-legacy-todo-regression`, `manual-booking-movement` (3×), `pool-movement-sentence`
  (2×), `timer-prompt-setting` (2×), `timer-stop-announcement` (3×), `todo-revival` (2×) und
  `web-build-smoke` durch `page.locator('.screen')` ersetzt, mit Begründung an jeder Stelle.
  Sie sind von dieser Verlegung **nicht** berührt.
- **Vier lebende Benutzungen bleiben:** `tests/e2e/version-check-live.spec.ts:78, 181, 197, 322` —
  `expect(page.locator('#inhalt')).toBeVisible()` als Wartemarke. Alle vier laufen auf `/#/`,
  also der Übersicht, einer **Regelansicht** mit `.screen__body`. Dort ist die Marke unverändert.
  **Kein Prüffall wird dadurch rot.**
- `App.tsx:299` (`href="#inhalt"`), `Showcase.tsx:96`/`:157` (eigene Musterseite, eigenes Ziel)
  und `TemplatesScreen.tsx:898` (ein Kommentar über Nicht-Routen) bleiben wörtlich.

**Was in `tests/**` rot würde — nicht repariert, wie beauftragt.** Nach dieser Suche: **nichts**
an einer `#inhalt`-Stelle. Eine Lücke ist trotzdem zu nennen, und sie gehört dem e2e-tester:

- `tests/e2e/viewport-fit.spec.ts:317` — `A8_RUN_AREA_SELECTORS` führt
  `['.screen__body:not(.screen__body--frame)', '.runarea', '.kcolumn__body']`. **`.board` fehlt.**
  Seit T-348 ist `.board` ein benannter Laufbereich der Ansicht mit eigener waagerechter
  Laufstrecke; A8 mißt ihn nicht. Kein Prüffall wird rot — die Menge ist nur um eine Fläche zu
  klein. Grund: Die Liste ist an den Selektoren von T-339 aufgespannt und nicht an Abschnitt 4
  des Flußpapiers.

**Diese Aussage ist am Wortlaut und an der Benutzung gelesen, nicht am Lauf.** `pnpm test:e2e`
ist **nicht** gefahren — drei Playwright-Konfigurationen binden Ports, und der Auftrag verlangt,
keine zu belegen, die eine Sitzung des Benutzers tragen könnten.

---

## 6 Die Bereichsschiene (T-344 7.5)

Gebaut ist `@media (max-height: 44rem) { .settings-rail__hint { display: none } }` — dieselbe
Gestaltung, die die Schiene bei knapper **Breite** schon verliert, an der zweiten Achse
angeschlossen. Die Schwelle ist gerechnet und nicht gerundet: 576,7 px Schiene + 125 px Kette
⇒ Kante bei ≈ 702 px ⇒ `44rem` = 704 px, mit 2,3 px Luft nach oben.

**Die offene Zahl ist gemessen: die Schiene ohne Zusatz ist 415 px hoch.** T-344 schätzte nach
der Bauform „rund 430" und verlangte, daß sie bei 704 px Fenster in 579 px Rahmen paßt. Sie tut
es mit **164 px Luft** — die Regel muß **nicht** eine Stufe höher.

**Der Meßaufbau ist gegen eine bekannte Zahl geeicht**, bevor er etwas Neues behauptet: Mit
Zusatz mißt er 576,7 px und trifft damit T-341 und T-344 auf die Nachkommastelle. Ohne die
Gestaltungstoken war derselbe Aufbau bei 338 px — der erste Lauf war falsch, und **daran** ist
zu sehen, daß der zweite etwas mißt.

| Fenster | Rahmen **vorher** | Rahmen **nachher** | Schiene vorher | Schiene nachher | Zusatz |
|---|---|---|---|---|---|
| 1280 × 820 | 695 / 695 | 695 / 695 | 576,7 | 576,7 | sichtbar |
| 1024 × 900 | 775 / 775 | 775 / 775 | 576,7 | 576,7 | sichtbar |
| 1024 × 704 | 579 / 579 | 579 / 579 | 576,7 | **415** | **weg** |
| **1024 × 640** | **577 / 515 — läuft** | **515 / 515 — läuft nicht** | 576,7 | **415** | **weg** |
| 960 × 640 | 515 / 515 | 515 / 515 | 145 (Band) | 145 (Band) | weg |

**A8 bei 1024 × 640 wird grün.** Die 62 px Überlauf, die T-341 gemessen hat, sind auf 0
gefallen; der einzige bekannte E-115-Verstoß ist behoben und nicht ausgenommen. Der Rahmenwert
577/515 des Nullpunkts reproduziert T-341s Messung zeichengenau — der Aufbau sieht also den
Fehler, den er beheben soll.

**Es ist kein Textabbau nach E-087.** Der Zusatz fällt nicht aus dem Bestand; er ist in einer
Fenstergröße nicht sichtbar — dieselbe Bedingung, unter der er bei ≤ 60 rem Breite schon
verschwindet, und mit derselben Begründung. Die Beschriftung bleibt in jeder Größe, und der
Zusatz ist nirgends die einzige Fassung. A-25.7 ist nicht berührt.

---

## 7 Die Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0**, alle acht Arbeitsbereiche plus Prüf- und e2e-Konfigurationen |
| `pnpm boundaries` | **grün**, 528 Quelldateien geprüft |
| `pnpm contrast` | **grün**, 0 von 522 Paaren durchgefallen, 11 von 11 Gegenproben |
| `pnpm proof:surface` | **45 bestanden, 0 fehlgeschlagen** (Nullpunkt 34/0) |
| `pnpm build` | **grün**, alle Pakete |

Keine `any`-Typen. `ss -ltn` nach dem letzten Lauf: keine eigenen Ports offen.

---

```
Aufgabe: T-348 — Die falsche Zusage, die Sprungmarke und die Bereichsschiene
Status: braucht Review
Artefakte: apps/web/scripts/proof-surface.mjs, apps/web/src/shared/ui/ScreenBody.tsx,
  apps/web/src/shared/ui/Primitives.tsx, apps/web/src/features/settings/SettingsScreen.tsx,
  apps/web/src/features/board/BoardScreen.tsx, apps/web/src/features/timer/TimeScreen.tsx,
  apps/web/src/features/export/ExportGroups.tsx, apps/web/src/styles/app.css,
  .claude/team/reports/T-348-frontend-dev.md
Zusammenfassung: A-A-112 ist behoben — `createPortal` wird gegen seine Einfuhr aufgelöst,
  und der örtliche Name geht vor; das schließt G-4 und G-7 mit derselben Funktion und wird an
  beiden Regeln beidseitig gemessen, bei Regel F zusätzlich am Portalzähler. Regel G ist neu
  aufgespannt: die Menge kommt aus den Stilblättern (`position: fixed` plus volle Ausdehnung)
  statt aus einem festen Namen, die Ernte verlangt `scrim` darin — das schließt G-5 und G-8
  zugleich. `classTokensOf` liest Vorlagenteile und Zeichenkettenkonstanten (T-346 blockierend,
  G-1, G-2), die Ernte liest `createElement` (G-3). G-6 gehört nicht zu Regel G, sondern zum
  fünften Teilsatz von A-25.6 und steht als **Regel H** daneben: 91 Absagewege, keiner erreicht
  einen Zustimmungsrückruf. Alle acht Gestalten sind eingesetzt gemessen und rot, der Nullpunkt
  danach wieder 45/0, die vier berührten Dateien byteweise gleich. Die Sprungmarke sitzt am
  Inhaltshalt (Einstellungen: Bereich, Zeiterfassung: Laufbereich A, Kanban: `.board` mit Namen
  „Kanban"); A9 ist am Verhalten gemessen — Bild-ab bewegt in den Einstellungen 392 px statt 0,
  Pfeil rechts im Kanban 36 px statt 0. Die Bereichsschiene verliert ihren Zusatz bei
  `max-height: 44rem`; sie ist ohne ihn **415 px** hoch, und der Rahmen bei 1024 × 640 geht von
  577/515 auf 515/515 — A8 wird dort grün.
Annahmen: (1) Regel G ist um `createElement` und um die Stilblattmenge erweitert worden, statt
  acht Einzelfälle nachzutragen; „spann die Menge an der Anforderung auf" war der Auftrag, und
  der Klassenname war die Gestalt. (2) G-6 hat eine **eigene** Regel bekommen, weil er eine
  Eigenschaft des Weges ist und keine der Fläche; als neunte Ausnahme in Regel G wäre er die
  Liste der bekannten Fälle gewesen. (3) `.skip-link`, `.toast-layer` und `.idle-reminder`
  stehen bewußt **außerhalb** der Menge: fest, aber an einer Ecke und ohne Bestätigung. Das ist
  ein Kriterium, keine Ausnahmeliste — eine vierte fensterfeste Vollfläche fiele darunter.
  (4) Die beiden Exporttabellen haben nach der Messung einen Halt bekommen; die geschachtelte
  Tagesliste nicht, sonst wäre es ein Halt je aufgeklappter Zeile. (5) Der Name der
  Tabellenflächen ist die vorhandene `<caption>`, je einmal getippt statt zweimal.
Risiken: (1) Regel H liest nur innerhalb einer Datei; ein Zustimmungsrückruf, der über eine
  fremde Datei oder einen Zustandshaken zurückkommt, bleibt ungelesen — der Satz steht im Kopf
  der Regel. (2) Von den fünf Teilsätzen von A-25.6 trägt dieser Lauf zwei, einen mittelbar,
  zwei gar nicht; „vollständig sichtbar" und „fängt den Tastaturfokus" sind keine Frage an einen
  Quelltextlauf. (3) `pnpm test:e2e` ist **nicht** gefahren (Ports); die Aussage „kein Prüffall
  wird rot" ist an Wortlaut und Benutzung gelesen, nicht gemessen. (4) `visual-qa` hat die
  gerenderte Oberfläche noch nicht gesehen — die drei Rahmenansichten, der neue Fokusring an
  `.board` und die Schiene bei 1024 × 640 gehören vor die Freigabe. Sicherheitsseitig nichts:
  keine Adresse, kein Datenweg, keine Route, kein neuer Oberflächentext.
Offene Fragen: (1) An den ui-designer: `.skip-link`, `.toast-layer` und `.idle-reminder` sind
  fensterfest und stehen unter keiner Zusage. `.idle-reminder` trägt die Zuordnung inaktiver
  Zeit (A-24) und liegt heute nur richtig, weil `TimerProvider` über `.app` steht. Soll daraus
  eine gemessene Eigenschaft werden — und wenn ja, an welcher Regel? (2) An den e2e-tester:
  `A8_RUN_AREA_SELECTORS` in `viewport-fit.spec.ts:317` fehlt `.board`. (3) An den
  spec-ux-reviewer: Teilsatz 2 und 4 von A-25.6 haben heute **keinen** Lauf. Gehört das in einen
  Auftrag oder in einen benannten Rest?
Nächster Schritt: (a) visual-qa über die drei Rahmenansichten bei 1280 × 820, 1024 × 900,
  1024 × 640 und 960 × 640 — Sprungmarke, Fokusring an `.board` und `.settings-panel`, die
  Schiene ohne Zusatz, die beiden Exporttabellen mit Halt; (b) e2e-tester: A9 und AK-14 als
  Prüffälle, `.board` in den A8-Selektorsatz, die berichtigte A8-Ausnahme aus T-344 9.6;
  (c) danach code-reviewer und security-checker über `proof-surface.mjs` — die Gattungsgrenzen
  von Regel G und H stehen im Quelltext und wollen gegengelesen werden.
```
