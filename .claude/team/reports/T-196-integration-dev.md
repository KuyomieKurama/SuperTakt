# T-196 — Drei Streichungen, ein Zwilling, und eine halbierte Freigabe wieder ganz gemacht

**Rolle:** integration-dev **Datum:** 2026-09-06 **Zweig:** `versionspruefung-gegen-github`
**Grundlage:** `.claude/team/reports/T-195-spec-ux-reviewer.md`, Abschnitte zu Z-42, Z-44, Z-45,
dazu Z-43 und Z-46. `docs/design/textbestand-aufgabenbereich.md` (mein Papier, T-182),
`CLAUDE.md` (E-080, E-087), `.claude/team/decisions.md` (E-078, E-081, E-083).

**Stand, gegen den gemessen wurde** (E-087, und in diesem Bericht die tragende Angabe):
Arbeitsbaum auf `versionspruefung-gegen-github`, Vorfahr `d5440b2`, am **2026-09-06**. Der
Arbeitsbaum war zu diesem Zeitpunkt in 256 Pfaden verändert, weil in derselben Welle frontend-dev,
e2e-tester, unit-tester und ui-designer arbeiten. **Jede Zeilenangabe unten ist auf diesen Stand
datiert und auf keinen anderen.**

---

## Kurzfassung

```
Aufgabe: T-196 — ST-A-03, ST-A-06, ST-A-08 samt Zwilling; zwei Berichtigungen im eigenen Papier
Status: fertig
```

---

## 1. Was gebaut ist

Vier Textstellen, drei Einträge, **eine** Freigabe wieder ganz.

| Ort (nach der Änderung) | vorher | nachher | Herkunft |
|---|---|---|---|
| `apps/outlook-addin/src/ui/Primitives.tsx:257` | `title: 'Standard-Tag aus den Einstellungen (A-9.3)'` | `title: 'Standard-Tag aus den Einstellungen'` | ST-A-03 / **Z-42** |
| `apps/outlook-addin/src/ui/Primitives.tsx:261` | `title: 'Dieses Tag gibt es in Takt noch nicht. Es entsteht zusammen mit dem Todo.'` | `title: 'Entsteht zusammen mit dem Todo.'` | ST-A-06 / **Z-44** |
| `apps/outlook-addin/src/ui/TaskPane.tsx:662` | `hint="Interner Vermerk des Todos. Er geht nicht in die Abrechnung."` | `hint="Er geht nicht in die Abrechnung."` | ST-A-08 / **Z-45** = **F-2 aus T-165** |
| `apps/outlook-addin/src/ui/TaskPane.tsx:834` | `hint="Dieser Text wird exportiert. Text aus der E-Mail gehört in den Vermerk, nicht hierher."` | `hint="Text aus der E-Mail gehört in den Vermerk, nicht hierher."` | **kein Eintrag meines Papiers — F-3 aus T-165** |

Jede Änderung trägt ihre Begründung als Kommentar unmittelbar daneben, einschließlich der
Auflagen: SP-A-12 als Bedingung von ST-A-06, SP-A-01 als neue Sperre über
„Er geht nicht in die Abrechnung.", SP-A-05 als das, was am Leistungsfeld ausdrücklich **nicht**
fällt.

### Warum der Zwilling mitmusste

T-165 hat in **einer** Tabelle mit **einer** Begründung zwei Sätze freigegeben: F-2 am Vermerkfeld
und F-3 am Leistungsfeld, beide „reine Verdopplung der Beschriftung darüber". Mein Papier hat F-2
als ST-A-08 in die Streichliste aufgenommen und F-3 in **SP-A-05** als gesperrt weitergeschrieben.

Wäre nur ST-A-08 gefallen, stünden danach zwei identische Befunde aus einer Freigabe auf zwei
verschiedenen Listen — einer ausgeführt, einer gesperrt —, und **nirgends** stünde das Wort
Rücknahme. Beide Listen sähen vollständig aus. Deshalb fallen beide in einem Handgriff.

### Was ausdrücklich **nicht** angefasst ist

- **ST-A-05** („Ausdruck auf den Beispieltext anwenden" → „Ausprobieren"). Zwei Vorbedingungen,
  beide gemessen: `tests/e2e/outlook-addin-build.spec.ts` führt den Knopftext als
  `getByRole`-Namen, `docs/testplan.md` schreibt ihn aus — **TP-BUILD-04 ginge rot** in einem Lauf
  über den Worker-Chunk. Dazu ui-designer, weil 38 Zeichen auf 12 in einer 320–450 px breiten
  Spalte Dichte sind (E-078 Punkt 4).
