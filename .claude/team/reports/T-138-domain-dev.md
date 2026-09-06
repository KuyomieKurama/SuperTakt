# T-138 — Versionsprüfung: Ordnung der Fassungen, Frage an GitHub, Nachweis

**Aufgabe:** T-138 — Versionsprüfung: die Ordnung der Fassungen, die Frage an GitHub, der Nachweis
**Rolle:** domain-dev
**Status:** braucht Review
**Datum:** 2026-09-04

---

## Artefakte

**Neu**

| Datei | Was |
|---|---|
| `packages/domain/src/version.ts` | Die Ordnung der Fassungen. SemVer-Vorrang, `checkVersion`, `compareVersions`, `decideUpdateNotice`. Rein, ohne HTTP, ohne SQL, ohne Fremdbibliothek |
| `packages/storage/migrations/0013_skipped_version.up.sql` | `app_setting.skipped_version` (A-18.10, R-20) |
| `packages/storage/migrations/0013_skipped_version.down.sql` | `DROP COLUMN`, Datenverlust benannt |
| `apps/local-api/src/version/source.ts` | Die **eine** Verbindung nach außen. Adresse, Frist, Obergrenze, Weiterleitungsverhalten, Kopfzeilen, ein Feldzugriff |
| `apps/local-api/src/version/checker.ts` | Der Takt (E-069): einmal nach dem Start, danach höchstens einmal in 24 h. Ergebnis im Arbeitsspeicher |
| `apps/local-api/src/routes/version.ts` | `GET /api/v1/version-check` — liest ab, fragt nie |
| `apps/local-api/scripts/proof-release-safety.mjs` | Der Nachweis aus E-066 Punkt 4, mit Gegenproben |

**Geändert**

`packages/domain/src/index.ts` · `packages/domain/src/settings.ts` ·
`packages/storage/src/sqlite/mappers.ts` · `packages/storage/src/sqlite/repo-settings.ts` ·
`packages/storage/src/sqlite/migrations.embedded.ts` (erzeugt) ·
`apps/local-api/src/composition.ts` · `apps/local-api/src/app.ts` · `apps/local-api/src/main.ts` ·
`apps/local-api/src/usecases/structure.ts` · `apps/local-api/src/routes/export.ts` ·
`apps/local-api/openapi/takt-local-api.yaml` · `apps/local-api/scripts/service-scenario.mjs` ·
`apps/local-api/scripts/proof-callers.mjs` · `docs/architektur.md` (5.1, **5.7 neu**, 1.2) ·
`docs/datenmodell.md` (3.7, **8.4h neu**, Übersicht)

---

## Zusammenfassung

Die Ordnung der Fassungen liegt in `packages/domain/src/version.ts`: SemVer-Vorrang mit
numerischem Vergleich, einschließlich „Vorabfassung steht unter der gleichnamigen Fassung", dazu
die Regel `decideUpdateNotice` — neuer **und** nicht übersprungen. Das führende `v` fällt an genau
einer Stelle (`stripReleaseTagPrefix`, ausschließlich von `checkVersion` gerufen). Der Dienst
fragt GitHub **nach der Uhr**, nicht auf Zuruf: `compose()` baut den Prüfer und startet ihn
nicht, `main.ts` startet ihn zehn Sekunden nach dem Hochfahren, danach höchstens einmal in
24 Stunden; die neue Route `GET /api/v1/version-check` gibt das Ergebnis aus dem Arbeitsspeicher
heraus und löst nie eine Anfrage aus (101 Aufrufe → **eine** ausgehende Anfrage, gemessen). Die
übersprungene Fassung ist eine Einstellung im Bestand (Migration 0013) und wird an drei Türen
gegen dieselbe Form geprüft — beim Schreiben im Schema, im Anwendungsfall und beim **Lesen** im
Mapper. `proof:release-safety` misst über den ganzen Quellbaum, dass es bei einer Adresse bleibt,
dass kein Weg von einer Antwort zum Öffnen-Befehl führt und dass nirgends heruntergeladen wird —
mit einer Gegenprobe je Prüfung.

---

## Auflage für Auflage (Bedrohungsmodell 18.9)

