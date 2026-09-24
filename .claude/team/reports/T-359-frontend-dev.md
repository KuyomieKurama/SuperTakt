# T-359 — Regel G an der Eigenschaft, nicht an einer Schreibweise (zweiter Anlauf)

Aufgabe: T-359 — Regel G an der Eigenschaft, nicht an einer Schreibweise
Status: fertig
Artefakte: `apps/web/scripts/proof-surface.mjs` (einzige geänderte Datei)

---

## 1. Der vorgefundene Zwischenstand — und was ich damit gemacht habe

**Zuerst die Messung, wie verlangt.** `pnpm --filter @takt/web proof:surface` gegen den
vorgefundenen Stand:

```
G  Jede gezeichnete Abdunklung hängt am Dokumentkörper …
TypeError: klassen.has is not a function
    at proof-surface.mjs:2495
Exit status 1
```

**Der Lauf lief nicht.** Er stürzte mitten in Regel G ab. Zwei weitere Brüche lagen dahinter:
`ABSAGE_ATTRIBUTE` war gestrichen, aber an drei Stellen noch gelesen (ReferenceError, sobald der
erste behoben wäre), und die neuen Erntehelfer von Regel H — `istAbsageAttribut`, `escapeZweige`,
`zweigVon`, `zweigZurTaste` — standen als **toter Code** da: `findDismissThatConfirms` rief
weiter die alte Liste aus drei Namen und den alten `===`-Zweig.

**Eine Warnung zur Einordnung:** `git diff apps/web/scripts/proof-surface.mjs` zeigt **nicht** nur
den abgebrochenen Anlauf. HEAD ist `311b26e` vom 2026-09-12; T-334, T-339, T-341 und T-348 sind
ebenfalls unverbucht. Der Zwischenstand ließ sich also nicht per `git checkout` verwerfen, ohne
vier fremde Aufträge mitzunehmen. Zugeordnet habe ich ihn über die Änderungszeit
(21:11:53 — die Abbruchzeit) und über die Bruchstellen.

**Entscheidung: weitergebaut, nicht verworfen.** Begründung, nicht Bequemlichkeit:

- Der vorgefundene Stilblattleser ist **an der Eigenschaft aufgespannt**, nicht an einer
  Schreibweise — also die von T-356 und T-357 verlangte Richtung, nicht eine fünfte Variante
  davon. Ihn wegzuwerfen und identisch neu zu schreiben wäre Aufwand ohne Gewinn gewesen.
- Er ist **prüfbar**: Jede der vierzehn gemeldeten Gestalten läßt sich einzeln gegen ihn messen.
  Ein Zwischenstand, den man messen kann, muß man nicht glauben.

**Und deshalb habe ich ihn nicht geglaubt.** Jede Zeile daraus gilt als unbewiesen behandelt:
Ich habe 34 Gegenproben geschrieben und zusätzlich **19 Mutationen** gefahren — jeden Mechanismus
einzeln auf den Stand vor T-359 zurückgebaut und geprüft, daß der zugehörige Prüffall rot wird
(Abschnitt 4). Dabei sind **zwei echte Fehler im vorgefundenen Stand** aufgefallen, die keine
Verdrahtungsfrage waren (Abschnitt 3.4).

---

## 2. Woran die Menge diesmal hängt

Die Frage aus dem Auftrag, zuerst und knapp:

**Sie hängt an der gerechneten Erklärung.** Eine Klasse ist in der Menge, wenn aus den
Erklärungen der Stilblätter — `!important` abgetrennt, `var()` gegen den Bestand aufgelöst,
Kurz- und Logikformen auf die vier physischen Kanten gebracht, **über alle Regeln derselben
Gestaltung vereinigt** — `position: fixed` und eine achsenweise volle Ausdehnung folgt. Nicht
daran, wie das geschrieben ist. Dazu die Stilangabe **am Element**, nach derselben Rechnung, und
je Gestaltung getrennt: Grundregel, Palette, `@media`, `@supports`, `@layer`.

