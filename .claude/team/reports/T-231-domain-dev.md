# T-231 — A-A-61 bis A-A-65: vier Läufe, die sagen, wann sie blind sind

Aufgabe: T-231 (Welle AJ) — die fünf Auflagen aus Bedrohungsmodell 30.9 bauen, A-A-62 zuerst
Status: **fertig**
Rolle: domain-dev
Datum: 2026-09-06

---

## Artefakte

| Datei | Was |
|---|---|
| `apps/local-api/scripts/request-scan.mjs` | **neu** — die Regel „hier geht ein Aufruf an den Dienst" für `request`, Bauart von `fetch-scan.mjs` (A-A-62) |
| `apps/local-api/scripts/proof-callers.mjs` | `proveHarvest` in Abschnitt 1 und 7, `BUNDLED_EXTENSIONS`, neue `request`-Zusage samt sechs Gegenproben und Blindheitsmessung (A-A-61, A-A-62) |
| `apps/local-api/scripts/proof-tags.mjs` | Abschnitt 1 vergleicht die gemessene Zeilenzahl mit der erwarteten (A-A-63) |
| `apps/local-api/scripts/proof-conflicts.mjs` | `provoke` prüft, daß die **benannte** Verletzung eingetreten ist; Zuordner samt eigener Vorbedingung und vier Proben (A-A-64) |
| `apps/local-api/scripts/proof-db-permissions.mjs` | neuer Abschnitt 0 mißt die eigene `umask`; Kopf berichtigt (A-A-65) |

Nichts außerhalb meiner Hoheit. `packages/domain`, `packages/storage`, `src/routes/addin/` und
alle Testordner unberührt; kein Produktivcode geändert.

---

## Zusammenfassung

Ich habe die sechs Befunde aus T-230 zuerst **nachgestellt** — in einem Spiegel unter `/tmp/t231`
mit Kopien von `apps/local-api`, `apps/web`, `apps/outlook-addin` und `packages`, `node_modules`
als Verweis — und jede der gemessenen Zahlen von security-checker bestätigt, bevor ich eine Zeile
gebaut habe. Danach A-A-62 zuerst: Die Zusage „`request(` steht nur in `api/endpoints.ts`" wird
nicht mehr mit dem Ausdruck gemessen, den derselbe Lauf zwanzig Zeilen darüber als blind ausweist,
sondern mit einer Regel in `request-scan.mjs`, die die bekannten Nicht-Aufrufe namentlich entfernt
und danach jedes verbliebene `request` als **Wort** meldet — damit fällt `client.request(` ebenso
wie `client['request'](`, `globalThis.request(` und jede Zerlegung. Dann A-A-61: Die Ernte des
Sammlers wird **vor** der Zusage gemessen, mit einer Untergrenze **und** der benannten Datei,
und die Endungsliste deckt die acht ab, die der Bündler auflöst. A-A-63, A-A-64 und A-A-65 sind
je die eine fehlende Vorbedingung an der Stelle, an der der Lauf sonst über der leeren oder der
falschen Menge grün war. Alle vier Läufe sind auf dem unveränderten Baum grün, jede Gegenprobe rot
mit Code 1, der Spiegel ist gelöscht.

---

## Zahlen: vorher, nachher, und mit der eingesetzten Verletzung

Der Port war frei, deshalb sind alle vier Läufe **vollständig** gefahren, nicht als Schnitt.
Zum Vergleich mit 30.0 stehen die Teilschnitte von security-checker daneben.

| Lauf | vorher (voll) | nachher (voll) | Teilschnitt T-230 | Teilschnitt jetzt |
|---|---|---|---|---|
| `proof:callers` | 45/0, Code 0 | **56/0, Code 0** | 45/0 (voll) | **56/0** |
| `proof:tags` | 42/0, Code 0 | **43/0, Code 0** | §1–3: 16/0 | **17/0** |
| `proof:conflicts` | 149/0, Code 0 | **154/0, Code 0** | §1: 61/0 | **66/0** |
| `proof:db-permissions` | 17/0, Code 0 | **18/0, Code 0** | §1–3: 11/0 | **12/0** |