### An T-138

| ID | Erfüllt | Woran gemessen |
|---|---|---|
| **A-V-1** | ja | `grep -rn "api\.github\.com" apps/local-api/src` → **eine** Fundstelle (`src/version/source.ts:88`). `proof:release-safety` Abschnitt 2 prüft es über **acht** Quellordner und nicht nur über den Dienst: jede Zeichenkette mit `github.com` im Code ist entweder die Abfrageadresse (genau einmal, in `version/source.ts`) oder beginnt mit der Adresse der Release-Seite und liegt in einer der beiden gemessenen Dateien. Gegenprobe: eine eingesetzte zweite Adresse macht die Prüfung rot |
| **A-V-2** | ja | Nur `GET`, kein Rumpf, kein Abfrageparameter, kein `authorization`, kein `cookie`. Gemessen an einem lokalen Prüfserver: `Methode/Pfad: GET /repos/x/y/releases/latest`, mitgeschnittene Kopfzeilen unten bei A-V-13 |
| **A-V-3** | ja | `redirect: 'error'`. Gemessen: Prüfserver antwortet `302` auf einen **zweiten** lokalen Server. Ergebnis `{"ok":false,"reason":"redirect"}`, und am Umleitungsziel **null** Anfragen. Beide Hälften |
| **A-V-4** | ja | Ausschließlich `https:` (die Konstante). Kein `dispatcher`, kein `Agent`, kein `ProxyAgent`, kein `NODE_USE_ENV_PROXY`, kein `NODE_TLS_REJECT_UNAUTHORIZED`, keine eigene Zertifikatsprüfung. `proof:release-safety` hält diese sechs Marken über den ganzen Baum; die Auflage hält damit einen Zustand, statt ihn zuzusagen |
| **A-V-5** | ja | **Eine** Gesamtfrist von 5 000 ms über `AbortSignal.timeout`, mit `AbortSignal.any` an `fetch` **und** an das Lesen des Rumpfes gebunden. Gemessen: Prüfserver schreibt `{"a":` und schweigt → `{"ok":false,"reason":"timeout"}` nach **5 001 ms** |
| **A-V-6** | **ja, mit einem offenen Punkt** | Obergrenze 65 536 Bytes des **entpackten** Stroms, beim Lesen gezählt; `response.body.getReader()`, kein `json()`/`text()`/`arrayBuffer()`, `content-length` wird nirgends gelesen. Gemessen mit einer gzip-Bombe: **50 989 Bytes** auf der Leitung, Abbruch mit `too_large` nach **4 ms**, kein `JSON.parse`. `proof:release-safety` prüft zusätzlich, dass die drei Abkürzungen im Quelltext nicht vorkommen. **Offen:** die tatsächliche Antwortgröße gegen die echte Adresse — siehe „Risiken" |
| **A-V-7** | ja | **Ein** Feldzugriff: `tag_name`, über eine Konstante `TAG_FIELD` und hinter `Object.hasOwn` (ein `tag_name` aus der Prototypenkette kommt nicht durch — gemessen mit `{"__proto__":{"tag_name":"9.9.9"}}` → `malformed`). `html_url`, `body`, `name`, `assets`, `author`, `upload_url`, `browser_download_url`, `zipball_url`, `tarball_url`, `assets_url`, `body_html` kommen im ganzen Baum **nicht** im Code vor; `.tag_name` als Punktzugriff ebenfalls nicht |
| **A-V-8** | ja | `typeof === 'string'`, danach ohne führendes `v` gegen `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$`. Gegen den Prüfserver gemessen, jeder Fall still ohne Wurf: `null`, `42`, `{}`, `[]`, `true`, fehlend, `""`, 60 000 Zeichen, `../../evil`, `1.2.3?x=1`, `1.2.3.4.5.6.7`, `banana`, Antwort als Array, `'['.repeat(50000)`. **23 von 23** |
| **A-V-9** | ja | `packages/domain/src/version.ts`, zerlegt in drei Zahlen, numerisch verglichen; kein `localeCompare`, kein `<` auf ganzen Fassungen. Jede Komponente ≤ 999 999 999 (durch die Form). Vorabkennung: numerische Bezeichner numerisch **und ohne `Number`** (Ziffernfolgen bis 64 Zeichen), alphanumerische nach ASCII, numerisch unter alphanumerisch, mehr Felder gewinnt. Gemessen: alle acht Paare aus TP-VER-15 bis -22, jeweils **in beide Richtungen**, dazu die vollständige Vorrangkette aus der SemVer-Spezifikation (`1.0.0-alpha < alpha.1 < alpha.beta < beta < beta.2 < beta.11 < rc.1 < 1.0.0`) und `1.0.0-007 == 1.0.0-7` — **28 von 28** |
| **A-V-10** | ja | Der Netzaufruf liegt in `version/checker.ts` an einem Zeitgeber, nicht in einem Anfragebehandler. Gemessen durch den **zusammengebauten Dienst**: 101 Aufrufe von `GET /api/v1/version-check` → **eine** ausgehende Anfrage. `proof:release-safety` prüft zusätzlich, dass keine Datei unter `src/routes/` die Abholfunktion kennt und dass `fetch` im ganzen Dienst in **einer** Datei steht |
| **A-V-11** | ja | Eine Anfrage je Start, danach 24 h, harter Boden 60 min gegen die Uhr des Zusammenbaus. Nach einem Fehlschlag wird der Zeitgeber **nicht** neu gestellt. Gemessen mit Attrappe und gestellter Uhr: Erfolg → 1 Anfrage; Fehlschlag bei 30-ms-Takt über 200 ms → **1** Anfrage; Boden bei stehender Uhr und 5-ms-Takt über 200 ms → **1** Anfrage |
| **A-V-12** | ja | Alle Zeitgeber `unref()`t; laufender Aufruf an einem `AbortController`, den `stop()` auslöst; `main.ts` ruft `versionCheck.stop()` als **erstes** im `shutdown()`, vor `taskpane.close()` und `database.close()`. Gemessen: Abbruch mitten in einer schweigenden Antwort → `{"ok":false,"reason":"aborted"}` nach **202 ms**. `start()` gefolgt von sofortigem `stop()` → **null** Anfragen. **Nicht** gemessen: `proof:access` fährt keinen Fall „Anhalten **während** eine ausgehende Anfrage läuft" — siehe „Offene Fragen" 3 |
| **A-V-13** | ja | Gesetzt sind `accept: application/vnd.github+json`, `x-github-api-version: 2022-11-28`, `user-agent: Takt` — **ohne** Fassungsnummer. Vollständiger Mitschnitt des Prüfservers: `host`, `connection: keep-alive`, die drei gesetzten, `accept-language: *`, `sec-fetch-mode: cors`, `accept-encoding: gzip, deflate`. Keine trägt Benutzer, Rechnernamen, Sprache oder Kennung. Gegenprobe zur installierten Fassung ist **strukturell** erfüllt: Der Dienst kennt sie nicht (E-069) |
| **A-V-14** | ja, **mit einer benannten Abweichung** | Was den Dienst verlässt: `state` (`unknown`/`known`) und `latestVersion` (geprüft, ohne `v`, oder `null`). Kein `html_url`, keine Fassungsbeschreibung, kein Name, kein Zeitpunkt, kein Feld vom Typ „freier Text aus der Antwort". **Abweichung:** Die Auflage nennt **drei** Felder, darunter „die installierte Fassung". Der Dienst liefert **zwei**. Grund: E-069 Punkt 2 — die installierte Fassung liegt in der Hülle (A-V-15), der Dienst kennt sie nicht und soll sie nicht kennen. Zwei Felder sind enger als drei, aber es ist eine Abweichung und keine Auslegung |
| **A-V-19** | ja | Die Route steht in `openapi/takt-local-api.yaml` (`getVersionCheck`), ist an **derselben** Hono-Anwendung registriert, steht **nicht** in `SHARED_PATHS` und **nicht** unter `/addin`. `GET /addin/context` bekommt kein Fassungsfeld. Gemessen: `proof:route-policy` Abschnitt 4 zählt **66** statt 65 Operationen und **61** statt 60 außerhalb von `/addin`, alle grün; `proof:openapi` 110 grün; ohne Nachweis ergibt die Route **401** |
| **A-V-20** | ja | Sieben Schlüssel aus einem geschlossenen Vorrat: `version_check_unreachable`, `version_check_timeout`, `version_check_redirect`, `version_check_status` (mit `code=<3 Ziffern>`), `version_check_no_release`, `version_check_too_large`, `version_check_malformed`, dazu `version_check_aborted` beim Anhalten. Gemessen durch `logger.lifecycle`: **keiner** wird zu `unclassified`, und kein Satz enthält Pfad, Adresse, `127.0.0.1` oder das Wort github. Aus dem Wurf wird **nichts** gelesen — die Einordnung geht über `error.name` und einen Vergleich gegen einen festen Text |

