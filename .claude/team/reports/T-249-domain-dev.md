# T-249-1 — Nachweisläufe pfadunabhängig machen (domain-dev)

Aufgabe: T-249-1 — Nachweisläufe pfadunabhängig machen, bevor die Umstrukturierung beginnt
Status: braucht Review

## Artefakte

**Neu**

- `apps/local-api/scripts/source-resolve.mjs` — der gemeinsame Auflöser. Fünf Ausfuhren:
  `arbeitsbereichWurzel()`, `paketVerzeichnis(name)`, `paketQuelle(paket, {hinweis, merkmal})`,
  `quellbaum(paket, unterordner, {mindestens})`, `migrationsVerzeichnis({mindestens})`,
  `dienstEinstieg()`, `scheitern(...)`.

**Geändert**

- `apps/local-api/scripts/proof-callers.mjs`
- `apps/local-api/scripts/proof-openapi.mjs`
- `apps/local-api/scripts/proof-codepoints.mjs`
- `apps/local-api/scripts/proof-release-safety.mjs`
- `apps/local-api/scripts/proof-access.mjs`
- `apps/local-api/scripts/proof-route-policy.mjs`
- `apps/local-api/scripts/proof-taskpane.mjs`
- `apps/local-api/scripts/proof-tags.mjs`
- `apps/local-api/scripts/proof-conflicts.mjs`
- `apps/local-api/scripts/proof-db-permissions.mjs`
- `apps/local-api/scripts/proof-export-api.mjs`
- `apps/local-api/scripts/proof-addin-wiring.mjs`
- `packages/domain/scripts/check-export-boundary.mjs`
- `packages/storage/scripts/embed-migrations.mjs`

Nichts verschoben. Kein Produktivcode angefaßt. Keine gemeinsame Datei angefaßt.

## Zusammenfassung

Alle Stellen in meiner Hoheit, an denen ein Nachweislauf eine Quelldatei über einen festen Pfad
liest, sind auf eine von zwei Antworten gebracht. **Antwort 1 (Auflösung):** Pakete werden über
ihren Namen gefunden (`pnpm-workspace.yaml` plus `package.json`), Dateien innerhalb eines Pakets
über ein **Merkmal** — eine ausgeführte Ausfuhr, die nur in ihnen steht; der bisherige Pfad bleibt
als Hinweis und ist eine Abkürzung, keine Bedingung. Zweimal geht es noch stärker über den
Modulgraphen selbst: die Migrationen über den Einstiegspunkt `@takt/storage/migrations/*`, die
Exportfläche der Domäne über den Eintrag `"./export"` in ihrer eigenen Ausfuhrtabelle.
**Antwort 2 (fail-closed):** Wo nichts oder mehr als eines gefunden wird, endet der Lauf rot und
nennt Paket, Merkmal, durchsuchtes Verzeichnis und Trefferzahl.

Dazu die Untergrenzen. Drei Läufe urteilten über eine Menge, ohne zu messen, ob sie sie überhaupt
gesehen hatten. Die Gegenproben haben zwei davon als **still grün** nachgewiesen — und dabei einen
dritten Fund ergeben, der nichts mit Pfaden zu tun hat: `proof:release-safety` prüfte die zwei
erlaubten Orte der Release-Adresse mit `<=` statt `===` und schrieb wörtlich
`ok  … an den zwei gemessenen Orten (1)`. Das ist repariert.

Was die Läufe behaupten, ist unverändert; sie sind an keiner Stelle milder geworden.
`pnpm run typecheck` und `pnpm run proof:all` sind grün, `pnpm run boundaries` ebenfalls, mit
zeichengleichen Zahlen (8 Exportquellen, 415 Dateien im Tiefenzugriffslauf).

## Zahlen: vorher → nachher

| Lauf | vorher | nachher |
|---|---|---|
| `proof:codepoints` | 45 | **46** (eine Untergrenze dazu) |
| `proof:migrations` | ok, 42 Dateien | ok, 42 Dateien |
| `proof:openapi` | 114 | **115** (eine Untergrenze dazu) |
| `proof:callers` | 56 | 56 |
| `proof:conflicts` | 154 | 154 |
| `proof:tags` | 45 | 45 |
| `proof:access` | 109 | 109 |
| `proof:export-api` | 72 | 72 |
| `proof:taskpane` | 29 | 29 |
| `proof:addin-wiring` | 32 | 32 |
| `proof:route-policy` | 44 | 44 |
| `proof:release-safety` | 31 | **32** (eine Untergrenze dazu) |
| `proof:db-permissions` | übersprungen (Windows) | übersprungen (Windows) |
| `boundaries` | 8 / 415 | 8 / 415 |

`pnpm run proof:all` — Rückgabewert 0, neunzehn Läufe, kein Fehlschlag.
`pnpm run typecheck` — Rückgabewert 0.

