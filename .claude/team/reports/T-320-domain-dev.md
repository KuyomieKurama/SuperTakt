# T-320 — Die Löschpfade (Punkt 1) und der Versionswächter, sechste Runde (Punkt 2)

Aufgabe: T-320 — beide Befunde aus `.claude/team/reports/T-318-code-reviewer.md`
Status: **fertig** — braucht Review; **eine Nacharbeit liegt beim unit-tester** (vier Prüffälle, unten benannt)

---

## Artefakte

| Datei | Warum |
|---|---|
| `packages/domain/src/attachment.ts` | `attachmentTargetNamesFile` symmetrisch gemacht (Befund `:993`); `trimResolvedTail` aus `effectiveNameSegment` herausgezogen |
| `packages/storage/src/ports.ts` | **Neue Portmethode** `AttachmentPort.attachmentNamesOfKind(kind)` — siehe „Signaturänderung" |
| `packages/storage/src/sqlite/repo-attachments.ts` | Umsetzung dazu |
| `apps/local-api/src/features/todos/attachments.ts` | `ReleasableBlob`, `releaseUnclaimedBlobs`, `releasableBlobOf`; `removeAttachment` umgestellt |
| `apps/local-api/src/features/todos/todos.ts` | `removeTodo` umgestellt |
| `apps/local-api/src/features/todos/email-attachments.ts` | zwei Begründungen, warum dort **nicht** gefragt wird (kein Verhalten geändert) |
| `apps/local-api/src/features/todos/orphan-sweep.ts` | `catch (error)` mit `reason=` (Befund `:440`) |
| `apps/local-api/src/logger.ts` | `errorKindValue` |
| `apps/local-api/src/context.ts`, `apps/local-api/src/composition.ts` | `AppContext.logger` (freiwillig) |
| `apps/local-api/src/main.ts` | zweite Achse des Bildlaufs verdrahtet (Befund `:420`) |
| `apps/local-api/scripts/proof-release-safety.mjs` | Punkt 2 vollständig |
| `docs/architektur.md`, `docs/datenmodell.md` | die Regel und die neue Portmethode |

---

# Punkt 1 — Datenverlust ohne Aufräumlauf

## Die Regel, wie sie jetzt im Code steht

> **Wer eine Datei entfernt, muß fragen, ob sie noch jemandem gehört — mit der weitesten Frage,
> nicht mit der nächstliegenden.**

Ausgeschrieben im Kopf von `releaseUnclaimedBlobs`
(`apps/local-api/src/features/todos/attachments.ts`), verkürzt in `docs/architektur.md` 5.6.

Die weiteste Frage ist `attachmentsNamingFiles` — über **Namen** statt über Zeilen, ohne `kind`,
ohne `origin`, ohne Todo, ASCII-gefaltet, Regel in `@takt/domain` und nirgends sonst. Sie steht
**hinter** dem `COMMIT`: Die gelöschte Zeile ist dann fort, eine nicht leere Antwort heißt
eindeutig „gehört noch jemand **anderem**".

Die enge Frage bleibt stehen und behält ihre Rolle: `imageTargets`/`emailFileTargets` und
`releasableBlobOf` sagen, welche Dateien SuperTakt für diese Zeile **selbst geschrieben** hat, und
halten einen vom Benutzer eingetragenen Pfad heraus. Sie sind eine **Kandidatenliste**, kein
Eigentumsnachweis — genau die Verwechslung war der Befund.

## Alle Stellen, die eine Datei entfernen — gesucht und einzeln beurteilt

Gesucht über `removeImage|removeEmailFile|rm(|unlink` in `apps/local-api/src`,
`packages/storage/src`, `packages/domain/src`.

