# T-179 — Review über Welle Y (T-167, T-168, T-169, T-173)

**Rolle:** code-reviewer **Datum:** 2026-09-05 **Zweig:** `versionspruefung-gegen-github`
**Gegenstand:** T-167, T-168, T-169, T-173 aus Welle Y; die zwei benannten Punkte O-EB und
O-EJ; drei Schwerpunkte. Mitgelesen, weil sie denselben Gegenstand berühren: T-178, T-174
(fertig) und T-175 (Baustelle).

---

## Urteil

**Nacharbeit.** Es blockieren **B-1** und **B-2**. Beide haben dieselbe Wurzel: `image-sweep.ts`
ist der einzige Ort im Erzeugnis, der Kundenmaterial ohne einen Klick löscht, und er ist in
**beide** Richtungen ungemessen — kein Prüffall, und der eine End-zu-Ende-Fall, der ihn sehen
müßte, läuft gegen einen Einstiegspunkt, der ihn gar nicht ausführt.

Nicht blockierend, aber vor der Freigabe zu erledigen: vier Auflagen. Acht Hinweise.

**Dateihoheit: kein Verstoß in Welle Y.** T-167 hat in `attachment.rs` ausschließlich den
Produktivteil angefaßt (`#[cfg(test)]` unverändert, gegen `git diff` gelesen), T-168 blieb in
`packages/domain`, `packages/storage`, `apps/local-api/src`, T-169 in `apps/outlook-addin`,
T-173 in `apps/desktop/scripts`. Eine Randbemerkung dazu unter H-9.

---

## Meßstand, selbst gefahren (kein `proof:all`, E-083 Punkt 3)