Gebaut ist damit ein kleiner CSS-Zerleger (Rahmen, Bedingungsgruppen, stumme Gruppen,
Verschachtelung, `:is()`/`:where()` betreten, `:not()`/`:has()` überspringen) statt eines
regulären Ausdrucks.

### Was die Menge trotzdem nicht faßt — und zwar still

Das ist die teure Richtung, deshalb steht sie zuerst. Alle vier stehen jetzt auch im Kopf der
Regel, nicht nur hier:

1. **Ein Klassenname, der erst zur Laufzeit entsteht.** Gelesen werden Zeichenketten, Kopf und
   Ende einer Vorlagenzeichenkette und eine Konstante **derselben** Datei. `className={namen[art]}`,
   `className={props.variant}`, ein Name aus einer fremden Datei — ungelesen.
2. **Ein Stilblatt außerhalb von `apps/web/src`.** Ein eingefügtes `<style>`, ein Blatt aus einem
   fremden Paket, eine zur Laufzeit erzeugte Regel.
3. **Eine Lage, die zur Laufzeit gesetzt wird** — `knoten.style.position = "fixed"` in einem
   Effekt. Weder Stilblatt noch Stilangabe am Element.
4. **Eine fremde Fläche.** Ein Baustein aus einem fremden Paket, der seine eigene feste
   Abdunklung zeichnet; weder ihre Klasse noch ihr Blatt stehen in diesem Bestand.

### Was sie meldet statt zu schweigen

Keine Lücke — der Lauf wird rot und sagt, was er nicht lesen konnte: eine Zwischenstufe im
Portal, eine Stilangabe, die kein Objektliteral ist, ein Wert, der sich nicht auf eine Konstante
bringen läßt (A-A-119), eine Gestaltung, die die Fensterfestigkeit widerruft (A-A-120), und —
neu, siehe 3.4 — eine Lage, die **dieselbe** Gestaltung mehrfach verschieden erklärt.

### Die Grenze, die keine fünfte Runde schließt

**Über den Quelltext ist der erste Teilsatz von A-25.6 grundsätzlich nicht vollständig
zuzusichern.** „Hängt am Fenster" ist keine Eigenschaft des Textes, sondern des gerechneten
Kastens — in neunzehn Gestaltungen, zwei Farbmodi und jeder Fenstergröße. Zwischen der
Eigenschaft im Blatt und dem Kasten auf dem Schirm liegt die Kaskade, und dieser Leser ist keine:
Er kennt weder Spezifität noch Ursprung. Jede Menge über den Quelltext ist damit eine **Näherung
von unten** an eine Frage über die Ausgabe; die vier stillen Punkte oben sind Beispiele dafür,
keine Liste, die sich abarbeiten ließe.

**Was statt dessen trägt, steht im Bestand als Vorbild: der Augenschein.** T-353 hat in `glass`
gemessen und damit zwei Teilsätze von A-25.6 geschlossen, die kein Lauf zusichern konnte; T-357
hat mit demselben Mittel 980 × 11 998 bei (265, −523) und (0, 820) gemessen und damit **diese**
Runde ausgelöst. Die tragfähige Aufteilung ist deshalb: **dieser Lauf für die Bauart** — die
Stelle im Quelltext, die Eigenschaft im Blatt, der Absageweg — und **eine Messung im Browser für
die Wirkung**, über die Gestaltungen und die Modi, wie `proof:contrast`/T-337 es für den Kontrast
tut. Das ist ein Vorschlag an den Orchestrator und keine Zusage dieses Laufs (Abschnitt 7).

---

## 3. Was gebaut ist

### 3.1 Verdrahtung — der abgebrochene Anlauf zu Ende geführt

- `fensterfesteKlassen` liefert `{ klassen, befunde }`; beide Aufrufstellen nachgezogen.
- `koerperBlockBefunde` war geschrieben und **nie gerufen** — jetzt eine eigene Zusage.
- `findDismissThatConfirms` erntet an der Handlung: `istAbsageAttribut` + `escapeZweige`. Die
  toten Helfer sind jetzt der Weg. `ABSAGE_ATTRIBUTE` ist überall ersetzt.
