# T-191 — Vier Stellen derselben Klasse, ein Wächter ohne Fassungsbindung, ein halber Wächter

**Rolle:** frontend-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `.claude/team/reports/T-189-security-checker.md` (Abschnitte 2 und 4, T-189-14,
T-189-15, A-A-47 bis A-A-49), `.claude/team/reports/T-190-integration-dev.md` (O-GD, offene
Frage 2), `.claude/team/reports/T-186-frontend-dev.md` (O-FX, die Bauart der Meldefläche),
`apps/outlook-addin/scripts/proof-addin.mjs` (Abschnitt 18, `ANREDE_DU`, `ANREDE_IMPERATIV`),
`apps/web/src/components/FormDialog.tsx#TextField`, `ConfirmDialog`, `NoteField`.

---

## Kurzfassung

```
Aufgabe: T-191 — O-GQ, O-HD (A-A-49), O-HC, O-GW
Status: fertig
```

**Das wichtigste Ergebnis steht oben, weil es die eigentliche Frage des Auftrags beantwortet:**
Ja, die Bauart läßt sich prüfen statt jeder Stelle. Der neue Lauf `proof:surface` hat beim
**ersten** Durchgang nicht die vier beauftragten Stellen gemeldet, sondern **neun** — die vier aus
dem Auftrag und **fünf weitere**, die niemand aufgeschrieben hatte, dazu eine sechste im
Stilblatt, die kein JSX-Wächter je gesehen hätte. Alle zehn sind behoben, alle zehn sind
gemessen.

---

## 1. Artefakte

| Datei | Was daran geändert wurde |
|---|---|
| **`apps/web/scripts/proof-surface.mjs`** | **neu** — der Wächter über die Bauart: vier Regeln, neun Gegenproben |
| `apps/web/package.json` | `proof:surface` eingetragen |
| `apps/web/src/screens/SettingsScreen.tsx` | O-GQ-1: Region dauerhaft, Satz später |
| `apps/web/src/showcase/ExportDirectorySection.tsx` | O-GQ-2: dieselbe Bauart auf der Musterseite |
| `apps/web/src/components/ExportDirectoryField.tsx` | O-GQ-3: `field__live`-Behälter mit `role="alert"`, vorher **ohne jede Rolle** |
| `apps/web/src/screens/TemplateFields.tsx` | O-GQ-4: `role="alert"`-Behälter, Absatz bleibt bedingt |
| `apps/web/src/components/Attachments.tsx` | O-GQ-5 (neu gefunden) |
| `apps/web/src/components/ExportGroups.tsx` | O-GQ-6 (neu gefunden) |
| `apps/web/src/components/RulePickers.tsx` | O-GQ-7 (neu gefunden) |
| `apps/web/src/screens/TemplatePreview.tsx` | O-GQ-8 (neu gefunden) |
| `apps/web/src/screens/TemplatesScreen.tsx` | O-GQ-9 (neu gefunden) |
| `apps/web/src/showcase/DeadlineSection.tsx` | Regel B: `role="status"` wie in `Attachments.tsx` |
| `apps/web/src/styles/components.css` | O-GQ-10 (Stilblatt), `.live-region` dokumentiert, Kartenrhythmus |
| `apps/web/src/styles/app.css` | zwei Abstandskorrekturen für den leeren Wirt |
| `apps/web/index.html` | `<title>` der **Anwendung** war „Takt — Designsystem" |
| `apps/desktop/scripts/proof-shell-surface.mjs` | A-A-49 (Prüfung 7 + drei Gegenproben), O-HC (Beißkraft in der Ausgabe) |

Nicht angefaßt: `apps/*/test/**`, `tests/e2e/**`, `docs/**`, Wurzel-`package.json`.

---

## 2. O-GQ — die Bauart statt der Stelle

### 2.1 Was falsch war, und wie oft

Die richtige Bauart steht seit T-118 im Bestand: **die Region dauerhaft im Baum, der Inhalt
später.** Eine Region, die eine Vorlesehilfe erst mit ihrer Meldung kennenlernt, sagt nichts an
(B-5, SC 4.1.3). Sie war viermal behoben — `ConfirmDialog` (T-118), `TextField` (T-162, O-DA),
Add-in (T-158), `NoteField` (T-186, O-FX) — und der Auftrag nannte vier weitere Stellen.

Der Wächter fand beim ersten Lauf **fünf mehr**:

