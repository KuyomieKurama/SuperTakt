# T-159 — Nacharbeit aus dem Qualitätstor

**Rolle:** domain-dev **Datum:** 2026-09-05

---

Aufgabe: T-159 — Nacharbeit aus dem Qualitätstor: vier Zweige, ein verschluckter Fehlschlag,
zwei Zeilen, eine Beschreibung
Status: fertig

---

## Befund für Befund

| Befund | Ergebnis | Messung |
|---|---|---|
| **O-CD** `attachment.ts:289` (`codePointAt(0) ?? -1`) | **behoben** — Hauskommentar daneben, Code unverändert | `pnpm test:coverage`: Zeile jetzt 311, weiterhin unabgedeckt und ausdrücklich als Übersetzerzweig benannt |
| **O-CD** `attachment.ts:320` (`codePointAt(0) ?? 0`) | **behoben** — derselbe Satz, plus der Zusatz, warum der Ersatzwert hier an einer *Grenze* steht | Zeile jetzt 348; unverändert unabgedeckt |
| **O-CD** `attachment.ts:678` (`if (host !== '')`) | **behoben, und zwar durch Streichen** — `return new PlatformUrl(parsed.url).hostname;` | `pnpm test` 1359/1359; `attachment.ts` Zweigabdeckung 96,62 %, Zeilen 100 %; die unabgedeckten Zeilen sind von vier auf drei gefallen |
| **O-CD** `attachment.ts:419` (`url.hostname === ''`) | **bleibt, Begründung berichtigt** | `node -e "new URL('https:///pfad').hostname"` → `'pfad'`; `new URL('https://')` wirft; `new URL('takt:///pfad').hostname` → `''` |
| **O-CD** `repo-attachments.ts:157` | **nicht angefasst** — echter Wächter, wie beurteilt | — |
| **O-CT** `attachment-store.ts:320` (`removeImage` verschluckt alles) | **behoben, beide Wege** — Wert **und** Protokollzeile | `pnpm typecheck` 0; `REASON_SHAPE`-Probe für `attachment_image_remove_failed` → `true` (nicht `unclassified`) |
| **O-CT** `attachment-store.ts:161` (falsche Ursache in der Meldung) | **behoben** — `write_failed` statt `unreadable`, plus Protokollzeile | Kein Prüffall und kein Nachweispfad hing an `unreadable`; 7 Nachweisläufe grün |
| **O-CE** `proof-openapi.mjs` (zwei Einzelimporte, falscher Kommentar) | **behoben** | `pnpm run proof:openapi` 110/0 — vorher wie nachher |
| **O-CC** `docs/datenmodell.md` führt 0014/0015 nicht | **behoben** | 0 → 15 → 13 → 15 gegen einen Bestand mit Inhalt selbst gefahren; jede Zahl im Dokument aus `sqlite_master` gezählt, nicht aus einem Bericht übernommen |

---

## Artefakte

| Datei | Was |
|---|---|
| `packages/domain/src/attachment.ts` | vier O-CD-Stellen: zwei Hauskommentare, eine gestrichene Zeile, eine berichtigte Begründung; dazu ein Hinweis an `ALLOWED_SCHEMES` und am Schlüssel `link_host_missing` |
| `packages/storage/src/ports.ts` | `removeImage` gibt `Promise<ImageRemoval>` statt `Promise<void>`; neuer Typ `ImageRemoval` (`removed` \| `unknown_name` \| `failed`) |
| `apps/local-api/src/access/attachment-store.ts` | `removeImage` meldet und protokolliert; `ensureDirectory` protokolliert; „kein Zielverzeichnis" ergibt `write_failed` statt `unreadable`; der Adapter nimmt einen `Logger` |
| `apps/local-api/src/composition.ts` | der Protokollschreiber wird durchgereicht; der Kommentar zu `appDataDir` sagt jetzt das Richtige |
| `apps/local-api/src/usecases/attachments.ts` | zwei Aufrufstellen: warum die Antwort an den Benutzer trotzdem nicht kippt |
| `apps/local-api/src/usecases/todos.ts` | dieselbe Begründung für die Schleife in `removeTodo` |
| `apps/local-api/scripts/proof-openapi.mjs` | `REQUEST_SCHEMAS as ADDIN_SCHEMAS`, `...ADDIN_SCHEMAS`, Kommentar berichtigt |
| `docs/datenmodell.md` | Kopfstand, Übersichtsbild, Migrationszählung, `todo.due_date` in 3.2, neuer Abschnitt 3.8, Abschnitt 7 um Frist und Anhänge, 8.4i und 8.4j, sechs Zeilen in „Nachgewiesen", drei Zeilen in Abschnitt 9, vier Zeilen in „Was bewusst *keine* Tabelle ist" |

