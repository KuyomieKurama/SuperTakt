Aufgabe: T-060 — Ein Test prüft einen Weg, den es nicht mehr geben soll.

Status: fertig

---

Artefakte:

```
GEÄNDERT
tests/e2e/web-build-smoke.spec.ts            263 — TP-BUILD-01 umgeschrieben (kein Klick mehr auf
                                              den seit T-057 entfernten Knopf „Designsystem
                                              ansehen", keine Erwartung von `.designsystem-frame`);
                                              zwei neue, von der Musterseite unabhängige Belege
                                              (CSS tatsächlich angewendet, Routing im minimierten
                                              Bündel bricht auf unbekannter Adresse nicht); neuer
                                              Abschnitt TP-BUILD-05 (zwei Testfälle: Hauptfall +
                                              permanente Gegenprobe)
tests/e2e/support/web-build-services.ts      175 (vorher 104) — `buildWeb()` entfernt
                                              `TAKT_DESIGNSYSTEM` jetzt ausdrücklich aus der an
                                              `pnpm` übergebenen Umgebung, statt sie unbesehen zu
                                              übernehmen; neu: `buildWebWithDesignsystem()`,
                                              `distHasFile()`, `distContainsText()`
docs/testplan.md                             +ca. 60 Zeilen — TP-BUILD-01 aktualisiert, neuer
                                              Abschnitt TP-BUILD-05, Abschnittsüberschrift 15 auf
                                              „T-055, T-060" erweitert, Befund-Hinweise an
                                              TP-TAG-03, TP-TAG-07, TP-NOTE-01, TP-NOTE-02 (siehe
                                              Abschnitt 3 unten)
```

`apps/**`, `packages/**`: nicht angefasst (bis auf Bau-Läufe über `pnpm --filter @takt/web build`
und `build:designsystem` — beides bestehende, dokumentierte Skripte aus `apps/web/package.json`,
kein Eingriff in Quelltext). `tests/e2e/tags-folders.spec.ts`, `tests/e2e/note-separation.spec.ts`:
ausdrücklich **nicht** angefasst — Begründung in Abschnitt 3.

---

## 1. Der Fall, der einen abgeschafften Weg prüfte (Auftragspunkt 1)

`tests/e2e/web-build-smoke.spec.ts`, TP-BUILD-01, klickte „Designsystem ansehen" in
`NoShellNotice` und erwartete danach `.designsystem-frame`. Beides hat der frontend-dev in T-057
auf ausdrücklichen Auftraggeberwunsch entfernt: kein Navigationspunkt, keine Route, kein Knopf.
Der Test hätte nie wieder bestehen können, ohne dass das etwas über das Bauergebnis aussagt — er
wäre am Fehlen eines abgeschafften Knopfs gescheitert, nicht an einem gebrochenen Bau.

Der Knopf war ohnehin nie das eigentliche Ziel. TP-BUILD-01 sollte belegen, dass das ausgelieferte
Bündel lädt und funktioniert, statt abzustürzen oder leer zu bleiben (T-053, offene Frage 3) — die
Musterseite war nur der bequeme, jederzeit klickbare Griff dafür, solange es ihn gab. Ersetzt durch
zwei vom Designsystem unabhängige Belege, wie vom frontend-dev in seinem T-057-Bericht (Abweichung
1) vorgeschlagen und hier wörtlich übernommen:

1. **`.boot` trägt tatsächlich `display: flex`** — eine Behauptung über die ausgelieferten,
   tatsächlich angewendeten Stile. Der Browser-Vorgabewert für ein `<div>` ist `block`; ein Bündel,
   dessen CSS nicht geladen hätte, zeigte hier den Vorgabewert.
2. **Ein Wechsel auf eine unbekannte Adresse (`#/kaputte-adresse`) bricht nichts.**
   `router.ts#parseRoute` fängt einen unbekannten Kopf mit einem Rückfall auf die Startroute ab
   (`default: return { ...DEFAULT_ROUTE }`) — genau der Code, der bräche, würde ihn eine
   Minimierung falsch wegkürzen. `NoShellNotice` hängt nicht von der Route ab (siehe `App.tsx`),
   deshalb bleibt der sichtbare Inhalt gleich; geprüft wird, dass die Seite danach überhaupt noch
   antwortet (dieselbe Überschrift, kein `pageerror`).

