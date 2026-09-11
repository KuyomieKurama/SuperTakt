# T-294 — Der Wächter gibt zu, wenn er die Basis nicht sieht; und die Gegenproben werden abgezählt

Aufgabe: T-294 — vierte Runde an `apps/local-api/scripts/proof-release-safety.mjs`
(code-reviewer T-293: Nacharbeit, blockierend `:868` `extends`, dazu `:869`
Deklarationszusammenführung, die Berichtigung des Untergrenzen-Satzes an drei Stellen und die
Anwendung der Zählvorschrift auf alle Prüfungen)
Status: **fertig, braucht Review**

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | **(1)** `portMitglieder` sieht `extends` und die Deklarationszusammenführung und gibt in beiden Fällen einen **Meßfehlschlag** zurück. **(2)** Der Rückgabewert ist nicht mehr `null`, sondern der **Grund** — vier Meßfehlschläge, vier Sätze. **(3)** 17 neue Gegenproben (27 → 44 Verstoßeinträge). **(4)** `erwartet` an den sieben Einträgen, die keines hatten. **(5)** Die Zählvorschrift steht als Absatz über `COUNTER_PROOFS`, samt der drei Stellen, an denen sie nicht mechanisch durchläuft. **(6)** Der Untergrenzen-Satz ist an beiden Stellen im Quelltext berichtigt |
| `docs/architektur.md` | „sechzehn" → **zweiundzwanzig** Gegenproben; die Berichtigung der Untergrenze (dritte Stelle, vormals Zeile 1449); ein Absatz über die zweite Klasse (**Auflösung** statt Schreibweise); ein Absatz über die Zählvorschrift und ihre Grenze |
| `docs/datenmodell.md` | „sechzehn" → **zweiundzwanzig**, mit den sechs neuen in einem Satz |

Kein Produktivcode, keine Migration, keine Prüfdatei, kein fremdes Papier.
`docs/bedrohungsmodell.md`, `docs/testplan.md` und `apps/local-api/test/**` sind **gelesen und
nicht geändert**. Kein Eintrag für den Orchestrator nötig (`typescript` steht seit T-292 als
Entwicklungsabhängigkeit in `apps/local-api/package.json`).

---

## 1. Der blockierende Befund — gemessen, vorher und nachher

Der code-reviewer hat ihn zweimal gebaut; ich habe **beide** Bauarten am ganzen Lauf
nachgestellt, je als Verstoßeintrag, und den Leser dazu einmal auf den Stand von T-292
zurückgebaut:

```
abgeliefert + ZZ6                                      → 69/0
ZZ6, aber die `extends`-Regel zurückgebaut (T-292)     → 67/2
   FEHL  … `read` über `extends` geerbt (lokale Basis) — der eingesetzte Verstoß blieb unbemerkt
   FEHL  … ZZ6: die Basis kommt aus @takt/domain       — der eingesetzte Verstoß blieb unbemerkt
```

„**Der eingesetzte Verstoß blieb unbemerkt**" heißt: **null** Befunde aus allen fünf Gestalten,
obwohl der Port `read()` kann und die Datei daneben `port.read()` ruft. Die Bauart mit der Basis
aus `@takt/domain` zeigt zusätzlich, daß **Gestalt 5 hier nichts auffängt**: `@takt/domain` ist
eine der sieben erlaubten Importquellen, der geerbte Rückweg käme durch die Vordertür.

**Der Fix ist das Zugeben, nicht das Auflösen.** `heritageClauses` vorhanden ⇒ Meßfehlschlag ⇒
rot. Kein Verfolgen der Basis: Ein klügerer Leser brächte die nächste Auflösungslücke gleich mit
(die Basis einer Basis, ein `extends` aus einem Paket, ein Mapped Type darüber) — das wäre die
Schreibweisenjagd von T-289 bis T-292 eine Ebene höher.

**Die Deklarationszusammenführung** (`:869`, `mittel`) ist derselbe Weg mit anderem Mittel: zwei
`export interface VersionCheckStorePort` in einer Datei, das erste mit `write`, das zweite mit
`read`. Auch hier Meßfehlschlag statt Vereinigung — der Leser soll nicht zusammenführen, was
TypeScript zusammenführt, sondern sagen, daß er es nicht tut.