- **`apps/outlook-addin/src/ui/App.tsx` — die letzte Duz-Stelle (O-GE).** Reihenfolge bindend:
  e2e-tester löst den Wortlaut, **dann** die Umstellung, **dann** fällt `IMPERATIV_AUSNAHME`. Die
  Ausnahme ist selbstauflösend und geht rot, wenn ein Schritt fehlt — sie jetzt anzufassen hieße,
  einen Wächter auf Verdacht zu öffnen.
- **SP-A-02, der Fristsatz.** V-04 aus T-165, unverändert freigegeben, zeichengleich.
- **Die aria-Verdrahtung aus T-158.** Kein `Field` ist entstanden oder verschwunden; der Wächter
  zählt weiterhin zwölf, Hinweis und Fehler bleiben gleichzeitig erreichbar.
- **Anhänge.** Über das Add-in entstehen weiterhin keine. Kein Exportschlüssel hat sich bewegt.

---

## 2. E-087, vor jeder Wortlautänderung gemessen

Gesucht wurde der **heutige** Wortlaut in `tests/**`, `apps/*/test/**`, `apps/*/scripts/**` und
`scripts/**`:

| Zeichenkette | Treffer im Prüfcode |
|---|---|
| „Standard-Tag aus den Einstellungen" | **keiner** |
| „Dieses Tag gibt es in Takt noch nicht" | **keiner** |
| „Es entsteht zusammen mit dem Todo" | **keiner** |
| „Interner Vermerk des Todos" | **keiner** |
| „Er geht nicht in die Abrechnung" | **keiner** |
| „Dieser Text wird exportiert" | **keiner** |
| „Text aus der E-Mail gehört in den Vermerk" | **keiner** |

Repository-weit sind die einzigen Träger die vier Quelldateien und mein eigenes Papier. Ein
Nebenbefund: `apps/desktop/src-tauri/taskpane/assets/index-*.js` ist ein **eingechecktes Bündel**
und enthält Kopien dieser Sätze. Es ist Bauergebnis, kein Träger — aber eine naive
Repository-Suche findet es und hält es für einen.

---

## 3. Die zwei Berichtigungen im eigenen Papier — und der Grund dahinter

### 3.1 Der Widerspruch um SP-A-05 (der Zwilling)

`docs/design/textbestand-aufgabenbereich.md` nannte an zwei Stellen **zwei verschiedene Umfänge**:
Abschnitt A-04 führte die **ganze** `hint` als „Gesperrt, SP-A-05", die Sperrlistenzeile selbst
zitierte nur den **zweiten** Satz. Ein Papier, das zwei Umfänge nennt, entscheidet die Frage beim
nächsten Lesen nach Zufall — und die weiter vorn stehende Angabe gewinnt.

**Nicht glattgezogen, sondern sichtbar gemacht.** Beide Stellen sagen jetzt dasselbe **und** sagen,
dass der Unterschied kein Schreibfehler war: Der erste Satz war eine ausgeführte Freigabe (F-3),
die diese Aufnahme in eine Sperre umgeschrieben hat. Dazu ein neuer **Abschnitt 4.1 — „Was ein
Sperrlisteneintrag nicht sein darf"** mit der Bauart als Klasse und zwei Regeln:

1. Ein Sperrlisteneintrag nennt den Umfang **zeichengenau**, und wo ein Hinweis aus zwei Sätzen
   besteht, steht das in **beiden** Listen gleichlautend.
2. Wer einen Satz sperrt, prüft **zuerst**, ob er schon einmal freigegeben wurde — über den
   Wortlaut in `.claude/team/reports/**`, nicht über die Kennung. Freigaben tragen dort Buchstaben
   wie F-2, V-04, X-02 und nicht die Kennungen meines Papiers.

### 3.2 „vier Streichungen ohne Prüfpunkt und ohne fremde Datei"

Gemessen falsch für ST-A-05. Die Zeile in Abschnitt 10 bleibt **durchgestrichen stehen** statt
ersetzt zu werden, mit einer Berichtigung darunter — sonst wäre die Korrektur unsichtbar. Der Satz
darunter ist der eigentliche Ertrag:

> **Vier Einträge in einer Zeile sind eine Behauptung über vier Messungen.** Wer bündelt, misst
> jeden einzeln — sonst erbt der eine, der eine fremde Datei hat, die Harmlosigkeit der drei
> anderen.

### 3.3 Der Stand, gegen den gemessen wurde — und was die Messung ergab

