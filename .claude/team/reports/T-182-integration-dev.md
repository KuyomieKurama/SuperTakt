# T-182 — Die Textaufnahme für den Aufgabenbereich, nach fremdem Raster

**Rolle:** integration-dev. **Welle:** AA. **Datum:** 2026-09-05/06.
**Anlaß:** O-FF, E-078 Nachtrag Punkt 7. **Raster:** `docs/design/textbestand.md` Abschnitt 11
(dazu 1, 1.1, 1.2, 2) — von ux-designer, unverändert angewandt.

---

Aufgabe: T-182 — Textaufnahme Aufgabenbereich des Add-ins (E-078 Nachtrag Punkt 7)
Status: fertig

Artefakte:
- `docs/design/textbestand-aufgabenbereich.md` (neu, 10 Abschnitte)
- `apps/outlook-addin/src/ui/TaskPane.tsx`
- `apps/outlook-addin/src/ui/SettingsView.tsx`
- `apps/outlook-addin/src/ui/Primitives.tsx`
- `apps/outlook-addin/src/callnumber/labels.ts`
- `apps/outlook-addin/src/callnumber/pattern.ts`
- `.claude/team/reports/T-182-integration-dev.md`

---

## 1. Die Aufnahme (Teil 1)

### 1.1 Regel M-01 — der Bruch

| Bereich | Dateien | davon `.tsx` | gelesen |
|---|---|---|---|
| `apps/outlook-addin/src` | **32** (25 `.ts`, 7 `.tsx`) | 7 | **32 von 32** |
| `apps/local-api/src/routes/addin` | 4 | 0 | **4 von 4** |
| `packages/export/src` | 8 | 0 | **8 von 8** |
| `manifest.xml`, `index.html`, `styles/addin.css` | 3 | — | **3 von 3** |

**44 von 44 Quelldateien.** Über die Endung `.tsx` wären es 7 von 32 im Aufgabenbereich und 0 von
12 in den beiden anderen Bereichen gewesen.

Gefunden: **93 Satzliterale** (70 im Add-in, 13 in den Add-in-Routen, 10 im Export) und **81
textführende Eigenschaften** in 9 Dateien.

**Der Gegenbeweis zum Zeichenfilter, an dieser Fläche nachgerechnet:** `create-gate.ts` ist nicht
der einzige Fall. **Neun `.ts`-Dateien tragen Oberflächentext, gegen sieben `.tsx`.** Auf dieser
Fläche ist die Endung nicht nur kein Filter — sie zeigt in die falsche Richtung.

### 1.2 Die drei Listen

**Sperrliste: 26 Einträge (SP-A-01 bis SP-A-26)**, jeder mit Buchstabe und Prüfpunkt. Die
Warnliste aus `textbestand.md` 11.4 hat sich in allen fünf Zeilen bestätigt und ist um 21 weitere
gewachsen. Namentlich:

- **SP-A-02** der Fristsatz (`TaskPane.tsx:547`) — **V-04 aus T-165, unverändert freigegeben**.
  Die kürzere Fassung liegt vor und ist **nicht** freigegeben. Nicht angefaßt.
- **SP-A-22** die fünf Sperrgründe aus `create-gate.ts` — **V-11 aus T-154**. Nicht angefaßt.
- **SP-A-20** die zehn Ablehnungsgründe aus `callnumber/labels.ts` — T-041, T-046, **R-15**.
- **SP-A-24** das Duplikatangebot und `REOPEN_HINT` — **A-10.9, R-15**, die Folge einer Wahl,
  die sich in der Abrechnung auswirkt.
- **SP-A-04** die Standard-Tags bei Anlage aus dem Add-in — A-9.5, Pflichtflow.
- **SP-A-01** „(bleibt in Takt)" gegen „(geht in die Abrechnung)" — R-08, E-016, B-12.3. Auf
  einer Fläche, die Text aus einer fremden E-Mail einsammelt, die wichtigste Beschriftung des
  ganzen Bereichs.

