# T-197 — Ein Lauf, der freundlicher rechnet als die Wirklichkeit, und drei freigegebene Wortlaute

**Rolle:** frontend-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Gelesen:** `docs/spec.md` (11–16, 18, 19), `.claude/team/decisions.md`, `.claude/team/board.md`
(O-HG, O-HI, O-HJ, O-HK, O-HQ), `.claude/team/reports/T-194-ui-designer.md`,
`T-195-spec-ux-reviewer.md`, `T-191-frontend-dev.md`, `T-187-e2e-tester.md`.

**Jede Fundstelle in diesem Bericht ist am Baum vom 2026-09-06 über den Wortlaut gesucht**
(E-087, Fassung von gestern nacht, Punkt 4). Eine Zeilenangabe habe ich aus keinem Bericht
übernommen — und an **einer** Stelle war die Angabe im Board falsch, siehe Abschnitt 2.3.

---

## Kurzfassung

```
Aufgabe: T-197 — O-HJ (Feld `over` im Kontrastlauf), O-HG (drei freigegebene Wortlaute),
         O-HQ erste Hälfte (Antwort, kein Bau)
Status: fertig
```

| Nachweis | Ergebnis |
|---|---|
| `pnpm typecheck` | 0 Fehler |
| `pnpm test` | 76 Dateien, 1456 grün |
| `pnpm --filter @takt/web build` | gebaut in 1,99 s |
| `pnpm run contrast` | **242 Paare, 484 Messungen, 0 durchgefallen, 6 von 6 Gegenproben** |
| `pnpm run proof:surface` | 15 bestanden, 0 fehlgeschlagen, 9 Gegenproben |
| `pnpm run proof:foreign` | 20 bestanden, 0 fehlgeschlagen, 3 Gegenproben |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |

`pnpm run proof:all` und `pnpm test:e2e` sind nach E-083 Punkt 3 **nicht** gefahren.
`apps/web/src/styles/components.css` ist **nicht angefaßt** — die Messung von visual-qa zu O-HI
steht damit weiterhin vor jedem Umbau.

---

## 1. O-HJ — der Lauf rechnet jetzt gegen die Fläche, nicht gegen die Leinwand

### 1.1 Was falsch war

`apps/web/scripts/contrast-check.mjs` legte **jede** teildurchsichtige Hintergrundfarbe über
`--bg-canvas`:

```js
const canvas = parseColor(resolveToken(theme.tokens, "--bg-canvas"));
const bg = flatten(bgRaw, canvas);
```

Das ist dieselbe Klasse wie O-GH: ein Lauf, der Farben gegen Farben hält statt gegen Flächen,
kann nicht merken, daß er die falsche Zahl nennt. Er nannte sie **zu günstig**, und zwar in die
gefährliche Richtung — eine Zusage, die freundlicher rechnet als die Wirklichkeit.

### 1.2 Was jetzt dasteht

Ein Feld `over` an jedem Paar. Es nennt die Fläche unter einem teildurchsichtigen `bg`, von innen
nach außen; ein einzelner Name oder eine Kette. Drei Regeln machen es unumgehbar, und alle drei
brechen den Lauf ab, statt eine Fläche zu raten:

1. **`bg` teildurchsichtig ohne `over`** → Abbruch. `over: "--bg-canvas"` ist die richtige
   Antwort, wenn die Farbe wirklich auf dem Anwendungshintergrund liegt — sie muß nur dastehen.
2. **Die Kette endet nicht deckend** → Abbruch. Sonst flächte der Lauf zweimal dieselbe Farbe.
3. **`over` an einem deckenden `bg`** → Abbruch. Das Feld wäre dort Zierde und behauptete eine
   Genauigkeit, die die Rechnung gar nicht braucht.

### 1.3 Bedingung (a): der Lauf wird rot — mit eingesetzter Verletzung gemessen

Die Verletzung ist die naheliegendste, die es gibt: jemand macht die Schraffur des Etiketts
„Erneut offen" kräftiger, damit sie besser zu sehen ist, und verschlechtert damit die
Beschriftung **darauf**. Im dunklen Thema liegt das Fenster, in dem die alte Rechnung noch grün
gewesen wäre und die richtige bereits rot ist, zwischen Deckung 0,24 und 0,30.

**Zweimal gemessen, in zwei Formen:**

