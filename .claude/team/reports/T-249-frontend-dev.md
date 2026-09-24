# T-249-2 — Nachweis- und Bauskripte pfadunabhängig machen

Aufgabe: T-249-2 — Nachweis- und Bauskripte pfadunabhängig machen, bevor die Umstrukturierung
beginnt
Status: fertig
Datum: 2026-09-10

## Artefakte

Neu:

- `apps/web/scripts/source-anchors.mjs`
- `apps/desktop/scripts/source-anchors.mjs` (zeichengleich bis auf den Kopf und
  `locateWorkspacePackage`; Begründung unten unter *Offene Fragen*)

Geändert:

- `apps/web/scripts/proof-foreign.mjs`
- `apps/web/scripts/contrast-check.mjs`
- `apps/web/scripts/proof-surface.mjs`
- `apps/web/scripts/engine-parity/fixture.mjs`
- `apps/desktop/scripts/proof-shell-surface.mjs`
- `apps/desktop/scripts/build-sidecar.mjs`

Nicht geändert und begründet: `apps/desktop/scripts/build-app.mjs`,
`apps/desktop/scripts/verify-sidecar.mjs` (siehe Stellenliste, Nummern 19 und 20).

**Kein Produktivcode berührt, nichts verschoben.** `git diff --stat -- apps/web apps/desktop`
nennt genau die sechs Dateien oben, dazu zwei unversionierte neue Skripte.

## Zusammenfassung

Jede Stelle in meiner Hoheit, die eine Quelldatei über einen festen Pfad liest, hat jetzt eine
von zwei Antworten: **Auflösung** über ein Merkmal, das ein Umzug mitnimmt (Deklarationsname,
Ausfuhrname, Paketname, Dateiname im ganzen Baum), oder **fail-closed** mit einem Satz, der den
gesuchten Gegenstand beim Namen nennt. Nicht gefunden endet nirgends mehr als bestandener
Prüfsatz. Die Mengenprüfung aus T-247-7 ist dort nachgezogen, wo ein Lauf über eine Menge
urteilt und keine Untergrenze hatte.

Die entscheidende Messung ist die **Generalprobe des Umzugs**: In einer Kopie des Bestands
außerhalb des Projekts wurden `src/api`, `src/lib`, `src/components`, `src/screens` und
`src/styles` umbenannt und 105 Dateien mit umgeschriebenen Einfuhren nachgezogen. Alle vier
betroffenen Läufe melden danach **zeichengleich dieselben Zahlen** wie vorher. Die heutigen
Fassungen derselben Läufe melden an demselben Baum zwei harte Abbrüche und einen ENOENT.

## Die Stellen, je Stelle eine Antwort

### `apps/web/scripts/proof-foreign.mjs`

1. **`api/types.ts`** → *Auflösung.* Gesucht wird die eine Quelldatei, die
   `type ForeignText` deklariert (`locateDeclaringFile`). Genau ein Treffer ist Pflicht; null
   und zwei sind beides ein **Abbruch** mit Namen — bei zwei wüsste der Lauf nicht, über welche
   Datei er urteilt. Der Abbruch erfolgt sofort und nicht als eines von zwanzig `FEHL`, weil
   ohne diesen Anker kein Abschnitt darunter einen Gegenstand hat.
2. **`lib/foreign.ts`** (die Behandlungen `quotedName`, `foreignText`) → *Auflösung* über den
   **Ausfuhrnamen** im Modulgraphen (`locateExport`), genau ein Treffer.
3. **`components/Foreign.tsx`** → dieselbe Auflösung über den Ausfuhrnamen `Foreign`.
4. **`lib/eingesetzt.ts`** (die Kunstquelle der drei Gegenproben in Abschnitt 8) → *Auflösung.*
   Sie liegt jetzt im **Verzeichnis der aufgelösten Dienstantworten** und führt ihren Typ über
   `./<nachbarname>` ein. Vorher standen dort zwei feste Pfade in einer Datei, die es auf der
   Platte gar nicht gibt; nach dem Umzug hätte die Kunstquelle nicht mehr übersetzt, alle drei
   Gegenproben hätten Typfehler statt der eingesetzten Verletzung gefunden — und die dritte, die
   gerade Typfehler sucht, wäre dabei **grün** geblieben.
5. **Der Quellbaum `src`** → *fail-closed* (`requireDirectory`).
6. **Nebenbefund, mitbehoben:** `ts.parseJsonConfigFileContent` bekam den Namen der
   Konfigurationsdatei nicht mit. Damit blieb `options.configFilePath` leer und der Übersetzer
   löste `types: ["vite/client"]` gegen das **Arbeitsverzeichnis** auf. Gemessen: derselbe Lauf
   aus `apps/web` gestartet meldet 21 bestandene Prüfungen; aus der Wurzel des Bestands
   gestartet meldete er `TS2688: Cannot find type definition file for 'vite/client'` und vier
   Folgefehler — dieselben Dateien, dasselbe Urteil, ein anderes Ergebnis. Dieselbe Familie wie
   der Trennzeichenfehler aus T-247, eine Ebene höher. Behoben; beide Startorte melden jetzt
   21/0.