| Stelle | Behandlung |
|---|---|
| `features/todos/attachments.ts` `removeAttachment` | **gefragt** (war Befund 1) |
| `features/todos/todos.ts` `removeTodo` | **gefragt** (war Befund 2) |
| `features/todos/orphan-sweep.ts` | fragt seit T-315 schon weit — unverändert |
| `features/todos/attachments.ts` `addAttachment`, Rückbau nach gescheitertem `INSERT` | **nicht gefragt, begründet** |
| `features/todos/email-attachments.ts` `catch` (Wurf aus der Anhangstransaktion) | **nicht gefragt, begründet** |
| `features/todos/email-attachments.ts` Schleife über `rejected` | **nicht gefragt, begründet** |
| `access/attachment-store.ts` (`.tmp`, `wx`-Fehlschlag) | der Adapter räumt seine eigene, gerade angelegte Datei ab |
| `packages/storage/src/sqlite/file-port.ts` (`removeFile`, `sweepTemporaryFiles`) | Exportordner, eigener Namensraum `.takt-*.tmp` — nicht R-29 |

**Die Begründung für die drei „nicht gefragt" ist eine Eigenschaft und keine Bequemlichkeit:** Die
Datei ist im **selben Aufruf** entstanden, trägt einen frisch erzeugten Namen aus `randomUUID()`
(128 Bit) und hat nie eine Zeile bekommen. Dort wäre die Frage sogar **schädlich** — sie braucht
den Bestand, und zwei dieser Zweige laufen gerade deshalb, weil der Bestand sich verweigert hat.
Eine unbeantwortbare Frage ließe dort Kundenmaterial aus einer fremden E-Mail ohne Eigentümer
liegen, also genau den Zustand, gegen den A-A-83 geschrieben ist. Der Satz steht an allen drei
Stellen im Quelltext, damit der nächste ihn nicht neu herleiten muß.

## Gemessen, nicht behauptet

Ein eigener Prüffall im Kratzverzeichnis (echte In-Memory-SQLite, echter Blob-Adapter, eigenes
Anwendungsdatenverzeichnis), danach gelöscht — er liegt **nicht** im Vorhaben, weil `*/test/**`
dem unit-tester gehört:

| Lage | vorher | nachher |
|---|---|---|
| Todo A trägt die Bildkopie, Todo B einen Dateianhang auf ihren vollen Pfad; A wird gelöscht | Datei **fort**, Zeile von B zeigt ins Leere | Datei **liegt**, `listImages()` nennt sie weiter |
| Gegenprobe: nur Todo A, A wird gelöscht | Datei fort | Datei fort |

Die Gegenprobe zur Messung selbst (Eigentümerantwort blind auf `new Set()` gesetzt) dreht genau
den ersten Fall auf rot — die Messung hängt an der neuen Frage und nicht an einem Zufall.

## Der Fehlschlag der Frage

Läßt sich die Eigentümerfrage nicht beantworten (Wurf), fällt **nichts**, und der Wurf wird
**nicht** weitergereicht: Der Anhang beziehungsweise das Todo ist gelöscht, und eine Antwort, die
den Aufrufer zum Wiederholen bringt, wäre derselbe Fehler wie vor E-111. Still ist er nicht — eine
`warn`-Zeile mit der **Art** des Wurfs und einer Zahl, kein Pfad, kein Name (B-2.4). Dafür trägt
`AppContext` ein **freiwilliges** `logger`; kein Adapter kann diese Zeile schreiben, weil er gar
nicht erst gerufen wird.

Zusätzlich eine `info`-Zeile, wenn eine Datei **liegen bleibt, weil ein anderer sie nennt** — das
ist der neue Normalfall und sonst für niemanden sichtbar.

## Die drei kleineren Befunde

**`orphan-sweep.ts:420` (mittel) — die einzige lebende Achse des Bildlaufs.** Der Bildlauf bekommt
seine erste Gegenfrage zurück: `attachmentNamesOfKind('image')` nennt die bloßen Namen aller
Bildzeilen, vereinigt mit `attachmentNamesUnder(ordner)`. Damit ist `missing` auch für
namensförmige `target` rechenbar und steht nicht länger als konstante 0 im Protokoll.