### An T-139 (nicht meine, hier nur zur Naht)

**A-V-15 bis A-V-18** liegen bei frontend-dev. Ich habe dort nichts angefasst. Zwei Punkte, die
meine Seite betreffen: `GET /version-check` liefert die Fassung **ohne** führendes `v`, also genau
die Form, die `takt_open_release(version)` erwartet (A-V-16); und der Dienst liefert **keine**
Adresse, also gibt es nichts, was versehentlich an einen Öffnen-Befehl gereicht werden könnte.

---

## Die Naht zu T-139 — verbindlich

**Die Route.**

```
GET /api/v1/version-check
Kopfzeile: X-Takt-Token: <Sitzungsgeheimnis>      (wie jede Route außerhalb von /addin)

200 { "data": { "state": "unknown" | "known", "latestVersion": string | null } }
```

* `state: "known"` ⇒ `latestVersion` ist eine geprüfte Fassungsbezeichnung **ohne** führendes `v`.
* `state: "unknown"` ⇒ `latestVersion` ist `null`. Das ist eine **gültige Antwort**, kein Fehler,
  und deckt vier Fälle ab, die von außen gleich aussehen sollen: noch nichts geprüft, nicht
  erreichbar, unerwartete Antwort, keine Veröffentlichung. Es gibt **kein** Fehlerfeld.
