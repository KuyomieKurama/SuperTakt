# T-344 — Die beiden Papiere gegeneinander berichtigt, in einem Auftrag

**Rolle:** ui-designer. **Stand:** 2026-09-13. **Zweig:**
`feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e`.
**Vorlagen:** `.claude/team/reports/T-343-spec-ux-reviewer.md`, `T-341-frontend-dev.md`,
`T-339-ui-designer.md`, `T-340-ux-designer.md`; `decisions.md` E-112 bis E-116;
`docs/spec.md` Abschnitt 25 (A-25.1 bis A-25.7).

**Geänderte Dateien — zwei, beide vom Orchestrator für diesen einen Auftrag zusammengelegt:**

| Datei | Sonst |
|---|---|
| `docs/design/fensterfeste-flaechen.md` | ui-designer (meins) |
| `docs/design/fensterfeste-flaechen-fluss.md` | ux-designer — **benannte Ausnahme für T-344** |

Kein Produktivcode, keine Prüfdatei, nichts unter `apps/**`, `packages/**` oder `tests/**`.
`docs/spec.md` ist **gelesen**, nicht geändert.

---

## 1 B-02 — der Widerspruch am selben Fall, und woran der Irrtum hing

`fensterfeste-flaechen.md` 9.6 Punkt 2 erklärte den Überlauf von `div.settings-layout` bei
1024 × 640 für **richtig** und machte ihn zur benannten Ausnahme von A8; 9.2 nahm die Fenstergröße
eigens dafür auf. `-fluss.md` R-3a und **E-115** sagen: getragenes Fenster, also **Fehler**.

**Berichtigt ist mein Papier, nicht die Entscheidung.** A8 nimmt `.screen__body--frame` ab jetzt
**nur unterhalb von 960 × 640** aus. Bei 1024 × 640 bleibt der Fall **rot** und trägt den Namen des
Befundes, bis 7.5 gebaut ist. Grün wird er durch die Behebung, nicht durch die Ausnahme.

**Woran der Irrtum hing — das ist der Teil, der über den Fall hinausgeht.** Die Ausnahme war aus
einer **Messung** abgeleitet, die niemand als Fehler gelesen hatte: T-334 maß 86 px und ordnete sie
als Rückfall ein; T-339 übernahm die Zahl, baute die Ausnahme darauf und stellte in 9.2 eine
Fenstergröße dazu, damit sie nicht toter Text bleibt. Kein Schritt war nachlässig. Der Fehler liegt
eine Ebene höher: **Eine Messung trägt eine Zahl, keine Einordnung.** Zum Beweis, daß die Zahl allein
nichts trägt: T-341 mißt denselben Zustand als **62 px** am Rahmen. Beide stimmen — sie messen aus
verschiedener Höhe. **Wer eine Ausnahme an einer Zahl festmacht, macht sie an der Meßstelle fest.**

## 2 B-03 — ein Begriff von „getragen", mit der Rechnung dahinter

7.1 führte **zwei** getragene Bereiche; `viewport-fit.spec.ts:34-45` zitiert die weitere Fassung
wörtlich, und daran hängen zehn gemessene Verstöße. Ab jetzt gilt in **beiden** Papieren:

> **Getragen heißt: Fenster mindestens 960 × 640 und Inhaltsbereich ungeschmälert.**

Die zweite Zeile heißt **„bedienbar im Browserbetrieb"** und sichert AK-24 zu, nicht AK-02;
waagerecht gilt A2a ohne Untergrenze. Begründet ist das mit der Messung aus T-341 3.5 und nicht mit
einem Wunsch: Unterhalb von 52 rem nimmt die Hülle **225 statt 52 px** (Bandnavigation allein
173 px), bei 640 × 480 also 47 % der Fensterhöhe; der kleinstmögliche Kopf ist ≈ **188 px** gegen
**175 px** Budget. **Der Boden liegt über dem Budget, unabhängig von jeder Filterleiste.** Es ist
eine Grenze und keine Nachlässigkeit — und der einzige verbleibende Hebel, die Bandnavigation, steht
als offene Frage (OF-7 / offene Frage 6) mit meinem Vorschlag, es bei der schwächeren Zusage zu
belassen.

## 3 B-07 — worauf die Sprungmarke zeigt: entschieden

