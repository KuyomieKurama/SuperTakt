# T-295 — Review von T-294 (`proof-release-safety.mjs`, vierte Runde)

Aufgabe: T-295 — Prüfung der Nacharbeit T-294 (domain-dev) auf den blockierenden Befund aus
T-293 (`:868` `extends`), die Deklarationszusammenführung, die Berichtigung des
Untergrenzen-Satzes an drei Stellen und die Anwendung der Zählvorschrift
Status: **Nacharbeit**

Geprüfter Umfang: `apps/local-api/scripts/proof-release-safety.mjs` (Diff gegen `HEAD`:
+1314/−84 zusammen mit den beiden Papieren), `docs/architektur.md` (1425–1490),
`docs/datenmodell.md` (1022–1041), dazu `E-107`.

## Zustand des Baums, gemessen statt angenommen

`git status` zu Beginn **41** Pfade (22 geändert, 19 unversioniert), am Ende zeichengleich
**41**. Alle Messungen liefen auf Kopien im Kratzverzeichnis (`…/scratchpad/t295/`), über
absolute `file://`-Bezüge auf `typescript`, `source-resolve.mjs` und `fetch-scan.mjs` lauffähig
gemacht; sie lesen denselben echten Baum. Änderungszeiten im Fenster T-294:
`proof-release-safety.mjs` 13:59:04, `docs/architektur.md` 14:05:15, `docs/datenmodell.md`
14:05:29. `docs/bedrohungsmodell.md` (12:34), `docs/testplan.md` (10:48), `docs/spec.md` (11:47),
`packages/domain/src/version.ts` (11:42), `apps/local-api/test/version/checker.test.ts` (11:53)
liegen davor — **kein Übergriff**, alle drei berührten Dateien gehören domain-dev,
`decisions.md` (14:12) ist der Orchestrator. `messung-t294.mjs` liegt nicht mehr im Baum.

Selbst gefahren: `proof:release-safety` am echten Baum (**68/0**, 0,78 s), `pnpm proof:all`
(**19 Läufe, alle 0 fehlgeschlagen**, jede Zahl zeichengleich zur Tabelle des Berichts), dazu
**siebzehn** eigene Meßläufe auf Kopien (R1, R3 in zwei Bauarten, R4 in zwei Bauarten, A3, X1,
M2, sieben Gegenproben ZZ-A bis ZZ-G, acht Listenkürzungen) und **zwei** eigenständige
`tsc`-Läufe gegen nachgebaute Quelldateien.

---

## 1. Der blockierende Befund — zu, und beide Bauarten sind rot

Beide meiner T-293-Bauarten am ganzen Lauf nachgestellt, dazu vier Gestalten, die der Bericht
nicht gefahren hat:

| Gegenprobe | heute |
|---|---|
| ZZ-A `interface X extends Beide {}` — **leerer Rumpf**, alles geerbt | **rot** ✔ |
| ZZ-B Basis ist selbst ein **Alias** (`type Lese = { read… }`) | **rot** ✔ |
| ZZ-C Basis aus `@takt/domain` (erlaubte Quelle) **plus** `port.read()` daneben | **rot** ✔ |
| ZZ-G Port ist **kein `interface`** mehr, sondern eine abstrakte Klasse | **rot** ✔ (Satz „steht nicht (mehr) als Schnittstelle oder Typliteral darin") |
| R1 die `extends`-Regel zurückgebaut | **67/1**, genau (q) |
| R4 Zweig „kennt kein `write` mehr" raus | **67/1**, genau (u) |
| A3 Zählung `apiCount !== 1` raus | **67/1**, genau die neue Untergrenze |
| X1 Zweig „nennt `fetch` außerhalb" raus | **64/4** — die vier Schreibweisen, wie berichtet |

Der Fix trägt, und er trägt weiter als beauftragt: Er ist gegen die **Auflösung** gesetzt und
nicht gegen eine Schreibweise, deshalb fällt der leere Rumpf ebenso wie die Alias-Basis. Die
Richtung stimmt auch bei ZZ-G — was der Leser nicht benennen kann, ist rot.

**Was der Leser nach dieser Regel nicht sieht — gemessen, nicht vermutet.** Es gibt in
TypeScript genau zwei Wege, einer Schnittstelle ein Mitglied zu geben, das nicht in ihrer
Deklaration steht: `extends` und die **Deklarationszusammenführung**. `extends` ist zu. Die
Zusammenführung ist zu, **solange beide Deklarationen oberste Anweisungen derselben Datei
sind** — `datei.statements.filter` (`:899`) sieht nichts anderes. Drei gebaute Stände, alle
68/0 grün:

| Stand | Lauf | `tsc` |
|---|---|---|
| ZZ-D `declare module './version.ts' { interface … { read… } }` **in** `version.ts`, Deklaration oben unberührt | grün | **Exit 0** |
| ZZ-E dasselbe als `declare global { … }` | grün | — |
| ZZ-F **eine zweite Datei** `features/version/erweiterung.ts` mit der Erweiterung, sonst nichts | grün | **Exit 0** |

ZZ-F ist mit `tsc` einzeln nachgewiesen und der Nachweis hat seine Gegenprobe: Mit der
Erweiterungsdatei kompiliert `port.read()`; ohne sie sagt derselbe Lauf
`TS2339: Property 'read' does not exist on type 'VersionCheckStorePort'`. Die Datei braucht
**keinen Import** — `apps/local-api/tsconfig.json` hat `"include": ["src"]`, sie liegt damit im
Programm. Gestalt 5 fängt sie nicht: `declare module '…'` ist keine Importanweisung,
`importQuellen` findet nichts, und die sieben erlaubten Quellen kommen aus den Nachbardateien
weiterhin alle vor.

## 2. Der Rückgabewert mit Grund — die Begründung trägt, R3 stimmt

Zweimal gemessen, weil die Bauart der Mutation das Ergebnis bestimmt:

```
R3 wie im Bericht (Kollaps auf den T-292-Satz)   → 65/3   rot: (q),(r),(s)   grün: (t)
R3 mit einem NEUTRALEN Satz für alle vier        → 64/4   rot: (q),(r),(s),(t)
```

Die Zahl des Berichts reproduziert zeichengleich, und meine Bauart ist die schärfere:
Kollabiert man auf einen der vier vorhandenen Sätze, bleibt dessen eigene Gegenprobe grün — sie
mißt dann einen Zustand, der zufällig noch stimmt. Die Vorschrift hat hier **drei bis vier**
Gegenproben gerettet, und das ist nachgemessen. Ja, das gehört in die Regel; wie, steht in
Punkt 4.

## 3. Die Zahl 68 — von unten nachgerechnet, sie stimmt

| Abschnitt | gerechnet | selbst gemessen |
|---|---|---|
| 0 | 6 × `stripComments` + 3 | **9** |
| 1 | 44 Verstoßeinträge + 5 Nicht-Ausgänge | **49** |
| 2 | je `CHECKS`-Eintrag eine Zeile | **7** |
| 3 | feste `check(`-Aufrufe | **3** |
| **Summe** | | **68** |

Die 44 je Prüfung selbst abgezählt: `adressen` **5**, `felder` **4**, `oeffnen` **3**,
`download` **1**, `ausgang` **6**, `optionen` **3**, `rueckweg` **22**. Alle 44 tragen ein
`erwartet` (5/4/3/1/6/3/22 — keines fehlt). Die elf in den sechs Prüfungen stimmen
zeichengleich mit meiner Vorhersage: +3 `adressen`, +3 `felder`, +2 `oeffnen`, +2 `ausgang`,
+1 `optionen`.

**Die vier Zusätze folgen aus der Vorschrift; sie gehen nicht über sie hinaus. Die 64 war mein
Rechenfehler, nicht eine Lücke der Regel.** `checkNoStoreReadback` samt
`pruefeGestaltDesPorts` kennt **siebzehn** unterscheidbare Befundsätze: Gestalt 1 einen,
Gestalt 3 drei, Gestalt 4 einen, Gestalt 5 drei (ordnerintern / fremd / Quelle fehlt), der
weggenommene Ordner einen und Gestalt 2 **acht** (Datei nicht im Baum, vier Meßfehlschläge,
Untergrenze, „kennt außer `write`", „kennt kein `write`"). Vor T-294 standen 16 Einträge, von
denen sechs **denselben** Satz aus sechs Richtungen messen — gedeckt waren also 11 Sätze.
17 − 11 = **6**. Ich hatte in T-293 in der Spalte „Zweige" für `rueckweg` ein „—" stehen und
nur meine beiden Befunde gezählt, während ich für die sechs anderen Prüfungen die
`findings.push`-Zweige abgezählt habe. Ich habe meine eigene Vorschrift auf die eine Prüfung
nicht angewandt, die ich gerade aufgemacht hatte.

Gegengezählt, daß die siebzehn heute **einzeln** benannt sind: 22 `erwartet`, davon sechs auf
`/VersionCheckStorePort kennt außer/` — bleiben 17 verschiedene Ziele, und jeder der siebzehn
Sätze hat genau eines. Die Vorschrift ist auf `rueckweg` vollständig durchgezogen.

(u) ist zu Recht der bemerkenswerteste: Er ist der achte Satz der Gestalt 2 und die Hälfte des
Prüfsatzes, um die es in T-279 überhaupt ging. R4 dreht ihn allein — **aber nur wegen seines
`erwartet`**, siehe Befund 2.

## 4. Trägt die Vorschrift? Die beiden Punkte, die meine Fläche sind

**(b) — kein Fehler der Vorschrift, sondern ihr eigentlicher Nutzen. Aber erst nach einer
Umformulierung, und die fehlt.** Wie sie bei `:1243` steht — „so viele Gegenproben, wie seine
`run`-Funktion unterscheidbare Befundsätze kennt" —, hätte sie auf den Stand von T-292
angewandt für vier Zweige hinter einem Satz genau **eine** Gegenprobe verlangt. Sie hätte die
Lücke nicht geschlossen, sondern **gesegnet**; gemessen ist die Lücke drei bis vier Gegenproben
wert (R3). Der Satz, der das dreht, steht heute unter der Überschrift „Drei Stellen, an denen
sie **nicht** mechanisch durchläuft" (`:1253`, Punkt 2 bei `:1262`) — also unter den Ausnahmen,
und ein nächster Leser liest dort eine Erlaubnis, es zu lassen. Er gehört in den Regelkörper:
**Ein Zweig, dessen Befundsatz sich nicht von dem eines anderen Zweigs unterscheiden läßt, ist
kein gezählter Zweig, sondern ein zu trennender Satz.** Mit diesem Halbsatz greift die
Vorschrift in den Leser hinein, und das ist genau die Eigenschaft, die T-294 nachgewiesen hat.

**(c) — als Beobachtung richtig, als Regel halb formuliert, und die fehlende Hälfte ist
gemessen.** „Wer nach Sätzen zählt, muß die `erwartet` gegenzählen und nicht die roten Zeilen"
(`:1269`) ist die richtige **Zählanweisung** und schließt die Lücke trotzdem nicht, weil
`erwartet` bei `:1992` ausdrücklich „**freiwillig**" heißt. Gemessen:

```
R4 (Zweig „kennt kein `write` mehr" raus)                        → 67/1
dieselbe Mutation, aber ohne das `erwartet` an (u)               → 68/0
```

Ohne das `erwartet` trägt der eingesetzte Verstoß sich selbst („kennt außer `write` noch read")
und die Gegenprobe bezeugt eine Lücke, die sie nie erreicht hat — T-143 S-1 wörtlich, eine
Etage höher. Die Regel mit Zähnen: **jede Gegenprobe trägt ein `erwartet`; ein Befundsatz gilt
als gedeckt genau dann, wenn mindestens ein `erwartet` ihn nennt** — und Abschnitt 0 mißt, daß
keine Gegenprobe ohne eines dasteht. Heute haben alle 44 eines; die Regel kostet also nichts
außer dem Durchsetzen.

## 5. E-107: zwei Gegenproben reichen nicht — vier, und die Zahl ist nicht der Punkt

Zuerst die Größe der Lücke, gemessen an acht Kürzungen:

| Kürzung | Lauf |
|---|---|
| `DOWNLOAD_MARKERS` ohne `downloadAndInstall` | 67/1 |
| `DOWNLOAD_MARKERS` ohne `tauri-plugin-updater` | **68/0** |
| `TRANSPORT_MARKERS` ohne `ProxyAgent` | **68/0** |
| `REQUIRED_IN_SOURCE` ohne `redirect: 'error'` | 67/1 |
| `REQUIRED_IN_SOURCE` ohne `AbortSignal.timeout` | **68/0** |
| `REQUIRED_IN_SOURCE` auf ein Element gekürzt | **68/0** |
| `FORBIDDEN_IN_SOURCE` ohne `.json()` | 67/1 |
| `FORBIDDEN_IN_SOURCE` ohne `content-length` / auf `['.json()']` gekürzt | **68/0** |

Festgenagelt ist heute je Liste **genau eine** Marke, und zwar zufällig: die, die im `erwartet`
des vorhandenen Eintrags namentlich steht. **18 der 21 Marken sind ungemessen.**

**Vier Listen, nicht zwei.** `download` hält `DOWNLOAD_MARKERS` (8, A-18.9) und
`TRANSPORT_MARKERS` (6, A-V-4) — ein Satzmuster, aber **zwei Anforderungen**; wenn eine rote
Zeile kommt, soll dranstehen, welche ihre Marke verloren hat. `optionen` hält
`REQUIRED_IN_SOURCE` (3) und `FORBIDDEN_IN_SOURCE` (4) mit **entgegengesetzter Polarität** und
zwei Satzmustern: einmal ist die **Abwesenheit** der Marke im Quelltext rot, einmal ihre
**Anwesenheit**. Eine Gegenprobe kann nur eine Richtung realistisch einsetzen.

**Der Punkt ist aber die Mechanik, und die muß zuerst geändert werden.** `erwartet` ist ein
einzelner Ausdruck gegen `findings.some(…)`. Ein Eintrag kann damit **nie** vierzehn Befunde
verlangen — eine Gegenprobe „ein Verstoß, der alle vierzehn Marken nennt" wäre mit dem
heutigen Werkzeug wieder nur „irgendeine Marke hat gefeuert", also genau der Stand von heute.
Gebraucht wird `erwartetAlle` (jedes Muster muß von **irgendeinem** Befund getroffen werden),
und die Muster müssen **aus der Listenkonstante abgeleitet** und nicht abgeschrieben werden —
sonst ist die nächste dazugeschriebene Marke wieder ungemessen und die Gegenprobe nagelt eine
handgeschriebene Menge fest statt der Anforderung (E-099 Punkt 3, wörtlich derselbe Fehler wie
`proof:addin` Abschnitt 18).

Damit kostet E-107 **+1 Eintrag, nicht +2**: `optionen` braucht **keinen neuen** — die beiden
vorhandenen Einträge werden aufgerüstet (der eine läßt ohnehin schon alle drei Zusagen aus, der
andere nennt künftig alle vier verbotenen Abkürzungen statt nur `.json()`). `download` braucht
**einen** neuen, weil die beiden Listen zwei Anforderungen tragen. **68 → 69.**

## 6. „Der Lauf mißt zu drei Vierteln sich selbst" — richtiger Zustand, und die Grenze liegt woanders

Gemessen, bevor ich urteile: **0,78 s** für den ganzen Lauf; **984 Codezeilen gegen 1 037
Prosazeilen**; der `COUNTER_PROOFS`-Block **599 Zeilen**. Laufzeit ist nicht der Preis, Lesen
ist es.

**Der Zustand ist richtig, und keine Grenze ist überschritten.** Die vier Niederlagen dieses
Wächters (T-289, T-291 zweimal, T-293) hat jedesmal ein Mensch gefunden, der einen Verstoß
gebaut hat — **nie** Abschnitt 2. Die sieben Zeilen in Abschnitt 2 bedeuten überhaupt nur
etwas, weil 49 Zeilen daneben sagen, was sie bewegen würde. Wer hier kürzt, kürzt den einzigen
Teil mit nachgewiesener Trefferbilanz.

**Ich striche nichts.** Aber E-107 braucht in seinem Kriterium eine zweite Hälfte, sonst
schneidet es ins Falsche: „nicht an jedes Element einer Menge, die gemeinsam ausfällt" trifft
nach dem Wortlaut auch die drei zusätzlichen `ausgang`-Schreibweisen (X1 = **64/4**, sie fallen
tatsächlich gemeinsam) und die fünf zusätzlichen `rueckweg`-Schreibweisen. Beides wäre ein
Fehler. Das unterscheidende Merkmal ist nicht, ob sie **heute** gemeinsam fallen, sondern ob
eine **plausible andere Umsetzung** sie trennen würde: Eine Markenliste — nein, jede Umsetzung
läuft über die Liste. Vier Schreibweisen von `fetch` — ja, und T-143 hat es gegen den alten
Ausdruck gemessen. Fünf Schreibweisen von `read` — ja, T-293 M1 und M12 haben je drei davon
gedreht. Nach diesem geschärften Kriterium ist heute **kein** Eintrag Ballast, und der erste,
der es wäre, ist eine fünfzehnte Download-Marke mit eigener Gegenprobe — also genau das, was
E-107 verbietet. Regel und Bestand stimmen überein; nur der Wortlaut braucht den zweiten Satz.

## 7. Die Berichtigung — an allen drei Stellen ersetzt, aber noch nicht ganz wahr

Alle drei Stellen sind da und sagen dasselbe: `:1157–1178` bei `pruefeGestaltDesPorts`,
`:1572–1579` bei der Gegenprobe (o), `docs/architektur.md:1452–1461`. Der falsche Satz
(„allen drei Ausfällen gemeinsam") steht nirgends mehr, und die Berichtigung nennt den
richtigen gemeinsamen Nenner. Das ist die Hauptsache und sie ist erledigt.

Die **Begründung, warum die Untergrenze bleibt**, ist trotzdem noch eine Spur zu großzügig —
siehe Befund 4. Gemessen (M2, Untergrenze abgeschaltet): Eine leere Mitgliederliste ist auch
ohne sie rot, mit dem Satz „kennt kein `write` mehr". Die Untergrenze ist **nie** der
Unterschied zwischen grün und rot, gegen keinen Leser, auch keinen künftigen. Was sie wirklich
leistet, ist schärfer als das, was dasteht, und seit T-294 sogar schärfer als vorher: Ohne sie
würde ein **blinder Leser** als „der Port hat sein `write` verloren" gemeldet — also mit genau
dem Satz, den (u) seit T-294 als eigenen Zweig besitzt. Sie verhindert, daß zwei verschiedene
Befunde denselben Satz bekommen. Das ist dieselbe Regel wie in Punkt 4(b), auf sie selbst
angewandt.

---

## Befunde

```
apps/local-api/scripts/proof-release-safety.mjs:899   hoch    Die Deklarationszusammenführung ist nur für OBERSTE Anweisungen DERSELBEN Datei zu. `datei.statements.filter` sieht keine verschachtelte Deklaration und keine zweite Datei. Drei gebaute Stände, alle **68/0 grün**, während `port.read()` kompiliert: ZZ-D `declare module './version.ts' { interface VersionCheckStorePort { read… } }` innerhalb von `version.ts` bei unveränderter Deklaration darüber; ZZ-E dasselbe als `declare global`; ZZ-F eine zweite Datei `features/version/erweiterung.ts`, die nur die Erweiterung enthält. ZZ-F und ZZ-D sind mit `tsc` einzeln nachgewiesen (Exit 0), ZZ-F mit Gegenprobe: ohne die Erweiterungsdatei meldet derselbe Lauf `TS2339: Property 'read' does not exist`. Die Datei braucht KEINEN Import — `apps/local-api/tsconfig.json` hat `"include": ["src"]` —, und Gestalt 5 fängt sie nicht, weil `declare module` keine Importanweisung ist. Damit ist `docs/architektur.md:1471` („der Leser folgt der Basis nicht und **führt nichts zusammen**, er sagt, daß er nichts mehr weiß") und `:885` wörtlich dieselbe zu weit geschriebene Zusage, wegen der ich dreimal blockiert habe. Das ist KEINE neue Schreibweisenjagd: Es gibt in TypeScript genau zwei Wege, einer Schnittstelle ein fremdes Mitglied zu geben — `extends` (zu) und die Zusammenführung (halb zu) —, die Klasse ist endlich und mit diesem Auftrag beendet. Fix, dreiteilig und billig, weil der Bestand heute leer ist (`VersionCheckStorePort` steht in GENAU EINER gelesenen Datei, `declare module`/`declare global` kommt im ganzen gelesenen Baum NULLMAL vor): (1) in `portMitglieder` die Deklarationen rekursiv über `forEachChild` einsammeln statt über `datei.statements` — dann fällt die verschachtelte Deklaration in den vorhandenen Zweig „ist N-mal deklariert"; (2) in `pruefeGestaltDesPorts` vor dem Lesen den ganzen Baum prüfen: jede ANDERE gelesene Datei, die `VersionCheckStorePort` als `interface` oder `type` deklariert, ist ein Meßfehlschlag mit eigenem Satz; (3) ebenso: irgendein `declare module` oder `declare global` im gelesenen Baum ist ein Meßfehlschlag — beides kann jede Schnittstelle dieses Bestands von außen erweitern, und der Leser sähe es nie. Drei neue Gegenproben (nach der Zählvorschrift: drei neue Sätze), 68 → 71.
apps/local-api/scripts/proof-release-safety.mjs:1992  mittel  `erwartet` heißt hier „**freiwillig**", während die ganze Zählvorschrift seit T-294 darauf steht. Gemessen: R4 (Zweig „kennt kein `write` mehr" raus) ist **67/1** mit dem `erwartet` an (u) und **68/0** ohne es — der eingesetzte Verstoß trägt sich dann selbst über den Satz „kennt außer `write` noch read", und die Gegenprobe bezeugt eine Lücke, die sie nie erreicht hat. Das ist die Bruchstelle (c) aus dem Bericht, aber die dort gezogene Folgerung („die `erwartet` gegenzählen") schließt sie nicht: Sie sagt, WIE zu zählen ist, nicht, daß gezählt werden MUSS. Heute tragen alle 44 Einträge eines; die Regel kostet also nichts. Fix: den Satz bei :1992 auf „`erwartet` ist Pflicht" umschreiben, in Abschnitt 0 eine Zeile ergänzen, die über alle `COUNTER_PROOFS` läuft und rot wird, sobald ein Eintrag ohne `erwartet` dasteht, und die Zählvorschrift bei :1243 auf „ein Befundsatz gilt als gedeckt, wenn mindestens ein `erwartet` ihn nennt" festlegen.
apps/local-api/scripts/proof-release-safety.mjs:1262  mittel  Die entscheidende Hälfte der Zählvorschrift steht unter den AUSNAHMEN statt in der Regel. Bei :1253 überschrieben mit „Drei Stellen, an denen sie **nicht** mechanisch durchläuft" liest der nächste Leser Punkt 2 als Erlaubnis, es zu lassen. Gemessen ist das Gegenteil: Auf den Stand von T-292 angewandt — vier Zweige hinter einem Satz — hätte die Vorschrift im Wortlaut von :1243 genau EINE Gegenprobe verlangt und die Lücke damit gesegnet; R3 zeigt, daß sie drei (Kollaps auf einen der vier vorhandenen Sätze, 65/3) bis vier (Kollaps auf einen neutralen Satz, 64/4) wert war. Fix: den Satz aus :1262 in den Regelkörper bei :1243 heben — „Ein Zweig, dessen Befundsatz sich nicht von dem eines anderen Zweigs unterscheiden läßt, ist kein gezählter Zweig, sondern ein zu trennender Satz" — und bei den Ausnahmen nur noch den Verweis darauf stehen lassen. Damit bleiben zwei Bruchstellen, und die sind es dann auch.
apps/local-api/scripts/proof-release-safety.mjs:1176  niedrig Die berichtigte Begründung der Untergrenze ist weniger falsch, aber noch nicht wahr. „Sie steht gegen einen **künftigen** schwächeren Leser. Gegen einen zeilenverankerten Ausdruck wird sie rot" (ebenso :1577 und `docs/architektur.md:1459`) liest sich als Erkennung, die sie nicht hat. Gemessen (M2, Untergrenze abgeschaltet, Lauf 67/1 nur wegen der Gegenprobe (o)): Eine leere Mitgliederliste ist auch ohne sie rot — `!members.includes('write')` greift und meldet „kennt kein `write` mehr". Die Untergrenze ist gegen KEINEN Leser der Unterschied zwischen grün und rot; rot wird bei ihrer Entfernung nur die Gegenprobe (o), deren `erwartet` ihren eigenen Satz nennt, also zirkulär. Was sie wirklich leistet, ist seit T-294 schärfer als das, was dasteht: Ohne sie bekäme ein BLINDER Leser den Satz, der seit T-294 (u) gehört — „der Port kennt kein `write` mehr" —, und der nächste suchte ein verlorenes `write`, wo ein blinder Leser ist. Fix: an allen drei Stellen sagen, was gemessen ist — sie fügt keine Erkennung hinzu, sondern verhindert, daß zwei verschiedene Befunde denselben Satz tragen. Das ist dieselbe Regel wie Befund 3, auf sie selbst angewandt.
docs/datenmodell.md:1039                              niedrig „dazu die **drei** Meßfehlschläge" steht neben `docs/architektur.md:1482` „**vier** Meßfehlschläge brauchen vier Sätze" und neben `:892` „Vier Meßfehlschläge, vier Sätze". Die Rechnung des Satzes geht nur auf, wenn man den Zweig „Datei nicht im gelesenen Baum" (`:1139`) als dritten mitzählt und `extends` und die Zusammenführung, die vorn einzeln genannt sind, nicht — das ist verteidigbar und stolpert trotzdem. Zweitens: „die es gab und die kein Verstoß je erreicht hatte" trifft (s), (t) und (u), aber nicht (v) — den hat der weggenommene Ordner als Nebenwirkung erreicht, und genau diese Unterscheidung ist der Punkt, den dieselbe Runde bei :1268 einführt. Fix: „dazu die beiden übrigen Meßfehlschläge, der Zweig „kennt kein `write` mehr" — die kein Verstoß je erreicht hatte — und die Untergrenze „`version.ts` nicht im Baum", die bis dahin nur als Nebenwirkung fiel".
docs/bedrohungsmodell.md:10298                        niedrig Unverändert und richtigerweise nicht angefaßt (security-checker): „alle **vierzehn** Gegenproben beißen" für `proof:release-safety` — gemessen sind heute **44** Verstoßeinträge und **68** Prüfzeilen. Gehört mit A-V-28 (T-290-1: vier/sieben/sechs gegen gemessene drei/acht/sieben) in einen Auftrag an den security-checker; steht seit T-293 offen und ist dort schon einmal gemeldet.
```

Keine Befunde zu: **Dateihoheit** (drei Dateien, alle domain-dev, Zeitfenster 13:59–14:05
gemessen, `decisions.md` liegt danach und ist der Orchestrator), **Typsicherheit** (`.mjs`
außerhalb des `typecheck`-Umfangs, kein `any` außer in zwei **eingesetzten Quellzeichenketten**
für Gegenproben `:1348`/`:1354`, keine Zusicherung, `mitgliedsname` ist total und liefert nie
`undefined`, der neue Rückgabewert wird am Aufrufer über `mitglieder === undefined`
unterschieden und `[]` fällt richtig in die Untergrenze), **verschluckten Fehlern** (die beiden
leeren `catch` bei `:244`/`:275` setzen ein Merkmal, das unmittelbar in `scheitern(…)` mündet —
kein stiller Ausgang; der äußere `catch` bei `:2082` benennt und wirft weiter),
**doppelter Fachlogik** (`stripComments`/`mentionsGlobalFetch` weiterhin aus `fetch-scan.mjs`,
der Compiler wie in `caller-scan.mjs`), **Sprache** (Prosa deutsch, Bezeichner englisch, keine
Oberflächentexte), **Transaktionsgrenzen** und **Fachlogik** (kein Produktivcode berührt, kein
Netzweg, keine Route, `proof:all` 19/19 grün und keine Zahl außer `release-safety` bewegt),
**stehengebliebenen Zahlen** (`docs/architektur.md:1503` „37/0" ist eine eingefrorene Messung
von T-289 und richtig so; `docs/datenmodell.md:1031` und `docs/architektur.md:1437`
„zweiundzwanzig" stimmen mit den 22 `rueckweg`-Einträgen zeichengleich).

---

## Urteil

**Nacharbeit.** Blockierend ist `apps/local-api/scripts/proof-release-safety.mjs:899` — die
Deklarationszusammenführung über eine Dateigrenze oder einen `declare`-Block hinweg.

Der beauftragte Teil ist erledigt und über den Auftrag hinaus gemessen: `extends` ist zu, und
zwar gegen die **Auflösung** und nicht gegen eine Schreibweise — leerer Rumpf, Alias-Basis und
Basis aus einer erlaubten Importquelle fallen alle, ohne daß jemand sie einzeln hingeschrieben
hat. Der Rückgabewert mit Grund ist keine Verzierung: R3 reproduziert zeichengleich mit 65/3
und in der strengeren Bauart mit 64/4, und damit ist zum ersten Mal gemessen, daß die
Zählvorschrift **in den Leser hineingreift**. Die Zahl 68 stimmt von unten, 9/49/7/3, und die
vier Zusätze in `rueckweg` folgen aus der Vorschrift — meine 64 war ein Rechenfehler an der
einen Prüfung, für die ich selbst keine Zweige gezählt hatte. Der Torlauf hält: `proof:all`
19 Läufe, 0 rot, jede Zahl zeichengleich zum Bericht.

Blockierend ist die dritte Tür derselben Klasse, und sie steht offen. Eine einzige zusätzliche
Datei im Ordner des Prüfers — ohne Import, ohne Änderung an `version.ts`, fünf Zeilen — gibt
dem Port ein `read`, `tsc` sagt Exit 0, und der Lauf sagt 68/0. Das ist wörtlich derselbe Satz,
mit dem ich dreimal blockiert habe: die Zusage in `docs/architektur.md` ist weiter als die
Messung, diesmal in dem Wort „**führt nichts zusammen**". Der Unterschied zu den drei Vorrunden
ist, daß die Klasse hier **endlich** ist und mit diesem Auftrag endet — `extends` und
Deklarationszusammenführung sind die beiden einzigen Wege, und für die zweite fehlen nur die
verschachtelte und die dateifremde Deklaration. Der Bestand macht es billig: der Portname steht
in genau einer gelesenen Datei, `declare module` und `declare global` kommen im ganzen
gelesenen Baum nullmal vor. Zwei Zeilen Einsammeln, zwei Zusagen über den Baum, drei
Gegenproben, 68 → 71.

Mitzunehmen in denselben Auftrag, weil dieselbe Datei und dieselbe Liste: `erwartet` als
Pflicht mit einer Zeile in Abschnitt 0 (`:1992` — heute ist die Zählvorschrift auf eine
freiwillige Angabe gebaut), die fehlende Hälfte der Vorschrift aus den Ausnahmen in die Regel
(`:1262`), die genauere Begründung der Untergrenze (`:1176`, `:1577`,
`docs/architektur.md:1459`) und der Satz in `docs/datenmodell.md:1039`. E-107 gehört **nicht**
hinein — die Antwort darauf steht oben und braucht zuerst `erwartetAlle`.
