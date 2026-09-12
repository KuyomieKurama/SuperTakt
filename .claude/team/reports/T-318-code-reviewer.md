# T-318 — Code-Review: die Läufe, die löschen (A) und der Versionswächter, fünfte Runde (B)

Aufgabe: T-318 — Strang A (T-314, T-315, T-317) und Strang B (T-296)
Stand: Zweig `feature/outlook-anhaenge-und-versionspruefung`, Spitze `4a52edc`
Urteil: **Strang A freigegeben** (mit einer Auflage an `risks.md`) — **Strang B Nacharbeit**

---

## Was ich gefahren habe, und was nicht

Einzeln gefahren, alle Exit 0 bzw. grün:

| Lauf | Ergebnis |
|---|---|
| `tsc -p apps/local-api/tsconfig.json --noEmit` | grün |
| `tsc -p packages/storage/tsconfig.json --noEmit`, `packages/domain` | grün |
| `tsc -p apps/local-api/tsconfig.test.json`, `packages/storage/tsconfig.test.json` | grün |
| `vitest run` über `orphan-sweep.test.ts`, `image-sweep.test.ts`, `email-file-sweep.test.ts` | **47/47** |
| `node apps/local-api/scripts/proof-release-safety.mjs` | **73 bestanden, 0 fehlgeschlagen** |
| eigene `tsc`-Messungen im Kratzverzeichnis (drei Projekte) | siehe B-1, B-2 |

**Nicht gefahren:** `pnpm check` als Ganzes, `proof:all`, `test:coverage`, `test:rust`, `build`,
`audit`, `test:e2e`. Nichts davon ist mir abgebrochen — ich habe es nach der Vorgabe des Auftrags
gar nicht erst gestartet. Wo unten eine Zahl steht, ist sie gemessen; wo eine Folgerung aus
gelesenem Code kommt, steht es dabei.

**Geschrieben habe ich ausschließlich diese Datei.** Meßkopien lagen im Kratzverzeichnis;
`git status` im Vorhaben ist unverändert.

---

# Strang A — der Lauf, der löscht

## Befunde

