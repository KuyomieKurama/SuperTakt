Aufgabe: T-286 — Zwei Prüffälle messen noch die aufgehobene Regel
Status: fertig

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/test/version/checker.test.ts` | einzige geänderte Datei. Helfer `openStoreBackedDatabase()` gibt kein `read` mehr in `store` (Typfehler behoben), sondern zusätzlich `versionCheckState` als Meßnaht. Der Fall „der zweite fragt NICHT erneut" ist umgedreht in „der zweite fragt TROTZDEM" (E-106). Die alte Gegenprobe „OHNE Speicher fragt sehr wohl erneut" ist ersetzt durch die Gegenrichtung „INNERHALB eines Laufs hält der Boden weiterhin, auch mit angeschlossenem Speicher". Der Fall „Zeitpunkt steht bereits im Speicher" liest jetzt über `versionCheckState.lastCheckAt()` statt `store.read()`. Der `_unreadable`-Fall ist gestrichen, der `_unwritable`-Fall von `read` befreit. Neu dazu: ein Fall, der ausschließlich mißt, daß die Spalte weiter geschrieben wird (A-20.4-Round-Trip), damit sie beim nächsten Aufräumen nicht als „ungenutzt" fällt. |

Kein Produktivcode geändert. `apps/local-api/src/features/version/version.ts` ist am Ende byte-identisch zum Stand, den ich beim Start vorgefunden habe (Prüfsumme unten) — dazwischen lag ausschließlich die Gegenprobe (siehe unten), vollständig zurückgestellt.

## Zusammenfassung

Die zwei roten Fälle und vier Typfehler aus `apps/local-api/test/version/checker.test.ts` maßen die von E-106 aufgehobene Prozeßgrenzen-Sperre aus T-279. Ich habe den Sollzustand aus `.claude/team/reports/T-285-domain-dev.md` Punkt „Offene Fragen 1" gelesen, geprüft und übernommen, wo er trägt, und an zwei Stellen eigenständig weiter gebaut: dem Fall „Gegenprobe OHNE Speicher" fehlte nach der Umkehr sein Gegenstück — ich habe ihn durch einen echten `store`-gestützten Fall der Gegenrichtung ersetzt (Boden hält innerhalb eines Laufs auch MIT Speicher), statt ihn ersatzlos zu streichen. Dazu ein neuer Fall, der ausschließlich das fortgesetzte Schreiben der Spalte mißt (Punkt 4 des Auftrags). Alle vier Typfehler sind behoben, `typecheck` und `test:coverage` sind vollständig grün.

## Prüfsummen (Nachweis der byte-genauen Rückstellung der Gegenprobe)

| Datei | vor meiner Sitzung / nach Rückstellung | Übereinstimmung |
|---|---|---|
| `apps/local-api/src/features/version/version.ts` | `9172e39b4da2cfd3c0f487479bdcf66e05111f443da2bff102dc1285138d864b` (beide Male identisch gemessen) | ja |

## Gegenprobe (Punkt 3 des Auftrags: „Stell das Lesen des gespeicherten Werts wieder her und miß, daß Fall 1 fällt")

1. Ausgangszustand gemessen: `pnpm exec vitest run apps/local-api/test/version/checker.test.ts` — 20 Fälle, **2 rot** (dieselben zwei wie im Auftrag benannt), `pnpm exec tsc -p apps/local-api/tsconfig.test.json` — **4 Typfehler** (Zeilen 77, 456, 483, 513 — deckungsgleich mit dem T-285-Bericht).
2. Test-Datei nach obigem Plan umgestellt. `typecheck` grün, `checker.test.ts` grün (20/20).
3. **Gegenprobe**: `VersionCheckStorePort` in `version.ts` temporär um ein optionales `read` ergänzt, `run()` temporär so verändert, daß sie beim ersten Prüflauf `lastRequestAt` aus `store.read()` seedet (die alte T-279-Regel) — und der Test-Helfer temporär um `read: () => versionCheckState.lastCheckAt()` (als `Date` konvertiert) ergänzt. Damit lief exakt das alte Verhalten wieder.
4. Gezielt der neue Fall „zwei Prüfer nacheinander … der zweite fragt TROTZDEM" ausgeführt: **er fällt** (`Bedingung wurde nicht rechtzeitig wahr` — der zweite Prüfer fragt mit reaktivierter Sperre nicht innerhalb von 500 ms, genau wie vor T-285). Das belegt, daß der neue Fall tatsächlich die T-285-Regel mißt und nicht zufällig grün ist.
5. Beide temporären Änderungen entfernt (nicht per `git checkout`, weil `version.ts` bereits vor meiner Sitzung als unverfestigte Änderung von domain-dev im Arbeitsbaum lag — ein Checkout hätte diese Arbeit verworfen). Stattdessen die zwei eingefügten Blöcke von Hand zurückgebaut und per `sha256sum` gegen den vor Schritt 3 notierten Wert verglichen: **Übereinstimmung, byte-genau**.

## Messungen (alle in dieser Runde, Windows, Node 22.23.2)

| Lauf | Ergebnis |
|---|---|
| `pnpm exec tsc -p apps/local-api/tsconfig.test.json` (vorher) | 4 Fehler |
| `pnpm exec tsc -p apps/local-api/tsconfig.test.json` (nachher) | 0 Fehler |
| `pnpm exec vitest run apps/local-api/test/version/checker.test.ts` (vorher) | 20 Fälle, 2 rot |
| `pnpm exec vitest run apps/local-api/test/version/checker.test.ts` (nachher, 3× wiederholt) | 20 Fälle, 0 rot, jedes Mal |
| Gegenprobe (Schritt 4 oben) | der neue Fall 1 fällt bei reaktivierter T-279-Sperre |
| `pnpm run typecheck` | grün, alle acht Pakete plus Testdateien plus E2E-Typen |
| `pnpm run test:coverage` | **90 Dateien, 1696 bestanden, 0 rot, 3 übersprungen** (vorher 1694/2/3) |
| Abdeckung `packages/domain` | 94,78 % Anweisungen, 95,25 % Zeilen — über 80 % |
| Abdeckung `packages/export` | 97,95 % Anweisungen, 97,82 % Zeilen — über 80 % |

## Roter Test vor grünem — Nachweis

Vor jeder inhaltlichen Änderung wurde der Ausgangszustand gemessen (siehe Tabelle: 2 rot, 4 Typfehler). Nach der Umstellung: 0 rot, 0 Typfehler. Zusätzlich die Gegenprobe aus Schritt 3–4: der neue, angeblich messende Fall wurde gegen die reaktivierte alte Regel geführt und fiel dort korrekt — das ist der geforderte doppelte Rot-Nachweis (einmal die alte Testfassung gegen die neue Regel, einmal die neue Testfassung gegen die alte Regel).

## Annahmen

1. **Die Gegenrichtung „innerhalb eines Laufs hält der Boden" braucht einen store-gestützten Fall**, nicht bloß den bereits vorhandenen „aber NICHT sofort"-Fall ohne Speicher (Zeile 189 ff., unverändert stehen gelassen). Domain-dev hatte das als Möglichkeit benannt („besser ist ein Fall, der beides in einem Bestand zeigt"); ich habe genau diesen gebaut, weil sonst ein Leser den Eindruck gewinnen könnte, der angeschlossene Speicher habe irgendeinen Resteinfluß auf den Boden — hat er nicht, und das zu zeigen ist der Punkt.
2. **Der neue Fall „zwei Prüfer nacheinander … fragt TROTZDEM" mißt mit 500 ms Frist gegen einen Boden von 30 000 ms.** Das ist bewußt großzügig (60× Sicherheitsabstand) und trotzdem klar unterhalb jeder plausiblen Verzögerung durch In-Memory-SQLite und `setTimeout`-Jitter — dieselbe Größenordnung wie die bereits bestehenden `waitUntil`-Fristen in dieser Datei.
3. **Der `_unwritable`-Fall bleibt inhaltlich unverändert**, nur das Objektliteral verliert das nicht mehr existierende `read`-Feld. Domain-dev hatte das ausdrücklich so vorgesehen.
4. **Ein zusätzlicher Fall für Punkt 4 des Auftrags** („die Spalte wird weiter geschrieben") war im T-285-Bericht nicht Teil der Vier-Zeilen-Tabelle, aber ausdrücklich als Auftragspunkt 4 verlangt und im Bericht als Risiko benannt (die Spalte könnte beim nächsten Aufräumen als „ungenutzt" fallen). Ich habe ihn ergänzt, weil `packages/storage/test/repo-version-check.test.ts` den Schreiber zwar isoliert nachweist, aber kein Fall in dieser Datei zeigt, daß der Prüfer selbst tatsächlich in den Bestand schreibt.
5. **Für die Gegenprobe habe ich Produktivcode temporär erweitert, nicht auf einen früheren Commit zurückgesetzt** — es gibt in der Historie keinen separaten Commit mit der alten T-279-Fassung von `version.ts` (die Datei wurde in einem einzigen Sammel-Commit #17 neu angelegt); ein `git checkout` hätte außerdem die unversionierten T-285-Änderungen von domain-dev verworfen. Die minimale Nachbildung der alten Regel (Seed aus `store.read()` beim ersten Durchlauf) ist funktional deckungsgleich mit der im T-285-Bericht beschriebenen alten Bauart.

## Risiken

Keine neuen. Die Gegenprobe hat Produktivcode für wenige Minuten temporär verändert; der Rückbau ist per Prüfsumme belegt, kein Lauf während dieser Zeit hat produktive Artefakte erzeugt oder Netzverbindungen ausgelöst (alle Quellen sind Testattrappen).

## Offene Fragen

Keine. Punkt 2 und 3 aus dem T-285-Bericht (`docs/spec.md` A-18.11, `docs/bedrohungsmodell.md` A-V-11′) liegen weiterhin beim Orchestrator bzw. security-checker und sind nicht Teil meiner Hoheit.

## Nächster Schritt

`pnpm check` vollständig fahren (der T-285-Bericht nennt `typecheck`, `boundaries`, `proof:all`, `test:coverage` und die Playwright-Konfiguration der Versionsprüfung als bereits geprüft; `test:coverage` und `typecheck` sind hiermit aus meiner Sicht bestätigt grün). Danach kann die Welle aus dem T-285-Bericht (unit-tester + security-checker) als abgeschlossen gelten, sobald auch die security-checker-Seite vorliegt.
