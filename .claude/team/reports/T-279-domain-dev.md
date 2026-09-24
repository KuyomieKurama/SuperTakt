# T-279 — Der letzte Prüfzeitpunkt im Bestand, und ein Streuwert auf den Boden

Aufgabe: T-279 — `app_setting.last_version_check_at` (Migration 0022) und ein Streuwert auf den
Mindestabstand der Versionsprüfung
Status: fertig
Rolle: domain-dev
Datum: 2026-09-11

---

## Artefakte

| Datei | Art |
|---|---|
| `packages/storage/migrations/0022_last_version_check_at.up.sql` | **neu** |
| `packages/storage/migrations/0022_last_version_check_at.down.sql` | **neu** |
| `packages/storage/src/sqlite/migrations.embedded.ts` | erzeugt (`migrations:embed`), 44 Dateien |
| `packages/storage/src/sqlite/repo-version-check.ts` | **neu** — der Adapter |
| `packages/storage/src/ports.ts` | `VersionCheckStatePort` |
| `packages/storage/src/index.ts` | Ausfuhr von `createVersionCheckStatePort` |
| `packages/storage/src/sqlite/repo-data-archive.ts` | Spalte in `app_setting` plus Begründung |
| `packages/domain/src/version.ts` | `VERSION_CHECK_JITTER_RATIO`, `versionCheckDelayWithJitter` |
| `apps/local-api/src/features/version/version.ts` | `VersionCheckStorePort`, `store`/`random`, `scheduleFloor`, Deckel, Kopfkommentar |
| `apps/local-api/src/composition.ts` | Anbindung des optionalen Ports, Kommentar nachgezogen |
| `apps/local-api/src/main.ts` | Kommentar vor `versionCheck.start()` |
| `apps/local-api/src/features/data-transfer/data-transfer.ts` | Vorgabewert für das neue Archivfeld |
| `docs/datenmodell.md` | 3.7, 8.4k, Migrationsübersicht |
| `docs/architektur.md` | 5. Eigenschaft der Versionsprüfung |
| `.claude/team/reports/T-279-domain-dev.md` | dieser Bericht |

Nicht angefaßt: `apps/local-api/src/routes/addin/**`, `packages/export/`, `apps/web/`,
`apps/desktop/`, `apps/outlook-addin/`, alle Testordner, `package.json`, `pnpm-workspace.yaml`,
die Modulregistrierung.

---

## 1. Migration 0022 — `app_setting.last_version_check_at`

