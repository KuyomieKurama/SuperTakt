# T-285 — Ein Programmstart prüft immer einmal; der Boden gilt innerhalb des Laufs

Aufgabe: T-285 — Rücknahme der Prozeßgrenzen-Sperre aus T-279
Status: braucht Review (zwei Prüffälle in fremder Hoheit sind rot und gehören umgestellt — siehe „Offene Fragen")

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/src/features/version/version.ts` | `restore()` und `VersionCheckStorePort.read` **entfernt**; Kopf, Bodenkonstante, `lastRequestAt`, `remember()` und `run()` tragen die neue Begründung |
| `apps/local-api/src/composition.ts` | Verdrahtung ohne `read`; Kommentar nachgezogen |
| `apps/local-api/src/main.ts` | Zahlenabsatz neu gerechnet, T-279-Absatz ersetzt |
| `apps/local-api/scripts/proof-release-safety.mjs` | **neue Prüfung** `rueckweg` mit **zwei** Gegenproben (32 → 35 Prüfsätze) |
| `packages/storage/src/ports.ts` | `VersionCheckStatePort` — Zweck des Werts neu beschrieben, `lastCheckAt()` als Meßnaht ausgewiesen |
| `packages/storage/src/sqlite/repo-version-check.ts` | dasselbe am Adapter |
| `packages/domain/src/version.ts` | nur Kommentar: die 24 gilt je **Lauf** |
| `docs/architektur.md` 5.7 Punkt 5, `docs/datenmodell.md` 8.4k | neu gefaßt |

Kein Prüffall, keine Migration, keine Route und keine Datei fremder Hoheit angefaßt.

## Zusammenfassung

Die Sperre über Prozeßgrenzen aus T-279 ist zurückgenommen. Der Prüfer liest den gemerkten
Zeitpunkt nicht mehr aus dem Bestand; damit ist `lastRequestAt` beim ersten Prüflauf eines Starts
`null`, `elapsed` wird `Infinity`, und **ein Programmstart prüft immer einmal**. Eine
Fallunterscheidung war dafür nicht nötig — das Entfernen des Lesens **ist** der ganze Mechanismus,
und jede weitere Planung im selben Lauf hält den Boden samt Streuwert unverändert.
`app_setting.last_version_check_at` bleibt und wird weiter **vor** jeder ausgehenden Anfrage
geschrieben; der Wert ist ab jetzt eine Tatsache („wann wurde zuletzt gefragt") und nimmt am
Round-Trip der Datensicherung teil (A-20.4). Damit das nicht stillschweigend zurückgedreht wird,
hat `proof:release-safety` eine eigene Prüfung bekommen.

## Messungen (alle in dieser Runde, Windows 11, Node 22.23.2)

| Lauf | Ergebnis |
|---|---|
| `pnpm exec playwright test -c tests/e2e/playwright.version-check.config.ts` | **5 bestanden, 0 rot** (vorher 2 grün / 1 rot). TP-VER-11 in 12,4 s — **ohne** eine Zeile im Prüffall |
| `pnpm proof:all` (21 Läufe) | grün, Code 0. `proof:release-safety` **35/0** (vorher 32/0), `proof:access` 109/0, `proof:openapi` 115/0 |
| `pnpm boundaries` | grün, Notiz-Trennung unverletzt |
| `pnpm typecheck` | Produktivcode aller acht Pakete **grün**; **4 Fehler in `apps/local-api/test/version/checker.test.ts`** (fremde Hoheit, siehe unten) |
| `pnpm test:coverage` | 90 Dateien, **1694 bestanden / 2 rot / 3 übersprungen**. Beide roten Fälle messen die alte Regel |

Die neue Prüfung `rueckweg` in `proof:release-safety` mißt zwei Dinge über den ganzen Quellbaum und
wird von zwei eingesetzten Verstößen rot:

1. `lastCheckAt` kommt außerhalb von `packages/storage/src/ports.ts` und
   `…/sqlite/repo-version-check.ts` nicht vor — Gegenprobe: ein Leser als eingesetzte Datei.
2. `VersionCheckStorePort` deklariert genau `write` — Gegenprobe: die Gestalt aus T-279, also ein
   `read` am Port.

Der Preis steht an Ort und Stelle: Gemessen wird das Vorkommen des **Namens**, nicht der Aufruf. Ein
Umzug oder eine Umbenennung macht den Lauf rot, ohne daß ein Fehler vorläge — dieselbe bewußte
Härte wie bei `RELEASE_PREFIX_FILES` (E-103 gegengelesen).

## Die Zahlen, neu gerechnet

| | vor T-285 (Stand T-279) | jetzt |
|---|---|---|
| Erfolgsfall, ein Lauf | 1 je 24 h | **unverändert** 1 je 24 h |
| Dauerfehlschlag, **ein Lauf** | höchstens 24 je Kalendertag, Erwartungswert ≈ 21,3 | **unverändert** |
| Tagesgrenze **über Prozeßgrenzen** | 24 (der Bestandswert hielt den Boden über den Neustart) | **`24 + Anzahl der Starts`** |
| gewöhnlicher Benutzer (ein Start am Tag) | 24 | **25** |
| Grenzfall Startschleife | 24 | **rund 344 je Stunde**, also ≈ **8 250 je Kalendertag** (T-276: kürzester vollständiger Zyklus 10 474 ms; 86 400 / 10,474 = 8 249) |

Die 344 je Stunde sind das 5,7fache dessen, was GitHub nicht angemeldeten Aufrufern je Stunde und
Quelladresse zugesteht. Dieser Grenzfall ist mit der Entscheidung **in Kauf genommen**, und die
Begründung steht im Quelltext: Wer den Sidecar in einer Schleife startet, setzt eine Zeitmarke im
Bestand ohnehin mit `sqlite3` zurück (VG-3) — der Bestandswert war die Abwehr gegen den **Unfall**,
und ihr Preis war die einzige Selbsthilfe des Benutzers.

## Annahmen

1. **`VersionCheckStorePort.read` fällt ganz, statt ungenutzt stehenzubleiben.** Ein Port mit einer
   Frage, die niemand stellt, ist genau die Bauart, gegen die der Auftrag sich richtet. Preis: die
   vier Typfehler in der Prüfdatei (unten).
2. **`VersionCheckStatePort.lastCheckAt()` in `packages/storage` bleibt**, obwohl es keinen Aufrufer
   im Betrieb mehr hat. Begründung an Ort und Stelle: Es ist die einzige Naht, an der `recordCheck()`
   überhaupt nachweisbar ist (`packages/storage/test/repo-version-check.test.ts`, 20 Fälle, weiterhin
   grün) — ein Schreiber ohne Leser ist ein Schreiber ohne Nachweis. Wer es wieder an die
   Versionsprüfung hängt, wird von `proof:release-safety` rot.
3. **Kein Schalter, keine Einstellung, keine Fallunterscheidung.** „Erste Prüfung frei" entsteht
   allein daraus, daß `lastRequestAt` beim ersten Durchgang `null` ist. Ein Merker wäre ein zweiter
   Zustand mit derselben Aussage.
4. **Der Protokollschlüssel `version_check_state_unreadable` fällt** samt seinem Satz — es gibt
   keinen Lesevorgang mehr, der scheitern könnte. Gesucht (`git grep` **und** Lauf über
   `apps/*/src`, `packages/*/src`, `tests/`, Bauergebnisse ausgeschlossen, E-087): der Schlüssel
   stand an **zwei** Stellen, `version.ts` (Produktivcode, gefallen) und
   `apps/local-api/test/version/checker.test.ts:502` (Prüffall, siehe unten). Kein
   Oberflächentext, keine Live-Region, kein zugänglicher Name betroffen.
   `version_check_state_unwritable` bleibt unverändert.
5. **Die Migration 0022 bleibt unangetastet** — siehe Risiken.

## Risiken

1. **Migration 0022 behauptet weiterhin den alten Zweck, und das läßt sich nicht beheben.** Der
   Migrationsläufer vergleicht eine Prüfsumme über den Dateiinhalt (`checksum_mismatch`,
   `packages/storage/src/migration.ts`); eine gelaufene Migration im Wortlaut zu ändern bräche jeden
   bestehenden Bestand. Der Text von `0022_last_version_check_at.up.sql` („A-V-11 verlangt einen
   harten Boden … der Bezugspunkt dieses Bodens") ist damit ein **Zeitzeuge** und keine gültige
   Auskunft mehr. Gegenmittel gebaut: `docs/datenmodell.md` 8.4k sagt das ausdrücklich und benennt
   sich selbst als die gültige Stelle. Wer eine bessere Lösung will, braucht eine Entscheidung über
   Migrationskommentare, keine Codezeile.
   *Nebenbefund, der entlastet:* Der **Rückweg** 0022 down beschreibt den Zustand nach T-285 zufällig
   korrekt („Der erste Start nach dem Rückweg fragt also einmal").
2. **Der Unfallschutz ist weg, und zwar ganz.** `pnpm desktop` startet bei jedem Rust-Neubau einen
   neuen Sidecar mit der echten Abholfunktion; jeder dieser Starts geht jetzt wieder mit einer
   Anfrage an GitHub hinaus. Das war vor T-279 der Zustand und ist nie aufgefallen — aber es ist der
   Grund, aus dem T-279 gebaut wurde, und er ist nicht verschwunden, sondern abgewogen worden.
3. **Kein Sicherheitsrisiko dazugekommen.** Es entsteht kein neuer Ausgang, keine zweite Adresse,
   kein neues Feld in einer Antwort; `proof:release-safety`, `proof:route-policy` und `proof:openapi`
   sind unverändert grün. Der Wert verläßt den Dienst weiterhin nirgends (A-V-14′, A-18.11).

## Offene Fragen an den Orchestrator

### 1. `apps/local-api/test/version/checker.test.ts` — unit-tester, und es ist die Arbeit, die der Auftrag verlangt

`pnpm typecheck` ist **nur** wegen dieser Datei rot, `test:coverage` **nur** wegen zweier Fälle
darin. Beides ist erwartet und gehört in einen Auftrag an unit-tester. Genau:

| Ort | heute | was hingehört |
|---|---|---|
| `:72–80` Helfer `openStoreBackedDatabase` | baut `{ read, write }` | nur `write`; `read` fällt (Typfehler `:77`) |
| `:377` „zwei Prüfer auf demselben Speicher: der zweite fragt **NICHT** erneut" | rot (`expected 1 to be 0`) | **umdrehen**: der zweite Prüfer **fragt**, obwohl der Wert frisch im Bestand steht — das ist der vom Auftrag verlangte Prüffall auf die neue Bedeutung |
| `:419` Gegenprobe „OHNE Speicher fragt der neue Prüfer sehr wohl erneut" | grün, aber **wertlos** — sie mißt seit T-285 dasselbe wie der Fall darüber | ersetzen durch die **Gegenrichtung**: *innerhalb* eines Laufs hält der Boden (der Fall `:280` „stehende Uhr" trägt das bereits; besser ist ein Fall, der beides in einem Bestand zeigt) |
| `:451` „der Zeitpunkt steht bereits IM Speicher, während die Anfrage läuft" | inhaltlich weiter gültig, aber ruft `store.read()` (Typfehler `:456`) | über `versionCheckState.lastCheckAt()` lesen statt über den Port des Prüfers |
| `:478` „ein **lesend** werfender Speicher … `_unreadable`" | rot | **streichen** — es gibt keinen Lesevorgang mehr. Der schreibende Zwilling `:508` bleibt |

`packages/storage/test/repo-version-check.test.ts` (20 Fälle) bleibt unverändert gültig und grün.

### 2. `docs/spec.md` A-18.11 — Wortlaut, den ich brauche (gehört dir)

Vorschlag, **anzuhängen** an den bestehenden Absatz, ohne ihn sonst zu ändern:

> Der Mindestabstand gilt **innerhalb eines Programmlaufs**. Ein Programmstart prüft immer einmal:
> Ein neu gestarteter Dienst kennt keine vorige Anfrage, und der Abstand ist eine Aussage über zwei
> aufeinanderfolgende ausgehende Anfragen, nicht über Prozeßgrenzen. Der Zeitpunkt der letzten
> Anfrage wird im Bestand vermerkt; dieser Vermerk ist eine Tatsache für die Datensicherung und
> **hält keine Prüfung auf**.

Begründung für den letzten Satz: Ohne ihn liest der nächste Leser `app_setting.last_version_check_at`
und baut T-279 nach — der Fehler sieht wie eine Verbesserung aus.

### 3. `docs/bedrohungsmodell.md` A-V-11′ — für den security-checker (nicht angefaßt)

A-V-11′ ist **überwiegend** schon richtig: Punkt (1) „**eine** ausgehende Anfrage je Prozeßstart"
und Punkt (4) „der Boden gilt für die **gesamte Prozeßlaufzeit**" treffen T-285 wörtlich. Zwei
Stellen tragen die Zahl aber weiter, als sie jetzt trägt:

* **36.4, A-V-11′, der Satz zur Obergrenze:** „höchstens **24** ausgehende Anfragen je Kalendertag
  im Dauerfehlschlag (25 im gleitenden 24-Stunden-Fenster mit beiden Rändern)". Das gilt **je Lauf**.
  Vorschlag: „… je Kalendertag **und Prozeßlauf**; jeder weitere Programmstart bringt eine Anfrage
  mit (T-285), die Tagesgrenze ist `24 + Anzahl der Starts`."
* **19.1, Urteil zu A-V-11 (Zeile ~4204)**, dieselbe Zahl, dieselbe Ergänzung.

Dazu die Bitte, Punkt (4) um **„und nicht darüber hinaus"** zu ergänzen. „Gesamte Prozeßlaufzeit"
ist heute die Obergrenze der Zusage und liest sich nach T-279 leicht als Untergrenze.
`docs/bedrohungsmodell.md` nennt T-279 und `last_version_check_at` **an keiner Stelle** — der
Bestandswert ist dort nie bewertet worden; das gehört bei dieser Gelegenheit nachgeholt oder
ausdrücklich als nicht nötig vermerkt.

### 4. Eine Entscheidung wäre fällig (E-106?)

T-279 und T-285 widersprechen einander in der Sache, beide sind auf `main`, und `decisions.md` kennt
keine von beiden. Solange das nicht als Entscheidung steht, ist der nächste, der die 344 je Stunde
liest, im Recht, wenn er den Bestandswert wieder liest. Vorschlag für den Kern: *„Der Boden der
Versionsprüfung gilt innerhalb eines Programmlaufs. Ein Programmstart prüft immer einmal. Ein
gespeicherter Zeitpunkt darf eine Prüfung nicht aufhalten — der Neustart ist die einzige Selbsthilfe
des Benutzers gegen eine Prüfung, die nicht greift."*

## Nächster Schritt

Eine Welle mit zwei Aufträgen, die sich nicht berühren: **unit-tester** stellt
`apps/local-api/test/version/checker.test.ts` nach Punkt 1 um (danach sind `typecheck` und
`test:coverage` wieder grün), **security-checker** zieht A-V-11′ nach Punkt 3 nach. A-18.11 und der
Entscheidungseintrag liegen bei dir. Danach `pnpm check` einmal vollständig — hier gefahren sind
`typecheck`, `boundaries`, `proof:all`, `test:coverage` und die Playwright-Konfiguration der
Versionsprüfung, **nicht** `contrast`, `verify:bundle`, `test:rust`, `build` und `audit`.
