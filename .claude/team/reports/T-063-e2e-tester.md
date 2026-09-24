Aufgabe: T-063 — Die fünf roten Fälle nachziehen. Die Umstellung ist abgeschlossen, das Ziel bewegt sich nicht mehr.

Status: fertig

---

Artefakte:

```
GEÄNDERT
tests/e2e/note-separation.spec.ts   210 (vorher 188) — TP-NOTE-01: `getByLabel('Quelle')` (Strict-
                                     Mode-Verstoß, zwei Treffer) durch `getByRole('combobox', {name:
                                     'Quelle'})` + `getByRole('option').locator('.select__option-
                                     label')` ersetzt. TP-NOTE-02/03: beide
                                     `getByLabel('Exportvorlage').selectOption(...)` durch
                                     `getByRole('combobox', …).click()` +
                                     `getByRole('option', {name: <Vorlagenname>, exact:true}).click()`
                                     ersetzt.
tests/e2e/tags-folders.spec.ts      298 (vorher 270) — drei `selectOption()`-Aufrufe (Zeile 126,
                                     145/158, 225 der alten Fassung) auf zwei Verschieben-Dialogen
                                     durch `getByRole('combobox', …).click()` +
                                     `getByRole('option', {name: <voller Ordnerpfad>, exact:true})
                                     .click()` ersetzt. `exact:true` ist hier notwendig: die
                                     Beschriftung jedes Ordner-Eintrags ist sein voller Pfad, und der
                                     Name eines Ordners steckt als Teilstring auch im Pfad seiner
                                     eigenen Nachfahren.
tests/e2e/support/api.ts            305 (vorher 287) — neu: `listTags()`, `deleteTag()`,
                                     `listDefaultTags()`/`DefaultTagEntry` (für die neuen
                                     Tag-Eingabe-Fälle: Nachschau am Dienst statt am Toast, Aufräumen
                                     neu angelegter Tags, Wiederherstellen der Standard-Tags).
tests/e2e/support/nav.ts            58 (vorher 53) — `gotoSettings(page, bereich?)`: optionaler
                                     zweiter Parameter für die Einstellungs-Reiter (`?bereich=…`),
                                     vorher nur der erste Reiter erreichbar.
docs/testplan.md                    2095 (vorher 2009) — die vier „Befund (T-060, …): aktuell rot"-
                                     Vermerke bei TP-NOTE-01, TP-NOTE-02, TP-TAG-03, TP-TAG-07 auf
                                     „behoben in T-063" aktualisiert; neuer Abschnitt 16 mit
                                     TP-TAG-09 bis TP-TAG-13 (die neue Tag-Eingabe).

NEU
tests/e2e/tag-input.spec.ts         341 — fünf Testfälle zur Tag-Eingabe (T-059): Namensregel-
                                     Autovervollständigung (Backend=backend=" Backend ", aber
                                     Straße≠Strasse), Anlegen eines neuen Tags in derselben
                                     Transaktion wie das Todo, Todo-Filter (vorher kein
                                     Bedienelement), Standard-Tags (auswählen, nicht anlegen),
                                     geschlossenes Auswahlfeld bleibt für Tastatur/Vorlesehilfe
                                     unsichtbar (Fund des frontend-dev, bisher unbewiesen).
```

`apps/**`, `packages/**`: nicht angefasst. `tests/fixtures/**`: unverändert — kein neuer Fall
brauchte eine eigene Datei, alle Testdaten entstehen laufzeitgeneriert mit `Date.now()`-Suffix wie
im übrigen Bestand.

---

## 1. Der Auftrag wörtlich umgesetzt — und ein vierter Fall, der in der Liste fehlte

Der Auftrag nannte `note-separation.spec.ts:137,175` und `tags-folders.spec.ts:126,158,225` — vier
`selectOption()`-Aufrufe auf zwei Dateien. Vor dem Ändern habe ich den Bestand gegen den
Entwicklungsserver laufen lassen, um den Ausgangszustand zu messen statt zu glauben:

```
pnpm exec playwright test -c tests/e2e/playwright.config.ts tags-folders.spec.ts note-separation.spec.ts
  5 failed, 1 passed
```

**Fünf, nicht vier — der Aufgabentitel sagt „die fünf roten Fälle", der Textkörper zählt nur vier
Fundstellen auf.** Der fünfte ist `note-separation.spec.ts`, TP-NOTE-01 (Zeile 68f. der alten
Fassung): `getByLabel('Quelle')` benutzte gar kein `selectOption()`, scheiterte aber am selben Umbau
mit einem anderen Fehlerbild — einem Strict-Mode-Verstoß, weil sowohl der Auslöser-Knopf
(`role="combobox"`) als auch die zugehörige, geschlossene Listbox `aria-labelledby` auf dieselbe
Beschriftung „Quelle" tragen (`select.connect.mjs`, Zeilen 163 und 314/438: Trigger **und** Content
referenzieren `dom.getLabelId(scope)`). Das war bereits im T-060-Bericht als eigener, fünfter
Befund dokumentiert (Abschnitt 3, „TP-NOTE-01"), nur eben nicht in der wörtlichen Zeilenliste
dieses Auftrags. Nachgezogen, weil der Aufgabentitel „fünf" sagt und weil ein Test, der aus
demselben Grund rot ist, nicht halb behoben zurückbleiben sollte.

**Ersatz, wie vorgeschlagen und in allen fünf Fällen angewandt:**

```ts
await x.getByRole('combobox', { name: … }).click();
await page.getByRole('option', { name: …, exact: true }).click();
```

Eine Besonderheit bei den drei Ordner-Auswahlfeldern in `tags-folders.spec.ts`: Die Beschriftung
jedes Eintrags ist der **volle Ordnerpfad** (`folder.path.join(" / ")`, `TagsScreen.tsx`), nicht nur
der eigene Name. Der Name eines Ordners ist damit ein Teilstring des Pfads jedes seiner eigenen
Nachfahren — eine Suche nach „E2E-L1-…" ohne `exact: true` hätte fünf Einträge getroffen (den
Ordner selbst und alle vier tiefer liegenden). Jede Ersetzung baut deshalb den vollen erwarteten
Pfad nach, statt nur den Namen zu übernehmen.

Bei TP-NOTE-01 kam eine zweite Korrektur dazu: Die ursprüngliche Zusicherung las `<option>`-Kinder
aus; Optionen kommen seit T-059 als Daten, keine `<option>`-Elemente mehr. Ersatz:
`getByRole('option').locator('.select__option-label')` statt des vollen `innerText` je Eintrag —
Optionen tragen jetzt zusätzlich eine Beschreibungszeile (`option.hint`), die „Notiz" durchaus
legitim enthalten darf (bei der erlaubten Quelle „Leistung"); ein Vergleich über den vollen Text
hätte dort falschen Alarm geschlagen.

**Zwei weitere, im Auftrag genannte Änderungen geprüft, kein Treffer:** `grep` über den gesamten
Bestand nach `data-active` ergab nichts — kein Fall griff auf das Menü-Attribut zu, das jetzt
`data-highlighted` heißt. Ebenso kein Treffer für `.tag-picker`/`tagauswahl` — kein bestehender Fall
referenzierte die abgeschaffte Chip-Wand im Todo-Dialog. Beide Änderungen sind damit folgenlos für
den bestehenden Bestand; vermerkt in `docs/testplan.md`, Abschnitt 16.

## 2. Was neu prüfbar wurde — die Tag-Eingabe

Fünf neue Fälle in `tests/e2e/tag-input.spec.ts`, drei davon aus dem Auftragstext direkt abgeleitet:

**TAGINPUT-01 (der verlangte wertvollste Fall).** Zwei Tags vorab angelegt (`Backend-<run>`,
`Straße-<run>`). Getippt: `backend-<run>` (Kleinschreibung), `  Backend-<run>  ` (Leerzeichen,
diesmal tatsächlich ausgewählt), `Straße-<run>` (exakt), `Strasse-<run>` (ß durch ss ersetzt).
Erwartung nach Auftragstext exakt bestätigt: die ersten drei zeigen das vorhandene Tag, kein Angebot
zum Anlegen; die vierte bietet das Anlegen eines **neuen** Tags an, und „Straße" erscheint dabei
nirgends als Treffer.

**Ein Fund unterwegs, kein Anwendungsfehler, aber lohnenswert für andere Testfälle dieses
Bestands:** Der erste Versuch, „Straße erscheint nirgends als Treffer" über
`page.getByRole('option', { name: realStrasse })` **ohne** `exact: true` zu prüfen, schlug fehl —
die Suche traf den Anlegen-Eintrag für „Strasse" trotzdem. Ursache ist keine Anwendungslogik,
sondern Playwrights eigener, nicht-exakter Namensvergleich: Er faltet Groß-/Kleinschreibung über
volle Unicode-Regeln, und die ordnen „ß" und „ss" derselben gefalteten Form zu — anders als
`tagNameKey` aus `packages/domain`, die genau das bewusst **nicht** tut (Kommentar dort: „`Straße`
≠ `Strasse`"). Mit `exact: true` (dokumentiert per Playwright als zusätzlich case-sensitive) ist der
Vergleich literal und der Test unterscheidet tatsächlich, was er unterscheiden soll — ohne dieses
Detail wäre der Test immer grün gewesen, unabhängig davon, ob die Anwendung die beiden Namen
tatsächlich auseinanderhält. Derselbe Grund, aus dem `exact: true` auch bei den Ordnerpfaden in
`tags-folders.spec.ts` steht.

**TAGINPUT-02.** Neuer Tagname im Todo-Dialog getippt, „als neues Tag anlegen" gewählt, Todo
gespeichert. Geprüft: Vor dem Speichern existiert das Tag am Dienst noch nicht (`GET /tags`); der
Chip zeigt schon vorher alle drei Merkmale eines noch nicht angelegten Tags; nach dem Speichern
nennt der Toast das Tag beim Namen, es existiert auf der Wurzelebene, und das gespeicherte Todo
trägt seine Kennung — nicht nur behauptet, sondern über `GET /tags` und `GET /todos` nachgesehen.

**TAGINPUT-03.** Der Todo-Filter (S-02) hatte vor T-059 kein Bedienelement für Tags. Zwei Todos mit
je einem eigenen Tag angelegt, über die Tag-Eingabe im Filter eines ausgewählt: Liste zeigt nur das
passende Todo, aktiver Filter-Chip sichtbar; nach Entfernen wieder beide.

**TAGINPUT-04.** Standard-Tags (S-10) — bewusst mit einer kleinen Zusatzprüfung: Da hier
`allowCreate` fehlt (anders als im Todo-Dialog), darf beim Tippen eines vorhandenen Namens **kein**
Angebot zum Anlegen erscheinen. Ursprünglicher Bestand der Standard-Tags vorher gesichert (`GET
/settings/default-tags`) und in `finally` zuerst wiederhergestellt, dann erst das Testtag gelöscht —
diese Einstellung ist global und wird von der ganzen Suite geteilt.

**TAGINPUT-05 — der Fund des frontend-dev, hier zum ersten Mal geprüft statt nur behauptet.** Ein
`display: flex` auf `.select__content` hatte die `[hidden]`-Regel des Browsers überschrieben; eine
neue `[hidden] { display: none !important }`-Regel in `base.css` sollte das dauerhaft beheben.
Geprüft: Statusspalten-Auswahlfeld im Todo-Dialog fokussiert, ohne es zu öffnen; die über
`aria-controls` benannte Liste tatsächlich `hidden` und unsichtbar; ein Tabulatorschritt landet auf
dem nächsten Feld (Tags), nicht in der geschlossenen Liste. Eine Falle dabei: Die Liste hängt per
Portal am Dokumentkörper, nicht im Dialog-Baum — `dialog.locator('.select__content')` fand nichts,
und `page.locator('.select__content')` ungefiltert hätte mehrere getroffen (Statusspalte/Pool im
Filter dahinter, Farbmodus in der Kopfleiste — alles gleichzeitig montierte Auswahlfelder). Erst die
Kennung aus dem eigenen `aria-controls` des Auslösers macht die Prüfung eindeutig.

**Nicht geprüft, bewusst:** Die Poolregel (S-11) benutzt denselben `TagCombobox`-Baustein wie die
vier hier geprüften Stellen; das Restrisiko einer stellenspezifischen Regression dort ist klein,
aber nicht null — siehe Risiken.

---

## Prüfungen

**Hauptbestand (`tests/e2e/playwright.config.ts`, gegen den echten, aus dem Quelltext gestarteten
Entwicklungsserver — nicht gegen ein Bauergebnis):**

```
Lauf 1 (nur die beiden geänderten Dateien, vor jeder Änderung — Ausgangslage): 1 passed, 5 failed
Lauf 2 (nach den Locator-Fixen, nur die beiden Dateien):                       6 passed
Lauf 3 (dieselben zwei Dateien, Wiederholung zur Stabilität):                  6 passed
Lauf 4 (neue Datei tag-input.spec.ts, erster Versuch):                        3 passed, 2 failed
Lauf 5 (nach Korrektur der beiden Test-eigenen Locator-Fehler):               5 passed
Lauf 6 (Wiederholung zur Stabilität):                                         5 passed
Lauf 7 (gesamter Hauptbestand, alle 8 Dateien):                              33 passed
Lauf 8 (gesamter Hauptbestand, Wiederholung):                                33 passed
```

Kein Lauf brauchte die konfigurierte Wiederholung (`retries: 1`); jedes Grün war ein Grün beim
ersten Versuch.

**Bauergebnis-Achse, unverändert von dieser Aufgabe, zur Vollständigkeit erneut gefahren (T-055/
T-060-Fälle laufen gegen `vite build`/`vite preview`, nicht gegen den Entwicklungsserver):**

```
pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts       4 passed
pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts   2 passed
```

**Gesamt, Stand dieses Berichts:** Fälle: **39** — Bestanden: **39** — Rot: **0** — Nicht gelaufen:
**0**. Alle fünf ursprünglich gemeldeten roten Fälle sind darin enthalten und bestehen jetzt.

**Wogegen welche Prüfung grün ist, ausdrücklich:** Die 33 Fälle des Hauptbestands (inklusive aller
fünf reparierten und aller fünf neuen Tag-Eingabe-Fälle) laufen gegen den **Entwicklungsserver**
(`vite`, `apps/local-api` aus dem Quelltext) — nicht gegen ein Bauergebnis. Die 6 Fälle aus
`web-build-smoke.spec.ts`/`outlook-addin-build.spec.ts` laufen gegen das tatsächliche **Bauergebnis**
(`vite build` + `vite preview` bzw. der echte Aufgabenbereich-Server) — unverändert seit T-055/T-060,
hier nur zur Vollständigkeit erneut gefahren, nicht Gegenstand dieser Aufgabe.

Kein `pnpm typecheck`/`pnpm build` als Ganzes gelaufen (nicht meine Dateihoheit). `tests/e2e/**`
selbst hat weiterhin keinen eigenen `tsc`-Lauf im Bestand (kein `tsconfig.json` unter
`tests/e2e/`) — Playwrights eigene Transpilierung beim Ausführen (acht Läufe, alle ohne
Übersetzungsfehler) ist der einzige Nachweis, den ich in meiner Dateihoheit für die syntaktische und
typmäßige Richtigkeit erbringen kann, wie schon in T-060 vermerkt.

---

Annahmen:

1. **Die vierte Fundstelle (TP-NOTE-01) gehört zu dieser Aufgabe**, obwohl sie in der wörtlichen
   Zeilenliste des Auftrags fehlt — Begründung in Abschnitt 1. Der Aufgabentitel selbst („die fünf
   roten Fälle") und der T-060-Bericht (der sie als fünften, gleichrangigen Befund führt) tragen
   das.
2. **`exact: true` ist an jeder Stelle, an der die Beschriftung eines Eintrags Teilstring einer
   anderen sein kann, notwendig, nicht optional** — sowohl bei den Ordnerpfaden
   (`tags-folders.spec.ts`) als auch beim Straße/Strasse-Fall (`tag-input.spec.ts`). Ohne diese
   Annahme wären mehrere der neuen Zusicherungen unabhängig vom tatsächlichen Verhalten der
   Anwendung immer grün gewesen — genau die Sorte Testfall, die dieser Auftrag beheben sollte, nur
   an neuer Stelle.
3. **Vier von vier Stellen der Tag-Eingabe direkt geprüft, die fünfte (Poolregel) nicht** —
   Abwägung aus Abschnitt 2, festgehalten statt verschwiegen.
4. **`tests/fixtures/**` bleibt ohne eigene Dateien**, wie in allen vorherigen Aufgaben begründet —
   alle neuen Testdaten sind laufzeitgeneriert mit eindeutigem `Date.now()`-Suffix.
5. Testdaten weiterhin frei erfunden (`Backend`, `Straße`, `E2E-…`) — keine echten Call-Nummern,
   Kundennamen oder Benutzernamen.

Risiken:

- **Die Poolregel (S-11) teilt sich denselben Baustein, ist aber nicht eigens durchlaufen.** Eine
  stellenspezifische Regression dort (z. B. ein falsch verdrahtetes `onChange` nur an dieser einen
  Aufrufstelle) würde von `tag-input.spec.ts` nicht gefunden. Restrisiko klein (derselbe
  `TagCombobox`, keine stellenspezifische Logik in `TagsScreen.tsx` außer dem `onChange`-Mapping
  auf `rule`), aber nicht null.
- **Zwei Abläufe aus meiner Rollenbeschreibung bleiben ohne End-to-End-Test, unverändert seit
  mehreren vorherigen Berichten (zuletzt T-060, Risiken, Punkt 3):** Standard-Tags über das
  **Add-in** (nur die Oberfläche ist in `TAGINPUT-04` geprüft) und „Add-in mit vorhandenem Call"
  (Angebot statt Duplikat). Beides ist in `docs/testplan.md` als `TP-DTAG-02`/`TP-ADDIN-02` seit
  T-002 geplant, aber nie als `tests/e2e/**`-Fall geschrieben worden — kein Rückschritt dieser
  Aufgabe, aber auch keiner, den T-063 behoben hat. Der Grund, es hier nicht nachzuholen: Eine
  belastbare Add-in-Prüfung bräuchte einen eigenen `window.Office`-Stub (E-Mail mit erkennbarer
  Call-Nummer, `Office.onReady`, `Office.context.mailbox.item`) — ein eigenständiges Stück
  Testinfrastruktur, keine Erweiterung der fünf roten Fälle, und außerhalb dessen, was dieser
  enggefasste Auftrag verlangt hat. Siehe Offene Frage 1.
- **`docs/testplan.md` ist jetzt 2095 Zeilen lang** und wächst mit jeder Aufgabe. Kein Risiko dieser
  Aufgabe im Besonderen, aber der wiederkehrende Hinweis aus früheren Berichten bleibt gültig: eine
  Gliederungs-/Kürzungsaufgabe wäre irgendwann fällig.

Offene Fragen:

1. **An den Orchestrator.** Soll „Standard-Tags über das Add-in" (`TP-DTAG-02`) und „Add-in mit
   vorhandenem Call" (`TP-ADDIN-02`) endlich als eigene, isolierte Aufgabe eingeplant werden? Sie
   stehen seit T-002 im Plan, sind seit mindestens T-060 als offene Lücke benannt, und würden einen
   eigenen `Office.js`-Stub in `tests/e2e/support/**` brauchen — mehr Aufwand, als in eine ohnehin
   fokussierte Aufgabe wie diese hineinzupassen.
2. **An den frontend-dev, zur Kenntnis.** Der bei T-059 gemeldete Fund zur zugeklappten Liste ist
   jetzt durch einen automatisierten Fall abgesichert (`TAGINPUT-05`/`TP-TAG-13`) — geprüft ist der
   DOM-Zustand (`hidden`, keine Tab-Erreichbarkeit), nicht die tatsächliche Ansage einer
   Vorlesehilfe (NVDA/JAWS/Orca); das bleibt eine Grenze der hier verfügbaren Werkzeuge, keine
   Auslassung.

Nächster Schritt: Falls Offene Frage 1 mit „ja" beantwortet wird, würde ich zuerst einen
minimalen, in `tests/e2e/support/**` liegenden `Office.js`-Stub bauen (`page.addInitScript`, nur
`Office.onReady`/`Office.context.mailbox.item`/`CoercionType`/`AsyncResultStatus` — genau das, was
`office/host.ts` tatsächlich anfasst), bevor ich `TP-DTAG-02`/`TP-ADDIN-02` schreibe.