Neuer Block **„Stand der Messung (E-087)"** im Kopf des Papiers. Er datiert jede Zeilenangabe und
hält fest, was die Messung gefunden hat: In `TaskPane.tsx` stand **keine einzige** der genannten
Zeilen dort, wo das Papier sie nennt. **Dreizehn Angaben, alle in dieselbe Richtung, elf davon um
exakt acht Zeilen.** Kein Wortlaut war geändert — jemand hatte oberhalb von `:463` acht Zeilen
Kommentar eingefügt.

`Primitives.tsx:230`/`:234`, `TagPicker.tsx:330` und `SettingsView.tsx:382`/`:403` stimmten
dagegen zeilengleich.

**Und derselbe Fehler ist mir noch am selben Tag in T-195 begegnet.** spec-ux-reviewer hat seine
Fundstellen ausdrücklich selbst am Baum gemessen und nennt `outlook-addin-build.spec.ts:108`,
`ui/App.tsx:191` und `outlook-addin-build.spec.ts:65`. Wenige Stunden später standen sie auf
**`:118`, `:198` und `:66`** — Zeichenketten unverändert, nur die Zahlen bewegt, weil in derselben
Welle andere Agenten in denselben Dateien arbeiten. **Eine Zeilenangabe altert nicht in Wochen,
sondern in Stunden.** Die Substanz aller drei Aussagen von T-195 hält; nur die Zahl hielt nicht.

Daraus die Regel, die jetzt im Papier steht: **Wer einen Eintrag umsetzt, sucht ihn über den
zitierten Wortlaut, nicht über die Zeile.** Die Einträge nennen ihre fremden Dateien ab jetzt ohne
Zeile.

---

## 4. Nachweis — Zahlen vorher und nachher

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | 0 Fehler | **0 Fehler** |
| `pnpm test` | 1456 grün / 76 Dateien | **1456 grün / 76 Dateien** |
| `pnpm run proof:addin` | 224 / 0 | **224 / 0** |
| `pnpm run proof:taskpane` | 25 / 0 | **25 / 0** |
| `pnpm run proof:codepoints` | 45 / 0 | **45 / 0** |

**Der Auftrag nannte 1442 grün; gemessen waren es vorher wie nachher 1456.** Das ist keine
Abweichung durch diese Aufgabe — unit-tester arbeitet in derselben Welle. Es ist dieselbe Sorte
Papierzahl, um die es in Abschnitt 3.3 geht, und deshalb steht sie hier statt in einer Fußnote.

`proof:all`, `proof:addin-wiring` und `test:e2e` sind **nicht** gefahren (E-083 Punkt 3, fester
Port, parallele Welle).

---

## Artefakte

- `apps/outlook-addin/src/ui/Primitives.tsx` — ST-A-03, ST-A-06 samt Begründung und Auflagen
- `apps/outlook-addin/src/ui/TaskPane.tsx` — ST-A-08 und der Zwilling, je mit Begründung
- `docs/design/textbestand-aufgabenbereich.md` — Stand der Messung; A-04 und A-10 nachgeführt;
  SP-A-01 erweitert; SP-A-05 berichtigt; neuer Abschnitt 4.1; ST-A-03/05/06/08 nachgeführt;
  Abschnitt 5 um die O-GE-Reihenfolge ergänzt; Abschnitt 8 umbenannt und um 8.6 erweitert;
  Abschnitt 9 Punkt 5 um die Linie aus Z-46; Abschnitt 10 berichtigt
- `.claude/team/reports/T-196-integration-dev.md` — dieser Bericht

## Annahmen

1. **Der Zwilling gehört in diese Aufgabe**, obwohl er in keiner Streichliste steht. Der Auftrag
   sagt es, Z-45 Auflage 1 sagt es, und ohne ihn wäre die Ausführung selbst die Halbierung.
2. **„Er geht nicht in die Abrechnung." habe ich in SP-A-01 aufgenommen**, nicht als eigenen
   Sperrlisteneintrag. Z-45 sagt „gehört in SP-A-01 hinein, nicht daneben"; ich habe das wörtlich
   genommen.
3. **Die stehengebliebene `hint` am Leistungsfeld bleibt in SP-A-05**, nur mit berichtigtem
   Umfang. Eine neue Kennung hätte die Geschichte des Eintrags gekappt.
4. **Zeilenangaben habe ich nur dort nachgeführt, wo ich sie heute gemessen habe.** Die übrigen
   rund 75 Verweise im Papier stehen unverändert und sind im Kopf ausdrücklich als „seit
   2026-09-05 nicht nachgemessen" gekennzeichnet. Sie stillschweigend zu aktualisieren hätte
   dieselbe Zusicherung erzeugt, gegen die E-087 gerichtet ist.
5. **Die durchgestrichene Zeile in Abschnitt 10 bleibt stehen.** Sie zu löschen wäre die
   bequemere, aber unsichtbare Berichtigung.

