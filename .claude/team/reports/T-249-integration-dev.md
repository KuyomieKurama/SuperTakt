Aufgabe: T-249-3 — `proof-addin.mjs` pfadunabhängig machen, dazu die Verfeinerung aus der Abnahme
Status: fertig

Artefakte:
- `apps/outlook-addin/scripts/proof-addin.mjs` — neuer Block „Die Landkarte" (Auflösung
  fremder Dateien über Paketname und Inhaltsmerkmal, fail-closed), neuer Abschnitt **0a**
  mit zwei Prüfungen, eine dritte Prüfung am Ende von Abschnitt 0 (Gegenprobe zur
  Untergrenze des Quelldateiscans), fünf umgestellte Lesestellen, eine geschärfte
  Zusicherung im OpenAPI-Abschnitt, drei nachgeführte Kommentarstellen, der zusätzliche
  Absatz im Kopf von 18f.

Keine anderen Dateien angefaßt. `apps/web/**`, `apps/desktop/**`, `apps/local-api/**`,
`packages/**` und `docs/**` sind unberührt — auch nicht vorübergehend für eine Gegenprobe.

## Zusammenfassung

Der Lauf greift auf drei Arten in fremden Quelltext: mit einem Import, mit einer Lesestelle
und mit einem Satz in einem Kommentar. **Elf Importe** in fremde Pakete brauchen nichts —
ein nicht auflösbarer Import bricht den Lauf vor dem ersten Prüfsatz ab und nennt die
Angabe, die er nicht gefunden hat; es gibt dort keine leere Menge, über die sich urteilen
ließe. Die zwölf gemessenen Pfadstellen des Auftrags und fünf weitere derselben Familie, die
im Auftrag nicht einzeln genannt waren, sind **Lesestellen und Prosa** — und die waren der
stille Fall. Sie laufen jetzt über eine Landkarte: Eine fremde Datei wird über
ihr **Paket** (Name in `package.json`, Verzeichnisse aus `pnpm-workspace.yaml`) und ein
**Merkmal in ihrem Inhalt** gefunden; der ausgeschriebene Pfad ist nur noch die schnelle
Antwort. Trifft er nicht, sucht die Landkarte im Paket weiter — ein Umzug von
`src/lib/labels.ts` nach `src/features/…/labels.ts` und selbst ein Umzug des ganzen Pakets
nimmt den Wächter mit. Findet sie nichts, oder zwei, oder eine Datei ohne ihr Merkmal, wirft
sie mit einer Meldung, die benennt, was fehlt, und die den Satz „ungemessen, nicht
bestanden" ausspricht. Dazu kommt die eine Menge, die bisher ohne Untergrenze beurteilt
wurde (`routes/addin/*.ts`), und die Gegenprobe zu der Untergrenze, die es schon gab.
`proof:addin` steht bei **248/0** (vorher 245/0), `typecheck` grün.

## Die zwölf Stellen, je mit ihrer Antwort

