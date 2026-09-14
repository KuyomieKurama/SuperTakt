# T-317 — Die Naht: `image-sweep.test.ts` neu, `knownImageTargets` gestrichen, der vierte Weg und die Verschärfung gemessen

**Aufgabe:** T-317 — gegen den fertigen T-315-Stand: `image-sweep.test.ts` neu gegen
`OrphanedImageSweep`/`OrphanSweepReport`, den `knownImageTargets`-Block in
`repo-attachments.test.ts` ersatzlos streichen, den vierten Löschweg (Bildkopie, Zeile mit vollem
Pfad statt Namen) bauen, die Verschärfung `claimed > owned` am **gemischten** Fall messen.

**Status:** fertig. `pnpm typecheck:test` ist grün, der volle `vitest run --coverage`-Lauf über
den ganzen Arbeitsbereich ist grün (97 Testdateien, 1862 bestanden, 3 übersprungen, 0 rot),
`boundaries` ist grün. Rot-zuerst für beide betroffenen Dateien nachgewiesen (Abschnitt 2).

---

## 1 — Artefakte

**Neu geschrieben:**
- `apps/local-api/test/usecases/image-sweep.test.ts` — komplett neu gegen `OrphanedImageSweep`
  (acht Felder) und `OrphanSweepReport`. 27 Prüffälle: dieselben Riegel/Reihenfolge wie
  `email-file-sweep.test.ts` (T-316), plus eine eigene Gruppe mit den **neun Meßfällen aus
  T-315-domain-dev.md Abschnitt 4** (darunter der vierte Weg), plus die Verschärfung
  `claimed > owned` an einem 1-von-10-Fall, plus ein Prüffall für
  `KINDS_HOLDING_IMAGE_FILES`.

**Neu:**
- `apps/local-api/test/usecases/orphan-sweep.test.ts` — prüft `sweepOrphanedBlobs` (das
  gemeinsame Verfahren) unmittelbar: dass `sweepOrphanedImages` und `sweepOrphanedEmailFiles`
  bei strukturell gleichwertigen Eingaben denselben Bericht liefern (auch bei
  `unknown_kinds`), und die `claimed > owned`-Verschärfung ein zweites Mal, direkt am
  Verfahren und mit einem dritten, generischen Aufrufer — als Beleg, dass die Regel im
  Verfahren liegt und nicht zufällig in beiden Abschriften gleich ausgefallen ist.

**Geändert:**
- `packages/storage/test/repo-attachments.test.ts` — den `describe`-Block
  `createAttachmentPort.knownImageTargets` (vier Prüffälle, Zeilen 366–450 im alten Stand)
  ersatzlos gestrichen, durch einen Begründungskommentar ersetzt. Die Frage, die er prüfte,
  prüft der Block `createAttachmentPort.attachmentsNamingFiles` (ab Zeile 668 im alten Stand)
  bereits — nachgeprüft, nicht geglaubt (Abschnitt 3).

**Nicht angefaßt:** `src/`, `scripts/`, `docs/` — auch nicht `docs/testplan.md` (siehe
Abschnitt 5, das ist e2e-testers Datei).

---

## 2 — Rot zuerst, nachgewiesen

Vor jeder Änderung gemessen, am unveränderten Stand nach T-315:

```
apps/local-api/test/usecases/image-sweep.test.ts
  vitest: 16 failed | 2 passed (18)
  tsc -p apps/local-api/tsconfig.test.json --noEmit: 22 Übersetzungsfehler in dieser Datei

packages/storage/test/repo-attachments.test.ts
  vitest: 4 failed | 43 passed (47)
  tsc -p packages/storage/tsconfig.test.json --noEmit: 5 Übersetzungsfehler in dieser Datei
```

(Die 22 bzw. 5 Übersetzungsfehler weichen leicht von den im Auftrag genannten 20 bzw. 5 ab —
`tsc` zählt teils mehrere Fehler pro Zeile; die Fehlerursache und die betroffene Datei sind
identisch mit dem, was T-315-domain-dev.md Abschnitt 5 beschreibt.)