## 2. Warum aus „drei Zeilen" ein Rückgabewert wurde

Der Auftrag sagte `null`. Das trägt für die Wirkung, aber nicht für die **Zählvorschrift**:
`extends`, Zusammenführung, umbenannter Port und Alias-ohne-Typliteral wären vier Zweige hinter
**einem** Satz gewesen — und damit nach der Vorschrift **eine** Gegenprobe für vier Zweige.
Genau die Bauart, gegen die dieser Lauf geschrieben ist.

`portMitglieder` gibt deshalb `{ mitglieder }` oder `{ fehlschlag }` zurück, vier Meßfehlschläge
mit vier unterscheidbaren Sätzen. Gemessen (Mutation R3): Kollabiert man die vier Sätze wieder
auf einen — das Verhalten von T-292 —, werden **drei** Gegenproben rot und eine bleibt grün.
Die Vorschrift greift damit in den Leser hinein; das war beim Beantworten der Entwurfsfrage
nicht abzusehen und ist der stärkste Punkt für sie.

## 3. Die Berichtigung — selbst nachgemessen, nicht übernommen

Der Satz „die Untergrenze, die allen drei Ausfällen gemeinsam war" stammt von mir und ist
**falsch**. Ich habe die beiden alten Leser nachgebaut (`\{([^}]*)\}` aus T-288/289 und die
Klammerzählung aus T-290) und die drei Ausfälle durch sie geschickt:

| Fall | Leser T-289 | Leser T-290 |
|---|---|---|
| Inline-Objekttyp (T-289) | `['write']` | `['write','read']` |
| `}` in einer Zeichenkette (T-291) | `['write']` | `['write']` |
| `read` als Eigenschaft (T-291) | `['write']` | `['write']` |

Der jeweils **damals laufende** Leser fand in allen drei Fällen genau **ein** Mitglied, nie
null. Die Untergrenze hätte keinen der drei gefangen, und über `!members.includes('write')`
hinaus erkennt sie nichts (T-292 M2 und T-293 M12). Gemeinsam war den drei etwas anderes: Der
Leser fand das Mitglied, das er sehen wollte, und übersah das zweite — dagegen hilft der
Compiler.

**Die Untergrenze bleibt**, aber mit dem Grund, der trägt: Sie steht gegen einen **künftigen**
schwächeren Leser (gegen einen zeilenverankerten Ausdruck wird sie rot, T-293 M12) und sie sagt
den genaueren Satz. Berichtigt an **allen drei** Stellen: im Quelltext bei
`pruefeGestaltDesPorts`, im Quelltext bei der Gegenprobe (o) und in `docs/architektur.md`.

## 4. Die Zählvorschrift — trägt sie?

**Sie trägt, und sie hat drei Bruchstellen.** Alle drei sind gemessen und stehen im Quelltext
neben der Vorschrift, damit der nächste sie nicht wieder findet:

1. **Ein Satz aus einer Liste zählt als einer.** `checkNoDownload` erzeugt einen Satz für
   **vierzehn** Marken, `checkFetchOptions` je einen für **sieben**. Nach dem Wortlaut ist das
   je eine Gegenprobe — und das **teilweise** Leeren der Listen bleibt ungemessen (Risiko 4 aus
   T-292; der code-reviewer hat es als eigene Entscheidung markiert). Hier zählt die Vorschrift
   zu wenig. Der Ausgleich wären **21** Einträge statt zwei; **nicht gebaut**, siehe „Offene
   Fragen".
2. **Zwei Zweige, ein Satz.** `extends` und die Zusammenführung hätten sich einen Satz geteilt.
   Die Vorschrift zwingt dann nicht zu zwei Gegenproben, sondern zu **zwei Sätzen**. Kein
   Bruch, sondern eine Erweiterung: Sie ist nicht nur eine Zählregel für Gegenproben, sondern
   eine **Formregel für Befundsätze**.
