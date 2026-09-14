# T-364 — A-A-124: ein veralteter Zeitpunkt ist schlimmer als keiner

Aufgabe: T-364 — A-A-124, der veraltete Prüfzeitpunkt im Bestand und in der Datensicherung
Status: braucht Review — **entschieden gegen `write(null)`**, die wirksame Zeile liegt in einer
fremden Datei und ist als Vorschlag beigelegt

| Datei | Art der Änderung |
|---|---|
| `packages/storage/src/ports.ts` | Prosa: die dritte Frage am `VersionCheckStatePort` ist gemessen und abgelehnt |
| `packages/storage/src/sqlite/repo-version-check.ts` | Prosa: was ein Wurf kostet, warum die Frist hier nie abläuft, und die 5 004 ms unter einer Sperre |
| `packages/storage/src/sqlite/repo-data-archive.ts` | Prosa: die Begründung von T-279 als überholt gekennzeichnet (E-106), dazu was am mitreisenden Wert veralten kann |
| `docs/datenmodell.md` | die gültige Auskunft zu `last_version_check_at`: wie wahr der Wert ist, gemessen |

**119 Zeilen, alle Kommentar.** Kein Bezeichner, keine Signatur, keine Anweisung, keine
Migration. Gegengelesen am Diff: in `packages/storage/src/**` ist keine einzige hinzugefügte
Zeile Code.

---

## 0 Läufe, mit Zahl

