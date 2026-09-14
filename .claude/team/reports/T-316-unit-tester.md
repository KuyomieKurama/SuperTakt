# T-316 — Prüffälle für A-A-98: der Lauf, der löscht

**Aufgabe:** T-316 — Regressionsschutz für A-A-98 (Eigentümerfrage des Aufräumlaufs für
übernommene E-Mail-Dateien) in `packages/*/test/**` und `apps/*/test/**`; zwei Richtungen
festnageln: „der Filter ist weiter, nie enger" und „der Riegel feuert auf zwei Achsen,
unabhängig von einer leeren Eigentümermenge".

**Status:** teilweise — meine eigenen Prüffälle sind fertig, rot-zuerst nachgewiesen und grün.
Das Abdeckungstor selbst ist zum Zeitpunkt dieses Berichts **nicht** grün, aus einem Grund
außerhalb meiner Hoheit (siehe Abschnitt „Beweglicher Boden" unten).

---

## Artefakte

**Neu:**
- `packages/storage/test/migration-0023-attachment-origin.test.ts` — Migration 0023 zurück auf 22
  und wieder vor auf 23; die Eigentümerfrage findet die Datei danach trotzdem (T-313-3).
- `apps/local-api/test/usecases/email-file-sweep.test.ts` — 16 Prüffälle gegen
  `sweepOrphanedEmailFiles`/`OrphanedEmailFileSweep` mit Attrappen, nach dem Vorbild von
  `image-sweep.test.ts` (T-174).

**Geändert:**
- `packages/domain/test/attachment.test.ts` — `attachmentTargetFileName` und
  `attachmentTargetNamesFile` bekommen ihre ersten Prüffälle (rein, ohne Datenbank).
- `packages/storage/test/repo-attachments.test.ts` — neue Blöcke für
  `attachmentsNamingFiles`, `attachmentNamesUnder`, `emailFileCount`, gegen die echte migrierte
  Datenbank.

**Nicht angefasst:** `src/`, `scripts/`, `docs/`, und die beiden jetzt gebrochenen
Alt-Prüfdateien (siehe unten) — bewusst, aus Gründen, nicht aus Zeitmangel.

---

## Was gemessen wird, in den beiden geforderten Richtungen

### 1. „Der Filter ist weiter, nie enger" (Regressionszusicherung)

In `repo-attachments.test.ts`:
- eine zeichengleich passende Zeile (Grundfall),
- eine Zeile mit **anderem Trennerzeichen und anderer Groß-/Kleinschreibung** (T-313-1),
- eine Zeile mit **`origin='user'`** in `attachmentsNamingFiles` — die Frage kennt kein `origin`
  (T-313-2),
- eine Zeile der **Art `image`** mit demselben Namenswert — die Frage kennt kein `kind`,
- ein Name, den niemand nennt, bleibt eine Waise,
- mehr als `NAME_LIKE_CHUNK` (100) Namen auf einmal — die Blockbildung ändert nichts am Ergebnis.

In `packages/domain/test/attachment.test.ts` dieselbe Zusicherung **rein**, ohne Datenbank:
Groß-/Kleinschreibung, beide Trenner, nachgestellter Punkt, „großzügiger als letzter
Pfadbestandteil", leerer Name → `false`.

**Rot-zuerst-Nachweis, zweimal gefahren, jedes Mal zurückgesetzt:**
1. `packages/domain/src/attachment.ts`: `attachmentTargetNamesFile` auf den alten,
   zeichengleichen Vergleich (`target.endsWith(fileName)`, kein `asciiLower`) zurückgesetzt →
   2 der neuen Domänen-Prüffälle wurden rot (`abweichende Groß-/Kleinschreibung`,
   `nachgestellter Punkt`). Zurückgesetzt, `diff` gegen die Ausgangsdatei danach **identisch**,
   139/139 wieder grün.
2. `packages/storage/src/sqlite/repo-attachments.ts`: die SQL-Abfrage in
   `attachmentsNamingFiles` um `AND a.origin = 'email' AND a.kind = 'file'` verengt (genau die
   Regression, vor der die Aufgabe warnt) → 2 Prüffälle rot (`origin='user'`-Gegenprobe,
   `kind='image'`-Gegenprobe), **in beiden betroffenen Dateien** (`repo-attachments.test.ts` und
   `migration-0023-attachment-origin.test.ts`, dort schlägt derselbe Fall über den
   Migrations-Rückweg fehl). Zurückgesetzt, `diff` gegen die Ausgangsdatei danach **identisch**,
   alle Prüffälle wieder grün.

Diese Verengung ist genau der im Auftrag benannte Fall („ein `AND origin = …`, ein
`AND kind = …`") — die Prüffälle fangen ihn nachweislich ab.

### 2. „Der Riegel fragt auf zwei Achsen, nicht bei leerer Menge"

In `apps/local-api/test/usecases/email-file-sweep.test.ts`, Gruppe „der Widerspruchsriegel":
- der wichtigste Einzelfall — `owners.size === 1` (**nicht** 0) **und** `attachmentNamesUnder`
  nennt einen Namen, der nicht gefunden wurde → `refused: 'contradiction'`. Genau der Fall, den
  T-314-domain-dev.md als „vorletzten Fall" bezeichnet und den der alte, an `known.size === 0`
  hängende Riegel nicht sehen konnte.
- zweite Achse „blind": `owners.size === 0`, `attachmentNamesUnder` leer, `emailFileCount() > 0`
  → Widerspruch.
- Gegenprobe: dieselbe Lage, aber `emailFileCount() === 0` → kein Widerspruch, die Waise wird
  entfernt.
- ohne Waise (`orphans.length === 0`) werden `folder`/`attachmentNamesUnder`/`emailFileCount`
  **gar nicht gerufen** — eine unvollständige Zuordnung allein blockiert nichts (T-313-2-Lehre).
- `no_folder`, Reihenfolge (`attachmentKinds → listEmailFiles → pathOf → attachmentsNamingFiles →
  folder → attachmentNamesUnder → emailFileCount → removeEmailFile`), Abbruch mitten im
  Entfernen ohne Verlust des bereits erzielten Fortschritts, `attachmentKinds` wirft.

**Rot-zuerst-Nachweis:** die alte, an `owners.size === 0` hängende Riegel-Form in
`email-file-sweep.ts` simuliert (früher Rücksprung bei nicht-leerer Eigentümermenge, direkt
entfernend statt die Gegenfragen zu stellen) → genau der „wichtigste Einzelfall"-Test wurde rot
(`refused: 'unavailable'` statt `'contradiction'`, weil `removeEmailFile` in der Attrappe absichtlich
wirft). Zurückgesetzt, `diff` identisch, 16/16 wieder grün.

### 3. Drei Gegenproben aus Kapitel 40.1, in der Speicherungsschicht

- zeichengleiche Zeile, abweichender Pfad (T-313-1) — in `repo-attachments.test.ts`.
- `origin='user'` auf einer Zeile in diesem Ordner (T-313-2) — ebenda.
- Migration 0023 zurück (auf 22) und wieder vor (T-313-3) — eigene Datei, über den echten
  `createMigrationRunner`, nicht über die vorgemischte `setup.ts`-Verbindung (dasselbe Verfahren
  wie `migration-0012-pool-rule-restrict.test.ts`). Nachgewiesen: `origin` fällt beim Rückweg
  (`SELECT origin` wirft `no such column`), steht nach dem Wiedervorgehen auf `'user'`
  (`DEFAULT`), und `attachmentsNamingFiles` findet die Datei **trotzdem** — `emailFileCount()`
  dagegen zählt bewusst `0`, weil sie absichtlich eng bleibt (A-A-98, T-314 Abschnitt 1.2).
  `integrity_check` und `foreign_key_check` sauber danach.

### 4. Der vierte Weg (Bildlauf, voller Pfad statt Name)

**Nicht geschrieben — die Naht steht nicht, sie ist im selben Moment entstanden, in dem ich
gemessen habe (siehe unten).** Kein Prüffall gegen einen Zwischenstand.

---

## Beweglicher Boden — genau wie in T-312, diesmal auf zwei Dateien gleichzeitig

Während dieser Aufgabe lief, hat domain-dev **live** an T-315 gearbeitet (Vereinheitlichung von
Bild- und E-Mail-Aufräumlauf). Gemessen an Datei-Zeitstempeln, in der Reihenfolge, in der ich sie
gesehen habe:

1. `packages/storage/src/ports.ts` und `repo-attachments.ts`: `AttachmentPort.knownImageTargets`
   ist **ersatzlos gestrichen** und durch die gemeinsame `attachmentsNamingFiles` ersetzt (dieselbe
   Frage, die auch der E-Mail-Lauf stellt) — mit demselben A-A-98-Kommentar, den T-314 für den
   E-Mail-Fall geschrieben hat.
2. Eine neue, bisher **unversionierte** Datei ist entstanden:
   `apps/local-api/src/features/todos/orphan-sweep.ts` — ein gemeinsamer Ablauf
   (`sweepOrphanedBlobs`), den `image-sweep.ts` und (noch nicht) `email-file-sweep.ts` aufrufen
   sollen. Der Kopfkommentar dort erklärt es selbst: „Bis T-315 gab es zwei Abschriften desselben
   Verfahrens ... drei der vier gemessenen Löschwege lagen danach ausschließlich in der
   Abschrift" — exakt der vierte Weg aus T-314 Abschnitt 4 dieses Berichts.
3. `apps/local-api/src/features/todos/image-sweep.ts` wurde **während meiner Messung**
   (Dateizeitstempel 03:24:34, mein letzter Lesevorgang davor war 03:20 Uhr) auf die neue
   Schnittstelle umgestellt (`OrphanSweepReport` statt `number`, delegiert an
   `sweepOrphanedBlobs`).
4. `apps/local-api/src/features/todos/email-file-sweep.ts` — die Datei, gegen die meine eigenen
   16 Prüffälle laufen — ist zum Zeitpunkt dieses Berichts **noch nicht** umgestellt (`diff` gegen
   meine eigene Sicherungskopie von vor dem Start dieser Aufgabe: identisch). Meine Prüffälle
   zielen also auf einen Stand, der bis eben stabil war, aber laut Kopfkommentar von
   `orphan-sweep.ts` als Nächstes ebenfalls umgezogen werden soll.

**Folge, konkret gemessen:**
- `apps/local-api/test/usecases/image-sweep.test.ts` (T-174, nicht meine Datei in dieser Aufgabe,
  aber in meiner Hoheit) — **16 von 18 Prüffällen rot**, weil die alte Schnittstelle
  (`knownImageTargets`, `removed: number`) nicht mehr existiert.
- `packages/storage/test/repo-attachments.test.ts`, Gruppe
  „createAttachmentPort.knownImageTargets" (ebenfalls T-174, nicht von mir angelegt) — **4 von 4
  Prüffällen rot**, `TypeError: db.unit.attachments.knownImageTargets is not a function`.
- Zusätzlich, offenbar durch eine **weitere, parallel laufende** Aufgabe (nicht ich — ich habe
  diese Dateien in dieser Aufgabe nie geöffnet): `packages/domain/test/email-attachment.test.ts`
  und `apps/local-api/test/usecases/email-attachments.test.ts` zeigen ebenfalls unstaged
  Änderungen. Ich habe sie nicht angefasst und nicht geprüft, ob sie grün sind — das ist außerhalb
  dieser Aufgabe und vermutlich eine zweite, gleichzeitig laufende Prüfaufgabe zu T-315.

**Ich habe diese vier Fälle bewusst nicht repariert.** Erstens ist es nicht meine Aufgabe
(T-316 ist A-A-98/E-Mail-Lauf, nicht T-315/Bildlauf-Vereinheitlichung). Zweitens — der
wichtigere Grund — die Naht ist nicht stabil: `image-sweep.ts` wurde buchstäblich in den Minuten
gerührt, in denen ich maß, `email-file-sweep.ts` steht noch auf dem alten Stand, und
`orphan-sweep.ts` trägt noch keinen eigenen Bericht. Ein Prüffall gegen diesen Zwischenstand wäre
in einer Stunde wieder falsch. Das ist exakt die Lehre aus T-312, die im Auftrag genannt wird —
diesmal betrifft sie nicht nur einen Bericht gegen den Quelltext, sondern den Quelltext gegen sich
selbst, innerhalb derselben Sitzung.

---

## Auswirkung auf das Abdeckungstor

`pnpm check` / `test:coverage` wird **im Moment nicht grün** — nicht wegen der Zahl, sondern wegen
20 tatsächlich fehlschlagender Prüffälle in zwei Dateien, die nicht in dieser Aufgabe entstanden
sind und deren Schnittstelle sich unter der Hand geändert hat. Das ist ein Befund für die nächste
Welle (T-315 abschließen, danach `image-sweep.test.ts` und die vier `knownImageTargets`-Fälle in
`repo-attachments.test.ts` neu schreiben), keiner für T-316.

**Der Zweigwert selbst, gemessen mit allen vier neuen/geänderten Dateien aus dieser Aufgabe, über
`packages/storage` + `apps/local-api` zusammen (die reale Zusammensetzung, unter der
`packages/storage/src` auch von Integrationstests aus `apps/local-api` mitgemessen wird — isoliert
auf `packages/storage` allein liegt die Zahl bei nur 77,32 % und risse die Schwelle):**

```
packages/storage/src/**  —  797 / 988 Zweige  =  80,67 %
```

**Luft zur Schwelle: 0,67 Prozentpunkte, 6 Zweige.** Das ist knapper als der Stand aus T-314
(794/990 = 80,20 %) in absoluten Prozentpunkten enger, aber die Zusicherungen aus dieser Aufgabe
tragen einen echten Teil davon — insbesondere `attachmentsNamingFiles`, `attachmentNamesUnder` und
`emailFileCount` in `repo-attachments.ts` lagen laut T-314-Bericht bei **null** Prüffällen und
haben jetzt eigene Zeilen. Diese Zahl ist mit derselben Vorsicht zu lesen wie alles andere in
diesem Bericht: `packages/storage/src` wird von domain-dev gerade weiter verändert
(`repo-attachments.ts`, `ports.ts`), und die nächste Verschiebung — in jede Richtung — ist nicht
auszuschließen.

---

## Annahmen

1. **Kein Prüffall für den vierten Weg (Bildlauf/voller Pfad).** Die Naht (`orphan-sweep.ts` +
   umgestelltes `image-sweep.ts`) ist während dieser Aufgabe entstanden, aber `email-file-sweep.ts`
   zieht noch nicht mit, und es gibt noch keinen Bericht zu T-315. Ich schreibe keinen Prüffall
   gegen einen Zwischenstand.
2. **Die vier gebrochenen `knownImageTargets`-Fälle und die 16 gebrochenen
   `image-sweep.test.ts`-Fälle bleiben unverändert liegen.** Sie sind nicht Teil von T-316, ihre
   Reparatur setzt eine abgeschlossene und berichtete T-315 voraus.
3. **Die Migrationsprüfung liegt in einer eigenen Datei**, nach dem Vorbild von
   `migration-0012-pool-rule-restrict.test.ts` — nicht in `repo-attachments.test.ts`, weil sie den
   echten Migrationsläufer statt der vorgemischten `setup.ts`-Verbindung braucht.

## Risiken

- **Das Abdeckungstor ist im Moment rot**, aus Gründen außerhalb meiner Hoheit (siehe oben) — nicht
  wegen der Zahl, sondern wegen 20 fehlschlagender Prüffälle in zwei Dateien, die T-315 unter der
  Hand verändert hat.
- **Die 80,67 % sind eine Momentaufnahme.** Solange domain-dev an `packages/storage/src/**`
  weiterarbeitet, kann die nächste Messung anders ausfallen — in beide Richtungen.
- **Zwei weitere Testdateien** (`packages/domain/test/email-attachment.test.ts`,
  `apps/local-api/test/usecases/email-attachments.test.ts`) zeigen unstaged Änderungen, die nicht
  von mir stammen. Ich habe sie nicht geprüft — das gehört vermutlich einer parallel laufenden
  Aufgabe.

## Offene Fragen an den Orchestrator

1. Soll `apps/local-api/test/usecases/image-sweep.test.ts` und die vier
   `knownImageTargets`-Fälle in `repo-attachments.test.ts` in derselben Welle wie der T-315-Abschluss
   neu geschrieben werden, oder als eigener Folgeauftrag?
2. Gehört ein Prüffall für den vierten Weg (Bildlauf, voller Pfad statt Name) in denselben Auftrag
   wie oben — sobald `orphan-sweep.ts`/`email-file-sweep.ts` fertig verdrahtet sind?
3. Wer schreibt den T-315-Bericht? Ohne ihn kann ich (oder der nächste unit-tester) die Naht nicht
   verbindlich als „steht" behandeln.

## Nächster Schritt

domain-dev meldet T-315 ab (Bericht, Stand von `email-file-sweep.ts` gegenüber
`orphan-sweep.ts`), danach unit-tester in derselben oder nächster Welle:
`image-sweep.test.ts` neu gegen `OrphanSweepPorts`/`OrphanSweepReport`, die vier
`knownImageTargets`-Fälle in `repo-attachments.test.ts` ersetzen, und — sobald belastbar — der
vierte-Weg-Prüffall (voller Pfad statt Name im Bildverzeichnis).