- Ein Absageweg zählt **einmal**, auch wenn er aus mehreren Anweisungen besteht (der Rest eines
  Rumpfes hinter einer Wächterklausel ist eine Handlung, nicht drei).

### 3.2 Neue Zusagen über den Bestand (4 statt 2 unter G)

| Zusage | mißt |
|---|---|
| der Stilblattleser liest wirklich | 5 385 Erklärungen, mindestens eine `position`, mindestens eine unter `@media`/`@supports` |
| keine Gestaltung widerruft die Fensterfestigkeit | A-A-120, je Palette/Medienabfrage/Schicht |
| zwischen Abdunklung und Fenster steht kein umschließender Block | A-A-120/N-7, mit eigener Untergrenze (349 Erklärungen auf Körper und Wurzel) |
| Absagewege, nach Gattung aufgeschlüsselt | 7 über die Taste, 84 über 3 Rückrufnamen |

Die Untergrenze bei N-7 ist der Grund, warum die Zusage nicht leer wahr ist: Heute trägt **kein**
`body` und **kein** `:root` eine der elf blockbildenden Eigenschaften. Gezählt wird deshalb, ob
der Leser die Verbindung überhaupt findet — fällt die Zahl auf null, wird der Lauf rot, statt
über nichts zu urteilen.

### 3.3 Doppelte Überschrift

Die Ausgabe hatte **zwei** Abschnitte „H": Regel H und die Gegenproben. Die Gegenproben tragen
jetzt keinen Buchstaben — sie sind keine achte Regel, sondern dieselben acht gegen eine
eingesetzte Verletzung.

### 3.4 Zwei echte Fehler im vorgefundenen Stand

Beide sind **nicht** Verdrahtung, beide sind über die Gegenproben und den echten Bestand
gefunden:

**(a) Ein unlesbarer Wert fiel still aus der Menge.** `fensterfesteKlassen` verließ die Klasse
mit `continue`, wenn sie nicht *beweisbar* fensterfest war. `.scrim { position: fixed; inset:
var(--x) }` mit mehrdeutigem `--x` verschwand damit **lautlos** — genau die Richtung, die A-A-119
verbietet. Jetzt gemeldet.

Dabei zeigte der echte Bestand sofort die Gegenkante: Die naive Fassung meldete
`.skip-link { position: fixed; top: var(--space-2); left: var(--space-2) }` aus `base.css:300`.
Die Marke hat weder `right` noch `bottom` noch `width` noch `height` und kann das Fenster **nie**
füllen, gleich welchen Abstand eine Palette setzt. Gebaut ist deshalb eine **wohlwollende
Lesart**: Jeder unlesbare Wert wird so gesetzt, wie er der vollen Ausdehnung am besten dient
(Kanten auf `0`, Ausdehnung auf das Fenster); deckt die Fläche dann *immer noch* nicht, ist
Schweigen richtig. Das ist die Grenze zwischen „ich kann es nicht lesen" und „es ist gleichgültig,
was dort steht".

**(b) Kurzformen wurden für Verbreitungen gehalten.** `style={{ width, height, ...(x ? {} :
{ borderRadius: r }) }}` aus `Primitives.tsx:271` — `width` und `height` sind
`ShorthandPropertyAssignment` und fielen in den Zweig „keine benannte Angabe". Der Lauf meldete
eine Zeile, die mit Bestätigungsflächen nichts zu tun hat. Ein Wächter mit falschen Treffern wird
abgeschaltet.

Behoben, und dabei das Modell richtiggestellt: **Ein Objektliteral ist nicht eine Gestaltung,
sobald eine Verbreitung darin steht.** Gerechnet wird jetzt über die Eigenschaften in ihrer
Reihenfolge, eine Verbreitung vervielfacht die laufende Liste, der letzte Schlüssel gewinnt —
wie in JavaScript. Dasselbe für `style={x ? {…} : {…}}` aus `showcase/FoundationsSection.tsx:49`,
das der vorgefundene Stand als „kein Objekt, das dieser Lauf liest" meldete.

