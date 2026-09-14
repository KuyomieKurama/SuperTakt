# T-328 — Die drei fehlenden Messungen an den Löschpfaden

Aufgabe: T-328 — `releaseUnclaimedBlobs`, `attachmentNamesOfKind`, `file-port.test.ts:66`, dazu die
Frage, warum `vitest.config.ts` `apps/local-api/src` nicht mißt.
Status: **fertig**

---

## Artefakte

| Datei | Art | Was |
|---|---|---|
| `apps/local-api/test/usecases/attachment-release.test.ts` | neu | `releasableBlobOf` (4 Fälle, rein), `releaseUnclaimedBlobs` über `removeTodo` (3 Fälle inkl. Gegenprobe aus T-320) und über `removeAttachment` (3 Fälle) — 11 Prüffälle, echte In-Memory-SQLite, echter `createAttachmentBlobPort` |
| `packages/storage/test/repo-attachments.test.ts` | geändert | neuer Block `attachmentNamesOfKind` — 3 Prüffälle (Arten `image`/`file`/`link`, eine Bildzeile mit vollem Pfad, Gegenprobe zu `attachmentNamesUnder`) |
| `packages/storage/test/file-port.test.ts` | geändert | die tautologische Zusicherung bei `:66` ersetzt durch eine unbedingte, root-Sonderrolle vorab per `it.skipIf` behandelt |

Nicht angefaßt: `vitest.config.ts`, jede Zeile in `apps/*/src/**` oder `packages/*/src/**`. Die
Meßkopie zur Beantwortung der `vitest.config.ts`-Frage liegt ausschließlich im Kratzverzeichnis
(`/tmp/.../scratchpad/vitest.local-api-measure.config.ts`) und ist nicht Teil dieses Bestands.

Fremd im Arbeitsbaum, nicht von mir: `.claude/team/board.md`, `decisions.md`, `risks.md`,
`docs/bedrohungsmodell.md`, `apps/local-api/scripts/proof-release-safety.mjs` (T-327, parallel),
mehrere `.claude/team/reports/T-32{2,3,4,5}-*.md` und zwei `apps/local-api/scripts/.tmp-*.mjs` —
`git status` zeigt sie, ich habe keine davon geöffnet oder geschrieben.

---

## 1 — `releaseUnclaimedBlobs`, `releasableBlobOf`, `removeAttachment`, `removeTodo`

### Rot zuerst — nicht behauptet, an der echten Vorgängerfassung nachgerechnet

Vor T-328 lief `grep -rl releaseUnclaimedBlobs apps/local-api/test packages/*/test tests` leer —
das ist der Befund aus T-324 wörtlich, und er stimmte. Ein "rot davor" im Sinn von "derselbe Test
schlägt fehl" gibt es bei einem komplett neuen Prüffall nicht; statt dessen habe ich nachgewiesen,
daß der Prüffall an der ECHTEN Fassung vor T-320 tatsächlich rot geworden wäre, und zwar ohne eine
einzige Zeile Produktivcode zu berühren:

1. `git show 4a52edc:apps/local-api/src/features/todos/todos.ts` (der Elternstand von `311b26e`,
   dem Commit, der T-320 umsetzt) zeigt: `removeTodo` fragte vor T-320 nicht, ob eine Bildkopie noch
   einer anderen Zeile gehört — es entfernte unbedingt.
2. In einem WEGWERFSKRIPT (`apps/local-api/test/usecases/_scratch-red-proof.test.ts`, angelegt,
   gemessen, wieder gelöscht — nie committet, `git status` zeigt es nicht mehr) habe ich diesen
   Kontrollfluß von Hand nachgebaut, OHNE aus `src/` zu importieren, und exakt denselben Aufbau
   verwendet wie im echten Prüffall: Todo A trägt eine echte Bildkopie (`addAttachment`, echter
   `createAttachmentBlobPort`), Todo B einen Dateianhang auf deren vollen Pfad. Lauf:

   ```
   ❯ apps/local-api/test/usecases/_scratch-red-proof.test.ts (1 test | 1 failed)
   AssertionError: expected [] to include 'c1f18858173342699fd213aebc1ed2ec.png'
   ```

   Die Datei war weg — der Datenverlust aus R-29/T-318 reproduziert, an echtem Code, nicht an
   einer Behauptung.
