# T-293 — Review von T-292 (`proof-release-safety.mjs`, dritte Runde)

Aufgabe: T-293 — Prüfung der Nacharbeit T-292 (domain-dev) auf die beiden blockierenden Befunde
aus T-291 (`:1030` Eigenschaftsschreibweise, `:816` `}` in einer Zeichenkette)
Status: **Nacharbeit**

Geprüfter Umfang: `apps/local-api/scripts/proof-release-safety.mjs` (Diff gegen `HEAD`: +908/−76),
die geänderten Absätze in `docs/architektur.md` (1436–1480) und `docs/datenmodell.md` (1026–1036).

## Zustand des Baums, gemessen statt angenommen

`git status` zu Beginn: 22 geänderte, 17 unversionierte Pfade (39). Am Ende **zeichengleich
39** — meine Messungen liefen ausschließlich auf Kopien im Kratzverzeichnis
(`…/scratchpad/t293/`), die Kopie wurde über absolute `file://`-Bezüge auf `typescript`,
`source-resolve.mjs` und `fetch-scan.mjs` lauffähig gemacht und liest denselben echten Baum.

Änderungszeiten im Fenster T-292: `proof-release-safety.mjs` 13:27:43,
`docs/datenmodell.md` 13:27:33, `docs/architektur.md` 13:27:27, `T-292-domain-dev.md` 13:34.
`docs/bedrohungsmodell.md` (12:34), `docs/testplan.md` (10:48), `docs/spec.md` (11:47),
`packages/domain/src/version.ts` (11:42) liegen davor. **Kein Übergriff**; alle drei berührten
Dateien gehören domain-dev. Die angekündigte Meßkopie `apps/local-api/scripts/messung-t292.mjs`
liegt nicht mehr im Baum. Zu beachten: `HEAD` ist seit T-291 auf `f6f4d6d` (PR #17) gewandert;
die Datei dort ist noch die Fassung **vor** T-288, ein Vergleich gegen T-290 ist aus `git` nicht
möglich und wurde deshalb funktional nachgestellt (M11 unten).

Selbst gefahren: `proof:release-safety` am echten Baum (**51/0**), dazu **sechzehn** eigene
Meßläufe gegen Kopien (M1–M12 nachgestellt, ZZ1–ZZ6 als eigene Gegenproben, dazu 29 Formen
gegen den Leser allein). `typecheck` sagt zu dieser Datei **nichts**: `apps/local-api/tsconfig.json`
hat `"include": ["src"]`, `allowJs`/`checkJs` stehen nirgends. Das einzige Tor über dieser Datei
ist, daß sie läuft.

---

## 1. Die beiden blockierenden Befunde aus T-291 — beide zu

Am Leser allein gemessen (`portMitglieder` aus der Datei herausgeschnitten, unverändert):

| Form | heute |
|---|---|
| `readonly read: () => Promise<string \| null>;` neben `write(…)` | `['write','read']` → **rot** ✔ |
| `write(at: Date, mode: '}' \| 'x')` mit `read()` daneben | `['write','read']` → **rot** ✔ |
| `type X = { write…; read… }` | `['write','read']` → **rot** ✔ |
| `'read'()` als Zeichenkettenliteral-Name | `['write','read']` → **rot** ✔ |
| Indexsignatur | `['write','<IndexSignature>']` → **rot** ✔ |
| Rufsignatur | `['<CallSignature>','write']` → **rot** ✔ |
| generisches `interface X<T = void>` | `['write','read']` → **rot** ✔ |
| `read` **in einem Kommentar** im Rumpf | `['write']` → grün ✔ (richtig) |
| Alias auf `Omit<…>`, Vereinigung, geklammertes Literal, `import type`-Alias, lokaler Typname, `export { A as X }`, Port im `namespace` | je `null` → **Meßfehlschlag, rot** ✔ |
| Syntaxfehler vor der Schnittstelle (offene Klammer) | `null` → **rot** ✔ |
| Mapped-Type-Alias `{ [K in …]: … }` | `null` → **rot** ✔ |

Der Umstieg trägt. Die Richtung stimmt auch dort, wo der Leser nichts auflöst: unbekannt heißt
rot, nicht leer. **Zwei Formen fallen heraus** — siehe Befund 1 und 2.

## 2. Die Untergrenze: greift sie bei Umbenennung, Umzug, leerer Datei?

Vier Zustände, alle am ganzen Lauf gemessen, **alle vier rot und alle vier mit
unterschiedlichem Satz**:

| Zustand | Meldung |
|---|---|
| `version.ts` nicht im Baum (`entfernt`) | `version.ts: nicht im gelesenen Baum` |
| Port **umbenannt** (`StorePort`) | `… steht nicht (mehr) als Schnittstelle oder Typliteral darin — der Leser hat nichts gemessen` |
| Port in **andere Datei verschoben** (`./ports.ts`) | derselbe Satz **plus** Gestalt 5: „importiert `./ports.ts` — eine ordnerinterne Quelle … hier ist etwas umgezogen" |
| `interface X {}` / `type X = {}` / nur Kommentar darin | `… hat kein einziges gelesenes Mitglied` |

„Datei nicht gefunden", „Name nicht gefunden" (Meßfehlschlag) und „null Mitglieder" sind
sauber getrennt. Die Frage aus dem Auftrag ist damit positiv beantwortet. Der neue Satz für die
ordnerinterne Quelle (mein `niedrig`-Befund zu :1002) steht und trifft.

## 3. Der Kausalnachweis zur Zahl — nachgefahren, er stimmt

M11 nachgestellt: die acht in T-292 dazugekommenen Verstoßeinträge beim Aufbau der Injektionen
herausgefiltert (Compiler, Untergrenze und getrennter Befundsatz **bleiben** drin). Gemessen
wurde zusätzlich, wieviel je Prüfung wegfällt:

```
M11 adressen: 1 entfernt   M11 optionen: 1 entfernt   M11 rueckweg: 6 entfernt   M11 ausgang: 0
43 bestanden, 0 fehlgeschlagen
```

Und je Abschnitt gegengezählt:

| Abschnitt | T-291 gemessen (43) | M11 heute | abgeliefert (51) |
|---|---|---|---|
| 0 | 9 | **9** | 9 |
| 1 | 24 | **24** | **32** |
| 2 | 7 | **7** | 7 |
| 3 | 3 | **3** | 3 |

Die Aussage des Berichts ist damit nicht nur plausibel, sondern gemessen: **der Umstieg auf den
Compiler bewegt die Zahl nicht**, die +8 liegen vollständig in Abschnitt 1 und vollständig in
neuen Verstoßeinträgen, und kein einziger der 43 alten Einträge wird durch den Compiler rot.
Das ist die stärkste Zusage dieses Auftrags, und sie hält.

## 4. Die elf Mutationen — nachgefahren

M1 bis M10 eigenständig nachgestellt (M1 mit einem Nachbau des T-290-Lesers: Klammerzählung
plus `/(\w+)\s*\(/g`):

| Mutation | Bilanz bei mir | rot wurde |
|---|---|---|
| M1 Leser aus T-290 zurück | **48/3** | (k) Eigenschaft, (l) `}` in Zeichenkette, (n) Typalias |
| M2 Untergrenze aus | 50/1 | nur (o) |
| M3 `!isPropertySignature` | 50/1 | nur (k) |
| M4 Typalias-Zweig aus | 50/1 | nur (n) |
| M5 `FORBIDDEN_IN_SOURCE = []` | 50/1 | nur `optionen`/`.json()` |
| M6 `REQUIRED_IN_SOURCE = []` | 50/1 | nur `optionen`/Zusagen |
| M7 Zweig „dritte Adresse" raus | 50/1 | nur `adressen`/dritte Adresse |
| M8 Zweig „nennt Wirt" raus | 50/1 | nur `adressen`/Wirt |
| M9 Trennung nach Quelle aus | 50/1 | nur (p) |
| M10 Absturz nach Abschnitt 0 | — | `ABGEBROCHEN: …` auf `stdout` **über** der Bilanz, Exit 1 |
| M11 acht neue Einträge raus | **43/0** | nichts |

Alle elf reproduzieren zeichengleich. Die beiden `mittel`-Befunde aus T-291 (M5/M7) sind damit
nachweislich erledigt: beide ließen den Lauf vorher bei 43/0, beide sind jetzt genau eine rote
Zeile mit dem Namen des fehlenden Zweigs.

**Warum M1 drei dreht und das keine Überlappung ist.** M1 tauscht nicht einen Zweig, sondern den
ganzen Leser; drei Gegenproben messen drei verschiedene Eigenschaften **dieses** Lesers. (k) hat
mit M3 und (n) mit M4 je eine eigene Einzelmutation, die genau eine dreht — gemessen. (l) hat
keine: Unter dem Compiler gibt es keinen „Zeichenkettenzweig", den man einzeln abschalten
könnte, weil der Compiler Zeichenketten nicht als Sonderfall behandelt. (l) ist deshalb
zwangsläufig nur gegen den Rückbau gesetzt, und M1 ist die einzige Mutation, die sie erreicht.
Das ist richtig so und keine geschönte Zahl.

## 5. Die mehrzeilige Gegenprobe (m) — sie mißt doch etwas

Der Bericht sagt ehrlich, daß (m) keine der elf Mutationen dreht, und nennt sie einen
Merkposten. Ich habe die Frage „ist das überhaupt eine Gegenprobe" nicht am Bericht, sondern an
einer **zwölften Mutation** entschieden, die der Bericht nicht gefahren hat: ein
zeilenverankerter Leser, also die Bauart, die ein vierter Anlauf mit einem regulären Ausdruck
plausibel hätte (`/^\s*(?:readonly\s+)?(\w+)\s*\??\s*(?:\(.*\)|:).*;\s*$/gm` über den
klammergezählten Rumpf):

```
M12  48 bestanden, 3 fehlgeschlagen  → rot: (l), (m), (n)
```

(m) dreht also, sobald jemand einen Leser baut, der die Signatur auf **einer** Zeile erwartet.
Sie ist damit eine echte Gegenprobe mit Unterscheidungskraft, nur nicht gegen die elf gewählten
Mutationen. Die Zahl sechzehn ist nicht geschönt. Was sie **nicht** belegt, ist ein Gewinn des
T-292-Umstiegs — (m) war auch unter dem T-290-Leser grün-korrekt —, und genau so steht es im
Quelltext und im Bericht. Gut gekennzeichnet, kein Befund.

Die im Bericht benannte Grenze „Gestalt 2 mißt Namen und Zahl, nicht Rückgabetypen" habe ich
nachgemessen: `write(at: Date): Promise<string | null>` bleibt grün. Die Grenze ist richtig
gezogen und benannt; ein Rückgabetyp-Wächter hätte hier die vierte Schreibweisenjagd eröffnet.
Kein Befund, aber der security-checker sollte die Frage ausdrücklich beantworten.

---

## Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:868   hoch    Gestalt 2 ist blind für ein `read`, das über `extends` geerbt wird. `portMitglieder` liest `statement.members` und ignoriert `heritageClauses` vollständig. Gemessen am ganzen Lauf (ZZ1, lokale Basisschnittstelle in derselben Datei; ZZ6, Basis aus `@takt/domain` — einer der sieben ERLAUBTEN Importquellen, dazu ein `port.read()`-Aufruf in derselben Datei): **alle fünf Gestalten liefern 0 Befunde**, „der eingesetzte Verstoß blieb unbemerkt", Lauf 51/1 nur wegen meiner Gegenprobe. Der Rückweg aus T-279 steht gebaut da und der Wächter sagt grün — dieselbe Klasse, wegen der ich in T-289 und T-291 blockiert habe, nur nicht mehr über die Schreibweise, sondern über die Auflösung. Ein Port in eine Lese- und eine Schreibhälfte zu zerlegen ist der naheliegendste aller Umbauten, naheliegender als `readonly read: () => …`. Fix: in `portMitglieder` nach dem Namenstreffer `statement.heritageClauses !== undefined && statement.heritageClauses.length > 0` prüfen und dann `null` zurückgeben — das ist genau die Regel, die die Datei bei berechneten Namen und bei nicht aufgelösten Aliassen bereits anwendet („wenn der Leser etwas sieht, das er nicht benennen kann, ist Rot die sichere Richtung"), sie fehlt hier als einzige. Gegenprobe als siebzehnter Verstoß in `COUNTER_PROOFS.rueckweg` mit `erwartet: /VersionCheckStorePort/` (Zahl 51 → 52).
apps/local-api/scripts/proof-release-safety.mjs:869   mittel  Deklarationszusammenführung wird nicht gesehen: die Schleife gibt beim ERSTEN Treffer zurück. Gemessen (ZZ2): zwei `export interface VersionCheckStorePort` in derselben Datei, das erste mit `write`, das zweite mit `read` — TypeScript führt sie zusammen, der Leser liefert `['write']`, der ganze Prüfsatz 0 Befunde, grün. Dieselbe Wirkung wie Befund 1, anderer Weg. Fix: alle Deklarationen des Namens einsammeln statt beim ersten `return` abzubrechen (`const treffer = datei.statements.filter(…)`); bei mehr als einer Deklaration alle Mitglieder vereinigen — oder, im Stil der Datei, `null` und damit Meßfehlschlag. Eigene Gegenprobe (Zahl 52 → 53).
apps/local-api/scripts/proof-release-safety.mjs:1103  mittel  Die Begründung der Untergrenze nennt eine Ursache, die nicht die Ursache war. „Drei Runden lang war genau das der Fehlerfall: ein Leser, der 0 Mitglieder fand, meldete grün" — gemessen am nachgebauten T-290-Leser fand er in **allen drei** Fällen genau EIN Mitglied: T-289 Inline-Objekttyp `['write']`, T-291 `}` in Zeichenkette `['write']`, T-291 Eigenschaft `['write']`. Nie null. Die Untergrenze hätte keinen der drei gefangen. Zweitens fügt sie keine Erkennung hinzu: bei leerer Mitgliederliste greift ohnehin `!members.includes('write')` — gemessen in M2 (Untergrenze aus, (o) wird trotzdem rot, nur mit anderem Satz) und in M12 (dasselbe). Ihr Wert ist ein genauerer Satz, nicht eine geschlossene Lücke. Das ist in einer Datei, deren These „ein Nachweis, der nur grün sagen kann, ist eine Behauptung" lautet, der falsche Lehrsatz an der falschen Stelle: Der gemeinsame Nenner der drei Ausfälle war, daß der Leser das eine Mitglied fand, das er sehen wollte, und das zweite übersah — dagegen hilft der Compiler, nicht eine Untergrenze. Fix: den Satz an allen drei Stellen auf das Gemessene bringen — hier, in der Gegenprobe (o) bei :1318 („sie ist der gemeinsame Nenner aller drei Ausfälle — jedesmal fand der Leser null Mitglieder") und in `docs/architektur.md:1449` („die Untergrenze, die allen drei Ausfällen gemeinsam war"). Die Untergrenze selbst bleibt: sie ist gegen einen KÜNFTIGEN schwächeren Leser richtig, und M12 zeigt sie genau dort wirken.
apps/local-api/scripts/proof-release-safety.mjs:1708  niedrig Die letzte Zeile auf `stdout` liest sich nach einem Abbruch weiterhin grün. Gemessen (M10): Abbruch nach Abschnitt 0 → `ABGEBROCHEN: …`, dann „Die Bilanz unten ist damit unvollständig", dann als letzte Zeile `9 bestanden, 0 fehlgeschlagen`, Exit 1. Das ist wörtlich der Fix, den ich in T-291 vorgeschlagen habe, und insofern erledigt; wer scrollt, liest trotzdem zuletzt eine Null. Nicht blockierend, weil über meine eigene Vorgabe hinaus. Fix, wenn er ohnehin angefaßt wird: im `finally` ein Merkmal setzen und die Bilanzzeile im Abbruchfall als `— Lauf abgebrochen, Bilanz unvollständig` schreiben.
docs/bedrohungsmodell.md:10298                        niedrig „alle vierzehn Gegenproben beißen" für `proof:release-safety` — der Lauf hat sechzehn allein für `rueckweg` und 27 Verstoßeinträge insgesamt. Nicht von T-292 verursacht und nicht domain-devs Datei; gehört mit den drei Zahlen aus A-V-28 (T-290-1: vier/sieben/sechs gegen gemessene drei/acht/sieben) in einen Auftrag an den security-checker. Fix: beide Stellen an den gemessenen Stand ziehen, wenn er A-V-28 ohnehin nachzieht.
```

Keine Befunde zu: **Dateihoheit** (drei Dateien, alle domain-dev, Zeitfenster gemessen),
**Typsicherheit** (`.mjs` außerhalb des `typecheck`-Umfangs, kein `any`, keine Zusicherung),
**verschluckten Fehlern** (`catch` benennt und wirft weiter; `portMitglieder` meldet
Meßfehlschläge als Befund und nicht als leeren Fund; Syntaxfehler vor der Schnittstelle führen
zu `null` und damit zu Rot — gemessen, die Annahme 3 des Berichts trägt),
**doppelter Fachlogik** (`stripComments`/`mentionsGlobalFetch` weiterhin aus `fetch-scan.mjs`;
der Compiler wird jetzt wie in `caller-scan.mjs` und `proof-route-policy.mjs` benutzt, keine
zweite Fassung), **Sprache** (Prosa deutsch, Bezeichner englisch, keine Oberflächentexte),
**Transaktionsgrenzen** und **Fachlogik** (kein Produktivcode berührt).

---

## Antwort auf die zurückgegebene Frage

**Ja — „derselbe Verstoß zweimal, je ein `erwartet`" ist die richtige Form, und zwar als Regel,
nicht als Ausnahme.** Begründung aus der Messung, nicht aus dem Geschmack: `erwartet` kann immer
nur einen Zweig festnageln; M5/M6 und M7/M8 zeigen, daß zwei Einträge auf **derselben**
eingesetzten Zeile jeder genau ihren Zweig treffen und sich nicht gegenseitig tragen. Ein
erfundener zweiter Verstoß wäre schlechter, weil er eine Datei erfindet, die es so nie gäbe.

**Die Regel, damit der Folgeauftrag mechanisch wird:** Ein `CHECKS`-Eintrag bekommt so viele
Gegenproben, wie seine `run`-Funktion **unterscheidbare Befundsätze** kennt. Nicht so viele, wie
er eingesetzte Dateien braucht — mehrere Einträge dürfen dieselbe Datei einsetzen.

Am Quelltext abgezählt (`findings.push`-Zweige je Prüfung, gegen die heutigen Einträge):

| Prüfung | Zweige | heute gedeckt | fehlt | ohne `erwartet` |
|---|---|---|---|---|
| `adressen` | 5 | 2 | **3** (Abfrageadresse am falschen Ort, Release-Adresse am fremden Ort, `apiCount !== 1`) | 0 |
| `felder` | 4 | 1 | **3** (`.tag_name` als Objektfeld, Zugriff auf `tag_name`, `tagNameCount !== 1`) | 1 |
| `oeffnen` | 3 | 1 | **2** | 1 |
| `download` | 1 | 1 | 0 | 1 |
| `ausgang` | 3 | 1 | **2** (`fetch` in N Dateien, Routendatei kennt die Abholfunktion) | 4 |
| `optionen` | 3 | 2 | **1** (`${API_URL_FILE} fehlt` — die Untergrenze) | 0 |
| `rueckweg` | — | — | **2** (Befund 1 und 2 oben) | 0 |

Damit ist der Folgeauftrag vorher abzählbar: **+11 Einträge aus den sechs Prüfungen und +2 aus
`rueckweg`**, dazu `erwartet` an den **sieben** bestehenden Einträgen ohne eines (`felder`,
`oeffnen`, `download`, vier × `ausgang`). Erwartete Prüfzahl **51 → 64**, je Eintrag eine
Mutation, die genau ihn dreht. Die Zahl ist eine Vorhersage und im Auftrag zu **messen**, nicht
zu übernehmen: zwei Zweige könnten sich beim Einsetzen als nicht allein auslösbar erweisen
(`apiCount !== 1` hängt an derselben Datei wie „Abfrageadresse am falschen Ort", `tagNameCount`
genauso) — das ist dann wieder der Fall „zwei Einträge, eine Datei" und kein Grund, den Zweig
ungemessen zu lassen.

Domain-devs beide Beobachtungen bestätige ich am Quelltext: `checkAddresses` hat wirklich fünf
Zweige und drei davon keine Gegenprobe; `checkFetchOptions` hat mit `${API_URL_FILE} fehlt`
wirklich eine Untergrenze ohne Gegenprobe. Beides gehört in denselben Auftrag — und, weil er
diese Datei ohnehin aufmacht, Befund 1 und 2 gleich mit.

Das **teilweise** Leeren der Markenlisten (`FORBIDDEN_IN_SOURCE` auf `['.json()']` gekürzt, Risiko 4
des Berichts) ist die einzige Stelle, an der ich der obigen Regel widerspreche: Dort ist die Zahl
der Zweige nicht drei, sondern sieben (je Marke einer), so wie `ausgang` seine vier Schreibweisen
einzeln hat. Das wären +7 statt +1 und verdient eine eigene Entscheidung im Auftrag, keine
stillschweigende.

---

## Urteil

**Nacharbeit.** Blockierend ist
`apps/local-api/scripts/proof-release-safety.mjs:868` — das über `extends` geerbte `read`.

Die beauftragte Arbeit ist gut und in ihrer Hauptaussage nachgemessen: beide `hoch`-Befunde aus
T-291 sind zu, beide `mittel`-Befunde sind gemessen erledigt, die drei `niedrig`-Befunde
ebenfalls, elf Mutationen reproduzieren zeichengleich, und die ungewöhnlichste Zusage des
Berichts — Compiler und Untergrenze drin, acht neue Einträge raus, **43/0** mit 9/24/7/3 je
Abschnitt — hält Zeichen für Zeichen. Der Umstieg vom regulären Ausdruck auf den Compiler ist
richtig, er schließt die ganze Klasse der Schreibweisen (29 Formen gemessen, darunter
Zeichenkettenliteral-Namen, Indexsignaturen, Rufsignaturen, generische Ports, Syntaxfehler), und
er tut es in der sicheren Richtung: was der Leser nicht auflöst, ist rot.

Er schließt aber **eine Klasse nicht, die neben der Schreibweise liegt**: die Auflösung. Ein
`read`, das über `extends` hereinkommt — aus einer lokalen Basisschnittstelle oder aus einer der
sieben erlaubten Importquellen —, macht alle fünf Gestalten grün, obwohl der Port es kann und
die Datei daneben `port.read()` ruft. Das ist derselbe Satz, mit dem ich zweimal blockiert habe:
die Zusage in `docs/architektur.md` („`VersionCheckStorePort` hat deshalb kein `read`") ist
wieder weiter als die Messung. Der Unterschied zu den beiden Vorrunden ist, daß die Maschine
diesmal stimmt und der Fix drei Zeilen in `portMitglieder` sind, keine vierte Schreibweisenjagd:
`heritageClauses` vorhanden ⇒ `null` ⇒ Meßfehlschlag ⇒ rot, genau die Regel, die dieselbe
Funktion bei berechneten Namen und nicht aufgelösten Aliassen schon anwendet.

Mitzunehmen in denselben Auftrag, weil dieselbe Funktion und dieselbe Gegenprobenliste: die
Deklarationszusammenführung (:869), die Berichtigung des Untergrenzen-Satzes an drei Stellen
(:1103, :1318, `docs/architektur.md:1449`) und die elf Zweige aus der Antwort oben. Dann ist es
ein Auftrag und nicht drei.