Gemeldet wird seither nur noch, was fensterfest **sein könnte**: Lage unlesbar **oder** `fixed`,
**und** Ausdehnung unlesbar **oder** voll.

### 3.5 Eine stille Stelle, die ich schließen konnte statt zu benennen

Der Leser ist keine Kaskade und läßt innerhalb einer Gestaltung die **letzte gelesene** Erklärung
gelten. Erklärt **dieselbe** Gestaltung `position` zweimal verschieden — zwei Stilblätter,
derselbe Selektor —, entscheidet die Lesereihenfolge von `readTreeSync` statt der Spezifität, und
eine fensterfeste Klasse könnte lautlos aus der Menge fallen. Das ist jetzt ein **Befund**.

Beim ersten Versuch war er zu weit: Er schlug auf Palette-über-Grundregel an. Das ist aber der
*Sinn* einer Palette und wird als Widerruf gemessen (A-A-120), nicht als Uneindeutigkeit.
Gemessen wird deshalb je Gestaltung über **ihre eigenen** Erklärungen. Beide Richtungen haben
eine Gegenprobe.

### 3.6 Selbstauskunft über A-25.6, nachgezogen

T-348 schrieb, sein Lauf trage zwei von fünf Teilsätzen. T-357 hat gemessen: in **zwei von fünf
zu weit**, nirgends zu eng. Die Tabelle steht jetzt **im Kopf der Regel** und nicht in einem
Bericht:

| Teilsatz | dieser Lauf |
|---|---|
| 1. hängt am Fenster, in jeder Gestaltung | **ja**, seit T-359 je Gestaltung, über die Eigenschaft, einschließlich der Stilangabe am Element — mit der benannten Grenze aus Abschnitt 2 |
| 2. ist vollständig sichtbar | **nein** — nur der Augenschein |
| 3. rollt nicht weg | **mittelbar**, Grenze schärfer als vermutet (N-7 wirkungslos, Gefahr an der Palette) |
| 4. fängt den Tastaturfokus | **nein** |
| 5. Abbrechen ist nie Zustimmung | **ja**, seit T-359 an der Handlung — Regel H |

---

## 4. Messung — alle vierzehn Gestalten, einzeln und beidseitig

### 4.1 Die Läufe

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | grün, 8 Projekte + Test- und E2E-Projekte |
| `pnpm boundaries` | grün, 528 Quelldateien |
| `pnpm contrast` | 0 von 522 Paaren durchgefallen, 11/11 Gegenproben |
| `pnpm proof:surface` | **54 bestanden, 0 fehlgeschlagen** (vorgefunden: Absturz; T-357-Nullpunkt: 45/0) |
| `pnpm build` | grün |

Ernte: 5 385 Erklärungen aus 7 Stilblättern (349 auf Körper/Wurzel, 0 blockbildend), fensterfeste
Klassen `.scrim`, 1 Fläche, 1 verankert; 91 Absagewege (7 über die Taste, 84 über 3 Rückrufnamen).
Darunter **34 Gegenproben**.

Daß die 91 unverändert sind, ist Zufall des Bestandes und kein toter Zweig — die Aufschlüsselung
nach Gattung steht jetzt in der Schlußzeile und beweist, daß beide Wege begangen werden.

### 4.2 Die vierzehn Gestalten

Jede einzeln, jede in **beide** Richtungen (muß rot sein / darf die richtige Bauart nicht melden):