Zwei Dinge dazu ausdrücklich, damit sie niemand für mehr hält, als sie sind:

- **Die Vereinigung steht in der Verdrahtung** (`main.ts`) und nicht in `orphan-sweep.ts`. Sie
  betrifft den **Ordner**, nicht das Verfahren: Für die übernommenen E-Mail-Dateien wäre dieselbe
  Ergänzung falsch, weil `kind = 'file'` dort auch jeden vom Benutzer eingetragenen Pfad trägt und
  der absichtlich anderswohin zeigt. Nebenwirkung, die mir wichtig war: `OrphanedImageSweep` und
  `OrphanSweepPorts` behalten ihre Gestalt, also bricht kein Prüffall des unit-testers.
- **Es ist keine dritte, unabhängige Achse.** Sie hängt an derselben Spalte wie `imageCount` — und
  „zwei Antworten auf dieselbe Frage widersprechen einander nie" ist die Lehre aus T-313-2. Sie
  weitet die **Bremse** und macht eine Zahl lesbar; den vom Prüfer beschriebenen Dauerzustand
  („eine einzige Zeile ohne Datei legt den Lauf still") hebt sie **nicht** auf. Offene Frage unten.

**`orphan-sweep.ts:440` (niedrig) — `catch {` verliert den Grund.** Jetzt `catch (error)` mit
`reason=<klassenname>`. **Der wörtliche Vorschlag des Prüfers hätte die Zeile zerstört:**
`error.constructor.name` ist `TypeError`, `REASON_SHAPE` (`logger.ts`) läßt für einen Wert nur
`[a-z0-9_]{1,32}` durch, und ein einziges unerlaubtes Zeichen macht den **ganzen** Grund zu
`unclassified` — samt `files=` und `removed=` daneben. Deshalb `errorKindValue` in `logger.ts`:
gefaltet, beschnitten, `unknown` für alles, was kein `Error` ist. `error.message` kommt nie hinein
(dort steht bei Dateisystem- und SQLite-Fehlern regelmäßig ein Pfad, T-132).

**`packages/domain/src/attachment.ts:993` (niedrig) — Unsymmetrie.** `fileName` läuft jetzt
ebenfalls durch die Kürzung um nachgestellte Punkte und Leerzeichen. **Nicht** durch
`attachmentTargetFileName`: Das hätte zusätzlich den letzten Pfadbestandteil genommen und die
zugesagte Eigenschaft „ein gesuchter Name mit Trenner wird buchstäblich am Ende gesucht" gebrochen
(ein Prüffall des unit-testers mißt sie, und er hat meinen ersten Versuch zu Recht rot gemacht).
Gefragt wird **beides** — roh und gekürzt —, damit die Fassung Zeichen für Zeichen **weiter** ist
als die vorige und keinen Eigentümer verliert.

---

# Punkt 2 — Die fünfte Umgehung des Versionswächters

**Der saubere Weg ist gebaut, und er trägt.** Beide Wege des Prüfers sind umgesetzt, nicht einer:

1. **`test`, `tests`, `__tests__` sind aus `SKIP_DIRECTORIES` gestrichen.** Gemessen mit
   `find apps packages -type d -name test …`: sieben Prüfordner, alle Geschwister von `src`, keiner
   unterhalb einer `SOURCE_ROOTS`-Wurzel. Die Namen waren wirkungslos und kosteten genau diese Tür.
2. **Der Baum wird zusätzlich beim Compiler erfragt** (`uebersetzungsprogramm`):
   `ts.readConfigFile` + `ts.parseJsonConfigFileContent` über `apps/local-api/tsconfig.json`, dann
   `ts.createProgram` für die **transitive** Hülle. Gefiltert wird nur `node_modules/**` und alles
   außerhalb von `ROOT`; beides steht benannt in der Lückenliste bei `checkNoStoreReadback`.
   Vereinigt mit dem gelaufenen Baum, einmal je Pfad gelesen.

Damit ist die Menge an der **Anforderung** aufgespannt und nicht an einer Verzeichnisliste — die
Lehre aus E-099 Punkt 3, die der Lauf fünfmal hintereinander verfehlt hat.

**Kosten, gemessen:** 121 eigene Dateien im Programm (66 aus `apps/local-api/src`, 55 aus
`packages/{domain,storage}/src`), rund 0,5 s und rund 190 MB für die Auflösung; der ganze Lauf
braucht **1,5 s**. Ein Zwischenwert sorgt dafür, daß die drei Fragesteller dieselbe Menge sehen.

**Der stumme Ausgang ist zu** (dieselbe Regel wie T-249-1): unlesbare Konfiguration, Fehler beim
Auswerten von `include`/`exclude`, weniger als 60 eigene Dateien, oder
`apps/local-api/src/features/version/version.ts` nicht im Programm → `scheitern` mit Namen.

**Neu gemessen wird in drei Sätzen, und die Aufteilung ist Absicht:**

- Gegenprobe (α) ZZ-F′ setzt die Erweiterung unter `src/features/version/test/augment.ts` in den
  erfundenen Baum — sie mißt, daß Zusage 1 sie **erkennt**, mit eigenem `erwartet`.
- Abschnitt 0: „kein Prüfordnername in `SKIP_DIRECTORIES`" und „jede Datei des
  Übersetzungsprogramms liegt im gelesenen Baum (121)" — sie messen, daß der Baum sie **liefert**.

Genau die zweite Hälfte fehlte in T-296, und deshalb war die Klasse nicht zu. Ich habe das im
Quelltext bei (α) ausgeschrieben, statt es als geschlossen zu melden.

**Mutationen, selbst gefahren:**

| Mutation | Ergebnis |
|---|---|
| `'test'` wieder in `SKIP_DIRECTORIES` | **1 rot** — „kein Prüfordnername in `SKIP_DIRECTORIES`" |
| `declare module`-Erkennung in Zusage 1 blindgelegt | **3 rot** — ZZ-F, ZZ-F′, ZZ-D |
| unverändert | **76 bestanden, 0 fehlgeschlagen** (vorher 73) |

Bemerkenswert an der zweiten Mutation, weil es die `erwartet`-Regel bestätigt: ZZ-F′ fällt dabei
auf den Befund von **Zusage 2** zurück. Ohne `erwartet` wäre die Gegenprobe grün gewesen und hätte
eine Deckung bezeugt, die sie nicht hat — dieselbe Bauart wie T-143 S-1.

## Die drei nicht blockierenden Befunde

- **`:2385`** — `injection.erwartet instanceof RegExp` statt `!== undefined`. Ein versehentliches
  `erwartet: 'text'` wird jetzt rot statt zu werfen; ein Wächter, der abstürzt, gibt dem Leser die
  falsche Auskunft.
- **`:1261`** — der Befundsatz ist auf das Gemessene gekürzt: „steht hier ein zweites Mal im Baum …
  dieser Leser kann nicht sagen, welche der beiden für einen Aufrufer gilt". Die Aussage über die
  Importzeile ist fort; sie war für eine Deklaration im Funktionsrumpf falsch. Die rekursive
  Sammlung **bleibt** — die laute Richtung ist hier die billige. Das `erwartet` der Gegenprobe (w)
  ist mitgezogen.
- **`:990`** — die Lückenliste nennt jetzt `node_modules/**` einschließlich `@types/**` (die einzige
  verbliebene Lücke **innerhalb** des Übersetzungsprogramms, samt Begründung, warum sie ausgelassen
  ist) und hält fest, daß `src/**/test/**` dort fehlte und jetzt zu ist.

---

## Läufe

Einzeln gefahren, wie im Auftrag verlangt. **Nichts ist mir abgebrochen.**

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` (acht Pakete + sieben Prüfprojekte + e2e) | **grün** |
| `pnpm run boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt" |
| `node apps/local-api/scripts/proof-release-safety.mjs` | **76 bestanden, 0 fehlgeschlagen** |
| `proof:layers` 36/0, `proof:openapi` 115/0, `proof:callers` 74/0, `proof:route-policy` 48/0, `proof:access` 109/0 | grün |
| `proof:codepoints` 46/0, `proof:conflicts` 154/0, `proof:tags` 45/0, `proof:export` 98/0, `proof:export-api` 72/0, `proof:taskpane` 29/0, `proof:addin-wiring` 32/0, `proof:template-fields` 30/0, `proof:migrations` | grün |
| `proof:db-permissions` | übersprungen (Windows: ACL statt POSIX-Modus) |
| `vitest run packages/domain/test` | **695/695** |
| `vitest run apps/local-api/test packages/storage/test` | 798 grün, **4 rot** (siehe unten), 3 übersprungen |

**Nicht gefahren:** `pnpm check` als Ganzes, `test:coverage`, `test:rust`, `build`, `audit`,
`test:e2e`, `verify:bundle`, `contrast`,
`proof:surface`/`clamp`/`foreign`/`locked`/`shell-surface`/`addin` (Oberfläche, Hülle, Add-in — von
diesen Änderungen nicht berührt). Kein Abbruch, sondern nicht gestartet.

---

## Signaturänderung in `packages/storage/src` — **ausdrücklich gemeldet**

`AttachmentPort` bekommt **eine** neue Methode:

```ts
attachmentNamesOfKind(kind: AttachmentKind): Promise<ReadonlySet<string>>;
```

**Rein additiv.** Die einzige Umsetzung ist `createAttachmentPort`; kein Prüffall baut eine eigene
`AttachmentPort`-Attrappe (gesucht über `AttachmentPort|OrphanedImageSweep|OrphanSweepPorts` in
`apps/*/test`, `packages/*/test`, `tests/`). `tsc -p packages/storage/tsconfig.test.json` und
`apps/local-api/tsconfig.test.json` sind grün, `packages/storage/test/repo-attachments.test.ts`
läuft durch — auch mit den 120 Zeilen, die der unit-tester heute dazugelegt hat.

`OrphanedImageSweep`, `OrphanedEmailFileSweep` und `OrphanSweepPorts` sind **unverändert**; die neue
Frage wird in `main.ts` in die vorhandene `attachmentNamesUnder`-Naht hineinvereinigt, genau damit
dort nichts bricht.

---

## Nacharbeit beim unit-tester — vier Prüffälle, absichtlich rot

`orphan-sweep.ts` hängt an die `unavailable`-Zeile jetzt `reason=<art>` an. Vier Prüffälle messen
die Zeichenkette zeichengleich und sind deshalb rot:

```
apps/local-api/test/usecases/image-sweep.test.ts:746, :794
apps/local-api/test/usecases/email-file-sweep.test.ts:689, :734
```

Erwartet wird künftig `…_unavailable files=N removed=M reason=error`. Ich habe sie **nicht**
angefaßt — `apps/*/test/**` gehört dem unit-tester. Alle vier haben dieselbe Ursache; es ist eine
Anpassung von vier Zeichenketten, kein Umbau.

---

## Annahmen

1. **Die drei „just-created"-Stellen bleiben ohne Eigentümerfrage.** Begründet über die Eigenschaft
   (frischer `randomUUID`-Name, nie eine Zeile) und nicht über Bequemlichkeit; an allen drei Stellen
   im Quelltext ausgeschrieben. Wer anders entscheidet, bezahlt es bei den beiden E-Mail-Zweigen mit
   liegenbleibendem Kundenmaterial genau dann, wenn der Bestand ausfällt.
2. **`AppContext.logger` ist freiwillig und nicht Pflicht.** Pflicht hätte acht Prüfdateien des
   unit-testers gebrochen, die einen Zusammenhang von Hand bauen. Im Zusammenbau ist er immer
   gesetzt.
3. **Die Vereinigung der Bildlauf-Gegenfrage steht in `main.ts`**, nicht im Verfahren — Begründung
   oben und im Quelltext an der Kante.
4. **`fileName` wird gekürzt, aber nicht in Pfadbestandteile zerlegt.** Der weitere Weg hätte eine
   zugesagte und geprüfte Eigenschaft gebrochen.
5. **Der Wächter filtert `node_modules` aus dem Programm.** Sonst ginge Zusage 1 an den `.d.ts` der
   Fremdpakete unter. Die Lücke steht benannt in der Liste bei `checkNoStoreReadback`.

## Risiken

- **R-29 ist für die Löschpfade zu, für die Klasse nicht automatisch.** Was den nächsten Fall fangen
  würde, ist kein Prüfsatz, sondern der Satz im Quelltext plus die Inventarliste oben. Ein
  `proof`-Lauf „jede Stelle, die `removeImage`/`removeEmailFile` ruft, fragt vorher" wäre baubar —
  er wäre eine Menge, die an der **Route** aufgespannt ist, und damit genau der Fehler aus E-099
  Punkt 3. Ich habe ihn deshalb **nicht** gebaut und melde die Lücke lieber.
- **Der Dauerzustand des Bildlaufs bleibt** (unten als offene Frage).
- **Sicherheit:** Die Änderung macht Löschungen ausschließlich **seltener**. Der neue Weg liest
  `target` und nichts sonst; keine neue Fläche, keine neue Adresse, kein neuer Pfad im Protokoll.
  `attachmentsNamingFiles` ist ein `LIKE '%name%'` über `todo_attachment` und läuft jetzt bei jedem
  Löschen eines Anhangs oder Todos einmal statt nur beim Start — bei einem lokalen Bestand dieser
  Größe ohne meßbare Folge, aber es ist eine neue Vollabfrage und gehört genannt.

## Offene Fragen an den Orchestrator

1. **Der Bildlauf steht nach einer einzigen Bildzeile ohne Datei dauerhaft still**, und das ist nach
   diesem Auftrag weiterhin so. Meine Ergänzung macht `missing` rechenbar, hebt den Zustand aber
   nicht auf — sie **kann** ihn nicht aufheben, weil beide Zahlen an `kind = 'image'` hängen. Ihn
   aufzulösen hieße, den Widerspruch **gezielt** zu machen (nur die betroffene Datei bremsen statt
   des ganzen Laufs), und das ist ein eigener Auftrag mit eigener Gegenprobe. Nächste Welle?
2. **Vier Prüffälle beim unit-tester** (oben genannt). Sie messen eine Zeichenkette, die sich
   absichtlich geändert hat.
3. **`AttachmentPort` hat eine Methode mehr.** Falls der unit-tester gerade an
   `repo-attachments.test.ts` arbeitet: `attachmentNamesOfKind` hat heute **keinen** Prüffall. Ein
   Wunsch, kein Auftrag von mir.
4. `docs/bedrohungsmodell.md` gehört dem security-checker: Abschnitt 40.1 beschreibt die Gegenproben
   des Aufräumlaufs. Die beiden Löschpfade fragen jetzt dieselbe Frage; ob das dort einen Satz
   bekommt, entscheidet er.

## Nächster Schritt

Code-Reviewer auf beide Stränge, danach der unit-tester mit den vier Zeichenketten und — wenn
gewünscht — einem Prüffall für `attachmentNamesOfKind` und einem für den Löschpfad („Todo A löschen
kostet Todo B seinen Anhang nicht"; mein Aufbau dafür ist oben beschrieben und ohne laufenden Dienst
nachbaubar).