* Die Route löst **nie** eine ausgehende Anfrage aus. Ein zweiter Aufruf kostet nichts, ein
  Abfrageintervall in der Oberfläche ist unnötig.
* Andere Statuscodes: `400` (Token in der Adresse), `401`, `403` (Herkunft) — wie überall.

**Die Einstellung „übersprungen".** Über die bestehende Route, keine zweite:

```
GET   /api/v1/settings      → data.settings.skippedVersion : string | null
PATCH /api/v1/settings      { "skippedVersion": "1.2.3" | "v1.2.3" | null }
                            → 200, data.skippedVersion (immer ohne führendes `v`)
                            → 422 validation_error, wenn es keine Fassungsbezeichnung ist
```

Ein fehlendes Feld heißt „unverändert", `null` heißt „nichts übersprungen".

**Die Domäne.** `@takt/domain` exportiert für die Oberfläche:

```ts
decideUpdateNotice({ installed, latest, skipped })
  → { show: true; version: string }
  | { show: false; reason: 'unknown' | 'up_to_date' | 'skipped' }

compareVersions(a: unknown, b: unknown): -1 | 0 | 1 | 'incomparable'
checkVersion(value: unknown): { ok: true; version: ParsedVersion } | { ok: false; reason: … }
normalizeVersion(value: unknown): string | null
RELEASE_TAG_SHAPE, VERSION_SHAPE, VERSION_MAX_LENGTH (94), VERSION_MAX_COMPONENT
```

`decideUpdateNotice` nimmt alle drei Werte als `unknown` entgegen und wirft nie. Im Meldefall
trägt `version` die Fassung **ohne** `v` — genau der Wert für `takt_open_release`.

**Abgleich mit dem, was T-139 bereits gebaut hat.** Beim Bauen lag `apps/web/src/api/endpoints.ts`
schon vor und rief `/version-check` mit dem Typ `VersionCheckView { latestVersion: unknown }` auf.
Ich habe meine Route **auf diesen Namen gezogen** (sie hieß zwischenzeitlich `/version`) und den
Antworttyp so benannt. Er ist eine Obermenge dessen, was dort erwartet wird — `latestVersion`
steht drin, `state` kommt hinzu. `useUpdateNotice.ts` liest bereits
`structure.value.settings.skippedVersion` und schreibt `updateSettings({ skippedVersion })`; beides
trifft genau das, was ich gebaut habe. **Keine Änderung an `apps/web` nötig.**