| | Gestalt | Prüffall |
|---|---|---|
| N-1 | `position: fixed !important; inset: 0 !important` | Menge trifft die Eigenschaft (+ `! important` mit Leerzeichen) |
| N-2 | `position: var(--feste-lage)` | dieselbe (+ Rückfallwert einer unerklärten Variablen) |
| N-3 | Lage und Ausdehnung in **zwei** Regeln | dieselbe (mit einer fremden Regel dazwischen) |
| N-4 | `top/left: 0; width: 100vw; height: 100vh` | dieselbe (+ `100dvw/dvh`, `100%`, logische Kurz- und Langformen) |
| N-5 | `style={{ position: "fixed", inset: 0 }}` | Regel G erntet die Stilangabe am Element (7 Gestalten) |
| N-6 | Palette setzt `absolute` | Gestaltung widerruft (8 Gestalten) |
| N-6b | Palette setzt `static` | dieselbe |
| N-7 | `backdrop-filter` auf dem Körper | umschließender Block am Körper (8 Gestalten) |
| H-1 | `if (e.key !== "Escape") return;` | Regel H erntet die Handlung (+ Block, + Gegenzweig) |
| H-2 | `switch (e.key) { case "Escape": }` | dieselbe (+ Durchfallen aus leerem Fall) |
| H-3 | `onRequestClose` | dieselbe (11 Rückrufnamen geprüft) |
| H-4 | `["Escape","Esc"].includes(e.key)` | dieselbe (+ verneint) |
| T-356 a–c | zweite Regel, `!important`, `100vw/100vh` | deckungsgleich mit N-3, N-1, N-4 |

Dazu, über den Auftrag hinaus und aus derselben Frage entstanden: `:is()`/`:where()`, CSS-
Verschachtelung, `:not()`/`:has()`, `@keyframes`, `@font-face`, `@layer`, `@supports`, Kommentare
über mehrere Zeilen, Verneinung über `!`, Dreiweg, Zwischenveränderliche, `Esc`.

### 4.3 Mutationsprobe — beißen die Gegenproben wirklich?

Eine Gegenprobe, die auch gegen die kaputte Fassung grün bliebe, ist wertlos. Ich habe deshalb
**19 Mutationen** gefahren: jeden Mechanismus einzeln auf den Stand vor T-359 zurückgebaut
(`!important` nicht abgetrennt, Variablen nicht aufgelöst, nicht je Klasse vereinigt, `width`/
`height` nicht gelesen, Kurzformen nicht aufgelöst, Stilangabe nicht geerntet, nicht je
Gestaltung gerechnet, Körperblock nicht gemessen, Unlesbares übergangen, Uneindeutigkeit
übergangen, Verbreitung übergangen, Dreiweg nicht gelesen, `createElement` nicht geerntet,
Verneinung nicht mitgeführt, `switch` nicht gelesen, Attributnamen wieder als Liste,
Listenvergleich nicht verfolgt, Zwischenveränderliche nicht verfolgt, Wächterklausel ohne
Gegenzweig nicht gelesen).

**19 von 19 gefangen**, jede vom zugehörigen Prüffall. Das Werkzeug lag im Ablagebereich und ist
abgeräumt; die Mutationsdatei unter `apps/web/scripts/` ist gelöscht (`ls` bestätigt).

### 4.4 Ports

`ss -ltn` vor und nach der Arbeit: 17843, 17844 und 5173 **nicht** belegt — weder vorher noch
nachher. Dieser Auftrag hat keinen Dienst gestartet; `proof:surface` liest die Platte.

---

## 5. Annahmen

1. **Weiterbauen statt verwerfen** (Abschnitt 1) — die Richtung des Zwischenstands war die
   verlangte, und sie ist messbar. Jede Zeile gilt trotzdem als unbewiesen behandelt.
2. **Die wohlwollende Lesart** (3.4a): Ein unlesbarer Wert ist nur ein Befund, wenn er die Fläche
   decken *könnte*. Ohne diese Grenze meldet der Lauf `.skip-link`. Entschieden für die Grenze,
   weil ein Wächter mit falschen Treffern abgeschaltet wird — die Alternative wäre gewesen, den
   Bestand zu ändern, und das gehört nicht in diesen Auftrag.
3. **Die Klasse mit unlesbarer Ausdehnung kommt nicht in die Menge, sondern wird gemeldet.** Sie
   hineinzunehmen hieße, jede Fläche mit ihr als Befund zu führen — zuviel. Melden ist die
   Mitte, die A-A-119 verlangt.