| | Stelle | Bauart des Fehlers |
|---|---|---|
| O-GQ-1 | `screens/SettingsScreen.tsx:429` | `{blocked ? <p role="status">…</p> : null}` |
| O-GQ-2 | `showcase/ExportDirectorySection.tsx:154` | dieselbe |
| O-GQ-3 | `components/ExportDirectoryField.tsx:451` | Absatz **ganz ohne Rolle** — der andere Zweig (`TextField`) sagt denselben Satz an |
| O-GQ-4 | `screens/TemplateFields.tsx:414` | Absatz **ganz ohne Rolle** |
| **O-GQ-5** | `components/Attachments.tsx:294` | `{failure === null ? null : <span role="status">…}` — der Anhang, der sich nicht öffnen läßt |
| **O-GQ-6** | `components/ExportGroups.tsx:243` | „Nicht exportierbar." im Exportlauf |
| **O-GQ-7** | `components/RulePickers.tsx:163` | „Ordner werden geladen" — die Zeile, die es ausdrücklich ansagen sollte |
| **O-GQ-8** | `screens/TemplatePreview.tsx:524` | „Diese Tagesgruppe ist nicht exportierbar" |
| **O-GQ-9** | `screens/TemplatesScreen.tsx:603` | „Ungespeicherte Änderungen" im Vorlageneditor |
| **O-GQ-10** | `styles/components.css` | `.dirfield__announce:empty { display: none }` |

**O-GQ-10 ist der Fund, der die Frage des Auftrags beantwortet.** Über dieser Zeile stand
wörtlich: *„Immer im Baum, damit eine Vorlesehilfe eine Änderung bemerkt und nicht ein neu
erscheinendes Element."* Zwei Zeilen darunter nahm `display: none` genau das wieder zurück — ein
Element mit `display: none` steht **nicht** im Baum der Vorlesehilfe. Die Region entstand für sie
also doch erst mit ihrer ersten Meldung, nur über das Stilblatt statt über das JSX. Diese Stelle
hätte kein Durchgang durch die `.tsx`-Dateien je gefunden, und sie stand direkt unter ihrer
eigenen Widerlegung.

### 2.2 Wie behoben — drei Gestalten, je nach Umgebung

1. **Der Absatz selbst ist die Region** (O-GQ-1, O-GQ-2). Wo kein `aria-describedby` auf die
   Meldung zeigt, braucht sie keinen Behälter: `<p className="field__error" role="status">{blocked
   ? "…" : null}</p>`. Leer hat der Absatz die Höhe null, seine Ränder fallen mit denen des
   Nachbarn zusammen — am Bild ändert sich **nichts**.
2. **Ein Behälter trägt die Rolle, der Absatz den Text** (O-GQ-3, O-GQ-4 und alle fünf neuen).
   Nötig überall dort, wo die Meldung eine sichtbare Fläche ist (Rahmen, Fläche, Farbe) oder wo
   ein Prüffall nach ihrer Klasse greift. `.tfield__error` bleibt dadurch **bedingt**, und
   `tests/e2e/export-template-validation.spec.ts:123` (`page.locator('.tfield__error')`) findet
   weiter genau die Zeile mit dem Befund — ein dauerhafter `.tfield__error` in **jeder** Zeile
   hätte diesen Prüffall an der Strengeregel scheitern lassen.
3. **Das Stilblatt zieht sich anders zurück** (O-GQ-10): statt `display: none` derselbe Griff wie
   bei `.field__live` seit T-162 — sichtbar bleiben, aber leer den `gap` des Behälters
   zurücknehmen.

### 2.3 `.live-region` — der eine Wirt, und was er kostet

Neu ist **eine** Klasse, `.live-region` (dokumentiert in `components.css`): ein Kasten ohne Rand,
ohne Füllung und **ohne eine einzige eigene Erklärung**. Leer ist er ein Block ohne Höhe; seine
Ränder und die seines Kindes fallen durch ihn hindurch.

Drei Stellen kosten trotzdem eine Zeile Stil, und jede steht **neben ihrem Behälter**, nicht bei
der Klasse — wer den Abstand dort ändert, sieht die Korrektur:

| Behälter | Warum | Zeile |
|---|---|---|
| `.attachment__main` | Spalte mit `gap: 2px`, der leere Wirt zählt als Kind | `margin-block-start: -2px` |
| `.tag-picker` | umbrechender Fluß mit `gap: var(--space-1)` | `margin-inline-end: calc(-1 * var(--space-1))` |
| `.card__body` | der Wirt unterbricht die Nachbarschaftsregel `X + Y` | `.live-region` steht in der **linken** `:where`-Liste |