---

## Annahmen

1. **Der Pfad heißt `/version-check`, nicht `/version`.** Zwei Gründe, und der erste zählt: T-139
   hatte den Aufrufer bereits geschrieben, und ein roter `proof:callers` hilft niemandem. Der
   zweite ist inhaltlich: Die Ressource ist nicht „die Fassung" — der Dienst hat keine, die
   jemanden anginge, und `GET /health` gibt bewusst keine heraus (B-1.1 Punkt 2). Die Ressource
   ist das **Ergebnis der Prüfung**.

2. **Die erste Anfrage geht 10 Sekunden nach dem Start hinaus, nicht sofort.** „Beim Start"
   (A-18.2) bleibt gewahrt — es ist dieselbe Startfolge, nur nicht ihr erster Handgriff. Zwei
   Gründe: Der Start ist der volle Augenblick (Migration, Rechte, Aufräumen, Aufgabenbereich),
   und — der wichtigere — ein Lauf, der gleich wieder endet, sendet damit **gar nichts**. Der
   Zeitgeber ist `unref()`t. Wirkung, gemessen: `verify:bundle` startet den ausgelieferten Sidecar
   viermal und schickt dabei **kein** Lebenszeichen an GitHub (R-19 Punkt 3). Ohne diese Zahl
   ginge bei jedem Nachweislauf eine echte Anfrage hinaus.

3. **`compose()` startet den Prüfer nicht.** Er wird gebaut und gibt `state: 'unknown'` heraus;
   `start()` ruft genau eine Stelle, `main.ts`. Damit sendet kein Nachweispfad und kein Prüffall.

4. **Zwei Nähte, nicht eine, und beide im Prozess.** `compose({ releaseSource })` ersetzt die
   ganze Quelle (für Läufe, die überhaupt kein Netz wollen);
   `createGithubReleaseSource({ fetch })` ersetzt nur die **Abholfunktion** und lässt Frist,
   `redirect: 'error'`, Lesestrom, Obergrenze und Auswertung unverändert laufen. Die zweite ist
   die, mit der T-140 gegen einen lokalen Prüfserver misst — sonst wäre genau der Code, um den es
   in A-V-3 bis A-V-8 geht, nicht prüfbar. E-066 Punkt 1 sagt es wörtlich: „die Naht ist die
   Abholfunktion, nicht die Zeichenkette." Beide sind von außerhalb des Prozesses nicht
   erreichbar.

5. **Ein Fehlschlag wird auf `info` protokolliert, nicht auf `warn`.** Ein folgenloser Fehlschlag
   ist keine Störung des Betriebs, und `proof:access` Abschnitt 0e misst, dass im Normalfall keine
   Warnung erscheint.

6. **Der Statuscode steht im Protokollgrund** (`version_check_status code=403`), begrenzt auf
   ganzzahlig 100–599. Er ist kein Ausschnitt der Antwort, sondern ihre Einordnung, und er
   unterscheidet die erschöpfte Anfragebegrenzung (T-136-5) von einer Störung bei GitHub.

7. **Ein leerer Bezeichner in der Vorabkennung** (`1.2.3-a..b`) ist von SemVer verboten, von der
   Form aus A-V-8 aber erlaubt. Er wird als alphanumerischer Bezeichner behandelt und sortiert
   unter allen anderen. Deterministisch, dokumentiert, ohne Wurf.

8. **`checkVersion` beschneidet nicht.** `' 1.2.3'` ist `malformed`. Eine zweite Meinung darüber,
   was „eigentlich gemeint war", ist die Lücke, aus der ein anderer Wert in eine Adresse gerät.

9. **Der CHECK auf `skipped_version` ist enger als nichts und weiter als die Domäne.** Länge,
   Ziffernbeginn, zwei Punkte, Zeichenvorrat — mehr kann GLOB nicht. `1.2.3.4.5.6` besteht ihn und
   fällt an der Tür. Die vollständige Form hat einen Ort, und das ist die Domäne.

