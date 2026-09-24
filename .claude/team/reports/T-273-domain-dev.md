# T-273 — Ein Fehlschlag darf die Versionsprüfung nicht für die Laufzeit beenden

Aufgabe: T-273 — Ein Fehlschlag darf die Versionsprüfung nicht für die Laufzeit beenden
Status: braucht Review
Artefakte:

- `apps/local-api/src/features/version/version.ts` (geändert)
- `docs/architektur.md` Abschnitt zur Versionsprüfung, Punkt 4 (geändert)
- `.claude/team/reports/T-273-domain-dev.md` (dieser Bericht)

Zusammenfassung: Der Fehlschlagzweig in `run()` plant jetzt neu, und zwar auf `minIntervalMs`
(60 Minuten) statt gar nicht. Derselbe Aufruf steht im `catch`-Zweig, weil ein Wurf der
Abholfunktion derselbe Fehlschlag ist und A-18.11 die beiden nicht unterscheidet. Sonst ändert
sich **nichts**: keine Fläche, kein Zustand, kein Zeitstempel, keine Schaltfläche, keine zweite
Adresse, kein Download. Beide geforderten Gegenproben sind **gemessen** — die eine gegen den
gebauten Stand (grün), die andere gegen den Stand von vorher (rot, an derselben Stelle). Ein
bestehender Prüffall unter unit-testers Hoheit mißt die alte Lesart und ist dadurch rot; sein
Ersatz liegt unten fertig bei.

## 1. Was genau geändert wurde

Drei Stellen, alle in `apps/local-api/src/features/version/version.ts`:

| Stelle | Vorher | Nachher |
|---|---|---|
| Fehlschlagzweig in `run()` (`lookup.ok === false`) | nur `report(...)`, der Zeitgeber bleibt stehen | `report(...)` **und** `schedule(minIntervalMs)` |
| `catch`-Zweig in `run()` (Wurf der Abholfunktion) | nur `report(...)` | `report(...)` **und** `schedule(minIntervalMs)` |
| Dateikopf + Kommentar an `VERSION_CHECK_MIN_INTERVAL_MS` | „warum er nach einem Fehlschlag stehen bleibt" | die geschärfte Lesart von A-18.11, mit der gerechneten Obergrenze |

`schedule()` selbst ist **unangetastet** — samt Deckel aus T-143 S-3. Der Rücksprung-Zweig für
die zurückgestellte Uhr (`elapsed < 0`) ist **unangetastet**. Der Boden-Zweig (`elapsed <
minIntervalMs`) ist **unangetastet**; er mißt beim nächsten Durchgang ohnehin ein zweites Mal an
der Uhr, die dann gilt, und ist damit die zweite Sicherung unter der neuen Planung.

`schedule()` prüft `stopped` selbst, und der Zweig hinter `await` prüft `stopped` vor dem
Fehlschlagzweig. Ein `stop()` mitten in einer laufenden Abfrage plant deshalb nichts nach
(A-V-12) — gemessen, Fall 4 unten.

**Warum `minIntervalMs` und nicht `intervalMs`.** Der gemeldete Fall ist „die Anwendung startet
schneller als das Netz". Nach 24 Stunden nachzufragen hieße, denselben Fall nur langsamer zu
wiederholen; der Benutzer, dessen VPN nach zwei Minuten oben ist, hätte am ersten Tag weiterhin
keine Prüfung. Nach einer Stunde ist das Netz mit hoher Wahrscheinlichkeit da. Der Boden bleibt
dabei der Boden: Es wird nicht **unter** ihn geplant, und ein sofortiger zweiter Versuch — was
A-18.11 weiterhin verbietet — entsteht an keiner Stelle.

## 2. Die Rechnung: ausgehende Anfragen je Tag

R-19 ist die einzige Verbindung nach außen, deshalb ausgerechnet und nicht geschätzt.

| Lage | Vorher | Nachher |
|---|---|---|
| Alles gelingt | 1 je 24 h (Start, dann `intervalMs`) | **unverändert** 1 je 24 h |
| Erster Versuch schlägt fehl, danach gelingt es | **1 insgesamt, für die ganze Laufzeit** | 1 nach 10 s, 1 nach 1 h, danach 1 je 24 h |
| Jeder Versuch schlägt fehl | **1 insgesamt, für die ganze Laufzeit** | **höchstens 24 je 24 h** |