## Gegenproben

Alle in einer vollständigen Kopie des Baums (Arbeitsverzeichnis unverändert; die Kopie ist
gelöscht). Für die Kopie mußten die `node_modules/@takt/*`-Verbindungen als Junctions
nachgezogen werden — `tar` hatte sie zu echten Verzeichnissen aufgelöst, und Node lehnt
Typentfernung unterhalb von `node_modules` ab. Wo es aufschlußreich war, ist derselbe Zustand
zusätzlich mit dem Stand aus `HEAD` gemessen.

| # | Gegenstand weggenommen | vor T-249-1 | nach T-249-1 |
|---|---|---|---|
| G1 | `apps/web/src/api/endpoints.ts` → `apps/web/src/features/dienst/endpoints.ts` (Umzug) | — | **grün**, meldet `aufgelöst nach src/features/dienst/endpoints.ts`; 56/56 |
| G2 | `apps/web/src/api/endpoints.ts` gelöscht | rot, aber als **ENOENT-Stapelspur** | rot: `FEHL Quelldatei in @takt/web auflösen`, Merkmal, 151 Dateien durchsucht, 0 Treffer |
| G3 | `apps/web/src` umbenannt (`proof:release-safety`) | **grün, 31/31** — 129 ungelesene Dateien, und `ok … an den zwei gemessenen Orten (1)` | rot, Rückgabewert 1: `Quellordner @takt/web/src lesen … ist kein Verzeichnis` |
| G4 | `packages/storage/migrations` geleert | rot | rot: `liegen 0 Migrationsdatei(en), verlangt sind mindestens 24` |
| G5 | dieselbe, auf 3 Dateien gekürzt | rot mit **falschem Grund** („Erzeuger laufen lassen") | rot: `liegen 3 …, verlangt sind mindestens 24` |
| G6 | `packages/export` → `packages/abrechnung` (Umzug) | **rot** („packages/export gibt es nicht") | **grün**, 8 Quelldateien weiter geprüft |
| G7 | `packages/domain/src/characters.ts` → `src/text/characters.ts` (Umzug, Importe nachgezogen) | **grün, 114/114** — die OpenAPI-Beschreibung nannte einen Ort, den es nicht mehr gab | rot: `und die Beschreibung nennt den einen Ort … — gesucht: packages/domain/src/text/characters.ts` |
| G8 | `git ls-files` liefert 81 statt 906 Dateien (Wurzel auf einen Unterbaum verrutscht) | **grün**: `ok git ls-files liefert Dateien`, 82 Textdateien, 44/45 | rot: `81 statt mindestens 400 — der Lauf sieht nur einen Ausschnitt des Baums` |
| G9 | Nachweispfad `src/http` gibt es nicht (`proof:access`, B-2.5) | leeres `readdirSync` bzw. ENOENT | rot: `Nachweispfad … lesen (A-A-68) … Über einem nicht gelesenen Ordner ist „kein === auf Tokenmaterial" wahr` |
| G10 | Auflöser selbst, sechs Fehlerwege: unbekanntes Paket, Merkmal ohne Treffer, mehrdeutiges Merkmal (20 Treffer), Untergrenze unterschritten, Untergrenze fehlt, Ordner fehlt | — | sechsmal rot, Rückgabewert 1, jeweils mit Gegenstand, Ort und Zahl |

**G3, G7 und G8 sind die eigentliche Ausbeute.** Drei Läufe waren still grün über einer Menge, die
sie nicht gesehen hatten — dieselbe Bauart wie `proof:foreign` mit seinen 129 Dateien.

## Was je Stelle entschieden wurde

**Auflösung (Antwort 1)**

- Paket über den Namen: alle acht Quellordner in `proof:release-safety`, alle zehn Einzeldateien
  dort, `WEB_SOURCE_DIR`/`ADDIN_SOURCE_DIR` in `proof:callers`, der Nachweispfad in
  `proof:access`, `domainRoot`/`exportRoot` und die Suchwurzeln des Tiefenzugriffslaufs in
  `check-export-boundary`.
- Datei über ein Merkmal: `endpoints.ts`, `types.ts`, `client.ts` (Oberfläche), `client.ts`
  (Add-in), `app.ts`, `taskpane/certificate.ts`, `access/verifier.ts`, `access/crypto.ts`,
  `src/index.ts` (fünf Läufe, vorher fünf Abschriften desselben Pfades), die sieben Routendateien
  in `proof:openapi`, `characters.ts` (zweimal), die OpenAPI-Beschreibung selbst.
- Über die Ausfuhrtabelle, also echt über den Modulgraphen: `@takt/storage/migrations/*` (drei
  Läufe), `"./export"` von `@takt/domain`, Selbstauflösung von `@takt/storage` in
  `embed-migrations.mjs`.
- Wurzel des Arbeitsbereichs: `../../../` und `../../..` durch Hinauflaufen bis
  `pnpm-workspace.yaml` ersetzt (3 Stellen).

**Fail-closed (Antwort 2)**

- Die beiden stillen `continue` und das leere `catch` in `collectTree()`
  (`proof:release-safety`) sind Abbrüche mit Namen geworden.
- `readdirSync` auf dem Migrationsverzeichnis in `embed-migrations.mjs` fängt jetzt ab und sagt,
  daß ein nicht gelesenes Verzeichnis keine leere Menge ist.
- `--check` in `embed-migrations.mjs` unterscheidet „Datei nicht da" von „Datei anders".
- Die Nachweispfade in `proof:access` werden vor dem Sammeln geprüft.

**Untergrenzen neu eingezogen**

| Ort | Untergrenze | heutiger Stand |
|---|---|---|
| `proof:codepoints`, `git ls-files` | 400 | 922 |
| `proof:codepoints`, tatsächlich **gelesen** | 400 | 904 |
| `proof:openapi`, Ausschnitt der Routen | 7 Dateien, 20 000 Zeichen | 7 / 115 304 |
| `proof:release-safety`, je Quellordner | 25/60/15/2/5/9/12/4 | 56/129/33/3/11/19/24/8 |
| `proof:release-safety`, Orte der Release-Adresse | genau 2 (war `<= 2`) | 2 |
| `embed-migrations`, Migrationsdateien | 24 | 42 |
| `source-resolve.mjs`, `quellbaum()` | verpflichtendes Argument, kein Vorgabewert | — |

**Schon vorhanden und unangetastet gelassen:** `proveHarvest` in `proof:callers` (100/25),
A-A-68 in `proof:access` (14, zweiter Weg, vier tragende Dateien), `MIN_EXPORT_SOURCES` und
`MIN_DEEP_IMPORT_SOURCES` in `check-export-boundary`, `routes.length >= 60` in
`proof:route-policy`, `examplesChecked >= 8` und `grenzen.size >= 8` in `proof:openapi`.

## Annahmen

1. **Ein Merkmal ist eine ausgeführte Ausfuhr, kein Wort aus einem Kommentar.** Gewählt wurden
   Zeilen wie `export function checkHealth(` oder `export const nodeSecretDigest`. Genau ein
   Treffer gilt als Auflösung; null **und** mehr als einer sind rot. Ein mehrdeutiges Merkmal
   wäre eine Auflösung, die sich selbst nicht traut.
2. **`test`, `tests`, `__tests__`, `dist`, `target`, `build` werden beim Suchen nicht betreten.**
   Die Läufe suchen Produktivdateien. Ein Prüffall, der die gesuchte Zeile zitiert, machte die
   Auflösung mehrdeutig; ein Bauergebnis trägt veraltete Abschriften derselben Zeilen — dieselbe
   Falle wie in E-087. Gemessen: ohne diesen Ausschluß fand die Mehrdeutigkeitsprobe 26 statt 20
   Kandidaten, sechs davon Prüfdateien.
3. **`scheitern()` beendet den Prozeß, statt zu werfen.** Die Auflösung läuft in den meisten
   Nachweisen auf der obersten Modulebene, vor dem ersten Prüfsatz. Ein geworfener Fehler käme
   dort als Stapelspur heraus und sähe aus wie ein Absturz des Werkzeugs; ein Fehlschlag der
   Messung soll wie einer aussehen: `FEHL`, Grund, Rückgabewert 1.
4. **Die Untergrenzen liegen rund bei der Hälfte des heutigen Standes.** Sie sollen rot werden,
   wenn ein Ordner verschwindet oder ein Sammler ins Leere greift, nicht wenn jemand aufräumt.
   Sie sind kein Zensus.
5. **Die Ausnahmelisten in `proof:callers` (`WEB_FETCH_HOME`, `WEB_REQUEST_HOME`,
   `ADDIN_FETCH_HOME`) kommen aus derselben Auflösung wie die Dateien selbst**, statt ein zweites
   Mal getippt zu werden. Sonst wäre der Tag denkbar, an dem der Ausnahmeort auf eine Datei zeigt,
   die es nicht mehr gibt — und dann ist jeder Zugriff im Baum ein Fund oder keiner.
6. **`packages/domain/scripts/check-export-boundary.mjs` trägt eine Abschrift des Auflösers
   (rund 90 Zeilen).** Die Domäne darf `@takt/export` nicht als Abhängigkeit führen — ein Eintrag
   nur dafür, daß ein Wächter ein Verzeichnis findet, wäre genau die Grenzverletzung, gegen die
   dieser Wächter geschrieben ist. Der richtige Ort wäre ein gemeinsames Werkzeugpaket; das
   anzulegen heißt, `pnpm-workspace.yaml` und eine `package.json` zu ändern. Siehe Offene Fragen.
7. **Relative Importbezeichner (`import { compose } from '../src/composition.ts'`) habe ich
   gelassen.** Sie sind der Modulgraph, nicht ein Dateizugriff daneben; ein Umzug bricht sie beim
   Laden, laut und sofort. Ausgenommen sind die beiden dynamischen Importe in `proof:access`, die
   dieselben Dateien meinten, die dreißig Zeilen darüber schon in `TRAGENDE_DATEIEN` stehen —
   zwei Abschriften desselben Ortes in einem Abschnitt sind eine zu viel.

## Risiken

1. **Der Auflöser ist jetzt eine gemeinsame Abhängigkeit von zwölf Läufen.** Ein Fehler in ihm
   fällt in zwölf Läufen gleichzeitig aus. Dagegen steht: Er fällt **rot** aus, nie still, und die
   sechs Fehlerwege sind einzeln gemessen (G10). Trotzdem gehört er in die Prüfung wie ein
   Wächter, nicht wie ein Werkzeug.
2. **Ein Merkmal ist eine Zeichenkette im Quelltext.** Wer eine Funktion umbenennt, ohne den
   Nachweis anzufassen, macht ihn rot. Das ist gewollt und der Preis dafür, daß ein Umzug ihn
   *nicht* rot macht — aber es ist eine neue Kopplung, und sie steht in `paketQuelle`-Aufrufen
   und nicht in einer Liste an einer Stelle.
3. **Die Untergrenzen sind Zahlen im Quelltext und veralten.** Sie sind bewußt weit unten
   angesetzt; wachsen die Bäume weiter, werden sie mit der Zeit wirkungslos. Ein Wächter über die
   Wächter (Verhältnis statt absoluter Zahl) wäre der nächste Schritt, gehört aber nicht in diesen
   Auftrag.
4. **`proof:release-safety` ist strenger geworden** (`===` statt `<=` bei den Orten der
   Release-Adresse). Heute grün. Wer künftig eine der beiden Abschriften entfernt, bekommt dort
   rot — richtig so, aber es ist eine Verschärfung und braucht das Auge des Code-Reviewers und
   des Security-Checkers, weil A-V-16/A-V-18 daran hängen.
5. **Sicherheitshinweis, keiner meiner Änderungen, aber laut:** Die Gegenprobe G3 zeigt, daß
   `proof:release-safety` bis heute mit einem nicht gelesenen `apps/web/src` grün blieb — und
   dieser Lauf ist der einzige, der behauptet, daß **nirgends** im Baum eine zweite Adresse steht,
   **nirgends** heruntergeladen wird und `fetch` **nirgends** außerhalb einer Datei vorkommt.
   Diese Aussagen standen über einem Ausschnitt, ohne daß es jemand hätte merken können. Für den
   Zeitraum bis heute ist damit keine Verletzung belegt — aber auch keine Abwesenheit.

## Offene Fragen

1. **Gemeinsames Werkzeugpaket für die Auflösung?** Es gibt jetzt drei ähnliche Leser im Baum:
   meinen `apps/local-api/scripts/source-resolve.mjs`, die Abschrift in
   `packages/domain/scripts/check-export-boundary.mjs` und — aus derselben Welle —
   `apps/web/scripts/source-anchors.mjs` und `apps/desktop/scripts/source-anchors.mjs` von
   frontend-dev. Vier Fassungen derselben Absicht sind genau das, was E-086 Punkt 1 verbietet.
   Ein Paket `@takt/tooling` (nur Bauzeit, keine Laufzeitabhängigkeit) wäre der Ort. Das ändert
   `pnpm-workspace.yaml` und eine `package.json` und gehört damit dem Orchestrator. **Bitte um
   Entscheidung; ich habe nichts angelegt.**
2. **`apps/local-api/scripts/proof-appdata.mjs` ist nicht versioniert** (`git ls-files` führt es
   nicht, `git status` zeigt `??`). Sechs Nachweisläufe importieren es — `proof:access`,
   `proof:tags`, `proof:conflicts`, `proof:db-permissions`, `proof:export-api`,
   `proof:addin-wiring`. In einem frischen Klon brechen die sechs beim Laden ab. Das ist genau
   die T-207-Falle („`git grep` übersieht unversionierte Quelldateien"), diesmal an einer
   tragenden Datei. **Muß vor dem Commit mit aufgenommen werden.** Es ist nicht meine Datei
   dieses Auftrags; ich habe sie nicht angefaßt.
3. **Der Arbeitsbaum zeigt seit einer Änderung an `.gitattributes` (neu, nicht von mir) faktisch
   jede Datei als geändert.** Vermutlich Zeilenende-Normalisierung. Das macht jedes Review über
   `git diff` unbrauchbar, solange es so steht. Wer immer das eingebracht hat, sollte es
   getrennt committen, damit der Rest lesbar bleibt.
4. **`proof:foreign` und `proof:surface` liegen bei frontend-dev, `proof:addin` bei
   integration-dev.** Meine Gegenproben zeigen, daß dieselbe Blindheit dort ebenso zu suchen ist.
   Ich habe die Läufe nicht angefaßt.
5. **`proof:db-permissions` läuft unter Windows gar nicht durch** (bewußt, POSIX-Modus). Die
   Auflösung in ihm ist damit auf dieser Maschine nicht gemessen, nur geladen. Auf Linux zu
   prüfen.

## Nächster Schritt

Review durch Code-Reviewer und Security-Checker, mit zwei benannten Punkten: die Verschärfung in
`proof:release-safety` (`===` statt `<=`) und der Auflöser als neue gemeinsame Abhängigkeit von
zwölf Läufen. Parallel Entscheidung zu Offene Frage 1 (Werkzeugpaket) und **vor** dem Commit
Offene Frage 2 (`proof-appdata.mjs` versionieren). Erst danach der erste Umzug: Ich schlage
`apps/local-api/src/routes` und `src/usecases` je Merkmal als erste Welle vor — die Läufe darüber
sind jetzt gemessen umzugsfest, und G1 zeigt, wie ein solcher Umzug aussieht, wenn er gutgeht.

---

# T-249-5 — Auf die gemeinsame Fassung umstellen (domain-dev)

Aufgabe: T-249-5 — Auf die gemeinsame Fassung umstellen, fünfte Abschrift entfernen,
Grenzwächter vollständig machen
Status: braucht Review

## Artefakte

**Geändert**

- `apps/local-api/scripts/source-resolve.mjs` — setzt auf `scripts/source-anchors.mjs` auf.
  Gefallen sind `arbeitsbereichMuster`, `allePakete` und `baumBegehen`; die Ausfuhrfläche ist
  unverändert (`scheitern`, `arbeitsbereichWurzel`, `paketVerzeichnis`, `paketQuelle`,
  `dienstEinstieg`, `migrationsVerzeichnis`, `quellbaum`). Kein Aufrufer mußte angefaßt werden.
- `packages/domain/scripts/check-export-boundary.mjs` — die **fünfte Abschrift** des
  Muster-Lesers ist gefallen; dazu die Wurzeln von `checkDeepImports` (Punkt 3) und
  `relativeToRepo` über den gemeinsamen `displayPath`.

**Nicht angefaßt**, wie beauftragt: `scripts/source-anchors.mjs` (fremde Datei, siehe Offene
Frage 6), `apps/outlook-addin/scripts/proof-addin.mjs` (integration-dev), kein Produktivcode,
keine gemeinsame Datei des Orchestrators.

## Zusammenfassung

Beide Dateien binden jetzt `scripts/source-anchors.mjs` über einen relativen Pfad ein. `source-resolve.mjs`
ist dabei von 458 auf 367 Zeilen geschrumpft — gefallen sind Wurzelsuche, Muster-Leser,
Paketauflösung und der eigene Baumgang; geblieben ist genau das, was frontend-dev benannt hat:
die `scheitern`-Ausgabe mit einer Umhüllung, die `MissingSourceError` in die `FEHL`-Zeile
übersetzt, die `UEBERGANGEN`-Liste als `enter`-Funktion und `paketQuelle` als eigener Helfer,
weil er auf `stdout` schreibt. Die drei fachnahen Helfer `dienstEinstieg`,
`migrationsVerzeichnis` und `quellbaum` bleiben bei `local-api`. Im Grenzwächter fiel dieselbe
Doppelung; zusätzlich liest er jetzt `scripts/` mit, womit die Abdeckung wieder lückenlos ist:
**414** statt 413.

## Die drei Punkte des Auftrags

### 1 — `source-resolve.mjs` auf der gemeinsamen Fassung

Neu geschrieben ist `resolveOrFail(title, work)`: Der Baustein wirft, der Lauf entscheidet, wie
ein Fehlschlag aussieht. Die Meldungen der gemeinsamen Fassung sind auf genau diese Ausgabe hin
gesetzt (erste Zeile ohne Einzug, Folgezeilen mit acht Leerzeichen), also gehen sie als **eine**
Zeile an `scheitern` — die vier Zeilen aus dem Kopfkommentar dort, unverändert übernommen. Ein
Fehler, der **kein** `MissingSourceError` ist, fliegt weiter; ihn zu schlucken hieße, eine fremde
Ursache als gemessenen Befund auszugeben.

`UEBERGANGEN` bleibt hier und geht als `enterSourceDirectory` in `readTreeSync` bzw.
`locateSingleSource`. `paketQuelle` behält seine Bauart — erst der Hinweis, dann der Baum, dann
die Meldung des Umwegs —, sitzt aber auf `locateSingleSource` statt auf einem eigenen Baumgang.
Der Hinweis bleibt eine Abkürzung und kein Versprechen: Ein Lesefehler dort ist kein Abbruch,
sondern führt in die Suche.

Zwei Verhaltensunterschiede, beide gemessen und beide zum Guten:

- **Sortierte Reihenfolge.** `readTreeSync` sortiert je Ebene; `baumBegehen` nahm die Reihenfolge
  des Dateisystems. `quellbaum` liefert dieselbe Menge in fester Reihenfolge. Gemessen: dieselben
  19 Dateien unter `packages/domain/src`, dieselben Zahlen in `proof:callers`.
- **Ein fehlendes Verzeichnis** fängt jetzt `requireDirectory` mit dem gesuchten Gegenstand im
  Satz, statt einer eigenen `statSync`-Prüfung.

### 2 — Die fünfte Abschrift ist gefallen

`check-export-boundary.mjs` trug ab Zeile 60 denselben Muster-Leser und sagte es im Kommentar
selbst. Er ist weg. `repoRoot`, `domainRoot` und `exportRoot` kommen jetzt aus `workspaceRoot()`
und `locateWorkspacePackage()`; `bail`/`resolveOrBail` sind die Ausgabe dieses Wächters
(`FEHLER:` nach `stderr`, wie bisher).

Wichtig für Schicht 2 des Wächters: Die Domäne bekommt dadurch **keine** Abhängigkeit. `scripts/`
ist kein Arbeitsbereichspaket, hat keine `package.json` und steht in keiner
Abhängigkeitskante — eingebunden wird über einen relativen Pfad. Genau deshalb konnte die Fassung
dort auch nicht als Paket entstehen.

### 3 — Der Grenzwächter ist wieder vollständig: **414**

Vorher 413, nachher 414, alle übrigen Zeilen zeichengleich. Der Auftrag nennt als Behebung
`[...pakete.values(), path.join(repoRoot, 'scripts')]`. Ich habe die **zweite** Hälfte genau so
gebaut; die erste anders, und das ist die eine Stelle, an der ich vom Vorschlag abweiche — siehe
Annahme 1.

Zwei Gegenproben gefahren, beide vor dem Bericht gemessen:

- **Deckt der Wächter `scripts/` wirklich?** Eine Wegwerfdatei `scripts/gegenprobe-t249-5.mjs`
  mit `import { roundQuarter } from '@takt/domain/src/rounding.ts'` → der Lauf wird **rot**,
  nennt die Datei beim Namen und zählt 415. Datei sofort entfernt; `scripts/` enthält wieder
  ausschließlich `source-anchors.mjs`. Vor dieser Änderung wäre dieselbe Datei ungesehen
  durchgegangen.
- **Was passiert ohne `scripts/`?** Ordner probeweise umbenannt: Der Lauf endet mit
  `ERR_MODULE_NOT_FOUND` und Rückgabewert 1, **bevor** ein Prüfsatz läuft — die Einbindung ist
  die eigentliche Bedingung. `requireDirectory` fängt den Rest (ein `scripts`, das es gäbe, das
  aber kein Verzeichnis ist) und hält die Bedingung im Code statt im Kommentar. Der Kommentar
  sagt das jetzt so, wie es gemessen ist, und behauptet nichts Stärkeres.

## Sprache: was umbenannt wurde und was stehen blieb

**Neu geschrieben, also englisch:** `resolveOrFail`, `enterSourceDirectory`, `acceptExtension`
(in `source-resolve.mjs`); `bail`, `resolveOrBail`, `deepImportRoots`, `SKIPPED_DIRECTORIES`
(im Grenzwächter), dazu deren Parameter und Schleifenvariablen.

**Bewußt stehen geblieben:** die sieben Ausfuhren von `source-resolve.mjs` (`scheitern`,
`arbeitsbereichWurzel`, `paketVerzeichnis`, `paketQuelle`, `quellbaum`, `migrationsVerzeichnis`,
`dienstEinstieg`), die Optionsschlüssel `hinweis`, `merkmal`, `endungen`, `mindestens` und die
Konstante `UEBERGANGEN`. Grund: Das ist die Fläche, an der zwölf Nachweisläufe hängen. Eine
Umbenennung wäre eine Änderung in zwölf fremden Zeilen ohne fachlichen Gewinn und mitten in einer
Aufgabe, deren Maßstab „die Zahlen bleiben zeichengleich" ist. Sie gehört in einen eigenen,
kleinen Auftrag — zusammen mit derselben Frage an `proof-addin.mjs`, das es seit Langem genauso
macht. Im Grenzwächter bleibt aus demselben Grund `exportFlaechePfad` stehen: nicht angefaßt.

Die Prosa bleibt durchgehend deutsch, wie in der Sprachregel vorgesehen.

## Läufe

Jeder Lauf **vorher** aufgezeichnet und **nachher** verglichen. Weil die Ausgaben Prozeßnummern,
Zeitstempel, UUIDs und Millisekunden enthalten, ist „zeichengleich" hier nach Maskierung genau
dieser vier Muster gemessen; der Rohvergleich steht in der letzten Spalte.

| Lauf | Exit | Vergleich mit vorher |
|---|---|---|
| `pnpm run boundaries` | 0 | **eine Zeile geändert: 413 → 414**, sonst zeichengleich |
| `pnpm run proof:codepoints` | 0 | zeichengleich (roh) |
| `pnpm run proof:release-safety` | 0 | zeichengleich (roh) |
| `pnpm run proof:openapi` | 0 | zeichengleich (nur PID) |
| `pnpm run proof:callers` | 0 | zeichengleich (nur PID) |
| `pnpm run proof:taskpane` | 0 | zeichengleich (nur PID) |
| `pnpm run proof:route-policy` | 0 | zeichengleich (nur PID, Zeit, UUID) |
| `pnpm run proof:addin-wiring` | 0 | zeichengleich |
| `pnpm run proof:conflicts` | 0 | zeichengleich |
| `pnpm run proof:db-permissions` | 0 | zeichengleich |
| `pnpm run proof:tags` | 0 | zeichengleich |
| `pnpm run proof:access` | 0 | zeichengleich bis auf zwei **schwankende** Zahlen, siehe unten |
| `pnpm run proof:export-api` | 0 | zeichengleich bis auf eine **schwankende** Zahl, siehe unten |
| `pnpm run proof:all` | 0 | **248 bestanden, 0 fehlgeschlagen**, neunzehn Läufe |
| `pnpm run typecheck` | 0 | — |

**Die drei schwankenden Zahlen sind gemessen und nicht behauptet.** `proof:access` meldet Mediane
in Nanosekunden (`1000` gegen `1200`), `proof:export-api` die Zeichenzahl der Dienstausgabe
(`9437` gegen `9438`). Beide habe ich zweimal hintereinander **ohne jede Änderung** laufen lassen:
`9437`, dann `9438`; die Mediane zurück auf `1000`. Es ist Laufzeitrauschen aus
`durationMs`-Stellen und Zeitmessung, keine Wirkung dieser Umstellung. Die Prüfsätze daneben
(52 Protokollzeilen zu 52 Anfragen, Streuung 1.00) sind unverändert.

`proof:engines` läuft auf diesem Rechner nicht (WebKitGTK). Er berührt keine der beiden Dateien.
`proof:db-permissions` überspringt unter Windows seinen POSIX-Teil — dort ist die Auflösung
geladen, nicht durchgemessen; das stand schon im Bericht zu T-249-1 und gilt unverändert.

**Sieben Gegenproben zum Auflöser**, gegen ein Wegwerfskript außerhalb des Bestands gefahren:
unbekanntes Paket, unbekanntes Merkmal, mehrdeutiges Merkmal (15 Treffer, alle genannt), Umweg
über den Baum bei falschem Hinweis (`src/nirgends.ts` → `src/export.ts`, mit Hinweiszeile),
fehlendes Verzeichnis, unterschrittene Untergrenze, gültige Ernte. Sechs enden mit `FEHL`,
Rückgabewert 1 und dem gesuchten Gegenstand im Satz; die siebte liefert 19 Dateien.

## Annahmen

1. **Die Wurzeln von `checkDeepImports` kommen nicht mehr aus `pnpm-workspace.yaml`, sondern aus
   dem Baum.** Der Vorschlag lautete `[...pakete.values(), …]`, aber `pakete` gab es nur, weil
   der Wächter den Muster-Leser abgeschrieben hatte, und die gemeinsame Fassung gibt die
   Paketliste nicht heraus — sie kennt `locateWorkspacePackage(name)`, nicht „alle Pakete"
   (siehe Offene Frage 6). Statt den Leser zurückzuholen, frage ich anders: Gesucht wird jede
   `package.json` im Baum (ohne `node_modules`, `.git`, `dist`, `target`, `coverage`, `build`),
   der Wurzelmanifest fällt heraus. Begründung im Code: Die Muster sagen, **wo ein Paket liegen
   darf**; dieser Wächter fragt, **wo Quelltext liegt**. Fallen die beiden auseinander, soll ein
   Wächter zu viel lesen und nicht zu wenig. Gemessen ergibt das heute dieselben acht Pakete und
   dieselbe Zahl. Wer die Fassung mit `pnpm-workspace.yaml` vorzieht, braucht nur Offene Frage 6.
2. **Doppelzählung ausgeschlossen.** Die Wurzeln überschneiden sich heute nicht; läge morgen ein
   Paket **in** einem Paket, wäre die gemeldete Zahl eine von Besuchen und nicht von Dateien.
   Ein `Set` verhindert das. Die Zahl bleibt heute unverändert bei 414.
3. **`quellbaum` prüft das Verzeichnis nicht mehr selbst**, sondern läßt `requireDirectory` der
   gemeinsamen Fassung abbrechen. Die Untergrenze bleibt hier, weil die Zahl eine Aussage dieses
   Laufs ist und nicht des Bausteins.
4. **Kein Aufrufer angefaßt.** Die zwölf Läufe importieren dieselben Namen wie vorher.

## Risiken

- **R-f aus T-249-4 ist erledigt.** Die fünfte Abschrift ist weg. Nach meiner Zählung bleibt eine
  Fassung der Idee außerhalb meiner Hoheit: die „Landkarte" in
  `apps/outlook-addin/scripts/proof-addin.mjs` (integration-dev, T-249-6).
- **R-g aus T-249-4 ist erledigt**, und zwar gemessen und nicht behauptet: `scripts/` liegt im
  Grenzwächter, die Gegenprobe zeigt einen Tiefenzugriff dort rot.
- **R-h steht unverändert** (frontend-dev): Kein Wächter hindert den nächsten Auftrag daran, die
  fachnahen Helfer doch in die gemeinsame Datei zu schieben. Die Grenze steht in zwei
  Kopfkommentaren; ich habe meinen so geschrieben, daß er die drei Gründe einzeln nennt.
- **Neu, klein: `scripts/` ist selbst unversioniert** (`git status` zeigt `?? scripts/`). Ohne
  Commit brechen nach dieser Umstellung **acht** Läufe zusätzlich im frischen Klon ab, nicht nur
  die sechs aus Offener Frage 2 — der Grenzwächter und die zwölf Läufe über `source-resolve.mjs`
  hängen jetzt daran. Das ist dieselbe T-207-Falle wie bei `proof-appdata.mjs` und
  `source-resolve.mjs`, nur mit größerem Radius.
- **Kein Sicherheitsbezug.** Keine Adresse, keine Vertrauensgrenze, keine Datei des Benutzers,
  kein Laufzeitcode. Beide Dateien laufen ausschließlich im Bau und im Tor. Die Notiz-Trennung
  selbst ist unverändert: dieselben sieben Typbehauptungen, dieselben zwei erlaubten Importe,
  dieselben drei Einstiegspunkte — nur die Wege dorthin sind aufgelöst statt gezählt.

## Offene Fragen

6. **Soll `scripts/source-anchors.mjs` die Paketliste herausgeben?** Die Datei hat
   `workspacePackages(repoRoot)` bereits — sie steht nur nicht in der Ausfuhrfläche. Ein Wort
   `export` davor, und der Grenzwächter könnte die Wurzeln aus derselben Quelle nehmen wie pnpm,
   statt nach `package.json` zu suchen. Die Datei gehört nicht mir (Wurzel, aus T-249-4); ich
   habe sie **nicht** angefaßt und den Weg über den Baum gewählt, siehe Annahme 1. Bitte um
   Entscheidung, wer das ändert — es ist eine Zeile und betrifft möglicherweise auch T-249-6.
7. **`scripts/` versionieren, bevor irgendetwas committet wird.** Siehe Risiken. Zusammen mit
   `apps/local-api/scripts/proof-appdata.mjs` und `source-resolve.mjs` aus Offener Frage 2 — die
   Liste der unversionierten, aber tragenden Dateien ist damit auf drei gewachsen.
8. **Umbenennung der deutschen Ausfuhrnamen** in `source-resolve.mjs` und `proof-addin.mjs`: Ich
   habe sie bewußt gelassen (siehe „Sprache"). Wenn sie gewünscht ist, gehört sie in **einen**
   Auftrag über beide Dateien und ihre zwölf bzw. mehreren Aufrufer, nicht in eine Umstellung,
   die zeichengleiche Zahlen verspricht.

## Nächster Schritt

Review durch Code-Reviewer und Security-Checker über beide Dateien, mit dem einen benannten
Punkt: die geänderte Zahl 413 → 414 und die Herkunft der Wurzeln (Annahme 1). Danach — und erst
danach — der Umzug selbst; die Läufe sind jetzt in beiden Paketen umzugsfest und stehen auf
**einer** Fassung. Vor dem Commit Offene Frage 7 klären, sonst ist der frische Klon rot.
