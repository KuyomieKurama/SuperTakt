# T-143 — Code-Review über Welle O bis R (Qualitätstor nach der Auslieferung)

**Aufgabe:** T-143 — Code-Review über `0635aea..HEAD`, Zweig `versionspruefung-gegen-github`
**Rolle:** code-reviewer
**Datum:** 2026-09-05
**Umfang:** 99 Dateien, +13 428/−250, aus T-132, T-133, T-134, T-138, T-139, T-140

---

## Urteil

**Nacharbeit.**

Blockierend sind **B-1** und **B-2**: beide sitzen in `proof-shell-surface.mjs`, und beide
machen genau die Zusage unmessbar, die T-136-1 zur **einzigen** Kontrolle zwischen der Antwort
von GitHub und `xdg-open`/`ShellExecuteW` erklärt hat. Der Nachweis ist heute grün und der
Bestand ist heute sauber; die Prüfung liest aber nicht dort, wo Tauri liest. Ein Nachweis, der
neben der Stelle misst, die er bewacht, beruhigt genau so lange, bis jemand die Datei anlegt,
die er nicht sieht.

Der Produktivcode selbst trägt: `release.rs` habe ich gegen die Ausbruchsliste und darüber
hinaus gelesen und keinen Weg gefunden, an `is_release_version` vorbei eine Adresse
zusammenzusetzen. Die Netzschicht tut, was ihr Kopfkommentar sagt — an einer Stelle sagt der
Kommentar allerdings mehr, als der Nachweis daneben misst (H-2).

---

