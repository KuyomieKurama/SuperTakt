# T-351 — Zweiter Abgleich: die Antworten auf B-01 bis B-07 geprüft

**Rolle:** spec-ux-reviewer. **Stand:** 2026-09-13, Welle 7 nach T-344/T-345.

**Gegen welchen Stand gelesen.** `docs/spec.md` Abschnitt 25 (A-25.1 bis A-25.7, Zeilen 520–535),
`docs/design/fensterfeste-flaechen.md` (T-323, Fassung nach T-344),
`docs/design/fensterfeste-flaechen-fluss.md` (T-322, dritte Fassung), `decisions.md` E-112 bis
E-116, `board.md` Zeilen 11–17 (**der Auftrag des Auftraggebers vom 2026-09-12 im Wortlaut**),
`tests/e2e/viewport-fit.spec.ts` und `docs/testplan.md` Abschnitt 34. Wo ich den Bestand gelesen
habe, ist es der **Arbeitsbaum auf `feature/outlook-anhaenge-und-versionspruefung` nach `311b26e`,
unversioniert** — am Quelltext, nicht im Browser gemessen; in dieser Umgebung steht kein Node zur
Verfügung. `apps/web/**` bewegt sich unter mir (T-348), jede Zeilennummer dort ist ein Stand.

**Nicht geprüft, weil im Auftrag ausgenommen:** `apps/local-api/src/features/version/**`,
`scripts/**`, `apps/local-api/src/features/timer/**`, die zwei blockierenden Befunde aus
T-346/T-347 (`classTokensOf`, `createPortal`).

---

## Urteil

**Nicht freigegeben.** Nacharbeit, blockierend: **B-16, B-17, B-18, B-19, B-20**.

Vier davon (B-16 bis B-18, B-20) sind **Papier- und Spezifikationsarbeit ohne eine Zeile Code**.
B-19 ist die eine Stelle, an der ein Satz aus B-04 noch offensteht — und die Stelle, an der der
Bestand heute **anders** ist, als das Board glaubt.

**B-02, B-03, B-07 gelten als beantwortet.** Die drei Widersprüche sind in T-344 entschieden,
jeder mit seiner Zahl und seiner Herkunft, und die Berichtigungsform ist durchgehalten. B-05s
Einschränkung ist in 7.4 wörtlich eingearbeitet. Das ist saubere Arbeit; die Befunde unten sind
das, was sie **nicht** getroffen hat.

---

## 1. Der neue Abschnitt 25 gegen den Auftrag — der wichtigste Punkt

**Zuerst das Ergebnis der Deckungsprüfung Satz für Satz.** Der Auftrag steht in `board.md:13-17`;
Abschnitt 25 in `docs/spec.md:520-535`.

| Auftragssatz | Deckung in Abschnitt 25 | Trägt? |
|---|---|---|
| „Jede Ansicht richtet Breite und Höhe nach dem verfügbaren Inhaltsbereich … unter Abzug von Kopfleiste, Navigation und Seitenleiste" | **A-25.1** Satz 1 | **ja, zeichengleich** |
| „mitwachsend bei Fenstergrößenänderung" | A-25.1 Satz 2 | **ja** |
| „Kein Inhalt darf die Seite über das Fenster hinaus verlängern oder verbreitern; läuft etwas über, läuft ausschließlich der betroffene Inhaltsbereich" | **A-25.2** | **ja, zeichengleich** |
| „Einheitlich auf allen Ansichten" | A-25.3 Satz 1 | ja — der Rest von A-25.3 kommt aus E-112 Punkt 1 und 2 und ist gedeckt |
| „bestehendes Design und bestehende Funktion unangetastet" | **A-25.7** Satz 1 | ja dem Wortlaut nach — **und genau dort liegt B-18** |
| — | **A-25.4** | aus E-115 und `tauri.conf.json`, gedeckt |
| — | **A-25.5** | aus T-344/B-07, **sagt mehr als beide Papiere** → B-17 |
| — | **A-25.6** | aus E-116, gedeckt; ein Wort zu weit → B-27 |

**Der Abschnitt deckt den Auftrag vollständig ab.** Er sagt an drei Stellen mehr, als Auftrag und
Entscheidungen hergeben, und an einer Stelle sagt er **weniger**, als E-112 ausdrücklich
entschieden hat. Das ist die eine Sache, die ein nachgetragener Abschnitt nicht darf.

### B-16 · blockierend · Geltungsbereich · `docs/spec.md:527-535` gegen E-112 letzter Absatz

**Abweichung.** Abschnitt 25 trägt **keine Ausnahme**. E-112 schließt mit einem eigenen Absatz:

> **Zwei Flächen sind ausgenommen und bleiben es:** die Startbilder (`.boot`) und die Musterseite
> — sie hängen nicht in dieser Hülle. Der Outlook-Aufgabenbereich ebenfalls … Sollte der
> Auftraggeber ihn einschließen wollen, ist das ein eigener Auftrag und nicht diese Regel.

Damit gilt A-25.1 und A-25.2 nach dem Wortlaut der Spezifikation für Startbilder, Musterseite und
den Outlook-Aufgabenbereich. Drei Folgen, alle konkret:

1. **Der Bestand ist nach dem neuen Wortlaut in Verletzung.** T-323 8.7: „`designsystem.html` …
   **rollt weiter das Dokument**, und `base.css` verzichtet genau deswegen auf `overflow: hidden`
   an `body` … Dasselbe für die Startbilder." 8.6: „Die freistehenden Startbilder außerhalb von
   `.app` behalten `min-height: 100dvh` und **dürfen weiterhin das Dokument rollen**." Das ist
   A-25.2 wörtlich widersprochen — von einem freigegebenen Papier, für eine Fläche, die niemand
   ändern wollte.