Zuwachs: `callers` +11 (4 Erntezeilen, 5 `request`-Proben, 1 Umkehrprobe, 1 Blindheitsmessung),
`tags` +1, `conflicts` +5 (1 Eindeutigkeit, 4 Zuordnerproben), `db-permissions` +1.

Unberührt und nachgefahren, weil sie dieselbe Werkstatt benutzen: `proof:codepoints` **45/0**,
`proof:release-safety` **31/0**. `proof:all` **nicht** gefahren (Auftrag).

### Die Nachstellung — alle sechs Befunde bestätigt

| Befund | Verstümmelung / Kunstquelle | gemessen (voller Lauf) | T-230 sagte |
|---|---|---|---|
| T-230-1 | Web-Sammler `/\.KEINETREFFER$/` | **45/0, Code 0**, „(0 Dateien durchgesehen)" | 45/0 ✔ |
| T-230-1 | Add-in-Sammler ebenso | **45/0, Code 0**, „(0 Dateien durchgesehen)" | 45/0 ✔ |
| T-230-2 | `import * as client; client.request(…)` | **45/0, Code 0** | 45/0 ✔ |
| T-230-2 | benannte Einfuhr (Gegenprobe) | **44/1, Code 1**, nennt `app/Zweitweg.tsx` | 44/1 ✔ |
| T-230-3 | dieselbe Quelle als `.js` | **45/0, Code 0**, Zahl bleibt 117 | 45/0 ✔ |
| T-230-4 A | `SELECT … WHERE 0 …` | **42/0, Code 0**, beide Zeilen grün | §1–3: 16/0 ✔ |
| T-230-4 B | `insert.run(…)` entfällt | **41/1, Code 1**, §1 grün, rot erst §2 | §1–3: 15/1 ✔ |
| T-230-5 | `nameKey('Alpha')` im `ux_tag_name`-Block | **149/0, Code 0**, alle vier Zeilen grün | §1: 61/0 ✔ |
| T-230-6 M2 | Maßnahme aus + `umask 0o077` | **16/1, Code 1**, §1 3× grün, §3 grün | §1–3: 10/1 ✔ |

Zusatzbefund bei der Nachstellung von M2: **auch Abschnitt 4 bleibt vollständig grün** (sechs
Zeilen), nicht nur 1 und 3. 30.4 nennt ihn nicht, weil er dort portbedingt nicht lief. Das
verschiebt den Befund nicht, es vergrößert ihn: Mit enger `umask` messen **drei** von vier
Abschnitten den Zustand statt der Wirkung.

### Jede Gegenprobe gegen den **gebauten** Stand — rot mit Code 1

Alle im Spiegel, alle an der **Platte** (nicht in einer Aufstellung), soweit der Prüfgegenstand
die Platte liest.

