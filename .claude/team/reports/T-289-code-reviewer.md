# T-289 — Review von T-288 (domain-dev)

Aufgabe: T-289 — Prüfung von T-288 (`checkNoStoreReadback`, Beistelldatei 0022, Nachzüge in
`datenmodell.md` und `architektur.md`)
Status: **Nacharbeit**

Geprüfter Umfang: `apps/local-api/scripts/proof-release-safety.mjs` (Diff: 285 Zeilen dazu, **0
gelöscht** — rein additiv, gemessen mit `git diff --numstat`),
`packages/storage/migrations/0022_last_version_check_at.hinweis.md`, die geänderten Absätze in
`docs/datenmodell.md` und `docs/architektur.md`.

Selbst gefahren: `proof:release-safety` (**37/0**), `proof:migrations` (44 Datei(en), unverändert),
`proof:all` (**Exit 0**, 18 Bilanzzeilen, 0 rot), `typecheck` (Exit 0). Dazu drei eigene Messungen
gegen eine Kopie von `checkNoStoreReadback` und gegen `stripComments` im Kratzverzeichnis; kein
Produktivcode und keine fremde Datei angefaßt.

Dateihoheit: `apps/local-api/scripts/**`, `packages/storage/migrations/**`, `docs/datenmodell.md`,
`docs/architektur.md` — alle vier **domain-dev**. Kein Übergriff.

## Was ich nachgerechnet habe, bevor ich urteile

**1. Die Zahl 35 → 37 stimmt, und sie stimmt nicht zufällig.** Ausgezählt am Quelltext, nicht am
Bericht:

| Abschnitt | Zählregel im Code | Prüfsätze |
|---|---|---|
| 0 | feste `check(`-Aufrufe | 6 (`stripComments`) + 3 = **9** |
| 1 | Zeile 1030–1047: **je Prüfung je Gegenprobe** (`injections`-Schleife) + 5 Nicht-Ausgänge | 13 + 5 = **18** |
| 2 | Zeile 1069–1072: **je Prüfung**, eine Zeile je `CHECKS`-Eintrag | **7** |
| 3 | feste `check(`-Aufrufe | **3** |

Summe **37**, gemessen 37. Gegenprobe nach unten: der Stand in `HEAD` (ohne `rueckweg`) ergibt
9 + 14 + 6 + 3 = **32**; T-285 legte `rueckweg` mit zwei Gegenproben dazu (+2 in Abschnitt 1, +1 in
Abschnitt 2) = **35**; T-288 legt zwei Gegenproben dazu = **37**. Die Behauptung „+2 statt +4" folgt
aus der Struktur (beide neuen Gestalten liegen **in derselben** `CHECKS`-Prüfung `rueckweg`), nicht
aus einem Zufall.

**2. Beide Richtungen stehen wirklich im Code** (Zeile 788–801) und wirken. Gemessen gegen eine
Kopie der Funktion mit erfundenen Bäumen:

- Umzug `repo-version-check.ts` → `packages/storage/src/version-check/repo.ts`, Inhalt gleich:
  **3 Befunde** (neuer Ort nennt `lastCheckAt`, neuer Ort nennt die Spalte, alter Ort „nicht im
  gelesenen Baum").
- Umzug **plus** Umschreiben auf `SELECT *` (Spaltenname verschwindet): **1 Befund** („nicht im
  gelesenen Baum"). Auch der stille Fall wird rot.
- `repo-data-archive.ts` behält den Pfad, verliert die Spalte: **1 Befund** (A-20.4-Round-Trip).

**3. `stripComments` nimmt Kommentare zuverlässig aus.** Isoliert gemessen: Zeilen-, Block- und
JSDoc-Kommentar mit allen fünf Markern → **kein** Treffer; Zeichenketten und Vorlagen behalten ihre
Marker (so gewollt, eine SQL-Zeichenkette *ist* der Zugriff). Im Ordner `features/version/` stehen
**null** Marker, roh wie nach `stripComments`. `sqlite` steht dort dreimal (`version.ts:104`, `:254`,
`:300`), alle drei in Blockkommentaren — siehe aber Befund 8.

## Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:828   hoch    `/export interface VersionCheckStorePort\s*\{([^}]*)\}/` bricht am ERSTEN `}`. Gemessen: bei `write(at: Date, opts: { force: boolean }): Promise<void>;` gefolgt von `read(): Promise<string | null>;` ergibt die Mitgliederliste `["write"]` und das Urteil GRÜN — genau die Gestalt aus T-279 wird unsichtbar. Fix: Rumpf bis zur Klammer am Zeilenanfang fassen (`([\s\S]*?)\n\}`) und eine fünfte Gegenprobe mit Inline-Objekttyp aufnehmen. (Nicht von T-288 eingeführt, sondern von T-285 — steht aber in der geprüften Funktion und ist genau der Fehler, gegen den T-288 antritt.)
apps/local-api/scripts/proof-release-safety.mjs:788   mittel  Die Untergrenze der vier tragenden Dateien hat KEINE Gegenprobe. Abschnitt 1 speist für `rueckweg` nur `features/version/eingesetzt.ts` und `version.ts` ein; keine Gegenprobe erreicht die Zweige „nicht im gelesenen Baum" und „nennt die Spalte nicht mehr". Der Kopf dieser Datei verlangt „zu JEDER Prüfung einen Verstoß", und T-143 S-1 steht darunter geschrieben: eine Gegenprobe, die die Lücke nicht trifft, ist keine. Fix: fünfter Eintrag in `COUNTER_PROOFS.rueckweg` — `{ name: 'eine tragende Datei verliert die Spalte', path: 'packages/storage/src/sqlite/repo-data-archive.ts', source: '// die Spalte ist weg\n' }`; der Einsetzmechanismus ersetzt bereits nach Pfad. Zahl steigt damit auf 38.
apps/local-api/scripts/proof-release-safety.mjs:743   mittel  „Was dieser Wächter NICHT fängt", dritter Punkt: „alles außerhalb des gelesenen Baums: Prüfordner, `dist/`, die `.sql`-Dateien unter `packages/storage/migrations/` (der Baum liest keine `.sql`)". Die Begründung ist falsch und läßt die Lücke kleiner erscheinen: `packages/storage/migrations/` liegt GANZ außerhalb des Baums, weil `SOURCE_ROOTS` nur acht `src`-Wurzeln kennt — eine `helper.ts` neben den Migrationen würde ebenfalls nicht gelesen, der Satz verspricht das Gegenteil. Ungenannt bleiben außerdem jeder `scripts/`-Baum, `packages/ui-tokens/**` und `apps/web/public/**` (dort liegt mit `startup-appearance.js` ausgelieferter Laufzeitcode). Fix: „alles außerhalb der acht `src`-Wurzeln und der zehn Einzeldateien — jeder `scripts/`-Baum, `packages/ui-tokens/**`, `apps/web/public/**`, `packages/storage/migrations/**`, dazu Prüfordner und `dist/`."
apps/local-api/scripts/proof-release-safety.mjs:738   mittel  „Gefangen sind **Irrtum und Bequemlichkeit**" trägt nur, solange der Leser `lastCheckAt` heißt. Eine zweite Lesemethode im erlaubten Adapter (`repo-version-check.ts`, wo `lastCheckAt()` samt echtem `SELECT` schon steht), in `ports.ts` deklariert, in `composition.ts` gerufen und als Geschwisterfeld neben `store` in `VersionCheckerOptions` gereicht, ist an allen vier Gestalten vorbei: kein `lastCheckAt`, kein Spaltenname außerhalb erlaubter Dateien, kein Datenbankmarker in `features/version/`, und Gestalt 2 mißt nur die Mitglieder von `VersionCheckStorePort`, nicht die Optionen des Prüfers. Fix (billig und in derselben Lehre wie `RELEASE_PREFIX_FILES`): die Mitgliedermenge von `VersionCheckStatePort` in `ports.ts` als Obergrenze festnageln (genau `recordCheck` und `lastCheckAt`, jede weitere Methode ist ein Befund) — oder, wenn das zu weit geht, diese Gestalt im NICHT-fängt-Absatz beim Namen nennen.
apps/local-api/scripts/proof-release-safety.mjs:810   niedrig Gestalt 4 hat keine Untergrenze: `VERSION_FEATURE_PREFIX` wird nie gegen eine nichtleere Menge gemessen. Daß ein Umzug des Ordners heute trotzdem rot wird, ist Zufall — es hängt daran, daß `API_URL_FILE` (Abschnitt 0) und `VERSION_CHECKER_FILE` (Zeile 820) zwei Dateien darin festnageln. Die im Bericht reklamierte Regel „beide Richtungen" gilt damit für Gestalt 3, nicht für Gestalt 4. Fix: eine Zeile vor der Schleife — ist `files.filter(f => f.path.startsWith(VERSION_FEATURE_PREFIX)).length === 0`, dann Befund „der Ordner des Prüfers liegt nicht im gelesenen Baum".
apps/local-api/scripts/proof-release-safety.mjs:761   niedrig `checkNoStoreReadback` ist mit 84 Zeilen und vier voneinander unabhängigen Durchläufen keine Funktion mehr, sondern vier. Schnittlinie, exakt: 764–770 → `findeLeserUeberDenPort(files)`, 781–801 → `findeSpaltennameAmPortVorbei(files)`, 810–818 → `findeDatenbankgriffImPrueferordner(files)`, 820–842 → `pruefeGestaltDesPorts(files)`; `checkNoStoreReadback` wird zur Verkettung der vier Rückgaben. Verhaltensgleich: die beiden frühen `return findings` (825, 832) wirken heute schon erst, nachdem die Durchläufe 1–4 gelaufen sind, und werden dabei zu lokalen `return` in `pruefeGestaltDesPorts`. Der lange Prosakopf bleibt, wo er ist; nur die Absatzüberschriften wandern an ihre Funktion.
apps/local-api/scripts/proof-release-safety.mjs:721   niedrig „Vier Hälften" — eine Hälfte gibt es zweimal, nicht viermal. Dieselbe Datei sagt zwei Zeilen später richtig „Gestalt". Betroffen: 721 („Vier Hälften inzwischen"), 773 („Dritte Hälfte"), 804 („Vierte Hälfte") und die gleichlautenden Stellen im Bericht T-288. Fix: durchgängig „Gestalt".
apps/local-api/scripts/proof-release-safety.mjs:20    niedrig „Er misst drei Dinge über den ganzen Quellbaum:" — darunter stehen vier Punkte. Punkt 4 kam mit T-285, die Zahl blieb stehen (in `HEAD` sind es noch drei Punkte, also nicht von T-288 verursacht). Fix: „vier Dinge".
docs/datenmodell.md:1027                              niedrig „daß niemand sie wieder an die Versionsprüfung hängt, mißt `proof:release-safety` seit T-288 mit **vier** Gegenproben". Gemessen wird der Baum in Abschnitt 2 mit EINER Prüfung über vier Gestalten; die vier Gegenproben in Abschnitt 1 messen den Wächter, nicht den Baum. Die Datei selbst lebt von dieser Unterscheidung. `docs/architektur.md` formuliert es an derselben Sache richtig („als eigene Prüfung mit vier Gegenproben"). Fix: „… mißt `proof:release-safety` seit T-288 in vier Gestalten, jede mit eigener Gegenprobe".
.claude/team/reports/T-288-domain-dev.md:101          niedrig Annahme 2 belegt nicht, was sie belegen soll: „Sie ist heute grün: im Ordner des Prüfers steht `sqlite` dreimal, alle drei in Kommentaren." `sqlite` ist kein Marker — die Marker sind `prepare(`, `SELECT `, `FROM app_setting`, `better-sqlite3`, `UnitOfWork`, und `sqlite3` (so steht es an allen drei Stellen) ist keiner davon. Gestalt 4 wäre dort auch ohne `stripComments` grün. Der Satz gehört berichtigt, damit nicht der nächste glaubt, `stripComments` sei an dieser Stelle die tragende Sicherung. (Die Sicherung trägt — ich habe sie isoliert gemessen —, nur nicht hier.)
```

Keine Befunde zu: Dateihoheit (sauber), Typsicherheit (kein `any`, keine Zusicherung; `typecheck`
Exit 0), verschluckten Fehlern (kein neues `catch`, kein stiller `null`-Rückweg; die beiden frühen
`return findings` geben gefüllte Listen zurück und sind benannte Meßfehlschläge), doppelter
Fachlogik (`stripComments` und die `fetch`-Regel werden weiterhin aus `fetch-scan.mjs` geholt, keine
zweite Fassung), Sprache (Oberflächentexte gibt es hier keine, Bezeichner englisch, Prosa deutsch).

Zur Beistelldatei `0022_last_version_check_at.hinweis.md`: fachlich nachgeprüft und richtig. Der
Erzeuger filtert auf `/^(\d{4})_([a-z0-9_]+)\.(up|down)\.sql$/` (`embed-migrations.mjs:93`), `.md`
fällt durch; `proof:migrations` meldet unverändert 44 Dateien. Der beanstandete Zeiger stimmt:
`run()` rechnet `elapsed` aus `lastRequestAt` im Arbeitsspeicher (`version.ts:533`, `:562`) und liest
den Bestandswert nicht. Daß die Datei auch benennt, was an 0022 gültig **bleibt**, ist richtig so —
ohne diesen Abschnitt läse sie sich wie eine Warnung vor der ganzen Migration.

Zu `docs/datenmodell.md`: die Verengung „in keiner Route **außer der Datensicherung**" ist am Code
belegt — `repo-data-archive.ts:60` führt `last_version_check_at` in der Spaltenliste von
`app_setting`, `data-transfer.ts:165` ergänzt es beim Heben älterer Archive. Der alte Satz war
tatsächlich zu weit.

## Urteil

**Nacharbeit.** Blockierend ist der Befund
`apps/local-api/scripts/proof-release-safety.mjs:828` — der Rumpf-Ausdruck von
`VersionCheckStorePort` läßt ein `read` hinter einem Inline-Objekttyp durch und urteilt gemessen
**grün**. Ein Wächter, der die Gestalt aus T-279 unter einer leicht anderen Signatur nicht mehr
sieht, ist an seiner Kernaufgabe blind, und die zugehörige Gegenprobe deckt die Lücke nicht ab —
dasselbe Muster wie T-143 S-1, gegen das diese Datei geschrieben wurde.

Mitzunehmen in denselben Auftrag, weil sie dieselbe Zeile und dieselbe Gegenprobenliste berühren:
Befund 788 (Untergrenze ohne Gegenprobe) und Befund 743 (der zu großzügige Satz im
NICHT-fängt-Absatz). Die übrigen Befunde sind Lesbarkeit und Wortlaut und können mit oder ohne
eigenen Auftrag laufen.