3. **Ein Satz, der nur als Nebenwirkung fällt.** „`version.ts` nicht im gelesenen Baum" wurde
   vom Eintrag „der Ordner des Prüfers ist weg" ausgelöst, dessen `erwartet` auf einen anderen
   Satz zeigt. Der Satz war **gezählt, aber nicht gemessen**. Wer nach Sätzen zählt, muß die
   `erwartet` gegenzählen und nicht die roten Zeilen — sonst hält man eine Nebenwirkung für
   Deckung. Das ist T-143 S-1 in neuer Kleidung.

## 5. Die Zahl: 51 → **68**, nicht 64

Die Vorhersage war 64 (11 + 2). Gemessen sind **68**; die Abweichung sind **vier weitere
Einträge in `rueckweg`**, alle an Gestalt 2, alle an Sätzen, die es schon gab und die kein
Verstoß je erreicht hatte. Sie fallen an, weil die Vorschrift auf ganz
`pruefeGestaltDesPorts` angewandt wurde und nicht nur auf die beiden Befunde:

| Satz der Gestalt 2 | vorher gedeckt | neu |
|---|---|---|
| `read` über `extends` (Befund T-293) | — | (q) |
| zwei Deklarationen (Befund T-293) | — | (r) |
| Alias ohne Typliteral | **nein** | (s) |
| Name nicht gefunden | **nein** | (t) |
| kennt kein `write` mehr | **nein** | (u) |
| `version.ts` nicht im Baum | nur als Nebenwirkung | (v) |

**(u) ist der bemerkenswerteste.** Der Prüfsatz heißt „der Port kann `write` und sonst nichts";
gegengeprobt war bis heute nur das „sonst nichts". Ein Port, der sein `write` verliert, merkt
sich den Zeitpunkt der ausgehenden Anfrage nirgends mehr — das ist die Hälfte, um die es in
T-279 überhaupt ging.

Die elf Einträge in den sechs Prüfungen stimmen dagegen **zeichengleich** mit der Vorhersage,
einschließlich der beiden Beobachtungen aus meinem T-292-Bericht (`checkAddresses` fünf Zweige,
drei ohne Gegenprobe; `checkFetchOptions` mit einer Untergrenze ohne Gegenprobe).

### Von unten vorgerechnet

| Abschnitt | Zählregel im Code | gerechnet | gemessen |
|---|---|---|---|
| 0 | 6 × `stripComments` + 3 feste | 9 | **9** |
| 1 | je Verstoßeintrag eine Zeile + 5 Nicht-Ausgänge | 44 + 5 = 49 | **49** |
| 2 | je `CHECKS`-Eintrag eine Zeile | 7 | **7** |
| 3 | feste `check(`-Aufrufe | 3 | **3** |
| **Summe** | | **68** | **68** |

Die 44 Verstoßeinträge je Prüfung, am Lauf gezählt: `adressen` **5**, `felder` **4**, `oeffnen`
**3**, `download` **1**, `ausgang` **6**, `optionen` **3**, `rueckweg` **22**. Abschnitt 2
bewegt sich wieder nicht — sieben Prüfungen bleiben sieben. Dieselbe Rechnung wie 35 → 37
(T-288), 37 → 43 (T-290) und 43 → 51 (T-292).

## 6. Zwanzig Mutationen, je ein Zweig aus

Verfahren wie in T-288, T-290 und T-292: Kopie unter `apps/local-api/scripts/messung-t294.mjs`
(eigene Hoheit), je ein Zweig aus, im selben Befehl entfernt; `git status` danach unverändert.
**Achtzehn von zwanzig drehen genau eine Gegenprobe** — jedesmal die, die für ihren Zweig
geschrieben wurde:

| Mutation | Bilanz | rot wurde |
|---|---|---|
| A1 `adressen`: Zweig „Abfrageadresse an zweitem Ort" raus | 67/1 | nur der neue Eintrag |
| A2 `adressen`: Zweig „Release-Seite am fremden Ort" raus | 67/1 | nur der neue Eintrag |
| A3 `adressen`: Zählung `apiCount !== 1` raus | 67/1 | nur die neue Untergrenze |
| F1 `felder`: `FORBIDDEN_FIELDS`-Zweig raus | 67/1 | nur `html_url` — der Alteintrag, jetzt mit `erwartet` |
| F2 `felder`: Punktzugriff `.tag_name` raus | 67/1 | nur der neue Eintrag |
| F3 `felder`: `tag_name` an fremder Stelle raus | 67/1 | nur der neue Eintrag |
| F4 `felder`: Zählung `tagNameCount !== 1` raus | 67/1 | nur die neue Untergrenze |
| O1 `oeffnen`: Nutzlast-Zweig raus | 67/1 | nur der Alteintrag |
| O2 `oeffnen`: Signatur-Zweig der Hülle raus | 67/1 | nur der neue Eintrag |
| O3 `oeffnen`: `href`-Zweig raus | 67/1 | nur der neue Eintrag |
| D1 `download`: beide Markenlisten leer | 67/1 | nur der Alteintrag |
| X1 `ausgang`: Zweig „nennt `fetch` außerhalb" raus | **64/4** | die vier Schreibweisen — ein Satz, vier Einträge |
| X2 `ausgang`: Zählung `callers.length !== 1` raus | 67/1 | nur die neue Untergrenze |
| X3 `ausgang`: Zweig „Routendatei kennt die Abholfunktion" raus | 67/1 | nur der neue Eintrag |
| P1 `optionen`: Untergrenze „`source.ts` fehlt" raus | 67/1 | nur der neue Eintrag |
| **R1 `rueckweg`: die `extends`-Regel raus** | 67/1 | **nur (q)** — der blockierende Befund |
| R2 `rueckweg`: Zusammenführung wieder unsichtbar | 67/1 | nur (r) |
| R3 `rueckweg`: alle vier Meßfehlschläge auf einen Satz | **65/3** | (q), (r), (s) — (t) bleibt grün, er trägt den alten Satz |
| R4 `rueckweg`: Zweig „kennt kein `write` mehr" raus | 67/1 | nur (u) |
| R5 `rueckweg`: Untergrenze „`version.ts` nicht im Baum" stumm | 67/1 | nur (v) |

**X1 ist kein Mangel, sondern die Vorschrift im Betrieb:** Die vier Schreibweisen messen einen
Satz aus vier Richtungen (T-143 S-1) und teilen sich deshalb ihr `erwartet`. Bis T-294 hätte die
bloße Zählung `callers.length !== 1` alle vier allein getragen; jetzt nicht mehr.

## Annahmen

1. **`extends` wird nicht aufgelöst, `&` ebensowenig.** Ein Alias auf eine Verschneidung ist
   dieselbe Zerlegung in anderer Schreibweise und fällt in denselben Meßfehlschlag. Eine
   Auflösung wäre eine Zusage über fremde Dateien, die dieser Lauf nicht halten kann.
2. **Zwei Deklarationen werden nicht vereinigt, sondern gemeldet.** Der code-reviewer hat beides
   angeboten. Vereinigen wäre genauer im Ergebnis und falscher in der Haltung: Ein Port, der in
   diesem Bestand zweimal deklariert ist, ist ohnehin ein Befund.
3. **Die Markenlisten bleiben ein Satz** (`download` vierzehn, `optionen` sieben). Die
   Zählvorschrift gäbe 21 Einträge; das ist eine Entscheidung und keine Nacharbeit.
4. **Die Meßkopie lag in eigener Hoheit**, je für die Dauer eines Befehls, im selben Befehl
   entfernt. Dieselbe Annahme wie in T-288, T-290 und T-292.
5. **Gegenproben, die eine Datei wegnehmen, nehmen `source.ts` weg.** Vier der neuen
   Untergrenzen tun das (`adressen`, `felder`, `ausgang`, `optionen`) — der billigste Verstoß,
   der genau einen Zweig erreicht, und zugleich der realistischste: ein Umzug.

## Risiken

1. **Der Compiler sieht weiterhin die Schreibweise, nicht den Sinn.** `write(at: Date):
   Promise<string | null>` bleibt grün; Gestalt 2 mißt Namen und Zahl der Mitglieder, nicht
   Rückgabetypen. Unverändert seit T-292; die Frage an den security-checker steht noch offen.
2. **Die Auflösung ist zu, das Verhalten nicht.** Was `portMitglieder` fängt, ist die *Gestalt*
   des Ports. Eine neue **optionale** Option an `createVersionChecker` bliebe weiterhin
   ungesetzt und grün (T-289, 38.4) — dagegen hilft nur ein Prüffall am Verhalten.