## Risiken

1. **ST-A-06 hängt an SP-A-12, und diese Abhängigkeit ist nur in Prosa gesichert.** Fällt
   `TagPicker.tsx:330`, verliert der Aufgabenbereich jede ganze Aussage darüber, dass ein Tag noch
   nicht existiert — der Chip trägt dann nur noch das Wort „neu" und einen gestrichelten Rahmen.
   **Kein Lauf misst das.** Die Bedingung steht im Dateikopf von `CHIP_NOTE` und in zwei Stellen
   des Papiers; sie ist eine Zusicherung, kein Wächter.
2. **Dieselbe Lücke bei SP-A-01.** „Er geht nicht in die Abrechnung." ist jetzt der letzte ganze
   Satz, der die Grenze aus A-7.2/R-08 ausspricht. Kein Prüfpunkt hält ihn zeichengleich — E-087
   hat für alle sieben betroffenen Zeichenketten **keinen** Treffer gefunden. Die Grenze zwischen
   internem Vermerk und Abrechnung ist damit im Add-in **textlich ungemessen**.
3. **`title` auf einem `<span>` bleibt der Träger beider Chip-Erklärungen** (Regel S-16): auf
   Berührungsgeräten unsichtbar, über die Tastatur nicht erreichbar. Die Kürzung hat das weder
   verbessert noch verschlechtert — aber der Eintrag sieht jetzt nach „erledigt" aus. Drüben hat
   ST-09 dieselbe Bauart mit einem `visually-hidden`-Text aufgelöst; hier fehlt er.
4. **`apps/desktop/src-tauri/taskpane/assets/index-*.js` ist ein eingechecktes Bündel** mit
   Kopien der geänderten Sätze. Es ist jetzt veraltet. Solange es im Repository liegt, findet jede
   Wortlautsuche Treffer, die keine Träger sind — und eine Suche, die es ausschließt, übersieht
   umgekehrt einen ausgelieferten Stand.
5. **Der Arbeitsbaum war beim Messen in 256 Pfaden verändert.** Meine Zeilenangaben gelten für
   diesen Zwischenstand. Sobald die Welle zusammengeführt ist, sind sie erneut Daten und keine
   Nachweise — genau darum steht die Wortlautregel im Papier.

## Offene Fragen

1. **An den Orchestrator, zu Risiko 1 und 2:** Soll eine Zusicherung in `proof:addin`
   nachgezogen werden, die (a) `TagPicker.tsx`s „entsteht beim Anlegen des Todos" und (b)
   `TaskPane.tsx`s „Er geht nicht in die Abrechnung." zeichengleich hält? Beide sind jetzt
   alleinige Träger, beide sind ungemessen. Der Lauf ist meine Hoheit; die Entscheidung, ob eine
   Sperre einen Wächter bekommt, ist es nicht.
2. **An den Orchestrator, zu Risiko 4:** Gehört das gebaute Add-in-Bündel unter
   `apps/desktop/src-tauri/taskpane/assets/` überhaupt ins Repository? Es macht jede E-087-Suche
   unzuverlässig. Die Datei liegt außerhalb meiner Hoheit.
3. **An e2e-tester und ui-designer, über den Orchestrator:** ST-A-05 ist in der Sache freigegeben
   und wartet auf beide. Der neue Knopftext lautet „Ausprobieren"; mitzuziehen sind
   `tests/e2e/outlook-addin-build.spec.ts` und `docs/testplan.md`, beide fremde Hoheit. Der
   Handgriff auf meiner Seite ist eine Zeile.
4. **An e2e-tester:** O-GE. Sobald der Wortlaut in `tests/e2e/outlook-addin-build.spec.ts` gelöst
   ist, stelle ich `App.tsx` um und lösche `IMPERATIV_AUSNAHME` — in dieser Reihenfolge, in einer
   Welle nach seiner.

## Nächster Schritt

1. **ui-designer, dann e2e-tester und integration-dev in einem Auftrag:** ST-A-05.
2. **e2e-tester, dann integration-dev:** O-GE in zwei Wellen, wie in Abschnitt 5 des Papiers
   festgeschrieben.
3. **Orchestrator, eine Zeile:** die Antwort auf Offene Frage 1 — mit ihr wird aus zwei
   Zusicherungen ein Wächter.
4. **spec-ux-reviewer:** die drei gebauten Einträge gegenlesen, insbesondere Abschnitt 4.1 — ob
   die zwei Regeln die Bauart wirklich fangen oder ob sie in den Kopf von `textbestand.md`
   gehören, wo sie auch für die Hauptanwendung gelten würden.