**Die Regel, deckungsgleich mit A-25.5:**

> Die Marke zeigt auf den **Inhaltshalt**: den innersten Kasten, der den Inhalt der Ansicht trägt
> und in mindestens einer getragenen Fensterform eine **eigene Laufstrecke** hat. Nicht auf den
> Kasten, der so heißt.

| Ansicht | `id="inhalt"` | Laufstrecke |
|---|---|---|
| die acht Regelansichten | `.screen__body` | senkrecht — unverändert |
| Einstellungen | die `RunArea` des Bereichs | senkrecht |
| Zeiterfassung | **Laufbereich A** | senkrecht; unter 68 rem rollt Bild-ab von dort den Rahmen |
| Kanban | **`.board`** | **waagerecht** |

**Wer einen Halt bekommt:** `.screen__body`, `.runarea` und neu `.board` (Name „Kanban", vorhandener
Text). **Die Rahmen in Einstellungen und Kanban geben Halt, Rolle und Namen ab** — sie laufen in
keiner getragenen Form. Der `--split`-Rahmen der Zeiterfassung behält alles außer der Marke, weil er
unterhalb von 68 rem der einzige senkrechte Läufer ist; **der Preis steht dabei**: oberhalb ruht der
Halt. Die Alternative wäre ein JavaScript, das `tabIndex` an einer Breitenschwelle umlegt — eine
zweite Wahrheit über die 68 rem.

**Bilanz gegen heute:** Einstellungen von **neun** Schritten auf **null**; Kanban von einem toten
Halt auf einen, der das Board bewegt; Zeiterfassung von drei Halten (einer tot in jeder Größe) auf
drei, von denen oberhalb von 68 rem einer ruht.

**AK-14 ist neu gefaßt**, die Zahl „genau ein weiterer Schritt" ist zurückgenommen. Gemessen wird
(a) der markierte Kasten hat eine Laufstrecke, (b) **null** Tabulatorhalte dazwischen, (c) Bild-ab
(im Kanban Pfeil rechts) bewegt **diesen** Kasten. Dazu **A9** im Meßsatz. Punkt (c) ist der
eigentliche: Ohne ihn mißt ein Lauf einen Bezeichner statt eines Verhaltens — das hat B-07 möglich
gemacht.

