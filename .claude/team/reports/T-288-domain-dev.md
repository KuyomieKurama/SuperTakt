# T-288 — Der Wächter mißt jetzt vier Gestalten statt zwei

Aufgabe: T-288 — `rueckweg` in `proof-release-safety.mjs` hielt die Gestalt von T-279, nicht die
Regel aus E-106 (Befund T-287-2, Auflage A-V-27); dazu T-287-3 und T-287-4
Status: **fertig**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | `checkNoStoreReadback` um zwei Hälften erweitert: **Spaltenname** `last_version_check_at` (erlaubt in genau vier Dateien, beide Richtungen) und **jeder Datenbankgriff im Ordner des Prüfers**. Zwei neue Gegenproben, davon eine wörtlich die Meßdatei aus T-287. Absatz „Was dieser Wächter NICHT fängt" |
| `packages/storage/migrations/0022_last_version_check_at.hinweis.md` | **neu** — Beistelldatei zu Migration 0022 (T-287-4, A-A-77). Keine Migration, kein `.sql`, Prüfsumme unberührt |
| `docs/datenmodell.md` | T-287-3: „in keiner Route **außer der Datensicherung** (A-20.4), und dort als Zeile des Archivs, nicht als Einstellung"; Zeiger auf die Beistelldatei; „zwei Gegenproben" → vier |
| `docs/architektur.md` | Absatz „Warum vier und nicht zwei (T-288, A-V-27)" an der Stelle, die bisher „zwei Gegenproben" sagte |

Kein Produktivcode geändert. Keine Migration geändert. Keine fremde Hoheit berührt.

## Zusammenfassung

Der Wächter aus T-285 bewachte den **Bezeichner** `lastCheckAt` und die Gestalt des
`VersionCheckStorePort` — also genau den Leser, der durch den Port geht. Der security-checker ist
mit einer Zeile daneben vorbeigegriffen und blieb grün. Bewacht werden seither vier Gestalten,
jede eine Umgehung weiter vom Port entfernt: (1) der Bezeichner, (2) `read` am Port, (3) der
**Spaltenname** außerhalb der vier tragenden Dateien, (4) **irgendein** Datenbankgriff im Ordner
des Prüfers — die einzige der vier, die an keinem Namen des Werts hängt. Punkt 4 fängt den
nächsten Schritt, den der Spaltenname nicht fängt: `SELECT * FROM app_setting` erreicht denselben
Wert, ohne ihn zu nennen. Dazu die zwei Nachzüge: der zu weite Satz in `datenmodell.md` und die
Beistelldatei an Migration 0022.

## Die Gegenprobe, live gemessen — nicht nur eingesetzt

Die Meßdatei des security-checkers hat für die Dauer **eines** Befehls wirklich im Baum gelegen
(eigene Hoheit, `apps/local-api/src/features/version/`), und im selben Befehl entfernt;
`git status` danach unverändert:

```
FEHL  kein Rückweg vom Bestand in die Versionsprüfung …
      messung.ts: nennt die Spalte `last_version_check_at` im Code und gehört nicht zu den vier
                  tragenden Dateien …
      messung.ts: faßt mit `prepare(` eine Datenbank an …
      messung.ts: faßt mit `SELECT ` eine Datenbank an …
      messung.ts: faßt mit `FROM app_setting` eine Datenbank an …
36 bestanden, 1 fehlgeschlagen
```

Vier Befunde aus einer Datei, aus zwei unabhängigen Hälften. Vor T-288 war dieselbe Datei
**35/0 grün**.

## Die Zahlen, vorgerechnet

| Lauf | vorher | nachher | Rechnung |
|---|---|---|---|
| `proof:release-safety` | 35 / 0 | **37 / 0** | Abschnitt 1 zählt je Prüfung je Gegenprobe: `rueckweg` hatte 2, hat 4. Abschnitt 2 zählt je **Prüfung**, und es bleibt eine → +2, nicht +4 |
| `proof:migrations` | 44 Datei(en) | **44 Datei(en)** | der Erzeuger filtert auf `NNNN_name.(up/down).sql`; `.md` fällt durch das Sieb, die Prüfsumme von 0022 ist unberührt |
| `proof:all` | 20 Bilanzzeilen, alle 0 rot | **unverändert, Exit 0** | nur die 35 → 37 bewegt sich |
| `typecheck` | grün | **grün** | acht Pakete plus die Prüfbäume plus `tests/e2e` |
| `boundaries` | grün | **grün** | 467 Quelldateien, „Notiz-Trennung: alle Schichten unverletzt" |
| `test:coverage` | 90 / 1696 / 0 rot | **90 Dateien, 1696 bestanden, 3 übersprungen, 0 rot** | keine Prüfdatei angefaßt |

## Was der Wächter nicht fängt — und warum der Absatz im Quelltext steht

Die Auflage des Auftrags war, nicht zu fragen „welchen Namen verbiete ich", sondern „welche
Wirkung darf nicht eintreten". Die Wirkung ist: **Die Entscheidung, ob eine Anfrage hinausgeht,
hängt an keinem Wert aus dem Bestand.** Hälfte 4 mißt sie am nächsten — der Prüfer erreicht den
Bestand über seinen Port oder gar nicht. Die anderen drei messen Namen, und ein Name ist eine
Gestalt.

Im Quelltext steht deshalb ausgeschrieben (A-A-55 nachgebaut), was durchgeht:

- ein zusammengesetzter Name, ein Bezeichner aus einer Variablen, ein `SELECT *` mit berechnetem
  Schlüssel **außerhalb** des Ordners des Prüfers;
- ein Leser **innerhalb** einer der vier erlaubten Dateien — dort ist der Name frei;
- alles außerhalb des gelesenen Baums: Prüfordner, `dist/`, die `.sql`-Dateien unter
  `packages/storage/migrations/` (der Baum liest keine `.sql`);
- ein anderer Prozeß an derselben Datei. Das ist VG-3 und war nie Sache dieses Laufs.

Gefangen sind **Irrtum und Bequemlichkeit** — der nächste, der den Wert liest, um Anfragen zu
sparen, und dabei T-279 nachbaut, ohne TP-VER-11 je gesehen zu haben. Nicht gefangen ist **Absicht
mit Schreibrecht**. Wer diese Lücke schließen will, schließt sie nicht durch einen fünften Namen,
sondern durch einen Prüffall am Verhalten: zwei nacheinander gebaute Prüfer, je eine Anfrage
(T-287 Messung 2). Der steht seit T-286 in `apps/local-api/test/version/checker.test.ts` — der
Wächter ist die Ergänzung dazu, nicht sein Ersatz.

## Beide Richtungen, die Lehre aus T-249-1

Die erlaubte Menge wird auch **nach unten** gemessen: Fehlt eine der vier tragenden Dateien im
Baum oder nennt sie den Spaltennamen nicht mehr, ist das ein Befund. Ohne diese Hälfte ließe ein
Umzug des Adapters den Lauf grün, während die erlaubte Menge ins Leere zeigt — dieselbe Blindheit,
die in T-249-1 an `RELEASE_PREFIX_FILES` gefunden wurde. Der zweite Nutzen fällt dabei ab: Verliert
`repo-data-archive.ts` die Spalte, verliert der Round-Trip sie still (A-20.4), und auch das wird
jetzt rot.

## Annahmen

1. **Der Pfad der Archivübersetzung** heißt seit PR #17
   `apps/local-api/src/features/data-transfer/data-transfer.ts`, nicht `src/usecases/…` wie im
   Auftrag zitiert. Die vier erlaubten Dateien sind mit `stripComments` nachgemessen, nicht
   abgeschrieben: im **Code** genau diese vier, in **Kommentaren** vier weitere
   (`composition.ts`, `version.ts`, `main.ts` und der Kopf von `repo-data-archive.ts`) — erlaubt,
   weil ein erklärter Name kein Zugriff ist.
2. **Hälfte 4 ist über den Auftrag hinaus gebaut.** Sie war nicht bestellt; die Auflage
   („welche Wirkung darf nicht eintreten") verlangt sie. Sie ist heute grün: im Ordner des
   Prüfers steht **keine** der fünf Marken, roh wie nach `stripComments`.

   > **Berichtigt am 2026-09-11 in T-290** (Befund des code-reviewers zu diesem Bericht).
   > Hier stand: „Sie ist heute grün: im Ordner des Prüfers steht `sqlite` dreimal, alle drei in
   > Kommentaren." Die **Aussage** stimmt, die **Begründung** nicht: `sqlite` ist gar kein
   > Marker — gemessen wird gegen `prepare(`, `SELECT `, `FROM app_setting`,
   > `better-sqlite3` und `UnitOfWork`, und die drei Fundstellen lauten `sqlite3`. Hälfte 4
   > wäre dort auch **ohne** `stripComments` grün. `stripComments` trägt — isoliert gemessen,
   > vom code-reviewer nachgeprüft —, nur nicht an dieser Stelle. Der Satz hätte den nächsten
   > Leser glauben lassen, die Kommentarentfernung sei hier die tragende Sicherung.
3. **Die Marker sind grob gewählt** (`prepare(`, `SELECT `, `FROM app_setting`, `better-sqlite3`,
   `UnitOfWork`). Ein falsches Rot ist hier der billigere Fehler als ein falsches Grün — die
   Zusage lautet, daß dieser Ordner mit keiner Datenbank redet, und wer das ändert, soll es hier
   bestätigen müssen.
4. **Die Beistelldatei heißt `.hinweis.md`**, wie vom security-checker gemessen. Sie benennt
   ausdrücklich auch, was an 0022 **gültig bleibt** (CHECK, Form, `NULL`, Zukunft erlaubt) und was
   am Rückwärtsteil richtig ist — sonst läse sie sich wie eine Warnung vor der ganzen Migration.

## Risiken

1. **Der Wächter bleibt ein Namenswächter, drei Viertel davon.** Das ist im Quelltext gesagt und
   nicht verschwiegen; die verbleibende Lücke ist Absicht mit Schreibrecht und über einen
   Prüflauf nicht zu schließen.
2. **Kein Sicherheitsrisiko hinzugefügt**, kein Produktivpfad angefaßt. Die Beistelldatei wird
   nicht ausgeliefert: Der Läufer arbeitet gegen `migrations.embedded.ts`, und der Erzeuger hat
   sie nicht aufgenommen (44 unverändert).
3. **Die vier erlaubten Dateien sind jetzt ein Umzugshindernis.** Gewollt (E-103 gegengelesen),
   aber der nächste, der `repo-version-check.ts` verschiebt, sieht zwei rote Befunde und muß hier
   bestätigen.

## Offene Fragen an den Orchestrator

- **A-V-27 ist erfüllt und einen Schritt weiter.** Der Wortlaut der Auflage nennt drei
  Gegenproben; es sind vier geworden. Soll 37.8 im Bedrohungsmodell den vierten Punkt
  nachtragen? Das Papier gehört dem security-checker — ich habe es nicht angefaßt.
- **`docs/spec.md` und `docs/testplan.md`** nennen die Zahl der Gegenproben nicht; nichts
  nachzuziehen. Ich habe in `apps/*/test/**` und `tests/` nach der Zahl 35 im Zusammenhang mit
  diesem Lauf gesucht und nichts gefunden. Falls doch ein Prüffall sie festhält, gehört er dem
  unit-tester.
- **T-287-6 (R-23/R-24 unbewertet)** ist weiterhin offen und nicht meine Fläche.

## Nächster Schritt

Einmal `pnpm check` vollständig über alle neun Stufen — `contrast`, `verify:bundle`, `test:rust`,
`build` und `audit` habe ich nicht gefahren, weil ich weder Oberfläche noch Rust noch
Abhängigkeiten angefaßt habe. Danach die Freigabe durch code-reviewer und security-checker; für
letzteren ist die interessante Frage, ob Hälfte 4 die richtige Grenze zieht oder eine
Ordnerhoheit zementiert, die morgen im Weg steht.
