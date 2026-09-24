# T-324 — Freigaberunde über T-320 und T-321

Aufgabe: T-324 — Strang A (T-320 Punkt 1, T-321 Teil 1) und Strang B (T-320 Punkt 2, T-321 Teil 2)
Gegenstand: Zweig `feature/outlook-anhaenge-und-versionspruefung`, `311b26e` gegen `4a52edc`
Urteil: **nicht freigegeben** — zwei blockierende Befunde, einer je Strang

Geschrieben habe ich ausschließlich diese Datei. Meßkopien liegen im Kratzverzeichnis;
`git status` nennt im Vorhaben nur `.claude/team/board.md`, und das war vor meinem ersten Aufruf
schon geändert. Die Bauergebnisse, die `verify:bundle` angelegt hat
(`apps/desktop/src-tauri/binaries/`, `.sidecar-build/`, `.sidecar-runtime/`), sind über
`apps/desktop/.gitignore` ausgenommen — mit `git check-ignore` geprüft, nicht angenommen.

---

## Läufe — jeder einzeln, jeder mit seinem Ergebnis

`pnpm check` fährt neun Stufen. Ich habe sie einzeln gefahren, damit ein Abbruch in Stufe vier die
Stufen fünf bis neun nicht verschluckt.

| Stufe | Ergebnis |
|---|---|
| `typecheck` | **grün** (8 Pakete + 7 Prüfprojekte + e2e, Exit 0) |
| `boundaries` | **grün** (Exit 0) |
| `contrast` | **grün** (Exit 0) |
| `proof:all` | **abgebrochen in Lauf 5 von 22** — Umgebung, nicht Bestand (siehe unten) |
| `verify:bundle` | **rot — Umgebung.** Das Bündeln lief durch (1287 KiB, Node v22.23.2, Prüfsumme geprüft); `verify-sidecar.mjs` bricht ab: „Auf 127.0.0.1:17843 lauscht bereits etwas" |
| `test:coverage` | **grün** — 96 Dateien bestanden, 1 übersprungen; **1873 Prüffälle grün**, 2 übersprungen; Anweisungen 91,57 %, Zweige 86,24 %, Funktionen 94,5 %, Zeilen 93,75 % |
| `test:rust` | **grün** — 69 bestanden, 0 fehlgeschlagen, 1 ausgelassen |
| `build` | **grün** (Exit 0) |
| `audit` | **grün** — keine bekannten Schwachstellen |
| `proof:engines` | **nicht gefahren** (braucht WebKitGTK; steht nicht in `proof:all`) |
| `test:e2e` | **nicht gefahren** (nicht im Auftrag) |

Die 22 Nachweisläufe einzeln, weil `proof:all` nach dem fünften stehenblieb:

| Lauf | Ergebnis |
|---|---|
| `proof:codepoints` | grün, 46/0 |
| `proof:migrations` | grün |
| `proof:openapi` | grün, 115/0 |
| `proof:callers` | grün, 74/0 |
| `proof:export` | grün, 98/0 |
| `proof:taskpane` | grün, 33/0 |
| `proof:foreign` | grün, 21/0 |
| `proof:surface` | grün, 27/0 |
| `proof:clamp` | grün, 21/0 |
| `proof:locked` | grün, 9/0 |
| `proof:layers` | grün, 36/0 |
| `proof:route-policy` | grün, 48/0 |
| **`proof:release-safety`** | **grün, 76 bestanden, 0 fehlgeschlagen** — die Zahl aus T-320 stimmt, selbst gefahren |
| `proof:shell-surface` | grün (Exit 0) |
| `proof:template-fields` | grün, 30/0 |
| `proof:db-permissions` | grün, 27/0 |
| `proof:addin` | grün, 301/0 |
| `proof:conflicts` | **rot — Umgebung** |
| `proof:tags` | **rot — Umgebung** |
| `proof:access` | **rot — Umgebung** |
| `proof:export-api` | **rot — Umgebung** |
| `proof:addin-wiring` | **rot — Umgebung** |

