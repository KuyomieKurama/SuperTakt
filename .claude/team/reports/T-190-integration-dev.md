# T-190 — integration-dev

**Aufgabe:** T-190 — Der rote Nachweis aus T-188 (Einspeisung des `fetch`-Ports im Add-in), die
zwei Aufrufstellen der Eingabetafel (O-GC) und der halbe E-080-Wächter (O-GD)

**Status:** fertig

---

## Artefakte

| Datei | Was daran geändert wurde |
|---|---|
| `apps/outlook-addin/src/api/client.ts` | `createBrowserApiClient` neu; `ApiClientOptions.fetch` bleibt Pflicht und sagt jetzt, warum |
| `apps/outlook-addin/src/ui/App.tsx` | nennt `fetch` nicht mehr — weder als Wert noch als Feldnamen; `ApiClient` statt `ReturnType<typeof createApiClient>` |
| `apps/outlook-addin/src/callnumber/labels.ts` | `INPUT_REJECTION_LABEL` gestrichen, Grabstein mit Begründung |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | liest `CALL_NUMBER_INPUT_MESSAGE` aus `@takt/domain` |
| `apps/outlook-addin/src/ui/create-gate.ts` | Verweis im Kommentar nachgezogen |
| `apps/outlook-addin/src/callnumber/pattern.ts` | Grabstein aus T-182 berichtigt: der Wächter sieht den Imperativ jetzt |
| `apps/outlook-addin/scripts/proof-addin.mjs` | `ANREDE_IMPERATIV` + drei Prüffälle (O-GD) |
| `apps/local-api/src/routes/addin/index.ts` | `CALL_NUMBER_INPUT_TEXT` gestrichen, liest `CALL_NUMBER_INPUT_MESSAGE` |

`packages/export/**` blieb unberührt — T-190 hat dort nichts zu tun.

---

## Zusammenfassung

Die Einspeisung `fetch: window.fetch.bind(window)` ist aus `ui/App.tsx` nach
`api/client.ts` gewandert, wo sie als `createBrowserApiClient` in **einer** Zeile ohne jede
Entscheidung steht; damit stimmt die Zusage von `proof:callers` — „`fetch` steht im Add-in nur in
`api/client.ts`" — wörtlich, ohne daß eine Ausnahmeliste dieselbe Zusage in zwei Fassungen führt.
Die fünf Sätze der Eingabetafel kommen an beiden Türen aus `CALL_NUMBER_INPUT_MESSAGE`
(`packages/domain`), die lokalen Tafeln `INPUT_REJECTION_LABEL` und `CALL_NUMBER_INPUT_TEXT` sind
gestrichen; bei den zwei auseinandergelaufenen Sätzen gilt wie beauftragt die Fassung des Add-ins,
sichtbar ändert sich dadurch **ein** Satz an der Tür (`too_long` bekommt den Nachsatz, `empty` ist
dort unerreichbar). Der E-080-Wächter kennt jetzt auch den Imperativ ohne Fürwort und findet den
Satz wieder, den T-182 von Hand gefunden hatte; die eine heute noch geduldete Stelle steht als
**Satz** in der Ausnahme, nicht als Datei, und ein eigener Prüffall verlangt, daß es sie noch gibt.
Alle Nachweise sind grün, `proof:callers` steht bei 45/0.

---

## Wie die Prüfbarkeit erhalten bleibt (die Frage aus dem Auftrag)

Der Grund für die Einspeisung war, daß sich jeder Baustein ohne Browser und ohne laufenden Dienst
prüfen läßt. Der Grund trägt weiter, und zwar an drei Punkten:

1. **Der Port bleibt Pflicht.** `ApiClientOptions.fetch` ist weiterhin `readonly fetch:
   typeof globalThis.fetch` — **kein `?`, kein Ersatzwert**. Hätte ich statt einer zweiten Funktion
   ein optionales Feld mit Rückfall auf das globale `fetch` gebaut, liefe ein Prüffall, der die
   Einspeisung vergißt, still gegen das Netz der Umgebung, statt an `tsc` zu scheitern. Genau das
   steht jetzt als Begründung am Feld.
2. **Kein Prüffall ändert sich.** Alle 11 Aufrufe von `createApiClient` in
   `scripts/proof-addin.mjs` reichen ihre eigene Abholfunktion herein und messen an ihr Kopfzeilen,
   Adresse und Rumpf. `proof:addin` ist ohne eine einzige Anpassung von 221 auf 224 gestiegen (die
   drei neuen sind die O-GD-Prüffälle).