---

## Risiken

1. **Die tatsächliche Antwortgröße ist nicht gemessen — der Bestand hat keine Veröffentlichung.**
   Ein einmaliger Aufruf gegen die echte Adresse ergab **`404`**, Rumpf **130 Bytes entpackt**
   (`content-length: 125`, gzip). Die Obergrenze von 65 536 Bytes steht damit weiterhin auf der
   Schätzung aus 18.5 (rund 15 KiB, Vierfaches). **Auflage an die erste echte Veröffentlichung:**
   nachmessen. Liegt sie über 32 KiB, wird die Zahl bewusst angehoben, nicht stillschweigend. Ein
   zu enger Wert ist ein stiller Fehlschlag, kein Absturz — die richtige Richtung, aber es bleibt
   eine ungemessene Zahl.

2. **Die Einordnung „Weiterleitung" hängt an einem Text der Laufzeit.** `fetch` wirft bei
   `redirect: 'error'` einen `TypeError` mit `cause: Error: unexpected redirect`; geprüft wird, ob
   das Wort `redirect` darin vorkommt. Ändert Node den Wortlaut, wird der Fall zu
   `version_check_unreachable` — **ebenfalls still, ebenfalls ohne zweiten Versuch**, nur mit
   gröberem Schlüssel. Das Verhalten ändert sich nicht, nur die Protokollzeile. Kein Text aus dem
   Wurf geht irgendwohin.

3. **Sicherheit: `state: 'unknown'` ist ununterscheidbar** — das ist Absicht (A-18.11), es heißt
   aber auch, dass ein Benutzer ohne Internet nie erfährt, dass die Prüfung nicht läuft. Bewertet
   in 18.11 Punkt 4, keine Änderung durch T-138.

4. **Sicherheit: Die Anfrage bleibt das Lebenszeichen.** Auch mit A-V-13 erfährt GitHub
   Quelladresse, Zeitpunkt und Wiederholungsmuster. Nicht wegzuverhandeln (18.11 Punkt 1); gehört
   ins Benutzerhandbuch (T-141).

5. **`pnpm test` ist rot — an einer Datei, die mir nicht gehört.**
   `packages/storage/test/migration-0012-pool-rule-restrict.test.ts:63` prüft nach
   `migrateToLatest()` gegen `restrictMigration.version` (also 12) und geht davon aus, dass 0012
   die letzte Migration ist. Mit 0013 ist der Stand 13. **1027 von 1028 grün**, dieser eine rot.
   Der Ein-Zeilen-Nachzug gehört unit-tester (T-140): `migrations.at(-1)?.version` statt
   `restrictMigration.version`. Der Test misst weiterhin dasselbe.

6. **`proof:callers` trägt eine Zeile, die bald falsch ist.** `getVersionCheck` steht in
   `NOT_CALLED_BY_UI` — dieselbe Bauart wie `getBoard`. Der Aufrufer in `endpoints.ts` liegt
   inzwischen vor (T-139); der Lauf wird davon nicht rot, aber die Zeile sagt dann etwas Falsches
   und gehört bei der Abnahme von T-139 entfernt.

---

## Offene Fragen an den Orchestrator

1. **`package.json` — zwei Einträge, die ich nicht setzen darf.**

   In `apps/local-api/package.json`, `scripts`:
   ```json
   "proof:release-safety": "node scripts/proof-release-safety.mjs"
   ```
   In der Wurzel-`package.json`, `scripts`:
   ```json
   "proof:release-safety": "pnpm --filter @takt/local-api proof:release-safety"
   ```
   und in `proof:all` hinter `proof:route-policy` einhängen. Bis dahin läuft der Nachweis mit
   `node apps/local-api/scripts/proof-release-safety.mjs` (heute: **23 bestanden, 0
   fehlgeschlagen**, davon 6 Gegenproben und 6 Prüfungen des Lesers selbst).