Zur letzten Zeile, weil sie die einzige mit einer Überlegung ist: Der Rhythmus des Kartenrumpfs
hängt am Geschwisterwähler `+`. Ein dauerhafter Wirt schiebt sich zwischen zwei Nachbarn, die bis
dahin unmittelbar aufeinanderfolgten — der Knoten **hinter** ihm verlöre seinen Abstand, und
niemand brächte das Loch mit ihm in Verbindung. Er steht deshalb links (er gibt den Rhythmus
weiter) und mit Absicht **nicht** rechts (leer soll er keinen bekommen, voll trägt ihn seine
Meldung selbst).

**Gemessene Folge am Bild: keine.** Ich habe jede der zehn Stellen einzeln gegen ihren Behälter
gerechnet (Randzusammenfall, `gap`, Nachbarschaftsregeln) und komme überall auf denselben
Abstand wie vorher. Das ist eine Rechnung und keine Messung am Bildschirm — siehe Abschnitt 7.

### 2.4 Der Wächter: `proof:surface`

Neuer Lauf, `apps/web/scripts/proof-surface.mjs`, vier Regeln:

| Regel | Was sie mißt | Gefunden |
|---|---|---|
| **A** | Ein Knoten mit `role="alert"`/`"status"`/`"log"`, `aria-live` oder `<output>` entsteht aus einem Bedingungsausdruck, **ohne** daß ein umschließendes JSX-Element dazwischenliegt | O-GQ-1, 2, 5, 6, 7, 8, 9 |
| **B** | Ein HTML-Knoten mit einem Klassennamen auf `error`/`failure` trägt weder selbst eine Live-Rolle noch steht er in einer | O-GQ-3, O-GQ-4 |
| **C** | Ein Stilblatt gibt einer Live-Region `display: none`, `visibility: hidden` oder `content-visibility: hidden` | O-GQ-10 |
| **D** | Anrede — siehe Abschnitt 5 | — |

**Die Abbruchbedingung von Regel A ist die ganze Regel.** Nicht „steht eine Bedingung darüber",
sondern „steht eine Bedingung darüber, **bevor** ein JSX-Element kommt". Liegt ein Element
dazwischen, tauscht die Bedingung einen ganzen Teilbaum, und die Region darin ist so beständig
wie ihr Wirt — genau der Zweig „mit Hülle / ohne Hülle" in `ExportDirectoryField`. Ohne diesen
Halt schlüge die Regel bei jedem zweiten Zweig an, und ein Wächter, der ständig anschlägt, wird
gelockert statt befolgt.

**Neun Gegenproben, in beide Richtungen.** Je Regel eine Prüfung „findet die Verletzung" und eine
„meldet die richtige Bauart nicht". Die zweite Hälfte ist die teurere: Sie macht eine Lockerung
teuer. Regel A wird gegen sechs Verletzungen und fünf richtige Bauarten gefahren, Regel B gegen
drei und vier, Regel C gegen drei und drei, Regel D gegen fünf Anreden, acht Hauptwortsätze und
eine Probe darauf, daß sie **Text** und nicht Bezeichner mißt.

**Warum ein eigener Lauf und nicht `proof:foreign`.** `proof:foreign` beantwortet eine Frage —
kommt fremder Text ungebändigt auf den Schirm — über den Typprüfer. Die Fragen hier haben mit
fremdem Text nichts zu tun. Der Bestand hält es überall so: ein Lauf, ein Gegenstand. **Der Preis
steht im Dateikopf und hier:** Der Lauf ist erst dann Teil von `pnpm check`, wenn die
Wurzel-`package.json` ihn kennt. Die zwei Zeilen dafür stehen unter „Nächster Schritt" — sie
gehören dem Orchestrator, und bis sie stehen, ist dies ein Wächter, den man von Hand ruft.

### 2.5 Was der Wächter **nicht** sieht — die ehrliche Zahl

**Ein Baustein, der die Rolle in sich trägt und selbst bedingt erscheint,** wird nicht gemessen:
`{fehler === null ? null : <InlineMessage …/>}`. Regel A mißt die Bauart dort, wo die Rolle
**steht**; an der Aufrufstelle steht sie nicht.