7. **Die Mengenprüfung** aus T-247-7 (`filesOnDisk` rekursiv mit `node:fs`, Vergleich der
   **Menge**, nicht der Zahl) überlebt die Umstrukturierung ohne Änderung — gemessen, siehe
   Generalprobe.

### `apps/web/scripts/contrast-check.mjs`

8. **`packages/ui-tokens/tokens.css`** → *fail-closed* (`readRequiredFile`; leer zählt als
   fehlend, weil eine leere Datei jede Frage nach einem Merkmal mit „nein" beantwortet und
   dieses „nein" wie ein Befund aussähe).
9. **`apps/web/src` als Zeichenwurzel** → *fail-closed* auf das Verzeichnis, und die Sammlung
   war schon rekursiv; sie überlebt den Umzug ohne Änderung.
10. **Neue Untergrenze, strukturell statt numerisch:** Der Lauf bricht ab, wenn der Baum keine
    Datei enthält **oder** `--bg-canvas` in ihm nicht gezeichnet wird. Der Anwendungshintergrund
    ist das eine Token, unter dem nichts mehr liegt; es gibt keine Oberfläche, die ihn nicht
    zeichnet. Eine feste Zahl hätte der nächste Umbau überholt.
11. **`apps/outlook-addin/src`** → bleibt *still übersprungen*, aber der Wegfall wird jetzt
    **gesagt**. Begründung, warum hier kein Abbruch steht: Der fehlende Fremdbaum macht die
    vierte Richtung **strenger, nie milder** — er kann kein falsches Grün erzeugen, nur ein
    rotes, das wie ein totes Token aussieht. Für dieses Rot muss der erklärende Satz dastehen.
12. Die Zusammenfassungszeilen nennen die Bäume jetzt über `relative()` statt über den
    abgeschriebenen Text `apps/web/src` / `apps/outlook-addin/src`.

### `apps/web/scripts/proof-surface.mjs`

13. **`src/styles`, eine Ebene mit `readdirSync`** → *Auflösung*: rekursive Suche nach `.css` ab
    `src`. Zwei Fehler auf einmal behoben — der feste Ordnername **und** die eine Ebene. Die
    einzelne Ebene war der schwerere Fund: siehe Gegenprobe G-6.
14. **Der Quellbaum `src`** → *fail-closed*, dazu eine benannte **Untergrenze** von 60
    Quelldateien (heute 129) und von einem Stilblatt (heute 7). Jede Regel dieses Laufs ist eine
    Aussage über *alle* Quelldateien; über einer leeren Menge ist sie leer wahr.
15. **`apps/outlook-addin/scripts/proof-addin.mjs`** (die zweite Hälfte des Anredewächters,
    E-086) → *fail-closed* mit Namen statt ENOENT. Eine Fassung, die nicht gelesen werden
    konnte, ist keine gemessene Fassung.

### `apps/web/scripts/engine-parity/fixture.mjs`

16. **`apps/web/src/styles/base.css`** und **`.../components.css`** → *Auflösung* über den
    Dateinamen im ganzen Quellbaum, genau ein Treffer. Ein zweites `components.css` in einem
    Feature-Ordner macht den Lauf rot und nennt beide — richtig so, denn dann wüsste er nicht,
    aus welcher Datei er `.btn` schneidet. `packages/ui-tokens/tokens.css` bleibt ein fester
    Pfad (Paket wird nicht umgeräumt), aber *fail-closed* gelesen.

### `apps/desktop/scripts/proof-shell-surface.mjs`

17. **`packages/domain/src/version.ts`** → *Auflösung*: genau eine Datei unter
    `packages/domain/src`, die `export const VERSION_SHAPE` führt. Die Datei gehört domain-dev
    und kann sich ohne mein Zutun bewegen. Dazu eine **neue Gegenprobe im Lauf**: „T-249-2: die
    Domäne führt kein `VERSION_SHAPE` mehr" — die Zahl der Gegenproben steigt von 53 auf 54.
18. **`capabilities/`, `src-tauri/src`, `apps/web/src`** → *fail-closed* auf das Verzeichnis,
    je mit dem Satz, wofür der Lauf es braucht. Die drei Bäume werden seit T-147 rekursiv
    gelesen und überleben den Umzug.
    Zusatz: Der Befund „Die Release-Adresse steht n-mal" nannte bisher `lib/releasePage.ts` als
    festen Text. Er nennt jetzt die **tatsächlich gefundenen** Dateien. Ein Befund, der eine
    Datei nennt, die es nicht gibt, schickt den nächsten Leser an den falschen Ort.

### `apps/desktop/scripts/build-sidecar.mjs`

19. **`apps/local-api`, `packages/domain`, `packages/storage`** → *Auflösung* über den
    **Paketnamen** in `package.json` (`locateWorkspacePackage`), fail-closed bei null und bei
    zwei Treffern.
    Der Grund ist nicht Kosmetik: Der Zähler dort unterscheidet zwei Nullen. „Null Dateien, weil
    das Paket zur Laufzeit nur Typen liefert" druckt *„zur Laufzeit nicht benutzt (heute nur
    Typen)"* und läuft weiter; „null Dateien, weil der Ordner nicht gefunden wurde" hätte
    **denselben Satz** gedruckt. Für `@takt/local-api` fiele es auf, weil dort ein Abbruch
    folgt; für die beiden anderen wäre der Lauf grün gewesen, über Pakete, die er nicht gesucht
    hat. Dieselbe Familie wie der Windows-Trennzeichenfehler aus T-098, den `paths.mjs`
    beantwortet.