Der schlimmste Fall im einzelnen: Anfrage bei `t = 10 s` (`VERSION_CHECK_START_DELAY_MS`), danach
bei `t = 1 h`, `2 h`, … `23 h`. Das sind **24** Anfragen in einem Kalendertag; in einem
gleitenden 24-Stunden-Fenster, beide Ränder eingerechnet, **25**. Mehr ist bauartbedingt nicht
möglich: `run()` mißt den Boden vor jeder ausgehenden Anfrage ein zweites Mal an der Uhr, die
gerade gilt.

Gegen die Anfragebegrenzung von GitHub gehalten (60 je Stunde und Quelladresse für nicht
angemeldete Aufrufer, T-136-5): Eine Anfrage je Stunde ist **ein Sechzigstel** des Kontingents
einer Installation. Die Begrenzung ist geteilt — siehe Risiko R-273-1 unten.

## 3. Was ausdrücklich unverändert bleibt

Am Quelltext nachgesehen, nicht zugesichert:

- **Die Prüfung bleibt vollständig stumm.** `state` bleibt im Fehlschlag `{ state: 'unknown' }`,
  und `VersionCheckState` hat unverändert zwei Werte. Es ist kein Feld dazugekommen: kein
  `lastCheckedAt`, kein `lastFailureReason`, kein Zähler. Der Grund geht wie bisher allein über
  `logger.lifecycle('info', …)` mit einem Schlüssel aus dem geschlossenen Vorrat.
- **Keine neue Fläche.** `GET /version-check` gibt weiter genau `versionState()` heraus; die
  OpenAPI-Beschreibung ist unberührt (kein Schema geändert, `proof:openapi` grün). Keine Route
  „Jetzt prüfen", kein `POST`.
- **Die Adresse.** Keine Zeile am Ausgang geändert; `proof:release-safety` mißt weiter 32/0,
  darunter „genau eine Abfrageadresse", „kein Weg von einer Antwort zum Öffnen-Befehl", „nirgends
  ein Herunterladen".
- **A-18.12.** Es geht kein Feld hinaus, das vorher nicht hinausging. Die Anfrage ist dieselbe
  Anfrage, nur unter Umständen ein zweites Mal.
- **A-V-10.** `current()` löst weiterhin nie eine Anfrage aus; der neue `schedule()`-Aufruf steht
  im Zeitgeberpfad, nicht im Lesepfad.
- **A-V-12.** `stop()` bricht ab und räumt weg; gemessen.

## 4. Die Messungen

Nachweislauf: ein Skript im Kratzverzeichnis, das den gebauten Prüfer mit einer
`ReleaseSourcePort`-Attrappe fährt (`node --experimental-strip-types`) — bewußt **außerhalb** des
Baums, weil die dauerhafte Heimat dieser Messung `apps/local-api/test/version/checker.test.ts`
ist (Begründung in Abschnitt 5).

### 4.1 Gegen den gebauten Stand — grün

```
OK   Fall 1: Fehlschlag, dann Erfolg im selben Prozeßlauf — Aufrufe=2, Zustand={"state":"known","latestVersion":"2.3.0"}
OK   Fall 2a: 200 ms nach dem Fehlschlag ist noch KEINE zweite Anfrage draußen — Aufrufe=1
OK   Fall 2b: die zweite Anfrage kommt frühestens nach minIntervalMs — gemessener Abstand=313 ms (Boden 300 ms)
OK   Fall 2c: der Zustand bleibt stumm bei "unknown" — {"state":"unknown"}
OK   Fall 3: auch ein Wurf der Abholfunktion beendet die Prüfung nicht — Aufrufe=2
OK   Fall 4: nach stop() folgt keine weitere Anfrage — Aufrufe=1

Alles gruen.   (Ausgangskode 0)
```

### 4.2 Gegen den Stand **vor** der Änderung — rot, und zwar an der verlangten Stelle

Der Ausgangsstand wurde zeichengenau hergestellt, indem aus derselben Datei die **zwei neuen**
`schedule(minIntervalMs);`-Zeilen entfernt wurden (die dritte, im Rücksprung-Zweig, blieb stehen:
`Vorkommen neu=3 Vorkommen Ausgangsstand=1`). Derselbe Nachweislauf:

```
--- Lauf gegen den Stand VOR der Aenderung ---
Error: Bedingung wurde nicht rechtzeitig wahr.
    at waitUntil (…/measure-baseline.mjs:22:37)
    at async …/measure-baseline.mjs:37:3     <- Fall 1
Ausgangskode: 1
```

Fall 1 kommt nicht über `waitUntil(() => checker.current().state === 'known')` hinaus: Nach dem
einen Fehlschlag geht im ganzen Prozeßlauf keine zweite Anfrage mehr hinaus, der Zustand bleibt
`unknown`. Das ist der vom Auftraggeber gemeldete Fall, jetzt gemessen statt zugesichert.

### 4.3 Die geforderten Läufe

| Lauf | Ergebnis | gegen die Vorgabe |
|---|---|---|
| `pnpm run typecheck` | fehlerfrei, alle acht Projekte plus Testprojekte plus E2E | wie verlangt |
| `pnpm run proof:release-safety` | **32 bestanden, 0 fehlgeschlagen** | unverändert 32/0 |
| `pnpm run proof:all` | **248 bestanden, 0 fehlgeschlagen**, Ausgangskode **0** | unverändert, auch nach der Änderung an `architektur.md` erneut gefahren |
| `pnpm run test:coverage` | **88 Dateien (1 rot, 87 grün) / 1577 grün, 1 rot, 3 übersprungen (1581)** | vorher 88/1578/3 — **genau ein** Prüffall ist umgekippt, kein Prüffall verschwunden, die Gesamtzahl 1581 ist gleich geblieben |

Abdeckung nach dem Lauf: Statements 91,28 % (2345/2569), Branches 85,53 % (1390/1625), Functions
94,83 % (477/503), Lines 93,45 % (2084/2230). Die Schwelle von 80 % ist nirgends berührt; der
Lauf bricht ausschließlich am roten Prüffall ab.

## 5. Der rote Prüffall — und was unit-tester bekommt

**Der rote Fall ist kein Nebenschaden, er ist die alte Lesart in Prüffallform:**

```
FAIL apps/local-api/test/version/checker.test.ts
  > A-18.11 — nach einem Fehlschlag gibt es KEINEN zweiten Versuch im selben Lauf
  > ein Fehlschlag plant nichts neu, auch nicht nach einer sehr kurzen "Regelfrist"
  AssertionError: expected 14 to be 1
  at apps/local-api/test/version/checker.test.ts:155:30
```

Die Zahl 14 ist nebenbei ein Beleg und kein Ärgernis: Der Fall setzt `minIntervalMs: 1`, also
einen Boden von einer Millisekunde. 14 Anfragen in 200 ms heißt, daß jeder Durchgang rund 14 ms
gebraucht hat — der Boden wurde also **eingehalten**, nur ist er dort auf 1 ms gestellt. Mit dem
Betriebswert von 60 Minuten wäre die Zahl 1.

`apps/local-api/test/**` ist unit-testers Hoheit; ich habe die Datei **nicht** angefaßt.

**Warum die Messung dorthin gehört und nicht in einen eigenen Nachweislauf.** `checker.test.ts`
ist bereits die Heimat genau dieser Frage — dort stehen die Geschwister „harter Boden bei
stehender Uhr" und „`stop()` bricht einen laufenden Aufruf ab", dort liegt die Naht
(`options.source`), und dort steht der Fall, der ersetzt werden muß. Ein zweiundzwanzigster
`proof:`-Lauf für ein einziges Verhalten würde diese Messung verdoppeln, die Registrierung im
Wurzel-`package.json` erzwingen und `pnpm check` verlängern, ohne etwas zu messen, was Vitest an
derselben Naht nicht schon mißt. Mein Nachweislauf oben ist die Messung **für diesen Bericht**,
nicht die dauerhafte.

**Auftrag an unit-tester (T-273-1).** In `apps/local-api/test/version/checker.test.ts` den
`describe`-Block „A-18.11 — nach einem Fehlschlag gibt es KEINEN zweiten Versuch im selben Lauf"
vollständig durch den folgenden ersetzen. Er kommt **ohne Umbau** aus: `countingSource`,
`waitUntil`, `silentLogger` und die `checkers`-Aufräumliste sind die vorhandenen Helfer, keine
neue Einfuhr nötig.