3. Derselbe Aufbau gegen den ECHTEN, aktuellen `removeTodo` (`apps/local-api/test/usecases/attachment-release.test.ts`): **grün**, 11/11 Fälle.

Das Wegwerfskript ist gelöscht; der Beweis steht hier und ist mit dem Zweig-Namen und den
Zeilennummern der alten Fassung nachvollziehbar.

### Was jetzt gemessen wird

- **`releasableBlobOf`** (rein, 4 Fälle): `image` (jede `origin`) → Bildkopie; `file`+`origin=email`
  → E-Mail-Datei; `file`+`origin=user` → `null`; `link` → immer `null`. Deckt genau die Unterscheidung
  ab, die security-checkers M-3 bereits am Bestand gefahren hatte (`.claude/team/reports/T-325-security-checker.md`, Abschnitt 3.1) — hier als stehender Prüffall statt als Berichtszeile.
- **`releaseUnclaimedBlobs` über `removeTodo`** (3 Fälle):
  1. Die Hauptmessung: Todo B claimt Todo As Bildkopie über einen `file`-Anhang auf den vollen Pfad
     → Datei bleibt, `listImages()` nennt sie weiter.
  2. Gegenprobe nach oben: OHNE einen zweiten Anhang fällt dieselbe Art von Datei ganz normal — die
     Regel läßt nicht grundsätzlich alles liegen.
  3. **Die Gegenprobe aus T-320 selbst**, jetzt als stehender Fall: Ist die Antwort von
     `attachmentsNamingFiles` blind auf eine leere Menge gesetzt (Todo B "unsichtbar" für die Frage),
     fällt dieselbe Datei wieder. Das bindet die Messung an die Frage und nicht an einen Zufall des
     Aufbaus — exakt der Satz, den T-320 im eigenen Bericht als Wegwerfmessung notiert und den
     T-325 in zehn Lagen nachgefahren hat, hier aber als Prüffall und nicht als Berichtszeile.
- **`releaseUnclaimedBlobs` über `removeAttachment`** (3 Fälle): dieselbe Eigentümerfrage beim
  direkten Entfernen EINES Anhangs (nicht des ganzen Todos) — claimed bleibt liegen, unclaimed fällt,
  ein Anhang unter falscher Todo-Adresse ist `not_found` und rührt keine Datei an.

Alle 11 Fälle grün, echte In-Memory-SQLite (`openDatabase({ location: ':memory:' })`), echter
Blob-Adapter über ein frisches Anwendungsdatenverzeichnis — dieselbe Bauart wie
`email-attachments-rollback.test.ts` (T-312), aus demselben Grund: Eine Attrappe für
`attachmentsNamingFiles` würde genau die Eigenschaft nicht prüfen, um die es geht (eine echte
SQL-Abfrage über ALLE Zeilen, nicht nur die des gelöschten Todos).

---

## 2 — `attachmentNamesOfKind`

### Rot zuerst

Vor T-328 hatte diese Methode laut Messung des code-reviewers **null** Abdeckung
(`repo-attachments.ts:473-478` ungedeckt). Um zu zeigen, daß der neue Prüffall diskriminierend ist
und nicht zufällig grün, habe ich eine Mutationsprobe gefahren (WEGWERFSKRIPT
`packages/storage/test/_scratch-mutation-check.test.ts`, angelegt, gemessen, gelöscht): dieselbe
Fixtur wie im echten Prüffall, aber die SQL-Abfrage ohne `WHERE a.kind = ?` — also die naheliegende
kaputte Fassung. Lauf:

```
× ohne WHERE kind = ? tauchen auch file- und link-Namen auf
AssertionError: expected true to be false
```