### Zwei Stellen aus dem Auftrag, die keine Änderung brauchten — je begründet

20. **`build-app.mjs` → `packages/domain/src/version.ts`.** Die Datei wird dort **nicht
    gelesen**; der Pfad steht in einem Kommentar und in einem Fehlertext. Die Kopplung an die
    Domäne ist gemessen, und zwar in `proof:shell-surface` Prüfung 4 — die Stelle Nummer 17
    oben. Was `build-app.mjs` tatsächlich liest (Aufgabenbereich, Lizenzbeilage), ist bereits
    fail-closed mit benannten deutschen Meldungen.
21. **`verify-sidecar.mjs` → `apps/local-api/src/access/paths.ts`.** Ebenfalls nur ein
    Kommentar; kein Lesezugriff. Die Binärdatei prüft der Lauf mit `existsSync` und einer
    benannten Meldung.

## Zahlen — grüne

Alle aus dieser Umgebung, Windows 11, Node 22.23.2, pnpm 11.3.0.

| Lauf | vorher | nachher |
|---|---|---|
| `proof:foreign` | 21 bestanden, 0 fehlgeschlagen; 129 Quelldateien, 174 Übergaben, 29 Eingabefelder, 8 Reihen, 1 Übergangsstelle / 6 Aufrufe | zeichengleich |
| `contrast` | 0 von 522 Paaren durchgefallen; 261 Paare, 83 gezeichnete / 83 semantische Farbtoken, 136 Dateien gelesen, 34 im Add-in; 11/11 Gegenproben | zeichengleich |
| `proof:surface` | 27 bestanden, 0 fehlgeschlagen; 129 Quelldateien, 2 Einstiegsseiten, 7 Stilblätter, 29 Live-Regionen | zeichengleich |
| `proof:shell-surface` | 7 Prüfungen, 53 Gegenproben | 7 Prüfungen, **54** Gegenproben |
| `verify:bundle` | — | Bündel gebaut (53 + 18 + 24 Dateien der drei Pakete), `sidecar:verify` 19 bestanden, 0 fehlgeschlagen |
| `proof:all` | — | **248 bestanden, 0 fehlgeschlagen** über alle neunzehn Läufe |
| `pnpm typecheck` | — | fehlerfrei, alle Pakete |

## Zahlen — rote (Gegenproben)

**A. Die Generalprobe des Umzugs.** Kopie des Bestands außerhalb des Projekts
(`apps/web` mit Verbindung auf die echten `node_modules`, dazu `tsconfig.base.json`,
`packages/ui-tokens`, `apps/outlook-addin`). Umbenannt: `api→gateway`, `lib→shared`,
`components→parts`, `screens→features`, `styles→design`; 105 Dateien mit umgeschriebenen
Einfuhren.

| Lauf | heutige Fassung am umgebauten Baum | neue Fassung am umgebauten Baum |
|---|---|---|
| `proof-foreign` | **Abbruch** `api/types.ts liegt nicht im Programm` — Abschnitte 2 bis 8 laufen nie | 21 bestanden, 0 fehlgeschlagen; Anker: `gateway/types.ts` |
| `contrast-check` | grün (Sammlung war schon rekursiv) | grün, dieselben Zahlen |
| `proof-surface` | **ENOENT** `…/src/styles` | 27 bestanden, 0 fehlgeschlagen |
| `engine-parity/fixture` | **ENOENT** `…/src/styles/base.css` | 8 Regeln, Quellen `apps/web/src/design/*.css` |