**(i) Am echten Bestand.** `--status-reopened-hatch` im dunklen Thema von `0.2` auf `0.28`
gesetzt, Lauf gefahren, Datei danach zeichengleich wiederhergestellt (`git status` sauber):

```
FEHL   4.11:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-hatch ueber --status-reopened-bg
1 von 484 Paaren durchgefallen.          Beendigungscode 1
```

Derselbe Bestand mit dem Lauf aus `HEAD`: **Beendigungscode 0**, „0 von 432 Paaren
durchgefallen". Der alte Lauf sieht die Verletzung nicht.

**(ii) Fest eingebaut, sechs Gegenproben**, nach der Form von `proof:surface` — ein Wächter, der
nie rot war, ist eine Behauptung über einen Wächter:

```
OK   die kraeftigere Schraffur macht das Deckelpaar rot — 4.11:1, gefordert 4.5:1
OK   dieselbe Verletzung waere ueber der Leinwand gruen geblieben — 4.72:1
OK   auch ohne Verletzung gehen beide Rechnungen auseinander — zu guenstig um hell 0.25, dunkel 0.74
OK   ein teildurchsichtiger Hintergrund ohne `over` bricht den Lauf ab
OK   eine Kette, die nicht deckend endet, bricht den Lauf ab
OK   `over` an einem deckenden Hintergrund wird abgewiesen — beide Richtungen
```

Die zweite Zeile ist die eigentliche Aussage: **dieselbe** Verletzung, **dasselbe** Paar, nur die
alte Rechnung — 4,72:1 und damit grün. Die dritte mißt, daß `over` auch ohne Verletzung einen
Unterschied macht, sonst wäre das Feld Zierde. Die letzten drei fahren in beide Richtungen: die
falsche Angabe wird gemeldet, die richtige nicht.

### 1.4 Bedingung (b): die Zahlen

**242 Paare** (vorher 240), **484 Messungen**, **1 Paar mit `over`**.

Die zwei neuen Paare sind die Schraffur des Etiketts „Erneut offen" aus T-194 Stelle 1 — bis
heute maß **kein** Paar `--status-reopened-hatch` (Befund O-GU):

| Paar | hell | dunkel | Art |
|---|---|---|---|
| `--status-reopened-fg` auf `--status-reopened-hatch` **über** `--status-reopened-bg` | 6,49:1 | **4,89:1** | Deckelpaar, min 4,5 (SC 1.4.3) |
| `--status-reopened-hatch` auf `--status-reopened-bg` | 1,24:1 | 1,45:1 | benannte Ausnahme, gedeckelt |

Die 1,24 und 1,45 sind zeichengleich mit T-189 und T-194. Der Deckelwert dunkel (4,89) ist
zeichengleich mit ui-designers Handrechnung.

**Wo `over` nicht steht, und warum: an 241 Paaren, weil ihr `bg` in beiden Themen deckend ist.**
Das ist keine Schätzung — `packages/ui-tokens/tokens.css` deklariert außerhalb der Schatten genau
zwei teildurchsichtige Farben, `--bg-scrim` und `--status-reopened-hatch`. `--bg-scrim` steht in
keinem Paar (die Abdunklung trägt keinen Text und keine Grenze); `--status-reopened-hatch` ist das
neue Paar. An allen übrigen 241 wäre `over` nach Regel 3 ein Abbruch — der Lauf setzt die
Antwort also nicht voraus, er erzwingt sie.

**Der Betrag der Beschönigung, jetzt gemessen statt gerechnet:** hell 0,25, dunkel **0,74**.
ui-designers „bis zu 0,7" ist bestätigt.

### 1.5 Was der Lauf ausgibt

Die Fläche steht in der Zeile, nicht im Kommentar:

```
OK     4.89:1 (min 4.5:1)  --status-reopened-fg auf --status-reopened-hatch ueber --status-reopened-bg
```

Schlußzeile jetzt dreizeilig: durchgefallene Messungen, Paarzahl mit `over`-Anteil, Gegenproben.
`--markdown` trägt dieselben Angaben. Beendigungscode 1 auch dann, wenn eine **Gegenprobe**
ausbleibt — ein blinder Wächter ist kein bestandener Lauf.

Ein Nebenbefund, mitgenommen: `themes` trug ein Feld `base: "--bg-surface"`, das seit jeher
niemand las. Es ist weg. Eine tote Angabe neben einer falschen Rechnung ist genau die
Nachlässigkeit, aus der die falsche Rechnung entsteht.