Die negative Zusicherung des echten Prüffalls (`namen.has('rechnung.pdf')` soll `false` sein) wäre an
einer Fassung ohne Art-Filter tatsächlich rot geworden.

### Was jetzt gemessen wird

Genau der vom code-reviewer benannte Aufbau: drei Zeilen der Arten `image`, `file`, `link`, die
Bildzeile mit einem VOLLEN PFAD im `target` (Mischschreibung, Windows-Trenner) statt dem bloßen
erzeugten Namen — der Fall, für den die Methode überhaupt gebaut wurde (T-320: `attachmentNamesUnder`
ist für eine gewöhnliche Bildzeile blind, weil dort kein Ordner vor dem Namen steht). Drei Fälle:
die positive/negative Zusicherung zusammen, eine leere Datenbank ergibt eine leere Menge, und eine
Gegenprobe, die `attachmentNamesUnder` (leer) neben `attachmentNamesOfKind` (findet die Zeile) für
denselben Bestand stellt — das ist die Eigenschaft, die T-320 als Lückenschluß beschreibt.

**Was ich bewußt NICHT getestet habe**, weil es keine Zusicherung dieser Methode ist, sondern eine
Zusicherung über ihre Verwendung: daß eine größere Antwort dieser Methode nur eine Bremse ist und nie
eine Löschung entscheidet. Diese Eigenschaft hängt an der Vereinigung in `main.ts` (Komposition,
Produktivcode) und ist bereits ausführlich am injizierten `OrphanSweepPorts.attachmentNamesUnder`
gemessen (`apps/local-api/test/usecases/image-sweep.test.ts`, u. a. "DIE WICHTIGSTE MESSUNG"
Zeile 341 ff., und die neun Fälle aus T-315 Abschnitt 4) — jede zusätzliche Zeile in dieser Menge
führt dort nachweislich nur zu `missing > 0` → `contradiction` → `removed: 0`, nie zu einer
zusätzlichen Entfernung. Einen weiteren, redundanten Fall auf dasselbe Muster zu schreiben hätte
genau die Klasse aus T-321 riskiert (ein Prüffall, dessen Name mehr zusagt, als sein Rumpf ruft) statt
sie zu vermeiden — die Vereinigung selbst steht in `main.ts` und ist damit Produktivcode, den ich
nicht anfassen darf. Das ist ein Befund für den Orchestrator/domain-dev, kein Prüffall von mir: Die
Eigenschaft "die Vereinigung aus `attachmentNamesUnder` und `attachmentNamesOfKind` betrifft
ausschließlich `missing`" ist heute nur an der Verdrahtung in `main.ts` selbst geprüfbar, nicht am
reinen Anwendungsfall — ein End-zu-End- oder Kompositionstest dafür läge außerhalb dessen, was
`apps/local-api/test/**` heute an Werkzeug hat, und wäre ein eigener Auftrag.

---

## 3 — `file-port.test.ts:66`

Fix exakt wie vom code-reviewer benannt: die Sonderrolle von root wird jetzt VORHER per
`it.skipIf(platform === 'win32' || process.getuid?.() === 0)` behandelt, der verbleibende Rumpf trägt
eine unbedingte Zusicherung `expect(result).toEqual({ ok: false, reason: 'not_writable' })`, und
`as never` ist weg.

**Nachgewiesen, nicht nur behauptet:**

```
node -e '... ["ok", false].includes(result.ok) || result.ok === true ...'
{"ok":true,"resolvedPath":"/tmp/x"}        -> alte Zusicherung: true
{"ok":false,"reason":"not_writable"}       -> alte Zusicherung: true
{"ok":false,"reason":"missing"}            -> alte Zusicherung: true
```