3. **Teilweises Leeren der Markenlisten bleibt ungemessen** (Annahme 3). D1 fängt nur das
   vollständige Leeren beider Listen.
4. **Die Prüfzahl wächst schneller als der gemessene Bestand.** 44 Verstoßeinträge gegen sieben
   Prüfungen heißt: Der Lauf mißt zu drei Vierteln sich selbst. Das ist Absicht (E-086 Punkt 1)
   und hat trotzdem eine Grenze, die irgendwann jemand benennen muß.
5. **Kein Sicherheitsrisiko hinzugefügt.** Kein Produktivpfad, kein Netzweg, keine Route berührt.

## Offene Fragen an den Orchestrator

- **`docs/bedrohungsmodell.md` — zwei Stellen, beide an den security-checker, beide gelesen und
  nicht geändert:**
  - Zeile 10298 nennt „alle **vierzehn** Gegenproben" für `proof:release-safety`. Gemessen sind
    heute **44** Verstoßeinträge, davon **22** allein für `rueckweg`.
  - A-V-28 (38.7) nennt „vier Dateien, sieben Importzeilen, sechs Quellen"; an der Platte
    gemessen sind es **drei / acht / sieben**. Offen seit T-290 (T-290-1).
- **Die 21 Einträge für die Markenlisten** (`DOWNLOAD_MARKERS` + `TRANSPORT_MARKERS` vierzehn,
  `REQUIRED_IN_SOURCE` + `FORBIDDEN_IN_SOURCE` sieben) sind die einzige Stelle, an der die
  Zählvorschrift heute bewußt nicht angewandt ist. Sie brächte die Prüfzahl von 68 auf **87**.
  Eine Entscheidung über das Verhältnis von Nachweis zu Bestand, keine Nacharbeit.
- **Die Prüfzahl steht heute bei 68** (vorher 51). Gesucht über `git grep` **und** über
  `apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test`, `docs/testplan.md`: **keine
  Fundstelle** außerhalb von `board.md`, `decisions.md` und den Berichten trägt die alte Zahl
  oder „sechzehn Gegenproben".
- **T-289-4 (R-23 und R-24 nie im Bedrohungsmodell bewertet)** bleibt offen; nicht meine Fläche.

## Der Torlauf

`pnpm check`, alle neun Stufen, **Exit 0**, einmal von der ersten bis zur letzten Stufe gegen
genau den abgelieferten Stand.

| Stufe | Ergebnis |
|---|---|
| `typecheck` | grün |
| `boundaries` | grün |
| `contrast` | grün |
| `proof:all` | Exit 0, 0 rot; darin `release-safety` **68/0** (vorher 51/0), `callers` 74/0, `layers` 36/0, `openapi` 115/0, `route-policy` 44/0, `conflicts` 154/0, `access` 109/0, `export` 98/0, `export-api` 72/0, `tags` 45/0, `foreign` 21/0, `surface` 27/0, `taskpane` 29/0, `addin` 248/0, `addin-wiring` 32/0, `codepoints` 46/0, `template-fields` 30/0, `locked-text` 9/0 |
| `verify:bundle` | 19/0 |
| `test:coverage` | 90 Dateien, **1696 bestanden**, 3 übersprungen, 0 rot |
| `test:rust` | ok, 68 bestanden, 0 fehlgeschlagen, 1 übersprungen |
| `build` | grün |
| `audit` | „No known vulnerabilities found" |

Kein Prüflauf außer `release-safety` hat sich bewegt — erwartet, weil kein Produktivcode und
keine Prüfdatei angefaßt wurde.

## Nächster Schritt

Freigabe durch code-reviewer und security-checker. Zwei Fragen zurück an den code-reviewer, beide
aus der Messung: ob die Zählvorschrift auch für die **Markenlisten** gelten soll (68 → 87), und
ob „ein Satz, der nur als Nebenwirkung fällt, ist nicht gemessen" als Regel neben die Vorschrift
gehört — an (v) hat sie heute einen Fall, und es ist derselbe Fehler wie T-143 S-1.