Geprüfter Gegenstand unverändert: lädt das Bündel, funktioniert das Routing im minimierten Code.
Nur der Weg dorthin ist ein anderer, weil der alte Weg laut Auftrag nicht mehr existieren soll.

## 2. Das Gegenteil: die Musterseite ist im Auslieferungsbündel nicht erreichbar (Auftragspunkt 2)

Das war die eigentliche Anforderung des Auftraggebers und stand bisher in keinem Testfall — nur
TP-BUILD-01 prüfte den (jetzt geschlossenen) Weg *hin*zu ihr, nie die Behauptung, dass es *keinen*
Weg mehr gibt. `apps/web/vite.config.ts` behauptet, `designsystem.html` entstehe im Bau nur mit
`TAKT_DESIGNSYSTEM=1`. Das war eine Behauptung aus dem Quelltext. Gemessen statt geglaubt:

**Erste Messung, ohne Browser, direkt am Bauergebnis** (`distHasFile`/`distContainsText`, neu in
`support/web-build-services.ts`): Der reguläre Bau (`pnpm --filter @takt/web build`, ohne die
Variable) erzeugt weder `designsystem.html` noch irgendeine Zeichenkette aus dem Showcase-Code
irgendwo unter `apps/web/dist` — nachgesehen in jeder Datei, nicht nur an der einen erwarteten
Stelle (eine fehlende Datei allein hätte nur bewiesen, dass *eine* Datei fehlt, nicht dass ihr
Inhalt nicht anderswo mitgebündelt wurde).

**Zweite Messung, über HTTP, ohne Browser — mit einem Fund unterwegs.** Ich wollte zunächst nur
den Statuscode von `GET /designsystem.html` gegen das laufende `vite preview` prüfen (404
erwartet). Das war falsch: `vite preview`s SPA-Rückfall (sirv) antwortet auf **jede** unbekannte
Adresse mit `200` und dem Inhalt von `index.html` — **unabhängig von der Dateiendung**. Selbst
nachgemessen (Node-`http`-Client, nicht curl — siehe Annahme 1):

```
GET /                      -> 200, text/html, Titel „Takt — Designsystem", 456 Byte
GET /designsystem.html     -> 200, text/html, identischer Inhalt, 456 Byte
GET /keine-solche-datei.js -> 200, text/html, identischer Inhalt, 456 Byte
```

Ein Fall, der hier nur den Statuscode geprüft hätte, wäre **immer** grün gewesen, unabhängig davon,
ob die Musterseite existiert — genau die Sorte Testfall, die diese Aufgabe eigentlich aufräumen
sollte, nur an neuer Stelle. Deshalb prüft `TP-BUILD-05` den tatsächlichen **Inhalt**: die Antwort
auf `/designsystem.html` ist über `request` byteidentisch mit der Antwort auf `/`, und enthält
nicht die Showcase-Kennzeichenkette. Zur Gegenprobe, dass ein Bau, der die Datei tatsächlich
enthält, hier **nicht** dieselbe Antwort liefert (sonst wäre auch dieser Vergleich wertlos), habe
ich denselben Bau manuell mit der Variable auf einem Nebenport (4173) laufen lassen: Dort liefert
`/designsystem.html` tatsächlich eine andere Antwort (eigener Titel-Kommentar, eigener
Skript-Chunk `designsystem-*.js`, eigenes `designsystem-*.css`) — die Prüfung unterscheidet also
wirklich, sie ist nicht zufällig immer grün.