```ts
describe('A-18.11 — ein Fehlschlag beendet den Prüflauf, nicht die Prüfung (T-273)', () => {
  it('Fehlschlag, dann Erfolg im selben Prozeßlauf: der Zustand wird "known"', async () => {
    // Der vom Auftraggeber gemeldete Fall: Die Anwendung startet schneller als
    // das Netz. Bis T-273 blieb der Zeitgeber nach dem ersten Fehlschlag
    // stehen — dieser Fall wäre vorher rot gewesen und ist der Grund für die
    // Schärfung von A-18.11 ("Lauf" = der einzelne Prüflauf).
    let antworten = 0;
    const counting = countingSource(async () => {
      antworten += 1;
      return antworten === 1
        ? { ok: false, reason: 'unreachable' }
        : { ok: true, version: '2.3.0' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');

    expect(checker.current()).toEqual({ state: 'known', latestVersion: '2.3.0' });
    expect(counting.calls()).toBe(2);
  });

  it('aber NICHT sofort: der harte Boden hält auch nach einem Fehlschlag (A-V-11)', async () => {
    // Die Gegenrichtung. Ohne sie wäre aus "nie wieder" ein Klopfen geworden.
    const zeitpunkte: number[] = [];
    const counting = countingSource(async () => {
      zeitpunkte.push(Date.now());
      return { ok: false, reason: 'unreachable' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      // Der Takt ist absichtlich weit weg: Was hier gemessen wird, ist der
      // BODEN, auf den ein Fehlschlag neu plant — nicht der Takt.
      intervalMs: 10_000,
      minIntervalMs: 300,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() === 1);

    // 200 ms nach dem Fehlschlag: der Boden von 300 ms ist noch nicht um.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(counting.calls()).toBe(1);

    // Und er stimmt auch gemessen, nicht nur gezählt.
    await waitUntil(() => counting.calls() === 2, 3_000);
    expect(zeitpunkte[1]! - zeitpunkte[0]!).toBeGreaterThanOrEqual(300);
  });

  it('der Fehlschlag bleibt stumm: der Zustand ist und bleibt "unknown"', async () => {
    const counting = countingSource(async () => ({ ok: false, reason: 'unreachable' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => counting.calls() >= 3);
    expect(checker.current()).toEqual({ state: 'unknown' });
  });

  it('auch ein Wurf der Abholfunktion beendet die Prüfung nicht', async () => {
    let antworten = 0;
    const counting = countingSource(async () => {
      antworten += 1;
      if (antworten === 1) throw new Error('Netz weg');
      return { ok: true, version: '9.9.9' };
    });
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });
    checkers.push(checker);

    checker.start();
    await waitUntil(() => checker.current().state === 'known');
    expect(checker.current()).toEqual({ state: 'known', latestVersion: '9.9.9' });
  });

  it('stop() nach einem Fehlschlag plant nichts nach (A-V-12)', async () => {
    const counting = countingSource(async () => ({ ok: false, reason: 'unreachable' }));
    const checker = createVersionChecker({
      logger: silentLogger,
      now: () => new Date(),
      source: counting.source,
      startDelayMs: 5,
      intervalMs: 10_000,
      minIntervalMs: 20,
    });

    checker.start();
    await waitUntil(() => counting.calls() === 1);
    checker.stop();

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(counting.calls()).toBe(1);
  });
});
```