2. **Eine offene Frage an den Auftraggeber ist still beantwortet worden**, und zwar in die
   Gegenrichtung zu beiden Papieren. T-323 offene Frage 4 und `board.md:110` fragen: „Gilt
   ‚fensterfest' auch für den Aufgabenbereich des Outlook-Add-ins?" Beide Papiere nehmen ihn
   **nicht** an. Ein Abschnitt, der ohne Ausnahme geschrieben ist, sagt ja — in einer Datei, die
   der Auftraggeber nicht gelesen hat, und in dem Abschnitt, der ausdrücklich als
   bestätigungsbedürftig gekennzeichnet ist.
3. **Der nächste Leser hat keinen Weg zurück.** Die Ausnahme steht heute in `decisions.md` und in
   zwei Designpapieren; die Spezifikation ist nach `CLAUDE.md` die verbindliche Quelle. Bei
   Widerspruch gewinnt sie.

**Vorschlag.** Ein achter Satz, aus E-112 abgeschrieben statt neu formuliert:
**A-25.8** *„Ausgenommen sind Flächen, die nicht in der Anwendungshülle hängen: die Startbilder,
die Musterseite und der Aufgabenbereich des Outlook-Add-ins. Ob der Aufgabenbereich
eingeschlossen wird, ist ein eigener Auftrag (E-112)."* Damit ist zugleich die Frage aus
`board.md:110` in der Spezifikation dort sichtbar, wo sie gestellt wurde.

### B-17 · blockierend · A-25.5 · `docs/spec.md:533` gegen T-323 8.5 und T-322 R-4/AK-15

**Abweichung.** A-25.5 Satz 1 lautet ohne Einschränkung: *„Jeder Laufbereich ist mit der Tastatur
erreichbar und trägt einen zugänglichen Namen."* Beide Papiere führen dazu **zwei benannte
Ausnahmen**, und beide sind von T-344 ausdrücklich und mit guter Begründung entschieden:

- **Der Lade- und Fehlerzustand der Todo-Detailansicht trägt keinen Namen** (T-323 8.5 Absatz
  „Die eine benannte Ausnahme bleibt", T-322 R-4, AK-15). Der Grund ist besser als mein eigener
  Vorschlag aus T-343 B-12: „Todo wird geladen" wäre im **Fehler**zustand derselben Fläche unwahr,
  und ein Name, der in einem von zwei Zuständen stimmt, ist schlechter als keiner.
- **Die Laufstrecke eines Bausteins bekommt weder Halt noch Namen** — `.kcolumn__body`, die beiden
  `.table-wrap` der Exportgruppen (T-323 8.5 Tabelle „Wer einen Tabulatorhalt bekommt", AK-15).
  Für sie gilt die ausdrücklich **schwächere** Zusage aus T-322 5.3.

Nach dem Wortlaut von A-25.5 sind beide Entscheidungen Verstöße gegen die Spezifikation. Das ist
dieselbe Fehlerform wie B-16, nur andersherum: Dort fehlt eine Ausnahme, die entschieden ist;
hier fehlen zwei. Und es entwertet die Freigabe, die ich zu B-12 erteilt habe: Wer A-25.5 liest
und den Papieren folgt, baut gegen die Spezifikation.

**Vorschlag.** A-25.5 um zwei Halbsätze ergänzen, ohne eine Zahl zu nennen:
*„Jeder Laufbereich einer Ansicht ist mit der Tastatur erreichbar und trägt einen zugänglichen
Namen aus vorhandenem Text; eine Fläche, für die es keinen in allen ihren Zuständen wahren Namen
gibt, trägt keinen. Die Laufstrecke eines Bausteins innerhalb eines Laufbereichs ist über den
Fokus ihrer Kinder erreichbar; in keiner Achse, in der Inhalt liegt, ist der Lauf abgeschaltet."*

### B-18 · blockierend · A-25.7 gegen A-25.5 und gegen zwei erteilte Freigaben · `docs/spec.md:535`

**Abweichung.** A-25.7 lautet: *„Bestehendes Design und bestehende Funktion bleiben unverändert."*
Als **Auflage an** den Umbau (so stand es im Auftrag) ist der Satz richtig. Als **Anforderung der
Spezifikation** widerspricht er drei Dingen, die auf demselben Stand entschieden sind:

1. **Der umbrochene Bildschirmkopf des Kanban.** Das ist eine Änderung am bestehenden Design,
   sie ist gemessen (7.4: zwei Zeilen unterhalb 1259 px), und ich habe sie in T-343 B-05
   ausdrücklich **einzeln freigegeben**. A-25.7 nimmt diese Freigabe wörtlich zurück.
2. **Der Zusatz der Bereichsschiene, der unter 44 rem Höhe weicht** (7.5). T-323 schreibt selbst:
   „A-25.7 ist damit nicht berührt, E-087 nicht ausgelöst." Die Begründung trägt für E-087 (der
   Zusatz ist nirgends die einzige Fassung), aber sie trägt nicht für „bestehendes Design bleibt
   unverändert": Bei 1024 × 640 ist der Zusatz heute sichtbar und wird es nicht mehr sein.
3. **`.board` bekommt Halt, Rolle und Namen** (T-344, Übergabe Punkt 2) — eine Änderung der
   bestehenden **Funktion**, und zwar eine, die **A-25.5 verlangt**. Die beiden Sätze stehen in
   demselben Abschnitt und widersprechen einander.

Das ist nicht theoretisch: Beide Papiere berufen sich **bereits** auf A-25.7, um Gestaltung
abzulehnen (T-323 10 „AK-05, A-25.7"; T-322 R-5). Der Satz trägt also schon Gewicht, bevor er
bestätigt ist.

**Vorschlag.** A-25.7 an die Sache binden, statt an den Zustand:
*„Der Umbau ändert von sich aus kein Aussehen und keinen Bedienweg. Wo er eines ändern muß, ist
die Änderung einzeln benannt und freigegeben — heute: der umbrochene Bildschirmkopf des Kanban
(T-343 B-05) und der Zusatz der Bereichsschiene bei knapper Höhe (T-323 7.5). Es entsteht kein
neuer Oberflächentext und es fällt keiner weg."* Damit bleibt der Satz scharf und wird nicht bei
jeder nächsten Ausnahme gelockert — das ist die Lehre aus 7.1 („eine Zusage, die man an der
Grenze beendet, ist mehr wert als eine, die man jede Welle lockert"), auf ihn selbst angewandt.

### B-26 · nicht blockierend · A-25.3 · `docs/spec.md:531`

**Abweichung, zwei kleine.** (a) *„ein fester Teil, der die Auswahl steuert"* gilt nicht für jede
Ansicht: Dashboard (S-01) und Todo-Detail (S-03) haben keine Auswahl, ihr fester Teil ist Titel
und Aktion. E-112 Punkt 1 ist genauer formuliert — es legt die **Naht** unter die Steuerung,
statt jeder Ansicht eine zu unterstellen. (b) Der **eigentliche Satz des Auftraggebers fehlt**:
Seine Beanstandung war „eine Steuerung, die wegläuft" (T-322 Abschnitt 0). E-112 Satz 1 und AK-06
sagen, was daraus folgt — die Steuerung bleibt **an jeder Bildlaufstelle** sichtbar und bedienbar.
Abschnitt 25 sagt das nirgends; es ist aus A-25.2 nur zu schließen. AK-06 hat damit als einziges
zentrales Akzeptanzkriterium keine ID (die Deckungstabelle in T-322 führt es nicht auf).

**Vorschlag.** A-25.3 Satz 1 auf die Naht umstellen und den Satz aus E-112 aufnehmen: *„Die Naht
liegt in jeder Ansicht unter dem, was die Auswahl steuert. Titel, Primäraktion, Bereichsreiter
und Filterleiste samt Zählzeile bleiben an jeder Bildlaufstelle sichtbar und bedienbar."*

### B-27 · nicht blockierend · A-25.6 · `docs/spec.md:534`

**Abweichung.** *„Sie ist vollständig sichtbar"* ist ein Wort zu weit. `.dialog__body--form` ist
seit `viewport-layout.css` ein eigener Laufbereich — ein langer Formulardialog **läuft in sich**,
und das ist gewollt. AK-25 formuliert es richtig und meßbar: „Beide Knöpfe der Rückfrage vor dem
Öffnen einer Datei sind ohne Bildlauf sichtbar."

**Vorschlag.** „vollständig sichtbar" durch „mit ihren Bestätigungs- und Abbruchknöpfen ohne
Bildlauf sichtbar" ersetzen. Sonst ist der nächste Dialog mit laufendem Rumpf ein
Spezifikationsverstoß.

---

## 2. Die beiden Papiere gegeneinander — ist der Widerspruch gewandert?

**Die drei alten sind weg, und sie sind richtig weg.** Zeichengleich nachgelesen:

| Befund | Stand |
|---|---|
| **B-02** A8 bei 1024 × 640 | T-323 9.6 Punkt 2 nimmt den Rahmen **nur unterhalb 960 × 640** aus; 9.2 behält die Größe mit umgekehrtem Vorzeichen; T-322 R-3a nennt denselben Fall unverändert einen Fehler. **Deckungsgleich.** |
| **B-03** „getragen" | T-323 7.1 führt **einen** Begriff; die zweite Zeile heißt „**Bedienbar im Browserbetrieb**" und sichert AK-24 zu, nicht AK-02. T-322 Kopf und R-3a Punkt 1 sagen dasselbe. **Deckungsgleich**, und die Rechnung (188 px Kopf gegen 175 px Budget) macht daraus eine Grenze statt einer Lockerung. |
| **B-07** Sprungmarke | Beide Papiere: **Inhaltshalt**, nicht der Kasten, der so heißt. AK-14 verlangt **null** Zwischenschritte; die Zuordnungstabelle ist in beiden gleich. **Deckungsgleich.** |
| **7.5** Bereichsschiene | Neu, beantwortet OF-6 aus dem Flußpapier, das dort darauf verweist. Der gewählte Weg ist der einzige ohne neue Gestalt, die drei Wege sind gegeneinander abgewogen, die Schwelle ist gerechnet und die fehlende Messung ist als fehlend benannt. **Trägt.** |

**Gewandert ist er an eine Stelle, und dort ist er neu.**

### B-20 · blockierend · A9 (c) / AK-14 (c) gegen T-323 8.5 Punkt 1 · S-05 Zeiterfassung

**Abweichung.** Beide Papiere verlangen als dritten Teil der neuen Zusicherung:

> **(c)** nach dem Sprung bewegt `Bild ab` (im Kanban `Pfeil rechts`) die Bildlaufstelle **genau
> dieses Kastens**.

Dasselbe Papier begründet drei Absätze weiter oben das Gegenteil für die Zeiterfassung (8.5
Punkt 1): Fällt sie unter 68 rem untereinander, hört Laufbereich A auf zu laufen
(`viewport-layout.css`, `overflow-y: visible`), „und Bild-ab auf A rollt dann **den Rahmen** — das
tut der Browser von selbst, und deshalb braucht die Marke keine zweite Kennung".

**Die beiden Sätze treffen sich an zwei der vier getragenen Meßgrößen.** 68 rem sind 1088 px;
`viewport-fit.spec.ts:318` rechnet mit derselben Zahl. Von den vier getragenen Größen liegen
**960 × 640 und 1024 × 640 darunter**. Wer A9 (c) baut, wie es dasteht, bekommt die Zeiterfassung
an zwei von vier Größen rot — für ein Verhalten, das dasselbe Papier ausdrücklich für richtig
erklärt. Und dann wird gelockert, statt berichtigt: genau der Fehlermodus, vor dem 9.6 und R-k
warnen. Der Auftrag für A9 steht bereits in `board.md:543`.

**Vorschlag.** (c) um sechs Wörter erweitern, in **beiden** Papieren zeichengleich: *„… bewegt die
Bildlaufstelle genau dieses Kastens **oder die seines nächsten laufenden Vorfahren**"* — mit der
Begründung aus 8.5 Punkt 1 als Satz daneben. Was A9 messen soll, ist „Bild-ab bewegt etwas, und
zwar den Inhalt, auf dem der Fokus steht", nicht die Identität des Kastens.

### B-21 · nicht blockierend · „Laufbereich" heißt wieder zweierlei

**Abweichung.** T-322 R-4 (ergänzt T-344) legt den Begriff eng: *„Ein Laufbereich ist eine Fläche,
die **Abschnitt 4 dieses Papiers** als solche nennt … die Laufstrecke eines **Bausteins** — eine
Kanban-Spalte, eine Tabelle innerhalb des Laufbereichs — auch nicht."* T-323 9.6 Punkt 1 legt ihn
weit: *„**Die Menge der Laufbereiche** ist `.screen__body:not(--frame)`, `.runarea` und
**`.kcolumn__body`**."* Dieselbe Menge trägt im gebauten Lauf den Namen `A8_RUN_AREA_SELECTORS`
(`viewport-fit.spec.ts:317`).

Sachlich ist beides richtig — A8 fragt „wird abgeschnitten", R-4 fragt „braucht einen Halt", und
die Mengen dürfen verschieden sein. Nur heißen sie gleich, in Papieren, die vor drei Tagen an
genau dieser Fehlerform zehn gemessene Verstöße gekostet haben (B-03). Und A9 (a) spricht von
„eine Laufstrecke", A-25.5 von „jeder Laufbereich" — beide erben die Doppeldeutigkeit.

**Vorschlag.** In T-323 9.6 Punkt 1 ein Wort: „Die Menge der **gemessenen Laufstrecken**". Der
Begriff „Laufbereich" bleibt dann für das, was R-4 und A-25.5 meinen.

### B-22 · nicht blockierend · eine Zahl, die T-334 widerlegt hat, steht ohne ihre Widerlegung

**Abweichung.** T-323 offene Frage 3 (geschlossen) und offene Frage 5 (offen) tragen beide:
*„auf dem Board gemessen **537 px** (Titel, zweizeiliger Erklärsatz, Umschalter, ‚Spalten
verwalten') plus 36 px Werkzeugzeile bei 588 px Inhaltshöhe — **91 % des Inhaltsbereichs** für die
Steuerung, und zwar an der getragenen Untergrenze 960 × 640"*, und daraus: *„Der Rückfall ist auf
dem Board also nicht der Ausnahmefall, sondern der Regelfall am unteren Rand."*

Die Meßtabelle in **7.4 desselben Papiers** sagt: 536,8 px ist die Kopfhöhe **vor** T-334; danach
sind es bei 960 px **129,8 px**. Der feste Teil liegt damit bei rund 166 px gegen 500 px Budget —
28 %, nicht 91 %. Die Zahl ist im selben Papier widerlegt und steht an zwei Stellen ohne den
Vermerk, der die Methode dieses Papiers ausmacht („die widerlegte Fassung bleibt stehen, und
daneben die Zahl, die sie widerlegt hat").

Das ist nicht nur Kosmetik: OF-5 (Erklärsatz aus dem Bildschirmkopf) wird mit **drei** unangenehmen
Zahlen begründet, und eine davon existiert nicht mehr. Die beiden anderen (1259 px Schwelle,
20,7 px Luft) reichen; sie sind gemessen und aktuell.

**Vorschlag.** An beiden Stellen die 537 px als Stand vor T-334 kennzeichnen und die 129,8 px
daneben setzen. OF-5 bleibt richtig — mit zwei Zahlen statt drei.

### B-23 · nicht blockierend · eine Zusage im Quelltext, die der Bestand nicht hält

**Abweichung.** `apps/web/src/styles/viewport-layout.css:723-724` (Stand `311b26e`, unversioniert):

> Dasselbe wie `.runarea`, eine Ebene tiefer und unter eigenem Namen. **Die Spalte bringt ihren
> Namen und ihren Tabulatorhalt aus `BoardColumn.tsx` mit.**

Gebaut ist `apps/web/src/features/board/Kanban.tsx:350`: `<div className="kcolumn__body">
{children}</div>` — **kein `tabIndex`, keine Rolle, kein `aria-label`**. Der Name liegt auf
`<section className="kcolumn" aria-label={…}>` (`:317`), also **nicht** auf dem Bildlaufkasten.

Sachlich ist der Bestand seit T-344 richtig: AK-15 und T-323 8.5 sprechen `.kcolumn__body`
ausdrücklich **keinen** Halt und **keinen** Namen zu. Falsch ist der Kommentar — und er hat
schon einmal gewirkt: Meine eigene Einschätzung in T-343 B-06 („`.kcolumn__body` bringt Namen und
Halt mit") stammt aus dieser Zeile und nicht aus dem Markup. Ein Kommentar, der eine Eigenschaft
zusichert, die das Element nicht hat, ist ein Prüfer, der zweimal dasselbe glaubt.

**Vorschlag.** Zwei Sätze austauschen: „Die Spalte ist eine Laufstrecke eines **Bausteins**
(T-323 8.5): kein Halt, kein eigener Name; erreichbar über den Fokus ihrer Karten. Ihr Name steht
auf `.kcolumn`." Gehört frontend-dev, liegt in T-348s Datei — in dieselbe Welle hängen.

---

## 3. Die Zusicherungen gegen den gebauten Lauf — sagt ein Papier noch etwas im Präsens?

### B-19 · blockierend · `tests/e2e/viewport-fit.spec.ts` · A-25.2, A-25.4, A-25.5, E-115, E-099 Punkt 3

**Die gute Hälfte zuerst, und sie ist groß.** A8 ist gebaut, die **beiden** Untergrenzen sind
gebaut und getrennt geprüft (`:651-660`), A7s zweite Hälfte läuft über 44 Kombinationen
(`:596-623`), A2 ist in stark und schwach geteilt (`:540-577`), die Selbstprüfung
`GETRAGEN_SIZES.length === 4` (`:499`) fängt die stille Verschiebung der Schwelle, und die
Gegenprobe („Rot zuerst") ist **wirklich gefahren** statt behauptet. Der Satz aus T-323 9.4 —
„Er ist jetzt zusätzlich zugesichert" — ist damit im Kern wahr geworden. Das war B-04s Kern.

**Vier Sätze stehen trotzdem noch im Präsens, die der Lauf nicht mißt.**

**(a) A2a fehlt vollständig — und es ist die waagerechte Achse, also „der schwerste denkbare
Fehler dieses Umbaus".** T-323 9.1 sagt zeichengleich: *„**A2a** … `.app__main`:
`scrollWidth ≤ clientWidth + 1`, auf **jeder** Ansicht und in **jeder** Fenstergröße bis
320 × 256 (AK-02a)"*, und 9.1 A2 sagt ausdrücklich: „**Die Breitenhälfte wandert in A2a und gilt
ohne Untergrenze.**" Gebaut ist das Gegenteil: `viewport-fit.spec.ts:540-559` prüft
`main.scrollWidth` **nur innerhalb von `if (getragen)`**; unterhalb der getragenen Größe
(`:560-577`) mißt A2b ausschließlich `getComputedStyle(.app__main).overflowY !== 'hidden'`. Die
Breite wird dort **gar nicht** angesehen.

Damit ist genau der Fall unbewacht, der historisch aufgetreten ist: T-322 R-3a listet
`board 640 × 480: 817/640 Breite` und `board 960 × 640: 825/720 Breite` als **Schnitt, also
Fehler**. Der zweite liegt im getragenen Bereich und wäre gefangen; der erste nicht. A-25.4 sagt
für genau diesen Bereich „abgeschnitten wird nichts, unerreichbar wird nichts" — der Lauf mißt
davon nichts. `overflow-y` ist kein Stellvertreter für „nichts abgeschnitten".

**(b) A8 nimmt den Rahmen weiterhin in *jeder* Größe aus — der einzige bekannte
E-115-Verstoß ist grün.** `:317`:

```ts
const A8_RUN_AREA_SELECTORS = ['.screen__body:not(.screen__body--frame)', '.runarea', '.kcolumn__body'] as const;
```

mit dem Kommentar `:312-315`: *„`.screen__body--frame` selbst steht **nicht** in dieser Liste
(9.6 Punkt 2: der Rahmen läuft im getragenen Bereich nicht, und im Rückfall soll sein Kind höher
sein als er)"* — das ist der **widerlegte** Wortlaut von 9.6 Punkt 2, wörtlich, und er ist seit
T-344 in beiden Papieren durchgestrichen.

**Die Folge ist gemessen, nicht vermutet.** Bei 1024 × 640 überläuft nicht `.app__main`, sondern
der Rahmen in sich (T-341: `577/515`, T-323 8.5 Tabelle). Also: A1 grün, A2 grün (der Rahmen
schluckt es), A7 grün, A8 grün — **nichts** ist an dieser Größe rot. `board.md:489` und `:543`
tragen aber: „solange 7.5 nicht gebaut ist, ist A8 bei 1024 × 640 **beabsichtigt rot**; wer das
nicht weiß, lockert es." Der Satz stimmt für die Vorschrift und **nicht für den Bestand**. Das ist
die gefährlichere Richtung: Es gibt keine falsche Rotmeldung, die jemand lockert, sondern eine
**Grünmeldung, auf die sich jemand verläßt** — und zwar auf die einzige, die den einzigen heute
bekannten E-115-Verstoß zeigen sollte. (T-345 hat hier nicht schlecht gearbeitet: Sein Auftrag
lief parallel zu T-344, und er hat gegen die damals gültige Fassung gebaut. Der Fehler liegt bei
der Wellenaufteilung, nicht bei ihm — dieselbe Lehre wie T-315/T-316.)

**(c) A9 gibt es nicht, und zwei Papiersätze behaupten das Gegenteil im Präsens.** T-322
Abschnitt 9 Nr. 4: *„Der Tastaturweg bleibt damit erhalten, und **gemessen wird er**: AK-14 (c)
und die Zusicherung A9 des Meßsatzes."* AK-14: *„Drei Teile, **alle gemessen**."* Im Baum kommt
`A9` in keiner Datei unter `tests/` vor; `#inhalt` steht in `viewport-fit.spec.ts` genau einmal,
in einem Kommentar über `parseRoute`. Das ist B-04 in seiner Urform — mit dem Unterschied, daß
der Auftrag dafür in `board.md:543` bereits vorgemerkt ist.

**(d) Die zweite Untergrenze ist schwächer gebaut, als 9.4 sie beschreibt.** 9.4: *„die zweite
Untergrenze aus 9.6 macht den Lauf rot, wenn **in einer Ansicht** kein Laufbereich wirklich
läuft."* Gebaut ist eine **Gesamtsumme über alle 77 Paare** (`:510-511`, `:656-660`); T-345 hat
die Abweichung in seinem Bericht offen als Annahme benannt und sie ist vertretbar (nicht jede
Ansicht hat bei jeder Größe Überschuß). Nur steht sie im Papier anders.

**(e) Der widerlegte Wortlaut lebt an drei Stellen weiter:** `viewport-fit.spec.ts:44`
(„1024×640 (die benannte A8-Ausnahme des Rahmens, 9.6 Punkt 2)"), `:285` (das Etikett der
Fenstergröße selbst, das in jeder Fehlermeldung erscheint) und `docs/testplan.md:4957`. Ein
Etikett, das in der Meldung steht, ist die Fassung, die der nächste Leser für wahr hält.

**Vorschlag.** Ein Auftrag an den e2e-tester, **nach** T-348 (so steht er in `board.md:543` schon,
mit dieser Ergänzung): A2a als eigene, untergrenzenlose Zusicherung über **alle sieben** Größen
plus die achte aus 9.2 (320 × 256, dort nur A1 und A2a); A8 mit dem Rahmen im getragenen Bereich
**in** der Menge; A9 mit der Berichtigung aus B-20; die drei Etiketten; und 9.4s Satz auf die
gebaute Zählweise nachziehen — oder die Zählung je Ansicht bauen. Bis dahin heißt es im Board
nicht „B-04 geschlossen" (`board.md:491`), sondern „B-04 zur Hälfte", und die Hälfte, die fehlt,
hat einen Namen.

### B-25 · nicht blockierend · AK-20 ist weder gebaut noch ausgenommen

**Abweichung.** AK-20 verlangt ausdrücklich eine Gegenprobe: *„ein getragenes Fenster **mit**
stehender Hüllenmeldung: Dort darf der Rahmen laufen, und AK-02 wird dort nicht gemessen. Das ist
zu messen, nicht zu glauben."* `isGetragen()` (`:302-304`) liest ausschließlich Breite und Höhe;
weder prüft der Lauf die Abwesenheit einer Hüllenmeldung, noch fährt er den Fall mit einer. R-f
ist dafür der benannte Risikoeintrag.

Heute ist der Lauf grün, weil in der Prüfumgebung keine Meldung steht. Der Tag, an dem eine steht
(Fassungshinweis!), bringt A2 an vier Größen zum Rot — und die Lockerung liegt dann näher als die
Berichtigung.

**Vorschlag.** Eine Zeile in `isGetragen()`s Umfeld: den Fall entweder ausschließen (Abwesenheit
von `.shellnotes`/`.updatebar` prüfen und sonst überspringen) oder ihn als eigenen Prüffall
fahren. Beides ist billiger als der erste falsche Rotlauf.

---

## 4. Die zehn nicht blockierenden Befunde aus T-343

| ID | Stand | Wo |
|---|---|---|
| **B-06** waagerechte Laufbereiche ohne Namen | **Papier erledigt**, Bau offen. AK-15 auf senkrechte Bereiche plus `.board` eingeschränkt; die schwächere Zusage für Bausteine ist wörtlich übernommen — **und übertroffen**: die neue Auflage „in der rechtesten Spalte muß ein fokussierbares Element stehen" ist eine meßbare Bedingung, die ich nicht verlangt hatte. Offen: `.board` bekommt seinen Halt erst in T-348; die Messung an den beiden `.table-wrap` der Exportgruppen (Übergabe Punkt 6) steht aus | T-323 8.5, AK-15 |
| **B-08** Laufbereich wechselt mit dem Zustand | **Steht, unverändert — und wiegt jetzt mehr.** In vier Ansichten wird der Laufbereich bei jedem Zustandswechsel neu gebaut (Buchungen `:391/:406/:470`, Kanban `:410/:421/:452`, Zeiterfassung `:160/:171`, Todo-Detail `:248/:305`). Mit A-25.5 hängt daran jetzt eine **Anforderungs-ID**: Die Zuordnungstabelle in T-323 8.5 nennt je Ansicht **einen** Inhaltshalt (Kanban `.board`, Zeiterfassung Laufbereich A) — und beide existieren in Z0, Z3 und Z4 **gar nicht**. Wer T-348 baut, muß raten, welcher Kasten dort die Marke trägt | siehe unten |
| **B-09** AK-10 im Rückfall | **erledigt.** T-323 5.2 berichtigt, mit der Rechnung (10 px in 44 Fällen gegen einen Sprung in einem) und dem Preis im Text; AK-10 trägt den Geltungsbereich | T-323 5.2, AK-10 |
| **B-10** `min-block-size: 0` an `.screen > .screen__body` | **erledigt.** 3.2 trägt die Berichtigung samt Spezifitätsrechnung und dem Verweis auf den Kommentar im Bau | T-323 3.2 |
| **B-11** Leerzustand Tags/Protokoll | **erledigt, und besser als vorgeschlagen.** Statt einer Einzelentscheidung gibt es ein nachprüfbares Kennzeichen („direktes Kind des Laufbereichs"), die Selektorenmenge ist die Gegenprobe, und am Bau ändert sich nichts | T-323 10, R-5 |
| **B-12** Todo-Detail ohne Namen | **erledigt.** AK-15 bekommt denselben Satz; die Begründung (Name wäre im Fehlerzustand unwahr) ist besser als mein Vorschlag. **Kollidiert mit A-25.5** → B-17 | T-323 8.5, AK-15 |
| **B-13** Abfragen auf mehrdeutige Namen | **steht, unverändert.** T-322 4.11 letzter Punkt sagt weiterhin nur „**Jede Abfrage auf diese Namen schränkt die Rolle ein**". Für `region` und `heading` reicht das; für `link` nicht — „Export" ist in der Einstellungsansicht **zweimal** ein Verweis (Hauptnavigation und Bereichsschiene). Fehlt weiterhin: die Landmarke einschränken | T-322 4.11, R-g |
| **B-14** E-087-Reihenfolge / AK-22 | **erledigt.** AK-22 nennt die beiden Namen jetzt ausdrücklich und hält fest, daß sie sichtbar in der Schiene stehen | AK-22 |
| **B-15** „bitte entscheiden" im Quelltext | **erledigt.** Kein Treffer mehr auf `bitte entscheiden` oder `GEMESSENE ABWEICHUNG` unter `apps/web/src/styles/**` | — |
| **B-05** Einschränkung der Einzelfreigabe | **eingearbeitet.** 7.4 trägt die Regel („ab einer Aktionsgruppe von mehr als ≈ 486 px") statt der Fensterbreite, die Freigabe ist auf das Kanban eingeschränkt, und der visual-qa ist auf 1024 und 960 verwiesen | T-323 7.4 |

**Gegenstandslos geworden: keiner.** Alle zehn sind entweder beantwortet oder stehen noch.

---

## 5. Zustandsabdeckung nach zwei Umbauten — Abschnitt 15

Gelesen über elf Ansichten, die Zustände Z0 bis Z7 und die drei Zustände ohne Ansicht (T-322 4.0).
**Hover, aktiv, Fokus: unverändert, kein Befund.** **Bestätigungen: E-116/R-6/AK-25 strukturell
über das Portal — trägt** (die Lücke aus T-347 G-4 ist bekannt und nicht mein Gegenstand).
**Leerzustände: nach B-11 zum ersten Mal widerspruchsfrei** — die vier Bildschirmleerzustände
decken sich mit den drei gebauten Selektoren, die zwei Kartenleerzustände sind richtig eingeordnet.
**Lade- und Fehlerzustände: die Regel aus T-323 10 steht** (ansichtsweite Meldung in den festen
Teil, Zeilenmeldung in den Laufbereich).

Zwei Lücken bleiben, beide an derselben Stelle wie in T-343 und eine davon neu bewertet.

### B-08 (fortgeschrieben) · nicht blockierend, aber nicht mehr knapp daneben · S-06, S-04, S-05, S-03

**Abweichung.** Die Marke `id="inhalt"` hängt seit T-326 am Laufbereich und wandert deshalb bei
jedem Zustandswechsel auf ein anderes DOM-Element. Neu ist: **T-344 hat die Zuordnung je Ansicht
festgelegt, aber nicht je Zustand.**

| Ansicht | Inhaltshalt nach 8.5 | existiert in Z0 (Laden) / Z3 (leer) / Z4 (Fehler)? |
|---|---|---|
| Kanban | `.board` | **nein** — dort steht `<ScreenBody label="Kanban">` (`BoardScreen.tsx:410`, `:421`) |
| Zeiterfassung | Laufbereich A | **nein** — dort steht `<ScreenBody label="Zeiterfassung">` (`TimeScreen.tsx:160`) |
| Buchungen | `.screen__body` | ja, aber ein **anderes Element** als im gefüllten Zustand (`BookingsScreen.tsx:406` gegen `:470`) |
| Todo-Detail | `.screen__body` | ja, ohne Namen (`:248`) gegen mit Namen (`:305`) |

Zwei Folgen. **Erstens**, fachlich: Wer während des Ladens „Zum Inhalt springen" benutzt, verliert
den Fokus an `<body>`, sobald die Daten ankommen — in den Buchungen löst das der **Filter** aus,
also genau dann, wenn der Benutzer hinsieht (A-13.7). **Zweitens**, für den Bau: T-348 muß
entscheiden, welcher Kasten die Marke in Z0/Z3/Z4 trägt, und kein Papier sagt es. Rät er, steht
das Ergebnis in keinem Papier und wird beim nächsten Abgleich als Abweichung gefunden.

**Vorschlag.** Ein Satz in T-323 8.5 und in T-322 R-4, gleichlautend: *„Existiert der Inhaltshalt
in einem Zustand nicht (Z0, Z3, Z4), trägt die Marke der Laufbereich, der den Zustand zeigt — er
ist dort der einzige."* Das ist ohnehin die gebaute Wahrheit und kostet keine Zeile Code. Der
bessere, teurere Weg bleibt der aus T-343: den Laufbereich über die Zustände hinweg als dasselbe
Element halten, wie die sieben übrigen Ansichten es tun.

### B-24 · nicht blockierend · Zustand ohne Ansicht · Abschnitt 15, T-323 9.3 Punkt 4

**Abweichung.** Von den drei Zuständen, die T-323 9.3 Punkt 4 ausdrücklich in den Meßsatz
verlangt („Sie werden namentlich geprüft, weil sie in keiner Routenmenge stehen"), mißt der
gebaute Lauf **keinen** — mit offen benannten Gründen (`viewport-fit.spec.ts:74-98`). Einer davon
ist mehr als eine Prüflücke:

> `parseRoute` fällt für **jeden** nicht erkannten Kopf-Abschnitt auf `DEFAULT_ROUTE` zurück.

Nachgelesen: `router.ts:139` und `:171` geben beide `DEFAULT_ROUTE` (Dashboard); der `default`-Zweig
von `Screen()` und der Fall `case "todo": route.id === null` sind damit unerreichbar. Der
Leerzustand **„Diese Ansicht gibt es nicht"** (`App.tsx:434`) ist gebauter, benannter, gestalteter
Text, den **kein Benutzer je sieht**. Abschnitt 15 verlangt sinnvolle Leerzustände; ein
Leerzustand, den man nicht erreichen kann, erfüllt das nicht, und ein Meßsatz, der ihn ansteuert,
würde in Wahrheit das Dashboard messen.

**Vorschlag.** Eine Entscheidung, keine Reparatur: Entweder wird eine unbekannte Adresse als
unbekannt behandelt (dann ist der Zustand erreichbar und meßbar), oder der Zustand fällt — und
dann nach E-081 Punkt 4 **in einem** Auftrag samt seinem Text und seinem Namen. Was nicht bleiben
kann, ist eine dritte Ansicht im Code, die es für den Benutzer nicht gibt. Gehört dem
Orchestrator, nicht mir.

---

## 6. Die kritischen Klickpfade — geprüft, kein neuer Befund

Gegen die Liste aus meiner Rolle, soweit dieser Umbau sie berührt:

- **Exportstatus an jeder Stelle sichtbar (A-13.5).** Der Umbau **verbessert** ihn: Filterleiste
  und Zählzeile werden fest (T-322 4.6, 4.7), der Status bleibt in der Tabelle, und AK-13 hält den
  Weg zu den Zeilenmenüs beim waagerechten Lauf offen.
- **Vorlageneditor mit Vorschau (I-15).** Die Klebung `.tpl-list { position: sticky; top: … }`
  (`app.css:3267-3269`) hängt jetzt am neuen Laufbereich — `TemplatesScreen.tsx:522` liefert
  `<ScreenBody>`, `.tpl-layout` ist dessen direktes Kind, der Bezug stimmt ohne Änderung. Die
  Auflage aus T-322 Abschnitt 9 Nr. 2 ist damit erfüllt; sie war die einzige der zwölf, die still
  hätte wegfallen können.
- **`.settings-rail`** hat ihr wirkungsloses `position: sticky` verloren
  (`viewport-layout.css:651-653`) — Auflage Nr. 1 erfüllt, keine tote Zusage.
- **Timer auf erledigtem Todo, Todo-Notiz nie im Export, Ordnerbaum, Standard-Tags:** von diesem
  Umbau nicht berührt, kein neuer Weg, keine gestrichene Fläche.

---

## Zusammenfassung der Befunde

| ID | Blockierend | Ort | Anforderung |
|---|---|---|---|
| **B-16** | **ja** | `docs/spec.md:527-535` | fehlende Ausnahme aus E-112 (Startbilder, Musterseite, Aufgabenbereich); A-25.2 gegen T-323 8.6/8.7 |
| **B-17** | **ja** | `docs/spec.md:533` (A-25.5) | gegen T-323 8.5 und T-322 R-4/AK-15 — zwei entschiedene Ausnahmen fehlen |
| **B-18** | **ja** | `docs/spec.md:535` (A-25.7) | gegen T-343 B-05 (erteilte Freigabe), T-323 7.5 und gegen A-25.5 im selben Abschnitt |
| **B-19** | **ja** | `tests/e2e/viewport-fit.spec.ts:44, :285, :312-317, :540-577`; `docs/testplan.md:4957` | A2a fehlt ganz; A8 nimmt den Rahmen in jeder Größe aus (1024 × 640 **grün** statt rot); A9 fehlt; 9.4s Zählweise; drei Etikette mit widerlegtem Wortlaut |
| **B-20** | **ja** | T-323 9.1 A9 (c) / T-322 AK-14 (c) gegen T-323 8.5 Punkt 1 | Zeiterfassung unter 68 rem: falsches Rot an zwei von vier getragenen Größen |
| **B-08** | nein (nicht mehr knapp) | S-06, S-04, S-05, S-03 | Inhaltshalt existiert in Z0/Z3/Z4 nicht; A-25.5, Abschnitt 15, A-13.7 |
| **B-13** | nein | T-322 4.11, R-g | Rolle einschränken genügt für `link` nicht |
| **B-21** | nein | T-323 9.6 Punkt 1 gegen T-322 R-4 | „Laufbereich" hat wieder zwei Bedeutungen |
| **B-22** | nein | T-323 offene Fragen 3 und 5 | 537 px ist der Stand vor T-334 (129,8 px), ohne Widerlegungsvermerk |
| **B-23** | nein | `viewport-layout.css:723-724` gegen `Kanban.tsx:350` | Kommentar sichert Halt und Namen zu, die es nicht gibt |
| **B-24** | nein | `App.tsx:434`, `router.ts:139/:171` | „Diese Ansicht gibt es nicht" ist unerreichbar; Abschnitt 15, 9.3 Punkt 4 |
| **B-25** | nein | `viewport-fit.spec.ts:302-304` | AK-20/R-f: Gegenprobe mit stehender Hüllenmeldung fehlt |
| **B-26** | nein | `docs/spec.md:531` (A-25.3) | Naht statt „Auswahl steuernder fester Teil"; E-112 Satz 1 / AK-06 ohne ID |
| **B-27** | nein | `docs/spec.md:534` (A-25.6) | „vollständig sichtbar" gegen `.dialog__body--form` |

## Was gut ist und ausdrücklich bleiben soll

- **Ein Auftrag für beide Papiere war richtig, und das Ergebnis zeigt es.** Alle drei
  Widersprüche sind entschieden, keiner ist durch Streichen aufgelöst worden, und jede
  Berichtigung nennt die Zahl und den Prüfer, die sie erzwungen haben. Der neue Kopfsatz — *„Zwei
  Papiere, die einander nicht lesen, widersprechen einander nicht seltener — nur später"* — ist
  die Lehre in der Form, in der man sie im nächsten Auftrag wiederfindet.
- **„Eine Messung trägt eine Zahl und keine Einordnung"** (T-344 zu B-02). Das ist der beste Satz
  dieser Welle, und der Beweis steht daneben: 86 px und 62 px sind derselbe Zustand aus
  verschiedener Höhe. Er gehört in `decisions.md`, nicht nur in ein Designpapier.
- **7.5 beantwortet eine Frage, die niemand gestellt hatte** — wie ein fester Teil nachgibt. Drei
  Wege gegeneinander abgewogen, der ohne neue Gestalt gewählt, die Schwelle gerechnet statt
  gerundet (44 rem aus 576,7 + 125), und die **fehlende** Messung als fehlend benannt. So sieht
  eine Entscheidung aus, die man in einem Jahr noch nachvollziehen kann.
- **Die Gegenprobe in T-345**, die T-334s Flexbox-Fehler mechanisch nachbaut und beidseitig
  gefahren ist. Ein „rot zuerst", das wirklich rot war, ist mehr wert als drei grüne Läufe.