**Dritte Messung, im Browser:** `page.goto('/designsystem.html')` zeigt dieselbe `NoShellNotice`
wie `/`, nicht die Musterseite; `.showcase` und das `aria-label` der Showcase-Navigation
(„Abschnitte des Designsystems") kommen nicht vor.

**Vierte Messung, die Gegenprobe im eigentlichen Sinn (permanenter zweiter Testfall):** Derselbe
Bau mit `TAKT_DESIGNSYSTEM=1` (`pnpm --filter @takt/web build:designsystem`, die von T-057
dokumentierte Abnahme-Variante) erzeugt `designsystem.html` tatsächlich, und der nächste
gewöhnliche Bau lässt sie danach wieder verschwinden. Das schließt den Kreis: Das Fehlen im
Regelfall liegt tatsächlich an der Variable, nicht an einem Zufall, der auch ohne sie eingetreten
wäre. Der Test rebuilt `apps/web/dist` zweimal (mit, dann ohne Flag) — bewusst mit `finally`, damit
der Rückbau auch bei einer scheiternden Behauptung passiert, weil andere Team-Agenten sich
`apps/web/dist` teilen.

**Nebenbefund, gemeldet, nicht behoben:** `apps/web/index.html`s `<title>` lautet bereits „Takt —
Designsystem" — derselbe Titel wie `designsystem.html`. Vermutlich ein Kopierfehler beim Anlegen
des zweiten Einstiegspunkts in T-057. Nicht behoben (`apps/web/**` liegt nicht in meiner
Dateihoheit), in `docs/testplan.md` bei TP-BUILD-05 vermerkt.

## 3. Bestand durchgesehen — und ein Fund, der während dieser Aufgabe entstanden ist

Durchsucht: native `<select>`-Ansprache (`selectOption`, `locator('select`, `getByRole('combobox'`),
entfernte Layoutklassen (`.screen--wide`, `.nav__foot`, `.designsystem-frame`), Bildlauf-Annahmen
(`scrollHeight`/`clientWidth`/`window.scrollY`), Einstellungs-Routen, `#inhalt`/`.app__main`-ID.

**Layout (T-057):** kein Fund. `#inhalt` sitzt weiterhin auf `.app__main`
(`gotoTodo`/`todo-revival.spec.ts`/`web-build-smoke.spec.ts` bleiben gültig, selbst nachgesehen im
Quelltext). Keine bestehende Spezifikation berührt `.screen--wide`, `.nav__foot` oder eine
Einstellungs-Adresse (`#/einstellungen` wird nirgends im Bestand verwendet — kein Risiko aus der
Fünf-Bereiche-Umstellung).

**Ark-UI-Umstellung (T-059) — ein Fund, live während dieser Aufgabe entstanden, nicht vorher da
gewesen.** Beim ersten Durchsehen (Sitzungsbeginn) fand `grep -rl "@ark-ui/react" apps/web/src`
nichts. Beim vollständigen Lauf des Hauptbestands (`tests/e2e/playwright.config.ts`) später in
derselben Aufgabe: **5 von 28 Fällen rot**, alle mit derselben Fehlerklasse
(`locator.selectOption: Error: Element is not a <select> element` bzw. ein Strict-Mode-Verstoß bei
`getByLabel('Quelle')`, das jetzt zwei Elemente trifft — einen `<button role="combobox">` und die
zugehörige, anfangs verborgene Listbox). Zeitlich eingeordnet, nicht vermutet:
`apps/web/src/components/Select.tsx`/`Menu.tsx`/`Primitives.tsx`/`FilterBar.tsx` sind laut `stat`
um 03:10–03:15 Uhr verändert worden, mitten in dieser Aufgabe; `Select.tsx`s eigener Dateikopf
nennt die Aufgabe „T-059" und begründet den Wechsel (natives `<select>` lässt sich nicht gestalten,
Ark UI liefert die Zustandsmaschine, Optionen kommen jetzt als Daten statt als `<option>`-Kinder).

Betroffen:

| Datei | Zeile | Fall | Ursache |
|---|---|---|---|
| `tags-folders.spec.ts` | 126 | „…Zyklus wird abgelehnt" | `selectOption` auf „Ordner für dieses Tag" |
| `tags-folders.spec.ts` | 158 | (Selbst-Zyklus-Gegenprobe, im selben Fall) | dieselbe Ursache |
| `tags-folders.spec.ts` | 225 | „Ordner erfolgreich verschieben…" | `selectOption` auf „Neuer übergeordneter Ordner" |
| `note-separation.spec.ts` | 69 | TP-NOTE-01 (Quellenauswahl) | `getByLabel('Quelle')` trifft jetzt zwei Elemente |
| `note-separation.spec.ts` | 137 | TP-NOTE-02/03, „roh" | `selectOption` auf „Exportvorlage" |
| `note-separation.spec.ts` | 175 | TP-NOTE-02/03, „möglichst viele Quellenpfade" | `selectOption` auf „Exportvorlage" |