**Streichliste: 8 Einträge (ST-A-01 bis ST-A-08)**, jeder mit ausformuliertem neuem Wortlaut,
keiner mit „kürzen". Zwei davon (ST-A-01) sind an eine Zeile in `tests/e2e/` gebunden, einer
(ST-A-02) an eine Zustimmung von spec-ux-reviewer wegen T-038.

**Umbauliste: 4 Einträge (UM-A-01 bis UM-A-04)**, jeder mit Träger. **T1** dreimal, **T2**
einmal. **T3 Handbuch kommt kein einziges Mal vor** — es gibt im Aufgabenbereich keinen Text, der
reiner Hintergrund wäre (AB-2). Kein vierter Träger vorgeschlagen (E-078 Nachtrag Punkt 6).

UM-A-03 ist die Umkehrung eines Streichbefunds: „Inhalt der E-Mail übernehmen" **überschreibt**
einen bereits getippten Vermerk kommentarlos. Das ist eine **Folge**, die heute nirgends steht —
hier fehlt ein Satz, statt daß einer zu viel wäre.

---

## 2. Was gebaut ist (Teil 2) — nur D, fünf Handgriffe

Kein Eintrag hat einen Prüfpunkt, keiner ist an seinem Wortlaut gemessen, keiner verliert eine
Auskunft.

### 2.1 `describeDetection` sagt jeden Fall einmal statt zweimal (`TaskPane.tsx`)

Der Befund mit der größten Reichweite. Der Bereich „Call-Nummer" trug seine Auskunft **zweimal
übereinander** — als Zeile unter der Überschrift (`Section.description`) und als Fläche darunter
(`Callout`) — und zwar in **vier von sechs** Erkennungsfällen:

| Fall | Zeile | Fläche |
|---|---|---|
| `implausible` | `REJECTION_LABEL[reason]` | … + **`REJECTION_LABEL[reason]`** — zeichengleich |
| `pattern_invalid` | „Der Ausdruck in den Einstellungen ist nicht verwendbar." | „Der Ausdruck lässt sich nicht verwenden" |
| `timeout` | „Die Erkennung wurde abgebrochen." | „Erkennung abgebrochen" |
| `unavailable` | „Automatische Erkennung steht hier nicht zur Verfügung." | „Keine automatische Erkennung" |