| Stelle | heute im Lauf | Antwort | warum diese |
|---|---|---|---|
| `apps/web/src/lib/labels.ts` | nur Prosa (E-058-Kommentar) | **Pfad gestrichen** | Der Satz ist **historisch** („bis T-092 stand er zweimal im Baum"), kein Prüfsatz hängt daran, und das Papier sagt selbst, daß diese Datei umzieht. Ein Pfad, den niemand auflöst, ist nach dem ersten Umzug eine falsche Auskunft — und eine falsche Auskunft in einem Nachweislauf ist schlimmer als gar keine. Steht jetzt als „einmal zeichengleich in der Hauptanwendung", mit dem Grund daneben. |
| `apps/local-api/src/http/input.ts` (2×: Abschnitt 16 und T-114 Punkt 4) | nur Prosa | **Auflösung**, Registereintrag `eingangswache`, Merkmal `withoutControlCharacters` | Die Sätze machen eine **lebende** Aussage („weist seit T-101 Steuerzeichen ab", „zieht die Grenze zwischen `nameSchema` und `textSchema`"), nicht eine historische. Sie wird in 0a eingelöst, auch wenn keine Prüfung aus der Datei liest. |
| `apps/outlook-addin/src/duplicate/reopen.ts` (Import, Prosa, `path.join`) | eigenes Paket | **Auflösung über den Modulgraphen** (Import) bzw. **fail-closed über den Scan** (`path.join('duplicate','reopen.ts')` wird gegen die Fundmenge von `sourceFiles()` gehalten) | Eigene Hoheit, eigener Baum: Der Import bricht laut, und der Vergleich der Fundmenge nennt in der roten Meldung den tatsächlichen neuen Ort neben dem erwarteten. Der Pfad in der Prosa ist mit der Umstellung des E-058-Satzes auf `duplicate/reopen.ts` gekürzt. |
| `packages/domain/src/call-number.ts` — **gelesen**, Gegenprobe zu E-045 | `readFileSync` auf ausgeschriebenem Pfad | **Auflösung**, Registereintrag `callNummer`, Merkmal `checkCallNumber` | Diese Stelle ist die Gegenprobe zu einem Verbotsscan („die Kennzeichen gibt es überhaupt"). Fällt sie ins Leere, ist der Scan darüber grün, ohne etwas gesucht zu haben — genau die Bauart aus A-A-60. |
| `packages/domain/src/call-number.ts` — 2× Prosa (Formelanfänge, `ALLOWED_SHAPE`) | Prosa | derselbe Registereintrag | Ein Ort, ein Eintrag; die Prosa gibt keine Auskunft mehr, die niemand nachschlägt. |
| `packages/domain/src/characters.ts` — 2× Prosa (Abschnitt 16, Abschnitt 17) | Prosa | **Auflösung**, Registereintrag `zeichenklasse`, Merkmal `FORBIDDEN_NAME_CHARACTERS` | Beide Sätze behaupten „die Klasse liegt an **genau einer** Stelle, und zwar dort". Das ist der tragende Satz des Abschnitts, nicht eine Randnotiz. |
| `packages/domain/src/characters.ts` — **gemessen** in der Schnittstellenbeschreibung | `assert.match(beschreibung, /packages\/domain\/src\/characters\.ts/)` | **fail-closed und aufgelöst**: die Beschreibung muß **einen** Ort nennen, und dieser Ort muß der sein, an dem die Klasse heute liegt | Der Mustervergleich war grün, solange die Beschreibung diese Buchstaben führt — auch wenn es die Datei dort längst nicht mehr gibt. Ein Verweis, den niemand nachschlägt, ist genau das, wogegen der Prüfsatz steht. Zieht `characters.ts` um, nennt die Meldung jetzt beide Orte und sagt, daß die Beschreibung nachzuziehen ist. |
| `packages/export/src/base64.ts`, `render.ts`, `template.ts` | drei Importe | **Auflösung über den Modulgraphen**, unverändert | Node löst sie auf; zeigt eine ins Leere, bricht der Lauf **vor** dem ersten Prüfsatz ab und nennt die Angabe. Über den Paketnamen statt relativ ginge nur, wenn der Aufgabenbereich `@takt/export` in seine Abhängigkeitsliste nähme — das ist eine Änderung an `package.json` und liegt nicht in meiner Hoheit; die Begründung gegen die Paketabhängigkeit (Browserbündel) steht seit T-061 im Kopf. |
| `packages/storage/src/sqlite/open.ts` | Import | dito | dieselbe Begründung, dazu ausdrücklich: ein Bündel, das die Datenbank importieren **kann**, importiert sie irgendwann. |

Dazu die Stellen, die in derselben Familie liegen und mit umgestellt sind, obwohl sie im
Auftrag nicht einzeln genannt waren:

| Stelle | Antwort |
|---|---|
| `apps/local-api/src/routes/addin/service.ts` (gelesen, E-058 Absatz 1) | **Auflösung**, Eintrag `addinDienst`, Merkmal `findMatches` |
| `apps/local-api/src/routes/addin/` (Verzeichnis, `readdirSync`) | **Auflösung über einen Anker** (`index.ts` mit `mountAddinRoutes` — dieselbe Datei, an der auch der Import hängt) **plus Untergrenze** `>= 4` |
| `apps/local-api/openapi/takt-local-api.yaml` (3×) | **Auflösung**, Eintrag `schnittstelle`, Merkmal `/addin/todos` |

## Untergrenzen

Der Lauf war hier schon diszipliniert — sechzehn Mengenurteile trugen bereits eine
Untergrenze („greift ins Leere"). Zwei Lücken:

1. **`readdirSync` auf `routes/addin`** urteilte über eine Menge ohne Grenze. Ein leeres
   oder umgezogenes Verzeichnis hätte die leere Menge ergeben, und die Suche nach einer
   zweiten Fassung der Regel wäre grün gewesen, ohne gesucht zu haben. Jetzt: mindestens
   vier `.ts`-Dateien, sonst rot mit der gefundenen Zahl. Vier ist die heutige Menge — wer
   eine Datei streicht, sagt im selben Zug, welche.
2. **`files.length > 15`** gab es, aber **ohne Gegenprobe** — die Grenze selbst war eine
   unbelegte Zusage. Der Scan ist dafür auf ein übergebenes Verzeichnis umgestellt (bis
   T-249 stand `srcRoot` in der Funktion, und damit ließ sie sich nicht ins Leere laufen
   lassen). Die Gegenprobe fährt ihn über `scripts/` — ein Verzeichnis, das es **gibt** und
   das keine einzige Quelldatei führt — und mißt, daß die Grenze bei null nicht erfüllt ist;
   dazu, daß ein **fehlendes** Verzeichnis wirft und nicht still die leere Menge ergibt.

## Gegenproben

**Im Lauf selbst** (Abschnitt 0a, `Gegenprobe: was die Landkarte nicht findet, ist
ungemessen und nicht bestanden`): unbekanntes Paket, fehlende Datei, verschwundenes Merkmal,
leerer Inhalt (an der reinen Funktion `beanstandeInhalt`, damit beide Zweige ohne eine
angelegte Datei vorführbar sind) — und in die andere Richtung ein **falscher** Pfad im
Eintrag, der trotzdem den richtigen Fund ergibt.

**In einer Kopie**, auf einem erfundenen Arbeitsbaum im Scratchpad. Der geprüfte Code ist
zeilengleich aus `proof-addin.mjs` herausgeschnitten; der Baum ist erfunden (`@probe/domain`,
`@probe/dienst`), es kommt keine Datei des Bestands vor:

| Fall | Ergebnis |
|---|---|
| A unveränderter Baum | **grün** — `packages/domain/src/call-number.ts` |
| B Dateiumzug nach `src/features/call/` | **grün** — `packages/domain/src/features/call/call-number.ts` |
| C Paketumzug `packages/domain` → `apps/domain` | **grün** — `apps/domain/src/call-number.ts` |
| D Datei gestrichen | **rot**: „… gibt es nicht (mehr); die Suche nach „call-number.ts" mit „checkCallNumber" in @probe/domain ergab **0 Treffer** — … ist ungemessen, nicht bestanden" |
| E Datei da, Merkmal weg | **rot**: „… trägt „checkCallNumber" nicht mehr — …" |
| F Datei da, aber leer | **rot**: „… ist leer — …" (eigene Meldung, weil „trägt das Merkmal nicht" hier in die Irre führte) |
| G zweideutig, zwei Treffer | **rot**, und die Meldung nennt **beide** Fundorte |
| H Paket gestrichen | **rot**: „das Paket @probe/domain steht nicht im Arbeitsbaum — gefunden wurden: @probe/addin, @probe/dienst" |
| I Verzeichnis unverändert | **grün** — 4 Dateien |
| J Verzeichnisumzug `routes/addin` → `features/addin/routes` | **grün** — 4 Dateien |
| K Verzeichnis auf zwei Dateien geschrumpft | **rot**: „… führt nur 2 Dateien auf „.ts", erwartet sind mindestens 4 — …" |
| L Verzeichnis gestrichen | **rot**: „… ergab 0 Verzeichnisse — …" |

**Am ganzen Lauf**, in einer Kopie des Skripts neben dem Original (danach entfernt): ein
verstelltes Merkmal in einem Registereintrag ergibt **246/2**, und zwar an genau den beiden
Stellen, die es betrifft — der Prüfsatz zu E-058 Absatz 1 und der Landkartensatz in 0a —,
beide mit der Meldung, die die Datei und das fehlende Merkmal nennt.

## Die Verfeinerung des security-checkers

Im Kopf von 18f, im zweiten Aufzählungspunkt der Reichweite („Nicht gefangen wird Absicht
mit Schreibrecht"), steht jetzt ein Absatz: Die Zahl in `proof:route-policy` (A-A-56) zählt
die Kettenglieder und fängt damit das **elfte** — wer seine Tür als zusätzliches
`app.use('*', …)` schreibt, fällt dort auf. Sie fängt **keine Tür innerhalb der zehn
vorhandenen**: Steht die Tür in einem bestehenden Kettenglied, ändert sich keine Zahl —
nicht die zehn, nicht die vier, nicht die Reihenfolge der Namen. Verweis auf
`docs/bedrohungsmodell.md` Kapitel 34.2, wo das gemessen ist, und der Grund, warum der Satz
dort steht: Wer der Zahl mehr zuschreibt, hält eine Fläche für zugesperrt, die nur
beaufsichtigt ist — die Bauart aus R-25, gegen die A-A-55 geschrieben wurde. Im selben
Nachschlag, wie erbeten; keine Prüfung dazu, keine Zusage geändert.

## Zahlen

- `pnpm --filter @takt/outlook-addin proof:addin` — **248 bestanden, 0 fehlgeschlagen**
  (vorher 245/0).
- `pnpm typecheck` (Wurzel, alle acht Projekte plus `typecheck:test` und `typecheck:e2e`) —
  **grün**.
- `pnpm --filter @takt/outlook-addin typecheck` — **grün**.

**Die drei neuen Prüfungen, einzeln, und warum sie dazukommen:**

1. `T-249, Gegenprobe: die Untergrenze des Quelldateiscans greift wirklich` (Ende
   Abschnitt 0). Die Untergrenze gab es; ihre Gegenprobe nicht. Ohne sie ist die Grenze
   selbst eine unbelegte Zusage (A-A-60).
2. `die 5 fremden Orte dieses Laufs lösen sich auf` (Abschnitt 0a). Der Wächter vor allen
   Abschnitten, die in fremdem Quelltext lesen — und zugleich der über die **Prosa** dieser
   Datei: zwei der fünf Orte werden von keiner Prüfung gelesen, sondern in Kommentaren
   genannt.
3. `Gegenprobe: was die Landkarte nicht findet, ist ungemessen und nicht bestanden`
   (Abschnitt 0a). Ein Sucher, der nichts findet, ist der grünste von allen; ohne diese
   Zeile wäre die Landkarte selbst die nächste unbelegte Zusage.

Keine bestehende Prüfung ist gefallen, keine hat ihre Aussage geändert. Was 18f, Abschnitt
16, 18b, 18c und die Sperrliste behaupten, steht zeichengleich.

## Annahmen

1. **Die Untergrenze für `routes/addin/` ist die heutige Menge (vier).** Eine weichere
   Grenze (etwa zwei) hätte den Fall nicht gefangen, gegen den sie steht: ein Verzeichnis,
   das nach dem Umbau nur noch einen Teil führt. Wer eine Datei streicht, ändert die Zahl
   und sagt damit, welche — dieselbe Bauart wie `MIDDLEWARE_COUNT` und `ADDIN_FLAECHE`.
2. **Die Importe bleiben relative Pfade.** Sie über Paketnamen laufen zu lassen hieße,
   `@takt/local-api`, `@takt/storage` und `@takt/export` in die Abhängigkeitsliste des
   Aufgabenbereichs zu nehmen. Das steht seit T-061 als ausdrückliche Begründung im Kopf
   („ein Browserbündel, das den Dienst importieren **kann**, importiert ihn irgendwann"),
   und `package.json` liegt ohnehin nicht in meiner Hoheit.
3. **Der historische Pfad nach `apps/web` fällt, statt aufgelöst zu werden.** Ein Satz über
   den Stand von T-092 wird durch einen Umzug nicht falsch — er wird falsch, wenn man ihn
   als Wegweiser liest. Deshalb nennt er jetzt das Paket und nicht die Datei. Eine
   Auflösung wäre hier die teurere und die schwächere Antwort: Sie hinge an einer Datei, aus
   der dieser Lauf nichts liest.
4. **Die Landkarte findet einen Umzug, keine Streichung**, und das steht so im Kopf. Eine
   gestrichene Datei bedeutet, daß der Prüfsatz gegenstandslos geworden ist; das gehört
   gelesen und nicht geraten. Beide Fälle enden rot, und die Meldung unterscheidet sie an
   der Zahl der Treffer.
5. **`pnpm-workspace.yaml` wird eng gelesen**: nur die zusagenden Angaben der Form „Ordner,
   Schrägstrich, Stern". Die ausschließenden Angaben nehmen nichts weg, was hier gesucht
   wird, und ein halb verstandener Glob wäre schlechter als gar keiner. Findet die Landkarte
   kein Verzeichnis oder kein Paket, wirft sie.
6. **Abschnitt 0a steht hinter Abschnitt 0**, nicht davor. Die Landkarte wird von Abschnitt 0
   bereits benutzt (E-058 Absatz 1); der Prüfsatz darüber ist trotzdem kein Tor, sondern eine
   Prüfung wie jede andere. Eine Umnumerierung der bestehenden Abschnitte wäre der teurere
   Weg gewesen — auf „Abschnitt 18f", „Abschnitt 16" und „Abschnitt 4" zeigen fremde Papiere.

## Risiken

- **Die Suche im Paket ist eine Suche über den Dateinamen.** Zieht eine Datei um **und**
  wird dabei umbenannt, findet die Landkarte sie nicht — der Lauf wird rot und sagt, wonach
  er gesucht hat. Das ist der gewollte Ausgang (fail-closed), aber es heißt auch: Der
  Umzieher muß den Registereintrag anfassen. Das ist Absicht; ein Wächter, der jede
  Umbenennung stillschweigend mitmacht, mißt am Ende irgendeine Datei.
- **Zwei gleichnamige Dateien mit demselben Merkmal im selben Paket** ergeben rot. Der
  gebuchte Pfad hat Vorrang; die Suche greift erst, wenn er nicht trifft. Der zweideutige
  Fall (G) entsteht damit nur nach einem Umzug — und dort ist rot der richtige Ausgang: Die
  Landkarte soll nicht raten, welche der beiden Fassungen gemeint ist.
- **Der Suchlauf liest Dateien.** Er betritt `node_modules`, `dist`, `build`, `coverage`,
  `target` und `taskpane` nicht (das letzte ausdrücklich wegen der Bauergebnisse, die
  `apps/desktop/.gitignore` ausnimmt und die veraltete Kopien derselben Sätze führen). Er
  läuft nur, wenn der gebuchte Pfad nicht trifft — im unveränderten Baum also nie.
- **Sicherheit:** keine neue Netzverbindung, keine neue Adresse, kein neuer Schreibzugriff.
  Der Lauf liest zusätzlich `pnpm-workspace.yaml` und die `package.json`-Dateien des
  Arbeitsbereichs. Keine echte Call-Nummer, kein Kundenname, kein Zugangsdatum im Zulauf;
  der Gegenprobenbaum ist erfunden (`@probe/*`) und liegt im Scratchpad, nicht im Bestand.

## Offene Fragen

1. **An den Orchestrator, für die Umzugsaufträge:** Der Punkt, an dem die Landkarte
   aufhört, ist die **Umbenennung**. Wenn die Umstrukturierung Dateien nicht nur verschiebt,
   sondern auch umbenennt (`labels.ts` → `texte.ts`), gehört
   `apps/outlook-addin/scripts/proof-addin.mjs` in denselben Auftrag — nicht als Nacharbeit.
   Der Lauf sagt dann von selbst, welcher Eintrag betroffen ist; er sagt es nur eben rot.
2. **An den Orchestrator, `apps/local-api/scripts/openapi-reader.mjs`:** Der Lauf importiert
   diesen Leser aus fremder Hoheit. Fällt er beim Umzug in ein anderes Paket oder unter einen
   anderen Namen, bricht `proof:addin` vor dem ersten Prüfsatz ab. Das ist laut genug, aber es
   ist die einzige Stelle, an der dieser Lauf an einem **Skript** eines fremden Pakets hängt
   und nicht an dessen Quelltext.
3. **An den security-checker, nicht blockierend:** Der Absatz zu A-A-56 im Kopf von 18f sagt
   jetzt, was die Zahl nicht fängt. Ob derselbe Satz auch in `proof-route-policy.mjs` stehen
   sollte — dort, wo die Zahl steht —, ist nicht meine Hoheit und nicht gemessen.

## Nächster Schritt

Schritt 0 ist abgeschlossen; der Lauf ist umzugsfest, und die drei Wege in fremden Quelltext
(Import, Lesestelle, Prosa) haben jede eine benannte Antwort. Vorschlag für die nächste
Welle: dieselbe Messung an `proof-release-safety.mjs`, das laut Auftrag mehr Pfadstellen
führt als dieser Lauf — und dort dieselbe Unterscheidung anlegen, statt eine zweite Fassung
der Landkarte zu schreiben. Wenn zwei Läufe sie brauchen, gehört sie in eine geteilte Datei,
und dann ist die Frage der Hoheit vorher zu klären, nicht nachher.

---

Aufgabe: T-249-6 — Die Landkarte in `proof-addin.mjs` setzt auf der gemeinsamen Fassung auf
Status: fertig

Artefakte:
- `apps/outlook-addin/scripts/proof-addin.mjs` — der Unterbau der Landkarte entfällt und
  kommt aus `scripts/source-anchors.mjs`; dazu ein neuer Absatz im Kopf der Landkarte, die
  Übergehen-Liste als `enter`-Prädikat, `alsMessungsfehler` als roter Ausgang für die
  Auflösungen vor dem ersten Abschnitt, und drei nachgeführte Kommentarstellen.

Keine anderen Dateien angefaßt. `scripts/source-anchors.mjs` (frontend-dev),
`apps/local-api/**`, `packages/**`, `apps/web/**`, `apps/desktop/**` und jeder Produktivcode
sind unberührt — auch nicht vorübergehend. Die Gegenproben liefen ausschließlich über
verstellte Einträge **in meiner eigenen Datei**, gegen den unveränderten Baum, und wurden
zeichengleich zurückgenommen.

## Was jetzt von woher kommt

| bisher in `proof-addin.mjs` | jetzt |
|---|---|
| Aufwärtssuche nach `pnpm-workspace.yaml` samt `ARBEITSBAUM_MARKE` | `workspaceRoot()` |
| eigener Leser für `packages:` und eigene Paketkarte (`paketWurzeln`) | `locateWorkspacePackage(arbeitsbaum, name)` |
| `path.relative(...).split(path.sep).join('/')` | `displayPath(arbeitsbaum, datei)` |
| rekursiver Abstieg in `sucheImPaket` | `readTreeSync(..., betreten)` |
| rekursiver Abstieg in `quelldateienUnter` (`readdirSync` und `statSync`) | `readTreeSync(...)` — und das fehlende Verzeichnis wirft jetzt mit Grund statt als `ENOENT` |
| `readdirSync(verzeichnis).filter(...)` in `fremdesVerzeichnis` | `readTreeSync(..., () => false)` — `enter` verweigert jeden Ordner, also genau **eine** Ebene wie bisher |
| `existsSync` plus `statSync().isDirectory()` | `requireDirectory(...)` in einem `try`, dessen Wurf hier kein Befund, sondern der Anlass zur Suche ist |
| `existsSync` plus `statSync().isFile()` | ein Leseversuch, der **nur** `ENOENT`, `ENOTDIR` und `EISDIR` verschluckt; jeder andere Lesefehler bleibt ein Fehler |
| eigene Untergrenze in `fremdesVerzeichnis` | `requireAtLeast(...)` |

`node:fs` wird von diesem Lauf nur noch für `readFileSync` gebraucht; `existsSync`,
`readdirSync` und `statSync` sind aus dem Import verschwunden.

**Meins ist meins geblieben:** die fünf Einträge in `FREMDE_ORTE` samt ihren Merkmalen, die
Übergehen-Liste `NICHT_BETRETEN` (jetzt als `betreten`-Prädikat, das `readTreeSync` als
`enter` bekommt), `beanstandeInhalt` mit ihren beiden Meldungen, die Meldungen von
`fremdeQuelle` und `fremdesVerzeichnis` samt dem Satz „ungemessen, nicht bestanden", und
Abschnitt 0a mit seinen zwei Prüfungen.

## Der Wurf statt des Abbruchs

Die gemeinsame Fassung wirft `MissingSourceError`, statt den Prozeß zu beenden — die
Begründung von frontend-dev trägt: Ein Baustein mit `process.exit` läßt sich nicht
gegenprüfen, weil eine Prüfung, die seinen Abbruch messen will, mit ihm stürbe.

Innerhalb von `check()` brauchte dieser Lauf dafür **nichts**: Der Rahmen fängt seit T-019
jeden Wurf und macht daraus eine `FEHL`-Zeile samt Zählung. Gebraucht wird der Umweg nur für
die zwei Auflösungen **vor** dem ersten Abschnitt — die Wurzel des Arbeitsbaums und der
Quelldateiscan des Add-ins. Dafür steht jetzt `alsMessungsfehler(was, aufloesen)` da: vier
Zeilen, die `MissingSourceError` in eine Zeile in der Form aller anderen roten Zeilen
übersetzen und mit Rückgabewert 1 enden. Ein Fehler anderer Herkunft geht unverändert durch.

## Zahlen

- `pnpm --filter @takt/outlook-addin proof:addin` — **248 bestanden, 0 fehlgeschlagen**.
  Unverändert gegenüber T-249-3, wie verlangt: keine Prüfung dazu, keine weg, keine mit
  geänderter Aussage.
- `pnpm typecheck` (Wurzel, alle acht Projekte plus `typecheck:test` und `typecheck:e2e`) —
  **grün**.

## Gegenproben, an dieser Fassung erneut gefahren

Alle fünf über verstellte Einträge in meiner eigenen Datei, danach zeichengleich
zurückgenommen; der letzte Lauf jeder Zeile bestätigt wieder 248/0.

| Gegenprobe | Erwartung | Ergebnis |
|---|---|---|
| Drei Orte umgezogen, Merkmale unverändert: `routes/addin/service.ts` nach `features/addin/service.ts`, das Verzeichnis `routes/addin` nach `features/addin`, `domain/src/call-number.ts` nach `domain/src/features/call/call-number.ts` | die Landkarte zieht mit, **grün** | **248/0** — der Auflöser findet Datei wie Verzeichnis weiterhin über Merkmal und Anker |
| dazu ein verschwundenes Merkmal (`checkCallNumber` wird `zzStillGestrichen`) | **rot**, benannt | **246/2**: Abschnitt 0a und die Gegenprobe zu E-045, beide mit Datei und fehlendem Merkmal im Satz |
| Merkmal der Schnittstellenbeschreibung verstellt (`/addin/todos` wird `zzGestrichen`) | **rot** an allen Stellen, die daraus lesen | **244/4**, jede Meldung nennt `apps/local-api/openapi/takt-local-api.yaml` und den Zweck |
| Umzug **mit Umbenennung** (`service.ts` wird `dienst.ts`) | **rot** — die bekannte Grenze der Landkarte | **246/2**, mit „0 Treffer" in der Meldung. Das Risiko aus T-249-3 gilt unverändert |
| Der Quellbaum des Add-ins ist weg (`src` wird `src-umgezogen`), also ein Fehlschlag **vor** dem ersten Prüfsatz | eine rote Zeile, kein Stapelbild, Rückgabewert 1 | genau das: `FEHL die Quelldateien des Add-ins auflösen` samt dem Satz „Ein Verzeichnis, das nicht da ist, ist kein bestandener Prüfsatz", Rückgabewert 1 |

Der Punkt, auf den es dem Auftrag ankam, ist damit gemessen: Die Umstellung des Auflösers
hat den Wächter **nicht** stumm gemacht. Nicht gefunden endet weiterhin rot.

## Die eine Meldung, die sich bewegt hat

Keine Zahl hat sich bewegt, **ein** Satz schon: Die Untergrenze in `fremdesVerzeichnis` sagt
jetzt den Satz der gemeinsamen Fassung („Über diese Menge urteilt der Lauf. Ist sie zu klein,
urteilt er über Dateien, die er nicht gelesen hat; das Ergebnis wäre grün und hohl.") statt
meines bisherigen „… ist ungemessen, nicht bestanden". Der Zweck steht im Ortsargument, damit
die Meldung weiterhin nennt, **welche** Messung ausgefallen ist. Ich habe die Wortwahl der
gemeinsamen Fassung vorgezogen, weil die Alternative gewesen wäre, eine dreizeilige
Mengenprüfung neben `requireAtLeast` ein zweites Mal hinzuschreiben — genau die Bauart, gegen
die diese Welle steht. Die Aussage ist dieselbe; kein Prüfsatz mißt diesen Wortlaut. Falls
ein Reviewer den Satz „ungemessen, nicht bestanden" hier als tragend ansieht, nehme ich meine
Meldung zurück in denselben Aufruf — das ist eine Zeile.

## Was die gemeinsame Fassung mitbringt und meine nicht hatte

- **Doppelte Paketnamen** werden gemeldet statt still überschrieben. Meine Karte hätte bei
  zwei Paketen gleichen Namens das zuletzt gelesene behalten und wäre grün geblieben.
- **Feste Pfade** in `pnpm-workspace.yaml` werden als Paketort mitgelesen; meine Fassung sah
  nur die Form „ordner/stern" an. Eine **unbekannte** Musterform wirft jetzt, statt still zu
  fehlen.
- Die Wurzelsuche und die Paketkarte werden **zwischengespeichert**; der Lauf liest
  `pnpm-workspace.yaml` und die `package.json`-Dateien einmal statt bei jedem Aufruf.

## Annahmen

1. **Die Übergehen-Liste bleibt hier.** Was ein Lauf übergehen darf, weiß nur der Lauf;
   `taskpane/` etwa ist das Bauergebnis dieses Pakets und trägt veraltete Abschriften
   derselben Sätze. In die gemeinsame Fassung gehörte sie nicht — dort wäre sie der
   Sammelordner, den der Auftraggeber ausgeschlossen hat.
2. **`fremdesVerzeichnis` bleibt einstufig.** `readTreeSync` liest rekursiv; hier bekommt es
   `enter: () => false` und damit genau die eine Ebene, über die dieser Prüfsatz seit T-249-3
   urteilt. Ein rekursiver Abstieg hätte Dateien aus Unterordnern in eine Menge gezogen, über
   die der Satz nichts behauptet — und damit die Zahl bewegt.
3. **Der Leseversuch als schnelle Antwort** ersetzt `existsSync` plus `statSync().isFile()`.
   Er verschluckt genau die drei Gründe, die „liegt dort nicht (als Datei)" heißen; jeder
   andere Lesefehler wird geworfen, statt zur Suche umgedeutet zu werden.
4. **`quelldateienUnter` ist mit umgestellt**, obwohl es den **eigenen** Baum liest. Es war
   die letzte Stelle mit `readdirSync` und `statSync` in dieser Datei, und ihre Gegenprobe
   („ein fehlendes Verzeichnis ergibt nicht still die leere Menge") wird durch
   `requireDirectory` besser bedient als durch ein rohes `ENOENT`. Die Gegenprobe selbst ist
   unverändert und weiterhin grün.

## Risiken

- **Der Lauf hängt jetzt an einer Datei außerhalb jedes Pakets.** `scripts/source-anchors.mjs`
  ist zur Laufzeit des Nachweises eine harte Voraussetzung; fehlt sie, bricht `proof:addin`
  vor dem ersten Prüfsatz mit einem nicht auflösbaren Import ab. Das ist laut und richtig, es
  ist aber eine neue Kante — allerdings **keine** im Modulgraphen des Add-ins: Die Zeile steht
  in einem Bauskript, nicht im Browserbündel, und `package.json` ist unberührt.
- **Die Grenze der Landkarte ist unverändert:** Umzug ja, Umbenennung nein (Gegenprobe vier).
- **Sicherheit:** keine neue Netzverbindung, keine neue Adresse, kein neuer Schreibzugriff.
  Gelesen wird wie bisher `pnpm-workspace.yaml` und die `package.json`-Dateien des
  Arbeitsbereichs, jetzt seltener. Keine echte Call-Nummer, kein Kundenname, kein
  Zugangsdatum; die Gegenproben benutzen ausschließlich erfundene Pfade in meiner eigenen
  Datei.

## Offene Fragen

1. **An den Orchestrator, für den Commit:** `scripts/source-anchors.mjs` ist im Arbeitsbaum
   noch **unversioniert** (`git status`: `?? scripts/`). Dieser Lauf setzt darauf auf. Beides
   gehört in denselben Commit, sonst ist `proof:addin` auf einem frischen Klon rot, bevor es
   den ersten Prüfsatz gesehen hat.
2. **An den Orchestrator, nicht meine Hoheit:** `apps/local-api/scripts/source-resolve.mjs`
   liegt noch da (ebenfalls unversioniert). Solange sie steht, gibt es die Idee zweimal — sie
   gehört mit derselben Welle weg, sonst ist der Zweck der Zusammenführung nur halb erreicht.
   Ich habe sie nicht angefaßt.
3. **An den Code-Reviewer, nicht blockierend:** Ob `requireAtLeast` mit dem Zweck im
   Ortsargument (siehe oben, „Die eine Meldung, die sich bewegt hat") die richtige Abwägung
   ist, oder ob die eigene Meldung mit dem Satz „ungemessen, nicht bestanden" hier schwerer
   wiegt als die Wiederverwendung.

## Nächster Schritt

`proof-addin.mjs` ist umgestellt und mißt zeichengleich dasselbe wie vorher. Vorschlag für
die nächste Welle: die Gegenproben dieser Welle **einmal** als Prüffall festhalten, statt sie
je Lauf von Hand zu fahren — die Bausteine sind jetzt gegenprüfbar, weil sie werfen statt zu
beenden, und genau dafür war das der Grund. Der Ort dafür liegt bei unit-tester, nicht bei
mir.