`TEXT`, ISO-8601 in UTC, sekundengenau, mit `Z`; `CHECK` über `length = 20` **und** `GLOB` in
derselben Bauart wie die Zeitstempel-CHECKs aus 0001; `NULL` = „noch nie gefragt". `ALTER TABLE …
ADD COLUMN` vorwärts, `DROP COLUMN` rückwärts, kein Index, kein Trigger.

**Weder in `GET /settings` noch in `PATCH /settings`.** Der Wert hängt nicht an `AppSettings`,
nicht an `AppSettingsPort` und nicht an der `UnitOfWork`, sondern an einem eigenen
`VersionCheckStatePort` mit genau zwei Fragen (`lastCheckAt`, `recordCheck`) — kein
„zurücksetzen", keine dritte. Die OpenAPI-Beschreibung ändert sich deshalb um kein Zeichen;
`proof:openapi` und `proof:route-policy` laufen unverändert.

`updated_at` bleibt beim Schreiben unangetastet. Es ist über `GET /settings` sichtbar; würde eine
ausgehende Anfrage es fortschreiben, ließe sich der Takt der Prüfung daran ablesen — dieselbe
Fehlerfläche durch die Hintertür.

### Die beiden Sätze, die im Quelltext stehen

Beide stehen in `0022_…up.sql`, in `repo-version-check.ts` und im Kopf von `version.ts`:

> Derselbe Prozeß kann eine gespeicherte Zeitmarke auch per `sqlite3` zurücksetzen — ein
> Bestandswert ist keine Abwehr gegen VG-3, sondern gegen den Unfall. Wer ihn als Behebung von
> R-19 verkauft, verkauft die falsche Sache.

Und der tragende Grund daneben: **Gleichbehandlung mit `skipped_version` (A-18.10) und den offenen
Inaktivitätsphasen (A-24.7).** Drei Werte derselben Fläche, drei gleiche Lebensdauern.

### Anbindung: optionaler Port, geschrieben vor dem `fetch`

`VersionCheckerOptions.store` ist optional, weil `compose()` ohne Datenbank läuft
(`databaseLocation` fehlt — so fahren `proof:openapi` und `proof:route-policy`). Ohne Port bleibt
das Verhalten von vor T-279, und damit bleibt **jeder bestehende Prüffall gültig**: `test:coverage`
zählt zeichengleich 88 / 1582 / 3 wie vorher.

Geschrieben wird an genau der Stelle des früheren `lastRequestAt = now()` — **vor** dem `fetch`.
Gelesen wird genau einmal je Prozeßlauf, im ersten `run()` und nicht im Zusammenbau: `compose()`
öffnet die Datenbank, bevor `main.ts` die Migrationen fährt.

Ein versagender Speicher beendet die Prüfung nicht. Er wird **einmal** protokolliert
(`version_check_state_unreadable` bzw. `_unwritable`, `info`) und danach abgelegt; die Prüfung läuft
mit dem Zeitpunkt im Arbeitsspeicher weiter — ein schlechterer Boden, aber ein Boden.

### `composition.ts` — Punkt 3 meiner offenen Fragen aus T-276

Der Satz „Sie hängt an keiner Datenbank" ist gefallen und ersetzt: Was sie **weiß**, liegt
weiterhin im Arbeitsspeicher; **ein** Wert liegt jetzt im Bestand, und zwar dieser. Der alte
Wortlaut steht im neuen Kommentar zitiert, damit die Änderung als Änderung lesbar ist.

### `repo-data-archive.ts` — der Fund aus T-276

Nachgezogen. Der Grund steht als Kommentar über der Zeile und ist schärfer, als er im Auftrag
stand: `replaceAll` leert `app_setting` und schreibt genau die aufgezählten Spalten zurück — eine
fehlende Spalte wird nicht übergangen, sondern **auf NULL gesetzt**. Ohne den Eintrag höbe also
**jeder Import den Boden auf**, still, über den Umweg der eigenen Datensicherung.

**`DATA_ARCHIVE_VERSION` bleibt bei 5, und das ist eine Entscheidung, keine Auslassung.** Siehe
„Annahmen" Punkt 1.

---

## 2. Der Streuwert

`versionCheckDelayWithJitter(baseMs, minIntervalMs, unitRandom)` in `packages/domain/src/version.ts`,
`VERSION_CHECK_JITTER_RATIO = 0.25`. Der Zufall kommt als **Zahl herein** — das ist der Grund, warum
die Funktion in der Domäne steht: So ist die Zusage an den Rändern und über beliebig viele
Ziehungen meßbar statt zugesichert.

Angewendet wird sie ausschließlich auf **bodennahe** Planungen (`scheduleFloor`): Fehlschlagzweig,
Auffangklammer, zu früher Zeitgeberschlag, Uhrenrücksprung. Die Planung auf den **Takt** nach einem
Erfolg geht ausdrücklich nicht hindurch — sie läuft einmal am Tag und kommt nie in Phase.

**Der Deckel in `schedule()` mußte mitwachsen**, sonst hätte er den Aufschlag genau dort lautlos
weggeschnitten, wo der Boden über dem Takt steht (der Prüffall „die Uhr steht").

**Woher der Zufall kommt:** `Math.random`, als Port einsetzbar. Die Begründung steht im Quelltext
und stellt sich ausdrücklich neben die drei Stellen, an denen dieser Bestand das Gegenteil sagt
(`access/token.ts`, `sqlite/ids.ts`, `taskpane/certificate.ts` — dort stand `Math.random()` bis
T-066 und war ein Fehler): Ein geratenes Token ist Zugriff, ein geratener Aufschlag von höchstens
15 Minuten ist gar nichts. Die Aufgabe des Werts ist ausschließlich, Installationen auseinanderlaufen
zu lassen.

### Auflage 1 — der Boden verlängert sich nur. Gemessen.

1 000 000 Ziehungen mit `Math.random`, Boden 60 min:

| | |
|---|---|
| unter dem Boden | **0** |
| über Boden + Spanne | **0** |
| Minimum | 60,0000 min |
| Maximum | 75,0000 min |
| Mittel | 67,4963 min |

Ränder und Unfug, alle `>= Boden`: `0` → 60,0 · `1` → 75,0 · `0,999999` → 75,0 · `−5` → 60,0 ·
`7` → 75,0 · `NaN` → 60,0 · `±Infinity` → 60,0. Ein negativer Grundwert ergibt 0, ein negativer oder
`NaN`-Boden ergibt keine Spanne.

Am laufenden Prüfer gegengemessen (Boden 200 ms, Fehlschlag ohne Ende, echte Zeitgeber):

* `random: () => 1` → 7 Abstände, alle ≥ 250 ms: `252, 264, 264, 252, 264, 251, 264`
* `random: () => 0` → 9 Abstände, alle ≥ 200 ms: `202, 204, 204, 201, 205, 202, 205, 206, 201`
* Der Streuwert 1,0 ergibt in demselben Fenster **weniger** Anfragen als 0,0 — die Richtung stimmt.
* Eine **werfende** Zufallsquelle: 5 Anfragen in 500 ms bei Boden 100 ms, kein Absturz, kein
  Unterschreiten.

### Auflage 2 — die Obergrenze bleibt nennbar. Vorgerechnet.

| | heute | mit Streuwert |
|---|---|---|
| Zyklus im Dauerfehlschlag | genau 60 min | 60 bis 75 min, Mittel 67,5 |
| **Obergrenze je Kalendertag** | **24** | **24 — unverändert** |
| Erwartungswert je Kalendertag | 24 | **21,3** |

**Die Obergrenze sinkt nicht, und sie kann es nicht** — das ist die unmittelbare Folge von Auflage 1:
Ein Zyklus ist nie kürzer als der Boden, also ist die Schranke 1440 / 60 = 24 dieselbe. Wer hier
eine kleinere Zahl schreibt, hat entweder nach unten gestreut oder gerundet.

Was sinkt, ist der Erwartungswert. Über **100 000 simulierte Kalendertage**:

| Anfragen je Tag | Häufigkeit |
|---|---|
| 20 | 12 860 |
| 21 | 85 838 |
| 22 | 1 302 |
| 23 oder 24 | **0** |

Für 24 müßten vierundzwanzig Ziehungen nacheinander null ergeben.

**Was der Streuwert nicht leistet, und der Satz steht auch im Quelltext:** Er senkt die **Summe je
Stunde nicht**. Sechzig Installationen hinter einer Adresse, die stündlich einmal fragen, sind
sechzig Anfragen je Stunde, gleich wie sie über die Stunde verteilt liegen — und sechzig je Stunde
ist genau das GitHub-Kontingent. Der Streuwert bricht die **Phasenkopplung**, nicht die Arithmetik.
Wer die Summe senken will, braucht die Rückstufung aus T-275-8 (a), und die ist nicht entschieden.

---

## 3. Der Round-Trip nach A-20.4 — gemessen, nicht behauptet

Bestand mit Todo, `theme: dark`, `skipped_version: 9.9.9`, `last_version_check_at:
2026-09-11T09:12:34Z`. Exportiert, Bestand verändert, wieder eingespielt:

| Probe | Ergebnis |
|---|---|
| `schemaVersion` | 5 (unverändert) |
| Spalte im Archiv vorhanden | **ja**, Wert `"2026-09-11T09:12:34Z"` |
| Import angenommen | ja |
| Wert nach dem Rundlauf | `"2026-09-11T09:12:34Z"` — **derselbe** |
| `theme` / `skippedVersion` / Todos | `dark` / `"9.9.9"` / 1 — alle wiederhergestellt |
| Zweiter Export **zeichengleich** zum ersten | **ja** (`JSON.stringify` der Tabellen identisch) |
| Archiv der Fassung 5 **ohne** das Feld (Stand vor T-279) | angenommen, Wert danach `null` = „noch nie" |
| Fassung 99 | abgewiesen, Bestand unverändert |

---

## 4. Migration vorwärts und rückwärts — gemessen

`node:sqlite` aus Node 22.23.2, frische Datei:

| Schritt | Ergebnis |
|---|---|
| vorwärts 0 → 22 | Spalte da, Vorgabewert `null` |
| `recordCheck` | Wert gesetzt, `updated_at` **unverändert** |
| rückwärts 22 → 21 | Spalte weg |
| vorwärts 21 → 22 | Spalte da, Wert `null` (Datenverlust wie im Kopf der Rückwärtsdatei angekündigt) |
| rückwärts 22 → 0, vorwärts 0 → 22 | `PRAGMA integrity_check` = `ok`, `foreign_key_check` ohne Zeile |

CHECK: nimmt `2026-09-11T09:59:59Z` und `2999-01-01T00:00:00Z` (Zukunft ist zugelassen) und `NULL`;
weist Millisekunden, fehlendes `Z`, Zonenversatz, Zahl als Text, leere Zeichenkette und
angehängtes Leerzeichen ab.

Verhalten des Prüfers über einen „Neustart" hinweg, gemessen an zwei Prüfern auf **demselben**
Bestand, Boden 30 s:

| Lauf | Anfragen |
|---|---|
| 1 — frischer Bestand | **1** (erwartet 1) |
| 2 — „Neustart", derselbe Bestand | **0** (erwartet 0) — der Boden hält über die Prozeßgrenze |
| Gegenprobe — „Neustart" **ohne** Bestandswert | **1** (das Verhalten von vor T-279) |
| Während der Anfrage im Bestand | ein Zeitstempel, **nicht** `null` — vor dem `fetch` geschrieben |
| Versagender Speicher | **1** Anfrage, **1** Protokollzeile, kein Wurf |

---

## 5. Läufe

| Lauf | Ergebnis | gegen den Auftrag |
|---|---|---|
| `pnpm typecheck` | grün, alle acht Pakete plus Prüf- und E2E-Projekte | — |
| `pnpm boundaries` | grün, Notiz-Trennung unverletzt, 465 Dateien geprüft | — |
| `pnpm proof:migrations` | `migrations.embedded.ts` aktuell, **44** Dateien (vorher 42) | +2 wie erwartet |
| `pnpm proof:all` | **Exit 0**, letzter Lauf 248/0, alle 20 gezählten Läufe 0 fehlgeschlagen | zeichengleich |
| `pnpm proof:access` | **109 bestanden, 0 fehlgeschlagen** | zeichengleich |
| `pnpm test:coverage` | **88 Dateien / 1582 grün / 3 übersprungen / 0 rot** | zeichengleich |

**Die eine Zahl, die sich bewegt hat, und sie bewegt sich nach unten:**

| Abdeckung | vorher (T-276) | jetzt |
|---|---|---|
| Statements | 91,28 % | **91,12 %** |
| Branches | 85,53 % | **85,33 %** |
| Functions | 94,83 % | **94,28 %** |
| Lines | 93,45 % | **93,25 %** |

Ursache ist benannt und nicht geraten: `packages/storage/src/sqlite/repo-version-check.ts` steht bei
**0 %** (Zeilen 50–77), und die neuen Zweige in `version.ts` und `data-transfer.ts` sind ungemessen.
Prüffälle sind nicht meine Hoheit. Die Schwelle von 80 % auf `packages/storage/src/**` ist gehalten,
der Lauf ist grün — aber **eine neue Datei ohne einen einzigen Prüffall ist grün aus Zufall**, und
das gehört an unit-tester (siehe „Nächster Schritt").

---

## Annahmen

1. **`DATA_ARCHIVE_VERSION` bleibt bei 5.** Das ist die eine Entscheidung dieses Auftrags, die ich
   ohne Rückfrage getroffen habe, und sie ist begründungspflichtig, weil der Kopf von
   `repo-data-archive.ts` sagt: „eine Formaterweiterung braucht eine bewußte neue Fassung", und
   weil jede bisherige neue `app_setting`-Spalte eine Fassung bekommen hat (1→2→3→4→5).

   Der Unterschied ist keine Bequemlichkeit: Bei `idle_keep_timer_running` ist „Feld fehlt" **nicht**
   dasselbe wie „Feld ist 0" — dort muß geraten werden, und genau dafür ist die Fassungsnummer da.
   Bei dieser Spalte fallen die beiden Fälle **zusammen**: Sie ist NULL-fähig, und `null` heißt
   „noch nie gefragt" — dieselbe Aussage wie „das Archiv weiß nichts davon". **Ein Archiv der
   Fassung 5 ohne dieses Feld und eines mit `null` darin sind derselbe Bestand.** Deshalb `hasOwn`
   statt eines Fassungsvergleichs; ein vorhandener Wert wird nicht überschrieben.

   Der zweite Grund ist die Regel dieses Bestands: CLAUDE.md führt „Code steht auf 5, A-24.7 nennt
   4" als offenen ungedeckten Punkt. Eine 6 zu setzen hieße, ihn ohne Entscheidung zu vertiefen —
   und es hätte `apps/local-api/test/usecases/data-transfer.test.ts:295` (`toBe(5)`) rot gemacht,
   eine Datei, die mir nicht gehört. Wenn der Auftraggeber die 6 will, ist es eine Zeile hier, eine
   in `parseArchive`, eine im Meldesatz und eine im Prüffall — und sie gehört dann in **einen**
   Auftrag mit der Berichtigung von A-24.7.

2. **Der Anteil ist 0,25 und keine feste Minutenzahl.** Der security-checker schlug „etwa ±10 min"
   vor. Ein Anteil trägt auch dann, wenn jemand `minIntervalMs` verstellt — eine feste Zahl wäre bei
   einem Boden von 200 ms in einem Prüffall sinnlos groß und bei einem Boden von 24 h sinnlos klein.
   Und `±` ist ausgeschlossen (Auflage 1).

3. **Der Streuwert liegt nicht auf dem Takt von 24 h.** Der Auftrag nennt den Mindestabstand; die
   Tagesplanung kommt nie in Phase mit anderen Installationen. Eng gehalten.

4. **Zwei neue Protokollschlüssel** (`version_check_state_unreadable`, `_unwritable`). Sie stehen im
   geschlossenen Vorrat wie jeder andere, tragen keine fremde Zeichenkette, keinen Pfad, keinen Wert
   aus dem Bestand, laufen auf `info` und erscheinen **je Prozeßlauf höchstens einmal**.

5. **Ein Zeitstempel aus der Zukunft wird nicht abgewiesen** — kein CHECK „nicht in der Zukunft".
   Er entsteht ohne Zutun (verstellte Uhr, eingespielte Datensicherung von einem anderen Rechner),
   und der `elapsed < 0`-Zweig behandelt ihn bereits richtig: Bezugspunkt neu, voller Boden. Ein
   CHECK machte aus einer verstellten Uhr einen Schreibfehler.

---

## Risiken

* **Der Wert schließt VG-3 nicht.** Steht dreimal im Quelltext und zweimal in der Dokumentation.
  Wenn er ins Bedrohungsmodell wandert, gehört derselbe Satz dorthin — sonst entsteht dort die Art
  falscher Zusage, die T-276 gerade aus drei Kommentaren entfernt hat.
* **Der Rückweg von 0022 sendet mehr, nicht weniger.** Anders als bei 0013, wo der Rückweg zu viel
  *meldet*: Hier fragt der erste Start danach wieder ohne Boden, und **niemand sieht es**, weil die
  Prüfung stumm ist. Steht im Kopf der Rückwärtsdatei und in 8.4k.
* **Neue Datei ohne Prüffall.** `repo-version-check.ts` bei 0 % Abdeckung. Der Lauf ist grün, weil
  die Schwelle über die Gruppe mißt — genau die Bauart, die E-103 als „grün aus Zufall" benennt.
* **Der Streuwert löst das Kontingentproblem nicht.** Er bricht die Gleichschaltung; die Summe je
  Stunde bleibt. Ab etwa sechzig Installationen hinter einer Adresse ist das Kontingent weiterhin
  erschöpft. Wer den Befund T-275-8 damit als erledigt abhakt, hakt die Hälfte ab.
* **Ein `await` mehr vor dem Boden.** `restore()` liegt zwischen dem `inFlight`-Riegel und der
  Bodenrechnung. Ein zweiter Zeitgeber kann dort nicht hineinlaufen (`schedule()` räumt den alten
  weg, `timer` wird im Rückruf genullt), und `stop()` wird danach erneut abgefragt. Gemessen ist
  der Fall nicht — er ist argumentiert; er gehört in den Prüffall von unit-tester.

---

## Offene Fragen an den Orchestrator

1. **`DATA_ARCHIVE_VERSION`: bleibt es bei 5?** Meine Begründung steht unter „Annahmen" 1. Fällt die
   Entscheidung für die 6, ändern sich vier Zeilen — und A-24.7 muß im selben Auftrag mit, sonst
   heißt der offene Punkt danach „Spezifikation 4, Code 6".
2. **Bedrohungsmodell.** T-275-7 (der Hinweis „den Zeitpunkt im Bestand halten") und T-275-8 (a/b)
   sind mit diesem Auftrag zur Hälfte beantwortet: (b) ist gebaut, (a) nicht. Das gehört an
   security-checker, samt der Grenze „keine Abwehr gegen VG-3". Meine Hoheit ist es nicht.
3. **Prüffälle** an unit-tester, vier Stellen (Vorschlag im nächsten Abschnitt).
4. **Die Migrationsübersicht in `docs/datenmodell.md` ist seit 0016 unvollständig** — 0016 bis 0021
   sind außerhalb des Wellenmodells entstanden und dort nie aufgeführt worden. Ich habe die Lücke
   **benannt** und 0022 sauber angehängt, sie aber nicht gefüllt: Das ist ein eigener Auftrag und
   sechs Migrationen weit von diesem entfernt.
5. **Port 17843 bleibt geteilte Infrastruktur.** `proof:all`, `proof:access` und `test:e2e`
   schließen einander aus. Diesmal war frei, wie angekündigt; die Läufe sind sauber.

---

## Nächster Schritt

Ein Auftrag an **unit-tester**, vier Stellen, alle ohne laufenden Dienst prüfbar:

1. `packages/domain/test/version.test.ts` — `versionCheckDelayWithJitter`: die Ränder (0, 1,
   negativ, > 1, `NaN`, `±Infinity`), die Zusage „nie unter `baseMs`, nie über
   `baseMs + 0,25 × minIntervalMs`" über viele Ziehungen, und eine **Gegenprobe**: eine Fassung, die
   auch nach unten streut, muß den Lauf rot machen.
2. `packages/storage/test/repo-version-check.test.ts` — `null` bei frischem Bestand, Wert nach
   `recordCheck`, `updated_at` unberührt, CHECK-Abweisungen, fehlende Einstellungszeile ergibt
   `null` statt eines Wurfs.
3. `apps/local-api/test/version/checker.test.ts` — zwei Prüfer auf **einem** Speicher: der zweite
   fragt nicht (mit Gegenprobe ohne Speicher, sonst wird der Satz über einer leeren Menge wahr);
   der Zeitpunkt steht **während** der Anfrage schon im Speicher; ein werfender Speicher ergibt
   genau eine Protokollzeile und beendet die Prüfung nicht; `random: () => 0` und `() => 1` messen
   den Streuwert gegen die Uhr.
4. `apps/local-api/test/usecases/data-transfer.test.ts` — der Round-Trip einschließlich der neuen
   Spalte und ein Archiv der Fassung 5 **ohne** das Feld.

Danach: security-checker für Punkt 2 der offenen Fragen.
