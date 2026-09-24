# T-296 — Die dritte Tür ist zu, und die Klasse ist zu Ende

Aufgabe: T-296 — fünfte Runde an `apps/local-api/scripts/proof-release-safety.mjs`
(code-reviewer T-295: Nacharbeit, blockierend `:899` — die Deklarationszusammenführung ist nur
für oberste Anweisungen **derselben** Datei zu; dazu `erwartet` als Pflicht (`:1992`), die
fehlende Hälfte der Zählvorschrift (`:1262`), die Begründung der Untergrenze an drei Stellen
(`:1176`, `:1577`, `docs/architektur.md:1459`) und der Satz in `docs/datenmodell.md:1039`)
Status: **fertig, braucht Review** — mit einer Einschränkung am Torlauf, die **nicht** aus
dieser Aufgabe stammt (siehe „Der Torlauf")

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/proof-release-safety.mjs` | **(1)** Zwei Zusagen über den **gelesenen Baum** vor dem Lesen der Deklaration: kein Erweiterungsblock (`declare module '<Zeichenkette>'`, `declare global`), und der Portname steht genau einmal. **(2)** Vier neue Gegenproben (w) bis (z), 44 → **48** Verstoßeinträge. **(3)** `erwartet` ist **Pflicht**: der Lauf hält ein fehlendes für „nicht getroffen", und Abschnitt 0 zählt alle 48 gegen. **(4)** Die beiden fehlenden Hälften der Zählvorschrift stehen im **Regelkörper** statt unter den Ausnahmen. **(5)** Die Begründung der Untergrenze an beiden Quelltextstellen auf das Gemessene zurückgeschnitten. 68 → **73** Prüfzeilen |
| `docs/architektur.md` | „zweiundzwanzig" → **sechsundzwanzig**; ein Absatz über die dritte Tür und die beiden Zusagen; ein Absatz, warum das Lesen der obersten Anweisungen wieder trägt (mit der `tsc`-Messung); die Untergrenze in zwei Absätzen berichtigt; die Zählvorschrift um ihre beiden Hälften und um 73 ergänzt, dazu der Hinweis auf `erwartetAlle` für E-107 |
| `docs/datenmodell.md` | „zweiundzwanzig" → **sechsundzwanzig**; der Satz bei vormals `:1039` nach dem Vorschlag des code-reviewers berichtigt (zwei übrige Meßfehlschläge + die Untergrenze, die nur als Nebenwirkung fiel) und um die vier aus T-296 ergänzt |

Kein Produktivcode, keine Migration, keine Prüfdatei, kein fremdes Papier.
`docs/bedrohungsmodell.md` ist **gelesen und nicht geändert** (security-checker).
Kein Eintrag für den Orchestrator nötig.

---

## 1. Der blockierende Befund — erst nachgestellt, dann geschlossen

**Gemessen, bevor gebaut wurde.** Die vier Gegenproben gingen zuerst allein in die Datei, ohne
jede Änderung am Leser:

```
abgeliefert, nur die vier Gegenproben          → 68/4
   FEHL  … eine zweite gelesene Datei deklariert denselben Portnamen   — Verstoß blieb unbemerkt
   FEHL  … eine zweite Datei erweitert den Port über `declare module`  — Verstoß blieb unbemerkt
   FEHL  … die Datei des Ports erweitert sich selbst (`declare module`)— Verstoß blieb unbemerkt
   FEHL  … die Datei des Ports öffnet den globalen Raum               — Verstoß blieb unbemerkt
```

„Blieb unbemerkt" heißt: **null** Befunde aus allen fünf Gestalten. Der Befund des
code-reviewers reproduziert zeichengleich.

**Und er ist am eigenen `tsc` nachgemessen**, mit einer Berichtigung, die ihn nicht schwächer
macht. In einem eigenen kleinen Projekt (`moduleResolution: bundler`,
`allowImportingTsExtensions`, `include: ["src"]`):

| Stand | `tsc` |
|---|---|
| ZZ-F, die Datei enthält **nur** den `declare module`-Block | `TS2436: Ambient module declaration cannot specify relative module name` |
| ZZ-F **plus eine Zeile `export {};`** | **Exit 0** — `port.read()` übersetzt |
| dieselbe Datei entfernt | `TS2339: Property 'read' does not exist on type 'VersionCheckStorePort'` |
| ZZ-D, derselbe Block **in** `version.ts` | **Exit 0** |

Die Datei braucht also eine Zeile `export {};`, damit sie ein Modul ist — **kein Import**, und
Gestalt 5 sieht sie deshalb weiterhin nicht. Die Gegenprobe (x) trägt seither genau diesen
Stand, damit sie einen Zustand einsetzt, der wirklich übersetzt.

**Der Fix ist wieder das Zugeben, nicht das Auflösen** — dieselbe Regel wie bei `extends`.
Zwei Aussagen über den gelesenen Baum, beide heute leer und deshalb gratis:

1. **Kein Erweiterungsblock.** Ein `declare module '<Zeichenkette>'` oder ein `declare global`,
   irgendwo in irgendeiner gelesenen TypeScript-Datei, ist ein **Meßfehlschlag** — nicht nur
   für diesen Port: Ein solcher Block gibt **jeder** Schnittstelle dieses Bestands Mitglieder,
   die in ihrer Deklaration nicht stehen.
2. **Der Portname steht genau einmal im Baum.** Zwei Module führt TypeScript nicht zusammen —
   aber dieser Leser mißt an **einer** festgenagelten Datei, und welche Deklaration der Prüfer
   einsetzt, entscheidet eine Importzeile, die er nicht liest.

**Warum ich die vom code-reviewer vorgeschlagene rekursive Sammlung über `forEachChild`
*nicht* gebaut habe — gemessen, nicht gemeint.** Eine zweite Deklaration **im Rumpf einer
Funktion** und eine **in einem `namespace` mit Bezeichner** werden von TypeScript **nicht**
zusammengeführt; beide Stände enden bei `TS2339`, also dort, wo der Bestand auch ohne sie
endet. Eine rekursive Sammlung hätte sie als „ist 2-mal deklariert — TypeScript führt das
zusammen" gemeldet und damit einen Satz behauptet, den der Compiler nicht trägt. Genau das ist
der Fehler, gegen den dieselbe Runde die Untergrenze berichtigt (zwei Befunde, ein Satz).

**Damit ist das Lesen der obersten Anweisungen wieder tragfähig, und das ist ein Argument und
keine Hoffnung:** Was mit der obersten Deklaration zusammengeführt wird, steht entweder
ebenfalls oben (Zweig „N-mal deklariert") oder in einem Erweiterungsblock (Zusage 1). Etwas
Drittes gibt es nicht. Die Klasse — „einer Schnittstelle ein Mitglied geben, das nicht in ihrer
Deklaration steht" — hat genau zwei Wege, `extends` und die Zusammenführung, und beide sind zu.

**Die Namensform bleibt ausdrücklich grün.** `declare namespace Office { … }` steht im Baum
(`apps/outlook-addin/src/office/office-js.d.ts`) und ist **kein** Befund: Ein Block mit einem
Bezeichner statt einer Zeichenkette erweitert kein Modul. Genau diese Unterscheidung ist der
Grund, warum hier der Compiler fragt und kein Textlauf — sie steht in
`ts.isStringLiteral(knoten.name)` gegen `NodeFlags.GlobalAugmentation` und in keinem regulären
Ausdruck. Was ein Leser ohne sie anrichtet, ist gemessen: **M5 = 59/14** (siehe unten).

## 2. Die drei weiteren Punkte

**(1) `erwartet` heißt nicht mehr „freiwillig" (`:1992`).** Der Satz ist berichtigt, und die
Angabe ist jetzt Pflicht in beide Richtungen: Der Lauf hält ein fehlendes `erwartet` für
**nicht getroffen** (statt „irgendein Befund reicht"), und Abschnitt 0 zählt über alle 48
Einträge gegen. Gemessen, warum das nötig war:

```
M6  R4 (Zweig „kennt kein `write` mehr" raus), heutiger Stand             → 72/1, nur (u)
M7  dasselbe ohne das `erwartet` an (u), mit dem Runner von T-294         → 72/0   ← die Lücke
M8  dasselbe ohne das `erwartet` an (u), heutiger Stand                   → 71/2
```

M7 ist der Beweis des code-reviewers in meiner Zählung (seine 67/1 gegen 68/0): Ohne die
Angabe trägt der eingesetzte Verstoß sich selbst über den Nachbarsatz, und die Gegenprobe
bezeugt eine Lücke, die sie nie erreicht hat. M8 zeigt die neue Richtung — ein fehlendes
`erwartet` ist **zweimal** rot, an der Zeile selbst und in Abschnitt 0.

**(2) Die Zählvorschrift hat ihre Hälften zurück (`:1262` → `:1243`).** Im Regelkörper stehen
jetzt beide Sätze, die vorher unter „Drei Stellen, an denen sie nicht mechanisch durchläuft"
als Erlaubnis zu lesen waren:

- *Ein Zweig, dessen Befundsatz sich nicht von dem eines anderen unterscheiden läßt, ist kein
  gezählter Zweig, sondern ein zu trennender Satz* — mit der Messung daneben (R3: 65/3 und
  64/4), die zeigt, daß der Wortlaut von T-294 die Lücke gesegnet hätte.
- *Jede Gegenprobe trägt ein `erwartet`, und ein Befundsatz gilt als gedeckt genau dann, wenn
  mindestens ein `erwartet` ihn nennt* — nicht, wenn irgendeine Zeile bei ihm rot wird.

Dazu der Satz, der **mehr** Einträge als Sätze erlaubt und nicht gratis macht: Es braucht den
Grund, daß eine **plausible schwächere Umsetzung** sie trennen würde. Die Ausnahmenliste
verweist nur noch zurück.

**(3) Die Untergrenze der Gestalt 2, an allen drei Stellen kleiner geschrieben.** Was jetzt
dasteht, ist genau das Gemessene und nichts Größeres: Sie ist gegen **keinen** Leser der
Unterschied zwischen grün und rot, auch gegen keinen künftigen — eine leere Mitgliederliste ist
ohne sie ebenso rot, nur mit dem Satz „kennt kein `write` mehr". Was sie leistet, ist, daß ein
**blinder** Leser nicht den Satz bekommt, der seit T-294 dem Zweig (u) gehört. Berichtigt bei
`pruefeGestaltDesPorts`, bei der Gegenprobe (o) und in `docs/architektur.md`.

**(4) Die 68 des code-reviewers.** Bestätigt und nicht noch einmal geprüft, wie beauftragt.

## 3. Warum vier Gegenproben und nicht drei

Zwei neue Befundsätze, vier Einträge. Die drei Erweiterungsblöcke teilen sich ihren Satz und
ihr `erwartet` — wie die vier Schreibweisen von `fetch` (T-143 S-1) —, und der Grund ist nach
dem geschärften Kriterium aus T-295 gemessen: **jede plausible schwächere Umsetzung dieses
Wächters trennt sie, und zwar jede anders.**

| Mutation | Bilanz | rot wurde |
|---|---|---|
| M1 Zusage 1 (Erweiterungsblock) ganz aus | **70/3** | (x), (y), (z) — und nur sie |
| M2 Zusage 2 (zweiter Portname) aus | 72/1 | nur (w) |
| M3 Erweiterungsblock nur in `version.ts` gesucht | 72/1 | nur (x) — die Datei daneben |
| M4 Textlauf `declare module` statt Compiler | 72/1 | nur (z) — `declare global` |
| M5 ohne Unterscheidung: jede Namensform ist rot | **59/14** | Abschnitt 2 **am echten Baum** plus dreizehn Gegenproben |
| M6 R4 („kennt kein `write` mehr" raus) | 72/1 | nur (u) |

M5 ist die interessanteste Zeile: Ein Wächter, der `declare namespace Office` mitzählt, ist am
echten Baum rot — und weil der Meßfehlschlag **vor** dem Lesen zurückkehrt, nimmt er dreizehn
Gegenproben mit, die nichts dafür können. Ein falscher Positivbefund kostet hier nicht eine
Zeile, sondern vierzehn.

## 4. Die Zahl: 68 → **73**, von unten vorgerechnet

| Abschnitt | Zählregel im Code | gerechnet | gemessen |
|---|---|---|---|
| 0 | 6 × `stripComments` + **1 × `erwartet`-Pflicht (neu)** + 3 feste | 10 | **10** |
| 1 | je Verstoßeintrag eine Zeile + 5 Nicht-Ausgänge | 48 + 5 = 53 | **53** |
| 2 | je `CHECKS`-Eintrag eine Zeile | 7 | **7** |
| 3 | feste `check(`-Aufrufe | 3 | **3** |
| **Summe** | | **73** | **73** |

Die 48 Verstoßeinträge je Prüfung, am Lauf abgezählt (`grep '" wird rot'`): `adressen` **5**,
`felder` **4**, `oeffnen` **3**, `download` **1**, `ausgang` **6**, `optionen` **3**,
`rueckweg` **26**. Abschnitt 0 druckt die Gegenzählung selbst: „48 Einträge, 48 mit
`erwartet`". Abschnitt 2 bewegt sich wieder nicht.

Die **+5** gegen die 68 sind: vier Gegenproben (zwei Sätze, vier Einträge mit Begründung) und
die eine Zeile in Abschnitt 0. Die vom code-reviewer vorhergesagten 71 waren 68 + 3; die
Abweichung ist die vierte Gegenprobe (ZZ-D, die er selbst gebaut hat) und die Zeile, die seine
zweite Forderung — `erwartet` als Pflicht — überhaupt mißt.

## Annahmen

1. **Keine rekursive Sammlung in `portMitglieder`.** Abweichung vom Fixvorschlag des
   code-reviewers, mit `tsc` begründet (Punkt 1): Eine Deklaration in einem Funktionsrumpf oder
   in einem `namespace` mit Bezeichner wird nicht zusammengeführt, und sie als „2-mal
   deklariert" zu melden wäre ein falscher Satz. Die beiden Zusagen treffen alles, was wirklich
   zusammengeführt wird, und nichts sonst.
2. **Der Vorfilter ist vollständig, nicht geraten.** Jeder `ModuleDeclaration`-Knoten wird als
   `module X`, `namespace X` oder `global` geschrieben; der Vorfilter
   `/\b(declare|module|namespace|global)\b/` kann deshalb nur zu viel auswählen, nie zu wenig,
   und entscheiden tut der Compiler. Von rund 320 TypeScript-Dateien bleiben heute **sieben**
   übrig — deshalb kostet die Zusage nichts (Lauf weiterhin unter einer Sekunde).
3. **`declare global` steht mit im Satz, obwohl es den heutigen Port nicht erreichen kann** (er
   liegt in einem Modul). Gemessen wird die **Fläche**, nicht der eine Port; die Zeile ist
   heute leer und morgen die billigste Tür des Bestands.
4. **Der Meßfehlschlag kehrt vor dem Lesen zurück**, wie bei der nicht gelesenen Datei darüber.
   Der Preis steht in M5 und ist bewußt: Erst die Frage, ob gemessen werden kann, dann die
   Messung.
5. **Die Meßkopie lag in eigener Hoheit** (`apps/local-api/scripts/messung-t296.mjs`), je für
   die Dauer eines Befehls, im selben Befehl entfernt; `git status` danach unverändert.
   Dieselbe Annahme wie in T-288, T-290, T-292 und T-294. Die `tsc`-Messungen liefen
   ausschließlich im Kratzverzeichnis und haben den Baum nie berührt.

## Risiken

1. **Der Compiler sieht weiterhin die Schreibweise, nicht den Sinn.** `write(at: Date):
   Promise<string | null>` bleibt grün; Gestalt 2 mißt Namen und Zahl der Mitglieder, nicht
   Rückgabetypen. Unverändert seit T-292.
2. **Die Auflösung ist zu, das Verhalten nicht.** Eine neue **optionale** Option an
   `createVersionChecker` bliebe ungesetzt und grün (T-289, 38.4) — dagegen hilft nur ein
   Prüffall am Verhalten.
3. **Teilweises Leeren der Markenlisten bleibt ungemessen** (E-107). Nach Auftrag **nicht** in
   dieser Runde; der Baustein dafür (`erwartet` als Pflicht und als Zählgrundlage) steht jetzt.
4. **Der `declare`-Weg ist größer als dieser Lauf.** Ein Erweiterungsblock erweitert **jede**
   Schnittstelle dieses Bestands, nicht nur `VersionCheckStorePort`. Gemessen wird er heute nur
   über `proof:release-safety` und nur, weil dieser Lauf zufällig den ganzen Baum liest. Das
   gehört an den security-checker (siehe Offene Fragen).
5. **Kein Sicherheitsrisiko hinzugefügt.** Kein Produktivpfad, kein Netzweg, keine Route
   berührt.

## Offene Fragen an den Orchestrator

- **Der Torlauf ist rot, und nicht durch diese Aufgabe** (Einzelheiten unten).
  `proof:codepoints` — die **erste** Stufe von `proof:all` — beanstandet rohe Richtungs- und
  Leerzeichen in Dateien **fremder Hoheit**, die während dieser Aufgabe geschrieben wurden. Die
  Zahl wächst, während ich messe: beim vollständigen `pnpm check` (15:30) waren es **vier**, bei
  der letzten Kontrolle (15:36) **fünf**.

  | Fundstelle | Zeichen | Hoheit | Stand |
  |---|---|---|---|
  | `.claude/team/reports/T-298-ux-designer.md:84` (zweimal) | `U+202E` | ux-designer | unversioniert, 15:26 geschrieben |
  | `docs/design/addin-anhangsuebernahme-fluss.md:642–643` | `U+202E` | ux-designer | unversioniert, 15:25 geschrieben |
  | `docs/bedrohungsmodell.md:11763` | `U+200B` | security-checker | 15:35 geschrieben |

  Alle drei Dateien sind von mir gelesen und **nicht** geändert. Solange sie so im Baum liegen,
  kommt `pnpm check` für **jeden** Agenten dieser Welle nicht bis `proof:release-safety` — der
  Wächter steht vor allem anderen. Der Fall gehört in einen eigenen Auftrag und ist inhaltlich
  leicht zu erklären: Beide Papiere **beschreiben** gerade den Angriff mit diesen Zeichen; sie
  brauchen die Schreibweise `<U+202E>` statt des rohen Zeichens (oder einen Eintrag in der
  Ausnahmeliste des Laufs, die heute leer ist).
- **`docs/bedrohungsmodell.md` — zwei Stellen, beide an den security-checker, beide gelesen und
  nicht geändert:**
  - `:10298` nennt „alle **vierzehn** Gegenproben" für `proof:release-safety`. Gemessen sind
    heute **48** Verstoßeinträge und **73** Prüfzeilen. Offen seit T-293.
  - A-V-28 (38.7) nennt „vier Dateien, sieben Importzeilen, sechs Quellen"; gemessen sind
    **drei / acht / sieben**. Offen seit T-290 (T-290-1).
  - **Neu und über diesen Lauf hinaus:** Ein `declare module '<Zeichenkette>'` oder
    `declare global` erweitert **jede** Schnittstelle des Bestands — Ports, Antworttypen,
    Zugriffsentscheidungen. Heute kommt beides **nullmal** vor, und der einzige Wächter darüber
    ist eine Nebenwirkung von `proof:release-safety`. Ob das eine eigene Zusage im
    Bedrohungsmodell braucht, ist die Frage des security-checkers, nicht meine.
- **E-107 braucht `erwartetAlle`**, wie vom code-reviewer gemessen: `erwartet` ist **ein**
  Ausdruck gegen `findings.some(…)` und kann nie vierzehn Befunde verlangen; die Muster müssen
  **aus der Listenkonstante abgeleitet** und nicht abgeschrieben werden (E-099 Punkt 3). Vier
  Listen, nicht zwei. Eigener Auftrag; der Baustein steht.
- **`proof:all` fährt inzwischen einundzwanzig Läufe, `CLAUDE.md` sagt neunzehn** (und
  `proof:db-permissions` meldet unter Windows „übersprungen"). Gemeinsame Datei, nicht meine —
  nur gemeldet.
- **Die Prüfzahl steht heute bei 73** (vorher 68). Gesucht über `git grep` **und** über
  `apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test`, `docs/testplan.md`: keine Fundstelle
  außerhalb von `board.md`, `decisions.md`, `docs/bedrohungsmodell.md` (siehe oben) und den
  Berichten trägt die alte Zahl.

## Der Torlauf

`pnpm check` **einmal vollständig gefahren, Exit 1** — und die rote Stufe ist `proof:codepoints`
mit vier (inzwischen fünf) rohen Richtungs- und Leerzeichen aus **fremden** Dateien, die
während dieser Aufgabe geschrieben wurden (siehe Offene Fragen). Weil `proof:codepoints` die
erste Stufe von `proof:all` ist, blieben alle Läufe dahinter ungefahren.

Damit der abgelieferte Stand trotzdem gemessen ist, sind die **übrigen Stufen einzeln und in
derselben Reihenfolge** gefahren, Exit 0:

| Stufe | Ergebnis |
|---|---|
| `typecheck` | grün (in `pnpm check` gelaufen) |
| `boundaries` | grün (in `pnpm check` gelaufen) |
| `contrast` | grün, 11 von 11 Gegenproben (in `pnpm check` gelaufen) |
| `proof:codepoints` | **45/1 — vier, inzwischen fünf Fundstellen in drei fremden Dateien** |
| `proof:all` ohne `codepoints` | 20 Läufe, 0 rot; darin `release-safety` **73/0** (vorher 68/0), `openapi` 115/0, `callers` 74/0, `conflicts` 154/0, `tags` 45/0, `access` 109/0, `export` 98/0, `export-api` 72/0, `taskpane` 29/0, `foreign` 21/0, `surface` 27/0, `locked` 9/0, `addin-wiring` 32/0, `layers` 36/0, `route-policy` 44/0, `shell-surface` 7 Prüfungen und 54 Gegenproben, `template-fields` 30/0, `addin` 248/0, `migrations` aktuell (44 Dateien), `db-permissions` übersprungen (Windows) |
| `verify:bundle` | 19/0 |
| `test:coverage` | 90 Dateien, **1696 bestanden**, 3 übersprungen, 0 rot |
| `test:rust` | ok, 68 bestanden, 0 fehlgeschlagen, 1 übersprungen |
| `build` | grün |
| `audit` | „No known vulnerabilities found" |

Kein Prüflauf außer `release-safety` hat sich bewegt — erwartet, weil kein Produktivcode und
keine Prüfdatei angefaßt wurde.

## Nächster Schritt

1. Freigabe durch code-reviewer und security-checker.
2. **Die rohen `U+202E` und `U+200B`** in den drei Dateien des ux-designers und des
   security-checkers in einen Auftrag an die beiden — ohne ihn ist `pnpm check` für **jeden**
   Agenten dieser Welle rot, und zwar an der ersten Stufe.
3. E-107 als eigener Auftrag: `erwartetAlle`, aus der Listenkonstante abgeleitet, vier Listen.
4. Der Auftrag an den security-checker: die beiden alten Zahlen im Bedrohungsmodell und die
   neue Frage, ob ein Erweiterungsblock eine eigene Zusage braucht.
