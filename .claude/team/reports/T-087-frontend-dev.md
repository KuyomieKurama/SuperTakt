Aufgabe: T-087 — Leere Ordner beim Namen nennen

Status: fertig

Artefakte:

```
apps/web/src/api/types.ts               `PoolResolution` um `unresolvedRequired`,
                                        `unresolvedExcluded`, `emptyRuleFolderIds` und
                                        `matchesNothing` erweitert — alle vier Pflicht
apps/web/src/lib/poolRule.ts            `RuleChip.folderId` und `RuleChip.missing`; neu
                                        `EmptyRuleFolder` und `emptyFolderNames`;
                                        `describeRuleReach` entscheidet über
                                        `unresolvedRequired` und `emptyRuleFolderIds`
                                        statt über `tagCount`, Reihenfolge
                                        `unresolvedRequired` vor `isEmpty`
apps/web/src/components/RuleSummary.tsx markiert den einzelnen Chip statt der ganzen
                                        Achse; der Folgesatz nennt die Ordner beim Namen
apps/web/src/screens/BoardScreen.tsx    Spaltenleerzustand und Spaltendialog nennen die
                                        Ordner über `emptyFolderNames`; Text um den
                                        gemischten Fall ergänzt
apps/web/src/screens/PoolFormDialog.tsx Warnband über `emptyFolderNames`; neuer **Hinweis**
                                        (tone="info") für `unresolvedExcluded`
apps/web/src/showcase/data.ts           siebte Spalte „Support oder Kunden Ost" — der
                                        gemischte Fall; alle Auflösungen auf sieben Felder
apps/web/src/showcase/RuleSection.tsx   sechste Regelform „Mit leerem Ordner neben einem Tag"
apps/web/src/showcase/BoardSection.tsx  vier Leerzustände nebeneinander statt drei
```

Nicht angefaßt: `apps/desktop/**`, `packages/**`, `apps/local-api/**`, `apps/outlook-addin/**`,
`tests/e2e/**`, `apps/web/test/**`, `apps/web/scripts/**`, `apps/web/src/styles/**`,
`apps/web/src/screens/TagsScreen.tsx` (die Fläche zog automatisch mit, weil sie `reach` aus
derselben Funktion bezieht — keine Zeile war dort zu ändern).

---

Zusammenfassung:

Die Oberfläche liest den Befund „ein erforderlicher Ordner ohne Tag" nicht mehr aus der
Achsensumme `resolved.tagCount`, sondern termweise aus `resolved.unresolvedRequired` und
`resolved.emptyRuleFolderIds`. Damit ist der gemischte Fall sichtbar — ein leerer Ordner neben
einem Tagterm, bei dem die Summe auf `1` steht und die Regel nach E-057 trotzdem nichts trifft;
er sah bis heute aus wie „gerade paßt nichts" und forderte damit zum Warten auf Karten auf, die
nie kommen. Die betroffenen Ordner werden an allen Flächen **beim Namen** genannt, in der
Reihenfolge, die der Dienst vorgibt, und markiert wird jetzt der einzelne Chip statt der ganzen
Achse. `unresolvedExcluded` steht als **Hinweis** im Regelformular und nirgends als Warnung.

`pnpm --filter @takt/web typecheck` grün, `pnpm run contrast` 0 von 424 durchgefallen,
`pnpm --filter @takt/web build` grün. `pnpm run typecheck` **vollständig grün** — die beiden
gemeldeten roten Stellen (T-086, T-088) waren beim Messen bereits behoben. `pnpm run test:e2e`
34 von 34 grün.

---

## 1. Was die Entscheidung jetzt trägt — und was ausdrücklich nicht

```ts
export function describeRuleReach(description, resolved): RuleReach {
  if (resolved.unresolvedRequired) {
    return { kind: "empty-folder", folders: emptyFoldersOf(description, resolved) };
  }
  if (description.isEmpty) return { kind: "no-condition" };
  return { kind: "reachable" };
}
```

Drei Zeilen, und jede der beiden Fragen kommt aus der Quelle, die für sie zuständig ist:

| Frage | hängt ab von | Quelle |
|---|---|---|
| Ist ein erforderlicher Term unaufgelöst? | den Termen von `rule` und `includeSubfolders` | `resolved` — nur der Dienst steigt über den Ordnerbaum ab |
| Welcher Ordner ist es? | denselben | `resolved.emptyRuleFolderIds`, Namen aus dem geladenen Baum |
| Nennt die Regel eine Bedingung? | **allen fünf** Achsen | `description.isEmpty`, also `poolRuleIsEmpty` über die Felder |

**Die Reihenfolge ist Teil der Auskunft** (deine Vorgabe, T-082 offene Frage 2). Eine Regel, die
nur aus einem leeren Ordner besteht, ist nach dem Auflösen leer **und** nennt eine Bedingung.
Stünde `isEmpty` vorn, sagte die Oberfläche „richten Sie die Regel ein" zu jemandem, der sie
eingerichtet hat. Der leere Ordner geht vor.

**Warum `matchesNothing` nicht als Ganzes gelesen wird.** Es ist `isEmpty || unresolvedRequired`
über den **gespeicherten** Stand, und genau diese Vermischung macht es im Formular unbrauchbar:
Wer einer noch leeren Regel eine Statusachse hinzufügt, hat sie eingerichtet — der gespeicherte
Stand daneben meldet weiterhin `matchesNothing: true`. Die Oberfläche liest deshalb die eine
Hälfte vom Dienst (sie hängt nur an den Regeltermen, die das Formular gegen den gespeicherten
Stand prüft) und die andere aus der Domäne über den Entwurf. Das steht als Absatz an der Funktion
und am Feld, damit niemand die vermeintliche Vereinfachung „lies doch einfach `matchesNothing`"
nachträgt. Siehe offene Frage 1.

**Nachgerechnet wird weiterhin nichts.** Die Oberfläche steigt an keiner Stelle über den
Ordnerbaum ab, um die Tags eines Ordnerterms zu zählen. Sie ordnet Kennungen Namen zu, mehr nicht.

## 2. Der Ordner beim Namen — und der Ordner, den es nicht mehr gibt

`RuleChip` trägt seit T-087 die `folderId`. Das ist die Voraussetzung dafür, daß der Befund den
**einzelnen** Chip trifft: Bis T-087 stand am Chip nur der Pfad als Text, und die Markierung ging
deshalb an jeden Ordnerchip der erforderlichen Achse, sobald irgendeiner leer war. Bei „Ordner
Nord **oder** Ordner Ost" zeigte die Oberfläche damit auf beide — also auch auf den richtigen.

Die Namen kommen aus den Chips und nicht aus einem zweiten Aufruf des Nachschlagens. Das ist
dieselbe Begründung wie in T-083: Der Ordner, den der Satz nennt, kann dann kein anderer sein als
der Chip darüber.

**Entscheidung zum Wettlauf** (deine Frage): Kennt der Baum eine Kennung aus
`emptyRuleFolderIds` nicht, steht im Text **„einem unbekannten Ordner"** — nicht „ein gelöschter
Ordner", und auf keinen Fall die nackte Kennung.

Zwei Gründe. Erstens ist „gelöscht" eine Behauptung, die die Oberfläche nicht belegen kann: Der
Ordner kann gelöscht sein, oder der Baum der Oberfläche ist älter als die Antwort des Dienstes —
von hier aus sieht beides gleich aus. Zweitens ist „Unbekannter Ordner" bereits das Wort, das der
Chip in genau diesem Fall trägt (und „Unbekannter Tag" bzw. „Unbekannter Status" an den
Geschwistern). Zwei Wörter für denselben Zustand wären eine zweite Sprache.