Nach der Änderung:

```
apps/local-api/test/usecases/image-sweep.test.ts:      27 passed (27), 0 Übersetzungsfehler
apps/local-api/test/usecases/orphan-sweep.test.ts:      4 passed (4),  0 Übersetzungsfehler
packages/storage/test/repo-attachments.test.ts:        43 passed (43), 0 Übersetzungsfehler
```

---

## 3 — Nachgeprüft statt geglaubt: der `knownImageTargets`-Block ist wirklich redundant

Der Auftrag verlangte ausdrücklich, das nachzuprüfen statt zu glauben. Gemessen: Die vier
gestrichenen Fälle prüften „ein zeichengleicher Name wird gefunden", „ein unbekannter Name
nicht", „eine Zeile mit demselben Namenswert, aber `kind='file'`, zählt NICHT" und „ein
entfernter Anhang verschwindet aus der Antwort". Der verbleibende Block
`createAttachmentPort.attachmentsNamingFiles` (ab Zeile 668 im alten Stand) deckt densel­ben
Namensvergleich bereits ab — **weiter statt enger**: Er prüft ausdrücklich, daß eine Zeile der
Art `image`, `link` **oder** `file` mit demselben Namenswert als Eigentümer zählt (dieselbe
Aussage, nur in die andere Richtung formuliert: die alte Fassung verlangte „kind='file' zählt
nicht als Bild-Eigentümer", die neue Fassung verlangt „kind ist irrelevant, jede Art zählt").
Das „ein entfernter Anhang verschwindet"-Verhalten hängt an derselben zugrundeliegenden SQL-Frage
(`create`/`remove` gegen dieselbe Tabelle) und ist über die generischen Fälle mit abgedeckt, da
`attachmentsNamingFiles` bei jedem Aufruf frisch fragt und keinen eigenen Zustand hält.

Die Gesamt-Zweigzahl von `packages/storage/src/**` (Abschnitt 6) ist vor und nach dem Streichen
identisch geblieben (988 Zweige insgesamt, 797 getroffen) — ein direkter Beleg, daß keine Zweige
in `repo-attachments.ts` verwaist sind, die nur der gestrichene Block getroffen hätte.

---

## 4 — Der vierte Löschweg ist gebaut und gemessen

`image-sweep.test.ts`, Gruppe „die neun Meßfälle aus T-315-domain-dev.md Abschnitt 4", Fall
„DER VIERTE WEG": eine Bildkopie, deren Zeile denselben Namen als **vollen Pfad** statt als
bloßen Namen trägt (`kind='file'`, `target` endet auf den Dateinamen). Vor T-315 fragte der
Bildlauf mit einem zeichengleichen `target IN (namen)` über bloße Namen und übersah diese Zeile
— **entfernt = 1, Datei fort, Zeile blieb stehen** (T-315-domain-dev.md Abschnitt 4). Seit T-315
fragt er über die gemeinsame `attachmentsNamingFiles`, die auf `target.endsWith(name)` endet;
der Prüffall belegt: `{read: 1, owned: 1, removed: 0, refused: null}` — die Kopie bleibt liegen.

Ergänzt um die übrigen acht Fälle aus derselben Tabelle (Groß-/Kleinschreibung, `kind='file'` bei
zwei Zeilen, Gegenprobe nach oben, der gemischte Fall, Zeile-ohne-Datei-plus-Waise, dieselbe
fehlende Zeile ohne Waise — **still**, Zeile-mit-vollem-Pfad-plus-Waise auf der ersten Achse
allein, und der fremde Name `rechnung.pdf`, der unsichtbar bleibt, während die Waise daneben
fällt) — alle neun jetzt mit exakt den im Bericht genannten Zahlen nachgewiesen.

---

## 5 — Die Verschärfung `claimed > owned`, gemessen am gemischten Fall (nicht am leeren)

Zwei unabhängige Prüffälle, beide mit demselben Verhältnis **1 von 10** (nicht 0 von N):