Alle fünf Fälle sind in der Sache oben gemessen (4.1); der dritte („bleibt stumm") ist der
einzige, den mein Nachweislauf nicht wörtlich so gefahren hat — er fällt mit Fall 2c zusammen.

## 6. Berührte fremde Flächen — gemessen, nicht vermutet

| Fläche | Hoheit | Befund |
|---|---|---|
| `tests/e2e/playwright.version-check.config.ts`, TP-VER-10 bis -13 | e2e-tester | **nicht berührt.** In `composition.ts:198` wird der Prüfer ohne `minIntervalMs` gebaut, also mit 60 Minuten — auch im E2E-Eintritt. Die Playwright-Frist ist 180 s je Fall; ein Wiederholungsversuch nach einer Stunde kann in keinem der fünf Fälle feuern. Dazu nachgesehen: `version-check-live.spec.ts` enthält **keine** Behauptung über die Zahl der Anfragen (`grep "requests"` → kein Treffer), und alle vier Fälle fahren Erfolgsantworten. **TP-VER-13 „lädt nichts herunter" ist unberührt** — es ist keine Zeile am Ausgang geändert. |
| `apps/web/src/features/settings/useUpdateNotice.ts` | frontend-dev | **keine Änderung nötig, aber sie ist die Bedingung dafür, daß die Behebung ankommt.** Die Oberfläche liest `GET /version-check` beim Aufbau und danach alle sechs Stunden (`RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000`, Zeile 63/155). Eine Stunde nach dem Fehlschlag steht das Ergebnis im Dienst, spätestens sechs Stunden nach dem Aufbau der Oberfläche steht es auf dem Schirm — **ohne** Neuladen. Würde dieser Takt je entfallen, wäre T-273 im Dienst behoben und für den Benutzer trotzdem unsichtbar. |
| `docs/bedrohungsmodell.md` | security-checker | **widerspricht jetzt dem Bestand, an zwei Stellen.** Siehe Offene Fragen 1. |
| `docs/testplan.md` Abschnitt 24 | e2e-tester | zu prüfen, ob dort ein Satz über „kein zweiter Versuch im selben Lauf" steht; die E2E-Fälle selbst messen es nicht. |
| `apps/local-api/openapi/takt-local-api.yaml` | ich | **unverändert.** Kein Schema, kein Statuscode, keine Route betroffen; `proof:openapi` grün innerhalb von `proof:all`. |

## Annahmen

1. **`minIntervalMs` und nicht `intervalMs`** als Frist des Wiederholungsversuchs. Der Auftrag
   sagt „auf `minIntervalMs` (heute eine Stunde)"; ich habe das wörtlich genommen und nicht als
   Untergrenze für eine längere Frist gelesen.
2. **Der `catch`-Zweig plant ebenfalls neu.** Der Auftrag nennt nur „den Fehlschlagzweig". Ein
   Wurf aus einer künftigen Abholfunktion ist derselbe Fehlschlag, und A-18.11 unterscheidet
   nicht nach der Bauart des Fehlschlags. Hätte ich ihn ausgelassen, bliebe genau eine Tür
   offen, durch die ein Fehlschlag die Prüfung doch für die Laufzeit beendet — der schlechtere
   der beiden Fehler.
3. **Auch `reason: 'aborted'` plant neu**, falls es je ohne `stopped` auftritt. Heute kann das
   nicht vorkommen (`control.abort()` steht nur in `stop()`, und der Zweig hinter `await` prüft
   `stopped` vorher). `schedule()` prüft `stopped` selbst, der Fall ist also in beiden Richtungen
   abgedeckt.
4. **Der Kommentar im Quelltext nennt die neue Lesart samt der Zahl 24.** Ein Satz, der eine
   Zusage gibt, die der Nachbar bricht, ist schlimmer als kein Satz — deshalb sind Dateikopf und
   Konstantenkommentar mitgeändert und nicht stehengeblieben.

## Risiken

- **R-273-1 — die Anfragebegrenzung von GitHub ist geteilt (T-136-5).** 60 Anfragen je Stunde
  und **Quelladresse**, nicht je Installation. Bisher konnte eine fehlschlagende Installation
  eine einzige Anfrage beitragen und war danach still. Ab jetzt trägt jede fehlschlagende
  Installation **eine je Stunde** bei. Hinter einer Adresse ist das Kontingent damit rechnerisch
  bei **60 gleichzeitig fehlschlagenden Installationen** erschöpft — vorher praktisch nie. Der
  Ausgang bleibt richtig (stiller Fehlschlag nach A-18.11), aber die neue Planung macht aus
  einem einmaligen Beitrag einen dauernden. Bei einer erfolgreichen Prüfung ändert sich nichts:
  dort bleibt es bei 1 je 24 h. Gehört in R-19 nachgetragen.
- **R-273-2 — der stille Fehlschlag ist jetzt ein wiederkehrender stiller Fehlschlag.** Wer eine
  Installation ohne Netzzugang betreibt, bekommt bis zu 24 Protokollzeilen je Tag mit demselben
  Schlüssel statt einer. Die Zeile ist `info`, nicht `warn` — `proof:access` Abschnitt 0e mißt,
  daß im Normalfall keine Warnung erscheint, und der Lauf ist grün. Wenn das Protokoll rotiert
  oder ausgewertet wird, ist die Häufung trotzdem eine Änderung des Geräuschpegels und keine
  Kleinigkeit; ein Zusammenfassen („dieselbe Ursache zum n-ten Mal") wäre die naheliegende
  Antwort und **wurde nicht gebaut**, weil sie einen Zähler in den Zustand brächte und der
  Auftrag „nichts ändern" sagt.
- **R-273-3 — der Satz an `too_large` steht noch.** `describeVersionCheckFailure('too_large')`
  sagt: „Die Versionsprüfung liefert damit **dauerhaft** kein Ergebnis." Das war unter der alten
  Lesart in zwei Bedeutungen wahr; unter der neuen nur noch in einer — jeder Wiederholungsversuch
  liest dieselbe zu große Antwort, aber die Prüfung ist nicht mehr abgeschaltet. Der Satz ist
  damit nicht falsch, aber näher an der Grenze. Ich habe ihn **nicht** angefaßt: Er ist ein
  Oberflächen-/Protokolltext, E-087 verlangt für eine Streichung die Suche nach dem heutigen
  Wortlaut in `tests/**`, und E-078 Punkt 3 verlangt für einen von einem Prüfer verlangten Satz
  dessen Zustimmung. Vorlage an den Orchestrator, kein Alleingang.
- **Keine neue Sicherheitsfläche.** Kein neuer Eingang, kein neuer Ausgang, keine neue Adresse,
  kein neues Feld nach außen, keine neue Einstellung. Die Änderung besteht aus zwei
  `setTimeout`-Stellungen im selben Prozeß.

## Offene Fragen

1. **`docs/bedrohungsmodell.md` behauptet jetzt das Gegenteil des Bestands** (security-checker,
   nicht meine Datei). Zwei Stellen, beide zeichengenau zu berichtigen, sonst steht dieselbe
   Sorte Widerspruch da wie bei A-19.19:
   - Zeile 4071, Auflage **A-V-11**: „Nach einem Fehlschlag **kein** zweiter Versuch im selben
     Lauf." und die Meßvorschrift „nach einem erzwungenen Fehlschlag bleibt die Zahl der
     ausgehenden Anfragen bei eins."
   - Zeile 4204, Beurteilung **A-V-11**: „Nach einem Fehlschlag wird **nicht** neu geplant — ein
     eigener Prüffall mißt, daß auch bei einer sehr kurzen ‚Regelfrist' die Zahl bei eins
     bleibt."

   Beide gehören auf „im selben **Prüflauf**" und auf den Boden von 60 Minuten, mit der Zahl 24
   aus Abschnitt 2 dieses Berichts. **Bitte in einem Auftrag mit T-273-1**, damit nicht wieder
   ein grüner Wächter eine Zusage mißt, die der Nachbar bricht.
2. **R-19 in `risks.md`** (Orchestrator): Die Obergrenze von 24 ausgehenden Anfragen je Tag im
   Dauerfehlschlag ist neu und gehört dort benannt, zusammen mit R-273-1.
3. **`docs/testplan.md` Abschnitt 24** (e2e-tester): Steht dort ein Fall oder ein Satz, der „kein
   zweiter Versuch im selben Lauf" als Programmlauf liest? Die fünf gefahrenen E2E-Fälle messen
   es nicht, der Plan könnte es trotzdem behaupten.
4. **Soll die Frist des Wiederholungsversuchs eigenständig werden?** Heute ist sie derselbe Wert
   wie der Boden (`minIntervalMs`). Wer den Boden je verstellt, verstellt beides mit. Eine eigene
   Option `retryIntervalMs` wäre sauberer und ist bewußt **nicht** gebaut — sie wäre eine
   Einstellung mehr an einer Fläche, an der der Auftrag „nichts ändern" sagt. Entscheidung des
   Orchestrators.
5. **`apps/local-api/package.json`**: keine Änderung gewünscht. Ich melde ausdrücklich, daß
   **kein** neuer `proof:`-Eintrag gebraucht wird — Begründung in Abschnitt 5.

## Nächster Schritt

T-273-1 an unit-tester: den `describe`-Block in `apps/local-api/test/version/checker.test.ts`
durch den Ersatz aus Abschnitt 5 tauschen. Danach ist `pnpm run test:coverage` wieder bei
88/1582/3 (fünf Fälle statt einem, also 1581 + 4). **Im selben Auftrag** die zwei Stellen in
`docs/bedrohungsmodell.md` an security-checker. Erst danach `pnpm check` in einem Zug —
`typecheck`, `proof:all` (248/0) und `proof:release-safety` (32/0) sind bereits einzeln grün
gemessen.