Die alte Zusicherung war für alle drei Fälle wahr — auch für ein `ok: true` und für einen falschen
`reason`. Die neue Zusicherung ist nur für exakt den einen richtigen Fall wahr; sie ist damit "rot
zuerst" im Sinn von: gegen jede falsche Antwort des Adapters wäre sie rot, gegen die alte war sie es
für keine. Gelaufen auf diesem (Nicht-root-)Rechner: 67/67 Prüffälle in `repo-attachments.test.ts` +
`file-port.test.ts` grün, der reparierte Fall läuft (nicht übersprungen, `id -u` = 1000).

---

## 4 — Die Frage: Warum mißt `vitest.config.ts` `apps/local-api/src` nicht?

**Gemessen: `git log --follow --oneline -- vitest.config.ts` nennt genau EINEN Commit,
`d9555d0` — den allerersten der ganzen Historie.** Seit dem Anfang wurde diese Datei nie wieder
angefaßt, auch nicht durch die Merkmalsumstellung T-249 bis T-272, die `apps/local-api/src` erst zu
dem gemacht hat, was es heute ist (elf Merkmalsordner mit eigener Anwendungsfall-Orchestrierung).

Der Kommentar im Bestand nennt die Begründung von damals: `coverage.include` deckt "die drei Pakete,
in denen Geld entsteht" (Rundung, Exportstatus, Vorlagen-Motor), und "die Oberfläche" bleibt
ausdrücklich ohne Schwelle, weil Playwright dort abdeckt. **`apps/local-api/src` fällt in KEINE der
beiden benannten Kategorien** — es ist nicht "die Oberfläche" (das ist `apps/web`), und es ist nicht
eines der drei ursprünglichen Pakete. Es wurde nie einer dritten Kategorie zugeordnet, weil es diese
Kategorie im ursprünglichen Schnitt nicht gab: ein lokaler Dienst mit eigener, fachlich folgenreicher
Anwendungsfall-Schicht (Löschpfade, Anhangslebenszyklus, Aufräumläufe), der aber weder das
Rechnungsformat direkt bestimmt noch von Playwright in der Tiefe erreicht wird, die
`releaseUnclaimedBlobs` bräuchte (ein E2E-Test klickt sich nicht durch "Todo A löschen, während Todo
B genau denselben Dateipfad als Anhang trägt"). Das Ergebnis: Ein Prüflauf kann `apps/local-api/src`
beliebig unbedeckt lassen, ohne daß `pnpm check` es je bemerkt — strukturell derselbe Zustand, den
T-324 an `releaseUnclaimedBlobs` gemessen hat, nur eine Ebene höher (an der Konfiguration statt am
einzelnen Prüffall).

### Beide Zahlen, gemessen (Meßkopie im Kratzverzeichnis, `coverage.include` um
`apps/local-api/src/**/*.ts` ergänzt, dieselbe 80-%-Schwelle nur zur Beobachtung, nicht verändert)

| | `apps/local-api/src/**` |
|---|---|
| **Isoliert** (`vitest run --coverage --config <meßkopie> apps/local-api/test`) | Anweisungen 1487/3517 = **42,28 %**, Zweige 823/2184 = **37,68 %**, Funktionen 215/693 = **31,02 %**, Zeilen 1317/3071 = **42,89 %** |
| **Kombiniert** (derselbe Lauf über den GANZEN Arbeitsbereich, `packages/*/test` + `apps/*/test`) | Anweisungen 1487/3517 = **42,28 %**, Zweige 823/2184 = **37,68 %**, Funktionen 215/693 = **31,02 %**, Zeilen 1317/3071 = **42,89 %** |

**Isoliert und kombiniert sind hier byte-für-byte identisch** (auf zwei Nachkommastellen exakt
gleiche Bruchzahlen 1487/3517 usw. in beiden Läufen) — anders als bei `packages/storage` in T-319,
wo `apps/local-api/test` die Zahl von 77 % auf 81 % hob. Der Grund ist strukturell: Kein anderes Paket
und keine andere App importiert aus `apps/local-api/src` — es ist die Anwendung selbst und keine
Bibliothek. Nur seine eigenen Tests können es je ausüben, und die liefen in beiden Messungen exakt
gleich (23 Testdateien, 349 grüne Fälle, 2 übersprungen).