**Die fünf roten Läufe sind kein Befund an diesem Commit, und ich sage genau, woher ich das weiß.**
Alle fünf brechen mit demselben Satz ab: „Auf 127.0.0.1:17843 lauscht bereits etwas, auch nach 5 s
Warten." Gemessen mit `ss -ltnp`: Auf 17843 und 17844 hört `takt-local-api` (PID 900502), Kind eines
laufenden `target/debug/takt-desktop` (PID 899621, gestartet 23:14:34, also vor meinem ersten
Aufruf). Der Dienst belegt seine Ports ausdrücklich ausschließlich und weicht nicht aus (B-1.5). Ich
habe den fremden Prozeß **nicht** beendet — er gehört nicht mir. Diese fünf Läufe und
`verify:bundle` heißen deshalb „nicht gemessen", nicht „grün" und nicht „rot am Bestand". Sie sind
vor der Freigabe auf einem freien Rechner nachzuholen; keiner von ihnen berührt allerdings den
Änderungsumfang dieses Commits (Routenkonflikte, Tags, Zugriffsschicht, Exportschnittstelle,
Add-in-Verdrahtung).

---

## Befunde

### Strang A — die Löschpfade

```
apps/local-api/src/features/todos/attachments.ts:392   blockierend  `releaseUnclaimedBlobs` ist die Behebung ZWEIER als `hoch` gemeldeter Datenverlustbefunde (T-318) und hat **keinen einzigen Prüffall**. Gemessen: `grep -rl releaseUnclaimedBlobs apps/local-api/test packages/*/test tests` → leer; ebenso `releasableBlobOf`; `removeAttachment`/`removeTodo` kommen im ganzen Prüfbestand nicht vor. Die Messung von T-320 lag im Kratzverzeichnis und ist gelöscht. Die Abdeckungsschwelle greift hier strukturell nicht: `vitest.config.ts` listet unter `coverage.include` nur `packages/{domain,storage,export}/src`, `apps/local-api/src` gar nicht. Der Codepfad LÄUFT (`proof:openapi` fährt alle 78 Operationen an, DELETE eingeschlossen) — gemessen wird an ihm nur der Statuscode, nicht die Eigenschaft. Damit ist der Zustand genau der, den die Commitnachricht selbst anprangert: eine Zusicherung, die nie etwas maß. Fix: ein Prüffall des unit-testers auf Anwendungsfallhöhe, Aufbau steht in T-320 fertig beschrieben — Todo A trägt die Bildkopie, Todo B einen `file`-Anhang auf deren vollen Pfad, A löschen, `listImages()` muß die Datei weiter nennen; dazu die Gegenprobe (Eigentümerantwort auf `new Set()`), die T-320 selbst gefahren hat, als stehender Prüffall. Ohne diesen Fall fällt die Regel beim nächsten Umbau lautlos, und sie ist zweimal gefallen (T-313, T-314).
packages/storage/src/sqlite/repo-attachments.ts:473    mittel       Die neue Portmethode `attachmentNamesOfKind` hat **null** Abdeckung, und das ist gemessen, nicht geschätzt: `coverage/`-Tabelle für `repo-attachments.ts` = 88,04 % Anweisungen / 87,5 % Funktionen, ungedeckt unter anderem `473-478` — das ist Zeile für Zeile der ganze Rumpf dieser Methode. `packages/storage/src` liegt damit weiter über der 80-%-Schwelle, das Tor merkt es also nicht. T-320 hat den fehlenden Prüffall selbst als Wunsch gemeldet (offene Frage 3), T-321 hat ihn nicht gebaut, und `repo-attachments.test.ts` hat in derselben Welle 120 Zeilen bekommen. Fix: ein Prüffall im vorhandenen `describe`-Reigen von `repo-attachments.test.ts` — drei Zeilen der Arten `image`, `file`, `link`, davon eine mit vollem Pfad im `target`, und die Zusicherung, daß die Antwort die gefalteten Namen der Bildzeilen nennt und die der anderen Arten nicht.
packages/storage/test/file-port.test.ts:66             mittel       GENAU DIE KLASSE, DIE T-321 TEIL 2 SUCHEN SOLLTE, in einer Datei, die dort nicht gelesen wurde. Der Prüffall heißt „ein schreibgeschützter Ordner ergibt not_writable"; sein Rumpf sichert `expect(['ok', false].includes(result.ok as never) || result.ok === true).toBe(true)` zu. `result.ok` ist ein `boolean`: ist er `false`, trifft das erste Glied; ist er `true`, das zweite. Der Ausdruck ist **für jeden möglichen Wert wahr** und mißt nichts. Die eigentliche Aussage steht in der Folgezeile hinter einem `if (!result.ok)` — also genau dann nicht, wenn der Port fälschlich `ok` liefert, und das ist der Fehler, den dieser Fall fangen soll. Dazu die Typzusicherung `as never`, die die unbewiesene Annahme versteckt, `boolean` sei in `['ok', false]` suchbar. Fix: `expect(result.ok === true || (result.ok === false && result.reason === 'not_writable')).toBe(true)` ersetzt nichts — besser die Sonderrolle von root einmal am Anfang feststellen (`process.getuid?.() === 0`) und den Fall mit `it.skipIf` überspringen, dann trägt der Rumpf eine unbedingte Zusicherung: `expect(result).toEqual({ ok: false, reason: 'not_writable' })`. Das `as never` fällt damit mit.
apps/local-api/src/features/todos/attachments.ts:414   niedrig      Zwischen der Eigentümerantwort (`:414`) und dem Entfernen (`:443`) liegen `await`-Grenzen, und der Dienst bedient in dieser Lücke andere Anfragen. Legt jemand dort einen `file`-Anhang auf genau diese Datei an, wird sie gleich darauf entfernt, obwohl eine Zeile sie nennt — der teure Fehler, gegen den die Funktion geschrieben ist, nur sehr schmal. Der Kopf sagt zu Recht, warum die Frage nicht IN die Löschtransaktion kann; er sagt nicht, daß die Antwort beim Handeln schon veraltet sein kann. Fix: den Satz in den Kopf aufnehmen und die Fenstergröße benennen (ein Ereignisschleifendurchlauf), oder die Frage und die Entfernung je Datei unmittelbar nacheinander stellen, statt erst alle zu fragen und dann alle zu entfernen.
apps/local-api/src/context.ts:120                      niedrig      `logger` ist freiwillig, und die Begründung trägt (acht Prüfdateien bauen ihren Zusammenhang von Hand). Die Folge steht aber nicht dabei: Fehlt er, ist der Fehlschlag der Eigentümerfrage **wieder still** — es gibt keinen zweiten Empfänger, `releaseUnclaimedBlobs` kehrt ohne jede Spur zurück. Fix: ein Satz an dieser Stelle, der es sagt („ohne ihn ist der Fehlschlag unsichtbar; im Zusammenbau ist er gesetzt, und ein Zusammenbau ohne ihn ist ein Fehler"), damit der nächste Erbauer eines Zusammenhangs weiß, was er weglässt.
```

### Strang B — der Versionswächter, sechste Runde

```
apps/local-api/scripts/proof-release-safety.mjs:1442   blockierend  SECHSTE UMGEHUNG DERSELBEN KLASSE, GEMESSEN. Der Baum ist jetzt am Compiler aufgespannt — das ist richtig und trägt. Die beiden Zusagen, die ihn lesen, hängen aber weiter an einer HANDGESCHRIEBENEN ENDUNGSLISTE: `istTypescriptDatei` nimmt `.ts`, `.tsx`, `.mts` und sonst nichts, und beide Zusagen kehren an ihr um (`findeErweiterungsbloecke:1459`, `findeZweiteDeklarationDesPorts:1507`). `.cts` fehlt. Gemessen mit dem `typescript` dieses Vorhabens (5.9.x, `node_modules/typescript/bin/tsc`) in einem zeichengleichen Nachbau der Schalter aus `tsconfig.base.json` (`module: ESNext`, `moduleResolution: bundler`, `allowImportingTsExtensions`, `include: ["src"]`): `src/augment.cts` mit `export {}; declare module './version.ts' { interface VersionCheckStorePort { read(): Promise<string|null> } }`, daneben `port.read()` in `src/version.ts` — `--listFiles` nennt `augment.cts` im Programm, und **tsc gibt Exit 0**. Die Zusammenführung greift also. `collectTree` LIEST die Datei sogar (die Programmhälfte filtert keine Endungen); nur die beiden Zusagen überspringen sie. Und der neue Prüfsatz „jede Datei des Übersetzungsprogramms liegt im gelesenen Baum" wäre dabei GRÜN — er mißt die Anwesenheit im Baum, nicht, daß irgendeine Zusage sie ansieht: dieselbe Bauart wie der Wächter, der die geschlossene Tür zählte (E-099 Punkt 3). Die Klasse ist damit nicht geschlossen, sondern von der Verzeichnisliste auf die Endungsliste umgezogen. Fix, und zwar der strukturelle: `collectTree` hat die `SourceFile`-Objekte des Programms schon in der Hand — die Zusagen über DIESE laufen lassen statt über einen aus der Endung geratenen Neubau; hilfsweise `ts.getScriptKindFromFileName(pfad)` gegen `ScriptKind.TS`/`TSX` fragen, dann steht keine Liste mehr da. Dazu `.cts` und `.d.cts` in `READ_EXTENSIONS` (:199), sonst bleibt eine `.cts` in den vier Oberflächen ohne Programm für ALLE sieben Prüfungen unsichtbar, nicht nur für die beiden Zusagen. Und ein Gegenprobeneintrag (β) mit eigenem `erwartet`, der die Erweiterung in einer `.cts` einsetzt — ohne ihn ist die siebte Runde vorprogrammiert. Heute ist die Lücke latent: `find apps/*/src packages/*/src -type f -name '*.cts' -o -name '*.cjs'` ist leer, gemessen.
apps/local-api/scripts/proof-release-safety.mjs:316    mittel       `PROGRAM_CONFIG` fragt genau EIN Übersetzungsprogramm, `@takt/local-api`. Für `apps/web`, `apps/desktop`, `apps/outlook-addin` und `packages/export` bestimmt weiter eine Verzeichnisliste den Baum — also genau die Bauart, an der der Lauf fünfmal unterlag, für vier von fünf Oberflächen. Ich habe es gemessen (eigenes Skript, `parseJsonConfigFileContent` + `createProgram` je Paketkonfiguration): `apps/web` übersetzt 196 eigene Dateien, davon liegen ZWEI außerhalb jeder `SOURCE_ROOTS`-Wurzel und außerhalb von `EXTRA_FILES` — `apps/web/vite.config.ts` und `apps/outlook-addin/vite.config.ts`. Beide sind ungelesen, und beide tragen heute Adressen (`apps/web/vite.config.ts` nennt `127.0.0.1` in `server` und `preview`). Ein `define` oder ein `proxy` dort wandert in das ausgelieferte Webbündel; das ist Laufzeitcode und nicht Lieferkette, anders als `scripts/`. Am schwersten wiegt: die Lückenliste bei `checkNoStoreReadback` (:1190 ff.) wurde in diesem Commit erweitert und nennt sie NICHT — und diese Liste ist der Ort, an dem der nächste Prüfer nachsieht, bevor er eine Umgehung sucht. Fix: entweder die beiden Dateien in `EXTRA_FILES` aufnehmen (billig, schließt das Gemessene) oder `PROGRAM_CONFIG` zu einer Liste über alle fünf Paketkonfigurationen machen (teurer, spannt die Menge überall an der Anforderung auf); in beiden Fällen die Lückenliste um den Satz ergänzen, welche Oberflächen noch an einer Verzeichnisliste hängen.
apps/local-api/scripts/proof-release-safety.mjs:68     mittel       Der Kopf sagt weiter zu, was seit diesem Commit nicht mehr gilt: „**b) Prüfdateien.** Die Ordner `test`, `tests` und `__tests__` dürfen Adressen und Antwortfelder nennen." Nach der Streichung in `SKIP_DIRECTORIES` wird ein solcher Ordner UNTERHALB einer Quellwurzel gelesen, und die neue Gegenprobe (α) setzt ihre Erweiterung ausdrücklich unter `apps/local-api/src/features/version/test/` und erwartet, daß sie GEFUNDEN wird. Kopf und Gegenprobe widersprechen sich damit in derselben Datei, und der Widerspruch zeigt in die gefährliche Richtung: Wer b) liest, legt eine Nachbildung mit `tag_name` unter `src/**/test/**` ab, sieht den Lauf rot werden und trägt den Verzeichnisnamen wieder in `SKIP_DIRECTORIES` ein. Fix: b) auf das Gemessene kürzen — Prüfordner **neben** einer `src`-Wurzel dürfen alles nennen und werden von keinem Weg gelesen; ein Prüfordner **unter** einer Quellwurzel oder im Übersetzungsprogramm darf es nicht, und das ist seit T-320 Absicht.
apps/local-api/test/usecases/image-sweep.test.ts:773   niedrig      `expect(match).not.toBeNull()` ist die Zusicherung, die hier nichts trägt: `lines[0]?.reason?.match(...)` ergibt bei fehlendem `reason` **`undefined`**, und `undefined` ist nicht `null` — die Zeile bleibt grün. Daß der Fall trotzdem rot würde, hängt daran, daß `toMatch(undefined)` drei Zeilen später wirft; die Zusicherung, die es sagen soll, sagt es nicht. Dieselbe Zeile in `:823`, `email-file-sweep.test.ts:716` und `:766`. Fix: `expect(lines[0]?.reason).toMatch(/^…reason=/)` als erste, unbedingte Zusicherung setzen (oder `expect(match ?? null).not.toBeNull()`), dann hängt die Aussage nicht am Wurf eines späteren Matchers.
```

### T-321 Teil 2 — woran die Menge aufgespannt ist

```
.claude/team/reports/T-321-unit-tester.md               niedrig      Die Zusicherung ist über den GANZEN Prüfbestand gestellt, die Menge aber an den Dateien aufgespannt, die der Autor gelesen hat: 21 von **97** Prüfdateien, 306 von 1875 Prüffällen. Für den Rest diente ein Raster aus vier Mustern, und alle vier sind die Gestalt, die T-319 schon gefunden hatte (`|| … .length >`, `.toBeTruthy()`, `expect(true).toBe(true)`) — eine Gegenprobe, die die bekannte Bauart nachfährt. Daß das nicht genügt, ist gemessen und nicht behauptet: Eine Suche über denselben Bestand nach `expect(… || …)` liefert vier Treffer, und einer davon ist der oben gemeldete `file-port.test.ts:66` — genau die Klasse, in einer der 76 nicht gelesenen Dateien. Dem Bericht ist zugutezuhalten, daß er seine Grenze ausdrücklich nennt und die Klasse NICHT für geschlossen erklärt; das ist die richtige Hälfte von E-099 Punkt 3. Fix für den Folgeauftrag: die Menge an der Anforderung aufspannen statt an Dateien — „jede Zusicherung, deren Aussage unabhängig vom geprüften Wert wahr ist", und dafür ein Raster, das der Bestand nicht kennt: bedingte Zusicherungen (`if (…) expect(`, heute **8** Treffer, gemessen), `||` in `expect(`, `as never`/`as any` in Prüfdateien, und je Kandidat die Gegenprobe „erwarteten Wert verfälschen, muß rot werden", die T-321 für ihre eigene Reparatur vorbildlich gefahren hat.
.claude/team/reports/T-321-unit-tester.md               niedrig      Die gemeldete `applyDefaultTags`-Lücke ist kleiner als beschrieben. Die Suche lief über `apps/local-api/test/**`; `packages/storage/test/repo-settings.test.ts:160` prüft „greifen beim Anlegen eines Todos über `applyDefaultTags` — hier über den Adapter, nicht die reine Regel (A-9.5)". Die Aussage „kein Prüffall auf Höhe des lokalen Dienstes" bleibt richtig, und der Add-in-Weg (`routes/addin/service.ts:695`) ist wirklich ungemessen. Fix: den Befund auf den Add-in-Weg zuspitzen, damit der Folgeauftrag nicht noch einmal prüft, was schon steht.
```

---

## Was ich bestätigt habe — gemessen, nicht übernommen

**1. Die Signaturänderung am Port trägt, und der Prüfcode steht gegen den fertigen Stand.**

- `AttachmentPort` hat genau **eine** Umsetzung: `createAttachmentPort`
  (`packages/storage/src/sqlite/repo-attachments.ts:112`), verdrahtet an genau einer Stelle
  (`unit-of-work.ts:140`). `grep -rn AttachmentPort apps packages tests` findet keine zweite
  Umsetzung und **keine Attrappe im Prüfbestand** — die Behauptung aus T-320 stimmt, selbst
  gemessen. Die Änderung ist rein additiv; `typecheck` ist über alle acht Pakete, alle sieben
  Prüfprojekte und e2e grün.
- Die Lehre vom 2026-09-12 ist eingehalten: T-320 (Umbau) und T-321 (Messung) liefen
  **hintereinander**, und der Prüfbestand steht gegen den Endstand — `test:coverage` ist mit 1873
  grünen Fällen durchgelaufen, kein vorbestehender Fall ist rot. Die vier angekündigten roten Fälle
  sind repariert, und nicht nur nachgezogen: `image-sweep.test.ts:761-780` und `:817-826` samt den
  beiden Geschwistern halten die Zeile jetzt gegen ein Muster mit benannter Gruppe, prüfen die
  **Gestalt** des Grundwerts gegen `REASON_SHAPE` und schließen `UNCLASSIFIED_REASON` ausdrücklich
  aus. Der letzte Punkt ist der wichtige: Er bezeugt, daß `reason=` als eigenes Feld durchkam und
  nicht die ganze Zeile am Riegel gescheitert ist — genau der Fehler, den der wörtliche Vorschlag
  aus T-318 gebaut hätte.
- **Die Menge, die `attachmentNamesOfKind` liefert, kann keine Löschung entscheiden.** Verfolgt:
  Sie fließt ausschließlich in `main.ts:383` in die Vereinigung von `attachmentNamesUnder`; dort
  bildet sie `expected` (`orphan-sweep.ts:396`), und `expected` speist ausschließlich `missing`
  (`:407`). `missing > 0` führt in `contradiction` und damit zu `removed: 0`. Größer heißt hier also
  ausschließlich: mehr Anlaß zu bremsen. Die Zusage im Portkopf („was er dabei findet, **bremst**
  ihn — es löscht nie") ist am Code nachgefahren und stimmt.
- Die Faltung bricht nirgends: `attachmentNamesOfKind` antwortet in
  `attachmentTargetFileName`-Faltung, `candidates` ist mit derselben Faltung verschlüsselt
  (`orphan-sweep.ts:353`), und `handleOf` prüft eine Gestalt aus Kleinbuchstaben. Zwei Faltungen
  wären zwei Antworten auf dieselbe Frage; es ist eine.
- Der gebundene `kind = ?` ist richtig und nicht nur sparsam: mit `node:sqlite` 3.51.3 gegen eine
  Tabelle mit dem partiellen Index `(target) WHERE kind = 'image'` gemessen — `image`, `file` und
  `link` liefern jeweils genau ihre Zeile. Die Angabe in `docs/datenmodell.md`, der Index trage
  diese Frage mit, habe ich am Abfrageplan geprüft und nicht beanstandet.

**2. `attachmentTargetNamesFile` ist verhaltensgeändert, und die Änderung ist in die verschonende
Richtung — bewiesen, nicht geglaubt.**

Die neue Fassung ist eine echte **Obermenge** der alten. Der einzige Weg, auf dem sie früher `true`
und heute `false` sagen könnte, wäre der neue Rückzug `if (name === '') return false` — er greift
nur, wenn `fileName` ausschließlich aus Punkten und Leerzeichen besteht. Dann sagte auch die alte
Fassung `false`: Ihr zweiter Zweig verglich gegen `attachmentTargetFileName(target)`, und dessen
Ergebnis läuft selbst durch `trimResolvedTail`, endet also nie auf `.` oder ` `. Der erste Zweig ist
unverändert und steht als erstes. Alles andere kommt hinzu. Die Richtung ist die, die der
Funktionskopf seit T-313 zusagt: im Zweifel `true`, im Zweifel verschonen.

`trimResolvedTail` ist ein reines Herausziehen — `effectiveNameSegment` ruft
`trimResolvedTail(lastNameSegment(path))` und ist damit zeichengleich zur vorigen Fassung. Die
Entscheidung, `fileName` **nicht** durch `attachmentTargetFileName` zu schicken, ist richtig und im
Kopf begründet: Sie hätte die zugesagte Eigenschaft „ein gesuchter Name mit Trenner wird
buchstäblich am Ende gesucht" gebrochen, und ein Prüffall mißt sie.

**3. Die Klasse der Löschpfade ist zu — die Menge habe ich selbst aufgespannt, nicht die Liste aus
T-320 nachgelesen.**

Eigene Suche über `removeImage|removeEmailFile|unlink|rm(|rmSync|removeFile` in
`apps/local-api/src`, `packages/storage/src`, `packages/domain/src`, `packages/export/src`, dazu
`attachmentBlobs\.` als zweite, unabhängige Achse. Ergebnis: **acht** Stellen, dieselben acht wie in
T-320, keine neunte.

| Stelle | Beurteilung |
|---|---|
| `attachments.ts:443/445` (`releaseUnclaimedBlobs`) | fragt weit, hinter dem `COMMIT` |
| `todos.ts:398` (`removeTodo`) | fragt über dieselbe Funktion, eine Frage für beide Arten |
| `image-sweep.ts:236`, `email-file-sweep.ts:208` | seit T-315 dieselbe weite Frage |
| `attachments.ts:288` (Rückbau nach gescheitertem `INSERT`) | ohne Frage, begründet |
| `email-attachments.ts:632`, `:693` | ohne Frage, begründet |
| `attachment-store.ts:465/553/723/886` | eigene `.tmp`-Dateien des Adapters |
| `file-port.ts:229/246`, `export.ts:423` | Exportordner, eigener Namensraum `.takt-*.tmp` |

Die drei „ohne Frage" tragen wirklich eine Eigenschaft und keine Bequemlichkeit — frischer
`randomUUID()`-Name, im selben Aufruf entstanden, nie eine Zeile —, und der Satz steht an allen drei
Stellen im Quelltext. Die Begründung, warum die Frage dort **schädlich** wäre (sie braucht den
Bestand, und zwei dieser Zweige laufen gerade deshalb, weil der Bestand sich verweigert hat), trägt
ebenfalls. **Und `data-transfer` löscht keine Anhangsdatei**: alle seine Zugriffe sind `read*`,
`restore*`, `listEmailFiles`, `emailFilePathOf` — geprüft, weil ein Einspielen der naheliegende Ort
für eine neunte Löschstelle gewesen wäre.

Was die Klasse künftig offen hält, ist nur noch der Satz im Quelltext. T-320 begründet, warum es
keinen Nachweislauf dafür gebaut hat — eine Menge über die Aufrufer von
`removeImage`/`removeEmailFile` sei „an der Route aufgespannt". **Dem widerspreche ich**, und das
gehört in den Bericht: Diese Menge ist an der Anforderung aufgespannt, nämlich an „keine Entfernung
ohne Eigentümerfrage", und sie ist mit dem Compiler meßbar — `caller-scan.mjs` tut für `request`
genau das. Blockierend ist es nicht (der Prüffall aus dem ersten Befund wiegt mehr), aber die
Begründung trägt nicht, und der nächste Auftrag sollte sie nicht erben.

**4. Verschluckte Fehler: keiner neu, einer weniger.** `catch {` in `orphan-sweep.ts` ist
`catch (error)` mit `reason=`; `errorKindValue` hält `error.message` draußen (dort steht bei
Dateisystem- und SQLite-Fehlern ein Pfad, T-132), faltet auf `[a-z0-9_]` und beschneidet auf 32
Zeichen — der Grund kann `REASON_SHAPE` also nicht mehr zerstören. Der Fehlschlag der
Eigentümerfrage wird **nicht** in die Antwort getragen (richtig: der Eintrag ist gelöscht) und ist
nicht still (`warn` mit Art und Zahl). Der neue Normalfall — Datei bleibt liegen, weil ein anderer
sie nennt — bekommt eine eigene `info`-Zeile, und das ist die richtige Entscheidung: Sonst wäre er
für niemanden sichtbar.

**5. Typsicherheit und Sprache.** Über den ganzen geänderten Produktivcode (`apps/local-api/src`,
`packages/domain/src`, `packages/storage/src`): kein `any`, keine Typzusicherung, kein
`@ts-expect-error`, kein `!`. Oberflächen- und Protokollsätze deutsch, Bezeichner englisch. Die
einzige Typzusicherung in diesem Commit steht in Prüfcode und ist oben gemeldet
(`file-port.test.ts:66`, `as never`).

**6. Dateihoheit.** Kein Verstoß. domain-dev hat in `packages/domain/src`, `packages/storage/src`,
`apps/local-api/src` (außer `routes/addin/`), `apps/local-api/scripts/`, `docs/architektur.md` und
`docs/datenmodell.md` geschrieben; unit-tester in `apps/*/test` und `packages/*/test`. `risks.md`
ist die Datei des Orchestrators.

**7. Der Versionswächter, was daran richtig ist.** Der teure Teil des Umbaus trägt, und ich habe ihn
nachgefahren und nicht übernommen: Die Menge wird beim Compiler erfragt
(`ts.readConfigFile` + `parseJsonConfigFileContent` + `createProgram`), der stumme Ausgang ist an
vier Stellen zu (unlesbare Konfiguration, Auswertungsfehler, weniger als 60 eigene Dateien,
`version.ts` fehlt im Programm), das Programm wird **einmal** aufgelöst und dreimal gefragt, und die
Vereinigung wird je Pfad einmal gelesen. Ich habe die 121 eigenen Dateien mit einem eigenen Skript
nachgezählt — dieselbe Zahl. `injection.erwartet instanceof RegExp` ist die richtige Reparatur (ein
Wächter, der abstürzt, sieht aus wie ein Werkzeugproblem und nicht wie ein Bestandsproblem), und der
Befundsatz von Zusage 2 sagt jetzt nur noch, was gemessen ist. Daß die Gegenprobe (α) nur das
**Erkennen** mißt und nicht das **Liefern**, steht ausgeschrieben in ihrem eigenen Kommentar — das
ist die Redlichkeit, die in T-296 fehlte. Der neue Prüfsatz über den Baum ist heute durch die Bauart
von `collectTree` erfüllt und wird als Nachstolperdraht deklariert, nicht als Messung; auch das
steht so da. Der Lauf zählt 76 statt 73, und die drei neuen Sätze sind die drei benannten.

---

## Urteil

**nicht freigegeben.**

Zwei Befunde blockieren, einer je Strang:

1. `apps/local-api/scripts/proof-release-safety.mjs:1442` — die Klasse ist von der
   Verzeichnisliste auf die Endungsliste umgezogen, nicht geschlossen. `.cts` ist mit `tsc` und
   Exit 0 gemessen: im Programm, Zusammenführung greift, beide Zusagen sehen die Datei nicht, und
   der neue Prüfsatz über den Baum bleibt dabei grün. Dies ist dieselbe Schwere, die T-318 dem
   gleichgelagerten B-1 gegeben hat, und aus demselben Grund: Der Lauf sichert eine Abwesenheit zu,
   die er nicht messen kann.
2. `apps/local-api/src/features/todos/attachments.ts:392` — die Behebung zweier `hoch`-Befunde über
   Datenverlust hat keinen Prüffall, die Abdeckungsschwelle kann sie strukturell nicht fangen, und
   die einzige Messung lag in einem Kratzverzeichnis und ist gelöscht.

Die Code**änderung** in Strang A ist inhaltlich richtig, soweit ich sie messen konnte — die weiteste
Frage steht an jeder löschenden Stelle, die enge behält ihre richtige Rolle als Kandidatenliste, die
drei Ausnahmen sind Eigenschaften und keine Bequemlichkeiten, und die Domänenregel ist Zeichen für
Zeichen weiter geworden. Sie blockiert nicht wegen ihres Inhalts, sondern weil nichts sie hält.

Nicht blockierend, aber in denselben Auftrag: `repo-attachments.ts:473` (null Abdeckung der neuen
Portmethode), `file-port.test.ts:66` (tautologische Zusicherung und `as never`),
`proof-release-safety.mjs:316` und `:68` (vier Oberflächen weiter an einer Verzeichnisliste; zwei
gemessene ungelesene Dateien; Kopf widerspricht der eigenen Gegenprobe), sowie die vier
`expect(match).not.toBeNull()`-Zeilen.

Offen bleibt außerdem ein Lauf: Fünf Nachweisläufe und `verify:bundle` sind an einem belegten Port
gescheitert und heißen deshalb **nicht gemessen**. Sie sind vor der Freigabe nachzuholen.