## Was gemessen wurde, bevor etwas behauptet wird

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` (8 Pakete + 7 Testprojekte + e2e) | Exitcode 0, keine Meldung |
| `pnpm test` | **1171/1171**, 66 Dateien |
| `pnpm run proof:all` (18 Pfade) | Exitcode 0 |
| `pnpm run proof:release-safety` einzeln | 23/23, 6 Gegenproben grün |
| `pnpm run proof:shell-surface` einzeln | 4 Prüfungen, 10 Gegenproben, keine blind |
| `pnpm run proof:foreign` einzeln | 14/14, 1 Übergangsstelle mit 5 Aufrufen |
| `node` gegen `setTimeout(3.15e10)` | `TimeoutOverflowWarning`, gefeuert nach **2 ms** (Beleg zu S-4) |
| `tauri-utils 2.9.3` `acl/build.rs:458`, `acl/capability.rs:269–278` gelesen | Beleg zu B-1 |

Kein Typfehler ist vermutet; jede Zeile unten ist gegen den Übersetzer oder gegen einen Lauf
gehalten.

---

## Blockierend — muss vor `0.1.1`

```
apps/desktop/scripts/proof-shell-surface.mjs:426  blockierend  A-V-17 wird an der falschen Stelle gemessen.
```

`readCapabilityFiles()` liest `readdirSync(capabilitiesDir)` — **eine** Ebene — und filtert auf
`.json`. Tauri liest anders: `tauri-utils-2.9.3/src/acl/build.rs:458–461` bildet das Muster
`"{capabilities}/**/*"` und `acl/capability.rs:269–278` nimmt `json`, `toml` und (mit
`config-json5`) `json5` an.

**Fehlerfall.** Jemand legt `apps/desktop/src-tauri/capabilities/shell.toml` an:

```toml
identifier = "extra"
windows = ["main"]
permissions = ["shell:default"]
```

Tauri wendet die Datei an. `shell:default` enthält `allow-open` mit dem Muster
`^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+` — jede `https:`-Adresse geht durch (T-136,
Bedrohungsmodell 18.3). Ein eingeschleustes Skript im Webview ruft
`invoke('plugin:shell|open', { path: 'https://…' })` und öffnet eine beliebige Seite im Browser
des Benutzers. `pnpm proof:all` bleibt dabei **grün**, weil weder die Endung noch der Ordner
gelesen wird. Dieselbe Lücke trägt `capabilities/unterordner/x.json`.

**Fix.** `readCapabilityFiles()` rekursiv machen (wie `readWebSources` in Zeile 441) und auf
`.json`, `.json5`, `.toml` erweitern; zwei Gegenproben ergänzen — eine Datei in einem
Unterordner und eine `.toml` —, sonst bleibt die Erweiterung selbst ungemessen.

```
apps/desktop/scripts/proof-shell-surface.mjs:433  blockierend  „Ein Aufrufort für `open`" gilt nur für die oberste Ebene von src-tauri/src.
```

`readRustSources()` liest ebenfalls ohne Rekursion. `checkOpenCallSites` zählt daraus
`openCalls` und verlangt genau eins.

**Fehlerfall.** Ein zweiter Öffnen-Weg in einem Untermodul, etwa
`apps/desktop/src-tauri/src/hilfe/mod.rs` mit `app.shell().open(adresse, None)`. Der Zähler
bleibt bei 1, `checkOpenCallSites` bleibt grün, und `proof:release-safety` fängt es nicht auf —
es prüft `takt_open_release` und `href`, aber nirgends `.open(`. Damit existiert ein zweiter,
ungeprüfter Weg in den Browser, während beide Nachweise sagen, es gebe genau einen. Dieselbe
Lücke betrifft die Adressprüfung in derselben Funktion (Zeile 319–341).

**Fix.** `readRustSources()` rekursiv über `src-tauri/src` laufen lassen; Gegenprobe mit einer
Datei in einem Unterordner statt mit einem synthetischen Listeneintrag — die heutige Gegenprobe
(Zeile 536) schiebt den Verstoß in die schon gelesene Liste und kann die Blindheit des Lesers
deshalb nicht bemerken.

---

## Sollte

```
apps/local-api/scripts/proof-release-safety.mjs:501  sollte  `globalThis.fetch` ist für „genau ein Ausgang" unsichtbar.
```

`FETCH_MENTION = /(?<![\w.$-])fetch\b(?!\s*:)/` schließt jedes `.fetch` aus, um `app.fetch` und
`options.fetch` durchzulassen. Gemessen: `globalThis.fetch(u)`, `window.fetch(u)` und
`const { fetch: f } = globalThis` sind **blind**; nur das nackte `fetch(` und
`globalThis["fetch"]` werden erkannt.

**Fehlerfall.** `apps/local-api/src/irgendwas.ts` mit
`await globalThis.fetch('https://beispiel.invalid/x')`. `checkSingleExit` zählt weiterhin
**eine** Datei, `checkAddresses` sieht kein `github.com`, `checkNoDownload` keinen Marker — alle
sechs Prüfungen grün, obwohl der Dienst eine zweite Adresse außerhalb von `127.0.0.1` anspricht
und damit E-001 aufhebt. Die Gegenprobe (Zeile 583) benutzt `fetch(` und deckt die Ausnahme
deshalb nicht ab. Das ist das dritte Loch derselben Bauart, die T-133 zweimal gefunden hat: die
Gegenprobe prüft den Fall, der ohnehin erkannt wird.

**Fix.** Statt jedes `.fetch` auszunehmen die zwei bekannten Felder namentlich ausnehmen
(`app.fetch`, `options.fetch`) und `globalThis.`/`window.` ausdrücklich mitzählen; Gegenprobe
mit `globalThis.fetch`.

```
apps/web/scripts/proof-foreign.mjs:1031  sollte  Abschnitt 6 prüft nur `===`/`!==`, nicht `==`/`!=`.
```

`typeof value == "string"` verengt in TypeScript genauso wie `===`. Es gibt in diesem Bestand
**keinen** Linter (kein `eslint.config.*`, kein `biome.json`, kein `lint`-Skript), und `==` wird
tatsächlich benutzt (`apps/web/src/app/App.tsx:307`).

**Fehlerfall.** In `lib/exportTemplateModel.ts` schreibt jemand statt `foreignTextFrom`
`const name = typeof candidate["name"] == "string" ? candidate["name"] : null;`. Abschnitt 6
bleibt grün, `name` ist wieder gewöhnlicher `string`, und die Abschnitte 2 bis 4 sehen ihn nicht
mehr — genau der Weg, den T-133 geschlossen hat, mit einem Zeichen weniger.

**Fix.** `EqualsEqualsToken` und `ExclamationEqualsToken` in die Bedingung aufnehmen.

```
apps/web/scripts/proof-foreign.mjs:1056  sollte  Die Winkelform `<string>x` läuft an Abschnitt 6 vorbei.
```

Geprüft wird nur `ts.isAsExpression`. `<string>value` ist in `.ts`-Dateien gültig und hat einen
anderen Knoten (`ts.isTypeAssertionExpression`); `lib/exportTemplateModel.ts`,
`lib/foreign.ts` und `lib/releasePage.ts` sind `.ts`.

**Fehlerfall.** `const name = <ForeignText>candidate["name"];` — kein `typeof`, kein `as`,
Abschnitt 6 grün, die Formprüfung entfällt lautlos.

**Fix.** `ts.isTypeAssertionExpression(node)` neben `ts.isAsExpression(node)` behandeln.

```
apps/local-api/src/version/checker.ts:169  sollte  Eine rückwärts gestellte Systemuhr ergibt eine Endlosschleife.
```

`elapsed = options.now().getTime() - lastRequestAt` wird negativ, wenn die Wanduhr zurückspringt.
`schedule(minIntervalMs - elapsed)` (Zeile 171) ergibt dann eine Frist, die bei einem Rücksprung
über rund 25 Tage `2^31−1` ms überschreitet. Node kürzt sie auf **1 ms** — gemessen:
`TimeoutOverflowWarning`, gefeuert nach 2 ms. `run()` rechnet dasselbe noch einmal aus und
plant wieder auf 1 ms.

**Fehlerfall.** Leere CMOS-Batterie oder ein wiederhergestellter VM-Schnappschuss setzt die Uhr
auf 2015. Der 24-Stunden-Zeitgeber (Node-Timer laufen monoton weiter, der Sprung stört sie
nicht) feuert, und ab da läuft der Sidecar mit rund tausend Durchgängen je Sekunde und schreibt
bei jedem eine `TimeoutOverflowWarning` nach `stderr` — den Kanal, auf dem das Protokoll liegt
(`logger.ts:121`). Ausgehende Anfragen gehen dabei **keine** hinaus; der Boden aus A-V-11 hält,
und das ist die gute Hälfte des Befundes.

Der Kommentar an `VERSION_CHECK_MIN_INTERVAL_MS` (Zeile 74–79) nennt „eine zurückgestellte
Systemuhr" ausdrücklich als den Fall, gegen den der Boden geschrieben ist. Genau dort verhält er
sich falsch.

**Fix.** Die Frist deckeln und den Rücksprung benennen:
`if (elapsed < 0) { lastRequestAt = options.now().getTime(); schedule(minIntervalMs); return; }`,
und in jedem Fall `schedule(Math.min(intervalMs, delay))`.

```
apps/desktop/scripts/build-app.mjs:157  sollte  Dritte Stelle, an der ein führendes `v` fällt, und dritte, weitere Formprüfung.
```

`packages/domain/src/version.ts:104` sagt über `stripReleaseTagPrefix`: „**Die einzige Stelle im
ganzen Vorhaben, an der das geschieht**", E-066 Punkt 3 sagt „an genau einer Stelle". Der Baum
trägt drei: die Domäne, `release.rs:89` (dort begründet und von T-136-1 verlangt) und
`build-app.mjs:157` mit `rawVersion.trim().replace(/^v/, '')` und `:161` mit
`^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$` — **ohne** die Schranken `{1,9}` und `{1,64}` aus
`VERSION_SHAPE`.

**Fehlerfall.** Etikett `v1234567890.0.0` (zehn Ziffern). `build-app.mjs` lässt es durch und legt
`{ "version": "1234567890.0.0" }` als Überlagerung; das Erzeugnis trägt die Zahl,
`takt_installed_version` gibt sie heraus, `checkVersion` weist sie als `malformed` ab und
`decideUpdateNotice` liefert dauerhaft `{ show: false, reason: 'unknown' }`. Die Versionsprüfung
dieses Erzeugnisses meldet sich **nie** — still, ohne Protokollzeile, ohne Fläche, nicht von
„alles aktuell" zu unterscheiden. Dieselbe Fassung wiese auch `takt_open_release` ab.

Gemessen wird das nirgends: `build-app.mjs` liegt weder in `SOURCE_ROOTS` von
`proof:release-safety` (Zeile 106, nur `src`-Ordner) noch in einer der vier Prüfungen von
`proof:shell-surface`.

**Fix.** `build-app.mjs` ist Node und darf `@takt/domain` einbinden: `RELEASE_TAG_SHAPE` und
`checkVersion` statt eines eigenen Ausdrucks. Geht das im Bauablauf nicht, muss der Ausdruck
zeichengleich gegen `VERSION_SHAPE` gemessen werden — und der Satz in `version.ts:104` muss
sagen, was stimmt.

```
packages/storage/src/sqlite/clock.ts:70  sollte  „nicht messbar" wird zu einer 0 und damit zu einer Entwarnung.
```

`databaseFilesTooPermissive()` gibt `seen.checked ? seen.tooPermissive.length : null` zurück.
`checked` ist nur bei Windows und `':memory:'` falsch (`database.ts:161`). Jeder gescheiterte
`statSync` wird in `database.ts:169–171` mit `catch {}` verschluckt — Kommentar: „Nicht vorhanden
heißt nicht zu weit."

**Fehlerfall.** Das Anwendungsdatenverzeichnis liegt auf einem Dateisystem, auf dem `stat` mit
`EACCES` oder `EIO` scheitert (eingehängte Freigabe, Container-Bind-Mount mit engem `x`-Recht auf
dem Elternordner). `tooPermissive` bleibt leer, `checked` ist `true`, die Einstellungen zeigen
**0** — also „alle drei Dateien liegen eng" —, obwohl nichts gemessen wurde. Das ist wörtlich
der Fall, den `ports.ts:1050–1053` ausschließt: „`null` ist ausdrücklich **nicht** `0` — eine
Nichtaussage ist keine Entwarnung." Der neue Wert steht seit T-132 in `GET /settings` und wird
dort gelesen; vorher hing an demselben `catch` nur eine Protokollzeile.

**Fix.** In `inspectDatabasePermissions` `ENOENT` (nicht vorhanden → nicht zu weit) von jedem
anderen Fehler trennen und bei letzterem `checked: false` liefern.

```
docs/bedrohungsmodell.md 18.9 A-V-12  sollte  Die Auflage nennt ein Messmittel, das es nicht gibt.
```

A-V-12 misst „`proof:access`: nach `shutdown()` endet der Prozess innerhalb der Frist, **auch
während** eine ausgehende Anfrage läuft". Der Diff an `apps/local-api/scripts/proof-access.mjs`
fügt keinen einzigen Versionsfall hinzu (nur Migrationsgründe, geprüft mit `git diff … | grep`).
Gemessen ist die **Sache** — `checker.test.ts:187` bricht einen laufenden Aufruf ab und
`main.ts:373` ruft `versionCheck.stop()` als erstes im `shutdown()` —, aber nicht mit dem
Mittel, das die Auflage nennt, und nicht am laufenden Prozess. T-138 hat das selbst als offenen
Punkt gemeldet.

**Fix.** Entweder den Fall in `proof:access` bauen oder A-V-12 auf das umschreiben, was gemessen
wird. Gehört in die Wiedervorlage T-145; hier nur zur Sicherheit doppelt gemeldet.

```
docs/bedrohungsmodell.md 18.9 A-V-14  sollte  Die Auflage nennt drei Felder, die Route liefert zwei.
```

`VersionCheckView` (`routes/version.ts:67`) trägt `state` und `latestVersion`; die installierte
Fassung fehlt und **soll** fehlen (E-069 Punkt 2, A-V-15). Die Abweichung ist enger als die
Auflage und richtig; der Text der Auflage stimmt trotzdem nicht mit dem Code. Von T-138 selbst
gemeldet, hier bestätigt.

**Fix.** A-V-14 an E-069 angleichen (T-145).

```
apps/desktop/src-tauri/src/release.rs:269  sollte  Dateihoheit: unit-tester hat in eine Datei von frontend-dev geschrieben.
```

Der Block „T-140 — Erweiterung (unit-tester)" liegt in `apps/desktop/src-tauri/src/release.rs`.
Nach der Tabelle in `CLAUDE.md` gehört `apps/desktop/**` frontend-dev; unit-tester hat
`packages/*/test/**` und `apps/*/test/**`.

Der Schreibvorgang war **verlangt**: T-136-1 fordert die Ausbruchsliste „als Prüffälle **neben**
dem Befehl, nicht in einer fernen Testdatei", und Rust kennt für Modultests keinen zweiten Ort.
Die Aufgaben liefen auch nicht gleichzeitig (T-139 in Welle Q, T-140 in Welle R). Der Befund ist
deshalb keiner gegen den Agenten, sondern gegen die Regel: Solange die Tabelle den Fall nicht
kennt, gibt es kein Kriterium, an dem sich der nächste unterscheiden ließe.

**Fix (Orchestrator).** In `CLAUDE.md` eine Zeile: `#[cfg(test)]`-Blöcke in `src-tauri/src/**`
gehören unit-tester, der übrige Inhalt der Datei nicht — oder die Ausnahme ausdrücklich an
A-V-16 hängen.

---

## Hinweise

```
apps/web/src/app/useUpdateNotice.ts:181  Hinweis  `void openReleasePage(...).then(...)` ohne Ablehnungszweig.
```
Heute unerreichbar — `connection.ts:242` fängt `loadShell`, `shell.ts:openReleasePage` fängt
`invoke`, `isShellAvailable()` kann nicht werfen. Die Nachbarstelle in derselben Datei
(Zeile 130–133) und `ExportDirectoryField.tsx:339` haben ihren zweiten Zweig trotzdem. Fix:
zweiter Rückruf, wie bei `getVersionCheck()` zwölf Zeilen darüber.

```
apps/local-api/src/version/source.ts:80  Hinweis  „im ganzen Baum" ist mehr, als der Nachweis liest.
```
`proof:release-safety` liest acht `src`-Ordner und zehn benannte Dateien; `apps/*/scripts/**`,
`tests/**`, `.github/workflows/**` und `src-tauri/capabilities/**` liegen außerhalb
(`proof-release-safety.mjs:106`, `:118`, `:134`). Genau in `scripts/` steht die dritte
Formprüfung aus S-5. Fix: den Satz auf das eingrenzen, was gemessen wird — sonst ist er
dieselbe Abschrift, gegen die E-063 Punkt 5 geschrieben ist.

```
apps/local-api/src/version/checker.ts:281  Hinweis  Der Zweig `aborted` erreicht das Protokoll nie.
```
`run()` filtert `'aborted'` in Zeile 190 heraus, bevor `report()` gerufen wird; `catch` in Zeile
193 meldet `'unreachable'`. `describeVersionCheckFailure('aborted')` liefert deshalb einen
Schlüssel, der nie geschrieben wird — er sieht in der Aufzählung aus wie einer, der es tut. Fix:
entweder den Filter fallen lassen (die Zeile beim Anhalten ist harmlos und erklärt das Ende) oder
den Zweig.

```
apps/local-api/src/version/source.ts:295  Hinweis  Die Obergrenze zählt nach dem Anhängen des Blocks, nicht davor.
```
`size += step.value.byteLength; if (size > MAX)` — der Block, der die Grenze überschreitet, liegt
zu diesem Zeitpunkt vollständig im Speicher. Bei `gzip` hält die Blockgröße von `node:zlib`
(16 KiB) das klein, und der Prüffall misst es echt (`source.test.ts:176`, Abbruch unter 2 s).
Die Zusage „65 536 Bytes" heißt streng genommen „65 536 plus eine Blockgröße". Fix: entweder den
Satz präzisieren oder vor dem Anhängen zuschneiden.

```
apps/web/src/app/UpdateNotice.tsx:21  Hinweis  Der Dialog erscheint unangekündigt und zieht den Fokus.
```
`UpdateDialog.tsx:102` ruft `dialogRef.current?.focus()`, sobald die Prüfung zurückkommt — beim
Start und danach alle sechs Stunden erneut (`useUpdateNotice.ts:139`). Tippt der Benutzer gerade,
verliert er den Fokus mitten im Feld. A-18.6 verlangt die Anzeige, nicht den Zeitpunkt. Fachlich
gehört das zu spec-ux-reviewer (T-144); hier nur benannt, damit es nicht zwischen zwei Berichten
liegen bleibt.

```
apps/local-api/src/version/checker.ts:190  Hinweis  „Kein zweiter Versuch im selben Lauf" ist länger, als es klingt.
```
Der Sidecar endet erst mit der Hülle. Nach dem ersten Fehlschlag steht der Zeitgeber für den
ganzen Lauf — bei einem Takt, das über Wochen offen ist, heißt das: nie wieder. Das ist A-18.11
wörtlich und richtig umgesetzt; es gehört aber ins Benutzerhandbuch, damit „beim Start **und
danach regelmäßig**" (A-18.2) nicht mehr verspricht, als der Bau leistet. An documenter.

```
CLAUDE.md, Abschnitt „Verzeichnisse und Hoheit"  Hinweis  Drei Dokumente haben keinen Eigentümer.
```
`docs/spec.md`, `docs/datenmodell.md` und `docs/architektur.md` sind bei documenter
ausgenommen und niemandem sonst zugewiesen. T-138 hat `architektur.md` und `datenmodell.md`
geändert — nach gelebter Praxis richtig, nach der Tabelle unentscheidbar. Fix: die drei in der
Tabelle nennen (Orchestrator oder die jeweils schreibende Rolle).

---

## Was ich geprüft habe und sauber gefunden habe

Kurz, weil ein Review, das nur Funde nennt, nicht sagt, wie weit es gelesen hat.

* **`release.rs` gegen den Strich.** `is_release_version` prüft Länge **vor** der Zerlegung,
  `is_ascii()` vor jeder Aussage über Zeichen, jede der drei Kernkomponenten einzeln gegen
  `MAX_NUMBER_LEN` (die Ausbruchsliste allein hätte das nicht gefunden — der T-140-Fall
  `1234567890.2.3` schon), `numbers.next().is_some()` schließt `1.2.3.4`, `split_once('-')`
  kann den Kern nicht verschieben, weil der Kern keinen Bindestrich enthalten darf, und
  `release_url` gibt bei Nichtbestehen `None` und keine Teiladresse. `V`, `v`, arabisch-indische
  Ziffern, `%2f`, Zeilenumbruch, `\u{202e}`: alle abgewiesen. Ich habe keinen Wert gefunden, der
  `is_release_version` besteht und in `format!("{RELEASE_TAG_PREFIX}{version}")` etwas anderes
  ergibt als eine Adresse auf `github.com/KuyomieKurama/SuperTakt/releases/tag/…`.
  `takt_open_release` nimmt genau einen `String`, `Err("version_rejected")` trägt den
  abgewiesenen Wert nicht.
* **Die Netzschicht gegen ihren eigenen Kopfkommentar.** `redirect: 'error'` steht da,
  `AbortSignal.any([shutdown, timeout])` deckt Verbindung **und** Rumpf (belegt durch
  `source.test.ts:56`, Ende nach 5 000–7 000 ms), der Rumpf läuft über `getReader()` und nicht
  über `json()`/`text()`/`arrayBuffer()`, `content-length` wird nirgends gelesen, `Object.hasOwn`
  vor dem einen Feldzugriff, `classifyNetworkError` liest aus dem Wurf nur `name` und vergleicht
  `cause.message` gegen ein **festes** Wort, ohne es weiterzureichen. Kein `any`, keine
  Typzusicherung; `checkVersion` nimmt `unknown` und ist die einzige Stelle, an der aus der
  Antwort ein Wert wird.
* **Die Klasse „verschluckter Grund" aus T-132.** `main.ts:97–110` hat die Klammer um
  `compose()`, `bringDatabaseUpToDate` unterscheidet neun Gründe, `failWith` reicht einen bereits
  eingeordneten Wurf durch, statt ihn zu übermalen, `errorCodeOf` begrenzt auf
  `^[A-Z][A-Z0-9_]{0,31}$`, `REASON_SHAPE` in `logger.ts:63` weist jeden Grund ab, der nicht in
  den Vorrat passt, und `version_check_status code=403` besteht ihn (geprüft). Ich habe die
  geänderten Dateien nach `catch {` ohne Bindung durchgesehen; die verbliebenen sind alle
  begründet und keiner verwandelt einen Fehlschlag in einen Erfolg — mit der einen Ausnahme in
  S-8.
* **Doppelte Fachlogik.** Die **Ordnung** der Fassungen steht ausschließlich in
  `packages/domain/src/version.ts`; `release.rs` vergleicht nicht, die Oberfläche vergleicht
  nicht, `useUpdateNotice.ts` ruft `decideUpdateNotice` und `normalizeVersion` und entscheidet
  selbst nichts. Rundung, Base64 und Exportstatuswechsel sind in dieser Welle nicht angefasst.
  Die **Form** steht dreimal (Domäne, Rust, Bauskript) — zweimal begründet und gemessen, einmal
  nicht: das ist S-5. Die Adresse der Release-Seite steht zweimal und wird zeichengleich
  gemessen (`proof:shell-surface` Prüfung 4). T-134 hat die verbliebenen Doppelungen
  (`MAX_TAKEOVER_CHARACTERS`, `ADDIN_TAG_IDS_MAX`) benannt statt halb aufgelöst — richtig so.
* **Der Schnitt in `prepareNote`.** `TRUNCATION_HINT` geht in das Budget ein
  (`4000 − 11 = 3989`), das Ergebnis bleibt bei genau 4000 und damit unter dem Deckel der Tür.
  Nachgerechnet.
* **Die Tür der übersprungenen Fassung.** Drei Wachen, alle gegen dieselbe Form: Schema
  (`export.ts:95`, `RELEASE_TAG_SHAPE` importiert statt abgeschrieben), Anwendungsfall
  (`structure.ts:840`, `checkVersion`, abgewiesener Wert **nicht** in der Meldung), Mapper beim
  **Lesen** (`mappers.ts:452`, `normalizeVersion`), dazu der `CHECK` in Migration 0013 als vierte.
  `null` ist überall ein Wert und kein fehlendes Feld (`!== undefined`, nicht `!= null`).
* **A-V-10.** `compose()` baut den Prüfer und startet ihn nicht; `versionCheck.start()` steht an
  genau einer Stelle (`main.ts:350`); die Route liest `current()` und hat keinen Weg zu einer
  Anfrage. `routes/version.ts` importiert weder `source.ts` noch `createGithubReleaseSource`.

---

**Aufgabe:** T-143 — Code-Review über Welle O bis R
**Status:** nicht freigegeben
**Artefakte:** `.claude/team/reports/T-143-code-reviewer.md`
**Zusammenfassung:** Typprüfung, 1171 Einheitentests und 18 Nachweispfade laufen grün, und der
Produktivcode der Versionsprüfung hält, was sein Kopfkommentar sagt — `release.rs` habe ich
gegen die Ausbruchsliste und darüber hinaus gelesen, ohne einen Weg an der Formprüfung vorbei zu
finden. Blockierend sind zwei Lücken im **Nachweis** `proof:shell-surface`: er liest
`capabilities/` nur eine Ebene tief und nur `.json`, während Tauri `capabilities/**/*` mit
`.json`, `.toml` und `.json5` liest, und er liest `src-tauri/src` ohne Rekursion, obwohl daran
die Zusage „ein Aufrufort für `open`" hängt. Beides macht die Hälfte der einzigen Kontrolle aus
T-136-1 zu einer Zusage statt zu einer Messung. Dazu acht „sollte" — darunter das dritte Loch in
den Gegenproben (`globalThis.fetch` ist für `proof:release-safety` unsichtbar), eine dritte,
weitere Formprüfung im Bauskript, die eine Fassung durchlässt, mit der die Versionsprüfung
danach still ausfällt, und eine Endlosschleife im Prüftakt bei zurückgestellter Systemuhr
(gemessen: `setTimeout` über `2^31` feuert nach 2 ms).
**Annahmen:** Die Gewichtung „blockierend" für die zwei Nachweislücken folgt dem Auftrag
(„Ein Nachweis mit einer Lücke ist schlimmer als keiner") und dem Umstand, dass A-V-17 nach
T-136-1 keine zweite Kontrolle hinter sich hat — der Bestand ist heute sauber, die Messung ist
es nicht. Die Dateihoheitsverletzung an `release.rs` habe ich als „sollte" und als Befund gegen
die Regel gewertet, nicht gegen den Agenten, weil T-136-1 den Ort ausdrücklich verlangt.
**Risiken:** Sicherheitsrelevant sind B-1, B-2 und S-1 — alle drei erlauben, eine gemessene
Zusage zu brechen, ohne dass `pnpm check` rot wird. S-5 ist der einzige Befund, der ein
**ausgeliefertes** Erzeugnis stillschweigend um die Versionsprüfung bringen kann; er greift erst
bei einem Etikett außerhalb der engen Form, `v0.1.0` ist nicht betroffen. S-8 macht aus einer
Nichtaussage eine Entwarnung an einer Fläche, die B-7.2 betrifft.
**Offene Fragen:** (1) Soll `proof:shell-surface` die Fähigkeitendateien selbst mit demselben
Glob lesen wie Tauri, oder genügt „rekursiv plus drei Endungen"? (2) Darf `build-app.mjs`
`@takt/domain` einbinden, oder muss der Gleichlauf dort gemessen statt aufgelöst werden?
(3) Bekommt `#[cfg(test)]` in `src-tauri/src/**` eine benannte Ausnahme in `CLAUDE.md`?
**Nächster Schritt:** B-1 und B-2 an frontend-dev (beide in derselben Datei, ein Vorgang, mit
zwei zusätzlichen Gegenproben); S-1 bis S-3 an domain-dev beziehungsweise frontend-dev als
Nacharbeit an den Nachweisen; S-4 und S-5 an domain-dev beziehungsweise frontend-dev; S-6 und
S-7 in die Wiedervorlage T-145. Danach eine kurze zweite Runde nur über die geänderten
Nachweispfade — nicht über den ganzen Umfang.