---

## 2. O-HG — die drei Wortlaute

### 2.1 Der sechste ST-03-Eintrag

`apps/web/src/components/ExportAudit.tsx`, über den Wortlaut gefunden. Vorher/nachher:

```
- Ohne Begründung ausgebucht. Das Feld ist freiwillig (E-047) — protokolliert ist
+ Ohne Begründung ausgebucht. Das Feld ist freiwillig — protokolliert ist
  trotzdem, dass hier jemand Zeit ohne Abrechnung abgehakt hat, und wann.
```

Der Satz bleibt sonst zeichengleich. `tests/e2e/export-mixed-status-and-billing.spec.ts` vergleicht
seit T-187 `toContainText('Ohne Begründung ausgebucht. Das Feld ist freiwillig')` und endet vor der
Kennung — der Prüffall trägt beide Fassungen und wurde nicht angefaßt.

### 2.2 Der dritte Satz im Zweig `rejected`

`apps/web/src/app/useUpdateNotice.ts`, Zweig `rejected`:

```
- „… nicht bestanden. Takt öffnet dafür keine Seite. Die Release-Seite lässt sich über den
   angezeigten Verweis von Hand aufrufen."
+ „… nicht bestanden. Takt öffnet dafür keine Seite."
```

**Die enge Bedingung ist eingehalten: der Nachbarzweig `failed` ist zeichengleich geblieben**
(„… der angezeigte Verweis führt von Hand zum selben Ziel."). Ich habe die Begründung in
T-195 Z-37 gelesen, bevor ich geschnitten habe: In `rejected` hat die Formprüfung die
Fassungsbezeichnung abgewiesen, und der angezeigte Verweis ist `releasePageUrl(notice.version)` —
**dieselbe** abgewiesene Bezeichnung. Der Satz schickte den Benutzer von Hand an der letzten
Kontrolle vorbei, auf eine Seite, die es nicht gibt. In `failed` war die Form in Ordnung, es fehlt
nur der Browser; dort stimmt der Satz und bleibt.

**A-18.6 bleibt erfüllt.** Der Verweis selbst hängt nicht am gestrichenen Satz: `UpdateDialog`
zeigt ihn in einer eigenen Zeile (`<dd className="mono">{url}</dd>`), unabhängig von `problem`.

### 2.3 Der dritte Wortlaut: dieselbe Zeichenkette in der Musterseite

`apps/web/src/showcase/UpdateNoticeSection.tsx` trug den Satz **zeichengleich** ein zweites Mal
(`PROBLEMS.rejected`). Hätte ich nur `useUpdateNotice.ts` geschnitten, führte die Musterseite ab
sofort einen Wortlaut vor, den das Produkt nicht mehr hat — genau die Klasse aus O-GC. Beide
Stellen tragen jetzt denselben, gekürzten Satz.

**E-087, und hier hat es sich gelohnt:** Das Board nennt die Fundstelle des ST-03-Eintrags als
`apps/web/src/screens/ExportAudit.tsx:170`. Diese Datei gibt es nicht; der Satz steht in
`apps/web/src/components/ExportAudit.tsx`. Über den Wortlaut gesucht war das kein Aufenthalt.

**Ein Rest, nicht in meiner Hoheit:** `docs/testplan.md` zitiert den alten Wortlaut zweimal, einmal
noch mit Kennung („… Das Feld ist freiwillig (E-047) …"). Das gehört e2e-tester.

---

## 3. O-HQ, erste Hälfte — Antwort, kein Bau

### 3.1 Der Befund, nachgemessen

`ANREDE_DU_QUELLE`, `ANREDE_IMPERATIV_QUELLE`, `IMPERATIV_STAMM` (34 Stämme) und
`IMPERATIV_WOERTLICH` (13 Wörter) stehen **zeichengleich** in
`apps/outlook-addin/scripts/proof-addin.mjs` und `apps/web/scripts/proof-surface.mjs`. Die
Wortlisten habe ich beider Dateien gegeneinander verglichen: kein Unterschied.

### 3.2 Wohin die gemeinsame Form gehört

**Nicht in eine der beiden Dateien.** Ließe der eine Lauf den anderen importieren, hinge ein
Wächter an einer Datei fremder Hoheit — und `proof-addin.mjs` wird in dieser Welle von
integration-dev bearbeitet.

**Vorschlag: ein eigenes, kleines Paket unter `packages/`** — nur die zwei Ausdrucksquellen, die
zwei Wortlisten und die Gestalt der Ausnahmen, kein Laufzeitanteil, von keiner Anwendung gebündelt.
Beide Apps hängen bereits an `@takt/domain` und `@takt/ui-tokens`, die Auflösung ist also da; in
`@takt/domain` gehört es aber nicht hinein — eine Liste deutscher Anredeformen ist keine Fachlogik
von Takt. **Das ist eine Orchestrator-Entscheidung**: es braucht ein `package.json` und eine Zeile
in der Hoheitstabelle (ein reines Wächterpaket paßt heute weder zu domain-dev noch zu
integration-dev). `pnpm-workspace.yaml` deckt `packages/*` bereits ab.

**Billige Zwischenform, falls das Paket nicht gewollt ist:** beide Kopien bleiben, und **ein**
Lauf mißt lesend, daß die andere Datei dieselbe Quelle trägt — dieselbe Bauart, mit der
`proof:shell-surface` die CSP zeichengleich gegen `tauri.conf.json` hält. Lesen ist kein
Schreiben; die Hoheit bleibt unberührt. Das ist schwächer (die Doppelung bleibt), aber es macht
sie messbar statt zusagbar.

### 3.3 Soll `(?!-)` in beide Läufe? Ja — und im Web-Lauf kostet es eine Ausnahme

Gemessen habe ich beide Bestände mit der heutigen und der engeren hinteren Grenze
(`(?![\wäöüß])` gegen `(?![\wäöüß-])`), über **allen** `.ts`/`.tsx`/`.css`/`.html`-Quellen, also
über einer Obermenge des sichtbaren Textes:

| Bestand | Imperativ heute | mit `(?!-)` | „du" heute | mit `(?!-)` |
|---|---:|---:|---:|---:|
| `apps/outlook-addin/src` | 9 | **9** | 6 | 6 |
| `apps/web/src` | 77 | **75** | 3 | 3 |

Im Add-in kostet es **null** Treffer — die Angabe aus T-191 ist bestätigt. Im Web fallen genau
zwei, und beide sind Ergänzungsbindestriche und keine Anreden: „Leer-, **Lade-** und
Fehlerzustand" (ein Kommentar) und „Im **Prüf-** und Entwicklungsbetrieb ist das gewollt"
(`lib/databaseLocationAdvice.ts`, sichtbarer Text).

**Der zweite ist einer der drei geduldeten Sätze von `proof:surface`, und sein eigener Grund
verlangt genau diese Änderung:**

> „`Prüf-` ist ein Bestimmungswort vor einem Bindestrich und kein Imperativ. Der Ausdruck trennt
> beides nicht; ein `(?!-)` in der hinteren Grenze täte es, gehört dann aber in **beide** Läufe."

`(?!-)` ist also keine Lockerung des Wächters, sondern das Ende eines Fehltreffers — und es
**streicht eine Ausnahme**, statt eine hinzuzufügen. Drei geduldete Sätze werden zwei.

### 3.4 Warum ich es nicht gebaut habe

Die Änderung gehört in **beide** Läufe. Einer davon liegt in fremder Hoheit und wird in dieser
Welle bearbeitet. Baute ich nur meine Hälfte, wären die beiden Ausdrücke ab sofort **nicht mehr
zeichengleich** — also genau der Zustand, gegen den O-HQ gerichtet ist, nur mit meiner Unterschrift
darunter. Der Auftrag sagt „Bauen nur, wenn die Antwort in deiner Hoheit liegt". Sie liegt es
nicht.

---

## 4. Pflichtzustände, Tastatur, Responsivität

Die drei Wortlaute ändern **Text in bestehenden Zuständen**, keine Flächen und keine Bedienung:

- **ExportAudit-Zeile:** Zustand „ausgebucht ohne Begründung" — er ist der Leerfall des
  Begründungsfeldes und bleibt vollständig erhalten, nur ohne interne Kennung.
- **`UpdateDialog`:** Fehlerzustand nach „Installieren" (`rejected`). Fläche, Rolle, Fokusführung
  und der angezeigte Verweis bleiben unverändert; der Satz ist um einen Satz kürzer.
- **Musterseite Abschnitt 12:** derselbe Zustand als abnehmbares Beispiel.

Der Kontrastlauf ist ein Wächter ohne Oberfläche. Neue Zustände sind nicht entstanden, bestehende
nicht entfallen.

---

## Annahmen

1. **Die zwei Schraffurpaare gehören in diese Aufgabe.** Sie sind Messung, kein Produkt: Ohne das
   Deckelpaar hätte `over` keinen einzigen Träger und wäre eine Zusage über einen Mechanismus, den
   nichts benutzt — dieselbe Klasse wie der Befund, der die Aufgabe ausgelöst hat. Die zugehörige
   **Textstelle** in `components.css` (der Satz, der die Wirkung der Schraffur behauptet) habe ich
   ausdrücklich **nicht** angefaßt; sie gehört zu O-HK und steht im Kommentar am Paar benannt.
2. **`over` ist Pflicht statt Empfehlung.** Ein Feld, das man vergessen kann, hätte den Fehler in
   der nächsten Welle wiederholt. Deshalb Abbruch statt Vorgabewert — auch für `--bg-canvas`.
3. **Die Musterseite zählt als dritter Wortlaut.** Der Auftrag nennt „drei Wortlaute" und listet
   zwei; die zeichengleiche Kopie in `showcase/` ist die einzige weitere Stelle, an der einer der
   beiden Sätze steht. Ist stattdessen Z-38 gemeint (die Zeile in den Kopfkommentar von
   `connection.ts`), sage ich dazu: sie ist **nicht** gemacht, siehe offene Frage 2.
4. **Der Bestand des Lauftexts bleibt ASCII-transliteriert.** `contrast-check.mjs` trug vor dieser
   Aufgabe null Umlaute; meine Ergänzungen halten das ein, damit die Ausgabe auf einer
   Windows-Konsole nicht anders aussieht als hier.

## Risiken

1. **Das Deckelpaar liegt im dunklen Thema bei 4,89:1 — 0,39 über der Grenze.** Das ist die
   ehrliche Zahl und knapp. Jede spätere Änderung an `--status-reopened-hatch`,
   `--status-reopened-bg` oder `--status-reopened-fg` kann es kippen; ab jetzt merkt es der Lauf.
   Das ist der Zweck, aber es heißt auch: Wer dort etwas ändert, bekommt Arbeit.
2. **Der Lauf mißt weiterhin Token, nicht Bildschirme.** `over` behebt die falsche Fläche, nicht
   die Grenze aus T-189 und O-HI: Ob eine Farbe überhaupt gezeichnet wird, sieht er nicht. Die
   Angabe im Feld ist eine **Behauptung über die Bauart** — sie ist so gut, wie derjenige sie
   setzt, der die Klasse kennt.
3. **`--bg-scrim` hat weiterhin kein Paar.** Meine Begründung (trägt weder Text noch Grenze) ist
   abgeleitet, nicht am Bildschirm gemessen. Wer die Abdunklung später mit Text belegt, braucht
   ein Paar mit `over` — der Lauf würde ihn dazu zwingen, sobald er es versucht.
4. **`docs/testplan.md` zitiert den alten ExportAudit-Wortlaut** an zwei Stellen, eine davon mit
   Kennung. Fremde Hoheit, gemeldet unter 2.3.

## Offene Fragen

1. **An den Orchestrator (O-HQ):** Bekommt die gemeinsame Form ein eigenes Paket unter
   `packages/` — mit `package.json` und einer Zeile in der Hoheitstabelle —, oder bleibt es bei
   zwei Kopien plus einer lesenden Gleichlaufmessung? Erst danach kann `(?!-)` in beide Läufe.
   Die Messung dazu liegt in 3.3 vor; sie ist entschieden, nur nicht gebaut.
2. **An den Orchestrator (O-HG):** War mit dem dritten Wortlaut **Z-38** gemeint, also die Zeile
   in den Kopfkommentar von `apps/web/src/app/connection.ts` („keiner dieser sechs Sätze darf je
   als Träger einer Aussage gezählt werden")? Sie steht heute nicht da. Der Auftrag nennt sie
   nicht, deshalb habe ich sie nicht geschrieben — sie ist eine Zeile und in meiner Hoheit.
3. **An ui-designer:** Die benannte Ausnahme der Schraffur steht jetzt im Lauf, der Satz in
   `components.css`, den sie widerlegt, steht noch. Ist das die gewollte Reihenfolge, oder soll
   die Ausnahme bis O-HK warten?

## Nächster Schritt

1. **visual-qa:** ein Blick auf die drei geänderten Sätze (ExportAudit-Zeile, `UpdateDialog` im
   Zustand `rejected`, Musterseite Abschnitt 12) — keine Flächenänderung, aber der Fehlersatz ist
   um einen Satz kürzer. Getrennt davon läuft ihre Messung zu O-HI weiter; `components.css` ist
   unberührt.
2. **O-HK als eine Aufgabe**, wie ui-designer verlangt hat — dann fällt auch der Satz am
   Etikett, auf den der Kommentar am neuen Ausnahmepaar zeigt.
3. **Antwort auf offene Frage 1**, danach `(?!-)` in beide Läufe und eine Ausnahme weniger in
   `proof:surface`.

---

# Nachtrag — drei Antworten des Orchestrators, umgesetzt

**Datum:** 2026-09-06, nach der Rückmeldung zu O-HQ, O-HG und O-HK.

## N.1 O-HQ — kein Paket, sondern **Regel E**: der Wächter mißt sich gegen den anderen Lauf

Gebaut in `apps/web/scripts/proof-surface.mjs`, neuer Abschnitt 5 und zwei Prüfungen unter der
Überschrift **„E — Derselbe Anredewaechter in zwei Laeufen, gegeneinander gemessen (E-086)"**.
Er liest `apps/outlook-addin/scripts/proof-addin.mjs` — **lesend, nie schreibend**; die Hoheit
bleibt unberührt.

**Gemessen wird die Form und die Wirkung**, weil E-086 beides verlangt:

| Was | Wie | E-086 |
|---|---|---|
| `ANREDE_DU_QUELLE`, `ANREDE_IMPERATIV_QUELLE` | Zeichen für Zeichen, Leerzeichen zählen mit | Punkt 2 |
| `IMPERATIV_STAMM`, `IMPERATIV_WOERTLICH` | Wörter, **Reihenfolge** und **Zahl** | Punkt 4 |
| Falltafel mit 14 Sätzen | jeder Satz durch **beide** Seiten, Urteile müssen übereinstimmen | Punkt 1 |

Die Falltafel gehört dem Lauf und keiner der beiden Seiten. Sie sagt bewußt **nicht**, welches
Urteil richtig ist — das ist Sache von Regel D; sie sagt nur, daß beide Seiten dasselbe urteilen.
Fünf Sätze ohne Treffer, sieben mit, und die zwei, an denen sich die hintere Grenze entscheidet.

**Vier Gegenproben, in beide Richtungen** (E-086 Punkt 3), alle gegen eine **erfundene** Seite,
damit sie nicht den Zustand des Baumes messen:
- zwei zeichengleiche Seiten werden **nicht** gemeldet,
- sechs eingesetzte Abweichungen werden gefunden — hintere Grenze links **und** rechts, ein Wort
  weniger links **und** rechts, dieselben Wörter in anderer Reihenfolge, ein anderes Wort in der
  zweiten Liste,
- und die Falltafel schlägt **selbst** an, nicht nur der Textvergleich. Ohne diese letzte
  Gegenprobe bliebe sie stehen, ohne je etwas gefunden zu haben.

**Die Zahl: `proof:surface` steht bei 19 bestandenen Prüfungen — und einer roten.**

## N.2 `(?!-)`: meine Hälfte ist gebaut, und der Lauf ist deshalb rot

Beide Ausdrücke in `proof-surface.mjs` tragen jetzt `(?![\wäöüß-])`. Die Ausnahme „Im Prüf- und
Entwicklungsbetrieb ist das gewollt" ist damit **fällig geworden und gelöscht, nicht angepaßt** —
genau so, wie der Prüffall unter der Ausnahmeliste es vorgesehen hat. **Drei geduldete Sätze sind
zwei.**

**Und jetzt steht Regel E rot, an genau einer Prüfung.** Das ist die Wirkung, die der Auftrag
wollte, und sie liest sich als Arbeitsauftrag:

```
FEHL  beide Laeufe tragen denselben Ausdruck, dieselben Wortlisten und dasselbe Urteil
      ANREDE_DU_QUELLE:        proof-surface.mjs hat „…(?![\wäöüß-])“, proof-addin.mjs hat „…(?![\wäöüß])“
      ANREDE_IMPERATIV_QUELLE: proof-surface.mjs hat „…(?![\wäöüß-])“, proof-addin.mjs hat „…(?![\wäöüß])“
      Falltafel (imperativ) „Im Prüf- und Entwicklungsbetrieb ist das gewollt.“:
                               proof-surface.mjs sagt kein Treffer, proof-addin.mjs sagt Treffer
      Falltafel (imperativ) „Leer-, Lade- und Fehlerzustand.“:       dasselbe
```

**Die Auflage an integration-dev ist ein Zeichen an zwei Stellen:** in
`apps/outlook-addin/scripts/proof-addin.mjs` wird aus `(?![\wäöüß])` am Ende von
`ANREDE_DU_QUELLE` und `ANREDE_IMPERATIV_QUELLE` je `(?![\wäöüß-])`. Über die Add-in-Texte
gemessen kostet das **null** Treffer. Danach ist Regel E grün und `proof:surface` steht bei 20/0.

**Der Preis steht dazu, damit ihn niemand übersieht:** Bis dahin ist `proof:surface` rot und
damit auch `proof:all`. Wird das in dieser Welle nicht gewollt, macht **eine** Zeile es grün —
`(?![\wäöüß-])` in meinen zwei Ausdrücken auf `(?![\wäöüß])` zurück und die gelöschte Ausnahme
wieder eingesetzt. Ich halte das für die schlechtere Wahl: Regel E wäre dann grün, ohne je etwas
gesagt zu haben.

## N.3 O-HG — Z-38 ist nachgetragen, und eine Zahl im Papier stimmt nicht

Der Kopfkommentar von `apps/web/src/app/connection.ts` trägt jetzt den Abschnitt **„Was diese
Datei an Text trägt — und warum er nicht zählt"** mit der Auflage wörtlich: **keiner dieser sechs
Sätze darf je als Träger einer Aussage gezählt werden.**

**Die sechs habe ich selbst nachgemessen** (E-087, über den Wortlaut): der Rückfalltext von
`kind: "failed"` und je einer für Beenden, Release-Seite, Ordnerauswahl, Anhänge und
Dateiauswahl. Sechs, wie T-195 sagt.

**Eine Einschränkung, die in Z-38 so nicht steht, und ich habe sie in den Kommentar
geschrieben statt sie zu übernehmen:** Die Begründung „`App.tsx` ersetzt bei `no_shell` die ganze
Fläche" trägt für **fünf** der sechs Sätze — sie hängen alle an
`shell === null || !shell.isShellAvailable()`. Der sechste, der Rückfalltext von `kind: "failed"`,
hängt daran **nicht**: `App.tsx` gibt in diesem Zweig `state.message` aus, und der Zweig läuft
auch **mit** Hülle. Er erscheint nur dann, wenn `serviceHandshake()` etwas wirft, das kein `Error`
ist. Am Urteil ändert das nichts — er sagt nichts, was die Fläche um ihn herum nicht schon sagt —,
an der Begründung schon. **Fünf von sechs, nicht sechs von sechs.**

## N.4 O-HK — verstanden, es wird gewartet

Die benannte Ausnahme steht im Kontrastlauf, der Satz in `components.css` steht noch. Der
Kommentar am Ausnahmepaar sagt das ausdrücklich und zeigt auf O-HK. `components.css` ist von mir
in dieser ganzen Aufgabe nicht angefaßt worden (Änderungsdatum 05:05, vor meiner Sitzung).

## N.5 Nachweis nach dem Nachtrag

| Nachweis | Ergebnis |
|---|---|
| `pnpm typecheck` | 0 Fehler |
| `pnpm test` | 76 Dateien, 1456 grün |
| `pnpm --filter @takt/web build` | gebaut |
| `pnpm run contrast` | 242 Paare, 484 Messungen, 0 durchgefallen, 6/6 Gegenproben |
| `pnpm run proof:surface` | **19 bestanden, 1 fehlgeschlagen** — Regel E, siehe N.2 |
| `pnpm run proof:foreign` | 20 bestanden, 0 fehlgeschlagen |
| `pnpm run proof:codepoints` | 45 bestanden, 0 fehlgeschlagen |

**Artefakte des Nachtrags:** `apps/web/scripts/proof-surface.mjs`, `apps/web/src/app/connection.ts`.

**Nächster Schritt:** Auflage an integration-dev — zwei Zeichen in `proof-addin.mjs`. Danach ist
`proof:surface` 20/0, und die Zusage „dieselbe Regel, zwei Läufe" ist zum ersten Mal gemessen
statt behauptet.