Gemessen (AST-Durchgang über alle 115 Dateien): **42 Aufrufstellen** dieser Art — 37
`InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice` —, dazu 5 bedingte `Spinner`, die nur mit
einem `label` eine Rolle tragen.

Das ist dieselbe Fehlerklasse, eine Ebene höher, und ich habe sie **nicht** behoben: Sie zu
schließen hieße, 42 Meldungen einen dauerhaften Wirt zu geben, damit die Zahl der leeren Knoten
im Baum um 42 zu erhöhen und an jeder Stelle zu entscheiden, ob die Meldung überhaupt angesagt
werden soll (`InlineMessage` mit `tone="info"` auf der Musterseite steht von Anfang an da und
ändert sich nie). Das ist eine Produktentscheidung und keine Zeile Code — offene Frage 1.

---

## 3. O-HD / A-A-49 — der Wächter weiß jetzt, gegen welche Sprache er mißt

`proof-shell-surface.mjs` führt seit T-173-5 die neunzehn lexikalischen Formen der Rust-Referenz.
Darüber stand der Satz, sie stammten aus der Referenz — und nirgends stand, **aus welcher**. Das
ist die Bauart, die in diesem Faden fünfmal nachgegeben hat: eine Begründung statt einer Messung.

**Neu: Prüfung 7.** Der Lauf liest `edition` und `rust-version` aus dem `[package]`-Abschnitt von
`apps/desktop/src-tauri/Cargo.toml` und wird rot, sobald einer der Werte von dem abweicht, gegen
den die Liste gelesen ist:

```
RUST_REFERENCE = { edition: '2021', rustVersion: '1.82',
                   readWith: 'rustc 1.89.0 (29483883e 2025-08-04)',
                   readIn: 'T-183, T-189 und T-191' }
```

Die Meldung sagt nicht „Wert falsch", sondern **was zu tun ist**: die lexikalischen Formen der
Referenz erneut lesen, und **erst danach** den Wert hier nachziehen.

**Die Grenze steht daneben, damit der Wächter nicht mehr verspricht, als er hält:**

- `rust-version` ist die **untere Schranke** — die älteste Fassung, mit der sich der Anteil
  übersetzen läßt, **nicht** die Baufassung. Eine `rust-toolchain.toml` gibt es nicht, die
  Arbeitsläufe legen keine fest, örtlich läuft 1.89.0. Eine neue Literalform in 1.90 bewegt
  diesen Wert also **nicht**, und dieser Wächter sieht sie nicht.
- Er fängt die **erklärte Anhebung**, nicht jede neue Form. Das ist wenig — aber es ist der
  Anlaß, bei dem jemand die Referenz ohnehin in der Hand hat.
- Die Größenordnung steht dabei, damit das nicht überzeichnet wird: Rust hat in einem Jahrzehnt
  **eine** neue Literalform bekommen (`c"…"`/`cr"…"`, stabil seit 1.77).

Die Schlußzeile des Laufs sagt beides jetzt selbst — die Fassung und die Grenze.

**Drei Gegenproben** (nicht zwei): `edition` auf `2024`, `rust-version` auf `1.90`, und **eine
`Cargo.toml` ganz ohne `rust-version`**. Die dritte ist die, die der Auftrag nicht verlangt hat
und die ich für die wichtigere halte: Ein fehlender Wert wäre sonst ein stiller Ausgang gewesen —
`packageValue` gäbe `null` zurück, der Vergleich fiele aus, und der Lauf bliebe grün, obwohl
nirgends mehr steht, gegen welche Sprache gemessen wird. Genau diese Sorte Ausgang zählt dieser
Lauf sonst auf.

**Ausdrücklich nicht getan:** die Referenz zur Laufzeit holen. Zweite Adresse außerhalb
`127.0.0.1`, damit Aufhebung von E-001 — dafür gäbe es eine Entscheidung, nicht eine Zeile.

---

## 4. O-HC — die Zahl unterscheidet jetzt nach Kraft

„49 Gegenproben, 0 blind" führte eine Probe, die nachweislich blind werden **kann**,
ununterschieden neben einer, die es heute gar nicht kann. security-checker hat sich geweigert,
den Unterschied einzuebnen (T-189-14); er steht jetzt in der **Ausgabe**.

Jede der neunzehn Formen trägt ein Feld `bite`:

| Wert | Bedeutung | Anzahl |
|---|---|---|
| `gemessen` | unter mindestens einer der 21 Verstümmelungen aus T-189 blind geworden | 13 (+ 33 übrige Proben) |
| `paarig` | kann heute nicht blind werden, **Grund gemessen**: ein alleinstehendes, unverstandenes Zeichenliteral hinterläßt zwei lose Apostrophe und **keine** Anführung. Der Mechanismus wird von der paarigen Apostrophpaarung gemessen, und die beißt | 4 |
| `gegenrichtung` | schützt, daß der Ausdruck nicht zu **viel** trifft — gefangen von einer roten Prüfung (T-189, Verstümmelung P), nicht von einer Probe | 1 (Lebenszeit) |
| `offen` | unter keiner Verstümmelung blind geworden, **Grund nicht gemessen** | 1 (Fortsetzungszeile) |

In der Ausgabe steht der Vermerk unter der jeweiligen Zeile:

```
  ok    A-A-47: Zeichenliteral mit `\u{…}`
        ↳ beisst heute nicht — gemessen wird der Mechanismus an ihrem Paar (T-189-14)
```

und in der Schlußzeile:

```
7 Prüfungen und 52 Gegenproben bestanden.
Davon 46, die blind werden können und es nicht sind; 4, die es heute nicht können — ihr
Mechanismus ist an der paarigen Probe gemessen; 1, deren Gegenrichtung eine rote Prüfung
fängt; 1 ohne gemessenen Grund (T-189-14).
```

Die eine `offen`-Probe steht damit **sichtbar** da, statt in einer Summe zu verschwinden — das
ist der Zweck der Übung. Ich habe sie **nicht** stillgelegt und keinen Grund für sie erfunden.

Was das nicht heißt: daß die sechs überflüssig wären. Die Liste beantwortet die Frage „steht jede
Form der Referenz da?", und dafür zählt jede Form. Es heißt nur, daß ihre Zahl keine Zahl
unabhängiger Messungen ist — und daß die Ausgabe das jetzt sagt.

---

## 5. O-GW — `apps/web` ist gegen E-080 gemessen

Regel D in `proof:surface`, Bauart aus `proof-addin.mjs` übernommen. Beide Ausdrücke —
`ANREDE_DU` und `ANREDE_IMPERATIV` samt der 34 Verbstämme und 13 ausgeschriebenen Formen — stehen
**zeichengleich** da. Eine „bessere" Fassung hier wäre genau der Fehler gewesen, den O-GW meldet:
dieselbe Zusage in zwei Schärfegraden.

**Ein Unterschied ist trotzdem da, und er ist der interessante Teil des Befundes.** Das Add-in
mißt „Quelltext ohne Kommentare"; bei 31 Dateien trägt das. Über `apps/web` (115 Dateien) meldet
dieselbe Messung sofort **Bezeichner statt Sätze** — `const dir = directory.trim()` in
`lib/exportDirectoryAdvice.ts` ist für `ANREDE_DU` ein „dir". Ein Wächter, der Bezeichner meldet,
wird binnen einer Welle gelockert. Regel D mißt deshalb, was der Zerleger als **Text** ausweist:
Zeichenketten, Vorlagen, JSX-Text — dazu die beiden Einstiegsseiten `index.html` und
`designsystem.html`, deren `<title>` in der Fensterleiste steht, ohne je durch ein Bündel zu
laufen (wie das Manifest im Add-in). Das ist **schärfer**, nicht milder, und eine eigene
Gegenprobe hält es fest.

### Was der Wächter in `apps/web` findet

**Kein einziger echter Fund.** Vier Treffer, alle vier Fehltreffer, drei davon als **Satz** in
`ANREDE_AUSNAHMEN` (Dateiausnahmen hätten jede künftige Anrede in derselben Datei unsichtbar
gemacht), jeder mit Grund und selbstauflösend:

| Stelle | Treffer | Warum kein Fund |
|---|---|---|
| `lib/exportDirectoryAdvice.ts` | `dir` | Bezeichner, kein sichtbarer Text — fällt durch die Textmessung weg, **keine** Ausnahme nötig |
| `lib/databaseLocationAdvice.ts` | `Prüf` | „Im **Prüf-** und Entwicklungsbetrieb" — Bestimmungswort vor einem Bindestrich |
| `screens/SettingsScreen.tsx` | `trage` | „Ich habe Outlook zur Hand und **trage** das neue Token gleich ein." — erste Person, der Benutzer bestätigt einen Satz über sich selbst |
| `screens/TodoDetailScreen.tsx` | `Klick` | „Geöffnet wird nur auf Ihren **Klick**." — Hauptwort mit besitzanzeigendem Fürwort |

