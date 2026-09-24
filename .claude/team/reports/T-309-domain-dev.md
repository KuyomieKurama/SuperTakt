# T-309 — Nacharbeit aus T-307 und T-308: Transaktionsgrenze, drei Grenzen, drei Kennungen

**Aufgabe:** T-309 · **Rolle:** domain-dev · **Stand:** 2026-09-12
**Grundlage:** `.claude/team/reports/T-307-code-reviewer.md` (Befund 1), `T-308-spec-ux-reviewer.md`
(F-1, F-4, F-5, F-7); `docs/spec.md` A-19.23c, A-19.29, A-19.30, A-19.30a, A-19.30b; A-A-83, A-A-18.

**Status: braucht Review.** Fachlich fertig, einschließlich der beiden Nachträge des
Orchestrators (Aufräumlauf beim Start, kein 500 bei stehendem Todo). **Zwei Nachträge am Ende
dieses Berichts** halten fest, was sich während der Aufgabe geändert hat; das Tor hängt jetzt an
vier Übersetzungsfehlern in einem Prüfprojekt, das mir nicht gehört.

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/src/features/todos/email-attachments.ts` | Punkt 1: die Anhangstransaktion liegt in `try`/`catch`, der Fangzweig entfernt **jede** Datei dieses Laufs und wirft weiter. Dazu: `too_many` statt `rejected` an der Anzahlgrenze, `bytes` nur noch bei `too_large`, Zitate auf A-19.23c und A-19.30a |
| `packages/domain/src/email-attachment.ts` | `EmailAttachmentFailureReason`: `total_too_large` und `too_many` **auf**, `connection` **ab** (acht → neun). `admitEmailAttachment` vergibt vier statt zwei Kennungen. Begründungen auf A-19.23c / A-19.30a / A-19.30b gezogen |
| `apps/local-api/openapi/takt-local-api.yaml` | `rejected[].reason`: Aufzählung neun statt acht, Beschreibung der drei Grenzen und von `bytes: null` bei Summe und Anzahl |
| `docs/architektur.md` | 5.6b: A-A-83 in beiden Hälften mit ihrer Reichweitengrenze; drei Grenzen mit drei Kennungen; die Erreichbarkeitsmessung über die ganze Gründeliste |
| `.claude/team/reports/T-309-domain-dev.md` | dieser Bericht |

Nicht angefaßt: `apps/local-api/src/routes/addin/**`, `apps/outlook-addin/**`, `tests/**`,
`apps/*/test/**`, `docs/spec.md`.

---

## 1. Der schwerste Befund — die Bytes ohne Eigentümer (A-A-83)

### Was da war

`inTransaction` stand **nackt** da. Ein `Result`-Fehlschlag einer einzelnen Zeile räumte auf; ein
**Wurf** (SQLITE_BUSY, ein Fehler beim Vergeben von `position`, eine versehentlich verschachtelte
Transaktion) verließ `attachEmailToNewTodo`, und die Dateien aus `written` blieben im
Anwendungsdatenverzeichnis liegen — Kundenmaterial, das keine Zeile mehr nennt. Einen Aufräumlauf
gibt es für dieses Verzeichnis nicht. Der Prüffall aus T-306 maß den Zweig, der aufräumt.

### Was ich gebaut habe, und warum dieser Weg

**`try`/`catch` um den Ruf, im Fangzweig jede Datei aus `written` entfernen, danach weiterwerfen.**
Von den drei angebotenen Wegen war das der einzige, der die Zusage **exakt** macht statt nur
wahrscheinlicher:

- **„Eine Transaktion" geht nicht.** Das Dateisystem ist nicht Teil der SQLite-Transaktion. Auch
  wenn Zeilen und Bytes in einem Aufruf entstünden, bliebe zwischen `write()` und `COMMIT` ein
  Fenster. Der Weg verspricht etwas, das er nicht halten kann.
- **Ein Aufräumlauf beim Start** ist für diesen Fall der **schwächere** Riegel, nicht der stärkere:
  Er räumt erst beim nächsten Start, er braucht seine eigenen Sicherungen gegen das Löschen von
  Material **mit** Eigentümer (siehe `image-sweep.ts` mit seinen zwei Riegeln), und er löst das
  Problem an einem Zeitgeber statt am Aufrufstapel. Der Dateikopf dieser Naht sagt das seit T-299
  selbst: „Eine Zusage am Aufrufstapel ist stärker als eine an einem Zeitgeber."
- **`try`/`finally`** wäre hier falsch: Der Erfolgsfall darf gerade **nicht** aufräumen.

**Warum der Fangzweig *jede* Datei entfernen darf** und nicht nur die, von denen wir wissen, daß sie
keine Zeile bekamen: Der Transaktionsport nimmt bei einem Wurf aus der Arbeit ein `ROLLBACK` vor,
**bevor** er weiterwirft (`packages/storage/src/sqlite/unit-of-work.ts:193-217`, gelesen, nicht
angenommen). Nach einem Wurf steht damit fest, daß es **keine** Zeile aus diesem Lauf gibt. Ohne
diese Zusage wäre dasselbe Aufräumen das Gegenteil: gelöschtes Kundenmaterial mit Eigentümer, und
das ist unwiederbringlich (A-A-18). Die Begründung steht im Quelltext neben der Klammer, nicht nur
hier.

Jede Entfernung steht in ihrem eigenen `try`: Der Adapter beantwortet einen Fehlschlag mit `failed`
und schreibt seine Protokollzeile; wirft eine fremde Portfassung trotzdem, darf sie weder den
**ersten** Grund verdecken noch die zweite Datei am Leben lassen.

### Was dieser Weg **nicht** kann — ausdrücklich

1. **Er reicht so weit wie der Prozeß.** Wird der Dienst zwischen dem Schreiben einer Datei und dem
   `COMMIT` hart beendet — abgeschossen, Stromausfall, `taskkill` —, bleibt die Datei liegen.
   Dagegen hilft **nur** ein Aufräumlauf beim Start. Ich habe ihn nicht gebaut (offene Frage 1).
2. **Das Todo überlebt den Wurf.** Es steht in seiner eigenen, bereits festgeschriebenen
   Transaktion; die Route antwortet 500, und der Benutzer sieht im Aufgabenbereich einen Fehlschlag,
   obwohl das Todo entstanden ist. Ein zweiter Versuch erzeugt ein Duplikat. Ich habe bewußt
   **nicht** auf „Erfolg mit lauter fehlgeschlagenen Anhängen" umgestellt: Ein Wurf aus dem Bestand
   ist keine Aussage über eine einzelne Datei, und ihm eine Datei-Kennung (`rejected`) anzuhängen
   wäre genau der Satz, der auf die falsche Ursache zeigt. Das ist eine Produktfrage, keine
   Umsetzungsfrage (offene Frage 2).
3. **Er protokolliert nicht selbst.** `AppContext` führt keinen `Logger`; einen einzuführen wäre
   eine Änderung an der gemeinsamen Gestalt des Zusammenhangs. Die gefährliche Hälfte ist ohnehin
   gedeckt: Eine Datei, die sich **nicht** entfernen ließ, protokolliert der Adapter selbst
   (`attachment_email_remove_failed`, mit dem erzeugten Namen, nie dem Anzeigenamen). Eine Datei,
   die fort ist, braucht keine Zeile.

### Die Naht für den Prüffall — für unit-tester

Sie ist offen und war es schon; sie muß nur benutzt werden. `attachEmailToNewTodo(context, intake,
create)` nimmt den ganzen `AppContext`. Der Fall lautet:

- `attachmentBlobs`: der **echte** Adapter (`createAttachmentStore`) über ein frisches
  Anwendungsdatenverzeichnis — so, wie `apps/local-api/test/usecases/data-transfer.test.ts` es tut.
  Eine Attrappe zählt hier nicht: Gemessen werden soll das **Verzeichnis**, nicht ein Zähler.
- `transactions`: eine Fassung, deren `inTransaction` wirft. Besser als ein sofortiges `reject`:
  eine, die die Arbeit **ausführt** und danach wirft — dann ist auch der Weg gemessen, auf dem
  bereits Zeilen entstanden wären.
- `create`: legt ein echtes Todo an.

Zugesichert wird dreierlei: (a) der Wurf kommt beim Aufrufer an und wird nicht verschluckt,
(b) `attachmentBlobs.listEmailFiles()` ist danach **leer**, (c) als Gegenprobe: derselbe Lauf ohne
Wurf legt N Dateien ab, damit die Null nicht die Null einer leeren Messung ist. Punkt (c) ist der,
ohne den der Fall grün aus Zufall wäre.

---

## 2. Jede Grenze nennt ihren eigenen Wert (A-19.30a, A-19.30b)

**`EmailAttachmentFailureReason` hat jetzt neun Werte statt acht.** `total_too_large` und
`too_many` sind dazugekommen; `admitEmailAttachment` vergibt vier Kennungen statt zwei:

| Gerissen | vorher | jetzt |
|---|---|---|
| Größe je Datei (25 MB) | `too_large` | `too_large` |
| Summe (48 MB) | `too_large` ← der Widerspruch | `total_too_large` |
| Anzahl (25) | `rejected` | `too_many` |
| leerer/unsinniger Rumpf | `rejected` | `rejected` |

Die Anzahlgrenze für **Cloud-Verweise** meldet ebenfalls `too_many` — es ist dieselbe Grenze, also
derselbe Grund.

**`bytes` bleibt allein bei `too_large`.** Bei `total_too_large` und `too_many` steht `null`, und
das ist der Kern von A-19.30b: Die Größe *dieser* Datei neben einem Satz über die **Summe** wäre
eine zweite Aussage, die von etwas anderem handelt als der Satz daneben — genau die Bauart, aus der
„zu groß (2,0 MB). Die Grenze liegt bei 25,0 MB je Datei." entstanden ist.

**Die Reihenfolge bleibt: Anzahl vor Größe.** Wer als 26. Datei eine 40-MB-Datei schickt, liest
„über der Anzahlgrenze". Das ist Absicht und steht jetzt im Quelltext: Die Grenze, die zuerst
greift, ist die, die genannt wird.

**Die Sätze habe ich nicht angefaßt.** Sie stehen in `apps/outlook-addin/src/attachments/reasons.ts`
und tragen beide Fälle **bereits** — `total_too_large` und `too_many` waren dort als reine
Anzeigegründe geführt. Die Nacharbeit an der Fläche besteht deshalb im Anschließen, nicht im
Schreiben.

---

## 3. `connection` — gemessen, nicht gelesen

Der Auftrag verlangte die Prüfung über die **ganze** Liste und an der **Erreichbarkeit**. Gemessen
über `apps/outlook-addin/src`, `apps/local-api/src`, `packages/domain/src`, `apps/web/src`, gesucht
nach jeder Stelle, die den Wert **erzeugt** (nicht nach jeder, die ihn nennt):

| Grund | Erzeuger |
|---|---|
| `too_large` | `collect.ts:291,310,348`, `plan.ts:154`, `attachment-store.ts`, `email-attachments.ts` |
| `total_too_large` | `collect.ts:255,259`, `plan.ts:162`, **neu** `admitEmailAttachment` |
| `too_many` | `plan.ts:158`, **neu** `admitEmailAttachment` und die Verweisschleife |
| `not_released` | `collect.ts:171,174,343` |
| `timeout` | `collect.ts:342` |
| `rejected` | `collect.ts:285,341`, `email-attachments.ts` (drei Stellen) |
| `not_a_web_address` | `collect.ts:153`, `plan.ts:144`, `email-attachments.ts:462` |
| `rebuild_rejected` | `collect.ts:307` |
| `outlook_too_old` | `collect.ts:332`, `plan.ts:150` |
| **`connection`** | **keiner, nirgends** |

`connection` ist damit gestrichen. Die Begründung ist nicht „niemand benutzt ihn", sondern daß er
**nicht eintreten kann**: Der Aufgabenbereich sammelt vollständig lokal und schickt genau einmal;
reißt dieser Ruf, gibt es kein Todo, und der Fall ist die Fehlerfläche und nicht die Ergebnisliste.
Der Dienst kann ihn gar nicht feststellen — was bei ihm ankommt, ist angekommen. Dasselbe Urteil wie
bei `mailbox_closed` (E-109) und aus demselben Satz.

Der Vollständigkeit halber, weil es beim Messen auffiel und **kein** Befund ist: Über die Leitung
reisen heute nur die fünf Gründe des Dienstes. `routes/addin/service.ts:668` setzt `failed: []` —
die Fehlschläge des Aufgabenbereichs bleiben bei ihm und stehen dort in derselben Liste. Die vier
übrigen Kennungen sind deshalb im Dienst unerreichbar, **aber im Aufgabenbereich erzeugt**; sie sind
gemeinsamer Vorrat und nicht toter Code. Nur `connection` hatte gar keinen Ort.

---

## 4. Zwei Wortlaute aus der Spezifikation nachgezogen

- **A-19.23c** (fünf Umleitungsarten). `nameEmailFile` und die Aufrufstelle zeigen jetzt auf die
  Anforderung. Der alte Absatz sagte, die Abweisung sei „die Auslegung von ‚sämtliche
  Dateianhänge'" — eine Auslegung, die T-299 selbst als prüfbedürftig gemeldet und T-308 F-4 zu
  Recht als ungedeckt beanstandet hat. Jetzt steht dort, daß A-19.23c sie ausdrücklich trifft und
  A-19.23 vorgeht, mit dem Datum des Nachtrags.
- **A-19.30a / A-19.30b.** Der Abschnittskopf über den drei Grenzen sagt jetzt, daß sie bis zum
  2026-09-12 **ungedeckt** waren (E-108 Punkt 3 nannte nur die Grenze je Datei), daß sie bleiben und
  warum. Jede der drei Konstanten nennt ihre eigene Kennung.

Kein Satz, den ein Prüfer verlangt hat, ist gefallen; gestrichen ist nur der Absatz, der das
Gegenteil des heutigen Bestands behauptete.

---

## Der Übergabepunkt — was **nicht** von mir grün wird

`pnpm check` bricht im **ersten** Schritt ab (`typecheck`, Ausstieg 2). Sechs Fehler, alle in
`apps/outlook-addin`:

```
src/attachments/reasons.ts(86,10)    TS2678  '"connection"' is not comparable to 'SkipReason'   ← Folge von T-309
src/attachments/reasons.ts(146,10)   TS2678  dasselbe                                           ← Folge von T-309
src/attachments/reconcile.ts(160,68) TS2345  'AttachmentPayload | undefined'                    ← nicht von mir
src/attachments/reconcile.ts(163,79) TS18048 'item' is possibly 'undefined'                     ← nicht von mir
src/ui/TaskPane.tsx(30,10)           TS6133  'MESSAGE_DISPLAY_NAME' never read                  ← nicht von mir
src/ui/TaskPane.tsx(1211,24)         TS2304  Cannot find name 'Ref'                             ← nicht von mir
```

Die letzten vier stehen in Dateien und an Symbolen, die ich nicht berührt habe: Der Aufgabenbereich
ist gerade mitten in T-310 und übersetzte auch ohne mich nicht. Die ersten beiden sind die
angeforderte Folge von Punkt 3 und **zwei gestrichene Zeilen** — `case 'connection'` in beiden
`switch`-Blöcken.

Daß diese Kopplung so entsteht, ist **geplant und nicht überraschend**: Der neue Kommentar in
`apps/outlook-addin/src/attachments/model.ts` (T-310, im Arbeitsbaum) sagt wörtlich „Nimmt die
Domäne `total_too_large` oder `too_many` in ihre Aufzählung auf — daran arbeitet domain-dev —, wird
dieser Record unvollständig und `pnpm typecheck` rot". Der Wächter tut genau das, wofür er gebaut
wurde.

### Was integration-dev (T-310) anschließen muß

1. `apps/outlook-addin/src/attachments/reasons.ts`: `case 'connection'` in `reasonSentence` und in
   `shortReason` streichen. Die Sätze zu `total_too_large` und `too_many` stehen bereits.
2. `apps/outlook-addin/src/attachments/model.ts`: `DISPLAY_ONLY_SKIP_REASONS` ist **leer** — die
   beiden Kennungen reisen jetzt. `SkipReason` fällt mit `WireSkipReason` zusammen.
   `DISPLAY_SKIP_REASON` bekommt die zwei neuen Zeilen und verliert `connection`.
3. `apps/outlook-addin/scripts/proof-addin.mjs:9450-9458`: Die Zusicherung „jeder Eintrag aus
   `DISPLAY_ONLY_SKIP_REASONS` steht **nicht** in der Domäne" ist die **eine** rote Stelle in
   `proof:all` und richtig rot. Über einer leeren Liste ist sie eine leere Messung — sie gehört
   umgeschrieben auf die Aussage, die jetzt trägt: jede Kennung der Leitung fällt auf genau einen
   Satz, und **jede der drei Grenzen nennt eine andere Zahl** (A-19.30b; meßbar: die drei Sätze
   enthalten drei verschiedene Zahlen).
4. Vorschau gegen Tür (T-308 F-5, zweite Hälfte): Die Vorschau zählt nur Dateien gegen 25, die Tür
   zählt Nachricht, Dateien und Verweise gemeinsam. Die Tür bleibt, wie sie ist — sie ist die,
   deren Urteil bindet.

### Was unit-tester nachziehen muß — sechs Zusicherungen, alle die alte Regel

`vitest run` über den ganzen Baum: **1787 grün, 6 rot**, und alle sechs schreiben die frühere Regel
fest. Keine davon ist ein Nebenschaden.

```
packages/domain/test/email-attachment.test.ts:85-98    „genau acht Gründe"                       → neun, und die Liste
packages/domain/test/email-attachment.test.ts:101-113  „'connection' ist erreichbar"             → Eintrag streichen
packages/domain/test/email-attachment.test.ts:120-125  'too_many'/'total_too_large' seien fremd  → sind jetzt eigene
packages/domain/test/email-attachment.test.ts:~171     Summengrenze ⇒ too_large                  → total_too_large
packages/domain/test/email-attachment.test.ts:~183     26. Datei ⇒ rejected                      → too_many
apps/local-api/test/usecases/email-attachments.test.ts:488  26. Verweis ⇒ rejected               → too_many
```

Dazu der **neue** Fall aus Abschnitt 1 („Die Naht für den Prüffall") — der ist der wichtigere von
beiden Aufträgen.

---

## Was ich gefahren habe, und was nicht

| Lauf | Ergebnis |
|---|---|
| `tsc -p tsconfig.json --noEmit` (Wurzel) | **0** |
| `tsc -p packages/domain/tsconfig.json` | **0** |
| `tsc -p apps/local-api/tsconfig.json` | **0** |
| `pnpm run typecheck` (alle) | **2** — sechs Fehler, alle im Aufgabenbereich, siehe oben |
| `pnpm run boundaries` | **0** — „Notiz-Trennung: alle Schichten unverletzt" |
| `pnpm run contrast` | **0** |
| `pnpm run proof:all` | **1** — genau eine Zusicherung, `proof:addin` „T-304: die Grenzen und die Gründe kommen aus @takt/domain": „`too_many` steht in der Domäne". Alle übrigen Läufe grün |
| `pnpm run verify:bundle` | **0** — 19 bestanden |
| `vitest run` (wie `test:coverage`, ohne Abdeckungsbericht) | 1787 grün, 6 rot, 3 übersprungen |
| `pnpm run build` | **2** — dieselben Übersetzungsfehler des Aufgabenbereichs |
| `pnpm audit` | **0** — keine bekannten Schwachstellen |
| `pnpm check` (vollständig, **zweiter** Lauf, siehe Nachtrag) | kommt bis `test:coverage` und fällt dort über die sechs Zusicherungen |
| `pnpm run test:rust` | **nicht gefahren** — kein Rust angefaßt |
| `pnpm test:e2e` | **nicht gefahren** — gehört e2e-tester, und `tests/e2e/attachment-export-and-addin-exclusion.spec.ts` ist gerade in fremder Hand |

Ein Hinweis zum Umfeld: Beim ersten `proof:all` brach `proof:conflicts` mit „Auf 127.0.0.1:17843
lauscht bereits etwas" ab — ein zweiter Prüflauf aus einer Parallelaufgabe. Der Wiederholungslauf
war sauber. Wer in dieser Welle mißt, sollte nicht gleichzeitig messen.

---

## Annahmen

1. **Nach einem Wurf aus `inTransaction` gibt es keine Zeile.** Am Adapter gelesen
   (`unit-of-work.ts:200-216`: `BEGIN IMMEDIATE` / `ROLLBACK` im `catch` / `throw error`), nicht
   angenommen. Auf dieser Zusage steht, daß der Fangzweig **jede** Datei entfernt. Wer den
   Transaktionsport austauscht, muß sie halten — sie steht jetzt im Quelltext an der Klammer.
2. **Der Wurf bleibt ein Wurf.** Ich habe ihn **nicht** in ein `ok()` mit lauter fehlgeschlagenen
   Anhängen übersetzt, obwohl das für den Benutzer die freundlichere Antwort wäre. Begründung oben;
   die Gegenposition gehört dem Auftraggeber (offene Frage 2).
3. **Beide neuen Kennungen, nicht nur die Summe.** T-308 F-1 nennt nur den Summenfall. A-19.30b
   verlangt es für **jede** der drei Grenzen, und `rejected` nennt keinen Wert — also brauchte auch
   die Anzahl ihre eigene Kennung.
4. **`bytes: null` bei Summe und Anzahl.** Der Satz dazu nennt keine Größe dieser Datei; eine Zahl
   daneben wäre die zweite Aussage, gegen die A-19.30b geschrieben ist.

---

## Risiken

- **R-a — Der Baum übersetzt nicht, bis zwei Zeilen fallen.** Entschärft, sobald T-310 landet; bis
  dahin ist jede Messung am Aufgabenbereich wertlos. Wird T-309 ohne T-310 übernommen, ist das Tor
  rot, und zwar sichtbar — das ist die bessere Hälfte des Risikos.
- **R-b — Die Lücke bleibt für den harten Prozeßabbruch offen.** Sicherheitlich klein
  (Kundenmaterial in einem `0700`-Ordner unter denselben Rechten wie der Bestand), datenschutzlich
  nicht null: Was dort liegt, sind E-Mail-Anhänge, und niemand findet sie je wieder. Für den
  security-checker: Es ist **kein** neuer Weg nach außen, sondern eine Datei ohne Eigentümer.
- **R-c — Zwei Zählweisen für eine Zahl** (T-308 F-5, zweite Hälfte) bleiben offen. Ich habe die
  **Tür** nicht verändert — sie ist die, deren Urteil bindet, und eine Vorschau, die zu wenig
  ankündigt, irrt in die sichere Richtung. Die Angleichung gehört in den Aufgabenbereich.
- **R-d — Die Fläche zeigt bis T-310 einen falschen Satz weiter.** Die Kennung ist jetzt richtig;
  der Satz kommt aus `reasons.ts`. Zwischen T-309 und T-310 fällt eine Summenüberschreitung im
  `DISPLAY_SKIP_REASON`-Record auf `rejected` zurück — ungenau statt widersprüchlich, also besser
  als vorher, aber noch nicht richtig.

---

## Offene Fragen an den Orchestrator

1. **Soll der Aufräumlauf beim Start für `email-attachments/` gebaut werden?** Er ist der einzige
   Riegel gegen den harten Prozeßabbruch, und das Vorbild steht fertig daneben
   (`features/todos/image-sweep.ts`, zwei Riegel gegen das Löschen von Material mit Eigentümer).
   Aufwand: ein `OrphanedEmailFileSweep` mit vier Funktionen, eine Abfrage `WHERE origin = 'email'`
   (der partielle Index `ix_todo_attachment_email` liegt seit 0023 dafür bereit) und eine Zeile in
   `main.ts`. **Ich habe ihn nicht gebaut**, weil er ein eigener Auftrag ist und weil ein
   Aufräumlauf ohne seinen eigenen Prüffall gefährlicher ist als keiner.
2. **Darf ein Wurf aus der Anhangstransaktion zu 500 führen, obwohl das Todo steht?** Heute ja. Die
   Folge ist ein Duplikat beim zweiten Versuch. Die Alternative — 200 mit „0 von 3 Anhängen" — ist
   für den Benutzer besser und für die Diagnose schlechter. Das ist eine Produktentscheidung.
3. **`DISPLAY_ONLY_SKIP_REASONS` ist leer — soll der Begriff bleiben?** Ich rate zu: ja, als leere
   Liste mit einem Satz, warum sie leer ist. Eine leere Liste, gegen die etwas gemessen wird, ist
   eine Einladung zur leeren Messung; der Nachweis in `proof-addin.mjs` gehört deshalb auf die
   Aussage von A-19.30b umgestellt und nicht auf die Abwesenheit. Gehört integration-dev,
   entschieden gehört es hier.
4. **E-110?** T-308 F-5 schlug eine Entscheidung für Summe und Anzahl vor. A-19.30a deckt sie
   inzwischen. Falls trotzdem ein Eintrag in `decisions.md` gewünscht ist, gehört er zusammen mit
   A-19.30b dorthin; `decisions.md` ändert der Orchestrator.
5. **A-24.7 gegen `DATA_ARCHIVE_VERSION`** (T-308 F-9) ist unberührt geblieben — der Auftrag nannte
   ihn nicht. Mein Vorschlag steht: A-24.7 nennt keine Zahl mehr, sondern verweist auf
   `docs/datenmodell.md` Abschnitt 10. Eine Zahl an zwei Orten ist die Bauart, aus der dieser
   Abstand entstanden ist.

---

## Nächster Schritt

T-310 schließt die vier Punkte aus „Was integration-dev anschließen muß" — **zuerst die zwei
gestrichenen `case`-Zeilen**, damit der Baum wieder übersetzt und alle anderen wieder messen können.
Parallel dazu unit-tester: die sechs Zusicherungen auf die neue Regel ziehen **und** den Prüffall
aus Abschnitt 1 bauen, mit Gegenprobe. Danach ist `pnpm check` wieder fahrbar, und erst dann lohnt
eine erneute Freigabeprüfung.

---

## Nachtrag, 40 Minuten später — der Übergabepunkt hat sich geschlossen

Zwischen dem ersten und dem zweiten vollständigen Torlauf ist T-310 in denselben Arbeitsbaum
gelandet. `apps/outlook-addin/src/attachments/reasons.ts` und `model.ts` sind nachgezogen; der
Aufgabenbereich übersetzt wieder (`tsc -p apps/outlook-addin/tsconfig.json --noEmit`, **Ausstieg
0**), und `proof:addin` ist grün — die Zusicherung über `DISPLAY_ONLY_SKIP_REASONS` ist dort
mitgeändert worden. **Die Punkte 1 bis 3 der Übergabeliste sind damit erledigt**; ich lasse sie
oben stehen, weil sie dokumentieren, wie die Kopplung entstanden ist und warum sie richtig war.
Punkt 4 (Vorschau gegen Tür, T-308 F-5) habe ich nicht nachgemessen.

**Der zweite vollständige `pnpm check` steht damit so:**

| Schritt | Ergebnis |
|---|---|
| `typecheck` | **grün**, alle Projekte einschließlich `src` und `test` |
| `boundaries` | **grün** |
| `contrast` | **grün** |
| `proof:all` | **grün**, alle 22 Läufe |
| `verify:bundle` | **grün** |
| `test:coverage` | **rot** — die sechs Zusicherungen aus „Was unit-tester nachziehen muß", sonst nichts. Abdeckung: Anweisungen 91,41 %, Zweige 85,96 %, Funktionen 94,57 %, Zeilen 93,53 % |
| `test:rust`, `build`, `audit` | nicht erreicht; einzeln gefahren war `build` zuletzt nur an den inzwischen behobenen Add-in-Fehlern rot, `audit` grün |

**Damit hängt das Tor an genau einer Hand: unit-tester.** Die sechs Zeilen sind oben mit Datei,
Zeilennummer und Sollwert benannt; dazu kommt der neue Prüffall aus Abschnitt 1, der der eigentliche
Grund dieser Aufgabe ist.

**Zwei Messungen, die in dieser Welle nicht zu trauen sind, solange parallel gemessen wird.**
`proof:conflicts` brach einmal mit „Auf 127.0.0.1:17843 lauscht bereits etwas" ab und
`proof:access` einmal mit „Und er ist es auch, der antwortet — der Dienst nennt seine Bindeadresse";
beide waren im Einzellauf sofort grün (109 bestanden, 0 fehlgeschlagen). Wer in dieser Welle ein
rotes Tor meldet, sollte den roten Lauf **einzeln** wiederholen, bevor er ihn einem Befund
zuschreibt — sonst entsteht genau die umgekehrte Sorte Irrtum: rot aus Zufall.

---

# Zweiter Nachtrag — die beiden entschiedenen Fragen, gebaut (E-111)

Der Orchestrator hat offene Frage 1 und 2 entschieden, beide zugunsten der teureren Antwort. Beides
ist umgesetzt. Dazu kommen die vier Fundstellen aus `T-311-e2e-tester.md`, die in meiner Hoheit
liegen.

## Neue und weitere Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/src/features/todos/email-file-sweep.ts` | **neu** — der Aufräumlauf beim Start für `email-attachments/`, mit beiden Auflagen |
| `packages/storage/src/ports.ts` | `AttachmentPort` um `knownEmailFileTargets(targets)` und `emailFileCount()` erweitert |
| `packages/storage/src/sqlite/repo-attachments.ts` | beide umgesetzt, blockweise über `ix_todo_attachment_email` |
| `apps/local-api/src/main.ts` | der Lauf ist verdrahtet, unmittelbar nach dem Bildlauf, **vor** `image_cleanup_ready` |
| `apps/local-api/src/features/todos/email-attachments.ts` | kein Weiterwerfen mehr; `Logger` in der Signatur; die geworfene Transaktion wird protokolliert und als Ergebnis gemeldet |
| `apps/local-api/src/app.ts` | `createEmailAttachmentIntake(context, runtime.logger)`; dazu die überholte Zusage an der Add-in-Fläche berichtigt |
| `apps/local-api/openapi/takt-local-api.yaml` | drei überholte Zusagen berichtigt; dazu E-111 an `rejected` beschrieben |
| `docs/architektur.md`, `docs/datenmodell.md` | beides nachgezogen |

## 5. Der Aufräumlauf beim Start (offene Frage 1 → ja)

`sweepOrphanedEmailFiles` nach dem Vorbild von `image-sweep.ts`, **zwei Ordner, zwei Läufe**. Ein
gemeinsamer Lauf müßte die Dateien des jeweils anderen übergehen und hätte damit eine Gelegenheit
mehr, Material mit Eigentümer zu löschen.

**Auflage 1 — nie eine Datei löschen, auf die eine Zeile zeigt.** Vier Sicherungen, jede allein
genügt zum Verschonen: die Artenprüfung **vor** allem anderen (eine vierte Anhangsart, die
ebenfalls eine Datei in diesem Ordner besäße, machte `kind = 'file'` zu einer zu engen Frage — und
eine zu enge Frage ist hier ein Löschbefehl); `listEmailFiles` nennt nur Namen, die der Adapter
erzeugt haben könnte; die Abfrage wird **gefragt**, und nur ihre Antwort macht eine Datei zur
Waise; `removeEmailFile` mißt die Form noch einmal. Die Reihenfolge ist Teil des Nachweises: erst
das Verzeichnis lesen, dann den Bestand fragen — so überlebt eine Übernahme, die zwischen beiden
Schritten ihre Zeile bekommt.

**Ein Fallstrick, den dieser Lauf anders löst als der für Bilder:** `listEmailFiles()` liefert
**Namen**, `todo_attachment.target` trägt bei einer übernommenen Datei den vollen **Pfad**. Der
Lauf rechnet jeden Namen über `emailFilePathOf()` in die Form um, in der der Bestand führt, und
fragt mit dieser. Wer hier Namen gegen Pfade hielte, bekäme auf jede Frage „unbekannt" und leerte
bei jedem Start das ganze Verzeichnis — „geprüft wird, was benutzt wird", mit umgekehrtem
Vorzeichen. Ein Name ohne Pfad fällt **ganz** heraus: weder gefragt noch entfernt.

**Auflage 2 — die Untergrenze.** Der Rückgabewert ist kein `number`, sondern
`EmailFileSweepReport` mit `read`, `owned`, `removed` und `refused`. Damit ist „null Waisen" von
„null gelesene Dateien" unterscheidbar, und `refused` nennt den Grund als geschlossenen Vorrat
(`unknown_kinds`, `contradiction`, `unavailable` oder `null`) statt als Text. Eine Messung kann die
Untergrenze aufspannen — „er hat drei Dateien gesehen" — und die Null daneben als Aussage lesen.

**Der Widerspruchsriegel** steht wie beim Bildlauf: Ist die Antwort leer, wird `emailFileCount()`
gefragt; führt der Bestand übernommene Dateien und gehört ihm trotzdem keine der liegenden, wird
**nicht** aufgeräumt. Beide Abfragen laufen über **dieselbe** Bedingung
(`origin = 'email' AND kind = 'file'`) — käme die Zahl woanders her, wäre der Widerspruch keiner
mehr. `emailFileCount()` wirft in seiner unmöglichen Lage (`COUNT(*)` ohne Zeile) ausdrücklich,
statt `0` zu liefern: eine `0` von dort öffnete genau den Riegel, für den die Zahl gebaut ist.

**Was der Lauf nicht kann.** Er räumt **beim Start**, nicht sofort — eine Datei aus einem harten
Abbruch liegt bis zum nächsten Start. Er urteilt nicht über Dateien, deren Name nicht die erzeugte
Form hat (im Zweifel liegen lassen). Und er trägt **keinen** eigenen Riegel gegen einen zweiten
gleichzeitig laufenden Dienst: dieselbe Zusage wie beim Bildlauf, sie hängt an
`tauri_plugin_single_instance` in der Hülle und daran, daß er vollständig läuft, bevor der Dienst
zuhört. Das steht so im Kopf beider Dateien.

## 6. Kein 500, wenn das Todo steht (offene Frage 2 → nein, E-111)

Der Wurf wird nicht mehr weitergereicht. Nach dem Aufräumen wird jede geplante Zeile **namentlich**
mit `rejected` gemeldet, `attached` ist leer, und die Antwort bleibt 201. Die Regel, die im
Quelltext und in `docs/architektur.md` daneben steht: **Eine Antwort darf den Aufrufer nicht dazu
bringen, etwas zu wiederholen, das bereits geschehen ist.**

`rejected` und kein zehnter Wert: Es ist zeichengleich die Kennung, die eine **einzelne**
gescheiterte Zeile bekommt, und sie stimmt aus demselben Grund — die Bytes waren da, die Zeile
nicht. Der Benutzer kann in beiden Fällen genau dasselbe tun. A-19.30b verlangt eigene Kennungen
für **Grenzen**, nicht für Innenleben.

**Der Wurf verschwindet nicht.** Er geht mit Stufe `error` ins Protokoll, Grund
`attachment_email_rows_threw rows=… files=…`, und das ist die einzige Stelle dieser Naht, die
`error` benutzt — der Unterschied zwischen einem Ergebnis und einem Defekt steht damit in der
Zeile selbst. **Was nicht in der Zeile steht, ist der Wurf im Wortlaut**, und das ist keine
Nachlässigkeit: `Logger` hat strukturell keinen Parameter für ein Ausnahmeobjekt, `error.message`
trägt bei einem Dateisystem- oder SQLite-Fehler regelmäßig einen Pfad, und der Grund läuft durch
einen engen Zeichenvorrat (B-2.4, T-132). Wenn „in voller Schärfe" mehr heißen soll als Stufe,
Grund und Zahlen, braucht es einen eigenen Diagnosekanal — eine Entscheidung über die
Betriebsschicht, die ich hier nicht still treffen sollte (neue offene Frage 6).

**Der `Logger` steht jetzt in der Signatur** von `attachEmailToNewTodo` (viertes Argument) und von
`createEmailAttachmentIntake`, **nicht** im `AppContext`. Begründung im Quelltext: `AppContext`
trägt Ports — Dinge, die die Funktion benutzt, um ihre Arbeit zu tun. Das Protokoll gehört nicht
zur Arbeit. Wer die Signatur liest, sieht, daß ausgerechnet diese Naht etwas zu protokollieren hat,
was für keine ihrer Nachbarinnen gilt. Der exportierte Fähigkeitstyp `EmailAttachmentIntake` ist
unverändert; die Add-in-Routen merken nichts davon.

## 7. Vier überholte Zusagen in meiner Hoheit (aus T-311)

Alle vier behaupteten als **geltende Regel**, über das Add-in entstehe kein Anhang. Sie sind
berichtigt, und zwar jede mit dem Halbsatz, der geblieben ist — „an einem **vorhandenen** Todo
entsteht keiner" — statt mit einer Streichung:

| Stelle | vorher | jetzt |
|---|---|---|
| `apps/local-api/src/app.ts:314-316` | „Anhängen darf er nicht … Es gibt dafür keine Route mehr" | halbierte Fassung von A-19.19, mit dem Weg über `POST /addin/todos` und der Begründung am Typ (keine `TodoId` in der Naht) |
| `openapi …:145` | „kein Anhang irgendeiner Art (A-19.19, F-21)" | „an einem vorhandenen Todo kein Anhang", dazu, daß die fünfte Route nicht wiedergekommen ist |
| `openapi …:3471` | „Über diese Route entsteht weiterhin **kein Anhang**" — direkt an der Route, die das Gegenteil tut | „Seit T-304 entstehen über diese Route Anhänge", mit dem Verweis auf `attachments` |
| `openapi …:4313` | Token „kann überhaupt keinen Anhang anlegen, lesen oder löschen" | was das Token wirklich kann und was nicht: anlegen im selben Ruf ja, fremden Anhang lesen, ändern oder entfernen nein |

Die fünfte Stelle in `app.ts` (Zeile ~364) habe ich geprüft und **nicht** angefaßt: Sie erzählt den
Stand richtig als Geschichte und ist bereits auf E-108 nachgezogen.

## 8. Das Tor, zum Schluß gemessen

| Schritt | Ergebnis |
|---|---|
| `typecheck` (alle `src`) | **grün** — domain, storage, export, local-api, web, desktop, outlook-addin |
| `typecheck:test` | **rot, vier Fehler**, alle in `packages/domain/test/email-attachment.test.ts`: `node:fs`, `node:path`, `node:url` und `import.meta.url` sind im Prüfprojekt der Domäne nicht typisiert |
| `boundaries` | **grün** — 482 Dateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `contrast` | **grün** |
| `proof:all` | **grün**, alle 22 Läufe (einzeln nachgemessen, einschließlich `proof:openapi` nach meinen Änderungen an der Beschreibung) |
| `verify:bundle` | **grün**, 19 bestanden |
| `vitest run` (ganzer Baum) | **grün**, 1798 Fälle, 3 übersprungen — einschließlich des neuen `email-attachments-rollback.test.ts` |
| `build` | **grün**, alle Pakete |
| `audit` | **grün** |
| `pnpm check` (vollständig) | **2**, bricht an `typecheck:test` ab — siehe zweite Zeile |

**Die vier Fehler gehören nicht mir, und ihre Behebung auch nicht.** Die Datei ist die des
unit-testers (T-312); sie liest seit heute das Dateisystem, um die Erreichbarkeit jedes Fehlgrunds
über die Quellverzeichnisse zu **messen** statt zu behaupten — dieselbe Messung, die ich in
Abschnitt 3 von Hand gefahren habe, jetzt als Wächter. Das ist die richtige Richtung. Nötig ist
`@types/node` im Prüfprojekt der Domäne, also eine Zeile in `packages/domain/tsconfig.test.json` —
und **alle `tsconfig*.json` der Pakete ändert der Orchestrator**. Ich habe die Datei deshalb nicht
angefaßt. Zwei Wege stehen offen: dort `"types": ["node"]` ergänzen, oder unit-tester findet die
Dateien ohne `node:`-Module. Der erste ist der richtige — ein Wächter, der die Platte mißt, darf
sie auch lesen dürfen.

## Was sich an den früheren Abschnitten geändert hat

- **Abschnitt 1, „Was dieser Weg nicht kann", Punkt 1** ist eingelöst: Der Aufräumlauf steht.
  Übrig bleibt die Verzögerung bis zum nächsten Start, und die ist der Preis dieser Bauart.
- **Abschnitt 1, Punkt 2** ist aufgehoben: kein 500 mehr, kein Duplikat.
- **Abschnitt 1, Punkt 3** ist aufgehoben: Die Naht protokolliert jetzt selbst, über den `Logger`
  in ihrer Signatur.
- **Die Naht für den Prüffall** hat sich um ein Argument geändert (`logger` als viertes). Der
  unit-tester hat das bereits nachgezogen — `email-attachments-rollback.test.ts` reicht einen
  echten `createLogger` hinein und liest die Zeilen mit. Das ist mehr, als ich beschrieben hatte:
  Der Wurf ist damit nicht nur nicht verschwunden, er ist **meßbar**.

## Offene Fragen, Stand jetzt

1. **Erledigt** — der Aufräumlauf steht.
2. **Erledigt** — kein 500 mehr (E-111).
3. `DISPLAY_ONLY_SKIP_REASONS`: von T-310 erledigt, `proof:addin` ist grün.
4. **E-110/E-111 in `decisions.md`.** A-19.30a/b decken die drei Grenzen; die Regel „eine Antwort
   darf den Aufrufer nicht zur Wiederholung bringen" steht jetzt in Quelltext und Architekturpapier
   und verdient einen Eintrag, weil sie über diesen Fall hinausreicht. `decisions.md` ändert der
   Orchestrator.
5. **A-24.7 gegen `DATA_ARCHIVE_VERSION`** (T-308 F-9): unverändert offen.
6. **Neu: Wie scharf darf das Protokoll werden?** Der Wurf steht heute als Stufe, Grund und zwei
   Zahlen im Protokoll, ohne seinen Wortlaut — B-2.4 und T-132 lassen nichts anderes zu. Wer den
   Wortlaut will, braucht einen eigenen Kanal mit eigener Schwärzung.
7. **Neu, für den security-checker:** Das Add-in-Token kann seit T-304 Dateien ins
   Anwendungsdatenverzeichnis schreiben — 25 Dateien à 25 MB je Ruf, begrenzt durch die drei
   Grenzen aus A-19.30a, **nicht** durch eine Gesamtmenge über die Zeit. Der Aufräumlauf beseitigt
   nur, was **keinen** Eigentümer hat; wer mit gültigem Token Todos anlegt, gibt den Dateien einen.
   Das ist keine neue Fläche aus T-309, aber sie ist mit dem Aufräumlauf erstmals vollständig
   beschreibbar und gehört ins Bedrohungsmodell.

## Nächster Schritt, Stand jetzt

Eine Zeile in `packages/domain/tsconfig.test.json` (Orchestrator), und `pnpm check` ist vollständig
grün. Danach: Freigabeprüfung durch code-reviewer und spec-ux-reviewer über die zweite Runde, und
der security-checker über die Fläche aus offener Frage 7 — der Aufräumlauf löscht Dateien im
Anwendungsdatenverzeichnis, und das ist eine Fläche, die er gesehen haben sollte, bevor sie
freigegeben wird.