| Auflage | Gegenprobe | Ergebnis |
|---|---|---|
| A-A-61 | Web-Sammler verstümmelt | **54/2, Code 1** — „der Sammler hat mindestens 100 Dateien eingesammelt (**0**)" |
| A-A-61 | Add-in-Sammler verstümmelt | **54/2, Code 1** — dieselbe Meldung mit 25/0 |
| A-A-61 | Sammler **überspringt `api/`**, sammelt sonst alles | **55/1, Code 1** — „mindestens 100 (114)" grün, „`api/client.ts` … darunter" **rot**. Das ist der zweite Satz der Auflage: eine Zahl allein ließe einen Sammler durch, der irgendetwas sammelt. |
| A-A-61 | dieselbe Kunstquelle in **acht** Endungen | `.ts .tsx .js .jsx .mts .cts .mjs .cjs` → je **55/1, Code 1** mit Dateiname und Zeile. Vorher: fünf von sieben unsichtbar. |
| A-A-62 | `client.request(…)` über den Namensraum | **55/1, Code 1** — nennt `app/Zweitweg.tsx:4` |
| A-A-62 | benannte Einfuhr | **55/1, Code 1** — bleibt rot wie bisher |
| A-A-62 | `client['request'](…)` | **55/1, Code 1** |
| A-A-62 | `const senden = client.request;` | **55/1, Code 1** |
| A-A-62 | harmlose Datei auf der Platte: Prosa, `timer.requestStop()`, `window.requestAnimationFrame`, `'x-request-id'`, `RequestOptions` | **56/0, Code 0** — kein falscher Alarm |
| A-A-63 | Leser sieht keine Zeile | **40/3, Code 1** — rot in **Abschnitt 1** |
| A-A-63 | Vorlagen gelangen nicht in den Bestand | **39/4, Code 1** — rot in **Abschnitt 1** zuerst, mit dem richtigen Grund |
| A-A-63 | `LIMIT 29` — eine Zeile fehlt | **40/3, Code 1** — „(29 gelesen)" |
| A-A-64 | Kunstquelle aus 30.3 | **150/1, Code 1** — „`… index 'ux_tag_name_key'` → **ux_tag_name_key**, erwartet war **ux_tag_name**" |
| A-A-64 | Spaltenform trifft den falschen Index (`ux_todo_status_position` kollidiert am Namen) | **150/1, Code 1** — „`todo_status.name` → **ux_todo_status_name**, erwartet war **ux_todo_status_position**" |
| A-A-64 | Zuordner als **Teilzeichenkettensuche** gebaut | **149/2, Code 1** — die dritte Zuordnerprobe wird rot: „ux_tag_name statt ux_tag_name_key" |
| A-A-64 | Spaltenliste künstlich mehrdeutig gemacht | **124/9, Code 1** — die Eindeutigkeitszeile wird rot |
| A-A-65 | `process.umask(0o077)` statt `0o000` | **17/1, Code 1** — „gemessen: **0077**" |
| A-A-65 | M1: Maßnahme aus, weite `umask` | **13/5, Code 1** — Abschnitt 0 grün (die Vorbedingung stimmt), die Zähne der Abschnitte belegt |
| A-A-65 | M2: Maßnahme aus, enge `umask` | **16/2, Code 1** — Abschnitt 0 **rot** und sagt warum; vorher blieben drei falsche grüne Zeilen unerklärt |