1. `image-sweep.test.ts`, Gruppe „die Verschärfung claimed > owned": zehn gefundene Kopien, eine
   davon zugeordnet, neun mit gewechselter Gestalt. `imageCount()` meldet `10`. Ergebnis:
   `{read: 10, owned: 1, removed: 0, refused: 'contradiction'}`, mit der Protokollzeile
   `attachment_image_sweep_contradiction files=10 owned=1 orphans=9 expected=0 missing=0
   attachments=10`. Gegen `owned === 0` (die alte Fassung) hätte dieser Riegel **geschwiegen** —
   `owned` ist hier `1`, nicht `0`.
2. `orphan-sweep.test.ts`, direkt am Verfahren `sweepOrphanedBlobs` mit einem dritten,
   generischen Satz Attrappen: derselbe 1-von-10-Fall feuert, und die Gegenprobe (`claimed === owned
   === 1`) läßt die neun tatsächlichen Waisen fallen — der Beleg, daß die Verschärfung nicht an
   `owned === 0`, sondern wirklich an `claimed > owned` hängt.

---

## 6 — Die Abdeckungsschwelle: unverändert, Luft gleich geblieben

Gemessen mit `vitest run --coverage` über den **gesamten** Arbeitsbereich (dieselbe
Zusammensetzung wie in T-315/T-316 — `packages/storage/src` wird auch von den
Integrationstests aus `apps/local-api` mitgemessen):

```
packages/storage/src/**  —  797 / 988 Zweige  =  80,67 %   (Luft: 0,67 Prozentpunkte, 6 Zweige)
```

**Zeichengleich mit dem Stand aus T-315/T-316.** Die Luft hat sich **weder vergrößert noch
verkleinert**: Meine neuen Prüffälle in `image-sweep.test.ts` und `orphan-sweep.test.ts` laufen
gegen Attrappen (kein SQLite, kein Dateisystem) und treffen damit keinen einzigen Zweig in
`packages/storage/src`; das Streichen des `knownImageTargets`-Blocks entfernt keine Zweige, weil
die zugrundeliegende Funktion selbst schon in T-315 aus dem Quelltext gestrichen wurde (988
Zweige insgesamt, unverändert vor und nach meiner Änderung).

Isoliert (nur `packages/storage/test`, ohne `apps/local-api`) liegt der Wert weiterhin bei
**77,32 %** — ebenfalls unverändert, unter der Schwelle, wie schon in T-316 gemessen. Die
tragende Zahl für `pnpm check` bleibt die kombinierte: **80,67 %**, mit **sechs Zweigen** Luft.

Der volle Lauf über den gesamten Arbeitsbereich (`vitest run --coverage --passWithNoTests`,
Exitcode 0):

```
Statements   : 91.47 % (2445/2673)
Branches     : 85.97 % (1465/1704)
Functions    : 94.67 % (498/526)
Lines        : 93.56 % (2167/2316)
```

Alle drei konfigurierten Schwellen (`packages/domain/src/**`, `packages/storage/src/**`,
`packages/export/src/**`) bestehen; der Lauf endet mit Exitcode 0.

---

## 7 — `docs/testplan.md`: gemeldet, nicht geändert

TP-ANH-21 verweist weiterhin auf den alten Pfad `usecases/image-sweep.ts`. Die Datei heißt seit
der Merkmalsstruktur `features/todos/image-sweep.ts`, und das gemeinsame Verfahren liegt seit
T-315 in `features/todos/orphan-sweep.ts`. Das ist e2e-testers Datei — ich melde es nur, wie im
Auftrag verlangt, und ändere nichts.

---

## 8 — Annahmen (entschieden, ohne zu fragen)