**B. Gegenstand weggenommen — je Anker.** Alle in derselben Kopie.

| Probe | Ergebnis |
|---|---|
| G-1 `shared/foreign.ts` gelöscht | `FEHL … die Behandlung \`quotedName\` wird von keiner Datei unter \`src\` ausgeführt (128 gelesen)` |
| G-2 zweite Datei führt `Foreign` aus | `FEHL … der Baustein \`Foreign\` wird 2-mal ausgeführt: parts/Foreign.tsx, parts/ForeignZweitschrift.tsx` |
| G-3 `gateway/types.ts` gelöscht | `ABBRUCH die Deklaration von \`ForeignText\` steht in keiner Datei unter \`src\` (128 gelesen)`, Ende-Code 1 |
| G-4 `src` ganz weg | drei Läufe, drei benannte `MissingSourceError` mit dem Zweck im Satz (`… für den Quellbaum, über den dieser Nachweis urteilt` / `… in dem dieser Lauf nach gezeichneten Farbtoken sucht`) |
| G-5 `src` da, aber keine gezeichnete Farbe | neu: **ein** Satz, `… 1 Quelldateien mit 0 gezeichneten Token, und --bg-canvas ist nicht darunter`. Alt: rot, aber mit **125** gleichlautenden Vollständigkeitsbefunden und 4 zerbrochenen Gegenproben |
| G-6 alle `.css` weg, `styles`-Ordner bleibt | **alt: die Regel C `kein display: none … auf einer Live-Region` meldete `ok` über null Stilblätter** — grün und hohl; der Lauf wurde nur rot, weil Regel F seit T-214 eine eigene Ernteprüfung hat. Neu: `Nur 0 Stilblätter unter … — erwartet werden mindestens 1` |
| G-7 `base.css` weg | `das Grundstilblatt der Oberfläche (\`base.css\`) steht unter … nicht mehr (0 Kandidaten nach Dateinamen gelesen)` |
| G-8 `components.css` zweimal | `… steht unter … 2-mal: design/components.css, features/components.css` |
| G-9 `src-tauri/capabilities` weg | `MissingSourceError … für die Fähigkeitenliste der Hülle — ohne sie ist „keine Shell-Zeile" keine Aussage` |
| G-10 `apps/web/src` weg, Hülle vollständig | neu: benannter Abbruch. Alt: `Error: ENOENT: no such file or directory, scandir …` |
| G-11 `VERSION_SHAPE` aus der Domäne entfernt | im Lauf selbst als 54. Gegenprobe, bestanden |
| G-12 sieben Proben unmittelbar am Werkzeug (`locateWorkspacePackage`, `requireDirectory`, `readRequiredFile`, `requireAtLeast`, `locateSingleSource` null und zwei Treffer) | alle sieben rot und benannt; die Gegenrichtung am heutigen Bestand grün |

## Annahmen

1. **Die Umbenennung als Stellvertreter für den Umzug.** Die Generalprobe hat Ordner umbenannt
   und die Einfuhren mitgezogen, nicht die Tiefe verändert. Ein echter Umbau nach `features/*/`
   verschiebt zusätzlich Ebenen. Das trifft die gemessenen Anker nicht — keiner von ihnen fragt
   nach einer Tiefe —, ist aber eine Annahme und keine Messung.
2. **`--bg-canvas` als Anker der Kontrastuntergrenze.** Ich habe eine strukturelle Aussage einer
   Zahl vorgezogen. Fiele dieses Token einmal weg, wäre die Untergrenze rot, ohne dass etwas
   kaputt ist — dann gehört der Anker mit umgestellt, und das ist eine Entscheidung, die
   sichtbar sein soll.
3. **Der Fremdbaum des Add-ins bleibt still.** Begründet in Stelle 11: Sein Wegfall kann nur
   strenger machen. Ich habe den Hinweis auf `stderr` gelegt statt einen Abbruch zu bauen.
4. **`packages/ui-tokens/tokens.css` bleibt ein fester Pfad.** Das Paket steht nicht im Umbau,
   und die Datei ist die einzige ihres Namens im Bestand. Fail-closed ist sie trotzdem.
5. **Die zwei Fassungen von `source-anchors.mjs`.** Siehe offene Frage 1.

## Risiken

- **R-a — zwei Abschriften desselben Werkzeugs.** `apps/web/scripts/source-anchors.mjs` und
  `apps/desktop/scripts/source-anchors.mjs` sind bis auf den Kopf und `locateWorkspacePackage`
  zeichengleich. Genau die Bauart, die E-063 Punkt 4 für den Ursprung allen Übels hält —
  abgeschriebenes Wissen hinkt, und es hinkt still. Sie ist hier bewusst gewählt, weil ein
  gemeinsames Skriptpaket `pnpm-workspace.yaml` und die Wurzel-`package.json` berührt, und
  beide gehören dem Orchestrator. **Es gibt heute keinen Wächter, der die beiden Fassungen
  gegeneinander misst** — anders als beim Anredewächter, für den E-086 genau das tut.