---

## Zusammenfassung

Die vier von T-155 beurteilten Verzweigungen sind jetzt das, wofür der Review sie erklärt hat:
`:289` und `:320` tragen den Hauskommentar aus `base64.ts`, `:678` ist verschwunden (die Zusage
stand drei Funktionen entfernt schon einmal), und `:419` bleibt — mit einer Begründung, die
gemessen stimmt statt einen Fall zu nennen, den sie gar nicht fängt. Der verschluckte Fehlschlag
in `removeImage` erreicht jetzt **beide** Empfänger: den Aufrufer als Wert aus geschlossenem
Vorrat und das Protokoll als Zeile mit dem erzeugten Namen; die Antwort an den Benutzer bleibt
`ok`, weil der Anhang tatsächlich entfernt ist. Ein eigenes Verzeichnis, das sich nicht anlegen
lässt, sagt nicht mehr „Diese Datei lässt sich nicht lesen", sondern „Das Bild konnte nicht
abgelegt werden" — und schreibt den Grund ins Protokoll. `docs/datenmodell.md` führt die beiden
Tabellen und die Spalte samt Rückwärtsrichtung, und jede Zahl darin ist selbst gezählt.

---

## Annahmen

1. **`:678` gestrichen statt kommentiert.** T-155 bot beides an. Ich habe gestrichen, weil der
   Auftrag die drei Stellen als „Kommentare in Codeform" zusammenfasst und sagt, ich soll sie
   „als das behandeln, was sie sind" — bei `:289`/`:320` erzwingt der Typ die Zeile, bei `:678`
   nicht. Die Kopplung ist damit nicht verschwunden, sondern benannt: An beiden Enden steht
   jetzt ein Satz, der auf das andere zeigt. **`attachmentLabel` selbst ist unangetastet** —
   Signatur, Rückfälle, Reihenfolge, der Kopfkommentar. Für `http`/`https` ändert sich kein
   einziger Rückgabewert.
2. **`removeImage` meldet *und* protokolliert.** Der Auftrag verlangte „nicht beides nicht". Ich
   habe beides gebaut, aber an getrennten Orten: Der Adapter protokolliert (er kennt den Grund),
   der Port trägt den Wert (der Aufrufer könnte handeln). Die drei Aufrufstellen **handeln
   nicht** — sie werten den Wert bewusst nicht aus, und jede sagt in einem Kommentar, warum:
   Aus einem gelungenen Vorgang einen Fehlschlag zu machen wäre die schlechtere Auskunft.
3. **Der Adapter bekommt einen `Logger`.** Das ist neu in `access/` — kein anderer Adapter dort
   führt einen. Begründung im Dateikopf: Er ist der einzige, der etwas *hinterlassen* kann,
   und ein misslungenes `rm` hat sonst keinen Empfänger. Die Alternative wäre ein `logger` im
   `AppContext` gewesen; die habe ich verworfen, weil sie jeden Anwendungsfall zum möglichen
   Protokollschreiber macht, um genau eine Zeile unterzubringen.
4. **Der erzeugte Dateiname steht in der Protokollzeile.** Er ist nach A-A-17 aus `randomUUID()`
   erzeugt und hat keinen Bezug zur Quelldatei — ohne ihn wäre die Zeile nicht verwertbar. Der
   `errno` und der Pfad bleiben draußen (B-2.4). Der Schlüssel im Feld `reason` ist gegen
   `REASON_SHAPE` geprüft.
5. **„Kein Ort eingerichtet" liefert jetzt ebenfalls `write_failed`.** Der Review nannte nur den
   Fehlschlag von `mkdir`. Ich habe beide Wege gleichgezogen, weil derselbe falsche Satz an
   beiden hing: Die Datei des Benutzers ist in beiden Fällen tadellos. Gemessen: kein Prüffall,
   kein Nachweispfad und keine Oberflächenstelle hing an `unreadable` für Bilder.
6. **Zahlen im Datenmodell selbst gezählt.** Ich habe die Angaben aus T-146 und T-151 nicht
   übernommen, sondern `sqlite_master`, `EXPLAIN QUERY PLAN`, die CHECK- und RESTRICT-Wachen und
   den Rückweg mit Inhalt neu gefahren. Zwei Stellen habe ich dabei anders geschrieben, als sie
   nahelagen: Der GLOB weist `2026-9-3` ab, aber `2026-02-30` besteht ihn (die Existenz prüft
   die Domäne), und `ix_todo_attachment_image` bedient **nicht** `imageTargets(todoId)` — das
   tut `ix_todo_attachment_todo`, gemessen mit `EXPLAIN QUERY PLAN`.