Gefallen ist die **Kopie**, nicht das Original: Die Fläche ist die reichere Auskunft — Rohwert,
Meldung der Laufzeitumgebung, Ausweg. Bei `pattern_invalid` stand der **Ort** („in den
Einstellungen") nur in der Zeile; er ist in die Überschrift gewandert und nicht mitgestrichen.
`match` und `no_match` haben keine Fläche und behalten ihre Zeile.

Nebenbefund: Der Zweig `default` gab `''` zurück — für `Section` ein Text, dem sie einen leeren
Absatz mit dem Abstand einer Zeile baute. `DetectionLine.help` ist jetzt `string | undefined`,
`Section.description` entsprechend (`exactOptionalPropertyTypes`). Dieselbe Unterscheidung, die
`fieldParts` seit T-158 trifft.

### 2.2 Der Ausweg „von Hand eintragen" steht einmal statt zweimal

Er stand in zwei einander ausschließenden Zweigen, einmal mit „hier" und einmal ohne — genau der
Befund, den T-169 eine Funktion weiter oben behoben hat. Neu:
`callnumber/labels.ts` → `CALL_NUMBER_BY_HAND`, gelesen von beiden Zweigen. Derselbe Ort und
dieselbe Bauart wie `NO_CALL_NUMBER_FOUND`.

### 2.3 „Es wird genau einmal angezeigt." — zweimal auf **einem** Bildschirm

`SettingsView.tsx:219` gegen `:412`, beide gleichzeitig sichtbar. Die Kopie am Feld fällt; der
Schritt bleibt, wo die Handlung geschieht. Zugleich anredefrei (E-080 Punkt 4):

```
vorher  Das Token erzeugen Sie in Takt unter Einstellungen. Es wird dort genau einmal angezeigt.
nachher Das Token entsteht in Takt unter Einstellungen.
```

### 2.4 Der Verbindungszustand steht zweimal statt dreimal

`TaskPane.tsx:319`. Über dem Satz standen „Noch nicht verbunden" (Bereich) und „Das Token
fehlt." (Fläche); dann sagte der Rumpf „Takt und das Add-in kennen sich noch nicht." und **erst
danach**, was zu tun ist. Der dritte Zustandssatz fällt, der Ausweg rückt nach vorn.

### 2.5 E-080: die siebte Stelle

`callnumber/pattern.ts:89` — „**Trage** ein Muster ein oder **wähle** eines aus der Liste."

```
nachher  Der Ausdruck ist leer. Ein Muster steht in der Liste darüber, oder es lässt sich hier
         eintragen.
```

Ohne Anrede (E-080 Punkt 4). Der Satz bleibt **B** und fällt nicht.

### Was ausdrücklich unberührt ist

Die aria-Verdrahtung aus T-158: kein `Field` entstanden oder verschwunden, der Wächter zählt
weiterhin **zwölf**, Hinweis und Fehler bleiben gleichzeitig erreichbar. Der Fristsatz steht
unverändert. Die fünf Sperrgründe stehen unverändert. Über das Add-in entstehen weiterhin keine
Anhänge. Kein Exportschlüssel hat sich bewegt.

---

## 3. Der Befund am Wächter (E-080)

Der Wächter `E-080: der Aufgabenbereich duzt niemanden mehr` in `scripts/proof-addin.mjs` ist
grün **und unvollständig**. Sein Ausdruck lautet

```
(?<![\wäöüß])(?:du|dir|dich|dein(?:e|em|en|er|es)?)(?![\wäöüß])
```

— er prüft auf **Fürwörter**. Ein deutscher Imperativ im Singular kommt ohne Fürwort aus. Genau
zwei standen noch da; einer ist behoben (2.5), der andere ist `ui/App.tsx:191` („**Öffne** eine
E-Mail, um daraus ein Todo anzulegen.").

Das ist derselbe Fehlerbau wie der Zeichenfilter aus `textbestand.md` 1.1: ein Wächter, der die
naheliegende Form prüft und die ruhigere übersieht.

**Warum die Erweiterung hier nicht gebaut ist:** `ui/App.tsx:191` steht in
`tests/e2e/outlook-addin-build.spec.ts:65` wörtlich als Suchtext (`getByText`) — Hoheit
e2e-tester. Ändere ich den Satz, bricht dort eine Zusicherung, die ich nicht reparieren darf;
erweitere ich den Wächter ohne die Änderung, wird `proof:addin` rot. Beides gehört in **eine**
Welle. Ich habe nicht geraten und nicht gebrochen — siehe offene Frage 1.

---

## 4. Nachweis

| Lauf | Ergebnis |
|---|---|
| `pnpm typecheck` | **0 Fehler** (8 Projekte, dazu `tsconfig.test.json` aller Pakete und `tests/e2e`) |
| `pnpm run proof:addin` | **221 bestanden, 0 fehlgeschlagen** — unverändert gegen den Stand vor T-182 |
| `pnpm run proof:taskpane` | **25 bestanden, 0 fehlgeschlagen** |
| `pnpm run proof:codepoints` | **45 bestanden, 0 fehlgeschlagen** |
| `pnpm test` | 1435 bestanden, **2 fehlgeschlagen** — beide in `apps/web/test/app/undoDone.test.ts`, aus dem **parallel laufenden** Textdurchgang von frontend-dev (`apps/web/src/app/undoDone.ts` ist in dieser Sitzung geändert). Keine meiner Dateien ist beteiligt. |

`proof:all`, `proof:addin-wiring` und `test:e2e` sind auftragsgemäß nicht gefahren (fester Port
17843, E-083 Punkt 3).

Der Wächter aus `proof:addin` 19h hält weiterhin: „Keine Call-Nummer im Text gefunden" steht an
genau einer Stelle, und `help: NO_CALL_NUMBER_FOUND` steht weiterhin im Aufgabenbereich — die
Umstellung in 2.1 hat den einen Fall, den dieser Wächter mißt, ausdrücklich stehen lassen.

---

## 5. Annahmen, die ich ohne Rückfrage getroffen habe

1. **„Die Kopie fällt" heißt bei einer Überschrift-Fläche-Doppelung: die Zeile fällt, die Fläche
   bleibt.** Die Fläche trägt in allen vier Fällen mehr — Rohwert, fremde Meldung, Ausweg. Die
   Zeile war ihre Zusammenfassung.
2. **Ein Ort, der nur in der Kopie stand, wandert mit und wird nicht mitgestrichen** („in den
   Einstellungen" bei `pattern_invalid`). Sonst wäre die Streichung einer Doppelung der Verlust
   eines **B**-Bestandteils.
3. **Eine `Section` ohne Zeile ist zulässig**, eine mit leerer Zeile nicht. Deshalb `undefined`
   statt `''`.
4. **`Section.description` darf `string | undefined` heißen.** Unter
   `exactOptionalPropertyTypes` ist das die einzige Schreibweise für „je nach Zustand vorhanden";
   `error` in `FieldProps` steht seit T-158 genauso da.
5. **Die Anrede zu entfernen ist keine Kürzung, sondern E-080 Punkt 4.** Beide Änderungen an
   Anreden (2.3, 2.5) sind zugleich kürzer geworden; keine hat eine Aussage verloren.
6. **`manifest.xml:45` gegen `:133` ist kein D.** Zwei verschiedene Outlook-Flächen, vom
   Manifestschema beide verlangt, nie zugleich sichtbar. Aufgenommen und ausdrücklich als
   „kein Befund" vermerkt, damit der nächste Durchgang nicht darüber stolpert.

---

## 6. Risiken

- **R-a (mittel, gemeldet):** `ui/App.tsx:191` duzt weiter. E-080 Punkt 1 sagt „Takt siezt,
  überall", und diese Stelle tut es nicht. Sie ist sichtbar, sobald jemand den Aufgabenbereich
  ohne geöffnete E-Mail öffnet. Behebbar in einer Zeile, sobald e2e-tester mitzieht.
- **R-b (mittel, gemeldet):** Drei Sätze stehen **zeichengleich** in zwei Häusern —
  `callnumber/labels.ts` (`INPUT_REJECTION_LABEL`) und `apps/local-api/src/routes/addin/index.ts`
  (`CALL_NUMBER_INPUT_TEXT`). Zwei weitere derselben Tafel sind **bereits auseinandergelaufen**
  (`empty` sagt hier „Sie darf leer bleiben.", dort „Lassen Sie das Feld frei, wenn es keine
  gibt."; `too_long` trägt hier einen Nachsatz über die Duplikatsuche, dort nicht). Das ist
  wörtlich der Befund, aus dem E-058 und T-169 entstanden sind, nur über eine Pakethoheit hinweg.
  Beide Tafeln sind **B** und fallen nicht — die **Doppelung** fällt. Auflösbar nur in
  `@takt/domain`, wo `DUE_DATE_MESSAGE` denselben Weg schon geht. Fremde Hoheit; offene Frage 2.
- **R-c (klein):** `api/client.ts` `MESSAGES.invalid_input` ist zeichengleich mit
  `routes/addin/index.ts` `MESSAGES.validation_error`. Nur ein Ersatztext für den Fall, daß der
  Dienst keine Meldung schickt — derselbe Drift, kleinere Wirkung. Teil von offener Frage 2.
- **R-d (klein, kein Befund):** `INPUT_REJECTION_LABEL.empty` ist im Aufgabenbereich
  **unerreichbar** — `callNumberProblem` gibt bei leerem Feld `null` zurück, bevor
  `decideLookup` gefragt wird. Ein **V** (auf Vorrat), aber die Tafel muß über
  `Record<CallNumberRejection, string>` vollständig sein, sonst bricht die Übersetzung nicht mehr
  bei einem neuen Grund. Vollständigkeit schlägt Kürze; kein Handlungsbedarf.
- **Sicherheit:** keine Änderung an einer Vertrauensgrenze. Keine echte Call-Nummer, kein
  Kundenname, kein Zugangsdatum ist hinzugekommen; `callnumber/catalog.ts` bleibt erfunden, und
  `SettingsView.tsx:309` sagt weiterhin, daß es erfunden ist. `Foreign`, `visibleText` und die
  vier Isolierungsstellen sind unberührt. AB-3 gilt unverändert: kein Satz nennt einen
  abgelehnten Wert aus einer fremden E-Mail.

---

## 7. Offene Fragen an den Orchestrator

1. **`ui/App.tsx:191` und der Wächter gehören in eine Welle mit e2e-tester.**
   Nötig ist genau eine Zeile in `tests/e2e/outlook-addin-build.spec.ts:65`:

   ```
   alt   page.getByText('Öffne eine E-Mail, um daraus ein Todo anzulegen.', { exact: false })
   neu   page.getByText('Der Aufgabenbereich übernimmt Betreff, Absender und den Text der
                         geöffneten E-Mail.', { exact: false })
   ```

   Zeile 64 (`'Dieser Bereich läuft außerhalb von Outlook.'`) hängt an ST-A-01 und wäre im selben
   Zug zu ersetzen. Danach kann ich `ANREDE_DU_QUELLE` um die Imperativform erweitern; ohne diese
   Reihenfolge wird entweder ein fremder Prüffall rot oder mein eigener.

2. **Wohin gehören die Sätze über eine eingetragene Call-Nummer?** Sie stehen zeichengleich in
   `apps/outlook-addin/src/callnumber/labels.ts` und `apps/local-api/src/routes/addin/index.ts`,
   und zwei von fünf sind schon auseinandergelaufen (R-b). Der Ort, an dem beide lesen können,
   ist `packages/domain` — Hoheit domain-dev. Ich habe es nicht halb getan; eine halb umgestellte
   Tafel sieht aus wie erledigt. Soll ich einen Vorschlag als Auftrag an domain-dev formulieren?

3. **Der Fristhinweis braucht eine Fassung für zwei Flächen** (E-078 Nachtrag Punkt 7, SP-04
   drüben gegen SP-A-02 hier). Wer zuerst kürzt, erzeugt die Abweichung, die der Punkt verhindern
   soll. E-078 nennt als Zeitpunkt die Wiedervorlage V-03/V-04 in T-165 — ein Auftrag, zwei
   Dateien, eine Fassung.

4. **Für diese Fläche fehlt das Wort von ui-designer.** E-078 Punkt 4 verlangt es vor der
   Umsetzung; für `apps/web` liegt es als `textabbau-gestalt.md` vor, für den Aufgabenbereich
   nicht. Die Abschnitte 6 und 7 meines Papiers sind deshalb Vorlagen und keine Aufträge.

---

Nächster Schritt:

`docs/design/textbestand-aufgabenbereich.md` Abschnitt 6 und 7 an spec-ux-reviewer. Vier
Streichungen (ST-A-03, ST-A-05, ST-A-06, ST-A-08) hängen an nichts als seinem Wort und wären in
einer Welle erledigt. ST-A-01 und der Wächter aus Abschnitt 3 gehören mit e2e-tester in dieselbe
Welle; ST-A-02 braucht wegen T-038 seine ausdrückliche Zustimmung.