| Lauf | vorher | nachher |
|---|---|---|
| `proof:release-safety` | **158 bestanden, 0 fehlgeschlagen** | **158 bestanden, 0 fehlgeschlagen** |
| `tsc -p packages/storage` / `packages/domain` / `apps/local-api` | Exit 0 / 0 / 0 | Exit 0 / 0 / 0 |
| `pnpm run boundaries` | grün | grün (528 Dateien, „Notiz-Trennung: alle Schichten unverletzt") |
| `vitest run packages/storage` | 29 Dateien, 468 Prüffälle | 29 Dateien, **468 grün** |
| `vitest run apps/local-api/test/version` | 2 Dateien, 52 Prüffälle | 2 Dateien, **52 grün** |

Nicht gefahren: `pnpm check` im ganzen, `test:coverage`, `proof:all`, `test:rust`, `build`. Im
Arbeitsbaum lagen während dieser Aufgabe 110 fremde Änderungen anderer Agenten (u. a. T-363 in
`features/timer`); ein Gesamttor hätte deren Zwischenstand gemessen und nicht meinen.

Auf 17843/17844/5173 wurde nichts angefaßt. Meßkopie (`rsync` des Arbeitsbaums in den
Scratchpad) und Arbeitskopie des Prüfers sind abgeräumt; ein dabei versehentlich im Bestand
gelandeter Selbstverweis `node_modules/node_modules` ist entfernt, Auflösung danach nachgemessen
(`tsc` Exit 0, 468 Prüffälle grün).

---

## 1 Was gemessen wurde, statt es zu übernehmen (Frage 4)

### 1.1 Der gebaute Adapter unter echten Fehlerlagen

Echte `node:sqlite`-Datei, alle Migrationen des Bestands eingespielt, echter
`createVersionCheckStatePort`. Vor jeder Lage steht ein geglückter Wert
(`2026-01-01T00:00:00Z`).

| Lage | `recordCheck` wirft | Dauer im Aufruf | Spalte danach | `UPDATE … = NULL` danach |
|---|---|---|---|---|
| Normalfall | — | 0 ms | neu geschrieben | geht |
| Zeitstempel verletzt den CHECK aus 0022 | `CHECK constraint failed` | 1 ms | **alt** | **geht** |
| nur lesende Verbindung (`query_only`) | `attempt to write a readonly database` | 1 ms | **alt** | **wirft** |
| Verbindung geschlossen | `database is not open` | 0 ms | — | **wirft** |
| zweiter Schreiber hält `BEGIN EXCLUSIVE` | `database is locked` | **5 004 ms** | **alt** | **wirft** |
| Einstellungszeile fehlt | — (das `UPDATE` trifft keine Zeile) | 0 ms | — | geht |

Drei Befunde daraus, und alle drei tragen die Entscheidung:

1. **Das Löschen führt über denselben Kanal, der eben versagt hat.** In drei von vier
   Fehlerlagen wirft es ein zweites Mal. Die vierte — die CHECK-Verletzung — verlangt einen
   Zeitstempel, den `toTimestamp` nur aus einer Systemuhr außerhalb der Jahre 0001 bis 9999
   erzeugt (gemessen: Jahr 10000 → `+010000-01-01T00:00Z`, Jahr −1 → `-000001-…`; eine
   ungültige `Date` wirft schon in `toTimestamp`, also in der Verdrahtung und **vor** dem
   Adapter).
2. **Dieses `UPDATE` ist synchron.** Gemessene Reihenfolge: `write erledigt → Zeitgeber 0 ms`.
   Die Frist von 5 000 ms aus A-A-106 kann für diesen Adapter **nie** ablaufen; von den beiden
   Wegen in den abgelegten Speicher ist im Erzeugnis allein der **Wurf** erreichbar. Der
   `timeout`-Zweig ist heute ein Zweig für einen Adapter, den es nicht gibt.
3. **Der Adapter kann die Ereignisschleife anhalten.** `busy_timeout = 5000` in `database.ts`:
   Unter einer fremden Schreibsperre steht der Aufruf gemessene 5 004 ms und wirft dann. Der
   Port des Prüfers sagt, ein Adapter dürfe „nicht synchron blockieren" — der gebaute tut es
   unter einer Sperre. Das ist **R-30 zweite Achse / A-A-125 an einer konkreten Stelle des
   Bestands**, nicht ein Gedankenfall. (Für den security-checker; ich habe es nur gemessen und
   an den Adapter geschrieben.)

### 1.2 A-A-124 selbst — eigene Zahl statt der von T-357

Echter Prüfer (`createVersionChecker` aus dem Bestand), echter Adapter, echte Datei, echte
Verdrahtung (`write: (at) => recordCheck(toTimestamp(at))`). Takt 10 ms, Frist 50 ms, Uhr je
Anfrage eine Stunde weiter. Eine Sperre (`query_only`) geht auf und nach kurzer Zeit **wieder
zu** — der vorübergehende Fall, nicht der kaputte Bestand.

| Abschnitt | Anfragen | Spalte |
|---|---|---|
| vor der Sperre | 12 | `2026-09-14T11:00:00Z` |
| während der Sperre | 24 | `2026-09-14T11:00:00Z` |
| nach der Sperre | **63** | `2026-09-14T11:00:00Z` |

**Ein** fehlgeschlagener von 63 Schreibversuchen. Danach 51 ausgehende Anfragen ohne einen
weiteren Eintrag; der Wert war am Ende **52 Stunden alt** und wäre mit dem Prozeß weiter
gealtert. Protokoll: genau eine Zeile `version_check_state_unwritable`. Zustand `known`.

T-357s „2 von 40" ist damit bestätigt und zugleich verschärft: Die Zahl der **mißlungenen**
Schreibversuche ist nicht der Punkt — **einer genügt**, und er muß nicht einmal aus einem
kaputten Bestand kommen. Eine Sperre, die zehn Sekunden hält, kostet die Tatsache für Tage.

---

## 2 Die drei Wege, gegeneinander gemessen

Alle drei in einer Meßkopie des Arbeitsbaums gebaut, jeweils mit `tsc`, `proof:release-safety`
und derselben Lage aus 1.2.

| | Bestand heute | **T-360: `write(null)`** | **mein Vorschlag: Wurf legt nicht ab** |
|---|---|---|---|
| `tsc` (local-api / storage) | Exit 0 | Exit 0 | Exit 0 |
| `proof:release-safety` | 158/0 | **157/1** | **158/0** |
| Spalte nach der vorübergehenden Sperre | 52 h alt | **52 h alt — unverändert** | **1 h alt** |
| ausgehende Anfragen | 63 | 63 | 63 |
| Protokollzeilen | 1 | 1 | 1 |
| Prüffälle `apps/local-api/test/version` | 52 grün | — | **52 grün** |

**`write(null)` ist gemessen wirkungslos** in dem Fall, um den es geht: Das Löschen geht über
die noch gesperrte Verbindung und wirft. Es kostet dabei genau die Zusagen, vor denen der
Auftrag gewarnt hat — der Lauf meldet zwei Befunde in einer Prüfung:

> `repo-version-check.ts`: die Anweisungen von `recordCheck` sind nicht mehr zeichengleich …
> (A-A-105e; zu bestätigen bei `ADAPTER_ANWEISUNGEN`)
> `composition.ts`: die Anweisungen von `store.write` sind nicht mehr zeichengleich …
> (A-A-111; zu bestätigen bei `PORTLITERAL_ANWEISUNGEN`)

Beide liegen in `apps/local-api/scripts/proof-release-safety.mjs`, also außerhalb meiner Hoheit.
Keine der Gestalten 1 bis 6j wird dabei **stumpf** — sie tun genau, wofür sie gebaut sind: eine
Bewegung an dieser Grenze sichtbar machen. Aber: Man bezahlt zwei Handbestätigungen an der
Grenze, die zehn Runden gekostet hat, und eine zweite Gestalt am Port (`Date | null` statt
`Date`) — **für null gemessene Wirkung**.

**Der Vorschlag dagegen hält alles.** Er ändert weder Port noch Adapter noch Verdrahtung noch
eine `await`-Achse; deshalb bleibt der Lauf bei 158/0 und `tsc` bei Exit 0, gemessen und nicht
geschlossen.

---

## 3 Die Entscheidung

**Gegen `write(null)`, gegen ein zweites Portmitglied, gegen jede dritte Frage am Bestand.**
Nicht aus Vorsicht vor dem Wächter, sondern weil gemessen ist, daß sie nichts ausrichtet: Der
Bestand kann über einen versagenden Kanal nicht sagen, daß er nichts weiß.

**Für die Behebung am Prüfer:** Ein Speicher, der **wirft**, ist beschränkt und harmlos — der
Wurf kommt sofort, hält die ausgehende Anfrage nicht auf (A-A-106 ist davon unberührt) und sagt
nichts über den nächsten Versuch. Er darf deshalb nicht für die Laufzeit abgelegt werden.
Abzulegen ist allein der Speicher, der **nie antwortet** — dort ist die Ablage die einzige
Handhabe gegen ein unbegrenztes Versprechen, und genau dieser Weg ist für den gebauten Adapter
unerreichbar (1.1 Punkt 2).

Damit steht die Zusage wieder auf der Anforderung statt auf der Gestalt: *Der Wert im Bestand
ist so alt wie das letzte Prüfintervall* — vor einer Störung, während einer Störung und danach.

### Was ich ausdrücklich **nicht** entschieden habe

Die dritte Möglichkeit wäre, die Spalte ganz fallen zu lassen: Seit T-285/E-106 liest sie kein
Betriebspfad, sie kann nur noch täuschen, und A-A-124 wäre für immer zu. Das bräche den
Round-Trip nach A-20.4, verlangte eine Migration, eine neue Archivfassung und eine Entscheidung
— und gehört damit dem Auftraggeber und nicht mir. Ich nenne sie, weil sie die einzige ist, die
den Fall vollständig schließt.

---

## 4 Die vier gestellten Fragen, beantwortet

**1. Was steht künftig im Bestand, wenn das Schreiben abgelegt wurde?**
Die Frage hat für den gebauten Adapter keinen erreichbaren Fall mehr, und das ist die Antwort:
Abgelegt wird künftig nur der Speicher, der **nie antwortet** — ein solcher ist im Erzeugnis
nicht verdrahtet (das `UPDATE` ist synchron). Nach dem einzigen erreichbaren Fehlschlag, dem
**Wurf**, steht dort künftig wieder **ein wahrer Zeitpunkt**, spätestens nach dem nächsten
Intervall (gemessen: 1 h statt 52 h). Bleibt die Datei dauerhaft unbeschreibbar, steht dort
weiter der alte Wert — dagegen hilft keine Bauform, denn auch ein `null` müßte geschrieben
werden. `null` behält damit genau eine Bedeutung („noch nie gefragt"), und die Datensicherung
sagt dasselbe wie der Bestand, weil sie dieselbe Spalte abzieht.

**2. Der Boden innerhalb eines Laufs (E-106).**
Er hängt an diesem Wert **nicht** — seit T-285/E-106 mißt der Boden `lastRequestAt` im
Arbeitsspeicher, und `proof:release-safety` bewacht in fünf Gestalten, daß ihn niemand
zurückliest. Gemessen: In allen drei Fassungen gingen **dieselben 63** Anfragen hinaus. Ein
fehlender, ein alter oder ein frischer Wert kostet **keine** zusätzliche Anfrage innerhalb eines
Laufs; über Prozeßgrenzen gilt ohnehin „ein Programmstart fragt immer einmal". Die 344/h aus
R-19 entstehen durch **Starts**, nicht durch diese Spalte, und mein Vorschlag ändert an der Zahl
der Starts nichts. Die Nachbarn hinter derselben Quelladresse merken von dieser Aufgabe nichts.

**3. Still nach A-18.12.**
Gehalten, in jeder gemessenen Lage: Zustand geht den gewöhnlichen Weg (`unknown` → `known`),
keine Fläche, kein Hinweis, keine Fehlerfläche; einziger Ausgang bleibt **eine** `info`-Zeile
mit einem Schlüssel aus dem geschlossenen Vorrat. Auch der 5-Sekunden-Halt unter einer Sperre
bringt nichts auf den Bildschirm — er kostet Zeit, keine Sichtbarkeit.

**4. Eigene Messung.** Siehe 1.1 und 1.2: 1 von 63, 52 Stunden, sechs Fehlerlagen am echten
Adapter.

---

## 5 Vorschlag für `apps/local-api/src/features/version/version.ts` (fremde Datei, nicht gebaut)

Drei Stellen. In der Meßkopie gebaut, `tsc` Exit 0, `proof:release-safety` 158/0, die 52
bestehenden Prüffälle unter `apps/local-api/test/version` grün.

**(a) Eine Meldefunktion neben `forgetStore`** — sie trägt die Zusage „genau eine Zeile" (A-A-123)
künftig für **beide** Gründe und damit für das Modul statt für eine Funktion:

```ts
  let storeFailureLogged = false;

  function reportStoreFailure(reason: VersionCheckStoreFailure): void {
    if (storeFailureLogged) return;
    storeFailureLogged = true;
    const described = describeVersionCheckStoreFailure(reason);
    options.logger.lifecycle('info', described.sentence, described.key);
  }
```

**(b) `forgetStore` meldet über sie** (statt selbst zu protokollieren) und bleibt im übrigen, wie
es ist — es ist ab dann die Antwort auf **`timeout`** allein:

```ts
    if (store === null) return;
    store = null;
    reportStoreFailure(reason);
```

**(c) Der Wurf legt nicht mehr ab** (`remember`, im angestoßenen Rumpf):

```ts
      if (threw) reportStoreFailure('threw');
```

**Drei Sätze in derselben Datei werden davon unwahr und gehören in denselben Auftrag:**

- `describeVersionCheckStoreFailure`, Zweig `unwritable`: „… **und wird ab jetzt nicht mehr
  gemerkt.** SuperTakt läuft unverändert weiter." — der zweite Halbsatz stimmt dann nicht mehr.
  Vorschlag: „Der Zeitpunkt der letzten Versionsprüfung ließ sich nicht merken. SuperTakt läuft
  unverändert weiter und versucht es beim nächsten Mal erneut." **E-087 gemessen:** Der heutige
  Wortlaut steht in `git grep` und im Arbeitsbaum an **genau einer** Stelle (`version.ts:1121`,
  dazu die Erklärung darüber in Zeile 1113); **kein** Prüffall und kein Nachweislauf nagelt ihn
  fest — die Prüfungen messen den Schlüssel `version_check_state_unwritable`, nicht den Satz.
- Der Kommentarblock über `forgetStore` („Was der Benutzer danach im Bestand hat: **veraltet,
  nicht fehlend**" samt „Auflösen ließe es sich nur am Port … Das wäre eine Änderung an
  `packages/storage`"). Der letzte Satz ist mit T-364 **gemessen falsch**: Am Port ist es nicht
  auflösbar, weil das Löschen denselben Kanal nähme.
- Die Prosa zum `timeout`-Satz („Ab hier merkt sich dieses Erzeugnis den Zeitpunkt gar nicht
  mehr") bleibt richtig — sie gilt dann für den einen Weg, für den sie geschrieben ist.

**Was der Vorschlag kostet, und es gehört danebengeschrieben:** Ein Speicher, der **synchron
blockiert und wirft** (die gesperrte Datei), blockiert danach **je Intervall** statt einmal.
Gemessen mit 50 ms Blockade, Takt 10 ms, Fenster 600 ms: 10 Anfragen statt 55. Im Erzeugnis sind
das höchstens 5 s je Stunde (`busy_timeout`), und nur solange die Datei fremd gesperrt ist —
eine Lage, in der ohnehin jede andere Anfrage des Dienstes in dieselben 5 s läuft. Wem das zu
teuer ist, der kann statt (c) nach **drei aufeinanderfolgenden** Würfen ablegen; dann heilt der
vorübergehende Fall weiterhin, und der dauerhafte kostet drei Halte statt beliebig vieler. Ich
empfehle die einfache Fassung, weil die Zahl drei an nichts hängt.

---

## 6 Vorgabe für den unit-tester (ich schreibe keine Prüffälle)

Wird der Vorschlag gebaut, fehlen drei Fälle in `apps/local-api/test/version/checker.test.ts`
und einer in `packages/storage/test/repo-version-check.test.ts`:

1. **Ein Speicher, der einmal wirft und danach annimmt**, merkt den **nächsten** Zeitpunkt wieder
   — und das Protokoll trägt trotzdem genau eine Zeile. (Der heutige Fall in Zeile 573 prüft
   einen Speicher, der **immer** wirft; er bleibt unverändert grün, gemessen. Sein Kommentar
   „Nach der ersten Zeile gibt es keinen Speicher mehr, der ein zweites Mal versagen könnte"
   gilt danach nur noch für den `timeout`-Weg.)
2. **Ein Speicher, der nie antwortet**, wird weiterhin abgelegt und schreibt danach nie wieder —
   der heutige Fall ab Zeile 651 deckt das und muß grün bleiben.
3. **Beide Gründe nacheinander** ergeben zusammen **eine** Zeile, nicht zwei (die Zusage gilt ab
   dann für das Modul).
4. In `packages/storage`: `recordCheck` **wirft**, wenn die Verbindung nur lesend ist — heute
   mißt kein Prüffall, daß dieser Adapter überhaupt wirft, und der ganze Fall hängt daran.

Bestehende Zusicherungen, die meine **gebaute** Arbeit ändert: **keine.** 468 + 52 Prüffälle
sind vorher und nachher grün, die Änderungen sind Kommentar.

---

## 7 Annahmen

- **`null` behält genau eine Bedeutung** („noch nie gefragt"). Eine zweite („wir wissen es nicht
  mehr") hätte den Wert nicht ehrlicher gemacht, sondern zweideutig — und sie wäre, siehe 1.1,
  ohnehin nicht zu schreiben gewesen.
- **Der Round-Trip nach A-20.4 wiegt schwerer als die Frische dieses Feldes.** Die Spalte reist
  weiter mit, auch wenn sie veraltet sein kann; die Freiheit von veralteten Zeitpunkten gehört
  an die Stelle, die schreibt, nicht an die, die abzieht.
- **Prosa in `packages/storage` gilt als Nachweis, solange die Zahl daneben steht.** Ich habe
  jede Zahl, die ich in die Dateien geschrieben habe, selbst gemessen.

## 8 Risiken

- **R-30 zweite Achse, an einer konkreten Stelle:** `recordCheck` hält unter einer fremden
  Schreibsperre die Ereignisschleife gemessene 5 004 ms an — auf dem Weg **vor** der ausgehenden
  Anfrage. `proof:release-safety` sieht diese Achse nicht (A-A-125 sagt es), und der Port des
  Prüfers behauptet das Gegenteil von dem, was der Adapter tut. Für den security-checker.
- **Ein eingespieltes Archiv trägt den Zeitpunkt eines fremden Rechners.** Er heilt beim
  nächsten Programmstart (dann wird vor der ersten Anfrage geschrieben) — es sei denn, der
  Speicher dieses Laufs ist abgelegt. Beide Enden von A-A-124 hängen damit an derselben Zeile.
- **Der Vorschlag liegt in einer fremden Datei.** Bis er gebaut ist, bleibt A-A-124 offen; was
  ich gebaut habe, ist die Auskunft darüber, nicht die Behebung. Das ist Absicht: Eine halbe
  Änderung an `packages/storage` hätte den Lauf rot gelassen und nichts bewirkt.

## 9 Offene Fragen an den Orchestrator

1. **Wer baut den Vorschlag aus Abschnitt 5?** Er liegt in `features/version/**`; drei Zeilen
   Code, drei Sätze Prosa, plus der Protokollsatz. Er berührt `scripts/**` **nicht** (gemessen:
   158/0).
2. **Soll der Protokollsatz geändert werden** wie in 5 vorgeschlagen? Er ist kein
   Oberflächentext, aber er ist der einzige Ausgang dieses Falls; E-087 ist gemessen (eine
   Fundstelle, kein Prüffall).
3. **Soll die Spalte langfristig fallen?** (Abschnitt 3, „was ich nicht entschieden habe".) Das
   wäre der einzige Weg, der A-A-124 vollständig schließt, und er braucht eine Entscheidung,
   eine Migration und eine Archivfassung.
4. **A-A-124 und A-A-125 gehören zusammengelesen** — dieselbe Zeile (`recordCheck`), zwei
   Achsen. `docs/bedrohungsmodell.md` gehört mir nicht; der Satz dazu steht hier.

## 10 Nächster Schritt

Den Vorschlag aus Abschnitt 5 in der nächsten Welle an einen Agenten mit Hoheit über
`features/version/**` geben, in **derselben** Welle die drei Prosastellen und den Protokollsatz,
und **erst danach** den unit-tester mit Abschnitt 6 — Umbau und Messung in aufeinanderfolgende
Wellen, nicht in dieselbe.