**Würde die Schwelle heute auf `apps/local-api/src/**` ausgeweitet, wäre `test:coverage` SOFORT rot**
— 42 Prozentpunkte unter 80 %, mit realen ERROR-Zeilen im selben Format wie bei den anderen drei
Paketen:

```
ERROR: Coverage for lines (42.88%) does not meet "apps/local-api/src/**" threshold (80%)
ERROR: Coverage for functions (31.02%) does not meet "apps/local-api/src/**" threshold (80%)
ERROR: Coverage for statements (42.28%) does not meet "apps/local-api/src/**" threshold (80%)
ERROR: Coverage for branches (37.68%) does not meet "apps/local-api/src/**" threshold (80%)
```

Zur Einordnung, gemessen an derselben Meßkopie: Der GANZE restliche Arbeitsbereich
(`packages/domain`, `packages/storage`, `packages/export`) blieb in demselben kombinierten Lauf
GRÜN — keine der drei Schwellen schlug an (95,06 % / 89,71 % / 97,96 % Anweisungen). Das ist nicht
mein Befund allein: `test:coverage` am unveränderten Bestand (mit meinen drei Artefakten) läuft mit
**97 Testdateien (1 übersprungen), 1887 grünen Fällen (2 übersprungen)** durch, 91,83 % Anweisungen /
86,24 % Zweige / 94,88 % Funktionen / 94,01 % Zeilen — alle vier realen Schwellen grün, keine
Regression durch meine Änderungen (vorher laut T-324: 96 Dateien, 1873 Fälle, 91,57 % / 86,24 % /
94,5 % / 93,75 %; die Differenz 1887−1873 = 14 = genau meine 11 + 3 neuen Fälle).

**Ich habe `vitest.config.ts` NICHT geändert.** Die Meßkopie liegt ausschließlich im
Kratzverzeichnis und ist mit diesem Bericht gelöscht bzw. nie Teil des Bestands gewesen.

### Vorschlag, den ich NICHT ausgeführt habe

`coverage.include`/`coverage.thresholds` um `apps/local-api/src/**` erweitern — aber nicht mit der
80-%-Schwelle von heute auf morgen, weil das `test:coverage` sofort und um 42 Punkte rot machen
würde. Das ist eine Entscheidung des Orchestrators (bewegt eine Stufe des Tores) und keine, die ich
als unit-tester treffen darf. Denkbare Wege, die ich NICHT bewertet habe (außerhalb meiner Hoheit):
eine niedrigere Anfangsschwelle mit Ansage einer Erhöhung, oder ein eigener Auftrag "Abdeckung
apps/local-api/src auf 80 % heben", bevor die Schwelle im Tor scharf gestellt wird — dieselbe
Reihenfolge, die T-319 für `packages/storage` vorgemacht hat, nur eine Größenordnung größer (693
Funktionen statt 379).

---

## Annahmen

1. **Rot-zuerst über Wegwerfskripte statt über eine temporäre Änderung an Produktivcode.** Die
   Anweisung "kein Produktivcode, auch nicht eine Kleinigkeit" lese ich so, daß selbst ein
   vorübergehendes `git checkout <alter Stand> -- src/datei.ts` zur Verifikation und ein
   anschließendes Zurücksetzen eine Änderung an `apps/*/src/**` ist, und sei sie noch so kurz. Ich
   habe deshalb den alten Kontrollfluß von Hand nachgebaut (in einer Testdatei, ohne Import aus
   `src/`) und danach gelöscht, statt die echte alte Datei auch nur kurz einzuspielen.
2. **`attachmentNamesOfKind`s "speist nur Bremse, nie Löschung" bleibt beim domain-dev/Orchestrator**,
   weil die Vereinigung, die das erst wahr macht, in `main.ts` (Komposition) steht — Produktivcode,
   den ich nicht anfassen darf, und ein Prüffall dort bräuchte entweder einen Kompositionstest (den
   es heute für `main.ts` nicht gibt) oder würde die Eigenschaft am injizierten Port statt an der
   echten Methode messen, was die bestehenden `image-sweep.test.ts`-Fälle bereits genauso gut tun.