3. **Die neue Hülle enthält nichts zu prüfen.** `createBrowserApiClient` hat keinen Zweig, keine
   Umformung, keinen zweiten Aufruf: `createApiClient({ ...options, fetch: globalThis.fetch.bind(globalThis) })`.
   Was daran prüfbar wäre, ist an `createApiClient` bereits geprüft. Der Zugewinn ist, daß die
   Umgebung nur noch an **einer** Stelle hereinkommt und der Wächter dafür keine Datei aus dem
   Blick verliert.

Gegenprobe, daß der Wächter nicht bloß leiser geworden ist: Er mißt weiter alle 31 Dateien des
Add-ins mit dem geschärften Ausdruck aus `fetch-scan.mjs`, und seine sechs Gegenproben (nacktes
`fetch(`, `globalThis.`, `window.`, `self.`, Zerlegung, Prosa) laufen unverändert.

---

## E-087 — eigene Messung vor der Wortlautänderung (2026-09-06)

Gesucht wurde der **heutige** Wortlaut aller fünf Sätze in `tests/**`, `apps/*/test/**` und
zusätzlich in allen Nachweisläufen (`**/*.mjs`), weil ein Nachweis einen Satz genauso festnageln
kann wie ein Prüffall.

| Suchbegriff | Treffer in Prüffällen/Nachweisen |
|---|---|
| `Die Call-Nummer ist leer` | **0** |
| `Lassen Sie das Feld frei` | **0** |
| `Länger findet die Duplikatsuche sie nicht wieder` | **0** |
| `Eine Call-Nummer braucht mindestens` | **0** |
| `Eine Call-Nummer darf höchstens … Zeichen haben` | **0** |
| `Erlaubt sind Buchstaben, Ziffern` | **0** |
| `darf nicht mit =, +, - oder @ beginnen` | **0** |
| `INPUT_REJECTION_LABEL` / `CALL_NUMBER_INPUT_TEXT` | **0** (nur Produktivcode und Kommentare) |

Damit deckt sich meine Messung mit der von domain-dev vom Vortag: **kein** Prüffall nagelt einen
der fünf Sätze fest. Zusätzlich geprüft: `docs/**` und `apps/local-api/openapi/**` nennen keinen
der Sätze — die OpenAPI-Beschreibung führt keine Beispielmeldung dazu.

**Sichtbar geändert hat sich genau ein Satz**, und zwar an der Tür des Dienstes:
`too_long` heißt dort jetzt „Eine Call-Nummer darf höchstens 64 Zeichen haben. Länger findet die
Duplikatsuche sie nicht wieder." `empty` ist an der Tür unerreichbar (dort wird nur geprüft, was
`normalizeCallNumber` nicht schon zu `null` gemacht hat), die Umstellung dort ist also eine
Vollständigkeitszusage und keine Textänderung. Im Aufgabenbereich hat sich **kein** Satz geändert.

---

## O-GD — der Wächter kennt jetzt die ganze Form

`ANREDE_DU` prüfte auf `du`, `dir`, `dich`, `dein`. Ein deutscher Imperativ kommt ohne all das aus,
und T-182 hatte genau das schon notiert, ohne es beheben zu können. Neu in `proof-addin.mjs`:

- `ANREDE_IMPERATIV` — 34 Verbstämme (mit wahlweisem `-e`) und 13 ausgeschriebene Formen, ohne
  Rücksicht auf Groß- und Kleinschreibung, damit auch der zweite Halbsatz getroffen wird („Öffne
  Takt **und trage** das Token ein").
- Bewußt **nicht** in der Liste, weil sie zugleich Hauptwörter sind und im Add-in als solche
  vorkommen: `Suche` („Kein Tag passt zu dieser Suche"), `Stelle`, `Start`, `Send`, `Versuche`,
  `Wende`, `Acht`, `Tipp`, `Ruf`, `Buch`, `Wart`. Wo die lange Form eindeutig ist, steht sie
  ausgeschrieben (`Starte`, `Sende`, `Buche`, `Warte`, `Tippe`, `Rufe`).
- Drei Prüffälle: der Durchgang über alle sichtbaren Texte; eine **Gegenprobe in beide
  Richtungen** (sechs Sätze, die der Wächter finden muß — darunter der Satz, den T-182 gestrichen
  hat —, und acht, die er nicht melden darf); und die Selbstauflösung der Ausnahme.

Die Liste ist am Baum gemessen, nicht behauptet: Über alle sichtbaren Texte des Add-ins
(Quelltext ohne Kommentare, dazu `manifest.xml`) ergibt sie **genau einen** Treffer, und das ist
O-GE.

**Die eine geduldete Stelle** (`ui/App.tsx`: „Öffne eine E-Mail, um daraus ein Todo anzulegen.")
steht als **Satz** in der Ausnahme und nicht als Datei — eine Dateiausnahme machte jeden künftigen
Imperativ in `App.tsx` unsichtbar und wäre derselbe Fehlerbau, den diese Welle gerade aufräumt.
Der Prüffall `O-GE: die geduldete Stelle steht noch da` verlangt, daß der Satz noch genau einmal im
Bestand steht und daß der Wächter ihn erkennt. Stellt e2e-tester den Prüffall
`tests/e2e/outlook-addin-build.spec.ts:65` frei und wird der Satz umgeschrieben, wird die Ausnahme
**rot** und gehört gelöscht, nicht angepaßt.

---

## Nachweise — vorher und nachher

| Lauf | vorher | nachher |
|---|---|---|
| `pnpm typecheck` | 0 | **0** |
| `pnpm test` | 1442 grün, 0 rot (73 Dateien) | **1442 grün, 0 rot** (73 Dateien) |
| `pnpm run proof:callers` | **44 / 1** | **45 / 0** |
| `pnpm run proof:addin` | 221 / 0 | **224 / 0** (+3 O-GD) |
| `pnpm run proof:taskpane` | 25 / 0 | **25 / 0** |
| `pnpm run proof:codepoints` | 45 / 0 | **45 / 0** |
| `pnpm run boundaries` | grün | **grün** (375 Dateien auf Tiefenzugriffe geprüft) |

Der rote Punkt von vorher lautete wörtlich:

```
FEHL  `fetch` steht im Add-in nur in api/client.ts (31 Dateien durchgesehen) — ui/App.tsx:58 — fetch: window.fetch.bind(window),
```

**Nicht gefahren** (E-083 Punkt 3, fester Port 17843): `proof:all`, `proof:addin-wiring`,
`test:e2e`. Beide gelesen statt gefahren: `proof-addin-wiring.mjs` nennt weder `createApiClient`
noch `window.fetch`; `tests/e2e/outlook-addin-build.spec.ts` prüft das **gebaute Bündel** über
sichtbaren Text und kennt den Zugang nicht. Das Laufzeitverhalten ist unverändert (dieselbe
gebundene Abholfunktion, nur eine Datei weiter).

---

## Annahmen

1. **Zweite Funktion statt optionalem Feld.** Ein `fetch?:` mit Rückfall auf das globale `fetch`
   wäre die kürzere Änderung gewesen und hätte `App.tsx` genauso vom Wort `fetch` befreit. Ich habe
   sie verworfen: Sie nimmt dem Port die Pflicht und macht aus einem vergessenen Prüfstück einen
   echten Netzzugriff. Der Preis ist ein zweiter Name im Modul.
2. **`globalThis.fetch.bind(globalThis)` statt `window.fetch.bind(window)`.** Gleichbedeutend im
   Browser, aber ohne Annahme über ein Fenster. Gebunden wird weiterhin, weil das globale `fetch`
   seinen Empfänger braucht.
3. **Namen gestrichen statt umgehängt.** `INPUT_REJECTION_LABEL` und `CALL_NUMBER_INPUT_TEXT`
   existieren nicht mehr als Aliasse auf die Domänenfassung. Ein Alias hätte die Umstellung
   billiger gemacht, aber zwei Namen für dieselbe Tafel stehen gelassen — und der nächste Leser
   hätte wieder zwei Orte gefunden, an denen etwas zu pflegen aussieht.
4. **Die Imperativliste ist nicht vollständig und behauptet es nicht.** Sie ist die Menge, die am
   Baum gemessen wurde, und im Kommentar steht ausdrücklich: Fehlt ein Verb, gehört es in die
   Liste und nicht in eine Ausnahme.
5. **`REJECTION_TEXT` an der Tür bleibt eine zweite Liste.** Sie spricht über einen **erkannten**
   Wert, nicht über einen eingetragenen. Das sind zwei Aussagen, nicht zwei Fassungen einer
   Aussage — dieselbe Trennung wie zwischen `REJECTION_LABEL` und der Eingabetafel im Add-in.

---

## Risiken

- **R-1 (klein, Text).** Die Imperativliste kann einen Fehltreffer erzeugen, sobald jemand ein
  deutsches Hauptwort in die Oberfläche schreibt, das zufällig wie ein Verbstamm aussieht. Elf
  bekannte Fälle sind vorab ausgeschlossen und im Kommentar benannt; der richtige Umgang mit einem
  zwölften ist, ihn dort einzutragen — **nicht**, den Wächter zu lockern. Die Gegenprobe mit acht
  Hauptwortsätzen macht eine Lockerung teuer.
- **R-2 (klein, Sicherheit).** `createBrowserApiClient` ist die einzige Stelle im Add-in, an der
  die Umgebung hereinkommt. Sie liegt jetzt in derselben Datei wie das Token und die Adresse —
  also näher an beidem. Das ändert nichts am Datenfluß (das Token steht weiterhin nur in der
  Kopfzeile, nie in der Adresse), macht aber `api/client.ts` zur einzigen Datei, die man für die
  Frage „wie kommt das Add-in nach draußen" lesen muß. Ich halte das für eine Verbesserung, nenne
  es aber, weil security-checker es bewerten soll.
- **R-3 (klein, Text).** Ein Satz an der Tür des Dienstes ist länger geworden. Er erscheint nur in
  `details[].message` einer 422-Antwort auf `POST /addin/todos` und dort im Aufgabenbereich am
  Feld — dieselbe Fläche, auf der der Aufgabenbereich ihn ohnehin schon so anzeigt. Ein anderer
  lokaler Aufrufer mit Token (RR-1) sieht ihn ebenfalls; er enthält weder den abgelehnten Wert
  noch einen Pfad.
- **Unverändert offen: R-15.** Die Umstellung ändert an der Regel nichts, nur an ihrer
  Beschriftung. `checkCallNumber` und `mayLookUpDuplicates` sind nicht angefaßt.

---

## Offene Fragen

1. **O-GE gehört in dieselbe Welle wie diese Ausnahme.** e2e-tester muß
   `tests/e2e/outlook-addin-build.spec.ts:65` vom wörtlichen Satz lösen (der Prüffall braucht ihn
   nicht wörtlich — er prüft „einer von zwei Zuständen ist sichtbar"), danach kann `App.tsx` auf
   „Für ein Todo aus einer E-Mail muß eine E-Mail geöffnet sein." oder ähnlich umgestellt und
   `IMPERATIV_AUSNAHME` in `proof-addin.mjs` **gelöscht** werden. Solange beides aussteht, führt
   der Nachweis eine geduldete Zeichenkette, und das ist ein Zustand mit Verfallsdatum.
2. **Gilt O-GD auch für `apps/web`?** Der Imperativ-Wächter steht in `proof-addin.mjs` und mißt
   nur das Add-in. `apps/web` siezt nach T-165/T-169 an über zwanzig Stellen, aber gegen den
   Imperativ ohne Fürwort ist es dort **nicht** gemessen. Das ist eine Datei von frontend-dev
   (`apps/web/scripts/proof-foreign.mjs` oder ein eigener Lauf) und nicht meine — ich melde es,
   weil dieselbe halbe Form dort dieselbe halbe Zusage ergibt.
3. **Soll `packages/domain` den Textbestand weiter einsammeln?** Nach `poolMovementSentence`,
   `DUE_DATE_MESSAGE` und jetzt `CALL_NUMBER_INPUT_MESSAGE` liegen drei Textmengen in der Domäne,
   und E-045 („Regel und Text sind getrennt") liest sich dagegen zunehmend erklärungsbedürftig.
   Mein Vorschlag zur Fassung der Regel: *Ein Anzeigetext gehört in die Domäne, sobald ihn **zwei
   Flächen in verschiedenen Paketen** aussprechen müssen; sonst bleibt er bei seiner Fläche.* Das
   ist eine Entscheidung des Orchestrators, kein Beschluß von mir.

---

## Nächster Schritt

O-GE in der nächsten Welle als **eine** Aufgabe an e2e-tester und integration-dev zusammen: erst
den Prüffall vom Wortlaut lösen, dann den Satz umstellen, dann `IMPERATIV_AUSNAHME` löschen — der
Nachweis wird dabei von selbst rot, wenn ein Schritt fehlt. Danach O-GD auf `apps/web` übertragen
(frontend-dev), damit dieselbe Zusage nicht wieder in zwei Schärfegraden geführt wird.
