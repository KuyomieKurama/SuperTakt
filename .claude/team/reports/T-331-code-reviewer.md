# T-331 — Freigaberunde über T-326 (Oberfläche) und T-327 (Wächter)

**Rolle:** code-reviewer. **Stand:** 2026-09-13. **Zweig:** `feature/outlook-anhaenge-und-versionspruefung`,
Spitze `311b26e` plus Arbeitskopie.

**Urteil vorweg:** Strang A **nicht freigegeben** (ein Befund hoher Schwere, gemessen).
Strang B **nicht freigegeben** (ein Befund mittlerer Schwere, gemessen — er blockiert den
Wortlaut, mit dem R-30 geschlossen werden soll, nicht den Wächter selbst).

E-113, Z6 und E-114 sind entschieden und stehen nirgends als Befund.

---

## 0 Was ich gefahren habe, und mit welchem Ergebnis

Der Bestand des Benutzers auf `127.0.0.1:17843/17844` wurde **nicht** angefaßt. Meine Messungen
laufen aus einem eigenen Verzeichnis unter dem Kratzbereich (`t331-code-review-probe/`) mit
einer Kopie der Stilblätter, einem `git archive`-Auszug für den Wächter und Chromium über
Playwright ohne Netz (`file://`).

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **grün**, alle acht Pakete plus Prüf- und E2E-Konfigurationen. Der von T-327 gemeldete `TS6133 listIsEmpty` in `TodoListScreen.tsx:405` ist **weg** — T-326 hat ihn nach dessen Lauf beseitigt, `grep -rn listIsEmpty apps/web/src` findet nichts |
| `pnpm boundaries` | grün |
| `pnpm contrast` | grün, 0 von 522 Paaren durchgefallen |
| `pnpm proof:surface` | grün 27/27 |
| `pnpm proof:clamp` | grün 21/21 |
| `pnpm proof:locked` | grün 9/9 |
| `pnpm proof:foreign` | grün 21/21 |
| `pnpm proof:release-safety` | grün **106/0**, 5,5 s gemessen (Bericht nennt 4,6 s — dieselbe Größenordnung, andere Maschinenlast) |
| `pnpm proof:layers` (im Auszug) | grün 36/0 |
| alter Wächter (`HEAD`) gegen den **heutigen** Baum | **76/0** — der Nullpunkt der Zählvorschrift ist nachgefahren, nicht übernommen |
| `pnpm test:e2e` | **nicht gefahren** (E-114, T-330 arbeitet parallel; der Lauf bindet 17843) |
| `pnpm check` als Ganzes, `test:coverage`, `test:rust`, `build`, `audit`, `verify:bundle`, portgebundene Nachweise | **nicht gemessen** — nicht „grün" |

---

# Strang A — T-326, die fensterfesten Flächen

## A.1 Befunde

```
apps/web/src/styles/viewport-layout.css:303   hoch     Regel 2 des eigenen Dateikopfes („Was
    stehenbleibt, schrumpft nicht") fehlt für die Kinder des Laufbereichs. `.screen > .screen__body`
    und `.runarea` sind Flex-Spalten mit definiter Höhe; ihre Kinder behalten den Vorgabewert
    `flex: 0 1 auto`. Ein Kind mit `overflow != visible` hat nach CSS-Flexbox §4.5 die
    automatische Mindesthöhe **0** und schrumpft deshalb, statt daß der Laufbereich läuft.
    `.card` trägt `overflow: hidden` (`components.css`) und schneidet den geschrumpften Teil
    ab — dieselbe Klasse, die T-326 im Bild an `.time-layout__* > .card` gefunden und dort
    einzeln mit `flex: none` behoben hat. An der allgemeinen Stelle fehlt sie.
    Fix: `.screen > .screen__body:not(.screen__body--frame) > *, .runarea > * { flex: none }`
    (`:not(…)`, weil `.screen__body--frame > *` bei gleicher Spezifität sonst von der
    Quellreihenfolge abhinge).
```

**Gemessen**, Chromium über Playwright, 1280 × 820, die Stilblätter dieses Zweiges gegen die von
`HEAD`, `getComputedStyle(.app).display === "grid"` als Beweis, daß die Blätter geladen waren.
Angaben als `Höhe / scrollHeight / clientHeight`:

| Fall | heute (T-326) | vorher (`HEAD`) |
|---|---|---|
| drei Karten in `.screen__body` (Dashboard-Form) | jede Karte **210 / 389 / 208**, `.screen__body` **695/695 — es läuft nichts** | jede Karte **391 / 389 / 389**, `.app__main` 1310/768 läuft |
| kurze Karte + lange Liste (Exportprotokoll-Form) | Legendenkarte **2 px hoch**, `clientHeight` **0** — die Legende ist unsichtbar und unerreichbar; Liste unverändert 720 | — |
| eine hohe Karte in `.settings-panel` (Einstellungen „Daten") | Karte **671 / 1489 / 669**, `.runarea` **671/671**, Rahmen **695/695** — **818 px Einstellungen sind abgeschnitten, und keine Fläche läuft** | — |

Das ist T-322 R-d wörtlich: Inhalt wird unerreichbar. Es ist **neu** mit T-326 — der Gegenlauf
mit den Stilblättern von `HEAD` und der Bauform von `HEAD` zeigt volle Kartenhöhe und einen
laufenden Rahmen.

Betroffen sind die vier Ansichten, deren Laufbereich ein direktes Kind mit `overflow != visible`
trägt (alle übrigen direkten Kinder sind Raster oder Listen mit `overflow: visible` und
schrumpfen deshalb nicht):

- `apps/web/src/app/DashboardScreen.tsx:184` — Karte „Timer".
- `apps/web/src/features/export/ExportScreen.tsx:631` — Karte „Vorlage und Rundung". Darin steht
  `Base64Notice` (`:719`). Der Satz „Base64 ist eine Kodierung, keine Verschlüsselung" ist damit
  wegschneidbar; die Zusage im Bericht („der Base64-Satz bleibt erreichbar") ist an dieser Stelle
  gemessen falsch.
- `apps/web/src/features/export/ExportAuditScreen.tsx:190` — Legendenkarte des Protokolls.
- `apps/web/src/features/settings/SettingsScreen.tsx:216` — **jede** Karte eines Bereichs;
  „Daten", „Darstellung" und „Outlook-Add-in" sind laut der Prosa daneben „die längsten Flächen
  der Anwendung", und bei genau **einer** Karte im Bereich läuft gar nichts mehr.

Warum die 88 Meßpaare das nicht gefunden haben: AK-01 fragt `.app__main.scrollHeight ≤
clientHeight` — der Wert wird durch das Abschneiden *besser*, nicht schlechter. AK-02 zählt
Laufbereiche, und der Laufbereich ist ja da; er hat nur nichts mehr zu laufen. Ein Meßsatz, der
das fängt, fragt nicht nach dem Rahmen, sondern je Laufbereich: `el.scrollHeight <=
el.clientHeight` **für jedes direkte Kind** — genau die Form, die T-326 für die Zeiterfassung von
Hand im Bild gesucht hat.

```
apps/web/src/styles/viewport-layout.css:160   mittel   `.screen__header` und `.screen__bar` haben
    keine Bildlaufrinne, `.screen__body` hat `scrollbar-gutter: stable`. Damit endet der feste
    Teil rechts weiter außen als der laufende. Gemessen (1280 × 820, lange Liste): Kopf-Inhalt
    264…1256 (992 px), Laufbereich-Inhalt 264…1246 (982 px) — **10 px Versatz**. Mit den
    Stilblättern von `HEAD` enden beide bei 1246, also bündig. Die Primäraktion und der Titel
    stehen jetzt um die Rinnenbreite rechts neben der Inhaltskante darunter. Betrifft die acht
    Ansichten ohne Rahmen; `.screen__body--frame` steht auf `scrollbar-gutter: auto` und bleibt
    bündig — der Versatz ist also zusätzlich uneinheitlich zwischen den Ansichten.
    Fix (eine von zwei Richtungen, das ist eine Gestaltungsentscheidung): entweder
    `.screen__header, .screen__bar { overflow-y: hidden; scrollbar-gutter: stable }` — `hidden`
    macht den Kasten zum Bildlaufkasten, damit die Rinne überhaupt wirkt, und eine Leiste hat
    nichts abzuschneiden —, oder der Versatz wird als gewollte Änderung von ui-designer
    bestätigt und in `docs/design/fensterfeste-flaechen.md` geschrieben. AK-10 mißt ihn nicht:
    dort steht nur, daß die Breite des Laufbereichs nicht an der Listenlänge hängt.
```

```
apps/web/src/features/settings/SettingsScreen.tsx:143   mittel   `PANEL_LABEL` ist eine zweite
    vollständige Abbildung über `SettingsArea` neben `AREA_LIST` (:103) und weicht an zwei
    Stellen ab: `addin` und `arbeitsplatz` heißen dort „Einstellungen", in der Schiene aber
    „Outlook-Add-in" und „Arbeitsplatz". Zwei Folgen. Erstens trägt der Laufbereich in diesen
    beiden Bereichen **denselben** zugänglichen Namen wie der Rahmen darum: zwei ineinander
    liegende `role="region"` mit dem Namen „Einstellungen", also genau Befund 3 aus T-326 in
    einer dritten und vierten Ausprägung, die dort nicht steht. Zweitens hängt bei `timer` der
    Bereichsname „Timer" über der Karte `<Card title="Timer">` — eine `<section>` mit
    `aria-labelledby` ist ebenfalls eine Region, also nochmals zwei gleichnamige verschachtelte
    Regionen. AK-15 nennt den Wert „Bereichsüberschrift"; für zwei der acht Bereiche ist er das
    nicht. Fix: den Namen aus `AREA_LIST` ziehen statt aus einer zweiten Liste
    (`AREA_LIST.find((item) => item.area === active)`), dann ist er immer der sichtbare
    Schienentext und kann nicht auseinanderlaufen.
```

```
apps/web/src/styles/base.css:41   mittel   Der Kommentar ist jetzt **falsch**, nicht bloß
    unvollständig — gemessen und nicht geschätzt. Er sagt: „Was hoeher wird als das Fenster, muss
    sich seitdem selbst um seinen Bildlauf kuemmern — in der Anwendung tut das genau ein Kasten,
    `.app__main`." Beides stimmt nicht mehr: `.app__main` ist im getragenen Bereich der Kasten,
    der **nicht** läuft, und die Zahl ist nicht eins, sondern eine je Ansicht plus `.runarea`,
    `.kcolumn__body` und die Tabellenfläche. Ein unvollständiger Satz zählt zu wenig auf; dieser
    benennt den falschen Kasten. Fix: den letzten Halbsatz auf „…tut das seit T-326 genau ein
    benannter Laufbereich je Ansicht (`viewport-layout.css`, E-112); `.app__main` rahmt und läuft
    nur im Rückfall" ändern. Der Auftrag hat T-326 die Datei verboten — die Änderung gehört
    trotzdem zu diesem Umbau und nicht in die Zukunft.
```

```
apps/web/src/shared/ui/ScreenBody.tsx:159   niedrig   `ScreenFrame` setzt über
    `runAreaSurface(label, true)` immer `tabIndex={0}` und `role="region"`, obwohl derselbe
    Dateikopf zwei Zeilen darüber sagt: „Er laeuft **nicht**; die Bereiche darin tun es." Im
    getragenen Fensterbereich ist das auf Board, Einstellungen und Zeiterfassung ein
    Tabulatorhalt, an dem Bild-ab nichts tut — die Begründung für `tabIndex={0}` (T-322 R-4:
    „jeder **Laufbereich** liegt genau einmal in der Tabulatorreihenfolge") trägt für einen
    Kasten, der ausdrücklich keiner ist, nicht. Fix: `ScreenFrame` nimmt `tabIndex={-1}` (die
    Sprungmarke braucht nicht mehr), und die Laufbereiche darin behalten ihre 0. Das kostet auf
    diesen drei Ansichten je einen Tabulatorschritt und nimmt drei tote Stationen weg.
```

```
apps/web/src/features/bookings/BookingsScreen.tsx:354   niedrig   Einzige Stelle, an der
    `.screen__bar` **nicht** als Umschlag steht, sondern als Zusatzklasse an einem vorhandenen
    Element (`<ul class="screen__bar pick-list pick-list--inline">`). Wirkung ist hier richtig
    (`.pick-list` hat keine eigene Polsterung, `ul { padding: 0 }` steht in `base.css`, und
    `.screen__bar` gewinnt an Spezifität), und die Prosa in `viewport-layout.css:157` deckt
    diesen Fall ausdrücklich. Falsch ist nur Annahme 3 des Berichts, die „immer ein Umschlag"
    sagt. Fix: entweder den Satz im Bericht/Papier auf die Bedingung zurücknehmen oder die
    Stelle angleichen — eine der beiden Wahrheiten muß weg, sonst liest der nächste Durchgang
    die Ausnahme als Fehler.
```

```
apps/web/src/shared/ui/ScreenBody.tsx:122   niedrig   Die Doku von `ScreenBodyProps.className`
    nennt `screen__body--center` als einen von zwei vorkommenden Werten. Die Klasse steht in
    keiner CSS-Datei und an keiner Aufrufstelle (gemessen über `apps/web/src`, `packages/*/src`,
    `tests/`); zentriert wird tatsächlich über `margin-block: auto` an den drei Bauformen
    (`viewport-layout.css:318`). Fix: den Satz streichen oder auf `table-wrap` verkürzen.
```

```
apps/web/src/app/router.ts:73   niedrig   `ROUTE_NAMES` hat heute **keinen** Leser (gemessen über
    apps, tests, packages). Das ist gewollt (der Meßsatz kommt in T-330), gehört aber in den
    Auftrag: eine Menge ohne Leser mißt nichts, und eine ungenutzte Ausfuhr überlebt
    Aufräumläufe nicht zuverlässig. Dazu der Rest des Lochs, den `ROUTE_NAMES` **nicht** zumacht:
    Eine zwölfte Route mit Eintrag in `ROUTE_NAME_BY_NAME` und `SEGMENT`, aber ohne `case` in
    `parseRoute` (:142), fällt still auf das Dashboard zurück. Ein Meßsatz, der über
    `ROUTE_NAMES` × `href(name)` fährt, mißt dann zweimal das Dashboard und bleibt grün. Fix für
    T-330: der Meßsatz prüft nach der Navigation, daß `parseRoute(location.hash).name` die
    angesteuerte Route ist — sonst wandert das Loch nur eine Stelle weiter.
```

## A.2 Was ich bestätigt habe

- **`ROUTE_NAMES` ist keine vergeßliche Menge.** Nachgemessen mit `tsc` gegen eine Kopie von
  `router.ts`, drei Richtungen, jeweils gegen denselben Grundlauf (die `undici-types`-Meldungen
  der Umgebung stehen in allen Läufen und sind kein Unterschied):
  fehlender Eintrag → **TS2741** (`Property 'neu' is missing …`, und zusätzlich derselbe Fehler
  an `SEGMENT`); überzähliger Eintrag → **TS2353**; falscher Wert (`todos: "todo"`) → **TS2322**.
  `Object.values` liefert `readonly RouteName[]` ohne eine Typzusicherung. Die Bauart trägt.
- **Ein Muster, elf Umsetzungen — mit einer benannten Abweichung.** Alle elf Ansichten haben
  genau ein `.screen__body`, es ist das letzte in-flow-Kind von `.screen`, und was danach im
  Quelltext steht, sind ausschließlich Dialoge. `.scrim` ist `position: fixed`
  (`components.css:2435`), also kein Flex-Element; `position: relative` an `.screen__body`
  bildet keinen umschließenden Block für feste Positionierung — die Dialoge zentrieren weiter im
  Fenster. Die Zweige „leer" und „Erfolg" einer Ansicht schließen einander aus, `id="inhalt"`
  gibt es dadurch nie zweimal. Die einzige Abweichung im Muster ist Befund
  `BookingsScreen.tsx:354`, die einzige Stelle mit kopierter statt geteilter Regel ist Befund
  `viewport-layout.css:303` (und, kleiner, `PANEL_LABEL`).
- **Was aus `viewport-layout.css` gefallen ist, wird ersetzt.** Die vier `:has()`-Regeln sind
  Zeile für Zeile aufgegangen: `.app__main:has(…) { overflow-y: hidden }` → der Rahmen läuft
  ohnehin nicht mehr, `.screen:has(> .board) { height: 100% }` → das Rasterfach `minmax(0, 1fr)`
  an `.app__main`, `> .board__bar`/`> .list-more { flex: none }` → die Sammelregel `.screen > *`
  und `.screen__body--frame > .list-more`, `> .board` → `.screen__body--frame > .board`,
  `.kcolumn*` → dieselben Regeln unter `.screen__body--frame`. Nichts fehlt; dazugekommen ist
  der gerechnete Boden `calc(12rem + var(--space-3))`.
- **Die Dialogregeln sind zeichengleich** (Zeilen 55–92 gegen `HEAD` 9–48).
- **`scrollbar-gutter: stable` ist umgezogen, nicht verloren** — von `.app__main` an jeden
  Laufbereich, und die Inhaltsbreite hängt nicht mehr an der Listenlänge. Nur der Kopf ist nicht
  mitgezogen (Befund oben).
- **Der obere und untere Innenabstand bleiben gerechnet gleich** (24 px oben an `.screen`, 24 px
  unten im Laufbereich, 24 px seitlich an den drei Teilen; `--screen-inset` schaltet den schmalen
  Fall an einer Stelle statt an vier).
- **Kein `any`, keine Typzusicherung, kein `@ts-`, kein verschlucktes `catch`** in den
  hinzugefügten Zeilen von `apps/web/src` (gemessen über den Diff).
- **Fremder Text ist behandelt**: `ScreenBody label={foreignText(todo.title)}` ist die von
  `proof:foreign` anerkannte Senke (`ForeignText → string`), Lauf grün 21/21.
- **Kein Oberflächentext neu, geändert oder gestrichen**: `proof:locked` 9/9, `proof:surface`
  27/27, `proof:clamp` 21/21.
- **`.settings-rail` ohne tote Klebung**: `position: sticky` **und** die Rücknahme
  `position: static` in der 60-rem-Stufe sind beide gefallen, nicht nur eine der beiden.

## A.3 Urteil Strang A

**Nicht freigegeben.** Es blockiert `viewport-layout.css:303` (**hoch**): In vier Ansichten wird
Inhalt abgeschnitten und unerreichbar, in den Einstellungen läuft dabei gar nichts mehr. Das ist
die Fehlerklasse, die dieser Umbau ausdrücklich beheben sollte (T-322 R-d, AK-18), und die
Behebung ist eine Regel in derselben Datei, in der T-326 sie für die Zeiterfassung schon
geschrieben hat.

Mit derselben Nacharbeit einzusammeln, weil sie an denselben Zeilen liegen:
`viewport-layout.css:160` (Rinne im festen Teil), `SettingsScreen.tsx:143` (`PANEL_LABEL`) und
`base.css:41` (falscher Kommentar). Die vier niedrigen Befunde können in dieselbe Runde oder in
die nächste.

---

# Strang B — T-327, `proof:release-safety` mißt die Verdrahtung

## B.1 Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:1638   mittel   Die Liste „Was diese Gestalt
    **nicht** fängt" ist unvollständig, und die fehlende Lücke ist begehbar. Sie nennt vier
    Punkte: Herkunft von `now`/`logger`, ein Prüfer, der durch eine dritte Funktion wandert,
    `node_modules/**` und das Verhalten. Nicht genannt — und gemessen offen — ist der **Port
    `source` selbst**. 6a (`VERSION_MODULE_CONSUMERS`, :1668) nagelt fest, wer
    `features/version/version.ts` einführt; wer `features/version/source.ts` einführt, ist von
    keiner der sechs Gestalten erfaßt. 6b läßt für `source` die Wertform
    `PropertyAccessExpression` zu, ohne zu messen, woher das Feld kommt. 6d sieht nur
    `composition.ts` und `main.ts`.
```

**Zweiseitig gemessen** (Auszug `git archive HEAD` plus die Arbeitskopie des Wächters,
`@takt/desktop`-Untergrenze im Auszug auf 1 wie bei T-327):

Ausschalter Z-1 — drei Dateien, kein `version.ts`-Import außerhalb der Liste, kein fremder
Schlüssel im Aufrufobjekt, keine Datenbankmarke in `composition.ts` oder `main.ts`:

- `features/settings/lesen.ts` liest `SELECT wert FROM app_setting` (neue Datei, außerhalb des
  Prüferordners),
- `features/settings/quelle.ts` importiert `ReleaseSourcePort` aus
  `features/version/source.ts` und gibt bei gesetzter Einstellung
  `{ ok: false, reason: 'no_release' }` zurück, sonst den echten Port weiter,
- `main.ts` reicht `releaseSource: quelleAusDemBestand(einstellungenAusDemBestand(store), …)` in
  `compose()`; `composition.ts` bleibt **zeichengleich** (`source: options.releaseSource`).

Ergebnis: **`proof:release-safety` 106 bestanden, 0 fehlgeschlagen.** `proof:layers` 36/0.
Die Versionsprüfung ist damit aus dem Bestand still abschaltbar — genau die Wirkung, gegen die
A-A-105 und R-30 geschrieben wurden, nur einen Port weiter links. Was den Weg heute eng hält, ist
nicht der Wächter, sondern daß `entry.ts` `main()` ohne Argumente ruft; das mißt niemand.

Fix, klein und in der Bauart des Laufes: `fuehrtPruefmodulEin` zusätzlich gegen
`features/version/source.ts` spannen und `VERSION_MODULE_CONSUMERS` um die erlaubten Namen je
Datei ergänzen (heute: `composition.ts` → nichts, `main.ts` → `ReleaseSourcePort` als Typ) — die
Menge wird dann an der **Anforderung** aufgespannt („wer kann über die ausgehende Anfrage
entscheiden") und nicht am Modul, das der Schreiber im Blick hatte. Das ist E-099 Punkt 3, und
der Wächter zitiert die Regel selbst. Wenn die Erweiterung nicht in diese Welle paßt: der Absatz
:1638 nennt die Lücke, und der Wortlaut für R-30 sagt dann „die Verdrahtung **des Prüfers**",
nicht „die Verdrahtung".

```
apps/local-api/scripts/proof-release-safety.mjs:486   niedrig   `ts.getScriptKindFromFileName`
    steht **nicht** in der öffentlichen `typescript.d.ts` (gemessen: 0 Treffer in
    `typescript@5.9.3/lib/typescript.d.ts`); es ist eine interne Schnittstelle. Der Wächter ist
    ein `.mjs`, also fängt kein Typprüfer das ab. Die Behandlung ist richtig — bei Abwesenheit
    ein Abbruch mit Namen statt einer Endungsliste im `catch` —, aber der Kommentar sagt nur
    „Fehlt die Funktion in einer künftigen TypeScript-Fassung". Fix: das Wort **intern**
    dazuschreiben, damit der nächste Leser die Laufzeitprüfung nicht für Beiwerk hält, und die
    Fassung von TypeScript daneben nennen, gegen die gemessen wurde (5.9.3).
```

## B.2 Was ich bestätigt habe

- **Die Zählvorschrift, von unten nachgerechnet.** Nicht übernommen, sondern gefahren:
  - alter Wächter gegen den heutigen Baum: **76/0**; neuer: **106/0**.
  - `erwartet`-Eigenschaften (ohne Kommentarzeilen gezählt): **alt 49, neu 72**, also **+23**.
    Die Prosa bei `COUNTER_PROOFS` rechnet 5+4+3+1+6+3+50 = 72 und stimmt damit überein.
  - Prüfsatz-Etiketten alt gegen neu verglichen, nachdem „fünf/sechs Gestalten" normalisiert war:
    **23 neue Gegenproben**, **7 neue Nicht-Gegenproben**, **3 umbenannte** (die drei Sätze, die
    eine Zahl im Text tragen: gelesener Baum 358→361, Programmdateien 121→340, Gegenproben
    49→72). 76 + 7 + 23 = 106.
  - Die sieben neuen Nicht-Gegenproben sind **ausnahmslos** die Sätze über die Art einer Datei
    (`.cts`, `.d.cts`, `.mts`, `.ts`, `.tsx`, `.json`, `.rs`). Die Behauptung „der Umbau allein
    bringt +7 Prüfsätze und ±0 Verstoßeinträge" ist damit nicht geglaubt, sondern gemessen.
- **Die drei zweiseitigen Messungen, jede nachgefahren:**

  | | eingesetzt | alter Wächter | neuer Wächter |
  |---|---|---|---|
  | M-3 | `features/version/augment.cts` mit `read?()` über `declare module` | **76/0 grün** | **92/14 rot**, und Abschnitt 2 nennt `augment.cts` beim Namen |
  | M-4 | Ausschalter aus T-325 B-2 wortgleich, `SELECT locale FROM app_setting` in `composition.ts`, Streuung `...tempo` | **76/0 grün** | **105/1 rot**, **vier** Befunde aus **zwei** unabhängigen Zweigen: 6b („streut Identifier ein") und 3 × 6d (`prepare(`, `SELECT `, `FROM app_setting`) |
  | M-5 | derselbe Ausschalter, lesender Teil in `features/settings/tempo.ts`, in der Verdrahtung nur `startDelayMs: abschaltung(database)` | **76/0 grün** | **105/1 rot**, **genau ein** Befund — 6b „trägt den Schlüssel `startDelayMs`"; 6d ist dabei **grün** |

  M-5 ist die interessante und trägt: **(a) fängt ihn, (c) allein nicht.** Der Satz des Berichts
  an den security-checker ist damit gedeckt. `startDelayMs?: number` steht wirklich an
  `VersionCheckerOptions` (`version.ts:275`), die Umgehung ist also übersetzbar; die
  Übersetzbarkeit selbst habe ich im Auszug nicht nachgefahren (dort fehlen die
  Arbeitsbereichsverweise), sie ist aus der Signatur gelesen.
- **`node_modules/**` bleibt innerhalb der Programme ungelesen und ist benannt**: der Filter
  steht ausdrücklich bei der Programmauflösung (`:580 if (pfad.includes('node_modules/')) continue;`),
  die Lücke an drei Stellen im Kopf (`:422`, `:1406`, `:1649`), und `SKIP_DIRECTORIES` (`:326`)
  hält den Verzeichnislauf davon frei.
- **Die Untergrenze von `@takt/desktop` ist im Ablauf sicher.** `proof:release-safety` läuft
  ausschließlich über `proof:all` in `pruefung.yml`, Auftrag `release-proofs`; davor stehen
  `actions/checkout` und `pnpm install --frozen-lockfile` **im selben Verzeichnis**, die
  Arbeitsbereichsverweise liegen damit innerhalb des Auszugs. `release.yml` und
  `addin-build.yml` rufen den Lauf nicht (`addin-build.yml` nur `proof:callers`). Kein rotes
  Fenster. Daß ein `git archive`-Auszug **ohne** `pnpm install` laut abbricht, habe ich
  nebenbei reproduziert — „4 eigene Datei(en) im Programm, verlangt sind mindestens 60" —, und
  das ist das richtige Verhalten und kein Befund.
- **Die drei zuvor ungelesenen Dateien sind nicht einzeln nachgetragen, sondern als Menge
  zugesichert.** Der Prüfsatz „jede Datei der 7 Übersetzungsprogramme liegt im gelesenen Baum
  (340)" ist eine Aussage über alle Programme, nicht über drei Pfade; `apps/desktop/sidecar/entry.ts`
  ist über `include: ["sidecar","src"]` darin, die beiden `vite.config.ts` über ihr `include`.
  Was strukturell draußen bleibt, ist eine TypeScript-Datei, die weder in einem der acht
  Quellordner noch in einem der sieben Programme liegt — die kann dann aber auch nicht ins
  Erzeugnis gelangen, weil ein Bündler sie nur über einen Import erreicht und ein Import sie ins
  Programm zieht. Der Fund ist damit vollständig gelöst und nicht punktuell geflickt.
- **Kein verschlucktes `catch`.** Alle vier `catch` im Wächter sind ein Zwischenschritt vor
  einem `scheitern(...)` mit Namen und Begründung; der Rückfall „unlesbar heißt leer" gibt es
  nirgends. `traegtTypescript` hat keinen stillen Rückfall auf eine Endungsliste.
- **Am Bestand selbst kein Sicherheitsbefund** an dieser Stelle: ein Aufruf von
  `createVersionChecker`, vier Schlüssel, ein unbedingtes `start()`, ein `stop()`, keine
  Datenbankmarke in `composition.ts` oder `main.ts` — der grüne Lauf sagt das, und die
  Untergrenzen von 6a bis 6c machen ihn rot, wenn er **nichts** findet.

## B.3 Urteil Strang B

**Nicht freigegeben.** Es blockiert `proof-release-safety.mjs:1638` (**mittel**): Der Lauf sichert
mehr zu, als er mißt. Ein Ausschalter über den `source`-Port bleibt 106/0 grün, und mit dem
vorgeschlagenen Wortlaut („mißt die Verdrahtung") würde R-30 auf einer unvollständigen Lückenliste
geschlossen. Das ist genau der Fehler, den `proof:addin` Abschnitt 18 diesem Bestand einmal
gekostet hat: die Menge an der bekannten Tür aufgespannt statt an der Anforderung.

Die Nacharbeit ist klein — entweder 6a auf `features/version/source.ts` erweitern (eine Zeile in
`fuehrtPruefmodulEin`, zwei Einträge in `VERSION_MODULE_CONSUMERS`, je eine Gegenprobe) oder die
Lücke in den Absatz :1638 schreiben und den R-30-Wortlaut entsprechend enger fassen. Alles übrige
an T-327 ist gemessen und trägt; die Arbeit selbst ist die gründlichste Zählvorschrift, die dieser
Bestand bisher hat.

---

## Anmerkung zur Umgebung

Im gemeinsamen Kratzverzeichnis dieser Sitzung hat während meiner ersten Meßreihe ein anderer
Lauf Dateien entfernt (die kopierten Stilblätter verschwanden mitten in einem Playwright-Lauf und
lieferten stumm eine Seite ohne CSS). Ich habe die Reihe danach in einem eigenen, benannten
Unterverzeichnis wiederholt und jede Messung mit `getComputedStyle(.app).display === "grid"`
abgesichert. Alle oben genannten Zahlen stammen aus der zweiten Reihe. Für kommende Aufträge:
Meßhilfen gehören in ein Unterverzeichnis mit der Aufgabennummer, nicht flach in den
Kratzbereich.

---

## Kurzfassung

```
Aufgabe: T-331 — Freigaberunde über T-326 und T-327
Status: fertig
Artefakte: .claude/team/reports/T-331-code-reviewer.md (einzige geschriebene Datei)
Zusammenfassung: Strang A ist **nicht freigegeben**. Der fensterfeste Umbau hat an der
  allgemeinen Stelle die Regel vergessen, die er für die Zeiterfassung einzeln geschrieben hat:
  Kinder eines Laufbereichs behalten `flex-shrink: 1`, und ein Kind mit `overflow: hidden` — jede
  `.card` — schrumpft dann, statt daß der Bereich läuft. In Chromium gemessen: drei Karten je
  210 statt 389 px und **kein** Bildlauf; die Legendenkarte des Exportprotokolls auf 2 px; in den
  Einstellungen 818 px abgeschnitten, während keine Fläche läuft. Betroffen sind Dashboard,
  Export (mitsamt dem Base64-Satz), Exportprotokoll und Einstellungen; mit den Stilblättern von
  HEAD tritt es nicht auf, es ist also neu. Dazu drei mittlere Befunde: der feste Kopf endet
  10 px weiter rechts als der Inhalt darunter, weil nur der Laufbereich eine Bildlaufrinne
  reserviert; `PANEL_LABEL` ist eine zweite Liste neben `AREA_LIST` und nennt zwei Bereiche
  „Einstellungen" wie den Rahmen darum; der Kommentar in `base.css:41` ist jetzt falsch und
  nicht nur unvollständig. Strang B ist **nicht freigegeben**, aber nur an einer Zeile: Die
  Zählvorschrift habe ich von unten nachgerechnet (76 → +7 Sätze über die Art einer Datei → +23
  Gegenproben = 106; `erwartet` 49 → 72) und alle drei zweiseitigen Messungen nachgefahren
  (M-3 92/14, M-4 105/1 mit vier Befunden aus zwei Zweigen, M-5 105/1 mit genau einem Befund und
  grünem 6d) — sie stimmen zeichengenau. Die benannte Lücke ist jedoch **nicht** die einzige: ein
  Ausschalter über den `source`-Port, gebaut außerhalb von `features/version/` und über den
  erlaubten Schlüssel hereingereicht, bleibt gemessen 106/0 grün.
Annahmen: Ich habe die drei Beschlüsse E-113, Z6 und E-114 als entschieden behandelt und nicht
  gemeldet. Für die Messungen habe ich Kopien der Stilblätter und einen `git archive`-Auszug
  benutzt und im Auszug — wie T-327 — die Untergrenze von `@takt/desktop` auf 1 gesetzt; im
  Vorhaben selbst wurde nichts geändert. Den Ausschalter Z-1 habe ich nicht übersetzt, sondern
  nur gegen die Leser gehalten; er ist damit als Lücke des Lesers gemessen, nicht als lauffähiges
  Erzeugnis. Die Schwere des Strang-B-Befundes habe ich auf mittel gesetzt, weil der Bestand
  selbst sauber ist und nur die Zusicherung zu weit reicht.
Risiken: Der Strang-A-Befund ist heute im Standardfenster sichtbar (die Karte „Timer" des
  Dashboards schrumpft schon bei gewöhnlichen Daten), und keiner der 22 Akzeptanzsätze fängt ihn
  — AK-01 wird durch das Abschneiden sogar besser. Wer nur die vorhandenen Zahlen liest, hält
  den Zustand für grün. Sicherheitsseitig: Strang A bringt keine Adresse, keinen Datenweg, keine
  Route; Strang B ist ein Leser und keine Behebung, und der gemessene `source`-Weg ist eine
  offene Zusicherungslücke, kein Fehler im heutigen Erzeugnis — der security-checker (T-332)
  sollte ihn kennen, bevor R-30 geschlossen wird.
Offene Fragen: (1) Der 10-px-Versatz zwischen Kopf und Inhalt ist eine Gestaltungsfrage — soll
  die Rinne am festen Teil nachgezogen werden (`overflow-y: hidden` + `scrollbar-gutter: stable`)
  oder gilt der Versatz als gewollt und wird von ui-designer bestätigt? (2) Wird 6a auf
  `features/version/source.ts` erweitert, oder wird die Lücke geschrieben und der R-30-Wortlaut
  enger gefaßt? (3) `base.css` gehört nach der Hoheitstabelle frontend-dev, war T-326 aber per
  Auflage verboten — wer zieht den Satz nach? (4) `ScreenFrame` mit `tabIndex={0}`: drei tote
  Tabulatorhalte hinnehmen oder auf `{-1}` zurück?
Nächster Schritt: Eine Nacharbeitswelle mit **einem** Auftrag an frontend-dev
  (`viewport-layout.css:303` hoch, dazu `:160`, `SettingsScreen.tsx:143`, `base.css:41` und die
  vier niedrigen Befunde) und **einem** an domain-dev (`proof-release-safety.mjs:1638` und
  `:486`). Danach dieselbe Freigaberunde nur über die geänderten Zeilen, und in derselben Welle
  ein Meßsatz je Laufbereich `scrollHeight <= clientHeight` **für jedes direkte Kind** — ohne
  ihn kommt Befund 1 beim nächsten Umbau zurück.
```