| Lauf | Ergebnis |
|---|---|
| `pnpm test` | **1402 von 1402**, 71 Dateien, Exit 0 |
| `pnpm typecheck` | Produktivteil **grün** (alle acht Projekte „Done"). Rot ist allein `apps/local-api/test/access/attachment-store.test.ts` (4 × TS6133) — unit-testers laufende Arbeit, nicht `FormDialog.tsx` |
| `pnpm run proof:shell-surface` | grün, 6 Prüfungen und 23 Gegenproben, 0 blind |
| `pnpm run proof:addin` | 221 / 0 |
| `pnpm run proof:foreign` | 14 / 0 |
| `pnpm run proof:codepoints` | 45 / 0 |
| `pnpm run boundaries` | grün |
| `node --experimental-strip-types` gegen `packages/domain/src/attachment.ts` | Meßwerte unter A-1 |
| `node` gegen `hono@4.13.4` (`app.fetch`, kein Port) | Meßwerte unter H-3 |

---

## 1. Blockierende Befunde

### B-1

```
apps/local-api/src/usecases/image-sweep.ts:105   hoch   Eine leere Antwort des Bestands ist von "alles ist verwaist" nicht unterschieden.
```

**Fall.** `knownImageTargets` liefert eine leere Menge, obwohl der Bestand Bildanhänge hat.
Erreichbar ohne jeden Fehler im heutigen Code: Die Abfrage lautet
`WHERE a.kind = 'image' AND a.target IN (…)` (`packages/storage/src/sqlite/repo-attachments.ts:206`).
Wer künftig in `target` einen Unterordner mitspeichert (`2026/4a…c1.png`) oder `kind` umbenennt,
bekommt für **jeden** gefundenen Namen „nicht bekannt". `sweepOrphanedImages` löscht daraufhin
den ganzen Bildbestand des Benutzers, und die einzige Spur ist eine `info`-Zeile mit einer Zahl.
Die Riegel greifen dagegen nicht: Die Form stimmt ja (der Name kommt aus `listImages`), und
`removeImage` mißt dieselbe Form ein zweites Mal.

Der Kopfkommentar sagt „`knownImageTargets` wird **gefragt**, und nur eine Antwort ohne den Namen
macht ihn zum Waisen. Bleibt die Antwort aus, wird nichts entfernt" (Zeile 34). Das trägt für
einen **Wurf** — nicht für eine leere Antwort, und die leere Antwort ist der Fall, der weh tut.

**Fix.** Die Antwort muß widersprechbar sein. Konkret: `knownImageTargets` gibt zusätzlich die
Gesamtzahl der Bildanhänge zurück (`SELECT count(*) FROM todo_attachment WHERE kind='image'`,
derselbe Teilindex). Gilt `total > 0 && known.size === 0 && found.length > 0`, ist das kein
Fund von Waisen, sondern ein Widerspruch: Zeile ins Protokoll
(`attachment_image_sweep_disagreement`), **nichts** löschen. Zusätzlich: Prüffälle über die drei
eingehängten Funktionen — der Baustein ist ausdrücklich dafür gebaut („ohne Datenbank, ohne
Dateisystem und ohne laufenden Dienst prüfbar", Zeile 71) und hat heute **null** Prüffälle
(`apps/local-api/test/usecases/` enthält keinen; `grep -r sweepOrphanedImages test/` ist leer).

### B-2 (das ist O-EB)

```
tests/e2e/support/services.ts:169        hoch   Die Hauptreihe mißt einen nachgebauten Start, dem seit T-168 ein Schritt fehlt.
tests/e2e/support/version-check-entry.ts:198   hoch   `compose()` hier, `main()` dort: die zweite Naht, an der ein Feld fehlen kann.
```

**Fall.** `attachment-persistence-live.spec.ts:68` startet den Dienst mit demselben Bestand neu
und prüft danach, daß das Vorschaubild eines Bildanhangs weiterhin da ist (`:87`,
`toHaveAttribute('src', /^data:image\//)`). Genau dieser Fall müßte einen zu eifrigen
Aufräumlauf fangen — B-1 in freier Wildbahn. Er kann es nicht: `restartLocalApi` startet
`version-check-entry.ts`, und dort läuft `sweepOrphanedImages` nicht. Ein Aufräumlauf, der beim
Neustart jedes Bild löscht, läßt diesen Prüffall **grün**.

Dasselbe gilt für die drei anderen Schritte, die dieser Einstiegspunkt ausläßt (Rechteprüfung,
Aufräumen der Exportdateien, Aufgabenbereich auf 17844). Der Kommentar `:49-57` zählt sie auf und
begründet sie mit „Keiner der `TP-VER`-Fälle braucht das". Seit T-166 trägt die Datei aber
**alle** Fälle des Bestands, und für die gilt die Begründung nicht.

**Die Antwort steht schon im Bestand, aus derselben Feder.** `apps/local-api/scripts/proof-access-entry.ts:36-52`
zieht die Grenze wörtlich: „`version-check-entry.ts` baut einen zweiten Start nach, und das war
dort richtig: Der E2E-Lauf braucht **weniger** als der echte Start … Hier ist es umgekehrt …
Ein nachgebauter Start wäre ein zweiter Weg, der vom echten abweichen kann, ohne daß ein Fall es
mißt." Dieselbe Zusage steht in `apps/local-api/src/main.ts:88-96`. Mit T-166 ist die
Hauptreihe in genau die Lage geraten, für die dieser Absatz „umgekehrt" sagt — und T-168 hat den
Beweis eine Welle später geliefert.

**Fix.** `spawnLocalApi` startet einen Einstiegspunkt, der `main({ releaseSource:
createGithubReleaseSource({ fetch: wrappedFetch }) })` ruft — Zeile für Zeile die Bauart von
`proof-access-entry.ts:90`. Dann entfällt die handgeschriebene `http`-Brücke
(`version-check-entry.ts:106-147`) samt ihrem Grund (`@hono/node-server` ist aus
`apps/local-api/src/main.ts` heraus auflösbar, nur nicht aus `tests/e2e/**`), es gibt keinen
zweiten `compose()`-Aufruf mehr, an dem ein Feld fehlen kann — und die Klasse des `appDataDir`-
Fundes ist strukturell zu, nicht durch Aufmerksamkeit. Die `TP-VER`-Reihe kann denselben
Einstiegspunkt benutzen; sie braucht nichts, was `main()` nicht tut.

**Solange das nicht geschieht**, gehört an `version-check-entry.ts:49` eine Liste, die gepflegt
wird — und ein Prüfpfad, der sie mißt (etwa: jeder `await`-Schritt zwischen Migration und
`listen` in `main.ts` ist hier entweder vorhanden oder namentlich ausgenommen). Eine Liste ohne
Messung ist genau das, was hier eine Welle lang falsch war.

---

## 2. Auflagen

### A-1

```
packages/domain/src/attachment.ts:695   hoch   `fileExtensionOf` und `has_indirect_extension` antworten verschieden, und zwei grüne Prüffälle behaupten beides.
```

**Gemessen**, nicht abgeleitet (`node --experimental-strip-types` gegen die Quelle):

```
"/home/nutzer/.lnk"      ext=""     Tür= {"ok":true,"path":"/home/nutzer/.lnk"}
"/home/nutzer/.desktop"  ext=""     Tür= {"ok":true,"path":"/home/nutzer/.desktop"}
"/home/nutzer/x.lnk"     ext="lnk"  Tür= {"ok":false,"reason":"path_indirect_extension"}
```

Die Hülle urteilt anders: `has_indirect_extension` nimmt `rsplit_once('.')`
(`apps/desktop/src-tauri/src/attachment.rs:324`), und der Dateikopf sagt ausdrücklich, warum —
„Sie zählt auch bei einem führenden Punkt … für den Windows-Explorer ist es eine Verknüpfung"
(`:107-110`). Die Oberfläche urteilt wie die Hülle
(`apps/web/src/lib/attachmentLabel.ts:221`, `dot === -1`).

**Beide Seiten sind durch einen Prüffall festgenagelt, und die zwei widersprechen sich:**

* `apps/desktop/src-tauri/src/attachment.rs:763` — `assert!(has_indirect_extension(Path::new("/x/.lnk")))`,
  Begründung im Fall: „Name ist nur die Endung".
* `packages/domain/test/attachment.test.ts:421` — `expect(fileExtensionOf('/home/nutzer/.bashrc')).toBe('')`,
  Titel: „eine versteckte Unix-Datei (führender Punkt) hat KEINE Endung".

Beide grün. Und T-178 hat in derselben Welle darübergeschrieben: „Schritt für Schritt dieselbe
wie in `apps/desktop/src-tauri/src/attachment.rs` — **dieselben Fragen, dieselben Schlüssel,
dieselbe Folge**" (`packages/domain/src/attachment.ts:718-726`). Für Schritt 5 stimmt das nicht.

**Fall.** Eine Datei namens `.lnk`, `.url` oder `.desktop` wird an der Tür angenommen und liegt
im Bestand; die Hülle weist sie beim Klick mit `path_indirect_extension` ab. Kein Loch — die
tragende Kontrolle hält —, aber es ist genau die Auskunft, die T-178 an die Tür holen wollte,
und sie fehlt ausgerechnet dort.

**Fix.** `fileExtensionOf`: `dot <= 0` → `dot === -1`. Damit stimmen alle drei Fassungen überein.
Der Prüffall `:421` wird umgeschrieben (`.bashrc` → `bashrc`; steht auf keiner Liste, ändert
nichts), und `.lnk` fällt an der Tür mit dem Grund, den die Hülle ihm ohnehin gibt. Wer das
nicht will, schreibt die Ausnahme an **beide** Stellen und nimmt den Satz „dieselben Fragen"
zurück.

### A-2

```
apps/web/src/lib/attachmentLabel.ts:199   mittel   Die Doppelpunktregel steht zum dritten Mal von Hand da, obwohl die Domäne sie seit T-178 exportiert.
```

`hasStreamSeparator` ist eine private Abschrift von `hasPathStreamSeparator`
(`packages/domain/src/attachment.ts:674`), die T-178 exportiert hat. T-167 hat für die
Endungsliste selbst entschieden, was hier gilt: „ein Import ist billiger als ein Kommentar, der
eingehalten werden muß" (Bericht, Abschnitt 3).

**Fall.** Die Domäne verfeinert die Regel — etwa: ein Doppelpunkt an Stelle 2 eines
Windows-Laufwerkspfades ohne Trenner ist `path_not_absolute` und nicht `path_stream_separator`.
Die Oberfläche behält die alte Fassung, `foreseeableRefusalOf` sagt weiter „wird nicht geöffnet"
und baut **keinen Öffnen-Knopf** (`AttachmentOpenDialog.tsx:364`). Der Benutzer kann eine Datei,
die die Hülle öffnen würde, aus Takt heraus überhaupt nicht mehr öffnen — und niemand mißt es.
Schon heute weichen die Zerlegungen ab: Die Oberfläche trennt immer an beiden Trennern, die
Hülle an denen der laufenden Plattform.

**Fix.** `import { hasPathStreamSeparator } from "@takt/domain"` und die private Fassung
streichen. Semantisch identisch (letztes Namenssegment, beide Trenner).

### A-3

```
apps/web/src/components/FormDialog.tsx:267   mittel   Die Behebung von O-DZ hängt an einer Zeile, die nichts mißt — in einer Datei, die gerade umgebaut wird.
```

`{...(onBlur === undefined ? {} : { onBlur })}` ist die ganze Behebung; sie ist durch keinen
Prüffall gedeckt (`grep -rn onBlur apps/web/test tests/e2e` ist leer). Die Datei steht gerade
unter T-175 (`git diff --stat`: 215 Zeilen dazu, 135 weg).

**Fall.** Der Umbau behält `onBlur` in `TextFieldProps` (sonst würde `Attachments.tsx:465`
rot) und verliert die Weitergabe an das `<input>`. `typecheck` bleibt grün, 1402 Prüffälle
bleiben grün, und die Pflichtfeldmeldung ist wieder unerreichbar — wörtlich der Zustand, den
O-DZ beschreibt.

**Fix.** Vor T-175: ein Prüffall, der das leere Feld verläßt und die Meldung erwartet, dazu die
Gegenprobe „beim Tippen erscheint sie nicht" (unit-tester, `apps/web/test/**`).

### A-4

```
apps/desktop/scripts/proof-shell-surface.mjs:398   mittel   Die Blockgrenze wird auf einem Gerüst gezählt, das Zeichenliterale nicht kennt.
```

`stripCfgTestModules` zählt Klammern auf `stripRustStrings(stripRustComments(text))`;
`stripRustStrings` (`:321-350`) kennt nur `"…"` — **keine** Zeichenliterale (`'{'`, `'}'`) und
keine rohen Zeichenketten (`r#"…"#`).

**Fall.** Ein `'{'` in einem `#[cfg(test)]`-Modul: Die Tiefe kommt im Modul nie auf null, der
Ausschluß reicht bis zur nächsten schließenden Klammer **hinter** dem Modul. Steht dahinter noch
Produktivteil — ein weiteres Modul, eine Funktion —, wird er nicht mehr gemessen: ein
`.open()`-Aufrufort und eine fremde Adresse gingen dort still durch, und der Lauf bliebe grün.
Ein `'}'` dagegen beendet den Ausschluß zu früh; dann ist der Lauf rot aus dem falschen Grund,
also genau wieder der Meßfehler, den T-173 behoben hat.

Heute latent: alle fünf `#[cfg(test)]`-Module enden mit ihrer Datei, und kein `'{'`/`'}'`-Literal
steht im Rust-Anteil (nachgesehen). Die Zusage des Berichts — „Im Zweifel wird zu viel gemessen,
nie zu wenig" — trägt für Klammern in Kommentaren und Zeichenketten (dafür gibt es die dritte
Gegenprobe) und für diesen Fall nicht.

**Fix.** Im Gerüst zusätzlich die drei Zeichen langen Formen `'{'` und `'}'` leeren — eindeutig,
weil auf eine Lebensdauer (`&'a str`) nie ein zweites `'` folgt. Dazu eine vierte Gegenprobe:
Kunstquelle mit `'{'` im Prüfblock und einem `.open()`-Aufrufort dahinter; bestanden nur, wenn
der Aufrufort gemeldet wird.

---

## 3. Hinweise

```
apps/local-api/src/usecases/image-sweep.ts:124   niedrig   Der Kommentar verspricht eine Zahl, die in der Regel nicht geschrieben wird.
```
„Verschluckt wird deshalb nichts: … die Zahl darunter sagt, wie weit es gekommen war." Wirft der
erste oder zweite Schritt — der Regelfall eines Abbruchs, weil der Bestand nicht antwortet —, ist
`removed === 0`, und `if (removed > 0)` schreibt keine Zeile. Übrig bleibt ein Satz ohne Zahl.
Dazu: `catch {` bindet den Grund nicht, die Zeile kann also nicht sagen, welcher der drei
Schritte gefallen ist. **Fix:** im Abbruchzweig `files=${removed}` immer mitschreiben und den
Schritt im Schlüssel führen (`step=list|query|remove`).

```
apps/local-api/src/usecases/image-sweep.ts:111   niedrig   Scheitert jede Löschung, schweigt der Lauf selbst.
```
`'failed'` zählt nicht mit (richtig), und der Adapter schreibt seine eigene Zeile
(`access/attachment-store.ts:418`, mit dem erzeugten Namen — gedeckt durch `pathOf`). Aber der
Lauf selbst meldet dann gar nichts, und „nichts war verwaist" ist im Protokoll nicht von „nichts
ließ sich entfernen" zu unterscheiden. **Fix:** `failed` zählen und bei `> 0` eine Zeile.

```
apps/local-api/src/app.ts:309   niedrig   Der Kommentar nennt ein Beispiel, das die Zeile nicht liefert, und einen Rückfall, der nie läuft.
```
Gemessen gegen `hono@4.13.4` über `app.fetch` (kein Port): Bei gemountetem Unterbaum liefert
`routePath(c, -1)` den **ganzen** registrierten Pfad — mit `API_BASE_PATH = '/api/v1'` also
`/api/v1/todos/:id`, nicht `/todos/:id` wie im Kommentar und in der Tabelle des T-168-Berichts
(`Hono#route` verschmilzt über `mergePath`, es gibt keine zweite Zerlegung). Ohne Routentreffer
kommt `/*` heraus — der `app.use('*')`-Eintrag —, nie `''`; `|| '?'` ist damit unerreichbar,
also die Bauart, die dieses Vorhaben anderswo selbst als Fund führt (`unit-of-work.ts`, T-029:
„Er sähe aus wie eine Sicherung, liefe aber nie"). **Fix:** Beispiel berichtigen, Rückfall
streichen oder mit dem Fall begründen, für den er da ist (Wegfall der `*`-Kette).

```
apps/local-api/src/app.ts:309   niedrig   „kann gar keinen fremden Wert mehr tragen" gilt für die halbe Zeile.
```
`c.req.method` kommt weiterhin aus der Anfrage. Ungefährlich, weil der HTTP-Zerleger nur einen
geschlossenen Vorrat durchläßt und kein Zeilenumbruch möglich ist — aber der Satz ist eine
Stufe zu stark. **Fix:** halben Satz nachziehen.

```
tests/e2e/support/version-check-entry.ts:53   niedrig   Die Liste „was absichtlich fehlt" ist eine Welle alt.
tests/e2e/support/version-check-entry.ts:155  niedrig   Die Abbruchmeldung nennt die falsche Rolle und den falschen Aufrufer.
```
Die Liste nennt das Aufräumen der Bildkopien nicht, das T-168 in `main.ts:317` eingefügt hat
(siehe B-2). Die Meldung sagt, die Datei laufe „ausschließlich für den E2E-Testlauf der
Versionsprüfung (TP-VER-10 bis TP-VER-13), gestartet von version-check-services.ts" — seit T-166
startet `services.ts:169` sie für die ganze Hauptreihe. **Fall:** Wer einen fehlgeschlagenen
Start der Hauptreihe sucht, liest diese Zeile und sieht in der falschen Datei nach.

```
tests/e2e/support/services.ts:96   niedrig   `ensureGithubStub()` hat keinen Boden unter der Sorgfalt des Aufrufers.
```
Der Einling wird von `startLocalApi` und `restartLocalApi` mitgestartet; wer beide ohne
`stopServices` benutzt, muß `stopGithubStub()` selbst rufen. Heute halten beide Aufrufer
(`attachment-persistence-live.spec.ts:48`, `global-setup-web-build.ts:27`) — aber durch einen
Kommentar, nicht durch Bauart. **Fall:** Eine neue Prüfdatei ruft `startLocalApi` in
`beforeAll` und nur `kill('SIGTERM')` in `afterAll`; der lauschende Server der Attrappe
(`github-releases-stub.ts:67`, kein `unref()`) hält den Playwright-Arbeitsprozeß offen, der Lauf
endet nicht von selbst. **Fix:** `server.unref()` in der Attrappe — dann kann ein vergessenes
Schließen den Prozeß nicht mehr halten —, `stopGithubStub` bleibt für die Bestimmtheit.

```
packages/domain/src/attachment.ts:850   niedrig   Die längere Dateibeschriftung wandert in Dialogtext und Toast.
```
`attachmentLabel` ist auch die Beschreibung von „Anhang entfernen"
(`Attachments.tsx:697`) und der Text des Toasts (`:607`). Bei einem Pfad an der Feldgrenze
(4096 Zeichen, `Attachments.tsx:478`) steht er dort jetzt vollständig. **Fix:** Anzeige kürzt
den Klammerteil (frontend-dev/ui-designer), oder die Beschriftung deckelt den Ordner.

```
apps/desktop/scripts/proof-shell-surface.mjs:150   niedrig   Die Begründung des Aufrufortes nennt A-A-28 nicht.
```
`why: 'absoluter Pfad, kein UNC, keine Umleitungsendung, vorhanden (A-A-4, A-A-5)'` — seit T-167
prüft `check_file` zusätzlich den Doppelpunkt. Die Datei wurde während dieses Reviews von
anderer Seite geändert; ich habe sie nicht angefaßt und melde es als Baustelle.

```
docs/architektur.md   niedrig   Diese Datei hat in der Hoheitstabelle keinen Eigentümer.
```
T-168 hat Abschnitt 5.6a ergänzt. `CLAUDE.md` nimmt `architektur` ausdrücklich von documenter
aus und weist sie niemandem zu. Kein Verstoß — aber eine Lücke, die beim nächsten
gleichzeitigen Zugriff eine ist. Entscheidung des Orchestrators.

---

## 4. Die zwei benannten Punkte

### O-EB — trägt die doppelte Rolle?

**Nein, und der nächste Eingriff hat den Fehler schon gemacht.** Drei Belege:

1. **Die Datei sagt selbst, was ihr fehlt — und die Liste ist falsch.** `:49-57` zählt drei
   ausgelassene Schritte auf und begründet sie mit „Keiner der `TP-VER`-Fälle braucht das". Seit
   T-166 trägt die Naht alle Fälle; für die Hauptreihe gilt die Begründung nicht. Vierter,
   ungenannter Schritt seit T-168: der Aufräumlauf.
2. **Der Bestand kennt die richtige Bauart und ihren Grund.** `proof-access-entry.ts:36-52` und
   `main.ts:88-96` (beide T-146) sagen wörtlich, wann ein nachgebauter Start richtig ist und
   wann nicht: richtig, wenn der Lauf **weniger** braucht und etwas anderes mißt; falsch, wenn
   er **denselben Start** mißt — „ein zweiter Weg, der vom echten abweichen kann, ohne daß ein
   Fall es mißt". T-166 hat die Hauptreihe in die zweite Lage gebracht und die erste Begründung
   stehen lassen.
3. **Der Beweis liegt schon vor.** T-168 fügt `main.ts` einen Startschritt hinzu; die Naht, die
   die ganze Hauptreihe trägt, bekommt ihn nicht — und der einzige Prüffall, der ihn sehen
   könnte, ist gerade der über den Neustart mit Bildanhang (B-2).

Der `appDataDir`-Fund war kein Ausrutscher, sondern die Bauart: Zwei Aufrufe von `compose()`
nebeneinander heißen, daß ein Feld an einer Stelle fehlen kann, ohne daß etwas rot wird.
Empfehlung steht in B-2: **ein** Aufruf, `main({ releaseSource })`.

**`ensureGithubStub()`** trägt heute, aber nur, weil beide Aufrufer ohne `stopServices` daran
gedacht haben. Das ist keine Absicherung, das ist eine Merkregel. Der billigste Boden ist
`unref()` in der Attrappe (H-6); dann ist ein vergessenes Schließen eine Unsauberkeit und kein
hängender Lauf.

### O-EJ — gewollt oder mitgelaufen?

**Gewollt und begründet — aber nicht abgenommen.**

*Gewollt*, an drei Stellen unabhängig ausgeschrieben: T-168-Bericht 1.3, Annahme 3, offene Frage
2 an spec-ux-reviewer, und der Kopfkommentar der Funktion
(`packages/domain/src/attachment.ts:768-775`) trägt die Begründung mit. Das ist kein Mitläufer.

*Begründet*, und die Begründung trägt: X-04 formuliert die Bedingung als „zwei verschiedene
Anhänge tragen nie dieselbe Ersatzbeschriftung". Diese Bedingung erfaßt den Dateifall genauso wie
den Verweisfall — zwei Kundenordner mit je einer `rechnung.pdf` ergeben zwei Knöpfe „Datei
entfernen: rechnung.pdf", und der zweite löscht. Wer nur den `link`-Zweig ändert, erfüllt den
Befund und nicht seine Bedingung.

*Nicht abgenommen*: T-165 nennt die alte Wahl beim Dateifall **ausdrücklich richtig**, und der
Prüffall, der dabei umfiel, trägt die Gegenregel im Namen — „Datei ohne Titel: der Dateiname,
**nie der volle Pfad**" (`packages/domain/test/attachment.test.ts`, inzwischen von T-174
nachgezogen). Eine Regel, die ein Prüffall namentlich behauptet, kippt nicht der Umsetzende,
sondern der Prüfer, der sie aufgestellt hat. Die Frage liegt bei spec-ux-reviewer, richtig
gestellt; bis dahin gilt sie als offen, und die Folge steht als H-7.

Der Sonderweg beim `http://` (T-168 1.4, Abweichung von X-04 Auflage 1) ist derselbe Fall und
ebenso sauber gemeldet: Ohne ihn fällt die Umkehrbarkeit, auf der die ganze Zusage steht
(`http://a/b` und `https://a/b` bekämen dieselbe Beschriftung). Ich halte die Begründung für
zwingend; die Entscheidung bleibt beim Prüfer.

---

## 5. Die drei Schwerpunkte

### 5.1 Zwei Wahrheiten über dieselbe Sache

Die Doppelung ist gewollt und richtig begründet — `attachment.rs:110-140`,
`packages/domain/src/attachment.ts:614-637`, `apps/web/src/lib/attachmentLabel.ts:46-73` sagen
alle drei denselben Satz: Kontrolle in der Hülle, Auskunft an der Tür und in der Anzeige, keine
ersetzt die andere. Das ist die beste Fassung dieses Absatzes, die ich in diesem Bestand gesehen
habe.

**Wo es droht:** Nicht bei der Absicht, sondern bei der Zahl der Fassungen. Es gibt jetzt

| Regel | Hülle | Domäne | Oberfläche |
|---|---|---|---|
| Doppelpunkt | `has_stream_separator` (`attachment.rs:301`) | `hasPathStreamSeparator` (`attachment.ts:674`) | `hasStreamSeparator` (`attachmentLabel.ts:199`) |
| Umleitungsendung | `has_indirect_extension` (`attachment.rs:319`) | `fileExtensionOf` (`attachment.ts:695`) | `extensionOf` (`attachmentLabel.ts:218`) |
| die fünf Endungen | `INDIRECT_EXTENSIONS` (`attachment.rs:165`) | `INDIRECT_EXTENSIONS` (`attachment.ts:535`) | Import aus der Domäne |

Drei Fassungen zweier Regeln, und **eine davon geht heute schon auseinander** (A-1).

**Woran man es merken würde: an nichts.** Kein Prüfpfad vergleicht die Rust-Liste mit der der
Domäne (`grep -rn lnk apps/*/scripts/` ist leer). Kein Prüffall führt einen Pfad durch alle drei
Fassungen und verlangt dieselbe Antwort. Die einzigen Wächter sind zwei Prüffälle, die einander
widersprechen und beide grün sind. Ich habe A-1 durch Lesen gefunden, nicht durch einen roten
Lauf — und das ist genau die Auskunft, nach der gefragt war.

**Empfehlung (eigene Aufgabe, nicht diese Welle).** Eine Tafel, drei Leser: eine Datei unter
`tests/fixtures/` mit Zeilen `pfad → erwarteter Schlüssel oder ok`, gelesen von (a) dem
Domänenprüffall gegen `checkAttachmentPath`, (b) dem Web-Prüffall gegen `foreseeableRefusalOf`
und (c) dem Rust-Prüffall gegen `check_file` (die Fälle mit `path_missing` als erwartetem
Ausgang, wo keine Datei angelegt wird). Drei Antworten auf dieselbe Frage, an einer Stelle
aufgeschrieben. Erst dann ist „dieselben Fragen, dieselben Schlüssel, dieselbe Folge" eine
Messung und keine Zusage.

### 5.2 Verschluckte Fehlschläge

**Was `image-sweep.ts` tut, wenn eine Löschung scheitert:** Er tut das Richtige. `removeImage`
liefert `'failed'`, der Adapter schreibt eine `warn`-Zeile mit dem erzeugten Namen
(`attachment-store.ts:418`) — und der Name ist dort gedeckt, weil `pathOf` längst mit
`unknown_name` zurückgekehrt wäre (die berichtigte Begründung aus O-DR trägt, nachgelesen). Der
Lauf zählt den Fehlschlag nicht mit (`:111`, richtig: gezählt wird, was fort ist) und macht mit
der nächsten Waise weiter, statt abzubrechen. Kein Verschlucken.

Zwei Lücken daneben, beide klein: der Lauf selbst schweigt, wenn **jede** Löschung scheitert
(H-2), und die versprochene Zahl im Abbruchzweig wird im Regelfall nicht geschrieben (H-1).

Der teure Fall liegt woanders, und er ist die Umkehrung der Frage: nicht „was, wenn eine Löschung
scheitert", sondern „was, wenn eine Löschung **gelingt**, die nicht hätte stattfinden dürfen".
Das ist B-1, und dagegen steht heute kein Riegel.

Die übrigen Fehlerwege der Welle habe ich gegen dieselbe Regel gelesen und für in Ordnung
befunden: `confirmOpen` (`Attachments.tsx:577`) läßt den Dialog stehen und merkt den Grund an der
Zeile; `pick` (`:373`) hat für alle drei Ausgänge einen sichtbaren Weg; `createTodoGate` kann
keine Sperre ohne Grund bauen (`create-gate.ts:113`, `blocked = reason !== null` aus **einem**
Ausdruck) — das ist die richtige Bauart für V-11, und `proof:addin` 19f mißt sie über alle 24
Möglichkeiten.

### 5.3 Kommentare, die etwas anderes begründen als das, was dasteht

Sechs Stück, alle oben mit Fundstelle: `image-sweep.ts:124` (H-1), `app.ts:307` und `:309`
(H-3, H-4), `version-check-entry.ts:53` und `:155` (H-5), `attachment.ts:718` (A-1),
`proof-shell-surface.mjs:150` (H-8), dazu die Zusage „im Zweifel zu viel messen" aus dem
T-173-Bericht (A-4). Die schwerste ist A-1: Sie begründet eine Gleichheit, die im Prüffall
nebenan widerlegt ist.

Gegenprobe in die andere Richtung, weil sie dazugehört: Die neuen Kommentare in `attachment.rs`
(A-A-28, `:122-140`) und in `create-gate.ts` habe ich gegen den Code gelesen und stimmig
gefunden — insbesondere die Begründung der **Reihenfolge** (`has_stream_separator` nach
`is_absolute`, vor `has_indirect_extension`, `attachment.rs:374-380`), die im Code genau so steht
und deren Preis im Kommentar benannt ist.

---

## 6. Baustellen, die ich beim Lesen getroffen habe

| Datei | Wer | Stand |
|---|---|---|
| `apps/web/src/components/FormDialog.tsx` | frontend-dev, T-175 | in Arbeit (215+/135-), `typecheck` heute grün. Siehe A-3 |
| `apps/local-api/test/access/attachment-store.test.ts` | unit-tester | in Arbeit, 4 × TS6133 — die **einzigen** Typfehler des Baums. Nicht beurteilt |
| `apps/desktop/scripts/proof-shell-surface.mjs` | frontend-dev | wurde während des Reviews geändert; Lauf grün. H-8 gilt für den Stand von jetzt |
| `packages/domain/test/attachment.test.ts` | unit-tester, T-174 | fertig, 1402 grün. A-1 betrifft einen Fall daraus |

---

## 7. Was zur Freigabe fehlt

1. **B-1** — Widerspruchsprüfung im Aufräumlauf und Prüffälle über die drei Funktionen
   (domain-dev und unit-tester).
2. **B-2** — die Hauptreihe fährt `main()`; ersatzweise eine gemessene Liste der Abweichungen
   (e2e-tester, Entscheidung des Orchestrators über die Naht).
3. **A-1 bis A-4** vor dem nächsten Zusammenführen.
4. **O-EJ** — spec-ux-reviewer nimmt den Dateizweig und das stehengebliebene `http://` ab oder
   weist sie zurück. Ohne diese Abnahme steht in der Domäne eine Regel, die ein Prüfername
   verneint.