**Gegen T-341s Einwand** („bei 1024 × 640 bewirkt die Marke am Rahmen als einziger Größe etwas"):
Genau dort läuft der Rahmen wegen des E-115-Verstoßes. **Einen Tastaturweg auf einen Fehlerzustand
zu stellen, heißt, ihn zu brauchen.**

## 4 Mitgenommen

- **B-10** — `min-block-size: 0` gehört nur an `.screen__body--frame > *`; an `.screen > .screen__body`
  überschriebe es (0,2,0 gegen 0,1,0) den 4-rem-Boden und baute den Rückfall aus. Die zehnte
  widerlegte Stelle, gefunden an einem Kommentar (`viewport-layout.css:413-419`), nicht am Bild.
- **B-09** — 5.2 begründete die fehlende Rinne an `.app__main` mit „nicht mehr der Läufer"; 7.2 sagt
  das Gegenteil. **Entschieden gegen die Rinne:** Sie kostete 10 px Inhaltsbreite in jedem Fenster
  und für immer, gegen einen Sprung in dem einen Fall, in dem eine Meldung steht. **AK-10 gilt
  deshalb ohne den Rückfall**, und der Preis steht im Satz statt im Kleingedruckten.
- **B-11** — „Noch kein Tag" (S-08) und „Noch kein Vorgang protokolliert" sind **Kartenleerzustände**;
  falsch war die Einordnung in R-5, nicht AK-07. Das Kennzeichen ist ab jetzt prüfbar: *Ein
  Bildschirmleerzustand ist ein **direktes Kind** des Laufbereichs.* Die verbliebenen vier decken
  sich mit den drei gebauten Selektoren — das ist die Gegenprobe.
- **B-12** — AK-15 bekommt denselben Satz wie 8.5. Der greifbare Text „Todo wird geladen" wäre im
  **Fehler**zustand derselben Fläche unwahr; ein Name, der in einem von zwei Zuständen stimmt, ist
  schlechter als keiner.
- **B-06** — R-4/AK-15 gelten für die Laufbereiche **aus Abschnitt 4**. `.board` bekommt Namen und
  Halt; die Laufstrecke eines **Bausteins** (`.kcolumn__body`, die Tabellen der Exportgruppen) nicht
  — mit der meßbaren Auflage, daß in ihrer **rechtesten** Spalte ein fokussierbares Element stehen
  muß, sonst doch ein Halt.
- **B-05** — 7.4 ist auf das Kanban eingeschränkt: Umbruch ab einer Aktionsgruppe von ≈ **486 px**
  bei 662 px Kopfbreite; nur das Kanban hat 785,3. Die Kante **1259 px ist jetzt gemessen** (1260
  nicht umgebrochen), damit ist eine der beiden „gerechnet, nicht gemessen"-Zahlen eingelöst. Neu
  beziffert: der umbrochene Kopf ist an seiner Kante **50 px niedriger** (137,8 gegen 187,8).
- **Deckung** — beide Papiere verweisen auf **A-25.1 bis A-25.7** statt ihre eigene Deckung zu
  behaupten; `-fluss.md` trägt eine Zuordnungstabelle Regel → ID.

## 5 Neu entschieden: wie ein fester Teil nachgibt (7.5, OF-6)

Die Bereichsschiene verliert bei knapper Höhe **ihren Zusatz** — dieselbe Gestaltung, die sie bei
knapper Breite schon verliert, an der zweiten Achse angeschlossen. Nicht die Bandgestalt (sie dreht
die Leserichtung, AK-05), nicht ein eigener Laufbereich (Halt, Name und zweite Bildlaufleiste für
acht festgelegte Einträge). Schwelle **gerechnet, nicht gerundet**: 576,7 px Schiene + 125 px Kette
⇒ Kante bei ≈ 702 px ⇒ `max-height: 44rem`. **Eine Zahl fehlt und ist vor dem Bau zu messen:** die
Höhe der Schiene ohne Zusatz gegen 579 px Rahmen.

Eine **Fenster**höhenabfrage ist hier zulässig, obwohl R-3 am Inhaltsbereich mißt: AK-23 beziffert
das Budget ausdrücklich ohne Hüllenmeldung, und genau diesen Zustand trifft sie. Sie kann **zu
wenig** tun, nie zu viel — steht eine Meldung, greift der Rückfall. Eine Behälterabfrage wäre
genauer und ist ausgeschlossen: Sie bräuchte `container-type: size`, und Größenbehalt macht den
Kasten zum umschließenden Block für feste Positionierung (8.3).

## 6 Der zweite Satz im Kopf

> **Zwei Papiere, die einander nicht lesen, widersprechen einander nicht seltener — nur später.**

Arbeitsregel daraus, und sie ist eine über **Aufträge**, nicht über Papiere: **Wer denselben
gemessenen Fall berichtigt, berichtigt ihn in einem Auftrag** — auch wenn die Dateihoheit zwei Namen
nennt. Getrennte Hoheit trennt Dateien, nicht Widersprüche.

---

```
Aufgabe: T-344 — Die beiden Papiere gegeneinander berichtigt, in einem Auftrag
Status: braucht Review
Artefakte: docs/design/fensterfeste-flaechen.md, docs/design/fensterfeste-flaechen-fluss.md,
  .claude/team/reports/T-344-ui-designer.md
Zusammenfassung: Die drei blockierenden Widersprüche aus T-343 sind in beiden Papieren
  widerspruchsfrei entschieden. B-02: A8 nimmt den Rahmen nur noch unterhalb von 960 × 640 aus,
  bei 1024 × 640 bleibt der Fall rot und trägt den Namen des Befundes — E-115 gilt, mein Papier
  war falsch, und der Irrtum hing daran, daß die Ausnahme aus einer Messung abgeleitet war, die
  niemand als Fehler gelesen hatte (T-334: 86 px, T-341: 62 px, dieselbe Sache aus verschiedener
  Höhe). B-03: „getragen" heißt ab jetzt in beiden Papieren „mindestens 960 × 640 und
  ungeschmälerter Inhaltsbereich"; die zweite Zeile heißt „bedienbar im Browserbetrieb" und
  sichert AK-24 zu, begründet mit der Rechnung aus T-341 — unterhalb 52 rem nimmt die Hülle 225
  statt 52 px, und der kleinstmögliche Kopf ist ≈ 188 px gegen 175 px Budget. B-07: Die
  Sprungmarke zeigt auf den Inhaltshalt — Einstellungen auf den Bereich, Zeiterfassung auf
  Laufbereich A, Kanban auf `.board`; die Rahmen in Einstellungen und Kanban geben Halt, Rolle
  und Namen ab, der --split-Rahmen behält sie mit benanntem Preis. AK-14 ist neu gefaßt (null
  Schritte statt „genau einer", und Bild-ab muß messbar etwas bewegen), dazu A9 im Meßsatz.
  Mitgenommen sind B-05, B-06, B-09, B-10, B-11, B-12 und die Deckung über A-25.1 bis A-25.7;
  neu entschieden ist 7.5 (der Zusatz der Bereichsschiene weicht bei knapper Höhe), womit OF-6
  geschlossen ist.
Annahmen: (1) Ich habe OF-6 selbst entschieden, statt sie zurückzugeben — sie war ausdrücklich an
  den ui-designer abgegeben, und ohne sie bliebe B-02 eine Berichtigung ohne Ausweg. (2) Der Halt
  am --split-Rahmen bleibt, obwohl er oberhalb von 68 rem ruht; die Alternative wäre ein
  JavaScript an einer Breitenschwelle. (3) `.kcolumn__body` bekommt **keinen** Halt — zwölf
  Spalten wären zwölf Halte für eine Zusage, die der Fokus der Karten schon einlöst. (4) Die
  Sprungmarke führt in den Einstellungen an der Bereichsschiene vorbei; das ist der Zweck einer
  Sprungmarke, nicht ein Verlust.
Risiken: Die Entscheidung zu B-07 verlegt eine Kennung. E-114 gilt: Wer sie verlegt, sucht nicht
  ihren Wortlaut, sondern ihre **Benutzung** — `#inhalt` steht in elf Dateien, sieben davon als
  Geltungsbereich. Der Auftrag an frontend-dev muß die Suche enthalten, bevor er baut; ich habe
  sie nicht gefahren, weil sie gegen den Stand des bauenden Auftrags gehört und nicht gegen
  meinen. Zweitens: Solange 7.5 nicht gebaut ist, ist A8 bei 1024 × 640 rot — beabsichtigt, aber
  jemand muß es wissen, sonst wird es in der nächsten Welle „gelockert". Sicherheitsseitig
  nichts: keine Adresse, kein Datenweg, keine Route, kein Oberflächentext.
Offene Fragen: (1) An den Auftraggeber über den Orchestrator: die Bandnavigation nimmt unterhalb
  von 52 rem 173 px Fensterhöhe und ist der einzige verbleibende Hebel für 831 × 640 und
  640 × 480 — gedrängter machen oder bei der schwächeren Zusage bleiben? Mein Vorschlag ist das
  Zweite (offene Frage 6 / OF-7). (2) Offene Frage 5 bleibt offen und wird durch die erteilte
  Einzelfreigabe nicht kleiner: Der Erklärsatz des Kanban-Umschalters gehört nicht in den
  Bildschirmkopf; an ihm hängen 1259 px, 20,7 px Luft und 537 px fester Teil zugleich. (3) Die
  Höhe der Bereichsschiene **ohne** Zusatz ist die eine Zahl, die 7.5 fehlt.
Nächster Schritt: Eine Welle mit drei getrennten Aufträgen, in dieser Reihenfolge —
  (a) frontend-dev: Sprungmarke und Halte nach 8.5, `.board` als benannter Laufbereich, Schiene
  nach 7.5, samt der E-087/E-114-Suche über die **Benutzung** von `#inhalt`;
  (b) e2e-tester: A2/A2a-Geltungsbereich, A8 mit der berichtigten Ausnahme, A9, die zwei Größen
  aus 9.2 und der Kopfkommentar von `viewport-fit.spec.ts:34-45`, der die widerlegte Fassung von
  7.1 zitiert; (c) danach spec-ux-reviewer erneut über beide Papiere — B-01 bis B-04 und B-07
  sollten damit fallen.
```