---

## Gemessen

```
pnpm typecheck                 Exitcode 0 (alle acht Pakete, typecheck:test, typecheck:e2e)
pnpm test                      69 Dateien, 1359/1359
pnpm test:coverage             keine Schwellenverletzung; attachment.ts 99,03/96,62/100/100,
                               unabgedeckt: 311, 348, 473 — genau die drei Zeilen, die
                               unerreichbar sind und es jetzt auch dokumentiert sagen
pnpm run proof:openapi         110 bestanden, 0 fehlgeschlagen
pnpm run proof:migrations      migrations.embedded.ts ist aktuell (30 Dateien)
pnpm run proof:callers         32 / 0
pnpm run proof:db-permissions  17 / 0
pnpm run proof:codepoints      45 / 0
pnpm run proof:access          105 / 0
pnpm run proof:export          97 / 0
pnpm run proof:export-api      69 / 0
pnpm run proof:route-policy    40 / 0
pnpm run proof:template-fields 30 / 0
pnpm run proof:tags            42 / 0
pnpm run proof:conflicts       149 / 0
```

Kein Playwright, kein Entwicklungsserver.

**Der Migrationsrundgang, selbst gefahren** (Node 22.23.2, `node:sqlite`, alle Vorwärtsdateien
aus `packages/storage/migrations`):

| Schritt | Gemessen |
|---|---|
| 0 → 15 | 19 Tabellen, 37 benannte Indizes, 17 Trigger, 1 Sicht; `integrity_check` = ok |
| nach 0013 / 0014 | 17/34/17/1 → 17/35/17/1 — 0014 bringt genau einen Index und keinen Trigger |
| Bestand angelegt | ein Todo mit Frist `2026-09-30`, internem Vermerk, einer Buchung, drei Anhängen (Verweis, Datei, Bild) |
| 15 → 13 | kein Rest von `todo_attachment*` in `sqlite_master`, keine Spalte `due_date`; Todo, Vermerk und Buchung unversehrt |
| 13 → 15 | beide Tabellen wieder da, `todo_attachment_kind` wieder mit drei Zeilen; Frist `NULL`, Anhänge 0 — **genau der angesagte Verlust, nicht mehr**; 19/37/17/1, `integrity_check` = ok, `foreign_key_check` leer |
| Wachen am Adapter vorbei | `due_date='2026-9-3'` → CHECK; `due_date='2026-02-30'` → **durch** (Domäne prüft die Existenz); `kind='video'` → FK; `DELETE` einer benutzten Art → FK (RESTRICT); einer unbenutzten → durch; `DELETE` des Todos → Anhangszeilen gehen mit (CASCADE), Dateien nicht |
| Zugriffspfade | Fristsortierung: `COVERING INDEX ix_todo_due_date`; `imageTargets` und Anhangsliste: `ix_todo_attachment_todo`; Suche nach Bildnamen: `ix_todo_attachment_image`. Kein `SCAN` |

**Die berichtigte Begründung, gemessen** (Node 22.23.2, WHATWG-URL):

```
new URL('https:///pfad').hostname  === 'pfad'    ← der Fall, den der alte Kommentar behauptete
new URL('https://')                 wirft         ← leerer Wirt ist für special schemes unerreichbar
new URL('takt:///pfad').hostname   === ''        ← der Fall, für den der Zweig wirklich dasteht
```

---

## Risiken

1. **Eine Signaturänderung an einem Port, die keinen Prüffall rot gemacht hat.** `removeImage`
   gibt jetzt einen Wert zurück; gemessen hat **keine** Testdatei und kein Nachweispfad diesen
   Port je nachgebaut (`grep` über `apps/*/test`, `packages/*/test`, `tests/`: kein Treffer auf
   `AttachmentBlobPort`, `removeImage`, `attachmentBlobs`). Das ist bequem und zugleich der
   Befund: Der Port hat **keine** Attrappe und **keinen** eigenen Prüffall. Die drei neuen Wege
   (`removed`, `unknown_name`, `failed`) sind damit unbeobachtet. Vorschlag steht unten.
