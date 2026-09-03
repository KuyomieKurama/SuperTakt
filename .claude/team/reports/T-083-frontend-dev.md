Aufgabe: T-083 — `countConditions` fragt die Domäne, und ein leerer Ordner sieht nicht mehr aus wie eine Regel ohne Treffer

Status: fertig

Artefakte:

```
apps/web/src/lib/poolRule.ts            `countConditions` und `hasNoCondition` gelöscht;
                                        `RuleAxes extends PoolRuleAxes`; `describeRule` ruft
                                        `poolRuleIsEmpty` und `countPoolRuleConditions`;
                                        neu `RuleReach` + `describeRuleReach`
apps/web/src/api/types.ts               `PoolResolution`; `Pool.resolved` als Pflichtfeld
apps/web/src/components/RuleSummary.tsx freiwilliges `reach`: leerer Ordnerchip trägt Warndreieck,
                                        Warnfarbe und das Wort „kein Tag darin"; Folgesatz darunter
apps/web/src/screens/BoardScreen.tsx    `BoardColumnEmpty` hat drei Zustände statt zwei; Spaltenkopf
                                        und Spaltendialog zeigen den leeren Ordner
apps/web/src/screens/PoolFormDialog.tsx zählt über die Domäne; Warnband und markierter Chip, solange
                                        der Entwurf dieselben Terme nennt wie der gespeicherte Stand
apps/web/src/screens/TagsScreen.tsx     Pool-Liste zeigt denselben Befund
apps/web/src/showcase/{data,BoardSection,RuleSection}.tsx
                                        Ordner „Kunden / Ost" ohne Tag, Spalte darüber, die drei
                                        Leerzustände nebeneinander, fünfte Regelform
apps/web/src/styles/{components,app}.css `.rule-summary__folder--empty`, `.rule-summary__unreachable`,
                                        `.rule-row__fault`
apps/web/scripts/contrast-check.mjs     Gruppe „Leerer Ordner", sechs Paare
```