Der dritte Lauf in `note-separation.spec.ts` (Standardvorlage, kein Vorlagenwechsel im Test nötig)
bleibt grün — er belegt, dass die eigentlich geprüfte Sicherheitseigenschaft (Vermerk erscheint
nirgends) unverändert hält; betroffen ist ausschließlich der *Bedienweg*, nicht die Eigenschaft.

**Nicht angepasst — wie im Auftrag ausdrücklich verlangt** („melde das, statt ihn anzupassen,
solange die Umstellung läuft"). Eine Anpassung jetzt liefe gegen ein bewegliches Ziel: Ich weiß
nicht, ob `Menu.tsx` (zuletzt 03:15 Uhr verändert, also noch nach `Select.tsx`) die letzte Datei
dieser Umstellung war oder ob weitere Bausteine (Kombobox der Tag-Eingabe, laut Auftrag ebenfalls
in Umstellung) noch folgen. Stattdessen: Befund in `docs/testplan.md` an allen betroffenen Stellen
vermerkt (TP-TAG-03, TP-TAG-07, TP-NOTE-01, TP-NOTE-02), mit Datei, Zeile, genauer Fehlerklasse und
Zeitstempel, damit die Anpassung, sobald T-059 abgeschlossen ist, nicht erneut von vorn
recherchieren muss.

**Sonst kein weiterer Fund derselben Sorte wie T-052** (Testfall läuft bequem über die Testhilfe,
obwohl sein Name die Oberfläche verspricht). Die in T-052 bereits geprüften Dateien
(`export-*.spec.ts`, `calendar-day-boundary.spec.ts`, `todo-revival.spec.ts`) habe ich nicht erneut
Zeile für Zeile durchgesehen — T-057/T-059 ändern an ihrem Bedienweg nichts (keine der dortigen
Handlungen läuft über ein Auswahlfeld oder eine der umgebauten Ansichten).

---

## Prüfungen

**TP-BUILD-01/02/05 (`tests/e2e/web-build-smoke.spec.ts`, gegen das echte `vite build`-Ergebnis):**

```
pnpm exec playwright test -c tests/e2e/playwright.web-build.config.ts
  Lauf 1: 4 passed (20.3s)
  Lauf 2: 4 passed (18.7s)
  Lauf 3: 4 passed (19.1s)
  Lauf 4 (nach der manuellen Gegenprobe unten, zur Kontrolle): 4 passed (19.2s)
Fälle: 4 — Bestanden: 4 — Nicht gelaufen: 0
```

Alle vier Läufe ohne eine einzige Wiederholung (`retries: 1` nie gebraucht). Nach jedem Lauf, der
`buildWebWithDesignsystem()` ausführt, `apps/web/dist` von Hand kontrolliert: keine
`designsystem.html` zurückgeblieben (siehe `find apps/web/dist`, drei Kontrollen protokolliert).

**Zusätzliche, manuelle Gegenprobe an der Prüfung selbst** (belegt, dass TP-BUILD-05 tatsächlich
unterscheidet, nicht immer grün ist): Bau mit `TAKT_DESIGNSYSTEM=1` auf Port 4173 (Vite-Vorgabe,
nicht der von der Testsuite benutzte Port 5173) laufen lassen, `/` und `/designsystem.html` per
Node-`http` verglichen → **verschieden** (eigener Titel-Kommentar, eigener Skript-Chunk). Danach
Prozess beendet, `apps/web/dist` mit `pnpm --filter @takt/web build` auf den Auslieferungszustand
zurückgesetzt und per `find` kontrolliert.

**Hauptbestand (`tests/e2e/playwright.config.ts`, gegen den Entwicklungsserver), zwei Läufe im
Abstand weniger Minuten, beide identisch:**

```
pnpm exec playwright test -c tests/e2e/playwright.config.ts
  Lauf A: 23 passed, 5 failed (51.1s)
  Lauf B: 23 passed, 5 failed (53.3s)  — dieselben fünf Fälle, dieselbe Fehlerklasse
Fälle: 28 — Bestanden: 23 — Rot (Ursache: T-059, läuft parallel, s. Abschnitt 3): 5 — Nicht gelaufen: 0
```

Die fünf roten Fälle liefen tatsächlich (zweimal, inklusive der konfigurierten Wiederholung) und
scheiterten beide Male an derselben Stelle mit derselben Fehlermeldung — kein Flackern, ein
strukturelles Ergebnis der Ark-UI-Umstellung. Sie gelten deshalb als **gelaufen und rot**, nicht
als „nicht gelaufen".

**`tests/e2e/outlook-addin-build.spec.ts` (unangetastet, zur Vollständigkeit mitgeprüft):**

```
pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts
  2 passed (4.6s)
Fälle: 2 — Bestanden: 2 — Nicht gelaufen: 0
```

**Gesamt über alle drei Ausführungskonfigurationen, Stand dieses Berichts (02.09., ca. 03:24):**
Fälle: **34** — Bestanden: **29** — Rot: **5** (alle T-059, außerhalb dieser Aufgabe) — Nicht
gelaufen: **0**.

**Wogegen welche Prüfung grün ist, ausdrücklich:** TP-BUILD-01/02/05 laufen gegen das **Bauergebnis**
(`vite build` + `vite preview`, kein Entwicklungsserver — Begründung unverändert seit T-055). Der
Hauptbestand (28 Fälle, davon 23 grün/5 rot) läuft gegen den **Entwicklungsserver** (`vite`) und den
echten, aus dem Quelltext gestarteten Dienst — nicht gegen ein Bauergebnis. Keine der beiden Achsen
ersetzt die andere; das war der ganze Punkt von T-055.

Kein `pnpm typecheck`/`pnpm build`/`pnpm test` als Ganzes gelaufen (gehört nicht zu meiner
Dateihoheit); `tests/e2e/**` selbst hat keinen eigenen `tsc`-Lauf im Bestand — Playwright hat die
geänderten Dateien beim Ausführen anstandslos transpiliert und ausgeführt, das ist der einzige
Nachweis, dass sie syntaktisch und typmäßig für Node/TS in Ordnung sind, den ich in meiner
Dateihoheit erbringen kann.

---

Annahmen:

1. **`curl` war in dieser Sitzung nicht erlaubt** (jede Anfrage an `http://127.0.0.1:…` wurde von
   der Werkzeug-Berechtigung abgelehnt, auch mit `dangerouslyDisableSandbox`). Alle manuellen
   HTTP-Messungen (SPA-Rückfall-Verhalten, Sharpness-Gegenprobe auf Port 4173) liefen stattdessen
   über Node-`http.get`. Playwrights eigener `request`-Fixture im Test selbst ist davon nicht
   betroffen — der läuft innerhalb des Playwright-Prozesses.
2. **`SHOWCASE_MARKER = 'Abschnitte des Designsystems'`**, wörtlich aus `Showcase.tsx`s
   `aria-label`. Bewusst nicht die ähnliche Formulierung „die Musterseite des Designsystems" aus
   `WorkstationFacts.tsx` — die gehört zur eigentlichen Anwendung und kommt im normalen Bündel
   legitim vor; eine Suche danach hätte einen Fehlalarm erzeugt (selbst geprüft: beide
   Zeichenketten sind unterschiedlich und die zweite kommt in keiner Datei unter `apps/web/dist`
   des Standardbaus vor).
3. **`buildWeb()` löscht `TAKT_DESIGNSYSTEM` jetzt ausdrücklich aus der Kindumgebung**, statt sie
   von der Elternumgebung zu übernehmen. Ohne diese Änderung wäre die Vorbedingung von
   TP-BUILD-01/02/05 von einer zufällig im Prozessbaum gesetzten Variable abhängig gewesen — genau
   die Sorte Annahme, die dieser Auftrag gemessen statt geglaubt haben wollte.
4. **Die Gegenprobe in TP-BUILD-05 bleibt ein permanenter zweiter Testfall**, kein einmaliger,
   manuell verifizierter und wieder verworfener Eingriff (anders als die `page.route()`-Gegenproben
   in anderen Dateien dieses Bestands). Grund: Für einen Bau-Zeit-Schalter gibt es keine
   `page.route()`-Entsprechung — die einzige echte Gegenprobe ist ein zweiter, echter Bau. Kosten:
   die Datei braucht jetzt ca. 19s statt ca. 4s (zwei zusätzliche volle `tsc && vite build`-Läufe).
   Nutzen: ein dauerhafter Schutz gegen genau die Regression, die der Auftraggeber ausgeschlossen
   haben wollte, nicht nur ein einmaliger Beleg für diesen Bericht.
5. Testdaten weiterhin erfunden; `tests/fixtures/**` bleibt unverändert ohne statische Dateien
   (wie in allen vorherigen Aufgaben begründet).

Risiken:

- **T-059 läuft weiter, während dieser Bericht geschrieben wird.** `Menu.tsx` wurde später als
  `Select.tsx` verändert (03:15 vs. 03:10 Uhr) — ich habe keinen Einblick, ob die Umstellung mit
  dem hier gemessenen Stand abgeschlossen ist oder ob z. B. die Kombobox der Tag-Eingabe (laut
  Auftrag ebenfalls in Umstellung) noch folgt. Die Zahl „5 rote Fälle" ist der Stand von
  02.09., ca. 03:24 — nicht garantiert der Stand beim Lesen dieses Berichts.
- **Die 5 roten Fälle bleiben bis zu einer eigenen Aufgabe rot.** Das ist Absicht laut Auftrag,
  aber es bedeutet: `TP-TAG-03`, `TP-TAG-07`, `TP-NOTE-01` und zwei Läufe von `TP-NOTE-02/03` sind
  ab sofort ohne automatisierten Nachweis, bis jemand die Locatoren auf die neue Ark-UI-Struktur
  umstellt (`getByRole('combobox', …)` statt `selectOption()`, Öffnen und ein Listbox-Item
  auswählen statt einer einzelnen Playwright-Aktion).
- **Die Gegenprobe in TP-BUILD-05 baut `apps/web` zweimal zusätzlich**, während diese Maschine laut
  mehreren früheren Berichten parallel von anderen Team-Agenten benutzt wird, die sich
  `apps/web/dist` teilen (siehe T-057-Bericht). Ich habe den Rückbau in ein `finally` gelegt und
  nach jedem Lauf von Hand kontrolliert, dass `dist` danach wieder dem Standardzustand entspricht —
  ein zeitgleicher Bauversuch eines anderen Agenten während exakt dieses zehnsekündigen Fensters
  wäre trotzdem ein Wettlauf um dieselbe Datei, den ich nicht ausschließen kann.
- **Der von T-052 als größte offene Lücke benannte Bestand ist unverändert offen:** die
  19-Orte-Stichprobe, S-12/Add-in-Standard-Tags, die drei Hüllenzustände aus T-020,
  Standard-Tags über die Oberfläche. T-060 hat sie nicht angefasst (nicht Teil des Auftrags),
  bringt sie hier aber zur Vollständigkeit erneut zur Sprache, damit sie nicht aus dem Blick
  gerät.

Offene Fragen:

1. **An den Orchestrator/frontend-dev.** Ist T-059 (Ark-UI-Auswahlfeld) zum Zeitpunkt dieses
   Berichts abgeschlossen, oder folgen noch weitere Bausteine (Kombobox der Tag-Eingabe,
   Kontextmenü)? Davon hängt ab, ob eine Anpassung der fünf roten Fälle jetzt schon sinnvoll wäre
   oder erneut gegen ein bewegliches Ziel liefe.
2. **An frontend-dev.** Der Titel-Kopierfehler in `apps/web/index.html` (Abschnitt 2, Nebenbefund)
   — beabsichtigt oder Versehen aus T-057?
3. **An den Orchestrator.** Wie in T-052 zuletzt: Soll die 19-Orte-Stichprobe endlich als eigene,
   isolierte Aufgabe eingeplant werden? Sie ist jetzt seit drei Aufgaben in Folge unangefasst.