Nachweise: `pnpm typecheck` **0**, `pnpm test` **77 Dateien, 1464 grün**, `pnpm run boundaries`
grün („Notiz-Trennung: alle Schichten unverletzt").

---

## Was gebaut wurde, Auflage für Auflage

### A-A-62 (zuerst) — `apps/local-api/scripts/request-scan.mjs`

Dieselbe Bauart wie `fetch-scan.mjs`, und aus demselben Grund: **nicht** „alles außer", sondern
die bekannten Nicht-Aufrufe namentlich (`NON_CALLER_FORMS`, heute `options.request` als
Portaufruf), danach jedes verbliebene `request` als **Wort** (`REQUEST_WORD =
/(?<![\w$-])request\b/`). Der Bindestrich in der Rückschau hält `x-request-id` draußen; ein Punkt
steht **nicht** darin, und genau das ist der Unterschied zum Ausdruck, den diese Datei ersetzt.
Kommentare werden vorher entfernt (`stripComments` aus `fetch-scan.mjs`, geteilt statt
abgeschrieben).

**Wort statt Aufruf, mit Absicht.** `client['request'](…)` und `const senden = client.request;`
sind derselbe Zugriff und tragen keine Klammer hinter dem Namen. Wer nach `request\s*[<(]` sucht,
mißt die Schreibweise und nicht den Zugriff. `requestStop`, `requestAnimationFrame`,
`RequestOptions` und `onRequest` fallen an der **Wortgrenze** heraus, nicht an einer Liste, die
jemand vergessen könnte.

Der alte Ausdruck steht als `BLIND_REQUEST_CALL` weiter da — **nur noch als Meßgegenstand**, wie
`BLIND_FETCH_CALL`. Eine Zeile im Lauf mißt, daß er vier der fünf Schreibweisen nicht sieht. Setzt
ihn jemand zurück, sagt diese Zeile warum.

### A-A-61 — die Ernte vor der Zusage

`proveHarvest(wer, dateien, mindestens, mussEnthalten)` steht in Abschnitt 1 und 7, **vor** der
Zusage, und macht zwei Aussagen: eine **Untergrenze** (Oberfläche 100, Add-in 25) und die
**benannte Datei** (`api/client.ts`, für die Oberfläche zusätzlich `api/endpoints.ts`). Die
Untergrenze liegt bewußt weit unter dem heutigen Stand (117 und 31) — sie ist kein Zensus,
sondern soll rot werden, wenn ein Verzeichnis umbenannt oder ein Werkzeug getauscht wurde, nicht
wenn jemand eine Ansicht löscht. Die Endungen stehen als `BUNDLED_EXTENSIONS` ausgeschrieben:
`.ts .tsx .js .jsx .mts .cts .mjs .cjs`, `.d.ts` ausgenommen.

### A-A-63 — dreißig Namen über dreißig Zeilen

Eine eigene Zeile vor dem Urteil (`rows.length === NAMES.length`) **und** dieselbe Bedingung in
den beiden Zusicherungen darunter. Die Auflage ließ die Wahl; ich habe beides genommen, weil eine
Zusicherung, die „für alle 30 Namen" sagt, über 29 Zeilen ebenso wenig gelten darf wie über null.

### A-A-64 — nicht „eine" Verletzung, sondern **die benannte**

`provoke` prüft jetzt `translated !== null && actual === indexName`, und die Meldung nennt beide
Indexnamen. `actual` kommt aus einem Zuordner, der die **zwei** Gestalten von SQLite
auseinanderhält: `index 'NAME'` bei Ausdruck oder `WHERE`, `tabelle.spalte, …` bei nackten
Spalten. Die zweite Gestalt wird über `pragma_index_info` (mit **gebundenem** Namen, kein SQL aus
Zeichenketten) auf den Index zurückgeführt.

Der Zuordner hat selbst eine gemessene Vorbedingung (keine zwei eindeutigen Indizes mit derselben
Spaltenliste — heute 7 von 14 nennen Spalten) und vier Proben, darunter die aus T-230-5.

### A-A-65 — der Lauf mißt seine eigene `umask`

Neuer Abschnitt 0, eine Zeile, **vor** Abschnitt 1: `process.umask() === 0o000`, mit dem
gemessenen Wert in der Meldung. Der Kopf der Datei ist berichtigt: Getrennt gemessen ist das
`chmod` in **Abschnitt 2** — dem einzigen, der die **Wirkung** mißt (vorher `0644`, nachher
`0600`) statt des Zustands.

---

## Annahmen

1. **Die Untergrenzen 100 und 25** habe ich gewählt (heute 117 und 31). Die Auflage verlangt „eine
   benannte Mindestzahl", nennt keine. Rund 15 % Luft nach unten: groß genug, daß ein Ausfall des
   Sammlers auffällt, klein genug, daß gewöhnliches Löschen von Ansichten den Lauf nicht rot macht.
2. **Word statt Call** für die `request`-Regel (siehe oben). Die Auflage nennt „Namensraum,
   `globalThis.`, `window.`, `self.` und eine Zerlegung" — die Wortregel deckt alle fünf ab und
   zusätzlich den Namen als Zeichenkette.
3. **`options.request` als einziger Nicht-Aufruf.** Am Baum gibt es die Form heute nicht; sie steht
   in der Liste, weil A-A-62 einen Portaufruf ausdrücklich als Nicht-Alarm nennt, und die
   Umkehrprobe mißt sie.
4. **A-A-63 doppelt eingelöst** (eigene Zeile *und* Bedingung), obwohl die Auflage „oder" sagt.
5. **Volle Läufe statt Schnitte.** Der Port war frei; ich habe nicht abgeschnitten, sondern alles
   gefahren. Die Teilschnittzahlen oben sind gerechnet, nicht gemessen.

---

## Risiken

1. **Die Wortregel für `request` ist strenger als die alte** und kann in Zukunft auf eine Zeile
   anspringen, die harmlos ist — etwa ein Objektschlüssel `request:` in einer Ansicht. Das ist
   gewollt: Der richtige Weg wäre dann, die **Datei** in `WEB_REQUEST_HOME` einzutragen oder die
   **Form** in `NON_CALLER_FORMS`, und dabei zu merken, daß man es tut. Heute ist die Zahl der
   Falschalarme im ganzen Baum **null** (gemessen).
2. **Zwölf Selbstproben in `proof:callers` speisen weiterhin die Aufstellung und nicht die
   Platte.** Das ist der Befund T-230-1, und er ist nicht *behoben*, sondern **benannt und
   ergänzt**: Der Kommentar über den Proben sagt jetzt ausdrücklich, welchen Weg sie auslassen
   (die Ernte) und wer ihn geht (`proveHarvest`, vier Zeilen weiter oben). Die Auslassung
   plattenweise zu schließen hieße, daß ein Prüflauf in `apps/web/**` schreibt — fremde Hoheit
   und eine schlechtere Bauart. Meine eigenen Gegenproben oben sind dagegen **an der Platte**
   gefahren.
3. **`pragma_index_info` ist eine SQLite-Eigenheit.** Fällt der Speicheradapter eines Tages um,
   fällt dieser Zuordner mit — er wird dann rot und nicht still. `proof:conflicts` mißt ohnehin
   SQLite-Meldungen; das Risiko ist nicht neu, es ist jetzt nur sichtbarer.
4. **Kein Sicherheitsbefund am Produktivcode.** Alle fünf Auflagen sitzen in Prüfpfaden. Der
   offene Weg aus T-230-2 war ein **möglicher** zweiter Weg, kein bestehender: Am Baum ruft heute
   keine Ansicht `client.request`. Gemessen und grün.

---

## Offene Fragen an den Orchestrator

1. **A-A-64 nennt als Behebung wörtlich `raw.includes(indexName)` — das ist für genau den
   gemessenen Fall falsch.** `ux_tag_name` ist eine Teilzeichenkette von `ux_tag_name_key`; eine
   Teilzeichenkettensuche ordnet die Meldung `index 'ux_tag_name_key'` dem Block `ux_tag_name` zu
   und läßt ihn **grün**. Ich habe das gemessen: Baue ich den Zuordner so, wird die dritte
   Zuordnerprobe rot („ux_tag_name statt ux_tag_name_key"), der gemeldete Fall aber bliebe
   unentdeckt. Gebaut ist deshalb ein **ganzer** Namensvergleich in beiden Gestalten. Bitte von
   security-checker bestätigen lassen, daß das die Auflage einlöst und nicht überschreitet — es
   sind zwei Zeilen mehr als „eine Bedingung mehr in einer Zeile, die es gibt".
2. **T-230-6 ist größer als beschrieben.** Mit enger `umask` und ausgeschalteter Maßnahme bleibt
   auch **Abschnitt 4** vollständig grün, nicht nur 1 und 3. Gehört das in 30.4 nachgetragen?
3. **Kein Zwilling im Add-in — gemessen, nicht angenommen.** Die Frage lag nahe, ob `proof:callers`
   Abschnitt 7 dieselbe Lücke für `call(` hat. Sie hat sie nicht: `call` ist in
   `apps/outlook-addin/src/api/client.ts` eine **lokale** Funktion innerhalb von
   `createApiClient`, nirgends ausgeführt exportiert, und außerhalb dieser Datei kommt `call(`
   nicht vor. Die Bildschirme bekommen ein `ApiClient`-Objekt, keinen Modulexport. Deshalb keine
   zweite Regel — aber der Satz gehört jemandem gesagt, damit ihn niemand für ein Vergessen hält.
4. **`request-scan.mjs` braucht keine Registrierung** (reiner ES-Modul-Import, kein
   `package.json`-Eintrag). Nur zur Kenntnis.
5. **Die drei Vorhersagen aus 30.6** (V-1 bis V-3) habe ich **nicht** angefaßt — security-checker
   fährt sie in einer portfreien Welle selbst nach. Der Port war in dieser Welle frei; wenn das
   vorgezogen werden soll, ist es eine eigene Aufgabe.

---

## Nächster Schritt

Vorschlag: security-checker fährt die vier Läufe und **mindestens** die vier Gegenproben zu
A-A-61 (Sammler leer / Sammler überspringt `api/`) und A-A-64 (Kunstquelle aus 30.3 / Zuordner als
Teilzeichenkettensuche) eigenständig nach und entscheidet Frage 1. Danach — in derselben oder der
nächsten portfreien Welle — die drei Vorhersagen V-1 bis V-3 aus 30.6, weil sie als benannte
Erwartungen mit ihrer Verstümmelung schon dastehen und nur noch gefahren werden müssen.