```
apps/local-api/src/features/todos/attachments.ts:341   hoch    `removeAttachment` entfernt die Datei allein an `kind`/`origin` der gelöschten Zeile und fragt nicht, ob eine ANDERE Zeile sie noch nennt. Genau der in T-314/T-315 gemessene vierte Weg — ein Anhang der Art `file` mit dem vollen Pfad einer Bildkopie kommt durch `checkAttachmentPath` (absolut, vorhanden, `.png`, kein UNC, keine Umleitungsendung) — führt hier zum Verlust: Der Benutzer entfernt Anhang A, die Datei fällt, Zeile B zeigt ins Leere. Fix: Die Blob-Entfernung steht hinter dem `COMMIT`, die gelöschte Zeile ist also bereits fort — deshalb genügt vor `removeEmailFile`/`removeImage` ein `attachmentsNamingFiles([name])` über dieselbe weite Domänenregel; eine nicht leere Antwort heißt „gehört noch jemandem" und die Datei bleibt liegen.
apps/local-api/src/features/todos/todos.ts:377         hoch    Dasselbe in `removeTodo`: `emailFileTargets(id)`/`imageTargets(id)` beantworten „wem gehört diese Datei" zum zweiten Mal und enger (an `origin`/`kind` und am Todo), und diese Antwort entscheidet eine Löschung. Löscht der Benutzer Todo A, verliert Todo B seinen Dateianhang auf dieselbe Kopie. Fix wie oben: nach dem `COMMIT` `attachmentsNamingFiles` über die Namen aus `outcome.value` fragen und nur entfernen, was danach niemand mehr nennt.
apps/local-api/src/features/todos/orphan-sweep.ts:420  mittel  Für den **Bildlauf** ist `claimed > owned` faktisch die einzige lebende Achse: `attachmentNamesUnder` antwortet dort im Regelfall leer (`target` trägt den bloßen Namen), also ist `missing` immer 0. Damit legt **eine einzige** Bildzeile ohne Datei — von Hand gelöscht, `restoreImage` einer Einspielung fehlgeschlagen, zwei Zeilen auf dieselbe Kopie — den Lauf dauerhaft still, mit einer `warn`-Zeile bei jedem Start und ohne für den Benutzer sichtbaren Grund. Richtung ist die billige, der Preis ist, daß der Lauf danach nie wieder aufräumt. Fix: dem Bildlauf die Gegenfrage geben, die dem anderen ihr Gewicht gibt — eine Portmethode „die bloßen Namen aller `kind='image'`-Zeilen", damit `missing` auch für namensförmige `target` rechenbar wird; dann trägt derselbe schärfere Vergleich (`missing > 0`) dort, wo heute nur eine Zahlendifferenz steht.
apps/local-api/src/features/todos/orphan-sweep.ts:440  niedrig `catch {` ohne Bindung: Der Grund des Abbruchs geht restlos verloren. Die beiden Stellen, die wirklich werfen (`imageCount`, `emailFileCount`), tragen einen genauen deutschen Satz, und der erreicht das Protokoll nie — übrig bleibt `…_unavailable files=N removed=M`. B-2.4 verbietet den Wert aus dem Bestand, nicht die Art des Fehlers. Fix: `catch (error)` und `reason=${error instanceof Error ? error.constructor.name : 'unknown'}` an die Zeile hängen; ein Klassenname trägt keinen Pfad.
packages/domain/src/attachment.ts:993                  niedrig Die Funktion ist in ihren beiden Argumenten unsymmetrisch: `target` wird über `attachmentTargetFileName` gefaltet **und** um nachgestellte Punkte/Leerzeichen gekürzt, `fileName` nur `asciiLower`. Ein liegender Name mit nachgestelltem Leerzeichen (auf POSIX möglich) fände seine Zeile nicht — heute unerreichbar, weil beide Läufe ausschließlich Namen der Form `^[0-9a-f]{32}…` übergeben. Fix: entweder `fileName` durch dieselbe Kürzung schicken oder die Vorbedingung („nur erzeugte Namen") im Kopf ausdrücklich zusagen, damit der nächste Aufrufer sie nicht bricht.
```

## Die vier Fragen des Auftrags, einzeln beantwortet

**1. Die Umkehr — ist die Eigentümerfrage wirklich die weiteste, und ist SQL wirklich weiter?**
Geprüft, und sie ist es. Ich habe jede Stelle gesucht, an der die Frage doch enger wird:

- `attachmentTargetNamesFile` (`packages/domain/src/attachment.ts:990`) fragt ohne `origin`, ohne
  `kind`, ohne Pfadform, ASCII-gefaltet, und nimmt zusätzlich jedes `endsWith` — weiter als
  „letzter Pfadbestandteil". Kein `trim`, keine Unicode-Normalisierung, kein `toLowerCase()`.
- Die SQL-Vorauswahl (`repo-attachments.ts:404`) ist `target LIKE '%name%' ESCAPE '\'`. Sie ist
  beweisbar weiter als die Entscheidung: Beide Zweige der Entscheidung (`endsWith` und der
  gekürzte letzte Bestandteil) setzen voraus, daß der Name als **Teilzeichenkette** im Ziel steht,
  und genau das trifft `LIKE '%…%'`. `escapeLike` nimmt `%`, `_` und `\` ihre Sonderbedeutung,
  macht das Muster also nur enger gegen Zufallstreffer, nie enger gegen echte Eigentümer.
- Die beiden Faltungen sind wirklich eine: `asciiLower` in der Domäne, ASCII-`LIKE` in SQLite.
  `PRAGMA case_sensitive_like` wird nirgends gesetzt (`CONNECTION_PRAGMAS`,
  `packages/storage/src/sqlite/database.ts:81`) — geprüft, nicht angenommen.
- **Unicode-Normalform ist hier strukturell keine Frage**, und das ist der Grund, warum die
  ASCII-Faltung genügt: `listImages`/`listEmailFiles` nennen ausschließlich Namen nach
  `GENERATED_NAME_SHAPE` bzw. `GENERATED_FILE_NAME_SHAPE` (`attachment-store.ts:169`, `:204`) —
  32 Hexziffern und eine Endung aus `[a-z0-9]`. Ein Name, der zwei Normalformen hätte, wird nie
  gefragt und nie entfernt.
- Der Schlüssel der Kandidatenkarte (`orphan-sweep.ts:359`) ist der gefaltete Name, gefragt und
  verglichen wird mit dem **rohen** (`:364`, `:368`), und `attachmentsNamingFiles` gibt
  nachweislich eine Teilmenge der übergebenen rohen Namen zurück (`owned.add(name)` über `block`,
  `repo-attachments.ts:410`). Keine Faltungslücke zwischen Frage und Antwort.

**2. Der Riegel auf zwei Achsen — stellt die zweite wirklich eine andere Frage?**
Ja. `claimedCount` zählt Zeilen über `kind`/`origin` und hängt als einzige gar nicht am `target`;
die Abfrage zählt Dateien über den Namen und ohne `kind`/`origin`. Die beiden Mengen können
einander widersprechen, und genau das war bei `known.size === 0` gegen `knownEmailFileTargets`
nicht möglich. Der alte Ausdruck ist im neuen enthalten (`owned === 0 ∧ claimed > 0` ⇒
`claimed > owned`) — nachgerechnet, nicht übernommen. Die Einschränkung steht oben als Befund
`orphan-sweep.ts:420`: Für den Bildlauf ist es die **einzige** wirksame Achse.

**3. Ein Verfahren, zwei Aufrufer — hat eine zweite Fassung überlebt?**
Im Aufräumpfad: nein. `image-sweep.ts` und `email-file-sweep.ts` tragen nur noch Werte (Ordner,
Liste, Entfernungswert, enge Zählung, Sätze) und kein einziges `if` über „welcher Ordner";
`knownImageTargets` ist im Port und im Adapter ersatzlos fort (nur noch als Begründung im
Kommentar). `grep` über `apps`, `packages`, `docs`, `tests`: keine zweite Umsetzung.
**Außerhalb des Aufräumpfads: ja** — das sind die beiden `hoch`-Befunde. `removeAttachment` und
`removeTodo` beantworten dieselbe Frage („nennt noch jemand diese Datei?") ein zweites Mal und
enger, und ihre Antwort entscheidet eine Löschung. Das ist wörtlich die Bauart, deren Wiederkehr
T-315 verhindern sollte, eine Tür weiter.

**4. Versuch, etwas zu löschen, das jemandem gehört.** Durchgespielt am heutigen Stand:

| Lage | Ergebnis |
|---|---|
| Pfad gegen Name (Zeile nennt den vollen Pfad einer Bildkopie) | Eigentümer gefunden, Datei bleibt |
| Groß-/Kleinschreibung auf beiden Seiten | eine Faltung, beide Seiten, Datei bleibt |
| Unicode-Normalform | unerreichbar (nur erzeugte Namen werden gelistet) |
| nachgestellter Punkt/Leerzeichen im `target` | von `effectiveNameSegment` erfaßt, Datei bleibt |
| Anhang der Art „Datei", der auf den Ordner zeigt | Eigentümer über `endsWith`; zusätzlich `attachmentNamesUnder` |
| zwei Zeilen auf dieselbe Datei | `claimed > owned` → `contradiction`, nichts fällt (Dauerzustand, s. Befund) |
| eine Zeile ohne Datei | dito |
| Ordner existiert nicht / `appDataDir === null` | `list()` leer → `read = 0`, stiller Rücktritt ohne Löschung |
| vierte Anhangsart im Bestand | `unknown_kinds` vor jedem Verzeichniszugriff |
| `claimedCount` wirft | Klammer, `unavailable`, nichts fällt |

**Dateihoheit:** geprüft. Die in T-314/T-315 genannten Artefakte liegen sämtlich in domain-dev
(`packages/domain`, `packages/storage`, `apps/local-api/**` außer `src/routes/addin/`,
`docs/architektur.md`, `docs/datenmodell.md`). Kein Verstoß.

**Typsicherheit:** kein `any`, keine Typzusicherung, kein `@ts-expect-error`, kein `!` in den drei
Aufräumdateien; `tsc` grün über Quellen **und** Prüfdateien.

## Urteil Strang A: **freigegeben**

Der geprüfte Umbau ist richtig: Die Eigentümerfrage ist die weiteste, die SQL-Vorauswahl ist
nachweisbar weiter als die Entscheidung, die zweite Achse stellt eine andere Frage, und die
Abschrift ist fort. Die beiden `hoch`-Befunde liegen **nicht** im Änderungsumfang von T-314/T-315
und blockieren deren Freigabe deshalb nicht.

**Auflage an den Orchestrator, und sie ist der wichtigste Satz dieses Strangs:**
**R-29 darf nicht als geschlossen eingetragen werden.** T-315 empfiehlt in Abschnitt 9 Punkt 3,
R-29 sei „für beide Ordner geschlossen". Für die **Aufräumläufe** stimmt das. Die Klasse — „eine
Datei entfernen, die eine andere Zeile noch nennt" — ist es nicht: Sie steht offen in
`removeAttachment` und `removeTodo`, über denselben Bedienweg, den T-314 als vierten Weg gemessen
hat, und dort sogar ohne Umweg über einen Startlauf. Vorschlag: R-29 bleibt offen mit dem Zusatz
„Aufräumläufe zu (T-314/T-315), Löschpfade offen (T-318)", und die beiden `hoch`-Befunde gehen
als ein Auftrag in die nächste Welle.

---

# Strang B — der Versionswächter, fünfte Runde

## Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:202   hoch    GEMESSENE UMGEHUNG. `SKIP_DIRECTORIES` überspringt `test`/`tests`/`__tests__` auf **jeder** Tiefe, also auch unterhalb eines Quellordners. `apps/local-api/tsconfig.json` hat `"include": ["src"]` und keinen `exclude`, `tsconfig.base.json` ebenfalls keinen — eine Datei unter `src/**/test/**` liegt damit im Übersetzungsprogramm und außerhalb des gelesenen Baums. Gemessen (eigenes Projekt, `moduleResolution: bundler`, `allowImportingTsExtensions`, `include: ["src"]`): `src/features/version/version.ts` mit nur `write`, daneben `src/features/version/test/augment.ts` mit `export {};` und `declare module '../version.ts' { interface VersionCheckStorePort { read(): Promise<string|null> } }` — `port.read()` übersetzt mit **Exit 0**. Zusage 1 sieht die Datei nicht (sie steht nicht in `files`), Zusage 2 auch nicht, Gestalt 5 ebenfalls nicht (kein Import). Damit ist ZZ-F nicht geschlossen, sondern ein Verzeichnis tiefer gezogen, und der Satz „die Klasse hat genau zwei Wege, und beide sind zu" trägt nicht. Fix: `test`, `tests`, `__tests__` aus `SKIP_DIRECTORIES` streichen — sie sind heute wirkungslos und kosten nur diese Lücke: Die sieben Prüfordner des Bestands (`apps/{desktop,local-api,outlook-addin,web}/test`, `packages/{domain,export,storage}/test`) sind sämtlich Geschwister von `src` und liegen ohnehin außerhalb jedes `SOURCE_ROOTS`-Laufs; gemessen mit `find … -type d -name test`. Dazu ein Verstoßeintrag, der die Erweiterung unter `apps/local-api/src/features/version/test/augment.ts` einsetzt, mit eigenem `erwartet`.
apps/local-api/scripts/proof-release-safety.mjs:1261  niedrig `findeZweiteDeklarationDesPorts` sammelt über `ts.forEachChild` **rekursiv** und meldet deshalb auch eine Deklaration im Rumpf einer Funktion oder in einem `namespace` mit Bezeichner als „deklariert `VersionCheckStorePort` ein zweites Mal — welche der beiden Deklarationen der Prüfer einsetzt, entscheidet eine Importzeile". Gemessen (Nachbau der Funktion, zeichengleich, im Kratzverzeichnis): beide Fälle `true`. Der zweite Halbsatz ist für einen Funktionsrumpf falsch — diese Deklaration ist nicht importierbar, und `tsc` führt beide Fälle nicht zusammen (von mir nachgemessen, s. u.). Das ist genau der Satz, den T-296 an `portMitglieder` zu Recht nicht schreiben wollte; hier steht er. Richtung ist die laute, deshalb niedrig. Fix: entweder die Sammlung auf das beschränken, was Modulsichtbarkeit hat (oberste Anweisungen plus `ModuleDeclaration`-Rümpfe), oder den Befundsatz auf das kürzen, was gemessen ist: „steht ein zweites Mal im Baum" ohne die Aussage über die Importzeile.
apps/local-api/scripts/proof-release-safety.mjs:2385  niedrig `injection.erwartet !== undefined && injection.erwartet.test(fund)` nimmt jeden nicht-`undefined`-Wert an; ein versehentliches `erwartet: 'text'` wirft mitten im Lauf, statt rot zu werden. Abschnitt 0 prüft an derselben Angabe bereits mit `instanceof RegExp` (`:2292`) — zwei Fassungen derselben Frage, drei Zeilen Abstand. Fix: hier dieselbe Prüfung: `injection.erwartet instanceof RegExp && injection.erwartet.test(fund)`.
apps/local-api/scripts/proof-release-safety.mjs:990    niedrig Die Aufzählung „Was dieser Wächter NICHT fängt" zählt den Bereich außerhalb des gelesenen Baums auf („jeder `scripts/`-Baum, `packages/ui-tokens/**`, `apps/web/public/**`, `packages/storage/migrations/**` ganz, dazu die Prüfordner und `dist/`") — und beides fehlt darin: `src/**/test/**` (der Befund darüber, und er liegt **im** Übersetzungsprogramm, anders als alles andere in der Liste) und `node_modules/@types/**`. Fix: beide Zeilen ergänzen, sobald B-1 gebaut ist; die Liste ist der Ort, an dem der nächste Prüfer nachsieht, bevor er eine Umgehung sucht.
```

## Die Begründung von domain-dev — **nachgemessen, nicht übernommen**

T-296 hat die vom code-reviewer (T-295) vorgeschlagene rekursive Sammlung in `portMitglieder`
ausdrücklich **nicht** gebaut, mit der Begründung, eine zweite Deklaration im Funktionsrumpf oder
in einem `namespace` mit Bezeichner werde von TypeScript nicht zusammengeführt. Ich habe das mit
`tsc` 5.9.3 in einem eigenen Projekt selbst gemessen:

| Stand | `tsc` |
|---|---|
| zweite `interface VersionCheckStorePort` im **Rumpf einer Funktion**, `port.read()` daneben | `TS2339: Property 'read' does not exist on type 'VersionCheckStorePort'` |
| zweite `interface VersionCheckStorePort` in `export namespace Extra { … }`, `port.read()` daneben | `TS2339` |

**Die Begründung hält.** Die rekursive Sammlung wäre an dieser Stelle ein falscher Satz gewesen;
die Entscheidung, statt dessen zwei Zusagen über den Baum zu stellen, ist richtig. Der
Vollständigkeitsschluß darüber — „was zusammengeführt wird, steht entweder ebenfalls oben oder in
einem Erweiterungsblock" — trägt ebenfalls, **für den gelesenen Baum**. Er trägt nur nicht für das,
was der Baum nicht enthält, und das ist B-1.

Geprüft und in Ordnung, jeweils am Code und nicht an der Zusage:

- `declare module '<Zeichenkette>'` und `declare global` werden über
  `ts.isStringLiteral(knoten.name)` bzw. `NodeFlags.GlobalAugmentation` unterschieden;
  `declare namespace Office` in `apps/outlook-addin/src/office/office-js.d.ts` bleibt zu Recht
  grün. `.d.ts` fällt unter `istTypescriptDatei` und unter `READ_EXTENSIONS` — geprüft.
- Der Vorfilter `ERWEITERUNGS_WORTE` läuft über `file.code` (`stripComments`, längentreu),
  entschieden wird am ungekürzten `file.source`. Kann nur zu viel auswählen. Richtig herum.
- Beide Zusagen kehren **vor** dem Lesen zurück (`:1316`, `:1318`) — erst die Frage, ob gemessen
  werden kann, dann die Messung.
- `erwartet` ist Pflicht in beide Richtungen: nicht getroffen bei fehlendem Wert (`:2385`) **und**
  eine eigene Zeile in Abschnitt 0 (`:2294`). Der stille Ausgang ist zu.
- Die beiden Hälften der Zählvorschrift stehen im Regelkörper (`:1439`), nicht unter den Ausnahmen.
- Die Untergrenze der Gestalt 2 ist auf das Gemessene zurückgeschnitten (`:1352` ff.): Sie ist
  gegen keinen Leser der Unterschied zwischen grün und rot, sie trennt zwei Befundsätze. Steht
  jetzt so da.
- **73 bestanden, 0 fehlgeschlagen** — selbst gefahren, die Zahl stimmt mit T-296 überein.

## Urteil Strang B: **Nacharbeit**

**Blockierend ist der Befund zu `proof-release-safety.mjs:202`**: eine gemessene Umgehung
derselben Klasse, die diese Runde schließen sollte. Der Wächter sagt zu, daß der
Zusammenführungsweg zu ist; er ist es für den Baum, den der Wächter liest, und der Baum ist
kleiner als das Übersetzungsprogramm. Das ist derselbe Fehler wie in E-099 Punkt 3, eine Ebene
tiefer: Die Menge ist an dem aufgespannt, was der Lauf zu lesen gewohnt ist, nicht an dem, was der
Compiler sieht.

Die drei `niedrig`-Befunde sind nicht blockierend und gehören in denselben Auftrag.

Eine Bemerkung zur Wahl des Fixes: Die sauberste Fassung wäre, Zusage 1 und 2 über die
**Dateiliste des Übersetzungsprogramms** zu stellen (`ts.parseJsonConfigFileContent` über
`apps/local-api/tsconfig.json`) statt über den selbstgelaufenen Baum — dann ist die Menge an der
Anforderung aufgespannt und nicht an einer Verzeichnisliste. Die billige Fassung (drei Namen aus
`SKIP_DIRECTORIES` streichen) schließt die heute gemessene Tür und kostet nichts; sie läßt aber
offen, was ein künftiges `include` dazunimmt. Welche der beiden gebaut wird, ist eine Entscheidung
des Orchestrators, keine des Prüfers — beide brauchen den neuen Verstoßeintrag.