3. **Die Meßkopie zur `vitest.config.ts`-Frage zählt nicht als Änderung**, weil sie außerhalb des
   Bestands liegt (Kratzverzeichnis) und nie eingespielt wurde.
4. Für die "claimed"-Szenarien habe ich `kind: 'file'` mit `origin: 'user'` (der gewöhnliche Weg, wie
   ein Benutzer einen Pfad einträgt) verwendet, nicht `origin: 'email'` — genau der vierte Weg aus
   T-314, den der Kopfkommentar von `releaseUnclaimedBlobs` selbst als Beispiel nennt.

## Risiken

- **Keine neuen.** Alle neuen Prüffälle laufen gegen echte SQLite- und Dateisystem-Adapter, ohne
  echte Call-Nummern, Kundennamen oder Zugangsdaten (erfundene Titel "Todo A"/"Todo B", PNG-Bytes
  aus dem bereits vorhandenen Fixture-Muster in `attachment-store.test.ts`).
- **Sicherheitsrelevant, aber nicht neu:** Der jetzt geschlossene Meßstand bestätigt exakt das, was
  T-325 (security-checker) bereits am Bestand gemessen hatte (M-3, zehn Lagen) — es gibt keine neue
  Erkenntnis über den Produktivcode selbst, nur eine dauerhafte Messung dessen, was vorher nur ein
  Bericht war.
- **`apps/local-api/src` bleibt strukturell ungemessen**, bis der Orchestrator entscheidet, ob und
  wie die Schwelle bewegt wird. Bis dahin kann jede künftige Änderung an dieser Fläche denselben
  Fehler wiederholen (ein Verhalten ändert sich, `pnpm check` bleibt grün, weil niemand hinschaut) —
  R-29 wörtlich, eine Ebene höher.
- **`file-port.ts` Funktionsabdeckung liegt bei 62,5 %** (unverändert durch mich, in der isolierten
  `packages/storage`+`apps/local-api`-Messung sichtbar) — außerhalb des Auftrags, nicht mein Befund,
  aber der nächste Leser dieser Datei sollte wissen, daß er dort noch etwas findet.

## Offene Fragen

1. Soll `apps/local-api/src` überhaupt in `coverage.include`/`coverage.thresholds` aufgenommen
   werden, und wenn ja, mit welcher Anfangsschwelle (heute 42/38/31/43 % — eine 80-%-Schwelle sofort
   würde das Tor rot machen)? Das ist eine Entscheidung, keine stille Anpassung.
2. Gehört die "Vereinigung betrifft nur `missing`"-Eigenschaft von `attachmentNamesOfKind` in einen
   eigenen Kompositionstest für `main.ts`, oder gilt die bestehende Messung am injizierten Port
   (`image-sweep.test.ts`) als hinreichend, weil `main.ts` reine Verdrahtung ohne eigene Fachlogik
   ist?
3. A-A-102 (der fehlende Wächter gegen eine neunte löschende Stelle, aus T-325 B-4) und A-A-103 (die
   gekippte SQL-Vorauswahl, B-1) sind Befunde am Produktivcode, nicht an Prüffällen — sie gehören
   weiterhin domain-dev, nicht mir.

## Nächster Schritt

Code-Reviewer erneut über Strang A laufen lassen: `releaseUnclaimedBlobs`, `releasableBlobOf`,
`removeAttachment`, `removeTodo` und `attachmentNamesOfKind` sind jetzt jeweils mit stehenden
Prüffällen belegt, `file-port.test.ts:66` trägt eine unbedingte Zusicherung. Parallel dazu die
Entscheidung des Orchestrators zur `vitest.config.ts`-Frage (offene Frage 1) — die Zahlen dafür
stehen oben und sind reproduzierbar (Meßkopie-Rezept im Abschnitt 4).