Die Aufzählung steht im Dativ, weil alle drei Sätze, die sie einsetzen, einen verlangen („ein Tag
aus …", „in … liegt kein Tag", „kein Tag in …"). Namen bekommen Anführungszeichen, die
Umschreibung nicht — Anführungszeichen um „einem unbekannten Ordner" behaupteten einen Namen.
Mehrere unbenennbare werden zu einem Eintrag zusammengezogen („zwei unbekannten Ordnern"), statt
denselben Satzteil zweimal hintereinander zu setzen.

## 3. Gemessen, nicht behauptet

Acht Fälle durch `describeRule` + `describeRuleReach` + `emptyFolderNames` (Probelauf außerhalb
des Baums, nichts davon liegt im Repository — Prüffälle gehören dem unit-tester):

| Fall | `kind` | markierte Chips | Satz |
|---|---|---|---|
| alle Achsen neutral | `no-condition` | — | — |
| Tagterm, aufgelöst | `reachable` | — | — |
| nur leerer Ordner + Status | `empty-folder` | `Kunden / Ost` | Kein Tag in „Kunden / Ost“ — diese Bedingung kann … |
| **Tag + leerer Ordner** (`tagCount: 1`) | `empty-folder` | **nur** `Kunden / Ost` | Kein Tag in „Kunden / Ost“ — diese Bedingung kann … |
| zwei leere Ordner | `empty-folder` | beide, in Regelreihenfolge | Kein Tag in „Kunden / Ost“ und „Kunden / Nord“ — diese Bedingungen können … |
| Ordner, den der Baum nicht kennt | `empty-folder` | der Chip „Unbekannter Ordner" | Kein Tag in einem unbekannten Ordner — … |
| benannt **und** unbenannt | `empty-folder` | beide | Kein Tag in „Kunden / Ost“ und einem unbekannten Ordner — … |
| `unresolvedRequired` ohne Ordnerkennung | `empty-folder` | keiner | Kein Tag in einem unbekannten Ordner — … |

Zeile 4 ist der Zweck der Aufgabe: Mit `tagCount` stand hier `reachable`, und die Achsensumme sah
gesund aus. Zeile 5 belegt die geforderte **Reihenfolge der Regel** (`folder-ost` vor
`folder-nord`, obwohl die Kennungen anders sortiert wären). Zeile 8 ist der Fall, den
`tagAxisIsUnresolved` als Netz mitführt (`named > 0 && resolved === 0` ohne leeren Ordnerterm) —
siehe Annahme 3.

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/web typecheck` | grün |
| `pnpm run typecheck` (vollständig) | grün, Exitcode 0 — die beiden gemeldeten roten Stellen waren schon behoben |
| `pnpm run contrast` | 0 von 424 durchgefallen |
| `pnpm --filter @takt/web build` | grün, 363 Module |
| `pnpm --filter @takt/web build:designsystem` | grün |
| `pnpm run test:e2e -- kanban` | **34 von 34** grün (1,5 min); Ports 17843 und 5173 waren vorher frei, kein fremder Prozeß angefaßt |

Kein Kontrastpaar geändert und keines nötig: Die Zustände dieser Aufgabe benutzen die Farben, die
T-083 gemessen hat. Die Musterseite ist gebaut, aber **nicht** im Browser nachgesehen — `vite
preview` auf einem eigenen Port wurde von der Rechtevergabe abgelehnt, und ich habe daran nicht
vorbeigearbeitet. Was gemessen ist, steht in der Tabelle oben; was nicht, steht in Risiko 3.

## 4. Wo der Befund überall steht

| Fläche | Was sich geändert hat |
|---|---|
| Spaltenkopf des Boards (`RuleSummary`) | markiert **den** leeren Ordnerchip; Folgesatz nennt ihn beim Namen |
| Spaltenkörper, leer (`BoardColumnEmpty`) | Name über `emptyFolderNames`; ein Satz mehr für den gemischten Fall |
| Spaltendialog (S-11) | „Kein Tag in „Kunden / Ost“ — diese Spalte kann nichts treffen" |
| Regelliste in S-09 (`TagsScreen`) | zog automatisch mit, keine Zeile geändert |
| Regelformular | Warnband nennt die Ordner; **neu**: Hinweis für den wirkungslosen Ausschluß |
| Musterseite | siebte Spalte, sechste Regelform, vier Leerzustände nebeneinander |

**Der Satz für den gemischten Fall.** Im Leerzustand und im Warnband steht jetzt ausdrücklich,
daß ein zweiter Tag oder Ordner daneben nichts ändert. Das ist genau die Rückfrage, die ein
Benutzer bei „mindestens eines von" stellt — aussagenlogisch wäre „oder" erfüllbar, E-057
entscheidet dagegen, und der Grund („der Benutzer meint die Zugehörigkeit, nicht die Menge")
gehört an die Fläche, an der die Verwunderung entsteht.

**`unresolvedExcluded` als Hinweis, und nur im Formular.** `tone="info"`, kein Warndreieck, keine
Warnfarbe: Ein Ausschluß über einen leeren Ordner schließt nichts aus, engt also nicht ein und
ist kein Fehler. Er steht ausschließlich im Regelformular — auf Board und Pool-Liste wäre er
Rauschen, denn dort gibt es nichts zu tun. Der Text bleibt ohne Ordnernamen, weil der Dienst sie
bewußt nicht liefert (T-082); einen zu erfinden wäre schlechter als keinen zu nennen. Wie das
Warnband erscheint er nur, solange der Entwurf dieselben ausgeschlossenen Terme nennt wie der
gespeicherte Stand.

---

Annahmen:

1. **„Einem unbekannten Ordner" statt „einem gelöschten Ordner".** Begründet in Abschnitt 2. Der
   ausschlaggebende Punkt ist die Konsistenz: „Unbekannter Ordner" steht bereits am Chip, und der
   Satz darunter soll denselben Zustand nicht anders nennen.
2. **`RuleChip` bekommt `folderId` und `missing`.** Ohne die Kennung am Chip ließe sich der Befund
   nicht je Term zeigen, sondern nur je Achse — und genau das war der Fehler. `missing` steht
   auch an Tagchips, obwohl es dort heute nichts auslöst: Es ist dieselbe Tatsache, und sie
   zweimal verschieden zu benennen wäre der Anfang einer Abweichung.
3. **`unresolvedRequired` ohne genannten Ordner erzeugt trotzdem eine Auskunft.** Der Dienst kann
   `unresolvedRequired` melden, ohne eine Ordnerkennung dazuzulegen — das Netz für eine Termart,
   die eines Tages ins Leere zeigt, ohne ein Ordner zu sein (T-082, Abschnitt 1). Dann steht ein
   Eintrag ohne Kennung und ohne Namen da, und der Text sagt „einem unbekannten Ordner". Der
   **Befund** ist richtig, das Wort „Ordner" ist in diesem Fall eine Annahme. Die Alternative
   wäre ein vierter Leerzustand samt eigenem Text an vier Flächen gewesen — für einen Zustand,
   den es heute nicht gibt. Ich habe die bessere Hälfte einer Auskunft dem Schweigen vorgezogen;
   siehe offene Frage 2.
4. **Die Musterseite wurde erweitert, nicht umgeschrieben.** „Support oder Kunden Ost" kommt als
   siebte Spalte hinzu und steht unmittelbar neben „Kunden Ost", damit beide Formen desselben
   Fehlers nebeneinander abgenommen werden können. Die sechs bestehenden Spalten bleiben.
5. **`TagsScreen` blieb unberührt.** Die Fläche bezieht `reach` aus derselben Funktion; sie zieht
   damit automatisch mit. Eine Änderung dort wäre eine Änderung ohne Grund gewesen.

Risiken:

1. **Der Zustand `empty-folder` heißt weiterhin nach dem Ordner.** Trifft die Auskunft aus
   Annahme 3 eines Tages zu, steht „Ordner" an einem Term, der keiner ist. Das fällt nur auf,
   wenn die Domäne eine dritte Termart bekommt — und dann fällt es auf, weil der Chip daneben
   „Unbekannter Tag" trägt und der Satz „Ordner" sagt. Kein stiller Fehler, aber ein häßlicher.
2. **Die Auskunft im Formular hängt an zwei Vergleichen**, nicht an einem: Für das Warnband
   werden `rule` und `includeSubfolders` gegen den gespeicherten Stand geprüft, für den Hinweis
   `excludedTags` und `includeSubfolders`. Beides ist absichtlich eng — die jeweilige Auskunft
   hängt an genau diesen Feldern und an keinem weiteren. Wer die Prüfung später „vereinheitlicht"
   und alle fünf Achsen vergleicht, läßt die Warnung verschwinden, sobald jemand den Status
   umstellt, obwohl der leere Ordner unverändert dasteht.
3. **Nicht im Browser gesehen.** Übersetzt, gebaut, gegen acht Fälle gemessen und durch den
   End-to-End-Lauf gegangen — aber die Musterseite und das Board sind in dieser Aufgabe nicht
   gerendert worden (Rechtevergabe, siehe Abschnitt 3). Was Layout und Umbruch der längeren Sätze
   angeht, ist das ungeprüft. Die Zustände selbst sind dieselben wie in T-083, nur mit anderem
   Text.
4. **Sicherheit:** keine neue Angriffsfläche. Es kommt eine Liste von **Ordnerkennungen** hinzu,
   die die Oberfläche ohnehin aus der Regel kennt; sie wird nirgends angezeigt, sondern nur gegen
   den Baum aufgelöst. Kein Export ist berührt, keine Notiz wird angezeigt, keine Kunden- oder
   Call-Daten kommen hinzu.

Offene Fragen:

1. **Soll `matchesNothing` an einer Fläche als Ganzes gelesen werden?** Heute nicht — mit der
   Begründung aus Abschnitt 1. Die Folge: Bekommt die Domäne einen **dritten** Grund für „trifft
   nichts", zeigt die Oberfläche `reachable` und schweigt. Das ist genau die Art Lücke, die diese
   Aufgabe geschlossen hat, eine Ebene höher. Ein sauberer Ausweg wäre, `resolved` um den Grund
   als **benannten Wert** zu erweitern (etwa `matchesNothingReason: 'none' | 'empty' |
   'unresolved-required'`) statt um weitere Wahrheitswerte; dann könnte die Oberfläche über einen
   `switch` gehen, und ein vierter Grund machte sie rot statt still. Frage an den domain-dev,
   keine Umsetzungsfrage.
2. **Braucht es einen eigenen Leerzustand für „unaufgelöst, aber kein Ordner"?** Siehe Annahme 3
   und Risiko 1. Solange nur Ordnerterme leer ausgehen können, ist die Antwort nein. Sobald es
   eine dritte Termart gibt, ist sie ja — und dann gehört sie beauftragt, statt hier
   vorweggenommen zu werden.
3. **Der Ordnerbaum im Formular** (aus T-083 unverändert offen): Die Ordnerauswahl könnte leere
   Ordner schon beim Auswählen kenntlich machen. `TagTree` zeigt in S-09 bereits eine Tagzahl je
   Ordner, aber die zählt den Baum, den die Oberfläche hält — sie ist eine Anzeige, keine
   Auflösung, und `includeSubfolders` spielt darin keine Rolle. Sie als Vorwarnung im
   Regelformular zu benutzen hieße, zwei verschiedene Zahlen dieselbe Frage beantworten zu
   lassen. Lohnt sich dafür ein Feld am Ordner aus dem Dienst, oder genügt der Befund an der
   fertigen Regel?
4. **Soll der Toast nach dem Speichern den Befund färben?** Unverändert offen aus T-083.
   `POST`/`PATCH` liefern `resolved` in der Antwort und damit seit T-082 auch
   `emptyRuleFolderIds` — der Toast könnte den leeren Ordner beim Namen nennen, statt nur die
   Bedingungszahl zu melden. Das ist eine Produktentscheidung über die Dringlichkeit, keine
   Umsetzungsfrage, deshalb nicht getan.

Nächster Schritt:

Den unit-tester auf `describeRuleReach` und `emptyFolderNames` ansetzen — die acht Fälle aus
Abschnitt 3 sind reine Funktionen und ohne Dienst prüfbar. Wichtig dabei die drei Grenzen, die
sich nicht aus dem Typ ergeben: die **Reihenfolge** (`unresolvedRequired` schlägt
`description.isEmpty`), die **Reihenfolge der Ordner** (`emptyRuleFolderIds`, nicht die der
Chips) und der **gemischte Fall** mit `tagCount: 1`. Danach offene Frage 1 an den domain-dev
geben, bevor eine dritte Termart entsteht.

Befehle, die ich benutzt habe: `pnpm --filter @takt/web typecheck`, `pnpm run typecheck`,
`pnpm run contrast`, `pnpm --filter @takt/web build`,
`pnpm --filter @takt/web build:designsystem`, `pnpm run test:e2e -- kanban`.