4. **`ABSAGE_WORT` als Wortliste** (`dismiss|cancel|close|abort|reject|deny|escape|backdrop|
   outside`) ist eine Liste und damit dieselbe Gattung Risiko wie drei Namen — nur größer. Der
   Regelkopf sagt das ausdrücklich: Wer `onQuit` einführt, trägt es nach. An der Attributseite
   sehe ich keine Eigenschaft, an der sich „dies ist ein Absageweg" ohne Namen festmachen ließe.
5. **Keine Oberflächentexte, kein Design, keine Funktion geändert.** Nur `proof-surface.mjs`.

---

## 6. Risiken

- **R-neu (klein): `ABSAGE_WORT` ist eine Wortliste.** Ein Absageweg unter einem Namen außerhalb
  der neun Wörter bleibt ungeerntet. Gemildert, nicht behoben: die Ernte über die Taste läuft
  parallel und fängt jeden tastaturbedienten Weg.
- **Der Leser ist keine Kaskade.** Die eine stille Stelle daraus ist geschlossen (3.5); die
  Aussage bleibt: Er urteilt über Erklärungen, nicht über den gerechneten Kasten. Siehe die
  Grenze in Abschnitt 2.
- **Laufzeit.** `zweigZurTaste` läuft für eine Zwischenveränderliche einmal über die ganze Datei.
  Bei 171 Quelldateien und 7 Tastenstellen nicht meßbar; bei einem Vielfachen wäre es zu
  beobachten.
- **Sicherheit:** keine neue Fläche, keine neue Adresse, kein Netzzugriff. Der Lauf liest die
  Platte unterhalb von `apps/web/src`.

---

## 7. Offene Fragen an den Orchestrator

1. **Die Messung im Browser über die Gestaltungen** (Abschnitt 2, Grenze). Der Quelltextlauf kann
   den ersten Teilsatz von A-25.6 grundsätzlich nicht allein tragen. Im Bestand gibt es das
   Werkzeug schon: T-337 fährt 19 Paletten × 2 Modi für den Kontrast. Soll daraus ein Auftrag
   werden — „die Abdunklung liegt in jeder Gestaltung im Fenster, gemessen" —, und wenn ja, bei
   `visual-qa` oder bei `e2e-tester`? Das ist meines Erachtens der einzige Weg, diese Zusage
   **zu** zu bekommen statt sie zu verschieben.
2. **`.idle-reminder`** liegt heute richtig, weil die Providerreihenfolge stimmt, nicht weil es
   zugesichert wäre (T-347 1.1c). Die Klasse ist fest, aber nicht flächendeckend und fällt
   deshalb nicht unter Regel G. Soll sie eine eigene Zusage bekommen?
3. **Der unverbuchte Zwischenstand.** `apps/web/scripts/proof-surface.mjs` trägt jetzt T-334,
   T-339, T-341, T-348 und T-359 in **einem** unverbuchten Diff gegen `311b26e`. Solange das so
   bleibt, kann der nächste Anlauf an dieser Datei denselben Zuordnungsaufwand nicht vermeiden.
4. **`visual-qa` hat diesen Auftrag nicht geprüft** — es gibt nichts zu sehen. Geändert ist ein
   Nachweislauf, keine Oberfläche: keine neue Fläche, kein neuer Text, kein geändertes Verhalten.
   `typecheck`, `boundaries`, `contrast` und `build` sind grün, also ist auch nichts an der
   gerenderten Oberfläche anders als vor diesem Auftrag.

---

## 8. Nächster Schritt

Vorschlag: **Freigaberunde** (code-reviewer, security-checker) gegen diese Datei — dieselbe
Prüfung, die viermal hintereinander eine zu enge Menge gefunden hat, ein fünftes Mal. Die
Gegenproben und die Mutationsprobe sind ausdrücklich dafür gebaut, daß eine Lockerung teuer wird;
wer eine fünfzehnte Gestalt findet, sollte sie gegen `fensterfesteKlassen` und
`findDismissThatConfirms` einzeln fahren können.

Parallel, unabhängig davon: die Entscheidung zu Frage 1. Solange sie offen ist, steht im Kopf der
Regel eine benannte Grenze und keine Zusage — was besser ist als eine fünfte Runde, aber nicht
dasselbe wie eine geschlossene Fläche.