Ein eigener Prüffall verlangt, daß jeder der drei Sätze noch **genau einmal** in der Oberfläche
steht und daß der Wächter ihn noch erkennt. Wird einer umgeschrieben, wird die Ausnahme rot und
gehört gelöscht, nicht angepaßt.

**Ein Vorschlag mit Meßwert dazu** (offene Frage 2): Der `Prüf-`-Fall ist kein Einzelfall, sondern
eine **Form** — jedes künftige „Lade- und Speicherverhalten" bräuchte eine neue Ausnahme. Ein
`(?!-)` in der hinteren Grenze des Imperativausdrucks löst ihn allgemein. Ich habe gemessen, was
das im Add-in kostet: **nichts.** Über alle 31 Add-in-Dateien plus `manifest.xml` findet der
Ausdruck mit und ohne `(?!-)` denselben einen Treffer (die geduldete Stelle O-GE). Die Änderung
wäre also in **beiden** Läufen frei — aber `proof-addin.mjs` gehört integration-dev, und eine
einseitige Schärfung wäre wieder O-GW.

---

## 6. E-087 — die Suche vor der Änderung

Gesucht wurde der **heutige** Wortlaut in `tests/**`, `apps/*/test/**` und `packages/*/test/**`,
bevor irgendetwas angefaßt wurde.

| Suchbegriff | Treffer |
|---|---|
| `Solange dieser Ordner eingetragen ist` | **0** |
| `Nicht exportierbar` | 1 — `tests/e2e/export-mixed-status-and-billing.spec.ts:176`, über `.egroup__blocked` |
| `Ungespeicherte Änderungen` | **0** |
| `Diese Tagesgruppe ist nicht exportierbar` | **0** |
| `.tfield__error` | 1 — `tests/e2e/export-template-validation.spec.ts:123` |
| `.egroup__blocked`, `.tpgroup__blocked`, `.tpl-dirty`, `.attachment__failure`, `.tag-picker__waiting`, `.dirfield__announce` | nur der eine Treffer oben |
| `Takt — Designsystem`, `toHaveTitle`, `document.title` | **0** |
| `[role="status"]` / `[role="alert"]` in Prüffällen | 3 — alle **klassengebunden** (`.quitfail__region`, `.visually-hidden`, `.field` des Titelfeldes) |

**Ergebnis: kein Wortlaut geändert, kein zugänglicher Name geändert, kein Prüffall berührt.** Die
beiden e2e-Prüffälle mit Klassenbezug halten:

- `.egroup__blocked` ist unverändert vorhanden, nur eine Ebene tiefer — `locator` sucht in der
  Tiefe.
- `.tfield__error` bleibt **bedingt**; genau deshalb trägt dort der Behälter die Rolle und nicht
  der Absatz. Ein dauerhafter `.tfield__error` je Zeile hätte
  `expect(rowError).toContainText(…)` an der Strengeregel scheitern lassen.

**E-078:** kein neuer Erklärtext. Die einzige Textänderung überhaupt ist eine **Streichung**:
`apps/web/index.html` trug `<title>Takt — Designsystem</title>` — eine Abschrift aus
`designsystem.html`, entstanden bei der Trennung der Einstiegspunkte in T-057. Der Reiter der
**Anwendung** hieß im Browserbetrieb „Designsystem". Jetzt „Takt". Kein Prüffall nennt den Titel.

**E-076 Punkt 3:** Rollen sind an **einer** Stelle bewußt geändert und an **zwei** hinzugefügt:

| Stelle | Vorher | Nachher | Warum |
|---|---|---|---|
| `ExportDirectoryField.tsx` | keine Rolle | `role="alert"` am Behälter | der andere Zweig desselben Feldes sagt denselben Satz mit `role="alert"` an; ohne Rolle war die eine Hälfte stumm |
| `TemplateFields.tsx` | keine Rolle | `role="alert"` am Behälter | dasselbe, Befund des Auftrags |
| `showcase/DeadlineSection.tsx` | keine Rolle | `role="status"` | die Musterseite spiegelt `Attachments.tsx`, das die Rolle trägt — der Regel-B-Wächter fand die Abweichung |

