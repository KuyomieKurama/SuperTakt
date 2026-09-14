# T-346 — Freigaberunde über T-341 (Oberfläche) und T-342 (Wächter)

**Rolle:** code-reviewer. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` plus Arbeitskopie.
**Vorlagen:** `.claude/team/reports/T-341-frontend-dev.md`, `T-342-domain-dev.md`;
`.claude/team/board.md` Welle 6; `decisions.md` E-113, E-115, E-116, E-094, E-099;
`risks.md` R-30, R-32, R-33.

**Geschrieben habe ich ausschließlich diese Datei.** Kein `apps/**`, kein `packages/**`, kein
`docs/**`, kein `tests/**`. Meßkopien der beiden Wächter liegen im sitzungseigenen Kratzbereich
(`ps-mut.mjs`, `prs-mut.mjs`, `tscheck/`) und nicht im Bestand.

---

## 1 Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **Exit 0** |
| `pnpm boundaries` | **Exit 0** — 528 Dateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm contrast` | **Exit 0** — 0 von 522 Paaren durchgefallen, 11/11 Gegenproben |
| `pnpm build` | **Exit 0** |
| `pnpm test:coverage` | **Exit 0** — Anweisungen 91,83 %, Zweige 86,24 %, Funktionen 94,88 %, Zeilen 94,01 % |
| `pnpm test:rust` | **Exit 0** — 69 bestanden, 0 fehlgeschlagen, 1 übersprungen |
| `pnpm audit` | **Exit 0** — keine bekannten Schwachstellen |
| `proof:surface` | **34 / 0** (T-341 meldet 34/0) |
| `proof:release-safety` | **145 / 0** (T-342 meldet 145/0) |
| `proof:codepoints` 46/0 · `proof:migrations` · `proof:callers` · `proof:export` 98/0 · `proof:foreign` · `proof:clamp` · `proof:locked` · `proof:layers` 36/0 · `proof:shell-surface` · `proof:db-permissions` 27/0 · `proof:openapi` 115/0 · `proof:taskpane` 33/0 · `proof:addin` 301/0 | je **Exit 0** |

**Nicht gefahren, Ports vergeben.** `verify:bundle` (bindet 17844) und `pnpm test:e2e` — T-345
hält die Ports. Gemessen mit `ss -ltn`: **17843, 17844 und 5173 waren während der ganzen Runde
belegt** und sind es am Ende noch; keiner davon gehört mir.

**Ebenfalls nicht gefahren, und aus demselben Grund:** die sieben portgebundenen Nachweise aus
`proof:all`, die `PORT = 17843` binden — `proof:access`, `proof:conflicts`, `proof:tags`,
`proof:export-api`, `proof:addin-wiring`, `proof:route-policy`, `proof:template-fields`.
`proof:all` als Ganzes ist damit **nicht** nachgewiesen; die fünfzehn übrigen Läufe sind es
einzeln. `proof:engines` steht ohnehin nicht in `proof:all`.

**Ports und Prozesse.** Keinen Port gebunden, keinen fremden Prozeß beendet, keinen eigenen
Prozeß hinterlassen (`pgrep node` ohne Treffer auf meine Skripte). `git status` vor und nach der
Runde zeichengleich: 41 geänderte, 26 unversionierte Einträge.

---

## 2 Befunde

### Strang A — T-341

```
apps/web/scripts/proof-surface.mjs:356    mittel   `classTokensOf` liest nur `StringLiteral` und
    `NoSubstitutionTemplateLiteral`. Der Kopf einer **Vorlagenzeichenkette mit Einsetzung** ist
    keins von beidem: gemessen liefert `<div className={`scrim ${extra}`}>` durch dieselbe
    Funktion wie der Bestand `flaechen=0, befunde=0` — die Fläche ist für Regel G nicht
    vorhanden, und die Untergrenze zählt sie auch nicht. Eine **zusätzliche**, unverankerte
    Abdunklung in dieser Gestalt neben dem heutigen `<Scrim>` ist gemessen grün
    (`flaechen=1, befunde=0`), während die Schlußzeile weiterhin „Flächen mit der Klasse `scrim`:
    1, davon 1 in einem `createPortal(…, document.body)`" behauptet. Die Gestalt ist **heute schon
    im Baum** (`apps/web/src/features/tags/PoolAdministration.tsx:142`), also keine erfundene.
    Damit ist die Menge von Regel G an den vier Mutationen aufgespannt, die der Autor in der Hand
    hatte (alle vier schreiben die Klasse als Literal oder als `cx("scrim", …)`), und nicht an
    „jede gezeichnete Abdunklung" — dieselbe Klasse wie E-099 Punkt 3.
    Fix: im `walk` bei :356 die Bedingung um `ts.isTemplateHead(node) || ts.isTemplateMiddle(node)
    || ts.isTemplateTail(node)` erweitern und in Abschnitt H eine fünfzehnte Gestalt
    `<div className={`scrim ${x}`}>` als „muß rot sein" ergänzen. Dieselbe Zeile hebt die Lücke
    auch für Regel B und Regel C, die über dieselbe Funktion lesen.

apps/web/scripts/proof-surface.mjs:1310   niedrig  Die beiden ausdrücklich genannten Grenzen
    („folgt keiner Zwischenstufe" beim **Portal**, „kennt nur den Namen `scrim`") decken die
    gemessenen Blindstellen nicht ab. Gemessen, je `flaechen=0, befunde=0`:
    `const SC = "scrim"; <div className={SC}>`, `<div className={cx(SCRIM_CLASS, "x")}>`,
    `<div {...{ className: "scrim" }}>` und `el.classList.add("scrim")` im Effekt. Der
    Klassenname muß **als Literal im JSX** stehen; das steht nirgends.
    Fix: einen dritten Spiegelstrich neben die zwei bestehenden — „Sie liest den Klassennamen nur
    als Literal im JSX. Ein Name aus einer Konstante, aus einer Vorlagenzeichenkette oder aus
    `classList` wird nicht gelesen." Nach Behebung von :356 entfällt davon nur die
    Vorlagenzeichenkette.

apps/web/src/styles/app.css:1613          niedrig  Schwelle und Spaltenmaß sind zwei Zahlen, die
    aus `gap: var(--space-3)` (:1527) und `minmax(9rem, …)` (:1573) **gerechnet** sind, aber an
    keiner von beiden hängen. Wer `--space-3` gegen `--space-4` tauscht oder die 9rem verschiebt,
    macht die 38,25rem still falsch; es gibt keinen Lauf, der das bemerkt. Daß der Wert
    hartgeschrieben ist, ist **kein** Befund — eine Container-Query-Bedingung kann kein `var()`
    aufnehmen, das ist eine CSS-Grenze und keine Abkürzung; die Herleitung steht unmittelbar
    darüber.
    Fix (klein): `@container (max-width: calc(36rem + 2.25rem))` schreiben, damit die drei
    Zwischenräume im Bedingungstext sichtbar bleiben — oder eine Zeile in `proof:clamp`, die
    `4 × <Spaltenmaß> + 3 × --space-3` gegen die Schwelle hält.

.claude/team/reports/T-341-frontend-dev.md §3.5   niedrig  Zwei Rechenfehler im Bericht, beide
    ohne Folge für die Entscheidung. (a) „Rahmen 415 (bei 640 Höhe: 255)": 415 gilt bei **640 px
    Fensterhöhe** (831 × 640), 255 bei **480 px** (640 × 480) — die Klammer beschriftet die
    falsche Größe. Die Budgets 335 / 175 sind richtig und bestätigen, daß unterhalb von 52rem
    `--screen-inset` auf `--space-4` fällt: 415 − 16 − 64 = 335 und 255 − 16 − 64 = 175.
    (b) „74,8 + 113,5 + Zwischenräume ≈ 188 px": 74,8 + 113,5 sind bereits 188,3; mit dem
    Zwischenraum von 20 px sind es ≈ 208. Der Schluß (über 175 px Budget) trägt erst recht.
    Fix: beide Zeilen berichtigen; die Einstufung „A2 gilt ab 960 × 640, darunter die schwächere
    Zusage" bleibt unberührt.

.claude/team/reports/T-341-frontend-dev.md §„Geänderte Dateien"   niedrig  Die Tabelle nennt drei
    Dateien. Berührt und wiederhergestellt wurden **sieben**: die vier Mutationsorte
    `apps/web/src/features/todos/AttachmentOpenDialog.tsx`, `app/ShellStatus.tsx`,
    `shared/ui/DialogSurface.tsx` und `features/todos/Attachments.tsx` tragen Änderungszeiten von
    16:31–16:32, also aus dem Auftragsfenster. Die Wiederherstellung ist nachgeprüft und sauber
    (unten, Abschnitt 3). Der Hinweis steht nur in Abschnitt 2.2; gelesen wird die Tabelle.
    Fix: die vier Dateien in der Tabelle als „berührt und zeichengleich wiederhergestellt"
    führen — sonst hält der nächste Agent in einer parallelen Welle sie für unangetastet.
```

### Strang B — T-342

```
apps/local-api/scripts/proof-release-safety.mjs:2201   mittel  Die tragende Aussage von 6i — „Ein
    Modul kommt auf genau **zwei** Wegen an etwas heran, das es nicht selbst erklärt hat: über
    eine Einfuhr oder über einen freien Namen. Zusammen ist das geschlossen" — ist gemessen
    falsch. Zwei weitere Türen, beide durch dieselben Funktionen dieses Laufs geprüft
    (`freieLaufzeitnamen`, `importQuellen`) und beide mit `tsc -p` gegen `tsconfig.base.json`
    **Exit 0**:
      (1) `const g = ({}).constructor.constructor("return globalThis")();`
          → freie Namen `[]`, Importquellen `[]`. Dasselbe über `[].constructor.constructor(…)`.
          `Object.constructor` ist `Function`; der Aufruf liefert `any`, `g.process.env.X`
          übersetzt. Kein Bezeichner, keine Einfuhr — 6i und Gestalt 5 sind beide grün.
      (2) `const p = ["node", "process"].join(":"); await import(p);`
          → freie Namen `[]`, Importquellen `[]`. `importQuellen` (:1276) verlangt ein
          Zeichenkettenliteral unmittelbar hinter `import(`; `import.meta` ist über
          `ts.isMetaProperty` erfaßt, die **Einfuhr als Aufruf** mit berechneter Quelle nicht.
    Die Zahl 145/0 ändert sich dadurch nicht, und der Bestand ist sauber. Teuer ist der Wortlaut:
    der Vorschlag für `risks.md` R-30 („die Menge der Türen in diese zwei Dateien damit
    **geschlossen**") würde eine falsche Schließung in das Risikoregister schreiben.
    Fix, und beides ist klein, weil es um genau zwei Dateien geht: entweder **zumachen** — zwei
    Prädikate über den Baum der beiden Entscheidungsmodule, nämlich kein
    `PropertyAccessExpression` mit dem Namen `constructor` und kein Einfuhraufruf, dessen Argument
    kein Zeichenkettenliteral ist — oder **benennen**: beide Gestalten als zwei weitere Punkte
    unter (III) in die Lückenliste und im R-30-Wortlaut „geschlossen" durch „zwei von vier Türen
    zu, die beiden übrigen benannt" ersetzen.

apps/local-api/scripts/proof-release-safety.mjs:1539   niedrig  Die vier Arten von Stellen sind als
    Einteilung **vollständig** — innerhalb/außerhalb des Baums, und innerhalb gelesen/eingegrenzt/
    keines von beidem ist eine Zerlegung ohne Rest. Was darin fehlt, ist keine fünfte Art von
    Stelle auf dem Weg, sondern das **Meßwerkzeug selbst**: `ADAPTER_ANWEISUNGEN`,
    `PORTLITERAL_ANWEISUNGEN`, `AUSKUNFT_ANWEISUNGEN`, `MODUL_LAUFZEITNAMEN` und
    `VERSION_FEATURE_IMPORTS` stehen in `scripts/**`, also außerhalb des gelesenen Baums, und eine
    einzige Zeile in einer von ihnen macht die zugehörige Gestalt wieder grün, ohne daß irgendwo
    etwas rot wird. Punkt (IV) und der Absatz bei :1478 nennen `scripts/` nur als Ort, an dem
    **nicht nach Verstößen gesucht** wird — nicht als Liste, die entscheidet, **was gemessen
    wird**. T-342 sagt es im Bericht (Abschnitt 4, Punkt 3), und nach seiner eigenen Regel gehört
    genau das in die Lückenliste und nicht in einen Bericht.
    Fix: ein Spiegelstrich unter (IV) — „Die Bestätigungslisten dieses Laufs selbst. Sie liegen in
    `scripts/**` und sind von keinem Satz erreichbar; jeder Zeichenvergleich ist nur so scharf wie
    die Liste daneben, und deshalb nennt jede Meldung ihren Bestätigungsort."

apps/local-api/scripts/proof-release-safety.mjs:2201   niedrig  `MODUL_LAUFZEITNAMEN` nagelt auch
    **Typnamen** fest — `ReturnType`, `Record`, `undefined` stehen in den Listen, weil
    `freieLaufzeitnamen` Bezeichner in Typstellung mitnimmt. Ein `Partial<…>` in `version.ts` macht
    diesen Lauf damit rot, obwohl es die ausgehende Anfrage nicht berühren kann. Der Preis ist in
    T-342 Annahme 2 als „jeder neue Laufzeitname" angekündigt; das ist er nicht ganz.
    Fix: einen Satz an :2201 — „Die Liste enthält auch Namen in Typstellung; der Leser
    unterscheidet sie nicht. Eine rein typseitige Ergänzung ist deshalb ebenfalls zu bestätigen."
```

---

## 3 Was ich bestätigt habe — es gehört genauso in den Bericht

### 3.1 Strang A, Punkt 1 — die Fokusring-Reserve hält, und der Zweck der Zeile auch

Nicht nachgelesen, sondern am Stilblatt nachgerechnet:

- **Der Mechanismus trägt.** Polster `+r` und Rand `−r` in einer Flex-Spalte: Die Außenkante des
  Kastens wandert um `−r`, die Inhaltsoberkante bleibt, die **Klippkante** (`overflow: hidden`
  klippt am Polsterkasten) wandert um `r` nach außen. `r = calc(var(--focus-ring-width) +
  var(--focus-ring-offset))` ist 2 + 2 = **4 px** und unter `prefers-contrast: more` 3 + 2 =
  **5 px** (`packages/ui-tokens/tokens.css:269/270/651`) — gerechnet und nicht beziffert, richtig.
- **Die obere Kante wird nicht von außen wieder abgeschnitten.** Das war die Frage, die die
  Messung an der Klippkante allein nicht beantwortet: `.app__main` ist Bildlaufkasten mit
  `padding: 0` und `overflow-y: auto` (`app.css:334 ff.`), und über den Anfang seines Inhalts
  hinaus ist nichts erreichbar. Getragen wird die Reserve von `.screen { padding-block-start:
  var(--screen-inset) }` (`viewport-layout.css:135`) — **24 px**, unterhalb von 52rem 16 px.
  24 ≫ 5, die 4 bzw. 5 px liegen vollständig darin. Der Ring ist wirklich sichtbar, nicht nur die
  Klippkante verschoben.
- **Der feste Teil überlagert den Laufbereich nicht.** `.screen { gap: var(--space-5) }`
  (`app.css:928`) = 20 px. Ein fester Teil gibt 4 px ab → **16 px**; **zwei** benachbarte feste
  Teile geben je 4 px ab → **12 px**, unter `more` je 5 px → **10 px**. Das erklärt T-341s
  „16 px (bookings 12)" und „15 px (bookings 10)" ohne Rest — die Buchungen tragen zwischen Kopf
  und Laufbereich eine zusätzliche `.screen__bar` (`BookingsScreen.tsx:354`, die Trefferliste der
  Todo-Einschränkung). Die Zahlen des Berichts sind damit nicht nur gemessen, sondern auch
  hergeleitet.
- **Die Gegenrichtung ist leer.** Die Klippkante wächst; sie schrumpft nirgends. Es kann deshalb
  nichts neu abgeschnitten werden. Neu **sichtbar** würden höchstens 4–5 px über und unter dem
  festen Teil — dort ist nichts gezeichnet: `.screen__header` und `.screen__bar` tragen keinen
  Hintergrund und keinen Rahmen, und aufgeklappte Listen liegen seit T-059 im Portal.
- **Kein Kaskadenkonflikt.** `.screen__header` und `.screen__bar` werden im ganzen Baum an genau
  zwei Stellen gestaltet: `viewport-layout.css:263` und `app.css:933` (nur `display`,
  `flex-direction`, `gap`). Der einzige Mitbewerber um `margin` ist `.pick-list { margin: 0 }`
  (`app.css:2057`) an der einen `ul.screen__bar` — gleiche Spezifität, und `viewport-layout.css`
  wird nach `app.css` geladen (`main.tsx:5–8`), die Reserve gewinnt. Das ist hier das gewollte
  Ergebnis.
- **Der E-113-Kommentar deckt sich mit der Entscheidung.** Die Regel im Quelltext
  („Ein Bildlaufkasten muß der umschließende Block seiner eigenen absoluten Nachfahren sein")
  steht wörtlich so in `decisions.md` E-113, samt der Begründung „genau ein umschließender Block
  war nie das Ziel" und „dieselbe Klasse wie T-057, eine Ebene höher". Die Behauptung, beide
  Designpapiere seien nachgezogen, trifft zu: `docs/design/fensterfeste-flaechen.md` führt die
  Zeile in der Pflichtentabelle als Pflicht (:75, :240).

### 3.2 Strang A, Punkt 2 — Regel G, woran ihre Menge aufgespannt ist

Am **Leser** gemessen, nicht am Bericht: fünfzehn eigene Gestalten durch `findScrimsWithoutPortal`,
dieselbe Funktion wie der Bestand.

**Richtig und bestätigt:**

- Der Bestand trägt genau **eine** Fläche mit der Klasse, `shared/ui/DialogSurface.tsx:454`, und
  sie steht lexikalisch im gezeichneten Argument von `createPortal(…, document.body)`. Die
  Schlußzeile stimmt mit dem Baum überein (`ShellStatus.tsx:763` trägt `scrim--blocking` und ist
  richtigerweise kein Treffer).
- Die Untergrenze zählt **ihre eigene** Menge (`scrimErnte.flaechen.length > 0`) und nicht die
  von Regel F. Die alte Zeile `portale > 0` steht daneben und sagt jetzt, was sie mißt.
- Vier Gestalten, die der Bericht nicht nennt, verhält der Lauf richtig: ein Portalziel
  `document.querySelector("body")` → **rot** (sichere Richtung); ein Ziel über eine Variable, die
  `document.body` hält → **rot** (sichere Richtung); ein **Fragment** als gezeichnetes Argument →
  grün, und das ist richtig; **geschachtelte** Portale, deren äußeres ein fremdes Ziel hat →
  grün, und auch das ist richtig, weil das innere Portal unabhängig am Körper hängt.
- `.constructor`-artige Namensverwechslungen gibt es hier nicht: `scrim--blocking`, `scrimmage`
  und `unterscrim` sind gemessen keine Treffer.

**Nicht bestätigt** — das sind die Befunde A-1 und A-2 oben.

### 3.3 Strang A, Punkt 3 — die Spaltenschwelle

- **Die Rechnung stimmt.** 4 × 9rem + 3 × `--space-3` = 4 × 144 + 3 × 12 = **612 px = 38,25 rem**.
  `--space-3` ist `0.75rem` (`packages/ui-tokens/tokens.css:321`) und wird von der Dichte
  „kompakt" **nicht** überschrieben (dort nur `--row-height` und `--row-padding-x`, :428) — der
  Wert wandert also nicht mit der Zeilendichte.
- **`minmax(9rem, …)` kann an keiner der vier Stufen überlaufen.** Über 68rem: 5 Spuren,
  14+8+8+12+9 rem + 4 × 12 px = 54 rem < 68 rem. 38,25–68rem: 4 × 9rem + 36 px = 38,25 rem.
  Darunter `minmax(0, 1fr)`. Unter 26rem eine Spur.
- **Die zwei Pixel sind echt.** `tauri.conf.json` führt `minWidth: 960`, `minHeight: 640`. T-341s
  vier gemessene Behälterbreiten sind exakt linear in der Fensterbreite (1024 → 43,88 rem,
  992 → 41,88, 970 → 40,50, 960 → 39,88; je Δ Fenster = Δ Behälter ±0,08 px), die Messung ist also
  in sich stimmig. 40 rem − 39,88 rem = **1,92 px**, und die getragene Untergrenze lag darunter.
  Die neue Schwelle liegt 26 px darunter statt 2 px darüber.
- **Buchungen und Protokoll haben wirklich keine Klippe.** `.filterbar__controls` ist
  `display: flex; flex-wrap: wrap` (`components.css:2195`) ohne jede Schwelle — sie packt
  stufenlos. T-341s Annahme (1) trägt.
- **Die zweite Rechnung — wo A2 gilt — trägt ebenfalls.** Unterhalb von 52rem schreibt
  `app.css:4862 ff.` die Hülle auf eine Spalte um und legt die Seitenleiste als Band über den
  Kopf; im selben Block fällt `--screen-inset` auf `--space-4`. Genau damit gehen T-341s Budgets
  auf: 415 − 16 − 64 = 335 und 255 − 16 − 64 = 175. Der Befund dazu ist die **Beschriftung** der
  Tabellenzelle und der Zwischenschritt „≈ 188", nicht der Schluß.

### 3.4 Strang A — Dateihoheit

T-341 hat in seine drei Dateien geschrieben, alle in eigener Hoheit. Die vier Mutationsorte sind
**zeichengleich wiederhergestellt**, nachgeprüft und nicht geglaubt:
`features/todos/Attachments.tsx` steht nicht in `git status` und ist damit byteweise gleich HEAD;
`AttachmentOpenDialog.tsx`, `ShellStatus.tsx` und `DialogSurface.tsx` tragen im Vergleich zu HEAD
ausschließlich die `Scrim`-Änderung aus T-334, kein rohes `<div className="scrim">`; und
`proof:surface` zählt genau eine verankerte Fläche. Kein Rest.

### 3.5 Strang B, Punkt 1 — die vier Arten von Stellen

Die Einteilung ist als Zerlegung **vollständig**: außerhalb des Baums (IV), und innerhalb
gelesen (I) / eingegrenzt (II) / keines von beidem (III). Eine fünfte Art auf dem Weg gibt es
nicht. Die Zuordnung selbst ist richtig — insbesondere sitzt die Klasse tatsächlich in (III), und
die drei Ausschalter vom 2026-09-13 saßen dort. Was fehlt, ist kein Fach, sondern zwei Einträge in
(III) (Befund B-1) und das Meßwerkzeug selbst (Befund B-2).

### 3.6 Strang B, Punkt 3 — die Zahlen, von unten nachgerechnet

Aus der Ausgabe des Laufs selbst gezählt, nicht aus dem Bericht übernommen:

| | |
|---|---|
| neue Gegenproben 6h | **5** (Rumpf wartet · Block statt Ausdruck · nicht zeichengleich · nicht festgenagelte Stelle · Untergrenze) |
| neue Gegenproben 6i | **4** (Quellmodul · Prüfmodul · `import.meta` · Untergrenze) |
| neue Gegenproben 6j | **5** (Bedingung · nicht zeichengleich · fremdes Mitglied · Untergrenze · zwei Bezeichner) |
| Summe | 5 + 4 + 5 = **14** |
| eine Zeile in Abschnitt 0 | „jedes Entscheidungsmodul hat eine festgenagelte Laufzeitnamenliste, und keine zeigt ins Leere (2)" |
| **130 + 14 + 1** | = **145**, und der Lauf sagt 145 / 0 |
| `erwartet` | **110** — die Datei trägt 111 Vorkommen von `erwartet:`, eines davon in einem Kommentar (:5968); der Lauf selbst zählt „110 Einträge, 110 mit `erwartet`" |
| Gesamtzahl − `erwartet` | 145 − 110 = **35**, vorher 34 |

Die Rechnung geht ohne Rest auf.

### 3.7 Strang B, Punkt 4 — die eine Zeile in Abschnitt 0 trägt

Der Satz von 6i, den sie deckt („ein Entscheidungsmodul steht nicht unter den Modulen mit
festgenagelten Laufzeitnamen"), ist über eine eingesetzte Datei tatsächlich **nicht** erreichbar:
`DECISION_MODULES` und `MODUL_LAUFZEITNAMEN` stehen beide im Lauf, nicht im Baum; eine Gegenprobe
müßte den Lauf selbst ändern und wäre damit keine. Die Zeile prüft statt dessen beide Richtungen
der Übereinstimmung und schließt genau die Lücke, die T-342 beschreibt — ein drittes
Entscheidungsmodul, das in der einen Liste steht und in der anderen fehlt. Der Bruch der Größe
„34 → 35" ist damit begründet und einmalig. **Die Ausnahme ist berechtigt.**

### 3.8 Strang B, Punkt 5 — der berichtigte Beleg

> Ein Literal, das als Literal geprüft, aber nicht **gelesen** wird, ist eine Stelle, an der jede
> Schreibweise durchkommt.

Der Satz trägt, und er trägt mehr als der alte. Er benennt die **Art** der Stelle statt einer
Schreibweise, er nennt die Gegenmaßnahme in derselben Zeile („oder er schreibt die ungelesene
Stelle in die Lückenliste"), und er hat nachweislich drei Sätze erzeugt statt drei Namen. Daß die
alte Fassung samt Irrtum daneben stehenbleibt, ist richtig und nicht Zierde: T-335s eigener Beleg
ist heute rot, und wer den alten Satz zitiert, zitiert eine Messung von gestern.

**Eine Hälfte fehlt ihm**, und sie gehört zu Befund B-2: Die Umkehrung stimmt nicht von selbst.
Eine Stelle, die zeichengleich **gelesen** wird, ist nur so scharf wie die Liste, gegen die
verglichen wird — und die Liste liegt außerhalb des gelesenen Baums.

### 3.9 Was sonst noch geprüft und in Ordnung ist

- **Keine doppelte Fachlogik.** Beide Aufträge fassen `packages/domain` nicht an; Rundung,
  Base64 und Exportstatuswechsel sind unberührt. `proof:layers` 36/0, `proof:callers` grün,
  `boundaries` grün.
- **Keine verschluckten Fehler.** In beiden Strängen ist kein `catch` hinzugekommen, keine stille
  `null`-Rückgabe, kein Rückfall, der einen Fehlschlag in Erfolg verwandelt. Beide Wächter sind
  reine Leser und schreiben nichts; beide sind **rot bei leerer Ernte** (`proof:surface` Regel G
  Untergrenze, `proof:release-safety` Abschnitt 0) — die Gestalt, die in diesem Bestand dreimal
  still grün war.
- **Keine Transaktionsgrenze berührt.** Export und Timer-Stopp sind nicht im Umfang.
- **Typsicherheit.** Kein `any`, keine Typzusicherung in den vier Dateien; `pnpm typecheck`
  Exit 0 über alle acht Pakete samt Prüf- und E2E-Programmen.
- **Sicherheit.** Keine neue Adresse, keine neue Route, kein neuer Datenweg. Die CSP ist
  unberührt (`proof:shell-surface` grün), die eine erlaubte Verbindung nach außen unverändert
  (`proof:release-safety` Abschnitt 2 und 3 grün).
- **Deutsch und Englisch.** Oberflächentexte und Meldungen deutsch, Bezeichner englisch, die
  Regelnamen der Wächter deutsch wie im Bestand. Keine neue Oberflächenzeichenkette, also kein
  E-087-Abgleich fällig.

---

## 4 Urteil

**Strang A (T-341) — Nacharbeit.**
Blockierend ist **genau ein** Befund: `apps/web/scripts/proof-surface.mjs:356`. Regel G sichert
„jede gezeichnete Abdunklung" zu und mißt gemessen nur die, deren Klassenname als Literal im JSX
steht; eine zusätzliche, unverankerte Abdunklung als Vorlagenzeichenkette ist grün, und die
Schlußzeile behauptet trotzdem die Vollzähligkeit. Das ist die Klasse aus E-099 Punkt 3, und sie
an genau dieser Datei stehenzulassen wäre der dritte Durchgang derselben Runde. Die Behebung ist
eine Zeile plus eine Gegenprobe.

**Die beiden CSS-Änderungen sind freigegeben** und brauchen keine Nacharbeit:
`apps/web/src/styles/viewport-layout.css` (Fokusring-Reserve und E-113-Kommentar) und
`apps/web/src/styles/app.css` (Spaltenschwelle). Mechanismus, Zweck, Gegenrichtung, Kaskade und
Rechnung sind oben einzeln nachgeprüft. A-3, A-4 und A-5 sind nicht blockierend.

**Strang B (T-342) — Nacharbeit.**
Blockierend ist `apps/local-api/scripts/proof-release-safety.mjs:2201`: Die Zusage von 6i, ein
Modul komme auf genau zwei Wegen an Ungeklärtes heran, ist mit zwei Gegenproben widerlegt, beide
mit `tsc` Exit 0. Der **Lauf** ist davon nicht betroffen — 145/0 ist richtig gezählt, die 14+1
neuen Sätze sind einzeln nachgewiesen, die Einteilung in vier Arten trägt, und der berichtigte
Beleg im Kopf ist die beste Fassung, die dieser Bestand von diesem Satz hat. Blockierend ist,
daß der vorgeschlagene Wortlaut für **R-30** das Wort „geschlossen" enthält: eine falsche
Schließung im Risikoregister ist teurer als eine offene Zeile darin. Entweder die zwei Türen
zumachen (zwei Prädikate über zwei Dateien) oder sie benennen und den Wortlaut abschwächen — dann
freigegeben.

Nicht blockierend in Strang B: B-2 und B-3.

**Gegenüber dem Stand vor dieser Welle sind beide Stränge in jedem geprüften Punkt besser.** Die
Nacharbeit ist in beiden Fällen klein und betrifft in beiden Fällen dieselbe Frage — woran eine
Zusicherung ihre Menge aufspannt.

---

## 5 Offene Fragen an den Orchestrator

1. **Regel G für `.toast-layer`, `.idle-reminder` und `.skip-link`** (T-341 offene Frage 3). Aus
   meiner Sicht: erst nach der Behebung von A-1, und dann als **eine** Menge — die Frage lautet
   nicht „welche drei Klassen noch", sondern „welche Flächen sollen am Fenster hängen". Sonst
   entsteht dieselbe Namensliste eine Ebene höher.
2. **Gehört Regel G auf Dauer in `proof:surface`?** (T-341 offene Frage 4). Sie braucht denselben
   Sammler und dieselben Quellen; ich sehe keinen Grund für einen eigenen Lauf.
3. **`proof:all` ist in dieser Welle als Ganzes nicht gefahren.** Sieben portgebundene Nachweise
   stehen aus, solange T-345 die Ports hält. Sie gehören in die nächste Welle, bevor irgendetwas
   als „fertig" ins Board geht.
4. **A-A-110 / A-A-111.** T-342s offene Frage 1 steht weiter offen; ich habe sie nicht entschieden
   und bin für diesen Bericht dem Bedrohungsmodell 43.9 gefolgt, wie T-342 es getan hat.
5. **Die Differenz „Gesamtzahl minus `erwartet`" ist jetzt 35.** Wenn sie irgendwo als Prüfgröße
   geführt wird, ist sie dort nachzuziehen (T-342 offene Frage 3) — ich habe im Baum keine Stelle
   gefunden, die sie führt.

---

```
Aufgabe: T-346 — Freigaberunde über T-341 (Oberfläche) und T-342 (Wächter)
Status: fertig — beide Stränge Nacharbeit, je ein blockierender Befund
Artefakte: .claude/team/reports/T-346-code-reviewer.md
Zusammenfassung: Beide Stränge sind gegen den Baum gemessen und nicht gegen ihre Berichte.
  Gefahren sind typecheck, boundaries, contrast, build, test:coverage, test:rust, audit und
  fünfzehn einzelne Nachweisläufe, alle Exit 0 — darunter proof:surface 34/0 und
  proof:release-safety 145/0, beide zahlengleich mit den Berichten. Nicht gefahren, Ports
  vergeben: verify:bundle und test:e2e, dazu die sieben Nachweise, die 17843 binden; 17843,
  17844 und 5173 waren während der ganzen Runde von T-345 belegt. In Strang A halten Mechanismus
  und Zweck der Fokusring-Reserve: der negative Rand neutralisiert das Polster, die Klippkante
  wandert um 4 px (5 px unter `prefers-contrast: more`), und sie hat dafür Platz, weil
  `.screen` 24 px oberen Innenabstand trägt und `.app__main` mit `padding: 0` darüber nichts
  wegschneidet; zwischen zwei benachbarten festen Teilen bleiben 12 bzw. 10 px, was T-341s
  gemessene „bookings 12/10" ohne Rest erklärt. Die Gegenrichtung ist leer — die Klippkante
  wächst nur. Die Spaltenschwelle ist nachgerechnet (4 × 9rem + 3 × 0,75rem = 38,25 rem,
  `--space-3` von der Dichte unberührt), `minmax(9rem, …)` kann an keiner der vier Stufen
  überlaufen, und die „zwei Pixel" sind echt: T-341s vier Behälterbreiten sind exakt linear,
  40 rem − 39,88 rem = 1,92 px an der getragenen Untergrenze aus `tauri.conf.json`.
  **Regel G aber ist an den vier Mutationen aufgespannt, die der Autor in der Hand hatte, nicht
  an „jeder gezeichneten Abdunklung":** `classTokensOf` liest den Kopf einer Vorlagenzeichenkette
  nicht, gemessen durch dieselbe Funktion wie der Bestand — eine zusätzliche, unverankerte
  Abdunklung als ``className={`scrim ${x}`}`` ist grün, während die Schlußzeile weiter „1 von 1
  verankert" behauptet; die Gestalt steht heute schon im Baum. In Strang B gehen die Zahlen von
  unten auf (5+4+5 Gegenproben plus eine Zeile in Abschnitt 0, 130 + 15 = 145, `erwartet` 110,
  Differenz 35), die Einteilung in vier Arten von Stellen ist als Zerlegung vollständig, die
  Ausnahme in Abschnitt 0 ist berechtigt, und der berichtigte Beleg trägt. **6i trägt seine
  Zusage nicht:** zwei weitere Türen, beide mit tsc Exit 0 und beide für Gestalt 5 und 6i
  unsichtbar — die Konstruktorkette `({}).constructor.constructor("return globalThis")()` (freie
  Namen [], Importquellen []) und eine Einfuhr als Aufruf mit berechneter Quelle.
Annahmen: (1) Ich habe die sieben portgebundenen Nachweise und verify:bundle nicht gefahren, weil
  17843/17844 von T-345 gehalten werden; „nicht gefahren" heißt nicht gemessen, und ich habe
  keinen fremden Prozeß beendet, um zu messen. (2) Die Nummern A-A-110/A-A-111 habe ich nicht
  entschieden, sondern bin dem Bedrohungsmodell 43.9 gefolgt wie T-342. (3) Die Blockade in
  Strang B habe ich am **Wortlaut für risks.md** festgemacht und nicht am Lauf: 145/0 ist
  richtig; falsch wäre erst die Zeile „die Menge der Türen ist geschlossen" im Risikoregister.
Risiken: `proof:all` ist als Ganzes in dieser Welle nicht nachgewiesen — sieben Läufe stehen aus.
  Sicherheitsseitig ist in beiden Strängen nichts Neues: keine Adresse, keine Route, kein
  Datenweg; beide Wächter lesen nur. Die beiden gemessenen Türen von 6i verlangen fremden Code in
  genau zwei Dateien und sind damit dieselbe Klasse wie die Ausschalter, gegen die dieser Lauf
  geschrieben ist — kein Bestandsfehler, aber eine Zusage, die weiter reicht als ihre Messung.
Offene Fragen: (1) Regel G für toast-layer/idle-reminder/skip-link — erst nach A-1 und dann als
  eine Menge, nicht als drei Namen. (2) Bleibt Regel G in proof:surface? Aus meiner Sicht ja.
  (3) Die sieben portgebundenen Nachweise in die nächste Welle. (4) A-A-110/A-A-111 einmal
  festlegen. (5) Die Prüfgröße 34 → 35 — ich habe im Baum keine Stelle gefunden, die sie führt.
Nächster Schritt: (a) frontend-dev: eine Zeile in `classTokensOf` (Vorlagenzeichenkettenteile)
  plus eine fünfzehnte Gegenprobengestalt, dann proof:surface erneut — erwartet 35/0. (b)
  domain-dev: die zwei Türen von 6i zumachen (zwei Prädikate über zwei Dateien) oder benennen und
  den R-30-Wortlaut abschwächen. (c) Orchestrator: die drei niedrigen Berichtsbefunde in
  T-341 §3.5 und in der Dateitabelle berichtigen lassen. (d) Nach T-345: die sieben
  portgebundenen Nachweise und verify:bundle nachholen.
```