Nicht angefasst: `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `tests/e2e/**`,
`apps/web/test/**`, `apps/desktop/**`.

---

Zusammenfassung:

Die dritte Fassung der Frage „nennt diese Regel eine Bedingung" ist weg. `apps/web` ruft
`countPoolRuleConditions` und `poolRuleIsEmpty` aus `@takt/domain`, und `RuleAxes` erweitert
`PoolRuleAxes` — eine sechste Achse in der Domäne macht damit nicht nur den Aufruf rot, sondern
jede Stelle in der Oberfläche, die eine Regel zusammensetzt. Danebengestellt ist die zweite,
verschiedene Frage: `pool.resolved` kommt jetzt über die Leitung, und `describeRuleReach` macht
daraus den Zustand, den die Oberfläche bis heute verschwiegen hat — ein erforderlicher Ordner ohne
ein einziges Tag. Er wird an jeder Fläche gezeigt, die eine Regel zeigt: am Chip selbst
(Warndreieck, Warnfarbe, das Wort „kein Tag darin"), als Folgesatz darunter, als eigener
Leerzustand in der Spalte, als Zeile im Spaltendialog und als Warnband im Formular. Ausgeschlossene
Ordner ohne Tag lösen nichts aus.

`pnpm typecheck` (alle sieben Pakete) grün, `pnpm contrast` 0 von 424 durchgefallen,
`pnpm --filter @takt/web build` grün. Die drei Leerzustände stehen im Browser nebeneinander,
hell und dunkel geprüft.

---

## 1. `countConditions` — die geforderte Grep-Ausgabe

```
$ grep -rn "countConditions\|hasNoCondition" apps/web/src
apps/web/src/lib/poolRule.ts:24: * Bis T-083 stand in dieser Datei ein `countConditions`, das die fünf Achsen
```

Der einzige verbliebene Treffer ist der Satz im Dateikopf, der sagt, warum es die Funktion nicht
mehr gibt. Die drei Aufrufstellen rufen jetzt die Domäne:

| Stelle | vorher | jetzt |
|---|---|---|
| `BoardScreen` — Regelzeile im leeren Board | `countConditions` | `countPoolRuleConditions` |
| `BoardScreen` — Spaltendialog | `countConditions` | `countPoolRuleConditions` |
| `PoolFormDialog` — Toast und Warnband | `countConditions` | `countPoolRuleConditions` |
| `poolRule.describeRule` — `isEmpty` | `conditionCount === 0` | `poolRuleIsEmpty(axes)` |

Die letzte Zeile ist keine Kosmetik: `isEmpty` aus dem eigenen Zähler abzuleiten wäre wieder eine
zweite Fassung derselben Aussage gewesen — kurz, richtig und trotzdem die Art Zeile, die eines
Tages abweicht.

**Die Typwache greift auch hier.** `interface RuleAxes extends PoolRuleAxes` mit engeren Typen
(`readonly PoolRuleTerm[]` statt `readonly unknown[]`). Probe: Eine sechste Achse in
`PoolRuleAxes` macht `RuleAxes` unvollständig, und damit werden `axesOf`, der `useMemo` im
Formular und die Musterdaten der Showcase rot — vier Stellen in `apps/web`, zusätzlich zu den
sechs, die der domain-dev in drei Paketen gemessen hat.

## 2. Drei Leerzustände, und nur einer ist ein Fehler

`describeRuleReach(description, resolved)` in `lib/poolRule.ts` liefert genau drei Fälle:

| Fall | Erkennung | Was die Oberfläche sagt | Handlung |
|---|---|---|---|
| `no-condition` | `poolRuleIsEmpty` über die gespeicherten Felder | „Diese Spalte hat noch keine Bedingung" | Bedingung ergänzen |
| `empty-folder` | `resolved.tagCount === 0` bei nicht leerem `rule` | „Der geforderte Ordner enthält kein Tag" **mit Namen** | Tag anlegen / Regel bearbeiten |
| `reachable` | sonst | „Keine Karte trifft diese Regel" | keine |

Sie unterscheiden sich in **Symbol, Überschrift, Erklärung und angebotener Handlung** — nie nur in
der Farbe (SC 1.4.1). Der mittlere bietet zwei Wege an, weil er zwei hat: das fehlende Tag anlegen
oder die Regel ändern.

**Warum `tagCount === 0` genügt, um die Ordner zu benennen.** Ein Tagterm bringt immer mindestens
einen Tag mit. Ergibt die erforderliche Liste null Tags, obwohl sie Terme nennt, sind es folglich
ausschließlich Ordnerterme, und keiner enthält ein Tag — die Chips der Achse sind die vollständige
Antwort auf „welcher Ordner". Lässt sich kein Ordner nennen (ein Term, der auf nichts zeigt), fällt
die Auskunft bewusst auf den gewöhnlichen Leerzustand zurück, statt „irgendetwas ist leer" zu
sagen.

**Die Beschreibung wird hereingereicht, nicht zweimal erzeugt.** `describeRuleReach` nimmt die
`RuleDescription`, die die Zusammenfassung ohnehin zeichnet. Damit kann der Ordner, den der
Leerzustand nennt, nicht ein anderer sein als der markierte Chip darüber.

**Ausgeschlossene Ordner sind kein Fall.** `resolved.excludedTagCount` wird nirgends gelesen — „keiner
davon" über nichts schließt nichts aus, engt also nicht ein und ist kein Fehler (E-057). Eine
Warnung ohne Folge glaubt beim nächsten Mal niemand mehr.

## 3. Wo der Befund überall steht

| Fläche | Was zu sehen ist |
|---|---|
| Spaltenkopf des Boards | Ordnerchip mit Warndreieck und „— kein Tag darin", darunter der Folgesatz |
| Spaltenkörper (leer) | eigener Leerzustand mit Ordnernamen und zwei Wegen |
| Spaltendialog (S-11 auf dem Board) | eigene Zeile „Kein Tag in „…" — diese Spalte kann nichts treffen" |
| Regelliste in S-09 | derselbe Chip, derselbe Folgesatz |
| Regelformular | markierter Chip in der Vorschau **und** ein Warnband mit dem Weg heraus |
| Musterseite | die drei Leerzustände nebeneinander, fünfte Regelform „Mit leerem Ordner" |

**Im Formular nur beim unveränderten Entwurf.** `pool.resolved` beschreibt den **gespeicherten**
Stand. Sobald der Entwurf die erforderlichen Terme oder die Ordnertiefe ändert, wird die Auskunft
weggelassen statt angepasst — eine veraltete Warnung zeigte auf einen Ordner, den der Benutzer
gerade herausgenommen hat. Verglichen wird dafür nur, ob die Termliste dieselbe ist (`sameTerms`);
nachgerechnet wird nichts.

## 4. Gemessen, nicht behauptet

`--warning-border` als Kontur des leeren Ordnerchips **verfehlt** SC 1.4.11 auf beiden
Untergründen, auf denen der Chip liegt: 1,28:1 gegen `--bg-subtle` und 1,44:1 gegen `--bg-surface`
im hellen Modus, 2,47:1 und 2,71:1 im dunklen. Der Chip nimmt deshalb `--warning-fg` als Kontur.
Der Befund steht als Merkposten in `contrast-check.mjs`, damit niemand die weichere Farbe „aus
Konsistenz" zurückholt. Neue Gruppe „Leerer Ordner", vier Paare, alle grün; Gesamtlauf 0 von 424
durchgefallen.

Kein Token geändert — `packages/ui-tokens` gehört mir nicht, und es war auch keines nötig.

## 5. Prüfläufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | grün, alle sieben Pakete |
| `pnpm contrast` | 0 von 424 durchgefallen |
| `pnpm --filter @takt/web build` | grün, 363 Module |
| Browser, hell und dunkel | die drei Leerzustände nebeneinander, Chip und Folgesatz im Spaltenkopf, fünfte Regelform |

Der Dienst lief während der Aufgabe nicht (Ports 17843 und 5173 frei, nicht belegt und nicht
abgeschossen). Die Musterseite wurde auf einem eigenen Port 5199 gerendert und danach beendet.
Board, Regelliste und Formular sind damit übersetzt und gebaut, aber nicht gegen laufende Daten
gesehen — die Musterseite zeigt dieselben Komponenten mit denselben Zuständen.

---

Annahmen:

1. **`Pool.resolved` ist Pflicht, nicht freiwillig.** Alle vier Antworten, aus denen diese
   Oberfläche einen `Pool` bezieht, liefern es (T-080). Ein freiwilliges Feld hieße, einen
   Leerzustand mit einem Vielleicht zu begründen.
2. **Der Befund gehört auf jede Fläche, die eine Regel zeigt** — nicht nur in den Leerzustand der
   Spalte. Dieselbe Begründung wie beim Exportstatus: Eine Unterscheidung, die nur an einer Stelle
   sichtbar ist, ist an allen anderen unsichtbar.
3. **Der Zustand wird als Einrichtungsfehler formuliert, nicht als Beobachtung.** „Diese Bedingung
   kann kein Todo erfüllen" ist die Aussage aus E-057. Bis T-082 landet, kann eine solche Spalte
   noch Karten zeigen — dann steht der Satz kurzzeitig neben Karten. Ich folge der Entscheidung,
   nicht dem Zwischenstand (siehe Risiko 1).
4. **Die Musterdaten wurden erweitert statt umgeschrieben.** „Kunden Ost" kommt hinzu, die fünf
   bestehenden Spalten bleiben, wie sie waren.

Risiken:

1. **Reihenfolge zu T-082.** Solange die Domäne einen leeren Ordnerterm noch als Neutralwert
   überspringt, behauptet die Oberfläche „trifft nichts" für eine Regel, die noch Karten liefert.
   Der Widerspruch verschwindet mit T-082 und ist die von E-057 gewollte Richtung; ein Fehler in
   die andere Richtung — eine Spalte, die stillschweigend mehr zeigt — wäre der teurere.
2. **Aggregat statt Term.** `resolved.tagCount` ist eine Summe über die Achse. Nennt eine Regel
   „Tag Support **oder** Ordner Ost" und ist nur der Ordner leer, bleibt die Summe positiv, und
   die Oberfläche schweigt — obwohl die Regel nach E-057 nichts trifft. Siehe offene Frage 1. Ich
   habe die Ordnerauflösung **nicht** nachgebaut; das wäre die Doppelung, die T-080 beseitigt hat.
3. **Formular und gespeicherter Stand.** Der Befund verschwindet, sobald der Entwurf die
   erforderlichen Terme anfasst — auch wenn der leere Ordner darin bleibt und nur ein zweiter
   dazukommt. Bewusst so: lieber keine Auskunft als eine, die auf den falschen Ordner zeigt.
4. **Sicherheit:** keine neue Angriffsfläche. Es kommt kein Feld hinzu, das Kunden- oder
   Call-Daten trägt; `resolved` sind drei Zahlen. Kein Export ist berührt, keine Notiz wird
   angezeigt.

Offene Fragen:

1. **Braucht die Oberfläche die Auflösung je Term?** E-057 ist termweise formuliert („ein
   Ordnerterm, der auf keinen Tag auflöst"), `resolved.tagCount` ist achsenweise. Der gemischte
   Fall — ein leerer Ordner neben einem gefüllten Tag — bleibt damit unsichtbar, obwohl die Regel
   nach E-057 nichts trifft. Wenn T-082 diesen Fall wirklich als „trifft nichts" umsetzt, zeigt
   die Oberfläche eine leere Spalte ohne Grund, und das ist genau der Zustand, den diese Aufgabe
   beseitigen sollte. Vorschlag an den domain-dev: `resolved` um eine Liste der Ordnerterme
   ergänzen, die auf nichts auflösen — etwa `emptyRuleFolderIds: readonly Id[]`. Dann fiele meine
   Ableitung aus `tagCount` weg und die Ordnernamen kämen aus derselben Quelle wie die Regel.
2. **Soll ein Speichern mit leerem Ordner gewarnt werden?** Heute steht das Warnband im Formular,
   der Toast nach dem Speichern nennt aber nur die Bedingungszahl — die Auflösung des neuen Standes
   kennt die Oberfläche im selben Zug noch nicht. `POST`/`PATCH` liefern `resolved` in der Antwort;
   ich könnte den Toast daraus färben. Nicht getan, weil das eine Produktentscheidung über die
   Dringlichkeit ist, keine Umsetzungsfrage.
3. **Der Ordnerbaum im Formular.** Die Ordnerauswahl könnte leere Ordner schon beim Auswählen
   kenntlich machen. Dafür bräuchte sie eine Tagzahl je Ordner aus dem Dienst — heute nicht in der
   Struktur enthalten. Lohnt sich das, oder genügt der Befund an der fertigen Regel?

Nächster Schritt:

Offene Frage 1 an den domain-dev geben, bevor T-082 abgenommen wird — die termweise Auflösung ist
die einzige Lücke zwischen E-057 und dem, was die Oberfläche zeigen kann. Danach unit-tester auf
`describeRuleReach` ansetzen: drei Fälle, die Grenze `tagCount === 0` bei leerem und bei nicht
leerem `rule`, und die Ableitung der Ordnernamen aus den Chips.