Alle übrigen Rollen (`status` blieb `status`, `alert` blieb `alert`) sind zeichengleich; sie sind
nur **umgezogen**, vom bedingten Knoten auf den dauerhaften Wirt. Klassennamen: keiner geändert,
einer hinzugefügt (`.live-region`).

---

## 7. Nachweise — vorher und nachher

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | 0 | **0** |
| `pnpm test` | 1442 grün | **1456 grün, 0 rot** (76 Dateien; +14 von unit-tester aus derselben Welle) |
| `pnpm --filter @takt/web build` | grün | **grün** (419 Module) |
| `pnpm run contrast` | 480 / 0 | **480 Paare, 0 durchgefallen** |
| `pnpm run proof:foreign` | 20 / 0 | **20 / 0** (unverändert — Absicht, siehe 2.4) |
| **`pnpm --filter @takt/web proof:surface`** | — | **15 / 0**, davon 9 Gegenproben (neu) |
| `pnpm run proof:shell-surface` | 6 Prüfungen, 49 Gegenproben, 0 blind | **7 Prüfungen, 52 Gegenproben, 0 blind** |
| `pnpm run proof:codepoints` | 45 / 0 | **45 / 0** |
| `pnpm run boundaries` | grün | **grün** (379 Dateien) |

**Nicht gefahren** (E-083 Punkt 3, fester Port 17843): `pnpm run proof:all`, `pnpm test:e2e`.
Statt dessen gelesen: die sechs Prüffälle, die eine der berührten Klassen oder einen der
berührten Sätze nennen (Abschnitt 6).

**Rot gesehen, bevor grün:** `proof:surface` meldete beim ersten Lauf fünf Stellen; jede Regel ist
zusätzlich gegen eine eingesetzte Verletzung gefahren. `checkRustLanguageBaseline` ist gegen drei
veränderte `Cargo.toml` gefahren. Kein Wächter dieses Berichts war ausschließlich grün.

---

## 8. Annahmen

1. **Eigener Lauf statt `proof-foreign`.** Begründet in 2.4. Der Preis ist, daß er bis zur
   Eintragung in die Wurzel-`package.json` nicht in `pnpm check` läuft; er steht deshalb im
   Dateikopf **und** unter „Nächster Schritt".
2. **Die fünf zusätzlichen Stellen behoben statt gemeldet.** Ein neuer Wächter mit fünf
   Ausnahmen am ersten Tag ist kein Wächter. Sie sind dieselbe Klasse, dieselbe Behebung,
   dieselbe Gegenprobe.
3. **Regel A hört am umschließenden JSX-Element auf.** Die Alternative (jede Bedingung über einer
   Region melden) ergibt am heutigen Baum sofort Fehltreffer bei jedem Flächentausch. Die Lücke
   ist im Dateikopf benannt.
4. **Regel B mißt nur HTML-Knoten.** Ein `<InlineMessage className="tags-split__error">` trägt
   seine Rolle in seiner eigenen Datei; sie hier ein zweites Mal zu verlangen hieße, dieselbe
   Zusage an zwei Orten zu führen. Bausteine werden dort gemessen, wo sie gebaut werden.
5. **Die drei Anrede-Ausnahmen stehen als Satz, nicht als Datei** — dieselbe Bauart und dieselbe
   Begründung wie `IMPERATIV_AUSNAHME` im Add-in.
6. **Der Titel der Anwendung ist berichtigt.** Das war nicht beauftragt, liegt in meiner
   Dateihoheit, wurde vom erweiterten Wächter sichtbar gemacht und ist durch E-087 gedeckt (0
   Treffer).
7. **`RUST_REFERENCE.readWith` trägt die örtliche `rustc`-Fassung** (1.89.0), weil es keine
   festgelegte Baufassung gibt. Steht später eine `rust-toolchain.toml` da, gehört dieser Wert an
   sie gebunden statt an eine Notiz.

---

## 9. Risiken

