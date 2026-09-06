# T-235 — domain-dev

**Aufgabe:** T-235 (Welle AL) — A-A-66, A-A-67 und A-A-68 aus dem Bedrohungsmodell Abschnitt 31
einlösen: drei Zusicherungen, die sagen sollen, was sie **nicht** messen.
**Status:** fertig
**Datum:** 2026-09-06

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-tags.mjs` | Abschnitt 5 sichert seine eigene Vorbedingung (A-A-67), Abschnitt 9 prüft den **Grund** der Abweisung (A-A-66), Kopf um den Absatz „Was dieser Lauf über sich selbst mißt" erweitert |
| `apps/local-api/scripts/proof-access.mjs` | Abschnitt 13: benannte Untergrenze **und** eine zweite, unabhängige Aufnahme derselben Menge (A-A-68) |

**Kein Produktivcode berührt.** Genau das hatte 31.10 vorhergesagt: „drei neue Auflagen, alle
drei in `apps/local-api/scripts/**`, keine berührt Produktivcode." `git status` führt außer den
zwei Läufen nichts aus meinem Hoheitsgebiet.

---

## Zusammenfassung

Die drei gemeldeten Fälle sind **erst nachgestellt und dann behoben** worden — im Spiegel unter
`/tmp/t235/root`, nach dem Maßstab aus T-215, T-225 und T-231; jede Verstümmelung lag
ausschließlich dort und ist mit ihm gelöscht. Alle drei falschen Grünen ließen sich zeichengenau
reproduzieren: `proof:tags` sagte **43/0, Code 0**, während die gemeinsame Transaktion gebrochen
war und ein Tag den Fehlschlag seines Todos überlebte; derselbe Lauf sagte **43/0, Code 0**,
während `.max(50)` → `.max(500)` stand und Takt 51 Tagnamen mit 201 annahm; `proof:access` sagte
**106/0, Code 0** und „vollständig durchsucht — 16 Dateien", während in
`src/access/unter/verifier-match.ts` ein `presented === secret` ungesehen lag. Gebaut sind
daraufhin fünf neue Zeilen: zwei Vorbedingungen in Abschnitt 5, ein geschärfter Grund in
Abschnitt 9 (ohne neue Zeile, die zwei bestehenden tragen ihn) und zwei getrennte Vorbedingungen
in Abschnitt 13. Jede Gegenprobe ist danach **rot mit Code 1** gesehen worden, auch die
entscheidende Kombination aus Verstümmelung **und** Kunstquelle, und auf dem unveränderten Baum
gibt es keinen falschen Alarm.

---

## A-A-67 zuerst — Abschnitt 5 und die gemeinsame Transaktion

### Nachgestellt (Spiegel)

| Zustand | Lauf | Code | Abschnitt 5 |
|---|---|---|---|
| Bestand | **43/0** | 0 | drei Zeilen grün |
| Kunstquelle (`title` 600 Zeichen statt `statusId: 'gibt-es-nicht'`) | **43/0** | **0** | drei Zeilen grün |
| Transaktion gebrochen (`resolveTagNames` in eigener Klammer), Lauf unverändert | **41/2** | **1** | `das Tag der gescheiterten Anfrage gibt es nicht — ["backend","rücklauf"]`, `1 vorher, 2 nachher` |
| **Transaktion gebrochen + Kunstquelle** | **43/0** | **0** | **drei Zeilen grün** |

Alle vier Zahlen stimmen mit 31.3 zeichengenau überein.

### Gebaut

Der Rumpf der Anfrage steht **einmal** da; beide Anfragen des Abschnitts leiten sich daraus ab.
Das ist E-094 Punkt 1 in Bauform: Eine Kunstquelle am Titel trifft die Gegenprobe genauso wie
ihren Gegenstand und kann sich nicht an ihr vorbeischleichen.

```js
const rumpf = { title: 'Scheitert absichtlich', tagNames: ['rücklauf'] };
const doomed = await post('/todos', { ...rumpf, statusId: 'gibt-es-nicht' });
…
const anchor = await post('/todos', rumpf);
```

Zwei Zeilen mehr, und sie schließen die Vorbedingung von beiden Seiten ein:

1. **Der Fehlschlag ist keine Gestaltprüfung** — die Antwort trägt keine Feldangabe.
2. **Positiv verankert** — derselbe Rumpf ohne die unmögliche Spalte legt das Tag an; die
   Anfrage erreicht die Tag-Anlage also überhaupt.

A-A-67 stellte zwei Formen zur Wahl und nannte die erste „eine Zeile": die **Fehlerkennung** der
Antwort. **Diese Form trägt nicht, und das ist gemessen, nicht vermutet.** Beide Fälle antworten
mit demselben `code`:

```
statusId: 'gibt-es-nicht'  → 422 {"error":{"code":"validation_error","message":"Ein verwiesener
                                  Datensatz existiert nicht oder wird noch benutzt."}}
Titel mit 600 Zeichen      → 422 {"error":{"code":"validation_error","message":"Die Eingabe ist
                                  unvollständig oder unzulässig.","details":[{"field":"title",…}]}}
```

`packages/storage/src/sqlite/errors.ts:307` bildet den Fremdschlüsselbruch auf
`validation_error` ab — dieselbe Kennung, die die zod-Tür benutzt. Unterscheidbar sind die zwei
nur am **Vorhandensein von `details`**. Gebaut ist deshalb die zweite, genauere Form, und die
erste in der Gestalt, in der sie hier trägt. Siehe „Offene Fragen" Punkt 1.

### Gegenproben nach dem Bau

| Zustand | Lauf | Code | Rote Zeilen |
|---|---|---|---|
| Bestand | **45/0** | 0 | — |
| Kunstquelle allein | **43/2** | **1** | beide neuen Zeilen |
| Transaktion gebrochen, Lauf unverändert | **42/3** | **1** | die zwei alten und der Anker |
| **Transaktion gebrochen + Kunstquelle** | **43/2** | **1** | `… trägt keine Feldangabe — Status 422, details [{"field":"title",…,"code":"too_big"}]`, `derselbe Rumpf ohne die unmögliche Spalte legt das Tag an — Status 422` |

Die letzte Zeile ist die, die A-A-67 ausdrücklich verlangt („ohne diese letzte Bedingung ist die
Auflage nicht eingelöst"): rot **auch dann**, wenn der Fehlschlag vor die Tag-Anlage gelegt wird.

**Was diese Probe nicht mißt** (E-094 Punkt 2, im Lauf selbst aufgeschrieben): daß die Prüfung
der Kanban-Spalte im Quelltext *hinter* `resolveTagNames` **in derselben Klammer** steht. Das ist
an der Tür nicht sichtbar. Gemessen wird die Wirkung von beiden Seiten.

---

## A-A-66 — Abschnitt 9 prüft den Grund

### Nachgestellt (Spiegel)

| Zustand | Lauf | Code | Abschnitt 9 |
|---|---|---|---|
| `.max(50)` → `.max(500)`, Lauf unverändert | **42/1** | **1** | `mehr als fünfzig Namen werden abgewiesen — Status 201` |
| **`.max(500)` + Kunstquelle** (beide Titel 600 Zeichen) | **43/0** | **0** | **alle drei Zeilen grün** |

Zeichengenau wie 31.2.

### Gebaut

Neben dem Status steht jetzt **genau ein** `details`-Eintrag, an **diesem** Feld, mit **dieser**
Kennung — nach dem Muster, das der Nachbarabschnitt 8 immer schon hatte:

| Zeile | erwartet |
|---|---|
| mehr als fünfzig Namen | `field: 'tagNames'`, `code: 'too_big'` |
| Name aus lauter Leerzeichen | `field: 'tagNames.0'`, `code: 'too_small'` |

Die Forderung nach **genau einem** Eintrag ist Absicht und geht über den Wortlaut der Auflage
hinaus: Scheitert die Anfrage zusätzlich an etwas anderem, steht die Zusicherung wieder über
einem Fehlschlag, den sie nicht gemeint hat. Dann soll die Zeile rot sein.

### Gegenproben nach dem Bau

| Zustand | Lauf | Code | Meldung |
|---|---|---|---|
| Bestand | **45/0** | 0 | — |
| `.max(500)`, Lauf unverändert | **44/1** | **1** | `Status 201, details []` |
| **`.max(500)` + Kunstquelle** | **43/2** | **1** | `Status 422, details [{"field":"title",…}]` |
| Kunstquelle allein, Regel unversehrt | **43/2** | **1** | `details [{"field":"title",…},{"field":"tagNames",…}]` — zwei Gründe, also nicht dieser |

---

## A-A-68 — Abschnitt 13 und das Wort „vollständig"

### Nachgestellt (Spiegel)

| Zustand | Lauf | Code | Abschnitt 13 |
|---|---|---|---|
| `src/access/unter/verifier-match.ts` mit `presented === secret`, `recursive: true` da | **105/1** | **1** | nennt Datei und Zeile |
| **dieselbe Datei, `recursive: true` entfernt** | **106/0** | **0** | `ok Der Nachweispfad ist vollständig durchsucht — 16 Dateien …` |

Zeichengenau wie 31.1.1.

### Gebaut — und warum eine benannte Zahl allein nicht gereicht hätte

A-A-68 verlangt eine benannte Untergrenze nach dem Muster von A-A-61. Sie ist gebaut:
`MINDESTENS_DURCHSUCHT = 14` bei heute 16 Dateien — dasselbe Verhältnis wie A-A-61 (100 bei 117,
rund 85 Prozent) und mit dem Faktor dreieinhalb deutlich über den vier tragenden Dateien.

**Sie allein hätte den gemeldeten Fall aber nicht gefangen, und das ist gemessen:** Nach dem
Streichen von `recursive: true` stehen weiterhin **16** Dateien in der Ernte — heute gibt es
unter `src/access` und `src/http` keinen Unterordner, und eine übersehene Datei senkt die Zahl
erst, wenn einer entsteht. Jede Untergrenze wäre grün geblieben. Der Wächter, dessen Ausfall der
Befund ist, senkt die Zahl gerade **nicht**.

Deshalb stehen dort zwei Zeilen, und sie messen Verschiedenes:

1. **Die benannte Zahl** — sie fängt den Zusammenbruch der Ernte. „0 durchgesehen" ist damit nie
   mehr `ok` (E-094 Punkt 3).
2. **Eine zweite, unabhängige Aufnahme derselben Menge** — von Hand abgestiegen, ohne
   `recursive`, mit eigener Endungsprüfung. Zwei Wege, ein Ergebnis; erst der Vergleich macht
   das Wort „vollständig" verdient (E-094 Punkt 1).

Dazu bleibt die Prüfung der vier tragenden Dateien als eigene, dritte Zeile stehen — vorher war
sie mit der Untergrenze in **einer** Bedingung verschmolzen, und das war der Grund, warum die
Untergrenze am Ende die Länge genau dieser Liste war.

### Gegenproben nach dem Bau

| Zustand | Lauf | Code | Meldung |
|---|---|---|---|
| Bestand | **108/0** | 0 | `mindestens 14 Dateien eingesammelt (16)`, `16 von 16 Dateien … zweiter Weg` |
| **Unterordnerdatei + `recursive: true` entfernt** | **107/1** | **1** | `Der Nachweispfad ist vollständig durchsucht — 16 von 17 Dateien … — übersehen: src/access/unter/verifier-match.ts` |
| Endung verengt (`.ts` → `.tsx`) | **105/3** | **1** | `mindestens 14 Dateien eingesammelt (0) — 0 statt mindestens 14 — der Sammler greift ins Leere`, dazu beide folgenden Zeilen |
| Gegenprobe aus 31.1 (`src/access/verifier-match.ts` flach) | **107/1** | **1** | `Kein === auf Tokenmaterial im Nachweispfad — src/access/verifier-match.ts:27: …` — **bleibt rot**, A-A-59 unberührt |

Bemerkenswert an der dritten Zeile: Bei verengter Endung bleibt `Kein === auf Tokenmaterial`
**grün** — über der leeren Menge. Genau dafür stehen die drei Vorbedingungen davor.

---

## Nachweis

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | — | **Code 0** |
| `pnpm test` | — | **77 Dateien, 1464 grün** |
| `pnpm run boundaries` | — | **Code 0**, „Notiz-Trennung: alle Schichten unverletzt" |
| `proof:tags` | **43/0, Code 0** | **45/0, Code 0** |
| `proof:access` | **106/0, Code 0** | **108/0, Code 0** |

`pnpm run proof:all` wurde auftragsgemäß **nicht** gefahren. Die zwei portgebundenen Läufe sind
einzeln gefahren, der Port war frei. Alle Verstümmelungen lagen im Spiegel unter `/tmp/t235`; er
ist gelöscht. `git status` im Hoheitsgebiet führt genau die zwei geänderten Läufe.

---

## Annahmen

1. **A-A-66 schärfer als der Wortlaut.** Verlangt ist „neben `status === 422` … die
   Fehlerkennung beziehungsweise der `details`-Eintrag". Gebaut ist **genau ein** Eintrag mit
   Feld und Kennung. Folge: Auch bei unversehrter Produktivregel wird die Zeile rot, sobald die
   Anfrage zusätzlich an etwas anderem scheitert. Das ist gewollt — eine Zusicherung über einen
   Fehlschlag, den sie nicht gemeint hat, ist derselbe Befund noch einmal.
2. **A-A-67 in der zweiten Form gebaut, die erste in abgewandelter Gestalt.** Die Fehlerkennung
   unterscheidet die zwei Fälle nicht (beide `validation_error`, gemessen). Geprüft wird
   statt dessen das Vorhandensein der Feldangabe. Bricht, wenn der Speicherfehler eines Tages
   `details` mitgibt; dann ist die Zeile anzupassen und nicht zu streichen.
3. **A-A-68 mit einer zweiten Zeile über den Wortlaut hinaus.** Die benannte Zahl steht (14 bei
   16), fängt den gemeldeten Fall aber nachweislich nicht. Die unabhängige zweite Aufnahme ist
   die Zeile, die ihn fängt. Beide stehen da, weil sie Verschiedenes messen.
4. **Die 14** ist gewählt, nicht abgeleitet: dasselbe Verhältnis wie A-A-61 (85 Prozent) und
   dreieinhalbmal die vier tragenden Dateien. Sie ist in der Datei begründet.
5. **Der Anker in Abschnitt 5 legt ein Tag an** (`rücklauf`), das vorher nicht existierte. Kein
   späterer Abschnitt zählt Tags oder hängt an diesem Namen; gemessen an 45/0.

---

## Risiken

1. **Der Zeitvergleich in `proof:access` Abschnitt 13 ist lastempfindlich.** Einer von sechs
   Läufen im Spiegel meldete `Streuung 1.61` gegen die Schwelle 1.25 und damit Code 1 — Median
   „leer" 1402 ns gegen sonst rund 870, unter der Last paralleler Agenten. Wiederholung derselben
   Verstümmelung: 1.01. Es ist eine Messung mit Zufall darin, kein Befund am Bau; sie steht seit
   je mit dem Satz da, sie sei „ausdrücklich kein Gegenbeweis". Wer diesen Lauf in einer vollen
   Welle fährt, muß mit einem Durchfaller aus dieser Zeile rechnen. **Nicht mein Hoheitsgebiet
   zu ändern**, wenn daraus eine Toleranz oder eine Wiederholung werden soll — es ist mein Lauf,
   aber die Entscheidung über eine Schwelle gehört gemeldet, nicht gesetzt.
2. **Die zwei Wege in Abschnitt 13 teilen eine Annahme**: beide suchen `.ts`. Wer beide Stellen
   zugleich verengt, ändert zwei Wörter, nicht eines — die Auflage sagt „ein einziges Wort", und
   dagegen trägt der Bau. Gegen eine gleichzeitige Änderung beider trägt er nicht, und das steht
   hier statt in einer Zusicherung, die es nicht messen kann.
3. **Abschnitt 5 hängt an einer Fehlermeldung ohne eigene Kennung.** Solange `validation_error`
   beide Fälle trägt, ist „keine Feldangabe" das einzige maschinenlesbare Unterscheidungsmerkmal
   an der Tür. Siehe Offene Frage 1.

---

## Offene Fragen

1. **Ein Fremdschlüsselbruch und eine Gestaltprüfung antworten mit derselben Kennung.**
   `packages/storage/src/sqlite/errors.ts:307` bildet `foreign` auf `validation_error` ab —
   genau die Kennung, die `failValidation` für zod benutzt. Ein Aufrufer (Oberfläche, Add-in)
   kann „deine Eingabe hat die falsche Gestalt" nicht von „der Datensatz, auf den du verweist,
   gibt es nicht" unterscheiden; nur das Vorhandensein von `details` verrät es, und das ist eine
   Nebenwirkung, keine Zusage. Eine eigene Kennung (etwa `unknown_reference`, 422) wäre die
   saubere Antwort — sie berührt aber `packages/storage`, den Fehlerkatalog des Dienstes, die
   OpenAPI-Beschreibung **und** die Fehlerbehandlung in `apps/web` und
   `apps/outlook-addin`. Das ist eine Entscheidung des Orchestrators und eine eigene Aufgabe,
   keine Nebenwirkung dieser hier.
2. **`tmp-chrome.mjs` im Wurzelverzeichnis** (T-234-8) liegt weiterhin unversioniert und nicht
   ignoriert. Gehört dem Orchestrator; hier nur als Erinnerung, weil sie noch da ist.
3. **Soll die Schwelle 1.25 des Zeitvergleichs bleiben?** Siehe Risiko 1. Ich schlage vor, sie zu
   lassen und den Lauf bei einem Durchfaller aus **dieser einen** Zeile zu wiederholen, statt die
   Schwelle zu weiten — eine geweitete Schwelle mißt weniger, und die Zeile ist ohnehin als
   Beiwerk gekennzeichnet.

---

## Nächster Schritt

security-checker fährt die zehnte Anwendung derselben Frage gegen `proof:tags` und
`proof:access` und nimmt A-A-66 bis A-A-68 ab. Die Erwartung steht oben zeichengenau: **45/0**
und **108/0** auf dem unveränderten Baum, und acht Gegenproben, jede rot mit Code 1. Die zwei
entscheidenden sind die Kombinationen aus Verstümmelung **und** Kunstquelle (43/2 in `proof:tags`
für beide Auflagen) und die Unterordnerdatei mit gestrichenem `recursive: true` (107/1 in
`proof:access`).