- **R-b — die Anker sind Namen, und Namen kann man ändern.** `ForeignText`, `quotedName`,
  `Foreign`, `VERSION_SHAPE`, `base.css`, `components.css`, `@takt/domain`. Eine Umbenennung
  macht den Lauf rot und nennt den Namen — das ist die Zusage. Sie ist strenger als vorher
  (vorher wurde ein Umzug **nicht** immer bemerkt), aber sie erzeugt Arbeit an einer Stelle, an
  der vorher keine war. Wer `ForeignText` umbenennt, ändert eine Zeile in `proof-foreign.mjs`
  mit.
- **R-c — die Untergrenzen sind Zahlen, wo keine Struktur zu finden war.** `> 60`
  Quelldateien und `>= 1` Stilblatt in `proof-surface`. Beide sind großzügig, beide altern.
- **R-d — `build-sidecar.mjs` ist an einer Stelle gelesen, nicht gemessen.** Die
  Paketauflösung selbst ist mit sieben Proben gemessen (G-12), und der volle Lauf ist grün
  (`verify:bundle`). Der **Fehlerpfad im Skript** — `workspacePackageDirectory` fängt den Wurf
  und ruft `fail` — ist eine dreizeilige Weiterreichung und als solche gelesen, nicht ausgeführt:
  ihn auszuführen hieße, das Bündel mit einem fehlenden Arbeitsbereichspaket zu bauen, und dafür
  hätte ich `packages/` anfassen müssen (Tabu).
- **R-e — kein Sicherheitsbezug.** Keine Adresse, keine Grenze, keine Datei des Benutzers
  berührt. `proof:shell-surface` misst nach den Änderungen dieselben vier Marken in
  `connect-src` und dieselben drei Aufruforte für `open`.

## Offene Fragen an den Orchestrator

1. **Soll `source-anchors.mjs` ein gemeinsames Paket werden?** Ein `packages/build-anchors` oder
   ein Eintrag in `pnpm-workspace.yaml` beendet R-a. Beides sind Dateien des Orchestrators. Bis
   dahin gilt: Wer an einer der beiden Fassungen etwas ändert, ändert es an beiden. Ein
   Zwischenweg wäre ein Wächter nach dem Muster von E-086, der die zwei Dateien zeichengleich
   gegeneinander hält; er gehörte in `proof:surface` oder in einen eigenen Lauf, und ein
   neunzehnter wird zu einem zwanzigsten — das ist eine Entscheidung.