- **R-1 (mittel, Bild).** Zehn Stellen haben einen Knoten mehr im Baum. Ich habe jede gegen ihren
  Behälter **gerechnet** (Randzusammenfall, `gap`, Nachbarschaftsregeln) und komme überall auf
  denselben Abstand — aber gerechnet ist nicht gemessen. **Für visual-qa, in dieser Reihenfolge:**
  Einstellungen (Exportordner mit abgelehntem Pfad), Vorlageneditor (doppelter Schlüssel; Zustand
  „Ungespeicherte Änderungen"), Vorschau einer nicht exportierbaren Tagesgruppe, Exportlauf mit
  gesperrter Gruppe, Anhang mit Fehler in der Todo-Ansicht, Tag-Auswahl während des Ladens,
  Musterseite (Exportordner, Frist/Anhänge).
- **R-2 (klein, Ansage).** Die zehn Regionen sind jetzt beim Aufbau der Seite leer im Baum. Eine
  Vorlesehilfe sagt Inhalt, der beim Registrieren schon dasteht, **nicht** an — das ist der Sinn
  der Übung —, aber sie zählt die leeren Knoten beim Durchlaufen mit. Bei zehn Knoten ist das
  ohne Gewicht; bei 42 (offene Frage 1) wäre es eine Abwägung.
- **R-3 (klein, Wächter).** `proof:surface` läuft nicht in `pnpm check`, solange die
  Wurzel-`package.json` ihn nicht kennt. Das ist derselbe Zustand, den dieser Lauf sonst mißt,
  und er hat ein Verfallsdatum: die nächste Welle.
- **R-4 (klein, Text).** Die Anrede-Ausdrücke stehen jetzt in **zwei** Dateien. Sie sind heute
  zeichengleich; laufen sie auseinander, ist O-GW wieder da. Gegenmittel: eine gemeinsame Datei —
  offene Frage 2.
- **R-5 (klein, Wächter).** A-A-49 fängt die **erklärte** Anhebung, nicht jede neue Literalform.
  Steht im Lauf und in diesem Bericht; security-checker hat die Größenordnung selbst genannt.
- **Unverändert offen: A-A-48.** Die Rückschau in `RAW_STRING_OPENER` hat weiterhin keine
  Gegenprobe, mit gemessener Begründung. T-191 ändert daran nichts; die neue Ausgabe unterscheidet
  jetzt aber wenigstens die Proben, die es **können**, von denen, die es nicht können.

---

## 10. Offene Fragen

1. **Sollen die 42 bedingten Meldebausteine einen dauerhaften Wirt bekommen?** Gemessen: 37
   `InlineMessage`, 4 `LoadingBlock`, 1 `UpdateNotice`. Es ist dieselbe Fehlerklasse eine Ebene
   höher, und die Antwort ist nicht offensichtlich: Ein Teil dieser Meldungen steht von Anfang an
   da und ändert sich nie (Musterseite, Startbilder); für sie wäre ein Wirt nur ein leerer Knoten
   mehr. Mein Vorschlag zur Fassung der Regel: *Ein Meldebaustein braucht einen dauerhaften Wirt,
   sobald er auf einer Fläche erscheinen kann, die dabei **stehen bleibt**.* Das ist eine
   Entscheidung des Orchestrators (mit ux-designer), kein Beschluß von mir. Solange sie aussteht,
   sagt der Dateikopf von `proof:surface` die Lücke ausdrücklich an.
2. **Wohin gehört die Anredeform?** Sie steht jetzt in `proof-addin.mjs` (integration-dev) und in
   `proof-surface.mjs` (frontend-dev), zeichengleich. Eine gemeinsame Datei bräuchte einen Ort und
   eine Registrierung — beides gehört dem Orchestrator. Dabei mit zu entscheiden: die `(?!-)`-
   Schärfung, gemessen kostenlos in beiden Läufen (Abschnitt 5).
3. **Bindet sich A-A-49 später an eine `rust-toolchain.toml`?** Heute gibt es keine, und
   `rust-version` ist nur die untere Schranke. Eine festgelegte Baufassung wäre die stärkere
   Bindung — sie ist aber eine Entscheidung über den Bauablauf (und über CI), nicht über diesen
   Lauf.

---

## 11. Nächster Schritt

**Zuerst, und es sind zwei Zeilen in einer Datei, die mir nicht gehört** — Wurzel-`package.json`:

```json
"proof:surface": "pnpm --filter @takt/web proof:surface",
```

und in `proof:all` hinter `proof:foreign` einhängen:

```
… && pnpm run proof:foreign && pnpm run proof:surface && pnpm run proof:addin-wiring && …
```

Ohne sie ist der Wächter dieser Welle genau das, was diese Welle behoben hat: eine Zusage, die
niemand mißt.

**Danach**, in einer Welle: offene Frage 1 an ux-designer (Regel für die 42 Bausteine), offene
Frage 2 an integration-dev und Orchestrator (gemeinsame Anredeform plus `(?!-)`), und visual-qa
über die sieben Flächen aus R-1.
