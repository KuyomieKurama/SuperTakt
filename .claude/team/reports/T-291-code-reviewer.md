# T-291 — Review der Nacharbeit T-290 (`proof-release-safety.mjs`)

Aufgabe: T-291 — Prüfung von T-290 (domain-dev), Nacharbeit auf den blockierenden Befund aus
T-289 zu `interfaceRumpf()`
Status: **Nacharbeit**

Geprüfter Umfang: `apps/local-api/scripts/proof-release-safety.mjs` (Diff gegen `HEAD`: 605
Zeilen dazu, 9 gelöscht), die geänderten Absätze in `docs/architektur.md` (1440–1470) und
`docs/datenmodell.md` (1026–1032), die Berichtigung in `.claude/team/reports/T-288-domain-dev.md`.

**Zum Zustand des Baums.** `git status` war zu Beginn **nicht** sauber und ist es am Ende
unverändert genauso: 22 geänderte und 15 unversionierte Pfade aus der laufenden Welle (T-281 bis
T-290). Das ist der erwartete Wellenstand, **keine** Meßdatei eines anderen Prüfers — ich habe
über die Änderungszeiten gegengeprüft: im Zeitfenster von T-290 (12:40–13:00) wurden außerhalb
der Bauergebnisse genau fünf Pfade angefaßt: `proof-release-safety.mjs` (12:56),
`docs/architektur.md` und `docs/datenmodell.md` (beide 12:48), `T-288-domain-dev.md` (12:51,
eigener Bericht) und `T-290-domain-dev.md` (12:59). `docs/bedrohungsmodell.md` (12:34) und
`docs/testplan.md` (10:48) liegen davor. `board.md` (13:01) ist der Orchestrator. **Kein
Übergriff.** Meine eigenen Messungen liefen ausschließlich auf Kopien im Kratzverzeichnis;
`git status` ist danach zeichengleich zum Anfang.

Selbst gefahren: `pnpm --filter @takt/local-api proof:release-safety` (**43/0**), `pnpm typecheck`
(**Exit 0**), dazu zwölf eigene Meßläufe gegen Kopien des Laufs im Kratzverzeichnis (M1–M9,
Umzug, Eigenschaftsstil, Absturzverhalten).

---

## Was ich gemessen habe, bevor ich urteile

**1. Die Zahl 43, von unten nachgerechnet.** Am Quelltext ausgezählt und an der Ausgabe
gegengezählt (Zähler je Abschnitt aus dem Lauf selbst):

| Abschnitt | Zählregel im Code | gerechnet | gemessen |
|---|---|---|---|
| 0 | 6 × `stripComments` + 3 feste | 9 | **9** |
| 1 | je `CHECKS`-Eintrag je Verstoß (1+1+1+1+4+1+**10**) + 5 Nicht-Ausgänge | 19 + 5 = 24 | **24** |
| 2 | je `CHECKS`-Eintrag eine Zeile | 7 | **7** |
| 3 | feste `check(`-Aufrufe | 3 | **3** |
| Summe | | 43 | **43** |

Die +6 liegen tatsächlich alle in Abschnitt 1 und alle in `rueckweg` (4 → 10). Abschnitt 2 bewegt
sich nicht, weil er je `CHECKS`-Eintrag zählt und `rueckweg` ein Eintrag bleibt. Dieselbe Rechnung
wie 35 → 37 in T-288, und sie stimmt.

**2. Die sechs Mutationen — alle sechs nachgefahren, nicht zwei.** Je eine Kopie des Laufs, je ein
Zweig aus, sonst nichts:

| Mutation | Ergebnis | rot wurde |
|---|---|---|
| M1 alter Ausdruck `\{([^}]*)\}` zurück | **42/1** | nur (e) Inline-Objekttyp |
| M2 Gestalt 5 Obergrenze aus | **42/1** | nur (f) V1b |
| M3 Gestalt 5 Untergrenze aus | **42/1** | nur (g) Importquelle fehlt |
| M4 Gestalt 3 Untergrenze „nicht im Baum" aus | **42/1** | nur (i) |
| M5 Gestalt 3 Untergrenze „Spalte weg" aus | **42/1** | nur (h) |
| M6 Untergrenze der Gestalten 4/5 aus | **42/1** | nur (j) Ordner weg |

„Genau eine" hält. Die Gegenproben überlappen sich nicht.

**3. `erwartet` trennt wirklich — dreifach belegt.** Der Kern der Frage ist, ob eine Gegenprobe,
die aus einem **anderen** Grund rot wird, als Fehler gilt. Sie tut es, und ich habe es nicht nur
gelesen:

- **M7** (Untergrenze der Gestalten 4/5 aus **und** alle `erwartet` entfernt): **43/0**, alles
  grün. Dieselbe Mutation **mit** `erwartet` (M6): 42/1. Die Behauptung des Berichts, (j) wäre
  ohne `erwartet` aus dem falschen Grund grün gemeldet worden, ist damit gemessen und richtig.
- In M4 pusht der abgeschaltete Zweig eine **leere** Zeichenkette — `findings.length > 0` ist
  erfüllt, `erwartet` greift trotzdem, und die Gegenprobe ist rot. Genau die verlangte Trennung.
- Bei einem mißlungenen ersten M1-Versuch (Rumpf lieferte überall `null`) schrieb der Lauf
  wörtlich `FEHL … kein Befund trifft die gemessene Lücke — gefunden wurde: … steht nicht (mehr)
  darin`. Nichtleere Befundliste, falscher Grund, Urteil **rot**, und die Ausgabe nennt beides.

Der Zugewinn an Meßgenauigkeit ist gebaut, nicht behauptet.

**4. Gestalt 5, Stand der sieben Quellen.** An der Platte nachgezählt: drei Dateien
(`routes.ts`, `source.ts`, `version.ts`), **acht** Importzeilen, **sieben** Quellen — `hono`,
`./version.ts`, `../../http/problem.ts`, `../../http/guards.ts`, `@takt/domain`,
`../../logger.ts`, `./source.ts`. Die Liste in `VERSION_FEATURE_IMPORTS` stimmt heute
zeichengleich. Die Zahlen des Berichts sind richtig, die in A-V-28 (vier Dateien, sieben Zeilen,
sechs Quellen) sind es nicht — das ist das Papier des security-checkers, nicht meins.

**5. Der Schnitt in fünf Funktionen ist verhaltensgleich.** Die beiden frühen `return findings`
sind zu lokalen `return` in `pruefeGestaltDesPorts` geworden; der Aufrufer verkettet, also ist die
Ergebnismenge in beiden Fällen `[…vorher Gesammeltes, Meldung]` wie zuvor — die Reihenfolge der
Gestalten 1, 3, 4, 2 bleibt erhalten. Die einzige Abweichung ist benannt und gewollt: bei leerem
Prüferordner laufen die Gestalten 4 und 5 nicht, und es steht **eine** Meldung statt sieben
Folgeschäden. Die ist durch (j) gegengeprobt.

**6. Die Reparatur des blockierenden Befunds — an sechs Signaturen gemessen, nicht an einer.**
Jede als eigener Verstoß in eine Kopie des Laufs gesetzt, `erwartet` auf die Gestalt-2-Meldung:

| Signatur im Rumpf | Urteil |
|---|---|
| A Objekttyp in der **Rückgabe** (`Promise<{ ok: boolean }>`) | **rot** ✔ |
| B verschachtelt, zwei Ebenen (`{ force: boolean; meta: { by: string } }`) | **rot** ✔ |
| C Signatur über vier Zeilen | **rot** ✔ |
| D `write(at: Date, mode: '}' \| 'x')` | **grün** ✘ 0 Befunde |
| E `read: () => Promise<string \| null>` als Eigenschaft | **grün** ✘ 0 Befunde |
| F `write(at: Date, marke: "a}b")` | **grün** ✘ 0 Befunde |
| G `readonly read: () => …` (Stil von `VersionCheckerOptions`) | **grün** ✘ 0 Befunde |
| H `read?: () => …` | **grün** ✘ 0 Befunde |

Die Klammerzählung schließt A, B, C — das ist mehr, als mein eigener Fixvorschlag aus T-289
(`([\s\S]*?)\n\}`) gebracht hätte. Sie schließt D und F nicht, weil der Zähler Zeichenketten nicht
kennt, und E/G/H gar nicht, weil die **Mitgliederregel** unverändert `/(\w+)\s*\(/` ist. „0
Befunde" heißt dabei: der ganze `rueckweg`-Prüfsatz ist grün, alle fünf Gestalten.

---

## Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:1030  hoch    Gestalt 2 ist weiterhin blind für den Leser als EIGENSCHAFT. `const members = [...rumpf.matchAll(/(\w+)\s*\(/g)]` findet nur Methodensyntax. Gemessen: `write(at: Date): Promise<void>;` plus `readonly read: () => Promise<string | null>;` — der ganze rueckweg-Prüfsatz liefert **0 Befunde**, Lauf 43/0. Das ist keine erfundene Schreibweise: `VersionCheckerOptions` fünf Zeilen tiefer in derselben Datei ist genau so geschrieben (`readonly now: () => Date;`). Damit ist die Gestalt aus T-279 mit einer Zeile im Hausstil wieder unsichtbar — derselbe Satz, mit dem ich in T-289 blockiert habe. Fix: Mitglieder über die Zeile statt über die Klammer fassen, z. B. `/^\s*(?:readonly\s+)?(\w+)\s*\??\s*[(:]/gm` über den Rumpf; alles außer `write` bleibt Befund. Gegenprobe dazu als elfter Verstoß in `COUNTER_PROOFS.rueckweg` mit `erwartet: /kennt außer/` (Zahl 43 → 44).
apps/local-api/scripts/proof-release-safety.mjs:816   hoch    Die Klammerzählung kennt keine Zeichenketten. Gemessen mit `write(at: Date, mode: '}' | 'x'): Promise<void>;` und mit `marke: "a}b"` — jeweils bricht der Rumpf an dem `}` IN der Zeichenkette ab, `read` daneben verschwindet, **0 Befunde**. Es ist dieselbe Lücke wie die aus T-289, nur mit einem Anführungszeichen davor; der Auftrag hat den Fall ausdrücklich benannt, und er geht durch. Fix: vor dem Zählen eine zeichenketten-freie Abschrift bilden (Inhalte von `'…'`, `"…"`, `` `…` `` durch Leerzeichen ersetzen — `stripComments` in `fetch-scan.mjs` macht das längen- und zeilentreu bereits für Kommentare und ist die Vorlage) und über dieser Abschrift die Klammern zählen, den Rumpf aber aus dem Original schneiden. Gegenprobe mit `mode: '}'` dazu.
apps/local-api/scripts/proof-release-safety.mjs:1122  mittel  Die Gegenprobe `optionen` ist heute aus dem falschen Grund rot — dieselbe Bauart, gegen die `erwartet` in T-290 gebaut wurde, nur eine Prüfung weiter. Sie ersetzt `API_URL_FILE` durch `const daten = await response.json();`; `checkFetchOptions` liefert daraufhin VIER Befunde aus vier unabhängigen Zweigen (drei fehlende REQUIRED-Marken plus einmal `.json()`). Gemessen: setzt man `FORBIDDEN_IN_SOURCE = []` — der Wächter sieht `.json()`, `.text()`, `.arrayBuffer()` und `content-length` in der einen ausgehenden Datei nicht mehr —, bleibt der Lauf bei **43/0**. Die halbe Prüfung ist ungemessen. Fix: `erwartet: /nennt `\.json\(\)`/` an diesen Verstoß, und ein zweiter Verstoß für die Auslassung der REQUIRED-Marken mit eigenem `erwartet`.
apps/local-api/scripts/proof-release-safety.mjs:1084  mittel  Dasselbe bei `adressen`: zwei unabhängige Zweige, ein Verstoß, kein `erwartet`. Gemessen: entfernt man den Zweig „dritte Adresse auf github.com" — die Hälfte, die im Namen der Prüfung steht —, bleibt der Lauf bei **43/0**, weil „nennt api.github.com außerhalb der einen Stelle" allein trägt. Fix: `erwartet: /dritte Adresse auf github\.com/`. (`download` hat ebenfalls zwei Zweige, dort sind beide an dieselbe eingesetzte Zeile gebunden; `felder`, `oeffnen` und die vier `ausgang` haben heute nur einen möglichen Grund.)
apps/local-api/scripts/proof-release-safety.mjs:1002  niedrig Die Befundzeile der Gestalt 5 sagt bei einer ordnerINTERNEN Quelle etwas Falsches. Gemessen an einem reinen Umzug im Merkmal (`source.ts` → `release-source.ts`): zwei Befunde, der erste lautet „importiert `./release-source.ts` … ein zweiter Port ist der geliehene Rückweg". Ein `./`-Import kann den Ordner nicht verlassen und ist nie ein geliehener Port; der nächste Leser sucht nach einem Rückweg, wo eine Umbenennung war. Die Untergrenze selbst ist richtig und von E-103 gedeckt — es geht nur um den Satz. Fix: die Meldung nach Quelle trennen — für `./…` „eine ordnerinterne Quelle ist umgezogen; bestätige die Liste", für alles andere der heutige Satz.
apps/local-api/scripts/proof-release-safety.mjs:1431  niedrig Der `finally`-Block druckt die Bilanz auch dann, wenn eine Prüfung geworfen hat — gemessen: eine abgestürzte Kopie endete auf `stdout` mit „26 bestanden, 0 fehlgeschlagen", der Stapel stand auf `stderr`, Exit 1. Das Tor urteilt am Rückgabewert und ist sicher, ein Mensch liest die letzte Zeile. In einer Datei, deren These „ein Nachweis, der nur grün sagen kann, ist eine Behauptung" ist, gehört das gerade gebogen. Nicht von T-290 eingeführt. Fix: den Fehler im `catch` benennen (`ABGEBROCHEN: <Grund>`) und dann weiterwerfen.
docs/architektur.md:1464                              niedrig „Was dieser Lauf gar nicht sieht, liegt außerhalb der acht gelesenen `src`-Wurzeln" — der Lauf liest acht Wurzeln UND zehn Einzeldateien; der Quelltext sagt es seit T-290 richtig, das Papier nur zur Hälfte. Inhaltlich bleibt die Aussage heute wahr (keine der zehn Einzeldateien liegt in `ui-tokens`, `public` oder einem `scripts/`-Baum — nachgesehen), sie wird aber falsch, sobald eine Einzeldatei dazukommt. Fix: „außerhalb der acht gelesenen `src`-Wurzeln und der zehn Einzeldateien".
```

Keine Befunde zu: **Dateihoheit** (sauber, siehe oben), **Typsicherheit** (`typecheck` Exit 0; kein
`any` und keine Zusicherung neu — das einzige `any` steht seit jeher im Verstoßtext der Gegenprobe
`felder` und ist dort der Verstoß), **verschluckten Fehlern** (kein neues `catch`; die beiden alten
in `collectTree` münden unmittelbar in `scheitern`; die Meßfehlschläge `null` aus `interfaceRumpf`
werden vom Aufrufer als Befund gemeldet und nicht als leerer Fund), **doppelter Fachlogik**
(`stripComments` und `mentionsGlobalFetch` weiterhin aus `fetch-scan.mjs`, keine zweite Fassung;
`importQuellen` ist neu und steht einmal), **Sprache** (Prosa deutsch, Bezeichner englisch, keine
Oberflächentexte).

Die drei zu weit geschriebenen Sätze sind zurückgenommen und der vierte — die **grüne** Zeile in
Abschnitt 2 — dazu; das war eine richtige eigene Feststellung, denn es ist der Satz, den ein
grüner Lauf druckt. Die Berichtigungen in `datenmodell.md` (Gestalten messen den Baum, Gegenproben
messen den Wächter) und der NICHT-fängt-Absatz treffen meine Befunde aus T-289 genau.

---

## Antwort auf die Entwurfsfrage aus dem Auftrag

**Soll `erwartet` auch an den neun Verstößen der übrigen sechs Prüfungen stehen? Ja — und die
Frage ist keine Stilfrage mehr, sie ist gemessen.** Zwei der neun sind heute schon aus dem
falschen Grund rot (Befunde zu 1122 und 1084): je ein Zweig läßt sich ersatzlos entfernen, ohne
daß eine Gegenprobe es merkt, bei `optionen` sogar der halbe Wächter über die Zusagen der einen
ausgehenden Anfrage. Das ist derselbe Fund wie (j), nur eine Prüfung weiter.

**Eigener Auftrag, nicht Beiwerk.** Nicht wegen der Größe — es sind neun Zeilen —, sondern weil
jede dieser neun Zeilen ihre eigene Mutation braucht, um zu belegen, daß sie den gemeinten Zweig
festnagelt und nicht einen zufälligen. Neun Messungen sind kein Beiwerk. Und die Frage „wie viele
unabhängige Zweige hat diese Prüfung überhaupt" wird dabei zweimal mit einem zweiten Verstoß
enden (bei `optionen` sicher), also bewegt sich die Prüfzahl. Ich würde ihn an domain-dev geben
und mit den beiden `hoch`-Befunden oben in **einen** Auftrag legen: gleiche Datei, gleiche
Gegenprobenliste, gleiche Lehre.

---

## Urteil

**Nacharbeit.** Blockierend sind
`apps/local-api/scripts/proof-release-safety.mjs:1030` und `:816`.

Die beauftragte Reparatur ist gut gemacht und für die im Bericht genannte Signatur nachweislich
wirksam — A, B und C werden rot, die sechs Mutationen treffen je genau eine Gegenprobe, `erwartet`
trennt. Aber die **Lücke**, um derentwillen ich in T-289 blockiert habe, ist nicht zu: mit
`readonly read: () => Promise<string | null>;` — der Schreibweise, in der die Nachbarschnittstelle
in derselben Datei geschrieben ist — ist der Rückweg aus T-279 wieder gebaut und der Lauf
**43/0**. Und der Fall „`}` in einer Zeichenkette", der im Auftrag ausdrücklich stand, geht
ebenfalls durch. Ein Wächter, dessen Kernaussage lautet „`VersionCheckStorePort` kann `write` und
sonst nichts", muß die Mitglieder dieser Schnittstelle in beiden Schreibweisen sehen; solange er
das nicht tut, ist die Zusage wieder weiter als die Messung — genau der Fehler, gegen den T-290
angetreten ist.

Mitzunehmen in denselben Auftrag, weil sie dieselbe Datei und dieselbe Gegenprobenliste berühren:
die beiden `mittel`-Befunde (1122, 1084) samt der Entwurfsfrage. Die drei `niedrig`-Befunde können
mit oder ohne eigenen Auftrag laufen.
