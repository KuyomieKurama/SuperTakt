# T-315 — Der Bildlauf: vier Löschwege zu, ein Verfahren statt zwei Abschriften

**Aufgabe:** T-315 — `sweepOrphanedImages` auf die Bauart aus T-314 ziehen. Die Umkehr der
Eigentümerfrage, der Riegel auf zwei Achsen, die Regel **einmal**. Dazu: Ist das Kind schon in den
Brunnen gefallen? Und: die Naht für den unit-tester benennen.

**Status:** fertig — braucht Review (code-reviewer, security-checker) **und** den unit-tester in
derselben Welle. `pnpm check` ist **rot**, und zwar an **genau zwei Dateien, die mir nicht
gehören**; alles andere ist grün. Siehe Abschnitt 7.

---

## 1 — Die Antwort auf die Frage, die in deinen Bericht gehört

> **Ja. Ein Benutzer, der SuperTakt seit v0.2.0 benutzt, kann Bildkopien verloren haben.** Nicht
> „theoretisch" — der Weg braucht keine besonderen Rechte, keinen Schreibzugriff an der Tür vorbei
> und keinen Fehler. Er braucht einen Benutzer, der einen Anhang der Art **Datei** auf eine
> Bildkopie im Anwendungsdatenverzeichnis zeigen läßt.

**Wie lange ausgeliefert:** Der fehlerhafte Lauf steckt in **zehn** Etiketten — v0.2.0 (2026-09-08)
bis v0.5.0 (2026-09-11); gemessen mit `git tag --contains` auf den Einbringcommit und
gegengeprüft am Quelltext von `v0.2.0` und `v0.5.0` (beide tragen `knownImageTargets` und
`known.size === 0`). Der Lauf startet bei **jedem** Programmstart, vor dem ersten Zuhören.

**Wie man es im Nachhinein sähe — und wie nicht.**