1. **Die neun Meßfälle aus Abschnitt 4 sind als Attrappen nachgebaut**, nicht gegen eine echte
   Datenbank. Was `attachmentsNamingFiles`/`attachmentNamesUnder` bei abweichender
   Groß-/Kleinschreibung, anderem `kind` oder vollem Pfad tatsächlich antworten, ist an der
   echten Datenbank in `repo-attachments.test.ts` und rein in `packages/domain/test/attachment.test.ts`
   nachgewiesen; `image-sweep.test.ts` prüft, daß `sweepOrphanedImages` diese Antworten korrekt
   auswertet. Eine Kopie derselben Datenbank-Prüffälle in `image-sweep.test.ts` wäre eine dritte
   Abschrift derselben Aussage gewesen — genau das, wovor T-315 warnt.
2. **`orphan-sweep.test.ts` ist eine eigene, neue Datei** statt eines Nachtrags in
   `image-sweep.test.ts` oder `email-file-sweep.test.ts` — sie prüft das Verfahren, nicht einen
   der beiden Aufrufer, und gehört deshalb neben beide, nicht in einen von ihnen.
3. **Der `knownImageTargets`-Block wurde ersatzlos gestrichen** und nicht als „veraltet"
   auskommentiert stehengelassen — an seiner Stelle steht ein Kommentar, der auf den Block
   verweist, der die Frage jetzt trägt. Eine tote, aber lesbare Testleiche wäre bei der nächsten
   Suche nach `knownImageTargets` wieder ein Fehlalarm.
4. **Keine Änderung an `apps/local-api/test/usecases/email-attachments.test.ts` und den beiden
   neuen Dateien `email-attachment-reason-producers.test.ts` /
   `email-attachments-rollback.test.ts`.** Sie zeigen unstaged Änderungen, die nicht aus dieser
   Aufgabe stammen und nicht T-317 betreffen — vermutlich eine parallel laufende Aufgabe. Ich habe
   sie nicht angefaßt und nicht geprüft; der volle Testlauf über den ganzen Arbeitsbereich zeigt
   sie als grün.

---

## 9 — Risiken

1. **Die Abdeckungsluft bleibt bei sechs Zweigen (0,67 Prozentpunkte).** Unverändert seit T-315.
   Der nächste Agent, der `packages/storage/src` anfaßt, hat weiterhin wenig Spielraum, bevor die
   Schwelle reißt.
2. **`packages/storage/src` isoliert liegt weiterhin unter der Schwelle (77,32 %).** Der
   kombinierte Wert (80,67 %) trägt das Tor nur, solange `apps/local-api`-Integrationstests
   dieselben Zweige mitmessen. Fiele einer dieser Integrationstests weg, ohne daß ein
   `packages/storage`-eigener Test nachrückt, risse die Schwelle sofort.
3. **`docs/testplan.md` TP-ANH-21 verweist auf einen Pfad, der nicht mehr existiert** — siehe
   Abschnitt 7, gehört e2e-tester.

---

## 10 — Offene Fragen an den Orchestrator

Keine. Der Auftrag war vollständig ausführbar; die Naht stand, wie angekündigt.

---

## 11 — Definition of Done

| Punkt | Stand |
|---|---|
| `image-sweep.test.ts` neu gegen `OrphanedImageSweep`/`OrphanSweepReport` | fertig, 27 grün |
| `knownImageTargets`-Block in `repo-attachments.test.ts` gestrichen | fertig, nachgeprüft (Abschnitt 3) |
| Vierter Löschweg gebaut und gemessen | fertig (Abschnitt 4) |
| `claimed > owned` am gemischten Fall gemessen | fertig, zweifach (Abschnitt 5) |
| Rot vor Grün nachgewiesen | ja (Abschnitt 2) |
| Abdeckung ≥ 80 % auf `packages/domain` und `packages/export` | grün, unverändert (`domain` 93,43 %, `export` 92,85 % Zweige im vollen Lauf) |
| Abdeckung ≥ 80 % auf `packages/storage` (kombiniert) | grün, 80,67 %, Luft unverändert |
| Keine echten Call-Nummern/Kundendaten/Zugangsdaten in Testdaten | eingehalten — nur Platzhalter-Hex-Namen und erfundene Pfade |
| `typecheck:test` | grün |
| `boundaries` | grün |
| Bericht abgelegt | diese Datei |
