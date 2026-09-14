# T-327 — `proof:release-safety` mißt die Verdrahtung, nicht den Namen

Aufgabe: T-327 — `proof:release-safety` mißt die Verdrahtung
Gegenstand: `apps/local-api/scripts/proof-release-safety.mjs`, Zweig
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e`
Status: **fertig** (braucht Review)

Geschrieben habe ich genau zwei Dateien: den Wächter und diesen Bericht. `git status` nennt
daneben Änderungen von T-326 (`apps/web/**`), T-328 (`*/test/**`) und dem Orchestrator
(`board.md`, `decisions.md`, `risks.md`, `docs/bedrohungsmodell.md`) — die sind nicht meine.
Meßkopien liegen im Kratzverzeichnis; drei Meßhilfen, die ich vorübergehend unter
`apps/local-api/scripts/.tmp-*.mjs` gebraucht habe, sind gelöscht.

---

## 1 — Läufe, jeder mit Ergebnis und Zahl

Alle am 2026-09-13, Linux, node 22.23.2, TypeScript 5.9.3 (der des Vorhabens).

| Lauf | Ergebnis |
|---|---|
| `node apps/local-api/scripts/proof-release-safety.mjs` **vor** dem Umbau (HEAD) | **76 bestanden, 0 fehlgeschlagen**, 1,6 s |
| dasselbe **nach dem Umbau des Baums allein** (sieben Programme, Art vom Compiler, `.cts`/`.cjs`) | **83 bestanden, 0 fehlgeschlagen** |
| dasselbe **fertig** (mit Gestalt 6 und allen Gegenproben) | **106 bestanden, 0 fehlgeschlagen**, 4,6 s |
| `pnpm run proof:release-safety` | **106 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:layers` | 36 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:callers` | 74 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:route-policy` | 48 bestanden, 0 fehlgeschlagen |
| `node --check` über den Wächter | ohne Befund |
| `pnpm typecheck` | **rot — und nicht an meiner Arbeit**, siehe unten |
| eigene Messung M-1: die sieben Übersetzungsprogramme gegen den gelesenen Baum | **3 Dateien im Programm und ungelesen** |
| eigene Messung M-2: gelaufene TypeScript-Dateien ohne Programm | **0 von 336** |
| eigene Messung M-3: `.cts`-Erweiterung, alter und neuer Wächter | alt **76/0 grün**, neu **92/14 rot** |
| eigene Messung M-4: der Ausschalter aus T-325 B-2, wortgleich | alt **76/0 grün**, neu **105/1 rot** |
| eigene Messung M-5: derselbe Ausschalter **ohne Datenbankmarke** in der Verdrahtung | alt **76/0 grün**, neu **105/1 rot** |
| eigene Messung M-6: `start()` in einer Bedingung | alt **76/0 grün**, neu **105/1 rot** |

**`pnpm typecheck`:** Sieben von acht Paketen sind `Done`, darunter `@takt/local-api`,
`@takt/domain`, `@takt/storage`, `@takt/export`, `@takt/desktop`, `@takt/outlook-addin`. Der eine
Fehler ist `apps/web/src/features/todos/TodoListScreen.tsx(405,9): error TS6133: 'listIsEmpty' is
declared but its value is never read`. Er gehört **T-326** (frontend-dev), läuft parallel und ist
unfertig: `git show HEAD:apps/web/src/features/todos/TodoListScreen.tsx | grep -c listIsEmpty`
ergibt **0**, die Zeile ist in der Arbeitskopie hinzugefügt. Ich habe sie nicht angefaßt und nichts
daran repariert (fremde Hoheit, und gegen einen Zwischenstand zu prüfen ist schlimmer als eine
Lücke — die Lehre vom 2026-09-12). **Mein Anteil ist typfehlerfrei**; die Zusage der Definition of
Done „`pnpm typecheck` fehlerfrei" ist erst nach T-326 als Ganzes nachweisbar.

**Nicht gefahren:** `pnpm check` als Ganzes, `test:coverage`, `test:rust`, `build`, `audit`,
`verify:bundle`, `contrast`, `boundaries`, `test:e2e`, `proof:engines` und die portgebundenen
Nachweisläufe (`proof:access`, `conflicts`, `tags`, `export-api`, `addin-wiring`). Auf
`127.0.0.1:17843/17844` läuft die Anwendung des Benutzers; ich habe sie nicht angefaßt. Diese Läufe
heißen damit **nicht gemessen**, nicht grün. Keiner von ihnen liest die Datei, die ich geändert
habe.

**Eine Umgebungsfeinheit der Meßkopien, damit sie niemand für einen Befund hält:** In einer
Kopie über `git archive` zeigen die `node_modules`-Verweise auf das echte Vorhaben. Das Programm
von `@takt/desktop` löst `@takt/local-api/src/main.ts` dann **außerhalb** der Kopiewurzel auf, und
seine eigenen Dateien fallen unter die Untergrenze — der Wächter bricht richtigerweise mit
„Übersetzungsprogramm @takt/desktop messen" ab. Für die Messungen M-3 bis M-6 habe ich in der
Kopie genau diese eine Untergrenze auf 1 gesetzt. Im echten Baum und im CI (dort legt
`pnpm install` die Verweise innerhalb des Auszugs) sind es **124** Dateien.

---

## 2 — Was gebaut ist, Punkt für Punkt

### Punkt 1 — die Dateimenge kommt vom Programm, nicht von einer Endungsliste

Zwei Änderungen, und die zweite ist die tragende.

**(a) Sieben Programme statt einem.** `PROGRAM_CONFIG` (nur `@takt/local-api`) ist
`PROGRAM_CONFIGS` geworden: alle sieben Paketkonfigurationen, jede mit eigener Untergrenze, jede
mit demselben lauten Ausgang bei unlesbarer oder halb aufgelöster Konfiguration. Damit hängt der
Baum für **keine** Oberfläche mehr an einer Verzeichnisliste — das war T-324 zu Zeile 316.

Gemessen (M-1, eigenes Skript, `parseJsonConfigFileContent` + `createProgram` je Konfiguration,
danach gegen den gelaufenen Baum gehalten):

| Programm | eigene Dateien | ungelesen |
|---|---|---|
| `@takt/local-api` | 121 | 0 |
| `@takt/web` | 196 | **1** — `apps/web/vite.config.ts` |
| `@takt/desktop` | 124 | **1** — `apps/desktop/sidecar/entry.ts` |
| `@takt/outlook-addin` | 65 | **1** — `apps/outlook-addin/vite.config.ts` |
| `@takt/domain` | 22 | 0 |
| `@takt/storage` | 47 | 0 |
| `@takt/export` | 11 | 0 |
| Vereinigung | 339 | 3 |

**`apps/desktop/sidecar/entry.ts` steht in keinem der beiden Berichte.** Sie ist die schwerste der
drei: der Einstiegspunkt, aus dem die **ausgelieferte Sidecar-Binärdatei** entsteht, und sie ruft
`main()` des Dienstes. Eine Adresse, ein `fetch`, ein Öffnen-Befehl dort wäre Laufzeitcode im
Erzeugnis, und dieser Lauf hat die Datei nie gesehen. Alle drei sind jetzt in der gelesenen Menge
(Punkt 5 der Aufgabe, gelöst durch Aufnehmen statt durch einen Lückeneintrag — die beiden
Vite-Konfigurationen stehen wörtlich in `"include"` ihrer Pakete, aufnehmen kostet also nichts).

**(b) Die Art einer Datei kommt vom Compiler.** `istTypescriptDatei` — drei Endungen, `.cts`
fehlte — ist gestrichen. An ihrer Stelle steht `traegtTypescript` über
`ts.getScriptKindFromFileName`, denselben Schritt, mit dem der Compiler selbst entscheidet.
`.cts`, `.d.cts`, `.mts` und `.d.ts` sind damit TypeScript, `.json` und `.rs` nicht. **Kein stiller
Rückfall:** Fehlt die Funktion in einer künftigen TypeScript-Fassung, ist das ein Abbruch mit
Namen, keine Endungsliste im `catch`. Sieben Zeilen in Abschnitt 0 nageln die Einordnung fest, damit
niemand sie zurückbaut.

`.cts` und `.cjs` stehen zusätzlich in `READ_EXTENSIONS`. Die Liste bestimmt jetzt nur noch die
**nicht-TypeScript-Hälfte** des Baums (Rust, TOML, JSON, HTML — die kann kein Programm liefern) und
den Fall einer TypeScript-Datei, die in **keinem** Programm liegt. Letzteres ist heute leer:
gemessen **336 gelaufene TypeScript-Dateien, davon 0 außerhalb aller sieben Programme** (M-2).

**Die Lücke, zweiseitig gemessen (M-3).** In einer Kopie des Zweigs, `tsc` des Vorhabens,
`apps/local-api/tsconfig.json` unverändert:

```
apps/local-api/src/features/version/augment.cts
  export {};
  declare module './version.ts' {
    interface VersionCheckStorePort { read?(): Promise<string | null> }
  }
```

- Die Datei liegt **im Programm** (mit `createProgram` nachgesehen, nicht angenommen).
- `port.read?.()` übersetzt, **`tsc --noEmit` gibt 0 zurück**.
- **Ohne** die neue Regel: **76 bestanden, 0 fehlgeschlagen** — unbemerkt.
- **Mit** ihr: **92 bestanden, 14 fehlgeschlagen**, und Abschnitt 2 nennt die Datei beim Namen.

**Eine Verfeinerung gegenüber T-324, und sie gehört in den Auftrag der nächsten Runde:** Mit einem
**pflichtigen** `read()` bricht nicht dieser Lauf, sondern `composition.ts` mit `TS2379` — der dort
gebaute Store hat kein `read`. Die Umgehung, die wirklich gebaut würde, ist deshalb die
**optionale**, und genau die steht jetzt in der Gegenprobe (β). Ein Wächter, dessen Gegenprobe nur
die pflichtige Form kennt, mißt eine Umgehung, die niemand baut.

*(Zu den 14 roten Prüfsätzen in M-3: dreizehn davon sind Gegenproben zu Gestalt 2, die ihre eigene
Lücke nicht mehr erreichen, weil `pruefeGestaltDesPorts` beim Erweiterungsblock **vorher** mit dem
Meßfehlschlag zurückkehrt — „erst die Frage, ob gemessen werden kann, dann die Messung". Das ist die
gewollte Reihenfolge und kein Nebenschaden; bei α verhält sich der Lauf seit T-320 genauso.)*

### Punkt 2 — die Gegenprobe β, mit eigenem `erwartet`

β steht **neben** α und nicht statt ihr: `apps/local-api/src/features/version/augment.cts` mit dem
optionalen `read?`. Der Grund, warum zwei Einträge auf denselben Befundsatz zeigen dürfen, ist der
aus der Zählvorschrift — eine **plausible schwächere Umsetzung** würde sie trennen. Hier ist die
schwächere Umsetzung nicht plausibel, sondern **gemessen**: Bis heute entschied eine
handgeschriebene Aufzählung, α war dabei grün und β unsichtbar. Dieselbe Bauart wie die vier
Schreibweisen von `fetch` (T-143) und die drei Erweiterungsblöcke (T-296).

### Punkt 3 — A-A-105: die sechste Gestalt an der Verdrahtung

Nicht ein sechster Name. Vier Sätze über die Frage **welcher Wert entscheidet über die ausgehende
Anfrage, und woher kommt er**, alle am gelesenen Baum und alle mit dem Compiler gelesen:

- **6a — wer das Prüfmodul in die Hand bekommt.** Eine Erlaubnisliste je Datei, mit den
  **exportierten** Namen: `composition.ts` → `createVersionChecker`, `VersionChecker`;
  `main.ts` → `VERSION_CHECK_START_DELAY_MS`; `app.ts` → `VersionCheckState`. Beide Richtungen. Ein
  Alias (`import { createVersionChecker as bauen }`) ändert nichts, weil der exportierte Name
  gemessen wird und der Leser den lokalen mitnimmt; eine Namensraumeinfuhr trägt den Namen `*` und
  steht in keiner Liste.
- **6b — was im Aufrufobjekt steht.** Vier festgenagelte Schlüssel mit festgenagelter Wertform:
  `logger` und `now` ein Bezeichner, `source` ein Bezeichner oder ein Feld der Aufrufoptionen,
  `store` ein Objektliteral. `startDelayMs`, `intervalMs`, `minIntervalMs` und `random` sind
  **nicht** darin, obwohl sie an `VersionCheckerOptions` stehen — sie gehören den Prüffällen, und
  die Prüfordner liegen außerhalb des gelesenen Baums. Eine Streuung liest der Leser nur als
  Objektliteral oder als Bedingung über zweien; alles andere ist ein **Meßfehlschlag** und kein
  leerer Fund.
- **6c — `start()` genau einmal, gerufen, unbedingt.** Der Name des Feldes steht **nicht** im
  Wächter: Er wird in der Verdrahtungsdatei aus dem Mitglied gelesen, dessen Typ der eingeführte
  `VersionChecker` ist. Gemessen werden: genau ein `start()` und genau ein `stop()`, `start` wird
  gerufen und nicht als Wert weitergereicht, kein `?.`, keine Verzweigung darüber, keine
  verschachtelte Funktion, und am Prüfer wird nichts außer `start` und `stop` gerufen.
- **6d — keine Datenbankmarke in der Verdrahtung.** Die fünf Marken aus `DATABASE_MARKERS` in einer
  Datei, die den Prüfer baut, oder in der Startdatei. Heute **0 von 5 in beiden Dateien**,
  gemessen — (c) aus T-325 ist also baubar; daß sie allein nicht trägt, ist unten gemessen.

**Beidseitig gemessen, dreimal, jedesmal mit `tsc` Exit 0:**

| Ausschalter | `tsc` | **ohne** die neue Regel | **mit** ihr |
|---|---|---|---|
| M-4: wortgleich aus T-325 B-2 — `SELECT locale FROM app_setting` in `composition.ts`, `startDelayMs`/`intervalMs` ≈ 24 Tage, über `...tempo` eingestreut | Exit 0 | **76/0 grün** | **105/1 rot**, vier Befunde aus **zwei** unabhängigen Zweigen: 6b („streut Identifier ein" — die Schlüsselmenge ist nicht meßbar) und 3× 6d |
| M-5: derselbe Ausschalter, lesender Teil in `features/settings/tempo.ts`, in der Verdrahtung nur `startDelayMs: abschaltung(database)` — **keine Marke** | Exit 0 | **76/0 grün** | **105/1 rot**, genau **ein** Befund: 6b „trägt den Schlüssel `startDelayMs`". 6d ist dabei **grün** |
| M-6: `if (database !== null) { versionCheck.start(); }` in `main.ts` | Exit 0 | **76/0 grün** | **105/1 rot**: 6c „`start()` steht nicht unbedingt im Rumpf der Startfunktion — in einer Bedingung (IfStatement)" |

M-5 ist die Antwort auf die Frage des security-checkers, welcher Teil von A-A-105 trägt: **(a)
trägt, (c) allein nicht** — gemessen und nicht geschlossen. M-4 zeigt dazu etwas, das im Vorschlag
nicht stand: Der Ausschalter, der wirklich gebaut würde, reicht seine Optionen als **Streuung aus
einer Variablen** herein, und ein Leser, der nur Schlüsselnamen zählt, wäre daran blind. Deshalb ist
die unlesbare Streuung ein eigener Befundsatz und nicht ein Durchlassen.

### Punkt 4 — Kopf b und die Lückenliste

- **Kopf b)** sagt nicht länger, Prüfordner dürften Adressen nennen. Er sagt jetzt, was gemessen
  ist: Die **sieben Prüfordner neben** einer Quellwurzel liegen in keinem der sieben Programme und
  dürfen alles nennen; ein Prüfordner **unter** einer Quellwurzel liegt im Programm und wird
  gelesen. Der Grund dafür ist seit T-327 kein Ortsargument mehr, sondern ein Argument über das
  Programm: **Eine Deklarationszusammenführung wirkt nur innerhalb eines Programms, und ein
  Prüfprogramm (`tsconfig.test.json`) ist nicht das Programm des Erzeugnisses.** Damit widerspricht
  der Kopf der Gegenprobe α nicht mehr, und wer ihn liest, trägt `test` nicht wieder in
  `SKIP_DIRECTORIES` ein.
- **Die Lückenliste** bei `checkNoStoreReadback` nennt die sieben Programme, die drei neu gelesenen
  Dateien und die Prüfprogramme als benannte Ausnahme mit Grund. Was draußen bleibt, ist unverändert
  benannt: `scripts/`, `node_modules/**` samt `@types`, `packages/ui-tokens/**`,
  `apps/web/public/**`, die `.sql` unter `packages/storage/migrations/**`, `dist/`.
- Der Satz „eine neue **optionale** Option bliebe ungesetzt und grün" steht weiter da — er sagt, was
  ein **Prüffall** nicht kann, und das bleibt wahr. Daneben steht jetzt, daß genau diese Option seit
  T-327 an der **Verdrahtung** gemessen wird.

### Punkt 5 — die beiden `vite.config.ts`

Aufgenommen, nicht als Lücke vermerkt — samt der dritten, die niemand genannt hatte
(`apps/desktop/sidecar/entry.ts`). Alle drei laufen jetzt durch **alle sieben** Prüfungen, nicht nur
durch die beiden Zusagen über den Baum. Ein `define` oder `proxy` mit einer Adresse dort wird damit
zum Befund, so wie er es im Webbündel wäre.

---

## 3 — Der Kausalnachweis: zwei Zahlen, getrennt

| Schritt | Prüfsätze | Einträge mit eingesetztem Verstoß | Befunde am echten Baum |
|---|---|---|---|
| HEAD (vorher) | 76 | 49 | **0** |
| **nur** der Umbau (sieben Programme, Art vom Compiler, `.cts`/`.cjs`) | 83 (+7) | **49 (+0)** | **0** |
| dazu Gestalt 6 und β | 106 (+23) | **72 (+23)** | **0** |

**Durch den Umbau allein steigt die Zahl der Verstoßeinträge um null**, und der echte Baum
bleibt ohne Befund — obwohl die gelesene Menge um drei Dateien und 339 Programmdateien gewachsen
ist (Baum 357 → 360 Pfade; die 361 im letzten Lauf enthalten eine neue Datei von T-326). Die +7
Prüfsätze des Umbaus sind ausschließlich die Sätze über die **Art** einer Datei, also der Wächter
über den neuen Leser.

Die +23 Einträge sind die Gegenproben: einer für die `.cts` (β) und zweiundzwanzig für die sechste
Gestalt. Zwanzig unterscheidbare Befundsätze, zweiundzwanzig Einträge — die zwei Mehrfachen sind
begründet: `start()` steht auf drei unterscheidbaren Gründen nicht unbedingt im Rumpf (Bedingung,
verschachtelte Funktion, Optionsverkettung), und jeder davon ist eine eigene plausible Umsetzung
derselben Abschaltung. Jeder Eintrag trägt ein eigenes `erwartet`; keine zwei `erwartet` der neuen
Einträge treffen denselben Satz.

**Daß der Leser nicht blind ist, bezeugt der grüne Lauf selbst** — und das ist Absicht: Die
Untergrenzen von 6a bis 6c werden rot, wenn der Leser **nichts** findet (kein Aufruf, kein
festgenagelter Schlüssel, kein `start()`, kein Feld mit dem Typ des Prüfers). 106/0 heißt damit
nicht „nichts gefunden", sondern „genau eine Verdrahtung gefunden, mit vier Schlüsseln, einem
`start()` und einem `stop()`".

---

## 4 — Was ich entschieden habe, ohne zu fragen

1. **Kein Typprüfer, nur der Syntaxbaum.** Gestalt 6 löst keine Typen auf. Der Grund ist die
   Gegenprobe: Die Einträge in Abschnitt 1 setzen Dateien in einen **erfundenen** Baum, und ein
   echtes `ts.Program` über einen erfundenen Baum bräuchte einen eigenen Compilerwirt und je Eintrag
   rund 1,3 s (gemessen: `createProgram` 522 ms, `getTypeChecker` 181 ms, alle Aufrufziele auflösen
   597 ms). Ein Wächter, dessen Gegenproben zu teuer zum Fahren sind, ist der nächste ungemessene
   Zweig. Statt dessen: die Verdrahtungsdateien sind **festgenagelt**, und innerhalb einer
   festgenagelten Datei ist die Auflösung eines Importalias syntaktisch vollständig.
2. **Erlaubnislisten statt Verbote**, mit beiden Richtungen und mit dem bekannten Preis: Ein Umzug
   von `composition.ts` oder `main.ts`, eine Umbenennung des Feldes und ein **vierter** Leser des
   Prüfmoduls machen den Lauf rot, auch wenn kein Fehler vorliegt. Das ist bezahlt und steht im
   Quelltext (E-103 gegengelesen).
3. **`stop()` genau einmal.** Der Vorschlag A-A-105 nennt es nicht. Ein zweites `stop()` ist die
   billigste Abschaltung, die es gibt — ein Aufruf direkt nach `start()` —, und die Zusicherung
   kostet eine Zeile.
4. **`start()` darf höchstens eine Funktionsebene tief stehen.** Sonst wäre
   `const los = () => versionCheck.start();` ein unbedingter Aufruf für diesen Leser. Was daran
   nicht gemessen ist — ob `main()` selbst gerufen wird —, steht als Lücke im Kopf.
5. **Die Untergrenzen der sieben Programme sind rund die Hälfte des heutigen Standes**, dieselbe
   Vorschrift wie bei den Quellordnern. Sie sollen rot werden, wenn eine Auflösung zusammenbricht,
   nicht wenn jemand aufräumt.
6. **Die Prüfprogramme bleiben draußen**, und zwar mit dem Programmargument statt mit dem
   Ortsargument. Sie zu lesen hieße, jeden `tag_name` einer Nachbildung als Befund zu zählen.

---

## 5 — Risiken, einschließlich Sicherheitshinweisen

- **Die Fläche ist gewachsen, und damit die Zahl der roten Fenster.** Drei neue Dateien laufen
  jetzt durch alle sieben Prüfungen; `apps/web/vite.config.ts` nennt `127.0.0.1` in `server` und
  `preview` und ist damit heute unauffällig, weil keine der sieben Prüfungen nach dieser Adresse
  fragt. Wer dort eine Adresse auf `github.com` oder eine Marke aus `DOWNLOAD_MARKERS` einträgt,
  wird rot — gewollt.
- **Der Lauf kostet dreimal so lange** (1,6 s → 4,6 s). In `proof:all` ist das der 18. von 22
  Läufen; drei Sekunden.
- **Gestalt 6 mißt Quelltext, nicht Verhalten.** Ein Ausschalter, der den Prüfer durch eine dritte
  Funktion schickt, oder eine Uhr, die aus dem Bestand gestellt wird, ist nicht gefangen. Beide
  Lücken stehen ausgeschrieben im Kopf von `VERSION_MODULE_CONSUMERS`. Was sie eng hält, ist 6a: Wer
  den Prüfer **baut**, steht in einer Liste von einer Datei, und die Liste hat beide Richtungen.
- **`node_modules/**` bleibt die letzte Lücke innerhalb der Programme.** Eine
  Deklarationserweiterung aus einem Fremdpaket wirkt im selben Programm und wird hier nicht
  gefangen; die Abwehr sind die Sperrdatei und `pnpm audit`. Unverändert gegenüber T-320, jetzt in
  der Lückenliste benannt.
- **Kein Sicherheitsbefund am Bestand.** `apps/local-api/src` war und ist an dieser Stelle sauber:
  ein Aufruf, vier Schlüssel, ein unbedingtes `start()`, ein `stop()`, keine Datenbankmarke in
  `composition.ts` oder `main.ts` (0 von 5, gemessen). Gebaut ist der Wächter darüber, nicht eine
  Behebung.

---

## 6 — Offene Fragen an den Orchestrator

1. **R-30 in `risks.md`** kann geschlossen werden, sobald diese Arbeit durch das Qualitätstor ist.
   Vorschlag, wörtlich anzuhängen: *„Geschlossen am 2026-09-13 (T-327). `proof:release-safety` mißt
   die Verdrahtung als sechste Gestalt: die Einfuhrliste des Prüfmoduls, die Schlüssel und
   Wertformen des Aufrufobjekts, `start()` genau einmal und unbedingt, und keine Datenbankmarke in
   der Verdrahtung. Der in T-325 gemessene Ausschalter ist beidseitig nachgefahren — ohne die Regel
   76/0 grün, mit ihr 105/1 rot —, und zwar in zwei Gestalten: mit Marke in der Verdrahtung (zwei
   unabhängige Zweige) und ohne (nur der Schlüsselzweig). Der Lauf steht bei 106/0."*
2. **A-A-105 im Bedrohungsmodell** (Abschnitt 41, Datei des security-checkers) ist damit gebaut —
   mit einer Berichtigung, die dort hingehört: **(c) ist baubar** (0 von 5 Marken in
   `composition.ts` und `main.ts`, gemessen) und **trägt allein nicht** (M-5, gemessen). Bitte an
   den security-checker weitergeben; ich fasse die Datei nicht an.
3. **T-324, Strang B ist damit beantwortet** — `:1442` (`.cts`), `:316` (vier Oberflächen an einer
   Verzeichnisliste, drei ungelesene Dateien) und `:68` (Kopf b) sind gebaut und gemessen. Die
   übrigen Befunde von T-324 und T-325 liegen **nicht** in meiner Hoheit dieses Auftrags und sind
   unberührt: der fehlende Prüffall für `releaseUnclaimedBlobs` und `attachmentNamesOfKind`
   (T-328, unit-tester), `file-port.test.ts:66`, sowie A-A-102 bis A-A-104 (`packages/storage/src`,
   `packages/domain/src` — ein eigener Auftrag).
4. **`pnpm typecheck` ist derzeit rot durch T-326** (`TodoListScreen.tsx`, `listIsEmpty` ungenutzt).
   Das blockiert die Torfahrt der ganzen Welle, nicht nur meine. Bitte in derselben Welle einsammeln.
5. **Keine Änderung an `package.json` nötig.** `proof:release-safety` ist eingetragen, die
   Reihenfolge in `proof:all` bleibt, kein neues Skript. Ich schlage ausdrücklich **nichts** vor.
6. **Eine Frage zur Untergrenze von `@takt/desktop`:** Sie ist auf 60 gesetzt und setzt voraus, daß
   die Arbeitsbereichsverweise **innerhalb** des Auszugs liegen (so im echten Baum und nach
   `pnpm install` im CI). In einem Auszug mit fremden `node_modules` bricht der Lauf mit Namen ab.
   Ich halte das für richtig — ein Programm, das den Dienst außerhalb der Wurzel auflöst, liest
   dessen Dateien nicht —, aber wenn `pruefung.yml` je ohne `pnpm install` fährt, ist es ein rotes
   Fenster.

---

## 7 — Nächster Schritt

Freigaberunde über diese Datei: code-reviewer gegen die Zählvorschrift (zwanzig Sätze,
zweiundzwanzig Einträge, drei Gründe an einem Satz) und gegen die drei zweiseitigen Messungen;
security-checker gegen A-A-105 und die Berichtigung an (c). Danach R-30 schließen.

Für die Welle danach, aus dieser Arbeit entstanden und **nicht** hier gebaut: Die Gegenprobe zur
`.cts` hat gezeigt, daß eine Erweiterung mit einem **pflichtigen** Mitglied am Bestand scheitert und
nur die optionale durchkommt. Dieselbe Frage steht an den drei anderen Ports dieses Bestands, die
ein Wächter über **eine** Deklaration mißt — ob dort eine optionale Erweiterung ebenso durchkäme, ist
gemessen für `VersionCheckStorePort` und für keinen zweiten.

---

## Kurzfassung

Aufgabe: T-327 — proof:release-safety mißt die Verdrahtung
Status: fertig
Artefakte: `apps/local-api/scripts/proof-release-safety.mjs`,
`.claude/team/reports/T-327-domain-dev.md`
Zusammenfassung: Der Baum kommt jetzt aus **sieben** Übersetzungsprogrammen statt aus einem, und die
Frage „trägt diese Datei TypeScript" beantwortet der Compiler statt einer handgeschriebenen
Endungsliste — damit ist die `.cts`-Umgehung zu, und drei Dateien, die gemessen im Programm lagen und
nie gelesen wurden, sind darin, darunter der Einstiegspunkt der ausgelieferten Sidecar-Binärdatei,
den kein Bericht genannt hatte. Die sechste Gestalt mißt die **Verdrahtung**: wer das Prüfmodul
einführt, welche Schlüssel und Wertformen das Aufrufobjekt trägt, daß `start()` genau einmal gerufen
und unbedingt steht, und daß keine Datenbankmarke in der Verdrahtung liegt. Der in T-325 gemessene
Ausschalter ist dreifach beidseitig nachgefahren: ohne die Regel jeweils 76/0 grün, mit ihr 105/1
rot, `tsc` jedesmal Exit 0. Der Kausalnachweis ist getrennt: der Umbau des Baums allein bringt **null**
neue Verstoßeinträge und **null** Befunde, die Gegenproben bringen +23; der Lauf steht bei 106/0.
Annahmen: kein Typprüfer (Gegenproben müssen fahrbar bleiben, Begründung mit Zahlen im Bericht);
Erlaubnislisten mit beiden Richtungen und ihrem Preis; `stop()` genau einmal und `start()` höchstens
eine Funktionsebene tief, beides über A-A-105 hinaus; Prüfprogramme bleiben draußen, jetzt mit dem
Programmargument statt dem Ortsargument.
Risiken: Der Lauf kostet 1,6 s → 4,6 s. Gestalt 6 liest Quelltext, nicht Verhalten — ein Prüfer, der
durch eine dritte Funktion wandert, und eine aus dem Bestand gestellte Uhr sind nicht gefangen und
im Kopf benannt. `node_modules/**` bleibt die letzte Lücke innerhalb der Programme. Am Bestand selbst
kein Sicherheitsbefund; gebaut ist der Wächter, nicht eine Behebung.
Offene Fragen: (1) R-30 schließen, Wortlaut liegt vor. (2) A-A-105 im Bedrohungsmodell als gebaut
vermerken, mit der Berichtigung, daß (c) baubar ist und allein nicht trägt — Datei des
security-checkers. (3) `pnpm typecheck` ist derzeit rot durch eine unfertige Zeile von T-326
(`TodoListScreen.tsx:405`, `listIsEmpty`), nicht durch diese Arbeit. (4) Keine Änderung an
`package.json` nötig. (5) Die Untergrenze für `@takt/desktop` setzt Arbeitsbereichsverweise
innerhalb des Auszugs voraus.
Nächster Schritt: Freigaberunde (code-reviewer gegen die Zählvorschrift, security-checker gegen
A-A-105), danach R-30 schließen.