| Spur | taugt? |
|---|---|
| **Eine Zeile ohne Datei.** `todo_attachment.target` nennt eine Datei im Bildverzeichnis, und dort liegt sie nicht. In der Oberfläche: ein Anhang, der den Zustand aus A-19.15 zeigt („läßt sich nicht lesen") statt eines Bildes. | **ja, die einzige belastbare** |
| Die Protokollzeile `attachment_image_orphans_removed files=N` | **nein, nicht auf einem Benutzerrechner.** Sie geht nach `stderr` des Sidecars. Wer sie nicht mitgeschnitten hat, hat sie nicht. |
| Die Datensicherung nach A-20 | **teilweise.** Ein Archiv, das **vor** dem Verlust entstand, trägt die Bytes des Bildes mit; ein Archiv danach trägt die Zeile ohne Bytes. Zwei Archive nebeneinander datieren den Verlust. |

**Die Abfrage, mit der man nachsieht** (lesend, keine Änderung):

```sql
SELECT a.id, a.todo_id, a.kind, a.target
  FROM todo_attachment a
 WHERE a.kind = 'image'
    OR a.target LIKE '%attachments%';
```

Jede `kind = 'image'`-Zeile nennt einen bloßen Dateinamen, der im Ordner `attachments` neben dem
Bestand liegen muß. Jede `kind = 'file'`-Zeile, deren Pfad in diesen Ordner zeigt, ist der
Fingerabdruck des vierten Weges. **Fehlt zu einer dieser Zeilen die Datei, ist der Verlust
eingetreten** — vorausgesetzt, der Benutzer hat sie nicht selbst aus dem Ordner gelöscht.

**Wie wahrscheinlich, ehrlich abgeschätzt.** Für einen Benutzer, der nur die gewöhnlichen Wege
benutzt hat, ist der Verlust **nicht** eingetreten: Solange die Bildzeile einer Kopie steht, nennt
sie den Namen zeichengleich, und der alte Lauf fand sie. Verloren geht etwas in genau diesen
Lagen:

1. **Der vierte Weg.** Eine Bildkopie ohne eigene Bildzeile (ein Entfernen, das an `EBUSY`
   scheiterte — unter Windows genügt ein offener Betrachter) und daneben eine **Dateizeile**, die
   denselben Pfad nennt. Der alte Lauf fragte mit bloßen Namen und sah die Dateizeile nicht: Datei
   fort, Zeile steht. Gemessen in T-314: `entfernt = 1, Dateien = 0, Zeilen = 1`.
2. **Eine Zeile, die von außen verändert wurde** (VG-3, `sqlite3` auf die Datei, ein fremdes
   Werkzeug): andere Groß-/Kleinschreibung oder ein anderes `kind` — beides kostete die Datei.
3. **Der gemischte Fall**, und er ist der teuerste: Der alte Riegel hing an `known.size === 0`.
   Eine **einzige** passende Zeile entwaffnete ihn für **alle** anderen. Ein Bestand, in dem neun
   von zehn Zielen nicht mehr trafen, verlor beim nächsten Start neun Bilder — still.

**Was ich nicht gemessen habe und nicht messen kann:** ob es auf einem echten Rechner geschehen
ist. Dafür bräuchte es einen Bestand, den ich nicht habe. Die Aussage oben ist eine Aussage über
den **ausgelieferten Code**, nicht über einen Schaden.

---

## 2 — Artefakte

**Neu:**

- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\features\todos\orphan-sweep.ts` — **das
  Verfahren, einmal.** Reihenfolge, Eigentümerfrage, beide Gegenfragen, Riegel, Klammer, Bericht.

**Geändert:**

- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\features\todos\image-sweep.ts` — neu
  geschrieben: sagt nur noch, **welcher Ordner** gemeint ist (Liste, Entfernungswert, enge Zählung,
  Sätze). Rückgabewert ist ein Bericht statt einer Zahl.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\features\todos\email-file-sweep.ts` —
  dasselbe für den anderen Ordner. **Öffentliche Fläche unverändert**
  (`OrphanedEmailFileSweep`, `EmailFileSweepReport`, `EmailFileSweepRefusal`,
  `sweepOrphanedEmailFiles`); die 16 Prüffälle, die der unit-tester heute nacht dafür geschrieben
  hat, laufen **ohne eine Änderung** durch.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\access\attachment-store.ts` — neu
  `imageNameOf(name)` und `imageFolder()`.
- `C:\Users\kyk\Documents\Repo\SuperTakt\apps\local-api\src\main.ts` — Verdrahtung des Bildlaufs.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\src\ports.ts` — **`knownImageTargets`
  gestrichen**; `imageNameOf` und `imageFolder` am Blob-Port; die Begründungen an `imageCount`,
  `attachmentsNamingFiles` und `attachmentNamesUnder` berichtigt.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\storage\src\sqlite\repo-attachments.ts` — die
  Umsetzung von `knownImageTargets` ist fort; an ihrer Stelle steht, **warum** und was es gekostet
  hat. Kein neuer SQL-Code: Beide Läufe benutzen dieselben drei Abfragen.
- `C:\Users\kyk\Documents\Repo\SuperTakt\packages\domain\src\attachment.ts` — der Kopf von
  `attachmentTargetNamesFile` nennt jetzt **beide** Läufe und den vierten Weg.
- `C:\Users\kyk\Documents\Repo\SuperTakt\docs\architektur.md` (5.5 und 5.6b),
  `C:\Users\kyk\Documents\Repo\SuperTakt\docs\datenmodell.md` (Indexkatalog und Zugriffspfade).

**Nicht angefaßt:** `tests/**`, `apps/*/test/**`, `docs/bedrohungsmodell.md`, `docs/spec.md`,
`docs/testplan.md`, `packages/export/**`, `apps/web/**`, `apps/desktop/**`,
`apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**`, `package.json`, jede `tsconfig*.json`.

**Meßskript:** `apps/local-api/scripts/t315-sweep.mjs`, angelegt und **im selben Befehl wieder
entfernt** (nur dort lösen `@takt/*` auf). `git status` danach: kein `t315`-Rest, geprüft.

---

## 3 — Was gebaut ist

### 3.1 Die Eigentümerfrage ist jetzt **dieselbe** wie im anderen Ordner

`attachmentsNamingFiles` statt `knownImageTargets`: der Name am **Ende** des Pfades,
ASCII-gefaltet, **ohne `kind`, ohne `origin`**, und ein Pfad, der auf den Namen endet, nennt ihn
ebenfalls. Die Regel steht in `@takt/domain` (`attachmentTargetNamesFile`) und nirgends sonst.
Damit fallen die Wege 1, 2 und 4 **an der Quelle** — nicht durch einen Riegel darüber.

`knownImageTargets` ist **gestrichen und nicht stehengelassen**. Eine zweite, engere Fassung
derselben Frage neben der richtigen wäre genau die Doppelung, die diesen Fehler erzeugt hat; wer
sie fände, hielte sie für die schnelle Variante. Sie **war** die schnelle Variante — und die
falsche.

### 3.2 Der Riegel, auf zwei Achsen und ohne `known.size === 0`

| Frage | Achse | trägt den Fall |
|---|---|---|
| `attachmentsNamingFiles(namen)` | **Ende** des Pfades, ohne `kind` | die Entscheidung selbst |
| `attachmentNamesUnder(ordner)` | **Anfang** des Pfades, ohne `kind` | eine Zeile zeigt mit vollem Pfad ins Bildverzeichnis, und dort liegt nichts dieses Namens |
| `imageCount()` | **gar nicht** am Pfad (`kind = 'image'`) | `target` hat die Gestalt gewechselt — weder Name noch Ordner findet etwas wieder |

Beide Gegenfragen werden **immer** gestellt, sobald überhaupt etwas fallen würde.

**Eine Verschärfung gegenüber T-314, und sie gilt für beide Läufe:** Die zweite Achse wird gegen
die Zahl der zugeordneten Dateien gehalten (`claimed > owned`) und **nicht gegen Null**. Gegen Null
gehalten schwieg sie, sobald **eine einzige** Datei noch zugeordnet werden konnte — und das war der
gemischte Fall, der neun Dateien kostet, weil die zehnte paßt. Die alte Bedingung
(`owners = 0 && expected = 0 && claimed > 0`) ist darin vollständig enthalten.

**Das `attachmentNamesUnder` des Bildlaufs antwortet im Regelfall leer** — `target` trägt dort den
bloßen Namen. Das ist kein Leerlauf: Genau auf dieser Achse fällt die Zeile auf, die **doch** einen
Pfad in diesen Ordner trägt, und das ist der vierte Weg.

### 3.3 Ein Verfahren, zwei Läufe

`orphan-sweep.ts` trägt den Ablauf; `image-sweep.ts` und `email-file-sweep.ts` tragen je einen
Ordner. **Zwei Läufe bleiben es** — zwei Ordner, zwei Bedingungen; ein gemeinsamer Lauf über beide
Ordner müßte die Dateien des jeweils anderen übergehen und hätte eine Gelegenheit mehr, Material mit
Eigentümer zu löschen. Was fällt, ist die **Abschrift**, nicht die Trennung.

Der Grund steht im Quelltext, weil er über diesen Fall hinausgeht:

> Bis T-315 gab es zwei Abschriften desselben Verfahrens. T-314 hat die eine berichtigt, die andere
> blieb stehen — und die stehengebliebene war die **ältere und ausgelieferte**. Wer eine Regel
> berichtigt, sucht zuerst ihre Abschriften; sonst berichtigt er die Hälfte des Bestands.

### 3.4 Was sich an der Protokollfläche ändert

- Der Bildlauf bekommt `attachment_image_sweep_no_folder` (neu) und nennt im Widerspruch dieselben
  sechs Zahlen wie der andere Lauf (`files owned orphans expected missing attachments`) statt
  bisher zwei; `attachment_image_sweep_unavailable` trägt jetzt `files=… removed=…`.
- `attachment_image_sweep_unknown_kinds` verliert das Anhängsel `expected=3`. **Bewußt:** Der
  E-Mail-Lauf hat es nie geführt, und seine Prüffälle sind zwei Stunden alt. Eine Zahl, die in
  jedem Lauf dieselbe ist, ist ohnehin keine Messung; `kinds=2` gegen `kinds=4` sagt dasselbe.
- Kein Name, kein Pfad, keine Art im Klartext (B-2.4) — unverändert.

---

## 4 — Die Messung (alles gefahren, Windows 11, Node 22.23.2)

Echter `createAttachmentBlobPort` auf frischem Anwendungsdatenverzeichnis (`mkdtemp`, **nicht** der
echte Bestand), echte SQLite mit `migrateToLatest`, echte PNG-Dateien im Bildverzeichnis, echte
Zeilen in `todo_attachment`, echte Verdrahtung aus `main.ts`.

| Fall | heute | vorher (T-314 Abschnitt 4) |
|---|---|---|
| **T-313-1** zwei Bilder, eine Zeile zeichengleich, eine mit Groß-/Kleinabweichung | `{read:2, owned:2, removed:0}` — **beide da** | `entfernt = 1`, Datei fort, Zeile steht |
| **T-313-2** zwei Bilder, beide Zeilen `kind='file'` | `{read:2, owned:2, removed:0}` — **beide da** | `entfernt = 2`, beide Dateien fort, beide Zeilen stehen |
| **Der vierte Weg** Bildkopie + Dateizeile mit dem **vollen Pfad** derselben Datei | `{read:1, owned:1, removed:0}` — **da** | `entfernt = 1, Dateien = 0, Zeilen = 1` |
| **Gegenprobe nach oben** drei Bilder, zwei Zeilen | `{read:3, owned:2, removed:1}` — **die Waise fällt**, `attachment_image_orphans_removed files=1` | gleich |
| **Der gemischte Fall** drei Bilder, eine Zeile paßt, zwei haben die Gestalt gewechselt | `{read:3, owned:1, removed:0, refused:'contradiction'}` | alle drei Dateien wären gefallen |
| Eine Zeile ohne Datei **plus** eine Waise | `{read:2, owned:1, removed:0, refused:'contradiction'}` | — |
| Dieselbe fehlende Zeile **ohne** Waise | `{read:1, owned:1, removed:0, refused:null}` — **still** | — |
| Zeile mit vollem Pfad in den Ordner, deren Datei fehlt, plus Waise (erste Achse) | `{read:1, owned:0, removed:0, refused:'contradiction'}` | — |
| Fremder Name `rechnung.pdf` im Ordner | unsichtbar, überlebt; die Waise daneben fällt | gleich |

**29 Zusicherungen, 0 rot.** Der gemischte Fall ist der Nachweis für die Auflage selbst:
`owned = 1`, nicht `0` — der Riegel feuert bei **nicht leerer** Eigentümermenge. Genau das konnte
die alte Fassung nicht. Der vorletzte Fall ist die Gegenprobe: Eine unvollständige Zuordnung
**allein** verweigert nicht; erst zusammen mit einer Datei, die fallen würde, wird sie zum
Widerspruch.

**Und die Gegenprobe am anderen Lauf:** `apps/local-api/test/usecases/email-file-sweep.test.ts`
(16 Prüffälle, heute nacht vom unit-tester geschrieben) läuft **unverändert grün** gegen das
gemeinsame Verfahren — einschließlich der drei Gegenproben aus Bedrohungsmodell 40.1 und der
Gegenprobe nach oben. Die Verschärfung auf `claimed > owned` hat dort **keine** Messung gedreht.

---

## 5 — Die Naht für den unit-tester (er läuft parallel, ich habe nichts in `test/**` angefaßt)

**Zwei Dateien sind heute rot, beide in seiner Hoheit, beide unvermeidbar:**

1. **`apps/local-api/test/usecases/image-sweep.test.ts`** — 16 von 18 Prüffällen fallen,
   20 Übersetzungsfehler. Die Datei prüft eine Schnittstelle, die es nicht mehr gibt
   (`knownImageTargets`, Rückgabewert `number`). **Neu zu schreiben gegen `OrphanedImageSweep`**
   (acht Felder: `attachmentKinds`, `folder`, `listImages`, `imageNameOf`,
   `attachmentsNamingFiles`, `attachmentNamesUnder`, `imageCount`, `removeImage`) und
   `OrphanSweepReport`. **Die neun Fälle aus Abschnitt 4 sind der Prüfsatz**, mit Attrappen ohne
   Datenbank fahrbar; die Vorlage steht fertig in `email-file-sweep.test.ts` daneben.
2. **`packages/storage/test/repo-attachments.test.ts`, Zeilen 367–450** — der `describe`-Block zu
   `knownImageTargets`: 5 Übersetzungsfehler, 4 fallende Prüffälle. **Ersatzlos streichen.** Die
   Frage, die er prüfte, prüft der Block ab Zeile 668 (`attachmentsNamingFiles`) bereits — und
   zwar richtig.

**Dazu zwei Prüffälle, die es noch nicht gibt und die ich für die wichtigsten halte:**

3. `sweepOrphanedBlobs` (in `orphan-sweep.ts`) ist die einzige Stelle, an der noch **ein** Ablauf
   für beide Ordner steht. Ein Prüffall, der belegt, daß **beide** Läufe ihn benutzen — etwa: die
   Verweigerungsgründe von `sweepOrphanedImages` und `sweepOrphanedEmailFiles` stammen aus
   demselben Vorrat, und beide melden bei gleicher Lage denselben Bericht — hält die Abschrift
   fern, deren Wiederkehr dieser Auftrag war.
4. `KINDS_HOLDING_IMAGE_FILES` (exportiert aus `image-sweep.ts`) ist die Auswertung der Tafel
   `KIND_OWNS_IMAGE_FILE`. Eine Zusicherung `toEqual(['image'])` legt fest, daß eine vierte Art
   hier bemerkt werden muß, bevor `imageCount` zu klein zählt.

**Die Abdeckungsschwelle, gemessen statt geschätzt:** `packages/storage/src/**` steht bei
**80,67 % Zweigen (797/988)** gegen 80 %. Das sind **rund sechs Zweige Luft** (790,4 nötig) — mehr
als die zwei aus T-314, und der Grund ist seine eigene Arbeit: `attachmentsNamingFiles` und
`attachmentNamesUnder` haben seit heute nacht Prüffälle. **Ich habe in `packages/storage` keinen
einzigen Zweig hinzugefügt** (kein neuer SQL-Code; der Bildlauf benutzt die vorhandenen Abfragen)
und zwei entfernt. In `repo-attachments.ts` fehlen noch vier Zweige: die beiden `row === undefined`
nach `COUNT(*)` (**absichtlich ungeprüft**, die Begründung steht daneben) und je einer in
`imageTargets` (Zeile 171) und `create` (Zeile 214).

---

## 6 — Annahmen (entschieden, ohne zu fragen)

1. **`claimed > owned` statt `owned === 0`** — auch für den E-Mail-Lauf. Begründung in 3.2; alle 16
   vorhandenen Prüffälle bleiben grün, und der gemischte Fall wird dadurch überhaupt erst gesehen.
   Der Preis steht unter Risiko 1.
2. **Ein Verfahren in `orphan-sweep.ts`, zwei Läufe.** Die Alternative — den Bildlauf zeichengleich
   zum E-Mail-Lauf neu schreiben — hätte die Abschrift wiederhergestellt, deren Fortbestehen genau
   dieser Auftrag ist.
3. **`knownImageTargets` ersatzlos gestrichen**, nicht als „veraltet" stehengelassen. Eine engere
   Zweitfassung der löschenden Frage im selben Port ist eine geladene Waffe.
4. **`expected=3` aus der `unknown_kinds`-Zeile entfernt** (3.4), statt es dem E-Mail-Lauf
   anzuhängen. Die Prüffälle dafür sind zwei Stunden alt; die Zahl ist eine Konstante des Baus.
5. **Der Entfernungswert des Bildlaufs bleibt der Name** und wird nicht zum Pfad vereinheitlicht.
   `todo_attachment.target` trägt dort den Namen, `removeImage` nimmt ihn — ein Pfad, den niemand
   benutzt, wäre ein Pfad mehr im Speicher und einer mehr, der in eine Protokollzeile rutschen kann.
6. **Ein neuer Verweigerungsgrund `no_folder` auch für den Bildlauf.** Ein Lauf mit einer
   Gegenfrage weniger ist ein Lauf, der mehr löscht.

---

## 7 — `pnpm check`: einmal vollständig gefahren, und wo es steht

Exitcode **2**, abgebrochen im **ersten** Schritt (`typecheck` → `typecheck:test`), an den zwei
Dateien aus Abschnitt 5. Die übrigen Stufen habe ich einzeln gefahren:

| Stufe | Ergebnis |
|---|---|
| `tsc -p tsconfig.json`, alle acht Paket-`typecheck` | **grün** |
| `typecheck:test` | **rot** — `packages/storage/test/repo-attachments.test.ts` (5), `apps/local-api/test/usecases/image-sweep.test.ts` (20) |
| `boundaries` | **grün** (487 Dateien, Notiz-Trennung unverletzt) |
| `contrast` | **grün** |
| `proof:all` (19 Läufe) | **grün**, Exitcode 0 |
| `verify:bundle` | **grün** |
| `test:coverage` | **rot** — 20 Prüffälle, ausschließlich in denselben zwei Dateien (1 833 grün). Abdeckung `packages/storage/src` **80,67 %** Zweige |
| `test:rust` | **grün**, 68 bestanden |
| `build` | **grün** |
| `audit` | **grün** |

**Ich kann das nicht selbst grün machen** — beide Dateien liegen in der Hoheit des unit-testers, und
er arbeitet parallel. Der Auftrag an ihn steht in Abschnitt 5, Punkte 1 und 2.

---

## 8 — Risiken

1. **Der Lauf kann dauerhaft verweigern, und das ist jetzt leichter auszulösen.** Führt der Bestand
   **mehr** Anhänge dieser Art, als der Ordner Eigentümer findet (`claimed > owned`), und liegt
   zugleich eine Waise da, dann räumt er nichts mehr auf und sagt es bei jedem Start in einer
   `warn`-Zeile mit sechs Zahlen. Auslöser im Alltag: eine von Hand gelöschte Bilddatei, eine
   Einspielung, bei der `restoreImage` für einzelne Bilder fehlschlug (die Zeile steht dann, die
   Datei nicht), oder zwei Zeilen auf dieselbe Kopie. **Nach der Leitlinie ist das der billige
   Fehler** — ein Ordner behält eine Datei zuviel —, aber er ist jetzt häufiger als vorher.
2. **Die Eigentümerfrage des Bildlaufs ist ein vollständiger Tabellenlauf geworden**
   (`LIKE '%name%'`, kein Index benutzbar), statt eines Zugriffs über
   `ix_todo_attachment_image`. Einmal beim Start und nur, wenn Dateien im Ordner liegen. Bei
   einigen hundert Anhängen unmeßbar; bei zehntausend Dateien **und** zehntausend Zeilen spürbar.
   Derselbe bewußt bezahlte Preis wie in T-314: Der Index machte die Frage schnell und falsch.
3. **TP-ANH-21 (e2e) hängt jetzt an einer Bedingung mehr.** Der Prüffall legt eine Waise an und
   erwartet, daß sie beim Neustart fällt. Das tut sie — gerechnet: eine Bildzeile (TP-ANH-10) mit
   ihrer Datei, `claimed = owned = 1`, eine Waise → sie fällt. **Wenn** aber in derselben
   Sitzung eine Bildzeile **ohne** Datei entsteht, verweigert der Lauf und TP-ANH-21 wird rot.
   Gefahren habe ich ihn nicht (braucht den gebauten Sidecar); der e2e-tester sollte es wissen.
4. **Alles auf Windows 11 gemessen.** Auf POSIX ist die ASCII-Faltung großzügiger als das
   Dateisystem (dort ist `A.png` ≠ `a.png`); die Folge ist ein Eigentümer zuviel und damit eine
   Datei, die liegen bleibt. Richtige Richtung, ungemessen.
5. **Die Abdeckungsschwelle steht bei sechs Zweigen Luft** (80,67 %). Ich habe keinen Zweig
   hinzugefügt, aber der nächste Agent in `packages/storage` hat wenig Spielraum.

---

## 9 — Offene Fragen an den Orchestrator

1. **Gehört Abschnitt 1 in eine Mitteilung an den Auftraggeber?** Meine Empfehlung: ja, und zwar
   mit dem Satz „kann, nicht ist" und der Abfrage aus Abschnitt 1 daneben. Zehn Etiketten sind
   ausgeliefert; der Weg braucht keine besonderen Rechte.
2. **`docs/bedrohungsmodell.md` gehört dem security-checker.** 40.1 beschreibt drei Wege im
   E-Mail-Ordner. Der vierte Weg und der Bildordner fehlen dort; nach T-315 sind beide zu, aber
   der Abschnitt behauptet weiter, es seien drei und sie beträfen einen Ordner.
3. **`risks.md`:** R-29 („Der Lauf, der löscht") ist nach T-315 für **beide** Ordner geschlossen —
   an derselben Stelle, mit derselben Regel. Der Eintrag gehört dir.
4. **`docs/testplan.md`** nennt TP-ANH-21 und verweist auf den alten Pfad `usecases/image-sweep.ts`.
   Er heißt seit der Merkmalsstruktur `features/todos/image-sweep.ts`, und das Verfahren steht jetzt
   in `features/todos/orphan-sweep.ts`. Datei des e2e-testers.
5. **Eine Entscheidung wäre fällig:** „Wer eine Regel berichtigt, sucht zuerst ihre Abschriften."
   Dieser Fall ist der zweite dieser Art in zwei Wellen (nach dem Wächter aus E-099 Punkt 3, der
   die Route maß statt die Wirkung). Als E-Nummer festgehalten wäre sie beim nächsten Mal ein
   Prüfpunkt und keine Erinnerung.

---

## 10 — Definition of Done

| Punkt | Stand |
|---|---|
| Migration vorwärts und rückwärts | unberührt; keine neue Migration, kein Schemaeingriff (`proof:migrations` grün) |
| Rundung, Exportstatus, Timer-Regel rein in `packages/domain` | unberührt; die Eigentümerregel liegt weiter dort und trägt jetzt **beide** Läufe |
| Export transaktional | unberührt |
| OpenAPI erzeugt | grün, `proof:openapi` 115/115 |
| `pnpm typecheck` | **grün für alle Quellen**, rot für zwei fremde Prüfdateien (Abschnitt 7) |
| `pnpm check` vollständig | **einmal gefahren, Exitcode 2**; alle Stufen außer `typecheck:test` und `test:coverage` einzeln grün |
| Bericht abgelegt | diese Datei |