2. **Die Untergrenze `> 60` Quelldateien in `proof-surface` und `proof-foreign`** ist geerbt
   und beliebig. Soll sie auf die Mengenprüfung nach dem Muster von T-247-7 umgestellt werden —
   Verzeichnis lesen und die **Menge** vergleichen —, dann ist das für `proof-surface` eine
   eigene kleine Aufgabe; für `proof-foreign` steht sie bereits daneben (die Prüfung „jede Datei
   unter `src` liegt tatsächlich im Programm").
3. **Wer zieht `apps/local-api/scripts/**` und `apps/outlook-addin/scripts/**` nach?** Der
   Auftrag nannte 20 Skripte mit festen Pfaden; sechs davon lagen in meiner Hoheit. Die übrigen
   liegen bei domain-dev und integration-dev. Beide könnten `source-anchors.mjs` benutzen —
   siehe Frage 1, sonst entstehen vier Abschriften statt zwei.
4. **Der Umbau selbst.** Nach dieser Vorbereitung überleben meine Läufe den Umzug gemessen.
   Sie sagen aber nichts über `apps/web/test/**` (unit-tester), `tests/e2e/**` (e2e-tester) und
   die Einfuhren in `apps/desktop/src/**`. Vor dem Verschieben gehört dieselbe Messung dorthin.

## Nächster Schritt

Vorschlag: Frage 1 entscheiden (gemeinsames Werkzeug oder benannte Abschrift mit Wächter),
danach T-249-3 mit demselben Auftrag für `apps/local-api/scripts/**` und
`apps/outlook-addin/scripts/**` an domain-dev und integration-dev — in **einer** Welle, damit
alle Läufe zur selben Zeit umzugsfest sind. Erst danach das Verschieben selbst.

---

# T-249-4 — Die vier Auflöser werden einer

Aufgabe: T-249-4 — Zusammenführung der vier Abschriften der Quellauflösung
Status: fertig

## Artefakte

Neu, benannte Ausnahme zur Hoheit über die Wurzel:

- `scripts/source-anchors.mjs` — die **eine** Fassung.

Gefallen (beide waren unversioniert, entstanden in T-249-2):

- `apps/web/scripts/source-anchors.mjs`
- `apps/desktop/scripts/source-anchors.mjs`

Geändert, jeweils nur die Einfuhrzeile und die Prosa darum:

- `apps/web/scripts/contrast-check.mjs`
- `apps/web/scripts/proof-foreign.mjs` — zusätzlich die Untergrenze, siehe unten
- `apps/web/scripts/proof-surface.mjs`
- `apps/web/scripts/engine-parity/fixture.mjs`
- `apps/desktop/scripts/build-sidecar.mjs`
- `apps/desktop/scripts/proof-shell-surface.mjs`

Nicht angefaßt, wie beauftragt: `apps/local-api/scripts/source-resolve.mjs`,
`apps/outlook-addin/scripts/proof-addin.mjs`. Kein Produktivcode verschoben.

## Zusammenfassung

Die zwei Abschriften aus T-249-2 sind gefallen; die sechs Läufe, die sie benutzten, binden
`scripts/source-anchors.mjs` über einen relativen Pfad ein. Der Ordner ist absichtlich **kein**
Arbeitsbereichspaket: keine `package.json`, kein Eintrag in `pnpm-workspace.yaml`, keine
Abhängigkeitskante. Grundlage sind die Bausteine aus T-249-2 — `MissingSourceError`,
`displayPath`, `requireDirectory`, `readRequiredFile`, `readTreeSync`, `requireAtLeast`,
`locateSingleSource`, `locateWorkspacePackage`. Aus `source-resolve.mjs` habe ich den besseren
Weg zur Paketauflösung übernommen: Die erlaubten Orte kommen jetzt aus den Mustern in
`pnpm-workspace.yaml` statt aus dem fest verdrahteten `['apps', 'packages']`. Die fachnahen
Helfer (`dienstEinstieg`, `migrationsVerzeichnis`, `quellbaum`) sind bewußt **nicht**
mitgenommen — sie bleiben bei `local-api`.

## Was sich an der Bauart geändert hat

1. **`locateWorkspacePackage(repoRoot, packageName)`** liest die Muster aus
   `pnpm-workspace.yaml` (`apps/*`, `packages/*`, Ausschlüsse mit `!` übergangen), kennt
   `verzeichnis/*` und feste Pfade und **rät nicht**: Eine unbekannte Musterform ist ein Abbruch.
   Der dritte Parameter `roots` ist ersatzlos weg; er war die abgeschriebene Regel. Gemessen:
   Alle acht Pakete lösen auf, ein unbekannter Name wirft mit der Liste der bekannten daneben.
   Zusätzlich zur Fassung aus `source-resolve.mjs`: **Doppelte Paketnamen werden gemeldet**,
   statt daß der zweite den ersten still überschreibt.
2. **`workspaceRoot(startDir?)`** ist neu und öffentlich — die Wurzel wird **erlaufen**
   (`pnpm-workspace.yaml` als Marke), nicht mit `../../../` gezählt. Gemessen: liefert die
   Wurzel, wirft außerhalb eines Arbeitsbereichs.
3. **`readTreeSync` und `locateSingleSource` nehmen ein optionales `enter`** — welche Ordner
   betreten werden. Damit läßt sich die Übergehen-Liste aus `source-resolve.mjs`
   (`node_modules`, `dist`, `target`, `coverage`, `build`, `test`, `tests`, `__tests__`) von
   außen setzen, ohne sie in die gemeinsame Datei zu schreiben. Gemessen: 88 `.tsx` unter
   `apps/web/src`, 50 davon außerhalb von `components/`.
4. **Geworfen statt beendet.** `source-resolve.mjs` ruft `process.exit(1)`. Ein Baustein, der
   das tut, läßt sich nicht gegenprüfen — eine Prüfung, die den Abbruch messen will, stürbe mit
   ihm. Die gemeinsame Datei wirft deshalb `MissingSourceError`; der Kopfkommentar zeigt in vier
   Zeilen, wie ein Lauf das in seine `FEHL`-Zeile umsetzt.

## Die Untergrenze `> 60` in `proof-foreign.mjs`

Wie beauftragt gefallen. Sie stand als `assert.ok(sourceFiles.length > 60, …)` **in** einem
Prüfsatz in Abschnitt 2 — geerbt, willkürlich in der Zahl und an der falschen Stelle: Die
Abschnitte 2 bis 9 urteilen längst über diese Menge, bevor der Prüfsatz sie zählt. Jetzt steht
`requireAtLeast(sourceFiles, 60, 'Quelldateien im Programm', srcRoot)` unmittelbar hinter dem
Aufbau des Programms, in derselben Bauart und mit derselben Zahl wie in `proof:surface`. Der
Prüfsatz „und der Durchlauf ist nicht leer gelaufen" bleibt mit derselben Anrede stehen und
misst weiter `treatedCount > 80`; die genauere Prüfung daneben („und jede Datei unter `src`
liegt tatsächlich im Programm", 129 gegen 129) ist ohnehin die stärkere.

Der Wortlaut `nur … Quelldateien geladen` fiel mit. Vor der Streichung gesucht nach E-087, über
den **Wortlaut** und über **beides** — `git grep` über den versionierten Bestand und ein Lauf
über `apps/*/src`, `packages/*/src`, `tests/`: der einzige Fundort war die Zeile selbst. Keine
Anrede eines Prüfsatzes und kein zugänglicher Name geändert.

## Läufe

Alle vor der Änderung aufgezeichnet und danach Zeichen für Zeichen verglichen:

| Lauf | Ergebnis | Vergleich mit vorher |
|---|---|---|
| `pnpm run proof:foreign` | 0 | **zeichengleich** |
| `pnpm run proof:surface` | 0 | **zeichengleich** |
| `pnpm run contrast` | 0 | **zeichengleich** |
| `pnpm run proof:shell-surface` | 0 | **zeichengleich** |
| `pnpm run verify:bundle` | 0 | **zeichengleich** (19 bestanden, 0 fehlgeschlagen) |
| `pnpm run proof:all` | 0 | neunzehn Läufe, keiner rot |
| `pnpm typecheck` | 0 | — |
| `pnpm run boundaries` | 0 | **eine Zahl geändert**, siehe unten |

`proof:engines` läuft auf diesem Rechner nicht (braucht WebKitGTK). Die einzige Datei dieses
Laufs, deren Einfuhr sich geändert hat, ist `engine-parity/fixture.mjs`; sie lädt gemessen
(`await import(…)` ohne Wurf), und ihre Auflösungen über `locateSingleSource` sind unverändert.

## Die eine Zahl, die sich geändert hat

`pnpm boundaries` meldet **413** statt **415** Quelldateien außerhalb der Domäne. Der Grund ist
genau die Zusammenführung: `checkDeepImports` durchsucht `[...pakete.values()]`, also die
Arbeitsbereichspakete. Die zwei gefallenen Abschriften lagen unter `apps/web` und `apps/desktop`
und wurden mitgezählt; die neue Fassung liegt in der Wurzel und wird nicht mitgezählt.
Gegenprobe gefahren: zwei leere Platzhalterdateien an den alten Orten stellen **415** wieder
her, ohne sie sind es **413**. Die Untergrenze `MIN_DEEP_IMPORT_SOURCES` ist nicht
unterschritten.

Ich lasse die Zahl stehen, weil sie richtig ist — aber sie ist zugleich der Preis der
Entscheidung, und er gehört benannt: **`scripts/source-anchors.mjs` wird vom Grenzwächter nicht
mehr auf Tiefenzugriffe geprüft.** Heute ohne Folgen (die Datei führt ausschließlich `node:fs`,
`node:path` und `node:url` ein, kein `@takt/*`), aber niemand hält das morgen fest. Siehe R-g.

## Annahmen

1. **`workspaceRoot` gehört in die gemeinsame Datei, `dienstEinstieg` nicht.** Der Auftrag nennt
   `paketVerzeichnis` als das, was ich holen soll; ohne die Wurzel läßt es sich nicht bauen. Die
   Wurzel ist ein Baustein, kein fachnaher Helfer.
2. **`requireAtLeast(sourceFiles, 60, …)`** statt `61`. Das alte `> 60` verlangte streng
   genommen 61. Ich habe 60 genommen, damit die Zahl in `proof:foreign` und `proof:surface`
   dieselbe ist; der Unterschied von eins ist ohne Wirkung, weil die Mengengleichheit daneben
   129 gegen 129 misst.
3. **Der dritte Parameter `roots` fällt ersatzlos.** Kein Aufrufer benutzte ihn.
4. **Prosa nachgezogen, wo sie falsch geworden wäre**: der Kopf von `build-sidecar.mjs` (nennt
   jetzt den Wurzelort und den Muster-Leser) und zwei Sätze in `proof-foreign.mjs`, die auf
   `> 60` zeigten.

## Risiken

- **R-a aus T-249-2 ist erledigt**, soweit meine Hoheit reicht: zwei Abschriften weniger, und
  die verbliebene Fassung liegt an einem Ort, den beide erreichen.
- **R-f — es bleiben drei Abschriften außerhalb meiner Hoheit.** Ich habe beim Messen eine
  **fünfte** gefunden, die im Auftrag nicht stand:
  `packages/domain/scripts/check-export-boundary.mjs` trägt ab Zeile 60 denselben Muster-Leser
  noch einmal und sagt es selbst („Der Leser darunter ist eine Abschrift des Lesers in
  `apps/local-api/scripts/source-resolve.mjs`. Das ist bewußt und ungern"). Die Datei gehört
  domain-dev. Sie gehört in dieselbe Umstellung wie `source-resolve.mjs`.
- **R-g — die gemeinsame Datei steht außerhalb des Grenzwächters.** Siehe oben. Ein Satz in
  `checkDeepImports` genügte: `[...pakete.values(), path.join(repoRoot, 'scripts')]`. Die Datei
  gehört domain-dev; ich habe sie nicht angefaßt.
- **R-h — kein Wächter hält die Bausteine an ihrem Platz.** Nichts hindert den nächsten Auftrag
  daran, `migrationsVerzeichnis` doch in die gemeinsame Datei zu schieben und aus ihr den
  Sammelordner zu machen, den der Auftraggeber ausgeschlossen hat. Die Grenze steht heute nur im
  Kopfkommentar.
- **R-i — kein Sicherheitsbezug.** Keine Adresse, keine Vertrauensgrenze, keine Datei des
  Benutzers berührt. `proof:shell-surface` misst nach der Änderung zeichengleich dieselben vier
  Marken in `connect-src` und dieselben Aufruforte für `open`.

## Was domain-dev und integration-dev in der nächsten Welle fehlt

Die gemeinsame Datei kann beide bedienen. Drei Dinge müssen sie selbst mitbringen:

1. **Ihre eigene `scheitern`-Zeile.** Die Bausteine werfen `MissingSourceError`, statt
   `process.exit(1)` zu rufen. `source-resolve.mjs` behält seine Ausgabe und legt einen
   `try`/`catch` darum — vier Zeilen, im Kopf der gemeinsamen Datei ausgeschrieben. Ein
   `instanceof`-Vergleich trägt hier, weil beide dasselbe Modul laden.
2. **Ihre Übergehen-Liste.** `UEBERGANGEN` (`node_modules`, `dist`, `target`, `coverage`,
   `.git`, `build`, `test`, `tests`, `__tests__`) ist eine Entscheidung des Laufs und nicht des
   Bausteins — sie wandert als `enter`-Funktion in den Aufruf von `readTreeSync` bzw.
   `locateSingleSource`. Der Grund, warum sie nicht in die gemeinsame Datei gehört, ist derselbe
   wie bei den fachnahen Helfern: `proof:surface` will Stilblätter unter `src`
   **einschließlich** Unterordnern, `source-resolve.mjs` will Produktivdateien **ohne**
   Prüffälle. Eine gemeinsame Liste wäre für einen von beiden falsch, und zwar still.
3. **`paketQuelle` als eigener Helfer.** Die Bauart „erst den Hinweis versuchen, dann den Baum
   durchsuchen und den Umweg melden" ist gut, aber sie ist eine Regel des Laufs und nicht des
   Bausteins — sie schreibt auf `stdout`, und ein Baustein, der schreibt, ist in einem Nachweis
   schwer zu messen. Sie läßt sich in zehn Zeilen auf `locateSingleSource` und
   `locateWorkspacePackage` aufsetzen und bleibt bei `local-api`.

Was **nicht** fehlt: `arbeitsbereichWurzel` (heißt jetzt `workspaceRoot`), `paketVerzeichnis`
(heißt jetzt `locateWorkspacePackage`, gleiche Auflösung, strenger bei Doppelnamen) und der
Muster-Leser für `pnpm-workspace.yaml`.

## Offene Fragen an den Orchestrator

1. **Soll der Grenzwächter `scripts/` mitlesen?** Siehe R-g. Ein Satz in einer Datei von
   domain-dev; die Zahl stiege dann von 413 auf 414 und wäre wieder vollständig.
2. **Wer räumt `check-export-boundary.mjs` auf?** Siehe R-f — die fünfte Abschrift stand nicht
   im Auftrag und liegt in `packages/**`.
3. **Bleibt `scripts/` ohne Wächter?** Heute liegt eine Datei darin. Fällt die Entscheidung,
   dort mehr abzulegen, braucht der Ordner eine Regel, sonst wird er der Sammelordner.

## Nächster Schritt

Vorschlag: In der nächsten Welle T-249-5 an domain-dev (`source-resolve.mjs` **und**
`check-export-boundary.mjs` auf `scripts/source-anchors.mjs` umstellen, dabei R-g mit einem Satz
schließen) und T-249-6 an integration-dev (die „Landkarte" in `proof-addin.mjs`) — in **einer**
Welle, damit kein Zwischenstand mit drei Fassungen entsteht. Erst danach der Umbau selbst.