2. **Die Reihenfolge der Migrationen.** `0013_skipped_version` ist die nächste freie Nummer.
   Vorwärts und rückwärts gefahren (13 → 12 → 0 → 13, SQLite 3.51.3);
   `migrations.embedded.ts` ist neu erzeugt (26 Dateien), `proof:migrations` grün. Falls parallel
   eine zweite 0013 entsteht, gehört die Umnummerierung dem Orchestrator.

3. **A-V-12 ist gebaut, aber nicht in `proof:access` gemessen.** Die Auflage verlangt: „nach
   `shutdown()` endet der Prozess innerhalb der Frist, **auch während** eine ausgehende Anfrage
   läuft." Im ausgelieferten Dienst läuft zehn Sekunden lang keine — genau deshalb bleibt
   `verify:bundle` still. Ein Fall in `proof:access` müsste also entweder zehn Sekunden warten
   oder den Prüfer eigens antreiben. Vorschlag: als Einheitenprüfung an `createVersionChecker` in
   T-140 statt als Nachweislauf. Entscheidung liegt beim Orchestrator; gemessen ist heute
   `stop()` mitten in einem laufenden Aufruf (Abbruch nach 202 ms) und `start()`+`stop()` ohne
   jede Anfrage.

4. **Wie zeigt der End-zu-End-Lauf (T-142) auf die Nachbildung?** Die beiden Nähte liegen im
   Prozess; `tests/e2e/support/services.ts` startet den Sidecar als **Prozess** und kann keine
   davon setzen. Drei Wege, und keiner ist meiner: (a) der E2E-Aufbau startet einen eigenen
   Einstiegspunkt, der `compose({ releaseSource })` benutzt; (b) T-142 nimmt hin, dass je Lauf
   **eine** echte Anfrage hinausgeht — bei 62 Fällen über einen Dienst wären das eine je Lauf,
   nicht eine je Fall; (c) die Prüfung bleibt für E2E außen vor und wird nur auf der
   Integrationsebene gemessen. Ich empfehle (a). Ohne Entscheidung bleiben `TP-VER-11` und
   `TP-VER-12` (Neustart) nicht ausführbar.

5. **F-18 (E-068) bleibt offen** und berührt meine Arbeit an einer Stelle: Fiele die Entscheidung
   für einen Schalter, wäre er eine Einstellung wie jede andere — `app_setting`, eine Migration,
   und eine Zeile in `versionCheck.start()`. Kein Umbau.

6. **`docs/bedrohungsmodell.md` 18.9** sollte bei der Wiedervorlage zwei Zahlen nachziehen: A-V-14
   nennt drei Felder, geliefert werden zwei (Begründung oben); A-V-1 nennt
   `grep -rn "github\.com"` mit Erwartung null — das gilt seit T-138/T-139 nicht mehr, es sind
   drei Orte mit zwei Adressen. Die Datei gehört security-checker.

---

## Nächster Schritt

1. Orchestrator: die beiden `proof:release-safety`-Einträge setzen und in `proof:all` einhängen.
2. unit-tester (T-140): die eine Zeile in `migration-0012-pool-rule-restrict.test.ts` nachziehen,
   dann `pnpm test` 1028/1028. Danach die Prüffälle: `TP-VER-15` bis `-23` gegen
   `packages/domain/src/version.ts` (sofort lauffähig, keine Attrappe), `TP-VER-01` bis `-07`,
   `-25`, `-26` gegen `createGithubReleaseSource({ fetch })` mit einem lokalen Prüfserver — die
   Fälle, die ich oben gemessen habe, liegen als Tabelle vor und lassen sich eins zu eins
   übernehmen.
3. security-checker: Wiedervorlage 18.9 gegen Code, mit den Zahlen aus diesem Bericht.
4. Nach der ersten echten Veröffentlichung: die Antwortgröße nachmessen (Risiko 1).

## Befehle

```
pnpm typecheck                                     # fehlerfrei
pnpm run boundaries                                # grün, Notiz-Trennung unverletzt
pnpm test                                          # 1027/1028 (siehe Risiko 5)
pnpm run proof:all                                 # alle grün
node apps/local-api/scripts/proof-release-safety.mjs   # 23/23, noch nicht in proof:all
pnpm run verify:bundle                             # 20/20
```