2. **Sicherheit — der Wortlaut der neuen Protokollzeile.** Sie enthält den erzeugten Dateinamen.
   Er ist nach A-A-17 gegenstandslos für den Kunden, aber er ist ein Wert im Protokoll, und
   dieses Vorhaben hat dafür eine Regel (B-2.4). Ich habe ihn in die **Meldung** gelegt und nicht
   in `reason`, damit der geschlossene Schlüsselvorrat geschlossen bleibt; wer das anders
   bewertet, streicht den Namen und verliert die Verwertbarkeit der Zeile. Das gehört an
   security-checker.
3. **Der Rückweg von 0015 lässt Bildkopien liegen.** Unverändert wahr, jetzt aber an zwei
   Stellen niedergeschrieben (Migrationskopf und 8.4j) statt an einer. Der Satz „wer diesen
   Rückweg fährt, räumt `attachments` von Hand" ist eine Handlungsanweisung an einen Menschen
   und keine Maßnahme — das bleibt ein offener Rest, der ins Entwicklerhandbuch gehört.
4. **`docs/datenmodell.md` und `docs/glossar.md`.** Der documenter hatte in T-151 die 19 Tabellen
   bereits im Glossar geführt, während dieses Dokument noch 17 sagte. Die beiden stehen jetzt
   wieder gleich; wer das eine ändert, prüft das andere.

---

## Offene Fragen an den Orchestrator

1. **Wer misst `removeImage`?** Die drei Rückgabewerte sind heute unbeobachtet (Risiko 1). Der
   Prüffall braucht keine echte Datei: ein Verzeichnis ohne Schreibrecht oder ein `rm`, das auf
   ein Verzeichnis statt auf eine Datei zeigt, genügt für `failed`; `unknown_name` ist ein Name,
   der `GENERATED_NAME_SHAPE` verfehlt. Das ist unit-tester-Hoheit
   (`apps/local-api/test/access/…`), und ich habe die Datei bewusst nicht angelegt.
2. **Der Kommentar an `link_host_missing` verweist auf die Prüfzeile statt sie zu wiederholen.**
   Ich habe die Begründung an genau **einer** Stelle stehen lassen und am Schlüssel nur den
   Verweis. Wenn das Haus lieber beide Stellen ausschreibt, sage ich es und ziehe nach — aber
   zwei Begründungen sind zwei Gelegenheiten, dass eine falsch wird, und genau das war dieser
   Befund.
3. **Soll das Aufräumen verwaister Bildkopien beim Start eine eigene Aufgabe werden?**
   `ix_todo_attachment_image` ist dafür schon gebaut (Migration 0015 sagt es ausdrücklich), und
   seit heute gibt es mit `failed` einen Anlass, der im Protokoll steht. Heute räumt niemand auf.

---

## Nicht getan, wie beauftragt

- **`attachmentLabel` nicht umgebaut** (O-CR/T-157). Ich war in derselben Datei, aber an anderen
  Zeilen: `:678` liegt im `link`-Zweig, Signatur und Rückfälle sind unverändert. Der Nachtrag zu
  O-CU (Blindheit gegen einen nachgestellten Punkt in der Endung, R-21) ist **nicht** angefasst
  und wartet auf die nächste Welle.
- **Die Suche nach dem Vermerk (O-CP, C-22) nicht gebaut.**
- **Keine fremde Datei angefasst.** `apps/web/**`, `apps/desktop/**`, `apps/outlook-addin/**`,
  `apps/local-api/src/routes/addin/**`, `packages/export/**` und alle Testordner sind
  unverändert. Während meines ersten `pnpm typecheck` stand `apps/web/src/lib/attachmentLabel.ts`
  mit einem `TS6133` (ungenutzter Import `domainAttachmentLabel`) — das war frontend-dev mitten
  in T-157; beim zweiten Lauf war es weg. Ich habe die Datei nicht berührt.

---

## Nächster Schritt

**Ein Prüffall für `removeImage` in der nächsten Welle**, zusammen mit dem O-CU-Nachtrag an
`attachmentLabel`. Beide sind klein, beide hängen an keiner anderen Aufgabe, und beide betreffen
Code, den diese Welle angefasst hat — sie gehören zusammen an unit-tester beziehungsweise an
mich, in derselben Welle, aber nicht in dieselbe Datei.

Danach: die Suche nach dem Vermerk (O-CP), und zwar mit der Herkunft des Treffers im
Antwortkörper, bevor die Oberfläche daran arbeitet. Ich schlage vor, dass ich dafür zuerst den
**Antworttyp** entwerfe und ihn zur Entscheidung vorlege, statt Route und Anzeige parallel zu
bauen — E-038 ist zweimal an genau dieser Naht verfehlt worden.
